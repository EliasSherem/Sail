import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { ShipConfig } from "../types";
import { buildSpiritModel } from "./spiritModel";
import { finishGrain, vesselLettering } from "./vesselFinishes";

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
type Palette = ReturnType<typeof makePalette>;

/** Locally drawn timber: individual planks, caulking, staggered end joints and grain. */
function teakTexture() {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  let seed = 73;
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  ctx.fillStyle = "#ad8150";
  ctx.fillRect(0, 0, 256, 1024);
  for (let plank = 0; plank < 8; plank++) {
    const tone = Math.floor(random() * 24);
    ctx.fillStyle = `rgb(${163 + tone},${115 + tone},${67 + tone})`;
    ctx.fillRect(plank * 32 + 1, 0, 30, 1024);
    ctx.fillStyle = "#534631";
    ctx.fillRect(plank * 32, 0, 1.5, 1024);
    for (let joint = 0; joint < 3; joint++) {
      const y = (joint * 410 + (plank % 3) * 137) % 1024;
      ctx.fillRect(plank * 32, y, 32, 1.6);
      ctx.fillStyle = "#795b39";
      ctx.fillRect(plank * 32 + 7, y + 5, 2, 2);
      ctx.fillRect(plank * 32 + 23, y + 5, 2, 2);
      ctx.fillStyle = "#534631";
    }
    for (let grain = 0; grain < 26; grain++) {
      const x = plank * 32 + random() * 30;
      ctx.strokeStyle = `rgba(${random() > 0.5 ? "79,48,19" : "233,199,143"},0.16)`;
      ctx.lineWidth = random() + 0.3;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + 3, 300, x - 3, 700, x + random() * 4, 1024);
      ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

function makePalette() {
  const texture = teakTexture(), grain = finishGrain();
  return {
    white: new THREE.MeshPhysicalMaterial({ color: "#e9ebe6", roughness: 0.28, roughnessMap: grain, metalness: 0.025, clearcoat: 0.95, clearcoatRoughness: 0.12 }),
    ivory: new THREE.MeshStandardMaterial({ color: "#e6d9bb", roughness: 0.72 }),
    cushion: new THREE.MeshStandardMaterial({ color: "#e1d3b7", roughness: 0.95 }),
    navy: new THREE.MeshPhysicalMaterial({ color: "#183848", roughness: 0.28, roughnessMap: grain, metalness: 0.12, clearcoat: 0.95, clearcoatRoughness: .13 }),
    glass: new THREE.MeshPhysicalMaterial({ color: "#244c59", roughness: 0.075, metalness: 0.20, clearcoat: 1, clearcoatRoughness: 0.035, envMapIntensity: 1.25, transparent: true, opacity: 0.67, depthWrite: false, side: THREE.DoubleSide }),
    teak: new THREE.MeshStandardMaterial({ color: "#d6b17a", map: texture, roughness: 0.86, bumpMap: texture, bumpScale: 0.008 }),
    metal: new THREE.MeshStandardMaterial({ color: "#bac9cf", roughness: 0.25, roughnessMap: grain, metalness: 0.94 }),
    black: new THREE.MeshStandardMaterial({ color: "#182022", roughness: 0.82 }),
    orange: new THREE.MeshStandardMaterial({ color: "#d86528", roughness: 0.6 }),
    deck: new THREE.MeshStandardMaterial({ color: "#596b69", roughness: 0.94, roughnessMap: grain, bumpMap: grain, bumpScale: .007 }),
    red: new THREE.MeshStandardMaterial({ color: "#9c4337", roughness: 0.61, roughnessMap: grain, metalness: 0.15 }),
  };
}

function mesh(g: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.Material) {
  const object = new THREE.Mesh(geometry, material);
  object.castShadow = !material.transparent;
  object.receiveShadow = true;
  g.add(object);
  return object;
}

/** Bevelled components eliminate the perfect razor edges of a block prototype. */
function box(g: THREE.Group, x: number, y: number, z: number, w: number, h: number, d: number, material: THREE.Material, radius = 0) {
  let geometry: THREE.BufferGeometry;
  if (radius > 0) {
    const r = Math.min(radius, w * 0.25, h * 0.25, d * 0.25);
    const shape = new THREE.Shape();
    const hw = w / 2 - r, hh = h / 2 - r;
    shape.moveTo(-hw, -hh); shape.lineTo(hw, -hh); shape.lineTo(hw, hh); shape.lineTo(-hw, hh); shape.closePath();
    geometry = new THREE.ExtrudeGeometry(shape, { depth: d - 2 * r, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: r, bevelThickness: r, curveSegments: 8 });
    geometry.center();
  } else geometry = new THREE.BoxGeometry(w, h, d);
  const object = mesh(g, geometry, material);
  object.position.set(x, y, z);
  return object;
}

function rod(g: THREE.Group, a: THREE.Vector3, b: THREE.Vector3, radius: number, material: THREE.Material) {
  const object = mesh(g, new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), 10), material);
  object.position.copy(a).add(b).multiplyScalar(0.5);
  object.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize());
  return object;
}
function tube(g: THREE.Group, points: THREE.Vector3[], radius: number, material: THREE.Material, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points, closed, "centripetal");
  return mesh(g, new THREE.TubeGeometry(curve, Math.max(24, points.length * 3), radius, 8, closed), material);
}
function sphere(g: THREE.Group, x: number, y: number, z: number, radius: number, material: THREE.Material) {
  const object = mesh(g, new THREE.SphereGeometry(radius, 16, 12), material);
  object.position.set(x, y, z);
  return object;
}

const hullStations = [V(0, 0, 0), V(0.055, 0.24, 0), V(0.19, 0.65, 0), V(0.38, 0.94, 0), V(0.61, 1, 0), V(0.84, 0.98, 0), V(1, 0.88, 0)];
const hullCurve = new THREE.SplineCurve(hullStations.map((p) => new THREE.Vector2(p.x, p.y)));
const hullProfile = hullCurve.getPoints(192);
function halfBeam(t: number, b: number, fullStern = false) {
  // The longitudinal spline is sampled densely; the elliptical sections are smoothly shaded.
  let i = 0;
  while (i < hullProfile.length - 2 && hullProfile[i + 1].x < t) i++;
  const a = hullProfile[i], c = hullProfile[i + 1];
  const width = THREE.MathUtils.lerp(a.y, c.y, THREE.MathUtils.clamp((t - a.x) / Math.max(0.0001, c.x - a.x), 0, 1));
  return Math.max(0.0008, width * b * 0.5 * (fullStern ? 1 : 1 - 0.035 * Math.pow(t, 4)));
}
function sheer(t: number, d: number, b: number) { return d + Math.pow(1 - t, 3.4) * b * 0.11; }
function hullSide(ship: ShipConfig, d: number, t: number, y: number, side: number, outset = .016) {
  const workboat = ship.id === "cargo" || ship.id === "tug";
  const top = sheer(t, d, ship.beam), bottom = -ship.draft * .92 * (.32 + .68 * Math.min(1, t * 7));
  const k = THREE.MathUtils.clamp((top - y) / (top - bottom), 0, 1);
  const angle = Math.acos(Math.pow(k, 1 / (workboat ? .63 : .82)));
  return V(side * (halfBeam(t, ship.beam, workboat) * Math.sin(angle) * (1 - k * (workboat ? .08 : .18)) + outset), y, (t * .97 - .5) * ship.length);
}
function hull(g: THREE.Group, ship: ShipConfig, d: number, material: THREE.Material, p: Palette) {
  const l = ship.length, b = ship.beam, draft = ship.draft * 0.92;
  const n = 64, cross = 28, vertices: number[] = [], uvs: number[] = [], indices: number[] = [];
  const workboat = ship.id === "cargo" || ship.id === "tug";
  for (let i = 0; i <= n; i++) {
    const t = i / n, w = halfBeam(t, b, workboat), deck = sheer(t, d, b), z = (t * 0.97 - 0.5) * l;
    for (let j = 0; j <= cross; j++) {
      const angle = -Math.PI / 2 + (j / cross) * Math.PI;
      const keel = Math.pow(Math.max(0, Math.cos(angle)), workboat ? 0.63 : 0.82);
      const x = w * Math.sin(angle) * (1 - keel * (workboat ? 0.08 : 0.18));
      // The stem curves up into the sharp bow; aft sections flatten into a proper transom.
      const bottom = -draft * (0.32 + 0.68 * Math.min(1, t * 7));
      vertices.push(x, deck - (deck - bottom) * keel, z);
      uvs.push(j / cross, t);
      if (i < n && j < cross) {
        const a = i * (cross + 1) + j, c = a + cross + 1;
        indices.push(a, a + 1, c, a + 1, c + 1, c);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  // Real pigment, wet boot-topping and antifouling share one PBR draw call.
  const paint = (material as THREE.MeshStandardMaterial).clone();
  const topside = paint.color.clone();
  paint.color.set("#ffffff"); paint.vertexColors = true;
  const bottomColor = new THREE.Color(workboat || ship.id === "fishing" ? "#492e2b" : "#263f46");
  const paintHull = (surface: THREE.BufferGeometry) => {
    const position = surface.getAttribute("position"), colors: number[] = [];
    for (let i = 0; i < position.count; i++) {
      const immersion = THREE.MathUtils.smoothstep(-position.getY(i), -.035, .10);
      colors.push(...topside.clone().lerp(bottomColor, immersion).toArray());
    }
    surface.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  };
  paintHull(geometry);
  mesh(g, geometry, paint);
  // Planar transom with its own normals, rather than a rounded and pinched end cap.
  const cap = new THREE.Shape();
  for (let j = 0; j <= cross; j++) {
    const k = (n * (cross + 1) + j) * 3;
    if (j === 0) cap.moveTo(vertices[k], vertices[k + 1]); else cap.lineTo(vertices[k], vertices[k + 1]);
  }
  cap.closePath();
  const capGeometry = new THREE.ShapeGeometry(cap); paintHull(capGeometry);
  const transom = mesh(g, capGeometry, paint);
  transom.position.z = l * 0.47;
  // Deck and raised fiberglass/steel gunwale share the true hull perimeter.
  const dv: number[] = [], duv: number[] = [], di: number[] = [];
  const rim: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, z = (t * 0.97 - 0.5) * l, width = halfBeam(t, b, workboat), y = sheer(t, d, b) + 0.016;
    dv.push(-width * 0.955, y, z, width * 0.955, y, z);
    duv.push(0, t * l / 5, b / 2.3, t * l / 5);
    if (i < n) di.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3);
    rim.push(V(-width, y + 0.025, z));
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute("position", new THREE.Float32BufferAttribute(dv, 3)); dg.setAttribute("uv", new THREE.Float32BufferAttribute(duv, 2)); dg.setIndex(di); dg.computeVertexNormals();
  mesh(g, dg, ship.id === "yacht" || ship.id === "launch" ? p.teak : p.deck);
  rim.push(...rim.slice().reverse().map((a) => V(-a.x, a.y, a.z)));
  tube(g, rim, Math.max(0.035, b * 0.015), ship.id === "tug" ? p.black : p.white, true);
  // A dark boot-top follows the compound surface above the waterline.
  for (const side of [-1, 1]) {
    const stripe: THREE.Vector3[] = [];
    for (let i = 3; i <= n; i++) {
      const t = i / n;
      const y = d * 0.38;
      const top = sheer(t, d, b), bottom = -draft * (0.32 + 0.68 * Math.min(1, t * 7));
      const k = (top - y) / (top - bottom);
      const angle = Math.acos(Math.pow(k, 1 / (workboat ? 0.63 : 0.82)));
      stripe.push(V(side * (halfBeam(t, b, workboat) * Math.sin(angle) * (1 - k * (workboat ? 0.08 : 0.18)) + 0.014), y, (t * 0.97 - 0.5) * l));
    }
    const stripeFinish = ship.id === "yacht" || ship.id === "fishing" ? p.ivory : ship.id === "launch" ? p.orange : p.navy;
    tube(g, stripe, b * (ship.id === "yacht" ? 0.011 : 0.009), stripeFinish);
  }
  const lettering = vesselLettering(ship.name, ship.id === "launch" ? "#18384b" : "#f2eee0",
    ship.id === "cargo" ? "DERIVA SHIPPING" : ship.id === "fishing" ? "PESCA · BRUMA" : ship.id === "tug" ? "PORT SERVICE" : "DERIVA · EXPLORER");
  if (lettering) for (const side of [-1, 1]) {
    const vertices: number[] = [], uv: number[] = [], indices: number[] = [];
    const textHeight = d * .34;
    for (let i = 0; i <= 20; i++) {
      const t = .65 + i / 20 * .245;
      for (const row of [0, 1]) {
        vertices.push(...hullSide(ship, d, t, d * .68 + (row - .5) * textHeight, side, .022).toArray());
        uv.push(side > 0 ? 1 - i / 20 : i / 20, row);
      }
      if (i < 20) { const a = i * 2; indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const decal = new THREE.BufferGeometry(); decal.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    decal.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); decal.setIndex(indices); decal.computeVertexNormals();
    mesh(g, decal, lettering);
  }
  if (ship.id === "yacht") for (const side of [-1, 1]) {
    for (const t of [.33, .43, .54]) {
      const at = hullSide(ship, d, t, d * .74, side, .036);
      const rim = box(g, at.x, at.y, at.z, .028, d * .21, l * .045, p.metal, .035);
      rim.rotation.y = -side * .035;
      const glass = box(g, at.x + side * .018, at.y, at.z, .013, d * .15, l * .040, p.glass, .024);
      glass.rotation.y = rim.rotation.y;
    }
  }
  // Stainless pulpit rails, interrupted at the stern bathing access.
  const railHeight = Math.min(1.02, Math.max(0.4, b * 0.19));
  for (const side of [-1, 1]) {
    const end = ship.id === "launch" ? 0.4 : 0.96;
    const rail: THREE.Vector3[] = [];
    for (let i = 0; i <= 30; i++) {
      const t = 0.025 + (end - 0.025) * i / 30;
      rail.push(V(side * halfBeam(t, b, workboat) * 0.95, sheer(t, d, b) + railHeight, (t * 0.97 - 0.5) * l));
    }
    tube(g, rail, Math.min(0.043, Math.max(0.014, b * 0.004)), p.metal);
    if (ship.id !== "launch") tube(g, rail.map((q) => q.clone().add(V(0, -railHeight * 0.45, 0))), b * 0.0026, p.metal);
    const posts = Math.ceil(l * end / Math.max(1.2, l / 20));
    for (let i = 0; i <= posts; i++) {
      const t = 0.04 + (end - 0.04) * i / posts;
      const start = V(side * halfBeam(t, b, workboat) * 0.95, sheer(t, d, b), (t * 0.97 - 0.5) * l);
      rod(g, start, start.clone().add(V(0, railHeight, 0)), Math.max(0.013, b * 0.0032), p.metal);
    }
  }
}

/** Rounded perimeter lofts form sloping cabin shells and uninterrupted wraparound glazing. */
type Level = { y: number; width: number; front: number; rear: number; radius?: number };
function outline(level: Level, segments = 8) {
  const result: THREE.Vector3[] = [], r = level.radius ?? Math.min(level.width * 0.16, (level.rear - level.front) * 0.14);
  const corners = [
    [-level.width / 2 + r, level.front + r, Math.PI],
    [level.width / 2 - r, level.front + r, Math.PI * 1.5],
    [level.width / 2 - r, level.rear - r, 0],
    [-level.width / 2 + r, level.rear - r, Math.PI / 2],
  ];
  for (const [x, z, start] of corners) for (let i = 0; i <= segments; i++) {
    const a = start + Math.PI / 2 * i / segments;
    result.push(V(x + Math.cos(a) * r, level.y, z + Math.sin(a) * r));
  }
  return result;
}
function loft(g: THREE.Group, levels: Level[], material: THREE.Material, capped = true) {
  const vertices: number[] = [], indices: number[] = [];
  const loops = levels.map((level) => outline(level)), n = loops[0].length;
  for (const loop of loops) vertices.push(...loop.flatMap((a) => a.toArray()));
  for (let i = 0; i < loops.length - 1; i++) for (let j = 0; j < n; j++) {
    const a = i * n + j, b = i * n + (j + 1) % n, c = a + n, d = b + n;
    indices.push(a, c, b, b, c, d);
  }
  if (capped) {
    for (const [levelIndex, flip] of [[0, false], [levels.length - 1, true]] as const) {
      const center = vertices.length / 3;
      vertices.push(0, levels[levelIndex].y, (levels[levelIndex].front + levels[levelIndex].rear) / 2);
      for (let j = 0; j < n; j++) {
        const a = levelIndex * n + j, b = levelIndex * n + (j + 1) % n;
        indices.push(center, flip ? b : a, flip ? a : b);
      }
    }
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices); geometry.computeVertexNormals();
  return mesh(g, geometry, material);
}
function lifering(g: THREE.Group, x: number, y: number, z: number, radius: number, p: Palette, side = false) {
  const ring = mesh(g, new THREE.TorusGeometry(radius, radius * 0.23, 10, 32), p.orange);
  ring.position.set(x, y, z); if (side) ring.rotation.y = Math.PI / 2;
  for (let i = 0; i < 4; i++) {
    const band = mesh(g, new THREE.TorusGeometry(radius, radius * 0.235, 6, 5, Math.PI * 0.1), p.white);
    band.position.copy(ring.position); band.rotation.copy(ring.rotation); band.rotateZ(i * Math.PI / 2);
  }
}
function cleat(g: THREE.Group, x: number, y: number, z: number, size: number, p: Palette) {
  box(g, x, y + size * 0.1, z, size * 0.5, size * 0.16, size * 1.3, p.metal, size * 0.06);
  rod(g, V(x, y, z - size * 0.3), V(x, y + size * 0.45, z - size * 0.3), size * 0.1, p.metal);
  rod(g, V(x, y, z + size * 0.3), V(x, y + size * 0.45, z + size * 0.3), size * 0.1, p.metal);
  rod(g, V(x, y + size * 0.45, z - size * 0.7), V(x, y + size * 0.45, z + size * 0.7), size * 0.13, p.metal);
}
function seat(g: THREE.Group, x: number, y: number, z: number, width: number, depth: number, p: Palette) {
  box(g, x, y - depth * 0.22, z, width * 0.82, depth * 0.55, depth * 0.83, p.white, depth * 0.07);
  box(g, x, y + depth * 0.08, z, width, depth * 0.18, depth, p.cushion, depth * 0.065);
  const back = box(g, x, y + depth * 0.44, z + depth * 0.4, width, depth * 0.64, depth * 0.22, p.cushion, depth * 0.07);
  back.rotation.x = 0.12;
  // Real upholstery seams and piping remain subtle at normal gameplay distances.
  for (let i = 1; i < 4; i++) rod(g, V(x - width / 2 + width * i / 4, y + depth * 0.174, z - depth * 0.42), V(x - width / 2 + width * i / 4, y + depth * 0.174, z + depth * 0.35), depth * 0.003, p.ivory);
}
function wheel(g: THREE.Group, x: number, y: number, z: number, r: number, p: Palette) {
  const steering = new THREE.Group(); steering.position.set(x, y, z); steering.rotation.x = -0.5; g.add(steering);
  mesh(steering, new THREE.TorusGeometry(r, r * 0.09, 8, 24), p.black);
  sphere(steering, 0, 0, 0, r * 0.22, p.metal);
  for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; rod(steering, V(0, 0, 0), V(Math.sin(a) * r, Math.cos(a) * r, 0), r * 0.04, p.metal); }
}
function fender(g: THREE.Group, x: number, y: number, z: number, size: number, p: Palette) {
  const object = mesh(g, new THREE.CapsuleGeometry(size * 0.2, size * 0.55, 4, 12), p.ivory);
  object.position.set(x, y, z); object.rotation.z = x > 0 ? -0.15 : 0.15;
  rod(g, V(x, y + size * 0.38, z), V(x * 0.96, y + size * 1.05, z), size * 0.018, p.black);
}
function radar(g: THREE.Group, x: number, y: number, z: number, size: number, p: Palette) {
  rod(g, V(x, y, z), V(x, y + size * 0.3, z), size * 0.12, p.white);
  box(g, x, y + size * 0.34, z, size * 1.45, size * 0.14, size * 0.23, p.white, size * 0.04);
}
function windowBand(g: THREE.Group, bottom: Level, top: Level, p: Palette, frontMullions = [0]) {
  loft(g, [bottom, top], p.glass, false);
  const lower = outline(bottom), upper = outline(top);
  tube(g, lower, 0.025, p.navy, true); tube(g, upper, 0.028, p.white, true);
  // Raked corner mullions divide the curved glass into manufacturable panes.
  for (const i of [4, 13, 22, 31]) rod(g, lower[i], upper[i], Math.max(0.035, bottom.width * 0.012), p.white);
  for (const x of frontMullions) rod(g, V(x, bottom.y, bottom.front), V(x, top.y, top.front), Math.max(0.022, bottom.width * 0.008), p.white);
}

function launch(g: THREE.Group, l: number, b: number, d: number, p: Palette) {
  // Deep-V runabout: flowing foredeck, inset cockpit, split windscreen and twin outboards.
  const fv: number[] = [], fi: number[] = [];
  const rows = 36, sections = 14;
  for (let i = 0; i <= rows; i++) {
    const t = 0.045 + i / rows * 0.41, width = halfBeam(t, b) * 0.955;
    const lift = l * 0.045 * Math.sin(Math.min(1, i / rows * 1.15) * Math.PI * 0.5);
    for (let j = 0; j <= sections; j++) {
      const u = j / sections * 2 - 1;
      fv.push(u * width, sheer(t, d, b) + 0.025 + lift * Math.pow(Math.max(0, 1 - u * u), 0.38), (t * 0.97 - 0.5) * l);
      if (i < rows && j < sections) { const a = i * (sections + 1) + j, c = a + sections + 1; fi.push(a, c, a + 1, a + 1, c, c + 1); }
    }
  }
  const fg = new THREE.BufferGeometry(); fg.setAttribute("position", new THREE.Float32BufferAttribute(fv, 3)); fg.setIndex(fi); fg.computeVertexNormals(); mesh(g, fg, p.white);
  const accent: number[] = [], accentIndices: number[] = [];
  for (let i = 0; i <= 20; i++) {
    const t = .065 + i / 20 * .20, q = (t - .045) / .41;
    const width = halfBeam(t, b) * .955;
    const lift = l * .045 * Math.sin(Math.min(1, q * 1.15) * Math.PI * .5);
    for (const u of [-.12, .12]) accent.push(u * width, sheer(t, d, b) + .031 + lift * Math.pow(1 - u * u, .38), (t * .97 - .5) * l);
    if (i < 20) { const a = i * 2; accentIndices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const stripe = new THREE.BufferGeometry(); stripe.setAttribute("position", new THREE.Float32BufferAttribute(accent, 3)); stripe.setIndex(accentIndices); stripe.computeVertexNormals(); mesh(g, stripe, p.orange);
  const hatch = box(g, 0, d + l * 0.052, -l * 0.20, b * 0.34, l * 0.012, l * 0.085, p.navy, l * 0.015);
  hatch.rotation.x = -0.035;
  for (const side of [-1, 1]) {
    box(g, side * b * 0.407, d + l * 0.025, l * 0.20, b * 0.12, l * 0.07, l * 0.48, p.white, b * 0.04);
    box(g, side * b * 0.365, d + l * 0.025, l * 0.26, b * 0.06, l * 0.045, l * 0.25, p.cushion, b * 0.02);
  }
  const wb: Level = { y: d + l * 0.042, width: b * 0.80, front: -l * 0.085, rear: l * 0.055, radius: b * 0.19 };
  const wt: Level = { y: d + l * 0.125, width: b * 0.68, front: -l * 0.025, rear: l * 0.08, radius: b * 0.18 };
  // Only the forward and side arc is glazed; the cockpit stays genuinely open aft.
  const windshieldArc = (level: Level) => { const ring = outline(level); return [...ring.slice(31), ...ring.slice(0, 23)]; };
  const a = windshieldArc(wb), c = windshieldArc(wt), vertices: number[] = [], indices: number[] = [];
  for (const loop of [a, c]) vertices.push(...loop.flatMap((q) => q.toArray()));
  for (let i = 0; i < a.length - 1; i++) indices.push(i, i + a.length, i + 1, i + 1, i + a.length, i + a.length + 1);
  const geom = new THREE.BufferGeometry(); geom.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3)); geom.setIndex(indices); geom.computeVertexNormals(); mesh(g, geom, p.glass);
  tube(g, a, 0.021, p.metal); tube(g, c, 0.023, p.metal);
  for (const i of [0, 9, 18, a.length - 1]) rod(g, a[i], c[i], 0.021, p.metal);
  rod(g, V(0, wb.y, wb.front), V(0, wt.y, wt.front), 0.023, p.metal);
  box(g, b * 0.18, d + l * 0.055, -l * 0.008, b * 0.3, l * 0.025, l * 0.07, p.navy, 0.045);
  box(g, b * 0.18, d + l * 0.071, -l * 0.012, b * 0.12, l * 0.006, l * 0.028, p.glass, 0.006);
  wheel(g, b * 0.18, d + l * 0.068, l * 0.025, b * 0.064, p);
  for (const side of [-1, 1]) seat(g, side * b * 0.20, d + l * 0.035, l * 0.13, b * 0.25, l * 0.09, p);
  seat(g, 0, d + l * 0.025, l * 0.34, b * 0.72, l * 0.105, p);
  box(g, 0, d - l * 0.016, l * 0.466, b * 0.77, l * 0.016, l * 0.055, p.teak, 0.025);
  for (const side of [-1, 1]) {
    const x = side * b * 0.17;
    loft(g, [
      { y: d - l * 0.03, width: b * 0.215, front: l * 0.457, rear: l * 0.528 },
      { y: d + l * 0.07, width: b * 0.225, front: l * 0.464, rear: l * 0.535 },
      { y: d + l * 0.086, width: b * 0.155, front: l * 0.473, rear: l * 0.526 },
    ], p.navy).position.x = x;
    box(g, x, d + l * 0.040, l * 0.532, b * 0.17, l * 0.01, l * 0.003, p.metal, 0.006);
    rod(g, V(x, d - l * 0.035, l * 0.49), V(x, -shipDraft(l), l * 0.495), b * 0.046, p.navy);
    const prop = mesh(g, new THREE.TorusGeometry(b * 0.09, b * 0.015, 6, 16), p.metal); prop.position.set(x, -shipDraft(l), l * 0.51);
  }
}
function shipDraft(l: number) { return l * 0.05; }

/** Offshore performance runabout: a sharp deep-V, long foredeck and open twin helm. */
function speedboat(g: THREE.Group, ship: ShipConfig, p: Palette) {
  const l = ship.length, b = ship.beam, d = l * 0.045;
  const blue = new THREE.MeshPhysicalMaterial({ color: "#086b9e", roughness: 0.24, roughnessMap: p.white.roughnessMap, metalness: 0.13, clearcoat: 1, clearcoatRoughness: 0.11 });
  const cyan = new THREE.MeshPhysicalMaterial({ color: "#30b9dd", roughness: 0.25, metalness: 0.15, clearcoat: 0.8 });
  const orange = new THREE.MeshPhysicalMaterial({ color: "#ef7d32", roughness: 0.30, metalness: 0.08, clearcoat: 0.7 });
  const leather = new THREE.MeshStandardMaterial({ color: "#f0f1ee", roughness: 0.78 });
  const trim = { ...p, cushion: leather, ivory: p.navy };
  const engineLettering = vesselLettering("V38", "#eef3f0", "VECTOR PERFORMANCE");
  const stations = [
    [-.5, .006], [-.46, .16], [-.35, .46], [-.22, .73], [-.06, .95], [.12, 1], [.29, .98], [.44, .89],
  ];
  const deckY = (z: number) => d + .10 * Math.pow(Math.max(0, (-z + .06) / .56), 1.5);
  const rings = stations.map(([z, width]) => {
    const w = width * b / 2, y = deckY(z), immersion = Math.min(1, (z + .5) * 5.5);
    return [V(-w, y, z * l), V(0, y + .032, z * l), V(w, y, z * l),
      V(w * .98, y * .26, z * l), V(w * .74, -ship.draft * .43 * immersion, z * l),
      V(0, -ship.draft * immersion, z * l), V(-w * .74, -ship.draft * .43 * immersion, z * l),
      V(-w * .98, y * .26, z * l)];
  });
  // Separate strips preserve the hard chines and V keel while smoothing lengthwise.
  for (let face = 0; face < rings[0].length; face++) {
    const vertices: number[] = [], indices: number[] = [];
    for (const ring of rings) vertices.push(...ring[face].toArray(), ...ring[(face + 1) % ring.length].toArray());
    for (let i = 0; i < rings.length - 1; i++) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices); geometry.computeVertexNormals();
    mesh(g, geometry, blue);
  }
  const transom = new THREE.Shape();
  rings.at(-1)!.forEach((v, i) => i ? transom.lineTo(v.x, v.y) : transom.moveTo(v.x, v.y));
  transom.closePath();
  mesh(g, new THREE.ShapeGeometry(transom), blue).position.z = l * .44;
  // Painted bands follow the actual crowned deck, so they never float above the bow.
  for (const [width, material, lift] of [[.35, p.white, .005], [.065, orange, .009]] as const) {
    const vertices: number[] = [], indices: number[] = [];
    const forward = stations.slice(0, 5);
    for (const [z, beam] of forward) {
      const w = beam * b * .5 * width, y = deckY(z) + .032;
      vertices.push(-w, y - .032 * width + lift, z * l, 0, y + lift, z * l, w, y - .032 * width + lift, z * l);
    }
    for (let i = 0; i < forward.length - 1; i++) for (let j = 0; j < 2; j++) {
      const a = i * 3 + j; indices.push(a, a + 3, a + 1, a + 1, a + 3, a + 4);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices); geometry.computeVertexNormals(); mesh(g, geometry, material);
  }
  for (const side of [-1, 1]) {
    const edge = stations.map(([z, width]) => V(side * width * b * .5, deckY(z) + .009, z * l));
    tube(g, edge, .026, p.white);
    const chine = stations.slice(1).map(([z, width]) => V(side * width * b * .495, deckY(z) * .33, z * l));
    tube(g, chine, .025, cyan);
    // Cockpit sides taper into the low raked screen; no tall cruising rails.
    const gunwale = loft(g, [
      { y: d + .02, width: b * .105, front: -l * .063, rear: l * .39, radius: .10 },
      { y: d + .28, width: b * .095, front: -l * .033, rear: l * .35, radius: .10 },
    ], blue);
    gunwale.position.x = side * b * .412;
    box(g, side * b * .36, d + .13, l * .18, b * .045, .16, l * .30, leather, .05);
    for (const z of [-l * .30, l * .32]) cleat(g, side * b * (z < 0 ? .22 : .40), deckY(z / l) + .015, z, .15, p);
  }
  box(g, 0, d + .047, l * .16, b * .70, .035, l * .38, p.black, .03);
  // EVA deck grooves make the inset cockpit and swim platform read as walking surfaces.
  for (let x = -4; x <= 4; x++) box(g, x * b * .068, d + .067, l * .19, .014, .004, l * .30, p.deck);
  box(g, 0, d + .19, -l * .035, b * .70, .25, l * .073, p.navy, .065);
  box(g, b * .19, d + .33, -l * .023, .38, .03, .23, p.glass, .02).rotation.x = -.18;
  wheel(g, b * .19, d + .34, l * .025, .18, p);
  for (const x of [-.095, .055]) {
    rod(g, V(b * .06 + x, d + .10, l * .08), V(b * .06 + x, d + .27, l * .065), .015, p.metal);
    sphere(g, b * .06 + x, d + .27, l * .065, .034, p.black);
  }
  for (const side of [-1, 1]) {
    seat(g, side * b * .19, d + .15, l * .13, b * .25, .66, trim);
    box(g, side * b * .19, d + .64, l * .158, b * .16, .22, .18, leather, .055);
    // Dark inset shoulder pads distinguish the two sculpted bolsters from a lounge.
    box(g, side * b * .19, d + .39, l * .150, b * .13, .25, .05, p.navy, .018);
  }
  // Four panes wrap around the front and sides, leaving the cockpit open aft.
  const screenBottom = [V(-b * .40, d + .26, l * .04), V(-b * .35, d + .27, -l * .08), V(0, d + .29, -l * .092), V(b * .35, d + .27, -l * .08), V(b * .40, d + .26, l * .04)];
  const screenTop = [V(-b * .35, d + .62, l * .065), V(-b * .30, d + .70, -l * .025), V(0, d + .72, -l * .035), V(b * .30, d + .70, -l * .025), V(b * .35, d + .62, l * .065)];
  const glassVertices = [...screenBottom, ...screenTop].flatMap((v) => v.toArray()), glassIndices: number[] = [];
  for (let i = 0; i < 4; i++) glassIndices.push(i, i + 5, i + 1, i + 1, i + 5, i + 6);
  const screen = new THREE.BufferGeometry(); screen.setAttribute("position", new THREE.Float32BufferAttribute(glassVertices, 3)); screen.setIndex(glassIndices); screen.computeVertexNormals();
  mesh(g, screen, p.glass); tube(g, screenBottom, .026, p.navy); tube(g, screenTop, .026, p.navy);
  for (const i of [0, 2, 4]) rod(g, screenBottom[i], screenTop[i], .018, p.metal);
  // A low aft sunpad covers the machinery well. Twin outboards remain fully distinct.
  box(g, 0, d + .16, l * .32, b * .67, .20, l * .115, leather, .08);
  for (const side of [-1, 1]) {
    box(g, side * b * .31, d - .02, l * .464, b * .22, .10, l * .072, p.white, .04);
    box(g, side * b * .31, d + .034, l * .461, b * .19, .008, l * .055, p.black, .025);
    const x = side * b * .16;
    const engine = loft(g, [
      { y: d - .16, width: .49, front: l * .434, rear: l * .505, radius: .16 },
      { y: d + .50, width: .62, front: l * .44, rear: l * .517, radius: .20 },
      { y: d + .60, width: .43, front: l * .45, rear: l * .509, radius: .17 },
    ], p.navy); engine.position.x = x;
    box(g, x, d + .28, l * .513, .43, .055, .018, cyan, .016);
    if (engineLettering) {
      const badge = mesh(g, new THREE.PlaneGeometry(.39, .17), engineLettering);
      badge.position.set(x, d + .39, l * .518);
    }
    for (let vent = 0; vent < 4; vent++) box(g, x, d + .06 + vent * .036, l * .512, .37, .013, .012, p.black, .004);
    rod(g, V(x, d - .14, l * .474), V(x, -.65, l * .484), .085, p.navy);
    const gearcase = mesh(g, new THREE.CapsuleGeometry(.085, .28, 4, 12), p.metal);
    gearcase.position.set(x, -.54, l * .490); gearcase.rotation.x = Math.PI / 2;
    for (let blade = 0; blade < 3; blade++) {
      const a = blade * Math.PI * 2 / 3;
      const prop = box(g, x + Math.sin(a) * .12, -.54 + Math.cos(a) * .12, l * .507, .11, .22, .024, p.metal, .016); prop.rotation.z = -a + .3;
    }
    box(g, side * b * .395, d + .27, -l * .052, .075, .055, .17, p.metal, .015);
    const lightColor = side < 0 ? "#ed3425" : "#29d48e";
    sphere(g, side * b * .410, d + .27, -l * .052, .028, new THREE.MeshStandardMaterial({ color: lightColor, emissive: lightColor, emissiveIntensity: .7 }));
  }
  return V(b * .19, d + .97, l * .08);
}

function yacht(g: THREE.Group, l: number, b: number, d: number, p: Palette) {
  const base = d + l * 0.046, roof = d + l * 0.145;
  // A low, flowing cabin rather than stacked cuboids; its raked windshield blends into a curved roof.
  loft(g, [
    { y: d + 0.02, width: b * 0.77, front: -l * 0.295, rear: l * 0.225, radius: b * 0.20 },
    { y: base, width: b * 0.74, front: -l * 0.22, rear: l * 0.205, radius: b * 0.19 },
  ], p.white);
  const low: Level = { y: base, width: b * 0.725, front: -l * 0.221, rear: l * 0.205, radius: b * 0.19 };
  const high: Level = { y: roof - l * 0.012, width: b * 0.635, front: -l * 0.115, rear: l * 0.177, radius: b * 0.155 };
  windowBand(g, low, high, p);
  loft(g, [
    { ...high, y: roof - l * 0.014, width: b * 0.67, front: -l * 0.133, rear: l * 0.235 },
    { y: roof + l * 0.003, width: b * 0.66, front: -l * 0.128, rear: l * 0.232, radius: b * 0.19 },
    { y: roof + l * 0.009, width: b * 0.56, front: -l * 0.095, rear: l * 0.207, radius: b * 0.20 },
  ], p.white);
  // Flush smoked skylight, forward sunpad and transverse stitched cushions.
  box(g, 0, roof + l * 0.0095, l * 0.017, b * 0.38, l * 0.003, l * 0.13, p.navy, l * 0.02);
  for (const side of [-1, 1]) {
    box(g, side * b * 0.145, d + l * 0.036, -l * 0.285, b * 0.265, l * 0.024, l * 0.12, p.cushion, l * 0.007);
    for (let seam = 0; seam < 3; seam++) rod(g, V(side * b * 0.145 - b * 0.112, d + l * 0.0485, -l * (0.33 - seam * 0.039)), V(side * b * 0.145 + b * 0.112, d + l * 0.0485, -l * (0.33 - seam * 0.039)), l * 0.0007, p.ivory);
    // Sculpted aft buttresses form the overhang over an open teak cockpit.
    rod(g, V(side * b * 0.33, d + l * 0.025, l * 0.28), V(side * b * 0.28, roof - l * 0.012, l * 0.205), l * 0.009, p.white);
    seat(g, side * b * 0.19, d + l * 0.03, l * 0.31, b * 0.28, l * 0.078, p);
    seat(g, side * b * 0.17, d + l * 0.04, -l * 0.025, b * 0.22, l * 0.07, p);
    fender(g, side * b * 0.476, d - l * 0.005, l * 0.11, l * 0.05, p);
    fender(g, side * b * 0.46, d - l * 0.005, l * 0.30, l * 0.05, p);
  }
  // Helm and chart displays are visible through the glazed saloon.
  box(g, 0, d + l * 0.064, -l * 0.105, b * 0.50, l * 0.055, l * 0.06, p.ivory, l * 0.009);
  wheel(g, b * 0.15, d + l * 0.10, -l * 0.068, b * 0.038, p);
  for (const x of [-0.06, 0.12]) box(g, b * x, d + l * 0.093, -l * 0.105, b * 0.13, l * 0.008, l * 0.029, p.navy, 0.025);
  box(g, 0, d + l * 0.039, l * 0.35, b * 0.16, l * 0.017, l * 0.075, p.teak, 0.05);
  rod(g, V(0, d, l * 0.35), V(0, d + l * 0.03, l * 0.35), l * 0.003, p.metal);
  box(g, 0, d - l * 0.016, l * 0.472, b * 0.77, l * 0.020, l * 0.071, p.white, 0.06);
  box(g, 0, d - l * 0.003, l * 0.477, b * 0.71, l * 0.004, l * 0.056, p.teak, 0.035);
  for (const side of [-1, 1]) {
    const x = side * b * 0.28;
    rod(g, V(x, roof, l * 0.115), V(x * 0.70, roof + l * 0.064, l * 0.115), l * 0.006, p.white);
  }
  box(g, 0, roof + l * 0.064, l * 0.115, b * 0.41, l * 0.012, l * 0.03, p.white, l * 0.005);
  radar(g, 0, roof + l * 0.065, l * 0.115, b * 0.18, p);
  const radome = sphere(g, -b * 0.11, roof + l * 0.033, l * 0.15, b * 0.052, p.white); radome.scale.y = 1.15;
  rod(g, V(b * 0.17, roof, l * 0.17), V(b * 0.17, roof + l * 0.14, l * 0.16), l * 0.0008, p.metal);
  lifering(g, b * 0.35, d + l * 0.035, l * 0.22, l * 0.018, p, true);
}

function workCabin(g: THREE.Group, l: number, b: number, d: number, z: number, width: number, length: number, height: number, p: Palette, body: THREE.Material = p.white, frontMullions = [0]) {
  const front = z - length / 2, rear = z + length / 2;
  loft(g, [{ y: d, width, front, rear, radius: width * 0.06 }, { y: d + height * 0.57, width: width * 0.98, front, rear, radius: width * 0.06 }], body);
  const low: Level = { y: d + height * 0.57, width: width * 0.98, front, rear, radius: width * 0.065 };
  const high: Level = { y: d + height * 0.94, width: width * 0.91, front: front - height * 0.05, rear: rear - height * 0.06, radius: width * 0.07 };
  windowBand(g, low, high, p, frontMullions);
  for (const side of [-1, 1]) for (const zz of [-0.20, 0.18]) rod(g, V(side * width * 0.49, low.y, z + length * zz), V(side * width * 0.455, high.y, z + length * zz - height * 0.03), Math.max(0.025, l * 0.0018), body);
  box(g, 0, d + height, z - height * 0.04, width * 1.10, height * 0.09, length * 1.06, body, height * 0.035);
  box(g, width * 0.28, d + height * 0.25, rear + 0.03, width * 0.23, height * 0.46, 0.06, p.ivory, 0.02);
  box(g, width * 0.34, d + height * 0.27, rear + 0.07, 0.06, 0.10, 0.04, p.metal);
  return d + height * 1.04;
}
function fishing(g: THREE.Group, l: number, b: number, d: number, p: Palette) {
  const roof = workCabin(g, l, b, d, -l * 0.19, b * 0.66, l * 0.29, l * 0.145, p);
  box(g, 0, d + l * 0.02, l * 0.2, b * 0.66, l * 0.02, l * 0.40, p.deck, 0.05);
  // Working trawler: A-frame, net drum, winch, open aft deck and rigging.
  for (const side of [-1, 1]) {
    rod(g, V(side * b * 0.35, d, l * 0.33), V(side * b * 0.30, d + l * 0.25, l * 0.28), l * 0.008, p.orange);
    rod(g, V(side * b * 0.35, d, l * 0.20), V(side * b * 0.30, d + l * 0.25, l * 0.28), l * 0.005, p.orange);
    rod(g, V(side * b * 0.30, d + l * 0.25, l * 0.28), V(side * b * 0.35, d + l * 0.02, -l * 0.08), l * 0.001, p.metal);
  }
  rod(g, V(-b * 0.30, d + l * 0.25, l * 0.28), V(b * 0.30, d + l * 0.25, l * 0.28), l * 0.008, p.orange);
  rod(g, V(0, d + l * 0.25, l * 0.28), V(0, d + l * 0.07, l * 0.37), l * 0.001, p.black);
  const drum = rod(g, V(-b * 0.21, d + l * 0.05, l * 0.18), V(b * 0.21, d + l * 0.05, l * 0.18), l * 0.036, p.navy);
  drum.geometry.computeVertexNormals();
  for (const x of [-0.24, 0.24]) rod(g, V(b * x - l * 0.003, d + l * 0.05, l * 0.18), V(b * x + l * 0.003, d + l * 0.05, l * 0.18), l * 0.048, p.metal);
  for (let i = 0; i < 15; i++) {
    const ring = mesh(g, new THREE.TorusGeometry(l * 0.037, l * 0.0015, 5, 20), p.black); ring.rotation.y = Math.PI / 2; ring.position.set((i - 7) * b * 0.026, d + l * 0.05, l * 0.18);
  }
  const crate = new THREE.MeshStandardMaterial({ color: "#577f72", roughness: 0.94 });
  for (let i = 0; i < 3; i++) {
    const x = -b * 0.27, z = l * (0.025 + i * 0.062);
    box(g, x, d + l * 0.022, z, b * 0.19, l * 0.04, l * 0.054, crate, 0.035);
    for (let slat = 0; slat < 3; slat++) box(g, x, d + l * (0.008 + slat * 0.012), z + l * 0.0275, b * 0.16, l * 0.004, 0.02, p.navy);
  }
  const net = new THREE.MeshStandardMaterial({ color: "#607665", roughness: 1 });
  const bundle = sphere(g, b * .21, d + l * .027, l * .04, 1, net);
  bundle.scale.set(b * .16, l * .027, l * .075);
  const lattice = new THREE.MeshStandardMaterial({ color: "#b8b692", roughness: 1, wireframe: true });
  const woven = mesh(g, new THREE.SphereGeometry(1.014, 16, 12), lattice);
  woven.position.copy(bundle.position); woven.scale.copy(bundle.scale);
  rod(g, V(0, roof, -l * 0.18), V(0, roof + l * 0.22, -l * 0.18), l * 0.004, p.white);
  rod(g, V(-b * 0.34, roof + l * 0.11, -l * 0.18), V(b * 0.34, roof + l * 0.11, -l * 0.18), l * 0.0035, p.white);
  for (const side of [-1, 1]) rod(g, V(side * b * 0.32, d, -l * 0.32), V(0, roof + l * 0.18, -l * 0.18), l * 0.0007, p.metal);
  radar(g, 0, roof + 0.1, -l * 0.12, b * 0.20, p);
  lifering(g, b * 0.34, d + l * 0.082, -l * 0.17, l * 0.024, p, true);
  for (const side of [-1, 1]) for (const z of [-0.03, 0.28]) fender(g, side * b * 0.48, d - l * 0.015, l * z, l * 0.063, p);
}
function tug(g: THREE.Group, l: number, b: number, d: number, p: Palette) {
  const ochre = new THREE.MeshStandardMaterial({ color: "#d3a64d", roughness: 0.52, roughnessMap: p.deck.roughnessMap, metalness: 0.09 });
  loft(g, [{ y: d, width: b * 0.63, front: -l * 0.31, rear: l * 0.18, radius: b * 0.12 }, { y: d + l * 0.10, width: b * 0.60, front: -l * 0.29, rear: l * 0.16, radius: b * 0.10 }], ochre);
  const bridgePalette = { ...p, glass: p.glass.clone() };
  bridgePalette.glass.opacity = .28;
  bridgePalette.glass.color.set("#6c979f");
  bridgePalette.glass.envMapIntensity = .65;
  const roof = workCabin(g, l, b, d + l * 0.10, -l * 0.16, b * 0.63, l * 0.31, l * 0.13, bridgePalette, ochre, [-b * .10, b * .10]);
  // Keep the existing bridge eye, but give it a real lower-frame reference.
  // This console sits inside the slightly extended bridge, below the gaze;
  // its plinth joins the solid cabin below the glazing.
  const eyeY = d + l * .212, eyeZ = -l * .294;
  const consoleY = eyeY - .48, consoleZ = eyeZ - .57;
  box(g, 0, consoleY - .48, consoleZ, b * .32, 1.05, .32, ochre, .045);
  box(g, 0, consoleY, consoleZ, b * .41, .36, .40, p.navy, .045);
  for (const side of [-1, 1]) {
    const screenX = side * b * .115;
    const screen = box(g, screenX, consoleY + .19, consoleZ - .045, .55, .025, .25, p.black, .025);
    screen.rotation.x = -.14;
    const display = box(g, screenX, consoleY + .21, consoleZ - .045, .46, .009, .17, p.glass, .015);
    display.rotation.x = screen.rotation.x;
    for (let button = 0; button < 3; button++) sphere(g, screenX - .15 + button * .15, consoleY + .191, consoleZ + .12, .012, p.ivory);
    rod(g, V(side * b * .18, consoleY - .08, consoleZ + .18), V(side * b * .18, consoleY + .10, consoleZ + .17), .018, p.metal);
    sphere(g, side * b * .18, consoleY + .10, consoleZ + .17, .036, p.black);
  }
  const binnacle = mesh(g, new THREE.CylinderGeometry(.063, .073, .012, 24), p.metal);
  binnacle.position.set(0, consoleY + .198, consoleZ - .045);
  const compassFace = mesh(g, new THREE.CircleGeometry(.053, 24), p.navy);
  compassFace.rotation.x = -Math.PI / 2; compassFace.position.set(0, consoleY + .206, consoleZ - .045);
  rod(g, V(-.035, consoleY + .211, consoleZ - .045), V(.035, consoleY + .211, consoleZ - .045), .003, p.ivory);
  rod(g, V(0, consoleY + .211, consoleZ - .080), V(0, consoleY + .211, consoleZ - .01), .003, p.ivory);
  for (const side of [-1, 1]) {
    const x = side * b * 0.235;
    box(g, x, d + l * 0.125, l * 0.10, b * 0.14, l * 0.22, l * 0.085, ochre, l * 0.011);
    box(g, x, d + l * 0.234, l * 0.10, b * 0.145, l * 0.024, l * 0.088, p.navy, l * 0.007);
    for (let vent = 0; vent < 5; vent++) box(g, x + side * b * 0.072, d + l * (0.10 + vent * 0.014), l * 0.10, 0.03, l * 0.006, l * 0.060, p.black);
  }
  // Rubber bow fender and hanging tire chains identify the tug at a glance.
  for (const side of [-1, 1]) {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 32; i++) { const t = 0.025 + i / 32 * 0.975; points.push(V(side * halfBeam(t, b, true), d * 0.65, (t * 0.97 - 0.5) * l)); }
    tube(g, points, b * 0.025, p.black);
    for (let i = 0; i < 6; i++) {
      const z = l * (-0.22 + i * 0.125), x = side * halfBeam((z / l + 0.5) / 0.97, b, true);
      const tire = mesh(g, new THREE.TorusGeometry(l * 0.023, l * 0.008, 10, 24), p.black);
      tire.position.set(x, d - l * 0.004, z); tire.rotation.y = Math.PI / 2;
      rod(g, V(x, d + l * 0.014, z), V(x * 0.95, d + l * 0.044, z), l * 0.001, p.metal);
    }
  }
  rod(g, V(-b * 0.21, d + l * 0.037, l * 0.27), V(b * 0.21, d + l * 0.037, l * 0.27), l * 0.038, p.navy);
  for (let i = 0; i < 14; i++) {
    const ring = mesh(g, new THREE.TorusGeometry(l * 0.039, l * 0.0014, 4, 18), p.ivory); ring.rotation.y = Math.PI / 2; ring.position.set((i - 6.5) * b * 0.023, d + l * 0.037, l * 0.27);
  }
  for (const side of [-1, 1]) cleat(g, side * b * 0.31, d, l * 0.38, l * 0.023, p);
  rod(g, V(0, roof, -l * 0.13), V(0, roof + l * 0.18, -l * 0.13), l * 0.004, p.white);
  radar(g, 0, roof + l * 0.065, -l * 0.13, b * 0.20, p);
  lifering(g, b * 0.308, d + l * 0.058, -l * 0.12, l * 0.023, p, true);
}
function cargo(g: THREE.Group, l: number, b: number, d: number, p: Palette) {
  const mats = ["#b9693c", "#355e73", "#c2b68f", "#853b32", "#526e60"].map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.73, roughnessMap: p.deck.roughnessMap, metalness: 0.13 }));
  const cw = b * 0.235, ch = l * 0.029, cd = l * 0.113;
  for (let row = 0; row < 5; row++) for (let col = 0; col < 3; col++) for (let level = 0; level < (row === 0 ? 2 : 3); level++) {
    if (row === 0 && col !== 1) continue; // Forepeak narrows: only a central container stack fits here.
    const x = (col - 1) * b * 0.246, y = d + ch * (level + 0.5), z = -l * 0.325 + row * l * 0.116;
    const mat = mats[(row * 3 + col + level) % mats.length];
    box(g, x, y, z, cw, ch, cd, mat, 0.08);
    // Corrugation, door bars and corner castings make the cargo actual containers.
    for (let rib = 0; rib < 12; rib++) for (const side of [-1, 1]) box(g, x + side * cw * 0.502, y, z - cd * 0.47 + rib * cd * 0.085, 0.09, ch * 0.89, 0.20, mat);
    for (const side of [-1, 1]) box(g, x + side * cw * 0.25, y, z + cd * 0.503, 0.055, ch * 0.90, 0.055, p.metal);
    for (const side of [-1, 1]) box(g, x + side * cw * 0.46, y + ch * 0.44, z, 0.18, 0.16, cd * 0.98, mat);
    // Roof corrugation catches sunlight in follow/orbit views, not just along the quay.
    if (level === (row === 0 ? 1 : 2)) for (let rib = 0; rib < 8; rib++)
      box(g, x - cw * .40 + rib * cw * .114, y + ch * .505, z, cw * .018, ch * .020, cd * .94, mat);
  }
  const roof = workCabin(g, l, b, d + l * 0.090, l * 0.325, b * 0.89, l * 0.11, l * 0.049, p);
  box(g, 0, d + l * 0.044, l * 0.337, b * 0.60, l * 0.09, l * 0.14, p.white, 0.4);
  for (let floor = 0; floor < 3; floor++) for (let col = -2; col <= 2; col++) {
    box(g, col * b * 0.103, d + l * (0.021 + floor * 0.023), l * 0.408, b * 0.058, l * 0.010, 0.10, p.glass, 0.15);
    for (const side of [-1, 1]) box(g, side * b * 0.302, d + l * (0.021 + floor * 0.023), l * (0.3 + col * 0.017), 0.09, l * 0.010, l * 0.009, p.glass, 0.10);
  }
  box(g, b * 0.13, roof + l * 0.018, l * 0.36, b * 0.22, l * 0.05, l * 0.05, p.orange, 0.4);
  box(g, b * 0.13, roof + l * 0.043, l * 0.36, b * 0.23, l * 0.013, l * 0.052, p.navy, 0.3);
  rod(g, V(-b * 0.2, roof, l * 0.325), V(-b * 0.2, roof + l * 0.09, l * 0.325), 0.20, p.white);
  radar(g, -b * 0.2, roof + l * 0.05, l * 0.325, b * 0.18, p);
  for (const side of [-1, 1]) {
    cleat(g, side * b * 0.23, d + 0.1, -l * 0.415, l * 0.007, p);
    const lifeboat = sphere(g, side * b * 0.39, d + l * 0.040, l * 0.35, l * 0.022, p.orange); lifeboat.scale.set(0.55, 0.42, 1.3);
    rod(g, V(side * b * 0.29, d, l * 0.35), V(side * b * 0.41, d + l * 0.060, l * 0.35), 0.18, p.white);
  }
}

/** Static fittings sharing a finish render in one draw call, including container corrugations. */
function batchFittings(g: THREE.Group) {
  g.updateMatrixWorld(true);
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>(), originals = new Set<THREE.BufferGeometry>();
  g.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || Array.isArray(object.material)) return;
    originals.add(object.geometry);
    const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
    geometry.applyMatrix4(object.matrixWorld);
    if (!geometry.getAttribute("uv")) geometry.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(geometry.getAttribute("position").count * 2), 2));
    const list = batches.get(object.material) ?? [];
    list.push(geometry); batches.set(object.material, list);
  });
  g.clear();
  for (const [material, geometries] of batches) {
    const combined = mergeGeometries(geometries);
    if (combined) mesh(g, combined, material);
    for (const geometry of geometries) geometry.dispose();
  }
  for (const geometry of originals) geometry.dispose();
}

/** Original metre-scale procedural vessels. Bow is -Z; the waterline is Y=0. */
export function createShipModel(ship: ShipConfig) {
  const g = new THREE.Group(), l = ship.length, b = ship.beam;
  if (ship.id === "spirit" || ship.id === "speedboat") {
    const eye = ship.id === "spirit" ? buildSpiritModel(g, ship) : speedboat(g, ship, makePalette());
    batchFittings(g);
    const bounds = new THREE.Box3().setFromObject(g), size = bounds.getSize(new THREE.Vector3());
    const centerZ = (bounds.min.z + bounds.max.z) / 2;
    for (const child of g.children) child.position.z -= centerZ;
    g.scale.set(Math.min(1, b / size.x), 1, Math.min(1, l / size.z));
    g.userData.length = l;
    g.userData.bridgeEye = eye.set(eye.x * g.scale.x, eye.y, (eye.z - centerZ) * g.scale.z);
    return g;
  }
  const p = makePalette();
  const d = ship.id === "cargo" ? l * 0.029 : ship.id === "tug" ? l * 0.055 : ship.id === "fishing" ? l * 0.050 : l * 0.045;
  const hullMaterial = ship.id === "launch" ? p.white : ship.id === "yacht" ? p.navy
    : ship.id === "fishing" ? new THREE.MeshPhysicalMaterial({ color: "#286d6c", roughness: 0.44, roughnessMap: p.deck.roughnessMap, metalness: 0.07, clearcoat: 0.35 })
    : ship.id === "tug" ? p.navy : p.red;
  hull(g, ship, d, hullMaterial, p);
  if (ship.id === "launch") launch(g, l, b, d, p);
  else if (ship.id === "yacht") yacht(g, l, b, d, p);
  else if (ship.id === "fishing") fishing(g, l, b, d, p);
  else if (ship.id === "tug") tug(g, l, b, d, p);
  else cargo(g, l, b, d, p);
  for (const side of [-1, 1]) {
    for (const t of [0.26, 0.83]) cleat(g, side * halfBeam(t, b) * 0.86, sheer(t, d, b) + 0.025, (t * 0.97 - 0.5) * l, Math.max(0.12, Math.min(0.6, l * 0.016)), p);
    const color = side < 0 ? "#ed3425" : "#29d48e";
    const light = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.7, roughness: 0.2 });
    box(g, side * b * 0.375, d + Math.min(0.8, l * 0.047), -l * 0.16, Math.max(0.07, l * 0.004), Math.max(0.07, l * 0.004), Math.max(0.12, l * 0.008), p.metal, 0.018);
    sphere(g, side * b * 0.386, d + Math.min(0.8, l * 0.047), -l * 0.16, Math.max(0.035, Math.min(0.16, l * 0.004)), light);
  }
  // Stern staff and a slightly curved fabric ensign, with no external image assets.
  const staffHeight = Math.min(2.8, l * 0.13), staffZ = l * 0.435;
  rod(g, V(b * 0.23, d, staffZ), V(b * 0.23, d + staffHeight, staffZ + staffHeight * 0.12), Math.max(0.012, l * 0.00075), p.metal);
  const flag = new THREE.PlaneGeometry(staffHeight * 0.5, staffHeight * 0.30, 8, 3), pos = flag.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 12 / staffHeight) * staffHeight * 0.04);
  flag.computeVertexNormals();
  const flagMaterial = new THREE.MeshStandardMaterial({ color: "#c76536", roughness: 0.95, side: THREE.DoubleSide });
  const ensign = mesh(g, flag, flagMaterial); ensign.position.set(b * 0.23 + staffHeight * 0.25, d + staffHeight * 0.82, staffZ + staffHeight * 0.1);
  batchFittings(g);
  const bounds = new THREE.Box3().setFromObject(g), size = bounds.getSize(new THREE.Vector3());
  const centerZ = (bounds.min.z + bounds.max.z) / 2;
  for (const child of g.children) child.position.z -= centerZ;
  // Rails and fenders are included in the physical beam and overall length.
  g.scale.set(Math.min(1, b / size.x), 1, Math.min(1, l / size.z));
  g.userData.length = l;
  // Camera eyes sit just forward of glazing to keep navigation unobstructed.
  g.userData.bridgeEye = ship.id === "launch" ? V(b * 0.18, d + l * 0.155, -l * 0.03)
    : ship.id === "yacht" ? V(b * 0.13, d + l * 0.120, -l * 0.18)
    : ship.id === "fishing" ? V(0, d + l * 0.127, -l * 0.344)
    : ship.id === "tug" ? V(0, d + l * 0.212, -l * 0.294)
    : V(0, d + l * 0.131, l * 0.262);
  g.userData.bridgeEye.x *= g.scale.x;
  g.userData.bridgeEye.z = (g.userData.bridgeEye.z - centerZ) * g.scale.z;
  return g;
}

export function disposeObject(object: THREE.Object3D) {
  const materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>(), geometries = new Set<THREE.BufferGeometry>();
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments || child instanceof THREE.Points || child instanceof THREE.Sprite) {
      if (!(child instanceof THREE.Sprite)) geometries.add(child.geometry);
      for (const material of Array.isArray(child.material) ? child.material : [child.material]) materials.add(material);
    }
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) {
    for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    material.dispose();
  }
  for (const texture of textures) texture.dispose();
}
