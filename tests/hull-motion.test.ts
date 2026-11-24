import { describe, expect, it } from "vitest";
import { SHIPS, shipById } from "../src/data/ships";
import { createVessel } from "../src/sim/engine";
import { createWeather, waveAt } from "../src/sim/weather";
import { bridgeHullLook, HullMotion, sampleHullWater } from "../src/render/hullMotion";
import type { HullPose } from "../src/render/hullMotion";

const flat = { ...createWeather("calm"), waveHeight: 0, currentSpeed: 0, windSpeed: 0 };
const rough = createWeather("rough");
const position = { lat: 42, lon: 4 };

describe("visual hull/water interaction", () => {
  it("samples the rendered water under five hull contacts and follows the encounter velocity", () => {
    const ship = shipById("launch"), state = createVessel(ship.id, position, Math.PI / 2);
    state.simTime = 12.3; state.u = 14; state.v = 0.3;
    const east = 2731.4, north = -1957.2;
    const water = sampleHullWater(east, north, state, ship, rough);
    const height = (e: number, n: number, t = state.simTime) => waveAt(e, n, t, rough).height;
    expect(water.center).toBeCloseTo(height(east, north), 12);
    expect(water.bow).toBeCloseTo(height(east + ship.length * 0.38, north), 12);
    expect(water.stern).toBeCloseTo(height(east - ship.length * 0.38, north), 12);
    expect(water.starboard).toBeCloseTo(height(east, north - ship.beam * 0.45), 12);
    expect(water.port).toBeCloseTo(height(east, north + ship.beam * 0.45), 12);
    expect(Math.sign(water.pitch)).toBe(Math.sign(water.bow - water.stern));
    expect(Math.sign(water.roll)).toBe(Math.sign(water.starboard - water.port));
    const vx = state.u + rough.currentSpeed * Math.sin(rough.currentDirection);
    const vn = -state.v + rough.currentSpeed * Math.cos(rough.currentDirection);
    const epsilon = 1e-4, bowEast = east + ship.length * 0.38;
    const derivative = (height(bowEast + vx * epsilon, north + vn * epsilon, state.simTime + epsilon)
      - height(bowEast - vx * epsilon, north - vn * epsilon, state.simTime - epsilon)) / (2 * epsilon);
    expect(water.bowVelocity).toBeCloseTo(derivative, 6);
  });

  it("keeps a stopped boat motionless on flat water and never mutates physical state", () => {
    const ship = shipById("yacht"), state = createVessel(ship.id, position), motion = new HullMotion();
    for (let i = 0; i < 180; i++) {
      state.simTime = i / 60;
      const frozen = Object.freeze(structuredClone(state));
      expect(motion.update(frozen, ship, flat, 0, 0)).toEqual({ height: 0, pitch: 0, roll: 0, impact: 0 });
      expect(frozen).toEqual(state);
    }
  });

  it("adds inertia to swell rather than snapping the hull to each sampled slope", () => {
    const ship = shipById("launch"), state = createVessel(ship.id, position, 0.4), motion = new HullMotion();
    const heights: number[] = [], direct: number[] = [], impacts: number[] = [];
    const pitches: number[] = [], directPitches: number[] = [];
    for (let i = 0; i < 1200; i++) {
      state.simTime = i / 60;
      const pose = motion.update(state, ship, rough, 0, 0);
      if (i > 120) {
        heights.push(pose.height);
        const water = sampleHullWater(0, 0, state, ship, rough);
        direct.push(water.height);
        pitches.push(pose.pitch); directPitches.push(water.pitch);
        impacts.push(pose.impact);
      }
    }
    const curvature = (values: number[]) => values.slice(2).reduce((sum, value, i) => sum + (value - 2 * values[i + 1] + values[i]) ** 2, 0);
    expect(Math.max(...heights) - Math.min(...heights)).toBeGreaterThan(0.7);
    expect(curvature(pitches)).toBeLessThan(curvature(directPitches));
    // Immersion takes priority over heave lag, but must not introduce hard-limit jolts.
    expect(curvature(heights)).toBeLessThan(curvature(direct) * 1.5);
    expect(Math.max(...impacts)).toBeGreaterThan(0);
    expect(Math.max(...impacts)).toBeLessThan(0.2);
  });

  it("freezes spring motion and impact exactly while paused", () => {
    const ship = shipById("spirit"), state = createVessel(ship.id, position), motion = new HullMotion();
    state.u = 80;
    for (let i = 0; i < 180; i++) { state.simTime = i / 60; motion.update(state, ship, rough, 0, state.simTime * state.u); }
    const paused = structuredClone(motion.update(state, ship, rough, 0, state.simTime * state.u));
    for (let frame = 0; frame < 300; frame++) {
      expect(motion.update(state, ship, rough, 0, state.simTime * state.u)).toEqual(paused);
    }
  });

  it.each(SHIPS)("keeps $id immersed and finite under accelerated wave encounters", (ship) => {
    const state = createVessel(ship.id, position, 0.3), motion = new HullMotion();
    state.u = ship.id === "spirit" ? 511.11 / 3.6 : ship.cruiseKnots * 0.514444;
    let maximumImpact = 0;
    for (const scale of [1, 100]) {
      for (let i = 0; i < 240; i++) {
        state.simTime += scale / 60;
        const east = Math.sin(state.heading) * state.u * state.simTime;
        const north = Math.cos(state.heading) * state.u * state.simTime;
        const water = sampleHullWater(east, north, state, ship, rough);
        const pose = motion.update(state, ship, rough, east, north);
        expect(Object.values(pose).every(Number.isFinite)).toBe(true);
        expect(Math.abs(pose.height - water.height)).toBeLessThan(ship.draft * 0.25 + 0.09);
        expect(Math.abs(pose.pitch)).toBeLessThanOrEqual(0.125);
        expect(Math.abs(pose.roll)).toBeLessThanOrEqual(0.165);
        expect(pose.impact).toBeGreaterThanOrEqual(0);
        expect(pose.impact).toBeLessThanOrEqual(1);
        maximumImpact = Math.max(maximumImpact, pose.impact);
      }
    }
    expect(maximumImpact).toBeGreaterThan(0);
  });

  it("leans into a turn and settles its acceleration trim without changing physical motion", () => {
    const ship = shipById("launch"), state = createVessel(ship.id, position), motion = new HullMotion();
    let accelerationPitch = 0;
    for (let i = 0; i <= 300; i++) {
      state.simTime = i / 60; state.u = i / 30; state.yawRate = 0.09;
      const before = structuredClone(state), pose = motion.update(state, ship, flat, 0, i * 0.1);
      expect(state).toEqual(before);
      accelerationPitch = Math.max(accelerationPitch, pose.pitch);
    }
    const right = structuredClone(motion.update(state, ship, flat, 0, 30));
    expect(accelerationPitch).toBeGreaterThan(0.004);
    expect(right.roll).toBeLessThan(-0.01);
    state.yawRate = -0.09;
    for (let i = 0; i < 240; i++) { state.simTime += 1 / 60; motion.update(state, ship, flat, 0, 30); }
    expect(motion.update(state, ship, flat, 0, 30).roll).toBeGreaterThan(0.01);
  });

  it("resets history for a new vessel, a time rewind or an explicit geographic teleport", () => {
    const motion = new HullMotion();
    const first = createVessel("launch", position); first.u = 15; first.yawRate = 0.1;
    for (let i = 0; i < 120; i++) { first.simTime = i / 60; motion.update(first, shipById("launch"), rough, 30, 50); }
    const next = createVessel("cargo", position); next.simTime = 5;
    expect(motion.update(next, shipById("cargo"), rough, 520, 300))
      .toEqual(new HullMotion().update(next, shipById("cargo"), rough, 520, 300));
    next.simTime = 1;
    expect(motion.update(next, shipById("cargo"), rough, 1200, 2400))
      .toEqual(new HullMotion().update(next, shipById("cargo"), rough, 1200, 2400));
    motion.reset();
    expect(motion.update(next, shipById("cargo"), rough, 200000, 600000))
      .toEqual(new HullMotion().update(next, shipById("cargo"), rough, 200000, 600000));
  });

  it("repositions once when the user explicitly changes the paused sea", () => {
    const ship = shipById("launch"), state = createVessel(ship.id, position), motion = new HullMotion();
    state.simTime = 20;
    motion.update(state, ship, flat, 300, 40);
    const changed = structuredClone(motion.update(state, ship, rough, 300, 40));
    expect(changed).toEqual(new HullMotion().update(state, ship, rough, 300, 40));
    expect(motion.update(state, ship, rough, 300, 40)).toEqual(changed);
  });

  it("retains a continuous water frame across scene-origin rebases", () => {
    const ship = shipById("spirit"), state = createVessel(ship.id, position, Math.PI / 2);
    const reference = new HullMotion(), rebased = new HullMotion(); state.u = 100;
    let localOrigin = 0;
    for (let i = 0; i < 180; i++) {
      state.simTime = i / 30;
      const worldEast = 1990 + state.u * state.simTime;
      if (worldEast - localOrigin > 2000) localOrigin = worldEast;
      const a = structuredClone(reference.update(state, ship, rough, worldEast, 0));
      const b = rebased.update(state, ship, rough, worldEast - localOrigin + localOrigin, 0);
      expect(b).toEqual(a);
    }
  });

  it("stabilizes the first-person gaze while retaining a response to hull attitude", () => {
    const pose: HullPose = { height: 0.3, pitch: 0.06, roll: -0.08, impact: 0.7 };
    const look = bridgeHullLook(pose);
    expect(look.pitch).toBeGreaterThan(0);
    expect(look.pitch).toBeLessThan(pose.pitch);
    expect(look.roll).toBeLessThan(0);
    expect(Math.abs(look.roll)).toBeLessThan(Math.abs(pose.roll));
    expect(pose).toEqual({ height: 0.3, pitch: 0.06, roll: -0.08, impact: 0.7 });
  });
});
