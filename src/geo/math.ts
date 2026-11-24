import type { LatLon } from "../types";

/** IUGG mean Earth radius. Spherical great-circle model, not an ellipsoidal chart. */
export const EARTH_RADIUS = 6_371_008.8;
export const METERS_PER_NAUTICAL_MILE = 1852;
export const DEG = Math.PI / 180;
export const normalizeLon = (lon: number): number =>
  ((((lon + 180) % 360) + 360) % 360) - 180;
export const toKnots = (metersPerSecond: number): number =>
  (metersPerSecond * 3600) / METERS_PER_NAUTICAL_MILE;
export const fromKnots = (knots: number): number =>
  (knots * METERS_PER_NAUTICAL_MILE) / 3600;
export const toNauticalMiles = (meters: number): number =>
  meters / METERS_PER_NAUTICAL_MILE;

export function distance(a: LatLon, b: LatLon): number {
  const phi1 = a.lat * DEG,
    phi2 = b.lat * DEG;
  const dp = phi2 - phi1,
    dl = normalizeLon(b.lon - a.lon) * DEG;
  const h =
    Math.sin(dp / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dl / 2) ** 2;
  return 2 * EARTH_RADIUS * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}

/** Initial geodesic bearing in radians, clockwise from geographic north. */
export function bearing(a: LatLon, b: LatLon): number {
  const phi1 = a.lat * DEG,
    phi2 = b.lat * DEG,
    dl = normalizeLon(b.lon - a.lon) * DEG;
  return (
    (Math.atan2(
      Math.sin(dl) * Math.cos(phi2),
      Math.cos(phi1) * Math.sin(phi2) -
        Math.sin(phi1) * Math.cos(phi2) * Math.cos(dl),
    ) +
      Math.PI * 2) %
    (Math.PI * 2)
  );
}

export function destination(
  origin: LatLon,
  heading: number,
  meters: number,
): LatLon {
  const delta = meters / EARTH_RADIUS,
    phi = origin.lat * DEG;
  const lat = Math.asin(
    Math.max(
      -1,
      Math.min(
        1,
        Math.sin(phi) * Math.cos(delta) +
          Math.cos(phi) * Math.sin(delta) * Math.cos(heading),
      ),
    ),
  );
  const lon =
    origin.lon * DEG +
    Math.atan2(
      Math.sin(heading) * Math.sin(delta) * Math.cos(phi),
      Math.cos(delta) - Math.sin(phi) * Math.sin(lat),
    );
  return { lat: lat / DEG, lon: normalizeLon(lon / DEG) };
}

/** Local azimuthal-equidistant projection. The origin can move without moving the vessel. */
export function toLocal(
  point: LatLon,
  origin: LatLon,
): { x: number; z: number } {
  const d = distance(origin, point),
    angle = bearing(origin, point);
  return { x: Math.sin(angle) * d, z: -Math.cos(angle) * d };
}

export function fromLocal(x: number, z: number, origin: LatLon): LatLon {
  return destination(origin, Math.atan2(x, -z), Math.hypot(x, z));
}
