// Chad's animation set: a heavyweight boxer. A tight guard with both fists up by the chin, shoulders
// rolled forward; the string is jab, cross, hook, uppercut — the hips and shoulders turning through each
// punch; the haymaker winds far back; the shoulder charge; Grua Tirar, the crane throw over the shoulder;
// El Directo with the arm drawn back while the fin charges; La Muerte with the fingers of the left hand
// spread while their tips charge, then the punch; the shield raised across the body and the shield bash.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

const GUARD: Record<string, E> = {
  hips: [0, -12, 0], spine: [6, 4, 0], chest: [6, 8, 0], neck: [4, 0, 0], head: [-2, 4, 0],
  'thigh.L': [-14, 0, 6], 'shin.L': [16, 0, 0], 'foot.L': [-2, 0, 0],
  'thigh.R': [12, 0, -6], 'shin.R': [18, 0, 0], 'foot.R': [-6, 0, 0],
  'upperarm.L': [-34, 0, -8], 'forearm.L': [-118, 0, 0], 'hand.L': [-6, 0, 0],
  'upperarm.R': [-28, 0, 8], 'forearm.R': [-124, 0, 0], 'hand.R': [-6, 0, 0],
};

/** The guard: fists up by the chin, elbows in, weight forward. */
export const CHAD_STANCE: StanceDef = {
  idle: GUARD,
  idleHips: -0.04,
  run: { 'upperarm.L': [-20, 0, -6], 'forearm.L': [-100, 0, 0], 'upperarm.R': [-20, 0, 6], 'forearm.R': [-100, 0, 0], chest: [6, 0, 0] },
  sprint: { spine: [16, 0, 0], chest: [8, 0, 0], head: [-10, 0, 0], 'upperarm.L': [30, 0, 10], 'forearm.L': [-50, 0, 0], 'upperarm.R': [30, 0, -10], 'forearm.R': [-50, 0, 0] },
  swingL: 0.3,
  swingR: 0.3,
};

/** The shield form: the great right arm held a little lower and forward, the Diablo fist cocked. */
export const CHAD_TRUE_STANCE: StanceDef = {
  ...CHAD_STANCE,
  idle: { ...GUARD, 'upperarm.R': [-46, 0, 14], 'forearm.R': [-90, 0, 0], 'hand.R': [0, 0, 0], 'upperarm.L': [-20, 0, -4], 'forearm.L': [-110, 0, 0] },
};

const G = (over: Record<string, E> = {}): Record<string, E> => ({ ...GUARD, ...over });

/** jab: the left fist snaps straight out and back. */
const jab: ClipDef = {
  name: 'ch_jab', dur: 0.42, fadeIn: 0.04, fadeOut: 0.16, events: { step: 0.04, hit: 0.1, combo: 0.18 },
  keys: [
    key(0, G()),
    key(0.1, G({ hips: [0, -20, 0], chest: [4, -14, 0], 'upperarm.L': [-88, 0, -4], 'forearm.L': [-8, 0, 0], 'hand.L': [-4, 0, 0], 'thigh.L': [-26, 0, 6], 'shin.L': [20, 0, 0] }), [0, -0.05, 0.05], 'outExpo'),
    key(0.2, G({ hips: [0, -16, 0], chest: [4, -8, 0], 'upperarm.L': [-70, 0, -6], 'forearm.L': [-50, 0, 0] }), [0, -0.045, 0.03], 'out'),
    key(0.42, G(), [0, -0.04, 0], 'inOut'),
  ],
};

/** cross: the right, the whole body turning in behind it. */
const cross: ClipDef = {
  name: 'ch_cross', dur: 0.5, fadeIn: 0.04, fadeOut: 0.18, events: { step: 0.05, hit: 0.13, combo: 0.22 },
  keys: [
    key(0, G()),
    key(0.06, G({ hips: [0, -26, 0], chest: [2, -16, 0], 'upperarm.R': [-30, 0, 12], 'forearm.R': [-128, 0, 0] }), [0, -0.05, -0.02], 'out'),
    key(0.13, G({ hips: [0, 22, 0], spine: [8, 14, 0], chest: [8, 24, 0], head: [0, -14, 0], 'upperarm.R': [-90, 0, 6], 'forearm.R': [-6, 0, 0], 'upperarm.L': [-40, 0, -12], 'forearm.L': [-120, 0, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [24, 0, 0], 'thigh.R': [22, 0, -6], 'shin.R': [20, 0, 0], 'foot.R': [12, 0, 0] }), [0, -0.07, 0.08], 'outExpo'),
    key(0.26, G({ hips: [0, 20, 0], spine: [8, 12, 0], chest: [8, 20, 0], head: [0, -12, 0], 'upperarm.R': [-76, 0, 8], 'forearm.R': [-40, 0, 0], 'thigh.L': [-28, 0, 6], 'shin.L': [22, 0, 0] }), [0, -0.065, 0.07], 'out'),
    key(0.5, G(), [0, -0.04, 0], 'inOut'),
  ],
};

/** hook: the left arm bent at a right angle, swung round level from the side. */
const hook: ClipDef = {
  name: 'ch_hook', dur: 0.52, fadeIn: 0.04, fadeOut: 0.18, events: { step: 0.06, hit: 0.14, combo: 0.24 },
  keys: [
    key(0, G()),
    key(0.07, G({ hips: [0, 18, 0], chest: [2, 22, 0], 'upperarm.L': [-60, 0, 50], 'forearm.L': [-92, 0, 0] }), [0, -0.05, 0], 'out'),
    key(0.14, G({ hips: [0, -26, 0], spine: [6, -16, 0], chest: [6, -30, 0], head: [0, 16, 0], 'upperarm.L': [-84, 0, -18], 'forearm.L': [-88, 0, 0], 'hand.L': [0, 0, 0], 'thigh.L': [-18, 0, 8], 'thigh.R': [16, 0, -6], 'shin.R': [24, 0, 0] }), [0, -0.07, 0.04], 'outExpo'),
    key(0.28, G({ hips: [0, -28, 0], spine: [6, -18, 0], chest: [6, -32, 0], head: [0, 18, 0], 'upperarm.L': [-74, 0, -24], 'forearm.L': [-96, 0, 0] }), [0, -0.07, 0.04], 'out'),
    key(0.52, G(), [0, -0.04, 0], 'inOut'),
  ],
};

/** uppercut: dropped low, then the right fist driven straight up — it launches. */
const upper: ClipDef = {
  name: 'ch_upper', dur: 0.62, fadeIn: 0.05, fadeOut: 0.2, events: { step: 0.1, hit: 0.2, combo: 0.32 },
  keys: [
    key(0, G()),
    key(0.12, G({ hips: [0, -18, 0], spine: [16, -6, 0], chest: [14, -10, 0], 'upperarm.R': [10, 0, 14], 'forearm.R': [-100, 0, 0], 'thigh.L': [-40, 0, 8], 'shin.L': [56, 0, 0], 'thigh.R': [0, 0, -8], 'shin.R': [50, 0, 0] }), [0, -0.18, 0.02], 'out'),
    key(0.2, G({ hips: [0, 16, 0], spine: [-10, 10, 0], chest: [-12, 18, 0], head: [-10, -10, 0], 'upperarm.R': [-140, 0, 8], 'forearm.R': [-70, 0, 0], 'hand.R': [-10, 0, 0], 'thigh.L': [-10, 0, 6], 'shin.L': [8, 0, 0], 'thigh.R': [14, 0, -6], 'shin.R': [6, 0, 0], 'foot.R': [20, 0, 0] }), [0, 0.04, 0.04], 'outExpo'),
    key(0.34, G({ hips: [0, 14, 0], spine: [-8, 8, 0], chest: [-10, 16, 0], head: [-8, -8, 0], 'upperarm.R': [-130, 0, 8], 'forearm.R': [-80, 0, 0] }), [0, 0.02, 0.03], 'out'),
    key(0.62, G(), [0, -0.04, 0], 'inOut'),
  ],
};

/** RMB: the haymaker — the right fist wound far back, then the whole weight thrown in. */
const haymaker: ClipDef = {
  name: 'ch_haymaker', dur: 0.95, fadeIn: 0.06, fadeOut: 0.24, events: { step: 0.32, hit: 0.4, fx: 0.4 },
  keys: [
    key(0, G()),
    key(0.3, G({ hips: [0, -40, 0], spine: [-4, -24, 0], chest: [-6, -34, 6], head: [0, 30, 0], 'upperarm.R': [30, 0, 40], 'forearm.R': [-100, 0, 0], 'upperarm.L': [-70, 0, -10], 'forearm.L': [-40, 0, 0], 'thigh.L': [-20, 0, 10], 'shin.L': [30, 0, 0], 'thigh.R': [20, 0, -8], 'shin.R': [36, 0, 0] }), [0, -0.1, -0.06], 'inOut'),
    key(0.4, G({ hips: [0, 30, 0], spine: [12, 20, 0], chest: [12, 32, 0], head: [-6, -20, 0], 'upperarm.R': [-92, 0, 4], 'forearm.R': [-4, 0, 0], 'upperarm.L': [-20, 0, -20], 'forearm.L': [-110, 0, 0], 'thigh.L': [-46, 0, 6], 'shin.L': [44, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [24, 0, 0], 'foot.R': [20, 0, 0] }), [0, -0.12, 0.14], 'outExpo'),
    key(0.62, G({ hips: [0, 28, 0], spine: [12, 18, 0], chest: [12, 30, 0], head: [-6, -18, 0], 'upperarm.R': [-80, 0, 6], 'forearm.R': [-30, 0, 0], 'thigh.L': [-44, 0, 6], 'shin.L': [42, 0, 0], 'thigh.R': [28, 0, -6] }), [0, -0.12, 0.13], 'out'),
    key(0.95, G(), [0, -0.04, 0], 'inOut'),
  ],
};

/** The fist blast / El Directo: the right arm drawn back while the fin charges, then thrust out. */
const directo: ClipDef = {
  name: 'ch_directo', dur: 1.3, fadeIn: 0.08, fadeOut: 0.28, events: { charge: 0.12, fire: 0.72 },
  keys: [
    key(0, G()),
    key(0.3, G({ hips: [0, -34, 0], spine: [0, -20, 0], chest: [0, -28, 0], head: [0, 26, 0], 'upperarm.R': [20, 0, 30], 'forearm.R': [-96, 0, 0], 'upperarm.L': [-80, 0, -6], 'forearm.L': [-20, 0, 0], 'hand.L': [-40, 0, 0], 'thigh.L': [-24, 0, 10], 'shin.L': [34, 0, 0], 'thigh.R': [22, 0, -8], 'shin.R': [36, 0, 0] }), [0, -0.12, -0.05], 'out'),
    key(0.66, G({ hips: [0, -36, 0], spine: [0, -22, 0], chest: [0, -30, 0], head: [0, 28, 0], 'upperarm.R': [24, 0, 32], 'forearm.R': [-100, 0, 0], 'upperarm.L': [-82, 0, -6], 'forearm.L': [-18, 0, 0], 'hand.L': [-40, 0, 0], 'thigh.L': [-24, 0, 10], 'shin.L': [34, 0, 0], 'thigh.R': [22, 0, -8], 'shin.R': [36, 0, 0] }), [0, -0.12, -0.05], 'inOut'),
    key(0.74, G({ hips: [0, 26, 0], spine: [10, 18, 0], chest: [10, 28, 0], head: [-4, -18, 0], 'upperarm.R': [-92, 0, 4], 'forearm.R': [-2, 0, 0], 'upperarm.L': [-20, 0, -20], 'forearm.L': [-110, 0, 0], 'thigh.L': [-46, 0, 6], 'shin.L': [44, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [24, 0, 0], 'foot.R': [20, 0, 0] }), [0, -0.12, 0.14], 'outExpo'),
    key(1.0, G({ hips: [0, 24, 0], spine: [10, 16, 0], chest: [10, 26, 0], 'upperarm.R': [-88, 0, 4], 'forearm.R': [-10, 0, 0], 'thigh.L': [-44, 0, 6], 'shin.L': [42, 0, 0], 'thigh.R': [28, 0, -6] }), [0, -0.12, 0.13], 'out'),
    key(1.3, G(), [0, -0.04, 0], 'inOut'),
  ],
};

/** La Muerte: the left hand open, fingers spread while their tips charge — then the fist closes and drives in. */
const muerte: ClipDef = {
  name: 'ch_muerte', dur: 1.6, fadeIn: 0.08, fadeOut: 0.3, events: { charge: 0.2, step: 0.92, hit: 1.0 },
  keys: [
    key(0, G()),
    key(0.3, G({ hips: [0, 30, 0], spine: [0, 16, 0], chest: [0, 26, 0], head: [0, -20, 0], 'upperarm.L': [-60, 0, 40], 'forearm.L': [-30, 0, 0], 'hand.L': [30, 0, 0], 'upperarm.R': [-40, 0, 20], 'forearm.R': [-90, 0, 0], 'thigh.L': [-14, 0, 8], 'thigh.R': [18, 0, -8], 'shin.R': [30, 0, 0] }), [0, -0.1, -0.04], 'out'),
    key(0.86, G({ hips: [0, 34, 0], spine: [-2, 18, 0], chest: [-2, 30, 0], head: [0, -22, 0], 'upperarm.L': [-50, 0, 52], 'forearm.L': [-50, 0, 0], 'hand.L': [20, 0, 0], 'upperarm.R': [-40, 0, 20], 'forearm.R': [-90, 0, 0], 'thigh.L': [-14, 0, 8], 'thigh.R': [18, 0, -8], 'shin.R': [30, 0, 0] }), [0, -0.12, -0.06], 'inOut'),
    key(1.0, G({ hips: [0, -30, 0], spine: [12, -20, 0], chest: [12, -32, 0], head: [-6, 22, 0], 'upperarm.L': [-92, 0, -4], 'forearm.L': [-2, 0, 0], 'hand.L': [-4, 0, 0], 'upperarm.R': [-20, 0, 20], 'forearm.R': [-110, 0, 0], 'thigh.L': [-48, 0, 6], 'shin.L': [46, 0, 0], 'thigh.R': [32, 0, -6], 'shin.R': [24, 0, 0], 'foot.R': [20, 0, 0] }), [0, -0.14, 0.16], 'outExpo'),
    key(1.25, G({ hips: [0, -28, 0], spine: [12, -18, 0], chest: [12, -30, 0], 'upperarm.L': [-88, 0, -4], 'forearm.L': [-8, 0, 0], 'thigh.L': [-46, 0, 6], 'shin.L': [44, 0, 0], 'thigh.R': [30, 0, -6] }), [0, -0.14, 0.15], 'out'),
    key(1.6, G(), [0, -0.04, 0], 'inOut'),
  ],
};

/** The shoulder charge: head down, the shoulder leading. */
const tackle: ClipDef = {
  name: 'ch_tackle', dur: 0.85, fadeIn: 0.05, fadeOut: 0.22, events: { go: 0.12, hit: 0.3 },
  keys: [
    key(0, G()),
    key(0.12, G({ hips: [10, 30, 0], spine: [20, 18, 0], chest: [16, 24, 0], head: [-14, -14, 0], 'upperarm.R': [-10, 0, 10], 'forearm.R': [-120, 0, 0], 'upperarm.L': [-30, 0, -20], 'forearm.L': [-110, 0, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [40, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [30, 0, 0] }), [0, -0.14, 0.08], 'out'),
    key(0.55, G({ hips: [10, 30, 0], spine: [20, 18, 0], chest: [16, 24, 0], head: [-14, -14, 0], 'upperarm.R': [-10, 0, 10], 'forearm.R': [-120, 0, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [36, 0, 0], 'thigh.R': [24, 0, -6], 'shin.R': [30, 0, 0] }), [0, -0.13, 0.08], 'linear'),
    key(0.85, G(), [0, -0.04, 0], 'inOut'),
  ],
};

/** Grua Tirar: the target seized and heaved over his shoulder into the ground behind... in front. */
const throwC: ClipDef = {
  name: 'ch_throw', dur: 1.25, fadeIn: 0.06, fadeOut: 0.26, events: { grab: 0.2, lift: 0.5, slam: 0.82 },
  keys: [
    key(0, G()),
    key(0.2, G({ hips: [0, 0, 0], spine: [14, 0, 0], chest: [10, 0, 0], 'upperarm.L': [-80, 0, 10], 'forearm.L': [-40, 0, 0], 'upperarm.R': [-80, 0, -10], 'forearm.R': [-40, 0, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [40, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [36, 0, 0] }), [0, -0.12, 0.06], 'out'),
    key(0.5, G({ hips: [0, 0, 0], spine: [-14, 0, 0], chest: [-18, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-170, 0, 20], 'forearm.L': [-30, 0, 0], 'upperarm.R': [-170, 0, -20], 'forearm.R': [-30, 0, 0], 'thigh.L': [-10, 0, 6], 'shin.L': [10, 0, 0], 'thigh.R': [8, 0, -6], 'shin.R': [10, 0, 0] }), [0, 0.02, -0.04], 'inOut'),
    key(0.82, G({ hips: [12, 0, 0], spine: [30, 0, 0], chest: [26, 0, 0], head: [-16, 0, 0], 'upperarm.L': [-70, 0, 14], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-70, 0, -14], 'forearm.R': [-10, 0, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [56, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [36, 0, 0] }), [0, -0.16, 0.12], 'outExpo'),
    key(1.25, G(), [0, -0.04, 0], 'inOut'),
  ],
};

/** The shield raised across the body (held while guarding). */
const guard: ClipDef = {
  name: 'ch_guard', dur: 0.9, fadeIn: 0.06, fadeOut: 0.2, events: { up: 0.08 },
  keys: [
    key(0, G()),
    key(0.1, G({ hips: [0, -20, 0], chest: [6, -14, 0], 'upperarm.R': [-74, 0, -24], 'forearm.R': [-64, 0, 0], 'hand.R': [0, 0, 0], 'thigh.L': [-24, 0, 8], 'shin.L': [26, 0, 0], 'thigh.R': [14, 0, -8], 'shin.R': [26, 0, 0] }), [0, -0.1, 0], 'outExpo'),
    key(0.7, G({ hips: [0, -20, 0], chest: [6, -14, 0], 'upperarm.R': [-74, 0, -24], 'forearm.R': [-64, 0, 0], 'thigh.L': [-24, 0, 8], 'shin.L': [26, 0, 0], 'thigh.R': [14, 0, -8], 'shin.R': [26, 0, 0] }), [0, -0.1, 0], 'linear'),
    key(0.9, G(), [0, -0.04, 0], 'inOut'),
  ],
};

/** The arm coats itself: the fist raised and clenched, the body tensed. */
const coat: ClipDef = {
  name: 'ch_coat', dur: 1.5, fadeIn: 0.1, fadeOut: 0.3, events: { coat: 0.7 },
  keys: [
    key(0, G()),
    key(0.5, G({ spine: [-4, 0, 0], chest: [-8, 0, 0], head: [6, 0, 0], 'upperarm.R': [-100, 0, 20], 'forearm.R': [-80, 0, 0], 'hand.R': [10, 0, 0], 'upperarm.L': [-20, 0, -10], 'forearm.L': [-100, 0, 0] }), [0, -0.05, 0], 'inOut'),
    key(0.75, G({ spine: [-6, 0, 0], chest: [-10, 0, 0], head: [4, 0, 0], 'upperarm.R': [-110, 0, 24], 'forearm.R': [-90, 0, 0], 'upperarm.L': [-60, 0, 40], 'forearm.L': [-90, 0, 0], 'thigh.L': [-24, 0, 10], 'shin.L': [26, 0, 0], 'thigh.R': [20, 0, -10], 'shin.R': [26, 0, 0] }), [0, -0.1, 0], 'outExpo'),
    key(1.1, G({ spine: [-6, 0, 0], chest: [-10, 0, 0], 'upperarm.R': [-110, 0, 24], 'forearm.R': [-90, 0, 0], 'upperarm.L': [-60, 0, 40], 'forearm.L': [-90, 0, 0], 'thigh.L': [-24, 0, 10], 'shin.L': [26, 0, 0], 'thigh.R': [20, 0, -10], 'shin.R': [26, 0, 0] }), [0, -0.1, 0], 'out'),
    key(1.5, G(), [0, -0.04, 0], 'inOut'),
  ],
};

export const CHAD_CLIPS: ClipDef[] = [
  jab, cross, hook, upper, haymaker, directo, muerte, tackle, throwC, guard, coat,
  ...ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name)),
];
export const CHAD_CHAIN = ['ch_jab', 'ch_cross', 'ch_hook', 'ch_upper'];
