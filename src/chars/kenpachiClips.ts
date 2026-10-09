// Kenpachi's animation set: a slouched giant with the sword resting on his shoulder and the free hand
// hanging loose. Sealed: wild one-handed swings with no pattern — a sweep, an overhead chop, a backhand
// riser, a lunging thrust — plus a left jab and a front kick; the lazy wrist flick that cuts a building
// in half; Kendō's two-handed Ryōdan with its long raised tell; the reiatsu shock wave; tearing off the
// eyepatch; "cut me anywhere". Shikai: the war-cleaver swung in great two-handed arcs and Meteor
// Cleaver. Bankai: a hunched oni hacking at speed and the distant bisection. Events: 'step' lunge,
// 'hit' damage frame, 'combo' next input, plus per-move fx events.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });
const grip = (t: number, p: E, dir: E, edge: E, pole: E, ease?: KeyDef['ease'], two = 0): KeyDef => ({
  t, ease, c: { '@gripR': p, '@dirR': dir, '@edgeR': edge, '@poleR': pole, '@ikR': [1, 0, 0], '@twoHand': [two, 0, 0] },
});

/** A copy of a clip under a new name, played `k` times faster. */
export function retime(src: ClipDef, name: string, k: number): ClipDef {
  return {
    ...src,
    name,
    dur: src.dur / k,
    fadeIn: (src.fadeIn ?? 0.1) / k,
    fadeOut: (src.fadeOut ?? 0.2) / k,
    events: src.events ? Object.fromEntries(Object.entries(src.events).map(([e, t]) => [e, t / k])) : undefined,
    keys: src.keys.map((kd) => ({ ...kd, t: kd.t / k })),
  };
}

// ------------------------------------------------------------------ stances

const IDLE: Record<string, E> = {
  hips: [0, -10, 0], spine: [7, 2, 0], chest: [4, 6, 0], neck: [6, 0, 0], head: [-10, -8, 3],
  'thigh.L': [-8, 0, 8], 'shin.L': [8, 0, 0], 'foot.L': [0, 0, -4],
  'thigh.R': [6, 0, -8], 'shin.R': [8, 0, 0], 'foot.R': [-4, 0, 4],
  'upperarm.L': [6, 0, 10], 'forearm.L': [-14, 0, 0], 'hand.L': [6, 0, 0],
};
/** The sword lies on his right shoulder, its back on the trapezius, hilt forward. */
export const SHOULDER = { p: [-0.19, 0.17, 0.27] as E, dir: [-0.12, 0.42, -0.9] as E, edge: [0.05, 0.9, 0.42] as E, pole: [-0.3, -0.85, 0.42] as E };
const RUN = { p: [-0.34, -0.27, -0.05] as E, dir: [-0.25, -0.33, -0.91] as E, edge: [0, -0.94, 0.33] as E, pole: [-0.8, -0.2, 0.5] as E };

export const KENPACHI_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.03,
  run: { chest: [6, 0, 0], 'upperarm.L': [-4, 0, 8] },
  sprint: { spine: [14, 0, 0], chest: [8, 0, 0], head: [-14, 0, 0], 'upperarm.L': [36, 0, 12], 'forearm.L': [-30, 0, 0] },
  swingL: 1,
  swingR: 0.15,
  grip: {
    idle: SHOULDER,
    walk: { ...SHOULDER, p: [-0.19, 0.16, 0.28] },
    run: RUN,
    sprint: { p: [-0.33, -0.16, -0.18], dir: [-0.2, -0.08, -0.97], edge: [0, -1, 0.08], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.44, -0.06, 0.14], dir: [-0.62, -0.2, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

/** Shikai: the cleaver rests on the shoulder, its head high behind him. */
export const CL_SHOULDER = { p: [-0.19, 0.17, 0.29] as E, dir: [-0.08, 0.62, -0.78] as E, edge: [0.04, 0.78, 0.62] as E, pole: [-0.3, -0.85, 0.42] as E };
export const KENPACHI_SHIKAI_STANCE: StanceDef = {
  ...KENPACHI_STANCE,
  grip: {
    idle: CL_SHOULDER,
    walk: CL_SHOULDER,
    run: { p: [-0.3, -0.2, -0.02], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.3, -0.12, -0.16], dir: [-0.18, 0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.44, -0.04, 0.14], dir: [-0.6, -0.1, 0.78], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

/** Bankai: a hunched oni, knees bent, head thrust forward, the blade hanging low. */
export const KENPACHI_BANKAI_STANCE: StanceDef = {
  idle: {
    hips: [10, -6, 0], spine: [16, 2, 0], chest: [10, 4, 0], neck: [-8, 0, 0], head: [-16, -4, 0],
    'thigh.L': [-30, 0, 12], 'shin.L': [40, 0, 0], 'foot.L': [-10, 0, -4],
    'thigh.R': [-10, 0, -12], 'shin.R': [34, 0, 0], 'foot.R': [-20, 0, 4],
    'upperarm.L': [-20, 0, 26], 'forearm.L': [-40, 0, 0], 'hand.L': [-10, 0, 0],
  },
  idleHips: -0.14,
  run: { spine: [20, 0, 0], chest: [10, 0, 0], neck: [-14, 0, 0], 'upperarm.L': [-10, 0, 16] },
  sprint: { spine: [32, 0, 0], chest: [14, 0, 0], neck: [-22, 0, 0], head: [-12, 0, 0], 'upperarm.L': [40, 0, 16], 'forearm.L': [-30, 0, 0] },
  swingL: 1.2,
  swingR: 0.2,
  freqScale: 1.05,
  grip: {
    idle: { p: [-0.36, -0.36, 0.22], dir: [-0.2, -0.55, 0.81], edge: [0.1, -0.83, -0.55], pole: [-0.6, -0.3, -0.75] },
    walk: { p: [-0.36, -0.34, 0.18], dir: [-0.2, -0.6, 0.77], edge: [0.1, -0.78, -0.6], pole: [-0.6, -0.3, -0.75] },
    run: RUN,
    sprint: { p: [-0.33, -0.16, -0.18], dir: [-0.2, -0.08, -0.97], edge: [0, -1, 0.08], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.44, -0.06, 0.14], dir: [-0.62, -0.2, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

export const REST = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });
const SH: E = [-0.22, 0.18, 0.04];

// ------------------------------------------------------------------ sealed: the unpatterned string

/** Wide one-handed sweep, right to left, the whole body unwinding behind it. */
const sweep: ClipDef = {
  name: 'kp_sweep', dur: 0.74, fadeIn: 0.06, fadeOut: 0.22, events: { step: 0.12, hit: 0.2, combo: 0.32 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [1, -0.08, 0], c: SH, r: 0.5, pole: [-0.5, -0.65, -0.55],
      keys: [[0, -70, 'out'], [0.13, -140, 'out'], [0.21, 22, 'outExpo'], [0.36, 112, 'out'], [0.74, 80, 'inOut']],
    }),
    [
      key(0, REST()),
      key(0.13, REST({ hips: [0, -30, 0], spine: [4, -20, 0], chest: [-4, -30, 4], head: [-8, 22, 0], 'thigh.L': [-16, 0, 8], 'thigh.R': [14, 0, -8], 'shin.R': [22, 0, 0], 'upperarm.L': [-30, 0, 24], 'forearm.L': [-40, 0, 0] }), [0, -0.06, -0.02], 'out'),
      key(0.21, REST({ hips: [0, 16, 0], spine: [10, 18, 0], chest: [8, 30, -6], head: [-10, -20, 0], 'thigh.L': [-34, 0, 8], 'shin.L': [30, 0, 0], 'thigh.R': [26, 0, -6], 'shin.R': [28, 0, 0], 'upperarm.L': [-10, 0, 52], 'forearm.L': [-20, 0, 0] }), [0, -0.1, 0.08], 'outExpo'),
      key(0.36, REST({ hips: [0, 24, 0], spine: [12, 22, 0], chest: [10, 34, -6], head: [-12, -26, 0], 'thigh.L': [-32, 0, 8], 'thigh.R': [24, 0, -6], 'upperarm.L': [-4, 0, 56], 'forearm.L': [-24, 0, 0] }), [0, -0.11, 0.1], 'out'),
      key(0.74, REST(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** One-handed overhead chop: the blade comes off the shoulder, over the head and straight down. */
const chop: ClipDef = {
  name: 'kp_chop', dur: 0.86, fadeIn: 0.07, fadeOut: 0.25, events: { step: 0.18, hit: 0.27, fx: 0.28, combo: 0.42 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0, -1, 0], c: [-0.14, 0.26, 0.1], r: 0.5, pole: [-0.75, -0.25, -0.6],
      keys: [[0, -120, 'out'], [0.17, -160, 'out'], [0.22, -152, 'linear'], [0.27, 8, 'outExpo'], [0.42, 22, 'out'], [0.86, 30, 'inOut']],
    }),
    [
      key(0, REST()),
      key(0.17, REST({ hips: [0, -6, 0], spine: [-10, -4, 0], chest: [-16, -8, 0], neck: [-6, 0, 0], head: [-12, 0, 0], 'thigh.L': [-10, 0, 6], 'thigh.R': [8, 0, -6], 'upperarm.L': [-60, 0, 40], 'forearm.L': [-30, 0, 0] }), [0, 0.03, -0.03], 'out'),
      key(0.22, REST({ spine: [-12, -4, 0], chest: [-18, -8, 0], head: [-14, 0, 0], 'upperarm.L': [-64, 0, 44], 'forearm.L': [-28, 0, 0] }), [0, 0.04, -0.03], 'linear'),
      key(0.27, REST({ hips: [10, 4, 0], spine: [24, 4, 0], chest: [18, 6, 0], neck: [6, 0, 0], head: [-18, 0, 0], 'thigh.L': [-48, 0, 8], 'shin.L': [52, 0, 0], 'foot.L': [-4, 0, 0], 'thigh.R': [28, 0, -6], 'shin.R': [32, 0, 0], 'foot.R': [-10, 0, 0], 'upperarm.L': [20, 0, 60], 'forearm.L': [-10, 0, 0] }), [0, -0.14, 0.12], 'outExpo'),
      key(0.42, REST({ hips: [12, 4, 0], spine: [26, 4, 0], chest: [20, 6, 0], head: [-20, 0, 0], 'thigh.L': [-50, 0, 8], 'shin.L': [54, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [34, 0, 0], 'upperarm.L': [24, 0, 62] }), [0, -0.15, 0.13], 'out'),
      key(0.86, REST(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** Backhand riser: from low on his left up across to high right. */
const rise: ClipDef = {
  name: 'kp_rise', dur: 0.68, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.08, hit: 0.17, combo: 0.3 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [-0.85, 0.52, 0], c: [-0.1, 0.1, 0.06], r: 0.48, pole: [-0.3, -0.4, -0.85],
      keys: [[0, -150, 'out'], [0.1, -128, 'out'], [0.17, 48, 'outExpo'], [0.32, 118, 'out'], [0.68, 80, 'inOut']],
    }),
    [
      key(0, REST({ hips: [0, 16, 0], spine: [10, 14, 0], chest: [8, 22, -4] })),
      key(0.1, REST({ hips: [0, 28, 0], spine: [12, 22, 6], chest: [12, 30, 8], 'thigh.L': [-22, 0, 8], 'shin.L': [32, 0, 0], 'thigh.R': [18, 0, -4], head: [-4, -24, 0], 'upperarm.L': [10, 0, 20] }), [0, -0.12, 0], 'out'),
      key(0.17, REST({ hips: [0, -20, 0], spine: [-4, -22, -4], chest: [-12, -30, -10], 'thigh.L': [-6, 0, 6], 'thigh.R': [-8, 0, -10], 'shin.R': [14, 0, 0], head: [-14, 22, 0], 'upperarm.L': [24, 0, 40], 'forearm.L': [-20, 0, 0] }), [0, -0.01, 0.06], 'outExpo'),
      key(0.32, REST({ hips: [0, -24, 0], spine: [-6, -24, -4], chest: [-14, -32, -10], head: [-16, 24, 0], 'upperarm.L': [28, 0, 44] }), [0, 0, 0.07], 'out'),
      key(0.68, REST(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** Lunging one-handed thrust. */
const thrust: ClipDef = {
  name: 'kp_thrust', dur: 0.7, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.12, hit: 0.2, combo: 0.32 },
  keys: mergeKeys(
    [
      grip(0, SHOULDER.p, SHOULDER.dir, SHOULDER.edge, SHOULDER.pole),
      grip(0.12, [-0.32, -0.04, -0.26], [0.06, 0.06, 1], [0, -1, 0.06], [-0.8, -0.3, -0.3], 'out'),
      grip(0.2, [-0.06, 0.06, 0.66], [0.06, 0, 1], [0, -1, 0], [-0.7, -0.5, -0.2], 'outExpo'),
      grip(0.36, [-0.06, 0.05, 0.64], [0.06, -0.02, 1], [0, -1, 0], [-0.7, -0.5, -0.2], 'out'),
      grip(0.7, SHOULDER.p, SHOULDER.dir, SHOULDER.edge, SHOULDER.pole, 'inOut'),
    ],
    [
      key(0, REST()),
      key(0.12, REST({ hips: [0, -26, 0], spine: [2, -16, 0], chest: [-2, -22, 0], head: [-8, 26, 0], 'thigh.L': [-12, 0, 6], 'thigh.R': [16, 0, -6], 'shin.R': [24, 0, 0], 'upperarm.L': [-40, 0, 30], 'forearm.L': [-50, 0, 0] }), [0, -0.06, -0.04], 'out'),
      key(0.2, REST({ hips: [6, 12, 0], spine: [14, 14, 0], chest: [10, 16, 0], head: [-18, -16, 0], 'thigh.L': [-56, 0, 6], 'shin.L': [56, 0, 0], 'foot.L': [-6, 0, 0], 'thigh.R': [34, 0, -6], 'shin.R': [20, 0, 0], 'foot.R': [-14, 0, 0], 'upperarm.L': [30, 0, 30], 'forearm.L': [-20, 0, 0] }), [0, -0.16, 0.16], 'outExpo'),
      key(0.36, REST({ hips: [8, 14, 0], spine: [16, 16, 0], chest: [12, 18, 0], head: [-20, -18, 0], 'thigh.L': [-58, 0, 6], 'shin.L': [58, 0, 0], 'thigh.R': [36, 0, -6], 'shin.R': [22, 0, 0], 'upperarm.L': [32, 0, 32] }), [0, -0.17, 0.17], 'out'),
      key(0.7, REST(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** The free hand: a straight left (the sword stays on the shoulder). */
const punch: ClipDef = {
  name: 'kp_punch', dur: 0.48, fadeIn: 0.05, fadeOut: 0.18, events: { step: 0.06, hit: 0.14, combo: 0.22 },
  keys: [
    key(0, REST()),
    key(0.07, REST({ chest: [2, 8, 0], spine: [6, 6, 0], 'upperarm.L': [-40, 0, 20], 'forearm.L': [-116, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.02, -0.02], 'out'),
    key(0.14, REST({ chest: [8, -30, 0], spine: [8, -12, 0], head: [-8, 22, 0], 'upperarm.L': [-92, 0, -4], 'forearm.L': [-4, 0, 0], 'hand.L': [0, 0, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [30, 0, 0], 'thigh.R': [20, 0, -6] }), [0, -0.06, 0.1], 'outExpo'),
    key(0.26, REST({ chest: [8, -28, 0], spine: [8, -12, 0], head: [-8, 20, 0], 'upperarm.L': [-88, 0, -2], 'forearm.L': [-8, 0, 0], 'thigh.L': [-28, 0, 6], 'shin.L': [28, 0, 0], 'thigh.R': [18, 0, -6] }), [0, -0.06, 0.09], 'out'),
    key(0.48, REST(), [0, -0.03, 0], 'inOut'),
  ],
};

/** Front kick that sends people through walls. */
const kick: ClipDef = {
  name: 'kp_kick', dur: 0.66, fadeIn: 0.05, fadeOut: 0.2, events: { step: 0.1, hit: 0.22, combo: 0.34 },
  keys: [
    key(0, REST()),
    key(0.12, REST({ spine: [-4, 0, 0], chest: [-6, 0, 0], 'thigh.R': [-80, 0, -4], 'shin.R': [100, 0, 0], 'foot.R': [10, 0, 0], 'thigh.L': [-4, 0, 6], 'shin.L': [14, 0, 0], 'upperarm.L': [-20, 0, 40], 'forearm.L': [-40, 0, 0] }), [0, 0.02, -0.04], 'out'),
    key(0.22, REST({ hips: [-14, 0, 0], spine: [-14, 0, 0], chest: [-10, 0, 0], head: [6, 0, 0], 'thigh.R': [-104, 0, -2], 'shin.R': [6, 0, 0], 'foot.R': [-30, 0, 0], 'thigh.L': [8, 0, 6], 'shin.L': [16, 0, 0], 'upperarm.L': [-10, 0, 60], 'forearm.L': [-20, 0, 0] }), [0, 0.02, 0.06], 'outExpo'),
    key(0.36, REST({ hips: [-12, 0, 0], spine: [-12, 0, 0], chest: [-8, 0, 0], 'thigh.R': [-90, 0, -2], 'shin.R': [30, 0, 0], 'thigh.L': [6, 0, 6], 'shin.L': [14, 0, 0], 'upperarm.L': [-8, 0, 56] }), [0, 0.01, 0.05], 'out'),
    key(0.66, REST(), [0, -0.03, 0], 'inOut'),
  ],
};

// ------------------------------------------------------------------ heavies and techniques

/** The building-cutter: a lazy flick of the wrist, the body hardly moving, head cocked. */
const flick: ClipDef = {
  name: 'kp_flick', dur: 0.95, fadeIn: 0.08, fadeOut: 0.3, events: { step: 0.2, hit: 0.27, cut: 0.28 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [1, 0.04, 0], c: [-0.16, 0.14, 0.12], r: 0.5, pole: [-0.55, -0.7, -0.4],
      keys: [[0, -100, 'out'], [0.2, -118, 'inOut'], [0.28, 58, 'outExpo'], [0.42, 92, 'out'], [0.95, 80, 'inOut']],
    }),
    [
      key(0, REST()),
      key(0.2, REST({ hips: [0, -8, 0], chest: [2, -10, 0], head: [-12, 6, -8] }), [0, -0.03, 0], 'inOut'),
      key(0.28, REST({ hips: [0, 6, 0], spine: [8, 6, 0], chest: [6, 14, 0], head: [-12, -10, -8], 'upperarm.L': [10, 0, 14] }), [0, -0.04, 0.02], 'outExpo'),
      key(0.95, REST(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** Kendō — Ryōdan: both hands raised high (the tell), then one cut straight down through everything. */
const ryodan: ClipDef = {
  name: 'kp_ryodan', dur: 1.7, fadeIn: 0.1, fadeOut: 0.35, events: { charge: 0.12, step: 0.8, hit: 0.88, fx: 0.89, combo: 1.3 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0, -1, 0], c: [-0.04, 0.24, 0.12], r: 0.46, pole: [-0.7, -0.2, -0.65],
      keys: [[0, -120, 'out'], [0.45, -172, 'inOut'], [0.8, -176, 'linear'], [0.88, 26, 'outExpo'], [1.05, 40, 'out'], [1.7, 36, 'inOut']],
      twoHand: [0.2, 1, 1, 1, 1, 0.1],
    }),
    [
      key(0, REST()),
      key(0.45, REST({ hips: [-4, 0, 0], spine: [-12, 0, 0], chest: [-16, 0, 0], neck: [-4, 0, 0], head: [-6, 0, 0], 'thigh.L': [-20, 0, 8], 'shin.L': [22, 0, 0], 'thigh.R': [16, 0, -8], 'shin.R': [20, 0, 0] }), [0, -0.04, -0.04], 'inOut'),
      key(0.8, REST({ hips: [-6, 0, 0], spine: [-14, 0, 0], chest: [-18, 0, 0], neck: [-4, 0, 0], head: [-6, 0, 0], 'thigh.L': [-24, 0, 8], 'shin.L': [26, 0, 0], 'thigh.R': [18, 0, -8], 'shin.R': [22, 0, 0] }), [0, -0.06, -0.05], 'linear'),
      key(0.88, REST({ hips: [14, 0, 0], spine: [28, 0, 0], chest: [22, 0, 0], neck: [8, 0, 0], head: [-24, 0, 0], 'thigh.L': [-64, 0, 8], 'shin.L': [70, 0, 0], 'foot.L': [-6, 0, 0], 'thigh.R': [34, 0, -8], 'shin.R': [44, 0, 0], 'foot.R': [-14, 0, 0] }), [0, -0.22, 0.16], 'outExpo'),
      key(1.05, REST({ hips: [16, 0, 0], spine: [30, 0, 0], chest: [24, 0, 0], head: [-26, 0, 0], 'thigh.L': [-66, 0, 8], 'shin.L': [72, 0, 0], 'thigh.R': [36, 0, -8], 'shin.R': [46, 0, 0] }), [0, -0.23, 0.17], 'out'),
      key(1.7, REST(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** Reiatsu shock wave: crouch and draw in, then everything bursts out — arms flung wide, head back. */
const shock: ClipDef = {
  name: 'kp_shock', dur: 1.05, fadeIn: 0.08, fadeOut: 0.3, events: { charge: 0.05, fx: 0.36 },
  keys: mergeKeys(
    [
      grip(0, SHOULDER.p, SHOULDER.dir, SHOULDER.edge, SHOULDER.pole),
      grip(0.3, [-0.2, -0.1, 0.22], [-0.3, -0.6, 0.74], [0.1, -0.78, -0.6], [-0.6, -0.4, -0.7], 'out'),
      grip(0.38, [-0.56, 0.1, 0.08], [-0.92, 0.25, 0.3], [0, -1, 0], [-0.3, -0.6, -0.7], 'outExpo'),
      grip(0.7, [-0.55, 0.08, 0.08], [-0.92, 0.2, 0.3], [0, -1, 0], [-0.3, -0.6, -0.7], 'out'),
      grip(1.05, SHOULDER.p, SHOULDER.dir, SHOULDER.edge, SHOULDER.pole, 'inOut'),
    ],
    [
      key(0, REST()),
      key(0.3, REST({ hips: [8, 0, 0], spine: [18, 0, 0], chest: [14, 0, 0], neck: [4, 0, 0], head: [-6, 0, 0], 'thigh.L': [-34, 0, 14], 'shin.L': [50, 0, 0], 'thigh.R': [-20, 0, -14], 'shin.R': [44, 0, 0], 'upperarm.L': [-30, 0, 14], 'forearm.L': [-90, 0, 0] }), [0, -0.16, 0], 'out'),
      key(0.38, REST({ hips: [-8, 0, 0], spine: [-14, 0, 0], chest: [-16, 0, 0], neck: [-10, 0, 0], head: [-20, 0, 0], 'thigh.L': [-14, 0, 18], 'shin.L': [20, 0, 0], 'thigh.R': [-4, 0, -18], 'shin.R': [18, 0, 0], 'upperarm.L': [-20, 0, 96], 'forearm.L': [-8, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.05, 0], 'outExpo'),
      key(0.7, REST({ hips: [-6, 0, 0], spine: [-12, 0, 0], chest: [-14, 0, 0], neck: [-8, 0, 0], head: [-18, 0, 0], 'thigh.L': [-14, 0, 18], 'shin.L': [20, 0, 0], 'thigh.R': [-4, 0, -18], 'shin.R': [18, 0, 0], 'upperarm.L': [-18, 0, 92], 'forearm.L': [-10, 0, 0] }), [0, -0.05, 0], 'out'),
      key(1.05, REST(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** The eyepatch: the left hand claws it off the face and flings it away. */
const eyepatch: ClipDef = {
  name: 'kp_eyepatch', dur: 1.15, fadeIn: 0.08, fadeOut: 0.3, events: { grab: 0.3, rip: 0.46 },
  keys: [
    key(0, REST()),
    key(0.3, REST({ 'upperarm.L': [-150, 26, -36], 'forearm.L': [-110, 0, 0], 'hand.L': [-10, 0, 0], head: [-6, -10, 0], neck: [-4, 0, 0], chest: [-2, 4, 0] }), [0, -0.02, 0], 'out'),
    key(0.38, REST({ 'upperarm.L': [-150, 26, -36], 'forearm.L': [-112, 0, 0], 'hand.L': [-10, 0, 0], head: [-4, -10, 0], neck: [-4, 0, 0], chest: [-2, 4, 0] }), [0, -0.02, 0], 'linear'),
    key(0.5, REST({ 'upperarm.L': [-70, 0, 74], 'forearm.L': [-10, 0, 0], 'hand.L': [10, 0, 0], head: [-14, 14, 0], neck: [-6, 0, 0], chest: [-8, -10, 0], spine: [-4, -6, 0] }), [0, -0.03, 0], 'outExpo'),
    key(0.75, REST({ 'upperarm.L': [-60, 0, 70], 'forearm.L': [-14, 0, 0], head: [-18, 0, 0], neck: [-8, 0, 0], chest: [-8, -6, 0] }), [0, -0.03, 0], 'out'),
    key(1.15, REST(), [0, -0.03, 0], 'inOut'),
  ],
};

/** "Cut me anywhere": arms spread wide, chest open, head tilted back. Held. */
const taunt: ClipDef = {
  name: 'kp_taunt', dur: 2.6, fadeIn: 0.25, fadeOut: 0.35,
  keys: mergeKeys(
    [
      grip(0, [-0.62, -0.18, 0.06], [-0.35, -0.85, 0.4], [0.2, -0.45, -0.87], [-0.4, -0.6, -0.7]),
      grip(2.6, [-0.62, -0.2, 0.06], [-0.35, -0.85, 0.4], [0.2, -0.45, -0.87], [-0.4, -0.6, -0.7]),
    ],
    [
      key(0, REST({ hips: [-4, 0, 0], spine: [-6, 0, 0], chest: [-8, 0, 0], neck: [-4, 0, 0], head: [-10, -6, 6], 'upperarm.L': [-6, 0, 62], 'forearm.L': [-10, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.02, 0]),
      key(1.3, REST({ hips: [-5, 0, 0], spine: [-7, 0, 0], chest: [-9, 0, 0], neck: [-4, 0, 0], head: [-12, -6, 6], 'upperarm.L': [-6, 0, 64], 'forearm.L': [-12, 0, 0] }), [0, -0.025, 0], 'inOut'),
      key(2.6, REST({ hips: [-4, 0, 0], spine: [-6, 0, 0], chest: [-8, 0, 0], neck: [-4, 0, 0], head: [-10, -6, 6], 'upperarm.L': [-6, 0, 62], 'forearm.L': [-10, 0, 0] }), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** "Nome, Nozarashi": the sword raised before him, it swells into the cleaver, swung onto the shoulder. */
const nome: ClipDef = {
  name: 'kp_nome', dur: 1.8, fadeIn: 0.1, fadeOut: 0.35, events: { raise: 0.2, grow: 0.62, rest: 1.25 },
  keys: mergeKeys(
    [
      grip(0, SHOULDER.p, SHOULDER.dir, SHOULDER.edge, SHOULDER.pole),
      grip(0.45, [-0.18, 0.08, 0.42], [0.02, 0.96, 0.28], [0, 0.28, -0.96], [-0.7, -0.5, -0.3], 'out'),
      grip(0.95, [-0.2, 0.06, 0.44], [0.02, 0.96, 0.28], [0, 0.28, -0.96], [-0.7, -0.5, -0.3], 'inOut'),
      grip(1.3, CL_SHOULDER.p, CL_SHOULDER.dir, CL_SHOULDER.edge, CL_SHOULDER.pole, 'inOut'),
      grip(1.8, CL_SHOULDER.p, CL_SHOULDER.dir, CL_SHOULDER.edge, CL_SHOULDER.pole),
    ],
    [
      key(0, REST()),
      key(0.45, REST({ head: [-4, -4, 0], chest: [-2, 4, 0] }), [0, -0.03, 0], 'out'),
      key(0.7, REST({ head: [-14, -4, 0], chest: [-8, 4, 0], spine: [-4, 0, 0], 'upperarm.L': [-10, 0, 40], 'forearm.L': [-20, 0, 0] }), [0, -0.05, 0], 'outExpo'),
      key(1.8, REST(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** Bankai: a roar, hunched, arms thrown out — the oni comes. */
const bankai: ClipDef = {
  name: 'kp_bankai', dur: 2.1, fadeIn: 0.12, fadeOut: 0.4, events: { charge: 0.1, burst: 0.62 },
  keys: [
    key(0, REST()),
    key(0.5, REST({ hips: [10, 0, 0], spine: [24, 0, 0], chest: [16, 0, 0], neck: [6, 0, 0], head: [4, 0, 0], 'thigh.L': [-36, 0, 14], 'shin.L': [54, 0, 0], 'thigh.R': [-22, 0, -14], 'shin.R': [48, 0, 0], 'upperarm.L': [-20, 0, 10], 'forearm.L': [-100, 0, 0] }), [0, -0.18, 0], 'inOut'),
    key(0.66, REST({ hips: [-6, 0, 0], spine: [-10, 0, 0], chest: [-14, 0, 0], neck: [-12, 0, 0], head: [-26, 0, 0], 'thigh.L': [-20, 0, 20], 'shin.L': [30, 0, 0], 'thigh.R': [-8, 0, -20], 'shin.R': [26, 0, 0], 'upperarm.L': [-40, 0, 90], 'forearm.L': [-20, 0, 0] }), [0, -0.08, 0], 'outExpo'),
    key(1.5, REST({ hips: [-5, 0, 0], spine: [-8, 0, 0], chest: [-12, 0, 0], neck: [-10, 0, 0], head: [-24, 0, 0], 'thigh.L': [-20, 0, 20], 'shin.L': [30, 0, 0], 'thigh.R': [-8, 0, -20], 'shin.R': [26, 0, 0], 'upperarm.L': [-38, 0, 88], 'forearm.L': [-24, 0, 0] }), [0, -0.08, 0], 'out'),
    key(2.1, REST(), [0, -0.03, 0], 'inOut'),
  ],
};

// ------------------------------------------------------------------ Shikai: the war-cleaver

/** Two-handed overhead chop with the cleaver. */
const cl1: ClipDef = {
  name: 'kp_cl1', dur: 1.0, fadeIn: 0.08, fadeOut: 0.28, events: { step: 0.24, hit: 0.33, fx: 0.34, combo: 0.5 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0, -1, 0], c: [-0.04, 0.26, 0.12], r: 0.42, pole: [-0.7, -0.2, -0.65],
      keys: [[0, -128, 'out'], [0.22, -168, 'out'], [0.27, -165, 'linear'], [0.33, 18, 'outExpo'], [0.5, 32, 'out'], [1.0, 30, 'inOut']],
      twoHand: [0.3, 1, 1, 1, 1, 0.2],
    }),
    [
      key(0, REST()),
      key(0.22, REST({ spine: [-12, 0, 0], chest: [-16, 4, 0], head: [-12, 0, 0], 'thigh.L': [-10, 0, 6], 'thigh.R': [8, 0, -6] }), [0, 0.02, -0.04], 'out'),
      key(0.33, REST({ hips: [12, 0, 0], spine: [26, 0, 0], chest: [20, 2, 0], head: [-20, 0, 0], 'thigh.L': [-54, 0, 8], 'shin.L': [60, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [36, 0, 0], 'foot.R': [-12, 0, 0] }), [0, -0.18, 0.14], 'outExpo'),
      key(0.5, REST({ hips: [14, 0, 0], spine: [28, 0, 0], chest: [22, 2, 0], head: [-22, 0, 0], 'thigh.L': [-56, 0, 8], 'shin.L': [62, 0, 0], 'thigh.R': [32, 0, -6], 'shin.R': [38, 0, 0] }), [0, -0.19, 0.15], 'out'),
      key(1.0, REST(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** Two-handed horizontal sweep, the cleaver dragging the body round. */
const cl2: ClipDef = {
  name: 'kp_cl2', dur: 0.95, fadeIn: 0.07, fadeOut: 0.28, events: { step: 0.18, hit: 0.28, combo: 0.44 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [1, -0.1, 0], c: [-0.14, 0.1, 0.08], r: 0.42, pole: [-0.5, -0.65, -0.55],
      keys: [[0, -80, 'out'], [0.18, -150, 'out'], [0.28, 20, 'outExpo'], [0.46, 120, 'out'], [0.95, 90, 'inOut']],
      twoHand: [0.3, 1, 1, 0.7, 0.2],
    }),
    [
      key(0, REST()),
      key(0.18, REST({ hips: [0, -34, 0], spine: [6, -22, 0], chest: [-2, -32, 4], head: [-8, 26, 0], 'thigh.L': [-18, 0, 10], 'thigh.R': [16, 0, -10], 'shin.R': [24, 0, 0] }), [0, -0.08, -0.02], 'out'),
      key(0.28, REST({ hips: [0, 20, 0], spine: [12, 20, 0], chest: [10, 32, -6], head: [-12, -24, 0], 'thigh.L': [-36, 0, 10], 'shin.L': [34, 0, 0], 'thigh.R': [26, 0, -8], 'shin.R': [30, 0, 0] }), [0, -0.12, 0.1], 'outExpo'),
      key(0.46, REST({ hips: [0, 30, 0], spine: [14, 26, 0], chest: [12, 38, -6], head: [-14, -30, 0], 'thigh.L': [-34, 0, 10], 'thigh.R': [24, 0, -8] }), [0, -0.13, 0.12], 'out'),
      key(0.95, REST(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** Full spin with the cleaver held out. */
const cl3: ClipDef = {
  name: 'kp_cl3', dur: 0.95, fadeIn: 0.06, fadeOut: 0.25, events: { step: 0.08, hit: 0.26, hit2: 0.44, combo: 0.56 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [1, -0.1, 0], c: SH, r: 0.48, pole: [-0.3, -0.9, -0.2],
      keys: [[0, -60, 'out'], [0.1, -100, 'out'], [0.56, -95, 'linear'], [0.95, -70, 'inOut']],
      twoHand: [0.3, 0.8, 0.8, 0.2],
    }),
    [
      key(0, REST()),
      key(0.1, REST({ hips: [0, -20, 0], spine: [6, -14, 0], chest: [4, -20, 0], 'thigh.L': [-18, 0, 12], 'shin.L': [28, 0, 0], 'thigh.R': [16, 0, -12], 'shin.R': [28, 0, 0] }), [0, -0.12, 0], 'out'),
      key(0.56, REST({ hips: [0, 10, 0], spine: [8, 10, 0], chest: [6, 14, 0], 'thigh.L': [-18, 0, 12], 'thigh.R': [16, 0, -12] }), [0, -0.12, 0], 'linear'),
      key(0.95, REST(), [0, -0.03, 0], 'inOut'),
    ],
    [
      { t: 0, c: { '@spin': [0, 0, 0] } },
      { t: 0.1, c: { '@spin': [-20, 0, 0] }, ease: 'out' },
      { t: 0.56, c: { '@spin': [360, 0, 0] }, ease: 'inOut' },
      { t: 0.95, c: { '@spin': [360, 0, 0] } },
    ],
  ),
};

/** Meteor Cleaver: leap, the cleaver raised over the head, crash down. */
const meteor: ClipDef = {
  name: 'kp_meteor', dur: 1.35, fadeIn: 0.08, fadeOut: 0.32, events: { leap: 0.16, hit: 0.62, fx: 0.62 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0, -1, 0], c: [-0.04, 0.26, 0.12], r: 0.44, pole: [-0.7, -0.3, -0.6],
      keys: [[0, -128, 'out'], [0.4, -170, 'out'], [0.55, -166, 'linear'], [0.62, 22, 'outExpo'], [0.85, 34, 'out'], [1.35, 30, 'inOut']],
      twoHand: [0.4, 1, 1, 1, 1, 0.2],
    }),
    [
      key(0, REST()),
      key(0.16, REST({ hips: [10, 0, 0], spine: [16, 0, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [60, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [50, 0, 0] }), [0, -0.2, 0], 'out'),
      key(0.4, REST({ hips: [-6, 0, 0], spine: [-14, 0, 0], chest: [-18, 0, 6], head: [-12, 0, 0], 'thigh.L': [-70, 0, 8], 'shin.L': [100, 0, 0], 'thigh.R': [-30, 0, -8], 'shin.R': [90, 0, 0], 'foot.L': [20, 0, 0], 'foot.R': [20, 0, 0] }), [0, 0.05, 0], 'out'),
      key(0.55, REST({ spine: [-16, 0, 0], chest: [-20, 0, 6] }), [0, 0.05, 0], 'linear'),
      key(0.62, REST({ hips: [12, 0, 0], spine: [28, 0, 0], chest: [22, 0, 0], head: [-20, 0, 0], 'thigh.L': [-56, 0, 8], 'shin.L': [60, 0, 0], 'thigh.R': [32, 0, -6], 'shin.R': [40, 0, 0], 'foot.R': [-12, 0, 0] }), [0, -0.18, 0.12], 'outExpo'),
      key(0.85, REST({ hips: [14, 0, 0], spine: [30, 0, 0], chest: [24, 0, 0], head: [-22, 0, 0], 'thigh.L': [-58, 0, 8], 'shin.L': [62, 0, 0], 'thigh.R': [34, 0, -6], 'shin.R': [42, 0, 0] }), [0, -0.19, 0.13], 'out'),
      key(1.35, REST(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

// ------------------------------------------------------------------ Bankai: the oni

/** Distant bisection: both hands, one vertical cut held at the bottom while the line splits. */
const bisect: ClipDef = { ...retime(ryodan, 'kp_bisect', 1.5) };

export const KENPACHI_CLIPS: ClipDef[] = [
  sweep, chop, rise, thrust, punch, kick, flick, ryodan, shock, eyepatch, taunt, nome, bankai,
  cl1, cl2, cl3, meteor,
  retime(rise, 'kp_bk1', 1.35), retime(sweep, 'kp_bk2', 1.35), retime(chop, 'kp_bk3', 1.3), bisect,
  ...ICHIGO_CLIPS.filter((c) => c.name === 'dash' || c.name === 'airstep' || c.name === 'hit_heavy'),
];

/** The sealed string draws from this pool at random (no two the same in a row). */
export const KENPACHI_POOL = ['kp_sweep', 'kp_chop', 'kp_rise', 'kp_thrust', 'kp_punch', 'kp_kick'];
export const KENPACHI_SHIKAI_CHAIN = ['kp_cl1', 'kp_cl2', 'kp_cl3'];
export const KENPACHI_BANKAI_CHAIN = ['kp_bk1', 'kp_bk2', 'kp_bk3'];
