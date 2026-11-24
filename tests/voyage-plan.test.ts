import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { portById } from "../src/data/ports";
import { shipById } from "../src/data/ships";
import { distance } from "../src/geo/math";
import { buildRoute } from "../src/geo/routes";
import { worldFromGeoJSON } from "../src/geo/world";
import { parseSave, type SaveGame } from "../src/persistence/save";
import { createVessel, Simulation } from "../src/sim/engine";
import type { ItineraryPlan } from "../src/sim/itinerary";
import { estimateRouteFuel } from "../src/sim/routeEstimate";
import { hasNextStop, installItinerary, prepareNextLeg } from "../src/sim/voyagePlan";
import { createWeather } from "../src/sim/weather";

const world = worldFromGeoJSON(JSON.parse(readFileSync(
  new URL("../public/data/land.geojson", import.meta.url), "utf8",
)));
const departure = portById("marseille")!;
const weather = createWeather("calm", 4821);
const capacity = shipById("yacht").fuelCapacity;

function simulation() {
  return new Simulation(createVessel("yacht", departure, departure.heading), { ...weather }, world);
}

/** Short, real coastal corridors isolate itinerary installation and hand-off
 * from the separate global fuel-stop search tested in itinerary.test.ts. */
function makePlan(stops = ["cassis", "la-ciotat"]): ItineraryPlan {
  let from = departure.id;
  const legs = stops.map((arrivalPortId, index) => {
    const route = buildRoute(world, from, arrivalPortId);
    if (!route) throw new Error(`Missing real coastal test corridor ${from} → ${arrivalPortId}`);
    const estimate = estimateRouteFuel(createVessel("yacht", portById(from)!), route, weather);
    const leg = { route, estimate, departurePortId: from, arrivalPortId, refuelBefore: index > 0 };
    from = arrivalPortId;
    return leg;
  });
  return {
    status: "feasible", legs, destinationId: stops.at(-1)!, reason: "Coastal service-stop fixture",
    totalDistanceM: legs.reduce((sum, leg) => sum + leg.estimate.distanceM, 0),
    totalFuelLitres: legs.reduce((sum, leg) => sum + leg.estimate.estimatedFuelLitres, 0),
    totalDurationSeconds: legs.reduce((sum, leg) => sum + leg.estimate.durationSeconds, 0),
  };
}
const twoLegPlan = makePlan();
const threeLegPlan = makePlan(["cassis", "la-ciotat", "marseille"]);

function dockAt(sim: Simulation, portId: string) {
  const port = portById(portId)!;
  Object.assign(sim.state, { lat: port.lat, lon: port.lon, docked: portId, u: 0, v: 0, engine: 0 });
  sim.state.controls = { throttle: 0, rudder: 0, gear: 0 };
}
function readyAtFirstStop(plan = twoLegPlan) {
  const sim = simulation();
  installItinerary(sim, structuredClone(plan));
  dockAt(sim, "cassis");
  sim.state.fuel = capacity;
  sim.voyage!.completed = true;
  sim.voyage!.autopilot = true;
  return sim;
}

describe("installing and handing off a voyage itinerary", () => {
  it("installs verified routes without replacing or modifying the vessel", () => {
    const sim = simulation(), state = sim.state;
    Object.assign(state, { fuel: capacity * 0.6, u: 2.1, v: 0.2, damage: 0.03, distance: 350 });
    state.controls = { throttle: 0.4, rudder: 0.1, gear: 1 };
    const before = structuredClone(state);
    expect(installItinerary(sim, structuredClone(twoLegPlan))).toBe(true);
    expect(sim.state).toBe(state);
    expect(sim.state).toEqual(before);
    expect(sim.voyage).toMatchObject({ waypoint: 1, autopilot: false, completed: false,
      itinerary: { destinationId: "la-ciotat", stopIds: ["cassis", "la-ciotat"], legIndex: 0, refuelPortId: null } });
    expect(sim.voyage!.route).toEqual(twoLegPlan.legs[0].route);
    expect(hasNextStop(sim.voyage)).toBe(true);
    for (const leg of twoLegPlan.legs) {
      expect(leg.estimate.status).toBe("sufficient");
      for (let i = 1; i < leg.route.points.length; i++)
        expect(world.sweep(leg.route.points[i - 1], leg.route.points[i], 90).hit).toBe(false);
    }
  });

  it("records a needs-refuel departure without inventing fuel or undocking", () => {
    const sim = simulation();
    dockAt(sim, departure.id);
    sim.state.fuel = 0;
    const before = structuredClone(sim.state), plan = structuredClone(twoLegPlan);
    plan.status = "needs-refuel";
    plan.legs[0].refuelBefore = true;
    expect(installItinerary(sim, plan)).toBe(true);
    expect(sim.state).toEqual(before);
    expect(sim.voyage!.autopilot).toBe(false);
    expect(sim.voyage!.itinerary!.refuelPortId).toBe(departure.id);
    expect(prepareNextLeg(sim, world).advanced).toBe(false);
    expect(sim.state.fuel).toBe(0);
    // Real service can clear the departure requirement, but does not skip Cassis.
    sim.state.fuel = capacity;
    expect(prepareNextLeg(sim, world).advanced).toBe(false);
    expect(sim.voyage!.itinerary).toMatchObject({ legIndex: 0, refuelPortId: null });
    expect(sim.voyage!.route.to).toBe("cassis");
    expect(sim.state.docked).toBe(departure.id);
  });

  it.each(["unreachable", "empty"] as const)("does not replace an existing voyage with an %s plan", (kind) => {
    const sim = simulation();
    installItinerary(sim, structuredClone(twoLegPlan));
    const before = structuredClone({ state: sim.state, voyage: sim.voyage });
    const invalid = structuredClone(twoLegPlan);
    if (kind === "unreachable") invalid.status = "unreachable";
    else invalid.legs = [];
    expect(installItinerary(sim, invalid)).toBe(false);
    expect({ state: sim.state, voyage: sim.voyage }).toEqual(before);
  });

  it.each(["not-docked", "partly-refuelled", "wrong-port"] as const)("refuses to advance when %s", (condition) => {
    const sim = readyAtFirstStop();
    if (condition === "not-docked") sim.state.docked = null;
    if (condition === "partly-refuelled") sim.state.fuel = capacity - 1;
    if (condition === "wrong-port") dockAt(sim, departure.id);
    const before = structuredClone({ state: sim.state, voyage: sim.voyage });
    expect(prepareNextLeg(sim, world).advanced).toBe(false);
    expect({ state: sim.state, voyage: sim.voyage }).toEqual(before);
  });

  it("advances exactly one leg after real docking and a full tank, leaving the vessel stopped", () => {
    const sim = readyAtFirstStop(threeLegPlan), state = sim.state;
    const before = structuredClone(state);
    expect(prepareNextLeg(sim, world)).toEqual({ advanced: true });
    expect(sim.state).toBe(state);
    expect(sim.state).toEqual(before);
    expect(sim.voyage).toMatchObject({ waypoint: 1, autopilot: false, completed: false,
      itinerary: { destinationId: "marseille", stopIds: ["cassis", "la-ciotat", "marseille"], legIndex: 1, refuelPortId: null } });
    expect(sim.voyage!.route.to).toBe("la-ciotat");
    expect(distance(sim.voyage!.route.points[0], sim.state)).toBeLessThan(0.01);
    expect(distance(sim.voyage!.route.points.at(-1)!, portById("la-ciotat")!)).toBeLessThan(0.01);
    expect(hasNextStop(sim.voyage)).toBe(true);
    const nextVoyage = structuredClone(sim.voyage);
    // A repeated service action at Cassis cannot jump onward to Marseille.
    expect(prepareNextLeg(sim, world).advanced).toBe(false);
    expect(sim.voyage).toEqual(nextVoyage);
  });

  it("does not invent another leg at the final destination", () => {
    const sim = readyAtFirstStop();
    expect(prepareNextLeg(sim, world).advanced).toBe(true);
    dockAt(sim, "la-ciotat");
    sim.voyage!.completed = true;
    const before = structuredClone({ state: sim.state, voyage: sim.voyage });
    expect(hasNextStop(sim.voyage)).toBe(false);
    expect(prepareNextLeg(sim, world).advanced).toBe(false);
    expect({ state: sim.state, voyage: sim.voyage }).toEqual(before);
  });
});

function savedVoyage(marineLife = true): SaveGame {
  return {
    version: 1, savedAt: "2026-09-26T20:00:00Z", state: createVessel("yacht", portById("cassis")!),
    sea: "rough", seed: 4821, routeTarget: "la-ciotat", autopilot: false,
    itinerary: { destinationId: "la-ciotat", stopIds: ["cassis", "la-ciotat"], legIndex: 1, refuelPortId: null },
    environmentTime: 421.25, dayStartHour: 22.75, dayLengthSeconds: 1800, marineLife,
    mission: null, quality: "high", camera: "follow", tutorialComplete: true,
  };
}

describe("saved itinerary and environmental preferences", () => {
  it.each([true, false])("round trips the itinerary, clock and marine-life preference %s", (enabled) => {
    const save = savedVoyage(enabled);
    expect(parseSave(JSON.stringify(save))).toEqual(save);
  });

  const invalidTrips: Array<[string, Record<string, unknown>]> = [
    ["non-string destination", { destinationId: 4 }],
    ["empty stops", { stopIds: [] }],
    ["non-string stop", { stopIds: [3, "la-ciotat"] }],
    ["excessive stops", { stopIds: Array(257).fill("la-ciotat") }],
    ["negative stage", { legIndex: -1 }],
    ["fractional stage", { legIndex: 0.5 }],
    ["stage after arrival", { legIndex: 2 }],
    ["final stop mismatch", { destinationId: "marseille" }],
    ["active target mismatch", { legIndex: 0 }],
    ["invalid service marker", { refuelPortId: {} }],
  ];
  it.each(invalidTrips)("rejects %s", (_description, override) => {
    const save = savedVoyage();
    expect(parseSave(JSON.stringify({ ...save, itinerary: { ...save.itinerary, ...override } }))).toBeNull();
  });

  it.each([
    ["environmentTime", -1], ["environmentTime", null],
    ["dayStartHour", -0.1], ["dayStartHour", 24.1],
    ["dayLengthSeconds", 0], ["dayLengthSeconds", 721],
    ["marineLife", "false"], ["marineLife", 1],
  ])("rejects invalid environmental preference %s=%s", (key, value) => {
    expect(parseSave(JSON.stringify({ ...savedVoyage(), [key as string]: value }))).toBeNull();
  });

  it("continues accepting older saves that lack the optional itinerary and clock fields", () => {
    const { itinerary: _trip, environmentTime: _elapsed, dayStartHour: _hour,
      dayLengthSeconds: _length, marineLife: _life, ...legacy } = savedVoyage();
    expect(parseSave(JSON.stringify(legacy))).toEqual(legacy);
  });
});
