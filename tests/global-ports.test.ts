import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PORTS, portById } from "../src/data/ports";
import { EXPANDED_PORTS } from "../src/data/expandedPorts";
import { EXPANDED_CHAINS, EXPANDED_WAYPOINTS } from "../src/geo/expandedRoutes";
import { buildRoute } from "../src/geo/routes";
import { worldFromGeoJSON } from "../src/geo/world";
import { distance } from "../src/geo/math";
import { canPlaceVessel, createVessel, Simulation } from "../src/sim/engine";
import { createWeather } from "../src/sim/weather";

const data = JSON.parse(readFileSync(new URL("../public/data/land.geojson", import.meta.url), "utf8"));
const world = worldFromGeoJSON(data), land = worldFromGeoJSON(data, []);
const north = ["gibraltar", "cadiz", "lisbon", "porto", "vigo", "a-coruna", "brest", "cork", "killybegs", "stornoway", "torshavn", "hofn", "vestmannaeyjar", "reykjavik", "isafjordur", "tasiilaq", "prins-christian-sund", "nanortalik", "qaqortoq", "paamiut", "nuuk", "sisimiut", "qikiqtarjuaq", "pangnirtung", "iqaluit", "saglek", "nain", "cartwright", "st-anthony", "st-johns", "saint-pierre", "halifax", "boston", "new-york"];

describe("global network of regional fictional berths", () => {
  it("includes the requested Mexican and Israeli ports in a worldwide network", () => {
    expect(PORTS.length).toBeGreaterThanOrEqual(100);
    expect(new Set(PORTS.map(p => p.id)).size).toBe(PORTS.length);
    for (const id of ["acapulco", "los-cabos", "cancun", "veracruz", "haifa", "ashdod", "eilat", "colon", "balboa", "port-said", "suez"])
      expect(portById(id), id).toBeDefined();
  });

  it("places every new cargo hull and its entire quay in water", () => {
    for (const port of EXPANDED_PORTS) {
      expect(canPlaceVessel(createVessel("cargo", port, port.heading), world), port.id).toBe(true);
      const dock = world.docks.find(d => d.portId === port.id)!;
      const ring = world.dockPolygon(dock);
      for (let i = 0; i < ring.length; i++)
        expect(land.sweep(ring[i], ring[(i + 1) % ring.length], 0).hit, port.id).toBe(false);
    }
  });

  it("retains all generated connections with a 90 m continuous sweep clearance", () => {
    const nodes = new Map([...PORTS, ...EXPANDED_WAYPOINTS,
      { id: "cadiz-exterior", lat: 36, lon: -6.25 }, { id: "cabo-exterior", lat: -33.8, lon: 17 },
      { id: "new-york-exterior", lat: 39, lon: -72 }, { id: "uraga-sur", lat: 34.95, lon: 139.72 },
      { id: "sydney-exterior", lat: -33.845, lon: 151.322 },
    ].map(p => [p.id, p]));
    for (const chain of EXPANDED_CHAINS)
      for (let i = 1; i < chain.length; i++) {
        const a = nodes.get(chain[i - 1])!, b = nodes.get(chain[i])!;
        expect(a).toBeDefined(); expect(b).toBeDefined();
        expect(world.sweep(a, b, 90).hit, `${a.id} → ${b.id}`).toBe(false);
      }
  });

  it("offers continuous northern Atlantic fuel stops with no leg above 740 km", () => {
    let total = 0;
    for (let i = 1; i < north.length; i++) {
      const route = buildRoute(world, north[i - 1], north[i]);
      expect(route, `${north[i - 1]} → ${north[i]}`).not.toBeNull();
      expect(route!.distance).toBeLessThan(740_000);
      expect(route!.distance).toBeGreaterThanOrEqual(route!.directDistance - 0.01);
      total += route!.distance;
    }
    // Real coastal and island stops require a substantial detour through Greenland/Baffin.
    expect(total).toBeGreaterThan(13_000_000);
    expect(total).toBeLessThan(17_000_000);
  }, 15_000);

  it.each([["colon", "balboa", 130_000], ["port-said", "suez", 230_000], ["haifa", "eilat", 1_200_000]] as const)(
    "uses navigable canal shortcuts between %s and %s", (from, to, maximum) => {
      const route = buildRoute(world, from, to)!;
      expect(route).not.toBeNull();
      expect(route.distance).toBeLessThan(maximum);
      for (let i = 1; i < route.points.length; i++)
        expect(world.sweep(route.points[i - 1], route.points[i], 90).hit).toBe(false);
    });
});

it("pilots a yacht physically from Ashdod to Haifa without collision", () => {
  const departure = portById("ashdod")!, arrival = portById("haifa")!;
  const route = buildRoute(world, departure.id, arrival.id)!;
  const boat = createVessel("yacht", departure, departure.heading);
  const sim = new Simulation(boat, createWeather("calm", 4821), world);
  sim.voyage = { route, waypoint: 1, completed: false, autopilot: true };
  let collisions = 0; sim.onCollision = () => collisions++;
  while (boat.simTime < 40_000 && !sim.voyage.completed && !collisions) sim.advance(2);
  expect(collisions).toBe(0);
  expect(sim.voyage.completed).toBe(true);
  expect(distance(boat, arrival)).toBeLessThan(40);
  expect(boat.distance).toBeGreaterThan(route.directDistance * 0.98);
  expect(boat.simTime).toBeGreaterThan(route.directDistance / 20);
  expect(boat.fuel).toBeGreaterThan(0);
}, 20_000);
