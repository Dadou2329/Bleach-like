// Baraggan Louisenbairn's animation set. Sealed: an old king's stoop and a wide planted stance, Arrogante
// held upright at his right side like a sceptre; slow, enormous one-handed sweeps (forehand, a rising
// backhand) and a two-handed overhead chop that cracks the ground; the Casual Swing (a long wind-up and one
// lazy cleave whose cut runs on far past the blades); the aging touch (two fingers on a shoulder); the royal
// throw (a hand on the throat, lifted and flung); the royal flare (arms spread, the reiatsu bursting out);
// Senescencia raised with an open palm; "Kuchiro, Arrogante" — the axe held out level in front of him, his
// head bowed while the black flames take him.
// Arrogante (the skeleton): upright and still, Gran Caída hanging in his right hand; one-handed chops, the
// Guillotine (both hands, overhead); Respira breathed out over an open left hand; the Respira slash; Gran
// Caída thrown; Respira Total — arms flung wide, the skull thrown back.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

/** the stoop: hips low, the spine and neck bent forward, the chin lifted to look ahead; the feet wide */
const IDLE: Record<string, E> = {
  hips: [0, -6, 0], spine: [10, 2, 0], chest: [8, 4, 0], neck: [10, 0, 0], head: [-16, -4, 0],
  'thigh.L': [-8, 0, 10], 'shin.L': [12, 0, 0], 'foot.L': [-4, 0, -6], 'thigh.R': [4, 0, -10], 'shin.R': [8, 0, 0], 'foot.R': [-4, 0, 6],
  'upperarm.L': [-6, 0, 12], 'forearm.L': [-22, 0, 0], 'hand.L': [8, 0, 0],
};
const I = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });

interface Grip { p: E; dir: E; edge: E; pole: E }
const ik = (g: Grip, two = 0) => ({ '@gripR': g.p, '@dirR': g.dir, '@edgeR': g.edge, '@poleR': g.pole, '@ikR': [1, 0, 0] as E, '@twoHand': [two, 0, 0] as E });
const ikL = (g: Grip, w = 1) => ({ '@gripL': g.p, '@dirL': g.dir, '@edgeL': g.edge, '@poleL': g.pole, '@ikL': [w, 0, 0] as E });

/** Arrogante upright at his right side, the blades spread left and right above his head */
const SCEPTRE: Grip = { p: [-0.33, -0.2, 0.16], dir: [0.04, 1, 0.12], edge: [1, 0, 0], pole: [-0.9, -0.3, -0.3] };
/** held out level in front of him, the head toward the ground (the release) */
const OFFER: Grip = { p: [-0.1, -0.02, 0.4], dir: [0.1, -0.5, 0.86], edge: [1, 0, 0.1], pole: [-0.8, -0.5, 0] };
/** Gran Caída hanging from his right hand, the head low */
const HANG: Grip = { p: [-0.3, -0.32, 0.08], dir: [0.05, -0.96, 0.28], edge: [0.2, 0.25, 0.95], pole: [-0.9, -0.2, -0.3] };
const SH: E = [-0.24, 0.2, 0.02];

export const BARAGGAN_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.03,
  run: { spine: [18, 0, 0], chest: [8, 0, 0], neck: [8, 0, 0], head: [-18, 0, 0], 'upperarm.L': [26, 0, 14], 'forearm.L': [-34, 0, 0] },
  sprint: { spine: [26, 0, 0], chest: [12, 0, 0], head: [-22, 0, 0], 'upperarm.L': [46, 0, 14], 'forearm.L': [-30, 0, 0] },
  swingL: 0.55,
  swingR: 0.1,
  freqScale: 0.9,
  grip: {
    idle: SCEPTRE,
    walk: SCEPTRE,
    run: { p: [-0.34, -0.16, -0.04], dir: [-0.1, 0.35, -0.93], edge: [1, 0, 0], pole: [-0.8, -0.3, 0.4] },
    sprint: { p: [-0.34, -0.12, -0.1], dir: [-0.15, 0.3, -0.94], edge: [1, 0, 0], pole: [-0.8, -0.3, 0.4] },
    air: { p: [-0.34, 0.0, 0.08], dir: [-0.3, 0.6, -0.74], edge: [0.6, -0.5, -0.6], pole: [-0.6, -0.5, -0.4] },
  },
};

/** the skeleton: upright, still, the skull level; the cloak does the moving */
const R_IDLE: Record<string, E> = {
  hips: [0, -4, 0], spine: [4, 2, 0], chest: [2, 2, 0], neck: [4, 0, 0], head: [-6, -2, 0],
  'thigh.L': [-4, 0, 6], 'shin.L': [6, 0, 0], 'thigh.R': [2, 0, -6], 'shin.R': [4, 0, 0],
  'upperarm.L': [-10, 0, 14], 'forearm.L': [-30, 0, 0], 'hand.L': [10, 0, 0],
};
const RI = (over: Record<string, E> = {}): Record<string, E> => ({ ...R_IDLE, ...over });

export const ARROGANTE_STANCE: StanceDef = {
  idle: R_IDLE,
  idleHips: -0.01,
  run: { spine: [14, 0, 0], chest: [6, 0, 0], head: [-12, 0, 0], 'upperarm.L': [20, 0, 16], 'forearm.L': [-30, 0, 0] },
  sprint: { spine: [22, 0, 0], chest: [10, 0, 0], head: [-16, 0, 0], 'upperarm.L': [40, 0, 16] },
  swingL: 0.3,
  swingR: 0.05,
  freqScale: 0.85,
  grip: {
    idle: HANG,
    walk: HANG,
    run: { p: [-0.32, -0.24, -0.06], dir: [-0.05, -0.5, -0.86], edge: [0.2, 0.86, -0.5], pole: [-0.9, -0.2, 0.3] },
    sprint: { p: [-0.32, -0.2, -0.12], dir: [-0.1, -0.3, -0.95], edge: [0.2, 0.95, -0.3], pole: [-0.9, -0.2, 0.3] },
    air: { p: [-0.32, -0.1, 0.06], dir: [-0.2, -0.4, -0.9], edge: [0.2, 0.9, -0.4], pole: [-0.7, -0.4, -0.3] },
  },
};

// ---------------------------------------------------------------------------------------------- sealed

/** a slow one-handed sweep: Arrogante swung round on his long arm, the body turning into it */
const sweep = (name: string, kind: 0 | 1, rel: boolean): ClipDef => {
  const B = rel ? RI : I;
  return {
    name, dur: rel ? 0.62 : 0.78, fadeIn: 0.06, fadeOut: 0.22, events: rel ? { step: 0.06, hit: 0.18, combo: 0.32 } : { step: 0.1, hit: 0.24, combo: 0.4 },
    keys: mergeKeys(
      swingKeys(kind === 0
        ? { a: [0, 0, 1], b: [1, -0.12, 0], c: SH, r: 0.5, pole: [-0.5, -0.6, -0.6], keys: rel ? [[0, -60, 'out'], [0.12, -130, 'out'], [0.24, 40, 'out'], [0.36, 92, 'out'], [0.62, 60, 'inOut']] : [[0, -60, 'out'], [0.16, -132, 'out'], [0.3, 40, 'out'], [0.44, 94, 'out'], [0.78, 60, 'inOut']] }
        : { a: [0, 0, 1], b: [-0.9, 0.42, 0], c: [-0.12, 0.12, 0.06], r: 0.5, pole: [-0.3, -0.4, -0.85], keys: rel ? [[0, -120, 'out'], [0.12, -128, 'out'], [0.24, 40, 'out'], [0.36, 90, 'out'], [0.62, 60, 'inOut']] : [[0, -120, 'out'], [0.16, -130, 'out'], [0.3, 44, 'out'], [0.44, 92, 'out'], [0.78, 60, 'inOut']] }),
      [
        key(0, B()),
        key(rel ? 0.12 : 0.16, B(kind === 1 ? { hips: [2, 18, 0], spine: [10, 12, 0], chest: [8, 14, 0], head: [-14, -12, 0] } : { hips: [2, -26, 0], spine: [10, -14, 0], chest: [6, -16, 0], head: [-14, 18, 0] }), [0, -0.05, 0], 'out'),
        key(rel ? 0.24 : 0.3, B(kind === 1
          ? { hips: [4, -18, 0], spine: [12, -12, 0], chest: [8, -16, 0], head: [-14, 14, 0], 'thigh.L': [-26, 0, 10], 'shin.L': [28, 0, 0] }
          : { hips: [4, 16, 0], spine: [14, 10, 0], chest: [8, 16, 0], head: [-14, -10, 0], 'thigh.L': [-28, 0, 10], 'shin.L': [30, 0, 0], 'thigh.R': [14, 0, -10] }), [0, -0.08, 0.06], 'out'),
        key(rel ? 0.62 : 0.78, B(), [0, -0.03, 0], 'inOut'),
      ],
    ),
  };
};

/** two hands, over his head and down: the blades bite the ground in front of him */
const chop = (name: string, big: boolean, rel: boolean): ClipDef => {
  const B = rel ? RI : I;
  const T = big ? 1.1 : 0.85;
  const up = big ? 0.3 : 0.2, down = big ? 0.46 : 0.32;
  return {
    name, dur: T, fadeIn: 0.06, fadeOut: 0.24, events: big ? { step: 0.16, hit: down - 0.04, slam: down } : { step: 0.12, hit: down - 0.05, slam: down, combo: down + 0.16 },
    keys: mergeKeys(
      swingKeys({ a: [0, 1, 0], b: [0, 0, 1], c: [-0.06, 0.24, 0.06], r: 0.44, pole: [-0.8, -0.3, -0.4], keys: [[0, rel ? 150 : 20, 'out'], [up, -48, 'inOut'], [down, 122, 'out'], [down + 0.16, 126, 'out'], [T, rel ? 150 : 20, 'inOut']], twoHand: [0, 1, 1, 1, 0] }),
      [
        key(0, B()),
        key(up, B({ hips: [-4, -6, 0], spine: [-10, -2, 0], chest: [-10, -2, 0], head: [-6, 4, 0], 'thigh.L': [-22, 0, 10], 'shin.L': [26, 0, 0], 'thigh.R': big ? [-26, 0, -10] : [8, 0, -10], 'shin.R': big ? [40, 0, 0] : [8, 0, 0] }), [0, big ? 0.22 : 0.02, -0.02], 'inOut'),
        key(down, B({ hips: [16, 4, 0], spine: [22, 2, 0], chest: [12, 2, 0], head: [-18, 0, 0], 'thigh.L': [-48, 0, 10], 'shin.L': [56, 0, 0], 'thigh.R': [24, 0, -10], 'shin.R': [30, 0, 0] }), [0, -0.2, 0.14], 'out'),
        key(T, B(), [0, -0.03, 0], 'inOut'),
      ],
    ),
  };
};

/** RMB (sealed): the Casual Swing — a long, lazy wind-up and one flat cleave; the cut runs on far past the blades */
const casual: ClipDef = {
  name: 'bg_heavy', dur: 1.15, fadeIn: 0.08, fadeOut: 0.26, events: { step: 0.36, hit: 0.46, cleave: 0.48 },
  keys: mergeKeys(
    swingKeys({ a: [0, 0, 1], b: [1, -0.05, 0], c: SH, r: 0.54, pole: [-0.5, -0.6, -0.6], keys: [[0, -60, 'out'], [0.36, -150, 'inOut'], [0.5, 50, 'outExpo'], [0.66, 104, 'out'], [1.15, 60, 'inOut']] }),
    [
      key(0, I()),
      key(0.36, I({ hips: [0, -40, 0], spine: [8, -18, 0], chest: [4, -22, 0], head: [-14, 30, 0], 'upperarm.L': [-20, 0, 40], 'forearm.L': [-30, 0, 0], 'thigh.L': [-14, 0, 10], 'thigh.R': [16, 0, -10], 'shin.R': [20, 0, 0] }), [0, -0.06, -0.02], 'inOut'),
      key(0.5, I({ hips: [4, 26, 0], spine: [12, 16, 0], chest: [8, 22, 0], head: [-14, -16, 0], 'upperarm.L': [10, 0, 30], 'thigh.L': [-34, 0, 10], 'shin.L': [36, 0, 0], 'thigh.R': [18, 0, -10] }), [0, -0.1, 0.08], 'outExpo'),
      key(0.66, I({ hips: [4, 30, 0], spine: [12, 18, 0], chest: [8, 24, 0], head: [-14, -18, 0], 'thigh.L': [-32, 0, 10], 'shin.L': [34, 0, 0], 'thigh.R': [18, 0, -10] }), [0, -0.1, 0.08], 'out'),
      key(1.15, I(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** Q: the aging touch — the axe kept at his side, two fingers of the left hand laid on a shoulder */
const touch: ClipDef = {
  name: 'bg_touch', dur: 0.75, fadeIn: 0.05, fadeOut: 0.22, events: { touch: 0.2 },
  keys: mergeKeys(
    [
      { t: 0, c: { ...ik(SCEPTRE), ...ikL({ p: [0.26, -0.24, 0.14], dir: [-0.2, -0.3, 0.93], edge: [-0.9, 0.2, -0.1], pole: [1, -0.4, -0.3] }, 0) } },
      { t: 0.2, ease: 'out', c: ikL({ p: [0.12, 0.16, 0.5], dir: [-0.15, 0.1, 0.98], edge: [-0.2, -0.97, 0], pole: [1, -0.5, -0.2] }) },
      { t: 0.42, c: ikL({ p: [0.12, 0.14, 0.48], dir: [-0.15, 0.1, 0.98], edge: [-0.2, -0.97, 0], pole: [1, -0.5, -0.2] }) },
      { t: 0.75, ease: 'inOut', c: { ...ik(SCEPTRE), ...ikL({ p: [0.26, -0.24, 0.14], dir: [-0.2, -0.3, 0.93], edge: [-0.9, 0.2, -0.1], pole: [1, -0.4, -0.3] }, 0) } },
    ],
    [
      key(0, I()),
      key(0.2, I({ hips: [2, 10, 0], spine: [14, 6, 0], chest: [10, 8, 0], head: [-16, -6, 0], 'thigh.L': [-20, 0, 10], 'shin.L': [22, 0, 0] }), [0, -0.05, 0.06], 'out'),
      key(0.42, I({ hips: [2, 10, 0], spine: [14, 6, 0], chest: [10, 8, 0], head: [-16, -6, 0], 'thigh.L': [-20, 0, 10], 'shin.L': [22, 0, 0] }), [0, -0.05, 0.06], 'linear'),
      key(0.75, I(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** E: the royal throw — a hand on the throat, lifted off the ground and flung aside */
const grab: ClipDef = {
  name: 'bg_grab', dur: 1.0, fadeIn: 0.05, fadeOut: 0.24, events: { grab: 0.18, throw: 0.62 },
  keys: mergeKeys(
    [
      { t: 0, c: { ...ik(SCEPTRE), ...ikL({ p: [0.26, -0.24, 0.14], dir: [-0.2, -0.3, 0.93], edge: [-0.9, 0.2, -0.1], pole: [1, -0.4, -0.3] }, 0) } },
      { t: 0.18, ease: 'out', c: ikL({ p: [0.16, 0.1, 0.52], dir: [0, 0.2, 0.98], edge: [-1, 0, 0], pole: [1, -0.6, -0.2] }) },
      { t: 0.46, ease: 'inOut', c: ikL({ p: [0.24, 0.42, 0.42], dir: [0, 0.6, 0.8], edge: [-1, 0, 0], pole: [1, -0.6, -0.2] }) },
      { t: 0.62, ease: 'outExpo', c: ikL({ p: [0.5, 0.1, 0.1], dir: [0.9, -0.2, 0.3], edge: [0, -1, 0], pole: [0.6, -0.8, -0.2] }) },
      { t: 1.0, ease: 'inOut', c: { ...ik(SCEPTRE), ...ikL({ p: [0.26, -0.24, 0.14], dir: [-0.2, -0.3, 0.93], edge: [-0.9, 0.2, -0.1], pole: [1, -0.4, -0.3] }, 0) } },
    ],
    [
      key(0, I()),
      key(0.18, I({ hips: [2, 8, 0], spine: [12, 4, 0], chest: [8, 6, 0], 'thigh.L': [-22, 0, 10], 'shin.L': [24, 0, 0] }), [0, -0.05, 0.06], 'out'),
      key(0.46, I({ hips: [-2, 4, 0], spine: [-2, 0, 0], chest: [-6, 0, 0], head: [-20, 0, 0], 'thigh.L': [-12, 0, 10] }), [0, 0, 0.02], 'inOut'),
      key(0.62, I({ hips: [4, -30, 0], spine: [10, -16, 0], chest: [6, -20, 0], head: [-14, -10, 0], 'thigh.L': [-14, 0, 14], 'thigh.R': [14, 0, -10] }), [0, -0.06, 0], 'outExpo'),
      key(1.0, I(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** R: the royal flare — both arms flung out, the reiatsu bursting off him */
const flare: ClipDef = {
  name: 'bg_flare', dur: 0.9, fadeIn: 0.08, fadeOut: 0.24, events: { burst: 0.34 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(SCEPTRE) },
      { t: 0.22, ease: 'inOut', c: ik({ p: [-0.26, 0.02, 0.12], dir: [-0.1, 0.98, 0.1], edge: [1, 0, 0], pole: [-0.9, -0.3, -0.2] }) },
      { t: 0.34, ease: 'outExpo', c: ik({ p: [-0.46, 0.1, 0.02], dir: [-0.3, 0.95, 0], edge: [0.9, 0.3, 0], pole: [-0.9, -0.4, 0] }) },
      { t: 0.6, c: ik({ p: [-0.46, 0.1, 0.02], dir: [-0.3, 0.95, 0], edge: [0.9, 0.3, 0], pole: [-0.9, -0.4, 0] }) },
      { t: 0.9, ease: 'inOut', c: ik(SCEPTRE) },
    ],
    [
      key(0, I()),
      key(0.22, I({ hips: [6, 0, 0], spine: [18, 0, 0], chest: [12, 0, 0], head: [-6, 0, 0], 'upperarm.L': [10, 0, 20], 'forearm.L': [-60, 0, 0], 'thigh.L': [-16, 0, 12], 'shin.L': [20, 0, 0], 'thigh.R': [6, 0, -12], 'shin.R': [14, 0, 0] }), [0, -0.08, 0], 'inOut'),
      key(0.34, I({ hips: [-4, 0, 0], spine: [-8, 0, 0], chest: [-12, 0, 0], neck: [-4, 0, 0], head: [-24, 0, 0], 'upperarm.L': [-20, 0, 70], 'forearm.L': [-10, 0, 0], 'thigh.L': [-10, 0, 18], 'thigh.R': [10, 0, -18] }), [0, -0.04, 0], 'outExpo'),
      key(0.6, I({ hips: [-4, 0, 0], spine: [-8, 0, 0], chest: [-12, 0, 0], neck: [-4, 0, 0], head: [-24, 0, 0], 'upperarm.L': [-20, 0, 70], 'forearm.L': [-10, 0, 0], 'thigh.L': [-10, 0, 18], 'thigh.R': [10, 0, -18] }), [0, -0.04, 0], 'linear'),
      key(0.9, I(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** G: Senescencia — the open left palm raised; time slows round him */
const field: ClipDef = {
  name: 'bg_field', dur: 0.8, fadeIn: 0.08, fadeOut: 0.24, events: { field: 0.3 },
  keys: mergeKeys(
    [
      { t: 0, c: { ...ik(SCEPTRE), ...ikL({ p: [0.26, -0.24, 0.14], dir: [-0.2, -0.3, 0.93], edge: [-0.9, 0.2, -0.1], pole: [1, -0.4, -0.3] }, 0) } },
      { t: 0.3, ease: 'out', c: ikL({ p: [0.22, 0.2, 0.36], dir: [0, 1, 0.1], edge: [0, 0.1, -1], pole: [1, -0.6, -0.2] }) },
      { t: 0.55, c: ikL({ p: [0.22, 0.2, 0.36], dir: [0, 1, 0.1], edge: [0, 0.1, -1], pole: [1, -0.6, -0.2] }) },
      { t: 0.8, ease: 'inOut', c: { ...ik(SCEPTRE), ...ikL({ p: [0.26, -0.24, 0.14], dir: [-0.2, -0.3, 0.93], edge: [-0.9, 0.2, -0.1], pole: [1, -0.4, -0.3] }, 0) } },
    ],
    [
      key(0, I()),
      key(0.3, I({ spine: [4, 0, 0], chest: [0, 0, 0], neck: [4, 0, 0], head: [-18, 0, 0] }), [0, -0.02, 0], 'out'),
      key(0.55, I({ spine: [4, 0, 0], chest: [0, 0, 0], neck: [4, 0, 0], head: [-18, 0, 0] }), [0, -0.02, 0], 'linear'),
      key(0.8, I(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** F: "Kuchiro, Arrogante" — the axe held out level, head bowed; the black flames climb him */
const release: ClipDef = {
  name: 'bg_release', dur: 1.6, fadeIn: 0.1, fadeOut: 0.2, events: { word: 0.3, flames: 0.5, form: 1.25 },
  keys: mergeKeys(
    [{ t: 0, c: ik(SCEPTRE) }, { t: 0.32, ease: 'inOut', c: ik(OFFER) }, { t: 1.6, c: ik(OFFER) }],
    [
      key(0, I()),
      key(0.32, I({ hips: [0, 0, 0], spine: [6, 0, 0], chest: [4, 0, 0], neck: [18, 0, 0], head: [16, 0, 0], 'thigh.L': [-8, 0, 12], 'thigh.R': [6, 0, -12] }), [0, -0.02, 0], 'inOut'),
      key(1.6, I({ hips: [0, 0, 0], spine: [8, 0, 0], chest: [6, 0, 0], neck: [20, 0, 0], head: [18, 0, 0], 'thigh.L': [-8, 0, 12], 'thigh.R': [6, 0, -12] }), [0, -0.02, 0], 'linear'),
    ],
  ),
};

// ---------------------------------------------------------------------------------------------- Arrogante

/** Q (Arrogante): Respira — the left hand opened toward the target, the miasma pouring out over it (held) */
const respira: ClipDef = {
  name: 'ar_respira', dur: 0.5, fadeIn: 0.12, fadeOut: 0.3, events: { breath: 0.25 },
  keys: mergeKeys(
    [
      { t: 0, c: { ...ik(HANG), ...ikL({ p: [0.24, -0.2, 0.16], dir: [-0.2, -0.3, 0.93], edge: [-0.9, 0.2, -0.1], pole: [1, -0.4, -0.3] }, 0) } },
      { t: 0.25, ease: 'out', c: ikL({ p: [0.14, 0.08, 0.5], dir: [0, 0.3, 0.95], edge: [0, -0.95, 0.3], pole: [1, -0.5, -0.2] }) },
      { t: 0.5, c: ikL({ p: [0.14, 0.08, 0.5], dir: [0, 0.3, 0.95], edge: [0, -0.95, 0.3], pole: [1, -0.5, -0.2] }) },
    ],
    [
      key(0, RI()),
      key(0.25, RI({ spine: [8, 6, 0], chest: [6, 8, 0], head: [-4, -6, 0], 'thigh.L': [-16, 0, 8], 'shin.L': [18, 0, 0] }), [0, -0.03, 0.04], 'out'),
      key(0.5, RI({ spine: [8, 6, 0], chest: [6, 8, 0], head: [-4, -6, 0], 'thigh.L': [-16, 0, 8], 'shin.L': [18, 0, 0] }), [0, -0.03, 0.04], 'linear'),
    ],
  ),
};

/** E (Arrogante): the Respira slash — a wide rising cut that throws a crescent of rot */
const rslash: ClipDef = {
  name: 'ar_slash', dur: 0.8, fadeIn: 0.06, fadeOut: 0.22, events: { fire: 0.26 },
  keys: mergeKeys(
    swingKeys({ a: [0, 0, 1], b: [-0.9, 0.42, 0], c: [-0.12, 0.12, 0.06], r: 0.5, pole: [-0.3, -0.4, -0.85], keys: [[0, -100, 'out'], [0.14, -132, 'out'], [0.26, 40, 'outExpo'], [0.4, 96, 'out'], [0.8, 150, 'inOut']] }),
    [
      key(0, RI()),
      key(0.14, RI({ hips: [2, 20, 0], spine: [10, 12, 0], chest: [8, 16, 0], head: [-10, -12, 0] }), [0, -0.05, 0], 'out'),
      key(0.26, RI({ hips: [4, -20, 0], spine: [10, -14, 0], chest: [6, -18, 0], head: [-10, 14, 0], 'thigh.L': [-26, 0, 8], 'shin.L': [28, 0, 0] }), [0, -0.06, 0.06], 'outExpo'),
      key(0.8, RI(), [0, -0.01, 0], 'inOut'),
    ],
  ),
};

/** R (Arrogante): Gran Caída thrown overhand, spinning */
const athrow: ClipDef = {
  name: 'ar_throw', dur: 0.75, fadeIn: 0.06, fadeOut: 0.2, events: { throw: 0.3 },
  keys: mergeKeys(
    swingKeys({ a: [0, 1, 0], b: [0, 0, 1], c: SH, r: 0.48, pole: [-0.8, -0.3, -0.3], keys: [[0, 150, 'out'], [0.18, -40, 'inOut'], [0.3, 96, 'outExpo'], [0.44, 104, 'out'], [0.75, 150, 'inOut']] }),
    [
      key(0, RI()),
      key(0.18, RI({ hips: [-2, -22, 0], spine: [4, -12, 0], chest: [-4, -14, 0], head: [-8, 16, 0] }), [0, -0.02, -0.04], 'inOut'),
      key(0.3, RI({ hips: [8, 14, 0], spine: [16, 10, 0], chest: [10, 12, 0], head: [-10, -8, 0], 'thigh.L': [-28, 0, 8], 'shin.L': [32, 0, 0] }), [0, -0.08, 0.08], 'outExpo'),
      key(0.75, RI(), [0, -0.01, 0], 'inOut'),
    ],
  ),
};

/** F (Arrogante): Respira Total — arms flung wide, the skull thrown back; the miasma floods out on every side */
const total: ClipDef = {
  name: 'ar_total', dur: 1.5, fadeIn: 0.1, fadeOut: 0.3, events: { gather: 0.2, burst: 0.62 },
  keys: mergeKeys(
    [
      { t: 0, c: { ...ik(HANG), ...ikL({ p: [0.24, -0.2, 0.16], dir: [-0.2, -0.3, 0.93], edge: [-0.9, 0.2, -0.1], pole: [1, -0.4, -0.3] }, 0) } },
      { t: 0.4, ease: 'inOut', c: { ...ik({ p: [-0.2, -0.05, 0.22], dir: [0.3, -0.5, 0.8], edge: [0.9, 0.3, 0], pole: [-0.8, -0.5, -0.2] }), ...ikL({ p: [0.18, 0, 0.24], dir: [-0.3, -0.5, 0.8], edge: [-0.9, 0.3, 0], pole: [0.8, -0.5, -0.2] }) } },
      { t: 0.62, ease: 'outExpo', c: { ...ik({ p: [-0.5, 0.18, 0.04], dir: [-0.6, 0.6, -0.4], edge: [0.6, 0.7, 0.2], pole: [-0.8, -0.5, -0.2] }), ...ikL({ p: [0.5, 0.18, 0.04], dir: [0.6, 0.6, -0.4], edge: [-0.6, 0.7, 0.2], pole: [0.8, -0.5, -0.2] }) } },
      { t: 1.1, c: { ...ik({ p: [-0.5, 0.18, 0.04], dir: [-0.6, 0.6, -0.4], edge: [0.6, 0.7, 0.2], pole: [-0.8, -0.5, -0.2] }), ...ikL({ p: [0.5, 0.18, 0.04], dir: [0.6, 0.6, -0.4], edge: [-0.6, 0.7, 0.2], pole: [0.8, -0.5, -0.2] }) } },
      { t: 1.5, ease: 'inOut', c: { ...ik(HANG), ...ikL({ p: [0.24, -0.2, 0.16], dir: [-0.2, -0.3, 0.93], edge: [-0.9, 0.2, -0.1], pole: [1, -0.4, -0.3] }, 0) } },
    ],
    [
      key(0, RI()),
      key(0.4, RI({ hips: [10, 0, 0], spine: [24, 0, 0], chest: [16, 0, 0], neck: [10, 0, 0], head: [10, 0, 0], 'thigh.L': [-30, 0, 10], 'shin.L': [40, 0, 0], 'thigh.R': [-20, 0, -10], 'shin.R': [34, 0, 0] }), [0, -0.14, 0], 'inOut'),
      key(0.62, RI({ hips: [-6, 0, 0], spine: [-14, 0, 0], chest: [-16, 0, 0], neck: [-12, 0, 0], head: [-28, 0, 0], 'thigh.L': [-6, 0, 16], 'thigh.R': [6, 0, -16] }), [0, 0.02, 0], 'outExpo'),
      key(1.1, RI({ hips: [-6, 0, 0], spine: [-14, 0, 0], chest: [-16, 0, 0], neck: [-12, 0, 0], head: [-28, 0, 0], 'thigh.L': [-6, 0, 16], 'thigh.R': [6, 0, -16] }), [0, 0.02, 0], 'linear'),
      key(1.5, RI(), [0, -0.01, 0], 'inOut'),
    ],
  ),
};

export const BARAGGAN_CLIPS: ClipDef[] = [
  sweep('bg_cut1', 0, false), sweep('bg_cut2', 1, false), chop('bg_cut3', false, false), casual, touch, grab, flare, field, release,
  sweep('ar_cut1', 0, true), sweep('ar_cut2', 1, true), chop('ar_cut3', false, true), chop('ar_heavy', true, true), respira, rslash, athrow, total,
  ...ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name)),
];
export const BARAGGAN_CHAIN = ['bg_cut1', 'bg_cut2', 'bg_cut3'];
export const ARROGANTE_CHAIN = ['ar_cut1', 'ar_cut2', 'ar_cut3'];
