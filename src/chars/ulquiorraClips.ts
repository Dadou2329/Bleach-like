// Ulquiorra's animation set: stillness, economy, contempt. Sealed: hands in his pockets, upright and
// motionless; a hand comes out only to strike — backhand, palm, knee, the big side kick, the hand-spear
// through the chest at the spot of his own hole — or to point a finger for a green Cero; red Bala
// flicked from the knuckles; Murciélago drawn for those who must be destroyed (fast thrusts, a downward
// strike that splits the floor). Murciélago: the wings half-spread behind him, Luz de la Luna swung and
// thrown, Cero Oscuras, the wing slap, a looping wing beat for flight. Segunda Etapa: a slight
// predator's hunch, claws, the tail whip, the head-grab rush, Lanza del Relámpago hurled overhead.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { GRIMMJOW_CLIPS } from './grimmjowClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

// ------------------------------------------------------------------ stances

const POCKETS: Record<string, E> = {
  hips: [0, -4, 0], spine: [0, 2, 0], chest: [0, 2, 0], neck: [0, 0, 0], head: [3, 0, 0],
  'thigh.L': [-3, 0, 3], 'shin.L': [3, 0, 0], 'thigh.R': [2, 0, -3], 'shin.R': [3, 0, 0],
  // hands in the hakama pockets
  'upperarm.L': [12, 0, 11], 'forearm.L': [-28, -12, 0], 'hand.L': [10, 0, 0],
  'upperarm.R': [12, 0, -11], 'forearm.R': [-28, 12, 0], 'hand.R': [10, 0, 0],
};

export const ULQUIORRA_STANCE: StanceDef = {
  idle: POCKETS,
  idleHips: -0.006,
  run: { chest: [4, 0, 0] },
  sprint: { spine: [10, 0, 0], chest: [6, 0, 0], head: [-10, 0, 0] },
  swingL: 0.15,
  swingR: 0.15,
};

const SWORD_IDLE = { ...POCKETS };
delete (SWORD_IDLE as Partial<typeof POCKETS>)['upperarm.R'];
delete (SWORD_IDLE as Partial<typeof POCKETS>)['forearm.R'];
delete (SWORD_IDLE as Partial<typeof POCKETS>)['hand.R'];
/** Murciélago drawn: the blade held low and forward in the right hand, the left still in the pocket. */
export const ULQUIORRA_SWORD_STANCE: StanceDef = {
  idle: SWORD_IDLE,
  idleHips: -0.008,
  run: { chest: [4, 0, 0] },
  sprint: { spine: [10, 0, 0], chest: [6, 0, 0], head: [-10, 0, 0] },
  swingL: 0.15,
  swingR: 0.2,
  grip: {
    idle: { p: [-0.24, -0.3, 0.18], dir: [-0.1, -0.45, 0.89], edge: [0.1, -0.88, -0.45], pole: [-0.55, -0.3, -0.8] },
    walk: { p: [-0.24, -0.3, 0.14], dir: [-0.12, -0.55, 0.83], edge: [0.1, -0.82, -0.55], pole: [-0.55, -0.3, -0.8] },
    run: { p: [-0.26, -0.24, -0.06], dir: [-0.2, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.26, -0.14, -0.16], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.34, -0.08, 0.12], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

const WINGS_REST: Record<string, E> = {
  'wing.L': [6, 28, -10], 'wing.L.2': [0, 22, -16],
  'wing.R': [6, -28, 10], 'wing.R.2': [0, -22, 16],
};

/** Murciélago: upright, arms loose at his sides, the wings half-folded behind him. */
export const MURCIELAGO_STANCE: StanceDef = {
  idle: {
    hips: [0, -4, 0], spine: [0, 2, 0], chest: [-2, 2, 0], head: [4, 0, 0],
    'thigh.L': [-3, 0, 3], 'shin.L': [3, 0, 0], 'thigh.R': [2, 0, -3], 'shin.R': [3, 0, 0],
    'upperarm.L': [4, 0, 8], 'forearm.L': [-10, 0, 0], 'upperarm.R': [4, 0, -8], 'forearm.R': [-10, 0, 0],
    ...WINGS_REST,
  },
  idleHips: -0.006,
  run: { chest: [6, 0, 0], 'upperarm.L': [10, 0, 10], 'upperarm.R': [10, 0, -10], 'wing.L': [10, 40, -14], 'wing.R': [10, -40, 14] },
  sprint: { spine: [12, 0, 0], chest: [8, 0, 0], head: [-12, 0, 0], 'upperarm.L': [36, 0, 12], 'upperarm.R': [36, 0, -12], 'wing.L': [14, 52, -18], 'wing.R': [14, -52, 18] },
  swingL: 0.5,
  swingR: 0.2,
  // Luz de la Luna held upright at his side like a staff
  grip: {
    idle: { p: [-0.26, -0.2, 0.1], dir: [0.06, 0.9, 0.42], edge: [0, -0.42, 0.9], pole: [-0.7, -0.4, -0.5] },
    walk: { p: [-0.26, -0.2, 0.08], dir: [0.06, 0.88, 0.46], edge: [0, -0.46, 0.88], pole: [-0.7, -0.4, -0.5] },
    run: { p: [-0.28, -0.22, -0.06], dir: [-0.2, -0.2, -0.96], edge: [0, -0.98, 0.2], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.28, -0.14, -0.16], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.34, -0.1, 0.12], dir: [-0.5, 0.2, 0.84], edge: [0, -1, 0.2], pole: [-0.4, -0.6, -0.6] },
  },
};

/** Segunda Etapa: a slight predator's hunch, claws open, wings spread wider. */
export const SEGUNDA_STANCE: StanceDef = {
  idle: {
    hips: [6, -4, 0], spine: [8, 2, 0], chest: [4, 2, 0], neck: [-4, 0, 0], head: [-6, 0, 0],
    'thigh.L': [-14, 0, 6], 'shin.L': [18, 0, 0], 'foot.L': [-4, 0, 0], 'thigh.R': [-4, 0, -6], 'shin.R': [14, 0, 0], 'foot.R': [-8, 0, 0],
    'upperarm.L': [-12, 0, 18], 'forearm.L': [-36, 0, 0], 'hand.L': [-10, 0, 0],
    'upperarm.R': [-12, 0, -18], 'forearm.R': [-36, 0, 0], 'hand.R': [-10, 0, 0],
    'wing.L': [4, 16, 2], 'wing.L.2': [0, 12, -6], 'wing.R': [4, -16, -2], 'wing.R.2': [0, -12, 6],
  },
  idleHips: -0.05,
  run: { spine: [16, 0, 0], chest: [8, 0, 0], neck: [-10, 0, 0], 'wing.L': [10, 40, -10], 'wing.R': [10, -40, 10] },
  sprint: { spine: [26, 0, 0], chest: [12, 0, 0], neck: [-18, 0, 0], head: [-10, 0, 0], 'upperarm.L': [40, 0, 16], 'upperarm.R': [40, 0, -16], 'wing.L': [14, 56, -16], 'wing.R': [14, -56, 16] },
  swingL: 0.9,
  swingR: 0.9,
  freqScale: 1.05,
};

const P = (over: Record<string, E> = {}): Record<string, E> => ({ ...POCKETS, ...over });

// ------------------------------------------------------------------ sealed, unarmed

/** Left backhand: out of the pocket, across and out. */
const backhand: ClipDef = {
  name: 'ul_backhand', dur: 0.46, fadeIn: 0.05, fadeOut: 0.18, events: { step: 0.06, hit: 0.15, combo: 0.22 },
  keys: [
    key(0, P()),
    key(0.08, P({ chest: [0, 18, 0], spine: [0, 8, 0], 'upperarm.L': [-60, 0, -36], 'forearm.L': [-96, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.01, -0.01], 'out'),
    key(0.15, P({ chest: [2, -26, 0], spine: [0, -10, 0], head: [2, 16, 0], 'upperarm.L': [-84, 0, 52], 'forearm.L': [-6, 0, 0], 'hand.L': [0, 0, -20] }), [0, -0.02, 0.05], 'outExpo'),
    key(0.46, P(), [0, -0.006, 0], 'inOut'),
  ],
};

/** Right palm shove, straight from the shoulder. */
const palm: ClipDef = {
  name: 'ul_palm', dur: 0.48, fadeIn: 0.05, fadeOut: 0.18, events: { step: 0.07, hit: 0.15, combo: 0.23 },
  keys: [
    key(0, P()),
    key(0.08, P({ chest: [0, -16, 0], 'upperarm.R': [-30, 0, -24], 'forearm.R': [-110, 0, 0], 'hand.R': [-50, 0, 0] }), [0, -0.02, -0.02], 'out'),
    key(0.15, P({ chest: [4, 22, 0], spine: [2, 10, 0], head: [2, -14, 0], 'upperarm.R': [-90, 0, 0], 'forearm.R': [-4, 0, 0], 'hand.R': [-64, 0, 0], 'thigh.R': [-26, 0, -4], 'shin.R': [24, 0, 0], 'thigh.L': [16, 0, 4] }), [0, -0.04, 0.08], 'outExpo'),
    key(0.48, P(), [0, -0.006, 0], 'inOut'),
  ],
};

/** Rising knee, hands still in the pockets. */
const knee: ClipDef = {
  name: 'ul_knee', dur: 0.52, fadeIn: 0.04, fadeOut: 0.18, events: { step: 0.1, hit: 0.2, combo: 0.28 },
  keys: [
    key(0, P()),
    key(0.1, P({ 'thigh.L': [10, 0, 2], 'shin.L': [40, 0, 0] }), [0, -0.05, 0], 'out'),
    key(0.2, P({ spine: [-6, 0, 0], chest: [-6, 0, 0], head: [10, 0, 0], 'thigh.L': [-112, 0, 2], 'shin.L': [120, 0, 0], 'foot.L': [20, 0, 0], 'thigh.R': [6, 0, -3] }), [0, 0.08, 0.06], 'outExpo'),
    key(0.52, P(), [0, -0.006, 0], 'inOut'),
  ],
};

/** The big side kick that sends a body into a distant tower. */
const kick: ClipDef = {
  name: 'ul_kick', dur: 0.72, fadeIn: 0.04, fadeOut: 0.2, events: { step: 0.12, hit: 0.28, combo: 0.4 },
  keys: [
    key(0, P()),
    key(0.14, P({ hips: [0, -40, 0], spine: [0, -10, 0], 'thigh.R': [-70, 0, -10], 'shin.R': [110, 0, 0], 'foot.R': [10, 0, 0], 'thigh.L': [-8, 0, 4], 'shin.L': [16, 0, 0] }), [0, -0.04, 0], 'out'),
    key(0.28, P({ hips: [0, -80, 0], spine: [0, -10, -20], chest: [0, 0, -10], head: [0, 70, 16], 'thigh.R': [-6, 0, -86], 'shin.R': [4, 0, 0], 'foot.R': [-10, 0, 0], 'thigh.L': [-6, 0, 10], 'shin.L': [12, 0, 0] }), [0, 0.04, 0.04], 'outExpo'),
    key(0.42, P({ hips: [0, -76, 0], spine: [0, -8, -18], head: [0, 66, 14], 'thigh.R': [-10, 0, -78], 'shin.R': [12, 0, 0], 'thigh.L': [-6, 0, 10] }), [0, 0.03, 0.04], 'out'),
    key(0.72, P(), [0, -0.006, 0], 'inOut'),
  ],
};

/** Heavy: the hand-spear through the chest, a long straight lunge. */
const nukite: ClipDef = {
  name: 'ul_nukite', dur: 0.82, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.2, hit: 0.3 },
  keys: [
    key(0, P()),
    key(0.18, P({ chest: [0, -24, 0], spine: [2, -10, 0], head: [0, 20, 0], 'upperarm.R': [26, 0, -14], 'forearm.R': [-96, 0, 0], 'hand.R': [0, 0, 0] }), [0, -0.05, -0.05], 'out'),
    key(0.3, P({ chest: [8, 24, 0], spine: [8, 12, 0], head: [-4, -18, 0], 'upperarm.R': [-90, 0, 2], 'forearm.R': [-2, 0, 0], 'hand.R': [0, 0, 0], 'thigh.L': [-48, 0, 4], 'shin.L': [52, 0, 0], 'thigh.R': [30, 0, -4], 'shin.R': [18, 0, 0] }), [0, -0.1, 0.24], 'outExpo'),
    key(0.56, P({ chest: [6, 20, 0], spine: [6, 10, 0], 'upperarm.R': [-88, 0, 2], 'forearm.R': [-4, 0, 0], 'thigh.L': [-46, 0, 4], 'shin.L': [50, 0, 0], 'thigh.R': [28, 0, -4] }), [0, -0.09, 0.2], 'inOut'),
    key(0.82, P(), [0, -0.006, 0], 'inOut'),
  ],
};

/** Cero: one finger raised toward the target, the other hand never leaves its pocket. */
const cero: ClipDef = {
  name: 'ul_cero', dur: 0.95, fadeIn: 0.06, fadeOut: 0.22, events: { charge: 0.12, fire: 0.38 },
  keys: [
    key(0, P()),
    key(0.16, P({ chest: [0, 12, 0], head: [0, -8, 0], 'upperarm.R': [-90, 0, 2], 'forearm.R': [-2, 0, 0], 'hand.R': [0, 0, 0] }), [0, -0.006, 0], 'out'),
    key(0.38, P({ chest: [0, 12, 0], head: [0, -8, 0], 'upperarm.R': [-92, 0, 2], 'forearm.R': [-2, 0, 0], 'hand.R': [0, 0, 0] }), [0, -0.006, 0], 'inOut'),
    key(0.46, P({ chest: [-3, 10, 0], 'upperarm.R': [-100, 0, 2], 'forearm.R': [-6, 0, 0], 'hand.R': [-6, 0, 0] }), [0, -0.006, -0.03], 'outExpo'),
    key(0.95, P(), [0, -0.006, 0], 'inOut'),
  ],
};

/** Bala: knuckles flicked forward, left, right, left. */
const bala: ClipDef = {
  name: 'ul_bala', dur: 0.9, fadeIn: 0.05, fadeOut: 0.2, events: { b1: 0.14, b2: 0.32, b3: 0.5 },
  keys: [
    key(0, P()),
    key(0.12, P({ chest: [0, -16, 0], 'upperarm.L': [-80, 0, -6], 'forearm.L': [-30, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.01, 0], 'out'),
    key(0.15, P({ chest: [0, -20, 0], 'upperarm.L': [-90, 0, -6], 'forearm.L': [-4, 0, 0] }), [0, -0.01, 0.02], 'outExpo'),
    key(0.3, P({ chest: [0, 16, 0], 'upperarm.R': [-80, 0, 6], 'forearm.R': [-30, 0, 0], 'hand.R': [0, 0, 0], 'upperarm.L': [-40, 0, 10], 'forearm.L': [-80, 0, 0] }), [0, -0.01, 0], 'out'),
    key(0.33, P({ chest: [0, 20, 0], 'upperarm.R': [-90, 0, 6], 'forearm.R': [-4, 0, 0], 'upperarm.L': [-40, 0, 10], 'forearm.L': [-80, 0, 0] }), [0, -0.01, 0.02], 'outExpo'),
    key(0.48, P({ chest: [0, -16, 0], 'upperarm.L': [-80, 0, -6], 'forearm.L': [-30, 0, 0], 'upperarm.R': [-40, 0, -10], 'forearm.R': [-80, 0, 0] }), [0, -0.01, 0], 'out'),
    key(0.51, P({ chest: [0, -20, 0], 'upperarm.L': [-90, 0, -6], 'forearm.L': [-4, 0, 0], 'upperarm.R': [-40, 0, -10], 'forearm.R': [-80, 0, 0] }), [0, -0.01, 0.02], 'outExpo'),
    key(0.9, P(), [0, -0.006, 0], 'inOut'),
  ],
};

/** Murciélago drawn: the right hand crosses to the left hip and draws in one smooth line. */
const draw: ClipDef = {
  name: 'ul_draw', dur: 0.8, fadeIn: 0.06, fadeOut: 0.25, events: { draw: 0.3 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@ikR': [0, 0, 0] } },
      { t: 0.3, c: { '@gripR': [0.1, -0.36, 0.16], '@dirR': [0.3, -0.6, -0.74], '@edgeR': [0, -0.78, 0.62], '@poleR': [-0.6, -0.4, -0.6], '@ikR': [1, 0, 0] } },
      { t: 0.5, ease: 'outExpo', c: { '@gripR': [-0.3, -0.12, 0.3], '@dirR': [-0.35, 0.2, 0.92], '@edgeR': [0, -1, 0.2], '@poleR': [-0.7, -0.5, -0.4], '@ikR': [1, 0, 0] } },
      { t: 0.8, ease: 'inOut', c: { '@gripR': [-0.24, -0.3, 0.18], '@dirR': [-0.1, -0.45, 0.89], '@edgeR': [0.1, -0.88, -0.45], '@poleR': [-0.55, -0.3, -0.8], '@ikR': [1, 0, 0] } },
    ],
    [
      key(0, P()),
      key(0.3, P({ chest: [0, 20, 0], head: [6, -6, 0] }), [0, -0.01, 0], 'out'),
      key(0.5, P({ chest: [0, -10, 0], head: [2, 6, 0] }), [0, -0.01, 0], 'outExpo'),
      key(0.8, P(), [0, -0.008, 0], 'inOut'),
    ],
  ),
};

// ------------------------------------------------------------------ sealed, Murciélago drawn

const SHR: E = [-0.2, 0.16, 0.02];
/** Fast precise thrust (his sword style is his hand style with reach). */
const thrust = (name: string, side: number): ClipDef => ({
  name, dur: 0.5, fadeIn: 0.04, fadeOut: 0.18, events: { step: 0.07, hit: 0.14, combo: 0.22 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@gripR': [-0.24, -0.3, 0.18], '@dirR': [-0.1, -0.45, 0.89], '@edgeR': [0.1, -0.88, -0.45], '@poleR': [-0.55, -0.3, -0.8], '@ikR': [1, 0, 0] } },
      { t: 0.08, ease: 'out', c: { '@gripR': [-0.26, -0.02 + side * 0.06, -0.12], '@dirR': [0.05, 0.02, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.8, -0.3, -0.3], '@ikR': [1, 0, 0] } },
      { t: 0.14, ease: 'outExpo', c: { '@gripR': [-0.04, 0.04 + side * 0.06, 0.6], '@dirR': [0.05, -0.02, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.7, -0.5, -0.2], '@ikR': [1, 0, 0] } },
      { t: 0.26, ease: 'out', c: { '@gripR': [-0.05, 0.03 + side * 0.06, 0.58], '@dirR': [0.05, -0.04, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.7, -0.5, -0.2], '@ikR': [1, 0, 0] } },
      { t: 0.5, ease: 'inOut', c: { '@gripR': [-0.24, -0.3, 0.18], '@dirR': [-0.1, -0.45, 0.89], '@edgeR': [0.1, -0.88, -0.45], '@poleR': [-0.55, -0.3, -0.8], '@ikR': [1, 0, 0] } },
    ],
    [
      key(0, P()),
      key(0.08, P({ hips: [0, -14, 0], chest: [0, -16, 0] }), [0, -0.02, -0.03], 'out'),
      key(0.14, P({ hips: [4, 14, 0], spine: [6, 10, 0], chest: [4, 14, 0], head: [-2, -16, 0], 'thigh.L': [-40, 0, 4], 'shin.L': [44, 0, 0], 'thigh.R': [24, 0, -4], 'shin.R': [14, 0, 0] }), [0, -0.08, 0.16], 'outExpo'),
      key(0.26, P({ hips: [4, 12, 0], spine: [6, 9, 0], chest: [4, 12, 0], 'thigh.L': [-38, 0, 4], 'shin.L': [42, 0, 0], 'thigh.R': [22, 0, -4] }), [0, -0.08, 0.15], 'out'),
      key(0.5, P(), [0, -0.008, 0], 'inOut'),
    ],
  ),
});

/** The downward strike that splits and upturns the floor. */
const split: ClipDef = {
  name: 'ul_split', dur: 0.8, fadeIn: 0.06, fadeOut: 0.24, events: { step: 0.18, hit: 0.26, fx: 0.27, combo: 0.42 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0, -1, 0], c: [-0.08, 0.22, 0.1], r: 0.42, pole: [-0.7, -0.2, -0.65],
      keys: [[0, -60, 'out'], [0.16, -150, 'out'], [0.21, -146, 'linear'], [0.26, 10, 'outExpo'], [0.42, 22, 'out'], [0.8, 40, 'inOut']],
    }),
    [
      key(0, P()),
      key(0.16, P({ spine: [-8, 0, 0], chest: [-10, 0, 0], head: [-6, 0, 0] }), [0, 0.02, -0.02], 'out'),
      key(0.26, P({ hips: [8, 0, 0], spine: [18, 0, 0], chest: [14, 0, 0], head: [-12, 0, 0], 'thigh.L': [-42, 0, 4], 'shin.L': [46, 0, 0], 'thigh.R': [24, 0, -4], 'shin.R': [28, 0, 0] }), [0, -0.1, 0.08], 'outExpo'),
      key(0.42, P({ hips: [9, 0, 0], spine: [19, 0, 0], chest: [15, 0, 0], head: [-12, 0, 0], 'thigh.L': [-43, 0, 4], 'shin.L': [47, 0, 0], 'thigh.R': [25, 0, -4], 'shin.R': [29, 0, 0] }), [0, -0.1, 0.09], 'out'),
      key(0.8, P(), [0, -0.008, 0], 'inOut'),
    ],
  ),
};

// ------------------------------------------------------------------ Murciélago

const R1_IDLE = MURCIELAGO_STANCE.idle as Record<string, E>;
const W = (over: Record<string, E> = {}): Record<string, E> => ({ ...R1_IDLE, ...over });
const SPEAR_REST = { p: [-0.26, -0.18, 0.12] as E, dir: [0.15, 0.35, 0.92] as E, edge: [0, -0.93, 0.35] as E, pole: [-0.6, -0.4, -0.7] as E };

/** Luz de la Luna: a lunging thrust, a wide sweep, a rising cut. */
const spear1: ClipDef = {
  name: 'ul_spear1', dur: 0.56, fadeIn: 0.05, fadeOut: 0.2, events: { step: 0.07, hit: 0.15, combo: 0.26 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@gripR': SPEAR_REST.p, '@dirR': SPEAR_REST.dir, '@edgeR': SPEAR_REST.edge, '@poleR': SPEAR_REST.pole, '@ikR': [1, 0, 0] } },
      { t: 0.08, ease: 'out', c: { '@gripR': [-0.3, -0.04, -0.16], '@dirR': [0.04, 0.02, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.8, -0.3, -0.3], '@ikR': [1, 0, 0] } },
      { t: 0.15, ease: 'outExpo', c: { '@gripR': [-0.06, 0.04, 0.58], '@dirR': [0.04, -0.03, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.7, -0.5, -0.2], '@ikR': [1, 0, 0] } },
      { t: 0.3, ease: 'out', c: { '@gripR': [-0.07, 0.03, 0.56], '@dirR': [0.04, -0.05, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.7, -0.5, -0.2], '@ikR': [1, 0, 0] } },
      { t: 0.56, ease: 'inOut', c: { '@gripR': SPEAR_REST.p, '@dirR': SPEAR_REST.dir, '@edgeR': SPEAR_REST.edge, '@poleR': SPEAR_REST.pole, '@ikR': [1, 0, 0] } },
    ],
    [
      key(0, W()),
      key(0.08, W({ hips: [0, -18, 0], chest: [0, -16, 0], 'wing.L': [0, 40, 6], 'wing.R': [0, -40, -6] }), [0, -0.03, -0.04], 'out'),
      key(0.15, W({ hips: [6, 16, 0], spine: [8, 10, 0], chest: [6, 14, 0], head: [-4, -14, 0], 'thigh.L': [-46, 0, 4], 'shin.L': [48, 0, 0], 'thigh.R': [28, 0, -4], 'shin.R': [16, 0, 0], 'wing.L': [10, 14, -24], 'wing.R': [10, -14, 24] }), [0, -0.1, 0.18], 'outExpo'),
      key(0.56, W(), [0, -0.006, 0], 'inOut'),
    ],
  ),
};

const spear2: ClipDef = {
  name: 'ul_spear2', dur: 0.62, fadeIn: 0.05, fadeOut: 0.2, events: { step: 0.08, hit: 0.17, combo: 0.28 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [1, -0.1, 0], c: SHR, r: 0.38, pole: [-0.5, -0.65, -0.55], tilt: 0,
      keys: [[0, -40, 'out'], [0.1, -130, 'out'], [0.17, 20, 'outExpo'], [0.32, 110, 'out'], [0.62, 60, 'inOut']],
    }),
    [
      key(0, W()),
      key(0.1, W({ hips: [0, -26, 0], spine: [4, -16, 0], chest: [-2, -24, 4], head: [0, 20, 0], 'wing.L': [0, 10, 10], 'wing.R': [0, -50, -10] }), [0, -0.05, -0.02], 'out'),
      key(0.17, W({ hips: [0, 16, 0], spine: [8, 16, 0], chest: [6, 24, -4], head: [0, -18, 0], 'thigh.L': [-28, 0, 6], 'shin.L': [24, 0, 0], 'thigh.R': [20, 0, -4], 'wing.L': [0, 50, -20], 'wing.R': [0, -10, 20] }), [0, -0.08, 0.06], 'outExpo'),
      key(0.62, W(), [0, -0.006, 0], 'inOut'),
    ],
  ),
};

/** Throw: the javelin raised behind the head and hurled. */
const throwSpear: ClipDef = {
  name: 'ul_throw', dur: 0.95, fadeIn: 0.06, fadeOut: 0.24, events: { summon: 0.08, release: 0.42 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@gripR': SPEAR_REST.p, '@dirR': SPEAR_REST.dir, '@edgeR': SPEAR_REST.edge, '@poleR': SPEAR_REST.pole, '@ikR': [1, 0, 0] } },
      { t: 0.3, ease: 'out', c: { '@gripR': [-0.32, 0.3, -0.24], '@dirR': [0.1, 0.25, 0.96], '@edgeR': [0, -1, 0.25], '@poleR': [-0.7, -0.6, -0.4], '@ikR': [1, 0, 0] } },
      { t: 0.42, ease: 'outExpo', c: { '@gripR': [-0.12, 0.2, 0.5], '@dirR': [0.05, -0.1, 1], '@edgeR': [0, -1, -0.1], '@poleR': [-0.6, -0.6, -0.4], '@ikR': [1, 0, 0] } },
      { t: 0.6, ease: 'out', c: { '@gripR': [-0.1, -0.1, 0.45], '@dirR': [0.05, -0.5, 0.86], '@edgeR': [0, -0.86, -0.5], '@poleR': [-0.6, -0.6, -0.4], '@ikR': [0.4, 0, 0] } },
      { t: 0.95, ease: 'inOut', c: { '@ikR': [0, 0, 0] } },
    ],
    [
      key(0, W()),
      key(0.3, W({ hips: [0, -30, 0], spine: [-6, -18, 0], chest: [-10, -24, 0], head: [0, 26, 0], 'upperarm.L': [-70, 0, -10], 'forearm.L': [-10, 0, 0], 'thigh.L': [-14, 0, 8], 'thigh.R': [12, 0, -8], 'wing.L': [-6, 50, 20], 'wing.R': [-6, -50, -20] }), [0, -0.05, -0.04], 'out'),
      key(0.42, W({ hips: [6, 20, 0], spine: [12, 14, 0], chest: [10, 20, 0], head: [-6, -16, 0], 'upperarm.L': [20, 0, 20], 'forearm.L': [-30, 0, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [40, 0, 0], 'thigh.R': [28, 0, -6], 'wing.L': [10, 10, -30], 'wing.R': [10, -10, 30] }), [0, -0.08, 0.12], 'outExpo'),
      key(0.95, W(), [0, -0.006, 0], 'inOut'),
    ],
  ),
};

/** Cero Oscuras: the hand raised, a black sphere growing at the fingertip, then released. */
const oscuras: ClipDef = {
  name: 'ul_oscuras', dur: 1.5, fadeIn: 0.08, fadeOut: 0.3, events: { charge: 0.15, fire: 0.75 },
  keys: [
    key(0, W()),
    key(0.25, W({ chest: [-4, 14, 0], head: [2, -10, 0], 'upperarm.R': [-96, 0, 4], 'forearm.R': [-4, 0, 0], 'hand.R': [-10, 0, 0], 'wing.L': [0, 0, 20], 'wing.R': [0, 0, -20], 'wing.L.2': [0, 0, 16], 'wing.R.2': [0, 0, -16] }), [0, -0.01, 0], 'out'),
    key(0.75, W({ chest: [-6, 14, 0], head: [2, -10, 0], 'upperarm.R': [-98, 0, 4], 'forearm.R': [-4, 0, 0], 'hand.R': [-12, 0, 0], 'wing.L': [0, -6, 26], 'wing.R': [0, 6, -26], 'wing.L.2': [0, 0, 20], 'wing.R.2': [0, 0, -20] }), [0, -0.01, 0], 'inOut'),
    key(0.85, W({ chest: [-12, 10, 0], head: [-2, -8, 0], 'upperarm.R': [-104, 0, 4], 'forearm.R': [-8, 0, 0], 'wing.L': [0, 30, -10], 'wing.R': [0, -30, 10] }), [0, -0.01, -0.08], 'outExpo'),
    key(1.5, W(), [0, -0.006, 0], 'inOut'),
  ],
};

/** Wing slap: both wings swept forward round him, then back. */
const wingSlap: ClipDef = {
  name: 'ul_wingslap', dur: 0.8, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.12, hit: 0.24 },
  keys: [
    key(0, W()),
    key(0.14, W({ chest: [-6, 0, 0], 'wing.L': [0, 60, 20], 'wing.L.2': [0, 30, 10], 'wing.R': [0, -60, -20], 'wing.R.2': [0, -30, -10] }), [0, -0.02, -0.04], 'out'),
    key(0.24, W({ chest: [10, 0, 0], spine: [6, 0, 0], 'wing.L': [0, -70, -6], 'wing.L.2': [0, -40, -6], 'wing.R': [0, 70, 6], 'wing.R.2': [0, 40, 6] }), [0, -0.04, 0.08], 'outExpo'),
    key(0.42, W({ chest: [8, 0, 0], 'wing.L': [0, -60, -4], 'wing.L.2': [0, -34, -4], 'wing.R': [0, 60, 4], 'wing.R.2': [0, 34, 4] }), [0, -0.04, 0.06], 'out'),
    key(0.8, W(), [0, -0.006, 0], 'inOut'),
  ],
};

/** A single loop of the wing beat (layered over anything while airborne). */
const flap: ClipDef = {
  name: 'ul_flap', dur: 0.9, loop: true, fadeIn: 0.2, fadeOut: 0.3,
  keys: [
    key(0, { 'wing.L': [0, 10, 34], 'wing.L.2': [0, 6, 20], 'wing.R': [0, -10, -34], 'wing.R.2': [0, -6, -20] }, undefined, 'inOut'),
    key(0.38, { 'wing.L': [6, 2, -30], 'wing.L.2': [0, 0, -6], 'wing.R': [6, -2, 30], 'wing.R.2': [0, 0, 6] }, undefined, 'inOut'),
    key(0.55, { 'wing.L': [4, 4, -26], 'wing.L.2': [0, 10, -34], 'wing.R': [4, -4, 26], 'wing.R.2': [0, -10, 34] }, undefined, 'inOut'),
    key(0.9, { 'wing.L': [0, 10, 34], 'wing.L.2': [0, 6, 20], 'wing.R': [0, -10, -34], 'wing.R.2': [0, -6, -20] }, undefined, 'inOut'),
  ],
};

/** "Tozase, Murciélago": the sword held out level, released into the black burst. */
const release: ClipDef = {
  name: 'ul_release', dur: 1.8, fadeIn: 0.1, fadeOut: 0.35, events: { draw: 0.2, burst: 0.9 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@ikR': [0, 0, 0] } },
      { t: 0.25, c: { '@gripR': [0.1, -0.36, 0.16], '@dirR': [0.3, -0.6, -0.74], '@edgeR': [0, -0.78, 0.62], '@poleR': [-0.6, -0.4, -0.6], '@ikR': [1, 0, 0] } },
      { t: 0.55, ease: 'out', c: { '@gripR': [-0.12, 0.1, 0.5], '@dirR': [0.1, 0.02, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.7, -0.6, 0], '@ikR': [1, 0, 0] } },
      { t: 0.9, ease: 'inOut', c: { '@gripR': [-0.12, 0.1, 0.5], '@dirR': [0.1, 0.02, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.7, -0.6, 0], '@ikR': [1, 0, 0] } },
      { t: 1.1, ease: 'out', c: { '@ikR': [0, 0, 0] } },
    ],
    [
      key(0, P()),
      key(0.55, P({ chest: [0, -6, 0], head: [-2, 4, 0] }), [0, -0.006, 0], 'out'),
      key(0.9, P({ chest: [0, -6, 0], head: [-6, 4, 0] }), [0, -0.006, 0], 'inOut'),
      key(1.2, { 'upperarm.L': [-10, 0, 40], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-10, 0, -40], 'forearm.R': [-10, 0, 0], chest: [-8, 0, 0], head: [-8, 0, 0] }, [0, -0.01, 0], 'outExpo'),
      key(1.8, { 'upperarm.L': [4, 0, 8], 'forearm.L': [-10, 0, 0], 'upperarm.R': [4, 0, -8], 'forearm.R': [-10, 0, 0], chest: [-2, 2, 0], head: [4, 0, 0] }, [0, -0.006, 0], 'inOut'),
    ],
  ),
};

// ------------------------------------------------------------------ Segunda Etapa

const R2_IDLE = SEGUNDA_STANCE.idle as Record<string, E>;
const S = (over: Record<string, E> = {}): Record<string, E> => ({ ...R2_IDLE, ...over });

const claw1: ClipDef = {
  name: 'ul_claw1', dur: 0.44, fadeIn: 0.04, fadeOut: 0.16, events: { step: 0.06, hit: 0.15, combo: 0.22 },
  keys: [
    key(0, S()),
    key(0.08, S({ chest: [0, -24, 0], spine: [8, -10, 0], 'upperarm.L': [-150, 0, 40], 'forearm.L': [-30, 0, 0], 'hand.L': [-20, 0, 0] }), [0, -0.08, -0.02], 'out'),
    key(0.15, S({ chest: [20, 24, 0], spine: [16, 10, 0], head: [-16, -12, 0], 'upperarm.L': [-26, 0, -30], 'forearm.L': [-16, 0, 0], 'hand.L': [10, 0, 0] }), [0, -0.12, 0.14], 'outExpo'),
    key(0.44, S(), [0, -0.05, 0], 'inOut'),
  ],
};

const claw2: ClipDef = {
  name: 'ul_claw2', dur: 0.44, fadeIn: 0.04, fadeOut: 0.16, events: { step: 0.06, hit: 0.15, combo: 0.22 },
  keys: [
    key(0, S()),
    key(0.08, S({ chest: [0, 24, 0], spine: [8, 10, 0], 'upperarm.R': [-150, 0, -40], 'forearm.R': [-30, 0, 0], 'hand.R': [-20, 0, 0] }), [0, -0.08, -0.02], 'out'),
    key(0.15, S({ chest: [20, -24, 0], spine: [16, -10, 0], head: [-16, 12, 0], 'upperarm.R': [-26, 0, 30], 'forearm.R': [-16, 0, 0], 'hand.R': [10, 0, 0] }), [0, -0.12, 0.14], 'outExpo'),
    key(0.44, S(), [0, -0.05, 0], 'inOut'),
  ],
};

/** Latigo: a full turn, the tail cracking round at waist height. */
const tail: ClipDef = {
  name: 'ul_tail', dur: 0.7, fadeIn: 0.04, fadeOut: 0.2, events: { step: 0.1, hit: 0.3, combo: 0.44 },
  keys: [
    key(0, S()),
    key(0.12, S({ hips: [10, 70, 0], spine: [14, 20, 0], 'thigh.L': [-40, 0, 10], 'shin.L': [60, 0, 0], 'thigh.R': [-20, 0, -10], 'shin.R': [50, 0, 0] }), [0, -0.14, 0], 'out'),
    key(0.32, S({ hips: [14, -200, 0], spine: [16, -10, 0], 'thigh.L': [-50, 0, 14], 'shin.L': [70, 0, 0], 'thigh.R': [-30, 0, -14], 'shin.R': [70, 0, 0], 'upperarm.L': [-40, 0, 50], 'upperarm.R': [-40, 0, -50] }), [0, -0.18, 0], 'outExpo'),
    key(0.7, S({ hips: [6, -360, 0] }), [0, -0.05, 0], 'inOut'),
  ],
};

/** The head-grab rush: one clawed hand out ahead, driving through whatever is behind the target. */
const grab: ClipDef = {
  name: 'ul_grab', dur: 0.95, fadeIn: 0.05, fadeOut: 0.24, events: { step: 0.12, hit: 0.24, slam: 0.62 },
  keys: [
    key(0, S()),
    key(0.12, S({ hips: [20, 0, 0], spine: [20, 0, 0], chest: [10, -10, 0], head: [-20, 10, 0], 'upperarm.R': [-100, 0, -10], 'forearm.R': [-10, 0, 0], 'hand.R': [-20, 0, 0], 'thigh.L': [-60, 0, 6], 'shin.L': [70, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [60, 0, 0] }), [0, -0.12, 0.1], 'out'),
    key(0.62, S({ hips: [24, 0, 0], spine: [24, 0, 0], chest: [12, -10, 0], head: [-22, 10, 0], 'upperarm.R': [-104, 0, -10], 'forearm.R': [-14, 0, 0], 'thigh.L': [-64, 0, 6], 'shin.L': [74, 0, 0], 'thigh.R': [32, 0, -6], 'shin.R': [62, 0, 0] }), [0, -0.14, 0.12], 'linear'),
    key(0.72, S({ hips: [10, 0, 0], spine: [30, 0, 0], chest: [20, 10, 0], head: [-10, 0, 0], 'upperarm.R': [-40, 0, -10], 'forearm.R': [-10, 0, 0] }), [0, -0.12, 0.14], 'outExpo'),
    key(0.95, S(), [0, -0.05, 0], 'inOut'),
  ],
};

/** Lanza del Relámpago: drawn back with the whole body, hurled overhead. */
const lanza: ClipDef = {
  name: 'ul_lanza', dur: 1.3, fadeIn: 0.08, fadeOut: 0.3, events: { summon: 0.12, release: 0.62 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@ikR': [0, 0, 0] } },
      { t: 0.2, c: { '@gripR': [-0.3, 0.2, -0.1], '@dirR': [0.1, 0.3, 0.95], '@edgeR': [0, -0.95, 0.3], '@poleR': [-0.7, -0.6, -0.4], '@ikR': [1, 0, 0] } },
      { t: 0.5, ease: 'out', c: { '@gripR': [-0.34, 0.34, -0.3], '@dirR': [0.12, 0.35, 0.93], '@edgeR': [0, -0.93, 0.35], '@poleR': [-0.7, -0.6, -0.4], '@ikR': [1, 0, 0] } },
      { t: 0.62, ease: 'outExpo', c: { '@gripR': [-0.1, 0.24, 0.5], '@dirR': [0.04, -0.15, 0.99], '@edgeR': [0, -0.99, -0.15], '@poleR': [-0.6, -0.6, -0.4], '@ikR': [1, 0, 0] } },
      { t: 0.85, ease: 'out', c: { '@gripR': [-0.1, -0.12, 0.42], '@dirR': [0.05, -0.6, 0.8], '@edgeR': [0, -0.8, -0.6], '@poleR': [-0.6, -0.6, -0.4], '@ikR': [0.3, 0, 0] } },
      { t: 1.3, ease: 'inOut', c: { '@ikR': [0, 0, 0] } },
    ],
    [
      key(0, S()),
      key(0.5, S({ hips: [0, -36, 0], spine: [-8, -20, 0], chest: [-14, -26, 0], head: [0, 30, 0], 'upperarm.L': [-80, 0, -10], 'forearm.L': [-10, 0, 0], 'thigh.L': [-20, 0, 10], 'shin.L': [26, 0, 0], 'thigh.R': [16, 0, -10], 'wing.L': [-10, 60, 30], 'wing.R': [-10, -60, -30] }), [0, -0.08, -0.06], 'out'),
      key(0.62, S({ hips: [10, 24, 0], spine: [18, 16, 0], chest: [14, 24, 0], head: [-10, -18, 0], 'upperarm.L': [30, 0, 24], 'forearm.L': [-30, 0, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [52, 0, 0], 'thigh.R': [34, 0, -6], 'wing.L': [14, 10, -34], 'wing.R': [14, -10, 34] }), [0, -0.12, 0.16], 'outExpo'),
      key(1.3, S(), [0, -0.05, 0], 'inOut'),
    ],
  ),
};

/** Segunda Etapa: arms out, head back, the second release tearing loose. */
const segunda: ClipDef = {
  name: 'ul_segunda', dur: 1.9, fadeIn: 0.1, fadeOut: 0.35, events: { charge: 0.1, burst: 0.8 },
  keys: [
    key(0, W()),
    key(0.6, W({ spine: [14, 0, 0], chest: [10, 0, 0], head: [12, 0, 0], 'upperarm.L': [-10, 0, 10], 'forearm.L': [-90, 0, 0], 'upperarm.R': [-10, 0, -10], 'forearm.R': [-90, 0, 0], 'wing.L': [0, 50, -20], 'wing.R': [0, -50, 20] }), [0, -0.08, 0], 'inOut'),
    key(0.86, W({ spine: [-12, 0, 0], chest: [-16, 0, 0], head: [-26, 0, 0], 'upperarm.L': [-30, 0, 80], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-30, 0, -80], 'forearm.R': [-10, 0, 0], 'wing.L': [0, -10, 40], 'wing.R': [0, 10, -40] }), [0, -0.02, 0], 'outExpo'),
    key(1.5, W({ spine: [-10, 0, 0], chest: [-14, 0, 0], head: [-22, 0, 0], 'upperarm.L': [-28, 0, 76], 'upperarm.R': [-28, 0, -76], 'wing.L': [0, -6, 36], 'wing.R': [0, 6, -36] }), [0, -0.03, 0], 'out'),
    key(1.9, S(), [0, -0.05, 0], 'inOut'),
  ],
};

const sonido = GRIMMJOW_CLIPS.filter((c) => c.name === 'dash' || c.name === 'airstep' || c.name === 'hit_heavy');

export const ULQUIORRA_CLIPS: ClipDef[] = [
  backhand, palm, knee, kick, nukite, cero, bala, draw, thrust('ul_thrust1', 0), thrust('ul_thrust2', 1), split,
  spear1, spear2, throwSpear, oscuras, wingSlap, flap, release,
  claw1, claw2, tail, grab, lanza, segunda,
  ...sonido,
];
export const ULQUIORRA_CHAIN = ['ul_backhand', 'ul_palm', 'ul_knee', 'ul_kick'];
export const ULQUIORRA_SWORD_CHAIN = ['ul_thrust1', 'ul_thrust2', 'ul_thrust1', 'ul_split'];
export const MURCIELAGO_CHAIN = ['ul_spear1', 'ul_spear2', 'ul_spear1'];
export const SEGUNDA_CHAIN = ['ul_claw1', 'ul_claw2', 'ul_tail'];
