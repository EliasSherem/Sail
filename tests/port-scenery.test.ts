import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { PORTS, portById } from "../src/data/ports";
import { PORT_SCENERY, PORT_LANDMARKS, portSceneProfile } from "../src/data/portScenery";
import { World, worldFromGeoJSON } from "../src/geo/world";
import { fromLocal } from "../src/geo/math";
import { createPortScenery, preloadPortSceneryData } from "../src/render/PortScenery";
import { setPortElevations } from "../src/render/elevation";
import { createTerrainSurfaceSampler } from "../src/render/terrain";
import { disposeObject } from "../src/render/shipModels";
import type { LatLon } from "../src/types";

const world = worldFromGeoJSON(JSON.parse(readFileSync(new URL("../public/data/land.geojson", import.meta.url), "utf8")));
const priorities = ["marseille", "barcelona", "new-york", "acapulco", "los-cabos", "cancun", "veracruz", "haifa", "ashdod", "eilat", "singapore", "sydney"];
beforeAll(async () => {
  const file = readFileSync(new URL("../public/data/port-scenes/osm-buildings.json", import.meta.url), "utf8");
  const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(file));
  await preloadPortSceneryData();
  spy.mockRestore();
  setPortElevations(JSON.parse(readFileSync(new URL("../public/data/port-elevations.json", import.meta.url), "utf8")));
});

describe("geographic port architecture", () => {
  it("gives every port a regional architecture and a deliberate service type", () => {
    expect(PORT_SCENERY).toHaveLength(PORTS.length);
    expect(new Set(PORT_SCENERY.map(p => p.id)).size).toBe(PORTS.length);
    for (const port of PORTS) {
      const profile = portSceneProfile(port.id);
      expect(profile.palette).toHaveLength(5);
      expect(profile.buildings).toBeGreaterThan(0);
      expect(profile.highRise).toBeGreaterThanOrEqual(profile.height);
      expect(profile.description.length).toBeGreaterThan(30);
    }
    expect(new Set(priorities.map(id => {
      const p=portSceneProfile(id);return [p.architecture,p.height,p.highRise,p.buildings,p.streetAngle,p.terminal].join("/");
    })).size).toBe(priorities.length);
    expect(portSceneProfile("eilat").architecture).toBe("desert");
    expect(portSceneProfile("nuuk").architecture).toBe("arctic");
    expect(portSceneProfile("haifa").terminal).toBe("container");
  });

  it.each(priorities)("places finite, bounded, batched scenery entirely on existing land at %s", (id) => {
    const origin = portById(id)!, scenery = createPortScenery(world, origin, 18000, createTerrainSurfaceSampler(world, origin));
    expect(scenery.userData.osmLoaded).toBe(true);
    expect(scenery.userData.buildings).toBeGreaterThan(40);
    expect(scenery.userData.buildings).toBeLessThanOrEqual(1000);
    expect(scenery.children.length).toBeLessThanOrEqual(6);
    expect(scenery.userData.triangles).toBeLessThan(100000);
    for (const footprint of scenery.userData.footprints as { points: LatLon[] }[]) {
      expect(footprint.points.length).toBeGreaterThanOrEqual(7);
      for (const point of footprint.points) expect(world.isLand(point)).toBe(true);
    }
    let bytes=0;
    scenery.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      for (const attribute of Object.values(object.geometry.attributes) as THREE.BufferAttribute[]) {
        expect(Array.from(attribute.array).every(Number.isFinite)).toBe(true);
        bytes+=attribute.array.byteLength;
      }
    });
    expect(bytes).toBeLessThan(20_000_000);
    const size=new THREE.Box3().setFromObject(scenery).getSize(new THREE.Vector3());
    expect(size.y).toBeLessThan(2500);
    expect(Math.max(size.x,size.z)).toBeLessThan(90000);
    disposeObject(scenery);
  });

  it("does not invent reclaimed islands, move landmarks or add buildings to an all-water World", () => {
    const origin=portById("marseille")!, sea=new World([], []);
    const scenery=createPortScenery(sea,origin,18000,()=>0);
    expect(scenery.userData.buildings).toBe(0);
    expect(scenery.userData.footprints).toEqual([]);
    expect(scenery.children).toEqual([]);
    expect(scenery.userData.ports[0].landmarksRejected).toContain("notre-dame-garde");
    const ny=PORT_LANDMARKS.find(m=>m.id==="one-world")!;
    expect(ny.lat).toBeCloseTo(40.7127,4);
    expect(ny.lon).toBeCloseTo(-74.0134,4);
    disposeObject(scenery);
  });

  it("renders the geographically separate NY coast and Manhattan skyline, including One WTC on the detailed land", () => {
    const origin=portById("new-york")!, scenery=createPortScenery(world,origin,18000,createTerrainSurfaceSampler(world,origin));
    const ny=scenery.userData.ports.find((port:{id:string})=>port.id==="new-york");
    expect(ny.landmarksAccepted).toContain("one-world");
    expect(ny.landmarksRejected).not.toContain("one-world");
    const osm=(scenery.userData.footprints as {source:string;points:LatLon[]}[]).filter(p=>p.source==="osm");
    expect(osm.some(p=>p.points[0].lat>40.699&&p.points[0].lat<40.721)).toBe(true);
    expect(osm.some(p=>p.points[0].lat<40.61)).toBe(true);
    expect(ny.osmAccepted+ny.procedural).toBeLessThanOrEqual(750);
    expect(scenery.children.length).toBeLessThanOrEqual(6);
    disposeObject(scenery);
  });

  it("clips candidate footprints at land boundaries instead of leaving partial buildings afloat", () => {
    const origin=portById("marseille")!, center=fromLocal(1700,-1000,origin);
    const ring=[[-350,-350],[350,-350],[350,350],[-350,350],[-350,-350]].map(([x,z])=>fromLocal(x,z,center));
    const clipped=new World([ring], []),scenery=createPortScenery(clipped,origin,18000,()=>5);
    for(const footprint of scenery.userData.footprints as {points:LatLon[]}[])
      for(const point of footprint.points)expect(clipped.isLand(point)).toBe(true);
    expect(scenery.userData.ports[0].osmRejected).toBeGreaterThan(0);
    disposeObject(scenery);
  });
});
