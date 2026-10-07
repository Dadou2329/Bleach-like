// Retsu Unohana's animation set. Retsu: upright and serene, Minazuki low in the right hand, the left hand
// resting at the obi; flowing nodachi cuts (a two-handed diagonal, a rising backhand, a level sweep, a clean
// thrust), the long iai sweep from the left hip, Kaidō (the left palm glowing over the heart), three daggers
// flicked out of the sleeve, Bakudō #62 Hyapporankan (a rod of light raised and hurled), the braid untied,
// the call of Minazuki (the blade raised, then turned down) and the pose riding the creature.
// Yachiru: low and loose, the head tilted, the blade hanging behind her right side. "Eight thousand styles":
// two strings that alternate — kendō (the overhead men, a kesa cut, the dō, a two-handed thrust) and a
// flowing one-handed style (rising, sweeping, backhand, a leaping cut). The disarming flick, the throat
// thrust, the dagger from behind, the back-of-the-hand guard and its counter, and the Bankai: the clenched
// left hand dragged along the blade. Bankai: the bisecting cut, the volley of liquid slashes, the sphere of
// blades, the blades drawn up out of the pool.
import type { ClipDef, EaseName, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys, type SwingDef } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });
interface Grip { p: E; dir: E; edge: E; pole: E }
const ik = (g: Grip, two = 0) => ({ '@gripR': g.p, '@dirR': g.dir, '@edgeR': g.edge, '@poleR': g.pole, '@ikR': [1, 0, 0] as E, '@twoHand': [two, 0, 0] as E });

// ------------------------------------------------------------------ Retsu

const IDLE: Record<string, E> = {
  hips: [0, -4, 0], spine: [2, 0, 0], chest: [1, 2, 0], neck: [3, 0, 0], head: [-2, -4, 3],
  'thigh.L': [-3, 0, 3], 'shin.L': [5, 0, 0], 'foot.L': [-2, 0, -2], 'thigh.R': [2, 0, -3], 'shin.R': [4, 0, 0], 'foot.R': [-2, 0, 2],
  'upperarm.L': [-18, -26, 4], 'forearm.L': [-62, 0, 0], 'hand.L': [4, 0, -8],
};
const I = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });

/** Minazuki low in the right hand, the long blade reaching forward and down */
const LOW: Grip = { p: [-0.26, -0.34, 0.14], dir: [-0.1, -0.45, 0.89], edge: [0, -0.89, -0.45], pole: [-0.6, -0.3, -0.75] };
const SH: E = [-0.18, 0.16, 0.04];

export const UNOHANA_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.01,
  run: { spine: [10, 0, 0], chest: [4, 0, 0], head: [-8, 0, 0], 'upperarm.L': [14, 0, 10], 'forearm.L': [-34, 0, 0] },
  sprint: { spine: [18, 0, 0], chest: [8, 0, 0], head: [-12, 0, 0], 'upperarm.L': [40, 0, 12], 'forearm.L': [-28, 0, 0] },
  swingL: 0.4,
  swingR: 0.12,
  freqScale: 1.05,
  grip: {
    idle: LOW,
    walk: LOW,
    run: { p: [-0.28, -0.22, -0.08], dir: [-0.2, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.28, -0.14, -0.16], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.34, -0.08, 0.08], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

/** a cut built from a swing arc and three body poses (windup, strike, follow-through) */
function cut(name: string, o: {
  dur: number; step: number; hit: number; combo?: number;
  swing: Omit<SwingDef, 'keys'> & { keys: [number, number, EaseName?][] };
  wind: Record<string, E>; strike: Record<string, E>; follow?: Record<string, E>;
  windHips?: E; strikeHips?: E; base?: (over?: Record<string, E>) => Record<string, E>;
}): ClipDef {
  const B = o.base ?? I;
  const tFollow = o.swing.keys[o.swing.keys.length - 2]?.[0] ?? o.hit + 0.12;
  return {
    name, dur: o.dur, fadeIn: 0.04, fadeOut: 0.2, events: { step: o.step, hit: o.hit, ...(o.combo !== undefined ? { combo: o.combo } : {}) },
    keys: mergeKeys(
      swingKeys(o.swing as SwingDef),
      [
        key(0, B()),
        key(o.swing.keys[1][0], B(o.wind), o.windHips ?? [0, -0.03, -0.02], 'out'),
        key(o.swing.keys[2][0], B(o.strike), o.strikeHips ?? [0, -0.06, 0.06], 'outExpo'),
        key(tFollow, B({ ...o.strike, ...(o.follow ?? {}) }), o.strikeHips ?? [0, -0.06, 0.06], 'out'),
        key(o.dur, B(), [0, -0.01, 0], 'inOut'),
      ],
    ),
  };
}

/** LMB 1: kesa-giri — both hands, from over the right shoulder down across to the left */
const cut1 = cut('un_cut1', {
  dur: 0.62, step: 0.06, hit: 0.18, combo: 0.3,
  swing: { a: [0, 0, 1], b: [0.62, -0.78, 0], c: [-0.06, 0.2, 0.08], r: 0.38, pole: [-0.6, -0.3, -0.7], twoHand: [0, 1, 1, 1, 0], keys: [[0, 10, 'out'], [0.12, -150, 'inOut'], [0.2, 24, 'outExpo'], [0.34, 56, 'out'], [0.62, 40, 'inOut']] },
  wind: { hips: [-2, -18, 0], spine: [-6, -8, 0], chest: [-8, -12, 0], head: [-2, 14, 3], 'thigh.L': [-16, 0, 6], 'thigh.R': [8, 0, -6] },
  strike: { hips: [8, 12, 0], spine: [10, 8, 0], chest: [8, 10, 0], head: [-8, -6, 3], 'thigh.L': [-40, 0, 6], 'shin.L': [44, 0, 0], 'thigh.R': [22, 0, -6], 'shin.R': [20, 0, 0] },
  strikeHips: [0, -0.12, 0.14],
});

/** LMB 2: the rising backhand, one hand, from low on her left up past her right shoulder */
const cut2 = cut('un_cut2', {
  dur: 0.58, step: 0.05, hit: 0.15, combo: 0.27,
  swing: { a: [0, 0, 1], b: [-0.85, 0.52, 0], c: [-0.08, 0.1, 0.05], r: 0.38, pole: [-0.3, -0.4, -0.85], keys: [[0, -130, 'out'], [0.09, -118, 'out'], [0.17, 46, 'outExpo'], [0.3, 100, 'out'], [0.58, 60, 'inOut']] },
  wind: { hips: [2, 16, 0], spine: [5, 10, 0], chest: [5, 16, 0], head: [-6, -10, 3], 'upperarm.L': [6, 0, 30], 'forearm.L': [-30, 0, 0] },
  strike: { hips: [2, -16, 0], spine: [4, -10, 0], chest: [2, -18, 0], head: [-6, 14, 3], 'thigh.L': [-22, 0, 5], 'shin.L': [24, 0, 0], 'upperarm.L': [10, 0, 40], 'forearm.L': [-20, 0, 0] },
});

/** LMB 3: a level sweep from right to left at waist height, both hands */
const cut3 = cut('un_cut3', {
  dur: 0.62, step: 0.07, hit: 0.18, combo: 0.3,
  swing: { a: [0, 0, 1], b: [1, -0.08, 0], c: [-0.12, 0.02, 0.06], r: 0.4, pole: [-0.5, -0.65, -0.55], twoHand: [0, 1, 1, 1, 0], keys: [[0, -60, 'out'], [0.11, -122, 'out'], [0.2, 40, 'outExpo'], [0.33, 104, 'out'], [0.62, 70, 'inOut']] },
  wind: { hips: [0, -24, 0], spine: [2, -12, 0], chest: [0, -16, 0], head: [-4, 18, 3], 'thigh.R': [10, 0, -6], 'shin.R': [14, 0, 0] },
  strike: { hips: [2, 18, 0], spine: [6, 12, 0], chest: [4, 20, 0], head: [-6, -16, 3], 'thigh.L': [-30, 0, 6], 'shin.L': [32, 0, 0], 'thigh.R': [16, 0, -6], 'shin.R': [16, 0, 0] },
});

/** LMB 4: a clean thrust with a long step */
const cut4: ClipDef = {
  name: 'un_cut4', dur: 0.66, fadeIn: 0.05, fadeOut: 0.2, events: { step: 0.1, hit: 0.19, combo: 0.32 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(LOW) },
      { t: 0.1, ease: 'inOut', c: ik({ p: [-0.22, -0.1, -0.12], dir: [0, 0.04, 1], edge: [0, -1, 0.04], pole: [-0.9, -0.2, -0.3] }, 1) },
      { t: 0.2, ease: 'outExpo', c: ik({ p: [-0.06, 0.1, 0.5], dir: [0.04, 0.37, 0.93], edge: [0, -0.93, 0.37], pole: [-0.8, -0.5, 0] }, 1) },
      { t: 0.36, ease: 'out', c: ik({ p: [-0.08, 0.09, 0.46], dir: [0.04, 0.37, 0.93], edge: [0, -0.93, 0.37], pole: [-0.8, -0.5, 0] }, 1) },
      { t: 0.66, ease: 'inOut', c: ik(LOW) },
    ],
    [
      key(0, I()),
      key(0.1, I({ hips: [0, -22, 0], spine: [2, -10, 0], chest: [0, -12, 0], head: [-4, 18, 3], 'thigh.L': [-10, 0, 6], 'thigh.R': [8, 0, -6] }), [0, -0.04, -0.02], 'inOut'),
      key(0.2, I({ hips: [6, 8, 0], spine: [10, 6, 0], chest: [6, 6, 0], head: [-10, -6, 3], 'thigh.L': [-42, 0, 6], 'shin.L': [44, 0, 0], 'thigh.R': [24, 0, -6], 'shin.R': [18, 0, 0] }), [0, -0.12, 0.14], 'outExpo'),
      key(0.36, I({ hips: [6, 8, 0], spine: [10, 6, 0], chest: [6, 6, 0], head: [-10, -6, 3], 'thigh.L': [-42, 0, 6], 'shin.L': [44, 0, 0], 'thigh.R': [24, 0, -6], 'shin.R': [18, 0, 0] }), [0, -0.12, 0.14], 'out'),
      key(0.66, I(), [0, -0.01, 0], 'inOut'),
    ],
  ),
};

/** RMB: the long iai sweep — drawn back past the left hip, then across to the right with a long step */
const iai = cut('un_iai', {
  dur: 0.86, step: 0.16, hit: 0.28,
  swing: { a: [0, 0, 1], b: [1, -0.1, 0], c: [-0.04, -0.02, 0.06], r: 0.4, sense: -1, pole: [-0.6, -0.5, -0.6], twoHand: [0, 0, 0.7, 0.7, 0], keys: [[0, -40, 'out'], [0.2, 150, 'inOut'], [0.3, -40, 'outExpo'], [0.46, -100, 'out'], [0.86, -60, 'inOut']] },
  wind: { hips: [0, 30, 0], spine: [4, 16, 0], chest: [4, 24, 0], head: [-4, -26, 3], 'thigh.L': [-8, 0, 8], 'shin.L': [20, 0, 0], 'thigh.R': [14, 0, -8], 'shin.R': [24, 0, 0], 'upperarm.L': [-30, -40, 10], 'forearm.L': [-80, 0, 0] },
  strike: { hips: [10, -20, 0], spine: [10, -12, 0], chest: [6, -20, 0], head: [-10, 22, 3], 'thigh.L': [-56, 0, 8], 'shin.L': [60, 0, 0], 'thigh.R': [30, 0, -8], 'shin.R': [26, 0, 0] },
  windHips: [0, -0.06, -0.04], strikeHips: [0, -0.18, 0.24],
});

/** Q: Kaidō — the left palm laid over her heart, glowing, the eyes lowered */
const kaido: ClipDef = {
  name: 'un_kaido', dur: 1.2, fadeIn: 0.1, fadeOut: 0.3, events: { heal: 0.24 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 1.2, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.24, I({ spine: [3, 0, 0], chest: [4, 0, 0], neck: [6, 0, 0], head: [8, 0, 3], 'upperarm.L': [-30, -42, -8], 'forearm.L': [-102, 0, 0], 'hand.L': [10, 0, -10] }), [0, -0.02, 0], 'inOut'),
      key(0.95, I({ spine: [3, 0, 0], chest: [4, 0, 0], neck: [6, 0, 0], head: [10, 0, 3], 'upperarm.L': [-32, -42, -8], 'forearm.L': [-104, 0, 0], 'hand.L': [10, 0, -10] }), [0, -0.02, 0], 'linear'),
      key(1.2, I(), [0, -0.01, 0], 'inOut'),
    ],
  ),
};

/** E: three daggers flicked out of the sleeve — the left hand drawn across, then whipped out */
const daggers: ClipDef = {
  name: 'un_daggers', dur: 0.56, fadeIn: 0.04, fadeOut: 0.18, events: { throw: 0.17 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 0.56, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.09, I({ hips: [0, 14, 0], spine: [2, 8, 0], chest: [0, 14, 0], head: [-4, -12, 3], 'upperarm.L': [-40, -60, -10], 'forearm.L': [-110, 0, 0], 'hand.L': [20, 0, 0] }), [0, -0.02, 0], 'out'),
      key(0.17, I({ hips: [0, -16, 0], spine: [2, -8, 0], chest: [0, -16, 0], head: [-4, 14, 3], 'upperarm.L': [-84, 10, 20], 'forearm.L': [-6, 0, 0], 'hand.L': [-20, 0, 0], 'thigh.L': [-14, 0, 6], 'shin.L': [16, 0, 0] }), [0, -0.03, 0.03], 'outExpo'),
      key(0.3, I({ hips: [0, -14, 0], spine: [2, -6, 0], chest: [0, -14, 0], head: [-4, 12, 3], 'upperarm.L': [-80, 14, 22], 'forearm.L': [-10, 0, 0], 'hand.L': [-30, 0, 0], 'thigh.L': [-14, 0, 6], 'shin.L': [16, 0, 0] }), [0, -0.03, 0.03], 'out'),
      key(0.56, I(), [0, -0.01, 0], 'inOut'),
    ],
  ),
};

/** R: Bakudō #62 Hyapporankan — the left hand raised over the shoulder with the rod of light, then hurled */
const bakudo: ClipDef = {
  name: 'un_bakudo', dur: 0.92, fadeIn: 0.06, fadeOut: 0.24, events: { form: 0.14, throw: 0.42 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 0.92, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.14, I({ hips: [0, 18, 0], spine: [-4, 10, 0], chest: [-8, 16, 0], head: [-6, -16, 3], 'upperarm.L': [-150, -10, 20], 'forearm.L': [-40, 0, 0], 'hand.L': [0, 0, 0], 'thigh.L': [4, 0, 6], 'thigh.R': [12, 0, -6], 'shin.R': [18, 0, 0] }), [0, -0.02, -0.04], 'inOut'),
      key(0.34, I({ hips: [0, 20, 0], spine: [-6, 12, 0], chest: [-10, 18, 0], head: [-6, -18, 3], 'upperarm.L': [-156, -10, 22], 'forearm.L': [-48, 0, 0], 'hand.L': [6, 0, 0], 'thigh.L': [4, 0, 6], 'thigh.R': [12, 0, -6], 'shin.R': [18, 0, 0] }), [0, -0.02, -0.05], 'linear'),
      key(0.42, I({ hips: [4, -16, 0], spine: [10, -10, 0], chest: [8, -16, 0], head: [-10, 14, 3], 'upperarm.L': [-70, 0, 10], 'forearm.L': [-6, 0, 0], 'hand.L': [-10, 0, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [32, 0, 0], 'thigh.R': [18, 0, -6] }), [0, -0.06, 0.08], 'outExpo'),
      key(0.62, I({ hips: [4, -14, 0], spine: [8, -8, 0], chest: [6, -14, 0], head: [-8, 12, 3], 'upperarm.L': [-60, 0, 10], 'forearm.L': [-10, 0, 0], 'thigh.L': [-28, 0, 6], 'shin.L': [30, 0, 0], 'thigh.R': [16, 0, -6] }), [0, -0.05, 0.07], 'out'),
      key(0.92, I(), [0, -0.01, 0], 'inOut'),
    ],
  ),
};

/** G: the braid untied — the left hand down to the tie, pulled loose, the head lifted with a new look */
const unbraid: ClipDef = {
  name: 'un_unbraid', dur: 1.3, fadeIn: 0.1, fadeOut: 0.3, events: { untie: 0.42, undo: 0.6 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 1.3, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.3, I({ spine: [6, 0, 0], chest: [8, 0, 0], neck: [10, 0, 0], head: [16, 0, 0], 'upperarm.L': [-20, -40, -4], 'forearm.L': [-70, 0, 0], 'hand.L': [20, 0, 0] }), [0, -0.03, 0], 'inOut'),
      key(0.42, I({ spine: [6, 0, 0], chest: [8, 0, 0], neck: [10, 0, 0], head: [16, 0, 0], 'upperarm.L': [-18, -36, 0], 'forearm.L': [-60, 0, 0], 'hand.L': [30, 0, 0] }), [0, -0.03, 0], 'inOut'),
      key(0.6, I({ spine: [0, 0, 0], chest: [-4, 0, 0], neck: [-6, 0, 0], head: [-10, 8, -6], 'upperarm.L': [10, 10, 30], 'forearm.L': [-20, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.01, 0], 'out'),
      key(0.95, I({ hips: [0, -8, 0], spine: [4, 0, 0], chest: [2, -4, 0], neck: [2, 0, 0], head: [4, 8, -10], 'upperarm.L': [4, 0, 12], 'forearm.L': [-12, 0, 0] }), [0, -0.03, 0], 'inOut'),
      key(1.3, I({ hips: [0, -8, 0], spine: [4, 0, 0], chest: [2, -4, 0], head: [4, 8, -10], 'upperarm.L': [4, 0, 10], 'forearm.L': [-10, 0, 0] }), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** F (Retsu): Minazuki — the blade raised upright before her face, then turned point-down to the ground */
const shikai: ClipDef = {
  name: 'un_shikai', dur: 1.3, fadeIn: 0.08, fadeOut: 0.3, events: { call: 0.3, summon: 0.7 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(LOW) },
      { t: 0.3, ease: 'inOut', c: ik({ p: [-0.06, 0.02, 0.22], dir: [0, 1, 0.05], edge: [0, -0.05, 1], pole: [-0.8, -0.5, -0.2] }, 1) },
      { t: 0.55, ease: 'inOut', c: ik({ p: [-0.06, 0.04, 0.22], dir: [0, 1, 0.08], edge: [0, -0.08, 1], pole: [-0.8, -0.5, -0.2] }, 1) },
      { t: 0.7, ease: 'outExpo', c: ik({ p: [-0.06, -0.24, 0.3], dir: [0, -0.86, 0.5], edge: [0, -0.5, -0.86], pole: [-0.8, -0.4, -0.3] }, 1) },
      { t: 1.0, ease: 'inOut', c: ik({ p: [-0.06, -0.26, 0.3], dir: [0, -0.86, 0.5], edge: [0, -0.5, -0.86], pole: [-0.8, -0.4, -0.3] }, 0.6) },
      { t: 1.3, ease: 'inOut', c: ik(LOW) },
    ],
    [
      key(0, I()),
      key(0.3, I({ spine: [-2, 0, 0], chest: [-2, 0, 0], head: [-4, 0, 0], 'thigh.L': [-6, 0, 6], 'thigh.R': [6, 0, -6] }), [0, 0, 0], 'inOut'),
      key(0.7, I({ hips: [6, 0, 0], spine: [8, 0, 0], chest: [6, 0, 0], head: [6, 0, 0], 'thigh.L': [-18, 0, 6], 'shin.L': [26, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [20, 0, 0] }), [0, -0.08, 0.02], 'outExpo'),
      key(1.3, I(), [0, -0.01, 0], 'inOut'),
    ],
  ),
};

/** riding Minazuki: standing on its back, the knees soft, swaying with its flight */
const ride: ClipDef = {
  name: 'un_ride', dur: 2.4, loop: true, fadeIn: 0.2, fadeOut: 0.3,
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 2.4, c: ik(LOW) }],
    [
      key(0, I({ hips: [0, -14, 0], spine: [4, 6, 0], chest: [2, 6, 0], head: [-4, 4, 3], 'thigh.L': [-16, 0, 10], 'shin.L': [26, 0, 0], 'foot.L': [-8, 0, -4], 'thigh.R': [-4, 0, -10], 'shin.R': [18, 0, 0], 'foot.R': [-10, 0, 4] }), [0, -0.05, 0]),
      key(1.2, I({ hips: [0, -14, 3], spine: [4, 6, -2], chest: [2, 6, -1], head: [-4, 4, 4], 'thigh.L': [-18, 0, 10], 'shin.L': [30, 0, 0], 'foot.L': [-8, 0, -4], 'thigh.R': [-6, 0, -10], 'shin.R': [22, 0, 0], 'foot.R': [-10, 0, 4] }), [0, -0.07, 0], 'inOut'),
      key(2.4, I({ hips: [0, -14, 0], spine: [4, 6, 0], chest: [2, 6, 0], head: [-4, 4, 3], 'thigh.L': [-16, 0, 10], 'shin.L': [26, 0, 0], 'foot.L': [-8, 0, -4], 'thigh.R': [-4, 0, -10], 'shin.R': [18, 0, 0], 'foot.R': [-10, 0, 4] }), [0, -0.05, 0], 'inOut'),
    ],
  ),
};

// ------------------------------------------------------------------ Yachiru

const YIDLE: Record<string, E> = {
  hips: [0, -10, 0], spine: [6, 0, 0], chest: [4, -4, 0], neck: [4, 0, 0], head: [6, 8, -10],
  'thigh.L': [-10, 0, 8], 'shin.L': [16, 0, 0], 'foot.L': [-4, 0, -4], 'thigh.R': [6, 0, -8], 'shin.R': [14, 0, 0], 'foot.R': [-4, 0, 4],
  'upperarm.L': [4, 0, 10], 'forearm.L': [-10, 0, 0], 'hand.L': [0, 0, 0],
};
const Y = (over: Record<string, E> = {}): Record<string, E> => ({ ...YIDLE, ...over });
/** the blade hanging behind her right side, point down and back */
const HANG: Grip = { p: [-0.34, -0.3, 0.02], dir: [-0.62, -0.5, -0.6], edge: [0, -0.768, 0.64], pole: [-0.8, -0.3, 0.4] };

export const YACHIRU_STANCE: StanceDef = {
  idle: YIDLE,
  idleHips: -0.04,
  run: { spine: [18, 0, 0], chest: [6, 0, 0], head: [-12, 0, 0], 'upperarm.L': [30, 0, 14], 'forearm.L': [-40, 0, 0] },
  sprint: { spine: [26, 0, 0], chest: [10, 0, 0], head: [-18, 0, 0], 'upperarm.L': [60, 0, 16], 'forearm.L': [-30, 0, 0] },
  swingL: 0.6,
  swingR: 0.1,
  freqScale: 1.12,
  grip: {
    idle: HANG,
    walk: HANG,
    run: { p: [-0.3, -0.2, -0.12], dir: [-0.2, -0.25, -0.95], edge: [0, -0.97, 0.25], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.3, -0.12, -0.2], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.36, -0.06, 0.06], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

const ycut = (name: string, o: Parameters<typeof cut>[1]) => cut(name, { ...o, base: Y });

/** kendō 1: men — both hands, straight down from overhead */
const men = ycut('yc_men', {
  dur: 0.5, step: 0.05, hit: 0.14, combo: 0.24,
  swing: { a: [0, 0, 1], b: [0, -1, 0], c: [-0.04, 0.2, 0.1], r: 0.38, pole: [-0.7, -0.2, -0.65], twoHand: [0.5, 1, 1, 1, 0], keys: [[0, 20, 'out'], [0.08, -124, 'out'], [0.15, 10, 'outExpo'], [0.26, 24, 'out'], [0.5, 30, 'inOut']] },
  wind: { hips: [-4, 0, 0], spine: [-6, 0, 0], chest: [-8, 0, 0], head: [-2, 0, -4], 'thigh.L': [-14, 0, 8] },
  strike: { hips: [8, 0, 0], spine: [12, 0, 0], chest: [8, 0, 0], head: [-6, 0, -4], 'thigh.L': [-36, 0, 8], 'shin.L': [40, 0, 0], 'thigh.R': [22, 0, -8], 'shin.R': [20, 0, 0] },
  strikeHips: [0, -0.12, 0.14],
});
/** kendō 2: kesa — a two-handed diagonal down across */
const kesa = ycut('yc_kesa', {
  dur: 0.5, step: 0.05, hit: 0.14, combo: 0.24,
  swing: { a: [0, 0, 1], b: [0.62, -0.78, 0], c: [-0.06, 0.2, 0.08], r: 0.38, pole: [-0.6, -0.3, -0.7], twoHand: [0, 1, 1, 1, 0], keys: [[0, 10, 'out'], [0.08, -150, 'out'], [0.15, 24, 'outExpo'], [0.27, 56, 'out'], [0.5, 40, 'inOut']] },
  wind: { hips: [-2, -20, 0], spine: [-6, -10, 0], chest: [-8, -14, 0], head: [2, 16, -6] },
  strike: { hips: [8, 14, 0], spine: [10, 10, 0], chest: [8, 12, 0], head: [-4, -6, -6], 'thigh.L': [-38, 0, 8], 'shin.L': [42, 0, 0], 'thigh.R': [20, 0, -8], 'shin.R': [18, 0, 0] },
});
/** kendō 3: dō — a level cut across the body, both hands */
const dou = ycut('yc_do', {
  dur: 0.5, step: 0.05, hit: 0.14, combo: 0.24,
  swing: { a: [0, 0, 1], b: [1, -0.1, 0], c: [-0.12, 0, 0.06], r: 0.4, pole: [-0.5, -0.65, -0.55], twoHand: [0, 1, 1, 1, 0], keys: [[0, -60, 'out'], [0.08, -124, 'out'], [0.15, 40, 'outExpo'], [0.27, 106, 'out'], [0.5, 70, 'inOut']] },
  wind: { hips: [0, -26, 0], spine: [4, -12, 0], chest: [2, -18, 0], head: [2, 20, -6] },
  strike: { hips: [4, 22, 0], spine: [8, 14, 0], chest: [6, 22, 0], head: [-2, -18, -6], 'thigh.L': [-32, 0, 8], 'shin.L': [34, 0, 0], 'thigh.R': [18, 0, -8] },
});
/** kendō 4: tsuki — the two-handed thrust */
const tsuki: ClipDef = {
  name: 'yc_tsuki', dur: 0.56, fadeIn: 0.04, fadeOut: 0.2, events: { step: 0.07, hit: 0.15, combo: 0.26 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(HANG) },
      { t: 0.07, ease: 'inOut', c: ik({ p: [-0.2, -0.08, -0.08], dir: [0, 0.04, 1], edge: [0, -1, 0.04], pole: [-0.9, -0.2, -0.3] }, 1) },
      { t: 0.15, ease: 'outExpo', c: ik({ p: [-0.06, 0.12, 0.52], dir: [0.04, 0.47, 0.88], edge: [0, -0.88, 0.47], pole: [-0.8, -0.5, 0] }, 1) },
      { t: 0.3, ease: 'out', c: ik({ p: [-0.08, 0.11, 0.48], dir: [0.04, 0.47, 0.88], edge: [0, -0.88, 0.47], pole: [-0.8, -0.5, 0] }, 1) },
      { t: 0.56, ease: 'inOut', c: ik(HANG) },
    ],
    [
      key(0, Y()),
      key(0.07, Y({ hips: [0, -20, 0], spine: [4, -10, 0], chest: [2, -12, 0], head: [2, 16, -6] }), [0, -0.05, -0.02], 'inOut'),
      key(0.15, Y({ hips: [8, 8, 0], spine: [12, 6, 0], chest: [8, 6, 0], head: [-4, -6, -6], 'thigh.L': [-46, 0, 8], 'shin.L': [48, 0, 0], 'thigh.R': [26, 0, -8], 'shin.R': [18, 0, 0] }), [0, -0.14, 0.18], 'outExpo'),
      key(0.3, Y({ hips: [8, 8, 0], spine: [12, 6, 0], chest: [8, 6, 0], head: [-4, -6, -6], 'thigh.L': [-46, 0, 8], 'shin.L': [48, 0, 0], 'thigh.R': [26, 0, -8], 'shin.R': [18, 0, 0] }), [0, -0.14, 0.18], 'out'),
      key(0.56, Y(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};
/** flowing 1: a one-handed rising cut from low on the right up across to the left */
const flow1 = ycut('yc_flow1', {
  dur: 0.48, step: 0.04, hit: 0.13, combo: 0.22,
  swing: { a: [0, 0, 1], b: [0.85, 0.52, 0], c: [-0.12, 0.06, 0.05], r: 0.4, pole: [-0.5, -0.5, -0.7], keys: [[0, -100, 'out'], [0.07, -140, 'out'], [0.14, 40, 'outExpo'], [0.25, 100, 'out'], [0.48, 60, 'inOut']] },
  wind: { hips: [0, -22, 0], spine: [6, -10, 0], chest: [6, -16, 0], head: [2, 16, -6], 'upperarm.L': [10, 0, 30], 'forearm.L': [-20, 0, 0] },
  strike: { hips: [0, 20, 0], spine: [2, 12, 0], chest: [-2, 18, 0], head: [-2, -16, -6], 'thigh.L': [-28, 0, 8], 'shin.L': [30, 0, 0], 'upperarm.L': [20, 0, 50], 'forearm.L': [-10, 0, 0] },
});
/** flowing 2: a sweeping one-handed cut with the whole body turned into it */
const flow2 = ycut('yc_flow2', {
  dur: 0.52, step: 0.05, hit: 0.15, combo: 0.25,
  swing: { a: [0, 0, 1], b: [-1, 0.05, 0], c: [-0.16, 0.04, 0.04], r: 0.42, pole: [-0.4, -0.6, -0.7], sense: 1, keys: [[0, -40, 'out'], [0.08, -150, 'out'], [0.16, 30, 'outExpo'], [0.28, 110, 'out'], [0.52, 60, 'inOut']] },
  wind: { hips: [0, 34, 0], spine: [6, 18, 0], chest: [4, 28, 0], head: [2, -30, -6], 'upperarm.L': [-30, -30, 20], 'forearm.L': [-50, 0, 0] },
  strike: { hips: [2, -30, 0], spine: [6, -16, 0], chest: [4, -26, 0], head: [-2, 24, -6], 'thigh.L': [-20, 0, 8], 'shin.L': [26, 0, 0], 'thigh.R': [14, 0, -8], 'upperarm.L': [20, 0, 60], 'forearm.L': [-6, 0, 0] },
});
/** flowing 3: the backhand, high on the left down to low on the right */
const flow3 = ycut('yc_flow3', {
  dur: 0.5, step: 0.05, hit: 0.14, combo: 0.24,
  swing: { a: [0, 0, 1], b: [-0.7, -0.7, 0], c: [-0.06, 0.14, 0.06], r: 0.4, pole: [-0.3, -0.5, -0.8], keys: [[0, -100, 'out'], [0.08, -140, 'out'], [0.15, 30, 'outExpo'], [0.27, 80, 'out'], [0.5, 50, 'inOut']] },
  wind: { hips: [0, 20, 0], spine: [-2, 12, 0], chest: [-4, 18, 0], head: [2, -14, -6], 'upperarm.L': [0, 0, 20] },
  strike: { hips: [6, -16, 0], spine: [10, -10, 0], chest: [8, -16, 0], head: [-2, 14, -6], 'thigh.L': [-30, 0, 8], 'shin.L': [34, 0, 0], 'thigh.R': [16, 0, -8], 'upperarm.L': [10, 0, 40] },
});
/** flowing 4: a leaping cut, the blade brought down from high over the head */
const flow4 = ycut('yc_flow4', {
  dur: 0.64, step: 0.08, hit: 0.22, combo: 0.34,
  swing: { a: [0, 0, 1], b: [0.2, -1, 0], c: [-0.06, 0.22, 0.1], r: 0.42, pole: [-0.7, -0.2, -0.65], keys: [[0, 20, 'out'], [0.14, -140, 'inOut'], [0.23, 16, 'outExpo'], [0.36, 30, 'out'], [0.64, 30, 'inOut']] },
  wind: { hips: [-10, 0, 0], spine: [-10, 0, 0], chest: [-12, 0, 0], head: [-6, 0, -4], 'thigh.L': [-60, 0, 8], 'shin.L': [80, 0, 0], 'thigh.R': [-20, 0, -8], 'shin.R': [60, 0, 0], 'upperarm.L': [-20, 0, 50] },
  strike: { hips: [14, 0, 0], spine: [16, 0, 0], chest: [10, 0, 0], head: [-8, 0, -4], 'thigh.L': [-50, 0, 8], 'shin.L': [70, 0, 0], 'thigh.R': [20, 0, -8], 'shin.R': [40, 0, 0], 'upperarm.L': [20, 0, 50] },
  windHips: [0, 0.28, -0.02], strikeHips: [0, -0.2, 0.12],
});

/** RMB (Yachiru): the disarming flick — a short rising cut at the enemy's hands */
const disarm = ycut('yc_disarm', {
  dur: 0.5, step: 0.05, hit: 0.13,
  swing: { a: [0, 0, 1], b: [0, 1, 0], c: [-0.08, 0, 0.12], r: 0.4, pole: [-0.7, -0.4, -0.5], keys: [[0, -30, 'out'], [0.07, -50, 'out'], [0.14, 50, 'outExpo'], [0.26, 70, 'out'], [0.5, 30, 'inOut']] },
  wind: { hips: [2, 0, 0], spine: [8, 0, 0], chest: [8, 0, 0], head: [2, 0, -6], 'thigh.L': [-20, 0, 8], 'shin.L': [24, 0, 0] },
  strike: { hips: [0, 0, 0], spine: [-2, 0, 0], chest: [-6, 0, 0], head: [-6, 0, -6], 'thigh.L': [-28, 0, 8], 'shin.L': [26, 0, 0], 'upperarm.L': [10, 0, 40] },
});

/** Q (Yachiru): the throat thrust — a lightning lunge, one hand */
const throat: ClipDef = {
  name: 'yc_throat', dur: 0.62, fadeIn: 0.03, fadeOut: 0.2, events: { step: 0.06, hit: 0.15 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(HANG) },
      { t: 0.06, ease: 'inOut', c: ik({ p: [-0.24, 0.02, -0.14], dir: [0.02, 0.08, 1], edge: [0, -1, 0.08], pole: [-0.9, -0.2, -0.3] }) },
      { t: 0.15, ease: 'outExpo', c: ik({ p: [-0.04, 0.3, 0.52], dir: [0.04, 0.62, 0.78], edge: [0, -0.78, 0.62], pole: [-0.8, -0.5, 0] }) },
      { t: 0.34, ease: 'out', c: ik({ p: [-0.06, 0.29, 0.5], dir: [0.04, 0.62, 0.78], edge: [0, -0.78, 0.62], pole: [-0.8, -0.5, 0] }) },
      { t: 0.62, ease: 'inOut', c: ik(HANG) },
    ],
    [
      key(0, Y()),
      key(0.06, Y({ hips: [0, -28, 0], spine: [6, -12, 0], chest: [4, -16, 0], head: [2, 22, -6], 'upperarm.L': [-20, 0, 30], 'forearm.L': [-30, 0, 0] }), [0, -0.08, -0.04], 'inOut'),
      key(0.15, Y({ hips: [12, 14, 0], spine: [16, 8, 0], chest: [10, 10, 0], head: [-8, -10, -6], 'thigh.L': [-58, 0, 8], 'shin.L': [60, 0, 0], 'thigh.R': [34, 0, -8], 'shin.R': [20, 0, 0], 'upperarm.L': [30, 0, 30], 'forearm.L': [-10, 0, 0] }), [0, -0.2, 0.24], 'outExpo'),
      key(0.34, Y({ hips: [12, 14, 0], spine: [16, 8, 0], chest: [10, 10, 0], head: [-8, -10, -6], 'thigh.L': [-58, 0, 8], 'shin.L': [60, 0, 0], 'thigh.R': [34, 0, -8], 'shin.R': [20, 0, 0], 'upperarm.L': [30, 0, 30] }), [0, -0.2, 0.24], 'out'),
      key(0.62, Y(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** E (Yachiru): the dagger from behind — the left hand driven forward with the blade */
const dagger: ClipDef = {
  name: 'yc_dagger', dur: 0.56, fadeIn: 0.02, fadeOut: 0.2, events: { hit: 0.16 },
  keys: mergeKeys(
    [{ t: 0, c: ik(HANG) }, { t: 0.56, c: ik(HANG) }],
    [
      key(0, Y({ hips: [0, 20, 0], chest: [0, 14, 0], 'upperarm.L': [-30, -20, 20], 'forearm.L': [-90, 0, 0] })),
      key(0.08, Y({ hips: [0, 24, 0], spine: [8, 10, 0], chest: [6, 18, 0], head: [2, -10, -6], 'upperarm.L': [-10, -10, 30], 'forearm.L': [-110, 0, 0], 'hand.L': [20, 0, 0] }), [0, -0.06, 0], 'out'),
      key(0.16, Y({ hips: [6, -18, 0], spine: [12, -10, 0], chest: [10, -18, 0], head: [-4, 16, -6], 'upperarm.L': [-86, 6, 8], 'forearm.L': [-4, 0, 0], 'hand.L': [0, 0, 0], 'thigh.L': [-34, 0, 8], 'shin.L': [36, 0, 0], 'thigh.R': [18, 0, -8] }), [0, -0.1, 0.1], 'outExpo'),
      key(0.32, Y({ hips: [6, -16, 0], spine: [12, -8, 0], chest: [10, -16, 0], head: [-4, 14, -6], 'upperarm.L': [-82, 6, 8], 'forearm.L': [-8, 0, 0], 'thigh.L': [-34, 0, 8], 'shin.L': [36, 0, 0], 'thigh.R': [18, 0, -8] }), [0, -0.1, 0.1], 'out'),
      key(0.56, Y(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** R (Yachiru): the guard — the back of the left hand raised before her, waiting for the blow */
const guard: ClipDef = {
  name: 'yc_guard', dur: 0.9, fadeIn: 0.04, fadeOut: 0.16, events: { open: 0.06, close: 0.8 },
  keys: mergeKeys(
    [{ t: 0, c: ik(HANG) }, { t: 0.9, c: ik(HANG) }],
    [
      key(0, Y()),
      key(0.06, Y({ hips: [0, -10, 0], spine: [4, -6, 0], chest: [2, -10, 0], head: [2, 8, -8], 'upperarm.L': [-70, -30, 20], 'forearm.L': [-60, 0, 0], 'hand.L': [-30, 0, 30], 'thigh.L': [-16, 0, 8], 'shin.L': [20, 0, 0] }), [0, -0.05, 0], 'outExpo'),
      key(0.8, Y({ hips: [0, -10, 0], spine: [4, -6, 0], chest: [2, -10, 0], head: [2, 8, -8], 'upperarm.L': [-72, -30, 20], 'forearm.L': [-62, 0, 0], 'hand.L': [-30, 0, 30], 'thigh.L': [-16, 0, 8], 'shin.L': [20, 0, 0] }), [0, -0.05, 0], 'linear'),
      key(0.9, Y(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};
/** the counter after a turned blow: the hand sweeps the blade aside, the sword comes round into the neck */
const counter = ycut('yc_counter', {
  dur: 0.5, step: 0.03, hit: 0.12,
  swing: { a: [0, 0, 1], b: [1, 0.2, 0], c: [-0.12, 0.14, 0.06], r: 0.4, pole: [-0.5, -0.65, -0.55], keys: [[0, -80, 'out'], [0.05, -130, 'out'], [0.13, 40, 'outExpo'], [0.25, 96, 'out'], [0.5, 60, 'inOut']] },
  wind: { hips: [0, -26, 0], spine: [4, -14, 0], chest: [2, -20, 0], head: [2, 20, -8], 'upperarm.L': [-60, 20, 50], 'forearm.L': [-20, 0, 0] },
  strike: { hips: [4, 20, 0], spine: [8, 12, 0], chest: [6, 22, 0], head: [-2, -16, -8], 'thigh.L': [-30, 0, 8], 'shin.L': [32, 0, 0], 'upperarm.L': [10, 0, 50] },
});

/** F (Yachiru): Bankai — the blade upright, the clenched left hand dragged along it from the guard to the tip */
const bankai: ClipDef = {
  name: 'yc_bankai', dur: 1.6, fadeIn: 0.08, fadeOut: 0.3, events: { grip: 0.2, drag: 0.36, flood: 0.85 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(HANG) },
      { t: 0.2, ease: 'inOut', c: ik({ p: [-0.1, -0.02, 0.24], dir: [0.05, 1, 0.1], edge: [0, -0.1, 1], pole: [-0.8, -0.5, -0.2] }) },
      { t: 1.2, ease: 'linear', c: ik({ p: [-0.1, 0, 0.24], dir: [0.05, 1, 0.1], edge: [0, -0.1, 1], pole: [-0.8, -0.5, -0.2] }) },
      { t: 1.6, ease: 'inOut', c: ik(HANG) },
    ],
    [
      key(0, Y()),
      key(0.2, Y({ spine: [2, 0, 0], chest: [0, 0, 0], head: [6, 0, -6], 'upperarm.L': [-60, -40, 10], 'forearm.L': [-70, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.03, 0], 'inOut'),
      key(0.36, Y({ spine: [2, 0, 0], chest: [0, 0, 0], head: [6, 0, -6], 'upperarm.L': [-60, -40, 10], 'forearm.L': [-74, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.03, 0], 'inOut'),
      key(0.8, Y({ spine: [-2, 0, 0], chest: [-4, 0, 0], head: [-10, 0, -8], 'upperarm.L': [-140, -30, 10], 'forearm.L': [-30, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.02, 0], 'inOut'),
      key(1.2, Y({ spine: [-2, 0, 0], chest: [-4, 0, 0], head: [-14, 0, -8], 'upperarm.L': [-60, 10, 50], 'forearm.L': [-20, 0, 0] }), [0, -0.02, 0], 'out'),
      key(1.6, Y(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** RMB (Bankai): the bisecting cut — a jump and both hands straight down through everything */
const bisect = ycut('bk_bisect', {
  dur: 0.8, step: 0.12, hit: 0.3,
  swing: { a: [0, 0, 1], b: [0, -1, 0], c: [-0.04, 0.22, 0.1], r: 0.44, pole: [-0.7, -0.2, -0.65], twoHand: [0.5, 1, 1, 1, 0], keys: [[0, 20, 'out'], [0.2, -140, 'inOut'], [0.31, 16, 'outExpo'], [0.48, 30, 'out'], [0.8, 30, 'inOut']] },
  wind: { hips: [-10, 0, 0], spine: [-12, 0, 0], chest: [-14, 0, 0], head: [-8, 0, -4], 'thigh.L': [-50, 0, 8], 'shin.L': [70, 0, 0], 'thigh.R': [-16, 0, -8], 'shin.R': [50, 0, 0] },
  strike: { hips: [16, 0, 0], spine: [20, 0, 0], chest: [12, 0, 0], head: [-10, 0, -4], 'thigh.L': [-56, 0, 8], 'shin.L': [70, 0, 0], 'thigh.R': [24, 0, -8], 'shin.R': [40, 0, 0] },
  windHips: [0, 0.3, -0.04], strikeHips: [0, -0.24, 0.16],
});

/** Q (Bankai): the volley — three quick slashes, each throwing a wave of the fluid */
const volley: ClipDef = {
  name: 'bk_volley', dur: 0.82, fadeIn: 0.04, fadeOut: 0.2, events: { s1: 0.12, s2: 0.28, s3: 0.44 },
  keys: mergeKeys(
    swingKeys({ a: [0, 0, 1], b: [1, -0.1, 0], c: [-0.12, 0.08, 0.06], r: 0.4, pole: [-0.5, -0.65, -0.55], keys: [[0, -60, 'out'], [0.06, -120, 'out'], [0.13, 60, 'outExpo'], [0.21, 120, 'out'], [0.29, -60, 'outExpo'], [0.37, -120, 'out'], [0.45, 60, 'outExpo'], [0.58, 100, 'out'], [0.82, 30, 'inOut']] }),
    [
      key(0, Y()),
      key(0.06, Y({ hips: [0, -20, 0], chest: [2, -16, 0], head: [2, 16, -6] }), [0, -0.05, 0], 'out'),
      key(0.13, Y({ hips: [2, 18, 0], chest: [4, 18, 0], head: [-2, -14, -6], 'thigh.L': [-24, 0, 8], 'shin.L': [26, 0, 0] }), [0, -0.07, 0.05], 'outExpo'),
      key(0.29, Y({ hips: [2, -18, 0], chest: [4, -18, 0], head: [-2, 14, -6], 'thigh.L': [-24, 0, 8], 'shin.L': [26, 0, 0] }), [0, -0.07, 0.07], 'outExpo'),
      key(0.45, Y({ hips: [4, 20, 0], chest: [6, 20, 0], head: [-4, -16, -6], 'thigh.L': [-30, 0, 8], 'shin.L': [32, 0, 0] }), [0, -0.08, 0.1], 'outExpo'),
      key(0.82, Y(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** E (Bankai): the sphere of blades — slashes in every direction, turning on the spot */
const sphere: ClipDef = {
  name: 'bk_sphere', dur: 1.1, fadeIn: 0.04, fadeOut: 0.24, events: { s1: 0.12, s2: 0.3, s3: 0.48, s4: 0.66, sphere: 0.7 },
  keys: mergeKeys(
    swingKeys({ a: [0, 0, 1], b: [0.7, 0.7, 0], c: [-0.08, 0.12, 0.04], r: 0.42, pole: [-0.5, -0.5, -0.7], keys: [[0, -60, 'out'], [0.12, 120, 'outExpo'], [0.3, -110, 'outExpo'], [0.48, 130, 'outExpo'], [0.66, -100, 'outExpo'], [0.8, -60, 'out'], [1.1, 0, 'inOut']] }),
    [
      key(0, Y()),
      key(0.12, Y({ hips: [0, 30, 0], chest: [-6, 20, 0], head: [-6, -20, -6] }), [0, -0.06, 0], 'outExpo'),
      key(0.3, Y({ hips: [0, -30, 0], chest: [10, -20, 0], head: [2, 20, -6] }), [0, -0.1, 0], 'outExpo'),
      key(0.48, Y({ hips: [0, 34, 0], chest: [-8, 24, 0], head: [-8, -24, -6] }), [0, -0.06, 0], 'outExpo'),
      key(0.66, Y({ hips: [0, -32, 0], chest: [12, -22, 0], head: [4, 22, -6] }), [0, -0.12, 0], 'outExpo'),
      key(1.1, Y(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** R (Bankai): blades drawn up out of the pool — the left palm raised, then thrust at the target */
const draw: ClipDef = {
  name: 'bk_draw', dur: 0.96, fadeIn: 0.06, fadeOut: 0.24, events: { raise: 0.22, fire: 0.56 },
  keys: mergeKeys(
    [{ t: 0, c: ik(HANG) }, { t: 0.96, c: ik(HANG) }],
    [
      key(0, Y()),
      key(0.22, Y({ spine: [-4, 0, 0], chest: [-6, 0, 0], head: [-10, 0, -6], 'upperarm.L': [-110, 0, 40], 'forearm.L': [-30, 0, 0], 'hand.L': [-40, 0, 0], 'thigh.L': [-10, 0, 10], 'thigh.R': [6, 0, -10] }), [0, -0.02, 0], 'inOut'),
      key(0.48, Y({ spine: [-6, 0, 0], chest: [-8, 0, 0], head: [-12, 0, -6], 'upperarm.L': [-150, 0, 30], 'forearm.L': [-20, 0, 0], 'hand.L': [-40, 0, 0], 'thigh.L': [-10, 0, 10], 'thigh.R': [6, 0, -10] }), [0, -0.01, 0], 'inOut'),
      key(0.56, Y({ hips: [6, -12, 0], spine: [10, -6, 0], chest: [8, -12, 0], head: [-4, 10, -6], 'upperarm.L': [-82, 0, 10], 'forearm.L': [-4, 0, 0], 'hand.L': [-60, 0, 0], 'thigh.L': [-30, 0, 8], 'shin.L': [32, 0, 0], 'thigh.R': [16, 0, -8] }), [0, -0.07, 0.08], 'outExpo'),
      key(0.96, Y(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** Yachiru's Kaidō: the same palm on the heart, quicker */
const ykaido: ClipDef = { ...kaido, name: 'yc_kaido', dur: 0.8, events: { heal: 0.14 }, keys: kaido.keys.map((k) => ({ ...k, t: k.t * (0.8 / 1.2), c: k.c ? { ...k.c, ...ik(HANG) } : k.c })) };

export const UNOHANA_CLIPS: ClipDef[] = [
  ...ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name)),
  cut1, cut2, cut3, cut4, iai, kaido, daggers, bakudo, unbraid, shikai, ride,
  men, kesa, dou, tsuki, flow1, flow2, flow3, flow4, disarm, throat, dagger, guard, counter, bankai, ykaido,
  bisect, volley, sphere, draw,
];

export const UNOHANA_CHAIN = ['un_cut1', 'un_cut2', 'un_cut3', 'un_cut4'];
/** Yachiru's eight thousand styles: the strings alternate */
export const YACHIRU_CHAINS = [['yc_men', 'yc_kesa', 'yc_do', 'yc_tsuki'], ['yc_flow1', 'yc_flow2', 'yc_flow3', 'yc_flow4']];
