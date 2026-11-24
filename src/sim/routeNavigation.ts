import { distance } from "../geo/math";
import { routeFromPosition } from "../geo/routes";
import type { World } from "../geo/world";
import type { LatLon, Route, VesselState, Voyage } from "../types";
import type { Simulation } from "./engine";
import { manualWaypointIndex } from "./routeProgress";
import { estimateRouteFuel } from "./routeEstimate";
import { planFuelItinerary, planFuelItineraryAsync, type ItineraryPlan } from "./itinerary";
import { portById } from "../data/ports";

const attempts = new WeakMap<Voyage, { position: LatLon; realTime: number }>();

/** Replace navigation only. The current stop and all later fuel stops survive;
 * the vessel's position, heading, controls, fuel and physical state never change. */
export function replanActiveLeg(sim: Simulation, world: World): boolean {
  const voyage = sim.voyage;
  if (!voyage || voyage.completed) return false;
  attempts.set(voyage, { position: { lat: sim.state.lat, lon: sim.state.lon }, realTime: sim.realTime });
  const route = routeFromPosition(world, sim.state, voyage.route.to);
  if (!route) {
    voyage.routeUnavailable = true;
    voyage.autopilot = false;
    return false;
  }
  voyage.route = route;
  voyage.waypoint = 1;
  voyage.routeUnavailable = false;
  return true;
}

/** Manual travel keeps the chart useful before the pilot is enabled. The graph
 * is reused, but coastline sweeps run at most twice a second and after 50 m of
 * movement. Enabling the pilot always forces an exact, fresh calculation. */
export function refreshManualRoute(sim: Simulation, world: World): boolean {
  const voyage = sim.voyage;
  if (!voyage || voyage.autopilot || voyage.completed || sim.paused || sim.state.docked || voyage.itinerary?.refuelPortId) return false;
  const previous = attempts.get(voyage);
  const position = previous?.position ?? voyage.route.points[0];
  if (previous && sim.realTime - previous.realTime < .5) return false;
  if (position && distance(position, sim.state) < 50) return false;
  return replanActiveLeg(sim, world);
}

export interface PilotResult { active: boolean; reason?: string }

/** null means that a new fuel-stop search is needed before activation. */
function preparePilot(sim: Simulation, world: World): PilotResult | null {
  const voyage = sim.voyage;
  if (!voyage) return { active: false };
  if (voyage.autopilot) {
    voyage.autopilot = false;
    return { active: false };
  }
  if (sim.state.docked) return { active: false, reason: "Suelta amarras antes de activar el piloto." };
  if (voyage.itinerary?.refuelPortId) return { active: false, reason: "Reposta en el puerto de salida antes de iniciar esta etapa." };
  if (voyage.completed) return { active: false, reason: "Etapa terminada. Atraca y reposta para continuar." };
  if (!replanActiveLeg(sim, world)) return { active: false, reason: "No se encontró una ruta navegable desde tu posición. El piloto sigue desactivado." };
  if (estimateRouteFuel(sim.state, voyage.route, sim.weather).status !== "sufficient") return null;
  voyage.fuelWarning = undefined;
  voyage.autopilot = true;
  return { active: true };
}

function applyFuelStops(sim: Simulation, plan: ItineraryPlan): PilotResult {
  const voyage = sim.voyage!;
  if (plan.status === "unreachable" || !plan.legs.length) {
    voyage.fuelWarning = plan.reason || "No hay combustible suficiente para alcanzar una escala con reserva.";
    voyage.autopilot = false;
    return { active: false, reason: voyage.fuelWarning };
  }
  const stops = plan.legs.map(leg => leg.arrivalPortId), first = plan.legs[0];
  if (voyage.itinerary) {
    // Keep the final destination, sailed history and future stops. Insert any
    // newly necessary services before the current stop, never behind the boat.
    voyage.itinerary.stopIds.splice(voyage.itinerary.legIndex, 1, ...stops);
    voyage.itinerary.refuelPortId = first.refuelBefore ? first.departurePortId ?? null : null;
  } else {
    voyage.itinerary = { destinationId: plan.destinationId, stopIds: stops, legIndex: 0,
      refuelPortId: first.refuelBefore ? first.departurePortId ?? null : null };
  }
  voyage.route = first.route;
  voyage.waypoint = 1;
  voyage.routeUnavailable = false;
  voyage.autopilot = plan.status === "feasible";
  voyage.fuelWarning = voyage.autopilot ? undefined : plan.reason;
  return { active: voyage.autopilot, reason: voyage.autopilot
    ? `Escalas actualizadas según el combustible disponible. Próximo repostaje: ${portById(first.arrivalPortId)?.name ?? first.arrivalPortId}.`
    : plan.reason };
}

/** Shared semantics for batch checks and browser UI. Never activate an
 * unaffordable leg, including legacy saves and routes after manual detours. */
export function toggleVoyageAutopilot(sim: Simulation, world: World): PilotResult {
  const ready = preparePilot(sim, world);
  return ready ?? applyFuelStops(sim, planFuelItinerary(world, sim.state, sim.voyage!.route.to, sim.weather));
}

const pending = new WeakSet<Simulation>();
export function isPilotPlanning(sim: Simulation): boolean { return pending.has(sim); }

/** Large searches yield to rendering. Hold the physical clock while searching
 * so the actual starting position and fuel cannot drift behind the forecast. */
export async function toggleVoyageAutopilotAsync(sim: Simulation, world: World): Promise<PilotResult> {
  if (pending.has(sim)) return { active: false };
  const ready = preparePilot(sim, world);
  if (ready) return ready;
  const voyage = sim.voyage!, state = sim.state, before = JSON.stringify(state), weatherBefore = JSON.stringify(sim.weather), wasPaused = sim.paused;
  pending.add(sim);
  sim.paused = true;
  try {
    const plan = await planFuelItineraryAsync(world, state, voyage.route.to, sim.weather);
    if (sim.voyage !== voyage || sim.state !== state || JSON.stringify(state) !== before || JSON.stringify(sim.weather) !== weatherBefore)
      return { active: false, reason: "La embarcación cambió durante el cálculo. Activa el piloto para calcular de nuevo." };
    return applyFuelStops(sim, plan);
  } finally {
    pending.delete(sim);
    sim.paused = wasPaused;
  }
}

/** Conditions or damage can change after departure. Check the remaining
 * passage, excluding already sailed points; search for a service only if the
 * fuel margin has actually become insufficient. */
export async function monitorAutopilotFuel(sim: Simulation, world: World): Promise<PilotResult | null> {
  const voyage = sim.voyage;
  if (!voyage?.autopilot || voyage.completed || sim.paused || sim.state.docked || pending.has(sim)) return null;
  const remaining = activeLegMapRoute(sim.state, voyage);
  if (!remaining || estimateRouteFuel(sim.state, remaining, sim.weather).status === "sufficient") return null;
  voyage.autopilot = false;
  const result = await toggleVoyageAutopilotAsync(sim, world);
  if (!result.active && sim.voyage === voyage) {
    sim.paused = true;
    return { ...result, reason: `${result.reason ?? "No se pudo validar el combustible."} Navegación en pausa para revisar la ruta.` };
  }
  return result;
}

/** The chart shows the course still to sail, starting at the actual boat. It
 * does not retain the historical departure segment behind the player. */
export function activeLegMapRoute(state: VesselState, voyage: Voyage | null): Route | null {
  if (!voyage || voyage.completed || voyage.routeUnavailable || !voyage.route.points.length) return null;
  const index = voyage.autopilot
    ? Math.max(1, Math.min(voyage.route.points.length - 1, voyage.waypoint))
    : manualWaypointIndex(state, voyage);
  const points = [{ lat: state.lat, lon: state.lon }, ...voyage.route.points.slice(index)];
  const length = points.reduce((sum, point, i) => sum + (i ? distance(points[i - 1], point) : 0), 0);
  return { ...voyage.route, points, distance: length, directDistance: distance(points[0], points.at(-1)!) };
}
