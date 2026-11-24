import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CANALS } from "../src/data/canals";
import { PORTS } from "../src/data/ports";
import { bearing, destination, distance } from "../src/geo/math";
import { routeFromPosition } from "../src/geo/routes";
import { worldFromGeoJSON } from "../src/geo/world";

const world = worldFromGeoJSON(JSON.parse(readFileSync(
  new URL("../public/data/land.geojson", import.meta.url), "utf8",
)));
const scenarios = [
  {
    name: "open water toward Barcelona",
    start: { lat: 42.5, lon: 4.3 }, destinationId: "barcelona",
    previousPoint: { lat: 42.9, lon: 4.9 },
  },
  {
    name: "off the Calanques coast toward Cassis",
    start: { lat: 43.16, lon: 5.43 }, destinationId: "cassis",
    previousPoint: { lat: 43.18, lon: 5.37 },
  },
  {
    name: "around the coastal obstruction west of Cassis",
    start: { lat: 43.22, lon: 5.3 }, destinationId: "cassis",
    previousPoint: { lat: 43.278, lon: 5.327 },
  },
  ...CANALS.map(canal => {
    const index = canal.id === "suez" ? 8 : 6;
    const a = canal.centerline[index], b = canal.centerline[index + 1];
    const heading = bearing(a, b);
    const center = destination(a, heading, distance(a, b) * .65);
    return {
      name: `${canal.name}, 180 m off the centerline`,
      start: destination(center, heading + Math.PI / 2, 180),
      destinationId: canal.toPortId, previousPoint: a,
    };
  }),
];

describe("replanning from the vessel instead of returning to its old manual waypoint", () => {
  it.each(scenarios)("reconnects safely and makes new progress in $name", scenario => {
    const before = structuredClone(scenario.start);
    const route = routeFromPosition(world, scenario.start, scenario.destinationId);
    expect(route).not.toBeNull();
    expect(route!.from).toBe("current");
    expect(route!.to).toBe(scenario.destinationId);
    expect(distance(route!.points[0], scenario.start)).toBeLessThan(.001);
    expect(scenario.start).toEqual(before);
    const first = route!.points.find(point => distance(point, scenario.start) > 1)!;
    const target = PORTS.find(port => port.id === scenario.destinationId)!;
    const separation = Math.acos(Math.cos(
      bearing(scenario.start, first) - bearing(scenario.start, scenario.previousPoint),
    ));
    expect(separation).toBeGreaterThan(70 * Math.PI / 180);
    expect(distance(first, target)).toBeLessThan(distance(scenario.start, target) - 100);
    // No old index or departure anchor is carried into the newly planned leg.
    expect(route!.points.every(point => distance(point, scenario.previousPoint) > 180)).toBe(true);
    for (let index = 1; index < route!.points.length; index++)
      expect(world.sweep(route!.points[index - 1], route!.points[index], 90).hit).toBe(false);
  }, 15000);

  it("retains a necessary coastal bend instead of blindly pointing straight at the destination", () => {
    const scenario = scenarios[2], target = PORTS.find(port => port.id === "cassis")!;
    expect(world.sweep(scenario.start, target, 90).hit).toBe(true);
    const route = routeFromPosition(world, scenario.start, "cassis")!;
    expect(route.points.length).toBeGreaterThan(2);
    expect(route.distance).toBeGreaterThan(route.directDistance);
  });

  it("fails safely when the vessel is too close to a canal bank for the routing hull margin", () => {
    const canal = CANALS.find(c => c.id === "suez")!;
    const a = canal.centerline[4], b = canal.centerline[5], heading = bearing(a, b);
    const center = destination(a, heading, distance(a, b) / 2);
    const nearBank = destination(center, heading + Math.PI / 2, canal.widthM / 2 - 40);
    expect(world.isLand(nearBank)).toBe(false);
    expect(world.clearance(nearBank)).toBeLessThan(50);
    expect(routeFromPosition(world, nearBank, canal.toPortId)).toBeNull();
  });
});
