import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { portById } from "../src/data/ports";
import { shipById } from "../src/data/ships";
import { destination, distance, toLocal } from "../src/geo/math";
import { worldFromGeoJSON } from "../src/geo/world";
import { parseSave, type SaveGame } from "../src/persistence/save";
import { canPlaceVessel, createVessel, Simulation } from "../src/sim/engine";
import { changeVesselAtPort, vesselChangeAvailability } from "../src/sim/fleet";
import { createWeather } from "../src/sim/weather";
import type { CollisionWorld } from "../src/types";

const port = portById("marseille")!;
const still = { ...createWeather("calm", 4821), windSpeed: 0, currentSpeed: 0 };
const clearWater: CollisionWorld = { clearance: () => 10000, sweep: () => ({ hit: false }) };
const world = worldFromGeoJSON(JSON.parse(readFileSync(new URL("../public/data/land.geojson", import.meta.url), "utf8")));

function fixture(offset = 0) {
  const sim = new Simulation(createVessel("yacht", destination(port, Math.PI, offset), 1.234), { ...still });
  sim.state.simTime = 4321.25;
  sim.state.distance = 87654.32;
  sim.state.controls = { throttle: .3, rudder: .2, gear: 1 };
  sim.state.fuel = 1200;
  sim.state.damage = .1;
  return sim;
}

function addTrip(sim: Simulation, target = "barcelona") {
  const end = portById(target)!;
  sim.voyage = {
    route: { id: "fleet-voyage", name: "Voyage", from: "current", to: target,
      points: [{ lat: sim.state.lat, lon: sim.state.lon }, end], distance: distance(sim.state, end),
      directDistance: distance(sim.state, end), description: "" },
    waypoint: 1, autopilot: true, completed: false,
    itinerary: { destinationId: "cartagena", stopIds: [target, "cartagena"], legIndex: 0, refuelPortId: port.id },
  };
}

describe("fleet changes through nearby port service", () => {
  it("lets a fresh stopped departure dock and select a different ship immediately", () => {
    const sim = fixture();
    expect(sim.state.docked).toBeNull();
    expect(vesselChangeAvailability(sim)).toMatchObject({ allowed: true, needsDocking: true, portId: port.id });
    const previous = structuredClone(sim.state);
    expect(changeVesselAtPort(sim, "speedboat", .55, world)).toEqual({ changed: true });
    expect(sim.state).toMatchObject({ shipId: "speedboat", lat: previous.lat, lon: previous.lon,
      heading: previous.heading, simTime: previous.simTime, distance: previous.distance,
      docked: port.id, load: .55, fuel: shipById("speedboat").fuelCapacity, damage: 0,
      u: 0, v: 0, yawRate: 0, engine: 0, controls: { throttle: 0, rudder: 0, gear: 0 } });
    expect(vesselChangeAvailability(sim)).toMatchObject({ allowed: true, needsDocking: false, portId: port.id });
  });

  it("changes 900 m from the buoy without moving or dropping the active itinerary", () => {
    const sim = fixture(900);
    addTrip(sim);
    const previous = structuredClone(sim.state), voyage = sim.voyage!, itinerary = voyage.itinerary!, route = voyage.route;
    expect(distance(sim.state, port)).toBeCloseTo(900, 5);
    expect(changeVesselAtPort(sim, "speedboat", .35, world)).toEqual({ changed: true });
    expect(sim.state.lat).toBe(previous.lat);
    expect(sim.state.lon).toBe(previous.lon);
    expect(sim.state.heading).toBe(previous.heading);
    expect(distance(sim.state, port)).toBeCloseTo(900, 5);
    expect(sim.voyage).toBe(voyage);
    expect(sim.voyage!.route).toBe(route);
    expect(sim.voyage!.itinerary).toBe(itinerary);
    expect(sim.voyage).toMatchObject({ autopilot: false, completed: false,
      itinerary: { destinationId: "cartagena", stopIds: ["barcelona", "cartagena"], legIndex: 0, refuelPortId: null } });
  });

  it("marks only the current arrival complete and retains later stops", () => {
    const sim = fixture(400);
    addTrip(sim, port.id);
    const voyage = sim.voyage, itinerary = sim.voyage!.itinerary;
    expect(changeVesselAtPort(sim, "launch", .2, world).changed).toBe(true);
    expect(sim.voyage).toBe(voyage);
    expect(sim.voyage!.itinerary).toBe(itinerary);
    expect(sim.voyage).toMatchObject({ completed: true, autopilot: false,
      itinerary: { stopIds: [port.id, "cartagena"], legIndex: 0, refuelPortId: null } });
  });

  it.each(["outside", "invalid-mooring", "distant-mooring", "fast", "current"] as const)(
    "rejects a %s change before modifying hull, fuel, pose or voyage", condition => {
      const sim = fixture(condition === "outside" ? 1001 : 0);
      addTrip(sim);
      if (condition === "invalid-mooring") sim.state.docked = "unknown-port";
      if (condition === "distant-mooring") sim.state.docked = "cassis";
      if (condition === "fast") sim.state.u = 1;
      if (condition === "current") sim.weather.currentSpeed = .9;
      const before = structuredClone({ state: sim.state, voyage: sim.voyage });
      expect(vesselChangeAvailability(sim).allowed).toBe(false);
      expect(changeVesselAtPort(sim, "speedboat", .35, clearWater).changed).toBe(false);
      expect({ state: sim.state, voyage: sim.voyage }).toEqual(before);
    },
  );

  it("allows an already moored vessel in a current and servicing the same hull", () => {
    const sim = fixture(500);
    sim.state.docked = port.id;
    sim.weather.currentSpeed = 2;
    expect(vesselChangeAvailability(sim)).toMatchObject({ allowed: true, needsDocking: false });
    expect(changeVesselAtPort(sim, "yacht", .8, clearWater).changed).toBe(true);
    expect(sim.state).toMatchObject({ shipId: "yacht", load: .8, docked: port.id, damage: 0, fuel: shipById("yacht").fuelCapacity });
  });

  it("rejects an oversized hull beside shore instead of teleporting it to the buoy", () => {
    const sim = fixture();
    sim.state.heading = Math.PI / 2;
    addTrip(sim);
    const shore: CollisionWorld = {
      clearance: point => Math.max(0, 40 - toLocal(point, port).x),
      sweep: (from, to, radius) => ({ hit: Math.max(toLocal(from, port).x, toLocal(to, port).x) + radius >= 40, kind: "land" }),
    };
    expect(canPlaceVessel(sim.state, shore)).toBe(true);
    expect(vesselChangeAvailability(sim, shore).allowed).toBe(true);
    const before = structuredClone({ state: sim.state, voyage: sim.voyage });
    expect(changeVesselAtPort(sim, "cargo", .35, shore)).toMatchObject({ changed: false, reason: expect.stringContaining("casco") });
    expect({ state: sim.state, voyage: sim.voyage }).toEqual(before);
  });

  it("preserves the newly selected boat and navigation through saving", () => {
    const sim = fixture(900);
    addTrip(sim);
    expect(changeVesselAtPort(sim, "speedboat", .35, world).changed).toBe(true);
    const save: SaveGame = {
      version: 1, savedAt: "2026-09-26T21:00:00Z", state: sim.state, sea: "calm", seed: 4821,
      routeTarget: sim.voyage!.route.to, itinerary: sim.voyage!.itinerary,
      routeCompleted: sim.voyage!.completed, autopilot: sim.voyage!.autopilot,
      mission: "free", quality: "high", camera: "follow", tutorialComplete: true,
    };
    expect(parseSave(JSON.stringify(save))).toEqual(save);
    expect(parseSave(JSON.stringify(save))?.state.shipId).toBe("speedboat");
  });
});
