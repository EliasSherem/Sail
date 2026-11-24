import * as THREE from "three";
import type { Quality, ShipConfig, VesselState } from "../types";
import { contactFlow, outsideWaterLoad, waterPath } from "./hullFlow";

type Uniforms = Record<string, THREE.IUniform>;
export interface WaterInteraction {
  impact: number;
  waveHeight: number;
  windX: number;
  windZ: number;
  quality: Quality;
}
export const STILL_WATER: WaterInteraction = { impact: 0, waveHeight: 0, windX: 0, windZ: 0, quality: "high" };
const LIMITS = { low: 900, medium: 2200, high: 4096 };
const TICK = 1 / 60, MAX_AGE = 1.8;
const clamp = THREE.MathUtils.clamp;
const hash = (n: number) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

const vertex = `
  uniform float uTime; uniform float uScale; uniform vec2 uWind;
  uniform vec4 uWaves[3]; uniform vec3 uPhase;
  attribute vec3 aVelocity; attribute float aBorn; attribute float aLife;
  attribute float aSize; attribute float aSeed; attribute float aKind;
  varying float vAlpha; varying float vSeed; varying float vKind; varying vec2 vDirection;
  void main(){
    float age=max(0.,uTime-aBorn), life=age/aLife;
    float mist=aKind;
    float drag=mix(.72,.42,mist);
    float travel=drag*(1.-exp(-age/drag));
    vec3 p=position+vec3(aVelocity.x*travel, aVelocity.y*age-4.9*age*age*mix(1.,.6,mist),aVelocity.z*travel);
    p.xz+=uWind*age*age*.12*mix(.25,1.,mist);
    float surface=0.;
    for(int i=0;i<3;i++){vec4 w=uWaves[i];surface+=w.x*sin(w.y*dot(vec2(p.x,-p.z),vec2(sin(w.z),cos(w.z)))-w.w*uTime+uPhase[i]);}
    vec4 view=modelViewMatrix*vec4(p,1.);
    vec3 velocity=(modelViewMatrix*vec4(aVelocity.x, aVelocity.y-9.8*age,aVelocity.z,0.)).xyz;
    vDirection=normalize(velocity.xy+vec2(.001,.001));
    vAlpha=smoothstep(0.,.035,age)*(1.-smoothstep(.35,1.,life))*smoothstep(surface-.02,surface+.16,p.y);
    vAlpha*=mix(.7,.19,mist)*exp(-max(0.,-view.z)*.0008);
    if(uTime<aBorn || age>aLife) vAlpha=0.;
    float grow=mix(1.+age*.3,1.+age*2.8,mist);
    gl_PointSize=clamp(aSize*grow*uScale/max(.5,-view.z),1.,mix(15.,76.,mist));
    if(vAlpha<.001) gl_PointSize=1.;
    gl_Position=projectionMatrix*view;
    vSeed=aSeed;vKind=mist;
  }
`;
const fragment = `
  uniform float uDay;
  varying float vAlpha;varying float vSeed;varying float vKind;varying vec2 vDirection;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+vSeed*19.)*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);}
  void main(){
    vec2 q=gl_PointCoord*2.-1.;
    vec2 oriented=vec2(dot(q,vDirection),dot(q,vec2(-vDirection.y,vDirection.x)));
    float drop=exp(-dot(oriented*vec2(1.15,2.8),oriented*vec2(1.15,2.8))*3.);
    float clouds=noise(q*3.1+vSeed)*.7+noise(q*8.7)*.3;
    float mist=(1.-smoothstep(.15,1.,length(q)))*smoothstep(.14,.72,clouds);
    float alpha=mix(drop,mist,vKind)*vAlpha;
    if(alpha<.006) discard;
    gl_FragColor=vec4(mix(vec3(.14,.24,.29),vec3(.86,.95,.98),uDay),alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** Fixed simulation-time emission, GPU ballistic droplets and wind-carried mist.
 * Particle slots are bounded; time compression samples only the live trailing window. */
export class WaterSpray {
  readonly points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private positions = new Float32Array(LIMITS.high * 3);
  private velocities = new Float32Array(LIMITS.high * 3);
  private born = new Float32Array(LIMITS.high).fill(-1e6);
  private life = new Float32Array(LIMITS.high);
  private sizes = new Float32Array(LIMITS.high);
  private seeds = new Float32Array(LIMITS.high);
  private kinds = new Float32Array(LIMITS.high);
  private previous: { time: number; x: number; z: number; heading: number; speed: number; u: number; v: number; yawRate: number } | null = null;
  private index = 0;
  private serial = 0;
  private credit = 0;
  private sideCredit = 0;
  private count = 0;
  private quality: Quality = "high";
  private timeBase = 0;
  private clock = { value: 0 };

  constructor(private waves: Uniforms, day: THREE.IUniform<number>) {
    const geometry = new THREE.BufferGeometry();
    for (const [name, values, size] of [
      ["position", this.positions, 3], ["aVelocity", this.velocities, 3],
      ["aBorn", this.born, 1], ["aLife", this.life, 1], ["aSize", this.sizes, 1],
      ["aSeed", this.seeds, 1], ["aKind", this.kinds, 1],
    ] as const) geometry.setAttribute(name, new THREE.BufferAttribute(values, size).setUsage(THREE.DynamicDrawUsage));
    geometry.setDrawRange(0, 0);
    this.points = new THREE.Points(geometry, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { ...waves, uTime: this.clock, uScale: { value: 900 }, uWind: { value: new THREE.Vector2() }, uDay: day },
      vertexShader: vertex, fragmentShader: fragment,
    }));
    this.points.name = "water-droplets-and-mist";
    this.points.frustumCulled = false;
    this.points.renderOrder = 3;
  }

  clear() {
    this.previous = null; this.credit = this.sideCredit = this.index = this.count = this.serial = 0;
    this.born.fill(-1e6); this.life.fill(0);
    this.points.geometry.setDrawRange(0, 0);
  }

  rebase(x: number, z: number) {
    for (let i = 0; i < this.count; i++) { this.positions[i * 3] -= x; this.positions[i * 3 + 2] -= z; }
    if (this.previous) { this.previous.x -= x; this.previous.z -= z; }
    this.points.geometry.attributes.position.needsUpdate = true;
  }

  /** Live emitted slots, independent of the camera and with a fixed upper bound. */
  activeCount(time: number) {
    let result = 0;
    for (let i = 0; i < this.count; i++) if (time - this.timeBase - this.born[i] >= -1e-5 && time - this.timeBase - this.born[i] < this.life[i]) result++;
    return result;
  }

  private surface(x: number, z: number, time: number) {
    let y = 0;
    const waves = this.waves.uWaves.value as THREE.Vector4[];
    const phase = this.waves.uPhase.value as THREE.Vector3;
    for (let i = 0; i < waves.length; i++) {
      const w = waves[i];
      y += w.x * Math.sin(w.y * (x * Math.sin(w.z) - z * Math.cos(w.z)) - w.w * time + phase.getComponent(i));
    }
    return y;
  }

  update(state: VesselState, point: THREE.Vector3, ship: ShipConfig, interaction: WaterInteraction, height: number) {
    const time = state.simTime, speed = Math.hypot(state.u, state.v);
    if (interaction.quality !== this.quality) { this.clear(); this.quality = interaction.quality; }
    if (this.previous) {
      const elapsed = time - this.previous.time;
      // At 100x a stalled render frame can legitimately span many kilometres.
      // Bound plausible travel by speed and simulation time, with room for current
      // and fixed-step integration; retain only the live emission window below.
      const expectedTravel = (Math.max(this.previous.speed, speed) + 1) * Math.max(0, elapsed);
      const movementLimit = Math.max(128, ship.length * 1.2, expectedTravel * 1.25 + ship.length);
      if (elapsed < 0 || Math.hypot(point.x - this.previous.x, point.z - this.previous.z) > movementLimit) this.clear();
    }
    // Local particle timestamps retain sub-frame precision on very long voyages.
    if (!this.previous || time - this.timeBase > 600) {
      const shift = time - this.timeBase;
      for (let i = 0; i < this.count; i++) this.born[i] -= shift;
      this.timeBase = time;
      this.points.geometry.attributes.aBorn.needsUpdate = true;
    }
    this.clock.value = time - this.timeBase;
    // Wave phases must use the same absolute clock as the ocean after the particle clock rebase.
    const wavePhase = this.points.material.uniforms.uPhase;
    if (wavePhase === this.waves.uPhase) this.points.material.uniforms.uPhase = { value: new THREE.Vector3() };
    const phase = this.points.material.uniforms.uPhase.value as THREE.Vector3;
    const components = this.waves.uWaves.value as THREE.Vector4[];
    for (let i = 0; i < components.length; i++) phase.setComponent(i, (this.waves.uPhase.value.getComponent(i) - components[i].w * this.timeBase) % (Math.PI * 2));
    this.points.material.uniforms.uScale.value = height;
    this.points.material.uniforms.uWind.value.set(interaction.windX, interaction.windZ);
    if (this.previous && time > this.previous.time) {
      const prev = this.previous;
      const scale = this.quality === "low" ? .30 : this.quality === "medium" ? .62 : 1;
      const limit = LIMITS[this.quality];
      const headingDelta = Math.atan2(Math.sin(state.heading - prev.heading), Math.cos(state.heading - prev.heading));
      const previousFlow = contactFlow(prev, 0, 0), currentFlow = contactFlow(state, 0, 0);
      const start = { x: prev.x, z: prev.z, vx: previousFlow.vx, vz: previousFlow.vz };
      const end = { x: point.x, z: point.z, vx: currentFlow.vx, vz: currentFlow.vz };
      const first = Math.max(Math.floor((prev.time + 1e-7) / TICK) + 1, Math.ceil((time - MAX_AGE) / TICK));
      const last = Math.floor((time + 1e-7) / TICK);
      let changed = false;
      for (let tick = first; tick <= last; tick++) {
        const born = tick * TICK, t = clamp((born - prev.time) / (time - prev.time), 0, 1);
        const velocity = THREE.MathUtils.lerp(prev.speed, speed, t);
        if (state.docked || velocity < .65) { this.credit = 0; continue; }
        const hullScale = clamp(Math.sqrt(ship.beam / 2.4), .8, 2.5);
        const intensity = clamp(velocity / 12, 0, 1);
        const impact = clamp(interaction.impact, 0, 1);
        const rate = Math.min(2400, (80 + Math.min(velocity, 145) * 11 + impact * 750) * intensity * hullScale) * scale;
        this.credit += rate * TICK;
        const amount = Math.floor(this.credit + 1e-8);
        this.credit -= amount;
        const heading = prev.heading + headingDelta * t;
        const sx = Math.cos(heading), sz = Math.sin(heading);
        const path = waterPath(start, end, time - prev.time, t);
        const px = path.x, pz = path.z;
        const u = THREE.MathUtils.lerp(prev.u, state.u, t), v = THREE.MathUtils.lerp(prev.v, state.v, t);
        const yawRate = THREE.MathUtils.lerp(prev.yawRate, state.yawRate, t);
        const turnLoad = outsideWaterLoad(u, v, yawRate);
        const starboardShare = 0.5 * (1 + turnLoad * 0.78);
        const contactMotion = { heading, u, v, yawRate };
        const reverse = u < -.1 ? -1 : 1;
        const planing = ship.id === "spirit" || ship.id === "launch" || ship.id === "yacht" || ship.id === "speedboat";
        for (let n = 0; n < amount; n++) {
          const seed = ++this.serial, r0 = hash(seed), r1 = hash(seed + 10), r2 = hash(seed + 23), r3 = hash(seed + 47);
          // A deterministic weighted distribution preserves frame-rate-independent
          // births while sending more water from the actually loaded outer side.
          this.sideCredit += starboardShare;
          const side = this.sideCredit >= 1 ? 1 : -1;
          if (side === 1) this.sideCredit -= 1;
          const stern = r0 < (ship.id === "spirit" ? .22 : .15);
          const pressure = 1 + turnLoad * side * 0.65;
          const along = stern ? -.46 : ship.id === "spirit" ? .065 : .30 + r1 * .08;
          const spread = stern ? .12 + r1 * .15 : (ship.id === "spirit" ? .40 : .31) + r1 * .06;
          const flow = contactFlow(contactMotion, ship.length * along * reverse, ship.beam * spread * side);
          const x = px + flow.offsetX, z = pz + flow.offsetZ;
          const y = this.surface(x, z, born) + .06 + Math.min(.22, ship.draft * .05) * r2;
          const jet = clamp(Math.sqrt(flow.speed) * (planing ? .45 : .35), .5, 5.5);
          const lift = (.65 + jet * (.55 + r1 * .65) + impact * (1 + r2) * Math.min(3, Math.sqrt(ship.beam))) * pressure;
          const lateral = (.45 + jet * (.6 + r2 * .45)) * side * pressure;
          const inherited = stern ? .3 + r3 * .3 : .4 + r3 * .44;
          const mist = r0 > .60 ? 1 : 0;
          const index = this.index, offset = index * 3;
          this.positions.set([x, y, z], offset);
          this.velocities.set([flow.vx * inherited + sx * lateral, lift, flow.vz * inherited + sz * lateral], offset);
          this.born[index] = born - this.timeBase;
          this.life[index] = mist ? 1.0 + r3 * .7 : .55 + r3 * .65;
          this.sizes[index] = mist ? (.18 + r2 * .38) * Math.min(2, hullScale) : (.028 + r2 * .045) * Math.min(2.2, hullScale);
          this.seeds[index] = r1 * 100;
          this.kinds[index] = mist;
          this.index = (index + 1) % limit;
          this.count = Math.min(limit, this.count + 1);
          changed = true;
        }
      }
      if (changed) for (const attribute of Object.values(this.points.geometry.attributes)) attribute.needsUpdate = true;
    }
    this.points.geometry.setDrawRange(0, this.count);
    this.previous = { time, x: point.x, z: point.z, heading: state.heading, speed, u: state.u, v: state.v, yawRate: state.yawRate };
  }
}
