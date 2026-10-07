// Shinji Hirako's animation set. Sealed: a lazy slouch, weight on one leg, the left hand in his pocket and
// Sakanade resting on his right shoulder; loose one-handed cuts (a backhand flick, a forehand diagonal, a
// rising cut, a thrust and a big flick-slash that throws them off), the two-handed draw-cut, Tanma Otoshi
// (the palm laid over a face), Hadō #91 (a hand raised among ten points of light, then thrust), the
// flicked force blast, the mask drawn down over the face and the wide Cero from the sword hand.
// Shikai: the sword hangs from his index finger by its ring and spins; the arm only steers it (the kit
// turns the blade about the finger), so these clips pose the body and the reaching arm: sweeping spins, an
// overhead spin that sheds the mist, the mirror-side counter, the leap onto the nape, and the Bankai —
// the blade planted point-down as the flower comes up.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys, type SwingDef } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });
interface Grip { p: E; dir: E; edge: E; pole: E }
const ik = (g: Grip, two = 0) => ({ '@gripR': g.p, '@dirR': g.dir, '@edgeR': g.edge, '@poleR': g.pole, '@ikR': [1, 0, 0] as E, '@twoHand': [two, 0, 0] as E });
const noIk = { '@ikR': [0, 0, 0] as E };

/** the slouch: hips out, chest sunk, head cocked; the left hand in the pocket */
const IDLE: Record<string, E> = {
  hips: [0, -8, 4], spine: [-3, 2, 0], chest: [5, 4, -2], neck: [6, 0, 0], head: [-4, -8, 9],
  'thigh.L': [-4, 0, 7], 'shin.L': [6, 0, 0], 'foot.L': [-2, 0, -4], 'thigh.R': [6, 0, -3], 'shin.R': [12, 0, 0], 'foot.R': [-6, 0, 3],
  'upperarm.L': [16, 8, 8], 'forearm.L': [-58, 0, 0], 'hand.L': [6, 0, 0],
};
const I = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });

/** Sakanade resting on his right shoulder, the blade pointing up and back */
const SHOULDER: Grip = { p: [-0.2, 0.16, 0.16], dir: [-0.2, 0.42, -0.88], edge: [0, 0.9, 0.43], pole: [-0.8, -0.5, 0.3] };
/** held low and loose at his side */
const LOW: Grip = { p: [-0.28, -0.36, 0.1], dir: [-0.2, -0.5, 0.84], edge: [0, -0.86, -0.51], pole: [-0.6, -0.3, -0.75] };

export const SHINJI_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.02,
  run: { spine: [12, 0, 0], chest: [4, 0, 0], head: [-8, 0, 0], 'upperarm.L': [10, 6, 8], 'forearm.L': [-50, 0, 0] },
  sprint: { spine: [22, 0, 0], chest: [8, 0, 0], head: [-14, 0, 0], 'upperarm.L': [30, 0, 10], 'forearm.L': [-40, 0, 0] },
  swingL: 0.15,
  swingR: 0.1,
  freqScale: 0.96,
  grip: {
    idle: SHOULDER,
    walk: SHOULDER,
    run: { p: [-0.26, -0.2, -0.08], dir: [-0.2, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.28, -0.12, -0.16], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.36, -0.06, 0.08], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

/** Shikai: the right arm a little forward, the hand open, the sword hanging from the index finger */
const SPIN_ARM: Record<string, E> = { 'upperarm.R': [-36, 10, -18], 'forearm.R': [-24, 0, 0], 'hand.R': [0, 0, 0] };
export const SAKANADE_STANCE: StanceDef = {
  idle: { ...IDLE, ...SPIN_ARM },
  idleHips: -0.02,
  run: { spine: [12, 0, 0], chest: [4, 0, 0], head: [-8, 0, 0], 'upperarm.L': [10, 6, 8], 'forearm.L': [-50, 0, 0], 'upperarm.R': [-20, 10, -20], 'forearm.R': [-30, 0, 0] },
  sprint: { spine: [22, 0, 0], chest: [8, 0, 0], head: [-14, 0, 0], 'upperarm.L': [30, 0, 10], 'forearm.L': [-40, 0, 0], 'upperarm.R': [20, 0, -12], 'forearm.R': [-20, 0, 0] },
  swingL: 0.15,
  swingR: 0,
  freqScale: 0.96,
};

function cut(name: string, o: {
  dur: number; step: number; hit: number; combo?: number;
  swing: Omit<SwingDef, 'keys'> & { keys: [number, number, KeyDef['ease']?][] };
  wind: Record<string, E>; strike: Record<string, E>; strikeHips?: E; windHips?: E;
}): ClipDef {
  const tFollow = o.swing.keys[o.swing.keys.length - 2]?.[0] ?? o.hit + 0.12;
  return {
    name, dur: o.dur, fadeIn: 0.04, fadeOut: 0.2, events: { step: o.step, hit: o.hit, ...(o.combo !== undefined ? { combo: o.combo } : {}) },
    keys: mergeKeys(
      swingKeys(o.swing as SwingDef),
      [
        key(0, I()),
        key(o.swing.keys[1][0], I(o.wind), o.windHips ?? [0, -0.03, -0.02], 'out'),
        key(o.swing.keys[2][0], I(o.strike), o.strikeHips ?? [0, -0.05, 0.05], 'outExpo'),
        key(tFollow, I(o.strike), o.strikeHips ?? [0, -0.05, 0.05], 'out'),
        key(o.dur, I(), [0, -0.02, 0], 'inOut'),
      ],
    ),
  };
}

// ------------------------------------------------------------------ sealed

/** LMB 1: a lazy backhand flick off the shoulder, right to left */
const cut1 = cut('sh_cut1', {
  dur: 0.56, step: 0.06, hit: 0.15, combo: 0.26,
  swing: { a: [0, 0, 1], b: [1, 0.1, 0], c: [-0.14, 0.14, 0.04], r: 0.42, pole: [-0.5, -0.6, -0.6], keys: [[0, -150, 'out'], [0.08, -130, 'out'], [0.16, 30, 'outExpo'], [0.28, 96, 'out'], [0.56, 60, 'inOut']] },
  wind: { hips: [0, -20, 4], chest: [4, -14, -2], head: [-4, 10, 8] },
  strike: { hips: [2, 16, 4], spine: [2, 8, 0], chest: [4, 18, -2], head: [-4, -14, 8], 'thigh.L': [-22, 0, 7], 'shin.L': [22, 0, 0] },
});
/** LMB 2: a forehand diagonal, high on his left down to his right */
const cut2 = cut('sh_cut2', {
  dur: 0.56, step: 0.05, hit: 0.15, combo: 0.26,
  swing: { a: [0, 0, 1], b: [-0.7, -0.7, 0], c: [-0.06, 0.16, 0.06], r: 0.42, pole: [-0.3, -0.5, -0.8], keys: [[0, -60, 'out'], [0.08, -140, 'out'], [0.16, 30, 'outExpo'], [0.28, 84, 'out'], [0.56, 50, 'inOut']] },
  wind: { hips: [0, 18, 4], chest: [-2, 14, -2], head: [-4, -10, 8] },
  strike: { hips: [4, -16, 4], spine: [6, -10, 0], chest: [6, -16, -2], head: [-4, 12, 8], 'thigh.L': [-26, 0, 7], 'shin.L': [28, 0, 0] },
});
/** LMB 3: a quick rising cut */
const cut3 = cut('sh_cut3', {
  dur: 0.54, step: 0.05, hit: 0.14, combo: 0.25,
  swing: { a: [0, 0, 1], b: [0, 1, 0], c: [-0.12, 0.02, 0.12], r: 0.42, pole: [-0.7, -0.4, -0.5], keys: [[0, -40, 'out'], [0.07, -60, 'out'], [0.15, 50, 'outExpo'], [0.26, 76, 'out'], [0.54, 30, 'inOut']] },
  wind: { hips: [4, 0, 4], spine: [8, 0, 0], chest: [8, 0, -2], 'thigh.L': [-18, 0, 7], 'shin.L': [22, 0, 0] },
  strike: { hips: [0, 0, 4], spine: [-4, 0, 0], chest: [-6, 0, -2], head: [-8, 0, 8], 'thigh.L': [-24, 0, 7], 'shin.L': [24, 0, 0] },
});
/** LMB 4: a lazy one-handed thrust */
const thrust: ClipDef = {
  name: 'sh_cut4', dur: 0.6, fadeIn: 0.04, fadeOut: 0.2, events: { step: 0.08, hit: 0.17, combo: 0.28 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(SHOULDER) },
      { t: 0.08, ease: 'inOut', c: ik({ p: [-0.24, -0.02, -0.12], dir: [0, 0.1, 1], edge: [0, -1, 0.1], pole: [-0.9, -0.2, -0.3] }) },
      { t: 0.17, ease: 'outExpo', c: ik({ p: [-0.06, 0.12, 0.56], dir: [0.04, 0.3, 0.95], edge: [0, -0.95, 0.3], pole: [-0.8, -0.5, 0] }) },
      { t: 0.32, ease: 'out', c: ik({ p: [-0.08, 0.11, 0.52], dir: [0.04, 0.3, 0.95], edge: [0, -0.95, 0.3], pole: [-0.8, -0.5, 0] }) },
      { t: 0.6, ease: 'inOut', c: ik(SHOULDER) },
    ],
    [
      key(0, I()),
      key(0.08, I({ hips: [0, -22, 4], chest: [2, -14, -2], head: [-4, 16, 8] }), [0, -0.04, -0.02], 'inOut'),
      key(0.17, I({ hips: [8, 10, 4], spine: [10, 6, 0], chest: [6, 8, -2], head: [-10, -8, 8], 'thigh.L': [-42, 0, 7], 'shin.L': [44, 0, 0], 'thigh.R': [24, 0, -3], 'shin.R': [18, 0, 0] }), [0, -0.12, 0.14], 'outExpo'),
      key(0.32, I({ hips: [8, 10, 4], spine: [10, 6, 0], chest: [6, 8, -2], head: [-10, -8, 8], 'thigh.L': [-42, 0, 7], 'shin.L': [44, 0, 0], 'thigh.R': [24, 0, -3], 'shin.R': [18, 0, 0] }), [0, -0.12, 0.14], 'out'),
      key(0.6, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};
/** LMB 5: the big flick-slash, the whole body thrown round behind it */
const cut5 = cut('sh_cut5', {
  dur: 0.72, step: 0.1, hit: 0.22, combo: 0.36,
  swing: { a: [0, 0, 1], b: [1, -0.15, 0], c: [-0.12, 0.08, 0.04], r: 0.44, pole: [-0.5, -0.6, -0.6], keys: [[0, -60, 'out'], [0.14, -150, 'inOut'], [0.23, 40, 'outExpo'], [0.38, 120, 'out'], [0.72, 60, 'inOut']] },
  wind: { hips: [0, -32, 4], spine: [2, -16, 0], chest: [2, -24, -2], head: [-4, 26, 8], 'thigh.R': [12, 0, -3], 'shin.R': [18, 0, 0], 'upperarm.L': [-30, -20, 30], 'forearm.L': [-30, 0, 0] },
  strike: { hips: [4, 28, 4], spine: [6, 16, 0], chest: [6, 28, -2], head: [-6, -24, 8], 'thigh.L': [-34, 0, 7], 'shin.L': [36, 0, 0], 'thigh.R': [20, 0, -3], 'upperarm.L': [10, 0, 50], 'forearm.L': [-10, 0, 0] },
  strikeHips: [0, -0.08, 0.12],
});

/** RMB: the two-handed draw-cut, level and long, a step through */
const draw = cut('sh_draw', {
  dur: 0.8, step: 0.14, hit: 0.26,
  swing: { a: [0, 0, 1], b: [1, -0.05, 0], c: [-0.08, 0.02, 0.08], r: 0.42, sense: 1, pole: [-0.5, -0.65, -0.55], twoHand: [0, 1, 1, 1, 0], keys: [[0, -100, 'out'], [0.18, -150, 'inOut'], [0.3, 40, 'out'], [0.44, 100, 'out'], [0.8, 60, 'inOut']] },
  wind: { hips: [0, -30, 4], spine: [4, -14, 0], chest: [4, -20, -2], head: [-4, 24, 8], 'thigh.L': [-10, 0, 7], 'thigh.R': [14, 0, -3], 'shin.R': [22, 0, 0], 'upperarm.L': [-40, -30, 20], 'forearm.L': [-60, 0, 0] },
  strike: { hips: [8, 24, 4], spine: [10, 14, 0], chest: [8, 24, -2], head: [-8, -20, 8], 'thigh.L': [-48, 0, 7], 'shin.L': [52, 0, 0], 'thigh.R': [28, 0, -3], 'shin.R': [22, 0, 0] },
  windHips: [0, -0.06, -0.04], strikeHips: [0, -0.16, 0.22],
});

/** Q: Tanma Otoshi — the left palm laid over the target's face, a white light, lights out */
const tanma: ClipDef = {
  name: 'sh_tanma', dur: 0.8, fadeIn: 0.05, fadeOut: 0.24, events: { step: 0.04, grab: 0.18 },
  keys: mergeKeys(
    [{ t: 0, c: ik(SHOULDER) }, { t: 0.8, c: ik(SHOULDER) }],
    [
      key(0, I()),
      key(0.18, I({ hips: [6, 0, 2], spine: [8, 0, 0], chest: [6, 0, 0], head: [-6, 0, 4], 'upperarm.L': [-96, -6, 8], 'forearm.L': [-6, 0, 0], 'hand.L': [70, 0, 0], 'thigh.L': [-30, 0, 7], 'shin.L': [32, 0, 0], 'thigh.R': [16, 0, -3] }), [0, -0.06, 0.1], 'outExpo'),
      key(0.5, I({ hips: [6, 0, 2], spine: [8, 0, 0], chest: [6, 0, 0], head: [-6, 0, 4], 'upperarm.L': [-94, -6, 8], 'forearm.L': [-8, 0, 0], 'hand.L': [70, 0, 0], 'thigh.L': [-30, 0, 7], 'shin.L': [32, 0, 0], 'thigh.R': [16, 0, -3] }), [0, -0.06, 0.1], 'linear'),
      key(0.8, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** E: Hadō #91 Senju Kōten Taihō — the left hand raised among the points of light, then thrust at the target */
const kido91: ClipDef = {
  name: 'sh_kido91', dur: 1.4, fadeIn: 0.08, fadeOut: 0.3, events: { gather: 0.2, fire: 0.9 },
  keys: mergeKeys(
    [{ t: 0, c: ik(SHOULDER) }, { t: 1.4, c: ik(SHOULDER) }],
    [
      key(0, I()),
      key(0.2, I({ hips: [0, -6, 2], spine: [-4, 0, 0], chest: [-6, 0, 0], head: [-10, 0, 4], 'upperarm.L': [-150, -10, 16], 'forearm.L': [-20, 0, 0], 'hand.L': [-10, 0, 0] }), [0, 0, 0], 'inOut'),
      key(0.82, I({ hips: [0, -6, 2], spine: [-4, 0, 0], chest: [-6, 0, 0], head: [-12, 0, 4], 'upperarm.L': [-156, -10, 16], 'forearm.L': [-16, 0, 0], 'hand.L': [-10, 0, 0] }), [0, 0, 0], 'linear'),
      key(0.9, I({ hips: [6, -14, 2], spine: [10, -8, 0], chest: [8, -14, 0], head: [-6, 10, 4], 'upperarm.L': [-84, 0, 10], 'forearm.L': [-4, 0, 0], 'hand.L': [60, 0, 0], 'thigh.L': [-28, 0, 7], 'shin.L': [30, 0, 0], 'thigh.R': [16, 0, -3] }), [0, -0.06, 0.08], 'outExpo'),
      key(1.1, I({ hips: [6, -14, 2], spine: [10, -8, 0], chest: [8, -14, 0], head: [-6, 10, 4], 'upperarm.L': [-82, 0, 10], 'forearm.L': [-6, 0, 0], 'hand.L': [60, 0, 0], 'thigh.L': [-28, 0, 7], 'shin.L': [30, 0, 0], 'thigh.R': [16, 0, -3] }), [0, -0.06, 0.08], 'out'),
      key(1.4, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** R: a force blast flicked from the left fingers */
const force: ClipDef = {
  name: 'sh_force', dur: 0.5, fadeIn: 0.03, fadeOut: 0.18, events: { fire: 0.12 },
  keys: mergeKeys(
    [{ t: 0, c: ik(SHOULDER) }, { t: 0.5, c: ik(SHOULDER) }],
    [
      key(0, I()),
      key(0.06, I({ hips: [0, 10, 4], chest: [0, 8, 0], 'upperarm.L': [-40, -40, 10], 'forearm.L': [-90, 0, 0], 'hand.L': [20, 0, 0] }), [0, -0.02, 0], 'out'),
      key(0.12, I({ hips: [0, -12, 4], chest: [2, -10, 0], 'upperarm.L': [-88, 10, 14], 'forearm.L': [-4, 0, 0], 'hand.L': [-20, 0, 0], 'thigh.L': [-14, 0, 7], 'shin.L': [16, 0, 0] }), [0, -0.03, 0.04], 'outExpo'),
      key(0.24, I({ hips: [0, -12, 4], chest: [2, -10, 0], 'upperarm.L': [-86, 10, 14], 'forearm.L': [-6, 0, 0], 'hand.L': [-20, 0, 0], 'thigh.L': [-14, 0, 7], 'shin.L': [16, 0, 0] }), [0, -0.03, 0.04], 'out'),
      key(0.5, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** F: "Taorero, Sakanade" — the sword held out level, then flipped up so it drops onto his finger by its ring */
const release: ClipDef = {
  name: 'sh_release', dur: 1.2, fadeIn: 0.08, fadeOut: 0.3, events: { call: 0.2, ring: 0.6 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(SHOULDER) },
      { t: 0.3, ease: 'inOut', c: ik({ p: [-0.18, 0.08, 0.36], dir: [0.1, 0.05, 1], edge: [0, -1, 0.05], pole: [-0.8, -0.5, -0.2] }) },
      { t: 0.55, ease: 'inOut', c: ik({ p: [-0.18, 0.16, 0.36], dir: [0.1, 0.6, 0.8], edge: [0, -0.8, 0.6], pole: [-0.8, -0.5, -0.2] }) },
      { t: 0.62, ease: 'out', c: { '@ikR': [0, 0, 0] } },
      { t: 1.2, c: { '@ikR': [0, 0, 0] } },
    ],
    [
      key(0, I()),
      key(0.3, I({ head: [-6, -4, 6] })),
      key(0.62, I({ ...SPIN_ARM, 'upperarm.R': [-60, 10, -18], head: [-8, -4, 4] }), [0, 0, 0], 'out'),
      key(1.2, I(SPIN_ARM), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** G: the mask — the left hand drawn down over the face */
const mask: ClipDef = {
  name: 'sh_mask', dur: 0.7, fadeIn: 0.05, fadeOut: 0.22, events: { on: 0.3 },
  keys: [
    key(0, I()),
    key(0.18, I({ chest: [2, 0, 0], head: [2, 0, 4], 'upperarm.L': [-110, -30, 10], 'forearm.L': [-70, 0, 0], 'hand.L': [0, 0, 0] }), [0, 0, 0], 'inOut'),
    key(0.3, I({ chest: [6, 0, 0], head: [8, 0, 4], 'upperarm.L': [-70, -30, 10], 'forearm.L': [-90, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.02, 0], 'outExpo'),
    key(0.7, I({ head: [-6, 0, 2] }), [0, -0.02, 0], 'inOut'),
  ],
};

/** R (masked): the Cero — the energy lines up in a bar before the sword hand, then the wide fan of it */
const cero: ClipDef = {
  name: 'sh_cero', dur: 0.9, fadeIn: 0.05, fadeOut: 0.24, events: { charge: 0.1, fire: 0.42 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(SHOULDER) },
      { t: 0.12, ease: 'inOut', c: ik({ p: [-0.2, 0.06, 0.36], dir: [-0.98, 0.1, 0.15], edge: [0, -1, 0.1], pole: [-0.8, -0.5, -0.2] }) },
      { t: 0.42, ease: 'linear', c: ik({ p: [-0.18, 0.06, 0.4], dir: [-0.98, 0.1, 0.15], edge: [0, -1, 0.1], pole: [-0.8, -0.5, -0.2] }) },
      { t: 0.5, ease: 'outExpo', c: ik({ p: [-0.16, 0.06, 0.46], dir: [-0.98, 0.1, 0.15], edge: [0, -1, 0.1], pole: [-0.8, -0.5, -0.2] }) },
      { t: 0.9, ease: 'inOut', c: ik(SHOULDER) },
    ],
    [
      key(0, I()),
      key(0.12, I({ hips: [0, -10, 2], chest: [0, -8, 0], head: [-4, 6, 4], 'thigh.L': [-16, 0, 7], 'shin.L': [18, 0, 0] }), [0, -0.04, 0], 'inOut'),
      key(0.42, I({ hips: [0, -10, 2], chest: [0, -8, 0], head: [-4, 6, 4], 'thigh.L': [-18, 0, 7], 'shin.L': [20, 0, 0] }), [0, -0.04, 0], 'linear'),
      key(0.5, I({ hips: [-4, -8, 2], spine: [-4, 0, 0], chest: [-6, -6, 0], head: [-6, 4, 4], 'thigh.L': [-10, 0, 7], 'thigh.R': [-6, 0, -3] }), [0, -0.02, -0.06], 'outExpo'),
      key(0.9, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

// ------------------------------------------------------------------ Shikai: the ring spin (the kit spins the sword)

const S = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...SPIN_ARM, ...over });
/** a spin: the arm sweeps across while the sword wheels round the finger */
const spin = (name: string, kind: 0 | 1 | 2 | 3): ClipDef => {
  const arms: Record<string, E>[][] = [
    // 0: a level sweep from right to left in front
    [{ 'upperarm.R': [-60, 30, -50], 'forearm.R': [-10, 0, 0] }, { 'upperarm.R': [-80, -40, -10], 'forearm.R': [-10, 0, 0] }],
    // 1: a vertical wheel at his side, the arm low
    [{ 'upperarm.R': [-20, 0, -30], 'forearm.R': [-20, 0, 0] }, { 'upperarm.R': [-60, 0, -20], 'forearm.R': [-6, 0, 0] }],
    // 2: overhead
    [{ 'upperarm.R': [-120, 0, -20], 'forearm.R': [-20, 0, 0] }, { 'upperarm.R': [-160, 0, -10], 'forearm.R': [-6, 0, 0] }],
    // 3: the catch and thrust: the arm drawn back, then straight out
    [{ 'upperarm.R': [10, 10, -30], 'forearm.R': [-90, 0, 0] }, { 'upperarm.R': [-86, 0, -6], 'forearm.R': [-2, 0, 0] }],
  ];
  const arm = arms[kind];
  const bodies: Record<string, E>[][] = [
    [{ hips: [0, -18, 4], chest: [2, -16, -2] }, { hips: [2, 16, 4], chest: [4, 18, -2], 'thigh.L': [-22, 0, 7], 'shin.L': [22, 0, 0] }],
    [{ hips: [0, 10, 4], chest: [0, 10, -2] }, { hips: [4, -10, 4], chest: [6, -10, -2], 'thigh.L': [-24, 0, 7], 'shin.L': [26, 0, 0] }],
    [{ hips: [-4, 0, 4], chest: [-6, 0, -2], head: [-12, 0, 6] }, { hips: [6, 0, 4], chest: [8, 0, -2], 'thigh.L': [-28, 0, 7], 'shin.L': [30, 0, 0] }],
    [{ hips: [0, -22, 4], chest: [0, -16, -2] }, { hips: [8, 10, 4], spine: [10, 6, 0], chest: [6, 8, -2], 'thigh.L': [-42, 0, 7], 'shin.L': [44, 0, 0], 'thigh.R': [24, 0, -3] }],
  ];
  const body = bodies[kind];
  return {
    name, dur: 0.56, fadeIn: 0.04, fadeOut: 0.2, events: { step: 0.05, hit: 0.15, combo: 0.26 },
    keys: [
      { t: 0, b: S(), c: noIk },
      { t: 0.07, b: S({ ...body[0], ...arm[0] }), hips: [0, -0.02, -0.02], ease: 'out', c: noIk },
      { t: 0.16, b: S({ ...body[1], ...arm[1] }), hips: [0, -0.05, 0.08], ease: 'outExpo', c: noIk },
      { t: 0.3, b: S({ ...body[1], ...arm[1] }), hips: [0, -0.05, 0.08], ease: 'out', c: noIk },
      { t: 0.56, b: S(), hips: [0, -0.02, 0], ease: 'inOut', c: noIk },
    ],
  };
};

/** Q (Shikai): Sakasama no Sekai — the sword spun fast overhead, the mist pouring out of its holes */
const mist: ClipDef = {
  name: 'sk_mist', dur: 1.2, fadeIn: 0.06, fadeOut: 0.3, events: { mist: 0.4 },
  keys: [
    { t: 0, b: S(), c: noIk },
    { t: 0.3, b: S({ hips: [-2, 0, 4], chest: [-6, 0, -2], head: [-14, 0, 6], 'upperarm.R': [-170, 0, -6], 'forearm.R': [-4, 0, 0] }), ease: 'inOut', c: noIk },
    { t: 0.9, b: S({ hips: [-2, 0, 4], chest: [-6, 0, -2], head: [-16, 0, 6], 'upperarm.R': [-172, 0, -6], 'forearm.R': [-4, 0, 0] }), ease: 'linear', c: noIk },
    { t: 1.2, b: S(), ease: 'inOut', c: noIk },
  ],
};

/** RMB (Shikai): the counter stroke — the thrust from the side they do not guard */
const counter = spin('sk_counter', 3);

/** E (Shikai): the nape drop — up over the target, down onto the back of its neck */
const nape: ClipDef = {
  name: 'sk_nape', dur: 0.9, fadeIn: 0.04, fadeOut: 0.24, events: { leap: 0.06, hit: 0.42 },
  keys: [
    { t: 0, b: S(), c: noIk },
    { t: 0.2, b: S({ hips: [-20, 0, 0], spine: [-10, 0, 0], chest: [-10, 0, 0], 'thigh.L': [-80, 0, 7], 'shin.L': [100, 0, 0], 'thigh.R': [-60, 0, -3], 'shin.R': [90, 0, 0], 'upperarm.R': [-160, 0, -10], 'forearm.R': [-10, 0, 0] }), ease: 'out', c: noIk },
    { t: 0.42, b: S({ hips: [20, 0, 0], spine: [20, 0, 0], chest: [14, 0, 0], head: [10, 0, 0], 'thigh.L': [-50, 0, 7], 'shin.L': [70, 0, 0], 'thigh.R': [-30, 0, -3], 'shin.R': [60, 0, 0], 'upperarm.R': [-30, 0, -10], 'forearm.R': [-4, 0, 0] }), ease: 'outExpo', c: noIk },
    { t: 0.6, b: S({ hips: [16, 0, 0], spine: [14, 0, 0], chest: [10, 0, 0], 'thigh.L': [-40, 0, 7], 'shin.L': [60, 0, 0], 'thigh.R': [-10, 0, -3], 'shin.R': [40, 0, 0], 'upperarm.R': [-30, 0, -10] }), ease: 'out', c: noIk },
    { t: 0.9, b: S(), ease: 'inOut', c: noIk },
  ],
};

/** F (Shikai): Bankai — the sword caught and planted point-down; he crouches as the flower comes up round him */
const bankai: ClipDef = {
  name: 'sk_bankai', dur: 1.6, fadeIn: 0.08, fadeOut: 0.3, events: { plant: 0.5, bloom: 0.7 },
  keys: [
    { t: 0, b: S(), c: noIk },
    { t: 0.5, b: S({ hips: [10, 0, 0], spine: [12, 0, 0], chest: [8, 0, 0], head: [6, 0, 0], 'thigh.L': [-40, 0, 7], 'shin.L': [70, 0, 0], 'thigh.R': [-20, 0, -3], 'shin.R': [60, 0, 0], 'upperarm.R': [-40, 0, -10], 'forearm.R': [-10, 0, 0] }), hips: [0, -0.2, 0], ease: 'outExpo', c: noIk },
    { t: 1.2, b: S({ hips: [6, 0, 0], spine: [6, 0, 0], chest: [4, 0, 0], head: [-6, 0, 4], 'thigh.L': [-30, 0, 7], 'shin.L': [50, 0, 0], 'thigh.R': [-14, 0, -3], 'shin.R': [44, 0, 0], 'upperarm.R': [-40, 0, -10], 'forearm.R': [-10, 0, 0] }), hips: [0, -0.14, 0], ease: 'inOut', c: noIk },
    { t: 1.6, b: S(), ease: 'inOut', c: noIk },
  ],
};

export const SHINJI_CLIPS: ClipDef[] = [
  ...ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name)),
  cut1, cut2, cut3, thrust, cut5, draw, tanma, kido91, force, release, mask, cero,
  spin('sk_spin1', 0), spin('sk_spin2', 1), spin('sk_spin3', 2), spin('sk_spin4', 3), mist, counter, nape, bankai,
];

export const SHINJI_CHAIN = ['sh_cut1', 'sh_cut2', 'sh_cut3', 'sh_cut4', 'sh_cut5'];
export const SAKANADE_CHAIN = ['sk_spin1', 'sk_spin2', 'sk_spin3', 'sk_spin4'];
