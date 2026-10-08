// Yumichika Ayasegawa's animation set (docs/kits/yumichika.md). Posed and theatrical: the left hand on the hip, the
// weight on one leg, the sword held out low to the side like a fencer's. Sealed: the lunge, a slash, the rising
// flourish, the pirouette; Beautiful Swordfight's flurry of clashes; Kidō from the left palm (Shakkahō, Hainawa,
// Daichi Ten'yō's lift and hurl); the hair fix; "Sake" with the palm drawn along the blade. Fuji Kujaku: hooking
// sweeps with the fan, the fan spin (two turns on the spot), the blade catch, "Sakikurue" with the fan raised high.
// Ruri'iro Kujaku: the hilt flicked to lash, flung wide to burst, thrust and drawn back to ensnare, the left hand
// opened for the bloom, a petal to the lips, the hilt pointed at the ground for the thicket.
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

const IDLE: B = {
  // hip cocked, the left hand set on it, the chin up
  hips: [0, -14, -4], spine: [-2, 6, 3], chest: [-2, 8, 2], neck: [-2, 0, 0], head: [-6, -10, 4],
  'thigh.L': [-8, 0, 2], 'shin.L': [8, 0, 0], 'foot.L': [-2, 0, 0], 'thigh.R': [-14, -10, -10], 'shin.R': [24, 0, 0], 'foot.R': [-8, 0, 0],
  'upperarm.L': [60, -10, 32], 'forearm.L': [-115, 0, 0], 'hand.L': [0, 0, -6],
};
/** the fighting base: square to the target, the free hand off the hip */
const FIGHT: B = {
  hips: [0, -10, 0], spine: [2, 4, 0], chest: [0, 6, 0], neck: [0, 0, 0], head: [-2, -6, 0],
  'thigh.L': [-14, 0, 4], 'shin.L': [16, 0, 0], 'foot.L': [-4, 0, 0], 'thigh.R': [8, 0, -6], 'shin.R': [10, 0, 0], 'foot.R': [-4, 0, 0],
  'upperarm.L': [10, 0, 24], 'forearm.L': [-34, 0, 0], 'hand.L': [0, 0, 10],
};
const R = (over: B = {}): B => ({ ...FIGHT, ...over });
const HIPS: C3 = [0, -0.03, 0];

const G_SEALED = { p: [-0.36, -0.22, 0.16] as C3, dir: [-0.5, -0.45, 0.74] as C3, edge: [0.2, -0.85, -0.48] as C3, pole: [-0.7, -0.3, -0.6] as C3 };
const SG = grip(G_SEALED.p, G_SEALED.dir, G_SEALED.pole);
const G_FUJI = { p: [-0.34, 0.02, 0.12] as C3, dir: [-0.3, 0.9, 0.3] as C3, edge: [0.1, -0.3, 0.95] as C3, pole: [-0.8, -0.4, -0.3] as C3 };
const FG = grip(G_FUJI.p, G_FUJI.dir, G_FUJI.pole, [0, 0, 1]);
const G_RURI = { p: [-0.18, 0.0, 0.34] as C3, dir: [-0.1, 0.25, 0.96] as C3, edge: [0, -0.96, 0.25] as C3, pole: [-0.8, -0.4, -0.3] as C3 };
const RG = grip(G_RURI.p, G_RURI.dir, G_RURI.pole);

export const YUMICHIKA_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.025,
  run: { 'upperarm.L': [-30, 0, 14], 'forearm.L': [-60, 0, 0], 'hand.L': [0, 0, 0], chest: [4, 0, 0] },
  sprint: { spine: [18, 0, 0], 'upperarm.L': [40, 0, 14], 'forearm.L': [-30, 0, 0], 'hand.L': [10, 0, 0] },
  swingL: 0.8,
  swingR: 0.2,
  grip: {
    idle: G_SEALED,
    walk: { p: [-0.34, -0.24, 0.14], dir: [-0.45, -0.5, 0.74], edge: [0.2, -0.85, -0.48], pole: G_SEALED.pole },
    run: { p: [-0.3, -0.24, -0.1], dir: [-0.2, -0.25, -0.95], edge: [0, -0.96, 0.25], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.28, -0.12, -0.2], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.36, -0.08, 0.1], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

/** Fuji Kujaku: the fan held up beside his shoulder, the blades spread behind it like a tail. */
export const FUJI_STANCE: StanceDef = {
  ...YUMICHIKA_STANCE,
  grip: { ...YUMICHIKA_STANCE.grip, idle: G_FUJI, walk: { ...G_FUJI, p: [-0.34, 0.0, 0.1] } },
};

/** Ruri'iro Kujaku: the hilt held out before him, the vines pouring from it. */
export const RURI_STANCE: StanceDef = {
  ...YUMICHIKA_STANCE,
  grip: { ...YUMICHIKA_STANCE.grip, idle: G_RURI, walk: { ...G_RURI, p: [-0.2, -0.02, 0.32] } },
};

// ================================================================== sealed string

// 1: the lunge, the point straight at them
const s1: ClipDef = {
  name: 'ym_s1', dur: 0.44, fadeIn: 0.05, fadeOut: 0.16,
  events: { step: 0.08, combo: 0.26 },
  keys: mergeKeys(
    [
      ch(0, SG),
      ch(0.09, grip([-0.26, -0.16, -0.1], [-0.05, -0.05, 1], [-0.7, -0.3, -0.6]), 'out'),
      ch(0.17, grip([-0.12, 0.04, 0.56], [-0.12, 0.02, 1], [-0.7, -0.3, -0.4]), 'outExpo'),
      ch(0.26, grip([-0.12, 0.02, 0.54], [-0.12, 0.0, 1], [-0.7, -0.3, -0.4])),
      ch(0.44, SG, 'inOut'),
    ],
    [
      body(0, R(), HIPS),
      body(0.09, R({ hips: [0, -20, 0], spine: [2, -8, 0], chest: [0, -10, 0], head: [2, 14, 0], 'thigh.R': [14, 0, -6], 'shin.R': [20, 0, 0] }), [0, -0.05, -0.03], 'out'),
      body(0.17, R({ hips: [4, 4, 0], spine: [10, 2, 0], chest: [6, 2, 0], head: [-2, -6, 0], 'thigh.L': [-40, 0, 4], 'shin.L': [30, 0, 0], 'thigh.R': [26, 0, -6], 'shin.R': [16, 0, 0], 'upperarm.L': [30, 0, 50], 'forearm.L': [-10, 0, 0] }), [0, -0.1, 0.12], 'outExpo'),
      body(0.44, R(), HIPS, 'inOut'),
    ],
  ),
};

// 2: a slash, high right to low left
const s2: ClipDef = {
  name: 'ym_s2', dur: 0.44, fadeIn: 0.05, fadeOut: 0.16,
  events: { step: 0.06, combo: 0.26 },
  keys: mergeKeys(
    swingKeys({ a: [-0.7, 0.7, 0], b: [0, 0, 1], c: [-0.04, 0.05, 0.12], r: 0.36, pole: [-0.7, -0.4, -0.5], keys: [[0, 40, 'out'], [0.1, 0, 'out'], [0.2, 170, 'out'], [0.44, 140, 'inOut']] }),
    [ch(0.44, SG, 'inOut')],
    [
      body(0, R(), HIPS),
      body(0.1, R({ hips: [0, -24, 0], spine: [4, -8, 0], chest: [0, -12, 0], head: [-2, 14, 0] }), HIPS, 'out'),
      body(0.2, R({ hips: [6, 16, 0], spine: [10, 10, 0], chest: [6, 14, 0], head: [-4, -12, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [26, 0, 0], 'thigh.R': [18, 0, -8], 'shin.R': [20, 0, 0], 'upperarm.L': [10, 0, 50] }), [0, -0.07, 0.08], 'out'),
      body(0.44, R(), HIPS, 'inOut'),
    ],
  ),
};

// 3: the rising flourish, low left to high right, a turn of the wrist at the top (launches)
const s3: ClipDef = {
  name: 'ym_s3', dur: 0.5, fadeIn: 0.05, fadeOut: 0.18,
  events: { step: 0.06, combo: 0.3 },
  keys: mergeKeys(
    swingKeys({ a: [0.6, -0.8, 0], b: [0, 0, 1], c: [-0.04, 0.0, 0.12], r: 0.36, pole: [-0.6, -0.5, -0.5], keys: [[0, 30, 'out'], [0.1, 10, 'out'], [0.21, 175, 'out'], [0.36, 200, 'out'], [0.5, 160, 'inOut']] }),
    [ch(0.5, SG, 'inOut')],
    [
      body(0, R(), HIPS),
      body(0.1, R({ hips: [10, 18, 0], spine: [14, 12, 0], chest: [10, 16, 0], head: [-6, -14, 0], 'thigh.L': [-30, 0, 8], 'shin.L': [44, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [34, 0, 0] }), [0, -0.14, 0.02], 'out'),
      body(0.21, R({ hips: [-6, -16, 0], spine: [-10, -10, 0], chest: [-12, -16, 0], head: [-8, 16, 0], 'thigh.L': [-10, 0, 6], 'shin.L': [10, 0, 0], 'thigh.R': [6, 0, -6], 'shin.R': [8, 0, 0], 'upperarm.L': [-60, 0, 70], 'forearm.L': [-20, 0, 0], 'hand.L': [0, 0, 20] }), [0, 0.03, 0.06], 'out'),
      body(0.5, R(), HIPS, 'inOut'),
    ],
  ),
};

// 4: the pirouette — a full turn on the spot, then the blade comes round flat and level as he faces them again
const s4: ClipDef = {
  name: 'ym_s4', dur: 0.62, fadeIn: 0.05, fadeOut: 0.2,
  events: { step: 0.06 },
  keys: mergeKeys(
    swingKeys({ a: [-1, -0.05, 0], b: [0, 0, 1], c: [0, 0, 0.1], r: 0.4, pole: [-0.5, -0.65, -0.55], keys: [[0, -20, 'out'], [0.18, -50, 'out'], [0.32, 172, 'out'], [0.62, 140, 'inOut']] }),
    [ch(0.62, SG, 'inOut')],
    [
      body(0, R(), HIPS),
      body(0.09, R({ hips: [0, -180, 0], spine: [2, -6, 0], chest: [0, -10, 0], 'thigh.L': [-20, 0, 10], 'shin.L': [20, 0, 0], 'upperarm.L': [0, 0, 80], 'forearm.L': [-10, 0, 0] }), [0, -0.02, 0], 'linear'),
      body(0.18, R({ hips: [0, -390, 0], spine: [2, -10, 0], chest: [0, -16, 0], head: [-2, 20, 0], 'thigh.R': [16, 0, -8], 'shin.R': [24, 0, 0], 'upperarm.L': [0, 0, 70] }), [0, -0.05, -0.02], 'out'),
      body(0.32, R({ hips: [4, -334, 0], spine: [8, 10, 0], chest: [6, 16, 0], head: [-4, -14, 0], 'thigh.L': [-36, 0, 6], 'shin.L': [32, 0, 0], 'thigh.R': [22, 0, -6], 'shin.R': [22, 0, 0], 'upperarm.L': [10, 0, 60] }), [0, -0.08, 0.08], 'out'),
      body(0.62, R({ hips: [0, -370, 0] }), HIPS, 'inOut'),
    ],
  ),
};

// Beautiful Swordfight: eight quick clashing cuts, alternating
const flurryKeys: [number, number, 'out' | 'inOut'][] = [];
for (let i = 0; i <= 8; i++) flurryKeys.push([0.08 + i * 0.1, i % 2 === 0 ? 20 : 170, 'out']);
const flurry: ClipDef = {
  name: 'ym_flurry', dur: 1.05, fadeIn: 0.05, fadeOut: 0.2,
  keys: mergeKeys(
    swingKeys({ a: [-0.6, 0.8, 0], b: [0, 0, 1], c: [-0.04, 0.06, 0.14], r: 0.34, pole: [-0.7, -0.4, -0.5], keys: [[0, 60, 'out'], ...flurryKeys, [1.05, 140, 'inOut']] }),
    [ch(1.05, SG, 'inOut')],
    [
      body(0, R(), HIPS),
      body(0.08, R({ hips: [4, 8, 0], spine: [8, 4, 0], chest: [4, 6, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [30, 0, 0], 'thigh.R': [18, 0, -6], 'shin.R': [22, 0, 0], 'upperarm.L': [20, 0, 50], 'forearm.L': [-20, 0, 0] }), [0, -0.08, 0.06], 'out'),
      body(0.5, R({ hips: [4, -8, 0], spine: [8, -4, 0], chest: [4, -6, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [30, 0, 0], 'thigh.R': [18, 0, -6], 'shin.R': [22, 0, 0], 'upperarm.L': [20, 0, 50], 'forearm.L': [-20, 0, 0] }), [0, -0.08, 0.06], 'inOut'),
      body(0.9, R({ hips: [4, 8, 0], spine: [8, 4, 0], chest: [4, 6, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [30, 0, 0], 'thigh.R': [18, 0, -6], 'shin.R': [22, 0, 0], 'upperarm.L': [20, 0, 50], 'forearm.L': [-20, 0, 0] }), [0, -0.08, 0.06], 'inOut'),
      body(1.05, R(), HIPS, 'inOut'),
    ],
  ),
};

// ================================================================== Kidō and the rest

const PALM: B = { 'upperarm.L': [-84, 0, -4], 'forearm.L': [-4, 0, 0], 'hand.L': [-70, 0, 0] };
/** the left palm out at the target (Shakkahō, Hainawa) */
const palm: ClipDef = {
  name: 'ym_palm', dur: 0.5, fadeIn: 0.05, fadeOut: 0.18,
  events: { cast: 0.14 },
  keys: mergeKeys(
    [ch(0, SG)],
    [
      body(0, R(), HIPS),
      body(0.14, R({ hips: [2, 12, 0], chest: [4, 12, 0], head: [-2, -12, 0], ...PALM, 'thigh.L': [-24, 0, 4], 'shin.L': [22, 0, 0] }), [0, -0.04, 0.05], 'outExpo'),
      body(0.34, R({ hips: [2, 12, 0], chest: [4, 12, 0], head: [-2, -12, 0], ...PALM, 'thigh.L': [-24, 0, 4], 'shin.L': [22, 0, 0] }), [0, -0.04, 0.05]),
      body(0.5, R(), HIPS, 'inOut'),
    ],
  ),
};

/** Daichi Ten'yō: the palm raised (the rubble rises with it), then swept forward (it flies) */
const lift: ClipDef = {
  name: 'ym_lift', dur: 0.9, fadeIn: 0.06, fadeOut: 0.2,
  events: { lift: 0.18, hurl: 0.52 },
  keys: mergeKeys(
    [ch(0, SG)],
    [
      body(0, R(), HIPS),
      body(0.18, R({ chest: [-4, 6, 0], head: [-8, -6, 0], 'upperarm.L': [-60, 0, 40], 'forearm.L': [-70, 0, 0], 'hand.L': [60, 0, 0] }), HIPS, 'out'),
      body(0.44, R({ chest: [-8, 6, 0], head: [-12, -6, 0], 'upperarm.L': [-150, 0, 20], 'forearm.L': [-10, 0, 0], 'hand.L': [40, 0, 0] }), [0, 0.02, 0], 'inOut'),
      body(0.56, R({ hips: [4, 14, 0], chest: [6, 14, 0], head: [-2, -12, 0], ...PALM, 'thigh.L': [-28, 0, 4], 'shin.L': [26, 0, 0] }), [0, -0.05, 0.06], 'outExpo'),
      body(0.9, R(), HIPS, 'inOut'),
    ],
  ),
};

/** the hair fix: the left hand brushing the bob back off his face, the chin raised */
const hair: ClipDef = {
  name: 'ym_hair', dur: 0.9, fadeIn: 0.08, fadeOut: 0.25,
  events: { fix: 0.4 },
  keys: mergeKeys(
    [ch(0, SG)],
    [
      body(0, { ...IDLE }, HIPS),
      body(0.3, { ...IDLE, head: [-12, -20, 10], neck: [-4, -6, 0], 'upperarm.L': [-110, 20, 40], 'forearm.L': [-110, 0, 0], 'hand.L': [-20, 0, 30] }, HIPS, 'inOut'),
      body(0.6, { ...IDLE, head: [-14, -6, 12], neck: [-4, 0, 0], 'upperarm.L': [-120, 40, 50], 'forearm.L': [-90, 0, 0], 'hand.L': [-10, 0, 40] }, HIPS, 'inOut'),
      body(0.9, { ...IDLE }, HIPS, 'inOut'),
    ],
  ),
};

/** "Sake, Fuji Kujaku": the blade held flat before him, the left palm drawn along it from guard to point */
const release: ClipDef = {
  name: 'ym_release', dur: 0.9, fadeIn: 0.06, fadeOut: 0.22,
  events: { name: 0.2, bloom: 0.5 },
  keys: mergeKeys(
    [
      ch(0, SG),
      ch(0.16, grip([-0.24, 0.04, 0.3], [0.97, 0.05, 0.2], [-0.6, -0.4, -0.6], [0, -1, 0]), 'inOut'),
      ch(0.6, grip([-0.24, 0.04, 0.3], [0.97, 0.05, 0.2], [-0.6, -0.4, -0.6], [0, -1, 0])),
      ch(0.9, FG, 'inOut'),
    ],
    [
      body(0, R(), HIPS),
      body(0.16, R({ chest: [4, 0, 0], head: [8, 0, 0], 'upperarm.L': [-60, 0, -20], 'forearm.L': [-60, 0, 0], 'hand.L': [-10, 0, -30] }), HIPS, 'inOut'),
      body(0.44, R({ chest: [4, 0, 0], head: [8, 0, 0], 'upperarm.L': [-70, 0, 10], 'forearm.L': [-30, 0, 0], 'hand.L': [-10, 0, -30] }), HIPS, 'inOut'),
      body(0.6, R({ chest: [4, 0, 0], head: [6, 0, 0], 'upperarm.L': [-40, 0, 40], 'forearm.L': [-30, 0, 0], 'hand.L': [0, 0, 0] }), HIPS, 'out'),
      body(0.9, { ...IDLE }, HIPS, 'inOut'),
    ],
  ),
};

// ================================================================== Fuji Kujaku

/** a hooking sweep with the fan (the four blades lead with their inside edges) */
function fanSweep(name: string, a: C3, b: C3, keys: [number, number, 'out' | 'inOut'][], twist: number): ClipDef {
  return {
    name, dur: keys[keys.length - 1][0], fadeIn: 0.05, fadeOut: 0.18,
    events: { step: 0.06, combo: keys[keys.length - 2][0] + 0.06 },
    keys: mergeKeys(
      swingKeys({ a, b, c: [-0.04, 0.06, 0.12], r: 0.38, pole: [-0.6, -0.5, -0.5], keys }),
      [ch(keys[keys.length - 1][0], FG, 'inOut')],
      [
        body(0, R(), HIPS),
        body(keys[1][0], R({ hips: [0, -twist, 0], spine: [4, -twist * 0.4, 0], chest: [0, -twist * 0.6, 0], head: [-2, twist * 0.6, 0] }), HIPS, 'out'),
        body(keys[2][0], R({ hips: [6, twist, 0], spine: [10, twist * 0.5, 0], chest: [6, twist * 0.7, 0], head: [-4, -twist * 0.6, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [26, 0, 0], 'thigh.R': [18, 0, -8], 'shin.R': [20, 0, 0], 'upperarm.L': [10, 0, 50] }), [0, -0.07, 0.08], 'out'),
        body(keys[keys.length - 1][0], R(), HIPS, 'inOut'),
      ],
    ),
  };
}
const f1 = fanSweep('yf_s1', [-1, 0.1, 0], [0, 0, 1], [[0, -20, 'out'], [0.1, -40, 'out'], [0.22, 170, 'out'], [0.48, 150, 'inOut']], 24);
const f2 = fanSweep('yf_s2', [1, 0.1, 0], [0, 0, 1], [[0, 30, 'out'], [0.1, -20, 'out'], [0.21, 170, 'out'], [0.46, 140, 'inOut']], -24);
const f3 = fanSweep('yf_s3', [0.6, -0.8, 0], [0, 0, 1], [[0, 30, 'out'], [0.1, 10, 'out'], [0.21, 175, 'out'], [0.5, 150, 'inOut']], 16);
const f4 = fanSweep('yf_s4', [0, 1, 0], [0, 0, 1], [[0, 60, 'out'], [0.14, -30, 'out'], [0.27, 150, 'out'], [0.6, 130, 'inOut']], 0);
f3.events = { ...f3.events };
f4.events = { step: 0.1 };

/** the fan spin: two turns on the spot with the fan held out level */
const fanSpin: ClipDef = {
  name: 'yf_spin', dur: 1.0, fadeIn: 0.05, fadeOut: 0.22,
  keys: mergeKeys(
    [ch(0, FG), ch(0.08, grip([-0.5, 0.08, 0.1], [-1, 0.05, 0.05], [-0.4, -0.8, -0.3], [0, 0, 1]), 'out'), ch(0.9, grip([-0.5, 0.08, 0.1], [-1, 0.05, 0.05], [-0.4, -0.8, -0.3], [0, 0, 1])), ch(1.0, FG, 'inOut')],
    [
      body(0, R(), HIPS),
      body(0.08, R({ hips: [0, 30, 0], 'upperarm.L': [0, 0, 80], 'forearm.L': [-10, 0, 0] }), HIPS, 'out'),
      body(0.5, R({ hips: [0, -330, 0], 'upperarm.L': [0, 0, 80], 'forearm.L': [-10, 0, 0] }), [0, -0.05, 0], 'linear'),
      body(0.9, R({ hips: [0, -690, 0], 'upperarm.L': [0, 0, 80], 'forearm.L': [-10, 0, 0] }), HIPS, 'out'),
      body(1.0, R({ hips: [0, -720, 0] }), HIPS, 'inOut'),
    ],
  ),
};

/** the blade catch: the fan held out before him, ready to trap a blade between its sickles (held) */
const fanCatch: ClipDef = {
  name: 'yf_catch', dur: 0.18, fadeIn: 0.05, fadeOut: 0.16,
  keys: mergeKeys(
    [ch(0, FG), ch(0.14, grip([-0.16, 0.12, 0.4], [0.2, 0.95, 0.25], [-0.7, -0.4, -0.4], [0, 0, 1]), 'outExpo')],
    [
      body(0, R(), HIPS),
      body(0.14, R({ hips: [0, -10, 0], chest: [0, -6, 0], head: [-4, 6, 0], 'thigh.L': [-20, 0, 6], 'shin.L': [26, 0, 0], 'thigh.R': [14, 0, -6], 'shin.R': [24, 0, 0] }), [0, -0.06, 0], 'outExpo'),
    ],
  ),
};

/** "Sakikurue, Ruri'iro Kujaku": the fan raised high, then brought down before him as the blades split into vines */
const truth: ClipDef = {
  name: 'yf_truth', dur: 1.0, fadeIn: 0.06, fadeOut: 0.24,
  events: { name: 0.24, split: 0.5 },
  keys: mergeKeys(
    [ch(0, FG), ch(0.24, grip([-0.2, 0.42, 0.12], [0, 1, 0.05], [-0.8, -0.2, -0.4], [0, 0, 1]), 'inOut'), ch(0.44, grip([-0.2, 0.44, 0.12], [0, 1, 0.05], [-0.8, -0.2, -0.4], [0, 0, 1])), ch(0.62, RG, 'out')],
    [
      body(0, R(), HIPS),
      body(0.24, R({ chest: [-8, 4, 0], head: [-10, -4, 0], 'upperarm.L': [-30, 0, 40], 'forearm.L': [-60, 0, 0] }), HIPS, 'inOut'),
      body(0.44, R({ chest: [-10, 4, 0], head: [-12, -4, 0], 'upperarm.L': [-40, 0, 50], 'forearm.L': [-50, 0, 0] }), HIPS),
      body(0.62, R({ hips: [4, 6, 0], chest: [6, 6, 0], head: [0, -4, 0], 'upperarm.L': [10, 0, 60], 'forearm.L': [-20, 0, 0] }), [0, -0.05, 0.05], 'out'),
      body(1.0, R(), HIPS, 'inOut'),
    ],
  ),
};

// ================================================================== Ruri'iro Kujaku

/** the hilt flicked forward: a vine lashes out */
function flick(name: string, side: number): ClipDef {
  return {
    name, dur: 0.4, fadeIn: 0.04, fadeOut: 0.14,
    events: { lash: 0.12, combo: 0.22 },
    keys: mergeKeys(
      [
        ch(0, RG),
        ch(0.07, grip([-0.24 + side * 0.08, 0.14, 0.14], [side * 0.3, 0.8, 0.5], [-0.8, -0.4, -0.3]), 'out'),
        ch(0.14, grip([-0.14 + side * 0.1, -0.02, 0.5], [side * 0.2, -0.2, 1], [-0.8, -0.4, -0.3]), 'outExpo'),
        ch(0.4, RG, 'inOut'),
      ],
      [
        body(0, R(), HIPS),
        body(0.07, R({ hips: [0, -10 * side, 0], chest: [-2, -10 * side, 0] }), HIPS, 'out'),
        body(0.14, R({ hips: [4, 12 * side, 0], chest: [6, 14 * side, 0], head: [-2, -10 * side, 0], 'thigh.L': [-24, 0, 4], 'shin.L': [22, 0, 0] }), [0, -0.04, 0.05], 'outExpo'),
        body(0.4, R(), HIPS, 'inOut'),
      ],
    ),
  };
}
const r1 = flick('yr_s1', 1), r2 = flick('yr_s2', -1), r3 = flick('yr_s3', 1);
const r4: ClipDef = { ...flick('yr_s4', -1), name: 'yr_s4', events: { lash: 0.12 } };

/** the vine burst: the hilt swept wide in an arc, the vines fanning out after it */
const burst: ClipDef = {
  name: 'yr_burst', dur: 0.6, fadeIn: 0.05, fadeOut: 0.18,
  events: { burst: 0.2 },
  keys: mergeKeys(
    swingKeys({ a: [-1, 0.1, 0], b: [0, 0, 1], c: [0, 0.04, 0.1], r: 0.42, pole: [-0.5, -0.6, -0.5], keys: [[0, 40, 'out'], [0.1, 10, 'out'], [0.24, 170, 'out'], [0.6, 150, 'inOut']] }),
    [ch(0.6, RG, 'inOut')],
    [
      body(0, R(), HIPS),
      body(0.1, R({ hips: [0, -26, 0], chest: [0, -16, 0], head: [-2, 16, 0], 'upperarm.L': [-20, 0, 40] }), HIPS, 'out'),
      body(0.24, R({ hips: [4, 24, 0], spine: [6, 10, 0], chest: [4, 20, 0], head: [-4, -16, 0], 'thigh.L': [-28, 0, 6], 'shin.L': [26, 0, 0], 'upperarm.L': [0, 0, 80], 'forearm.L': [-10, 0, 0] }), [0, -0.06, 0.06], 'out'),
      body(0.6, R(), HIPS, 'inOut'),
    ],
  ),
};

/** the ensnare: the hilt thrust out, then drawn back to him as the vines wrap */
const snare: ClipDef = {
  name: 'yr_snare', dur: 0.7, fadeIn: 0.05, fadeOut: 0.2,
  events: { snare: 0.16 },
  keys: mergeKeys(
    [
      ch(0, RG),
      ch(0.16, grip([-0.1, 0.06, 0.56], [-0.05, 0.1, 1], [-0.8, -0.4, -0.3]), 'outExpo'),
      ch(0.42, grip([-0.26, 0.0, 0.14], [-0.2, 0.5, 0.85], [-0.8, -0.4, -0.3]), 'inOut'),
      ch(0.7, RG, 'inOut'),
    ],
    [
      body(0, R(), HIPS),
      body(0.16, R({ hips: [4, 6, 0], spine: [8, 4, 0], chest: [6, 4, 0], head: [-2, -4, 0], 'thigh.L': [-34, 0, 4], 'shin.L': [30, 0, 0], 'thigh.R': [18, 0, -6], 'shin.R': [18, 0, 0] }), [0, -0.06, 0.1], 'outExpo'),
      body(0.42, R({ hips: [-6, -6, 0], spine: [-6, -4, 0], chest: [-8, -6, 0], head: [-6, 6, 0], 'thigh.L': [-6, 0, 4], 'shin.L': [12, 0, 0], 'thigh.R': [-6, 0, -6], 'shin.R': [20, 0, 0] }), [0, -0.02, -0.04], 'inOut'),
      body(0.7, R(), HIPS, 'inOut'),
    ],
  ),
};

/** the bloom: the left hand raised, the fingers spreading like opening petals */
const bloom: ClipDef = {
  name: 'yr_bloom', dur: 0.8, fadeIn: 0.06, fadeOut: 0.22,
  events: { bloom: 0.3 },
  keys: mergeKeys(
    [ch(0, RG)],
    [
      body(0, R(), HIPS),
      body(0.2, R({ chest: [-4, 6, 0], head: [-10, -10, 6], 'upperarm.L': [-110, 0, 30], 'forearm.L': [-50, 0, 0], 'hand.L': [-20, 0, 0] }), HIPS, 'inOut'),
      body(0.34, R({ chest: [-6, 8, 0], head: [-12, -12, 8], 'upperarm.L': [-140, 0, 40], 'forearm.L': [-10, 0, 0], 'hand.L': [20, 0, 0] }), [0, 0.02, 0], 'outExpo'),
      body(0.8, { ...IDLE }, HIPS, 'inOut'),
    ],
  ),
};

/** the petal: plucked from a vine and brought to the lips */
const petal: ClipDef = {
  name: 'yr_petal', dur: 0.8, fadeIn: 0.06, fadeOut: 0.22,
  events: { eat: 0.45 },
  keys: mergeKeys(
    [ch(0, RG)],
    [
      body(0, R(), HIPS),
      body(0.2, R({ 'upperarm.L': [-60, 0, 50], 'forearm.L': [-20, 0, 0], 'hand.L': [0, 0, 0] }), HIPS, 'inOut'),
      body(0.45, R({ head: [6, -6, 0], neck: [4, 0, 0], 'upperarm.L': [-40, -10, 10], 'forearm.L': [-130, 0, 0], 'hand.L': [-20, 0, 0] }), HIPS, 'inOut'),
      body(0.8, R(), HIPS, 'inOut'),
    ],
  ),
};

/** the thicket: the hilt pointed down, the vines pouring over the ground */
const thicket: ClipDef = {
  name: 'yr_thicket', dur: 0.7, fadeIn: 0.05, fadeOut: 0.2,
  events: { spread: 0.24 },
  keys: mergeKeys(
    [ch(0, RG), ch(0.24, grip([-0.16, -0.32, 0.34], [-0.05, -0.95, 0.3], [-0.8, -0.3, -0.4]), 'out'), ch(0.5, grip([-0.16, -0.32, 0.34], [-0.05, -0.95, 0.3], [-0.8, -0.3, -0.4])), ch(0.7, RG, 'inOut')],
    [
      body(0, R(), HIPS),
      body(0.24, R({ hips: [10, 0, 0], spine: [12, 0, 0], chest: [8, 0, 0], head: [6, 0, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [40, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [36, 0, 0] }), [0, -0.12, 0.02], 'out'),
      body(0.7, R(), HIPS, 'inOut'),
    ],
  ),
};

/** the seal: the vines wither back into the hilt and the blade re-forms */
const seal: ClipDef = { ...release, name: 'yr_seal', dur: 0.6, events: { fold: 0.3 }, keys: mergeKeys(release.keys.filter((k) => k.t <= 0.6).map((k) => (k.c && k.t === 0 ? { ...k, c: { ...k.c, ...RG } } : k)), [ch(0.6, SG, 'inOut')]) };

export const YUMICHIKA_CHAIN = ['ym_s1', 'ym_s2', 'ym_s3', 'ym_s4'];
export const FUJI_CHAIN = ['yf_s1', 'yf_s2', 'yf_s3', 'yf_s4'];
export const RURI_CHAIN = ['yr_s1', 'yr_s2', 'yr_s3', 'yr_s4'];

const COMMON = [palm, lift, hair, flurry];
export const YUMICHIKA_CLIPS: ClipDef[] = [...SHARED, s1, s2, s3, s4, ...COMMON, release];
export const FUJI_CLIPS: ClipDef[] = [...SHARED, f1, f2, f3, f4, ...COMMON, fanSpin, fanCatch, truth, release];
export const RURI_CLIPS: ClipDef[] = [...SHARED, r1, r2, r3, r4, ...COMMON, burst, snare, bloom, petal, thicket, seal, truth];
