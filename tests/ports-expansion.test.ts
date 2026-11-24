import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PORTS, portById } from "../src/data/ports";
import { shipById } from "../src/data/ships";
import { distance } from "../src/geo/math";
import { buildRoute, routeFromPosition } from "../src/geo/routes";
import { worldFromGeoJSON } from "../src/geo/world";
import { canPlaceVessel, createVessel, motion, Simulation } from "../src/sim/engine";
import { createWeather } from "../src/sim/weather";
import type { ShipId } from "../src/types";

const geography = JSON.parse(readFileSync(new URL("../public/data/land.geojson", import.meta.url), "utf8"));
const world = worldFromGeoJSON(geography);
const landOnly = worldFromGeoJSON(geography, []);
const additions = ["la-ciotat", "bandol", "hyeres", "nice", "monaco", "genoa", "ajaccio", "palma", "valencia", "cartagena", "malaga", "gibraltar"];

// The same generic berth offset and complete hull collision model are used in game.
describe("expanded Mediterranean port network", () => {
  it.each(additions)("%s has a clear cargo berth and a quay entirely offshore", (id) => {
    const port = portById(id)!;
    expect(port).toBeDefined();
    expect(world.sweep(port, port, 100).hit).toBe(false);
    expect(canPlaceVessel(createVessel("cargo", port, port.heading), world)).toBe(true);
    const dock = world.docks.find((entry) => entry.portId === id)!;
    const ring = world.dockPolygon(dock);
    for (let i = 0; i < ring.length; i++) {
      expect(landOnly.isLand(ring[i])).toBe(false);
      expect(landOnly.sweep(ring[i], ring[(i + 1) % ring.length], 0).hit).toBe(false);
    }
  });

  it("connects every added port to the existing network in both directions", () => {
    expect(new Set(PORTS.map((port) => port.id)).size).toBe(PORTS.length);
    for (const id of additions) {
      const outward = buildRoute(world, "marseille", id);
      const home = buildRoute(world, id, "marseille");
      expect(outward, id).not.toBeNull();
      expect(home, id).not.toBeNull();
      expect(outward!.distance).toBeGreaterThanOrEqual(outward!.directDistance - 0.01);
      expect(home!.distance).toBeCloseTo(outward!.distance, 3);
    }
  }, 15_000);

  it.each([
    ["cassis", "la-ciotat"], ["la-ciotat", "bandol"], ["toulon", "hyeres"],
    ["hyeres", "nice"], ["nice", "monaco"], ["monaco", "genoa"],
    ["nice", "ajaccio"], ["palma", "valencia"], ["valencia", "cartagena"],
    ["cartagena", "malaga"], ["malaga", "gibraltar"],
  ])("%s → %s retains a 90 m land/dock margin on every sampled leg", (from, to) => {
    const route = buildRoute(world, from, to)!;
    expect(route).not.toBeNull();
    for (let i = 1; i < route.points.length; i++) {
      expect(world.sweep(route.points[i - 1], route.points[i], 90).hit, `leg ${i}`).toBe(false);
    }
    // A voyage can also be planned directly from its berth rather than only by graph ID.
    expect(routeFromPosition(world, portById(from)!, to)).not.toBeNull();
  });

  it.each([
    ["cassis", "la-ciotat", 12_000, 20_000],
    ["la-ciotat", "bandol", 14_000, 25_000],
    ["toulon", "hyeres", 28_000, 45_000],
    ["nice", "monaco", 18_000, 30_000],
    ["monaco", "genoa", 130_000, 185_000],
  ] as const)("%s → %s has a geographically plausible coastal distance", (from, to, min, max) => {
    const route = buildRoute(world, from, to)!;
    expect(route.distance).toBeGreaterThan(min);
    expect(route.distance).toBeLessThan(max);
  });

  it("shortens the Marseille–Cassis approach while preserving continuous hull clearance", () => {
    const route = buildRoute(world, "marseille", "cassis")!;
    expect(route.distance).toBeCloseTo(27_326.52934182414, 3);
    expect(route.distance).toBeGreaterThanOrEqual(route.directDistance);
    expect(route.distance).toBeLessThanOrEqual(30_418.93628171943);
    for (let index = 1; index < route.points.length; index++)
      expect(world.sweep(route.points[index - 1], route.points[index], 90).hit).toBe(false);
    const reverse = buildRoute(world, "cassis", "marseille")!;
    const fromPosition = routeFromPosition(world, portById("marseille")!, "cassis")!;
    expect(reverse.distance).toBeCloseTo(route.distance, 3);
    expect(fromPosition.distance).toBeCloseTo(route.distance, 3);
    expect(fromPosition.points[0]).toEqual({ lat: portById("marseille")!.lat, lon: portById("marseille")!.lon });
  });
});

describe("physical pilot on newly added short voyages", () => {
  it.each([
    ["launch", "la-ciotat", "bandol"],
    ["yacht", "nice", "monaco"],
    ["cargo", "toulon", "hyeres"],
  ] as [ShipId, string, string][])("%s completes %s → %s without collision or teleportation", (shipId, from, to) => {
    const departure = portById(from)!, arrival = portById(to)!;
    const route = buildRoute(world, from, to)!;
    const boat = createVessel(shipId, departure, departure.heading);
    const sim = new Simulation(boat, createWeather("calm", 4821), world);
    sim.voyage = { route, waypoint: 1, completed: false, autopilot: true };
    let collisions = 0;
    sim.onCollision = () => collisions++;
    while (boat.simTime < 7_000 && !sim.voyage.completed && !collisions) sim.advance(2);
    expect(collisions).toBe(0);
    expect(sim.voyage.completed).toBe(true);
    expect(distance(boat, arrival)).toBeLessThan(Math.max(35, shipById(shipId).length * 0.8));
    expect(motion(boat, sim.weather).sog).toBeLessThan(0.85);
    expect(boat.distance).toBeGreaterThan(route.directDistance * 0.98);
    expect(boat.simTime).toBeGreaterThan(route.directDistance / 20);
    expect(boat.fuel).toBeGreaterThan(shipById(shipId).fuelCapacity * 0.5);
  }, 15_000);
});
