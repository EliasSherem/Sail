import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { portById } from "../src/data/ports";
import { distance } from "../src/geo/math";
import * as routes from "../src/geo/routes";
import { World, worldFromGeoJSON } from "../src/geo/world";
import { restoreSavedVoyage } from "../src/persistence/restoreVoyage";
import type { SaveGame } from "../src/persistence/save";
import { createVessel, Simulation } from "../src/sim/engine";
import * as itinerary from "../src/sim/itinerary";
import type { ItineraryPlan } from "../src/sim/itinerary";
import * as navigation from "../src/sim/routeNavigation";
import { createWeather } from "../src/sim/weather";
import type { LatLon, Route } from "../src/types";

const world = worldFromGeoJSON(JSON.parse(readFileSync(new URL("../public/data/land.geojson", import.meta.url), "utf8")));
const water = new World([], []), departure = portById("marseille")!;
const weather = createWeather("calm", 4821);
function simpleRoute(start: LatLon, target = "barcelona"): Route {
  const end = portById(target)!;
  return { id: `current-${target}`, name: "Test voyage", from: "current", to: target, description: "",
    points: [{ lat: start.lat, lon: start.lon }, { lat: end.lat, lon: end.lon }],
    distance: distance(start, end), directDistance: distance(start, end) };
}
function simulation(real = false) {
  const sim = new Simulation(createVessel("yacht", { lat: 42, lon: 4 }, 1.3), { ...weather }, real ? world : water);
  sim.state.fuel = 1;
  sim.state.controls = { throttle: .67, rudder: -.2, gear: 1 };
  sim.state.u = 3.2; sim.state.v = .17; sim.state.engine = .61;
  sim.voyage = { route: simpleRoute(sim.state), waypoint: 1, completed: false, autopilot: false,
    itinerary: { destinationId: "cartagena", stopIds: ["barcelona", "cartagena"], legIndex: 0, refuelPortId: null } };
  return sim;
}
function saved(sim: Simulation, autopilot = true): Pick<SaveGame, "routeTarget" | "routeCompleted" | "autopilot" | "itinerary"> {
  return { routeTarget: sim.voyage?.route.to ?? null, routeCompleted: sim.voyage?.completed ?? false,
    autopilot, itinerary: sim.voyage?.itinerary ? structuredClone(sim.voyage.itinerary) : undefined };
}
function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const unreachable: ItineraryPlan = { status: "unreachable", destinationId: "barcelona", legs: [],
  totalDistanceM: 0, totalFuelLitres: 0, totalDurationSeconds: 0, reason: "No hay una escala alcanzable con combustible y reserva." };
function heldSearch() {
  vi.spyOn(routes, "routeFromPosition").mockImplementation((_world, start, target) => simpleRoute(start, target));
  const held = deferred<ItineraryPlan>();
  const spy = vi.spyOn(itinerary, "planFuelItineraryAsync").mockReturnValue(held.promise);
  return { ...held, spy };
}
afterEach(() => vi.restoreAllMocks());

describe("asynchronous fuel guard", () => {
  it.each([false, true])("restores the original pause=%s after a rejected itinerary and freezes physics while searching", async wasPaused => {
    const sim = simulation(), held = heldSearch(), before = structuredClone(sim.state);
    sim.paused = wasPaused;
    const pending = navigation.toggleVoyageAutopilotAsync(sim, water);
    expect(navigation.isPilotPlanning(sim)).toBe(true);
    expect(sim.paused).toBe(true);
    sim.advance(1);
    expect(sim.state).toEqual(before);
    held.resolve(unreachable);
    await expect(pending).resolves.toEqual({ active: false, reason: unreachable.reason });
    expect(sim.paused).toBe(wasPaused);
    expect(navigation.isPilotPlanning(sim)).toBe(false);
    expect(sim.voyage!.autopilot).toBe(false);
    expect(sim.voyage!.itinerary!.stopIds).toEqual(["barcelona", "cartagena"]);
    expect(sim.state).toEqual(before);
  });

  it.each([false, true])("restores pause=%s and clears pending state when the planner throws", async wasPaused => {
    const sim = simulation(), held = heldSearch(), before = structuredClone(sim.state);
    sim.paused = wasPaused;
    const pending = navigation.toggleVoyageAutopilotAsync(sim, water);
    held.reject(new Error("Controlled planner failure"));
    await expect(pending).rejects.toThrow("Controlled planner failure");
    expect(sim.paused).toBe(wasPaused);
    expect(navigation.isPilotPlanning(sim)).toBe(false);
    expect(sim.voyage!.autopilot).toBe(false);
    expect(sim.state).toEqual(before);
  });

  it("ignores a duplicate activation while one search owns the pause", async () => {
    const sim = simulation(), held = heldSearch(); sim.paused = false;
    const first = navigation.toggleVoyageAutopilotAsync(sim, water);
    await expect(navigation.toggleVoyageAutopilotAsync(sim, water)).resolves.toEqual({ active: false });
    expect(held.spy).toHaveBeenCalledOnce();
    expect(sim.paused).toBe(true);
    expect(navigation.isPilotPlanning(sim)).toBe(true);
    held.resolve(unreachable); await first;
    expect(sim.paused).toBe(false);
    expect(navigation.isPilotPlanning(sim)).toBe(false);
  });

  it.each(["physical-state", "vessel-identity", "voyage-identity", "weather"] as const)("discards the pending answer when %s changes", async change => {
    const sim = simulation(), held = heldSearch(); sim.paused = false;
    const pending = navigation.toggleVoyageAutopilotAsync(sim, water);
    if (change === "physical-state") sim.state.fuel = .5;
    if (change === "vessel-identity") sim.state = structuredClone(sim.state);
    if (change === "voyage-identity") sim.voyage = structuredClone(sim.voyage);
    if (change === "weather") sim.weather = createWeather("hurricane", 4821);
    const changedState = sim.state, before = structuredClone({ state: sim.state, voyage: sim.voyage });
    held.resolve(unreachable);
    const result = await pending;
    expect(result.active).toBe(false);
    expect(result.reason).toContain("cambió");
    expect(sim.state).toBe(changedState);
    expect({ state: sim.state, voyage: sim.voyage }).toEqual(before);
    expect(sim.paused).toBe(false);
    expect(navigation.isPilotPlanning(sim)).toBe(false);
  });

  it("rejects a real legacy open-water Barcelona leg with 1 L without inventing a service or fuel", async () => {
    const sim = simulation(true), before = structuredClone(sim.state);
    sim.voyage!.itinerary = undefined; sim.paused = false;
    const result = await navigation.toggleVoyageAutopilotAsync(sim, world);
    expect(result.active).toBe(false);
    expect(result.reason).toMatch(/combustible|autonomía|escala/);
    expect(sim.voyage!.autopilot).toBe(false);
    expect(sim.voyage!.itinerary).toBeUndefined();
    expect(sim.state).toEqual(before);
    expect(sim.paused).toBe(false);
    expect(navigation.isPilotPlanning(sim)).toBe(false);
  }, 20000);
});

describe("fuel monitoring during an active passage", () => {
  it("inserts Palma before Barcelona after a fuel-limited diversion and preserves sailed history and Cartagena", async () => {
    const state = createVessel("yacht", { lat: 39.370278, lon: 2.354744 }, 1.1);
    state.fuel = 250; state.u = 8.3; state.v = .11; state.engine = .52;
    state.controls = { throttle: .54, rudder: -.1, gear: 1 };
    const sim = new Simulation(state, { ...weather }, world); sim.paused = false;
    const route = routes.routeFromPosition(world, state, "barcelona")!;
    sim.voyage = { route, waypoint: 1, completed: false, autopilot: true,
      itinerary: { destinationId: "cartagena", stopIds: ["marseille", "barcelona", "cartagena"], legIndex: 1, refuelPortId: null } };
    const before = structuredClone(state);
    const result = await navigation.monitorAutopilotFuel(sim, world);
    expect(result?.active).toBe(true);
    expect(sim.voyage).toMatchObject({ autopilot: true, completed: false, waypoint: 1, route: { to: "palma" },
      itinerary: { destinationId: "cartagena", stopIds: ["marseille", "palma", "barcelona", "cartagena"], legIndex: 1, refuelPortId: null } });
    expect(sim.state).toBe(state);
    expect(sim.state).toEqual(before);
    expect(sim.paused).toBe(false);
    expect(navigation.isPilotPlanning(sim)).toBe(false);
    // Once the reachable stop is installed, a repeated monitor does not keep
    // resetting progress or inserting the same refuelling port again.
    const activeRoute = sim.voyage!.route, activeItinerary = structuredClone(sim.voyage!.itinerary);
    await expect(navigation.monitorAutopilotFuel(sim, world)).resolves.toBeNull();
    expect(sim.voyage!.route).toBe(activeRoute);
    expect(sim.voyage!.itinerary).toEqual(activeItinerary);
  }, 20000);

  it("pauses and disables an active pilot that cannot reach any service with 1 L offshore", async () => {
    const sim = simulation(true), before = structuredClone(sim.state);
    sim.paused = false; sim.voyage!.autopilot = true;
    const itineraryBefore = structuredClone(sim.voyage!.itinerary);
    const result = await navigation.monitorAutopilotFuel(sim, world);
    expect(result?.active).toBe(false);
    expect(result?.reason).toContain("pausa");
    expect(sim.paused).toBe(true);
    expect(sim.voyage!.autopilot).toBe(false);
    expect(sim.voyage!.itinerary).toEqual(itineraryBefore);
    expect(sim.state).toEqual(before);
    expect(navigation.isPilotPlanning(sim)).toBe(false);
  }, 20000);

  it("leaves affordable progress, route identity, controls and pause untouched", async () => {
    const sim = new Simulation(createVessel("yacht", departure), { ...weather }, world);
    sim.paused = false;
    const route = routes.buildRoute(world, "marseille", "cassis")!;
    sim.voyage = { route, waypoint: Math.min(2, route.points.length - 1), completed: false, autopilot: true };
    const state = structuredClone(sim.state), voyage = structuredClone(sim.voyage), planner = vi.spyOn(itinerary, "planFuelItineraryAsync");
    await expect(navigation.monitorAutopilotFuel(sim, world)).resolves.toBeNull();
    expect(planner).not.toHaveBeenCalled();
    expect(sim.voyage).toEqual(voyage);
    expect(sim.voyage!.route).toBe(route);
    expect(sim.state).toEqual(state);
    expect(sim.paused).toBe(false);
    expect(navigation.isPilotPlanning(sim)).toBe(false);
  });

  it.each(["completed", "manual", "paused", "docked"] as const)("skips a %s voyage without searching or mutating it", async guard => {
    const sim = simulation(true); sim.paused = false; sim.voyage!.autopilot = true;
    if (guard === "completed") sim.voyage!.completed = true;
    if (guard === "manual") sim.voyage!.autopilot = false;
    if (guard === "paused") sim.paused = true;
    if (guard === "docked") sim.state.docked = "barcelona";
    const before = structuredClone({ state: sim.state, voyage: sim.voyage, paused: sim.paused });
    const planner = vi.spyOn(itinerary, "planFuelItineraryAsync");
    await expect(navigation.monitorAutopilotFuel(sim, world)).resolves.toBeNull();
    expect(planner).not.toHaveBeenCalled();
    expect({ state: sim.state, voyage: sim.voyage, paused: sim.paused }).toEqual(before);
  });
});

describe("restoring a saved pilot through the current fuel guards", () => {
  it("does not trust legacy autopilot=true with 1 L and removes its stale power command", async () => {
    const sim = simulation(true), navigationSave = saved(sim), before = structuredClone(sim.state);
    sim.voyage!.autopilot = true; sim.paused = false;
    const result = await restoreSavedVoyage(sim, world, navigationSave);
    expect(result.active).toBe(false);
    expect(sim.voyage!.autopilot).toBe(false);
    expect(sim.state).toEqual({ ...before, controls: { throttle: 0, rudder: 0, gear: 0 } });
    expect(sim.voyage!.itinerary).toEqual(navigationSave.itinerary);
    expect(sim.paused).toBe(false);
  }, 20000);

  it("restores affordable saved pilot requests without changing the actual boat or saved data", async () => {
    const sim = new Simulation(createVessel("yacht", departure), { ...weather }, world);
    const navigationSave = { routeTarget: "cassis", routeCompleted: false, autopilot: true,
      itinerary: { destinationId: "la-ciotat", stopIds: ["cassis", "la-ciotat"], legIndex: 0, refuelPortId: null } };
    const before = structuredClone({ state: sim.state, navigationSave });
    const result = await restoreSavedVoyage(sim, world, navigationSave);
    expect(result.active).toBe(true);
    expect(sim.voyage).toMatchObject({ autopilot: true, completed: false, waypoint: 1 });
    expect(sim.voyage!.itinerary).toEqual(navigationSave.itinerary);
    expect(sim.voyage!.itinerary).not.toBe(navigationSave.itinerary);
    expect({ state: sim.state, navigationSave }).toEqual(before);
  });

  it("preserves saved manual controls and never requests fuel planning for a manual restore", async () => {
    const sim = simulation(true), navigationSave = saved(sim, false), before = structuredClone(sim.state);
    const pilot = vi.spyOn(navigation, "toggleVoyageAutopilotAsync");
    await expect(restoreSavedVoyage(sim, world, navigationSave)).resolves.toEqual({ active: false });
    expect(pilot).not.toHaveBeenCalled();
    expect(sim.state).toEqual(before);
    expect(sim.voyage!.autopilot).toBe(false);
  });

  it.each(["docked", "completed", "refuel"] as const)("does not bypass the saved %s guard", async guard => {
    const sim = new Simulation(createVessel("yacht", departure), { ...weather }, world);
    const navigationSave = { routeTarget: "cassis", routeCompleted: false, autopilot: true,
      itinerary: { destinationId: "cassis", stopIds: ["cassis"], legIndex: 0, refuelPortId: null as string | null } };
    if (guard === "docked") sim.state.docked = departure.id;
    if (guard === "completed") navigationSave.routeCompleted = true;
    if (guard === "refuel") navigationSave.itinerary.refuelPortId = departure.id;
    const result = await restoreSavedVoyage(sim, world, navigationSave);
    expect(result.active).toBe(false);
    expect(sim.voyage!.autopilot).toBe(false);
    expect(sim.state.controls).toEqual({ throttle: 0, rudder: 0, gear: 0 });
    expect(sim.voyage!.itinerary).toEqual(navigationSave.itinerary);
    expect(sim.voyage!.completed).toBe(navigationSave.routeCompleted);
  });

  it("preserves legacy arrival completion when routeCompleted was absent", async () => {
    const sim = new Simulation(createVessel("yacht", portById("cassis")!), { ...weather }, world);
    sim.state.docked = "cassis";
    await restoreSavedVoyage(sim, world, { routeTarget: "cassis", autopilot: true });
    expect(sim.voyage).toMatchObject({ completed: true, autopilot: false });
  });

  it("clears an unusable saved route without leaving the old pilot or its accelerator active", async () => {
    const sim = simulation(), navigationSave = saved(sim), before = structuredClone(sim.state);
    sim.voyage!.autopilot = true;
    vi.spyOn(routes, "routeFromPosition").mockReturnValue(null);
    const result = await restoreSavedVoyage(sim, water, navigationSave);
    expect(result.active).toBe(false);
    expect(result.reason).toContain("ruta navegable");
    expect(sim.voyage).toBeNull();
    expect(sim.state).toEqual({ ...before, controls: { throttle: 0, rudder: 0, gear: 0 } });
  });

  it.each(["missing-target", "geometry-error"] as const)("fails closed for a legacy pilot with %s", async condition => {
    const sim = simulation(), navigationSave = saved(sim), before = structuredClone(sim.state);
    sim.voyage!.autopilot = true;
    if (condition === "missing-target") navigationSave.routeTarget = null;
    else vi.spyOn(routes, "routeFromPosition").mockImplementation(() => { throw new Error("Controlled geometry failure"); });
    const result = await restoreSavedVoyage(sim, water, navigationSave);
    expect(result.active).toBe(false);
    expect(sim.voyage).toBeNull();
    expect(sim.state).toEqual({ ...before, controls: { throttle: 0, rudder: 0, gear: 0 } });
  });

  it("fails closed and keeps actual fuel when the restored async planner rejects", async () => {
    const sim = simulation(), held = heldSearch(), navigationSave = saved(sim), before = structuredClone(sim.state);
    sim.paused = false;
    const restored = restoreSavedVoyage(sim, water, navigationSave);
    held.reject(new Error("Controlled failed restore"));
    const result = await restored;
    expect(result.active).toBe(false);
    expect(result.reason).toContain("verificar");
    expect(sim.voyage!.autopilot).toBe(false);
    expect(sim.state).toEqual({ ...before, controls: { throttle: 0, rudder: 0, gear: 0 } });
    expect(sim.paused).toBe(false);
    expect(navigation.isPilotPlanning(sim)).toBe(false);
  });
});
