// Yhwach's animation set. An upright, unhurried emperor: the chest out, the head level, the left hand on his
// hip and the Reishi sword held low in the right. Measured one-hand cuts (a diagonal, a backhand, a thrust)
// and the off-hand seizing a throat and driving it into the floor; the broadsword drawn from a sky-slash
// (the arrow falls, he pulls it out) and the diagonal bisecting stroke; the finger levelled for Heilig Pfeil;
// a hand raised to the sky for Sankt Bogen; the open hand toward the target for Qual Kreis; the palm out for
// Blut Vene Anhaben; the bowed head lifting as The Almighty wakes; and the Soul King's gestures (arms flung
// wide as the eyes open, the sweep that sends the Black, both hands before him for the Zeichen).
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys, type SwingDef } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });
interface Grip { p: E; dir: E; edge: E; pole: E }
const ik = (g: Grip, two = 0) => ({ '@gripR': g.p, '@dirR': g.dir, '@edgeR': g.edge, '@poleR': g.pole, '@ikR': [1, 0, 0] as E, '@twoHand': [two, 0, 0] as E });

/** upright: the chest out, the chin level; the left hand on the hip */
const HAND_ON_HIP: Record<string, E> = { 'upperarm.L': [12, 0, 34], 'forearm.L': [-86, 0, 0], 'hand.L': [0, 0, -12] };
const IDLE: Record<string, E> = {
  hips: [0, -4, 0], spine: [-2, 2, 0], chest: [-4, 2, 0], neck: [2, 0, 0], head: [-2, -4, 0],
  'thigh.L': [-3, 0, 4], 'shin.L': [4, 0, 0], 'thigh.R': [3, 0, -3], 'shin.R': [6, 0, 0], 'foot.R': [-3, 0, 2],
  ...HAND_ON_HIP,
};
const I = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });

/** the sword held low at his right side, the point toward the ground ahead */
const LOW: Grip = { p: [-0.3, -0.42, 0.14], dir: [-0.15, -0.55, 0.82], edge: [0, -0.82, -0.57], pole: [-0.6, -0.3, -0.75] };

export const YHWACH_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.015,
  run: { spine: [8, 0, 0], chest: [2, 0, 0], head: [-6, 0, 0], ...HAND_ON_HIP },
  sprint: { spine: [16, 0, 0], chest: [4, 0, 0], head: [-10, 0, 0], 'upperarm.L': [26, 0, 12], 'forearm.L': [-40, 0, 0] },
  swingL: 0.05,
  swingR: 0.08,
  freqScale: 0.9,
  grip: {
    idle: LOW,
    walk: LOW,
    run: { p: [-0.3, -0.24, -0.08], dir: [-0.2, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.32, -0.14, -0.18], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.4, -0.08, 0.1], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

/** the Soul King: the arms loose and a little out, the Black hanging off them; the broadsword low */
export const YHWACH_BLACK_STANCE: StanceDef = {
  ...YHWACH_STANCE,
  idle: { ...IDLE, 'upperarm.L': [-6, 0, 18], 'forearm.L': [-20, 0, 0], 'hand.L': [0, 0, 0], head: [2, -4, 0] },
  run: { spine: [10, 0, 0], chest: [2, 0, 0], head: [-6, 0, 0], 'upperarm.L': [10, 0, 16], 'forearm.L': [-30, 0, 0] },
};

function cut(name: string, o: {
  dur: number; step: number; hit: number; combo?: number;
  swing: Omit<SwingDef, 'keys'> & { keys: [number, number, KeyDef['ease']?][] };
  wind: Record<string, E>; strike: Record<string, E>; strikeHips?: E; windHips?: E;
}): ClipDef {
  const tFollow = o.swing.keys[o.swing.keys.length - 2]?.[0] ?? o.hit + 0.12;
  return {
    name, dur: o.dur, fadeIn: 0.05, fadeOut: 0.22, events: { step: o.step, hit: o.hit, ...(o.combo !== undefined ? { combo: o.combo } : {}) },
    keys: mergeKeys(
      swingKeys(o.swing as SwingDef),
      [
        key(0, I()),
        key(o.swing.keys[1][0], I(o.wind), o.windHips ?? [0, -0.03, -0.02], 'out'),
        key(o.swing.keys[2][0], I(o.strike), o.strikeHips ?? [0, -0.05, 0.05], 'out'),
        key(tFollow, I(o.strike), o.strikeHips ?? [0, -0.05, 0.05], 'out'),
        key(o.dur, I(), [0, -0.015, 0], 'inOut'),
      ],
    ),
  };
}

// ------------------------------------------------------------------ the sword

/** LMB 1: a measured diagonal, high on his right down across to his left */
const cut1 = cut('yh_cut1', {
  dur: 0.62, step: 0.06, hit: 0.17, combo: 0.3,
  swing: { a: [0, 0, 1], b: [-0.7, 0.7, 0], c: [-0.08, 0.16, 0.08], r: 0.48, pole: [-0.4, -0.6, -0.7], keys: [[0, -40, 'out'], [0.1, -150, 'out'], [0.2, 40, 'out'], [0.32, 90, 'out'], [0.62, 50, 'inOut']] },
  wind: { hips: [0, -14, 0], chest: [-2, -12, 0], head: [-2, 8, 0] },
  strike: { hips: [2, 14, 0], spine: [4, 6, 0], chest: [4, 14, 0], head: [-2, -10, 0], 'thigh.L': [-20, 0, 4], 'shin.L': [20, 0, 0] },
});
/** LMB 2: the backhand, low on his left rising to his right */
const cut2 = cut('yh_cut2', {
  dur: 0.62, step: 0.06, hit: 0.17, combo: 0.3,
  swing: { a: [0, 0, 1], b: [0.8, 0.5, 0], c: [-0.06, 0.06, 0.08], r: 0.48, pole: [-0.6, -0.5, -0.5], keys: [[0, -40, 'out'], [0.1, -150, 'out'], [0.2, 40, 'out'], [0.32, 96, 'out'], [0.62, 50, 'inOut']] },
  wind: { hips: [0, 16, 0], chest: [0, 14, 0], head: [-2, -10, 0] },
  strike: { hips: [2, -14, 0], spine: [4, -8, 0], chest: [2, -14, 0], head: [-4, 10, 0], 'thigh.L': [-22, 0, 4], 'shin.L': [22, 0, 0] },
});
/** LMB 3: the thrust, the whole height behind it */
const cut3: ClipDef = {
  name: 'yh_cut3', dur: 0.62, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.08, hit: 0.18, combo: 0.3 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(LOW) },
      { t: 0.09, ease: 'inOut', c: ik({ p: [-0.26, -0.02, -0.14], dir: [0, 0.05, 1], edge: [0, -1, 0.05], pole: [-0.9, -0.2, -0.3] }) },
      { t: 0.18, ease: 'out', c: ik({ p: [-0.06, 0.1, 0.62], dir: [0.04, 0.1, 0.99], edge: [0, -1, 0.1], pole: [-0.8, -0.5, 0] }) },
      { t: 0.34, ease: 'out', c: ik({ p: [-0.08, 0.09, 0.58], dir: [0.04, 0.1, 0.99], edge: [0, -1, 0.1], pole: [-0.8, -0.5, 0] }) },
      { t: 0.62, ease: 'inOut', c: ik(LOW) },
    ],
    [
      key(0, I()),
      key(0.09, I({ hips: [0, -20, 0], chest: [0, -12, 0], head: [-2, 14, 0] }), [0, -0.04, -0.02], 'inOut'),
      key(0.18, I({ hips: [6, 10, 0], spine: [8, 6, 0], chest: [4, 8, 0], head: [-8, -8, 0], 'thigh.L': [-40, 0, 4], 'shin.L': [42, 0, 0], 'thigh.R': [22, 0, -3], 'shin.R': [16, 0, 0] }), [0, -0.12, 0.16], 'out'),
      key(0.34, I({ hips: [6, 10, 0], spine: [8, 6, 0], chest: [4, 8, 0], head: [-8, -8, 0], 'thigh.L': [-40, 0, 4], 'shin.L': [42, 0, 0], 'thigh.R': [22, 0, -3], 'shin.R': [16, 0, 0] }), [0, -0.12, 0.16], 'out'),
      key(0.62, I(), [0, -0.015, 0], 'inOut'),
    ],
  ),
};
/** LMB 4: the off hand takes them by the throat and drives them down into the floor */
const grab: ClipDef = {
  name: 'yh_grab', dur: 0.9, fadeIn: 0.05, fadeOut: 0.24, events: { step: 0.05, grab: 0.16, slam: 0.42 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 0.9, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.16, I({ hips: [6, 10, 0], spine: [6, 4, 0], chest: [4, 8, 0], 'upperarm.L': [-84, -10, 6], 'forearm.L': [-10, 0, 0], 'hand.L': [10, 0, 0], 'thigh.L': [-30, 0, 4], 'shin.L': [30, 0, 0] }), [0, -0.06, 0.12], 'out'),
      key(0.3, I({ hips: [-4, 6, 0], spine: [-6, 4, 0], chest: [-6, 6, 0], 'upperarm.L': [-150, -6, 6], 'forearm.L': [-14, 0, 0], 'hand.L': [10, 0, 0], 'thigh.L': [-20, 0, 4], 'shin.L': [20, 0, 0] }), [0, 0, 0.06], 'inOut'),
      key(0.42, I({ hips: [20, 6, 0], spine: [20, 4, 0], chest: [12, 6, 0], head: [8, 0, 0], 'upperarm.L': [-40, -6, 6], 'forearm.L': [-6, 0, 0], 'hand.L': [30, 0, 0], 'thigh.L': [-50, 0, 4], 'shin.L': [60, 0, 0], 'thigh.R': [10, 0, -3], 'shin.R': [40, 0, 0] }), [0, -0.3, 0.14], 'out'),
      key(0.62, I({ hips: [16, 6, 0], spine: [16, 4, 0], chest: [10, 6, 0], head: [6, 0, 0], 'upperarm.L': [-36, -6, 6], 'forearm.L': [-6, 0, 0], 'hand.L': [30, 0, 0], 'thigh.L': [-46, 0, 4], 'shin.L': [56, 0, 0], 'thigh.R': [8, 0, -3], 'shin.R': [36, 0, 0] }), [0, -0.28, 0.14], 'linear'),
      key(0.9, I(), [0, -0.015, 0], 'inOut'),
    ],
  ),
};

/**
 * RMB: the broadsword — a slash at the sky (a bow of light forms above and its arrow falls before him), he
 * pulls it from the ground two-handed, and the long diagonal stroke that bisects.
 */
const broad: ClipDef = {
  name: 'yh_broad', dur: 1.5, fadeIn: 0.06, fadeOut: 0.3, events: { sky: 0.18, pull: 0.62, step: 0.82, hit: 0.98 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(LOW) },
      { t: 0.1, ease: 'inOut', c: ik({ p: [-0.3, -0.1, 0.2], dir: [-0.6, -0.6, 0.5], edge: [0, -0.6, -0.8], pole: [-0.6, -0.5, -0.6] }) },
      { t: 0.2, ease: 'out', c: ik({ p: [-0.24, 0.5, 0.18], dir: [0.3, 0.9, 0.3], edge: [0.6, -0.3, 0.7], pole: [-0.8, -0.4, -0.3] }) },
      { t: 0.42, ease: 'inOut', c: ik({ p: [-0.24, 0.46, 0.16], dir: [0.3, 0.9, 0.3], edge: [0.6, -0.3, 0.7], pole: [-0.8, -0.4, -0.3] }) },
      // down to the hilt standing in the ground before him
      { t: 0.62, ease: 'inOut', c: ik({ p: [-0.08, -0.16, 0.44], dir: [0, 1, 0.05], edge: [0, 0, 1], pole: [-0.8, -0.4, -0.3] }, 1) },
      // up and back over the right shoulder (the swing takes it from here)
    ],
    swingKeys({ a: [0, 0, 1], b: [-0.75, 0.66, 0], c: [-0.06, 0.18, 0.06], r: 0.5, pole: [-0.5, -0.6, -0.6], twoHand: [1, 1, 1, 1, 0], keys: [[0.74, 120, 'inOut'], [0.86, 165, 'inOut'], [1.0, -20, 'out'], [1.16, -70, 'out'], [1.5, -40, 'inOut']] }),
    [
      key(0, I()),
      key(0.2, I({ hips: [-2, -6, 0], chest: [-8, -6, 0], head: [-14, 4, 0] }), [0, 0, 0], 'out'),
      key(0.42, I({ hips: [-2, -6, 0], chest: [-8, -6, 0], head: [-10, 4, 0] }), [0, 0, 0], 'linear'),
      key(0.62, I({ hips: [10, 0, 0], spine: [12, 0, 0], chest: [8, 0, 0], head: [4, 0, 0], 'upperarm.L': [-60, 20, -10], 'forearm.L': [-40, 0, 0], 'thigh.L': [-34, 0, 4], 'shin.L': [44, 0, 0], 'thigh.R': [12, 0, -3], 'shin.R': [30, 0, 0] }), [0, -0.12, 0.1], 'inOut'),
      key(0.86, I({ hips: [-4, -20, 0], spine: [-4, -10, 0], chest: [-6, -18, 0], head: [-4, 16, 0], 'upperarm.L': [-110, 30, -20], 'forearm.L': [-50, 0, 0] }), [0, 0, -0.04], 'inOut'),
      key(1.0, I({ hips: [10, 8, 0], spine: [12, 4, 0], chest: [10, 8, 0], head: [-6, -8, 0], 'upperarm.L': [-60, 20, -10], 'forearm.L': [-40, 0, 0], 'thigh.L': [-46, 0, 4], 'shin.L': [52, 0, 0], 'thigh.R': [26, 0, -3], 'shin.R': [22, 0, 0] }), [0, -0.16, 0.24], 'out'),
      key(1.16, I({ hips: [10, 8, 0], spine: [12, 4, 0], chest: [10, 8, 0], head: [-6, -8, 0], 'upperarm.L': [-50, 20, -10], 'forearm.L': [-40, 0, 0], 'thigh.L': [-46, 0, 4], 'shin.L': [52, 0, 0], 'thigh.R': [26, 0, -3], 'shin.R': [22, 0, 0] }), [0, -0.16, 0.24], 'out'),
      key(1.5, I(), [0, -0.015, 0], 'inOut'),
    ],
  ),
};

// ------------------------------------------------------------------ Heilig Pfeil, Sankt Bogen, Qual Kreis

/** the left arm levelled, the index finger out: the arrows fly from the fingertip */
const POINT: Record<string, E> = { 'upperarm.L': [-88, -14, 4], 'forearm.L': [-4, 0, 0], 'hand.L': [0, 0, 0] };
/** Q: Heilig Pfeil from the finger, a fast barrage */
const finger: ClipDef = {
  name: 'yh_finger', dur: 0.95, fadeIn: 0.06, fadeOut: 0.24, events: { fire: 0.16 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 0.95, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.14, I({ hips: [0, 14, 0], chest: [0, 12, 0], head: [-2, -8, 0], ...POINT }), [0, 0, 0], 'out'),
      key(0.7, I({ hips: [0, 14, 0], chest: [0, 12, 0], head: [-2, -8, 0], ...POINT, 'upperarm.L': [-86, -14, 4] }), [0, 0, 0], 'linear'),
      key(0.95, I(), [0, -0.015, 0], 'inOut'),
    ],
  ),
};

/** E: Sankt Bogen — the hand raised to the sky where the great bow forms, then brought down at the target */
const bogen: ClipDef = {
  name: 'yh_bogen', dur: 1.25, fadeIn: 0.06, fadeOut: 0.26, events: { summon: 0.28, fire: 0.7 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 1.25, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.28, I({ chest: [-6, 4, 0], head: [-16, 0, 0], 'upperarm.L': [-160, -10, 10], 'forearm.L': [-10, 0, 0], 'hand.L': [0, 0, 0] }), [0, 0, 0], 'out'),
      key(0.62, I({ chest: [-6, 4, 0], head: [-14, 0, 0], 'upperarm.L': [-162, -10, 10], 'forearm.L': [-10, 0, 0], 'hand.L': [0, 0, 0] }), [0, 0, 0], 'linear'),
      key(0.72, I({ hips: [0, 10, 0], chest: [2, 10, 0], head: [-2, -6, 0], ...POINT }), [0, 0, 0.02], 'out'),
      key(1.25, I(), [0, -0.015, 0], 'inOut'),
    ],
  ),
};

/** R: Qual Kreis — the open hand toward the target, fingers spread: the crackle, the bows, the crossfire */
const kreis: ClipDef = {
  name: 'yh_kreis', dur: 1.45, fadeIn: 0.06, fadeOut: 0.28, events: { crackle: 0.16, bows: 0.55, fire: 0.95 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 1.45, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.16, I({ hips: [0, 10, 0], chest: [-2, 8, 0], head: [-4, -6, 0], 'upperarm.L': [-80, -22, 8], 'forearm.L': [-12, 0, 0], 'hand.L': [-30, 0, 0] }), [0, 0, 0], 'out'),
      key(0.9, I({ hips: [0, 10, 0], chest: [-2, 8, 0], head: [-4, -6, 0], 'upperarm.L': [-82, -22, 8], 'forearm.L': [-10, 0, 0], 'hand.L': [-30, 0, 0] }), [0, 0, 0], 'linear'),
      // the hand closes: the arrows fly
      key(0.98, I({ hips: [0, 10, 0], chest: [0, 8, 0], head: [-2, -6, 0], 'upperarm.L': [-74, -22, 8], 'forearm.L': [-30, 0, 0], 'hand.L': [10, 0, 0] }), [0, 0, 0], 'out'),
      key(1.45, I(), [0, -0.015, 0], 'inOut'),
    ],
  ),
};

/** G: Blut Vene Anhaben — the left palm pushed out, the shell of veins swelling from it */
const anhaben: ClipDef = {
  name: 'yh_anhaben', dur: 0.8, fadeIn: 0.05, fadeOut: 0.22, events: { shell: 0.22 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 0.8, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.22, I({ hips: [0, 8, 0], chest: [-2, 6, 0], 'upperarm.L': [-76, -16, 6], 'forearm.L': [-14, 0, 0], 'hand.L': [-50, 0, 0] }), [0, -0.02, 0.02], 'out'),
      key(0.55, I({ hips: [0, 8, 0], chest: [-2, 6, 0], 'upperarm.L': [-76, -16, 6], 'forearm.L': [-14, 0, 0], 'hand.L': [-50, 0, 0] }), [0, -0.02, 0.02], 'linear'),
      key(0.8, I(), [0, -0.015, 0], 'inOut'),
    ],
  ),
};

// ------------------------------------------------------------------ The Almighty

/** F: the head bowed, the eyes shut — then lifted, and the eyes open (the pupils split) */
const awaken: ClipDef = {
  name: 'yh_awaken', dur: 1.7, fadeIn: 0.08, fadeOut: 0.3, events: { open: 0.8 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 1.7, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.4, I({ spine: [6, 0, 0], chest: [6, 0, 0], neck: [10, 0, 0], head: [18, 0, 0] }), [0, -0.02, 0], 'inOut'),
      key(0.7, I({ spine: [6, 0, 0], chest: [6, 0, 0], neck: [10, 0, 0], head: [20, 0, 0] }), [0, -0.02, 0], 'linear'),
      key(0.86, I({ spine: [-4, 0, 0], chest: [-8, 0, 0], neck: [-4, 0, 0], head: [-10, 0, 0], 'upperarm.L': [0, 0, 40], 'forearm.L': [-20, 0, 0], 'hand.L': [0, 0, 0] }), [0, 0.01, 0], 'out'),
      key(1.3, I({ spine: [-4, 0, 0], chest: [-8, 0, 0], neck: [-4, 0, 0], head: [-8, 0, 0], 'upperarm.L': [0, 0, 38], 'forearm.L': [-20, 0, 0], 'hand.L': [0, 0, 0] }), [0, 0.01, 0], 'linear'),
      key(1.7, I(), [0, -0.015, 0], 'inOut'),
    ],
  ),
};

/** E (Almighty): the Rewrite — the palm raised at the target, then the fist closing on its future */
const rewrite: ClipDef = {
  name: 'yh_rewrite', dur: 0.9, fadeIn: 0.05, fadeOut: 0.24, events: { close: 0.38 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 0.9, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.24, I({ chest: [-2, 6, 0], head: [-4, -4, 0], 'upperarm.L': [-96, -20, 6], 'forearm.L': [-30, 0, 0], 'hand.L': [-40, 0, 0] }), [0, 0, 0], 'out'),
      key(0.38, I({ chest: [0, 6, 0], head: [-4, -4, 0], 'upperarm.L': [-90, -20, 6], 'forearm.L': [-50, 0, 0], 'hand.L': [20, 0, 0] }), [0, 0, 0], 'out'),
      key(0.62, I({ chest: [0, 6, 0], head: [-4, -4, 0], 'upperarm.L': [-90, -20, 6], 'forearm.L': [-50, 0, 0], 'hand.L': [20, 0, 0] }), [0, 0, 0], 'linear'),
      key(0.9, I(), [0, -0.015, 0], 'inOut'),
    ],
  ),
};

/** R (Almighty): the future wound — a short level stroke at nothing; the wound comes later */
const wound = cut('yh_wound', {
  dur: 0.6, step: 0.04, hit: 0.14,
  swing: { a: [0, 0, 1], b: [1, 0, 0], c: [-0.1, 0.1, 0.06], r: 0.48, pole: [-0.5, -0.6, -0.6], keys: [[0, -60, 'out'], [0.08, -130, 'out'], [0.18, 50, 'out'], [0.3, 90, 'out'], [0.6, 50, 'inOut']] },
  wind: { hips: [0, -18, 0], chest: [0, -14, 0], head: [-2, 10, 0] },
  strike: { hips: [0, 16, 0], spine: [2, 8, 0], chest: [2, 16, 0], head: [-2, -12, 0] },
});

/** G (Almighty): Traps of Fate — the hand swept down at the ground where they will be */
const traps: ClipDef = {
  name: 'yh_traps', dur: 0.9, fadeIn: 0.05, fadeOut: 0.24, events: { spike: 0.3 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 0.9, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.18, I({ chest: [-4, 6, 0], 'upperarm.L': [-120, -20, 10], 'forearm.L': [-20, 0, 0], 'hand.L': [0, 0, 0] }), [0, 0, 0], 'out'),
      key(0.3, I({ hips: [4, 8, 0], chest: [6, 8, 0], head: [6, -6, 0], 'upperarm.L': [-40, -20, 10], 'forearm.L': [-6, 0, 0], 'hand.L': [30, 0, 0] }), [0, -0.04, 0.04], 'out'),
      key(0.55, I({ hips: [4, 8, 0], chest: [6, 8, 0], head: [6, -6, 0], 'upperarm.L': [-38, -20, 10], 'forearm.L': [-6, 0, 0], 'hand.L': [30, 0, 0] }), [0, -0.04, 0.04], 'linear'),
      key(0.9, I(), [0, -0.015, 0], 'inOut'),
    ],
  ),
};

// ------------------------------------------------------------------ the Soul King

/** F (Almighty): absorbing the King — arms flung wide, the head thrown back while the Black pours over him */
const soulking: ClipDef = {
  name: 'yh_soulking', dur: 1.8, fadeIn: 0.08, fadeOut: 0.3, events: { rise: 0.5, black: 1.0 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 0.3, c: { '@ikR': [0, 0, 0] } }, { t: 1.5, c: { '@ikR': [0, 0, 0] } }, { t: 1.8, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.5, I({ spine: [-6, 0, 0], chest: [-12, 0, 0], neck: [-8, 0, 0], head: [-20, 0, 0], 'upperarm.L': [-10, 0, 70], 'forearm.L': [-10, 0, 0], 'hand.L': [0, 0, 0], 'upperarm.R': [-10, 0, -70], 'forearm.R': [-10, 0, 0] }), [0, 0.02, 0], 'out'),
      key(1.2, I({ spine: [-6, 0, 0], chest: [-12, 0, 0], neck: [-8, 0, 0], head: [-18, 0, 0], 'upperarm.L': [-14, 0, 74], 'forearm.L': [-10, 0, 0], 'hand.L': [0, 0, 0], 'upperarm.R': [-14, 0, -74], 'forearm.R': [-10, 0, 0] }), [0, 0.02, 0], 'linear'),
      key(1.8, I(), [0, -0.015, 0], 'inOut'),
    ],
  ),
};

/** Q (Soul King): the eyes open all over the Black — arms out, chest forward — and the beams fly */
const beams: ClipDef = {
  name: 'yh_beams', dur: 1.35, fadeIn: 0.06, fadeOut: 0.28, events: { open: 0.22, fire: 0.55 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 1.35, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.22, I({ chest: [-6, 0, 0], head: [-8, 0, 0], 'upperarm.L': [-30, 0, 56], 'forearm.L': [-16, 0, 0], 'hand.L': [0, 0, 0] }), [0, 0, 0], 'out'),
      key(0.55, I({ hips: [4, 0, 0], chest: [6, 0, 0], head: [2, 0, 0], 'upperarm.L': [-50, 0, 50], 'forearm.L': [-10, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.02, 0.04], 'out'),
      key(1.0, I({ hips: [4, 0, 0], chest: [6, 0, 0], head: [2, 0, 0], 'upperarm.L': [-50, 0, 50], 'forearm.L': [-10, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.02, 0.04], 'linear'),
      key(1.35, I(), [0, -0.015, 0], 'inOut'),
    ],
  ),
};

/** E/RMB (Soul King): the sweep of the hand that sends the Black (a wave, the spikes, the swarm) */
const sweep: ClipDef = {
  name: 'yh_sweep', dur: 0.95, fadeIn: 0.05, fadeOut: 0.24, events: { send: 0.3 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 0.95, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.16, I({ hips: [0, -14, 0], chest: [0, -12, 0], 'upperarm.L': [-60, 30, 40], 'forearm.L': [-30, 0, 0], 'hand.L': [0, 0, 0] }), [0, 0, 0], 'out'),
      key(0.3, I({ hips: [2, 14, 0], chest: [2, 14, 0], 'upperarm.L': [-80, -40, 10], 'forearm.L': [-6, 0, 0], 'hand.L': [-20, 0, 0], 'thigh.L': [-20, 0, 4], 'shin.L': [20, 0, 0] }), [0, -0.03, 0.06], 'out'),
      key(0.6, I({ hips: [2, 14, 0], chest: [2, 14, 0], 'upperarm.L': [-80, -40, 10], 'forearm.L': [-6, 0, 0], 'hand.L': [-20, 0, 0], 'thigh.L': [-20, 0, 4], 'shin.L': [20, 0, 0] }), [0, -0.03, 0.06], 'linear'),
      key(0.95, I(), [0, -0.015, 0], 'inOut'),
    ],
  ),
};

/** R (Soul King): the Zeichen — both hands before him while the eye-pillars gather, then the blast */
const zeichen: ClipDef = {
  name: 'yh_zeichen', dur: 2.2, fadeIn: 0.08, fadeOut: 0.3, events: { form: 0.2, fire: 1.45 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 0.2, c: { '@ikR': [0, 0, 0] } }, { t: 1.9, c: { '@ikR': [0, 0, 0] } }, { t: 2.2, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.2, I({ chest: [-4, 0, 0], head: [-4, 0, 0], 'upperarm.L': [-80, -24, 10], 'forearm.L': [-20, 0, 0], 'hand.L': [-40, 0, 0], 'upperarm.R': [-80, 24, -10], 'forearm.R': [-20, 0, 0], 'hand.R': [-40, 0, 0] }), [0, 0, 0], 'out'),
      key(1.4, I({ chest: [-4, 0, 0], head: [-4, 0, 0], 'upperarm.L': [-84, -24, 10], 'forearm.L': [-16, 0, 0], 'hand.L': [-40, 0, 0], 'upperarm.R': [-84, 24, -10], 'forearm.R': [-16, 0, 0], 'hand.R': [-40, 0, 0] }), [0, 0, 0], 'linear'),
      key(1.5, I({ hips: [-4, 0, 0], chest: [-8, 0, 0], head: [-6, 0, 0], 'upperarm.L': [-90, -24, 10], 'forearm.L': [-8, 0, 0], 'hand.L': [-50, 0, 0], 'upperarm.R': [-90, 24, -10], 'forearm.R': [-8, 0, 0], 'hand.R': [-50, 0, 0], 'thigh.R': [12, 0, -3] }), [0, 0, -0.08], 'out'),
      key(2.2, I(), [0, -0.015, 0], 'inOut'),
    ],
  ),
};

/** G (Soul King): Auswählen — a sphere in the upturned palm that becomes a ring in the sky */
const auswahlen: ClipDef = {
  name: 'yh_auswahlen', dur: 1.6, fadeIn: 0.08, fadeOut: 0.3, events: { sphere: 0.3, ring: 0.85 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 1.6, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.3, I({ chest: [-2, 4, 0], head: [-6, 0, 0], 'upperarm.L': [-60, -10, 20], 'forearm.L': [-60, 0, 0], 'hand.L': [-70, 0, 0] }), [0, 0, 0], 'out'),
      key(0.75, I({ chest: [-2, 4, 0], head: [-10, 0, 0], 'upperarm.L': [-64, -10, 20], 'forearm.L': [-60, 0, 0], 'hand.L': [-70, 0, 0] }), [0, 0, 0], 'linear'),
      key(0.9, I({ chest: [-8, 4, 0], head: [-20, 0, 0], 'upperarm.L': [-170, -10, 10], 'forearm.L': [-6, 0, 0], 'hand.L': [0, 0, 0] }), [0, 0.01, 0], 'out'),
      key(1.25, I({ chest: [-8, 4, 0], head: [-18, 0, 0], 'upperarm.L': [-170, -10, 10], 'forearm.L': [-6, 0, 0], 'hand.L': [0, 0, 0] }), [0, 0.01, 0], 'linear'),
      key(1.6, I(), [0, -0.015, 0], 'inOut'),
    ],
  ),
};

/** LMB 4 (Soul King): the broadsword brought down two-handed, the Black lashing out with it */
const cleave = cut('yh_cleave', {
  dur: 0.8, step: 0.1, hit: 0.27,
  swing: { a: [0, 0, 1], b: [0, 1, 0], c: [-0.06, 0.16, 0.06], r: 0.5, pole: [-0.5, -0.6, -0.6], twoHand: [0, 1, 1, 1, 0], keys: [[0, 30, 'out'], [0.16, 150, 'inOut'], [0.3, -20, 'out'], [0.44, -60, 'out'], [0.8, -30, 'inOut']] },
  wind: { hips: [-4, 0, 0], spine: [-6, 0, 0], chest: [-8, 0, 0], head: [-8, 0, 0], 'upperarm.L': [-150, 20, -10], 'forearm.L': [-40, 0, 0] },
  strike: { hips: [12, 0, 0], spine: [14, 0, 0], chest: [10, 0, 0], head: [2, 0, 0], 'upperarm.L': [-70, 20, -10], 'forearm.L': [-40, 0, 0], 'thigh.L': [-40, 0, 4], 'shin.L': [46, 0, 0], 'thigh.R': [16, 0, -3], 'shin.R': [24, 0, 0] },
  strikeHips: [0, -0.16, 0.16],
});

export const YHWACH_CLIPS: ClipDef[] = [
  ...ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name)),
  cut1, cut2, cut3, grab, broad, finger, bogen, kreis, anhaben, awaken, rewrite, wound, traps, soulking, beams, sweep, zeichen, auswahlen, cleave,
];

export const YHWACH_CHAIN = ['yh_cut1', 'yh_cut2', 'yh_cut3', 'yh_grab'];
export const YHWACH_BLACK_CHAIN = ['yh_cut1', 'yh_cut2', 'yh_cut3', 'yh_cleave'];
