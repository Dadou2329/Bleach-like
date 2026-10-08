// Momo Hinamori's animation set (docs/kits/momo.md). Small and earnest: a textbook two-handed guard, Kidō from the left
// palm and from both hands. Sealed: the thrust, two cuts, the rising cut; Shakkahō from the palm; Fushibi's web traced
// with the fingers; Tsuriboshi under her feet; Kyokkō's hands brought together; Hakufuku's palm in the face; "Hajike,
// Tobiume" with the blade raised. Shikai: the same string, the fireball swung off the blade, the volley, the ignition,
// Kaidō over the wound.
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
  // a careful, upright guard, the feet together-ish, the left hand ready to cast
  hips: [0, -8, 0], spine: [2, 2, 0], chest: [0, 4, 0], neck: [0, 0, 0], head: [-2, -4, 0],
  'thigh.L': [-10, 0, 3], 'shin.L': [12, 0, 0], 'foot.L': [-2, 0, 0], 'thigh.R': [6, 0, -4], 'shin.R': [8, 0, 0], 'foot.R': [-4, 0, 0],
  'upperarm.L': [-24, 0, 16], 'forearm.L': [-50, 0, 0], 'hand.L': [-10, 0, 10],
};
const R = (over: B = {}): B => ({ ...IDLE, ...over });
const HIPS: C3 = [0, -0.025, 0];
const G = { p: [-0.22, -0.18, 0.22] as C3, dir: [-0.05, 0.25, 0.97] as C3, pole: [-0.7, -0.4, -0.5] as C3 };
const SG = grip(G.p, G.dir, G.pole);

export const MOMO_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.02,
  run: { 'upperarm.L': [-30, 0, 14], 'forearm.L': [-60, 0, 0], 'hand.L': [0, 0, 0], chest: [4, 0, 0] },
  sprint: { spine: [16, 0, 0], 'upperarm.L': [40, 0, 14], 'forearm.L': [-30, 0, 0], 'hand.L': [10, 0, 0] },
  swingL: 0.8,
  swingR: 0.2,
  grip: {
    idle: { p: G.p, dir: G.dir, edge: [0, -0.97, 0.25], pole: G.pole },
    walk: { p: [-0.23, -0.2, 0.2], dir: [-0.05, 0.2, 0.98], edge: [0, -0.98, 0.2], pole: G.pole },
    run: { p: [-0.26, -0.22, -0.08], dir: [-0.2, -0.25, -0.95], edge: [0, -0.96, 0.25], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.25, -0.1, -0.16], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.3, -0.06, 0.08], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

// ================================================================== the string

const s1: ClipDef = {
  name: 'mo_s1', dur: 0.42, fadeIn: 0.05, fadeOut: 0.16,
  events: { step: 0.08, combo: 0.25 },
  keys: mergeKeys(
    [
      ch(0, SG),
      ch(0.09, grip([-0.2, -0.14, -0.06], [-0.05, -0.05, 1], [-0.7, -0.3, -0.6]), 'out'),
      ch(0.16, grip([-0.1, 0.04, 0.44], [-0.1, 0.02, 1], [-0.7, -0.3, -0.4]), 'outExpo'),
      ch(0.25, grip([-0.1, 0.02, 0.42], [-0.1, 0.0, 1], [-0.7, -0.3, -0.4])),
      ch(0.42, SG, 'inOut'),
    ],
    [
      body(0, R(), HIPS),
      body(0.09, R({ hips: [0, -16, 0], chest: [0, -8, 0], 'thigh.R': [12, 0, -6], 'shin.R': [18, 0, 0] }), [0, -0.04, -0.02], 'out'),
      body(0.16, R({ hips: [4, 4, 0], spine: [8, 2, 0], chest: [4, 2, 0], 'thigh.L': [-34, 0, 4], 'shin.L': [28, 0, 0], 'thigh.R': [22, 0, -6], 'shin.R': [16, 0, 0], 'upperarm.L': [20, 0, 30], 'forearm.L': [-20, 0, 0] }), [0, -0.08, 0.1], 'outExpo'),
      body(0.42, R(), HIPS, 'inOut'),
    ],
  ),
};

function cut(name: string, a: C3, keys: [number, number, 'out' | 'inOut'][], twist: number, launch = false): ClipDef {
  const end = keys[keys.length - 1][0];
  return {
    name, dur: end, fadeIn: 0.05, fadeOut: 0.16,
    events: { step: 0.06, combo: keys[keys.length - 2][0] + 0.06 },
    keys: mergeKeys(
      swingKeys({ a, b: [0, 0, 1], c: [-0.04, 0.04, 0.1], r: 0.3, pole: [-0.7, -0.4, -0.5], keys }),
      [ch(end, SG, 'inOut')],
      [
        body(0, R(), HIPS),
        body(keys[1][0], R({ hips: [0, -twist, 0], spine: [4, -twist * 0.4, 0], chest: [0, -twist * 0.6, 0] }), HIPS, 'out'),
        body(keys[2][0], R(launch
          ? { hips: [-6, twist, 0], spine: [-8, twist * 0.5, 0], chest: [-10, twist * 0.6, 0], 'upperarm.L': [10, 0, 40] }
          : { hips: [6, twist, 0], spine: [10, twist * 0.5, 0], chest: [6, twist * 0.7, 0], 'thigh.L': [-28, 0, 6], 'shin.L': [24, 0, 0], 'thigh.R': [16, 0, -8], 'shin.R': [18, 0, 0], 'upperarm.L': [10, 0, 40] }), [0, -0.06, 0.07], 'out'),
        body(end, R(), HIPS, 'inOut'),
      ],
    ),
  };
}
const s2 = cut('mo_s2', [-0.7, 0.7, 0], [[0, 40, 'out'], [0.1, 0, 'out'], [0.2, 170, 'out'], [0.44, 140, 'inOut']], 22);
const s3 = cut('mo_s3', [0.7, 0.7, 0], [[0, 40, 'out'], [0.1, 0, 'out'], [0.2, 170, 'out'], [0.44, 140, 'inOut']], -22);
const s4 = cut('mo_s4', [0.6, -0.8, 0], [[0, 30, 'out'], [0.1, 10, 'out'], [0.21, 172, 'out'], [0.5, 150, 'inOut']], 14, true);
s4.events = { step: 0.06 };

// ================================================================== Kidō

const PALM: B = { 'upperarm.L': [-84, 0, -4], 'forearm.L': [-4, 0, 0], 'hand.L': [-70, 0, 0] };
/** the left palm out at the target (Shakkahō, Hakufuku) */
const palm: ClipDef = {
  name: 'mo_palm', dur: 0.46, fadeIn: 0.05, fadeOut: 0.16,
  events: { cast: 0.13 },
  keys: mergeKeys(
    [ch(0, SG)],
    [
      body(0, R(), HIPS),
      body(0.13, R({ hips: [2, 12, 0], chest: [4, 12, 0], head: [-2, -12, 0], ...PALM, 'thigh.L': [-24, 0, 4], 'shin.L': [22, 0, 0] }), [0, -0.04, 0.05], 'outExpo'),
      body(0.32, R({ hips: [2, 12, 0], chest: [4, 12, 0], head: [-2, -12, 0], ...PALM, 'thigh.L': [-24, 0, 4], 'shin.L': [22, 0, 0] }), [0, -0.04, 0.05]),
      body(0.46, R(), HIPS, 'inOut'),
    ],
  ),
};

/** Fushibi: two fingers trace the web in the air, left to right and down */
const web: ClipDef = {
  name: 'mo_web', dur: 0.7, fadeIn: 0.05, fadeOut: 0.2,
  events: { cast: 0.36 },
  keys: mergeKeys(
    [ch(0, SG)],
    [
      body(0, R(), HIPS),
      body(0.12, R({ chest: [-2, 10, 0], head: [-4, -6, 0], 'upperarm.L': [-110, 0, 30], 'forearm.L': [-20, 0, 0], 'hand.L': [-20, 0, 0] }), HIPS, 'inOut'),
      body(0.26, R({ chest: [0, -8, 0], head: [-2, 6, 0], 'upperarm.L': [-90, 0, -10], 'forearm.L': [-20, 0, 0], 'hand.L': [-20, 0, 0] }), HIPS, 'inOut'),
      body(0.36, R({ chest: [4, 0, 0], head: [2, 0, 0], 'upperarm.L': [-60, 0, 20], 'forearm.L': [-10, 0, 0], 'hand.L': [-40, 0, 0] }), [0, -0.03, 0.02], 'outExpo'),
      body(0.7, R(), HIPS, 'inOut'),
    ],
  ),
};

/** Kyokkō: both hands brought together before her, the light bending round her */
const veil: ClipDef = {
  name: 'mo_veil', dur: 0.5, fadeIn: 0.05, fadeOut: 0.18,
  events: { cast: 0.18 },
  keys: mergeKeys(
    [ch(0, SG), ch(0.18, grip([-0.08, 0.0, 0.26], [0, 1, 0.1], [-0.8, -0.3, -0.4], [0, 0, 1]), 'inOut'), ch(0.36, grip([-0.08, 0.0, 0.26], [0, 1, 0.1], [-0.8, -0.3, -0.4], [0, 0, 1])), ch(0.5, SG, 'inOut')],
    [
      body(0, R(), HIPS),
      body(0.18, R({ head: [6, 0, 0], 'upperarm.L': [-50, 0, -24], 'forearm.L': [-80, 0, 0], 'hand.L': [-10, 0, -30] }), HIPS, 'inOut'),
      body(0.36, R({ head: [8, 0, 0], 'upperarm.L': [-50, 0, -24], 'forearm.L': [-80, 0, 0], 'hand.L': [-10, 0, -30] }), HIPS),
      body(0.5, R(), HIPS, 'inOut'),
    ],
  ),
};

/** the Tsuriboshi launch: a crouch on the star net, then flung straight up */
const launch: ClipDef = {
  name: 'mo_launch', dur: 0.6, fadeIn: 0.05, fadeOut: 0.2,
  events: { net: 0.1, blast: 0.22 },
  keys: mergeKeys(
    [ch(0, SG)],
    [
      body(0, R(), HIPS),
      body(0.2, R({ hips: [16, 0, 0], spine: [14, 0, 0], chest: [10, 0, 0], 'thigh.L': [-60, 0, 8], 'shin.L': [90, 0, 0], 'thigh.R': [-50, 0, -8], 'shin.R': [86, 0, 0], 'upperarm.L': [-20, 0, 40] }), [0, -0.3, 0], 'inOut'),
      body(0.32, R({ hips: [-6, 0, 0], spine: [-6, 0, 0], chest: [-6, 0, 0], head: [-14, 0, 0], 'thigh.L': [6, 0, 6], 'shin.L': [10, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [12, 0, 0], 'upperarm.L': [-150, 0, 30], 'forearm.L': [-10, 0, 0] }), [0, 0.04, 0], 'outExpo'),
      body(0.6, R(), HIPS, 'inOut'),
    ],
  ),
};

/** Kaidō: the hands over the wound, the head bowed (held) */
const kaido: ClipDef = {
  name: 'mo_kaido', dur: 0.4, fadeIn: 0.08, fadeOut: 0.25,
  keys: mergeKeys(
    [ch(0, SG), { t: 0.2, c: { '@ikR': [0, 0, 0] } }],
    [
      body(0, R(), HIPS),
      body(0.4, R({ spine: [10, 0, 0], chest: [8, 0, 0], neck: [8, 0, 0], head: [12, 0, 0], 'upperarm.L': [-34, 0, -20], 'forearm.L': [-84, 0, 0], 'hand.L': [-10, 0, -20], 'upperarm.R': [-30, 0, 18], 'forearm.R': [-80, 0, 0], 'hand.R': [-10, 0, 20] }), [0, -0.04, 0], 'inOut'),
    ],
  ),
};

/** "Hajike, Tobiume": the blade raised high, then snapped down as it straightens and the prongs spring out */
const release: ClipDef = {
  name: 'mo_release', dur: 0.86, fadeIn: 0.06, fadeOut: 0.22,
  events: { name: 0.2, snap: 0.44 },
  keys: mergeKeys(
    [
      ch(0, SG),
      ch(0.2, grip([-0.1, 0.36, 0.14], [0.0, 1, 0.1], [-0.8, -0.3, -0.4], [0, 0, 1]), 'inOut'),
      ch(0.36, grip([-0.1, 0.38, 0.14], [0.0, 1, 0.1], [-0.8, -0.3, -0.4], [0, 0, 1])),
      ch(0.48, grip([-0.14, 0.0, 0.42], [-0.05, 0.1, 1], [-0.7, -0.4, -0.4]), 'outExpo'),
      ch(0.86, SG, 'inOut'),
    ],
    [
      body(0, R(), HIPS),
      body(0.2, R({ chest: [-6, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-30, 0, 30], 'forearm.L': [-60, 0, 0] }), HIPS, 'inOut'),
      body(0.36, R({ chest: [-8, 0, 0], head: [-12, 0, 0], 'upperarm.L': [-30, 0, 30], 'forearm.L': [-60, 0, 0] }), HIPS),
      body(0.48, R({ hips: [4, 0, 0], spine: [8, 0, 0], chest: [6, 0, 0], head: [0, 0, 0], 'thigh.L': [-28, 0, 4], 'shin.L': [26, 0, 0] }), [0, -0.05, 0.05], 'outExpo'),
      body(0.86, R(), HIPS, 'inOut'),
    ],
  ),
};

// ================================================================== Shikai

/** the fireball: the blade swung up and forward, the fire leaving its point */
const fire: ClipDef = {
  name: 'mo_fire', dur: 0.5, fadeIn: 0.05, fadeOut: 0.18,
  events: { fire: 0.16 },
  keys: mergeKeys(
    swingKeys({ a: [0, 1, 0], b: [0, 0, 1], c: [-0.06, 0.06, 0.1], r: 0.3, pole: [-0.7, -0.3, -0.5], keys: [[0, 70, 'out'], [0.08, -10, 'out'], [0.18, 100, 'out'], [0.5, 80, 'inOut']] }),
    [ch(0.5, SG, 'inOut')],
    [
      body(0, R(), HIPS),
      body(0.08, R({ hips: [-4, -10, 0], chest: [-8, -6, 0], head: [-6, 4, 0] }), HIPS, 'out'),
      body(0.18, R({ hips: [4, 8, 0], spine: [8, 4, 0], chest: [6, 6, 0], 'thigh.L': [-26, 0, 4], 'shin.L': [24, 0, 0], 'upperarm.L': [10, 0, 36] }), [0, -0.05, 0.06], 'out'),
      body(0.5, R(), HIPS, 'inOut'),
    ],
  ),
};

/** the volley: the blade swept across, fireballs spraying off it */
const volley: ClipDef = {
  name: 'mo_volley', dur: 0.62, fadeIn: 0.05, fadeOut: 0.2,
  events: { fire: 0.16 },
  keys: mergeKeys(
    swingKeys({ a: [-1, 0.3, 0], b: [0, 0, 1], c: [-0.04, 0.08, 0.1], r: 0.34, pole: [-0.5, -0.6, -0.5], keys: [[0, -10, 'out'], [0.1, -40, 'out'], [0.3, 200, 'out'], [0.62, 150, 'inOut']] }),
    [ch(0.62, SG, 'inOut')],
    [
      body(0, R(), HIPS),
      body(0.1, R({ hips: [0, -24, 0], chest: [0, -16, 0], head: [-2, 16, 0] }), HIPS, 'out'),
      body(0.3, R({ hips: [4, 24, 0], spine: [6, 10, 0], chest: [4, 20, 0], head: [-4, -16, 0], 'thigh.L': [-28, 0, 6], 'shin.L': [26, 0, 0], 'upperarm.L': [0, 0, 60] }), [0, -0.06, 0.06], 'out'),
      body(0.62, R(), HIPS, 'inOut'),
    ],
  ),
};

export const MOMO_CHAIN = ['mo_s1', 'mo_s2', 'mo_s3', 'mo_s4'];

const COMMON = [s1, s2, s3, s4, palm, web, veil, launch, kaido, release];
export const MOMO_CLIPS: ClipDef[] = [...SHARED, ...COMMON];
export const TOBIUME_CLIPS: ClipDef[] = [...SHARED, ...COMMON, fire, volley];
