import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { SHIPS, shipById } from "../src/data/ships";
import { destination, distance, toLocal } from "../src/geo/math";
import {
  autopilotControls,
  canPlaceVessel,
  createVessel,
  FIXED_DT,
  fuelRate,
  motion,
  Simulation,
  stepVessel,
} from "../src/sim/engine";
import { createWeather, waveAt, weatherAt } from "../src/sim/weather";
import { worldFromGeoJSON } from "../src/geo/world";
import { routeFromPosition } from "../src/geo/routes";
import { PORTS } from "../src/data/ports";
import type {
  CollisionWorld,
  Controls,
  ShipId,
  VesselState,
  Voyage,
  Weather,
} from "../src/types";

const origin = { lat: 0, lon: 0 };
const still: Weather = {
  sea: "calm",
  seed: 0,
  windSpeed: 0,
  windDirection: 0,
  currentSpeed: 0,
  currentDirection: 0,
  waveHeight: 0,
  visibility: 30000,
};
const ahead: Controls = { throttle: 1, rudder: 0, gear: 1 };
const coast: Controls = { throttle: 0, rudder: 0, gear: 0 };
const reverse: Controls = { throttle: 1, rudder: 0, gear: -1 };
function run(
  state: VesselState,
  seconds: number,
  controls = state.controls,
  weather = still,
  world?: CollisionWorld,
): void {
  for (let t = 0; t < Math.round(seconds / FIXED_DT); t++)
    stepVessel(state, weather, FIXED_DT, world, controls);
}

describe("three-degree-of-freedom naval dynamics", () => {
  it("accelerates progressively, coasts, and reverses without flipping velocity", () => {
    const boat = createVessel("launch", origin);
    run(boat, 1, ahead);
    const afterOne = boat.u;
    run(boat, 29, ahead);
    expect(afterOne).toBeGreaterThan(0);
    expect(afterOne).toBeLessThan(boat.u * 0.2);
    const fast = boat.u;
    run(boat, 1, coast);
    expect(boat.u).toBeGreaterThan(fast * 0.7);
    run(boat, 30, coast);
    expect(boat.u).toBeGreaterThan(0);
    expect(boat.u).toBeLessThan(fast * 0.5);
    stepVessel(boat, still, FIXED_DT, undefined, reverse);
    expect(boat.u).toBeGreaterThan(0);
    run(boat, 40, reverse);
    expect(boat.u).toBeLessThan(-1);
  });

  it("rudder alone cannot rotate a stopped vessel, while powered tug differential can", () => {
    for (const ship of SHIPS) {
      const boat = createVessel(ship.id, origin);
      run(boat, 30, { throttle: 0, rudder: 1, gear: 0 });
      expect(boat.heading).toBeCloseTo(0, 10);
      expect(boat.yawRate).toBe(0);
    }
    const tug = createVessel("tug", origin);
    run(tug, 10, { throttle: 0.65, rudder: 1, gear: 1 });
    expect(tug.heading).toBeGreaterThan(0.1);
    expect(tug.u).toBeLessThan(3);
  });

  it("cargo acceleration, turning, and stopping differ materially from launch", () => {
    const launch = createVessel("launch", origin);
    const cargo = createVessel("cargo", origin);
    run(launch, 30, ahead);
    run(cargo, 30, ahead);
    expect(launch.u).toBeGreaterThan(cargo.u * 10);
    launch.u = 6;
    cargo.u = 6;
    launch.engine = 1;
    cargo.engine = 1;
    run(launch, 10, { ...ahead, rudder: 1 });
    run(cargo, 10, { ...ahead, rudder: 1 });
    expect(launch.yawRate).toBeGreaterThan(cargo.yawRate * 5);
    const stoppingDistance = (shipId: ShipId) => {
      const boat = createVessel(shipId, origin);
      boat.u = 6;
      boat.engine = 1;
      for (let i = 0; i < 30000 && boat.u > 0; i++)
        stepVessel(boat, still, FIXED_DT, undefined, reverse);
      return boat.distance;
    };
    expect(stoppingDistance("cargo")).toBeGreaterThan(
      stoppingDistance("launch") * 30,
    );
  });

  it("uses water-relative resistance, permitting drift at nearly zero speed through water", () => {
    const boat = createVessel("cargo", origin);
    const current = {
      ...still,
      currentSpeed: 1,
      currentDirection: Math.PI / 2,
    };
    run(boat, 60, coast, current);
    expect(motion(boat, current).stw).toBeLessThan(0.01);
    expect(motion(boat, current).sog).toBeCloseTo(1, 2);
    expect(toLocal(boat, origin).x).toBeGreaterThan(59);
    expect(distance(boat, origin)).toBeLessThan(61);
  });

  it("crosswind produces measurable lateral drift and loading slows response", () => {
    const light = createVessel("launch", origin, 0, 0);
    const loaded = createVessel("launch", origin, 0, 1);
    run(light, 20, ahead);
    run(loaded, 20, ahead);
    expect(light.u).toBeGreaterThan(loaded.u);
    expect(shipById("launch").fuelCapacity - loaded.fuel).toBeGreaterThan(
      shipById("launch").fuelCapacity - light.fuel,
    );
    const drifting = createVessel("launch", origin);
    run(drifting, 60, coast, {
      ...still,
      windSpeed: 12,
      windDirection: Math.PI / 2,
    });
    expect(drifting.v).toBeGreaterThan(0.3);
    expect(toLocal(drifting, origin).x).toBeGreaterThan(10);
  });

  it("consumes finite fuel consistently and has no propulsive energy after fuel is exhausted", () => {
    const boat = createVessel("launch", origin);
    boat.engine = 0.8;
    const before = boat.fuel;
    const expected = fuelRate(boat) * FIXED_DT;
    stepVessel(boat, still, FIXED_DT, undefined, { ...ahead, throttle: 0.8 });
    expect(before - boat.fuel).toBeCloseTo(expected, 9);
    boat.fuel = 0;
    boat.u = 2;
    run(boat, 60, ahead);
    expect(boat.fuel).toBe(0);
    expect(boat.u).toBeGreaterThan(0);
    expect(boat.u).toBeLessThan(1);
  });
  it("never propagates a legacy negative engine value into NaN fuel or coordinates", () => {
    const boat = createVessel("yacht", origin);
    boat.engine = -0.5;
    expect(Number.isFinite(fuelRate(boat))).toBe(true);
    stepVessel(boat, still, FIXED_DT, undefined, ahead);
    expect(boat.engine).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(boat.fuel)).toBe(true);
    expect(Number.isFinite(boat.lat)).toBe(true);
    expect(Number.isFinite(boat.lon)).toBe(true);
  });
});

describe("fixed time step and synthetic environment", () => {
  function scenario(fps: number, scale: number, seconds: number): Simulation {
    const boat = createVessel("fishing", { lat: 30, lon: -30 }, 0.3);
    boat.controls = { throttle: 0.72, rudder: 0.12, gear: 1 };
    const sim = new Simulation(boat, createWeather("moderate", 942));
    sim.requestedScale = scale;
    for (let i = 0; i < Math.round(fps * seconds); i++) sim.advance(1 / fps);
    return sim;
  }
  it("matches across 30, 60, and 144 rendered frames per second", () => {
    const base = scenario(30, 1, 30);
    for (const fps of [60, 144]) {
      const other = scenario(fps, 1, 30);
      expect(other.state.simTime).toBeCloseTo(base.state.simTime, 8);
      expect(distance(other.state, base.state)).toBeLessThan(1e-5);
      expect(other.state.u).toBeCloseTo(base.state.u, 10);
      expect(other.state.fuel).toBeCloseTo(base.state.fuel, 10);
    }
  });
  it("100× preserves distance, fuel, weather, and simulated time", () => {
    const normal = scenario(30, 1, 100);
    const accelerated = scenario(60, 100, 1);
    expect(distance(normal.state, accelerated.state)).toBeLessThan(1e-5);
    expect(normal.state.fuel).toBeCloseTo(accelerated.state.fuel, 9);
    expect(normal.state.simTime).toBeCloseTo(accelerated.state.simTime, 8);
    expect(normal.weather.windSpeed).toBeCloseTo(
      accelerated.weather.windSpeed,
      10,
    );
  });
  it("retains every pending fixed step when a long frame reaches its work budget", () => {
    const normal = scenario(30, 1, 1000);
    const stalled = new Simulation(
      createVessel("fishing", { lat: 30, lon: -30 }, 0.3),
      createWeather("moderate", 942),
    );
    stalled.state.controls = { throttle: 0.72, rudder: 0.12, gear: 1 };
    stalled.requestedScale = 100;
    stalled.advance(10);
    expect(stalled.state.simTime).toBeLessThan(334);
    expect(stalled.accumulator).toBeGreaterThan(600);
    for (let i = 0; i < 3; i++) stalled.advance(1e-8);
    expect(stalled.accumulator).toBeLessThan(FIXED_DT);
    expect(stalled.realTime).toBeCloseTo(10, 6);
    expect(stalled.state.simTime).toBeCloseTo(1000, 7);
    expect(distance(stalled.state, normal.state)).toBeLessThan(1e-5);
    expect(stalled.state.fuel).toBeCloseTo(normal.state.fuel, 8);
  });
  it("weather and waves are seed reproducible, time-varying, and size-sensitive", () => {
    const weather = weatherAt("rough", 42, 7200);
    expect(weather).toEqual(weatherAt("rough", 42, 7200));
    expect(weather.windSpeed).not.toBe(weatherAt("rough", 42, 100).windSpeed);
    const small = waveAt(30, 75, 17, weather, 9);
    const large = waveAt(30, 75, 17, weather, 180);
    expect(small).toEqual(waveAt(30, 75, 17, weather, 9));
    expect(Math.abs(large.pitch) + Math.abs(large.roll)).toBeLessThan(
      Math.abs(small.pitch) + Math.abs(small.roll),
    );
    expect(Math.abs(small.pitch)).toBeLessThan(0.5);
  });
});

describe("collision and physically constrained pilot", () => {
  const coastWorld: CollisionWorld = {
    clearance: (point) => Math.max(0, 220 - toLocal(point, origin).x),
    sweep: (from, to, radius) => ({
      hit:
        Math.max(toLocal(from, origin).x, toLocal(to, origin).x) + radius >=
        220,
      kind: "land",
    }),
  };
  it("sweeps the hull, caps acceleration near shore, and cannot tunnel at 100×", () => {
    const boat = createVessel("launch", origin, Math.PI / 2);
    boat.u = 14;
    boat.engine = 1;
    boat.controls = { ...ahead };
    const sim = new Simulation(boat, still, coastWorld);
    sim.evolvingWeather = false;
    sim.requestedScale = 100;
    let collisions = 0;
    sim.onCollision = () => collisions++;
    for (let i = 0; i < 1200; i++) sim.advance(1 / 30);
    expect(toLocal(boat, origin).x).toBeLessThan(
      220 - shipById("launch").length / 2,
    );
    expect(boat.damage).toBeGreaterThan(0);
    expect(collisions).toBeGreaterThan(0);
    expect(sim.activeScale).toBe(1);
  });
  it("rejects an unsafe restored cargo bow even when its center has clear water", () => {
    const shore: CollisionWorld = {
      clearance: (point) => Math.max(0, 40 - toLocal(point, origin).x),
      sweep: (from, to, radius) => ({
        hit:
          Math.max(toLocal(from, origin).x, toLocal(to, origin).x) + radius >=
          40,
        kind: "land",
      }),
    };
    const cargo = createVessel("cargo", origin, Math.PI / 2);
    expect(shore.sweep(cargo, cargo, shipById("cargo").beam / 2).hit).toBe(
      false,
    );
    expect(canPlaceVessel(cargo, shore)).toBe(false);
    expect(
      canPlaceVessel(createVessel("launch", origin, Math.PI / 2), shore),
    ).toBe(true);
  });
  it("pilot changes controls without changing physical position or orientation", () => {
    const boat = createVessel("cargo", origin);
    const destinationPoint = destination(origin, Math.PI / 2, 10000);
    const voyage: Voyage = {
      route: {
        id: "test",
        name: "Test",
        from: "a",
        to: "b",
        points: [origin, destinationPoint],
        distance: 10000,
        directDistance: 10000,
        description: "",
      },
      waypoint: 0,
      autopilot: true,
      completed: false,
    };
    const before = structuredClone(boat);
    const controls = autopilotControls(boat, still, voyage);
    expect(boat).toEqual(before);
    expect(controls.rudder).toBeGreaterThan(0);
    expect(controls.throttle).toBeGreaterThan(0);
    stepVessel(boat, still, FIXED_DT, undefined, controls);
    expect(boat.heading).toBeLessThan(0.001);
    expect(distance(boat, before)).toBeLessThan(0.01);
  });
  it("the autopilot brakes and reaches a short trip using normal integration", () => {
    const boat = createVessel("launch", origin);
    const end = destination(origin, 0, 1200);
    const sim = new Simulation(boat, still);
    sim.evolvingWeather = false;
    sim.voyage = {
      route: {
        id: "test",
        name: "Test",
        from: "a",
        to: "b",
        points: [origin, end],
        distance: 1200,
        directDistance: 1200,
        description: "",
      },
      waypoint: 0,
      autopilot: true,
      completed: false,
    };
    for (let i = 0; i < 900 && !sim.voyage.completed; i++) sim.advance(1);
    expect(sim.voyage.completed).toBe(true);
    expect(distance(boat, end)).toBeLessThan(30);
    expect(motion(boat, still).sog).toBeLessThan(0.75);
    expect(boat.simTime).toBeGreaterThan(100);
    expect(boat.fuel).toBeLessThan(shipById("launch").fuelCapacity);
  });
});

describe("bundled-world voyage regression", () => {
  const world = worldFromGeoJSON(
    JSON.parse(
      readFileSync(
        new URL("../public/data/land.geojson", import.meta.url),
        "utf8",
      ),
    ),
  );
  const departure = PORTS.find((port) => port.id === "marseille")!;
  const end = PORTS.find((port) => port.id === "cassis")!;
  const route = routeFromPosition(world, departure, end.id)!;
  it.each(SHIPS.map((ship) => ship.id))(
    "%s reaches Cassis with evolving calm weather and no contact",
    (id) => {
      expect(route).not.toBeNull();
      const boat = createVessel(id, departure, departure.heading);
      const sim = new Simulation(boat, createWeather("calm", 4821), world);
      sim.voyage = { route, waypoint: 1, completed: false, autopilot: true };
      let collisions = 0;
      sim.onCollision = () => collisions++;
      for (
        let seconds = 0;
        seconds < 15000 && !sim.voyage.completed && !collisions;
        seconds += 2
      )
        sim.advance(2);
      expect(collisions).toBe(0);
      expect(sim.voyage.completed).toBe(true);
      expect(distance(boat, end)).toBeLessThan(200);
      expect(motion(boat, sim.weather).sog).toBeLessThan(0.85);
      expect(boat.fuel).toBeGreaterThan(shipById(id).fuelCapacity * 0.25);
    },
    15000,
  );
  it.each(SHIPS.map((ship) => ship.id))(
    "%s completes the same coast passage requesting 100× without crossing obstacles",
    (id) => {
      const boat = createVessel(id, departure, departure.heading);
      const sim = new Simulation(boat, createWeather("calm", 4821), world);
      sim.voyage = { route, waypoint: 1, completed: false, autopilot: true };
      sim.requestedScale = 100;
      let collisions = 0;
      let achieved100x = false;
      sim.onCollision = () => collisions++;
      while (boat.simTime < 15000 && !sim.voyage.completed && !collisions) {
        sim.advance(1 / 30);
        achieved100x ||= sim.activeScale === 100;
      }
      expect(achieved100x).toBe(true);
      expect(collisions).toBe(0);
      expect(sim.voyage.completed).toBe(true);
      expect(sim.activeScale).toBe(1);
      expect(distance(boat, end)).toBeLessThan(200);
      expect(boat.fuel).toBeGreaterThan(shipById(id).fuelCapacity * 0.25);
    },
    15000,
  );
});
