import { clockAtPosition, type LocalClock } from "./timeZones";

export const DEFAULT_DAY_LENGTH_SECONDS = 86_400;
export interface DaylightClock {
  /** Real unpaused time remains available for particles and wildlife. */
  environmentTime: number;
  /** Actual integrated time, including automatic coastal speed reductions. */
  state?: { simTime: number; lat?: number; lon?: number };
  /** UTC milliseconds corresponding to simulation second zero. */
  clockEpochMs?: number;
  dayStartHour: number;
  dayLengthSeconds: number;
}
const elapsed = (clock: DaylightClock) => clock.state?.simTime ?? clock.environmentTime;
const wrapHour = (hour: number) => ((hour % 24) + 24) % 24;
export const utcTimeMs = (clock: DaylightClock) =>
  (clock.clockEpochMs ?? Date.UTC(2000, 0, 1) + clock.dayStartHour * 3_600_000) + elapsed(clock) * 1000;
export const localClock = (clock: DaylightClock): LocalClock =>
  clockAtPosition({ lat: clock.state?.lat ?? 0, lon: clock.state?.lon ?? 0 }, utcTimeMs(clock));
/** Civil clock for UI; legacy plain clock objects remain readable for migration. */
export const dayHour = (clock: DaylightClock) => clock.clockEpochMs === undefined
  ? wrapHour(clock.dayStartHour + elapsed(clock) * 24 / clock.dayLengthSeconds)
  : localClock(clock).hour;
/** Mean solar time is continuous with longitude and ignores civil/DST jumps.
 * Pure arithmetic: safe to read every render frame without Intl or port search. */
export const solarHour = (clock: DaylightClock) =>
  wrapHour(utcTimeMs(clock) / 3_600_000 + (clock.state?.lon ?? 0) / 15);

export function initializeDaylight(clock: DaylightClock, now = Date.now()): void {
  clock.clockEpochMs = now - elapsed(clock) * 1000;
  clock.dayLengthSeconds = DEFAULT_DAY_LENGTH_SECONDS;
  setDayHour(clock, 9);
}
export function setDayHour(clock: DaylightClock, hour: number) {
  if (clock.clockEpochMs !== undefined) {
    // Re-evaluate a dated civil offset after each correction, covering DST
    // transitions when selecting a local hour on the current calendar date.
    for (let i = 0; i < 3; i++) {
      const correction = wrapHour(hour) - localClock(clock).hour;
      if (Math.abs(correction) < 1e-9) break;
      clock.clockEpochMs += correction * 3_600_000;
    }
  }
  clock.dayStartHour = ((hour - elapsed(clock) * 24 / clock.dayLengthSeconds) % 24 + 24) % 24;
}
export function setDayLength(clock: DaylightClock, seconds: number) {
  const hour = dayHour(clock);
  clock.dayLengthSeconds = clock.clockEpochMs === undefined ? seconds : DEFAULT_DAY_LENGTH_SECONDS;
  setDayHour(clock, hour);
}

interface SavedDaylight {
  environmentTime?: number;
  dayStartHour?: number;
  dayLengthSeconds?: number;
  daylightClock?: "simulation" | "utc";
  clockEpochMs?: number;
  savedAt?: string;
}

/** Old saves used a separate twelve-minute real-time day. Preserve their
 * displayed local hour while migrating to UTC. The short 12/30-minute cycle is
 * retired: every current clock advances one second per integrated voyage second. */
export function restoreDaylight(clock: DaylightClock, saved: SavedDaylight): void {
  clock.environmentTime = saved.environmentTime ?? 0;
  clock.dayStartHour = saved.dayStartHour ?? 9;
  clock.dayLengthSeconds = DEFAULT_DAY_LENGTH_SECONDS;
  if (saved.clockEpochMs !== undefined) {
    clock.clockEpochMs = saved.clockEpochMs;
    return;
  }
  const oldElapsed = saved.daylightClock === "simulation" ? elapsed(clock) : clock.environmentTime;
  const oldPeriod = saved.dayLengthSeconds ?? (saved.daylightClock === "simulation" ? DEFAULT_DAY_LENGTH_SECONDS : 720);
  const oldHour = wrapHour(clock.dayStartHour + oldElapsed * 24 / oldPeriod);
  const savedDate = saved.savedAt ? Date.parse(saved.savedAt) : NaN;
  initializeDaylight(clock, Number.isFinite(savedDate) ? savedDate : Date.now());
  setDayHour(clock, oldHour);
}
