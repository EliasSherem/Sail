import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { WaterSpray, STILL_WATER } from "../src/render/WaterSpray";
import { createVessel } from "../src/sim/engine";
import { shipById } from "../src/data/ships";
import type { Quality } from "../src/types";

function setup(quality: Quality = "high") {
  const waves = { uTime: { value: 0 }, uWaves: { value: [new THREE.Vector4(.3, .12, 1, .8), new THREE.Vector4(), new THREE.Vector4()] }, uPhase: { value: new THREE.Vector3(.4, 0, 0) } };
  const spray = new WaterSpray(waves, { value: 1 });
  const ship = shipById("spirit"), state = createVessel("spirit", { lat: 42, lon: 4 });
  state.u = 511.11 / 3.6;
  const interaction = { ...STILL_WATER, quality };
  const point = new THREE.Vector3();
  function update(time: number, x = 0, z = -state.u * time) {
    state.simTime = time; point.set(x, 0, z);
    spray.update(state, point, ship, interaction, 900);
  }
  return { spray, waves, state, interaction, update };
}

describe("water spray emission", () => {
  it("produces dense spray with matching emission at 30/60/144 FPS and 100×", () => {
    const counts: number[] = [];
    for (const [fps, scale] of [[30, 1], [60, 1], [144, 1], [60, 100]]) {
      const { spray, update } = setup();
      update(0);
      for (let frame = 1; frame <= 10 * fps / scale; frame++) update(frame * scale / fps);
      counts.push(spray.activeCount(10));
      expect(spray.points.geometry.drawRange.count).toBeLessThanOrEqual(4096);
    }
    expect(counts[0]).toBeGreaterThan(1000);
    for (const count of counts) expect(Math.abs(count - counts[0])).toBeLessThan(3);
  });

  it("keeps turning spray density and contact positions consistent across frame rates and 100×", () => {
    const results: { count: number; positions: number[] }[] = [];
    for (const [fps, scale] of [[30, 1], [60, 1], [144, 1], [60, 100]]) {
      const { spray, state, update } = setup();
      state.yawRate = .12;
      const radius = state.u / state.yawRate;
      update(0);
      for (let frame = 1; frame <= 10 * fps / scale; frame++) {
        const time = frame * scale / fps;
        state.heading = state.yawRate * time;
        update(time, radius * (1 - Math.cos(state.heading)), -radius * Math.sin(state.heading));
      }
      results.push({ count: spray.activeCount(10), positions: Array.from(spray.points.geometry.attributes.position.array) });
    }
    for (const result of results.slice(1)) {
      expect(Math.abs(result.count - results[0].count)).toBeLessThan(3);
      let maximumDifference = 0;
      for (let i = 0; i < result.positions.length; i++) maximumDifference = Math.max(maximumDifference, Math.abs(result.positions[i] - results[0].positions[i]));
      expect(maximumDifference).toBeLessThan(.1);
    }
  });

  it("freezes the emitted particles in pause and never changes vessel physics", () => {
    const { spray, state, update } = setup();
    update(0); update(1);
    const before = structuredClone(state);
    const geometry = spray.points.geometry;
    const positions = Array.from(geometry.attributes.position.array);
    const births = Array.from(geometry.attributes.aBorn.array);
    const count = spray.activeCount(1);
    for (let i = 0; i < 100; i++) update(1);
    expect(state).toEqual(before);
    expect(Array.from(geometry.attributes.position.array)).toEqual(positions);
    expect(Array.from(geometry.attributes.aBorn.array)).toEqual(births);
    expect(spray.activeCount(1)).toBe(count);
  });

  it("emits from the actual wave surface instead of the camera or hull height", () => {
    const { spray, waves, update } = setup();
    update(0); update(.5);
    const attributes = spray.points.geometry.attributes;
    const wave = waves.uWaves.value[0];
    for (let i = 0; i < spray.points.geometry.drawRange.count; i++) {
      const x = attributes.position.getX(i), y = attributes.position.getY(i), z = attributes.position.getZ(i);
      const birth = attributes.aBorn.getX(i);
      const surface = wave.x * Math.sin(wave.y * (x * Math.sin(wave.z) - z * Math.cos(wave.z)) - wave.w * birth + .4);
      expect(y - surface).toBeGreaterThan(.0599);
      expect(y - surface).toBeLessThan(.09);
    }
  });

  it("retains coasting spray but stops at rest or dock and lets particles expire", () => {
    const { spray, state, update } = setup();
    state.u = 0; state.engine = 1; state.controls.gear = 1;
    update(0); update(1);
    expect(spray.activeCount(1)).toBe(0);
    state.u = 20; state.engine = 0; state.controls.gear = 0;
    update(2); update(3);
    expect(spray.activeCount(3)).toBeGreaterThan(100);
    state.docked = "marseille";
    update(5);
    expect(spray.activeCount(5)).toBe(0);
  });

  it("rebases live particles without moving their geographic trail", () => {
    const { spray, update } = setup();
    update(0, 2100, 0); update(1, 2100, -142);
    const attribute = spray.points.geometry.attributes.position;
    const before = new THREE.Vector3().fromBufferAttribute(attribute, 0);
    spray.rebase(2100, -142);
    expect(attribute.getX(0)).toBeCloseTo(before.x - 2100, 4);
    expect(attribute.getY(0)).toBe(before.y);
    expect(attribute.getZ(0)).toBeCloseTo(before.z + 142, 4);
    const births = Array.from(spray.points.geometry.attributes.aBorn.array);
    update(1, 0, 0);
    expect(Array.from(spray.points.geometry.attributes.aBorn.array)).toEqual(births);
  });

  it("scales density with quality and keeps memory bounded through long steps", () => {
    const counts = [];
    for (const [quality, limit] of [["low", 900], ["medium", 2200], ["high", 4096]] as const) {
      const { spray, update } = setup(quality);
      update(0);
      for (let i = 1; i <= 8; i++) update(i * 2);
      counts.push(spray.activeCount(16));
      expect(spray.points.geometry.drawRange.count).toBeLessThanOrEqual(limit);
      for (const attribute of Object.values(spray.points.geometry.attributes)) expect(Array.from(attribute.array).every(Number.isFinite)).toBe(true);
    }
    expect(counts[2]).toBeGreaterThan(counts[1]);
    expect(counts[1]).toBeGreaterThan(counts[0]);
  });

  it("reconstructs a bounded live plume after a one-second render hitch at 100×", () => {
    const { spray, update } = setup();
    update(0);
    update(100); // 14.2 km of legitimate travel in one delayed render frame.
    expect(spray.activeCount(100)).toBeGreaterThan(1000);
    const count = spray.points.geometry.drawRange.count;
    expect(count).toBeLessThanOrEqual(4096);
    const births = spray.points.geometry.attributes.aBorn;
    const time = spray.points.material.uniforms.uTime.value;
    for (let i = 0; i < count; i++) {
      expect(time - births.getX(i)).toBeGreaterThanOrEqual(-1e-5);
      expect(time - births.getX(i)).toBeLessThanOrEqual(1.81);
    }
  });

  it("clears a true teleport instead of drawing spray through untravelled water", () => {
    const { spray, update } = setup();
    update(0); update(1);
    expect(spray.activeCount(1)).toBeGreaterThan(0);
    update(1.1, 20000); // Impossible 20 km lateral jump in 0.1 simulated seconds.
    expect(spray.activeCount(1.1)).toBe(0);
    expect(spray.points.geometry.drawRange.count).toBe(0);
    update(1.2, 20000);
    expect(spray.activeCount(1.2)).toBeGreaterThan(0);
    const positions = spray.points.geometry.attributes.position;
    for (let i = 0; i < spray.points.geometry.drawRange.count; i++) {
      expect(Math.abs(positions.getX(i) - 20000)).toBeLessThan(2);
    }
  });

  it("sends denser, higher spray from the outer side and mirrors it when turning the other way", () => {
    const results = [];
    for (const sign of [1, -1]) {
      const { spray, state, update } = setup();
      state.u = 100; state.yawRate = sign * .12;
      const radius = state.u / state.yawRate;
      update(0);
      for (let i = 1; i <= 60; i++) {
        const time = i / 60; state.heading = state.yawRate * time;
        update(time, radius * (1 - Math.cos(state.heading)), -radius * Math.sin(state.heading));
      }
      const a = spray.points.geometry.attributes;
      const count = [0, 0], height = [0, 0];
      for (let i = 0; i < spray.points.geometry.drawRange.count; i++) {
        const theta = state.yawRate * a.aBorn.getX(i);
        const dx = a.position.getX(i) - radius * (1 - Math.cos(theta));
        const dz = a.position.getZ(i) + radius * Math.sin(theta);
        const side = dx * Math.cos(theta) + dz * Math.sin(theta) > 0 ? 1 : 0;
        count[side]++; height[side] += a.aVelocity.getY(i);
      }
      const outer = sign > 0 ? 0 : 1, inner = 1 - outer;
      expect(count[outer]).toBeGreaterThan(count[inner] * 2);
      expect(height[outer] / count[outer]).toBeGreaterThan(height[inner] / count[inner] * 1.5);
      results.push(count);
    }
    expect(Math.abs(results[0][0] - results[1][1])).toBeLessThanOrEqual(1);
    expect(Math.abs(results[0][1] - results[1][0])).toBeLessThanOrEqual(1);
  });

  it("inherits the angular contribution at each emitter rather than centre velocity alone", () => {
    const { spray, state, update } = setup();
    const ship = shipById("spirit");
    state.u = 100; state.yawRate = .3;
    update(0);
    const time = 1 / 60, theta = state.yawRate * time, radius = state.u / state.yawRate;
    state.heading = theta;
    const x = radius * (1 - Math.cos(theta)), z = -radius * Math.sin(theta);
    update(time, x, z);
    const a = spray.points.geometry.attributes;
    expect(spray.points.geometry.drawRange.count).toBeGreaterThan(10);
    for (let i = 0; i < spray.points.geometry.drawRange.count; i++) {
      const dx = a.position.getX(i) - x, dz = a.position.getZ(i) - z;
      const fore = dx * Math.sin(theta) - dz * Math.cos(theta);
      const side = dx * Math.cos(theta) + dz * Math.sin(theta);
      const stern = fore < -ship.length * .2;
      const random = a.aKind.getX(i) > .5 ? (a.aLife.getX(i) - 1) / .7 : (a.aLife.getX(i) - .55) / .65;
      const inherited = stern ? .3 + random * .3 : .4 + random * .44;
      const forwardVelocity = a.aVelocity.getX(i) * Math.sin(theta) - a.aVelocity.getZ(i) * Math.cos(theta);
      expect(forwardVelocity).toBeCloseTo((state.u - state.yawRate * side) * inherited, 3);
    }
  });

  it("reverses the loaded side when backing up without reacting to stationary steering", () => {
    const { spray, state, update } = setup();
    state.u = 0; state.controls.rudder = 1; state.engine = 1;
    update(0); update(1);
    expect(spray.activeCount(1)).toBe(0);
    state.u = -20; state.yawRate = .3;
    update(2, 0, 0); update(3, 0, 20);
    const a = spray.points.geometry.attributes;
    let port = 0, starboard = 0;
    for (let i = 0; i < spray.points.geometry.drawRange.count; i++) {
      if (a.aBorn.getX(i) <= 2) continue;
      if (a.position.getX(i) < 0) port++; else starboard++;
    }
    expect(starboard).toBeGreaterThan(port * 1.4);
  });

  it("retains sub-frame particle ages after a long voyage", () => {
    const { spray, update } = setup();
    const start = 60 * 60 * 24 * 3;
    update(start, 0, 0); update(start + 1 / 60, 0, -2.366);
    expect(spray.activeCount(start + 1 / 60)).toBeGreaterThan(0);
    const born = spray.points.geometry.attributes.aBorn.getX(0);
    expect(born).toBeCloseTo(1 / 60, 6);
    expect(spray.points.material.uniforms.uTime.value).toBeCloseTo(1 / 60, 6);
  });
});
