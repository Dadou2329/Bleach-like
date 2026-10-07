// Rukia's animation set. Small, quick and exact: the katana held forward at mid height, cuts that turn
// the whole body like a dance, a Hakuda sweep kick to close the string. Kidō from the left hand (the palm
// shoved out for Sōkatsui, two fingers for Byakurai, a throw for Hainawa). Shikai: the sword turned through
// a full counter-clockwise circle ("Mae, Sode no Shirayuki"); the dances — the sword reversed and its tip
// drawn round a circle (Tsukishiro), one stab and four in a semicircle then the thrust (Hakuren), the
// thrust whose blade grows on (Shirafune). Bankai: the blade raised in the rising mist; the wave of cold.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });
/** shoulder-ish swing centre for her reach */
const SH: E = [-0.14, 0.14, 0.02];
const R0 = 0.27;

const IDLE: Record<string, E> = {
  hips: [0, -8, 0], spine: [2, 4, 0], chest: [0, 6, 0], head: [2, 0, 0],
  'thigh.L': [-10, 0, 5], 'shin.L': [10, 0, 0], 'foot.L': [0, 0, 0],
  'thigh.R': [8, 0, -5], 'shin.R': [12, 0, 0], 'foot.R': [-6, 0, 0],
  'upperarm.L': [-6, 0, 14], 'forearm.L': [-30, 0, 0], 'hand.L': [4, 0, 0],
};
const MID = { p: [-0.16, -0.17, 0.17] as E, dir: [-0.08, 0.14, 0.99] as E, edge: [0.05, -0.99, 0.14] as E, pole: [-0.6, -0.4, -0.7] as E };
const GRIP = (g: typeof MID) => ({ '@gripR': g.p, '@dirR': g.dir, '@edgeR': g.edge, '@poleR': g.pole, '@ikR': [1, 0, 0] as E });

/** The katana forward at mid height, the left hand open and ready for Kidō. */
export const RUKIA_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.02,
  run: { 'upperarm.L': [-4, 0, 6], chest: [0, 6, 0] },
  sprint: { spine: [12, 0, 0], 'upperarm.L': [16, 0, 10], 'forearm.L': [-30, 0, 0] },
  swingL: 0.9,
  swingR: 0.2,
  grip: {
    idle: MID,
    walk: { ...MID, p: [-0.17, -0.17, 0.15] },
    run: { p: [-0.2, -0.17, -0.04], dir: [-0.22, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.19, -0.1, -0.11], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.24, -0.05, 0.08], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

/** Hakka no Togame: upright and still, the ice blade lowered to her right, the left hand at her chest. */
export const TOGAME_STANCE: StanceDef = {
  ...RUKIA_STANCE,
  idle: { ...IDLE, hips: [0, -4, 0], 'thigh.L': [-4, 0, 3], 'shin.L': [4, 0, 0], 'thigh.R': [3, 0, -3], 'shin.R': [5, 0, 0], 'upperarm.L': [-30, 0, 10], 'forearm.L': [-70, 0, 0], 'hand.L': [-10, 0, 0] },
  idleHips: -0.01,
  grip: {
    ...RUKIA_STANCE.grip!,
    idle: { p: [-0.2, -0.24, 0.08], dir: [-0.25, -0.55, 0.8], edge: [0.1, -0.8, -0.55], pole: [-0.55, -0.3, -0.8] },
    walk: { p: [-0.2, -0.24, 0.06], dir: [-0.25, -0.55, 0.8], edge: [0.1, -0.8, -0.55], pole: [-0.55, -0.3, -0.8] },
  },
};

const R = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });

// ------------------------------------------------------------------ the string

/** 1: a falling diagonal, high right → low left, the body turning after it. */
const cut1: ClipDef = {
  name: 'rk_cut1', dur: 0.52, fadeIn: 0.05, fadeOut: 0.2, events: { step: 0.06, hit: 0.13, combo: 0.24 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0.75, -0.66, 0], c: SH, r: R0, pole: [-0.5, -0.6, -0.6],
      keys: [[0, -60, 'out'], [0.07, -130, 'out'], [0.13, 25, 'outExpo'], [0.24, 100, 'out'], [0.52, 60, 'inOut']],
    }),
    [
      key(0, R()),
      key(0.07, R({ hips: [0, -22, 0], spine: [-2, -16, 0], chest: [-6, -24, 6], head: [0, 20, 0], 'thigh.R': [12, 0, -6], 'shin.R': [18, 0, 0] }), [0, -0.02, -0.02], 'out'),
      key(0.13, R({ hips: [0, 14, 0], spine: [8, 16, 0], chest: [8, 24, -6], head: [4, -18, 0], 'thigh.L': [-28, 0, 6], 'shin.L': [26, 0, 0], 'thigh.R': [20, 0, -4], 'shin.R': [22, 0, 0], 'upperarm.L': [-20, 0, 30], 'forearm.L': [-26, 0, 0] }), [0, -0.05, 0.05], 'outExpo'),
      key(0.24, R({ hips: [0, 20, 0], spine: [10, 20, 0], chest: [10, 26, -6], head: [4, -22, 0], 'thigh.L': [-26, 0, 6], 'thigh.R': [20, 0, -4], 'upperarm.L': [-14, 0, 34], 'forearm.L': [-30, 0, 0] }), [0, -0.06, 0.06], 'out'),
      key(0.52, R(), [0, -0.02, 0], 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.3, 0, 0] } }],
  ),
};

/** 2: a rising backhand, low left → high right, up on the toes. */
const cut2: ClipDef = {
  name: 'rk_cut2', dur: 0.52, fadeIn: 0.05, fadeOut: 0.2, events: { step: 0.06, hit: 0.13, combo: 0.24 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [-0.8, 0.6, 0], c: [-0.06, 0.08, 0.05], r: R0, pole: [-0.3, -0.4, -0.85],
      keys: [[0, -150, 'out'], [0.07, -125, 'out'], [0.13, 50, 'outExpo'], [0.26, 118, 'out'], [0.52, 70, 'inOut']],
    }),
    [
      key(0, R({ hips: [0, 16, 0], spine: [8, 14, 0], chest: [6, 22, -4] })),
      key(0.07, R({ hips: [0, 26, 0], spine: [10, 20, 6], chest: [10, 28, 8], 'thigh.L': [-20, 0, 8], 'shin.L': [28, 0, 0], 'thigh.R': [16, 0, -4], head: [4, -20, 0] }), [0, -0.06, 0], 'out'),
      key(0.13, R({ hips: [0, -20, 0], spine: [-4, -20, -4], chest: [-12, -28, -10], 'thigh.L': [-6, 0, 6], 'thigh.R': [-4, 0, -10], 'shin.R': [10, 0, 0], 'foot.L': [12, 0, 0], 'foot.R': [12, 0, 0], head: [-8, 22, 0], 'upperarm.L': [24, 0, 32] }), [0, 0.02, 0.04], 'outExpo'),
      key(0.26, R({ hips: [0, -24, 0], spine: [-6, -22, -4], chest: [-14, -30, -10], head: [-10, 24, 0], 'upperarm.L': [26, 0, 36] }), [0, 0.01, 0.05], 'out'),
      key(0.52, R(), [0, -0.02, 0], 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.3, 0, 0] } }],
  ),
};

/** 3: a full pirouette, the blade flat and level round her. */
const cut3: ClipDef = {
  name: 'rk_cut3', dur: 0.7, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.08, hit: 0.22, combo: 0.36 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [1, 0, 0], c: [-0.08, 0.04, 0.02], r: 0.3, pole: [-0.6, -0.5, -0.5],
      keys: [[0, -70, 'out'], [0.12, -110, 'out'], [0.22, 40, 'outExpo'], [0.34, 110, 'out'], [0.7, 60, 'inOut']],
    }),
    [
      key(0, R()),
      key(0.12, R({ hips: [0, -40, 0], spine: [0, -24, 0], chest: [0, -30, 0], head: [0, 34, 0], 'thigh.L': [-8, 0, 6], 'thigh.R': [10, 0, -6], 'shin.R': [14, 0, 0] }), [0, -0.03, 0], 'out'),
      key(0.22, R({ hips: [0, 60, 0], spine: [4, 30, 0], chest: [4, 36, 0], head: [0, -30, 0], 'thigh.L': [-22, 0, 8], 'shin.L': [20, 0, 0], 'thigh.R': [18, 0, -6], 'upperarm.L': [-6, 0, 60], 'forearm.L': [-10, 0, 0] }), [0, -0.05, 0.03], 'outExpo'),
      key(0.34, R({ hips: [0, 70, 0], spine: [4, 32, 0], chest: [6, 38, 0], head: [0, -36, 0], 'upperarm.L': [-4, 0, 64], 'forearm.L': [-12, 0, 0] }), [0, -0.05, 0.03], 'out'),
      key(0.7, R(), [0, -0.02, 0], 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.3, 0, 0] } }],
  ),
};

/** 4: the Hakuda close — a low sweeping kick with the right leg, the sword held back. */
const kick: ClipDef = {
  name: 'rk_kick', dur: 0.66, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.08, hit: 0.2, combo: 0.36 },
  keys: mergeKeys(
    [
      { t: 0, c: GRIP(MID) },
      { t: 0.12, ease: 'out', c: GRIP({ p: [-0.2, -0.05, -0.12], dir: [-0.3, 0.2, -0.93], edge: [0, -1, 0.2], pole: [-0.7, -0.4, 0.4] }) },
      { t: 0.4, ease: 'inOut', c: GRIP({ p: [-0.2, -0.05, -0.12], dir: [-0.3, 0.2, -0.93], edge: [0, -1, 0.2], pole: [-0.7, -0.4, 0.4] }) },
      { t: 0.66, ease: 'inOut', c: GRIP(MID) },
    ],
    [
      key(0, R()),
      key(0.1, R({ hips: [0, -30, 0], spine: [-6, -10, 0], chest: [-6, -14, 0], 'thigh.L': [-20, 0, 6], 'shin.L': [40, 0, 0], 'thigh.R': [30, 0, -10], 'shin.R': [70, 0, 0], 'upperarm.L': [-30, 0, 40] }), [0, -0.12, -0.02], 'out'),
      key(0.2, R({ hips: [0, 40, -8], spine: [-8, 14, 0], chest: [-6, 18, 0], head: [0, -20, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [60, 0, 0], 'thigh.R': [-70, 30, -30], 'shin.R': [10, 0, 0], 'foot.R': [20, 0, 0], 'upperarm.L': [-10, 0, 70], 'forearm.L': [-10, 0, 0] }), [0, -0.2, 0.06], 'outExpo'),
      key(0.36, R({ hips: [0, 44, -6], spine: [-6, 16, 0], chest: [-4, 20, 0], head: [0, -22, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [60, 0, 0], 'thigh.R': [-50, 26, -24], 'shin.R': [20, 0, 0], 'upperarm.L': [-6, 0, 66] }), [0, -0.19, 0.06], 'out'),
      key(0.66, R(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** RMB: a long lunging thrust, the point leading. */
const thrust: ClipDef = {
  name: 'rk_thrust', dur: 0.7, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.1, hit: 0.18, fx: 0.2 },
  keys: mergeKeys(
    [
      { t: 0, c: GRIP(MID) },
      { t: 0.1, ease: 'out', c: GRIP({ p: [-0.2, -0.08, -0.06], dir: [0, 0.05, 1], edge: [0, -1, 0.05], pole: [-0.8, -0.3, -0.3] }) },
      { t: 0.18, ease: 'outExpo', c: GRIP({ p: [-0.06, -0.02, 0.5], dir: [0.05, 0, 1], edge: [0, -1, 0], pole: [-0.7, -0.5, -0.2] }) },
      { t: 0.36, ease: 'out', c: GRIP({ p: [-0.07, -0.02, 0.46], dir: [0.05, 0, 1], edge: [0, -1, 0], pole: [-0.7, -0.5, -0.2] }) },
      { t: 0.7, ease: 'inOut', c: GRIP(MID) },
    ],
    [
      key(0, R()),
      key(0.1, R({ hips: [0, -20, 0], chest: [0, -16, 0], 'thigh.L': [-14, 0, 6], 'thigh.R': [16, 0, -6], 'shin.R': [24, 0, 0], 'upperarm.L': [-20, 0, 30] }), [0, -0.05, -0.04], 'out'),
      key(0.18, R({ hips: [6, 14, 0], spine: [12, 8, 0], chest: [10, 14, 0], head: [-10, -8, 0], 'thigh.L': [-56, 0, 6], 'shin.L': [50, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [14, 0, 0], 'upperarm.L': [20, 0, 60], 'forearm.L': [-6, 0, 0] }), [0, -0.12, 0.16], 'outExpo'),
      key(0.36, R({ hips: [6, 14, 0], spine: [12, 8, 0], chest: [10, 14, 0], head: [-10, -8, 0], 'thigh.L': [-56, 0, 6], 'shin.L': [50, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [14, 0, 0], 'upperarm.L': [20, 0, 60] }), [0, -0.12, 0.16], 'out'),
      key(0.7, R(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

// ------------------------------------------------------------------ Kidō

/** Sōkatsui: the left palm shoved out at the target, the body behind it. */
const palm: ClipDef = {
  name: 'rk_palm', dur: 0.62, fadeIn: 0.05, fadeOut: 0.22, events: { cast: 0.2 },
  keys: [
    key(0, R()),
    key(0.12, R({ hips: [0, 14, 0], chest: [0, 14, 0], 'upperarm.L': [-40, 0, 10], 'forearm.L': [-80, 0, 0], 'hand.L': [-30, 0, 0], 'thigh.R': [14, 0, -6] }), [0, -0.04, -0.02], 'out'),
    key(0.2, R({ hips: [0, -12, 0], spine: [6, -8, 0], chest: [4, -16, 0], head: [-4, 10, 0], 'upperarm.L': [-88, 0, -6], 'forearm.L': [-4, 0, 0], 'hand.L': [-70, 0, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [26, 0, 0], 'thigh.R': [18, 0, -6] }), [0, -0.07, 0.06], 'outExpo'),
    key(0.36, R({ hips: [0, -12, 0], spine: [6, -8, 0], chest: [4, -16, 0], head: [-4, 10, 0], 'upperarm.L': [-86, 0, -6], 'forearm.L': [-8, 0, 0], 'hand.L': [-70, 0, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [26, 0, 0], 'thigh.R': [18, 0, -6] }), [0, -0.07, 0.06], 'out'),
    key(0.62, R(), [0, -0.02, 0], 'inOut'),
  ],
};

/** Byakurai: two fingers levelled at the target like a pistol. */
const point: ClipDef = {
  name: 'rk_point', dur: 0.62, fadeIn: 0.06, fadeOut: 0.22, events: { aim: 0.12, cast: 0.24 },
  keys: [
    key(0, R()),
    key(0.12, R({ chest: [0, -12, 0], head: [0, 8, 0], 'upperarm.L': [-86, 0, -4], 'forearm.L': [-6, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.02, 0], 'out'),
    key(0.24, R({ chest: [-2, -14, 0], head: [0, 10, 0], 'upperarm.L': [-92, 0, -4], 'forearm.L': [-2, 0, 0], 'hand.L': [-6, 0, 0] }), [0, -0.02, -0.02], 'outExpo'),
    key(0.4, R({ chest: [-2, -14, 0], head: [0, 10, 0], 'upperarm.L': [-90, 0, -4], 'forearm.L': [-4, 0, 0] }), [0, -0.02, -0.02], 'out'),
    key(0.62, R(), [0, -0.02, 0], 'inOut'),
  ],
};

/** Hainawa thrown underhand from the left hand; Rikujōkōrō called with a raised finger. */
const rope: ClipDef = {
  name: 'rk_rope', dur: 1.2, fadeIn: 0.06, fadeOut: 0.24, events: { throw: 0.22, bind: 0.7 },
  keys: [
    key(0, R()),
    key(0.12, R({ hips: [0, 16, 0], chest: [0, 18, 0], 'upperarm.L': [20, 0, 30], 'forearm.L': [-40, 0, 0] }), [0, -0.04, -0.02], 'out'),
    key(0.22, R({ hips: [0, -10, 0], chest: [4, -14, 0], 'upperarm.L': [-80, 0, 16], 'forearm.L': [-6, 0, 0], 'hand.L': [-20, 0, 0], 'thigh.L': [-24, 0, 6], 'shin.L': [20, 0, 0] }), [0, -0.05, 0.04], 'outExpo'),
    key(0.55, R({ chest: [0, -10, 0], 'upperarm.L': [-60, 0, 10], 'forearm.L': [-60, 0, 0], 'hand.L': [-10, 0, 0] }), [0, -0.03, 0], 'inOut'),
    key(0.7, R({ chest: [-2, -14, 0], head: [-4, 8, 0], 'upperarm.L': [-150, 0, 4], 'forearm.L': [-6, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.02, 0], 'outExpo'),
    key(0.9, R({ chest: [-2, -14, 0], head: [-4, 8, 0], 'upperarm.L': [-148, 0, 4], 'forearm.L': [-8, 0, 0] }), [0, -0.02, 0], 'out'),
    key(1.2, R(), [0, -0.02, 0], 'inOut'),
  ],
};

// ------------------------------------------------------------------ Shikai: the dances

/** "Mae, Sode no Shirayuki": the sword held out at arm's length and turned through a full counter-clockwise circle. */
const shikaiKeys: KeyDef[] = [];
for (let i = 0; i <= 8; i++) {
  const ph = (i / 8) * Math.PI * 2;
  const t = 0.3 + i * 0.075;
  shikaiKeys.push({ t, ease: i === 0 ? 'out' : 'linear', c: GRIP({ p: [-0.08, 0.06, 0.42], dir: [Math.sin(ph), Math.cos(ph), 0.35], edge: [Math.cos(ph), -Math.sin(ph), 0], pole: [-0.7, -0.5, -0.3] }) });
}
const shikai: ClipDef = {
  name: 'rk_shikai', dur: 1.7, fadeIn: 0.1, fadeOut: 0.3, events: { raise: 0.3, mae: 0.98 },
  keys: mergeKeys(
    [{ t: 0, c: GRIP(MID) }, ...shikaiKeys, { t: 1.2, ease: 'out', c: GRIP({ p: [-0.1, 0.02, 0.36], dir: [0.1, 0.4, 0.9], edge: [0, -0.9, 0.4], pole: [-0.7, -0.5, -0.3] }) }, { t: 1.7, ease: 'inOut', c: GRIP(MID) }],
    [
      key(0, R()),
      key(0.3, R({ spine: [-2, 0, 0], chest: [-4, 6, 0], head: [-4, 0, 0], 'upperarm.L': [-10, 0, 30], 'forearm.L': [-20, 0, 0] }), [0, -0.01, 0], 'out'),
      key(0.98, R({ spine: [-2, 0, 0], chest: [-4, 6, 0], head: [-4, 0, 0], 'upperarm.L': [-10, 0, 30], 'forearm.L': [-20, 0, 0] }), [0, -0.01, 0], 'linear'),
      key(1.1, R({ spine: [4, 0, 0], chest: [6, 4, 0], head: [-6, 0, 0], 'upperarm.L': [10, 0, 44], 'forearm.L': [-10, 0, 0], 'thigh.L': [-20, 0, 6], 'shin.L': [20, 0, 0] }), [0, -0.05, 0.03], 'outExpo'),
      key(1.7, R(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** Some no mai, Tsukishiro: the sword reversed, its tip drawn round a circle on the ground ahead. */
const tsukiKeys: KeyDef[] = [];
for (let i = 0; i <= 6; i++) {
  const ph = (i / 6) * Math.PI * 2;
  tsukiKeys.push({ t: 0.22 + i * 0.05, ease: i === 0 ? 'out' : 'linear', c: GRIP({ p: [-0.1 + Math.sin(ph) * 0.08, -0.02, 0.3 + Math.cos(ph) * 0.06], dir: [Math.sin(ph) * 0.35, -0.85, 0.4 + Math.cos(ph) * 0.2], edge: [Math.cos(ph), 0, -Math.sin(ph)], pole: [-0.7, -0.4, -0.4] }) });
}
const tsukishiro: ClipDef = {
  name: 'rk_tsukishiro', dur: 1.4, fadeIn: 0.08, fadeOut: 0.3, events: { reverse: 0.12, circle: 0.32, rise: 0.66 },
  keys: mergeKeys(
    [
      { t: 0, c: GRIP(MID) },
      { t: 0.14, ease: 'out', c: GRIP({ p: [-0.12, 0.02, 0.26], dir: [0, -0.9, 0.4], edge: [1, 0, 0], pole: [-0.7, -0.4, -0.4] }) },
      ...tsukiKeys,
      { t: 0.66, ease: 'outExpo', c: GRIP({ p: [-0.12, 0.2, 0.22], dir: [0, -0.95, 0.3], edge: [1, 0, 0], pole: [-0.7, -0.3, -0.4] }) },
      { t: 1.0, ease: 'out', c: GRIP({ p: [-0.12, 0.18, 0.22], dir: [0, -0.95, 0.3], edge: [1, 0, 0], pole: [-0.7, -0.3, -0.4] }) },
      { t: 1.4, ease: 'inOut', c: GRIP(MID) },
    ],
    [
      key(0, R()),
      key(0.22, R({ spine: [10, 0, 0], chest: [8, 0, 0], head: [8, 0, 0], 'thigh.L': [-20, 0, 6], 'shin.L': [30, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [26, 0, 0], 'upperarm.L': [-20, 0, 40], 'forearm.L': [-10, 0, 0] }), [0, -0.1, 0.02], 'out'),
      key(0.52, R({ spine: [10, 0, 0], chest: [8, 0, 0], head: [8, 0, 0], 'thigh.L': [-20, 0, 6], 'shin.L': [30, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [26, 0, 0], 'upperarm.L': [-20, 0, 40], 'forearm.L': [-10, 0, 0] }), [0, -0.1, 0.02], 'linear'),
      key(0.66, R({ spine: [-4, 0, 0], chest: [-6, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-10, 0, 50] }), [0, 0, 0], 'outExpo'),
      key(1.0, R({ spine: [-4, 0, 0], chest: [-6, 0, 0], head: [-12, 0, 0], 'upperarm.L': [-10, 0, 50] }), [0, 0, 0], 'out'),
      key(1.4, R(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** Tsugi no mai, Hakuren: one stab into the ground, four in a semicircle ahead, then the thrust that looses the avalanche. */
const STAB = (x: number, z: number) => GRIP({ p: [-0.08 + x * 0.12, -0.06, 0.32 + z * 0.05], dir: [x * 0.3, -0.9, 0.3], edge: [1, 0, 0], pole: [-0.7, -0.4, -0.4] });
const UPS = GRIP({ p: [-0.12, 0.12, 0.24], dir: [0, -0.7, 0.7], edge: [1, 0, 0], pole: [-0.7, -0.4, -0.4] });
const hakuren: ClipDef = {
  name: 'rk_hakuren', dur: 1.75, fadeIn: 0.06, fadeOut: 0.3, events: { stab0: 0.22, stab1: 0.42, stab2: 0.57, stab3: 0.72, stab4: 0.87, gather: 0.95, release: 1.18 },
  keys: mergeKeys(
    [
      { t: 0, c: GRIP(MID) },
      { t: 0.14, ease: 'out', c: UPS },
      { t: 0.22, ease: 'outExpo', c: STAB(0, 0) },
      { t: 0.34, ease: 'out', c: UPS },
      { t: 0.42, ease: 'outExpo', c: STAB(-1.2, 1) },
      { t: 0.5, ease: 'out', c: UPS },
      { t: 0.57, ease: 'outExpo', c: STAB(-0.4, 1.6) },
      { t: 0.65, ease: 'out', c: UPS },
      { t: 0.72, ease: 'outExpo', c: STAB(0.4, 1.6) },
      { t: 0.8, ease: 'out', c: UPS },
      { t: 0.87, ease: 'outExpo', c: STAB(1.2, 1) },
      { t: 1.05, ease: 'out', c: GRIP({ p: [-0.22, -0.02, -0.04], dir: [0, 0.1, 1], edge: [0, -1, 0.1], pole: [-0.8, -0.3, -0.3] }) },
      { t: 1.18, ease: 'outExpo', c: GRIP({ p: [-0.06, 0.02, 0.5], dir: [0.05, 0.05, 1], edge: [0, -1, 0], pole: [-0.7, -0.5, -0.2] }) },
      { t: 1.45, ease: 'out', c: GRIP({ p: [-0.07, 0.02, 0.46], dir: [0.05, 0.05, 1], edge: [0, -1, 0], pole: [-0.7, -0.5, -0.2] }) },
      { t: 1.75, ease: 'inOut', c: GRIP(MID) },
    ],
    [
      key(0, R()),
      key(0.22, R({ spine: [16, 0, 0], chest: [10, 0, 0], head: [6, 0, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [44, 0, 0], 'thigh.R': [6, 0, -6], 'shin.R': [40, 0, 0], 'upperarm.L': [-10, 0, 40] }), [0, -0.16, 0.04], 'outExpo'),
      key(0.87, R({ spine: [16, 0, 0], chest: [10, 0, 0], head: [6, 0, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [44, 0, 0], 'thigh.R': [6, 0, -6], 'shin.R': [40, 0, 0], 'upperarm.L': [-10, 0, 40] }), [0, -0.16, 0.04], 'linear'),
      key(1.05, R({ hips: [0, -18, 0], chest: [0, -16, 0], 'thigh.L': [-14, 0, 6], 'thigh.R': [16, 0, -6], 'shin.R': [24, 0, 0], 'upperarm.L': [-30, 0, 30] }), [0, -0.06, -0.04], 'out'),
      key(1.18, R({ hips: [6, 14, 0], spine: [12, 8, 0], chest: [10, 14, 0], head: [-10, -8, 0], 'thigh.L': [-56, 0, 6], 'shin.L': [50, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [14, 0, 0], 'upperarm.L': [20, 0, 60] }), [0, -0.12, 0.16], 'outExpo'),
      key(1.45, R({ hips: [6, 14, 0], spine: [12, 8, 0], chest: [10, 14, 0], head: [-10, -8, 0], 'thigh.L': [-56, 0, 6], 'shin.L': [50, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [14, 0, 0], 'upperarm.L': [20, 0, 60] }), [0, -0.12, 0.16], 'out'),
      key(1.75, R(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** San no mai, Shirafune: the thrust whose blade grows on in ice; held, then the ice breaks away. */
const shirafune: ClipDef = {
  ...thrust,
  name: 'rk_shirafune', dur: 1.3, events: { step: 0.1, grow: 0.18, hit: 0.22, shatter: 0.95 },
  keys: mergeKeys(
    [
      { t: 0, c: GRIP(MID) },
      { t: 0.1, ease: 'out', c: GRIP({ p: [-0.2, -0.08, -0.06], dir: [0, 0.05, 1], edge: [0, -1, 0.05], pole: [-0.8, -0.3, -0.3] }) },
      { t: 0.18, ease: 'outExpo', c: GRIP({ p: [-0.06, -0.02, 0.5], dir: [0.05, 0, 1], edge: [0, -1, 0], pole: [-0.7, -0.5, -0.2] }) },
      { t: 0.95, ease: 'inOut', c: GRIP({ p: [-0.08, -0.04, 0.46], dir: [0.05, -0.02, 1], edge: [0, -1, 0], pole: [-0.7, -0.5, -0.2] }) },
      { t: 1.3, ease: 'inOut', c: GRIP(MID) },
    ],
    [
      key(0, R()),
      key(0.1, R({ hips: [0, -20, 0], chest: [0, -16, 0], 'thigh.L': [-14, 0, 6], 'thigh.R': [16, 0, -6], 'shin.R': [24, 0, 0], 'upperarm.L': [-20, 0, 30] }), [0, -0.05, -0.04], 'out'),
      key(0.18, R({ hips: [6, 14, 0], spine: [12, 8, 0], chest: [10, 14, 0], head: [-10, -8, 0], 'thigh.L': [-56, 0, 6], 'shin.L': [50, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [14, 0, 0], 'upperarm.L': [20, 0, 60], 'forearm.L': [-6, 0, 0] }), [0, -0.12, 0.16], 'outExpo'),
      key(0.95, R({ hips: [6, 14, 0], spine: [12, 8, 0], chest: [10, 14, 0], head: [-10, -8, 0], 'thigh.L': [-56, 0, 6], 'shin.L': [50, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [14, 0, 0], 'upperarm.L': [20, 0, 60] }), [0, -0.12, 0.16], 'inOut'),
      key(1.3, R(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

// ------------------------------------------------------------------ Bankai

/** "Bankai — Hakka no Togame": upright in the rising mist, the blade lifted before her face. */
const bankai: ClipDef = {
  name: 'rk_bankai', dur: 2.0, fadeIn: 0.1, fadeOut: 0.3, events: { mist: 0.15, burst: 0.95 },
  keys: mergeKeys(
    [
      { t: 0, c: GRIP(MID) },
      { t: 0.5, ease: 'inOut', c: GRIP({ p: [-0.05, 0.12, 0.24], dir: [0.02, 1, 0.08], edge: [0, -0.08, 1], pole: [-0.7, -0.5, -0.3] }) },
      { t: 1.4, ease: 'inOut', c: GRIP({ p: [-0.05, 0.13, 0.24], dir: [0.02, 1, 0.08], edge: [0, -0.08, 1], pole: [-0.7, -0.5, -0.3] }) },
      { t: 2.0, ease: 'inOut', c: GRIP(MID) },
    ],
    [
      key(0, R()),
      key(0.5, R({ hips: [0, 0, 0], spine: [-2, 0, 0], chest: [-2, 0, 0], head: [-6, 0, 0], 'thigh.L': [-4, 0, 3], 'shin.L': [4, 0, 0], 'thigh.R': [3, 0, -3], 'shin.R': [5, 0, 0], 'upperarm.L': [-40, 0, 10], 'forearm.L': [-80, 0, 0], 'hand.L': [-10, 0, 0] }), [0, 0, 0], 'inOut'),
      key(0.95, R({ spine: [-4, 0, 0], chest: [-6, 0, 0], head: [-12, 0, 0], 'thigh.L': [-4, 0, 3], 'shin.L': [4, 0, 0], 'thigh.R': [3, 0, -3], 'shin.R': [5, 0, 0], 'upperarm.L': [-20, 0, 50], 'forearm.L': [-20, 0, 0] }), [0, 0.01, 0], 'outExpo'),
      key(1.4, R({ spine: [-4, 0, 0], chest: [-6, 0, 0], head: [-12, 0, 0], 'upperarm.L': [-20, 0, 50], 'forearm.L': [-20, 0, 0] }), [0, 0.01, 0], 'out'),
      key(2.0, R(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** The wave of absolute zero: the blade raised, then swept down and out toward the target. */
const wave: ClipDef = {
  name: 'rk_wave', dur: 1.2, fadeIn: 0.08, fadeOut: 0.28, events: { raise: 0.2, wave: 0.46 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0, 1, 0], c: [-0.08, 0.12, 0.06], r: 0.3, pole: [-0.7, -0.3, -0.6],
      keys: [[0, 20, 'out'], [0.3, 120, 'out'], [0.38, 115, 'linear'], [0.46, -10, 'outExpo'], [0.7, -20, 'out'], [1.2, 10, 'inOut']],
    }),
    [
      key(0, R()),
      key(0.3, R({ spine: [-10, 0, 0], chest: [-12, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-30, 0, 60], 'forearm.L': [-10, 0, 0] }), [0, 0.02, -0.02], 'out'),
      key(0.46, R({ hips: [6, 0, 0], spine: [16, 0, 0], chest: [14, 0, 0], head: [-10, 0, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [44, 0, 0], 'thigh.R': [24, 0, -4], 'shin.R': [26, 0, 0], 'upperarm.L': [20, 0, 50] }), [0, -0.09, 0.08], 'outExpo'),
      key(0.7, R({ hips: [8, 0, 0], spine: [18, 0, 0], chest: [16, 0, 0], head: [-12, 0, 0], 'thigh.L': [-42, 0, 6], 'shin.L': [46, 0, 0], 'thigh.R': [26, 0, -4], 'shin.R': [28, 0, 0], 'upperarm.L': [20, 0, 50] }), [0, -0.1, 0.09], 'out'),
      key(1.2, R(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

export const RUKIA_CLIPS: ClipDef[] = [
  cut1, cut2, cut3, kick, thrust, palm, point, rope, shikai, tsukishiro, hakuren, shirafune, bankai, wave,
  ...ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name)),
];
export const RUKIA_CHAIN = ['rk_cut1', 'rk_cut2', 'rk_cut3', 'rk_kick'];
