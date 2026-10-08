// Zommari Rureaux's animation set (docs/kits/zommari.md). Sealed: upright and unhurried, the sword low in his right
// hand, the left raised before his chest like half a prayer; a calm one-handed string (the thrust, the rising cut,
// the flat cut, the long finishing cut), the cut his copies make with him, the gestures that send the copies, the
// meditation with the palms pressed together, "Shizumare, Brujería" (the sword left hanging before him, the clap, the
// head twisted to his right). Brujería: the torso upright on the bulb, the right palm (its eye) raised at a target,
// the beckoning hand that walks a marked body to him, both hands up for the head, the sweep for objects, the head
// bowed for the forehead eyes, the arms crossed over the head for El Embrion.
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

// ================================================================== sealed

/** the left hand raised before the chest, upright, half a prayer */
const HALF_PRAYER: B = { 'upperarm.L': [-34, 0, 14], 'forearm.L': [-96, 0, 0], 'hand.L': [0, 70, 0] };
const IDLE: B = {
  hips: [0, -4, 0], spine: [-2, 2, 0], chest: [-3, 2, 0], neck: [-2, 0, 0], head: [-4, 2, 0],
  'thigh.L': [-4, 0, 4], 'shin.L': [6, 0, 0], 'foot.L': [-2, 0, 0], 'thigh.R': [-2, 0, -4], 'shin.R': [4, 0, 0], 'foot.R': [-2, 0, 0],
  ...HALF_PRAYER,
};
const R = (over: B = {}): B => ({ ...IDLE, ...over });
const HIPS: C3 = [0, -0.01, 0];
const G = { p: [-0.3, -0.24, 0.16] as C3, dir: [0.15, -0.45, 0.88] as C3, pole: [-0.8, -0.4, -0.4] as C3 };
const SG = grip(G.p, G.dir, G.pole);

export const ZOMMARI_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.01,
  run: { ...HALF_PRAYER, chest: [4, 0, 0] },
  sprint: { spine: [18, 0, 0], 'upperarm.L': [30, 0, 14], 'forearm.L': [-30, 0, 0], 'hand.L': [0, 0, 0] },
  swingL: 0.1,
  swingR: 0.3,
  grip: {
    idle: { p: G.p, dir: G.dir, edge: [0, -0.9, -0.45], pole: G.pole },
    walk: { p: [-0.31, -0.26, 0.12], dir: [0.15, -0.5, 0.85], edge: [0, -0.85, -0.5], pole: G.pole },
    run: { p: [-0.3, -0.22, -0.08], dir: [-0.2, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.28, -0.12, -0.18], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.32, -0.08, 0.08], dir: [-0.5, -0.3, 0.8], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

function thrust(name: string, dur: number, at: number, reach: number): ClipDef {
  return {
    name, dur, fadeIn: 0.05, fadeOut: 0.16,
    events: { step: at * 0.5, combo: at + 0.1 },
    keys: mergeKeys(
      [
        ch(0, SG),
        ch(at * 0.55, grip([-0.26, -0.06, 0.02], [0.02, 0, 1], [-0.8, -0.3, -0.5]), 'out'),
        ch(at, grip([-0.14, 0.06, reach], [0, 0.02, 1], [-0.8, -0.3, -0.4]), 'outExpo'),
        ch(at + 0.1, grip([-0.14, 0.06, reach - 0.02], [0, 0, 1], [-0.8, -0.3, -0.4])),
        ch(dur, SG, 'inOut'),
      ],
      [
        body(0, R(), HIPS),
        body(at * 0.55, R({ hips: [0, -16, 0], chest: [0, -8, 0] }), HIPS, 'out'),
        body(at, R({ hips: [4, 4, 0], spine: [6, 2, 0], chest: [4, 0, 0], 'thigh.L': [12, 0, 4], 'shin.L': [8, 0, 0], 'thigh.R': [-34, 0, -4], 'shin.R': [30, 0, 0], 'foot.R': [-8, 0, 0] }), [0, -0.08, 0.14], 'outExpo'),
        body(dur, R(), HIPS, 'inOut'),
      ],
    ),
  };
}

function cut(name: string, a: C3, keys: [number, number, 'out' | 'inOut'][], twist: number): ClipDef {
  const end = keys[keys.length - 1][0];
  return {
    name, dur: end, fadeIn: 0.05, fadeOut: 0.16,
    events: { step: 0.06, combo: keys[keys.length - 2][0] + 0.06 },
    keys: mergeKeys(
      swingKeys({ a, b: [0, 0, 1], c: [-0.08, 0.06, 0.1], r: 0.4, pole: [-0.8, -0.4, -0.4], keys }),
      [ch(end, SG, 'inOut')],
      [
        body(0, R(), HIPS),
        body(keys[1][0], R({ hips: [0, -twist, 0], spine: [2, -twist * 0.4, 0], chest: [0, -twist * 0.6, 0] }), HIPS, 'out'),
        body(keys[2][0], R({ hips: [4, twist, 0], spine: [6, twist * 0.5, 0], chest: [4, twist * 0.7, 0], 'thigh.L': [-20, 0, 6], 'shin.L': [18, 0, 0], 'thigh.R': [10, 0, -8], 'shin.R': [12, 0, 0] }), [0, -0.05, 0.06], 'out'),
        body(end, R(), HIPS, 'inOut'),
      ],
    ),
  };
}

const s1 = thrust('zm_s1', 0.46, 0.15, 0.64);
// the rising cut: low on his right up past his face
const s2 = cut('zm_s2', [-0.3, -0.9, 0.2], [[0, 25, 'out'], [0.1, 0, 'out'], [0.21, 170, 'out'], [0.46, 150, 'inOut']], 16);
// the flat cut: across from his right to his left at chest height
const s3 = cut('zm_s3', [0, 1, 0], [[0, 30, 'out'], [0.11, 0, 'out'], [0.22, 170, 'out'], [0.48, 150, 'inOut']], -24);
// the long finishing cut: wound up over his right shoulder and drawn down across in a long diagonal
const s4 = cut('zm_s4', [-0.7, 0.7, 0], [[0, 30, 'out'], [0.16, -20, 'out'], [0.3, 190, 'out'], [0.6, 170, 'inOut']], 36);
s4.events = { step: 0.1 };
/** the cut he and his copies make at once: a short diagonal down from high on the right */
const tri = cut('zm_tri', [-0.6, 0.75, 0.2], [[0, 20, 'out'], [0.1, -10, 'out'], [0.2, 160, 'out'], [0.44, 140, 'inOut']], 20);
tri.events = { hit: 0.18 };

/** the copies sent: the left hand flicks out, two fingers up */
const gemelos: ClipDef = {
  name: 'zm_gemelos', dur: 0.4, fadeIn: 0.04, fadeOut: 0.14,
  events: { go: 0.12 },
  keys: mergeKeys(
    [ch(0, SG)],
    [
      body(0, R(), HIPS),
      body(0.12, R({ 'upperarm.L': [-80, 0, 30], 'forearm.L': [-20, 0, 0], 'hand.L': [0, 0, 10], chest: [0, 12, 0], head: [-4, 10, 0] }), HIPS, 'outExpo'),
      body(0.4, R(), HIPS, 'inOut'),
    ],
  ),
};
/** every copy ordered in: the left arm swept out flat to the side */
const assault: ClipDef = {
  name: 'zm_assault', dur: 0.6, fadeIn: 0.05, fadeOut: 0.18,
  events: { go: 0.2 },
  keys: mergeKeys(
    [ch(0, SG)],
    [
      body(0, R(), HIPS),
      body(0.12, R({ 'upperarm.L': [-60, 0, -20], 'forearm.L': [-60, 0, 0], chest: [0, -14, 0] }), HIPS, 'out'),
      body(0.22, R({ 'upperarm.L': [-90, 0, 70], 'forearm.L': [-6, 0, 0], 'hand.L': [0, 0, 20], chest: [0, 14, 0], head: [-6, 0, 0] }), HIPS, 'outExpo'),
      body(0.6, R(), HIPS, 'inOut'),
    ],
  ),
};

/** meditation: the sword laid aside in the right hand's ring, the palms pressed together, the head bowed (held) */
const PRAY: B = { 'upperarm.L': [-30, 0, 12], 'forearm.L': [-100, 0, 0], 'hand.L': [0, 80, 0], 'upperarm.R': [-30, 0, -12], 'forearm.R': [-100, 0, 0], 'hand.R': [0, -80, 0], head: [10, 0, 0], neck: [6, 0, 0], spine: [0, 0, 0], chest: [0, 0, 0] };
const pray: ClipDef = {
  name: 'zm_pray', dur: 0.5, fadeIn: 0.1, fadeOut: 0.25,
  keys: mergeKeys(
    [ch(0, SG), { t: 0.3, c: { '@ikR': [0, 0, 0] } }],
    [body(0, R(), HIPS), body(0.5, R(PRAY), [0, -0.02, 0], 'inOut')],
  ),
};

/**
 * "Shizumare, Brujería": the sword let go to hang level before his chest (the kit floats it there), the palms clapped
 * together, the head twisted hard to his right; the foam swallows him.
 */
const release: ClipDef = {
  name: 'zm_release', dur: 1.6, fadeIn: 0.08, fadeOut: 0.24,
  events: { let: 0.2, clap: 0.66, twist: 0.84, foam: 1.0 },
  keys: mergeKeys(
    [ch(0, SG), ch(0.18, grip([-0.1, 0.0, 0.34], [1, 0, 0], [-0.8, -0.4, -0.4], [0, 1, 0]), 'inOut'), { t: 0.22, c: { '@ikR': [0, 0, 0] } }],
    [
      body(0, R(), HIPS),
      body(0.4, R({ 'upperarm.L': [-60, 0, 50], 'forearm.L': [-50, 0, 0], 'upperarm.R': [-60, 0, -50], 'forearm.R': [-50, 0, 0] }), HIPS, 'inOut'),
      body(0.66, R(PRAY), [0, -0.03, 0], 'outExpo'),
      body(0.84, R({ ...PRAY, head: [0, -80, 0], neck: [0, -10, 0] }), [0, -0.03, 0], 'outExpo'),
      body(1.6, R({ ...PRAY, head: [0, -80, 0], neck: [0, -10, 0] }), [0, -0.03, 0]),
    ],
  ),
};

export const ZOMMARI_CHAIN = ['zm_s1', 'zm_s2', 'zm_s3', 'zm_s4'];
export const ZOMMARI_CLIPS: ClipDef[] = [...SHARED, s1, s2, s3, s4, tri, gemelos, assault, pray, release];

// ================================================================== Brujería

/** upright on the bulb, the palms open before him at waist height */
const B_IDLE: B = {
  hips: [0, 0, 0], spine: [-2, 0, 0], chest: [-2, 0, 0], neck: [-2, 0, 0], head: [-4, 0, 0],
  'upperarm.L': [-24, 0, 20], 'forearm.L': [-70, 0, 0], 'hand.L': [0, 0, 20],
  'upperarm.R': [-24, 0, -20], 'forearm.R': [-70, 0, 0], 'hand.R': [0, 0, -20],
};
const BR = (over: B = {}): B => ({ ...B_IDLE, ...over });

export const BRUJERIA_STANCE: StanceDef = {
  idle: B_IDLE,
  idleHips: 0,
  run: { chest: [4, 0, 0] },
  sprint: { spine: [10, 0, 0], 'upperarm.L': [10, 0, 30], 'upperarm.R': [10, 0, -30] },
  swingL: 0.05,
  swingR: 0.05,
  freqScale: 0.5,
};

/** a gaze cast: the right palm (its eye) raised at the target, a beat, then lowered */
function gaze(name: string, dur: number, at: number, pose: B, ev = 'gaze'): ClipDef {
  return {
    name, dur, fadeIn: 0.06, fadeOut: 0.2,
    events: { [ev]: at },
    keys: [
      body(0, BR(), [0, 0, 0]),
      body(at * 0.7, BR(pose), [0, 0, 0], 'out'),
      body(at, BR(pose), [0, 0, 0]),
      body(at + 0.25, BR(pose), [0, 0, 0]),
      body(dur, BR(), [0, 0, 0], 'inOut'),
    ],
  };
}
const PALM: B = { 'upperarm.R': [-86, 0, -6], 'forearm.R': [-10, 0, 0], 'hand.R': [-80, 0, 0], chest: [0, -10, 0], head: [-4, -6, 0] };
const amor = gaze('zb_amor', 0.8, 0.3, PALM);
const snap = gaze('zb_palm', 0.55, 0.2, PALM);
/** the beckoning hand: palm up, the fingers drawing the marked body in */
const march: ClipDef = {
  name: 'zb_march', dur: 0.8, fadeIn: 0.06, fadeOut: 0.2,
  events: { gaze: 0.12, pull: 0.3 },
  keys: [
    body(0, BR(), [0, 0, 0]),
    body(0.15, BR({ 'upperarm.R': [-70, 0, -10], 'forearm.R': [-10, 0, 0], 'hand.R': [0, -90, -10], chest: [0, -8, 0] }), [0, 0, 0], 'out'),
    body(0.35, BR({ 'upperarm.R': [-40, 0, -14], 'forearm.R': [-90, 0, 0], 'hand.R': [-40, -90, -10], chest: [-4, -4, 0] }), [0, 0, 0], 'inOut'),
    body(0.8, BR(), [0, 0, 0], 'inOut'),
  ],
};
/** the head: both hands up, every eye on the face of the target */
const headClip = gaze('zb_head', 0.95, 0.38, { 'upperarm.R': [-120, 0, -16], 'forearm.R': [-20, 0, 0], 'hand.R': [-60, 0, 0], 'upperarm.L': [-120, 0, 16], 'forearm.L': [-20, 0, 0], 'hand.L': [-60, 0, 0], head: [-10, 0, 0], chest: [-8, 0, 0] });
/** objects: the left hand swept across the field of view */
const objects: ClipDef = {
  name: 'zb_object', dur: 0.8, fadeIn: 0.06, fadeOut: 0.2,
  events: { gaze: 0.3 },
  keys: [
    body(0, BR(), [0, 0, 0]),
    body(0.15, BR({ 'upperarm.L': [-80, 0, -30], 'forearm.L': [-20, 0, 0], 'hand.L': [-60, 0, 0], chest: [0, -16, 0] }), [0, 0, 0], 'out'),
    body(0.35, BR({ 'upperarm.L': [-84, 0, 60], 'forearm.L': [-10, 0, 0], 'hand.L': [-60, 0, 30], chest: [0, 16, 0] }), [0, 0, 0], 'outExpo'),
    body(0.8, BR(), [0, 0, 0], 'inOut'),
  ],
};
/** the forehead eyes: the head bowed forward, then lifted to stare */
const forehead: ClipDef = {
  name: 'zb_forehead', dur: 1.0, fadeIn: 0.06, fadeOut: 0.22,
  events: { open: 0.2, volley: 0.42 },
  keys: [
    body(0, BR(), [0, 0, 0]),
    body(0.25, BR({ neck: [14, 0, 0], head: [24, 0, 0], chest: [6, 0, 0] }), [0, 0, 0], 'inOut'),
    body(0.42, BR({ neck: [-6, 0, 0], head: [-10, 0, 0], chest: [-6, 0, 0], 'upperarm.L': [-30, 0, 50], 'upperarm.R': [-30, 0, -50] }), [0, 0, 0], 'outExpo'),
    body(1.0, BR(), [0, 0, 0], 'inOut'),
  ],
};
/** El Embrion: hunched down, the arms crossed over the head (held) */
const embrion: ClipDef = {
  name: 'zb_embrion', dur: 0.4, fadeIn: 0.08, fadeOut: 0.3,
  keys: [
    body(0, BR(), [0, 0, 0]),
    body(0.4, BR({ spine: [24, 0, 0], chest: [20, 0, 0], neck: [20, 0, 0], head: [20, 0, 0], 'upperarm.L': [-150, 0, -30], 'forearm.L': [-80, 0, 0], 'upperarm.R': [-150, 0, 30], 'forearm.R': [-80, 0, 0] }), [0, -0.3, 0], 'inOut'),
  ],
};
/** the reveal after the foam: arms spread, the eyes all open */
const reveal: ClipDef = {
  name: 'zb_reveal', dur: 1.2, fadeIn: 0.05, fadeOut: 0.3,
  events: { open: 0.3 },
  keys: [
    body(0, BR({ spine: [14, 0, 0], chest: [10, 0, 0], head: [16, 0, 0] }), [0, -0.1, 0]),
    body(0.4, BR({ spine: [-8, 0, 0], chest: [-10, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-40, 0, 70], 'forearm.L': [-20, 0, 0], 'upperarm.R': [-40, 0, -70], 'forearm.R': [-20, 0, 0] }), [0, 0, 0], 'outExpo'),
    body(1.2, BR(), [0, 0, 0], 'inOut'),
  ],
};

export const BRUJERIA_CLIPS: ClipDef[] = [...SHARED, amor, snap, march, headClip, objects, forehead, embrion, reveal];
