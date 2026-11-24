import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PORTS, portById } from "../src/data/ports";
import { PORT_LANDMARKS } from "../src/data/portScenery";
import { fromLocal } from "../src/geo/math";
import { buildRoute } from "../src/geo/routes";
import { worldFromGeoJSON } from "../src/geo/world";
import { canPlaceVessel, createVessel } from "../src/sim/engine";
import baseline from "./fixtures/coast-detail-baseline.json";

const data = JSON.parse(readFileSync(new URL("../public/data/land.geojson", import.meta.url), "utf8"));
const world = worldFromGeoJSON(data), land = worldFromGeoJSON(data, []);

describe("audited regional coastline refinement", () => {
  it("places the complete One WTC landmark base on its real Manhattan location", () => {
    const landmark = PORT_LANDMARKS.find(mark => mark.id === "one-world")!;
    // Same expanded base and nine safety samples as PortScenery: no shifting the landmark.
    const width = landmark.width * 1.1, depth = landmark.depth * 1.1;
    for (const x of [-.5, 0, .5])
      for (const z of [-.5, 0, .5])
        expect(world.isLand(fromLocal(x * width, z * depth, landmark))).toBe(true);
    expect(world.isLand({ lat: 1.2838, lon: 103.8609 })).toBe(true);
  });

  it.each(["new-york", "singapore", "eilat"])("retains the existing %s cargo berth and entire service quay", id => {
    const port = portById(id)!;
    expect(canPlaceVessel(createVessel("cargo", port, port.heading), world)).toBe(true);
    const ring = world.dockPolygon(world.docks.find(dock => dock.portId === id)!);
    for (let i = 0; i < ring.length; i++)
      expect(land.sweep(ring[i], ring[(i + 1) % ring.length], 0).hit).toBe(false);
  });

  it("preserves original port coordinates and safely shortens their approach routes", () => {
    // This is a captured pre-change baseline, not values generated from the new coastline.
    expect(baseline.length).toBe(105);
    const checkedSegments = new Set<string>();
    for (const before of baseline) {
      const port = PORTS.find(p => p.id === before.id)!;
      expect({ lat: port.lat, lon: port.lon, heading: port.heading }).toEqual({ lat: before.lat, lon: before.lon, heading: before.heading });
      if (before.id === "marseille") continue;
      const route = buildRoute(world, "marseille", before.id);
      expect(route, before.id).not.toBeNull();
      expect(route!.distance, before.id).toBeGreaterThanOrEqual(route!.directDistance - .01);
      expect(route!.distance, before.id).toBeLessThanOrEqual(before.routeFromMarseille! + .01);
      for (let index = 1; index < route!.points.length; index++) {
        const a = route!.points[index - 1], b = route!.points[index];
        const key = [a, b].map(point => `${point.lat},${point.lon}`).sort().join("/");
        if (checkedSegments.has(key)) continue;
        checkedSegments.add(key);
        expect(world.sweep(a, b, 90).hit, `${before.id}, segment ${index}`).toBe(false);
      }
    }
  }, 15_000);
});
