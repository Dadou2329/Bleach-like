// Sword-swing authoring: a swing is an arc of blade directions in a plane (chest space). At angle θ
// the blade points along cosθ·a + sinθ·b, the grip sits at centre + r·(that direction), and the edge
// faces the direction of travel (dθ). Keys give θ over time; this expands them into IK channel keys
// ('@gripR', '@dirR', '@edgeR', '@poleR', '@ikR') to merge with body keys.
import { EASES, type EaseName, type Euler3, type KeyDef } from './clip';

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
  /** which hand holds the blade (default the right): 'L' writes the left-hand channels, 'R2' / 'L2' a second pair of arms */
  hand?: 'R' | 'L' | 'R2' | 'L2';
  /**
   * a gauntlet blade (a pata) that continues the forearm past the knuckles: the arc direction is the
   * hand's down axis and the edge leads along the hand's forward axis (the IK's dir and edge swap roles)
   */
  pata?: boolean;
}

function norm(v: number[]): [number, number, number] {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

/** largest arc (degrees) one key segment may span before swingKeys inserts in-between keys */
const MAX_ARC_STEP = 45;
const ARC_SPLIT_FROM = 60;

/** the time fraction at which an ease reaches `f` (eases are monotonic; overshooting ones fall back to f) */
function easeInverse(ease: EaseName, f: number): number {
  if (ease === 'outBack' || ease === 'inBack' || ease === 'hold') return f;
  const E = EASES[ease];
  let lo = 0, hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (E(mid) < f) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export function swingKeys(s: SwingDef): KeyDef[] {
  const a = norm([...s.a]);
  // b orthogonal to a
  const bd = s.b[0] * a[0] + s.b[1] * a[1] + s.b[2] * a[2];
  const b = norm([s.b[0] - a[0] * bd, s.b[1] - a[1] * bd, s.b[2] - a[2] * bd]);
  const n = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const sense = s.sense ?? 1;
  const tilt = s.tilt ?? 0;
  const h = s.hand ?? 'R';
  /** the grip, blade and edge channels at angle deg and radius scale rs */
  const at = (deg: number, rs: number): Record<string, Euler3> => {
    const th = (deg * Math.PI) / 180;
    const ct = Math.cos(th), st = Math.sin(th);
    let d = [ct * a[0] + st * b[0], ct * a[1] + st * b[1], ct * a[2] + st * b[2]];
    const r = s.r * rs;
    const g: Euler3 = [s.c[0] + d[0] * r, s.c[1] + d[1] * r, s.c[2] + d[2] * r];
    d = norm([d[0] + n[0] * tilt, d[1] + n[1] * tilt, d[2] + n[2] * tilt]);
    const e = norm([(-st * a[0] + ct * b[0]) * sense, (-st * a[1] + ct * b[1]) * sense, (-st * a[2] + ct * b[2]) * sense]);
    return {
      [`@grip${h}`]: g,
      [`@dir${h}`]: (s.pata ? e : d) as unknown as Euler3,
      [`@edge${h}`]: (s.pata ? d : e) as unknown as Euler3,
    };
  };
  const out: KeyDef[] = [];
  s.keys.forEach(([t, deg, ease, pole, rs], i) => {
    // channels interpolate along straight lines: a big arc between two keys would cut its chord, the blade
    // passing in close to the body. Split it into steps that follow the circle, keeping the segment's timing.
    if (i > 0) {
      const [t0, d0, , , rs0] = s.keys[i - 1];
      const span = Math.abs(deg - d0);
      const e = ease ?? 'inOut';
      if (span > ARC_SPLIT_FROM && e !== 'hold') {
        const steps = Math.ceil(span / MAX_ARC_STEP);
        for (let j = 1; j < steps; j++) {
          const f = j / steps;
          const tj = t0 + (t - t0) * easeInverse(e, f);
          out.push({ t: tj, cease: 'linear', c: at(d0 + (deg - d0) * f, (rs0 ?? 1) + ((rs ?? 1) - (rs0 ?? 1)) * f) });
        }
        // the bones keep the key's own ease; only the channels step linearly through the sampled arc
        out.push({ t, ease, cease: 'linear', c: { ...at(deg, rs ?? 1), ...rest(i, pole) } });
        return;
      }
    }
    out.push({ t, ease, c: { ...at(deg, rs ?? 1), ...rest(i, pole) } });
  });
  function rest(i: number, pole: Euler3 | undefined): Record<string, Euler3> {
    const c: Record<string, Euler3> = {
      [`@pole${h}`]: pole ?? s.pole ?? (h.startsWith('L') ? [0.6, -0.5, -0.6] : [-0.6, -0.5, -0.6]),
      [`@ik${h}`]: [1, 0, 0],
    };
    if (s.twoHand) c['@twoHand'] = [s.twoHand[i] ?? 0, 0, 0];
    return c;
  }
  return out;
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
        if (k.cease) cur.cease = k.cease;
      }
    }
  return [...byT.values()].sort((x, y) => x.t - y.t);
}
