import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PORTS } from "../src/data/ports";
import { SHIPS, shipById } from "../src/data/ships";
import { bearing, destination, distance } from "../src/geo/math";
import { routeFromPosition } from "../src/geo/routes";
import { worldFromGeoJSON } from "../src/geo/world";
import { parseSave, type SaveGame } from "../src/persistence/save";
import { createVessel, FIXED_DT, motion, Simulation, stepVessel } from "../src/sim/engine";
import { estimateRouteFuel } from "../src/sim/routeEstimate";
import { createWeather } from "../src/sim/weather";
import type { Controls, Route, VesselState } from "../src/types";

const origin = { lat: 0, lon: -30 };
const still = { ...createWeather("calm", 4821), windSpeed: 0, currentSpeed: 0 };
const ahead: Controls = { throttle: 1, rudder: 0, gear: 1 };
const astern: Controls = { throttle: 1, rudder: 0, gear: -1 };
const ship = shipById("speedboat");

function run(boat: VesselState, seconds: number, controls = ahead) {
  for (let i = 0; i < Math.round(seconds / FIXED_DT); i++)
    stepVessel(boat, still, FIXED_DT, undefined, controls);
}

describe("Vector 38 intermediate offshore speedboat", () => {
  it("accelerates progressively to about 220 km/h, between the recreational fleet and Spirit", () => {
    const boat = createVessel(ship.id, origin);
    run(boat, 1);
    const firstSecond = boat.u;
    run(boat, 9);
    const tenSeconds = boat.u;
    run(boat, 290);
    expect(firstSecond).toBeGreaterThan(0);
    expect(firstSecond).toBeLessThan(tenSeconds * .2);
    expect(tenSeconds).toBeGreaterThan(10);
    expect(boat.u * 3.6).toBeGreaterThan(210);
    expect(boat.u * 3.6).toBeLessThan(230);
    for (const other of SHIPS.filter(entry => entry.id !== ship.id)) {
      const comparison = createVessel(other.id, origin);
      run(comparison, 300);
      if (other.id === "spirit") expect(boat.u).toBeLessThan(comparison.u * .6);
      else expect(boat.u).toBeGreaterThan(comparison.u * 3);
    }
  });

  it("holds a high-speed turn with grip and a wider radius than at harbour speed", () => {
    const radii: number[] = [];
    for (const speed of [5, 50]) {
      const boat = createVessel(ship.id, origin);
      boat.fuel = 0;
      for (let i = 0; i < 30 * 120; i++) {
        boat.u = speed;
        stepVessel(boat, still, FIXED_DT, undefined, { throttle: 0, rudder: .7, gear: 0 });
      }
      radii.push(speed / Math.abs(boat.yawRate));
      expect(Math.abs(Math.atan2(boat.v, boat.u))).toBeLessThan(5 * Math.PI / 180);
    }
    expect(radii[1]).toBeGreaterThan(radii[0] * 5);
    const boat = createVessel(ship.id, origin);
    boat.u = 60;
    boat.engine = 1;
    run(boat, 10, { ...ahead, rudder: 1 });
    expect(boat.heading).toBeGreaterThan(.5);
    expect(boat.heading).toBeLessThan(1.5);
    expect(Math.abs(Math.atan2(boat.v, boat.u))).toBeLessThan(5 * Math.PI / 180);
  });

  it("brakes physically from full speed and holds astern below 18 km/h", () => {
    const boat = createVessel(ship.id, origin);
    boat.u = 61;
    boat.engine = 1;
    stepVessel(boat, still, FIXED_DT, undefined, astern);
    expect(boat.u).toBeGreaterThan(60);
    while (boat.u > 0 && boat.simTime < 120)
      stepVessel(boat, still, FIXED_DT, undefined, astern);
    expect(boat.u).toBeLessThanOrEqual(0);
    expect(boat.simTime).toBeLessThan(60);
    expect(boat.distance).toBeGreaterThan(300);
    expect(boat.distance).toBeLessThan(1500);
    run(boat, 90, astern);
    expect(boat.u).toBeLessThan(-1);
    expect(Math.abs(boat.u) * 3.6).toBeLessThan(18);
  });

  it("funds a 330 km full-power manual passage with an explicit 25% reserve", () => {
    const end = destination(origin, Math.PI / 2, 330000);
    const route: Route = { id: "vector-range", name: "Open water", from: "current", to: "test",
      points: [origin, end], distance: 330000, directDistance: 330000, description: "" };
    const boat = createVessel(ship.id, origin, bearing(origin, end));
    const initialFuel = boat.fuel;
    const estimate = estimateRouteFuel(boat, route, still);
    expect(estimate.status).toBe("sufficient");
    expect(estimate.reserveLitres).toBe(estimate.estimatedFuelLitres * .25);
    while (boat.distance < route.distance && boat.simTime < 9000 && boat.fuel > 0)
      stepVessel(boat, still, FIXED_DT, undefined, ahead);
    expect(boat.distance).toBeGreaterThanOrEqual(route.distance);
    expect(estimate.estimatedFuelLitres).toBeGreaterThan(initialFuel - boat.fuel);
    expect(boat.fuel).toBeGreaterThan(estimate.reserveLitres);
  });

  it("physically completes Marseille–Barcelona with evolving weather and its forecast reserve intact", () => {
    const world = worldFromGeoJSON(JSON.parse(readFileSync(new URL("../public/data/land.geojson", import.meta.url), "utf8")));
    const departure = PORTS.find(port => port.id === "marseille")!;
    const arrival = PORTS.find(port => port.id === "barcelona")!;
    const route = routeFromPosition(world, departure, arrival.id)!;
    const boat = createVessel(ship.id, departure, departure.heading);
    const weather = createWeather("calm", 4821);
    const estimate = estimateRouteFuel(boat, route, weather);
    const initialFuel = boat.fuel;
    const sim = new Simulation(boat, weather, world);
    sim.requestedScale = 100;
    sim.voyage = { route, waypoint: 1, autopilot: true, completed: false };
    let contacts = 0;
    sim.onCollision = () => contacts++;
    while (boat.simTime < 18000 && !sim.voyage.completed && !contacts && boat.fuel > 0) sim.advance(1 / 30);
    expect(estimate.status).toBe("sufficient");
    expect(contacts).toBe(0);
    expect(sim.voyage.completed).toBe(true);
    expect(distance(boat, arrival)).toBeLessThan(100);
    expect(motion(boat, sim.weather).sog).toBeLessThan(.85);
    expect(estimate.estimatedFuelLitres).toBeGreaterThan(initialFuel - boat.fuel);
    expect(boat.fuel).toBeGreaterThan(estimate.reserveLitres);
    expect(boat.shipId).toBe("speedboat");
  }, 15000);

  it("round trips the selected speedboat at full speed with momentum, fuel and itinerary preserved", () => {
    const state = createVessel(ship.id, origin, 1.2);
    Object.assign(state, { u: 61, v: -.3, yawRate: .08, engine: 1, fuel: 875.25, simTime: 640, distance: 31000 });
    state.controls = { throttle: 1, rudder: .25, gear: 1 };
    const save: SaveGame = {
      version: 1, savedAt: "2026-09-26T21:00:00Z", state, sea: "calm", seed: 4821,
      routeTarget: "barcelona", autopilot: false, mission: null, quality: "high", camera: "follow", tutorialComplete: true,
      itinerary: { destinationId: "cartagena", stopIds: ["barcelona", "cartagena"], legIndex: 0, refuelPortId: null },
    };
    expect(parseSave(JSON.stringify(save))).toEqual(save);
    const malformed = structuredClone(save);
    malformed.state.fuel = ship.fuelCapacity + 1;
    expect(parseSave(JSON.stringify(malformed))).toBeNull();
  });
});
