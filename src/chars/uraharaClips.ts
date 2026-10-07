// Urahara's animation set. He stands loose, hip cocked, the weight on the cane planted at his right side,
// the left hand tucked in the sleeve. With the cane: an unhurried swat, a quick half-drawn flick, a
// cane-butt jab and a Hakuda front kick; the lunging thrust that knocks a target flat and the pin over it;
// Kidō from a raised finger or an open palm. With Benihime: elegant one-handed fencing, the blade held low
// and out; Nake's wide sweep, the shield thrust up in front, Kamisori's flick, Shibari thrown overhead and
// the stab that lights Juzutsunagi, and the circle drawn with the edge for Tsuppane. "Okiro, Benihime"
// draws the blade out of the cane; the Bankai raises the free hand as the curtain falls behind him.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

const IDLE: Record<string, E> = {
  hips: [0, -10, 6], spine: [-2, 4, -2], chest: [-2, 6, 0], neck: [0, 0, 0], head: [4, -4, 3],
  'thigh.L': [-2, 0, 8], 'shin.L': [6, 0, 0], 'thigh.R': [2, 0, -2], 'shin.R': [2, 0, 0],
  // the left hand tucked in the right sleeve, the forearm across the body
  'upperarm.L': [-26, -10, 4], 'forearm.L': [-92, -24, 0], 'hand.L': [10, 0, 0],
};
/** the cane planted at his right side, the hand resting on the crook */
const CANE = { p: [-0.3, -0.5, 0.12] as E, dir: [-0.05, -1, 0.12] as E, edge: [0, 0.12, 1] as E, pole: [-0.8, 0, -0.6] as E };
/** Benihime held low and out to the right, the point toward the ground ahead */
const LOW = { p: [-0.28, -0.36, 0.16] as E, dir: [-0.2, -0.62, 0.76] as E, edge: [0.12, -0.76, -0.62] as E, pole: [-0.6, -0.3, -0.75] as E };

export const URAHARA_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.01,
  run: { chest: [6, 0, 0], 'upperarm.L': [-20, -10, 6], 'forearm.L': [-90, -20, 0] },
  sprint: { spine: [12, 0, 0], chest: [6, 0, 0], head: [-6, 0, 0], 'upperarm.L': [36, 0, 12], 'forearm.L': [-24, 0, 0] },
  swingL: 0.2,
  swingR: 0.2,
  grip: {
    idle: CANE,
    walk: { ...CANE, p: [-0.3, -0.46, 0.18], dir: [-0.05, -0.96, 0.28] },
    run: { p: [-0.28, -0.26, -0.06], dir: [-0.2, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.28, -0.16, -0.16], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.34, -0.1, 0.1], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

/** Shikai: a fencer's stance, side-on, the blade low and out; the left hand free behind. */
export const BENIHIME_STANCE: StanceDef = {
  idle: { ...IDLE, hips: [0, -16, 2], chest: [0, -6, 0], head: [2, 10, 0], 'thigh.L': [-10, 0, 8], 'shin.L': [10, 0, 0], 'thigh.R': [8, 0, -6], 'shin.R': [8, 0, 0], 'upperarm.L': [10, 0, 16], 'forearm.L': [-30, 0, 0], 'hand.L': [10, 0, 0] },
  idleHips: -0.03,
  run: { chest: [6, 0, 0], 'upperarm.L': [-6, 0, 12] },
  sprint: { spine: [12, 0, 0], chest: [6, 0, 0], head: [-6, 0, 0], 'upperarm.L': [36, 0, 12], 'forearm.L': [-24, 0, 0] },
  swingL: 0.6,
  swingR: 0.2,
  grip: {
    idle: LOW,
    walk: { ...LOW, p: [-0.28, -0.33, 0.14] },
    run: { p: [-0.28, -0.26, -0.06], dir: [-0.22, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.28, -0.16, -0.16], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.36, -0.1, 0.1], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

const R = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });
const B = (over: Record<string, E> = {}): Record<string, E> => ({ ...(BENIHIME_STANCE.idle as Record<string, E>), ...over });
const SH: E = [-0.2, 0.14, 0.04];
const ik = (g: typeof CANE) => ({ '@gripR': g.p, '@dirR': g.dir, '@edgeR': g.edge, '@poleR': g.pole, '@ikR': [1, 0, 0] as E });

// ------------------------------------------------------------------ the cane

/** 1: an unhurried swat with the sheathed cane, right to left. */
const swat: ClipDef = {
  name: 'ur_swat', dur: 0.6, fadeIn: 0.05, fadeOut: 0.2, events: { step: 0.08, hit: 0.16, combo: 0.26 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [1, -0.2, 0], c: SH, r: 0.38, pole: [-0.5, -0.6, -0.55],
      keys: [[0, -70, 'out'], [0.09, -115, 'out'], [0.16, 35, 'outExpo'], [0.3, 80, 'out'], [0.6, 60, 'inOut']],
    }),
    [
      key(0, R()),
      key(0.09, R({ hips: [0, -16, 0], chest: [-2, -14, 0], head: [2, 10, 0] }), [0, -0.02, 0], 'out'),
      key(0.16, R({ hips: [0, 12, 0], spine: [2, 8, 0], chest: [0, 16, 0], head: [2, -12, 0], 'thigh.L': [-16, 0, 6], 'shin.L': [14, 0, 0] }), [0, -0.04, 0.06], 'outExpo'),
      key(0.6, R(), [0, -0.01, 0], 'inOut'),
    ],
  ),
};

/** 2: the quick flick — the blade half drawn and snapped across, rising from low on the right. */
const flick: ClipDef = {
  name: 'ur_flick', dur: 0.5, fadeIn: 0.04, fadeOut: 0.18, events: { step: 0.06, hit: 0.13, combo: 0.21 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [-0.8, 0.55, 0], c: [-0.08, 0.06, 0.06], r: 0.38, pole: [-0.3, -0.4, -0.85],
      keys: [[0, -150, 'out'], [0.07, -130, 'out'], [0.13, 45, 'outExpo'], [0.26, 90, 'out'], [0.5, 60, 'inOut']],
    }),
    [
      key(0, R({ hips: [0, 10, 0], chest: [0, 12, 0] })),
      key(0.07, R({ hips: [0, 18, 0], spine: [4, 12, 0], chest: [4, 18, 4], head: [0, -12, 0] }), [0, -0.05, 0], 'out'),
      key(0.13, R({ hips: [0, -12, 0], spine: [-2, -12, 0], chest: [-6, -16, -4], head: [-4, 12, 0] }), [0, -0.01, 0.05], 'outExpo'),
      key(0.5, R(), [0, -0.01, 0], 'inOut'),
    ],
  ),
};

/** 3: the cane-butt jab, straight out from the chest. */
const jab: ClipDef = {
  name: 'ur_jab', dur: 0.5, fadeIn: 0.04, fadeOut: 0.18, events: { step: 0.07, hit: 0.13, combo: 0.22 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(CANE) },
      { t: 0.07, ease: 'out', c: { '@gripR': [-0.24, 0, -0.12], '@dirR': [0.05, 0.02, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.8, -0.3, -0.3], '@ikR': [1, 0, 0] } },
      { t: 0.13, ease: 'outExpo', c: { '@gripR': [-0.04, 0.04, 0.56], '@dirR': [0.05, -0.02, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.7, -0.5, -0.2], '@ikR': [1, 0, 0] } },
      { t: 0.26, ease: 'out', c: { '@gripR': [-0.05, 0.03, 0.54], '@dirR': [0.05, -0.04, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.7, -0.5, -0.2], '@ikR': [1, 0, 0] } },
      { t: 0.5, ease: 'inOut', c: ik(CANE) },
    ],
    [
      key(0, R()),
      key(0.07, R({ hips: [0, -12, 0], chest: [0, -12, 0] }), [0, -0.02, -0.03], 'out'),
      key(0.13, R({ hips: [4, 12, 0], spine: [6, 8, 0], chest: [4, 12, 0], head: [-2, -12, 0], 'thigh.L': [-36, 0, 4], 'shin.L': [40, 0, 0], 'thigh.R': [20, 0, -4], 'shin.R': [12, 0, 0] }), [0, -0.07, 0.14], 'outExpo'),
      key(0.5, R(), [0, -0.01, 0], 'inOut'),
    ],
  ),
};

/** 4: a Hakuda front kick, the cane swung back out of the way. */
const kick: ClipDef = {
  name: 'ur_kick', dur: 0.62, fadeIn: 0.04, fadeOut: 0.2, events: { step: 0.08, hit: 0.18 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(CANE) },
      { t: 0.12, ease: 'out', c: { '@gripR': [-0.38, -0.2, -0.2], '@dirR': [-0.3, -0.5, -0.8], '@edgeR': [0, -0.8, 0.5], '@poleR': [-0.8, -0.2, 0.4], '@ikR': [1, 0, 0] } },
      { t: 0.4, ease: 'inOut', c: { '@gripR': [-0.38, -0.2, -0.2], '@dirR': [-0.3, -0.5, -0.8], '@edgeR': [0, -0.8, 0.5], '@poleR': [-0.8, -0.2, 0.4], '@ikR': [1, 0, 0] } },
      { t: 0.62, ease: 'inOut', c: ik(CANE) },
    ],
    [
      key(0, R()),
      key(0.08, R({ hips: [0, 0, 0], spine: [-4, 0, 0], 'thigh.L': [-70, 0, 0], 'shin.L': [100, 0, 0], 'thigh.R': [-4, 0, -4], 'shin.R': [14, 0, 0] }), [0, -0.02, 0], 'out'),
      key(0.18, R({ hips: [0, 0, 0], spine: [-12, 0, 0], chest: [-6, 0, 0], head: [10, 0, 0], 'thigh.L': [-96, 0, 0], 'shin.L': [6, 0, 0], 'foot.L': [-20, 0, 0], 'thigh.R': [-2, 0, -4], 'shin.R': [12, 0, 0] }), [0, 0, 0.12], 'outExpo'),
      key(0.34, R({ 'thigh.L': [-50, 0, 0], 'shin.L': [80, 0, 0] }), [0, -0.02, 0.06], 'inOut'),
      key(0.62, R(), [0, -0.01, 0], 'inOut'),
    ],
  ),
};

/** RMB (cane): the lunging thrust, and the cane tip held over the fallen target — Shitonegaeshi. */
const pin: ClipDef = {
  name: 'ur_pin', dur: 1.4, fadeIn: 0.05, fadeOut: 0.25, events: { step: 0.1, hit: 0.2, pin: 0.5 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(CANE) },
      { t: 0.1, ease: 'out', c: { '@gripR': [-0.26, -0.02, -0.14], '@dirR': [0.05, 0, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.8, -0.3, -0.3], '@ikR': [1, 0, 0] } },
      { t: 0.2, ease: 'outExpo', c: { '@gripR': [-0.04, 0.02, 0.6], '@dirR': [0.05, -0.1, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.7, -0.5, -0.2], '@ikR': [1, 0, 0] } },
      // the tip lowered to a target lying at his feet, a hair from the face
      { t: 0.5, ease: 'inOut', c: { '@gripR': [-0.08, -0.1, 0.42], '@dirR': [0.02, -0.82, 0.57], '@edgeR': [0, -0.57, -0.82], '@poleR': [-0.8, -0.3, -0.2], '@ikR': [1, 0, 0] } },
      { t: 1.1, ease: 'inOut', c: { '@gripR': [-0.08, -0.1, 0.42], '@dirR': [0.02, -0.82, 0.57], '@edgeR': [0, -0.57, -0.82], '@poleR': [-0.8, -0.3, -0.2], '@ikR': [1, 0, 0] } },
      { t: 1.4, ease: 'inOut', c: ik(CANE) },
    ],
    [
      key(0, R()),
      key(0.1, R({ hips: [0, -12, 0], chest: [0, -12, 0] }), [0, -0.02, -0.03], 'out'),
      key(0.2, R({ hips: [6, 14, 0], spine: [8, 10, 0], chest: [6, 14, 0], head: [-4, -14, 0], 'thigh.L': [-46, 0, 4], 'shin.L': [52, 0, 0], 'thigh.R': [28, 0, -4], 'shin.R': [16, 0, 0] }), [0, -0.1, 0.2], 'outExpo'),
      key(0.5, R({ hips: [10, 4, 0], spine: [12, 4, 0], chest: [8, 4, 0], head: [16, 0, 0], 'thigh.L': [-30, 0, 4], 'shin.L': [40, 0, 0] }), [0, -0.08, 0.08], 'inOut'),
      key(1.1, R({ hips: [10, 4, 0], spine: [12, 4, 0], chest: [8, 4, 0], head: [16, 0, 0], 'thigh.L': [-30, 0, 4], 'shin.L': [40, 0, 0] }), [0, -0.08, 0.08], 'inOut'),
      key(1.4, R(), [0, -0.01, 0], 'inOut'),
    ],
  ),
};

/** Kidō from the left hand: a finger raised before the face (Shibireyubi), or the palm out (Hadō, Bakudō). */
const cast = (name: string, dur: number, fire: number, finger: boolean): ClipDef => ({
  name, dur, fadeIn: 0.05, fadeOut: 0.22, events: { cast: fire },
  keys: [
    key(0, R()),
    key(fire * 0.75, finger
      ? R({ chest: [0, -8, 0], head: [0, 4, 0], 'upperarm.L': [-70, 0, -24], 'forearm.L': [-86, 0, 0], 'hand.L': [-10, 0, 0] })
      : R({ chest: [0, -16, 0], spine: [0, -6, 0], head: [0, 12, 0], 'upperarm.L': [-86, 0, -8], 'forearm.L': [-6, 0, 0], 'hand.L': [-60, 0, 0] }), [0, -0.01, 0], 'out'),
    key(fire, finger
      ? R({ chest: [0, -10, 0], head: [0, 4, 0], 'upperarm.L': [-80, 0, -26], 'forearm.L': [-70, 0, 0], 'hand.L': [-20, 0, 0] })
      : R({ chest: [-2, -18, 0], spine: [0, -6, 0], head: [0, 12, 0], 'upperarm.L': [-92, 0, -8], 'forearm.L': [-4, 0, 0], 'hand.L': [-70, 0, 0] }), [0, -0.01, -0.02], 'outExpo'),
    key(dur - 0.25, finger
      ? R({ chest: [0, -10, 0], head: [0, 4, 0], 'upperarm.L': [-78, 0, -26], 'forearm.L': [-72, 0, 0], 'hand.L': [-18, 0, 0] })
      : R({ chest: [-2, -16, 0], head: [0, 10, 0], 'upperarm.L': [-90, 0, -8], 'forearm.L': [-6, 0, 0], 'hand.L': [-64, 0, 0] }), [0, -0.01, 0], 'inOut'),
    key(dur, R(), [0, -0.01, 0], 'inOut'),
  ],
});

/** G (cane): the decoy — a step back and a flourish of the sleeve as the Gigai inflates. */
const gigai: ClipDef = {
  name: 'ur_gigai', dur: 0.5, fadeIn: 0.04, fadeOut: 0.16, events: { arm: 0.15 },
  keys: [
    key(0, R()),
    key(0.15, R({ chest: [0, 14, 0], 'upperarm.L': [-60, 0, 30], 'forearm.L': [-30, 0, 0], 'hand.L': [-20, 0, 0] }), [0, -0.02, -0.04], 'outExpo'),
    key(0.5, R(), [0, -0.01, 0], 'inOut'),
  ],
};

/** F: "Okiro, Benihime" — the blade drawn out of the cane in one long pull, held up before the face. */
const okiro: ClipDef = {
  name: 'ur_okiro', dur: 1.5, fadeIn: 0.08, fadeOut: 0.3, events: { draw: 0.45, wake: 0.85 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(CANE) },
      { t: 0.35, ease: 'inOut', c: { '@gripR': [-0.12, -0.05, 0.3], '@dirR': [0.1, -0.1, 1], '@edgeR': [0, -1, -0.1], '@poleR': [-0.8, -0.4, -0.2], '@ikR': [1, 0, 0] } },
      { t: 0.6, ease: 'outExpo', c: { '@gripR': [-0.1, 0.08, 0.3], '@dirR': [0.06, 0.98, 0.12], '@edgeR': [0, 0.1, -0.99], '@poleR': [-0.7, -0.5, -0.3], '@ikR': [1, 0, 0] } },
      { t: 1.1, ease: 'inOut', c: { '@gripR': [-0.1, 0.1, 0.3], '@dirR': [0.06, 0.98, 0.12], '@edgeR': [0, 0.1, -0.99], '@poleR': [-0.7, -0.5, -0.3], '@ikR': [1, 0, 0] } },
      { t: 1.5, ease: 'inOut', c: ik(LOW) },
    ],
    [
      key(0, R()),
      key(0.4, R({ 'upperarm.L': [-60, 0, -10], 'forearm.L': [-60, 0, 0], hips: [0, -6, 0] }), [0, -0.02, 0], 'inOut'),
      key(0.6, R({ head: [-4, 0, 0], 'upperarm.L': [10, 0, 20], 'forearm.L': [-30, 0, 0], hips: [0, -14, 0], chest: [0, -8, 0] }), [0, -0.02, 0], 'outExpo'),
      key(1.5, B(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

// ------------------------------------------------------------------ Benihime

const bswing = (name: string, dur: number, ev: { step: number; hit: number; combo?: number }, s: Parameters<typeof swingKeys>[0], body: KeyDef[]): ClipDef => ({
  name, dur, fadeIn: 0.04, fadeOut: 0.2, events: { ...ev } as Record<string, number>, keys: mergeKeys(swingKeys(s), body),
});

/** 1: a level cut, the arm extended, almost no body behind it. */
const bcut1 = bswing('ur_b1', 0.5, { step: 0.06, hit: 0.13, combo: 0.21 },
  { a: [0, 0, 1], b: [1, -0.1, 0], c: SH, r: 0.42, pole: [-0.5, -0.65, -0.55], keys: [[0, -55, 'out'], [0.07, -110, 'out'], [0.13, 40, 'outExpo'], [0.24, 90, 'out'], [0.5, 60, 'inOut']] },
  [key(0, B()), key(0.07, B({ hips: [0, -22, 0], chest: [0, -16, 0] }), [0, -0.03, 0], 'out'), key(0.13, B({ hips: [0, 6, 0], chest: [0, 14, 0], head: [2, -6, 0], 'thigh.L': [-24, 0, 8], 'shin.L': [20, 0, 0] }), [0, -0.05, 0.07], 'outExpo'), key(0.5, B(), [0, -0.03, 0], 'inOut')]);

/** 2: a backhand riser. */
const bcut2 = bswing('ur_b2', 0.5, { step: 0.06, hit: 0.13, combo: 0.21 },
  { a: [0, 0, 1], b: [-0.75, 0.65, 0], c: [-0.08, 0.08, 0.06], r: 0.42, pole: [-0.3, -0.4, -0.85], keys: [[0, -150, 'out'], [0.07, -128, 'out'], [0.13, 48, 'outExpo'], [0.26, 96, 'out'], [0.5, 60, 'inOut']] },
  [key(0, B({ chest: [0, 10, 0] })), key(0.07, B({ hips: [0, 12, 0], chest: [4, 18, 4], head: [0, -10, 0] }), [0, -0.05, 0], 'out'), key(0.13, B({ hips: [0, -18, 0], chest: [-6, -18, -4], head: [-4, 12, 0] }), [0, -0.02, 0.05], 'outExpo'), key(0.5, B(), [0, -0.03, 0], 'inOut')]);

/** 3: the lunge, the whole body behind the point. */
const bcut3: ClipDef = {
  name: 'ur_b3', dur: 0.58, fadeIn: 0.04, fadeOut: 0.2, events: { step: 0.08, hit: 0.15, combo: 0.26 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(LOW) },
      { t: 0.09, ease: 'out', c: { '@gripR': [-0.26, -0.02, -0.14], '@dirR': [0.05, 0.02, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.8, -0.3, -0.3], '@ikR': [1, 0, 0] } },
      { t: 0.15, ease: 'outExpo', c: { '@gripR': [-0.04, 0.04, 0.62], '@dirR': [0.05, -0.02, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.7, -0.5, -0.2], '@ikR': [1, 0, 0] } },
      { t: 0.3, ease: 'out', c: { '@gripR': [-0.05, 0.03, 0.6], '@dirR': [0.05, -0.04, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.7, -0.5, -0.2], '@ikR': [1, 0, 0] } },
      { t: 0.58, ease: 'inOut', c: ik(LOW) },
    ],
    [
      key(0, B()),
      key(0.09, B({ hips: [0, -14, 0], chest: [0, -14, 0] }), [0, -0.03, -0.03], 'out'),
      key(0.15, B({ hips: [6, 16, 0], spine: [8, 10, 0], chest: [4, 14, 0], head: [-4, -14, 0], 'thigh.L': [-50, 0, 4], 'shin.L': [54, 0, 0], 'thigh.R': [30, 0, -4], 'shin.R': [16, 0, 0], 'upperarm.L': [30, 0, 30] }), [0, -0.12, 0.2], 'outExpo'),
      key(0.58, B(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** 4: a falling diagonal, finishing low. */
const bcut4 = bswing('ur_b4', 0.62, { step: 0.08, hit: 0.17 },
  { a: [0, 0.4, 1], b: [0.85, -0.6, 0], c: SH, r: 0.44, pole: [-0.5, -0.4, -0.75], keys: [[0, -90, 'out'], [0.1, -135, 'out'], [0.17, 50, 'outExpo'], [0.32, 100, 'out'], [0.62, 60, 'inOut']] },
  [key(0, B()), key(0.1, B({ hips: [0, -20, 0], chest: [-6, -18, 0], head: [-4, 12, 0] }), [0, -0.02, -0.02], 'out'), key(0.17, B({ hips: [8, 12, 0], spine: [8, 8, 0], chest: [10, 16, 0], head: [6, -8, 0], 'thigh.L': [-36, 0, 6], 'shin.L': [40, 0, 0] }), [0, -0.1, 0.12], 'outExpo'), key(0.62, B(), [0, -0.03, 0], 'inOut')]);

/** Nake, Benihime: the wide horizontal sweep that flings the crimson wave. */
const nake = bswing('ur_nake', 0.85, { step: 0.12, hit: 0.24 },
  { a: [0, 0, 1], b: [1, 0, 0], c: SH, r: 0.48, pole: [-0.5, -0.6, -0.55], keys: [[0, -60, 'out'], [0.16, -140, 'inOut'], [0.24, 50, 'outExpo'], [0.42, 100, 'out'], [0.85, 60, 'inOut']] },
  [key(0, B()), key(0.16, B({ hips: [0, -30, 0], spine: [4, -14, 0], chest: [0, -22, 0], head: [0, 20, 0], 'upperarm.L': [-40, 0, 40] }), [0, -0.08, -0.04], 'inOut'), key(0.24, B({ hips: [0, 18, 0], spine: [6, 12, 0], chest: [4, 24, 0], head: [0, -16, 0], 'thigh.L': [-40, 0, 8], 'shin.L': [44, 0, 0], 'upperarm.L': [10, 0, 40] }), [0, -0.12, 0.12], 'outExpo'), key(0.85, B(), [0, -0.03, 0], 'inOut')]);

/** Chikasumi no Tate: the blade thrust up and forward; the shield forms in front of it. Held. */
const shield: ClipDef = {
  name: 'ur_shield', dur: 1.3, fadeIn: 0.04, fadeOut: 0.22, events: { raise: 0.08, drop: 1.0 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(LOW) },
      { t: 0.1, ease: 'outExpo', c: { '@gripR': [-0.1, 0.12, 0.42], '@dirR': [0.1, 0.92, 0.36], '@edgeR': [0, 0.36, -0.93], '@poleR': [-0.8, -0.4, -0.2], '@ikR': [1, 0, 0] } },
      { t: 1.0, ease: 'inOut', c: { '@gripR': [-0.1, 0.12, 0.42], '@dirR': [0.1, 0.92, 0.36], '@edgeR': [0, 0.36, -0.93], '@poleR': [-0.8, -0.4, -0.2], '@ikR': [1, 0, 0] } },
      { t: 1.3, ease: 'inOut', c: ik(LOW) },
    ],
    [key(0, B()), key(0.1, B({ hips: [0, -4, 0], chest: [-4, 0, 0], 'thigh.L': [-20, 0, 8], 'shin.L': [24, 0, 0], 'thigh.R': [14, 0, -6], 'shin.R': [16, 0, 0] }), [0, -0.06, 0], 'outExpo'), key(1.0, B({ hips: [0, -4, 0], chest: [-4, 0, 0], 'thigh.L': [-20, 0, 8], 'shin.L': [24, 0, 0], 'thigh.R': [14, 0, -6], 'shin.R': [16, 0, 0] }), [0, -0.06, 0], 'inOut'), key(1.3, B(), [0, -0.03, 0], 'inOut')],
  ),
};

/** Kamisori, Benihime: a quick flick of the wrist, the thin arc thrown off the edge. */
const kamisori = bswing('ur_kamisori', 0.55, { step: 0.06, hit: 0.14 },
  { a: [0, 0.3, 1], b: [-0.9, 0.3, 0], c: [-0.1, 0.12, 0.06], r: 0.42, pole: [-0.3, -0.4, -0.85], keys: [[0, -120, 'out'], [0.08, -150, 'out'], [0.14, 60, 'outExpo'], [0.26, 95, 'out'], [0.55, 60, 'inOut']] },
  [key(0, B()), key(0.08, B({ hips: [0, 14, 0], chest: [0, 18, 0] }), [0, -0.04, 0], 'out'), key(0.14, B({ hips: [0, -16, 0], chest: [-4, -20, 0], head: [0, 14, 0] }), [0, -0.04, 0.05], 'outExpo'), key(0.55, B(), [0, -0.03, 0], 'inOut')]);

/** Shibari, Benihime: an overhead slash that throws the net; then the stab that lights Juzutsunagi. */
const shibari = bswing('ur_shibari', 0.8, { step: 0.1, hit: 0.22 },
  { a: [0, 1, 0.2], b: [0, -0.2, 1], c: [-0.06, 0.2, 0.06], r: 0.42, pole: [-0.7, -0.3, -0.6], keys: [[0, -40, 'out'], [0.14, -10, 'inOut'], [0.22, 120, 'outExpo'], [0.4, 150, 'out'], [0.8, 110, 'inOut']] },
  [key(0, B()), key(0.14, B({ spine: [-8, 0, 0], chest: [-12, -6, 0], head: [-10, 0, 0] }), [0, 0.01, -0.03], 'inOut'), key(0.22, B({ spine: [12, 0, 0], chest: [14, 6, 0], head: [8, 0, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [34, 0, 0] }), [0, -0.1, 0.12], 'outExpo'), key(0.8, B(), [0, -0.03, 0], 'inOut')]);

const stab: ClipDef = {
  name: 'ur_stab', dur: 1.0, fadeIn: 0.05, fadeOut: 0.24, events: { stab: 0.28 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(LOW) },
      { t: 0.18, ease: 'out', c: { '@gripR': [-0.12, 0.24, 0.3], '@dirR': [0.05, -0.6, 0.8], '@edgeR': [0, -0.8, -0.6], '@poleR': [-0.8, -0.2, -0.3], '@ikR': [1, 0, 0] } },
      { t: 0.28, ease: 'outExpo', c: { '@gripR': [-0.08, -0.2, 0.44], '@dirR': [0.04, -0.94, 0.34], '@edgeR': [0, -0.34, -0.94], '@poleR': [-0.8, -0.3, -0.2], '@ikR': [1, 0, 0] } },
      { t: 0.7, ease: 'inOut', c: { '@gripR': [-0.08, -0.2, 0.44], '@dirR': [0.04, -0.94, 0.34], '@edgeR': [0, -0.34, -0.94], '@poleR': [-0.8, -0.3, -0.2], '@ikR': [1, 0, 0] } },
      { t: 1.0, ease: 'inOut', c: ik(LOW) },
    ],
    [key(0, B()), key(0.18, B({ spine: [-4, 0, 0] }), [0, 0, 0], 'out'), key(0.28, B({ hips: [10, 0, 0], spine: [14, 0, 0], chest: [10, 0, 0], head: [10, 0, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [60, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [50, 0, 0] }), [0, -0.18, 0.1], 'outExpo'), key(0.7, B({ hips: [10, 0, 0], spine: [14, 0, 0], chest: [10, 0, 0], head: [10, 0, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [60, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [50, 0, 0] }), [0, -0.18, 0.1], 'inOut'), key(1.0, B(), [0, -0.03, 0], 'inOut')],
  ),
};

/** Tsuppane, Benihime: the edge draws a full circle in front of him. */
const tsuppane = bswing('ur_tsuppane', 0.75, { step: 0.04, hit: 0.1 },
  { a: [0, 1, 0], b: [1, 0, 0], c: [-0.04, 0.12, 0.36], r: 0.2, tilt: 0.9, pole: [-0.8, -0.4, -0.3], keys: [[0, 0, 'out'], [0.08, 30, 'out'], [0.4, 390, 'linear'], [0.75, 420, 'inOut']] },
  [key(0, B()), key(0.08, B({ chest: [-4, 0, 0] }), [0, -0.04, 0.02], 'out'), key(0.4, B({ chest: [-4, 0, 0] }), [0, -0.04, 0.02], 'inOut'), key(0.75, B(), [0, -0.03, 0], 'inOut')]);

/** Bankai: the free hand raised as the curtain falls behind him. */
const bankai: ClipDef = {
  name: 'ur_bankai', dur: 2.2, fadeIn: 0.1, fadeOut: 0.3, events: { curtain: 0.5, doll: 1.1 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 2.2, c: ik(LOW) }],
    [
      key(0, B()),
      key(0.5, B({ chest: [-4, 0, 0], head: [-8, 0, 0], 'upperarm.L': [-150, 0, 20], 'forearm.L': [-20, 0, 0], 'hand.L': [-30, 0, 0] }), [0, -0.02, 0], 'out'),
      key(1.4, B({ chest: [-6, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-156, 0, 24], 'forearm.L': [-16, 0, 0], 'hand.L': [-30, 0, 0] }), [0, -0.02, 0], 'inOut'),
      key(2.2, B(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

export const URAHARA_CLIPS: ClipDef[] = [
  swat, flick, jab, kick, pin, cast('ur_finger', 0.8, 0.2, true), cast('ur_palm', 0.9, 0.26, false), cast('ur_bind', 0.7, 0.18, false), gigai, okiro,
  bcut1, bcut2, bcut3, bcut4, nake, shield, kamisori, shibari, stab, tsuppane, bankai,
  ...ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name)),
];
export const URAHARA_CHAIN = ['ur_swat', 'ur_flick', 'ur_jab', 'ur_kick'];
export const BENIHIME_CHAIN = ['ur_b1', 'ur_b2', 'ur_b3', 'ur_b4'];
