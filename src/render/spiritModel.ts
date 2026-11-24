import * as THREE from "three";
import type { ShipConfig } from "../types";
import { finishGrain } from "./vesselFinishes";

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

type Station = { z: number; x?: number; width: number; top: number; bottom: number };

/** Original geometry drawn from ANMM/Warby photographs, never an imported model. */
export function buildSpiritModel(group: THREE.Group, ship: ShipConfig): THREE.Vector3 {
  const l = ship.length, b = ship.beam;
  const grain = finishGrain();
  const white = new THREE.MeshPhysicalMaterial({ color: "#e9eae2", roughness: 0.31, roughnessMap: grain, metalness: 0.025, clearcoat: 0.8, clearcoatRoughness: 0.14 });
  const blue = new THREE.MeshPhysicalMaterial({ color: "#0959a7", roughness: 0.33, roughnessMap: grain, metalness: 0.055, clearcoat: 0.72, clearcoatRoughness: .15 });
  const red = new THREE.MeshStandardMaterial({ color: "#c72632", roughness: 0.43 });
  const dark = new THREE.MeshStandardMaterial({ color: "#101923", roughness: 0.8 });
  const steel = new THREE.MeshStandardMaterial({ color: "#a5b8be", roughness: 0.32, roughnessMap: grain, metalness: 0.88 });
  const seam = new THREE.MeshStandardMaterial({ color: "#697b7e", roughness: .62, metalness: .22 });
  const heatSteel = new THREE.MeshStandardMaterial({ color: "#6c777b", roughness: .38, roughnessMap: grain, metalness: .87 });
  const glass = new THREE.MeshPhysicalMaterial({ color: "#b9d9e0", roughness: 0.055, metalness: 0, clearcoat: 1, clearcoatRoughness: .035, envMapIntensity: 1.2, transparent: true, opacity: 0.17, depthWrite: false, side: THREE.DoubleSide });
  const rubber = new THREE.MeshStandardMaterial({ color: "#22272a", roughness: 0.96 });
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z); mesh.castShadow = !material.transparent; mesh.receiveShadow = true;
    group.add(mesh); return mesh;
  };
  const box = (x: number, y: number, z: number, w: number, h: number, d: number, material: THREE.Material) => add(new THREE.BoxGeometry(w, h, d), material, x, y, z);
  const rod = (a: THREE.Vector3, c: THREE.Vector3, radius: number, material: THREE.Material) => {
    const mesh = add(new THREE.CylinderGeometry(radius, radius, a.distanceTo(c), 10), material);
    mesh.position.copy(a).add(c).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(V(0, 1, 0), c.clone().sub(a).normalize());
    return mesh;
  };
  const tube = (points: THREE.Vector3[], radius: number, material: THREE.Material, closed = false) => add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, closed, "centripetal"), 48, radius, 8, closed), material);
  const surface = (vertices: number[], indices: number[], material: THREE.Material) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices); geometry.computeVertexNormals();
    return add(geometry, material);
  };

  // Flat planing bottom, rounded chine, broad triangular foredeck. Each ring is
  // clockwise from the front: the upper surfaces have physically upward normals.
  const hull = (stations: Station[]) => {
    const vertices: number[] = [], indices: number[] = [];
    for (const s of stations) {
      const x = s.x ?? 0, h = s.top - s.bottom;
      for (const [rx, ry] of [[-1, 0.82], [-0.91, 1], [0.91, 1], [1, 0.82], [0.90, 0], [-0.90, 0]]) vertices.push(x + s.width * rx / 2, s.bottom + h * ry, s.z);
    }
    for (let i = 0; i < stations.length - 1; i++) for (let j = 0; j < 6; j++) {
      const a = i * 6 + j, c = i * 6 + (j + 1) % 6;
      indices.push(a, a + 6, c, c, a + 6, c + 6);
    }
    for (let i = 1; i < 5; i++) {
      indices.push(0, i, i + 1);
      const end = (stations.length - 1) * 6;
      indices.push(end, end + i + 1, end + i);
    }
    // Sharp deck/chine normals instead of smoothing the flat deck into a dome.
    const mesh = surface(vertices, indices, white);
    const faceted = mesh.geometry.toNonIndexed(); mesh.geometry.dispose(); mesh.geometry = faceted; faceted.computeVertexNormals();
    return mesh;
  };
  hull([
    { z: -l * 0.5, width: 0.018, top: 0.105, bottom: 0.070 },
    { z: -l * 0.40, width: b * 0.30, top: 0.195, bottom: -0.03 },
    { z: -l * 0.24, width: b * 0.63, top: 0.25, bottom: -0.15 },
    { z: -l * 0.09, width: b * 0.72, top: 0.27, bottom: -0.19 },
    { z: l * 0.17, width: b * 0.62, top: 0.28, bottom: -0.21 },
    { z: l * 0.445, width: b * 0.51, top: 0.26, bottom: -0.18 },
    { z: l * 0.472, width: b * 0.48, top: 0.25, bottom: -0.15 },
  ]);
  // The two forward sponsons are integrated into the chine, as on the original,
  // rather than detached catamaran floats. Their aft steps are visible on turns.
  for (const side of [-1, 1]) {
    hull([
      { x: side * b * 0.22, z: -l * 0.36, width: 0.025, top: 0.15, bottom: 0.06 },
      { x: side * b * 0.365, z: -l * 0.24, width: b * 0.255, top: 0.23, bottom: -0.20 },
      { x: side * b * 0.37, z: -l * 0.065, width: b * 0.26, top: 0.26, bottom: -0.27 },
      { x: side * b * 0.354, z: l * 0.06, width: b * 0.235, top: 0.255, bottom: -0.25 },
      { x: side * b * 0.29, z: l * 0.092, width: b * 0.075, top: 0.26, bottom: -0.04 },
    ]);
    rod(V(side * b * 0.493, 0.075, -l * 0.23), V(side * b * 0.493, 0.075, -l * 0.07), 0.009, blue);
  }

  // Rear cylindrical jet fairing with a taper and a deeply recessed metal nozzle.
  const fuselage: number[] = [], fi: number[] = [], rows = 32, radial = 48;
  for (let i = 0; i <= rows; i++) {
    const t = i / rows, z = l * (0.003 + t * 0.472), radius = (0.46 - t * 0.07) * (0.85 + 0.15 * Math.sin(t * Math.PI));
    for (let j = 0; j <= radial; j++) {
      const a = j / radial * Math.PI * 2;
      fuselage.push(Math.cos(a) * radius, 0.66 + Math.sin(a) * radius * 0.87, z);
      if (i < rows && j < radial) { const p = i * (radial + 1) + j; fi.push(p, p + 1, p + radial + 1, p + 1, p + radial + 2, p + radial + 1); }
    }
  }
  surface(fuselage, fi, white);
  const fairingAt = (t: number, angle: number, outset = .006) => {
    const radius = (0.46 - t * .07) * (.85 + .15 * Math.sin(t * Math.PI)) + outset;
    return V(Math.cos(angle) * radius, .66 + Math.sin(angle) * radius * .87, l * (.003 + t * .472));
  };
  // Fine panel joints and flush fasteners separate the white aircraft fairing
  // from its exposed metal exhaust without changing the historic silhouette.
  for (const t of [.22, .64, .90]) {
    const ring = Array.from({ length: 49 }, (_, i) => fairingAt(t, i / 48 * Math.PI * 2));
    tube(ring, .004, seam);
    for (let bolt = 0; bolt < 10; bolt++) {
      const point = fairingAt(t - .012, bolt / 10 * Math.PI * 2, .012);
      add(new THREE.SphereGeometry(.009, 6, 4), steel, point.x, point.y, point.z);
    }
  }
  for (const angle of [Math.PI * .24, Math.PI * .76])
    tube(Array.from({ length: 20 }, (_, i) => fairingAt(.03 + i / 19 * .92, angle)), .0035, seam);
  const exhaustRing = add(new THREE.TorusGeometry(0.32, 0.043, 12, 48), steel, 0, 0.66, l * 0.48); exhaustRing.scale.y = 0.88;
  const exhaust = add(new THREE.CylinderGeometry(0.292, 0.25, 0.32, 40, 1, true), heatSteel, 0, 0.66, l * 0.461); exhaust.rotation.x = Math.PI / 2; exhaust.scale.z = 0.88;
  const innerLip = add(new THREE.TorusGeometry(.277, .012, 8, 40), heatSteel, 0, .66, l * .479); innerLip.scale.y = .88;
  const darkness = add(new THREE.CircleGeometry(0.27, 40), dark, 0, 0.66, l * 0.442); darkness.scale.y = 0.88;
  const cone = add(new THREE.ConeGeometry(0.11, 0.18, 24), dark, 0, 0.66, l * 0.459); cone.rotation.x = Math.PI / 2;

  // Paired tall air scoops flank the open cockpit. The rim has real depth;
  // black recesses remain visible from the bow instead of painted-on circles.
  for (const side of [-1, 1]) {
    const vertices: number[] = [], indices: number[] = [], count = 48;
    for (const [z, rx, ry, cy] of [[-l * 0.03, 0.265, 0.38, 0.69], [l * 0.045, 0.30, 0.37, 0.68], [l * 0.19, 0.22, 0.28, 0.64]]) {
      for (let j = 0; j <= count; j++) { const a = j / count * Math.PI * 2; vertices.push(side * 0.47 + Math.cos(a) * rx, cy + Math.sin(a) * ry, z); }
    }
    for (let i = 0; i < 2; i++) for (let j = 0; j < count; j++) { const a = i * (count + 1) + j; indices.push(a, a + 1, a + count + 1, a + 1, a + count + 2, a + count + 1); }
    surface(vertices, indices, white);
    const rim: THREE.Vector3[] = [];
    for (let j = 0; j < 48; j++) { const a = j / 48 * Math.PI * 2; rim.push(V(side * 0.47 + Math.cos(a) * 0.265, 0.69 + Math.sin(a) * 0.38, -l * 0.03)); }
    tube(rim, 0.035, white, true);
    const intake = add(new THREE.CircleGeometry(1, 48), dark, side * 0.47, 0.69, -l * 0.03 + 0.08); intake.rotation.y = Math.PI; intake.scale.set(0.251, 0.365, 1);
    const lip = add(new THREE.TorusGeometry(1, 0.014, 8, 48), steel, side * 0.47, 0.69, -l * 0.03 - 0.012); lip.scale.set(0.256, 0.371, 1);
  }

  // Small aircraft cockpit: blue seat, sloped clear windshield, black coaming,
  // three analog instrument faces and a wheel visible below the first-person eye.
  box(0, 0.28, -l * 0.071, 0.42, 0.075, 0.92, dark);
  box(0, 0.36, -l * 0.04, 0.33, 0.11, 0.35, blue);
  const seat = box(0, 0.66, -l * 0.011, 0.37, 0.53, 0.105, blue); seat.rotation.x = -0.11;
  for (const side of [-1, 1]) rod(V(side * 0.19, 0.37, -0.76), V(side * 0.19, 0.68, -0.76), 0.023, rubber);
  const windshield = surface([-0.245, 0.34, -1.10, 0.245, 0.34, -1.10, -0.18, 0.80, -0.79, 0.18, 0.80, -0.79], [0, 2, 1, 1, 2, 3], glass);
  windshield.castShadow = false;
  for (const side of [-1, 1]) rod(V(side * 0.245, 0.34, -1.10), V(side * 0.18, 0.80, -0.79), 0.009, steel);
  rod(V(-0.18, 0.80, -0.79), V(0.18, 0.80, -0.79), 0.01, steel);
  tube([V(-0.23, 0.35, -1.10), V(0, 0.32, -1.18), V(0.23, 0.35, -1.10)], 0.018, white);
  box(0, 0.585, -0.87, 0.41, 0.20, 0.065, rubber);
  for (const x of [-0.127, 0, 0.127]) {
    add(new THREE.CircleGeometry(0.05, 24), steel, x, 0.62, -0.833);
    add(new THREE.CircleGeometry(0.043, 24), dark, x, 0.62, -0.831);
    for (let tick = 0; tick < 10; tick++) {
      const a = (tick / 9 * 1.5 - 0.75) * Math.PI;
      rod(V(x + Math.sin(a) * 0.032, 0.62 + Math.cos(a) * 0.032, -0.827), V(x + Math.sin(a) * 0.039, 0.62 + Math.cos(a) * 0.039, -0.827), 0.0014, white);
    }
    rod(V(x, 0.62, -0.827), V(x + 0.021, 0.645, -0.827), 0.003, white);
  }
  const wheel = add(new THREE.TorusGeometry(0.135, 0.014, 8, 32), rubber, 0, 0.42, -0.57); wheel.rotation.x = -0.12;
  for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; rod(V(0, 0.42, -0.57), V(Math.sin(a) * 0.135, 0.42 + Math.cos(a) * 0.135, -0.57), 0.006, steel); }
  rod(V(0.20, 0.36, -0.48), V(0.20, 0.48, -0.46), 0.013, steel);
  add(new THREE.SphereGeometry(0.029, 12, 8), rubber, 0.20, 0.48, -0.46);

  // Characteristic swept vertical fin and elliptical T-tail of the record boat.
  const fin = new THREE.Shape(); fin.moveTo(l * 0.285, 0.88); fin.lineTo(l * 0.375, 1.54); fin.lineTo(l * 0.46, 1.56); fin.lineTo(l * 0.45, 0.90); fin.closePath();
  const finGeometry = new THREE.ExtrudeGeometry(fin, { depth: 0.075, bevelEnabled: true, bevelSegments: 3, bevelSize: 0.015, bevelThickness: 0.015 });
  // Shape coordinates are longitudinal z/y; the extrusion becomes x.
  finGeometry.rotateY(-Math.PI / 2); finGeometry.translate(0.0375, 0, 0); finGeometry.computeVertexNormals();
  add(finGeometry, white);
  const tail = add(new THREE.SphereGeometry(1, 48, 16), white, 0, 1.55, l * 0.402); tail.scale.set(b * 0.39, 0.047, l * 0.060);
  // A red southern-cross star is drawn as original geometry, not a sponsor asset.
  const star = new THREE.Shape();
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, r = i % 2 ? 0.055 : 0.115; const x = Math.sin(a) * r, y = Math.cos(a) * r; if (i === 0) star.moveTo(x, y); else star.lineTo(x, y); } star.closePath();
  for (const side of [-1, 1]) { const mark = add(new THREE.ShapeGeometry(star), red, side * 0.056, 1.26, l * 0.395); mark.rotation.y = side * Math.PI / 2; }
  const rudder = box(0, -0.23, l * 0.462, 0.028, 0.28, 0.30, steel); rudder.rotation.x = 0.10;

  // Original canvas typography recreates the readable name and racing number.
  // Primary photographs are visual references only; no external bitmap is shipped.
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas"); canvas.width = 2048; canvas.height = 256;
    const ctx = canvas.getContext("2d")!; ctx.clearRect(0, 0, 2048, 256);
    ctx.fillStyle = "#14252e"; ctx.font = "bold 146px Arial, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("SPIRIT OF AUSTRALIA", 1024, 130, 2010);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8;
    const lettering = new THREE.MeshStandardMaterial({ map: texture, transparent: true, alphaTest: 0.08, roughness: 0.65, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 });
    for (const side of [-1, 1]) {
      const label = add(new THREE.PlaneGeometry(l * 0.305, 0.25), lettering, side * b * 0.284, 0.12, l * 0.265); label.rotation.y = side * Math.PI / 2;
      // Match the gently narrowing aft hull so the full text remains on its side.
      label.rotation.y -= side * 0.058;
    }
    const numbers = document.createElement("canvas"); numbers.width = 512; numbers.height = 256;
    const nc = numbers.getContext("2d")!; nc.fillStyle = "#173956"; nc.font = "bold 142px Arial, sans-serif"; nc.textAlign = "center"; nc.textBaseline = "middle"; nc.fillText("KW21", 256, 130);
    const ntex = new THREE.CanvasTexture(numbers); ntex.colorSpace = THREE.SRGBColorSpace;
    const numberMaterial = new THREE.MeshStandardMaterial({ map: ntex, transparent: true, alphaTest: 0.08, roughness: 0.65, depthWrite: false });
    const number = add(new THREE.PlaneGeometry(0.46, 0.23), numberMaterial, 0, 0.194, -l * 0.365); number.rotation.x = -Math.PI / 2; number.rotation.z = Math.PI;
  }
  // Forward deck panel seams and fastening details make the large white surface legible.
  const panel = [V(-0.23, 0.239, -2.28), V(0.23, 0.239, -2.28), V(0.30, 0.253, -1.83), V(-0.30, 0.253, -1.83)];
  for (let i = 0; i < panel.length; i++) rod(panel[i], panel[(i + 1) % panel.length], 0.005, seam);
  for (const side of [-1, 1]) {
    // The pale deck remains readable in sun through its dark recessed edges.
    rod(V(side * .23, .287, l * .11), V(side * .23, .268, l * .40), .006, seam);
    for (const z of [l * .15, l * .30, l * .40]) add(new THREE.SphereGeometry(.011, 6, 4), steel, side * .23, .287 - (z / l - .11) * .066, z);
  }
  for (const side of [-1, 1]) for (const z of [-1.82, -1.47]) add(new THREE.SphereGeometry(0.015, 8, 6), steel, side * 0.17, 0.27, z);
  return V(0, 0.78, -0.39);
}
