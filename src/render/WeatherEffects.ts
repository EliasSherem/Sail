import * as THREE from "three";
import type { Quality, SeaState, Weather } from "../types";

const LIMITS: Record<Quality, number> = { low: 900, medium: 2300, high: 4800 };
const CLOUD: Record<SeaState, number> = {
  calm: 0, moderate: 0.12, rough: 0.4, rain: 0.72, storm: 0.94, hurricane: 1,
};
const RAIN: Record<SeaState, number> = {
  calm: 0, moderate: 0, rough: 0, rain: 0.48, storm: 0.78, hurricane: 1,
};
const hash = (value: number) => {
  const sample = Math.sin(value * 127.1 + 311.7) * 43758.5453;
  return sample - Math.floor(sample);
};

const rainVertex = `
  attribute vec3 aSeed; attribute float aEnd;
  uniform float uTime; uniform vec2 uWind;
  varying float vAlpha;
  void main(){
    float fall=26.+aSeed.z*14.;
    float phase=fract(aSeed.y-uTime*fall/95.);
    float age=(1.-phase)*95./fall;
    vec3 p=vec3(aSeed.x*220.-110.,phase*95.-3.,aSeed.z*220.-110.);
    p.xz=mod(p.xz+uWind*age*.62+110.,220.)-110.;
    vec3 flow=vec3(uWind.x*.62,-fall,uWind.y*.62);
    p+=flow*(aEnd-.5)*(.026+aSeed.x*.027);
    vec4 view=modelViewMatrix*vec4(p,1.);
    float edge=1.-smoothstep(80.,111.,max(abs(p.x),abs(p.z)));
    vAlpha=edge*smoothstep(-3.,2.,p.y)*(1.-smoothstep(78.,95.,p.y));
    gl_Position=projectionMatrix*view;
  }
`;
const rainFragment = `
  uniform float uDay; uniform float uIntensity; varying float vAlpha;
  void main(){
    float alpha=vAlpha*uIntensity*mix(.17,.38,uDay);
    if(alpha<.006) discard;
    gl_FragColor=vec4(mix(vec3(.31,.42,.51),vec3(.81,.88,.9),uDay),alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
const planeVertex = `
  varying vec2 vUv;
  void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}
`;
const noise = `
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);}
  float fbm(vec2 p){return noise(p)*.57+noise(p*2.03+4.2)*.29+noise(p*4.17-7.6)*.14;}
`;
const cloudFragment = `
  uniform float uTime; uniform float uDay; uniform float uCloud; uniform float uHurricane;
  uniform vec2 uWind; varying vec2 vUv;
  ${noise}
  void main(){
    vec2 p=(vUv-.5)*13.;
    float r=length(p), angle=atan(p.y,p.x)+uHurricane*(r*.32-uTime*.006);
    p=mix(p,vec2(cos(angle),sin(angle))*r,uHurricane*.75);
    p+=uWind*uTime*.000045;
    float density=fbm(p+fbm(p*.63));
    float patches=smoothstep(.28-uCloud*.13,.79-uCloud*.18,density);
    float edge=1.-smoothstep(.29,.51,length(vUv-.5));
    float alpha=patches*uCloud*edge*.9;
    vec3 color=mix(vec3(.035,.05,.075),vec3(.4,.46,.49),uDay);
    color*=.7+noise(p*2.1)*.3;
    gl_FragColor=vec4(color,alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
const squallFragment = `
  uniform float uTime; uniform float uDay; uniform float uCloud; uniform float uHurricane;
  varying vec2 vUv; ${noise}
  void main(){
    vec2 p=vec2(vUv.x*14.-uTime*.075,vUv.y*2.1+sin(vUv.x*18.+uTime*.11)*.2);
    float bands=smoothstep(.45,.77,fbm(p));
    float vertical=smoothstep(0.,.18,vUv.y)*(1.-smoothstep(.32,1.,vUv.y));
    float alpha=bands*vertical*uHurricane*.16;
    gl_FragColor=vec4(mix(vec3(.10,.16,.20),vec3(.56,.64,.66),uDay),alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** A single broad flash per deterministic 11/15 second cycle, never strobing.
 * The supplied visual clock must stop while paused and is independent of 100×. */
export function weatherLightning(weather: Weather, visualTime: number): number {
  if (weather.sea !== "storm" && weather.sea !== "hurricane") return 0;
  const period = weather.sea === "hurricane" ? 11 : 15;
  const phase = ((visualTime + hash(weather.seed) * period) % period + period) % period;
  const age = phase - period * 0.6;
  if (age < 0 || age > 0.55) return 0;
  return Math.sin(age / 0.55 * Math.PI) ** 2 * 0.8;
}

/** Fixed GPU buffers: rain streaks, a procedural cloud deck, hurricane squalls
 * and a sparse lightning bolt. No textures, network requests or growing lists. */
export class WeatherEffects {
  readonly group = new THREE.Group();
  private readonly uniforms = {
    uTime: { value: 0 }, uDay: { value: 1 }, uCloud: { value: 0 },
    uHurricane: { value: 0 }, uIntensity: { value: 0 },
    uWind: { value: new THREE.Vector2() },
  };
  private readonly rain: THREE.LineSegments<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private readonly clouds: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private readonly squall: THREE.Mesh<THREE.CylinderGeometry, THREE.ShaderMaterial>;
  private readonly bolt: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>;

  constructor() {
    this.group.name = "local-weather-effects";
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(LIMITS.high * 6);
    const seeds = new Float32Array(LIMITS.high * 6);
    const ends = new Float32Array(LIMITS.high * 2);
    for (let index = 0; index < LIMITS.high; index++)
      for (let end = 0; end < 2; end++) {
        const vertex = index * 2 + end;
        seeds.set([hash(index + 1), hash(index + 101), hash(index + 379)], vertex * 3);
        ends[vertex] = end;
      }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 3));
    geometry.setAttribute("aEnd", new THREE.BufferAttribute(ends, 1));
    geometry.setDrawRange(0, 0);
    this.rain = new THREE.LineSegments(geometry, new THREE.ShaderMaterial({
      uniforms: this.uniforms, vertexShader: rainVertex, fragmentShader: rainFragment,
      transparent: true, depthWrite: false,
    }));
    this.rain.name = "weather-rain-streaks";
    this.rain.frustumCulled = false;
    this.rain.renderOrder = 5;
    this.group.add(this.rain);

    this.clouds = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.ShaderMaterial({
      uniforms: this.uniforms, vertexShader: planeVertex, fragmentShader: cloudFragment,
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
    }));
    this.clouds.name = "weather-cloud-deck";
    this.clouds.rotation.x = -Math.PI / 2;
    this.clouds.position.y = 330;
    this.clouds.frustumCulled = false;
    this.clouds.renderOrder = 1;
    this.group.add(this.clouds);

    this.squall = new THREE.Mesh(new THREE.CylinderGeometry(180, 180, 52, 40, 1, true), new THREE.ShaderMaterial({
      uniforms: this.uniforms, vertexShader: planeVertex, fragmentShader: squallFragment,
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
    }));
    this.squall.name = "weather-hurricane-squalls";
    this.squall.position.y = 24;
    this.squall.frustumCulled = false;
    this.squall.renderOrder = 4;
    this.group.add(this.squall);

    const boltPositions = new Float32Array(12 * 6);
    let previous = new THREE.Vector3(270, 290, -490);
    for (let index = 0; index < 12; index++) {
      const next = new THREE.Vector3(270 + (hash(index + 31) - .5) * 54, 290 - (index + 1) * 23, -490 + (hash(index + 73) - .5) * 22);
      previous.toArray(boltPositions, index * 6);
      next.toArray(boltPositions, index * 6 + 3);
      previous = next;
    }
    const boltGeometry = new THREE.BufferGeometry();
    boltGeometry.setAttribute("position", new THREE.BufferAttribute(boltPositions, 3));
    this.bolt = new THREE.LineSegments(boltGeometry, new THREE.LineBasicMaterial({
      color: 0xd9e8ff, transparent: true, opacity: 0, depthWrite: false, toneMapped: false,
    }));
    this.bolt.name = "weather-lightning";
    this.bolt.frustumCulled = false;
    this.bolt.renderOrder = 5;
    this.group.add(this.bolt);
  }

  update(point: THREE.Vector3, weather: Weather, visualTime: number, quality: Quality, day: number): { lightning: number; cloud: number } {
    const time = Math.max(0, visualTime);
    const cloud = CLOUD[weather.sea], intensity = RAIN[weather.sea];
    const hurricane = weather.sea === "hurricane" ? 1 : 0;
    this.group.position.copy(point);
    this.uniforms.uTime.value = time;
    this.uniforms.uDay.value = THREE.MathUtils.clamp(day, 0, 1);
    this.uniforms.uCloud.value = cloud;
    this.uniforms.uIntensity.value = intensity;
    this.uniforms.uHurricane.value = hurricane;
    this.uniforms.uWind.value.set(
      Math.sin(weather.windDirection) * weather.windSpeed,
      -Math.cos(weather.windDirection) * weather.windSpeed,
    );
    this.rain.visible = intensity > 0;
    this.rain.geometry.setDrawRange(0, Math.floor(LIMITS[quality] * intensity) * 2);
    this.clouds.visible = cloud > 0.2;
    this.squall.visible = hurricane > 0;
    this.squall.rotation.y = time * 0.018;
    const lightning = weatherLightning(weather, time);
    this.bolt.visible = lightning > 0.01;
    this.bolt.material.opacity = lightning;
    this.bolt.rotation.y = Math.floor(time / (hurricane ? 11 : 15)) * 1.71;
    return { lightning, cloud };
  }

  dispose(): void {
    for (const object of [this.rain, this.clouds, this.squall, this.bolt]) {
      object.geometry.dispose();
      object.material.dispose();
    }
    this.group.clear();
  }
}
