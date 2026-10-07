// Isshin Kurosaki's animation set (docs/roster/A1-ichigo.md §3). Shinigami: a relaxed one-handed hold on Engetsu,
// the kendō string (men — the overhead; kote — a short diagonal; dō — the body cut; tsuki — the thrust), all
// two-handed; Agitowari, the one vertical cut from the jaw down; his Getsuga, an overhead slam; Oni Dekopin, the
// demon forehead flick with the left hand; Chōhigezutsuki, the headbutt; Kaikyō Kotei, the corded rods thrown out;
// "Moero, Engetsu" with the blade raised before his face; the blood-flame blast (the left palm wiped along the
// blade, then a thrust). The doctor (no sword): a goofy boxer's guard, palm, elbow, knee, the Flying Double Knee,
// the same headbutt and flick, field medicine, a charm, and stepping out of the gigai.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type C3 = [number, number, number];

function grip(p: C3, dir: C3, pole: C3, ref: C3 = [0, -1, 0]): Record<string, C3> {
  const l = Math.hypot(dir[0], dir[1], dir[2]) || 1;
  const d: C3 = [dir[0] / l, dir[1] / l, dir[2] / l];
  let k = ref[0] * d[0] + ref[1] * d[1] + ref[2] * d[2];
  let e: C3 = [ref[0] - d[0] * k, ref[1] - d[1] * k, ref[2] - d[2] * k];
  if (Math.hypot(e[0], e[1], e[2]) < 0.2) {
    k = d[2];
    e = [-d[0] * k, -d[1] * k, 1 - d[2] * k];
  }
  const el = Math.hypot(e[0], e[1], e[2]) || 1;
  e = [e[0] / el, e[1] / el, e[2] / el];
  return { '@gripR': p, '@dirR': d, '@edgeR': e, '@poleR': pole, '@ikR': [1, 0, 0] };
}

function body(t: number, b: KeyDef['b'], hips?: KeyDef['hips'], ease?: KeyDef['ease']): KeyDef {
  return { t, b, hips, ease };
}

const two = (t: number, w: number, ease?: KeyDef['ease']): KeyDef => ({ t, ease, c: { '@twoHand': [w, 0, 0] } });

// ------------------------------------------------------------------ Shinigami

const IDLE_B = {
  hips: [0, -10, 0], spine: [3, 4, 0], chest: [2, 6, 0], neck: [0, 0, 0], head: [2, 0, 0],
  'thigh.L': [-12, 0, 5], 'shin.L': [14, 0, 0], 'foot.L': [-2, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [16, 0, 0], 'foot.R': [-8, 0, 0],
  'upperarm.L': [6, 0, 12], 'forearm.L': [-20, 0, 0], 'hand.L': [6, 0, 0],
} as NonNullable<KeyDef['b']>;
const IDLE_HIPS: C3 = [0, -0.03, 0];
const G_IDLE = { p: [-0.26, -0.3, 0.2] as C3, dir: [0.05, -0.35, 0.94] as C3, edge: [0, -0.94, -0.35] as C3, pole: [-0.55, -0.3, -0.8] as C3 };
const GRIP_IDLE = { '@gripR': G_IDLE.p, '@dirR': G_IDLE.dir, '@edgeR': G_IDLE.edge, '@poleR': G_IDLE.pole, '@ikR': [1, 0, 0] as C3 };

/** Easy and upright, Engetsu low in the right hand pointing at the ground ahead. */
export const ISSHIN_STANCE: StanceDef = {
  idle: IDLE_B,
  idleHips: -0.03,
  run: { 'upperarm.L': [-6, 0, 4], chest: [0, 6, 0] },
  sprint: { 'upperarm.L': [12, 0, 10], 'forearm.L': [-30, 0, 0] },
  swingL: 1,
  swingR: 0.2,
  grip: {
    idle: G_IDLE,
    walk: { p: [-0.27, -0.3, 0.14], dir: [0, -0.5, 0.86], edge: [0, -0.86, -0.5], pole: [-0.55, -0.3, -0.8] },
    run: { p: [-0.3, -0.26, -0.06], dir: [-0.22, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.29, -0.16, -0.16], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.38, -0.08, 0.12], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

// men: the two-handed overhead, straight down
const men: ClipDef = {
  name: 'is_men', dur: 0.6, fadeIn: 0.05, fadeOut: 0.2,
  events: { step: 0.1, hit: 0.2, combo: 0.3 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0, -1, 0], c: [-0.03, 0.2, 0.1], r: 0.36, pole: [-0.7, -0.2, -0.65],
      keys: [[0, 20, 'out'], [0.12, -150, 'out'], [0.16, -146, 'linear'], [0.21, 8, 'out'], [0.34, 18, 'out'], [0.6, 40, 'inOut']],
      twoHand: [0.4, 1, 1, 1, 1, 0.3],
    }),
    [
      body(0, IDLE_B, IDLE_HIPS),
      body(0.12, { hips: [0, -4, 0], spine: [-10, 0, 0], chest: [-12, 2, 0], neck: [-6, 0, 0], head: [-8, 0, 0], 'thigh.L': [-8, 0, 4], 'thigh.R': [8, 0, -4], 'shin.L': [10, 0, 0] }, [0, 0.02, -0.03], 'out'),
      body(0.21, { hips: [6, 0, 0], spine: [18, 0, 0], chest: [14, 2, 0], neck: [4, 0, 0], head: [-12, 0, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [42, 0, 0], 'thigh.R': [24, 0, -4], 'shin.R': [26, 0, 0] }, [0, -0.1, 0.1], 'out'),
      body(0.34, { hips: [8, 0, 0], spine: [20, 0, 0], chest: [16, 2, 0], head: [-12, 0, 0], 'thigh.L': [-42, 0, 6], 'shin.L': [44, 0, 0], 'thigh.R': [26, 0, -4], 'shin.R': [28, 0, 0] }, [0, -0.11, 0.11], 'out'),
      body(0.6, IDLE_B, IDLE_HIPS, 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.2, 0, 0] } }],
  ),
};

// kote: a short, quick diagonal from high on the right down to the left
const kote: ClipDef = {
  name: 'is_kote', dur: 0.5, fadeIn: 0.04, fadeOut: 0.18,
  events: { step: 0.05, hit: 0.13, combo: 0.24 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0.7, -0.7, 0], c: [-0.06, 0.16, 0.08], r: 0.34, pole: [-0.6, -0.4, -0.6],
      keys: [[0, -40, 'out'], [0.07, -110, 'out'], [0.13, 22, 'out'], [0.26, 45, 'out'], [0.5, 30, 'inOut']],
      twoHand: [0.5, 1, 1, 0.8, 0.3],
    }),
    [
      body(0, IDLE_B, IDLE_HIPS),
      body(0.07, { hips: [0, -18, 0], spine: [2, -12, 0], chest: [-2, -16, 0], head: [0, 14, 0], 'thigh.L': [-14, 0, 6], 'thigh.R': [12, 0, -6], 'shin.R': [20, 0, 0] }, [0, -0.05, 0], 'out'),
      body(0.13, { hips: [4, 12, 0], spine: [8, 12, 0], chest: [8, 16, 0], head: [0, -12, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [28, 0, 0], 'thigh.R': [20, 0, -4], 'shin.R': [22, 0, 0] }, [0, -0.08, 0.07], 'out'),
      body(0.26, { hips: [4, 14, 0], spine: [8, 14, 0], chest: [8, 18, 0], head: [0, -14, 0], 'thigh.L': [-28, 0, 6], 'shin.L': [26, 0, 0], 'thigh.R': [18, 0, -4], 'shin.R': [22, 0, 0] }, [0, -0.08, 0.08], 'out'),
      body(0.5, IDLE_B, IDLE_HIPS, 'inOut'),
    ],
  ),
};

// dō: the body cut, flat across from his right to his left at the waist
const dou: ClipDef = {
  name: 'is_do', dur: 0.58, fadeIn: 0.05, fadeOut: 0.2,
  events: { step: 0.06, hit: 0.15, combo: 0.27 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [1, -0.05, 0], c: [-0.18, 0.02, 0.04], r: 0.34, pole: [-0.5, -0.6, -0.5],
      keys: [[0, -60, 'out'], [0.09, -120, 'out'], [0.16, 30, 'out'], [0.3, 100, 'out'], [0.58, 60, 'inOut']],
      twoHand: [0.4, 1, 1, 0.6, 0.3],
    }),
    [
      body(0, IDLE_B, IDLE_HIPS),
      body(0.09, { hips: [0, -26, 0], spine: [4, -18, 0], chest: [0, -24, 4], head: [0, 22, 0], 'thigh.L': [-14, 0, 6], 'thigh.R': [12, 0, -6], 'shin.R': [22, 0, 0] }, [0, -0.06, -0.02], 'out'),
      body(0.16, { hips: [0, 16, 0], spine: [8, 16, 0], chest: [6, 26, -4], head: [0, -20, 0], 'thigh.L': [-32, 0, 6], 'shin.L': [30, 0, 0], 'thigh.R': [24, 0, -4], 'shin.R': [26, 0, 0] }, [0, -0.1, 0.07], 'out'),
      body(0.3, { hips: [0, 24, 0], spine: [10, 20, 0], chest: [8, 30, -4], head: [0, -24, 0], 'thigh.L': [-30, 0, 6], 'thigh.R': [22, 0, -4] }, [0, -0.1, 0.08], 'out'),
      body(0.58, IDLE_B, IDLE_HIPS, 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.3, 0, 0] } }],
  ),
};

// tsuki: drawn back to the chest, then driven straight out, both hands
const tsuki: ClipDef = {
  name: 'is_tsuki', dur: 0.68, fadeIn: 0.05, fadeOut: 0.22,
  events: { step: 0.12, hit: 0.2 },
  keys: mergeKeys(
    [
      { t: 0, c: GRIP_IDLE },
      // the body leans ~30° into the thrust: in chest space the blade points that much up, so it flies level
      { t: 0.12, ease: 'inOut', c: grip([-0.16, -0.08, 0.04], [0.04, 0.3, 1], [-0.8, -0.3, -0.3]) },
      { t: 0.2, ease: 'outExpo', c: grip([-0.06, 0.24, 0.58], [0.03, 0.5, 0.87], [-0.7, -0.6, 0]) },
      { t: 0.4, ease: 'out', c: grip([-0.07, 0.23, 0.56], [0.03, 0.48, 0.88], [-0.7, -0.6, 0]) },
      { t: 0.68, ease: 'inOut', c: GRIP_IDLE },
      two(0, 0.3), two(0.1, 1, 'out'), two(0.42, 1), two(0.68, 0, 'inOut'),
    ],
    [
      body(0, IDLE_B, IDLE_HIPS),
      body(0.12, { hips: [4, -24, 0], spine: [6, -14, 0], chest: [4, -16, 0], head: [-4, 20, 0], 'thigh.L': [-26, 0, 10], 'shin.L': [36, 0, 0], 'thigh.R': [14, 0, -10], 'shin.R': [36, 0, 0] }, [0, -0.1, -0.04], 'inOut'),
      body(0.2, { hips: [10, 10, 0], spine: [12, 8, 0], chest: [8, 10, 0], head: [-12, -8, 0], 'thigh.L': [-58, 0, 8], 'shin.L': [58, 0, 0], 'thigh.R': [34, 0, -8], 'shin.R': [24, 0, 0] }, [0, -0.13, 0.2], 'outExpo'),
      body(0.4, { hips: [10, 10, 0], spine: [12, 8, 0], chest: [8, 10, 0], head: [-12, -8, 0], 'thigh.L': [-56, 0, 8], 'shin.L': [56, 0, 0], 'thigh.R': [32, 0, -8], 'shin.R': [24, 0, 0] }, [0, -0.13, 0.2], 'out'),
      body(0.68, IDLE_B, IDLE_HIPS, 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.3, 0, 0] } }],
  ),
};

// Agitowari: raised high, a step in, and one vertical cut from the jaw down to the ground
const agito: ClipDef = {
  name: 'is_agito', dur: 1.1, fadeIn: 0.06, fadeOut: 0.26,
  events: { charge: 0.1, step: 0.4, hit: 0.48, fx: 0.5 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0, -1, 0], c: [-0.03, 0.22, 0.12], r: 0.4, pole: [-0.7, -0.2, -0.65],
      keys: [[0, 20, 'out'], [0.3, -165, 'out'], [0.42, -160, 'linear'], [0.5, 70, 'out'], [0.7, 78, 'out'], [1.1, 40, 'inOut']],
      twoHand: [0.4, 1, 1, 1, 1, 0.3],
    }),
    [
      body(0, IDLE_B, IDLE_HIPS),
      body(0.3, { hips: [-4, -6, 0], spine: [-14, 0, 0], chest: [-18, 4, 0], neck: [-8, 0, 0], head: [-10, 0, 0], 'thigh.L': [-10, 0, 4], 'shin.L': [12, 0, 0], 'thigh.R': [10, 0, -4], 'shin.R': [10, 0, 0] }, [0, 0.04, -0.05], 'out'),
      body(0.42, { hips: [-4, -6, 0], spine: [-16, 0, 0], chest: [-20, 4, 0], neck: [-8, 0, 0], head: [-10, 0, 0] }, [0, 0.05, -0.05], 'linear'),
      body(0.5, { hips: [14, 0, 0], spine: [26, 0, 0], chest: [22, 2, 0], neck: [8, 0, 0], head: [-16, 0, 0], 'thigh.L': [-60, 0, 6], 'shin.L': [66, 0, 0], 'foot.L': [-6, 0, 0], 'thigh.R': [30, 0, -4], 'shin.R': [40, 0, 0], 'foot.R': [-12, 0, 0] }, [0, -0.2, 0.16], 'out'),
      body(0.7, { hips: [16, 0, 0], spine: [28, 0, 0], chest: [24, 2, 0], head: [-16, 0, 0], 'thigh.L': [-62, 0, 6], 'shin.L': [68, 0, 0], 'thigh.R': [32, 0, -4], 'shin.R': [42, 0, 0] }, [0, -0.21, 0.17], 'out'),
      body(1.1, IDLE_B, IDLE_HIPS, 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.2, 0, 0] } }],
  ),
};

// his Getsuga: the reiatsu gathered in the raised blade, then an overhead slam that throws a short crescent
const getsuga: ClipDef = {
  name: 'is_getsuga', dur: 1.15, fadeIn: 0.08, fadeOut: 0.28,
  events: { charge: 0.06, fx: 0.52, hit: 0.52 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0, -1, 0], c: [-0.03, 0.22, 0.12], r: 0.42, pole: [-0.7, -0.2, -0.65],
      keys: [[0, 20, 'out'], [0.34, -160, 'out'], [0.46, -156, 'linear'], [0.52, 30, 'out'], [0.72, 44, 'out'], [1.15, 40, 'inOut']],
      twoHand: [0.4, 1, 1, 1, 1, 0.3],
    }),
    [
      body(0, IDLE_B, IDLE_HIPS),
      body(0.34, { hips: [-4, -8, 0], spine: [-14, 0, 0], chest: [-18, 6, 0], neck: [-8, 0, 0], head: [-12, 0, 0], 'thigh.L': [-14, 0, 6], 'shin.L': [16, 0, 0], 'thigh.R': [12, 0, -6], 'shin.R': [14, 0, 0] }, [0, 0.03, -0.04], 'out'),
      body(0.46, { hips: [-4, -8, 0], spine: [-16, 0, 0], chest: [-20, 6, 0], neck: [-8, 0, 0], head: [-12, 0, 0] }, [0, 0.04, -0.04], 'linear'),
      body(0.52, { hips: [12, 0, 0], spine: [24, 0, 0], chest: [20, 2, 0], neck: [6, 0, 0], head: [-14, 0, 0], 'thigh.L': [-52, 0, 6], 'shin.L': [58, 0, 0], 'thigh.R': [28, 0, -4], 'shin.R': [34, 0, 0] }, [0, -0.16, 0.12], 'out'),
      body(0.72, { hips: [14, 0, 0], spine: [26, 0, 0], chest: [22, 2, 0], head: [-14, 0, 0], 'thigh.L': [-54, 0, 6], 'shin.L': [60, 0, 0], 'thigh.R': [30, 0, -4], 'shin.R': [36, 0, 0] }, [0, -0.17, 0.13], 'out'),
      body(1.15, IDLE_B, IDLE_HIPS, 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.4, 0, 0] } }],
  ),
};

/** the left arm out at the target's forehead, the wrist cocked, then the flick (both forms) */
function flickKeys(idle: NonNullable<KeyDef['b']>, hips: C3): KeyDef[] {
  return [
    body(0, idle, hips),
    body(0.18, { hips: [0, -16, 0], spine: [2, -10, 0], chest: [0, -16, 0], head: [-2, 12, 0], 'upperarm.L': [-94, 0, -4], 'forearm.L': [-6, 0, 0], 'hand.L': [-34, 0, 0], 'thigh.L': [-22, 0, 8], 'shin.L': [24, 0, 0], 'thigh.R': [14, 0, -8], 'shin.R': [22, 0, 0] }, [0, -0.04, 0.02], 'out'),
    body(0.28, { hips: [0, -16, 0], spine: [2, -10, 0], chest: [0, -16, 0], head: [-2, 12, 0], 'upperarm.L': [-94, 0, -4], 'forearm.L': [-6, 0, 0], 'hand.L': [-34, 0, 0] }, [0, -0.04, 0.02], 'linear'),
    body(0.32, { hips: [0, -20, 0], spine: [2, -12, 0], chest: [0, -20, 0], head: [-2, 14, 0], 'upperarm.L': [-96, 0, -4], 'forearm.L': [-4, 0, 0], 'hand.L': [30, 0, 0] }, [0, -0.04, 0.03], 'outExpo'),
    body(0.5, { hips: [0, -20, 0], spine: [2, -12, 0], chest: [0, -20, 0], head: [-2, 14, 0], 'upperarm.L': [-90, 0, -4], 'forearm.L': [-8, 0, 0], 'hand.L': [24, 0, 0] }, [0, -0.04, 0.03], 'out'),
    body(0.78, idle, hips, 'inOut'),
  ];
}

// Oni Dekopin (Shinigami: the sword stays low in the right hand)
const flick: ClipDef = {
  name: 'is_flick', dur: 0.78, fadeIn: 0.05, fadeOut: 0.22,
  events: { step: 0.08, flick: 0.31 },
  keys: mergeKeys([{ t: 0, c: GRIP_IDLE }, { t: 0.78, c: GRIP_IDLE }], flickKeys(IDLE_B, IDLE_HIPS), [{ t: 0, c: { '@look': [0.5, 0, 0] } }]),
};

/** wind back, then the forehead driven forward with the whole body behind it (both forms) */
function headbuttKeys(idle: NonNullable<KeyDef['b']>, hips: C3, arms: NonNullable<KeyDef['b']>): KeyDef[] {
  return [
    body(0, idle, hips),
    body(0.16, { ...arms, hips: [-6, 0, 0], spine: [-18, 0, 0], chest: [-16, 0, 0], neck: [-10, 0, 0], head: [-20, 0, 0], 'thigh.L': [-14, 0, 6], 'shin.L': [26, 0, 0], 'thigh.R': [12, 0, -6], 'shin.R': [28, 0, 0] }, [0, -0.08, -0.06], 'out'),
    body(0.28, { ...arms, hips: [12, 0, 0], spine: [28, 0, 0], chest: [22, 0, 0], neck: [12, 0, 0], head: [24, 0, 0], 'thigh.L': [-52, 0, 8], 'shin.L': [54, 0, 0], 'thigh.R': [30, 0, -8], 'shin.R': [24, 0, 0] }, [0, -0.12, 0.22], 'outExpo'),
    body(0.46, { ...arms, hips: [12, 0, 0], spine: [26, 0, 0], chest: [20, 0, 0], neck: [10, 0, 0], head: [18, 0, 0], 'thigh.L': [-50, 0, 8], 'shin.L': [52, 0, 0], 'thigh.R': [28, 0, -8], 'shin.R': [24, 0, 0] }, [0, -0.12, 0.2], 'out'),
    body(0.8, idle, hips, 'inOut'),
  ];
}

// Chōhigezutsuki (Shinigami)
const headbutt: ClipDef = {
  name: 'is_headbutt', dur: 0.8, fadeIn: 0.05, fadeOut: 0.22,
  events: { step: 0.2, hit: 0.28 },
  keys: mergeKeys([{ t: 0, c: GRIP_IDLE }, { t: 0.8, c: GRIP_IDLE }], headbuttKeys(IDLE_B, IDLE_HIPS, { 'upperarm.L': [20, 0, 30], 'forearm.L': [-20, 0, 0] })),
};

// Kaikyō Kotei: the corded rods off the left wrist thrown out, one way and then the other
const kotei: ClipDef = {
  name: 'is_kotei', dur: 1.0, fadeIn: 0.06, fadeOut: 0.24,
  events: { throw1: 0.22, throw2: 0.46, hold: 0.6 },
  keys: mergeKeys(
    [{ t: 0, c: GRIP_IDLE }, { t: 1, c: GRIP_IDLE }],
    [
      body(0, IDLE_B, IDLE_HIPS),
      body(0.14, { hips: [0, 20, 0], spine: [2, 14, 0], chest: [0, 18, 0], head: [0, -10, 0], 'upperarm.L': [-60, 0, -40], 'forearm.L': [-70, 0, 0] }, [0, -0.05, 0], 'out'),
      body(0.22, { hips: [0, -14, 0], spine: [2, -12, 0], chest: [0, -18, 0], head: [0, 10, 0], 'upperarm.L': [-70, 0, 70], 'forearm.L': [-6, 0, 0], 'hand.L': [10, 0, 0] }, [0, -0.06, 0], 'outExpo'),
      body(0.38, { hips: [0, -6, 0], spine: [2, -6, 0], chest: [0, -8, 0], head: [0, 6, 0], 'upperarm.L': [-100, 0, -10], 'forearm.L': [-60, 0, 0] }, [0, -0.05, 0], 'inOut'),
      body(0.46, { hips: [0, 10, 0], spine: [2, 8, 0], chest: [0, 10, 0], head: [0, -6, 0], 'upperarm.L': [-40, 0, 10], 'forearm.L': [-4, 0, 0], 'hand.L': [10, 0, 0] }, [0, -0.06, 0.02], 'outExpo'),
      body(0.6, { hips: [0, 0, 0], spine: [4, 0, 0], chest: [2, 0, 0], head: [-6, 0, 0], 'upperarm.L': [-70, 0, 20], 'forearm.L': [-50, 0, 0], 'hand.L': [0, 0, 0], 'thigh.L': [-20, 0, 10], 'shin.L': [30, 0, 0], 'thigh.R': [16, 0, -10], 'shin.R': [32, 0, 0] }, [0, -0.1, 0], 'out'),
      body(1.0, IDLE_B, IDLE_HIPS, 'inOut'),
    ],
  ),
};

// "Moero, Engetsu": the blade raised upright before his face, then swept down and away as it catches fire
const moero: ClipDef = {
  name: 'release', dur: 1.5, fadeIn: 0.12, fadeOut: 0.3,
  events: { fx: 0.45, burst: 0.95 },
  keys: mergeKeys(
    [
      { t: 0, c: GRIP_IDLE },
      { t: 0.4, ease: 'out', c: grip([-0.05, 0.04, 0.32], [0.02, 0.99, 0.1], [-0.8, -0.4, -0.4], [0, 0, 1]) },
      { t: 0.85, ease: 'inOut', c: grip([-0.05, 0.05, 0.32], [0.02, 0.99, 0.1], [-0.8, -0.4, -0.4], [0, 0, 1]) },
      { t: 0.97, ease: 'outExpo', c: grip([-0.32, -0.18, 0.18], [-0.35, -0.5, 0.79], [-0.7, -0.3, -0.6]) },
      { t: 1.5, ease: 'inOut', c: GRIP_IDLE },
    ],
    [
      body(0, IDLE_B, IDLE_HIPS),
      body(0.4, { hips: [0, -14, 0], spine: [0, -6, 0], chest: [-2, -8, 0], head: [-4, 10, 0], 'upperarm.L': [-60, 0, -26], 'forearm.L': [-72, 0, 0], 'hand.L': [0, 0, 0], 'thigh.L': [-18, 0, 10], 'shin.L': [22, 0, 0], 'thigh.R': [16, 0, -10], 'shin.R': [22, 0, 0] }, [0, -0.06, 0], 'out'),
      body(0.85, { hips: [0, -16, 0], spine: [0, -6, 0], chest: [-2, -10, 0], head: [-6, 12, 0], 'upperarm.L': [-62, 0, -26], 'forearm.L': [-74, 0, 0] }, [0, -0.07, 0], 'inOut'),
      body(0.97, { hips: [4, 18, 0], spine: [8, 12, 0], chest: [6, 18, 0], head: [-8, -12, 0], 'upperarm.L': [10, 0, 40], 'forearm.L': [-20, 0, 0], 'thigh.L': [-30, 0, 10], 'shin.L': [36, 0, 0], 'thigh.R': [20, 0, -10], 'shin.R': [30, 0, 0] }, [0, -0.1, 0.04], 'outExpo'),
      body(1.5, IDLE_B, IDLE_HIPS, 'inOut'),
    ],
  ),
};

// the blood-flame blast: the left palm wiped along the flat (blood on the steel), then a thrust: the fire leaves the point
const blood: ClipDef = {
  name: 'is_blood', dur: 1.2, fadeIn: 0.06, fadeOut: 0.28,
  events: { wipe: 0.18, step: 0.56, fx: 0.62 },
  keys: mergeKeys(
    [
      { t: 0, c: GRIP_IDLE },
      { t: 0.16, ease: 'out', c: grip([-0.18, 0.02, 0.28], [0.95, 0.05, 0.3], [-0.7, -0.5, -0.3]) },
      { t: 0.42, ease: 'inOut', c: grip([-0.18, 0.02, 0.28], [0.95, 0.05, 0.3], [-0.7, -0.5, -0.3]) },
      { t: 0.54, ease: 'inOut', c: grip([-0.26, -0.16, -0.08], [0.1, 0.05, 1], [-0.8, -0.3, -0.3]) },
      { t: 0.62, ease: 'outExpo', c: grip([-0.06, 0.04, 0.62], [0.03, 0.02, 1], [-0.7, -0.6, 0]) },
      { t: 0.86, ease: 'out', c: grip([-0.07, 0.04, 0.6], [0.03, 0, 1], [-0.7, -0.6, 0]) },
      { t: 1.2, ease: 'inOut', c: GRIP_IDLE },
    ],
    [
      body(0, IDLE_B, IDLE_HIPS),
      // the left palm runs along the blade from the guard to the point
      body(0.16, { hips: [0, -10, 0], spine: [2, -4, 0], chest: [0, -6, 0], head: [6, 0, 0], 'upperarm.L': [-60, 0, -30], 'forearm.L': [-64, 0, 0], 'hand.L': [10, 0, 0] }, [0, -0.04, 0], 'out'),
      body(0.42, { hips: [0, -10, 0], spine: [2, -4, 0], chest: [0, -6, 0], head: [6, 6, 0], 'upperarm.L': [-70, 0, 26], 'forearm.L': [-10, 0, 0], 'hand.L': [10, 0, 0] }, [0, -0.04, 0], 'inOut'),
      body(0.54, { hips: [4, -24, 0], spine: [6, -14, 0], chest: [4, -18, 0], head: [-4, 20, 0], 'upperarm.L': [-40, 0, 20], 'forearm.L': [-50, 0, 0], 'thigh.L': [-26, 0, 10], 'shin.L': [36, 0, 0], 'thigh.R': [14, 0, -10], 'shin.R': [36, 0, 0] }, [0, -0.1, -0.04], 'inOut'),
      body(0.62, { hips: [10, 10, 0], spine: [12, 8, 0], chest: [8, 10, 0], head: [-12, -8, 0], 'upperarm.L': [20, 0, 40], 'forearm.L': [-20, 0, 0], 'thigh.L': [-58, 0, 8], 'shin.L': [58, 0, 0], 'thigh.R': [34, 0, -8], 'shin.R': [24, 0, 0] }, [0, -0.13, 0.2], 'outExpo'),
      body(0.86, { hips: [10, 10, 0], spine: [12, 8, 0], chest: [8, 10, 0], head: [-12, -8, 0], 'upperarm.L': [20, 0, 40], 'forearm.L': [-20, 0, 0], 'thigh.L': [-56, 0, 8], 'shin.L': [56, 0, 0], 'thigh.R': [32, 0, -8], 'shin.R': [24, 0, 0] }, [0, -0.13, 0.2], 'out'),
      body(1.2, IDLE_B, IDLE_HIPS, 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.4, 0, 0] } }],
  ),
};

// ------------------------------------------------------------------ the doctor

const D_IDLE = {
  hips: [0, -14, 0], spine: [6, 6, 0], chest: [4, 10, 0], neck: [0, 0, 0], head: [4, -4, 0],
  'thigh.L': [-16, 0, 8], 'shin.L': [22, 0, 0], 'foot.L': [-4, 0, 0], 'thigh.R': [12, 0, -8], 'shin.R': [24, 0, 0], 'foot.R': [-10, 0, 0],
  'upperarm.L': [-34, 0, 16], 'forearm.L': [-112, 0, 0], 'hand.L': [0, 0, 0],
  'upperarm.R': [-28, 0, -18], 'forearm.R': [-104, 0, 0], 'hand.R': [0, 0, 0],
} as NonNullable<KeyDef['b']>;
const D_HIPS: C3 = [0, -0.05, 0];

/** The doctor: a goofy boxer's guard, both fists up, bouncing on the balls of his feet. */
export const ISSHIN_DOCTOR_STANCE: StanceDef = {
  idle: D_IDLE,
  idleHips: -0.05,
  run: { 'upperarm.L': [-14, 0, 12], 'forearm.L': [-86, 0, 0], 'upperarm.R': [-10, 0, -12], 'forearm.R': [-86, 0, 0], chest: [4, 4, 0] },
  sprint: { 'upperarm.L': [20, 0, 10], 'forearm.L': [-60, 0, 0], 'upperarm.R': [20, 0, -10], 'forearm.R': [-60, 0, 0] },
  swingL: 0.25,
  swingR: 0.25,
};

// the right palm driven out
const palm: ClipDef = {
  name: 'is_palm', dur: 0.46, fadeIn: 0.04, fadeOut: 0.18,
  events: { step: 0.05, hit: 0.12, combo: 0.22 },
  keys: [
    body(0, D_IDLE, D_HIPS),
    body(0.06, { hips: [0, 12, 0], spine: [6, 10, 0], chest: [4, 14, 0], head: [4, -10, 0], 'upperarm.R': [-40, 0, -10], 'forearm.R': [-100, 0, 0] }, [0, -0.05, -0.02], 'out'),
    body(0.12, { hips: [4, -18, 0], spine: [8, -14, 0], chest: [6, -20, 0], head: [2, 16, 0], 'upperarm.R': [-86, 0, -4], 'forearm.R': [-6, 0, 0], 'hand.R': [-30, 0, 0], 'thigh.L': [-34, 0, 8], 'shin.L': [34, 0, 0], 'thigh.R': [22, 0, -8], 'shin.R': [24, 0, 0] }, [0, -0.08, 0.1], 'outExpo'),
    body(0.24, { hips: [4, -18, 0], spine: [8, -14, 0], chest: [6, -20, 0], head: [2, 16, 0], 'upperarm.R': [-84, 0, -4], 'forearm.R': [-10, 0, 0], 'hand.R': [-30, 0, 0] }, [0, -0.08, 0.1], 'out'),
    body(0.46, D_IDLE, D_HIPS, 'inOut'),
  ],
};

// the left elbow swung round flat
const elbow: ClipDef = {
  name: 'is_elbow', dur: 0.5, fadeIn: 0.04, fadeOut: 0.18,
  events: { step: 0.05, hit: 0.14, combo: 0.24 },
  keys: [
    body(0, D_IDLE, D_HIPS),
    body(0.07, { hips: [0, -16, 0], spine: [4, -14, 0], chest: [2, -20, 0], head: [4, 14, 0], 'upperarm.L': [-70, 0, 40], 'forearm.L': [-130, 0, 0] }, [0, -0.05, 0], 'out'),
    body(0.14, { hips: [4, 18, 0], spine: [8, 16, 0], chest: [6, 26, 0], head: [2, -18, 0], 'upperarm.L': [-88, -40, 10], 'forearm.L': [-136, 0, 0], 'thigh.L': [-30, 0, 8], 'shin.L': [30, 0, 0], 'thigh.R': [20, 0, -8], 'shin.R': [24, 0, 0] }, [0, -0.08, 0.08], 'outExpo'),
    body(0.26, { hips: [4, 22, 0], spine: [8, 18, 0], chest: [6, 30, 0], head: [2, -20, 0], 'upperarm.L': [-86, -46, 8], 'forearm.L': [-136, 0, 0] }, [0, -0.08, 0.08], 'out'),
    body(0.5, D_IDLE, D_HIPS, 'inOut'),
  ],
};

// the right knee driven up into the gut, the hands pulling the head down onto it
const knee: ClipDef = {
  name: 'is_knee', dur: 0.56, fadeIn: 0.04, fadeOut: 0.2,
  events: { step: 0.05, hit: 0.16, combo: 0.28 },
  keys: [
    body(0, D_IDLE, D_HIPS),
    body(0.08, { hips: [-6, 0, 0], spine: [-4, 0, 0], chest: [-6, 0, 0], 'upperarm.L': [-90, 0, 10], 'forearm.L': [-40, 0, 0], 'upperarm.R': [-90, 0, -10], 'forearm.R': [-40, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [40, 0, 0] }, [0, -0.04, 0], 'out'),
    body(0.16, { hips: [-10, 0, 0], spine: [6, 0, 0], chest: [10, 0, 0], head: [6, 0, 0], 'upperarm.L': [-70, 0, 10], 'forearm.L': [-70, 0, 0], 'upperarm.R': [-70, 0, -10], 'forearm.R': [-70, 0, 0], 'thigh.R': [-110, 0, -4], 'shin.R': [120, 0, 0], 'foot.R': [20, 0, 0], 'thigh.L': [-6, 0, 6], 'shin.L': [10, 0, 0] }, [0, 0.04, 0.1], 'outExpo'),
    body(0.3, { hips: [-10, 0, 0], spine: [6, 0, 0], chest: [10, 0, 0], head: [6, 0, 0], 'upperarm.L': [-70, 0, 10], 'forearm.L': [-70, 0, 0], 'upperarm.R': [-70, 0, -10], 'forearm.R': [-70, 0, 0], 'thigh.R': [-100, 0, -4], 'shin.R': [110, 0, 0], 'thigh.L': [-6, 0, 6], 'shin.L': [10, 0, 0] }, [0, 0.03, 0.1], 'out'),
    body(0.56, D_IDLE, D_HIPS, 'inOut'),
  ],
};

// "Isshin Flying Double Knee": a leap, both knees driven forward together, the arms flung back
const dknee: ClipDef = {
  name: 'is_dknee', dur: 0.9, fadeIn: 0.05, fadeOut: 0.24,
  events: { step: 0.12, hit: 0.34, land: 0.6 },
  keys: [
    body(0, D_IDLE, D_HIPS),
    body(0.12, { hips: [14, 0, 0], spine: [16, 0, 0], chest: [10, 0, 0], head: [-10, 0, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [70, 0, 0], 'thigh.R': [-30, 0, -6], 'shin.R': [70, 0, 0], 'upperarm.L': [30, 0, 30], 'forearm.L': [-30, 0, 0], 'upperarm.R': [30, 0, -30], 'forearm.R': [-30, 0, 0] }, [0, -0.2, 0], 'out'),
    body(0.3, { hips: [-14, 0, 0], spine: [-12, 0, 0], chest: [-10, 0, 0], head: [-6, 0, 0], 'thigh.L': [-100, 0, 6], 'shin.L': [120, 0, 0], 'foot.L': [20, 0, 0], 'thigh.R': [-100, 0, -6], 'shin.R': [120, 0, 0], 'foot.R': [20, 0, 0], 'upperarm.L': [50, 0, 50], 'forearm.L': [-20, 0, 0], 'upperarm.R': [50, 0, -50], 'forearm.R': [-20, 0, 0] }, [0, 0.1, 0], 'outExpo'),
    body(0.5, { hips: [-14, 0, 0], spine: [-12, 0, 0], chest: [-10, 0, 0], head: [-6, 0, 0], 'thigh.L': [-96, 0, 6], 'shin.L': [116, 0, 0], 'thigh.R': [-96, 0, -6], 'shin.R': [116, 0, 0], 'upperarm.L': [46, 0, 50], 'forearm.L': [-20, 0, 0], 'upperarm.R': [46, 0, -50], 'forearm.R': [-20, 0, 0] }, [0, 0.1, 0], 'out'),
    body(0.66, { hips: [10, 0, 0], spine: [12, 0, 0], chest: [8, 0, 0], 'thigh.L': [-40, 0, 8], 'shin.L': [60, 0, 0], 'thigh.R': [-20, 0, -8], 'shin.R': [50, 0, 0], 'upperarm.L': [-20, 0, 30], 'forearm.L': [-60, 0, 0], 'upperarm.R': [-20, 0, -30], 'forearm.R': [-60, 0, 0] }, [0, -0.16, 0], 'out'),
    body(0.9, D_IDLE, D_HIPS, 'inOut'),
  ],
};

const D_ARMS = { 'upperarm.L': [10, 0, 34], 'forearm.L': [-30, 0, 0], 'upperarm.R': [10, 0, -34], 'forearm.R': [-30, 0, 0] } as NonNullable<KeyDef['b']>;
const dHeadbutt: ClipDef = { name: 'is_d_headbutt', dur: 0.8, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.2, hit: 0.28 }, keys: headbuttKeys(D_IDLE, D_HIPS, D_ARMS) };
const dFlick: ClipDef = { name: 'is_d_flick', dur: 0.78, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.08, flick: 0.31 }, keys: flickKeys(D_IDLE, D_HIPS) };

// field medicine: one knee down, the hands pressed over the wound, the head bowed
const heal: ClipDef = {
  name: 'is_heal', dur: 1.8, fadeIn: 0.12, fadeOut: 0.3,
  events: { press: 0.3 },
  keys: [
    body(0, D_IDLE, D_HIPS),
    body(0.3, { hips: [6, 0, 0], spine: [16, 0, 0], chest: [12, 0, 0], neck: [10, 0, 0], head: [18, 0, 0], 'thigh.L': [-80, 0, 6], 'shin.L': [90, 0, 0], 'foot.L': [-10, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [110, 0, 0], 'foot.R': [30, 0, 0], 'upperarm.L': [-40, 0, -10], 'forearm.L': [-100, 0, 0], 'upperarm.R': [-40, 0, 10], 'forearm.R': [-100, 0, 0] }, [0, -0.36, 0], 'out'),
    body(1.5, { hips: [6, 0, 0], spine: [16, 0, 0], chest: [12, 0, 0], neck: [10, 0, 0], head: [16, 0, 0], 'thigh.L': [-80, 0, 6], 'shin.L': [90, 0, 0], 'foot.L': [-10, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [110, 0, 0], 'foot.R': [30, 0, 0], 'upperarm.L': [-42, 0, -10], 'forearm.L': [-102, 0, 0], 'upperarm.R': [-42, 0, 10], 'forearm.R': [-102, 0, 0] }, [0, -0.36, 0], 'inOut'),
    body(1.8, D_IDLE, D_HIPS, 'inOut'),
  ],
};

// the charm: a paper ward held up between two fingers, flicked out
const charm: ClipDef = {
  name: 'is_charm', dur: 0.7, fadeIn: 0.05, fadeOut: 0.2,
  events: { charm: 0.3 },
  keys: [
    body(0, D_IDLE, D_HIPS),
    body(0.2, { 'upperarm.R': [-100, 0, -6], 'forearm.R': [-60, 0, 0], 'hand.R': [-10, 0, 0], head: [6, -4, 0] }, D_HIPS, 'out'),
    body(0.3, { 'upperarm.R': [-80, 0, -20], 'forearm.R': [-10, 0, 0], 'hand.R': [10, 0, 0], head: [2, -6, 0] }, D_HIPS, 'outExpo'),
    body(0.7, D_IDLE, D_HIPS, 'inOut'),
  ],
};

// out of the gigai: the body arches back and the Shinigami steps forward out of it
const step: ClipDef = {
  name: 'is_step', dur: 1.0, fadeIn: 0.08, fadeOut: 0.25,
  events: { out: 0.45 },
  keys: [
    body(0, D_IDLE, D_HIPS),
    body(0.35, { hips: [-10, 0, 0], spine: [-18, 0, 0], chest: [-16, 0, 0], neck: [-10, 0, 0], head: [-20, 0, 0], 'upperarm.L': [20, 0, 40], 'forearm.L': [-10, 0, 0], 'upperarm.R': [20, 0, -40], 'forearm.R': [-10, 0, 0] }, [0, -0.02, -0.04], 'out'),
    body(0.5, { hips: [6, 0, 0], spine: [10, 0, 0], chest: [8, 0, 0], head: [-4, 0, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [30, 0, 0], 'upperarm.L': [0, 0, 20], 'upperarm.R': [0, 0, -20] }, [0, -0.06, 0.06], 'outExpo'),
    body(1.0, IDLE_B, IDLE_HIPS, 'inOut'),
  ],
};

const SHARED = ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name));
export const ISSHIN_CLIPS: ClipDef[] = [men, kote, dou, tsuki, agito, getsuga, flick, headbutt, kotei, moero, blood, ...SHARED];
export const ISSHIN_DOCTOR_CLIPS: ClipDef[] = [palm, elbow, knee, dknee, dHeadbutt, dFlick, heal, charm, step, ...SHARED];
export const ISSHIN_CHAIN = ['is_men', 'is_kote', 'is_do', 'is_tsuki'];
export const ISSHIN_DOCTOR_CHAIN = ['is_palm', 'is_elbow', 'is_knee', 'is_dknee'];
