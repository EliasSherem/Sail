import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { portById } from "../src/data/ports";
import { destination, distance } from "../src/geo/math";
import { routeFromPosition } from "../src/geo/routes";
import { worldFromGeoJSON } from "../src/geo/world";
import { autopilotControls, createVessel, motion, Simulation } from "../src/sim/engine";
import { DOCKING_RADIUS_METERS } from "../src/sim/navigationConstants";
import { createWeather } from "../src/sim/weather";
import type { Voyage } from "../src/types";

const world = worldFromGeoJSON(JSON.parse(readFileSync(new URL("../public/data/land.geojson", import.meta.url), "utf8")));
const origin = { lat: 0, lon: -30 };
const still = { ...createWeather("calm", 4821), windSpeed: 0, currentSpeed: 0 };
function approach(metres: number): Voyage {
  const target = destination(origin, 0, metres);
  return { route: { id: "terminal", from: "current", to: "test-service", name: "Test terminal approach", description: "",
    points: [origin, target], distance: metres, directDistance: metres }, waypoint: 1, autopilot: true, completed: false };
}

describe("slow terminal approach inside the docking service", () => {
  it("accepts a settled small hull without moving it, forcing its speed to zero or consuming its fuel", () => {
    const state = createVessel("spirit", origin, 1.2), voyage = approach(48);
    Object.assign(state, { u: .5, v: .1, engine: .23, fuel: 243.3 });
    const before = structuredClone(state);
    expect(autopilotControls(state, still, voyage)).toEqual({ throttle: 0, rudder: 0, gear: 0 });
    expect(voyage).toMatchObject({ completed: true, autopilot: false });
    expect(state).toEqual(before);
    expect(motion(state, still).sog).toBeGreaterThan(0);
  });

  it.each(["fast", "outside"] as const)("keeps navigating when the vessel is %s instead of completing just because the dock is nearby", (condition) => {
    const state = createVessel("spirit", origin), voyage = approach(condition === "fast" ? 48 : 300);
    state.u = condition === "fast" ? 20 : .4;
    const before = structuredClone(state);
    const controls = autopilotControls(state, still, voyage);
    expect(distance(state, voyage.route.points.at(-1)!)).toBeLessThan(DOCKING_RADIUS_METERS);
    expect(voyage).toMatchObject({ completed: false, autopilot: true });
    expect(state).toEqual(before);
    if (condition === "fast") expect(controls.gear).toBe(-1);
  });

  it("finishes the real Spirit passage to Barcelona in evolving hurricane weather without circling until the tank empties", () => {
    const departure = portById("marseille")!, destinationPort = portById("barcelona")!;
    const state = createVessel("spirit", departure, departure.heading, .35);
    const sim = new Simulation(state, createWeather("hurricane", 4821), world);
    sim.requestedScale = 100;
    sim.voyage = { route: routeFromPosition(world, state, destinationPort.id)!, waypoint: 1, autopilot: true, completed: false };
    let contacts = 0;
    sim.onCollision = () => contacts++;
    while (state.simTime < 16_000 && !sim.voyage.completed && !contacts && state.fuel > 0) sim.advance(1 / 30);
    expect(contacts).toBe(0);
    expect(sim.voyage).toMatchObject({ completed: true, autopilot: false });
    expect(distance(state, destinationPort)).toBeLessThan(60);
    expect(motion(state, sim.weather).sog).toBeLessThan(.85);
    expect(state.fuel).toBeGreaterThan(200);
    expect(state.distance).toBeGreaterThan(340_000);
    expect(state.docked).toBeNull();
  }, 20_000);
});
