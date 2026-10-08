// TYBW Renji's animation set (docs/kits/renji.md). Sealed in the Ōken clothing: the catch (the left palm out to stop a
// blow dead) and the elbow driven down into whoever was caught. Sōō Zabimaru: the gauntlet's blade is a pata — it
// continues the forearm past the knuckles — so the right hand's cuts are pata arcs; the left arm is Hihiō's (the giant
// arm copies its rotations), so every left-arm motion here is made big and clear: the jet-boosted straight punch, the
// hammer-fist, the palm thrust out for Hikotsu Taihō, the pinch sign of Hihi Tenshō, the overhead whirl of Zagai
// Zekkō (looping) and its hurl. The right arm: Orochiō raised as it grows, the whip-snake lash and slam, the overhand
// throw of the red-hot blade and the yank on the tail, Zazekka's wide sweep, and Zaga Teppō — the stab, the twist of
// the blade like a key, the bite.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { GripDef, StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { RENJI_STANCE } from './renjiClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

/** the swagger of the true Bankai: weight back on the right leg, the gauntlet low and forward, the left arm loose */
const S_IDLE: Record<string, E> = {
  ...(RENJI_STANCE.idle as Record<string, E>),
  hips: [0, -10, 0], spine: [5, 4, 0], chest: [3, 8, 0], head: [-3, 2, 0],
  'thigh.L': [-8, 0, 5], 'shin.L': [10, 0, 0], 'thigh.R': [5, 0, -4], 'shin.R': [8, 0, 0],
  'upperarm.L': [-4, 0, 20], 'forearm.L': [-36, 0, 0], 'hand.L': [4, 0, 0],
};
const S = (over: Record<string, E> = {}): Record<string, E> => ({ ...S_IDLE, ...over });

/**
 * Pata grips (as Harribel's): `dir` is the edge's lead (the hand's forward axis), `edge` the blade itself (the hand's
 * down axis, continuing the forearm). Chest space, m.
 */
const LOW: GripDef = { p: [-0.28, -0.22, 0.28], dir: [0, 0.95, 0.3], edge: [-0.1, -0.3, 0.95], pole: [-0.8, -0.3, -0.5] };
const RUN: GripDef = { p: [-0.32, -0.18, -0.1], dir: [0, 0.89, -0.45], edge: [-0.15, -0.45, -0.88], pole: [-0.8, -0.2, 0.5] };
const SPRINT: GripDef = { p: [-0.32, -0.08, -0.2], dir: [0, 0.96, -0.27], edge: [-0.15, -0.27, -0.95], pole: [-0.8, -0.2, 0.5] };
const AIR: GripDef = { p: [-0.38, -0.06, 0.12], dir: [0, 0.8, 0.6], edge: [-0.5, -0.5, 0.7], pole: [-0.6, -0.5, -0.6] };
/** thrust straight out at the target */
const OUT: GripDef = { p: [-0.1, 0.1, 0.52], dir: [0, 1, 0], edge: [0.04, 0, 1], pole: [-0.8, -0.5, -0.2] };
/** held up before him, the point to the sky (Orochiō growing) */
const UP: GripDef = { p: [-0.2, 0.3, 0.34], dir: [0, 0.2, 0.98], edge: [-0.05, 0.98, -0.2], pole: [-0.9, -0.2, -0.3] };
/** drawn back over the shoulder (the throw) */
const BACK: GripDef = { p: [-0.26, 0.42, -0.12], dir: [0, 0.3, -0.95], edge: [0.1, 0.95, 0.3], pole: [-0.7, 0.4, -0.5] };
/** yanked back to the hip (the reel) */
const HIP: GripDef = { p: [-0.3, -0.34, -0.06], dir: [0, 0.6, 0.8], edge: [-0.05, -0.8, 0.6], pole: [-0.8, -0.2, 0.5] };

const grip = (t: number, g: GripDef, ease?: KeyDef['ease'], w = 1): KeyDef => ({ t, ease, c: { '@gripR': [...g.p], '@dirR': [...g.dir], '@edgeR': [...g.edge], '@poleR': [...g.pole], '@ikR': [w, 0, 0] } });

export const SOO_STANCE: StanceDef = {
  ...RENJI_STANCE,
  idle: S_IDLE,
  idleHips: -0.02,
  run: { spine: [14, 0, 0], chest: [6, 0, 0], head: [-8, 0, 0], 'upperarm.L': [26, 0, 14], 'forearm.L': [-40, 0, 0] },
  sprint: { spine: [22, 0, 0], chest: [10, 0, 0], head: [-14, 0, 0], 'upperarm.L': [52, 0, 16], 'forearm.L': [-30, 0, 0] },
  swingL: 0.5,
  swingR: 0.1,
  grip: { idle: LOW, walk: LOW, run: RUN, sprint: SPRINT, air: AIR },
};

const SH: E = [-0.19, 0.2, 0.04];

// ---------------------------------------------------------------------------------------------- the arm-blade string

/** the blade off the gauntlet: 0 a flat forehand, 1 a backhand from high on his left, 2 the skull driven up (uppercut) */
const cut = (name: string, kind: 0 | 1 | 2): ClipDef => ({
  name, dur: 0.56, fadeIn: 0.04, fadeOut: 0.18, events: { step: 0.05, hit: 0.13, combo: 0.26 },
  keys: mergeKeys(
    swingKeys(kind === 0
      ? { pata: true, a: [0, 0, 1], b: [1, -0.1, 0], c: SH, r: 0.48, pole: [-0.6, -0.5, -0.6], keys: [[0, -30, 'out'], [0.1, -118, 'out'], [0.18, 30, 'out'], [0.3, 90, 'out'], [0.56, 45, 'inOut']] }
      : kind === 1
        ? { pata: true, a: [0, 0, 1], b: [-0.85, 0.52, 0], c: [-0.1, 0.14, 0.06], r: 0.48, pole: [-0.4, -0.4, -0.8], keys: [[0, -125, 'out'], [0.1, -118, 'out'], [0.18, 44, 'out'], [0.3, 96, 'out'], [0.56, 50, 'inOut']] }
        : { pata: true, a: [0, 1, 0], b: [0, 0, 1], c: SH, r: 0.48, pole: [-0.8, -0.4, -0.3], keys: [[0, 60, 'out'], [0.1, -30, 'out'], [0.2, 110, 'out'], [0.32, 130, 'out'], [0.56, 100, 'inOut']] }),
    [
      key(0, S()),
      key(0.1, S(kind === 1 ? { hips: [2, 14, 0], spine: [5, 10, 0], chest: [5, 16, 0], head: [-6, -8, 2] } : kind === 2 ? { hips: [8, -8, 0], spine: [10, -6, 0], chest: [8, -8, 0], head: [-10, 6, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [50, 0, 0], 'thigh.R': [-6, 0, -6], 'shin.R': [44, 0, 0] } : { hips: [2, -22, 0], spine: [5, -12, 0], chest: [4, -14, 0], head: [-6, 16, 2] }), [0, kind === 2 ? -0.16 : -0.03, 0], 'out'),
      key(0.18, S(kind === 1
        ? { hips: [2, -16, 0], spine: [5, -12, 0], chest: [4, -18, 0], head: [-6, 16, 2], 'thigh.L': [-24, 0, 5], 'shin.L': [26, 0, 0] }
        : kind === 2
          ? { hips: [-6, 6, 0], spine: [-8, 4, 0], chest: [-8, 6, 0], head: [6, -4, 0], 'thigh.L': [-20, 0, 5], 'shin.L': [14, 0, 0], 'thigh.R': [14, 0, -5], 'shin.R': [6, 0, 0] }
          : { hips: [4, 14, 0], spine: [7, 10, 0], chest: [5, 16, 0], head: [-6, -6, 2], 'thigh.L': [-26, 0, 5], 'shin.L': [28, 0, 0], 'thigh.R': [12, 0, -5] }), [0, kind === 2 ? 0.04 : -0.06, 0.08], 'out'),
      key(0.56, S(), [0, -0.02, 0], 'inOut'),
    ],
  ),
});

/** the finisher: the left fist raised high and brought down — Hihiō's hammer-fist into the ground */
const hammer: ClipDef = {
  name: 'so_hammer', dur: 0.95, fadeIn: 0.05, fadeOut: 0.24, events: { raise: 0.12, slam: 0.38, combo: 0.6 },
  keys: mergeKeys(
    [grip(0, LOW), grip(0.95, LOW)],
    [
      key(0, S()),
      key(0.24, S({ hips: [-6, 18, 0], spine: [-8, 10, 0], chest: [-10, 14, 0], head: [-6, -10, 0], 'upperarm.L': [-168, 0, 14], 'forearm.L': [-46, 0, 0], 'thigh.L': [-14, 0, 6], 'thigh.R': [6, 0, -6] }), [0, 0.02, 0], 'out'),
      key(0.38, S({ hips: [18, 4, 0], spine: [20, 2, 0], chest: [14, 2, 0], head: [-16, -2, 0], 'upperarm.L': [-48, 0, 6], 'forearm.L': [-8, 0, 0], 'thigh.L': [-50, 0, 8], 'shin.L': [70, 0, 0], 'thigh.R': [-6, 0, -8], 'shin.R': [70, 0, 0], 'foot.R': [20, 0, 0] }), [0, -0.3, 0.08], 'outExpo'),
      key(0.62, S({ hips: [18, 4, 0], spine: [20, 2, 0], chest: [14, 2, 0], head: [-16, -2, 0], 'upperarm.L': [-46, 0, 6], 'forearm.L': [-10, 0, 0], 'thigh.L': [-50, 0, 8], 'shin.L': [70, 0, 0], 'thigh.R': [-6, 0, -8], 'shin.R': [70, 0, 0], 'foot.R': [20, 0, 0] }), [0, -0.3, 0.08], 'linear'),
      key(0.95, S(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

// ---------------------------------------------------------------------------------------------- Hihiō

/** RMB: the straight left, the torso wound back then thrown round — Hihiō's fist jet-boosted out (boost, hit) */
const punch: ClipDef = {
  name: 'so_punch', dur: 0.9, fadeIn: 0.05, fadeOut: 0.24, events: { boost: 0.15, hit: 0.27 },
  keys: mergeKeys(
    [grip(0, LOW), grip(0.9, LOW)],
    [
      key(0, S()),
      key(0.15, S({ hips: [0, 18, 0], spine: [2, 10, 0], chest: [0, 18, 0], head: [0, -20, 0], 'upperarm.L': [24, 0, 34], 'forearm.L': [-118, 0, 0], 'thigh.L': [-10, 0, 6], 'thigh.R': [10, 0, -6], 'shin.R': [16, 0, 0] }), [0, -0.05, -0.04], 'out'),
      key(0.27, S({ hips: [4, -14, 0], spine: [6, -8, 0], chest: [4, -13, 0], head: [-4, 30, 0], 'upperarm.L': [-82, 0, 30], 'forearm.L': [-4, 0, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [26, 0, 0], 'thigh.R': [18, 0, -6], 'shin.R': [14, 0, 0] }), [0, -0.08, 0.12], 'outExpo'),
      key(0.52, S({ hips: [4, -14, 0], spine: [6, -8, 0], chest: [4, -13, 0], head: [-4, 30, 0], 'upperarm.L': [-80, 0, 30], 'forearm.L': [-6, 0, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [26, 0, 0], 'thigh.R': [18, 0, -6], 'shin.R': [14, 0, 0] }), [0, -0.08, 0.12], 'linear'),
      key(0.9, S(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** F (at range): the left palm thrust out, Hikotsu Taihō out of Hihiō's hand (charge, fire) */
const taiho: ClipDef = {
  name: 'so_taiho', dur: 1.35, fadeIn: 0.06, fadeOut: 0.26, events: { charge: 0.12, fire: 0.62 },
  keys: mergeKeys(
    [grip(0, LOW), grip(1.35, LOW)],
    [
      key(0, S()),
      key(0.22, S({ hips: [0, -12, 0], spine: [2, -6, 0], chest: [0, -10, 0], head: [0, 24, 0], 'upperarm.L': [-86, 0, 24], 'forearm.L': [-6, 0, 0], 'hand.L': [-6, 0, 50], 'thigh.L': [-26, 0, 6], 'shin.L': [24, 0, 0], 'thigh.R': [16, 0, -6], 'shin.R': [20, 0, 0] }), [0, -0.1, 0.05], 'outExpo'),
      key(1.0, S({ hips: [0, -12, 0], spine: [2, -6, 0], chest: [0, -10, 0], head: [0, 24, 0], 'upperarm.L': [-84, 0, 24], 'forearm.L': [-8, 0, 0], 'hand.L': [-6, 0, 50], 'thigh.L': [-26, 0, 6], 'shin.L': [24, 0, 0], 'thigh.R': [16, 0, -6], 'shin.R': [20, 0, 0] }), [0, -0.1, 0.05], 'linear'),
      key(1.35, S(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** R: Hihi Tenshō — the left hand raised before his face, thumb and forefinger pinched (sign) */
const tensho: ClipDef = {
  name: 'so_tensho', dur: 1.3, fadeIn: 0.08, fadeOut: 0.26, events: { sign: 0.36 },
  keys: mergeKeys(
    [grip(0, LOW), grip(1.3, LOW)],
    [
      key(0, S()),
      key(0.3, S({ hips: [0, -8, 0], chest: [-2, -10, 0], head: [-4, 10, 0], 'upperarm.L': [-64, 0, -14], 'forearm.L': [-102, 0, 0], 'hand.L': [10, 0, 0] }), [0, 0, 0], 'out'),
      key(1.0, S({ hips: [0, -8, 0], chest: [-2, -10, 0], head: [-4, 10, 0], 'upperarm.L': [-62, 0, -14], 'forearm.L': [-104, 0, 0], 'hand.L': [10, 0, 0] }), [0, 0, 0], 'linear'),
      key(1.3, S(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** G: Zagai Zekkō — the left arm up, Hihiō whirling the skull on its tail overhead (loops while it charges) */
const whirl: ClipDef = {
  name: 'so_whirl', dur: 0.72, loop: true, fadeIn: 0.2, fadeOut: 0.2,
  keys: mergeKeys(
    [grip(0, LOW), grip(0.72, LOW)],
    [0, 0.18, 0.36, 0.54, 0.72].map((t, i) => {
      const a = (i / 4) * Math.PI * 2;
      return key(t, S({ hips: [0, 6, 0], spine: [-4, 2, 0], chest: [-8, 6 + Math.sin(a) * 6, 0], head: [-14, -4, 0], 'upperarm.L': [-150 + Math.cos(a) * 14, 0, 18 + Math.sin(a) * 18], 'forearm.L': [-30, 0, 0], 'thigh.L': [-16, 0, 8], 'shin.L': [20, 0, 0], 'thigh.R': [10, 0, -8], 'shin.R': [16, 0, 0] }), [0, -0.06, 0], 'linear');
    }),
  ),
};

/** G again: the hurl — the arm comes over from behind and down, the disc thrown (hurl) */
const hurl: ClipDef = {
  name: 'so_hurl', dur: 1.0, fadeIn: 0.05, fadeOut: 0.26, events: { hurl: 0.32 },
  keys: mergeKeys(
    [grip(0, LOW), grip(1.0, LOW)],
    [
      key(0, S({ chest: [-8, 6, 0], head: [-14, -4, 0], 'upperarm.L': [-150, 0, 18], 'forearm.L': [-30, 0, 0] })),
      key(0.18, S({ hips: [-6, 24, 0], spine: [-10, 14, 0], chest: [-14, 20, 0], head: [-10, -18, 0], 'upperarm.L': [-176, 0, 30], 'forearm.L': [-40, 0, 0], 'thigh.L': [-10, 0, 8], 'thigh.R': [14, 0, -8] }), [0, 0, -0.04], 'out'),
      key(0.32, S({ hips: [16, -10, 0], spine: [18, -6, 0], chest: [12, -10, 0], head: [-14, 18, 0], 'upperarm.L': [-64, 0, 22], 'forearm.L': [-6, 0, 0], 'thigh.L': [-44, 0, 8], 'shin.L': [54, 0, 0], 'thigh.R': [10, 0, -8], 'shin.R': [40, 0, 0] }), [0, -0.2, 0.12], 'outExpo'),
      key(0.62, S({ hips: [16, -10, 0], spine: [18, -6, 0], chest: [12, -10, 0], head: [-14, 18, 0], 'upperarm.L': [-58, 0, 22], 'forearm.L': [-8, 0, 0], 'thigh.L': [-44, 0, 8], 'shin.L': [54, 0, 0], 'thigh.R': [10, 0, -8], 'shin.R': [40, 0, 0] }), [0, -0.2, 0.12], 'linear'),
      key(1.0, S(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

// ---------------------------------------------------------------------------------------------- Orochiō, Zazekka

/** Q: Orochiō — the gauntlet raised before him, the blade growing long and serrated out of the jaws (grow) */
const orochi: ClipDef = {
  name: 'so_orochi', dur: 0.8, fadeIn: 0.06, fadeOut: 0.24, events: { grow: 0.24 },
  keys: mergeKeys(
    [grip(0, LOW), grip(0.22, UP, 'out'), grip(0.55, UP, 'linear'), grip(0.8, LOW, 'inOut')],
    [
      key(0, S()),
      key(0.22, S({ hips: [0, -14, 0], chest: [-4, -10, 0], head: [-8, 12, 0], 'upperarm.L': [-30, 0, 30], 'forearm.L': [-70, 0, 0] }), [0, 0.02, 0], 'out'),
      key(0.55, S({ hips: [0, -14, 0], chest: [-4, -10, 0], head: [-8, 12, 0], 'upperarm.L': [-30, 0, 30], 'forearm.L': [-70, 0, 0] }), [0, 0.02, 0], 'linear'),
      key(0.8, S(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** Q in Orochiō: the whip-snake — the arm thrown out (lash), raised with what the jaws caught (lift) and slammed (slam) */
const snake: ClipDef = {
  name: 'so_snake', dur: 1.15, fadeIn: 0.05, fadeOut: 0.26, events: { lash: 0.14, lift: 0.42, slam: 0.64 },
  keys: mergeKeys(
    [grip(0, LOW), grip(0.14, OUT, 'outExpo'), grip(0.42, UP, 'out'), grip(0.64, OUT, 'outExpo'), grip(0.85, OUT, 'linear'), grip(1.15, LOW, 'inOut')],
    [
      key(0, S()),
      key(0.14, S({ hips: [4, -24, 0], spine: [6, -12, 0], chest: [4, -24, 0], head: [-4, 26, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [28, 0, 0], 'thigh.R': [18, 0, -6] }), [0, -0.08, 0.1], 'outExpo'),
      key(0.42, S({ hips: [-8, -10, 0], spine: [-10, -6, 0], chest: [-12, -8, 0], head: [-10, 8, 0], 'thigh.L': [-12, 0, 6], 'thigh.R': [8, 0, -6] }), [0, 0.04, -0.04], 'out'),
      key(0.64, S({ hips: [18, -16, 0], spine: [20, -10, 0], chest: [14, -14, 0], head: [-16, 16, 0], 'thigh.L': [-48, 0, 8], 'shin.L': [64, 0, 0], 'thigh.R': [-4, 0, -8], 'shin.R': [60, 0, 0] }), [0, -0.26, 0.1], 'outExpo'),
      key(0.85, S({ hips: [18, -16, 0], spine: [20, -10, 0], chest: [14, -14, 0], head: [-16, 16, 0], 'thigh.L': [-48, 0, 8], 'shin.L': [64, 0, 0], 'thigh.R': [-4, 0, -8], 'shin.R': [60, 0, 0] }), [0, -0.26, 0.1], 'linear'),
      key(1.15, S(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** RMB in Orochiō: the overhand throw of the red-hot blade on its tail (throw) */
const toss: ClipDef = {
  name: 'so_throw', dur: 0.85, fadeIn: 0.05, fadeOut: 0.24, events: { throw: 0.3 },
  keys: mergeKeys(
    [grip(0, LOW), grip(0.18, BACK, 'out'), grip(0.3, OUT, 'outExpo'), grip(0.5, OUT, 'linear'), grip(0.85, LOW, 'inOut')],
    [
      key(0, S()),
      key(0.18, S({ hips: [-4, 20, 0], spine: [-8, 14, 0], chest: [-10, 22, 0], head: [-6, -20, 0], 'upperarm.L': [-40, 0, 40], 'forearm.L': [-30, 0, 0], 'thigh.L': [-14, 0, 8], 'thigh.R': [12, 0, -8] }), [0, 0, -0.04], 'out'),
      key(0.3, S({ hips: [12, -22, 0], spine: [14, -14, 0], chest: [10, -24, 0], head: [-10, 24, 0], 'upperarm.L': [20, 0, 30], 'forearm.L': [-30, 0, 0], 'thigh.L': [-36, 0, 8], 'shin.L': [36, 0, 0], 'thigh.R': [16, 0, -8], 'shin.R': [20, 0, 0] }), [0, -0.12, 0.12], 'outExpo'),
      key(0.85, S(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** RMB again: the yank on the tail (reel) */
const reel: ClipDef = {
  name: 'so_reel', dur: 0.6, fadeIn: 0.04, fadeOut: 0.2, events: { reel: 0.1 },
  keys: mergeKeys(
    [grip(0, OUT), grip(0.12, HIP, 'outExpo'), grip(0.6, LOW, 'inOut')],
    [
      key(0, S()),
      key(0.12, S({ hips: [-8, 16, 0], spine: [-10, 10, 0], chest: [-8, 18, 0], head: [6, -14, 0], 'thigh.L': [-20, 0, 6], 'shin.L': [20, 0, 0], 'thigh.R': [20, 0, -6], 'shin.R': [30, 0, 0] }), [0, -0.1, -0.08], 'outExpo'),
      key(0.6, S(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** E: Zazekka — one wide sweep at arm's length as the blade comes apart into a whip (lash, back) */
const zazekka: ClipDef = {
  name: 'so_zazekka', dur: 1.0, fadeIn: 0.05, fadeOut: 0.24, events: { lash: 0.16, back: 0.62 },
  keys: mergeKeys(
    swingKeys({ pata: true, a: [0, 0, 1], b: [1, -0.05, 0], c: SH, r: 0.52, pole: [-0.5, -0.6, -0.5], keys: [[0, -40, 'out'], [0.1, -140, 'out'], [0.18, -10, 'outExpo'], [0.4, 80, 'out'], [0.62, 90, 'linear'], [1.0, 45, 'inOut']] }),
    [
      key(0, S()),
      key(0.1, S({ hips: [0, -28, 0], spine: [2, -18, 0], chest: [-4, -28, 4], head: [0, 22, 0], 'thigh.L': [-14, 0, 6], 'thigh.R': [12, 0, -6], 'shin.R': [20, 0, 0], 'upperarm.L': [-20, 0, 40] }), [0, -0.05, -0.02], 'out'),
      key(0.18, S({ hips: [0, 14, 0], spine: [8, 16, 0], chest: [6, 26, -4], head: [0, -20, 0], 'thigh.L': [-32, 0, 6], 'shin.L': [28, 0, 0], 'thigh.R': [24, 0, -4], 'shin.R': [26, 0, 0], 'upperarm.L': [10, 0, 30], 'forearm.L': [-30, 0, 0] }), [0, -0.08, 0.06], 'outExpo'),
      key(0.62, S({ hips: [0, 22, 0], spine: [10, 20, 0], chest: [8, 30, -4], head: [0, -24, 0], 'thigh.L': [-30, 0, 6], 'thigh.R': [22, 0, -4], 'upperarm.L': [12, 0, 32], 'forearm.L': [-34, 0, 0] }), [0, -0.09, 0.07], 'linear'),
      key(1.0, S(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** F (close): Zaga Teppō — the stab, the blade turned in the wound like a key (twist), the burning skull (bite) */
const impale: ClipDef = {
  name: 'so_impale', dur: 1.75, fadeIn: 0.04, fadeOut: 0.3, events: { stab: 0.12, twist: 0.55, bite: 0.8 },
  keys: mergeKeys(
    [
      grip(0, LOW),
      grip(0.12, OUT, 'outExpo'),
      grip(0.42, OUT, 'linear'),
      { t: 0.55, ease: 'outBack', c: { '@gripR': [...OUT.p], '@dirR': [-1, 0, 0], '@edgeR': [...OUT.edge], '@poleR': [...OUT.pole], '@ikR': [1, 0, 0] } },
      { t: 1.4, ease: 'linear', c: { '@gripR': [...OUT.p], '@dirR': [-1, 0, 0], '@edgeR': [...OUT.edge], '@poleR': [...OUT.pole], '@ikR': [1, 0, 0] } },
      grip(1.75, LOW, 'inOut'),
    ],
    [
      key(0, S()),
      key(0.12, S({ hips: [6, -26, 0], spine: [8, -14, 0], chest: [6, -24, 0], head: [-6, 26, 0], 'upperarm.L': [-30, 0, 40], 'forearm.L': [-60, 0, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [40, 0, 0], 'thigh.R': [20, 0, -6], 'shin.R': [24, 0, 0] }), [0, -0.14, 0.16], 'outExpo'),
      key(0.55, S({ hips: [8, -30, 0], spine: [10, -16, 0], chest: [8, -30, 0], head: [-8, 30, 0], 'upperarm.L': [-34, 0, 44], 'forearm.L': [-64, 0, 0], 'thigh.L': [-42, 0, 6], 'shin.L': [44, 0, 0], 'thigh.R': [22, 0, -6], 'shin.R': [26, 0, 0] }), [0, -0.15, 0.16], 'outBack'),
      key(1.4, S({ hips: [8, -30, 0], spine: [10, -16, 0], chest: [8, -30, 0], head: [-8, 30, 0], 'upperarm.L': [-34, 0, 44], 'forearm.L': [-64, 0, 0], 'thigh.L': [-42, 0, 6], 'shin.L': [44, 0, 0], 'thigh.R': [22, 0, -6], 'shin.R': [26, 0, 0] }), [0, -0.15, 0.16], 'linear'),
      key(1.75, S(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** F: the release — braced low, arms crossed, then thrown wide as the Ōken clothing tears away (burst) */
const bankai: ClipDef = {
  name: 'so_bankai', dur: 2.0, fadeIn: 0.1, fadeOut: 0.3, events: { charge: 0.1, burst: 0.9 },
  keys: [
    key(0, S()),
    key(0.6, S({ hips: [14, 0, 0], spine: [16, 0, 0], chest: [12, 0, 0], head: [10, 0, 0], 'upperarm.L': [-60, 0, -30], 'forearm.L': [-90, 0, 0], 'upperarm.R': [-60, 0, 30], 'forearm.R': [-90, 0, 0], 'thigh.L': [-40, 0, 10], 'shin.L': [60, 0, 0], 'thigh.R': [-30, 0, -10], 'shin.R': [60, 0, 0] }), [0, -0.22, 0], 'inOut'),
    key(0.9, S({ hips: [-8, 0, 0], spine: [-12, 0, 0], chest: [-14, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-20, 0, 80], 'forearm.L': [-20, 0, 0], 'upperarm.R': [-20, 0, -80], 'forearm.R': [-20, 0, 0], 'thigh.L': [-14, 0, 14], 'shin.L': [16, 0, 0], 'thigh.R': [-6, 0, -14], 'shin.R': [16, 0, 0] }), [0, 0.02, 0], 'outExpo'),
    key(1.5, S({ hips: [-8, 0, 0], spine: [-12, 0, 0], chest: [-14, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-22, 0, 78], 'forearm.L': [-22, 0, 0], 'upperarm.R': [-22, 0, -78], 'forearm.R': [-22, 0, 0], 'thigh.L': [-14, 0, 14], 'shin.L': [16, 0, 0], 'thigh.R': [-6, 0, -14], 'shin.R': [16, 0, 0] }), [0, 0.02, 0], 'linear'),
    key(2.0, S(), [0, -0.02, 0], 'inOut'),
  ],
};

// ---------------------------------------------------------------------------------------------- sealed (Ōken): the catch

const R_IDLE = RENJI_STANCE.idle as Record<string, E>;
const R = (over: Record<string, E> = {}): Record<string, E> => ({ ...R_IDLE, ...over });

/** R (sealed): the open left hand held out to stop a blow dead (open … close) */
const catchClip: ClipDef = {
  name: 'so_catch', dur: 0.95, fadeIn: 0.04, fadeOut: 0.22, events: { open: 0.06, close: 0.7 },
  keys: [
    key(0, R()),
    key(0.08, R({ hips: [0, -14, 0], chest: [0, -16, 0], head: [0, 14, 0], 'upperarm.L': [-80, 0, 8], 'forearm.L': [-18, 0, 0], 'hand.L': [-6, 0, 46], 'thigh.L': [-18, 0, 6], 'shin.L': [16, 0, 0], 'thigh.R': [10, 0, -6] }), [0, -0.05, 0.04], 'outExpo'),
    key(0.7, R({ hips: [0, -14, 0], chest: [0, -16, 0], head: [0, 14, 0], 'upperarm.L': [-78, 0, 8], 'forearm.L': [-20, 0, 0], 'hand.L': [-6, 0, 46], 'thigh.L': [-18, 0, 6], 'shin.L': [16, 0, 0], 'thigh.R': [10, 0, -6] }), [0, -0.05, 0.04], 'linear'),
    key(0.95, R(), [0, -0.02, 0], 'inOut'),
  ],
};

/** the counter: the left elbow raised and driven down into whoever he caught (slam) */
const elbow: ClipDef = {
  name: 'so_elbow', dur: 0.9, fadeIn: 0.03, fadeOut: 0.24, events: { slam: 0.3 },
  keys: [
    key(0, R({ 'upperarm.L': [-80, 0, 8], 'forearm.L': [-18, 0, 0] })),
    key(0.16, R({ hips: [-6, 14, 0], spine: [-8, 8, 0], chest: [-10, 12, 0], head: [-6, -10, 0], 'upperarm.L': [-150, 0, 20], 'forearm.L': [-140, 0, 0], 'thigh.L': [-16, 0, 6], 'thigh.R': [8, 0, -6] }), [0, 0.04, 0], 'out'),
    key(0.3, R({ hips: [24, -6, 0], spine: [24, -4, 0], chest: [18, -6, 0], head: [-16, 4, 0], 'upperarm.L': [-30, 0, 26], 'forearm.L': [-140, 0, 0], 'thigh.L': [-60, 0, 8], 'shin.L': [80, 0, 0], 'thigh.R': [-10, 0, -8], 'shin.R': [90, 0, 0], 'foot.R': [30, 0, 0] }), [0, -0.4, 0.1], 'outExpo'),
    key(0.6, R({ hips: [24, -6, 0], spine: [24, -4, 0], chest: [18, -6, 0], head: [-16, 4, 0], 'upperarm.L': [-30, 0, 26], 'forearm.L': [-140, 0, 0], 'thigh.L': [-60, 0, 8], 'shin.L': [80, 0, 0], 'thigh.R': [-10, 0, -8], 'shin.R': [90, 0, 0], 'foot.R': [30, 0, 0] }), [0, -0.4, 0.1], 'linear'),
    key(0.9, R(), [0, -0.02, 0], 'inOut'),
  ],
};

export const SOO_CHAIN = ['so_cut1', 'so_cut2', 'so_bash', 'so_hammer'];

export const RENJI_TYBW_CLIPS: ClipDef[] = [
  cut('so_cut1', 0), cut('so_cut2', 1), cut('so_bash', 2), hammer, punch, taiho, tensho, whirl, hurl, orochi, snake, toss, reel, zazekka, impale, bankai, catchClip, elbow,
];
