import type { LatLon } from "../types";
import { destination, toLocal } from "../geo/math";

/** Re-express cached scenery in a new local frame without accumulating translations.
 * The east basis corrects meridian convergence; the 8 km cache limit keeps the
 * remaining projection curvature below centimetres, and millimetres nearby. */
export function terrainFrame(source: LatLon, origin: LatLon) {
  const center = toLocal(source, origin);
  const east = toLocal(destination(source, Math.PI / 2, 100), origin);
  return {
    x: center.x,
    z: center.z,
    rotationY: -Math.atan2(east.z - center.z, east.x - center.x),
  };
}
