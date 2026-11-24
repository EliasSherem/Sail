import * as THREE from "three";
import type { ShipConfig, VesselState } from "../types";
import { wakeFragment, wakeVertex, washFragment, washVertex } from "./oceanShaders";
import { WaterSpray, STILL_WATER, type WaterInteraction } from "./WaterSpray";
import { contactFlow, outsideWaterLoad, waterPath } from "./hullFlow";
export type { WaterInteraction } from "./WaterSpray";

type Uniforms = Record<string, THREE.IUniform>;
interface WakeSample { x: number; z: number; course: number; time: number; energy: number; travel: number; speed: number; vx: number; vz: number; load: number }
const ROWS = 384, COLUMNS = 13, LIFETIME = 38;

/** Foam is left at the water positions the hull actually visited, including turns.
 * Rebase translates that history with the floating origin, never with the boat. */
export class WaterEffects {
  readonly group = new THREE.Group();
  private samples: WakeSample[] = [];
  private geometry = new THREE.BufferGeometry();
  private positions = new Float32Array(ROWS * COLUMNS * 3);
  private ages = new Float32Array(ROWS * COLUMNS);
  private energy = new Float32Array(ROWS * COLUMNS);
  private uvs = new Float32Array(ROWS * COLUMNS * 2);
  private wake: THREE.Mesh;
  private stern: THREE.Mesh;
  private bow: THREE.Mesh;
  private contacts: THREE.Mesh[] = [];
  private spray: WaterSpray;
  private travelled = 0;
  private day = { value: 1 };
  private waveOrigin = { value: new THREE.Vector2() };

  constructor(waves: Uniforms) {
    this.geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute("aAge", new THREE.BufferAttribute(this.ages, 1).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute("aEnergy", new THREE.BufferAttribute(this.energy, 1).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute("uv", new THREE.BufferAttribute(this.uvs, 2));
    const indices: number[] = [];
    for (let row = 0; row < ROWS - 1; row++) for (let column = 0; column < COLUMNS - 1; column++) {
      const a = row * COLUMNS + column, b = a + COLUMNS;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
    this.geometry.setIndex(indices);
    this.geometry.setDrawRange(0, 0);
    const common = { ...waves, uOrigin: this.waveOrigin, uDay: this.day };
    this.wake = new THREE.Mesh(this.geometry, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: wakeVertex, fragmentShader: wakeFragment, uniforms: common,
    }));
    this.wake.frustumCulled = false;
    this.wake.renderOrder = 1;
    this.group.add(this.wake);
    const washGeometry = new THREE.PlaneGeometry(1, 1, 10, 16);
    washGeometry.rotateX(-Math.PI / 2);
    this.stern = new THREE.Mesh(washGeometry, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: washVertex, fragmentShader: washFragment,
      uniforms: { ...common, uPower: { value: 0 }, uKind: { value: 0 } },
    }));
    this.bow = new THREE.Mesh(washGeometry, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: washVertex, fragmentShader: washFragment,
      uniforms: { ...common, uPower: { value: 0 }, uKind: { value: 1 } },
    }));
    this.stern.frustumCulled = this.bow.frustumCulled = false;
    this.stern.renderOrder = this.bow.renderOrder = 2;
    this.group.add(this.stern, this.bow);
    // The jet hydroplane throws water from its two forward planing surfaces.
    for (const side of [-1, 1]) {
      const contact = new THREE.Mesh(washGeometry, new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: washVertex, fragmentShader: washFragment,
        uniforms: { ...common, uPower: { value: 0 }, uKind: { value: 0 } },
      }));
      contact.name = `planing-contact-${side}`;
      contact.visible = false;
      contact.frustumCulled = false;
      contact.renderOrder = 2;
      this.contacts.push(contact);
      this.group.add(contact);
    }
    this.spray = new WaterSpray(waves, this.day);
    this.group.add(this.spray.points);
  }

  clear() { this.samples = []; this.spray.clear(); this.travelled = 0; this.geometry.setDrawRange(0, 0); }
  rebase(x: number, z: number) {
    for (const s of this.samples) { s.x -= x; s.z -= z; }
    this.spray.rebase(x, z);
  }
  update(state: VesselState, point: THREE.Vector3, ship: ShipConfig, originX: number, originZ: number, day: number, viewportHeight: number, interaction: WaterInteraction = STILL_WATER) {
    this.day.value = day;
    this.waveOrigin.value.set(originX % 16384, -originZ % 16384);
    const time = state.simTime, speed = Math.hypot(state.u, state.v);
    const hydroplane = ship.id === "spirit";
    const planing = hydroplane ? Math.min(1, speed / 45) : 0;
    const forwardX = Math.sin(state.heading), forwardZ = -Math.cos(state.heading);
    const reverse = state.u < -.1 ? -1 : 1;
    const turnLoad = outsideWaterLoad(state.u, state.v, state.yawRate);
    const sternFlow = contactFlow(state, -ship.length * .46 * reverse, 0);
    const sternX = point.x + sternFlow.offsetX, sternZ = point.z + sternFlow.offsetZ;
    const course = sternFlow.speed > .1 ? sternFlow.course : state.heading + (reverse < 0 ? Math.PI : 0);
    const trailX = Math.sin(course), trailZ = -Math.cos(course);
    const wakeLoad = turnLoad * Math.cos(course - state.heading);
    let last = this.samples.at(-1);
    if (last) {
      const elapsed = time - last.time;
      const expectedTravel = (Math.max(last.speed, speed) + 1) * Math.max(0, elapsed);
      // The stern can also move by nearly a ship length during a heading change.
      const movementLimit = Math.max(128, ship.length * 1.2, expectedTravel * 1.25 + ship.length);
      if (elapsed < 0 || Math.hypot(sternX - last.x, sternZ - last.z) > movementLimit) { this.clear(); last = undefined; }
    }
    const propulsion = state.docked ? 0 : state.engine * Math.abs(state.controls.gear);
    if (!state.docked && speed > .12 && (!last || (time - last.time > .16 && Math.hypot(sternX - last.x, sternZ - last.z) > .12))) {
      const gap = last ? Math.hypot(sternX - last.x, sternZ - last.z) : 0;
      const steps = last ? Math.min(16, Math.max(1, Math.ceil(gap / Math.max(.75, ship.beam * .35)))) : 1;
      const energy = Math.min(1, speed / 5 + propulsion * .2 + interaction.impact * .2);
      const endpoint = { x: sternX, z: sternZ, vx: sternFlow.vx, vz: sternFlow.vz };
      let previousX = last?.x ?? sternX, previousZ = last?.z ?? sternZ;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const path = last ? waterPath(last, endpoint, time - last.time, t) : endpoint;
        const travel = this.travelled + Math.hypot(path.x - previousX, path.z - previousZ);
        this.travelled = travel;
        const pathCourse = Math.hypot(path.vx, path.vz) > .1 ? Math.atan2(path.vx, -path.vz) : course;
        this.samples.push({
          x: path.x, z: path.z, course: pathCourse,
          time: last ? THREE.MathUtils.lerp(last.time, time, t) : time,
          energy, travel, speed: last ? THREE.MathUtils.lerp(last.speed, speed, t) : speed,
          vx: path.vx, vz: path.vz, load: last ? THREE.MathUtils.lerp(last.load, wakeLoad, t) : wakeLoad,
        });
        previousX = path.x; previousZ = path.z;
      }
    }
    this.samples = this.samples.filter(s => time - s.time < LIFETIME).slice(-ROWS);
    for (let row = 0; row < this.samples.length; row++) {
      const s = this.samples[row], age = Math.max(0, time - s.time);
      // Width grows with age and distance astern; each cross-section retains its own heading.
      const width = ship.beam * .6 + age * .14 + Math.min(this.travelled - s.travel, ship.length * 8) * .13;
      const dx = Math.cos(s.course), dz = Math.sin(s.course);
      for (let column = 0; column < COLUMNS; column++) {
        const index = row * COLUMNS + column, x = column / (COLUMNS - 1);
        this.positions[index * 3] = s.x + dx * (x * 2 - 1) * width;
        this.positions[index * 3 + 1] = 0;
        this.positions[index * 3 + 2] = s.z + dz * (x * 2 - 1) * width;
        this.uvs[index * 2] = x; this.uvs[index * 2 + 1] = s.travel / Math.max(ship.beam, 1);
        this.ages[index] = age / LIFETIME; this.energy[index] = s.energy * (1 + s.load * (x * 2 - 1) * .65);
      }
    }
    for (const attribute of Object.values(this.geometry.attributes)) attribute.needsUpdate = true;
    this.geometry.setDrawRange(0, Math.max(0, this.samples.length - 1) * (COLUMNS - 1) * 6);
    this.stern.position.set(sternX - trailX * ship.beam * .35, 0, sternZ - trailZ * ship.beam * .35);
    this.stern.rotation.y = -course;
    this.stern.scale.set(ship.beam * 1.55, 1, ship.beam * (1.6 + propulsion * 1.1));
    (this.stern.material as THREE.ShaderMaterial).uniforms.uPower.value = Math.min(1, speed / 5 + (hydroplane ? 0 : propulsion * .95));
    this.bow.position.set(point.x + forwardX * ship.length * .3 * reverse, 0, point.z + forwardZ * ship.length * .3 * reverse);
    this.bow.rotation.y = -contactFlow(state, ship.length * .3 * reverse, 0).course;
    this.bow.scale.set(ship.beam * 1.5, 1, ship.length * .46);
    (this.bow.material as THREE.ShaderMaterial).uniforms.uPower.value = Math.min(1, speed / 5);
    this.stern.visible = this.bow.visible = !state.docked;
    this.bow.visible &&= !hydroplane;
    for (let index = 0; index < this.contacts.length; index++) {
      const contact = this.contacts[index], side = index === 0 ? -1 : 1;
      contact.visible = !state.docked && (hydroplane || (Math.abs(turnLoad) > .035 && speed > .7));
      const loaded = turnLoad * side;
      const flow = contactFlow(state, ship.length * (hydroplane ? .065 : .30) * reverse, ship.beam * .36 * side);
      const directionX = Math.sin(flow.course), directionZ = -Math.cos(flow.course);
      const length = ship.length * (hydroplane ? .25 + planing * .8 : .12 + Math.min(1, speed / 12) * .14);
      // Attach the leading edge to the wetted chine; foam stretches downstream
      // along that contact's actual velocity rather than the boat's painted heading.
      contact.position.set(point.x + flow.offsetX - directionX * length * .44,
        0, point.z + flow.offsetZ - directionZ * length * .44);
      contact.rotation.y = -flow.course;
      contact.scale.set(ship.beam * (hydroplane ? .25 + planing * .3 : .24) * (1 + Math.max(0, loaded) * .6), 1, length);
      (contact.material as THREE.ShaderMaterial).uniforms.uPower.value = Math.min(1, speed / 12) * (1 + loaded * .65);
    }

    this.spray.update(state, point, ship, interaction, viewportHeight);
  }
}
