import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { dolphinPose, MarineLife } from "../src/render/MarineLife";
import { createVessel } from "../src/sim/engine";
import { createWeather } from "../src/sim/weather";
import { PORTS } from "../src/data/ports";
import { distance, fromLocal } from "../src/geo/math";
import type { VesselState } from "../src/types";

const state = () => createVessel("yacht", PORTS[0], 0);
const snapshot = (group: THREE.Group) => {
  const result: unknown[] = [];
  group.traverse(object => result.push([object.name, object.visible, ...object.position.toArray(), ...object.quaternion.toArray(), ...object.scale.toArray()]));
  return result;
};
const visible = (group: THREE.Group, name: string) => group.children.filter(child => child.name.startsWith(name) && child.visible).length;
const position = (life: MarineLife, name: string) => {
  life.group.updateMatrixWorld(true);
  return life.group.getObjectByName(name)!.getWorldPosition(new THREE.Vector3());
};
const geographic = (life: MarineLife, name: string, boat: VesselState, point: THREE.Vector3) => {
  const p = position(life, name);
  return fromLocal(p.x - point.x, p.z - point.z, boat);
};
const phaseTime = (index: number, fraction: number) => {
  const pose = dolphinPose(index, 0);
  return (1 - index * .173) * pose.cycleDuration + fraction * pose.flightDuration;
};

describe("bounded marine wildlife", () => {
  it("animates visible dolphins and birds with the visual clock, independently of simulation acceleration", () => {
    const life = new MarineLife(), boat = state(), weather = createWeather(), point = new THREE.Vector3(20, 2, -10);
    const before = structuredClone(boat);
    life.update(boat, point, weather, 0, "high", true, () => 0);
    const initial = snapshot(life.group);
    life.update(boat, point, weather, 2, "high", true, () => 0);
    expect(snapshot(life.group)).not.toEqual(initial);
    const animated = snapshot(life.group);
    boat.simTime = 200_000;
    life.update(boat, point, weather, 2, "high", true, () => 0);
    expect(snapshot(life.group)).toEqual(animated);
    expect({ ...boat, simTime: before.simTime }).toEqual(before);
    expect(visible(life.group, "dolphin-")).toBe(5);
    expect(visible(life.group, "gull-")).toBe(8);
    expect(life.group.getObjectByName("humpback-whale")!.visible).toBe(true);
  });

  it("uses the ocean sampler in current local coordinates and follows origin changes exactly", () => {
    const life = new MarineLife(), boat = state(), weather = createWeather();
    const calls: [number, number][] = [];
    life.update(boat, new THREE.Vector3(200, 10, -50), weather, 3, "high", true, (x, z) => { calls.push([x, z]); return 2; });
    const dolphin = life.group.getObjectByName("dolphin-0")!;
    const baseY = dolphin.position.y;
    expect(calls[0][0]).toBeCloseTo(200 + dolphin.position.x);
    expect(calls[0][1]).toBeCloseTo(-50 + dolphin.position.z);
    const relative = snapshot(life.group).slice(1);
    life.update(boat, new THREE.Vector3(-1800, 0, 950), weather, 3, "high", true, () => 2);
    expect(snapshot(life.group).slice(1)).toEqual(relative);
    expect(life.group.position.toArray()).toEqual([-1800, 0, 950]);
    life.update(boat, new THREE.Vector3(-1800, 0, 950), weather, 3, "high", true, () => 5);
    expect(dolphin.position.y - baseY).toBeCloseTo(3);
  });

  it("reduces activity by quality and weather, and disables the entire group", () => {
    const life = new MarineLife(), boat = state(), point = new THREE.Vector3();
    life.update(boat, point, createWeather(), 10, "low", true);
    expect(visible(life.group, "dolphin-")).toBe(2);
    expect(visible(life.group, "gull-")).toBe(3);
    expect(life.group.getObjectByName("humpback-whale")!.visible).toBe(false);
    life.update(boat, point, createWeather("storm"), 10, "high", true);
    expect(visible(life.group, "dolphin-")).toBe(0);
    expect(visible(life.group, "gull-")).toBe(1);
    life.update(boat, point, createWeather("hurricane"), 10, "high", true);
    expect(life.group.visible).toBe(false);
    life.update(boat, point, createWeather(), 10, "high", false);
    expect(life.group.visible).toBe(false);
  });

  it("keeps finite local transforms and reuses fixed geometry over long voyages", () => {
    const life = new MarineLife(), boat = state(), point = new THREE.Vector3();
    const geometries: THREE.BufferGeometry[] = [];
    life.group.traverse(object => { if (object instanceof THREE.Mesh || object instanceof THREE.Points) geometries.push(object.geometry); });
    expect(geometries.length).toBeLessThan(50);
    const vertices = geometries.reduce((sum, geometry) => sum + geometry.getAttribute("position").count, 0);
    expect(vertices).toBeLessThan(40_000);
    for (let i = 0; i < 400; i++) {
      boat.heading = i * .127;
      life.update(boat, point, createWeather(), i * 250.31, "high", true);
      for (const child of life.group.children) {
        expect(child.position.toArray().every(Number.isFinite)).toBe(true);
        // Independent swimmers may leave the view, while geometry stays fixed
        // and their own travel remains bounded by 7 m/s plus initial offsets.
        expect(child.position.length()).toBeLessThan(i * 250.31 * 7 + 200);
      }
    }
    const after: THREE.BufferGeometry[] = [];
    life.group.traverse(object => { if (object instanceof THREE.Mesh || object instanceof THREE.Points) after.push(object.geometry); });
    expect(after).toEqual(geometries);
  });

  it("uses a short ballistic breach for each dolphin, with forward travel and still flukes in flight", () => {
    for (let i = 0; i < 5; i++) {
      const start = phaseTime(i, 0), launch = dolphinPose(i, start);
      expect(launch.flightDuration).toBeGreaterThanOrEqual(1.05);
      expect(launch.flightDuration).toBeLessThanOrEqual(1.3);
      expect(launch.flightDuration / launch.cycleDuration).toBeLessThan(.17);
      for (const fraction of [.1, .5, .9]) {
        const t = phaseTime(i, fraction), pose = dolphinPose(i, t), epsilon = .001;
        const before = dolphinPose(i, t - epsilon), after = dolphinPose(i, t + epsilon);
        expect(pose.airborne).toBe(true);
        expect(pose.height).toBeGreaterThan(0);
        expect(pose.forwardVelocity).toBeGreaterThan(4);
        expect(pose.tailStroke).toBe(0);
        expect((after.height - before.height) / (2 * epsilon)).toBeCloseTo(pose.verticalVelocity, 7);
        expect((after.verticalVelocity - before.verticalVelocity) / (2 * epsilon)).toBeCloseTo(-9.81, 7);
        expect((after.forward - before.forward) / (2 * epsilon)).toBeCloseTo(pose.forwardVelocity, 6);
        if (fraction === .1) expect(pose.verticalVelocity).toBeGreaterThan(0);
        if (fraction === .5) expect(Math.abs(pose.verticalVelocity)).toBeLessThan(1e-10);
        if (fraction === .9) expect(pose.verticalVelocity).toBeLessThan(0);
      }
      const submerged = dolphinPose(i, start + launch.flightDuration + 2);
      expect(submerged.height).toBeLessThan(-3);
      expect(submerged.airborne).toBe(false);
      expect(Math.abs(submerged.tailStroke)).toBeGreaterThan(.01);
    }
  });

  it("joins flight, diving and submerged swimming continuously without horizontal rewinds", () => {
    for (let i = 0; i < 5; i++) {
      const start = phaseTime(i, 0), pose = dolphinPose(i, start), epsilon = 1e-5;
      for (const dt of [0, pose.flightDuration, pose.flightDuration + .85, pose.cycleDuration - .85, pose.cycleDuration]) {
        const before = dolphinPose(i, start + dt - epsilon), after = dolphinPose(i, start + dt + epsilon);
        expect(Math.abs(after.height - before.height)).toBeLessThan(.0002);
        expect(Math.abs(after.verticalVelocity - before.verticalVelocity)).toBeLessThan(.001);
        expect(Math.abs(after.right - before.right)).toBeLessThan(.00002);
        expect(after.forward).toBeGreaterThan(before.forward);
        expect(after.forward - before.forward).toBeLessThan(.0002);
      }
    }
  });

  it("points every dolphin nose along its ascent, apex and descent at all headings", () => {
    const weather = createWeather(), point = new THREE.Vector3();
    for (const heading of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
      const life = new MarineLife(), boat = state(); boat.heading = heading;
      life.update(boat, point, weather, 0, "high", true);
      for (let i = 0; i < 5; i++) for (const fraction of [.15, .5, .85]) {
        const t = phaseTime(i, fraction), name = `dolphin-${i}`, epsilon = .001;
        life.update(boat, point, weather, t - epsilon, "high", true);
        const before = position(life, name);
        life.update(boat, point, weather, t + epsilon, "high", true);
        const tangent = position(life, name).sub(before).normalize();
        life.update(boat, point, weather, t, "high", true);
        const nose = new THREE.Vector3(0, 0, -1).applyQuaternion(life.group.getObjectByName(name)!.quaternion);
        expect(nose.dot(tangent)).toBeGreaterThan(.999999);
        if (fraction === .15) expect(nose.y).toBeGreaterThan(.3);
        if (fraction === .5) expect(Math.abs(nose.y)).toBeLessThan(1e-10);
        if (fraction === .85) expect(nose.y).toBeLessThan(-.3);
      }
    }
  });

  it("keeps the whale's slow surfacing pitch tangent and never launches it into a dolphin breach", () => {
    const life = new MarineLife(), boat = state(), point = new THREE.Vector3(), weather = createWeather();
    life.update(boat, point, weather, 0, "high", true);
    for (const t of [1, 10, 24]) {
      life.update(boat, point, weather, t - .001, "high", true);
      const before = position(life, "humpback-whale");
      life.update(boat, point, weather, t + .001, "high", true);
      const tangent = position(life, "humpback-whale").sub(before).normalize();
      life.update(boat, point, weather, t, "high", true);
      const whale = life.group.getObjectByName("humpback-whale")!;
      const nose = new THREE.Vector3(0, 0, -1).applyQuaternion(whale.quaternion);
      expect(nose.dot(tangent)).toBeGreaterThan(.999999);
      expect(whale.position.y).toBeLessThanOrEqual(-.3);
      expect(Math.abs(nose.y)).toBeLessThan(.06);
    }
  });

  it("retains geographic wildlife positions when the observer moves, turns, accelerates or rebases", () => {
    const life = new MarineLife(), reference = new MarineLife(), boat = state(), original = state();
    const weather = createWeather(), point = new THREE.Vector3(), zero = new THREE.Vector3();
    for (const animal of [life, reference]) { animal.update(original, zero, weather, 0, "high", true); animal.update(original, zero, weather, 2, "high", true); }
    const names = ["dolphin-0", "dolphin-4", "humpback-whale", "gull-0", "gull-7"];
    const before = names.map(name => geographic(life, name, boat, point));
    const rotations = names.map(name => life.group.getObjectByName(name)!.quaternion.clone());
    Object.assign(boat, fromLocal(300, 125, original), { heading: Math.PI, u: 142, v: 20, yawRate: .4 });
    point.set(300, 0, 125);
    life.update(boat, point, weather, 2, "high", true);
    names.forEach((name, i) => {
      expect(distance(geographic(life, name, boat, point), before[i])).toBeLessThan(.00001);
      expect(life.group.getObjectByName(name)!.quaternion.equals(rotations[i])).toBe(true);
    });
    point.set(-1900, 0, 725);
    life.update(boat, point, weather, 2, "high", true);
    names.forEach((name, i) => expect(distance(geographic(life, name, boat, point), before[i])).toBeLessThan(.00001));
    life.update(boat, point, weather, 3, "high", true);
    reference.update(original, zero, weather, 3, "high", true);
    names.forEach(name => expect(distance(geographic(life, name, boat, point), geographic(reference, name, original, zero))).toBeLessThan(.00001));
  });

  it("lets the encounter leave the observer without replacing it nearby, including after a pause", () => {
    const life = new MarineLife(), boat = state(), original = state(), point = new THREE.Vector3(), weather = createWeather();
    life.update(boat, point, weather, 0, "high", true);
    life.update(boat, point, weather, 20, "high", true);
    const previous = geographic(life, "dolphin-0", boat, point);
    Object.assign(boat, fromLocal(3000, 0, original)); point.set(3000, 0, 0);
    life.update(boat, point, weather, 20, "high", true);
    expect(distance(geographic(life, "dolphin-0", boat, point), previous)).toBeLessThan(.00001);
    expect(distance(geographic(life, "dolphin-0", boat, point), boat)).toBeGreaterThan(2200);
    life.update(boat, point, weather, 20.1, "high", true);
    expect(distance(geographic(life, "dolphin-0", boat, point), boat)).toBeGreaterThan(2200);
    expect(distance(geographic(life, "dolphin-0", boat, point), previous)).toBeLessThan(1);
    for (let second = 21; second <= 750; second++) {
      life.update(original, new THREE.Vector3(), weather, second, "high", true);
      expect(position(life, "dolphin-0").length()).toBeGreaterThan(second * 5);
    }
  });

  it("suppresses land breaches below the surface and bounds coastline queries by swimming cycles", () => {
    let calls = 0;
    const life = new MarineLife(() => { calls++; return false; }), boat = state(), point = new THREE.Vector3(), weather = createWeather();
    life.update(boat, point, weather, 0, "high", true);
    for (let frame = 1; frame <= 60; frame++) {
      life.update(boat, point, weather, frame / 60, "high", true);
      for (let i = 0; i < 5; i++) expect(life.group.getObjectByName(`dolphin-${i}`)!.position.y).toBeLessThan(-3);
      expect(life.group.getObjectByName("humpback-whale")!.position.y).toBeLessThan(-7);
      expect(life.group.getObjectByName("whale-breath")!.visible).toBe(false);
    }
    expect(calls).toBeLessThan(150);
  });

  it("uses the renderer origin exactly at high latitude and preserves geography across a true rebase", () => {
    const life = new MarineLife(), boat = createVessel("cargo", { lat: 64.1, lon: -21.8 }, .7);
    const weather = createWeather(), origin = { lat: boat.lat, lon: boat.lon }, point = new THREE.Vector3();
    life.update(boat, point, weather, 0, "high", true, () => 0, origin);
    life.update(boat, point, weather, 30, "high", true, () => 0, origin);
    const names = ["dolphin-0", "dolphin-4", "humpback-whale", "gull-0"];
    const before = names.map(name => position(life, name));
    Object.assign(boat, fromLocal(1900, 300, origin), { shipId: "spirit", heading: 2, u: 142, v: 20 });
    point.set(1900, 0, 300);
    life.update(boat, point, weather, 30, "high", true, () => 0, origin);
    names.forEach((name, i) => expect(position(life, name).distanceTo(before[i])).toBeLessThan(1e-10));
    const rebase = { lat: boat.lat, lon: boat.lon };
    life.update(boat, new THREE.Vector3(), weather, 30, "high", true, () => 0, rebase);
    names.forEach((name, i) => {
      const after = position(life, name);
      expect(distance(fromLocal(after.x, after.z, rebase), fromLocal(before[i].x, before[i].z, origin))).toBeLessThan(.00001);
    });
  });

  it("dives the whale smoothly toward coastline instead of snapping it to a new height", () => {
    let water = true;
    const life = new MarineLife(() => water), boat = state(), point = new THREE.Vector3(), weather = createWeather();
    life.update(boat, point, weather, 0, "high", true);
    life.update(boat, point, weather, 5, "high", true);
    const before = position(life, "humpback-whale").y;
    water = false;
    life.update(boat, point, weather, 5.001, "high", true);
    expect(Math.abs(position(life, "humpback-whale").y - before)).toBeLessThan(.02);
    const paused = snapshot(life.group);
    life.update(boat, point, weather, 5.001, "high", true);
    expect(snapshot(life.group)).toEqual(paused);
    for (let frame = 1; frame <= 300; frame++) life.update(boat, point, weather, 5.001 + frame / 60, "high", true);
    expect(position(life, "humpback-whale").y).toBeLessThan(-7);
  });
});
