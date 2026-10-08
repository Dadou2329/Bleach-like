// Askin's animation set. Loose and lazy: the weight on one leg, the shoulders dropped, the head cocked, a smug half-lidded
// look down the nose. The blows are casual — a flicked left jab, a front kick, a finger-gun pop, a gut punch. The bow
// springs out of the bracers on the left forearm, held out straight, the right hand drawing to the chest three times.
// A Gift Ball lobbed underhand; the Gift Bad brushed out over the ground with a palm; the blood licked off the back of
// the hand; the café au lait sipped; Analyse (a hand to the chin, a snap); the fake death (the knees go, he lies flat,
// he gets up). Hasshein floats upright with the Reishi Staff: a sweep, a thrust, a spin, an overhead slam; the staff
// swept out to split its balls, a ring spun on a finger and hurled, the arms flung wide for the Deluxe, a sweeping hand
// for the Bereich, both arms over the head under the giant ball.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

const IDLE: Record<string, E> = {
  hips: [0, -6, 3], spine: [-4, 2, 0], chest: [-3, 6, -2], neck: [4, 0, 0], head: [6, -8, 8],
  'thigh.L': [-6, 0, 6], 'shin.L': [12, 0, 0], 'foot.L': [-4, 0, 0], 'thigh.R': [2, 0, -2], 'shin.R': [2, 0, 0],
  'upperarm.L': [4, 0, 8], 'forearm.L': [-26, 0, 0], 'hand.L': [0, 0, 6], 'upperarm.R': [2, 0, -7], 'forearm.R': [-12, 0, 0], 'hand.R': [0, 0, -4],
};
const I = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });

export const ASKIN_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.01,
  run: { spine: [6, 0, 0], head: [-2, 0, 0], 'upperarm.L': [-4, 0, 10], 'forearm.L': [-50, 0, 0], 'upperarm.R': [-4, 0, -10], 'forearm.R': [-50, 0, 0] },
  sprint: { spine: [16, 0, 0], chest: [4, 0, 0], head: [-10, 0, 0], 'upperarm.L': [36, 0, 12], 'forearm.L': [-30, 0, 0], 'upperarm.R': [36, 0, -12], 'forearm.R': [-30, 0, 0] },
  swingL: 0.9,
  swingR: 0.9,
  freqScale: 0.95,
};

/** Hasshein: floating upright, the legs loose and trailing, the staff held at his side in the right hand */
const FLY: Record<string, E> = {
  hips: [4, -6, 0], spine: [-4, 2, 0], chest: [-4, 6, 0], head: [6, -8, 6],
  'thigh.L': [6, 0, 4], 'shin.L': [26, 0, 0], 'foot.L': [24, 0, 0], 'thigh.R': [0, 0, -2], 'shin.R': [18, 0, 0], 'foot.R': [22, 0, 0],
  'upperarm.L': [-6, 0, 16], 'forearm.L': [-30, 0, 0], 'upperarm.R': [-14, 0, -12], 'forearm.R': [-44, 0, 0], 'hand.R': [0, 0, -10],
};
const F = (over: Record<string, E> = {}): Record<string, E> => ({ ...FLY, ...over });

export const HASSHEIN_STANCE: StanceDef = {
  idle: FLY,
  idleHips: 0,
  run: { spine: [10, 0, 0], head: [-6, 0, 0], 'upperarm.L': [10, 0, 24], 'forearm.L': [-30, 0, 0] },
  sprint: { spine: [24, 0, 0], head: [-14, 0, 0], 'upperarm.L': [40, 0, 20], 'forearm.L': [-10, 0, 0], 'upperarm.R': [30, 0, -20] },
  swingL: 0.5,
  swingR: 0.2,
  freqScale: 1.0,
};

const clip = (name: string, dur: number, events: Record<string, number>, keys: KeyDef[], o: { fadeIn?: number; fadeOut?: number; loop?: boolean } = {}): ClipDef => ({
  name, dur, fadeIn: o.fadeIn ?? 0.05, fadeOut: o.fadeOut ?? 0.22, events, keys, ...(o.loop ? { loop: true } : {}),
});

// ------------------------------------------------------------------ the string

/** LMB 1: a flicked left jab, hardly a guard */
const jab = clip('as_jab', 0.42, { step: 0.03, hit: 0.13, combo: 0.22 }, [
  key(0, I()),
  key(0.07, I({ hips: [0, 8, 0], chest: [0, 12, 0], 'upperarm.L': [-40, 0, 10], 'forearm.L': [-100, 0, 0] }), [0, -0.01, 0], 'out'),
  key(0.14, I({ hips: [2, -14, 0], spine: [4, -6, 0], chest: [2, -14, 0], 'thigh.L': [-18, 0, 4], 'shin.L': [18, 0, 0], 'upperarm.L': [-88, 0, 4], 'forearm.L': [-6, 0, 0] }), [0, -0.03, 0.05], 'outExpo'),
  key(0.26, I({ hips: [2, -10, 0], chest: [2, -10, 0], 'upperarm.L': [-70, 0, 8], 'forearm.L': [-30, 0, 0] }), [0, -0.02, 0.03], 'inOut'),
  key(0.42, I(), [0, -0.01, 0], 'inOut'),
]);
/** LMB 2: a lazy front kick off the right leg */
const kick = clip('as_kick', 0.52, { step: 0.04, hit: 0.18, combo: 0.3 }, [
  key(0, I()),
  key(0.1, I({ spine: [-8, 0, 0], 'thigh.R': [-60, 0, -2], 'shin.R': [90, 0, 0], 'thigh.L': [-4, 0, 4], 'shin.L': [8, 0, 0] }), [0, 0.01, -0.02], 'out'),
  key(0.18, I({ spine: [-14, 0, 0], chest: [-6, 0, 0], 'thigh.R': [-92, 0, -2], 'shin.R': [6, 0, 0], 'foot.R': [-20, 0, 0], 'upperarm.L': [-20, 0, 30], 'upperarm.R': [10, 0, -30] }), [0, 0.02, 0.04], 'outExpo'),
  key(0.32, I({ spine: [-10, 0, 0], 'thigh.R': [-70, 0, -2], 'shin.R': [60, 0, 0] }), [0, 0.01, 0.02], 'inOut'),
  key(0.52, I(), [0, -0.01, 0], 'inOut'),
]);
/** LMB 3: the finger-gun — the right arm straight out, the index pointed, a pop and a kick of the wrist */
const AIM: Record<string, E> = { hips: [0, 14, 0], chest: [0, 16, 0], head: [0, -14, 4], 'upperarm.R': [-90, 0, -4], 'forearm.R': [-2, 0, 0], 'hand.R': [0, 0, 0] };
const finger = clip('as_finger', 0.56, { point: 0.04, step: 0.06, hit: 0.2, combo: 0.32 }, [
  key(0, I()),
  key(0.14, I(AIM), [0, -0.01, 0], 'outExpo'),
  key(0.2, I({ ...AIM, 'upperarm.R': [-100, 0, -4], 'hand.R': [-20, 0, 0] }), [0, -0.01, -0.01], 'outExpo'),
  key(0.34, I(AIM), [0, -0.01, 0], 'inOut'),
  key(0.56, I(), [0, -0.01, 0], 'inOut'),
], { fadeOut: 0.18 });
/** LMB 4: the gut punch, rising from low on the right */
const gut = clip('as_gut', 0.64, { step: 0.08, hit: 0.22, combo: 0.38 }, [
  key(0, I()),
  key(0.12, I({ hips: [0, -18, 0], spine: [6, -8, 0], chest: [4, -18, 0], 'upperarm.R': [30, 0, -16], 'forearm.R': [-100, 0, 0], 'thigh.L': [-20, 0, 4], 'shin.L': [30, 0, 0], 'thigh.R': [6, 0, -4], 'shin.R': [24, 0, 0] }), [0, -0.08, -0.02], 'out'),
  key(0.22, I({ hips: [4, 20, 0], spine: [14, 8, 0], chest: [8, 20, 0], head: [6, -10, 0], 'upperarm.R': [-70, 0, -4], 'forearm.R': [-40, 0, 0], 'thigh.L': [-34, 0, 4], 'shin.L': [36, 0, 0], 'thigh.R': [16, 0, -4], 'shin.R': [12, 0, 0] }), [0, -0.1, 0.12], 'outExpo'),
  key(0.42, I({ hips: [4, 16, 0], spine: [12, 6, 0], chest: [6, 16, 0], 'upperarm.R': [-66, 0, -4], 'forearm.R': [-46, 0, 0], 'thigh.L': [-30, 0, 4], 'shin.L': [32, 0, 0] }), [0, -0.09, 0.1], 'inOut'),
  key(0.64, I(), [0, -0.01, 0], 'inOut'),
]);
export const ASKIN_CHAIN = ['as_jab', 'as_kick', 'as_finger', 'as_gut'];

// ------------------------------------------------------------------ the skills

/** RMB: the Heilig Bogen out of the bracers — the left arm held out at the target, three draws to the chest */
const DRAW: Record<string, E> = { hips: [0, -28, 0], spine: [-2, -8, 0], chest: [-4, -20, 0], head: [-2, 30, 0], 'upperarm.L': [-90, 0, 22], 'forearm.L': [0, 0, 0], 'hand.L': [0, 0, 0], 'upperarm.R': [-86, 0, 40], 'forearm.R': [-140, 0, 0] };
const LOOSE: Record<string, E> = { ...DRAW, chest: [-8, -24, 0], 'upperarm.R': [-60, 0, -10], 'forearm.R': [-70, 0, 0] };
const bow = clip('as_bow', 1.15, { pop: 0.14, a0: 0.42, a1: 0.58, a2: 0.74 }, [
  key(0, I()),
  key(0.14, I({ ...DRAW, 'upperarm.R': [-30, 0, -10], 'forearm.R': [-40, 0, 0] }), [0, -0.01, 0], 'outExpo'),
  key(0.34, I(DRAW), [0, -0.02, 0], 'inOut'),
  key(0.42, I(LOOSE), [0, -0.02, -0.02], 'outExpo'),
  key(0.5, I(DRAW), [0, -0.02, 0], 'inOut'),
  key(0.58, I(LOOSE), [0, -0.02, -0.02], 'outExpo'),
  key(0.66, I(DRAW), [0, -0.02, 0], 'inOut'),
  key(0.74, I(LOOSE), [0, -0.02, -0.02], 'outExpo'),
  key(1.15, I(), [0, -0.01, 0], 'inOut'),
], { fadeOut: 0.26 });
/** Q: a Gift Ball lobbed underhand off the right palm */
const toss = clip('as_toss', 0.7, { throw: 0.32 }, [
  key(0, I()),
  key(0.2, I({ chest: [0, -16, 0], 'upperarm.R': [30, 0, -20], 'forearm.R': [-40, 0, 0], 'hand.R': [30, 0, 0] }), [0, -0.01, -0.01], 'inOut'),
  key(0.34, I({ chest: [-4, 10, 0], 'upperarm.R': [-70, 0, -10], 'forearm.R': [-14, 0, 0], 'hand.R': [-20, 0, 0], 'thigh.L': [-14, 0, 4], 'shin.L': [14, 0, 0] }), [0, -0.01, 0.03], 'outExpo'),
  key(0.7, I(), [0, -0.01, 0], 'inOut'),
]);
/** E: the Gift Bad — a crouch and a palm brushed out over the ground */
const pool = clip('as_pool', 0.9, { pool: 0.42 }, [
  key(0, I()),
  key(0.3, I({ spine: [30, 0, 0], chest: [10, 0, 0], head: [-14, 0, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [80, 0, 0], 'thigh.R': [-30, 0, -6], 'shin.R': [70, 0, 0], 'upperarm.R': [-50, 0, -30], 'forearm.R': [-20, 0, 0], 'hand.R': [40, 0, 0] }), [0, -0.3, 0.02], 'inOut'),
  key(0.45, I({ spine: [32, 4, 0], chest: [12, 14, 0], head: [-14, -10, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [80, 0, 0], 'thigh.R': [-30, 0, -6], 'shin.R': [70, 0, 0], 'upperarm.R': [-40, 0, -70], 'forearm.R': [-10, 0, 0], 'hand.R': [40, 0, 0] }), [0, -0.3, 0.02], 'outExpo'),
  key(0.9, I(), [0, -0.01, 0], 'inOut'),
]);
/** R: the blood licked off the back of the right hand, slowly */
const LICK: Record<string, E> = { head: [-4, 10, 4], 'upperarm.R': [-40, 0, 34], 'forearm.R': [-130, 0, 0], 'hand.R': [0, 60, -30] };
const taste = clip('as_taste', 1.1, { lick: 0.5 }, [
  key(0, I()),
  key(0.35, I(LICK), [0, -0.01, 0], 'inOut'),
  key(0.6, I({ ...LICK, head: [-10, 16, 6] }), [0, -0.01, 0], 'inOut'),
  key(0.8, I(LICK), [0, -0.01, 0], 'inOut'),
  key(1.1, I(), [0, -0.01, 0], 'inOut'),
]);
/** R with nothing to taste: the thermos out of nowhere, a sip of café au lait */
const SIP: Record<string, E> = { head: [-14, 0, 0], 'upperarm.L': [-50, 0, -24], 'forearm.L': [-118, 0, 0], 'hand.L': [0, 0, 0] };
const sip = clip('as_sip', 1.3, { out: 0.12, sip: 0.6 }, [
  key(0, I()),
  key(0.3, I({ 'upperarm.L': [-30, 0, -10], 'forearm.L': [-90, 0, 0] }), [0, -0.01, 0], 'inOut'),
  key(0.55, I(SIP), [0, -0.01, 0], 'inOut'),
  key(0.95, I({ ...SIP, head: [-20, 0, 0], 'upperarm.L': [-56, 0, -24] }), [0, -0.01, 0], 'inOut'),
  key(1.3, I(), [0, -0.01, 0], 'inOut'),
]);
/** G: Analyse — a hand to the chin, considering; a snap of the fingers */
const analyse = clip('as_analyse', 0.95, { snap: 0.55 }, [
  key(0, I()),
  key(0.3, I({ head: [8, -10, 6], 'upperarm.R': [-30, 0, 30], 'forearm.R': [-130, 0, 0], 'hand.R': [0, 0, -20] }), [0, -0.01, 0], 'inOut'),
  key(0.5, I({ head: [8, -14, 8], 'upperarm.R': [-30, 0, 30], 'forearm.R': [-130, 0, 0], 'hand.R': [0, 0, -20] }), [0, -0.01, 0], 'inOut'),
  key(0.6, I({ head: [0, 0, 4], 'upperarm.R': [-60, 0, -30], 'forearm.R': [-80, 0, 0], 'hand.R': [0, 0, 20] }), [0, -0.01, 0], 'outExpo'),
  key(0.95, I(), [0, -0.01, 0], 'inOut'),
]);
/** Lethal Step: the knees go, he drops flat on his back as if cut down; then he gets up as if nothing happened */
const DOWN: Record<string, E> = { hips: [-84, 0, 0], spine: [-4, 0, 0], chest: [-2, 0, 0], head: [8, 30, 0], 'thigh.L': [-10, 0, 10], 'shin.L': [20, 0, 0], 'thigh.R': [-30, 0, -6], 'shin.R': [40, 0, 0], 'upperarm.L': [10, 0, 50], 'forearm.L': [-10, 0, 0], 'upperarm.R': [10, 0, -60], 'forearm.R': [-20, 0, 0] };
const crumple = clip('as_crumple', 1.35, { up: 0.95 }, [
  key(0, I()),
  key(0.18, I({ spine: [20, 0, 0], chest: [10, 0, 0], head: [20, 0, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [90, 0, 0], 'thigh.R': [-40, 0, -6], 'shin.R': [90, 0, 0] }), [0, -0.45, -0.1], 'in'),
  key(0.36, DOWN, [0, -0.8, -0.55], 'outBack'),
  key(0.95, DOWN, [0, -0.8, -0.55], 'linear'),
  key(1.15, I({ spine: [26, 0, 0], 'thigh.L': [-60, 0, 6], 'shin.L': [100, 0, 0], 'thigh.R': [-50, 0, -6], 'shin.R': [90, 0, 0] }), [0, -0.4, -0.1], 'out'),
  key(1.35, I(), [0, -0.01, 0], 'inOut'),
], { fadeIn: 0.03 });
/** F: Hasshein — hunched, then thrown open */
const release = clip('as_release', 1.1, { burst: 0.58 }, [
  key(0, I()),
  key(0.36, I({ spine: [20, 0, 0], chest: [12, 0, 0], head: [14, 0, 0], 'thigh.L': [-20, 0, 4], 'shin.L': [36, 0, 0], 'thigh.R': [-14, 0, -4], 'shin.R': [32, 0, 0], 'upperarm.L': [-50, 0, -20], 'forearm.L': [-110, 0, 0], 'upperarm.R': [-50, 0, 20], 'forearm.R': [-110, 0, 0] }), [0, -0.08, 0], 'inOut'),
  key(0.58, I({ spine: [-12, 0, 0], chest: [-14, 0, 0], head: [-22, 0, 0], 'upperarm.L': [-20, 0, 74], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-20, 0, -74], 'forearm.R': [-10, 0, 0] }), [0, 0.02, 0], 'outExpo'),
  key(0.85, I({ spine: [-10, 0, 0], chest: [-12, 0, 0], head: [-18, 0, 0], 'upperarm.L': [-20, 0, 66], 'upperarm.R': [-20, 0, -66] }), [0, 0.01, 0], 'inOut'),
  key(1.1, I(), [0, -0.01, 0], 'inOut'),
]);

// ------------------------------------------------------------------ Hasshein

/** the staff in both hands across the body */
const STAFF: Record<string, E> = { 'upperarm.R': [-40, 0, -14], 'forearm.R': [-70, 0, 0], 'upperarm.L': [-50, 0, 20], 'forearm.L': [-80, 0, 0] };
/** LMB 1: a sweep right to left */
const s1 = clip('hs_s1', 0.48, { step: 0.04, hit: 0.15, combo: 0.26 }, [
  key(0, F()),
  key(0.08, F({ ...STAFF, hips: [0, -30, 0], chest: [0, -30, 0], 'upperarm.R': [-50, 0, -60] }), [0, 0, -0.02], 'out'),
  key(0.16, F({ ...STAFF, hips: [2, 30, 0], spine: [6, 10, 0], chest: [4, 34, 0], 'upperarm.R': [-90, 0, 10], 'forearm.R': [-10, 0, 0] }), [0, 0, 0.06], 'outExpo'),
  key(0.3, F({ ...STAFF, hips: [2, 26, 0], chest: [4, 28, 0], 'upperarm.R': [-84, 0, 14], 'forearm.R': [-16, 0, 0] }), [0, 0, 0.05], 'inOut'),
  key(0.48, F(), [0, 0, 0], 'inOut'),
]);
/** LMB 2: a thrust, the staff run out through the hand */
const s2 = clip('hs_s2', 0.5, { step: 0.04, hit: 0.16, combo: 0.28 }, [
  key(0, F()),
  key(0.08, F({ hips: [0, -20, 0], chest: [0, -24, 0], 'upperarm.R': [10, 0, -20], 'forearm.R': [-110, 0, 0] }), [0, 0, -0.03], 'out'),
  key(0.17, F({ hips: [2, 16, 0], spine: [8, 6, 0], chest: [4, 20, 0], 'upperarm.R': [-92, 0, -2], 'forearm.R': [-2, 0, 0], 'hand.R': [-80, 0, 0] }), [0, 0, 0.1], 'outExpo'),
  key(0.32, F({ hips: [2, 14, 0], chest: [4, 16, 0], 'upperarm.R': [-88, 0, -4], 'forearm.R': [-8, 0, 0], 'hand.R': [-80, 0, 0] }), [0, 0, 0.08], 'inOut'),
  key(0.5, F(), [0, 0, 0], 'inOut'),
]);
/** LMB 3: a full spin with the staff out */
const s3 = clip('hs_s3', 0.72, { step: 0.04, hit: 0.2, hit2: 0.42, combo: 0.5 }, [
  key(0, F()),
  key(0.1, F({ 'upperarm.R': [-80, 0, -60], 'forearm.R': [-10, 0, 0] }), [0, 0, 0], 'out'),
  key(0.3, F({ hips: [0, 180, 0], 'upperarm.R': [-80, 0, -60], 'forearm.R': [-10, 0, 0] }), [0, 0, 0], 'linear'),
  key(0.5, F({ hips: [0, 360, 0], 'upperarm.R': [-80, 0, -60], 'forearm.R': [-10, 0, 0] }), [0, 0, 0], 'linear'),
  key(0.72, F({ hips: [0, 360, 0] }), [0, 0, 0], 'inOut'),
]);
/** LMB 4: overhead and down, the balls scattering off the end */
const s4 = clip('hs_s4', 0.84, { step: 0.1, hit: 0.32, combo: 0.5 }, [
  key(0, F()),
  key(0.2, F({ spine: [-14, 0, 0], chest: [-12, 0, 0], head: [-12, 0, 0], 'upperarm.R': [-176, 0, -6], 'forearm.R': [-20, 0, 0], 'upperarm.L': [-170, 0, 6], 'forearm.L': [-30, 0, 0] }), [0, 0.04, -0.02], 'inOut'),
  key(0.33, F({ hips: [20, 0, 0], spine: [30, 0, 0], chest: [16, 0, 0], head: [8, 0, 0], 'upperarm.R': [-60, 0, -8], 'forearm.R': [-8, 0, 0], 'upperarm.L': [-60, 0, 8], 'forearm.L': [-12, 0, 0] }), [0, -0.06, 0.1], 'outExpo'),
  key(0.6, F({ hips: [16, 0, 0], spine: [26, 0, 0], chest: [14, 0, 0], 'upperarm.R': [-56, 0, -8], 'forearm.R': [-10, 0, 0], 'upperarm.L': [-56, 0, 8], 'forearm.L': [-14, 0, 0] }), [0, -0.05, 0.08], 'inOut'),
  key(0.84, F(), [0, 0, 0], 'inOut'),
]);
export const HASSHEIN_CHAIN = ['hs_s1', 'hs_s2', 'hs_s3', 'hs_s4'];

/** RMB: the staff swept out wide — every ball splits */
const swarm = clip('hs_swarm', 0.95, { split: 0.42 }, [
  key(0, F()),
  key(0.28, F({ hips: [0, -40, 0], chest: [0, -30, 0], 'upperarm.R': [-60, 0, 40], 'forearm.R': [-60, 0, 0] }), [0, 0, 0], 'inOut'),
  key(0.44, F({ hips: [0, 30, 0], chest: [-4, 30, 0], head: [-6, -20, 0], 'upperarm.R': [-90, 0, -70], 'forearm.R': [-4, 0, 0], 'upperarm.L': [-30, 0, 50] }), [0, 0, 0.02], 'outExpo'),
  key(0.95, F(), [0, 0, 0], 'inOut'),
]);
/** Q: Gift Ring — a ring spun up on a finger, grown, and hurled sidearm */
const ring = clip('hs_ring', 0.95, { spin: 0.1, throw: 0.52 }, [
  key(0, F()),
  key(0.3, F({ head: [-4, 10, 0], 'upperarm.L': [-80, 0, 30], 'forearm.L': [-60, 0, 0], 'hand.L': [0, 0, 0] }), [0, 0, 0], 'inOut'),
  key(0.44, F({ hips: [0, 40, 0], chest: [0, 40, 0], 'upperarm.L': [-60, 0, 80], 'forearm.L': [-20, 0, 0] }), [0, 0, -0.02], 'inOut'),
  key(0.54, F({ hips: [0, -20, 0], chest: [4, -30, 0], 'upperarm.L': [-90, 0, -10], 'forearm.L': [-4, 0, 0] }), [0, 0, 0.04], 'outExpo'),
  key(0.95, F(), [0, 0, 0], 'inOut'),
]);
/** E: Gift Ball Deluxe — the arms flung wide, the head back */
const deluxe = clip('hs_deluxe', 1.3, { dome: 0.62 }, [
  key(0, F()),
  key(0.45, F({ spine: [16, 0, 0], chest: [10, 0, 0], head: [12, 0, 0], 'upperarm.L': [-40, 0, -10], 'forearm.L': [-100, 0, 0], 'upperarm.R': [-40, 0, 10], 'forearm.R': [-100, 0, 0] }), [0, -0.04, 0], 'inOut'),
  key(0.64, F({ spine: [-14, 0, 0], chest: [-16, 0, 0], head: [-26, 0, 0], 'upperarm.L': [-30, 0, 86], 'forearm.L': [-6, 0, 0], 'upperarm.R': [-30, 0, -86], 'forearm.R': [-6, 0, 0] }), [0, 0.03, 0], 'outExpo'),
  key(1.0, F({ spine: [-12, 0, 0], chest: [-14, 0, 0], head: [-22, 0, 0], 'upperarm.L': [-30, 0, 80], 'upperarm.R': [-30, 0, -80] }), [0, 0.02, 0], 'inOut'),
  key(1.3, F(), [0, 0, 0], 'inOut'),
]);
/** R: Gift Bereich — a hand swept round, scattering the nodes */
const bereich = clip('hs_bereich', 0.95, { nodes: 0.45 }, [
  key(0, F()),
  key(0.25, F({ hips: [0, 50, 0], chest: [0, 30, 0], 'upperarm.L': [-70, 0, -30], 'forearm.L': [-50, 0, 0] }), [0, 0, 0], 'inOut'),
  key(0.5, F({ hips: [0, -50, 0], chest: [0, -30, 0], head: [0, 20, 0], 'upperarm.L': [-80, 0, 80], 'forearm.L': [-6, 0, 0] }), [0, 0, 0], 'outExpo'),
  key(0.95, F(), [0, 0, 0], 'inOut'),
]);
/** F: the giant ball — both hands over the head as it swells, then pushed off */
const giant = clip('hs_giant', 1.45, { grow: 0.2, push: 0.95 }, [
  key(0, F()),
  key(0.4, F({ spine: [-10, 0, 0], chest: [-12, 0, 0], head: [-16, 0, 0], 'upperarm.L': [-170, 0, 20], 'forearm.L': [-30, 0, 0], 'upperarm.R': [-170, 0, -20], 'forearm.R': [-30, 0, 0] }), [0, 0.03, 0], 'inOut'),
  key(0.88, F({ spine: [-14, 0, 0], chest: [-14, 0, 0], head: [-18, 0, 0], 'upperarm.L': [-178, 0, 26], 'forearm.L': [-26, 0, 0], 'upperarm.R': [-178, 0, -26], 'forearm.R': [-26, 0, 0] }), [0, 0.04, -0.02], 'inOut'),
  key(1.0, F({ spine: [24, 0, 0], chest: [14, 0, 0], head: [6, 0, 0], 'upperarm.L': [-90, 0, 14], 'forearm.L': [-6, 0, 0], 'upperarm.R': [-90, 0, -14], 'forearm.R': [-6, 0, 0] }), [0, -0.02, 0.1], 'outExpo'),
  key(1.45, F(), [0, 0, 0], 'inOut'),
]);

const SHARED = ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name));
export const ASKIN_CLIPS: ClipDef[] = [jab, kick, finger, gut, bow, toss, pool, taste, sip, analyse, crumple, release, ...SHARED];
export const HASSHEIN_CLIPS: ClipDef[] = [s1, s2, s3, s4, swarm, ring, deluxe, bereich, giant, taste, sip, analyse, crumple, release, ...SHARED];
