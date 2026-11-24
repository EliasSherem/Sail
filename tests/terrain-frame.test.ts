import { describe, expect, it } from "vitest";
import { Matrix4, Vector3 } from "three";
import { destination, fromLocal, toLocal } from "../src/geo/math";
import { terrainFrame } from "../src/render/terrainFrame";

describe("cached scenery geographic alignment", () => {
  it.each([0, 43.3, 70, 85])("preserves coast and nearby docks through repeated 2 km rebases at latitude %s", lat => {
    // A fixed cached vertex buffer is transported through four distinct camera
    // origins. Reference points use the full geographic inverse/forward projection,
    // rather than the helper's approximate transformation.
    const source = { lat, lon: 179.97 };
    let largestCoastError = 0, largestNearbyError = 0;
    for (const bearing of [0, Math.PI / 4, Math.PI / 2, Math.PI, 4]) {
      let origin = { ...source };
      for (let rebase = 0; rebase < 4; rebase++) {
        origin = destination(origin, bearing, 2000);
        const frame = terrainFrame(source, origin);
        const matrix = new Matrix4().makeRotationY(frame.rotationY);
        matrix.setPosition(frame.x, 0, frame.z);
        const errorAt = (x: number, z: number) => {
          const geo = fromLocal(x, z, source);
          const exact = toLocal(geo, origin);
          const rendered = new Vector3(x, 0, z).applyMatrix4(matrix);
          return Math.hypot(rendered.x - exact.x, rendered.z - exact.z);
        };
        for (let x = -18000; x <= 18000; x += 3000) {
          for (let z = -18000; z <= 18000; z += 3000) {
            largestCoastError = Math.max(largestCoastError, errorAt(x, z));
          }
        }
        // Dock and collision context within one kilometre of the vessel.
        for (const direction of [0, 1, 2, 3, 4, 5]) {
          const dock = destination(origin, direction, 1000);
          const cached = toLocal(dock, source);
          largestNearbyError = Math.max(largestNearbyError, errorAt(cached.x, cached.z));
        }
      }
    }
    expect(largestCoastError).toBeLessThan(.05);
    expect(largestNearbyError).toBeLessThan(.002);
  });
});
