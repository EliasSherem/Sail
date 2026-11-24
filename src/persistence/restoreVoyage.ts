import type { World } from "../geo/world";
import { routeFromPosition } from "../geo/routes";
import type { Simulation } from "../sim/engine";
import { toggleVoyageAutopilotAsync, type PilotResult } from "../sim/routeNavigation";
import type { SaveGame } from "./save";

type SavedNavigation = Pick<SaveGame, "routeTarget" | "routeCompleted" | "autopilot" | "itinerary">;

/** Restore navigation on a newly constructed, unpublished simulation. Await
 * this before showing/resuming it: saved autopilot=true is a request to validate,
 * never permission to bypass current fuel, refuelling or arrival guards.
 * Physical state belongs to the caller's restored vessel and is not replaced. */
export async function restoreSavedVoyage(sim: Simulation, world: World, saved: SavedNavigation): Promise<PilotResult> {
  sim.voyage = null;
  const stopped = (reason?: string): PilotResult => {
    // An old pilot command must not keep driving as manual throttle after the
    // restored pilot was rejected. Existing momentum and actual fuel survive.
    if (saved.autopilot) sim.state.controls = { throttle: 0, rudder: 0, gear: 0 };
    return { active: false, ...(reason ? { reason } : {}) };
  };
  if (!saved.routeTarget) return stopped();
  try {
    const route = routeFromPosition(world, sim.state, saved.routeTarget);
    if (!route) return stopped("No se encontró una ruta navegable desde la posición guardada. El piloto sigue desactivado.");
    sim.voyage = { route, waypoint: 1, autopilot: false,
      completed: saved.routeCompleted ?? sim.state.docked === saved.routeTarget,
      itinerary: saved.itinerary ? structuredClone(saved.itinerary) : undefined };
    if (!saved.autopilot) return { active: false };
    const result = await toggleVoyageAutopilotAsync(sim, world);
    return result.active ? result : stopped(result.reason);
  } catch {
    // A failed asynchronous route search cannot leave a legacy pilot or its
    // accelerator engaged. The existing route remains available for review.
    if (sim.voyage) sim.voyage.autopilot = false;
    return stopped("No se pudo verificar el combustible y las escalas de la partida guardada. Activa el piloto para intentarlo de nuevo.");
  }
}
