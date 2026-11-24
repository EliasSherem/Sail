import { describe, expect, it, vi, afterEach } from "vitest";
import { createVessel } from "../src/sim/engine";
import {
  parseSave,
  readSave,
  writeSave,
  SAVE_KEY,
  type SaveGame,
} from "../src/persistence/save";
const fixture = (): SaveGame => ({
  version: 1,
  savedAt: "2026-09-26T12:00:00Z",
  state: createVessel("yacht", { lat: 43.286, lon: 5.347 }, Math.PI, 0.35),
  sea: "calm",
  seed: 4821,
  routeTarget: "cassis",
  autopilot: true,
  mission: "cassis",
  quality: "high",
  camera: "follow",
  tutorialComplete: true,
});
afterEach(() => vi.unstubAllGlobals());
describe("versioned local persistence", () => {
  it("round trips coordinates, momentum, controls, fuel and mission without losing state", () => {
    const game = fixture();
    Object.assign(game.state, {
      u: 8.34,
      v: 0.14,
      yawRate: 0.023,
      fuel: 1322.4,
      simTime: 5621,
      distance: 31200,
      damage: 0.12,
    });
    game.state.controls = { throttle: 0.6, gear: -1, rudder: -0.25 };
    const storage = new Map();
    vi.stubGlobal("localStorage", {
      setItem: (k: string, v: string) => storage.set(k, v),
      getItem: (k: string) => storage.get(k) || null,
    });
    expect(writeSave(game)).toBe(true);
    expect(readSave()).toEqual({ save: game, error: null });
    expect(storage.has(SAVE_KEY)).toBe(true);
  });
  it("rejects corrupt JSON, unknown versions and incomplete objects", () => {
    for (const s of [
      "{",
      "null",
      "42",
      "{}",
      JSON.stringify({ ...fixture(), version: 2 }),
    ])
      expect(parseSave(s)).toBeNull();
  });
  it("rejects nonphysical coordinates, fuel, momentum and controls", () => {
    for (const [key, value] of Object.entries({
      lat: 91,
      lon: 181,
      fuel: -1,
      u: 1e6,
      load: 3,
      damage: 1.5,
      engine: -0.5,
      shipId: "submarine",
    })) {
      const f = fixture();
      (f.state as unknown as Record<string, unknown>)[key] = value;
      expect(parseSave(JSON.stringify(f))).toBeNull();
    }
    const f = fixture();
    f.state.controls.throttle = 12;
    expect(parseSave(JSON.stringify(f))).toBeNull();
  });
  it("recovers safely from corrupt stored data without overwriting it", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => "{broken",
      setItem: () => {
        throw Error("must not overwrite");
      },
    });
    expect(readSave().save).toBeNull();
    expect(readSave().error).toContain("no es válida");
  });
  it("preserves hydroplane momentum above 500 km/h without weakening other ship limits", () => {
    const game = fixture();
    game.state = createVessel("spirit", { lat: 42, lon: 4 });
    game.state.u = 511.11 / 3.6;
    game.state.engine = 1;
    game.state.controls = { throttle: 1, rudder: 0.03, gear: 1 };
    expect(parseSave(JSON.stringify(game))?.state.u).toBe(game.state.u);
    game.state.u = 191;
    expect(parseSave(JSON.stringify(game))).toBeNull();
    game.state = createVessel("launch", { lat: 42, lon: 4 });
    game.state.u = 141;
    expect(parseSave(JSON.stringify(game))).toBeNull();
  });
  it("rejects arrays masquerading as string settings", () => {
    for (const key of ["sea", "quality", "camera"] as const) {
      const f = fixture();
      const malformed = { ...f, [key]: [f[key]] };
      expect(parseSave(JSON.stringify(malformed))).toBeNull();
    }
  });
  it("handles unavailable storage and quota limits", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw Error("blocked");
      },
      setItem: () => {
        throw Error("quota");
      },
    });
    expect(readSave().error).toContain("no permite");
    expect(writeSave(fixture())).toBe(false);
  });
  it("preserves a completed arrival so restoring cannot restart its pilot", () => {
    const game = fixture();
    game.routeCompleted = true;
    game.autopilot = false;
    game.itinerary = { destinationId: "la-ciotat", stopIds: ["cassis", "la-ciotat"], legIndex: 0, refuelPortId: null };
    game.state.docked = "cassis";
    expect(parseSave(JSON.stringify(game))).toEqual(game);
    expect(parseSave(JSON.stringify({ ...game, routeCompleted: "yes" }))).toBeNull();
  });

});
