// Candice's animation set. Cocky and loose: the weight on one leg, the left hand on her hip, the right hand open at her
// side and crackling. The string: a right palm, a left palm, a high heeled kick and the electrified swat (a backhand
// from across her body). Lightning Engulf (a lunge, the hands clapped round the target and held); the pointed hand of
// the Thunderbolt; the hand to the sky of the Sky Strike; Galvano Blast (the heart case clicked, the bow caught over her
// head, drawn and loosed); the Rage Discharge (curled, then thrown open); the release (arms crossed, flung up and out).
// Barbarriel: a lightning sword in each hand held low; four criss-cross cuts (right, left, a level sweep, the crossed
// double cut), "I've got six" (arms spread, a spin, then the pointing hand flinging the wings), the javelin throw, both
// arms to the sky for The Thunderbolt, the sword levelled for the stream, Sklaverei (arms low and open) and
// Electrocution (an arm to the sky, the lightning squeezed down round it, thrown). Events: 'step' lunge, 'hit' strike,
// 'combo' next input, plus per-move fx events.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys, type SwingDef } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

/** the left hand on her hip */
const HIP_HAND: Record<string, E> = { 'upperarm.L': [14, 0, 26], 'forearm.L': [-74, -20, 0], 'hand.L': [10, 0, 10] };
const IDLE: Record<string, E> = {
  hips: [0, 10, -4], spine: [-2, -3, 2], chest: [-5, -7, 2], neck: [0, 0, 0], head: [-3, 10, -6],
  'thigh.L': [-3, 0, 2], 'shin.L': [5, 0, 0], 'thigh.R': [5, 0, -7], 'shin.R': [14, 0, 0], 'foot.R': [-8, 0, 4],
  ...HIP_HAND,
  'upperarm.R': [-12, 0, -16], 'forearm.R': [-36, 30, 0], 'hand.R': [-10, 0, -16],
};
const I = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });

export const CANDICE_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.01,
  run: { spine: [8, 0, 0], chest: [2, 0, 0], head: [-6, 0, 0], 'upperarm.L': [-10, 0, 10], 'forearm.L': [-50, 0, 0], 'upperarm.R': [-10, 0, -10], 'forearm.R': [-50, 0, 0] },
  sprint: { spine: [16, 0, 0], chest: [4, 0, 0], head: [-10, 0, 0], 'upperarm.L': [30, 0, 14], 'forearm.L': [-40, 0, 0], 'upperarm.R': [30, 0, -14], 'forearm.R': [-40, 0, 0] },
  swingL: 0.8,
  swingR: 0.8,
  freqScale: 1.05,
};

const clip = (name: string, dur: number, events: Record<string, number>, keys: KeyDef[], o: { fadeIn?: number; fadeOut?: number; loop?: boolean } = {}): ClipDef => ({
  name, dur, fadeIn: o.fadeIn ?? 0.05, fadeOut: o.fadeOut ?? 0.22, events, keys, ...(o.loop ? { loop: true } : {}),
});

// ------------------------------------------------------------------ the string

/** LMB 1: the right palm driven out, the wrist bent back */
const palm1 = clip('cc_palm1', 0.44, { step: 0.04, hit: 0.12, combo: 0.2 }, [
  key(0, I()),
  key(0.07, I({ hips: [0, -14, 0], chest: [0, -16, 0], head: [-2, 12, 0], 'upperarm.R': [12, 0, -26], 'forearm.R': [-104, 0, 0], 'hand.R': [0, 0, -40] }), [0, -0.03, -0.03], 'out'),
  key(0.13, I({ hips: [2, 18, 0], spine: [6, 6, 0], chest: [4, 18, 0], head: [-4, -14, 0], 'thigh.L': [-26, 0, 4], 'shin.L': [26, 0, 0], 'upperarm.R': [-88, 0, -4], 'forearm.R': [-6, 0, 0], 'hand.R': [0, 0, -75] }), [0, -0.06, 0.08], 'outExpo'),
  key(0.26, I({ hips: [2, 18, 0], spine: [6, 6, 0], chest: [4, 18, 0], head: [-4, -14, 0], 'thigh.L': [-26, 0, 4], 'shin.L': [26, 0, 0], 'upperarm.R': [-86, 0, -4], 'forearm.R': [-8, 0, 0], 'hand.R': [0, 0, -70] }), [0, -0.06, 0.07], 'linear'),
  key(0.44, I(), [0, -0.012, 0], 'inOut'),
]);
/** LMB 2: the left palm, the hip leaving her hand */
const palm2 = clip('cc_palm2', 0.44, { step: 0.04, hit: 0.12, combo: 0.2 }, [
  key(0, I()),
  key(0.07, I({ hips: [0, 14, 0], chest: [0, 18, 0], head: [-2, -8, 0], 'upperarm.L': [12, 0, 26], 'forearm.L': [-104, 0, 0], 'hand.L': [0, 0, 40] }), [0, -0.03, -0.03], 'out'),
  key(0.13, I({ hips: [2, -16, 0], spine: [6, -6, 0], chest: [4, -18, 0], head: [-4, 14, 0], 'thigh.R': [-24, 0, -4], 'shin.R': [24, 0, 0], 'upperarm.L': [-88, 0, 4], 'forearm.L': [-6, 0, 0], 'hand.L': [0, 0, 75] }), [0, -0.06, 0.08], 'outExpo'),
  key(0.26, I({ hips: [2, -16, 0], spine: [6, -6, 0], chest: [4, -18, 0], head: [-4, 14, 0], 'thigh.R': [-24, 0, -4], 'shin.R': [24, 0, 0], 'upperarm.L': [-86, 0, 4], 'forearm.L': [-8, 0, 0], 'hand.L': [0, 0, 70] }), [0, -0.06, 0.07], 'linear'),
  key(0.44, I(), [0, -0.012, 0], 'inOut'),
]);
/** LMB 3: a high kick of the heeled right boot, leaning back */
const kick = clip('cc_kick', 0.56, { step: 0.06, hit: 0.18, combo: 0.28 }, [
  key(0, I()),
  key(0.1, I({ spine: [-4, 0, 0], chest: [-4, -6, 0], 'thigh.R': [-40, 0, -4], 'shin.R': [80, 0, 0], 'upperarm.R': [-30, 0, -40], 'forearm.R': [-40, 0, 0] }), [0, -0.03, -0.02], 'out'),
  key(0.18, I({ spine: [-16, 0, 0], chest: [-10, -6, 0], head: [12, 0, 0], 'thigh.R': [-110, 0, -6], 'shin.R': [6, 0, 0], 'foot.R': [24, 0, 0], 'thigh.L': [8, 0, 6], 'shin.L': [10, 0, 0], 'upperarm.R': [-20, 0, -60], 'forearm.R': [-20, 0, 0], 'upperarm.L': [-10, 0, 50], 'forearm.L': [-30, 0, 0] }), [0, 0.03, 0.06], 'outExpo'),
  key(0.32, I({ spine: [-12, 0, 0], 'thigh.R': [-80, 0, -6], 'shin.R': [40, 0, 0], 'upperarm.R': [-20, 0, -50], 'upperarm.L': [-10, 0, 40], 'forearm.L': [-30, 0, 0] }), [0, 0.02, 0.04], 'inOut'),
  key(0.56, I(), [0, -0.012, 0], 'inOut'),
]);
/** LMB 4: the electrified swat — the right hand cocked by her left shoulder, a backhand flung out across */
const swat = clip('cc_swat', 0.66, { step: 0.1, hit: 0.24, combo: 0.36, charge: 0.08 }, [
  key(0, I()),
  key(0.16, I({ hips: [0, 22, 0], spine: [2, 10, 0], chest: [2, 24, 0], head: [-2, -16, 0], 'upperarm.R': [-60, 0, 40], 'forearm.R': [-110, 0, 0], 'hand.R': [0, 0, 30], 'upperarm.L': [-10, 0, 30], 'forearm.L': [-50, 0, 0] }), [0, -0.04, -0.02], 'inOut'),
  key(0.25, I({ hips: [2, -24, 0], spine: [6, -10, 0], chest: [4, -26, 0], head: [-4, 18, 0], 'thigh.L': [-24, 0, 4], 'shin.L': [24, 0, 0], 'upperarm.R': [-80, 0, -72], 'forearm.R': [-12, 0, 0], 'hand.R': [0, 0, -20], 'upperarm.L': [-10, 0, 40], 'forearm.L': [-40, 0, 0] }), [0, -0.06, 0.08], 'outExpo'),
  key(0.42, I({ hips: [2, -26, 0], spine: [6, -10, 0], chest: [4, -28, 0], head: [-4, 18, 0], 'thigh.L': [-22, 0, 4], 'shin.L': [22, 0, 0], 'upperarm.R': [-70, 0, -80], 'forearm.R': [-16, 0, 0], 'upperarm.L': [-10, 0, 40], 'forearm.L': [-40, 0, 0] }), [0, -0.05, 0.07], 'linear'),
  key(0.66, I(), [0, -0.012, 0], 'inOut'),
]);

// ------------------------------------------------------------------ the skills

/** RMB: Lightning Engulf — a lunge, the hands clapped together round the target, held while the lightning surges */
const engulf = clip('cc_engulf', 1.25, { step: 0.06, clap: 0.22, end: 1.0 }, [
  key(0, I()),
  key(0.12, I({ spine: [6, 0, 0], chest: [-6, 0, 0], 'upperarm.L': [-60, 0, 60], 'forearm.L': [-30, 0, 0], 'upperarm.R': [-60, 0, -60], 'forearm.R': [-30, 0, 0] }), [0, -0.04, 0.02], 'out'),
  key(0.22, I({ hips: [0, 0, 0], spine: [12, 0, 0], chest: [6, 0, 0], head: [-6, 0, 0], 'thigh.L': [-30, 0, 4], 'shin.L': [30, 0, 0], 'thigh.R': [10, 0, -4], 'upperarm.L': [-84, 0, -10], 'forearm.L': [-16, 0, 0], 'hand.L': [0, 0, 0], 'upperarm.R': [-84, 0, 10], 'forearm.R': [-16, 0, 0], 'hand.R': [0, 0, 0] }), [0, -0.08, 0.1], 'outExpo'),
  key(0.95, I({ spine: [14, 0, 0], chest: [6, 0, 0], head: [-8, 0, 0], 'thigh.L': [-30, 0, 4], 'shin.L': [30, 0, 0], 'thigh.R': [10, 0, -4], 'upperarm.L': [-80, 0, -6], 'forearm.L': [-20, 0, 0], 'upperarm.R': [-80, 0, 6], 'forearm.R': [-20, 0, 0] }), [0, -0.08, 0.1], 'linear'),
  key(1.25, I(), [0, -0.012, 0], 'inOut'),
]);
/** Q: the Thunderbolt — the right arm thrown out pointing, three jolts back through it */
const POINT: Record<string, E> = { hips: [0, -10, 0], chest: [0, -14, 0], head: [-2, 10, 0], 'upperarm.R': [-90, 0, -2], 'forearm.R': [-4, 0, 0], 'hand.R': [0, 0, 0] };
const JOLT: Record<string, E> = { ...POINT, chest: [-6, -18, 0], 'upperarm.R': [-100, 0, -6], 'forearm.R': [-14, 0, 0] };
const point = clip('cc_point', 0.8, { b0: 0.12, b1: 0.28, b2: 0.44 }, [
  key(0, I()),
  key(0.1, I(POINT), [0, -0.02, 0.02], 'outExpo'),
  key(0.15, I(JOLT), [0, -0.02, 0], 'out'),
  key(0.24, I(POINT), [0, -0.02, 0.02], 'inOut'),
  key(0.31, I(JOLT), [0, -0.02, 0], 'out'),
  key(0.4, I(POINT), [0, -0.02, 0.02], 'inOut'),
  key(0.47, I(JOLT), [0, -0.02, 0], 'out'),
  key(0.58, I(POINT), [0, -0.02, 0.02], 'inOut'),
  key(0.8, I(), [0, -0.012, 0], 'inOut'),
]);
/** E: Sky Strike — a hand flung up to the sky, then brought down pointing at the target */
const sky = clip('cc_sky', 1.0, { call: 0.2 }, [
  key(0, I()),
  key(0.2, I({ spine: [-6, 0, 0], chest: [-10, 0, 0], head: [-24, 0, 0], 'upperarm.R': [-172, 0, -14], 'forearm.R': [-6, 0, 0], 'hand.R': [0, 0, 0] }), [0, 0.02, 0], 'outExpo'),
  key(0.46, I({ spine: [-6, 0, 0], chest: [-10, 0, 0], head: [-20, 0, 0], 'upperarm.R': [-168, 0, -14], 'forearm.R': [-8, 0, 0] }), [0, 0.02, 0], 'linear'),
  key(0.62, I({ chest: [2, -10, 0], head: [-2, 8, 0], 'upperarm.R': [-100, 0, -6], 'forearm.R': [-4, 0, 0] }), [0, -0.01, 0.02], 'outExpo'),
  key(1.0, I(), [0, -0.012, 0], 'inOut'),
]);
/**
 * R: Galvano Blast — the heart case clicked at her left hip, the bow springing up over her head and caught, brought
 * down at arm's length, the string drawn to her cheek, loosed
 */
const DRAW: Record<string, E> = { hips: [0, -26, 0], spine: [-2, -10, 0], chest: [-4, -20, 0], head: [-2, 30, 0], 'thigh.L': [-14, 0, 8], 'shin.L': [12, 0, 0], 'thigh.R': [8, 0, -10], 'upperarm.L': [-88, 0, 26], 'forearm.L': [-2, 0, 0], 'hand.L': [0, 0, 0] };
const galvano = clip('cc_galvano', 1.5, { click: 0.1, pop: 0.16, catch: 0.34, aim: 0.56, fire: 1.12 }, [
  key(0, I()),
  key(0.1, I({ chest: [0, 8, 0], head: [6, -6, 0], 'upperarm.L': [8, 0, 16], 'forearm.L': [-40, 0, 0], 'hand.L': [0, 0, 20] }), [0, -0.01, 0], 'out'),
  key(0.34, I({ spine: [-6, 0, 0], chest: [-8, 0, 0], head: [-24, 0, 0], 'upperarm.L': [-168, 0, 10], 'forearm.L': [-10, 0, 0], 'hand.L': [0, 0, 0], 'upperarm.R': [-30, 0, -30], 'forearm.R': [-30, 0, 0] }), [0, 0.02, 0], 'outExpo'),
  key(0.56, I({ ...DRAW, 'upperarm.R': [-84, 0, 10], 'forearm.R': [-40, 0, 0], 'hand.R': [0, 0, 0] }), [0, -0.02, 0], 'inOut'),
  key(1.05, I({ ...DRAW, chest: [-6, -24, 0], 'upperarm.R': [-84, 0, 40], 'forearm.R': [-140, 0, 0], 'hand.R': [0, 0, 10] }), [0, -0.03, -0.02], 'inOut'),
  key(1.14, I({ ...DRAW, chest: [-10, -26, 0], 'upperarm.R': [-60, 0, -10], 'forearm.R': [-70, 0, 0], 'hand.R': [0, 0, -30] }), [0, -0.03, -0.04], 'outExpo'),
  key(1.5, I(), [0, -0.012, 0], 'inOut'),
], { fadeOut: 0.26 });
/** G: Rage Discharge — curled in tight, then thrown open screaming, the lightning out of her whole body */
const rage = clip('cc_rage', 0.85, { burst: 0.3 }, [
  key(0, I()),
  key(0.2, I({ spine: [22, 0, 0], chest: [16, 0, 0], head: [16, 0, 0], 'thigh.L': [-30, 0, 4], 'shin.L': [50, 0, 0], 'thigh.R': [-20, 0, -4], 'shin.R': [44, 0, 0], 'upperarm.L': [-70, 0, -24], 'forearm.L': [-120, 0, 0], 'upperarm.R': [-70, 0, 24], 'forearm.R': [-120, 0, 0] }), [0, -0.12, 0], 'inOut'),
  key(0.3, I({ spine: [-14, 0, 0], chest: [-16, 0, 0], head: [-26, 0, 0], 'thigh.L': [-6, 0, 12], 'shin.L': [8, 0, 0], 'thigh.R': [6, 0, -12], 'shin.R': [8, 0, 0], 'upperarm.L': [0, 0, 74], 'forearm.L': [-10, 0, 0], 'hand.L': [0, 0, 30], 'upperarm.R': [0, 0, -74], 'forearm.R': [-10, 0, 0], 'hand.R': [0, 0, -30] }), [0, 0.02, 0], 'outExpo'),
  key(0.55, I({ spine: [-12, 0, 0], chest: [-14, 0, 0], head: [-20, 0, 0], 'upperarm.L': [0, 0, 66], 'forearm.L': [-14, 0, 0], 'upperarm.R': [0, 0, -66], 'forearm.R': [-14, 0, 0] }), [0, 0.01, 0], 'inOut'),
  key(0.85, I(), [0, -0.012, 0], 'inOut'),
]);
/** F: Barbarriel — arms crossed tight over her chest, then flung up and out as the lightning bursts */
const release = clip('cc_release', 1.15, { burst: 0.66 }, [
  key(0, I()),
  key(0.4, I({ spine: [10, 0, 0], chest: [8, 0, 0], head: [12, 0, 0], 'upperarm.L': [-70, 0, -32], 'forearm.L': [-100, 0, 0], 'upperarm.R': [-70, 0, 32], 'forearm.R': [-100, 0, 0], 'thigh.L': [-14, 0, 4], 'shin.L': [26, 0, 0], 'thigh.R': [-10, 0, -4], 'shin.R': [24, 0, 0] }), [0, -0.06, 0], 'inOut'),
  key(0.66, I({ spine: [-12, 0, 0], chest: [-14, 0, 0], head: [-22, 0, 0], 'upperarm.L': [-150, 0, 48], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-150, 0, -48], 'forearm.R': [-10, 0, 0], 'thigh.L': [-4, 0, 8], 'thigh.R': [4, 0, -8] }), [0, 0.03, 0], 'outExpo'),
  key(0.9, I({ spine: [-10, 0, 0], chest: [-12, 0, 0], head: [-18, 0, 0], 'upperarm.L': [-140, 0, 44], 'forearm.L': [-14, 0, 0], 'upperarm.R': [-140, 0, -44], 'forearm.R': [-14, 0, 0] }), [0, 0.02, 0], 'inOut'),
  key(1.15, I(), [0, -0.012, 0], 'inOut'),
]);

/** the order of the string */
export const CANDICE_CHAIN = ['cc_palm1', 'cc_palm2', 'cc_kick', 'cc_swat'];

// ------------------------------------------------------------------ Barbarriel

/** a sword in each hand held low at her sides, the points trailing back; the wings behind */
const B_IDLE: Record<string, E> = {
  hips: [0, 6, 0], spine: [2, -2, 0], chest: [0, -4, 0], head: [-4, 6, -2],
  'thigh.L': [-8, 0, 4], 'shin.L': [10, 0, 0], 'thigh.R': [6, 0, -6], 'shin.R': [12, 0, 0],
  'upperarm.L': [-6, 0, 22], 'forearm.L': [-30, 0, 0], 'hand.L': [-30, 0, 0],
};
const BI = (over: Record<string, E> = {}): Record<string, E> => ({ ...B_IDLE, ...over });
interface Grip { p: E; dir: E; edge: E; pole: E }
const ik = (g: Grip) => ({ '@gripR': g.p, '@dirR': g.dir, '@edgeR': g.edge, '@poleR': g.pole, '@ikR': [1, 0, 0] as E, '@twoHand': [0, 0, 0] as E });
const LOW: Grip = { p: [-0.3, -0.34, 0.06], dir: [-0.35, -0.45, -0.82], edge: [0, -0.9, 0.4], pole: [-0.7, -0.3, -0.6] };

export const BARBARRIEL_STANCE: StanceDef = {
  idle: B_IDLE,
  idleHips: -0.02,
  run: { spine: [10, 0, 0], chest: [2, 0, 0], head: [-6, 0, 0], 'upperarm.L': [20, 0, 20], 'forearm.L': [-30, 0, 0] },
  sprint: { spine: [20, 0, 0], chest: [4, 0, 0], head: [-10, 0, 0], 'upperarm.L': [40, 0, 18], 'forearm.L': [-20, 0, 0] },
  swingL: 0.3,
  swingR: 0.1,
  freqScale: 1.05,
  grip: {
    idle: LOW,
    walk: LOW,
    run: { p: [-0.3, -0.24, -0.1], dir: [-0.3, -0.25, -0.92], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.32, -0.12, -0.2], dir: [-0.25, -0.05, -0.97], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.38, -0.08, 0.06], dir: [-0.6, -0.3, -0.72], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

/** one cut of the dual swords: a swing for the cutting hand (or both), the body keyed round it */
function cut(name: string, o: {
  dur: number; step: number; hit: number; combo?: number; extra?: Record<string, number>;
  swings: (Omit<SwingDef, 'keys'> & { keys: [number, number, KeyDef['ease']?][] })[];
  wind: Record<string, E>; strike: Record<string, E>; strikeHips?: E; windHips?: E; tWind: number; tStrike: number;
}): ClipDef {
  return {
    name, dur: o.dur, fadeIn: 0.05, fadeOut: 0.2, events: { step: o.step, hit: o.hit, ...(o.combo !== undefined ? { combo: o.combo } : {}), ...(o.extra ?? {}) },
    keys: mergeKeys(
      ...o.swings.map((sw) => swingKeys(sw as SwingDef)),
      [
        key(0, BI()),
        key(o.tWind, BI(o.wind), o.windHips ?? [0, -0.03, -0.02], 'out'),
        key(o.tStrike, BI(o.strike), o.strikeHips ?? [0, -0.05, 0.06], 'outExpo'),
        key(o.tStrike + 0.12, BI(o.strike), o.strikeHips ?? [0, -0.05, 0.06], 'linear'),
        key(o.dur, BI(), [0, -0.02, 0], 'inOut'),
      ],
    ),
  };
}

/** LMB 1: the right sword down across from her upper right */
const sw1 = cut('cc_sw1', {
  dur: 0.48, step: 0.04, hit: 0.13, combo: 0.22, tWind: 0.07, tStrike: 0.15,
  swings: [{ a: [-0.6, 0.8, 0], b: [0, 0, 1], c: [-0.12, 0.06, 0.16], r: 0.4, pole: [-0.7, -0.4, -0.4], keys: [[0, 40, 'out'], [0.07, -20, 'out'], [0.16, 130, 'out'], [0.26, 160, 'out'], [0.48, 120, 'inOut']] }],
  wind: { hips: [0, -14, 0], chest: [-2, -16, 0], head: [-2, 12, 0] },
  strike: { hips: [2, 16, 0], spine: [4, 8, 0], chest: [4, 18, 0], head: [-4, -12, 0], 'thigh.L': [-24, 0, 4], 'shin.L': [24, 0, 0] },
});
/** LMB 2: the left sword down across from her upper left */
const sw2 = cut('cc_sw2', {
  dur: 0.48, step: 0.04, hit: 0.13, combo: 0.22, tWind: 0.07, tStrike: 0.15,
  swings: [{ hand: 'L', a: [0.6, 0.8, 0], b: [0, 0, 1], c: [0.12, 0.06, 0.16], r: 0.4, pole: [0.7, -0.4, -0.4], keys: [[0, 40, 'out'], [0.07, -20, 'out'], [0.16, 130, 'out'], [0.26, 160, 'out'], [0.48, 120, 'inOut']] }],
  wind: { hips: [0, 14, 0], chest: [-2, 16, 0], head: [-2, -12, 0] },
  strike: { hips: [2, -16, 0], spine: [4, -8, 0], chest: [4, -18, 0], head: [-4, 12, 0], 'thigh.R': [-24, 0, -4], 'shin.R': [24, 0, 0] },
});
/** LMB 3: the right sword swept level from her right across to her left */
const sw3 = cut('cc_sw3', {
  dur: 0.5, step: 0.05, hit: 0.14, combo: 0.23, tWind: 0.08, tStrike: 0.16,
  swings: [{ a: [-1, 0, 0], b: [0, 0, 1], c: [-0.04, 0.02, 0.14], r: 0.44, pole: [-0.5, -0.6, -0.6], keys: [[0, 20, 'out'], [0.08, -40, 'out'], [0.17, 130, 'out'], [0.28, 170, 'out'], [0.5, 120, 'inOut']] }],
  wind: { hips: [0, -20, 0], chest: [0, -18, 0], head: [-2, 12, 0] },
  strike: { hips: [0, 18, 0], spine: [2, 8, 0], chest: [2, 18, 0], head: [-2, -12, 0], 'thigh.L': [-20, 0, 4], 'shin.L': [20, 0, 0] },
});
/** LMB 4: both swords raised high, brought down crossing in an X */
const sw4 = cut('cc_sw4', {
  dur: 0.76, step: 0.12, hit: 0.27, combo: 0.4, tWind: 0.16, tStrike: 0.28,
  swings: [
    { a: [-0.35, 1, 0], b: [0, 0, 1], c: [-0.1, 0.12, 0.16], r: 0.42, pole: [-0.7, -0.4, -0.4], keys: [[0, 40, 'out'], [0.16, -24, 'inOut'], [0.29, 150, 'outExpo'], [0.42, 168, 'out'], [0.76, 120, 'inOut']] },
    { hand: 'L', a: [0.35, 1, 0], b: [0, 0, 1], c: [0.1, 0.12, 0.16], r: 0.42, pole: [0.7, -0.4, -0.4], keys: [[0, 40, 'out'], [0.16, -24, 'inOut'], [0.29, 150, 'outExpo'], [0.42, 168, 'out'], [0.76, 120, 'inOut']] },
  ],
  wind: { spine: [-8, 0, 0], chest: [-10, 0, 0], head: [-10, 0, 0] },
  windHips: [0, 0.02, -0.04],
  strike: { spine: [14, 0, 0], chest: [10, 0, 0], head: [6, 0, 0], 'thigh.L': [-30, 0, 4], 'shin.L': [30, 0, 0], 'thigh.R': [12, 0, -4] },
  strikeHips: [0, -0.1, 0.12],
});
export const BARBARRIEL_CHAIN = ['cc_sw1', 'cc_sw2', 'cc_sw3', 'cc_sw4'];

/** a held Barbarriel pose: the right sword kept low by IK, the body keyed */
const bpose = (name: string, dur: number, events: Record<string, number>, keys: KeyDef[], o: { loop?: boolean; grips?: { t: number; g: Grip; e?: KeyDef['ease'] }[] } = {}): ClipDef => ({
  name, dur, fadeIn: 0.06, fadeOut: 0.24, events, ...(o.loop ? { loop: true } : {}),
  keys: mergeKeys((o.grips ?? [{ t: 0, g: LOW }, { t: dur, g: LOW }]).map((k) => ({ t: k.t, ease: k.e ?? 'inOut', c: ik(k.g) })), keys),
});
/** the right sword raised straight up over her head */
const UP: Grip = { p: [-0.18, 0.62, 0.1], dir: [0, 1, 0.1], edge: [0, 0, 1], pole: [-0.8, -0.2, 0] };
/** the right sword levelled at the target like a lance */
const LANCE: Grip = { p: [-0.12, 0.08, 0.5], dir: [0.05, 0.02, 1], edge: [0, -1, 0], pole: [-0.6, -0.6, -0.4] };
/** the right sword drawn back over her shoulder for a throw */
const BACK: Grip = { p: [-0.2, 0.34, -0.12], dir: [0.1, 0.3, -0.95], edge: [0, -1, 0], pole: [-0.6, -0.2, -0.7] };
const THROWN: Grip = { p: [-0.1, 0.18, 0.5], dir: [0.1, -0.1, 1], edge: [0, -1, 0], pole: [-0.6, -0.6, -0.3] };
/** both arms spread wide, the swords out to the sides */
const WIDE: Grip = { p: [-0.66, 0.14, 0.06], dir: [-1, 0.1, 0.1], edge: [0, 0, 1], pole: [0, -1, -0.3] };

/** RMB: "I've got six!" — arms spread, a turn as the wings wheel round her, then the hand points them at the target */
const six = bpose('cc_six', 2.3, { spin: 0.2, f0: 1.4, f1: 1.52, f2: 1.64, f3: 1.76, f4: 1.88, f5: 2.0 }, [
  key(0, BI()),
  key(0.2, BI({ chest: [-8, 0, 0], head: [-12, 0, 0], 'upperarm.L': [-10, 0, 86], 'forearm.L': [-6, 0, 0], 'hand.L': [0, 0, 0] }), [0, 0.02, 0], 'outExpo'),
  key(0.6, BI({ hips: [0, 120, 0], chest: [-8, 0, 0], head: [-12, 0, 0], 'upperarm.L': [-10, 0, 86], 'forearm.L': [-6, 0, 0] }), [0, 0.02, 0], 'linear'),
  key(1.0, BI({ hips: [0, 240, 0], chest: [-8, 0, 0], head: [-12, 0, 0], 'upperarm.L': [-10, 0, 86], 'forearm.L': [-6, 0, 0] }), [0, 0.02, 0], 'linear'),
  key(1.3, BI({ hips: [0, 360, 0], chest: [-6, 0, 0], head: [-8, 0, 0], 'upperarm.L': [-10, 0, 80], 'forearm.L': [-6, 0, 0] }), [0, 0.01, 0], 'out'),
  key(1.4, BI({ hips: [0, 340, 0], chest: [2, -10, 0], head: [-2, 10, 0], 'upperarm.L': [-20, 0, 50], 'forearm.L': [-20, 0, 0] }), [0, -0.02, 0.02], 'outExpo'),
  key(2.0, BI({ hips: [0, 340, 0], chest: [2, -10, 0], head: [-2, 10, 0], 'upperarm.L': [-20, 0, 50], 'forearm.L': [-20, 0, 0] }), [0, -0.02, 0.02], 'linear'),
  key(2.3, BI({ hips: [0, 360, 0] }), [0, -0.02, 0], 'inOut'),
], { grips: [{ t: 0, g: LOW }, { t: 0.2, g: WIDE, e: 'outExpo' }, { t: 1.3, g: WIDE }, { t: 1.4, g: LANCE, e: 'outExpo' }, { t: 2.0, g: LANCE }, { t: 2.3, g: LOW }] });
/** Q: Galvano Javelin — the right sword drawn back over her shoulder and hurled */
const javelin = bpose('cc_javelin', 0.72, { step: 0.06, throw: 0.3 }, [
  key(0, BI()),
  key(0.18, BI({ hips: [0, -24, 0], spine: [-4, -8, 0], chest: [-8, -20, 0], head: [-2, 22, 0], 'thigh.L': [-20, 0, 6], 'shin.L': [16, 0, 0], 'upperarm.L': [-60, 0, 30], 'forearm.L': [-20, 0, 0] }), [0, -0.02, -0.04], 'inOut'),
  key(0.3, BI({ hips: [2, 22, 0], spine: [8, 10, 0], chest: [6, 22, 0], head: [-4, -14, 0], 'thigh.L': [-30, 0, 4], 'shin.L': [30, 0, 0], 'upperarm.L': [-20, 0, 40], 'forearm.L': [-30, 0, 0] }), [0, -0.06, 0.08], 'outExpo'),
  key(0.72, BI(), [0, -0.02, 0], 'inOut'),
], { grips: [{ t: 0, g: LOW }, { t: 0.18, g: BACK }, { t: 0.3, g: THROWN, e: 'outExpo' }, { t: 0.72, g: LOW }] });
/** E: The Thunderbolt — both arms raised to the sky, held, then the right sword brought down at the target */
const thunder = bpose('cc_thunder', 1.5, { call: 0.26, strike: 1.08 }, [
  key(0, BI()),
  key(0.26, BI({ spine: [-8, 0, 0], chest: [-12, 0, 0], head: [-28, 0, 0], 'upperarm.L': [-168, 0, 18], 'forearm.L': [-8, 0, 0], 'hand.L': [0, 0, 0] }), [0, 0.03, 0], 'outExpo'),
  key(1.0, BI({ spine: [-8, 0, 0], chest: [-12, 0, 0], head: [-24, 0, 0], 'upperarm.L': [-164, 0, 18], 'forearm.L': [-10, 0, 0] }), [0, 0.03, 0], 'linear'),
  key(1.1, BI({ chest: [6, -8, 0], head: [-2, 8, 0], 'upperarm.L': [-30, 0, 40], 'forearm.L': [-20, 0, 0] }), [0, -0.04, 0.04], 'outExpo'),
  key(1.5, BI(), [0, -0.02, 0], 'inOut'),
], { grips: [{ t: 0, g: LOW }, { t: 0.26, g: UP, e: 'outExpo' }, { t: 1.0, g: UP }, { t: 1.1, g: LANCE, e: 'outExpo' }, { t: 1.5, g: LOW }] });
/** R: the Thunderbolt stream — the right sword levelled like a lance, the lightning pouring off its point */
const stream = bpose('cc_stream', 1.35, { start: 0.16 }, [
  key(0, BI()),
  key(0.16, BI({ hips: [0, -12, 0], spine: [4, -4, 0], chest: [2, -12, 0], head: [-2, 10, 0], 'thigh.L': [-22, 0, 6], 'shin.L': [18, 0, 0], 'upperarm.L': [-20, 0, 40], 'forearm.L': [-30, 0, 0] }), [0, -0.04, 0.04], 'outExpo'),
  key(1.1, BI({ hips: [0, -12, 0], spine: [6, -4, 0], chest: [4, -12, 0], head: [-2, 10, 0], 'thigh.L': [-22, 0, 6], 'shin.L': [18, 0, 0], 'upperarm.L': [-20, 0, 40], 'forearm.L': [-30, 0, 0] }), [0, -0.05, 0.03], 'linear'),
  key(1.35, BI(), [0, -0.02, 0], 'inOut'),
], { grips: [{ t: 0, g: LOW }, { t: 0.16, g: LANCE, e: 'outExpo' }, { t: 1.1, g: LANCE }, { t: 1.35, g: LOW }] });
/** G: Sklaverei — the arms opened low, palms up round the swords, the chest open; held by the kit */
const sklav = bpose('cc_sklav', 2.4, { start: 0.2 }, [
  key(0, BI()),
  key(0.3, BI({ spine: [-6, 0, 0], chest: [-10, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-26, 0, 46], 'forearm.L': [-26, -50, 0] }), [0, 0.02, 0], 'out'),
  key(2.0, BI({ spine: [-8, 0, 0], chest: [-12, 0, 0], head: [-18, 0, 0], 'upperarm.L': [-30, 0, 50], 'forearm.L': [-26, -50, 0] }), [0, 0.03, 0], 'inOut'),
  key(2.4, BI(), [0, -0.02, 0], 'inOut'),
], { grips: [{ t: 0, g: LOW }, { t: 0.3, g: { p: [-0.5, -0.12, 0.2], dir: [-0.8, -0.3, 0.5], edge: [0, -1, 0], pole: [0, -1, -0.3] } }, { t: 2.0, g: { p: [-0.52, -0.1, 0.2], dir: [-0.8, -0.3, 0.5], edge: [0, -1, 0], pole: [0, -1, -0.3] } }, { t: 2.4, g: LOW }] });
/**
 * F: Electrocution — the left arm thrust to the sky as the pillar surges round her (lightning leaking from her eyes),
 * squeezed down round the arm, thrown at the target
 */
const electro = bpose('cc_electro', 2.3, { pillar: 0.2, squeeze: 1.2, throw: 1.7 }, [
  key(0, BI()),
  key(0.2, BI({ spine: [-6, 0, 0], chest: [-10, 0, 0], head: [-22, 0, 0], 'upperarm.L': [-172, 0, 10], 'forearm.L': [-4, 0, 0], 'hand.L': [0, 0, 0] }), [0, 0.03, 0], 'outExpo'),
  key(1.2, BI({ spine: [-8, 0, 0], chest: [-12, 0, 0], head: [-26, 0, 0], 'upperarm.L': [-170, 0, 12], 'forearm.L': [-6, 0, 0] }), [0, 0.03, 0], 'linear'),
  key(1.55, BI({ hips: [0, 26, 0], spine: [-4, 10, 0], chest: [-6, 20, 0], head: [-4, -14, 0], 'upperarm.L': [-110, 0, 70], 'forearm.L': [-80, 0, 0], 'hand.L': [0, 0, 20], 'thigh.R': [-16, 0, -6], 'shin.R': [14, 0, 0] }), [0, -0.02, -0.03], 'inOut'),
  key(1.72, BI({ hips: [2, -22, 0], spine: [8, -10, 0], chest: [6, -24, 0], head: [-4, 14, 0], 'upperarm.L': [-92, 0, 6], 'forearm.L': [-4, 0, 0], 'hand.L': [0, 0, 0], 'thigh.L': [-30, 0, 4], 'shin.L': [30, 0, 0] }), [0, -0.06, 0.08], 'outExpo'),
  key(2.0, BI({ hips: [2, -22, 0], spine: [8, -10, 0], chest: [6, -24, 0], head: [-4, 14, 0], 'upperarm.L': [-90, 0, 6], 'forearm.L': [-6, 0, 0], 'thigh.L': [-30, 0, 4], 'shin.L': [30, 0, 0] }), [0, -0.06, 0.07], 'linear'),
  key(2.3, BI(), [0, -0.02, 0], 'inOut'),
]);

const SHARED = ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name));
export const CANDICE_CLIPS: ClipDef[] = [palm1, palm2, kick, swat, engulf, point, sky, galvano, rage, release, ...SHARED];
export const BARBARRIEL_CLIPS: ClipDef[] = [sw1, sw2, sw3, sw4, six, javelin, thunder, stream, sklav, electro, release, ...SHARED];
