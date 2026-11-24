import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import assert from "node:assert/strict";
import { SHIPS } from "../src/data/ships";
import { portById } from "../src/data/ports";
import { distance } from "../src/geo/math";
import { routeFromPosition } from "../src/geo/routes";
import { worldFromGeoJSON } from "../src/geo/world";
import { createVessel, motion, Simulation } from "../src/sim/engine";
import { estimateRouteFuel } from "../src/sim/routeEstimate";
import { createWeather } from "../src/sim/weather";

const world = worldFromGeoJSON(JSON.parse(readFileSync("public/data/land.geojson", "utf8")));
const departure = portById("marseille")!;
const weather = createWeather("calm", 4821);
const rows = [];
for (const to of ["cassis", "barcelona"]) {
  const route = routeFromPosition(world, departure, to)!;
  for (const ship of SHIPS) {
    const state = createVessel(ship.id, departure, departure.heading);
    const start = performance.now();
    const estimate = estimateRouteFuel(state, route, weather);
    const coldMs = performance.now() - start;
    const cachedStart = performance.now();
    for (let index = 0; index < 1000; index++) estimateRouteFuel(state, route, weather);
    const cachedMsPerCall = (performance.now() - cachedStart) / 1000;
    let actual;
    if (to === "cassis") {
      const startFuel = state.fuel;
      const sim = new Simulation(state, { ...weather }, world);
      sim.requestedScale = 100;
      sim.voyage = { route, waypoint: 1, autopilot: true, completed: false };
      let collisions = 0;
      sim.onCollision = () => collisions++;
      while (state.simTime < 15000 && !sim.voyage.completed && !collisions && state.fuel > 0)
        sim.advance(1 / 30);
      const consumedLitres = startFuel - state.fuel;
      actual = {
        completed: sim.voyage.completed, collisions, simSeconds: state.simTime,
        consumedLitres, remainingLitres: state.fuel,
        arrivalDistanceM: distance(state, portById(to)!),
        arrivalSpeedMS: motion(state, sim.weather).sog,
        errorFraction: estimate.estimatedFuelLitres / consumedLitres - 1,
        reserveCoversConsumption: estimate.requiredFuelLitres >= consumedLitres,
      };
      assert(actual.completed && !collisions && actual.reserveCoversConsumption,
        `${ship.id} passage failed its completion/fuel checks`);
    }
    rows.push({ shipId: ship.id, to, estimate, coldMs, cachedMsPerCall, ...(actual ? { actual } : {}) });
    console.log(ship.id, to, estimate.estimatedFuelLitres.toFixed(2), actual?.consumedLitres.toFixed(2) ?? "forecast only");
  }
}
const spirit = createVessel("spirit", departure, departure.heading);
const route = routeFromPosition(world, departure, "cassis")!;
const predicted = estimateRouteFuel(spirit, route, weather).estimatedFuelLitres;
const fuelStatuses = [0, predicted * 0.8, predicted * 1.1, predicted * 1.3].map((fuel) =>
  ({ fuel, ...estimateRouteFuel({ ...spirit, fuel }, route, weather) }),
);
const report = {
  generatedAt: new Date().toISOString(),
  conditions: {
    load: 0.35,
    weather: "initial calm / seed4821 for estimate; evolving calm for actual passages",
    reserve: "25% of predicted passage fuel",
    actualVoyages: "Only Cassis physically executed in this report; Barcelona rows are estimates. Spirit Barcelona has its own spirit-fuel-after.json physical report.",
    spiritFuelBalance: "900 L capacity; 60–650 L/h linear game curve",
  },
  routes: rows,
  fuelStatuses,
};
mkdirSync("artifacts/planning", { recursive: true });
writeFileSync("artifacts/planning/fuel-estimates.json", JSON.stringify(report, null, 2));
