export interface LatLon {
  lat: number;
  lon: number;
}
export type ShipId =
  "launch" | "fishing" | "yacht" | "tug" | "cargo" | "speedboat" | "spirit";
export type SeaState = "calm" | "moderate" | "rough" | "rain" | "storm" | "hurricane";
export type CameraMode = "follow" | "bridge" | "orbit";
export type Quality = "low" | "medium" | "high";
export interface ShipConfig {
  id: ShipId;
  name: string;
  subtitle: string;
  description: string;
  color: string;
  length: number;
  beam: number;
  draft: number;
  emptyMass: number;
  maxLoad: number;
  inertiaFactor: number;
  maxThrust: number;
  reverseFactor: number;
  engineResponse: number;
  dragLong: number;
  dragLat: number;
  rudderAuthority: number;
  yawDamping: number;
  propWash: number;
  differentialThrust: number;
  fuelCapacity: number;
  fuelIdle: number;
  fuelFull: number;
  windArea: number;
  waveResponse: number;
  cruiseKnots: number;
}
export interface Controls {
  throttle: number;
  rudder: number;
  gear: -1 | 0 | 1;
}
export interface Weather {
  sea: SeaState;
  windSpeed: number;
  windDirection: number;
  currentSpeed: number;
  currentDirection: number;
  waveHeight: number;
  visibility: number;
  seed: number;
}
export interface VesselState extends LatLon {
  shipId: ShipId;
  heading: number;
  u: number;
  v: number;
  yawRate: number;
  engine: number;
  fuel: number;
  damage: number;
  load: number;
  simTime: number;
  distance: number;
  controls: Controls;
  docked: string | null;
}
export interface Port extends LatLon {
  id: string;
  name: string;
  country: string;
  region: string;
  heading: number;
  description: string;
}
export interface Route {
  id: string;
  name: string;
  from: string;
  to: string;
  points: LatLon[];
  distance: number;
  directDistance: number;
  description: string;
}
export interface CollisionResult {
  hit: boolean;
  point?: LatLon;
  kind?: "land" | "dock";
}
export interface CollisionWorld {
  sweep(from: LatLon, to: LatLon, radius: number): CollisionResult;
  clearance(point: LatLon): number;
}
export interface Motion {
  east: number;
  north: number;
  sog: number;
  stw: number;
  course: number;
}
export interface VoyageItinerary {
  destinationId: string;
  stopIds: string[];
  legIndex: number;
  refuelPortId: string | null;
}
export interface Voyage {
  route: Route;
  waypoint: number;
  autopilot: boolean;
  completed: boolean;
  /** A fresh path from the current position could not be verified. */
  routeUnavailable?: boolean;
  /** A route exists, but a fuel-feasible passage has not been verified. */
  fuelWarning?: string;
  itinerary?: VoyageItinerary;
}
export interface WaveSample {
  height: number;
  pitch: number;
  roll: number;
}
