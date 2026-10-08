// Rangiku Matsumoto's animation set (docs/kits/rangiku.md). Sealed: a lazy, confident contrapposto, the left hand
// on her hip and Haineko low at her right. The string mixes cuts and kicks: a diagonal cut, a roundhouse, a
// backhand cut, a flying kick; the wide cut is the heavy. Shakkahō from the left palm; the provoke (a beckoning
// hand, a sway of the hips); play dead (she crumples onto her side and stays down) and the blade at the throat
// (behind the target, the sword across their neck, then the cut); the Gentei Kaijo (hands to the seal, arms flung
// wide); Tenteikūra (two fingers to the temple); "Unare" (the sword raised before her face, then flicked away as
// the blade goes to ash). Shikai: she conducts — the hilt in her right hand, the left hand open: flicks that send
// ribbons of ash, a thrust, an upswing, both arms sweeping the tide forward, the hilt swirled overhead to pour the
// veil, the sharp flick that cuts, both hands circling for Neko Rinbu, the palm raised for the shield, and "Hausu!"
// (the hilt held up while the blade comes back).
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

const SHARED = ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name));

// ================================================================== sealed

const IDLE: B = {
  // weight on the right leg, the left knee in, the hips tipped; the left hand on her hip
  hips: [0, -12, -5], spine: [2, 4, 4], chest: [0, 6, 2], neck: [0, 0, 0], head: [-2, -6, -5],
  'thigh.L': [-12, 0, 2], 'shin.L': [20, 0, 0], 'foot.L': [-6, 0, 0], 'thigh.R': [4, 0, -7], 'shin.R': [6, 0, 0], 'foot.R': [-4, 0, 0],
  'upperarm.L': [8, 0, 36], 'forearm.L': [-88, 0, 0], 'hand.L': [0, 0, 24],
};
const R = (over: B = {}): B => ({ ...IDLE, ...over });
const HIPS: C3 = [0, -0.02, 0];
const SG = { p: [-0.32, -0.33, 0.12] as C3, dir: [-0.15, -0.6, 0.78] as C3, edge: [0, -0.78, -0.6] as C3, pole: [-0.6, -0.3, -0.75] as C3 };
const SG_IDLE = grip(SG.p, SG.dir, SG.pole);

/** Sealed: a lazy, confident stance, the left hand on her hip, the sword low at her right. */
export const RANGIKU_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.02,
  run: { 'upperarm.L': [-26, 0, 16], 'forearm.L': [-60, 0, 0], 'hand.L': [0, 0, 0], chest: [4, 0, 0] },
  sprint: { spine: [16, 0, 0], 'upperarm.L': [40, 0, 14], 'forearm.L': [-20, 0, 0], 'hand.L': [10, 0, 0] },
  swingL: 0.7,
  swingR: 0.2,
  grip: {
    idle: SG,
    walk: { p: [-0.32, -0.3, 0.1], dir: [-0.15, -0.6, 0.78], edge: [0, -0.78, -0.6], pole: [-0.6, -0.3, -0.75] },
    run: { p: [-0.3, -0.24, -0.1], dir: [-0.2, -0.25, -0.95], edge: [0, -0.96, 0.25], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.28, -0.12, -0.2], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.38, -0.08, 0.1], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

// 1: a diagonal cut, high right to low left
const s1: ClipDef = {
  name: 'rk_s1', dur: 0.48, fadeIn: 0.05, fadeOut: 0.16,
  events: { step: 0.06, combo: 0.28 },
  keys: mergeKeys(
    swingKeys({ a: [-0.7, 0.7, 0], b: [0, 0, 1], c: [-0.04, 0.05, 0.12], r: 0.36, pole: [-0.7, -0.4, -0.5], keys: [[0, 30, 'out'], [0.1, -10, 'out'], [0.22, 175, 'out'], [0.48, 150, 'inOut']] }),
    [
      body(0, R(), HIPS),
      body(0.1, R({ hips: [0, -30, 0], spine: [2, -8, 0], chest: [0, -14, 0], head: [-4, 18, 0] }), HIPS, 'out'),
      body(0.22, R({ hips: [6, 18, 0], spine: [10, 10, 0], chest: [6, 16, 0], head: [-6, -16, 0], 'thigh.L': [-34, 0, 6], 'shin.L': [30, 0, 0], 'thigh.R': [20, 0, -8], 'shin.R': [20, 0, 0] }), [0, -0.06, 0.1], 'outExpo'),
      body(0.48, R(), HIPS, 'inOut'),
    ],
  ),
};

// 2: the roundhouse — the hips turn, the right leg whips round at waist height, the sword thrown out for balance
const s2: ClipDef = {
  name: 'rk_s2', dur: 0.5, fadeIn: 0.04, fadeOut: 0.16,
  events: { step: 0.04, hit: 0.16, combo: 0.24 },
  keys: mergeKeys(
    [ch(0, SG_IDLE), ch(0.08, grip([-0.45, 0.02, -0.12], [-0.7, 0.1, -0.7], [-0.4, -0.6, -0.6]), 'out'), ch(0.3, grip([-0.45, 0.0, -0.1], [-0.7, 0.05, -0.7], [-0.4, -0.6, -0.6])), ch(0.5, SG_IDLE, 'inOut')],
    [
      body(0, R(), HIPS),
      body(0.07, R({ hips: [0, 20, 0], spine: [-4, 6, 0], 'thigh.R': [-50, 0, -30], 'shin.R': [90, 0, 0], 'thigh.L': [-6, 0, 4], 'shin.L': [18, 0, 0], 'upperarm.L': [-30, 0, 50], 'forearm.L': [-40, 0, 0] }), [0, -0.02, 0.02], 'out'),
      body(0.16, R({ hips: [0, 62, 0], spine: [-12, 12, -14], chest: [-4, 8, -6], head: [8, -40, 10], 'thigh.R': [-86, 0, -52], 'shin.R': [8, 0, 0], 'foot.R': [-30, 0, 0], 'thigh.L': [-2, 0, 6], 'shin.L': [12, 0, 0], 'upperarm.L': [-40, 0, 60], 'forearm.L': [-30, 0, 0], 'hand.L': [0, 0, 0] }), [0, 0.02, 0.08], 'outExpo'),
      body(0.28, R({ hips: [0, 40, 0], spine: [-4, 6, 0], 'thigh.R': [-50, 0, -30], 'shin.R': [80, 0, 0] }), [0, -0.02, 0.06], 'inOut'),
      body(0.5, R(), HIPS, 'inOut'),
    ],
  ),
};

// 3: the backhand cut, low left to high right along a flat arc
const s3: ClipDef = {
  name: 'rk_s3', dur: 0.48, fadeIn: 0.04, fadeOut: 0.16,
  events: { step: 0.06, combo: 0.28 },
  keys: mergeKeys(
    swingKeys({ a: [-1, -0.15, 0], b: [0, -0.1, 1], c: [-0.02, 0.0, 0.14], r: 0.36, sense: -1, pole: [-0.7, -0.4, -0.5], keys: [[0, 60, 'out'], [0.1, 190, 'out'], [0.22, -10, 'out'], [0.48, 10, 'inOut']] }),
    [
      body(0, R(), HIPS),
      body(0.1, R({ hips: [0, 30, 0], spine: [2, 12, 0], chest: [0, 18, 0], head: [-4, -24, 0] }), HIPS, 'out'),
      body(0.22, R({ hips: [6, -24, 0], spine: [10, -14, 0], chest: [8, -20, 0], head: [-6, 20, 0], 'thigh.L': [-36, 0, 6], 'shin.L': [34, 0, 0], 'thigh.R': [22, 0, -8], 'shin.R': [22, 0, 0] }), [0, -0.06, 0.1], 'outExpo'),
      body(0.48, R(), HIPS, 'inOut'),
    ],
  ),
};

// 4: the flying kick — a hop, the left leg driven straight out, the right tucked, the sword swung back
const s4: ClipDef = {
  name: 'rk_s4', dur: 0.64, fadeIn: 0.04, fadeOut: 0.2,
  events: { step: 0.08, hit: 0.22 },
  keys: mergeKeys(
    [ch(0, SG_IDLE), ch(0.12, grip([-0.4, 0.1, -0.2], [-0.5, 0.3, -0.8], [-0.4, -0.6, -0.6]), 'out'), ch(0.4, grip([-0.4, 0.06, -0.18], [-0.5, 0.2, -0.84], [-0.4, -0.6, -0.6])), ch(0.64, SG_IDLE, 'inOut')],
    [
      body(0, R(), HIPS),
      body(0.1, R({ hips: [0, 0, 0], spine: [8, 0, 0], 'thigh.L': [-30, 0, 4], 'shin.L': [60, 0, 0], 'thigh.R': [-20, 0, -4], 'shin.R': [50, 0, 0], 'upperarm.L': [-60, 0, 30], 'forearm.L': [-50, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.12, 0], 'out'),
      body(0.22, R({ hips: [-6, 0, 0], spine: [-14, 0, 0], chest: [-6, 0, 0], head: [12, 0, 0], 'thigh.L': [-92, 0, 0], 'shin.L': [4, 0, 0], 'foot.L': [-24, 0, 0], 'thigh.R': [-40, 0, -4], 'shin.R': [110, 0, 0], 'foot.R': [20, 0, 0], 'upperarm.L': [-20, 0, 60], 'forearm.L': [-30, 0, 0], 'hand.L': [0, 0, 0] }), [0, 0.26, 0.16], 'outExpo'),
      body(0.4, R({ 'thigh.L': [-50, 0, 2], 'shin.L': [70, 0, 0], 'thigh.R': [-20, 0, -4], 'shin.R': [60, 0, 0] }), [0, 0.06, 0.1], 'inOut'),
      body(0.64, R(), HIPS, 'inOut'),
    ],
  ),
};

// the wide cut: wound back to her right, one long level sweep across to her left with a step
const wide: ClipDef = {
  name: 'rk_wide', dur: 0.74, fadeIn: 0.05, fadeOut: 0.22,
  events: { step: 0.18 },
  keys: mergeKeys(
    swingKeys({ a: [-1, -0.1, 0], b: [0, -0.1, 1], c: [-0.02, 0.0, 0.12], r: 0.4, pole: [-0.7, -0.4, -0.5], keys: [[0, 40, 'out'], [0.2, -40, 'inOut'], [0.34, 200, 'out'], [0.74, 180, 'inOut']] }),
    [
      body(0, R(), HIPS),
      body(0.2, R({ hips: [0, -46, 0], spine: [2, -14, 0], chest: [0, -20, 0], head: [-4, 30, 0], 'thigh.L': [-20, 0, 8], 'shin.L': [24, 0, 0], 'upperarm.L': [-60, 0, 40], 'forearm.L': [-40, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.06, -0.04], 'inOut'),
      body(0.34, R({ hips: [8, 40, 0], spine: [12, 18, 0], chest: [8, 22, 0], head: [-8, -26, 0], 'thigh.L': [-46, 0, 6], 'shin.L': [46, 0, 0], 'thigh.R': [26, 0, -8], 'shin.R': [28, 0, 0], 'upperarm.L': [-10, 0, 60], 'forearm.L': [-20, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.12, 0.18], 'outExpo'),
      body(0.5, R({ hips: [6, 36, 0], spine: [10, 16, 0], chest: [6, 20, 0], head: [-6, -24, 0], 'thigh.L': [-42, 0, 6], 'shin.L': [42, 0, 0], 'thigh.R': [24, 0, -8], 'shin.R': [26, 0, 0], 'upperarm.L': [-10, 0, 56], 'forearm.L': [-20, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.11, 0.16], 'out'),
      body(0.74, R(), HIPS, 'inOut'),
    ],
  ),
};

// Shakkahō: the left palm thrust out, the sword lowered
const shakka: ClipDef = {
  name: 'rk_shakka', dur: 0.6, fadeIn: 0.06, fadeOut: 0.18,
  events: { cast: 0.24 },
  keys: mergeKeys(
    [ch(0, SG_IDLE), ch(0.2, grip([-0.34, -0.34, 0.0], [-0.2, -0.7, 0.6], [-0.6, -0.3, -0.75]), 'inOut'), ch(0.6, SG_IDLE, 'inOut')],
    [
      body(0, R(), HIPS),
      body(0.14, R({ hips: [0, -10, 0], chest: [0, -10, 0], 'upperarm.L': [-60, 0, 20], 'forearm.L': [-70, 0, 0], 'hand.L': [-30, 0, 0] }), HIPS, 'inOut'),
      body(0.24, R({ hips: [2, 14, 0], spine: [6, 6, 0], chest: [4, 10, 0], head: [-4, -10, 0], 'upperarm.L': [-86, 0, -6], 'forearm.L': [-6, 0, 0], 'hand.L': [-70, 0, 0], 'thigh.L': [-30, 0, 4], 'shin.L': [28, 0, 0] }), [0, -0.04, 0.08], 'outExpo'),
      body(0.42, R({ hips: [2, 12, 0], spine: [6, 6, 0], chest: [4, 8, 0], 'upperarm.L': [-82, 0, -4], 'forearm.L': [-10, 0, 0], 'hand.L': [-60, 0, 0] }), [0, -0.04, 0.06], 'out'),
      body(0.6, R(), HIPS, 'inOut'),
    ],
  ),
};

// the provoke: a sway of the hips, the left hand raised and beckoning, a tilt of the head
const provoke: ClipDef = {
  name: 'rk_provoke', dur: 1.1, fadeIn: 0.08, fadeOut: 0.22,
  events: { tease: 0.4 },
  keys: mergeKeys(
    [ch(0, SG_IDLE)],
    [
      body(0, R(), HIPS),
      body(0.25, R({ hips: [0, -18, -10], spine: [0, 6, 8], chest: [-4, 8, 4], head: [-6, -10, -12], 'upperarm.L': [-70, 0, 34], 'forearm.L': [-100, 0, 0], 'hand.L': [-40, 0, 0] }), [0.02, -0.02, 0], 'inOut'),
      body(0.4, R({ hips: [0, -18, -12], spine: [0, 6, 9], chest: [-4, 8, 5], head: [-6, -12, -14], 'upperarm.L': [-70, 0, 34], 'forearm.L': [-118, 0, 0], 'hand.L': [-60, 0, 0] }), [0.03, -0.02, 0], 'inOut'),
      body(0.55, R({ hips: [0, -18, -10], spine: [0, 6, 8], chest: [-4, 8, 4], head: [-6, -10, -12], 'upperarm.L': [-70, 0, 34], 'forearm.L': [-100, 0, 0], 'hand.L': [-40, 0, 0] }), [0.02, -0.02, 0], 'inOut'),
      body(0.7, R({ hips: [0, -18, -12], spine: [0, 6, 9], chest: [-4, 8, 5], head: [-6, -12, -14], 'upperarm.L': [-70, 0, 34], 'forearm.L': [-118, 0, 0], 'hand.L': [-60, 0, 0] }), [0.03, -0.02, 0], 'inOut'),
      body(1.1, R(), HIPS, 'inOut'),
    ],
  ),
};

// play dead: she crumples and comes to rest on her right side, the sword fallen beside her (held by the kit)
const DEAD: B = {
  hips: [0, 0, 84], spine: [6, 0, 6], chest: [10, 0, 4], neck: [-10, 0, 10], head: [-6, 10, 12],
  'thigh.L': [-46, 0, 8], 'shin.L': [70, 0, 0], 'foot.L': [10, 0, 0], 'thigh.R': [-30, 0, -4], 'shin.R': [50, 0, 0], 'foot.R': [10, 0, 0],
  'upperarm.L': [-30, 0, 10], 'forearm.L': [-40, 0, 0], 'hand.L': [0, 0, 0], 'upperarm.R': [-120, 0, -10], 'forearm.R': [-30, 0, 0],
};
const dead: ClipDef = {
  name: 'rk_dead', dur: 0.62, fadeIn: 0.05, fadeOut: 0.2,
  events: { down: 0.42 },
  keys: mergeKeys(
    [ch(0, SG_IDLE), ch(0.3, { '@ikR': [0, 0, 0] }, 'inOut')],
    [
      body(0, R(), HIPS),
      body(0.18, R({ hips: [20, 0, 10], spine: [16, 0, 0], chest: [10, 0, 0], head: [20, 0, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [80, 0, 0], 'thigh.R': [-30, 0, -6], 'shin.R': [70, 0, 0], 'upperarm.L': [-10, 0, 20], 'forearm.L': [-20, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.36, 0.04], 'in'),
      body(0.42, DEAD, [0.05, -0.72, 0.02], 'out'),
      body(0.62, DEAD, [0.05, -0.72, 0.02]),
    ],
  ),
};

// the blade at the throat: behind the target, the sword held level across their neck, the left hand on their
// shoulder — then drawn back across them
const throat: ClipDef = {
  name: 'rk_throat', dur: 1.1, fadeIn: 0.06, fadeOut: 0.22,
  events: { hold: 0.08, cut: 0.72 },
  keys: mergeKeys(
    [
      ch(0, grip([-0.16, 0.3, 0.58], [0.96, 0.0, 0.28], [-0.6, -0.4, -0.6], [0, 0, -1])),
      ch(0.62, grip([-0.14, 0.3, 0.6], [0.96, 0.0, 0.28], [-0.6, -0.4, -0.6], [0, 0, -1])),
      ch(0.76, grip([-0.4, 0.12, 0.2], [-0.6, 0.0, 0.8], [-0.6, -0.4, -0.6], [0, 0, -1]), 'outExpo'),
      ch(1.1, SG_IDLE, 'inOut'),
    ],
    [
      body(0, R({ hips: [4, 0, 0], spine: [6, 0, 0], chest: [4, 0, 0], head: [8, 0, 0], 'upperarm.L': [-70, 0, -10], 'forearm.L': [-40, 0, 0], 'hand.L': [-20, 0, 0], 'thigh.L': [-24, 0, 4], 'shin.L': [24, 0, 0] }), [0, -0.04, 0.04]),
      body(0.62, R({ hips: [4, 0, 0], spine: [6, 0, 0], chest: [4, 0, 0], head: [10, 0, 0], 'upperarm.L': [-70, 0, -10], 'forearm.L': [-40, 0, 0], 'hand.L': [-20, 0, 0], 'thigh.L': [-24, 0, 4], 'shin.L': [24, 0, 0] }), [0, -0.04, 0.04]),
      body(0.76, R({ hips: [6, -36, 0], spine: [10, -16, 0], chest: [6, -20, 0], head: [-4, 20, 0], 'upperarm.L': [-30, 0, 40], 'forearm.L': [-30, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.06, -0.02], 'outExpo'),
      body(1.1, R(), HIPS, 'inOut'),
    ],
  ),
};

// Gentei Kaijo: both hands to the seal on her chest, then the arms flung wide and the head thrown back
const gentei: ClipDef = {
  name: 'rk_gentei', dur: 1.0, fadeIn: 0.08, fadeOut: 0.24,
  events: { burst: 0.42 },
  keys: mergeKeys(
    [ch(0, SG_IDLE), ch(0.2, { '@ikR': [0, 0, 0] }, 'inOut'), ch(0.7, { '@ikR': [0, 0, 0] }), ch(1.0, SG_IDLE, 'inOut')],
    [
      body(0, R(), HIPS),
      body(0.3, R({ spine: [6, 0, 0], chest: [8, 0, 0], head: [16, 0, 0], 'upperarm.L': [-40, 0, -20], 'forearm.L': [-110, 0, 0], 'hand.L': [-20, 0, 0], 'upperarm.R': [-40, 0, 20], 'forearm.R': [-110, 0, 0] }), HIPS, 'inOut'),
      body(0.46, R({ spine: [-8, 0, 0], chest: [-12, 0, 0], head: [-20, 0, 0], 'upperarm.L': [-20, 0, 80], 'forearm.L': [-10, 0, 0], 'hand.L': [0, 0, 0], 'upperarm.R': [-20, 0, -80], 'forearm.R': [-10, 0, 0], 'thigh.L': [-16, 0, 10], 'thigh.R': [-6, 0, -10] }), [0, -0.04, 0], 'outExpo'),
      body(0.7, R({ spine: [-6, 0, 0], chest: [-10, 0, 0], head: [-16, 0, 0], 'upperarm.L': [-16, 0, 74], 'forearm.L': [-14, 0, 0], 'hand.L': [0, 0, 0], 'upperarm.R': [-16, 0, -74], 'forearm.R': [-14, 0, 0] }), [0, -0.04, 0]),
      body(1.0, R(), HIPS, 'inOut'),
    ],
  ),
};

// Tenteikūra: two fingers to her temple, eyes down, then the hand swept out as the net spreads
const tentei: ClipDef = {
  name: 'rk_tentei', dur: 0.9, fadeIn: 0.08, fadeOut: 0.22,
  events: { link: 0.36 },
  keys: mergeKeys(
    [ch(0, SG_IDLE)],
    [
      body(0, R(), HIPS),
      body(0.28, R({ head: [14, 6, 0], 'upperarm.L': [-40, 0, 64], 'forearm.L': [-140, 0, 0], 'hand.L': [-10, 0, 0] }), HIPS, 'inOut'),
      body(0.5, R({ head: [4, 0, 0], chest: [-4, 0, 0], 'upperarm.L': [-70, 0, 70], 'forearm.L': [-10, 0, 0], 'hand.L': [0, 0, 0] }), HIPS, 'out'),
      body(0.9, R(), HIPS, 'inOut'),
    ],
  ),
};

/** Shikai: the hilt held up loosely at her right, the left hand open and raised a little — conducting the ash */
const K_IDLE: B = {
  hips: [0, -8, -3], spine: [2, 4, 2], chest: [0, 4, 1], neck: [0, 0, 0], head: [-2, -4, -3],
  'thigh.L': [-12, 0, 3], 'shin.L': [18, 0, 0], 'foot.L': [-6, 0, 0], 'thigh.R': [4, 0, -7], 'shin.R': [8, 0, 0], 'foot.R': [-4, 0, 0],
  'upperarm.L': [-26, 0, 30], 'forearm.L': [-52, 0, 0], 'hand.L': [0, 0, -10],
};

// "Unare, Haineko": the sword raised upright before her face, then flicked away as the blade turns to ash
const unare: ClipDef = {
  name: 'rk_unare', dur: 0.95, fadeIn: 0.06, fadeOut: 0.22,
  events: { name: 0.2, ash: 0.36, flick: 0.56 },
  keys: mergeKeys(
    [
      ch(0, SG_IDLE),
      ch(0.22, grip([-0.08, 0.16, 0.3], [0.05, 0.98, 0.15], [-0.6, -0.5, -0.6], [0, 0, 1]), 'inOut'),
      ch(0.48, grip([-0.08, 0.18, 0.3], [0.05, 0.98, 0.15], [-0.6, -0.5, -0.6], [0, 0, 1])),
      ch(0.6, grip([-0.42, 0.08, 0.2], [-0.8, 0.3, 0.5], [-0.5, -0.6, -0.6], [0, 0, 1]), 'outExpo'),
      ch(0.95, grip([-0.3, -0.05, 0.18], [-0.1, 0.6, 0.8], [-0.6, -0.4, -0.6]), 'inOut'),
    ],
    [
      body(0, R(), HIPS),
      body(0.22, R({ head: [6, 0, 0], 'upperarm.L': [-20, 0, 30], 'forearm.L': [-60, 0, 0], 'hand.L': [0, 0, 0] }), HIPS, 'inOut'),
      body(0.6, R({ hips: [0, -20, 0], chest: [0, -10, 0], head: [-4, 16, 0], 'upperarm.L': [-50, 0, 50], 'forearm.L': [-30, 0, 0], 'hand.L': [0, 0, 0] }), HIPS, 'outExpo'),
      body(0.95, K_IDLE, HIPS, 'inOut'),
    ],
  ),
};



// ================================================================== Shikai: Haineko

const KR = (over: B = {}): B => ({ ...K_IDLE, ...over });
const KG = { p: [-0.3, -0.06, 0.18] as C3, dir: [-0.1, 0.6, 0.8] as C3, edge: [0, 0.8, -0.6] as C3, pole: [-0.6, -0.4, -0.6] as C3 };
const KG_IDLE = grip(KG.p, KG.dir, KG.pole);

/** Shikai: the hilt held up at her right, the blade gone; the left hand open, conducting the cloud. */
export const HAINEKO_STANCE: StanceDef = {
  idle: K_IDLE,
  idleHips: -0.02,
  run: { 'upperarm.L': [-30, 0, 24], 'forearm.L': [-50, 0, 0], chest: [4, 0, 0] },
  sprint: { spine: [14, 0, 0], 'upperarm.L': [30, 0, 20], 'forearm.L': [-30, 0, 0] },
  swingL: 0.6,
  swingR: 0.2,
  grip: {
    idle: KG,
    walk: KG,
    run: { p: [-0.32, -0.12, 0.06], dir: [-0.2, 0.4, 0.9], edge: [0, 0.9, -0.4], pole: [-0.7, -0.4, -0.5] },
    sprint: { p: [-0.3, -0.12, -0.1], dir: [-0.2, 0.1, -0.97], edge: [0, -0.98, 0.1], pole: [-0.8, -0.2, 0.5] },
    air: KG,
  },
};

/** a flick of the hilt along a small arc (the ash ribbon follows it out) */
function flickClip(name: string, a: C3, sense: 1 | -1, keys: [number, number, KeyDef['ease']?][], hipYaw: [number, number]): ClipDef {
  return {
    name, dur: 0.44, fadeIn: 0.04, fadeOut: 0.16,
    events: { flick: 0.1, combo: 0.22 },
    keys: mergeKeys(
      swingKeys({ a, b: [0, 0.1, 1], c: [-0.08, 0.02, 0.16], r: 0.24, sense, pole: [-0.6, -0.4, -0.6], keys: keys as [number, number, NonNullable<KeyDef['ease']>][] }),
      [
        body(0, KR(), HIPS),
        body(0.06, KR({ hips: [0, hipYaw[0], 0], chest: [0, hipYaw[0] * 0.5, 0], 'upperarm.L': [-40, 0, 40], 'forearm.L': [-40, 0, 0] }), HIPS, 'out'),
        body(0.16, KR({ hips: [2, hipYaw[1], 0], spine: [4, hipYaw[1] * 0.4, 0], chest: [2, hipYaw[1] * 0.6, 0], head: [-2, -hipYaw[1] * 0.6, 0], 'upperarm.L': [-50, 0, 54], 'forearm.L': [-26, 0, 0], 'thigh.L': [-24, 0, 4], 'shin.L': [22, 0, 0] }), [0, -0.03, 0.05], 'outExpo'),
        body(0.44, KR(), HIPS, 'inOut'),
      ],
    ),
  };
}

// 1, 2: the flicks — right to left, then back
const k1 = flickClip('rk_k1', [-1, 0.1, 0], 1, [[0, 60, 'out'], [0.06, 20, 'out'], [0.16, 160, 'outExpo'], [0.44, 120, 'inOut']], [-22, 20]);
const k2 = flickClip('rk_k2', [-1, 0.1, 0], -1, [[0, 120, 'out'], [0.06, 170, 'out'], [0.16, 10, 'outExpo'], [0.44, 50, 'inOut']], [20, -22]);

// 3: the ash spear — the hilt drawn back and thrust straight at the target
const k3: ClipDef = {
  name: 'rk_k3', dur: 0.46, fadeIn: 0.04, fadeOut: 0.16,
  events: { flick: 0.12, combo: 0.24 },
  keys: mergeKeys(
    [ch(0, KG_IDLE), ch(0.07, grip([-0.26, -0.04, -0.1], [0, 0.1, 1], [-0.6, -0.4, -0.6]), 'inOut'), ch(0.14, grip([-0.12, 0.02, 0.5], [0, 0.04, 1], [-0.6, -0.5, -0.3]), 'outExpo'), ch(0.26, grip([-0.12, 0.02, 0.48], [0, 0.04, 1], [-0.6, -0.5, -0.3])), ch(0.46, KG_IDLE, 'inOut')],
    [
      body(0, KR(), HIPS),
      body(0.07, KR({ hips: [0, -20, 0], chest: [-2, -10, 0], 'upperarm.L': [-60, 0, 30], 'forearm.L': [-30, 0, 0] }), HIPS, 'inOut'),
      body(0.14, KR({ hips: [6, 10, 0], spine: [8, 6, 0], chest: [4, 8, 0], head: [-6, -10, 0], 'upperarm.L': [-20, 0, 60], 'forearm.L': [-20, 0, 0], 'thigh.L': [-36, 0, 4], 'shin.L': [36, 0, 0], 'thigh.R': [20, 0, -8], 'shin.R': [20, 0, 0] }), [0, -0.06, 0.12], 'outExpo'),
      body(0.46, KR(), HIPS, 'inOut'),
    ],
  ),
};

// 4: the geyser — the hilt swept from low to high; the ash erupts under the target
const k4: ClipDef = {
  name: 'rk_k4', dur: 0.6, fadeIn: 0.04, fadeOut: 0.18,
  events: { flick: 0.16 },
  keys: mergeKeys(
    swingKeys({ a: [0, 1, 0], b: [0, 0, 1], c: [-0.12, 0.02, 0.14], r: 0.26, sense: -1, pole: [-0.6, -0.4, -0.6], keys: [[0, 60, 'out'], [0.08, 160, 'inOut'], [0.18, -10, 'outExpo'], [0.6, 30, 'inOut']] }),
    [
      body(0, KR(), HIPS),
      body(0.08, KR({ hips: [10, 0, 0], spine: [14, 0, 0], chest: [8, 0, 0], 'thigh.L': [-30, 0, 4], 'shin.L': [50, 0, 0], 'thigh.R': [-6, 0, -6], 'shin.R': [40, 0, 0], 'upperarm.L': [-10, 0, 20], 'forearm.L': [-30, 0, 0] }), [0, -0.12, 0.02], 'inOut'),
      body(0.18, KR({ hips: [-6, 0, 0], spine: [-12, 0, 0], chest: [-10, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-160, 0, 20], 'forearm.L': [-10, 0, 0], 'thigh.L': [-8, 0, 4], 'shin.L': [8, 0, 0] }), [0, 0.02, 0.02], 'outExpo'),
      body(0.6, KR(), HIPS, 'inOut'),
    ],
  ),
};

// the ash tide: both arms swept forward from her sides, the hilt and the open hand together
const tide: ClipDef = {
  name: 'rk_tide', dur: 0.8, fadeIn: 0.06, fadeOut: 0.22,
  events: { wave: 0.26 },
  keys: mergeKeys(
    [ch(0, KG_IDLE), ch(0.16, grip([-0.52, -0.04, -0.08], [-0.6, 0.2, -0.75], [-0.3, -0.6, -0.7]), 'inOut'), ch(0.28, grip([-0.2, -0.02, 0.5], [-0.1, 0.2, 0.97], [-0.6, -0.5, -0.4]), 'outExpo'), ch(0.5, grip([-0.2, -0.04, 0.48], [-0.1, 0.15, 0.98], [-0.6, -0.5, -0.4])), ch(0.8, KG_IDLE, 'inOut')],
    [
      body(0, KR(), HIPS),
      body(0.16, KR({ spine: [-6, 0, 0], chest: [-8, 0, 0], 'upperarm.L': [-10, 0, 80], 'forearm.L': [-10, 0, 0], 'hand.L': [0, 0, 0] }), [0, 0.0, -0.04], 'inOut'),
      body(0.28, KR({ hips: [8, 0, 0], spine: [12, 0, 0], chest: [8, 0, 0], head: [-6, 0, 0], 'upperarm.L': [-86, 0, 10], 'forearm.L': [-4, 0, 0], 'hand.L': [-60, 0, 0], 'thigh.L': [-40, 0, 4], 'shin.L': [40, 0, 0], 'thigh.R': [22, 0, -8], 'shin.R': [24, 0, 0] }), [0, -0.08, 0.16], 'outExpo'),
      body(0.5, KR({ hips: [6, 0, 0], spine: [10, 0, 0], chest: [6, 0, 0], 'upperarm.L': [-84, 0, 10], 'forearm.L': [-6, 0, 0], 'hand.L': [-50, 0, 0], 'thigh.L': [-36, 0, 4], 'shin.L': [36, 0, 0], 'thigh.R': [20, 0, -8], 'shin.R': [22, 0, 0] }), [0, -0.07, 0.14], 'out'),
      body(0.8, KR(), HIPS, 'inOut'),
    ],
  ),
};

// the veil: the hilt swirled once over her head, then pointed at the target as the ash pours over them
const veil: ClipDef = {
  name: 'rk_veil', dur: 0.86, fadeIn: 0.06, fadeOut: 0.22,
  events: { pour: 0.34 },
  keys: mergeKeys(
    swingKeys({ a: [-0.9, 0.3, 0], b: [0, 0.3, 1], c: [-0.06, 0.34, 0.04], r: 0.22, pole: [-0.6, -0.4, -0.6], keys: [[0, 30, 'out'], [0.12, 160, 'inOut'], [0.24, 330, 'inOut']] }),
    [ch(0.34, grip([-0.16, 0.12, 0.46], [0, 0.2, 1], [-0.6, -0.5, -0.3]), 'outExpo'), ch(0.62, grip([-0.16, 0.1, 0.44], [0, 0.15, 1], [-0.6, -0.5, -0.3])), ch(0.86, KG_IDLE, 'inOut')],
    [
      body(0, KR(), HIPS),
      body(0.24, KR({ spine: [-4, 0, 0], chest: [-6, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-30, 0, 50], 'forearm.L': [-30, 0, 0] }), HIPS, 'inOut'),
      body(0.34, KR({ hips: [4, 6, 0], spine: [6, 4, 0], chest: [4, 6, 0], head: [-4, -6, 0], 'upperarm.L': [-40, 0, 60], 'forearm.L': [-20, 0, 0], 'thigh.L': [-26, 0, 4], 'shin.L': [26, 0, 0] }), [0, -0.04, 0.08], 'outExpo'),
      body(0.86, KR(), HIPS, 'inOut'),
    ],
  ),
};

// the flick-cut: one sharp downward flick of the hilt, the left hand snapping shut
const flick: ClipDef = {
  name: 'rk_flick', dur: 0.5, fadeIn: 0.04, fadeOut: 0.18,
  events: { cut: 0.12 },
  keys: mergeKeys(
    [ch(0, KG_IDLE), ch(0.06, grip([-0.28, 0.12, 0.24], [-0.1, 0.9, 0.4], [-0.6, -0.4, -0.6]), 'out'), ch(0.12, grip([-0.28, -0.12, 0.3], [-0.1, -0.2, 0.97], [-0.6, -0.4, -0.6]), 'outExpo'), ch(0.5, KG_IDLE, 'inOut')],
    [
      body(0, KR(), HIPS),
      body(0.06, KR({ chest: [-4, 0, 0], head: [-6, 0, 0], 'upperarm.L': [-60, 0, 40], 'forearm.L': [-40, 0, 0], 'hand.L': [-20, 0, 0] }), HIPS, 'out'),
      body(0.12, KR({ spine: [6, 0, 0], chest: [6, 0, 0], head: [4, 0, 0], 'upperarm.L': [-50, 0, 30], 'forearm.L': [-70, 0, 0], 'hand.L': [30, 0, 0] }), [0, -0.03, 0.02], 'outExpo'),
      body(0.5, KR(), HIPS, 'inOut'),
    ],
  ),
};

// Neko Rinbu: both hands raised in a circle over her head (the tell), then swept round as the cloud whirls
const rinbu: ClipDef = {
  name: 'rk_rinbu', dur: 1.0, fadeIn: 0.08, fadeOut: 0.24,
  events: { rinbu: 0.42 },
  keys: mergeKeys(
    [ch(0, KG_IDLE), ch(0.3, grip([-0.14, 0.5, 0.06], [0.3, 0.9, 0.2], [-0.6, -0.2, -0.75], [0, 0, 1]), 'inOut'), ch(0.42, grip([-0.36, 0.34, 0.1], [-0.8, 0.4, 0.4], [-0.6, -0.2, -0.75], [0, 0, 1]), 'outExpo'), ch(0.7, grip([-0.4, 0.2, 0.12], [-0.8, 0.3, 0.5], [-0.6, -0.2, -0.75], [0, 0, 1])), ch(1.0, KG_IDLE, 'inOut')],
    [
      body(0, KR(), HIPS),
      body(0.3, KR({ spine: [-6, 0, 0], chest: [-8, 0, 0], head: [-12, 0, 0], 'upperarm.L': [-170, 0, 16], 'forearm.L': [-40, 0, 0], 'hand.L': [0, 0, 0] }), [0, 0.02, 0], 'inOut'),
      body(0.42, KR({ hips: [0, 40, 0], spine: [-4, 20, 0], chest: [-6, 20, 0], head: [-8, -20, 0], 'upperarm.L': [-100, 0, 80], 'forearm.L': [-10, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.02, 0], 'outExpo'),
      body(0.7, KR({ hips: [0, 30, 0], spine: [-2, 16, 0], chest: [-4, 16, 0], 'upperarm.L': [-90, 0, 80], 'forearm.L': [-10, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.02, 0]),
      body(1.0, KR(), HIPS, 'inOut'),
    ],
  ),
};

// the shield: the left palm thrown up and out, the hilt drawn back — the ash packs into a wall (held by the kit)
const shield: ClipDef = {
  name: 'rk_shield', dur: 0.6, fadeIn: 0.05, fadeOut: 0.2,
  events: { wall: 0.14 },
  keys: mergeKeys(
    [ch(0, KG_IDLE), ch(0.14, grip([-0.36, 0.0, -0.06], [-0.4, 0.6, -0.6], [-0.5, -0.5, -0.6]), 'outExpo'), ch(0.6, grip([-0.36, 0.0, -0.06], [-0.4, 0.6, -0.6], [-0.5, -0.5, -0.6]))],
    [
      body(0, KR(), HIPS),
      body(0.14, KR({ hips: [0, -6, 0], spine: [-4, 0, 0], chest: [-4, 0, 0], head: [-4, 0, 0], 'upperarm.L': [-96, 0, 10], 'forearm.L': [-16, 0, 0], 'hand.L': [-70, 0, 0], 'thigh.L': [-24, 0, 6], 'shin.L': [28, 0, 0] }), [0, -0.04, -0.02], 'outExpo'),
      body(0.6, KR({ hips: [0, -6, 0], spine: [-4, 0, 0], chest: [-4, 0, 0], head: [-4, 0, 0], 'upperarm.L': [-94, 0, 10], 'forearm.L': [-18, 0, 0], 'hand.L': [-66, 0, 0], 'thigh.L': [-24, 0, 6], 'shin.L': [28, 0, 0] }), [0, -0.04, -0.02]),
    ],
  ),
};

// "Hausu!": the hilt held upright before her while the ash comes home in layers and the blade grows back
const house: ClipDef = {
  name: 'rk_house', dur: 1.1, fadeIn: 0.06, fadeOut: 0.24,
  events: { house: 0.26, blade: 0.72 },
  keys: mergeKeys(
    [ch(0, KG_IDLE), ch(0.24, grip([-0.08, 0.14, 0.3], [0.05, 0.98, 0.15], [-0.6, -0.5, -0.6], [0, 0, 1]), 'inOut'), ch(0.8, grip([-0.08, 0.16, 0.3], [0.05, 0.98, 0.15], [-0.6, -0.5, -0.6], [0, 0, 1])), ch(1.1, SG_IDLE, 'inOut')],
    [
      body(0, KR(), HIPS),
      body(0.24, KR({ head: [4, 0, 0], 'upperarm.L': [-60, 0, 60], 'forearm.L': [-30, 0, 0], 'hand.L': [-30, 0, 0] }), HIPS, 'inOut'),
      body(0.8, KR({ head: [6, 0, 0], 'upperarm.L': [-30, 0, 40], 'forearm.L': [-60, 0, 0], 'hand.L': [0, 0, 0] }), HIPS, 'inOut'),
      body(1.1, R(), HIPS, 'inOut'),
    ],
  ),
};

// the unare / hausu clips run on through their form swaps, so each set carries the other's
export const RANGIKU_CLIPS: ClipDef[] = [s1, s2, s3, s4, wide, shakka, provoke, dead, throat, gentei, tentei, unare, house, ...SHARED];
export const RANGIKU_CHAIN = ['rk_s1', 'rk_s2', 'rk_s3', 'rk_s4'];
export const HAINEKO_CLIPS: ClipDef[] = [k1, k2, k3, k4, tide, veil, flick, rinbu, shield, house, unare, ...SHARED];
export const HAINEKO_CHAIN = ['rk_k1', 'rk_k2', 'rk_k3', 'rk_k4'];
