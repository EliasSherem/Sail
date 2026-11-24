import { SHIPS } from "../data/ships";
import { toKnots } from "../geo/math";
import type { ShipId, Weather } from "../types";
import { createVessel, FIXED_DT, stepVessel } from "./engine";

export interface ShipComparison {
  shipId: ShipId;
  name: string;
  speedAfter60SecondsKnots: number;
  fullAsternStopFrom6MpsMeters: number;
  fullAsternStopFrom6MpsSeconds: number;
  turnAfter10SecondsDegrees: number;
  fuelUsedIn60SecondsLitres: number;
}

export const TEST_WEATHER: Weather = {
  sea: "calm",
  seed: 4821,
  windSpeed: 0,
  windDirection: 0,
  currentSpeed: 0,
  currentDirection: 0,
  waveHeight: 0.35,
  visibility: 25000,
};

/** Reproducible comparison: 35% load, no wind/current, same initial speed for turning/stopping. */
export function compareShips(): ShipComparison[] {
  return SHIPS.map((ship) => {
    const accelerating = createVessel(ship.id, { lat: 42, lon: 4 }, 0, 0.35);
    for (let i = 0; i < 60 / FIXED_DT; i++)
      stepVessel(accelerating, TEST_WEATHER, FIXED_DT, undefined, {
        throttle: 1,
        rudder: 0,
        gear: 1,
      });
    const stopping = createVessel(ship.id, { lat: 42, lon: 4 }, 0, 0.35);
    stopping.u = 6;
    stopping.engine = 1;
    while (stopping.u > 0 && stopping.simTime < 1800)
      stepVessel(stopping, TEST_WEATHER, FIXED_DT, undefined, {
        throttle: 1,
        rudder: 0,
        gear: -1,
      });
    const turning = createVessel(ship.id, { lat: 42, lon: 4 }, 0, 0.35);
    turning.u = 6;
    turning.engine = 1;
    for (let i = 0; i < 10 / FIXED_DT; i++)
      stepVessel(turning, TEST_WEATHER, FIXED_DT, undefined, {
        throttle: 1,
        rudder: 1,
        gear: 1,
      });
    return {
      shipId: ship.id,
      name: ship.name,
      speedAfter60SecondsKnots: toKnots(accelerating.u),
      fullAsternStopFrom6MpsMeters: stopping.distance,
      fullAsternStopFrom6MpsSeconds: stopping.simTime,
      turnAfter10SecondsDegrees: (turning.heading * 180) / Math.PI,
      fuelUsedIn60SecondsLitres: ship.fuelCapacity - accelerating.fuel,
    };
  });
}
