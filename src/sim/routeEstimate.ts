import { shipById } from "../data/ships";
import { bearing, destination, distance, toKnots } from "../geo/math";
import type { LatLon, Route, VesselState, Voyage, Weather } from "../types";
import { autopilotControls, FIXED_DT, fuelRate, stepVessel } from "./engine";
import { weatherAt } from "./weather";

export type RouteFuelStatus = "sufficient" | "low-reserve" | "insufficient";
export interface RouteFuelEstimate {
  status: RouteFuelStatus;
  distanceM: number;
  durationSeconds: number;
  estimatedFuelLitres: number;
  /** Passage profiles before the separate manoeuvre allowance. */
  pilotFuelLitres: number;
  fullPowerFuelLitres: number;
  manoeuvreFuelLitres: number;
  /** Additional 25% of estimated trip consumption, not 25% of tank capacity. */
  reserveLitres: number;
  requiredFuelLitres: number;
  availableFuelLitres: number;
  remainingFuelLitres: number;
  cruiseSpeedKnots: number;
  reserveFraction: number;
}
interface LegCruise {
  speedMS: number;
  groundSpeedMS: number;
  pilotFuelPerM: number;
  fullPowerFuelPerM: number;
  accelerationSeconds: number;
  brakingSeconds: number;
}
interface TripPlan {
  distanceM: number;
  durationSeconds: number;
  estimatedFuelLitres: number;
  pilotFuelLitres: number;
  fullPowerFuelLitres: number;
  manoeuvreFuelLitres: number;
  cruiseSpeedKnots: number;
}
const RESERVE_FRACTION = 0.25;
// This is the upper bound of the same binary force solver used below, rather
// than a nominal cruising range. Even the most favourable full-power segment
// cannot cover more ground per litre under the estimator's current profile.
function speedSearchCeiling(state: VesselState, weather: Weather): number {
  const ship = shipById(state.shipId);
  return Math.max(ship.cruiseKnots * 0.514444 * 0.88 * 2,
    Math.sqrt(ship.maxThrust / ship.dragLong) * 2 + weather.windSpeed + weather.currentSpeed);
}

/** Loose, provably optimistic bound for pruning distant service candidates.
 * It omits all manoeuvres/adverse weather and uses the force solver's maximum
 * possible speed; exceeding this distance cannot pass the full fuel estimate. */
export function affordableDistanceUpperBound(state: VesselState, weather: Weather): number {
  const rate = fuelRate({ ...state, fuel: shipById(state.shipId).fuelCapacity, engine: 1, docked: null });
  return Math.max(0, state.fuel) / ((1 + RESERVE_FRACTION) * rate) *
    (speedSearchCeiling(state, weather) + weather.currentSpeed);
}
const cache = new WeakMap<Route, { key: string; plan: TripPlan }>();
// An itinerary revisits the same sampled corridor segments in many port pairs.
// Keep exact (not rounded) solutions under a bounded physical-context cache.
interface WindCurrent { windE: number; windN: number; currentE: number; currentN: number; }
const segmentContexts = new Map<string, { segments: Map<string, LegCruise>; forecast: WindCurrent[] }>();

function physicalKey(state: VesselState, weather: Weather): string {
  return [state.shipId, state.load, state.damage, state.simTime, weather.sea, weather.seed, weather.windSpeed,
    weather.windDirection, weather.currentSpeed, weather.currentDirection].join("/");
}

/** Bounded synthetic-weather envelope, computed once per physical context.
 * Keep custom wind/current settings: transfer future changes as ratios/angle
 * offsets from the canonical weatherAt snapshot, rather than replacing them.
 * Independent adverse wind/current phases conservatively cover a long trip;
 * small sampling margins cover missed gust extrema, separately from fuel reserve. */
function forecastEnvelope(state: VesselState, weather: Weather): WindCurrent[] {
  const reference = weatherAt(weather.sea, weather.seed, state.simTime);
  const angle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
  const samples: WindCurrent[] = [];
  for (let i = 0; i < 72; i++) {
    const future = weatherAt(weather.sea, weather.seed, state.simTime + i * 1499);
    const wind = weather.windSpeed * future.windSpeed / Math.max(.001, reference.windSpeed);
    const current = weather.currentSpeed * future.currentSpeed / Math.max(.001, reference.currentSpeed);
    const windAngle = weather.windDirection + angle(future.windDirection - reference.windDirection);
    const currentAngle = weather.currentDirection + angle(future.currentDirection - reference.currentDirection);
    for (const side of [-1, 1]) samples.push({
      windE: wind * (1 + side * .05) * Math.sin(windAngle),
      windN: wind * (1 + side * .05) * Math.cos(windAngle),
      currentE: current * (1 + side * .01) * Math.sin(currentAngle),
      currentN: current * (1 + side * .01) * Math.cos(currentAngle),
    });
  }
  return samples;
}

function adverseWeather(weather: Weather, course: number, forecast: WindCurrent[]): Weather {
  const east = Math.sin(course), north = Math.cos(course);
  let wind = forecast[0], current = forecast[0], windProjection = Infinity, currentProjection = Infinity;
  for (const sample of forecast) {
    const w = sample.windE * east + sample.windN * north;
    const c = sample.currentE * east + sample.currentN * north;
    if (w < windProjection) { wind = sample; windProjection = w; }
    if (c < currentProjection) { current = sample; currentProjection = c; }
  }
  return { ...weather,
    windSpeed: Math.hypot(wind.windE, wind.windN), windDirection: Math.atan2(wind.windE, wind.windN),
    currentSpeed: Math.hypot(current.currentE, current.currentN), currentDirection: Math.atan2(current.currentE, current.currentN),
  };
}

/** Solve both existing pilot cruise and full-power forces on disposable states. */
function legCruise(
  state: VesselState,
  weather: Weather,
  start: LatLon,
  course: number,
): LegCruise {
  const contextKey = physicalKey(state, weather);
  let context = segmentContexts.get(contextKey);
  if (!context) {
    if (segmentContexts.size >= 4)
      segmentContexts.delete(segmentContexts.keys().next().value!);
    context = { segments: new Map(), forecast: forecastEnvelope(state, weather) };
    segmentContexts.set(contextKey, context);
  }
  const segments = context.segments;
  const segmentKey = `${start.lat}/${start.lon}/${course}`;
  const cached = segments.get(segmentKey);
  if (cached) return cached;
  const ship = shipById(state.shipId);
  const targetSpeed = ship.cruiseKnots * 0.514444 * 0.88;
  // A remote intermediate target avoids arrival braking while reusing the exact
  // pilot throttle law. Sampling calls stepVessel for one fixed step on copies.
  const target = destination(start, course, 1_000_000);
  const voyage: Voyage = {
    route: {
      id: "fuel-probe",
      name: "",
      from: "",
      to: "",
      points: [start, target, destination(target, course, 1000)],
      distance: 1_001_000,
      directDistance: 1_001_000,
      description: "",
    },
    waypoint: 1,
    autopilot: true,
    completed: false,
  };
  const probe = (speed: number, conditions: Weather, fullPower: boolean, gear: 1 | -1 = 1) => {
    const heading = fullPower
      ? course - Math.asin(Math.max(-1, Math.min(1,
        conditions.currentSpeed * Math.sin(conditions.currentDirection - course) / Math.max(.2, speed),
      )))
      : Math.atan2(Math.sin(course) * targetSpeed - conditions.currentSpeed * Math.sin(conditions.currentDirection),
        Math.cos(course) * targetSpeed - conditions.currentSpeed * Math.cos(conditions.currentDirection));
    const sample: VesselState = {
      ...state,
      ...start,
      heading,
      u: speed,
      v: 0,
      yawRate: 0,
      engine: 0,
      fuel: ship.fuelCapacity,
      docked: null,
      controls: { throttle: 0, rudder: 0, gear: 1 },
    };
    const controls = fullPower ? { throttle: 1, rudder: 0, gear } : autopilotControls(sample, conditions, voyage);
    sample.engine = controls.throttle;
    const rate = fuelRate(sample);
    stepVessel(sample, conditions, FIXED_DT, undefined, controls);
    const groundSpeed = Math.max(.2, speed * Math.cos(heading - course) +
      conditions.currentSpeed * Math.cos(conditions.currentDirection - course));
    return { acceleration: (sample.u - speed) / FIXED_DT, rate, groundSpeed };
  };
  const equilibrium = (conditions: Weather, fullPower: boolean) => {
    let low = 0, high = speedSearchCeiling(state, conditions);
    for (let step = 0; step < 24; step++) {
      const speed = (low + high) * .5;
      if (probe(speed, conditions, fullPower).acceleration > 0) low = speed;
      else high = speed;
    }
    const speed = (low + high) * .5;
    return { speed, ...probe(speed, conditions, fullPower) };
  };
  const adverse = adverseWeather(weather, course, context.forecast);
  const following = adverseWeather(weather, course + Math.PI, context.forecast);
  const currentPilot = equilibrium(weather, false), futurePilot = equilibrium(adverse, false);
  const currentFull = equilibrium(weather, true), futureFull = equilibrium(adverse, true);
  // Integrate acceleration/braking time over speed using the real force law,
  // rather than treating a weak jet reverse like a constant nominal deceleration.
  // Bounded quadrature avoids a simulated voyage per candidate graph edge.
  const peakSpeed = Math.max(currentFull.speed, futureFull.speed);
  let accelerationSeconds = 0, brakingSeconds = 0;
  for (let bin = 0; bin < 16; bin++) {
    const du = peakSpeed * .95 / 16, speed = du * (bin + .5);
    accelerationSeconds += du / Math.max(.01, probe(speed, weather, true).acceleration);
    brakingSeconds += du / Math.max(.01, Math.min(
      -probe(speed, weather, true, -1).acceleration,
      -probe(speed, following, true, -1).acceleration,
    ));
  }
  const result = {
    speedMS: Math.min(currentPilot.speed, futurePilot.speed),
    groundSpeedMS: Math.min(currentPilot.groundSpeed, futurePilot.groundSpeed),
    pilotFuelPerM: Math.max(currentPilot.rate / currentPilot.groundSpeed, futurePilot.rate / futurePilot.groundSpeed),
    fullPowerFuelPerM: Math.max(currentFull.rate / currentFull.groundSpeed, futureFull.rate / futureFull.groundSpeed),
    accelerationSeconds, brakingSeconds,
  };
  if (segments.size >= 16384) segments.delete(segments.keys().next().value!);
  segments.set(segmentKey, result);
  return result;
}

function planTrip(
  state: VesselState,
  route: Route,
  weather: Weather,
  maxConsumptionLitres = Infinity,
): TripPlan | null {
  const ship = shipById(state.shipId);
  // Routes must be newly planned from the current vessel (routeFromPosition).
  // Use actual segment lengths, replacing the departure anchor with the vessel;
  // never use a stale declared route.distance or invent a shortcut between bends.
  const points =
    route.points.length > 1
      ? [state, ...route.points.slice(1)]
      : [state, ...route.points];
  let distanceM = 0,
    cruiseSeconds = 0,
    cruiseFuel = 0,
    pilotFuelLitres = 0,
    fullPowerFuelLitres = 0,
    weightedSpeed = 0,
    accelerationSeconds = 0,
    brakingSeconds = 0,
    turnSeconds = 0,
    previousCourse = state.heading;
  for (let index = 1; index < points.length; index++) {
    const length = distance(points[index - 1], points[index]);
    if (length < 0.01) continue;
    const course = bearing(points[index - 1], points[index]);
    const leg = legCruise(
      state,
      weather,
      points[index - 1],
      course,
    );
    const seconds = length / leg.groundSpeedMS;
    distanceM += length;
    cruiseSeconds += seconds;
    pilotFuelLitres += length * leg.pilotFuelPerM;
    fullPowerFuelLitres += length * leg.fullPowerFuelPerM;
    // Per-segment envelope also covers changing from pilot to full-power
    // manual driving mid-route, instead of assuming one mode for the whole leg.
    cruiseFuel += length * Math.max(leg.pilotFuelPerM, leg.fullPowerFuelPerM);
    // Passage fuel and the manoeuvre allowance are nonnegative. Once even the
    // partial passage exceeds a budget, no later segment can make it affordable.
    if (cruiseFuel > maxConsumptionLitres) return null;
    weightedSpeed += length * leg.speedMS;
    accelerationSeconds = Math.max(accelerationSeconds, leg.accelerationSeconds);
    brakingSeconds = Math.max(brakingSeconds, leg.brakingSeconds);
    const turn = Math.abs(Math.atan2(Math.sin(course - previousCourse), Math.cos(course - previousCourse)));
    turnSeconds += turn * Math.max(ship.engineResponse * 2, ship.length * 3 / Math.max(1, leg.speedMS));
    previousCourse = course;
  }
  if (distanceM === 0)
    return {
      distanceM: 0,
      durationSeconds: 0,
      estimatedFuelLitres: 0,
      pilotFuelLitres: 0,
      fullPowerFuelLitres: 0,
      manoeuvreFuelLitres: 0,
      cruiseSpeedKnots: 0,
    };
  const cruiseSpeed = weightedSpeed / distanceM;
  // Charge a conservative full-rate allowance for starting, braking, bends and
  // slow arrival. This is consumption, not the separate 25% contingency reserve.
  const manoeuvreSeconds =
    ship.engineResponse * 2 + accelerationSeconds + brakingSeconds + turnSeconds +
    Math.max(35, ship.length * 2) / Math.max(1, cruiseSpeed * 0.3);
  const fullFuelRate = fuelRate({ ...state, fuel: ship.fuelCapacity, engine: 1, docked: null });
  const manoeuvreFuelLitres = manoeuvreSeconds * fullFuelRate;
  return {
    distanceM,
    durationSeconds: cruiseSeconds + manoeuvreSeconds,
    estimatedFuelLitres: cruiseFuel + manoeuvreFuelLitres,
    pilotFuelLitres,
    fullPowerFuelLitres,
    manoeuvreFuelLitres,
    cruiseSpeedKnots: toKnots(cruiseSpeed),
  };
}

function planKey(
  state: VesselState,
  weather: Weather,
): string {
  return [
    state.shipId,
    state.lat,
    state.lon,
    state.load,
    state.damage,
    state.heading,
    state.simTime,
    weather.sea,
    weather.seed,
    weather.windSpeed,
    weather.windDirection,
    weather.currentSpeed,
    weather.currentDirection,
  ].join("/");
}

/** Conservative passage budget, valid even at rest/neutral: per-segment maximum
 * of pilot and full-power consumption, synthetic-weather envelope and manoeuvres.
 * Repeated detours, prolonged idle and changing weather presets require replanning.
 * No route is blocked here; the itinerary search uses the separate 25% reserve.
 */
export function estimateRouteFuel(
  state: VesselState,
  route: Route,
  weather: Weather,
): RouteFuelEstimate {
  // Map/mission previews often render at 10Hz while paused. Fuel/gear/throttle do
  // not affect the cruise solution, so changing only those reuses its cached plan.
  const key = planKey(state, weather);
  let cached = cache.get(route);
  if (!cached || cached.key !== key) {
    cached = { key, plan: planTrip(state, route, weather)! };
    cache.set(route, cached);
  }
  const plan = cached.plan;
  const availableFuelLitres = Math.max(0, state.fuel);
  const reserveLitres = plan.estimatedFuelLitres * RESERVE_FRACTION;
  const requiredFuelLitres = plan.estimatedFuelLitres + reserveLitres;
  const status =
    availableFuelLitres >= requiredFuelLitres
      ? "sufficient"
      : availableFuelLitres >= plan.estimatedFuelLitres
        ? "low-reserve"
        : "insufficient";
  return {
    ...plan,
    status,
    reserveLitres,
    requiredFuelLitres,
    availableFuelLitres,
    remainingFuelLitres: availableFuelLitres - plan.estimatedFuelLitres,
    reserveFraction: RESERVE_FRACTION,
  };
}

/** Same estimate/reserve policy, with an exact early rejection for itinerary
 * graph edges whose partial passage already exceeds available fuel. */
export function estimateAffordableRoute(
  state: VesselState,
  route: Route,
  weather: Weather,
): RouteFuelEstimate | null {
  const key = planKey(state, weather);
  const cached = cache.get(route);
  if (!cached || cached.key !== key) {
    const plan = planTrip(
      state,
      route,
      weather,
      Math.max(0, state.fuel) / (1 + RESERVE_FRACTION),
    );
    if (!plan) return null;
    cache.set(route, { key, plan });
  }
  // A complete result also checks the manoeuvre allowance and shares the public
  // estimator's classification; passing the route to it reuses its normal cache.
  const estimate = estimateRouteFuel(state, route, weather);
  return estimate.status === "sufficient" ? estimate : null;
}
