import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { shipById } from "../src/data/ships";
import { buildRoute, routeFromPosition } from "../src/geo/routes";
import { worldFromGeoJSON } from "../src/geo/world";
import { createVessel, Simulation } from "../src/sim/engine";
import { estimateRouteFuel } from "../src/sim/routeEstimate";
import { refreshManualRoute, toggleVoyageAutopilot } from "../src/sim/routeNavigation";
import { createWeather } from "../src/sim/weather";

const world = worldFromGeoJSON(JSON.parse(readFileSync(new URL("../public/data/land.geojson", import.meta.url), "utf8")));

describe("fuel-stop insertion after a manual detour", () => {
  it("prepares a reachable Palma stop before Barcelona while preserving past and future stops and all vessel state", () => {
    const point = { lat: 39.370278, lon: 2.354744 };
    expect(world.sweep(point, point, 90).hit).toBe(false);
    const state = createVessel("yacht", point, 2.1, .35), weather = createWeather("calm", 4821);
    state.fuel = estimateRouteFuel(state, routeFromPosition(world, state, "palma")!, weather).requiredFuelLitres * 1.1;
    Object.assign(state, { u: 2.3, v: .17, yawRate: .012, engine: .44, distance: 287_000, simTime: 14_600 });
    state.controls = { throttle: .54, rudder: -.24, gear: 1 };
    const sim = new Simulation(state, weather, world);
    sim.realTime = 100;
    sim.voyage = { route: buildRoute(world, "cassis", "barcelona")!, waypoint: 2, autopilot: false, completed: false,
      itinerary: { destinationId: "cartagena", stopIds: ["cassis", "barcelona", "cartagena"], legIndex: 1, refuelPortId: null } };
    const before = structuredClone(state), voyage = sim.voyage, itinerary = voyage.itinerary!;
    expect(refreshManualRoute(sim, world)).toBe(true);
    expect(itinerary.stopIds).toEqual(["cassis", "barcelona", "cartagena"]);
    expect(estimateRouteFuel(state, voyage.route, weather).status).toBe("insufficient");
    expect(toggleVoyageAutopilot(sim, world).active).toBe(true);
    expect(sim.state).toBe(state);
    expect(state).toEqual(before);
    expect(sim.voyage).toBe(voyage);
    expect(sim.voyage!.itinerary).toBe(itinerary);
    expect(itinerary).toEqual({ destinationId: "cartagena", stopIds: ["cassis", "palma", "barcelona", "cartagena"], legIndex: 1, refuelPortId: null });
    expect(voyage.route.to).toBe("palma");
    expect(voyage.route.points[0]).toEqual({ lat: state.lat, lon: state.lon });
    expect(voyage.waypoint).toBe(1);
    expect(state.fuel).toBeLessThan(shipById(state.shipId).fuelCapacity);
    expect(estimateRouteFuel(state, voyage.route, weather).status).toBe("sufficient");
  }, 15000);
});
