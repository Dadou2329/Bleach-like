// Gerard Valkyrie's animation set. A giant of a knight who wants to be hit: broad and planted, the shield carried
// before him on the bent left arm, Hoffnung low at his right. Heavy and simple — the overhead, the shield bash, the
// level cleave, the slam that throws a shockwave; Road-Breaker (both hands, driven down through the floor); the flying
// slash; the cape swept out into a wall; Heilig Bogen (the hands clasped, pulled apart, the string drawn to the ear);
// Blut Vene (braced, chin down); the Miracle's laugh with the arms thrown wide; the Zeichen drawn in his blood. As a
// giant (the same rig, scaled): the backhand, the stomp, Branch Breaker (the arm drawn back with a long laugh, the
// fist driven into the ground), the tower toss, the gale breath, the lariat, the grab and the throw. Aschtonig: the
// point levelled for the beam, the wide wake, the shield hurled like a discus. The golden knight: swipes, the volley,
// the roar. The topple (a giant tripped) and the rise; the leap and the landing.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys, type SwingDef } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });
interface Grip { p: E; dir: E; edge: E; pole: E }
const ik = (g: Grip, two = 0) => ({ '@gripR': g.p, '@dirR': g.dir, '@edgeR': g.edge, '@poleR': g.pole, '@ikR': [1, 0, 0] as E, '@twoHand': [two, 0, 0] as E });

/** the shield arm carried bent before him */
const SHIELD_ARM: Record<string, E> = { 'upperarm.L': [-24, 0, 18], 'forearm.L': [-62, 0, 0], 'hand.L': [0, 0, 0] };
const IDLE: Record<string, E> = {
  hips: [0, -6, 0], spine: [-2, 3, 0], chest: [-4, 3, 0], neck: [2, 0, 0], head: [-3, -3, 0],
  'thigh.L': [-4, 0, 7], 'shin.L': [5, 0, 0], 'thigh.R': [4, 0, -6], 'shin.R': [7, 0, 0], 'foot.R': [-3, 0, 3], 'foot.L': [0, 0, -3],
  ...SHIELD_ARM,
};
const I = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });

/** Hoffnung held low at his right, the point toward the ground ahead */
const LOW: Grip = { p: [-0.4, -0.46, 0.2], dir: [-0.12, -0.4, 0.91], edge: [0, -0.91, -0.4], pole: [-0.6, -0.3, -0.75] };
/** the point levelled at the target (the beam) */
const POINT: Grip = { p: [-0.12, 0.14, 0.66], dir: [0.03, 0.04, 1], edge: [0, -1, 0.04], pole: [-0.8, -0.5, 0] };
/** raised straight up */
const UP: Grip = { p: [-0.16, 0.8, 0.1], dir: [0, 1, 0.08], edge: [0, -0.08, 1], pole: [-0.9, -0.2, -0.3] };

export const GERARD_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.014,
  run: { spine: [10, 0, 0], chest: [3, 0, 0], head: [-8, 0, 0], ...SHIELD_ARM },
  sprint: { spine: [18, 0, 0], chest: [5, 0, 0], head: [-12, 0, 0], 'upperarm.L': [-40, 0, 20], 'forearm.L': [-70, 0, 0] },
  swingL: 0.04,
  swingR: 0.08,
  freqScale: 0.88,
  grip: {
    idle: LOW,
    walk: LOW,
    run: { p: [-0.38, -0.3, -0.1], dir: [-0.2, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.4, -0.18, -0.22], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.5, -0.1, 0.12], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

/** the golden knight: no sword, no shield — the arms hanging heavy, the head low */
export const KNIGHT_STANCE: StanceDef = {
  idle: { hips: [0, 0, 0], spine: [6, 0, 0], chest: [6, 0, 0], neck: [6, 0, 0], head: [-6, 0, 0], 'upperarm.L': [-6, 0, 16], 'upperarm.R': [-6, 0, -16], 'forearm.L': [-24, 0, 0], 'forearm.R': [-24, 0, 0], 'thigh.L': [-4, 0, 6], 'thigh.R': [4, 0, -6], 'shin.L': [6, 0, 0], 'shin.R': [6, 0, 0] },
  idleHips: -0.03,
  run: { spine: [16, 0, 0], chest: [6, 0, 0], head: [-12, 0, 0] },
  sprint: { spine: [22, 0, 0], chest: [8, 0, 0], head: [-16, 0, 0] },
  swingL: 0.3,
  swingR: 0.3,
  freqScale: 0.8,
};

function cut(name: string, o: {
  dur: number; step: number; hit: number; combo?: number; extra?: Record<string, number>;
  swing: Omit<SwingDef, 'keys'> & { keys: [number, number, KeyDef['ease']?][] };
  wind: Record<string, E>; strike: Record<string, E>; strikeHips?: E; windHips?: E;
}): ClipDef {
  const tFollow = o.swing.keys[o.swing.keys.length - 2]?.[0] ?? o.hit + 0.12;
  return {
    name, dur: o.dur, fadeIn: 0.06, fadeOut: 0.24, events: { step: o.step, hit: o.hit, ...(o.combo !== undefined ? { combo: o.combo } : {}), ...(o.extra ?? {}) },
    keys: mergeKeys(
      swingKeys(o.swing as SwingDef),
      [
        key(0, I()),
        key(o.swing.keys[1][0], I(o.wind), o.windHips ?? [0, -0.04, -0.03], 'out'),
        key(o.swing.keys[2][0], I(o.strike), o.strikeHips ?? [0, -0.06, 0.06], 'out'),
        key(tFollow, I(o.strike), o.strikeHips ?? [0, -0.06, 0.06], 'out'),
        key(o.dur, I(), [0, -0.018, 0], 'inOut'),
      ],
    ),
  };
}

/** a held pose for moves that do not swing: Hoffnung kept low unless the grips say otherwise */
const pose = (name: string, dur: number, events: Record<string, number>, keys: KeyDef[], grips: { t: number; g: Grip; e?: KeyDef['ease']; two?: number }[] = [{ t: 0, g: LOW }, { t: dur, g: LOW }], loop = false): ClipDef => ({
  name, dur, fadeIn: 0.08, fadeOut: 0.28, events, loop,
  keys: mergeKeys(grips.map((k) => ({ t: k.t, ease: k.e ?? 'inOut', c: ik(k.g, k.two ?? 0) })), keys),
});
/** a pose with the right hand empty (fists, the bow, the grab): the IK let go */
const bare = (name: string, dur: number, events: Record<string, number>, keys: KeyDef[], loop = false): ClipDef => ({
  name, dur, fadeIn: 0.08, fadeOut: 0.28, events, loop, keys,
});

// ------------------------------------------------------------------ the string

/** LMB 1: the overhead — up over the head and straight down */
const cut1 = cut('gv_cut1', {
  dur: 0.82, step: 0.1, hit: 0.3, combo: 0.42,
  swing: { a: [0, 1, 0], b: [0, 0, 1], c: [-0.14, 0.32, 0.05], r: 0.58, pole: [-0.8, -0.3, -0.4], keys: [[0, 60, 'out'], [0.18, -24, 'inOut'], [0.32, 128, 'out'], [0.46, 150, 'out'], [0.82, 100, 'inOut']] },
  wind: { hips: [-4, -6, 0], spine: [-6, 0, 0], chest: [-8, -4, 0], head: [-10, 2, 0], 'upperarm.L': [-40, 0, 24], 'forearm.L': [-52, 0, 0] },
  strike: { hips: [10, 4, 0], spine: [12, 2, 0], chest: [10, 2, 0], head: [-6, 0, 0], 'thigh.L': [-36, 0, 6], 'shin.L': [40, 0, 0], 'thigh.R': [18, 0, -5], 'shin.R': [16, 0, 0] },
  strikeHips: [0, -0.14, 0.16],
});
/** LMB 2: the shield bash — the left arm driven straight out, the body behind it */
const bash = pose('gv_bash', 0.66, { step: 0.06, hit: 0.2, combo: 0.32 }, [
  key(0, I()),
  key(0.1, I({ hips: [0, -16, 0], chest: [0, -14, 0], head: [-2, 12, 0], 'upperarm.L': [-30, 0, 40], 'forearm.L': [-100, 0, 0] }), [0, -0.03, -0.04], 'out'),
  key(0.2, I({ hips: [6, 18, 0], spine: [8, 10, 0], chest: [6, 16, 0], head: [-8, -14, 0], 'upperarm.L': [-84, -10, 10], 'forearm.L': [-12, 0, 0], 'thigh.L': [-34, 0, 6], 'shin.L': [36, 0, 0], 'thigh.R': [18, 0, -5] }), [0, -0.08, 0.2], 'outExpo'),
  key(0.36, I({ hips: [6, 18, 0], spine: [8, 10, 0], chest: [6, 16, 0], head: [-8, -14, 0], 'upperarm.L': [-80, -10, 10], 'forearm.L': [-16, 0, 0], 'thigh.L': [-34, 0, 6], 'shin.L': [36, 0, 0], 'thigh.R': [18, 0, -5] }), [0, -0.08, 0.2], 'linear'),
  key(0.66, I(), [0, -0.018, 0], 'inOut'),
]);
/** LMB 3: the level cleave, right to left */
const cut2 = cut('gv_cut2', {
  dur: 0.66, step: 0.05, hit: 0.2, combo: 0.32,
  swing: { a: [0, 0, 1], b: [1, 0, 0], c: [-0.12, 0.14, 0.08], r: 0.6, pole: [-0.5, -0.6, -0.6], keys: [[0, -60, 'out'], [0.1, -140, 'out'], [0.22, 50, 'out'], [0.34, 96, 'out'], [0.66, 50, 'inOut']] },
  wind: { hips: [0, -22, 0], chest: [0, -16, 0], head: [-2, 12, 0], 'upperarm.L': [-30, 0, 34], 'forearm.L': [-70, 0, 0] },
  strike: { hips: [0, 20, 0], spine: [2, 10, 0], chest: [2, 18, 0], head: [-2, -14, 0], 'thigh.L': [-20, 0, 6], 'shin.L': [20, 0, 0] },
});
/** LMB 4: the slam — up and down into the ground, the shockwave rolling out */
const slam = cut('gv_slam', {
  dur: 0.98, step: 0.16, hit: 0.38,
  swing: { a: [0, 1, 0], b: [0, 0, 1], c: [-0.12, 0.3, 0.05], r: 0.62, pole: [-0.8, -0.3, -0.4], keys: [[0, 60, 'out'], [0.24, -30, 'inOut'], [0.4, 158, 'out'], [0.6, 166, 'out'], [0.98, 110, 'inOut']], twoHand: [0, 1, 1, 1, 0] },
  wind: { hips: [-6, -4, 0], spine: [-8, 0, 0], chest: [-10, -2, 0], head: [-12, 2, 0], 'thigh.L': [-8, 0, 8], 'thigh.R': [8, 0, -8] },
  strike: { hips: [20, 0, 0], spine: [16, 0, 0], chest: [12, 0, 0], head: [-10, 0, 0], 'thigh.L': [-52, 0, 8], 'shin.L': [64, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [32, 0, 0] },
  strikeHips: [0, -0.26, 0.18],
});

// ------------------------------------------------------------------ the human moves

/** RMB: Road-Breaker — both hands, the long rise, driven down through the floor */
const road = cut('gv_road', {
  dur: 1.2, step: 0.4, hit: 0.56, extra: { raise: 0.12 },
  swing: { a: [0, 1, 0], b: [0, 0, 1], c: [-0.1, 0.34, 0.05], r: 0.64, pole: [-0.8, -0.3, -0.4], keys: [[0, 60, 'out'], [0.38, -40, 'inOut'], [0.58, 170, 'out'], [0.8, 178, 'out'], [1.2, 110, 'inOut']], twoHand: [0, 1, 1, 1, 0] },
  wind: { hips: [-8, -6, 0], spine: [-10, 0, 0], chest: [-12, -2, 0], head: [-14, 2, 0], 'thigh.L': [-12, 0, 8], 'thigh.R': [12, 0, -8] },
  strike: { hips: [24, 0, 0], spine: [18, 0, 0], chest: [14, 0, 0], head: [-12, 0, 0], 'thigh.L': [-58, 0, 8], 'shin.L': [72, 0, 0], 'thigh.R': [34, 0, -6], 'shin.R': [38, 0, 0] },
  strikeHips: [0, -0.34, 0.2],
});
/** Q: the flying slash — a long diagonal from high on his right */
const flying = cut('gv_flying', {
  dur: 0.78, step: 0.08, hit: 0.26, extra: { fire: 0.26 },
  swing: { a: [0, 0, 1], b: [-0.75, 0.66, 0], c: [-0.08, 0.2, 0.06], r: 0.62, pole: [-0.5, -0.6, -0.6], keys: [[0, -30, 'out'], [0.14, 160, 'inOut'], [0.28, -20, 'out'], [0.42, -70, 'out'], [0.78, -40, 'inOut']] },
  wind: { hips: [-4, -22, 0], spine: [-4, -10, 0], chest: [-6, -18, 0], head: [-4, 16, 0] },
  strike: { hips: [10, 10, 0], spine: [12, 4, 0], chest: [10, 8, 0], head: [-6, -8, 0], 'thigh.L': [-44, 0, 6], 'shin.L': [50, 0, 0], 'thigh.R': [24, 0, -5], 'shin.R': [20, 0, 0] },
  strikeHips: [0, -0.16, 0.2],
});
/** E: the cape swept out with the left arm, stretched across into a wall */
const cape = pose('gv_cape', 0.9, { wall: 0.32 }, [
  key(0, I()),
  key(0.14, I({ hips: [0, 18, 0], chest: [0, 16, 0], head: [-2, -12, 0], 'upperarm.L': [-60, 30, -30], 'forearm.L': [-90, 0, 0] }), [0, -0.02, 0], 'out'),
  key(0.32, I({ hips: [0, -16, 0], chest: [-4, -20, 0], head: [-4, 14, 0], 'upperarm.L': [-30, 0, 84], 'forearm.L': [-10, 0, 0], 'hand.L': [0, 0, 20] }), [0, -0.04, 0], 'outExpo'),
  key(0.6, I({ hips: [0, -16, 0], chest: [-4, -20, 0], head: [-4, 14, 0], 'upperarm.L': [-30, 0, 80], 'forearm.L': [-14, 0, 0], 'hand.L': [0, 0, 20] }), [0, -0.04, 0], 'linear'),
  key(0.9, I(), [0, -0.018, 0], 'inOut'),
]);
/** R: Heilig Bogen — the hands clasped before the chest, pulled apart into the bow, the string drawn to the ear, loosed */
const BOW_L: Record<string, E> = { 'upperarm.L': [-86, -6, 4], 'forearm.L': [-4, 0, 0], 'hand.L': [0, 0, 0] };
const DRAW_R: Record<string, E> = { 'upperarm.R': [-84, 30, 10], 'forearm.R': [-120, 0, 0], 'hand.R': [0, 0, 0] };
const AIM: Record<string, E> = { hips: [0, 50, 0], spine: [0, 10, 0], chest: [-2, 16, 0], neck: [0, -30, 0], head: [-2, -36, 0], 'thigh.L': [-14, 0, 14], 'thigh.R': [10, 0, -16], 'shin.R': [8, 0, 0] };
const bow = bare('gv_bow', 1.5, { clasp: 0.18, form: 0.42, loose: 1.0 }, [
  key(0, I({ 'upperarm.R': [-10, 0, -8], 'forearm.R': [-20, 0, 0] })),
  key(0.18, I({ chest: [4, 0, 0], head: [6, 0, 0], 'upperarm.L': [-60, 40, -20], 'forearm.L': [-80, 0, 0], 'upperarm.R': [-60, -40, 20], 'forearm.R': [-80, 0, 0] }), [0, -0.03, 0], 'out'),
  key(0.42, I({ ...AIM, ...BOW_L, 'upperarm.R': [-80, 20, 6], 'forearm.R': [-60, 0, 0] }), [0, -0.05, 0], 'outExpo'),
  key(0.8, I({ ...AIM, ...BOW_L, ...DRAW_R }), [0, -0.05, 0], 'inOut'),
  key(1.0, I({ ...AIM, ...BOW_L, ...DRAW_R }), [0, -0.05, 0], 'linear'),
  key(1.08, I({ ...AIM, ...BOW_L, 'upperarm.R': [-70, 50, 30], 'forearm.R': [-40, 0, 0] }), [0, -0.05, 0], 'outExpo'),
  key(1.5, I({ 'upperarm.R': [-10, 0, -8], 'forearm.R': [-20, 0, 0] }), [0, -0.018, 0], 'inOut'),
]);
/** G: Blut Vene — braced, chin tucked, the veins standing out */
const vene = pose('gv_vene', 0.7, { vene: 0.16 }, [
  key(0, I()),
  key(0.16, I({ hips: [4, 0, 0], spine: [6, 0, 0], chest: [8, 0, 0], neck: [10, 0, 0], head: [6, 0, 0], 'upperarm.L': [-40, -20, 30], 'forearm.L': [-90, 0, 0], 'thigh.L': [-14, 0, 10], 'shin.L': [20, 0, 0], 'thigh.R': [10, 0, -10], 'shin.R': [20, 0, 0] }), [0, -0.08, 0], 'outExpo'),
  key(0.45, I({ hips: [4, 0, 0], spine: [6, 0, 0], chest: [8, 0, 0], neck: [10, 0, 0], head: [6, 0, 0], 'upperarm.L': [-40, -20, 30], 'forearm.L': [-90, 0, 0], 'thigh.L': [-14, 0, 10], 'shin.L': [20, 0, 0], 'thigh.R': [10, 0, -10], 'shin.R': [20, 0, 0] }), [0, -0.08, 0], 'linear'),
  key(0.7, I(), [0, -0.018, 0], 'inOut'),
]);
/** V: Za Mirakuru — the arms thrown wide, the head back, laughing */
const WIDE: Record<string, E> = { hips: [0, 0, 0], spine: [-8, 0, 0], chest: [-12, 0, 0], neck: [-10, 0, 0], head: [-20, 0, 0], 'upperarm.L': [-30, 0, 86], 'forearm.L': [-20, 0, 0], 'thigh.L': [-6, 0, 12], 'thigh.R': [6, 0, -12] };
const miracle = pose('gv_miracle', 1.5, { laugh: 0.2, burst: 0.72 }, [
  key(0, I()),
  key(0.3, I({ ...WIDE, chest: [6, 0, 0], head: [10, 0, 0] }), [0, -0.06, 0], 'inOut'),
  key(0.72, I(WIDE), [0, 0.02, 0], 'outExpo'),
  key(0.86, I({ ...WIDE, head: [-26, 0, 0] }), [0, 0.03, 0], 'inOut'),
  key(1.02, I({ ...WIDE, head: [-16, 0, 0] }), [0, 0.02, 0], 'inOut'),
  key(1.18, I({ ...WIDE, head: [-26, 0, 0] }), [0, 0.03, 0], 'inOut'),
  key(1.5, I(), [0, -0.018, 0], 'inOut'),
], [{ t: 0, g: LOW }, { t: 0.72, g: { p: [-0.7, 0.3, 0.1], dir: [-0.7, 0.6, 0.3], edge: [0, -0.4, 1], pole: [-0.4, -0.8, -0.3] }, e: 'outExpo' }, { t: 1.18, g: { p: [-0.7, 0.3, 0.1], dir: [-0.7, 0.6, 0.3], edge: [0, -0.4, 1], pole: [-0.4, -0.8, -0.3] } }, { t: 1.5, g: LOW }]);
/** F: the Zeichen drawn in the air in his own blood with two fingers of the left hand, then the light */
const ZE = (a: number): E => [-34 - Math.cos(a) * 14, Math.sin(a) * 26, 30 + Math.sin(a) * 10];
const zeichen = pose('gv_zeichen', 1.8, { cut: 0.14, draw: 0.3, done: 1.0, burst: 1.24 }, [
  key(0, I()),
  key(0.14, I({ 'upperarm.L': [-50, 30, 0], 'forearm.L': [-110, 0, 0], head: [6, 0, 0] }), [0, -0.02, 0], 'out'),
  key(0.3, I({ head: [4, 0, 0], 'upperarm.L': ZE(0) as E, 'forearm.L': [-30, 0, 0] }), [0, -0.02, 0], 'inOut'),
  key(0.46, I({ head: [4, 0, 0], 'upperarm.L': ZE(1.3) as E, 'forearm.L': [-30, 0, 0] }), [0, -0.02, 0], 'linear'),
  key(0.62, I({ head: [4, 0, 0], 'upperarm.L': ZE(2.6) as E, 'forearm.L': [-30, 0, 0] }), [0, -0.02, 0], 'linear'),
  key(0.78, I({ head: [4, 0, 0], 'upperarm.L': ZE(3.9) as E, 'forearm.L': [-30, 0, 0] }), [0, -0.02, 0], 'linear'),
  key(1.0, I({ head: [4, 0, 0], 'upperarm.L': ZE(5.2) as E, 'forearm.L': [-30, 0, 0] }), [0, -0.02, 0], 'linear'),
  key(1.24, I({ ...WIDE }), [0, 0.03, 0], 'outExpo'),
  key(1.8, I(), [0, -0.018, 0], 'inOut'),
]);
/** Shift (far): the Valkyrie Leap — down into a crouch, up and over, the sword raised */
const leap = pose('gv_leap', 0.62, { jump: 0.16 }, [
  key(0, I()),
  key(0.14, I({ hips: [16, 0, 0], spine: [12, 0, 0], head: [-10, 0, 0], 'thigh.L': [-60, 0, 8], 'shin.L': [90, 0, 0], 'thigh.R': [-50, 0, -8], 'shin.R': [86, 0, 0] }), [0, -0.4, 0], 'out'),
  key(0.3, I({ hips: [-8, 0, 0], spine: [-6, 0, 0], head: [-8, 0, 0], 'thigh.L': [-70, 0, 8], 'shin.L': [80, 0, 0], 'thigh.R': [-20, 0, -8], 'shin.R': [60, 0, 0] }), [0, 0.06, 0], 'outExpo'),
  key(0.62, I({ hips: [-4, 0, 0], 'thigh.L': [-50, 0, 8], 'shin.L': [60, 0, 0], 'thigh.R': [-30, 0, -8], 'shin.R': [50, 0, 0] }), [0, 0.04, 0], 'inOut'),
], [{ t: 0, g: LOW }, { t: 0.3, g: UP, e: 'outExpo' }, { t: 0.62, g: UP }]);
/** the landing: a crater under him, down on one knee, the sword planted */
const land = pose('gv_land', 0.8, { land: 0.02 }, [
  key(0, I({ hips: [18, 0, 0], spine: [14, 0, 0], head: [-14, 0, 0], 'thigh.L': [-80, 0, 8], 'shin.L': [100, 0, 0], 'thigh.R': [10, 0, -8], 'shin.R': [110, 0, 0] }), [0, -0.5, 0]),
  key(0.4, I({ hips: [18, 0, 0], spine: [14, 0, 0], head: [-14, 0, 0], 'thigh.L': [-80, 0, 8], 'shin.L': [100, 0, 0], 'thigh.R': [10, 0, -8], 'shin.R': [110, 0, 0] }), [0, -0.5, 0], 'linear'),
  key(0.8, I(), [0, -0.018, 0], 'inOut'),
], [{ t: 0, g: { p: [-0.2, -0.3, 0.5], dir: [0, -1, 0.15], edge: [0, -0.15, -1], pole: [-0.8, 0, -0.5] } }, { t: 0.4, g: { p: [-0.2, -0.3, 0.5], dir: [0, -1, 0.15], edge: [0, -0.15, -1], pole: [-0.8, 0, -0.5] } }, { t: 0.8, g: LOW }]);
/** Shift (near): the shield charge — the shield before him, head down, driving */
const charge = pose('gv_charge', 0.55, { go: 0.04 }, [
  key(0, I()),
  key(0.08, I({ hips: [10, 20, 0], spine: [14, 8, 0], chest: [8, 12, 0], head: [-14, -16, 0], 'upperarm.L': [-70, -30, 10], 'forearm.L': [-80, 0, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [40, 0, 0], 'thigh.R': [30, 0, -5], 'shin.R': [20, 0, 0] }), [0, -0.1, 0.1], 'out'),
  key(0.42, I({ hips: [10, 20, 0], spine: [14, 8, 0], chest: [8, 12, 0], head: [-14, -16, 0], 'upperarm.L': [-70, -30, 10], 'forearm.L': [-80, 0, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [40, 0, 0], 'thigh.R': [30, 0, -5], 'shin.R': [20, 0, 0] }), [0, -0.1, 0.1], 'linear'),
  key(0.55, I(), [0, -0.018, 0], 'inOut'),
]);

// ------------------------------------------------------------------ the giant

/** LMB 1 (giant): the backhand — the shield arm swept across from his right to his left */
const backhand = pose('gv_backhand', 0.9, { step: 0.1, hit: 0.34, combo: 0.46 }, [
  key(0, I()),
  key(0.18, I({ hips: [0, -30, 0], chest: [0, -26, 0], head: [-2, 18, 0], 'upperarm.L': [-70, 50, -40], 'forearm.L': [-60, 0, 0] }), [0, -0.03, 0], 'out'),
  key(0.34, I({ hips: [0, 26, 0], chest: [-2, 24, 0], head: [-2, -16, 0], 'upperarm.L': [-60, -20, 70], 'forearm.L': [-10, 0, 0], 'thigh.L': [-20, 0, 8], 'shin.L': [20, 0, 0] }), [0, -0.05, 0.06], 'outExpo'),
  key(0.56, I({ hips: [0, 26, 0], chest: [-2, 24, 0], head: [-2, -16, 0], 'upperarm.L': [-50, -20, 74], 'forearm.L': [-14, 0, 0], 'thigh.L': [-20, 0, 8], 'shin.L': [20, 0, 0] }), [0, -0.05, 0.06], 'linear'),
  key(0.9, I(), [0, -0.018, 0], 'inOut'),
]);
/** LMB 3 (giant): the stomp — the right knee up high, the foot driven down */
const stomp = pose('gv_stomp', 1.0, { step: 0.1, hit: 0.5 }, [
  key(0, I()),
  key(0.36, I({ hips: [-6, 0, 0], spine: [-4, 0, 0], head: [6, 0, 0], 'thigh.R': [-96, 0, -10], 'shin.R': [90, 0, 0], 'foot.R': [-10, 0, 0], 'thigh.L': [4, 0, 10], 'shin.L': [10, 0, 0], 'upperarm.L': [-40, 0, 40] }), [0, 0.04, 0], 'inOut'),
  key(0.5, I({ hips: [8, 0, 0], spine: [8, 0, 0], head: [-6, 0, 0], 'thigh.R': [-30, 0, -10], 'shin.R': [20, 0, 0], 'thigh.L': [10, 0, 10], 'shin.L': [30, 0, 0] }), [0, -0.12, 0.08], 'in'),
  key(0.7, I({ hips: [8, 0, 0], spine: [8, 0, 0], head: [-6, 0, 0], 'thigh.R': [-30, 0, -10], 'shin.R': [20, 0, 0], 'thigh.L': [10, 0, 10], 'shin.L': [30, 0, 0] }), [0, -0.12, 0.08], 'linear'),
  key(1.0, I(), [0, -0.018, 0], 'inOut'),
]);
/** RMB (giant): Branch Breaker — the right arm drawn back with a long laugh, then the fist driven into the ground */
const breaker = bare('gv_breaker', 2.0, { laugh: 0.1, hit: 1.32 }, [
  key(0, I()),
  key(0.5, I({ hips: [-4, -30, 0], spine: [-6, -12, 0], chest: [-10, -22, 0], neck: [-10, 10, 0], head: [-24, 14, 0], 'upperarm.R': [10, 60, -60], 'forearm.R': [-110, 0, 0], 'upperarm.L': [-60, 0, 40], 'forearm.L': [-40, 0, 0], 'thigh.L': [-30, 0, 10], 'shin.L': [30, 0, 0] }), [0, -0.04, -0.04], 'inOut'),
  key(1.1, I({ hips: [-4, -34, 0], spine: [-6, -14, 0], chest: [-12, -24, 0], neck: [-12, 10, 0], head: [-28, 16, 0], 'upperarm.R': [16, 64, -64], 'forearm.R': [-116, 0, 0], 'upperarm.L': [-60, 0, 40], 'forearm.L': [-40, 0, 0], 'thigh.L': [-30, 0, 10], 'shin.L': [30, 0, 0] }), [0, -0.05, -0.05], 'linear'),
  key(1.32, I({ hips: [30, 20, 0], spine: [24, 8, 0], chest: [16, 12, 0], head: [-12, -10, 0], 'upperarm.R': [-60, 0, -10], 'forearm.R': [-6, 0, 0], 'thigh.L': [-70, 0, 10], 'shin.L': [90, 0, 0], 'thigh.R': [30, 0, -10], 'shin.R': [50, 0, 0] }), [0, -0.4, 0.2], 'in'),
  key(1.62, I({ hips: [30, 20, 0], spine: [24, 8, 0], chest: [16, 12, 0], head: [-12, -10, 0], 'upperarm.R': [-60, 0, -10], 'forearm.R': [-6, 0, 0], 'thigh.L': [-70, 0, 10], 'shin.L': [90, 0, 0], 'thigh.R': [30, 0, -10], 'shin.R': [50, 0, 0] }), [0, -0.4, 0.2], 'linear'),
  key(2.0, I(), [0, -0.018, 0], 'inOut'),
]);
/** Q (giant): the tower toss — bent down to tear it loose, heaved up overhead, hurled */
const toss = bare('gv_toss', 1.5, { tear: 0.36, lift: 0.7, throw: 1.02 }, [
  key(0, I()),
  key(0.36, I({ hips: [40, 0, 0], spine: [24, 0, 0], chest: [10, 0, 0], head: [-20, 0, 0], 'upperarm.R': [-80, 0, -20], 'forearm.R': [-20, 0, 0], 'upperarm.L': [-80, 0, 20], 'forearm.L': [-20, 0, 0], 'thigh.L': [-50, 0, 12], 'shin.L': [70, 0, 0], 'thigh.R': [-40, 0, -12], 'shin.R': [70, 0, 0] }), [0, -0.3, 0], 'inOut'),
  key(0.7, I({ hips: [-8, 0, 0], spine: [-10, 0, 0], chest: [-12, 0, 0], head: [-10, 0, 0], 'upperarm.R': [-170, 0, -20], 'forearm.R': [-20, 0, 0], 'upperarm.L': [-170, 0, 20], 'forearm.L': [-20, 0, 0] }), [0, 0.04, -0.06], 'out'),
  key(0.92, I({ hips: [-14, -20, 0], spine: [-14, -10, 0], chest: [-16, -10, 0], head: [-10, 6, 0], 'upperarm.R': [-190, 0, -10], 'forearm.R': [-40, 0, 0], 'upperarm.L': [-190, 0, 10], 'forearm.L': [-40, 0, 0], 'thigh.R': [10, 0, -8] }), [0, 0.02, -0.1], 'inOut'),
  key(1.02, I({ hips: [16, 20, 0], spine: [16, 10, 0], chest: [10, 10, 0], head: [-10, -6, 0], 'upperarm.R': [-90, 0, -10], 'forearm.R': [-10, 0, 0], 'upperarm.L': [-90, 0, 10], 'forearm.L': [-10, 0, 0], 'thigh.L': [-40, 0, 10], 'shin.L': [40, 0, 0] }), [0, -0.1, 0.16], 'outExpo'),
  key(1.5, I(), [0, -0.018, 0], 'inOut'),
]);
/** E (giant): the gale breath — the chest swelling, then the head driven forward as he blows */
const gale = pose('gv_gale', 2.0, { inhale: 0.05, breath: 0.62 }, [
  key(0, I()),
  key(0.55, I({ spine: [-10, 0, 0], chest: [-16, 0, 0], neck: [-10, 0, 0], head: [-18, 0, 0], 'upperarm.L': [-20, 0, 40], 'thigh.L': [-6, 0, 10], 'thigh.R': [6, 0, -10] }), [0, 0.04, -0.04], 'inOut'),
  key(0.7, I({ hips: [10, 0, 0], spine: [12, 0, 0], chest: [10, 0, 0], neck: [16, 0, 0], head: [6, 0, 0], 'thigh.L': [-30, 0, 10], 'shin.L': [30, 0, 0], 'thigh.R': [14, 0, -10] }), [0, -0.08, 0.1], 'outExpo'),
  key(1.7, I({ hips: [10, 0, 0], spine: [12, 0, 0], chest: [10, 0, 0], neck: [16, 0, 0], head: [6, 0, 0], 'thigh.L': [-30, 0, 10], 'shin.L': [30, 0, 0], 'thigh.R': [14, 0, -10] }), [0, -0.08, 0.1], 'linear'),
  key(2.0, I(), [0, -0.018, 0], 'inOut'),
]);
/** R (giant): the lariat — the right arm straight out to the side, the body driving forward */
const LARIAT: Record<string, E> = { hips: [12, -16, 0], spine: [14, -8, 0], chest: [6, -10, 0], head: [-12, 14, 0], 'upperarm.R': [-10, 0, -88], 'forearm.R': [-6, 0, 0], 'upperarm.L': [-40, 0, 30], 'forearm.L': [-80, 0, 0] };
const lariat = bare('gv_lariat', 1.1, { go: 0.12 }, [
  key(0, I()),
  key(0.12, I({ ...LARIAT, 'thigh.L': [-40, 0, 6], 'shin.L': [30, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [30, 0, 0] }), [0, -0.06, 0.06], 'outExpo'),
  key(0.4, I({ ...LARIAT, 'thigh.L': [30, 0, 6], 'shin.L': [30, 0, 0], 'thigh.R': [-40, 0, -6], 'shin.R': [30, 0, 0] }), [0, -0.04, 0.06], 'inOut'),
  key(0.68, I({ ...LARIAT, 'thigh.L': [-40, 0, 6], 'shin.L': [30, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [30, 0, 0] }), [0, -0.04, 0.06], 'inOut'),
  key(0.9, I(LARIAT), [0, -0.05, 0.06], 'inOut'),
  key(1.1, I(), [0, -0.018, 0], 'inOut'),
]);
/** G (giant): the grab — the right hand thrust out and closed */
const grab = bare('gv_grab', 0.7, { grab: 0.3 }, [
  key(0, I()),
  key(0.3, I({ hips: [20, 10, 0], spine: [18, 6, 0], chest: [8, 6, 0], head: [-14, -6, 0], 'upperarm.R': [-70, 0, -6], 'forearm.R': [-10, 0, 0], 'thigh.L': [-40, 0, 8], 'shin.L': [40, 0, 0] }), [0, -0.2, 0.1], 'outExpo'),
  key(0.7, I({ chest: [-4, 0, 0], head: [-6, 0, 0], 'upperarm.R': [-60, 30, -10], 'forearm.R': [-90, 0, 0] }), [0, -0.02, 0], 'inOut'),
]);
/** the squeeze: the fist held before the face, crushing (held while they struggle) */
const squeeze = bare('gv_squeeze', 0.8, {}, [
  key(0, I({ chest: [-4, 0, 0], head: [-6, 0, 0], 'upperarm.R': [-60, 30, -10], 'forearm.R': [-90, 0, 0] }), [0, -0.02, 0], 'inOut'),
  key(0.4, I({ chest: [-2, 0, 0], head: [-8, 0, 0], 'upperarm.R': [-64, 30, -14], 'forearm.R': [-96, 0, 0] }), [0, -0.02, 0], 'inOut'),
  key(0.8, I({ chest: [-4, 0, 0], head: [-6, 0, 0], 'upperarm.R': [-60, 30, -10], 'forearm.R': [-90, 0, 0] }), [0, -0.02, 0], 'inOut'),
], true);
/** the throw: overarm, letting go */
const fling = bare('gv_fling', 0.8, { throw: 0.26 }, [
  key(0, I({ chest: [-4, 0, 0], 'upperarm.R': [-60, 30, -10], 'forearm.R': [-90, 0, 0] })),
  key(0.16, I({ hips: [-6, -20, 0], chest: [-10, -16, 0], head: [-8, 10, 0], 'upperarm.R': [-170, 10, -20], 'forearm.R': [-60, 0, 0] }), [0, 0, -0.06], 'out'),
  key(0.26, I({ hips: [12, 20, 0], spine: [10, 10, 0], chest: [8, 14, 0], head: [-8, -10, 0], 'upperarm.R': [-70, 0, -10], 'forearm.R': [-10, 0, 0], 'thigh.L': [-40, 0, 8], 'shin.L': [40, 0, 0] }), [0, -0.08, 0.14], 'outExpo'),
  key(0.8, I(), [0, -0.018, 0], 'inOut'),
]);
/** the growth: down, then up and out, roaring, the arms wide */
const grow = pose('gv_grow', 1.7, { roar: 0.2, grow: 0.62 }, [
  key(0, I()),
  key(0.4, I({ hips: [14, 0, 0], spine: [14, 0, 0], chest: [10, 0, 0], head: [10, 0, 0], 'upperarm.L': [-20, 0, 10], 'forearm.L': [-110, 0, 0], 'thigh.L': [-40, 0, 10], 'shin.L': [60, 0, 0], 'thigh.R': [-30, 0, -10], 'shin.R': [60, 0, 0] }), [0, -0.2, 0], 'inOut'),
  key(0.7, I(WIDE), [0, 0.03, 0], 'outExpo'),
  key(1.3, I(WIDE), [0, 0.03, 0], 'linear'),
  key(1.7, I(), [0, -0.018, 0], 'inOut'),
], [{ t: 0, g: LOW }, { t: 0.7, g: { p: [-0.7, 0.3, 0.1], dir: [-0.7, 0.6, 0.3], edge: [0, -0.4, 1], pole: [-0.4, -0.8, -0.3] }, e: 'outExpo' }, { t: 1.3, g: { p: [-0.7, 0.3, 0.1], dir: [-0.7, 0.6, 0.3], edge: [0, -0.4, 1], pole: [-0.4, -0.8, -0.3] } }, { t: 1.7, g: LOW }]);
/** a giant tripped: he pitches forward onto his hands and knees, the ground shaking; then gets up */
const topple = bare('gv_topple', 2.6, { crash: 0.86, up: 2.0 }, [
  key(0, I()),
  key(0.3, I({ hips: [-10, 0, 0], spine: [-8, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-40, 0, 60], 'upperarm.R': [-40, 0, -60], 'thigh.R': [30, 0, -6] }), [0, 0.02, -0.06], 'out'),
  key(0.86, I({ hips: [70, 0, 0], spine: [12, 0, 0], chest: [6, 0, 0], head: [-30, 0, 0], 'upperarm.L': [-90, 0, 20], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-90, 0, -20], 'forearm.R': [-10, 0, 0], 'thigh.L': [-10, 0, 8], 'shin.L': [90, 0, 0], 'thigh.R': [-10, 0, -8], 'shin.R': [90, 0, 0] }), [0, -0.9, 0.5], 'in'),
  key(1.9, I({ hips: [70, 0, 0], spine: [12, 0, 0], chest: [6, 0, 0], head: [-30, 0, 0], 'upperarm.L': [-90, 0, 20], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-90, 0, -20], 'forearm.R': [-10, 0, 0], 'thigh.L': [-10, 0, 8], 'shin.L': [90, 0, 0], 'thigh.R': [-10, 0, -8], 'shin.R': [90, 0, 0] }), [0, -0.9, 0.5], 'linear'),
  key(2.6, I(), [0, -0.018, 0], 'inOut'),
]);

// ------------------------------------------------------------------ Aschtonig

/** Q: the Hoffnung beam — the point levelled at them, the left hand under the blade, the sphere swelling at the tip */
const beam = pose('gv_beam', 1.6, { charge: 0.12, fire: 0.8 }, [
  key(0, I()),
  key(0.3, I({ hips: [2, 14, 0], spine: [4, 8, 0], chest: [2, 10, 0], head: [-4, -10, 0], 'upperarm.L': [-80, -30, 10], 'forearm.L': [-40, 0, 0], 'thigh.L': [-26, 0, 8], 'shin.L': [26, 0, 0] }), [0, -0.05, 0.06], 'out'),
  key(1.3, I({ hips: [2, 14, 0], spine: [4, 8, 0], chest: [2, 10, 0], head: [-4, -10, 0], 'upperarm.L': [-80, -30, 10], 'forearm.L': [-40, 0, 0], 'thigh.L': [-26, 0, 8], 'shin.L': [26, 0, 0] }), [0, -0.05, 0.06], 'linear'),
  key(1.6, I(), [0, -0.018, 0], 'inOut'),
], [{ t: 0, g: LOW }, { t: 0.3, g: POINT, e: 'out' }, { t: 1.3, g: POINT, e: 'linear' }, { t: 1.6, g: LOW }]);
/** E: the slash wake — one wide sweep whose whole arc goes up a beat later */
const wake = cut('gv_wake', {
  dur: 0.86, step: 0.08, hit: 0.28, extra: { fire: 0.28 },
  swing: { a: [0, 0, 1], b: [1, 0.1, 0], c: [-0.1, 0.18, 0.06], r: 0.64, pole: [-0.5, -0.6, -0.6], keys: [[0, -60, 'out'], [0.14, -150, 'out'], [0.3, 70, 'out'], [0.44, 110, 'out'], [0.86, 50, 'inOut']] },
  wind: { hips: [0, -28, 0], chest: [0, -20, 0], head: [-2, 14, 0] },
  strike: { hips: [0, 24, 0], spine: [2, 12, 0], chest: [2, 22, 0], head: [-2, -16, 0], 'thigh.L': [-24, 0, 6], 'shin.L': [24, 0, 0] },
});
/** R: the shield hurled like a discus, the left arm wound across the body and flung out */
const sthrow = pose('gv_sthrow', 0.9, { throw: 0.34 }, [
  key(0, I()),
  key(0.22, I({ hips: [0, 40, 0], spine: [0, 16, 0], chest: [0, 30, 0], head: [-2, -24, 0], 'upperarm.L': [-60, 70, -50], 'forearm.L': [-50, 0, 0] }), [0, -0.04, -0.04], 'inOut'),
  key(0.34, I({ hips: [0, -30, 0], spine: [0, -12, 0], chest: [-4, -24, 0], head: [-4, 18, 0], 'upperarm.L': [-60, -30, 80], 'forearm.L': [-4, 0, 0], 'thigh.L': [-30, 0, 8], 'shin.L': [30, 0, 0] }), [0, -0.06, 0.08], 'outExpo'),
  key(0.6, I({ hips: [0, -30, 0], spine: [0, -12, 0], chest: [-4, -24, 0], head: [-4, 18, 0], 'upperarm.L': [-50, -30, 76], 'forearm.L': [-10, 0, 0] }), [0, -0.06, 0.08], 'linear'),
  key(0.9, I(), [0, -0.018, 0], 'inOut'),
]);

// ------------------------------------------------------------------ the golden knight

const KI: Record<string, E> = KNIGHT_STANCE.idle as Record<string, E>;
const K = (over: Record<string, E> = {}): Record<string, E> => ({ ...KI, ...over });
const knSwipe = (name: string, side: 'L' | 'R'): ClipDef => {
  const s = side === 'R' ? -1 : 1;
  const ua = `upperarm.${side}`, fa = `forearm.${side}`;
  return bare(name, 0.8, { step: 0.08, hit: 0.3, combo: 0.42 }, [
    key(0, K()),
    key(0.18, K({ hips: [0, -s * 26, 0], chest: [-6, -s * 22, 0], head: [-6, s * 16, 0], [ua]: [-120, 0, s * 30], [fa]: [-40, 0, 0] }), [0, -0.02, -0.04], 'out'),
    key(0.32, K({ hips: [10, s * 24, 0], spine: [14, s * 8, 0], chest: [10, s * 20, 0], head: [-10, -s * 14, 0], [ua]: [-30, 0, -s * 20], [fa]: [-10, 0, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [36, 0, 0] }), [0, -0.1, 0.12], 'outExpo'),
    key(0.5, K({ hips: [10, s * 24, 0], spine: [14, s * 8, 0], chest: [10, s * 20, 0], head: [-10, -s * 14, 0], [ua]: [-26, 0, -s * 20], [fa]: [-14, 0, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [36, 0, 0] }), [0, -0.1, 0.12], 'linear'),
    key(0.8, K(), [0, -0.03, 0], 'inOut'),
  ]);
};
const knBlast = bare('kn_blast', 1.1, { fire: 0.4 }, [
  key(0, K()),
  key(0.3, K({ spine: [-4, 0, 0], chest: [-8, 0, 0], head: [-8, 0, 0], 'upperarm.L': [-86, -20, 10], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-86, 20, -10], 'forearm.R': [-10, 0, 0] }), [0, 0, 0], 'out'),
  key(0.8, K({ spine: [-4, 0, 0], chest: [-8, 0, 0], head: [-8, 0, 0], 'upperarm.L': [-86, -20, 10], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-86, 20, -10], 'forearm.R': [-10, 0, 0] }), [0, 0, 0], 'linear'),
  key(1.1, K(), [0, -0.03, 0], 'inOut'),
]);
const knRoar = bare('kn_roar', 1.4, { roar: 0.32 }, [
  key(0, K()),
  key(0.24, K({ hips: [8, 0, 0], spine: [10, 0, 0], chest: [8, 0, 0], head: [10, 0, 0], 'upperarm.L': [-20, 0, 30], 'forearm.L': [-90, 0, 0], 'upperarm.R': [-20, 0, -30], 'forearm.R': [-90, 0, 0] }), [0, -0.06, 0], 'inOut'),
  key(0.36, K({ spine: [-14, 0, 0], chest: [-16, 0, 0], neck: [-14, 0, 0], head: [-26, 0, 0], 'upperarm.L': [-40, 0, 70], 'forearm.L': [-30, 0, 0], 'upperarm.R': [-40, 0, -70], 'forearm.R': [-30, 0, 0] }), [0, 0.03, 0], 'outExpo'),
  key(1.0, K({ spine: [-14, 0, 0], chest: [-16, 0, 0], neck: [-14, 0, 0], head: [-28, 0, 0], 'upperarm.L': [-40, 0, 70], 'forearm.L': [-30, 0, 0], 'upperarm.R': [-40, 0, -70], 'forearm.R': [-30, 0, 0] }), [0, 0.03, 0], 'linear'),
  key(1.4, K(), [0, -0.03, 0], 'inOut'),
]);
/** re-formed out of light: up from a crouch */
const knRise = bare('kn_rise', 2.2, { form: 0.2 }, [
  key(0, K({ hips: [40, 0, 0], spine: [30, 0, 0], head: [30, 0, 0], 'thigh.L': [-80, 0, 10], 'shin.L': [110, 0, 0], 'thigh.R': [-70, 0, -10], 'shin.R': [110, 0, 0] }), [0, -0.7, 0]),
  key(1.5, K({ hips: [20, 0, 0], spine: [10, 0, 0], head: [10, 0, 0], 'thigh.L': [-40, 0, 10], 'shin.L': [60, 0, 0], 'thigh.R': [-30, 0, -10], 'shin.R': [60, 0, 0] }), [0, -0.3, 0], 'inOut'),
  key(2.2, K(), [0, -0.03, 0], 'inOut'),
]);

const SHARED = ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name));
export const GERARD_CHAIN = ['gv_cut1', 'gv_bash', 'gv_cut2', 'gv_slam'];
export const GIANT_CHAIN = ['gv_backhand', 'gv_cut1', 'gv_stomp'];
export const KNIGHT_CHAIN = ['kn_swipe1', 'kn_swipe2'];
export const GERARD_CLIPS: ClipDef[] = [
  cut1, bash, cut2, slam, road, flying, cape, bow, vene, miracle, zeichen, leap, land, charge,
  backhand, stomp, breaker, toss, gale, lariat, grab, squeeze, fling, grow, topple, beam, wake, sthrow, ...SHARED,
];
export const KNIGHT_CLIPS: ClipDef[] = [knSwipe('kn_swipe1', 'R'), knSwipe('kn_swipe2', 'L'), knBlast, knRoar, knRise, { ...topple, name: 'kn_topple' }, ...SHARED];
