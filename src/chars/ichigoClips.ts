// Ichigo (Zangetsu, Shikai) animation set. Sword arm via IK swing arcs (anim/swing.ts), body via
// FK keys. Timing follows anticipation → fast strike (outExpo) → follow-through → recovery; events:
// 'hit' (damage frame), 'fx' (effect spawn), 'combo' (next input accepted), 'step' (lunge impulse).
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';

const SH: [number, number, number] = [-0.2, 0.17, 0.02]; // right shoulder-ish swing centre (chest space)

export const ICHIGO_STANCE: StanceDef = {
  idle: {
    hips: [0, -12, 0],
    spine: [4, 4, 0],
    chest: [2, 8, 0],
    head: [3, 2, 0],
    'thigh.L': [-12, 0, 5], 'shin.L': [14, 0, 0], 'foot.L': [-2, 0, 0],
    'thigh.R': [10, 0, -6], 'shin.R': [16, 0, 0], 'foot.R': [-8, 0, 0],
    'upperarm.L': [8, 0, 13], 'forearm.L': [-22, 0, 0], 'hand.L': [6, 0, 0],
  },
  idleHips: -0.035,
  run: { 'upperarm.L': [-6, 0, 4], chest: [0, 6, 0] },
  sprint: { 'upperarm.L': [12, 0, 10], 'forearm.L': [-30, 0, 0] },
  swingL: 1,
  swingR: 0.2,
  grip: {
    idle: { p: [-0.27, -0.31, 0.2], dir: [-0.12, -0.5, 0.86], edge: [0.1, -0.85, -0.5], pole: [-0.55, -0.3, -0.8] },
    walk: { p: [-0.28, -0.3, 0.15], dir: [-0.15, -0.62, 0.77], edge: [0.1, -0.78, -0.62], pole: [-0.55, -0.3, -0.8] },
    run: { p: [-0.3, -0.26, -0.06], dir: [-0.22, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.29, -0.16, -0.16], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.38, -0.08, 0.12], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

/** Body key helper. */
function body(t: number, b: KeyDef['b'], hips?: KeyDef['hips'], ease?: KeyDef['ease']): KeyDef {
  return { t, b, hips, ease };
}

// ------------------------------------------------------------------ light combo

// 1: forehand horizontal slash, right → left
const slash1: ClipDef = {
  name: 'slash1',
  dur: 0.62,
  fadeIn: 0.06,
  fadeOut: 0.22,
  events: { step: 0.08, hit: 0.15, combo: 0.26 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [1, -0.12, 0], c: SH, r: 0.36, pole: [-0.5, -0.65, -0.55],
      keys: [[0, -70, 'out'], [0.1, -128, 'out'], [0.17, 25, 'outExpo'], [0.3, 105, 'out'], [0.62, 70, 'inOut']],
    }),
    [
      body(0, { hips: [0, -12, 0], spine: [4, 0, 0], chest: [2, 6, 0] }),
      body(0.1, { hips: [0, -24, 0], spine: [2, -18, 0], chest: [-4, -26, 4], 'thigh.L': [-14, 0, 6], 'thigh.R': [12, 0, -6], 'shin.R': [20, 0, 0], head: [0, 20, 0] }, [0, -0.05, -0.02], 'out'),
      body(0.17, { hips: [0, 14, 0], spine: [8, 16, 0], chest: [6, 26, -4], 'thigh.L': [-30, 0, 6], 'shin.L': [26, 0, 0], 'thigh.R': [24, 0, -4], 'shin.R': [26, 0, 0], head: [0, -18, 0], 'upperarm.L': [-10, 0, 28], 'forearm.L': [-30, 0, 0] }, [0, -0.08, 0.06], 'outExpo'),
      body(0.3, { hips: [0, 22, 0], spine: [10, 20, 0], chest: [8, 30, -4], 'thigh.L': [-28, 0, 6], 'thigh.R': [22, 0, -4], head: [0, -24, 0], 'upperarm.L': [-6, 0, 30], 'forearm.L': [-34, 0, 0] }, [0, -0.09, 0.08], 'out'),
      body(0.62, { hips: [0, -8, 0], spine: [4, 2, 0], chest: [2, 8, 0], 'thigh.L': [-12, 0, 5], 'thigh.R': [10, 0, -6], head: [3, 0, 0], 'upperarm.L': [8, 0, 13] }, [0, -0.035, 0], 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.3, 0, 0] } }],
  ),
};

// 2: backhand rising diagonal, lower-left → upper-right
const slash2: ClipDef = {
  name: 'slash2',
  dur: 0.6,
  fadeIn: 0.05,
  fadeOut: 0.22,
  events: { step: 0.06, hit: 0.15, combo: 0.26 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [-0.85, 0.52, 0], c: [-0.08, 0.1, 0.06], r: 0.36, pole: [-0.3, -0.4, -0.85],
      keys: [[0, -150, 'out'], [0.09, -120, 'out'], [0.16, 45, 'outExpo'], [0.3, 115, 'out'], [0.6, 70, 'inOut']],
    }),
    [
      body(0, { hips: [0, 18, 0], spine: [8, 16, 0], chest: [6, 24, -4] }),
      body(0.09, { hips: [0, 26, 0], spine: [10, 22, 6], chest: [10, 30, 8], 'thigh.L': [-20, 0, 8], 'shin.L': [30, 0, 0], 'thigh.R': [18, 0, -4], head: [4, -22, 0] }, [0, -0.1, 0], 'out'),
      body(0.16, { hips: [0, -18, 0], spine: [-2, -20, -4], chest: [-10, -28, -10], 'thigh.L': [-8, 0, 6], 'thigh.R': [-6, 0, -10], 'shin.R': [12, 0, 0], head: [-6, 22, 0], 'upperarm.L': [20, 0, 30] }, [0, -0.02, 0.05], 'outExpo'),
      body(0.3, { hips: [0, -22, 0], spine: [-4, -22, -4], chest: [-12, -30, -10], head: [-8, 24, 0], 'upperarm.L': [24, 0, 34] }, [0, -0.01, 0.06], 'out'),
      body(0.6, { hips: [0, -12, 0], spine: [4, 4, 0], chest: [2, 8, 0], head: [3, 2, 0], 'upperarm.L': [8, 0, 13], 'thigh.L': [-12, 0, 5], 'thigh.R': [10, 0, -6] }, [0, -0.035, 0], 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.3, 0, 0] } }],
  ),
};

// 3: two-handed overhead chop that cracks the ground
const slash3: ClipDef = {
  name: 'slash3',
  dur: 0.82,
  fadeIn: 0.07,
  fadeOut: 0.25,
  events: { step: 0.2, hit: 0.27, fx: 0.27, combo: 0.42 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0, -1, 0], c: [-0.04, 0.22, 0.12], r: 0.4, pole: [-0.7, -0.2, -0.65],
      keys: [[0, 20, 'out'], [0.16, -146, 'out'], [0.22, -140, 'linear'], [0.27, 4, 'outExpo'], [0.42, 16, 'out'], [0.82, 40, 'inOut']],
      twoHand: [0.3, 1, 1, 1, 1, 0.2],
    }),
    [
      body(0, { hips: [0, -8, 0], spine: [4, 0, 0], chest: [2, 4, 0] }),
      body(0.16, { hips: [0, -4, 0], spine: [-10, 0, 0], chest: [-14, 4, 0], neck: [-6, 0, 0], head: [-10, 0, 0], 'thigh.L': [-6, 0, 4], 'thigh.R': [6, 0, -4], 'shin.L': [8, 0, 0] }, [0, 0.03, -0.03], 'out'),
      body(0.22, { spine: [-12, 0, 0], chest: [-16, 4, 0], head: [-12, 0, 0] }, [0, 0.04, -0.03], 'linear'),
      body(0.27, { hips: [8, 0, 0], spine: [22, 0, 0], chest: [18, 2, 0], neck: [6, 0, 0], head: [-14, 0, 0], 'thigh.L': [-46, 0, 6], 'shin.L': [50, 0, 0], 'foot.L': [-4, 0, 0], 'thigh.R': [26, 0, -4], 'shin.R': [30, 0, 0], 'foot.R': [-10, 0, 0] }, [0, -0.12, 0.1], 'outExpo'),
      body(0.42, { hips: [10, 0, 0], spine: [24, 0, 0], chest: [20, 2, 0], head: [-14, 0, 0], 'thigh.L': [-48, 0, 6], 'shin.L': [52, 0, 0], 'thigh.R': [28, 0, -4], 'shin.R': [32, 0, 0] }, [0, -0.13, 0.11], 'out'),
      body(0.82, { hips: [0, -12, 0], spine: [4, 4, 0], chest: [2, 8, 0], neck: [0, 0, 0], head: [3, 2, 0], 'thigh.L': [-12, 0, 5], 'shin.L': [14, 0, 0], 'foot.L': [-2, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [16, 0, 0], 'foot.R': [-8, 0, 0] }, [0, -0.035, 0], 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.2, 0, 0] } }],
  ),
};

// 4: spinning slash — blade held out to the right, full turn to the left
const slash4: ClipDef = {
  name: 'slash4',
  dur: 0.78,
  fadeIn: 0.06,
  fadeOut: 0.22,
  events: { step: 0.05, hit: 0.2, hit2: 0.36, combo: 0.46 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [1, -0.1, 0], c: SH, r: 0.42, pole: [-0.3, -0.9, -0.2],
      keys: [[0, -60, 'out'], [0.08, -100, 'out'], [0.46, -95, 'linear'], [0.78, -60, 'inOut']],
    }),
    [
      body(0, { hips: [0, -10, 0], spine: [4, 0, 0], chest: [2, 4, 0] }),
      body(0.08, { hips: [0, -20, 0], spine: [6, -14, 0], chest: [4, -20, 0], 'thigh.L': [-16, 0, 10], 'shin.L': [26, 0, 0], 'thigh.R': [14, 0, -10], 'shin.R': [26, 0, 0], 'upperarm.L': [0, 0, 50] }, [0, -0.1, 0], 'out'),
      body(0.46, { hips: [0, 10, 0], spine: [8, 10, 0], chest: [6, 14, 0], 'upperarm.L': [0, 0, 60], 'thigh.L': [-16, 0, 10], 'thigh.R': [14, 0, -10] }, [0, -0.1, 0], 'linear'),
      body(0.78, { hips: [0, -12, 0], spine: [4, 4, 0], chest: [2, 8, 0], 'upperarm.L': [8, 0, 13], 'thigh.L': [-12, 0, 5], 'shin.L': [14, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [16, 0, 0] }, [0, -0.035, 0], 'inOut'),
    ],
    [
      { t: 0, c: { '@spin': [0, 0, 0], '@look': [0, 0, 0] } },
      { t: 0.08, c: { '@spin': [-20, 0, 0] }, ease: 'out' },
      { t: 0.46, c: { '@spin': [360, 0, 0] }, ease: 'inOut' },
      { t: 0.78, c: { '@spin': [360, 0, 0], '@look': [0.4, 0, 0] } },
    ],
  ),
};

// 5: finisher — leap and diagonal slam
const slash5: ClipDef = {
  name: 'slash5',
  dur: 1.0,
  fadeIn: 0.06,
  fadeOut: 0.3,
  events: { step: 0.14, hit: 0.4, fx: 0.4 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0.62, -0.78, 0], c: [-0.05, 0.22, 0.1], r: 0.42, pole: [-0.7, -0.3, -0.6],
      keys: [[0, -40, 'out'], [0.3, -132, 'out'], [0.34, -128, 'linear'], [0.4, 8, 'outExpo'], [0.6, 22, 'out'], [1, 40, 'inOut']],
      twoHand: [0.4, 1, 1, 1, 1, 0.2],
    }),
    [
      body(0, { hips: [0, -10, 0] }),
      body(0.14, { hips: [10, 0, 0], spine: [16, 0, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [60, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [50, 0, 0] }, [0, -0.2, 0], 'out'),
      body(0.3, { hips: [-6, -20, 0], spine: [-14, -10, 0], chest: [-18, -14, 6], head: [-12, 10, 0], 'thigh.L': [-70, 0, 8], 'shin.L': [100, 0, 0], 'thigh.R': [-30, 0, -8], 'shin.R': [90, 0, 0], 'foot.L': [20, 0, 0], 'foot.R': [20, 0, 0] }, [0, 0.05, 0], 'out'),
      body(0.34, { spine: [-16, -12, 0], chest: [-20, -16, 6] }, [0, 0.05, 0], 'linear'),
      body(0.4, { hips: [10, 14, 0], spine: [24, 12, 0], chest: [20, 18, -8], head: [-16, -10, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [54, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [36, 0, 0], 'foot.L': [-4, 0, 0], 'foot.R': [-12, 0, 0] }, [0, -0.14, 0.1], 'outExpo'),
      body(0.6, { hips: [12, 16, 0], spine: [26, 14, 0], chest: [22, 20, -8], head: [-18, -10, 0] }, [0, -0.15, 0.11], 'out'),
      body(1, { hips: [0, -12, 0], spine: [4, 4, 0], chest: [2, 8, 0], head: [3, 2, 0], 'thigh.L': [-12, 0, 5], 'shin.L': [14, 0, 0], 'foot.L': [-2, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [16, 0, 0], 'foot.R': [-8, 0, 0] }, [0, -0.035, 0], 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.2, 0, 0] } }],
  ),
};

// ------------------------------------------------------------------ specials

// Getsuga Tenshō: blade raised over the right shoulder (charge), diagonal release down-left
const getsuga: ClipDef = {
  name: 'getsuga',
  dur: 1.15,
  fadeIn: 0.1,
  fadeOut: 0.3,
  events: { charge: 0.05, fx: 0.5, hit: 0.5 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0.78, -0.62, 0], c: [-0.08, 0.2, 0.08], r: 0.42, pole: [-0.75, -0.1, -0.65],
      keys: [[0, -40, 'out'], [0.3, -134, 'out'], [0.44, -128, 'inOut'], [0.5, 36, 'outExpo'], [0.7, 62, 'out'], [1.15, 40, 'inOut']],
    }),
    [
      body(0, { hips: [0, -10, 0] }),
      body(0.3, { hips: [0, -28, 0], spine: [-4, -16, 0], chest: [-10, -24, 8], neck: [0, 6, 0], head: [-4, 24, 0], 'thigh.L': [-20, 0, 12], 'shin.L': [30, 0, 0], 'thigh.R': [16, 0, -10], 'shin.R': [30, 0, 0], 'upperarm.L': [-40, 0, 30], 'forearm.L': [-20, 0, 0], 'hand.L': [-20, 0, 0] }, [0, -0.1, -0.03], 'out'),
      body(0.44, { hips: [0, -30, 0], spine: [-6, -18, 0], chest: [-12, -26, 10], head: [-6, 26, 0] }, [0, -0.11, -0.03], 'inOut'),
      body(0.5, { hips: [6, 18, 0], spine: [16, 18, 0], chest: [18, 28, -10], head: [-12, -24, 0], 'thigh.L': [-40, 0, 12], 'shin.L': [40, 0, 0], 'thigh.R': [24, 0, -10], 'shin.R': [30, 0, 0], 'upperarm.L': [20, 0, 40], 'forearm.L': [-10, 0, 0] }, [0, -0.12, 0.08], 'outExpo'),
      body(0.7, { hips: [8, 22, 0], spine: [18, 20, 0], chest: [20, 30, -10], head: [-12, -26, 0] }, [0, -0.13, 0.09], 'out'),
      body(1.15, { hips: [0, -12, 0], spine: [4, 4, 0], chest: [2, 8, 0], neck: [0, 0, 0], head: [3, 2, 0], 'thigh.L': [-12, 0, 5], 'shin.L': [14, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [16, 0, 0], 'upperarm.L': [8, 0, 13], 'forearm.L': [-22, 0, 0], 'hand.L': [6, 0, 0] }, [0, -0.035, 0], 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.5, 0, 0] } }, { t: 0.5, c: { '@look': [0.2, 0, 0] } }],
  ),
};

// Bankai release: sword arm thrust forward, left hand grips the right forearm ("Ban... kai!")
const release: ClipDef = {
  name: 'release',
  dur: 1.6,
  fadeIn: 0.15,
  fadeOut: 0.35,
  events: { fx: 0.55, burst: 0.9 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@gripR': [-0.27, -0.31, 0.2], '@dirR': [-0.12, -0.5, 0.86], '@edgeR': [0.1, -0.85, -0.5], '@poleR': [-0.55, -0.3, -0.8], '@ikR': [1, 0, 0] } },
      { t: 0.45, ease: 'out', c: { '@gripR': [-0.12, 0.13, 0.6], '@dirR': [0.15, 0.05, 0.99], '@edgeR': [0, -1, 0], '@poleR': [-0.7, -0.6, 0], '@ikR': [1, 0, 0] } },
      { t: 1.6, ease: 'inOut', c: { '@gripR': [-0.13, 0.12, 0.58], '@dirR': [0.15, 0.05, 0.99], '@edgeR': [0, -1, 0], '@poleR': [-0.7, -0.6, 0], '@ikR': [1, 0, 0] } },
    ],
    [
      body(0, { hips: [0, -10, 0] }),
      body(0.45, { hips: [0, -30, 0], spine: [2, -10, 0], chest: [0, -12, 0], head: [0, 26, 0], 'thigh.L': [-22, 0, 10], 'shin.L': [26, 0, 0], 'thigh.R': [18, 0, -10], 'shin.R': [24, 0, 0], 'upperarm.L': [-70, 0, -18], 'forearm.L': [-62, 0, 0], 'hand.L': [0, 0, 0] }, [0, -0.08, 0], 'out'),
      body(0.9, { hips: [0, -32, 0], spine: [0, -12, 0], chest: [-4, -14, 0], head: [-4, 30, 0], 'thigh.L': [-26, 0, 12], 'shin.L': [30, 0, 0], 'thigh.R': [20, 0, -12], 'shin.R': [28, 0, 0], 'upperarm.L': [-74, 0, -20], 'forearm.L': [-64, 0, 0] }, [0, -0.1, 0], 'inOut'),
      body(1.6, { hips: [0, -30, 0], spine: [2, -10, 0], chest: [0, -12, 0], head: [0, 26, 0], 'upperarm.L': [-72, 0, -18], 'forearm.L': [-62, 0, 0] }, [0, -0.09, 0], 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0, 0, 0] } }],
  ),
};

// Shunpo burst pose: strong forward lean, blade trailing
const dash: ClipDef = {
  name: 'dash',
  dur: 0.32,
  fadeIn: 0.04,
  fadeOut: 0.16,
  keys: mergeKeys(
    [
      { t: 0, c: { '@gripR': [-0.3, -0.12, -0.22], '@dirR': [-0.25, 0.05, -0.97], '@edgeR': [0, -1, 0], '@poleR': [-0.8, -0.1, 0.5], '@ikR': [1, 0, 0] } },
      { t: 0.32, c: { '@gripR': [-0.3, -0.14, -0.2], '@dirR': [-0.25, 0, -0.97], '@edgeR': [0, -1, 0], '@poleR': [-0.8, -0.1, 0.5], '@ikR': [1, 0, 0] } },
    ],
    [
      body(0, { hips: [18, 0, 0], spine: [16, 0, 0], chest: [12, 0, 0], head: [-26, 0, 0], 'thigh.L': [-70, 0, 4], 'shin.L': [60, 0, 0], 'foot.L': [10, 0, 0], 'thigh.R': [40, 0, -4], 'shin.R': [70, 0, 0], 'foot.R': [20, 0, 0], 'upperarm.L': [30, 0, 20], 'forearm.L': [-40, 0, 0] }, [0, -0.12, 0]),
      body(0.32, { hips: [20, 0, 0], spine: [18, 0, 0], chest: [12, 0, 0], head: [-28, 0, 0], 'thigh.L': [-66, 0, 4], 'shin.L': [64, 0, 0], 'thigh.R': [42, 0, -4], 'shin.R': [72, 0, 0], 'upperarm.L': [34, 0, 22], 'forearm.L': [-44, 0, 0] }, [0, -0.13, 0]),
    ],
  ),
};

// Air step: a quick push off a reishi foothold
const airstep: ClipDef = {
  name: 'airstep',
  dur: 0.36,
  fadeIn: 0.04,
  fadeOut: 0.18,
  keys: [
    body(0, { 'thigh.L': [-60, 0, 6], 'shin.L': [90, 0, 0], 'thigh.R': [-10, 0, -6], 'shin.R': [30, 0, 0], spine: [8, 0, 0] }, [0, 0.02, 0]),
    body(0.12, { 'thigh.L': [-10, 0, 6], 'shin.L': [10, 0, 0], 'foot.L': [30, 0, 0], 'thigh.R': [-50, 0, -6], 'shin.R': [80, 0, 0], spine: [4, 0, 0] }, [0, 0, 0], 'outExpo'),
    body(0.36, { 'thigh.L': [-30, 0, 6], 'shin.L': [50, 0, 0], 'thigh.R': [-30, 0, -6], 'shin.R': [60, 0, 0], spine: [6, 0, 0] }, [0, 0, 0], 'out'),
  ],
};

// Heavy hit reaction: thrown back
const hitHeavy: ClipDef = {
  name: 'hit_heavy',
  dur: 0.7,
  fadeIn: 0.03,
  fadeOut: 0.25,
  keys: [
    body(0, { spine: [-20, 0, 0], chest: [-24, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-20, 0, 50] }, [0, 0, -0.05]),
    body(0.12, { spine: [-26, 0, 6], chest: [-30, 6, 6], head: [-20, -10, 0], 'upperarm.L': [-40, 0, 70], 'forearm.L': [-30, 0, 0], 'thigh.L': [-30, 0, 8], 'shin.L': [40, 0, 0] }, [0, -0.06, -0.08], 'outExpo'),
    body(0.7, { spine: [4, 0, 0], chest: [2, 8, 0], head: [3, 2, 0], 'upperarm.L': [8, 0, 13], 'forearm.L': [-22, 0, 0], 'thigh.L': [-12, 0, 5], 'shin.L': [14, 0, 0] }, [0, -0.035, 0], 'inOut'),
  ],
};

// Hollow mask: the left hand sweeps down over the face and the mask forms behind it
const maskOn: ClipDef = {
  name: 'mask_on',
  dur: 0.8,
  fadeIn: 0.06,
  fadeOut: 0.25,
  events: { fx: 0.3 },
  keys: [
    body(0, { 'upperarm.L': [8, 0, 13], 'forearm.L': [-22, 0, 0], head: [3, 2, 0] }),
    body(0.18, { 'upperarm.L': [-150, 28, -38], 'forearm.L': [-105, 0, 0], 'hand.L': [-10, 0, 0], head: [-10, 0, 0], neck: [-6, 0, 0], chest: [-4, 0, 0] }, [0, 0, 0], 'out'),
    body(0.36, { 'upperarm.L': [-70, 10, 20], 'forearm.L': [-40, 0, 0], 'hand.L': [10, 0, 0], head: [14, 0, 0], neck: [6, 0, 0], chest: [8, 0, 0] }, [0, -0.04, 0], 'outExpo'),
    body(0.8, { 'upperarm.L': [8, 0, 13], 'forearm.L': [-22, 0, 0], 'hand.L': [6, 0, 0], head: [3, 2, 0], neck: [0, 0, 0], chest: [2, 8, 0] }, [0, -0.035, 0], 'inOut'),
  ],
};

export const ICHIGO_CLIPS: ClipDef[] = [slash1, slash2, slash3, slash4, slash5, getsuga, release, dash, airstep, hitHeavy, maskOn];
export const ICHIGO_COMBO = ['slash1', 'slash2', 'slash3', 'slash4', 'slash5'];
