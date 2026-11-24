import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { portById } from "../src/data/ports";
import { distance } from "../src/geo/math";
import { buildRoute, routeFromPosition, sampleRoute } from "../src/geo/routes";
import { worldFromGeoJSON } from "../src/geo/world";
import { createVessel } from "../src/sim/engine";
import { planFuelItinerary } from "../src/sim/itinerary";
import { estimateRouteFuel } from "../src/sim/routeEstimate";
import { createWeather } from "../src/sim/weather";
import type { Route } from "../src/types";

const world = worldFromGeoJSON(JSON.parse(readFileSync(
  new URL("../public/data/land.geojson", import.meta.url), "utf8",
)));

describe("nearby harbour connections in the fuel-stop graph", () => {
  it.each([
    { from: "bandol", to: "la-ciotat", maxMeters: 15_000 },
    { from: "monaco", to: "nice", maxMeters: 20_000 },
    { from: "ashdod", to: "haifa", maxMeters: 130_000 },
  ])("uses the same safe local approaches from $from to $to in either direction", ({ from, to, maxMeters }) => {
    const route = buildRoute(world, from, to)!;
    const reverse = buildRoute(world, to, from)!;
    const resumed = routeFromPosition(world, portById(from)!, to)!;
    expect(route.distance).toBeLessThan(maxMeters);
    expect(reverse.distance).toBeCloseTo(route.distance, 5);
    expect(resumed.distance).toBeCloseTo(route.distance, 5);
    expect(distance(route.points[0], portById(from)!)).toBeLessThan(.001);
    expect(distance(route.points.at(-1)!, portById(to)!)).toBeLessThan(.001);
    for (let i = 1; i < route.points.length; i++) {
      expect(distance(route.points[i - 1], route.points[i])).toBeLessThanOrEqual(10_001);
      expect(world.sweep(route.points[i - 1], route.points[i], 90).hit).toBe(false);
    }
  }, 15_000);

  it("does not reject a nearby fuel stop because a fixed chain takes an unnecessary detour", () => {
    const from = portById("bandol")!, to = portById("la-ciotat")!;
    const route = buildRoute(world, from.id, to.id)!;
    const legacyPoints = sampleRoute([
      from, { lat: 43.08, lon: 5.73 }, { lat: 43.135, lon: 5.62 }, to,
    ]);
    const legacy: Route = {
      ...route, id: "explicit-original-bandol-chain", points: legacyPoints,
      distance: legacyPoints.reduce((sum, point, i) => sum + (i ? distance(legacyPoints[i - 1], point) : 0), 0),
    };
    const state = createVessel("launch", from, from.heading), weather = createWeather("calm", 4821);
    const current = estimateRouteFuel(state, route, weather);
    const original = estimateRouteFuel(state, legacy, weather);
    expect(current.requiredFuelLitres).toBeLessThan(original.requiredFuelLitres * .9);
    state.fuel = (current.requiredFuelLitres + original.requiredFuelLitres) / 2;
    expect(estimateRouteFuel(state, legacy, weather).status).not.toBe("sufficient");
    const plan = planFuelItinerary(world, state, to.id, weather);
    expect(plan.status).toBe("feasible");
    expect(plan.legs).toHaveLength(1);
    expect(plan.legs[0].refuelBefore).toBe(false);
    expect(plan.legs[0].estimate.requiredFuelLitres).toBeLessThan(state.fuel);
  });

  it("retains the broad Gibraltar passage instead of creating a narrow shortcut", () => {
    const route = buildRoute(world, "cadiz", "malaga")!;
    const crossings = route.points.slice(1).flatMap((point, i) => {
      const previous = route.points[i];
      return (previous.lon < -5.5) !== (point.lon < -5.5) ? [[previous, point]] : [];
    });
    expect(crossings).toHaveLength(1);
    for (const [a, b] of crossings)
      expect(world.sweep(a, b, 2000).hit).toBe(false);
  });
});
