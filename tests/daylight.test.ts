import { describe, expect, it } from "vitest";
import { dayHour, restoreDaylight, setDayHour, setDayLength, type DaylightClock } from "../src/sim/daylight";
import { createVessel, FIXED_DT, Simulation, TIME_SCALES } from "../src/sim/engine";
import { createWeather } from "../src/sim/weather";

function simulation() {
  const sim = new Simulation(createVessel("yacht", { lat: 42, lon: 4 }), createWeather("calm", 4821));
  sim.evolvingWeather = false;
  return sim;
}

describe("visible daylight clock", () => {
  it.each(TIME_SCALES)("advances daylight with the effective %s× simulation multiplier", scale => {
    const sim = simulation();
    sim.requestedScale = scale;
    for (let frame = 0; frame < 60; frame++) sim.advance(1 / 60);
    expect(sim.activeScale).toBe(scale);
    expect(sim.state.simTime).toBeCloseTo(scale, 6);
    expect(dayHour(sim)).toBeCloseTo(9 + scale / 3600, 9);
    expect(sim.environmentTime).toBeCloseTo(1, 10);
  });

  it("advances one solar hour in 3600 real seconds at 1× and 3.6 seconds at 1000×", () => {
    const normal = simulation(), fast = simulation();
    expect(normal.dayLengthSeconds).toBe(86400);
    expect(dayHour(normal)).toBe(9);
    fast.requestedScale = 1000;
    for (let i = 0; i < 36; i++) normal.advance(100);
    for (let i = 0; i < 216; i++) fast.advance(1 / 60);
    expect(normal.state.simTime).toBeCloseTo(3600, 6);
    expect(fast.state.simTime).toBeCloseTo(3600, 6);
    expect(normal.realTime).toBe(3600);
    expect(fast.realTime).toBeCloseTo(3.6, 10);
    expect(dayHour(normal)).toBeCloseTo(10, 9);
    expect(dayHour(fast)).toBeCloseTo(10, 9);
    // Particle/fauna animation clocks stay smooth and independent of solar time.
    expect(normal.environmentTime).toBe(3600);
    expect(fast.environmentTime).toBeCloseTo(3.6, 10);
  });

  it("freezes both daylight and physics while paused, then resumes without a clock jump", () => {
    const sim = simulation();
    sim.advance(3 + FIXED_DT / 2);
    const before = { environmentTime: sim.environmentTime, hour: dayHour(sim),
      simTime: sim.state.simTime, accumulator: sim.accumulator };
    sim.paused = true;
    sim.advance(300);
    expect(sim.environmentTime).toBe(before.environmentTime);
    expect(dayHour(sim)).toBe(before.hour);
    expect(sim.state.simTime).toBe(before.simTime);
    expect(sim.accumulator).toBe(before.accumulator);
    sim.paused = false;
    sim.advance(1);
    expect(sim.environmentTime).toBe(before.environmentTime + 1);
    expect(dayHour(sim)).toBeCloseTo(before.hour + 1 / 3600, 10);
    expect(sim.state.simTime).toBeGreaterThan(before.simTime);
  });

  it("100× travel accelerates the visible day by the same amount as physics", () => {
    const normal = simulation(), fast = simulation();
    fast.requestedScale = 100;
    for (let frame = 0; frame < 60; frame++) {
      normal.advance(1 / 60);
      fast.advance(1 / 60);
    }
    expect(fast.activeScale).toBe(100);
    expect(fast.state.simTime).toBeCloseTo(normal.state.simTime * 100, 6);
    expect(normal.environmentTime).toBeCloseTo(1, 10);
    expect(fast.environmentTime).toBe(normal.environmentTime);
    expect(dayHour(fast) - 9).toBeCloseTo((dayHour(normal) - 9) * 100, 10);
    expect(dayHour(fast)).toBeCloseTo(9 + 100 / 3600, 10);
  });

  it("uses the effective reduced time near a coast and never credits unprocessed step debt", () => {
    const nearCoast = simulation();
    nearCoast.world = { clearance: () => 40, sweep: () => ({ hit: false }) };
    nearCoast.requestedScale = 1000;
    nearCoast.advance(1);
    expect(nearCoast.activeScale).toBe(1);
    expect(dayHour(nearCoast)).toBeCloseTo(9 + 1 / 3600, 10);
    const stalled = simulation();
    stalled.requestedScale = 1000;
    stalled.advance(.5);
    expect(stalled.accumulator).toBeGreaterThan(160);
    expect(dayHour(stalled)).toBeCloseTo(9 + stalled.state.simTime / 3600, 10);
    expect(dayHour(stalled)).toBeLessThan(9 + 500 / 3600);
    stalled.advance(1e-8);
    expect(dayHour(stalled)).toBeCloseTo(9 + 500 / 3600, 9);
  });

  it("migrates a legacy real-time day without changing the displayed hour", () => {
    const legacy = { environmentTime: 233.5, dayStartHour: 9, dayLengthSeconds: 720 };
    const sim = simulation();
    sim.state.simTime = 25_000;
    restoreDaylight(sim, legacy);
    expect(sim.dayLengthSeconds).toBe(86400);
    expect(sim.environmentTime).toBe(legacy.environmentTime);
    expect(dayHour(sim)).toBeCloseTo(dayHour(legacy), 10);
    sim.advance(10);
    expect(dayHour(sim)).toBeCloseTo(dayHour(legacy) + 10 / 3600, 9);
  });

  it("migrates a saved simulation day to a normal 24-hour UTC cycle without moving the displayed hour", () => {
    const sim = simulation();
    sim.state.simTime = 9876;
    setDayLength(sim, 1800);
    setDayHour(sim, 18.75);
    const hour = dayHour(sim);
    const restored = simulation();
    restored.state.simTime = sim.state.simTime;
    restoreDaylight(restored, { environmentTime: 7, dayStartHour: sim.dayStartHour,
      dayLengthSeconds: sim.dayLengthSeconds, daylightClock: "simulation" });
    expect(restored.dayLengthSeconds).toBe(86400);
    expect(dayHour(restored)).toBeCloseTo(hour, 10);
    restored.advance(10);
    expect(dayHour(restored)).toBeCloseTo(hour + 10 / 3600, 9);
  });

  it.each([720, 1800, 86400])("changing the day duration to %s seconds preserves the displayed hour", (seconds) => {
    const clock: DaylightClock = { environmentTime: 433.375, dayStartHour: 9, dayLengthSeconds: 720 };
    const hour = dayHour(clock), elapsed = clock.environmentTime;
    setDayLength(clock, seconds);
    expect(clock.dayLengthSeconds).toBe(seconds);
    expect(clock.environmentTime).toBe(elapsed);
    expect(dayHour(clock)).toBeCloseTo(hour, 10);
    clock.environmentTime += seconds / 24;
    expect(dayHour(clock)).toBeCloseTo((hour + 1) % 24, 10);
  });

  it.each([[-1, 23], [24, 0], [49.5, 1.5], [-50.25, 21.75]])("setting hour %s wraps to %s without resetting elapsed time", (requested, expected) => {
    const clock: DaylightClock = { environmentTime: 123.45, dayStartHour: 9, dayLengthSeconds: 1800 };
    setDayHour(clock, requested);
    expect(dayHour(clock)).toBeCloseTo(expected, 10);
    expect(clock.environmentTime).toBe(123.45);
    expect(clock.dayStartHour).toBeGreaterThanOrEqual(0);
    expect(clock.dayStartHour).toBeLessThan(24);
    clock.environmentTime += 75;
    expect(dayHour(clock)).toBeCloseTo((expected + 1) % 24, 10);
  });
});
