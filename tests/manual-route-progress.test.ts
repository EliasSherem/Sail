import { describe, expect, it } from "vitest";
import { destination, distance } from "../src/geo/math";
import { createVessel, remainingDistance, Simulation } from "../src/sim/engine";
import { manualWaypointIndex, updateManualRouteProgress } from "../src/sim/routeProgress";
import { TEST_WEATHER } from "../src/sim/benchmark";
import type { LatLon, Route, Voyage } from "../src/types";

const origin = { lat: 0, lon: 0 };
const east = (meters: number, start: LatLon = origin) => destination(start, Math.PI / 2, meters);
function route(points: LatLon[], id = "current-stage"): Route {
  return { id, name: id, from: "departure", to: "next-port", points,
    distance: points.reduce((sum, p, i) => sum + (i ? distance(points[i - 1], p) : 0), 0),
    directDistance: points.length ? distance(points[0], points.at(-1)!) : 0,
    description: "Explicit manual-navigation fixture" };
}
function voyage(points: LatLon[], waypoint = 1): Voyage {
  return { route: route(points), waypoint, autopilot: false, completed: false };
}
function simulation(ship: "launch" | "spirit" = "launch") {
  const state = createVessel(ship, origin, Math.PI / 2);
  state.u = ship === "spirit" ? 142 : 12;
  state.engine = 1;
  state.controls = { throttle: 1, rudder: 0, gear: 1 };
  const sim = new Simulation(state, { ...TEST_WEATHER });
  sim.evolvingWeather = false;
  return sim;
}

describe("manual progress and remaining distance of the active stage", () => {
  it("advances intermediate points during real manual driving without changing physical motion or controls", () => {
    const sim = simulation(), reference = simulation();
    sim.voyage = voyage([origin, east(100), east(300), east(600), east(1000)], 0);
    let before = remainingDistance(sim.state, sim.voyage);
    for (let frame = 0; frame < 40 * 30; frame++) {
      sim.advance(1 / 30);
      reference.advance(1 / 30);
      const now = remainingDistance(sim.state, sim.voyage);
      expect(now).toBeLessThanOrEqual(before + 1e-5);
      before = now;
    }
    expect(sim.voyage.waypoint).toBeGreaterThan(1);
    expect(sim.voyage.autopilot).toBe(false);
    expect(sim.state).toEqual(reference.state);
    expect(remainingDistance(sim.state, sim.voyage)).toBeCloseTo(1000 - sim.state.distance, 4);
  });

  it("recovers a passed first segment without adding the departure or mutating the vessel", () => {
    const state = createVessel("launch", east(1500));
    const trip = voyage([origin, east(1000), east(2000), east(3000)], 0);
    trip.itinerary = { destinationId: "final-port", stopIds: ["next-port", "final-port"], legIndex: 0, refuelPortId: null };
    const before = structuredClone(state), itinerary = structuredClone(trip.itinerary);
    // The pure display calculation is also correct before the next physics step.
    expect(remainingDistance(state, trip)).toBeCloseTo(1500, 5);
    expect(trip.waypoint).toBe(0);
    updateManualRouteProgress(state, trip);
    expect(trip.waypoint).toBe(2);
    expect(state).toEqual(before);
    expect(trip.itinerary).toEqual(itinerary);
    expect(trip.completed).toBe(false);
  });

  it("allows a close parallel overrun but refuses to project distant off-route travel forward", () => {
    const points = [origin, east(1000), east(2000), east(3000)];
    const close = createVessel("launch", destination(east(1500), 0, 50));
    const far = createVessel("launch", destination(east(1500), 0, 5000));
    const closeTrip = voyage(points), farTrip = voyage(points);
    updateManualRouteProgress(close, closeTrip);
    updateManualRouteProgress(far, farTrip);
    expect(closeTrip.waypoint).toBe(2);
    expect(farTrip.waypoint).toBe(1);
    expect(remainingDistance(far, farTrip)).toBeCloseTo(distance(far, points[1]) + 2000, 4);
  });

  it("does not jump a bend or a future stage merely because a later point is nearby", () => {
    const first = east(1000), corner = destination(first, 0, 1000), final = east(1000, corner);
    const state = createVessel("launch", east(2500));
    const trip = voyage([origin, first, corner, final]);
    updateManualRouteProgress(state, trip);
    expect(trip.waypoint).toBe(2);
    expect(remainingDistance(state, trip)).toBeCloseTo(distance(state, corner) + distance(corner, final), 5);
  });

  it("captures and passes points across the antimeridian using the short geodesic arc", () => {
    const start = { lat: 10, lon: 179.995 };
    const points = [start, east(250, start), east(750, start), east(1500, start)];
    const state = createVessel("launch", east(1000, start));
    expect(state.lon).toBeLessThan(0);
    const trip = voyage(points);
    updateManualRouteProgress(state, trip);
    expect(trip.waypoint).toBe(3);
    expect(remainingDistance(state, trip)).toBeCloseTo(500, 4);
  });

  it("processes all physically crossed intermediate points at 100× and matches 1×", () => {
    const normal = simulation("spirit"), accelerated = simulation("spirit");
    // Keep the final port outside the intentional high-speed arrival slowdown.
    const points = [0, 100, 200, 350, 500, 900, 1000, 30000].map((meters) => east(meters));
    normal.voyage = voyage(points);
    accelerated.voyage = voyage(structuredClone(points));
    accelerated.requestedScale = 100;
    for (let frame = 0; frame < 100; frame++) normal.advance(1 / 30);
    accelerated.advance(1 / 30);
    expect(accelerated.state.distance).toBeGreaterThan(450);
    expect(accelerated.voyage.waypoint).toBeGreaterThanOrEqual(4);
    expect(accelerated.state).toEqual(normal.state);
    expect(accelerated.voyage.waypoint).toBe(normal.voyage.waypoint);
    expect(remainingDistance(accelerated.state, accelerated.voyage)).toBeCloseTo(30000 - accelerated.state.distance, 4);
  });

  it("new stage progress starts at its own anchor and never sums completed or future stages", () => {
    const sim = simulation();
    sim.voyage = voyage([origin, east(100), east(1000)]);
    for (let frame = 0; frame < 30 * 30; frame++) sim.advance(1 / 30);
    const stateBefore = structuredClone(sim.state);
    sim.voyage.completed = true;
    expect(remainingDistance(sim.state, sim.voyage)).toBe(0);
    const current = { lat: sim.state.lat, lon: sim.state.lon };
    sim.voyage = voyage([current, east(200, current), east(500, current)]);
    sim.voyage.itinerary = { destinationId: "distant-final-port", stopIds: ["finished-port", "next-port", "distant-final-port"], legIndex: 1, refuelPortId: null };
    updateManualRouteProgress(sim.state, sim.voyage);
    expect(sim.voyage.waypoint).toBe(1);
    expect(sim.voyage.itinerary.legIndex).toBe(1);
    expect(remainingDistance(sim.state, sim.voyage)).toBeCloseTo(500, 5);
    expect(sim.state).toEqual(stateBefore);
  });

  it("keeps a passed final port as the active destination until explicit completion", () => {
    const state = createVessel("launch", east(1500));
    const trip = voyage([origin, east(500), east(1000)]);
    updateManualRouteProgress(state, trip);
    expect(trip.waypoint).toBe(2);
    expect(trip.completed).toBe(false);
    expect(remainingDistance(state, trip)).toBeCloseTo(500, 5);
    trip.completed = true;
    expect(remainingDistance(state, trip)).toBe(0);
  });

  it("does not change automatic progress, paused indices or empty/completed voyages", () => {
    const sim = simulation();
    const trip = voyage([origin, east(100), east(1000)], 0);
    trip.autopilot = true;
    updateManualRouteProgress(sim.state, trip);
    expect(trip.waypoint).toBe(0);
    trip.autopilot = false;
    sim.voyage = trip;
    sim.paused = true;
    const before = structuredClone({ state: sim.state, voyage: sim.voyage });
    sim.advance(10);
    expect({ state: sim.state, voyage: sim.voyage }).toEqual(before);
    expect(remainingDistance(sim.state, voyage([]))).toBe(0);
    expect(remainingDistance(sim.state, null)).toBe(0);
    const duplicate = voyage([origin, origin, east(1000)], 0);
    expect(manualWaypointIndex(sim.state, duplicate)).toBe(2);
  });
});
