/** Navigate the real fixed-step simulation across Drake, with actual port service.
 * npx tsx scripts/drake-voyage-audit.ts [--to=fildes-bay|port-lockroy]
 * No position shortcuts, fuel changes at sea, or browser/GPU are used.
 */
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { portById } from "../src/data/ports";
import { shipById } from "../src/data/ships";
import { distance } from "../src/geo/math";
import { worldFromGeoJSON } from "../src/geo/world";
import { createVessel, motion, Simulation } from "../src/sim/engine";
import { planFuelItinerary } from "../src/sim/itinerary";
import { DOCKING_RADIUS_METERS } from "../src/sim/navigationConstants";
import { estimateRouteFuel } from "../src/sim/routeEstimate";
import { hasNextStop, installItinerary, prepareNextLeg } from "../src/sim/voyagePlan";
import { createWeather } from "../src/sim/weather";

const destinationId = process.argv.find(arg => arg.startsWith("--to="))?.slice(5) ?? "port-lockroy";
assert(["fildes-bay", "port-lockroy"].includes(destinationId), "choose an Antarctic destination");
const output = `artifacts/drake/fishing-ushuaia-${destinationId}.json`;
mkdirSync("artifacts/drake", { recursive: true });
const world = worldFromGeoJSON(JSON.parse(readFileSync("public/data/land.geojson", "utf8")));
const departure = portById("ushuaia")!, arrival = portById(destinationId)!;
assert(departure && arrival, "generate the southern port network before running this audit");
const ship = shipById("fishing"), state = createVessel(ship.id, departure, departure.heading, .35);
const sim = new Simulation(state, createWeather("calm", 4821), world);
const started = performance.now();
const plan = planFuelItinerary(world, state, destinationId, sim.weather);
const report = {
  passed: false, generatedAt: new Date().toISOString(), from: departure.id, to: arrival.id, shipId: ship.id,
  tankLitres: ship.fuelCapacity, planningMs: performance.now() - started,
  plannedKm: plan.totalDistanceM / 1000,
  planStatus: plan.status, planReason: plan.reason,
  stages: plan.legs.map(leg => ({ from: leg.departurePortId, to: leg.arrivalPortId,
    km: leg.route.distance / 1000, requiredLitres: leg.estimate.requiredFuelLitres,
    availableLitres: leg.estimate.availableFuelLitres, reserveLitres: leg.estimate.reserveLitres,
    refuelBefore: leg.refuelBefore })),
  contacts: 0, crossedDrake: false, completed: false, refuels: [] as string[],
  legs: [] as { to: string; completed: boolean; km: number; seconds: number; consumedLitres: number;
    forecastLitres: number; reserveLitres: number; remainingLitres: number; arrivalM: number; speedMS: number }[],
  error: undefined as string | undefined, elapsedMs: 0,
};
const persist = () => { report.elapsedMs = performance.now() - started; writeFileSync(output, JSON.stringify(report, null, 2)); };
sim.onCollision = () => report.contacts++;
try {
  assert.equal(plan.status, "feasible", plan.reason);
  assert(plan.legs.length > 0);
  for (const leg of plan.legs) {
    assert(leg.estimate.requiredFuelLitres <= leg.estimate.availableFuelLitres);
    for (let i = 1; i < leg.route.points.length; i++)
      assert(!world.sweep(leg.route.points[i - 1], leg.route.points[i], 90).hit, "planned segment crosses land");
  }
  assert(installItinerary(sim, plan));
  sim.requestedScale = 1000;
  persist();
  console.log(JSON.stringify({ phase: "planned", stages: report.stages, planningMs: report.planningMs }));
  let lastProgress = performance.now();
  for (let index = 0; index < 100; index++) {
    const targetId = sim.voyage!.route.to, target = portById(targetId)!;
    const estimate = estimateRouteFuel(state, sim.voyage!.route, sim.weather);
    assert.equal(estimate.status, "sufficient", `fuel before ${targetId}`);
    const before = { time: state.simTime, fuel: state.fuel, distance: state.distance };
    sim.voyage!.autopilot = true;
    while (!sim.voyage!.completed && !report.contacts && state.fuel > 0 &&
      state.simTime - before.time < Math.max(7200, estimate.durationSeconds * 3)) {
      sim.advance(1 / 30);
      if (state.lat < -58 && state.lat > -60 && state.lon > -70 && state.lon < -50) report.crossedDrake = true;
      if (performance.now() - lastProgress > 10_000) {
        console.log(JSON.stringify({ phase: "sailing", to: targetId, lat: state.lat, lon: state.lon,
          distanceKm: state.distance / 1000, fuelLitres: state.fuel, simHours: state.simTime / 3600 }));
        lastProgress = performance.now();
      }
    }
    const leg = { to: targetId, completed: sim.voyage!.completed,
      km: (state.distance - before.distance) / 1000, seconds: state.simTime - before.time,
      consumedLitres: before.fuel - state.fuel, forecastLitres: estimate.estimatedFuelLitres,
      reserveLitres: estimate.reserveLitres, remainingLitres: state.fuel,
      arrivalM: distance(state, target), speedMS: motion(state, sim.weather).sog };
    report.legs.push(leg); persist(); console.log(JSON.stringify({ phase: "arrival", ...leg }));
    assert(leg.completed && report.contacts === 0, `physical arrival without collision: ${targetId}`);
    assert(leg.consumedLitres <= estimate.estimatedFuelLitres, `forecast covers burn: ${targetId}`);
    assert(state.fuel >= estimate.reserveLitres, `arrival reserve: ${targetId}`);
    assert(leg.arrivalM <= DOCKING_RADIUS_METERS && leg.speedMS < .85, "docking requires proximity and low speed");
    if (!hasNextStop(sim.voyage)) { report.completed = true; break; }
    const actualPosition = { lat: state.lat, lon: state.lon, heading: state.heading };
    state.docked = targetId;
    state.u = state.v = state.yawRate = state.engine = 0;
    state.controls = { throttle: 0, rudder: 0, gear: 0 };
    state.fuel = ship.fuelCapacity;
    report.refuels.push(targetId);
    const next = prepareNextLeg(sim, world);
    assert(next.advanced, next.reason ?? "advance only after real refuelling stop");
    assert.deepEqual({ lat: state.lat, lon: state.lon, heading: state.heading }, actualPosition, "port service does not teleport");
    state.docked = null;
    persist();
  }
  assert(report.completed && sim.voyage!.route.to === destinationId, "complete Antarctic voyage");
  assert(report.crossedDrake, "boat physically crossed Drake");
  report.passed = true;
} catch (error) {
  report.error = error instanceof Error ? error.message : String(error);
  throw error;
} finally { persist(); }
console.log(JSON.stringify({ passed: report.passed, output, elapsedMs: report.elapsedMs }));
