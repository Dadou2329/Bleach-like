// Mayuri's animation set. He stands loose and hunched, the head cocked, the sword low in his right hand and
// the long fingers of the left hanging open. The cuts are adequate rather than masterful: a sweeping slash,
// a backhand and a needling stab. The left arm is the weapon: thrown straight out as Jabarakaina, flicked
// round to toss a gadget, both sleeves raised to spray the net, the palm turned out for the silent Kidō, the
// left hand jabbing a syringe into his own neck. "Kakimushire": the sword raised upright before his face,
// then flicked out as it deforms into the trident. Kyōdo Yon: the trident held up before him, a finger of the
// left hand poking into the baby's eye. The Bankai: the trident pointed down at the ground ahead as the baby's
// mouth gapes. Nikushibuki: he sinks into himself.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

const IDLE: Record<string, E> = {
  hips: [0, -8, 0], spine: [8, 2, 0], chest: [6, 4, 0], neck: [-6, 0, 0], head: [-8, -6, 10],
  'thigh.L': [-6, 0, 5], 'shin.L': [10, 0, 0], 'foot.L': [-2, 0, 0], 'thigh.R': [4, 0, -4], 'shin.R': [8, 0, 0], 'foot.R': [-6, 0, 0],
  // the left arm hanging loose a little forward, the long fingers curled
  'upperarm.L': [-10, 0, 10], 'forearm.L': [-26, 0, 0], 'hand.L': [24, 0, 0],
};
const I = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });

/** the sword (or the trident) low in the right hand, point forward */
const LOW = { p: [-0.3, -0.4, 0.14] as E, dir: [-0.1, -0.68, 0.72] as E, edge: [0, -0.72, -0.68] as E, pole: [-0.6, -0.3, -0.75] as E };
/** the trident held upright before his chest (Kyōdo Yon) */
const UP = { p: [-0.12, -0.12, 0.34] as E, dir: [0.02, 1, 0.08] as E, edge: [0, -0.08, 1] as E, pole: [-0.8, -0.4, -0.3] as E };
/** pointed down at the ground ahead (the Bankai) */
const DOWN = { p: [-0.18, -0.06, 0.42] as E, dir: [0, -0.55, 0.84] as E, edge: [0, -0.84, -0.55] as E, pole: [-0.8, -0.2, -0.5] as E };
type Grip = typeof LOW;
const ik = (g: Grip, two = 0) => ({ '@gripR': g.p, '@dirR': g.dir, '@edgeR': g.edge, '@poleR': g.pole, '@ikR': [1, 0, 0] as E, '@twoHand': [two, 0, 0] as E });

export const MAYURI_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.03,
  run: { spine: [16, 0, 0], chest: [6, 0, 0], head: [-10, 0, 0], 'upperarm.L': [20, 0, 14], 'forearm.L': [-40, 0, 0] },
  sprint: { spine: [24, 0, 0], chest: [10, 0, 0], head: [-16, 0, 0], 'upperarm.L': [50, 0, 14], 'forearm.L': [-26, 0, 0] },
  swingL: 0.6,
  swingR: 0.1,
  freqScale: 0.92,
  grip: {
    idle: LOW,
    walk: LOW,
    run: { p: [-0.3, -0.26, -0.08], dir: [-0.2, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.3, -0.16, -0.18], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.38, -0.1, 0.1], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

const SH: E = [-0.22, 0.2, 0.04];

/** the cuts: a sweeping slash, a backhand (both crossing the front just after 'hit' opens the window) */
const cut = (name: string, kind: 0 | 1): ClipDef => ({
  name, dur: 0.54, fadeIn: 0.04, fadeOut: 0.18, events: { step: 0.05, hit: 0.13, combo: 0.25 },
  keys: mergeKeys(
    swingKeys(kind === 0
      ? { a: [0, 0, 1], b: [1, -0.15, 0], c: SH, r: 0.42, pole: [-0.5, -0.65, -0.55], keys: [[0, -60, 'out'], [0.1, -115, 'out'], [0.18, 34, 'out'], [0.3, 92, 'out'], [0.54, 50, 'inOut']] }
      : { a: [0, 0, 1], b: [-0.85, 0.5, 0], c: [-0.1, 0.14, 0.06], r: 0.42, pole: [-0.3, -0.4, -0.85], keys: [[0, -130, 'out'], [0.1, -118, 'out'], [0.18, 46, 'out'], [0.3, 98, 'out'], [0.54, 60, 'inOut']] }),
    [
      key(0, I()),
      key(0.1, I(kind === 1 ? { hips: [2, 14, 0], spine: [8, 10, 0], chest: [5, 14, 0], head: [-8, -12, 10] } : { hips: [2, -20, 0], spine: [8, -10, 0], chest: [4, -12, 0], head: [-8, 12, 10] }), [0, -0.03, 0], 'out'),
      key(0.18, I(kind === 1
        ? { hips: [2, -14, 0], spine: [8, -10, 0], chest: [4, -16, 0], head: [-8, 14, 10], 'thigh.L': [-22, 0, 5], 'shin.L': [24, 0, 0], 'upperarm.L': [10, 0, 30], 'forearm.L': [-30, 0, 0] }
        : { hips: [4, 12, 0], spine: [10, 8, 0], chest: [5, 14, 0], head: [-8, -6, 10], 'thigh.L': [-24, 0, 5], 'shin.L': [26, 0, 0], 'thigh.R': [12, 0, -5], 'upperarm.L': [10, 0, 30], 'forearm.L': [-30, 0, 0] }), [0, -0.06, 0.06], 'out'),
      key(0.54, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
});

/** 3: the stab — drawn back to the hip, then needled straight in */
const stab: ClipDef = {
  name: 'my_stab', dur: 0.62, fadeIn: 0.05, fadeOut: 0.2, events: { step: 0.1, hit: 0.18, combo: 0.32 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(LOW) },
      { t: 0.1, ease: 'inOut', c: ik({ p: [-0.26, -0.12, -0.12], dir: [0, 0.02, 1], edge: [0, -1, 0.02], pole: [-0.9, -0.2, -0.3] }) },
      { t: 0.2, ease: 'out', c: ik({ p: [-0.08, 0.04, 0.62], dir: [0.04, 0, 1], edge: [0, -1, 0], pole: [-0.8, -0.5, 0] }) },
      { t: 0.36, ease: 'inOut', c: ik({ p: [-0.1, 0.02, 0.56], dir: [0.04, 0, 1], edge: [0, -1, 0], pole: [-0.8, -0.5, 0] }) },
      { t: 0.62, ease: 'inOut', c: ik(LOW) },
    ],
    [
      key(0, I()),
      key(0.1, I({ hips: [0, -26, 0], spine: [6, -12, 0], chest: [0, -14, 0], head: [-8, 20, 10], 'thigh.L': [-10, 0, 6], 'thigh.R': [8, 0, -6] }), [0, -0.04, -0.02], 'inOut'),
      key(0.2, I({ hips: [6, 10, 0], spine: [14, 6, 0], chest: [6, 8, 0], head: [-12, -6, 10], 'thigh.L': [-40, 0, 6], 'shin.L': [42, 0, 0], 'thigh.R': [22, 0, -6], 'shin.R': [18, 0, 0], 'upperarm.L': [30, 0, 24], 'forearm.L': [-20, 0, 0] }), [0, -0.12, 0.14], 'out'),
      key(0.62, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** the left arm and the sword stay put; only the body and the free arm move */
const held = (dur: number) => [{ t: 0, c: ik(LOW) }, { t: dur, c: ik(LOW) }];

/** RMB (sealed): Jabarakaina — the left arm thrown straight out (it extends and grapples), then hauled back */
const jabara: ClipDef = {
  name: 'my_jabara', dur: 0.95, fadeIn: 0.04, fadeOut: 0.22, events: { fire: 0.14, pull: 0.5 },
  keys: mergeKeys(held(0.95), [
    key(0, I()),
    key(0.08, I({ hips: [0, 20, 0], spine: [4, 12, 0], chest: [0, 14, 0], head: [-8, -16, 6], 'upperarm.L': [-40, 0, 40], 'forearm.L': [-90, 0, 0] }), [0, -0.03, -0.02], 'out'),
    key(0.16, I({ hips: [2, -18, 0], spine: [8, -12, 0], chest: [2, -16, 0], head: [-6, 20, 6], 'upperarm.L': [-90, 0, -6], 'forearm.L': [-2, 0, 0], 'hand.L': [-10, 0, 0], 'thigh.L': [-24, 0, 6], 'shin.L': [24, 0, 0], 'thigh.R': [12, 0, -6] }), [0, -0.06, 0.06], 'outExpo'),
    key(0.5, I({ hips: [2, -18, 0], spine: [8, -12, 0], chest: [2, -16, 0], head: [-6, 20, 6], 'upperarm.L': [-88, 0, -6], 'forearm.L': [-4, 0, 0], 'thigh.L': [-24, 0, 6], 'shin.L': [24, 0, 0], 'thigh.R': [12, 0, -6] }), [0, -0.06, 0.06], 'inOut'),
    key(0.62, I({ hips: [-2, 10, 0], spine: [-4, 6, 0], chest: [-6, 8, 0], head: [-6, -6, 6], 'upperarm.L': [-30, 0, 30], 'forearm.L': [-110, 0, 0] }), [0, -0.02, -0.04], 'out'),
    key(0.95, I(), [0, -0.02, 0], 'inOut'),
  ]),
};

/** Q (sealed): a gadget tossed from the left hand */
const toss: ClipDef = {
  name: 'my_toss', dur: 0.7, fadeIn: 0.05, fadeOut: 0.2, events: { throw: 0.26 },
  keys: mergeKeys(held(0.7), [
    key(0, I()),
    key(0.16, I({ hips: [0, 24, 0], spine: [-2, 14, 0], chest: [-4, 16, 0], head: [-6, -14, 4], 'upperarm.L': [10, -20, 70], 'forearm.L': [-80, 0, 0], 'hand.L': [-30, 0, 0] }), [0, -0.02, -0.03], 'inOut'),
    key(0.28, I({ hips: [2, -16, 0], spine: [8, -10, 0], chest: [4, -14, 0], head: [-6, 16, 6], 'upperarm.L': [-110, 0, 10], 'forearm.L': [-10, 0, 0], 'hand.L': [20, 0, 0], 'thigh.L': [-20, 0, 6], 'shin.L': [22, 0, 0] }), [0, -0.05, 0.05], 'outExpo'),
    key(0.7, I(), [0, -0.02, 0], 'inOut'),
  ]),
};

/** E (sealed): both sleeves raised at the enemy, the sticky net sprayed out of them */
const web: ClipDef = {
  name: 'my_web', dur: 0.8, fadeIn: 0.05, fadeOut: 0.22, events: { spray: 0.2 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 0.16, ease: 'out', c: ik({ p: [-0.16, 0.0, 0.42], dir: [-0.3, -0.4, 0.86], edge: [0, -0.9, -0.4], pole: [-0.8, -0.4, -0.4] }) }, { t: 0.6, c: ik({ p: [-0.16, 0.0, 0.42], dir: [-0.3, -0.4, 0.86], edge: [0, -0.9, -0.4], pole: [-0.8, -0.4, -0.4] }) }, { t: 0.8, ease: 'inOut', c: ik(LOW) }],
    [
      key(0, I()),
      key(0.18, I({ spine: [4, 0, 0], head: [-6, 0, 4], 'upperarm.L': [-86, -10, 4], 'forearm.L': [-10, 0, 0], 'hand.L': [30, 0, 0], 'thigh.L': [-14, 0, 6], 'shin.L': [16, 0, 0] }), [0, -0.03, 0.02], 'out'),
      key(0.6, I({ spine: [4, 0, 0], head: [-6, 0, 4], 'upperarm.L': [-84, -10, 4], 'forearm.L': [-12, 0, 0], 'hand.L': [30, 0, 0], 'thigh.L': [-14, 0, 6], 'shin.L': [16, 0, 0] }), [0, -0.03, 0.02], 'inOut'),
      key(0.8, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** R: the silent Kidō, out of the turned-out left palm */
const palm: ClipDef = {
  name: 'my_kido', dur: 0.7, fadeIn: 0.05, fadeOut: 0.2, events: { charge: 0.08, fire: 0.24 },
  keys: mergeKeys(held(0.7), [
    key(0, I()),
    key(0.14, I({ hips: [0, -18, 0], spine: [4, -10, 0], chest: [0, -12, 0], head: [-8, 12, 6], 'upperarm.L': [-80, -12, 6], 'forearm.L': [-14, 0, 0], 'hand.L': [70, 0, 0], 'thigh.L': [-18, 0, 6], 'shin.L': [18, 0, 0] }), [0, -0.04, 0], 'inOut'),
    key(0.26, I({ hips: [0, -18, 0], spine: [2, -10, 0], chest: [-2, -12, 0], head: [-6, 12, 6], 'upperarm.L': [-88, -12, 6], 'forearm.L': [-4, 0, 0], 'hand.L': [76, 0, 0], 'thigh.L': [-18, 0, 6], 'shin.L': [18, 0, 0] }), [0, -0.04, 0.03], 'outExpo'),
    key(0.7, I(), [0, -0.02, 0], 'inOut'),
  ]),
};

/** G: the Superhuman Drug, diluted — the syringe jabbed into his own neck */
const drug: ClipDef = {
  name: 'my_drug', dur: 0.9, fadeIn: 0.06, fadeOut: 0.22, events: { inject: 0.36 },
  keys: mergeKeys(held(0.9), [
    key(0, I()),
    key(0.22, I({ head: [-4, 30, -14], neck: [-4, 10, -6], 'upperarm.L': [-60, -30, 50], 'forearm.L': [-130, 0, 0], 'hand.L': [-20, 0, 0] }), [0, -0.02, 0], 'inOut'),
    key(0.36, I({ head: [-6, 34, -18], neck: [-4, 12, -8], 'upperarm.L': [-58, -36, 44], 'forearm.L': [-138, 0, 0], 'hand.L': [-24, 0, 0] }), [0, -0.02, 0], 'outExpo'),
    key(0.6, I({ spine: [-6, 0, 0], chest: [-8, 0, 0], head: [-16, 0, 0], 'upperarm.L': [-20, 0, 30], 'forearm.L': [-40, 0, 0] }), [0, 0, 0], 'out'),
    key(0.9, I(), [0, -0.02, 0], 'inOut'),
  ]),
};

/** F: "Kakimushire, Ashisogi Jizō" — the sword raised upright before his face, then flicked out */
const shikai: ClipDef = {
  name: 'my_shikai', dur: 1.2, fadeIn: 0.08, fadeOut: 0.26, events: { call: 0.2, form: 0.62 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 0.3, ease: 'inOut', c: ik(UP) }, { t: 0.55, c: ik(UP) }, { t: 0.7, ease: 'outExpo', c: ik({ p: [-0.24, -0.06, 0.4], dir: [-0.1, -0.3, 0.95], edge: [0, -0.95, -0.3], pole: [-0.8, -0.3, -0.5] }) }, { t: 1.2, ease: 'inOut', c: ik(LOW) }],
    [
      key(0, I()),
      key(0.3, I({ spine: [2, 0, 0], head: [-10, 0, 4], 'upperarm.L': [-30, -30, 0], 'forearm.L': [-90, 0, 0], 'hand.L': [20, 0, 0] }), [0, -0.02, 0], 'inOut'),
      key(0.7, I({ hips: [0, -14, 0], spine: [8, -6, 0], head: [-8, 10, 8], 'upperarm.L': [10, 0, 34], 'forearm.L': [-40, 0, 0], 'thigh.L': [-18, 0, 6], 'shin.L': [20, 0, 0] }), [0, -0.05, 0.04], 'outExpo'),
      key(1.2, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** Q (Shikai): Kyōdo Yon — the trident held up, a finger of the left hand poking into the baby's eye */
const kyodo: ClipDef = {
  name: 'my_kyodo', dur: 1.3, fadeIn: 0.08, fadeOut: 0.26, events: { poke: 0.34, scream: 0.4 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 0.24, ease: 'inOut', c: ik(UP) }, { t: 1.0, c: ik(UP) }, { t: 1.3, ease: 'inOut', c: ik(LOW) }],
    [
      key(0, I()),
      key(0.24, I({ spine: [2, 6, 0], head: [-14, -10, 12], 'upperarm.L': [-62, -40, 10], 'forearm.L': [-70, 0, 0], 'hand.L': [-10, 0, 0] }), [0, -0.02, 0], 'inOut'),
      key(0.34, I({ spine: [2, 6, 0], head: [-14, -10, 12], 'upperarm.L': [-66, -46, 6], 'forearm.L': [-64, 0, 0], 'hand.L': [-16, 0, 0] }), [0, -0.02, 0], 'outExpo'),
      key(1.0, I({ spine: [0, 6, 0], head: [-16, -12, 14], 'upperarm.L': [-64, -46, 6], 'forearm.L': [-66, 0, 0], 'hand.L': [-16, 0, 0] }), [0, -0.02, 0], 'inOut'),
      key(1.3, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** E (Shikai): the trident held out, the poison leaking from the baby's mouth */
const vapour: ClipDef = {
  name: 'my_vapour', dur: 1.1, fadeIn: 0.06, fadeOut: 0.24, events: { gas: 0.22 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 0.2, ease: 'out', c: ik({ p: [-0.14, 0.04, 0.5], dir: [0, 0.1, 1], edge: [0, -1, 0.1], pole: [-0.8, -0.5, 0] }) }, { t: 0.9, c: ik({ p: [-0.14, 0.04, 0.5], dir: [0, 0.1, 1], edge: [0, -1, 0.1], pole: [-0.8, -0.5, 0] }) }, { t: 1.1, ease: 'inOut', c: ik(LOW) }],
    [
      key(0, I()),
      key(0.2, I({ hips: [0, 10, 0], spine: [6, 6, 0], head: [-10, -6, 8], 'upperarm.L': [-20, 0, 40], 'forearm.L': [-50, 0, 0], 'thigh.L': [-16, 0, 6], 'shin.L': [18, 0, 0] }), [0, -0.04, 0.03], 'out'),
      key(0.9, I({ hips: [0, 10, 0], spine: [6, 6, 0], head: [-10, -6, 8], 'upperarm.L': [-20, 0, 40], 'forearm.L': [-50, 0, 0], 'thigh.L': [-16, 0, 6], 'shin.L': [18, 0, 0] }), [0, -0.04, 0.03], 'inOut'),
      key(1.1, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** F (Shikai): "Bankai — Konjiki Ashisogi Jizō": the trident pointed at the ground ahead, the baby's mouth gaping */
const bankai: ClipDef = {
  name: 'my_bankai', dur: 2.0, fadeIn: 0.1, fadeOut: 0.3, events: { call: 0.2, birth: 0.7 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 0.4, ease: 'inOut', c: ik(DOWN) }, { t: 1.6, c: ik(DOWN) }, { t: 2.0, ease: 'inOut', c: ik(LOW) }],
    [
      key(0, I()),
      key(0.4, I({ spine: [12, 0, 0], chest: [6, 0, 0], head: [-14, 0, 10], 'upperarm.L': [10, 0, 50], 'forearm.L': [-20, 0, 0], 'hand.L': [0, 0, -30], 'thigh.L': [-14, 0, 8], 'shin.L': [18, 0, 0] }), [0, -0.05, 0.02], 'inOut'),
      key(1.0, I({ spine: [-6, 0, 0], chest: [-10, 0, 0], head: [-24, 0, 4], 'upperarm.L': [-10, 0, 70], 'forearm.L': [-10, 0, 0], 'hand.L': [0, 0, -40], 'thigh.L': [-10, 0, 8], 'shin.L': [12, 0, 0] }), [0, 0, 0], 'out'),
      key(1.6, I({ spine: [-4, 0, 0], chest: [-8, 0, 0], head: [-20, 0, 6], 'upperarm.L': [-8, 0, 64], 'forearm.L': [-14, 0, 0], 'hand.L': [0, 0, -36] }), [0, 0, 0], 'inOut'),
      key(2.0, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** the Bankai at his command: a flick of the free hand toward the enemy */
const command: ClipDef = {
  name: 'my_command', dur: 0.6, fadeIn: 0.05, fadeOut: 0.2, events: { go: 0.18 },
  keys: mergeKeys(held(0.6), [
    key(0, I()),
    key(0.18, I({ hips: [0, -12, 0], spine: [6, -8, 0], head: [-8, 12, 6], 'upperarm.L': [-96, 0, 20], 'forearm.L': [-6, 0, 0], 'hand.L': [-10, 0, 0] }), [0, -0.03, 0.03], 'outExpo'),
    key(0.6, I(), [0, -0.02, 0], 'inOut'),
  ]),
};

/** Nikushibuki: he drives the sword into himself and sinks down as his body turns to liquid */
const melt: ClipDef = {
  name: 'my_melt', dur: 1.0, fadeIn: 0.06, fadeOut: 0.3, events: { stab: 0.24, melt: 0.4 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 0.22, ease: 'inOut', c: ik({ p: [-0.04, 0.0, 0.3], dir: [0.05, 0.1, -1], edge: [0, -1, -0.1], pole: [-0.8, -0.3, 0.4] }) }, { t: 1.0, c: ik({ p: [-0.04, -0.1, 0.3], dir: [0.05, 0.1, -1], edge: [0, -1, -0.1], pole: [-0.8, -0.3, 0.4] }) }],
    [
      key(0, I()),
      key(0.24, I({ spine: [20, 0, 0], chest: [10, 0, 0], head: [-6, 0, 10], 'upperarm.L': [-40, -30, -10], 'forearm.L': [-80, 0, 0] }), [0, -0.06, 0], 'outExpo'),
      key(1.0, I({ spine: [40, 0, 0], chest: [20, 0, 0], head: [10, 0, 10], 'thigh.L': [-90, 0, 10], 'shin.L': [140, 0, 0], 'thigh.R': [-90, 0, -10], 'shin.R': [140, 0, 0], 'upperarm.L': [-20, -30, -10], 'forearm.L': [-60, 0, 0] }), [0, -0.6, 0], 'in'),
    ],
  ),
};

export const MAYURI_CLIPS: ClipDef[] = [
  cut('my_cut1', 0), cut('my_cut2', 1), stab, jabara, toss, web, palm, drug, shikai, kyodo, vapour, bankai, command, melt,
  ...ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name)),
];
export const MAYURI_CHAIN = ['my_cut1', 'my_cut2', 'my_stab'];
