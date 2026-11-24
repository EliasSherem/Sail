import { portById } from "../data/ports";
import { distance } from "../geo/math";
import type { Route, Voyage } from "../types";
import type { World } from "../geo/world";
import type { Simulation } from "./engine";
import { planFuelItinerary, type ItineraryPlan } from "./itinerary";
import { routeFromPosition } from "../geo/routes";
import { shipById } from "../data/ships";
import { estimateRouteFuel } from "./routeEstimate";

export const hasNextStop = (voyage: Voyage | null) => !!voyage?.itinerary && voyage.itinerary.legIndex + 1 < voyage.itinerary.stopIds.length;

export function itineraryOverview(plan: ItineraryPlan): Route | null {
  if (!plan.legs.length) return null;
  const first = plan.legs[0].route;
  const last = plan.legs.at(-1)!.route;
  return { ...first, id: `itinerary-${first.from}-${plan.destinationId}`, to: plan.destinationId,
    name: `${first.name.split("→")[0]}→ ${portById(plan.destinationId)?.name ?? plan.destinationId}`,
    points: plan.legs.flatMap((leg, i) => i ? leg.route.points.slice(1) : leg.route.points),
    distance: plan.totalDistanceM, directDistance: distance(first.points[0], last.points.at(-1)!),
    description: plan.legs.length > 1 ? `Viaje con ${plan.legs.length - 1} escalas de repostaje. Cada etapa conserva una reserva estimada del 25%.` : first.description };
}

/** Installing a plan changes navigation only, never hull, position or fuel. */
export function installItinerary(sim: Simulation, plan: ItineraryPlan): boolean {
  if (plan.status === "unreachable" || !plan.legs.length) return false;
  const first = plan.legs[0];
  sim.voyage = { route: first.route, waypoint: 1, autopilot: false, completed: false,
    itinerary: { destinationId: plan.destinationId, stopIds: plan.legs.map(l => l.arrivalPortId), legIndex: 0,
      refuelPortId: first.refuelBefore ? first.departurePortId ?? null : null } };
  return true;
}

/** Called only after actual dock service filled the tank. Every intermediate
 * arrival stays stopped until the player docks, refuels and releases moorings. */
export function prepareNextLeg(sim: Simulation, world: World): { advanced: boolean; reason?: string } {
  const v = sim.voyage, itinerary = v?.itinerary, ship = shipById(sim.state.shipId);
  if (!itinerary || !sim.state.docked || sim.state.fuel < ship.fuelCapacity - .01) return { advanced: false };
  if (itinerary.refuelPortId === sim.state.docked) itinerary.refuelPortId = null;
  if (!v || !hasNextStop(v) || v.route.to !== sim.state.docked) return { advanced: false };
  const nextIndex = itinerary.legIndex + 1, destination = itinerary.stopIds[nextIndex];
  let route = routeFromPosition(world, sim.state, destination);
  if (!route) return { advanced: false, reason: "No se pudo verificar la siguiente etapa desde este atraque. Recalcula la ruta." };
  const estimate = estimateRouteFuel(sim.state, route, sim.weather);
  if (estimate.status !== "sufficient") {
    const revised = planFuelItinerary(world, sim.state, destination, sim.weather);
    if (revised.status !== "feasible" || !revised.legs.length)
      return { advanced: false, reason: revised.reason || "No hay escalas alcanzables con reserva para continuar en estas condiciones." };
    itinerary.stopIds.splice(nextIndex, 1, ...revised.legs.map(leg => leg.arrivalPortId));
    route = revised.legs[0].route;
  }
  sim.voyage = { route, waypoint: 1, autopilot: false, completed: false,
    itinerary: { ...itinerary, legIndex: nextIndex, refuelPortId: null } };
  return { advanced: true };
}
