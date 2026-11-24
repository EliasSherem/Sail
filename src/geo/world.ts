import type { CollisionResult, CollisionWorld, LatLon } from "../types";
import { PORTS } from "../data/ports";
import { openCanalsInLand } from "./canalGeometry";
import {
  bearing,
  DEG,
  destination,
  distance,
  fromLocal,
  normalizeLon,
  toLocal,
} from "./math";

export interface Dock {
  portId: string;
  center: LatLon;
  length: number;
  width: number;
  heading: number;
}
interface Edge {
  a: LatLon;
  b: LatLon;
}
interface XY {
  x: number;
  z: number;
}
interface Bounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}
interface LandFeature {
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
}
export interface LandData {
  features: LandFeature[];
}

const cellKey = (lat: number, lon: number): string => `${lat},${lon}`;
const subtract = (a: XY, b: XY): XY => ({ x: a.x - b.x, z: a.z - b.z });
const dot = (a: XY, b: XY): number => a.x * b.x + a.z * b.z;
const cross = (a: XY, b: XY): number => a.x * b.z - a.z * b.x;
function pointSegmentDistance(p: XY, a: XY, b: XY): number {
  const ab = subtract(b, a),
    denom = dot(ab, ab);
  const t =
    denom > 0 ? Math.max(0, Math.min(1, dot(subtract(p, a), ab) / denom)) : 0;
  return Math.hypot(p.x - a.x - ab.x * t, p.z - a.z - ab.z * t);
}
function segmentDistance(a: XY, b: XY, c: XY, d: XY): number {
  const ab = subtract(b, a),
    cd = subtract(d, c),
    ac = subtract(c, a),
    denom = cross(ab, cd);
  if (Math.abs(denom) > 1e-10) {
    const t = cross(ac, cd) / denom,
      u = cross(ac, ab) / denom;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return 0;
  }
  return Math.min(
    pointSegmentDistance(a, c, d),
    pointSegmentDistance(b, c, d),
    pointSegmentDistance(c, a, b),
    pointSegmentDistance(d, a, b),
  );
}
function pointInRing(point: XY, ring: XY[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i],
      b = ring[j];
    if (
      a.z > point.z !== b.z > point.z &&
      point.x < ((b.x - a.x) * (point.z - a.z)) / (b.z - a.z) + a.x
    )
      inside = !inside;
  }
  return inside;
}

function splitDateLine(ring: LatLon[]): LatLon[][] {
  // Source data are already cut at the dateline. Also accept custom rings crossing it.
  if (
    !ring.some(
      (p, i) =>
        i > 0 &&
        Math.abs(p.lon - ring[i - 1].lon) > 180 &&
        Math.abs(p.lat) < 89.999,
    )
  )
    return [ring];
  const unwrapped: LatLon[] = [];
  for (const point of ring) {
    const previous = unwrapped[unwrapped.length - 1];
    unwrapped.push({
      lat: point.lat,
      lon: previous
        ? previous.lon + normalizeLon(point.lon - previous.lon)
        : point.lon,
    });
  }
  const clip = (
    points: LatLon[],
    boundary: number,
    above: boolean,
  ): LatLon[] => {
    const out: LatLon[] = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i],
        b = points[(i + 1) % points.length];
      const aInside = above ? a.lon >= boundary : a.lon <= boundary,
        bInside = above ? b.lon >= boundary : b.lon <= boundary;
      if (aInside) out.push(a);
      if (aInside !== bInside)
        out.push({
          lon: boundary,
          lat: a.lat + ((b.lat - a.lat) * (boundary - a.lon)) / (b.lon - a.lon),
        });
    }
    return out;
  };
  const min = Math.floor(
    (Math.min(...unwrapped.map((p) => p.lon)) + 180) / 360,
  );
  const max = Math.floor(
    (Math.max(...unwrapped.map((p) => p.lon)) + 180) / 360,
  );
  const result: LatLon[][] = [];
  for (let shift = min; shift <= max; shift++) {
    const cut = clip(
      clip(unwrapped, -180 + shift * 360, true),
      180 + shift * 360,
      false,
    ).map((p) => ({ lat: p.lat, lon: p.lon - shift * 360 }));
    if (cut.length < 3) continue;
    if (
      cut[0].lat !== cut[cut.length - 1].lat ||
      cut[0].lon !== cut[cut.length - 1].lon
    )
      cut.push({ ...cut[0] });
    result.push(cut);
  }
  return result;
}

export class World implements CollisionWorld {
  readonly landPolygons: LatLon[][];
  readonly docks: Dock[];
  private readonly bounds: Bounds[];
  private readonly edges: Edge[] = [];
  private readonly edgeCells = new Map<string, number[]>();
  private readonly latitudeBands = new Map<number, number[]>();
  private readonly landCells = new Map<
    string,
    { lat: number; lon: number; inside: boolean }
  >();

  constructor(polygons: LatLon[][], docks?: Dock[]) {
    this.landPolygons = openCanalsInLand(polygons.flatMap(splitDateLine));
    this.docks =
      docks ??
      PORTS.map((port) => ({
        portId: port.id,
        center: destination(port, Math.PI / 2, 160),
        length: 300,
        width: 32,
        heading: 0,
      }));
    this.bounds = this.landPolygons.map((ring) => ({
      minLat: Math.min(...ring.map((p) => p.lat)),
      maxLat: Math.max(...ring.map((p) => p.lat)),
      minLon: Math.min(...ring.map((p) => p.lon)),
      maxLon: Math.max(...ring.map((p) => p.lon)),
    }));
    for (const ring of this.landPolygons) {
      for (let i = 0; i < ring.length - 1; i++) {
        const edge = { a: ring[i], b: ring[i + 1] },
          index = this.edges.length;
        this.edges.push(edge);
        const minLat = Math.floor(Math.min(edge.a.lat, edge.b.lat));
        const maxLat = Math.floor(Math.max(edge.a.lat, edge.b.lat));
        const minLon = Math.floor(Math.min(edge.a.lon, edge.b.lon));
        const maxLon = Math.floor(Math.max(edge.a.lon, edge.b.lon));
        for (let lat = minLat; lat <= maxLat; lat++) {
          const band = this.latitudeBands.get(lat) ?? [];
          band.push(index);
          this.latitudeBands.set(lat, band);
          for (let lon = minLon; lon <= maxLon; lon++) {
            const key = cellKey(lat, lon),
              bucket = this.edgeCells.get(key) ?? [];
            bucket.push(index);
            this.edgeCells.set(key, bucket);
          }
        }
      }
    }
  }

  /** All displayed and colliding land comes from these exact same exterior rings. */
  polygonsNear(center: LatLon, radius: number): LatLon[][] {
    const dLat = radius / 110_000,
      dLon = dLat / Math.max(0.01, Math.cos(center.lat * DEG));
    return this.landPolygons.filter((_, i) => {
      const b = this.bounds[i];
      return (
        b.minLat <= center.lat + dLat &&
        b.maxLat >= center.lat - dLat &&
        [-360, 0, 360].some(
          (shift) =>
            b.minLon + shift <= center.lon + dLon &&
            b.maxLon + shift >= center.lon - dLon,
        )
      );
    });
  }

  /** Inland lakes are intentionally unavailable: holes are filled in the display too. */
  isLand(point: LatLon): boolean {
    const lon = normalizeLon(point.lon);
    const latCell = Math.floor(point.lat),
      lonCell = Math.floor(lon),
      key = cellKey(latCell, lonCell);
    let reference = this.landCells.get(key);
    if (!reference) {
      const lat = latCell + 0.41234567,
        cellLon = lonCell + 0.43219876;
      reference = {
        lat,
        lon: cellLon,
        inside: this.globalLandTest({ lat, lon: cellLon }),
      };
      this.landCells.set(key, reference);
    }
    let inside = reference.inside;
    const dx = lon - reference.lon,
      dy = point.lat - reference.lat,
      lengthSquared = dx * dx + dy * dy;
    if (lengthSquared < 1e-24) return inside;
    // The classification can only change when the segment to our fixed cell sample
    // crosses a coastline. This avoids scanning continental rings every physics tick.
    for (const index of this.edgeCells.get(key) ?? []) {
      const { a, b } = this.edges[index];
      const ax = a.lon - reference.lon,
        ay = a.lat - reference.lat;
      const bx = b.lon - reference.lon,
        by = b.lat - reference.lat;
      const sideA = dx * ay - dy * ax,
        sideB = dx * by - dy * bx;
      if (sideA > 0 === sideB > 0) continue;
      const t = sideA / (sideA - sideB);
      const along = (ax + (bx - ax) * t) * dx + (ay + (by - ay) * t) * dy;
      if (along > 0 && along < lengthSquared) inside = !inside;
    }
    return inside;
  }

  private globalLandTest(point: LatLon): boolean {
    let inside = false;
    for (const index of this.latitudeBands.get(Math.floor(point.lat)) ?? []) {
      const { a, b } = this.edges[index];
      if (
        a.lat > point.lat !== b.lat > point.lat &&
        point.lon <
          ((b.lon - a.lon) * (point.lat - a.lat)) / (b.lat - a.lat) + a.lon
      )
        inside = !inside;
    }
    return inside;
  }

  private nearEdges(center: LatLon, radius: number): Edge[] {
    const latSpan = radius / 110_000 + 0.001;
    const lonSpan = latSpan / Math.max(0.001, Math.cos(center.lat * DEG));
    const indices = new Set<number>();
    for (
      let lat = Math.max(-90, Math.floor(center.lat - latSpan));
      lat <= Math.min(90, Math.floor(center.lat + latSpan));
      lat++
    ) {
      for (
        let lon = Math.floor(center.lon - Math.min(180, lonSpan));
        lon <= Math.floor(center.lon + Math.min(180, lonSpan));
        lon++
      ) {
        const wrapped = ((((lon + 180) % 360) + 360) % 360) - 180;
        for (const index of this.edgeCells.get(cellKey(lat, wrapped)) ?? [])
          indices.add(index);
        // Preserve data edges whose endpoint lies exactly at +180 degrees.
        if (wrapped === -180)
          for (const index of this.edgeCells.get(cellKey(lat, 180)) ?? [])
            indices.add(index);
      }
    }
    return [...indices].map((i) => this.edges[i]);
  }

  dockPolygon(dock: Dock): LatLon[] {
    const forward = { x: Math.sin(dock.heading), z: -Math.cos(dock.heading) };
    const right = { x: Math.cos(dock.heading), z: Math.sin(dock.heading) };
    return [
      [-1, -1],
      [-1, 1],
      [1, 1],
      [1, -1],
    ].map(([f, r]) =>
      fromLocal(
        (forward.x * f * dock.length) / 2 + (right.x * r * dock.width) / 2,
        (forward.z * f * dock.length) / 2 + (right.z * r * dock.width) / 2,
        dock.center,
      ),
    );
  }

  /** Clearance to shared land/dock geometry, capped at 50 km offshore. */
  clearance(point: LatLon): number {
    if (this.isLand(point)) return 0;
    const origin = { x: 0, z: 0 };
    let result = 50_000;
    for (const edge of this.nearEdges(point, result)) {
      result = Math.min(
        result,
        pointSegmentDistance(
          origin,
          toLocal(edge.a, point),
          toLocal(edge.b, point),
        ),
      );
    }
    for (const dock of this.docks) {
      if (distance(point, dock.center) > result + dock.length) continue;
      const ring = this.dockPolygon(dock).map((p) => toLocal(p, point));
      if (pointInRing(origin, ring)) return 0;
      for (let i = 0; i < ring.length; i++)
        result = Math.min(
          result,
          pointSegmentDistance(origin, ring[i], ring[(i + 1) % ring.length]),
        );
    }
    return result;
  }

  /** Swept finite-radius disk; continuous segment/edge tests prevent tunnelling. */
  sweep(from: LatLon, to: LatLon, radius: number): CollisionResult {
    if (this.isLand(from)) return { hit: true, point: from, kind: "land" };
    const total = distance(from, to),
      heading = bearing(from, to);
    const steps = Math.max(1, Math.ceil(total / 2000));
    let previous = from;
    for (let step = 1; step <= steps; step++) {
      const next =
        step === steps
          ? to
          : destination(from, heading, (total * step) / steps);
      const hit = this.sweepLocal(previous, next, Math.max(0, radius));
      if (hit.hit) return hit;
      previous = next;
    }
    return { hit: false };
  }

  private sweepLocal(
    from: LatLon,
    to: LatLon,
    radius: number,
  ): CollisionResult {
    const start = { x: 0, z: 0 },
      end = toLocal(to, from),
      length = Math.hypot(end.x, end.z);
    const reach = length + radius + 10;
    for (const edge of this.nearEdges(from, reach)) {
      if (
        segmentDistance(
          start,
          end,
          toLocal(edge.a, from),
          toLocal(edge.b, from),
        ) <=
        radius + 0.05
      )
        return { hit: true, point: from, kind: "land" };
    }
    if (this.isLand(to)) return { hit: true, point: from, kind: "land" };
    for (const dock of this.docks) {
      if (distance(from, dock.center) > reach + dock.length) continue;
      const ring = this.dockPolygon(dock).map((point) => toLocal(point, from));
      if (pointInRing(start, ring) || pointInRing(end, ring))
        return { hit: true, point: from, kind: "dock" };
      for (let i = 0; i < ring.length; i++) {
        if (
          segmentDistance(start, end, ring[i], ring[(i + 1) % ring.length]) <=
          radius + 0.05
        )
          return { hit: true, point: from, kind: "dock" };
      }
    }
    return { hit: false };
  }
}

export function worldFromGeoJSON(data: LandData, docks?: Dock[]): World {
  const polygons: LatLon[][] = [];
  for (const feature of data.features) {
    const coords = feature.geometry.coordinates;
    const shapes =
      feature.geometry.type === "Polygon"
        ? [coords as number[][][]]
        : (coords as number[][][][]);
    for (const polygon of shapes)
      polygons.push(polygon[0].map(([lon, lat]) => ({ lat, lon })));
  }
  return new World(polygons, docks);
}

export async function loadWorld(): Promise<World> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/land.geojson`);
  if (!response.ok)
    throw new Error(
      "No se pudieron cargar las costas locales. Recarga la página.",
    );
  return worldFromGeoJSON((await response.json()) as LandData);
}
