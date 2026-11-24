import type { LatLon } from "../types";
import { normalizeLon } from "../geo/math";

export interface ElevationPatch {
  id: string; latMin: number; lonMin: number; latStep: number; lonStep: number; data: string;
}
export interface ElevationAtlas {
  version: number; size: number; spacingMeters: number; sourceZoom: number; encoding: string; patches: ElevationPatch[];
}
interface DecodedPatch extends Omit<ElevationPatch, "data"> { heights: Int16Array; }
let atlas: { size: number; patches: DecodedPatch[] } | undefined;
let loading: Promise<void> | undefined;

/** CPU-only data shared between terrain rebuilds; owns no disposable GPU resources. */
export function setPortElevations(data: ElevationAtlas): void {
  if (data.version !== 1 || data.encoding !== "int16-le-base64" || data.size < 2 || data.size > 257)
    throw new Error("Unsupported elevation atlas");
  const patches = data.patches.map(p => {
    const bytes = Uint8Array.from(atob(p.data), c => c.charCodeAt(0));
    if (bytes.length !== data.size * data.size * 2 || !(p.latStep > 0) || !(p.lonStep > 0))
      throw new Error(`Invalid elevation patch: ${p.id}`);
    const view = new DataView(bytes.buffer), heights = new Int16Array(data.size * data.size);
    for (let i = 0; i < heights.length; i++) heights[i] = view.getInt16(i * 2, true);
    return { id: p.id, latMin: p.latMin, lonMin: p.lonMin, latStep: p.latStep, lonStep: p.lonStep, heights };
  });
  atlas = { size: data.size, patches };
}

export function loadPortElevations(): Promise<void> {
  if (atlas) return Promise.resolve();
  if (!loading) loading = fetch("/data/port-elevations.json")
    .then(response => { if (!response.ok) throw new Error("Elevation atlas unavailable"); return response.json() as Promise<ElevationAtlas>; })
    .then(setPortElevations).catch(error => { loading = undefined; throw error; });
  return loading;
}

function sample(point: LatLon, patches: DecodedPatch[], size: number): number | undefined {
  let total = 0, weights = 0;
  for (const patch of patches) {
    const x = normalizeLon(point.lon - patch.lonMin) / patch.lonStep, y = (point.lat - patch.latMin) / patch.latStep;
    if (x < 0 || y < 0 || x > size - 1 || y > size - 1) continue;
    const col = Math.min(size - 2, Math.floor(x)), row = Math.min(size - 2, Math.floor(y)), fx = x - col, fy = y - row;
    const a = patch.heights[row * size + col] * (1 - fx) + patch.heights[row * size + col + 1] * fx;
    const b = patch.heights[(row + 1) * size + col] * (1 - fx) + patch.heights[(row + 1) * size + col + 1] * fx;
    // Overlapping ports use a smooth weighted blend rather than switching grids at their bisector.
    const margin = Math.min(x, y, size - 1 - x, size - 1 - y), weight = Math.max(.001, Math.min(1, margin / 4));
    total += (a * (1 - fy) + b * fy) * weight; weights += weight;
  }
  return weights ? total / weights : undefined;
}

/** Raw metres above sea level, including negative ocean elevations, with no invented detail. */
export function sampleTerrainElevation(point: LatLon): number | undefined {
  return atlas ? sample(point, atlas.patches, atlas.size) : undefined;
}

export function createElevationSampler(origin: LatLon, radius = 18000): (point: LatLon) => number | undefined {
  if (!atlas) return () => undefined;
  const size = atlas.size, latSpan = radius / 110000, lonSpan = latSpan / Math.max(.01, Math.cos(origin.lat * Math.PI / 180));
  const patches = atlas.patches.filter(p => p.latMin < origin.lat + latSpan && p.latMin + (size - 1) * p.latStep > origin.lat - latSpan &&
    Math.abs(normalizeLon(p.lonMin + (size - 1) * p.lonStep / 2 - origin.lon)) < lonSpan + (size - 1) * p.lonStep / 2);
  return point => sample(point, patches, size);
}

export type BiomeId = "mediterranean" | "temperate" | "boreal" | "tundra" | "desert" | "tropical" | "volcanic" | "polar" | "polar-volcanic" | "subpolar" | "steppe";
export interface CoastalBiome {
  id: BiomeId; stone: string; scrub: string; grass: string; foliage: string;
  trees: "pine" | "broadleaf" | "conifer" | "palm" | "none";
  vegetation: number; treeDensity: number; fallbackRelief: number; snowLine: number; snowBlendRange?: number;
}
const BIOMES: Record<BiomeId, CoastalBiome> = {
  mediterranean: { id: "mediterranean", stone: "#9a9584", scrub: "#405238", grass: "#838264", foliage: "#3b5136", trees: "pine", vegetation: .8, treeDensity: .65, fallbackRelief: 90, snowLine: 2300 },
  temperate: { id: "temperate", stone: "#8b8d83", scrub: "#466647", grass: "#768468", foliage: "#365c3d", trees: "broadleaf", vegetation: 1, treeDensity: 1, fallbackRelief: 65, snowLine: 1700 },
  boreal: { id: "boreal", stone: "#858d8e", scrub: "#445a47", grass: "#697664", foliage: "#294b3d", trees: "conifer", vegetation: .8, treeDensity: 1, fallbackRelief: 130, snowLine: 1000 },
  tundra: { id: "tundra", stone: "#899097", scrub: "#727767", grass: "#8b8d78", foliage: "#6a7561", trees: "none", vegetation: .3, treeDensity: 0, fallbackRelief: 140, snowLine: 650 },
  desert: { id: "desert", stone: "#ba9b78", scrub: "#827453", grass: "#b6a27b", foliage: "#73764c", trees: "none", vegetation: .12, treeDensity: 0, fallbackRelief: 110, snowLine: 3000 },
  tropical: { id: "tropical", stone: "#b0aa89", scrub: "#3e653e", grass: "#698658", foliage: "#315b37", trees: "palm", vegetation: 1, treeDensity: .95, fallbackRelief: 90, snowLine: 4000 },
  volcanic: { id: "volcanic", stone: "#535d5a", scrub: "#50614a", grass: "#748065", foliage: "#425540", trees: "none", vegetation: .4, treeDensity: 0, fallbackRelief: 150, snowLine: 1050 },
  polar: { id: "polar", stone: "#929ca3", scrub: "#929ca3", grass: "#929ca3", foliage: "#929ca3", trees: "none", vegetation: 0, treeDensity: 0, fallbackRelief: 240, snowLine: 20, snowBlendRange: 130 },
  "polar-volcanic": { id: "polar-volcanic", stone: "#41464a", scrub: "#41464a", grass: "#41464a", foliage: "#41464a", trees: "none", vegetation: 0, treeDensity: 0, fallbackRelief: 220, snowLine: 100, snowBlendRange: 150 },
  subpolar: { id: "subpolar", stone: "#838e92", scrub: "#526358", grass: "#778273", foliage: "#3b5145", trees: "broadleaf", vegetation: .65, treeDensity: .55, fallbackRelief: 230, snowLine: 650 },
  steppe: { id: "steppe", stone: "#92938b", scrub: "#797d62", grass: "#a39c7a", foliage: "#727760", trees: "none", vegetation: .42, treeDensity: 0, fallbackRelief: 110, snowLine: 850 },
};

/** Coarse regional art direction, not a land-cover or climatological dataset. */
export function coastalBiome(point: LatLon): CoastalBiome {
  const { lat, lon } = point, abs = Math.abs(lat);
  // Antarctic coasts cannot inherit temperate forests from the southern fallback.
  // Deception's ice-free volcanic beach remains darker than neighbouring islands.
  if (lat < -62.75 && lat > -63.15 && lon > -60.85 && lon < -60.35) return BIOMES["polar-volcanic"];
  if (lat < -60) return BIOMES.polar;
  if (lat < -55.5) return BIOMES.tundra;
  if (lat < -45) return lon < -71 || (lat < -54 && lon < -66) ? BIOMES.subpolar : BIOMES.steppe;
  if (lat > 62 && lon > -26 && lon < -12) return BIOMES.volcanic; // Iceland's basalt/tundra.
  if (lat > 59 && lon < -35 || lat >= 64 || lat > 59 && lon < -1 && lon > -10) return BIOMES.tundra;
  if ((lat > 27 && lat < 33 && lon > 29 && lon < 44 && (lon > 35.65 || lat < 30.5)) ||
      (lat > 12 && lat < 30 && lon > 32 && lon < 61) ||
      (lat > 22 && lat < 32 && lon > -117 && lon < -108) ||
      (lat > 20 && lat < 30 && lon > -20 && lon < -10) ||
      (lat < -16 && lat > -33 && lon > -80 && lon < -68)) return BIOMES.desert;
  if (lat > 55 || (lat > 48 && lon > -70 && lon < -45)) return BIOMES.boreal;
  if ((lat > 29 && lat < 46 && lon > -11 && lon < 38) ||
      (lat > 31 && lat < 39 && lon < -115) ||
      (lat < -30 && lat > -36 && lon > 10 && lon < 25) ||
      (lat < -29 && lat > -35 && lon > 110 && lon < 120)) return BIOMES.mediterranean;
  if ((abs < 26 && !(lat < -14 && lon > 8 && lon < 18)) || (lat > 19 && lat < 26 && lon > 110 && lon < 125)) return BIOMES.tropical;
  return BIOMES.temperate;
}
