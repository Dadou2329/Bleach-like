// Keyframed animation clips authored in code as sparse key poses (XYZ Euler degrees per bone).
// Each bone's keys form a track; segments are eased (timing) and Hermite-interpolated (path) so
// motion arcs stay smooth through keys while strikes can still snap (outExpo / outBack eases).
import { Pose } from './pose';

export type Euler3 = readonly [number, number, number];
export type EaseName = 'linear' | 'in' | 'out' | 'inOut' | 'outBack' | 'inBack' | 'outExpo' | 'inExpo' | 'outQuart' | 'inQuart' | 'hold' | 'smooth';

export interface KeyDef {
  t: number;
  /** easing of the segment that ENDS at this key */
  ease?: EaseName;
  /** the channels' (c) easing at this key when it differs from the bones' (swing arcs split into steps) */
  cease?: EaseName;
  b?: Record<string, Euler3>;
  /** hips offset in metres */
  hips?: Euler3;
  /**
   * Generic 3-channel tracks (IK targets, weights, fx params): '@gripR' grip position in chest space (m),
   * '@dirR' blade direction, '@edgeR' direction the edge faces, '@poleR' elbow hint, '@ikR' [weight],
   * '@twoHand' [weight] (left hand joins the grip), '@handL' left hand target, '@ikL' [weight].
   */
  c?: Record<string, Euler3>;
}

export interface ClipDef {
  name: string;
  dur: number;
  loop?: boolean;
  keys: KeyDef[];
  /** named events (seconds) */
  events?: Record<string, number>;
  fadeIn?: number;
  fadeOut?: number;
  /** 0 = eased straight segments, 1 = full Catmull-Rom smoothing (default 0.6) */
  tension?: number;
  /** per-bone weight override (bones not listed but keyed get weight 1) */
  weights?: Record<string, number>;
}

const EASES: Record<EaseName, (u: number) => number> = {
  linear: (u) => u,
  in: (u) => u * u * u,
  out: (u) => 1 - (1 - u) ** 3,
  inOut: (u) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2),
  smooth: (u) => u * u * (3 - 2 * u),
  outBack: (u) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * (u - 1) ** 3 + c1 * (u - 1) ** 2;
  },
  inBack: (u) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return c3 * u * u * u - c1 * u * u;
  },
  outExpo: (u) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u)),
  inExpo: (u) => (u <= 0 ? 0 : Math.pow(2, 10 * u - 10)),
  outQuart: (u) => 1 - (1 - u) ** 4,
  inQuart: (u) => u ** 4,
  hold: (u) => (u >= 1 ? 1 : 0),
};
const EASE_LIST = Object.keys(EASES) as EaseName[];

interface Track {
  bone: number;
  t: Float32Array;
  v: Float32Array; // 3 per key
  e: Uint8Array;
}

export interface BoneLookup {
  index(name: string): number;
  readonly count: number;
}

export class Clip {
  readonly name: string;
  readonly dur: number;
  readonly loop: boolean;
  readonly events: Record<string, number>;
  readonly fadeIn: number;
  readonly fadeOut: number;
  readonly weights: Float32Array;
  private tracks: Track[] = [];
  private hipsTrack: Track | null = null;
  private chanTracks = new Map<string, Track>();
  private tension: number;

  constructor(def: ClipDef, lookup: BoneLookup) {
    this.name = def.name;
    this.dur = def.dur;
    this.loop = !!def.loop;
    this.events = def.events ?? {};
    this.fadeIn = def.fadeIn ?? 0.1;
    this.fadeOut = def.fadeOut ?? 0.2;
    this.tension = def.tension ?? 0.6;
    this.weights = new Float32Array(lookup.count);
    const keys = [...def.keys].sort((a, b) => a.t - b.t);
    const byBone = new Map<string, { t: number; v: Euler3; e: EaseName }[]>();
    const hips: { t: number; v: Euler3; e: EaseName }[] = [];
    const chans = new Map<string, { t: number; v: Euler3; e: EaseName }[]>();
    for (const k of keys) {
      for (const [name, v] of Object.entries(k.b ?? {})) {
        let arr = byBone.get(name);
        if (!arr) byBone.set(name, (arr = []));
        arr.push({ t: k.t, v, e: k.ease ?? 'inOut' });
      }
      for (const [name, v] of Object.entries(k.c ?? {})) {
        let arr = chans.get(name);
        if (!arr) chans.set(name, (arr = []));
        arr.push({ t: k.t, v, e: k.cease ?? k.ease ?? 'inOut' });
      }
      if (k.hips) hips.push({ t: k.t, v: k.hips, e: k.ease ?? 'inOut' });
    }
    const mk = (bone: number, arr: { t: number; v: Euler3; e: EaseName }[]): Track => ({
      bone,
      t: Float32Array.from(arr.map((a) => a.t)),
      v: Float32Array.from(arr.flatMap((a) => [a.v[0], a.v[1], a.v[2]])),
      e: Uint8Array.from(arr.map((a) => EASE_LIST.indexOf(a.e))),
    });
    for (const [name, arr] of byBone) {
      const bi = lookup.index(name);
      if (bi < 0) continue; // bone absent on this rig (e.g. no sleeves): skip silently
      this.tracks.push(mk(bi, arr));
      this.weights[bi] = def.weights?.[name] ?? 1;
    }
    if (hips.length) this.hipsTrack = mk(-1, hips);
    for (const [name, arr] of chans) this.chanTracks.set(name, mk(-1, arr));
  }

  /** Channel names this clip drives. */
  get channels(): string[] {
    return [...this.chanTracks.keys()];
  }

  hasChannel(name: string): boolean {
    return this.chanTracks.has(name);
  }

  /** Sample one channel into out[0..2]; returns false if the clip has no such channel. */
  channel(name: string, time: number, out: number[]): boolean {
    const tr = this.chanTracks.get(name);
    if (!tr) return false;
    const t = this.loop ? ((time % this.dur) + this.dur) % this.dur : Math.min(time, this.dur);
    this.sampleTrack(tr, t, out);
    return true;
  }

  get hasHips(): boolean {
    return this.hipsTrack !== null;
  }

  private sampleTrack(tr: Track, time: number, out: number[]): void {
    const n = tr.t.length;
    if (n === 1 || time <= tr.t[0]) {
      out[0] = tr.v[0]; out[1] = tr.v[1]; out[2] = tr.v[2];
      return;
    }
    if (time >= tr.t[n - 1]) {
      const o = (n - 1) * 3;
      out[0] = tr.v[o]; out[1] = tr.v[o + 1]; out[2] = tr.v[o + 2];
      return;
    }
    let i = 0;
    while (i < n - 2 && time >= tr.t[i + 1]) i++;
    const t0 = tr.t[i], t1 = tr.t[i + 1];
    const u = EASES[EASE_LIST[tr.e[i + 1]]]((time - t0) / (t1 - t0));
    const im = Math.max(0, i - 1), ip = Math.min(n - 1, i + 2);
    const dt = t1 - t0;
    const tm = tr.t[im], tp = tr.t[ip];
    const k = this.tension;
    const h00 = 2 * u * u * u - 3 * u * u + 1, h10 = u * u * u - 2 * u * u + u, h01 = -2 * u * u * u + 3 * u * u, h11 = u * u * u - u * u;
    for (let c = 0; c < 3; c++) {
      const p0 = tr.v[i * 3 + c], p1 = tr.v[(i + 1) * 3 + c];
      const pm = tr.v[im * 3 + c], pp = tr.v[ip * 3 + c];
      // finite-difference tangents scaled to this segment
      const m0 = i > 0 ? ((p1 - pm) / (t1 - tm)) * dt * k : 0;
      const m1 = i + 2 < n ? ((pp - p0) / (tp - t0)) * dt * k : 0;
      out[c] = h00 * p0 + h10 * m0 + h01 * p1 + h11 * m1;
    }
  }

  /** Write tracked bones of this clip at `time` into `out` (untracked bones are left untouched). */
  sample(time: number, out: Pose): void {
    const t = this.loop ? ((time % this.dur) + this.dur) % this.dur : Math.min(time, this.dur);
    const v = [0, 0, 0];
    for (const tr of this.tracks) {
      this.sampleTrack(tr, t, v);
      out.setEuler(tr.bone, v[0], v[1], v[2]);
    }
    if (this.hipsTrack) {
      this.sampleTrack(this.hipsTrack, t, v);
      out.hips.set(v[0], v[1], v[2]);
    }
  }
}

/** Mirror a clip left ↔ right: swap .L/.R bones, negate Y/Z rotations and hips X. */
export function mirrorClip(def: ClipDef, name = def.name + '_m'): ClipDef {
  const sw = (n: string) => (n.endsWith('.L') ? n.slice(0, -2) + '.R' : n.endsWith('.R') ? n.slice(0, -2) + '.L' : n);
  return {
    ...def,
    name,
    keys: def.keys.map((k) => ({
      ...k,
      b: k.b ? Object.fromEntries(Object.entries(k.b).map(([n, v]) => [sw(n), [v[0], -v[1], -v[2]] as Euler3])) : undefined,
      hips: k.hips ? ([-k.hips[0], k.hips[1], k.hips[2]] as Euler3) : undefined,
      c: k.c
        ? Object.fromEntries(Object.entries(k.c).map(([n, v]) => [n.endsWith('R') ? n.slice(0, -1) + 'L' : n.endsWith('L') ? n.slice(0, -1) + 'R' : n, n.startsWith('@ik') || n === '@twoHand' ? v : ([-v[0], v[1], v[2]] as Euler3)]))
        : undefined,
    })),
    weights: def.weights ? Object.fromEntries(Object.entries(def.weights).map(([n, w]) => [sw(n), w])) : undefined,
  };
}

export { EASES };
