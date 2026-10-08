// Post-Dangai Ichigo's animation set (docs/kits/ichigo.md §4 Fake Karakura). Bankai v2 keeps the classic Tensa
// Zangetsu string (ICHIGO_CLIPS: slash1-5, getsuga, dash, airstep, hit_heavy) with a calmer stance — the blade low at
// his side — and adds the mountain-leveller (one horizontal sweep), the face seize and the slam that ends the carry,
// the bare-hand catch and the Final Getsuga's call. The Final Getsuga form fights with its arm: smoky backhands and
// chops, the black-blade thrust and Mugetsu. The spent human keeps his karate: jab, reverse punch, front kick,
// roundhouse, and the concrete-cracker axe kick. Events: 'step' (lunge), 'hit' (strike / blade window), 'fx'
// (effect), 'combo' (next input accepted), and the special beats named per clip.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { ICHIGO_CLIPS, ICHIGO_STANCE } from './ichigoClips';

type E3 = [number, number, number];
type B = NonNullable<KeyDef['b']>;

const SH: E3 = [-0.2, 0.17, 0.02];

/** Body key helper. */
function body(t: number, b: B, hips?: KeyDef['hips'], ease?: KeyDef['ease']): KeyDef {
  return { t, b, hips, ease };
}

/** Right-hand IK key. */
function ikR(t: number, p: E3, dir: E3, edge: E3, pole: E3, w = 1, ease?: KeyDef['ease']): KeyDef {
  return { t, ease, c: { '@gripR': p, '@dirR': dir, '@edgeR': edge, '@poleR': pole, '@ikR': [w, 0, 0] } };
}

// ------------------------------------------------------------------------------------------------ Bankai v2

/** calm: upright, the left arm loose, the black blade low at his side with the point down and forward */
const DANGAI_IDLE: B = {
  hips: [0, -8, 0], spine: [2, 2, 0], chest: [0, 4, 0], neck: [0, 0, 0], head: [2, 2, 0],
  'thigh.L': [-8, 0, 5], 'shin.L': [10, 0, 0], 'foot.L': [-2, 0, 0], 'thigh.R': [6, 0, -6], 'shin.R': [10, 0, 0], 'foot.R': [-4, 0, 0],
  'upperarm.L': [4, 0, 9], 'forearm.L': [-12, 0, 0], 'hand.L': [4, 0, 0],
};
const GRIP_IDLE = { p: [-0.31, -0.36, 0.08] as E3, dir: [-0.14, -0.7, 0.7] as E3, edge: [0.05, -0.7, -0.71] as E3, pole: [-0.55, -0.3, -0.8] as E3 };

export const DANGAI_STANCE: StanceDef = {
  idle: DANGAI_IDLE,
  idleHips: -0.02,
  run: ICHIGO_STANCE.run,
  sprint: ICHIGO_STANCE.sprint,
  swingL: 0.9,
  swingR: 0.2,
  grip: {
    idle: GRIP_IDLE,
    walk: { p: [-0.31, -0.35, 0.06], dir: [-0.14, -0.74, 0.66], edge: [0.05, -0.66, -0.75], pole: [-0.55, -0.3, -0.8] },
    run: ICHIGO_STANCE.grip!.run,
    sprint: ICHIGO_STANCE.grip!.sprint,
    air: ICHIGO_STANCE.grip!.air,
  },
};

const IDLE_KEY = (t: number, ease: KeyDef['ease'] = 'inOut'): KeyDef => body(t, DANGAI_IDLE, [0, -0.02, 0], ease);
const GRIP_KEY = (t: number, ease: KeyDef['ease'] = 'inOut'): KeyDef => ikR(t, GRIP_IDLE.p, GRIP_IDLE.dir, GRIP_IDLE.edge, GRIP_IDLE.pole, 1, ease);

/**
 * RMB — the mountain-leveller: wound far back to the right, then one level sweep right across the front and on to
 * the left, the whole body turning through it ('fx' throws the cut out across the land).
 */
const level: ClipDef = {
  name: 'dg_level',
  dur: 1.1,
  fadeIn: 0.08,
  fadeOut: 0.3,
  events: { step: 0.3, fx: 0.43, hit: 0.43 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [1, -0.12, 0], c: SH, r: 0.42, pole: [-0.45, -0.7, -0.5],
      keys: [[0, -70, 'out'], [0.3, -128, 'out'], [0.37, -124, 'linear'], [0.45, 32, 'outExpo'], [0.62, 118, 'out'], [1.1, 80, 'inOut']],
    }),
    [
      IDLE_KEY(0, 'out'),
      body(0.3, { hips: [0, -40, 0], spine: [-2, -20, 0], chest: [-4, -30, 6], head: [0, 40, 0], 'thigh.L': [-26, 0, 14], 'shin.L': [32, 0, 0], 'thigh.R': [22, 0, -12], 'shin.R': [36, 0, 0], 'upperarm.L': [-24, 0, 42], 'forearm.L': [-34, 0, 0] }, [0, -0.12, -0.04], 'out'),
      body(0.37, { hips: [0, -42, 0], spine: [-2, -22, 0], chest: [-4, -32, 6], head: [0, 42, 0] }, [0, -0.12, -0.04], 'linear'),
      body(0.45, { hips: [0, 30, 0], spine: [8, 22, 0], chest: [6, 34, -6], head: [0, -40, 0], 'thigh.L': [-36, 0, 10], 'shin.L': [36, 0, 0], 'thigh.R': [28, 0, -10], 'shin.R': [30, 0, 0], 'foot.R': [8, 0, 0], 'upperarm.L': [12, 0, 52], 'forearm.L': [-20, 0, 0] }, [0, -0.15, 0.12], 'outExpo'),
      body(0.62, { hips: [0, 40, 0], spine: [10, 26, 0], chest: [8, 38, -6], head: [0, -46, 0], 'upperarm.L': [14, 0, 56] }, [0, -0.15, 0.13], 'out'),
      IDLE_KEY(1.1),
    ],
    [{ t: 0, c: { '@look': [0.3, 0, 0] } }],
  ),
};

/** E (1) — the seize: the left hand shoots out and closes on the foe's face; the last pose holds through the carry. */
const seize: ClipDef = {
  name: 'dg_seize',
  dur: 0.4,
  fadeIn: 0.04,
  fadeOut: 0.12,
  events: { grab: 0.15 },
  keys: mergeKeys(
    [
      ikR(0, GRIP_IDLE.p, GRIP_IDLE.dir, GRIP_IDLE.edge, GRIP_IDLE.pole),
      ikR(0.15, [-0.34, -0.3, -0.12], [-0.25, -0.6, -0.76], [0.1, -0.78, 0.61], [-0.7, -0.3, 0.6], 1, 'outExpo'),
      ikR(0.4, [-0.34, -0.3, -0.14], [-0.25, -0.58, -0.78], [0.1, -0.8, 0.59], [-0.7, -0.3, 0.6]),
    ],
    [
      IDLE_KEY(0, 'out'),
      body(0.15, { hips: [0, -16, 0], spine: [10, -10, 0], chest: [6, -14, 0], head: [-4, 26, 0], 'upperarm.L': [-94, 0, -8], 'forearm.L': [-6, 0, 0], 'hand.L': [-16, 0, 0], 'thigh.L': [-34, 0, 8], 'shin.L': [30, 0, 0], 'thigh.R': [24, 0, -8], 'shin.R': [22, 0, 0] }, [0, -0.06, 0.12], 'outExpo'),
      body(0.4, { hips: [0, -18, 0], spine: [10, -10, 0], chest: [6, -16, 0], head: [-4, 28, 0], 'upperarm.L': [-96, 0, -8], 'forearm.L': [-4, 0, 0], 'hand.L': [-18, 0, 0], 'thigh.L': [-34, 0, 8], 'shin.L': [30, 0, 0], 'thigh.R': [24, 0, -8], 'shin.R': [22, 0, 0] }, [0, -0.06, 0.12], 'out'),
    ],
  ),
};

/** E (2) — the slam: the seized foe hauled up overhead and driven down into the ground ('slam'). */
const slam: ClipDef = {
  name: 'dg_slam',
  dur: 0.78,
  fadeIn: 0.05,
  fadeOut: 0.24,
  events: { slam: 0.33 },
  keys: mergeKeys(
    [
      ikR(0, [-0.34, -0.3, -0.14], [-0.25, -0.58, -0.78], [0.1, -0.8, 0.59], [-0.7, -0.3, 0.6]),
      ikR(0.33, [-0.34, -0.26, -0.1], [-0.3, -0.5, -0.81], [0.1, -0.84, 0.53], [-0.7, -0.3, 0.6], 1, 'inExpo'),
      GRIP_KEY(0.78),
    ],
    [
      body(0, { hips: [0, -18, 0], spine: [10, -10, 0], chest: [6, -16, 0], head: [-4, 28, 0], 'upperarm.L': [-96, 0, -8], 'forearm.L': [-4, 0, 0] }, [0, -0.06, 0.12]),
      body(0.18, { hips: [0, -6, 0], spine: [-14, -4, 0], chest: [-12, -6, 0], head: [-10, 10, 0], 'upperarm.L': [-160, 0, -4], 'forearm.L': [-22, 0, 0], 'hand.L': [-10, 0, 0], 'thigh.L': [-14, 0, 8], 'shin.L': [12, 0, 0], 'thigh.R': [10, 0, -8], 'shin.R': [12, 0, 0] }, [0, 0.03, 0.02], 'out'),
      body(0.33, { hips: [10, -4, 0], spine: [30, -4, 0], chest: [18, -6, 0], head: [-16, 8, 0], 'upperarm.L': [-44, 0, -6], 'forearm.L': [-8, 0, 0], 'hand.L': [-20, 0, 0], 'thigh.L': [-56, 0, 10], 'shin.L': [70, 0, 0], 'thigh.R': [30, 0, -10], 'shin.R': [60, 0, 0], 'foot.R': [20, 0, 0] }, [0, -0.3, 0.16], 'inExpo'),
      body(0.5, { hips: [12, -4, 0], spine: [32, -4, 0], chest: [20, -6, 0], head: [-16, 8, 0], 'upperarm.L': [-40, 0, -6], 'forearm.L': [-10, 0, 0], 'thigh.L': [-58, 0, 10], 'shin.L': [74, 0, 0], 'thigh.R': [32, 0, -10], 'shin.R': [64, 0, 0] }, [0, -0.31, 0.16], 'out'),
      IDLE_KEY(0.78),
    ],
  ),
};

/** R — the bare-hand catch: the left hand up and open before him, the blade held back and low ('up'). */
const catchHand: ClipDef = {
  name: 'dg_catch',
  dur: 0.95,
  fadeIn: 0.04,
  fadeOut: 0.22,
  events: { up: 0.07 },
  keys: mergeKeys(
    [GRIP_KEY(0), ikR(0.08, [-0.34, -0.33, -0.04], [-0.22, -0.72, -0.66], [0.1, -0.68, 0.73], [-0.7, -0.3, 0.6], 1, 'out'), ikR(0.75, [-0.34, -0.33, -0.05], [-0.22, -0.72, -0.66], [0.1, -0.68, 0.73], [-0.7, -0.3, 0.6]), GRIP_KEY(0.95)],
    [
      IDLE_KEY(0, 'out'),
      body(0.07, { hips: [0, -10, 0], spine: [2, -6, 0], chest: [0, -10, 0], head: [0, 14, 0], 'upperarm.L': [-80, 0, -12], 'forearm.L': [-30, 0, 0], 'hand.L': [-34, 0, 0], 'thigh.L': [-16, 0, 6], 'shin.L': [16, 0, 0], 'thigh.R': [12, 0, -6], 'shin.R': [16, 0, 0] }, [0, -0.04, 0.02], 'outExpo'),
      body(0.75, { hips: [0, -10, 0], spine: [2, -6, 0], chest: [0, -10, 0], head: [0, 14, 0], 'upperarm.L': [-82, 0, -12], 'forearm.L': [-28, 0, 0], 'hand.L': [-34, 0, 0], 'thigh.L': [-16, 0, 6], 'shin.L': [16, 0, 0], 'thigh.R': [12, 0, -6], 'shin.R': [16, 0, 0] }, [0, -0.04, 0.02], 'linear'),
      IDLE_KEY(0.95),
    ],
  ),
};

/** R (caught) — the hand closes and wrenches what it holds aside; the force goes into the ground ('crush'). */
const caught: ClipDef = {
  name: 'dg_caught',
  dur: 0.6,
  fadeIn: 0.03,
  fadeOut: 0.2,
  events: { crush: 0.12 },
  keys: mergeKeys(
    [GRIP_KEY(0)],
    [
      body(0, { hips: [0, -10, 0], spine: [2, -6, 0], chest: [0, -10, 0], head: [0, 14, 0], 'upperarm.L': [-82, 0, -12], 'forearm.L': [-28, 0, 0], 'hand.L': [-34, 0, 0] }, [0, -0.04, 0.02]),
      body(0.12, { hips: [0, 14, 0], spine: [8, 12, 0], chest: [6, 18, 0], head: [0, -10, 0], 'upperarm.L': [-62, 0, 34], 'forearm.L': [-40, 0, 0], 'hand.L': [10, 0, 0], 'thigh.L': [-22, 0, 8], 'shin.L': [26, 0, 0], 'thigh.R': [16, 0, -8], 'shin.R': [26, 0, 0] }, [0, -0.1, 0.02], 'outExpo'),
      IDLE_KEY(0.6),
    ],
  ),
};

/**
 * F — "Saigo no Getsuga Tenshō": the blade raised upright before his face, the head bowed ('fx': the black reiatsu
 * swallows him; 'burst': it tears open on the new form).
 */
const callFinal: ClipDef = {
  name: 'dg_final',
  dur: 1.2,
  fadeIn: 0.12,
  fadeOut: 0.2,
  events: { call: 0.2, fx: 0.7, burst: 1.05 },
  keys: mergeKeys(
    [
      GRIP_KEY(0),
      ikR(0.5, [-0.09, 0.05, 0.3], [0.04, 1, 0.08], [0, -0.08, 1], [-0.85, -0.45, 0.1], 1, 'inOut'),
      ikR(1.2, [-0.09, 0.06, 0.3], [0.04, 1, 0.08], [0, -0.08, 1], [-0.85, -0.45, 0.1]),
    ],
    [
      IDLE_KEY(0, 'out'),
      body(0.5, { hips: [0, -6, 0], spine: [0, 0, 0], chest: [-2, 0, 0], neck: [6, 0, 0], head: [12, 0, 0], 'thigh.L': [-10, 0, 9], 'shin.L': [10, 0, 0], 'thigh.R': [8, 0, -9], 'shin.R': [10, 0, 0], 'upperarm.L': [6, 0, 22], 'forearm.L': [-10, 0, 0], 'hand.L': [0, 0, 0] }, [0, -0.03, 0], 'inOut'),
      body(1.2, { hips: [0, -6, 0], spine: [-2, 0, 0], chest: [-4, 0, 0], neck: [4, 0, 0], head: [8, 0, 0], 'thigh.L': [-10, 0, 10], 'shin.L': [12, 0, 0], 'thigh.R': [8, 0, -10], 'shin.R': [12, 0, 0], 'upperarm.L': [6, 0, 26], 'forearm.L': [-8, 0, 0] }, [0, -0.035, 0], 'inOut'),
    ],
  ),
};

export const DANGAI_CLIPS: ClipDef[] = [...ICHIGO_CLIPS, level, seize, slam, catchHand, caught, callFinal];
export const DANGAI_CHAIN = ['slash1', 'slash2', 'slash3', 'slash4', 'slash5'];

// ------------------------------------------------------------------------------------------------ the Final Getsuga form

/** he stands quite still: upright, the arms hanging, the right one wound in black */
const FINAL_IDLE: B = {
  hips: [0, 0, 0], spine: [2, 0, 0], chest: [0, 0, 0], neck: [0, 0, 0], head: [3, 0, 0],
  'thigh.L': [-4, 0, 5], 'shin.L': [6, 0, 0], 'foot.L': [-2, 0, 0], 'thigh.R': [4, 0, -5], 'shin.R': [6, 0, 0], 'foot.R': [-2, 0, 0],
  'upperarm.L': [2, 0, 7], 'forearm.L': [-8, 0, 0], 'hand.L': [2, 0, 0],
  'upperarm.R': [2, 0, -7], 'forearm.R': [-8, 0, 0], 'hand.R': [2, 0, 0],
};

export const FINAL_STANCE: StanceDef = {
  idle: FINAL_IDLE,
  idleHips: -0.01,
  run: { spine: [6, 0, 0], 'upperarm.L': [10, 0, 10], 'forearm.L': [-16, 0, 0], 'upperarm.R': [10, 0, -10], 'forearm.R': [-16, 0, 0] },
  sprint: { spine: [10, 0, 0], 'upperarm.L': [30, 0, 14], 'forearm.L': [-10, 0, 0], 'upperarm.R': [30, 0, -14], 'forearm.R': [-10, 0, 0] },
  swingL: 0.45,
  swingR: 0.45,
};

const FIDLE = (t: number, ease: KeyDef['ease'] = 'inOut'): KeyDef => body(t, FINAL_IDLE, [0, -0.01, 0], ease);
const F = (over: B): B => ({ ...FINAL_IDLE, ...over });

/** 1: a backhand of the wound arm swept level from left to right, smoke streaming off it. */
const fg1: ClipDef = {
  name: 'fg_s1', dur: 0.46, fadeIn: 0.04, fadeOut: 0.16, events: { step: 0.04, hit: 0.14, combo: 0.22 },
  keys: [
    FIDLE(0),
    body(0.07, F({ hips: [0, 16, 0], spine: [4, 12, 0], chest: [2, 22, 0], head: [0, -22, 0], 'upperarm.R': [-72, 0, 46], 'forearm.R': [-60, 0, 0], 'hand.R': [0, 0, 0], 'thigh.L': [-14, 0, 6], 'shin.L': [14, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [14, 0, 0] }), [0, -0.04, 0.02], 'out'),
    body(0.14, F({ hips: [0, -20, 0], spine: [6, -16, 0], chest: [4, -26, 0], head: [0, 30, 0], 'upperarm.R': [-84, 0, -64], 'forearm.R': [-6, 0, 0], 'hand.R': [0, 0, 0], 'upperarm.L': [-10, 0, 26], 'thigh.L': [-28, 0, 6], 'shin.L': [24, 0, 0], 'thigh.R': [18, 0, -6], 'shin.R': [18, 0, 0] }), [0, -0.06, 0.08], 'outExpo'),
    body(0.26, F({ hips: [0, -24, 0], spine: [6, -18, 0], chest: [4, -30, 0], head: [0, 32, 0], 'upperarm.R': [-70, 0, -74], 'forearm.R': [-14, 0, 0], 'thigh.L': [-26, 0, 6], 'shin.L': [22, 0, 0] }), [0, -0.06, 0.07], 'out'),
    FIDLE(0.46),
  ],
};

/** 2: the arm raised high and brought down like a blade. */
const fg2: ClipDef = {
  name: 'fg_s2', dur: 0.5, fadeIn: 0.04, fadeOut: 0.18, events: { step: 0.05, hit: 0.18, combo: 0.28 },
  keys: [
    FIDLE(0),
    body(0.1, F({ hips: [0, -10, 0], spine: [-10, -6, 0], chest: [-8, -8, 0], head: [-6, 12, 0], 'upperarm.R': [-166, 0, -12], 'forearm.R': [-34, 0, 0], 'hand.R': [10, 0, 0] }), [0, 0.01, 0], 'out'),
    body(0.18, F({ hips: [8, -6, 0], spine: [22, -4, 0], chest: [12, -6, 0], head: [-14, 8, 0], 'upperarm.R': [-46, 0, -4], 'forearm.R': [-4, 0, 0], 'hand.R': [-6, 0, 0], 'thigh.L': [-38, 0, 6], 'shin.L': [40, 0, 0], 'thigh.R': [22, 0, -6], 'shin.R': [26, 0, 0] }), [0, -0.12, 0.1], 'outExpo'),
    body(0.32, F({ hips: [8, -6, 0], spine: [22, -4, 0], chest: [12, -6, 0], head: [-14, 8, 0], 'upperarm.R': [-40, 0, -6], 'forearm.R': [-10, 0, 0], 'thigh.L': [-36, 0, 6], 'shin.L': [38, 0, 0], 'thigh.R': [20, 0, -6], 'shin.R': [24, 0, 0] }), [0, -0.11, 0.09], 'out'),
    FIDLE(0.5),
  ],
};

/** 3: an open-handed thrust with a long step in behind it — the black smoke bursts off the palm. */
const fg3: ClipDef = {
  name: 'fg_s3', dur: 0.64, fadeIn: 0.05, fadeOut: 0.2, events: { step: 0.08, hit: 0.2, combo: 0.34 },
  keys: [
    FIDLE(0),
    body(0.1, F({ hips: [0, -30, 0], spine: [2, -12, 0], chest: [0, -16, 0], head: [0, 40, 0], 'upperarm.R': [-22, 0, -22], 'forearm.R': [-112, 0, 0], 'hand.R': [-20, 0, 0], 'thigh.L': [-16, 0, 8], 'shin.L': [20, 0, 0], 'thigh.R': [14, 0, -8], 'shin.R': [22, 0, 0] }), [0, -0.06, -0.02], 'out'),
    body(0.2, F({ hips: [0, 18, 0], spine: [12, 10, 0], chest: [8, 18, 0], head: [-4, -30, 0], 'upperarm.R': [-90, 0, 4], 'forearm.R': [-4, 0, 0], 'hand.R': [-64, 0, 0], 'upperarm.L': [-12, 0, 30], 'forearm.L': [-30, 0, 0], 'thigh.L': [-58, 0, 6], 'shin.L': [56, 0, 0], 'thigh.R': [32, 0, -6], 'shin.R': [14, 0, 0], 'foot.R': [16, 0, 0] }), [0, -0.18, 0.24], 'outExpo'),
    body(0.36, F({ hips: [0, 16, 0], spine: [12, 10, 0], chest: [8, 16, 0], head: [-4, -28, 0], 'upperarm.R': [-86, 0, 2], 'forearm.R': [-12, 0, 0], 'hand.R': [-50, 0, 0], 'thigh.L': [-56, 0, 6], 'shin.L': [56, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [16, 0, 0] }), [0, -0.17, 0.22], 'out'),
    FIDLE(0.64),
  ],
};

/** RMB — the black-blade thrust: the blade of black reiatsu forms in the right hand ('form'), drawn back, driven out. */
const thrust: ClipDef = {
  name: 'fg_thrust',
  dur: 0.86,
  fadeIn: 0.05,
  fadeOut: 0.24,
  events: { form: 0.08, step: 0.3, hit: 0.37 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@ikR': [0, 0, 0] } },
      ikR(0.29, [-0.25, -0.2, -0.14], [0.02, 0.05, 1], [0, -1, 0.05], [-0.7, -0.55, -0.4], 1, 'out'),
      ikR(0.37, [-0.1, 0.06, 0.6], [0.04, 0.02, 1], [0, -1, 0.02], [-0.7, -0.6, 0], 1, 'outExpo'),
      ikR(0.56, [-0.11, 0.05, 0.58], [0.04, 0.01, 1], [0, -1, 0.01], [-0.7, -0.6, 0]),
      { t: 0.86, ease: 'inOut', c: { '@gripR': [-0.25, -0.3, 0.1], '@dirR': [0, -0.6, 0.8], '@edgeR': [0, -0.8, -0.6], '@poleR': [-0.6, -0.5, -0.6], '@ikR': [0, 0, 0] } },
    ],
    [
      FIDLE(0, 'out'),
      body(0.29, F({ hips: [0, -36, 0], spine: [0, -14, 0], chest: [-2, -18, 0], head: [0, 46, 0], 'upperarm.L': [-30, 0, 30], 'forearm.L': [-40, 0, 0], 'thigh.L': [-22, 0, 8], 'shin.L': [26, 0, 0], 'thigh.R': [18, 0, -8], 'shin.R': [30, 0, 0] }), [0, -0.1, -0.06], 'out'),
      body(0.37, F({ hips: [0, 10, 0], spine: [12, 6, 0], chest: [8, 10, 0], head: [-6, -18, 0], 'upperarm.L': [10, 0, 34], 'forearm.L': [-20, 0, 0], 'thigh.L': [-64, 0, 6], 'shin.L': [62, 0, 0], 'thigh.R': [34, 0, -6], 'shin.R': [12, 0, 0], 'foot.R': [18, 0, 0] }), [0, -0.22, 0.28], 'outExpo'),
      body(0.56, F({ hips: [0, 8, 0], spine: [12, 6, 0], chest: [8, 8, 0], head: [-6, -16, 0], 'upperarm.L': [10, 0, 34], 'forearm.L': [-20, 0, 0], 'thigh.L': [-62, 0, 6], 'shin.L': [62, 0, 0], 'thigh.R': [32, 0, -6], 'shin.R': [14, 0, 0] }), [0, -0.21, 0.26], 'out'),
      FIDLE(0.86),
    ],
  ),
};

/**
 * F (in the form) — Mugetsu: the right arm rises slowly overhead as the black blade grows in the hand ('form') and the
 * sky goes out ('dark'); one cut straight down ('fire') and the curtain falls across everything ahead.
 */
const mugetsu: ClipDef = {
  name: 'fg_mugetsu',
  dur: 2.6,
  fadeIn: 0.12,
  fadeOut: 0.3,
  events: { form: 0.25, dark: 0.7, step: 1.36, fire: 1.46 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0, 1, 0], c: [-0.08, 0.2, 0.08], r: 0.5, sense: -1, pole: [-0.8, -0.35, -0.4],
      keys: [[0, -55, 'out'], [0.7, 92, 'inOut'], [1.36, 100, 'linear'], [1.46, -30, 'outExpo'], [1.8, -46, 'out'], [2.6, -50, 'inOut']],
    }),
    [
      { t: 0, c: { '@ikR': [0, 0, 0] } },
      { t: 0.25, c: { '@ikR': [1, 0, 0] } },
      { t: 2.6, c: { '@ikR': [0, 0, 0] } },
    ],
    [
      FIDLE(0, 'out'),
      body(0.7, F({ hips: [0, -4, 0], spine: [-8, 0, 0], chest: [-10, -2, 0], neck: [-4, 0, 0], head: [-6, 0, 0], 'thigh.L': [-12, 0, 8], 'shin.L': [12, 0, 0], 'thigh.R': [10, 0, -8], 'shin.R': [12, 0, 0], 'upperarm.L': [8, 0, 24], 'forearm.L': [-6, 0, 0] }), [0, 0.0, -0.02], 'inOut'),
      body(1.36, F({ hips: [0, -4, 0], spine: [-10, 0, 0], chest: [-12, -2, 0], neck: [-4, 0, 0], head: [-6, 0, 0], 'thigh.L': [-12, 0, 8], 'shin.L': [12, 0, 0], 'thigh.R': [10, 0, -8], 'shin.R': [12, 0, 0], 'upperarm.L': [8, 0, 26], 'forearm.L': [-6, 0, 0] }), [0, 0.0, -0.02], 'linear'),
      body(1.46, F({ hips: [10, 0, 0], spine: [28, 0, 0], chest: [14, 0, 0], neck: [4, 0, 0], head: [-14, 0, 0], 'thigh.L': [-56, 0, 8], 'shin.L': [62, 0, 0], 'foot.L': [-6, 0, 0], 'thigh.R': [30, 0, -8], 'shin.R': [40, 0, 0], 'foot.R': [-4, 0, 0], 'upperarm.L': [20, 0, 30], 'forearm.L': [-10, 0, 0] }), [0, -0.24, 0.14], 'outExpo'),
      body(1.8, F({ hips: [12, 0, 0], spine: [30, 0, 0], chest: [16, 0, 0], head: [-16, 0, 0], 'thigh.L': [-58, 0, 8], 'shin.L': [64, 0, 0], 'thigh.R': [32, 0, -8], 'shin.R': [42, 0, 0], 'upperarm.L': [20, 0, 30] }), [0, -0.25, 0.15], 'out'),
      body(2.6, F({ hips: [8, 0, 0], spine: [22, 0, 0], chest: [12, 0, 0], head: [-10, 0, 0], 'thigh.L': [-50, 0, 8], 'shin.L': [56, 0, 0], 'thigh.R': [28, 0, -8], 'shin.R': [36, 0, 0], 'upperarm.L': [14, 0, 26] }), [0, -0.21, 0.12], 'inOut'),
    ],
  ),
};

/** the black reiatsu tears open: the new form lifts its head, still, the hair settling */
const reveal: ClipDef = {
  name: 'fg_reveal',
  dur: 1.1,
  fadeIn: 0.02,
  fadeOut: 0.3,
  keys: [
    body(0, F({ spine: [10, 0, 0], chest: [8, 0, 0], neck: [10, 0, 0], head: [20, 0, 0], 'upperarm.L': [4, 0, 14], 'upperarm.R': [4, 0, -14] }), [0, -0.05, 0]),
    body(0.6, F({ spine: [4, 0, 0], chest: [2, 0, 0], neck: [2, 0, 0], head: [6, 0, 0] }), [0, -0.02, 0], 'inOut'),
    FIDLE(1.1),
  ],
};

/** the flicker-step: no travel to see — a slight lean, the body gone between two places */
const flicker: ClipDef = {
  name: 'dash',
  dur: 0.2,
  fadeIn: 0.02,
  fadeOut: 0.12,
  keys: [
    body(0, F({ spine: [12, 0, 0], chest: [6, 0, 0], head: [-10, 0, 0] }), [0, -0.03, 0]),
    body(0.2, F({ spine: [10, 0, 0], chest: [4, 0, 0], head: [-8, 0, 0] }), [0, -0.03, 0]),
  ],
};

const finalHit: ClipDef = {
  name: 'hit_heavy',
  dur: 0.5,
  fadeIn: 0.03,
  fadeOut: 0.2,
  keys: [
    body(0, F({ spine: [-10, 0, 0], chest: [-12, 0, 0], head: [-6, 0, 0] }), [0, 0, -0.03]),
    body(0.12, F({ spine: [-14, 0, 4], chest: [-16, 4, 4], head: [-10, -6, 0] }), [0, -0.03, -0.05], 'outExpo'),
    FIDLE(0.5),
  ],
};

const finalAir: ClipDef = { ...ICHIGO_CLIPS.find((c) => c.name === 'airstep')! };

export const FINAL_CLIPS: ClipDef[] = [fg1, fg2, fg3, thrust, mugetsu, reveal, flicker, finalHit, finalAir];
export const FINAL_CHAIN = ['fg_s1', 'fg_s2', 'fg_s3'];

// ------------------------------------------------------------------------------------------------ the spent human

/** karate kamae, left foot forward — tired: a little hunched, the fists not quite up */
const GUARD: B = {
  hips: [0, -22, 0], spine: [8, 6, 0], chest: [4, 10, 0], neck: [0, 0, 0], head: [-2, 6, 0],
  'thigh.L': [-18, 0, 6], 'shin.L': [20, 0, 0], 'foot.L': [-2, 0, 0], 'thigh.R': [14, 0, -8], 'shin.R': [22, 0, 0], 'foot.R': [-8, 0, 0],
  'upperarm.L': [-56, 0, 14], 'forearm.L': [-86, 0, 0], 'hand.L': [0, 0, 0],
  'upperarm.R': [-30, 0, -18], 'forearm.R': [-116, 0, 0], 'hand.R': [0, 0, 0],
};
const G = (over: B = {}): B => ({ ...GUARD, ...over });
const GKEY = (t: number, ease: KeyDef['ease'] = 'inOut'): KeyDef => body(t, GUARD, [0, -0.05, 0], ease);

export const HUMAN_STANCE: StanceDef = {
  idle: GUARD,
  idleHips: -0.05,
  run: { 'upperarm.L': [-20, 0, 10], 'forearm.L': [-70, 0, 0], 'upperarm.R': [-20, 0, -10], 'forearm.R': [-70, 0, 0], chest: [0, 4, 0] },
  sprint: { 'upperarm.L': [10, 0, 10], 'forearm.L': [-80, 0, 0], 'upperarm.R': [10, 0, -10], 'forearm.R': [-80, 0, 0] },
  swingL: 1,
  swingR: 1,
};

/** 1: the left jab, snapped straight out from the guard. */
const jab: ClipDef = {
  name: 'hm_jab', dur: 0.4, fadeIn: 0.04, fadeOut: 0.16, events: { step: 0.03, hit: 0.09, combo: 0.17 },
  keys: [
    GKEY(0),
    body(0.09, G({ hips: [0, -30, 0], chest: [4, -10, 0], head: [-2, 18, 0], 'upperarm.L': [-90, 0, -2], 'forearm.L': [-6, 0, 0], 'hand.L': [-4, 0, 0], 'thigh.L': [-28, 0, 6], 'shin.L': [24, 0, 0] }), [0, -0.06, 0.07], 'outExpo'),
    body(0.2, G({ hips: [0, -26, 0], chest: [4, -4, 0], 'upperarm.L': [-74, 0, 4], 'forearm.L': [-48, 0, 0] }), [0, -0.055, 0.04], 'out'),
    GKEY(0.4),
  ],
};

/** 2: the reverse punch — the right fist driven straight out as the left pulls back to the hip. */
const reverse: ClipDef = {
  name: 'hm_cross', dur: 0.48, fadeIn: 0.04, fadeOut: 0.18, events: { step: 0.05, hit: 0.13, combo: 0.22 },
  keys: [
    GKEY(0),
    body(0.06, G({ hips: [0, -32, 0], chest: [2, 4, 0], 'upperarm.R': [-22, 0, -14], 'forearm.R': [-124, 0, 0] }), [0, -0.06, -0.01], 'out'),
    body(0.13, G({ hips: [0, 20, 0], spine: [8, 12, 0], chest: [6, 18, 0], head: [0, -32, 0], 'upperarm.R': [-90, 0, 6], 'forearm.R': [-6, 0, 0], 'upperarm.L': [-30, 0, 14], 'forearm.L': [-120, 0, 0], 'thigh.L': [-32, 0, 6], 'shin.L': [28, 0, 0], 'thigh.R': [22, 0, -6], 'shin.R': [18, 0, 0], 'foot.R': [12, 0, 0] }), [0, -0.08, 0.09], 'outExpo'),
    body(0.26, G({ hips: [0, 16, 0], spine: [8, 10, 0], chest: [6, 16, 0], head: [0, -28, 0], 'upperarm.R': [-76, 0, 8], 'forearm.R': [-40, 0, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [26, 0, 0] }), [0, -0.075, 0.08], 'out'),
    GKEY(0.48),
  ],
};

/** 3: the front kick off the back leg — chambered high, snapped out, pulled back. */
const front: ClipDef = {
  name: 'hm_front', dur: 0.5, fadeIn: 0.04, fadeOut: 0.18, events: { step: 0.04, hit: 0.15, combo: 0.23 },
  keys: [
    GKEY(0),
    body(0.08, G({ hips: [0, -10, 0], spine: [-4, 4, 0], 'thigh.R': [-82, 0, -2], 'shin.R': [104, 0, 0], 'foot.R': [-10, 0, 0], 'thigh.L': [-8, 0, 6], 'shin.L': [22, 0, 0] }), [0, -0.04, 0.02], 'out'),
    body(0.15, G({ hips: [0, -6, 0], spine: [-12, 4, 0], chest: [-4, 6, 0], head: [8, 0, 0], 'thigh.R': [-100, 0, 0], 'shin.R': [6, 0, 0], 'foot.R': [-30, 0, 0], 'thigh.L': [-4, 0, 6], 'shin.L': [16, 0, 0] }), [0, -0.02, 0.1], 'outExpo'),
    body(0.25, G({ 'thigh.R': [-76, 0, 0], 'shin.R': [96, 0, 0], spine: [-4, 4, 0] }), [0, -0.03, 0.06], 'out'),
    GKEY(0.5),
  ],
};

/** 4: the roundhouse off the back leg — the hips turned over, the shin whipped round at head height. */
const round: ClipDef = {
  name: 'hm_round', dur: 0.62, fadeIn: 0.04, fadeOut: 0.18, events: { step: 0.06, hit: 0.21, combo: 0.32 },
  keys: [
    GKEY(0),
    body(0.1, G({ hips: [0, 18, 0], spine: [4, 4, 10], chest: [4, 2, 4], head: [0, -20, -8], 'thigh.R': [-40, 0, -58], 'shin.R': [100, 0, 0], 'foot.R': [-10, 0, 0], 'thigh.L': [-10, 0, 8], 'shin.L': [24, 0, 0] }), [0, -0.05, 0.02], 'in'),
    body(0.21, G({ hips: [0, 70, 0], spine: [-8, 10, 30], chest: [0, 6, 14], head: [0, -64, -22], 'thigh.R': [-30, 0, -112], 'shin.R': [8, 0, 0], 'foot.R': [-30, 0, 0], 'thigh.L': [-4, 0, 12], 'shin.L': [20, 0, 0], 'upperarm.R': [-20, 0, -40], 'forearm.R': [-90, 0, 0] }), [0, -0.04, 0.05], 'outExpo'),
    body(0.36, G({ hips: [0, 40, 0], spine: [2, 6, 10], head: [0, -36, -6], 'thigh.R': [-30, 0, -30], 'shin.R': [72, 0, 0], 'thigh.L': [-8, 0, 8], 'shin.L': [22, 0, 0] }), [0, -0.05, 0.04], 'inOut'),
    GKEY(0.62),
  ],
};

/** RMB — the concrete-cracker: the right leg raised straight up past the head and dropped heel-first ('fx'). */
const crack: ClipDef = {
  name: 'hm_crack', dur: 0.82, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.2, hit: 0.38, fx: 0.38 },
  keys: [
    GKEY(0),
    body(0.22, G({ hips: [0, -6, 0], spine: [-16, 4, 0], chest: [-8, 6, 0], head: [14, 0, 0], 'thigh.R': [-168, 0, -2], 'shin.R': [4, 0, 0], 'foot.R': [-30, 0, 0], 'thigh.L': [6, 0, 6], 'shin.L': [8, 0, 0], 'upperarm.L': [-20, 0, 60], 'forearm.L': [-30, 0, 0], 'upperarm.R': [-20, 0, -60], 'forearm.R': [-30, 0, 0] }), [0, 0.06, -0.03], 'out'),
    body(0.38, G({ hips: [0, -4, 0], spine: [24, 4, 0], chest: [12, 6, 0], head: [6, 0, 0], 'thigh.R': [-34, 0, 0], 'shin.R': [8, 0, 0], 'foot.R': [10, 0, 0], 'thigh.L': [30, 0, 6], 'shin.L': [46, 0, 0], 'upperarm.L': [-30, 0, 30], 'forearm.L': [-80, 0, 0], 'upperarm.R': [-30, 0, -30], 'forearm.R': [-80, 0, 0] }), [0, -0.16, 0.2], 'inExpo'),
    body(0.58, G({ spine: [18, 4, 0], 'thigh.R': [-30, 0, 0], 'shin.R': [20, 0, 0], 'thigh.L': [24, 0, 6], 'shin.L': [40, 0, 0] }), [0, -0.14, 0.18], 'inOut'),
    GKEY(0.82),
  ],
};

/** after Mugetsu: down on one knee, the head hung, the breath gone — then up again into the guard */
const spent: ClipDef = {
  name: 'sp_spent',
  dur: 2.4,
  fadeIn: 0.1,
  fadeOut: 0.4,
  keys: [
    body(0, G()),
    body(0.35, { hips: [6, -6, 0], spine: [26, 0, 0], chest: [18, 0, 0], neck: [12, 0, 0], head: [22, 0, 0], 'thigh.L': [-70, 0, 8], 'shin.L': [74, 0, 0], 'foot.L': [0, 0, 0], 'thigh.R': [6, 0, -6], 'shin.R': [96, 0, 0], 'foot.R': [36, 0, 0], 'upperarm.L': [-26, 0, 10], 'forearm.L': [-40, 0, 0], 'hand.L': [0, 0, 0], 'upperarm.R': [-6, 0, -14], 'forearm.R': [-10, 0, 0], 'hand.R': [0, 0, 0] }, [0, -0.46, 0], 'out'),
    body(1.7, { hips: [6, -6, 0], spine: [24, 0, 0], chest: [16, 0, 0], neck: [10, 0, 0], head: [16, 0, 0], 'thigh.L': [-70, 0, 8], 'shin.L': [74, 0, 0], 'thigh.R': [6, 0, -6], 'shin.R': [96, 0, 0], 'foot.R': [36, 0, 0], 'upperarm.L': [-26, 0, 10], 'forearm.L': [-40, 0, 0], 'upperarm.R': [-6, 0, -14], 'forearm.R': [-10, 0, 0] }, [0, -0.46, 0], 'inOut'),
    GKEY(2.4),
  ],
};

/** a human's dash: a low running lunge, no Shunpo */
const humanDash: ClipDef = {
  name: 'dash',
  dur: 0.34,
  fadeIn: 0.04,
  fadeOut: 0.16,
  keys: [
    body(0, G({ hips: [16, 0, 0], spine: [14, 0, 0], chest: [8, 0, 0], head: [-20, 0, 0], 'thigh.L': [-60, 0, 4], 'shin.L': [50, 0, 0], 'thigh.R': [34, 0, -4], 'shin.R': [60, 0, 0], 'upperarm.L': [-40, 0, 10], 'forearm.L': [-80, 0, 0], 'upperarm.R': [20, 0, -10], 'forearm.R': [-70, 0, 0] }), [0, -0.1, 0]),
    body(0.34, G({ hips: [12, 0, 0], spine: [10, 0, 0], head: [-16, 0, 0], 'thigh.L': [30, 0, 4], 'shin.L': [60, 0, 0], 'thigh.R': [-50, 0, -4], 'shin.R': [50, 0, 0], 'upperarm.L': [20, 0, 10], 'forearm.L': [-70, 0, 0], 'upperarm.R': [-40, 0, -10], 'forearm.R': [-80, 0, 0] }), [0, -0.1, 0]),
  ],
};

const humanHit: ClipDef = { ...ICHIGO_CLIPS.find((c) => c.name === 'hit_heavy')! };

export const HUMAN_CLIPS: ClipDef[] = [jab, reverse, front, round, crack, spent, humanDash, humanHit, finalAir];
export const HUMAN_CHAIN = ['hm_jab', 'hm_cross', 'hm_front', 'hm_round'];
