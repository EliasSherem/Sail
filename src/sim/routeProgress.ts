import { shipById } from "../data/ships";
import { bearing, distance, EARTH_RADIUS } from "../geo/math";
import type { LatLon, VesselState, Voyage } from "../types";

/** Signed progress/cross-track distance on the segment's great-circle arc.
 * Bearings and distances normalize longitude, including the antimeridian. */
function passedSegment(
  state: LatLon,
  from: LatLon,
  target: LatLon,
  corridorWidth: number,
): boolean {
  const segmentLength = distance(from, target);
  if (segmentLength < 0.01) return true;
  const angularDistance = distance(from, state) / EARTH_RADIUS;
  const direction = bearing(from, state) - bearing(from, target);
  const crossTrack = EARTH_RADIUS * Math.asin(Math.max(-1, Math.min(1,
    Math.sin(angularDistance) * Math.sin(direction),
  )));
  if (Math.abs(crossTrack) > corridorWidth) return false;
  const alongTrack = EARTH_RADIUS * Math.atan2(
    Math.sin(angularDistance) * Math.cos(direction), Math.cos(angularDistance),
  );
  return alongTrack >= segmentLength;
}

/** Only forward progress within the current leg. A nearby capture or a passed
 * segment within a bounded lateral corridor can retire an intermediate point;
 * a distant parallel course cannot jump ahead to a later leg or nearby crossing.
 * The final destination remains active until docking/completion elsewhere. */
export function manualWaypointIndex(state: VesselState, voyage: Voyage): number {
  const points = voyage.route.points;
  if (points.length < 2) return 0;
  const ship = shipById(state.shipId);
  const speed = Math.hypot(state.u, state.v);
  const capture = Math.max(35, Math.min(180, ship.length * 0.8 + speed * 1.5));
  const corridor = Math.max(70, Math.min(250, ship.length * 0.8 + speed * 2));
  // points[0] is the route's departure anchor, never a pending destination.
  let index = Math.max(1, Math.min(points.length - 1,
    Number.isFinite(voyage.waypoint) ? Math.floor(voyage.waypoint) : 1,
  ));
  while (index < points.length - 1) {
    if (distance(state, points[index]) > capture &&
        !passedSegment(state, points[index - 1], points[index], corridor)) break;
    index++;
  }
  return index;
}

/** Index bookkeeping only: never changes controls, physical state, itinerary
 * stage, completion or the active automatic pilot's waypoint policy. */
export function updateManualRouteProgress(state: VesselState, voyage: Voyage): void {
  if (voyage.autopilot || voyage.completed || !voyage.route.points.length) return;
  voyage.waypoint = manualWaypointIndex(state, voyage);
}
