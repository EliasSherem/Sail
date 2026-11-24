import { shipById } from "../data/ships";
import { bearing, destination, distance } from "../geo/math";
import type {
  CollisionResult,
  CollisionWorld,
  Controls,
  LatLon,
  Motion,
  ShipConfig,
  ShipId,
  VesselState,
  Voyage,
  Weather,
} from "../types";
import { weatherAt } from "./weather";
import { harborDepartureError } from "./harborDeparture";
import { manualWaypointIndex, updateManualRouteProgress } from "./routeProgress";
import { DOCKING_RADIUS_METERS } from "./navigationConstants";
import { DEFAULT_DAY_LENGTH_SECONDS, initializeDaylight } from "./daylight";

export const FIXED_DT = 1 / 30;
/** Shared by the helm and the fixed-step simulator. */
export const TIME_SCALES = [1, 5, 20, 100, 1000] as const;
const timeScales = new Set<number>(TIME_SCALES);
const MAX_STEPS_PER_ADVANCE = 10_000;
const TAU = Math.PI * 2;
const clamp = (n: number, low: number, high: number) =>
  Math.max(low, Math.min(high, n));
const angle = (n: number) => Math.atan2(Math.sin(n), Math.cos(n));
// Forward flow over the hull resists sideslip even when lateral velocity is
// small. This adds only dissipative lateral force; it never points the vessel
// or redirects its velocity instantaneously. Larger values suit planing craft.
const lateralFlowGrip: Record<ShipId, number> = {
  launch: 1.1,
  fishing: 0.25,
  yacht: 0.6,
  tug: 0.14,
  cargo: 0.06,
  spirit: 0.32,
  speedboat: 0.9,
};
const steeringFlow: Record<ShipId, number> = {
  launch: 13.6032, fishing: 7.5591, yacht: 11.5942,
  tug: 5.5172, cargo: 9.5808, spirit: 13.1, speedboat: 18,
};
const worldClearance = new WeakMap<
  CollisionWorld,
  { origin: LatLon; clearance: number }
>();

/** Game approximations of planing resistance and the broad transom moving astern. */
function surgeDragCoefficient(ship: ShipConfig, speed: number): number {
  return (
    ship.dragLong +
    (ship.id === "spirit" ? 36 / (1 + (Math.abs(speed) / 10) ** 4) : 0) +
    // The offshore hull planes bow-first only. The immersed transom provides
    // drag in reverse, retaining firm braking without 150 km/h astern travel.
    (ship.id === "speedboat" && speed < 0 ? 600 : 0)
  );
}

/** Static-world broad phase: distance travelled can only reduce clearance by that distance. */
function conservativeClearance(world: CollisionWorld, point: LatLon): number {
  let cache = worldClearance.get(world);
  let offset = cache ? distance(point, cache.origin) : Infinity;
  if (!cache || offset > Math.max(10, Math.min(5000, cache.clearance * 0.25))) {
    cache = {
      origin: { lat: point.lat, lon: point.lon },
      clearance: world.clearance(point),
    };
    worldClearance.set(world, cache);
    offset = 0;
  }
  // Margin covers local projection error and coast segmentation, making this a lower bound in the demo.
  return Math.max(0, cache.clearance * 0.99 - offset - 10);
}

export function createVessel(
  shipId: ShipId,
  position: LatLon,
  heading = 0,
  load = 0.35,
): VesselState {
  return {
    lat: position.lat,
    lon: position.lon,
    shipId,
    heading: ((heading % TAU) + TAU) % TAU,
    u: 0,
    v: 0,
    yawRate: 0,
    engine: 0,
    fuel: shipById(shipId).fuelCapacity,
    damage: 0,
    load: clamp(load, 0, 1),
    simTime: 0,
    distance: 0,
    controls: { throttle: 0, rudder: 0, gear: 0 },
    docked: null,
  };
}

export function motion(state: VesselState, weather: Weather): Motion {
  if (state.docked)
    return { east: 0, north: 0, sog: 0, stw: 0, course: state.heading };
  const east =
    state.u * Math.sin(state.heading) +
    state.v * Math.cos(state.heading) +
    weather.currentSpeed * Math.sin(weather.currentDirection);
  const north =
    state.u * Math.cos(state.heading) -
    state.v * Math.sin(state.heading) +
    weather.currentSpeed * Math.cos(weather.currentDirection);
  return {
    east,
    north,
    sog: Math.hypot(east, north),
    stw: Math.hypot(state.u, state.v),
    course: (Math.atan2(east, north) + TAU) % TAU,
  };
}

/** Fuel litres/second. More load raises both resistance and consumption at a given shaft setting. */
export function fuelRate(state: VesselState): number {
  if (state.fuel <= 0 || state.docked) return 0;
  const ship = shipById(state.shipId);
  const engine = Number.isFinite(state.engine) ? clamp(state.engine, 0, 1) : 0;
  // The jet keeps a substantial idle flow and a linear throttle approximation;
  // the propeller archetypes retain their original shaft-power fuel curve.
  const fuelPower = ship.id === "spirit" ? engine : engine ** 2.35;
  return (
    (ship.fuelIdle + (ship.fuelFull - ship.fuelIdle) * fuelPower) *
    (0.88 + 0.34 * state.load)
  );
}

/** Current-condition estimate; null at very low power or speed, where extrapolation is misleading. */
export function estimatedRange(
  state: VesselState,
  weather: Weather,
): number | null {
  const velocity = motion(state, weather);
  const rate = fuelRate(state);
  return rate > 0 && state.engine > 0.1 && velocity.sog > 0.5
    ? (state.fuel / rate) * velocity.sog
    : null;
}

function hullSweep(
  state: VesselState,
  next: LatLon,
  nextHeading: number,
  world: CollisionWorld,
): CollisionResult {
  const ship = shipById(state.shipId);
  const hullRadius = Math.hypot(ship.length, ship.beam) / 2;
  if (
    conservativeClearance(world, state) >
    hullRadius + distance(state, next) + 1
  )
    return { hit: false };
  // A chain of overlapping discs covers the complete hull, including its ends. Each disc is swept continuously.
  const radius = ship.beam * 0.52;
  const half = Math.max(0, ship.length / 2 - radius);
  const count = Math.max(2, Math.ceil((half * 2) / (radius * 1.4)));
  for (let i = 0; i <= count; i++) {
    const offset = -half + (half * 2 * i) / count;
    const from = destination(
      state,
      state.heading + (offset < 0 ? Math.PI : 0),
      Math.abs(offset),
    );
    const to = destination(
      next,
      nextHeading + (offset < 0 ? Math.PI : 0),
      Math.abs(offset),
    );
    const result = world.sweep(from, to, radius);
    if (result.hit) return result;
  }
  return { hit: false };
}

/** Validate the entire hull when restoring a save or placing a different-sized vessel. */
export function canPlaceVessel(
  state: VesselState,
  world: CollisionWorld,
): boolean {
  return !hullSweep(state, state, state.heading, world).hit;
}

/** Mutates only the physical state. Body velocities are relative to water; headings increase clockwise. */
export function stepVessel(
  state: VesselState,
  weather: Weather,
  dt: number,
  world?: CollisionWorld,
  controls: Controls = state.controls,
): CollisionResult {
  if (!(dt > 0) || !Number.isFinite(dt)) return { hit: false };
  if (dt > FIXED_DT + 1e-8) {
    let hit: CollisionResult = { hit: false };
    for (let left = dt; left > 1e-9; left -= FIXED_DT) {
      const result = stepVessel(
        state,
        weather,
        Math.min(left, FIXED_DT),
        world,
        controls,
      );
      if (result.hit) hit = result;
    }
    return hit;
  }
  state.simTime += dt;
  state.controls = {
    throttle: clamp(controls.throttle, 0, 1),
    rudder: clamp(controls.rudder, -1, 1),
    gear: controls.gear,
  };
  if (state.docked) {
    state.u = 0;
    state.v = 0;
    state.yawRate = 0;
    state.engine = 0;
    return { hit: false };
  }
  const ship = shipById(state.shipId);
  const mass = ship.emptyMass + ship.maxLoad * state.load;
  const surgeMass = mass * 1.06;
  const swayMass = mass * 1.7;
  const inertia =
    mass * (ship.length ** 2 + ship.beam ** 2) * ship.inertiaFactor;
  const loadDrag = 1 + state.load * 0.3;
  const targetEngine = state.fuel > 0 ? state.controls.throttle : 0;
  // Protect the integrator boundary: a legacy signed engine value cannot enter fractional power curves.
  state.engine = Number.isFinite(state.engine) ? clamp(state.engine, 0, 1) : 0;
  state.engine +=
    (targetEngine - state.engine) * (1 - Math.exp(-dt / ship.engineResponse));
  const thrust =
    state.fuel > 0
      ? ship.maxThrust *
        state.engine ** 1.25 *
        state.controls.gear *
        (state.controls.gear < 0 ? ship.reverseFactor : 1) *
        (1 - state.damage * 0.65)
      : 0;

  const ground = motion(state, weather);
  const relativeWindE =
    weather.windSpeed * Math.sin(weather.windDirection) - ground.east;
  const relativeWindN =
    weather.windSpeed * Math.cos(weather.windDirection) - ground.north;
  const windU =
    relativeWindE * Math.sin(state.heading) +
    relativeWindN * Math.cos(state.heading);
  const windV =
    relativeWindE * Math.cos(state.heading) -
    relativeWindN * Math.sin(state.heading);
  const windForceU =
    0.5 * 1.225 * ship.windArea * 0.22 * windU * Math.abs(windU);
  const windForceV = 0.5 * 1.225 * ship.windArea * windV * Math.abs(windV);

  // Real water flow determines rudder direction. Explicit propwash adds authority only with shaft thrust.
  // Rudder authority rises out of rest, then tends to a bounded yaw rate.
  // At the same helm angle, radius grows with speed instead of staying almost
  // fixed. These reference flows preserve each hull's normal-speed handling.
  const waterFlow = state.u * (Math.abs(state.u) + .35) *
    steeringFlow[ship.id] / (Math.abs(state.u) + 2);
  const propwash =
    ((ship.propWash * Math.abs(thrust)) / ship.maxThrust) * Math.sign(thrust);
  const rudderForce =
    ship.rudderAuthority *
    (waterFlow + propwash) *
    state.controls.rudder;
  const differential =
    Math.abs(thrust) *
    ship.beam *
    ship.differentialThrust *
    state.controls.rudder;
  const yawTorque =
    rudderForce * ship.length * 0.42 +
    differential +
    windForceV * ship.length * 0.035;
  const yawResistance =
    ship.yawDamping *
    (0.35 + Math.abs(state.u) + ship.length * Math.abs(state.yawRate));
  state.yawRate =
    (state.yawRate + (yawTorque / inertia) * dt) /
    (1 + (yawResistance / inertia) * dt);

  // Semi-implicit dissipation stays positive. The exact body-frame rotation below cannot add kinetic energy.
  // Three-point planing reduces wetted resistance progressively. The displacement
  // term also keeps the fictional 312 N docking thruster below 3 m/s in reverse.
  // All coefficients are calibrated gameplay values; this is not a lift/CFD model.
  const surgeDrag = surgeDragCoefficient(ship, state.u);
  let nextU =
    (state.u + ((thrust + windForceU) / surgeMass) * dt) /
    (1 +
      ((surgeDrag * loadDrag * (Math.abs(state.u) + 0.18)) / surgeMass) * dt);
  let nextV =
    (state.v + ((-rudderForce + windForceV) / swayMass) * dt) /
    (1 +
      ((ship.dragLat *
        loadDrag *
        (Math.abs(state.v) +
          0.12 +
          Math.abs(state.u) * lateralFlowGrip[ship.id])) /
        swayMass) *
        dt);
  const rotation = state.yawRate * dt;
  const rotatedU = nextU * Math.cos(rotation) + nextV * Math.sin(rotation);
  nextV = -nextU * Math.sin(rotation) + nextV * Math.cos(rotation);
  nextU = rotatedU;
  const nextHeading = (state.heading + rotation + TAU) % TAU;
  const candidate = { ...state, u: nextU, v: nextV, heading: nextHeading };
  const velocity = motion(candidate, weather);
  const travel = velocity.sog * dt;
  const next = destination(state, velocity.course, travel);
  const collision = world
    ? hullSweep(state, next, nextHeading, world)
    : { hit: false };
  if (collision.hit) {
    const impact = velocity.sog;
    state.damage = clamp(
      state.damage + Math.max(0, impact - 0.35) ** 2 * 0.0018,
      0,
      1,
    );
    // Reject the swept translation/rotation, then dissipate contact velocity. No teleport across the obstacle.
    // A small recoil lets the hull separate and avoids repeatedly accumulating the same impact damage.
    const recoil = Math.min(0.25, impact * 0.08);
    const east =
      -Math.sin(velocity.course) * recoil -
      weather.currentSpeed * Math.sin(weather.currentDirection);
    const north =
      -Math.cos(velocity.course) * recoil -
      weather.currentSpeed * Math.cos(weather.currentDirection);
    state.u = east * Math.sin(state.heading) + north * Math.cos(state.heading);
    state.v = east * Math.cos(state.heading) - north * Math.sin(state.heading);
    state.yawRate *= -0.08;
    state.engine *= 0.65;
  } else {
    state.lat = next.lat;
    state.lon = next.lon;
    state.heading = nextHeading;
    state.u = nextU;
    state.v = nextV;
    state.distance += travel;
  }
  state.fuel = Math.max(0, state.fuel - fuelRate(state) * dt);
  return collision;
}

export function remainingDistance(
  state: VesselState,
  voyage: Voyage | null,
): number {
  if (!voyage || voyage.completed || !voyage.route.points.length) return 0;
  const points = voyage.route.points;
  const index = voyage.autopilot
    ? Math.max(0, Math.min(points.length - 1,
      Number.isFinite(voyage.waypoint) ? Math.floor(voyage.waypoint) : 0,
    ))
    : manualWaypointIndex(state, voyage);
  let length = distance(state, points[index]);
  for (let i = index; i < points.length - 1; i++)
    length += distance(points[i], points[i + 1]);
  return length;
}

/** The pilot writes exactly the same throttle, rudder, and gear controls used by the player. */
export function autopilotControls(
  state: VesselState,
  weather: Weather,
  voyage: Voyage,
  world?: CollisionWorld,
): Controls {
  const ship = shipById(state.shipId);
  const points = voyage.route.points;
  if (!points.length || voyage.completed)
    return { throttle: 0, rudder: 0, gear: 0 };
  voyage.waypoint = clamp(voyage.waypoint, 0, points.length - 1);
  let target = points[voyage.waypoint];
  let targetDistance = distance(state, target);
  const capture = Math.max(
    35,
    Math.min(1200, ship.length * 3.5 + Math.abs(state.u) * 8),
  );
  while (voyage.waypoint < points.length - 1 && targetDistance < capture) {
    target = points[++voyage.waypoint];
    targetDistance = distance(state, target);
  }
  const final = voyage.waypoint === points.length - 1;
  const speed = motion(state, weather);
  const arrivalRadius = Math.max(30, ship.length * 0.8);
  // Keep the original braking target, but accept a settled approach inside a
  // modest manoeuvring area. Wind/current can leave a small hull 30–50 m from
  // the buoy at near-zero ground speed; chasing the exact point would burn the
  // remaining tank although the real 1 km dock service is already reachable.
  const settledArrivalRadius = Math.min(DOCKING_RADIUS_METERS, Math.max(60, arrivalRadius));
  if (final && targetDistance < settledArrivalRadius && speed.sog < 0.75) {
    voyage.completed = true;
    voyage.autopilot = false;
    return { throttle: 0, rudder: 0, gear: 0 };
  }
  const desiredCourse = bearing(state, target);
  let targetSpeed = ship.cruiseKnots * 0.514444 * 0.88;
  const mass = ship.emptyMass + ship.maxLoad * state.load;
  const braking = (ship.maxThrust * ship.reverseFactor) / (mass * 1.06);
  if (final) {
    const engineLagDistance = Math.abs(state.u) * ship.engineResponse * 0.9;
    targetSpeed = Math.min(
      targetSpeed,
      Math.sqrt(
        2 *
          braking *
          Math.max(
            0,
            targetDistance - arrivalRadius * 0.65 - engineLagDistance,
          ),
      ) * 0.65,
    );
  }
  const desiredE =
    Math.sin(desiredCourse) * Math.max(1, targetSpeed) -
    weather.currentSpeed * Math.sin(weather.currentDirection);
  const desiredN =
    Math.cos(desiredCourse) * Math.max(1, targetSpeed) -
    weather.currentSpeed * Math.cos(weather.currentDirection);
  const desiredHeading =
    Math.atan2(desiredE, desiredN) -
    Math.atan2(state.v, Math.max(1, targetSpeed));
  const error = harborDepartureError(
    angle(desiredHeading - state.heading), state, ship, voyage, world,
  );
  targetSpeed *= clamp(1 - (Math.abs(error) / Math.PI) * 0.8, 0.25, 1);
  // Slow for an upcoming bend, giving heavy ships time to turn without changing their pose directly.
  if (
    !final &&
    targetDistance <
      Math.max(ship.length * 6, state.u ** 2 / Math.max(braking, 0.01))
  ) {
    const nextBearing = bearing(target, points[voyage.waypoint + 1]);
    const bend = Math.abs(angle(nextBearing - desiredCourse));
    targetSpeed *= clamp(1 - (bend / Math.PI) * 0.65, 0.35, 1);
  }
  const rudder = clamp(
    error * 1.8 - state.yawRate * (ship.id === "cargo" ? 24 : 5),
    -1,
    1,
  );
  if (
    state.u > targetSpeed + (final ? 0.25 : 0.5) &&
    (final || Math.abs(error) > 0.75)
  ) {
    return {
      throttle: clamp((state.u - targetSpeed) * 0.8, 0.25, 1),
      rudder,
      gear: -1,
    };
  }
  const steadyPower =
    (ship.id === "spirit"
      ? surgeDragCoefficient(ship, targetSpeed) *
          (1 + state.load * 0.3) *
          targetSpeed *
          (targetSpeed + 0.18) +
        0.5 * 1.225 * ship.windArea * 0.22 * targetSpeed ** 2
      : ship.dragLong * (1 + state.load * 0.3) * targetSpeed ** 2) /
    ship.maxThrust;
  // The light jet boat needs a gentler speed controller through turbine spool-up.
  // Feed-forward above includes its planing resistance and still-air drag.
  const speedGain = ship.id === "spirit" ? 0.035 : 0.15;
  return {
    throttle: clamp(
      steadyPower ** 0.8 + (targetSpeed - state.u) * speedGain,
      0,
      1,
    ),
    rudder,
    gear: 1,
  };
}

export class Simulation {
  state: VesselState;
  weather: Weather;
  paused = false;
  requestedScale = 1;
  activeScale = 1;
  realTime = 0;
  // Animation uses real seconds; the solar clock reads integrated state.simTime.
  // Wildlife and rain particles therefore keep smooth motion at high time scales.
  environmentTime = 0;
  dayStartHour = 9;
  dayLengthSeconds = DEFAULT_DAY_LENGTH_SECONDS;
  clockEpochMs = 0;
  marineLife = true;
  accumulator = 0;
  voyage: Voyage | null = null;
  world?: CollisionWorld;
  onCollision?: (collision: CollisionResult, impactSpeed: number) => void;
  /** Set false for controlled experiments with constant environmental conditions. */
  evolvingWeather = true;
  private clearance = Infinity;
  private clearanceAt = -Infinity;
  private clearancePosition: LatLon;

  constructor(state: VesselState, weather: Weather, world?: CollisionWorld) {
    this.state = state;
    this.weather = weather;
    this.world = world;
    this.clearancePosition = { lat: state.lat, lon: state.lon };
    initializeDaylight(this);
  }

  private safeScale(): number {
    let scale = timeScales.has(this.requestedScale)
      ? this.requestedScale
      : 1;
    const ship = shipById(this.state.shipId);
    const speed = motion(this.state, this.weather).sog;
    if (
      this.world &&
      (this.state.simTime - this.clearanceAt > 0.5 ||
        distance(this.state, this.clearancePosition) > 15)
    ) {
      this.clearance = this.world.clearance(this.state);
      this.clearanceAt = this.state.simTime;
      this.clearancePosition = { lat: this.state.lat, lon: this.state.lon };
    }
    const margin = this.clearance - ship.length * 0.5;
    if (margin < Math.max(100, speed * 12)) scale = 1;
    else if (margin < Math.max(300, speed * 35)) scale = Math.min(scale, 5);
    else if (margin < Math.max(700, speed * 75)) scale = Math.min(scale, 20);
    if (this.voyage && !this.voyage.completed) {
      const last = this.voyage.route.points.at(-1);
      const remaining = last ? distance(this.state, last) : Infinity;
      if (remaining < Math.max(160, ship.length * 1.5, speed * 25)) scale = 1;
      else if (remaining < Math.max(500, ship.length * 4, speed * 80))
        scale = Math.min(scale, 5);
    }
    return scale;
  }

  advance(realDt: number): void {
    if (!Number.isFinite(realDt) || realDt <= 0) return;
    this.realTime += realDt;
    if (this.paused) return;
    this.environmentTime += realDt;
    this.activeScale = this.safeScale();
    this.accumulator += realDt * this.activeScale;
    // 1000× requires 500 fixed steps at 60 rendered frames/s. Bound the work
    // after a stalled frame; retain debt instead of enlarging dt or teleporting.
    let budget = MAX_STEPS_PER_ADVANCE;
    while (this.accumulator + 1e-9 >= FIXED_DT && budget-- > 0) {
      const safe = this.safeScale();
      if (safe < this.activeScale) {
        this.accumulator *= safe / this.activeScale;
        this.activeScale = safe;
        if (this.accumulator + 1e-9 < FIXED_DT) break;
      }
      if (this.evolvingWeather)
        this.weather = weatherAt(
          this.weather.sea,
          this.weather.seed,
          this.state.simTime,
        );
      const manualVoyage = this.voyage && !this.voyage.autopilot ? this.voyage : null;
      if (this.voyage?.autopilot)
        this.state.controls = autopilotControls(
          this.state,
          this.weather,
          this.voyage,
          this.world,
        );
      const impact = motion(this.state, this.weather).sog;
      const collision = stepVessel(
        this.state,
        this.weather,
        FIXED_DT,
        this.world,
      );
      if (collision.hit) {
        if (this.voyage) this.voyage.autopilot = false;
        this.state.controls.throttle = 0;
        this.state.controls.gear = 0;
        this.onCollision?.(collision, impact);
      }
      if (manualVoyage && this.voyage === manualVoyage)
        updateManualRouteProgress(this.state, manualVoyage);
      this.accumulator = Math.max(0, this.accumulator - FIXED_DT);
    }
  }
}
