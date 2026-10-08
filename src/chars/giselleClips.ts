// Giselle's animation set. Girlish and theatrical: the knees turned in, the hands up by the chin in the long sleeves,
// the head cocked. The string is weak and floppy on purpose: a sleeve slap, a backhand, a flailing kick and a shoulder
// bump. Bait (shrinking, hands clasped, pleading), then the grin as she straightens; the thumb bitten and the blood
// flung; Command (an arm thrown out, the chin up); Raise (a palm pressed into her shadow, then both hands lifted);
// Drink (leaning in, the hands cupped); the bone bow out of the heart case at her left hip, three shots; the release
// (arms crossed over the chest, then flung open). Azhalbiora: the tail string (spins that swing the tail round, a
// wing slash, a flip that brings the tail down overhead), Munchy Munchy Babies (both fists driven forward), Dancing
// Dead Boys Club (the wings shaken), Sklaverei and Dead March (arms raised like a conductor, then swept down). The
// skeletons of the Dancing Dead Boys Club have their own small set: a bouncing dance and a two-handed slap.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

const IDLE: Record<string, E> = {
  hips: [0, -6, 4], spine: [2, 2, -2], chest: [0, 6, -2], neck: [2, 0, 0], head: [4, -8, 12],
  'thigh.L': [-4, 0, -4], 'shin.L': [12, 0, 0], 'foot.L': [-4, 0, 0], 'thigh.R': [2, 0, 2], 'shin.R': [4, 0, 0],
  'upperarm.L': [4, 0, 9], 'forearm.L': [-16, 0, 0], 'hand.L': [0, 0, 8], 'upperarm.R': [-34, 0, 22], 'forearm.R': [-128, 0, 0], 'hand.R': [0, -10, -24],
};
const I = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });

export const GISELLE_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.01,
  run: { spine: [8, 0, 0], chest: [0, 0, 0], head: [-4, 0, 0], 'upperarm.L': [-6, 0, 34], 'forearm.L': [-40, 0, 0], 'upperarm.R': [-6, 0, -34], 'forearm.R': [-40, 0, 0] },
  sprint: { spine: [16, 0, 0], chest: [4, 0, 0], head: [-10, 0, 0], 'upperarm.L': [30, 0, 30], 'forearm.L': [-20, 0, 0], 'upperarm.R': [30, 0, -30], 'forearm.R': [-20, 0, 0] },
  swingL: 0.7,
  swingR: 0.7,
  freqScale: 1.1,
};

/** Azhalbiora: floating, the legs trailing and crossed at the ankles, the arms loose and open */
const FLY: Record<string, E> = {
  hips: [6, 0, 0], spine: [-2, 0, 0], chest: [-4, 0, 0], neck: [0, 0, 0], head: [0, -6, 10],
  'thigh.L': [10, 0, -6], 'shin.L': [40, 0, 0], 'foot.L': [30, 0, 0], 'thigh.R': [4, 0, 4], 'shin.R': [30, 0, 0], 'foot.R': [26, 0, 0],
  'upperarm.L': [-10, 0, 26], 'forearm.L': [-40, 0, 0], 'upperarm.R': [-10, 0, -26], 'forearm.R': [-40, 0, 0],
};
const F = (over: Record<string, E> = {}): Record<string, E> => ({ ...FLY, ...over });

export const AZHALBIORA_STANCE: StanceDef = {
  idle: FLY,
  idleHips: 0,
  run: { spine: [10, 0, 0], head: [-6, 0, 0], 'upperarm.L': [10, 0, 40], 'forearm.L': [-30, 0, 0], 'upperarm.R': [10, 0, -40], 'forearm.R': [-30, 0, 0] },
  sprint: { spine: [24, 0, 0], head: [-14, 0, 0], 'upperarm.L': [40, 0, 30], 'forearm.L': [-10, 0, 0], 'upperarm.R': [40, 0, -30], 'forearm.R': [-10, 0, 0] },
  swingL: 0.5,
  swingR: 0.5,
  freqScale: 1.0,
};

const clip = (name: string, dur: number, events: Record<string, number>, keys: KeyDef[], o: { fadeIn?: number; fadeOut?: number; loop?: boolean } = {}): ClipDef => ({
  name, dur, fadeIn: o.fadeIn ?? 0.05, fadeOut: o.fadeOut ?? 0.22, events, keys, ...(o.loop ? { loop: true } : {}),
});

// ------------------------------------------------------------------ the string

/** LMB 1: a slap of the right sleeve, swung flat across */
const slap = clip('gg_slap', 0.4, { step: 0.03, hit: 0.11, combo: 0.18 }, [
  key(0, I()),
  key(0.07, I({ hips: [0, -16, 0], chest: [0, -20, 0], head: [0, 10, 8], 'upperarm.R': [-40, 0, -70], 'forearm.R': [-30, 0, 0] }), [0, -0.02, -0.02], 'out'),
  key(0.13, I({ hips: [2, 18, 0], chest: [4, 24, 0], head: [0, -10, 6], 'thigh.R': [-20, 0, 2], 'shin.R': [20, 0, 0], 'upperarm.R': [-80, 0, 10], 'forearm.R': [-24, 0, 0], 'hand.R': [0, 0, -30] }), [0, -0.03, 0.05], 'outExpo'),
  key(0.24, I({ hips: [2, 20, 0], chest: [4, 26, 0], 'upperarm.R': [-74, 0, 18], 'forearm.R': [-30, 0, 0] }), [0, -0.03, 0.04], 'linear'),
  key(0.4, I(), [0, -0.012, 0], 'inOut'),
]);
/** LMB 2: a backhand of the left sleeve */
const back = clip('gg_back', 0.42, { step: 0.04, hit: 0.12, combo: 0.2 }, [
  key(0, I()),
  key(0.08, I({ hips: [0, 14, 0], chest: [0, 22, 0], head: [0, -8, 10], 'upperarm.L': [-60, 0, -20], 'forearm.L': [-100, 0, 0] }), [0, -0.02, -0.01], 'out'),
  key(0.14, I({ hips: [2, -16, 0], chest: [4, -24, 0], head: [0, 10, 8], 'thigh.L': [-20, 0, -2], 'shin.L': [20, 0, 0], 'upperarm.L': [-70, 0, 50], 'forearm.L': [-12, 0, 0], 'hand.L': [0, 0, 30] }), [0, -0.03, 0.05], 'outExpo'),
  key(0.26, I({ hips: [2, -18, 0], chest: [4, -26, 0], 'upperarm.L': [-64, 0, 56], 'forearm.L': [-16, 0, 0] }), [0, -0.03, 0.04], 'linear'),
  key(0.42, I(), [0, -0.012, 0], 'inOut'),
]);
/** LMB 3: a flailing front kick, the arms thrown up for balance */
const kick = clip('gg_kick', 0.5, { step: 0.05, hit: 0.15, combo: 0.26 }, [
  key(0, I()),
  key(0.08, I({ spine: [-6, 0, 0], 'thigh.R': [-30, 0, -2], 'shin.R': [80, 0, 0], 'upperarm.L': [-40, 0, 50], 'forearm.L': [-30, 0, 0], 'upperarm.R': [-40, 0, -50], 'forearm.R': [-30, 0, 0] }), [0, -0.02, 0], 'out'),
  key(0.16, I({ spine: [-14, 0, 0], chest: [-6, 0, 0], head: [8, 0, 10], 'thigh.R': [-100, 0, -6], 'shin.R': [10, 0, 0], 'foot.R': [-20, 0, 0], 'thigh.L': [6, 0, -4], 'shin.L': [10, 0, 0], 'upperarm.L': [-10, 0, 80], 'forearm.L': [-20, 0, 0], 'upperarm.R': [-10, 0, -80], 'forearm.R': [-20, 0, 0] }), [0, 0.03, 0.04], 'outExpo'),
  key(0.32, I({ spine: [-8, 0, 0], 'thigh.R': [-60, 0, -4], 'shin.R': [60, 0, 0], 'upperarm.L': [-20, 0, 60], 'upperarm.R': [-20, 0, -60] }), [0, 0.01, 0.03], 'inOut'),
  key(0.5, I(), [0, -0.012, 0], 'inOut'),
]);
/** LMB 4: a hop and a bump of the left shoulder */
const bump = clip('gg_bump', 0.58, { step: 0.08, hit: 0.22, combo: 0.34 }, [
  key(0, I()),
  key(0.12, I({ hips: [0, -30, 0], spine: [8, -10, 0], chest: [4, -20, 0], head: [0, 20, 6], 'thigh.L': [-30, 0, 0], 'shin.L': [50, 0, 0], 'thigh.R': [-20, 0, 0], 'shin.R': [50, 0, 0], 'upperarm.L': [10, 0, 10], 'forearm.L': [-90, 0, 0] }), [0, -0.08, -0.02], 'out'),
  key(0.22, I({ hips: [0, -70, 0], spine: [14, -16, 0], chest: [8, -24, 0], head: [-6, 40, 0], 'thigh.L': [-10, 0, -10], 'shin.L': [10, 0, 0], 'thigh.R': [10, 0, 0], 'shin.R': [20, 0, 0], 'upperarm.L': [20, 0, 16], 'forearm.L': [-100, 0, 0], 'upperarm.R': [-20, 0, -40], 'forearm.R': [-40, 0, 0] }), [0, 0.02, 0.14], 'outExpo'),
  key(0.4, I({ hips: [0, -50, 0], spine: [10, -10, 0], chest: [6, -18, 0], head: [0, 30, 0] }), [0, -0.01, 0.1], 'inOut'),
  key(0.58, I(), [0, -0.012, 0], 'inOut'),
]);
export const GISELLE_CHAIN = ['gg_slap', 'gg_back', 'gg_kick', 'gg_bump'];

// ------------------------------------------------------------------ the skills

/** RMB: Bait — shrinking, the hands clasped under the chin, the knees knocked together, pleading (held by the kit) */
const PLEAD: Record<string, E> = {
  hips: [-4, 0, 0], spine: [10, 0, 0], chest: [8, 0, 0], neck: [6, 0, 0], head: [8, 0, 16],
  'thigh.L': [-10, 0, -8], 'shin.L': [24, 0, 0], 'thigh.R': [-8, 0, 8], 'shin.R': [22, 0, 0],
  'upperarm.L': [-30, 0, -14], 'forearm.L': [-118, 0, 0], 'hand.L': [0, 0, 20], 'upperarm.R': [-30, 0, 14], 'forearm.R': [-118, 0, 0], 'hand.R': [0, 0, -20],
};
const bait = clip('gg_bait', 1.4, { open: 0.1 }, [
  key(0, I()),
  key(0.12, PLEAD, [0, -0.08, -0.04], 'outExpo'),
  key(0.7, { ...PLEAD, head: [8, 0, -12] }, [0, -0.08, -0.04], 'inOut'),
  key(1.3, PLEAD, [0, -0.08, -0.04], 'inOut'),
  key(1.4, PLEAD, [0, -0.08, -0.04], 'linear'),
], { fadeOut: 0.18 });
/** the reveal: she straightens up after the cut, arms flung wide, the head back, grinning */
const grin = clip('gg_grin', 0.7, { up: 0.2 }, [
  key(0, PLEAD, [0, -0.08, -0.04]),
  key(0.2, I({ spine: [-10, 0, 0], chest: [-12, 0, 0], neck: [-6, 0, 0], head: [-14, 0, -14], 'upperarm.L': [-30, 0, 70], 'forearm.L': [-20, 0, 0], 'upperarm.R': [-30, 0, -70], 'forearm.R': [-20, 0, 0] }), [0, 0.02, 0], 'outExpo'),
  key(0.5, I({ spine: [-8, 0, 0], chest: [-10, 0, 0], head: [-10, 0, -10], 'upperarm.L': [-26, 0, 64], 'upperarm.R': [-26, 0, -64] }), [0, 0.01, 0], 'inOut'),
  key(0.7, I(), [0, -0.012, 0], 'inOut'),
]);
/** Q: Finger Bite — the right thumb to the teeth, then the arm flung out, spraying */
const bite = clip('gg_bite', 0.72, { bite: 0.16, fling: 0.32 }, [
  key(0, I()),
  key(0.16, I({ head: [10, 10, 4], neck: [6, 0, 0], 'upperarm.R': [-40, 0, 26], 'forearm.R': [-140, 0, 0], 'hand.R': [0, -20, -30] }), [0, -0.01, 0], 'outExpo'),
  key(0.24, I({ head: [6, 6, 0], hips: [0, -20, 0], chest: [0, -24, 0], 'upperarm.R': [-50, 0, 30], 'forearm.R': [-130, 0, 0] }), [0, -0.02, -0.02], 'inOut'),
  key(0.32, I({ hips: [2, 20, 0], chest: [6, 28, 0], head: [0, -10, 4], 'thigh.L': [-22, 0, -2], 'shin.L': [22, 0, 0], 'upperarm.R': [-92, 0, -20], 'forearm.R': [-6, 0, 0], 'hand.R': [0, 0, -40] }), [0, -0.04, 0.06], 'outExpo'),
  key(0.5, I({ hips: [2, 18, 0], chest: [6, 24, 0], 'upperarm.R': [-86, 0, -24], 'forearm.R': [-10, 0, 0] }), [0, -0.04, 0.05], 'linear'),
  key(0.72, I(), [0, -0.012, 0], 'inOut'),
]);
/** E: Command — the right arm thrown out at them, the chin up, the left hand on the hip */
const command = clip('gg_command', 0.8, { order: 0.2 }, [
  key(0, I()),
  key(0.1, I({ chest: [0, -14, 0], 'upperarm.R': [-60, 0, 30], 'forearm.R': [-110, 0, 0] }), [0, 0, -0.02], 'out'),
  key(0.2, I({ hips: [0, 12, 0], spine: [-4, 6, 0], chest: [-8, 14, 0], neck: [-4, 0, 0], head: [-14, -10, 0], 'upperarm.R': [-96, 0, -4], 'forearm.R': [-2, 0, 0], 'hand.R': [0, 0, -10], 'upperarm.L': [10, 0, 36], 'forearm.L': [-90, 0, 0], 'hand.L': [0, 0, 40] }), [0, 0, 0.04], 'outExpo'),
  key(0.6, I({ hips: [0, 12, 0], spine: [-4, 6, 0], chest: [-8, 14, 0], head: [-12, -10, 0], 'upperarm.R': [-92, 0, -4], 'forearm.R': [-4, 0, 0], 'upperarm.L': [10, 0, 36], 'forearm.L': [-90, 0, 0] }), [0, 0, 0.04], 'linear'),
  key(0.8, I(), [0, -0.012, 0], 'inOut'),
]);
/** R: Raise — crouched, a palm pressed into her shadow, then both hands lifted, palms up */
const raise = clip('gg_raise', 1.1, { down: 0.3, rise: 0.6 }, [
  key(0, I()),
  key(0.3, I({ spine: [36, 0, 0], chest: [14, 0, 0], head: [-24, 0, 0], 'thigh.L': [-70, 0, 0], 'shin.L': [110, 0, 0], 'thigh.R': [-20, 0, 0], 'shin.R': [100, 0, 0], 'upperarm.R': [-50, 0, -10], 'forearm.R': [-10, 0, 0], 'hand.R': [0, 0, -70], 'upperarm.L': [-20, 0, 20], 'forearm.L': [-60, 0, 0] }), [0, -0.38, 0.04], 'outExpo'),
  key(0.6, I({ spine: [-6, 0, 0], chest: [-10, 0, 0], head: [-14, 0, 8], 'upperarm.L': [-110, 0, 30], 'forearm.L': [-20, -60, 0], 'upperarm.R': [-110, 0, -30], 'forearm.R': [-20, 60, 0] }), [0, 0.01, 0], 'outExpo'),
  key(0.9, I({ spine: [-6, 0, 0], chest: [-10, 0, 0], head: [-12, 0, 8], 'upperarm.L': [-116, 0, 34], 'forearm.L': [-20, -60, 0], 'upperarm.R': [-116, 0, -34], 'forearm.R': [-20, 60, 0] }), [0, 0.01, 0], 'linear'),
  key(1.1, I(), [0, -0.012, 0], 'inOut'),
]);
/** G: Drink — leaning in over the zombie, the hands cupped at her mouth (held by the kit) */
const drink = clip('gg_drink', 1.0, { sip: 0.3 }, [
  key(0, I()),
  key(0.25, I({ spine: [24, 0, 0], chest: [12, 0, 0], neck: [12, 0, 0], head: [16, 0, 0], 'thigh.L': [-20, 0, -4], 'shin.L': [30, 0, 0], 'upperarm.L': [-60, 0, -10], 'forearm.L': [-90, 0, 0], 'upperarm.R': [-60, 0, 10], 'forearm.R': [-90, 0, 0] }), [0, -0.08, 0.06], 'outExpo'),
  key(0.85, I({ spine: [26, 0, 0], chest: [14, 0, 0], neck: [14, 0, 0], head: [20, 0, 0], 'thigh.L': [-20, 0, -4], 'shin.L': [30, 0, 0], 'upperarm.L': [-64, 0, -10], 'forearm.L': [-94, 0, 0], 'upperarm.R': [-64, 0, 10], 'forearm.R': [-94, 0, 0] }), [0, -0.09, 0.07], 'linear'),
  key(1.0, I(), [0, -0.012, 0], 'inOut'),
]);
/** G: the bow — the right hand clicks the heart case at her left hip, the bow springs up into the left hand; three shots */
const DRAW: Record<string, E> = { hips: [0, -26, 0], spine: [-2, -8, 0], chest: [-4, -18, 0], head: [-2, 28, 6], 'upperarm.L': [-88, 0, 24], 'forearm.L': [-2, 0, 0], 'hand.L': [0, 0, 0], 'upperarm.R': [-84, 0, 40], 'forearm.R': [-140, 0, 0], 'thigh.L': [-4, 0, -4], 'shin.L': [8, 0, 0] };
const LOOSE: Record<string, E> = { ...DRAW, chest: [-8, -22, 0], 'upperarm.R': [-60, 0, -10], 'forearm.R': [-70, 0, 0] };
const bow = clip('gg_bow', 1.2, { pop: 0.12, catch: 0.28, a0: 0.56, a1: 0.72, a2: 0.88 }, [
  key(0, I()),
  key(0.12, I({ chest: [0, 20, 0], 'upperarm.R': [10, 0, 30], 'forearm.R': [-70, 0, 0], 'hand.R': [0, 0, 30] }), [0, -0.01, 0], 'out'),
  key(0.28, I({ head: [-16, 0, 6], 'upperarm.L': [-150, 0, 20], 'forearm.L': [-10, 0, 0] }), [0, 0.01, 0], 'outExpo'),
  key(0.46, I(DRAW), [0, -0.02, 0], 'inOut'),
  key(0.56, I(LOOSE), [0, -0.02, -0.02], 'outExpo'),
  key(0.64, I(DRAW), [0, -0.02, 0], 'inOut'),
  key(0.72, I(LOOSE), [0, -0.02, -0.02], 'outExpo'),
  key(0.8, I(DRAW), [0, -0.02, 0], 'inOut'),
  key(0.88, I(LOOSE), [0, -0.02, -0.02], 'outExpo'),
  key(1.2, I(), [0, -0.012, 0], 'inOut'),
], { fadeOut: 0.26 });
/** F: Azhalbiora — arms crossed over the chest, curled, then flung open, the head thrown back */
const release = clip('gg_release', 1.1, { burst: 0.6 }, [
  key(0, I()),
  key(0.38, I({ spine: [16, 0, 0], chest: [12, 0, 0], head: [14, 0, 0], 'thigh.L': [-20, 0, -6], 'shin.L': [36, 0, 0], 'thigh.R': [-16, 0, 6], 'shin.R': [32, 0, 0], 'upperarm.L': [-60, 0, -30], 'forearm.L': [-120, 0, 0], 'upperarm.R': [-60, 0, 30], 'forearm.R': [-120, 0, 0] }), [0, -0.08, 0], 'inOut'),
  key(0.6, I({ spine: [-12, 0, 0], chest: [-14, 0, 0], head: [-24, 0, 0], 'upperarm.L': [-30, 0, 76], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-30, 0, -76], 'forearm.R': [-10, 0, 0] }), [0, 0.02, 0], 'outExpo'),
  key(0.85, I({ spine: [-10, 0, 0], chest: [-12, 0, 0], head: [-18, 0, 0], 'upperarm.L': [-28, 0, 70], 'upperarm.R': [-28, 0, -70] }), [0, 0.01, 0], 'inOut'),
  key(1.1, I(), [0, -0.012, 0], 'inOut'),
]);

// ------------------------------------------------------------------ Azhalbiora

/** LMB 1: a spin to her left — the tail swings round low behind her */
const tail1 = clip('gz_tail1', 0.46, { step: 0.04, hit: 0.16, combo: 0.24 }, [
  key(0, F()),
  key(0.08, F({ spine: [10, 0, 0], 'upperarm.L': [-30, 0, 60], 'upperarm.R': [-30, 0, -60] }), [0, -0.02, 0], 'out'),
  key(0.18, F({ hips: [6, 150, 0], spine: [14, 10, 0], 'upperarm.L': [-20, 0, 80], 'upperarm.R': [-20, 0, -80] }), [0, 0, 0], 'outExpo'),
  key(0.3, F({ hips: [6, 175, 0], spine: [10, 10, 0], 'upperarm.L': [-20, 0, 70], 'upperarm.R': [-20, 0, -70] }), [0, 0, 0], 'inOut'),
  key(0.46, F(), [0, 0, 0], 'inOut'),
]);
/** LMB 2: a lunge with the left wing slashed down and across */
const wing = clip('gz_wing', 0.48, { step: 0.05, hit: 0.15, combo: 0.26 }, [
  key(0, F()),
  key(0.08, F({ chest: [0, 20, 0], 'wing.L': [0, -30, -30] }), [0, 0.02, -0.02], 'out'),
  key(0.16, F({ spine: [16, 0, 0], chest: [8, -24, 0], 'wing.L': [40, 50, 30], 'upperarm.L': [-60, 0, 50] }), [0, -0.02, 0.1], 'outExpo'),
  key(0.3, F({ spine: [12, 0, 0], chest: [6, -20, 0], 'wing.L': [30, 40, 24] }), [0, -0.02, 0.08], 'inOut'),
  key(0.48, F(), [0, 0, 0], 'inOut'),
]);
/** LMB 3: a spin to her right */
const tail2 = clip('gz_tail2', 0.46, { step: 0.04, hit: 0.16, combo: 0.24 }, [
  key(0, F()),
  key(0.08, F({ spine: [10, 0, 0], 'upperarm.L': [-30, 0, 60], 'upperarm.R': [-30, 0, -60] }), [0, -0.02, 0], 'out'),
  key(0.18, F({ hips: [6, -150, 0], spine: [14, -10, 0], 'upperarm.L': [-20, 0, 80], 'upperarm.R': [-20, 0, -80] }), [0, 0, 0], 'outExpo'),
  key(0.3, F({ hips: [6, -175, 0], spine: [10, -10, 0], 'upperarm.L': [-20, 0, 70], 'upperarm.R': [-20, 0, -70] }), [0, 0, 0], 'inOut'),
  key(0.46, F(), [0, 0, 0], 'inOut'),
]);
/** LMB 4: a forward flip — the tail whipped up over her head and down on them */
const whip = clip('gz_whip', 0.66, { step: 0.08, hit: 0.3, combo: 0.44 }, [
  key(0, F()),
  key(0.12, F({ spine: [-16, 0, 0], chest: [-12, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-150, 0, 30], 'upperarm.R': [-150, 0, -30] }), [0, 0.06, -0.02], 'out'),
  key(0.3, F({ spine: [40, 0, 0], chest: [20, 0, 0], head: [10, 0, 0], 'thigh.L': [-60, 0, 0], 'shin.L': [90, 0, 0], 'thigh.R': [-60, 0, 0], 'shin.R': [90, 0, 0], 'upperarm.L': [-40, 0, 50], 'upperarm.R': [-40, 0, -50] }), [0, 0.1, 0.1], 'outExpo'),
  key(0.46, F({ spine: [24, 0, 0], chest: [12, 0, 0] }), [0, 0.04, 0.06], 'inOut'),
  key(0.66, F(), [0, 0, 0], 'inOut'),
]);
export const AZHALBIORA_CHAIN = ['gz_tail1', 'gz_wing', 'gz_tail2', 'gz_whip'];

/** RMB: Munchy Munchy Babies — the skulls bloom over the fists, then both driven forward on the charge */
const munchy = clip('gz_munchy', 0.9, { bloom: 0.12, go: 0.3, bite: 0.46 }, [
  key(0, F()),
  key(0.2, F({ spine: [-6, 0, 0], chest: [-8, 0, 0], 'upperarm.L': [-40, 0, 20], 'forearm.L': [-120, 0, 0], 'upperarm.R': [-40, 0, -20], 'forearm.R': [-120, 0, 0] }), [0, 0.02, -0.04], 'out'),
  key(0.34, F({ spine: [26, 0, 0], chest: [12, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-96, 0, 8], 'forearm.L': [-6, 0, 0], 'upperarm.R': [-96, 0, -8], 'forearm.R': [-6, 0, 0], 'thigh.L': [30, 0, 0], 'thigh.R': [40, 0, 0] }), [0, -0.02, 0.12], 'outExpo'),
  key(0.7, F({ spine: [22, 0, 0], chest: [10, 0, 0], head: [-8, 0, 0], 'upperarm.L': [-90, 0, 10], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-90, 0, -10], 'forearm.R': [-10, 0, 0] }), [0, -0.02, 0.1], 'linear'),
  key(0.9, F(), [0, 0, 0], 'inOut'),
]);
/** Q: Dancing Dead Boys Club — the wings shaken hard (bones rattle out), a wiggle of the hips */
const dance = clip('gz_dance', 1.0, { shake: 0.1, spawn: 0.5 }, [
  key(0, F()),
  key(0.12, F({ hips: [0, 0, 10], chest: [0, 0, -8], 'wing.L': [0, 0, 24], 'wing.R': [0, 0, -24], 'upperarm.L': [-20, 0, 60], 'upperarm.R': [-20, 0, -60] }), [0, 0, 0], 'out'),
  key(0.24, F({ hips: [0, 0, -10], chest: [0, 0, 8], 'wing.L': [0, 0, -20], 'wing.R': [0, 0, 20], 'upperarm.L': [-20, 0, 50], 'upperarm.R': [-20, 0, -50] }), [0, 0, 0], 'inOut'),
  key(0.36, F({ hips: [0, 0, 10], chest: [0, 0, -8], 'wing.L': [0, 0, 24], 'wing.R': [0, 0, -24] }), [0, 0, 0], 'inOut'),
  key(0.5, F({ hips: [0, 0, -10], chest: [0, 0, 8], 'wing.L': [0, 0, -20], 'wing.R': [0, 0, 20] }), [0, 0, 0], 'inOut'),
  key(0.7, F({ spine: [-6, 0, 0], head: [-10, 0, -14], 'upperarm.L': [-150, 0, 20], 'forearm.L': [-20, 0, 0], 'upperarm.R': [-60, 0, -40], 'forearm.R': [-60, 0, 0] }), [0, 0, 0], 'outExpo'),
  key(1.0, F(), [0, 0, 0], 'inOut'),
]);
/** G: Sklaverei — arms open low, palms up (held by the kit) */
const sklav = clip('gz_sklav', 2.4, { start: 0.2 }, [
  key(0, F()),
  key(0.3, F({ spine: [-6, 0, 0], chest: [-10, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-26, 0, 46], 'forearm.L': [-26, -50, 0], 'upperarm.R': [-26, 0, -46], 'forearm.R': [-26, 50, 0] }), [0, 0.02, 0], 'out'),
  key(2.0, F({ spine: [-8, 0, 0], chest: [-12, 0, 0], head: [-18, 0, 0], 'upperarm.L': [-30, 0, 50], 'forearm.L': [-26, -50, 0], 'upperarm.R': [-30, 0, -50], 'forearm.R': [-26, 50, 0] }), [0, 0.03, 0], 'inOut'),
  key(2.4, F(), [0, 0, 0], 'inOut'),
]);
/** F in Azhalbiora: Dead March — both arms raised like a conductor's, held, then swept down */
const march = clip('gz_march', 1.5, { rise: 0.84 }, [
  key(0, F()),
  key(0.3, F({ spine: [-10, 0, 0], chest: [-12, 0, 0], head: [-20, 0, 0], 'upperarm.L': [-160, 0, 26], 'forearm.L': [-20, 0, 0], 'upperarm.R': [-160, 0, -26], 'forearm.R': [-20, 0, 0], 'wing.L': [0, 0, 20], 'wing.R': [0, 0, -20] }), [0, 0.04, 0], 'outExpo'),
  key(0.78, F({ spine: [-12, 0, 0], chest: [-14, 0, 0], head: [-22, 0, 0], 'upperarm.L': [-166, 0, 30], 'forearm.L': [-20, 0, 0], 'upperarm.R': [-166, 0, -30], 'forearm.R': [-20, 0, 0], 'wing.L': [0, 0, 24], 'wing.R': [0, 0, -24] }), [0, 0.04, 0], 'linear'),
  key(0.88, F({ spine: [24, 0, 0], chest: [12, 0, 0], head: [6, 0, 0], 'upperarm.L': [-30, 0, 40], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-30, 0, -40], 'forearm.R': [-10, 0, 0], 'wing.L': [0, 0, -16], 'wing.R': [0, 0, 16] }), [0, -0.04, 0.06], 'outExpo'),
  key(1.5, F(), [0, 0, 0], 'inOut'),
]);

const SHARED = ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name));
export const GISELLE_CLIPS: ClipDef[] = [slap, back, kick, bump, bait, grin, bite, command, raise, drink, bow, release, ...SHARED];
export const AZHALBIORA_CLIPS: ClipDef[] = [tail1, wing, tail2, whip, munchy, dance, sklav, march, bait, grin, bite, command, raise, drink, bow, ...SHARED];

// ------------------------------------------------------------------ the skeletons

/** knees bent, the arms up in "jazz hands", the big skull cocked */
const SK_IDLE: Record<string, E> = {
  hips: [0, 0, 0], spine: [4, 0, 0], chest: [0, 0, 0], head: [6, 0, 14],
  'thigh.L': [-20, 0, 10], 'shin.L': [36, 0, 0], 'thigh.R': [-20, 0, -10], 'shin.R': [36, 0, 0],
  'upperarm.L': [-30, 0, 70], 'forearm.L': [-80, 0, 0], 'upperarm.R': [-30, 0, -70], 'forearm.R': [-80, 0, 0],
};
export const SKELETON_STANCE: StanceDef = {
  idle: SK_IDLE,
  idleHips: -0.03,
  run: { spine: [10, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-40, 0, 60], 'forearm.L': [-70, 0, 0], 'upperarm.R': [-40, 0, -60], 'forearm.R': [-70, 0, 0] },
  sprint: { spine: [16, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-60, 0, 70], 'forearm.L': [-60, 0, 0], 'upperarm.R': [-60, 0, -70], 'forearm.R': [-60, 0, 0] },
  swingL: 1.2,
  swingR: 1.2,
  freqScale: 1.3,
};
const S = (over: Record<string, E> = {}): Record<string, E> => ({ ...SK_IDLE, ...over });
/** a bouncing dance: the hips swaying, the arms swapping up and down */
const skDance = clip('sk_dance', 0.6, {}, [
  key(0, S({ hips: [0, 0, 12], 'upperarm.L': [-160, 0, 20], 'upperarm.R': [-20, 0, -60] }), [0, -0.04, 0], 'inOut'),
  key(0.3, S({ hips: [0, 0, -12], 'upperarm.L': [-20, 0, 60], 'upperarm.R': [-160, 0, -20] }), [0, 0.02, 0], 'inOut'),
  key(0.6, S({ hips: [0, 0, 12], 'upperarm.L': [-160, 0, 20], 'upperarm.R': [-20, 0, -60] }), [0, -0.04, 0], 'inOut'),
], { loop: true, fadeIn: 0.1, fadeOut: 0.15 });
/** a two-handed slap brought down from overhead */
const skSlap = clip('sk_slap', 0.5, { hit: 0.18 }, [
  key(0, S()),
  key(0.1, S({ spine: [-10, 0, 0], 'upperarm.L': [-170, 0, 20], 'forearm.L': [-20, 0, 0], 'upperarm.R': [-170, 0, -20], 'forearm.R': [-20, 0, 0] }), [0, 0.02, 0], 'out'),
  key(0.18, S({ spine: [24, 0, 0], head: [10, 0, 0], 'upperarm.L': [-60, 0, 10], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-60, 0, -10], 'forearm.R': [-10, 0, 0] }), [0, -0.04, 0.06], 'outExpo'),
  key(0.5, S(), [0, -0.03, 0], 'inOut'),
]);
export const SKELETON_CLIPS: ClipDef[] = [skDance, skSlap, ...ICHIGO_CLIPS.filter((c) => ['dash', 'hit_heavy'].includes(c.name))];
