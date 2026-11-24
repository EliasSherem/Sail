import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { SHIPS } from "../src/data/ships";
import { PORTS } from "../src/data/ports";
import { destination, distance } from "../src/geo/math";
import { routeFromPosition } from "../src/geo/routes";
import { worldFromGeoJSON } from "../src/geo/world";
import { createVessel, FIXED_DT, Simulation, stepVessel } from "../src/sim/engine";
import { affordableDistanceUpperBound, estimateRouteFuel } from "../src/sim/routeEstimate";
import { createWeather } from "../src/sim/weather";
import type { Route } from "../src/types";

const world = worldFromGeoJSON(
  JSON.parse(
    readFileSync(
      new URL("../public/data/land.geojson", import.meta.url),
      "utf8",
    ),
  ),
);
const departure = PORTS.find((port) => port.id === "marseille")!;
const weather = createWeather("calm", 4821);
const cassis = routeFromPosition(world, departure, "cassis")!;
const barcelona = routeFromPosition(world, departure, "barcelona")!;

describe("shared conservative pilot/full-power route fuel estimate", () => {
  it.each(SHIPS.map((ship) => ship.id))(
    "%s retains an accurate pilot baseline and budgets above an actual Cassis passage",
    (id) => {
      const boat = createVessel(id, departure, departure.heading);
      const estimate = estimateRouteFuel(boat, cassis, weather);
      expect(estimate.status).toBe("sufficient");
      expect(estimate.distanceM).toBeCloseTo(cassis.distance, 3);
      const startFuel = boat.fuel;
      const sim = new Simulation(boat, weather, world);
      sim.voyage = {
        route: cassis,
        waypoint: 1,
        autopilot: true,
        completed: false,
      };
      sim.requestedScale = 100;
      let collisions = 0;
      sim.onCollision = () => collisions++;
      while (boat.simTime < 15000 && !sim.voyage.completed && !collisions)
        sim.advance(1 / 30);
      expect(sim.voyage.completed).toBe(true);
      expect(collisions).toBe(0);
      const consumed = startFuel - boat.fuel;
      expect(estimate.pilotFuelLitres).toBeGreaterThan(consumed * 0.7);
      expect(estimate.pilotFuelLitres).toBeLessThan(consumed * 1.3);
      expect(estimate.estimatedFuelLitres).toBeGreaterThan(consumed);
      expect(estimate.requiredFuelLitres).toBeGreaterThan(consumed);
      expect(estimate.durationSeconds).toBeGreaterThan(boat.simTime * 0.75);
      expect(estimate.durationSeconds).toBeLessThan(boat.simTime * 1.25);
    },
    15000,
  );

  it("plans Barcelona for both pilot and full-power driving instead of promising the pilot's longer range", () => {
    for (const ship of SHIPS) {
      const state = createVessel(ship.id, departure, departure.heading);
      const estimate = estimateRouteFuel(state, barcelona, weather);
      for (const value of [
        estimate.distanceM,
        estimate.durationSeconds,
        estimate.estimatedFuelLitres,
        estimate.reserveLitres,
        estimate.requiredFuelLitres,
        estimate.cruiseSpeedKnots,
        estimate.pilotFuelLitres,
        estimate.fullPowerFuelLitres,
        estimate.manoeuvreFuelLitres,
      ])
        expect(Number.isFinite(value)).toBe(true);
      expect(estimate.pilotFuelLitres).toBeGreaterThan(
        estimateRouteFuel(state, cassis, weather).pilotFuelLitres * 8,
      );
      expect(estimate.estimatedFuelLitres).toBeGreaterThanOrEqual(
        Math.max(estimate.pilotFuelLitres, estimate.fullPowerFuelLitres) + estimate.manoeuvreFuelLitres - 1e-8,
      );
      expect(estimate.status).toBe("sufficient");
    }
    const yacht = createVessel("yacht", departure, departure.heading);
    const estimate = estimateRouteFuel(yacht, barcelona, weather);
    expect(estimate.estimatedFuelLitres).toBeGreaterThan(estimate.fullPowerFuelLitres);
    expect(estimate.manoeuvreFuelLitres).toBeLessThan(estimate.estimatedFuelLitres * .15);
    expect(estimate.estimatedFuelLitres).toBeLessThan(yacht.fuel / (1 + estimate.reserveFraction));
    expect(estimate.requiredFuelLitres).toBeLessThan(yacht.fuel);
  });

  it("Spirit physically reaches Barcelona without refuelling and retains more than 25% of its touring tank", () => {
    const boat = createVessel("spirit", departure, departure.heading);
    const estimate = estimateRouteFuel(boat, barcelona, weather);
    const startingFuel = boat.fuel;
    const sim = new Simulation(boat, { ...weather }, world);
    sim.requestedScale = 100;
    sim.voyage = { route: barcelona, waypoint: 1, autopilot: true, completed: false };
    let collisions = 0;
    sim.onCollision = () => collisions++;
    while (boat.simTime < 25000 && !sim.voyage.completed && !collisions && boat.fuel > 0)
      sim.advance(1 / 30);
    expect(sim.voyage.completed).toBe(true);
    expect(collisions).toBe(0);
    expect(boat.fuel).toBeGreaterThan(startingFuel * 0.25);
    const consumed = startingFuel - boat.fuel;
    expect(estimate.status).toBe("sufficient");
    expect(estimate.requiredFuelLitres).toBeGreaterThan(consumed);
    expect(Math.abs(estimate.pilotFuelLitres / consumed - 1)).toBeLessThan(0.15);
  }, 15000);

  it("separates passage fuel, 25% recommended reserve, and onboard fuel at exact status boundaries", () => {
    const state = createVessel("yacht", departure, departure.heading);
    const base = estimateRouteFuel(state, cassis, weather);
    expect(base.reserveFraction).toBe(0.25);
    expect(base.reserveLitres).toBe(base.estimatedFuelLitres * 0.25);
    expect(base.requiredFuelLitres).toBe(base.estimatedFuelLitres * 1.25);
    state.fuel = base.requiredFuelLitres;
    expect(estimateRouteFuel(state, cassis, weather).status).toBe("sufficient");
    state.fuel = base.estimatedFuelLitres;
    expect(estimateRouteFuel(state, cassis, weather).status).toBe(
      "low-reserve",
    );
    state.fuel = base.estimatedFuelLitres - 0.01;
    const insufficient = estimateRouteFuel(state, cassis, weather);
    expect(insufficient.status).toBe("insufficient");
    expect(insufficient.remainingFuelLitres).toBeLessThan(0);
    expect(insufficient.estimatedFuelLitres).toBe(base.estimatedFuelLitres);
  });

  it.each(SHIPS.map(ship => ship.id))("%s budgets an actual full-power manual passage, including its acceleration", id => {
    const origin = { lat: 0, lon: -30 }, heading = Math.PI / 2;
    const conditions = { ...weather, windSpeed: 0, currentSpeed: 0 };
    const target = destination(origin, heading, 10000);
    const route: Route = { id: `manual-${id}`, name: "Manual passage", from: "current", to: "test",
      points: [origin, target], distance: 10000, directDistance: 10000, description: "Explicit open-water fixture" };
    const boat = createVessel(id, origin, heading), initialFuel = boat.fuel;
    const estimate = estimateRouteFuel(boat, route, conditions);
    boat.controls = { throttle: 1, rudder: 0, gear: 1 };
    while (boat.distance < 10000 && boat.simTime < 5000 && boat.fuel > 0)
      stepVessel(boat, conditions, FIXED_DT);
    expect(boat.distance).toBeGreaterThanOrEqual(10000);
    expect(estimate.estimatedFuelLitres).toBeGreaterThan(initialFuel - boat.fuel);
    expect(estimate.manoeuvreFuelLitres).toBeGreaterThan(0);
    if (id !== "spirit") expect(estimate.fullPowerFuelLitres).toBeGreaterThan(estimate.pilotFuelLitres * 1.4);
  });

  it("budgets changing-weather Spirit Barcelona fuel while keeping the 25% reserve separate", () => {
    const boat = createVessel("spirit", departure, departure.heading), conditions = createWeather("hurricane", 4821);
    const estimate = estimateRouteFuel(boat, barcelona, conditions), initialFuel = boat.fuel;
    const sim = new Simulation(boat, conditions, world);
    sim.requestedScale = 100;
    sim.voyage = { route: barcelona, waypoint: 1, autopilot: true, completed: false };
    let collisions = 0; sim.onCollision = () => collisions++;
    while (boat.simTime < 25000 && !sim.voyage.completed && !collisions && boat.fuel > 0) sim.advance(1 / 30);
    expect(sim.voyage.completed).toBe(true);
    expect(collisions).toBe(0);
    expect(estimate.estimatedFuelLitres).toBeGreaterThan(initialFuel - boat.fuel);
    expect(estimate.reserveLitres).toBe(estimate.estimatedFuelLitres * .25);
    // The touring calibration covers the full adverse-weather forecast as well
    // as this physical passage; the contingency is still additional fuel.
    expect(estimate.status).toBe("sufficient");
    expect(estimate.requiredFuelLitres).toBeLessThan(initialFuel);
    expect(boat.fuel).toBeGreaterThan(estimate.reserveLitres);
  }, 15000);

  it("works with empty fuel, at rest, in neutral or docked without mutating state, weather or route", () => {
    for (const ship of SHIPS) {
      const state = createVessel(ship.id, departure, departure.heading);
      const reference = estimateRouteFuel(state, cassis, weather);
      state.fuel = 0;
      state.docked = departure.id;
      state.controls = { throttle: 0, rudder: 0, gear: 0 };
      const before = structuredClone({ state, route: cassis, weather });
      // Fresh route identity also exercises a cold-cache empty-tank estimate.
      const estimate = estimateRouteFuel(
        state,
        structuredClone(cassis),
        weather,
      );
      expect(estimate.status).toBe("insufficient");
      expect(estimate.estimatedFuelLitres).toBe(reference.estimatedFuelLitres);
      expect(estimate.availableFuelLitres).toBe(0);
      expect(estimate.estimatedFuelLitres).toBeGreaterThan(0);
      expect({ state, route: cassis, weather }).toEqual(before);
    }
  });

  it("reflects load and hull damage, including the jet, rather than using nominal cruise blindly", () => {
    for (const id of ["launch", "yacht", "cargo", "spirit"] as const) {
      const light = createVessel(id, departure, departure.heading, 0);
      const heavy = createVessel(id, departure, departure.heading, 1);
      const lightEstimate = estimateRouteFuel(light, cassis, weather);
      const heavyEstimate = estimateRouteFuel(heavy, cassis, weather);
      expect(heavyEstimate.estimatedFuelLitres).toBeGreaterThan(
        lightEstimate.estimatedFuelLitres,
      );
      const damaged = { ...heavy, damage: 1 };
      const damagedEstimate = estimateRouteFuel(damaged, cassis, weather);
      expect(Number.isFinite(damagedEstimate.durationSeconds)).toBe(true);
      expect(damagedEstimate.cruiseSpeedKnots).toBeLessThan(
        heavyEstimate.cruiseSpeedKnots,
      );
      expect(damagedEstimate.estimatedFuelLitres).toBeGreaterThan(
        heavyEstimate.estimatedFuelLitres,
      );
    }
  });

  it("uses segment lengths from the actual departure and accounts for current direction", () => {
    const point = { lat: 42, lon: 4 };
    const middle = destination(point, 0, 1000),
      end = destination(point, 0, 2000);
    const route: Route = {
      id: "test",
      name: "",
      from: "current",
      to: "test",
      points: [point, middle, end],
      distance: 999999,
      directDistance: 999999,
      description: "",
    };
    const state = createVessel("launch", destination(point, 0, 500));
    const conditions = { ...weather, windSpeed: 0, currentSpeed: 0 };
    const estimate = estimateRouteFuel(state, route, conditions);
    expect(estimate.distanceM).toBeCloseTo(
      distance(state, middle) + distance(middle, end),
      5,
    );
    expect(estimate.distanceM).toBeCloseTo(1500, 4);
    const following = estimateRouteFuel(state, route, {
      ...conditions,
      currentSpeed: 1,
      currentDirection: 0,
    });
    const opposing = estimateRouteFuel(state, route, {
      ...conditions,
      currentSpeed: 1,
      currentDirection: Math.PI,
    });
    expect(opposing.durationSeconds).toBeGreaterThan(following.durationSeconds);
    expect(opposing.estimatedFuelLitres).toBeGreaterThan(
      following.estimatedFuelLitres,
    );
  });

  it.each(SHIPS.map(ship => ship.id))("keeps the %s distance-pruning bound optimistic across weather, load and course", id => {
    const origin = { lat: 12, lon: -35 };
    const profiles = [
      { sea: "calm", load: 0, damage: 0, heading: 0, fuelFraction: .25 },
      { sea: "moderate", load: .35, damage: .2, heading: Math.PI / 2, fuelFraction: .35 },
      { sea: "storm", load: 1, damage: .5, heading: Math.PI, fuelFraction: .5 },
      { sea: "hurricane", load: .75, damage: 0, heading: -Math.PI / 2, fuelFraction: .7 },
    ] as const;
    for (const profile of profiles) {
      const state = createVessel(id, origin, profile.heading, profile.load);
      state.damage = profile.damage;
      state.fuel *= profile.fuelFraction;
      const conditions = createWeather(profile.sea, 4821);
      // Keep the cargo bound well below half the globe so a straight geodesic
      // cannot wrap around Earth and turn the "beyond" fixture into a short leg.
      const initialBound = affordableDistanceUpperBound(state, conditions);
      state.fuel *= Math.min(1, 1_200_000 / initialBound);
      const before = structuredClone({ state, conditions });
      const bound = affordableDistanceUpperBound(state, conditions);
      expect(Number.isFinite(bound)).toBe(true);
      expect(bound).toBeGreaterThan(0);
      let affordable = 0, unaffordable = 0;
      for (const fraction of [.002, .08, .35, .8, 1.0001]) {
        const target = destination(origin, profile.heading, bound * fraction);
        const distanceM = distance(origin, target);
        const route: Route = { id: `pruning-${id}-${profile.sea}-${fraction}`, name: "Open-water pruning fixture",
          from: "current", to: "test", points: [origin, target], distance: distanceM, directDistance: distanceM, description: "" };
        const estimate = estimateRouteFuel(state, route, conditions);
        if (estimate.status === "sufficient") {
          affordable++;
          expect(estimate.distanceM).toBeLessThanOrEqual(bound + 1e-6);
        } else unaffordable++;
        if (fraction > 1) {
          expect(distanceM).toBeGreaterThan(bound);
          expect(estimate.status).not.toBe("sufficient");
          expect(estimate.requiredFuelLitres).toBeGreaterThan(state.fuel);
        }
      }
      // Each context exercises both sides, instead of passing vacuously because
      // no positive passage happened to be affordable under an empty budget.
      expect(affordable).toBeGreaterThan(0);
      expect(unaffordable).toBeGreaterThan(0);
      expect(affordableDistanceUpperBound({ ...state, fuel: 0 }, conditions)).toBe(0);
      expect({ state, conditions }).toEqual(before);
    }
  });
});
