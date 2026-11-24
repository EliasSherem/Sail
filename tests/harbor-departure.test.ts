import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { portById } from "../src/data/ports";
import { shipById } from "../src/data/ships";
import { bearing, destination, distance, toLocal } from "../src/geo/math";
import { worldFromGeoJSON } from "../src/geo/world";
import { createVessel, Simulation } from "../src/sim/engine";
import { harborDepartureError } from "../src/sim/harborDeparture";
import { createWeather } from "../src/sim/weather";
import type { CollisionWorld, Route, Voyage } from "../src/types";

const world = worldFromGeoJSON(JSON.parse(readFileSync(
  new URL("../public/data/land.geojson", import.meta.url), "utf8",
)));
const port = portById("qikiqtarjuaq")!;
// Explicit berth scenario: south-facing hull, outbound slightly east of north.
// The short port turn sweeps into the real quay 160 m east of the buoy;
// the longer starboard turn stays in the water west of it. Ocean graph edits
// must not silently change the incoming heading and remove this regression.
const heading = Math.PI;
function waterExit(): Route {
  const end = destination(port, .05, 5000);
  return { id: "qikiqtarjuaq-water-exit", from: port.id, to: "open-water-fixture", name: "Clear northern departure",
    points: [{ lat: port.lat, lon: port.lon }, end], distance: 5000, directDistance: 5000,
    description: "Explicit physical U-turn beside Qikiqtarjuaq quay" };
}

describe("physical departure from a refuelling berth", () => {
  it("chooses the water side of a quay when the shortest U-turn is obstructed", () => {
    const state = createVessel("fishing", port, heading);
    const route = waterExit();
    const voyage: Voyage = { route, waypoint: 1, autopilot: true, completed: false };
    const raw = bearing(state, route.points[1]) - heading;
    const error = Math.atan2(Math.sin(raw), Math.cos(raw));
    const before = structuredClone(state);
    expect(world.sweep(state, route.points[1], 90).hit).toBe(false);
    const ship = shipById("fishing"), turnRadius = Math.max(ship.length * 3.8, ship.cruiseKnots * .514444 * 10);
    expect(world.sweep(destination(state, Math.PI / 2, turnRadius), destination(state, Math.PI / 2, turnRadius * 2), Math.hypot(ship.length, ship.beam) / 2 + 4))
      .toMatchObject({ hit: true, kind: "dock" });
    expect(error).toBeLessThan(0);
    const chosen = harborDepartureError(error, state, shipById("fishing"), voyage, world);
    expect(chosen).toBeGreaterThan(Math.PI);
    expect(state).toEqual(before);
    expect(harborDepartureError(error, state, shipById("fishing"), { ...voyage })).toBe(error);
  });

  it("re-evaluates a replaced route on the same voyage and retains the cache only while that route stays active", () => {
    const state = createVessel("fishing", port, heading), ship = shipById("fishing");
    const outbound = waterExit();
    const initialTarget = destination(state, heading + .05, 100);
    expect(world.sweep(state, initialTarget, 90).hit).toBe(false);
    const voyage: Voyage = {
      route: { ...outbound, points: [port, initialTarget] },
      waypoint: 1, autopilot: true, completed: false,
    };
    let sweeps = 0;
    const countedWorld: CollisionWorld = {
      sweep: (a, b, radius) => { sweeps++; return world.sweep(a, b, radius); },
      clearance: point => world.clearance(point),
    };
    expect(harborDepartureError(.05, state, ship, voyage, countedWorld)).toBe(.05);
    expect(sweeps).toBe(0);

    // The new destination requires the opposite, water-side U-turn. Reusing
    // the previous route's cached "no special turn" would miss the quay.
    voyage.route = outbound;
    const raw = bearing(state, outbound.points[1]) - heading;
    const error = Math.atan2(Math.sin(raw), Math.cos(raw));
    const chosen = harborDepartureError(error, state, ship, voyage, countedWorld);
    expect(chosen).toBeGreaterThan(Math.PI);
    expect(sweeps).toBeGreaterThan(0);
    const checked = sweeps;
    expect(harborDepartureError(error, state, ship, voyage, countedWorld)).toBe(chosen);
    expect(sweeps).toBe(checked);

    // A later manual replan while already underway must also retire the old
    // forced turn. Ordinary in-progress departures retain it until release.
    state.u = 2;
    expect(harborDepartureError(error, state, ship, voyage, countedWorld)).toBe(chosen);
    voyage.route = waterExit();
    const before = structuredClone(state);
    expect(harborDepartureError(error, state, ship, voyage, countedWorld)).toBe(error);
    expect(state).toEqual(before);
  });

  it("sails clear under ordinary forces and stays equivalent at 1× and requested 100×", () => {
    const execute = (scale: number) => {
      const state = createVessel("fishing", port, heading);
      const sim = new Simulation(state, createWeather("calm", 4821), world);
      sim.requestedScale = scale;
      sim.voyage = { route: waterExit(), waypoint: 1, autopilot: true, completed: false };
      let collisions = 0;
      sim.onCollision = () => collisions++;
      while (state.simTime < 400 - 1e-7) {
        // Limit the final frame so both runs end on the same fixed physical step.
        const realDt = Math.min(1 / 30, (400 - state.simTime) / sim.activeScale);
        sim.advance(realDt);
      }
      expect(collisions).toBe(0);
      expect(state.damage).toBe(0);
      expect(toLocal(state, port).z).toBeLessThan(-1000);
      expect(state.distance).toBeGreaterThan(1000);
      expect(state.fuel).toBeLessThan(shipById(state.shipId).fuelCapacity);
      return state;
    };
    const normal = execute(1), fast = execute(100);
    expect(distance(normal, fast)).toBeLessThan(0.01);
    expect(normal.heading).toBeCloseTo(fast.heading, 8);
    expect(normal.fuel).toBeCloseTo(fast.fuel, 8);
  }, 15000);
});
