import * as THREE from "three";
import { createPortScenery } from "./PortScenery";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { LatLon } from "../types";
import { fromLocal, toLocal } from "../geo/math";
import type { World } from "../geo/world";
import { coastalBiome, createElevationSampler, type CoastalBiome } from "./elevation";

type Point = { x: number; z: number };
type Decoration = Point & { y: number; size: number; seed: number };
const fract = (v: number) => v - Math.floor(v);
const hash = (x: number, z: number) => fract(Math.sin(x * 127.1 + z * 311.7) * 43758.5453123);
function noise(x: number, z: number) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = fract(x), fz = fract(z), u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  return THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(hash(ix, iz), hash(ix + 1, iz), u),
    THREE.MathUtils.lerp(hash(ix, iz + 1), hash(ix + 1, iz + 1), u), v,
  );
}
function fbm(x: number, z: number) {
  return noise(x, z) * 0.57 + noise(x * 2.07 + 17, z * 2.07 - 8) * 0.28 + noise(x * 4.23 - 9, z * 4.23 + 21) * 0.15;
}

const texturePixels: Partial<Record<"rock" | "concrete", Uint8Array>> = {};

/** Original deterministic texture, generated locally; no network assets or external licenses. */
function surfaceTexture(kind: "rock" | "concrete") {
  const size = 256, data = texturePixels[kind] ?? new Uint8Array(size * size * 4);
  if (!texturePixels[kind]) for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const sx = Math.sin(x / size * Math.PI * 2), cx = Math.cos(x / size * Math.PI * 2);
      const sy = Math.sin(y / size * Math.PI * 2), cy = Math.cos(y / size * Math.PI * 2);
      const broad = fbm(sx * 3 + sy * 2, cx * 3 + cy * 2);
      const grain = hash(x, y);
      const fissure = noise(x * 0.08 + broad * 2, y * 0.08 - broad * 2);
      const value = kind === "rock"
        ? 133 + broad * 75 + grain * 24 + fissure * 19
        : 172 + broad * 41 + grain * 19;
      const i = (y * size + x) * 4;
      data[i] = value;
      data[i + 1] = value * (kind === "rock" ? 0.96 : 0.98);
      data[i + 2] = value * (kind === "rock" ? 0.89 : 0.96);
      data[i + 3] = 255;
    }
  }
  texturePixels[kind] = data;
  // Only immutable CPU pixels are cached; every scene owns/disposes its GPU texture.
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function clip(input: Point[], radius: number) {
  let output = input;
  for (const [axis, sign] of [["x", 1], ["x", -1], ["z", 1], ["z", -1]] as const) {
    const vertices = output;
    output = [];
    if (!vertices.length) break;
    for (let i = 0; i < vertices.length; i++) {
      const a = vertices[i], b = vertices[(i + 1) % vertices.length];
      const ina = a[axis] * sign <= radius, inb = b[axis] * sign <= radius;
      if (ina) output.push(a);
      if (ina !== inb) {
        const t = (sign * radius - a[axis]) / (b[axis] - a[axis]);
        output.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t });
      }
    }
  }
  return output;
}

function shoreDistance(p: Point, boundary: Point[], radius: number): number {
  let result = Infinity;
  for (let i = 0; i < boundary.length; i++) {
    const a = boundary[i], b = boundary[(i + 1) % boundary.length];
    // Clipping the rendering patch must not invent a coastline at its outer edge.
    if ((Math.abs(a.x) === radius && a.x === b.x) || (Math.abs(a.z) === radius && a.z === b.z)) continue;
    const dx = b.x - a.x, dz = b.z - a.z, den = dx * dx + dz * dz;
    const t = den ? THREE.MathUtils.clamp(((p.x - a.x) * dx + (p.z - a.z) * dz) / den, 0, 1) : 0;
    const ex = p.x - a.x - t * dx, ez = p.z - a.z - t * dz;
    result = Math.min(result, ex * ex + ez * ez);
  }
  return Math.sqrt(result);
}

/** DEM defines inland relief. A narrow transition reconciles surveyed heights
 * with the game's coarser horizontal coast, without changing land/collision. */
function surfaceHeight(point: LatLon, distance: number, dem: number | undefined, biome: CoastalBiome): number {
  const inland = THREE.MathUtils.smoothstep(distance, 0, 350);
  if (dem !== undefined) {
    const height = Math.max(1.2, dem), shore = 1.2 + Math.min(8, Math.max(0, dem) * .035);
    return THREE.MathUtils.lerp(Math.min(height, shore), height, inland);
  }
  // Explicitly decorative fallback only outside the bundled survey patches.
  const ridge = fbm(point.lon * 19.3, point.lat * 26.1);
  return 1.2 + inland * biome.fallbackRelief * Math.pow(ridge, 1.7);
}

/** Share this callback with port scenery so buildings use the same shore/DEM surface. */
export function createTerrainSurfaceSampler(world: World, origin: LatLon, radius = 18000): (point: LatLon) => number {
  const rings = world.polygonsNear(origin, radius * 1.45).map(polygon => clip(polygon.map(p => toLocal(p, origin)), radius));
  const elevation = createElevationSampler(origin, radius * 1.45), biome = coastalBiome(origin);
  return point => {
    if (!world.isLand(point)) return 0;
    const local = toLocal(point, origin);
    let distance = Infinity;
    for (const ring of rings) distance = Math.min(distance, shoreDistance(local, ring, radius));
    return surfaceHeight(point, distance, elevation(point), biome);
  };
}

export function createTerrain(world: World, origin: LatLon, radius = 18000) {
  const group = new THREE.Group();
  group.name = "Shared coastline with surveyed regional relief";
  const positions: number[] = [], colors: number[] = [], uvs: number[] = [], indices: number[] = [];
  const cliffPositions: number[] = [], cliffColors: number[] = [], cliffUvs: number[] = [];
  const shrubs: Decoration[] = [], rocks: Decoration[] = [], trees: Decoration[] = [];
  const rockTexture = surfaceTexture("rock"), concreteTexture = surfaceTexture("concrete");
  const offset = { x: origin.lon * 78626.79, z: -origin.lat * 111195.08 };
  const biome = coastalBiome(origin), elevation = createElevationSampler(origin, radius * 1.45);
  const color = new THREE.Color(), limestone = new THREE.Color(biome.stone), scrub = new THREE.Color(biome.scrub), dryGrass = new THREE.Color(biome.grass), snow = new THREE.Color("#dce3e1");
  let boundary: Point[] = [];
  const sampleCache = new Map<number, { y: number; distance: number; vegetation: number; vertexIndex?: number }>();
  const distanceToShore = function distanceToShore(p: Point) {
    return shoreDistance(p, boundary, radius);
  };
  // Survey-derived elevation never changes the chart/collision footprint.
  const sample = function sample(p: Point): { y: number; distance: number; vegetation: number; vertexIndex?: number } {
    const key = Math.round(p.x * 200) * 8000001 + Math.round(p.z * 200);
    const cached = sampleCache.get(key);
    if (cached) return cached;
    const x = p.x + offset.x, z = p.z + offset.z, distance = distanceToShore(p);
    const geographic = fromLocal(p.x, p.z, origin);
    const y = surfaceHeight(geographic, distance, elevation(geographic), biome);
    const vegetation = fbm(x * 0.006, z * 0.006);
    const result = { y, distance, vegetation };
    sampleCache.set(key, result);
    return result;
  };
  let shrubCount = 0, rockCount = 0, treeCount = 0;
  function retain(list: Decoration[], p: Decoration, cap: number, count: number) {
    if (list.length < cap) list.push(p);
    else {
      const index = Math.floor(hash(p.x * 1.7, p.z * 2.3) * count);
      if (index < cap) list[index] = p;
    }
  }
  const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 });
  const splitEdge = (a: Point, b: Point) => {
    const mx = (a.x + b.x) * 0.5, mz = (a.z + b.z) * 0.5;
    const radiusSquared = mx * mx + mz * mz;
    // Keep the full nearby coast/building resolution. Beyond 3 km, tessellation
    // approaches the 700 m survey spacing rather than oversampling its smooth grid.
    const farScale = THREE.MathUtils.clamp(radiusSquared / 9000000, 1, 4);
    const spacingSquared = THREE.MathUtils.clamp(radiusSquared * 0.001156 * farScale, 3025, 1000000);
    const dx = b.x - a.x, dz = b.z - a.z;
    return dx * dx + dz * dz > spacingSquared;
  };
  function addTriangle(a: Point, b: Point, c: Point, depth = 0) {
    const signed = (b.z - a.z) * (c.x - a.x) - (b.x - a.x) * (c.z - a.z);
    if (Math.abs(signed) < 0.001) return;
    // Edge decisions depend only on their endpoints. Adjacent triangles therefore
    // make identical splits, keeping the adaptive mesh watertight without skirts.
    const sa = splitEdge(a, b), sb = splitEdge(b, c), sc = splitEdge(c, a);
    if (depth < 18 && (sa || sb || sc)) {
      const ab = midpoint(a, b), bc = midpoint(b, c), ca = midpoint(c, a);
      const next = (u: Point, v: Point, w: Point) => addTriangle(u, v, w, depth + 1);
      if (sa && sb && sc) { next(a, ab, ca); next(ab, b, bc); next(ca, bc, c); next(ab, bc, ca); }
      else if (sa && sb) { next(b, bc, ab); next(a, ab, c); next(ab, bc, c); }
      else if (sa && sc) { next(a, ab, ca); next(ab, b, c); next(ca, ab, c); }
      else if (sb && sc) { next(c, ca, bc); next(a, b, ca); next(b, bc, ca); }
      else if (sa) { next(a, ab, c); next(ab, b, c); }
      else if (sb) { next(b, bc, a); next(bc, c, a); }
      else { next(c, ca, b); next(ca, a, b); }
      return;
    }
    for (const p of signed >= 0 ? [a, b, c] : [a, c, b]) {
      const s = sample(p);
      if (s.vertexIndex === undefined) {
        s.vertexIndex = positions.length / 3;
        const vegetation = biome.vegetation * THREE.MathUtils.smoothstep(s.distance, 15, 160) * THREE.MathUtils.smoothstep(s.vegetation, 0.26, 0.64);
        color.copy(limestone).lerp(dryGrass, vegetation * 0.48).lerp(scrub, vegetation * 0.83);
        color.multiplyScalar(0.78 + s.vegetation * 0.31);
        color.lerp(snow, THREE.MathUtils.smoothstep(s.y, biome.snowLine, biome.snowLine + (biome.snowBlendRange ?? 300)) * .88);
        positions.push(p.x, s.y, p.z); colors.push(color.r, color.g, color.b); uvs.push(p.x / 18, p.z / 18);
      }
      indices.push(s.vertexIndex);
    }
    const r1 = Math.sqrt(hash(a.x + offset.x, c.z + offset.z)), r2 = hash(c.x + 93, b.z - 31);
    const wa = 1 - r1, wb = r1 * (1 - r2), wc = r1 * r2;
    const p = { x: a.x * wa + b.x * wb + c.x * wc, z: a.z * wa + b.z * wb + c.z * wc };
    const seed = hash(p.x + offset.x, p.z + offset.z);
    if (p.x * p.x + p.z * p.z < 7500 * 7500 && Math.abs(signed) > 15 && seed > 0.76) {
      // Decoration points need only shore clearance/vegetation, not a new height-field sample.
      const shoreDistance = distanceToShore(p), size = 2.1 + seed * 4.2;
      if (shoreDistance > size * 2) {
        const vegetation = fbm((p.x + offset.x) * 0.006, (p.z + offset.z) * 0.006);
        const decoration = { ...p, y: sample(a).y * wa + sample(b).y * wb + sample(c).y * wc, size, seed };
        if (shoreDistance < 145 && seed > 0.68) retain(rocks, decoration, 500, ++rockCount);
        else if (biome.trees !== "none" && decoration.y < biome.snowLine * .8 && shoreDistance > 65 && vegetation > 0.53 && seed > .94 - .1 * biome.treeDensity) retain(trees, decoration, 600, ++treeCount);
        else if (biome.vegetation > 0 && vegetation > .8 - biome.vegetation * .42 && decoration.y < biome.snowLine) retain(shrubs, decoration, 2400, ++shrubCount);
      }
    }
  }
  for (const polygon of world.polygonsNear(origin, radius * 1.45)) {
    const ring = clip(polygon.map((p) => toLocal(p, origin)), radius);
    if (ring.length < 3) continue;
    boundary = ring;
    sampleCache.clear();
    const triangles = THREE.ShapeUtils.triangulateShape(ring.map((p) => new THREE.Vector2(p.x, p.z)), []);
    for (const t of triangles) addTriangle(ring[t[0]], ring[t[1]], ring[t[2]]);
    // Subdivide cliff faces along the exact coast; vertical strata never protrude into navigable water.
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length];
      const edgePoints: Point[] = [];
      const subdivideCoast = (p: Point, q: Point, depth = 0) => {
        if (depth < 18 && splitEdge(p, q)) {
          const mid = midpoint(p, q);
          subdivideCoast(p, mid, depth + 1); subdivideCoast(mid, q, depth + 1);
        } else edgePoints.push(p);
      };
      subdivideCoast(a, b); edgePoints.push(b);
      for (let j = 0; j < edgePoints.length - 1; j++) {
        const p = edgePoints[j], q = edgePoints[j + 1];
        const uP = Math.hypot(p.x - a.x, p.z - a.z) / 16, uQ = Math.hypot(q.x - a.x, q.z - a.z) / 16;
        const yp = sample(p).y, yq = sample(q).y;
        const layers = [-10, 0.1, Math.min(yp, yq) * 0.5];
        for (let layer = 0; layer < layers.length; layer++) {
          const low = layers[layer], topP = layer === layers.length - 1 ? yp : layers[layer + 1], topQ = layer === layers.length - 1 ? yq : layers[layer + 1];
          const vertices = [[p.x, low, p.z], [q.x, topQ, q.z], [p.x, topP, p.z], [p.x, low, p.z], [q.x, low, q.z], [q.x, topQ, q.z]];
          color.copy(limestone).multiplyScalar(layer === 0 ? .43 : layer === 1 ? .73 : .94);
          color.multiplyScalar(0.87 + hash(i, j) * 0.16);
          for (let k = 0; k < vertices.length; k++) {
            cliffPositions.push(...vertices[k]); cliffColors.push(color.r, color.g, color.b);
            cliffUvs.push([1, 4, 5].includes(k) ? uQ : uP, vertices[k][1] / 16);
          }
        }
      }
    }
  }
  function meshFromArrays(pos: number[], col: number[], uv: number[], smooth: boolean) {
    if (!pos.length) return;
    let geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    if (smooth) geometry.setIndex(indices);
    geometry.computeVertexNormals();
    if (smooth) {
      const normals = geometry.getAttribute("normal");
      const source = normals.array as Float32Array;
      const averaged = new Float32Array(source.length), weights = new Float32Array(normals.count);
      for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i], b = indices[i + 1], c = indices[i + 2];
        for (const vertex of [a, b, c]) {
          for (let axis = 0; axis < 3; axis++) averaged[vertex * 3 + axis] += source[a * 3 + axis] + source[b * 3 + axis] + source[c * 3 + axis];
          weights[vertex] += 3;
        }
      }
      for (let i = 0; i < normals.count; i++) {
        const weight = weights[i] || 1;
        const x = source[i * 3] * 0.45 + averaged[i * 3] / weight * 0.55;
        const y = source[i * 3 + 1] * 0.45 + averaged[i * 3 + 1] / weight * 0.55;
        const z = source[i * 3 + 2] * 0.45 + averaged[i * 3 + 2] / weight * 0.55;
        const inverse = 1 / Math.sqrt(x * x + y * y + z * z);
        normals.setXYZ(i, x * inverse, y * inverse, z * inverse);
      }
    }
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, map: rockTexture, bumpMap: rockTexture, bumpScale: smooth ? 0.14 : 0.12, roughness: 0.96, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  meshFromArrays(positions, colors, uvs, true);
  meshFromArrays(cliffPositions, cliffColors, cliffUvs, false);
  const dummy = new THREE.Object3D();
  function instances(items: Decoration[], geometry: THREE.BufferGeometry, material: THREE.MeshStandardMaterial, transform: (p: Decoration, i: number) => void, tint?: (p: Decoration) => string) {
    if (!items.length) { geometry.dispose(); material.dispose(); return; }
    const mesh = new THREE.InstancedMesh(geometry, material, items.length);
    items.forEach((p, i) => {
      dummy.rotation.set(0, p.seed * Math.PI * 2, 0);
      transform(p, i); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
      if (tint) mesh.setColorAt(i, new THREE.Color(tint(p)));
    });
    mesh.receiveShadow = true; mesh.castShadow = true; group.add(mesh);
  }
  const rough = (c: string) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.96 });
  instances(shrubs, new THREE.IcosahedronGeometry(1, 1), rough(biome.scrub), (p) => {
    const scale = biome.trees === "none" ? .43 : 1;
    dummy.position.set(p.x, p.y + p.size * .25 * scale, p.z); dummy.scale.set(p.size * scale, p.size * .43 * scale, p.size * .74 * scale);
  }, p => p.seed > .9 ? "#b5b59e" : "#d0d3bc");
  const rockGeometry = new THREE.IcosahedronGeometry(1, 1), rp = rockGeometry.attributes.position;
  for (let i = 0; i < rp.count; i++) {
    const scale = 0.82 + hash(rp.getX(i) * 7, rp.getY(i) * 9 + rp.getZ(i)) * 0.31;
    rp.setXYZ(i, rp.getX(i) * scale, rp.getY(i) * scale, rp.getZ(i) * scale);
  }
  rockGeometry.computeVertexNormals();
  instances(rocks, rockGeometry, new THREE.MeshStandardMaterial({ color: biome.stone, map: rockTexture, roughness: 1 }), p => {
    dummy.position.set(p.x, p.y + p.size * 0.14, p.z); dummy.scale.set(p.size, p.size * 0.68, p.size * 0.78);
  });
  instances(trees, new THREE.CylinderGeometry(0.14, 0.22, 1, 5), rough("#655a43"), p => {
    const height = biome.trees === "palm" ? 1.8 : 1.1;
    dummy.position.set(p.x, p.y + p.size * height / 2, p.z); dummy.scale.set(p.size * .6, p.size * height, p.size * .6);
  });
  if (biome.trees === "palm") {
    const palms = trees.filter(p => p.seed > .9), broadleaf = trees.filter(p => p.seed <= .9);
    for (let frond = 0; frond < 7; frond++) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute([
        0, 0, 0, .56, .16, -.19, 1.35, -.4, 0,
        0, 0, 0, 1.35, -.4, 0, .56, .16, .19,
      ], 3)); geometry.computeVertexNormals();
      const foliage = rough(biome.foliage); foliage.side = THREE.DoubleSide;
      instances(palms, geometry, foliage, p => {
        dummy.rotation.y = p.seed * 7 + frond * Math.PI * 2 / 7;
        dummy.position.set(p.x, p.y + p.size * 1.8, p.z); dummy.scale.setScalar(p.size * .74);
      });
    }
    for (let lobe = 0; lobe < 3; lobe++) instances(broadleaf, new THREE.IcosahedronGeometry(1, 1), rough(biome.foliage), p => {
      const angle = lobe * 2.09 + p.seed * 5;
      dummy.position.set(p.x + Math.cos(angle) * p.size * .25, p.y + p.size * (1.75 + lobe * .18), p.z + Math.sin(angle) * p.size * .25);
      dummy.scale.set(p.size * .7, p.size * .58, p.size * .67);
    });
  } else if (biome.trees === "conifer") {
    for (let tier = 0; tier < 3; tier++) instances(trees, new THREE.ConeGeometry(1, 2, 7), rough(biome.foliage), p => {
      dummy.position.set(p.x, p.y + p.size * (1.1 + tier * .4), p.z);
      dummy.scale.set(p.size * (.61 - tier * .14), p.size * .55, p.size * (.61 - tier * .14));
    });
  } else {
    // Umbrella pines in Mediterranean scrub; fuller crowns on temperate coasts.
    for (let lobe = 0; lobe < 3; lobe++) instances(trees, new THREE.IcosahedronGeometry(1, 1), rough(biome.foliage), p => {
      const angle = lobe * 2.09 + p.seed * 5, broad = biome.trees === "broadleaf";
      dummy.position.set(p.x + Math.cos(angle) * p.size * .29, p.y + p.size * (1.3 + lobe * .12), p.z + Math.sin(angle) * p.size * .29);
      dummy.scale.set(p.size * .8, p.size * (broad ? .65 : .39), p.size * .66);
    });
  }

  const concrete = new THREE.MeshStandardMaterial({ color: "#a7a49a", map: concreteTexture, bumpMap: concreteTexture, bumpScale: 0.055, roughness: 0.94 });
  const wall = new THREE.MeshStandardMaterial({ color: "#716e60", map: rockTexture, bumpMap: rockTexture, bumpScale: 0.2, roughness: 0.98 });
  const plaster = new THREE.MeshStandardMaterial({ color: "#c3bb9f", map: concreteTexture, roughness: 0.98 });
  const roof = rough("#755849"), metal = new THREE.MeshStandardMaterial({ color: "#56625e", metalness: 0.6, roughness: 0.48 });
  const rubber = rough("#202722"), timber = rough("#786244"), rust = rough("#8e5b36"), white = rough("#d3cbb1"), paint = rough("#b89a4e");
  const glass = new THREE.MeshStandardMaterial({ color: "#284447", metalness: 0.52, roughness: 0.16 });
  const blue = rough("#385667"), red = rough("#8a4f3b"), shadow = rough("#30372f");
  function cube(g: THREE.Group, w: number, h: number, d: number, x: number, y: number, z: number, material: THREE.Material) {
    const geometry = new THREE.BoxGeometry(w, h, d);
    const uv = geometry.attributes.uv;
    const faces = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let i = 0; i < uv.count; i++) { const f = faces[Math.floor(i / 4)]; uv.setXY(i, uv.getX(i) * f[0] / 8, uv.getY(i) * f[1] / 8); }
    const m = new THREE.Mesh(geometry, material); m.position.set(x, y, z); m.receiveShadow = m.castShadow = true; g.add(m); return m;
  }
  function cylinder(g: THREE.Group, r: number, h: number, x: number, y: number, z: number, material: THREE.Material, top = r) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(top, r, h, 10), material); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m;
  }
  function beam(g: THREE.Group, a: THREE.Vector3, b: THREE.Vector3, radius: number, material: THREE.Material) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), 6), material);
    m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); m.castShadow = true; g.add(m); return m;
  }
  for (const dock of world.docks) {
    const p = toLocal(dock.center, origin);
    if (Math.hypot(p.x, p.z) > radius) continue;
    const quay = new THREE.Group(); quay.position.set(p.x, 0, p.z); quay.rotation.y = -dock.heading; group.add(quay);
    const half = dock.width / 2, length = dock.length;
    const polarDock = dock.center.lat < -60 || dock.portId === "cape-horn";
    // All solid geometry stays on the original 300 × 32 m collision footprint.
    cube(quay, dock.width, 2.675, length, 0, -1.5625, 0, wall);
    cube(quay, dock.width, 1.375, length, 0, 1.1125, 0, wall);
    cube(quay, dock.width, 0.35, length, 0, 1.97, 0, concrete);
    cube(quay, dock.width, 0.65, length, 0, 0.10, 0, shadow);
    for (const side of [-1, 1]) {
      cube(quay, 0.7, 0.22, length - 0.2, side * (half - 0.4), 2.22, 0, white);
      cube(quay, 0.11, 0.012, length - 5, side * (half - 2.8), 2.16, 0, paint);
    }
    // Individual pavement panels, weathered quay blocks and recessed edge joints provide scale.
    for (let z = -length / 2 + 5; z < length / 2; z += 9) {
      cube(quay, dock.width - 1.5, 0.018, 0.025, 0, 2.156, z, shadow);
      for (const side of [-1, 1]) cube(quay, 0.02, 2.2, 0.055, side * (half - 0.012), 0.94, z, shadow);
    }
    for (let i = 0; i < 13; i++) {
      const z = (i / 12 - 0.5) * (length - 12);
      for (const side of [-1, 1]) {
        const x = side * (half - 1.2);
        cube(quay, 0.94, 0.12, 0.85, x, 2.24, z, metal);
        cylinder(quay, 0.24, 0.7, x, 2.61, z, metal, 0.19);
        cylinder(quay, 0.36, 0.17, x, 2.96, z, metal);
        // Rubber cylinders are entirely inside the collider at the quay edge.
        cylinder(quay, 0.38, 1.95, side * (half - 0.38), 0.7, z, rubber);
        for (const dz of [-0.31, 0.31]) cube(quay, 0.09, 2.1, 0.11, side * (half - 0.045), 0.72, z + dz, metal);
      }
    }
    function building(z: number, len: number, height: number, withOffice: boolean) {
      const width = dock.width * 0.42;
      cube(quay, width, height, len, 1.9, 2.17 + height / 2, z, plaster);
      cube(quay, width + 0.3, 0.34, len + 0.8, 1.9, 2.17 + height, z, roof);
      cube(quay, width + 0.08, 0.7, len + 0.08, 1.9, 2.5, z, wall);
      for (const side of [-1, 1]) {
        const x = 1.9 + side * (width / 2 + 0.028);
        for (let dz = -len / 2 + 4; dz < len / 2 - 2; dz += 6) {
          cube(quay, 0.08, 1.45, 2.65, x, height + 0.3, z + dz, white);
          cube(quay, 0.10, 1.19, 2.36, x + side * 0.025, height + 0.3, z + dz, glass);
          cube(quay, 0.14, 1.25, 0.08, x + side * 0.065, height + 0.3, z + dz, white);
          cube(quay, 0.14, 0.07, 2.4, x + side * 0.065, height + 0.3, z + dz, white);
        }
        for (let dz = -len / 2 + 0.3; dz < len / 2; dz += 7.5) cube(quay, 0.13, height, 0.15, x, 2.17 + height / 2, z + dz, concrete);
        const doorZ = z - len * 0.17;
        cube(quay, 0.13, 3.3, 4.4, x + side * 0.05, 3.84, doorZ, blue);
        for (let y = 2.4; y < 5.5; y += 0.38) cube(quay, 0.16, 0.045, 4.25, x + side * 0.07, y, doorZ, metal);
        const canopy = cube(quay, 2.0, 0.14, 6, x + side * 0.8, 5.9, doorZ, metal);
        canopy.rotation.z = side * 0.06;
      }
      for (const dz of [-len * 0.3, len * 0.3]) { cylinder(quay, 0.28, 1.0, 2, height + 2.8, z + dz, metal); cylinder(quay, 0.42, 0.15, 2, height + 3.3, z + dz, metal); }
      if (withOffice) {
        cube(quay, width * 0.68, 3.1, 8, 1.9, height + 3.75, z + 7, plaster);
        cube(quay, width * 0.73, 0.25, 8.6, 1.9, height + 5.42, z + 7, roof);
        for (const side of [-1, 1]) cube(quay, 0.08, 1.6, 5.8, 1.9 + side * width * 0.345, height + 4.0, z + 7, glass);
      }
    }
    if (polarDock) {
      // Keep the gameplay platform/collider visible, with only a small service
      // hut and drums. Antarctic anchorages are not invented commercial cities.
      cube(quay, 7, 3.2, 9, 2, 3.77, -18, red);
      cube(quay, 7.4, .25, 9.5, 2, 5.50, -18, metal);
      cube(quay, .12, 1.1, 1.5, -1.55, 4.05, -18, glass);
      for (let i = 0; i < 3; i++) cylinder(quay, .32, .9, 4.2, 2.63, -6 + i, blue);
    } else {
    building(-length * 0.28, 37, 5.9, true);
    building(length * 0.25, 29, 5.1, false);
    // Compact working harbor equipment, distinct from the much larger vessel itself.
    for (let i = 0; i < 3; i++) {
      const z = length * 0.06 + i * 7.3;
      cube(quay, 2.4, 2.55, 6.1, 6.5, 3.44, z, i % 2 ? red : blue);
      for (let dz = -2.8; dz < 3; dz += 0.45) for (const side of [-1, 1]) cube(quay, 0.06, 2.37, 0.075, 6.5 + side * 1.22, 3.44, z + dz, metal);
    }
    for (const z of [-123, -34, 50, 124]) {
      cylinder(quay, 0.115, 7.6, -5.7, 5.95, z, metal, 0.065);
      beam(quay, new THREE.Vector3(-5.7, 9.55, z), new THREE.Vector3(-8, 9.45, z), 0.09, metal);
      cube(quay, 0.95, 0.18, 0.38, -7.7, 9.38, z, metal);
      cube(quay, 0.82, 0.03, 0.3, -7.7, 9.27, z, white);
      cube(quay, 0.55, 0.74, 0.65, -6, 2.53, z + 2, blue);
    }
    for (const z of [-length / 2 + 12, length / 2 - 12]) {
      cube(quay, 1.1, 0.15, 3.1, 4.8, 2.75, z, timber);
      cube(quay, 0.13, 0.6, 3.1, 5.28, 3.07, z, timber);
      for (const dz of [-1.1, 1.1]) cube(quay, 0.8, 0.53, 0.08, 4.8, 2.4, z + dz, metal);
    }
    // Small lattice-jib service crane. Its complete footprint remains over the quay.
    const craneX = -1.3, craneZ = -21;
    cylinder(quay, 1.6, 0.5, craneX, 2.45, craneZ, concrete);
    cylinder(quay, 0.62, 6.6, craneX, 5.9, craneZ, paint, 0.43);
    cube(quay, 2.1, 1.8, 2.0, craneX, 8.72, craneZ, paint);
    cube(quay, 0.08, 1.1, 1.3, craneX - 1.07, 8.9, craneZ - 0.1, glass);
    const pivot = new THREE.Vector3(craneX, 9.6, craneZ), tip = new THREE.Vector3(-11.4, 16.3, craneZ);
    for (const side of [-1, 1]) {
      const a = pivot.clone().add(new THREE.Vector3(0, 0, side * 0.65)), b = tip.clone().add(new THREE.Vector3(0, 0, side * 0.22));
      beam(quay, a, b, 0.11, paint);
      beam(quay, a.clone().add(new THREE.Vector3(0, 0.9, 0)), b.clone().add(new THREE.Vector3(0, 0.45, 0)), 0.09, paint);
      for (let i = 0; i < 6; i++) {
        const p1 = a.clone().lerp(b, i / 6), p2 = a.clone().lerp(b, (i + 1) / 6);
        if (i % 2) p1.y += 0.85; else p2.y += 0.85;
        beam(quay, p1, p2, 0.065, paint);
      }
    }
    beam(quay, new THREE.Vector3(-0.8, 11.7, craneZ), tip, 0.038, metal);
    beam(quay, tip, new THREE.Vector3(-11.4, 6.5, craneZ), 0.027, metal);
    cylinder(quay, 0.19, 0.4, -11.4, 6.3, craneZ, rust);
    }
    // Sparse service railing at the two ends; clear working access along the quay.
    for (const end of [-1, 1]) {
      const z = end * (length / 2 - 0.9);
      for (let x = -half + 1; x <= half - 1; x += 3) cylinder(quay, 0.035, 1.08, x, 2.72, z, metal);
      for (const y of [2.7, 3.23]) beam(quay, new THREE.Vector3(-half + 1, y, z), new THREE.Vector3(half - 1, y, z), 0.031, metal);
    }
    for (let i = 0; i < 2; i++) {
      const buoy = new THREE.Group(); buoy.position.set(-half - 55, 0, (i - 0.5) * (length + 95)); quay.add(buoy);
      const buoyMat = new THREE.MeshStandardMaterial({ color: i ? "#a83c28" : "#1b6650", roughness: 0.58, metalness: 0.25 });
      cylinder(buoy, 1.0, 1.15, 0, 0.35, 0, buoyMat, 0.62);
      cylinder(buoy, 0.13, 2.3, 0, 1.9, 0, buoyMat, 0.10);
      cylinder(buoy, 0.49, 0.75, 0, 3.2, 0, buoyMat, i ? 0.49 : 0);
      cylinder(buoy, 0.1, 0.12, 0, 3.71, 0, white);
    }
  }
  // Bake static harbor pieces into a few material batches instead of hundreds of draw calls.
  const dockGroups = group.children.filter((child): child is THREE.Group => child instanceof THREE.Group);
  group.updateMatrixWorld(true);
  for (const harbor of dockGroups) {
    const byMaterial = new Map<THREE.Material, THREE.BufferGeometry[]>();
    harbor.traverse((child) => {
      if (!(child instanceof THREE.Mesh) || Array.isArray(child.material)) return;
      const geometry = child.geometry.clone().applyMatrix4(child.matrixWorld);
      const geometries = byMaterial.get(child.material) ?? [];
      geometries.push(geometry); byMaterial.set(child.material, geometries);
      child.geometry.dispose();
    });
    group.remove(harbor);
    for (const [material, geometries] of byMaterial) {
      const geometry = mergeGeometries(geometries);
      for (const part of geometries) part.dispose();
      if (!geometry) continue;
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = mesh.receiveShadow = true;
      group.add(mesh);
    }
  }
  group.add(createPortScenery(world, origin, radius, createTerrainSurfaceSampler(world, origin, radius)));
  return group;
}
