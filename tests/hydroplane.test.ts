import { describe, expect, it } from "vitest";
import { shipById } from "../src/data/ships";
import { distance, toLocal } from "../src/geo/math";
import {
  createVessel,
  FIXED_DT,
  fuelRate,
  motion,
  Simulation,
  stepVessel,
} from "../src/sim/engine";
import type {
  CollisionWorld,
  Controls,
  VesselState,
  Weather,
} from "../src/types";

const origin = { lat: 42, lon: 4 };
const calm: Weather = {
  sea: "calm",
  seed: 0,
  windSpeed: 0,
  windDirection: 0,
  currentSpeed: 0,
  currentDirection: 0,
  waveHeight: 0,
  visibility: 30000,
};
const ahead: Controls = { throttle: 1, rudder: 0, gear: 1 };
const reverse: Controls = { throttle: 1, rudder: 0, gear: -1 };
function run(state: VesselState, seconds: number, controls = ahead) {
  for (let step = 0; step < Math.round(seconds / FIXED_DT); step++)
    stepVessel(state, calm, FIXED_DT, undefined, controls);
}

describe("Spirit of Australia playable hydroplane", () => {
  it("uses the touring jet fuel balance with nonzero idle consumption and linear spool response", () => {
    const boat = createVessel("spirit", origin);
    expect(fuelRate(boat) * 3600).toBeCloseTo(39.96, 2);
    boat.engine = 0.5;
    expect(fuelRate(boat) * 3600).toBeCloseTo(269.73, 2);
    boat.engine = 1;
    expect(fuelRate(boat) * 3600).toBeCloseTo(499.5, 2);
    boat.docked = "marseille";
    expect(fuelRate(boat)).toBe(0);
  });

  it("accelerates through forces toward the 511.11 km/h record calibration", () => {
    const boat = createVessel("spirit", origin);
    run(boat, 1);
    expect(boat.u).toBeGreaterThan(0);
    expect(boat.u).toBeLessThan(1);
    run(boat, 9);
    expect(boat.u * 3.6).toBeGreaterThan(140);
    expect(boat.u * 3.6).toBeLessThan(170);
    run(boat, 110);
    expect(boat.u * 3.6).toBeCloseTo(511.11, 1);
    expect(boat.distance).toBeGreaterThan(14000);
    expect(distance(origin, boat)).toBeCloseTo(boat.distance, 3);
    expect(boat.fuel).toBeLessThan(shipById("spirit").fuelCapacity);
    expect(boat.fuel).toBeGreaterThan(shipById("spirit").fuelCapacity - 25);
  });

  it("steers progressively at record speed without numerical instability or extra energy", () => {
    const boat = createVessel("spirit", origin);
    boat.u = 511.11 / 3.6;
    boat.engine = 1;
    run(boat, 1, { ...ahead, rudder: 1 });
    // Playable handling target: 5–8 degrees/second after one second, with
    // 50–70 degrees of physical turn in ten seconds and small sideslip.
    expect((boat.yawRate * 180) / Math.PI).toBeGreaterThan(5);
    expect((boat.yawRate * 180) / Math.PI).toBeLessThan(8);
    run(boat, 9, { ...ahead, rudder: 1 });
    expect((boat.heading * 180) / Math.PI).toBeGreaterThan(50);
    expect((boat.heading * 180) / Math.PI).toBeLessThan(70);
    expect(Math.abs(boat.v / boat.u)).toBeLessThan(0.01);
    expect(Math.abs(boat.v)).toBeLessThan(1.5);
    expect(motion(boat, calm).stw).toBeLessThan(511.11 / 3.6);
    expect(Number.isFinite(boat.lat + boat.lon + boat.fuel)).toBe(true);
  });

  it("coasts without fuel and brakes over distance before the slow auxiliary reverse engages", () => {
    const boat = createVessel("spirit", origin);
    run(boat, 120);
    const speed = boat.u;
    const coasting = structuredClone(boat);
    coasting.fuel = 0;
    run(coasting, 10);
    expect(coasting.u).toBeGreaterThan(0);
    expect(coasting.u).toBeLessThan(speed * 0.7);
    expect(coasting.fuel).toBe(0);

    const brakingStart = boat.distance;
    stepVessel(boat, calm, FIXED_DT, undefined, reverse);
    expect(boat.u).toBeGreaterThan(speed * 0.99);
    for (let step = 0; step < 100 / FIXED_DT && boat.u > 0; step++)
      stepVessel(boat, calm, FIXED_DT, undefined, reverse);
    expect(boat.u).toBeLessThanOrEqual(0);
    expect(boat.distance - brakingStart).toBeGreaterThan(2500);
    expect(boat.distance - brakingStart).toBeLessThan(4000);
    run(boat, 120, reverse);
    expect(boat.u).toBeLessThan(-2);
    expect(boat.u).toBeGreaterThan(-3);
  });

  it("matches at 30/60/144 FPS and 100× including high-speed steering, fuel and distance", () => {
    function scenario(fps: number, scale: number) {
      const boat = createVessel("spirit", origin);
      boat.controls = { ...ahead, rudder: 0.12 };
      const sim = new Simulation(boat, calm);
      sim.evolvingWeather = false;
      sim.requestedScale = scale;
      for (let frame = 0; frame < Math.round((120 / scale) * fps); frame++)
        sim.advance(1 / fps);
      return boat;
    }
    const baseline = scenario(30, 1);
    for (const [fps, scale] of [
      [60, 1],
      [144, 1],
      [60, 100],
    ]) {
      const boat = scenario(fps, scale);
      expect(distance(boat, baseline)).toBeLessThan(1e-5);
      expect(boat.heading).toBeCloseTo(baseline.heading, 10);
      expect(boat.u).toBeCloseTo(baseline.u, 10);
      expect(boat.fuel).toBeCloseTo(baseline.fuel, 9);
      expect(boat.distance).toBeCloseTo(baseline.distance, 8);
      expect(boat.simTime).toBeCloseTo(120, 7);
    }
  });

  it("sweeps its complete hull against a thin obstacle at record speed and requesting 100×", () => {
    // A narrow strip has water on both sides, so an endpoint-only test could miss it.
    const obstacle = 30;
    const world: CollisionWorld = {
      clearance: (point) =>
        Math.max(0, Math.abs(obstacle - toLocal(point, origin).x) - 0.1),
      sweep: (from, to, radius) => {
        const a = toLocal(from, origin).x;
        const b = toLocal(to, origin).x;
        return {
          hit:
            Math.min(a, b) - radius <= obstacle + 0.1 &&
            Math.max(a, b) + radius >= obstacle - 0.1,
          kind: "dock",
        };
      },
    };
    const boat = createVessel("spirit", origin, Math.PI / 2);
    boat.u = 511.11 / 3.6;
    boat.engine = 1;
    boat.controls = ahead;
    const sim = new Simulation(boat, calm, world);
    sim.evolvingWeather = false;
    sim.requestedScale = 100;
    let impacts = 0;
    sim.onCollision = () => impacts++;
    for (let frame = 0; frame < 60; frame++) sim.advance(1 / 30);
    expect(impacts).toBeGreaterThan(0);
    expect(sim.activeScale).toBe(1);
    expect(
      toLocal(boat, origin).x + shipById("spirit").length / 2,
    ).toBeLessThan(obstacle);
    expect(boat.damage).toBe(1);
    expect(boat.controls.gear).toBe(0);
    expect(motion(boat, calm).sog).toBeLessThan(1);
  });
});
