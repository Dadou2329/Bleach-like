// Tier Harribel's animation set. Sealed: very still and upright, Tiburón low in her right hand. The light
// chain changes hands every second cut — the sword passes between her hands in front of her chest (the left
// hand swings on its own IK channels) — and ends with both hands on the hilt. RMB the power swing; Q Ola
// Azul (the sword drawn back while the window fills, then flung); E the arc Cero (held out to her right
// while it charges along the blade, then swept across); R the read (a guard that answers an attack from
// behind the attacker); G the unzip (her left hand drawing the zipper down from the collar); F "Ute,
// Tiburón": the blade held point-down before her while the water rises round her.
// Tiburón: the pata over her right hand, the blade continuing the forearm (its swings use the pata arcs:
// the arc direction is the blade, the edge leads along the hand's forward axis). The cut out of the
// cocoon; the four-cut chain with a spinning finisher; La Gota thrust out; Trident's three cuts; Cascada
// swept down and held; Hirviendo, the blade held out with the left palm behind it; the arc Cero; Cascada
// Real, the blade raised to the sky and brought down.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

const IDLE: Record<string, E> = {
  hips: [0, -4, 0], spine: [2, 2, 0], chest: [1, 2, 0], neck: [2, 0, 0], head: [-1, -3, 0],
  'thigh.L': [-3, 0, 3], 'shin.L': [5, 0, 0], 'foot.L': [-2, 0, 0], 'thigh.R': [3, 0, -2], 'shin.R': [4, 0, 0], 'foot.R': [-4, 0, 0],
  'upperarm.L': [2, 0, 9], 'forearm.L': [-10, 0, 0], 'hand.L': [4, 0, 0],
};
const I = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });

/** the right arm free while the left hand has the sword: drawn back a little for balance */
const FREE_R: Record<string, E> = { 'upperarm.R': [28, 11, -15], 'forearm.R': [-42, 0, 0], 'hand.R': [10, -17, 1] };
/** the right hand at the centre of her chest, handing the sword over */
const MEET_R: Record<string, E> = { 'upperarm.R': [14, 59, -41], 'forearm.R': [-105, 0, 0], 'hand.R': [51, -54, 2] };
/** the left palm held out behind the blade (Hirviendo) */
const PALM_L_FWD: Record<string, E> = { 'upperarm.L': [-9, -47, 47], 'forearm.L': [-102, 0, 0], 'hand.L': [61, -31, 28] };

interface Grip { p: E; dir: E; edge: E; pole: E }
/** Tiburón low in the right hand, point forward */
const LOW: Grip = { p: [-0.27, -0.4, 0.14], dir: [-0.12, -0.62, 0.78], edge: [0, -0.78, -0.62], pole: [-0.6, -0.3, -0.75] };
const ik = (g: Grip, two = 0) => ({ '@gripR': g.p, '@dirR': g.dir, '@edgeR': g.edge, '@poleR': g.pole, '@ikR': [1, 0, 0] as E, '@twoHand': [two, 0, 0] as E });
const ikL = (g: Grip, w = 1) => ({ '@gripL': g.p, '@dirL': g.dir, '@edgeL': g.edge, '@poleL': g.pole, '@ikL': [w, 0, 0] as E });
/** where the left hand takes the sword: in front of her chest, the blade up and forward */
const MEET_L: Grip = { p: [0.05, -0.06, 0.3], dir: [0.1, 0.55, 0.83], edge: [0, -0.83, 0.55], pole: [0.7, -0.5, -0.5] };
/** the right hand's grip when the sword comes back to it (both hands on the hilt) */
const MEET_RG: Grip = { p: [0.0, -0.04, 0.34], dir: [0.05, 0.55, 0.83], edge: [0, -0.83, 0.55], pole: [-0.7, -0.5, -0.5] };

export const HARRIBEL_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.01,
  run: { spine: [12, 0, 0], chest: [6, 0, 0], head: [-8, 0, 0], 'upperarm.L': [18, 0, 10], 'forearm.L': [-30, 0, 0] },
  sprint: { spine: [20, 0, 0], chest: [10, 0, 0], head: [-14, 0, 0], 'upperarm.L': [46, 0, 12], 'forearm.L': [-24, 0, 0] },
  swingL: 0.5,
  swingR: 0.15,
  freqScale: 0.95,
  grip: {
    idle: LOW,
    walk: LOW,
    run: { p: [-0.28, -0.26, -0.08], dir: [-0.2, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.28, -0.16, -0.18], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.36, -0.1, 0.1], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

// ---------------------------------------------------------------------------------------------- Tiburón

const T_IDLE: Record<string, E> = {
  ...IDLE,
  hips: [0, -8, 0], spine: [3, 4, 0], chest: [2, 5, 0], head: [-3, -7, 0],
  'thigh.L': [-8, 0, 5], 'shin.L': [10, 0, 0], 'thigh.R': [5, 0, -4], 'shin.R': [8, 0, 0],
  'upperarm.L': [4, 0, 12], 'forearm.L': [-16, 0, 0], 'hand.L': [6, 0, 0],
};
const TI = (over: Record<string, E> = {}): Record<string, E> => ({ ...T_IDLE, ...over });

/**
 * Pata grips: `dir` is the edge's lead (the hand's forward axis), `edge` the blade itself (the hand's down
 * axis, continuing the forearm).
 */
const PATA_LOW: Grip = { p: [-0.26, -0.22, 0.26], dir: [0, 0.95, 0.3], edge: [-0.1, -0.3, 0.95], pole: [-0.8, -0.3, -0.5] };
const PATA_RUN: Grip = { p: [-0.3, -0.18, -0.1], dir: [0, 0.89, -0.45], edge: [-0.15, -0.45, -0.88], pole: [-0.8, -0.2, 0.5] };
const PATA_SPRINT: Grip = { p: [-0.3, -0.08, -0.2], dir: [0, 0.96, -0.27], edge: [-0.15, -0.27, -0.95], pole: [-0.8, -0.2, 0.5] };
const PATA_AIR: Grip = { p: [-0.36, -0.06, 0.12], dir: [0, 0.8, 0.6], edge: [-0.5, -0.5, 0.7], pole: [-0.6, -0.5, -0.6] };
/** the pata thrust straight out at the target */
const PATA_OUT: Grip = { p: [-0.1, 0.1, 0.5], dir: [0, 1, 0], edge: [0.04, 0, 1], pole: [-0.8, -0.5, -0.2] };
/** the pata held out before her, point forward and a little up (Hirviendo) */
const PATA_GUARD: Grip = { p: [-0.08, 0.06, 0.44], dir: [0, 0.97, -0.25], edge: [0.05, 0.25, 0.97], pole: [-0.8, -0.5, -0.2] };
/** raised to the sky (Cascada Real) */
const PATA_SKY: Grip = { p: [-0.16, 0.66, 0.1], dir: [0, 0, 1], edge: [-0.05, 1, 0.05], pole: [-0.9, 0.1, -0.3] };

export const TIBURON_STANCE: StanceDef = {
  idle: T_IDLE,
  idleHips: -0.02,
  run: { spine: [14, 0, 0], chest: [6, 0, 0], head: [-8, 0, 0], 'upperarm.L': [22, 0, 12], 'forearm.L': [-34, 0, 0] },
  sprint: { spine: [22, 0, 0], chest: [10, 0, 0], head: [-14, 0, 0], 'upperarm.L': [50, 0, 14], 'forearm.L': [-26, 0, 0] },
  swingL: 0.5,
  swingR: 0.1,
  freqScale: 0.95,
  grip: { idle: PATA_LOW, walk: PATA_LOW, run: PATA_RUN, sprint: PATA_SPRINT, air: PATA_AIR },
};

const SH: E = [-0.17, 0.2, 0.04];
const SHL: E = [0.17, 0.2, 0.04];

// ---------------------------------------------------------------------------------------------- sealed chain

/** cut 1: the right hand, a flat forehand from her right across to her left */
const cut1: ClipDef = {
  name: 'hb_cut1', dur: 0.52, fadeIn: 0.04, fadeOut: 0.18, events: { step: 0.05, hit: 0.13, combo: 0.24 },
  keys: mergeKeys(
    swingKeys({ a: [0, 0, 1], b: [1, -0.1, 0], c: SH, r: 0.4, pole: [-0.5, -0.65, -0.55], keys: [[0, -60, 'out'], [0.1, -110, 'out'], [0.18, 34, 'out'], [0.3, 90, 'out'], [0.52, 55, 'inOut']] }),
    [
      key(0, I()),
      key(0.1, I({ hips: [2, -20, 0], spine: [5, -10, 0], chest: [4, -12, 0], head: [-6, 14, 2] }), [0, -0.03, 0], 'out'),
      key(0.18, I({ hips: [4, 10, 0], spine: [7, 8, 0], chest: [5, 14, 0], head: [-6, -4, 2], 'thigh.L': [-24, 0, 5], 'shin.L': [26, 0, 0], 'thigh.R': [12, 0, -5] }), [0, -0.06, 0.06], 'out'),
      key(0.52, I({ hips: [0, 6, 0], chest: [2, 6, 0] }), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** cut 2: the right hand, rising backhand from low left to high right — the sword ends up and forward */
const cut2: ClipDef = {
  name: 'hb_cut2', dur: 0.52, fadeIn: 0.04, fadeOut: 0.18, events: { step: 0.05, hit: 0.13, combo: 0.24 },
  keys: mergeKeys(
    swingKeys({ a: [0, 0, 1], b: [-0.85, 0.52, 0], c: [-0.1, 0.12, 0.06], r: 0.4, pole: [-0.3, -0.4, -0.85], keys: [[0, -130, 'out'], [0.1, -116, 'out'], [0.18, 46, 'out'], [0.3, 92, 'out'], [0.52, 40, 'inOut']] }),
    [
      key(0, I({ hips: [0, 6, 0], chest: [2, 6, 0] })),
      key(0.1, I({ hips: [2, 14, 0], spine: [5, 10, 0], chest: [5, 14, 0], head: [-6, -8, 2] }), [0, -0.03, 0], 'out'),
      key(0.18, I({ hips: [2, -14, 0], spine: [5, -10, 0], chest: [4, -16, 0], head: [-6, 14, 2], 'thigh.L': [-22, 0, 5], 'shin.L': [24, 0, 0] }), [0, -0.06, 0.06], 'out'),
      key(0.52, I({ hips: [0, -4, 0], chest: [2, -4, 0] }), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** cut 3: the left hand takes it at her chest and cuts flat from her left across to her right */
const cut3: ClipDef = {
  name: 'hb_cut3', dur: 0.54, fadeIn: 0.04, fadeOut: 0.18, events: { swap: 0.03, step: 0.06, hit: 0.15, combo: 0.26 },
  keys: mergeKeys(
    [{ t: 0, c: ikL(MEET_L) }],
    swingKeys({ hand: 'L', a: [0, 0, 1], b: [-1, -0.1, 0], c: SHL, r: 0.4, pole: [0.5, -0.65, -0.55], keys: [[0.06, -40, 'out'], [0.12, -110, 'out'], [0.2, 34, 'out'], [0.32, 90, 'out'], [0.54, 55, 'inOut']] }),
    [
      key(0, I({ ...MEET_R, hips: [0, -4, 0], chest: [2, -4, 0] })),
      key(0.12, I({ hips: [2, 20, 0], spine: [5, 10, 0], chest: [4, 12, 0], head: [-6, -14, -2], ...FREE_R }), [0, -0.03, 0], 'out'),
      key(0.2, I({ hips: [4, -10, 0], spine: [7, -8, 0], chest: [5, -14, 0], head: [-6, 4, -2], 'thigh.R': [-24, 0, -5], 'shin.R': [26, 0, 0], 'thigh.L': [12, 0, 5], ...FREE_R }), [0, -0.06, 0.06], 'out'),
      key(0.54, I({ hips: [0, -6, 0], chest: [2, -6, 0], ...FREE_R }), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** cut 4: the left hand, rising backhand from low right to high left */
const cut4: ClipDef = {
  name: 'hb_cut4', dur: 0.52, fadeIn: 0.04, fadeOut: 0.18, events: { step: 0.05, hit: 0.13, combo: 0.24 },
  keys: mergeKeys(
    swingKeys({ hand: 'L', a: [0, 0, 1], b: [0.85, 0.52, 0], c: [0.1, 0.12, 0.06], r: 0.4, pole: [0.3, -0.4, -0.85], keys: [[0, -130, 'out'], [0.1, -116, 'out'], [0.18, 46, 'out'], [0.3, 92, 'out'], [0.52, 40, 'inOut']] }),
    [
      key(0, I({ hips: [0, -6, 0], chest: [2, -6, 0], ...FREE_R })),
      key(0.1, I({ hips: [2, -14, 0], spine: [5, -10, 0], chest: [5, -14, 0], head: [-6, 8, -2], ...FREE_R }), [0, -0.03, 0], 'out'),
      key(0.18, I({ hips: [2, 14, 0], spine: [5, 10, 0], chest: [4, 16, 0], head: [-6, -14, -2], 'thigh.R': [-22, 0, -5], 'shin.R': [24, 0, 0], ...FREE_R }), [0, -0.06, 0.06], 'out'),
      key(0.52, I({ hips: [0, 4, 0], chest: [2, 4, 0], ...FREE_R }), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** cut 5: both hands on the hilt (the right takes it back) — over the right shoulder and down across */
const cut5: ClipDef = {
  name: 'hb_cut5', dur: 0.8, fadeIn: 0.05, fadeOut: 0.24, events: { swap: 0.03, step: 0.14, hit: 0.27 },
  keys: mergeKeys(
    swingKeys({ a: [0, 0, 1], b: [0.62, -0.78, 0], c: [-0.06, 0.24, 0.08], r: 0.44, pole: [-0.6, -0.3, -0.7], keys: [[0, 30, 'out'], [0.16, -150, 'inOut'], [0.3, 24, 'out'], [0.44, 50, 'out'], [0.8, 40, 'inOut']], twoHand: [1, 1, 1, 1, 0] }),
    [
      key(0, I({ hips: [0, 4, 0], chest: [2, 4, 0] })),
      key(0.16, I({ hips: [-2, -18, 0], spine: [-6, -8, 0], chest: [-8, -10, 0], head: [-2, 14, 0], 'thigh.L': [-18, 0, 8], 'thigh.R': [10, 0, -8] }), [0, 0.02, -0.04], 'inOut'),
      key(0.3, I({ hips: [10, 12, 0], spine: [12, 8, 0], chest: [8, 10, 0], head: [-10, -6, 0], 'thigh.L': [-48, 0, 8], 'shin.L': [52, 0, 0], 'thigh.R': [26, 0, -8], 'shin.R': [24, 0, 0] }), [0, -0.16, 0.2], 'out'),
      key(0.8, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** back to the right hand when the chain stops with the sword in her left */
const regrip: ClipDef = {
  name: 'hb_regrip', dur: 0.42, fadeIn: 0.08, fadeOut: 0.16, events: { swap: 0.12 },
  keys: mergeKeys(
    [
      { t: 0, c: { ...ik(MEET_RG, 1), ...ikL(MEET_L) } },
      { t: 0.12, c: { ...ik(MEET_RG, 1), ...ikL(MEET_L) } },
      { t: 0.2, ease: 'inOut', c: { ...ik(MEET_RG, 0), ...ikL(MEET_L, 0) } },
      { t: 0.42, ease: 'inOut', c: { ...ik(LOW, 0), ...ikL(MEET_L, 0) } },
    ],
    [key(0, I()), key(0.42, I())],
  ),
};

// ---------------------------------------------------------------------------------------------- sealed skills

/** RMB: the power swing — wound far round to her right, both hands, flat across */
const heavy: ClipDef = {
  name: 'hb_heavy', dur: 0.9, fadeIn: 0.06, fadeOut: 0.24, events: { step: 0.15, hit: 0.32 },
  keys: mergeKeys(
    swingKeys({ a: [0, 0, 1], b: [1, 0.05, 0], c: [-0.1, 0.18, 0.06], r: 0.44, pole: [-0.6, -0.4, -0.6], keys: [[0, -40, 'out'], [0.22, -150, 'inOut'], [0.34, 30, 'out'], [0.48, 110, 'out'], [0.9, 60, 'inOut']], twoHand: [0, 1, 1, 1, 0] }),
    [
      key(0, I()),
      key(0.22, I({ hips: [0, -30, 0], spine: [2, -14, 0], chest: [0, -16, 0], head: [-4, 26, 0], 'thigh.L': [-14, 0, 8], 'shin.L': [12, 0, 0], 'thigh.R': [8, 0, -8] }), [0, -0.05, -0.03], 'inOut'),
      key(0.34, I({ hips: [6, 18, 0], spine: [8, 12, 0], chest: [6, 16, 0], head: [-8, -12, 0], 'thigh.L': [-40, 0, 8], 'shin.L': [44, 0, 0], 'thigh.R': [24, 0, -8], 'shin.R': [20, 0, 0] }), [0, -0.14, 0.16], 'out'),
      key(0.9, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** Q: Ola Azul — the sword drawn back behind her right side while the window fills, then flung across */
const ola: ClipDef = {
  name: 'hb_ola', dur: 1.0, fadeIn: 0.08, fadeOut: 0.24, events: { charge: 0.08, fire: 0.5 },
  keys: mergeKeys(
    swingKeys({ a: [0, 0, 1], b: [1, 0.05, 0], c: SH, r: 0.42, pole: [-0.6, -0.4, -0.6], keys: [[0, -40, 'out'], [0.16, -160, 'inOut'], [0.44, -166, 'inOut'], [0.52, 20, 'out'], [0.64, 76, 'out'], [1.0, 45, 'inOut']] }),
    [
      key(0, I()),
      key(0.16, I({ hips: [0, -26, 0], spine: [2, -12, 0], chest: [0, -14, 0], head: [-4, 22, 0], 'upperarm.L': [-40, 0, 30], 'forearm.L': [-30, 0, 0], 'hand.L': [10, 0, 0], 'thigh.L': [-12, 0, 8], 'thigh.R': [8, 0, -8] }), [0, -0.04, -0.02], 'inOut'),
      key(0.44, I({ hips: [0, -28, 0], spine: [2, -13, 0], chest: [0, -15, 0], head: [-4, 24, 0], 'upperarm.L': [-44, 0, 32], 'forearm.L': [-30, 0, 0], 'hand.L': [10, 0, 0], 'thigh.L': [-12, 0, 8], 'thigh.R': [8, 0, -8] }), [0, -0.05, -0.02], 'linear'),
      key(0.52, I({ hips: [6, 16, 0], spine: [8, 10, 0], chest: [6, 14, 0], head: [-8, -10, 0], 'upperarm.L': [10, 0, 26], 'forearm.L': [-20, 0, 0], 'thigh.L': [-34, 0, 8], 'shin.L': [36, 0, 0], 'thigh.R': [20, 0, -8], 'shin.R': [16, 0, 0] }), [0, -0.12, 0.12], 'out'),
      key(1.0, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** E: the arc Cero — held out flat to her right while it charges along the blade, then swept across */
const cero: ClipDef = {
  name: 'hb_cero', dur: 1.2, fadeIn: 0.08, fadeOut: 0.26, events: { charge: 0.1, fire: 0.62 },
  keys: mergeKeys(
    swingKeys({ a: [0, 0, 1], b: [1, -0.04, 0], c: SH, r: 0.44, pole: [-0.6, -0.5, -0.5], keys: [[0, -50, 'out'], [0.16, -100, 'inOut'], [0.56, -104, 'inOut'], [0.66, 30, 'out'], [0.8, 100, 'out'], [1.2, 50, 'inOut']] }),
    [
      key(0, I()),
      key(0.16, I({ hips: [0, -22, 0], spine: [2, -10, 0], chest: [0, -12, 0], head: [-4, 20, 0], 'upperarm.L': [-20, 0, 40], 'forearm.L': [-16, 0, 0], 'thigh.L': [-14, 0, 10], 'shin.L': [12, 0, 0], 'thigh.R': [8, 0, -10] }), [0, -0.06, 0], 'inOut'),
      key(0.56, I({ hips: [0, -24, 0], spine: [2, -11, 0], chest: [0, -13, 0], head: [-4, 22, 0], 'upperarm.L': [-22, 0, 42], 'forearm.L': [-16, 0, 0], 'thigh.L': [-14, 0, 10], 'shin.L': [12, 0, 0], 'thigh.R': [8, 0, -10] }), [0, -0.07, 0], 'linear'),
      key(0.66, I({ hips: [6, 20, 0], spine: [8, 12, 0], chest: [6, 16, 0], head: [-8, -12, 0], 'upperarm.L': [10, 0, 30], 'forearm.L': [-20, 0, 0], 'thigh.L': [-36, 0, 8], 'shin.L': [38, 0, 0], 'thigh.R': [22, 0, -8], 'shin.R': [18, 0, 0] }), [0, -0.14, 0.12], 'out'),
      key(1.2, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** R: the read — the blade raised across her front, waiting */
const read: ClipDef = {
  name: 'hb_read', dur: 0.9, fadeIn: 0.08, fadeOut: 0.2,
  keys: mergeKeys(
    [
      { t: 0, c: ik(LOW) },
      { t: 0.14, ease: 'out', c: ik({ p: [-0.12, 0.0, 0.32], dir: [0.55, 0.62, 0.56], edge: [-0.2, 0.6, -0.78], pole: [-0.7, -0.6, -0.3] }) },
      { t: 0.9, c: ik({ p: [-0.12, 0.0, 0.32], dir: [0.55, 0.62, 0.56], edge: [-0.2, 0.6, -0.78], pole: [-0.7, -0.6, -0.3] }) },
    ],
    [
      key(0, I()),
      key(0.14, I({ hips: [0, -10, 0], spine: [3, -4, 0], chest: [2, -6, 0], head: [-4, 10, 0], 'thigh.L': [-14, 0, 8], 'shin.L': [16, 0, 0], 'thigh.R': [10, 0, -8], 'shin.R': [12, 0, 0] }), [0, -0.06, 0], 'out'),
      key(0.9, I({ hips: [0, -10, 0], spine: [3, -4, 0], chest: [2, -6, 0], head: [-4, 10, 0], 'thigh.L': [-14, 0, 8], 'shin.L': [16, 0, 0], 'thigh.R': [10, 0, -8], 'shin.R': [12, 0, 0] }), [0, -0.06, 0], 'linear'),
    ],
  ),
};

/** the answer: from behind the attacker, one flat cut */
const counter: ClipDef = {
  name: 'hb_counter', dur: 0.5, fadeIn: 0.02, fadeOut: 0.2, events: { hit: 0.08 },
  keys: mergeKeys(
    swingKeys({ a: [0, 0, 1], b: [1, -0.1, 0], c: SH, r: 0.42, pole: [-0.5, -0.65, -0.55], keys: [[0, -120, 'out'], [0.1, 40, 'out'], [0.22, 92, 'out'], [0.5, 55, 'inOut']] }),
    [
      key(0, I({ hips: [2, -24, 0], spine: [5, -10, 0], chest: [4, -14, 0], head: [-6, 16, 2] })),
      key(0.1, I({ hips: [6, 14, 0], spine: [8, 10, 0], chest: [6, 16, 0], head: [-6, -6, 2], 'thigh.L': [-30, 0, 5], 'shin.L': [32, 0, 0], 'thigh.R': [16, 0, -5] }), [0, -0.1, 0.06], 'out'),
      key(0.5, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** G: the unzip — her left hand at the top of the collar draws the zipper down to the hem */
const unzip: ClipDef = {
  name: 'hb_unzip', dur: 1.0, fadeIn: 0.1, fadeOut: 0.25, events: { open: 0.5 },
  keys: mergeKeys(
    [
      { t: 0, c: { ...ik(LOW), ...ikL({ p: [0.01, 0.2, 0.2], dir: [-1, 0, -0.05], edge: [0.1, -1, 0.15], pole: [1, -0.4, -0.3] }, 0) } },
      { t: 0.22, ease: 'inOut', c: ikL({ p: [0.01, 0.46, 0.2], dir: [-1, 0, -0.05], edge: [0.1, -1, 0.15], pole: [1, -0.4, -0.3] }) },
      { t: 0.34, c: ikL({ p: [0.01, 0.45, 0.2], dir: [-1, 0, -0.05], edge: [0.1, -1, 0.15], pole: [1, -0.4, -0.3] }) },
      { t: 0.66, ease: 'inOut', c: ikL({ p: [0.02, 0.05, 0.24], dir: [-1, 0, 0], edge: [0.1, -1, 0.2], pole: [1, -0.5, -0.4] }) },
      { t: 0.8, c: ikL({ p: [0.02, 0.04, 0.24], dir: [-1, 0, 0], edge: [0.1, -1, 0.2], pole: [1, -0.5, -0.4] }) },
      { t: 1.0, ease: 'inOut', c: { ...ik(LOW), ...ikL({ p: [0.12, -0.2, 0.1], dir: [-1, 0, 0], edge: [0.1, -1, 0.2], pole: [1, -0.5, -0.4] }, 0) } },
    ],
    [
      key(0, I()),
      key(0.22, I({ head: [4, 0, 0], neck: [4, 0, 0] }), [0, 0, 0], 'inOut'),
      key(0.66, I({ head: [-6, 0, 0], neck: [-2, 0, 0], chest: [-2, 0, 0] }), [0, 0, 0], 'inOut'),
      key(1.0, I(), [0, 0, 0], 'inOut'),
    ],
  ),
};

/** F: "Ute, Tiburón" — the blade raised before her and turned point-down, held while the water rises */
const release: ClipDef = {
  name: 'hb_release', dur: 1.0, fadeIn: 0.1, fadeOut: 0.2, events: { call: 0.2, surge: 0.5 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(LOW) },
      { t: 0.28, ease: 'inOut', c: ik({ p: [-0.02, 0.12, 0.3], dir: [0.02, -1, 0.06], edge: [0, -0.06, -1], pole: [-0.8, -0.5, -0.2] }) },
      { t: 1.0, c: ik({ p: [-0.02, 0.14, 0.3], dir: [0.02, -1, 0.06], edge: [0, -0.06, -1], pole: [-0.8, -0.5, -0.2] }) },
    ],
    [
      key(0, I()),
      key(0.28, I({ hips: [0, 0, 0], spine: [0, 0, 0], chest: [0, 0, 0], head: [2, 0, 0], 'thigh.L': [-2, 0, 4], 'thigh.R': [2, 0, -4], 'upperarm.L': [0, 0, 10] }), [0, 0, 0], 'inOut'),
      key(1.0, I({ hips: [0, 0, 0], spine: [-2, 0, 0], chest: [-2, 0, 0], head: [0, 0, 0], 'thigh.L': [-2, 0, 4], 'thigh.R': [2, 0, -4], 'upperarm.L': [0, 0, 10] }), [0, 0, 0], 'linear'),
    ],
  ),
};

// ---------------------------------------------------------------------------------------------- Tiburón moves

/** inside the cocoon, crouched — then one cut that opens it from within */
const burst: ClipDef = {
  name: 'tb_burst', dur: 0.85, fadeIn: 0.02, fadeOut: 0.24, events: { cut: 0.22 },
  keys: mergeKeys(
    swingKeys({ pata: true, a: [0, 0, 1], b: [1, -0.05, 0], c: SH, r: 0.46, pole: [-0.6, -0.5, -0.6], keys: [[0, -120, 'out'], [0.14, -132, 'inOut'], [0.24, 40, 'out'], [0.38, 110, 'out'], [0.85, 60, 'inOut']] }),
    [
      key(0, TI({ hips: [10, -24, 0], spine: [10, -10, 0], chest: [8, -12, 0], head: [-6, 16, 0], 'thigh.L': [-50, 0, 8], 'shin.L': [80, 0, 0], 'foot.L': [-20, 0, 0], 'thigh.R': [-20, 0, -8], 'shin.R': [70, 0, 0], 'foot.R': [-30, 0, 0] }), [0, -0.28, 0]),
      key(0.14, TI({ hips: [10, -26, 0], spine: [10, -11, 0], chest: [8, -13, 0], head: [-6, 18, 0], 'thigh.L': [-50, 0, 8], 'shin.L': [80, 0, 0], 'foot.L': [-20, 0, 0], 'thigh.R': [-20, 0, -8], 'shin.R': [70, 0, 0], 'foot.R': [-30, 0, 0] }), [0, -0.28, 0], 'linear'),
      key(0.24, TI({ hips: [4, 20, 0], spine: [6, 12, 0], chest: [4, 16, 0], head: [-6, -12, 0], 'thigh.L': [-30, 0, 8], 'shin.L': [34, 0, 0], 'thigh.R': [16, 0, -8], 'shin.R': [18, 0, 0], 'upperarm.L': [10, 0, 40], 'forearm.L': [-20, 0, 0] }), [0, -0.06, 0.06], 'out'),
      key(0.85, TI(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** the pata chain: cuts that trail water; the last one a full turn */
const tcut = (name: string, kind: 0 | 1 | 2): ClipDef => ({
  name, dur: 0.54, fadeIn: 0.04, fadeOut: 0.18, events: { step: 0.05, hit: 0.13, combo: 0.25 },
  keys: mergeKeys(
    swingKeys(kind === 0
      ? { pata: true, a: [0, 0, 1], b: [1, -0.1, 0], c: SH, r: 0.46, pole: [-0.6, -0.5, -0.6], keys: [[0, -30, 'out'], [0.1, -115, 'out'], [0.18, 30, 'out'], [0.3, 88, 'out'], [0.54, 45, 'inOut']] }
      : kind === 1
        ? { pata: true, a: [0, 0, 1], b: [-0.85, 0.52, 0], c: [-0.1, 0.12, 0.06], r: 0.46, pole: [-0.4, -0.4, -0.8], keys: [[0, -125, 'out'], [0.1, -118, 'out'], [0.18, 44, 'out'], [0.3, 94, 'out'], [0.54, 50, 'inOut']] }
        : { pata: true, a: [0, 1, 0], b: [0, 0, 1], c: SH, r: 0.46, pole: [-0.8, -0.4, -0.3], keys: [[0, 70, 'out'], [0.1, -20, 'out'], [0.2, 115, 'out'], [0.32, 132, 'out'], [0.54, 100, 'inOut']] }),
    [
      key(0, TI()),
      key(0.1, TI(kind === 1 ? { hips: [2, 14, 0], spine: [5, 10, 0], chest: [5, 14, 0], head: [-6, -8, 2] } : kind === 2 ? { hips: [-4, -6, 0], spine: [-8, -4, 0], chest: [-8, -6, 0], head: [-6, 6, 0] } : { hips: [2, -20, 0], spine: [5, -10, 0], chest: [4, -12, 0], head: [-6, 14, 2] }), [0, -0.03, 0], 'out'),
      key(0.18, TI(kind === 1
        ? { hips: [2, -14, 0], spine: [5, -10, 0], chest: [4, -16, 0], head: [-6, 14, 2], 'thigh.L': [-22, 0, 5], 'shin.L': [24, 0, 0] }
        : kind === 2
          ? { hips: [10, 4, 0], spine: [12, 2, 0], chest: [8, 2, 0], head: [-10, -2, 0], 'thigh.L': [-34, 0, 5], 'shin.L': [38, 0, 0], 'thigh.R': [16, 0, -5] }
          : { hips: [4, 12, 0], spine: [7, 8, 0], chest: [5, 14, 0], head: [-6, -6, 2], 'thigh.L': [-24, 0, 5], 'shin.L': [26, 0, 0], 'thigh.R': [12, 0, -5] }), [0, kind === 2 ? -0.12 : -0.06, 0.08], 'out'),
      key(0.54, TI(), [0, -0.02, 0], 'inOut'),
    ],
  ),
});

/** the finisher: arm out to her right and a full turn, the blade sweeping the whole circle */
const spin: ClipDef = {
  name: 'tb_cut4', dur: 0.78, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.06, hit: 0.1, combo: 0.5 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@spin': [0, 0, 0] } },
      { t: 0.08, ease: 'out', c: { '@spin': [-24, 0, 0] } },
      { t: 0.46, ease: 'inOut', c: { '@spin': [360, 0, 0] } },
      { t: 0.78, c: { '@spin': [360, 0, 0] } },
    ],
    swingKeys({ pata: true, a: [0, 0, 1], b: [1, -0.05, 0], c: SH, r: 0.48, pole: [-0.6, -0.5, -0.6], keys: [[0, -40, 'out'], [0.08, -80, 'out'], [0.46, -64, 'inOut'], [0.6, 20, 'out'], [0.78, 40, 'inOut']] }),
    [
      key(0, TI()),
      key(0.08, TI({ hips: [4, -10, 0], spine: [6, -4, 0], chest: [4, -6, 0], 'thigh.L': [-20, 0, 8], 'shin.L': [26, 0, 0], 'thigh.R': [12, 0, -8], 'upperarm.L': [-10, 0, 50], 'forearm.L': [-10, 0, 0] }), [0, -0.1, 0], 'out'),
      key(0.46, TI({ hips: [6, 8, 0], spine: [8, 4, 0], chest: [6, 4, 0], 'thigh.L': [-24, 0, 8], 'shin.L': [30, 0, 0], 'thigh.R': [14, 0, -8], 'upperarm.L': [-10, 0, 52], 'forearm.L': [-10, 0, 0] }), [0, -0.12, 0], 'inOut'),
      key(0.78, TI(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** RMB (Tiburón): La Gota — the pata thrust out at the target while the water gathers on it, then loosed */
const gota: ClipDef = {
  name: 'tb_gota', dur: 0.62, fadeIn: 0.05, fadeOut: 0.2, events: { charge: 0.04, fire: 0.3 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(PATA_LOW) },
      { t: 0.14, ease: 'out', c: ik({ p: [-0.18, 0.06, 0.34], dir: [0, 1, 0], edge: [0.04, 0, 1], pole: [-0.8, -0.5, -0.2] }) },
      { t: 0.3, ease: 'out', c: ik(PATA_OUT) },
      { t: 0.4, c: ik({ p: [-0.12, 0.12, 0.44], dir: [0, 1, 0.1], edge: [0.04, -0.1, 1], pole: [-0.8, -0.5, -0.2] }) },
      { t: 0.62, ease: 'inOut', c: ik(PATA_LOW) },
    ],
    [
      key(0, TI()),
      key(0.14, TI({ hips: [0, -16, 0], spine: [2, -8, 0], chest: [0, -10, 0], head: [-4, 12, 0], 'upperarm.L': [-30, 0, 24], 'forearm.L': [-40, 0, 0] }), [0, -0.04, 0], 'out'),
      key(0.3, TI({ hips: [4, 10, 0], spine: [6, 6, 0], chest: [4, 8, 0], head: [-6, -6, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [32, 0, 0], 'thigh.R': [16, 0, -6], 'upperarm.L': [20, 0, 24], 'forearm.L': [-30, 0, 0] }), [0, -0.08, 0.08], 'out'),
      key(0.62, TI(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** Q (Tiburón): Trident — a beat of stillness, then three cuts in quick succession, each throwing a blade of water */
const trident: ClipDef = {
  name: 'tb_trident', dur: 1.05, fadeIn: 0.06, fadeOut: 0.22, events: { glow: 0.06, fire1: 0.26, fire2: 0.46, fire3: 0.66 },
  keys: mergeKeys(
    swingKeys({ pata: true, a: [0, 0, 1], b: [1, -0.12, 0], c: SH, r: 0.46, pole: [-0.6, -0.5, -0.6], keys: [[0, -40, 'out'], [0.16, -110, 'inOut'], [0.26, 34, 'out'], [0.34, 60, 'out'], [0.46, -70, 'out'], [0.54, -96, 'out'], [0.66, 30, 'out'], [1.05, 40, 'inOut']] }),
    [
      key(0, TI()),
      key(0.16, TI({ hips: [2, -22, 0], spine: [5, -10, 0], chest: [4, -12, 0], head: [-6, 16, 2] }), [0, -0.04, 0], 'inOut'),
      key(0.26, TI({ hips: [4, 12, 0], spine: [7, 8, 0], chest: [5, 14, 0], head: [-6, -6, 2], 'thigh.L': [-24, 0, 5], 'shin.L': [26, 0, 0], 'thigh.R': [12, 0, -5] }), [0, -0.06, 0.04], 'out'),
      key(0.46, TI({ hips: [2, -14, 0], spine: [5, -8, 0], chest: [4, -12, 0], head: [-6, 12, 2], 'thigh.L': [-24, 0, 5], 'shin.L': [26, 0, 0], 'thigh.R': [12, 0, -5] }), [0, -0.06, 0.06], 'out'),
      key(0.66, TI({ hips: [6, 14, 0], spine: [8, 10, 0], chest: [6, 14, 0], head: [-8, -8, 2], 'thigh.L': [-32, 0, 5], 'shin.L': [34, 0, 0], 'thigh.R': [16, 0, -5] }), [0, -0.1, 0.1], 'out'),
      key(1.05, TI(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** E (Tiburón): Cascada — the pata raised to her right, swept down and held out while the torrent pours */
const cascada: ClipDef = {
  name: 'tb_cascada', dur: 1.9, fadeIn: 0.08, fadeOut: 0.3, events: { surge: 0.34 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(PATA_LOW) },
      { t: 0.24, ease: 'inOut', c: ik({ p: [-0.32, 0.42, 0.06], dir: [0, 0.3, 0.95], edge: [-0.3, 0.9, -0.3], pole: [-0.9, -0.2, -0.3] }) },
      { t: 0.36, ease: 'out', c: ik({ p: [-0.1, 0.02, 0.48], dir: [0, 0.96, -0.28], edge: [0.05, 0.28, 0.96], pole: [-0.8, -0.5, -0.2] }) },
      { t: 1.5, c: ik({ p: [-0.1, 0.04, 0.48], dir: [0, 0.96, -0.28], edge: [0.05, 0.28, 0.96], pole: [-0.8, -0.5, -0.2] }) },
      { t: 1.9, ease: 'inOut', c: ik(PATA_LOW) },
    ],
    [
      key(0, TI()),
      key(0.24, TI({ hips: [-2, -20, 0], spine: [-4, -10, 0], chest: [-6, -12, 0], head: [-6, 14, 0], 'upperarm.L': [-30, 0, 30], 'forearm.L': [-20, 0, 0] }), [0, 0, -0.02], 'inOut'),
      key(0.36, TI({ hips: [6, 6, 0], spine: [8, 4, 0], chest: [6, 4, 0], head: [-8, -4, 0], 'thigh.L': [-36, 0, 8], 'shin.L': [40, 0, 0], 'thigh.R': [22, 0, -8], 'shin.R': [20, 0, 0], ...PALM_L_FWD }), [0, -0.12, 0.1], 'out'),
      key(1.5, TI({ hips: [6, 6, 0], spine: [8, 4, 0], chest: [6, 4, 0], head: [-8, -4, 0], 'thigh.L': [-36, 0, 8], 'shin.L': [40, 0, 0], 'thigh.R': [22, 0, -8], 'shin.R': [20, 0, 0], ...PALM_L_FWD }), [0, -0.12, 0.1], 'linear'),
      key(1.9, TI(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** R (Tiburón): Hirviendo — the blade held out, the left palm behind it; whatever water comes boils away */
const hirviendo: ClipDef = {
  name: 'tb_hirviendo', dur: 0.4, fadeIn: 0.08, fadeOut: 0.22,
  keys: mergeKeys(
    [{ t: 0, c: ik(PATA_LOW) }, { t: 0.2, ease: 'out', c: ik(PATA_GUARD) }, { t: 0.4, c: ik(PATA_GUARD) }],
    [
      key(0, TI()),
      key(0.2, TI({ hips: [2, -6, 0], spine: [4, -2, 0], chest: [2, -4, 0], head: [-4, 4, 0], 'thigh.L': [-20, 0, 8], 'shin.L': [22, 0, 0], 'thigh.R': [12, 0, -8], 'shin.R': [12, 0, 0], ...PALM_L_FWD }), [0, -0.08, 0.02], 'out'),
      key(0.4, TI({ hips: [2, -6, 0], spine: [4, -2, 0], chest: [2, -4, 0], head: [-4, 4, 0], 'thigh.L': [-20, 0, 8], 'shin.L': [22, 0, 0], 'thigh.R': [12, 0, -8], 'shin.R': [12, 0, 0], ...PALM_L_FWD }), [0, -0.08, 0.02], 'linear'),
    ],
  ),
};

/** G (Tiburón): the arc Cero — the pata held out flat to her right while it charges, then swept across */
const tcero: ClipDef = {
  name: 'tb_cero', dur: 1.15, fadeIn: 0.08, fadeOut: 0.26, events: { charge: 0.1, fire: 0.6 },
  keys: mergeKeys(
    swingKeys({ pata: true, a: [0, 0, 1], b: [1, -0.04, 0], c: SH, r: 0.48, pole: [-0.6, -0.5, -0.5], keys: [[0, -40, 'out'], [0.16, -100, 'inOut'], [0.54, -104, 'inOut'], [0.64, 30, 'out'], [0.78, 100, 'out'], [1.15, 50, 'inOut']] }),
    [
      key(0, TI()),
      key(0.16, TI({ hips: [0, -22, 0], spine: [2, -10, 0], chest: [0, -12, 0], head: [-4, 20, 0], 'upperarm.L': [-20, 0, 40], 'forearm.L': [-16, 0, 0], 'thigh.L': [-14, 0, 10], 'shin.L': [12, 0, 0], 'thigh.R': [8, 0, -10] }), [0, -0.06, 0], 'inOut'),
      key(0.54, TI({ hips: [0, -24, 0], spine: [2, -11, 0], chest: [0, -13, 0], head: [-4, 22, 0], 'upperarm.L': [-22, 0, 42], 'forearm.L': [-16, 0, 0], 'thigh.L': [-14, 0, 10], 'shin.L': [12, 0, 0], 'thigh.R': [8, 0, -10] }), [0, -0.07, 0], 'linear'),
      key(0.64, TI({ hips: [6, 20, 0], spine: [8, 12, 0], chest: [6, 16, 0], head: [-8, -12, 0], 'upperarm.L': [10, 0, 30], 'forearm.L': [-20, 0, 0], 'thigh.L': [-36, 0, 8], 'shin.L': [38, 0, 0], 'thigh.R': [22, 0, -8], 'shin.R': [18, 0, 0] }), [0, -0.14, 0.12], 'out'),
      key(1.15, TI(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** F (Tiburón): Cascada Real — the pata raised to the sky, held while it gathers, then brought down */
const real: ClipDef = {
  name: 'tb_real', dur: 1.7, fadeIn: 0.1, fadeOut: 0.3, events: { call: 0.3, drop: 1.0 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(PATA_LOW) },
      { t: 0.3, ease: 'inOut', c: ik(PATA_SKY) },
      { t: 0.9, c: ik({ ...PATA_SKY, p: [-0.16, 0.68, 0.1] }) },
      { t: 1.04, ease: 'out', c: ik({ p: [-0.1, -0.06, 0.48], dir: [0, 0.6, -0.8], edge: [0.05, -0.8, 0.6], pole: [-0.8, -0.5, -0.2] }) },
      { t: 1.7, ease: 'inOut', c: ik(PATA_LOW) },
    ],
    [
      key(0, TI()),
      key(0.3, TI({ hips: [-2, 0, 0], spine: [-6, 0, 0], chest: [-8, 0, 0], head: [-14, 0, 0], neck: [-6, 0, 0], 'upperarm.L': [10, 0, 24], 'thigh.L': [-6, 0, 8], 'thigh.R': [6, 0, -8] }), [0, 0.01, 0], 'inOut'),
      key(0.9, TI({ hips: [-2, 0, 0], spine: [-7, 0, 0], chest: [-9, 0, 0], head: [-16, 0, 0], neck: [-6, 0, 0], 'upperarm.L': [10, 0, 26], 'thigh.L': [-6, 0, 8], 'thigh.R': [6, 0, -8] }), [0, 0.01, 0], 'linear'),
      key(1.04, TI({ hips: [10, 4, 0], spine: [12, 2, 0], chest: [10, 2, 0], head: [-10, 0, 0], 'thigh.L': [-40, 0, 8], 'shin.L': [46, 0, 0], 'thigh.R': [24, 0, -8], 'shin.R': [26, 0, 0] }), [0, -0.16, 0.08], 'out'),
      key(1.7, TI(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

export const HARRIBEL_CLIPS: ClipDef[] = [
  cut1, cut2, cut3, cut4, cut5, regrip, heavy, ola, cero, read, counter, unzip, release,
  burst, tcut('tb_cut1', 0), tcut('tb_cut2', 1), tcut('tb_cut3', 2), spin, gota, trident, cascada, hirviendo, tcero, real,
  ...ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name)),
];
export const HARRIBEL_CHAIN = ['hb_cut1', 'hb_cut2', 'hb_cut3', 'hb_cut4', 'hb_cut5'];
export const TIBURON_CHAIN = ['tb_cut1', 'tb_cut2', 'tb_cut3', 'tb_cut4'];
/** the chain cuts swung by her left hand */
export const LEFT_CUTS = new Set(['hb_cut3', 'hb_cut4']);
