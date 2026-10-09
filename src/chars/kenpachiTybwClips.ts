// TYBW Kenpachi's new moves (docs/kits/kenpachi.md). Shikai: Space Cut — the cleaver hauled back over the right
// shoulder in both hands and brought down across to the low left; Deflect — the flat of the cleaver held upright before
// him, then swung down to the side to dump what it caught; the Giant Grapple's chokeslam (normal foes) and the low
// grab-and-heave that trips a giant; Skyfall Cleave — the crouch, the leap with the cleaver overhead, the dive. Sealed:
// Bait & Grab's seize — the free hand on the collar, a head-butt, lifted, slammed. Bankai: the oni's pounce, the bite
// (seize, bite, two shakes, the rip), the crouching left uppercut, the rush that drags the blade and rips it up, the
// roar, The Perfect Crimson (both hands high for the long charge, one cut down).
import type { ClipDef, KeyDef } from '../anim/clip';
import { mergeKeys, swingKeys } from '../anim/swing';
import { CL_SHOULDER, REST, SHOULDER } from './kenpachiClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });
const grip = (t: number, p: E, dir: E, edge: E, pole: E, ease?: KeyDef['ease'], two = 0): KeyDef => ({
  t, ease, c: { '@gripR': p, '@dirR': dir, '@edgeR': edge, '@poleR': pole, '@ikR': [1, 0, 0], '@twoHand': [two, 0, 0] },
});
const restGrip = (t: number, g: typeof SHOULDER, ease?: KeyDef['ease']): KeyDef => grip(t, g.p, g.dir, g.edge, g.pole, ease);
/** swing centre at the right shoulder (chest space) */
const SHOULDER_C: E = [-0.22, 0.18, 0.04];

// ------------------------------------------------------------------ Shikai

/** Space Cut: both hands, the cleaver from high behind the right shoulder down across to the low left. */
const space: ClipDef = {
  name: 'kt_space', dur: 1.3, fadeIn: 0.08, fadeOut: 0.3, events: { charge: 0.08, step: 0.34, hit: 0.42, fx: 0.43 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0.6, -0.8, 0], c: [-0.06, 0.2, 0.1], r: 0.44, pole: [-0.65, -0.35, -0.65],
      keys: [[0, -128, 'out'], [0.3, -170, 'out'], [0.36, -168, 'linear'], [0.42, 42, 'outExpo'], [0.62, 64, 'out'], [1.3, 30, 'inOut']],
      twoHand: [0.3, 1, 1, 1, 1, 0.2],
    }),
    [
      key(0, REST()),
      key(0.3, REST({ hips: [0, -22, 0], spine: [-8, -18, 6], chest: [-14, -26, 8], neck: [-4, 0, 0], head: [-10, 20, 0], 'thigh.L': [-14, 0, 8], 'thigh.R': [12, 0, -8], 'shin.R': [20, 0, 0] }), [0, -0.04, -0.04], 'out'),
      key(0.36, REST({ hips: [0, -24, 0], spine: [-10, -20, 6], chest: [-16, -28, 8], head: [-10, 22, 0], 'thigh.L': [-16, 0, 8], 'thigh.R': [14, 0, -8], 'shin.R': [22, 0, 0] }), [0, -0.05, -0.04], 'linear'),
      key(0.42, REST({ hips: [10, 22, 0], spine: [22, 20, -6], chest: [18, 30, -10], neck: [6, 0, 0], head: [-20, -22, 0], 'thigh.L': [-54, 0, 10], 'shin.L': [58, 0, 0], 'foot.L': [-4, 0, 0], 'thigh.R': [30, 0, -8], 'shin.R': [36, 0, 0], 'foot.R': [-12, 0, 0] }), [0, -0.18, 0.14], 'outExpo'),
      key(0.62, REST({ hips: [12, 26, 0], spine: [24, 22, -6], chest: [20, 32, -10], head: [-22, -24, 0], 'thigh.L': [-56, 0, 10], 'shin.L': [60, 0, 0], 'thigh.R': [32, 0, -8], 'shin.R': [38, 0, 0] }), [0, -0.19, 0.15], 'out'),
      key(1.3, REST(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** Deflect: the flat of the cleaver upright before him in both hands; then swung down to the right, dumping it. */
const deflect: ClipDef = {
  name: 'kt_deflect', dur: 1.45, fadeIn: 0.05, fadeOut: 0.3, events: { guard: 0.06, dump: 1.04 },
  keys: mergeKeys(
    [
      restGrip(0, CL_SHOULDER),
      grip(0.08, [-0.04, 0.1, 0.42], [0.04, 0.98, 0.18], [-1, 0, 0.04], [-0.75, -0.55, -0.3], 'outExpo', 1),
      grip(0.95, [-0.04, 0.08, 0.44], [0.04, 0.98, 0.2], [-1, 0, 0.04], [-0.75, -0.55, -0.3], 'inOut', 1),
      grip(1.04, [-0.34, -0.3, 0.42], [-0.45, -0.55, 0.7], [-0.25, -0.8, -0.55], [-0.7, -0.2, -0.6], 'outExpo', 0.8),
      grip(1.2, [-0.36, -0.32, 0.38], [-0.45, -0.6, 0.66], [-0.25, -0.78, -0.58], [-0.7, -0.2, -0.6], 'out', 0.4),
      restGrip(1.45, CL_SHOULDER, 'inOut'),
    ],
    [
      key(0, REST()),
      key(0.08, REST({ hips: [6, 0, 0], spine: [10, 0, 0], chest: [6, 0, 0], head: [-14, 0, 0], 'thigh.L': [-30, 0, 14], 'shin.L': [42, 0, 0], 'foot.L': [-8, 0, 0], 'thigh.R': [-12, 0, -14], 'shin.R': [36, 0, 0], 'foot.R': [-10, 0, 0] }), [0, -0.12, 0], 'outExpo'),
      key(0.95, REST({ hips: [7, 0, 0], spine: [11, 0, 0], chest: [7, 0, 0], head: [-15, 0, 0], 'thigh.L': [-32, 0, 14], 'shin.L': [44, 0, 0], 'foot.L': [-8, 0, 0], 'thigh.R': [-13, 0, -14], 'shin.R': [38, 0, 0], 'foot.R': [-10, 0, 0] }), [0, -0.13, 0], 'inOut'),
      key(1.04, REST({ hips: [12, -18, 0], spine: [20, -16, 0], chest: [14, -22, 0], head: [-20, 14, 0], 'thigh.L': [-40, 0, 12], 'shin.L': [50, 0, 0], 'thigh.R': [-6, 0, -16], 'shin.R': [44, 0, 0] }), [0, -0.16, 0.04], 'outExpo'),
      key(1.45, REST(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** The Giant Grapple on a foe his own size: the free hand on the collar, lifted overhead, chokeslammed down in front. */
const grapple: ClipDef = {
  name: 'kt_grapple', dur: 1.2, fadeIn: 0.05, fadeOut: 0.28, events: { step: 0.06, grab: 0.18, lift: 0.3, slam: 0.62 },
  keys: mergeKeys(
    [restGrip(0, CL_SHOULDER), restGrip(1.2, CL_SHOULDER)],
    [
      key(0, REST()),
      key(0.18, REST({ hips: [6, -10, 0], spine: [10, -10, 0], chest: [6, -14, 0], head: [-12, 10, 0], 'upperarm.L': [-86, 0, 6], 'forearm.L': [-8, 0, 0], 'hand.L': [0, 0, 0], 'thigh.L': [-34, 0, 8], 'shin.L': [36, 0, 0], 'thigh.R': [20, 0, -6] }), [0, -0.08, 0.06], 'outExpo'),
      key(0.45, REST({ hips: [-6, 0, 0], spine: [-12, 4, 0], chest: [-12, 6, 0], neck: [-6, 0, 0], head: [-16, 0, 0], 'upperarm.L': [-168, 0, -6], 'forearm.L': [-14, 0, 0], 'thigh.L': [-20, 0, 10], 'shin.L': [22, 0, 0], 'thigh.R': [8, 0, -10], 'shin.R': [12, 0, 0] }), [0, 0.02, 0], 'inOut'),
      key(0.62, REST({ hips: [16, 0, 0], spine: [28, 0, 0], chest: [22, 0, 0], neck: [6, 0, 0], head: [-24, 0, 0], 'upperarm.L': [-40, 0, 8], 'forearm.L': [-6, 0, 0], 'thigh.L': [-56, 0, 8], 'shin.L': [66, 0, 0], 'thigh.R': [30, 0, -8], 'shin.R': [44, 0, 0], 'foot.R': [-12, 0, 0] }), [0, -0.22, 0.12], 'outExpo'),
      key(0.85, REST({ hips: [16, 0, 0], spine: [28, 0, 0], chest: [22, 0, 0], head: [-24, 0, 0], 'upperarm.L': [-36, 0, 8], 'forearm.L': [-8, 0, 0], 'thigh.L': [-56, 0, 8], 'shin.L': [66, 0, 0], 'thigh.R': [30, 0, -8], 'shin.R': [44, 0, 0] }), [0, -0.22, 0.12], 'out'),
      key(1.2, REST(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** The Giant Grapple on a giant: down low, the free hand round its leg, then the whole body heaves up and back. */
const trip: ClipDef = {
  name: 'kt_trip', dur: 1.3, fadeIn: 0.06, fadeOut: 0.3, events: { step: 0.06, grab: 0.22, heave: 0.55 },
  keys: mergeKeys(
    [restGrip(0, CL_SHOULDER), restGrip(1.3, CL_SHOULDER)],
    [
      key(0, REST()),
      key(0.22, REST({ hips: [24, -8, 0], spine: [30, -6, 0], chest: [16, -10, 0], neck: [-8, 0, 0], head: [-26, 8, 0], 'upperarm.L': [-60, 0, 4], 'forearm.L': [-6, 0, 0], 'thigh.L': [-74, 0, 10], 'shin.L': [96, 0, 0], 'foot.L': [-14, 0, 0], 'thigh.R': [-30, 0, -12], 'shin.R': [90, 0, 0], 'foot.R': [-30, 0, 0] }), [0, -0.38, 0.06], 'outExpo'),
      key(0.4, REST({ hips: [26, -8, 0], spine: [32, -6, 0], chest: [18, -10, 0], head: [-28, 8, 0], 'upperarm.L': [-58, 0, 4], 'forearm.L': [-10, 0, 0], 'thigh.L': [-76, 0, 10], 'shin.L': [98, 0, 0], 'thigh.R': [-32, 0, -12], 'shin.R': [92, 0, 0], 'foot.R': [-30, 0, 0] }), [0, -0.4, 0.06], 'inOut'),
      key(0.55, REST({ hips: [-12, 14, 0], spine: [-18, 12, 0], chest: [-20, 16, 0], neck: [-8, 0, 0], head: [-20, -10, 0], 'upperarm.L': [-150, 0, 20], 'forearm.L': [-20, 0, 0], 'thigh.L': [-20, 0, 12], 'shin.L': [24, 0, 0], 'thigh.R': [14, 0, -12], 'shin.R': [20, 0, 0] }), [0, 0.0, -0.06], 'outExpo'),
      key(0.85, REST({ hips: [-10, 16, 0], spine: [-14, 14, 0], chest: [-16, 18, 0], head: [-18, -12, 0], 'upperarm.L': [-140, 0, 30], 'forearm.L': [-24, 0, 0], 'thigh.L': [-18, 0, 12], 'shin.L': [22, 0, 0], 'thigh.R': [12, 0, -12], 'shin.R': [18, 0, 0] }), [0, -0.01, -0.05], 'out'),
      key(1.3, REST(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

/** Skyfall Cleave: the crouch, the leap with the cleaver overhead in both hands, hang at the top, the dive and the cut. */
const skyfall: ClipDef = {
  name: 'kt_skyfall', dur: 1.95, fadeIn: 0.08, fadeOut: 0.35, events: { leap: 0.2, apex: 0.58, dive: 0.7, hit: 0.98 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0, -1, 0], c: [-0.04, 0.26, 0.12], r: 0.44, pole: [-0.7, -0.3, -0.6],
      keys: [[0, -128, 'out'], [0.2, -140, 'out'], [0.58, -178, 'out'], [0.9, -172, 'linear'], [0.98, 26, 'outExpo'], [1.3, 38, 'out'], [1.95, 30, 'inOut']],
      twoHand: [0.4, 1, 1, 1, 1, 1, 0.2],
    }),
    [
      key(0, REST()),
      key(0.2, REST({ hips: [14, 0, 0], spine: [20, 0, 0], chest: [8, 0, 0], head: [-14, 0, 0], 'thigh.L': [-60, 0, 8], 'shin.L': [90, 0, 0], 'foot.L': [-20, 0, 0], 'thigh.R': [-40, 0, -8], 'shin.R': [86, 0, 0], 'foot.R': [-30, 0, 0] }), [0, -0.32, 0], 'out'),
      key(0.58, REST({ hips: [-8, 0, 0], spine: [-16, 0, 0], chest: [-20, 0, 0], neck: [-8, 0, 0], head: [-10, 0, 0], 'thigh.L': [-60, 0, 8], 'shin.L': [96, 0, 0], 'foot.L': [20, 0, 0], 'thigh.R': [-24, 0, -8], 'shin.R': [100, 0, 0], 'foot.R': [20, 0, 0] }), [0, 0.06, 0], 'out'),
      key(0.9, REST({ hips: [-6, 0, 0], spine: [-14, 0, 0], chest: [-18, 0, 0], head: [-12, 0, 0], 'thigh.L': [-40, 0, 8], 'shin.L': [60, 0, 0], 'thigh.R': [-10, 0, -8], 'shin.R': [50, 0, 0] }), [0, 0.04, 0], 'linear'),
      key(0.98, REST({ hips: [16, 0, 0], spine: [30, 0, 0], chest: [24, 0, 0], neck: [8, 0, 0], head: [-24, 0, 0], 'thigh.L': [-64, 0, 8], 'shin.L': [74, 0, 0], 'foot.L': [-6, 0, 0], 'thigh.R': [36, 0, -8], 'shin.R': [48, 0, 0], 'foot.R': [-14, 0, 0] }), [0, -0.24, 0.16], 'outExpo'),
      key(1.3, REST({ hips: [17, 0, 0], spine: [31, 0, 0], chest: [25, 0, 0], head: [-25, 0, 0], 'thigh.L': [-66, 0, 8], 'shin.L': [76, 0, 0], 'thigh.R': [38, 0, -8], 'shin.R': [50, 0, 0] }), [0, -0.25, 0.17], 'out'),
      key(1.95, REST(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

// ------------------------------------------------------------------ sealed

/** Bait & Grab's seize: the free hand on the attacker's collar, a head-butt, lifted off its feet, slammed. */
const seize: ClipDef = {
  name: 'kt_seize', dur: 1.15, fadeIn: 0.04, fadeOut: 0.28, events: { grab: 0.05, butt: 0.2, lift: 0.34, slam: 0.62 },
  keys: mergeKeys(
    [restGrip(0, SHOULDER), restGrip(1.15, SHOULDER)],
    [
      key(0, REST({ 'upperarm.L': [-70, 0, 8], 'forearm.L': [-30, 0, 0] })),
      key(0.05, REST({ chest: [4, -8, 0], 'upperarm.L': [-84, 0, 4], 'forearm.L': [-26, 0, 0], head: [-10, 6, 0] }), [0, -0.03, 0.02], 'outExpo'),
      key(0.14, REST({ hips: [-4, 0, 0], spine: [-10, 0, 0], chest: [-12, -6, 0], neck: [-14, 0, 0], head: [-18, 0, 0], 'upperarm.L': [-80, 0, 6], 'forearm.L': [-40, 0, 0] }), [0, -0.02, -0.04], 'out'),
      key(0.2, REST({ hips: [10, 0, 0], spine: [18, 0, 0], chest: [16, -4, 0], neck: [16, 0, 0], head: [14, 0, 0], 'upperarm.L': [-74, 0, 6], 'forearm.L': [-50, 0, 0], 'thigh.L': [-30, 0, 8], 'shin.L': [30, 0, 0] }), [0, -0.06, 0.08], 'outExpo'),
      key(0.45, REST({ hips: [-6, 0, 0], spine: [-12, 4, 0], chest: [-12, 6, 0], head: [-16, 0, 0], 'upperarm.L': [-166, 0, -6], 'forearm.L': [-12, 0, 0], 'thigh.L': [-18, 0, 10], 'shin.L': [20, 0, 0], 'thigh.R': [8, 0, -10] }), [0, 0.02, 0], 'inOut'),
      key(0.62, REST({ hips: [16, 0, 0], spine: [28, 0, 0], chest: [22, 0, 0], head: [-24, 0, 0], 'upperarm.L': [-40, 0, 8], 'forearm.L': [-6, 0, 0], 'thigh.L': [-56, 0, 8], 'shin.L': [66, 0, 0], 'thigh.R': [30, 0, -8], 'shin.R': [44, 0, 0] }), [0, -0.22, 0.12], 'outExpo'),
      key(0.82, REST({ hips: [15, 0, 0], spine: [27, 0, 0], chest: [21, 0, 0], head: [-23, 0, 0], 'upperarm.L': [-38, 0, 8], 'thigh.L': [-54, 0, 8], 'shin.L': [64, 0, 0], 'thigh.R': [28, 0, -8], 'shin.R': [42, 0, 0] }), [0, -0.21, 0.11], 'out'),
      key(1.15, REST(), [0, -0.03, 0], 'inOut'),
    ],
  ),
};

// ------------------------------------------------------------------ Bankai

/** The oni's pounce: a deep crouch, then a bound with the blade drawn back. */
const pounce: ClipDef = {
  name: 'kb_pounce', dur: 0.9, fadeIn: 0.04, fadeOut: 0.25, events: { leap: 0.12 },
  keys: mergeKeys(
    [
      grip(0, [-0.36, -0.36, 0.22], [-0.2, -0.55, 0.81], [0.1, -0.83, -0.55], [-0.6, -0.3, -0.75]),
      grip(0.12, [-0.4, 0.02, -0.18], [-0.3, 0.5, -0.8], [0, 0.8, 0.5], [-0.6, -0.6, 0.4], 'outExpo'),
      grip(0.6, [-0.4, 0.06, -0.16], [-0.3, 0.55, -0.78], [0, 0.8, 0.5], [-0.6, -0.6, 0.4], 'linear'),
      grip(0.9, [-0.36, -0.36, 0.22], [-0.2, -0.55, 0.81], [0.1, -0.83, -0.55], [-0.6, -0.3, -0.75], 'inOut'),
    ],
    [
      key(0, REST({ hips: [10, -6, 0], spine: [16, 2, 0], chest: [10, 4, 0] })),
      key(0.1, REST({ hips: [24, 0, 0], spine: [30, 0, 0], chest: [14, 0, 0], neck: [-10, 0, 0], head: [-24, 0, 0], 'thigh.L': [-70, 0, 12], 'shin.L': [100, 0, 0], 'foot.L': [-20, 0, 0], 'thigh.R': [-40, 0, -12], 'shin.R': [96, 0, 0], 'foot.R': [-30, 0, 0], 'upperarm.L': [30, 0, 30], 'forearm.L': [-30, 0, 0] }), [0, -0.36, 0], 'out'),
      key(0.25, REST({ hips: [20, 0, 0], spine: [30, 0, 0], chest: [14, 0, 0], neck: [-14, 0, 0], head: [-26, 0, 0], 'thigh.L': [-90, 0, 10], 'shin.L': [110, 0, 0], 'thigh.R': [-20, 0, -10], 'shin.R': [70, 0, 0], 'upperarm.L': [-60, 0, 40], 'forearm.L': [-40, 0, 0] }), [0, 0.02, 0], 'outExpo'),
      key(0.6, REST({ hips: [18, 0, 0], spine: [28, 0, 0], chest: [12, 0, 0], head: [-24, 0, 0], 'thigh.L': [-60, 0, 10], 'shin.L': [80, 0, 0], 'thigh.R': [-40, 0, -10], 'shin.R': [80, 0, 0], 'upperarm.L': [-50, 0, 40], 'forearm.L': [-40, 0, 0] }), [0, 0, 0], 'linear'),
      key(0.9, REST({ hips: [10, -6, 0], spine: [16, 2, 0], chest: [10, 4, 0] }), [0, -0.1, 0], 'inOut'),
    ],
  ),
};

/** Bite & Rip: seize with the free hand, the jaws, two savage shakes of the head, then the whole body tears back. */
const bite: ClipDef = {
  name: 'kb_bite', dur: 1.35, fadeIn: 0.04, fadeOut: 0.3, events: { step: 0.04, grab: 0.15, bite: 0.27, shake1: 0.45, shake2: 0.62, rip: 0.86 },
  keys: mergeKeys(
    [
      grip(0, [-0.36, -0.36, 0.22], [-0.2, -0.55, 0.81], [0.1, -0.83, -0.55], [-0.6, -0.3, -0.75]),
      grip(1.35, [-0.36, -0.36, 0.22], [-0.2, -0.55, 0.81], [0.1, -0.83, -0.55], [-0.6, -0.3, -0.75]),
    ],
    [
      key(0, REST({ hips: [10, -6, 0], spine: [16, 2, 0], chest: [10, 4, 0] })),
      key(0.15, REST({ hips: [16, 0, 0], spine: [24, 0, 0], chest: [14, 0, 0], neck: [-4, 0, 0], head: [-20, 0, 0], 'upperarm.L': [-84, 0, 2], 'forearm.L': [-30, 0, 0], 'thigh.L': [-50, 0, 8], 'shin.L': [60, 0, 0], 'thigh.R': [26, 0, -8], 'shin.R': [40, 0, 0] }), [0, -0.16, 0.12], 'outExpo'),
      key(0.27, REST({ hips: [22, 0, 0], spine: [30, 0, 0], chest: [20, 0, 0], neck: [18, 0, 0], head: [10, 0, 0], 'upperarm.L': [-70, 0, 4], 'forearm.L': [-60, 0, 0], 'thigh.L': [-52, 0, 8], 'shin.L': [62, 0, 0], 'thigh.R': [28, 0, -8], 'shin.R': [42, 0, 0] }), [0, -0.2, 0.16], 'outExpo'),
      key(0.45, REST({ hips: [22, -10, 0], spine: [30, -12, 0], chest: [20, -16, 0], neck: [18, -10, 0], head: [10, -20, 10], 'upperarm.L': [-70, 0, 4], 'forearm.L': [-60, 0, 0], 'thigh.L': [-52, 0, 8], 'shin.L': [62, 0, 0], 'thigh.R': [28, 0, -8], 'shin.R': [42, 0, 0] }), [0, -0.2, 0.16], 'outExpo'),
      key(0.62, REST({ hips: [22, 10, 0], spine: [30, 12, 0], chest: [20, 16, 0], neck: [18, 10, 0], head: [10, 20, -10], 'upperarm.L': [-70, 0, 4], 'forearm.L': [-60, 0, 0], 'thigh.L': [-52, 0, 8], 'shin.L': [62, 0, 0], 'thigh.R': [28, 0, -8], 'shin.R': [42, 0, 0] }), [0, -0.2, 0.16], 'outExpo'),
      key(0.86, REST({ hips: [-8, -24, 0], spine: [-14, -22, 0], chest: [-16, -30, 0], neck: [-12, 0, 0], head: [-26, 18, 0], 'upperarm.L': [-20, 0, 70], 'forearm.L': [-20, 0, 0], 'thigh.L': [-16, 0, 12], 'shin.L': [20, 0, 0], 'thigh.R': [10, 0, -12], 'shin.R': [24, 0, 0] }), [0, -0.06, -0.08], 'outExpo'),
      key(1.35, REST({ hips: [10, -6, 0], spine: [16, 2, 0], chest: [10, 4, 0] }), [0, -0.1, 0], 'inOut'),
    ],
  ),
};

/** Launch Uppercut: a crouch almost to the ground, then up with the left fist, the whole body following it. */
const upper: ClipDef = {
  name: 'kb_upper', dur: 1.0, fadeIn: 0.05, fadeOut: 0.28, events: { step: 0.2, hit: 0.28 },
  keys: mergeKeys(
    [
      grip(0, [-0.36, -0.36, 0.22], [-0.2, -0.55, 0.81], [0.1, -0.83, -0.55], [-0.6, -0.3, -0.75]),
      grip(0.28, [-0.42, -0.2, -0.12], [-0.4, -0.7, -0.6], [0, -0.6, 0.8], [-0.7, -0.3, 0.5], 'outExpo'),
      grip(1.0, [-0.36, -0.36, 0.22], [-0.2, -0.55, 0.81], [0.1, -0.83, -0.55], [-0.6, -0.3, -0.75], 'inOut'),
    ],
    [
      key(0, REST({ hips: [10, -6, 0], spine: [16, 2, 0], chest: [10, 4, 0] })),
      key(0.2, REST({ hips: [26, 16, 0], spine: [30, 14, 0], chest: [16, 18, 0], head: [-26, -10, 0], 'upperarm.L': [10, 0, 20], 'forearm.L': [-100, 0, 0], 'thigh.L': [-80, 0, 10], 'shin.L': [110, 0, 0], 'foot.L': [-24, 0, 0], 'thigh.R': [-36, 0, -10], 'shin.R': [100, 0, 0], 'foot.R': [-34, 0, 0] }), [0, -0.42, 0], 'out'),
      key(0.28, REST({ hips: [-10, -18, 0], spine: [-16, -16, 0], chest: [-20, -24, 0], neck: [-10, 0, 0], head: [-24, 14, 0], 'upperarm.L': [-170, 0, -10], 'forearm.L': [-30, 0, 0], 'thigh.L': [-20, 0, 8], 'shin.L': [12, 0, 0], 'foot.L': [20, 0, 0], 'thigh.R': [10, 0, -8], 'shin.R': [30, 0, 0], 'foot.R': [24, 0, 0] }), [0, 0.06, 0.04], 'outExpo'),
      key(0.5, REST({ hips: [-12, -20, 0], spine: [-18, -18, 0], chest: [-22, -26, 0], head: [-26, 16, 0], 'upperarm.L': [-172, 0, -8], 'forearm.L': [-26, 0, 0], 'thigh.L': [-22, 0, 8], 'shin.L': [14, 0, 0], 'thigh.R': [12, 0, -8], 'shin.R': [32, 0, 0] }), [0, 0.07, 0.04], 'out'),
      key(1.0, REST({ hips: [10, -6, 0], spine: [16, 2, 0], chest: [10, 4, 0] }), [0, -0.1, 0], 'inOut'),
    ],
  ),
};

/** Shield Breaker: the lean, the rush with the blade dragged low behind on the right, the rip upward through the guard. */
const rush: ClipDef = {
  name: 'kb_rush', dur: 1.2, fadeIn: 0.05, fadeOut: 0.3, events: { step: 0.14, hit: 0.6 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0, -1, 0], c: SHOULDER_C, r: 0.5, pole: [-0.8, -0.2, -0.5], sense: -1,
      keys: [[0, 120, 'out'], [0.14, 150, 'out'], [0.54, 155, 'linear'], [0.6, -40, 'outExpo'], [0.8, -62, 'out'], [1.2, 60, 'inOut']],
    }),
    [
      key(0, REST({ hips: [10, -6, 0], spine: [16, 2, 0], chest: [10, 4, 0] })),
      key(0.14, REST({ hips: [26, -10, 0], spine: [32, -8, 0], chest: [16, -12, 0], neck: [-12, 0, 0], head: [-26, 8, 0], 'thigh.L': [-56, 0, 8], 'shin.L': [70, 0, 0], 'thigh.R': [30, 0, -8], 'shin.R': [50, 0, 0], 'upperarm.L': [30, 0, 30], 'forearm.L': [-30, 0, 0] }), [0, -0.26, 0.06], 'out'),
      key(0.54, REST({ hips: [28, -10, 0], spine: [34, -8, 0], chest: [18, -12, 0], neck: [-12, 0, 0], head: [-28, 8, 0], 'thigh.L': [-60, 0, 8], 'shin.L': [72, 0, 0], 'thigh.R': [34, 0, -8], 'shin.R': [54, 0, 0], 'upperarm.L': [36, 0, 30], 'forearm.L': [-30, 0, 0] }), [0, -0.28, 0.08], 'linear'),
      key(0.6, REST({ hips: [-8, 16, 0], spine: [-14, 16, 0], chest: [-18, 24, 0], neck: [-8, 0, 0], head: [-22, -14, 0], 'thigh.L': [-36, 0, 8], 'shin.L': [30, 0, 0], 'thigh.R': [18, 0, -8], 'shin.R': [28, 0, 0], 'upperarm.L': [-20, 0, 50], 'forearm.L': [-20, 0, 0] }), [0, -0.04, 0.12], 'outExpo'),
      key(0.8, REST({ hips: [-10, 18, 0], spine: [-16, 18, 0], chest: [-20, 26, 0], head: [-24, -16, 0], 'thigh.L': [-38, 0, 8], 'shin.L': [32, 0, 0], 'thigh.R': [20, 0, -8], 'shin.R': [30, 0, 0], 'upperarm.L': [-22, 0, 52] }), [0, -0.04, 0.12], 'out'),
      key(1.2, REST({ hips: [10, -6, 0], spine: [16, 2, 0], chest: [10, 4, 0] }), [0, -0.1, 0], 'inOut'),
    ],
  ),
};

/** The roar: hunched, then the head thrown back, chest out, arms flung wide. */
const roar: ClipDef = {
  name: 'kb_roar', dur: 1.3, fadeIn: 0.06, fadeOut: 0.32, events: { roar: 0.22 },
  keys: mergeKeys(
    [
      grip(0, [-0.36, -0.36, 0.22], [-0.2, -0.55, 0.81], [0.1, -0.83, -0.55], [-0.6, -0.3, -0.75]),
      grip(0.22, [-0.6, 0.0, 0.0], [-0.9, -0.3, 0.3], [0, -1, 0], [-0.3, -0.6, -0.7], 'outExpo'),
      grip(0.95, [-0.6, -0.02, 0.0], [-0.9, -0.32, 0.3], [0, -1, 0], [-0.3, -0.6, -0.7], 'out'),
      grip(1.3, [-0.36, -0.36, 0.22], [-0.2, -0.55, 0.81], [0.1, -0.83, -0.55], [-0.6, -0.3, -0.75], 'inOut'),
    ],
    [
      key(0, REST({ hips: [10, -6, 0], spine: [16, 2, 0], chest: [10, 4, 0] })),
      key(0.14, REST({ hips: [18, 0, 0], spine: [28, 0, 0], chest: [18, 0, 0], neck: [10, 0, 0], head: [6, 0, 0], 'thigh.L': [-40, 0, 14], 'shin.L': [56, 0, 0], 'thigh.R': [-24, 0, -14], 'shin.R': [50, 0, 0], 'upperarm.L': [-10, 0, 14], 'forearm.L': [-90, 0, 0] }), [0, -0.2, 0], 'out'),
      key(0.22, REST({ hips: [-6, 0, 0], spine: [-12, 0, 0], chest: [-18, 0, 0], neck: [-16, 0, 0], head: [-30, 0, 0], 'thigh.L': [-22, 0, 20], 'shin.L': [30, 0, 0], 'thigh.R': [-10, 0, -20], 'shin.R': [28, 0, 0], 'upperarm.L': [-30, 0, 96], 'forearm.L': [-30, 0, 0] }), [0, -0.08, 0], 'outExpo'),
      key(0.95, REST({ hips: [-5, 0, 0], spine: [-10, 0, 0], chest: [-16, 0, 0], neck: [-14, 0, 0], head: [-28, 0, 0], 'thigh.L': [-22, 0, 20], 'shin.L': [30, 0, 0], 'thigh.R': [-10, 0, -20], 'shin.R': [28, 0, 0], 'upperarm.L': [-28, 0, 92], 'forearm.L': [-34, 0, 0] }), [0, -0.08, 0], 'out'),
      key(1.3, REST({ hips: [10, -6, 0], spine: [16, 2, 0], chest: [10, 4, 0] }), [0, -0.1, 0], 'inOut'),
    ],
  ),
};

/** The Perfect Crimson: both hands high overhead for the long charge, then one cut straight down, held low. */
const crimson: ClipDef = {
  name: 'kb_crimson', dur: 2.1, fadeIn: 0.1, fadeOut: 0.4, events: { charge: 0.06, step: 0.92, hit: 1.0, fx: 1.01 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [0, -1, 0], c: [-0.04, 0.26, 0.12], r: 0.46, pole: [-0.7, -0.2, -0.65],
      // the charge holds the blade straight up (the crimson blade grows into the sky), a little wind-up back, the cut
      keys: [[0, -100, 'out'], [0.55, -92, 'inOut'], [0.92, -112, 'linear'], [1.0, 30, 'outExpo'], [1.4, 42, 'out'], [2.1, 30, 'inOut']],
      twoHand: [0.2, 1, 1, 1, 1, 0.1],
    }),
    [
      key(0, REST({ hips: [10, -6, 0], spine: [16, 2, 0], chest: [10, 4, 0] })),
      key(0.55, REST({ hips: [-6, 0, 0], spine: [-16, 0, 0], chest: [-20, 0, 0], neck: [-6, 0, 0], head: [-10, 0, 0], 'thigh.L': [-26, 0, 10], 'shin.L': [30, 0, 0], 'thigh.R': [18, 0, -10], 'shin.R': [24, 0, 0] }), [0, -0.06, -0.05], 'inOut'),
      key(0.92, REST({ hips: [-8, 0, 0], spine: [-18, 0, 0], chest: [-22, 0, 0], neck: [-6, 0, 0], head: [-10, 0, 0], 'thigh.L': [-30, 0, 10], 'shin.L': [34, 0, 0], 'thigh.R': [20, 0, -10], 'shin.R': [26, 0, 0] }), [0, -0.08, -0.06], 'linear'),
      key(1.0, REST({ hips: [16, 0, 0], spine: [30, 0, 0], chest: [24, 0, 0], neck: [8, 0, 0], head: [-26, 0, 0], 'thigh.L': [-66, 0, 8], 'shin.L': [74, 0, 0], 'foot.L': [-6, 0, 0], 'thigh.R': [36, 0, -8], 'shin.R': [48, 0, 0], 'foot.R': [-14, 0, 0] }), [0, -0.24, 0.17], 'outExpo'),
      key(1.4, REST({ hips: [17, 0, 0], spine: [31, 0, 0], chest: [25, 0, 0], head: [-27, 0, 0], 'thigh.L': [-68, 0, 8], 'shin.L': [76, 0, 0], 'thigh.R': [38, 0, -8], 'shin.R': [50, 0, 0] }), [0, -0.25, 0.18], 'out'),
      key(2.1, REST({ hips: [10, -6, 0], spine: [16, 2, 0], chest: [10, 4, 0] }), [0, -0.1, 0], 'inOut'),
    ],
  ),
};

export const KENPACHI_TYBW_CLIPS: ClipDef[] = [space, deflect, grapple, trip, skyfall, seize, pounce, bite, upper, rush, roar, crimson];
