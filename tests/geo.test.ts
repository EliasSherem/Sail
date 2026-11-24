import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { LatLon } from "../src/types";
import { PORTS } from "../src/data/ports";
import {
  bearing,
  destination,
  distance,
  fromKnots,
  fromLocal,
  normalizeLon,
  toKnots,
  toLocal,
  toNauticalMiles,
} from "../src/geo/math";
import { buildRoute, routeFromPosition } from "../src/geo/routes";
import { World, worldFromGeoJSON } from "../src/geo/world";

const square = (center: LatLon, half = 100): LatLon[] =>
  [
    [-half, -half],
    [half, -half],
    [half, half],
    [-half, half],
    [-half, -half],
  ].map(([x, z]) => fromLocal(x, z, center));
const coast = worldFromGeoJSON(
  JSON.parse(
    readFileSync(
      new URL("../public/data/land.geojson", import.meta.url),
      "utf8",
    ),
  ),
);

describe("geodesia esférica y unidades", () => {
  it("convierte unidades marítimas sin escalas artificiales", () => {
    expect(toKnots(1852 / 3600)).toBeCloseTo(1, 10);
    expect(fromKnots(toKnots(12))).toBeCloseTo(12, 10);
    expect(toNauticalMiles(18520)).toBe(10);
  });
  it("da distancias conocidas sobre el radio terrestre medio", () => {
    expect(distance({ lat: 0, lon: 0 }, { lat: 0, lon: 1 })).toBeCloseTo(
      111195.08,
      2,
    );
    const london = { lat: 51.5074, lon: -0.1278 },
      newYork = { lat: 40.7128, lon: -74.006 };
    expect(distance(london, newYork) / 1000).toBeCloseTo(5570.23, 1);
  });
  it("cruza el antimeridiano por el arco corto", () => {
    const a = { lat: 0, lon: 179.9 },
      b = { lat: 0, lon: -179.9 };
    expect(distance(a, b)).toBeGreaterThan(22000);
    expect(distance(a, b)).toBeLessThan(22500);
    expect(bearing(a, b)).toBeCloseTo(Math.PI / 2, 10);
    const result = destination(a, bearing(a, b), distance(a, b));
    expect(result.lat).toBeCloseTo(b.lat, 9);
    expect(result.lon).toBeCloseTo(b.lon, 9);
    expect(normalizeLon(541)).toBe(-179);
  });
  it("el origen local flotante conserva la posición, también cerca del antimeridiano", () => {
    const origin = { lat: -33, lon: 179.99 },
      target = destination(origin, 0.72, 45000);
    const local = toLocal(target, origin),
      restored = fromLocal(local.x, local.z, origin);
    expect(distance(target, restored)).toBeLessThan(0.00001);
    expect(Math.hypot(local.x, local.z)).toBeCloseTo(45000, 6);
  });
});

describe("colisión geográfica continua", () => {
  it("detecta cruce de una isla aunque inicio y final estén en agua", () => {
    const center = { lat: 43, lon: 5 },
      world = new World([square(center)], []);
    const a = fromLocal(-2000, 0, center),
      b = fromLocal(2000, 0, center);
    expect(world.isLand(a)).toBe(false);
    expect(world.isLand(b)).toBe(false);
    expect(world.sweep(a, b, 0).hit).toBe(true);
    expect(
      world.sweep(
        fromLocal(-2000, 300, center),
        fromLocal(2000, 300, center),
        10,
      ).hit,
    ).toBe(false);
  });
  it("el radio del casco impide rozar tierra aunque la línea central no la cruce", () => {
    const center = { lat: 43, lon: 5 },
      world = new World([square(center)], []);
    const a = fromLocal(-400, 125, center),
      b = fromLocal(400, 125, center);
    expect(world.sweep(a, b, 10).hit).toBe(false);
    expect(world.sweep(a, b, 30).hit).toBe(true);
    expect(world.clearance(fromLocal(150, 0, center))).toBeCloseTo(50, 1);
    expect(world.clearance(center)).toBe(0);
  });
  it("usa exactamente las mismas dimensiones para el muelle y su colisión", () => {
    const center = { lat: 43, lon: 5 };
    const world = new World(
      [],
      [{ portId: "test", center, length: 300, width: 30, heading: 0 }],
    );
    expect(
      world.sweep(fromLocal(-1000, 0, center), fromLocal(1000, 0, center), 5)
        .kind,
    ).toBe("dock");
    expect(
      world.sweep(
        fromLocal(-1000, 200, center),
        fromLocal(1000, 200, center),
        5,
      ).hit,
    ).toBe(false);
    expect(world.clearance(fromLocal(100, 0, center))).toBeCloseTo(85, 2);
  });
  it("detecta una isla junto al antimeridiano durante un cruce de longitud", () => {
    const center = { lat: 0, lon: 179.99 },
      world = new World([square(center, 200)], []);
    expect(
      world.sweep({ lat: 0, lon: 179.96 }, { lat: 0, lon: -179.96 }, 10).hit,
    ).toBe(true);
    expect(
      world.sweep({ lat: 0.02, lon: 179.96 }, { lat: 0.02, lon: -179.96 }, 10)
        .hit,
    ).toBe(false);
  });
  it("divide y conserva colisiones de una isla que ocupa ambos lados de 180°", () => {
    const center = { lat: 0, lon: 179.9995 },
      world = new World([square(center, 300)], []);
    expect(world.landPolygons.length).toBe(2);
    expect(world.isLand({ lat: 0, lon: -179.9995 })).toBe(true);
    expect(world.isLand(center)).toBe(true);
    expect(world.isLand({ lat: 0, lon: 0 })).toBe(false);
    expect(
      world.sweep({ lat: 0, lon: 179.96 }, { lat: 0, lon: -179.96 }, 20).hit,
    ).toBe(true);
  });
  it("clasifica correctamente tierra continental, mar y fondeos con los datos incluidos", () => {
    for (const point of [
      { lat: 48.85, lon: 2.35 },
      { lat: -25, lon: 135 },
      { lat: 39, lon: -100 },
      { lat: 0, lon: 25 },
    ])
      expect(coast.isLand(point)).toBe(true);
    for (const point of [
      { lat: 0, lon: -30 },
      { lat: 25, lon: -150 },
      { lat: -40, lon: 65 },
      ...PORTS,
    ])
      expect(coast.isLand(point)).toBe(false);
    for (const port of PORTS)
      expect(coast.sweep(port, port, 100).hit).toBe(false);
  });
});

describe("rutas navegables verificadas", () => {
  it("distingue distancia directa y navegable sin cortar las Calanques", () => {
    const route = buildRoute(coast, "marseille", "cassis");
    expect(route).not.toBeNull();
    expect(route!.distance).toBeGreaterThan(route!.directDistance * 1.3);
    for (let i = 1; i < route!.points.length; i++)
      expect(coast.sweep(route!.points[i - 1], route!.points[i], 90).hit).toBe(
        false,
      );
  }, 15_000);
  it("valida todos los corredores mediterráneos, incluido el viaje largo", () => {
    const ports = PORTS.filter((p) => p.region === "Mediterráneo");
    const checkedSegments = new Set<string>();
    for (const a of ports)
      for (const b of ports) {
        if (a.id === b.id) continue;
        const route = buildRoute(coast, a.id, b.id);
        expect(route, `${a.id} → ${b.id}`).not.toBeNull();
        for (let i = 1; i < route!.points.length; i++) {
          const key = [route!.points[i - 1], route!.points[i]]
            .map((p) => `${p.lat.toFixed(6)},${p.lon.toFixed(6)}`).sort().join("/");
          if (checkedSegments.has(key)) continue;
          checkedSegments.add(key);
          expect(
            coast.sweep(route!.points[i - 1], route!.points[i], 90).hit,
          ).toBe(false);
        }
      }
    expect(
      buildRoute(coast, "marseille", "barcelona")!.distance,
    ).toBeGreaterThan(330_000);
  });
  it("no inventa puertos ni conectores que parten de tierra", () => {
    expect(buildRoute(coast, "marseille", "panama")).toBeNull();
    expect(buildRoute(coast, "suez", "cape-town")).not.toBeNull();
    expect(
      routeFromPosition(coast, { lat: 48.85, lon: 2.35 }, "barcelona"),
    ).toBeNull();
    expect(routeFromPosition(coast, PORTS[0], "cassis")).not.toBeNull();
  });
});

describe("corredores oceánicos y continuación de viajes", () => {
  it("conecta todos los puertos de la red en ambas direcciones", () => {
    // A path from every port to a common hub and back proves whole-network
    // connectivity transitively, without building O(ports²) sampled voyages.
    const pairs: [string, string][] = PORTS.filter(port => port.id !== "marseille")
      .flatMap(port => [["marseille", port.id], [port.id, "marseille"]] as [string, string][]);
    pairs.push(["singapore", "yokohama"], ["colombo", "hong-kong"], ["sydney", "new-york"]);
    for (const [from, to] of pairs) {
      const route = buildRoute(coast, from, to);
      expect(route, `${from} → ${to}`).not.toBeNull();
      expect(route!.distance).toBeGreaterThanOrEqual(route!.directDistance - 0.01);
    }
    // Retain an offshore antimeridian origin independent of whichever port
    // corridor is shortest after adding the Asian coastal service network.
    const pacific = routeFromPosition(coast, { lat: -25, lon: -170 }, "sydney")!;
    expect(pacific).not.toBeNull();
    expect(pacific.points.some((point, index) => index > 0 &&
      Math.abs(point.lon - pacific.points[index - 1].lon) > 180)).toBe(true);
  }, 30_000);
  it("no cruza islas o continentes en el Atlántico, Índico, Pacífico ni Gibraltar", () => {
    for (const [from, to] of [
      ["barcelona", "new-york"],
      ["new-york", "cape-town"],
      ["cape-town", "sydney"],
      ["sydney", "yokohama"],
    ]) {
      const route = buildRoute(coast, from, to)!;
      for (let i = 1; i < route.points.length; i++) {
        expect(
          coast.sweep(route.points[i - 1], route.points[i], 90).hit,
          `${from} → ${to}, tramo ${i}`,
        ).toBe(false);
      }
    }
    // Gibraltar is a deliberately implemented corridor with a wide safety margin.
    expect(
      coast.sweep({ lat: 35.98, lon: -5.3 }, { lat: 35.98, lon: -5.7 }, 2000)
        .hit,
    ).toBe(false);
  });
  it("traza y retoma la ruta del Pacífico al cruzar el antimeridiano", () => {
    // Starting east of the date line preserves this boundary case even when a
    // newly available Asian coastal route is shorter than the old Pacific loop.
    const route = routeFromPosition(coast, { lat: -25, lon: -170 }, "sydney")!;
    const crossing = route.points.findIndex(
      (point, i) =>
        i > 0 && Math.abs(point.lon - route.points[i - 1].lon) > 180,
    );
    expect(crossing).toBeGreaterThan(0);
    expect(
      distance(route.points[crossing - 1], route.points[crossing]),
    ).toBeLessThan(10_001);
    const resumed = routeFromPosition(
      coast,
      route.points[crossing],
      "sydney",
    );
    expect(resumed).not.toBeNull();
    expect(distance(resumed!.points[0], route.points[crossing])).toBeLessThan(
      0.001,
    );
    expect(resumed!.distance).toBeLessThan(route.distance);
  });
  it("recupera una posición a mitad de un tramo oceánico a miles de km de cualquier puerto", () => {
    const route = buildRoute(coast, "cape-town", "sydney")!;
    const mid = route.points[Math.floor(route.points.length / 2)];
    expect(
      Math.min(...PORTS.map((port) => distance(port, mid))),
    ).toBeGreaterThan(2_000_000);
    const drifted = destination(mid, 0.7, 3000);
    const resumed = routeFromPosition(coast, drifted, "sydney");
    expect(resumed).not.toBeNull();
    expect(distance(resumed!.points[0], drifted)).toBeLessThan(0.001);
    expect(resumed!.distance).toBeLessThan(route.distance * 0.55);
    expect(coast.sweep(drifted, resumed!.points[1], 90).hit).toBe(false);
  });
  it("cierra conexiones automáticamente si una nueva geometría bloquea el estrecho", () => {
    const blocked = new World(
      [
        [
          { lat: 35.9, lon: -5.55 },
          { lat: 36.1, lon: -5.55 },
          { lat: 36.1, lon: -5.45 },
          { lat: 35.9, lon: -5.45 },
          { lat: 35.9, lon: -5.55 },
        ],
      ],
      [],
    );
    const detour = buildRoute(blocked, "marseille", "new-york")!;
    expect(detour).not.toBeNull(); // The expanded network can now detour via Suez.
    for (let i = 1; i < detour.points.length; i++)
      expect(blocked.sweep(detour.points[i - 1], detour.points[i], 90).hit).toBe(false);
    expect(buildRoute(blocked, "marseille", "cassis")).not.toBeNull();
  });
});
