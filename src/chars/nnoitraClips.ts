// Nnoitra Gilga's animation set. Sealed: a swaggering hunch, wide stance, Santa Teresa resting over his right
// shoulder; huge one-handed sweeps (forehand, rising backhand), a two-handed overhead slam and a front kick;
// the Crescent Smash (a hop and an overhead that comes down like a falling building); the chain throw (the
// weapon flung forward on its chain, the arm held out while it flies) and the yank that brings it back; the
// whirl overhead; the tongue Cero (leaning in, tongue out); Indice Radar (a finger jabbed into the ground);
// the eyepatch torn off; "Inore, Santa Teresa" (the weapon raised overhead in both hands).
// Santa Teresa: four arms, each with a mantis scythe; the upper pair (IK channels R / L) and the lower pair
// (R2 / L2) swing their own arcs — a pair at a time in the flurry, all four in the Mantis Cross and the
// whirl; one scythe thrown overhead (it grows back).
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys, type SwingDef } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

/** a swagger: hunched forward, chin up, the feet wide */
const IDLE: Record<string, E> = {
  hips: [0, -8, 0], spine: [10, 4, 0], chest: [6, 4, 0], neck: [6, 0, 0], head: [-14, -6, 0],
  'thigh.L': [-6, 0, 9], 'shin.L': [8, 0, 0], 'foot.L': [-2, 0, -4], 'thigh.R': [6, 0, -10], 'shin.R': [6, 0, 0], 'foot.R': [-6, 0, 4],
  'upperarm.L': [-6, 0, 8], 'forearm.L': [-14, 0, 0], 'hand.L': [6, 0, 0],
};
const I = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });

interface Grip { p: E; dir: E; edge: E; pole: E }
const ik = (g: Grip, two = 0) => ({ '@gripR': g.p, '@dirR': g.dir, '@edgeR': g.edge, '@poleR': g.pole, '@ikR': [1, 0, 0] as E, '@twoHand': [two, 0, 0] as E });
const ikL = (g: Grip, w = 1) => ({ '@gripL': g.p, '@dirL': g.dir, '@edgeL': g.edge, '@poleL': g.pole, '@ikL': [w, 0, 0] as E });

/** Santa Teresa over his right shoulder, the crescents riding up behind his head */
const REST: Grip = { p: [-0.16, 0.16, 0.14], dir: [-0.15, 0.7, -0.7], edge: [0.15, -0.68, -0.71], pole: [-0.8, -0.5, 0.2] };
/** raised overhead in both hands (the prayer) */
const PRAY: Grip = { p: [-0.02, 0.62, 0.12], dir: [0.05, 0.99, 0.1], edge: [0, 0.1, -1], pole: [-0.8, 0.1, -0.4] };
/** the arm out after the throw, holding the chain */
const THROWN: Grip = { p: [-0.14, 0.14, 0.52], dir: [0, 0.1, 1], edge: [0, -1, 0.1], pole: [-0.8, -0.4, -0.2] };

export const NNOITRA_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.03,
  run: { spine: [16, 0, 0], chest: [8, 0, 0], head: [-14, 0, 0], 'upperarm.L': [24, 0, 12], 'forearm.L': [-30, 0, 0] },
  sprint: { spine: [24, 0, 0], chest: [12, 0, 0], head: [-18, 0, 0], 'upperarm.L': [50, 0, 14], 'forearm.L': [-24, 0, 0] },
  swingL: 0.6,
  swingR: 0.1,
  freqScale: 0.85,
  grip: {
    idle: REST,
    walk: REST,
    run: { p: [-0.32, -0.12, -0.05], dir: [-0.1, 0.05, -0.99], edge: [0, -1, -0.05], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.32, -0.04, -0.12], dir: [-0.15, 0.19, -0.97], edge: [-0.03, -0.98, -0.19], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.36, 0.0, 0.1], dir: [-0.41, 0.51, -0.76], edge: [0.48, -0.59, -0.65], pole: [-0.6, -0.5, -0.4] },
  },
};

// ---------------------------------------------------------------------------------------------- Santa Teresa

/** four arms in a mantis guard: the upper scythes raised, hooks forward; the lower pair low and forward */
const S_ARMS: Record<string, E> = {
  'upperarm.R': [-41, 34, -58], 'forearm.R': [-128, 0, 0], 'hand.R': [140, -43, 53],
  'upperarm.L': [-41, -34, 58], 'forearm.L': [-128, 0, 0], 'hand.L': [140, 43, -53],
  'upperarm2.R': [22, 13, -37], 'forearm2.R': [-123, 0, 0], 'hand2.R': [101, -41, 28],
  'upperarm2.L': [22, -13, 37], 'forearm2.L': [-123, 0, 0], 'hand2.L': [101, 41, -28],
};
const S_IDLE: Record<string, E> = {
  ...IDLE, ...S_ARMS,
  hips: [0, -6, 0], spine: [14, 2, 0], chest: [8, 2, 0], neck: [4, 0, 0], head: [-16, -4, 0],
  'thigh.L': [-10, 0, 12], 'shin.L': [14, 0, 0], 'thigh.R': [8, 0, -12], 'shin.R': [12, 0, 0],
};
const SI = (over: Record<string, E> = {}): Record<string, E> => ({ ...S_IDLE, ...over });

export const SANTA_STANCE: StanceDef = {
  idle: S_IDLE,
  idleHips: -0.06,
  run: { spine: [20, 0, 0], chest: [10, 0, 0], head: [-16, 0, 0] },
  sprint: { spine: [28, 0, 0], chest: [12, 0, 0], head: [-20, 0, 0] },
  swingL: 0.05,
  swingR: 0.05,
  freqScale: 0.85,
};

const SH: E = [-0.2, 0.24, 0.04];
const SHL: E = [0.2, 0.24, 0.04];
const SH2: E = [-0.175, 0.06, 0.02];
const SHL2: E = [0.175, 0.06, 0.02];

// ---------------------------------------------------------------------------------------------- sealed

/** the sweeps: huge one-handed arcs (the crescent head reaches far past his long arm) */
const sweep = (name: string, kind: 0 | 1): ClipDef => ({
  name, dur: 0.62, fadeIn: 0.05, fadeOut: 0.2, events: { step: 0.06, hit: 0.16, combo: 0.3 },
  keys: mergeKeys(
    swingKeys(kind === 0
      ? { a: [0, 0, 1], b: [1, -0.1, 0], c: SH, r: 0.46, pole: [-0.5, -0.6, -0.6], keys: [[0, -70, 'out'], [0.12, -125, 'out'], [0.22, 30, 'out'], [0.34, 88, 'out'], [0.62, 60, 'inOut']] }
      : { a: [0, 0, 1], b: [-0.85, 0.52, 0], c: [-0.1, 0.14, 0.06], r: 0.46, pole: [-0.3, -0.4, -0.85], keys: [[0, -135, 'out'], [0.12, -120, 'out'], [0.22, 46, 'out'], [0.34, 92, 'out'], [0.62, 60, 'inOut']] }),
    [
      key(0, I()),
      key(0.12, I(kind === 1 ? { hips: [2, 16, 0], spine: [10, 10, 0], chest: [6, 14, 0], head: [-14, -10, 0] } : { hips: [2, -24, 0], spine: [10, -12, 0], chest: [6, -14, 0], head: [-14, 16, 0] }), [0, -0.04, 0], 'out'),
      key(0.22, I(kind === 1
        ? { hips: [2, -16, 0], spine: [12, -10, 0], chest: [8, -16, 0], head: [-14, 14, 0], 'thigh.L': [-26, 0, 9], 'shin.L': [28, 0, 0] }
        : { hips: [4, 14, 0], spine: [14, 8, 0], chest: [8, 16, 0], head: [-14, -8, 0], 'thigh.L': [-28, 0, 9], 'shin.L': [30, 0, 0], 'thigh.R': [14, 0, -10] }), [0, -0.08, 0.08], 'out'),
      key(0.62, I(), [0, -0.03, 0], 'inOut'),
    ],
  ),
});

/** the overhead slam: both hands, over and down so the crescents bite into the ground */
const slam = (name: string, big: boolean): ClipDef => ({
  name, dur: big ? 0.95 : 0.75, fadeIn: 0.06, fadeOut: 0.24, events: big ? { step: 0.1, hit: 0.28, slam: 0.33 } : { step: 0.1, hit: 0.2, slam: 0.26, combo: 0.42 },
  keys: mergeKeys(
    swingKeys({ a: [0, 1, 0], b: [0, 0, 1], c: [-0.06, 0.26, 0.06], r: 0.42, pole: [-0.8, -0.3, -0.4], keys: big ? [[0, 60, 'out'], [0.2, -50, 'inOut'], [0.33, 120, 'out'], [0.5, 124, 'out'], [0.95, 90, 'inOut']] : [[0, 60, 'out'], [0.14, -40, 'inOut'], [0.26, 118, 'out'], [0.42, 122, 'out'], [0.75, 90, 'inOut']], twoHand: [0, 1, 1, 1, 0] }),
    [
      key(0, I()),
      key(big ? 0.2 : 0.14, I({ hips: [-4, -6, 0], spine: [-10, -2, 0], chest: [-10, -2, 0], head: [-6, 4, 0], 'thigh.L': [-20, 0, 9], 'shin.L': [26, 0, 0], 'thigh.R': big ? [-30, 0, -10] : [10, 0, -10], 'shin.R': big ? [50, 0, 0] : [8, 0, 0] }), [0, big ? 0.35 : 0.02, -0.02], 'inOut'),
      key(big ? 0.33 : 0.26, I({ hips: [16, 4, 0], spine: [20, 2, 0], chest: [12, 2, 0], head: [-18, 0, 0], 'thigh.L': [-46, 0, 9], 'shin.L': [52, 0, 0], 'thigh.R': [24, 0, -10], 'shin.R': [28, 0, 0] }), [0, -0.22, 0.16], 'out'),
      key(big ? 0.95 : 0.75, I(), [0, -0.03, 0], 'inOut'),
    ],
  ),
});

/** the kick: a long front kick off the left leg, the weapon still on his shoulder */
const kick: ClipDef = {
  name: 'nn_kick', dur: 0.55, fadeIn: 0.05, fadeOut: 0.2, events: { step: 0.05, hit: 0.14, combo: 0.3 },
  keys: mergeKeys(
    [{ t: 0, c: ik(REST) }, { t: 0.55, c: ik(REST) }],
    [
      key(0, I()),
      key(0.08, I({ hips: [-6, 4, 0], spine: [-6, 0, 0], chest: [-4, 0, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [70, 0, 0], 'thigh.R': [4, 0, -6], 'upperarm.L': [20, 0, 30] }), [0, 0, -0.04], 'out'),
      key(0.15, I({ hips: [-14, 6, 0], spine: [-10, 0, 0], chest: [-6, 0, 0], 'thigh.L': [-92, 0, 6], 'shin.L': [6, 0, 0], 'foot.L': [20, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [10, 0, 0], 'upperarm.L': [30, 0, 36] }), [0, -0.02, 0.06], 'out'),
      key(0.3, I({ hips: [-8, 4, 0], spine: [-6, 0, 0], 'thigh.L': [-60, 0, 6], 'shin.L': [60, 0, 0], 'upperarm.L': [20, 0, 30] }), [0, 0, 0.04], 'inOut'),
      key(0.55, I(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** Q: the throw — drawn back over his shoulder and hurled out on its chain; the arm stays out holding it */
const thrw: ClipDef = {
  name: 'nn_throw', dur: 0.6, fadeIn: 0.06, fadeOut: 0.2, events: { throw: 0.3 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(REST) },
      { t: 0.2, ease: 'inOut', c: ik({ p: [-0.3, 0.34, -0.2], dir: [-0.2, 0.6, -0.78], edge: [0.1, -0.78, -0.6], pole: [-0.7, -0.4, 0.5] }) },
      { t: 0.3, ease: 'out', c: ik(THROWN) },
      { t: 0.6, c: ik(THROWN) },
    ],
    [
      key(0, I()),
      key(0.2, I({ hips: [-2, -26, 0], spine: [2, -14, 0], chest: [-4, -16, 0], head: [-12, 20, 0], 'upperarm.L': [-30, 0, 30], 'forearm.L': [-20, 0, 0], 'thigh.L': [-20, 0, 9], 'thigh.R': [10, 0, -10] }), [0, -0.02, -0.04], 'inOut'),
      key(0.3, I({ hips: [8, 14, 0], spine: [16, 10, 0], chest: [10, 12, 0], head: [-14, -10, 0], 'upperarm.L': [30, 0, 20], 'thigh.L': [-36, 0, 9], 'shin.L': [40, 0, 0], 'thigh.R': [18, 0, -10] }), [0, -0.1, 0.12], 'out'),
      key(0.6, I({ hips: [6, 10, 0], spine: [14, 8, 0], chest: [8, 10, 0], head: [-14, -8, 0], 'thigh.L': [-30, 0, 9], 'shin.L': [34, 0, 0], 'thigh.R': [16, 0, -10] }), [0, -0.08, 0.1], 'linear'),
    ],
  ),
};

/** the yank: the chain hauled back hand over hand, the weapon caught */
const yank: ClipDef = {
  name: 'nn_yank', dur: 0.5, fadeIn: 0.04, fadeOut: 0.2, events: { catch: 0.24 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(THROWN) },
      { t: 0.16, ease: 'out', c: ik({ p: [-0.3, 0.1, -0.12], dir: [-0.2, 0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.4, 0.4] }) },
      { t: 0.5, ease: 'inOut', c: ik(REST) },
    ],
    [
      key(0, I({ hips: [6, 10, 0], spine: [14, 8, 0], chest: [8, 10, 0], head: [-14, -8, 0] })),
      key(0.16, I({ hips: [-4, -14, 0], spine: [-2, -8, 0], chest: [-4, -10, 0], 'upperarm.L': [20, 0, 20], 'thigh.L': [-10, 0, 9], 'thigh.R': [16, 0, -10] }), [0, -0.02, -0.06], 'out'),
      key(0.5, I(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** E: the whirl — the weapon swung round overhead by its chain (loops while held) */
const whirl: ClipDef = {
  name: 'nn_whirl', dur: 0.5, loop: true, fadeIn: 0.1, fadeOut: 0.2,
  keys: mergeKeys(
    [0, 0.125, 0.25, 0.375, 0.5].map((t, i) => {
      const a = (i / 4) * Math.PI * 2;
      return { t, ease: 'linear' as const, c: ik({ p: [-0.12 + Math.cos(a) * 0.08, 0.6, 0.06 + Math.sin(a) * 0.08], dir: [Math.cos(a) * 0.5, 0.6, Math.sin(a) * 0.5], edge: [-Math.sin(a), 0, Math.cos(a)], pole: [-0.8, -0.2, -0.4] }) };
    }),
    [key(0, I({ head: [-20, 0, 0], 'upperarm.L': [-10, 0, 30], 'thigh.L': [-10, 0, 12], 'thigh.R': [10, 0, -12] }), [0, -0.04, 0]), key(0.5, I({ head: [-20, 0, 0], 'upperarm.L': [-10, 0, 30], 'thigh.L': [-10, 0, 12], 'thigh.R': [10, 0, -12] }), [0, -0.04, 0])],
  ),
};

/** R: the tongue Cero — leaning in, tongue out, the gold charging on its tip */
const cero = (name: string, santa: boolean): ClipDef => ({
  name, dur: 0.95, fadeIn: 0.08, fadeOut: 0.24, events: { charge: 0.1, fire: 0.46 },
  keys: mergeKeys(
    santa ? [] : [{ t: 0, c: ik(REST) }, { t: 0.95, c: ik(REST) }],
    [
      key(0, santa ? SI() : I()),
      key(0.12, (santa ? SI : I)({ hips: [0, -6, 0], spine: [18, 0, 0], chest: [12, 0, 0], neck: [-6, 0, 0], head: [-10, 0, 0], 'thigh.L': [-22, 0, 9], 'shin.L': [26, 0, 0], 'thigh.R': [12, 0, -10] }), [0, -0.1, 0.06], 'out'),
      key(0.46, (santa ? SI : I)({ hips: [0, -6, 0], spine: [20, 0, 0], chest: [14, 0, 0], neck: [-6, 0, 0], head: [-8, 0, 0], 'thigh.L': [-24, 0, 9], 'shin.L': [28, 0, 0], 'thigh.R': [14, 0, -10] }), [0, -0.11, 0.07], 'linear'),
      key(0.56, (santa ? SI : I)({ hips: [-4, -6, 0], spine: [6, 0, 0], chest: [2, 0, 0], neck: [0, 0, 0], head: [-20, 0, 0], 'thigh.L': [-14, 0, 9], 'thigh.R': [16, 0, -10] }), [0, -0.06, -0.04], 'out'),
      key(0.95, santa ? SI() : I(), [0, -0.03, 0], 'inOut'),
    ],
  ),
});

/** Indice Radar — down on one knee, a finger jabbed into the ground */
const radar: ClipDef = {
  name: 'nn_radar', dur: 1.1, fadeIn: 0.1, fadeOut: 0.25, events: { touch: 0.32 },
  keys: mergeKeys(
    [
      { t: 0, c: { ...ik(REST), ...ikL({ p: [0.24, -0.2, 0.2], dir: [-0.2, 0.2, 1], edge: [0, -1, 0.2], pole: [1, 0, -0.4] }, 0) } },
      { t: 0.32, ease: 'out', c: { ...ik({ p: [-0.24, -0.3, 0.1], dir: [-0.05, 1, 0.05], edge: [0, 0.05, -1], pole: [-0.8, -0.3, 0.2] }), ...ikL({ p: [0.22, -0.62, 0.46], dir: [-0.2, 0.2, 1], edge: [0, -1, 0.2], pole: [1, 0, -0.4] }) } },
      { t: 0.8, c: { ...ik({ p: [-0.24, -0.3, 0.1], dir: [-0.05, 1, 0.05], edge: [0, 0.05, -1], pole: [-0.8, -0.3, 0.2] }), ...ikL({ p: [0.22, -0.62, 0.46], dir: [-0.2, 0.2, 1], edge: [0, -1, 0.2], pole: [1, 0, -0.4] }) } },
      { t: 1.1, ease: 'inOut', c: { ...ik(REST), ...ikL({ p: [0.24, -0.2, 0.2], dir: [-0.2, 0.2, 1], edge: [0, -1, 0.2], pole: [1, 0, -0.4] }, 0) } },
    ],
    [
      key(0, I()),
      key(0.32, I({ hips: [10, -4, 0], spine: [26, 0, 0], chest: [12, 0, 0], neck: [-10, 0, 0], head: [-20, 0, 0], 'thigh.L': [-80, 0, 10], 'shin.L': [100, 0, 0], 'foot.L': [-20, 0, 0], 'thigh.R': [20, 0, -8], 'shin.R': [110, 0, 0], 'foot.R': [30, 0, 0] }), [0, -0.62, -0.1], 'out'),
      key(0.8, I({ hips: [10, -4, 0], spine: [26, 0, 0], chest: [12, 0, 0], neck: [-10, 0, 0], head: [-22, 0, 0], 'thigh.L': [-80, 0, 10], 'shin.L': [100, 0, 0], 'foot.L': [-20, 0, 0], 'thigh.R': [20, 0, -8], 'shin.R': [110, 0, 0], 'foot.R': [30, 0, 0] }), [0, -0.62, -0.1], 'linear'),
      key(1.1, I(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** G: the eyepatch — his left hand to it, torn off and flicked away */
const patch: ClipDef = {
  name: 'nn_patch', dur: 0.9, fadeIn: 0.1, fadeOut: 0.25, events: { off: 0.42 },
  keys: mergeKeys(
    [
      { t: 0, c: { ...ik(REST), ...ikL({ p: [0.18, 0.0, 0.16], dir: [-0.4, -0.3, 0.85], edge: [-0.35, 0.6, -0.2], pole: [1, -0.6, 0] }, 0) } },
      { t: 0.3, ease: 'inOut', c: ikL({ p: [0.08, 0.38, 0.2], dir: [-0.4, -0.3, 0.85], edge: [-0.35, 0.6, -0.2], pole: [1, -0.6, 0] }) },
      { t: 0.42, ease: 'out', c: ikL({ p: [0.38, 0.4, 0.2], dir: [-0.2, 0.9, -0.2], edge: [0.6, 0.3, 0.6], pole: [0.4, -1, -0.2] }) },
      { t: 0.6, c: ikL({ p: [0.4, 0.38, 0.18], dir: [-0.2, 0.9, -0.2], edge: [0.6, 0.3, 0.6], pole: [0.4, -1, -0.2] }) },
      { t: 0.9, ease: 'inOut', c: { ...ik(REST), ...ikL({ p: [0.3, 0.1, 0.1], dir: [-0.2, 0.9, -0.2], edge: [0.6, 0.3, 0.6], pole: [0.4, -1, -0.2] }, 0) } },
    ],
    [
      key(0, I()),
      key(0.3, I({ head: [-8, 14, 0], neck: [2, 6, 0] }), [0, -0.03, 0], 'inOut'),
      key(0.42, I({ head: [-18, -10, 0], neck: [4, -4, 0], spine: [6, 0, 0] }), [0, -0.03, 0], 'out'),
      key(0.9, I(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** F: "Inore, Santa Teresa" — the weapon raised overhead in both hands while the reiatsu pours out of it */
const release: ClipDef = {
  name: 'nn_release', dur: 1.3, fadeIn: 0.1, fadeOut: 0.2, events: { pray: 0.3, form: 1.0 },
  keys: mergeKeys(
    [{ t: 0, c: ik(REST) }, { t: 0.3, ease: 'inOut', c: ik(PRAY, 1) }, { t: 1.3, c: ik(PRAY, 1) }],
    [
      key(0, I()),
      key(0.3, I({ hips: [-4, 0, 0], spine: [-8, 0, 0], chest: [-10, 0, 0], neck: [-6, 0, 0], head: [-20, 0, 0], 'thigh.L': [-8, 0, 12], 'thigh.R': [8, 0, -12] }), [0, 0, 0], 'inOut'),
      key(1.3, I({ hips: [-4, 0, 0], spine: [-10, 0, 0], chest: [-12, 0, 0], neck: [-8, 0, 0], head: [-24, 0, 0], 'thigh.L': [-8, 0, 12], 'thigh.R': [8, 0, -12] }), [0, 0, 0], 'linear'),
    ],
  ),
};

// ---------------------------------------------------------------------------------------------- Santa Teresa moves

type Arm = 'R' | 'L' | 'R2' | 'L2';
const arc = (hand: Arm, d: Omit<SwingDef, 'hand'>) => swingKeys({ ...d, hand });
const mirror = (v: E): E => [-v[0], v[1], v[2]];

/** a pair of scythes on one side: the upper one, then the lower a beat behind */
const pairCut = (name: string, side: 'R' | 'L'): ClipDef => {
  const k = side === 'R' ? 1 : -1;
  const m = (v: E): E => (k > 0 ? v : mirror(v));
  return {
    name, dur: 0.56, fadeIn: 0.05, fadeOut: 0.2, events: { step: 0.05, hit: 0.16, combo: 0.28 },
    keys: mergeKeys(
      arc(side, { a: [0, 0, 1], b: m([1, -0.15, 0]), c: k > 0 ? SH : SHL, r: 0.44, pole: m([-0.5, -0.6, -0.6]), keys: [[0, -30, 'out'], [0.1, -115, 'out'], [0.2, 30, 'out'], [0.32, 80, 'out'], [0.56, 40, 'inOut']] }),
      arc(side === 'R' ? 'R2' : 'L2', { a: [0, 0, 1], b: m([1, 0.1, 0]), c: k > 0 ? SH2 : SHL2, r: 0.4, pole: m([-0.5, -0.8, -0.3]), keys: [[0, -20, 'out'], [0.12, -110, 'out'], [0.23, 35, 'out'], [0.35, 80, 'out'], [0.56, 40, 'inOut']] }),
      [
        key(0, SI()),
        key(0.1, SI({ hips: [2, -18 * k, 0], spine: [14, -10 * k, 0], chest: [8, -12 * k, 0], head: [-16, 14 * k, 0] }), [0, -0.06, 0], 'out'),
        key(0.2, SI({ hips: [4, 14 * k, 0], spine: [16, 8 * k, 0], chest: [10, 14 * k, 0], head: [-16, -8 * k, 0], 'thigh.L': [-24, 0, 12], 'shin.L': [28, 0, 0] }), [0, -0.1, 0.08], 'out'),
        key(0.56, SI(), [0, -0.06, 0], 'inOut'),
      ],
    ),
  };
};

/** the upper pair chopping down together from overhead */
const chop: ClipDef = {
  name: 'sa_cut3', dur: 0.62, fadeIn: 0.05, fadeOut: 0.2, events: { step: 0.06, hit: 0.18, combo: 0.3 },
  keys: mergeKeys(
    arc('R', { a: [0, 1, 0], b: [0, 0, 1], c: SH, r: 0.44, pole: [-0.8, -0.4, -0.3], keys: [[0, 40, 'out'], [0.12, -30, 'out'], [0.22, 115, 'out'], [0.34, 130, 'out'], [0.62, 90, 'inOut']] }),
    arc('L', { a: [0, 1, 0], b: [0, 0, 1], c: SHL, r: 0.44, pole: [0.8, -0.4, -0.3], keys: [[0, 40, 'out'], [0.12, -30, 'out'], [0.22, 115, 'out'], [0.34, 130, 'out'], [0.62, 90, 'inOut']] }),
    [
      key(0, SI()),
      key(0.12, SI({ hips: [-4, 0, 0], spine: [0, 0, 0], chest: [-6, 0, 0], head: [-10, 0, 0] }), [0, 0, -0.02], 'out'),
      key(0.22, SI({ hips: [10, 0, 0], spine: [22, 0, 0], chest: [12, 0, 0], head: [-18, 0, 0], 'thigh.L': [-30, 0, 12], 'shin.L': [36, 0, 0], 'thigh.R': [16, 0, -12] }), [0, -0.16, 0.12], 'out'),
      key(0.62, SI(), [0, -0.06, 0], 'inOut'),
    ],
  ),
};

/** all four held out flat and a full turn: every blade sweeps the circle */
const spinAll: ClipDef = {
  name: 'sa_cut4', dur: 0.78, fadeIn: 0.06, fadeOut: 0.22, events: { step: 0.06, hit: 0.1, combo: 0.5 },
  keys: mergeKeys(
    [{ t: 0, c: { '@spin': [0, 0, 0] } }, { t: 0.08, ease: 'out', c: { '@spin': [-24, 0, 0] } }, { t: 0.48, ease: 'inOut', c: { '@spin': [360, 0, 0] } }, { t: 0.78, c: { '@spin': [360, 0, 0] } }],
    arc('R', { a: [0, 0, 1], b: [1, 0, 0], c: SH, r: 0.46, pole: [-0.2, -1, 0], keys: [[0, -60, 'out'], [0.08, -92, 'out'], [0.48, -92, 'inOut'], [0.78, -40, 'inOut']] }),
    arc('L', { a: [0, 0, 1], b: [-1, 0, 0], c: SHL, r: 0.46, pole: [0.2, -1, 0], keys: [[0, -60, 'out'], [0.08, -92, 'out'], [0.48, -92, 'inOut'], [0.78, -40, 'inOut']] }),
    arc('R2', { a: [0, 0, 1], b: [1, -0.1, 0], c: SH2, r: 0.42, pole: [-0.2, -1, 0], keys: [[0, -50, 'out'], [0.08, -88, 'out'], [0.48, -88, 'inOut'], [0.78, -40, 'inOut']] }),
    arc('L2', { a: [0, 0, 1], b: [-1, -0.1, 0], c: SHL2, r: 0.42, pole: [0.2, -1, 0], keys: [[0, -50, 'out'], [0.08, -88, 'out'], [0.48, -88, 'inOut'], [0.78, -40, 'inOut']] }),
    [key(0, SI()), key(0.08, SI({ spine: [6, 0, 0], chest: [2, 0, 0], 'thigh.L': [-20, 0, 12], 'shin.L': [24, 0, 0] }), [0, -0.12, 0], 'out'), key(0.48, SI({ spine: [6, 0, 0], chest: [2, 0, 0], 'thigh.L': [-20, 0, 12], 'shin.L': [24, 0, 0] }), [0, -0.12, 0], 'inOut'), key(0.78, SI(), [0, -0.06, 0], 'inOut')],
  ),
};

/** RMB (Santa Teresa): the Mantis Cross — all four flung wide, then snapped shut like a trap */
const cross: ClipDef = {
  name: 'sa_heavy', dur: 0.85, fadeIn: 0.06, fadeOut: 0.24, events: { step: 0.2, hit: 0.3 },
  keys: mergeKeys(
    arc('R', { a: [0, 0, 1], b: [1, 0.1, 0], c: SH, r: 0.46, pole: [-0.5, -0.6, -0.6], keys: [[0, -30, 'out'], [0.22, -110, 'inOut'], [0.32, 45, 'out'], [0.5, 50, 'out'], [0.85, 20, 'inOut']] }),
    arc('L', { a: [0, 0, 1], b: [-1, 0.1, 0], c: SHL, r: 0.46, pole: [0.5, -0.6, -0.6], keys: [[0, -30, 'out'], [0.22, -110, 'inOut'], [0.32, 45, 'out'], [0.5, 50, 'out'], [0.85, 20, 'inOut']] }),
    arc('R2', { a: [0, 0, 1], b: [1, -0.1, 0], c: SH2, r: 0.42, pole: [-0.5, -0.8, -0.3], keys: [[0, -30, 'out'], [0.22, -105, 'inOut'], [0.33, 40, 'out'], [0.5, 46, 'out'], [0.85, 20, 'inOut']] }),
    arc('L2', { a: [0, 0, 1], b: [-1, -0.1, 0], c: SHL2, r: 0.42, pole: [0.5, -0.8, -0.3], keys: [[0, -30, 'out'], [0.22, -105, 'inOut'], [0.33, 40, 'out'], [0.5, 46, 'out'], [0.85, 20, 'inOut']] }),
    [
      key(0, SI()),
      key(0.22, SI({ hips: [-4, 0, 0], spine: [2, 0, 0], chest: [-8, 0, 0], head: [-12, 0, 0] }), [0, -0.02, -0.04], 'inOut'),
      key(0.32, SI({ hips: [10, 0, 0], spine: [20, 0, 0], chest: [12, 0, 0], head: [-18, 0, 0], 'thigh.L': [-34, 0, 12], 'shin.L': [40, 0, 0], 'thigh.R': [18, 0, -12] }), [0, -0.16, 0.16], 'out'),
      key(0.85, SI(), [0, -0.06, 0], 'inOut'),
    ],
  ),
};

/** E (Santa Teresa): a scythe thrown overhand (another grows out of his wrist) */
const throwS: ClipDef = {
  name: 'sa_throw', dur: 0.72, fadeIn: 0.06, fadeOut: 0.2, events: { throw: 0.27, regrow: 0.55 },
  keys: mergeKeys(
    arc('R', { a: [0, 1, 0], b: [0, 0, 1], c: SH, r: 0.44, pole: [-0.8, -0.3, -0.3], keys: [[0, 40, 'out'], [0.16, -40, 'inOut'], [0.28, 95, 'out'], [0.4, 100, 'out'], [0.72, 60, 'inOut']] }),
    [
      key(0, SI()),
      key(0.16, SI({ hips: [-2, -20, 0], spine: [8, -10, 0], chest: [-2, -12, 0], head: [-14, 16, 0] }), [0, -0.04, -0.04], 'inOut'),
      key(0.28, SI({ hips: [8, 12, 0], spine: [18, 8, 0], chest: [10, 12, 0], head: [-16, -8, 0], 'thigh.L': [-28, 0, 12], 'shin.L': [32, 0, 0] }), [0, -0.1, 0.1], 'out'),
      key(0.72, SI(), [0, -0.06, 0], 'inOut'),
    ],
  ),
};

export const NNOITRA_CLIPS: ClipDef[] = [
  sweep('nn_cut1', 0), sweep('nn_cut2', 1), slam('nn_cut3', false), kick, slam('nn_heavy', true), thrw, yank, whirl, cero('nn_cero', false), radar, patch, release,
  pairCut('sa_cut1', 'R'), pairCut('sa_cut2', 'L'), chop, spinAll, cross, throwS, cero('sa_cero', true),
  ...ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name)),
];
export const NNOITRA_CHAIN = ['nn_cut1', 'nn_cut2', 'nn_kick', 'nn_cut3'];
export const SANTA_CHAIN = ['sa_cut1', 'sa_cut2', 'sa_cut3', 'sa_cut4'];
/** which scythes cut in each Santa Teresa move (by prop key) */
export const SANTA_BLADES: Record<string, string[]> = {
  sa_cut1: ['sword', 'scythe3'],
  sa_cut2: ['scythe2', 'scythe4'],
  sa_cut3: ['sword', 'scythe2'],
  sa_cut4: ['sword', 'scythe2', 'scythe3', 'scythe4'],
  sa_heavy: ['sword', 'scythe2', 'scythe3', 'scythe4'],
};
