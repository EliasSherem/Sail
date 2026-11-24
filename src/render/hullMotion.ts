import type { ShipConfig, VesselState, Weather } from "../types";
import { waveComponents, type WaveComponent } from "../sim/weather";

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const smoothstep = (lo: number, hi: number, value: number) => {
  const t = clamp((value - lo) / (hi - lo), 0, 1);
  return t * t * (3 - 2 * t);
};
export interface HullPose {
  height: number;
  pitch: number;
  roll: number;
  /** Relative bow/wave entry, normalized for spray emission. */
  impact: number;
}
export interface HullWater {
  center: number;
  bow: number;
  stern: number;
  port: number;
  starboard: number;
  height: number;
  pitch: number;
  roll: number;
  bowVelocity: number;
  velocity: number;
}

function waterSample(waves: WaveComponent[], east: number, north: number, time: number, eastSpeed: number, northSpeed: number) {
  let height = 0, velocity = 0;
  for (const wave of waves) {
    const k = Math.PI * 2 / wave.wavelength;
    const sine = Math.sin(wave.direction), cosine = Math.cos(wave.direction);
    const phase = k * (east * sine + north * cosine) - wave.speed * time + wave.phase;
    height += wave.amplitude * Math.sin(phase);
    velocity += wave.amplitude * Math.cos(phase) * (k * (eastSpeed * sine + northSpeed * cosine) - wave.speed);
  }
  return { height, velocity };
}

/** Five waterline contacts on the exact analytic field used by the water shader.
 * Coordinates are east/north in the persistent wave frame, never the rebased scene.
 */
export function sampleHullWater(
  east: number,
  north: number,
  state: Readonly<VesselState>,
  ship: ShipConfig,
  weather: Weather,
): HullWater {
  const waves = waveComponents(weather), time = state.simTime;
  const sine = Math.sin(state.heading), cosine = Math.cos(state.heading);
  const forward = ship.length * 0.38, side = ship.beam * 0.45;
  const eastSpeed = state.u * sine + state.v * cosine + weather.currentSpeed * Math.sin(weather.currentDirection);
  const northSpeed = state.u * cosine - state.v * sine + weather.currentSpeed * Math.cos(weather.currentDirection);
  const at = (fore: number, starboard: number) => waterSample(waves,
    east + fore * sine + starboard * cosine,
    north + fore * cosine - starboard * sine,
    time, eastSpeed, northSpeed);
  const center = at(0, 0), bow = at(forward, 0), stern = at(-forward, 0);
  const port = at(0, -side), starboard = at(0, side);
  return {
    center: center.height, bow: bow.height, stern: stern.height,
    port: port.height, starboard: starboard.height,
    // Distributed buoyancy keeps a long hull from following one moving vertex.
    height: center.height * 0.34 + bow.height * 0.21 + stern.height * 0.21 + port.height * 0.12 + starboard.height * 0.12,
    pitch: Math.atan2(bow.height - stern.height, forward * 2),
    roll: Math.atan2(starboard.height - port.height, side * 2),
    bowVelocity: bow.velocity,
    velocity: center.velocity * 0.34 + bow.velocity * 0.21 + stern.velocity * 0.21 + port.velocity * 0.12 + starboard.velocity * 0.12,
  };
}

interface Spring { value: number; velocity: number }
/** Exact critically damped response for a held target: stable even across 100x frames. */
function advanceSpring(spring: Spring, target: number, rate: number, dt: number) {
  const offset = spring.value - target;
  const impulse = spring.velocity + rate * offset;
  const decay = Math.exp(-rate * dt);
  spring.value = target + (offset + impulse * dt) * decay;
  spring.velocity = (spring.velocity - rate * impulse * dt) * decay;
}

/** Secondary visual motion only; no position, forces, fuel or controls are written. */
export class HullMotion {
  private heave: Spring = { value: 0, velocity: 0 };
  private pitch: Spring = { value: 0, velocity: 0 };
  private roll: Spring = { value: 0, velocity: 0 };
  private lastTime = NaN;
  private lastSpeed = 0;
  private lastShip = "";
  private lastWeather = { waveHeight: NaN, direction: NaN, seed: NaN };
  private pose: HullPose = { height: 0, pitch: 0, roll: 0, impact: 0 };

  reset() { this.lastTime = NaN; }

  update(state: Readonly<VesselState>, ship: ShipConfig, weather: Weather, east: number, north: number): Readonly<HullPose> {
    const dt = state.simTime - this.lastTime;
    const editedWeather = dt === 0 && (weather.waveHeight !== this.lastWeather.waveHeight || weather.windDirection !== this.lastWeather.direction || weather.seed !== this.lastWeather.seed);
    const reset = !Number.isFinite(this.lastTime) || dt < 0 || ship.id !== this.lastShip || editedWeather;
    // Repeated render frames and paused cameras must not advance springs or impacts.
    if (!reset && dt <= 0) return this.pose;
    const water = sampleHullWater(east, north, state, ship, weather);
    const speed = Math.max(0, state.u);
    const planingHull = ship.id === "launch" || ship.id === "yacht" || ship.id === "spirit" || ship.id === "speedboat";
    const froude = speed / Math.sqrt(9.81 * ship.length);
    const plane = planingHull ? smoothstep(0.42, 1.1, froude) : 0;
    const acceleration = reset ? 0 : clamp((state.u - this.lastSpeed) / dt, -5, 5);
    const nimbleness = ship.id === "spirit" ? 0.45 : ship.id === "speedboat" ? 0.85 : ship.id === "launch" ? 1 : ship.id === "yacht" ? 0.7 : 0.15;
    // The bow rises through the transition, then settles when fully on plane.
    const trim = state.docked ? 0 : nimbleness * (
      0.004 * acceleration + 0.023 * plane / (1 + Math.max(0, froude - 0.8) * 1.3)
    );
    const bankGain = ship.id === "spirit" ? 0.17 : ship.id === "speedboat" ? 0.30 : ship.id === "launch" ? 0.34 : ship.id === "yacht" ? 0.24 : 0.09;
    const bank = state.docked ? 0 : clamp(-Math.atan2(state.u * state.yawRate, 9.81) * bankGain, -0.10, 0.10);
    const mooring = state.docked ? 0.35 : 1;
    const targetHeight = water.height + plane * Math.min(ship.draft * 0.045, 0.035);
    const targetPitch = clamp(water.pitch * ship.waveResponse * mooring + trim, -0.12, 0.12);
    const targetRoll = clamp(water.roll * ship.waveResponse * mooring + bank, -0.16, 0.16);
    const rate = clamp(5.2 - Math.sqrt(ship.length) * 0.32, 1.8, 4.4);
    if (reset) {
      this.heave = { value: targetHeight, velocity: 0 };
      this.pitch = { value: targetPitch, velocity: 0 };
      this.roll = { value: targetRoll, velocity: 0 };
      this.pose.impact = 0;
    } else {
      advanceSpring(this.heave, targetHeight, rate, dt);
      advanceSpring(this.pitch, targetPitch, rate * 1.14, dt);
      advanceSpring(this.roll, targetRoll, rate * 0.85, dt);
      // An inertial heave must still remain immersed. Fast wave encounters and
      // accelerated travel cannot leave the hull suspended above yesterday's wave.
      const immersionMargin = Math.min(0.065 + weather.waveHeight * 0.12, ship.draft * 0.25 + 0.045);
      const immersedOffset = Math.tanh((this.heave.value - targetHeight) / immersionMargin);
      this.heave.value = targetHeight + immersionMargin * immersedOffset;
      this.heave.velocity = water.velocity + (this.heave.velocity - water.velocity) * (1 - immersedOffset * immersedOffset);
      const bowVelocity = this.heave.velocity + this.pitch.velocity * ship.length * 0.38;
      const entry = Math.max(0, water.bowVelocity - bowVelocity - 0.045);
      const splash = clamp(entry / (1.2 + Math.sqrt(ship.length) * 0.16) * (0.08 + speed / (speed + 3)), 0, 1);
      this.pose.impact = Math.max(splash, this.pose.impact * Math.exp(-dt * 7));
    }
    this.pose.height = this.heave.value;
    this.pose.pitch = this.pitch.value;
    this.pose.roll = this.roll.value;
    this.lastTime = state.simTime;
    this.lastSpeed = state.u;
    this.lastShip = ship.id;
    this.lastWeather = { waveHeight: weather.waveHeight, direction: weather.windDirection, seed: weather.seed };
    return this.pose;
  }
}

/** Eyes stay physically in the cockpit; only the gaze gets modest horizon stabilization. */
export function bridgeHullLook(pose: Readonly<HullPose>) {
  return { pitch: pose.pitch * 0.55, roll: pose.roll * 0.28 };
}
