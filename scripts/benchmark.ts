import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { compareShips, TEST_WEATHER } from "../src/sim/benchmark";
import { createVessel, Simulation } from "../src/sim/engine";
import { worldFromGeoJSON } from "../src/geo/world";
import { buildRoute } from "../src/geo/routes";
import { PORTS } from "../src/data/ports";
import { distance } from "../src/geo/math";
import { createWeather } from "../src/sim/weather";

const world = worldFromGeoJSON(
  JSON.parse(
    readFileSync(
      new URL("../public/data/land.geojson", import.meta.url),
      "utf8",
    ),
  ),
);
console.table(
  compareShips().map((row) => ({
    barco: row.name,
    "nudos tras 60 s": row.speedAfter60SecondsKnots.toFixed(2),
    "freno desde 6 m/s (m)": row.fullAsternStopFrom6MpsMeters.toFixed(1),
    "freno (s)": row.fullAsternStopFrom6MpsSeconds.toFixed(1),
    "giro en 10 s (°)": row.turnAfter10SecondsDegrees.toFixed(2),
    "consumo en 60 s (L)": row.fuelUsedIn60SecondsLitres.toFixed(2),
  })),
);
const vessel = createVessel("cargo", { lat: 42, lon: 4 }, 0, 0.35);
vessel.controls = { throttle: 1, rudder: 0.1, gear: 1 };
const simulation = new Simulation(vessel, TEST_WEATHER, world);
simulation.evolvingWeather = false;
simulation.requestedScale = 100;
const started = performance.now();
for (let frame = 0; frame < 60 * 5; frame++) simulation.advance(1 / 60);
const elapsed = performance.now() - started;
console.log(
  JSON.stringify(
    {
      environment:
        "Node.js; real bundled Natural Earth collision world; rendering excluded",
      simulatedSeconds: +vessel.simTime.toFixed(2),
      fixedSteps: Math.round(vessel.simTime * 30),
      elapsedMilliseconds: +elapsed.toFixed(2),
      millisecondsPer100xFrame: +(elapsed / 300).toFixed(3),
      activeScale: simulation.activeScale,
    },
    null,
    2,
  ),
);

if (process.argv.includes("--routes")) {
  const departure = PORTS.find((port) => port.id === "marseille")!;
  const longTrip = process.argv.includes("--long");
  const target = PORTS.find(
    (port) => port.id === (longTrip ? "barcelona" : "cassis"),
  )!;
  const route = buildRoute(world, departure.id, target.id);
  if (!route) throw new Error("The requested route could not be validated");
  for (const id of (longTrip ? ["fishing", "cargo"] : ["launch", "cargo"]) as (
    | "launch"
    | "fishing"
    | "cargo"
  )[]) {
    const boat = createVessel(id, departure, departure.heading);
    const evolving = process.argv.includes("--weather");
    const sim = new Simulation(
      boat,
      evolving ? createWeather("calm", 4821) : TEST_WEATHER,
      world,
    );
    sim.evolvingWeather = evolving;
    sim.voyage = { route, waypoint: 1, completed: false, autopilot: true };
    let collisions = 0;
    sim.onCollision = () => collisions++;
    const clock = performance.now();
    for (
      let i = 0;
      i < (longTrip ? 100000 : 18000) && !sim.voyage.completed && !collisions;
      i++
    )
      sim.advance(1);
    console.log(
      JSON.stringify(
        {
          route: route.name,
          ship: id,
          completed: sim.voyage.completed,
          waypoint: sim.voyage.waypoint,
          totalWaypoints: route.points.length,
          simulatedSeconds: boat.simTime,
          remainingMeters: distance(boat, target),
          fuelLeft: boat.fuel,
          collisions,
          elapsedMilliseconds: performance.now() - clock,
          weather: evolving ? "evolving calm / seed 4821" : "still",
        },
        null,
        2,
      ),
    );
    if (!sim.voyage.completed || collisions) process.exitCode = 1;
  }
}
