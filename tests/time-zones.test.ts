import { describe, expect, it } from "vitest";
import { PORTS, portById } from "../src/data/ports";
import { portTimeZone } from "../src/data/portTimeZones";
import { destination } from "../src/geo/math";
import { parseSave, type SaveGame } from "../src/persistence/save";
import { dayHour, localClock, restoreDaylight, setDayHour, solarHour, utcTimeMs } from "../src/sim/daylight";
import { createVessel, Simulation } from "../src/sim/engine";
import { clockAtPosition } from "../src/sim/timeZones";
import { createWeather } from "../src/sim/weather";

const summer = Date.parse("2026-07-15T12:00:00Z");
const winter = Date.parse("2026-01-15T12:00:00Z");
const simulation = (id = "new-york", epoch = summer) => {
  const sim = new Simulation(createVessel("yacht", portById(id)!), createWeather("calm", 42));
  sim.clockEpochMs = epoch;
  return sim;
};

describe("UTC, civil port zones and nautical time", () => {
  it("covers every listed service port with a browser-supported IANA zone", () => {
    for (const port of PORTS) {
      const zone = portTimeZone(port);
      expect(zone, port.id).toBeDefined();
      expect(() => new Intl.DateTimeFormat("en", { timeZone: zone }).format(summer), port.id).not.toThrow();
    }
  });

  it.each([
    ["new-york", "America/New_York", -240, -300],
    ["cancun", "America/Cancun", -300, -300],
    ["los-cabos", "America/Mazatlan", -420, -420],
    ["acapulco", "America/Mexico_City", -360, -360],
    ["veracruz", "America/Mexico_City", -360, -360],
    ["haifa", "Asia/Jerusalem", 180, 120],
    ["ashdod", "Asia/Jerusalem", 180, 120],
    ["eilat", "Asia/Jerusalem", 180, 120],
    ["mumbai", "Asia/Kolkata", 330, 330],
    ["st-johns", "America/St_Johns", -150, -210],
  ])("uses dated civil offsets in %s", (id, timeZone, summerOffset, winterOffset) => {
    const port = portById(id as string)!;
    for (const [date, expected] of [[summer, summerOffset], [winter, winterOffset]] as const) {
      const clock = clockAtPosition(port, date as number);
      expect(clock.source).toBe("civil");
      expect(clock.timeZone).toBe(timeZone);
      expect(clock.offsetMinutes).toBe(expected);
      expect(clock.hour).toBe(12 + (expected as number) / 60);
    }
  });

  it("changes the nautical clock across a zone boundary without jumping UTC or the sun", () => {
    const sim = simulation();
    Object.assign(sim.state, { lat: 0, lon: -7.49 });
    const before = { civil: localClock(sim), solar: solarHour(sim), utc: utcTimeMs(sim) };
    sim.state.lon = -7.51;
    expect(localClock(sim)).toMatchObject({ source: "maritime", hour: 11, offsetLabel: "UTC−01:00" });
    expect(before.civil).toMatchObject({ source: "maritime", hour: 12, offsetLabel: "UTC+00:00" });
    expect(utcTimeMs(sim)).toBe(before.utc);
    expect(solarHour(sim) - before.solar).toBeCloseTo(-.02 / 15, 8);
  });

  it("keeps the solar trajectory continuous across DST while the civil clock changes", () => {
    const sim = simulation("new-york", Date.parse("2026-03-08T06:59:59Z"));
    const before = { local: localClock(sim), solar: solarHour(sim) };
    sim.state.simTime += 2;
    expect(before.local.hour).toBeCloseTo(2 - 1 / 3600, 9);
    expect(localClock(sim).hour).toBeCloseTo(3 + 1 / 3600, 9);
    expect(localClock(sim).offsetMinutes - before.local.offsetMinutes).toBe(60);
    expect(solarHour(sim) - before.solar).toBeCloseTo(2 / 3600, 8);
  });

  it("updates the local calendar date across the international date line", () => {
    const east = clockAtPosition({ lat: 0, lon: 179.99 }, summer);
    const west = clockAtPosition({ lat: 0, lon: -179.99 }, summer);
    expect(east).toMatchObject({ hour: 0, date: "2026-07-16", offsetMinutes: 720 });
    expect(west).toMatchObject({ hour: 0, date: "2026-07-15", offsetMinutes: -720 });
    expect(east.utcMs).toBe(west.utcMs);
  });

  it("limits civil rules to the vicinity of a known port", () => {
    const port = portById("cancun")!;
    expect(clockAtPosition(destination(port, Math.PI / 2, 24_000), summer).source).toBe("civil");
    expect(clockAtPosition(destination(port, Math.PI / 2, 26_000), summer).source).toBe("maritime");
  });

  it("saves and restores the absolute UTC epoch, date and local time after travel", () => {
    const sim = simulation("haifa");
    sim.state.simTime = 90_000;
    const game: SaveGame = { version: 1, savedAt: "2026-07-16T12:00:00Z", state: structuredClone(sim.state),
      sea: "calm", seed: 42, routeTarget: null, autopilot: false, mission: null,
      quality: "high", camera: "follow", tutorialComplete: true, daylightClock: "utc", clockEpochMs: sim.clockEpochMs };
    const parsed = parseSave(JSON.stringify(game))!;
    expect(parsed).not.toBeNull();
    const restored = new Simulation(structuredClone(parsed.state), createWeather("calm", 42));
    restoreDaylight(restored, parsed);
    expect(utcTimeMs(restored)).toBe(utcTimeMs(sim));
    expect(localClock(restored)).toEqual(localClock(sim));
    expect(solarHour(restored)).toBe(solarHour(sim));
    setDayHour(restored, 18.5);
    expect(dayHour(restored)).toBeCloseTo(18.5, 9);
    expect(restored.state.simTime).toBe(90_000);
    expect(parseSave(JSON.stringify({ ...game, clockEpochMs: 8.64e15 }))).toBeNull();
    expect(parseSave(JSON.stringify({ ...game, clockEpochMs: "not-a-date" }))).toBeNull();
  });

  it("migrates an old accelerated-day save while preserving its displayed local hour", () => {
    const sim = simulation("cancun");
    sim.state.simTime = 9876;
    restoreDaylight(sim, { dayStartHour: 9, dayLengthSeconds: 1800, daylightClock: "simulation", savedAt: "2026-07-15T12:00:00Z" });
    const expected = (9 + sim.state.simTime * 24 / 1800) % 24;
    expect(dayHour(sim)).toBeCloseTo(expected, 8);
    expect(sim.dayLengthSeconds).toBe(86400);
    const utc = utcTimeMs(sim);
    sim.state.simTime += 3600;
    expect(utcTimeMs(sim) - utc).toBe(3_600_000);
    expect(dayHour(sim)).toBeCloseTo((expected + 1) % 24, 8);
  });
});
