import { PORTS, portById } from "../data/ports";
import { distance } from "../geo/math";
import type { CollisionWorld, ShipId } from "../types";
import { canPlaceVessel, createVessel, motion, type Simulation } from "./engine";
import { DOCKING_RADIUS_METERS } from "./navigationConstants";

export interface VesselChangeAvailability {
  allowed: boolean;
  portId?: string;
  reason: string;
  needsDocking: boolean;
}

/** Cheap enough for the fleet menu: actual hull clearance is checked on commit. */
export function vesselChangeAvailability(sim: Simulation, _world?: CollisionWorld): VesselChangeAvailability {
  const state = sim.state;
  const port = state.docked
    ? portById(state.docked)
    : PORTS.reduce((nearest, candidate) => distance(candidate, state) < distance(nearest, state) ? candidate : nearest, PORTS[0]);
  const needsDocking = !state.docked;
  if (!port || distance(port, state) > DOCKING_RADIUS_METERS)
    return { allowed: false, needsDocking, reason: "Acércate a menos de 1 km de una boya de puerto para cambiar de barco." };
  // A moored boat is stationary relative to its berth, even in a current.
  if (!state.docked && motion(state, sim.weather).sog >= .85)
    return { allowed: false, portId: port.id, needsDocking, reason: "Reduce la velocidad sobre el fondo a menos de 1,6 nudos para atracar y cambiar de barco." };
  return { allowed: true, portId: port.id, needsDocking,
    reason: needsDocking ? `Puedes atracar y cambiar de barco en ${port.name}.` : `Cambio de barco disponible en ${port.name}.` };
}

/** Dock service changes the hull in place. It never teleports or drops the trip. */
export function changeVesselAtPort(
  sim: Simulation,
  shipId: ShipId,
  load: number,
  world: CollisionWorld,
): { changed: boolean; reason?: string } {
  const available = vesselChangeAvailability(sim);
  if (!available.allowed || !available.portId) return { changed: false, reason: available.reason };
  if (!Number.isFinite(load)) return { changed: false, reason: "Selecciona una carga de salida válida." };
  const previous = sim.state;
  const next = createVessel(shipId, previous, previous.heading, load);
  // Retain the exact heading as well as coordinates, without even an angle
  // normalization change when replacing an already valid physical state.
  next.heading = previous.heading;
  next.simTime = previous.simTime;
  next.distance = previous.distance;
  if (!canPlaceVessel(next, world))
    return { changed: false, reason: "El casco elegido no cabe en esta posición. Busca un atraque más despejado dentro del puerto." };
  next.docked = available.portId;
  sim.state = next;
  if (sim.voyage) {
    sim.voyage.autopilot = false;
    if (sim.voyage.route.to === available.portId) sim.voyage.completed = true;
    if (sim.voyage.itinerary?.refuelPortId === available.portId)
      sim.voyage.itinerary.refuelPortId = null;
  }
  return { changed: true };
}
