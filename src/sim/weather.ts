import type { SeaState, WaveSample, Weather } from "../types";

const TAU = Math.PI * 2;
const PRESETS: Record<SeaState, {
  windSpeed: number; waveHeight: number; visibility: number; currentSpeed: number;
}> = {
  calm: {
    windSpeed: 3.4,
    waveHeight: 0.35,
    visibility: 24000,
    currentSpeed: 0.22,
  },
  moderate: {
    windSpeed: 8.2,
    waveHeight: 1.25,
    visibility: 16000,
    currentSpeed: 0.38,
  },
  rough: {
    windSpeed: 14.5,
    waveHeight: 3.2,
    visibility: 7500,
    currentSpeed: 0.58,
  },
  rain: {
    windSpeed: 11,
    waveHeight: 1.85,
    visibility: 10500,
    currentSpeed: 0.45,
  },
  storm: {
    windSpeed: 22,
    waveHeight: 5.4,
    visibility: 3500,
    currentSpeed: 0.8,
  },
  hurricane: {
    windSpeed: 38,
    waveHeight: 8.5,
    visibility: 1200,
    currentSpeed: 1.2,
  },
};

/** Synthetic, reproducible weather. Directions indicate travel TOWARD, clockwise from north. */
export function createWeather(sea: SeaState = "calm", seed = 2741): Weather {
  return weatherAt(sea, seed, 0);
}

export function weatherAt(sea: SeaState, seed: number, time: number): Weather {
  const base = PRESETS[sea];
  const phase = ((seed % 997) / 997) * TAU;
  const tide = Math.sin(time / 5200 + phase);
  const gust =
    1 +
    0.13 * Math.sin(time / 171 + phase) +
    0.07 * Math.sin(time / 37 + phase * 2) +
    (sea === "hurricane" ? 0.13 * Math.sin(time / 9 + phase * 3)
      : sea === "storm" ? 0.06 * Math.sin(time / 17 + phase * 3) : 0);
  const squallDirection = sea === "hurricane"
    ? 0.18 * Math.sin(time / 21 + phase) : 0;
  return {
    sea,
    seed,
    windSpeed: base.windSpeed * gust,
    windDirection: (1.05 + 0.27 * Math.sin(time / 1700 + phase) + squallDirection + TAU) % TAU,
    currentSpeed: base.currentSpeed * (1 + 0.25 * tide),
    currentDirection: (2.25 + 0.12 * Math.sin(time / 4000 + phase) + TAU) % TAU,
    waveHeight: base.waveHeight * (1 + 0.12 * Math.sin(time / 700 + phase)),
    visibility: base.visibility * (0.9 + 0.1 * Math.sin(time / 2200 + phase)),
  };
}

export interface WaveComponent {
  amplitude: number;
  wavelength: number;
  direction: number;
  /** Angular frequency in radians / second, not phase velocity. */
  speed: number;
  phase: number;
}

export function waveComponents(weather: Weather): WaveComponent[] {
  const scale = {
    calm: 0.85, moderate: 1.2, rain: 1.35, rough: 1.65, storm: 2.2, hurricane: 3.1,
  }[weather.sea];
  return [
    { weight: 0.58, length: 62, direction: 0, phase: 0 },
    { weight: 0.27, length: 29, direction: 0.53, phase: 1.7 },
    { weight: 0.15, length: 13, direction: -0.68, phase: 3.2 },
  ].map((wave) => ({
    amplitude: weather.waveHeight * 0.5 * wave.weight,
    wavelength: wave.length * scale,
    direction: weather.windDirection + wave.direction,
    speed: Math.sqrt((9.81 * TAU) / (wave.length * scale)),
    phase: wave.phase + (weather.seed % 101) * 0.037,
  }));
}

/** Same analytic field as the renderer. Heave/pitch/roll are visual secondary motions, not 6-DOF forces. */
export function waveAt(
  east: number,
  north: number,
  time: number,
  weather: Weather,
  shipLength = 0,
  heading = 0,
): WaveSample {
  let height = 0;
  let pitch = 0;
  let roll = 0;
  for (const wave of waveComponents(weather)) {
    const k = TAU / wave.wavelength;
    const phase =
      k * (east * Math.sin(wave.direction) + north * Math.cos(wave.direction)) -
      wave.speed * time +
      wave.phase;
    const attenuation =
      shipLength > 0
        ? 1 / Math.sqrt(1 + (shipLength / wave.wavelength) ** 2)
        : 1;
    height += wave.amplitude * Math.sin(phase) * attenuation;
    const slope = wave.amplitude * k * Math.cos(phase) * attenuation;
    pitch += slope * Math.cos(wave.direction - heading);
    roll += slope * Math.sin(wave.direction - heading);
  }
  return { height, pitch: Math.atan(pitch), roll: Math.atan(roll) };
}
