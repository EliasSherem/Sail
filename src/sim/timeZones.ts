import { PORTS } from "../data/ports";
import { portTimeZone } from "../data/portTimeZones";
import { distance, normalizeLon } from "../geo/math";
import type { LatLon } from "../types";

export const CIVIL_PORT_RADIUS_METERS = 25_000;
export interface LocalClock {
  hour: number;
  date: string;
  timeZone: string;
  offsetMinutes: number;
  offsetLabel: string;
  source: "civil" | "maritime";
  portName?: string;
  utcMs: number;
}
const formatters = new Map<string, Intl.DateTimeFormat>();
const pad = (n: number) => Math.floor(n).toString().padStart(2, "0");
export const utcOffsetLabel = (minutes: number) =>
  `UTC${minutes < 0 ? "−" : "+"}${pad(Math.abs(minutes) / 60)}:${pad(Math.abs(minutes) % 60)}`;

function civilParts(timeZone: string, utcMs: number) {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-GB-u-ca-gregory-nu-latn", { timeZone, hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    formatters.set(timeZone, formatter);
  }
  const parts = Object.fromEntries(formatter.formatToParts(new Date(utcMs)).map(part => [part.type, part.value]));
  const localMs = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
  return { hour: Number(parts.hour) + Number(parts.minute) / 60 + (Number(parts.second) + ((utcMs % 1000) + 1000) % 1000 / 1000) / 3600,
    date: `${parts.year}-${parts.month}-${parts.day}`, offsetMinutes: Math.round((localMs - Math.floor(utcMs / 1000) * 1000) / 60_000) };
}

/** Civil rules apply around known service ports. Offshore time is a stated
 * nautical approximation (15° bands), not an inferred civil boundary map. */
export function clockAtPosition(position: LatLon, utcMs: number): LocalClock {
  let nearest: typeof PORTS[number] | undefined, nearestDistance = CIVIL_PORT_RADIUS_METERS;
  for (const port of PORTS) {
    // Cheap broad phase avoids hundreds of geodesics for every rendered clock.
    if (Math.abs(port.lat - position.lat) > .24) continue;
    const meters = distance(position, port);
    if (meters < nearestDistance && portTimeZone(port)) { nearest = port; nearestDistance = meters; }
  }
  if (nearest) {
    const timeZone = portTimeZone(nearest)!;
    try {
      const parts = civilParts(timeZone, utcMs);
      return { ...parts, timeZone, offsetLabel: utcOffsetLabel(parts.offsetMinutes), source: "civil", portName: nearest.name, utcMs };
    } catch {
      // An old browser may not recognize a renamed IANA identifier. Fall back
      // honestly to the nautical band instead of assigning a fictional DST rule.
    }
  }
  const offsetMinutes = Math.round(normalizeLon(position.lon) / 15) * 60;
  const local = new Date(utcMs + offsetMinutes * 60_000);
  return { hour: local.getUTCHours() + local.getUTCMinutes() / 60 + (local.getUTCSeconds() + ((utcMs % 1000) + 1000) % 1000 / 1000) / 3600,
    date: `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}`,
    timeZone: "Huso marítimo", offsetMinutes, offsetLabel: utcOffsetLabel(offsetMinutes), source: "maritime", utcMs };
}
