import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PORTS, portById } from "../src/data/ports";
import { shipById } from "../src/data/ships";
import { destination, distance } from "../src/geo/math";
import { routeFromPosition } from "../src/geo/routes";
import { worldFromGeoJSON } from "../src/geo/world";
import { createVessel } from "../src/sim/engine";
import { planFuelItinerary, planFuelItineraryAsync, type ItineraryPlan } from "../src/sim/itinerary";
import { estimateAffordableRoute, estimateRouteFuel } from "../src/sim/routeEstimate";
import { createWeather } from "../src/sim/weather";
import { DOCKING_RADIUS_METERS } from "../src/sim/navigationConstants";
import type { ShipId, VesselState } from "../src/types";

const world = worldFromGeoJSON(JSON.parse(readFileSync(
  new URL("../public/data/land.geojson", import.meta.url), "utf8",
)));
const departure = portById("marseille")!;
const weather = createWeather("calm", 4821);

function verifyLegs(plan: ItineraryPlan, shipId: ShipId, firstState = createVessel(shipId, departure)): void {
  expect(plan.status).not.toBe("unreachable");
  expect(plan.legs.length).toBeGreaterThan(0);
  expect(plan.legs.at(-1)!.arrivalPortId).toBe(plan.destinationId);
  const capacity = shipById(shipId).fuelCapacity;
  let distanceM = 0, fuel = 0, seconds = 0;
  for (const [index, leg] of plan.legs.entries()) {
    expect(leg.estimate.status).toBe("sufficient");
    expect(leg.estimate.requiredFuelLitres).toBeLessThanOrEqual(capacity);
    expect(leg.estimate.reserveLitres).toBe(leg.estimate.estimatedFuelLitres * 0.25);
    expect(portById(leg.arrivalPortId)).toBeDefined();
    expect(distance(leg.route.points.at(-1)!, portById(leg.arrivalPortId)!)).toBeLessThan(0.01);
    if (index) {
      expect(leg.departurePortId).toBe(plan.legs[index - 1].arrivalPortId);
      expect(leg.refuelBefore).toBe(true);
      expect(leg.estimate.availableFuelLitres).toBe(capacity);
    }
    const start: VesselState = { ...firstState, ...(index ? portById(leg.departurePortId!)! : {}), ...leg.route.points[0],
      fuel: index || leg.refuelBefore ? capacity : firstState.fuel, docked: null };
    const independentlyEstimated = estimateRouteFuel(start, leg.route, weather);
    expect(independentlyEstimated.status).toBe("sufficient");
    expect(independentlyEstimated.requiredFuelLitres).toBeLessThanOrEqual(start.fuel);
    expect(leg.estimate.requiredFuelLitres).toBeCloseTo(independentlyEstimated.requiredFuelLitres, 7);
    for (let i = 1; i < leg.route.points.length; i++)
      expect(world.sweep(leg.route.points[i - 1], leg.route.points[i], 90).hit).toBe(false);
    distanceM += leg.estimate.distanceM;
    fuel += leg.estimate.estimatedFuelLitres;
    seconds += leg.estimate.durationSeconds;
  }
  expect(plan.totalDistanceM).toBe(distanceM);
  expect(plan.totalFuelLitres).toBe(fuel);
  expect(plan.totalDurationSeconds).toBe(seconds);
}

describe("mandatory fuel-stop itineraries", () => {
  it("uses a direct affordable passage and never adds unnecessary stops", () => {
    const state = createVessel("yacht", departure);
    const before = structuredClone({ state, weather });
    const plan = planFuelItinerary(world, state, "barcelona", weather);
    expect(plan.status).toBe("feasible");
    expect(plan.legs).toHaveLength(1);
    expect(plan.legs[0].refuelBefore).toBe(false);
    expect(plan.legs[0].estimate.availableFuelLitres).toBe(state.fuel);
    expect({ state, weather }).toEqual(before);
    verifyLegs(plan, state.shipId);
    expect(planFuelItinerary(world, state, "barcelona", weather)).toBe(plan);
  }, 15000);

  it.each([0, 20, 85])("requires explicit departure refuelling with %s%% of the real passage budget", (percentage) => {
    const state = createVessel("yacht", departure);
    const passage = routeFromPosition(world, state, "cassis")!;
    state.fuel = estimateRouteFuel(state, passage, weather).requiredFuelLitres * percentage / 100;
    state.docked = percentage === 0 ? departure.id : null;
    const before = structuredClone(state);
    const plan = planFuelItinerary(world, state, "cassis", weather);
    expect(plan.status).toBe("needs-refuel");
    expect(plan.legs).toHaveLength(1);
    expect(plan.legs[0].refuelBefore).toBe(true);
    expect(plan.legs[0].departurePortId).toBe(departure.id);
    expect(state).toEqual(before);
    verifyLegs(plan, state.shipId);
  });

  it("never invents fuel or a refuelling port for an empty boat offshore, including stale dock metadata", () => {
    const route = routeFromPosition(world, departure, "barcelona")!;
    const point = route.points.find((point) => PORTS.every((port) => distance(point, port) > 10_000))!;
    const state = createVessel("yacht", point);
    state.fuel = 0;
    state.docked = departure.id;
    const before = structuredClone(state);
    const plan = planFuelItinerary(world, state, "new-york", weather);
    expect(plan.status).toBe("unreachable");
    expect(plan.legs).toHaveLength(0);
    expect(plan.reason).toContain("mar abierto");
    expect(state).toEqual(before);
  });

  it("uses the shared 1 km service radius and never grants a refill beyond it", () => {
    const near = createVessel("yacht", destination(departure, -Math.PI / 2, DOCKING_RADIUS_METERS - 1));
    near.fuel = 0;
    expect(planFuelItinerary(world, near, "cassis", weather).status).toBe("needs-refuel");
    expect(planFuelItinerary(world, near, departure.id, weather).legs).toEqual([]);
    const far = createVessel("yacht", destination(departure, -Math.PI / 2, DOCKING_RADIUS_METERS + 1));
    far.fuel = 0;
    far.docked = departure.id;
    expect(planFuelItinerary(world, far, "cassis", weather).status).toBe("unreachable");
  });

  it("offers the same nearby dock service even when the straight line to its buoy crosses the quay", () => {
    const state = createVessel("yacht", destination(departure, Math.PI / 2, 420));
    state.fuel = 0;
    expect(world.isLand(state)).toBe(false);
    expect(world.sweep(state, state, 10).hit).toBe(false);
    expect(distance(state, departure)).toBeLessThan(DOCKING_RADIUS_METERS);
    expect(world.sweep(state, departure, 90)).toMatchObject({ hit: true, kind: "dock" });
    const before = structuredClone(state);
    const plan = planFuelItinerary(world, state, "cassis", weather);
    expect(plan.status).toBe("needs-refuel");
    expect(plan.legs[0]).toMatchObject({ departurePortId: "marseille", refuelBefore: true });
    expect(plan.legs[0].route.points[0]).toEqual({ lat: state.lat, lon: state.lon });
    verifyLegs(plan, state.shipId, state);
    expect(planFuelItinerary(world, state, "marseille", weather)).toMatchObject({ status: "feasible", legs: [] });
    expect(state).toEqual(before);
  });

  it("adds a reachable Palma refill when the actual offshore fuel cannot cover Barcelona", () => {
    // Explicit clear-water position southwest of Mallorca, independent of how
    // many graph samples a future route happens to contain.
    const point = { lat: 39.370278, lon: 2.354744 };
    expect(world.sweep(point, point, 90).hit).toBe(false);
    const state = createVessel("yacht", point);
    const toService = routeFromPosition(world, state, "palma")!;
    // Set the budget from the real service passage so this remains meaningful
    // when the shared physical consumption model is recalibrated.
    state.fuel = estimateRouteFuel(state, toService, weather).requiredFuelLitres * 1.1;
    const direct = routeFromPosition(world, state, "barcelona")!;
    expect(estimateRouteFuel(state, direct, weather).status).toBe("insufficient");
    expect(PORTS.every(port => distance(port, state) > DOCKING_RADIUS_METERS)).toBe(true);
    const before = structuredClone(state), plan = planFuelItinerary(world, state, "barcelona", weather);
    expect(plan.status).toBe("feasible");
    expect(plan.legs.map(leg => leg.arrivalPortId)).toEqual(["palma", "barcelona"]);
    expect(plan.legs[0].refuelBefore).toBe(false);
    expect(plan.legs[0].estimate.availableFuelLitres).toBe(state.fuel);
    expect(plan.legs[1].refuelBefore).toBe(true);
    expect(plan.legs[1].estimate.availableFuelLitres).toBe(shipById(state.shipId).fuelCapacity);
    verifyLegs(plan, state.shipId, state);
    expect(state).toEqual(before);
  });

  it("does not reuse an itinerary after its departure heading or forecast context changes", () => {
    const state = createVessel("yacht", departure), baseline = planFuelItinerary(world, state, "cassis", weather);
    const contexts = [
      { state: { ...state, heading: Math.PI }, weather },
      { state: { ...state, simTime: 16_000 }, weather },
      { state, weather: { ...weather, sea: "storm" as const } },
      { state, weather: { ...weather, seed: weather.seed + 1 } },
    ];
    for (const context of contexts) {
      const plan = planFuelItinerary(world, context.state, "cassis", context.weather);
      expect(plan).not.toBe(baseline);
      expect(plan.status).toBe("feasible");
      expect(plan.legs[0].estimate).toEqual(estimateRouteFuel(context.state, plan.legs[0].route, context.weather));
    }
  });

  it.each(["fishing", "cargo"] as const)("plans an affordable Atlantic crossing for %s", (id) => {
    const state = createVessel(id, departure);
    const before = structuredClone(state);
    const plan = planFuelItinerary(world, state, "new-york", weather);
    expect(plan.status).toBe("feasible");
    verifyLegs(plan, id);
    expect(plan.totalDistanceM).toBeGreaterThan(6_000_000);
    if (id !== "cargo") expect(plan.legs.length).toBeGreaterThan(1);
    expect(state).toEqual(before);
  }, 20000);

  it.each(["launch", "yacht", "speedboat", "spirit"] as const)("plans a small-boat Atlantic crossing for %s with affordable refill stages", (id) => {
    // Touring calibration and the northern island ports now make the crossing
    // possible without weakening the full-power budget or 25% reserve.
    const state = createVessel(id, departure);
    const before = structuredClone(state);
    const plan = planFuelItinerary(world, state, "new-york", weather);
    expect(plan.status).toBe("feasible");
    expect(plan.legs.length).toBeGreaterThan(1);
    expect(plan.totalDistanceM).toBeGreaterThan(6_000_000);
    verifyLegs(plan, id, state);
    expect(state).toEqual(before);
  }, 20000);

  it("rejects unknown destinations and recognizes arrival without a zero-length travel leg", () => {
    const state = createVessel("yacht", departure);
    expect(planFuelItinerary(world, state, "missing-port", weather).status).toBe("unreachable");
    const arrived = planFuelItinerary(world, state, departure.id, weather);
    expect(arrived.status).toBe("feasible");
    expect(arrived.legs).toEqual([]);
    expect(arrived.totalFuelLitres).toBe(0);
  });

  it("early fuel rejection exactly agrees with the complete estimator at the reserve boundary", () => {
    for (const id of ["yacht", "spirit", "cargo"] as const) {
      const state = createVessel(id, departure);
      const route = routeFromPosition(world, departure, "barcelona")!;
      const estimate = estimateRouteFuel(state, route, weather);
      state.fuel = estimate.requiredFuelLitres;
      expect(estimateAffordableRoute(state, structuredClone(route), weather)).toEqual(
        estimateRouteFuel(state, route, weather),
      );
      state.fuel = estimate.requiredFuelLitres - 0.0001;
      expect(estimateAffordableRoute(state, structuredClone(route), weather)).toBeNull();
      state.fuel = 0;
      expect(estimateAffordableRoute(state, structuredClone(route), weather)).toBeNull();
    }
  });

  it("returns the same plan asynchronously and snapshots mutable inputs before yielding", async () => {
    const state = createVessel("spirit", departure);
    const conditions = { ...weather, windSpeed: 0.314159 };
    const pending = planFuelItineraryAsync(world, state, "new-york", conditions);
    state.fuel = 0;
    state.lon = -40;
    conditions.windSpeed = 40;
    const plan = await pending;
    const original = createVessel("spirit", departure);
    expect(plan).toEqual(planFuelItinerary(world, original, "new-york", {
      ...weather, windSpeed: 0.314159,
    }));
  }, 20000);
});
