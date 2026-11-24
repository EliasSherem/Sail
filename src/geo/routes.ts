import type { LatLon, Route } from "../types";
import { PORTS } from "../data/ports";
import { bearing, destination, distance, normalizeLon } from "./math";
import type { World } from "./world";
import { CANAL_CHAINS, CANAL_WAYPOINTS } from "./canalRoutes";
import { EXPANDED_CHAINS, EXPANDED_WAYPOINTS } from "./expandedRoutes";

interface Waypoint extends LatLon {
  id: string;
  approach?: boolean;
}
const waypoints: Waypoint[] = [
  ...PORTS,
  ...CANAL_WAYPOINTS,
  ...EXPANDED_WAYPOINTS,
  { id: "marsella-exterior", lat: 43.278, lon: 5.327 },
  { id: "croisette-oeste", lat: 43.21, lon: 5.318 },
  { id: "croisette-sur", lat: 43.18, lon: 5.37 },
  { id: "calanques", lat: 43.17, lon: 5.48 },
  { id: "cassis-exterior", lat: 43.175, lon: 5.525 },
  { id: "ciotat-exterior", lat: 43.135, lon: 5.62 },
  { id: "bandol-exterior", lat: 43.08, lon: 5.73 },
  { id: "sicie-oeste", lat: 43.03, lon: 5.78 },
  { id: "sicie-este", lat: 43.028, lon: 5.91 },
  // Regional approach nodes add short coastal hops without changing the original
  // Marseille–Cassis or transoceanic chains. Every leg is checked against World.
  { id: "giens-oeste", lat: 42.975, lon: 6.015 },
  { id: "porquerolles-sur", lat: 42.94, lon: 6.25 },
  { id: "giens-sur", lat: 42.993, lon: 6.11 },
  { id: "hyeres-passe", lat: 43.024, lon: 6.17 },
  { id: "hyeres-approche", lat: 43.045, lon: 6.195, approach: true },
  { id: "port-cros-norte", lat: 43.07, lon: 6.30 },
  { id: "levant-norte", lat: 43.07, lon: 6.56 },
  { id: "levant-este", lat: 43.025, lon: 6.57 },
  { id: "tropez-sur", lat: 43.08, lon: 6.78 },
  { id: "esterel-sur", lat: 43.30, lon: 6.98 },
  { id: "antibes-sur", lat: 43.47, lon: 7.10 },
  { id: "nice-exterior", lat: 43.645, lon: 7.275 },
  { id: "ferrat-sur", lat: 43.63, lon: 7.365 },
  { id: "monaco-exterior", lat: 43.69, lon: 7.44 },
  { id: "liguria-oeste", lat: 43.65, lon: 7.75 },
  { id: "liguria-central", lat: 43.85, lon: 8.2 },
  { id: "liguria-norte", lat: 44.10, lon: 8.70 },
  { id: "genoa-exterior", lat: 44.33, lon: 8.93 },
  { id: "corcega-noroeste", lat: 42.7, lon: 7.8 },
  { id: "corcega-oeste", lat: 42.3, lon: 8.1 },
  { id: "ajaccio-exterior", lat: 41.85, lon: 8.65 },
  { id: "mallorca-suroeste", lat: 39.30, lon: 2.1 },
  { id: "palma-exterior", lat: 39.44, lon: 2.61 },
  { id: "valencia-exterior", lat: 39.37, lon: -0.278 },
  { id: "palos-este", lat: 37.63, lon: -0.52 },
  { id: "cartagena-sur", lat: 37.48, lon: -0.97 },
  { id: "leon-norte", lat: 42.9, lon: 4.9 },
  { id: "leon-sur", lat: 42.0, lon: 3.75 },
  { id: "barcelona-exterior", lat: 41.294, lon: 2.19 },
  { id: "baleares-oeste", lat: 40.0, lon: 1.2 },
  { id: "alicante-exterior", lat: 38.5, lon: 0.6 },
  { id: "cartagena-exterior", lat: 37.3, lon: -0.3 },
  { id: "gata-este", lat: 36.9, lon: -1.8 },
  { id: "gata-sur", lat: 36.2, lon: -2.2 },
  { id: "alboran", lat: 36.1, lon: -4.6 },
  { id: "gibraltar-fondeo-sur", lat: 36.08, lon: -5.395 },
  { id: "gibraltar-este", lat: 35.98, lon: -5.3 },
  { id: "gibraltar-oeste", lat: 35.98, lon: -5.7 },
  { id: "cadiz-exterior", lat: 36.0, lon: -6.25 },
  { id: "atlantico-noreste", lat: 35.0, lon: -12.0 },
  { id: "atlantico-norte", lat: 33.0, lon: -40.0 },
  { id: "bermudas-este", lat: 33.0, lon: -60.0 },
  { id: "new-york-exterior", lat: 39.0, lon: -72.0 },
  { id: "new-york-fondeo", lat: 40.43, lon: -73.865 },
  { id: "atlantico-tropical", lat: 10.0, lon: -30.0 },
  { id: "atlantico-sur", lat: -10.0, lon: -5.0 },
  { id: "cabo-noroeste", lat: -30.0, lon: 5.0 },
  { id: "cabo-exterior", lat: -33.8, lon: 17.0 },
  { id: "buena-esperanza-oeste", lat: -34.5, lon: 18.0 },
  { id: "agujas-sur", lat: -35.8, lon: 20.0 },
  { id: "indico-oeste", lat: -37.0, lon: 35.0 },
  { id: "indico-central", lat: -38.0, lon: 65.0 },
  { id: "indico-este", lat: -40.0, lon: 95.0 },
  { id: "australia-suroeste", lat: -42.0, lon: 120.0 },
  { id: "tasmania-suroeste", lat: -45.0, lon: 145.0 },
  { id: "tasmania-sureste", lat: -45.0, lon: 151.0 },
  { id: "tasman-sur", lat: -37.0, lon: 155.0 },
  { id: "sydney-sureste", lat: -33.9, lon: 151.35 },
  { id: "sydney-exterior", lat: -33.845, lon: 151.322 },
  { id: "tasman-norte", lat: -34.0, lon: 154.0 },
  { id: "pacifico-suroeste", lat: -30.0, lon: 170.0 },
  { id: "pacifico-fecha-sur", lat: -25.0, lon: -170.0 },
  { id: "pacifico-tropical", lat: -5.0, lon: -160.0 },
  { id: "pacifico-fecha-norte", lat: 10.0, lon: 175.0 },
  { id: "pacifico-noroeste", lat: 25.0, lon: 160.0 },
  { id: "japon-este", lat: 34.0, lon: 145.0 },
  { id: "boso-sur", lat: 34.5, lon: 140.0 },
  { id: "uraga-sur", lat: 34.95, lon: 139.72 },
  { id: "tokio-exterior", lat: 35.15, lon: 139.745 },
];
const chains = [
  ...CANAL_CHAINS,
  ...EXPANDED_CHAINS,
  ["ciotat-exterior", "la-ciotat"],
  ["bandol-exterior", "bandol"],
  ["sicie-este", "giens-oeste", "porquerolles-sur", "levant-este"],
  ["giens-oeste", "giens-sur", "hyeres-passe", "hyeres-approche", "hyeres"],
  ["hyeres-approche", "port-cros-norte", "levant-norte", "levant-este"],
  ["levant-este", "tropez-sur", "esterel-sur", "antibes-sur", "nice-exterior", "nice"],
  ["nice-exterior", "ferrat-sur", "monaco-exterior", "monaco"],
  ["monaco-exterior", "liguria-oeste", "liguria-central", "liguria-norte", "genoa-exterior", "genoa"],
  ["nice-exterior", "corcega-noroeste", "corcega-oeste", "ajaccio-exterior", "ajaccio"],
  ["baleares-oeste", "mallorca-suroeste", "palma-exterior", "palma"],
  ["baleares-oeste", "valencia-exterior", "valencia"],
  ["valencia-exterior", "alicante-exterior", "palos-este", "cartagena-sur", "cartagena"],
  ["cartagena-sur", "cartagena-exterior"],
  ["alboran", "malaga"],
  ["gibraltar-este", "gibraltar-fondeo-sur", "gibraltar"],

  [
    "marseille",
    "marsella-exterior",
    "croisette-oeste",
    "croisette-sur",
    "calanques",
    "cassis-exterior",
    "cassis",
  ],
  [
    "cassis-exterior",
    "ciotat-exterior",
    "bandol-exterior",
    "sicie-oeste",
    "sicie-este",
    "toulon",
  ],
  [
    "croisette-sur",
    "leon-norte",
    "leon-sur",
    "barcelona-exterior",
    "barcelona",
  ],
  [
    "barcelona-exterior",
    "baleares-oeste",
    "alicante-exterior",
    "cartagena-exterior",
    "gata-este",
    "gata-sur",
    "alboran",
    "gibraltar-este",
    "gibraltar-oeste",
    "cadiz-exterior",
    "atlantico-noreste",
    "atlantico-norte",
    "bermudas-este",
    "new-york-exterior",
    "new-york-fondeo",
    "new-york",
  ],
  [
    "atlantico-norte",
    "atlantico-tropical",
    "atlantico-sur",
    "cabo-noroeste",
    "cabo-exterior",
    "cape-town",
  ],
  [
    "cape-town",
    "cabo-exterior",
    "buena-esperanza-oeste",
    "agujas-sur",
    "indico-oeste",
    "indico-central",
    "indico-este",
    "australia-suroeste",
    "tasmania-suroeste",
    "tasmania-sureste",
    "tasman-sur",
    "sydney-sureste",
    "sydney-exterior",
    "sydney",
  ],
  [
    "sydney-sureste",
    "tasman-norte",
    "pacifico-suroeste",
    "pacifico-fecha-sur",
    "pacifico-tropical",
    "pacifico-fecha-norte",
    "pacifico-noroeste",
    "japon-este",
    "boso-sur",
    "uraga-sur",
    "tokio-exterior",
    "yokohama",
  ],
];
const lookup = new Map(waypoints.map((p) => [p.id, p]));
interface GraphEdge {
  id: string;
  distance: number;
}
interface RouteGraph {
  nodes: Map<string, Waypoint>;
  edges: Map<string, GraphEdge[]>;
  trees: Map<string, { distances: Map<string, number>; next: Map<string, string> }>;
  nearby: ReturnType<typeof nearbyIndex>;
  portConnections: Map<string, Array<{ point: Waypoint; distance: number }>>;
}
const cache = new WeakMap<World, RouteGraph>();
const ROUTE_CLEARANCE = 90;
const portIds = new Set(PORTS.map((port) => port.id));

/** A small spatial index keeps discovery local even as the authored harbour
 * network grows. Sampled ocean nodes are indexed only for harbour connectors. */
function nearbyIndex(points: Iterable<Waypoint>) {
  const cells = new Map<string, Waypoint[]>();
  for (const point of points) {
    const key = `${Math.floor(point.lat)}/${Math.floor(normalizeLon(point.lon))}`;
    const cell = cells.get(key) ?? [];
    cell.push(point);
    cells.set(key, cell);
  }
  return (origin: LatLon, radius: number): Array<{ point: Waypoint; distance: number }> => {
    const latitudeSpan = radius / 110_000;
    const longitudeSpan = Math.min(180, latitudeSpan /
      Math.max(.01, Math.cos(Math.min(89.9, Math.abs(origin.lat) + latitudeSpan) * Math.PI / 180)));
    const result: Array<{ point: Waypoint; distance: number }> = [];
    const visited = new Set<string>();
    for (let lat = Math.floor(Math.max(-90, origin.lat - latitudeSpan));
      lat <= Math.floor(Math.min(90, origin.lat + latitudeSpan)); lat++) {
      for (let lon = Math.floor(origin.lon - longitudeSpan); lon <= Math.floor(origin.lon + longitudeSpan); lon++) {
        const key = `${lat}/${Math.floor(normalizeLon(lon))}`;
        if (visited.has(key)) continue;
        visited.add(key);
        for (const point of cells.get(key) ?? []) {
          const meters = distance(origin, point);
          if (meters <= radius) result.push({ point, distance: meters });
        }
      }
    }
    return result;
  };
}

function shortcutClearance(a: Waypoint, b: Waypoint, length: number): number {
  // Newly discovered regional links must preserve Gibraltar's broad passage,
  // including links whose endpoint names are unrelated to the strait.
  if ((a.lon < -5.5) !== (b.lon < -5.5) && Math.abs(a.lon - b.lon) < 30) {
    const fraction = (-5.5 - a.lon) / (b.lon - a.lon);
    const lat = a.lat + fraction * (b.lat - a.lat);
    if (lat > 35.7 && lat < 36.3) return 2000;
  }
  return length <= 50_000 &&
    (portIds.has(a.id) || portIds.has(b.id) || a.approach || b.approach)
    ? ROUTE_CLEARANCE : 1000;
}

function graphFor(world: World): RouteGraph {
  const old = cache.get(world);
  if (old) return old;
  const graph: RouteGraph = {
    nodes: new Map(lookup),
    edges: new Map(waypoints.map((p) => [p.id, []])),
    trees: new Map(),
    nearby: nearbyIndex([]),
    portConnections: new Map(),
  };
  const checked = new Set<string>();
  const connect = (a: Waypoint, b: Waypoint, clearance: number) => {
    const key = [a.id, b.id].sort().join("/");
    if (a.id === b.id || checked.has(key)) return;
    checked.add(key);
    if (world.sweep(a, b, clearance).hit) return;
    const total = distance(a, b), count = Math.ceil(total / 25_000), angle = bearing(a, b);
    let previous = a;
    for (let j = 1; j <= count; j++) {
      const next: Waypoint = j === count ? b : {
        id: `${key}/${j}`, ...destination(a, angle, (total * j) / count),
      };
      graph.nodes.set(next.id, next);
      if (!graph.edges.has(next.id)) graph.edges.set(next.id, []);
      const edgeDistance = distance(previous, next);
      graph.edges.get(previous.id)!.push({ id: next.id, distance: edgeDistance });
      graph.edges.get(next.id)!.push({ id: previous.id, distance: edgeDistance });
      previous = next;
    }
  };
  for (const chain of chains)
    for (let i = 1; i < chain.length; i++) {
      const a = lookup.get(chain[i - 1])!,
        b = lookup.get(chain[i])!;
      // Fail closed against the bundled collision geometry, including generic docks.
      // Gibraltar keeps a 2 km through-corridor margin. Final berth approaches and
      // the explicitly marked Hyères passage use the 90 m full-fleet radius.
      // The simplified Panama/Suez centerlines use the same full-fleet margin.
      const clearance =
        portIds.has(a.id) || portIds.has(b.id) || a.approach || b.approach
          ? ROUTE_CLEARANCE
          : a.id.startsWith("gibraltar") || b.id.startsWith("gibraltar")
            ? 2000
            : 1000;
      connect(a, b, clearance);
    }
  // Keep the authored regional/ocean corridors. Harbour alternatives are
  // discovered only for the selected endpoints, not for every pair of sampled
  // nodes or every service port at startup.
  graph.nearby = nearbyIndex(graph.nodes.values());
  cache.set(world, graph);
  return graph;
}

class MinQueue {
  private heap: GraphEdge[] = [];
  push(item: GraphEdge): void {
    const heap = this.heap;
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heap[parent].distance <= item.distance) break;
      heap[i] = heap[parent];
      i = parent;
    }
    heap[i] = item;
  }
  pop(): GraphEdge | undefined {
    const heap = this.heap,
      first = heap[0],
      last = heap.pop();
    if (!heap.length || !last) return first;
    let i = 0;
    while (i * 2 + 1 < heap.length) {
      let child = i * 2 + 1;
      if (
        child + 1 < heap.length &&
        heap[child + 1].distance < heap[child].distance
      )
        child++;
      if (heap[child].distance >= last.distance) break;
      heap[i] = heap[child];
      i = child;
    }
    heap[i] = last;
    return first;
  }
}

function visibleConnections(world: World, graph: RouteGraph, start: LatLon, portId?: string) {
  const cached = portId ? graph.portConnections.get(portId) : undefined;
  if (cached) return cached;
  const origin = portId ? lookup.get(portId)! : { ...start, id: "@current-vessel", approach: true };
  const connections = graph.nearby(start, 50_000).filter(({ point, distance: length }) =>
    !world.sweep(start, point, shortcutClearance(origin, point, length)).hit);
  if (portId) graph.portConnections.set(portId, connections);
  return connections;
}

/** One reverse Dijkstra search supports every nearby mid-voyage connection. */
function pathsTo(
  world: World,
  graph: RouteGraph,
  finish: string,
): { distances: Map<string, number>; next: Map<string, string> } {
  // World and its graph are immutable. Reuse destination trees while comparing
  // many possible fuel stops; the WeakMap releases them with that World.
  const cached = graph.trees.get(finish);
  if (cached) return cached;
  const distances = new Map<string, number>([[finish, 0]]),
    next = new Map<string, string>(),
    queue = new MinQueue();
  queue.push({ id: finish, distance: 0 });
  // A destination can be entered through every verified nearby approach,
  // instead of the one outgoing edge chosen when its chain was authored.
  // Virtual terminal edges need no new sampled graph nodes: makeRoute samples
  // their already swept arcs, and the same connectors work in either direction.
  for (const connection of visibleConnections(world, graph, lookup.get(finish)!, finish)) {
    if (connection.point.id === finish) continue;
    distances.set(connection.point.id, connection.distance);
    next.set(connection.point.id, finish);
    queue.push({ id: connection.point.id, distance: connection.distance });
  }
  let current: GraphEdge | undefined;
  while ((current = queue.pop())) {
    if (current.distance !== distances.get(current.id)) continue;
    for (const neighbor of graph.edges.get(current.id) ?? []) {
      const candidate = current.distance + neighbor.distance;
      if (candidate >= (distances.get(neighbor.id) ?? Infinity)) continue;
      distances.set(neighbor.id, candidate);
      next.set(neighbor.id, current.id);
      queue.push({ id: neighbor.id, distance: candidate });
    }
  }
  const tree = { distances, next };
  graph.trees.set(finish, tree);
  return tree;
}

function tracePath(
  graph: RouteGraph,
  next: Map<string, string>,
  start: string,
  finish: string,
): LatLon[] | null {
  const points: LatLon[] = [],
    seen = new Set<string>();
  let current: string | undefined = start;
  while (current && !seen.has(current)) {
    seen.add(current);
    points.push(graph.nodes.get(current)!);
    if (current === finish) return points;
    current = next.get(current);
  }
  return null;
}

/** Sampling keeps map lines on the same great-circle arcs used by navigation/collision. */
export function sampleRoute(
  points: LatLon[],
  maxSegmentMeters = 10_000,
): LatLon[] {
  if (!points.length) return [];
  const result: LatLon[] = [{ lat: points[0].lat, lon: points[0].lon }];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i],
      d = distance(a, b),
      angle = bearing(a, b),
      count = Math.max(1, Math.ceil(d / maxSegmentMeters));
    for (let j = 1; j < count; j++)
      result.push(destination(a, angle, (d * j) / count));
    result.push({ lat: b.lat, lon: b.lon });
  }
  return result;
}

function makeRoute(from: string, to: string, points: LatLon[]): Route {
  const source = PORTS.find((p) => p.id === from),
    target = PORTS.find((p) => p.id === to)!;
  const sampled = sampleRoute(points);
  return {
    id: `${from}-${to}`,
    name: `${source?.name ?? "Posición actual"} → ${target.name}`,
    from,
    to,
    points: sampled,
    distance: sampled.reduce(
      (sum, p, i) => sum + (i ? distance(sampled[i - 1], p) : 0),
      0,
    ),
    directDistance: distance(points[0], points[points.length - 1]),
    description:
      "Corredor de juego validado contra la costa simplificada. Gibraltar, Panamá y Suez son navegables; los canales son aproximados, ensanchados y sin esclusas. Las escalas son fondeos ficticios: no se reproducen hielo, tráfico ni restricciones reales.",
  };
}

export function buildRoute(
  world: World,
  fromPortId: string,
  toPortId: string,
): Route | null {
  if (fromPortId === toPortId) return null;
  if (!lookup.has(fromPortId) || !lookup.has(toPortId)) return null;
  return routeFromOrigin(world, lookup.get(fromPortId)!, toPortId, fromPortId);
}

export function routeFromPosition(
  world: World,
  start: LatLon,
  toPortId: string,
): Route | null {
  return routeFromOrigin(world, start, toPortId, "current");
}

function routeFromOrigin(world: World, start: LatLon, toPortId: string, from: string): Route | null {
  if (!lookup.has(toPortId) || world.isLand(start)) return null;
  let best: { points: LatLon[]; distance: number } | null = null;
  const graph = graphFor(world),
    tree = pathsTo(world, graph, toPortId);
  for (const connection of visibleConnections(world, graph, start, from === "current" ? undefined : from)) {
    const waypoint = connection.point, approach = connection.distance;
    // Nodes every <=25 km allow resuming anywhere along an ocean corridor.
    // The connector still needs a swept collision check and cannot cut across land.
    const length = approach + (tree.distances.get(waypoint.id) ?? Infinity);
    if (!Number.isFinite(length) || (best && length >= best.distance)) continue;
    const path = tracePath(graph, tree.next, waypoint.id, toPortId);
    if (!path) continue;
    const points = [start, ...path];
    best = { points, distance: length };
  }
  if (!best) return null;
  return makeRoute(from, toPortId, best.points);
}
