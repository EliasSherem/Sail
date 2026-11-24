import type { CameraMode, Quality, SeaState, VesselState, VoyageItinerary } from "../types";
import { SHIPS, shipById } from "../data/ships";

export const SAVE_KEY = "deriva.save.v1";
export interface SaveGame {
  version: 1;
  savedAt: string;
  state: VesselState;
  sea: SeaState;
  seed: number;
  routeTarget: string | null;
  itinerary?: VoyageItinerary;
  environmentTime?: number;
  dayStartHour?: number;
  dayLengthSeconds?: number;
  daylightClock?: "simulation" | "utc";
  clockEpochMs?: number;
  marineLife?: boolean;
  routeCompleted?: boolean;
  autopilot: boolean;
  mission: string | null;
  quality: Quality;
  camera: CameraMode;
  tutorialComplete: boolean;
  tutorialStep?: number;
  tutorialStart?: number;
}
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;
const num = (v: unknown, min: number, max: number) =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
export function parseSave(raw: string): SaveGame | null {
  try {
    const v: unknown = JSON.parse(raw);
    if (!record(v) || v.version !== 1 || !record(v.state)) return null;
    const s = v.state;
    if (
      typeof s.shipId !== "string" ||
      !SHIPS.some((ship) => ship.id === s.shipId)
    )
      return null;
    const ship = shipById(s.shipId as VesselState["shipId"]);
    // The record hydroplane legitimately exceeds the old 100 m/s save envelope.
    const maximumSurge = ship.id === "spirit" ? 190 : 100;
    if (
      !num(s.lat, -90, 90) ||
      !num(s.lon, -180, 180) ||
      !num(s.heading, -1e4, 1e4) ||
      !num(s.u, -100, maximumSurge) ||
      !num(s.v, -100, 100) ||
      !num(s.yawRate, -2, 2) ||
      !num(s.engine, 0, 1) ||
      !num(s.fuel, 0, ship.fuelCapacity) ||
      !num(s.damage, 0, 1) ||
      !num(s.load, 0, 1) ||
      !num(s.simTime, 0, 1e12) ||
      !num(s.distance, 0, 1e12)
    )
      return null;
    if (
      !record(s.controls) ||
      !num(s.controls.throttle, 0, 1) ||
      !num(s.controls.rudder, -1, 1) ||
      ![-1, 0, 1].includes(s.controls.gear as number)
    )
      return null;
    if (
      !(s.docked === null || typeof s.docked === "string") ||
      typeof v.sea !== "string" ||
      !["calm", "moderate", "rough", "rain", "storm", "hurricane"].includes(v.sea) ||
      !num(v.seed, 0, 0xffffffff)
    )
      return null;
    if (
      !(v.routeTarget === null || typeof v.routeTarget === "string") ||
      !(v.mission === null || typeof v.mission === "string")
    )
      return null;
    if (
      typeof v.quality !== "string" ||
      !["low", "medium", "high"].includes(v.quality) ||
      typeof v.camera !== "string" ||
      !["follow", "bridge", "orbit"].includes(v.camera) ||
      typeof v.autopilot !== "boolean" ||
      typeof v.tutorialComplete !== "boolean" ||
      typeof v.savedAt !== "string" ||
      !Number.isFinite(Date.parse(v.savedAt))
    )
      return null;
    if ((v.environmentTime !== undefined && !num(v.environmentTime, 0, 1e12)) ||
      (v.dayStartHour !== undefined && !num(v.dayStartHour, 0, 24)) ||
      (v.dayLengthSeconds !== undefined && ![720, 1800, 86400].includes(v.dayLengthSeconds as number)) ||
      (v.daylightClock !== undefined && !["simulation", "utc"].includes(v.daylightClock as string)) ||
      (v.clockEpochMs !== undefined && (!num(v.clockEpochMs, -8.64e15, 8.64e15) ||
        Math.abs((v.clockEpochMs as number) + (s.simTime as number) * 1000) > 8.64e15)) ||
      (v.marineLife !== undefined && typeof v.marineLife !== "boolean") ||
      (v.routeCompleted !== undefined && typeof v.routeCompleted !== "boolean")) return null;
    if (v.itinerary !== undefined) {
      const trip = v.itinerary;
      if (!record(trip) || typeof trip.destinationId !== "string" || !Array.isArray(trip.stopIds) ||
        !trip.stopIds.length || trip.stopIds.length > 256 || !trip.stopIds.every(id => typeof id === "string") ||
        !num(trip.legIndex, 0, trip.stopIds.length - 1) || !Number.isInteger(trip.legIndex) ||
        trip.stopIds.at(-1) !== trip.destinationId || trip.stopIds[trip.legIndex as number] !== v.routeTarget ||
        !(trip.refuelPortId === null || typeof trip.refuelPortId === "string")) return null;
    }
    if (
      v.tutorialStep !== undefined &&
      (!num(v.tutorialStep, 0, 3) || !Number.isInteger(v.tutorialStep))
    )
      return null;
    if (v.tutorialStart !== undefined && !num(v.tutorialStart, 0, 1e12))
      return null;
    return v as unknown as SaveGame;
  } catch {
    return null;
  }
}
export function readSave(): { save: SaveGame | null; error: string | null } {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { save: null, error: null };
    const save = parseSave(raw);
    return {
      save,
      error: save
        ? null
        : "La partida guardada no es válida o pertenece a otra versión. Puedes iniciar una nueva.",
    };
  } catch {
    return {
      save: null,
      error: "El navegador no permite acceder al guardado local.",
    };
  }
}
export function writeSave(save: SaveGame): boolean {
  try {
    if (!parseSave(JSON.stringify(save))) return false;
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}
