import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { SHIPS } from "../src/data/ships";
import { createWeather, weatherAt, waveAt, waveComponents } from "../src/sim/weather";
import { createVessel, FIXED_DT, stepVessel } from "../src/sim/engine";
import { WeatherEffects, weatherLightning } from "../src/render/WeatherEffects";
import type { Quality, SeaState } from "../src/types";

const ORDER: SeaState[] = ["calm", "moderate", "rain", "rough", "storm", "hurricane"];

describe("six reproducible weather presets", () => {
  it("keeps increasing wind/waves and decreasing visibility across all presets", () => {
    for (const seed of [0, 4821, 99237]) for (const time of [0, 13, 57, 900, 12000]) {
      const samples = ORDER.map((sea) => weatherAt(sea, seed, time));
      for (const [index, sample] of samples.entries()) {
        expect(sample).toEqual(weatherAt(sample.sea, seed, time));
        for (const [key, value] of Object.entries(sample))
          if (key !== "sea") expect(Number.isFinite(value)).toBe(true);
        expect(sample.windDirection).toBeGreaterThanOrEqual(0);
        expect(sample.windDirection).toBeLessThan(Math.PI * 2);
        if (index) {
          expect(sample.windSpeed).toBeGreaterThan(samples[index - 1].windSpeed);
          expect(sample.waveHeight).toBeGreaterThan(samples[index - 1].waveHeight);
          expect(sample.visibility).toBeLessThan(samples[index - 1].visibility);
        }
      }
    }
  });

  it.each(ORDER)("changes %s continuously between nearby times and keeps waves finite", (sea) => {
    for (const time of [0, 9, 50, 172, 3000]) {
      const before = weatherAt(sea, 4821, time), after = weatherAt(sea, 4821, time + FIXED_DT);
      expect(Math.abs(after.windSpeed - before.windSpeed)).toBeLessThan(0.05);
      expect(Math.abs(after.windDirection - before.windDirection)).toBeLessThan(0.01);
      expect(Math.abs(after.waveHeight - before.waveHeight)).toBeLessThan(0.01);
      const waves = waveComponents(before);
      expect(waves).toHaveLength(3);
      for (const wave of waves) {
        expect(wave.wavelength).toBeGreaterThan(10);
        expect(Number.isFinite(wave.speed)).toBe(true);
      }
      const motion = waveAt(10000, -25000, time, before, 9.4, 1.8);
      expect(Math.abs(motion.height)).toBeLessThan(before.waveHeight);
      expect(Math.abs(motion.pitch)).toBeLessThan(0.6);
      expect(Math.abs(motion.roll)).toBeLessThan(0.6);
    }
  });

  it("keeps all six hulls finite during a hurricane without changing their fuel curves", () => {
    for (const ship of SHIPS) {
      const state = createVessel(ship.id, { lat: 42, lon: 4 });
      const initialFuel = state.fuel;
      for (let step = 0; step < 900; step++)
        stepVessel(state, weatherAt("hurricane", 4821, step * FIXED_DT), FIXED_DT, undefined, {
          throttle: 0.6, rudder: Math.sin(step / 90) * 0.25, gear: 1,
        });
      for (const value of [state.lat, state.lon, state.heading, state.u, state.v, state.yawRate])
        expect(Number.isFinite(value)).toBe(true);
      expect(Math.abs(state.u)).toBeLessThan(200);
      expect(Math.abs(state.v)).toBeLessThan(100);
      expect(state.fuel).toBeLessThan(initialFuel);
      expect(state.fuel).toBeGreaterThan(0);
    }
  });
});

describe("bounded weather visuals without a GPU", () => {
  it("never flashes faster than five seconds and has no lightning in the other presets", () => {
    for (const sea of ORDER) {
      const weather = createWeather(sea, 4821);
      const starts: number[] = [];
      let previous = 0;
      for (let frame = 0; frame < 120 * 60; frame++) {
        const time = frame / 60, light = weatherLightning(weather, time);
        expect(light).toBeGreaterThanOrEqual(0);
        expect(light).toBeLessThanOrEqual(0.8);
        if (light > 0.01 && previous <= 0.01) starts.push(time);
        previous = light;
      }
      if (sea === "storm" || sea === "hurricane") {
        expect(starts.length).toBeGreaterThan(5);
        for (let index = 1; index < starts.length; index++)
          expect(starts[index] - starts[index - 1]).toBeGreaterThan(5);
      } else expect(starts).toHaveLength(0);
    }
  });

  it("freezes at the same visual clock, follows rebasing, and changes rain orientation with wind", () => {
    const effects = new WeatherEffects();
    const weather = createWeather("hurricane", 4821);
    const point = new THREE.Vector3(1200, 0, -850);
    const first = effects.update(point, weather, 17.3, "high", 0.8);
    const squall = effects.group.getObjectByName("weather-hurricane-squalls")!;
    const angle = squall.rotation.y;
    const rain = effects.group.getObjectByName("weather-rain-streaks") as THREE.LineSegments<THREE.BufferGeometry, THREE.ShaderMaterial>;
    for (let frame = 0; frame < 60; frame++) {
      expect(effects.update(point, weather, 17.3, "high", 0.8)).toEqual(first);
      expect(squall.rotation.y).toBe(angle);
    }
    const oldWind = rain.material.uniforms.uWind.value.clone() as THREE.Vector2;
    effects.update(new THREE.Vector3(0, 0, 0), { ...weather, windDirection: weather.windDirection + Math.PI }, 17.3, "high", 0.8);
    expect(effects.group.position.toArray()).toEqual([0, 0, 0]);
    expect(rain.material.uniforms.uWind.value.dot(oldWind)).toBeLessThan(0);
    effects.update(point, createWeather("calm"), 18, "high", 1);
    expect(rain.visible).toBe(false);
    expect(rain.geometry.drawRange.count).toBe(0);
    effects.dispose();
    expect(effects.group.children).toHaveLength(0);
  });

  it("retains fixed GPU buffers across long updates and enforces quality budgets", () => {
    const effects = new WeatherEffects();
    const rain = effects.group.getObjectByName("weather-rain-streaks") as THREE.LineSegments<THREE.BufferGeometry, THREE.ShaderMaterial>;
    const positions = rain.geometry.getAttribute("position").array;
    const seeds = rain.geometry.getAttribute("aSeed").array;
    const children = [...effects.group.children];
    const point = new THREE.Vector3();
    const weather = createWeather("hurricane", 4821);
    for (const [quality, count] of Object.entries({ low: 900, medium: 2300, high: 4800 })) {
      for (let index = 0; index < 2000; index++)
        effects.update(point, weather, index / 60, quality as Quality, 0.5);
      expect(rain.geometry.drawRange.count).toBe(count * 2);
      expect(rain.geometry.getAttribute("position").array).toBe(positions);
      expect(rain.geometry.getAttribute("aSeed").array).toBe(seeds);
      expect(effects.group.children).toEqual(children);
    }
    expect(positions.length).toBe(4800 * 6);
    effects.dispose();
  });
});
