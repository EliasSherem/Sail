import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { WaterEffects } from "../src/render/WaterEffects";
import { shipById } from "../src/data/ships";
import { createVessel } from "../src/sim/engine";

const ship = shipById("yacht");
function setup() {
  const effects = new WaterEffects({ uTime: { value: 0 }, uWaves: { value: [] }, uPhase: { value: new THREE.Vector3() } });
  const state = createVessel("yacht", { lat: 43, lon: 5 });
  const geometry = (effects.group.children[0] as THREE.Mesh).geometry;
  const point = new THREE.Vector3();
  function update(time: number, x = point.x, z = point.z, originX = 0, originZ = 0) {
    state.simTime = time;
    point.set(x, 0, z);
    effects.update(state, point, ship, originX, originZ, 1, 1000);
  }
  function center(row: number) {
    const positions = geometry.attributes.position;
    return new THREE.Vector2(positions.getX(row * 13 + 6), positions.getZ(row * 13 + 6));
  }
  return { effects, state, geometry, update, center };
}

describe("water motion references", () => {
  it("leaves the wake centerline where the vessel travelled when it turns", () => {
    const { state, update, center, geometry } = setup();
    state.u = 4;
    update(0);
    const initial = center(0);
    update(1, 0, -4);
    state.heading = Math.PI / 2;
    update(2, 3, -6);
    expect(center(0).distanceTo(initial)).toBeLessThan(1e-6);
    expect(geometry.drawRange.count).toBeGreaterThan(72);
    // The trail has several distinct geographic points, rather than one plane
    // rotating with the ship or extending all the way back before it has moved.
    expect(center(1).distanceTo(initial)).toBeGreaterThan(0.1);
  });

  it("shows propwash immediately under power without inventing a travelled path", () => {
    const { effects, state, update, geometry } = setup();
    state.engine = .8;
    state.controls.gear = 1;
    update(0);
    update(1);
    expect(geometry.drawRange.count).toBe(0);
    const stern = effects.group.children[1] as THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
    expect(stern.material.uniforms.uPower.value).toBeGreaterThan(.7);
    state.controls.gear = 0;
    update(2);
    expect(stern.material.uniforms.uPower.value).toBe(0);
  });

  it("retains inertial coasting foam, then lets its history expire", () => {
    const { state, update, geometry } = setup();
    state.u = 3;
    state.controls.gear = 0;
    update(0);
    update(1, 0, -3);
    expect(geometry.drawRange.count).toBeGreaterThan(0);
    state.u = 0;
    update(40, 0, -3);
    expect(geometry.drawRange.count).toBe(0);
  });

  it("uses water speed for jet hydroplane foam and preserves coasting contact spray", () => {
    const { effects } = setup();
    const jet = shipById("spirit"), state = createVessel("spirit", { lat: 42, lon: 4 });
    state.engine = 1;
    state.controls.gear = 1;
    const point = new THREE.Vector3();
    const stern = effects.group.children[1] as THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
    const contact = effects.group.getObjectByName("planing-contact-1") as THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
    effects.update(state, point, jet, 0, 0, 1, 900);
    expect(stern.material.uniforms.uPower.value).toBe(0);
    expect(contact.material.uniforms.uPower.value).toBe(0);
    state.u = 511.11 / 3.6;
    state.controls.gear = 0;
    state.simTime = 1;
    effects.update(state, point.set(0, 0, -state.u), jet, 0, 0, 1, 900);
    expect(contact.visible).toBe(true);
    expect(contact.material.uniforms.uPower.value).toBe(1);
    state.docked = "marseille";
    effects.update(state, point, jet, 0, 0, 1, 900);
    expect(contact.visible).toBe(false);
  });

  it("rebases existing history without changing its position relative to the vessel", () => {
    const { effects, state, update, center } = setup();
    state.u = 4;
    update(0, 2100, 200);
    update(1, 2100, 196);
    const before = center(0);
    effects.rebase(2100, 196);
    state.u = 0;
    update(1, 0, 0, 2100, 196);
    expect(center(0).x).toBeCloseTo(before.x - 2100, 4);
    expect(center(0).y).toBeCloseTo(before.y - 196, 4);
  });

  it("keeps legal 100× hitch travel but clears a genuine teleport", () => {
    const { effects, geometry } = setup();
    const jet = shipById("spirit"), state = createVessel("spirit", { lat: 42, lon: 4 });
    const point = new THREE.Vector3(); state.u = 511.11 / 3.6;
    effects.update(state, point, jet, 0, 0, 1, 900);
    state.simTime = 100;
    point.z = -state.u * 100;
    effects.update(state, point, jet, 0, 0, 1, 900);
    expect(geometry.drawRange.count).toBeGreaterThan(0);
    expect(geometry.drawRange.count).toBeLessThanOrEqual(383 * 12 * 6);
    const spray = effects.group.getObjectByName("water-droplets-and-mist") as THREE.Points;
    expect(spray.geometry.drawRange.count).toBeGreaterThan(1000);
    expect(spray.geometry.drawRange.count).toBeLessThanOrEqual(4096);
    state.simTime = 100.1; point.x = 20000;
    effects.update(state, point, jet, 0, 0, 1, 900);
    expect(geometry.drawRange.count).toBe(0);
    expect(spray.geometry.drawRange.count).toBe(0);
  });

  it("orients the wake across actual sideways motion instead of the hull heading", () => {
    const { state, update, geometry } = setup();
    state.u = 4; state.v = 3;
    update(0); update(1, 3, -4);
    const row = geometry.drawRange.count / (12 * 6), p = geometry.attributes.position;
    const dx = p.getX(row * 13 + 12) - p.getX(row * 13);
    const dz = p.getZ(row * 13 + 12) - p.getZ(row * 13);
    expect(Math.abs((dx * 3 - dz * 4) / Math.hypot(dx, dz))).toBeLessThan(1e-5);
  });

  it("lays a curved wake through a 100× turn and freezes the old loaded side on countersteer", () => {
    const { effects, geometry } = setup();
    const jet = shipById("spirit"), state = createVessel("spirit", { lat: 42, lon: 4 });
    state.u = 142; state.yawRate = .12;
    const radius = state.u / state.yawRate, point = new THREE.Vector3();
    effects.update(state, point, jet, 0, 0, 1, 900);
    state.simTime = 100 / 60; state.heading = state.yawRate * state.simTime;
    point.set(radius * (1 - Math.cos(state.heading)), 0, -radius * Math.sin(state.heading));
    effects.update(state, point, jet, 0, 0, 1, 900);
    const rows = geometry.drawRange.count / (12 * 6) + 1;
    const p = geometry.attributes.position, energy = geometry.attributes.aEnergy;
    const contactRadius = Math.hypot(radius, jet.length * .46);
    for (let row = 0; row < rows; row++) {
      const index = row * 13 + 6;
      expect(Math.abs(Math.hypot(p.getX(index) - radius, p.getZ(index)) - contactRadius)).toBeLessThan(.03);
    }
    expect(energy.getX(0)).toBeGreaterThan(energy.getX(12));
    const oldCentre = [p.getX(6), p.getZ(6)], oldEnergy = [energy.getX(0), energy.getX(12)];
    state.yawRate = -.12; state.simTime += 1;
    point.x += state.u * Math.sin(state.heading); point.z -= state.u * Math.cos(state.heading);
    effects.update(state, point, jet, 0, 0, 1, 900);
    expect([p.getX(6), p.getZ(6)]).toEqual(oldCentre);
    expect([energy.getX(0), energy.getX(12)]).toEqual(oldEnergy);
    const lastRow = geometry.drawRange.count / (12 * 6);
    expect(energy.getX(lastRow * 13 + 12)).toBeGreaterThan(energy.getX(lastRow * 13));
    const port = effects.group.getObjectByName("planing-contact--1") as THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
    const starboard = effects.group.getObjectByName("planing-contact-1") as THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
    expect(starboard.material.uniforms.uPower.value).toBeGreaterThan(port.material.uniforms.uPower.value);
    expect(starboard.scale.x).toBeGreaterThan(port.scale.x);
  });

  it("does not emit duplicate history while simulation time is paused", () => {
    const { state, update, geometry } = setup();
    state.u = 5;
    update(0);
    update(1, 0, -5);
    const indices = geometry.drawRange.count;
    for (let i = 0; i < 100; i++) update(1, 0, -5);
    expect(geometry.drawRange.count).toBe(indices);
  });
});
