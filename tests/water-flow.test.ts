import { describe, expect, it } from "vitest";
import { contactFlow, outsideWaterLoad, waterPath } from "../src/render/hullFlow";

describe("water contact kinematics", () => {
  it("matches the derivative of a rotating hull point in east/scene-Z coordinates", () => {
    const motion = { heading: 0.7, u: 14, v: -1.2, yawRate: 0.21 };
    const fore = 3.2, side = -1.1, dt = 1e-5;
    const flow = contactFlow(motion, fore, side), centre = contactFlow(motion, 0, 0);
    const before = contactFlow({ ...motion, heading: motion.heading - motion.yawRate * dt }, fore, side);
    const after = contactFlow({ ...motion, heading: motion.heading + motion.yawRate * dt }, fore, side);
    expect(flow.vx).toBeCloseTo((after.offsetX - before.offsetX) / (2 * dt) + centre.vx, 7);
    expect(flow.vz).toBeCloseTo((after.offsetZ - before.offsetZ) / (2 * dt) + centre.vz, 7);
    expect(flow.u).toBeCloseTo(motion.u - motion.yawRate * side, 12);
    expect(flow.v).toBeCloseTo(motion.v + motion.yawRate * fore, 12);
  });

  it("mirrors port/starboard flow and loads the exterior in forward and reverse turns", () => {
    const right = { heading: 0.4, u: 142, v: -1.04, yawRate: 0.12 };
    const left = { heading: -right.heading, u: right.u, v: -right.v, yawRate: -right.yawRate };
    const a = contactFlow(right, 0.5, -1), b = contactFlow(left, 0.5, 1);
    expect(a.vx).toBeCloseTo(-b.vx, 12);
    expect(a.vz).toBeCloseTo(b.vz, 12);
    expect(outsideWaterLoad(right.u, right.v, right.yawRate)).toBeLessThan(0);
    expect(outsideWaterLoad(left.u, left.v, left.yawRate)).toBeGreaterThan(0);
    expect(outsideWaterLoad(-20, 0, 0.3)).toBeGreaterThan(0);
    expect(outsideWaterLoad(-20, 0, -0.3)).toBeLessThan(0);
    expect(outsideWaterLoad(0, 0, 1)).toBe(0);
  });

  it("follows a curving contact path without cutting across its chord", () => {
    const speed = 142, yaw = 0.12, elapsed = 1.67, radius = speed / yaw;
    const theta = yaw * elapsed;
    const a = { x: 0, z: 0, vx: 0, vz: -speed };
    const b = { x: radius * (1 - Math.cos(theta)), z: -radius * Math.sin(theta), vx: speed * Math.sin(theta), vz: -speed * Math.cos(theta) };
    const mid = waterPath(a, b, elapsed, 0.5);
    expect(Math.abs(Math.hypot(mid.x - radius, mid.z) - radius)).toBeLessThan(0.02);
    expect(Math.hypot((a.x + b.x) / 2 - radius, (a.z + b.z) / 2)).toBeLessThan(radius - 5);
    expect(waterPath(a, b, elapsed, 0)).toEqual(a);
    const end = waterPath(a, b, elapsed, 1);
    expect(end.x).toBeCloseTo(b.x, 10); expect(end.z).toBeCloseTo(b.z, 10);
    expect(end.vx).toBeCloseTo(b.vx, 10); expect(end.vz).toBeCloseTo(b.vz, 10);
  });
});
