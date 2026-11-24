import * as THREE from "three";

/** Fine, deterministic finish variation; generated locally and shared by a vessel. */
export function finishGrain() {
  const size = 64, pixels = new Uint8Array(size * size * 4);
  let seed = 3791;
  for (let i = 0; i < size * size; i++) {
    seed = (seed * 16807) % 2147483647;
    const value = 205 + Math.floor(seed / 2147483647 * 50);
    pixels.set([value, value, value, 255], i * 4);
  }
  const texture = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 12);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

/** Painted lettering, not a hovering UI label; one tiny canvas atlas per vessel. */
export function vesselLettering(name: string, color = "#f1eee1", subtitle = "DERIVA · EXPLORER") {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 1024; canvas.height = 256;
  const context = canvas.getContext("2d")!;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = color;
  context.textAlign = "center"; context.textBaseline = "middle";
  context.font = "600 112px Arial, sans-serif";
  context.fillText(name.toLocaleUpperCase("es"), 512, 104, 990);
  context.globalAlpha = .78;
  context.font = "500 31px Arial, sans-serif";
  context.fillText(subtitle, 512, 194, 940);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return new THREE.MeshStandardMaterial({ map: texture, transparent: true, alphaTest: .08,
    depthWrite: false, roughness: .49, polygonOffset: true, polygonOffsetFactor: -1,
    side: THREE.DoubleSide });
}
