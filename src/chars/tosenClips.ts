// Kaname Tōsen's animation set: a blind swordsman who stands perfectly straight and still, the head a
// little tilted as if listening, Suzumushi held low in his right hand with the point toward the ground. The
// chain is a level cut at head height ("from the eyes up"), a rising backhand, a snapping front kick and a
// lunging thrust; RMB the side kick that throws much bigger men through walls; "Nake, Suzumushi" with the
// blade raised before his face; Benihikō — a slow half-circle drawn round himself, then the flick that
// sets the hundreds of blades loose; the disintegrating Kidō from the open left palm; the hand drawn down
// over the face for the Hollow mask; the Bankai (the sword raised, the left palm on the spinning ring, the
// slash that throws the rings out); the Resurrección with the sword held upside down.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });
interface Grip { p: E; dir: E; edge: E; pole: E }
const grip = (t: number, g: Grip, ease?: KeyDef['ease'], two = 0): KeyDef => ({
  t, ease, c: { '@gripR': g.p, '@dirR': g.dir, '@edgeR': g.edge, '@poleR': g.pole, '@ikR': [1, 0, 0], '@twoHand': [two, 0, 0] },
});

/** straight and still, the head tilted to listen */
const IDLE: Record<string, E> = {
  hips: [0, -6, 0], spine: [2, 0, 0], chest: [0, 4, 0], neck: [2, 0, 0], head: [-4, -10, 8],
  'thigh.L': [-6, 0, 5], 'shin.L': [8, 0, 0], 'foot.L': [-2, 0, -3],
  'thigh.R': [4, 0, -5], 'shin.R': [6, 0, 0], 'foot.R': [-3, 0, 3],
  'upperarm.L': [-4, 0, 8], 'forearm.L': [-14, 0, 0], 'hand.L': [4, 0, 0],
};
const I = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });

/** Suzumushi held low at his right side, the point toward the ground ahead */
const LOW: Grip = { p: [-0.27, -0.27, 0.14], dir: [0.1, -0.55, 0.83], edge: [0.02, -0.83, -0.55], pole: [-0.8, -0.3, -0.5] };
const SH: E = [-0.2, 0.18, 0.05];

export const TOSEN_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.02,
  run: { spine: [10, 0, 0], chest: [4, 0, 0], head: [-8, 0, 0], 'upperarm.L': [14, 0, 8] },
  sprint: { spine: [20, 0, 0], chest: [8, 0, 0], head: [-14, 0, 0], 'upperarm.L': [44, 0, 10], 'forearm.L': [-34, 0, 0] },
  swingL: 0.9,
  swingR: 0.1,
  freqScale: 1.02,
  grip: {
    idle: LOW,
    walk: { ...LOW, p: [-0.27, -0.25, 0.12] },
    run: { p: [-0.3, -0.24, -0.05], dir: [-0.25, -0.33, -0.91], edge: [0, -0.94, 0.33], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.29, -0.14, -0.16], dir: [-0.2, -0.08, -0.97], edge: [0, -1, 0.08], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.38, -0.05, 0.12], dir: [-0.62, -0.2, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

// ------------------------------------------------------------------ the chain

/** LMB 1: one level cut at head height, right to left — "from the eyes up" */
const cut1: ClipDef = {
  name: 'ts_cut1', dur: 0.6, fadeIn: 0.05, fadeOut: 0.2, events: { step: 0.08, hit: 0.17, combo: 0.28 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [1, 0.06, 0], c: [-0.18, 0.24, 0.06], r: 0.46, pole: [-0.5, -0.6, -0.6],
      keys: [[0, -70, 'out'], [0.1, -130, 'out'], [0.17, 30, 'outExpo'], [0.3, 100, 'out'], [0.6, 70, 'inOut']],
    }),
    [
      key(0, I()),
      key(0.1, I({ hips: [0, -22, 0], spine: [2, -12, 0], chest: [-2, -18, 0], head: [-4, 12, 6], 'thigh.R': [10, 0, -6], 'shin.R': [14, 0, 0], 'upperarm.L': [-20, 0, 26], 'forearm.L': [-36, 0, 0] }), [0, -0.04, -0.02], 'out'),
      key(0.17, I({ hips: [2, 16, 0], spine: [6, 12, 0], chest: [4, 20, 0], head: [-6, -18, 6], 'thigh.L': [-30, 0, 6], 'shin.L': [30, 0, 0], 'thigh.R': [18, 0, -6], 'shin.R': [18, 0, 0], 'upperarm.L': [-6, 0, 40], 'forearm.L': [-20, 0, 0] }), [0, -0.08, 0.08], 'outExpo'),
      key(0.3, I({ hips: [2, 20, 0], spine: [6, 14, 0], chest: [4, 24, 0], head: [-6, -20, 6], 'thigh.L': [-30, 0, 6], 'shin.L': [30, 0, 0], 'thigh.R': [18, 0, -6], 'upperarm.L': [-4, 0, 42] }), [0, -0.08, 0.08], 'out'),
      key(0.6, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** LMB 2: the rising backhand from low on his left to high on his right */
const cut2: ClipDef = {
  name: 'ts_cut2', dur: 0.6, fadeIn: 0.04, fadeOut: 0.2, events: { step: 0.07, hit: 0.15, combo: 0.27 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [-0.85, 0.52, 0], c: [-0.08, 0.08, 0.05], r: 0.44, pole: [-0.3, -0.4, -0.85],
      keys: [[0, -140, 'out'], [0.08, -124, 'out'], [0.15, 46, 'outExpo'], [0.28, 116, 'out'], [0.6, 80, 'inOut']],
    }),
    [
      key(0, I({ hips: [0, 14, 0], spine: [6, 10, 0], chest: [4, 16, -4] })),
      key(0.08, I({ hips: [0, 24, 0], spine: [8, 16, 6], chest: [8, 24, 6], head: [-2, -16, 6], 'thigh.L': [-18, 0, 6], 'shin.L': [26, 0, 0], 'thigh.R': [14, 0, -4], 'upperarm.L': [8, 0, 20] }), [0, -0.09, 0], 'out'),
      key(0.15, I({ hips: [0, -18, 0], spine: [-4, -18, -4], chest: [-10, -26, -8], head: [-10, 16, 6], 'thigh.L': [-6, 0, 6], 'thigh.R': [-8, 0, -8], 'shin.R': [14, 0, 0], 'upperarm.L': [20, 0, 36], 'forearm.L': [-20, 0, 0] }), [0, -0.01, 0.05], 'outExpo'),
      key(0.28, I({ hips: [0, -22, 0], spine: [-6, -20, -4], chest: [-12, -28, -8], head: [-12, 18, 6], 'thigh.R': [-8, 0, -8], 'upperarm.L': [22, 0, 40] }), [0, 0, 0.06], 'out'),
      key(0.6, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** LMB 3: a snapping front kick, the sword kept low */
const kick: ClipDef = {
  name: 'ts_kick', dur: 0.56, fadeIn: 0.04, fadeOut: 0.18, events: { step: 0.06, hit: 0.15, combo: 0.26 },
  keys: mergeKeys(
    [grip(0, LOW), grip(0.15, { ...LOW, p: [-0.32, -0.2, 0.02] }, 'out'), grip(0.56, LOW, 'inOut')],
    [
      key(0, I()),
      key(0.08, I({ spine: [-4, 0, 0], chest: [-6, 0, 0], 'thigh.R': [-84, 0, -4], 'shin.R': [104, 0, 0], 'foot.R': [10, 0, 0], 'thigh.L': [-4, 0, 6], 'shin.L': [14, 0, 0], 'upperarm.L': [-20, 0, 40], 'forearm.L': [-40, 0, 0] }), [0, 0.02, -0.03], 'out'),
      key(0.15, I({ hips: [-12, 0, 0], spine: [-12, 0, 0], chest: [-8, 0, 0], head: [2, -10, 8], 'thigh.R': [-102, 0, -2], 'shin.R': [6, 0, 0], 'foot.R': [-30, 0, 0], 'thigh.L': [8, 0, 6], 'shin.L': [16, 0, 0], 'upperarm.L': [-10, 0, 56], 'forearm.L': [-20, 0, 0] }), [0, 0.02, 0.06], 'outExpo'),
      key(0.28, I({ hips: [-10, 0, 0], spine: [-10, 0, 0], chest: [-6, 0, 0], 'thigh.R': [-88, 0, -2], 'shin.R': [30, 0, 0], 'thigh.L': [6, 0, 6], 'shin.L': [14, 0, 0], 'upperarm.L': [-8, 0, 52] }), [0, 0.01, 0.05], 'out'),
      key(0.56, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** LMB 4: the lunging thrust, straight at the heart */
const thrust: ClipDef = {
  name: 'ts_cut3', dur: 0.7, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.12, hit: 0.2, combo: 0.32 },
  keys: mergeKeys(
    [
      grip(0, LOW),
      grip(0.12, { p: [-0.24, -0.02, -0.22], dir: [0.06, 0.06, 1], edge: [0, -1, 0.06], pole: [-0.8, -0.3, -0.3] }, 'out'),
      grip(0.2, { p: [-0.04, 0.05, 0.56], dir: [0.06, 0, 1], edge: [0, -1, 0], pole: [-0.7, -0.5, -0.2] }, 'outExpo'),
      grip(0.36, { p: [-0.04, 0.04, 0.54], dir: [0.06, -0.02, 1], edge: [0, -1, 0], pole: [-0.7, -0.5, -0.2] }, 'out'),
      grip(0.7, LOW, 'inOut'),
    ],
    [
      key(0, I()),
      key(0.12, I({ hips: [0, -24, 0], spine: [2, -14, 0], chest: [-2, -20, 0], head: [-6, 18, 6], 'thigh.L': [-12, 0, 6], 'thigh.R': [14, 0, -6], 'shin.R': [22, 0, 0], 'upperarm.L': [-36, 0, 28], 'forearm.L': [-46, 0, 0] }), [0, -0.05, -0.03], 'out'),
      key(0.2, I({ hips: [6, 12, 0], spine: [12, 12, 0], chest: [8, 14, 0], head: [-14, -12, 6], 'thigh.L': [-54, 0, 6], 'shin.L': [54, 0, 0], 'foot.L': [-6, 0, 0], 'thigh.R': [32, 0, -6], 'shin.R': [18, 0, 0], 'foot.R': [-14, 0, 0], 'upperarm.L': [28, 0, 28], 'forearm.L': [-20, 0, 0] }), [0, -0.14, 0.14], 'outExpo'),
      key(0.36, I({ hips: [8, 14, 0], spine: [14, 14, 0], chest: [10, 16, 0], head: [-16, -14, 6], 'thigh.L': [-56, 0, 6], 'shin.L': [56, 0, 0], 'thigh.R': [34, 0, -6], 'shin.R': [20, 0, 0], 'upperarm.L': [30, 0, 30] }), [0, -0.15, 0.15], 'out'),
      key(0.7, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

// ------------------------------------------------------------------ techniques

/** RMB: the side kick — the hips turned side-on, the right leg driven out level */
const sideKick: ClipDef = {
  name: 'ts_heavy', dur: 0.8, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.12, hit: 0.26 },
  keys: mergeKeys(
    [grip(0, LOW), grip(0.16, { ...LOW, p: [-0.24, -0.28, -0.1] }, 'out'), grip(0.8, LOW, 'inOut')],
    [
      key(0, I()),
      key(0.16, I({ hips: [0, 70, 0], spine: [0, 10, -10], chest: [0, 10, -6], head: [0, -66, 4], 'thigh.R': [-60, 0, -40], 'shin.R': [110, 0, 0], 'foot.R': [10, 0, 0], 'thigh.L': [-10, 0, 10], 'shin.L': [20, 0, 0], 'upperarm.L': [-30, 0, 50], 'forearm.L': [-30, 0, 0] }), [0, -0.04, 0], 'out'),
      key(0.26, I({ hips: [0, 86, 0], spine: [0, 10, -24], chest: [0, 6, -14], head: [0, -74, 10], 'thigh.R': [-10, 0, -88], 'shin.R': [6, 0, 0], 'foot.R': [0, 0, 0], 'thigh.L': [6, 0, 14], 'shin.L': [10, 0, 0], 'upperarm.L': [-20, 0, 70], 'forearm.L': [-20, 0, 0] }), [0, 0.04, 0], 'outExpo'),
      key(0.42, I({ hips: [0, 84, 0], spine: [0, 10, -22], chest: [0, 6, -12], head: [0, -72, 10], 'thigh.R': [-14, 0, -82], 'shin.R': [16, 0, 0], 'thigh.L': [6, 0, 14], 'shin.L': [10, 0, 0], 'upperarm.L': [-20, 0, 66] }), [0, 0.03, 0], 'out'),
      key(0.8, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** Q: "Nake, Suzumushi" — the blade raised upright before his face, ringing */
const nake: ClipDef = {
  name: 'ts_nake', dur: 1.1, fadeIn: 0.08, fadeOut: 0.26, events: { cry: 0.32 },
  keys: mergeKeys(
    [
      grip(0, LOW),
      grip(0.28, { p: [-0.12, 0.16, 0.3], dir: [0.02, 0.98, 0.16], edge: [0, 0.16, -0.98], pole: [-0.8, -0.4, -0.3] }, 'out'),
      grip(0.82, { p: [-0.12, 0.17, 0.3], dir: [0.02, 0.98, 0.16], edge: [0, 0.16, -0.98], pole: [-0.8, -0.4, -0.3] }, 'linear'),
      grip(1.1, LOW, 'inOut'),
    ],
    [
      key(0, I()),
      key(0.28, I({ head: [-2, -6, 10], chest: [-2, 2, 0], 'upperarm.L': [-6, 0, 14], 'forearm.L': [-20, 0, 0] }), [0, -0.02, 0], 'out'),
      key(0.82, I({ head: [-2, -6, 12], chest: [-2, 2, 0], 'upperarm.L': [-6, 0, 14], 'forearm.L': [-20, 0, 0] }), [0, -0.02, 0], 'linear'),
      key(1.1, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** E: Benihikō — a slow half-circle drawn round himself with the humming blade, then the flick */
const benihiko: ClipDef = {
  name: 'ts_benihiko', dur: 1.15, fadeIn: 0.06, fadeOut: 0.26, events: { draw: 0.12, fire: 0.6 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [1, 0, 0], c: [-0.06, 0.12, 0.04], r: 0.5, pole: [-0.5, -0.6, -0.6],
      keys: [[0, -70, 'out'], [0.12, -120, 'out'], [0.52, 120, 'linear'], [0.6, 128, 'outExpo'], [0.8, 110, 'out'], [1.15, 70, 'inOut']],
    }),
    [
      key(0, I()),
      key(0.12, I({ hips: [0, -26, 0], spine: [2, -14, 0], chest: [-2, -20, 0], head: [-4, 14, 8], 'upperarm.L': [-10, 0, 30], 'forearm.L': [-30, 0, 0] }), [0, -0.05, 0], 'out'),
      key(0.52, I({ hips: [0, 26, 0], spine: [4, 14, 0], chest: [2, 22, 0], head: [-4, -16, 8], 'thigh.L': [-14, 0, 8], 'thigh.R': [10, 0, -8], 'upperarm.L': [-10, 0, 40], 'forearm.L': [-26, 0, 0] }), [0, -0.06, 0], 'linear'),
      key(0.6, I({ hips: [0, 30, 0], spine: [6, 16, 0], chest: [4, 26, 0], head: [-6, -18, 8], 'thigh.L': [-16, 0, 8], 'thigh.R': [12, 0, -8], 'upperarm.L': [-10, 0, 46], 'forearm.L': [-20, 0, 0] }), [0, -0.07, 0.02], 'outExpo'),
      key(1.15, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** R: the disintegrating Kidō — the left palm thrust out */
const kido: ClipDef = {
  name: 'ts_kido', dur: 0.8, fadeIn: 0.05, fadeOut: 0.24, events: { charge: 0.06, fire: 0.24 },
  keys: mergeKeys(
    [grip(0, LOW), grip(0.24, { ...LOW, p: [-0.3, -0.26, 0.02] }, 'out'), grip(0.8, LOW, 'inOut')],
    [
      key(0, I()),
      key(0.14, I({ hips: [0, 16, 0], chest: [2, 14, 0], 'upperarm.L': [-40, 0, 24], 'forearm.L': [-110, 0, 0], 'hand.L': [10, 0, 0] }), [0, -0.03, -0.02], 'out'),
      key(0.24, I({ hips: [0, -14, 0], spine: [6, -10, 0], chest: [6, -20, 0], head: [-6, 14, 8], 'upperarm.L': [-90, 0, -6], 'forearm.L': [-4, 0, 0], 'hand.L': [-36, 0, 0], 'thigh.L': [-26, 0, 6], 'shin.L': [26, 0, 0], 'thigh.R': [16, 0, -6] }), [0, -0.06, 0.08], 'outExpo'),
      key(0.46, I({ hips: [0, -12, 0], spine: [6, -8, 0], chest: [6, -18, 0], head: [-6, 12, 8], 'upperarm.L': [-88, 0, -4], 'forearm.L': [-6, 0, 0], 'hand.L': [-34, 0, 0], 'thigh.L': [-24, 0, 6], 'shin.L': [24, 0, 0] }), [0, -0.06, 0.07], 'out'),
      key(0.8, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** G: the left hand drawn down over the face — the mask forms under it */
const maskOn: ClipDef = {
  name: 'ts_mask', dur: 0.9, fadeIn: 0.06, fadeOut: 0.24, events: { mask: 0.36 },
  keys: [
    key(0, I()),
    key(0.22, I({ 'upperarm.L': [-150, 24, -30], 'forearm.L': [-112, 0, 0], 'hand.L': [-10, 0, 0], head: [2, -4, 4], chest: [-4, 4, 0] }), [0, -0.02, 0], 'out'),
    key(0.36, I({ 'upperarm.L': [-120, 20, -26], 'forearm.L': [-120, 0, 0], 'hand.L': [-6, 0, 0], head: [6, -2, 2], chest: [-2, 4, 0] }), [0, -0.03, 0], 'outExpo'),
    key(0.56, I({ 'upperarm.L': [-30, 0, 40], 'forearm.L': [-20, 0, 0], head: [-8, 0, 0], chest: [-6, 0, 0], spine: [-4, 0, 0] }), [0, -0.03, 0], 'out'),
    key(0.9, I(), [0, -0.02, 0], 'inOut'),
  ],
};

/**
 * F: "Suzumushi Tsuishiki — Enma Kōrogi": the sword raised high in his right hand, the left palm pressed to the
 * spinning ring while it swells; one slash throws the rings out round the field.
 */
const bankai: ClipDef = {
  name: 'ts_bankai', dur: 2, fadeIn: 0.1, fadeOut: 0.3, events: { word: 0.3, swell: 0.5, fling: 1.25 },
  keys: mergeKeys(
    [
      grip(0, LOW),
      grip(0.4, { p: [-0.1, 0.42, 0.24], dir: [0.02, 0.98, 0.18], edge: [0, 0.18, -0.98], pole: [-0.8, -0.3, -0.4] }, 'inOut'),
      grip(1.12, { p: [-0.1, 0.44, 0.24], dir: [0.02, 0.98, 0.18], edge: [0, 0.18, -0.98], pole: [-0.8, -0.3, -0.4] }, 'linear'),
      grip(1.25, { p: [-0.4, -0.06, 0.24], dir: [-0.86, -0.3, 0.4], edge: [-0.3, 0.95, 0.1], pole: [-0.6, -0.5, -0.6] }, 'outExpo'),
      grip(2, LOW, 'inOut'),
    ],
    [
      key(0, I()),
      key(0.4, I({ head: [-10, 0, 4], chest: [-6, 0, 0], spine: [-2, 0, 0], 'upperarm.L': [-150, 20, -20], 'forearm.L': [-40, 0, 0], 'hand.L': [-20, 0, 0] }), [0, -0.02, 0], 'inOut'),
      key(1.12, I({ head: [-12, 0, 4], chest: [-6, 0, 0], spine: [-2, 0, 0], 'upperarm.L': [-152, 20, -20], 'forearm.L': [-40, 0, 0], 'hand.L': [-20, 0, 0] }), [0, -0.02, 0], 'linear'),
      key(1.25, I({ hips: [4, 30, 0], spine: [8, 18, 0], chest: [6, 26, 0], head: [-8, -20, 6], 'thigh.L': [-30, 0, 8], 'shin.L': [30, 0, 0], 'thigh.R': [16, 0, -8], 'upperarm.L': [-10, 0, 50], 'forearm.L': [-20, 0, 0] }), [0, -0.1, 0.06], 'outExpo'),
      key(2, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** F (masked): "Suzumushi Hyakushiki — Grillar Grillo": the sword held upside down before him, bowed */
const resurreccion: ClipDef = {
  name: 'ts_grillo', dur: 1.8, fadeIn: 0.1, fadeOut: 0.2, events: { word: 0.3, dark: 0.6, form: 1.45 },
  keys: mergeKeys(
    [
      grip(0, LOW),
      grip(0.4, { p: [-0.06, 0.06, 0.32], dir: [0.02, -0.98, 0.16], edge: [0, -0.16, -0.98], pole: [-0.8, -0.4, -0.3] }, 'inOut'),
      grip(1.8, { p: [-0.06, 0.07, 0.32], dir: [0.02, -0.98, 0.16], edge: [0, -0.16, -0.98], pole: [-0.8, -0.4, -0.3] }, 'linear'),
    ],
    [
      key(0, I()),
      key(0.4, I({ neck: [14, 0, 0], head: [12, 0, 0], chest: [6, 0, 0], spine: [4, 0, 0], 'upperarm.L': [-10, 0, 20], 'forearm.L': [-30, 0, 0] }), [0, -0.03, 0], 'inOut'),
      key(1.8, I({ neck: [16, 0, 0], head: [14, 0, 0], chest: [8, 0, 0], spine: [6, 0, 0], 'upperarm.L': [-10, 0, 24], 'forearm.L': [-30, 0, 0] }), [0, -0.04, 0], 'linear'),
    ],
  ),
};

// ------------------------------------------------------------------ Grillar Grillo

/** hunched, the head thrust forward, the long arms hanging before him, the lower pair folded */
const G_IDLE: Record<string, E> = {
  hips: [12, 0, 0], spine: [22, 0, 0], chest: [14, 0, 0], neck: [-18, 0, 0], head: [-20, 0, 0],
  'thigh.L': [-34, 0, 12], 'shin.L': [52, 0, 0], 'foot.L': [-16, 0, -6],
  'thigh.R': [-28, 0, -12], 'shin.R': [46, 0, 0], 'foot.R': [-16, 0, 6],
  'upperarm.L': [-26, 0, 16], 'forearm.L': [-34, 0, 0], 'hand.L': [10, 0, 0],
  'upperarm.R': [-26, 0, -16], 'forearm.R': [-34, 0, 0], 'hand.R': [10, 0, 0],
  'upperarm2.L': [-40, 0, 24], 'forearm2.L': [-96, 0, 0], 'upperarm2.R': [-40, 0, -24], 'forearm2.R': [-96, 0, 0],
};
const GI = (over: Record<string, E> = {}): Record<string, E> => ({ ...G_IDLE, ...over });

export const GRILLO_STANCE: StanceDef = {
  idle: G_IDLE,
  idleHips: -0.22,
  run: { spine: [32, 0, 0], chest: [18, 0, 0], neck: [-24, 0, 0], 'upperarm.L': [-10, 0, 20], 'upperarm.R': [-10, 0, -20] },
  sprint: { spine: [40, 0, 0], chest: [20, 0, 0], neck: [-30, 0, 0], head: [-14, 0, 0], 'upperarm.L': [30, 0, 20], 'upperarm.R': [30, 0, -20] },
  swingL: 0.6,
  swingR: 0.6,
  freqScale: 0.8,
};

/** LMB 1: the right claw raked down and across */
const gClaw1: ClipDef = {
  name: 'gr_claw1', dur: 0.62, fadeIn: 0.05, fadeOut: 0.2, events: { step: 0.08, hit: 0.18, combo: 0.3 },
  keys: [
    key(0, GI()),
    key(0.1, GI({ hips: [12, -20, 0], spine: [18, -14, 0], chest: [8, -18, 0], 'upperarm.R': [-140, 0, -60], 'forearm.R': [-40, 0, 0], 'upperarm.L': [-40, 0, 30] }), [0, -0.2, -0.04], 'out'),
    key(0.18, GI({ hips: [14, 18, 0], spine: [26, 14, 0], chest: [16, 22, 0], 'upperarm.R': [-60, 0, 34], 'forearm.R': [-14, 0, 0], 'hand.R': [-10, 0, 0], 'upperarm.L': [-20, 0, 30], 'thigh.L': [-50, 0, 12], 'shin.L': [60, 0, 0] }), [0, -0.28, 0.16], 'outExpo'),
    key(0.32, GI({ hips: [14, 22, 0], spine: [26, 16, 0], chest: [16, 26, 0], 'upperarm.R': [-50, 0, 44], 'forearm.R': [-20, 0, 0], 'upperarm.L': [-20, 0, 30], 'thigh.L': [-50, 0, 12], 'shin.L': [60, 0, 0] }), [0, -0.28, 0.16], 'out'),
    key(0.62, GI(), [0, -0.22, 0], 'inOut'),
  ],
};

/** LMB 2: the left claw back across */
const gClaw2: ClipDef = {
  name: 'gr_claw2', dur: 0.62, fadeIn: 0.05, fadeOut: 0.2, events: { step: 0.08, hit: 0.18, combo: 0.3 },
  keys: [
    key(0, GI({ hips: [12, 16, 0], chest: [14, 20, 0] })),
    key(0.1, GI({ hips: [12, 20, 0], spine: [18, 14, 0], chest: [8, 18, 0], 'upperarm.L': [-140, 0, 60], 'forearm.L': [-40, 0, 0], 'upperarm.R': [-40, 0, -30] }), [0, -0.2, -0.04], 'out'),
    key(0.18, GI({ hips: [14, -18, 0], spine: [26, -14, 0], chest: [16, -22, 0], 'upperarm.L': [-60, 0, -34], 'forearm.L': [-14, 0, 0], 'hand.L': [-10, 0, 0], 'upperarm.R': [-20, 0, -30], 'thigh.R': [-50, 0, -12], 'shin.R': [60, 0, 0] }), [0, -0.28, 0.16], 'outExpo'),
    key(0.32, GI({ hips: [14, -22, 0], spine: [26, -16, 0], chest: [16, -26, 0], 'upperarm.L': [-50, 0, -44], 'forearm.L': [-20, 0, 0], 'upperarm.R': [-20, 0, -30], 'thigh.R': [-50, 0, -12], 'shin.R': [60, 0, 0] }), [0, -0.28, 0.16], 'out'),
    key(0.62, GI(), [0, -0.22, 0], 'inOut'),
  ],
};

/** LMB 3: the lower pair driven forward together, claws first */
const gClaw3: ClipDef = {
  name: 'gr_claw3', dur: 0.7, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.1, hit: 0.2, combo: 0.34 },
  keys: [
    key(0, GI()),
    key(0.12, GI({ spine: [14, 0, 0], chest: [6, 0, 0], 'upperarm2.L': [10, 0, 30], 'forearm2.L': [-110, 0, 0], 'upperarm2.R': [10, 0, -30], 'forearm2.R': [-110, 0, 0] }), [0, -0.18, -0.06], 'out'),
    key(0.2, GI({ hips: [16, 0, 0], spine: [30, 0, 0], chest: [18, 0, 0], 'upperarm2.L': [-96, 0, -6], 'forearm2.L': [-6, 0, 0], 'upperarm2.R': [-96, 0, 6], 'forearm2.R': [-6, 0, 0], 'thigh.L': [-56, 0, 12], 'shin.L': [64, 0, 0], 'thigh.R': [-10, 0, -12], 'shin.R': [40, 0, 0] }), [0, -0.3, 0.3], 'outExpo'),
    key(0.36, GI({ hips: [16, 0, 0], spine: [30, 0, 0], chest: [18, 0, 0], 'upperarm2.L': [-92, 0, -4], 'forearm2.L': [-10, 0, 0], 'upperarm2.R': [-92, 0, 4], 'forearm2.R': [-10, 0, 0], 'thigh.L': [-56, 0, 12], 'shin.L': [64, 0, 0] }), [0, -0.3, 0.3], 'out'),
    key(0.7, GI(), [0, -0.22, 0], 'inOut'),
  ],
};

/** RMB: both great arms raised over the hump and slammed down */
const gSlam: ClipDef = {
  name: 'gr_slam', dur: 1.0, fadeIn: 0.06, fadeOut: 0.26, events: { step: 0.3, hit: 0.4, slam: 0.42 },
  keys: [
    key(0, GI()),
    key(0.3, GI({ hips: [-4, 0, 0], spine: [0, 0, 0], chest: [-10, 0, 0], neck: [0, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-170, 0, 20], 'forearm.L': [-40, 0, 0], 'upperarm.R': [-170, 0, -20], 'forearm.R': [-40, 0, 0] }), [0, -0.06, -0.06], 'inOut'),
    key(0.42, GI({ hips: [24, 0, 0], spine: [36, 0, 0], chest: [20, 0, 0], neck: [-26, 0, 0], head: [-20, 0, 0], 'upperarm.L': [-70, 0, 10], 'forearm.L': [-6, 0, 0], 'upperarm.R': [-70, 0, -10], 'forearm.R': [-6, 0, 0], 'thigh.L': [-60, 0, 12], 'shin.L': [70, 0, 0], 'thigh.R': [-50, 0, -12], 'shin.R': [66, 0, 0] }), [0, -0.5, 0.3], 'outExpo'),
    key(0.62, GI({ hips: [24, 0, 0], spine: [36, 0, 0], chest: [20, 0, 0], neck: [-26, 0, 0], head: [-20, 0, 0], 'upperarm.L': [-70, 0, 10], 'forearm.L': [-8, 0, 0], 'upperarm.R': [-70, 0, -10], 'forearm.R': [-8, 0, 0], 'thigh.L': [-60, 0, 12], 'shin.L': [70, 0, 0], 'thigh.R': [-50, 0, -12], 'shin.R': [66, 0, 0] }), [0, -0.5, 0.3], 'out'),
    key(1.0, GI(), [0, -0.22, 0], 'inOut'),
  ],
};

/** Q: La Mirada — the head thrust out, all four arms spread while a Cero swells before each eye */
const gMirada: ClipDef = {
  name: 'gr_mirada', dur: 1.5, fadeIn: 0.08, fadeOut: 0.3, events: { charge: 0.15, merge: 0.75, fire: 0.95 },
  keys: [
    key(0, GI()),
    key(0.3, GI({ spine: [16, 0, 0], chest: [6, 0, 0], neck: [-6, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-50, 0, 70], 'forearm.L': [-20, 0, 0], 'upperarm.R': [-50, 0, -70], 'forearm.R': [-20, 0, 0], 'upperarm2.L': [-20, 0, 60], 'forearm2.L': [-40, 0, 0], 'upperarm2.R': [-20, 0, -60], 'forearm2.R': [-40, 0, 0] }), [0, -0.24, 0], 'inOut'),
    key(1.2, GI({ spine: [18, 0, 0], chest: [8, 0, 0], neck: [-8, 0, 0], head: [-12, 0, 0], 'upperarm.L': [-52, 0, 72], 'forearm.L': [-20, 0, 0], 'upperarm.R': [-52, 0, -72], 'forearm.R': [-20, 0, 0], 'upperarm2.L': [-22, 0, 62], 'forearm2.L': [-40, 0, 0], 'upperarm2.R': [-22, 0, -62], 'forearm2.R': [-40, 0, 0] }), [0, -0.26, 0], 'linear'),
    key(1.5, GI(), [0, -0.22, 0], 'inOut'),
  ],
};

/** E: Los Nueve Aspectos — circles drawn in the air with the claws, then the burst of sound */
const gNueve: ClipDef = {
  name: 'gr_nueve', dur: 1.6, fadeIn: 0.08, fadeOut: 0.3, events: { draw: 0.1, fire: 1.05 },
  keys: [
    key(0, GI()),
    key(0.25, GI({ spine: [10, 0, 0], 'upperarm.R': [-110, 0, -20], 'forearm.R': [-30, 0, 0], 'upperarm.L': [-80, 0, 30], 'forearm.L': [-60, 0, 0] }), [0, -0.2, 0], 'inOut'),
    key(0.45, GI({ spine: [10, 0, 0], 'upperarm.R': [-90, 0, 10], 'forearm.R': [-40, 0, 0], 'upperarm.L': [-110, 0, 20], 'forearm.L': [-30, 0, 0] }), [0, -0.2, 0], 'inOut'),
    key(0.65, GI({ spine: [10, 0, 0], 'upperarm.R': [-120, 0, -40], 'forearm.R': [-20, 0, 0], 'upperarm.L': [-90, 0, -10], 'forearm.L': [-40, 0, 0] }), [0, -0.2, 0], 'inOut'),
    key(0.85, GI({ spine: [6, 0, 0], chest: [-6, 0, 0], 'upperarm.R': [-100, 0, -10], 'forearm.R': [-30, 0, 0], 'upperarm.L': [-100, 0, 10], 'forearm.L': [-30, 0, 0] }), [0, -0.18, -0.06], 'inOut'),
    key(1.05, GI({ hips: [16, 0, 0], spine: [30, 0, 0], chest: [18, 0, 0], head: [-26, 0, 0], 'upperarm.R': [-84, 0, -6], 'forearm.R': [-6, 0, 0], 'upperarm.L': [-84, 0, 6], 'forearm.L': [-6, 0, 0], 'thigh.L': [-56, 0, 12], 'shin.L': [64, 0, 0] }), [0, -0.3, 0.24], 'outExpo'),
    key(1.6, GI(), [0, -0.22, 0], 'inOut'),
  ],
};

/** R: the screech — head thrown up, the arms spread, the wings shaking */
const gScreech: ClipDef = {
  name: 'gr_screech', dur: 1.1, fadeIn: 0.08, fadeOut: 0.26, events: { screech: 0.3 },
  keys: [
    key(0, GI()),
    key(0.22, GI({ spine: [26, 0, 0], chest: [18, 0, 0], neck: [-6, 0, 0], head: [6, 0, 0], 'upperarm.L': [-20, 0, 30], 'forearm.L': [-80, 0, 0], 'upperarm.R': [-20, 0, -30], 'forearm.R': [-80, 0, 0] }), [0, -0.3, 0], 'inOut'),
    key(0.32, GI({ hips: [0, 0, 0], spine: [4, 0, 0], chest: [-12, 0, 0], neck: [-20, 0, 0], head: [-34, 0, 0], 'upperarm.L': [-60, 0, 80], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-60, 0, -80], 'forearm.R': [-10, 0, 0], 'upperarm2.L': [-30, 0, 70], 'upperarm2.R': [-30, 0, -70] }), [0, -0.14, 0], 'outExpo'),
    key(0.8, GI({ hips: [0, 0, 0], spine: [4, 0, 0], chest: [-12, 0, 0], neck: [-20, 0, 0], head: [-34, 0, 0], 'upperarm.L': [-60, 0, 78], 'forearm.L': [-12, 0, 0], 'upperarm.R': [-60, 0, -78], 'forearm.R': [-12, 0, 0], 'upperarm2.L': [-30, 0, 68], 'upperarm2.R': [-30, 0, -68] }), [0, -0.14, 0], 'out'),
    key(1.1, GI(), [0, -0.22, 0], 'inOut'),
  ],
};

/** the form's first moment: rising out of the darkness, the arms flung wide (he sees) */
const gBirth: ClipDef = {
  name: 'gr_birth', dur: 1.6, fadeIn: 0, fadeOut: 0.3, events: { see: 0.4 },
  keys: [
    key(0, GI({ spine: [40, 0, 0], chest: [20, 0, 0], neck: [10, 0, 0], head: [20, 0, 0] }), [0, -0.5, 0]),
    key(0.45, GI({ hips: [0, 0, 0], spine: [0, 0, 0], chest: [-14, 0, 0], neck: [-14, 0, 0], head: [-30, 0, 0], 'upperarm.L': [-80, 0, 90], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-80, 0, -90], 'forearm.R': [-10, 0, 0], 'upperarm2.L': [-40, 0, 80], 'upperarm2.R': [-40, 0, -80] }), [0, -0.1, 0], 'outExpo'),
    key(1.1, GI({ hips: [0, 0, 0], spine: [0, 0, 0], chest: [-14, 0, 0], neck: [-14, 0, 0], head: [-30, 0, 0], 'upperarm.L': [-80, 0, 88], 'forearm.L': [-12, 0, 0], 'upperarm.R': [-80, 0, -88], 'forearm.R': [-12, 0, 0], 'upperarm2.L': [-40, 0, 78], 'upperarm2.R': [-40, 0, -78] }), [0, -0.1, 0], 'out'),
    key(1.6, GI(), [0, -0.22, 0], 'inOut'),
  ],
};

export const TOSEN_CLIPS: ClipDef[] = [
  cut1, cut2, kick, thrust, sideKick, nake, benihiko, kido, maskOn, bankai, resurreccion,
  gClaw1, gClaw2, gClaw3, gSlam, gMirada, gNueve, gScreech, gBirth,
  ...ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name)),
];
export const TOSEN_CHAIN = ['ts_cut1', 'ts_cut2', 'ts_kick', 'ts_cut3'];
export const GRILLO_CHAIN = ['gr_claw1', 'gr_claw2', 'gr_claw3'];
void SH;
