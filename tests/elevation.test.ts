import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { PORTS, portById } from "../src/data/ports";
import { worldFromGeoJSON } from "../src/geo/world";
import { fromLocal } from "../src/geo/math";
import { setPortElevations, sampleTerrainElevation, createElevationSampler, coastalBiome, type ElevationAtlas } from "../src/render/elevation";
import { createTerrain, createTerrainSurfaceSampler } from "../src/render/terrain";
import { disposeObject } from "../src/render/shipModels";
import originalPorts from "./fixtures/coast-detail-baseline.json";

const atlas: ElevationAtlas = JSON.parse(readFileSync(new URL("../public/data/port-elevations.json", import.meta.url), "utf8"));
setPortElevations(atlas);
const world = worldFromGeoJSON(JSON.parse(readFileSync(new URL("../public/data/land.geojson", import.meta.url), "utf8")));

describe("bundled regional terrain survey", () => {
  it("retains the 105 surveyed original destinations without claiming new DEM coverage", () => {
    expect(atlas.patches.map(patch => patch.id).sort()).toEqual(originalPorts.map(port => port.id).sort());
    expect(atlas.size).toBe(81);
    expect(atlas.spacingMeters).toBe(700);
    for (const original of originalPorts) {
      const port = portById(original.id)!;
      expect(atlas.patches.some(p => p.id === port.id), port.id).toBe(true);
      expect(Number.isFinite(sampleTerrainElevation(port)), port.id).toBe(true);
      expect(createElevationSampler(port)(port)).toBeCloseTo(sampleTerrainElevation(port)!);
    }
    expect(JSON.stringify(atlas).length).toBeLessThan(2_000_000);
  });

  it("keeps new ports outside the named survey set and preserves any genuine overlapping coverage", () => {
    const surveyed = new Set(originalPorts.map(port => port.id));
    const additions = PORTS.filter(port => !surveyed.has(port.id));
    expect(additions.length).toBeGreaterThan(0);
    for (const port of additions) {
      expect(atlas.patches.some(patch => patch.id === port.id), port.id).toBe(false);
      const raw = sampleTerrainElevation(port), local = createElevationSampler(port)(port);
      // A nearby existing patch may cover a new berth geographically. Outside
      // those real patches, absence remains explicit rather than becoming DEM.
      if (raw === undefined) expect(local, port.id).toBeUndefined();
      else { expect(Number.isFinite(raw), port.id).toBe(true); expect(local).toBeCloseTo(raw); }
    }
  });

  it.each([
    ["naples", { lat: 40.855, lon: 14.28 }],
    ["campeche", { lat: 19.835, lon: -90.52 }],
    ["limassol", { lat: 34.69, lon: 33.04 }],
  ] as const)("uses deterministic decorative relief and level water at unsurveyed %s", (id, inland) => {
    const port = portById(id)!, sampler = createTerrainSurfaceSampler(world, port);
    expect(sampleTerrainElevation(inland)).toBeUndefined();
    expect(createElevationSampler(port)(inland)).toBeUndefined();
    expect(world.isLand(inland)).toBe(true);
    expect(sampler(port)).toBe(0);
    const height = sampler(inland);
    expect(Number.isFinite(height)).toBe(true);
    expect(height).toBeGreaterThanOrEqual(1.2);
    expect(height).toBeLessThanOrEqual(1.2 + coastalBiome(port).fallbackRelief);
    expect(createTerrainSurfaceSampler(world, port)(inland)).toBe(height);
  });

  it("preserves contrasting real regional elevations rather than adding identical fictional hills", () => {
    const ny = sampleTerrainElevation({ lat: 40.64, lon: -73.99 })!;
    const cancun = sampleTerrainElevation({ lat: 21.13, lon: -86.86 })!;
    const eilat = sampleTerrainElevation({ lat: 29.58, lon: 34.9 })!;
    const cabo = sampleTerrainElevation({ lat: 23.03, lon: -109.93 })!;
    const carmel = sampleTerrainElevation({ lat: 32.73, lon: 35.02 })!;
    expect(ny).toBeGreaterThan(0); expect(ny).toBeLessThan(60);
    expect(cancun).toBeGreaterThan(0); expect(cancun).toBeLessThan(25);
    expect(eilat).toBeGreaterThan(450); expect(eilat).toBeLessThan(750);
    expect(cabo).toBeGreaterThan(250); expect(cabo).toBeLessThan(600);
    expect(carmel).toBeGreaterThan(250); expect(carmel).toBeLessThan(500);
    expect(sampleTerrainElevation({ lat: 0, lon: -140 })).toBeUndefined();
  });

  it.each([
    ["marseille", "mediterranean", "pine"], ["new-york", "temperate", "broadleaf"],
    ["cancun", "tropical", "palm"], ["singapore", "tropical", "palm"],
    ["eilat", "desert", "none"], ["los-cabos", "desert", "none"],
    ["nuuk", "tundra", "none"], ["reykjavik", "volcanic", "none"], ["bergen", "boreal", "conifer"],
  ])("uses regionally distinct vegetation around %s", (id, biome, tree) => {
    expect(coastalBiome(portById(id)!)).toMatchObject({ id: biome, trees: tree });
  });

  it("uses surveyed heights for the actual mesh and its building sampler, retaining open canals", () => {
    const origin = portById("eilat")!, terrain = createTerrain(world, origin, 7000), surfaceAt = createTerrainSurfaceSampler(world, origin, 7000);
    const land = terrain.children.find(child => child instanceof THREE.Mesh && child.geometry.index) as THREE.Mesh;
    expect(land).toBeDefined();
    const positions = land.geometry.getAttribute("position"); let compared = 0, maximum = 0;
    // A shoreline refinement changes vertex ordering. Measure the complete mesh;
    // retain sparse samples only for the more expensive geodesic agreement check.
    for (let i = 0; i < positions.count; i++) maximum = Math.max(maximum, positions.getY(i));
    for (let i = 0; i < positions.count; i += 31) {
      const point = fromLocal(positions.getX(i), positions.getZ(i), origin);
      if (!world.isLand(point)) continue;
      expect(surfaceAt(point)).toBeCloseTo(positions.getY(i), 1); compared++;
    }
    expect(compared).toBeGreaterThan(20); expect(maximum).toBeGreaterThan(500);
    disposeObject(terrain);
    for (const id of ["suez", "colon", "balboa", "port-said"]) {
      const port = portById(id)!;
      expect(createTerrainSurfaceSampler(world, port, 4000)(port), id).toBe(0);
    }
  });
});
