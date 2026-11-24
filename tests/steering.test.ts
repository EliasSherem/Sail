import { describe, expect, it } from "vitest";
import { SHIPS } from "../src/data/ships";
import { distance } from "../src/geo/math";
import {
  createVessel,
  FIXED_DT,
  motion,
  Simulation,
  stepVessel,
} from "../src/sim/engine";
import type { Controls, ShipId, VesselState, Weather } from "../src/types";

const origin = { lat: 42, lon: 4 };
const still: Weather = {
  sea: "calm",
  seed: 0,
  windSpeed: 0,
  windDirection: 0,
  currentSpeed: 0,
  currentDirection: 0,
  waveHeight: 0,
  visibility: 30000,
};
const initialSpeed: Record<ShipId, number> = {
  launch: 12,
  fishing: 6,
  yacht: 10,
  tug: 4,
  cargo: 8,
  spirit: 142,
  speedboat: 61,
};
const turn: Controls = { throttle: 1, rudder: 1, gear: 1 };
function run(boat: VesselState, seconds: number, controls = turn) {
  for (let i = 0; i < Math.round(seconds / FIXED_DT); i++)
    stepVessel(boat, still, FIXED_DT, undefined, controls);
}
function underway(id: ShipId, speed = initialSpeed[id]) {
  const boat = createVessel(id, origin);
  boat.u = speed;
  boat.engine = 1;
  return boat;
}

describe("speed-dependent hull grip and responsive steering", () => {
  it("keeps planing boats on their turn with small sideslip while heavy craft remain distinct", () => {
    const launch = underway("launch"),
      yacht = underway("yacht"),
      cargo = underway("cargo");
    for (const boat of [launch, yacht, cargo]) run(boat, 10);
    // The previous launch/yacht slipped ~20°/~13° off the bow at these speeds.
    expect(
      (Math.atan2(Math.abs(launch.v), Math.abs(launch.u)) * 180) / Math.PI,
    ).toBeLessThan(8);
    expect(
      (Math.atan2(Math.abs(yacht.v), Math.abs(yacht.u)) * 180) / Math.PI,
    ).toBeLessThan(6.5);
    expect((launch.heading * 180) / Math.PI).toBeGreaterThan(110);
    expect((yacht.heading * 180) / Math.PI).toBeGreaterThan(45);
    expect((cargo.heading * 180) / Math.PI).toBeLessThan(2);
    expect(launch.yawRate).toBeGreaterThan(yacht.yawRate * 2);
    expect(yacht.yawRate).toBeGreaterThan(cargo.yawRate * 20);
  });

  it("reduces existing sideslip faster with forward water flow, without steering or teleporting", () => {
    for (const id of ["launch", "yacht", "spirit"] as const) {
      const slow = underway(id, 0),
        fast = underway(id);
      for (const boat of [slow, fast]) {
        boat.v = 1;
        boat.fuel = 0;
        run(boat, 0.5, { throttle: 0, rudder: 0, gear: 0 });
        expect(boat.v).toBeGreaterThan(0);
        // Sideslip through still air creates a minute asymmetric wind-drag
        // moment in the existing model. Grip itself does not set the heading.
        const heading = Math.atan2(
          Math.sin(boat.heading),
          Math.cos(boat.heading),
        );
        expect(Math.abs(heading)).toBeLessThan(0.0001);
        expect(Math.abs(boat.yawRate)).toBeLessThan(0.0001);
      }
      expect(fast.v).toBeLessThan(slow.v * 0.7);
      expect(distance(fast, origin)).toBeGreaterThan(distance(slow, origin));
    }
  });

  it("dissipates translational kinetic energy throughout unpowered turns, ahead and astern", () => {
    for (const ship of SHIPS)
      for (const speed of [initialSpeed[ship.id], -6]) {
        const boat = underway(ship.id, speed);
        boat.fuel = 0;
        boat.v = speed > 0 ? -1 : 1;
        boat.yawRate = 0.1;
        // Translational water-relative energy is proportional to u²+v² for a
        // fixed mass. Steering/grip must not increase it without thrust or wind.
        let prior = boat.u ** 2 + boat.v ** 2;
        for (let step = 0; step < 300; step++) {
          stepVessel(boat, still, FIXED_DT, undefined, {
            throttle: 0,
            rudder: step < 150 ? 1 : -1,
            gear: 0,
          });
          const next = boat.u ** 2 + boat.v ** 2;
          expect(next).toBeLessThanOrEqual(prior + 1e-9);
          expect(
            Number.isFinite(boat.heading + boat.yawRate + boat.lat + boat.lon),
          ).toBe(true);
          prior = next;
        }
        expect(boat.fuel).toBe(0);
      }
  });

  it("uses the direction of water flow for reverse steering and retains gradual yaw", () => {
    for (const ship of SHIPS) {
      const forward = underway(ship.id, 6),
        reverse = underway(ship.id, -6);
      for (const boat of [forward, reverse]) {
        boat.fuel = 0;
        // An unpowered coast isolates the rudder from differential propulsors.
        stepVessel(boat, still, FIXED_DT, undefined, {
          throttle: 0,
          rudder: 1,
          gear: 0,
        });
        const change = Math.atan2(
          Math.sin(boat.heading),
          Math.cos(boat.heading),
        );
        expect(change).toBeCloseTo(boat.yawRate * FIXED_DT, 12);
        expect(Math.abs(change)).toBeLessThan(0.01);
      }
      expect(forward.yawRate).toBeGreaterThan(0);
      expect(reverse.yawRate).toBeLessThan(0);
    }
  });

  it("preserves every steering trajectory across 30/60/144 FPS and 100×", () => {
    function scenario(id: ShipId, fps: number, scale: number) {
      const boat = underway(id);
      boat.controls = { throttle: 0.85, rudder: 0.65, gear: 1 };
      const sim = new Simulation(boat, still);
      sim.evolvingWeather = false;
      sim.requestedScale = scale;
      for (let i = 0; i < Math.round((120 * fps) / scale); i++)
        sim.advance(1 / fps);
      return boat;
    }
    for (const ship of SHIPS) {
      const expected = scenario(ship.id, 30, 1);
      for (const [fps, scale] of [
        [60, 1],
        [144, 1],
        [60, 100],
      ]) {
        const actual = scenario(ship.id, fps, scale);
        expect(distance(actual, expected)).toBeLessThan(1e-5);
        expect(actual.heading).toBeCloseTo(expected.heading, 10);
        expect(actual.yawRate).toBeCloseTo(expected.yawRate, 10);
        expect(actual.u).toBeCloseTo(expected.u, 10);
        expect(actual.v).toBeCloseTo(expected.v, 10);
        expect(actual.fuel).toBeCloseTo(expected.fuel, 8);
        expect(actual.distance).toBeCloseTo(expected.distance, 8);
        expect(actual.simTime).toBeCloseTo(120, 7);
        expect(motion(actual, still).sog).toBeGreaterThan(0);
      }
    }
  });
});


describe("turn radius follows water speed", () => {
  it("increases the settled turn radius with speed for every hull at the same helm", () => {
    // Constant-speed tow fixture: an external longitudinal force holds speed
    // while yaw responds through the real rudder torque and damping. This
    // separates steering geometry from acceleration and engine spool-up.
    for (const ship of SHIPS) {
      const radii: number[] = [];
      for (const speed of [1, 2, 4, 8, 16]) {
        const boat = createVessel(ship.id, origin);
        boat.fuel = 0;
        for (let step = 0; step < 30 * 1800; step++) {
          boat.u = speed; boat.v = 0;
          stepVessel(boat, still, FIXED_DT, undefined, { throttle: 0, rudder: .7, gear: 0 });
        }
        radii.push(speed / Math.abs(boat.yawRate));
      }
      for (let i = 1; i < radii.length; i++) expect(radii[i], ship.id).toBeGreaterThan(radii[i - 1] * 1.15);
      expect(radii[4] / radii[3], ship.id).toBeGreaterThan(1.5);
      expect(radii[4] / radii[3], ship.id).toBeLessThan(2.1);
    }
  });
});
