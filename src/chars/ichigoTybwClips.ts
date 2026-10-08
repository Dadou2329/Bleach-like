// TYBW Ichigo's animation set (docs/kits/ichigo.md §4 TYBW): the twin-blade stance — the large blade low in the
// right hand, the small one forward in the left — the dual string, the hurl, the descent, Chain's beckon, the flick
// Getsuga, Jūjishō, Blut Vene, Half-Hollowfication, the Half-Hollow arm lock, the horn Cero and Cero Creciente, the
// Blood Chains wall and volley, and True Bankai's colossal two-handed swings, guard, release and the shell break.
// Big-blade moves that match the classic Zangetsu clips reuse them (ICHIGO_CLIPS: slash1-5, getsuga, ig_throw,
// ig_catch, ig_thrust, dash, airstep, hit_heavy). Events: 'step' (lunge), 'hit'/'hitL' (right/left blade windows
// open), 'fx' (effect), 'combo' (next input accepted).
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { ICHIGO_CLIPS, ICHIGO_STANCE } from './ichigoClips';

type E3 = [number, number, number];

const SH: E3 = [-0.2, 0.17, 0.02];
const SHL: E3 = [0.2, 0.17, 0.02];

/** the left arm at rest: the small blade held forward and a little up */
const L_IDLE: Record<string, E3> = { 'upperarm.L': [-26, 0, 16], 'forearm.L': [-58, 0, 0], 'hand.L': [48, 0, 0] };
const IDLE_BODY: KeyDef['b'] = {
  hips: [0, -12, 0], spine: [4, 4, 0], chest: [2, 8, 0], neck: [0, 0, 0], head: [3, 2, 0],
  'thigh.L': [-12, 0, 5], 'shin.L': [14, 0, 0], 'foot.L': [-2, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [16, 0, 0], 'foot.R': [-8, 0, 0],
  ...L_IDLE,
};
const GRIP_IDLE: Record<string, E3> = { '@gripR': [-0.29, -0.31, 0.18], '@dirR': [-0.2, -0.55, 0.81], '@edgeR': [0.1, -0.83, -0.55], '@poleR': [-0.55, -0.3, -0.8], '@ikR': [1, 0, 0] };

export const TYBW_STANCE: StanceDef = {
  idle: {
    ...ICHIGO_STANCE.idle,
    ...L_IDLE,
  },
  idleHips: -0.04,
  run: { ...ICHIGO_STANCE.run, 'upperarm.L': [-14, 0, 12], 'forearm.L': [-66, 0, 0], 'hand.L': [40, 0, 0] },
  sprint: { 'upperarm.L': [24, 0, 12], 'forearm.L': [-44, 0, 0], 'hand.L': [24, 0, 0] },
  swingL: 0.25,
  swingR: 0.2,
  grip: {
    idle: { p: [-0.29, -0.31, 0.18], dir: [-0.2, -0.55, 0.81], edge: [0.1, -0.83, -0.55], pole: [-0.55, -0.3, -0.8] },
    walk: { p: [-0.29, -0.3, 0.14], dir: [-0.2, -0.64, 0.74], edge: [0.1, -0.76, -0.64], pole: [-0.55, -0.3, -0.8] },
    run: ICHIGO_STANCE.grip!.run,
    sprint: ICHIGO_STANCE.grip!.sprint,
    air: ICHIGO_STANCE.grip!.air,
  },
};

/** True Bankai: the colossal cleaver held low in both hands, the point trailing behind */
export const TRUE_BANKAI_STANCE: StanceDef = {
  idle: {
    hips: [0, -16, 0], spine: [6, 4, 0], chest: [4, 10, 0], head: [2, 4, 0],
    'thigh.L': [-16, 0, 6], 'shin.L': [18, 0, 0], 'foot.L': [-2, 0, 0], 'thigh.R': [12, 0, -8], 'shin.R': [20, 0, 0], 'foot.R': [-8, 0, 0],
  },
  idleHips: -0.05,
  run: { chest: [0, 8, 0] },
  swingL: 0.2,
  swingR: 0.1,
  grip: {
    idle: { p: [-0.22, -0.34, 0.12], dir: [-0.35, -0.45, 0.82], edge: [0.15, -0.88, -0.45], pole: [-0.55, -0.3, -0.8] },
    walk: { p: [-0.22, -0.33, 0.1], dir: [-0.35, -0.5, 0.79], edge: [0.15, -0.85, -0.5], pole: [-0.55, -0.3, -0.8] },
    run: { p: [-0.3, -0.24, -0.08], dir: [-0.22, -0.25, -0.94], edge: [0, -0.96, 0.27], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.29, -0.16, -0.16], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.36, -0.06, 0.1], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

/** Body key helper. */
function body(t: number, b: KeyDef['b'], hips?: KeyDef['hips'], ease?: KeyDef['ease']): KeyDef {
  return { t, b, hips, ease };
}

/** Left-hand IK key (the small blade): grip, blade direction, edge facing, elbow pole, weight. */
function ikL(t: number, p: E3, dir: E3, edge: E3, pole: E3, w = 1, ease?: KeyDef['ease']): KeyDef {
  return { t, ease, c: { '@gripL': p, '@dirL': dir, '@edgeL': edge, '@poleL': pole, '@ikL': [w, 0, 0] } };
}

/** Right-hand IK key (the large blade / the cleaver). */
function ikR(t: number, p: E3, dir: E3, edge: E3, pole: E3, w = 1, ease?: KeyDef['ease']): KeyDef {
  return { t, ease, c: { '@gripR': p, '@dirR': dir, '@edgeR': edge, '@poleR': pole, '@ikR': [w, 0, 0] } };
}

// ------------------------------------------------------------------ the twin-blade string

// 1: the large blade's forehand, right → left; the small blade drawn back for balance
const s1: ClipDef = {
  name: 'ty_s1',
  dur: 0.62,
  fadeIn: 0.06,
  fadeOut: 0.22,
  events: { step: 0.08, hit: 0.15, combo: 0.26 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [1, -0.12, 0], c: SH, r: 0.38, pole: [-0.5, -0.65, -0.55],
      keys: [[0, -70, 'out'], [0.1, -128, 'out'], [0.17, 25, 'outExpo'], [0.3, 105, 'out'], [0.62, 70, 'inOut']],
    }),
    [
      body(0, IDLE_BODY),
      body(0.1, { hips: [0, -24, 0], spine: [2, -18, 0], chest: [-4, -26, 4], 'thigh.L': [-14, 0, 6], 'thigh.R': [12, 0, -6], 'shin.R': [20, 0, 0], head: [0, 20, 0], 'upperarm.L': [-40, 0, 30], 'forearm.L': [-70, 0, 0], 'hand.L': [40, 0, 0] }, [0, -0.05, -0.02], 'out'),
      body(0.17, { hips: [0, 14, 0], spine: [8, 16, 0], chest: [6, 26, -4], 'thigh.L': [-30, 0, 6], 'shin.L': [26, 0, 0], 'thigh.R': [24, 0, -4], 'shin.R': [26, 0, 0], head: [0, -18, 0], 'upperarm.L': [20, 0, 46], 'forearm.L': [-50, 0, 0], 'hand.L': [30, 0, 0] }, [0, -0.08, 0.06], 'outExpo'),
      body(0.3, { hips: [0, 22, 0], spine: [10, 20, 0], chest: [8, 30, -4], 'thigh.L': [-28, 0, 6], 'thigh.R': [22, 0, -4], head: [0, -24, 0], 'upperarm.L': [24, 0, 50], 'forearm.L': [-52, 0, 0] }, [0, -0.09, 0.08], 'out'),
      body(0.62, IDLE_BODY, [0, -0.04, 0], 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.3, 0, 0] } }],
  ),
};

// 2: the small blade's stab, the left shoulder driven forward (aimed left in chest space: the chest turns right)
const s2: ClipDef = {
  name: 'ty_s2',
  dur: 0.48,
  fadeIn: 0.04,
  fadeOut: 0.18,
  events: { step: 0.03, hitL: 0.08, combo: 0.2 },
  keys: mergeKeys(
    [
      ikL(0, [0.24, -0.12, 0.2], [0.05, 0.3, 0.95], [0, -0.95, 0.3], [0.7, -0.5, -0.4], 0),
      ikL(0.05, [0.28, -0.08, 0.04], [0.2, 0.15, 0.97], [0, -0.99, 0.15], [0.75, -0.45, -0.4], 1, 'out'),
      ikL(0.11, [0.17, 0.04, 0.6], [0.26, 0.02, 0.97], [0, -1, 0.02], [0.75, -0.55, -0.3], 1, 'outExpo'),
      ikL(0.24, [0.17, 0.03, 0.58], [0.26, 0, 0.97], [0, -1, 0], [0.75, -0.55, -0.3], 1, 'out'),
      ikL(0.48, [0.22, -0.16, 0.3], [0.02, 0.4, 0.92], [0, -0.92, 0.4], [0.7, -0.5, -0.4], 0, 'inOut'),
    ],
    [
      body(0, IDLE_BODY),
      body(0.05, { hips: [0, 10, 0], spine: [2, 8, 0], chest: [0, 12, 0], head: [0, -10, 0], 'thigh.L': [-10, 0, 6], 'thigh.R': [14, 0, -6] }, [0, -0.04, -0.03], 'out'),
      body(0.11, { hips: [6, -12, 0], spine: [10, -8, 0], chest: [8, -14, 0], head: [-8, 14, 0], 'thigh.L': [-44, 0, 6], 'shin.L': [40, 0, 0], 'thigh.R': [28, 0, -6], 'shin.R': [20, 0, 0] }, [0, -0.1, 0.12], 'outExpo'),
      body(0.24, { hips: [6, -14, 0], spine: [10, -10, 0], chest: [8, -16, 0], head: [-8, 16, 0], 'thigh.L': [-42, 0, 6], 'shin.L': [38, 0, 0], 'thigh.R': [26, 0, -6] }, [0, -0.1, 0.12], 'out'),
      body(0.48, IDLE_BODY, [0, -0.04, 0], 'inOut'),
    ],
  ),
};

// 3: the large blade's rising backhand, lower-left → upper-right
const s3: ClipDef = {
  name: 'ty_s3',
  dur: 0.6,
  fadeIn: 0.05,
  fadeOut: 0.22,
  events: { step: 0.06, hit: 0.15, combo: 0.26 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [-0.85, 0.52, 0], c: [-0.08, 0.1, 0.06], r: 0.38, pole: [-0.3, -0.4, -0.85],
      keys: [[0, -150, 'out'], [0.09, -120, 'out'], [0.16, 45, 'outExpo'], [0.3, 115, 'out'], [0.6, 70, 'inOut']],
    }),
    [
      body(0, { hips: [0, 18, 0], spine: [8, 16, 0], chest: [6, 24, -4], ...L_IDLE }),
      body(0.09, { hips: [0, 26, 0], spine: [10, 22, 6], chest: [10, 30, 8], 'thigh.L': [-20, 0, 8], 'shin.L': [30, 0, 0], 'thigh.R': [18, 0, -4], head: [4, -22, 0] }, [0, -0.1, 0], 'out'),
      body(0.16, { hips: [0, -18, 0], spine: [-2, -20, -4], chest: [-10, -28, -10], 'thigh.L': [-8, 0, 6], 'thigh.R': [-6, 0, -10], 'shin.R': [12, 0, 0], head: [-6, 22, 0], 'upperarm.L': [10, 0, 40], 'forearm.L': [-50, 0, 0], 'hand.L': [30, 0, 0] }, [0, -0.02, 0.05], 'outExpo'),
      body(0.3, { hips: [0, -22, 0], spine: [-4, -22, -4], chest: [-12, -30, -10], head: [-8, 24, 0], 'upperarm.L': [14, 0, 44] }, [0, -0.01, 0.06], 'out'),
      body(0.6, IDLE_BODY, [0, -0.04, 0], 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.3, 0, 0] } }],
  ),
};

// 4: the small blade's rising cut on the left side
const s4: ClipDef = {
  name: 'ty_s4',
  dur: 0.55,
  fadeIn: 0.05,
  fadeOut: 0.2,
  events: { step: 0.06, hitL: 0.13, combo: 0.26 },
  keys: mergeKeys(
    swingKeys({
      hand: 'L', a: [-0.22, 0, 0.98], b: [0.3, -1, 0], c: [0.12, 0.08, 0.08], r: 0.42, sense: -1, pole: [0.55, -0.6, -0.55],
      keys: [[0, 50, 'out'], [0.09, 80, 'out'], [0.17, -60, 'outExpo'], [0.3, -100, 'out'], [0.55, -40, 'inOut']],
    }),
    [
      { t: 0, c: { '@ikL': [0, 0, 0] } },
      { t: 0.07, ease: 'out', c: { '@ikL': [1, 0, 0] } },
      { t: 0.36, c: { '@ikL': [1, 0, 0] } },
      { t: 0.55, ease: 'inOut', c: { '@ikL': [0, 0, 0] } },
    ],
    [
      body(0, IDLE_BODY),
      body(0.09, { hips: [4, -16, 0], spine: [8, -10, 0], chest: [10, -16, 6], head: [-4, 14, 0], 'thigh.L': [-30, 0, 8], 'shin.L': [40, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [30, 0, 0] }, [0, -0.12, 0], 'out'),
      body(0.17, { hips: [-4, 10, 0], spine: [-6, 8, 0], chest: [-12, 12, -6], head: [-6, -8, 0], 'thigh.L': [-24, 0, 8], 'shin.L': [20, 0, 0], 'thigh.R': [14, 0, -6], 'shin.R': [14, 0, 0] }, [0, -0.02, 0.08], 'outExpo'),
      body(0.3, { hips: [-4, 12, 0], spine: [-8, 10, 0], chest: [-14, 14, -6], head: [-6, -10, 0] }, [0, -0.01, 0.09], 'out'),
      body(0.55, IDLE_BODY, [0, -0.04, 0], 'inOut'),
    ],
  ),
};

// 5: the twin X — both blades cut down across each other at once
const s5: ClipDef = {
  name: 'ty_s5',
  dur: 0.66,
  fadeIn: 0.06,
  fadeOut: 0.22,
  events: { step: 0.1, hit: 0.2, hitL: 0.2, combo: 0.36 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0.78, -0.62, 0], c: [-0.1, 0.2, 0.08], r: 0.4, pole: [-0.75, -0.1, -0.65],
      keys: [[0, -40, 'out'], [0.13, -125, 'out'], [0.2, 40, 'outExpo'], [0.34, 70, 'out'], [0.66, 40, 'inOut']],
    }),
    swingKeys({
      hand: 'L', a: [0, 0, 1], b: [-0.78, -0.62, 0], c: [0.1, 0.2, 0.08], r: 0.36, pole: [0.75, -0.1, -0.65],
      keys: [[0, -40, 'out'], [0.13, -125, 'out'], [0.2, 40, 'outExpo'], [0.34, 70, 'out'], [0.66, 40, 'inOut']],
    }),
    [
      { t: 0, c: { '@ikL': [0, 0, 0] } },
      { t: 0.1, ease: 'out', c: { '@ikL': [1, 0, 0] } },
      { t: 0.42, c: { '@ikL': [1, 0, 0] } },
      { t: 0.66, ease: 'inOut', c: { '@ikL': [0, 0, 0] } },
    ],
    [
      body(0, IDLE_BODY),
      body(0.13, { hips: [-6, 0, 0], spine: [-10, 0, 0], chest: [-14, 0, 0], neck: [-6, 0, 0], head: [-8, 0, 0], 'thigh.L': [-10, 0, 6], 'thigh.R': [8, 0, -6] }, [0, 0.04, -0.03], 'out'),
      body(0.2, { hips: [10, 0, 0], spine: [18, 0, 0], chest: [16, 0, 0], head: [-14, 0, 0], 'thigh.L': [-44, 0, 6], 'shin.L': [48, 0, 0], 'thigh.R': [26, 0, -6], 'shin.R': [30, 0, 0] }, [0, -0.12, 0.1], 'outExpo'),
      body(0.34, { hips: [12, 0, 0], spine: [20, 0, 0], chest: [18, 0, 0], head: [-14, 0, 0], 'thigh.L': [-46, 0, 6], 'shin.L': [50, 0, 0], 'thigh.R': [28, 0, -6], 'shin.R': [32, 0, 0] }, [0, -0.13, 0.11], 'out'),
      body(0.66, IDLE_BODY, [0, -0.04, 0], 'inOut'),
    ],
  ),
};

// 6: the large blade's overhead chop, the small one flung back; it cracks the ground
const s6: ClipDef = {
  name: 'ty_s6',
  dur: 0.82,
  fadeIn: 0.07,
  fadeOut: 0.25,
  events: { step: 0.2, hit: 0.27, fx: 0.27, combo: 0.42 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0, -1, 0], c: [-0.06, 0.22, 0.12], r: 0.42, pole: [-0.7, -0.2, -0.65],
      keys: [[0, 20, 'out'], [0.16, -146, 'out'], [0.22, -140, 'linear'], [0.27, 4, 'outExpo'], [0.42, 16, 'out'], [0.82, 40, 'inOut']],
    }),
    [
      body(0, IDLE_BODY),
      body(0.16, { hips: [0, -4, 0], spine: [-10, 0, 0], chest: [-14, 4, 0], neck: [-6, 0, 0], head: [-10, 0, 0], 'thigh.L': [-6, 0, 4], 'thigh.R': [6, 0, -4], 'shin.L': [8, 0, 0], 'upperarm.L': [-60, 0, 40], 'forearm.L': [-60, 0, 0], 'hand.L': [20, 0, 0] }, [0, 0.03, -0.03], 'out'),
      body(0.22, { spine: [-12, 0, 0], chest: [-16, 4, 0], head: [-12, 0, 0] }, [0, 0.04, -0.03], 'linear'),
      body(0.27, { hips: [8, 0, 0], spine: [22, 0, 0], chest: [18, 2, 0], neck: [6, 0, 0], head: [-14, 0, 0], 'thigh.L': [-46, 0, 6], 'shin.L': [50, 0, 0], 'foot.L': [-4, 0, 0], 'thigh.R': [26, 0, -4], 'shin.R': [30, 0, 0], 'foot.R': [-10, 0, 0], 'upperarm.L': [30, 0, 50], 'forearm.L': [-40, 0, 0], 'hand.L': [20, 0, 0] }, [0, -0.12, 0.1], 'outExpo'),
      body(0.42, { hips: [10, 0, 0], spine: [24, 0, 0], chest: [20, 2, 0], head: [-14, 0, 0], 'thigh.L': [-48, 0, 6], 'shin.L': [52, 0, 0], 'thigh.R': [28, 0, -4], 'shin.R': [32, 0, 0], 'upperarm.L': [34, 0, 52] }, [0, -0.13, 0.11], 'out'),
      body(0.82, IDLE_BODY, [0, -0.04, 0], 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.2, 0, 0] } }],
  ),
};

// the hurl: the left hand seizes the foe (blade and all) and heaves it away over the right shoulder
const hurl: ClipDef = {
  name: 'ty_hurl',
  dur: 0.78,
  fadeIn: 0.05,
  fadeOut: 0.22,
  events: { grab: 0.12, throw: 0.4 },
  keys: mergeKeys(
    [
      ikL(0, [0.24, -0.12, 0.2], [0.05, 0.3, 0.95], [0, -0.95, 0.3], [0.7, -0.5, -0.4], 0),
      ikL(0.12, [0.1, 0.06, 0.58], [0.1, 0.6, 0.79], [0, -0.79, 0.6], [0.7, -0.5, -0.3], 1, 'outExpo'),
      ikL(0.28, [0.16, 0.0, 0.3], [0.2, 0.7, 0.68], [0, -0.68, 0.7], [0.75, -0.5, -0.3], 1, 'inOut'),
      ikL(0.4, [-0.02, 0.36, 0.42], [0, 0.9, 0.42], [0, -0.42, 0.9], [0.6, -0.4, -0.6], 1, 'outExpo'),
      ikL(0.56, [-0.04, 0.32, 0.46], [0, 0.85, 0.5], [0, -0.5, 0.85], [0.6, -0.4, -0.6], 1, 'out'),
      ikL(0.78, [0.22, -0.16, 0.3], [0.02, 0.4, 0.92], [0, -0.92, 0.4], [0.7, -0.5, -0.4], 0, 'inOut'),
    ],
    [
      body(0, IDLE_BODY),
      body(0.12, { hips: [6, -18, 0], spine: [8, -14, 0], chest: [6, -20, 0], head: [-6, 20, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [36, 0, 0], 'thigh.R': [20, 0, -6], 'shin.R': [24, 0, 0] }, [0, -0.08, 0.1], 'outExpo'),
      body(0.28, { hips: [-4, -26, 0], spine: [-6, -20, 0], chest: [-10, -26, 0], head: [-2, 24, 0], 'thigh.L': [-20, 0, 6], 'thigh.R': [18, 0, -6], 'shin.R': [28, 0, 0] }, [0, -0.08, -0.02], 'inOut'),
      body(0.4, { hips: [8, 20, 0], spine: [12, 18, 0], chest: [14, 26, 0], head: [-10, -20, 0], 'thigh.L': [-46, 0, 6], 'shin.L': [44, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [24, 0, 0] }, [0, -0.1, 0.12], 'outExpo'),
      body(0.56, { hips: [8, 22, 0], spine: [12, 20, 0], chest: [14, 28, 0], head: [-10, -22, 0] }, [0, -0.1, 0.12], 'out'),
      body(0.78, IDLE_BODY, [0, -0.04, 0], 'inOut'),
    ],
  ),
};

// the descent: dropping out of the sky, both blades turned point-down (held); the landing drives them in
const descent: ClipDef = {
  name: 'ty_descent',
  dur: 0.3,
  fadeIn: 0.08,
  fadeOut: 0.1,
  keys: mergeKeys(
    [
      ikR(0, [-0.24, -0.06, 0.26], [-0.1, -0.95, 0.3], [0, -0.3, -0.95], [-0.7, 0.2, -0.6]),
      ikR(0.3, [-0.24, -0.08, 0.27], [-0.1, -0.96, 0.28], [0, -0.28, -0.96], [-0.7, 0.2, -0.6]),
      ikL(0, [0.24, -0.06, 0.26], [0.1, -0.95, 0.3], [0, -0.3, -0.95], [0.7, 0.2, -0.6]),
      ikL(0.3, [0.24, -0.08, 0.27], [0.1, -0.96, 0.28], [0, -0.28, -0.96], [0.7, 0.2, -0.6]),
    ],
    [
      body(0, { hips: [10, 0, 0], spine: [16, 0, 0], chest: [10, 0, 0], head: [10, 0, 0], 'thigh.L': [-70, 0, 8], 'shin.L': [100, 0, 0], 'foot.L': [20, 0, 0], 'thigh.R': [-50, 0, -8], 'shin.R': [90, 0, 0], 'foot.R': [20, 0, 0] }, [0, 0.05, 0]),
      body(0.3, { hips: [12, 0, 0], spine: [18, 0, 0], chest: [10, 0, 0], head: [12, 0, 0], 'thigh.L': [-72, 0, 8], 'shin.L': [102, 0, 0], 'thigh.R': [-52, 0, -8], 'shin.R': [92, 0, 0] }, [0, 0.05, 0]),
    ],
  ),
};

const land: ClipDef = {
  name: 'ty_land',
  dur: 0.7,
  fadeIn: 0.02,
  fadeOut: 0.25,
  events: { fx: 0.02 },
  keys: mergeKeys(
    [
      ikR(0, [-0.24, -0.3, 0.32], [-0.05, -0.95, 0.3], [0, -0.3, -0.95], [-0.7, 0.2, -0.6]),
      ikR(0.4, [-0.24, -0.32, 0.32], [-0.05, -0.95, 0.3], [0, -0.3, -0.95], [-0.7, 0.2, -0.6]),
      { t: 0.7, ease: 'inOut', c: GRIP_IDLE },
      ikL(0, [0.24, -0.3, 0.32], [0.05, -0.95, 0.3], [0, -0.3, -0.95], [0.7, 0.2, -0.6]),
      ikL(0.4, [0.24, -0.32, 0.32], [0.05, -0.95, 0.3], [0, -0.3, -0.95], [0.7, 0.2, -0.6]),
      ikL(0.7, [0.22, -0.16, 0.3], [0.02, 0.4, 0.92], [0, -0.92, 0.4], [0.7, -0.5, -0.4], 0, 'inOut'),
    ],
    [
      body(0, { hips: [16, 0, 0], spine: [24, 0, 0], chest: [16, 0, 0], head: [-10, 0, 0], 'thigh.L': [-80, 0, 12], 'shin.L': [110, 0, 0], 'foot.L': [-20, 0, 0], 'thigh.R': [-20, 0, -12], 'shin.R': [120, 0, 0], 'foot.R': [-30, 0, 0] }, [0, -0.42, 0.05], 'outExpo'),
      body(0.4, { hips: [14, 0, 0], spine: [22, 0, 0], chest: [14, 0, 0], head: [-12, 0, 0], 'thigh.L': [-76, 0, 12], 'shin.L': [106, 0, 0], 'thigh.R': [-18, 0, -12], 'shin.R': [116, 0, 0] }, [0, -0.4, 0.05], 'out'),
      body(0.7, IDLE_BODY, [0, -0.04, 0], 'inOut'),
    ],
  ),
};

// Chain: the right hand, empty, held out palm up — a beckoning curl of the fingers, and the blade flies home
const beckon: ClipDef = {
  name: 'ty_beckon',
  dur: 0.6,
  fadeIn: 0.05,
  fadeOut: 0.2,
  events: { call: 0.16, catch: 0.42 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@ikR': [0, 0, 0] } },
      { t: 0.6, c: { '@ikR': [0, 0, 0] } },
    ],
    [
      body(0, { ...IDLE_BODY, 'upperarm.R': [-20, 0, -10], 'forearm.R': [-30, 0, 0] }),
      body(0.12, { hips: [0, 10, 0], spine: [2, 8, 0], chest: [0, 12, 0], 'upperarm.R': [-74, -20, -6], 'forearm.R': [-20, 60, 0], 'hand.R': [-20, 0, 0] }, [0, -0.04, 0], 'out'),
      body(0.22, { 'upperarm.R': [-70, -20, -6], 'forearm.R': [-40, 60, 0], 'hand.R': [30, 0, 0] }, [0, -0.04, 0], 'outExpo'),
      body(0.42, { hips: [0, -10, 0], spine: [-2, -6, 0], chest: [-4, -10, 0], 'upperarm.R': [-50, -10, -10], 'forearm.R': [-60, 30, 0], 'hand.R': [10, 0, 0] }, [0, -0.05, -0.02], 'out'),
      body(0.6, { ...IDLE_BODY, 'upperarm.R': [-20, 0, -10], 'forearm.R': [-30, 0, 0], 'hand.R': [0, 0, 0] }, [0, -0.04, 0], 'inOut'),
    ],
  ),
};

// the small blade's Getsuga: point at the foe and flick the wrist
const flick: ClipDef = {
  name: 'ty_flick',
  dur: 0.42,
  fadeIn: 0.04,
  fadeOut: 0.16,
  events: { fx: 0.13 },
  keys: mergeKeys(
    [
      ikL(0, [0.24, -0.12, 0.2], [0.05, 0.3, 0.95], [0, -0.95, 0.3], [0.7, -0.5, -0.4], 0),
      ikL(0.07, [0.14, 0.12, 0.5], [0, 0.45, 0.89], [0, -0.89, 0.45], [0.75, -0.5, -0.3], 1, 'out'),
      ikL(0.13, [0.12, 0.06, 0.56], [-0.25, -0.25, 0.94], [0.1, -0.96, -0.25], [0.75, -0.5, -0.3], 1, 'outExpo'),
      ikL(0.26, [0.13, 0.05, 0.54], [-0.22, -0.2, 0.95], [0.1, -0.97, -0.2], [0.75, -0.5, -0.3], 1, 'out'),
      ikL(0.42, [0.22, -0.16, 0.3], [0.02, 0.4, 0.92], [0, -0.92, 0.4], [0.7, -0.5, -0.4], 0, 'inOut'),
    ],
    [
      body(0, IDLE_BODY),
      body(0.07, { hips: [0, -14, 0], spine: [2, -10, 0], chest: [0, -16, 0], head: [-4, 14, 0] }, [0, -0.05, 0.02], 'out'),
      body(0.13, { hips: [2, -18, 0], spine: [4, -12, 0], chest: [4, -20, 0], head: [-6, 18, 0] }, [0, -0.06, 0.04], 'outExpo'),
      body(0.42, IDLE_BODY, [0, -0.04, 0], 'inOut'),
    ],
  ),
};

// Getsuga Jūjishō: the small blade's level cut (its crescent), then the large blade's vertical chop (the other bar)
const juji: ClipDef = {
  name: 'ty_juji',
  dur: 1.0,
  fadeIn: 0.06,
  fadeOut: 0.26,
  events: { step: 0.04, fx1: 0.2, fx2: 0.52 },
  keys: mergeKeys(
    swingKeys({
      hand: 'L', a: [0, 0, 1], b: [1, -0.08, 0], c: SHL, r: 0.4, sense: -1, pole: [0.5, -0.65, -0.55],
      keys: [[0, 60, 'out'], [0.12, 105, 'out'], [0.2, -25, 'outExpo'], [0.34, -55, 'out'], [0.62, -40, 'inOut'], [1.0, 20, 'inOut']],
    }),
    [
      { t: 0, c: { '@ikL': [0, 0, 0] } },
      { t: 0.1, ease: 'out', c: { '@ikL': [1, 0, 0] } },
      { t: 0.7, c: { '@ikL': [1, 0, 0] } },
      { t: 1.0, ease: 'inOut', c: { '@ikL': [0, 0, 0] } },
    ],
    swingKeys({
      a: [0, 0, 1], b: [0, -1, 0], c: [-0.06, 0.22, 0.12], r: 0.42, pole: [-0.7, -0.2, -0.65],
      keys: [[0, 20, 'out'], [0.22, 30, 'out'], [0.4, -146, 'out'], [0.46, -140, 'linear'], [0.52, 4, 'outExpo'], [0.68, 16, 'out'], [1.0, 40, 'inOut']],
    }),
    [
      body(0, IDLE_BODY),
      body(0.12, { hips: [0, 18, 0], spine: [4, 14, 0], chest: [2, 22, 0], head: [0, -16, 0], 'thigh.L': [-16, 0, 6], 'thigh.R': [14, 0, -6] }, [0, -0.06, 0], 'out'),
      body(0.2, { hips: [0, -20, 0], spine: [6, -16, 0], chest: [4, -24, 0], head: [-4, 20, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [30, 0, 0], 'thigh.R': [20, 0, -6] }, [0, -0.08, 0.06], 'outExpo'),
      body(0.4, { hips: [0, -6, 0], spine: [-10, 0, 0], chest: [-14, 4, 0], neck: [-6, 0, 0], head: [-10, 0, 0], 'thigh.L': [-10, 0, 4], 'thigh.R': [8, 0, -4] }, [0, 0.03, -0.02], 'out'),
      body(0.52, { hips: [8, 0, 0], spine: [22, 0, 0], chest: [18, 2, 0], neck: [6, 0, 0], head: [-14, 0, 0], 'thigh.L': [-46, 0, 6], 'shin.L': [50, 0, 0], 'thigh.R': [26, 0, -4], 'shin.R': [30, 0, 0] }, [0, -0.12, 0.1], 'outExpo'),
      body(0.68, { hips: [10, 0, 0], spine: [24, 0, 0], chest: [20, 2, 0], head: [-14, 0, 0], 'thigh.L': [-48, 0, 6], 'shin.L': [52, 0, 0], 'thigh.R': [28, 0, -4], 'shin.R': [32, 0, 0] }, [0, -0.13, 0.11], 'out'),
      body(1.0, IDLE_BODY, [0, -0.04, 0], 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.3, 0, 0] } }],
  ),
};

// Blut Vene: shoulders set, both blades lowered, the veins flare
const vene: ClipDef = {
  name: 'ty_vene',
  dur: 0.6,
  fadeIn: 0.06,
  fadeOut: 0.2,
  events: { fx: 0.22 },
  keys: [
    body(0, IDLE_BODY),
    body(0.22, { hips: [0, -10, 0], spine: [-6, 2, 0], chest: [-10, 6, 0], neck: [8, 0, 0], head: [12, 0, 0], 'upperarm.L': [10, 0, 30], 'forearm.L': [-30, 0, 0], 'hand.L': [10, 0, 0], 'thigh.L': [-18, 0, 10], 'shin.L': [24, 0, 0], 'thigh.R': [14, 0, -10], 'shin.R': [24, 0, 0] }, [0, -0.07, 0], 'outExpo'),
    body(0.6, IDLE_BODY, [0, -0.04, 0], 'inOut'),
  ],
};

// Half-Hollowfication: the large blade raised upright before him, soaking (held), then the explosion — arms flung wide
const hollowRise: ClipDef = {
  name: 'ty_hollow',
  dur: 1.25,
  fadeIn: 0.08,
  fadeOut: 0.3,
  events: { soak: 0.08, burst: 0.62 },
  keys: mergeKeys(
    [
      { t: 0, c: GRIP_IDLE },
      ikR(0.3, [-0.06, 0.04, 0.36], [0.05, 0.99, 0.1], [0, -0.1, 0.99], [-0.8, -0.4, -0.4], 1, 'out'),
      ikR(0.58, [-0.06, 0.06, 0.36], [0.05, 0.99, 0.1], [0, -0.1, 0.99], [-0.8, -0.4, -0.4], 1, 'inOut'),
      ikR(0.66, [-0.42, 0.08, 0.1], [-0.85, 0.3, 0.42], [0, -0.82, 0.57], [-0.6, -0.6, -0.4], 1, 'outExpo'),
      ikR(0.9, [-0.42, 0.06, 0.1], [-0.85, 0.28, 0.44], [0, -0.82, 0.57], [-0.6, -0.6, -0.4], 1, 'out'),
      { t: 1.25, ease: 'inOut', c: GRIP_IDLE },
    ],
    [
      body(0, IDLE_BODY),
      body(0.3, { hips: [0, -14, 0], spine: [2, -6, 0], chest: [0, -8, 0], head: [-6, 10, 0], 'upperarm.L': [-60, 0, -10], 'forearm.L': [-80, 0, 0], 'hand.L': [30, 0, 0], 'thigh.L': [-18, 0, 8], 'shin.L': [22, 0, 0], 'thigh.R': [14, 0, -8], 'shin.R': [22, 0, 0] }, [0, -0.06, 0], 'out'),
      body(0.58, { hips: [0, -16, 0], spine: [6, -6, 0], chest: [8, -8, 0], head: [10, 10, 0], 'upperarm.L': [-62, 0, -10], 'forearm.L': [-82, 0, 0] }, [0, -0.08, 0], 'inOut'),
      body(0.66, { hips: [-6, 0, 0], spine: [-14, 0, 0], chest: [-16, 0, 0], neck: [-10, 0, 0], head: [-24, 0, 0], 'upperarm.L': [-20, 0, 80], 'forearm.L': [-20, 0, 0], 'hand.L': [10, 0, 0], 'thigh.L': [-24, 0, 14], 'shin.L': [30, 0, 0], 'thigh.R': [20, 0, -14], 'shin.R': [30, 0, 0] }, [0, -0.1, 0], 'outExpo'),
      body(0.9, { hips: [-6, 0, 0], spine: [-12, 0, 0], chest: [-14, 0, 0], head: [-20, 0, 0], 'upperarm.L': [-18, 0, 76], 'forearm.L': [-22, 0, 0] }, [0, -0.1, 0], 'out'),
      body(1.25, IDLE_BODY, [0, -0.04, 0], 'inOut'),
    ],
  ),
};

// ------------------------------------------------------------------ Half-Hollow

// the sword-arm lock: the left hand seizes the foe's arm, the white blade comes down at the head
const armLock: ClipDef = {
  name: 'hh_grab',
  dur: 0.86,
  fadeIn: 0.05,
  fadeOut: 0.22,
  events: { grab: 0.14, hit: 0.38 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0.78, -0.62, 0], c: [-0.08, 0.2, 0.08], r: 0.42, pole: [-0.75, -0.1, -0.65],
      keys: [[0, -40, 'out'], [0.22, -132, 'out'], [0.32, -126, 'inOut'], [0.38, 36, 'outExpo'], [0.52, 62, 'out'], [0.86, 40, 'inOut']],
    }),
    [
      ikL(0, [0.24, -0.12, 0.2], [0.05, 0.3, 0.95], [0, -0.95, 0.3], [0.7, -0.5, -0.4], 0),
      ikL(0.14, [0.06, 0.08, 0.6], [0.2, 0.8, 0.56], [0, -0.56, 0.8], [0.7, -0.5, -0.3], 1, 'outExpo'),
      ikL(0.36, [0.1, 0.06, 0.52], [0.2, 0.8, 0.56], [0, -0.56, 0.8], [0.7, -0.5, -0.3], 1, 'inOut'),
      ikL(0.86, [0.22, -0.16, 0.3], [0.02, 0.4, 0.92], [0, -0.92, 0.4], [0.7, -0.5, -0.4], 0, 'inOut'),
    ],
    [
      body(0, IDLE_BODY),
      body(0.14, { hips: [6, -16, 0], spine: [8, -12, 0], chest: [6, -18, 0], head: [-6, 18, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [36, 0, 0], 'thigh.R': [22, 0, -6], 'shin.R': [24, 0, 0] }, [0, -0.08, 0.1], 'outExpo'),
      body(0.32, { hips: [0, -26, 0], spine: [-4, -16, 0], chest: [-10, -24, 8], head: [-4, 24, 0] }, [0, -0.08, 0.06], 'inOut'),
      body(0.38, { hips: [6, 16, 0], spine: [16, 16, 0], chest: [18, 26, -10], head: [-12, -22, 0], 'thigh.L': [-44, 0, 10], 'shin.L': [42, 0, 0], 'thigh.R': [26, 0, -8], 'shin.R': [30, 0, 0] }, [0, -0.12, 0.1], 'outExpo'),
      body(0.52, { hips: [8, 20, 0], spine: [18, 18, 0], chest: [20, 28, -10], head: [-12, -24, 0] }, [0, -0.13, 0.1], 'out'),
      body(0.86, IDLE_BODY, [0, -0.04, 0], 'inOut'),
    ],
  ),
};

// Gran Rey Cero: head lowered so the horn points at the foe, the blades spread low; the charge, then the beam
const hornCero: ClipDef = {
  name: 'hh_cero',
  dur: 1.5,
  fadeIn: 0.08,
  fadeOut: 0.3,
  events: { charge: 0.06, fire: 0.62 },
  keys: mergeKeys(
    [
      { t: 0, c: GRIP_IDLE },
      ikR(0.3, [-0.42, -0.2, 0.0], [-0.8, -0.3, 0.5], [0, -0.85, -0.5], [-0.6, -0.3, -0.7], 1, 'out'),
      ikR(1.2, [-0.42, -0.21, 0.0], [-0.8, -0.3, 0.5], [0, -0.85, -0.5], [-0.6, -0.3, -0.7], 1, 'inOut'),
      { t: 1.5, ease: 'inOut', c: GRIP_IDLE },
    ],
    [
      body(0, IDLE_BODY),
      body(0.3, { hips: [10, 0, 0], spine: [16, 0, 0], chest: [10, 0, 0], neck: [10, 0, 0], head: [16, 0, -8], 'upperarm.L': [0, 0, 56], 'forearm.L': [-30, 0, 0], 'hand.L': [20, 0, 0], 'thigh.L': [-36, 0, 14], 'shin.L': [50, 0, 0], 'thigh.R': [20, 0, -14], 'shin.R': [44, 0, 0] }, [0, -0.16, 0.02], 'out'),
      body(0.62, { hips: [14, 0, 0], spine: [20, 0, 0], chest: [12, 0, 0], neck: [12, 0, 0], head: [20, 0, -8] }, [0, -0.18, 0.02], 'outExpo'),
      body(1.2, { hips: [12, 0, 0], spine: [18, 0, 0], chest: [10, 0, 0], neck: [10, 0, 0], head: [18, 0, -8] }, [0, -0.17, 0.02], 'inOut'),
      body(1.5, IDLE_BODY, [0, -0.04, 0], 'inOut'),
    ],
  ),
};

// Cero Creciente: the white blade raised high, the crescent swelling on it, then cut down
const creciente: ClipDef = {
  name: 'hh_creciente',
  dur: 1.4,
  fadeIn: 0.08,
  fadeOut: 0.3,
  events: { charge: 0.05, fx: 0.78 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0.78, -0.62, 0], c: [-0.08, 0.22, 0.08], r: 0.42, pole: [-0.75, -0.1, -0.65],
      keys: [[0, -40, 'out'], [0.4, -150, 'out'], [0.72, -146, 'inOut'], [0.78, 36, 'outExpo'], [0.96, 62, 'out'], [1.4, 40, 'inOut']],
    }),
    [
      body(0, IDLE_BODY),
      body(0.4, { hips: [0, -30, 0], spine: [-6, -16, 0], chest: [-12, -24, 8], neck: [0, 6, 0], head: [-6, 24, 0], 'thigh.L': [-20, 0, 12], 'shin.L': [30, 0, 0], 'thigh.R': [16, 0, -10], 'shin.R': [30, 0, 0], 'upperarm.L': [-30, 0, 40], 'forearm.L': [-40, 0, 0] }, [0, -0.1, -0.03], 'out'),
      body(0.72, { hips: [0, -32, 0], spine: [-8, -18, 0], chest: [-14, -26, 10], head: [-8, 26, 0] }, [0, -0.11, -0.03], 'inOut'),
      body(0.78, { hips: [6, 18, 0], spine: [16, 18, 0], chest: [18, 28, -10], head: [-12, -24, 0], 'thigh.L': [-40, 0, 12], 'shin.L': [40, 0, 0], 'thigh.R': [24, 0, -10], 'shin.R': [30, 0, 0], 'upperarm.L': [20, 0, 50], 'forearm.L': [-30, 0, 0] }, [0, -0.12, 0.08], 'outExpo'),
      body(0.96, { hips: [8, 22, 0], spine: [18, 20, 0], chest: [20, 30, -10], head: [-12, -26, 0] }, [0, -0.13, 0.09], 'out'),
      body(1.4, IDLE_BODY, [0, -0.04, 0], 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.5, 0, 0] } }, { t: 0.78, c: { '@look': [0.2, 0, 0] } }],
  ),
};

// ------------------------------------------------------------------ Blood Chains [anime-only]

const CHAINS_BODY: KeyDef['b'] = { ...IDLE_BODY, 'upperarm.L': [10, 0, 22], 'forearm.L': [-30, 0, 0], 'hand.L': [10, 0, 0] };

// the chain wall: the cleaver driven point-first into the ground; the chains burst up before him
const wall: ClipDef = {
  name: 'bc_wall',
  dur: 0.95,
  fadeIn: 0.06,
  fadeOut: 0.25,
  events: { plant: 0.28 },
  keys: mergeKeys(
    [
      { t: 0, c: GRIP_IDLE },
      ikR(0.16, [-0.1, 0.3, 0.36], [0, 0.6, 0.8], [0, -0.8, 0.6], [-0.8, -0.3, -0.4], 1, 'out'),
      ikR(0.28, [-0.08, -0.32, 0.46], [0, -0.92, 0.38], [0, -0.38, -0.92], [-0.8, 0.1, -0.5], 1, 'outExpo'),
      ikR(0.7, [-0.08, -0.34, 0.46], [0, -0.92, 0.38], [0, -0.38, -0.92], [-0.8, 0.1, -0.5], 1, 'out'),
      { t: 0.95, ease: 'inOut', c: GRIP_IDLE },
    ],
    [
      body(0, CHAINS_BODY),
      body(0.16, { hips: [-4, 0, 0], spine: [-8, 0, 0], chest: [-10, 0, 0], head: [-6, 0, 0], 'upperarm.L': [-30, 0, 30] }, [0, 0.02, 0], 'out'),
      body(0.28, { hips: [16, 0, 0], spine: [24, 0, 0], chest: [16, 0, 0], head: [-14, 0, 0], 'thigh.L': [-60, 0, 10], 'shin.L': [80, 0, 0], 'thigh.R': [20, 0, -10], 'shin.R': [90, 0, 0], 'foot.R': [-30, 0, 0], 'upperarm.L': [10, 0, 50] }, [0, -0.3, 0.06], 'outExpo'),
      body(0.7, { hips: [14, 0, 0], spine: [22, 0, 0], chest: [14, 0, 0], head: [-14, 0, 0], 'thigh.L': [-58, 0, 10], 'shin.L': [78, 0, 0], 'thigh.R': [18, 0, -10], 'shin.R': [88, 0, 0] }, [0, -0.29, 0.06], 'out'),
      body(0.95, CHAINS_BODY, [0, -0.04, 0], 'inOut'),
    ],
  ),
};

// the clone volley: the left arm sweeps forward, the clones go
const volley: ClipDef = {
  name: 'bc_volley',
  dur: 0.55,
  fadeIn: 0.05,
  fadeOut: 0.2,
  events: { go: 0.18 },
  keys: [
    body(0, CHAINS_BODY),
    body(0.1, { hips: [0, 12, 0], chest: [0, 14, 0], 'upperarm.L': [-30, 30, 60], 'forearm.L': [-20, 0, 0] }, [0, -0.04, 0], 'out'),
    body(0.18, { hips: [0, -10, 0], chest: [4, -14, 0], head: [-6, 10, 0], 'upperarm.L': [-90, -20, 10], 'forearm.L': [-6, 0, 0], 'hand.L': [-10, 0, 0] }, [0, -0.05, 0.04], 'outExpo'),
    body(0.55, CHAINS_BODY, [0, -0.04, 0], 'inOut'),
  ],
};

// ------------------------------------------------------------------ True Bankai

const BK_BODY: KeyDef['b'] = {
  hips: [0, -16, 0], spine: [6, 4, 0], chest: [4, 10, 0], neck: [0, 0, 0], head: [2, 4, 0],
  'thigh.L': [-16, 0, 6], 'shin.L': [18, 0, 0], 'foot.L': [-2, 0, 0], 'thigh.R': [12, 0, -8], 'shin.R': [20, 0, 0], 'foot.R': [-8, 0, 0],
};
const BK_GRIP: Record<string, E3> = { '@gripR': [-0.22, -0.34, 0.12], '@dirR': [-0.35, -0.45, 0.82], '@edgeR': [0.15, -0.88, -0.45], '@poleR': [-0.55, -0.3, -0.8], '@ikR': [1, 0, 0] };

// 1: the colossal level sweep, two hands
const bk1: ClipDef = {
  name: 'bk_s1',
  dur: 0.95,
  fadeIn: 0.08,
  fadeOut: 0.26,
  events: { step: 0.18, hit: 0.28, combo: 0.48 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [1, -0.12, 0], c: [-0.14, 0.12, 0.02], r: 0.42, pole: [-0.5, -0.65, -0.55],
      keys: [[0, -60, 'out'], [0.22, -140, 'out'], [0.34, 30, 'outExpo'], [0.5, 110, 'out'], [0.95, 70, 'inOut']],
      twoHand: [0.6, 1, 1, 1, 0.6],
    }),
    [
      body(0, BK_BODY),
      body(0.22, { hips: [0, -34, 0], spine: [2, -22, 0], chest: [-6, -30, 6], head: [0, 26, 0], 'thigh.L': [-18, 0, 8], 'thigh.R': [16, 0, -8], 'shin.R': [28, 0, 0] }, [0, -0.08, -0.03], 'out'),
      body(0.34, { hips: [0, 20, 0], spine: [10, 20, 0], chest: [8, 32, -4], head: [0, -22, 0], 'thigh.L': [-36, 0, 8], 'shin.L': [34, 0, 0], 'thigh.R': [28, 0, -6], 'shin.R': [30, 0, 0] }, [0, -0.12, 0.08], 'outExpo'),
      body(0.5, { hips: [0, 28, 0], spine: [12, 24, 0], chest: [10, 36, -4], head: [0, -28, 0] }, [0, -0.13, 0.1], 'out'),
      body(0.95, BK_BODY, [0, -0.05, 0], 'inOut'),
    ],
  ),
};

// 2: the falling diagonal, two hands
const bk2: ClipDef = {
  name: 'bk_s2',
  dur: 1.0,
  fadeIn: 0.08,
  fadeOut: 0.26,
  events: { step: 0.2, hit: 0.33, combo: 0.5 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0.78, -0.62, 0], c: [-0.1, 0.22, 0.08], r: 0.44, pole: [-0.75, -0.1, -0.65],
      keys: [[0, -30, 'out'], [0.25, -140, 'out'], [0.36, 40, 'outExpo'], [0.52, 64, 'out'], [1.0, 40, 'inOut']],
      twoHand: [0.6, 1, 1, 1, 0.6],
    }),
    [
      body(0, BK_BODY),
      body(0.25, { hips: [0, -28, 0], spine: [-4, -16, 0], chest: [-10, -24, 8], head: [-4, 24, 0], 'thigh.L': [-20, 0, 12], 'shin.L': [30, 0, 0], 'thigh.R': [16, 0, -10], 'shin.R': [30, 0, 0] }, [0, -0.1, -0.03], 'out'),
      body(0.36, { hips: [6, 18, 0], spine: [16, 18, 0], chest: [18, 28, -10], head: [-12, -24, 0], 'thigh.L': [-42, 0, 12], 'shin.L': [42, 0, 0], 'thigh.R': [26, 0, -10], 'shin.R': [32, 0, 0] }, [0, -0.13, 0.1], 'outExpo'),
      body(0.52, { hips: [8, 22, 0], spine: [18, 20, 0], chest: [20, 30, -10], head: [-12, -26, 0] }, [0, -0.14, 0.11], 'out'),
      body(1.0, BK_BODY, [0, -0.05, 0], 'inOut'),
    ],
  ),
};

// 3: the overhead chop that splits the ground (also the golden cleave)
const bk3: ClipDef = {
  name: 'bk_s3',
  dur: 1.1,
  fadeIn: 0.08,
  fadeOut: 0.28,
  events: { step: 0.3, hit: 0.44, fx: 0.45, combo: 0.62 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0, -1, 0], c: [-0.05, 0.24, 0.12], r: 0.44, pole: [-0.7, -0.2, -0.65],
      keys: [[0, 30, 'out'], [0.3, -152, 'out'], [0.38, -148, 'linear'], [0.45, 4, 'outExpo'], [0.62, 16, 'out'], [1.1, 40, 'inOut']],
      twoHand: [0.6, 1, 1, 1, 1, 0.6],
    }),
    [
      body(0, BK_BODY),
      body(0.3, { hips: [0, -4, 0], spine: [-12, 0, 0], chest: [-16, 4, 0], neck: [-6, 0, 0], head: [-12, 0, 0], 'thigh.L': [-6, 0, 4], 'thigh.R': [6, 0, -4] }, [0, 0.04, -0.04], 'out'),
      body(0.38, { spine: [-14, 0, 0], chest: [-18, 4, 0], head: [-14, 0, 0] }, [0, 0.05, -0.04], 'linear'),
      body(0.45, { hips: [10, 0, 0], spine: [26, 0, 0], chest: [20, 2, 0], neck: [6, 0, 0], head: [-14, 0, 0], 'thigh.L': [-52, 0, 6], 'shin.L': [56, 0, 0], 'foot.L': [-4, 0, 0], 'thigh.R': [30, 0, -4], 'shin.R': [34, 0, 0], 'foot.R': [-10, 0, 0] }, [0, -0.15, 0.12], 'outExpo'),
      body(0.62, { hips: [12, 0, 0], spine: [28, 0, 0], chest: [22, 2, 0], head: [-14, 0, 0], 'thigh.L': [-54, 0, 6], 'shin.L': [58, 0, 0], 'thigh.R': [32, 0, -4], 'shin.R': [36, 0, 0] }, [0, -0.16, 0.13], 'out'),
      body(1.1, BK_BODY, [0, -0.05, 0], 'inOut'),
    ],
  ),
};

// the golden Getsuga: a long two-handed wind-up over the right shoulder, the diagonal release
const bkGetsuga: ClipDef = {
  name: 'bk_getsuga',
  dur: 1.3,
  fadeIn: 0.1,
  fadeOut: 0.3,
  events: { charge: 0.05, fx: 0.68 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0.78, -0.62, 0], c: [-0.1, 0.22, 0.08], r: 0.44, pole: [-0.75, -0.1, -0.65],
      keys: [[0, -30, 'out'], [0.45, -150, 'out'], [0.62, -146, 'inOut'], [0.68, 36, 'outExpo'], [0.86, 62, 'out'], [1.3, 40, 'inOut']],
      twoHand: [0.6, 1, 1, 1, 1, 0.6],
    }),
    [
      body(0, BK_BODY),
      body(0.45, { hips: [0, -32, 0], spine: [-6, -18, 0], chest: [-12, -26, 8], neck: [0, 6, 0], head: [-6, 26, 0], 'thigh.L': [-22, 0, 12], 'shin.L': [32, 0, 0], 'thigh.R': [18, 0, -10], 'shin.R': [32, 0, 0] }, [0, -0.11, -0.04], 'out'),
      body(0.62, { hips: [0, -34, 0], spine: [-8, -20, 0], chest: [-14, -28, 10], head: [-8, 28, 0] }, [0, -0.12, -0.04], 'inOut'),
      body(0.68, { hips: [6, 20, 0], spine: [16, 18, 0], chest: [18, 30, -10], head: [-12, -24, 0], 'thigh.L': [-44, 0, 12], 'shin.L': [44, 0, 0], 'thigh.R': [26, 0, -10], 'shin.R': [32, 0, 0] }, [0, -0.13, 0.1], 'outExpo'),
      body(0.86, { hips: [8, 24, 0], spine: [18, 22, 0], chest: [20, 32, -10], head: [-12, -26, 0] }, [0, -0.14, 0.11], 'out'),
      body(1.3, BK_BODY, [0, -0.05, 0], 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.5, 0, 0] } }, { t: 0.68, c: { '@look': [0.2, 0, 0] } }],
  ),
};

// the guard: the cleaver raised upright before him, flat to the foe, both hands on the hilt (held)
const bkGuard: ClipDef = {
  name: 'bk_guard',
  dur: 0.3,
  fadeIn: 0.08,
  fadeOut: 0.2,
  keys: mergeKeys(
    [
      { t: 0, c: { '@gripR': [-0.04, -0.06, 0.34], '@dirR': [0.02, 0.99, 0.12], '@edgeR': [1, 0, 0], '@poleR': [-0.8, -0.4, -0.4], '@ikR': [1, 0, 0], '@twoHand': [1, 0, 0] } },
      { t: 0.3, c: { '@gripR': [-0.04, -0.06, 0.35], '@dirR': [0.02, 0.99, 0.12], '@edgeR': [1, 0, 0], '@poleR': [-0.8, -0.4, -0.4], '@ikR': [1, 0, 0], '@twoHand': [1, 0, 0] } },
    ],
    [
      body(0, { ...BK_BODY, spine: [8, 0, 0], chest: [6, 0, 0], 'thigh.L': [-28, 0, 10], 'shin.L': [36, 0, 0], 'thigh.R': [20, 0, -10], 'shin.R': [36, 0, 0] }, [0, -0.1, 0]),
      body(0.3, { ...BK_BODY, spine: [8, 0, 0], chest: [6, 0, 0], 'thigh.L': [-28, 0, 10], 'shin.L': [36, 0, 0], 'thigh.R': [20, 0, -10], 'shin.R': [36, 0, 0] }, [0, -0.1, 0]),
    ],
  ),
};

// the release: the two blades laid side by side before him (held), then the pillar of fire
const bkRelease: ClipDef = {
  name: 'bk_release',
  dur: 1.7,
  fadeIn: 0.12,
  fadeOut: 0.35,
  events: { fx: 0.4, burst: 1.0 },
  keys: mergeKeys(
    [
      { t: 0, c: GRIP_IDLE },
      ikR(0.4, [-0.07, 0.06, 0.5], [0.06, 0.12, 0.99], [1, 0, -0.06], [-0.7, -0.6, 0], 1, 'out'),
      ikR(1.0, [-0.07, 0.08, 0.52], [0.06, 0.12, 0.99], [1, 0, -0.06], [-0.7, -0.6, 0], 1, 'inOut'),
      ikR(1.7, [-0.07, 0.08, 0.52], [0.06, 0.12, 0.99], [1, 0, -0.06], [-0.7, -0.6, 0], 1, 'inOut'),
      ikL(0, [0.24, -0.12, 0.2], [0.05, 0.3, 0.95], [0, -0.95, 0.3], [0.7, -0.5, -0.4], 0),
      ikL(0.4, [0.05, 0.06, 0.5], [-0.06, 0.12, 0.99], [-1, 0, 0.06], [0.7, -0.6, 0], 1, 'out'),
      ikL(1.0, [0.05, 0.08, 0.52], [-0.06, 0.12, 0.99], [-1, 0, 0.06], [0.7, -0.6, 0], 1, 'inOut'),
      ikL(1.7, [0.05, 0.08, 0.52], [-0.06, 0.12, 0.99], [-1, 0, 0.06], [0.7, -0.6, 0], 1, 'inOut'),
    ],
    [
      body(0, IDLE_BODY),
      body(0.4, { hips: [0, -8, 0], spine: [4, -4, 0], chest: [2, -6, 0], head: [-6, 6, 0], 'thigh.L': [-20, 0, 10], 'shin.L': [24, 0, 0], 'thigh.R': [16, 0, -10], 'shin.R': [24, 0, 0] }, [0, -0.07, 0], 'out'),
      body(1.0, { hips: [0, -8, 0], spine: [2, -4, 0], chest: [0, -6, 0], head: [-10, 6, 0], 'thigh.L': [-24, 0, 12], 'shin.L': [28, 0, 0], 'thigh.R': [18, 0, -12], 'shin.R': [28, 0, 0] }, [0, -0.09, 0], 'inOut'),
      body(1.7, { hips: [0, -10, 0], spine: [4, -4, 0], chest: [2, -6, 0], head: [-6, 6, 0] }, [0, -0.08, 0], 'inOut'),
    ],
  ),
};

// the shell break: the cleaver raised overhead, the white shell cracks and falls away, the original Zangetsu cuts
const bkBreak: ClipDef = {
  name: 'bk_break',
  dur: 1.4,
  fadeIn: 0.08,
  fadeOut: 0.3,
  events: { crack: 0.42, step: 0.56, cut: 0.64 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0.9, -0.42, 0], c: [-0.1, 0.2, 0.06], r: 0.42, pole: [-0.7, -0.3, -0.6],
      keys: [[0, -20, 'out'], [0.36, -150, 'out'], [0.54, -146, 'inOut'], [0.64, 50, 'outExpo'], [0.82, 100, 'out'], [1.4, 60, 'inOut']],
      twoHand: [0.6, 1, 1, 0.4, 0.2, 0],
    }),
    [
      body(0, BK_BODY),
      body(0.36, { hips: [0, -10, 0], spine: [-10, -6, 0], chest: [-16, -8, 6], neck: [-6, 0, 0], head: [-14, 10, 0], 'thigh.L': [-14, 0, 8], 'thigh.R': [10, 0, -8] }, [0, 0.03, -0.04], 'out'),
      body(0.54, { hips: [0, -14, 0], spine: [-12, -8, 0], chest: [-18, -10, 6], head: [-16, 12, 0] }, [0, 0.04, -0.04], 'inOut'),
      body(0.64, { hips: [10, 24, 0], spine: [20, 22, 0], chest: [16, 34, -8], head: [-14, -28, 0], 'thigh.L': [-60, 0, 10], 'shin.L': [60, 0, 0], 'thigh.R': [36, 0, -8], 'shin.R': [24, 0, 0], 'upperarm.L': [20, 0, 60], 'forearm.L': [-30, 0, 0] }, [0, -0.16, 0.2], 'outExpo'),
      body(0.82, { hips: [12, 28, 0], spine: [22, 24, 0], chest: [18, 36, -8], head: [-14, -30, 0], 'thigh.L': [-62, 0, 10], 'shin.L': [62, 0, 0], 'thigh.R': [38, 0, -8], 'shin.R': [24, 0, 0] }, [0, -0.17, 0.22], 'out'),
      body(1.4, BK_BODY, [0, -0.05, 0], 'inOut'),
    ],
  ),
};

export const TYBW_CLIPS: ClipDef[] = [...ICHIGO_CLIPS, s1, s2, s3, s4, s5, s6, hurl, descent, land, beckon, flick, juji, vene, hollowRise, armLock, hornCero, creciente, wall, volley, bk1, bk2, bk3, bkGetsuga, bkGuard, bkRelease, bkBreak];
export const TYBW_CHAIN = ['ty_s1', 'ty_s2', 'ty_s3', 'ty_s4', 'ty_s5', 'ty_s6'];
/** Half-Hollow's white-blade string and Blood Chains' cleaver string reuse the classic Zangetsu cuts */
export const HOLLOW_CHAIN = ['slash1', 'slash2', 'slash4', 'slash3', 'slash5'];
export const CHAINS_CHAIN = ['slash1', 'slash2', 'slash3', 'slash4', 'slash5'];
export const BANKAI_CHAIN = ['bk_s1', 'bk_s2', 'bk_s3'];
export { BK_GRIP };
