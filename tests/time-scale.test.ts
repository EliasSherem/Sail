import { describe, expect, it } from "vitest";
import { shipById } from "../src/data/ships";
import { destination, distance, toLocal } from "../src/geo/math";
import { createVessel, FIXED_DT, motion, Simulation, TIME_SCALES } from "../src/sim/engine";
import { createWeather } from "../src/sim/weather";
import { dayHour } from "../src/sim/daylight";
import type { CollisionWorld, Route, ShipId } from "../src/types";

const origin = { lat: 0, lon: -30 };
const routeTo = (meters: number): Route => {
  const target = destination(origin, Math.PI / 2, meters);
  return { id: "time-scale-open-water", name: "Fixed-step passage", from: "current", to: "fixture",
    points: [origin, target], distance: meters, directDistance: meters, description: "Open-water physical fixture" };
};

function scenario(shipId: ShipId, scale: number, simulatedSeconds: number, pilot: boolean): Simulation {
  const state = createVessel(shipId, origin, Math.PI / 2);
  state.controls = { throttle: .72, rudder: pilot ? 0 : .04, gear: 1 };
  const sim = new Simulation(state, createWeather("moderate", 942));
  sim.requestedScale = scale;
  if (pilot) sim.voyage = { route: routeTo(200_000), waypoint: 1, autopilot: true, completed: false };
  const frames = Math.round(simulatedSeconds * 60 / scale);
  for (let i = 0; i < frames; i++) sim.advance(1 / 60);
  return sim;
}

describe("1000× fixed-step passage", () => {
  it.each([
    { shipId: "fishing" as const, pilot: false },
    { shipId: "speedboat" as const, pilot: true },
    { shipId: "spirit" as const, pilot: true },
  ])("preserves real travel, fuel and weather for $shipId, pilot=$pilot", ({ shipId, pilot }) => {
    const normal = scenario(shipId, 1, 1000, pilot);
    const fast = scenario(shipId, 1000, 1000, pilot);
    expect(TIME_SCALES).toContain(1000);
    expect(fast.activeScale).toBe(1000);
    expect(fast.state.simTime).toBeCloseTo(1000, 6);
    expect(fast.state.simTime).toBeCloseTo(normal.state.simTime, 8);
    expect(distance(fast.state, normal.state)).toBeLessThan(.00001);
    expect(fast.state.distance).toBeCloseTo(normal.state.distance, 7);
    expect(fast.state.heading).toBeCloseTo(normal.state.heading, 10);
    expect(fast.state.fuel).toBeCloseTo(normal.state.fuel, 9);
    expect(fast.state.fuel).toBeLessThan(shipById(shipId).fuelCapacity);
    expect(fast.weather).toEqual(normal.weather);
    expect(dayHour(fast)).toBeCloseTo(dayHour(normal), 10);
    expect(dayHour(fast)).toBeCloseTo(9 + 1000 / 3600, 9);
    expect(fast.environmentTime).toBeCloseTo(1, 10);
    expect(normal.environmentTime).toBeCloseTo(1000, 6);
    expect(fast.accumulator).toBeLessThan(FIXED_DT);
  });

  it("bounds a stalled frame and then integrates every retained step without skipping fuel", () => {
    const normal = scenario("fishing", 1, 500, false);
    const fast = scenario("fishing", 1000, 0, false);
    fast.advance(.5);
    expect(fast.state.simTime).toBeGreaterThan(330);
    expect(fast.state.simTime).toBeLessThan(334);
    expect(fast.accumulator).toBeGreaterThan(160);
    fast.advance(1e-8);
    expect(fast.accumulator).toBeLessThan(FIXED_DT);
    expect(fast.state.simTime).toBeCloseTo(500, 6);
    expect(distance(fast.state, normal.state)).toBeLessThan(.00001);
    expect(fast.state.fuel).toBeCloseTo(normal.state.fuel, 9);
    expect(fast.environmentTime).toBeCloseTo(.5, 6);
  });

  it("reduces through 20×, 5× and 1× and sweeps the hull before reaching a coast", () => {
    const wall = 5000;
    const world: CollisionWorld = {
      clearance: point => Math.max(0, wall - toLocal(point, origin).x),
      sweep: (from, to, radius) => ({ hit: Math.max(toLocal(from, origin).x, toLocal(to, origin).x) + radius >= wall,
        kind: "land" }),
    };
    const state = createVessel("launch", origin, Math.PI / 2);
    state.u = 14;
    state.engine = 1;
    state.controls = { throttle: 1, rudder: 0, gear: 1 };
    const sim = new Simulation(state, { ...createWeather("calm", 42), windSpeed: 0, currentSpeed: 0 }, world);
    sim.evolvingWeather = false;
    sim.requestedScale = 1000;
    let collisions = 0;
    sim.onCollision = () => collisions++;
    const seen = new Set<number>();
    for (let frame = 0; frame < 12_000 && !collisions; frame++) {
      sim.advance(1 / 60);
      seen.add(sim.activeScale);
    }
    expect(seen).toEqual(new Set([1000, 20, 5, 1]));
    expect(collisions).toBeGreaterThan(0);
    expect(toLocal(state, origin).x).toBeLessThan(wall - shipById("launch").length / 2);
    expect(state.damage).toBeGreaterThan(0);
    expect(sim.activeScale).toBe(1);
  });

  it("arrives slowly under autopilot after a 1000× passage", () => {
    const state = createVessel("speedboat", origin, Math.PI / 2);
    const sim = new Simulation(state, { ...createWeather("calm", 42), windSpeed: 0, currentSpeed: 0 });
    sim.evolvingWeather = false;
    sim.requestedScale = 1000;
    sim.voyage = { route: routeTo(50_000), waypoint: 1, autopilot: true, completed: false };
    let reached1000 = false;
    for (let frame = 0; frame < 12_000 && !sim.voyage.completed; frame++) {
      sim.advance(1 / 60);
      reached1000 ||= sim.activeScale === 1000;
    }
    expect(reached1000).toBe(true);
    expect(sim.voyage.completed).toBe(true);
    expect(sim.activeScale).toBe(1);
    expect(distance(state, sim.voyage.route.points.at(-1)!)).toBeLessThan(60);
    expect(motion(state, sim.weather).sog).toBeLessThan(.75);
    expect(state.fuel).toBeGreaterThan(0);
  });
});
