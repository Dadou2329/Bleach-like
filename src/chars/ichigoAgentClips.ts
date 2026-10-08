// Agent of the Shinigami Ichigo's animation set (docs/kits/ichigo.md §4 Agent). The human keeps the karate of the
// spent form (ichigoDangaiClips: the guard, jab, reverse punch, front kick, roundhouse, the concrete-cracker) plus the
// spinning back kick, the catch-and-throw, the baseball bat, the charm and Kon's pill. The Substitute swings the first
// sword — a katana as tall as he is — in wide two-handed arcs: the three-cut string, the street-upturning cleave, the
// Ichigo Homerun, the mask-breaker, the Cero block and its repel, the yank that frees a blade stuck in a wall, and
// "Zangetsu!". Kon, in Ichigo's body, has the flying kick of his super legs. Events: 'step' (lunge), 'hit' (strike /
// blade window), 'fx' (effect), 'combo' (next input accepted), special beats named per clip.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { HUMAN_CLIPS } from './ichigoDangaiClips';
import { ICHIGO_CLIPS, ICHIGO_STANCE } from './ichigoClips';

type E3 = [number, number, number];
type B = NonNullable<KeyDef['b']>;

function body(t: number, b: B, hips?: KeyDef['hips'], ease?: KeyDef['ease']): KeyDef {
  return { t, b, hips, ease };
}

// ------------------------------------------------------------------------------------------------ the Substitute

const SUB_IDLE: B = {
  ...ICHIGO_STANCE.idle,
  neck: [0, 0, 0],
};
const SIDLE = (t: number, ease: KeyDef['ease'] = 'inOut'): KeyDef => body(t, SUB_IDLE, [0, -0.035, 0], ease);

/** the Substitute: the classic stance, the long first sword held a little higher so its point clears the ground */
export const SUB_STANCE: StanceDef = {
  ...ICHIGO_STANCE,
  grip: {
    ...ICHIGO_STANCE.grip!,
    idle: { p: [-0.27, -0.3, 0.2], dir: [-0.14, -0.3, 0.94], edge: [0.06, -0.95, -0.3], pole: [-0.55, -0.3, -0.8] },
    walk: { p: [-0.28, -0.29, 0.15], dir: [-0.16, -0.38, 0.91], edge: [0.06, -0.92, -0.38], pole: [-0.55, -0.3, -0.8] },
  },
};
const S = (over: B): B => ({ ...SUB_IDLE, ...over });

/** 1: a wide two-handed sweep, right to left, the whole body turning through it. */
const s1: ClipDef = {
  name: 'sb_s1', dur: 0.74, fadeIn: 0.06, fadeOut: 0.22, events: { step: 0.12, hit: 0.22, combo: 0.36 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [1, -0.1, 0], c: [-0.06, 0.12, 0.08], r: 0.4, pole: [-0.5, -0.65, -0.55],
      keys: [[0, -60, 'out'], [0.16, -132, 'out'], [0.25, 22, 'outExpo'], [0.38, 112, 'out'], [0.74, 70, 'inOut']],
      twoHand: [0.4, 1, 1, 1, 0.3],
    }),
    [
      SIDLE(0, 'out'),
      body(0.16, S({ hips: [0, -30, 0], spine: [2, -20, 0], chest: [-4, -28, 4], head: [0, 26, 0], 'thigh.L': [-18, 0, 8], 'shin.L': [22, 0, 0], 'thigh.R': [14, 0, -8], 'shin.R': [24, 0, 0] }), [0, -0.07, -0.02], 'out'),
      body(0.25, S({ hips: [0, 20, 0], spine: [8, 18, 0], chest: [6, 28, -4], head: [0, -26, 0], 'thigh.L': [-34, 0, 8], 'shin.L': [30, 0, 0], 'thigh.R': [26, 0, -6], 'shin.R': [26, 0, 0] }), [0, -0.1, 0.08], 'outExpo'),
      body(0.38, S({ hips: [0, 26, 0], spine: [10, 22, 0], chest: [8, 32, -4], head: [0, -30, 0] }), [0, -0.1, 0.09], 'out'),
      SIDLE(0.74),
    ],
    [{ t: 0, c: { '@look': [0.3, 0, 0] } }],
  ),
};

/** 2: the backhand, rising from low on the left to high on the right. */
const s2: ClipDef = {
  name: 'sb_s2', dur: 0.7, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.08, hit: 0.19, combo: 0.32 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [-0.85, 0.52, 0], c: [-0.08, 0.08, 0.06], r: 0.42, pole: [-0.3, -0.4, -0.85],
      keys: [[0, -150, 'out'], [0.12, -118, 'out'], [0.2, 46, 'outExpo'], [0.34, 116, 'out'], [0.7, 70, 'inOut']],
      twoHand: [0.3, 1, 1, 1, 0.3],
    }),
    [
      body(0, S({ hips: [0, 18, 0], spine: [8, 16, 0], chest: [6, 24, -4] })),
      body(0.12, S({ hips: [0, 28, 0], spine: [10, 22, 6], chest: [10, 30, 8], head: [4, -24, 0], 'thigh.L': [-22, 0, 8], 'shin.L': [32, 0, 0], 'thigh.R': [18, 0, -4], 'shin.R': [20, 0, 0] }), [0, -0.11, 0], 'out'),
      body(0.2, S({ hips: [0, -20, 0], spine: [-2, -20, -4], chest: [-10, -28, -10], head: [-6, 24, 0], 'thigh.L': [-8, 0, 6], 'thigh.R': [-6, 0, -10], 'shin.R': [14, 0, 0] }), [0, -0.02, 0.06], 'outExpo'),
      body(0.34, S({ hips: [0, -24, 0], spine: [-4, -22, -4], chest: [-12, -30, -10], head: [-8, 26, 0] }), [0, -0.01, 0.07], 'out'),
      SIDLE(0.7),
    ],
    [{ t: 0, c: { '@look': [0.3, 0, 0] } }],
  ),
};

/** 3: the big two-handed overhead chop. */
const s3: ClipDef = {
  name: 'sb_s3', dur: 0.92, fadeIn: 0.07, fadeOut: 0.26, events: { step: 0.22, hit: 0.31, fx: 0.32, combo: 0.5 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0, -1, 0], c: [-0.04, 0.22, 0.12], r: 0.42, pole: [-0.7, -0.2, -0.65],
      keys: [[0, 20, 'out'], [0.2, -150, 'out'], [0.26, -145, 'linear'], [0.32, 6, 'outExpo'], [0.48, 18, 'out'], [0.92, 40, 'inOut']],
      twoHand: [0.4, 1, 1, 1, 1, 0.3],
    }),
    [
      SIDLE(0, 'out'),
      body(0.2, S({ hips: [0, -4, 0], spine: [-12, 0, 0], chest: [-16, 4, 0], neck: [-6, 0, 0], head: [-10, 0, 0], 'thigh.L': [-6, 0, 4], 'thigh.R': [6, 0, -4], 'shin.L': [8, 0, 0] }), [0, 0.03, -0.03], 'out'),
      body(0.26, S({ spine: [-14, 0, 0], chest: [-18, 4, 0], head: [-12, 0, 0] }), [0, 0.04, -0.03], 'linear'),
      body(0.32, S({ hips: [8, 0, 0], spine: [24, 0, 0], chest: [20, 2, 0], neck: [6, 0, 0], head: [-14, 0, 0], 'thigh.L': [-48, 0, 6], 'shin.L': [52, 0, 0], 'foot.L': [-4, 0, 0], 'thigh.R': [28, 0, -4], 'shin.R': [32, 0, 0], 'foot.R': [-10, 0, 0] }), [0, -0.13, 0.11], 'outExpo'),
      body(0.48, S({ hips: [10, 0, 0], spine: [26, 0, 0], chest: [22, 2, 0], head: [-14, 0, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [54, 0, 0], 'thigh.R': [30, 0, -4], 'shin.R': [34, 0, 0] }), [0, -0.14, 0.12], 'out'),
      SIDLE(0.92),
    ],
    [{ t: 0, c: { '@look': [0.2, 0, 0] } }],
  ),
};

/** RMB — the street-upturning cleave: a hop, the sword over his head in both hands, brought down into the road. */
const cleave: ClipDef = {
  name: 'sb_cleave', dur: 1.08, fadeIn: 0.06, fadeOut: 0.3, events: { step: 0.16, hit: 0.44, fx: 0.45 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0.5, -0.86, 0], c: [-0.05, 0.22, 0.1], r: 0.44, pole: [-0.7, -0.3, -0.6],
      keys: [[0, -40, 'out'], [0.32, -140, 'out'], [0.38, -136, 'linear'], [0.45, 4, 'outExpo'], [0.62, 20, 'out'], [1.08, 40, 'inOut']],
      twoHand: [0.4, 1, 1, 1, 1, 0.3],
    }),
    [
      SIDLE(0, 'out'),
      body(0.16, S({ hips: [10, 0, 0], spine: [16, 0, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [60, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [50, 0, 0] }), [0, -0.2, 0], 'out'),
      body(0.32, S({ hips: [-6, -16, 0], spine: [-16, -8, 0], chest: [-20, -12, 6], head: [-12, 8, 0], 'thigh.L': [-70, 0, 8], 'shin.L': [100, 0, 0], 'thigh.R': [-30, 0, -8], 'shin.R': [90, 0, 0], 'foot.L': [20, 0, 0], 'foot.R': [20, 0, 0] }), [0, 0.06, 0], 'out'),
      body(0.38, S({ spine: [-18, -10, 0], chest: [-22, -14, 6] }), [0, 0.06, 0], 'linear'),
      body(0.45, S({ hips: [12, 10, 0], spine: [28, 8, 0], chest: [22, 12, -6], head: [-18, -8, 0], 'thigh.L': [-52, 0, 6], 'shin.L': [56, 0, 0], 'thigh.R': [32, 0, -6], 'shin.R': [38, 0, 0], 'foot.L': [-4, 0, 0], 'foot.R': [-12, 0, 0] }), [0, -0.16, 0.12], 'outExpo'),
      body(0.62, S({ hips: [14, 12, 0], spine: [30, 10, 0], chest: [24, 14, -6], head: [-20, -8, 0] }), [0, -0.17, 0.13], 'out'),
      SIDLE(1.08),
    ],
    [{ t: 0, c: { '@look': [0.2, 0, 0] } }],
  ),
};

/**
 * Q — the Ichigo Homerun: a backhanded batter's swing — the sword cocked back over the left shoulder, the hips first,
 * then the blade whipped level across the front and on round to the right (also the human's swing with the bat).
 */
const homerun: ClipDef = {
  name: 'sb_homerun', dur: 0.96, fadeIn: 0.06, fadeOut: 0.26, events: { step: 0.28, hit: 0.37 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [1, 0.22, 0], c: [0.02, 0.12, 0.06], r: 0.38, sense: -1, pole: [-0.3, -0.75, -0.55],
      // chest space: the torso's own coil (+56° at the top) and unwind (−72° at the finish) carry the blade the rest
      // of the way — back over the left shoulder, level across the front at the hit, round to the right
      keys: [[0, 70, 'out'], [0.24, 113, 'out'], [0.3, 110, 'linear'], [0.38, 15, 'outExpo'], [0.52, -58, 'out'], [0.96, -40, 'inOut']],
      twoHand: [0.5, 1, 1, 1, 1, 0.3],
    }),
    [
      SIDLE(0, 'out'),
      body(0.24, S({ hips: [0, 24, 0], spine: [-2, 12, -4], chest: [-4, 16, -6], head: [0, -46, 0], 'thigh.L': [-14, 0, 12], 'shin.L': [26, 0, 0], 'thigh.R': [16, 0, -10], 'shin.R': [24, 0, 0], 'foot.R': [10, 0, 0] }), [0, -0.08, -0.04], 'out'),
      body(0.3, S({ hips: [0, 26, 0], spine: [-2, 13, -4], chest: [-4, 17, -6], head: [0, -48, 0] }), [0, -0.08, -0.04], 'linear'),
      body(0.38, S({ hips: [0, -12, 0], spine: [6, -8, 4], chest: [4, -10, 6], head: [0, 28, 0], 'thigh.L': [-32, 0, 10], 'shin.L': [22, 0, 0], 'thigh.R': [22, 0, -10], 'shin.R': [24, 0, 0], 'foot.R': [18, 0, 0] }), [0, -0.09, 0.08], 'outExpo'),
      body(0.52, S({ hips: [0, -30, 0], spine: [4, -18, 8], chest: [0, -24, 10], head: [-4, 60, 0], 'thigh.L': [-28, 0, 10], 'thigh.R': [20, 0, -10], 'shin.R': [30, 0, 0], 'foot.R': [24, 0, 0] }), [0, -0.08, 0.08], 'out'),
      SIDLE(0.96),
    ],
    [{ t: 0, c: { '@look': [0.4, 0, 0] } }],
  ),
};

/** E — the mask-breaker: a clean cut down across the head (the mask), two hands, from high on the right. */
const maskBreak: ClipDef = {
  name: 'sb_mask', dur: 0.8, fadeIn: 0.05, fadeOut: 0.24, events: { step: 0.14, hit: 0.25 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0.7, -0.7, 0], c: [-0.06, 0.26, 0.1], r: 0.44, pole: [-0.7, -0.3, -0.6],
      keys: [[0, -40, 'out'], [0.18, -132, 'out'], [0.26, 12, 'outExpo'], [0.4, 30, 'out'], [0.8, 40, 'inOut']],
      twoHand: [0.3, 1, 1, 0.6, 0.2],
    }),
    [
      SIDLE(0, 'out'),
      body(0.18, S({ hips: [0, -20, 0], spine: [-8, -10, 0], chest: [-12, -14, 4], head: [-6, 14, 0], 'thigh.L': [-16, 0, 6], 'thigh.R': [12, 0, -6], 'shin.R': [18, 0, 0] }), [0, -0.02, -0.02], 'out'),
      body(0.26, S({ hips: [6, 12, 0], spine: [18, 10, 0], chest: [14, 14, -6], head: [-12, -10, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [42, 0, 0], 'thigh.R': [24, 0, -6], 'shin.R': [26, 0, 0] }), [0, -0.11, 0.1], 'outExpo'),
      body(0.4, S({ hips: [8, 14, 0], spine: [20, 12, 0], chest: [16, 16, -6], head: [-12, -12, 0] }), [0, -0.12, 0.1], 'out'),
      SIDLE(0.8),
    ],
  ),
};

/** R — the Cero block: the flat raised before him across the chest, the left palm braced against it ('up'). */
const block: ClipDef = {
  name: 'sb_block', dur: 0.5, fadeIn: 0.05, fadeOut: 0.2, events: { up: 0.08 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@gripR': [-0.27, -0.31, 0.2], '@dirR': [-0.12, -0.5, 0.86], '@edgeR': [0.1, -0.85, -0.5], '@poleR': [-0.55, -0.3, -0.8], '@ikR': [1, 0, 0] } },
      { t: 0.1, ease: 'outExpo', c: { '@gripR': [-0.24, 0.02, 0.34], '@dirR': [1, 0.12, 0.05], '@edgeR': [-0.12, 0.99, 0], '@poleR': [-0.6, -0.6, -0.4], '@ikR': [1, 0, 0] } },
      { t: 0.5, c: { '@gripR': [-0.24, 0.02, 0.33], '@dirR': [1, 0.12, 0.05], '@edgeR': [-0.12, 0.99, 0], '@poleR': [-0.6, -0.6, -0.4], '@ikR': [1, 0, 0] } },
    ],
    [
      SIDLE(0, 'out'),
      body(0.1, S({ hips: [0, -6, 0], spine: [4, -4, 0], chest: [2, -6, 0], head: [-4, 6, 0], 'upperarm.L': [-72, 0, -22], 'forearm.L': [-34, 0, 0], 'hand.L': [-40, 0, 0], 'thigh.L': [-26, 0, 8], 'shin.L': [30, 0, 0], 'thigh.R': [22, 0, -8], 'shin.R': [34, 0, 0] }), [0, -0.1, 0], 'outExpo'),
      body(0.5, S({ hips: [0, -6, 0], spine: [4, -4, 0], chest: [2, -6, 0], head: [-4, 6, 0], 'upperarm.L': [-72, 0, -22], 'forearm.L': [-34, 0, 0], 'hand.L': [-40, 0, 0], 'thigh.L': [-26, 0, 8], 'shin.L': [30, 0, 0], 'thigh.R': [22, 0, -8], 'shin.R': [34, 0, 0] }), [0, -0.1, 0], 'linear'),
    ],
  ),
};

/** R again — the repel: the raised flat shoved out and up, everything it held thrown back ('fire'). */
const repel: ClipDef = {
  name: 'sb_repel', dur: 0.66, fadeIn: 0.03, fadeOut: 0.24, events: { fire: 0.15 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@gripR': [-0.24, 0.02, 0.33], '@dirR': [1, 0.12, 0.05], '@edgeR': [-0.12, 0.99, 0], '@poleR': [-0.6, -0.6, -0.4], '@ikR': [1, 0, 0], '@twoHand': [0, 0, 0] } },
      { t: 0.15, ease: 'outExpo', c: { '@gripR': [-0.16, 0.18, 0.58], '@dirR': [0.6, 0.78, 0.18], '@edgeR': [-0.25, -0.03, 0.97], '@poleR': [-0.7, -0.6, 0], '@ikR': [1, 0, 0], '@twoHand': [0.8, 0, 0] } },
      { t: 0.36, c: { '@gripR': [-0.16, 0.17, 0.56], '@dirR': [0.6, 0.78, 0.18], '@edgeR': [-0.25, -0.03, 0.97], '@poleR': [-0.7, -0.6, 0], '@ikR': [1, 0, 0], '@twoHand': [0.8, 0, 0] } },
      { t: 0.66, ease: 'inOut', c: { '@gripR': [-0.27, -0.31, 0.2], '@dirR': [-0.12, -0.5, 0.86], '@edgeR': [0.1, -0.85, -0.5], '@poleR': [-0.55, -0.3, -0.8], '@ikR': [1, 0, 0], '@twoHand': [0, 0, 0] } },
    ],
    [
      body(0, S({ 'upperarm.L': [-72, 0, -22], 'forearm.L': [-34, 0, 0], 'hand.L': [-40, 0, 0], 'thigh.L': [-26, 0, 8], 'shin.L': [30, 0, 0], 'thigh.R': [22, 0, -8], 'shin.R': [34, 0, 0] }), [0, -0.1, 0]),
      body(0.15, S({ hips: [6, 6, 0], spine: [14, 4, 0], chest: [8, 6, 0], head: [-10, -4, 0], 'thigh.L': [-50, 0, 8], 'shin.L': [50, 0, 0], 'thigh.R': [30, 0, -8], 'shin.R': [14, 0, 0], 'foot.R': [16, 0, 0] }), [0, -0.14, 0.18], 'outExpo'),
      SIDLE(0.66),
    ],
  ),
};

/** LMB with the blade stuck in a wall: both hands on the grip, a lean back and a wrench ('free'). */
const yank: ClipDef = {
  name: 'sb_yank', dur: 0.56, fadeIn: 0.04, fadeOut: 0.2, events: { free: 0.3 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@gripR': [-0.16, 0, 0.5], '@dirR': [0.05, 0, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.7, -0.5, -0.3], '@ikR': [1, 0, 0], '@twoHand': [1, 0, 0] } },
      { t: 0.22, ease: 'in', c: { '@gripR': [-0.18, -0.04, 0.4], '@dirR': [0.05, 0.05, 1], '@edgeR': [0, -1, 0.05], '@poleR': [-0.7, -0.5, -0.3], '@ikR': [1, 0, 0], '@twoHand': [1, 0, 0] } },
      { t: 0.32, ease: 'outExpo', c: { '@gripR': [-0.26, -0.14, 0.12], '@dirR': [-0.2, 0.3, 0.93], '@edgeR': [0.05, -0.95, 0.3], '@poleR': [-0.7, -0.4, -0.5], '@ikR': [1, 0, 0], '@twoHand': [1, 0, 0] } },
      { t: 0.56, ease: 'inOut', c: { '@gripR': [-0.27, -0.31, 0.2], '@dirR': [-0.12, -0.5, 0.86], '@edgeR': [0.1, -0.85, -0.5], '@poleR': [-0.55, -0.3, -0.8], '@ikR': [1, 0, 0], '@twoHand': [0, 0, 0] } },
    ],
    [
      body(0, S({ spine: [10, 0, 0], 'thigh.L': [-30, 0, 8], 'shin.L': [30, 0, 0] }), [0, -0.08, 0.06]),
      body(0.22, S({ hips: [-8, 0, 0], spine: [-6, 0, 0], chest: [-6, 0, 0], 'thigh.L': [-36, 0, 8], 'shin.L': [40, 0, 0], 'thigh.R': [20, 0, -8], 'shin.R': [36, 0, 0] }), [0, -0.12, -0.04], 'in'),
      body(0.32, S({ hips: [-14, 0, 0], spine: [-14, 0, 0], chest: [-10, 0, 0], head: [8, 0, 0], 'thigh.L': [-20, 0, 8], 'shin.L': [20, 0, 0], 'thigh.R': [30, 0, -8], 'shin.R': [44, 0, 0] }), [0, -0.1, -0.14], 'outExpo'),
      SIDLE(0.56),
    ],
  ),
};

/** F — "Zangetsu!": the sword raised upright in both hands, the call ('call'), the blade bursting into the cleaver ('burst'). */
const callZangetsu: ClipDef = {
  name: 'sb_zangetsu', dur: 1.1, fadeIn: 0.1, fadeOut: 0.2, events: { call: 0.5, burst: 0.85 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@gripR': [-0.27, -0.31, 0.2], '@dirR': [-0.12, -0.5, 0.86], '@edgeR': [0.1, -0.85, -0.5], '@poleR': [-0.55, -0.3, -0.8], '@ikR': [1, 0, 0], '@twoHand': [0, 0, 0] } },
      { t: 0.45, ease: 'inOut', c: { '@gripR': [-0.06, 0.12, 0.34], '@dirR': [0.02, 1, 0.1], '@edgeR': [0, -0.1, 1], '@poleR': [-0.85, -0.45, 0.1], '@ikR': [1, 0, 0], '@twoHand': [1, 0, 0] } },
      { t: 1.1, c: { '@gripR': [-0.06, 0.13, 0.34], '@dirR': [0.02, 1, 0.1], '@edgeR': [0, -0.1, 1], '@poleR': [-0.85, -0.45, 0.1], '@ikR': [1, 0, 0], '@twoHand': [1, 0, 0] } },
    ],
    [
      SIDLE(0, 'out'),
      body(0.45, S({ hips: [0, -4, 0], spine: [-2, 0, 0], chest: [-4, 0, 0], head: [-6, 0, 0], 'thigh.L': [-14, 0, 9], 'shin.L': [16, 0, 0], 'thigh.R': [10, 0, -9], 'shin.R': [16, 0, 0] }), [0, -0.05, 0], 'inOut'),
      body(0.85, S({ hips: [0, -4, 0], spine: [-6, 0, 0], chest: [-8, 0, 0], head: [-10, 0, 0], 'thigh.L': [-18, 0, 10], 'shin.L': [22, 0, 0], 'thigh.R': [12, 0, -10], 'shin.R': [22, 0, 0] }), [0, -0.08, 0], 'outExpo'),
    ],
  ),
};

export const SUB_CLIPS: ClipDef[] = [...ICHIGO_CLIPS, s1, s2, s3, cleave, homerun, maskBreak, block, repel, yank, callZangetsu];
export const SUB_CHAIN = ['sb_s1', 'sb_s2', 'sb_s3'];

// ------------------------------------------------------------------------------------------------ the human

/** karate kamae (the same as the spent form's, without the weariness) */
const GUARD: B = {
  hips: [0, -22, 0], spine: [6, 6, 0], chest: [4, 10, 0], neck: [0, 0, 0], head: [-2, 6, 0],
  'thigh.L': [-18, 0, 6], 'shin.L': [20, 0, 0], 'foot.L': [-2, 0, 0], 'thigh.R': [14, 0, -8], 'shin.R': [22, 0, 0], 'foot.R': [-8, 0, 0],
  'upperarm.L': [-58, 0, 14], 'forearm.L': [-88, 0, 0], 'hand.L': [0, 0, 0],
  'upperarm.R': [-30, 0, -18], 'forearm.R': [-118, 0, 0], 'hand.R': [0, 0, 0],
};
const G = (over: B = {}): B => ({ ...GUARD, ...over });
const GKEY = (t: number, ease: KeyDef['ease'] = 'inOut'): KeyDef => body(t, GUARD, [0, -0.05, 0], ease);

export const AGENT_HUMAN_STANCE: StanceDef = {
  idle: GUARD,
  idleHips: -0.05,
  run: { 'upperarm.L': [-20, 0, 10], 'forearm.L': [-70, 0, 0], 'upperarm.R': [-20, 0, -10], 'forearm.R': [-70, 0, 0], chest: [0, 4, 0] },
  sprint: { 'upperarm.L': [10, 0, 10], 'forearm.L': [-80, 0, 0], 'upperarm.R': [10, 0, -10], 'forearm.R': [-80, 0, 0] },
  swingL: 1,
  swingR: 1,
};

/** 4: the spinning back kick — a full turn, the heel driven round at chest height. */
const spinBack: ClipDef = {
  name: 'hm_spinback', dur: 0.6, fadeIn: 0.04, fadeOut: 0.16, events: { step: 0.1, hit: 0.27, combo: 0.36 },
  keys: [
    GKEY(0),
    body(0.12, G({ hips: [0, -110, 0], spine: [8, -14, 0], head: [-6, 60, 0], 'thigh.L': [0, 0, 6], 'shin.L': [60, 0, 0], 'thigh.R': [-10, 0, -4], 'shin.R': [26, 0, 0] }), [0, -0.06, 0], 'in'),
    body(0.27, G({ hips: [0, -205, 0], spine: [-16, 0, -18], chest: [0, 0, -10], head: [-10, 74, 14], 'thigh.L': [-8, 0, 92], 'shin.L': [6, 0, 0], 'foot.L': [-30, 0, 0], 'thigh.R': [-6, 0, -8], 'shin.R': [18, 0, 0], 'upperarm.L': [-20, 0, 70], 'forearm.L': [-30, 0, 0], 'upperarm.R': [-30, 0, -40], 'forearm.R': [-80, 0, 0] }), [0, 0.03, 0.04], 'outExpo'),
    body(0.42, G({ hips: [0, -300, 0], spine: [6, -6, 0], 'thigh.L': [-20, 0, 30], 'shin.L': [50, 0, 0] }), [0, -0.04, 0.02], 'inOut'),
    body(0.6, G({ hips: [0, -382, 0] }), [0, -0.05, 0], 'out'),
  ],
};

/** Q — catch & throw: the wrist (or the weapon arm) caught, a turn under it, the foe flung over the shoulder ('grab', 'throw'). */
const judo: ClipDef = {
  name: 'ag_throw', dur: 0.95, fadeIn: 0.04, fadeOut: 0.24, events: { grab: 0.13, lift: 0.34, throw: 0.55 },
  keys: [
    GKEY(0),
    body(0.13, G({ hips: [0, -10, 0], spine: [8, -4, 0], chest: [4, -8, 0], 'upperarm.L': [-90, 0, -10], 'forearm.L': [-10, 0, 0], 'hand.L': [-20, 0, 0], 'upperarm.R': [-84, 0, 10], 'forearm.R': [-20, 0, 0], 'thigh.L': [-28, 0, 6], 'shin.L': [26, 0, 0] }), [0, -0.07, 0.08], 'outExpo'),
    body(0.34, G({ hips: [0, 30, 0], spine: [-16, 16, 0], chest: [-12, 20, 0], head: [-10, -20, 0], 'upperarm.L': [-150, 0, -10], 'forearm.L': [-40, 0, 0], 'upperarm.R': [-140, 0, 20], 'forearm.R': [-50, 0, 0], 'thigh.L': [-30, 0, 10], 'shin.L': [44, 0, 0], 'thigh.R': [10, 0, -10], 'shin.R': [44, 0, 0] }), [0, -0.12, 0.02], 'out'),
    body(0.55, G({ hips: [12, 10, 0], spine: [36, 6, 0], chest: [20, 8, 0], head: [-18, -4, 0], 'upperarm.L': [-60, 0, -10], 'forearm.L': [-20, 0, 0], 'upperarm.R': [-56, 0, 10], 'forearm.R': [-24, 0, 0], 'thigh.L': [-50, 0, 8], 'shin.L': [60, 0, 0], 'thigh.R': [20, 0, -8], 'shin.R': [56, 0, 0] }), [0, -0.24, 0.12], 'inExpo'),
    body(0.7, G({ hips: [12, 10, 0], spine: [34, 6, 0], chest: [18, 8, 0], head: [-16, -4, 0], 'upperarm.L': [-58, 0, -10], 'upperarm.R': [-54, 0, 10], 'thigh.L': [-48, 0, 8], 'shin.L': [58, 0, 0], 'thigh.R': [18, 0, -8], 'shin.R': [54, 0, 0] }), [0, -0.23, 0.11], 'out'),
    GKEY(0.95),
  ],
};

/** R — the charm held out before him ('charm'). */
const charm: ClipDef = {
  name: 'ag_charm', dur: 0.8, fadeIn: 0.05, fadeOut: 0.24, events: { charm: 0.2 },
  keys: [
    GKEY(0),
    body(0.2, G({ hips: [0, -12, 0], chest: [0, -6, 0], 'upperarm.L': [-80, 0, 6], 'forearm.L': [-22, 0, 0], 'hand.L': [-16, 0, 0] }), [0, -0.05, 0.02], 'outExpo'),
    body(0.55, G({ hips: [0, -12, 0], chest: [0, -6, 0], 'upperarm.L': [-80, 0, 6], 'forearm.L': [-24, 0, 0], 'hand.L': [-16, 0, 0] }), [0, -0.05, 0.02], 'linear'),
    GKEY(0.8),
  ],
};

/** F — Kon's pill: the hand to the mouth, a swallow, the soul knocked out of the body ('pop'). */
const pill: ClipDef = {
  name: 'ag_pill', dur: 0.9, fadeIn: 0.05, fadeOut: 0.24, events: { pop: 0.45 },
  keys: [
    GKEY(0),
    body(0.25, G({ hips: [0, -8, 0], spine: [2, 0, 0], chest: [0, 0, 0], neck: [-6, 0, 0], head: [-16, 0, 0], 'upperarm.R': [-62, 0, 28], 'forearm.R': [-138, 0, 0], 'hand.R': [10, 0, 0], 'upperarm.L': [-10, 0, 10], 'forearm.L': [-30, 0, 0] }), [0, -0.03, 0], 'inOut'),
    body(0.45, G({ hips: [-8, -8, 0], spine: [-16, 0, 0], chest: [-12, 0, 0], neck: [-10, 0, 0], head: [-26, 0, 0], 'upperarm.R': [10, 0, -30], 'forearm.R': [-20, 0, 0], 'upperarm.L': [10, 0, 30], 'forearm.L': [-20, 0, 0], 'thigh.L': [-6, 0, 6], 'thigh.R': [10, 0, -6] }), [0, -0.02, -0.08], 'outExpo'),
    GKEY(0.9),
  ],
};

export const AGENT_HUMAN_CLIPS: ClipDef[] = [...HUMAN_CLIPS, spinBack, judo, charm, pill, homerun];
export const AGENT_HUMAN_CHAIN = ['hm_jab', 'hm_cross', 'hm_round', 'hm_spinback'];

// ------------------------------------------------------------------------------------------------ Kon in the body

/** the flying kick of the Underpod's legs: a crouch, a launch, the right leg driven down at the foe ('jump', 'hit'). */
const konKick: ClipDef = {
  name: 'kon_kick', dur: 0.95, fadeIn: 0.04, fadeOut: 0.24, events: { jump: 0.16, hit: 0.46 },
  keys: [
    GKEY(0),
    body(0.15, G({ hips: [16, 0, 0], spine: [20, 0, 0], 'thigh.L': [-70, 0, 6], 'shin.L': [110, 0, 0], 'thigh.R': [-60, 0, -6], 'shin.R': [110, 0, 0], 'foot.L': [30, 0, 0], 'foot.R': [30, 0, 0], 'upperarm.L': [30, 0, 20], 'upperarm.R': [30, 0, -20] }), [0, -0.32, 0], 'out'),
    body(0.3, G({ hips: [-10, 0, 0], spine: [-10, 0, 0], 'thigh.L': [-80, 0, 6], 'shin.L': [120, 0, 0], 'thigh.R': [-30, 0, -6], 'shin.R': [70, 0, 0], 'upperarm.L': [-140, 0, 30], 'upperarm.R': [-140, 0, -30] }), [0, 0.1, 0], 'outExpo'),
    body(0.46, G({ hips: [-20, -20, 0], spine: [-10, -10, 0], 'thigh.R': [-96, 0, -6], 'shin.R': [4, 0, 0], 'foot.R': [-30, 0, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [100, 0, 0], 'upperarm.L': [-60, 0, 60], 'forearm.L': [-20, 0, 0], 'upperarm.R': [-20, 0, -60] }), [0, 0.1, 0.1], 'outExpo'),
    body(0.7, G({ hips: [10, 0, 0], spine: [16, 0, 0], 'thigh.L': [-50, 0, 8], 'shin.L': [80, 0, 0], 'thigh.R': [-40, 0, -8], 'shin.R': [80, 0, 0] }), [0, -0.2, 0], 'in'),
    GKEY(0.95),
  ],
};

export const KON_CLIPS: ClipDef[] = [...HUMAN_CLIPS, konKick];
