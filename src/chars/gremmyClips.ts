// Gremmy's animation set. He never lifts a finger: the hands stay lost in the sleeves, the arms hang. What moves is
// his head and his attention — a tilt toward the thing he is imagining, a glance up at the sky, a small nod when it
// lands. Calm, floaty, a child bored by the fight. Imagined Strength is the exception: hunched, then swollen and
// swinging huge arms (the bulk's own clips).
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

const IDLE: Record<string, E> = {
  hips: [0, 0, 0], spine: [-2, 0, 0], chest: [-2, 0, 0], neck: [2, 0, 0], head: [6, 6, 6],
  'thigh.L': [-2, 0, 2], 'shin.L': [4, 0, 0], 'thigh.R': [0, 0, -2], 'shin.R': [3, 0, 0],
  'upperarm.L': [4, 0, 6], 'forearm.L': [-10, 0, 0], 'upperarm.R': [4, 0, -6], 'forearm.R': [-10, 0, 0],
};
const I = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });

export const GREMMY_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.008,
  run: { spine: [6, 0, 0], head: [-4, 0, 0], 'upperarm.L': [-4, 0, 10], 'forearm.L': [-30, 0, 0], 'upperarm.R': [-4, 0, -10], 'forearm.R': [-30, 0, 0] },
  sprint: { spine: [12, 0, 0], head: [-8, 0, 0], 'upperarm.L': [24, 0, 16], 'forearm.L': [-20, 0, 0], 'upperarm.R': [24, 0, -16], 'forearm.R': [-20, 0, 0] },
  swingL: 0.6,
  swingR: 0.6,
  freqScale: 1.05,
};

/** Imagined Strength: hunched forward under the weight of his own arms */
const BULK: Record<string, E> = {
  hips: [6, 0, 0], spine: [14, 0, 0], chest: [10, 0, 0], neck: [-6, 0, 0], head: [-10, 0, 0],
  'thigh.L': [-14, 0, 8], 'shin.L': [20, 0, 0], 'thigh.R': [-10, 0, -8], 'shin.R': [18, 0, 0],
  'upperarm.L': [-10, 0, 26], 'forearm.L': [-30, 0, 0], 'upperarm.R': [-10, 0, -26], 'forearm.R': [-30, 0, 0],
};
const B = (over: Record<string, E> = {}): Record<string, E> => ({ ...BULK, ...over });

export const BULK_STANCE: StanceDef = {
  idle: BULK,
  idleHips: -0.03,
  run: { spine: [20, 0, 0], 'upperarm.L': [10, 0, 30], 'upperarm.R': [10, 0, -30] },
  sprint: { spine: [28, 0, 0], 'upperarm.L': [30, 0, 30], 'upperarm.R': [30, 0, -30] },
  swingL: 1.2,
  swingR: 1.2,
  freqScale: 0.8,
};

const clip = (name: string, dur: number, events: Record<string, number>, keys: KeyDef[], o: { fadeIn?: number; fadeOut?: number } = {}): ClipDef => ({
  name, dur, fadeIn: o.fadeIn ?? 0.08, fadeOut: o.fadeOut ?? 0.25, events, keys,
});

/** "not a single finger": a tilt of the head toward the thing, and it is there */
const will = (name: string, side: number, dur = 0.5, at = 0.14): ClipDef => clip(name, dur, { make: at, hit: at + 0.06, combo: at + 0.16 }, [
  key(0, I()),
  key(at, I({ chest: [0, side * 8, 0], head: [-2, side * 14, side * -10] }), [0, 0, 0], 'outExpo'),
  key(dur, I(), [0, 0, 0], 'inOut'),
]);
export const GREMMY_CHAIN = ['gm_w1', 'gm_w2', 'gm_w3', 'gm_w4'];

/** looking up at the thing above them, then the nod that brings it down */
const nod = clip('gm_nod', 0.95, { make: 0.15, slam: 0.58 }, [
  key(0, I()),
  key(0.4, I({ spine: [-6, 0, 0], neck: [-10, 0, 0], head: [-22, 0, 0] }), [0, 0.01, 0], 'inOut'),
  key(0.6, I({ spine: [4, 0, 0], neck: [10, 0, 0], head: [18, 0, 0] }), [0, -0.01, 0], 'outExpo'),
  key(0.95, I(), [0, 0, 0], 'inOut'),
]);
/** a small cock of the head, a smile: something changes in them */
const tilt = clip('gm_tilt', 0.8, { make: 0.32 }, [
  key(0, I()),
  key(0.32, I({ head: [8, 18, 22] }), [0, 0, 0], 'outExpo'),
  key(0.8, I(), [0, 0, 0], 'inOut'),
]);
/** the sleeves lifted a little from the sides: things appear round him */
const spread = clip('gm_spread', 0.9, { make: 0.3 }, [
  key(0, I()),
  key(0.3, I({ chest: [-4, 0, 0], head: [-4, 0, 0], 'upperarm.L': [-6, 0, 34], 'forearm.L': [-6, 0, 0], 'upperarm.R': [-6, 0, -34], 'forearm.R': [-6, 0, 0] }), [0, 0.01, 0], 'outExpo'),
  key(0.9, I(), [0, 0, 0], 'inOut'),
]);
/** a glance down at the ground under them */
const down = clip('gm_down', 0.8, { make: 0.3 }, [
  key(0, I()),
  key(0.3, I({ spine: [8, 0, 0], neck: [10, 0, 0], head: [20, 0, 0] }), [0, -0.01, 0], 'outExpo'),
  key(0.8, I(), [0, 0, 0], 'inOut'),
]);
/** both sleeves raised: the ground lifts (the fort), or the sky opens (the meteor, outer space) */
const raise = clip('gm_raise', 1.3, { make: 0.55 }, [
  key(0, I()),
  key(0.55, I({ spine: [-8, 0, 0], chest: [-8, 0, 0], head: [-18, 0, 0], 'upperarm.L': [-60, 0, 50], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-60, 0, -50], 'forearm.R': [-10, 0, 0] }), [0, 0.02, 0], 'outExpo'),
  key(1.0, I({ spine: [-8, 0, 0], chest: [-8, 0, 0], head: [-16, 0, 0], 'upperarm.L': [-56, 0, 48], 'upperarm.R': [-56, 0, -48] }), [0, 0.02, 0], 'inOut'),
  key(1.3, I(), [0, 0, 0], 'inOut'),
]);
/** a clone steps out of him: a sway to one side */
const split = clip('gm_split', 0.7, { make: 0.3 }, [
  key(0, I()),
  key(0.3, I({ hips: [0, 0, 10], spine: [0, 0, -6], head: [0, 0, -10] }), [0.08, 0, 0], 'outExpo'),
  key(0.7, I(), [0, 0, 0], 'inOut'),
]);
/** Steel Body: a stillness, the chin up */
const harden = clip('gm_harden', 0.5, { make: 0.2 }, [
  key(0, I()),
  key(0.2, I({ chest: [-6, 0, 0], head: [-8, 0, 0] }), [0, 0.01, 0], 'outExpo'),
  key(0.5, I(), [0, 0, 0], 'inOut'),
]);
/** Imagined Strength: curling in, then everything swelling outward */
const swell = clip('gm_swell', 1.1, { swell: 0.55 }, [
  key(0, I()),
  key(0.45, I({ spine: [22, 0, 0], chest: [14, 0, 0], head: [16, 0, 0], 'thigh.L': [-20, 0, 4], 'shin.L': [36, 0, 0], 'thigh.R': [-16, 0, -4], 'shin.R': [32, 0, 0], 'upperarm.L': [-40, 0, -20], 'forearm.L': [-100, 0, 0], 'upperarm.R': [-40, 0, 20], 'forearm.R': [-100, 0, 0] }), [0, -0.08, 0], 'inOut'),
  key(0.6, I({ spine: [-10, 0, 0], chest: [-14, 0, 0], head: [-20, 0, 0], 'upperarm.L': [-20, 0, 70], 'forearm.L': [-30, 0, 0], 'upperarm.R': [-20, 0, -70], 'forearm.R': [-30, 0, 0] }), [0, 0.02, 0], 'outExpo'),
  key(1.1, I(), [0, 0, 0], 'inOut'),
]);

/** the bulk's huge swings: a right hook, a left hook, a two-armed smash */
const bh = (name: string, side: 'L' | 'R', hit: number, dur: number): ClipDef => {
  const k = side === 'L' ? 1 : -1;
  return clip(name, dur, { step: 0.04, hit, combo: hit + 0.12 }, [
    key(0, B()),
    key(hit * 0.55, B({ hips: [6, k * 26, 0], chest: [10, k * 30, 0], [`upperarm.${side}`]: [-20, 0, k * 80], [`forearm.${side}`]: [-90, 0, 0] }), [0, -0.03, -0.02], 'out'),
    key(hit, B({ hips: [8, -k * 24, 0], spine: [18, -k * 8, 0], chest: [12, -k * 30, 0], [`upperarm.${side}`]: [-84, 0, -k * 6], [`forearm.${side}`]: [-40, 0, 0] }), [0, -0.06, 0.1], 'outExpo'),
    key(dur, B(), [0, -0.03, 0], 'inOut'),
  ]);
};
const b1 = bh('gm_b1', 'R', 0.18, 0.5);
const b2 = bh('gm_b2', 'L', 0.18, 0.5);
const b3 = clip('gm_b3', 0.8, { step: 0.1, hit: 0.32, combo: 0.5 }, [
  key(0, B()),
  key(0.2, B({ spine: [-10, 0, 0], chest: [-10, 0, 0], 'upperarm.L': [-170, 0, -10], 'forearm.L': [-30, 0, 0], 'upperarm.R': [-170, 0, 10], 'forearm.R': [-30, 0, 0] }), [0, 0.04, -0.02], 'inOut'),
  key(0.33, B({ spine: [40, 0, 0], chest: [20, 0, 0], 'upperarm.L': [-60, 0, -14], 'forearm.L': [-20, 0, 0], 'upperarm.R': [-60, 0, 14], 'forearm.R': [-20, 0, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [60, 0, 0] }), [0, -0.3, 0.12], 'outExpo'),
  key(0.8, B(), [0, -0.03, 0], 'inOut'),
]);
export const BULK_CHAIN = ['gm_b1', 'gm_b2', 'gm_b3'];

const SHARED = ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name));
const WILLS = [will('gm_w1', 1), will('gm_w2', -1), will('gm_w3', 1, 0.56, 0.18), will('gm_w4', -1, 0.62, 0.2)];
export const GREMMY_CLIPS: ClipDef[] = [...WILLS, nod, tilt, spread, down, raise, split, harden, swell, ...SHARED];
export const BULK_CLIPS: ClipDef[] = [b1, b2, b3, swell, ...WILLS, nod, tilt, spread, down, raise, split, harden, ...SHARED];
