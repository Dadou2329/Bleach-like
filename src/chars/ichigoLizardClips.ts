// The Hollowfied body's animation set (docs/kits/ichigo.md §4 Hollowfied). No sword: a crouched, hunched beast — the
// pelvis tipped forward, the head thrust up and out, both clawed hands hanging loose and open, the tail held off the
// ground behind (its sway is the springs'). Claw rakes from either side, the tail lash (a whirl that brings the tail
// round through the front), the two-handed maul; the low 360° tail sweep; the two-finger Cero (the right arm out
// straight, the left hand clamped on its forearm); the regeneration (arched back, arms flung wide); the arm-maw (the
// left shoulder driven forward as the worm comes out of the stump); the roar; the shed (the husk cracking from the
// shoulders before it bursts); the lunge.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

const IDLE: Record<string, E> = {
  hips: [14, 0, 0], spine: [16, 0, 0], chest: [10, 0, 0], neck: [-8, 0, 0], head: [-18, 0, 0],
  'thigh.L': [-38, 0, 12], 'shin.L': [58, 0, 0], 'foot.L': [-20, 0, 0],
  'thigh.R': [-24, 0, -12], 'shin.R': [50, 0, 0], 'foot.R': [-26, 0, 0],
  'upperarm.L': [-26, 0, 28], 'forearm.L': [-30, 0, 0], 'hand.L': [16, 0, 0],
  'upperarm.R': [-22, 0, -28], 'forearm.R': [-36, 0, 0], 'hand.R': [16, 0, 0],
  tail1: [12, 0, 0], tail2: [6, 0, 0], tail3: [4, 0, 0],
};
const I = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });

export const LIZARD_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.14,
  run: { spine: [26, 0, 0], chest: [12, 0, 0], head: [-30, 0, 0], 'upperarm.L': [-10, 0, 26], 'forearm.L': [-40, 0, 0], 'upperarm.R': [-10, 0, -26], 'forearm.R': [-40, 0, 0], tail1: [12, 0, 0] },
  sprint: { spine: [38, 0, 0], chest: [16, 0, 0], head: [-42, 0, 0], 'upperarm.L': [44, 0, 22], 'forearm.L': [-24, 0, 0], 'upperarm.R': [44, 0, -22], 'forearm.R': [-24, 0, 0], tail1: [18, 0, 0] },
  swingL: 0.6,
  swingR: 0.6,
  freqScale: 1.1,
};

/** a rake with one clawed hand, from high and out on its own side down across the front */
const rake = (name: string, left: boolean): ClipDef => {
  const k = left ? -1 : 1;
  const up = left ? 'upperarm.L' : 'upperarm.R', fo = left ? 'forearm.L' : 'forearm.R', ha = left ? 'hand.L' : 'hand.R';
  return {
    name, dur: 0.5, fadeIn: 0.04, fadeOut: 0.18, events: { step: 0.07, hit: 0.16, combo: 0.27 },
    keys: [
      key(0, I()),
      key(0.09, I({ hips: [12, -14 * k, 0], spine: [12, -12 * k, 0], chest: [4, -24 * k, 0], head: [-16, 20 * k, 0], [up]: [-150, 0, -44 * k], [fo]: [-46, 0, 0], [ha]: [-24, 0, 0] }), [0, -0.12, -0.03], 'out'),
      key(0.16, I({ hips: [16, 16 * k, 0], spine: [18, 14 * k, 0], chest: [12, 26 * k, 0], head: [-24, -18 * k, 0], [up]: [-46, 0, 18 * k], [fo]: [-8, 0, 0], [ha]: [10, 0, 0], 'thigh.L': [-54, 0, 10], 'shin.L': [60, 0, 0], 'thigh.R': [4, 0, -12], 'shin.R': [36, 0, 0] }), [0, -0.17, 0.14], 'outExpo'),
      key(0.28, I({ hips: [16, 18 * k, 0], spine: [18, 16 * k, 0], chest: [12, 28 * k, 0], head: [-24, -20 * k, 0], [up]: [-38, 0, 22 * k], [fo]: [-12, 0, 0], 'thigh.L': [-52, 0, 10], 'shin.L': [58, 0, 0], 'thigh.R': [2, 0, -12] }), [0, -0.17, 0.14], 'out'),
      key(0.5, I(), [0, -0.14, 0], 'inOut'),
    ],
  };
};

/** the tail lash: a whirl on the spot that brings the tail round through the front at hip height */
const lash: ClipDef = {
  name: 'lz_lash', dur: 0.62, fadeIn: 0.04, fadeOut: 0.2, events: { step: 0.06, hit: 0.24, combo: 0.38 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@spin': [0, 0, 0] } },
      { t: 0.08, cease: 'out', c: { '@spin': [-26, 0, 0] } },
      { t: 0.38, cease: 'inOut', c: { '@spin': [360, 0, 0] } },
      { t: 0.62, c: { '@spin': [360, 0, 0] } },
    ],
    [
      key(0, I()),
      key(0.08, I({ hips: [10, -20, 0], spine: [10, -10, 0], chest: [6, -12, 0], tail1: [10, 40, 0], tail2: [0, 20, 0] }), [0, -0.14, 0], 'out'),
      key(0.22, I({ hips: [6, 0, 0], spine: [8, 0, 0], chest: [4, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-20, 0, 70], 'upperarm.R': [-20, 0, -70], 'forearm.L': [-10, 0, 0], 'forearm.R': [-10, 0, 0], tail1: [-14, -50, 0], tail2: [-4, -26, 0], tail3: [0, -16, 0] }), [0, -0.1, 0], 'linear'),
      key(0.38, I({ tail1: [0, -20, 0], tail2: [0, -10, 0] }), [0, -0.13, 0], 'out'),
      key(0.62, I(), [0, -0.14, 0], 'inOut'),
    ],
  ),
};

/** both hands up together and down on the target's head */
const maul: ClipDef = {
  name: 'lz_maul', dur: 0.78, fadeIn: 0.05, fadeOut: 0.24, events: { step: 0.12, hit: 0.31, fx: 0.31, combo: 0.48 },
  keys: [
    key(0, I()),
    key(0.18, I({ hips: [-4, 0, 0], spine: [-10, 0, 0], chest: [-14, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-170, 0, 18], 'upperarm.R': [-170, 0, -18], 'forearm.L': [-30, 0, 0], 'forearm.R': [-30, 0, 0], 'hand.L': [-20, 0, 0], 'hand.R': [-20, 0, 0], 'thigh.L': [-46, 0, 10], 'shin.L': [70, 0, 0], 'thigh.R': [-30, 0, -12], 'shin.R': [62, 0, 0], tail1: [24, 0, 0] }), [0, 0.04, 0], 'out'),
    key(0.31, I({ hips: [24, 0, 0], spine: [28, 0, 0], chest: [18, 0, 0], head: [-34, 0, 0], 'upperarm.L': [-60, 0, 12], 'upperarm.R': [-60, 0, -12], 'forearm.L': [-6, 0, 0], 'forearm.R': [-6, 0, 0], 'hand.L': [20, 0, 0], 'hand.R': [20, 0, 0], 'thigh.L': [-62, 0, 10], 'shin.L': [66, 0, 0], 'thigh.R': [16, 0, -12], 'shin.R': [50, 0, 0], tail1: [-6, 0, 0] }), [0, -0.26, 0.16], 'outExpo'),
    key(0.5, I({ hips: [24, 0, 0], spine: [28, 0, 0], chest: [18, 0, 0], head: [-34, 0, 0], 'upperarm.L': [-54, 0, 14], 'upperarm.R': [-54, 0, -14], 'thigh.L': [-60, 0, 10], 'shin.L': [64, 0, 0], 'thigh.R': [14, 0, -12], 'shin.R': [48, 0, 0] }), [0, -0.26, 0.16], 'out'),
    key(0.78, I(), [0, -0.14, 0], 'inOut'),
  ],
};

/** RMB: dropped low, the tail laid out flat and swung once all the way round */
const sweep: ClipDef = {
  name: 'lz_sweep', dur: 0.95, fadeIn: 0.05, fadeOut: 0.26, events: { step: 0.1, fx: 0.18, hit: 0.42, end: 0.66 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@spin': [0, 0, 0] } },
      { t: 0.14, cease: 'out', c: { '@spin': [-30, 0, 0] } },
      { t: 0.66, cease: 'inOut', c: { '@spin': [360, 0, 0] } },
      { t: 0.95, c: { '@spin': [360, 0, 0] } },
    ],
    [
      key(0, I()),
      key(0.14, I({ hips: [28, -20, 0], spine: [24, -8, 0], chest: [14, -8, 0], head: [-34, 10, 0], 'thigh.L': [-66, 0, 14], 'shin.L': [86, 0, 0], 'thigh.R': [-42, 0, -16], 'shin.R': [80, 0, 0], 'upperarm.L': [-60, 0, 60], 'upperarm.R': [-60, 0, -60], tail1: [-10, 30, 0], tail2: [-6, 16, 0] }), [0, -0.3, 0], 'out'),
      key(0.4, I({ hips: [28, 0, 0], spine: [24, 0, 0], chest: [14, 0, 0], head: [-34, 0, 0], 'thigh.L': [-66, 0, 14], 'shin.L': [86, 0, 0], 'thigh.R': [-42, 0, -16], 'shin.R': [80, 0, 0], 'upperarm.L': [-40, 0, 80], 'upperarm.R': [-40, 0, -80], 'forearm.L': [-6, 0, 0], 'forearm.R': [-6, 0, 0], tail1: [-26, -34, 0], tail2: [-8, -18, 0], tail3: [-4, -10, 0] }), [0, -0.32, 0], 'linear'),
      key(0.66, I({ hips: [24, 0, 0], spine: [22, 0, 0], chest: [12, 0, 0], head: [-30, 0, 0], 'thigh.L': [-60, 0, 12], 'shin.L': [80, 0, 0], 'thigh.R': [-38, 0, -14], 'shin.R': [76, 0, 0], tail1: [-12, -16, 0] }), [0, -0.28, 0], 'out'),
      key(0.95, I(), [0, -0.14, 0], 'inOut'),
    ],
  ),
};

/** Q: the two-finger Cero — the right arm out straight at the target, the left hand clamped on its forearm */
const cero: ClipDef = {
  name: 'lz_cero', dur: 1.5, fadeIn: 0.08, fadeOut: 0.28, events: { charge: 0.14 },
  keys: [
    key(0, I()),
    key(0.14, I({ hips: [8, 22, 0], spine: [6, 10, 0], chest: [0, 14, 0], head: [-6, -32, 0], 'upperarm.R': [-90, 0, 4], 'forearm.R': [-4, 0, 0], 'hand.R': [0, 0, 0], 'upperarm.L': [-72, 0, -16], 'forearm.L': [-70, 0, 0], 'hand.L': [10, 0, 0], 'thigh.L': [-46, 0, 10], 'shin.L': [52, 0, 0], 'thigh.R': [0, 0, -14], 'shin.R': [36, 0, 0], tail1: [-4, 0, 0] }), [0, -0.16, 0.04], 'out'),
    key(1.25, I({ hips: [8, 22, 0], spine: [6, 10, 0], chest: [0, 14, 0], head: [-6, -32, 0], 'upperarm.R': [-92, 0, 4], 'forearm.R': [-2, 0, 0], 'hand.R': [0, 0, 0], 'upperarm.L': [-72, 0, -16], 'forearm.L': [-72, 0, 0], 'hand.L': [10, 0, 0], 'thigh.L': [-48, 0, 10], 'shin.L': [54, 0, 0], 'thigh.R': [2, 0, -14], 'shin.R': [36, 0, 0], tail1: [-4, 0, 0] }), [0, -0.17, 0.02], 'linear'),
    key(1.5, I(), [0, -0.14, 0], 'inOut'),
  ],
};

/** E: High-Speed Regeneration — the back arched, the arms flung out, white matter welling into every wound */
const regen: ClipDef = {
  name: 'lz_regen', dur: 1.0, fadeIn: 0.06, fadeOut: 0.26, events: { heal: 0.32 },
  keys: [
    key(0, I()),
    key(0.32, I({ hips: [-4, 0, 0], spine: [-14, 0, 0], chest: [-18, 0, 0], neck: [-14, 0, 0], head: [-26, 0, 0], 'upperarm.L': [-30, 0, 96], 'upperarm.R': [-30, 0, -96], 'forearm.L': [-20, 0, 0], 'forearm.R': [-20, 0, 0], 'hand.L': [-30, 0, 0], 'hand.R': [-30, 0, 0], 'thigh.L': [-24, 0, 14], 'shin.L': [34, 0, 0], 'thigh.R': [-14, 0, -14], 'shin.R': [30, 0, 0], tail1: [30, 0, 0], tail2: [10, 0, 0] }), [0, -0.04, 0], 'out'),
    key(0.62, I({ hips: [-2, 0, 0], spine: [-10, 0, 0], chest: [-14, 0, 0], neck: [-10, 0, 0], head: [-22, 0, 0], 'upperarm.L': [-30, 0, 90], 'upperarm.R': [-30, 0, -90], 'forearm.L': [-24, 0, 0], 'forearm.R': [-24, 0, 0], tail1: [26, 0, 0] }), [0, -0.05, 0], 'inOut'),
    key(1.0, I(), [0, -0.14, 0], 'inOut'),
  ],
};

/** R: the arm-maw — the left shoulder driven forward at the target as the worm comes out of the stump */
const maw: ClipDef = {
  name: 'lz_maw', dur: 1.7, fadeIn: 0.05, fadeOut: 0.3, events: { drop: 0.14, lunge: 0.3, regrow: 1.3 },
  keys: [
    key(0, I()),
    key(0.14, I({ hips: [10, 10, 0], spine: [14, 6, 0], chest: [20, 10, 6], head: [-24, -10, 0], 'upperarm.L': [-60, 0, 50], 'upperarm.R': [-10, 0, -40] }), [0, -0.14, 0], 'outExpo'),
    key(0.3, I({ hips: [16, -26, 0], spine: [18, -16, 0], chest: [14, -30, -8], head: [-30, 34, 0], 'upperarm.R': [10, 0, -50], 'forearm.R': [-50, 0, 0], 'thigh.L': [-56, 0, 10], 'shin.L': [60, 0, 0], 'thigh.R': [6, 0, -12], 'shin.R': [40, 0, 0], tail1: [-6, 30, 0] }), [0, -0.18, 0.1], 'outExpo'),
    key(1.0, I({ hips: [16, -24, 0], spine: [18, -16, 0], chest: [14, -28, -8], head: [-30, 32, 0], 'upperarm.R': [8, 0, -48], 'forearm.R': [-48, 0, 0], 'thigh.L': [-54, 0, 10], 'shin.L': [58, 0, 0], 'thigh.R': [4, 0, -12], tail1: [-6, 24, 0] }), [0, -0.18, 0.1], 'linear'),
    key(1.3, I({ hips: [8, 0, 0], spine: [10, 0, 0], chest: [4, 0, 6], head: [-12, 0, 0], 'upperarm.L': [-80, 0, 70], 'forearm.L': [-40, 0, 0] }), [0, -0.12, 0], 'out'),
    key(1.7, I(), [0, -0.14, 0], 'inOut'),
  ],
};

/** G: the roar — the head thrown back, then thrust forward with the jaws wide */
const roar: ClipDef = {
  name: 'lz_roar', dur: 1.15, fadeIn: 0.06, fadeOut: 0.3, events: { roar: 0.36 },
  keys: [
    key(0, I()),
    key(0.2, I({ hips: [4, 0, 0], spine: [-6, 0, 0], chest: [-14, 0, 0], neck: [-14, 0, 0], head: [-30, 0, 0], 'upperarm.L': [10, 0, 50], 'upperarm.R': [10, 0, -50], 'forearm.L': [-50, 0, 0], 'forearm.R': [-50, 0, 0], tail1: [24, 0, 0] }), [0, -0.08, -0.04], 'out'),
    key(0.36, I({ hips: [20, 0, 0], spine: [24, 0, 0], chest: [16, 0, 0], neck: [6, 0, 0], head: [-34, 0, 0], 'upperarm.L': [30, 0, 40], 'upperarm.R': [30, 0, -40], 'forearm.L': [-60, 0, 0], 'forearm.R': [-60, 0, 0], 'hand.L': [-30, 0, 0], 'hand.R': [-30, 0, 0], 'thigh.L': [-56, 0, 14], 'shin.L': [70, 0, 0], 'thigh.R': [-34, 0, -14], 'shin.R': [66, 0, 0], tail1: [36, 0, 0], tail2: [12, 0, 0] }), [0, -0.24, 0.08], 'outExpo'),
    key(0.85, I({ hips: [20, 0, 0], spine: [24, 0, 0], chest: [16, 0, 0], neck: [6, 0, 0], head: [-32, 0, 0], 'upperarm.L': [30, 0, 40], 'upperarm.R': [30, 0, -40], 'forearm.L': [-60, 0, 0], 'forearm.R': [-60, 0, 0], 'thigh.L': [-54, 0, 14], 'shin.L': [68, 0, 0], 'thigh.R': [-32, 0, -14], 'shin.R': [64, 0, 0], tail1: [34, 0, 0] }), [0, -0.24, 0.08], 'linear'),
    key(1.15, I(), [0, -0.14, 0], 'inOut'),
  ],
};

/** F: the shed — doubled over, convulsing as the husk cracks from the shoulders, then flung upright as it bursts */
const shed: ClipDef = {
  name: 'lz_shed', dur: 1.9, fadeIn: 0.05, fadeOut: 0.3, events: { crack: 0.3, crack2: 0.7, crack3: 1.08, burst: 1.42 },
  keys: [
    key(0, I()),
    key(0.3, I({ hips: [30, 0, 0], spine: [34, 0, 6], chest: [24, 0, 8], head: [-6, 0, 0], 'upperarm.L': [-40, 0, 20], 'upperarm.R': [-40, 0, -20], 'forearm.L': [-90, 0, 0], 'forearm.R': [-90, 0, 0], 'thigh.L': [-70, 0, 12], 'shin.L': [100, 0, 0], 'thigh.R': [-56, 0, -12], 'shin.R': [96, 0, 0] }), [0, -0.36, 0], 'outExpo'),
    key(0.7, I({ hips: [34, 0, 0], spine: [38, 0, -8], chest: [28, 0, -10], head: [0, 0, 0], 'upperarm.L': [-30, 0, 30], 'upperarm.R': [-30, 0, -30], 'forearm.L': [-96, 0, 0], 'forearm.R': [-96, 0, 0], 'thigh.L': [-72, 0, 12], 'shin.L': [104, 0, 0], 'thigh.R': [-58, 0, -12], 'shin.R': [100, 0, 0] }), [0, -0.38, 0], 'outExpo'),
    key(1.08, I({ hips: [30, 0, 0], spine: [34, 0, 8], chest: [22, 0, 10], head: [-4, 0, 0], 'upperarm.L': [-44, 0, 22], 'upperarm.R': [-44, 0, -22], 'forearm.L': [-92, 0, 0], 'forearm.R': [-92, 0, 0], 'thigh.L': [-70, 0, 12], 'shin.L': [100, 0, 0], 'thigh.R': [-56, 0, -12], 'shin.R': [98, 0, 0] }), [0, -0.37, 0], 'outExpo'),
    key(1.42, I({ hips: [-6, 0, 0], spine: [-12, 0, 0], chest: [-16, 0, 0], neck: [-10, 0, 0], head: [-24, 0, 0], 'upperarm.L': [-20, 0, 100], 'upperarm.R': [-20, 0, -100], 'forearm.L': [-10, 0, 0], 'forearm.R': [-10, 0, 0], 'thigh.L': [-20, 0, 14], 'shin.L': [26, 0, 0], 'thigh.R': [-10, 0, -14], 'shin.R': [22, 0, 0] }), [0, 0, 0], 'outExpo'),
    key(1.9, I({ hips: [4, 0, 0], spine: [4, 0, 0], chest: [2, 0, 0], head: [-6, 0, 0] }), [0, -0.06, 0], 'inOut'),
  ],
};

/** Shift: the lunge — low and flat, both claws forward, the tail streaming behind */
const dash: ClipDef = {
  name: 'dash', dur: 0.3, fadeIn: 0.03, fadeOut: 0.14,
  keys: [
    key(0, { hips: [30, 0, 0], spine: [28, 0, 0], chest: [14, 0, 0], head: [-44, 0, 0], 'thigh.L': [-84, 0, 8], 'shin.L': [84, 0, 0], 'foot.L': [10, 0, 0], 'thigh.R': [40, 0, -8], 'shin.R': [70, 0, 0], 'foot.R': [20, 0, 0], 'upperarm.L': [-70, 0, 24], 'forearm.L': [-30, 0, 0], 'upperarm.R': [-70, 0, -24], 'forearm.R': [-30, 0, 0], tail1: [-14, 0, 0] }, [0, -0.24, 0]),
    key(0.3, { hips: [32, 0, 0], spine: [30, 0, 0], chest: [14, 0, 0], head: [-46, 0, 0], 'thigh.L': [-80, 0, 8], 'shin.L': [88, 0, 0], 'thigh.R': [42, 0, -8], 'shin.R': [74, 0, 0], 'upperarm.L': [-74, 0, 24], 'forearm.L': [-32, 0, 0], 'upperarm.R': [-74, 0, -24], 'forearm.R': [-32, 0, 0], tail1: [-16, 0, 0] }, [0, -0.25, 0]),
  ],
};

export const LIZARD_CLIPS: ClipDef[] = [
  rake('lz_rake', false), rake('lz_rake2', true), lash, maul, sweep, cero, regen, maw, roar, shed, dash,
  ...ICHIGO_CLIPS.filter((c) => ['airstep', 'hit_heavy'].includes(c.name)),
];
export const LIZARD_CHAIN = ['lz_rake', 'lz_rake2', 'lz_lash', 'lz_maul'];
