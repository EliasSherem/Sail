import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { portById } from "../src/data/ports";
import { shipById } from "../src/data/ships";
import { distance } from "../src/geo/math";
import { worldFromGeoJSON } from "../src/geo/world";
import { createVessel } from "../src/sim/engine";
import { planFuelItinerary } from "../src/sim/itinerary";
import { estimateRouteFuel } from "../src/sim/routeEstimate";
import { createWeather } from "../src/sim/weather";
import type { ShipId } from "../src/types";

const world = worldFromGeoJSON(JSON.parse(readFileSync(
  new URL("../public/data/land.geojson", import.meta.url), "utf8",
)));
const weather = createWeather("calm", 4821);

// Previously impossible regional voyages must find real service ports. Keep the
// real ship tanks, physical fuel model and 25% additional passage reserve intact.
describe("coastal service chains fill actual refuelling gaps", () => {
  it.each<[ShipId, string, string]>([
    ["spirit", "marseille", "haifa"],
    ["speedboat", "marseille", "haifa"],
    ["yacht", "cancun", "veracruz"],
    ["spirit", "acapulco", "los-cabos"],
    ["spirit", "los-cabos", "san-diego"],
    ["launch", "livorno", "civitavecchia"],
  ])("plans %s from %s to %s with affordable service legs", (shipId, from, to) => {
    const departure = portById(from)!;
    const state = createVessel(shipId, departure, departure.heading);
    const before = structuredClone(state);
    const plan = planFuelItinerary(world, state, to, weather);
    expect(plan.status, plan.reason).toBe("feasible");
    expect(plan.legs.length).toBeGreaterThan(from === "livorno" ? 0 : 1);
    expect(plan.legs.at(-1)!.arrivalPortId).toBe(to);
    expect(state).toEqual(before);
    const capacity = shipById(shipId).fuelCapacity;
    for (const [index, leg] of plan.legs.entries()) {
      const arrival = portById(leg.arrivalPortId)!;
      expect(arrival).toBeDefined();
      expect(distance(leg.route.points.at(-1)!, arrival)).toBeLessThan(.01);
      expect(leg.estimate.requiredFuelLitres).toBeLessThanOrEqual(capacity);
      expect(leg.estimate.reserveLitres).toBe(leg.estimate.estimatedFuelLitres * .25);
      if (index) {
        expect(leg.refuelBefore).toBe(true);
        expect(leg.departurePortId).toBe(plan.legs[index - 1].arrivalPortId);
      }
      const probe = { ...state, ...leg.route.points[0], fuel: capacity, docked: null };
      expect(estimateRouteFuel(probe, leg.route, weather).status).toBe("sufficient");
      for (let i = 1; i < leg.route.points.length; i++)
        expect(world.sweep(leg.route.points[i - 1], leg.route.points[i], 90).hit).toBe(false);
    }
  }, 30_000);
});
