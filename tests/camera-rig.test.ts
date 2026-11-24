import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { SHIPS } from "../src/data/ships";
import { dragHeadLook, headLookDirection, thirdPersonDistance, thirdPersonViewport } from "../src/render/cameraRig";
import { createShipModel, disposeObject } from "../src/render/shipModels";

describe("vessel camera framing", () => {
  it.each(SHIPS)("keeps the complete $id visible at maximum zoom on desktop and phone", (ship) => {
    const model = createShipModel(ship);
    const bounds = new THREE.Box3().setFromObject(model);
    const target = new THREE.Vector3(0, ship.length * 0.075, -ship.length * 0.08);
    for (const [width, height] of [[1440, 900], [390, 844]]) {
      const aspect = width / height;
      const viewport = thirdPersonViewport(width, height);
      const distance = thirdPersonDistance(bounds, target, ship.length, aspect, 0.55, 0.32, viewport);
      const camera = new THREE.PerspectiveCamera(47, aspect, 0.2, 70000);
      camera.setViewOffset(width, height, 0, viewport.offsetY, width, height);
      camera.position.set(0, Math.sin(0.32) * distance, Math.cos(0.32) * distance).add(target);
      camera.lookAt(target);
      camera.updateMatrixWorld(true);
      for (const x of [bounds.min.x, bounds.max.x]) {
        for (const y of [bounds.min.y, bounds.max.y]) {
          for (const z of [bounds.min.z, bounds.max.z]) {
            const screen = new THREE.Vector3(x, y, z).project(camera);
            expect(Math.abs(screen.x)).toBeLessThanOrEqual(0.821);
            const screenY = (1 - screen.y) * height / 2;
            expect(screenY).toBeGreaterThanOrEqual(viewport.top - 0.01);
            expect(screenY).toBeLessThanOrEqual(viewport.bottom + 0.01);
            expect(screen.z).toBeGreaterThan(-1);
            expect(screen.z).toBeLessThan(1);
          }
        }
      }
    }
    disposeObject(model);
  });

  it("limits long first-person drags and always keeps the horizon ahead", () => {
    const look = { yaw: 0, pitch: 0 };
    dragHeadLook(look, 100000, -100000);
    expect(THREE.MathUtils.radToDeg(look.yaw)).toBeCloseTo(-75);
    expect(THREE.MathUtils.radToDeg(look.pitch)).toBeCloseTo(-25);
    const direction = headLookDirection(look, new THREE.Vector3());
    expect(direction.length()).toBeCloseTo(1);
    expect(direction.z).toBeLessThan(0);
    dragHeadLook(look, -100000, 100000);
    expect(THREE.MathUtils.radToDeg(look.yaw)).toBeCloseTo(75);
    expect(THREE.MathUtils.radToDeg(look.pitch)).toBeCloseTo(25);
  });

  it("looks directly over the bow after resetting the view", () => {
    expect(headLookDirection({ yaw: 0, pitch: 0 }, new THREE.Vector3()).toArray()).toEqual([0, 0, -1]);
  });
});
