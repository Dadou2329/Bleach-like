// Natacha's animation set (docs/kits/natacha.md). On foot (sealed, Shikai, Bankai): upright and graceful, the blade
// low in the right hand, the left hand free for Kidō and for the sky. The string: a thrust, two diagonal cuts, a
// turning level cut, a rising cut. Skills: the iai of Ryūsei, the palm (star pebbles, Kidō), the raised blade of the
// Sky Curtain, the reading (two fingers at the brow), the pointing finger (Rikujōkōrō), "Kagayake" with the blade
// before her face, the constellation traced in three strokes, the blade raised at the sky (rain, meteors), the thrust
// held for the beams, the star lifted overhead and thrown (Kasei), the Bankai with the blade held up to the night, the
// summons with both arms spread, the black star crushed in the left fist, and Kōrin with the arms opening as she rises.
// Final form (floating): the legs together and the toes pointed, six cuts of light, the supernova pressed between the
// hands, the halt of time, the dawn cut from overhead.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type C3 = [number, number, number];
type B = NonNullable<KeyDef['b']>;

function grip(p: C3, dir: C3, pole: C3, ref: C3 = [0, -1, 0]): Record<string, C3> {
  const l = Math.hypot(dir[0], dir[1], dir[2]) || 1;
  const d: C3 = [dir[0] / l, dir[1] / l, dir[2] / l];
  let k = ref[0] * d[0] + ref[1] * d[1] + ref[2] * d[2];
  let e: C3 = [ref[0] - d[0] * k, ref[1] - d[1] * k, ref[2] - d[2] * k];
  if (Math.hypot(e[0], e[1], e[2]) < 0.2) {
    k = d[2];
    e = [-d[0] * k, -d[1] * k, 1 - d[2] * k];
  }
  const el = Math.hypot(e[0], e[1], e[2]) || 1;
  e = [e[0] / el, e[1] / el, e[2] / el];
  return { '@gripR': p, '@dirR': d, '@edgeR': e, '@poleR': pole, '@ikR': [1, 0, 0] };
}
const body = (t: number, b: B, hips?: KeyDef['hips'], ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });
const ch = (t: number, c: Record<string, C3>, ease?: KeyDef['ease']): KeyDef => ({ t, ease, c });

const SHARED = ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name));

// ================================================================== stances

const IDLE: B = {
  // upright and easy, the weight on the left leg, the head tilted a little
  hips: [0, -6, 0], spine: [2, 2, 0], chest: [0, 4, 0], neck: [2, 0, 0], head: [-2, -4, 4],
  'thigh.L': [-6, 0, 3], 'shin.L': [8, 0, 0], 'foot.L': [-2, 0, -2], 'thigh.R': [4, 0, -4], 'shin.R': [6, 0, 0], 'foot.R': [-3, 0, 2],
  'upperarm.L': [-8, 0, 14], 'forearm.L': [-28, 0, 0], 'hand.L': [6, 0, -4],
};
const R = (over: B = {}): B => ({ ...IDLE, ...over });
const HIPS: C3 = [0, -0.015, 0];
/** the blade low in the right hand, its point forward and down */
const G = { p: [-0.24, -0.3, 0.15] as C3, dir: [-0.12, -0.42, 0.9] as C3, pole: [-0.6, -0.3, -0.75] as C3 };
const SG = grip(G.p, G.dir, G.pole);

export const NATACHA_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.012,
  run: { spine: [10, 0, 0], chest: [4, 0, 0], head: [-8, 0, 0], 'upperarm.L': [14, 0, 12], 'forearm.L': [-34, 0, 0] },
  sprint: { spine: [18, 0, 0], chest: [8, 0, 0], head: [-12, 0, 0], 'upperarm.L': [40, 0, 14], 'forearm.L': [-28, 0, 0] },
  swingL: 0.45,
  swingR: 0.12,
  freqScale: 1.05,
  grip: {
    idle: { p: G.p, dir: G.dir, edge: [0, -0.9, -0.42], pole: G.pole },
    walk: { p: [-0.25, -0.3, 0.12], dir: [-0.12, -0.45, 0.88], edge: [0, -0.89, -0.45], pole: G.pole },
    run: { p: [-0.27, -0.22, -0.08], dir: [-0.2, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.27, -0.14, -0.16], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.32, -0.08, 0.08], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

/** the final form floats: the legs together, the knees soft, the toes pointed; the left hand open at her side */
const FLOAT: B = {
  hips: [0, -4, 0], spine: [-2, 2, 0], chest: [-3, 2, 0], neck: [0, 0, 0], head: [-4, -2, 3],
  'thigh.L': [-10, 0, 3], 'shin.L': [24, 0, 0], 'foot.L': [34, 0, -2], 'thigh.R': [-3, 0, -2], 'shin.R': [14, 0, 0], 'foot.R': [38, 0, 2],
  'upperarm.L': [-14, 0, 30], 'forearm.L': [-18, 0, 0], 'hand.L': [10, 0, 12],
};
const F = (over: B = {}): B => ({ ...FLOAT, ...over });
const FG = { p: [-0.36, -0.24, 0.1] as C3, dir: [-0.45, -0.5, 0.74] as C3, pole: [-0.7, -0.2, -0.6] as C3 };
const FSG = grip(FG.p, FG.dir, FG.pole);
const FLEGS: B = { 'thigh.L': FLOAT['thigh.L'], 'shin.L': FLOAT['shin.L'], 'foot.L': FLOAT['foot.L'], 'thigh.R': FLOAT['thigh.R'], 'shin.R': FLOAT['shin.R'], 'foot.R': FLOAT['foot.R'] };

export const NATACHA_FINAL_STANCE: StanceDef = {
  idle: FLOAT,
  idleHips: 0,
  run: { spine: [16, 0, 0], chest: [6, 0, 0], head: [-14, 0, 0], 'upperarm.L': [34, 0, 24], 'forearm.L': [-10, 0, 0] },
  sprint: { spine: [26, 0, 0], chest: [10, 0, 0], head: [-20, 0, 0], 'upperarm.L': [50, 0, 26], 'forearm.L': [-6, 0, 0] },
  swingL: 0.2,
  swingR: 0.05,
  grip: {
    idle: { p: FG.p, dir: FG.dir, edge: [0, -0.83, -0.56], pole: FG.pole },
    walk: { p: FG.p, dir: FG.dir, edge: [0, -0.83, -0.56], pole: FG.pole },
    run: { p: [-0.3, -0.18, -0.12], dir: [-0.3, -0.2, -0.93], edge: [0, -0.98, 0.2], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.3, -0.12, -0.18], dir: [-0.25, -0.05, -0.97], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: FG.p, dir: FG.dir, edge: [0, -0.83, -0.56], pole: FG.pole },
  },
};

/** held under everything in the final form: only the legs (the gait never walks her in the air), a slow sway */
const float: ClipDef = {
  name: 'nt_float', dur: 3.2, loop: true, fadeIn: 0.3, fadeOut: 0.3,
  keys: [
    body(0, FLEGS),
    body(1.6, { ...FLEGS, 'thigh.L': [-14, 0, 4], 'shin.L': [28, 0, 0], 'thigh.R': [-1, 0, -2], 'shin.R': [10, 0, 0] }, undefined, 'inOut'),
    body(3.2, FLEGS, undefined, 'inOut'),
  ],
};

// ================================================================== the string (on foot)

const thrust: ClipDef = {
  name: 'nt_s1', dur: 0.4, fadeIn: 0.04, fadeOut: 0.15,
  events: { step: 0.06, combo: 0.24 },
  keys: mergeKeys(
    [
      ch(0, SG),
      ch(0.08, grip([-0.2, -0.12, -0.06], [-0.05, -0.04, 1], [-0.7, -0.3, -0.6]), 'out'),
      ch(0.15, grip([-0.1, 0.04, 0.48], [-0.08, 0.02, 1], [-0.7, -0.3, -0.4]), 'outExpo'),
      ch(0.24, grip([-0.1, 0.02, 0.46], [-0.08, 0, 1], [-0.7, -0.3, -0.4])),
      ch(0.4, SG, 'inOut'),
    ],
    [
      body(0, R(), HIPS),
      body(0.08, R({ hips: [0, -18, 0], chest: [0, -8, 0], 'thigh.R': [12, 0, -6], 'shin.R': [18, 0, 0] }), [0, -0.04, -0.02], 'out'),
      body(0.15, R({ hips: [4, 6, 0], spine: [8, 2, 0], chest: [4, 2, 0], 'thigh.L': [-36, 0, 4], 'shin.L': [30, 0, 0], 'thigh.R': [22, 0, -6], 'shin.R': [16, 0, 0], 'upperarm.L': [20, 0, 34], 'forearm.L': [-20, 0, 0] }), [0, -0.08, 0.12], 'outExpo'),
      body(0.4, R(), HIPS, 'inOut'),
    ],
  ),
};

function cut(name: string, a: C3, keys: [number, number, 'out' | 'inOut'][], twist: number, o: { launch?: boolean; base?: (over?: B) => B; hips?: C3; grip?: Record<string, C3>; r?: number } = {}): ClipDef {
  const end = keys[keys.length - 1][0];
  const base = o.base ?? R;
  const H0 = o.hips ?? HIPS;
  return {
    name, dur: end, fadeIn: 0.04, fadeOut: 0.15,
    events: { step: 0.06, combo: keys[keys.length - 2][0] + 0.06 },
    keys: mergeKeys(
      swingKeys({ a, b: [0, 0, 1], c: [-0.04, 0.04, 0.1], r: o.r ?? 0.31, pole: [-0.7, -0.4, -0.5], keys }),
      [ch(end, o.grip ?? SG, 'inOut')],
      [
        body(0, base(), H0),
        body(keys[1][0], base({ hips: [0, -twist, 0], spine: [4, -twist * 0.4, 0], chest: [0, -twist * 0.6, 0] }), H0, 'out'),
        body(keys[2][0], base(o.launch
          ? { hips: [-6, twist, 0], spine: [-8, twist * 0.5, 0], chest: [-10, twist * 0.6, 0], 'upperarm.L': [10, 0, 44] }
          : { hips: [6, twist, 0], spine: [10, twist * 0.5, 0], chest: [6, twist * 0.7, 0], 'thigh.L': [-28, 0, 6], 'shin.L': [24, 0, 0], 'thigh.R': [16, 0, -8], 'shin.R': [18, 0, 0], 'upperarm.L': [10, 0, 44] }), [H0[0], H0[1] - 0.05, H0[2] + 0.07], 'out'),
        body(end, base(), H0, 'inOut'),
      ],
    ),
  };
}
const s2 = cut('nt_s2', [-0.7, 0.7, 0], [[0, 40, 'out'], [0.1, 0, 'out'], [0.2, 172, 'out'], [0.42, 140, 'inOut']], 24);
const s3 = cut('nt_s3', [0.7, 0.7, 0], [[0, 40, 'out'], [0.1, 0, 'out'], [0.2, 172, 'out'], [0.42, 140, 'inOut']], -24);
const s4 = cut('nt_s4', [-1, 0.05, 0], [[0, -10, 'out'], [0.1, -40, 'out'], [0.24, 200, 'out'], [0.5, 170, 'inOut']], 40);
const s5 = cut('nt_s5', [0.6, -0.8, 0], [[0, 30, 'out'], [0.1, 10, 'out'], [0.21, 174, 'out'], [0.5, 150, 'inOut']], 14, { launch: true });
s5.events = { step: 0.06 };

export const NATACHA_CHAIN = ['nt_s1', 'nt_s2', 'nt_s3', 'nt_s4', 'nt_s5'];

// ================================================================== the string (floating)

const FH: C3 = [0, 0, 0];
const f1 = cut('nf_s1', [-0.7, 0.7, 0], [[0, 40, 'out'], [0.08, 0, 'out'], [0.17, 172, 'out'], [0.36, 140, 'inOut']], 22, { base: F, hips: FH, grip: FSG, r: 0.34 });
const f2 = cut('nf_s2', [0.7, 0.7, 0], [[0, 40, 'out'], [0.08, 0, 'out'], [0.17, 172, 'out'], [0.36, 140, 'inOut']], -22, { base: F, hips: FH, grip: FSG, r: 0.34 });
const f3 = cut('nf_s3', [-1, 0.05, 0], [[0, -10, 'out'], [0.08, -40, 'out'], [0.2, 200, 'out'], [0.42, 170, 'inOut']], 44, { base: F, hips: FH, grip: FSG, r: 0.34 });
const f4 = cut('nf_s4', [1, 0.05, 0], [[0, -10, 'out'], [0.08, -40, 'out'], [0.2, 200, 'out'], [0.42, 170, 'inOut']], -44, { base: F, hips: FH, grip: FSG, r: 0.34 });
const f5 = cut('nf_s5', [0.6, -0.8, 0], [[0, 30, 'out'], [0.08, 10, 'out'], [0.18, 174, 'out'], [0.4, 150, 'inOut']], 14, { launch: true, base: F, hips: FH, grip: FSG, r: 0.34 });
const f6 = cut('nf_s6', [0, 1, -0.15], [[0, -20, 'out'], [0.12, -60, 'out'], [0.26, 160, 'out'], [0.56, 140, 'inOut']], 0, { base: F, hips: FH, grip: FSG, r: 0.36 });
f6.events = { step: 0.06 };

export const NATACHA_FINAL_CHAIN = ['nf_s1', 'nf_s2', 'nf_s3', 'nf_s4', 'nf_s5', 'nf_s6'];

// ================================================================== skills (on foot)

/** a pose clip: body keys, and the blade's grip at each key (or the hand let go) */
function poseClip(name: string, dur: number, events: Record<string, number>, frames: [number, B, Record<string, C3> | null, C3?, KeyDef['ease']?][], o: { fadeIn?: number; fadeOut?: number } = {}): ClipDef {
  return {
    name, dur, fadeIn: o.fadeIn ?? 0.05, fadeOut: o.fadeOut ?? 0.18, events,
    keys: mergeKeys(
      frames.filter((f) => f[2]).map((f) => ch(f[0], f[2]!, f[4])),
      frames.map((f) => body(f[0], f[1], f[3] ?? HIPS, f[4])),
    ),
  };
}

/** Ryūsei: the blade drawn back low by the left hip, then the iai cut level across as she flashes through */
const iai = poseClip('nt_iai', 0.62, { go: 0.16, cut: 0.22 }, [
  [0, R(), SG],
  [0.14, R({ hips: [10, 30, 0], spine: [10, 14, 0], chest: [6, 16, 0], head: [-8, -26, 0], 'thigh.L': [-40, 0, 8], 'shin.L': [56, 0, 0], 'thigh.R': [20, 0, -8], 'shin.R': [40, 0, 0], 'upperarm.L': [-30, 0, -10], 'forearm.L': [-70, 0, 0] }), grip([0.18, -0.22, 0.02], [0.75, -0.2, -0.62], [-0.7, -0.4, -0.5]), [0, -0.14, -0.02], 'inOut'],
  [0.24, R({ hips: [8, -34, 0], spine: [8, -16, 0], chest: [4, -20, 0], head: [-6, 22, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [40, 0, 0], 'thigh.R': [30, 0, -8], 'shin.R': [30, 0, 0], 'upperarm.L': [10, 0, 60], 'forearm.L': [-10, 0, 0] }), grip([-0.5, 0.02, 0.2], [-0.9, 0.0, -0.42], [-0.6, -0.5, -0.5]), [0, -0.16, 0.1], 'outExpo'],
  [0.4, R({ hips: [8, -34, 0], spine: [8, -16, 0], chest: [4, -20, 0], head: [-6, 22, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [40, 0, 0], 'thigh.R': [30, 0, -8], 'shin.R': [30, 0, 0], 'upperarm.L': [10, 0, 60], 'forearm.L': [-10, 0, 0] }), grip([-0.52, 0.0, 0.18], [-0.92, -0.05, -0.38], [-0.6, -0.5, -0.5]), [0, -0.16, 0.1]],
  [0.62, R(), SG, HIPS, 'inOut'],
]);

const PALM: B = { 'upperarm.L': [-84, 0, -4], 'forearm.L': [-4, 0, 0], 'hand.L': [-70, 0, 0] };
/** the left palm out at the target (star pebbles, Kidō, the black star's opening) */
const palm = poseClip('nt_palm', 0.46, { cast: 0.13 }, [
  [0, R(), SG],
  [0.13, R({ hips: [2, 14, 0], chest: [4, 12, 0], head: [-2, -12, 0], ...PALM, 'thigh.L': [-24, 0, 4], 'shin.L': [22, 0, 0] }), SG, [0, -0.03, 0.05], 'outExpo'],
  [0.32, R({ hips: [2, 14, 0], chest: [4, 12, 0], head: [-2, -12, 0], ...PALM, 'thigh.L': [-24, 0, 4], 'shin.L': [22, 0, 0] }), SG, [0, -0.03, 0.05]],
  [0.46, R(), SG, HIPS, 'inOut'],
]);

/** the pointing finger: the left arm raised straight at the target (Rikujōkōrō) */
const point = poseClip('nt_point', 0.5, { cast: 0.16 }, [
  [0, R(), SG],
  [0.16, R({ hips: [0, 18, 0], chest: [2, 14, 0], head: [-4, -14, 0], 'upperarm.L': [-92, 0, -6], 'forearm.L': [0, 0, 0], 'hand.L': [-10, 0, 0] }), SG, HIPS, 'outExpo'],
  [0.36, R({ hips: [0, 18, 0], chest: [2, 14, 0], head: [-4, -14, 0], 'upperarm.L': [-110, 0, -6], 'forearm.L': [0, 0, 0], 'hand.L': [-10, 0, 0] }), SG],
  [0.5, R(), SG, HIPS, 'inOut'],
]);

/** the Sky Curtain: the blade raised upright before her, the left palm open upward beside it */
const curtain = poseClip('nt_curtain', 0.55, { cast: 0.14 }, [
  [0, R(), SG],
  [0.14, R({ chest: [-4, 0, 0], head: [-8, 0, 0], 'upperarm.L': [-60, 0, 30], 'forearm.L': [-60, 0, 0], 'hand.L': [0, -40, 30] }), grip([-0.12, 0.08, 0.32], [0, 1, 0.08], [-0.8, -0.3, -0.4], [0, 0, 1]), HIPS, 'outExpo'],
  [0.4, R({ chest: [-4, 0, 0], head: [-8, 0, 0], 'upperarm.L': [-60, 0, 30], 'forearm.L': [-60, 0, 0], 'hand.L': [0, -40, 30] }), grip([-0.12, 0.1, 0.32], [0, 1, 0.08], [-0.8, -0.3, -0.4], [0, 0, 1])],
  [0.55, R(), SG, HIPS, 'inOut'],
]);

/** Hoshiyomi: the eyes lowered, two fingers of the left hand at the brow, the blade low and still */
const read = poseClip('nt_read', 0.6, { cast: 0.22 }, [
  [0, R(), SG],
  [0.22, R({ neck: [6, 0, 0], head: [10, -6, 0], 'upperarm.L': [-40, 0, -40], 'forearm.L': [-130, 0, 0], 'hand.L': [-10, 0, -20] }), SG, HIPS, 'inOut'],
  [0.44, R({ neck: [6, 0, 0], head: [10, -6, 0], 'upperarm.L': [-40, 0, -40], 'forearm.L': [-130, 0, 0], 'hand.L': [-10, 0, -20] }), SG],
  [0.6, R(), SG, HIPS, 'inOut'],
]);

/** "Kagayake, Myōjō": the blade raised upright before her face, then swept down and out to her right as it lights */
const release = poseClip('nt_release', 0.9, { name: 0.22, shine: 0.48 }, [
  [0, R(), SG],
  [0.22, R({ chest: [-4, 0, 0], head: [-4, 0, 0], 'upperarm.L': [-50, 0, 10], 'forearm.L': [-80, 0, 0], 'hand.L': [-10, 0, -10] }), grip([-0.06, 0.12, 0.3], [0.02, 1, 0.06], [-0.8, -0.3, -0.4], [0, 0, 1]), HIPS, 'inOut'],
  [0.4, R({ chest: [-6, 0, 0], head: [-6, 0, 0], 'upperarm.L': [-50, 0, 10], 'forearm.L': [-80, 0, 0], 'hand.L': [-10, 0, -10] }), grip([-0.06, 0.14, 0.3], [0.02, 1, 0.06], [-0.8, -0.3, -0.4], [0, 0, 1])],
  [0.52, R({ hips: [2, -16, 0], chest: [4, -16, 0], head: [-2, 10, 0], 'upperarm.L': [0, 0, 40], 'forearm.L': [-20, 0, 0] }), grip([-0.5, -0.08, 0.16], [-0.85, -0.3, 0.42], [-0.6, -0.4, -0.6]), [0, -0.03, 0.03], 'outExpo'],
  [0.9, R(), SG, HIPS, 'inOut'],
]);

/** the constellation drawn in the air: three quick strokes of the blade's point, then a flourish */
const trace = poseClip('nt_trace', 0.7, { cast: 0.5 }, [
  [0, R(), SG],
  [0.12, R({ chest: [-2, 10, 0], head: [-4, -8, 0] }), grip([-0.3, 0.16, 0.34], [-0.4, 0.5, 0.77], [-0.7, -0.3, -0.5]), HIPS, 'out'],
  [0.24, R({ chest: [-2, -6, 0], head: [-4, 6, 0] }), grip([0.0, 0.3, 0.4], [0.2, 0.7, 0.68], [-0.7, -0.3, -0.5]), HIPS, 'out'],
  [0.36, R({ chest: [0, -14, 0], head: [-2, 10, 0] }), grip([0.08, 0.02, 0.42], [0.35, 0.1, 0.93], [-0.7, -0.3, -0.5]), HIPS, 'out'],
  [0.5, R({ hips: [4, -20, 0], chest: [4, -20, 0], head: [0, 14, 0], 'upperarm.L': [0, 0, 50], 'forearm.L': [-10, 0, 0] }), grip([-0.48, -0.06, 0.2], [-0.85, -0.2, 0.48], [-0.6, -0.4, -0.6]), [0, -0.03, 0.04], 'outExpo'],
  [0.7, R(), SG, HIPS, 'inOut'],
]);

/** the blade raised at the sky, held, then pointed down at the target (star rain, meteors) */
const sky = poseClip('nt_sky', 0.8, { raise: 0.2, call: 0.5 }, [
  [0, R(), SG],
  [0.2, R({ spine: [-6, 0, 0], chest: [-10, 0, 0], head: [-26, 0, 0], 'upperarm.L': [-20, 0, 40], 'forearm.L': [-10, 0, 0] }), grip([-0.12, 0.42, 0.06], [-0.05, 1, 0.1], [-0.8, -0.3, -0.4], [0, 0, 1]), [0, 0.01, 0], 'inOut'],
  [0.44, R({ spine: [-6, 0, 0], chest: [-12, 0, 0], head: [-28, 0, 0], 'upperarm.L': [-20, 0, 40], 'forearm.L': [-10, 0, 0] }), grip([-0.12, 0.44, 0.06], [-0.05, 1, 0.1], [-0.8, -0.3, -0.4], [0, 0, 1])],
  [0.56, R({ hips: [4, 0, 0], spine: [8, 0, 0], chest: [6, 0, 0], head: [2, 0, 0], 'thigh.L': [-26, 0, 4], 'shin.L': [24, 0, 0] }), grip([-0.16, 0.06, 0.46], [-0.08, -0.35, 0.93], [-0.7, -0.4, -0.4]), [0, -0.04, 0.05], 'outExpo'],
  [0.8, R(), SG, HIPS, 'inOut'],
]);

/** the thrust held: the blade straight out at the target, the left hand flat under the right wrist (beams) */
const aim = poseClip('nt_aim', 0.4, { fire: 0.22 }, [
  [0, R(), SG],
  [0.22, R({ hips: [2, 10, 0], spine: [4, 6, 0], chest: [2, 6, 0], head: [-2, -8, 0], 'thigh.L': [-30, 0, 4], 'shin.L': [26, 0, 0], 'thigh.R': [16, 0, -6], 'shin.R': [14, 0, 0], 'upperarm.L': [-70, 0, -24], 'forearm.L': [-50, 0, 0], 'hand.L': [0, 0, -30] }), grip([-0.06, 0.04, 0.5], [-0.02, 0.0, 1], [-0.7, -0.4, -0.4]), [0, -0.05, 0.06], 'outExpo'],
  [0.4, R({ hips: [2, 10, 0], spine: [4, 6, 0], chest: [2, 6, 0], head: [-2, -8, 0], 'thigh.L': [-30, 0, 4], 'shin.L': [26, 0, 0], 'thigh.R': [16, 0, -6], 'shin.R': [14, 0, 0], 'upperarm.L': [-70, 0, -24], 'forearm.L': [-50, 0, 0], 'hand.L': [0, 0, -30] }), grip([-0.06, 0.04, 0.52], [-0.02, 0.0, 1], [-0.7, -0.4, -0.4]), [0, -0.05, 0.06]],
]);

/** Kasei: the left hand lifts the star overhead, then hurls it forward */
const heave = poseClip('nt_heave', 0.9, { lift: 0.3, throw: 0.62 }, [
  [0, R(), SG],
  [0.3, R({ spine: [-6, 0, 0], chest: [-10, 0, 0], head: [-20, 0, 0], 'upperarm.L': [-170, 0, 12], 'forearm.L': [-14, 0, 0], 'hand.L': [-40, 0, 0] }), SG, [0, 0.01, 0], 'inOut'],
  [0.5, R({ spine: [-8, 0, 0], chest: [-12, 0, 0], head: [-22, 0, 0], 'upperarm.L': [-172, 0, 12], 'forearm.L': [-16, 0, 0], 'hand.L': [-40, 0, 0] }), SG],
  [0.62, R({ hips: [4, 14, 0], spine: [10, 6, 0], chest: [8, 10, 0], head: [0, -10, 0], 'upperarm.L': [-80, 0, -8], 'forearm.L': [-6, 0, 0], 'hand.L': [-60, 0, 0], 'thigh.L': [-28, 0, 4], 'shin.L': [26, 0, 0] }), SG, [0, -0.04, 0.06], 'outExpo'],
  [0.9, R(), SG, HIPS, 'inOut'],
]);

/** the Bankai: the blade held straight up to the sky, the face lifted, the left hand open; the night falls */
const bankai = poseClip('nt_bankai', 1.5, { name: 0.3, night: 0.85 }, [
  [0, R(), SG],
  [0.3, R({ spine: [-4, 0, 0], chest: [-8, 0, 0], head: [-16, 0, 0], 'upperarm.L': [-30, 0, 46], 'forearm.L': [-16, 0, 0], 'hand.L': [0, 0, 20] }), grip([-0.14, 0.5, 0.08], [-0.04, 1, 0.06], [-0.8, -0.3, -0.4], [0, 0, 1]), [0, 0.01, 0], 'inOut'],
  [1.1, R({ spine: [-6, 0, 0], chest: [-12, 0, 0], head: [-24, 0, 0], 'upperarm.L': [-30, 0, 56], 'forearm.L': [-12, 0, 0], 'hand.L': [0, 0, 20] }), grip([-0.14, 0.52, 0.08], [-0.04, 1, 0.06], [-0.8, -0.3, -0.4], [0, 0, 1])],
  [1.5, R(), SG, HIPS, 'inOut'],
], { fadeOut: 0.3 });

/** the summons: the arms spread wide, the blade high to her right, then swept down with the strike */
const summon = poseClip('nt_summon', 1.1, { call: 0.3, strike: 0.78 }, [
  [0, R(), SG],
  [0.3, R({ spine: [-4, 0, 0], chest: [-8, 0, 0], head: [-18, 0, 0], 'upperarm.L': [-10, 0, 84], 'forearm.L': [-6, 0, 0], 'hand.L': [0, 0, 10] }), grip([-0.5, 0.36, 0.06], [-0.6, 0.78, 0.1], [-0.6, -0.3, -0.7]), [0, 0.01, 0], 'inOut'],
  [0.66, R({ spine: [-6, 0, 0], chest: [-10, 0, 0], head: [-20, 0, 0], 'upperarm.L': [-12, 0, 88], 'forearm.L': [-6, 0, 0], 'hand.L': [0, 0, 10] }), grip([-0.52, 0.4, 0.06], [-0.6, 0.78, 0.12], [-0.6, -0.3, -0.7])],
  [0.8, R({ hips: [6, -10, 0], spine: [12, -6, 0], chest: [8, -8, 0], head: [0, 6, 0], 'upperarm.L': [10, 0, 50], 'thigh.L': [-30, 0, 4], 'shin.L': [28, 0, 0] }), grip([-0.1, -0.12, 0.46], [-0.05, -0.6, 0.8], [-0.7, -0.4, -0.4]), [0, -0.05, 0.06], 'outExpo'],
  [1.1, R(), SG, HIPS, 'inOut'],
]);

/** the black star: the left palm out, then the fingers closing on it */
const crush = poseClip('nt_crush', 0.8, { open: 0.14, close: 0.5 }, [
  [0, R(), SG],
  [0.14, R({ hips: [2, 14, 0], chest: [4, 12, 0], head: [-2, -12, 0], ...PALM }), SG, HIPS, 'outExpo'],
  [0.44, R({ hips: [2, 14, 0], chest: [4, 12, 0], head: [-2, -12, 0], ...PALM }), SG],
  [0.52, R({ hips: [4, 16, 0], chest: [6, 14, 0], head: [0, -12, 0], 'upperarm.L': [-80, 0, -4], 'forearm.L': [-30, 0, 0], 'hand.L': [-10, 0, 0] }), SG, HIPS, 'outExpo'],
  [0.8, R(), SG, HIPS, 'inOut'],
]);

/** the seal: the blade swept down and the left hand closed */
const seal = poseClip('nt_seal', 0.5, { cast: 0.2 }, [
  [0, R(), SG],
  [0.2, R({ head: [6, 0, 0], 'upperarm.L': [-30, 0, -10], 'forearm.L': [-90, 0, 0] }), grip([-0.2, -0.1, 0.3], [0, -0.5, 0.86], [-0.7, -0.3, -0.5]), HIPS, 'inOut'],
  [0.5, R(), SG, HIPS, 'inOut'],
]);

/** Kōrin: the arms open, the head thrown back, the body lifted off the ground into the light */
const korin = poseClip('nt_korin', 1.6, { name: 0.3, rise: 0.7 }, [
  [0, R(), SG],
  [0.3, R({ hips: [0, 0, 0], spine: [6, 0, 0], chest: [8, 0, 0], head: [12, 0, 0], 'upperarm.L': [-10, 0, 20], 'forearm.L': [-60, 0, 0], 'hand.L': [-10, 0, -20] }), grip([-0.16, -0.06, 0.24], [0, -0.3, 0.95], [-0.7, -0.3, -0.5]), [0, -0.03, 0], 'inOut'],
  [1.0, F({ spine: [-8, 0, 0], chest: [-14, 0, 0], head: [-26, 0, 0], 'upperarm.L': [-20, 0, 80], 'forearm.L': [-6, 0, 0], 'hand.L': [0, 0, 16] }), grip([-0.5, 0.1, 0.1], [-0.82, 0.3, 0.48], [-0.6, -0.4, -0.6]), [0, 0.04, 0], 'inOut'],
  [1.6, F(), FSG, [0, 0, 0], 'inOut'],
], { fadeOut: 0.3 });

// ================================================================== skills (floating)

/** the supernova: the hands brought together before the chest, a star pressed between them, then thrust out */
const nova = poseClip('nf_nova', 0.9, { charge: 0.12, fire: 0.5 }, [
  [0, F(), FSG, [0, 0, 0]],
  [0.12, F({ chest: [6, 0, 0], head: [6, 0, 0], 'upperarm.L': [-50, 0, -30], 'forearm.L': [-80, 0, 0], 'hand.L': [-20, 0, -30] }), grip([-0.12, -0.02, 0.26], [0.1, -0.2, 0.97], [-0.7, -0.3, -0.5]), [0, 0, 0], 'inOut'],
  [0.42, F({ chest: [8, 0, 0], head: [8, 0, 0], 'upperarm.L': [-50, 0, -30], 'forearm.L': [-80, 0, 0], 'hand.L': [-20, 0, -30] }), grip([-0.12, -0.02, 0.26], [0.1, -0.2, 0.97], [-0.7, -0.3, -0.5]), [0, 0, 0]],
  [0.5, F({ hips: [0, 14, 0], chest: [-4, 12, 0], head: [-4, -12, 0], ...PALM }), FSG, [0, 0, 0.05], 'outExpo'],
  [0.9, F(), FSG, [0, 0, 0], 'inOut'],
]);

/** the hour of the stars: the blade upright before her face, the left palm raised — everything stops */
const halt = poseClip('nf_halt', 0.7, { stop: 0.24 }, [
  [0, F(), FSG, [0, 0, 0]],
  [0.24, F({ chest: [-2, 0, 0], head: [-2, 0, 0], 'upperarm.L': [-100, 0, 30], 'forearm.L': [-30, 0, 0], 'hand.L': [-60, 0, 0] }), grip([-0.08, 0.12, 0.3], [0.02, 1, 0.06], [-0.8, -0.3, -0.4], [0, 0, 1]), [0, 0, 0], 'outExpo'],
  [0.5, F({ chest: [-2, 0, 0], head: [-2, 0, 0], 'upperarm.L': [-100, 0, 30], 'forearm.L': [-30, 0, 0], 'hand.L': [-60, 0, 0] }), grip([-0.08, 0.14, 0.3], [0.02, 1, 0.06], [-0.8, -0.3, -0.4], [0, 0, 1]), [0, 0, 0]],
  [0.7, F(), FSG, [0, 0, 0], 'inOut'],
]);

/** the floating thrust held (the galaxy cannon) */
const faim = poseClip('nf_aim', 0.4, { fire: 0.22 }, [
  [0, F(), FSG, [0, 0, 0]],
  [0.22, F({ hips: [0, 10, 0], spine: [4, 6, 0], chest: [2, 6, 0], head: [-2, -8, 0], 'upperarm.L': [-70, 0, -24], 'forearm.L': [-50, 0, 0], 'hand.L': [0, 0, -30] }), grip([-0.06, 0.04, 0.5], [-0.02, 0.0, 1], [-0.7, -0.4, -0.4]), [0, 0, 0.04], 'outExpo'],
  [0.4, F({ hips: [0, 10, 0], spine: [4, 6, 0], chest: [2, 6, 0], head: [-2, -8, 0], 'upperarm.L': [-70, 0, -24], 'forearm.L': [-50, 0, 0], 'hand.L': [0, 0, -30] }), grip([-0.06, 0.04, 0.52], [-0.02, 0.0, 1], [-0.7, -0.4, -0.4]), [0, 0, 0.04]],
]);

/** Akatsuki: the blade raised over her head in both hands, held while the light gathers, then the great cut down */
const dawn = poseClip('nf_dawn', 1.6, { raise: 0.3, cut: 1.05 }, [
  [0, F(), FSG, [0, 0, 0]],
  [0.3, F({ spine: [-6, 0, 0], chest: [-10, 0, 0], head: [-14, 0, 0] }), { ...grip([-0.06, 0.5, 0.0], [0, 0.94, -0.34], [-0.8, -0.3, -0.4], [0, 0, 1]), '@twoHand': [1, 0, 0] }, [0, 0.02, 0], 'inOut'],
  [0.95, F({ spine: [-8, 0, 0], chest: [-12, 0, 0], head: [-16, 0, 0] }), { ...grip([-0.06, 0.52, -0.02], [0, 0.92, -0.38], [-0.8, -0.3, -0.4], [0, 0, 1]), '@twoHand': [1, 0, 0] }],
  [1.08, F({ hips: [10, 0, 0], spine: [16, 0, 0], chest: [12, 0, 0], head: [4, 0, 0] }), { ...grip([-0.06, -0.2, 0.42], [0, -0.7, 0.72], [-0.7, -0.4, -0.4]), '@twoHand': [1, 0, 0] }, [0, -0.04, 0.06], 'outExpo'],
  [1.6, F(), { ...FSG, '@twoHand': [0, 0, 0] }, [0, 0, 0], 'inOut'],
], { fadeOut: 0.3 });

// ================================================================== sets

const COMMON = [thrust, s2, s3, s4, s5, iai, palm, point, curtain, read, release, trace, sky, aim, heave, bankai, summon, crush, seal, korin];
const FINAL = [float, f1, f2, f3, f4, f5, f6, nova, halt, faim, dawn];
export const NATACHA_CLIPS: ClipDef[] = [...SHARED, ...COMMON, ...FINAL];
