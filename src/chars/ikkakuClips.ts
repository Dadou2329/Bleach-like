// Ikkaku Madarame's animation set (docs/roster/C1-lieutenants-1.md §Ikkaku). A loose, cocky brawler.
// Sealed: the sword in his right hand, the sheath reversed in his left — a diagonal cut, a sheath hook, a thrust,
// sword and sheath slammed down crossed; the crossed press; the hand swap (the sword tossed to the left hand
// for a cut from the side nobody watched); a headbutt; the styptic from the pommel; the lucky dance; "Nobiro"
// (the hilt slammed into the sheath). Shikai, the spear: thrust, a jab with the tassel end, a sweep, a turn
// and thrust; the overhead smash; "Sakero" (the head section whipped round the guard) and the hurled segment;
// the Bankai call. Bankai, Ryūmon Hōzukimaru: the guandao (right) and the monk's spade (left) in turn, then both
// crashed together; the X crash; the Ryūmon spin with both hands on the centre handle; the spade flung on its
// chain; the reiatsu explosion (the centre blade spun overhead and slammed down).
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

function body(t: number, b: B, hips?: KeyDef['hips'], ease?: KeyDef['ease']): KeyDef {
  return { t, b, hips, ease };
}
const ch = (t: number, c: Record<string, C3>, ease?: KeyDef['ease']): KeyDef => ({ t, ease, c });
const two = (t: number, w: number, ease?: KeyDef['ease']): KeyDef => ({ t, ease, c: { '@twoHand': [w, 0, 0] } });
const offL = (t: number, ease?: KeyDef['ease']): KeyDef => ({ t, ease, c: { '@ikL': [0, 0, 0] } });
/** the left hand's grip; the sheath is held reversed, so its body runs out along −dir */
const gripL = (p: C3, dir: C3, pole: C3, ref: C3 = [0, -1, 0]) => grip(p, dir, pole, ref, 'L');

const SHARED = ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name));

// ================================================================== sealed: sword and sheath

const S_IDLE: B = {
  hips: [2, -16, 0], spine: [4, 6, 0], chest: [3, 8, 0], neck: [0, 0, 0], head: [-4, -4, 4],
  'thigh.L': [-14, 0, 6], 'shin.L': [20, 0, 0], 'foot.L': [-6, 0, 0], 'thigh.R': [10, 0, -8], 'shin.R': [18, 0, 0], 'foot.R': [-10, 0, 0],
  // the sheath reversed along the left forearm, the fist forward at the hip
  'upperarm.L': [-22, 0, 16], 'forearm.L': [-46, 0, 0], 'hand.L': [0, 0, 6],
};
const S_HIPS: C3 = [0, -0.04, 0];
const SG = { p: [-0.3, -0.3, 0.16] as C3, dir: [-0.05, -0.5, 0.86] as C3, edge: [0, -0.86, -0.5] as C3, pole: [-0.6, -0.3, -0.75] as C3 };
const SG_IDLE = grip(SG.p, SG.dir, SG.pole);

/** A loose brawler's stance: knees bent, the sword low and out, the sheath held along his left forearm. */
export const IKKAKU_STANCE: StanceDef = {
  idle: S_IDLE,
  idleHips: -0.04,
  run: { 'upperarm.L': [-30, 0, 18], 'forearm.L': [-60, 0, 0], chest: [0, 6, 0] },
  sprint: { 'upperarm.L': [10, 0, 16], 'forearm.L': [-70, 0, 0] },
  swingL: 0.4,
  swingR: 0.2,
  grip: {
    idle: SG,
    walk: { p: [-0.3, -0.3, 0.1], dir: [-0.05, -0.55, 0.83], edge: [0, -0.83, -0.55], pole: [-0.6, -0.3, -0.75] },
    run: { p: [-0.3, -0.26, -0.08], dir: [-0.2, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.28, -0.14, -0.18], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.38, -0.06, 0.12], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

// the diagonal cut, high right to low left
const s1: ClipDef = {
  name: 'ik_s1', dur: 0.5, fadeIn: 0.05, fadeOut: 0.18,
  events: { step: 0.08, combo: 0.3 },
  keys: mergeKeys(
    swingKeys({ a: [-0.7, 0.7, 0], b: [0, 0, 1], c: [-0.04, 0.04, 0.12], r: 0.38, pole: [-0.7, -0.4, -0.5], keys: [[0, 30, 'out'], [0.1, -10, 'out'], [0.22, 175, 'outExpo'], [0.5, 150, 'inOut']] }),
    [
      body(0, S_IDLE, S_HIPS),
      body(0.1, { ...S_IDLE, hips: [0, -30, 0], spine: [2, -8, 0], chest: [0, -14, 0], head: [-4, 20, 0] }, [0, -0.04, 0], 'out'),
      body(0.22, { ...S_IDLE, hips: [6, 18, 0], spine: [10, 12, 0], chest: [8, 18, 0], head: [-6, -18, 0], 'thigh.L': [-34, 0, 6], 'shin.L': [30, 0, 0], 'thigh.R': [22, 0, -8], 'shin.R': [22, 0, 0] }, [0, -0.08, 0.1], 'outExpo'),
      body(0.5, S_IDLE, S_HIPS, 'inOut'),
    ],
  ),
};

// the sheath hook: the left fist swings round with the sheath laid along the forearm
const s2: ClipDef = {
  name: 'ik_s2', dur: 0.5, fadeIn: 0.04, fadeOut: 0.18,
  events: { step: 0.06, hit: 0.16, combo: 0.3 },
  keys: mergeKeys(
    [ch(0, SG_IDLE), ch(0.12, grip([-0.36, -0.2, -0.05], [-0.4, -0.3, 0.86], [-0.5, -0.5, -0.6]), 'out'), ch(0.5, SG_IDLE, 'inOut')],
    [
      offL(0),
      ch(0.08, gripL([0.36, -0.1, -0.06], [0.3, 0.1, 0.95], [0.8, -0.2, -0.5]), 'out'),
      ch(0.16, gripL([-0.02, 0.02, 0.44], [-0.75, 0.05, 0.66], [0.9, 0.3, -0.2]), 'outExpo'),
      ch(0.3, gripL([-0.04, 0.0, 0.42], [-0.75, 0.0, 0.66], [0.9, 0.3, -0.2])),
      offL(0.5, 'inOut'),
    ],
    [
      body(0, S_IDLE, S_HIPS),
      body(0.08, { ...S_IDLE, hips: [0, 16, 0], spine: [0, 10, 0], chest: [0, 16, 0] }, S_HIPS, 'out'),
      body(0.16, { ...S_IDLE, hips: [4, -26, 0], spine: [6, -14, 0], chest: [4, -22, 0], head: [-6, 18, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [26, 0, 0] }, [0, -0.06, 0.08], 'outExpo'),
      body(0.5, S_IDLE, S_HIPS, 'inOut'),
    ],
  ),
};

// the thrust: the sword drawn back at the hip and driven straight out
const s3: ClipDef = {
  name: 'ik_s3', dur: 0.5, fadeIn: 0.04, fadeOut: 0.18,
  events: { step: 0.08, combo: 0.3 },
  keys: mergeKeys(
    [
      ch(0, SG_IDLE),
      ch(0.1, grip([-0.28, -0.16, -0.24], [0.02, 0.02, 1], [-0.7, -0.4, -0.5]), 'inOut'),
      ch(0.2, grip([-0.14, -0.04, 0.56], [0.02, -0.06, 1], [-0.6, -0.6, 0]), 'outExpo'),
      ch(0.32, grip([-0.14, -0.05, 0.54], [0.02, -0.08, 1], [-0.6, -0.6, 0])),
      ch(0.5, SG_IDLE, 'inOut'),
    ],
    [
      body(0, S_IDLE, S_HIPS),
      body(0.1, { ...S_IDLE, hips: [0, -24, 0], spine: [-4, -10, 0], chest: [-4, -14, 0], head: [2, 22, 0] }, [0, -0.02, -0.06], 'inOut'),
      body(0.2, { ...S_IDLE, hips: [8, 12, 0], spine: [14, 8, 0], chest: [8, 10, 0], head: [-12, -14, 0], 'thigh.L': [-48, 0, 6], 'shin.L': [50, 0, 0], 'thigh.R': [28, 0, -8], 'shin.R': [30, 0, 0] }, [0, -0.12, 0.18], 'outExpo'),
      body(0.32, { ...S_IDLE, hips: [6, 10, 0], spine: [12, 6, 0], chest: [6, 8, 0], head: [-10, -12, 0], 'thigh.L': [-44, 0, 6], 'shin.L': [46, 0, 0], 'thigh.R': [26, 0, -8], 'shin.R': [28, 0, 0] }, [0, -0.11, 0.16], 'out'),
      body(0.5, S_IDLE, S_HIPS, 'inOut'),
    ],
  ),
};

// sword and sheath raised together and slammed down crossed
const s4: ClipDef = {
  name: 'ik_s4', dur: 0.66, fadeIn: 0.05, fadeOut: 0.2,
  events: { step: 0.2, hit: 0.32, combo: 0.46 },
  keys: mergeKeys(
    swingKeys({ a: [0, 1, 0], b: [0, 0, 1], c: [-0.06, 0.1, 0.1], r: 0.36, tilt: 0.2, pole: [-0.6, -0.2, -0.75], keys: [[0, 160, 'out'], [0.2, -20, 'out'], [0.32, 140, 'outExpo'], [0.66, 150, 'inOut']] }),
    [
      offL(0),
      ch(0.2, gripL([0.2, 0.44, -0.04], [-0.15, -0.5, 0.85], [0.7, 0.3, -0.6]), 'out'),
      ch(0.32, gripL([0.12, -0.1, 0.4], [0.4, 0.55, -0.73], [0.8, -0.3, -0.5]), 'outExpo'),
      ch(0.46, gripL([0.12, -0.11, 0.39], [0.4, 0.55, -0.73], [0.8, -0.3, -0.5])),
      offL(0.66, 'inOut'),
    ],
    [
      body(0, S_IDLE, S_HIPS),
      body(0.2, { ...S_IDLE, hips: [-6, -4, 0], spine: [-14, 0, 0], chest: [-12, 0, 0], head: [-10, 0, 0], 'thigh.L': [-10, 0, 6], 'shin.L': [14, 0, 0] }, [0, 0.02, -0.04], 'out'),
      body(0.32, { ...S_IDLE, hips: [12, 0, 0], spine: [18, 0, 0], chest: [12, 0, 0], head: [-12, 0, 0], 'thigh.L': [-44, 0, 6], 'shin.L': [52, 0, 0], 'thigh.R': [26, 0, -8], 'shin.R': [36, 0, 0] }, [0, -0.18, 0.14], 'outExpo'),
      body(0.46, { ...S_IDLE, hips: [10, 0, 0], spine: [16, 0, 0], chest: [10, 0, 0], head: [-10, 0, 0], 'thigh.L': [-42, 0, 6], 'shin.L': [50, 0, 0], 'thigh.R': [24, 0, -8], 'shin.R': [34, 0, 0] }, [0, -0.17, 0.13], 'out'),
      body(0.66, S_IDLE, S_HIPS, 'inOut'),
    ],
  ),
};

// the crossed press: sword and sheath crossed before him in an X and a hard shove forward
const press: ClipDef = {
  name: 'ik_press', dur: 0.62, fadeIn: 0.05, fadeOut: 0.2,
  events: { step: 0.14, hit: 0.24 },
  keys: mergeKeys(
    [ch(0, SG_IDLE), ch(0.14, grip([-0.08, 0.04, 0.24], [0.5, 0.72, 0.48], [-0.7, -0.5, -0.4]), 'inOut'), ch(0.26, grip([-0.07, 0.04, 0.5], [0.5, 0.72, 0.48], [-0.7, -0.5, -0.4]), 'outExpo'), ch(0.44, grip([-0.07, 0.04, 0.48], [0.5, 0.72, 0.48], [-0.7, -0.5, -0.4])), ch(0.62, SG_IDLE, 'inOut')],
    [
      offL(0),
      ch(0.14, gripL([0.08, 0.02, 0.24], [0.5, -0.72, -0.48], [0.7, -0.5, -0.4]), 'inOut'),
      ch(0.26, gripL([0.07, 0.02, 0.5], [0.5, -0.72, -0.48], [0.7, -0.5, -0.4]), 'outExpo'),
      ch(0.44, gripL([0.07, 0.02, 0.48], [0.5, -0.72, -0.48], [0.7, -0.5, -0.4])),
      offL(0.62, 'inOut'),
    ],
    [
      body(0, S_IDLE, S_HIPS),
      body(0.14, { ...S_IDLE, hips: [0, -6, 0], spine: [-4, 0, 0], chest: [-4, 0, 0] }, [0, -0.04, -0.04], 'inOut'),
      body(0.26, { ...S_IDLE, hips: [10, -4, 0], spine: [16, 0, 0], chest: [10, 0, 0], head: [-10, 0, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [50, 0, 0], 'thigh.R': [30, 0, -8], 'shin.R': [30, 0, 0] }, [0, -0.1, 0.2], 'outExpo'),
      body(0.44, { ...S_IDLE, hips: [8, -4, 0], spine: [14, 0, 0], chest: [8, 0, 0], head: [-8, 0, 0], 'thigh.L': [-46, 0, 6], 'shin.L': [46, 0, 0], 'thigh.R': [28, 0, -8], 'shin.R': [28, 0, 0] }, [0, -0.1, 0.18], 'out'),
      body(0.62, S_IDLE, S_HIPS, 'inOut'),
    ],
  ),
};

// the hand swap: a big wind-up with the right, the sword tossed across to the left, a cut from the left side
const swap: ClipDef = {
  name: 'ik_swap', dur: 0.72, fadeIn: 0.04, fadeOut: 0.2,
  events: { toss: 0.16, swap: 0.22, back: 0.6 },
  keys: mergeKeys(
    [ch(0, SG_IDLE), ch(0.14, grip([-0.4, 0.3, -0.1], [-0.3, 0.7, -0.6], [-0.6, 0, -0.8]), 'out'), ch(0.2, grip([-0.02, 0.0, 0.3], [0, 0.6, 0.8], [-0.6, -0.6, -0.4]), 'inOut'), ch(0.22, { '@ikR': [0, 0, 0] })],
    swingKeys({ hand: 'L', a: [0.8, 0.5, 0], b: [0, 0, 1], c: [0.06, 0.04, 0.12], r: 0.36, sense: 1, pole: [0.7, -0.4, -0.5], keys: [[0.2, 40, 'out'], [0.26, 20, 'out'], [0.38, 180, 'outExpo'], [0.6, 170, 'inOut']] }),
    [offL(0), offL(0.18), { t: 0.2, c: { '@ikL': [1, 0, 0] } }, { t: 0.62, c: { '@ikL': [1, 0, 0] } }, offL(0.72, 'inOut')],
    [
      body(0, S_IDLE, S_HIPS),
      body(0.14, { ...S_IDLE, hips: [0, -30, 0], spine: [0, -12, 0], chest: [-4, -18, 0], head: [-2, 24, 0] }, [0, -0.02, 0], 'out'),
      body(0.24, { ...S_IDLE, hips: [0, 10, 0], spine: [0, 4, 0], chest: [0, 6, 0], head: [-2, -6, 0], 'upperarm.R': [-20, 0, -20], 'forearm.R': [-60, 0, 0] }, S_HIPS, 'inOut'),
      body(0.38, { ...S_IDLE, hips: [6, -24, 0], spine: [10, -16, 0], chest: [8, -22, 0], head: [-8, 22, 0], 'upperarm.R': [10, 0, -30], 'forearm.R': [-40, 0, 0], 'thigh.L': [-36, 0, 6], 'shin.L': [34, 0, 0], 'thigh.R': [24, 0, -8], 'shin.R': [24, 0, 0] }, [0, -0.08, 0.1], 'outExpo'),
      body(0.72, S_IDLE, S_HIPS, 'inOut'),
    ],
  ),
};

// the headbutt: a grab, the head snapped down into the face
const butt: ClipDef = {
  name: 'ik_butt', dur: 0.62, fadeIn: 0.04, fadeOut: 0.2,
  events: { step: 0.1, hit: 0.26 },
  keys: mergeKeys(
    [ch(0, SG_IDLE)],
    [
      body(0, S_IDLE, S_HIPS),
      body(0.14, { ...S_IDLE, hips: [-6, 0, 0], spine: [-12, 0, 0], chest: [-12, 0, 0], neck: [-10, 0, 0], head: [-18, 0, 0], 'upperarm.L': [-70, -10, 20], 'forearm.L': [-40, 0, 0] }, [0, 0.01, -0.04], 'out'),
      body(0.26, { ...S_IDLE, hips: [16, 0, 0], spine: [24, 0, 0], chest: [16, 0, 0], neck: [12, 0, 0], head: [18, 0, 0], 'upperarm.L': [-80, -10, 20], 'forearm.L': [-30, 0, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [40, 0, 0], 'thigh.R': [24, 0, -8] }, [0, -0.06, 0.14], 'outExpo'),
      body(0.62, S_IDLE, S_HIPS, 'inOut'),
    ],
  ),
};

// the styptic: the pommel unscrewed, the paste smeared over his chest
const styptic: ClipDef = {
  name: 'ik_styptic', dur: 1.3, fadeIn: 0.08, fadeOut: 0.24,
  events: { open: 0.3, smear: 0.7 },
  keys: mergeKeys(
    [ch(0, SG_IDLE), ch(0.3, grip([-0.1, -0.12, 0.26], [0.7, 0.3, 0.65], [-0.6, -0.6, -0.4]), 'inOut'), ch(1.05, grip([-0.1, -0.12, 0.26], [0.7, 0.3, 0.65], [-0.6, -0.6, -0.4])), ch(1.3, SG_IDLE, 'inOut')],
    [
      body(0, S_IDLE, S_HIPS),
      body(0.3, { ...S_IDLE, spine: [6, 0, 0], chest: [6, 0, 0], head: [16, 0, 0], 'upperarm.L': [-50, -20, -10], 'forearm.L': [-80, 0, 0], 'hand.L': [0, 0, 20] }, S_HIPS, 'inOut'),
      body(0.7, { ...S_IDLE, spine: [4, 0, 0], chest: [4, 0, 0], head: [20, 0, 0], 'upperarm.L': [-30, 30, -20], 'forearm.L': [-110, 0, 0], 'hand.L': [20, 0, 0] }, S_HIPS, 'inOut'),
      body(1.0, { ...S_IDLE, spine: [2, 0, 0], head: [10, 0, 0], 'upperarm.L': [-26, 34, -24], 'forearm.L': [-116, 0, 0], 'hand.L': [24, 0, 0] }, S_HIPS, 'inOut'),
      body(1.3, S_IDLE, S_HIPS, 'inOut'),
    ],
  ),
};

// Tsuki-Tsuki no Mai: the lucky shuffle — knees up in turn, arms swinging up overhead, hips wagging
const dance: ClipDef = {
  name: 'ik_dance', dur: 1.6, fadeIn: 0.08, fadeOut: 0.24,
  events: { chant: 0.2, lucky: 1.4 },
  keys: mergeKeys(
    [ch(0, SG_IDLE), ch(0.2, grip([-0.36, 0.3, 0.06], [-0.3, 0.9, 0.2], [-0.6, -0.2, -0.75]), 'inOut'), ch(0.6, grip([-0.3, 0.1, 0.12], [-0.2, 0.6, 0.7], [-0.6, -0.4, -0.6]), 'inOut'), ch(1.0, grip([-0.36, 0.3, 0.06], [-0.3, 0.9, 0.2], [-0.6, -0.2, -0.75]), 'inOut'), ch(1.6, SG_IDLE, 'inOut')],
    [
      body(0, S_IDLE, S_HIPS),
      body(0.2, { ...S_IDLE, hips: [0, 0, 10], spine: [0, 0, -8], head: [0, 0, 10], 'thigh.L': [-70, 0, 6], 'shin.L': [90, 0, 0], 'thigh.R': [0, 0, -4], 'shin.R': [6, 0, 0], 'upperarm.L': [-150, 0, 30], 'forearm.L': [-20, 0, 0] }, [0, 0.02, 0], 'inOut'),
      body(0.4, { ...S_IDLE, hips: [0, 0, -10], spine: [0, 0, 8], head: [0, 0, -10], 'thigh.R': [-70, 0, -6], 'shin.R': [90, 0, 0], 'thigh.L': [0, 0, 4], 'shin.L': [6, 0, 0], 'upperarm.L': [-40, 0, 60], 'forearm.L': [-60, 0, 0] }, [0, 0.02, 0], 'inOut'),
      body(0.6, { ...S_IDLE, hips: [0, 0, 10], spine: [0, 0, -8], head: [0, 0, 10], 'thigh.L': [-70, 0, 6], 'shin.L': [90, 0, 0], 'thigh.R': [0, 0, -4], 'shin.R': [6, 0, 0], 'upperarm.L': [-150, 0, 30], 'forearm.L': [-20, 0, 0] }, [0, 0.02, 0], 'inOut'),
      body(0.8, { ...S_IDLE, hips: [0, 0, -10], spine: [0, 0, 8], head: [0, 0, -10], 'thigh.R': [-70, 0, -6], 'shin.R': [90, 0, 0], 'thigh.L': [0, 0, 4], 'shin.L': [6, 0, 0], 'upperarm.L': [-40, 0, 60], 'forearm.L': [-60, 0, 0] }, [0, 0.02, 0], 'inOut'),
      body(1.0, { ...S_IDLE, hips: [0, 0, 10], spine: [0, 0, -8], head: [0, 0, 10], 'thigh.L': [-70, 0, 6], 'shin.L': [90, 0, 0], 'thigh.R': [0, 0, -4], 'shin.R': [6, 0, 0], 'upperarm.L': [-150, 0, 30], 'forearm.L': [-20, 0, 0] }, [0, 0.02, 0], 'inOut'),
      body(1.3, { ...S_IDLE, hips: [-4, 0, 0], spine: [-8, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-170, 0, 20], 'forearm.L': [-10, 0, 0] }, S_HIPS, 'inOut'),
      body(1.6, S_IDLE, S_HIPS, 'inOut'),
    ],
  ),
};

// "Nobiro, Hōzukimaru": the sword held point up, its pommel slammed down into the mouth of the sheath in the left fist
// below — they fuse into the spear (the kit swaps the props at 'fuse'; the clip runs on into the Shikai stance)
const UPDIR: C3 = [0.04, 0.97, 0.24];
const nobiro: ClipDef = {
  name: 'ik_nobiro', dur: 1.0, fadeIn: 0.08, fadeOut: 0.24,
  events: { fuse: 0.42 },
  keys: mergeKeys(
    [
      ch(0, SG_IDLE),
      ch(0.3, grip([-0.03, 0.12, 0.3], UPDIR, [-0.6, -0.6, -0.4]), 'inOut'),
      ch(0.42, grip([-0.02, -0.02, 0.31], UPDIR, [-0.6, -0.6, -0.4]), 'outExpo'),
      ch(0.6, grip([-0.02, -0.02, 0.31], UPDIR, [-0.6, -0.6, -0.4])),
      ch(1.0, grip([-0.3, -0.28, 0.12], [-0.05, -0.55, 0.83], [-0.6, -0.3, -0.75]), 'inOut'),
    ],
    [
      offL(0),
      ch(0.3, gripL([0.0, -0.17, 0.3], UPDIR, [0.7, -0.5, -0.4]), 'inOut'),
      ch(0.42, gripL([0.0, -0.13, 0.31], UPDIR, [0.7, -0.5, -0.4]), 'outExpo'),
      ch(0.6, gripL([0.0, -0.14, 0.31], UPDIR, [0.7, -0.5, -0.4])),
      offL(0.82, 'inOut'),
    ],
    [
      body(0, S_IDLE, S_HIPS),
      body(0.3, { ...S_IDLE, hips: [0, -6, 0], spine: [-2, 0, 0], chest: [-4, 0, 0], head: [-4, 0, 0] }, S_HIPS, 'inOut'),
      body(0.42, { ...S_IDLE, hips: [4, -6, 0], spine: [6, 0, 0], chest: [4, 0, 0], head: [6, 0, 0] }, [0, -0.05, 0], 'outExpo'),
      body(0.6, { ...S_IDLE, hips: [4, -6, 0], spine: [6, 0, 0], chest: [4, 0, 0], head: [2, 0, 0] }, [0, -0.05, 0]),
      body(1.0, S_IDLE, S_HIPS, 'inOut'),
    ],
  ),
};

export const IKKAKU_CLIPS: ClipDef[] = [s1, s2, s3, s4, press, swap, butt, styptic, dance, nobiro, ...SHARED];
export const IKKAKU_CHAIN = ['ik_s1', 'ik_s2', 'ik_s3', 'ik_s4'];

// ================================================================== Shikai: the spear

const K_IDLE: B = {
  hips: [2, -20, 0], spine: [4, 8, 0], chest: [2, 10, 0], neck: [0, 0, 0], head: [-4, -6, 4],
  'thigh.L': [-16, 0, 6], 'shin.L': [22, 0, 0], 'foot.L': [-6, 0, 0], 'thigh.R': [10, 0, -8], 'shin.R': [20, 0, 0], 'foot.R': [-10, 0, 0],
  'upperarm.L': [-10, 0, 14], 'forearm.L': [-30, 0, 0], 'hand.L': [0, 0, 6],
};
const KG = { p: [-0.3, -0.28, 0.12] as C3, dir: [-0.04, -0.55, 0.83] as C3, edge: [0, -0.83, -0.55] as C3, pole: [-0.6, -0.3, -0.75] as C3 };
const KG_IDLE = grip(KG.p, KG.dir, KG.pole);

/** The spear in his right hand, point low ahead, the tassel up behind his shoulder. */
export const HOZUKIMARU_STANCE: StanceDef = {
  idle: K_IDLE,
  idleHips: -0.04,
  run: { 'upperarm.L': [-20, 0, 14], 'forearm.L': [-40, 0, 0] },
  sprint: { 'upperarm.L': [14, 0, 14], 'forearm.L': [-40, 0, 0] },
  swingL: 0.6,
  swingR: 0.15,
  grip: {
    idle: KG,
    walk: KG,
    run: { p: [-0.3, -0.2, 0.0], dir: [-0.05, -0.2, 0.98], edge: [0, -0.98, -0.2], pole: [-0.7, -0.3, -0.6] },
    sprint: { p: [-0.3, -0.12, -0.1], dir: [-0.05, 0.1, 0.99], edge: [0, -0.99, 0.1], pole: [-0.7, -0.3, -0.6] },
    air: { p: [-0.34, -0.1, 0.1], dir: [-0.2, -0.3, 0.93], edge: [0, -0.95, -0.3], pole: [-0.6, -0.4, -0.6] },
  },
};

const SP_BACK = grip([-0.22, -0.16, -0.3], [0.02, -0.12, 0.99], [-0.7, -0.5, -0.3]);
const SP_OUT = grip([-0.12, -0.12, 0.56], [0, -0.24, 0.97], [-0.6, -0.6, 0]);

// the thrust: both hands on the shaft, drawn back and driven out
const k1: ClipDef = {
  name: 'ik_k1', dur: 0.5, fadeIn: 0.04, fadeOut: 0.18,
  events: { step: 0.08, combo: 0.3 },
  keys: mergeKeys(
    [ch(0, KG_IDLE), ch(0.1, SP_BACK, 'inOut'), ch(0.2, SP_OUT, 'outExpo'), ch(0.32, SP_OUT), ch(0.5, KG_IDLE, 'inOut')],
    [two(0, 0), two(0.08, 1, 'out'), two(0.36, 1), two(0.5, 0, 'inOut')],
    [
      body(0, K_IDLE),
      body(0.1, { ...K_IDLE, hips: [0, -30, 0], spine: [-4, -10, 0], chest: [-4, -14, 0], head: [2, 24, 0] }, [0, -0.02, -0.06], 'inOut'),
      body(0.2, { ...K_IDLE, hips: [8, 10, 0], spine: [12, 8, 0], chest: [8, 10, 0], head: [-10, -14, 0], 'thigh.L': [-48, 0, 6], 'shin.L': [50, 0, 0], 'thigh.R': [28, 0, -8], 'shin.R': [30, 0, 0] }, [0, -0.12, 0.18], 'outExpo'),
      body(0.32, { ...K_IDLE, hips: [6, 8, 0], spine: [10, 6, 0], chest: [6, 8, 0], head: [-8, -12, 0], 'thigh.L': [-44, 0, 6], 'shin.L': [46, 0, 0], 'thigh.R': [26, 0, -8], 'shin.R': [28, 0, 0] }, [0, -0.11, 0.16], 'out'),
      body(0.5, K_IDLE, undefined, 'inOut'),
    ],
  ),
};

// the tassel end: the spear spun in his hands and the butt jabbed straight back into him
const SP_REV_BACK = grip([-0.1, -0.12, -0.12], [0.02, 0.22, -0.97], [-0.7, -0.5, -0.3]);
const SP_REV_OUT = grip([-0.1, -0.14, 0.44], [0, 0.24, -0.97], [-0.6, -0.6, 0]);
const k2: ClipDef = {
  name: 'ik_k2', dur: 0.5, fadeIn: 0.04, fadeOut: 0.18,
  events: { step: 0.06, combo: 0.3 },
  keys: mergeKeys(
    [ch(0, SP_OUT), ch(0.1, SP_REV_BACK, 'inOut'), ch(0.2, SP_REV_OUT, 'outExpo'), ch(0.32, SP_REV_OUT), ch(0.5, KG_IDLE, 'inOut')],
    [two(0, 1), two(0.36, 1), two(0.5, 0, 'inOut')],
    [
      body(0, { ...K_IDLE, hips: [6, 8, 0], spine: [10, 6, 0] }),
      body(0.1, { ...K_IDLE, spine: [-4, -6, 0], chest: [-2, -6, 0] }, undefined, 'inOut'),
      body(0.2, { ...K_IDLE, hips: [6, 12, 0], spine: [14, 10, 0], chest: [8, 10, 0], head: [-12, -14, 0], 'thigh.L': [-44, 0, 6], 'shin.L': [46, 0, 0], 'thigh.R': [26, 0, -8], 'shin.R': [28, 0, 0] }, [0, -0.1, 0.16], 'outExpo'),
      body(0.5, K_IDLE, undefined, 'inOut'),
    ],
  ),
};

// the sweep: the head swept level across in front of him, right to left
const k3: ClipDef = {
  name: 'ik_k3', dur: 0.56, fadeIn: 0.04, fadeOut: 0.2,
  events: { step: 0.06, combo: 0.34 },
  keys: mergeKeys(
    swingKeys({ a: [-1, -0.15, 0], b: [0, -0.2, 1], c: [-0.06, -0.04, 0.12], r: 0.26, pole: [-0.7, -0.4, -0.5], keys: [[0, 40, 'out'], [0.1, -20, 'out'], [0.24, 175, 'outExpo'], [0.56, 150, 'inOut']] }),
    [two(0, 0), two(0.08, 1, 'out'), two(0.4, 1), two(0.56, 0, 'inOut')],
    [
      body(0, K_IDLE),
      body(0.1, { ...K_IDLE, hips: [0, -34, 0], spine: [2, -12, 0], chest: [0, -16, 0], head: [-4, 24, 0] }, [0, -0.04, 0], 'out'),
      body(0.24, { ...K_IDLE, hips: [6, 26, 0], spine: [10, 14, 0], chest: [8, 22, 0], head: [-6, -22, 0], 'thigh.L': [-34, 0, 6], 'shin.L': [30, 0, 0], 'thigh.R': [22, 0, -8], 'shin.R': [22, 0, 0] }, [0, -0.08, 0.08], 'outExpo'),
      body(0.56, K_IDLE, undefined, 'inOut'),
    ],
  ),
};

// a full turn on the spot and the thrust out of it
const k4: ClipDef = {
  name: 'ik_k4', dur: 0.72, fadeIn: 0.04, fadeOut: 0.22,
  events: { step: 0.36, combo: 0.5 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@spin': [0, 0, 0] } },
      { t: 0.06, ease: 'out', c: { '@spin': [-20, 0, 0] } },
      { t: 0.34, ease: 'inOut', c: { '@spin': [360, 0, 0] } },
      { t: 0.35, ease: 'hold', c: { '@spin': [0, 0, 0] } },
    ],
    [ch(0, KG_IDLE), ch(0.2, grip([-0.36, -0.1, 0.0], [-0.9, -0.1, 0.4], [-0.5, -0.5, -0.6]), 'inOut'), ch(0.34, SP_BACK, 'inOut'), ch(0.44, SP_OUT, 'outExpo'), ch(0.56, SP_OUT), ch(0.72, KG_IDLE, 'inOut')],
    [two(0, 0), two(0.32, 1, 'out'), two(0.58, 1), two(0.72, 0, 'inOut')],
    [
      body(0, K_IDLE),
      body(0.2, { ...K_IDLE, hips: [4, 0, -10], spine: [6, 0, -6], 'upperarm.L': [-30, 0, 60] }, [0, -0.02, 0], 'inOut'),
      body(0.34, { ...K_IDLE, hips: [0, -26, 0], spine: [-4, -10, 0], chest: [-4, -14, 0], head: [2, 22, 0] }, [0, -0.02, -0.06], 'inOut'),
      body(0.44, { ...K_IDLE, hips: [8, 10, 0], spine: [14, 8, 0], chest: [8, 10, 0], head: [-12, -14, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [52, 0, 0], 'thigh.R': [30, 0, -8], 'shin.R': [32, 0, 0] }, [0, -0.13, 0.2], 'outExpo'),
      body(0.56, { ...K_IDLE, hips: [6, 8, 0], spine: [12, 6, 0], chest: [6, 8, 0], head: [-10, -12, 0], 'thigh.L': [-46, 0, 6], 'shin.L': [48, 0, 0], 'thigh.R': [28, 0, -8], 'shin.R': [30, 0, 0] }, [0, -0.12, 0.18], 'out'),
      body(0.72, K_IDLE, undefined, 'inOut'),
    ],
  ),
};

// the overhead smash: the spear raised in both hands and brought down to crack the ground
const smash: ClipDef = {
  name: 'ik_smash', dur: 0.86, fadeIn: 0.06, fadeOut: 0.24,
  events: { step: 0.3, hit: 0.42 },
  keys: mergeKeys(
    swingKeys({ a: [0, 1, 0], b: [0, 0, 1], c: [-0.06, 0.12, 0.1], r: 0.32, tilt: 0.05, pole: [-0.6, -0.2, -0.75], keys: [[0, 140, 'out'], [0.3, -30, 'inOut'], [0.42, 130, 'outExpo'], [0.62, 135, 'out'], [0.86, 150, 'inOut']] }),
    [two(0, 0), two(0.2, 1, 'inOut'), two(0.66, 1), two(0.86, 0, 'inOut')],
    [
      body(0, K_IDLE),
      body(0.3, { ...K_IDLE, hips: [-6, -6, 0], spine: [-16, 0, 0], chest: [-14, 0, 0], head: [-10, 0, 0], 'thigh.L': [-10, 0, 6], 'shin.L': [14, 0, 0] }, [0, 0.03, -0.05], 'inOut'),
      body(0.42, { ...K_IDLE, hips: [16, 0, 0], spine: [26, 0, 0], chest: [18, 0, 0], head: [-16, 0, 0], 'thigh.L': [-56, 0, 6], 'shin.L': [62, 0, 0], 'thigh.R': [32, 0, -8], 'shin.R': [42, 0, 0] }, [0, -0.22, 0.18], 'outExpo'),
      body(0.62, { ...K_IDLE, hips: [14, 0, 0], spine: [24, 0, 0], chest: [16, 0, 0], head: [-14, 0, 0], 'thigh.L': [-54, 0, 6], 'shin.L': [60, 0, 0], 'thigh.R': [30, 0, -8], 'shin.R': [40, 0, 0] }, [0, -0.21, 0.17], 'out'),
      body(0.86, K_IDLE, undefined, 'inOut'),
    ],
  ),
};

// "Sakero": a thrust that is met, then the wrist snapped up — the head section whips over the guard (the kit flies it)
const sakero: ClipDef = {
  name: 'ik_sakero', dur: 0.95, fadeIn: 0.05, fadeOut: 0.24,
  events: { split: 0.2, rejoin: 0.78 },
  keys: mergeKeys(
    [ch(0, KG_IDLE), ch(0.14, SP_OUT, 'outExpo'), ch(0.3, grip([-0.14, 0.16, 0.36], [0.05, 0.75, 0.66], [-0.6, -0.5, -0.6]), 'outExpo'), ch(0.7, grip([-0.14, 0.12, 0.34], [0.05, 0.7, 0.7], [-0.6, -0.5, -0.6])), ch(0.95, KG_IDLE, 'inOut')],
    [two(0, 0), two(0.1, 1, 'out'), two(0.75, 1), two(0.95, 0, 'inOut')],
    [
      body(0, K_IDLE),
      body(0.14, { ...K_IDLE, hips: [8, 10, 0], spine: [12, 8, 0], chest: [8, 10, 0], head: [-10, -14, 0], 'thigh.L': [-44, 0, 6], 'shin.L': [46, 0, 0], 'thigh.R': [26, 0, -8], 'shin.R': [28, 0, 0] }, [0, -0.1, 0.16], 'outExpo'),
      body(0.3, { ...K_IDLE, hips: [0, 4, 0], spine: [-4, 4, 0], chest: [-8, 6, 0], head: [-14, -6, 0], 'thigh.L': [-34, 0, 6], 'shin.L': [34, 0, 0], 'thigh.R': [20, 0, -8], 'shin.R': [24, 0, 0] }, [0, -0.06, 0.1], 'outExpo'),
      body(0.7, { ...K_IDLE, hips: [0, 4, 0], spine: [-2, 4, 0], chest: [-6, 6, 0], head: [-12, -6, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [30, 0, 0], 'thigh.R': [18, 0, -8], 'shin.R': [22, 0, 0] }, [0, -0.05, 0.08], 'inOut'),
      body(0.95, K_IDLE, undefined, 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.6, 0, 0] } }],
  ),
};

// the hurled segment: the spear swung round and the head section flung out on its chain (held while it flies)
const hurl: ClipDef = {
  name: 'ik_hurl', dur: 0.5, fadeIn: 0.05, fadeOut: 0.2,
  events: { throw: 0.2 },
  keys: mergeKeys(
    [ch(0, KG_IDLE), ch(0.12, grip([-0.36, 0.2, -0.2], [-0.4, 0.6, -0.7], [-0.6, 0, -0.8]), 'out'), ch(0.22, grip([-0.2, 0.08, 0.46], [0.02, 0.1, 1], [-0.6, -0.5, -0.3]), 'outExpo'), ch(0.5, grip([-0.2, 0.06, 0.44], [0.02, 0.06, 1], [-0.6, -0.5, -0.3]))],
    [
      body(0, K_IDLE),
      body(0.12, { ...K_IDLE, hips: [0, -30, 0], spine: [-4, -12, 0], chest: [-6, -18, 0], head: [-2, 24, 0], 'upperarm.L': [-60, 0, 30] }, [0, -0.02, -0.04], 'out'),
      body(0.22, { ...K_IDLE, hips: [8, 16, 0], spine: [12, 10, 0], chest: [8, 14, 0], head: [-8, -18, 0], 'thigh.L': [-44, 0, 6], 'shin.L': [44, 0, 0], 'thigh.R': [26, 0, -8], 'shin.R': [28, 0, 0], 'upperarm.L': [20, 0, 40] }, [0, -0.1, 0.14], 'outExpo'),
      body(0.5, { ...K_IDLE, hips: [6, 14, 0], spine: [10, 8, 0], chest: [6, 12, 0], head: [-6, -16, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [40, 0, 0], 'thigh.R': [24, 0, -8], 'shin.R': [26, 0, 0], 'upperarm.L': [20, 0, 40] }, [0, -0.09, 0.12]),
    ],
  ),
};

// "Bankai — Ryūmon Hōzukimaru": the pieces slammed together overhead, the reiatsu tornado (the kit swaps the props)
const bankai: ClipDef = {
  name: 'ik_bankai', dur: 1.5, fadeIn: 0.1, fadeOut: 0.3,
  events: { raise: 0.3, slam: 0.6, form: 1.0 },
  keys: mergeKeys(
    [ch(0, KG_IDLE), ch(0.4, grip([-0.1, 0.5, 0.1], [0.05, 0.98, 0.1], [-0.6, -0.2, -0.75], [0, 0, -1]), 'inOut'), ch(0.62, grip([-0.06, 0.42, 0.14], [0.02, 0.99, 0.05], [-0.6, -0.2, -0.75], [0, 0, -1]), 'outExpo'), ch(1.0, grip([-0.06, 0.42, 0.14], [0.02, 0.99, 0.05], [-0.6, -0.2, -0.75], [0, 0, -1]))],
    [two(0, 0), two(0.4, 1, 'inOut'), two(1.1, 1), two(1.5, 0, 'inOut')],
    [
      body(0, K_IDLE),
      body(0.4, { ...K_IDLE, hips: [-4, 0, 0], spine: [-10, 0, 0], chest: [-10, 0, 0], head: [-14, 0, 0] }, [0, 0.02, 0], 'inOut'),
      body(0.62, { ...K_IDLE, hips: [4, 0, 0], spine: [-4, 0, 0], chest: [-8, 0, 0], head: [-16, 0, 0], 'thigh.L': [-20, 0, 10], 'shin.L': [24, 0, 0], 'thigh.R': [-16, 0, -10], 'shin.R': [22, 0, 0] }, [0, -0.06, 0], 'outExpo'),
      body(1.1, { ...K_IDLE, hips: [4, 0, 0], spine: [-4, 0, 0], chest: [-8, 0, 0], head: [-16, 0, 0], 'thigh.L': [-20, 0, 10], 'shin.L': [24, 0, 0], 'thigh.R': [-16, 0, -10], 'shin.R': [22, 0, 0] }, [0, -0.06, 0]),
      body(1.5, K_IDLE, undefined, 'inOut'),
    ],
  ),
};

// nobiro runs on through the form swap at 'fuse', so the Shikai set carries it too (and the Bankai set the call)
export const HOZUKIMARU_CLIPS: ClipDef[] = [k1, k2, k3, k4, smash, sakero, hurl, styptic, dance, bankai, nobiro, ...SHARED];
export const HOZUKIMARU_CHAIN = ['ik_k1', 'ik_k2', 'ik_k3', 'ik_k4'];

// ================================================================== Bankai: Ryūmon Hōzukimaru

const B_IDLE: B = {
  hips: [2, -10, 0], spine: [6, 4, 0], chest: [4, 6, 0], neck: [0, 0, 0], head: [-6, -4, 0],
  'thigh.L': [-16, 0, 8], 'shin.L': [24, 0, 0], 'foot.L': [-6, 0, 0], 'thigh.R': [10, 0, -10], 'shin.R': [22, 0, 0], 'foot.R': [-10, 0, 0],
  // the spade upright in his left fist, out to the side
  'upperarm.L': [4, 0, 30], 'forearm.L': [-76, 0, 0], 'hand.L': [0, 0, -10],
};
const BG = { p: [-0.42, -0.2, 0.1] as C3, dir: [-0.2, 0.9, 0.38] as C3, edge: [0, 0.38, -0.92] as C3, pole: [-0.7, -0.4, -0.5] as C3 };
const BG_IDLE = grip(BG.p, BG.dir, BG.pole, [0, 0, -1]);
/** the spade in the left hand, upright out at his side */
const SPADE_UP = grip([0.42, -0.2, 0.1], [0.2, 0.9, 0.38], [0.7, -0.4, -0.5], [0, 0, -1], 'L');

/** Ryūmon Hōzukimaru: the guandao upright in his right hand, the spade in his left, the centre blade behind him. */
export const RYUMON_STANCE: StanceDef = {
  idle: B_IDLE,
  idleHips: -0.03,
  run: { 'upperarm.L': [0, 0, 30], 'forearm.L': [-80, 0, 0], spine: [8, 0, 0] },
  sprint: { 'upperarm.L': [20, 0, 30], 'forearm.L': [-80, 0, 0], spine: [16, 0, 0] },
  swingL: 0.1,
  swingR: 0.1,
  freqScale: 0.95,
  grip: {
    idle: BG,
    walk: BG,
    run: { p: [-0.4, -0.16, 0.0], dir: [-0.2, 0.6, 0.77], edge: [0, 0.79, -0.6], pole: [-0.7, -0.4, -0.5] },
    sprint: { p: [-0.36, -0.1, -0.06], dir: [-0.15, 0.25, 0.96], edge: [0, 0.97, -0.25], pole: [-0.7, -0.4, -0.5] },
    air: BG,
  },
};

const bodyB = (t: number, over: B, hips?: C3, ease?: KeyDef['ease']) => body(t, { ...B_IDLE, ...over }, hips, ease);

// the guandao, high right down across to low left
const b1: ClipDef = {
  name: 'ik_b1', dur: 0.62, fadeIn: 0.05, fadeOut: 0.2,
  events: { step: 0.12, combo: 0.38 },
  keys: mergeKeys(
    swingKeys({ a: [-0.7, 0.7, 0], b: [0, 0, 1], c: [-0.04, 0.06, 0.1], r: 0.3, pole: [-0.7, -0.4, -0.5], keys: [[0, 60, 'out'], [0.14, -20, 'out'], [0.28, 175, 'outExpo'], [0.62, 160, 'inOut']] }),
    [ch(0, SPADE_UP)],
    [
      bodyB(0, {}),
      bodyB(0.14, { hips: [0, -34, 0], spine: [2, -10, 0], chest: [0, -16, 0], head: [-4, 22, 0] }, [0, -0.04, 0], 'out'),
      bodyB(0.28, { hips: [8, 22, 0], spine: [12, 14, 0], chest: [10, 20, 0], head: [-8, -20, 0], 'thigh.L': [-40, 0, 8], 'shin.L': [40, 0, 0], 'thigh.R': [26, 0, -10], 'shin.R': [28, 0, 0] }, [0, -0.12, 0.12], 'outExpo'),
      bodyB(0.62, {}, undefined, 'inOut'),
    ],
  ),
};

// the spade, swung level from his left across to his right
const b2: ClipDef = {
  name: 'ik_b2', dur: 0.62, fadeIn: 0.04, fadeOut: 0.2,
  events: { step: 0.1, combo: 0.38 },
  keys: mergeKeys(
    swingKeys({ hand: 'L', a: [1, -0.1, 0], b: [0, -0.1, 1], c: [0.06, 0.0, 0.1], r: 0.32, sense: -1, pole: [0.7, -0.4, -0.5], keys: [[0, 70, 'out'], [0.14, 180, 'out'], [0.28, 0, 'outExpo'], [0.62, 20, 'inOut']] }),
    [ch(0, BG_IDLE)],
    [
      bodyB(0, {}),
      bodyB(0.14, { hips: [0, 30, 0], spine: [2, 12, 0], chest: [0, 18, 0], head: [-4, -24, 0] }, [0, -0.04, 0], 'out'),
      bodyB(0.28, { hips: [8, -24, 0], spine: [12, -16, 0], chest: [10, -22, 0], head: [-8, 22, 0], 'thigh.L': [-40, 0, 8], 'shin.L': [40, 0, 0], 'thigh.R': [26, 0, -10], 'shin.R': [28, 0, 0] }, [0, -0.12, 0.12], 'outExpo'),
      bodyB(0.62, {}, undefined, 'inOut'),
    ],
  ),
};

// the guandao rising, low left up to high right
const b3: ClipDef = {
  name: 'ik_b3', dur: 0.62, fadeIn: 0.04, fadeOut: 0.2,
  events: { step: 0.1, combo: 0.38 },
  keys: mergeKeys(
    swingKeys({ a: [-0.7, -0.7, 0], b: [0, 0, 1], c: [-0.04, 0.04, 0.1], r: 0.3, sense: -1, pole: [-0.7, -0.5, -0.4], keys: [[0, 90, 'out'], [0.14, 200, 'out'], [0.28, -10, 'outExpo'], [0.62, 10, 'inOut']] }),
    [ch(0, SPADE_UP)],
    [
      bodyB(0, {}),
      bodyB(0.14, { hips: [6, 20, 0], spine: [10, 12, 0], chest: [8, 16, 0], head: [-6, -20, 0], 'thigh.L': [-30, 0, 8], 'shin.L': [40, 0, 0] }, [0, -0.08, 0], 'out'),
      bodyB(0.28, { hips: [-4, -26, 0], spine: [-8, -12, 0], chest: [-10, -18, 0], head: [-10, 20, 0], 'thigh.L': [-34, 0, 8], 'shin.L': [30, 0, 0], 'thigh.R': [20, 0, -10], 'shin.R': [20, 0, 0] }, [0, -0.02, 0.1], 'outExpo'),
      bodyB(0.62, {}, undefined, 'inOut'),
    ],
  ),
};

// both blades raised and crashed down together, crossing in front of him
const X_UP_R = grip([-0.34, 0.5, -0.04], [0.2, 0.7, -0.68], [-0.6, -0.2, -0.75], [0, 0, 1]);
const X_UP_L = grip([0.34, 0.5, -0.04], [-0.2, 0.7, -0.68], [0.6, -0.2, -0.75], [0, 0, 1], 'L');
// (chest space: the bow of the body — about 33° at the hit — tips them on down to some 27° below level, the heads
// coming down on a man two metres off)
const X_DN_R = grip([-0.16, -0.04, 0.44], [0.3, 0.1, 0.95], [-0.6, -0.6, 0], [0, 0, 1]);
const X_DN_L = grip([0.16, -0.04, 0.44], [-0.3, 0.1, 0.95], [0.6, -0.6, 0], [0, 0, 1], 'L');
const xKeys = (t0: number, tUp: number, tDn: number, tEnd: number, down: KeyDef['ease'] = 'outExpo'): KeyDef[] => [
  ch(t0, { ...BG_IDLE, ...SPADE_UP }), ch(tUp, { ...X_UP_R, ...X_UP_L }, 'inOut'), ch(tDn, { ...X_DN_R, ...X_DN_L }, down), ch(tDn + 0.18, { ...X_DN_R, ...X_DN_L }), ch(tEnd, { ...BG_IDLE, ...SPADE_UP }, 'inOut'),
];
const b4: ClipDef = {
  name: 'ik_b4', dur: 0.8, fadeIn: 0.05, fadeOut: 0.22,
  events: { step: 0.26, hit: 0.36, combo: 0.52 },
  keys: mergeKeys(
    xKeys(0, 0.24, 0.36, 0.8),
    [
      bodyB(0, {}),
      bodyB(0.24, { hips: [-6, 0, 0], spine: [-16, 0, 0], chest: [-12, 0, 0], head: [-12, 0, 0] }, [0, 0.03, -0.05], 'inOut'),
      bodyB(0.36, { hips: [9, 0, 0], spine: [14, 0, 0], chest: [10, 0, 0], head: [-10, 0, 0], 'thigh.L': [-50, 0, 8], 'shin.L': [56, 0, 0], 'thigh.R': [28, 0, -10], 'shin.R': [36, 0, 0] }, [0, -0.18, 0.16], 'outExpo'),
      bodyB(0.54, { hips: [8, 0, 0], spine: [13, 0, 0], chest: [9, 0, 0], head: [-9, 0, 0], 'thigh.L': [-48, 0, 8], 'shin.L': [54, 0, 0], 'thigh.R': [26, 0, -10], 'shin.R': [34, 0, 0] }, [0, -0.17, 0.15], 'out'),
      bodyB(0.8, {}, undefined, 'inOut'),
    ],
  ),
};

// the X crash: a leap, both blades over his head, and the crash
const xcrash: ClipDef = {
  name: 'ik_xcrash', dur: 1.0, fadeIn: 0.06, fadeOut: 0.26,
  events: { jump: 0.16, hit: 0.5, crash: 0.52 },
  keys: mergeKeys(
    // the blades come down with him, into the landing
    xKeys(0, 0.34, 0.5, 1.0, 'inExpo'),
    [
      bodyB(0, {}),
      bodyB(0.16, { hips: [10, 0, 0], spine: [10, 0, 0], 'thigh.L': [-60, 0, 8], 'shin.L': [90, 0, 0], 'thigh.R': [-50, 0, -10], 'shin.R': [80, 0, 0] }, [0, -0.2, 0], 'inOut'),
      bodyB(0.34, { hips: [-10, 0, 0], spine: [-18, 0, 0], chest: [-14, 0, 0], head: [-14, 0, 0], 'thigh.L': [-50, 0, 8], 'shin.L': [80, 0, 0], 'thigh.R': [-30, 0, -10], 'shin.R': [70, 0, 0] }, [0, 0.4, 0.1], 'out'),
      bodyB(0.5, { hips: [10, 0, 0], spine: [15, 0, 0], chest: [10, 0, 0], head: [-10, 0, 0], 'thigh.L': [-54, 0, 8], 'shin.L': [68, 0, 0], 'thigh.R': [30, 0, -10], 'shin.R': [48, 0, 0] }, [0, -0.22, 0.2], 'inExpo'),
      bodyB(0.74, { hips: [9, 0, 0], spine: [14, 0, 0], chest: [9, 0, 0], head: [-9, 0, 0], 'thigh.L': [-52, 0, 8], 'shin.L': [64, 0, 0], 'thigh.R': [30, 0, -10], 'shin.R': [46, 0, 0] }, [0, -0.21, 0.19], 'out'),
      bodyB(1.0, {}, undefined, 'inOut'),
    ],
  ),
};

// the Ryūmon spin: both hands on the centre handle at his chest, the whole rig whirled round (looped; the kit flies the blades)
const SPIN_R = grip([-0.12, 0.0, 0.36], [1, 0, 0.05], [-0.6, -0.6, -0.4], [0, -1, 0]);
const SPIN_L = grip([0.12, 0.0, 0.36], [-1, 0, 0.05], [0.6, -0.6, -0.4], [0, -1, 0], 'L');
const spin: ClipDef = {
  name: 'ik_spin', dur: 0.5, loop: true, fadeIn: 0.1, fadeOut: 0.2,
  keys: mergeKeys(
    [{ t: 0, c: { '@spin': [0, 0, 0] } }, { t: 0.5, ease: 'linear', c: { '@spin': [360, 0, 0] } }],
    [ch(0, { ...SPIN_R, ...SPIN_L }), ch(0.5, { ...SPIN_R, ...SPIN_L })],
    [bodyB(0, { hips: [4, 0, 0], spine: [-6, 0, 0], chest: [-6, 0, 0], head: [-4, 0, 0], 'thigh.L': [-20, 0, 12], 'shin.L': [30, 0, 0], 'thigh.R': [-10, 0, -12], 'shin.R': [24, 0, 0] }, [0, -0.08, 0]), bodyB(0.5, { hips: [4, 0, 0], spine: [-6, 0, 0], chest: [-6, 0, 0], head: [-4, 0, 0], 'thigh.L': [-20, 0, 12], 'shin.L': [30, 0, 0], 'thigh.R': [-10, 0, -12], 'shin.R': [24, 0, 0] }, [0, -0.08, 0])],
  ),
  tension: 0,
};

// the spade flung out on its chain from the left hand (held while it flies)
const fling: ClipDef = {
  name: 'ik_fling', dur: 0.5, fadeIn: 0.05, fadeOut: 0.2,
  events: { throw: 0.18 },
  keys: mergeKeys(
    [ch(0, { ...BG_IDLE, ...SPADE_UP }), ch(0.1, { ...BG_IDLE, ...grip([0.4, 0.3, -0.24], [0.3, 0.6, -0.74], [0.6, 0, -0.8], [0, 0, 1], 'L') }, 'out'), ch(0.2, { ...BG_IDLE, ...grip([0.2, 0.06, 0.5], [0.0, 0.1, 1], [0.6, -0.5, -0.3], [0, 1, 0], 'L') }, 'outExpo'), ch(0.5, { ...BG_IDLE, ...grip([0.2, 0.04, 0.48], [0.0, 0.06, 1], [0.6, -0.5, -0.3], [0, 1, 0], 'L') })],
    [
      bodyB(0, {}),
      bodyB(0.1, { hips: [0, 30, 0], spine: [-4, 12, 0], chest: [-6, 18, 0], head: [-2, -24, 0] }, [0, -0.02, -0.04], 'out'),
      bodyB(0.2, { hips: [8, -20, 0], spine: [12, -12, 0], chest: [8, -16, 0], head: [-8, 18, 0], 'thigh.L': [-44, 0, 8], 'shin.L': [44, 0, 0], 'thigh.R': [26, 0, -10], 'shin.R': [28, 0, 0] }, [0, -0.1, 0.14], 'outExpo'),
      bodyB(0.5, { hips: [6, -18, 0], spine: [10, -10, 0], chest: [6, -14, 0], head: [-6, 16, 0], 'thigh.L': [-40, 0, 8], 'shin.L': [40, 0, 0], 'thigh.R': [24, 0, -10], 'shin.R': [26, 0, 0] }, [0, -0.09, 0.12]),
    ],
  ),
};

// the reiatsu explosion: the centre blade raised and spun overhead in both hands, then slammed into the ground
const UP_R = grip([-0.12, 0.62, 0.06], [1, 0, 0.05], [-0.6, -0.2, -0.75], [0, 0, -1]);
const UP_L = grip([0.12, 0.62, 0.06], [-1, 0, 0.05], [0.6, -0.2, -0.75], [0, 0, -1], 'L');
const DN_R = grip([-0.12, -0.3, 0.5], [1, 0, 0.05], [-0.6, -0.6, -0.4], [0, -1, 0]);
const DN_L = grip([0.12, -0.3, 0.5], [-1, 0, 0.05], [0.6, -0.6, -0.4], [0, -1, 0], 'L');
const explode: ClipDef = {
  name: 'ik_explode', dur: 1.6, fadeIn: 0.1, fadeOut: 0.3,
  events: { raise: 0.2, slam: 1.0 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@spin': [0, 0, 0] } },
      { t: 0.3, c: { '@spin': [0, 0, 0] } },
      { t: 0.86, ease: 'inOut', c: { '@spin': [720, 0, 0] } },
      { t: 0.87, ease: 'hold', c: { '@spin': [0, 0, 0] } },
    ],
    [ch(0, { ...BG_IDLE, ...SPADE_UP }), ch(0.3, { ...UP_R, ...UP_L }, 'inOut'), ch(0.86, { ...UP_R, ...UP_L }), ch(1.0, { ...DN_R, ...DN_L }, 'inExpo'), ch(1.3, { ...DN_R, ...DN_L }), ch(1.6, { ...BG_IDLE, ...SPADE_UP }, 'inOut')],
    [
      bodyB(0, {}),
      bodyB(0.3, { hips: [-4, 0, 0], spine: [-10, 0, 0], chest: [-10, 0, 0], head: [-16, 0, 0] }, [0, 0.02, 0], 'inOut'),
      bodyB(0.86, { hips: [-4, 0, 0], spine: [-10, 0, 0], chest: [-10, 0, 0], head: [-16, 0, 0] }, [0, 0.02, 0]),
      bodyB(1.0, { hips: [16, 0, 0], spine: [28, 0, 0], chest: [20, 0, 0], head: [-16, 0, 0], 'thigh.L': [-56, 0, 8], 'shin.L': [66, 0, 0], 'thigh.R': [30, 0, -10], 'shin.R': [46, 0, 0] }, [0, -0.26, 0.18], 'inExpo'),
      bodyB(1.3, { hips: [14, 0, 0], spine: [26, 0, 0], chest: [18, 0, 0], head: [-14, 0, 0], 'thigh.L': [-54, 0, 8], 'shin.L': [64, 0, 0], 'thigh.R': [28, 0, -10], 'shin.R': [44, 0, 0] }, [0, -0.25, 0.17]),
      bodyB(1.6, {}, undefined, 'inOut'),
    ],
  ),
};

// "Wake up, Hōzukimaru!": braced low, both blades crossed down before him, chin up — daring the blow (the kit counters)
const WAKE_R = grip([-0.2, -0.18, 0.34], [0.5, -0.42, 0.76], [-0.6, -0.6, 0], [0, 0, 1]);
const WAKE_L = grip([0.2, -0.18, 0.34], [-0.5, -0.42, 0.76], [0.6, -0.6, 0], [0, 0, 1], 'L');
const WAKE_BODY: B = { hips: [-4, 0, 0], spine: [-8, 0, 0], chest: [-6, 0, 0], head: [-16, 0, 0], 'thigh.L': [-30, 0, 16], 'shin.L': [42, 0, 0], 'thigh.R': [-24, 0, -16], 'shin.R': [40, 0, 0] };
const wake: ClipDef = {
  name: 'ik_wake', dur: 0.9, fadeIn: 0.06, fadeOut: 0.2,
  keys: mergeKeys(
    [ch(0, { ...BG_IDLE, ...SPADE_UP }), ch(0.12, { ...WAKE_R, ...WAKE_L }, 'out'), ch(0.75, { ...WAKE_R, ...WAKE_L }), ch(0.9, { ...BG_IDLE, ...SPADE_UP }, 'inOut')],
    [bodyB(0, {}), bodyB(0.12, WAKE_BODY, [0, -0.15, -0.02], 'out'), bodyB(0.75, { ...WAKE_BODY, head: [-20, 0, 0] }, [0, -0.15, -0.02]), bodyB(0.9, {}, undefined, 'inOut')],
  ),
};

export const RYUMON_CLIPS: ClipDef[] = [b1, b2, b3, b4, xcrash, spin, fling, explode, wake, styptic, dance, bankai, ...SHARED];
export const RYUMON_CHAIN = ['ik_b1', 'ik_b2', 'ik_b3', 'ik_b4'];
