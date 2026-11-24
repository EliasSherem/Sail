import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { portById } from "../src/data/ports";
import { shipById } from "../src/data/ships";
import { distance } from "../src/geo/math";
import { buildRoute } from "../src/geo/routes";
import { worldFromGeoJSON } from "../src/geo/world";
import { canPlaceVessel, createVessel } from "../src/sim/engine";
import { planFuelItinerary } from "../src/sim/itinerary";
import { estimateRouteFuel } from "../src/sim/routeEstimate";
import { createWeather } from "../src/sim/weather";
import type { Route } from "../src/types";

const geography = JSON.parse(readFileSync(new URL("../public/data/land.geojson", import.meta.url), "utf8"));
const additions = JSON.parse(readFileSync(new URL("../docs/drake-service-additions.json", import.meta.url), "utf8")) as {
  seeds: { id: string; lat: number; lon: number }[];
};
const world = worldFromGeoJSON(geography), land = worldFromGeoJSON(geography, []);
const weather = createWeather("calm", 4821);

function assertNavigable(route: Route | null, from: string, to: string): asserts route is Route {
  expect(route, `${from} → ${to}`).not.toBeNull();
  expect(distance(route!.points[0], portById(from)!)).toBeLessThan(.01);
  expect(distance(route!.points.at(-1)!, portById(to)!)).toBeLessThan(.01);
  expect(route!.distance).toBeGreaterThanOrEqual(route!.directDistance - .01);
  for (let i = 1; i < route!.points.length; i++)
    expect(world.sweep(route!.points[i - 1], route!.points[i], 90).hit,
      `${from} → ${to}, segment ${i}`).toBe(false);
}

describe("southern service ports and the Drake Passage", () => {
  it("places the new vessels and quays in water near their named locations", () => {
    expect(additions.seeds.length).toBeGreaterThanOrEqual(14);
    for (const seed of additions.seeds) {
      const port = portById(seed.id);
      expect(port, seed.id).toBeDefined();
      expect(distance(seed, port!), seed.id).toBeLessThanOrEqual(50_001);
      for (const shipId of ["fishing", "cargo"] as const)
        expect(canPlaceVessel(createVessel(shipId, port!, port!.heading), world), `${shipId} in ${seed.id}`).toBe(true);
      const quay = world.docks.find(d => d.portId === seed.id);
      expect(quay, seed.id).toBeDefined();
      const ring = world.dockPolygon(quay!);
      for (let i = 0; i < ring.length; i++)
        expect(land.sweep(ring[i], ring[(i + 1) % ring.length], 0).hit, seed.id).toBe(false);
    }
  });

  it("connects every new port both ways to Ushuaia and the existing oceans", () => {
    for (const id of [...additions.seeds.map(seed => seed.id), "valparaiso", "montevideo"]) {
      if (id === "ushuaia") continue;
      assertNavigable(buildRoute(world, "ushuaia", id), "ushuaia", id);
      assertNavigable(buildRoute(world, id, "ushuaia"), id, "ushuaia");
    }
  }, 30_000);

  it("crosses Drake to real Antarctic coastal services without inventing an ocean fuel stop", () => {
    const route = buildRoute(world, "cape-horn", "fildes-bay");
    assertNavigable(route, "cape-horn", "fildes-bay");
    expect(route.distance).toBeGreaterThan(800_000);
    expect(route.distance).toBeLessThan(1_150_000);
    expect(route.points.some(p => p.lat < -58 && p.lat > -60 && p.lon > -70 && p.lon < -50)).toBe(true);
    for (const id of ["fildes-bay", "deception-island", "port-lockroy"])
      expect(portById(id)!.lat).toBeLessThan(-60);
    expect(additions.seeds.filter(p => p.lat < -57 && p.lat > -61)).toEqual([]);
  });

  it.each(["fildes-bay", "port-lockroy"])("plans a pesquero passage to %s with the real tank and reserve", destination => {
    const departure = portById("ushuaia")!;
    const state = createVessel("fishing", departure, departure.heading, .35);
    const before = structuredClone(state);
    const plan = planFuelItinerary(world, state, destination, weather);
    expect(plan.status, plan.reason).toBe("feasible");
    expect(plan.legs.length).toBeGreaterThan(0);
    expect(plan.legs.at(-1)!.arrivalPortId).toBe(destination);
    expect(state).toEqual(before);
    for (const [i, leg] of plan.legs.entries()) {
      expect(leg.estimate.requiredFuelLitres).toBeLessThanOrEqual(shipById("fishing").fuelCapacity);
      expect(leg.estimate.reserveLitres).toBe(leg.estimate.estimatedFuelLitres * .25);
      if (i) {
        expect(leg.refuelBefore).toBe(true);
        expect(leg.departurePortId).toBe(plan.legs[i - 1].arrivalPortId);
      }
      const probe = { ...state, ...leg.route.points[0], fuel: shipById("fishing").fuelCapacity, docked: null };
      expect(estimateRouteFuel(probe, leg.route, weather).status).toBe("sufficient");
      for (let p = 1; p < leg.route.points.length; p++)
        expect(world.sweep(leg.route.points[p - 1], leg.route.points[p], 90).hit).toBe(false);
    }
  }, 30_000);

  it("rejects a small tank when the open Drake crossing exceeds its full-tank range", () => {
    const departure = portById("cape-horn")!;
    const state = createVessel("launch", departure, departure.heading);
    const route = buildRoute(world, departure.id, "fildes-bay")!;
    expect(estimateRouteFuel(state, route, weather).requiredFuelLitres).toBeGreaterThan(state.fuel);
    const before = structuredClone(state);
    const plan = planFuelItinerary(world, state, "fildes-bay", weather);
    expect(plan.status).toBe("unreachable");
    expect(plan.legs).toHaveLength(0);
    expect(state).toEqual(before);
  }, 30_000);
});
