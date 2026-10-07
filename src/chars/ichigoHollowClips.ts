// The Full Hollow's animation set. Hunched and feral: the pelvis tipped forward, the head held up and
// forward between the horns, the left hand clawed and loose, Tensa Zangetsu trailing low behind in the
// right. Claw rakes and wild one-handed cuts; a ground-shattering overhead; the horn Cero (head lowered,
// the beam gathering between the horn tips); the roar; the rise from the dead; the horn snapping.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

const IDLE: Record<string, E> = {
  hips: [10, 0, 0], spine: [14, 0, 0], chest: [8, 0, 0], neck: [-6, 0, 0], head: [-12, 0, 0],
  'thigh.L': [-34, 0, 10], 'shin.L': [52, 0, 0], 'foot.L': [-18, 0, 0],
  'thigh.R': [-20, 0, -12], 'shin.R': [44, 0, 0], 'foot.R': [-24, 0, 0],
  'upperarm.L': [-22, 0, 22], 'forearm.L': [-34, 0, 0], 'hand.L': [14, 0, 0],
};
const I = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });
/** Tensa Zangetsu trailing low behind on the right (chest space; the chest is bent ~32° forward). */
const LOW = { p: [-0.3, -0.24, 0.24] as E, dir: [-0.2, -0.86, -0.47] as E, edge: [0.05, -0.47, 0.88] as E, pole: [-0.6, -0.3, -0.75] as E };
const ik = (g: typeof LOW) => ({ '@gripR': g.p, '@dirR': g.dir, '@edgeR': g.edge, '@poleR': g.pole, '@ikR': [1, 0, 0] as E });

export const VASTO_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.12,
  run: { spine: [20, 0, 0], chest: [10, 0, 0], head: [-26, 0, 0], 'upperarm.L': [10, 0, 22], 'forearm.L': [-40, 0, 0] },
  sprint: { spine: [30, 0, 0], chest: [14, 0, 0], head: [-36, 0, 0], 'upperarm.L': [44, 0, 18], 'forearm.L': [-20, 0, 0] },
  swingL: 0.7,
  swingR: 0.2,
  freqScale: 1.1,
  grip: {
    idle: LOW,
    walk: LOW,
    run: { p: [-0.32, -0.2, -0.04], dir: [-0.25, -0.35, -0.9], edge: [0, -0.93, 0.36], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.3, -0.12, -0.14], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.38, -0.08, 0.12], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

const SH: E = [-0.2, 0.17, 0.02];

/** the left hand rakes across from out wide on the left */
const claw = (name: string, flip: boolean): ClipDef => ({
  name, dur: 0.55, fadeIn: 0.04, fadeOut: 0.2, events: { step: 0.08, hit: 0.17, combo: 0.28 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 0.55, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.1, I({ hips: [10, 16, 0], spine: [12, 12, 0], chest: [6, 22, 0], 'upperarm.L': flip ? [-120, 0, 40] : [-30, 40, 64], 'forearm.L': [-20, 0, 0], 'hand.L': [-10, 0, 0] }), [0, -0.13, -0.02], 'out'),
      key(0.17, I({ hips: [14, -14, 0], spine: [18, -12, 0], chest: [10, -24, 0], head: [-26, 14, 0], 'upperarm.L': flip ? [-40, -20, -10] : [-86, -34, 6], 'forearm.L': [-8, 0, 0], 'hand.L': [6, 0, 0], 'thigh.L': [-50, 0, 10], 'shin.L': [56, 0, 0], 'thigh.R': [6, 0, -12], 'shin.R': [36, 0, 0] }), [0, -0.16, 0.12], 'outExpo'),
      key(0.3, I({ hips: [14, -16, 0], spine: [18, -14, 0], chest: [10, -26, 0], head: [-26, 16, 0], 'upperarm.L': flip ? [-30, -24, -14] : [-80, -40, 4], 'forearm.L': [-12, 0, 0], 'thigh.L': [-48, 0, 10], 'shin.L': [54, 0, 0], 'thigh.R': [4, 0, -12] }), [0, -0.16, 0.12], 'out'),
      key(0.55, I(), [0, -0.12, 0], 'inOut'),
    ],
  ),
});

/** a wild one-handed cut: forehand (right → left) or a rising backhand */
const cut = (name: string, rising: boolean): ClipDef => ({
  name, dur: 0.62, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.08, hit: 0.16, combo: 0.28 },
  keys: mergeKeys(
    swingKeys(rising
      ? { a: [0, 0, 1], b: [-0.85, 0.52, 0], c: [-0.08, 0.1, 0.06], r: 0.4, pole: [-0.3, -0.4, -0.85], keys: [[0, -150, 'out'], [0.09, -125, 'out'], [0.16, 50, 'outExpo'], [0.3, 110, 'out'], [0.62, 70, 'inOut']] }
      : { a: [0, 0, 1], b: [1, -0.2, 0], c: SH, r: 0.4, pole: [-0.5, -0.65, -0.55], keys: [[0, -60, 'out'], [0.1, -140, 'out'], [0.17, 30, 'outExpo'], [0.3, 110, 'out'], [0.62, 70, 'inOut']] }),
    [
      key(0, I()),
      key(0.1, I(rising ? { hips: [12, 24, 0], spine: [14, 20, 6], chest: [12, 28, 8], head: [-24, -22, 0] } : { hips: [12, -26, 0], spine: [12, -18, 0], chest: [6, -28, 4], head: [-22, 22, 0] }), [0, -0.15, -0.02], 'out'),
      key(0.17, I(rising ? { hips: [8, -20, 0], spine: [6, -22, -4], chest: [-4, -30, -10], head: [-16, 24, 0], 'thigh.L': [-46, 0, 10], 'shin.L': [52, 0, 0] } : { hips: [14, 16, 0], spine: [18, 18, 0], chest: [12, 30, -4], head: [-28, -20, 0], 'upperarm.L': [-10, 0, 40], 'thigh.L': [-52, 0, 10], 'shin.L': [58, 0, 0], 'thigh.R': [8, 0, -12] }), [0, -0.17, 0.1], 'outExpo'),
      key(0.3, I(rising ? { hips: [8, -22, 0], spine: [6, -24, -4], chest: [-6, -32, -10], head: [-16, 26, 0] } : { hips: [14, 20, 0], spine: [18, 20, 0], chest: [12, 32, -4], head: [-28, -22, 0], 'upperarm.L': [-6, 0, 44] }), [0, -0.17, 0.12], 'out'),
      key(0.62, I(), [0, -0.12, 0], 'inOut'),
    ],
  ),
});

/** the overhead that shatters the ground (it broke the dome's roof) */
const smash: ClipDef = {
  name: 'vl_smash', dur: 1.0, fadeIn: 0.06, fadeOut: 0.28, events: { step: 0.16, hit: 0.38, fx: 0.38 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0, -1, 0], c: [-0.04, 0.22, 0.12], r: 0.42, pole: [-0.7, -0.2, -0.65],
      keys: [[0, 40, 'out'], [0.26, -150, 'out'], [0.32, -146, 'linear'], [0.38, 10, 'outExpo'], [0.6, 20, 'out'], [1.0, 60, 'inOut']],
    }),
    [
      key(0, I()),
      key(0.16, I({ hips: [4, 0, 0], spine: [-4, 0, 0], chest: [-10, 0, 0], head: [-14, 0, 0], 'thigh.L': [-60, 0, 10], 'shin.L': [90, 0, 0], 'thigh.R': [-50, 0, -12], 'shin.R': [86, 0, 0], 'upperarm.L': [-150, 0, 30], 'forearm.L': [-20, 0, 0] }), [0, -0.18, 0], 'out'),
      key(0.3, I({ hips: [-8, 0, 0], spine: [-12, 0, 0], chest: [-16, 0, 0], head: [-6, 0, 0], 'thigh.L': [-50, 0, 10], 'shin.L': [70, 0, 0], 'thigh.R': [-30, 0, -12], 'shin.R': [60, 0, 0], 'upperarm.L': [-160, 0, 36], 'forearm.L': [-10, 0, 0] }), [0, 0.06, 0], 'out'),
      key(0.38, I({ hips: [20, 0, 0], spine: [26, 0, 0], chest: [18, 0, 0], head: [-30, 0, 0], 'thigh.L': [-60, 0, 10], 'shin.L': [64, 0, 0], 'thigh.R': [20, 0, -12], 'shin.R': [50, 0, 0], 'upperarm.L': [-60, 0, 50], 'forearm.L': [-20, 0, 0] }), [0, -0.24, 0.14], 'outExpo'),
      key(0.6, I({ hips: [20, 0, 0], spine: [26, 0, 0], chest: [18, 0, 0], head: [-30, 0, 0], 'thigh.L': [-58, 0, 10], 'shin.L': [62, 0, 0], 'thigh.R': [18, 0, -12], 'shin.R': [48, 0, 0], 'upperarm.L': [-50, 0, 54] }), [0, -0.24, 0.14], 'out'),
      key(1.0, I(), [0, -0.12, 0], 'inOut'),
    ],
  ),
};

/** the horn Cero: the head lowered and thrust forward, the light gathering between the horn tips */
const cero: ClipDef = {
  name: 'vl_cero', dur: 2.0, fadeIn: 0.1, fadeOut: 0.3, events: { charge: 0.1, fire: 0.85, stop: 1.6 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 2.0, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.35, I({ hips: [16, 0, 0], spine: [20, 0, 0], chest: [12, 0, 0], neck: [6, 0, 0], head: [-8, 0, 0], 'upperarm.L': [10, 0, 50], 'forearm.L': [-40, 0, 0], 'hand.L': [20, 0, 0], 'thigh.L': [-44, 0, 14], 'shin.L': [64, 0, 0], 'thigh.R': [-10, 0, -16], 'shin.R': [50, 0, 0] }), [0, -0.18, -0.04], 'out'),
      key(0.85, I({ hips: [18, 0, 0], spine: [22, 0, 0], chest: [14, 0, 0], neck: [8, 0, 0], head: [-4, 0, 0], 'upperarm.L': [14, 0, 56], 'forearm.L': [-44, 0, 0], 'hand.L': [24, 0, 0], 'thigh.L': [-46, 0, 14], 'shin.L': [66, 0, 0], 'thigh.R': [-6, 0, -16], 'shin.R': [50, 0, 0] }), [0, -0.19, -0.06], 'inOut'),
      key(0.95, I({ hips: [12, 0, 0], spine: [16, 0, 0], chest: [8, 0, 0], neck: [2, 0, 0], head: [-12, 0, 0], 'upperarm.L': [20, 0, 60], 'forearm.L': [-40, 0, 0], 'thigh.L': [-44, 0, 14], 'shin.L': [62, 0, 0], 'thigh.R': [0, 0, -16], 'shin.R': [48, 0, 0] }), [0, -0.18, -0.14], 'outExpo'),
      key(1.6, I({ hips: [12, 0, 0], spine: [16, 0, 0], chest: [8, 0, 0], neck: [2, 0, 0], head: [-12, 0, 0], 'upperarm.L': [20, 0, 60], 'forearm.L': [-40, 0, 0], 'thigh.L': [-44, 0, 14], 'shin.L': [62, 0, 0], 'thigh.R': [0, 0, -16], 'shin.R': [48, 0, 0] }), [0, -0.18, -0.14], 'inOut'),
      key(2.0, I(), [0, -0.12, 0], 'inOut'),
    ],
  ),
};

/** the roar: head thrown back, arms flung out */
const roar: ClipDef = {
  name: 'vl_roar', dur: 1.4, fadeIn: 0.08, fadeOut: 0.3, events: { roar: 0.35 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 1.4, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.3, I({ hips: [-4, 0, 0], spine: [-10, 0, 0], chest: [-16, 0, 0], neck: [-14, 0, 0], head: [-30, 0, 0], 'upperarm.L': [-10, 0, 80], 'forearm.L': [-30, 0, 0], 'hand.L': [-10, 0, 0], 'thigh.L': [-30, 0, 16], 'shin.L': [40, 0, 0], 'thigh.R': [-14, 0, -16], 'shin.R': [36, 0, 0] }), [0, -0.06, -0.04], 'outExpo'),
      key(1.0, I({ hips: [-4, 0, 0], spine: [-12, 0, 0], chest: [-18, 0, 0], neck: [-16, 0, 0], head: [-34, 0, 0], 'upperarm.L': [-12, 0, 84], 'forearm.L': [-34, 0, 0], 'thigh.L': [-30, 0, 16], 'shin.L': [40, 0, 0], 'thigh.R': [-14, 0, -16], 'shin.R': [36, 0, 0] }), [0, -0.06, -0.04], 'inOut'),
      key(1.4, I(), [0, -0.12, 0], 'inOut'),
    ],
  ),
};

/** the rise: slumped on one knee, a twitch of the hand, then it stands and lifts its head */
const rise: ClipDef = {
  name: 'vl_rise', dur: 2.4, fadeIn: 0.05, fadeOut: 0.3, events: { twitch: 0.5, rise: 1.2, roar: 1.9 },
  keys: mergeKeys(
    [{ t: 0, c: { '@gripR': [-0.3, -0.5, 0.3], '@dirR': [-0.4, -0.6, 0.7], '@edgeR': [0, -0.76, -0.65], '@poleR': [-0.6, -0.3, -0.75], '@ikR': [1, 0, 0] } }, { t: 1.2, c: { '@gripR': [-0.3, -0.5, 0.3], '@dirR': [-0.4, -0.6, 0.7], '@edgeR': [0, -0.76, -0.65], '@poleR': [-0.6, -0.3, -0.75], '@ikR': [1, 0, 0] } }, { t: 1.9, ease: 'inOut', c: ik(LOW) }, { t: 2.4, c: ik(LOW) }],
    [
      key(0, I({ hips: [30, 0, 0], spine: [30, 0, 0], chest: [20, 0, 0], neck: [20, 0, 0], head: [30, 0, 0], 'thigh.L': [-80, 0, 10], 'shin.L': [130, 0, 0], 'foot.L': [-20, 0, 0], 'thigh.R': [20, 0, -10], 'shin.R': [100, 0, 0], 'foot.R': [-40, 0, 0], 'upperarm.L': [10, 0, 6], 'forearm.L': [-6, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.5, 0]),
      key(0.45, I({ hips: [30, 0, 0], spine: [30, 0, 0], chest: [20, 0, 0], neck: [20, 0, 0], head: [30, 0, 0], 'thigh.L': [-80, 0, 10], 'shin.L': [130, 0, 0], 'foot.L': [-20, 0, 0], 'thigh.R': [20, 0, -10], 'shin.R': [100, 0, 0], 'foot.R': [-40, 0, 0], 'upperarm.L': [10, 0, 6], 'forearm.L': [-6, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.5, 0], 'linear'),
      key(0.55, I({ hips: [30, 0, 0], spine: [30, 0, 0], chest: [20, 0, 0], neck: [20, 0, 0], head: [28, 0, 0], 'thigh.L': [-80, 0, 10], 'shin.L': [130, 0, 0], 'foot.L': [-20, 0, 0], 'thigh.R': [20, 0, -10], 'shin.R': [100, 0, 0], 'foot.R': [-40, 0, 0], 'upperarm.L': [0, 0, 10], 'forearm.L': [-40, 0, 0], 'hand.L': [30, 0, 0] }), [0, -0.5, 0], 'outExpo'),
      key(1.2, I({ hips: [26, 0, 0], spine: [26, 0, 0], chest: [16, 0, 0], neck: [10, 0, 0], head: [10, 0, 0], 'thigh.L': [-70, 0, 10], 'shin.L': [110, 0, 0], 'foot.L': [-40, 0, 0], 'thigh.R': [0, 0, -10], 'shin.R': [90, 0, 0], 'foot.R': [-60, 0, 0], 'upperarm.L': [-10, 0, 20], 'forearm.L': [-40, 0, 0] }), [0, -0.4, 0], 'inOut'),
      key(1.9, I({ hips: [-2, 0, 0], spine: [-10, 0, 0], chest: [-14, 0, 0], neck: [-12, 0, 0], head: [-30, 0, 0], 'upperarm.L': [-10, 0, 70], 'forearm.L': [-30, 0, 0], 'thigh.L': [-30, 0, 14], 'shin.L': [40, 0, 0], 'thigh.R': [-14, 0, -14], 'shin.R': [36, 0, 0] }), [0, -0.06, 0], 'outExpo'),
      key(2.4, I(), [0, -0.12, 0], 'inOut'),
    ],
  ),
};

/** the horn snaps: the head jerks back, both hands to the face, down on one knee */
const broken: ClipDef = {
  name: 'vl_break', dur: 1.8, fadeIn: 0.04, fadeOut: 0.3, events: { crack: 0.12, kneel: 1.0 },
  keys: [
    key(0, I()),
    key(0.12, I({ hips: [-6, 0, 0], spine: [-14, 0, 0], chest: [-18, 0, 0], neck: [-14, 0, 0], head: [-34, 16, 0], 'upperarm.L': [-150, 20, -20], 'forearm.L': [-110, 0, 0], 'upperarm.R': [-150, -20, 20], 'forearm.R': [-110, 0, 0] }), [0, -0.04, -0.12], 'outExpo'),
    key(0.6, I({ hips: [10, 0, 0], spine: [10, 0, 0], chest: [8, 0, 0], neck: [10, 0, 0], head: [10, -10, 0], 'upperarm.L': [-140, 20, -24], 'forearm.L': [-120, 0, 0], 'upperarm.R': [-140, -20, 24], 'forearm.R': [-120, 0, 0], 'thigh.L': [-40, 0, 10], 'shin.L': [70, 0, 0], 'thigh.R': [-10, 0, -10], 'shin.R': [60, 0, 0] }), [0, -0.2, -0.06], 'inOut'),
    key(1.0, I({ hips: [24, 0, 0], spine: [20, 0, 0], chest: [12, 0, 0], neck: [14, 0, 0], head: [20, 0, 0], 'upperarm.L': [10, 0, 10], 'forearm.L': [-20, 0, 0], 'upperarm.R': [10, 0, -10], 'forearm.R': [-20, 0, 0], 'thigh.L': [-80, 0, 10], 'shin.L': [130, 0, 0], 'foot.L': [-20, 0, 0], 'thigh.R': [20, 0, -10], 'shin.R': [100, 0, 0], 'foot.R': [-40, 0, 0] }), [0, -0.48, 0], 'out'),
    key(1.8, I({ hips: [24, 0, 0], spine: [20, 0, 0], chest: [12, 0, 0], neck: [14, 0, 0], head: [20, 0, 0], 'upperarm.L': [10, 0, 10], 'forearm.L': [-20, 0, 0], 'upperarm.R': [10, 0, -10], 'forearm.R': [-20, 0, 0], 'thigh.L': [-80, 0, 10], 'shin.L': [130, 0, 0], 'foot.L': [-20, 0, 0], 'thigh.R': [20, 0, -10], 'shin.R': [100, 0, 0], 'foot.R': [-40, 0, 0] }), [0, -0.48, 0], 'inOut'),
  ],
};

/** Sonído: low, flat, the sword trailing */
const dash: ClipDef = {
  name: 'dash', dur: 0.3, fadeIn: 0.03, fadeOut: 0.14,
  keys: mergeKeys(
    [{ t: 0, c: { '@gripR': [-0.3, -0.1, -0.24], '@dirR': [-0.25, 0.05, -0.97], '@edgeR': [0, -1, 0], '@poleR': [-0.8, -0.1, 0.5], '@ikR': [1, 0, 0] } }, { t: 0.3, c: { '@gripR': [-0.3, -0.12, -0.22], '@dirR': [-0.25, 0, -0.97], '@edgeR': [0, -1, 0], '@poleR': [-0.8, -0.1, 0.5], '@ikR': [1, 0, 0] } }],
    [
      key(0, { hips: [26, 0, 0], spine: [24, 0, 0], chest: [14, 0, 0], head: [-40, 0, 0], 'thigh.L': [-80, 0, 6], 'shin.L': [80, 0, 0], 'foot.L': [10, 0, 0], 'thigh.R': [40, 0, -6], 'shin.R': [80, 0, 0], 'foot.R': [20, 0, 0], 'upperarm.L': [50, 0, 26], 'forearm.L': [-30, 0, 0] }, [0, -0.2, 0]),
      key(0.3, { hips: [28, 0, 0], spine: [26, 0, 0], chest: [14, 0, 0], head: [-42, 0, 0], 'thigh.L': [-76, 0, 6], 'shin.L': [84, 0, 0], 'thigh.R': [42, 0, -6], 'shin.R': [82, 0, 0], 'upperarm.L': [54, 0, 26], 'forearm.L': [-32, 0, 0] }, [0, -0.21, 0]),
    ],
  ),
};

export const VASTO_CLIPS: ClipDef[] = [
  claw('vl_claw', false), claw('vl_claw2', true), cut('vl_cut', false), cut('vl_cut2', true), smash, cero, roar, rise, broken, dash,
  ...ICHIGO_CLIPS.filter((c) => ['airstep', 'hit_heavy'].includes(c.name)),
];
export const VASTO_CHAIN = ['vl_claw', 'vl_cut', 'vl_claw2', 'vl_cut2'];
