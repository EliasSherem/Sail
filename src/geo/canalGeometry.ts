import polygonClipping from "polygon-clipping";
import type { MultiPolygon, Polygon } from "polygon-clipping";
import { CANALS } from "../data/canals";
import type { LatLon } from "../types";
import { bearing, destination, distance } from "./math";

const { difference, union } = polygonClipping;

function coordinates(points: LatLon[]): Polygon {
  const ring: [number, number][] = points.map((point) => [point.lon, point.lat]);
  ring.push([...ring[0]]);
  return [ring];
}

const cuts = CANALS.map((canal) => {
  const points = canal.centerline;
  // Seaward extensions connect to the generalized coastal polygons even when
  // their shore is displaced from the overview map's harbour entrance.
  const extended = [
    destination(points[0], bearing(points[1], points[0]), 20_000),
    ...points,
    destination(points.at(-1)!, bearing(points.at(-2)!, points.at(-1)!), 20_000),
  ];
  const radius = canal.widthM / 2;
  const pieces: Polygon[] = [];
  for (const point of extended)
    pieces.push(coordinates(Array.from({ length: 24 }, (_, index) =>
      destination(point, index * Math.PI / 12, radius),
    )));
  for (let index = 1; index < extended.length; index++) {
    const a = extended[index - 1], b = extended[index], angle = bearing(a, b);
    // Subdivide before buffering so a long geodesic follows the same water
    // corridor used by route sampling and continuous collision sweeps.
    const count = Math.max(1, Math.ceil(distance(a, b) / 2000));
    for (let part = 0; part < count; part++) {
      const start = part === 0 ? a : destination(a, angle, distance(a, b) * part / count);
      const end = part === count - 1 ? b : destination(a, angle, distance(a, b) * (part + 1) / count);
      const direction = bearing(start, end);
      // Neighbouring geodesic normals differ slightly. Two metres of overlap
      // prevent sub-metre seams from becoming spurious bank edges after union.
      const overlapStart = destination(start, direction + Math.PI, 2);
      const overlapEnd = destination(end, direction, 2);
      pieces.push(coordinates([
        destination(overlapStart, direction - Math.PI / 2, radius),
        destination(overlapEnd, direction - Math.PI / 2, radius),
        destination(overlapEnd, direction + Math.PI / 2, radius),
        destination(overlapStart, direction + Math.PI / 2, radius),
      ]));
    }
  }
  const geometry = union(pieces[0], ...pieces.slice(1));
  const all = geometry.flat(2);
  return {
    geometry,
    minLat: Math.min(...all.map((point) => point[1])),
    maxLat: Math.max(...all.map((point) => point[1])),
    minLon: Math.min(...all.map((point) => point[0])),
    maxLon: Math.max(...all.map((point) => point[0])),
  };
});

/** The subtraction happens before World builds its coast index. Rendering,
 * minimap, route checks and collisions therefore receive identical open banks.
 * Inland lakes elsewhere remain filled as in the original world model. */
export function openCanalsInLand(polygons: LatLon[][]): LatLon[][] {
  return polygons.flatMap((ring) => {
    const minLat = Math.min(...ring.map((point) => point.lat));
    const maxLat = Math.max(...ring.map((point) => point.lat));
    const minLon = Math.min(...ring.map((point) => point.lon));
    const maxLon = Math.max(...ring.map((point) => point.lon));
    const intersecting = cuts.filter((cut) =>
      cut.minLat <= maxLat && cut.maxLat >= minLat &&
      cut.minLon <= maxLon && cut.maxLon >= minLon,
    );
    if (!intersecting.length) return [ring];
    const subject: MultiPolygon = [[ring.map((point) => [point.lon, point.lat])]];
    const clipped = difference(subject, ...intersecting.map((cut) => cut.geometry));
    // Both real channels connect sea to sea. An enclosed hole would mean an
    // incompatible source coastline, so keep that ring closed rather than draw
    // water that still collides (or remove unconnected inland land).
    if (clipped.some((polygon) => polygon.length > 1)) return [ring];
    return clipped.map((polygon) => polygon[0].map(([lon, lat]) => ({ lat, lon })));
  });
}
