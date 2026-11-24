import { destination, distance } from "../geo/math";
import type { CollisionWorld, Route, ShipConfig, VesselState, Voyage } from "../types";
import { DOCKING_RADIUS_METERS } from "./navigationConstants";

const choices = new WeakMap<Voyage, { route: Route; side: number; origin: { lat: number; lon: number }; radius: number }>();

/** When a new voyage begins almost facing the berth, a shortest-angle U-turn
 * can put the bow into the quay. Choose the other physical turn only when its
 * candidate arc with full-hull clearance is clear and the short arc is blocked.
 * This is a departure aid, not a guarantee of arbitrary harbour manoeuvres. The pilot still
 * uses ordinary throttle/rudder forces; no heading or position is assigned. */
export function harborDepartureError(
  error: number,
  state: VesselState,
  ship: ShipConfig,
  voyage: Voyage,
  world?: CollisionWorld,
): number {
  if (!world) return error;
  let choice = choices.get(voyage);
  // Replanning preserves the voyage/itinerary but replaces its active route.
  // A decision for the previous departure cannot steer the new route.
  if (!choice || choice.route !== voyage.route) {
    const radius = Math.max(ship.length * 3.8, ship.cruiseKnots * 0.514444 * 10);
    choice = { route: voyage.route, side: 0, origin: { lat: state.lat, lon: state.lon }, radius };
    choices.set(voyage, choice);
    if (Math.abs(error) < Math.PI * 0.6 || Math.abs(state.u) > 1 ||
        distance(state, voyage.route.points[0]) > DOCKING_RADIUS_METERS)
      return error;
    const clearArc = (side: number) => {
      const totalAngle = side === Math.sign(error) ? Math.abs(error) : Math.PI * 2 - Math.abs(error);
      const count = Math.ceil(totalAngle / (Math.PI / 16));
      let previous = { lat: state.lat, lon: state.lon };
      for (let index = 1; index <= count; index++) {
        const turn = side * totalAngle * index / count;
        const east = radius * side * (Math.cos(state.heading) - Math.cos(state.heading + turn));
        const north = radius * side * (Math.sin(state.heading + turn) - Math.sin(state.heading));
        const next = destination(state, Math.atan2(east, north), Math.hypot(east, north));
        if (world.sweep(previous, next, Math.hypot(ship.length, ship.beam) / 2 + 4).hit)
          return false;
        previous = next;
      }
      return true;
    };
    const shortSide = Math.sign(error);
    if (!clearArc(shortSide) && clearArc(-shortSide)) choice.side = -shortSide;
  }
  if (!choice.side) return error;
  if (Math.abs(error) < Math.PI * 0.5 || distance(state, choice.origin) > choice.radius * 4) {
    choice.side = 0;
    return error;
  }
  return Math.sign(error) === choice.side ? error : error + choice.side * Math.PI * 2;
}
