// Aaroniero Arruruerie's animation set (docs/kits/aaroniero.md). True form: upright and formal, the gloved left hand
// held before the waist; the maw-hand string (a bite thrust from the left, a chop of the right, a lash, the maw slammed
// down), the devouring grab, the tentacle volley from the back, the back tentacles armed, the hand passed over the face
// for the aspect, the glove torn off for the release. Kaien: the fencer's string, Shakkahō, the sword held upside down
// and twirled ("Suiten sakamake, Nejibana"). Nejibana: the spear dance pivoting round one wrist — the thrust, the spin,
// the rising sweep, the crushing overhead; the pinning thrust; the spear driven into the ground; the long spiral thrust.
// Glotonería: the upper body on the mass directing the tentacles, the impale, the horde called out of the pool.
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
const two = (t: number, w: number, ease?: KeyDef['ease']): KeyDef => ({ t, ease, c: { '@twoHand': [w, 0, 0] } });
const NO_IK = (t: number): KeyDef => ({ t, c: { '@ikR': [0, 0, 0] } });

const SHARED = ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name));

// ================================================================== the true form

const T_IDLE: B = {
  hips: [0, 0, 0], spine: [-3, 0, 0], chest: [-4, 0, 0], neck: [-2, 0, 0], head: [-2, 0, 0],
  'thigh.L': [-2, 0, 3], 'shin.L': [3, 0, 0], 'thigh.R': [-2, 0, -3], 'shin.R': [3, 0, 0],
  'upperarm.L': [4, 0, 10], 'forearm.L': [-74, 0, 0], 'hand.L': [0, 20, 0],
  'upperarm.R': [-4, 0, -6], 'forearm.R': [-12, 0, 0],
};
const T = (over: B = {}): B => ({ ...T_IDLE, ...over });

export const AARONIERO_STANCE: StanceDef = {
  idle: T_IDLE,
  run: { 'upperarm.L': [-20, 0, 10], 'forearm.L': [-60, 0, 0], chest: [4, 0, 0] },
  sprint: { spine: [16, 0, 0], 'upperarm.L': [20, 0, 14], 'upperarm.R': [20, 0, -14] },
  swingL: 0.2,
  swingR: 0.6,
};

/** a blow of the maw hand (left) or the right hand: wound back, struck out */
function blow(name: string, dur: number, at: number, wind: B, hit: B, hipsHit: C3 = [0, -0.04, 0.1]): ClipDef {
  return {
    name, dur, fadeIn: 0.05, fadeOut: 0.18,
    events: { step: at * 0.5, hit: at, combo: at + 0.1 },
    keys: [
      body(0, T(), [0, 0, 0]),
      body(at * 0.6, T(wind), [0, 0, 0], 'inOut'),
      body(at, T(hit), hipsHit, 'outExpo'),
      body(at + 0.12, T(hit), hipsHit),
      body(dur, T(), [0, 0, 0], 'inOut'),
    ],
  };
}
const t1 = blow('ar_s1', 0.48, 0.2,
  { hips: [0, 20, 0], chest: [0, 18, 0], 'upperarm.L': [-40, 0, 30], 'forearm.L': [-100, 0, 0] },
  { hips: [4, -16, 0], spine: [8, -6, 0], chest: [4, -14, 0], 'upperarm.L': [-86, 0, 4], 'forearm.L': [-6, 0, 0], 'hand.L': [0, 0, 0], 'thigh.R': [-24, 0, -4], 'shin.R': [22, 0, 0] });
const t2 = blow('ar_s2', 0.46, 0.19,
  { hips: [0, -18, 0], chest: [-6, -16, 0], 'upperarm.R': [-150, 0, -20], 'forearm.R': [-40, 0, 0] },
  { hips: [4, 14, 0], spine: [10, 6, 0], chest: [8, 12, 0], 'upperarm.R': [-60, 0, 10], 'forearm.R': [-10, 0, 0], 'thigh.L': [-22, 0, 4], 'shin.L': [20, 0, 0] });
const t3 = blow('ar_s3', 0.5, 0.21,
  { hips: [0, 26, 0], chest: [0, 24, 0], 'upperarm.L': [-60, 0, -40], 'forearm.L': [-90, 0, 0] },
  { hips: [2, -24, 0], spine: [6, -10, 0], chest: [2, -20, 0], 'upperarm.L': [-80, 0, 70], 'forearm.L': [-6, 0, 0] });
const t4 = blow('ar_s4', 0.64, 0.3,
  { spine: [-14, 0, 0], chest: [-14, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-170, 0, 6], 'forearm.L': [-20, 0, 0], 'upperarm.R': [-60, 0, -30] },
  { spine: [24, 0, 0], chest: [14, 0, 0], head: [4, 0, 0], 'upperarm.L': [-70, 0, 6], 'forearm.L': [-6, 0, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [34, 0, 0], 'thigh.R': [16, 0, -6], 'shin.R': [16, 0, 0] },
  [0, -0.14, 0.12]);
/** the devouring grab: the maw thrust out, then hauled back to the chest */
const devour: ClipDef = {
  name: 'ar_devour', dur: 1.3, fadeIn: 0.05, fadeOut: 0.22,
  events: { grab: 0.2, chew: 0.5 },
  keys: [
    body(0, T(), [0, 0, 0]),
    body(0.2, T({ hips: [6, -14, 0], spine: [10, -6, 0], chest: [6, -12, 0], 'upperarm.L': [-90, 0, 2], 'forearm.L': [-2, 0, 0], 'thigh.R': [-30, 0, -4], 'shin.R': [28, 0, 0] }), [0, -0.06, 0.2], 'outExpo'),
    body(0.5, T({ hips: [0, 6, 0], chest: [-4, 6, 0], 'upperarm.L': [-60, 0, 10], 'forearm.L': [-110, 0, 0] }), [0, -0.02, 0], 'inOut'),
    body(1.0, T({ chest: [-6, 4, 0], 'upperarm.L': [-50, 0, 12], 'forearm.L': [-120, 0, 0] }), [0, -0.02, 0]),
    body(1.3, T(), [0, 0, 0], 'inOut'),
  ],
};
/** Spirit Body Fusion: the arms flung wide, the back arched, the tentacles shooting out over his shoulders */
const fusion: ClipDef = {
  name: 'ar_fusion', dur: 0.8, fadeIn: 0.05, fadeOut: 0.2,
  events: { shoot: 0.22 },
  keys: [
    body(0, T(), [0, 0, 0]),
    body(0.12, T({ spine: [16, 0, 0], chest: [14, 0, 0], 'upperarm.L': [-20, 0, 30], 'upperarm.R': [-20, 0, -30] }), [0, -0.05, 0], 'out'),
    body(0.24, T({ spine: [-10, 0, 0], chest: [-16, 0, 0], head: [-6, 0, 0], 'upperarm.L': [-50, 0, 80], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-50, 0, -80], 'forearm.R': [-10, 0, 0] }), [0, 0, -0.04], 'outExpo'),
    body(0.8, T(), [0, 0, 0], 'inOut'),
  ],
};
/** Zanpakutō Destruction armed: hunched, the arms crossed, the back offered */
const arm: ClipDef = {
  name: 'ar_arm', dur: 0.7, fadeIn: 0.06, fadeOut: 0.22,
  events: { arm: 0.3 },
  keys: [
    body(0, T(), [0, 0, 0]),
    body(0.3, T({ spine: [18, 0, 0], chest: [12, 0, 0], head: [6, 0, 0], 'upperarm.L': [-70, 0, -24], 'forearm.L': [-110, 0, 0], 'upperarm.R': [-70, 0, 24], 'forearm.R': [-110, 0, 0] }), [0, -0.08, 0], 'inOut'),
    body(0.7, T(), [0, 0, 0], 'inOut'),
  ],
};
/** the aspect: the right hand drawn down over the face */
const aspect: ClipDef = {
  name: 'ar_aspect', dur: 0.9, fadeIn: 0.06, fadeOut: 0.22,
  events: { swap: 0.45 },
  keys: [
    body(0, T(), [0, 0, 0]),
    body(0.3, T({ 'upperarm.R': [-150, 0, 16], 'forearm.R': [-70, 0, 0], 'hand.R': [0, 0, 0], head: [-6, 0, 0] }), [0, 0, 0], 'inOut'),
    body(0.6, T({ 'upperarm.R': [-90, 0, 20], 'forearm.R': [-90, 0, 0], head: [6, 0, 0] }), [0, 0, 0], 'inOut'),
    body(0.9, T(), [0, 0, 0], 'inOut'),
  ],
};
/** "Kuitsukuse, Glotonería": the gloved hand raised, the glove torn away, the body lost in the mass */
const release: ClipDef = {
  name: 'ar_release', dur: 1.6, fadeIn: 0.06, fadeOut: 0.22,
  events: { name: 0.3, tear: 0.6, erupt: 1.0 },
  keys: [
    body(0, T(), [0, 0, 0]),
    body(0.5, T({ 'upperarm.L': [-160, 0, 10], 'forearm.L': [-20, 0, 0], 'hand.L': [-40, 0, 0], head: [-14, 0, 0], chest: [-8, 0, 0] }), [0, 0, 0], 'inOut'),
    body(0.7, T({ 'upperarm.L': [-170, 0, 20], 'forearm.L': [-10, 0, 0], 'hand.L': [-60, 0, 20], head: [-20, 0, 0], chest: [-12, 0, 0], 'upperarm.R': [-40, 0, -60] }), [0, 0, 0], 'outExpo'),
    body(1.6, T({ 'upperarm.L': [-140, 0, 40], 'forearm.L': [-20, 0, 0], 'upperarm.R': [-140, 0, -40], 'forearm.R': [-20, 0, 0], head: [-20, 0, 0], chest: [-12, 0, 0] }), [0, 0, 0], 'inOut'),
  ],
};

export const AARONIERO_CHAIN = ['ar_s1', 'ar_s2', 'ar_s3', 'ar_s4'];
export const AARONIERO_CLIPS: ClipDef[] = [...SHARED, t1, t2, t3, t4, devour, fusion, arm, aspect, release];

// ================================================================== Kaien (sealed Nejibana)

const K_IDLE: B = {
  hips: [0, -14, 0], spine: [2, 6, 0], chest: [2, 8, 0], neck: [0, 0, 0], head: [-2, -4, 0],
  'thigh.L': [-14, 0, 6], 'shin.L': [18, 0, 0], 'foot.L': [-4, 0, 0], 'thigh.R': [6, 0, -6], 'shin.R': [14, 0, 0], 'foot.R': [-6, 0, 0],
  'upperarm.L': [-14, 0, 12], 'forearm.L': [-30, 0, 0],
};
const KR = (over: B = {}): B => ({ ...K_IDLE, ...over });
const KGp = { p: [-0.26, -0.18, 0.2] as C3, dir: [0.1, 0.2, 0.97] as C3, pole: [-0.8, -0.4, -0.4] as C3 };
const KG = grip(KGp.p, KGp.dir, KGp.pole);

export const KAIEN_STANCE: StanceDef = {
  idle: K_IDLE,
  idleHips: -0.03,
  run: { chest: [6, 0, 0], 'upperarm.L': [-20, 0, 14], 'forearm.L': [-60, 0, 0] },
  sprint: { spine: [20, 0, 0], 'upperarm.L': [30, 0, 20] },
  swingL: 0.6,
  swingR: 0.2,
  grip: {
    idle: { p: KGp.p, dir: KGp.dir, edge: [0, -0.97, 0.2], pole: KGp.pole },
    walk: { p: KGp.p, dir: KGp.dir, edge: [0, -0.97, 0.2], pole: KGp.pole },
    run: { p: [-0.3, -0.22, -0.08], dir: [-0.2, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.28, -0.12, -0.18], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.32, -0.08, 0.08], dir: [-0.5, -0.3, 0.8], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

function kcut(name: string, a: C3, keys: [number, number, 'out' | 'inOut'][], twist: number): ClipDef {
  const end = keys[keys.length - 1][0];
  return {
    name, dur: end, fadeIn: 0.05, fadeOut: 0.16,
    events: { step: 0.06, combo: keys[keys.length - 2][0] + 0.06 },
    keys: mergeKeys(
      swingKeys({ a, b: [0, 0, 1], c: [-0.08, 0.06, 0.1], r: 0.42, pole: [-0.8, -0.4, -0.4], keys }),
      [ch(end, KG, 'inOut')],
      [two(0, 0), two(keys[1][0], 0.8, 'out'), two(keys[2][0] + 0.1, 0.8), two(end, 0, 'inOut')],
      [
        body(0, KR()),
        body(keys[1][0], KR({ hips: [0, -twist, 0], spine: [2, -twist * 0.4, 0], chest: [0, -twist * 0.6, 0] }), undefined, 'out'),
        body(keys[2][0], KR({ hips: [4, twist, 0], spine: [8, twist * 0.5, 0], chest: [6, twist * 0.7, 0], 'thigh.L': [-28, 0, 6], 'shin.L': [26, 0, 0], 'thigh.R': [14, 0, -8], 'shin.R': [16, 0, 0] }), [0, -0.06, 0.08], 'out'),
        body(end, KR(), undefined, 'inOut'),
      ],
    ),
  };
}
const kn1 = kcut('kn_s1', [-0.7, 0.7, 0], [[0, 30, 'out'], [0.1, -10, 'out'], [0.21, 160, 'out'], [0.46, 140, 'inOut']], 22);
const kn2 = kcut('kn_s2', [0.7, 0.7, 0], [[0, 30, 'out'], [0.1, -10, 'out'], [0.21, 160, 'out'], [0.46, 140, 'inOut']], -22);
const kn3 = kcut('kn_s3', [0, 1, 0], [[0, 30, 'out'], [0.1, 0, 'out'], [0.22, 170, 'out'], [0.48, 150, 'inOut']], -26);
const kn4 = kcut('kn_s4', [0, 0.1, -1], [[0, 40, 'out'], [0.16, -30, 'out'], [0.3, 150, 'out'], [0.6, 140, 'inOut']], 6);
kn4.events = { step: 0.1 };
/** Shakkahō: the left palm thrust out, two fingers together */
const shakkaho: ClipDef = {
  name: 'kn_shakkaho', dur: 0.6, fadeIn: 0.05, fadeOut: 0.18,
  events: { fire: 0.24 },
  keys: mergeKeys([ch(0, KG)], [
    body(0, KR()),
    body(0.14, KR({ 'upperarm.L': [-60, 0, 20], 'forearm.L': [-80, 0, 0], chest: [0, 14, 0] }), undefined, 'out'),
    body(0.24, KR({ 'upperarm.L': [-88, 0, 4], 'forearm.L': [-4, 0, 0], 'hand.L': [0, 0, 0], chest: [4, -10, 0], hips: [0, -20, 0] }), [0, -0.03, 0.06], 'outExpo'),
    body(0.6, KR(), undefined, 'inOut'),
  ]),
};
/** "Suiten sakamake, Nejibana": the sword held upside down before him and twirled, then raised */
const kRelease: ClipDef = {
  name: 'kn_release', dur: 1.3, fadeIn: 0.06, fadeOut: 0.22,
  events: { name: 0.2, twirl: 0.45, done: 1.0 },
  keys: mergeKeys(
    [
      ch(0, KG),
      ch(0.25, grip([-0.08, 0.06, 0.34], [0, -1, 0.05], [-0.8, -0.3, -0.4], [0, 0, 1]), 'inOut'),
      ch(0.45, grip([-0.08, 0.06, 0.34], [0.5, -0.86, 0.05], [-0.8, -0.3, -0.4], [0, 0, 1]), 'inOut'),
      ch(0.6, grip([-0.08, 0.06, 0.34], [-0.5, -0.86, 0.05], [-0.8, -0.3, -0.4], [0, 0, 1]), 'inOut'),
      ch(0.75, grip([-0.08, 0.06, 0.34], [0.5, -0.86, 0.05], [-0.8, -0.3, -0.4], [0, 0, 1]), 'inOut'),
      ch(1.0, grip([-0.2, 0.3, 0.2], [0, 0.9, 0.4], [-0.8, -0.3, -0.4]), 'outExpo'),
    ],
    [
      body(0, KR()),
      body(0.25, KR({ hips: [0, 0, 0], chest: [-4, 0, 0], head: [6, 0, 0] }), undefined, 'inOut'),
      body(1.0, KR({ chest: [-10, 0, 0], head: [-10, 0, 0] }), undefined, 'outExpo'),
      body(1.3, KR(), undefined, 'inOut'),
    ],
  ),
};

export const KAIEN_CHAIN = ['kn_s1', 'kn_s2', 'kn_s3', 'kn_s4'];
export const KAIEN_CLIPS: ClipDef[] = [...SHARED, kn1, kn2, kn3, kn4, shakkaho, kRelease, aspect];

// ================================================================== Nejibana

const N_IDLE: B = {
  hips: [2, -20, 0], spine: [4, 8, 0], chest: [2, 10, 0], neck: [0, 0, 0], head: [-4, -6, 0],
  'thigh.L': [-16, 0, 6], 'shin.L': [22, 0, 0], 'foot.L': [-6, 0, 0], 'thigh.R': [10, 0, -8], 'shin.R': [20, 0, 0], 'foot.R': [-10, 0, 0],
  'upperarm.L': [-20, 0, 18], 'forearm.L': [-40, 0, 0], 'hand.L': [0, 0, 6],
};
const NR = (over: B = {}): B => ({ ...N_IDLE, ...over });
const NGp = { p: [-0.3, -0.22, 0.14] as C3, dir: [-0.06, 0.45, 0.89] as C3, edge: [0, 0.89, -0.45] as C3, pole: [-0.6, -0.3, -0.75] as C3 };
const NG = grip(NGp.p, NGp.dir, NGp.pole);

/** The trident in his right hand, the head up and forward, the drill butt low behind. */
export const NEJIBANA_STANCE: StanceDef = {
  idle: N_IDLE,
  idleHips: -0.04,
  run: { 'upperarm.L': [-20, 0, 14], 'forearm.L': [-40, 0, 0] },
  sprint: { 'upperarm.L': [14, 0, 14], 'forearm.L': [-40, 0, 0] },
  swingL: 0.6,
  swingR: 0.15,
  grip: {
    idle: NGp,
    walk: NGp,
    run: { p: [-0.3, -0.2, 0.0], dir: [-0.05, 0.2, 0.98], edge: [0, 0.98, -0.2], pole: [-0.7, -0.3, -0.6] },
    sprint: { p: [-0.3, -0.12, -0.1], dir: [-0.05, 0.1, 0.99], edge: [0, -0.99, 0.1], pole: [-0.7, -0.3, -0.6] },
    air: { p: [-0.34, -0.1, 0.1], dir: [-0.2, -0.3, 0.93], edge: [0, -0.95, -0.3], pole: [-0.6, -0.4, -0.6] },
  },
};

const SP_BACK = grip([-0.22, -0.16, -0.3], [0.02, -0.08, 0.99], [-0.7, -0.5, -0.3]);
const SP_OUT = grip([-0.12, -0.1, 0.6], [0, -0.12, 0.99], [-0.6, -0.6, 0]);
const LUNGE: B = { hips: [8, 10, 0], spine: [12, 8, 0], chest: [8, 10, 0], head: [-10, -14, 0], 'thigh.L': [-48, 0, 6], 'shin.L': [50, 0, 0], 'thigh.R': [28, 0, -8], 'shin.R': [30, 0, 0] };

/** the thrust */
const n1: ClipDef = {
  name: 'nj_s1', dur: 0.5, fadeIn: 0.04, fadeOut: 0.18,
  events: { step: 0.08, hit: 0.2, combo: 0.3 },
  keys: mergeKeys(
    [ch(0, NG), ch(0.1, SP_BACK, 'inOut'), ch(0.2, SP_OUT, 'outExpo'), ch(0.32, SP_OUT), ch(0.5, NG, 'inOut')],
    [two(0, 0), two(0.08, 1, 'out'), two(0.36, 1), two(0.5, 0, 'inOut')],
    [body(0, N_IDLE), body(0.1, NR({ hips: [0, -30, 0], spine: [-4, -10, 0], chest: [-4, -14, 0] }), [0, -0.02, -0.06], 'inOut'), body(0.2, NR(LUNGE), [0, -0.12, 0.18], 'outExpo'), body(0.32, NR(LUNGE), [0, -0.11, 0.16], 'out'), body(0.5, N_IDLE, undefined, 'inOut')],
  ),
};
/** the spin: the trident pivoting round the wrist in a full flat circle as he turns */
const n2: ClipDef = {
  name: 'nj_s2', dur: 0.7, fadeIn: 0.04, fadeOut: 0.2,
  events: { step: 0.06, hit: 0.3, combo: 0.46 },
  keys: mergeKeys(
    [{ t: 0, c: { '@spin': [0, 0, 0] } }, { t: 0.06, ease: 'out', c: { '@spin': [-20, 0, 0] } }, { t: 0.42, ease: 'inOut', c: { '@spin': [360, 0, 0] } }, { t: 0.43, ease: 'hold', c: { '@spin': [0, 0, 0] } }],
    swingKeys({ a: [-1, -0.1, 0], b: [0, -0.15, 1], c: [-0.06, -0.02, 0.12], r: 0.3, pole: [-0.7, -0.4, -0.5], keys: [[0, 40, 'out'], [0.1, -20, 'out'], [0.3, 175, 'outExpo'], [0.7, 150, 'inOut']] }),
    [two(0, 0), two(0.5, 0), two(0.7, 0, 'inOut')],
    [body(0, N_IDLE), body(0.2, NR({ hips: [4, 0, -8], spine: [6, 0, -6], 'upperarm.L': [-30, 0, 60] }), [0, -0.03, 0], 'inOut'), body(0.42, NR({ hips: [6, 20, 0], chest: [8, 16, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [26, 0, 0] }), [0, -0.06, 0.06], 'out'), body(0.7, N_IDLE, undefined, 'inOut')],
  ),
};
/** the rising sweep: from low on his right up across */
const n3: ClipDef = {
  name: 'nj_s3', dur: 0.56, fadeIn: 0.04, fadeOut: 0.2,
  events: { step: 0.06, hit: 0.22, combo: 0.34 },
  keys: mergeKeys(
    swingKeys({ a: [-0.3, -0.9, 0.2], b: [0, 0, 1], c: [-0.06, 0.04, 0.12], r: 0.32, pole: [-0.7, -0.4, -0.5], keys: [[0, 30, 'out'], [0.1, -10, 'out'], [0.24, 170, 'outExpo'], [0.56, 150, 'inOut']] }),
    [two(0, 0), two(0.08, 1, 'out'), two(0.4, 1), two(0.56, 0, 'inOut')],
    [body(0, N_IDLE), body(0.1, NR({ hips: [0, -30, 0], spine: [2, -12, 0], chest: [0, -16, 0] }), [0, -0.04, 0], 'out'), body(0.24, NR({ hips: [-4, 24, 0], spine: [-8, 12, 0], chest: [-10, 18, 0], head: [-10, -16, 0] }), [0, -0.02, 0.06], 'outExpo'), body(0.56, N_IDLE, undefined, 'inOut')],
  ),
};
/** the crushing overhead: raised in both hands and brought down — a wave rises where it lands */
const n4: ClipDef = {
  name: 'nj_s4', dur: 0.86, fadeIn: 0.06, fadeOut: 0.24,
  events: { step: 0.3, hit: 0.42 },
  keys: mergeKeys(
    swingKeys({ a: [0, 1, 0], b: [0, 0, 1], c: [-0.06, 0.12, 0.1], r: 0.34, tilt: 0.05, pole: [-0.6, -0.2, -0.75], keys: [[0, 140, 'out'], [0.3, -30, 'inOut'], [0.42, 130, 'outExpo'], [0.62, 135, 'out'], [0.86, 150, 'inOut']] }),
    [two(0, 0), two(0.2, 1, 'inOut'), two(0.66, 1), two(0.86, 0, 'inOut')],
    [
      body(0, N_IDLE),
      body(0.3, NR({ hips: [-6, -6, 0], spine: [-16, 0, 0], chest: [-14, 0, 0], head: [-10, 0, 0], 'thigh.L': [-10, 0, 6], 'shin.L': [14, 0, 0] }), [0, 0.03, -0.05], 'inOut'),
      body(0.42, NR({ hips: [16, 0, 0], spine: [26, 0, 0], chest: [18, 0, 0], head: [-16, 0, 0], 'thigh.L': [-56, 0, 6], 'shin.L': [62, 0, 0], 'thigh.R': [32, 0, -8], 'shin.R': [42, 0, 0] }), [0, -0.22, 0.18], 'outExpo'),
      body(0.62, NR({ hips: [14, 0, 0], spine: [24, 0, 0], chest: [16, 0, 0], head: [-14, 0, 0], 'thigh.L': [-54, 0, 6], 'shin.L': [60, 0, 0], 'thigh.R': [30, 0, -8], 'shin.R': [40, 0, 0] }), [0, -0.21, 0.17], 'out'),
      body(0.86, N_IDLE, undefined, 'inOut'),
    ],
  ),
};
/** the crushing tide: a thrust held, pinning, while the wave rises behind the target */
const tide: ClipDef = {
  name: 'nj_tide', dur: 1.1, fadeIn: 0.04, fadeOut: 0.22,
  events: { hit: 0.22, wave: 0.4 },
  keys: mergeKeys(
    [ch(0, NG), ch(0.12, SP_BACK, 'inOut'), ch(0.22, SP_OUT, 'outExpo'), ch(0.85, SP_OUT), ch(1.1, NG, 'inOut')],
    [two(0, 0), two(0.1, 1, 'out'), two(0.9, 1), two(1.1, 0, 'inOut')],
    [body(0, N_IDLE), body(0.12, NR({ hips: [0, -30, 0], chest: [-4, -14, 0] }), [0, -0.02, -0.06], 'inOut'), body(0.22, NR(LUNGE), [0, -0.12, 0.18], 'outExpo'), body(0.85, NR(LUNGE), [0, -0.12, 0.18]), body(1.1, N_IDLE, undefined, 'inOut')],
  ),
};
/** the rising wave: the spear twirled and driven into the ground ahead — the floor torn up */
const wave: ClipDef = {
  name: 'nj_wave', dur: 0.9, fadeIn: 0.05, fadeOut: 0.22,
  events: { drive: 0.36 },
  keys: mergeKeys(
    [ch(0, NG), ch(0.2, grip([-0.2, 0.24, 0.2], [0, 0.7, 0.7], [-0.6, -0.3, -0.75]), 'inOut'), ch(0.36, grip([-0.1, -0.36, 0.5], [0, -0.85, 0.5], [-0.6, -0.3, -0.75]), 'outExpo'), ch(0.62, grip([-0.1, -0.36, 0.5], [0, -0.85, 0.5], [-0.6, -0.3, -0.75])), ch(0.9, NG, 'inOut')],
    [two(0, 0), two(0.18, 1, 'out'), two(0.66, 1), two(0.9, 0, 'inOut')],
    [body(0, N_IDLE), body(0.2, NR({ spine: [-8, 0, 0], chest: [-10, 0, 0] }), [0, 0.02, 0], 'inOut'), body(0.36, NR({ hips: [10, 0, 0], spine: [24, 0, 0], chest: [14, 0, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [44, 0, 0] }), [0, -0.16, 0.1], 'outExpo'), body(0.9, N_IDLE, undefined, 'inOut')],
  ),
};
/** the spiral thrust: a long lunge, the trident driven out level */
const spiral: ClipDef = {
  name: 'nj_spiral', dur: 0.9, fadeIn: 0.05, fadeOut: 0.22,
  events: { step: 0.12, fire: 0.3 },
  keys: mergeKeys(
    [ch(0, NG), ch(0.16, SP_BACK, 'inOut'), ch(0.3, grip([-0.1, -0.06, 0.66], [0, -0.04, 1], [-0.6, -0.6, 0]), 'outExpo'), ch(0.62, grip([-0.1, -0.06, 0.66], [0, -0.04, 1], [-0.6, -0.6, 0])), ch(0.9, NG, 'inOut')],
    [two(0, 0), two(0.14, 1, 'out'), two(0.66, 1), two(0.9, 0, 'inOut')],
    [body(0, N_IDLE), body(0.16, NR({ hips: [0, -34, 0], chest: [-6, -16, 0] }), [0, -0.04, -0.1], 'inOut'), body(0.3, NR({ ...LUNGE, 'thigh.L': [-56, 0, 6], 'shin.L': [56, 0, 0], 'thigh.R': [34, 0, -8] }), [0, -0.16, 0.26], 'outExpo'), body(0.62, NR(LUNGE), [0, -0.14, 0.22]), body(0.9, N_IDLE, undefined, 'inOut')],
  ),
};

export const NEJIBANA_CHAIN = ['nj_s1', 'nj_s2', 'nj_s3', 'nj_s4'];
export const NEJIBANA_CLIPS: ClipDef[] = [...SHARED, n1, n2, n3, n4, tide, wave, spiral, aspect, release];

// ================================================================== Glotonería

const G_IDLE: B = {
  hips: [0, 0, 0], spine: [-4, 0, 0], chest: [-4, 0, 0], neck: [0, 0, 0], head: [-4, 0, 0],
  'upperarm.L': [-20, 0, 30], 'forearm.L': [-50, 0, 0], 'upperarm.R': [-20, 0, -30], 'forearm.R': [-50, 0, 0],
};
const GR = (over: B = {}): B => ({ ...G_IDLE, ...over });

export const GLOT_STANCE: StanceDef = {
  idle: G_IDLE,
  idleHips: 0,
  run: { chest: [4, 0, 0] },
  sprint: { chest: [10, 0, 0] },
  swingL: 0.1,
  swingR: 0.1,
  freqScale: 0.4,
  speedScale: 3,
};

/** an arm swung down to direct a tentacle slam (side 'L', 'R' or both) */
function direct(name: string, side: 'L' | 'R' | 'both', dur: number, at: number): ClipDef {
  const up: B = {}, down: B = {};
  for (const s of side === 'both' ? ['L', 'R'] : [side]) {
    const k = s === 'L' ? 1 : -1;
    up[`upperarm.${s}`] = [-160, 0, k * 20];
    up[`forearm.${s}`] = [-20, 0, 0];
    down[`upperarm.${s}`] = [-50, 0, k * 30];
    down[`forearm.${s}`] = [-10, 0, 0];
  }
  return {
    name, dur, fadeIn: 0.06, fadeOut: 0.22,
    events: { hit: at, combo: at + 0.2 },
    keys: [
      body(0, GR()),
      body(at * 0.6, GR({ ...up, chest: [-10, 0, 0], head: [-10, 0, 0] }), undefined, 'inOut'),
      body(at, GR({ ...down, chest: [12, 0, 0], spine: [8, 0, 0] }), undefined, 'outExpo'),
      body(dur, GR(), undefined, 'inOut'),
    ],
  };
}
const g1 = direct('gl_s1', 'R', 0.9, 0.45);
const g2 = direct('gl_s2', 'L', 0.9, 0.45);
const g3 = direct('gl_s3', 'both', 1.0, 0.5);
/** the sweep: both arms swung round flat */
const g4: ClipDef = {
  name: 'gl_s4', dur: 1.1, fadeIn: 0.06, fadeOut: 0.24,
  events: { hit: 0.45 },
  keys: [
    body(0, GR()),
    body(0.3, GR({ chest: [0, -30, 0], 'upperarm.L': [-90, 0, -20], 'upperarm.R': [-90, 0, 60] }), undefined, 'inOut'),
    body(0.55, GR({ chest: [0, 30, 0], 'upperarm.L': [-90, 0, 60], 'upperarm.R': [-90, 0, -20] }), undefined, 'outExpo'),
    body(1.1, GR(), undefined, 'inOut'),
  ],
};
/** the impale: Nejibana driven out from the upper body */
const impale: ClipDef = {
  name: 'gl_impale', dur: 1.0, fadeIn: 0.05, fadeOut: 0.22,
  events: { hit: 0.3 },
  keys: mergeKeys(
    [ch(0, grip([-0.3, -0.1, 0.1], [0, 0.3, 0.95], [-0.6, -0.3, -0.75])), ch(0.16, SP_BACK, 'inOut'), ch(0.3, grip([-0.1, -0.06, 0.7], [0, -0.1, 1], [-0.6, -0.6, 0]), 'outExpo'), ch(0.7, grip([-0.1, -0.06, 0.7], [0, -0.1, 1], [-0.6, -0.6, 0])), { t: 1.0, c: { '@ikR': [0, 0, 0] } }],
    [two(0, 0), two(0.14, 1, 'out'), two(0.72, 1), two(1.0, 0, 'inOut')],
    [body(0, GR()), body(0.16, GR({ chest: [-6, -16, 0] }), undefined, 'inOut'), body(0.3, GR({ chest: [14, 8, 0], spine: [10, 4, 0] }), undefined, 'outExpo'), body(1.0, GR(), undefined, 'inOut')],
  ),
};
/** the capsule-head Cero (in the light): the head thrust forward */
const gCero: ClipDef = {
  name: 'gl_cero', dur: 1.2, fadeIn: 0.06, fadeOut: 0.22,
  events: { charge: 0.05, fire: 0.5 },
  keys: [body(0, GR()), body(0.45, GR({ spine: [10, 0, 0], chest: [8, 0, 0], neck: [10, 0, 0], head: [-6, 0, 0] }), undefined, 'inOut'), body(1.2, GR(), undefined, 'inOut')],
};
/** the horde / the army: both arms raised over the boiling pool */
const horde: ClipDef = {
  name: 'gl_horde', dur: 1.2, fadeIn: 0.06, fadeOut: 0.22,
  events: { call: 0.4 },
  keys: [
    body(0, GR()),
    body(0.4, GR({ 'upperarm.L': [-150, 0, 40], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-150, 0, -40], 'forearm.R': [-10, 0, 0], head: [-16, 0, 0], chest: [-10, 0, 0] }), undefined, 'outExpo'),
    body(1.2, GR(), undefined, 'inOut'),
  ],
};
/** the swallow: an arm thrown out, a tentacle following it, hauled back */
const swallow: ClipDef = {
  name: 'gl_swallow', dur: 1.4, fadeIn: 0.05, fadeOut: 0.22,
  events: { grab: 0.3, gulp: 0.9 },
  keys: [
    body(0, GR()),
    body(0.3, GR({ 'upperarm.L': [-90, 0, 4], 'forearm.L': [-4, 0, 0], chest: [8, -12, 0] }), undefined, 'outExpo'),
    body(0.9, GR({ 'upperarm.L': [-40, 0, 30], 'forearm.L': [-100, 0, 0], chest: [-6, 8, 0] }), undefined, 'inOut'),
    body(1.4, GR(), undefined, 'inOut'),
  ],
};
/** the guard: the tentacles (the kit's) curled over the head, the arms raised over the capsule (held) */
const guard: ClipDef = {
  name: 'gl_guard', dur: 0.4, fadeIn: 0.06, fadeOut: 0.25,
  keys: [body(0, GR()), body(0.4, GR({ 'upperarm.L': [-160, 0, -20], 'forearm.L': [-80, 0, 0], 'upperarm.R': [-160, 0, 20], 'forearm.R': [-80, 0, 0], spine: [14, 0, 0], head: [16, 0, 0] }), undefined, 'inOut')],
};
/** the reveal after the release */
const roar: ClipDef = {
  name: 'gl_roar', dur: 1.4, fadeIn: 0.05, fadeOut: 0.3,
  events: { roar: 0.3 },
  keys: [
    body(0, GR({ spine: [14, 0, 0], chest: [10, 0, 0] })),
    body(0.4, GR({ spine: [-10, 0, 0], chest: [-14, 0, 0], head: [-20, 0, 0], 'upperarm.L': [-60, 0, 80], 'upperarm.R': [-60, 0, -80] }), undefined, 'outExpo'),
    body(1.4, GR(), undefined, 'inOut'),
  ],
};

export const GLOT_CHAIN = ['gl_s1', 'gl_s2', 'gl_s3', 'gl_s4'];
export const GLOT_CLIPS: ClipDef[] = [...SHARED, g1, g2, g3, g4, impale, gCero, horde, swallow, guard, roar, NO_IK_CLIP()];

/** a do-nothing clip that releases the weapon IK (the spear handed back to the hand by the kit) */
function NO_IK_CLIP(): ClipDef {
  return { name: 'gl_rest', dur: 0.2, fadeIn: 0.05, fadeOut: 0.1, keys: [NO_IK(0), { ...body(0.2, GR()), c: { '@ikR': [0, 0, 0] } }] };
}
