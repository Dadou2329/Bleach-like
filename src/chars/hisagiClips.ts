// Shūhei Hisagi's animation set (docs/kits/hisagi.md). Sealed: a calm, economical one-handed guard, the point
// low toward the opponent. The string mixes cuts with close-quarters work: a diagonal cut, a left elbow, the
// rising cut that launches, a heel drop; the draw-cut is the heavy. Kidō from the left hand: Hyapporankan's rod
// thrown overhand, Sajō Sabaku's palm closing into a fist, Tsuzuri Raiden's palm drawn along the blade; an
// explosive band torn off and thrown. "Kare, Kazeshini": the sword laid flat before him, the left palm on its back,
// then the split into the two sickles. Shikai: a sickle in each fist, the chain slack between them — throws from
// either hand and the haul back, the chain swung wide, the yank that brings the far sickle round, the fan spin
// overhead, the steered throw, Kubikake (throw, catch, haul, slam), the bind with the current sent down the chain,
// the chain-life guard. The novel Bankai: the sickles raised as the chains climb to the orb, the noose cast, the
// verdict (his own noose cut, the blow brought down).
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type C3 = [number, number, number];
type B = NonNullable<KeyDef['b']>;

function grip(p: C3, dir: C3, pole: C3, ref: C3 = [0, -1, 0], hand: 'R' | 'L' = 'R'): Record<string, C3> {
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
  return { [`@grip${hand}`]: p, [`@dir${hand}`]: d, [`@edge${hand}`]: e, [`@pole${hand}`]: pole, [`@ik${hand}`]: [1, 0, 0] };
}
const body = (t: number, b: B, hips?: KeyDef['hips'], ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });
const ch = (t: number, c: Record<string, C3>, ease?: KeyDef['ease']): KeyDef => ({ t, ease, c });
/** both hands' grips in one key */
const both = (t: number, r: Record<string, C3>, l: Record<string, C3>, ease?: KeyDef['ease']): KeyDef => ({ t, ease, c: { ...r, ...l } });

const SHARED = ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name));

// ================================================================== sealed

const IDLE: B = {
  // square and settled, the weight even, the left hand loose at his side
  hips: [0, -10, 0], spine: [2, 4, 0], chest: [0, 6, 0], neck: [0, 0, 0], head: [-2, -8, 0],
  'thigh.L': [-14, 0, 4], 'shin.L': [16, 0, 0], 'foot.L': [-4, 0, 0], 'thigh.R': [8, 0, -6], 'shin.R': [8, 0, 0], 'foot.R': [-4, 0, 0],
  'upperarm.L': [8, 0, 14], 'forearm.L': [-22, 0, 0], 'hand.L': [0, 0, 10],
};
const R = (over: B = {}): B => ({ ...IDLE, ...over });
const HIPS: C3 = [0, -0.03, 0];
const SG = { p: [-0.3, -0.3, 0.2] as C3, dir: [-0.1, -0.35, 0.93] as C3, edge: [0, -0.93, -0.35] as C3, pole: [-0.6, -0.3, -0.75] as C3 };
const SG_IDLE = grip(SG.p, SG.dir, SG.pole);

/** Sealed: the sword low in his right hand, the point toward the opponent; calm. */
export const HISAGI_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.03,
  run: { 'upperarm.L': [-30, 0, 14], 'forearm.L': [-60, 0, 0], 'hand.L': [0, 0, 0], chest: [4, 0, 0] },
  sprint: { spine: [18, 0, 0], 'upperarm.L': [40, 0, 14], 'forearm.L': [-30, 0, 0], 'hand.L': [10, 0, 0] },
  swingL: 0.8,
  swingR: 0.2,
  grip: {
    idle: SG,
    walk: { p: [-0.3, -0.28, 0.18], dir: [-0.1, -0.35, 0.93], edge: [0, -0.93, -0.35], pole: [-0.6, -0.3, -0.75] },
    run: { p: [-0.3, -0.24, -0.1], dir: [-0.2, -0.25, -0.95], edge: [0, -0.96, 0.25], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.28, -0.12, -0.2], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.36, -0.08, 0.1], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

// 1: the diagonal cut, high right to low left
const s1: ClipDef = {
  name: 'hs_s1', dur: 0.46, fadeIn: 0.05, fadeOut: 0.16,
  events: { step: 0.06, combo: 0.27 },
  keys: mergeKeys(
    swingKeys({ a: [-0.7, 0.7, 0], b: [0, 0, 1], c: [-0.04, 0.05, 0.12], r: 0.38, pole: [-0.7, -0.4, -0.5], keys: [[0, 30, 'out'], [0.1, -10, 'out'], [0.22, 175, 'out'], [0.46, 150, 'inOut']] }),
    [
      body(0, R(), HIPS),
      body(0.1, R({ hips: [0, -30, 0], spine: [2, -8, 0], chest: [0, -14, 0], head: [-4, 18, 0] }), HIPS, 'out'),
      body(0.22, R({ hips: [6, 18, 0], spine: [10, 10, 0], chest: [6, 16, 0], head: [-6, -16, 0], 'thigh.L': [-34, 0, 6], 'shin.L': [30, 0, 0], 'thigh.R': [20, 0, -8], 'shin.R': [20, 0, 0] }), [0, -0.07, 0.1], 'out'),
      body(0.46, R(), HIPS, 'inOut'),
    ],
  ),
};

// 2: the left elbow driven into the target, the sword drawn back at the right hip
const s2: ClipDef = {
  name: 'hs_s2', dur: 0.46, fadeIn: 0.04, fadeOut: 0.16,
  events: { step: 0.04, hit: 0.15, combo: 0.24 },
  keys: mergeKeys(
    [ch(0, SG_IDLE), ch(0.1, grip([-0.4, -0.25, -0.12], [-0.3, -0.2, -0.93], [-0.6, -0.4, 0.4]), 'out'), ch(0.3, grip([-0.4, -0.25, -0.1], [-0.3, -0.2, -0.93], [-0.6, -0.4, 0.4])), ch(0.46, SG_IDLE, 'inOut')],
    [
      body(0, R(), HIPS),
      body(0.07, R({ hips: [0, -28, 0], chest: [0, -16, 0], 'upperarm.L': [-30, 0, 70], 'forearm.L': [-130, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.02, 0], 'out'),
      body(0.15, R({ hips: [6, 30, 0], spine: [8, 14, 0], chest: [6, 22, 0], head: [-6, -26, 0], 'upperarm.L': [-80, 0, 30], 'forearm.L': [-140, 0, 0], 'hand.L': [0, 0, 0], 'thigh.L': [-36, 0, 6], 'shin.L': [30, 0, 0], 'thigh.R': [18, 0, -8], 'shin.R': [20, 0, 0] }), [0, -0.06, 0.14], 'outExpo'),
      body(0.28, R({ hips: [4, 20, 0], spine: [6, 10, 0], chest: [4, 14, 0], 'upperarm.L': [-60, 0, 40], 'forearm.L': [-120, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.04, 0.1], 'inOut'),
      body(0.46, R(), HIPS, 'inOut'),
    ],
  ),
};

// 3: the rising cut, low left to high right — it launches
const s3: ClipDef = {
  name: 'hs_s3', dur: 0.5, fadeIn: 0.04, fadeOut: 0.16,
  events: { step: 0.06, combo: 0.3 },
  keys: mergeKeys(
    swingKeys({ a: [0.7, -0.7, 0], b: [0, 0, 1], c: [-0.04, -0.02, 0.12], r: 0.38, sense: -1, pole: [-0.7, -0.4, -0.5], keys: [[0, 40, 'out'], [0.1, -15, 'out'], [0.22, 172, 'out'], [0.5, 160, 'inOut']] }),
    [
      body(0, R(), HIPS),
      body(0.1, R({ hips: [10, 26, 0], spine: [12, 10, 0], chest: [6, 14, 0], head: [-10, -18, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [50, 0, 0], 'thigh.R': [-6, 0, -6], 'shin.R': [40, 0, 0] }), [0, -0.12, 0.02], 'out'),
      body(0.22, R({ hips: [-6, -20, 0], spine: [-10, -10, 0], chest: [-8, -16, 0], head: [-6, 18, 0], 'thigh.L': [-20, 0, 6], 'shin.L': [14, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [8, 0, 0], 'upperarm.L': [-20, 0, 40] }), [0, 0.04, 0.08], 'out'),
      body(0.5, R(), HIPS, 'inOut'),
    ],
  ),
};

// 4: the heel drop — a hop, the right leg high, the heel brought down on the head
const s4: ClipDef = {
  name: 'hs_s4', dur: 0.66, fadeIn: 0.04, fadeOut: 0.2,
  events: { step: 0.06, hit: 0.32 },
  keys: mergeKeys(
    [ch(0, SG_IDLE), ch(0.14, grip([-0.42, 0.0, -0.1], [-0.6, 0.3, -0.75], [-0.4, -0.6, -0.6]), 'out'), ch(0.5, grip([-0.42, -0.04, -0.08], [-0.6, 0.2, -0.78], [-0.4, -0.6, -0.6])), ch(0.66, SG_IDLE, 'inOut')],
    [
      body(0, R(), HIPS),
      body(0.12, R({ spine: [-6, 0, 0], chest: [-6, 0, 0], 'thigh.R': [-60, 0, -4], 'shin.R': [70, 0, 0], 'thigh.L': [-10, 0, 4], 'shin.L': [30, 0, 0], 'upperarm.L': [-60, 0, 40], 'forearm.L': [-40, 0, 0] }), [0, -0.02, 0], 'out'),
      body(0.24, R({ spine: [-14, 0, 0], chest: [-8, 0, 0], head: [10, 0, 0], 'thigh.R': [-150, 0, -6], 'shin.R': [6, 0, 0], 'foot.R': [-20, 0, 0], 'thigh.L': [6, 0, 4], 'shin.L': [20, 0, 0], 'upperarm.L': [-20, 0, 70], 'forearm.L': [-20, 0, 0] }), [0, 0.22, 0.06], 'inOut'),
      body(0.33, R({ spine: [22, 0, 0], chest: [12, 0, 0], head: [-6, 0, 0], 'thigh.R': [-60, 0, -6], 'shin.R': [10, 0, 0], 'foot.R': [30, 0, 0], 'thigh.L': [-16, 0, 4], 'shin.L': [40, 0, 0], 'upperarm.L': [-10, 0, 50], 'forearm.L': [-30, 0, 0] }), [0, 0.06, 0.18], 'inExpo'),
      body(0.46, R({ hips: [10, 0, 0], spine: [12, 0, 0], 'thigh.R': [-40, 0, -6], 'shin.R': [60, 0, 0], 'thigh.L': [-30, 0, 4], 'shin.L': [60, 0, 0] }), [0, -0.2, 0.16], 'out'),
      body(0.66, R(), HIPS, 'inOut'),
    ],
  ),
};

// the draw-cut: wound back at his left hip, a lunging level cut across to the right
const draw: ClipDef = {
  name: 'hs_draw', dur: 0.72, fadeIn: 0.05, fadeOut: 0.22,
  events: { step: 0.2 },
  keys: mergeKeys(
    swingKeys({ a: [1, -0.15, 0], b: [0, -0.1, 1], c: [-0.02, -0.02, 0.12], r: 0.4, sense: -1, pole: [-0.7, -0.4, -0.5], keys: [[0, 60, 'out'], [0.18, -25, 'inOut'], [0.3, 200, 'out'], [0.72, 190, 'inOut']] }),
    [
      body(0, R(), HIPS),
      body(0.18, R({ hips: [4, 40, 0], spine: [6, 16, 0], chest: [4, 22, 0], head: [-4, -34, 0], 'thigh.L': [-24, 0, 8], 'shin.L': [36, 0, 0], 'thigh.R': [6, 0, -8], 'shin.R': [30, 0, 0], 'upperarm.L': [-50, 0, 30], 'forearm.L': [-70, 0, 0] }), [0, -0.1, -0.06], 'inOut'),
      body(0.3, R({ hips: [10, -40, 0], spine: [12, -16, 0], chest: [8, -24, 0], head: [-8, 30, 0], 'thigh.L': [-56, 0, 6], 'shin.L': [50, 0, 0], 'thigh.R': [30, 0, -8], 'shin.R': [24, 0, 0], 'upperarm.L': [-10, 0, 60], 'forearm.L': [-20, 0, 0] }), [0, -0.16, 0.26], 'out'),
      body(0.48, R({ hips: [8, -36, 0], spine: [10, -14, 0], chest: [6, -20, 0], head: [-6, 26, 0], 'thigh.L': [-52, 0, 6], 'shin.L': [48, 0, 0], 'thigh.R': [28, 0, -8], 'shin.R': [22, 0, 0], 'upperarm.L': [-10, 0, 56], 'forearm.L': [-20, 0, 0] }), [0, -0.15, 0.24], 'out'),
      body(0.72, R(), HIPS, 'inOut'),
    ],
  ),
};

// Hyapporankan: a rod of light formed in the left hand and thrown overhand
const rod: ClipDef = {
  name: 'hs_rod', dur: 0.62, fadeIn: 0.06, fadeOut: 0.18,
  events: { form: 0.1, throw: 0.28 },
  keys: mergeKeys(
    [ch(0, SG_IDLE), ch(0.2, grip([-0.36, -0.3, 0.0], [-0.3, -0.6, 0.6], [-0.6, -0.3, -0.75]), 'inOut'), ch(0.62, SG_IDLE, 'inOut')],
    [
      body(0, R(), HIPS),
      body(0.18, R({ hips: [0, -24, 0], spine: [-6, -10, 0], chest: [-8, -12, 0], head: [-4, 20, 0], 'upperarm.L': [-160, 0, 40], 'forearm.L': [-80, 0, 0], 'hand.L': [-20, 0, 0], 'thigh.L': [-10, 0, 6], 'thigh.R': [14, 0, -8] }), [0, -0.02, -0.04], 'inOut'),
      body(0.3, R({ hips: [6, 22, 0], spine: [10, 12, 0], chest: [8, 16, 0], head: [-6, -14, 0], 'upperarm.L': [-70, 0, 10], 'forearm.L': [-10, 0, 0], 'hand.L': [-40, 0, 0], 'thigh.L': [-36, 0, 6], 'shin.L': [34, 0, 0], 'thigh.R': [20, 0, -8], 'shin.R': [20, 0, 0] }), [0, -0.06, 0.12], 'outExpo'),
      body(0.62, R(), HIPS, 'inOut'),
    ],
  ),
};

// the explosive band: the left hand tears it off at his throat and flings it
const band: ClipDef = {
  name: 'hs_band', dur: 0.62, fadeIn: 0.05, fadeOut: 0.18,
  events: { tear: 0.18, throw: 0.34 },
  keys: mergeKeys(
    [ch(0, SG_IDLE)],
    [
      body(0, R(), HIPS),
      body(0.16, R({ head: [-12, -10, 0], 'upperarm.L': [-60, 0, -10], 'forearm.L': [-150, 0, 0], 'hand.L': [-20, 0, 0] }), HIPS, 'inOut'),
      body(0.22, R({ hips: [0, -20, 0], chest: [-4, -14, 0], head: [-4, 10, 0], 'upperarm.L': [-40, 0, 80], 'forearm.L': [-70, 0, 0], 'hand.L': [0, 0, 0] }), HIPS, 'out'),
      body(0.36, R({ hips: [4, 26, 0], spine: [6, 12, 0], chest: [4, 18, 0], head: [-4, -16, 0], 'upperarm.L': [-80, 0, 20], 'forearm.L': [-6, 0, 0], 'hand.L': [-30, 0, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [26, 0, 0] }), [0, -0.04, 0.1], 'outExpo'),
      body(0.62, R(), HIPS, 'inOut'),
    ],
  ),
};

// Tsuzuri Raiden: the sword laid level before him, the left palm drawn along its back — the blade crackles
const raiden: ClipDef = {
  name: 'hs_raiden', dur: 0.7, fadeIn: 0.06, fadeOut: 0.2,
  events: { charge: 0.36 },
  keys: mergeKeys(
    [ch(0, SG_IDLE), ch(0.16, grip([-0.24, 0.02, 0.32], [0.97, 0.05, 0.2], [-0.6, -0.4, -0.6], [0, -1, 0]), 'inOut'), ch(0.5, grip([-0.24, 0.02, 0.32], [0.97, 0.05, 0.2], [-0.6, -0.4, -0.6], [0, -1, 0])), ch(0.7, SG_IDLE, 'inOut')],
    [
      body(0, R(), HIPS),
      body(0.16, R({ chest: [4, 0, 0], head: [8, 0, 0], 'upperarm.L': [-60, 0, -20], 'forearm.L': [-60, 0, 0], 'hand.L': [-10, 0, -30] }), HIPS, 'inOut'),
      body(0.38, R({ chest: [4, 0, 0], head: [8, 0, 0], 'upperarm.L': [-70, 0, 10], 'forearm.L': [-30, 0, 0], 'hand.L': [-10, 0, -30] }), HIPS, 'inOut'),
      body(0.5, R({ chest: [4, 0, 0], head: [6, 0, 0], 'upperarm.L': [-40, 0, 40], 'forearm.L': [-30, 0, 0], 'hand.L': [0, 0, 0] }), HIPS, 'out'),
      body(0.7, R(), HIPS, 'inOut'),
    ],
  ),
};

// Sajō Sabaku: the left palm thrust at the target, then closed into a fist as the rope binds them
const sajo: ClipDef = {
  name: 'hs_sajo', dur: 0.64, fadeIn: 0.06, fadeOut: 0.18,
  events: { bind: 0.32 },
  keys: mergeKeys(
    [ch(0, SG_IDLE)],
    [
      body(0, R(), HIPS),
      body(0.18, R({ hips: [2, 12, 0], chest: [4, 10, 0], head: [-4, -10, 0], 'upperarm.L': [-84, 0, -4], 'forearm.L': [-4, 0, 0], 'hand.L': [-70, 0, 0], 'thigh.L': [-28, 0, 4], 'shin.L': [26, 0, 0] }), [0, -0.04, 0.06], 'outExpo'),
      body(0.32, R({ hips: [2, 10, 0], chest: [6, 10, 0], head: [-2, -10, 0], 'upperarm.L': [-80, 0, 0], 'forearm.L': [-30, 0, 0], 'hand.L': [10, 0, 0], 'thigh.L': [-28, 0, 4], 'shin.L': [26, 0, 0] }), [0, -0.04, 0.05], 'outExpo'),
      body(0.64, R(), HIPS, 'inOut'),
    ],
  ),
};

/** Shikai: a sickle in each fist, the arms a little apart, the chain slack between them. */
const K_IDLE: B = {
  hips: [0, -8, 0], spine: [4, 4, 0], chest: [2, 4, 0], neck: [0, 0, 0], head: [-4, -4, 0],
  'thigh.L': [-16, 0, 6], 'shin.L': [20, 0, 0], 'foot.L': [-4, 0, 0], 'thigh.R': [8, 0, -8], 'shin.R': [12, 0, 0], 'foot.R': [-4, 0, 0],
  // the left fist up before him with its sickle (FK; the clips take it over with the left-hand channels)
  'upperarm.L': [-40, 0, 18], 'forearm.L': [-70, 0, 0], 'hand.L': [0, 0, 0],
};
const KR = (over: B = {}): B => ({ ...K_IDLE, ...over });
const KGR = { p: [-0.32, -0.2, 0.2] as C3, dir: [-0.15, 0.75, 0.65] as C3, edge: [0, 0.65, -0.75] as C3, pole: [-0.7, -0.4, -0.55] as C3 };
const KGL = { p: [0.28, -0.08, 0.32] as C3, dir: [0.1, 0.7, 0.7] as C3, edge: [0, 0.7, -0.7] as C3, pole: [0.7, -0.4, -0.55] as C3 };
const KR_IDLE = grip(KGR.p, KGR.dir, KGR.pole);
const KL_IDLE = grip(KGL.p, KGL.dir, KGL.pole, [0, -1, 0], 'L');

// "Kare, Kazeshini": the sword laid flat before him, the left palm on its back; it splits into two sickles
const kare: ClipDef = {
  name: 'hs_kare', dur: 1.0, fadeIn: 0.06, fadeOut: 0.22,
  events: { name: 0.2, split: 0.42, spin: 0.6 },
  keys: mergeKeys(
    [
      ch(0, SG_IDLE),
      ch(0.2, grip([-0.2, 0.08, 0.32], [0.97, 0.08, 0.2], [-0.6, -0.4, -0.6], [0, -1, 0]), 'inOut'),
      ch(0.4, grip([-0.2, 0.08, 0.32], [0.97, 0.08, 0.2], [-0.6, -0.4, -0.6], [0, -1, 0])),
      both(0.5, grip([-0.42, 0.2, 0.1], [-0.4, 0.8, 0.4], [-0.6, -0.4, -0.6]), grip([0.42, 0.2, 0.1], [0.4, 0.8, 0.4], [0.6, -0.4, -0.6], [0, -1, 0], 'L'), 'outExpo'),
      both(0.75, grip([-0.46, 0.0, 0.16], [-0.6, 0.6, 0.5], [-0.6, -0.4, -0.6]), grip([0.46, 0.0, 0.16], [0.6, 0.6, 0.5], [0.6, -0.4, -0.6], [0, -1, 0], 'L')),
      both(1.0, KR_IDLE, KL_IDLE, 'inOut'),
    ],
    [
      body(0, R(), HIPS),
      body(0.2, R({ chest: [4, 0, 0], head: [10, 0, 0], 'upperarm.L': [-64, 0, -14], 'forearm.L': [-56, 0, 0], 'hand.L': [-10, 0, -30] }), HIPS, 'inOut'),
      body(0.4, R({ chest: [4, 0, 0], head: [10, 0, 0], 'upperarm.L': [-64, 0, -12], 'forearm.L': [-56, 0, 0], 'hand.L': [-10, 0, -30] }), HIPS),
      body(0.5, KR({ spine: [-4, 0, 0], chest: [-6, 0, 0], head: [-6, 0, 0], 'thigh.L': [-24, 0, 10], 'thigh.R': [12, 0, -10] }), [0, -0.05, 0], 'outExpo'),
      body(0.75, KR({ hips: [0, 30, 0], spine: [0, 10, 0], chest: [0, 10, 0], head: [0, -20, 0] }), [0, -0.04, 0], 'inOut'),
      body(1.0, KR(), HIPS, 'inOut'),
    ],
  ),
};

/** Shikai: the stance */
export const KAZESHINI_STANCE: StanceDef = {
  idle: K_IDLE,
  idleHips: -0.03,
  run: { chest: [6, 0, 0], 'upperarm.L': [-30, 0, 20], 'forearm.L': [-80, 0, 0] },
  sprint: { spine: [18, 0, 0], 'upperarm.L': [20, 0, 20], 'forearm.L': [-90, 0, 0] },
  swingL: 0.1,
  swingR: 0.1,
  grip: {
    idle: KGR,
    walk: KGR,
    run: { p: [-0.32, -0.18, 0.0], dir: [-0.2, 0.6, 0.75], edge: [0, 0.75, -0.6], pole: [-0.7, -0.4, -0.5] },
    sprint: { p: [-0.3, -0.12, -0.18], dir: [-0.2, 0.2, -0.96], edge: [0, -0.96, -0.2], pole: [-0.8, -0.2, 0.5] },
    air: KGR,
  },
};

/** a throw from one hand (the sickle leaves at 'throw') and the haul back on the chain ('haul') */
function throwClip(name: string, hand: 'R' | 'L'): ClipDef {
  const k = hand === 'R' ? 1 : -1;
  const back = hand === 'R'
    ? grip([-0.46, 0.18, -0.24], [-0.4, 0.7, -0.6], [-0.7, -0.3, 0.3])
    : grip([0.46, 0.18, -0.24], [0.4, 0.7, -0.6], [0.7, -0.3, 0.3], [0, -1, 0], 'L');
  const out = hand === 'R'
    ? grip([-0.16, 0.06, 0.52], [0.1, 0.2, 0.97], [-0.6, -0.5, -0.3])
    : grip([0.16, 0.06, 0.52], [-0.1, 0.2, 0.97], [0.6, -0.5, -0.3], [0, -1, 0], 'L');
  const haul = hand === 'R'
    ? grip([-0.4, -0.08, 0.0], [-0.3, 0.6, 0.75], [-0.7, -0.4, -0.3])
    : grip([0.4, -0.08, 0.0], [0.3, 0.6, 0.75], [0.7, -0.4, -0.3], [0, -1, 0], 'L');
  const idle = hand === 'R' ? KR_IDLE : KL_IDLE;
  const arm = hand === 'R' ? 'R' : 'L';
  return {
    name, dur: 0.56, fadeIn: 0.04, fadeOut: 0.16,
    events: { throw: 0.14, combo: 0.26, haul: 0.36 },
    keys: mergeKeys(
      [ch(0, idle), ch(0.08, back, 'out'), ch(0.16, out, 'outExpo'), ch(0.34, out), ch(0.44, haul, 'inOut'), ch(0.56, idle, 'inOut')],
      [
        body(0, KR(), HIPS),
        body(0.08, KR({ hips: [0, -26 * k, 0], spine: [-4, -8 * k, 0], chest: [-6, -14 * k, 0], head: [-4, 20 * k, 0] }), HIPS, 'out'),
        body(0.16, KR({ hips: [6, 24 * k, 0], spine: [8, 10 * k, 0], chest: [6, 16 * k, 0], head: [-6, -18 * k, 0], [`thigh.${arm === 'R' ? 'L' : 'R'}`]: [-34, 0, 6 * k], [`shin.${arm === 'R' ? 'L' : 'R'}`]: [30, 0, 0] }), [0, -0.06, 0.1], 'outExpo'),
        body(0.44, KR({ hips: [-4, -10 * k, 0], chest: [-6, -8 * k, 0] }), [0, -0.03, -0.04], 'inOut'),
        body(0.56, KR(), HIPS, 'inOut'),
      ],
    ),
  };
}

const k1 = throwClip('hs_k1', 'R');
const k2 = throwClip('hs_k2', 'L');

// 3: the chain swung wide — the right sickle whirled out level at the chain's length, right to left
const k3: ClipDef = {
  name: 'hs_k3', dur: 0.56, fadeIn: 0.04, fadeOut: 0.16,
  events: { swing: 0.1, combo: 0.28 },
  keys: mergeKeys(
    [
      ch(0, KR_IDLE),
      ch(0.1, grip([-0.5, 0.1, -0.1], [-0.9, 0.2, -0.3], [-0.6, -0.5, 0.4]), 'out'),
      ch(0.22, grip([-0.1, 0.12, 0.5], [0.2, 0.2, 0.95], [-0.6, -0.6, -0.3]), 'out'),
      ch(0.34, grip([0.3, 0.12, 0.36], [0.9, 0.2, 0.3], [-0.4, -0.7, -0.4])),
      ch(0.56, KR_IDLE, 'inOut'),
    ],
    [
      body(0, KR(), HIPS),
      body(0.1, KR({ hips: [0, -40, 0], spine: [0, -12, 0], chest: [-4, -18, 0], head: [0, 30, 0] }), HIPS, 'out'),
      body(0.24, KR({ hips: [6, 30, 0], spine: [8, 14, 0], chest: [6, 18, 0], head: [-6, -20, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [26, 0, 0] }), [0, -0.06, 0.08], 'out'),
      body(0.34, KR({ hips: [4, 40, 0], spine: [6, 16, 0], chest: [4, 22, 0], head: [-6, -26, 0] }), [0, -0.05, 0.06]),
      body(0.56, KR(), HIPS, 'inOut'),
    ],
  ),
};

// 4: the yank — both fists hauled back hard; the far sickle comes round from behind the target
const k4: ClipDef = {
  name: 'hs_k4', dur: 0.56, fadeIn: 0.04, fadeOut: 0.18,
  events: { yank: 0.18 },
  keys: mergeKeys(
    [
      both(0, KR_IDLE, KL_IDLE),
      both(0.1, grip([-0.2, 0.0, 0.46], [0, 0.4, 0.92], [-0.6, -0.5, -0.3]), grip([0.2, 0.0, 0.46], [0, 0.4, 0.92], [0.6, -0.5, -0.3], [0, -1, 0], 'L'), 'out'),
      both(0.2, grip([-0.42, -0.1, -0.1], [-0.4, 0.5, 0.75], [-0.7, -0.4, 0.2]), grip([0.42, -0.1, -0.1], [0.4, 0.5, 0.75], [0.7, -0.4, 0.2], [0, -1, 0], 'L'), 'outExpo'),
      both(0.56, KR_IDLE, KL_IDLE, 'inOut'),
    ],
    [
      body(0, KR(), HIPS),
      body(0.1, KR({ spine: [10, 0, 0], chest: [6, 0, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [30, 0, 0] }), [0, -0.05, 0.08], 'out'),
      body(0.2, KR({ hips: [-6, 0, 0], spine: [-14, 0, 0], chest: [-10, 0, 0], head: [8, 0, 0], 'thigh.L': [-10, 0, 6], 'shin.L': [20, 0, 0], 'thigh.R': [20, 0, -8], 'shin.R': [30, 0, 0] }), [0, -0.08, -0.12], 'outExpo'),
      body(0.56, KR(), HIPS, 'inOut'),
    ],
  ),
};

// the fan spin: the right fist whirls the chain overhead while the left keeps its sickle up (a loop; the kit holds it)
const fan: ClipDef = {
  name: 'hs_fan', dur: 0.5, fadeIn: 0.08, fadeOut: 0.2, loop: true,
  events: {},
  keys: mergeKeys(
    [
      both(0, grip([-0.2, 0.42, 0.2], [-0.3, 0.9, 0.2], [-0.6, -0.2, -0.75]), grip([0.34, -0.04, 0.3], [0.1, 0.7, 0.7], [0.7, -0.4, -0.55], [0, -1, 0], 'L')),
      both(0.125, grip([-0.08, 0.46, 0.06], [0.1, 0.95, -0.2], [-0.6, -0.2, -0.75]), grip([0.34, -0.04, 0.3], [0.1, 0.7, 0.7], [0.7, -0.4, -0.55], [0, -1, 0], 'L')),
      both(0.25, grip([-0.2, 0.42, -0.08], [-0.2, 0.9, -0.4], [-0.6, -0.2, -0.75]), grip([0.34, -0.04, 0.3], [0.1, 0.7, 0.7], [0.7, -0.4, -0.55], [0, -1, 0], 'L')),
      both(0.375, grip([-0.32, 0.4, 0.06], [-0.6, 0.8, 0.0], [-0.6, -0.2, -0.75]), grip([0.34, -0.04, 0.3], [0.1, 0.7, 0.7], [0.7, -0.4, -0.55], [0, -1, 0], 'L')),
      both(0.5, grip([-0.2, 0.42, 0.2], [-0.3, 0.9, 0.2], [-0.6, -0.2, -0.75]), grip([0.34, -0.04, 0.3], [0.1, 0.7, 0.7], [0.7, -0.4, -0.55], [0, -1, 0], 'L')),
    ],
    [
      body(0, KR({ spine: [-4, 0, 0], chest: [-4, 0, 0], head: [-6, 0, 0], 'thigh.L': [-22, 0, 10], 'thigh.R': [12, 0, -10] }), [0, -0.06, 0]),
      body(0.25, KR({ spine: [-4, 6, 0], chest: [-4, 6, 0], head: [-6, -6, 0], 'thigh.L': [-22, 0, 10], 'thigh.R': [12, 0, -10] }), [0, -0.06, 0]),
      body(0.5, KR({ spine: [-4, 0, 0], chest: [-4, 0, 0], head: [-6, 0, 0], 'thigh.L': [-22, 0, 10], 'thigh.R': [12, 0, -10] }), [0, -0.06, 0]),
    ],
  ),
};

// the steered throw: a wide sidearm throw, the arm sweeping to steer it round, then the yank
const steer: ClipDef = {
  name: 'hs_steer', dur: 0.9, fadeIn: 0.05, fadeOut: 0.2,
  events: { throw: 0.16, steer: 0.36, yank: 0.62 },
  keys: mergeKeys(
    [
      ch(0, KR_IDLE),
      ch(0.08, grip([-0.5, 0.0, -0.2], [-0.8, 0.3, -0.5], [-0.6, -0.5, 0.4]), 'out'),
      ch(0.18, grip([-0.3, 0.02, 0.5], [-0.3, 0.2, 0.93], [-0.6, -0.6, -0.3]), 'outExpo'),
      ch(0.4, grip([0.1, 0.06, 0.48], [0.4, 0.2, 0.9], [-0.5, -0.6, -0.4]), 'inOut'),
      ch(0.56, grip([0.12, 0.06, 0.46], [0.4, 0.2, 0.9], [-0.5, -0.6, -0.4])),
      ch(0.66, grip([-0.4, -0.1, -0.08], [-0.4, 0.5, 0.75], [-0.7, -0.4, 0.2]), 'outExpo'),
      ch(0.9, KR_IDLE, 'inOut'),
    ],
    [
      body(0, KR(), HIPS),
      body(0.08, KR({ hips: [0, -40, 0], chest: [-4, -16, 0], head: [0, 30, 0] }), HIPS, 'out'),
      body(0.18, KR({ hips: [6, 10, 0], spine: [8, 6, 0], chest: [6, 10, 0], head: [-6, -10, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [26, 0, 0] }), [0, -0.06, 0.1], 'outExpo'),
      body(0.4, KR({ hips: [4, 30, 0], spine: [6, 12, 0], chest: [4, 18, 0], head: [-6, -20, 0] }), [0, -0.05, 0.08], 'inOut'),
      body(0.66, KR({ hips: [-6, 0, 0], spine: [-12, 0, 0], chest: [-8, 0, 0], 'thigh.R': [20, 0, -8], 'shin.R': [30, 0, 0] }), [0, -0.08, -0.1], 'outExpo'),
      body(0.9, KR(), HIPS, 'inOut'),
    ],
  ),
};

// Kubikake: the throw, the chain catching round the neck, the haul up and back, the slam down
const kubi: ClipDef = {
  name: 'hs_kubi', dur: 1.05, fadeIn: 0.05, fadeOut: 0.22,
  events: { throw: 0.14, catch: 0.3, haul: 0.46, slam: 0.72 },
  keys: mergeKeys(
    [
      both(0, KR_IDLE, KL_IDLE),
      both(0.08, grip([-0.46, 0.18, -0.24], [-0.4, 0.7, -0.6], [-0.7, -0.3, 0.3]), KL_IDLE, 'out'),
      both(0.16, grip([-0.16, 0.08, 0.52], [0.1, 0.2, 0.97], [-0.6, -0.5, -0.3]), KL_IDLE, 'outExpo'),
      both(0.46, grip([-0.3, 0.36, -0.1], [-0.2, 0.9, 0.3], [-0.7, -0.2, -0.3]), grip([0.3, 0.36, -0.1], [0.2, 0.9, 0.3], [0.7, -0.2, -0.3], [0, -1, 0], 'L'), 'inOut'),
      both(0.74, grip([-0.24, -0.36, 0.3], [-0.1, -0.2, 0.97], [-0.7, -0.4, -0.3]), grip([0.24, -0.36, 0.3], [0.1, -0.2, 0.97], [0.7, -0.4, -0.3], [0, -1, 0], 'L'), 'inExpo'),
      both(1.05, KR_IDLE, KL_IDLE, 'inOut'),
    ],
    [
      body(0, KR(), HIPS),
      body(0.08, KR({ hips: [0, -26, 0], chest: [-6, -14, 0], head: [-4, 20, 0] }), HIPS, 'out'),
      body(0.16, KR({ hips: [6, 20, 0], spine: [8, 10, 0], chest: [6, 14, 0], head: [-6, -16, 0], 'thigh.L': [-34, 0, 6], 'shin.L': [30, 0, 0] }), [0, -0.06, 0.1], 'outExpo'),
      body(0.46, KR({ hips: [-8, 0, 0], spine: [-16, 0, 0], chest: [-12, 0, 0], head: [-6, 0, 0], 'thigh.L': [-6, 0, 6], 'thigh.R': [24, 0, -8], 'shin.R': [30, 0, 0] }), [0, -0.04, -0.14], 'inOut'),
      body(0.74, KR({ hips: [14, 0, 0], spine: [24, 0, 0], chest: [16, 0, 0], head: [-10, 0, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [60, 0, 0], 'thigh.R': [20, 0, -8], 'shin.R': [40, 0, 0] }), [0, -0.24, 0.12], 'inExpo'),
      body(1.05, KR(), HIPS, 'inOut'),
    ],
  ),
};

// the chain bind: the throw, the chain wrapping them, the left palm laid on the chain for Tsuzuri Raiden
const bind: ClipDef = {
  name: 'hs_bind', dur: 0.95, fadeIn: 0.05, fadeOut: 0.22,
  events: { throw: 0.14, wrap: 0.32, raiden: 0.52 },
  keys: mergeKeys(
    [
      both(0, KR_IDLE, KL_IDLE),
      both(0.08, grip([-0.46, 0.18, -0.24], [-0.4, 0.7, -0.6], [-0.7, -0.3, 0.3]), KL_IDLE, 'out'),
      both(0.16, grip([-0.16, 0.06, 0.52], [0.1, 0.2, 0.97], [-0.6, -0.5, -0.3]), KL_IDLE, 'outExpo'),
      both(0.36, grip([-0.3, -0.06, 0.2], [-0.2, 0.5, 0.85], [-0.7, -0.4, -0.3]), grip([0.06, -0.02, 0.5], [-0.3, 0.2, 0.93], [0.6, -0.5, -0.3], [0, -1, 0], 'L'), 'inOut'),
      both(0.7, grip([-0.3, -0.06, 0.2], [-0.2, 0.5, 0.85], [-0.7, -0.4, -0.3]), grip([0.06, -0.02, 0.52], [-0.3, 0.2, 0.93], [0.6, -0.5, -0.3], [0, -1, 0], 'L')),
      both(0.95, KR_IDLE, KL_IDLE, 'inOut'),
    ],
    [
      body(0, KR(), HIPS),
      body(0.08, KR({ hips: [0, -26, 0], chest: [-6, -14, 0], head: [-4, 20, 0] }), HIPS, 'out'),
      body(0.16, KR({ hips: [6, 20, 0], spine: [8, 10, 0], chest: [6, 14, 0], head: [-6, -16, 0], 'thigh.L': [-34, 0, 6], 'shin.L': [30, 0, 0] }), [0, -0.06, 0.1], 'outExpo'),
      body(0.52, KR({ spine: [8, 0, 0], chest: [6, 0, 0], head: [6, 0, 0], 'thigh.L': [-28, 0, 6], 'shin.L': [26, 0, 0] }), [0, -0.05, 0.06], 'inOut'),
      body(0.95, KR(), HIPS, 'inOut'),
    ],
  ),
};

// chain-life: the chain wound round both forearms, the fists crossed before him
const life: ClipDef = {
  name: 'hs_life', dur: 0.7, fadeIn: 0.06, fadeOut: 0.2,
  events: { life: 0.3 },
  keys: mergeKeys(
    [
      both(0, KR_IDLE, KL_IDLE),
      both(0.3, grip([0.06, 0.06, 0.36], [0.6, 0.7, 0.3], [-0.6, -0.5, -0.4]), grip([-0.06, 0.1, 0.34], [-0.6, 0.7, 0.3], [0.6, -0.5, -0.4], [0, -1, 0], 'L'), 'outExpo'),
      both(0.5, grip([0.06, 0.06, 0.36], [0.6, 0.7, 0.3], [-0.6, -0.5, -0.4]), grip([-0.06, 0.1, 0.34], [-0.6, 0.7, 0.3], [0.6, -0.5, -0.4], [0, -1, 0], 'L')),
      both(0.7, KR_IDLE, KL_IDLE, 'inOut'),
    ],
    [
      body(0, KR(), HIPS),
      body(0.3, KR({ spine: [6, 0, 0], chest: [4, 0, 0], head: [8, 0, 0] }), [0, -0.05, 0], 'outExpo'),
      body(0.7, KR(), HIPS, 'inOut'),
    ],
  ),
};

// the Bankai: both sickles raised overhead as the chains climb into the orb
const bankai: ClipDef = {
  name: 'hs_bankai', dur: 1.2, fadeIn: 0.08, fadeOut: 0.24,
  events: { name: 0.2, orb: 0.55 },
  keys: mergeKeys(
    [
      both(0, KR_IDLE, KL_IDLE),
      both(0.3, grip([-0.3, 0.1, 0.3], [-0.5, 0.6, 0.6], [-0.6, -0.4, -0.6]), grip([0.3, 0.1, 0.3], [0.5, 0.6, 0.6], [0.6, -0.4, -0.6], [0, -1, 0], 'L'), 'inOut'),
      both(0.6, grip([-0.26, 0.56, 0.06], [-0.3, 0.95, 0.0], [-0.6, -0.2, -0.75]), grip([0.26, 0.56, 0.06], [0.3, 0.95, 0.0], [0.6, -0.2, -0.75], [0, -1, 0], 'L'), 'outExpo'),
      both(0.9, grip([-0.26, 0.56, 0.06], [-0.3, 0.95, 0.0], [-0.6, -0.2, -0.75]), grip([0.26, 0.56, 0.06], [0.3, 0.95, 0.0], [0.6, -0.2, -0.75], [0, -1, 0], 'L')),
      both(1.2, KR_IDLE, KL_IDLE, 'inOut'),
    ],
    [
      body(0, KR(), HIPS),
      body(0.3, KR({ spine: [8, 0, 0], chest: [6, 0, 0], head: [10, 0, 0] }), [0, -0.06, 0], 'inOut'),
      body(0.6, KR({ spine: [-10, 0, 0], chest: [-10, 0, 0], head: [-20, 0, 0], 'thigh.L': [-22, 0, 10], 'thigh.R': [12, 0, -10] }), [0, -0.04, 0], 'outExpo'),
      body(0.9, KR({ spine: [-8, 0, 0], chest: [-8, 0, 0], head: [-16, 0, 0], 'thigh.L': [-22, 0, 10], 'thigh.R': [12, 0, -10] }), [0, -0.04, 0]),
      body(1.2, KR(), HIPS, 'inOut'),
    ],
  ),
};

// the noose: the right fist flung up — a chain drops from the orb over the target's neck
const noose: ClipDef = {
  name: 'hs_noose', dur: 0.7, fadeIn: 0.05, fadeOut: 0.2,
  events: { noose: 0.28 },
  keys: mergeKeys(
    [ch(0, KR_IDLE), ch(0.12, grip([-0.4, -0.2, 0.1], [-0.3, 0.3, 0.9], [-0.6, -0.5, -0.3]), 'out'), ch(0.28, grip([-0.16, 0.5, 0.3], [0.1, 0.9, 0.4], [-0.6, -0.2, -0.75]), 'outExpo'), ch(0.7, KR_IDLE, 'inOut')],
    [
      body(0, KR(), HIPS),
      body(0.12, KR({ spine: [10, 0, 0], chest: [6, 0, 0] }), [0, -0.06, 0], 'out'),
      body(0.28, KR({ spine: [-8, 6, 0], chest: [-8, 8, 0], head: [-14, -6, 0] }), [0, -0.02, 0.04], 'outExpo'),
      body(0.7, KR(), HIPS, 'inOut'),
    ],
  ),
};

// Hangman's Verdict: the left sickle cuts his own noose, then the right comes down over his head on them
const verdict: ClipDef = {
  name: 'hs_verdict', dur: 1.0, fadeIn: 0.05, fadeOut: 0.22,
  events: { cut: 0.26, strike: 0.6 },
  keys: mergeKeys(
    [
      both(0, KR_IDLE, KL_IDLE),
      both(0.22, grip([-0.3, 0.3, -0.1], [-0.3, 0.9, 0.2], [-0.6, -0.2, -0.75]), grip([0.1, 0.3, 0.12], [-0.8, 0.3, 0.5], [0.6, -0.4, -0.6], [0, -1, 0], 'L'), 'inOut'),
      both(0.3, grip([-0.3, 0.4, -0.16], [-0.2, 0.8, -0.5], [-0.6, -0.2, -0.75]), grip([0.36, 0.26, 0.1], [0.8, 0.3, 0.5], [0.6, -0.4, -0.6], [0, -1, 0], 'L'), 'outExpo'),
      both(0.62, grip([-0.14, -0.3, 0.46], [0.0, -0.5, 0.86], [-0.6, -0.4, -0.4]), KL_IDLE, 'inExpo'),
      both(1.0, KR_IDLE, KL_IDLE, 'inOut'),
    ],
    [
      body(0, KR(), HIPS),
      body(0.22, KR({ head: [10, 10, 0], spine: [-4, 0, 0] }), HIPS, 'inOut'),
      body(0.36, KR({ spine: [-14, 0, 0], chest: [-10, 0, 0], head: [-10, 0, 0] }), [0, 0.02, -0.04], 'out'),
      body(0.62, KR({ hips: [12, 0, 0], spine: [20, 0, 0], chest: [14, 0, 0], head: [-6, 0, 0], 'thigh.L': [-48, 0, 6], 'shin.L': [50, 0, 0], 'thigh.R': [24, 0, -8], 'shin.R': [30, 0, 0] }), [0, -0.18, 0.24], 'inExpo'),
      body(1.0, KR(), HIPS, 'inOut'),
    ],
  ),
};

export const HISAGI_CLIPS: ClipDef[] = [s1, s2, s3, s4, draw, rod, band, raiden, sajo, kare, ...SHARED];
export const HISAGI_CHAIN = ['hs_s1', 'hs_s2', 'hs_s3', 'hs_s4'];
/** the Shikai and the Bankai share a clip set (the release clips run on through each swap) */
export const KAZESHINI_CLIPS: ClipDef[] = [k1, k2, k3, k4, fan, steer, kubi, bind, life, bankai, noose, verdict, band, kare, ...SHARED];
export const KAZESHINI_CHAIN = ['hs_k1', 'hs_k2', 'hs_k3', 'hs_k4'];
