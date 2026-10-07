// Kyōraku's animation set. A big man's lazy slouch, the hat tipped low, the weight on one hip; the tachi
// held loose in the right hand, the left hand free. Sealed: unhurried one-sword cuts that still land
// hard, the daishō two-tempo strike (the wakizashi first, the tachi behind it), Tsukiyubi's two-finger
// push, Zangerin's sweep, a sip of sake, shedding the kimono or the haori. Shikai: the scimitars crossed
// and pulled apart; a two-blade string (the right on IK arcs, the left keyed by hand); Bushōgoma's spin;
// Takaoni's dive; Kageoni's sink and rise; Irooni's call. Bankai: the blades held out points down, the
// Acts' narration, sheathing both swords and the thread drawn from his fingertips.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

const IDLE: Record<string, E> = {
  hips: [0, -8, 2], spine: [2, 4, 0], chest: [3, 4, 0], neck: [4, 0, 0], head: [-3, -4, 3],
  'thigh.L': [-6, 0, 5], 'shin.L': [6, 0, 0], 'foot.L': [0, 0, 0], 'thigh.R': [4, 0, -5], 'shin.R': [9, 0, 0], 'foot.R': [-10, 0, 0],
  'upperarm.L': [4, 0, 10], 'forearm.L': [-16, 0, 0], 'hand.L': [6, 0, 0],
};
const I = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });

/** the left hand with its scimitar in guard: forearm across, the blade forward and a little up */
const GUARD_L: Record<string, E> = { 'upperarm.L': [-22, 0, 18], 'forearm.L': [-44, 0, 0], 'hand.L': [76, 0, 0] };
const DUAL: Record<string, E> = { ...IDLE, hips: [0, -12, 0], spine: [4, 6, 0], chest: [2, 6, 0], head: [-4, -6, 2], 'thigh.L': [-14, 0, 8], 'shin.L': [16, 0, 0], 'thigh.R': [8, 0, -8], 'shin.R': [16, 0, 0], ...GUARD_L };
const D = (over: Record<string, E> = {}): Record<string, E> => ({ ...DUAL, ...over });

/** the tachi loose in the right hand, point low and forward */
const LOW = { p: [-0.3, -0.42, 0.14] as E, dir: [-0.1, -0.7, 0.7] as E, edge: [0, -0.7, -0.7] as E, pole: [-0.6, -0.3, -0.75] as E };
/** a scimitar in the right hand, in guard */
const LOW_S = { p: [-0.32, -0.3, 0.14] as E, dir: [-0.25, -0.35, 0.9] as E, edge: [0, -0.93, -0.36] as E, pole: [-0.65, -0.4, -0.6] as E };
/** the blade out level at the target (Irooni's call) */
const OUT = { p: [-0.14, 0.06, 0.52] as E, dir: [0.05, 0.05, 1] as E, edge: [0, -1, 0.05] as E, pole: [-0.7, -0.6, 0] as E };
/** held out in front, point down (the Bankai) */
const DOWN = { p: [-0.12, -0.06, 0.46] as E, dir: [0, -1, 0.12] as E, edge: [0, 0.12, 1] as E, pole: [-0.8, -0.3, -0.4] as E };
type Grip = typeof LOW;
const ik = (g: Grip, two = 0) => ({ '@gripR': g.p, '@dirR': g.dir, '@edgeR': g.edge, '@poleR': g.pole, '@ikR': [1, 0, 0] as E, '@twoHand': [two, 0, 0] as E });

export const KYORAKU_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.02,
  run: { spine: [10, 0, 0], chest: [6, 0, 0], head: [-6, 0, 0], 'upperarm.L': [12, 0, 10], 'forearm.L': [-24, 0, 0] },
  sprint: { spine: [18, 0, 0], chest: [10, 0, 0], head: [-14, 0, 0], 'upperarm.L': [40, 0, 12], 'forearm.L': [-30, 0, 0] },
  swingL: 0.55,
  swingR: 0.15,
  freqScale: 0.92,
  grip: {
    idle: LOW,
    walk: LOW,
    run: { p: [-0.3, -0.26, -0.08], dir: [-0.2, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.3, -0.16, -0.18], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.38, -0.1, 0.1], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

/** Shikai (and Bankai): both scimitars up, a loose, wide stance */
export const KATEN_STANCE: StanceDef = {
  idle: DUAL,
  idleHips: -0.06,
  run: { spine: [14, 0, 0], chest: [6, 0, 0], head: [-8, 0, 0], 'upperarm.L': [30, 0, 18], 'forearm.L': [-40, 0, 0], 'hand.L': [20, 0, 0] },
  sprint: { spine: [20, 0, 0], chest: [10, 0, 0], head: [-14, 0, 0], 'upperarm.L': [50, 0, 16], 'forearm.L': [-30, 0, 0], 'hand.L': [10, 0, 0] },
  swingL: 0.1,
  swingR: 0.1,
  freqScale: 0.92,
  grip: {
    idle: LOW_S,
    walk: LOW_S,
    run: { p: [-0.32, -0.24, -0.1], dir: [-0.2, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.32, -0.14, -0.2], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.4, -0.08, 0.1], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

const SH: E = [-0.22, 0.2, 0.04];

/** the sealed cuts: unhurried, wide, heavier than they look */
const cut = (name: string, kind: 0 | 1 | 2): ClipDef => ({
  name, dur: 0.56, fadeIn: 0.05, fadeOut: 0.2, events: { step: 0.07, hit: 0.15, combo: 0.25 },
  keys: mergeKeys(
    swingKeys(kind === 0
      ? { a: [0, 0, 1], b: [1, -0.1, 0], c: SH, r: 0.4, pole: [-0.5, -0.65, -0.55], keys: [[0, -60, 'out'], [0.09, -114, 'out'], [0.16, 30, 'outExpo'], [0.28, 94, 'out'], [0.56, 60, 'inOut']] }
      : kind === 1
        ? { a: [0, 0, 1], b: [-0.85, 0.52, 0], c: [-0.1, 0.12, 0.06], r: 0.4, pole: [-0.3, -0.4, -0.85], keys: [[0, -140, 'out'], [0.09, -120, 'out'], [0.16, 44, 'outExpo'], [0.28, 100, 'out'], [0.56, 70, 'inOut']] }
        : { a: [0, 0, 1], b: [0, -1, 0], c: [-0.1, 0.22, 0.1], r: 0.42, pole: [-0.7, -0.2, -0.65], keys: [[0, 30, 'out'], [0.09, -124, 'out'], [0.16, 6, 'outExpo'], [0.3, 20, 'out'], [0.56, 40, 'inOut']] }),
    [
      key(0, I()),
      key(0.09, I(kind === 1 ? { hips: [2, 16, 0], spine: [6, 12, 0], chest: [6, 16, 0], head: [-6, -8, 3] } : { hips: [2, -22, 0], spine: [6, -10, 0], chest: [4, -14, 0], head: [-6, 16, 3] }), [0, -0.03, 0], 'out'),
      key(0.16, I(kind === 1 ? { hips: [2, -16, 0], spine: [6, -12, 0], chest: [4, -18, 0], head: [-6, 16, 3], 'thigh.L': [-22, 0, 5], 'shin.L': [24, 0, 0] } : { hips: [4, 12, 0], spine: [8, 10, 0], chest: [6, 16, 0], head: [-6, -4, 3], 'thigh.L': [-24, 0, 5], 'shin.L': [26, 0, 0], 'thigh.R': [12, 0, -5] }), [0, -0.06, 0.06], 'outExpo'),
      key(0.56, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
});

/** the sealed finisher: both hands on the tachi, a long diagonal cut down through the target */
const cleave: ClipDef = {
  name: 'ky_cleave', dur: 0.8, fadeIn: 0.06, fadeOut: 0.25, events: { step: 0.12, hit: 0.26 },
  keys: mergeKeys(
    swingKeys({ a: [0, 0, 1], b: [-0.5, -0.86, 0], c: [-0.06, 0.18, 0.08], r: 0.44, pole: [-0.6, -0.3, -0.7], keys: [[0, 20, 'out'], [0.14, -150, 'inOut'], [0.26, 30, 'outExpo'], [0.42, 50, 'out'], [0.8, 40, 'inOut']], twoHand: [0, 1, 1, 1, 0] }),
    [
      key(0, I()),
      key(0.14, I({ hips: [-4, 20, 0], spine: [-4, 10, 0], chest: [-6, 14, 0], head: [-2, -12, 0], 'thigh.L': [-20, 0, 8], 'thigh.R': [10, 0, -8], 'shin.R': [14, 0, 0] }), [0, 0.02, -0.04], 'inOut'),
      key(0.26, I({ hips: [10, -16, 0], spine: [12, -10, 0], chest: [8, -14, 0], head: [-10, 12, 0], 'thigh.L': [-50, 0, 8], 'shin.L': [54, 0, 0], 'thigh.R': [26, 0, -8], 'shin.R': [24, 0, 0] }), [0, -0.16, 0.2], 'outExpo'),
      key(0.8, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** RMB (sealed): the daishō's two tempos — the wakizashi drawn across first, the tachi down behind it */
const daisho: ClipDef = {
  name: 'ky_daisho', dur: 1.0, fadeIn: 0.05, fadeOut: 0.25, events: { draw: 0.05, step: 0.1, hitL: 0.2, hit: 0.4, sheathe: 0.8 },
  keys: mergeKeys(
    swingKeys({ a: [0, 0, 1], b: [0, -1, 0], c: [-0.1, 0.22, 0.1], r: 0.42, pole: [-0.7, -0.2, -0.65], keys: [[0, -40, 'out'], [0.2, -120, 'inOut'], [0.4, 10, 'outExpo'], [0.6, 24, 'out'], [1.0, 40, 'inOut']] }),
    [
      key(0, I()),
      key(0.1, I({ hips: [2, 24, 0], spine: [4, 12, 0], chest: [2, 16, 0], head: [-6, -14, 3], 'upperarm.L': [-30, 60, 30], 'forearm.L': [-60, 0, 0], 'hand.L': [20, 0, 0], 'thigh.L': [-18, 0, 6], 'thigh.R': [10, 0, -6] }), [0, -0.04, 0.02], 'out'),
      key(0.2, I({ hips: [2, -18, 0], spine: [4, -12, 0], chest: [2, -16, 0], head: [-6, 12, 3], 'upperarm.L': [-80, -40, 50], 'forearm.L': [-10, 0, 0], 'hand.L': [10, 0, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [30, 0, 0], 'thigh.R': [16, 0, -6] }), [0, -0.08, 0.1], 'outExpo'),
      key(0.4, I({ hips: [8, 6, 0], spine: [10, 4, 0], chest: [6, 4, 0], head: [-10, 0, 0], 'upperarm.L': [-40, -20, 40], 'forearm.L': [-20, 0, 0], 'hand.L': [10, 0, 0], 'thigh.L': [-44, 0, 6], 'shin.L': [48, 0, 0], 'thigh.R': [24, 0, -6], 'shin.R': [20, 0, 0] }), [0, -0.14, 0.18], 'outExpo'),
      key(0.8, I({ 'upperarm.L': [-10, 0, 20], 'forearm.L': [-40, 0, 0] }), [0, -0.04, 0], 'inOut'),
      key(1.0, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** Q (sealed): Tsukiyubi — two fingers set against the target and a push of reishi */
const finger: ClipDef = {
  name: 'ky_finger', dur: 0.85, fadeIn: 0.06, fadeOut: 0.25, events: { step: 0.1, hit: 0.24 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 0.85, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.12, I({ hips: [2, -16, 0], spine: [4, -10, 0], chest: [2, -12, 0], head: [-4, 8, 3], 'upperarm.L': [-60, -10, 10], 'forearm.L': [-40, 0, 0], 'hand.L': [-10, 0, 0], 'thigh.L': [-22, 0, 6], 'shin.L': [24, 0, 0] }), [0, -0.04, 0.04], 'out'),
      key(0.24, I({ hips: [4, -24, 0], spine: [6, -14, 0], chest: [4, -16, 0], head: [-6, 14, 3], 'upperarm.L': [-86, -8, 4], 'forearm.L': [-4, 0, 0], 'hand.L': [-6, 0, 0], 'thigh.L': [-36, 0, 6], 'shin.L': [38, 0, 0], 'thigh.R': [16, 0, -6] }), [0, -0.08, 0.14], 'outExpo'),
      key(0.55, I({ hips: [4, -24, 0], spine: [6, -14, 0], chest: [4, -16, 0], head: [-6, 14, 3], 'upperarm.L': [-84, -8, 4], 'forearm.L': [-6, 0, 0], 'hand.L': [-6, 0, 0], 'thigh.L': [-34, 0, 6], 'shin.L': [36, 0, 0], 'thigh.R': [16, 0, -6] }), [0, -0.08, 0.14], 'inOut'),
      key(0.85, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** E (sealed): Hadō #78 Zangerin — the tachi raised, then swept round once to loose the ring */
const zangerin: ClipDef = {
  name: 'ky_zangerin', dur: 1.15, fadeIn: 0.06, fadeOut: 0.25, events: { charge: 0.15, fire: 0.52 },
  keys: mergeKeys(
    [
      { t: 0, c: { ...ik(LOW), '@spin': [0, 0, 0] } },
      { t: 0.3, ease: 'inOut', c: { ...ik({ p: [-0.36, 0.1, 0.06], dir: [-0.9, 0.2, 0.4], edge: [0.4, 0, 0.92], pole: [-0.4, -0.8, -0.4] }), '@spin': [-30, 0, 0] } },
      { t: 0.52, ease: 'outExpo', c: { ...ik({ p: [-0.42, 0.06, 0.18], dir: [-0.6, 0.05, 0.8], edge: [0.8, 0, 0.6], pole: [-0.4, -0.8, -0.4] }), '@spin': [330, 0, 0] } },
      { t: 0.75, ease: 'out', c: { ...ik({ p: [-0.42, 0.06, 0.18], dir: [-0.6, 0.05, 0.8], edge: [0.8, 0, 0.6], pole: [-0.4, -0.8, -0.4] }), '@spin': [360, 0, 0] } },
      { t: 1.15, ease: 'inOut', c: { ...ik(LOW), '@spin': [360, 0, 0] } },
    ],
    [
      key(0, I()),
      key(0.3, I({ hips: [0, 30, 0], spine: [-2, 14, 0], chest: [-4, 18, 0], head: [-4, -20, 0], 'upperarm.L': [10, 0, 50], 'forearm.L': [-10, 0, 0], 'thigh.L': [-14, 0, 12], 'thigh.R': [12, 0, -12], 'shin.R': [18, 0, 0] }), [0, -0.1, 0], 'inOut'),
      key(0.52, I({ hips: [4, -10, 0], spine: [6, -6, 0], chest: [2, -8, 0], head: [-6, 6, 0], 'upperarm.L': [0, 0, 70], 'forearm.L': [-6, 0, 0], 'thigh.L': [-22, 0, 12], 'shin.L': [22, 0, 0], 'thigh.R': [14, 0, -12], 'shin.R': [22, 0, 0] }), [0, -0.14, 0], 'outExpo'),
      key(0.75, I({ hips: [4, -10, 0], spine: [6, -6, 0], chest: [2, -8, 0], head: [-6, 6, 0], 'upperarm.L': [0, 0, 60], 'forearm.L': [-10, 0, 0], 'thigh.L': [-22, 0, 12], 'shin.L': [22, 0, 0], 'thigh.R': [14, 0, -12], 'shin.R': [22, 0, 0] }), [0, -0.12, 0], 'out'),
      key(1.15, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** R (sealed): "Nomō!" — a sip from the sake dish, head tipped back */
const sake: ClipDef = {
  name: 'ky_sake', dur: 1.5, fadeIn: 0.1, fadeOut: 0.3, events: { cup: 0.12, sip: 0.6, done: 1.2 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 1.5, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.35, I({ spine: [-2, 4, 0], chest: [-2, 2, 0], neck: [0, 0, 0], head: [-6, 0, 0], 'upperarm.L': [-56, 34, 10], 'forearm.L': [-112, 0, 0], 'hand.L': [20, 0, 0] }), [0, -0.02, 0], 'inOut'),
      key(0.6, I({ spine: [-6, 4, 0], chest: [-6, 2, 0], neck: [-6, 0, 0], head: [-18, 0, 0], 'upperarm.L': [-70, 30, 10], 'forearm.L': [-120, 0, 0], 'hand.L': [-30, 0, 0] }), [0, -0.02, 0], 'inOut'),
      key(1.1, I({ spine: [-4, 4, 0], chest: [-4, 2, 0], neck: [-2, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-50, 30, 10], 'forearm.L': [-100, 0, 0], 'hand.L': [10, 0, 0] }), [0, -0.02, 0], 'inOut'),
      key(1.5, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** G: a layer shed — the left hand takes the collar and flings the garment off toward the target */
const shed = (name: string, grip: Grip, base: (o?: Record<string, E>) => Record<string, E>): ClipDef => ({
  name, dur: 0.9, fadeIn: 0.06, fadeOut: 0.25, events: { grab: 0.16, throw: 0.36 },
  keys: mergeKeys(
    [{ t: 0, c: ik(grip) }, { t: 0.9, c: ik(grip) }],
    [
      key(0, base()),
      key(0.16, base({ hips: [0, 14, 0], spine: [2, 10, 0], chest: [0, 14, 0], head: [-4, -8, 0], 'upperarm.L': [-90, -40, 20], 'forearm.L': [-110, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.03, 0], 'inOut'),
      key(0.36, base({ hips: [2, -18, 0], spine: [4, -14, 0], chest: [2, -18, 0], head: [-6, 12, 0], 'upperarm.L': [-70, 20, 70], 'forearm.L': [-10, 0, 0], 'hand.L': [0, 0, 0], 'thigh.L': [-18, 0, 8], 'thigh.R': [12, 0, -8] }), [0, -0.05, 0.04], 'outExpo'),
      key(0.9, base(), [0, -0.02, 0], 'inOut'),
    ],
  ),
});

/** F (sealed): "Hana kaze midarete…" — both blades crossed before him, then pulled apart */
const release: ClipDef = {
  name: 'ky_release', dur: 1.6, fadeIn: 0.08, fadeOut: 0.3, events: { draw: 0.1, cross: 0.45, form: 1.0 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(LOW) },
      { t: 0.45, ease: 'inOut', c: ik({ p: [-0.04, 0.04, 0.34], dir: [0.55, 0.83, 0.1], edge: [0, -0.12, 1], pole: [-0.8, -0.5, -0.2] }) },
      { t: 0.95, ease: 'inOut', c: ik({ p: [-0.04, 0.04, 0.36], dir: [0.55, 0.83, 0.1], edge: [0, -0.12, 1], pole: [-0.8, -0.5, -0.2] }) },
      { t: 1.15, ease: 'outExpo', c: ik(LOW_S) },
      { t: 1.6, c: ik(LOW_S) },
    ],
    [
      key(0, I()),
      key(0.45, I({ hips: [0, -2, 0], spine: [2, 0, 0], chest: [0, 0, 0], neck: [0, 0, 0], head: [-6, 0, 0], 'upperarm.L': [-74, 24, -6], 'forearm.L': [-50, 0, 0], 'hand.L': [0, 0, 30], 'thigh.L': [-10, 0, 8], 'thigh.R': [8, 0, -8] }), [0, -0.03, 0], 'inOut'),
      key(0.95, I({ hips: [0, -2, 0], spine: [2, 0, 0], chest: [0, 0, 0], neck: [0, 0, 0], head: [-6, 0, 0], 'upperarm.L': [-76, 24, -6], 'forearm.L': [-50, 0, 0], 'hand.L': [0, 0, 30], 'thigh.L': [-10, 0, 8], 'thigh.R': [8, 0, -8] }), [0, -0.03, 0], 'inOut'),
      key(1.15, D({ 'upperarm.L': [-20, 0, 50], 'forearm.L': [-20, 0, 0], 'hand.L': [30, 0, 0] }), [0, -0.08, 0], 'outExpo'),
      key(1.6, D(), [0, -0.06, 0], 'inOut'),
    ],
  ),
};

// ------------------------------------------------------------------ Shikai

/** the two-blade string: the right blade on its arcs, the left keyed by hand at its own tempo */
const dualR = (name: string, kind: 0 | 1): ClipDef => ({
  name, dur: 0.5, fadeIn: 0.04, fadeOut: 0.2, events: { step: 0.06, hit: 0.14, combo: 0.23 },
  keys: mergeKeys(
    swingKeys(kind === 0
      ? { a: [0, 0, 1], b: [-0.85, 0.52, 0], c: [-0.1, 0.12, 0.06], r: 0.42, pole: [-0.3, -0.4, -0.85], keys: [[0, -60, 'out'], [0.08, -122, 'out'], [0.14, 40, 'outExpo'], [0.26, 96, 'out'], [0.5, 40, 'inOut']] }
      : { a: [0, 0, 1], b: [0, -1, 0], c: [-0.1, 0.22, 0.1], r: 0.44, pole: [-0.7, -0.2, -0.65], keys: [[0, -20, 'out'], [0.08, -124, 'out'], [0.14, 6, 'outExpo'], [0.28, 20, 'out'], [0.5, 30, 'inOut']] }),
    [
      key(0, D()),
      key(0.08, D({ hips: [2, -20, 0], spine: [6, -10, 0], chest: [4, -14, 0], head: [-6, 14, 2] }), [0, -0.06, 0], 'out'),
      key(0.14, D({ hips: [4, 14, 0], spine: [8, 10, 0], chest: [6, 16, 0], head: [-6, -6, 2], 'thigh.L': [-28, 0, 8], 'shin.L': [30, 0, 0], 'thigh.R': [14, 0, -8] }), [0, -0.1, 0.06], 'outExpo'),
      key(0.5, D(), [0, -0.06, 0], 'inOut'),
    ],
  ),
});

/** the left blade's cut: a flat sweep right to left across his front while the right holds guard */
const dualL: ClipDef = {
  name: 'ky_dual2', dur: 0.5, fadeIn: 0.04, fadeOut: 0.2, events: { step: 0.06, hitL: 0.14, combo: 0.23 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW_S) }, { t: 0.5, c: ik(LOW_S) }],
    [
      key(0, D()),
      key(0.08, D({ hips: [2, 26, 0], spine: [6, 14, 0], chest: [4, 18, 0], head: [-6, -16, 2], 'upperarm.L': [-60, 70, 30], 'forearm.L': [-50, 0, 0], 'hand.L': [10, 0, -20] }), [0, -0.06, 0], 'out'),
      key(0.14, D({ hips: [4, -18, 0], spine: [8, -12, 0], chest: [6, -16, 0], head: [-6, 12, 2], 'upperarm.L': [-80, -40, 50], 'forearm.L': [-6, 0, 0], 'hand.L': [0, 0, 10], 'thigh.L': [-28, 0, 8], 'shin.L': [30, 0, 0], 'thigh.R': [14, 0, -8] }), [0, -0.1, 0.06], 'outExpo'),
      key(0.26, D({ hips: [4, -22, 0], spine: [8, -14, 0], chest: [6, -18, 0], head: [-6, 14, 2], 'upperarm.L': [-60, -60, 60], 'forearm.L': [-10, 0, 0], 'hand.L': [0, 0, 20], 'thigh.L': [-28, 0, 8], 'shin.L': [30, 0, 0], 'thigh.R': [14, 0, -8] }), [0, -0.1, 0.06], 'out'),
      key(0.5, D(), [0, -0.06, 0], 'inOut'),
    ],
  ),
};

/** both blades raised and brought down crossing: an X through the target */
const cross: ClipDef = {
  name: 'ky_dual3', dur: 0.62, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.08, hit: 0.2, hitL: 0.22, combo: 0.32 },
  keys: mergeKeys(
    swingKeys({ a: [0, 0, 1], b: [0.45, -0.89, 0], c: [-0.06, 0.2, 0.1], r: 0.44, pole: [-0.7, -0.2, -0.65], keys: [[0, -20, 'out'], [0.12, -130, 'inOut'], [0.2, 16, 'outExpo'], [0.34, 30, 'out'], [0.62, 30, 'inOut']] }),
    [
      key(0, D()),
      key(0.12, D({ hips: [-4, 0, 0], spine: [-4, 0, 0], chest: [-6, 0, 0], head: [-2, 0, 0], 'upperarm.L': [-160, -10, 10], 'forearm.L': [-30, 0, 0], 'hand.L': [-20, 0, 0], 'thigh.L': [-14, 0, 8], 'thigh.R': [10, 0, -8] }), [0, 0.02, -0.02], 'inOut'),
      key(0.22, D({ hips: [10, 0, 0], spine: [12, 0, 0], chest: [8, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-50, 30, -10], 'forearm.L': [-10, 0, 0], 'hand.L': [10, 0, 0], 'thigh.L': [-44, 0, 8], 'shin.L': [48, 0, 0], 'thigh.R': [22, 0, -8], 'shin.R': [22, 0, 0] }), [0, -0.16, 0.18], 'outExpo'),
      key(0.62, D(), [0, -0.06, 0], 'inOut'),
    ],
  ),
};

/** the spinning double cut: arms out, both blades round once */
const whirl: ClipDef = {
  name: 'ky_dual4', dur: 0.72, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.06, hit: 0.2, hitL: 0.26, combo: 0.45 },
  keys: mergeKeys(
    [
      { t: 0, c: { ...ik(LOW_S), '@spin': [0, 0, 0] } },
      { t: 0.1, ease: 'out', c: { ...ik({ p: [-0.5, 0.04, 0.08], dir: [-0.98, 0, 0.18], edge: [0.18, 0, 0.98], pole: [-0.2, -1, 0] }), '@spin': [-20, 0, 0] } },
      { t: 0.36, ease: 'inOut', c: { ...ik({ p: [-0.5, 0.04, 0.08], dir: [-0.98, 0, 0.18], edge: [0.18, 0, 0.98], pole: [-0.2, -1, 0] }), '@spin': [360, 0, 0] } },
      { t: 0.72, ease: 'inOut', c: { ...ik(LOW_S), '@spin': [360, 0, 0] } },
    ],
    [
      key(0, D()),
      key(0.1, D({ hips: [0, 0, 0], spine: [2, 0, 0], chest: [0, 0, 0], head: [-4, 0, 0], 'upperarm.L': [0, 0, 84], 'forearm.L': [-6, 0, 0], 'hand.L': [0, 90, 0], 'thigh.L': [-18, 0, 10], 'shin.L': [20, 0, 0], 'thigh.R': [12, 0, -10], 'shin.R': [20, 0, 0] }), [0, -0.1, 0], 'out'),
      key(0.36, D({ hips: [0, 0, 0], spine: [2, 0, 0], chest: [0, 0, 0], head: [-4, 0, 0], 'upperarm.L': [0, 0, 84], 'forearm.L': [-6, 0, 0], 'hand.L': [0, 90, 0], 'thigh.L': [-18, 0, 10], 'shin.L': [20, 0, 0], 'thigh.R': [12, 0, -10], 'shin.R': [20, 0, 0] }), [0, -0.1, 0], 'inOut'),
      key(0.72, D(), [0, -0.06, 0], 'inOut'),
    ],
  ),
};

/** RMB (Shikai): Bushōgoma — the blades pointing opposite ways, he spins twice and the wind flies off */
const top: ClipDef = {
  name: 'ky_spin', dur: 1.0, fadeIn: 0.05, fadeOut: 0.25, events: { spin: 0.14, fire: 0.52 },
  keys: mergeKeys(
    [
      { t: 0, c: { ...ik(LOW_S), '@spin': [0, 0, 0] } },
      { t: 0.14, ease: 'out', c: { ...ik({ p: [-0.46, 0.0, 0.1], dir: [-0.2, -0.05, 0.98], edge: [-0.98, 0, -0.2], pole: [-0.4, -0.9, 0] }), '@spin': [-30, 0, 0] } },
      { t: 0.6, ease: 'inOut', c: { ...ik({ p: [-0.46, 0.0, 0.1], dir: [-0.2, -0.05, 0.98], edge: [-0.98, 0, -0.2], pole: [-0.4, -0.9, 0] }), '@spin': [720, 0, 0] } },
      { t: 1.0, ease: 'inOut', c: { ...ik(LOW_S), '@spin': [720, 0, 0] } },
    ],
    [
      key(0, D()),
      key(0.14, D({ hips: [0, 10, 0], spine: [2, 4, 0], chest: [0, 4, 0], head: [-4, -6, 0], 'upperarm.L': [10, 0, 80], 'forearm.L': [-4, 0, 0], 'hand.L': [0, 180, 0], 'thigh.L': [-14, 0, 12], 'shin.L': [18, 0, 0], 'thigh.R': [10, 0, -12], 'shin.R': [18, 0, 0] }), [0, -0.12, 0], 'out'),
      key(0.6, D({ hips: [0, 10, 0], spine: [2, 4, 0], chest: [0, 4, 0], head: [-4, -6, 0], 'upperarm.L': [10, 0, 80], 'forearm.L': [-4, 0, 0], 'hand.L': [0, 180, 0], 'thigh.L': [-14, 0, 12], 'shin.L': [18, 0, 0], 'thigh.R': [10, 0, -12], 'shin.R': [18, 0, 0] }), [0, -0.12, 0], 'inOut'),
      key(1.0, D(), [0, -0.06, 0], 'inOut'),
    ],
  ),
};

/** Q (Shikai): Takaoni — a crouch and he is gone (the kit puts him high over the target) */
const leap: ClipDef = {
  name: 'ky_takaoni', dur: 0.4, fadeIn: 0.05, fadeOut: 0.1, events: { vanish: 0.2 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW_S) }, { t: 0.4, c: ik(LOW_S) }],
    [
      key(0, D()),
      key(0.18, D({ hips: [16, 0, 0], spine: [10, 0, 0], chest: [6, 0, 0], head: [-14, 0, 0], 'thigh.L': [-60, 0, 10], 'shin.L': [80, 0, 0], 'foot.L': [-16, 0, 0], 'thigh.R': [-40, 0, -10], 'shin.R': [90, 0, 0], 'foot.R': [-30, 0, 0] }), [0, -0.3, 0], 'inOut'),
      key(0.4, D({ hips: [-6, 0, 0], spine: [-4, 0, 0] }), [0, 0, 0], 'out'),
    ],
  ),
};

/** and the dive: both blades raised overhead on the way down, brought down as he lands */
const dive: ClipDef = {
  name: 'ky_dive', dur: 0.95, fadeIn: 0.05, fadeOut: 0.25, events: { hit: 0.48 },
  keys: mergeKeys(
    [
      { t: 0, c: ik({ p: [-0.16, 0.36, -0.04], dir: [0.1, 0.6, -0.8], edge: [0, 0.8, 0.6], pole: [-0.6, -0.2, -0.6] }) },
      { t: 0.42, ease: 'inOut', c: ik({ p: [-0.16, 0.38, -0.06], dir: [0.1, 0.5, -0.86], edge: [0, 0.86, 0.5], pole: [-0.6, -0.2, -0.6] }) },
      { t: 0.5, ease: 'outExpo', c: ik({ p: [-0.14, -0.22, 0.4], dir: [0, -0.7, 0.7], edge: [0, -0.7, -0.7], pole: [-0.7, -0.3, -0.4] }) },
      { t: 0.95, ease: 'inOut', c: ik(LOW_S) },
    ],
    [
      key(0, D({ hips: [-8, 0, 0], spine: [-10, 0, 0], chest: [-8, 0, 0], head: [6, 0, 0], 'upperarm.L': [-170, -10, 10], 'forearm.L': [-20, 0, 0], 'hand.L': [-30, 0, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [60, 0, 0], 'thigh.R': [-10, 0, -6], 'shin.R': [70, 0, 0] })),
      key(0.42, D({ hips: [-8, 0, 0], spine: [-10, 0, 0], chest: [-8, 0, 0], head: [6, 0, 0], 'upperarm.L': [-172, -10, 10], 'forearm.L': [-20, 0, 0], 'hand.L': [-30, 0, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [60, 0, 0], 'thigh.R': [-10, 0, -6], 'shin.R': [70, 0, 0] }), undefined, 'inOut'),
      key(0.5, D({ hips: [14, 0, 0], spine: [16, 0, 0], chest: [10, 0, 0], head: [-12, 0, 0], 'upperarm.L': [-50, 10, 10], 'forearm.L': [-10, 0, 0], 'hand.L': [20, 0, 0], 'thigh.L': [-60, 0, 8], 'shin.L': [70, 0, 0], 'thigh.R': [10, 0, -8], 'shin.R': [80, 0, 0] }), [0, -0.3, 0.1], 'outExpo'),
      key(0.95, D(), [0, -0.06, 0], 'inOut'),
    ],
  ),
};

/** E (Shikai): Kageoni — he sinks into his own shadow… */
const sink: ClipDef = {
  name: 'ky_sink', dur: 0.62, fadeIn: 0.05, fadeOut: 0.1, events: { sink: 0.4 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW_S) }, { t: 0.62, c: ik(LOW_S) }],
    [
      key(0, D()),
      key(0.2, D({ hips: [10, 0, 0], spine: [8, 0, 0], chest: [6, 0, 0], head: [-10, 0, 0], 'thigh.L': [-50, 0, 10], 'shin.L': [70, 0, 0], 'thigh.R': [-30, 0, -10], 'shin.R': [80, 0, 0] }), [0, -0.3, 0], 'inOut'),
      key(0.62, D({ hips: [10, 0, 0], spine: [8, 0, 0], chest: [6, 0, 0], head: [-10, 0, 0], 'thigh.L': [-50, 0, 10], 'shin.L': [70, 0, 0], 'thigh.R': [-30, 0, -10], 'shin.R': [80, 0, 0] }), [0, -2.2, 0], 'in'),
    ],
  ),
};

/** …and comes up out of the target's, both blades driven upward */
const rise: ClipDef = {
  name: 'ky_rise', dur: 0.75, fadeIn: 0.02, fadeOut: 0.25, events: { hit: 0.14 },
  keys: mergeKeys(
    [
      { t: 0, c: ik({ p: [-0.12, -0.1, 0.24], dir: [0, 0.9, 0.44], edge: [0, -0.44, 0.9], pole: [-0.7, -0.5, -0.2] }) },
      { t: 0.14, ease: 'outExpo', c: ik({ p: [-0.1, 0.4, 0.3], dir: [0, 0.94, 0.34], edge: [0, -0.34, 0.94], pole: [-0.7, -0.5, -0.2] }) },
      { t: 0.75, ease: 'inOut', c: ik(LOW_S) },
    ],
    [
      key(0, D({ hips: [6, 0, 0], spine: [4, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-60, 20, 6], 'forearm.L': [-30, 0, 0], 'hand.L': [-50, 0, 0], 'thigh.L': [-40, 0, 8], 'shin.L': [60, 0, 0], 'thigh.R': [-20, 0, -8], 'shin.R': [60, 0, 0] }), [0, -1.6, 0]),
      key(0.14, D({ hips: [-6, 0, 0], spine: [-8, 0, 0], chest: [-6, 0, 0], head: [-16, 0, 0], 'upperarm.L': [-150, 10, 10], 'forearm.L': [-10, 0, 0], 'hand.L': [-30, 0, 0], 'thigh.L': [-10, 0, 6], 'shin.L': [10, 0, 0], 'thigh.R': [6, 0, -6], 'shin.R': [12, 0, 0] }), [0, 0.12, 0], 'outExpo'),
      key(0.75, D(), [0, -0.06, 0], 'inOut'),
    ],
  ),
};

/** R (Shikai): Irooni — the colour called, a blade levelled at the target */
const call: ClipDef = {
  name: 'ky_call', dur: 0.95, fadeIn: 0.06, fadeOut: 0.25, events: { call: 0.32 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW_S) }, { t: 0.3, ease: 'inOut', c: ik(OUT) }, { t: 0.65, c: ik(OUT) }, { t: 0.95, ease: 'inOut', c: ik(LOW_S) }],
    [
      key(0, D()),
      key(0.3, D({ hips: [0, 20, 0], spine: [2, 10, 0], chest: [0, 14, 0], head: [-8, -10, 6], 'thigh.L': [-20, 0, 8], 'thigh.R': [12, 0, -8] }), [0, -0.06, 0], 'inOut'),
      key(0.65, D({ hips: [0, 20, 0], spine: [2, 10, 0], chest: [0, 14, 0], head: [-8, -10, 6], 'thigh.L': [-20, 0, 8], 'thigh.R': [12, 0, -8] }), [0, -0.06, 0], 'inOut'),
      key(0.95, D(), [0, -0.06, 0], 'inOut'),
    ],
  ),
};

/** F (Shikai): "Bankai — Katen Kyōkotsu: Karamatsu Shinjū" — both blades out before him, points down */
const bankai: ClipDef = {
  name: 'ky_bankai', dur: 2.0, fadeIn: 0.1, fadeOut: 0.3, events: { pine: 0.55, form: 1.3 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW_S) }, { t: 0.5, ease: 'inOut', c: ik(DOWN) }, { t: 1.6, c: ik(DOWN) }, { t: 2.0, ease: 'inOut', c: ik(LOW_S) }],
    [
      key(0, D()),
      key(0.5, D({ hips: [0, 0, 0], spine: [2, 0, 0], chest: [0, 0, 0], neck: [2, 0, 0], head: [-2, 0, 0], 'upperarm.L': [-64, -16, 4], 'forearm.L': [-14, 0, 0], 'hand.L': [70, 0, 0], 'thigh.L': [-8, 0, 8], 'thigh.R': [6, 0, -8] }), [0, -0.03, 0], 'inOut'),
      key(1.6, D({ hips: [0, 0, 0], spine: [2, 0, 0], chest: [0, 0, 0], neck: [6, 0, 0], head: [6, 0, 0], 'upperarm.L': [-64, -16, 4], 'forearm.L': [-14, 0, 0], 'hand.L': [70, 0, 0], 'thigh.L': [-8, 0, 8], 'thigh.R': [6, 0, -8] }), [0, -0.03, 0], 'inOut'),
      key(2.0, D(), [0, -0.06, 0], 'inOut'),
    ],
  ),
};

/** an Act: the narration — the blades lowered, the head bowed, then lifted as the curse falls */
const act: ClipDef = {
  name: 'ky_act', dur: 1.4, fadeIn: 0.1, fadeOut: 0.3, events: { act: 0.75 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW_S) }, { t: 0.35, ease: 'inOut', c: ik({ p: [-0.3, -0.42, 0.12], dir: [-0.2, -0.95, 0.2], edge: [0, -0.2, -0.98], pole: [-0.6, -0.3, -0.75] }) }, { t: 1.0, c: ik({ p: [-0.3, -0.42, 0.12], dir: [-0.2, -0.95, 0.2], edge: [0, -0.2, -0.98], pole: [-0.6, -0.3, -0.75] }) }, { t: 1.4, ease: 'inOut', c: ik(LOW_S) }],
    [
      key(0, D()),
      key(0.35, I({ neck: [10, 0, 0], head: [12, 0, 0], 'upperarm.L': [0, 0, 14], 'forearm.L': [-10, 0, 0], 'hand.L': [70, 0, 0] }), [0, -0.02, 0], 'inOut'),
      key(0.75, I({ neck: [-2, 0, 0], head: [-10, 0, 0], 'upperarm.L': [0, 0, 14], 'forearm.L': [-10, 0, 0], 'hand.L': [70, 0, 0] }), [0, -0.02, 0], 'outExpo'),
      key(1.0, I({ neck: [-2, 0, 0], head: [-8, 0, 0], 'upperarm.L': [0, 0, 14], 'forearm.L': [-10, 0, 0], 'hand.L': [70, 0, 0] }), [0, -0.02, 0], 'inOut'),
      key(1.4, D(), [0, -0.06, 0], 'inOut'),
    ],
  ),
};

/** the Final Act begins: both swords slid home at the left hip */
const sheathe: ClipDef = {
  name: 'ky_sheathe', dur: 0.9, fadeIn: 0.06, fadeOut: 0.2, events: { sheathe: 0.45 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW_S) }, { t: 0.4, ease: 'inOut', c: ik({ p: [0.14, -0.4, 0.2], dir: [-0.3, 0.1, 0.95], edge: [0, -1, 0.1], pole: [-0.4, -0.6, -0.6] }) }, { t: 0.9, c: ik({ p: [0.14, -0.4, 0.2], dir: [-0.3, 0.1, 0.95], edge: [0, -1, 0.1], pole: [-0.4, -0.6, -0.6] }) }],
    [
      key(0, D()),
      key(0.4, I({ hips: [0, 10, 0], spine: [4, 6, 0], chest: [4, 8, 0], head: [6, -4, 0], 'upperarm.L': [-20, 30, 10], 'forearm.L': [-70, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.03, 0], 'inOut'),
      key(0.9, I({ hips: [0, 6, 0], spine: [2, 4, 0], chest: [2, 4, 0], head: [-2, -2, 0] }), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** and the thread: two fingers raised at the partner, the hand closed and drawn back — the cut */
const thread: ClipDef = {
  name: 'ky_thread', dur: 2.3, fadeIn: 0.1, fadeOut: 0.3, events: { thread: 0.3, pull: 1.4, cut: 1.75 },
  keys: [
    key(0, I({ 'upperarm.R': [-6, 0, -8], 'forearm.R': [-14, 0, 0], 'hand.R': [0, 0, 0] })),
    key(0.3, I({ hips: [0, -10, 0], spine: [2, -6, 0], chest: [0, -8, 0], head: [-4, 6, 0], 'upperarm.R': [-84, 10, -6], 'forearm.R': [-8, 0, 0], 'hand.R': [-10, 0, 0], 'thigh.L': [-12, 0, 8], 'thigh.R': [8, 0, -8] }), [0, -0.02, 0], 'inOut'),
    key(1.3, I({ hips: [0, -10, 0], spine: [2, -6, 0], chest: [0, -8, 0], head: [-4, 6, 0], 'upperarm.R': [-86, 10, -6], 'forearm.R': [-10, 0, 0], 'hand.R': [-10, 0, 0], 'thigh.L': [-12, 0, 8], 'thigh.R': [8, 0, -8] }), [0, -0.02, 0], 'inOut'),
    key(1.6, I({ hips: [0, 14, 0], spine: [2, 8, 0], chest: [0, 10, 0], head: [-6, -6, 0], 'upperarm.R': [-40, -40, -40], 'forearm.R': [-90, 0, 0], 'hand.R': [10, 0, 0], 'thigh.L': [-12, 0, 8], 'thigh.R': [8, 0, -8] }), [0, -0.04, -0.04], 'outExpo'),
    key(2.3, I({ 'upperarm.R': [-6, 0, -8], 'forearm.R': [-14, 0, 0], 'hand.R': [0, 0, 0] }), [0, -0.02, 0], 'inOut'),
  ],
};

export const KYORAKU_CLIPS: ClipDef[] = [
  cut('ky_cut1', 1), cut('ky_cut2', 0), cut('ky_cut3', 2), cleave, daisho, finger, zangerin, sake,
  shed('ky_shed', LOW, I), shed('ky_shedS', LOW_S, D), release,
  dualR('ky_dual1', 0), dualL, cross, whirl, dualR('ky_dual5', 1), top, leap, dive, sink, rise, call, bankai, act, sheathe, thread,
  ...ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name)),
];
export const KYORAKU_CHAIN = ['ky_cut1', 'ky_cut2', 'ky_cut3', 'ky_cleave'];
export const KATEN_CHAIN = ['ky_dual1', 'ky_dual2', 'ky_dual3', 'ky_dual5', 'ky_dual4'];
