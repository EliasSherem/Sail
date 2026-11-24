import * as THREE from "three";
import type { Port, VesselState, Weather, LatLon } from "../types";
import { PORTS } from "../data/ports";
import { distance, toLocal } from "../geo/math";
import { waveAt } from "../sim/weather";

/** A conspicuous gameplay mooring buoy, inside the 1 km service area. */
export class DockingBeacon {
  readonly group = new THREE.Group();
  private buoy = new THREE.Group();
  private glow: THREE.MeshBasicMaterial;
  private ring: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  private label: THREE.Sprite;
  private labelCanvas: HTMLCanvasElement;
  private labelTexture: THREE.CanvasTexture;
  private lastLabel = "";
  constructor() {
    this.group.name = "highlighted-mooring-buoy";
    this.group.add(this.buoy);
    const yellow = new THREE.MeshStandardMaterial({ color: "#ffd34a", roughness: .38, metalness: .2, emissive: "#9d6208", emissiveIntensity: .25 });
    const dark = new THREE.MeshStandardMaterial({ color: "#203c44", roughness: .6 });
    const white = new THREE.MeshBasicMaterial({ color: "#fff5cf", toneMapped: false });
    this.glow = new THREE.MeshBasicMaterial({ color: "#ffcd42", transparent: true, depthWrite: false, opacity: .6, toneMapped: false, fog: false });
    const add = (geometry: THREE.BufferGeometry, material: THREE.Material, y: number) => {
      const mesh = new THREE.Mesh(geometry, material); mesh.position.y = y; this.buoy.add(mesh); return mesh;
    };
    add(new THREE.CylinderGeometry(1.9, 2.8, 1.8, 16), yellow, .8);
    add(new THREE.TorusGeometry(2.25, .25, 8, 24), dark, .1).rotation.x = Math.PI / 2;
    add(new THREE.CylinderGeometry(.4, .7, 5.5, 12), yellow, 3.8);
    add(new THREE.CylinderGeometry(.43, .58, 1.1, 12), dark, 3.3);
    add(new THREE.OctahedronGeometry(1.45), yellow, 7.2);
    add(new THREE.SphereGeometry(.52, 12, 8), white, 8.7);
    const beam = add(new THREE.CylinderGeometry(.35, 2.8, 35, 16, 1, true), this.glow, 26);
    beam.material = this.glow; this.glow.opacity = .15;
    this.ring = new THREE.Mesh(new THREE.RingGeometry(9, 10.3, 48), new THREE.MeshBasicMaterial({ color: "#ffd452", transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
    this.ring.rotation.x = -Math.PI / 2; this.ring.position.y = .18; this.buoy.add(this.ring);
    this.labelCanvas = document.createElement("canvas"); this.labelCanvas.width = 512; this.labelCanvas.height = 96;
    this.labelTexture = new THREE.CanvasTexture(this.labelCanvas);
    this.labelTexture.colorSpace = THREE.SRGBColorSpace;
    this.label = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.labelTexture, transparent: true, depthTest: false, depthWrite: false, sizeAttenuation: false, toneMapped: false, fog: false }));
    this.label.scale.set(.25, .047, 1); this.label.position.y = 13; this.label.renderOrder = 5;
    this.buoy.add(this.label);
  }
  update(state: VesselState, weather: Weather, origin: LatLon, waveReference: LatLon, targetId?: string, visualTime = state.simTime) {
    const nearest = PORTS.reduce((a, b) => distance(a, state) < distance(b, state) ? a : b, PORTS[0]);
    const target = PORTS.find(p => p.id === targetId);
    const port: Port = target && distance(target, state) < 8000 ? target : nearest;
    const range = distance(port, state);
    this.group.visible = range < 8000;
    if (!this.group.visible) return;
    const p = toLocal(port, origin), wave = toLocal(port, waveReference);
    this.group.position.set(p.x + 90, waveAt(wave.x + 90, -wave.z, state.simTime, weather).height, p.z);
    this.buoy.rotation.z = Math.sin(visualTime * .8) * .035;
    const pulse = .5 + .5 * Math.sin(visualTime * 2.7);
    this.glow.opacity = .07 + pulse * .09;
    this.ring.material.opacity = .35 + pulse * .25;
    const text = `ATRAQUE · ${port.name} · ${range < 1000 ? `${Math.round(range / 10) * 10} m` : `${(range / 1000).toFixed(1)} km`}`;
    if (text !== this.lastLabel) {
      this.lastLabel = text;
      const ctx = this.labelCanvas.getContext("2d")!;
      ctx.clearRect(0, 0, 512, 96);
      ctx.fillStyle = "rgba(17,42,46,.94)"; ctx.beginPath(); ctx.roundRect(2, 12, 508, 72, 18); ctx.fill();
      ctx.strokeStyle = "#ffd452"; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = "#ffe187"; ctx.font = "bold 24px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(text, 256, 49, 474); this.labelTexture.needsUpdate = true;
    }
  }
}
