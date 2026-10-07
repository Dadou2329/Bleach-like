// Yamamoto's animation set. Robed, he stands stooped with both hands folded on the head of his cane, eyes
// shut. The cane string is slow and heavy: a sweep, a thrust, an overhead, a turning strike. Onibi is a
// thrust with the blunt cane that punches a hole straight through; Nadegiri a single drawn cut too fast to
// see, then the sword back in the cane; Ikkotsu a punch from the hip; Sōkotsu both fists at once. Stripped,
// he fights bare-chested from a wide, low stance. "Banshō issai kaijin to nase": the cane peels away, the
// sword raised, the sky catches fire. Shikai: big burning cuts; the fire wave; Taimatsu's sweep; Jōkaku Enjō
// (the sword raised, the wall of fire called up round the target); Ennetsu Jigoku (the sword stabbed into
// the ground); Ittō Kasō (a hand clamped on the enemy). Bankai: the old blade held up as every flame flies
// into it; the tap on the ground; the sword driven into the earth for the dead; Tenchi Kaijin's slash.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

const IDLE: Record<string, E> = {
  hips: [4, 0, 0], spine: [14, 0, 0], chest: [8, 0, 0], neck: [-6, 0, 0], head: [-14, 0, 0],
  'thigh.L': [-4, 0, 4], 'shin.L': [8, 0, 0], 'thigh.R': [-2, 0, -4], 'shin.R': [8, 0, 0],
  // the left hand folded over the right on the cane's head
  'upperarm.L': [-46, 0, -14], 'forearm.L': [-52, -20, 0], 'hand.L': [20, 0, 0],
};
/**
 * The cane planted in front, both hands on its head. Chest space, and the chest is bent ~26° forward by the
 * stoop: this puts the hands at the navel a hand's breadth out and the cane's foot on the ground ahead.
 */
const CANE = { p: [0.0, -0.18, 0.42] as E, dir: [0, -0.76, 0.65] as E, edge: [0, 0.65, 0.76] as E, pole: [-0.8, -0.1, -0.5] as E };

export const YAMAMOTO_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.03,
  run: { spine: [10, 0, 0], chest: [6, 0, 0], 'upperarm.L': [-10, 0, 8], 'forearm.L': [-40, 0, 0] },
  sprint: { spine: [16, 0, 0], chest: [8, 0, 0], head: [-10, 0, 0], 'upperarm.L': [40, 0, 12], 'forearm.L': [-20, 0, 0] },
  swingL: 0.3,
  swingR: 0.2,
  freqScale: 0.9,
  grip: {
    idle: CANE,
    walk: { ...CANE, p: [0.0, -0.16, 0.45], dir: [0, -0.7, 0.71], edge: [0, 0.71, 0.7] },
    run: { p: [-0.28, -0.26, -0.06], dir: [-0.2, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.28, -0.16, -0.16], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.34, -0.1, 0.1], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

/** Stripped for battle: upright, wide and low, fists up. */
const BARE: Record<string, E> = {
  hips: [0, -14, 0], spine: [6, -4, 0], chest: [4, -8, 0], head: [-2, 12, 0],
  'thigh.L': [-22, 0, 12], 'shin.L': [26, 0, 0], 'thigh.R': [12, 0, -12], 'shin.R': [22, 0, 0],
  'upperarm.L': [-40, 0, 12], 'forearm.L': [-100, 0, 0], 'hand.L': [0, 0, 0],
  'upperarm.R': [-30, 0, -14], 'forearm.R': [-110, 0, 0], 'hand.R': [0, 0, 0],
};
export const YAMAMOTO_BARE_STANCE: StanceDef = {
  idle: BARE,
  idleHips: -0.08,
  run: { chest: [8, 0, 0], 'upperarm.L': [-20, 0, 12], 'upperarm.R': [-20, 0, -12] },
  sprint: { spine: [16, 0, 0], chest: [10, 0, 0], head: [-10, 0, 0], 'upperarm.L': [40, 0, 14], 'forearm.L': [-30, 0, 0], 'upperarm.R': [40, 0, -14], 'forearm.R': [-30, 0, 0] },
  swingL: 0.6,
  swingR: 0.6,
};

/** Shikai / Bankai: upright now, the sword held in the right hand low and out to the side, eyes open. */
const SWORD_IDLE: Record<string, E> = { ...IDLE, hips: [0, -8, 0], spine: [4, 0, 0], chest: [0, -4, 0], head: [-4, 6, 0], 'upperarm.L': [8, 0, 10], 'forearm.L': [-20, 0, 0], 'hand.L': [6, 0, 0] };
const LOW = { p: [-0.3, -0.36, 0.16] as E, dir: [-0.25, -0.6, 0.76] as E, edge: [0.12, -0.76, -0.62] as E, pole: [-0.6, -0.3, -0.75] as E };
export const RYUJIN_STANCE: StanceDef = {
  idle: SWORD_IDLE,
  idleHips: -0.02,
  run: { chest: [6, 0, 0], 'upperarm.L': [-4, 0, 8] },
  sprint: { spine: [12, 0, 0], chest: [6, 0, 0], head: [-8, 0, 0], 'upperarm.L': [36, 0, 12], 'forearm.L': [-24, 0, 0] },
  swingL: 0.4,
  swingR: 0.2,
  grip: {
    idle: LOW,
    walk: { ...LOW, p: [-0.3, -0.33, 0.14] },
    run: { p: [-0.28, -0.26, -0.06], dir: [-0.22, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.28, -0.16, -0.16], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.36, -0.1, 0.1], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

const R = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });
const Bk = (over: Record<string, E> = {}): Record<string, E> => ({ ...BARE, ...over });
const S = (over: Record<string, E> = {}): Record<string, E> => ({ ...SWORD_IDLE, ...over });
const SH: E = [-0.2, 0.16, 0.04];
const ik = (g: typeof CANE) => ({ '@gripR': g.p, '@dirR': g.dir, '@edgeR': g.edge, '@poleR': g.pole, '@ikR': [1, 0, 0] as E });
const swing = (name: string, dur: number, ev: Record<string, number>, sw: Parameters<typeof swingKeys>[0], body: KeyDef[]): ClipDef => ({ name, dur, fadeIn: 0.05, fadeOut: 0.22, events: ev, keys: mergeKeys(swingKeys(sw), body) });

// ------------------------------------------------------------------ the cane (robed)

const caneSweep = swing('ym_sweep', 0.72, { step: 0.12, hit: 0.22, combo: 0.32 },
  { a: [0, 0, 1], b: [1, -0.15, 0], c: SH, r: 0.38, pole: [-0.5, -0.6, -0.55], keys: [[0, -70, 'out'], [0.12, -120, 'out'], [0.22, 40, 'outExpo'], [0.38, 85, 'out'], [0.72, 60, 'inOut']] },
  [key(0, R()), key(0.12, R({ hips: [4, -18, 0], spine: [12, -10, 0], chest: [6, -14, 0], 'upperarm.L': [10, 0, 14], 'forearm.L': [-30, 0, 0] }), [0, -0.04, 0], 'out'), key(0.22, R({ hips: [4, 14, 0], spine: [10, 10, 0], chest: [6, 16, 0], 'upperarm.L': [10, 0, 14], 'forearm.L': [-30, 0, 0], 'thigh.L': [-18, 0, 6], 'shin.L': [18, 0, 0] }), [0, -0.06, 0.06], 'outExpo'), key(0.72, R(), [0, -0.03, 0], 'inOut')]);

const caneThrust: ClipDef = {
  name: 'ym_thrust', dur: 0.66, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.1, hit: 0.18, combo: 0.3 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(CANE) },
      { t: 0.1, ease: 'out', c: { '@gripR': [-0.24, -0.04, -0.12], '@dirR': [0.05, 0, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.8, -0.3, -0.3], '@ikR': [1, 0, 0] } },
      { t: 0.18, ease: 'outExpo', c: { '@gripR': [-0.04, 0.02, 0.54], '@dirR': [0.05, -0.04, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.7, -0.5, -0.2], '@ikR': [1, 0, 0] } },
      { t: 0.34, ease: 'out', c: { '@gripR': [-0.05, 0.02, 0.52], '@dirR': [0.05, -0.05, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.7, -0.5, -0.2], '@ikR': [1, 0, 0] } },
      { t: 0.66, ease: 'inOut', c: ik(CANE) },
    ],
    [key(0, R()), key(0.1, R({ hips: [4, -12, 0], chest: [6, -12, 0], 'upperarm.L': [10, 0, 14], 'forearm.L': [-30, 0, 0] }), [0, -0.03, -0.03], 'out'), key(0.18, R({ hips: [8, 12, 0], spine: [14, 8, 0], chest: [8, 12, 0], 'upperarm.L': [10, 0, 14], 'forearm.L': [-30, 0, 0], 'thigh.L': [-40, 0, 4], 'shin.L': [44, 0, 0], 'thigh.R': [20, 0, -4], 'shin.R': [14, 0, 0] }), [0, -0.08, 0.16], 'outExpo'), key(0.66, R(), [0, -0.03, 0], 'inOut')],
  ),
};

const caneOver = swing('ym_over', 0.78, { step: 0.14, hit: 0.26, combo: 0.36 },
  { a: [0, 1, 0.15], b: [0, -0.2, 1], c: [-0.08, 0.2, 0.06], r: 0.42, pole: [-0.7, -0.3, -0.6], keys: [[0, -40, 'out'], [0.16, -20, 'inOut'], [0.26, 120, 'outExpo'], [0.42, 150, 'out'], [0.78, 110, 'inOut']] },
  [key(0, R()), key(0.16, R({ spine: [-2, 0, 0], chest: [-8, -6, 0], 'upperarm.L': [10, 0, 14], 'forearm.L': [-30, 0, 0] }), [0, 0.01, -0.03], 'inOut'), key(0.26, R({ spine: [22, 0, 0], chest: [14, 6, 0], 'upperarm.L': [10, 0, 14], 'forearm.L': [-30, 0, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [34, 0, 0] }), [0, -0.1, 0.1], 'outExpo'), key(0.78, R(), [0, -0.03, 0], 'inOut')]);

const caneSpin: ClipDef = {
  name: 'ym_spin', dur: 0.9, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.14, hit: 0.3 },
  keys: mergeKeys(
    swingKeys({ a: [0, 0, 1], b: [1, -0.1, 0], c: SH, r: 0.44, pole: [-0.5, -0.6, -0.55], keys: [[0, -60, 'out'], [0.16, -140, 'inOut'], [0.3, 60, 'outExpo'], [0.5, 100, 'out'], [0.9, 60, 'inOut']] }),
    [key(0, R()), key(0.16, R({ hips: [4, 60, 0], spine: [10, 20, 0], 'upperarm.L': [10, 0, 30], 'forearm.L': [-20, 0, 0] }), [0, -0.06, 0], 'in'), key(0.3, R({ hips: [4, -120, 0], spine: [10, -20, 0], chest: [6, -14, 0], 'upperarm.L': [10, 0, 40], 'forearm.L': [-20, 0, 0], 'thigh.L': [-20, 0, 10], 'shin.L': [20, 0, 0] }), [0, -0.06, 0.04], 'outExpo'), key(0.6, R({ hips: [4, -300, 0] }), [0, -0.04, 0], 'inOut'), key(0.9, R({ hips: [4, -360, 0] }), [0, -0.03, 0], 'out')],
  ),
};

/** Onibi: the blunt cane thrust that punches a hole clean through. */
const onibi: ClipDef = {
  name: 'ym_onibi', dur: 1.0, fadeIn: 0.05, fadeOut: 0.25, events: { charge: 0.08, step: 0.32, hit: 0.4 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(CANE) },
      { t: 0.3, ease: 'inOut', c: { '@gripR': [-0.28, -0.06, -0.22], '@dirR': [0.05, 0, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.8, -0.3, -0.3], '@ikR': [1, 0, 0] } },
      { t: 0.4, ease: 'outExpo', c: { '@gripR': [-0.02, 0.02, 0.62], '@dirR': [0.04, -0.02, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.7, -0.5, -0.2], '@ikR': [1, 0, 0] } },
      { t: 0.7, ease: 'out', c: { '@gripR': [-0.03, 0.02, 0.6], '@dirR': [0.04, -0.03, 1], '@edgeR': [0, -1, 0], '@poleR': [-0.7, -0.5, -0.2], '@ikR': [1, 0, 0] } },
      { t: 1.0, ease: 'inOut', c: ik(CANE) },
    ],
    [key(0, R()), key(0.3, R({ hips: [2, -20, 0], spine: [10, -10, 0], chest: [4, -16, 0], 'upperarm.L': [-60, 0, 30], 'forearm.L': [-40, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [20, 0, 0] }), [0, -0.06, -0.06], 'inOut'), key(0.4, R({ hips: [8, 16, 0], spine: [16, 10, 0], chest: [8, 16, 0], head: [-18, -10, 0], 'upperarm.L': [10, 0, 30], 'forearm.L': [-20, 0, 0], 'thigh.L': [-52, 0, 6], 'shin.L': [56, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [16, 0, 0] }), [0, -0.12, 0.24], 'outExpo'), key(0.7, R({ hips: [8, 16, 0], spine: [16, 10, 0], chest: [8, 16, 0], head: [-18, -10, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [54, 0, 0], 'thigh.R': [28, 0, -6] }), [0, -0.12, 0.22], 'inOut'), key(1.0, R(), [0, -0.03, 0], 'inOut')],
  ),
};

/** Nadegiri: the sword drawn from the cane in a single flash, the cut, and it is back in the cane. */
const nadegiri = swing('ym_nadegiri', 1.2, { step: 0.18, hit: 0.26, sheathe: 0.8 },
  { a: [0, 0, 1], b: [1, 0.45, 0], c: SH, r: 0.46, pole: [-0.5, -0.6, -0.55], keys: [[0, -80, 'out'], [0.18, -130, 'inOut'], [0.26, 70, 'outExpo'], [0.7, 80, 'inOut'], [1.2, 60, 'inOut']] },
  [key(0, R()), key(0.18, R({ hips: [4, -20, 0], spine: [16, -12, 0], chest: [8, -18, 0], 'upperarm.L': [-50, 0, -10], 'forearm.L': [-60, 0, 0] }), [0, -0.08, 0], 'inOut'), key(0.26, R({ hips: [8, 20, 0], spine: [14, 14, 0], chest: [8, 20, 0], 'thigh.L': [-44, 0, 6], 'shin.L': [48, 0, 0], 'thigh.R': [26, 0, -6], 'shin.R': [14, 0, 0], 'upperarm.L': [10, 0, 30], 'forearm.L': [-20, 0, 0] }), [0, -0.12, 0.3], 'outExpo'), key(0.8, R({ hips: [8, 20, 0], spine: [14, 14, 0], chest: [8, 20, 0], 'thigh.L': [-44, 0, 6], 'shin.L': [48, 0, 0], 'thigh.R': [26, 0, -6] }), [0, -0.12, 0.3], 'inOut'), key(1.2, R(), [0, -0.03, 0], 'inOut')]);

// ------------------------------------------------------------------ the fists (robed or stripped)

/** Ikkotsu: one punch from the hip, the left. */
const ikkotsu = (name: string, base: (o?: Record<string, E>) => Record<string, E>): ClipDef => ({
  name, dur: 0.9, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.28, hit: 0.36 },
  keys: [
    key(0, base()),
    key(0.28, base({ hips: [0, 24, 0], spine: [6, 14, 0], chest: [4, 20, 0], 'upperarm.L': [20, 0, 20], 'forearm.L': [-120, 0, 0], 'thigh.L': [-10, 0, 8], 'shin.L': [20, 0, 0], 'thigh.R': [14, 0, -10], 'shin.R': [30, 0, 0] }), [0, -0.1, -0.06], 'inOut'),
    key(0.36, base({ hips: [0, -22, 0], spine: [10, -14, 0], chest: [6, -22, 0], head: [-6, 16, 0], 'upperarm.L': [-90, 0, -6], 'forearm.L': [-4, 0, 0], 'hand.L': [0, 0, 0], 'thigh.L': [-56, 0, 6], 'shin.L': [58, 0, 0], 'thigh.R': [32, 0, -6], 'shin.R': [16, 0, 0] }), [0, -0.14, 0.3], 'outExpo'),
    key(0.6, base({ hips: [0, -20, 0], spine: [10, -12, 0], chest: [6, -20, 0], 'upperarm.L': [-86, 0, -6], 'forearm.L': [-8, 0, 0], 'thigh.L': [-52, 0, 6], 'shin.L': [56, 0, 0], 'thigh.R': [30, 0, -6] }), [0, -0.13, 0.28], 'inOut'),
    key(0.9, base(), [0, -0.04, 0], 'inOut'),
  ],
});

/** Sōkotsu: both fists driven in together. */
const sokotsu: ClipDef = {
  name: 'ym_sokotsu', dur: 1.1, fadeIn: 0.05, fadeOut: 0.25, events: { charge: 0.06, step: 0.36, hit: 0.44 },
  keys: [
    key(0, Bk()),
    key(0.36, Bk({ hips: [0, 0, 0], spine: [-4, 0, 0], chest: [-8, 0, 0], 'upperarm.L': [30, 0, 30], 'forearm.L': [-120, 0, 0], 'upperarm.R': [30, 0, -30], 'forearm.R': [-120, 0, 0], 'thigh.L': [-14, 0, 10], 'shin.L': [30, 0, 0], 'thigh.R': [10, 0, -10], 'shin.R': [30, 0, 0] }), [0, -0.12, -0.08], 'inOut'),
    key(0.44, Bk({ hips: [0, 0, 0], spine: [14, 0, 0], chest: [8, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-88, 0, -4], 'forearm.L': [-4, 0, 0], 'upperarm.R': [-88, 0, 4], 'forearm.R': [-4, 0, 0], 'thigh.L': [-56, 0, 6], 'shin.L': [60, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [18, 0, 0] }), [0, -0.16, 0.32], 'outExpo'),
    key(0.75, Bk({ hips: [0, 0, 0], spine: [12, 0, 0], chest: [8, 0, 0], 'upperarm.L': [-84, 0, -4], 'forearm.L': [-8, 0, 0], 'upperarm.R': [-84, 0, 4], 'forearm.R': [-8, 0, 0], 'thigh.L': [-52, 0, 6], 'shin.L': [56, 0, 0], 'thigh.R': [28, 0, -6] }), [0, -0.15, 0.3], 'inOut'),
    key(1.1, Bk(), [0, -0.08, 0], 'inOut'),
  ],
};

/** Stripped jab / hook / knee string. */
const bareJab: ClipDef = {
  name: 'ym_jab', dur: 0.45, fadeIn: 0.04, fadeOut: 0.18, events: { step: 0.05, hit: 0.13, combo: 0.2 },
  keys: [key(0, Bk()), key(0.07, Bk({ 'upperarm.L': [-48, 0, 14], 'forearm.L': [-112, 0, 0] }), [0, -0.08, 0], 'out'), key(0.13, Bk({ chest: [6, -26, 0], spine: [4, -12, 0], head: [2, 18, 0], 'upperarm.L': [-90, 0, -6], 'forearm.L': [-4, 0, 0] }), [0, -0.1, 0.1], 'outExpo'), key(0.45, Bk(), [0, -0.08, 0], 'inOut')],
};
const bareHook: ClipDef = {
  name: 'ym_hook', dur: 0.55, fadeIn: 0.04, fadeOut: 0.2, events: { step: 0.1, hit: 0.2, combo: 0.28 },
  keys: [key(0, Bk()), key(0.1, Bk({ chest: [2, -26, 0], spine: [2, -12, 0], 'upperarm.R': [-40, 0, -64], 'forearm.R': [-96, 0, 0] }), [0, -0.1, -0.02], 'out'), key(0.2, Bk({ chest: [8, 38, 0], spine: [6, 16, 0], head: [4, -16, 0], 'upperarm.R': [-34, 0, -78], 'forearm.R': [-92, 0, 0], 'upperarm.L': [-20, 0, 14], 'forearm.L': [-120, 0, 0] }), [0, -0.12, 0.08], 'outExpo'), key(0.55, Bk(), [0, -0.08, 0], 'inOut')],
};
const bareKnee: ClipDef = {
  name: 'ym_knee', dur: 0.6, fadeIn: 0.04, fadeOut: 0.2, events: { step: 0.12, hit: 0.24, combo: 0.34 },
  keys: [key(0, Bk()), key(0.12, Bk({ 'thigh.R': [12, 0, 0], 'shin.R': [44, 0, 0], 'upperarm.L': [-70, 0, -10], 'forearm.L': [-40, 0, 0], 'upperarm.R': [-70, 0, 10], 'forearm.R': [-40, 0, 0] }), [0, -0.12, 0.02], 'out'), key(0.24, Bk({ spine: [-6, 0, 0], chest: [-8, 0, 0], head: [12, 0, 0], 'thigh.R': [-118, 0, 0], 'shin.R': [128, 0, 0], 'thigh.L': [6, 0, 4], 'shin.L': [10, 0, 0], 'upperarm.L': [-48, 0, 22], 'forearm.L': [-28, 0, 0], 'upperarm.R': [-48, 0, -22], 'forearm.R': [-28, 0, 0] }), [0, 0.08, 0.1], 'outExpo'), key(0.6, Bk(), [0, -0.08, 0], 'inOut')],
};

/** G: the haori and the top half of the shihakushō thrown off. */
const strip: ClipDef = {
  name: 'ym_strip', dur: 1.1, fadeIn: 0.08, fadeOut: 0.25, events: { throw: 0.5 },
  keys: [
    key(0, R()),
    key(0.4, R({ spine: [4, 0, 0], chest: [-4, 0, 0], head: [-6, 0, 0], 'upperarm.L': [-150, 0, -20], 'forearm.L': [-40, 0, 0], 'upperarm.R': [-150, 0, 20], 'forearm.R': [-40, 0, 0] }), [0, 0, 0], 'inOut'),
    key(0.6, R({ spine: [0, 0, 0], chest: [-8, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-30, 0, 70], 'forearm.L': [-20, 0, 0], 'upperarm.R': [-30, 0, -70], 'forearm.R': [-20, 0, 0] }), [0, -0.02, 0], 'outExpo'),
    key(1.1, Bk(), [0, -0.08, 0], 'inOut'),
  ],
};

// ------------------------------------------------------------------ release

/** "Banshō issai kaijin to nase, Ryūjin Jakka": the cane peels away, the sword raised high, the fire bursts. */
const release: ClipDef = {
  name: 'ym_release', dur: 2.0, fadeIn: 0.1, fadeOut: 0.3, events: { peel: 0.4, raise: 0.8, burst: 1.1 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(CANE) },
      { t: 0.6, ease: 'inOut', c: { '@gripR': [-0.12, -0.1, 0.3], '@dirR': [0.05, -0.3, 0.95], '@edgeR': [0, -0.95, -0.3], '@poleR': [-0.8, -0.4, -0.2], '@ikR': [1, 0, 0] } },
      { t: 1.0, ease: 'outExpo', c: { '@gripR': [-0.1, 0.42, 0.18], '@dirR': [0.05, 0.98, 0.1], '@edgeR': [0, 0.1, -0.99], '@poleR': [-0.7, -0.5, -0.3], '@ikR': [1, 0, 0] } },
      { t: 1.6, ease: 'inOut', c: { '@gripR': [-0.1, 0.44, 0.18], '@dirR': [0.05, 0.98, 0.1], '@edgeR': [0, 0.1, -0.99], '@poleR': [-0.7, -0.5, -0.3], '@ikR': [1, 0, 0] } },
      { t: 2.0, ease: 'inOut', c: ik(LOW) },
    ],
    [key(0, R()), key(0.6, R({ spine: [6, 0, 0], chest: [0, 0, 0], head: [-4, 0, 0], 'upperarm.L': [-60, 0, -10], 'forearm.L': [-60, 0, 0] }), [0, -0.02, 0], 'inOut'), key(1.0, S({ spine: [-4, 0, 0], chest: [-8, 0, 0], head: [-12, 0, 0], 'upperarm.L': [-20, 0, 40], 'forearm.L': [-20, 0, 0] }), [0, 0.01, 0], 'outExpo'), key(2.0, S(), [0, -0.02, 0], 'inOut')],
  ),
};

// ------------------------------------------------------------------ Ryūjin Jakka

const k1 = swing('ym_k1', 0.62, { step: 0.08, hit: 0.16, combo: 0.26 },
  { a: [0, 0, 1], b: [1, -0.1, 0], c: SH, r: 0.44, pole: [-0.5, -0.65, -0.55], keys: [[0, -60, 'out'], [0.09, -115, 'out'], [0.16, 40, 'outExpo'], [0.3, 90, 'out'], [0.62, 60, 'inOut']] },
  [key(0, S()), key(0.09, S({ hips: [0, -18, 0], chest: [0, -16, 0] }), [0, -0.03, 0], 'out'), key(0.16, S({ hips: [0, 12, 0], spine: [4, 8, 0], chest: [2, 18, 0], 'thigh.L': [-24, 0, 6], 'shin.L': [22, 0, 0] }), [0, -0.06, 0.08], 'outExpo'), key(0.62, S(), [0, -0.02, 0], 'inOut')]);
const k2 = swing('ym_k2', 0.62, { step: 0.08, hit: 0.16, combo: 0.26 },
  { a: [0, 0, 1], b: [-0.75, 0.65, 0], c: [-0.08, 0.08, 0.06], r: 0.44, pole: [-0.3, -0.4, -0.85], keys: [[0, -150, 'out'], [0.09, -128, 'out'], [0.16, 48, 'outExpo'], [0.3, 96, 'out'], [0.62, 60, 'inOut']] },
  [key(0, S({ chest: [0, 10, 0] })), key(0.09, S({ hips: [0, 14, 0], chest: [4, 18, 4] }), [0, -0.05, 0], 'out'), key(0.16, S({ hips: [0, -18, 0], chest: [-6, -18, -4], head: [-4, 12, 0] }), [0, -0.03, 0.06], 'outExpo'), key(0.62, S(), [0, -0.02, 0], 'inOut')]);
const k3 = swing('ym_k3', 0.75, { step: 0.12, hit: 0.22, combo: 0.32 },
  { a: [0, 1, 0.15], b: [0, -0.2, 1], c: [-0.08, 0.2, 0.06], r: 0.44, pole: [-0.7, -0.3, -0.6], keys: [[0, -40, 'out'], [0.14, -20, 'inOut'], [0.22, 120, 'outExpo'], [0.4, 150, 'out'], [0.75, 110, 'inOut']] },
  [key(0, S()), key(0.14, S({ spine: [-6, 0, 0], chest: [-10, -6, 0] }), [0, 0.01, -0.03], 'inOut'), key(0.22, S({ spine: [18, 0, 0], chest: [12, 6, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [34, 0, 0] }), [0, -0.1, 0.12], 'outExpo'), key(0.75, S(), [0, -0.02, 0], 'inOut')]);
/** a turning vertical slash that halves a building */
const k4 = swing('ym_k4', 0.95, { step: 0.14, hit: 0.3 },
  { a: [0, 1, 0], b: [0, 0, 1], c: [-0.06, 0.16, 0.08], r: 0.48, pole: [-0.7, -0.3, -0.6], keys: [[0, -30, 'out'], [0.18, -10, 'inOut'], [0.3, 160, 'outExpo'], [0.5, 190, 'out'], [0.95, 120, 'inOut']] },
  [key(0, S()), key(0.18, S({ hips: [0, 40, 0], spine: [-8, 10, 0], chest: [-10, 0, 0] }), [0, 0.02, 0], 'inOut'), key(0.3, S({ hips: [0, -20, 0], spine: [24, -8, 0], chest: [14, 0, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [46, 0, 0] }), [0, -0.14, 0.14], 'outExpo'), key(0.95, S(), [0, -0.02, 0], 'inOut')]);

/** the fire wave thrown off a wide sweep (also Tenchi Kaijin in the Bankai, slower) */
const wave = swing('ym_wave', 1.0, { step: 0.18, hit: 0.3 },
  { a: [0, 0, 1], b: [1, 0.1, 0], c: SH, r: 0.5, pole: [-0.5, -0.6, -0.55], keys: [[0, -60, 'out'], [0.2, -150, 'inOut'], [0.3, 60, 'outExpo'], [0.55, 105, 'out'], [1.0, 60, 'inOut']] },
  [key(0, S()), key(0.2, S({ hips: [0, -34, 0], spine: [4, -16, 0], chest: [0, -24, 0], head: [0, 22, 0], 'upperarm.L': [-40, 0, 40] }), [0, -0.08, -0.04], 'inOut'), key(0.3, S({ hips: [0, 20, 0], spine: [6, 14, 0], chest: [4, 26, 0], head: [0, -18, 0], 'thigh.L': [-44, 0, 8], 'shin.L': [48, 0, 0], 'upperarm.L': [10, 0, 40] }), [0, -0.14, 0.14], 'outExpo'), key(1.0, S(), [0, -0.02, 0], 'inOut')]);

/** Taimatsu: one slow wave of the sword across the front, the inferno blooming off it. */
const taimatsu = swing('ym_taimatsu', 1.3, { step: 0.1, fire: 0.42 },
  { a: [0, 0, 1], b: [1, 0.25, 0], c: SH, r: 0.5, pole: [-0.5, -0.6, -0.55], keys: [[0, -60, 'out'], [0.2, -110, 'inOut'], [0.6, 80, 'inOut'], [0.9, 95, 'out'], [1.3, 60, 'inOut']] },
  [key(0, S()), key(0.2, S({ hips: [0, -24, 0], chest: [0, -20, 0] }), [0, -0.04, 0], 'inOut'), key(0.6, S({ hips: [0, 20, 0], chest: [0, 22, 0], 'thigh.L': [-20, 0, 8], 'shin.L': [20, 0, 0] }), [0, -0.06, 0.06], 'inOut'), key(1.3, S(), [0, -0.02, 0], 'inOut')]);

/** Jōkaku Enjō: the sword raised upright before him, the wall of fire called up round the target. */
const jokaku: ClipDef = {
  name: 'ym_jokaku', dur: 1.5, fadeIn: 0.08, fadeOut: 0.3, events: { raise: 0.3, call: 0.6 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(LOW) },
      { t: 0.4, ease: 'out', c: { '@gripR': [-0.08, 0.1, 0.36], '@dirR': [0.04, 0.98, 0.18], '@edgeR': [0, 0.18, -0.98], '@poleR': [-0.7, -0.5, -0.3], '@ikR': [1, 0, 0] } },
      { t: 1.1, ease: 'inOut', c: { '@gripR': [-0.08, 0.12, 0.36], '@dirR': [0.04, 0.98, 0.18], '@edgeR': [0, 0.18, -0.98], '@poleR': [-0.7, -0.5, -0.3], '@ikR': [1, 0, 0] } },
      { t: 1.5, ease: 'inOut', c: ik(LOW) },
    ],
    [key(0, S()), key(0.4, S({ head: [-4, 0, 0], 'upperarm.L': [-80, 0, -10], 'forearm.L': [-30, 0, 0], 'hand.L': [-40, 0, 0] }), [0, -0.02, 0], 'out'), key(1.1, S({ head: [-4, 0, 0], 'upperarm.L': [-84, 0, -10], 'forearm.L': [-28, 0, 0], 'hand.L': [-40, 0, 0] }), [0, -0.02, 0], 'inOut'), key(1.5, S(), [0, -0.02, 0], 'inOut')],
  ),
};

/** Ennetsu Jigoku (and the Bankai's Minami): the sword driven point-first into the ground. */
const plant = (name: string, ev: Record<string, number>, dur: number): ClipDef => ({
  name, dur, fadeIn: 0.08, fadeOut: 0.3, events: ev,
  keys: mergeKeys(
    [
      { t: 0, c: ik(LOW) },
      { t: 0.25, ease: 'out', c: { '@gripR': [-0.04, 0.3, 0.3], '@dirR': [0.04, -0.6, 0.8], '@edgeR': [0, -0.8, -0.6], '@poleR': [-0.8, -0.2, -0.3], '@ikR': [1, 0, 0] } },
      { t: 0.4, ease: 'outExpo', c: { '@gripR': [-0.02, -0.36, 0.42], '@dirR': [0.02, -0.98, 0.18], '@edgeR': [0, -0.18, -0.98], '@poleR': [-0.8, -0.3, -0.2], '@ikR': [1, 0, 0] } },
      { t: dur - 0.35, ease: 'inOut', c: { '@gripR': [-0.02, -0.36, 0.42], '@dirR': [0.02, -0.98, 0.18], '@edgeR': [0, -0.18, -0.98], '@poleR': [-0.8, -0.3, -0.2], '@ikR': [1, 0, 0] } },
      { t: dur, ease: 'inOut', c: ik(LOW) },
    ],
    [key(0, S()), key(0.25, S({ spine: [-6, 0, 0], 'upperarm.L': [-60, 0, -10], 'forearm.L': [-60, 0, 0] }), [0, 0, 0], 'out'), key(0.4, S({ hips: [12, 0, 0], spine: [22, 0, 0], chest: [12, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-40, 0, -10], 'forearm.L': [-50, 0, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [60, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [50, 0, 0] }), [0, -0.2, 0.06], 'outExpo'), key(dur - 0.35, S({ hips: [12, 0, 0], spine: [22, 0, 0], chest: [12, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-40, 0, -10], 'forearm.L': [-50, 0, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [60, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [50, 0, 0] }), [0, -0.2, 0.06], 'inOut'), key(dur, S(), [0, -0.02, 0], 'inOut')],
  ),
});

/** Ittō Kasō: a lunge, the left hand clamps on the enemy, and the pillar of fire. */
const itto: ClipDef = {
  name: 'ym_itto', dur: 1.6, fadeIn: 0.06, fadeOut: 0.3, events: { step: 0.12, grab: 0.24, cast: 0.7 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 1.6, c: ik(LOW) }],
    [
      key(0, S()),
      key(0.24, S({ hips: [8, 14, 0], spine: [14, 10, 0], chest: [8, 14, 0], 'upperarm.L': [-90, 0, -6], 'forearm.L': [-10, 0, 0], 'hand.L': [-20, 0, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [56, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [16, 0, 0] }), [0, -0.12, 0.24], 'outExpo'),
      key(1.2, S({ hips: [8, 14, 0], spine: [14, 10, 0], chest: [8, 14, 0], head: [-14, 0, 0], 'upperarm.L': [-92, 0, -6], 'forearm.L': [-8, 0, 0], 'hand.L': [-20, 0, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [56, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [16, 0, 0] }), [0, -0.12, 0.24], 'inOut'),
      key(1.6, S(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** Bankai: "Zanka no Tachi" — the old blade held upright as every flame on the field flies into it. */
const bankai: ClipDef = {
  name: 'ym_bankai', dur: 2.4, fadeIn: 0.1, fadeOut: 0.3, events: { recall: 0.4, done: 1.6 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(LOW) },
      { t: 0.4, ease: 'out', c: { '@gripR': [-0.08, 0.14, 0.34], '@dirR': [0.04, 0.98, 0.18], '@edgeR': [0, 0.18, -0.98], '@poleR': [-0.7, -0.5, -0.3], '@ikR': [1, 0, 0] } },
      { t: 1.9, ease: 'inOut', c: { '@gripR': [-0.08, 0.16, 0.34], '@dirR': [0.04, 0.98, 0.18], '@edgeR': [0, 0.18, -0.98], '@poleR': [-0.7, -0.5, -0.3], '@ikR': [1, 0, 0] } },
      { t: 2.4, ease: 'inOut', c: ik(LOW) },
    ],
    [key(0, S()), key(0.4, S({ head: [-6, 0, 0] }), [0, -0.01, 0], 'out'), key(2.4, S(), [0, -0.02, 0], 'inOut')],
  ),
};

/** the tap: the tip of the old blade touched to the ground in front of him */
const tap: ClipDef = {
  name: 'ym_tap', dur: 0.9, fadeIn: 0.06, fadeOut: 0.25, events: { tap: 0.3 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(LOW) },
      { t: 0.3, ease: 'outExpo', c: { '@gripR': [-0.1, -0.2, 0.42], '@dirR': [0.02, -0.7, 0.7], '@edgeR': [0, -0.7, -0.7], '@poleR': [-0.8, -0.3, -0.2], '@ikR': [1, 0, 0] } },
      { t: 0.6, ease: 'inOut', c: { '@gripR': [-0.1, -0.2, 0.42], '@dirR': [0.02, -0.7, 0.7], '@edgeR': [0, -0.7, -0.7], '@poleR': [-0.8, -0.3, -0.2], '@ikR': [1, 0, 0] } },
      { t: 0.9, ease: 'inOut', c: ik(LOW) },
    ],
    [key(0, S()), key(0.3, S({ spine: [12, 0, 0], chest: [6, 0, 0] }), [0, -0.06, 0.04], 'outExpo'), key(0.9, S(), [0, -0.02, 0], 'inOut')],
  ),
};

export const YAMAMOTO_CLIPS: ClipDef[] = [
  caneSweep, caneThrust, caneOver, caneSpin, onibi, nadegiri, ikkotsu('ym_ikkotsu', R), ikkotsu('ym_ikkotsu_bare', Bk), sokotsu,
  bareJab, bareHook, bareKnee, strip, release,
  k1, k2, k3, k4, wave, taimatsu, jokaku, plant('ym_ennetsu', { plant: 0.4, rise: 0.9 }, 1.8), plant('ym_minami', { plant: 0.4, rise: 0.8 }, 1.6), itto, bankai, tap,
  ...ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name)),
];
export const YAMAMOTO_CHAIN = ['ym_sweep', 'ym_thrust', 'ym_over', 'ym_spin'];
export const YAMAMOTO_BARE_CHAIN = ['ym_jab', 'ym_hook', 'ym_knee', 'ym_ikkotsu_bare'];
export const RYUJIN_CHAIN = ['ym_k1', 'ym_k2', 'ym_k3', 'ym_k4'];
