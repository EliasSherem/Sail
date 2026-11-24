import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { portById } from "../src/data/ports";
import { portSceneProfile } from "../src/data/portScenery";
import { portTimeZone } from "../src/data/portTimeZones";
import { fromLocal, toLocal } from "../src/geo/math";
import { World } from "../src/geo/world";
import { createPortScenery } from "../src/render/PortScenery";
import { coastalBiome, setPortElevations } from "../src/render/elevation";
import { disposeObject } from "../src/render/shipModels";
import { createTerrain } from "../src/render/terrain";
import { clockAtPosition } from "../src/sim/timeZones";
import type { LatLon } from "../src/types";

const antarctic = ["fildes-bay", "deception-island", "port-lockroy"];
const square = (center: LatLon, half: number) =>
  [[-half,-half], [half,-half], [half,half], [-half,half], [-half,-half]].map(([x,z]) => fromLocal(x,z,center));

describe("southern ports and Antarctic shore scenery", () => {
  it.each(antarctic)("uses a small treeless polar base at %s", id => {
    const port = portById(id)!, profile = portSceneProfile(id), biome = coastalBiome(port);
    expect(port).toBeDefined();
    expect(profile.architecture).toBe("polar");
    expect(profile.terminal).toBe("research");
    expect(profile.buildings).toBeLessThanOrEqual(16);
    expect(profile.highRise).toBeLessThanOrEqual(6);
    expect(profile.cityRadius).toBeLessThanOrEqual(230);
    expect(biome.trees).toBe("none");
    expect(biome.treeDensity).toBe(0);
    expect(biome.vegetation).toBe(0);
    expect(biome.snowLine).toBeLessThanOrEqual(100);
  });

  it("distinguishes volcanic Deception, wooded Tierra del Fuego and exposed Patagonian steppe", () => {
    expect(coastalBiome(portById("deception-island")!).id).toBe("polar-volcanic");
    expect(coastalBiome(portById("fildes-bay")!).id).toBe("polar");
    expect(coastalBiome(portById("ushuaia")!).trees).toBe("broadleaf");
    expect(coastalBiome(portById("puerto-natales")!).snowLine).toBeLessThan(1000);
    expect(coastalBiome(portById("rio-gallegos")!).trees).toBe("none");
    expect(coastalBiome(portById("cape-horn")!).trees).toBe("none");
    for (const id of ["puerto-montt", "puerto-chacabuco", "puerto-natales", "punta-arenas", "ushuaia", "puerto-williams"])
      expect(portSceneProfile(id).architecture).toBe("northern");
    expect(portSceneProfile("cape-horn").buildings).toBe(3);
  });

  it.each(antarctic)("builds modest finite land-only base geometry at %s", id => {
    const port = portById(id)!, profile = portSceneProfile(id), center = profile.city!;
    const world = new World([square(center, 800)], []);
    const scenery = createPortScenery(world, port, 3000, () => 3);
    try {
      const stats = scenery.userData.ports.find((p: {id: string}) => p.id === id);
      expect(stats.procedural).toBeGreaterThan(0);
      expect(stats.procedural + stats.osmAccepted).toBeLessThanOrEqual(profile.buildings);
      expect(stats.terminal).toBe(true);
      for (const footprint of scenery.userData.footprints as {source: string; points: LatLon[]}[]) {
        for (const point of footprint.points) expect(world.isLand(point)).toBe(true);
        if (footprint.source === "terminal") {
          const local = footprint.points.map(point => toLocal(point, footprint.points[0]));
          expect(Math.max(...local.map(p => p.x)) - Math.min(...local.map(p => p.x))).toBeLessThan(37);
          expect(Math.max(...local.map(p => p.z)) - Math.min(...local.map(p => p.z))).toBeLessThan(25);
        }
      }
      const bounds = new THREE.Box3().setFromObject(scenery);
      expect(bounds.max.y).toBeLessThan(12);
      expect(scenery.userData.triangles).toBeLessThan(5000);
      scenery.traverse(object => {
        if (object instanceof THREE.Mesh)
          expect(Array.from(object.geometry.attributes.position.array).every(Number.isFinite)).toBe(true);
      });
    } finally { disposeObject(scenery); }
  });

  it("renders snow on high Antarctic ground and emits no trees or shrubs", () => {
    const origin = portById("fildes-bay")!;
    const heights = Buffer.alloc(18);
    for (let i = 0; i < 9; i++) heights.writeInt16LE(300, i * 2);
    setPortElevations({ version: 1, size: 3, spacingMeters: 1000, sourceZoom: 10, encoding: "int16-le-base64",
      patches: [{id: "polar-test", latMin: origin.lat - .1, lonMin: origin.lon - .1, latStep: .1, lonStep: .1, data: heights.toString("base64")}] });
    const terrain = createTerrain(new World([square(origin, 1100)], []), origin, 1500);
    try {
      const ground = terrain.children[0] as THREE.Mesh;
      const positions = ground.geometry.attributes.position, colors = ground.geometry.attributes.color;
      let snowVertices = 0;
      for (let i = 0; i < positions.count; i++) if (positions.getY(i) > 250) {
        expect(Math.min(colors.getX(i), colors.getY(i), colors.getZ(i))).toBeGreaterThan(.55);
        snowVertices++;
      }
      expect(snowVertices).toBeGreaterThan(10);
      // Rocks use the textured material; foliage/trunk batches never should exist.
      for (const mesh of terrain.children.filter((child): child is THREE.InstancedMesh => child instanceof THREE.InstancedMesh))
        expect((mesh.material as THREE.MeshStandardMaterial).map).not.toBeNull();
    } finally {
      disposeObject(terrain);
      setPortElevations({version: 1, size: 3, spacingMeters: 1000, sourceZoom: 10, encoding: "int16-le-base64", patches: []});
    }
  });

  it("keeps the visible gameplay dock footprint with only low polar service equipment", () => {
    const origin = portById("port-lockroy")!;
    const dock = {portId: origin.id, center: origin, width: 32, length: 300, heading: 0};
    const world = new World([], [dock]), before = JSON.stringify(world.docks);
    const terrain = createTerrain(world, origin, 1000);
    try {
      const bounds = new THREE.Box3().setFromObject(terrain);
      expect(bounds.max.y).toBeLessThan(6);
      expect(bounds.min.z).toBeLessThanOrEqual(-150);
      expect(bounds.max.z).toBeGreaterThanOrEqual(150);
      expect(JSON.stringify(world.docks)).toBe(before);
    } finally { disposeObject(terrain); }
  });
});

describe("southern civil and station operating time", () => {
  it.each([
    ["ushuaia", "America/Argentina/Ushuaia"], ["rio-gallegos", "America/Argentina/Rio_Gallegos"],
    ["punta-arenas", "America/Punta_Arenas"], ["puerto-natales", "America/Punta_Arenas"],
    ["puerto-williams", "America/Punta_Arenas"], ["cape-horn", "America/Punta_Arenas"],
    ["puerto-chacabuco", "America/Coyhaique"], ["fildes-bay", "America/Punta_Arenas"],
    ["deception-island", "Etc/GMT+3"], ["port-lockroy", "Etc/GMT+3"],
  ])("uses the intended current UTC−03 zone at %s in summer and winter", (id, zone) => {
    const port = portById(id)!;
    expect(portTimeZone(port)).toBe(zone);
    for (const date of ["2026-01-15T12:00:00Z", "2026-07-15T12:00:00Z"]) {
      const clock = clockAtPosition(port, Date.parse(date));
      expect(clock.timeZone).toBe(zone);
      expect(clock.offsetMinutes).toBe(-180);
      expect(clock.hour).toBe(9);
      expect(clock.source).toBe("civil");
    }
  });

  it("keeps seasonal central Chile rules at Puerto Montt", () => {
    const port = portById("puerto-montt")!;
    expect(clockAtPosition(port, Date.parse("2026-01-15T12:00:00Z")).offsetMinutes).toBe(-180);
    expect(clockAtPosition(port, Date.parse("2026-07-15T12:00:00Z")).offsetMinutes).toBe(-240);
  });
});
