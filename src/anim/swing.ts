// Sword-swing authoring: a swing is an arc of blade directions in a plane (chest space). At angle θ
// the blade points along cosθ·a + sinθ·b, the grip sits at centre + r·(that direction), and the edge
// faces the direction of travel (dθ). Keys give θ over time; this expands them into IK channel keys
// ('@gripR', '@dirR', '@edgeR', '@poleR', '@ikR') to merge with body keys.
import type { EaseName, Euler3, KeyDef } from './clip';

export interface SwingDef {
  /** plane axes (chest space; need not be unit, re-orthonormalised) */
  a: Euler3;
  b: Euler3;
  /** swing centre (chest space, m) */
  c: Euler3;
  /** hand distance from the centre (m) */
  r: number;
  /** blade pitch out of the plane (tilts the tip toward n = a × b), radians-ish factor */
  tilt?: number;
  /** elbow pole (chest space) — single value or per key */
  pole?: Euler3;
  /** direction of travel: +1 = increasing θ */
  sense?: number;
  /** keys: [time, θ in degrees, ease?, pole?, radius scale?] */
  keys: [number, number, EaseName?, Euler3?, number?][];
  /** two-handed weight per key (optional, same length as keys) */
  twoHand?: number[];
}

function norm(v: number[]): [number, number, number] {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

export function swingKeys(s: SwingDef): KeyDef[] {
  const a = norm([...s.a]);
  // b orthogonal to a
  const bd = s.b[0] * a[0] + s.b[1] * a[1] + s.b[2] * a[2];
  const b = norm([s.b[0] - a[0] * bd, s.b[1] - a[1] * bd, s.b[2] - a[2] * bd]);
  const n = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const sense = s.sense ?? 1;
  const tilt = s.tilt ?? 0;
  return s.keys.map(([t, deg, ease, pole, rs], i) => {
    const th = (deg * Math.PI) / 180;
    const ct = Math.cos(th), st = Math.sin(th);
    let d = [ct * a[0] + st * b[0], ct * a[1] + st * b[1], ct * a[2] + st * b[2]];
    const r = s.r * (rs ?? 1);
    const g: Euler3 = [s.c[0] + d[0] * r, s.c[1] + d[1] * r, s.c[2] + d[2] * r];
    d = norm([d[0] + n[0] * tilt, d[1] + n[1] * tilt, d[2] + n[2] * tilt]);
    const e = norm([(-st * a[0] + ct * b[0]) * sense, (-st * a[1] + ct * b[1]) * sense, (-st * a[2] + ct * b[2]) * sense]);
    const c: Record<string, Euler3> = {
      '@gripR': g,
      '@dirR': d as unknown as Euler3,
      '@edgeR': e as unknown as Euler3,
      '@poleR': pole ?? s.pole ?? [-0.6, -0.5, -0.6],
      '@ikR': [1, 0, 0],
    };
    if (s.twoHand) c['@twoHand'] = [s.twoHand[i] ?? 0, 0, 0];
    return { t, ease, c };
  });
}

/** Merge several key lists (same times merge their bone/channel maps). */
export function mergeKeys(...lists: KeyDef[][]): KeyDef[] {
  const byT = new Map<number, KeyDef>();
  for (const list of lists)
    for (const k of list) {
      const cur = byT.get(k.t);
      if (!cur) byT.set(k.t, { ...k, b: k.b ? { ...k.b } : undefined, c: k.c ? { ...k.c } : undefined });
      else {
        if (k.b) cur.b = { ...(cur.b ?? {}), ...k.b };
        if (k.c) cur.c = { ...(cur.c ?? {}), ...k.c };
        if (k.hips) cur.hips = k.hips;
        if (k.ease) cur.ease = k.ease;
      }
    }
  return [...byT.values()].sort((x, y) => x.t - y.t);
}
