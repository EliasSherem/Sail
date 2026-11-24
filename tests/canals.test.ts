import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CANALS } from "../src/data/canals";
import { bearing, destination, distance } from "../src/geo/math";
import { sampleRoute } from "../src/geo/routes";
import { worldFromGeoJSON } from "../src/geo/world";
import { createVessel, Simulation, motion } from "../src/sim/engine";
import { TEST_WEATHER } from "../src/sim/benchmark";
import type { LatLon, Route } from "../src/types";

const world = worldFromGeoJSON(JSON.parse(readFileSync(
  new URL("../public/data/land.geojson", import.meta.url), "utf8",
)));

// Independent parity against the exact exterior rings used by terrain/map.
function displayedLand(point: LatLon): boolean {
  let inside = false;
  for (const ring of world.landPolygons)
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i], b = ring[j];
      if (a.lat > point.lat !== b.lat > point.lat &&
        point.lon < (b.lon - a.lon) * (point.lat - a.lat) / (b.lat - a.lat) + a.lon)
        inside = !inside;
    }
  return inside;
}

describe("shared physical Panama and Suez canals", () => {
  it.each(CANALS)("opens $name continuously for the full fleet radius in both directions", (canal) => {
    const points = sampleRoute(canal.centerline, 1750);
    for (const point of points) expect(world.isLand(point)).toBe(false);
    for (const point of canal.centerline) expect(displayedLand(point)).toBe(false);
    for (let index = 1; index < points.length; index++) {
      expect(world.sweep(points[index - 1], points[index], 90).hit).toBe(false);
      expect(world.sweep(points[index], points[index - 1], 90).hit).toBe(false);
    }
  });

  it.each(CANALS)("keeps $name banks visible and collidable instead of bypassing land tests", (canal) => {
    const a = canal.centerline[4], b = canal.centerline[5];
    const angle = bearing(a, b);
    const middle = destination(a, angle, distance(a, b) / 2);
    for (const side of [-1, 1]) {
      const outside = destination(middle, angle + side * Math.PI / 2, canal.widthM);
      expect(world.isLand(outside)).toBe(true);
      expect(displayedLand(outside)).toBe(true);
      expect(world.sweep(middle, outside, 15).hit).toBe(true);
    }
    expect(world.clearance(middle)).toBeGreaterThan(canal.widthM * 0.45);
    expect(world.clearance(middle)).toBeLessThan(canal.widthM * 0.55);
  });

  it("preserves unrelated land and cannot cut arbitrary straight passages across either isthmus", () => {
    for (const point of [
      { lat: 48.85, lon: 2.35 }, { lat: 30.6, lon: 33 },
      { lat: 9.05, lon: -79.3 },
    ]) expect(world.isLand(point)).toBe(true);
    expect(world.sweep({ lat: 31.3, lon: 32.8 }, { lat: 29.9, lon: 32.8 }, 90).hit).toBe(true);
    expect(world.sweep({ lat: 9.5, lon: -79.7 }, { lat: 8.8, lon: -79.7 }, 90).hit).toBe(true);
  });

  it.each(CANALS.flatMap((canal) => ["yacht", "cargo"].map((shipId) => ({ canal, shipId }))))(
    "$shipId physically follows $canal.name without teleporting through banks", ({ canal, shipId }) => {
      const points = sampleRoute(canal.centerline);
      const route: Route = {
        id: `canal-test-${canal.id}`, name: canal.name,
        from: canal.fromPortId, to: canal.toPortId, points,
        distance: points.reduce((sum, point, index) => sum + (index ? distance(points[index - 1], point) : 0), 0),
        directDistance: distance(points[0], points.at(-1)!), description: "Explicit channel fixture",
      };
      const state = createVessel(shipId as "yacht" | "cargo", points[0], bearing(points[0], points[1]));
      const sim = new Simulation(state, { ...TEST_WEATHER }, world);
      sim.evolvingWeather = false;
      sim.requestedScale = 100;
      sim.voyage = { route, waypoint: 1, autopilot: true, completed: false };
      let collisions = 0;
      sim.onCollision = () => collisions++;
      while (state.simTime < 40_000 && !sim.voyage.completed && !collisions && state.fuel > 0)
        sim.advance(1 / 30);
      expect(collisions).toBe(0);
      expect(sim.voyage.completed).toBe(true);
      expect(state.distance).toBeGreaterThan(route.distance * 0.9);
      expect(state.distance).toBeLessThan(route.distance * 1.1);
      expect(distance(state, points.at(-1)!)).toBeLessThan(200);
      expect(motion(state, sim.weather).sog).toBeLessThan(0.85);
    }, 20_000,
  );
});
