import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { portById } from "../src/data/ports";
import { shipById } from "../src/data/ships";
import { destination, distance } from "../src/geo/math";
import * as routes from "../src/geo/routes";
import { World, worldFromGeoJSON } from "../src/geo/world";
import { createVessel, Simulation } from "../src/sim/engine";
import { activeLegMapRoute, refreshManualRoute, replanActiveLeg, toggleVoyageAutopilot } from "../src/sim/routeNavigation";
import { createWeather } from "../src/sim/weather";
import type { LatLon, Route, ShipId } from "../src/types";

const departure = portById("marseille")!;
const mockWorld = new World([], []);
const realWorld = worldFromGeoJSON(JSON.parse(readFileSync(new URL("../public/data/land.geojson", import.meta.url), "utf8")));
const route = (start: LatLon, target = "cassis"): Route => {
  const end = portById(target)!;
  return { id: `current-${target}`, from: "current", to: target, name: "Test active leg", description: "",
    points: [{ lat: start.lat, lon: start.lon }, { lat: end.lat, lon: end.lon }],
    distance: distance(start, end), directDistance: distance(start, end) };
};
function fixture(shipId: ShipId = "yacht", world = mockWorld) {
  const sim = new Simulation(createVessel(shipId, departure, departure.heading), createWeather("calm", 4821), world);
  Object.assign(sim.state, { fuel: 613.25, damage: .03, load: .62, u: 4.2, v: .21, yawRate: .012, engine: .57, distance: 932.4, simTime: 137 });
  sim.state.controls = { throttle: .61, rudder: -.23, gear: 1 };
  sim.realTime = 5;
  sim.voyage = { route: route(departure), waypoint: 1, completed: false, autopilot: false,
    itinerary: { destinationId: "la-ciotat", stopIds: ["marseille", "cassis", "la-ciotat"], legIndex: 1, refuelPortId: null } };
  return sim;
}
function preserve(sim: Simulation) {
  const state = sim.state, voyage = sim.voyage!, itinerary = voyage.itinerary;
  const stateValue = structuredClone(state), itineraryValue = structuredClone(itinerary);
  return () => {
    expect(sim.state).toBe(state);
    expect(sim.state).toEqual(stateValue);
    expect(sim.voyage).toBe(voyage);
    expect(sim.voyage!.itinerary).toBe(itinerary);
    expect(sim.voyage!.itinerary).toEqual(itineraryValue);
  };
}
const successSpy = () => vi.spyOn(routes, "routeFromPosition").mockImplementation((_world, start, target) => route(start, target));
const move = (sim: Simulation, start: LatLon, metres: number) => Object.assign(sim.state, destination(start, Math.PI * 1.25, metres));
afterEach(() => vi.restoreAllMocks());

describe("replanning and activating the current voyage leg", () => {
  it.each(["spirit", "cargo"] as const)("rejoins the real Cassis corridor from a manual detour with %s, preserving ship and itinerary", (shipId) => {
    const sim = fixture(shipId, realWorld), old = routes.buildRoute(realWorld, departure.id, "cassis")!;
    expect(old).not.toBeNull();
    sim.voyage!.route = old;
    sim.voyage!.waypoint = old.points.length - 1;
    sim.state.fuel = shipById(shipId).fuelCapacity * .6;
    move(sim, departure, 1800);
    expect(realWorld.isLand(sim.state)).toBe(false);
    const unchanged = preserve(sim);
    if (shipId === "spirit") expect(replanActiveLeg(sim, realWorld)).toBe(true);
    else expect(toggleVoyageAutopilot(sim, realWorld).active).toBe(true);
    unchanged();
    const active = sim.voyage!;
    expect(active.route).not.toBe(old);
    expect(active.waypoint).toBe(1);
    expect(active.route.to).toBe("cassis");
    expect(active.itinerary!.destinationId).toBe("la-ciotat");
    expect(active.route.points[0]).toEqual({ lat: sim.state.lat, lon: sim.state.lon });
    expect(distance(active.route.points[0], old.points[0])).toBeGreaterThan(1700);
    expect(distance(active.route.points.at(-1)!, portById("cassis")!)).toBeLessThan(.01);
    for (let i = 1; i < active.route.points.length; i++)
      expect(realWorld.sweep(active.route.points[i - 1], active.route.points[i], 90).hit).toBe(false);
  }, 15000);

  it("keeps the destination and itinerary on failure, disables the pilot and never mutates physical state", () => {
    const sim = fixture("spirit"), oldRoute = sim.voyage!.route;
    sim.voyage!.autopilot = true;
    const unchanged = preserve(sim), spy = vi.spyOn(routes, "routeFromPosition").mockReturnValue(null);
    expect(replanActiveLeg(sim, mockWorld)).toBe(false);
    unchanged();
    expect(sim.voyage).toMatchObject({ autopilot: false, routeUnavailable: true, route: oldRoute });
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(mockWorld, expect.objectContaining({ lat: sim.state.lat, lon: sim.state.lon }), "cassis");
  });

  it("refuses activation without a route, then clears the failure after a successful fresh attempt", () => {
    const sim = fixture(), unchanged = preserve(sim), spy = successSpy();
    spy.mockReturnValueOnce(null);
    const failed = toggleVoyageAutopilot(sim, mockWorld);
    expect(failed.active).toBe(false);
    expect(failed.reason).toEqual(expect.any(String));
    expect(failed.reason!.length).toBeGreaterThan(0);
    expect(sim.voyage).toMatchObject({ autopilot: false, routeUnavailable: true });
    unchanged();
    expect(toggleVoyageAutopilot(sim, mockWorld).active).toBe(true);
    unchanged();
    expect(sim.voyage).toMatchObject({ autopilot: true, routeUnavailable: false, waypoint: 1 });
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it.each(["missing", "docked", "completed", "refuel"] as const)("does not replan or activate when %s", (guard) => {
    const sim = fixture(), spy = successSpy();
    if (guard === "missing") sim.voyage = null;
    if (guard === "docked") sim.state.docked = departure.id;
    if (guard === "completed") sim.voyage!.completed = true;
    if (guard === "refuel") sim.voyage!.itinerary!.refuelPortId = departure.id;
    move(sim, departure, 100);
    const before = structuredClone({ state: sim.state, voyage: sim.voyage });
    expect(refreshManualRoute(sim, mockWorld)).toBe(false);
    const result = toggleVoyageAutopilot(sim, mockWorld);
    expect(result.active).toBe(false);
    if (guard !== "missing") expect(result.reason).toEqual(expect.any(String));
    expect({ state: sim.state, voyage: sim.voyage }).toEqual(before);
    expect(spy).not.toHaveBeenCalled();
  });

  it("suspends automatic refresh in pause but allows explicit preparation of the pilot without moving the boat", () => {
    const sim = fixture(), spy = successSpy();
    sim.paused = true;
    move(sim, departure, 100);
    const unchanged = preserve(sim);
    expect(refreshManualRoute(sim, mockWorld)).toBe(false);
    expect(spy).not.toHaveBeenCalled();
    expect(toggleVoyageAutopilot(sim, mockWorld).active).toBe(true);
    unchanged();
    expect(sim.paused).toBe(true);
    expect(sim.voyage!.route.points[0]).toEqual({ lat: sim.state.lat, lon: sim.state.lon });
    expect(spy).toHaveBeenCalledOnce();
  });

  it("turns an active pilot off without rebuilding, even if paused or docked", () => {
    const sim = fixture(), spy = successSpy();
    sim.voyage!.autopilot = true;
    sim.paused = true;
    sim.state.docked = departure.id;
    const unchanged = preserve(sim), oldRoute = sim.voyage!.route;
    expect(toggleVoyageAutopilot(sim, mockWorld).active).toBe(false);
    expect(sim.voyage!.autopilot).toBe(false);
    expect(sim.voyage!.route).toBe(oldRoute);
    unchanged();
    expect(spy).not.toHaveBeenCalled();
  });

  it("never refreshes a route while its pilot is controlling the boat", () => {
    const sim = fixture(), spy = successSpy();
    sim.voyage!.autopilot = true;
    move(sim, departure, 1000);
    const before = structuredClone(sim.voyage);
    expect(refreshManualRoute(sim, mockWorld)).toBe(false);
    expect(sim.voyage).toEqual(before);
    expect(spy).not.toHaveBeenCalled();
  });

  it("requires 50 m of movement and 0.5 real seconds between manual attempts", () => {
    const sim = fixture(), spy = successSpy();
    expect(refreshManualRoute(sim, mockWorld)).toBe(false);
    move(sim, departure, 49.9);
    expect(refreshManualRoute(sim, mockWorld)).toBe(false);
    expect(spy).not.toHaveBeenCalled();
    move(sim, departure, 50.1);
    expect(refreshManualRoute(sim, mockWorld)).toBe(true);
    const last = { lat: sim.state.lat, lon: sim.state.lon };
    move(sim, last, 60);
    sim.realTime = 5.49;
    sim.state.simTime += 10_000; // Navigation acceleration cannot bypass real-time throttling.
    expect(refreshManualRoute(sim, mockWorld)).toBe(false);
    expect(spy).toHaveBeenCalledOnce();
    sim.realTime = 5.5;
    expect(refreshManualRoute(sim, mockWorld)).toBe(true);
    const next = { lat: sim.state.lat, lon: sim.state.lon };
    sim.realTime = 10;
    move(sim, next, 49.9);
    expect(refreshManualRoute(sim, mockWorld)).toBe(false);
    move(sim, next, 50.1);
    expect(refreshManualRoute(sim, mockWorld)).toBe(true);
    expect(spy).toHaveBeenCalledTimes(3);
    expect(sim.voyage!.autopilot).toBe(false);
  });

  it("limits failed attempts too, but retries after enough movement and time", () => {
    const sim = fixture(), spy = successSpy();
    spy.mockReturnValueOnce(null);
    move(sim, departure, 100);
    expect(refreshManualRoute(sim, mockWorld)).toBe(false);
    expect(spy).toHaveBeenCalledOnce();
    sim.realTime = 6;
    expect(refreshManualRoute(sim, mockWorld)).toBe(false);
    expect(spy).toHaveBeenCalledOnce();
    const failedAt = { lat: sim.state.lat, lon: sim.state.lon };
    move(sim, failedAt, 60);
    expect(refreshManualRoute(sim, mockWorld)).toBe(true);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(sim.voyage).toMatchObject({ routeUnavailable: false, autopilot: false });
  });

  it("forces activation from the exact latest position even inside the manual refresh cadence", () => {
    const sim = fixture(), spy = successSpy();
    move(sim, departure, 70);
    expect(refreshManualRoute(sim, mockWorld)).toBe(true);
    const refreshedRoute = sim.voyage!.route, refreshedAt = { lat: sim.state.lat, lon: sim.state.lon };
    move(sim, refreshedAt, 4);
    sim.realTime += .1;
    expect(refreshManualRoute(sim, mockWorld)).toBe(false);
    expect(spy).toHaveBeenCalledOnce();
    const unchanged = preserve(sim);
    expect(toggleVoyageAutopilot(sim, mockWorld).active).toBe(true);
    unchanged();
    expect(spy).toHaveBeenCalledTimes(2);
    expect(sim.voyage!.route).not.toBe(refreshedRoute);
    expect(sim.voyage!.route.points[0]).toEqual({ lat: sim.state.lat, lon: sim.state.lon });
    expect(sim.voyage!.waypoint).toBe(1);
  });
});

describe("active-leg geometry shown on the chart", () => {
  it("starts at the actual boat, omits consumed waypoints and leaves voyage progress untouched", () => {
    const sim = fixture(), points = [0, 100, 200, 300].map(m => destination(departure, Math.PI, m));
    sim.voyage!.route = { ...route(points[0]), points, distance: 300, directDistance: 300 };
    sim.voyage!.waypoint = 2;
    sim.voyage!.autopilot = true;
    Object.assign(sim.state, destination(points[1], Math.PI * 1.5, 40));
    const before = structuredClone({ state: sim.state, voyage: sim.voyage });
    const shown = activeLegMapRoute(sim.state, sim.voyage)!;
    expect(shown.points).toEqual([{ lat: sim.state.lat, lon: sim.state.lon }, ...points.slice(2)]);
    expect(shown.to).toBe("cassis");
    expect(shown.distance).toBeCloseTo(distance(sim.state, points[2]) + distance(points[2], points[3]), 7);
    expect({ state: sim.state, voyage: sim.voyage }).toEqual(before);
  });

  it.each(["missing", "completed", "unavailable"] as const)("does not present a misleading active corridor when %s", (kind) => {
    const sim = fixture();
    if (kind === "missing") sim.voyage = null;
    else if (kind === "completed") sim.voyage!.completed = true;
    else Object.assign(sim.voyage!, { routeUnavailable: true });
    expect(activeLegMapRoute(sim.state, sim.voyage)).toBeNull();
  });
});
