import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { portById } from "../src/data/ports";
import { shipById } from "../src/data/ships";
import { distance } from "../src/geo/math";
import { routeFromPosition } from "../src/geo/routes";
import { worldFromGeoJSON } from "../src/geo/world";
import { createVessel, Simulation, motion } from "../src/sim/engine";
import { estimateRouteFuel } from "../src/sim/routeEstimate";
import { createWeather } from "../src/sim/weather";

const legacy = process.argv.includes("--legacy");
const ship = shipById("spirit");
// Explicit old-game benchmark, isolated to this Node process. No saved boat or
// application parameters are mutated by running it.
if (legacy) Object.assign(ship, { fuelCapacity: 400, fuelIdle: 180 / 3600, fuelFull: 950 / 3600 });
const world = worldFromGeoJSON(JSON.parse(readFileSync("public/data/land.geojson", "utf8")));
const departure = portById("marseille")!;
const state = createVessel("spirit", departure, departure.heading);
const weather = createWeather("calm", 4821);
const route = routeFromPosition(world, state, "barcelona")!;
const estimate = estimateRouteFuel(state, route, weather);
const startFuel = state.fuel;
const sim = new Simulation(state, weather, world);
sim.requestedScale = 100;
sim.voyage = { route, waypoint: 1, autopilot: true, completed: false };
let collisions = 0;
sim.onCollision = () => collisions++;
const started = performance.now();
while (state.simTime < 30000 && !sim.voyage.completed && !collisions && state.fuel > 0)
  sim.advance(1 / 30);
const report = {
  variant: legacy ? "legacy-400L-180-to-950Lph" : "touring-900L-60-to-650Lph",
  conditions: "35% load; evolving calm seed4821; real pilot/forces; requested100x; no refuelling",
  capacityLitres: ship.fuelCapacity,
  idleLitresPerHour: ship.fuelIdle * 3600,
  fullLitresPerHour: ship.fuelFull * 3600,
  estimate,
  actual: {
    completed: sim.voyage.completed, collisions, durationSeconds: state.simTime,
    distanceM: state.distance, consumedLitres: startFuel - state.fuel,
    remainingLitres: state.fuel, arrivalDistanceM: distance(state, route.points.at(-1)!),
    arrivalSpeedMS: motion(state, sim.weather).sog,
    reserveCoversConsumption: estimate.requiredFuelLitres >= startFuel - state.fuel,
    remainingTankFraction: state.fuel / ship.fuelCapacity,
  },
  cpuMilliseconds: performance.now() - started,
};
mkdirSync("artifacts/planning", { recursive: true });
writeFileSync(`artifacts/planning/spirit-fuel-${legacy ? "before" : "after"}.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
