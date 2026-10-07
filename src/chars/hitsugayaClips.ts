// Hitsugaya's animation set. A child swinging a nodachi longer than himself: the cuts are wide and fast,
// the body turns hard behind them, the long blade trails low when he runs. Arm targets are the adult arcs
// scaled to his reach (chest space, metres). The Shikai adds the dragon launch (a full swing from behind),
// the chain throw (the sword whirled overhead, the crescent flung) and the ground slash that sends an ice
// wave; the Bankai adds the tail spin, the wing buffet, the Ryūsenka thrust, the Senbi crescent, the
// icicle flock, the sword turned a quarter-circle to close Sennen Hyōrō, and the wing beat for flight.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });
/** shoulder-ish swing centre for his reach */
const SH: E = [-0.14, 0.13, 0.02];
const R0 = 0.26;

const IDLE: Record<string, E> = {
  hips: [0, -10, 0], spine: [4, 4, 0], chest: [2, 6, 0], head: [4, 2, 0],
  'thigh.L': [-12, 0, 6], 'shin.L': [14, 0, 0], 'foot.L': [-2, 0, 0],
  'thigh.R': [10, 0, -6], 'shin.R': [16, 0, 0], 'foot.R': [-8, 0, 0],
  'upperarm.L': [8, 0, 12], 'forearm.L': [-20, 0, 0], 'hand.L': [6, 0, 0],
};
const LOW = { p: [-0.18, -0.21, 0.13] as E, dir: [-0.12, -0.32, 0.94] as E, edge: [0.1, -0.92, -0.32] as E, pole: [-0.55, -0.3, -0.8] as E };

/** Sheathed: hands free, the sword on his back. */
export const HITSUGAYA_SHEATHED_STANCE: StanceDef = {
  idle: { ...IDLE, 'upperarm.R': [8, 0, -10], 'forearm.R': [-16, 0, 0] },
  idleHips: -0.02,
  run: { chest: [4, 0, 0] },
  sprint: { spine: [12, 0, 0], chest: [6, 0, 0], head: [-8, 0, 0], 'upperarm.L': [40, 0, 14], 'forearm.L': [-30, 0, 0], 'upperarm.R': [40, 0, -14], 'forearm.R': [-30, 0, 0] },
  swingL: 1,
  swingR: 1,
};

/** Hyōrinmaru drawn: one hand, the long blade low and forward; trailing behind when he runs. */
export const HITSUGAYA_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.025,
  run: { 'upperarm.L': [-6, 0, 4], chest: [0, 6, 0] },
  sprint: { spine: [12, 0, 0], 'upperarm.L': [14, 0, 10], 'forearm.L': [-30, 0, 0] },
  swingL: 1,
  swingR: 0.2,
  grip: {
    idle: LOW,
    walk: { ...LOW, p: [-0.19, -0.2, 0.1] },
    run: { p: [-0.21, -0.18, -0.04], dir: [-0.22, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.2, -0.11, -0.11], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.26, -0.06, 0.08], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

/** Bankai: the wings half open, the clawed left hand held out, the blade forward from the dragon's jaws. */
export const DAIGUREN_STANCE: StanceDef = {
  idle: { ...IDLE, 'upperarm.L': [-10, 0, 24], 'forearm.L': [-34, 0, 0], 'hand.L': [-10, 0, 0], 'wing.L': [0, 0, 0], 'wing.R': [0, 0, 0], 'tail.1': [-10, 0, 0] },
  idleHips: -0.02,
  run: { chest: [6, 0, 0], 'wing.L': [0, -10, -6], 'wing.R': [0, 10, 6] },
  sprint: { spine: [14, 0, 0], chest: [8, 0, 0], 'wing.L': [0, -24, -12], 'wing.R': [0, 24, 12], 'upperarm.L': [10, 0, 20] },
  swingL: 0.4,
  swingR: 0.2,
  grip: {
    idle: { p: [-0.19, -0.16, 0.16], dir: [-0.1, -0.12, 0.99], edge: [0.05, -0.99, -0.1], pole: [-0.6, -0.4, -0.7] },
    walk: { p: [-0.19, -0.16, 0.14], dir: [-0.12, -0.16, 0.98], edge: [0.05, -0.98, -0.16], pole: [-0.6, -0.4, -0.7] },
    run: { p: [-0.21, -0.18, -0.04], dir: [-0.22, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.2, -0.11, -0.11], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.24, -0.04, 0.1], dir: [-0.5, -0.2, 0.84], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

const R = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });

// ------------------------------------------------------------------ the string

/** 1: forehand horizontal cut, right → left, the whole body turning behind it. */
const cut1: ClipDef = {
  name: 'hg_cut1', dur: 0.56, fadeIn: 0.05, fadeOut: 0.2, events: { step: 0.07, hit: 0.14, combo: 0.24 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [1, -0.1, 0], c: SH, r: R0, pole: [-0.5, -0.65, -0.55],
      keys: [[0, -60, 'out'], [0.08, -125, 'out'], [0.14, 30, 'outExpo'], [0.26, 108, 'out'], [0.56, 70, 'inOut']],
    }),
    [
      key(0, R()),
      key(0.08, R({ hips: [0, -26, 0], spine: [2, -18, 0], chest: [-4, -26, 4], head: [0, 22, 0], 'thigh.L': [-14, 0, 6], 'thigh.R': [12, 0, -6], 'shin.R': [20, 0, 0] }), [0, -0.04, -0.02], 'out'),
      key(0.14, R({ hips: [0, 16, 0], spine: [8, 18, 0], chest: [6, 28, -4], head: [0, -20, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [28, 0, 0], 'thigh.R': [24, 0, -4], 'shin.R': [26, 0, 0], 'upperarm.L': [-10, 0, 30], 'forearm.L': [-30, 0, 0] }), [0, -0.06, 0.05], 'outExpo'),
      key(0.26, R({ hips: [0, 22, 0], spine: [10, 22, 0], chest: [8, 30, -4], head: [0, -24, 0], 'thigh.L': [-28, 0, 6], 'thigh.R': [22, 0, -4], 'upperarm.L': [-6, 0, 32], 'forearm.L': [-34, 0, 0] }), [0, -0.07, 0.06], 'out'),
      key(0.56, R(), [0, -0.025, 0], 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.3, 0, 0] } }],
  ),
};

/** 2: backhand rising diagonal, low left → high right. */
const cut2: ClipDef = {
  name: 'hg_cut2', dur: 0.56, fadeIn: 0.05, fadeOut: 0.2, events: { step: 0.06, hit: 0.14, combo: 0.24 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [-0.85, 0.52, 0], c: [-0.06, 0.08, 0.05], r: R0, pole: [-0.3, -0.4, -0.85],
      keys: [[0, -150, 'out'], [0.08, -122, 'out'], [0.14, 48, 'outExpo'], [0.28, 116, 'out'], [0.56, 70, 'inOut']],
    }),
    [
      key(0, R({ hips: [0, 18, 0], spine: [8, 16, 0], chest: [6, 24, -4] })),
      key(0.08, R({ hips: [0, 28, 0], spine: [10, 22, 6], chest: [10, 30, 8], 'thigh.L': [-20, 0, 8], 'shin.L': [30, 0, 0], 'thigh.R': [18, 0, -4], head: [4, -22, 0] }), [0, -0.07, 0], 'out'),
      key(0.14, R({ hips: [0, -20, 0], spine: [-2, -20, -4], chest: [-10, -30, -10], 'thigh.L': [-8, 0, 6], 'thigh.R': [-6, 0, -10], 'shin.R': [12, 0, 0], head: [-6, 24, 0], 'upperarm.L': [20, 0, 30] }), [0, -0.01, 0.04], 'outExpo'),
      key(0.28, R({ hips: [0, -24, 0], spine: [-4, -22, -4], chest: [-12, -32, -10], head: [-8, 26, 0], 'upperarm.L': [24, 0, 34] }), [0, 0, 0.05], 'out'),
      key(0.56, R(), [0, -0.025, 0], 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.3, 0, 0] } }],
  ),
};

/** 3: both hands, overhead, straight down — the long blade comes down far ahead of him. */
const cut3: ClipDef = {
  name: 'hg_cut3', dur: 0.78, fadeIn: 0.06, fadeOut: 0.24, events: { step: 0.18, hit: 0.26, fx: 0.26, combo: 0.4 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0, -1, 0], c: [-0.03, 0.15, 0.08], r: 0.28, pole: [-0.7, -0.2, -0.65],
      keys: [[0, 20, 'out'], [0.15, -148, 'out'], [0.21, -142, 'linear'], [0.26, 6, 'outExpo'], [0.4, 18, 'out'], [0.78, 40, 'inOut']],
      twoHand: [0.3, 1, 1, 1, 1, 0.2],
    }),
    [
      key(0, R()),
      key(0.15, R({ spine: [-12, 0, 0], chest: [-16, 4, 0], neck: [-6, 0, 0], head: [-10, 0, 0], 'thigh.L': [-6, 0, 4], 'thigh.R': [6, 0, -4], 'shin.L': [8, 0, 0] }), [0, 0.03, -0.02], 'out'),
      key(0.21, R({ spine: [-14, 0, 0], chest: [-18, 4, 0], head: [-12, 0, 0] }), [0, 0.035, -0.02], 'linear'),
      key(0.26, R({ hips: [8, 0, 0], spine: [24, 0, 0], chest: [20, 2, 0], neck: [6, 0, 0], head: [-14, 0, 0], 'thigh.L': [-46, 0, 6], 'shin.L': [50, 0, 0], 'foot.L': [-4, 0, 0], 'thigh.R': [26, 0, -4], 'shin.R': [30, 0, 0], 'foot.R': [-10, 0, 0] }), [0, -0.09, 0.08], 'outExpo'),
      key(0.4, R({ hips: [10, 0, 0], spine: [26, 0, 0], chest: [22, 2, 0], head: [-14, 0, 0], 'thigh.L': [-48, 0, 6], 'shin.L': [52, 0, 0], 'thigh.R': [28, 0, -4], 'shin.R': [32, 0, 0] }), [0, -0.1, 0.09], 'out'),
      key(0.78, R(), [0, -0.025, 0], 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.2, 0, 0] } }],
  ),
};

/** The thrust: a lunge onto the point (the Bankai's Ryūsenka blooms where it lands). */
const thrust: ClipDef = {
  name: 'hg_thrust', dur: 0.72, fadeIn: 0.04, fadeOut: 0.22, events: { step: 0.1, hit: 0.18, combo: 0.32 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@gripR': LOW.p, '@dirR': LOW.dir, '@edgeR': LOW.edge, '@poleR': LOW.pole, '@ikR': [1, 0, 0] } },
      { t: 0.1, ease: 'out', c: { '@gripR': [-0.17, 0.0, -0.1], '@dirR': [0.04, 0.02, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.8, -0.3, -0.3], '@ikR': [1, 0, 0], '@twoHand': [0.6, 0, 0] } },
      { t: 0.18, ease: 'outExpo', c: { '@gripR': [-0.04, 0.02, 0.4], '@dirR': [0.04, -0.02, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.7, -0.5, -0.2], '@ikR': [1, 0, 0], '@twoHand': [1, 0, 0] } },
      { t: 0.36, ease: 'out', c: { '@gripR': [-0.05, 0.02, 0.39], '@dirR': [0.04, -0.04, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.7, -0.5, -0.2], '@ikR': [1, 0, 0], '@twoHand': [1, 0, 0] } },
      { t: 0.72, ease: 'inOut', c: { '@gripR': LOW.p, '@dirR': LOW.dir, '@edgeR': LOW.edge, '@poleR': LOW.pole, '@ikR': [1, 0, 0], '@twoHand': [0, 0, 0] } },
    ],
    [
      key(0, R()),
      key(0.1, R({ hips: [0, -16, 0], chest: [0, -16, 0] }), [0, -0.02, -0.03], 'out'),
      key(0.18, R({ hips: [6, 16, 0], spine: [8, 10, 0], chest: [6, 14, 0], head: [-4, -14, 0], 'thigh.L': [-44, 0, 4], 'shin.L': [46, 0, 0], 'thigh.R': [26, 0, -4], 'shin.R': [16, 0, 0] }), [0, -0.07, 0.13], 'outExpo'),
      key(0.36, R({ hips: [6, 16, 0], spine: [8, 10, 0], chest: [6, 14, 0], head: [-4, -14, 0], 'thigh.L': [-42, 0, 4], 'shin.L': [44, 0, 0], 'thigh.R': [24, 0, -4], 'shin.R': [16, 0, 0] }), [0, -0.07, 0.12], 'out'),
      key(0.72, R(), [0, -0.025, 0], 'inOut'),
    ],
  ),
};

// ------------------------------------------------------------------ draw, release

/** The draw: the right hand goes over the shoulder to the hilt and brings the blade round to the front. */
const draw: ClipDef = {
  name: 'hg_draw', dur: 0.8, fadeIn: 0.06, fadeOut: 0.22, events: { draw: 0.3 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@ikR': [0, 0, 0] } },
      { t: 0.29, c: { '@ikR': [0, 0, 0] } },
      { t: 0.3, c: { '@gripR': [-0.12, 0.3, -0.12], '@dirR': [0.5, -0.8, -0.3], '@edgeR': [0, 0.3, -0.95], '@poleR': [-0.9, 0.2, -0.3], '@ikR': [1, 0, 0] } },
      { t: 0.46, ease: 'outExpo', c: { '@gripR': [-0.2, 0.05, 0.22], '@dirR': [-0.4, 0.2, 0.9], '@edgeR': [0, -1, 0.2], '@poleR': [-0.6, -0.5, -0.6], '@ikR': [1, 0, 0] } },
      { t: 0.8, ease: 'inOut', c: { '@gripR': LOW.p, '@dirR': LOW.dir, '@edgeR': LOW.edge, '@poleR': LOW.pole, '@ikR': [1, 0, 0] } },
    ],
    [
      key(0, { ...IDLE, 'upperarm.R': [8, 0, -10], 'forearm.R': [-16, 0, 0] }),
      key(0.26, R({ chest: [0, 10, 0], head: [0, -8, 0], 'upperarm.R': [-150, 0, -20], 'forearm.R': [-60, 0, 0], 'hand.R': [10, 0, 0] }), [0, -0.02, 0], 'out'),
      key(0.46, R({ hips: [0, 14, 0], chest: [4, 20, 0], head: [0, -14, 0], 'thigh.L': [-24, 0, 6], 'shin.L': [26, 0, 0], 'thigh.R': [16, 0, -6] }), [0, -0.05, 0.03], 'outExpo'),
      key(0.8, R(), [0, -0.025, 0], 'inOut'),
    ],
  ),
};

/** "Sōten ni zase, Hyōrinmaru": the blade raised to the sky, then brought round to point at the enemy. */
const shikai: ClipDef = {
  name: 'hg_shikai', dur: 1.6, fadeIn: 0.1, fadeOut: 0.3, events: { sky: 0.4, burst: 0.95 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@gripR': LOW.p, '@dirR': LOW.dir, '@edgeR': LOW.edge, '@poleR': LOW.pole, '@ikR': [1, 0, 0] } },
      { t: 0.4, ease: 'out', c: { '@gripR': [-0.12, 0.34, 0.06], '@dirR': [0.02, 1, 0.08], '@edgeR': [0, 0.08, -1], '@poleR': [-0.8, 0.1, -0.5], '@ikR': [1, 0, 0] } },
      { t: 0.85, ease: 'inOut', c: { '@gripR': [-0.12, 0.36, 0.06], '@dirR': [0.02, 1, 0.1], '@edgeR': [0, 0.1, -1], '@poleR': [-0.8, 0.1, -0.5], '@ikR': [1, 0, 0] } },
      { t: 0.95, ease: 'outExpo', c: { '@gripR': [-0.1, 0.06, 0.28], '@dirR': [0.05, 0.05, 1], '@edgeR': [0, -1, 0.05], '@poleR': [-0.6, -0.5, -0.6], '@ikR': [1, 0, 0] } },
      { t: 1.3, ease: 'out', c: { '@gripR': [-0.1, 0.05, 0.27], '@dirR': [0.05, 0.02, 1], '@edgeR': [0, -1, 0.02], '@poleR': [-0.6, -0.5, -0.6], '@ikR': [1, 0, 0] } },
      { t: 1.6, ease: 'inOut', c: { '@gripR': LOW.p, '@dirR': LOW.dir, '@edgeR': LOW.edge, '@poleR': LOW.pole, '@ikR': [1, 0, 0] } },
    ],
    [
      key(0, R()),
      key(0.4, R({ spine: [-8, 0, 0], chest: [-10, 0, 0], head: [-16, 0, 0], 'upperarm.L': [10, 0, 20] }), [0, 0.01, 0], 'out'),
      key(0.85, R({ spine: [-10, 0, 0], chest: [-12, 0, 0], head: [-20, 0, 0], 'upperarm.L': [12, 0, 22] }), [0, 0.01, 0], 'inOut'),
      key(0.95, R({ hips: [4, 10, 0], spine: [10, 8, 0], chest: [8, 10, 0], head: [-6, -10, 0], 'thigh.L': [-36, 0, 4], 'shin.L': [36, 0, 0], 'thigh.R': [20, 0, -4] }), [0, -0.05, 0.06], 'outExpo'),
      key(1.6, R(), [0, -0.025, 0], 'inOut'),
    ],
  ),
};

/** "Bankai": the blade held out level in both hands, then the burst of ice. */
const bankai: ClipDef = {
  name: 'hg_bankai', dur: 1.8, fadeIn: 0.1, fadeOut: 0.3, events: { charge: 0.2, burst: 0.9 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@gripR': LOW.p, '@dirR': LOW.dir, '@edgeR': LOW.edge, '@poleR': LOW.pole, '@ikR': [1, 0, 0] } },
      { t: 0.35, ease: 'out', c: { '@gripR': [-0.04, 0.02, 0.24], '@dirR': [0.2, 0.08, 0.97], '@edgeR': [0, -1, 0.08], '@poleR': [-0.7, -0.6, -0.3], '@ikR': [1, 0, 0], '@twoHand': [1, 0, 0] } },
      { t: 1.3, ease: 'inOut', c: { '@gripR': [-0.04, 0.03, 0.25], '@dirR': [0.2, 0.1, 0.97], '@edgeR': [0, -1, 0.1], '@poleR': [-0.7, -0.6, -0.3], '@ikR': [1, 0, 0], '@twoHand': [1, 0, 0] } },
      { t: 1.8, ease: 'inOut', c: { '@gripR': LOW.p, '@dirR': LOW.dir, '@edgeR': LOW.edge, '@poleR': LOW.pole, '@ikR': [1, 0, 0], '@twoHand': [0, 0, 0] } },
    ],
    [
      key(0, R()),
      key(0.35, R({ hips: [0, -6, 0], spine: [4, -4, 0], chest: [4, -6, 0], head: [6, 6, 0], 'thigh.L': [-20, 0, 8], 'shin.L': [24, 0, 0], 'thigh.R': [14, 0, -8], 'shin.R': [22, 0, 0] }), [0, -0.05, 0], 'out'),
      key(0.9, R({ hips: [-4, 0, 0], spine: [-8, 0, 0], chest: [-10, 0, 0], head: [-10, 0, 0], 'thigh.L': [-22, 0, 10], 'shin.L': [26, 0, 0], 'thigh.R': [16, 0, -10], 'shin.R': [24, 0, 0] }), [0, -0.06, 0], 'outExpo'),
      key(1.8, R(), [0, -0.025, 0], 'inOut'),
    ],
  ),
};

// ------------------------------------------------------------------ Shikai

/** The ice dragon: a full swing from behind and over, the point sent at the enemy as the dragon leaves it. */
const dragon: ClipDef = {
  name: 'hg_dragon', dur: 1.0, fadeIn: 0.06, fadeOut: 0.26, events: { step: 0.24, cast: 0.32 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0.5, -0.86, 0], c: [-0.05, 0.16, 0.06], r: 0.3, pole: [-0.75, -0.1, -0.65],
      keys: [[0, -40, 'out'], [0.24, -160, 'out'], [0.32, 10, 'outExpo'], [0.5, 22, 'out'], [1.0, 40, 'inOut']],
    }),
    [
      key(0, R()),
      key(0.24, R({ hips: [0, -30, 0], spine: [-6, -18, 0], chest: [-12, -26, 8], head: [-4, 26, 0], 'thigh.L': [-20, 0, 12], 'shin.L': [30, 0, 0], 'thigh.R': [16, 0, -10], 'shin.R': [30, 0, 0], 'upperarm.L': [-40, 0, 30], 'forearm.L': [-20, 0, 0] }), [0, -0.06, -0.03], 'out'),
      key(0.32, R({ hips: [6, 20, 0], spine: [16, 18, 0], chest: [18, 28, -10], head: [-12, -24, 0], 'thigh.L': [-42, 0, 12], 'shin.L': [42, 0, 0], 'thigh.R': [24, 0, -10], 'shin.R': [30, 0, 0], 'upperarm.L': [20, 0, 40], 'forearm.L': [-10, 0, 0] }), [0, -0.08, 0.07], 'outExpo'),
      key(0.5, R({ hips: [8, 22, 0], spine: [18, 20, 0], chest: [20, 30, -10], head: [-12, -26, 0] }), [0, -0.09, 0.08], 'out'),
      key(1.0, R(), [0, -0.025, 0], 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.5, 0, 0] } }, { t: 0.32, c: { '@look': [0.2, 0, 0] } }],
  ),
};

/** The chain: the sword whirled round overhead once, the crescent flung out at the enemy, then hauled back. */
const chain: ClipDef = {
  name: 'hg_chain', dur: 1.1, fadeIn: 0.06, fadeOut: 0.24, events: { throw: 0.36, pull: 0.7 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 1, 0.2], b: [1, 0, 0], c: [-0.08, 0.3, 0.02], r: 0.12, pole: [-0.6, 0.2, -0.6],
      keys: [[0, -90, 'in'], [0.18, 90, 'linear'], [0.36, 270, 'outExpo'], [0.7, 260, 'out'], [0.84, 240, 'inOut'], [1.1, 200, 'inOut']],
    }),
    [
      key(0, R()),
      key(0.18, R({ spine: [-4, 6, 0], chest: [-6, 10, 0], head: [-6, -6, 0], 'upperarm.L': [10, 0, 20] }), [0, -0.01, 0], 'linear'),
      key(0.36, R({ hips: [4, 16, 0], spine: [10, 14, 0], chest: [10, 20, 0], head: [-6, -14, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [30, 0, 0], 'thigh.R': [18, 0, -6], 'upperarm.L': [-60, 0, 10], 'forearm.L': [-10, 0, 0] }), [0, -0.04, 0.04], 'outExpo'),
      key(0.7, R({ hips: [-4, -10, 0], spine: [-6, -8, 0], chest: [-8, -10, 0], head: [2, 8, 0], 'thigh.L': [-10, 0, 6], 'thigh.R': [24, 0, -6], 'shin.R': [24, 0, 0], 'upperarm.L': [20, 0, 20], 'forearm.L': [-50, 0, 0] }), [0, -0.04, -0.03], 'out'),
      key(1.1, R(), [0, -0.025, 0], 'inOut'),
    ],
  ),
};

/** The ice wave: a low slash dragged along the ground and flung forward. */
const wave: ClipDef = {
  name: 'hg_wave', dur: 0.9, fadeIn: 0.06, fadeOut: 0.24, events: { step: 0.12, wave: 0.24 },
  keys: mergeKeys(
    swingKeys({
      a: [0, -0.6, 0.8], b: [1, -0.2, 0], c: [-0.04, -0.02, 0.1], r: 0.26, pole: [-0.5, -0.7, -0.4],
      keys: [[0, -60, 'out'], [0.12, -120, 'out'], [0.24, 40, 'outExpo'], [0.4, 90, 'out'], [0.9, 60, 'inOut']],
    }),
    [
      key(0, R()),
      key(0.12, R({ hips: [10, -24, 0], spine: [16, -16, 0], chest: [10, -20, 0], head: [-14, 18, 0], 'thigh.L': [-50, 0, 10], 'shin.L': [70, 0, 0], 'thigh.R': [20, 0, -10], 'shin.R': [60, 0, 0] }), [0, -0.12, 0], 'out'),
      key(0.24, R({ hips: [14, 18, 0], spine: [20, 16, 0], chest: [14, 24, 0], head: [-18, -18, 0], 'thigh.L': [-56, 0, 10], 'shin.L': [74, 0, 0], 'thigh.R': [30, 0, -10], 'shin.R': [50, 0, 0], 'upperarm.L': [10, 0, 40] }), [0, -0.14, 0.06], 'outExpo'),
      key(0.4, R({ hips: [12, 22, 0], spine: [18, 20, 0], chest: [12, 28, 0], head: [-16, -22, 0], 'thigh.L': [-54, 0, 10], 'shin.L': [72, 0, 0], 'thigh.R': [28, 0, -10], 'shin.R': [48, 0, 0], 'upperarm.L': [12, 0, 44] }), [0, -0.14, 0.07], 'out'),
      key(0.9, R(), [0, -0.025, 0], 'inOut'),
    ],
  ),
};

// ------------------------------------------------------------------ Bankai

/** Bankai string: wide cuts from the dragon's jaws (the clawed left hand reaching through behind them). */
const b1: ClipDef = { ...cut1, name: 'hg_b1', events: { step: 0.07, hit: 0.14, combo: 0.22 } };
const b2: ClipDef = { ...cut2, name: 'hg_b2', events: { step: 0.06, hit: 0.14, combo: 0.22 } };

/** The claw: a raking left-hand swipe. */
const claw: ClipDef = {
  name: 'hg_claw', dur: 0.56, fadeIn: 0.04, fadeOut: 0.2, events: { step: 0.06, hit: 0.15, combo: 0.24 },
  keys: [
    key(0, R()),
    key(0.08, R({ hips: [0, 20, 0], spine: [4, 16, 0], chest: [4, 24, 0], head: [0, -16, 0], 'upperarm.L': [-110, 0, 50], 'forearm.L': [-50, 0, 0], 'hand.L': [-20, 0, 0] }), [0, -0.03, -0.02], 'out'),
    key(0.15, R({ hips: [0, -22, 0], spine: [8, -18, 0], chest: [8, -28, 0], head: [0, 20, 0], 'upperarm.L': [-70, 0, -30], 'forearm.L': [-10, 0, 0], 'hand.L': [10, 0, 0], 'thigh.L': [-34, 0, 6], 'shin.L': [34, 0, 0], 'thigh.R': [20, 0, -6] }), [0, -0.05, 0.08], 'outExpo'),
    key(0.56, R(), [0, -0.025, 0], 'inOut'),
  ],
};

/** The tail: a full spin, the ice tail sweeping everything round him. */
const tail: ClipDef = {
  name: 'hg_tail', dur: 0.8, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.06, hit: 0.24 },
  keys: mergeKeys(
    [
      key(0, R()),
      key(0.08, R({ hips: [10, -20, 0], spine: [14, -10, 0], chest: [10, -10, 0], 'thigh.L': [-30, 0, 12], 'shin.L': [40, 0, 0], 'thigh.R': [20, 0, -12], 'shin.R': [36, 0, 0], 'tail.1': [-30, 30, 0], 'tail.2': [0, 20, 0] }), [0, -0.1, 0], 'out'),
      key(0.4, R({ hips: [12, 10, 0], spine: [14, 10, 0], chest: [10, 10, 0], 'thigh.L': [-30, 0, 12], 'shin.L': [40, 0, 0], 'thigh.R': [20, 0, -12], 'shin.R': [36, 0, 0], 'tail.1': [-50, -40, 0], 'tail.2': [-10, -30, 0], 'tail.3': [0, -20, 0] }), [0, -0.11, 0], 'linear'),
      key(0.8, R(), [0, -0.025, 0], 'inOut'),
    ],
    [
      { t: 0, c: { '@spin': [0, 0, 0] } },
      { t: 0.08, c: { '@spin': [-20, 0, 0] }, ease: 'out' },
      { t: 0.42, c: { '@spin': [360, 0, 0] }, ease: 'inOut' },
      { t: 0.8, c: { '@spin': [360, 0, 0] } },
    ],
  ),
};

/** Hyōryū Senbi: one straight vertical swing — the cut overflows into a crescent of ice. */
const senbi: ClipDef = { ...cut3, name: 'hg_senbi', events: { step: 0.18, hit: 0.26, cast: 0.27 } };

/** Gunchō Tsurara: the blade raised while the icicles form, then a sweeping arc that launches them. */
const tsurara: ClipDef = {
  name: 'hg_tsurara', dur: 1.2, fadeIn: 0.08, fadeOut: 0.26, events: { form: 0.15, launch: 0.62 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0.9, 0.45, 0], c: SH, r: 0.28, pole: [-0.6, -0.4, -0.6],
      keys: [[0, -60, 'out'], [0.4, -150, 'out'], [0.52, -146, 'linear'], [0.62, 40, 'outExpo'], [0.8, 90, 'out'], [1.2, 70, 'inOut']],
    }),
    [
      key(0, R()),
      key(0.4, R({ hips: [0, -26, 0], spine: [-4, -16, 0], chest: [-8, -24, 6], head: [-6, 22, 0], 'upperarm.L': [-30, 0, 40], 'forearm.L': [-30, 0, 0] }), [0, -0.02, 0], 'out'),
      key(0.62, R({ hips: [0, 22, 0], spine: [8, 18, 0], chest: [6, 30, -4], head: [-4, -22, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [30, 0, 0], 'thigh.R': [22, 0, -4], 'upperarm.L': [0, 0, 40] }), [0, -0.05, 0.05], 'outExpo'),
      key(1.2, R(), [0, -0.025, 0], 'inOut'),
    ],
  ),
};

/** Sennen Hyōrō: the blade held out level, then turned a quarter-circle counter-clockwise — the pillars close. */
const hyoro: ClipDef = {
  name: 'hg_hyoro', dur: 1.6, fadeIn: 0.1, fadeOut: 0.3, events: { rise: 0.2, turn: 1.0 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@gripR': LOW.p, '@dirR': LOW.dir, '@edgeR': LOW.edge, '@poleR': LOW.pole, '@ikR': [1, 0, 0] } },
      { t: 0.3, ease: 'out', c: { '@gripR': [-0.08, 0.06, 0.26], '@dirR': [0.05, 0.02, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.7, -0.5, -0.4], '@ikR': [1, 0, 0] } },
      { t: 0.95, ease: 'inOut', c: { '@gripR': [-0.08, 0.06, 0.26], '@dirR': [0.05, 0.02, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.7, -0.5, -0.4], '@ikR': [1, 0, 0] } },
      { t: 1.1, ease: 'outExpo', c: { '@gripR': [-0.08, 0.06, 0.26], '@dirR': [0.05, 0.02, 1], '@edgeR': [1, 0, 0], '@poleR': [-0.7, -0.5, -0.4], '@ikR': [1, 0, 0] } },
      { t: 1.6, ease: 'inOut', c: { '@gripR': LOW.p, '@dirR': LOW.dir, '@edgeR': LOW.edge, '@poleR': LOW.pole, '@ikR': [1, 0, 0] } },
    ],
    [
      key(0, R()),
      key(0.3, R({ hips: [0, -6, 0], spine: [4, -6, 0], chest: [2, -8, 0], head: [4, 6, 0], 'thigh.L': [-20, 0, 8], 'shin.L': [22, 0, 0], 'thigh.R': [14, 0, -8], 'shin.R': [20, 0, 0], 'upperarm.L': [-20, 0, 30], 'forearm.L': [-40, 0, 0] }), [0, -0.04, 0], 'out'),
      key(1.1, R({ hips: [0, -10, 0], spine: [4, -10, 0], chest: [2, -12, 0], head: [6, 10, 0], 'thigh.L': [-22, 0, 8], 'shin.L': [24, 0, 0], 'thigh.R': [16, 0, -8], 'shin.R': [22, 0, 0], 'upperarm.L': [-20, 0, 30], 'forearm.L': [-40, 0, 0] }), [0, -0.05, 0], 'outExpo'),
      key(1.6, R(), [0, -0.025, 0], 'inOut'),
    ],
  ),
};

/** Hyōten Hyakkasō: the blade raised to the sky, the cloud opening above. */
const hyakkaso: ClipDef = {
  ...shikai, name: 'hg_hyakkaso', events: { sky: 0.4, snow: 0.9 },
};

/** Flight: the wings beat (loop). */
const flap: ClipDef = {
  name: 'hg_flap', dur: 0.7, loop: true, fadeIn: 0.2, fadeOut: 0.3,
  weights: { 'wing.L': 1, 'wing.R': 1, 'tail.1': 0.6 },
  keys: [
    { t: 0, b: { 'wing.L': [0, 0, 22], 'wing.R': [0, 0, -22], 'tail.1': [-6, 0, 0] }, ease: 'inOut' },
    { t: 0.35, b: { 'wing.L': [10, 0, -30], 'wing.R': [10, 0, 30], 'tail.1': [6, 0, 0] }, ease: 'inOut' },
    { t: 0.7, b: { 'wing.L': [0, 0, 22], 'wing.R': [0, 0, -22], 'tail.1': [-6, 0, 0] }, ease: 'inOut' },
  ],
};

/** The wing buffet: both wings swept forward round him. */
const buffet: ClipDef = {
  name: 'hg_buffet', dur: 0.8, fadeIn: 0.06, fadeOut: 0.24, events: { step: 0.1, hit: 0.24 },
  keys: [
    key(0, R()),
    { t: 0.14, b: { ...IDLE, chest: [-10, 0, 0], 'wing.L': [0, 30, 30], 'wing.R': [0, -30, -30] }, hips: [0, -0.02, 0], ease: 'out' },
    { t: 0.26, b: { ...IDLE, chest: [12, 0, 0], spine: [10, 0, 0], 'wing.L': [0, -70, -10], 'wing.R': [0, 70, 10] }, hips: [0, -0.04, 0.04], ease: 'outExpo' },
    { t: 0.8, b: { ...IDLE, 'wing.L': [0, 0, 0], 'wing.R': [0, 0, 0] }, hips: [0, -0.025, 0], ease: 'inOut' },
  ],
};

export const HITSUGAYA_CLIPS: ClipDef[] = [
  cut1, cut2, cut3, thrust, draw, shikai, bankai, dragon, chain, wave, b1, b2, claw, tail, senbi, tsurara, hyoro, hyakkaso, flap, buffet,
  ...ICHIGO_CLIPS.filter((c) => c.name === 'dash' || c.name === 'airstep' || c.name === 'hit_heavy'),
];
export const HITSUGAYA_CHAIN = ['hg_cut1', 'hg_cut2', 'hg_cut3'];
export const DAIGUREN_CHAIN = ['hg_b1', 'hg_claw', 'hg_b2', 'hg_tail'];
