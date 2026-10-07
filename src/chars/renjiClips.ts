// Renji's animation set. Sealed: the rough 11th-Division cuts (shared with Ichigo's sword arcs). Shikai:
// lashes — the whole arm thrown into a long arc that flings the segments out, a sidearm curl for the
// blind-angle strike, a thrust and yank for the constriction, the blade whirled overhead, the overhead
// full-reach lash; "Hoero, Zabimaru" with the left hand drawn along the blade. Bankai: the bone handle
// raised, swung and brought down as the snake strikes; braced for Hikotsu Taihō.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { ICHIGO_CLIPS, ICHIGO_STANCE } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });
const SH: E = [-0.21, 0.17, 0.02];

/** A cocky forward lean, sword low in the right hand. */
export const RENJI_STANCE: StanceDef = {
  ...ICHIGO_STANCE,
  idle: { ...ICHIGO_STANCE.idle, spine: [6, 4, 0], chest: [4, 10, 0], head: [-2, 4, 0], 'upperarm.L': [10, 0, 16], 'forearm.L': [-26, 0, 0] },
};

const IDLE = RENJI_STANCE.idle as Record<string, E>;
const R = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });

/** Bankai: the bone handle held up and forward in the right hand, the snake rising behind him. */
export const HIHIO_STANCE: StanceDef = {
  ...ICHIGO_STANCE,
  idle: { ...IDLE, chest: [-2, 6, 0], 'upperarm.L': [-20, 0, 24], 'forearm.L': [-40, 0, 0] },
  swingR: 0.1,
  grip: {
    idle: { p: [-0.26, -0.06, 0.22], dir: [-0.1, 0.62, 0.78], edge: [0, 0.78, -0.62], pole: [-0.7, -0.5, -0.4] },
    walk: { p: [-0.26, -0.06, 0.2], dir: [-0.1, 0.62, 0.78], edge: [0, 0.78, -0.62], pole: [-0.7, -0.5, -0.4] },
    run: { p: [-0.28, -0.02, 0.1], dir: [-0.1, 0.8, 0.58], edge: [0, 0.58, -0.8], pole: [-0.8, -0.3, 0.3] },
    sprint: { p: [-0.28, 0.02, 0.02], dir: [-0.1, 0.9, 0.4], edge: [0, 0.4, -0.9], pole: [-0.8, -0.3, 0.3] },
    air: { p: [-0.3, 0.02, 0.15], dir: [-0.2, 0.7, 0.68], edge: [0, 0.68, -0.7], pole: [-0.5, -0.6, -0.5] },
  },
};

// ------------------------------------------------------------------ Shikai lashes

/** 1: a forehand lash, right to left, the arm thrown wide. */
const lash1: ClipDef = {
  name: 'rj_lash1', dur: 0.66, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.06, lash: 0.13, back: 0.36, combo: 0.36 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [1, -0.05, 0], c: SH, r: 0.42, pole: [-0.4, -0.7, -0.5],
      keys: [[0, -70, 'out'], [0.09, -135, 'out'], [0.16, 20, 'outExpo'], [0.34, 100, 'out'], [0.66, 70, 'inOut']],
    }),
    [
      key(0, R()),
      key(0.09, R({ hips: [0, -28, 0], spine: [2, -20, 0], chest: [-4, -30, 4], head: [0, 22, 0], 'thigh.L': [-14, 0, 6], 'thigh.R': [12, 0, -6], 'shin.R': [20, 0, 0], 'upperarm.L': [-20, 0, 40] }), [0, -0.05, -0.02], 'out'),
      key(0.16, R({ hips: [0, 18, 0], spine: [8, 20, 0], chest: [6, 32, -4], head: [0, -22, 0], 'thigh.L': [-32, 0, 6], 'shin.L': [28, 0, 0], 'thigh.R': [24, 0, -4], 'shin.R': [26, 0, 0], 'upperarm.L': [10, 0, 30], 'forearm.L': [-30, 0, 0] }), [0, -0.08, 0.06], 'outExpo'),
      key(0.34, R({ hips: [0, 24, 0], spine: [10, 22, 0], chest: [8, 34, -4], head: [0, -26, 0], 'thigh.L': [-30, 0, 6], 'thigh.R': [22, 0, -4], 'upperarm.L': [12, 0, 32], 'forearm.L': [-34, 0, 0] }), [0, -0.09, 0.07], 'out'),
      key(0.66, R(), [0, -0.035, 0], 'inOut'),
    ],
  ),
};

/** 2: a backhand rising lash. */
const lash2: ClipDef = {
  name: 'rj_lash2', dur: 0.66, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.06, lash: 0.14, back: 0.38, combo: 0.38 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [-0.85, 0.52, 0], c: [-0.08, 0.1, 0.06], r: 0.42, pole: [-0.3, -0.4, -0.85],
      keys: [[0, -150, 'out'], [0.09, -125, 'out'], [0.16, 50, 'outExpo'], [0.34, 120, 'out'], [0.66, 70, 'inOut']],
    }),
    [
      key(0, R({ hips: [0, 18, 0], spine: [8, 16, 0], chest: [6, 24, -4] })),
      key(0.09, R({ hips: [0, 28, 0], spine: [10, 22, 6], chest: [10, 32, 8], 'thigh.L': [-20, 0, 8], 'shin.L': [30, 0, 0], 'thigh.R': [18, 0, -4], head: [4, -22, 0] }), [0, -0.1, 0], 'out'),
      key(0.16, R({ hips: [0, -22, 0], spine: [-2, -22, -4], chest: [-12, -32, -10], 'thigh.L': [-8, 0, 6], 'thigh.R': [-6, 0, -10], 'shin.R': [12, 0, 0], head: [-6, 24, 0], 'upperarm.L': [20, 0, 34] }), [0, -0.02, 0.05], 'outExpo'),
      key(0.34, R({ hips: [0, -26, 0], spine: [-4, -24, -4], chest: [-14, -34, -10], head: [-8, 26, 0], 'upperarm.L': [24, 0, 36] }), [0, -0.01, 0.06], 'out'),
      key(0.66, R(), [0, -0.035, 0], 'inOut'),
    ],
  ),
};

/** 3: the overhead whip slam. */
const lash3: ClipDef = {
  name: 'rj_lash3', dur: 0.8, fadeIn: 0.06, fadeOut: 0.24, events: { step: 0.16, lash: 0.24, back: 0.5, combo: 0.48 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0, -1, 0], c: [-0.06, 0.24, 0.1], r: 0.42, pole: [-0.7, -0.2, -0.65],
      keys: [[0, 20, 'out'], [0.16, -150, 'out'], [0.2, -146, 'linear'], [0.26, 10, 'outExpo'], [0.46, 26, 'out'], [0.8, 40, 'inOut']],
    }),
    [
      key(0, R()),
      key(0.16, R({ spine: [-12, 0, 0], chest: [-18, 6, 0], head: [-12, 0, 0], 'upperarm.L': [-60, 0, 20], 'forearm.L': [-30, 0, 0] }), [0, 0.03, -0.03], 'out'),
      key(0.26, R({ hips: [8, 0, 0], spine: [22, 0, 0], chest: [20, 4, 0], head: [-14, 0, 0], 'thigh.L': [-46, 0, 6], 'shin.L': [50, 0, 0], 'thigh.R': [26, 0, -4], 'shin.R': [30, 0, 0], 'upperarm.L': [10, 0, 30] }), [0, -0.12, 0.1], 'outExpo'),
      key(0.46, R({ hips: [10, 0, 0], spine: [24, 0, 0], chest: [22, 4, 0], head: [-14, 0, 0], 'thigh.L': [-48, 0, 6], 'shin.L': [52, 0, 0], 'thigh.R': [28, 0, -4], 'shin.R': [32, 0, 0] }), [0, -0.13, 0.11], 'out'),
      key(0.8, R(), [0, -0.035, 0], 'inOut'),
    ],
  ),
};

/** The full-reach lash: a long wind-up overhead, the whole body behind the throw. */
const reach: ClipDef = {
  ...lash3, name: 'rj_reach', dur: 1.1,
  events: { step: 0.36, lash: 0.44, back: 0.9 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0.35, -0.94, 0], c: [-0.06, 0.26, 0.08], r: 0.44, pole: [-0.75, -0.1, -0.65],
      keys: [[0, -40, 'out'], [0.34, -165, 'out'], [0.4, -160, 'linear'], [0.46, 14, 'outExpo'], [0.7, 30, 'out'], [1.1, 40, 'inOut']],
    }),
    [
      key(0, R()),
      key(0.34, R({ hips: [0, -26, 0], spine: [-10, -14, 0], chest: [-16, -20, 8], head: [-6, 22, 0], 'thigh.L': [-20, 0, 12], 'shin.L': [30, 0, 0], 'thigh.R': [16, 0, -10], 'shin.R': [30, 0, 0], 'upperarm.L': [-50, 0, 30], 'forearm.L': [-20, 0, 0] }), [0, -0.06, -0.04], 'out'),
      key(0.46, R({ hips: [10, 16, 0], spine: [24, 14, 0], chest: [22, 22, -8], head: [-14, -20, 0], 'thigh.L': [-50, 0, 10], 'shin.L': [52, 0, 0], 'thigh.R': [28, 0, -8], 'shin.R': [32, 0, 0], 'upperarm.L': [20, 0, 40] }), [0, -0.14, 0.12], 'outExpo'),
      key(0.7, R({ hips: [12, 18, 0], spine: [26, 16, 0], chest: [24, 24, -8], head: [-16, -22, 0] }), [0, -0.15, 0.13], 'out'),
      key(1.1, R(), [0, -0.035, 0], 'inOut'),
    ],
  ),
};

/** The blind-angle lash: a sidearm throw that curls the whip round behind the target. */
const curve: ClipDef = {
  name: 'rj_curve', dur: 0.8, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.06, lash: 0.16, back: 0.5 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [1, 0.1, 0], c: [-0.24, 0.12, 0.02], r: 0.46, pole: [-0.3, -0.9, -0.2],
      keys: [[0, -80, 'out'], [0.1, -150, 'out'], [0.18, -10, 'outExpo'], [0.4, 60, 'out'], [0.8, 70, 'inOut']],
    }),
    [
      key(0, R()),
      key(0.1, R({ hips: [0, -32, 0], spine: [4, -20, -6], chest: [0, -30, -8], head: [0, 26, 0], 'upperarm.L': [0, 0, 40] }), [0, -0.06, 0], 'out'),
      key(0.18, R({ hips: [0, 20, 0], spine: [6, 18, 8], chest: [4, 30, 10], head: [0, -24, 0], 'thigh.L': [-26, 0, 8], 'shin.L': [24, 0, 0], 'thigh.R': [20, 0, -6], 'upperarm.L': [10, 0, 30] }), [0, -0.07, 0.04], 'outExpo'),
      key(0.8, R(), [0, -0.035, 0], 'inOut'),
    ],
  ),
};

/** The constriction: a thrust that sends the whip round the target, then a hard pull. */
const wrap: ClipDef = {
  name: 'rj_wrap', dur: 1.1, fadeIn: 0.05, fadeOut: 0.24, events: { step: 0.08, lash: 0.15, pull: 0.62 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@gripR': [-0.27, -0.31, 0.2], '@dirR': [-0.12, -0.5, 0.86], '@edgeR': [0.1, -0.85, -0.5], '@poleR': [-0.55, -0.3, -0.8], '@ikR': [1, 0, 0] } },
      { t: 0.1, ease: 'out', c: { '@gripR': [-0.26, 0, -0.12], '@dirR': [0.05, 0.02, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.8, -0.3, -0.3], '@ikR': [1, 0, 0] } },
      { t: 0.17, ease: 'outExpo', c: { '@gripR': [-0.06, 0.04, 0.56], '@dirR': [0.05, -0.02, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.7, -0.5, -0.2], '@ikR': [1, 0, 0] } },
      { t: 0.55, ease: 'inOut', c: { '@gripR': [-0.08, 0.04, 0.5], '@dirR': [0.05, -0.02, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.7, -0.5, -0.2], '@ikR': [1, 0, 0] } },
      { t: 0.66, ease: 'outExpo', c: { '@gripR': [-0.3, 0.1, -0.1], '@dirR': [-0.2, 0.4, 0.9], '@edgeR': [0, -0.9, 0.4], '@poleR': [-0.8, -0.3, 0.2], '@ikR': [1, 0, 0] } },
      { t: 1.1, ease: 'inOut', c: { '@gripR': [-0.27, -0.31, 0.2], '@dirR': [-0.12, -0.5, 0.86], '@edgeR': [0.1, -0.85, -0.5], '@poleR': [-0.55, -0.3, -0.8], '@ikR': [1, 0, 0] } },
    ],
    [
      key(0, R()),
      key(0.17, R({ hips: [4, 14, 0], spine: [8, 10, 0], chest: [6, 14, 0], head: [-4, -14, 0], 'thigh.L': [-40, 0, 4], 'shin.L': [44, 0, 0], 'thigh.R': [24, 0, -4], 'shin.R': [14, 0, 0] }), [0, -0.08, 0.14], 'outExpo'),
      key(0.66, R({ hips: [-6, -16, 0], spine: [-10, -12, 0], chest: [-12, -16, 0], head: [6, 12, 0], 'thigh.L': [-6, 0, 6], 'thigh.R': [30, 0, -6], 'shin.R': [30, 0, 0] }), [0, -0.06, -0.08], 'outExpo'),
      key(1.1, R(), [0, -0.035, 0], 'inOut'),
    ],
  ),
};

/** The whirlwind: the blade whirled overhead, three full turns. */
const spin: ClipDef = {
  name: 'rj_spin', dur: 1.5, fadeIn: 0.1, fadeOut: 0.3, events: { spin: 0.12, stop: 1.25 },
  keys: mergeKeys(
    swingKeys({
      a: [1, 0, 0], b: [0, 0, 1], c: [-0.1, 0.42, 0.02], r: 0.16, tilt: 0.25, pole: [-0.6, 0.3, -0.5],
      keys: [[0, -90, 'in'], [0.12, 0, 'linear'], [0.5, 360, 'linear'], [0.88, 720, 'linear'], [1.25, 1080, 'out'], [1.5, 1100, 'inOut']],
    }),
    [
      key(0, R()),
      key(0.12, R({ spine: [-6, 0, 0], chest: [-8, 0, 0], head: [-10, 0, 0], 'upperarm.L': [10, 0, 30] }), [0, -0.04, 0], 'out'),
      key(1.25, R({ spine: [-6, 0, 0], chest: [-8, 0, 0], head: [-10, 0, 0], 'upperarm.L': [10, 0, 30] }), [0, -0.04, 0], 'linear'),
      key(1.5, R(), [0, -0.035, 0], 'inOut'),
    ],
  ),
};

/** "Hoero, Zabimaru": the left hand runs along the blade, then the first lash. */
const shikai: ClipDef = {
  name: 'rj_shikai', dur: 1.5, fadeIn: 0.1, fadeOut: 0.3, events: { howl: 0.5, burst: 0.62 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@gripR': [-0.27, -0.31, 0.2], '@dirR': [-0.12, -0.5, 0.86], '@edgeR': [0.1, -0.85, -0.5], '@poleR': [-0.55, -0.3, -0.8], '@ikR': [1, 0, 0] } },
      { t: 0.3, ease: 'out', c: { '@gripR': [-0.16, 0.12, 0.22], '@dirR': [0.7, 0.3, 0.65], '@edgeR': [0, -1, 0], '@poleR': [-0.7, -0.6, -0.3], '@ikR': [1, 0, 0] } },
      { t: 0.55, ease: 'inOut', c: { '@gripR': [-0.18, 0.12, 0.2], '@dirR': [0.72, 0.3, 0.62], '@edgeR': [0, -1, 0], '@poleR': [-0.7, -0.6, -0.3], '@ikR': [1, 0, 0] } },
      { t: 0.68, ease: 'outExpo', c: { '@gripR': [-0.3, 0.1, 0.24], '@dirR': [-0.6, 0.1, 0.8], '@edgeR': [0, -1, 0], '@poleR': [-0.5, -0.6, -0.6], '@ikR': [1, 0, 0] } },
      { t: 1.5, ease: 'inOut', c: { '@gripR': [-0.27, -0.31, 0.2], '@dirR': [-0.12, -0.5, 0.86], '@edgeR': [0.1, -0.85, -0.5], '@poleR': [-0.55, -0.3, -0.8], '@ikR': [1, 0, 0] } },
    ],
    [
      key(0, R()),
      key(0.3, R({ chest: [0, -20, 0], head: [0, 10, 0], 'upperarm.L': [-70, 0, -10], 'forearm.L': [-50, 0, 0], 'hand.L': [-10, 0, 0] }), [0, -0.03, 0], 'out'),
      key(0.55, R({ chest: [0, -10, 0], head: [0, 6, 0], 'upperarm.L': [-80, 0, 30], 'forearm.L': [-6, 0, 0], 'hand.L': [-10, 0, 0] }), [0, -0.03, 0], 'inOut'),
      key(0.68, R({ hips: [0, 18, 0], chest: [6, 28, 0], head: [0, -18, 0], 'upperarm.L': [10, 0, 34], 'thigh.L': [-30, 0, 6], 'shin.L': [26, 0, 0] }), [0, -0.07, 0.05], 'outExpo'),
      key(1.5, R(), [0, -0.035, 0], 'inOut'),
    ],
  ),
};

/** Bankai: arms flung wide, head back, the roar of reiatsu. */
const bankai: ClipDef = {
  name: 'rj_bankai', dur: 2.0, fadeIn: 0.1, fadeOut: 0.3, events: { charge: 0.1, burst: 0.9 },
  keys: [
    key(0, R()),
    key(0.7, R({ spine: [8, 0, 0], chest: [10, 0, 0], head: [10, 0, 0], 'upperarm.L': [-10, 0, 30], 'forearm.L': [-50, 0, 0] }), [0, -0.06, 0], 'inOut'),
    key(0.95, R({ spine: [-10, 0, 0], chest: [-14, 0, 0], head: [-26, 0, 0], 'upperarm.L': [-30, 0, 80], 'forearm.L': [-6, 0, 0] }), [0, 0.02, 0], 'outExpo'),
    key(1.6, R({ spine: [-8, 0, 0], chest: [-12, 0, 0], head: [-20, 0, 0], 'upperarm.L': [-28, 0, 76] }), [0, 0.02, 0], 'out'),
    key(2.0, R(), [0, -0.035, 0], 'inOut'),
  ],
};

/** Shakkahō from the left palm. */
const cast: ClipDef = {
  name: 'rj_cast', dur: 0.8, fadeIn: 0.05, fadeOut: 0.24, events: { cast: 0.24 },
  keys: [
    key(0, R()),
    key(0.2, R({ chest: [0, -18, 0], spine: [0, -6, 0], head: [0, 12, 0], 'upperarm.L': [-88, 0, -8], 'forearm.L': [-8, 0, 0], 'hand.L': [-60, 0, 0] }), [0, -0.02, 0], 'out'),
    key(0.26, R({ chest: [-2, -20, 0], spine: [0, -6, 0], head: [0, 12, 0], 'upperarm.L': [-92, 0, -8], 'forearm.L': [-4, 0, 0], 'hand.L': [-70, 0, 0] }), [0, -0.02, -0.03], 'outExpo'),
    key(0.8, R(), [0, -0.035, 0], 'inOut'),
  ],
};

/** The full chant: the left palm held out a long breath while the fire gathers in it, then loosed. */
const chant: ClipDef = {
  name: 'rj_chant', dur: 1.7, fadeIn: 0.12, fadeOut: 0.3, events: { gather: 0.15, cast: 1.15 },
  keys: [
    key(0, R()),
    key(0.3, R({ chest: [0, -16, 0], spine: [2, -6, 0], head: [-2, 12, 0], 'upperarm.L': [-84, 0, -6], 'forearm.L': [-10, 0, 0], 'hand.L': [-64, 0, 0], 'thigh.L': [-24, 0, 8], 'shin.L': [26, 0, 0], 'thigh.R': [16, 0, -8], 'shin.R': [20, 0, 0] }), [0, -0.07, 0], 'out'),
    key(1.1, R({ chest: [2, -18, 0], spine: [4, -6, 0], head: [-2, 12, 0], 'upperarm.L': [-88, 0, -8], 'forearm.L': [-6, 0, 0], 'hand.L': [-70, 0, 0], 'thigh.L': [-24, 0, 8], 'shin.L': [26, 0, 0], 'thigh.R': [16, 0, -8], 'shin.R': [20, 0, 0] }), [0, -0.08, 0], 'inOut'),
    key(1.2, R({ chest: [-6, -22, 0], spine: [-2, -8, 0], head: [-6, 14, 0], 'upperarm.L': [-96, 0, -8], 'forearm.L': [-2, 0, 0], 'hand.L': [-76, 0, 0], 'thigh.L': [-14, 0, 8], 'thigh.R': [22, 0, -8], 'shin.R': [28, 0, 0] }), [0, -0.06, -0.06], 'outExpo'),
    key(1.7, R(), [0, -0.035, 0], 'inOut'),
  ],
};

// ------------------------------------------------------------------ Bankai

/** The snake sent forward: the handle cracked down and forward like a whip. */
const command: ClipDef = {
  name: 'rj_command', dur: 0.8, fadeIn: 0.05, fadeOut: 0.24, events: { step: 0.08, strike: 0.2, combo: 0.4 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@gripR': HIHIO_STANCE.grip!.idle.p, '@dirR': HIHIO_STANCE.grip!.idle.dir, '@edgeR': HIHIO_STANCE.grip!.idle.edge, '@poleR': HIHIO_STANCE.grip!.idle.pole, '@ikR': [1, 0, 0] } },
      { t: 0.12, ease: 'out', c: { '@gripR': [-0.24, 0.3, -0.05], '@dirR': [0, 0.9, -0.4], '@edgeR': [0, -0.4, -0.9], '@poleR': [-0.8, -0.2, -0.4], '@ikR': [1, 0, 0] } },
      { t: 0.22, ease: 'outExpo', c: { '@gripR': [-0.18, -0.1, 0.42], '@dirR': [0, 0.2, 1], '@edgeR': [0, 1, -0.2], '@poleR': [-0.7, -0.5, -0.4], '@ikR': [1, 0, 0] } },
      { t: 0.8, ease: 'inOut', c: { '@gripR': HIHIO_STANCE.grip!.idle.p, '@dirR': HIHIO_STANCE.grip!.idle.dir, '@edgeR': HIHIO_STANCE.grip!.idle.edge, '@poleR': HIHIO_STANCE.grip!.idle.pole, '@ikR': [1, 0, 0] } },
    ],
    [
      key(0, R()),
      key(0.12, R({ spine: [-8, -6, 0], chest: [-12, -10, 0], head: [-4, 8, 0] }), [0, -0.02, -0.03], 'out'),
      key(0.22, R({ hips: [6, 10, 0], spine: [14, 8, 0], chest: [12, 12, 0], head: [-10, -8, 0], 'thigh.L': [-36, 0, 6], 'shin.L': [36, 0, 0], 'thigh.R': [22, 0, -4] }), [0, -0.08, 0.08], 'outExpo'),
      key(0.8, R(), [0, -0.035, 0], 'inOut'),
    ],
  ),
};

/** Raised high in both hands, then hauled down: the skull smashes. */
const slam: ClipDef = {
  name: 'rj_slam', dur: 1.1, fadeIn: 0.06, fadeOut: 0.26, events: { raise: 0.18, slam: 0.48 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@gripR': HIHIO_STANCE.grip!.idle.p, '@dirR': HIHIO_STANCE.grip!.idle.dir, '@edgeR': HIHIO_STANCE.grip!.idle.edge, '@poleR': HIHIO_STANCE.grip!.idle.pole, '@ikR': [1, 0, 0] } },
      { t: 0.3, ease: 'out', c: { '@gripR': [-0.1, 0.42, 0.06], '@dirR': [0, 0.95, 0.3], '@edgeR': [0, 0.3, -0.95], '@poleR': [-0.8, 0.1, -0.5], '@ikR': [1, 0, 0], '@twoHand': [1, 0, 0] } },
      { t: 0.5, ease: 'outExpo', c: { '@gripR': [-0.06, -0.18, 0.34], '@dirR': [0, 0.3, 0.95], '@edgeR': [0, 0.95, -0.3], '@poleR': [-0.7, -0.4, -0.5], '@ikR': [1, 0, 0], '@twoHand': [1, 0, 0] } },
      { t: 1.1, ease: 'inOut', c: { '@gripR': HIHIO_STANCE.grip!.idle.p, '@dirR': HIHIO_STANCE.grip!.idle.dir, '@edgeR': HIHIO_STANCE.grip!.idle.edge, '@poleR': HIHIO_STANCE.grip!.idle.pole, '@ikR': [1, 0, 0], '@twoHand': [0, 0, 0] } },
    ],
    [
      key(0, R()),
      key(0.3, R({ spine: [-12, 0, 0], chest: [-16, 4, 0], head: [-12, 0, 0] }), [0, 0.03, -0.03], 'out'),
      key(0.5, R({ hips: [8, 0, 0], spine: [22, 0, 0], chest: [20, 2, 0], head: [-14, 0, 0], 'thigh.L': [-44, 0, 6], 'shin.L': [48, 0, 0], 'thigh.R': [26, 0, -4], 'shin.R': [30, 0, 0] }), [0, -0.12, 0.08], 'outExpo'),
      key(1.1, R(), [0, -0.035, 0], 'inOut'),
    ],
  ),
};

/** Hikotsu Taihō: braced, the handle levelled at the enemy, the left hand on the right wrist. */
const roar: ClipDef = {
  name: 'rj_roar', dur: 1.6, fadeIn: 0.1, fadeOut: 0.3, events: { charge: 0.15, fire: 0.6 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@gripR': HIHIO_STANCE.grip!.idle.p, '@dirR': HIHIO_STANCE.grip!.idle.dir, '@edgeR': HIHIO_STANCE.grip!.idle.edge, '@poleR': HIHIO_STANCE.grip!.idle.pole, '@ikR': [1, 0, 0] } },
      { t: 0.4, ease: 'out', c: { '@gripR': [-0.12, 0.1, 0.4], '@dirR': [0, 0.35, 0.94], '@edgeR': [0, 0.94, -0.35], '@poleR': [-0.7, -0.5, -0.4], '@ikR': [1, 0, 0], '@twoHand': [0.8, 0, 0] } },
      { t: 1.2, ease: 'inOut', c: { '@gripR': [-0.12, 0.1, 0.4], '@dirR': [0, 0.35, 0.94], '@edgeR': [0, 0.94, -0.35], '@poleR': [-0.7, -0.5, -0.4], '@ikR': [1, 0, 0], '@twoHand': [0.8, 0, 0] } },
      { t: 1.6, ease: 'inOut', c: { '@gripR': HIHIO_STANCE.grip!.idle.p, '@dirR': HIHIO_STANCE.grip!.idle.dir, '@edgeR': HIHIO_STANCE.grip!.idle.edge, '@poleR': HIHIO_STANCE.grip!.idle.pole, '@ikR': [1, 0, 0], '@twoHand': [0, 0, 0] } },
    ],
    [
      key(0, R()),
      key(0.4, R({ hips: [0, -10, 0], spine: [6, -6, 0], chest: [6, -8, 0], 'thigh.L': [-30, 0, 10], 'shin.L': [36, 0, 0], 'thigh.R': [22, 0, -10], 'shin.R': [30, 0, 0] }), [0, -0.1, 0], 'out'),
      key(1.2, R({ hips: [0, -10, 0], spine: [6, -6, 0], chest: [6, -8, 0], 'thigh.L': [-30, 0, 10], 'shin.L': [36, 0, 0], 'thigh.R': [22, 0, -10], 'shin.R': [30, 0, 0] }), [0, -0.1, 0], 'inOut'),
      key(1.6, R(), [0, -0.035, 0], 'inOut'),
    ],
  ),
};

export const RENJI_CLIPS: ClipDef[] = [
  lash1, lash2, lash3, reach, curve, wrap, spin, shikai, bankai, cast, chant, command, slam, roar,
  ...ICHIGO_CLIPS.filter((c) => ['slash1', 'slash2', 'slash3', 'dash', 'airstep', 'hit_heavy'].includes(c.name)),
];
export const RENJI_CHAIN = ['slash1', 'slash2', 'slash3'];
export const ZABIMARU_CHAIN = ['rj_lash1', 'rj_lash2', 'rj_lash3'];
