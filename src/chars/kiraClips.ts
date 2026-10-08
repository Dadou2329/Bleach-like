// Izuru Kira's animation set (docs/kits/kira.md). A slender, slightly stooped swordsman whose guard looks like
// resignation: the sword low in his right hand, the point down toward their feet. Sealed: a cold, short string (the
// thrust, a diagonal cut, the rising cut that launches, the flat cut), Kidō from the left palm (Enkōsen's disc,
// Shakkahō, Sajō Sabaku closing into a fist, Gaten's touch to the neck), Tōzanshō's triangle of hands, Tenran's
// sword spun like a fan, Kaidō's hands over the wound, "Omote o agero" with the blade upright before his face and
// the left hand drawn along it. Shikai: the hook thrust, the backhand cut, the rising hook, the downward chop; the
// hook pull; the reverse guillotine (the hook set under a kneeling chin, then the lift) and Penance's ten strikes;
// the weighted parry; Heavy Step (the knee raised, the fist clenched, the stomp) and the meteor drop; Debris Rain.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type C3 = [number, number, number];
type B = NonNullable<KeyDef['b']>;

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
const body = (t: number, b: B, hips?: KeyDef['hips'], ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });
const ch = (t: number, c: Record<string, C3>, ease?: KeyDef['ease']): KeyDef => ({ t, ease, c });

const SHARED = ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name));

const IDLE: B = {
  // a slight stoop, the head bowed, the left hand loose at his side
  hips: [0, -10, 0], spine: [6, 4, 0], chest: [5, 6, 0], neck: [6, 0, 0], head: [6, -8, 0],
  'thigh.L': [-12, 0, 4], 'shin.L': [14, 0, 0], 'foot.L': [-3, 0, 0], 'thigh.R': [8, 0, -5], 'shin.R': [10, 0, 0], 'foot.R': [-4, 0, 0],
  'upperarm.L': [6, 0, 10], 'forearm.L': [-16, 0, 0], 'hand.L': [0, 0, 8],
};
const R = (over: B = {}): B => ({ ...IDLE, ...over });
const HIPS: C3 = [0, -0.03, 0];
const SG = { p: [-0.29, -0.3, 0.16] as C3, dir: [-0.08, -0.62, 0.78] as C3, pole: [-0.6, -0.3, -0.75] as C3 };
const SG_IDLE = grip(SG.p, SG.dir, SG.pole);
const WG = { p: [-0.28, -0.3, 0.18] as C3, dir: [-0.05, -0.7, 0.71] as C3, pole: [-0.6, -0.3, -0.75] as C3 };
const WG_IDLE = grip(WG.p, WG.dir, WG.pole);

export const KIRA_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.03,
  run: { 'upperarm.L': [-30, 0, 14], 'forearm.L': [-60, 0, 0], 'hand.L': [0, 0, 0], chest: [6, 0, 0] },
  sprint: { spine: [18, 0, 0], 'upperarm.L': [40, 0, 14], 'forearm.L': [-30, 0, 0], 'hand.L': [10, 0, 0] },
  swingL: 0.8,
  swingR: 0.2,
  grip: {
    idle: { p: SG.p, dir: SG.dir, edge: [0, -0.78, -0.62], pole: SG.pole },
    walk: { p: [-0.29, -0.3, 0.14], dir: [-0.1, -0.6, 0.79], edge: [0, -0.79, -0.6], pole: SG.pole },
    run: { p: [-0.3, -0.24, -0.1], dir: [-0.2, -0.25, -0.95], edge: [0, -0.96, 0.25], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.28, -0.12, -0.2], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.36, -0.08, 0.1], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

/** Shikai: the same resigned guard, the hook hanging just off the ground in front of him. */
export const WABISUKE_STANCE: StanceDef = {
  ...KIRA_STANCE,
  grip: {
    ...KIRA_STANCE.grip,
    idle: { p: WG.p, dir: WG.dir, edge: [0, -0.71, -0.7], pole: WG.pole },
    walk: { p: [-0.28, -0.3, 0.16], dir: [-0.06, -0.68, 0.73], edge: [0, -0.73, -0.68], pole: WG.pole },
  },
};

// ================================================================== sealed string

// 1: the thrust — drawn back to the hip, then straight out at the chest
const s1: ClipDef = {
  name: 'kr_s1', dur: 0.44, fadeIn: 0.05, fadeOut: 0.16,
  events: { step: 0.08, combo: 0.26 },
  keys: mergeKeys(
    [
      ch(0, SG_IDLE),
      ch(0.09, grip([-0.24, -0.2, -0.12], [0.05, -0.05, 1], [-0.7, -0.3, -0.6]), 'out'),
      ch(0.17, grip([-0.1, 0.02, 0.52], [-0.12, 0.02, 1], [-0.7, -0.3, -0.4]), 'outExpo'),
      ch(0.26, grip([-0.1, 0.0, 0.5], [-0.12, 0.0, 1], [-0.7, -0.3, -0.4])),
      ch(0.44, SG_IDLE, 'inOut'),
    ],
    [
      body(0, R(), HIPS),
      body(0.09, R({ hips: [0, -26, 0], spine: [2, -10, 0], chest: [0, -16, 0], head: [2, 22, 0], 'thigh.R': [14, 0, -6], 'shin.R': [20, 0, 0] }), [0, -0.05, -0.03], 'out'),
      body(0.17, R({ hips: [4, 4, 0], spine: [10, 2, 0], chest: [6, 2, 0], head: [-2, -6, 0], 'thigh.L': [-36, 0, 4], 'shin.L': [30, 0, 0], 'thigh.R': [22, 0, -6], 'shin.R': [18, 0, 0], 'upperarm.L': [16, 0, 30] }), [0, -0.08, 0.1], 'outExpo'),
      body(0.44, R(), HIPS, 'inOut'),
    ],
  ),
};

// 2: a short diagonal cut, high right to low left
const s2: ClipDef = {
  name: 'kr_s2', dur: 0.44, fadeIn: 0.05, fadeOut: 0.16,
  events: { step: 0.06, combo: 0.26 },
  keys: mergeKeys(
    swingKeys({ a: [-0.7, 0.7, 0], b: [0, 0, 1], c: [-0.04, 0.05, 0.12], r: 0.36, pole: [-0.7, -0.4, -0.5], keys: [[0, 40, 'out'], [0.1, 0, 'out'], [0.2, 170, 'out'], [0.44, 140, 'inOut']] }),
    [
      body(0, R(), HIPS),
      body(0.1, R({ hips: [0, -26, 0], spine: [4, -8, 0], chest: [0, -14, 0], head: [-2, 16, 0] }), HIPS, 'out'),
      body(0.2, R({ hips: [6, 18, 0], spine: [10, 10, 0], chest: [6, 16, 0], head: [-4, -14, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [26, 0, 0], 'thigh.R': [18, 0, -8], 'shin.R': [20, 0, 0] }), [0, -0.07, 0.08], 'out'),
      body(0.44, R(), HIPS, 'inOut'),
    ],
  ),
};

// 3: the rising cut, low left to high right (launches)
const s3: ClipDef = {
  name: 'kr_s3', dur: 0.48, fadeIn: 0.05, fadeOut: 0.18,
  events: { step: 0.06, combo: 0.28 },
  keys: mergeKeys(
    swingKeys({ a: [0.6, -0.8, 0], b: [0, 0, 1], c: [-0.04, 0.0, 0.12], r: 0.36, pole: [-0.6, -0.5, -0.5], keys: [[0, 30, 'out'], [0.1, 10, 'out'], [0.21, 168, 'out'], [0.48, 150, 'inOut']] }),
    [
      body(0, R(), HIPS),
      body(0.1, R({ hips: [10, 18, 0], spine: [14, 12, 0], chest: [10, 16, 0], head: [-6, -14, 0], 'thigh.L': [-30, 0, 8], 'shin.L': [44, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [34, 0, 0] }), [0, -0.14, 0.02], 'out'),
      body(0.21, R({ hips: [-6, -16, 0], spine: [-8, -10, 0], chest: [-10, -16, 0], head: [-4, 16, 0], 'thigh.L': [-10, 0, 6], 'shin.L': [10, 0, 0], 'thigh.R': [6, 0, -6], 'shin.R': [8, 0, 0], 'upperarm.L': [10, 0, 40] }), [0, 0.02, 0.06], 'out'),
      body(0.48, R(), HIPS, 'inOut'),
    ],
  ),
};

// 4: the flat cut, right to left at the waist, a step through
const s4: ClipDef = {
  name: 'kr_s4', dur: 0.56, fadeIn: 0.05, fadeOut: 0.2,
  events: { step: 0.08 },
  keys: mergeKeys(
    swingKeys({ a: [-1, -0.05, 0], b: [0, 0, 1], c: [0, -0.04, 0.1], r: 0.38, pole: [-0.5, -0.65, -0.55], keys: [[0, -20, 'out'], [0.12, -45, 'out'], [0.24, 175, 'out'], [0.56, 140, 'inOut']] }),
    [
      body(0, R(), HIPS),
      body(0.12, R({ hips: [0, -32, 0], spine: [4, -14, 0], chest: [0, -22, 0], head: [-2, 28, 0], 'thigh.R': [16, 0, -8], 'shin.R': [24, 0, 0] }), [0, -0.05, -0.02], 'out'),
      body(0.24, R({ hips: [4, 26, 0], spine: [8, 18, 0], chest: [6, 26, 0], head: [-4, -26, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [36, 0, 0], 'thigh.R': [24, 0, -6], 'shin.R': [22, 0, 0], 'upperarm.L': [-10, 0, 34], 'forearm.L': [-30, 0, 0] }), [0, -0.1, 0.12], 'out'),
      body(0.56, R(), HIPS, 'inOut'),
    ],
  ),
};

// ================================================================== Kidō

/** the left palm thrust out at the target, held (Enkōsen's disc, Shakkahō, the opening of Sajō Sabaku) */
const PALM: B = { 'upperarm.L': [-84, 0, -4], 'forearm.L': [-4, 0, 0], 'hand.L': [-70, 0, 0] };
const palm: ClipDef = {
  name: 'kr_palm', dur: 0.5, fadeIn: 0.05, fadeOut: 0.18,
  events: { cast: 0.12 },
  keys: mergeKeys(
    [ch(0, SG_IDLE)],
    [
      body(0, R(), HIPS),
      body(0.12, R({ hips: [2, 12, 0], chest: [4, 12, 0], head: [-2, -12, 0], ...PALM, 'thigh.L': [-24, 0, 4], 'shin.L': [22, 0, 0] }), [0, -0.04, 0.05], 'outExpo'),
      body(0.36, R({ hips: [2, 12, 0], chest: [4, 12, 0], head: [-2, -12, 0], ...PALM, 'thigh.L': [-24, 0, 4], 'shin.L': [22, 0, 0] }), [0, -0.04, 0.05]),
      body(0.5, R(), HIPS, 'inOut'),
    ],
  ),
};

// Sajō Sabaku: the palm thrust at the target, then closed into a fist as the rope binds them
const sajo: ClipDef = {
  name: 'kr_sajo', dur: 0.64, fadeIn: 0.06, fadeOut: 0.18,
  events: { bind: 0.32 },
  keys: mergeKeys(
    [ch(0, SG_IDLE)],
    [
      body(0, R(), HIPS),
      body(0.18, R({ hips: [2, 12, 0], chest: [4, 10, 0], head: [-4, -10, 0], ...PALM, 'thigh.L': [-28, 0, 4], 'shin.L': [26, 0, 0] }), [0, -0.04, 0.06], 'outExpo'),
      body(0.32, R({ hips: [2, 10, 0], chest: [6, 10, 0], head: [-2, -10, 0], 'upperarm.L': [-80, 0, 0], 'forearm.L': [-30, 0, 0], 'hand.L': [10, 0, 0], 'thigh.L': [-28, 0, 4], 'shin.L': [26, 0, 0] }), [0, -0.04, 0.05], 'outExpo'),
      body(0.64, R(), HIPS, 'inOut'),
    ],
  ),
};

// Gaten: a step in, two fingers of the left hand to the side of their neck
const gaten: ClipDef = {
  name: 'kr_gaten', dur: 0.5, fadeIn: 0.05, fadeOut: 0.18,
  events: { drop: 0.2 },
  keys: mergeKeys(
    [ch(0, SG_IDLE)],
    [
      body(0, R(), HIPS),
      body(0.2, R({ hips: [4, 16, 0], spine: [8, 6, 0], chest: [6, 10, 0], head: [6, -12, 0], 'upperarm.L': [-96, 0, -16], 'forearm.L': [-26, 0, 0], 'hand.L': [-30, 0, 0], 'thigh.L': [-34, 0, 4], 'shin.L': [30, 0, 0], 'thigh.R': [16, 0, -4], 'shin.R': [20, 0, 0] }), [0, -0.06, 0.1], 'outExpo'),
      body(0.5, R(), HIPS, 'inOut'),
    ],
  ),
};

// Tōzanshō: both hands raised before the face, thumbs and fingers touching in a triangle
const TRI: B = { 'upperarm.L': [-80, -20, -38], 'forearm.L': [-62, 0, 0], 'hand.L': [-20, 0, -20], 'upperarm.R': [-80, 20, 38], 'forearm.R': [-62, 0, 0], 'hand.R': [-20, 0, 20], head: [-2, 0, 0] };
const tozan: ClipDef = {
  name: 'kr_tozan', dur: 0.62, fadeIn: 0.06, fadeOut: 0.2,
  events: { cast: 0.2 },
  keys: mergeKeys(
    [ch(0, SG_IDLE), { t: 0.12, c: { '@ikR': [0, 0, 0] } }, { t: 0.5, c: { '@ikR': [0, 0, 0] } }, { t: 0.62, c: { ...SG_IDLE, '@ikR': [1, 0, 0] }, ease: 'inOut' }],
    [
      body(0, R(), HIPS),
      body(0.2, R({ ...TRI, spine: [2, 0, 0], chest: [-2, 0, 0] }), HIPS, 'outExpo'),
      body(0.5, R({ ...TRI, spine: [2, 0, 0], chest: [-2, 0, 0] }), HIPS),
      body(0.62, R(), HIPS, 'inOut'),
    ],
  ),
};

// Kaidō: the hands cupped over his own wound, the head bowed (held while he channels)
const kaido: ClipDef = {
  name: 'kr_kaido', dur: 0.4, fadeIn: 0.08, fadeOut: 0.25,
  keys: mergeKeys(
    [ch(0, SG_IDLE), { t: 0.2, c: { '@ikR': [0, 0, 0] } }],
    [
      body(0, R(), HIPS),
      body(0.4, R({ spine: [12, 0, 0], chest: [10, 0, 0], neck: [10, 0, 0], head: [16, 0, 0], 'upperarm.L': [-34, 0, -20], 'forearm.L': [-84, 0, 0], 'hand.L': [-10, 0, -20], 'upperarm.R': [-30, 0, 18], 'forearm.R': [-80, 0, 0], 'hand.R': [-10, 0, 20], 'thigh.L': [-16, 0, 4], 'shin.L': [24, 0, 0], 'thigh.R': [6, 0, -4], 'shin.R': [22, 0, 0] }), [0, -0.06, 0], 'inOut'),
    ],
  ),
};

// Tenran: the sword held out in front and spun like a fan (two turns), then thrust out with the wind
const tenran: ClipDef = {
  name: 'kr_tenran', dur: 0.62, fadeIn: 0.05, fadeOut: 0.18,
  events: { wind: 0.4 },
  keys: mergeKeys(
    swingKeys({ a: [0, 1, 0], b: [1, 0, 0], c: [-0.06, 0.1, 0.42], r: 0.05, pole: [-0.6, -0.5, -0.6], keys: [[0, 160, 'inOut'], [0.1, 200, 'in'], [0.22, 380, 'linear'], [0.34, 560, 'linear'], [0.4, 640, 'out']] }),
    [ch(0.62, SG_IDLE, 'inOut')],
    [
      body(0, R(), HIPS),
      body(0.1, R({ chest: [0, 4, 0], head: [-4, -4, 0], 'upperarm.L': [-40, 0, 20], 'forearm.L': [-50, 0, 0] }), HIPS, 'out'),
      body(0.4, R({ hips: [2, 8, 0], chest: [2, 8, 0], head: [-6, -6, 0], 'upperarm.L': [-60, 0, 10], 'forearm.L': [-20, 0, 0], 'thigh.L': [-26, 0, 4], 'shin.L': [24, 0, 0] }), [0, -0.04, 0.05], 'out'),
      body(0.62, R(), HIPS, 'inOut'),
    ],
  ),
};

// "Omote o agero": the blade raised upright before his face, the left hand drawn up along the flat, then lowered
const release: ClipDef = {
  name: 'kr_release', dur: 0.9, fadeIn: 0.06, fadeOut: 0.22,
  events: { name: 0.22, fold: 0.42 },
  keys: mergeKeys(
    [
      ch(0, SG_IDLE),
      ch(0.18, grip([-0.04, 0.0, 0.3], [0.0, 1, 0.1], [-0.8, -0.4, -0.3], [0, 0, 1]), 'inOut'),
      ch(0.6, grip([-0.04, 0.0, 0.3], [0.0, 1, 0.1], [-0.8, -0.4, -0.3], [0, 0, 1])),
      ch(0.9, WG_IDLE, 'inOut'),
    ],
    [
      body(0, R(), HIPS),
      body(0.18, R({ chest: [0, 0, 0], neck: [0, 0, 0], head: [-6, 0, 0], 'upperarm.L': [-66, 0, -26], 'forearm.L': [-70, 0, 0], 'hand.L': [-10, 0, -40] }), HIPS, 'inOut'),
      body(0.42, R({ chest: [0, 0, 0], neck: [0, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-110, 0, -20], 'forearm.L': [-40, 0, 0], 'hand.L': [-10, 0, -40] }), HIPS, 'inOut'),
      body(0.6, R({ chest: [2, 0, 0], head: [-4, 0, 0], 'upperarm.L': [-30, 0, 20], 'forearm.L': [-30, 0, 0] }), HIPS, 'inOut'),
      body(0.9, R(), HIPS, 'inOut'),
    ],
  ),
};

// ================================================================== Shikai

// 1: the hook thrust
const w1: ClipDef = { ...s1, name: 'kw_s1', keys: s1.keys.map((k) => (k.c && k.c['@gripR'] === SG.p ? { ...k, c: { ...k.c, ...WG_IDLE } } : k)) };

// 2: the backhand cut, left to right
const w2: ClipDef = {
  name: 'kw_s2', dur: 0.46, fadeIn: 0.05, fadeOut: 0.16,
  events: { step: 0.06, combo: 0.27 },
  keys: mergeKeys(
    swingKeys({ a: [1, 0.1, 0], b: [0, 0, 1], c: [-0.06, 0.02, 0.1], r: 0.36, pole: [-0.4, -0.6, -0.6], keys: [[0, 30, 'out'], [0.1, -20, 'out'], [0.21, 170, 'out'], [0.46, 140, 'inOut']] }),
    [ch(0.46, WG_IDLE, 'inOut')],
    [
      body(0, R(), HIPS),
      body(0.1, R({ hips: [0, 22, 0], spine: [6, 14, 0], chest: [4, 22, 0], head: [-2, -20, 0], 'thigh.L': [-20, 0, 6], 'shin.L': [26, 0, 0] }), [0, -0.06, 0], 'out'),
      body(0.21, R({ hips: [2, -22, 0], spine: [6, -14, 0], chest: [2, -24, 0], head: [-2, 22, 0], 'thigh.L': [-14, 0, 6], 'thigh.R': [20, 0, -8], 'shin.R': [24, 0, 0], 'upperarm.L': [6, 0, 30] }), [0, -0.07, 0.08], 'out'),
      body(0.46, R(), HIPS, 'inOut'),
    ],
  ),
};

// 3: the rising hook (the launcher)
const w3: ClipDef = { ...s3, name: 'kw_s3', keys: mergeKeys(s3.keys, [ch(0.48, WG_IDLE, 'inOut')]) };

// 4: the downward chop, overhead to the ground (heavy)
const w4: ClipDef = {
  name: 'kw_s4', dur: 0.6, fadeIn: 0.05, fadeOut: 0.2,
  events: { step: 0.1 },
  keys: mergeKeys(
    swingKeys({ a: [0, 1, 0], b: [0, 0, 1], c: [-0.08, 0.06, 0.08], r: 0.38, pole: [-0.7, -0.3, -0.5], keys: [[0, 60, 'out'], [0.14, -30, 'out'], [0.26, 150, 'out'], [0.6, 130, 'inOut']] }),
    [ch(0.6, WG_IDLE, 'inOut')],
    [
      body(0, R(), HIPS),
      body(0.14, R({ hips: [-4, -6, 0], spine: [-10, 0, 0], chest: [-12, -4, 0], head: [-10, 6, 0], 'upperarm.L': [-40, 0, 30], 'forearm.L': [-50, 0, 0] }), [0, 0.02, -0.02], 'out'),
      body(0.26, R({ hips: [16, 6, 0], spine: [20, 4, 0], chest: [16, 4, 0], head: [2, -4, 0], 'thigh.L': [-44, 0, 6], 'shin.L': [52, 0, 0], 'thigh.R': [28, 0, -6], 'shin.R': [40, 0, 0], 'upperarm.L': [10, 0, 34] }), [0, -0.2, 0.12], 'out'),
      body(0.6, R(), HIPS, 'inOut'),
    ],
  ),
};

// the hook pull: reached out at neck height, then hauled down and back toward his feet
const pull: ClipDef = {
  name: 'kw_pull', dur: 0.62, fadeIn: 0.05, fadeOut: 0.2,
  events: { catch: 0.17, haul: 0.3 },
  keys: mergeKeys(
    [
      ch(0, WG_IDLE),
      ch(0.17, grip([-0.1, 0.12, 0.56], [0.0, 0.3, 1], [-0.7, -0.4, -0.4], [0, -1, 0]), 'outExpo'),
      ch(0.36, grip([-0.24, -0.34, 0.2], [-0.05, -0.85, 0.5], [-0.7, -0.3, -0.5], [0, 0, -1]), 'inOut'),
      ch(0.62, WG_IDLE, 'inOut'),
    ],
    [
      body(0, R(), HIPS),
      body(0.17, R({ hips: [4, 10, 0], spine: [10, 8, 0], chest: [6, 10, 0], head: [-4, -10, 0], 'thigh.L': [-34, 0, 4], 'shin.L': [30, 0, 0], 'thigh.R': [18, 0, -6], 'shin.R': [18, 0, 0] }), [0, -0.06, 0.12], 'outExpo'),
      body(0.36, R({ hips: [-6, -6, 0], spine: [12, -6, 0], chest: [10, -6, 0], head: [6, 6, 0], 'thigh.L': [-10, 0, 4], 'shin.L': [30, 0, 0], 'thigh.R': [-6, 0, -6], 'shin.R': [36, 0, 0] }), [0, -0.12, -0.06], 'inOut'),
      body(0.62, R(), HIPS, 'inOut'),
    ],
  ),
};

// the reverse guillotine: the hook set low under a kneeling chin, then the lift
const guillotine: ClipDef = {
  name: 'kw_guillotine', dur: 1.0, fadeIn: 0.06, fadeOut: 0.24,
  events: { set: 0.26, lift: 0.5 },
  keys: mergeKeys(
    [
      ch(0, WG_IDLE),
      ch(0.26, grip([-0.12, -0.36, 0.36], [0.1, -0.05, 1], [-0.7, -0.5, -0.3], [0, 1, 0]), 'inOut'),
      ch(0.46, grip([-0.12, -0.38, 0.36], [0.1, -0.05, 1], [-0.7, -0.5, -0.3], [0, 1, 0])),
      ch(0.56, grip([-0.1, 0.26, 0.34], [0.1, 0.2, 1], [-0.7, -0.5, -0.3], [0, 1, 0]), 'outExpo'),
      ch(0.8, grip([-0.1, 0.24, 0.34], [0.1, 0.2, 1], [-0.7, -0.5, -0.3], [0, 1, 0])),
      ch(1.0, WG_IDLE, 'inOut'),
    ],
    [
      body(0, R(), HIPS),
      body(0.26, R({ hips: [10, 0, 0], spine: [14, 0, 0], chest: [10, 0, 0], head: [10, 0, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [60, 0, 0], 'thigh.R': [8, 0, -6], 'shin.R': [60, 0, 0], 'upperarm.L': [-20, 0, 20] }), [0, -0.2, 0.04], 'inOut'),
      body(0.46, R({ hips: [10, 0, 0], spine: [14, 0, 0], chest: [10, 0, 0], head: [14, 0, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [60, 0, 0], 'thigh.R': [8, 0, -6], 'shin.R': [60, 0, 0], 'upperarm.L': [-20, 0, 20] }), [0, -0.2, 0.04]),
      body(0.56, R({ hips: [-4, 0, 0], spine: [-6, 0, 0], chest: [-8, 0, 0], head: [-6, 0, 0], 'thigh.L': [-14, 0, 6], 'shin.L': [14, 0, 0], 'thigh.R': [6, 0, -6], 'shin.R': [12, 0, 0], 'upperarm.L': [10, 0, 30] }), [0, 0.02, 0], 'outExpo'),
      body(0.8, R({ head: [16, 0, 0], neck: [10, 0, 0] }), HIPS),
      body(1.0, R(), HIPS, 'inOut'),
    ],
  ),
};

// Penance: ten short strikes, alternating chops, then (the kit) the guillotine
const penanceKeys: [number, number, 'out' | 'inOut'][] = [];
for (let i = 0; i <= 10; i++) penanceKeys.push([i * 0.09, i % 2 === 0 ? 30 : 160, 'out']);
const penance: ClipDef = {
  name: 'kw_penance', dur: 1.0, fadeIn: 0.05, fadeOut: 0.2,
  keys: mergeKeys(
    swingKeys({ a: [-0.3, 1, 0], b: [0, 0, 1], c: [-0.06, 0.04, 0.12], r: 0.34, pole: [-0.7, -0.3, -0.5], keys: [...penanceKeys, [1.0, 120, 'inOut']] }),
    [
      body(0, R(), HIPS),
      body(0.1, R({ hips: [12, 0, 0], spine: [14, 0, 0], chest: [10, 0, 0], head: [6, 0, 0], 'thigh.L': [-36, 0, 6], 'shin.L': [40, 0, 0], 'thigh.R': [16, 0, -6], 'shin.R': [30, 0, 0], 'upperarm.L': [-10, 0, 30] }), [0, -0.12, 0.06], 'out'),
      body(0.9, R({ hips: [12, 0, 0], spine: [14, 0, 0], chest: [10, 0, 0], head: [6, 0, 0], 'thigh.L': [-36, 0, 6], 'shin.L': [40, 0, 0], 'thigh.R': [16, 0, -6], 'shin.R': [30, 0, 0], 'upperarm.L': [-10, 0, 30] }), [0, -0.12, 0.06]),
      body(1.0, R(), HIPS, 'inOut'),
    ],
  ),
};

// the weighted parry: the blade held across him, the hook out to the side (held)
const parry: ClipDef = {
  name: 'kw_parry', dur: 0.2, fadeIn: 0.05, fadeOut: 0.16,
  keys: mergeKeys(
    [ch(0, WG_IDLE), ch(0.14, grip([-0.14, 0.1, 0.32], [0.85, 0.45, 0.25], [-0.6, -0.5, -0.6]), 'outExpo')],
    [
      body(0, R(), HIPS),
      body(0.14, R({ hips: [0, -14, 0], spine: [2, -6, 0], chest: [-2, -10, 0], head: [-4, 10, 0], 'thigh.L': [-20, 0, 6], 'shin.L': [26, 0, 0], 'thigh.R': [14, 0, -6], 'shin.R': [24, 0, 0], 'upperarm.L': [10, 0, 24] }), [0, -0.06, -0.02], 'outExpo'),
    ],
  ),
};

// Heavy Step: the right knee raised high, the left fist clenched at his side, then the stomp
const stomp: ClipDef = {
  name: 'kw_stomp', dur: 0.72, fadeIn: 0.06, fadeOut: 0.22,
  events: { stomp: 0.32 },
  keys: mergeKeys(
    [ch(0, WG_IDLE)],
    [
      body(0, R(), HIPS),
      body(0.24, R({ hips: [-4, 0, 0], spine: [-4, 0, 0], chest: [-2, 0, 0], head: [4, 0, 0], 'thigh.R': [-96, 0, -6], 'shin.R': [96, 0, 0], 'foot.R': [10, 0, 0], 'thigh.L': [-6, 0, 4], 'shin.L': [10, 0, 0], 'upperarm.L': [10, 0, 12], 'forearm.L': [-80, 0, 0], 'hand.L': [0, 0, 0] }), [0, 0.04, -0.02], 'inOut'),
      body(0.32, R({ hips: [10, 0, 0], spine: [12, 0, 0], chest: [8, 0, 0], head: [8, 0, 0], 'thigh.R': [-14, 0, -6], 'shin.R': [12, 0, 0], 'foot.R': [-4, 0, 0], 'thigh.L': [-20, 0, 4], 'shin.L': [40, 0, 0], 'upperarm.L': [10, 0, 16], 'forearm.L': [-70, 0, 0] }), [0, -0.12, 0.04], 'in'),
      body(0.46, R({ hips: [10, 0, 0], spine: [12, 0, 0], chest: [8, 0, 0], head: [8, 0, 0], 'thigh.R': [-14, 0, -6], 'shin.R': [12, 0, 0], 'thigh.L': [-20, 0, 4], 'shin.L': [40, 0, 0] }), [0, -0.12, 0.04]),
      body(0.72, R(), HIPS, 'inOut'),
    ],
  ),
};

// the meteor drop: the knees drawn up, the blade held back, then the legs driven down to land
const drop: ClipDef = {
  name: 'kw_drop', dur: 0.3, fadeIn: 0.05, fadeOut: 0.2,
  keys: mergeKeys(
    [ch(0, WG_IDLE), ch(0.2, grip([-0.3, 0.1, -0.1], [-0.3, 0.6, -0.7], [-0.6, -0.3, 0.6]), 'out')],
    [
      body(0, R(), HIPS),
      body(0.2, R({ hips: [-10, 0, 0], spine: [-6, 0, 0], chest: [-4, 0, 0], head: [10, 0, 0], 'thigh.R': [-20, 0, -6], 'shin.R': [20, 0, 0], 'foot.R': [20, 0, 0], 'thigh.L': [-60, 0, 6], 'shin.L': [80, 0, 0], 'upperarm.L': [-30, 0, 40], 'forearm.L': [-60, 0, 0] }), [0, 0.06, 0], 'out'),
      body(0.3, R({ hips: [-10, 0, 0], spine: [-6, 0, 0], chest: [-4, 0, 0], head: [10, 0, 0], 'thigh.R': [-20, 0, -6], 'shin.R': [20, 0, 0], 'foot.R': [20, 0, 0], 'thigh.L': [-60, 0, 6], 'shin.L': [80, 0, 0], 'upperarm.L': [-30, 0, 40], 'forearm.L': [-60, 0, 0] }), [0, 0.06, 0]),
    ],
  ),
};

// Debris Rain: the fan spin (the whirlwind lifts the rubble), the strikes up into the chunks, the blade levelled at them
const debrisKeys: [number, number, 'out' | 'inOut' | 'linear' | 'in'][] = [[0, 160, 'inOut'], [0.1, 200, 'in'], [0.22, 380, 'linear'], [0.34, 560, 'linear'], [0.38, 620, 'out']];
const debris: ClipDef = {
  name: 'kw_debris', dur: 1.2, fadeIn: 0.05, fadeOut: 0.22,
  events: { lift: 0.36, strike: 0.5, fall: 0.9 },
  keys: mergeKeys(
    swingKeys({ a: [0, 1, 0], b: [1, 0, 0], c: [-0.06, 0.1, 0.42], r: 0.05, pole: [-0.6, -0.5, -0.6], keys: debrisKeys }),
    swingKeys({ a: [0.5, -0.85, 0], b: [0, 0.2, 1], c: [-0.04, 0.12, 0.12], r: 0.36, pole: [-0.6, -0.5, -0.5], keys: [[0.44, 20, 'out'], [0.52, 175, 'out'], [0.6, 20, 'out'], [0.68, 175, 'out'], [0.76, 20, 'out'], [0.84, 175, 'out']] }),
    [ch(0.92, grip([-0.1, 0.1, 0.5], [0.0, 0.1, 1], [-0.7, -0.4, -0.4]), 'out'), ch(1.08, grip([-0.1, 0.1, 0.5], [0.0, 0.1, 1], [-0.7, -0.4, -0.4])), ch(1.2, WG_IDLE, 'inOut')],
    [
      body(0, R(), HIPS),
      body(0.38, R({ hips: [2, 8, 0], chest: [2, 8, 0], head: [-10, -6, 0], 'upperarm.L': [-60, 0, 10], 'forearm.L': [-20, 0, 0] }), [0, -0.04, 0.05], 'out'),
      body(0.5, R({ hips: [-6, 0, 0], spine: [-12, 0, 0], chest: [-14, 0, 0], head: [-24, 0, 0], 'thigh.L': [-20, 0, 6], 'shin.L': [20, 0, 0] }), [0, 0.04, 0], 'out'),
      body(0.86, R({ hips: [-6, 0, 0], spine: [-12, 0, 0], chest: [-14, 0, 0], head: [-24, 0, 0], 'thigh.L': [-20, 0, 6], 'shin.L': [20, 0, 0] }), [0, 0.04, 0]),
      body(0.94, R({ hips: [2, 10, 0], spine: [6, 8, 0], chest: [4, 10, 0], head: [-2, -10, 0], 'upperarm.L': [10, 0, 30] }), [0, -0.04, 0.06], 'out'),
      body(1.2, R(), HIPS, 'inOut'),
    ],
  ),
};

// the seal: the blade raised, the hook unfolding back into a sword (the Shikai's F)
const seal: ClipDef = { ...release, name: 'kw_seal', dur: 0.6, events: { fold: 0.3 }, keys: mergeKeys(release.keys.filter((k) => k.t <= 0.6).map((k) => (k.c && k.t === 0 ? { ...k, c: { ...k.c, ...WG_IDLE } } : k)), [ch(0.6, SG_IDLE, 'inOut')]) };

export const KIRA_CHAIN = ['kr_s1', 'kr_s2', 'kr_s3', 'kr_s4'];
export const WABISUKE_CHAIN = ['kw_s1', 'kw_s2', 'kw_s3', 'kw_s4'];

const KIDO = [palm, sajo, gaten, tozan, kaido];
export const KIRA_CLIPS: ClipDef[] = [...SHARED, s1, s2, s3, s4, ...KIDO, tenran, release];
export const WABISUKE_CLIPS: ClipDef[] = [...SHARED, w1, w2, w3, w4, ...KIDO, pull, guillotine, penance, parry, stomp, drop, debris, seal, release];
