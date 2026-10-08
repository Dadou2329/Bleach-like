// Meninas's animation set. Upright, polite and a little dreamy: the hands loosely clasped in front, the head tilted.
// The blows are heavy and deliberate — a jab, a straight, a hook, and a two-handed hammer fist from overhead. The Power
// (the right arm drawn far back as it swells, then thrown), the small heart bow, Diamond Push (the hands meeting in a
// diamond before the chest, then the shove), Lift & Throw (down into the ground, the chunk raised overhead, hurled),
// the head-grab (a reach, the run with the arm out, the slam), Muscle Up (a double-biceps flex), the release (curled,
// thrown open). In Pornipora: Dumbbell Duster (five dumbbell blows), Baton Beat (two spins with the staff), Halteres (the
// blade raised overhead, the dive), Sklaverei, and the Building Drop (both arms up under the weight, then down).
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

const IDLE: Record<string, E> = {
  hips: [0, 4, 0], spine: [-2, 0, 0], chest: [-2, -4, 0], neck: [2, 0, 0], head: [4, 4, -10],
  'thigh.L': [-2, 0, 2], 'shin.L': [4, 0, 0], 'thigh.R': [2, 0, -3], 'shin.R': [6, 0, 0],
  'upperarm.L': [-14, 0, -4], 'forearm.L': [-56, 0, 0], 'hand.L': [0, 0, 16], 'upperarm.R': [-14, 0, 4], 'forearm.R': [-58, 0, 0], 'hand.R': [0, 0, -16],
};
const I = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });

export const MENINAS_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.01,
  run: { spine: [8, 0, 0], head: [-4, 0, 0], 'upperarm.L': [-6, 0, 12], 'forearm.L': [-70, 0, 0], 'upperarm.R': [-6, 0, -12], 'forearm.R': [-70, 0, 0] },
  sprint: { spine: [16, 0, 0], chest: [4, 0, 0], head: [-10, 0, 0], 'upperarm.L': [30, 0, 14], 'forearm.L': [-40, 0, 0], 'upperarm.R': [30, 0, -14], 'forearm.R': [-40, 0, 0] },
  swingL: 1.0,
  swingR: 1.0,
  freqScale: 0.92,
};

/** Pornipora: floating upright, the legs together and trailing, the arms a little open */
const FLY: Record<string, E> = {
  hips: [6, 0, 0], spine: [-2, 0, 0], chest: [-4, 0, 0], head: [0, 4, -8],
  'thigh.L': [8, 0, 2], 'shin.L': [30, 0, 0], 'foot.L': [26, 0, 0], 'thigh.R': [4, 0, -2], 'shin.R': [22, 0, 0], 'foot.R': [24, 0, 0],
  'upperarm.L': [-12, 0, 20], 'forearm.L': [-46, 0, 0], 'upperarm.R': [-12, 0, -20], 'forearm.R': [-46, 0, 0],
};
const F = (over: Record<string, E> = {}): Record<string, E> => ({ ...FLY, ...over });

export const PORNIPORA_STANCE: StanceDef = {
  idle: FLY,
  idleHips: 0,
  run: { spine: [10, 0, 0], head: [-6, 0, 0], 'upperarm.L': [10, 0, 30], 'forearm.L': [-30, 0, 0], 'upperarm.R': [10, 0, -30], 'forearm.R': [-30, 0, 0] },
  sprint: { spine: [24, 0, 0], head: [-14, 0, 0], 'upperarm.L': [40, 0, 24], 'forearm.L': [-10, 0, 0], 'upperarm.R': [40, 0, -24], 'forearm.R': [-10, 0, 0] },
  swingL: 0.5,
  swingR: 0.5,
  freqScale: 1.0,
};

const clip = (name: string, dur: number, events: Record<string, number>, keys: KeyDef[], o: { fadeIn?: number; fadeOut?: number; loop?: boolean } = {}): ClipDef => ({
  name, dur, fadeIn: o.fadeIn ?? 0.05, fadeOut: o.fadeOut ?? 0.22, events, keys, ...(o.loop ? { loop: true } : {}),
});

// ------------------------------------------------------------------ the string

/** a guard to throw from: fists up */
const GUARD: Record<string, E> = { 'upperarm.L': [-30, 0, 12], 'forearm.L': [-120, 0, 0], 'hand.L': [0, 0, 0], 'upperarm.R': [-26, 0, -12], 'forearm.R': [-124, 0, 0], 'hand.R': [0, 0, 0], head: [2, 0, 0] };
const G = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...GUARD, ...over });

/** LMB 1: a left jab */
const jab = clip('mn_jab', 0.5, { step: 0.04, hit: 0.14, combo: 0.24 }, [
  key(0, I()),
  key(0.08, G({ hips: [0, 10, 0], chest: [0, 12, 0] }), [0, -0.02, 0], 'out'),
  key(0.15, G({ hips: [2, -16, 0], spine: [6, -6, 0], chest: [4, -16, 0], 'thigh.L': [-24, 0, 4], 'shin.L': [24, 0, 0], 'upperarm.L': [-90, 0, 4], 'forearm.L': [-4, 0, 0] }), [0, -0.04, 0.06], 'outExpo'),
  key(0.3, G({ hips: [2, -12, 0], chest: [4, -12, 0], 'upperarm.L': [-80, 0, 8], 'forearm.L': [-20, 0, 0] }), [0, -0.03, 0.04], 'inOut'),
  key(0.5, I(), [0, -0.012, 0], 'inOut'),
]);
/** LMB 2: a right straight from the shoulder */
const straight = clip('mn_straight', 0.56, { step: 0.05, hit: 0.16, combo: 0.28 }, [
  key(0, G()),
  key(0.08, G({ hips: [0, -14, 0], chest: [0, -20, 0], 'upperarm.R': [0, 0, -30], 'forearm.R': [-110, 0, 0] }), [0, -0.02, -0.03], 'out'),
  key(0.17, G({ hips: [2, 22, 0], spine: [8, 8, 0], chest: [4, 24, 0], head: [0, -14, 0], 'thigh.L': [-28, 0, 4], 'shin.L': [28, 0, 0], 'thigh.R': [14, 0, -4], 'upperarm.R': [-92, 0, -2], 'forearm.R': [-2, 0, 0] }), [0, -0.05, 0.1], 'outExpo'),
  key(0.34, G({ hips: [2, 18, 0], chest: [4, 20, 0], 'upperarm.R': [-86, 0, -4], 'forearm.R': [-10, 0, 0] }), [0, -0.04, 0.08], 'inOut'),
  key(0.56, I(), [0, -0.012, 0], 'inOut'),
]);
/** LMB 3: a left hook swung round */
const hook = clip('mn_hook', 0.62, { step: 0.06, hit: 0.19, combo: 0.32 }, [
  key(0, G()),
  key(0.1, G({ hips: [0, 24, 0], chest: [0, 28, 0], 'upperarm.L': [-40, 0, 70], 'forearm.L': [-90, 0, 0] }), [0, -0.03, 0], 'out'),
  key(0.2, G({ hips: [2, -26, 0], spine: [8, -8, 0], chest: [6, -30, 0], head: [0, 16, 0], 'thigh.L': [-20, 0, 4], 'shin.L': [20, 0, 0], 'upperarm.L': [-84, 0, -6], 'forearm.L': [-84, 0, 0] }), [0, -0.05, 0.06], 'outExpo'),
  key(0.38, G({ hips: [2, -22, 0], chest: [6, -26, 0], 'upperarm.L': [-80, 0, -10], 'forearm.L': [-80, 0, 0] }), [0, -0.04, 0.05], 'inOut'),
  key(0.62, I(), [0, -0.012, 0], 'inOut'),
]);
/** LMB 4: both fists raised overhead and hammered down */
const hammer = clip('mn_hammer', 0.84, { step: 0.12, hit: 0.32, combo: 0.5 }, [
  key(0, G()),
  key(0.2, I({ spine: [-14, 0, 0], chest: [-12, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-170, 0, -10], 'forearm.L': [-40, 0, 0], 'upperarm.R': [-170, 0, 10], 'forearm.R': [-40, 0, 0], 'thigh.L': [-10, 0, 4], 'shin.L': [14, 0, 0] }), [0, 0.04, -0.02], 'inOut'),
  key(0.33, I({ spine: [34, 0, 0], chest: [18, 0, 0], head: [10, 0, 0], 'upperarm.L': [-60, 0, -14], 'forearm.L': [-30, 0, 0], 'upperarm.R': [-60, 0, 14], 'forearm.R': [-30, 0, 0], 'thigh.L': [-50, 0, 4], 'shin.L': [60, 0, 0], 'thigh.R': [10, 0, -4], 'shin.R': [40, 0, 0] }), [0, -0.3, 0.12], 'outExpo'),
  key(0.6, I({ spine: [30, 0, 0], chest: [16, 0, 0], 'upperarm.L': [-56, 0, -14], 'forearm.L': [-30, 0, 0], 'upperarm.R': [-56, 0, 14], 'forearm.R': [-30, 0, 0], 'thigh.L': [-46, 0, 4], 'shin.L': [56, 0, 0], 'thigh.R': [8, 0, -4], 'shin.R': [36, 0, 0] }), [0, -0.27, 0.1], 'inOut'),
  key(0.84, I(), [0, -0.012, 0], 'inOut'),
]);
export const MENINAS_CHAIN = ['mn_jab', 'mn_straight', 'mn_hook', 'mn_hammer'];

// ------------------------------------------------------------------ the skills

/** RMB: The Power — the right arm drawn far back as it swells, then the punch thrown from the hip */
const power = clip('mn_power', 1.05, { swell: 0.05, hit: 0.62 }, [
  key(0, G()),
  key(0.5, G({ hips: [0, -34, 0], spine: [-4, -12, 0], chest: [-6, -26, 0], head: [0, 30, 0], 'thigh.L': [-14, 0, 8], 'thigh.R': [14, 0, -8], 'shin.R': [16, 0, 0], 'upperarm.R': [36, 0, -46], 'forearm.R': [-118, 0, 0], 'upperarm.L': [-70, 0, 34], 'forearm.L': [-30, 0, 0] }), [0, -0.06, -0.06], 'inOut'),
  key(0.63, G({ hips: [4, 30, 0], spine: [12, 14, 0], chest: [8, 30, 0], head: [-2, -24, 0], 'thigh.L': [-42, 0, 6], 'shin.L': [42, 0, 0], 'thigh.R': [24, 0, -6], 'upperarm.R': [-94, 0, -2], 'forearm.R': [-2, 0, 0], 'upperarm.L': [-10, 0, 40], 'forearm.L': [-60, 0, 0] }), [0, -0.12, 0.18], 'outExpo'),
  key(0.85, G({ hips: [4, 28, 0], spine: [12, 12, 0], chest: [8, 28, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [40, 0, 0], 'upperarm.R': [-90, 0, -2], 'forearm.R': [-6, 0, 0] }), [0, -0.11, 0.16], 'linear'),
  key(1.05, I(), [0, -0.012, 0], 'inOut'),
]);
/** RMB at range: the small bow out of the heart case at her left hip, three heart arrows */
const DRAW: Record<string, E> = { hips: [0, -26, 0], spine: [-2, -8, 0], chest: [-4, -18, 0], head: [-2, 28, 0], 'upperarm.L': [-88, 0, 24], 'forearm.L': [-2, 0, 0], 'hand.L': [0, 0, 0], 'upperarm.R': [-84, 0, 40], 'forearm.R': [-140, 0, 0] };
const LOOSE: Record<string, E> = { ...DRAW, chest: [-8, -22, 0], 'upperarm.R': [-60, 0, -10], 'forearm.R': [-70, 0, 0] };
const bow = clip('mn_bow', 1.2, { pop: 0.12, catch: 0.28, a0: 0.5, a1: 0.64, a2: 0.78 }, [
  key(0, I()),
  key(0.12, I({ chest: [0, 20, 0], 'upperarm.R': [10, 0, 30], 'forearm.R': [-70, 0, 0], 'hand.R': [0, 0, 30] }), [0, -0.01, 0], 'out'),
  key(0.28, I({ head: [-16, 0, 0], 'upperarm.L': [-150, 0, 20], 'forearm.L': [-10, 0, 0] }), [0, 0.01, 0], 'outExpo'),
  key(0.42, I(DRAW), [0, -0.02, 0], 'inOut'),
  key(0.5, I(LOOSE), [0, -0.02, -0.02], 'outExpo'),
  key(0.57, I(DRAW), [0, -0.02, 0], 'inOut'),
  key(0.64, I(LOOSE), [0, -0.02, -0.02], 'outExpo'),
  key(0.71, I(DRAW), [0, -0.02, 0], 'inOut'),
  key(0.78, I(LOOSE), [0, -0.02, -0.02], 'outExpo'),
  key(1.2, I(), [0, -0.012, 0], 'inOut'),
], { fadeOut: 0.26 });
/** Q: Diamond Push — the hands brought together before the chest, fingers framing a diamond, then shoved forward */
const DIAMOND: Record<string, E> = { 'upperarm.L': [-70, 0, -18], 'forearm.L': [-70, 0, 0], 'hand.L': [0, 0, 50], 'upperarm.R': [-70, 0, 18], 'forearm.R': [-70, 0, 0], 'hand.R': [0, 0, -50] };
const diamond = clip('mn_diamond', 1.0, { frame: 0.12, push: 0.48 }, [
  key(0, I()),
  key(0.3, I({ ...DIAMOND, spine: [-4, 0, 0], chest: [-6, 0, 0], head: [-4, 0, 0], 'thigh.R': [10, 0, -4], 'shin.R': [14, 0, 0] }), [0, -0.03, -0.04], 'inOut'),
  key(0.42, I({ ...DIAMOND, spine: [-6, 0, 0], chest: [-8, 0, 0] }), [0, -0.04, -0.06], 'linear'),
  key(0.5, I({ spine: [12, 0, 0], chest: [8, 0, 0], head: [-6, 0, 0], 'upperarm.L': [-94, 0, -8], 'forearm.L': [-4, 0, 0], 'hand.L': [0, 0, 60], 'upperarm.R': [-94, 0, 8], 'forearm.R': [-4, 0, 0], 'hand.R': [0, 0, -60], 'thigh.L': [-36, 0, 4], 'shin.L': [36, 0, 0], 'thigh.R': [22, 0, -4] }), [0, -0.1, 0.16], 'outExpo'),
  key(0.78, I({ spine: [10, 0, 0], chest: [6, 0, 0], 'upperarm.L': [-90, 0, -8], 'forearm.L': [-8, 0, 0], 'upperarm.R': [-90, 0, 8], 'forearm.R': [-8, 0, 0], 'thigh.L': [-32, 0, 4], 'shin.L': [32, 0, 0] }), [0, -0.09, 0.14], 'linear'),
  key(1.0, I(), [0, -0.012, 0], 'inOut'),
]);
/** E: Lift & Throw — down into the ground with both hands, the chunk raised overhead, then hurled */
const OVERHEAD: Record<string, E> = { spine: [-8, 0, 0], chest: [-10, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-168, 0, 16], 'forearm.L': [-24, 0, 0], 'upperarm.R': [-168, 0, -16], 'forearm.R': [-24, 0, 0], 'thigh.L': [-8, 0, 6], 'thigh.R': [-6, 0, -6] };
const lift = clip('mn_lift', 1.3, { grab: 0.3, up: 0.62, throw: 0.98 }, [
  key(0, I()),
  key(0.3, I({ spine: [40, 0, 0], chest: [14, 0, 0], head: [-26, 0, 0], 'thigh.L': [-80, 0, 8], 'shin.L': [110, 0, 0], 'thigh.R': [-70, 0, -8], 'shin.R': [100, 0, 0], 'upperarm.L': [-70, 0, 16], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-70, 0, -16], 'forearm.R': [-10, 0, 0] }), [0, -0.5, 0.06], 'outExpo'),
  key(0.62, I(OVERHEAD), [0, 0.02, 0], 'inOut'),
  key(0.9, I({ ...OVERHEAD, spine: [-16, 0, 0], chest: [-16, 0, 0], 'upperarm.L': [-188, 0, 16], 'upperarm.R': [-188, 0, -16] }), [0, 0.02, -0.06], 'inOut'),
  key(1.0, I({ spine: [24, 0, 0], chest: [14, 0, 0], head: [6, 0, 0], 'upperarm.L': [-80, 0, 14], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-80, 0, -14], 'forearm.R': [-10, 0, 0], 'thigh.L': [-36, 0, 6], 'shin.L': [36, 0, 0], 'thigh.R': [20, 0, -6] }), [0, -0.08, 0.14], 'outExpo'),
  key(1.3, I(), [0, -0.012, 0], 'inOut'),
]);
/** E in Muscle Up: the Building Drop — the section held high, carried, then thrown down */
const drop = clip('mn_drop', 1.7, { grab: 0.3, up: 0.7, throw: 1.3 }, [
  key(0, I()),
  key(0.3, I({ spine: [40, 0, 0], chest: [14, 0, 0], head: [-26, 0, 0], 'thigh.L': [-80, 0, 8], 'shin.L': [110, 0, 0], 'thigh.R': [-70, 0, -8], 'shin.R': [100, 0, 0], 'upperarm.L': [-70, 0, 16], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-70, 0, -16], 'forearm.R': [-10, 0, 0] }), [0, -0.5, 0.06], 'outExpo'),
  key(0.7, I({ ...OVERHEAD, 'upperarm.L': [-160, 0, 30], 'upperarm.R': [-160, 0, -30] }), [0, 0.02, 0], 'inOut'),
  key(1.2, I({ ...OVERHEAD, spine: [-14, 0, 0], 'upperarm.L': [-176, 0, 26], 'upperarm.R': [-176, 0, -26] }), [0, 0.02, -0.04], 'inOut'),
  key(1.34, I({ spine: [30, 0, 0], chest: [16, 0, 0], head: [8, 0, 0], 'upperarm.L': [-60, 0, 20], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-60, 0, -20], 'forearm.R': [-10, 0, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [40, 0, 0], 'thigh.R': [20, 0, -6] }), [0, -0.12, 0.12], 'outExpo'),
  key(1.7, I(), [0, -0.012, 0], 'inOut'),
]);
/** R: the head-grab — a reach on the dash; the run with the arm out, driving; the slam */
const grab = clip('mn_grab', 0.3, { grab: 0.12 }, [
  key(0, I()),
  key(0.12, I({ spine: [14, 0, 0], chest: [8, 20, 0], 'upperarm.R': [-96, 0, -8], 'forearm.R': [-10, 0, 0], 'hand.R': [0, 0, -30], 'thigh.L': [-40, 0, 4], 'shin.L': [40, 0, 0] }), [0, -0.06, 0.1], 'outExpo'),
  key(0.3, I({ spine: [16, 0, 0], chest: [8, 20, 0], 'upperarm.R': [-96, 0, -8], 'forearm.R': [-10, 0, 0], 'hand.R': [0, 0, -30] }), [0, -0.05, 0.08], 'linear'),
]);
const drive = clip('mn_drive', 0.36, {}, [
  key(0, { spine: [22, 0, 0], chest: [6, 16, 0], head: [-8, -10, 0], 'upperarm.R': [-98, 0, -6], 'forearm.R': [-8, 0, 0], 'upperarm.L': [30, 0, 20], 'forearm.L': [-60, 0, 0], 'thigh.L': [-60, 0, 0], 'shin.L': [60, 0, 0], 'thigh.R': [30, 0, 0], 'shin.R': [70, 0, 0] }, [0, -0.06, 0], 'inOut'),
  key(0.18, { spine: [22, 0, 0], chest: [6, 16, 0], head: [-8, -10, 0], 'upperarm.R': [-98, 0, -6], 'forearm.R': [-8, 0, 0], 'upperarm.L': [-40, 0, 20], 'forearm.L': [-60, 0, 0], 'thigh.L': [30, 0, 0], 'shin.L': [70, 0, 0], 'thigh.R': [-60, 0, 0], 'shin.R': [60, 0, 0] }, [0, -0.02, 0], 'inOut'),
  key(0.36, { spine: [22, 0, 0], chest: [6, 16, 0], head: [-8, -10, 0], 'upperarm.R': [-98, 0, -6], 'forearm.R': [-8, 0, 0], 'upperarm.L': [30, 0, 20], 'forearm.L': [-60, 0, 0], 'thigh.L': [-60, 0, 0], 'shin.L': [60, 0, 0], 'thigh.R': [30, 0, 0], 'shin.R': [70, 0, 0] }, [0, -0.06, 0], 'inOut'),
], { loop: true, fadeIn: 0.08, fadeOut: 0.1 });
const slam = clip('mn_slam', 0.8, { lift: 0.12, slam: 0.32 }, [
  key(0, I({ spine: [20, 0, 0], 'upperarm.R': [-98, 0, -6], 'forearm.R': [-8, 0, 0] }), [0, -0.05, 0]),
  key(0.18, I({ spine: [-12, 0, 0], chest: [-10, 0, 0], head: [-14, 0, 0], 'upperarm.R': [-170, 0, -8], 'forearm.R': [-10, 0, 0], 'upperarm.L': [-60, 0, 30] }), [0, 0.04, -0.02], 'out'),
  key(0.33, I({ spine: [40, 0, 0], chest: [16, 0, 0], head: [10, 0, 0], 'upperarm.R': [-40, 0, -6], 'forearm.R': [-10, 0, 0], 'thigh.L': [-60, 0, 4], 'shin.L': [80, 0, 0], 'thigh.R': [10, 0, -4], 'shin.R': [50, 0, 0] }), [0, -0.36, 0.12], 'outExpo'),
  key(0.6, I({ spine: [36, 0, 0], chest: [14, 0, 0], 'upperarm.R': [-44, 0, -6], 'forearm.R': [-12, 0, 0], 'thigh.L': [-56, 0, 4], 'shin.L': [74, 0, 0], 'thigh.R': [8, 0, -4], 'shin.R': [46, 0, 0] }), [0, -0.33, 0.1], 'inOut'),
  key(0.8, I(), [0, -0.012, 0], 'inOut'),
]);
/** G: Muscle Up — a double-biceps flex as both arms swell */
const flex = clip('mn_flex', 0.95, { swell: 0.3 }, [
  key(0, I()),
  key(0.3, I({ spine: [-6, 0, 0], chest: [-10, 0, 0], head: [-6, 0, -6], 'upperarm.L': [-10, 0, 88], 'forearm.L': [-110, 0, 0], 'hand.L': [0, 0, 10], 'upperarm.R': [-10, 0, -88], 'forearm.R': [-110, 0, 0], 'hand.R': [0, 0, -10], 'thigh.L': [-4, 0, 10], 'thigh.R': [-4, 0, -10] }), [0, -0.02, 0], 'outExpo'),
  key(0.75, I({ spine: [-8, 0, 0], chest: [-12, 0, 0], head: [-8, 0, -6], 'upperarm.L': [-12, 0, 92], 'forearm.L': [-116, 0, 0], 'upperarm.R': [-12, 0, -92], 'forearm.R': [-116, 0, 0], 'thigh.L': [-4, 0, 10], 'thigh.R': [-4, 0, -10] }), [0, -0.03, 0], 'inOut'),
  key(0.95, I(), [0, -0.012, 0], 'inOut'),
]);
/** F: Pornipora — curled, then thrown open */
const release = clip('mn_release', 1.1, { burst: 0.6 }, [
  key(0, I()),
  key(0.38, I({ spine: [18, 0, 0], chest: [12, 0, 0], head: [12, 0, 0], 'thigh.L': [-24, 0, 4], 'shin.L': [40, 0, 0], 'thigh.R': [-18, 0, -4], 'shin.R': [36, 0, 0], 'upperarm.L': [-60, 0, -20], 'forearm.L': [-110, 0, 0], 'upperarm.R': [-60, 0, 20], 'forearm.R': [-110, 0, 0] }), [0, -0.08, 0], 'inOut'),
  key(0.6, I({ spine: [-12, 0, 0], chest: [-14, 0, 0], head: [-22, 0, 0], 'upperarm.L': [-20, 0, 70], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-20, 0, -70], 'forearm.R': [-10, 0, 0] }), [0, 0.02, 0], 'outExpo'),
  key(0.85, I({ spine: [-10, 0, 0], chest: [-12, 0, 0], head: [-18, 0, 0], 'upperarm.L': [-20, 0, 64], 'upperarm.R': [-20, 0, -64] }), [0, 0.01, 0], 'inOut'),
  key(1.1, I(), [0, -0.012, 0], 'inOut'),
]);

// ------------------------------------------------------------------ Pornipora

/** LMB: Dumbbell Duster — alternating dumbbell blows, the last a two-handed slam */
const db = (name: string, side: 'L' | 'R', hit: number, dur: number): ClipDef => {
  const k = side === 'L' ? 1 : -1;
  return clip(name, dur, { step: 0.03, hit, combo: hit + 0.1 }, [
    key(0, F()),
    key(hit * 0.5, F({ hips: [0, k * 18, 0], chest: [0, k * 22, 0], [`upperarm.${side}`]: [-30, 0, k * 60], [`forearm.${side}`]: [-100, 0, 0] }), [0, 0, -0.02], 'out'),
    key(hit, F({ hips: [2, -k * 20, 0], spine: [8, -k * 6, 0], chest: [6, -k * 26, 0], [`upperarm.${side}`]: [-90, 0, -k * 4], [`forearm.${side}`]: [-30, 0, 0] }), [0, 0, 0.08], 'outExpo'),
    key(dur, F(), [0, 0, 0], 'inOut'),
  ]);
};
const db1 = db('mn_db1', 'R', 0.11, 0.34);
const db2 = db('mn_db2', 'L', 0.11, 0.34);
const db3 = db('mn_db3', 'R', 0.11, 0.34);
const db4 = db('mn_db4', 'L', 0.12, 0.36);
const db5 = clip('mn_db5', 0.66, { step: 0.08, hit: 0.26, combo: 0.4 }, [
  key(0, F()),
  key(0.16, F({ spine: [-14, 0, 0], chest: [-12, 0, 0], 'upperarm.L': [-170, 0, -8], 'forearm.L': [-30, 0, 0], 'upperarm.R': [-170, 0, 8], 'forearm.R': [-30, 0, 0] }), [0, 0.05, -0.02], 'inOut'),
  key(0.27, F({ spine: [36, 0, 0], chest: [18, 0, 0], 'upperarm.L': [-60, 0, -12], 'forearm.L': [-20, 0, 0], 'upperarm.R': [-60, 0, 12], 'forearm.R': [-20, 0, 0] }), [0, -0.05, 0.12], 'outExpo'),
  key(0.66, F(), [0, 0, 0], 'inOut'),
]);
export const PORNIPORA_CHAIN = ['mn_db1', 'mn_db2', 'mn_db3', 'mn_db4', 'mn_db5'];

/** Q: Baton Beat — the staff held out, two full spins */
const BAT: Record<string, E> = { 'upperarm.R': [-80, 0, -40], 'forearm.R': [-10, 0, 0], 'upperarm.L': [-60, 0, 40], 'forearm.L': [-60, 0, 0] };
const baton = clip('mn_baton', 1.3, { spin: 0.1 }, [
  key(0, F()),
  key(0.1, F({ ...BAT, hips: [0, 0, 0] }), [0, 0, 0], 'out'),
  key(0.35, F({ ...BAT, hips: [0, 180, 0] }), [0, 0, 0], 'linear'),
  key(0.6, F({ ...BAT, hips: [0, 360, 0] }), [0, 0, 0], 'linear'),
  key(0.85, F({ ...BAT, hips: [0, 540, 0] }), [0, 0, 0], 'linear'),
  key(1.1, F({ ...BAT, hips: [0, 720, 0] }), [0, 0, 0], 'linear'),
  key(1.3, F({ hips: [0, 720, 0] }), [0, 0, 0], 'inOut'),
]);
/** E: Halteres — the blade raised high overhead, then the dive, the blade brought down with her */
const halteres = clip('mn_halteres', 1.25, { up: 0.12, dive: 0.5, hit: 0.78 }, [
  key(0, F()),
  key(0.45, F({ spine: [-14, 0, 0], chest: [-14, 0, 0], head: [-14, 0, 0], 'upperarm.R': [-178, 0, -6], 'forearm.R': [-20, 0, 0], 'upperarm.L': [-178, 0, 6], 'forearm.L': [-20, 0, 0], 'thigh.L': [-10, 0, 0], 'shin.L': [30, 0, 0] }), [0, 0.04, 0], 'inOut'),
  key(0.78, F({ hips: [30, 0, 0], spine: [30, 0, 0], chest: [16, 0, 0], head: [6, 0, 0], 'upperarm.R': [-60, 0, -10], 'forearm.R': [-6, 0, 0], 'upperarm.L': [-60, 0, 10], 'forearm.L': [-6, 0, 0] }), [0, -0.1, 0.12], 'outExpo'),
  key(1.05, F({ hips: [24, 0, 0], spine: [26, 0, 0], chest: [14, 0, 0], 'upperarm.R': [-56, 0, -10], 'forearm.R': [-8, 0, 0], 'upperarm.L': [-56, 0, 10], 'forearm.L': [-8, 0, 0] }), [0, -0.08, 0.1], 'inOut'),
  key(1.25, F(), [0, 0, 0], 'inOut'),
]);
/** G: Sklaverei — arms open low, palms up (held by the kit) */
const sklav = clip('mn_sklav', 2.4, { start: 0.2 }, [
  key(0, F()),
  key(0.3, F({ spine: [-6, 0, 0], chest: [-10, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-26, 0, 46], 'forearm.L': [-26, -50, 0], 'upperarm.R': [-26, 0, -46], 'forearm.R': [-26, 50, 0] }), [0, 0.02, 0], 'out'),
  key(2.0, F({ spine: [-8, 0, 0], chest: [-12, 0, 0], head: [-18, 0, 0], 'upperarm.L': [-30, 0, 50], 'forearm.L': [-26, -50, 0], 'upperarm.R': [-30, 0, -50], 'forearm.R': [-26, 50, 0] }), [0, 0.03, 0], 'inOut'),
  key(2.4, F(), [0, 0, 0], 'inOut'),
]);
/** F in Pornipora: the Building Drop from the sky — both arms up under the weight, held, thrown down */
const skyDrop = clip('mn_skydrop', 1.9, { grab: 0.25, up: 0.6, throw: 1.45 }, [
  key(0, F()),
  key(0.25, F({ spine: [30, 0, 0], chest: [12, 0, 0], 'upperarm.L': [-80, 0, 20], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-80, 0, -20], 'forearm.R': [-10, 0, 0] }), [0, -0.02, 0.04], 'outExpo'),
  key(0.6, F({ spine: [-10, 0, 0], chest: [-12, 0, 0], head: [-12, 0, 0], 'upperarm.L': [-168, 0, 26], 'forearm.L': [-20, 0, 0], 'upperarm.R': [-168, 0, -26], 'forearm.R': [-20, 0, 0] }), [0, 0.04, 0], 'inOut'),
  key(1.38, F({ spine: [-14, 0, 0], chest: [-14, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-178, 0, 24], 'forearm.L': [-18, 0, 0], 'upperarm.R': [-178, 0, -24], 'forearm.R': [-18, 0, 0] }), [0, 0.04, -0.03], 'inOut'),
  key(1.5, F({ spine: [30, 0, 0], chest: [16, 0, 0], head: [8, 0, 0], 'upperarm.L': [-60, 0, 20], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-60, 0, -20], 'forearm.R': [-10, 0, 0] }), [0, -0.06, 0.1], 'outExpo'),
  key(1.9, F(), [0, 0, 0], 'inOut'),
]);

const SHARED = ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name));
export const MENINAS_CLIPS: ClipDef[] = [jab, straight, hook, hammer, power, bow, diamond, lift, drop, grab, drive, slam, flex, release, ...SHARED];
export const PORNIPORA_CLIPS: ClipDef[] = [db1, db2, db3, db4, db5, baton, halteres, sklav, skyDrop, diamond, grab, drive, slam, power, release, ...SHARED];
