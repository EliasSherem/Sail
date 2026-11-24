/** CPU audit: real vessel integration and real refuelling stops, no teleporting.
 * npx tsx scripts/long-voyage-audit.ts --sail=spirit:marseille:new-york
 */
import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { portById } from "../src/data/ports";
import { shipById } from "../src/data/ships";
import { distance } from "../src/geo/math";
import { worldFromGeoJSON } from "../src/geo/world";
import { createVessel, Simulation, motion } from "../src/sim/engine";
import { createWeather } from "../src/sim/weather";
import { planFuelItinerary } from "../src/sim/itinerary";
import { estimateRouteFuel } from "../src/sim/routeEstimate";
import { installItinerary, hasNextStop, prepareNextLeg } from "../src/sim/voyagePlan";
import type { ShipId } from "../src/types";

const world = worldFromGeoJSON(JSON.parse(readFileSync("public/data/land.geojson", "utf8")));
const weather = createWeather("calm", 4821);
const sail = process.argv.find(v => v.startsWith("--sail="))?.slice(7).split(":") as [ShipId, string, string] | undefined;
const cases: [ShipId, string, string][] = sail ? [sail] :
  (["launch", "yacht", "speedboat", "spirit"] as ShipId[]).flatMap(id => [
    [id, "marseille", "new-york"], [id, "marseille", "haifa"], [id, "acapulco", "los-cabos"], [id, "cancun", "veracruz"],
  ] as [ShipId, string, string][]);
const output = `artifacts/long-voyages/${sail ? sail.join("-") : "plans"}.json`;
mkdirSync("artifacts/long-voyages", { recursive: true });
const report = { passed: false, generatedAt: new Date().toISOString(), cases: [] as any[] };
const persist = () => writeFileSync(output, JSON.stringify(report, null, 2));
try {
  for (const [shipId, from, to] of cases) {
    const origin = portById(from)!, ship = shipById(shipId);
    const state = createVessel(shipId, origin, origin.heading, .35);
    const started = performance.now(), plan = planFuelItinerary(world, state, to, weather);
    assert.equal(plan.status, "feasible", `${shipId} ${from} → ${to}: ${plan.reason}`);
    assert(plan.legs.length > 1, "long journeys require actual refuelling stops");
    const row = { shipId, from, to, planningMs: performance.now() - started,
      distanceKm: plan.totalDistanceM / 1000, stages: plan.legs.map(leg => ({ to: leg.arrivalPortId,
        km: leg.route.distance / 1000, requiredLitres: leg.estimate.requiredFuelLitres,
        availableLitres: leg.estimate.availableFuelLitres, reserveLitres: leg.estimate.reserveLitres })),
      physical: sail ? { completed: false, contacts: 0, legs: [] as any[] } : undefined };
    for (const leg of plan.legs) {
      assert(leg.estimate.requiredFuelLitres <= leg.estimate.availableFuelLitres);
      assert(leg.estimate.availableFuelLitres <= ship.fuelCapacity);
      for (let i = 1; i < leg.route.points.length; i++)
        assert(!world.sweep(leg.route.points[i - 1], leg.route.points[i], 90).hit, "each planned segment is clear");
    }
    report.cases.push(row); persist();
    console.log(JSON.stringify({ shipId, from, to, stages: row.stages.length, km: row.distanceKm, ms: row.planningMs }));
    if (!sail) continue;
    const sim = new Simulation(state, { ...weather }, world);
    sim.requestedScale = 100;
    assert(installItinerary(sim, plan));
    const physical = row.physical!;
    sim.onCollision = () => physical.contacts++;
    for (let index = 0; index < 100; index++) {
      const destinationId = sim.voyage!.route.to;
      const estimate = estimateRouteFuel(state, sim.voyage!.route, sim.weather);
      assert.equal(estimate.status, "sufficient", `fuel verified before ${destinationId}`);
      const before = { time: state.simTime, fuel: state.fuel, distance: state.distance };
      sim.voyage!.autopilot = true;
      while (!sim.voyage!.completed && !physical.contacts && state.fuel > 0 && state.simTime - before.time < Math.max(7200, estimate.durationSeconds * 3))
        sim.advance(1 / 30);
      const consumed = before.fuel - state.fuel;
      const leg = { index, to: destinationId, completed: sim.voyage!.completed, contacts: physical.contacts,
        km: (state.distance - before.distance) / 1000, seconds: state.simTime - before.time,
        consumed, estimate: estimate.estimatedFuelLitres, reserve: estimate.reserveLitres, remaining: state.fuel,
        arrivalM: distance(state, portById(destinationId)!), speedMS: motion(state, sim.weather).sog };
      physical.legs.push(leg); persist(); console.log(JSON.stringify(leg));
      assert(leg.completed && !leg.contacts, `physical arrival at ${destinationId}`);
      assert(consumed <= estimate.estimatedFuelLitres, `forecast covers actual burn toward ${destinationId}`);
      assert(state.fuel >= estimate.reserveLitres, `reserve survives arrival at ${destinationId}`);
      assert(leg.arrivalM <= 1000 && leg.speedMS < .85, "actual docking position and speed required before filling");
      if (!hasNextStop(sim.voyage)) { physical.completed = true; break; }
      const position = { lat: state.lat, lon: state.lon, heading: state.heading };
      state.docked = destinationId; state.u = state.v = state.yawRate = state.engine = 0;
      state.controls = { throttle: 0, rudder: 0, gear: 0 }; state.fuel = ship.fuelCapacity;
      const next = prepareNextLeg(sim, world);
      assert(next.advanced, next.reason || "next stage after real port service");
      assert.deepEqual({ lat: state.lat, lon: state.lon, heading: state.heading }, position, "refill does not teleport");
      state.docked = null;
    }
    assert(physical.completed && sim.voyage!.route.to === to, "entire real journey reaches its final destination");
    persist();
  }
  report.passed = true;
} finally { persist(); }
