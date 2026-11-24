import { PORTS, portById } from "../data/ports";
import { shipById } from "../data/ships";
import { distance } from "../geo/math";
import { buildRoute, routeFromPosition } from "../geo/routes";
import type { World } from "../geo/world";
import type { Port, Route, VesselState, Weather } from "../types";
import { DOCKING_RADIUS_METERS } from "./navigationConstants";
import {
  estimateAffordableRoute,
  affordableDistanceUpperBound,
  estimateRouteFuel,
  type RouteFuelEstimate,
} from "./routeEstimate";

export type ItineraryStatus = "feasible" | "needs-refuel" | "unreachable";
export interface ItineraryLeg {
  route: Route;
  estimate: RouteFuelEstimate;
  departurePortId?: string;
  arrivalPortId: string;
  /** Mandatory service stop before this leg. Fuel is hypothetical until the
   * player actually docks and refuels; planning never changes vessel state. */
  refuelBefore: boolean;
}
export interface ItineraryPlan {
  status: ItineraryStatus;
  legs: ItineraryLeg[];
  totalDistanceM: number;
  totalFuelLitres: number;
  totalDurationSeconds: number;
  destinationId: string;
  reason: string;
}

interface CachedWorld {
  routes: Map<string, Route | null>;
  plans: Map<string, ItineraryPlan>;
  ports: Port[];
}
const worlds = new WeakMap<World, CachedWorld>();
const START = "@current-vessel";

function worldCache(world: World): CachedWorld {
  let cache = worlds.get(world);
  if (!cache) {
    cache = {
      routes: new Map(),
      plans: new Map(),
      // Use the same clearance as validated harbour approaches. Unreachable or
      // landlocked services never become fictional offshore refuelling nodes.
      ports: PORTS.filter((port) => !world.sweep(port, port, 90).hit),
    };
    worlds.set(world, cache);
  }
  return cache;
}

function cachedRoute(
  world: World,
  cache: CachedWorld,
  from: VesselState | Port,
  destinationId: string,
  departurePortId?: string,
): Route | null {
  const key = `${departurePortId ?? `${from.lat},${from.lon}`}→${destinationId}`;
  if (cache.routes.has(key)) return cache.routes.get(key)!;
  const route = departurePortId
    ? buildRoute(world, departurePortId, destinationId)
    : routeFromPosition(world, from, destinationId);
  // Bound retained sampled geometry; itinerary searches remain correct after
  // eviction. The World identity naturally invalidates all geographic caches.
  if (cache.routes.size >= 512)
    cache.routes.delete(cache.routes.keys().next().value!);
  cache.routes.set(key, route);
  return route;
}

function result(
  destinationId: string,
  status: ItineraryStatus,
  legs: ItineraryLeg[],
  reason: string,
): ItineraryPlan {
  return {
    status,
    destinationId,
    legs,
    reason,
    totalDistanceM: legs.reduce((sum, leg) => sum + leg.estimate.distanceM, 0),
    totalFuelLitres: legs.reduce(
      (sum, leg) => sum + leg.estimate.estimatedFuelLitres,
      0,
    ),
    totalDurationSeconds: legs.reduce(
      (sum, leg) => sum + leg.estimate.durationSeconds,
      0,
    ),
  };
}

/** Plan mandatory refuelling stops using the shared conservative passage model
 * and 25% reserve. Forecast inputs are snapshotted; no real fuel/state changes.
 * A first-leg refill is allowed only within the actual docking radius of a
 * validated service port. Later legs always require docking and refuelling.
 */
function* itinerarySteps(
  world: World,
  state: VesselState,
  destinationId: string,
  weather: Weather,
): Generator<void, ItineraryPlan, void> {
  const cache = worldCache(world);
  const key = [
    destinationId, state.shipId, state.lat, state.lon, state.fuel,
    state.load, state.damage, state.heading, state.simTime, weather.sea, weather.seed,
    weather.windSpeed, weather.windDirection,
    weather.currentSpeed, weather.currentDirection,
  ].join("/");
  const previous = cache.plans.get(key);
  if (previous) return previous;
  const finish = portById(destinationId);
  const remember = (plan: ItineraryPlan) => {
    if (cache.plans.size >= 16)
      cache.plans.delete(cache.plans.keys().next().value!);
    cache.plans.set(key, plan);
    return plan;
  };
  const fail = (reason: string) =>
    remember(result(destinationId, "unreachable", [], reason));
  if (!finish || !cache.ports.some((port) => port.id === destinationId))
    return fail("El destino no tiene un acceso portuario navegable validado.");
  if (world.isLand(state))
    return fail("La posición actual no está en agua navegable.");

  const service = cache.ports
    // Dock service uses a proximity radius, not a straight sailing segment to
    // the buoy. A quay between a valid boat position and the buoy must not
    // remove a service the player can actually use without moving the boat.
    .filter((port) => distance(state, port) <= DOCKING_RADIUS_METERS)
    .sort((a, b) => distance(state, a) - distance(state, b))[0];
  if (service?.id === destinationId)
    return remember(result(destinationId, "feasible", [],
      "Ya estás en la zona de atraque del destino. Reduce la velocidad y atraca."));

  const direct = cachedRoute(world, cache, state, destinationId);
  const directEstimate = direct ? estimateAffordableRoute(state, direct, weather) : null;
  if (direct && directEstimate)
    return remember(result(destinationId, "feasible", [{
      route: direct, estimate: directEstimate, departurePortId: service?.id,
      arrivalPortId: destinationId, refuelBefore: false,
    }], "La ruta directa cabe en el combustible actual con la reserva recomendada."));

  const capacity = shipById(state.shipId).fuelCapacity;
  // At a service port the search may propose filling up before departure, but
  // the returned first leg explicitly requires that action if current fuel fails.
  const initial = { ...state, fuel: service ? capacity : state.fuel };
  const costs = new Map<string, number>([[START, 0]]);
  const points = new Map<string, VesselState | Port>([
    [START, state], ...cache.ports.map((port) => [port.id, port] as const),
  ]);
  const open = new Set([START]);
  const closed = new Set<string>();
  const parents = new Map<string, { from: string; leg: ItineraryLeg }>();
  let reachablePorts = 0;
  let navigablePorts = 0;
  let sliceStart = performance.now();
  while (open.size) {
    // A* lower bound uses direct geodesic distance. Actual graph costs are
    // checked corridor distances; estimates reject edges as soon as fuel fails.
    let current = "", best = Infinity;
    for (const id of open) {
      const score = costs.get(id)! + distance(points.get(id)!, finish);
      if (score < best) { current = id; best = score; }
    }
    if (current === destinationId) {
      const legs: ItineraryLeg[] = [];
      let step = destinationId;
      while (step !== START) {
        const parent = parents.get(step)!;
        legs.unshift(parent.leg);
        step = parent.from;
      }
      const first = legs[0];
      const actualFirst = estimateRouteFuel(state, first.route, weather);
      first.refuelBefore = actualFirst.status !== "sufficient";
      if (!first.refuelBefore) first.estimate = actualFirst;
      const status = first.refuelBefore ? "needs-refuel" : "feasible";
      const stops = Math.max(0, legs.length - 1);
      return remember(result(destinationId, status, legs,
        `${first.refuelBefore ? `Atraca y llena el depósito en ${service!.name} antes de salir. ` : ""}` +
        `${stops ? `${stops} escala${stops === 1 ? "" : "s"} obligatoria${stops === 1 ? "" : "s"}: atraca y reposta antes de continuar. ` : ""}` +
        "Cada tramo incluye una reserva del 25% del consumo previsto."));
    }
    open.delete(current);
    closed.add(current);
    const origin = points.get(current)!;
    const firstLeg = current === START;
    const probe: VesselState = firstLeg ? initial : {
      ...state, ...origin, fuel: capacity, docked: null,
    };
    const departurePortId = firstLeg ? undefined : current;
    const distanceLimit = affordableDistanceUpperBound(probe, weather);
    for (const target of cache.ports) {
      if (performance.now() - sliceStart > 8) {
        yield;
        sliceStart = performance.now();
      }
      if (closed.has(target.id) || target.id === service?.id) continue;
      const directDistance = distance(origin, target);
      if (directDistance > distanceLimit) continue;
      const lowerCost = costs.get(current)! + directDistance;
      if (lowerCost >= (costs.get(target.id) ?? Infinity)) continue;
      if (lowerCost + distance(target, finish) >=
          (costs.get(destinationId) ?? Infinity)) continue;
      const route = firstLeg && target.id === destinationId ? direct :
        cachedRoute(world, cache, origin, target.id, departurePortId);
      if (!route) continue;
      if (firstLeg) navigablePorts++;
      const candidate = costs.get(current)! + route.distance;
      if (candidate >= (costs.get(target.id) ?? Infinity)) continue;
      const estimate = estimateAffordableRoute(probe, route, weather);
      if (!estimate) continue;
      if (firstLeg) reachablePorts++;
      costs.set(target.id, candidate);
      parents.set(target.id, { from: current, leg: {
        route, estimate, departurePortId: firstLeg ? service?.id : current,
        arrivalPortId: target.id, refuelBefore: !firstLeg,
      } });
      open.add(target.id);
    }
  }
  return fail(!direct && navigablePorts === 0
    ? "No hay un corredor navegable validado desde esta posición a un puerto de servicio. Acércate a la red costera de navegación."
    : reachablePorts === 0 && !service
    ? "El combustible actual no permite alcanzar ninguna escala con la reserva recomendada. No hay repostaje en mar abierto."
    : "La red de puertos deja al menos un tramo que supera la autonomía con depósito lleno y reserva. Este barco no puede completar el viaje con las escalas disponibles.");
}

/** Synchronous counterpart for CPU checks and batch work. Browser UI should
 * await planFuelItineraryAsync so large port networks can yield between edges. */
export function planFuelItinerary(
  world: World,
  state: VesselState,
  destinationId: string,
  weather: Weather,
): ItineraryPlan {
  const steps = itinerarySteps(world, state, destinationId, weather);
  let step = steps.next();
  while (!step.done) step = steps.next();
  return step.value;
}

/** Cooperative browser planner. Snapshot inputs so a moving boat or weather
 * update during a yield cannot mix conditions within a single itinerary. */
export async function planFuelItineraryAsync(
  world: World,
  state: VesselState,
  destinationId: string,
  weather: Weather,
): Promise<ItineraryPlan> {
  const steps = itinerarySteps(
    world, { ...state, controls: { ...state.controls } }, destinationId,
    { ...weather },
  );
  let step = steps.next();
  while (!step.done) {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    step = steps.next();
  }
  return step.value;
}
