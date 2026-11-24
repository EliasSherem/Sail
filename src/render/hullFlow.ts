/** Renderer flow conventions: u forward, v starboard; heading/yaw clockwise from north. */
export interface HullFlowMotion { heading: number; u: number; v: number; yawRate: number }
export interface FlowPoint { x: number; z: number; vx: number; vz: number }
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Rigid-body contact velocity, including angular motion about the hull centre.
 * a is metres forward; b is metres starboard. Scene north is negative Z.
 */
export function contactFlow(motion: HullFlowMotion, a: number, b: number) {
  const sine = Math.sin(motion.heading), cosine = Math.cos(motion.heading);
  const u = motion.u - motion.yawRate * b;
  const v = motion.v + motion.yawRate * a;
  const vx = sine * u + cosine * v, vz = -cosine * u + sine * v;
  return {
    offsetX: sine * a + cosine * b,
    offsetZ: -cosine * a + sine * b,
    u, v, vx, vz,
    speed: Math.hypot(u, v),
    course: Math.atan2(vx, -vz),
  };
}

/** Signed starboard loading; a right-hand forward turn loads the outer port side.
 * Multiplying by signed u naturally reverses the loaded side when backing up.
 * Sway reinforces the actual side ploughing through the water, without using controls.
 */
export function outsideWaterLoad(u: number, v: number, yawRate: number) {
  return clamp(-u * yawRate / 9.81 * 0.65 + v / Math.max(3, Math.abs(u)) * 0.7, -0.85, 0.85);
}

/** Tangent-continuous passage between observed water contacts. Tangents are bounded
 * by the observed chord during a large render hitch, avoiding unsupported huge loops.
 */
export function waterPath(a: FlowPoint, b: FlowPoint, elapsed: number, t: number): FlowPoint {
  const chord = Math.hypot(b.x - a.x, b.z - a.z);
  const span = Math.max(1e-8, elapsed);
  const tangentScale = Math.min(1, Math.max(0.02, chord * 2) / Math.max(1e-8, span * Math.max(Math.hypot(a.vx, a.vz), Math.hypot(b.vx, b.vz))));
  const t2 = t * t, t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
  const d00 = (6 * t2 - 6 * t) / span, d10 = 3 * t2 - 4 * t + 1;
  const d01 = (-6 * t2 + 6 * t) / span, d11 = 3 * t2 - 2 * t;
  return {
    x: h00 * a.x + h10 * a.vx * span * tangentScale + h01 * b.x + h11 * b.vx * span * tangentScale,
    z: h00 * a.z + h10 * a.vz * span * tangentScale + h01 * b.z + h11 * b.vz * span * tangentScale,
    vx: d00 * a.x + d10 * a.vx * tangentScale + d01 * b.x + d11 * b.vx * tangentScale,
    vz: d00 * a.z + d10 * a.vz * tangentScale + d01 * b.z + d11 * b.vz * tangentScale,
  };
}
