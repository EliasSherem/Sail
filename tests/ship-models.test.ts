import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { SHIPS } from "../src/data/ships";
import { createShipModel, disposeObject } from "../src/render/shipModels";

describe("rendered vessel geometry", () => {
  it.each(SHIPS)("keeps $id finite and inside its physical collision footprint", (ship) => {
    const model = createShipModel(ship);
    const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
    expect(size.x).toBeLessThanOrEqual(ship.beam + 1e-5);
    expect(size.z).toBeLessThanOrEqual(ship.length + 1e-5);
    expect(size.x).toBeGreaterThan(ship.beam * 0.9);
    expect(size.z).toBeGreaterThan(ship.length * 0.9);
    let triangles = 0;
    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      triangles += (child.geometry.index?.count ?? child.geometry.getAttribute("position").count) / 3;
      for (const attribute of Object.values(child.geometry.attributes) as THREE.BufferAttribute[]) {
        expect(Array.from(attribute.array).every(Number.isFinite)).toBe(true);
      }
    });
    // Tiny fittings are batched by finish so detailed vessels remain practical on mobile.
    expect(model.children.length).toBeLessThan(32);
    expect(triangles).toBeLessThan(60000);
    disposeObject(model);
  });

  it.each(SHIPS)("keeps $id glazing transparent to shadows and the forward camera clear after batching", (ship) => {
    const model = createShipModel(ship);
    model.updateMatrixWorld(true);
    let glazing = 0;
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const material = object.material as THREE.Material;
      if (material.transparent) {
        glazing++;
        expect(object.castShadow).toBe(false);
        expect(material.depthWrite).toBe(false);
      }
    });
    expect(glazing).toBeGreaterThan(0);
    const eye = model.userData.bridgeEye as THREE.Vector3;
    const opaque = new THREE.Raycaster(eye, new THREE.Vector3(0, 0, -1)).intersectObject(model, true)
      .filter(hit => !(hit.object as THREE.Mesh).material || !((hit.object as THREE.Mesh).material as THREE.Material).transparent);
    expect(opaque).toHaveLength(0);
    disposeObject(model);
  });

  it.each(SHIPS)("renders an upward-facing dry aft deck on $id", (ship) => {
    const model = createShipModel(ship);
    model.updateMatrixWorld(true);
    const sample = ship.id === "spirit" ? [0.21, 0.25]
      : ship.id === "launch" || ship.id === "yacht" || ship.id === "speedboat" ? [0, 0.25]
      : ship.id === "fishing" ? [0.37, 0.35] : [0, 0.435];
    const ray = new THREE.Raycaster(
      new THREE.Vector3(ship.beam * sample[0], ship.length, ship.length * sample[1]),
      new THREE.Vector3(0, -1, 0),
      0,
      ship.length * 2,
    );
    // Back-face culling applies: reversed deck triangles let this ray fall into the hull.
    const hits = ray.intersectObject(model, true);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].point.y).toBeGreaterThan(ship.length * 0.02);
    expect(hits[0].point.y).toBeLessThan(ship.length * 0.08);
    expect(hits[0].face?.normal.y).toBeGreaterThan(0.9);
    disposeObject(model);
  });

  it("gives the hydroplane two planing sponsons and a clear cockpit eye", () => {
    const ship = SHIPS.find((s) => s.id === "spirit")!;
    const model = createShipModel(ship);
    model.updateMatrixWorld(true);
    for (const side of [-1, 1]) {
      const down = new THREE.Raycaster(new THREE.Vector3(side * ship.beam * 0.44, 3, -ship.length * 0.10), new THREE.Vector3(0, -1, 0));
      const hits = down.intersectObject(model, true);
      expect(hits.length).toBeGreaterThan(0);
      expect(hits[0].point.y).toBeGreaterThan(0.20);
      expect(hits[0].face!.normal.y).toBeGreaterThan(0.9);
    }
    const eye = model.userData.bridgeEye as THREE.Vector3;
    expect(eye.x).toBe(0);
    expect(eye.y).toBeGreaterThan(0.6);
    expect(eye.z).toBeLessThan(0);
    const ahead = new THREE.Raycaster(eye, new THREE.Vector3(0, 0, -1));
    const opaque = ahead.intersectObject(model, true).filter((hit) => {
      const material = (hit.object as THREE.Mesh).material as THREE.Material;
      return !material.transparent || material.opacity > 0.4;
    });
    expect(opaque).toHaveLength(0);
    disposeObject(model);
  });

  it("gives the speedboat a submerged deep-V, two outboards and a clear forward cockpit eye", () => {
    const ship = SHIPS.find((s) => s.id === "speedboat")!;
    const model = createShipModel(ship);
    model.updateMatrixWorld(true);
    const underside = (x: number) => new THREE.Raycaster(new THREE.Vector3(x, -3, 0), new THREE.Vector3(0, 1, 0)).intersectObject(model, true)[0];
    const keel = underside(0), chine = underside(ship.beam * .30);
    expect(keel.point.y).toBeLessThan(-ship.draft * .85);
    expect(chine.point.y - keel.point.y).toBeGreaterThan(.20);
    for (const side of [-1, 1]) {
      const engine = new THREE.Raycaster(new THREE.Vector3(side * ship.beam * .16, 3, ship.length * .47), new THREE.Vector3(0, -1, 0)).intersectObject(model, true)[0];
      expect(engine.point.y).toBeGreaterThan(1);
    }
    const eye = model.userData.bridgeEye as THREE.Vector3;
    expect(eye.x).toBeGreaterThan(0);
    expect(eye.y).toBeGreaterThan(1.4);
    expect(new THREE.Raycaster(eye, new THREE.Vector3(0, 0, -1)).intersectObject(model, true)).toHaveLength(0);
    disposeObject(model);
  });

  it("reclaims spray Points and shared material textures exactly once", () => {
    const texture = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
    const material = new THREE.PointsMaterial({ map: texture, alphaMap: texture });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0], 3));
    const group = new THREE.Group();
    group.add(new THREE.Points(geometry, material), new THREE.Points(geometry, material));
    const geometryDispose = vi.spyOn(geometry, "dispose");
    const materialDispose = vi.spyOn(material, "dispose");
    const textureDispose = vi.spyOn(texture, "dispose");
    disposeObject(group);
    expect(geometryDispose).toHaveBeenCalledTimes(1);
    expect(materialDispose).toHaveBeenCalledTimes(1);
    expect(textureDispose).toHaveBeenCalledTimes(1);
  });
});
