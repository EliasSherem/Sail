import * as THREE from "three";

export interface HeadLook {
  yaw: number;
  pitch: number;
}

export function thirdPersonViewport(width: number, height: number) {
  const mobile = width <= 600;
  const center = height * (mobile ? 0.53 : 0.5);
  const top = Math.min(mobile ? 190 : 140, height * 0.24);
  const bottom = Math.max(center + height * 0.12, height - (mobile ? 244 : 210));
  return {
    top,
    bottom,
    offsetY: height / 2 - center,
    above: Math.max(0.1, 2 * (center - top) / height),
    below: Math.max(0.1, 2 * (bottom - center) / height),
  };
}

const MAX_YAW = THREE.MathUtils.degToRad(75);
const MAX_PITCH = THREE.MathUtils.degToRad(25);

/** Drag the view with the pointer, using the same gesture on a mouse or a screen. */
export function dragHeadLook(look: HeadLook, dx: number, dy: number): void {
  look.yaw = THREE.MathUtils.clamp(look.yaw - dx * 0.004, -MAX_YAW, MAX_YAW);
  look.pitch = THREE.MathUtils.clamp(look.pitch + dy * 0.004, -MAX_PITCH, MAX_PITCH);
}

/** Local forward is -Z for every vessel. The eye stays fixed while looking around. */
export function headLookDirection(look: HeadLook, out: THREE.Vector3): THREE.Vector3 {
  return out.set(
    Math.sin(look.yaw) * Math.cos(look.pitch),
    Math.sin(look.pitch),
    -Math.cos(look.yaw) * Math.cos(look.pitch),
  );
}

/**
 * Keep the complete vessel inside the perspective frustum even on a narrow phone.
 * Each corner must fit horizontally and vertically, accounting for its own depth.
 * This is tighter than fitting a bounding sphere, which makes portrait boats tiny.
 */
export function thirdPersonDistance(
  bounds: THREE.Box3,
  target: THREE.Vector3,
  length: number,
  aspect: number,
  zoom: number,
  elevation = 0.32,
  verticalSpace = { above: 0.82, below: 0.82 },
): number {
  const tanVertical = Math.tan(THREE.MathUtils.degToRad(47 / 2));
  const tanHorizontal = tanVertical * 0.82 * Math.max(0.1, aspect);
  const sine = Math.sin(elevation), cosine = Math.cos(elevation);
  let fit = 0;
  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) {
        const ry = y - target.y, rz = z - target.z;
        const depth = ry * sine + rz * cosine;
        const vertical = ry * cosine - rz * sine;
        fit = Math.max(
          fit,
          depth + Math.abs(x - target.x) / tanHorizontal,
          depth + Math.abs(vertical) / (tanVertical * (vertical >= 0 ? verticalSpace.above : verticalSpace.below)),
        );
      }
    }
  }
  return Math.max(length * 1.85 * zoom, fit);
}
