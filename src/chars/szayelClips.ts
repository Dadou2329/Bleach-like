// Szayelaporro Granz's animation set (docs/kits/szayelaporro.md). Theatrical and economical: the hip cocked, the
// left hand set on it, the sword held out in the right like a fencer's. Sealed: the flèche thrust, the back-of-wrist
// flick, the rising cut, the turning slash; the needle thrust (Rokureichū); a snap of the fingers (the Fracción);
// the remote held up (the trap, the device); a Fracción eaten; "Susure, Fornicarás" — the blade lowered point first
// into his mouth. Fornicarás: the hands direct the wing-branches (lashes, the burrow), the arms flung wide for the
// black fountain, the snap, the doll worked between the fingers, the wings closed round him.
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

/** the left hand set on the hip */
const ON_HIP: B = { 'upperarm.L': [60, -10, 32], 'forearm.L': [-115, 0, 0], 'hand.L': [0, 0, -6] };
const IDLE: B = {
  // the hip cocked, the weight on the right leg, the chin up
  hips: [0, -12, 3], spine: [-2, 5, -2], chest: [-2, 7, -2], neck: [-2, 0, 0], head: [-6, -8, 3],
  'thigh.L': [-8, 0, 5], 'shin.L': [12, 0, 0], 'foot.L': [-4, 0, 0], 'thigh.R': [4, 0, -3], 'shin.R': [4, 0, 0], 'foot.R': [-2, 0, 0],
  ...ON_HIP,
};
const R = (over: B = {}): B => ({ ...IDLE, ...over });
const HIPS: C3 = [0, -0.02, 0];
const G = { p: [-0.26, -0.14, 0.24] as C3, dir: [0.1, -0.3, 0.95] as C3, pole: [-0.8, -0.4, -0.4] as C3 };
const SG = grip(G.p, G.dir, G.pole);

export const SZAYEL_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.01,
  run: { ...ON_HIP, chest: [4, 0, 0] },
  sprint: { spine: [16, 0, 0], 'upperarm.L': [30, 0, 14], 'forearm.L': [-40, 0, 0], 'hand.L': [10, 0, 0] },
  swingL: 0.1,
  swingR: 0.3,
  grip: {
    idle: { p: G.p, dir: G.dir, edge: [0, -0.95, -0.3], pole: G.pole },
    walk: { p: [-0.27, -0.16, 0.2], dir: [0.1, -0.35, 0.93], edge: [0, -0.93, -0.35], pole: G.pole },
    run: { p: [-0.28, -0.2, -0.06], dir: [-0.2, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.26, -0.1, -0.16], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.3, -0.06, 0.08], dir: [-0.5, -0.3, 0.8], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

// ================================================================== sealed: the string

function thrust(name: string, dur: number, at: number, reach: number, lunge: boolean): ClipDef {
  return {
    name, dur, fadeIn: 0.05, fadeOut: 0.16,
    events: { step: at * 0.5, combo: at + 0.1 },
    keys: mergeKeys(
      [
        ch(0, SG),
        ch(at * 0.55, grip([-0.24, -0.06, 0.02], [0.02, 0, 1], [-0.8, -0.3, -0.5]), 'out'),
        ch(at, grip([-0.12, 0.08, reach], [0, 0.02, 1], [-0.8, -0.3, -0.4]), 'outExpo'),
        ch(at + 0.1, grip([-0.12, 0.08, reach - 0.02], [0, 0, 1], [-0.8, -0.3, -0.4])),
        ch(dur, SG, 'inOut'),
      ],
      [
        body(0, R(), HIPS),
        body(at * 0.55, R({ hips: [0, -18, 0], chest: [0, -10, 0] }), HIPS, 'out'),
        body(at, R(lunge
          ? { hips: [6, 4, 0], spine: [8, 2, 0], chest: [4, 0, 0], head: [-4, -2, 0], 'thigh.L': [16, 0, 4], 'shin.L': [8, 0, 0], 'thigh.R': [-40, 0, -4], 'shin.R': [36, 0, 0], 'foot.R': [-10, 0, 0] }
          : { hips: [2, 2, 0], spine: [4, 2, 0], 'thigh.R': [-20, 0, -4], 'shin.R': [18, 0, 0] }), lunge ? [0, -0.1, 0.16] : [0, -0.04, 0.06], 'outExpo'),
        body(dur, R(), HIPS, 'inOut'),
      ],
    ),
  };
}

function cut(name: string, a: C3, keys: [number, number, 'out' | 'inOut'][], twist: number, launch = false): ClipDef {
  const end = keys[keys.length - 1][0];
  return {
    name, dur: end, fadeIn: 0.05, fadeOut: 0.16,
    events: { step: 0.06, combo: keys[keys.length - 2][0] + 0.06 },
    keys: mergeKeys(
      swingKeys({ a, b: [0, 0, 1], c: [-0.08, 0.06, 0.1], r: 0.36, pole: [-0.8, -0.4, -0.4], keys }),
      [ch(end, SG, 'inOut')],
      [
        body(0, R(), HIPS),
        body(keys[1][0], R({ hips: [0, -twist, 0], spine: [2, -twist * 0.4, 0], chest: [0, -twist * 0.6, 0] }), HIPS, 'out'),
        body(keys[2][0], R(launch
          ? { hips: [-4, twist, 0], spine: [-8, twist * 0.5, 0], chest: [-10, twist * 0.6, 0], head: [-10, 0, 0] }
          : { hips: [4, twist, 0], spine: [8, twist * 0.5, 0], chest: [6, twist * 0.7, 0], 'thigh.L': [-22, 0, 6], 'shin.L': [20, 0, 0], 'thigh.R': [12, 0, -8], 'shin.R': [14, 0, 0] }), [0, -0.05, 0.06], 'out'),
        body(end, R(), HIPS, 'inOut'),
      ],
    ),
  };
}

const s1 = thrust('sz_s1', 0.44, 0.15, 0.62, true);
// the back of the wrist: a flick from his left across to his right
const s2 = cut('sz_s2', [0.9, 0.2, 0], [[0, 25, 'out'], [0.09, 5, 'out'], [0.19, 165, 'out'], [0.42, 140, 'inOut']], -26);
// the rising cut: from low on his right up past his face
const s3 = cut('sz_s3', [-0.3, -0.9, 0.2], [[0, 25, 'out'], [0.09, 0, 'out'], [0.2, 170, 'out'], [0.46, 150, 'inOut']], 18, true);
// the turning slash: wound back across the body, unwound in a wide flat arc
const s4 = cut('sz_s4', [-1, 0.1, 0], [[0, 40, 'out'], [0.14, -10, 'out'], [0.28, 200, 'out'], [0.56, 175, 'inOut']], 44);
s4.events = { step: 0.08 };
/** Rokureichū: a quick needle-thrust, little body in it */
const needle = thrust('sz_needle', 0.38, 0.12, 0.66, false);
needle.events = { cast: 0.12 };

// ================================================================== sealed: the lab

/** the left hand off the hip, a snap of the fingers at shoulder height */
const SNAP_L: B = { 'upperarm.L': [-70, -10, 18], 'forearm.L': [-60, 0, 0], 'hand.L': [-10, 0, 10] };
const snap: ClipDef = {
  name: 'sz_snap', dur: 0.56, fadeIn: 0.06, fadeOut: 0.18,
  events: { snap: 0.22 },
  keys: mergeKeys(
    [ch(0, SG)],
    [
      body(0, R(), HIPS),
      body(0.16, R({ ...SNAP_L, head: [-8, -14, 4], chest: [-2, 10, 0] }), HIPS, 'inOut'),
      body(0.22, R({ ...SNAP_L, 'hand.L': [6, 0, 14], head: [-8, -14, 4], chest: [-2, 10, 0] }), HIPS, 'outExpo'),
      body(0.36, R({ ...SNAP_L, 'hand.L': [6, 0, 14], head: [-8, -14, 4], chest: [-2, 10, 0] }), HIPS),
      body(0.56, R(), HIPS, 'inOut'),
    ],
  ),
};

/** the remote held up before his face, a thumb on the button */
const remote: ClipDef = {
  name: 'sz_remote', dur: 0.6, fadeIn: 0.06, fadeOut: 0.18,
  events: { press: 0.24 },
  keys: mergeKeys(
    [ch(0, SG)],
    [
      body(0, R(), HIPS),
      body(0.18, R({ 'upperarm.L': [-74, 0, -6], 'forearm.L': [-70, 0, 0], 'hand.L': [-20, 0, 0], head: [-2, 6, 0] }), HIPS, 'inOut'),
      body(0.24, R({ 'upperarm.L': [-76, 0, -6], 'forearm.L': [-72, 0, 0], 'hand.L': [-28, 0, 0], head: [-2, 6, 0] }), HIPS, 'outExpo'),
      body(0.42, R({ 'upperarm.L': [-74, 0, -6], 'forearm.L': [-70, 0, 0], 'hand.L': [-20, 0, 0], head: [-2, 6, 0] }), HIPS),
      body(0.6, R(), HIPS, 'inOut'),
    ],
  ),
};

/** a Fracción eaten: the hand lifts it over his open mouth, the head tipped back, a swallow */
const eat: ClipDef = {
  name: 'sz_eat', dur: 1.0, fadeIn: 0.08, fadeOut: 0.22,
  events: { eat: 0.5 },
  keys: mergeKeys(
    [ch(0, SG)],
    [
      body(0, R(), HIPS),
      body(0.3, R({ spine: [-6, 0, 0], chest: [-8, 0, 0], neck: [-12, 0, 0], head: [-24, 0, 0], 'upperarm.L': [-150, 0, 10], 'forearm.L': [-30, 0, 0], 'hand.L': [-30, 0, 0] }), HIPS, 'inOut'),
      body(0.5, R({ spine: [-6, 0, 0], chest: [-8, 0, 0], neck: [-14, 0, 0], head: [-30, 0, 0], 'upperarm.L': [-160, 0, 6], 'forearm.L': [-50, 0, 0], 'hand.L': [-30, 0, 0] }), HIPS, 'inOut'),
      body(0.66, R({ spine: [4, 0, 0], chest: [4, 0, 0], neck: [6, 0, 0], head: [10, 0, 0], 'upperarm.L': [-30, 0, 20], 'forearm.L': [-90, 0, 0], 'hand.L': [0, 0, 0] }), HIPS, 'inOut'),
      body(1.0, R(), HIPS, 'inOut'),
    ],
  ),
};

/**
 * "Susure, Fornicarás": the sword turned point-down over his face, the head tipped back, the blade lowered into his
 * mouth; the body swells.
 */
const release: ClipDef = {
  name: 'sz_release', dur: 1.5, fadeIn: 0.08, fadeOut: 0.24,
  events: { name: 0.2, swallow: 0.7, swell: 0.9 },
  keys: mergeKeys(
    [
      ch(0, SG),
      ch(0.3, grip([-0.05, 0.78, 0.16], [0, -1, 0.02], [-0.8, -0.2, -0.4], [0, 0, 1]), 'inOut'),
      ch(0.5, grip([-0.05, 0.8, 0.16], [0, -1, 0.02], [-0.8, -0.2, -0.4], [0, 0, 1])),
      ch(0.75, grip([-0.05, 0.56, 0.14], [0, -1, 0.02], [-0.8, -0.2, -0.4], [0, 0, 1]), 'inOut'),
      ch(1.0, grip([-0.05, 0.42, 0.14], [0, -1, 0.02], [-0.8, -0.2, -0.4], [0, 0, 1]), 'inOut'),
      { t: 1.25, c: { '@ikR': [0, 0, 0] } },
    ],
    [
      body(0, R(), HIPS),
      body(0.3, R({ spine: [-6, 0, 0], chest: [-8, 0, 0], neck: [-10, 0, 0], head: [-26, 0, 0] }), HIPS, 'inOut'),
      body(0.75, R({ spine: [-8, 0, 0], chest: [-10, 0, 0], neck: [-14, 0, 0], head: [-34, 0, 0] }), HIPS, 'inOut'),
      body(1.05, R({ spine: [-12, 0, 0], chest: [-14, 0, 0], neck: [-14, 0, 0], head: [-36, 0, 0], 'upperarm.L': [-20, 0, 70], 'forearm.L': [-20, 0, 0], 'upperarm.R': [-20, 0, -70], 'forearm.R': [-20, 0, 0] }), [0, 0.02, 0], 'inOut'),
      body(1.5, R(), HIPS, 'inOut'),
    ],
  ),
};

// ================================================================== Fornicarás

/** the hands held up before him, the fingers fanned, the body upright and gliding */
const F_IDLE: B = {
  hips: [0, -6, 0], spine: [-2, 2, 0], chest: [-3, 4, 0], neck: [-2, 0, 0], head: [-5, -4, 2],
  'thigh.L': [-4, 0, 3], 'shin.L': [6, 0, 0], 'thigh.R': [-2, 0, -3], 'shin.R': [4, 0, 0],
  'upperarm.L': [-26, 0, 28], 'forearm.L': [-74, 0, 0], 'hand.L': [-10, 0, 24],
  'upperarm.R': [-34, 0, -22], 'forearm.R': [-66, 0, 0], 'hand.R': [-10, 0, -20],
};
const FR = (over: B = {}): B => ({ ...F_IDLE, ...over });
export const FORNICARAS_STANCE: StanceDef = {
  idle: F_IDLE,
  idleHips: 0,
  run: { 'upperarm.L': [-20, 0, 34], 'forearm.L': [-60, 0, 0], 'upperarm.R': [-20, 0, -34], 'forearm.R': [-60, 0, 0], chest: [6, 0, 0], 'thigh.L': [-10, 0, 0], 'thigh.R': [-10, 0, 0] },
  sprint: { spine: [14, 0, 0], 'upperarm.L': [30, 0, 30], 'upperarm.R': [30, 0, -30], 'forearm.L': [-20, 0, 0], 'forearm.R': [-20, 0, 0] },
  swingL: 0.15,
  swingR: 0.15,
};

/** a hand sweeps out and the branches follow it */
function lash(name: string, side: 'L' | 'R' | 'both', dur: number, rise = false): ClipDef {
  const out: B = {};
  for (const k of side === 'both' ? ['L', 'R'] : [side]) {
    const s = k === 'L' ? 1 : -1;
    out[`upperarm.${k}`] = rise ? [-150, 0, s * 20] : [-84, 0, s * 8];
    out[`forearm.${k}`] = [-10, 0, 0];
    out[`hand.${k}`] = [rise ? -20 : 10, 0, s * 10];
  }
  const twist = side === 'L' ? -16 : side === 'R' ? 16 : 0;
  return {
    name, dur, fadeIn: 0.05, fadeOut: 0.18,
    events: { lash: 0.12, combo: 0.24 },
    keys: [
      body(0, FR(), [0, 0, 0]),
      body(0.07, FR({ chest: [-6, -twist, 0], spine: [-2, -twist * 0.5, 0] }), [0, 0, 0], 'out'),
      body(0.13, FR({ ...out, chest: [6, twist, 0], spine: [4, twist * 0.6, 0], head: [-4, -twist * 0.4, 0] }), [0, -0.02, 0.04], 'outExpo'),
      body(0.3, FR({ ...out, chest: [6, twist, 0], spine: [4, twist * 0.6, 0] }), [0, -0.02, 0.04]),
      body(dur, FR(), [0, 0, 0], 'inOut'),
    ],
  };
}
const f1 = lash('sf_s1', 'R', 0.42);
const f2 = lash('sf_s2', 'L', 0.42);
const f3 = lash('sf_s3', 'both', 0.46, true);
const f4 = lash('sf_s4', 'both', 0.56);
f4.events = { lash: 0.12 };

/** the burrow: both hands thrust down at the ground, then swept up toward the target */
const burrow: ClipDef = {
  name: 'sf_burrow', dur: 0.7, fadeIn: 0.05, fadeOut: 0.2,
  events: { dive: 0.2 },
  keys: [
    body(0, FR(), [0, 0, 0]),
    body(0.2, FR({ spine: [16, 0, 0], chest: [10, 0, 0], head: [10, 0, 0], 'upperarm.L': [-40, 0, 16], 'forearm.L': [-10, 0, 0], 'hand.L': [30, 0, 0], 'upperarm.R': [-40, 0, -16], 'forearm.R': [-10, 0, 0], 'hand.R': [30, 0, 0] }), [0, -0.06, 0], 'outExpo'),
    body(0.45, FR({ spine: [-6, 0, 0], chest: [-8, 0, 0], 'upperarm.L': [-110, 0, 20], 'forearm.L': [-20, 0, 0], 'upperarm.R': [-110, 0, -20], 'forearm.R': [-20, 0, 0] }), [0, 0, 0], 'inOut'),
    body(0.7, FR(), [0, 0, 0], 'inOut'),
  ],
};

/** Carbon-Copy: the arms flung wide, the chest out, the head back as the fountain bursts from his back */
const copy: ClipDef = {
  name: 'sf_copy', dur: 1.1, fadeIn: 0.08, fadeOut: 0.24,
  events: { fountain: 0.35 },
  keys: [
    body(0, FR(), [0, 0, 0]),
    body(0.25, FR({ spine: [8, 0, 0], chest: [10, 0, 0], head: [8, 0, 0], 'upperarm.L': [10, 0, 20], 'forearm.L': [-90, 0, 0], 'upperarm.R': [10, 0, -20], 'forearm.R': [-90, 0, 0] }), [0, -0.05, 0], 'inOut'),
    body(0.4, FR({ spine: [-10, 0, 0], chest: [-16, 0, 0], neck: [-10, 0, 0], head: [-20, 0, 0], 'upperarm.L': [-10, 0, 100], 'forearm.L': [-10, 0, 0], 'hand.L': [0, 0, 20], 'upperarm.R': [-10, 0, -100], 'forearm.R': [-10, 0, 0], 'hand.R': [0, 0, -20] }), [0, 0.03, 0], 'outExpo'),
    body(0.8, FR({ spine: [-10, 0, 0], chest: [-16, 0, 0], neck: [-10, 0, 0], head: [-20, 0, 0], 'upperarm.L': [-10, 0, 100], 'forearm.L': [-10, 0, 0], 'hand.L': [0, 0, 20], 'upperarm.R': [-10, 0, -100], 'forearm.R': [-10, 0, 0], 'hand.R': [0, 0, -20] }), [0, 0.03, 0]),
    body(1.1, FR(), [0, 0, 0], 'inOut'),
  ],
};

/** the snap: the right hand up beside the face */
const fsnap: ClipDef = {
  name: 'sf_snap', dur: 0.5, fadeIn: 0.05, fadeOut: 0.18,
  events: { snap: 0.2 },
  keys: [
    body(0, FR(), [0, 0, 0]),
    body(0.15, FR({ 'upperarm.R': [-90, 0, -40], 'forearm.R': [-70, 0, 0], 'hand.R': [-10, 0, -10], head: [-6, 10, 0] }), [0, 0, 0], 'inOut'),
    body(0.2, FR({ 'upperarm.R': [-92, 0, -40], 'forearm.R': [-74, 0, 0], 'hand.R': [10, 0, -16], head: [-6, 10, 0] }), [0, 0, 0], 'outExpo'),
    body(0.5, FR(), [0, 0, 0], 'inOut'),
  ],
};

/** Teatro de Titere: a wing sweeps round the victim; then the doll is held out on the left palm */
const teatro: ClipDef = {
  name: 'sf_teatro', dur: 1.3, fadeIn: 0.06, fadeOut: 0.24,
  events: { engulf: 0.16, spit: 0.7, doll: 1.0 },
  keys: [
    body(0, FR(), [0, 0, 0]),
    body(0.16, FR({ chest: [4, 20, 0], spine: [4, 10, 0], 'upperarm.R': [-90, 0, -60], 'forearm.R': [-20, 0, 0], 'hand.R': [0, 0, -20] }), [0, -0.02, 0.04], 'outExpo'),
    body(0.7, FR({ chest: [-4, -10, 0], 'upperarm.R': [-60, 0, -30], 'forearm.R': [-40, 0, 0] }), [0, 0, 0], 'inOut'),
    body(1.0, FR({ head: [10, 10, 0], 'upperarm.L': [-44, 0, 10], 'forearm.L': [-80, 0, 0], 'hand.L': [-20, 90, 0] }), [0, 0, 0], 'inOut'),
    body(1.3, FR({ head: [8, 10, 0], 'upperarm.L': [-44, 0, 10], 'forearm.L': [-80, 0, 0], 'hand.L': [-20, 90, 0] }), [0, 0, 0]),
  ],
};

/** the doll held out on the left palm, the right hand working it: a flick, a press, a pinch, the crush */
const DOLL: B = { head: [10, 10, 0], 'upperarm.L': [-44, 0, 10], 'forearm.L': [-80, 0, 0], 'hand.L': [-20, 90, 0] };
function dollOp(name: string, pose: B, at: number, dur: number): ClipDef {
  return {
    name, dur, fadeIn: 0.05, fadeOut: 0.16,
    events: { act: at },
    keys: [
      body(0, FR(DOLL), [0, 0, 0]),
      body(at * 0.6, FR({ ...DOLL, 'upperarm.R': [-50, 0, -10], 'forearm.R': [-90, 0, 0], 'hand.R': [0, -30, 0] }), [0, 0, 0], 'inOut'),
      body(at, FR({ ...DOLL, ...pose }), [0, 0, 0], 'outExpo'),
      body(dur, FR(DOLL), [0, 0, 0], 'inOut'),
    ],
  };
}
const flick = dollOp('sf_flick', { 'upperarm.R': [-56, 0, -2], 'forearm.R': [-96, 0, 0], 'hand.R': [30, -20, 0] }, 0.2, 0.46);
const press = dollOp('sf_press', { 'upperarm.R': [-52, 0, -6], 'forearm.R': [-100, 0, 0], 'hand.R': [10, -40, 0], chest: [6, 4, 0] }, 0.26, 0.6);
const pinch = dollOp('sf_pinch', { 'upperarm.R': [-60, 0, -14], 'forearm.R': [-80, 0, 0], 'hand.R': [-20, -30, 0], head: [16, 12, 0] }, 0.3, 0.66);
const crush: ClipDef = {
  name: 'sf_crush', dur: 1.0, fadeIn: 0.05, fadeOut: 0.24,
  events: { act: 0.5 },
  keys: [
    body(0, FR(DOLL), [0, 0, 0]),
    body(0.3, FR({ head: [-10, 0, 0], chest: [-8, 0, 0], 'upperarm.L': [-150, 0, 20], 'forearm.L': [-20, 0, 0], 'upperarm.R': [-150, 0, -20], 'forearm.R': [-20, 0, 0] }), [0, 0.02, 0], 'inOut'),
    body(0.5, FR({ head: [10, 0, 0], chest: [10, 0, 0], spine: [8, 0, 0], 'upperarm.L': [-60, 0, -10], 'forearm.L': [-90, 0, 0], 'hand.L': [0, 0, -30], 'upperarm.R': [-60, 0, 10], 'forearm.R': [-90, 0, 0], 'hand.R': [0, 0, 30] }), [0, -0.04, 0], 'outExpo'),
    body(1.0, FR(), [0, 0, 0], 'inOut'),
  ],
};

/** Telon Balon: the arms wrapped round himself, curled up as the wings close */
const balon: ClipDef = {
  name: 'sf_balon', dur: 0.4, fadeIn: 0.06, fadeOut: 0.24,
  keys: [
    body(0, FR(), [0, 0, 0]),
    body(0.4, { spine: [24, 0, 0], chest: [16, 0, 0], neck: [14, 0, 0], head: [16, 0, 0], 'thigh.L': [-70, 0, 6], 'shin.L': [100, 0, 0], 'thigh.R': [-70, 0, -6], 'shin.R': [100, 0, 0], 'upperarm.L': [-40, 0, -30], 'forearm.L': [-110, 0, 0], 'hand.L': [0, 0, -20], 'upperarm.R': [-40, 0, 30], 'forearm.R': [-110, 0, 0], 'hand.R': [0, 0, 20] }, [0, 0.1, 0], 'inOut'),
  ],
};

/** Gabriel: the right hand points, a branch goes for the navel */
const gabriel: ClipDef = {
  name: 'sf_gabriel', dur: 0.7, fadeIn: 0.05, fadeOut: 0.2,
  events: { pierce: 0.22 },
  keys: [
    body(0, FR(), [0, 0, 0]),
    body(0.22, FR({ chest: [4, 14, 0], 'upperarm.R': [-86, 0, -4], 'forearm.R': [-6, 0, 0], 'hand.R': [0, 0, 0], head: [-2, -10, 0] }), [0, -0.02, 0.04], 'outExpo'),
    body(0.45, FR({ chest: [4, 14, 0], 'upperarm.R': [-86, 0, -4], 'forearm.R': [-6, 0, 0], 'hand.R': [0, 0, 0], head: [-2, -10, 0] }), [0, -0.02, 0.04]),
    body(0.7, FR(), [0, 0, 0], 'inOut'),
  ],
};

/** eating, released: the hands to the mouth, the head back */
const feat: ClipDef = {
  name: 'sf_eat', dur: 1.0, fadeIn: 0.08, fadeOut: 0.22,
  events: { eat: 0.5 },
  keys: [
    body(0, FR(), [0, 0, 0]),
    body(0.35, FR({ chest: [-8, 0, 0], neck: [-12, 0, 0], head: [-26, 0, 0], 'upperarm.L': [-140, 0, 16], 'forearm.L': [-40, 0, 0], 'upperarm.R': [-140, 0, -16], 'forearm.R': [-40, 0, 0] }), [0, 0, 0], 'inOut'),
    body(0.6, FR({ chest: [6, 0, 0], neck: [6, 0, 0], head: [8, 0, 0] }), [0, 0, 0], 'inOut'),
    body(1.0, FR(), [0, 0, 0], 'inOut'),
  ],
};

export const SZAYEL_CHAIN = ['sz_s1', 'sz_s2', 'sz_s3', 'sz_s4'];
export const FORNICARAS_CHAIN = ['sf_s1', 'sf_s2', 'sf_s3', 'sf_s4'];

export const SZAYEL_CLIPS: ClipDef[] = [...SHARED, s1, s2, s3, s4, needle, snap, remote, eat, release];
export const FORNICARAS_CLIPS: ClipDef[] = [...SHARED, f1, f2, f3, f4, burrow, copy, fsnap, teatro, flick, press, pinch, crush, balon, gabriel, feat];
