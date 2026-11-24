import * as THREE from "three";
import { shipById } from "../data/ships";
import { fromLocal, toLocal } from "../geo/math";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { LatLon, Quality, VesselState, Weather } from "../types";

const TAU = Math.PI * 2;
const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const material = () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .4, metalness: .04, side: THREE.DoubleSide });

export interface DolphinPose {
  right: number; forward: number; height: number;
  rightVelocity: number; forwardVelocity: number; verticalVelocity: number;
  airborne: boolean; tailStroke: number;
  cycleTime: number; cycleDuration: number; flightDuration: number;
}

/** Cubic immersion/rise joins preserve both position and vertical velocity at
 * the ballistic arc and settle smoothly into the deeper swimming interval. */
function submergedJoin(from: number, to: number, fromSpeed: number, toSpeed: number, duration: number, elapsed: number): [number, number] {
  const s = Math.max(0, Math.min(1, elapsed / duration)), s2 = s * s, s3 = s2 * s;
  return [
    (2 * s3 - 3 * s2 + 1) * from + (s3 - 2 * s2 + s) * duration * fromSpeed + (-2 * s3 + 3 * s2) * to + (s3 - s2) * duration * toSpeed,
    (6 * s2 - 6 * s) * (from - to) / duration + (3 * s2 - 4 * s + 1) * fromSpeed + (3 * s2 - 2 * s) * toSpeed,
  ];
}

/** A brief forward breach, then several seconds swimming below the surface.
 * The animal travels at its own speed along its encounter's geographic course;
 * the small periodic undulation never reverses its horizontal travel. */
export function dolphinPose(index: number, visualTime: number, calm = true): DolphinPose {
  const cycleDuration = 7.8 + index * .37, flightDuration = (1.05 + index * .06) * (calm ? 1 : .82);
  const cycleTime = (((visualTime / cycleDuration + index * .173) % 1) + 1) % 1 * cycleDuration;
  const gravity = 9.81, launchSpeed = gravity * flightDuration * .5;
  const joinDuration = .85, depth = 3.2 + index * .12;
  let height: number, verticalVelocity: number;
  const airborne = cycleTime < flightDuration;
  if (airborne) {
    height = cycleTime * (launchSpeed - gravity * cycleTime * .5);
    verticalVelocity = launchSpeed - gravity * cycleTime;
  } else if (cycleTime < flightDuration + joinDuration) {
    [height, verticalVelocity] = submergedJoin(0, -depth, -launchSpeed, 0, joinDuration, cycleTime - flightDuration);
  } else if (cycleTime > cycleDuration - joinDuration) {
    [height, verticalVelocity] = submergedJoin(-depth, 0, 0, launchSpeed, joinDuration, cycleTime - cycleDuration + joinDuration);
  } else {
    const duration = cycleDuration - flightDuration - joinDuration * 2;
    const angle = Math.PI * (cycleTime - flightDuration - joinDuration) / duration;
    height = -depth - .3 * Math.sin(angle) ** 2;
    verticalVelocity = -.3 * Math.sin(2 * angle) * Math.PI / duration;
  }
  const omega = TAU / cycleDuration, travelPhase = omega * (cycleTime - flightDuration * .5);
  const lateralPhase = omega * cycleTime + index * .7, side = index % 2 ? -1 : 1, amplitude = .85;
  const swimSpeed = 5.2 + index * .32;
  const swimming = THREE.MathUtils.smoothstep(-height, 0, .55);
  return {
    right: side * (18 + index * 3.1) + .7 * Math.sin(lateralPhase),
    forward: 48 + index * 8 + swimSpeed * visualTime + amplitude * Math.sin(travelPhase),
    height,
    rightVelocity: .7 * omega * Math.cos(lateralPhase),
    forwardVelocity: swimSpeed + amplitude * omega * Math.cos(travelPhase),
    verticalVelocity, airborne,
    tailStroke: swimming > 0 ? swimming * Math.sin(visualTime * (5.6 + index * .17) + index * 1.9) * .25 : 0,
    cycleTime, cycleDuration, flightDuration,
  };
}

/** Original smooth anatomical meshes. Local nose points toward -Z. */
function body(length: number, radius: number, whale: boolean): THREE.BufferGeometry {
  const rings = 24, sides = 16, positions: number[] = [], colors: number[] = [], indices: number[] = [];
  const back = new THREE.Color(whale ? "#283d46" : "#536d79"), belly = new THREE.Color(whale ? "#879899" : "#d0dbd8");
  for (let r = 0; r <= rings; r++) {
    const t = r / rings, z = length * (t - .51);
    // Rounded head, broad thorax and thin caudal peduncle; the separate beak is tapered.
    const shape = Math.pow(Math.max(0, Math.sin(Math.PI * t)), .58) * (1.12 - .67 * t);
    for (let j = 0; j <= sides; j++) {
      const angle = TAU * j / sides, y = Math.sin(angle) * radius * shape;
      positions.push(Math.cos(angle) * radius * shape, y, z);
      const shade = THREE.MathUtils.smoothstep(-Math.sin(angle), -.18, .95);
      const color = back.clone().lerp(belly, shade * .92);
      colors.push(color.r, color.g, color.b);
      if (r < rings && j < sides) {
        const a = r * (sides + 1) + j, b = a + sides + 1;
        indices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry.toNonIndexed();
}

function colored(geometry: THREE.BufferGeometry, color: string): THREE.BufferGeometry {
  const source = geometry.index ? geometry.toNonIndexed() : geometry;
  source.deleteAttribute("uv");
  const c = new THREE.Color(color), count = source.getAttribute("position").count, colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) colors.set([c.r, c.g, c.b], i * 3);
  source.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  if (!source.getAttribute("normal")) source.computeVertexNormals();
  return source;
}

function fin(points: number[][], color: string): THREE.BufferGeometry {
  // Closed lenticular section gives fins thickness and shaded edges without a flat toy triangle.
  const front = points.map(p => [p[0], p[1] + .035, p[2]]), back = points.map(p => [p[0], p[1] - .035, p[2]]);
  const positions: number[] = [];
  for (let i = 1; i < points.length - 1; i++) positions.push(...front[0], ...front[i], ...front[i + 1], ...back[0], ...back[i + 1], ...back[i]);
  for (let i = 0; i < points.length; i++) { const j = (i + 1) % points.length; positions.push(...front[i], ...back[i], ...front[j], ...front[j], ...back[i], ...back[j]); }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return colored(geometry, color);
}

function merged(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const geometry = mergeGeometries(parts, false)!;
  for (const part of parts) part.dispose();
  geometry.computeBoundingSphere();
  return geometry;
}

interface Cetacean { group: THREE.Group; tail: THREE.Group; wake: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>; }
function cetacean(whale: boolean, skin: THREE.MeshStandardMaterial): Cetacean {
  const group = new THREE.Group(), length = whale ? 10.4 : 3.15, radius = whale ? 1.22 : .37;
  const main = body(length, radius, whale), finColor = whale ? "#354a51" : "#4d6671";
  const dorsal = fin([[0, radius * .55, -.1], [0, radius + (whale ? .7 : .57), .35], [0, radius * .62, .75]], finColor);
  const parts = [main, dorsal];
  for (const side of [-1, 1]) {
    const flipper = fin([[side * radius * .55, -.12, -length * .22], [side * radius * (whale ? 2.9 : 2.3), -.35, length * .02], [side * radius * 1.8, -.29, length * .12], [side * radius * .45, -.15, -length * .02]], whale ? "#738589" : finColor);
    parts.push(flipper);
    const eye = colored(new THREE.SphereGeometry(whale ? .075 : .035, 6, 4), "#081b23");
    eye.translate(side * radius * .62, radius * .06, -length * .35); parts.push(eye);
  }
  if (!whale) {
    const beak = colored(new THREE.SphereGeometry(1, 12, 8), "#697f87");
    beak.scale(.115, .09, .42); beak.translate(0, -.05, -length * .49); parts.push(beak);
  }
  const torso = new THREE.Mesh(merged(parts), skin); torso.name = whale ? "humpback-body" : "bottlenose-body"; group.add(torso);
  const tail = new THREE.Group(); tail.position.z = length * .44;
  const span = whale ? 2.3 : .73;
  tail.add(new THREE.Mesh(merged([-1, 1].map(side => fin([[0, 0, -.2], [side * span * .9, .04, -.3], [side * span, .02, .09], [side * span * .54, -.04, .26], [0, -.03, .14]], finColor))), skin));
  group.add(tail);
  const wake = new THREE.Mesh(new THREE.RingGeometry(.68, 1, 32), new THREE.MeshBasicMaterial({ color: "#d6eceb", transparent: true, opacity: .2, depthWrite: false, side: THREE.DoubleSide }));
  wake.rotation.x = -Math.PI / 2; wake.name = "cetacean-surface-ripple";
  return { group, tail, wake };
}

interface Gull { group: THREE.Group; wings: THREE.Group[]; }
function gull(skin: THREE.MeshStandardMaterial): Gull {
  const group = new THREE.Group();
  const torso = colored(new THREE.SphereGeometry(1, 10, 6), "#dfe5e0"); torso.scale(.16, .15, .38);
  const head = colored(new THREE.SphereGeometry(.145, 8, 6), "#eff1e8"); head.translate(0, .075, -.32);
  const bill = colored(new THREE.ConeGeometry(.045, .2, 6), "#dbb34f"); bill.rotateX(-Math.PI / 2); bill.translate(0, .025, -.48);
  const tail = fin([[0, 0, .23], [-.22, 0, .55], [.22, 0, .55]], "#aebcbf");
  group.add(new THREE.Mesh(merged([torso, head, bill, tail]), skin));
  const wings: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const wing = new THREE.Group(); wing.position.x = side * .08;
    const inner = fin([[0, 0, -.16], [side * .58, .025, -.2], [side * .71, 0, .12], [side * .25, -.02, .19]], "#c3d0d0");
    const outer = fin([[side * .55, .025, -.2], [side * 1.02, -.01, .11], [side * .88, -.01, .25], [side * .65, 0, .13]], "#344952");
    wing.add(new THREE.Mesh(merged([inner, outer]), skin)); group.add(wing); wings.push(wing);
  }
  return { group, wings };
}

/** Decorative wildlife has its own geographic encounter and swimming speeds.
 * Fixed geometry, no timers/textures, and animation uses the unaccelerated visual clock.
 * `surfaceY` samples ocean height in the current renderer's local coordinates. */
export class MarineLife {
  readonly group = new THREE.Group();
  private readonly dolphins: Cetacean[] = [];
  private readonly whale: Cetacean;
  private readonly gulls: Gull[] = [];
  private readonly blow: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
  private lastTime: number | undefined;
  private heading = 0;
  private anchor: LatLon | undefined;
  private encounterTime = 0;
  private bowOffset = 0;
  private sideOffset = 0;
  private whaleDive = 0;
  private whaleDiveSpeed = 0;
  private readonly breachWater = new Map<number, { cycle: number; duration: number; current: boolean; next: boolean }>();

  constructor(private readonly waterAt: (point: LatLon) => boolean = () => true) {
    this.group.name = "marine-wildlife";
    const skin = material();
    for (let i = 0; i < 5; i++) {
      const animal = cetacean(false, skin); animal.group.name = `dolphin-${i}`;
      this.dolphins.push(animal); this.group.add(animal.group, animal.wake);
    }
    this.whale = cetacean(true, skin); this.whale.group.name = "humpback-whale";
    this.group.add(this.whale.group, this.whale.wake);
    for (let i = 0; i < 8; i++) {
      const bird = gull(skin); bird.group.name = `gull-${i}`; this.gulls.push(bird); this.group.add(bird.group);
    }
    const vertices = new Float32Array(28 * 3);
    for (let i = 0; i < 28; i++) { const t = i / 28; vertices.set([(hash(i + 9) - .5) * t * 3, t * 5, (hash(i + 61) - .5) * t * 2], i * 3); }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    const mist = new THREE.PointsMaterial({ color: "#d8e6e4", size: .8, transparent: true, opacity: .4, depthWrite: false });
    // Soft round points avoid square sprites without introducing a texture asset.
    mist.onBeforeCompile = shader => { shader.fragmentShader = shader.fragmentShader.replace("#include <opaque_fragment>", "diffuseColor.a *= smoothstep(.5,.12,length(gl_PointCoord-.5));\n#include <opaque_fragment>"); };
    mist.customProgramCacheKey = () => "marine-blow-round-v1";
    this.blow = new THREE.Points(geometry, mist); this.blow.name = "whale-breath"; this.group.add(this.blow);
  }

  update(state: VesselState, point: THREE.Vector3, weather: Weather, visualTime: number, quality: Quality, enabled: boolean, surfaceY: (localX: number, localZ: number) => number = () => 0, projectionOrigin?: LatLon): void {
    this.group.visible = enabled && weather.sea !== "hurricane";
    if (!this.group.visible) return;
    const clock = Math.max(0, visualTime);
    const firstUpdate = this.lastTime === undefined, dt = firstUpdate ? 0 : Math.min(.12, Math.max(0, clock - this.lastTime!));
    // This encounter is never repositioned. The player can pass it or leave it
    // behind; only constructing a new MarineLife creates another encounter.
    if (!this.anchor) {
      this.anchor = { lat: state.lat, lon: state.lon };
      this.encounterTime = clock; this.heading = state.heading + .2;
      this.breachWater.clear();
      const ship = shipById(state.shipId);
      this.bowOffset = Math.max(0, ship.length * .55 - 10);
      this.sideOffset = Math.max(0, ship.beam * .55 - 4);
    }
    this.lastTime = clock;
    const time = Math.max(0, clock - this.encounterTime);
    const renderOrigin = projectionOrigin ?? state;
    const shiftX = projectionOrigin ? 0 : point.x, shiftZ = projectionOrigin ? 0 : point.z;
    const origin = toLocal(this.anchor, renderOrigin);
    this.group.position.set(shiftX + origin.x, 0, shiftZ + origin.z);
    const sin = Math.sin(this.heading), cos = Math.cos(this.heading);
    const bowOffset = this.bowOffset, sideOffset = this.sideOffset;
    const location = (right: number, forward: number) => {
      const x = right * cos + forward * sin, z = right * sin - forward * cos;
      return fromLocal(x, z, this.anchor!);
    };
    const place = (object: THREE.Object3D, right: number, forward: number, height: number) => {
      const geo = location(right, forward), local = toLocal(geo, renderOrigin);
      const x = shiftX + local.x, z = shiftZ + local.z;
      object.position.set(local.x - origin.x, surfaceY(x, z) + height, local.z - origin.z);
    };
    const orient = (object: THREE.Object3D, rightSpeed: number, forwardSpeed: number, verticalSpeed: number, roll: number) => {
      const vx = rightSpeed * cos + forwardSpeed * sin;
      const vz = rightSpeed * sin - forwardSpeed * cos;
      const horizontal = Math.hypot(vx, vz), heading = horizontal > 1e-6 ? Math.atan2(vx, -vz) : this.heading;
      // The mesh's nose is -Z: positive X pitch raises it (Euler YXZ).
      object.rotation.set(Math.atan2(verticalSpeed, horizontal), -heading, roll, "YXZ");
    };
    const calm = weather.sea === "calm", moderate = weather.sea === "moderate", storm = weather.sea === "storm";
    const qualityLimit = quality === "low" ? 2 : quality === "medium" ? 4 : 5;
    const count = Math.min(qualityLimit, storm ? 0 : calm ? 5 : moderate ? 4 : 2);
    for (let i = 0; i < this.dolphins.length; i++) {
      const animal = this.dolphins[i], active = i < count; animal.group.visible = animal.wake.visible = active;
      if (!active) continue;
      const pose = dolphinPose(i, time, calm), side = i % 2 ? -1 : 1;
      const right = pose.right + side * sideOffset, forward = pose.forward + bowOffset, height = pose.height;
      // Reject a breach if its takeoff, apex or landing would cross land.
      // Checking one full cycle also lets its previous underwater rise stay deep.
      const cycle = Math.floor(time / pose.cycleDuration + i * .173);
      const cycleStart = (cycle - i * .173) * pose.cycleDuration, nextStart = cycleStart + pose.cycleDuration;
      const safeBreach = (start: number) => [0, .5, 1].every(fraction => {
        const p = dolphinPose(i, start + pose.flightDuration * fraction, calm);
        return this.waterAt(location(p.right + side * sideOffset, p.forward + bowOffset));
      });
      let water = this.breachWater.get(i);
      if (!water || water.cycle !== cycle || water.duration !== pose.flightDuration) {
        water = { cycle, duration: pose.flightDuration, current: safeBreach(cycleStart), next: safeBreach(nextStart) };
        this.breachWater.set(i, water);
      }
      // Suppression changes only while the animal is deep: no visible pop at a
      // cycle boundary when the next independently travelled path reaches land.
      const suppressed = (!water.current && pose.cycleTime < pose.flightDuration + .85) ||
        (!water.next && pose.cycleTime > pose.cycleDuration - .85);
      const drawHeight = suppressed ? -3.8 : height;
      place(animal.group, right, forward, drawHeight);
      orient(animal.group, pose.rightVelocity, pose.forwardVelocity, suppressed ? 0 : pose.verticalVelocity, side * .045);
      animal.tail.rotation.x = pose.tailStroke;
      place(animal.wake, right, forward, .035);
      const surface = Math.exp(-Math.pow(drawHeight / .7, 2));
      animal.wake.material.opacity = surface * .24;
      animal.wake.scale.set(1.1 + surface * 1.5, 2 + surface * 2, 1);
      animal.wake.rotation.z = -animal.group.rotation.y;
    }
    const whaleVisible = (calm || moderate) && quality !== "low";
    this.whale.group.visible = this.whale.wake.visible = whaleVisible;
    this.blow.visible = whaleVisible;
    if (whaleVisible) {
      const phase = (time / 27 + .22) % 1, breath = Math.max(0, Math.sin((phase - .14) * Math.PI * 6));
      const right = -61 - sideOffset + 7 * Math.sin(time * .025), forward = 61 + bowOffset + time * 3.1 + 14 * Math.sin(time * .043);
      const openWater = this.waterAt(location(right, forward));
      const aheadTime = time + 5;
      const aheadWater = this.waterAt(location(-61 - sideOffset + 7 * Math.sin(aheadTime * .025), 61 + bowOffset + aheadTime * 3.1 + 14 * Math.sin(aheadTime * .043)));
      const diveTarget = openWater && aheadWater ? 0 : 7;
      if (firstUpdate) { this.whaleDive = diveTarget; this.whaleDiveSpeed = 0; }
      else if (dt > 0) {
        // Critically damped depth: both height and vertical speed remain
        // continuous when the coast check changes, avoiding a sudden pitch.
        const omega = 1.2, error = this.whaleDive - diveTarget;
        const response = this.whaleDiveSpeed + omega * error, decay = Math.exp(-omega * dt);
        this.whaleDive = diveTarget + (error + response * dt) * decay;
        this.whaleDiveSpeed = (this.whaleDiveSpeed - omega * response * dt) * decay;
      }
      const height = -.9 + .6 * Math.sin(phase * TAU) - this.whaleDive;
      place(this.whale.group, right, forward, height);
      orient(this.whale.group, 7 * .025 * Math.cos(time * .025), 3.1 + 14 * .043 * Math.cos(time * .043), .6 * TAU / 27 * Math.cos(phase * TAU) - this.whaleDiveSpeed, .025);
      this.whale.tail.rotation.x = Math.sin(time * .8) * .13;
      place(this.whale.wake, right, forward, .035); this.whale.wake.scale.set(2.4, 6.4, 1); this.whale.wake.rotation.z = -this.whale.group.rotation.y;
      const surface = Math.exp(-this.whaleDive * 2);
      this.whale.wake.material.opacity = surface * .13;
      this.blow.position.copy(this.whale.group.position); this.blow.position.y += 1.5;
      this.blow.position.x -= Math.sin(this.whale.group.rotation.y) * 3.3; this.blow.position.z -= Math.cos(this.whale.group.rotation.y) * 3.3;
      const blow = openWater && phase > .14 && phase < .31 ? breath * surface : 0;
      this.blow.material.opacity = blow * .45; this.blow.scale.setScalar(.65 + blow * .75); this.blow.visible = blow > .01;
    }
    const birdCount = Math.min(quality === "low" ? 3 : quality === "medium" ? 6 : 8, storm ? 1 : calm || moderate ? 8 : 3);
    for (let i = 0; i < this.gulls.length; i++) {
      const bird = this.gulls[i]; bird.group.visible = i < birdCount; if (!bird.group.visible) continue;
      const angle = time * (.075 + i * .003) + i * 2.399, radius = 25 + i * 4.2;
      const right = Math.cos(angle) * radius, forward = 30 + time * 4 + Math.sin(angle) * radius * .55;
      place(bird.group, right, forward, 12 + i * 1.7 + Math.sin(time * .6 + i) * 1.6);
      const angularSpeed = .075 + i * .003;
      orient(bird.group, -Math.sin(angle) * radius * angularSpeed, 4 + Math.cos(angle) * radius * .55 * angularSpeed, .96 * Math.cos(time * .6 + i), -.14);
      const flap = Math.sin(time * (3.8 + i * .13) + i) * .5 * (.55 + .45 * Math.sin(time * .19 + i) ** 2);
      bird.wings[0].rotation.z = flap; bird.wings[1].rotation.z = -flap;
    }
  }
}
