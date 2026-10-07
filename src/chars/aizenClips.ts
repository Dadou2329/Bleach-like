// Aizen's animation set: unhurried and exact. The sword hangs low in the right hand, the left hand is
// free; cuts are small, precise and final — a level cut, a riser, a thrust, and the passing stroke
// that only shows its wound after he has gone by. The left hand raises a single finger to stop a
// blade, opens to cast Kidō (Kurohitsugi, Raikōhō, Goryūtenmetsu), takes off the glasses and sweeps
// the hair back for the reveal; the Hōgyoku awakens with arms opened and the head thrown back.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

const IDLE: Record<string, E> = {
  hips: [0, -6, 0], spine: [0, 2, 0], chest: [-2, 4, 0], neck: [0, 0, 0], head: [2, -3, 0],
  'thigh.L': [-4, 0, 3], 'shin.L': [4, 0, 0], 'thigh.R': [3, 0, -3], 'shin.R': [4, 0, 0],
  'upperarm.L': [6, 0, 7], 'forearm.L': [-14, 0, 0], 'hand.L': [6, 0, 0],
};
const LOW = { p: [-0.25, -0.34, 0.12] as E, dir: [-0.12, -0.7, 0.7] as E, edge: [0.1, -0.7, -0.7] as E, pole: [-0.55, -0.3, -0.8] as E };

export const AIZEN_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.01,
  run: { chest: [4, 0, 0], 'upperarm.L': [-4, 0, 7] },
  sprint: { spine: [10, 0, 0], chest: [6, 0, 0], head: [-8, 0, 0], 'upperarm.L': [30, 0, 10], 'forearm.L': [-20, 0, 0] },
  swingL: 0.4,
  swingR: 0.15,
  grip: {
    idle: LOW,
    walk: { ...LOW, p: [-0.25, -0.33, 0.1] },
    run: { p: [-0.28, -0.26, -0.06], dir: [-0.22, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.28, -0.16, -0.16], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.36, -0.1, 0.1], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

/** Chrysalis: the blade is part of the right forearm — the arm hangs, the blade points down past the hand. */
export const CHRYSALIS_STANCE: StanceDef = {
  idle: { ...IDLE, 'upperarm.R': [6, 0, -7], 'forearm.R': [-10, 0, 0], 'hand.R': [0, 0, 0] },
  idleHips: -0.01,
  run: { chest: [6, 0, 0], 'upperarm.L': [-4, 0, 7], 'upperarm.R': [-4, 0, -7] },
  sprint: { spine: [12, 0, 0], chest: [8, 0, 0], head: [-10, 0, 0], 'upperarm.L': [36, 0, 12], 'forearm.L': [-24, 0, 0], 'upperarm.R': [36, 0, -12], 'forearm.R': [-24, 0, 0] },
  swingL: 0.5,
  swingR: 0.5,
};

const R = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });
const SH: E = [-0.2, 0.16, 0.04];

/** A level cut, right to left, with almost no body behind it. */
const cut1: ClipDef = {
  name: 'az_cut1', dur: 0.58, fadeIn: 0.05, fadeOut: 0.2, events: { step: 0.07, hit: 0.14, combo: 0.24 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [1, -0.05, 0], c: SH, r: 0.36, pole: [-0.5, -0.65, -0.55],
      keys: [[0, -60, 'out'], [0.08, -110, 'out'], [0.14, 40, 'outExpo'], [0.26, 92, 'out'], [0.58, 70, 'inOut']],
    }),
    [
      key(0, R()),
      key(0.08, R({ hips: [0, -14, 0], chest: [-2, -12, 0], head: [2, 8, 0] }), [0, -0.02, 0], 'out'),
      key(0.14, R({ hips: [0, 10, 0], spine: [2, 6, 0], chest: [0, 14, 0], head: [2, -10, 0], 'thigh.L': [-18, 0, 4], 'shin.L': [16, 0, 0], 'thigh.R': [10, 0, -4] }), [0, -0.04, 0.06], 'outExpo'),
      key(0.58, R(), [0, -0.01, 0], 'inOut'),
    ],
  ),
};

/** A rising diagonal from low on the left. */
const cut2: ClipDef = {
  name: 'az_cut2', dur: 0.6, fadeIn: 0.05, fadeOut: 0.2, events: { step: 0.07, hit: 0.15, combo: 0.25 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [-0.8, 0.6, 0], c: [-0.08, 0.1, 0.06], r: 0.36, pole: [-0.3, -0.4, -0.85],
      keys: [[0, -140, 'out'], [0.09, -120, 'out'], [0.15, 50, 'outExpo'], [0.28, 100, 'out'], [0.6, 70, 'inOut']],
    }),
    [
      key(0, R({ hips: [0, 10, 0], chest: [0, 12, 0] })),
      key(0.09, R({ hips: [0, 18, 0], spine: [4, 12, 0], chest: [4, 18, 4], head: [0, -12, 0] }), [0, -0.05, 0], 'out'),
      key(0.15, R({ hips: [0, -12, 0], spine: [-2, -12, 0], chest: [-6, -16, -4], head: [-4, 12, 0], 'upperarm.L': [10, 0, 20] }), [0, -0.01, 0.04], 'outExpo'),
      key(0.6, R(), [0, -0.01, 0], 'inOut'),
    ],
  ),
};

/** A precise thrust. */
const cut3: ClipDef = {
  name: 'az_cut3', dur: 0.58, fadeIn: 0.04, fadeOut: 0.2, events: { step: 0.08, hit: 0.15, combo: 0.26 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@gripR': LOW.p, '@dirR': LOW.dir, '@edgeR': LOW.edge, '@poleR': LOW.pole, '@ikR': [1, 0, 0] } },
      { t: 0.09, ease: 'out', c: { '@gripR': [-0.26, -0.02, -0.14], '@dirR': [0.05, 0.02, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.8, -0.3, -0.3], '@ikR': [1, 0, 0] } },
      { t: 0.15, ease: 'outExpo', c: { '@gripR': [-0.04, 0.04, 0.6], '@dirR': [0.05, -0.02, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.7, -0.5, -0.2], '@ikR': [1, 0, 0] } },
      { t: 0.3, ease: 'out', c: { '@gripR': [-0.05, 0.03, 0.58], '@dirR': [0.05, -0.04, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.7, -0.5, -0.2], '@ikR': [1, 0, 0] } },
      { t: 0.58, ease: 'inOut', c: { '@gripR': LOW.p, '@dirR': LOW.dir, '@edgeR': LOW.edge, '@poleR': LOW.pole, '@ikR': [1, 0, 0] } },
    ],
    [
      key(0, R()),
      key(0.09, R({ hips: [0, -14, 0], chest: [0, -14, 0] }), [0, -0.02, -0.03], 'out'),
      key(0.15, R({ hips: [4, 14, 0], spine: [6, 10, 0], chest: [4, 14, 0], head: [-2, -14, 0], 'thigh.L': [-40, 0, 4], 'shin.L': [44, 0, 0], 'thigh.R': [24, 0, -4], 'shin.R': [14, 0, 0] }), [0, -0.08, 0.16], 'outExpo'),
      key(0.58, R(), [0, -0.01, 0], 'inOut'),
    ],
  ),
};

/** The passing stroke: one low diagonal cut carried straight through and past the target. */
const pass: ClipDef = {
  name: 'az_pass', dur: 0.75, fadeIn: 0.04, fadeOut: 0.22, events: { step: 0.06, hit: 0.14 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [1, -0.5, 0], c: SH, r: 0.38, pole: [-0.5, -0.6, -0.55],
      keys: [[0, -70, 'out'], [0.06, -120, 'out'], [0.14, 60, 'outExpo'], [0.4, 100, 'out'], [0.75, 70, 'inOut']],
    }),
    [
      key(0, R()),
      key(0.06, R({ hips: [10, -16, 0], spine: [10, -10, 0], chest: [6, -14, 0], head: [-10, 10, 0] }), [0, -0.08, 0], 'out'),
      key(0.14, R({ hips: [14, 14, 0], spine: [14, 10, 0], chest: [10, 18, 0], head: [-14, -10, 0], 'thigh.L': [-50, 0, 4], 'shin.L': [60, 0, 0], 'thigh.R': [36, 0, -4], 'shin.R': [40, 0, 0], 'upperarm.L': [30, 0, 30] }), [0, -0.14, 0.1], 'outExpo'),
      key(0.4, R({ hips: [12, 16, 0], spine: [12, 12, 0], chest: [8, 20, 0], head: [-12, -12, 0], 'thigh.L': [-48, 0, 4], 'shin.L': [58, 0, 0], 'thigh.R': [34, 0, -4], 'shin.R': [38, 0, 0], 'upperarm.L': [28, 0, 30] }), [0, -0.13, 0.09], 'out'),
      key(0.75, R(), [0, -0.01, 0], 'inOut'),
    ],
  ),
};

/** One finger raised: a blade stopped dead on the fingertip. Held. */
const finger: ClipDef = {
  name: 'az_finger', dur: 1.1, fadeIn: 0.06, fadeOut: 0.2, events: { guard: 0.08 },
  keys: [
    key(0, R()),
    key(0.1, R({ chest: [0, -10, 0], head: [0, 6, 0], 'upperarm.L': [-80, 0, -18], 'forearm.L': [-30, 0, 0], 'hand.L': [-20, 0, 0] }), [0, -0.01, 0], 'outExpo'),
    key(0.9, R({ chest: [0, -10, 0], head: [0, 6, 0], 'upperarm.L': [-82, 0, -18], 'forearm.L': [-30, 0, 0], 'hand.L': [-20, 0, 0] }), [0, -0.01, 0], 'inOut'),
    key(1.1, R(), [0, -0.01, 0], 'inOut'),
  ],
};

/** Kidō, the left hand raised palm-out toward the target (Kurohitsugi, Raikōhō). */
const cast = (name: string, dur: number, fire: number): ClipDef => ({
  name, dur, fadeIn: 0.06, fadeOut: 0.25, events: { cast: fire },
  keys: [
    key(0, R()),
    key(fire * 0.8, R({ chest: [0, -16, 0], spine: [0, -6, 0], head: [0, 12, 0], 'upperarm.L': [-88, 0, -8], 'forearm.L': [-6, 0, 0], 'hand.L': [-60, 0, 0] }), [0, -0.01, 0], 'out'),
    key(fire, R({ chest: [-2, -18, 0], spine: [0, -6, 0], head: [0, 12, 0], 'upperarm.L': [-92, 0, -8], 'forearm.L': [-4, 0, 0], 'hand.L': [-70, 0, 0] }), [0, -0.01, -0.02], 'outExpo'),
    key(dur - 0.3, R({ chest: [-2, -16, 0], head: [0, 10, 0], 'upperarm.L': [-90, 0, -8], 'forearm.L': [-6, 0, 0], 'hand.L': [-64, 0, 0] }), [0, -0.01, 0], 'inOut'),
    key(dur, R(), [0, -0.01, 0], 'inOut'),
  ],
});

/** Hadō #99: the hand raised to the sky, then brought down at the target. */
const dragons: ClipDef = {
  name: 'az_dragons', dur: 2.0, fadeIn: 0.1, fadeOut: 0.3, events: { raise: 0.3, cast: 0.95 },
  keys: [
    key(0, R()),
    key(0.45, R({ chest: [-6, -6, 0], head: [-10, 6, 0], 'upperarm.L': [-160, 0, 6], 'forearm.L': [-10, 0, 0], 'hand.L': [-10, 0, 0] }), [0, -0.01, 0], 'out'),
    key(0.9, R({ chest: [-8, -6, 0], head: [-12, 6, 0], 'upperarm.L': [-164, 0, 6], 'forearm.L': [-8, 0, 0] }), [0, -0.01, 0], 'inOut'),
    key(1.05, R({ chest: [4, -14, 0], head: [2, 10, 0], 'upperarm.L': [-80, 0, -10], 'forearm.L': [-4, 0, 0], 'hand.L': [-60, 0, 0] }), [0, -0.02, 0.03], 'outExpo'),
    key(2.0, R(), [0, -0.01, 0], 'inOut'),
  ],
};

/** The reveal: the glasses taken off and crushed, the hair swept back with the same hand. */
const reveal: ClipDef = {
  name: 'az_reveal', dur: 2.0, fadeIn: 0.1, fadeOut: 0.3, events: { glasses: 0.45, crush: 0.75, sweep: 1.3 },
  keys: [
    key(0, R()),
    key(0.42, R({ head: [6, 0, 0], 'upperarm.L': [-110, 20, -30], 'forearm.L': [-118, 0, 0], 'hand.L': [-10, 0, 0] }), [0, -0.01, 0], 'out'),
    key(0.75, R({ head: [4, 0, 0], 'upperarm.L': [-60, 0, 10], 'forearm.L': [-80, 0, 0], 'hand.L': [-30, 0, 0] }), [0, -0.01, 0], 'inOut'),
    key(1.15, R({ head: [-4, 0, 0], 'upperarm.L': [-150, 26, -36], 'forearm.L': [-110, 0, 0], 'hand.L': [-10, 0, 0] }), [0, -0.01, 0], 'inOut'),
    key(1.45, R({ head: [-12, 0, 0], neck: [-4, 0, 0], 'upperarm.L': [-160, 30, -20], 'forearm.L': [-150, 0, 0], 'hand.L': [20, 0, 0] }), [0, -0.01, 0], 'out'),
    key(2.0, R(), [0, -0.01, 0], 'inOut'),
  ],
};

/** "Kudakero": the blade raised upright before his face, then lowered. */
const kudakero: ClipDef = {
  name: 'az_kudakero', dur: 1.3, fadeIn: 0.1, fadeOut: 0.3, events: { shatter: 0.6 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@gripR': LOW.p, '@dirR': LOW.dir, '@edgeR': LOW.edge, '@poleR': LOW.pole, '@ikR': [1, 0, 0] } },
      { t: 0.4, ease: 'out', c: { '@gripR': [-0.08, 0.06, 0.34], '@dirR': [0.04, 0.98, 0.18], '@edgeR': [0, 0.18, -0.98], '@poleR': [-0.7, -0.5, -0.3], '@ikR': [1, 0, 0] } },
      { t: 0.9, ease: 'inOut', c: { '@gripR': [-0.08, 0.08, 0.34], '@dirR': [0.04, 0.98, 0.18], '@edgeR': [0, 0.18, -0.98], '@poleR': [-0.7, -0.5, -0.3], '@ikR': [1, 0, 0] } },
      { t: 1.3, ease: 'inOut', c: { '@gripR': LOW.p, '@dirR': LOW.dir, '@edgeR': LOW.edge, '@poleR': LOW.pole, '@ikR': [1, 0, 0] } },
    ],
    [key(0, R()), key(0.4, R({ head: [6, 0, 0] }), [0, -0.01, 0], 'out'), key(1.3, R(), [0, -0.01, 0], 'inOut')],
  ),
};

/** The Hōgyoku awakens: arms opened, head thrown back. */
const awaken: ClipDef = {
  name: 'az_awaken', dur: 2.2, fadeIn: 0.12, fadeOut: 0.35, events: { charge: 0.1, burst: 0.9 },
  keys: [
    key(0, R()),
    key(0.7, R({ spine: [8, 0, 0], chest: [10, 0, 0], head: [12, 0, 0], 'upperarm.L': [-6, 0, 20], 'forearm.L': [-40, 0, 0], 'upperarm.R': [-6, 0, -20], 'forearm.R': [-40, 0, 0] }), [0, -0.04, 0], 'inOut'),
    key(0.95, R({ spine: [-10, 0, 0], chest: [-14, 0, 0], head: [-24, 0, 0], 'upperarm.L': [-30, 0, 80], 'forearm.L': [-8, 0, 0], 'upperarm.R': [-30, 0, -80], 'forearm.R': [-8, 0, 0] }), [0, 0.02, 0], 'outExpo'),
    key(1.7, R({ spine: [-8, 0, 0], chest: [-12, 0, 0], head: [-20, 0, 0], 'upperarm.L': [-28, 0, 76], 'upperarm.R': [-28, 0, -76] }), [0, 0.02, 0], 'out'),
    key(2.2, R(), [0, -0.01, 0], 'inOut'),
  ],
};

/** Chrysalis strikes: the fused blade is the forearm — plain body keys. */
const CH = CHRYSALIS_STANCE.idle as Record<string, E>;
const C = (over: Record<string, E> = {}): Record<string, E> => ({ ...CH, ...over });
const slash = (name: string, side: 1 | -1): ClipDef => ({
  name, dur: 0.46, fadeIn: 0.04, fadeOut: 0.16, events: { step: 0.05, hit: 0.13, combo: 0.2 },
  keys: [
    key(0, C()),
    key(0.07, C({ chest: [0, 26 * side, 0], spine: [4, 10 * side, 0], 'upperarm.R': [-120, 0, side > 0 ? 60 : -80], 'forearm.R': [-50, 0, 0] }), [0, -0.04, -0.02], 'out'),
    key(0.13, C({ chest: [8, -28 * side, 0], spine: [6, -12 * side, 0], head: [-6, 14 * side, 0], 'upperarm.R': [-70, 0, side > 0 ? -60 : 40], 'forearm.R': [-6, 0, 0], 'thigh.L': [-30, 0, 4], 'shin.L': [30, 0, 0], 'thigh.R': [20, 0, -4] }), [0, -0.06, 0.1], 'outExpo'),
    key(0.46, C(), [0, -0.01, 0], 'inOut'),
  ],
});

export const AIZEN_CLIPS: ClipDef[] = [
  cut1, cut2, cut3, pass, finger, cast('az_kurohitsugi', 1.4, 0.35), cast('az_raikoho', 0.9, 0.28), dragons, reveal, kudakero, awaken,
  slash('az_ch1', 1), slash('az_ch2', -1),
  ...ICHIGO_CLIPS.filter((c) => c.name === 'dash' || c.name === 'airstep' || c.name === 'hit_heavy'),
];
export const AIZEN_CHAIN = ['az_cut1', 'az_cut2', 'az_cut3'];
export const CHRYSALIS_CHAIN = ['az_ch1', 'az_ch2', 'az_ch1', 'az_ch2'];
