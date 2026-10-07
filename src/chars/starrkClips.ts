// Starrk's animation set. A tired slouch, head tipped, the katana hanging loose in his right hand: lazy,
// economical cuts; a Cero with no wind-up at all, from the hand or from the chest; the glove pulled off;
// the hand laid on Lilynette's head. Los Lobos: a gunslinger's stance, a pistol low in each hand; shots
// that alternate right (heavy) and left (quick), both at once, a pistol-whip; the charged right-hand Cero;
// Cero Metralleta held out at arm's length; the left gun sprayed in an arc; arms flung wide as the wolves
// pour out of the bandoleers.
//
// The pistols lie in the fist like a sword hilt: the grip along the hilt axis (@dirR), the barrel along
// the "edge" (@edgeR), so the right gun is aimed by its edge.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

const IDLE: Record<string, E> = {
  hips: [0, -6, 3], spine: [6, 2, 0], chest: [6, 2, 0], neck: [6, 0, 0], head: [-4, -6, 4],
  'thigh.L': [-6, 0, 4], 'shin.L': [8, 0, 0], 'foot.L': [-2, 0, 0], 'thigh.R': [4, 0, -4], 'shin.R': [10, 0, 0], 'foot.R': [-10, 0, 0],
  'upperarm.L': [6, 0, 8], 'forearm.L': [-10, 0, 0], 'hand.L': [4, 0, 0],
};
const I = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });

/** the left pistol low at his side, the right one too (by IK) */
const GUNS: Record<string, E> = { ...IDLE, spine: [3, 0, 0], chest: [2, 0, 0], head: [-4, -4, 2], 'upperarm.L': [8, 0, 12], 'forearm.L': [-34, 0, 0], 'hand.L': [6, 0, 0] };
const G = (over: Record<string, E> = {}): Record<string, E> => ({ ...GUNS, ...over });
/** the left arm out level, the gun on the target */
const AIM_L: Record<string, E> = { 'upperarm.L': [-88, -6, 4], 'forearm.L': [-2, 0, 0], 'hand.L': [0, 0, 0] };

/** the katana loose, point low */
const LOW = { p: [-0.3, -0.42, 0.12] as E, dir: [-0.1, -0.75, 0.66] as E, edge: [0, -0.66, -0.75] as E, pole: [-0.6, -0.3, -0.75] as E };
/** a pistol low at the side, muzzle down and forward */
const GUN_LOW = { p: [-0.3, -0.34, 0.12] as E, dir: [0, 0.8, 0.6] as E, edge: [0, -0.6, 0.8] as E, pole: [-0.6, -0.3, -0.75] as E };
/** the right pistol out level at the target */
const GUN_AIM = { p: [-0.12, 0.1, 0.52] as E, dir: [0, 1, 0] as E, edge: [0, 0, 1] as E, pole: [-0.7, -0.6, 0] as E };
/** the recoil: the muzzle kicked up */
const GUN_KICK = { p: [-0.12, 0.16, 0.46] as E, dir: [0, 0.9, -0.42] as E, edge: [0, 0.42, 0.9] as E, pole: [-0.7, -0.6, 0] as E };
type Grip = typeof LOW;
const ik = (g: Grip, two = 0) => ({ '@gripR': g.p, '@dirR': g.dir, '@edgeR': g.edge, '@poleR': g.pole, '@ikR': [1, 0, 0] as E, '@twoHand': [two, 0, 0] as E });

export const STARRK_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.02,
  run: { spine: [12, 0, 0], chest: [6, 0, 0], head: [-8, 0, 0], 'upperarm.L': [16, 0, 10], 'forearm.L': [-24, 0, 0] },
  sprint: { spine: [20, 0, 0], chest: [10, 0, 0], head: [-14, 0, 0], 'upperarm.L': [44, 0, 12], 'forearm.L': [-26, 0, 0] },
  swingL: 0.55,
  swingR: 0.15,
  freqScale: 0.9,
  grip: {
    idle: LOW,
    walk: LOW,
    run: { p: [-0.3, -0.26, -0.08], dir: [-0.2, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.3, -0.16, -0.18], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.38, -0.1, 0.1], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

export const LOBOS_STANCE: StanceDef = {
  idle: GUNS,
  idleHips: -0.03,
  run: { spine: [12, 0, 0], chest: [6, 0, 0], head: [-8, 0, 0], 'upperarm.L': [20, 0, 12], 'forearm.L': [-50, 0, 0] },
  sprint: { spine: [20, 0, 0], chest: [10, 0, 0], head: [-14, 0, 0], 'upperarm.L': [40, 0, 14], 'forearm.L': [-40, 0, 0] },
  swingL: 0.2,
  swingR: 0.1,
  freqScale: 0.9,
  grip: {
    idle: GUN_LOW,
    walk: GUN_LOW,
    run: { p: [-0.32, -0.24, 0.02], dir: [0, 0.9, 0.42], edge: [0, -0.42, 0.9], pole: [-0.8, -0.2, 0.2] },
    sprint: { p: [-0.32, -0.16, -0.08], dir: [0, 0.95, 0.3], edge: [0, -0.3, 0.95], pole: [-0.8, -0.2, 0.3] },
    air: { p: [-0.38, -0.1, 0.12], dir: [0, 0.9, 0.42], edge: [0, -0.42, 0.9], pole: [-0.4, -0.6, -0.6] },
  },
};

/** Los Lobos with Colmillo in the right hand (the left gun kept) */
export const COLMILLO_STANCE: StanceDef = { ...LOBOS_STANCE, swingR: 0.15, grip: STARRK_STANCE.grip };

const SH: E = [-0.22, 0.2, 0.04];

/**
 * The lazy cuts. The arc crosses the front a little after 'hit' opens the window (the body's twist is
 * part of where the blade points: the windup turns him right, the cut turns him back through square).
 */
const cut = (name: string, kind: 0 | 1 | 2): ClipDef => ({
  name, dur: 0.6, fadeIn: 0.05, fadeOut: 0.2, events: { step: 0.06, hit: 0.15, combo: 0.27 },
  keys: mergeKeys(
    swingKeys(kind === 0
      ? { a: [0, 0, 1], b: [1, -0.1, 0], c: SH, r: 0.4, pole: [-0.5, -0.65, -0.55], keys: [[0, -60, 'out'], [0.12, -114, 'out'], [0.21, 30, 'out'], [0.32, 94, 'out'], [0.6, 60, 'inOut']] }
      : kind === 1
        ? { a: [0, 0, 1], b: [-0.85, 0.52, 0], c: [-0.1, 0.12, 0.06], r: 0.4, pole: [-0.3, -0.4, -0.85], keys: [[0, -140, 'out'], [0.12, -120, 'out'], [0.21, 44, 'out'], [0.32, 100, 'out'], [0.6, 70, 'inOut']] }
        : { a: [0, 0, 1], b: [0, -1, 0], c: [-0.04, 0.22, 0.1], r: 0.42, pole: [-0.7, -0.2, -0.65], keys: [[0, 30, 'out'], [0.12, -124, 'out'], [0.21, 6, 'out'], [0.34, 20, 'out'], [0.6, 40, 'inOut']] }),
    [
      key(0, I()),
      key(0.12, I(kind === 1 ? { hips: [2, 16, 0], spine: [6, 12, 0], chest: [6, 16, 0], head: [-6, -8, 3] } : kind === 2 ? { hips: [-2, -10, 0], spine: [-4, -6, 0], chest: [-6, -8, 0], head: [-4, 8, 3] } : { hips: [2, -22, 0], spine: [6, -10, 0], chest: [4, -14, 0], head: [-6, 16, 3] }), [0, -0.03, 0], 'out'),
      key(0.21, I(kind === 1
        ? { hips: [2, -16, 0], spine: [6, -12, 0], chest: [4, -18, 0], head: [-6, 16, 3], 'thigh.L': [-22, 0, 5], 'shin.L': [24, 0, 0] }
        : kind === 2
          ? { hips: [6, 2, 0], spine: [10, 0, 0], chest: [8, 2, 0], head: [-8, 0, 3], 'thigh.L': [-26, 0, 5], 'shin.L': [28, 0, 0], 'thigh.R': [12, 0, -5] }
          : { hips: [4, 12, 0], spine: [8, 10, 0], chest: [6, 16, 0], head: [-6, -4, 3], 'thigh.L': [-24, 0, 5], 'shin.L': [26, 0, 0], 'thigh.R': [12, 0, -5] }), [0, -0.06, 0.06], 'out'),
      key(0.6, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
});

/** RMB (sealed): both hands, overhead, straight down */
const heavy: ClipDef = {
  name: 'st_heavy', dur: 0.85, fadeIn: 0.06, fadeOut: 0.25, events: { step: 0.12, hit: 0.3 },
  keys: mergeKeys(
    swingKeys({ a: [0, 0, 1], b: [0, -1, 0], c: [-0.04, 0.24, 0.08], r: 0.44, pole: [-0.6, -0.3, -0.7], keys: [[0, 20, 'out'], [0.16, -150, 'inOut'], [0.3, 20, 'outExpo'], [0.45, 40, 'out'], [0.85, 40, 'inOut']], twoHand: [0, 1, 1, 1, 0] }),
    [
      key(0, I()),
      key(0.16, I({ hips: [-4, 0, 0], spine: [-6, 0, 0], chest: [-8, 0, 0], head: [-2, 0, 0], 'thigh.L': [-20, 0, 8], 'thigh.R': [10, 0, -8] }), [0, 0.02, -0.04], 'inOut'),
      key(0.3, I({ hips: [12, 0, 0], spine: [14, 0, 0], chest: [8, 0, 0], head: [-12, 0, 0], 'thigh.L': [-50, 0, 8], 'shin.L': [54, 0, 0], 'thigh.R': [26, 0, -8], 'shin.R': [24, 0, 0] }), [0, -0.18, 0.2], 'outExpo'),
      key(0.85, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** Q (sealed): a Cero with no wind-up, out of the open left hand */
const ceroHand: ClipDef = {
  name: 'st_cero', dur: 0.55, fadeIn: 0.04, fadeOut: 0.2, events: { fire: 0.08 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 0.55, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.06, I({ hips: [0, -14, 0], spine: [2, -8, 0], chest: [0, -10, 0], head: [-6, 8, 0], 'upperarm.L': [-86, -10, 4], 'forearm.L': [-4, 0, 0], 'hand.L': [-20, 0, 0] }), [0, -0.02, 0], 'outExpo'),
      key(0.3, I({ hips: [0, -14, 0], spine: [2, -8, 0], chest: [0, -10, 0], head: [-6, 8, 0], 'upperarm.L': [-80, -10, 4], 'forearm.L': [-8, 0, 0], 'hand.L': [-16, 0, 0] }), [0, -0.02, 0], 'inOut'),
      key(0.55, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** …or out of his chest, with nothing but a breath */
const ceroChest: ClipDef = {
  name: 'st_cero_chest', dur: 0.6, fadeIn: 0.04, fadeOut: 0.2, events: { fire: 0.1 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 0.6, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.1, I({ hips: [-2, 0, 0], spine: [-8, 0, 0], chest: [-10, 0, 0], neck: [0, 0, 0], head: [-2, 0, 0], 'upperarm.L': [10, 0, 30], 'forearm.L': [-6, 0, 0] }), [0, 0, -0.04], 'outExpo'),
      key(0.6, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** G (sealed): the left glove pulled off with his teeth-gritting sigh: the 1 shows */
const glove: ClipDef = {
  name: 'st_glove', dur: 1.1, fadeIn: 0.08, fadeOut: 0.25, events: { off: 0.55 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 0.3, ease: 'inOut', c: ik({ p: [0.06, -0.1, 0.32], dir: [0.3, -0.2, 0.93], edge: [0, -1, 0], pole: [-0.6, -0.6, -0.4] }) }, { t: 0.55, ease: 'out', c: ik({ p: [-0.16, -0.06, 0.34], dir: [0.3, -0.2, 0.93], edge: [0, -1, 0], pole: [-0.6, -0.6, -0.4] }) }, { t: 1.1, ease: 'inOut', c: ik(LOW) }],
    [
      key(0, I()),
      key(0.3, I({ head: [8, -10, 0], 'upperarm.L': [-50, -30, -4], 'forearm.L': [-80, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.02, 0], 'inOut'),
      key(0.55, I({ head: [6, -6, 0], 'upperarm.L': [-54, -24, -4], 'forearm.L': [-76, 0, 0] }), [0, -0.02, 0], 'out'),
      key(0.8, I({ head: [-2, -10, 0], 'upperarm.L': [-40, 0, 16], 'forearm.L': [-60, 0, 0], 'hand.L': [-20, 30, 0] }), [0, -0.02, 0], 'inOut'),
      key(1.1, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** F (sealed): "Kechirase, Los Lobos" — his hand laid on Lilynette's head */
const release: ClipDef = {
  name: 'st_release', dur: 1.6, fadeIn: 0.1, fadeOut: 0.3, events: { touch: 0.45, form: 1.0 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 1.0, c: ik(LOW) }, { t: 1.2, ease: 'inOut', c: ik(GUN_LOW) }, { t: 1.6, c: ik(GUN_LOW) }],
    [
      key(0, I()),
      key(0.45, I({ hips: [2, 10, 0], spine: [6, 4, 0], chest: [4, 4, 0], head: [16, 8, 0], 'upperarm.L': [-70, 14, 8], 'forearm.L': [-16, 0, 0], 'hand.L': [24, 0, 0], 'thigh.L': [-10, 0, 6] }), [0, -0.03, 0], 'inOut'),
      key(1.0, I({ hips: [2, 10, 0], spine: [6, 4, 0], chest: [4, 4, 0], head: [12, 8, 0], 'upperarm.L': [-72, 14, 8], 'forearm.L': [-16, 0, 0], 'hand.L': [24, 0, 0], 'thigh.L': [-10, 0, 6] }), [0, -0.03, 0], 'inOut'),
      key(1.6, G(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

// ------------------------------------------------------------------ Los Lobos

/** a shot from the right gun (heavy): out, the kick, back */
const shotR = (name: string, dur = 0.42): ClipDef => ({
  name, dur, fadeIn: 0.04, fadeOut: 0.16, events: { fireR: 0.1, combo: 0.2 },
  keys: mergeKeys(
    [{ t: 0, c: ik(GUN_LOW) }, { t: 0.08, ease: 'outExpo', c: ik(GUN_AIM) }, { t: 0.13, ease: 'out', c: ik(GUN_KICK) }, { t: 0.26, ease: 'inOut', c: ik(GUN_AIM) }, { t: dur, ease: 'inOut', c: ik(GUN_LOW) }],
    [
      key(0, G()),
      key(0.08, G({ hips: [0, 24, 0], spine: [2, 12, 0], chest: [0, 14, 0], head: [-6, -16, 0], 'thigh.L': [-12, 0, 8], 'thigh.R': [10, 0, -8] }), [0, -0.04, 0], 'outExpo'),
      key(0.13, G({ hips: [0, 24, 0], spine: [-2, 12, 0], chest: [-4, 14, 0], head: [-4, -16, 0], 'thigh.L': [-12, 0, 8], 'thigh.R': [10, 0, -8] }), [0, -0.04, -0.03], 'out'),
      key(dur, G(), [0, -0.03, 0], 'inOut'),
    ],
  ),
});

/** a shot from the left gun (quick): the arm thrown out level */
const shotL = (name: string): ClipDef => ({
  name, dur: 0.38, fadeIn: 0.04, fadeOut: 0.14, events: { fireL: 0.08, combo: 0.18 },
  keys: mergeKeys(
    [{ t: 0, c: ik(GUN_LOW) }, { t: 0.38, c: ik(GUN_LOW) }],
    [
      key(0, G()),
      key(0.07, G({ hips: [0, -24, 0], spine: [2, -12, 0], chest: [0, -14, 0], head: [-6, 16, 0], ...AIM_L, 'thigh.L': [-14, 0, 8], 'thigh.R': [10, 0, -8] }), [0, -0.04, 0], 'outExpo'),
      key(0.12, G({ hips: [0, -24, 0], spine: [-2, -12, 0], chest: [-3, -14, 0], head: [-4, 16, 0], 'upperarm.L': [-96, -6, 4], 'forearm.L': [-8, 0, 0], 'hand.L': [-14, 0, 0], 'thigh.L': [-14, 0, 8], 'thigh.R': [10, 0, -8] }), [0, -0.04, -0.02], 'out'),
      key(0.38, G(), [0, -0.03, 0], 'inOut'),
    ],
  ),
});

/** both at once, arms crossed out ahead */
const shotBoth: ClipDef = {
  name: 'st_shot2', dur: 0.5, fadeIn: 0.04, fadeOut: 0.18, events: { fireR: 0.12, fireL: 0.12, combo: 0.26 },
  keys: mergeKeys(
    [{ t: 0, c: ik(GUN_LOW) }, { t: 0.1, ease: 'outExpo', c: ik({ ...GUN_AIM, p: [-0.06, 0.12, 0.5] }) }, { t: 0.15, ease: 'out', c: ik({ ...GUN_KICK, p: [-0.06, 0.18, 0.44] }) }, { t: 0.5, ease: 'inOut', c: ik(GUN_LOW) }],
    [
      key(0, G()),
      key(0.1, G({ spine: [4, 0, 0], chest: [2, 0, 0], head: [-6, 0, 0], ...AIM_L, 'thigh.L': [-20, 0, 8], 'shin.L': [22, 0, 0], 'thigh.R': [12, 0, -8] }), [0, -0.06, 0.04], 'outExpo'),
      key(0.15, G({ spine: [0, 0, 0], chest: [-3, 0, 0], head: [-4, 0, 0], 'upperarm.L': [-98, -6, 4], 'forearm.L': [-8, 0, 0], 'hand.L': [-14, 0, 0], 'thigh.L': [-20, 0, 8], 'shin.L': [22, 0, 0], 'thigh.R': [12, 0, -8] }), [0, -0.06, 0.01], 'out'),
      key(0.5, G(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** the pistol-whip: the right gun swung across, butt first */
const whip: ClipDef = {
  name: 'st_whip', dur: 0.52, fadeIn: 0.04, fadeOut: 0.18, events: { step: 0.05, hit: 0.15, combo: 0.26 },
  keys: mergeKeys(
    swingKeys({ a: [0, 0, 1], b: [1, -0.1, 0], c: SH, r: 0.38, pole: [-0.5, -0.65, -0.55], keys: [[0, -60, 'out'], [0.11, -110, 'out'], [0.19, 30, 'out'], [0.3, 80, 'out'], [0.52, 40, 'inOut']] }),
    [
      key(0, G()),
      key(0.11, G({ hips: [2, -22, 0], spine: [6, -10, 0], chest: [4, -14, 0], head: [-6, 16, 3] }), [0, -0.03, 0], 'out'),
      key(0.19, G({ hips: [4, 12, 0], spine: [8, 10, 0], chest: [6, 16, 0], head: [-6, -4, 3], 'thigh.L': [-24, 0, 5], 'shin.L': [26, 0, 0], 'thigh.R': [12, 0, -5] }), [0, -0.06, 0.06], 'out'),
      key(0.52, G(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** RMB (Los Lobos): the right gun held out and charged, the big Cero */
const charged: ClipDef = {
  name: 'st_charged', dur: 1.05, fadeIn: 0.06, fadeOut: 0.25, events: { charge: 0.12, fireR: 0.55 },
  keys: mergeKeys(
    [{ t: 0, c: ik(GUN_LOW) }, { t: 0.12, ease: 'inOut', c: ik(GUN_AIM) }, { t: 0.55, c: ik(GUN_AIM) }, { t: 0.62, ease: 'out', c: ik({ ...GUN_KICK, p: [-0.12, 0.22, 0.38] }) }, { t: 1.05, ease: 'inOut', c: ik(GUN_LOW) }],
    [
      key(0, G()),
      key(0.12, G({ hips: [0, 30, 0], spine: [2, 14, 0], chest: [0, 18, 0], head: [-6, -20, 0], 'upperarm.L': [10, 0, 20], 'thigh.L': [-14, 0, 10], 'thigh.R': [12, 0, -10], 'shin.R': [16, 0, 0] }), [0, -0.08, 0], 'inOut'),
      key(0.55, G({ hips: [0, 30, 0], spine: [2, 14, 0], chest: [0, 18, 0], head: [-6, -20, 0], 'upperarm.L': [10, 0, 20], 'thigh.L': [-14, 0, 10], 'thigh.R': [12, 0, -10], 'shin.R': [16, 0, 0] }), [0, -0.08, 0], 'linear'),
      key(0.62, G({ hips: [-4, 30, 0], spine: [-6, 14, 0], chest: [-6, 18, 0], head: [-2, -20, 0], 'upperarm.L': [10, 0, 24], 'thigh.L': [-10, 0, 10], 'thigh.R': [16, 0, -10], 'shin.R': [20, 0, 0] }), [0, -0.06, -0.12], 'out'),
      key(1.05, G(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** Q (Los Lobos): Cero Metralleta — the right gun held out while the ring of muzzles keeps firing */
const metralleta: ClipDef = {
  name: 'st_metralleta', dur: 3.4, fadeIn: 0.08, fadeOut: 0.3, events: { start: 0.25, end: 3.0 },
  keys: mergeKeys(
    [{ t: 0, c: ik(GUN_LOW) }, { t: 0.25, ease: 'inOut', c: ik(GUN_AIM) }, { t: 3.0, c: ik(GUN_AIM) }, { t: 3.4, ease: 'inOut', c: ik(GUN_LOW) }],
    [
      key(0, G()),
      key(0.25, G({ hips: [0, 32, 0], spine: [0, 14, 0], chest: [-2, 18, 0], head: [-6, -22, 0], 'upperarm.L': [14, 0, 18], 'thigh.L': [-16, 0, 10], 'thigh.R': [14, 0, -10], 'shin.R': [18, 0, 0] }), [0, -0.1, 0], 'inOut'),
      key(3.0, G({ hips: [0, 32, 0], spine: [-2, 14, 0], chest: [-4, 18, 0], head: [-4, -22, 0], 'upperarm.L': [14, 0, 18], 'thigh.L': [-16, 0, 10], 'thigh.R': [14, 0, -10], 'shin.R': [18, 0, 0] }), [0, -0.1, -0.03], 'linear'),
      key(3.4, G(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** E (Los Lobos): the left gun sprayed across, a fan of small Ceros */
const spray: ClipDef = {
  name: 'st_spray', dur: 1.6, fadeIn: 0.06, fadeOut: 0.25, events: { start: 0.15, end: 1.3 },
  keys: mergeKeys(
    [{ t: 0, c: ik(GUN_LOW) }, { t: 1.6, c: ik(GUN_LOW) }],
    [
      key(0, G()),
      key(0.15, G({ hips: [0, -6, 0], spine: [2, -8, 0], chest: [0, -12, 0], head: [-6, 14, 0], ...AIM_L, 'thigh.L': [-16, 0, 8], 'thigh.R': [12, 0, -8] }), [0, -0.05, 0], 'outExpo'),
      key(1.3, G({ hips: [0, 6, 0], spine: [2, 8, 0], chest: [0, 12, 0], head: [-6, -12, 0], ...AIM_L, 'thigh.L': [-16, 0, 8], 'thigh.R': [12, 0, -8] }), [0, -0.05, 0], 'inOut'),
      key(1.6, G(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** R (Los Lobos): the wolves — arms flung wide, head back, the pack pouring out of the bandoleers */
const wolves: ClipDef = {
  name: 'st_wolves', dur: 1.5, fadeIn: 0.08, fadeOut: 0.3, events: { pour: 0.35 },
  keys: mergeKeys(
    [{ t: 0, c: ik(GUN_LOW) }, { t: 0.35, ease: 'outExpo', c: ik({ p: [-0.46, 0.08, 0.02], dir: [0, 0.6, -0.8], edge: [-0.9, -0.3, -0.2], pole: [-0.3, -0.9, 0.2] }) }, { t: 1.1, c: ik({ p: [-0.46, 0.08, 0.02], dir: [0, 0.6, -0.8], edge: [-0.9, -0.3, -0.2], pole: [-0.3, -0.9, 0.2] }) }, { t: 1.5, ease: 'inOut', c: ik(GUN_LOW) }],
    [
      key(0, G()),
      key(0.35, G({ hips: [-2, 0, 0], spine: [-8, 0, 0], chest: [-10, 0, 0], neck: [-6, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-10, 0, 70], 'forearm.L': [-10, 0, 0], 'hand.L': [0, 0, 0], 'thigh.L': [-10, 0, 10], 'thigh.R': [8, 0, -10] }), [0, -0.02, -0.04], 'outExpo'),
      key(1.1, G({ hips: [-2, 0, 0], spine: [-6, 0, 0], chest: [-8, 0, 0], neck: [-4, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-10, 0, 66], 'forearm.L': [-12, 0, 0], 'hand.L': [0, 0, 0], 'thigh.L': [-10, 0, 10], 'thigh.R': [8, 0, -10] }), [0, -0.02, -0.04], 'inOut'),
      key(1.5, G(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** Colmillo: the reishi sword drawn out of the bandoleer along the left forearm */
const colmillo: ClipDef = {
  name: 'st_colmillo', dur: 0.7, fadeIn: 0.06, fadeOut: 0.2, events: { draw: 0.3 },
  keys: mergeKeys(
    [{ t: 0, c: ik(GUN_LOW) }, { t: 0.2, ease: 'inOut', c: ik({ p: [0.1, 0.02, 0.3], dir: [0.9, 0.1, 0.3], edge: [0, -1, 0], pole: [-0.6, -0.6, -0.4] }) }, { t: 0.36, ease: 'outExpo', c: ik({ p: [-0.36, 0.06, 0.3], dir: [-0.8, 0.3, 0.5], edge: [0, -0.9, 0.4], pole: [-0.6, -0.5, -0.6] }) }, { t: 0.7, ease: 'inOut', c: ik(LOW) }],
    [
      key(0, G()),
      key(0.2, G({ chest: [4, -16, 0], head: [-2, -10, 0], 'upperarm.L': [-60, -30, -6], 'forearm.L': [-40, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.03, 0], 'inOut'),
      key(0.36, G({ chest: [4, 14, 0], head: [-4, 4, 0], 'upperarm.L': [-30, -10, 10], 'forearm.L': [-50, 0, 0] }), [0, -0.04, 0], 'outExpo'),
      key(0.7, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** E (sealed): Sonído — gone with no shimmer, the afterimages left standing */
const feint: ClipDef = {
  name: 'st_feint', dur: 0.5, fadeIn: 0.03, fadeOut: 0.2, events: { go: 0.06, arrive: 0.2 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 0.5, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.06, I({ hips: [6, 0, 0], spine: [8, 0, 0], 'thigh.L': [-16, 0, 6], 'shin.L': [24, 0, 0], 'thigh.R': [-6, 0, -6], 'shin.R': [20, 0, 0] }), [0, -0.1, 0], 'outExpo'),
      key(0.2, I({ hips: [4, -10, 0], spine: [6, -6, 0], head: [-6, 12, 0] }), [0, -0.06, 0], 'out'),
      key(0.5, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

export const STARRK_CLIPS: ClipDef[] = [
  cut('st_cut1', 0), cut('st_cut2', 1), cut('st_cut3', 2), heavy, ceroHand, ceroChest, glove, release,
  shotR('st_shotR'), shotL('st_shotL'), shotR('st_shotR2', 0.46), shotBoth, whip, charged, metralleta, spray, wolves, colmillo, feint,
  ...ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name)),
];
export const STARRK_CHAIN = ['st_cut1', 'st_cut2', 'st_cut3', 'st_heavy'];
export const LOBOS_CHAIN = ['st_shotR', 'st_shotL', 'st_whip', 'st_shotR2', 'st_shot2'];

// ------------------------------------------------------------------ Lilynette

/** Fists on her hips, weight on one leg, chin up: spoiling for a fight she can't win. */
const LILY_IDLE: Record<string, E> = {
  hips: [0, 6, -5], spine: [-3, -2, 3], chest: [-5, -4, 2], neck: [-2, 0, 0], head: [-6, 8, -5],
  'upperarm.L': [51, -36, 44], 'forearm.L': [-97, 0, 0], 'hand.L': [59, 0, 0],
  'upperarm.R': [51, 36, -44], 'forearm.R': [-97, 0, 0], 'hand.R': [59, 0, 0],
  'thigh.L': [-4, 0, 7], 'shin.L': [6, 0, 0], 'foot.L': [-2, 0, -4], 'thigh.R': [2, 0, -2], 'shin.R': [2, 0, 0],
};
const LI = (over: Record<string, E> = {}): Record<string, E> => ({ ...LILY_IDLE, ...over });
/** the arms free (running, fighting) */
const LILY_FREE: Record<string, E> = { 'upperarm.L': [8, 0, 14], 'forearm.L': [-30, 0, 0], 'hand.L': [0, 0, 0], 'upperarm.R': [8, 0, -14], 'forearm.R': [-30, 0, 0], 'hand.R': [0, 0, 0] };
const LF = (over: Record<string, E> = {}): Record<string, E> => ({ ...LILY_IDLE, ...LILY_FREE, ...over });
/** her scimitar held out in front, point up and forward */
const LILY_GUARD = { p: [-0.16, -0.12, 0.26] as E, dir: [0.1, 0.6, 0.8] as E, edge: [0, 0.8, -0.6] as E, pole: [-0.6, -0.5, -0.6] as E };

export const LILY_STANCE: StanceDef = {
  idle: LILY_IDLE,
  idleHips: -0.01,
  run: { spine: [16, 0, 0], chest: [8, 0, 0], head: [-10, 0, 0], ...LILY_FREE, 'upperarm.L': [10, 0, 10], 'upperarm.R': [10, 0, -10], 'forearm.L': [-70, 0, 0], 'forearm.R': [-70, 0, 0] },
  sprint: { spine: [26, 0, 0], chest: [12, 0, 0], head: [-16, 0, 0], ...LILY_FREE, 'upperarm.L': [40, 0, 14], 'upperarm.R': [40, 0, -14], 'forearm.L': [-40, 0, 0], 'forearm.R': [-40, 0, 0] },
  swingL: 1,
  swingR: 1,
  freqScale: 1.12,
};

/** with the scimitar out */
export const LILY_ARMED_STANCE: StanceDef = {
  ...LILY_STANCE,
  idle: LF({ 'upperarm.L': [4, 0, 16], 'forearm.L': [-24, 0, 0] }),
  swingR: 0.2,
  grip: { idle: LILY_GUARD, walk: LILY_GUARD, run: { p: [-0.2, -0.16, -0.04], dir: [-0.1, -0.2, -0.97], edge: [0, -0.97, 0.2], pole: [-0.8, -0.2, 0.5] } },
};

/** a flying kick, right foot first */
const llKick: ClipDef = {
  name: 'll_kick', dur: 0.62, fadeIn: 0.04, fadeOut: 0.2, events: { hop: 0.06, hit: 0.22 },
  keys: [
    key(0, LF()),
    key(0.08, LF({ hips: [-6, 0, 0], spine: [-8, 0, 0], 'thigh.R': [-70, 0, -6], 'shin.R': [100, 0, 0], 'thigh.L': [-10, 0, 6], 'shin.L': [40, 0, 0], 'upperarm.L': [-20, 0, 50], 'upperarm.R': [10, 0, -60] }), [0, 0.12, -0.04], 'out'),
    key(0.22, LF({ hips: [-18, 0, 0], spine: [-14, 0, 0], chest: [-6, 0, 0], head: [8, 0, 0], 'thigh.R': [-100, 0, -4], 'shin.R': [4, 0, 0], 'foot.R': [30, 0, 0], 'thigh.L': [20, 0, 6], 'shin.L': [80, 0, 0], 'upperarm.L': [-40, 0, 70], 'upperarm.R': [20, 0, -70] }), [0, 0.18, 0.06], 'outExpo'),
    key(0.4, LF({ hips: [-8, 0, 0], 'thigh.R': [-40, 0, -4], 'shin.R': [50, 0, 0], 'thigh.L': [-20, 0, 6], 'shin.L': [40, 0, 0] }), [0, 0.04, 0.04], 'inOut'),
    key(0.62, LF(), [0, 0, 0], 'inOut'),
  ],
};

/** the horn: rocked back, then the whole head driven forward */
const llHead: ClipDef = {
  name: 'll_head', dur: 0.66, fadeIn: 0.05, fadeOut: 0.2, events: { hit: 0.3 },
  keys: [
    key(0, LF()),
    key(0.16, LF({ hips: [-8, 0, 0], spine: [-14, 0, 0], chest: [-12, 0, 0], neck: [-12, 0, 0], head: [-16, 0, 0], 'upperarm.L': [20, 0, 30], 'upperarm.R': [20, 0, -30], 'forearm.L': [-60, 0, 0], 'forearm.R': [-60, 0, 0], 'thigh.L': [-14, 0, 6], 'shin.L': [20, 0, 0] }), [0, -0.02, -0.06], 'inOut'),
    key(0.3, LF({ hips: [14, 0, 0], spine: [22, 0, 0], chest: [16, 0, 0], neck: [14, 0, 0], head: [20, 0, 0], 'upperarm.L': [40, 0, 20], 'upperarm.R': [40, 0, -20], 'thigh.L': [-46, 0, 6], 'shin.L': [50, 0, 0], 'thigh.R': [20, 0, -6], 'shin.R': [20, 0, 0] }), [0, -0.08, 0.16], 'outExpo'),
    key(0.66, LF(), [0, 0, 0], 'inOut'),
  ],
};

/** her scimitar flailed three times, wild and fast */
const llSlash: ClipDef = {
  name: 'll_slash', dur: 0.95, fadeIn: 0.04, fadeOut: 0.22, events: { hit1: 0.14, hit2: 0.38, hit3: 0.64 },
  keys: mergeKeys(
    swingKeys({ a: [0, 0, 1], b: [1, -0.1, 0], c: [-0.14, 0.12, 0.04], r: 0.3, pole: [-0.5, -0.65, -0.55], keys: [[0, -40, 'out'], [0.07, -110, 'out'], [0.14, 30, 'outExpo'], [0.24, 70, 'out'], [0.31, 120, 'out'], [0.38, -20, 'outExpo'], [0.48, -80, 'out'], [0.56, -130, 'out'], [0.64, 20, 'outExpo'], [0.78, 80, 'out'], [0.95, 40, 'inOut']] }),
    [
      key(0, LF()),
      key(0.07, LF({ hips: [2, -20, 0], spine: [6, -10, 0], chest: [4, -14, 0], head: [-6, 14, 0] }), [0, -0.02, 0], 'out'),
      key(0.14, LF({ hips: [4, 14, 0], spine: [8, 10, 0], chest: [6, 16, 0], head: [-6, -6, 0], 'thigh.L': [-24, 0, 5], 'shin.L': [26, 0, 0] }), [0, -0.05, 0.05], 'outExpo'),
      key(0.31, LF({ hips: [2, 18, 0], spine: [6, 12, 0], chest: [4, 16, 0], head: [-6, -10, 0] }), [0, -0.03, 0.02], 'out'),
      key(0.38, LF({ hips: [4, -16, 0], spine: [8, -12, 0], chest: [6, -18, 0], head: [-6, 10, 0], 'thigh.R': [-20, 0, -5], 'shin.R': [24, 0, 0] }), [0, -0.05, 0.06], 'outExpo'),
      key(0.56, LF({ hips: [-2, -8, 0], spine: [-8, -4, 0], chest: [-8, -6, 0], head: [0, 6, 0] }), [0, 0.02, 0], 'out'),
      key(0.64, LF({ hips: [10, 10, 0], spine: [14, 8, 0], chest: [10, 10, 0], head: [-10, -4, 0], 'thigh.L': [-36, 0, 5], 'shin.L': [40, 0, 0], 'thigh.R': [16, 0, -5] }), [0, -0.1, 0.1], 'outExpo'),
      key(0.95, LF(), [0, 0, 0], 'inOut'),
    ],
  ),
};

/** her sword out of the horn's stump: up to the head, a yank, the blade out */
const llDraw: ClipDef = {
  name: 'll_draw', dur: 0.55, fadeIn: 0.05, fadeOut: 0.18, events: { draw: 0.26 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LILY_GUARD) }, { t: 0.2, ease: 'inOut', c: ik({ p: [0.04, 0.36, 0.06], dir: [0.1, 1, 0], edge: [0, 0, 1], pole: [-0.6, 0.2, -0.6] }) }, { t: 0.32, ease: 'outExpo', c: ik({ p: [-0.2, 0.2, 0.2], dir: [-0.3, 0.8, 0.5], edge: [0, 0.5, -0.86], pole: [-0.6, -0.5, -0.6] }) }, { t: 0.55, ease: 'inOut', c: ik(LILY_GUARD) }],
    [
      key(0, LF()),
      key(0.2, LF({ head: [6, -12, 6], neck: [4, 0, 0] }), [0, -0.02, 0], 'inOut'),
      key(0.32, LF({ head: [-4, 4, 0], chest: [-4, 6, 0] }), [0, 0, 0], 'outExpo'),
      key(0.55, LF(), [0, 0, 0], 'inOut'),
    ],
  ),
};

/** her Cero, out of the masked eye: leaning in, fists back, the face pushed forward */
const llCero: ClipDef = {
  name: 'll_cero', dur: 1.0, fadeIn: 0.06, fadeOut: 0.25, events: { charge: 0.06, fire: 0.5 },
  keys: [
    key(0, LF()),
    key(0.12, LF({ hips: [6, 0, 0], spine: [10, 0, 0], chest: [8, 0, 0], neck: [-6, 0, 0], head: [-8, 0, 0], 'upperarm.L': [30, 0, 16], 'upperarm.R': [30, 0, -16], 'forearm.L': [-50, 0, 0], 'forearm.R': [-50, 0, 0], 'thigh.L': [-24, 0, 8], 'shin.L': [30, 0, 0], 'thigh.R': [14, 0, -8], 'shin.R': [20, 0, 0] }), [0, -0.08, 0], 'inOut'),
    key(0.5, LF({ hips: [8, 0, 0], spine: [12, 0, 0], chest: [10, 0, 0], neck: [-8, 0, 0], head: [-10, 0, 0], 'upperarm.L': [36, 0, 18], 'upperarm.R': [36, 0, -18], 'forearm.L': [-56, 0, 0], 'forearm.R': [-56, 0, 0], 'thigh.L': [-24, 0, 8], 'shin.L': [30, 0, 0], 'thigh.R': [14, 0, -8], 'shin.R': [20, 0, 0] }), [0, -0.09, 0.02], 'linear'),
    key(0.6, LF({ hips: [-4, 0, 0], spine: [-6, 0, 0], chest: [-4, 0, 0], neck: [-2, 0, 0], head: [-4, 0, 0], 'thigh.L': [-14, 0, 8], 'shin.L': [20, 0, 0], 'thigh.R': [20, 0, -8], 'shin.R': [24, 0, 0] }), [0, -0.05, -0.08], 'out'),
    key(1.0, LF(), [0, 0, 0], 'inOut'),
  ],
};

/** "Sutāku!": arms thrown up, yelling at him */
const llYell: ClipDef = {
  name: 'll_yell', dur: 1.0, fadeIn: 0.06, fadeOut: 0.25, events: {},
  keys: [
    key(0, LI()),
    key(0.15, LF({ spine: [-6, 0, 0], chest: [-8, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-150, 0, 20], 'forearm.L': [-30, 0, 0], 'upperarm.R': [-150, 0, -20], 'forearm.R': [-30, 0, 0] }), [0, 0.04, 0], 'outExpo'),
    key(0.32, LF({ spine: [-4, 0, 0], chest: [-6, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-140, 0, 24], 'forearm.L': [-44, 0, 0], 'upperarm.R': [-140, 0, -24], 'forearm.R': [-44, 0, 0] }), [0, 0.01, 0], 'inOut'),
    key(0.5, LF({ spine: [-6, 0, 0], chest: [-8, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-150, 0, 20], 'forearm.L': [-30, 0, 0], 'upperarm.R': [-150, 0, -20], 'forearm.R': [-30, 0, 0] }), [0, 0.04, 0], 'inOut'),
    key(1.0, LI(), [0, 0, 0], 'inOut'),
  ],
};

/** the release: she stands still under his hand, head bowed, and comes apart */
const llMerge: ClipDef = {
  name: 'll_merge', dur: 1.2, fadeIn: 0.15, fadeOut: 0.2, events: {},
  keys: [
    key(0, LI()),
    key(0.4, LF({ spine: [2, 0, 0], chest: [4, 0, 0], neck: [8, 0, 0], head: [10, 0, 0], 'upperarm.L': [4, 0, 6], 'upperarm.R': [4, 0, -6], 'forearm.L': [-10, 0, 0], 'forearm.R': [-10, 0, 0], 'thigh.L': [0, 0, 2], 'thigh.R': [0, 0, -2] }), [0, 0, 0], 'inOut'),
    key(1.2, LF({ spine: [2, 0, 0], chest: [4, 0, 0], neck: [8, 0, 0], head: [12, 0, 0], 'upperarm.L': [4, 0, 6], 'upperarm.R': [4, 0, -6], 'forearm.L': [-10, 0, 0], 'forearm.R': [-10, 0, 0], 'thigh.L': [0, 0, 2], 'thigh.R': [0, 0, -2] }), [0, 0, 0], 'linear'),
  ],
};

export const LILY_CLIPS: ClipDef[] = [llKick, llHead, llSlash, llDraw, llCero, llYell, llMerge];
