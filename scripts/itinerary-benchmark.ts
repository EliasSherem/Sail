import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { portById } from "../src/data/ports";
import { shipById } from "../src/data/ships";
import { bearing, destination, distance } from "../src/geo/math";
import { routeFromPosition } from "../src/geo/routes";
import { worldFromGeoJSON } from "../src/geo/world";
import { createVessel, Simulation, motion, fuelRate } from "../src/sim/engine";
import { planFuelItinerary } from "../src/sim/itinerary";
import { estimateRouteFuel } from "../src/sim/routeEstimate";
import { createWeather } from "../src/sim/weather";
import { DOCKING_RADIUS_METERS } from "../src/sim/navigationConstants";
import type { Route } from "../src/types";

const world = worldFromGeoJSON(JSON.parse(readFileSync("public/data/land.geojson", "utf8")));
const departure = portById("marseille")!;
const weather = createWeather("calm", 4821);
const plans = ["fishing", "yacht", "cargo", "spirit"].map((id) => {
  const state = createVessel(id as "fishing" | "yacht" | "cargo" | "spirit", departure, departure.heading);
  const start = performance.now();
  const itinerary = planFuelItinerary(world, state, "new-york", weather);
  console.log(id, itinerary.status, itinerary.legs.length, (performance.now() - start).toFixed(1), "ms");
  return { shipId: state.shipId, cpuMilliseconds: performance.now() - start, itinerary };
});
const regional = [
  ["marseille", "barcelona"], ["haifa", "ashdod"],
  ["marseille", "haifa"], ["marseille", "ashdod"],
].map(([from, to]) => {
  const state = createVessel("spirit", portById(from)!);
  const plan = planFuelItinerary(world, state, to, weather);
  return { from, to, status: plan.status, stops: plan.legs.map((leg) => leg.arrivalPortId),
    totalDistanceM: plan.totalDistanceM, totalFuelLitres: plan.totalFuelLitres, reason: plan.reason };
});
const origin = { lat: 42, lon: 4 };
const point = destination(origin, Math.PI / 2, 600_000);
const route: Route = { id: "range-probe", name: "Explicit open-water range probe", from: "current", to: "probe",
  points: [origin, point], distance: distance(origin, point), directDistance: distance(origin, point), description: "Not a planned geographic corridor" };
const spirit = createVessel("spirit", origin, bearing(origin, point));
const calm = { ...weather, windSpeed: 0, currentSpeed: 0 };
const rangeEstimate = estimateRouteFuel(spirit, route, calm);
spirit.engine = 1;
const fullFuelPerHour = fuelRate(spirit) * 3600;
const report: Record<string, unknown> = {
  generatedAt: new Date().toISOString(),
  conditions: "35% load; conservative pilot/manual fuel forecasts from calm seed4821, including the shared environmental and manoeuvre allowances; physical passage uses evolving calm; fuel only added while docked at real service stops",
  plans, spiritRegional: regional,
  spiritRange: {
    cruiseSpeedKnots: rangeEstimate.cruiseSpeedKnots,
    rangeBasis: "Conservative shared passage estimate, covering pilot cruise and sustained full-power manual navigation; 25% additional reserve",
    approximateConservativeRangeWithReserveM: 600_000 * spirit.fuel / rangeEstimate.requiredFuelLitres,
    approximateRecordRangeWithReserveM: spirit.fuel / 1.25 / fullFuelPerHour * 511.11 * 1000,
    fullFuelPerHour,
  },
};
mkdirSync("artifacts/planning", { recursive: true });
const persist = () => writeFileSync("artifacts/planning/itinerary-report.json", JSON.stringify(report, null, 2));
persist();
if (process.argv.includes("--sail")) {
  const plan = plans.find((entry) => entry.shipId === "fishing")!.itinerary;
  if (plan.status === "unreachable") throw new Error(plan.reason);
  const state = createVessel("fishing", departure, departure.heading);
  const sim = new Simulation(state, { ...weather }, world);
  sim.requestedScale = 100;
  let collisions = 0;
  sim.onCollision = () => collisions++;
  const actual: Record<string, unknown>[] = [];
  const started = performance.now();
  report.fishingPhysicalPassage = { completed: false, legs: actual };
  for (const [index, leg] of plan.legs.entries()) {
    let refuelledLitres = 0;
    if (leg.refuelBefore) {
      const port = portById(leg.departurePortId!)!;
      if (distance(state, port) > DOCKING_RADIUS_METERS || motion(state, sim.weather).sog > 0.85)
        throw new Error(`Refuelling outside a valid service stop: ${port.id}`);
      state.docked = port.id;
      state.u = state.v = state.yawRate = state.engine = 0;
      state.controls = { throttle: 0, rudder: 0, gear: 0 };
      refuelledLitres = shipById(state.shipId).fuelCapacity - state.fuel;
      state.fuel = shipById(state.shipId).fuelCapacity;
      state.docked = null;
      state.controls.gear = 1;
    }
    const route = routeFromPosition(world, state, leg.arrivalPortId)!;
    sim.voyage = { route, waypoint: 1, autopilot: true, completed: false };
    const startTime = state.simTime, startFuel = state.fuel, startDistance = state.distance;
    while (state.simTime - startTime < Math.max(30_000, leg.estimate.durationSeconds * 2) &&
      !sim.voyage.completed && !collisions && state.fuel > 0)
      sim.advance(1 / 30);
    const entry = {
      index: index + 1, from: leg.departurePortId, to: leg.arrivalPortId,
      completed: sim.voyage.completed, collisions, refuelledLitres,
      durationSeconds: state.simTime - startTime, distanceM: state.distance - startDistance,
      consumedLitres: startFuel - state.fuel, remainingLitres: state.fuel,
      forecastFuelLitres: leg.estimate.estimatedFuelLitres,
      forecastWithReserveLitres: leg.estimate.requiredFuelLitres,
      forecastCoversActual: startFuel - state.fuel <= leg.estimate.estimatedFuelLitres,
      reserveCoversActual: startFuel - state.fuel <= leg.estimate.requiredFuelLitres,
      arrivalDistanceM: distance(state, portById(leg.arrivalPortId)!),
      arrivalSpeedMS: motion(state, sim.weather).sog,
      state: structuredClone(state),
    };
    actual.push(entry); persist(); console.log(JSON.stringify(entry));
    if (!entry.completed || collisions) break;
  }
  report.fishingPhysicalPassage = {
    completed: actual.length === plan.legs.length && sim.voyage?.completed && collisions === 0,
    legs: actual, durationSeconds: state.simTime, distanceM: state.distance,
    cpuMilliseconds: performance.now() - started,
  };
  persist();
}
