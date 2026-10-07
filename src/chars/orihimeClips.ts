// Orihime's animation set. She stands soft and a little anxious, her hands held together before her chest.
// The light string is the karate Tatsuki taught her: a left jab, a right palm thrust, a front kick, and both
// palms driven out as a small Santen Kesshun bursts from them. Every technique starts at the hairpins: her
// fingers go to the flowers as the fairies fly out, then the hands send them — out front for Santen Kesshun,
// forward and down over the dome for Sōten Kisshun (held), flung at the enemy for Koten Zanshun, one palm over
// the other for Shiten Kōshun. Resolve is the hands clasped and the head lifted; Rokuten Shishun crosses the
// arms over the chest and throws them wide as the crimson rises; the Rejection is a rush with one palm out.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

const IDLE: Record<string, E> = {
  hips: [0, -6, 0], spine: [2, 2, 0], chest: [3, 2, 0], neck: [2, 0, 0], head: [6, 4, -5],
  'thigh.L': [-3, 0, 2], 'shin.L': [5, 0, 0], 'foot.L': [-2, 0, 0],
  'thigh.R': [2, 0, -3], 'shin.R': [8, 0, 0], 'foot.R': [-4, 0, 0],
  // the hands held together before her chest
  'upperarm.L': [-36, -32, -5], 'forearm.L': [-106, 0, 0], 'hand.L': [8, 0, 0],
  'upperarm.R': [-36, 32, 5], 'forearm.R': [-106, 0, 0], 'hand.R': [8, 0, 0],
};

export const ORIHIME_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.01,
  run: { chest: [6, 0, 0], head: [-4, 0, 0], 'upperarm.L': [-6, 0, 12], 'upperarm.R': [-6, 0, -12], 'forearm.L': [-64, 0, 0], 'forearm.R': [-64, 0, 0], 'hand.L': [0, 0, 0], 'hand.R': [0, 0, 0] },
  // running all out: leaning in, the arms trailing low
  sprint: { spine: [14, 0, 0], chest: [8, 0, 0], head: [-10, 0, 0], 'upperarm.L': [26, 0, 16], 'forearm.L': [-30, 0, 0], 'upperarm.R': [26, 0, -16], 'forearm.R': [-30, 0, 0], 'hand.L': [10, 0, 0], 'hand.R': [10, 0, 0] },
  swingL: 0.8,
  swingR: 0.8,
};

const R = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });

/** a front stance: the left foot forward, the right back */
const STANCE: Record<string, E> = { 'thigh.L': [-26, 0, 4], 'shin.L': [28, 0, 0], 'foot.L': [-4, 0, 0], 'thigh.R': [14, 0, -4], 'shin.R': [12, 0, 0], 'foot.R': [-10, 0, 0] };
/** the hands up at the hairpins, fingers to the flowers */
const PINS: Record<string, E> = { 'upperarm.L': [-84, -12, 58], 'forearm.L': [-125, 0, 0], 'hand.L': [-6, 0, 0], 'upperarm.R': [-84, 12, -58], 'forearm.R': [-125, 0, 0], 'hand.R': [-6, 0, 0], head: [-4, 0, 0] };

// ------------------------------------------------------------------ the string

/** 1: a left jab from the guard, the right fist pulled to the hip. */
const jab: ClipDef = {
  name: 'or_jab', dur: 0.4, fadeIn: 0.04, fadeOut: 0.14, events: { step: 0.03, hit: 0.1, combo: 0.17 },
  keys: [
    key(0, R()),
    key(0.05, R({ ...STANCE, hips: [0, 14, 0], spine: [4, -6, 0], 'upperarm.L': [-60, 0, -6], 'forearm.L': [-90, 0, 0], 'upperarm.R': [18, 0, -14], 'forearm.R': [-96, 0, 0], 'hand.R': [0, 0, 0] }), [0, -0.05, 0], 'out'),
    key(0.1, R({ ...STANCE, hips: [0, -18, 0], spine: [6, -10, 0], chest: [2, -8, 0], head: [2, 22, -2], 'upperarm.L': [-88, 0, -10], 'forearm.L': [-4, 0, 0], 'hand.L': [0, 0, 0], 'upperarm.R': [24, 0, -12], 'forearm.R': [-104, 0, 0], 'hand.R': [0, 0, 0] }), [0, -0.06, 0.06], 'outExpo'),
    key(0.2, R({ ...STANCE, hips: [0, -14, 0], spine: [5, -8, 0], head: [2, 18, -2], 'upperarm.L': [-84, 0, -8], 'forearm.L': [-14, 0, 0], 'upperarm.R': [20, 0, -12], 'forearm.R': [-100, 0, 0] }), [0, -0.06, 0.05], 'inOut'),
    key(0.4, R(), [0, -0.01, 0], 'inOut'),
  ],
};

/** 2: the right palm driven out from the shoulder, the left drawn back to the chest. */
const palm: ClipDef = {
  name: 'or_palm', dur: 0.46, fadeIn: 0.04, fadeOut: 0.16, events: { step: 0.04, hit: 0.13, combo: 0.2 },
  keys: [
    key(0, R()),
    key(0.07, R({ ...STANCE, hips: [0, -16, 0], spine: [2, -8, 0], 'upperarm.R': [-30, 0, -24], 'forearm.R': [-120, 0, 0], 'hand.R': [-40, 0, 0], 'upperarm.L': [-50, 0, 10], 'forearm.L': [-60, 0, 0] }), [0, -0.05, -0.02], 'out'),
    key(0.13, R({ ...STANCE, hips: [0, 22, 0], spine: [8, 12, 0], chest: [2, 8, 0], head: [2, -24, 4], 'upperarm.R': [-88, 0, 8], 'forearm.R': [-4, 0, 0], 'hand.R': [-70, 0, 0], 'upperarm.L': [-20, -30, -4], 'forearm.L': [-120, 0, 0] }), [0, -0.07, 0.08], 'outExpo'),
    key(0.24, R({ ...STANCE, hips: [0, 18, 0], spine: [6, 10, 0], head: [2, -20, 4], 'upperarm.R': [-84, 0, 8], 'forearm.R': [-12, 0, 0], 'hand.R': [-60, 0, 0], 'upperarm.L': [-20, -30, -4], 'forearm.L': [-116, 0, 0] }), [0, -0.07, 0.06], 'inOut'),
    key(0.46, R(), [0, -0.01, 0], 'inOut'),
  ],
};

/** 3: a front kick off the back leg, chambered and snapped out. */
const kick: ClipDef = {
  name: 'or_kick', dur: 0.54, fadeIn: 0.04, fadeOut: 0.18, events: { step: 0.05, hit: 0.17, combo: 0.25 },
  keys: [
    key(0, R()),
    key(0.09, R({ hips: [0, -6, 0], spine: [-4, 0, 0], 'thigh.R': [-80, 0, 0], 'shin.R': [100, 0, 0], 'foot.R': [-10, 0, 0], 'thigh.L': [-6, 0, 4], 'shin.L': [16, 0, 0], 'upperarm.L': [-34, 0, 24], 'forearm.L': [-70, 0, 0], 'upperarm.R': [-30, 0, -24], 'forearm.R': [-70, 0, 0] }), [0, -0.04, 0.02], 'out'),
    key(0.17, R({ hips: [0, -4, 0], spine: [-12, 0, 0], chest: [-4, 0, 0], head: [8, 0, 0], 'thigh.R': [-100, 0, 0], 'shin.R': [6, 0, 0], 'foot.R': [-30, 0, 0], 'thigh.L': [-4, 0, 4], 'shin.L': [12, 0, 0], 'upperarm.L': [-26, 0, 40], 'forearm.L': [-50, 0, 0], 'upperarm.R': [-14, 0, -40], 'forearm.R': [-50, 0, 0] }), [0, -0.02, 0.1], 'outExpo'),
    key(0.28, R({ 'thigh.R': [-72, 0, 0], 'shin.R': [92, 0, 0], spine: [-4, 0, 0] }), [0, -0.03, 0.06], 'out'),
    key(0.54, R(), [0, -0.01, 0], 'inOut'),
  ],
};

/** 4 (finisher): both palms driven out together — a small Santen Kesshun bursts from them and shoves. */
const bash: ClipDef = {
  name: 'or_bash', dur: 0.72, fadeIn: 0.05, fadeOut: 0.2, events: { step: 0.1, fx: 0.2, hit: 0.24 },
  keys: [
    key(0, R()),
    key(0.14, R({ ...STANCE, hips: [0, 0, 0], spine: [-4, 0, 0], 'upperarm.L': [-20, -20, 14], 'forearm.L': [-120, 0, 0], 'hand.L': [-50, 0, 0], 'upperarm.R': [-20, 20, -14], 'forearm.R': [-120, 0, 0], 'hand.R': [-50, 0, 0] }), [0, -0.08, -0.03], 'inOut'),
    key(0.24, R({ ...STANCE, hips: [0, 0, 0], spine: [10, 0, 0], chest: [4, 0, 0], head: [0, 0, 0], 'upperarm.L': [-86, 0, -4], 'forearm.L': [-4, 0, 0], 'hand.L': [-74, 0, 0], 'upperarm.R': [-86, 0, 4], 'forearm.R': [-4, 0, 0], 'hand.R': [-74, 0, 0] }), [0, -0.1, 0.16], 'outExpo'),
    key(0.46, R({ ...STANCE, hips: [0, 0, 0], spine: [8, 0, 0], 'upperarm.L': [-82, 0, -4], 'forearm.L': [-10, 0, 0], 'hand.L': [-66, 0, 0], 'upperarm.R': [-82, 0, 4], 'forearm.R': [-10, 0, 0], 'hand.R': [-66, 0, 0] }), [0, -0.09, 0.14], 'inOut'),
    key(0.72, R(), [0, -0.01, 0], 'inOut'),
  ],
};

// ------------------------------------------------------------------ Shun Shun Rikka

/** Q: Santen Kesshun — fingers to the pins, then both palms out: the triangle stands before her. */
const santen: ClipDef = {
  name: 'or_santen', dur: 0.62, fadeIn: 0.05, fadeOut: 0.2, events: { fx: 0.18 },
  keys: [
    key(0, R()),
    key(0.1, R(PINS), [0, -0.01, 0], 'out'),
    key(0.2, R({ spine: [4, 0, 0], head: [2, 0, 0], 'upperarm.L': [-84, 0, 2], 'forearm.L': [-10, 0, 0], 'hand.L': [-64, 0, 0], 'upperarm.R': [-84, 0, -2], 'forearm.R': [-10, 0, 0], 'hand.R': [-64, 0, 0], 'thigh.L': [-14, 0, 6], 'shin.L': [16, 0, 0], 'thigh.R': [8, 0, -6], 'shin.R': [12, 0, 0] }), [0, -0.04, 0.02], 'outExpo'),
    key(0.42, R({ spine: [4, 0, 0], 'upperarm.L': [-80, 0, 2], 'forearm.L': [-16, 0, 0], 'hand.L': [-56, 0, 0], 'upperarm.R': [-80, 0, -2], 'forearm.R': [-16, 0, 0], 'hand.R': [-56, 0, 0], 'thigh.L': [-14, 0, 6], 'shin.L': [16, 0, 0], 'thigh.R': [8, 0, -6], 'shin.R': [12, 0, 0] }), [0, -0.04, 0.02], 'inOut'),
    key(0.62, R(), [0, -0.01, 0], 'inOut'),
  ],
};

/** E: Sōten Kisshun — fingers to the pins, then the hands held out and down over the dome (held to the end). */
const soten: ClipDef = {
  name: 'or_soten', dur: 3.4, fadeIn: 0.06, fadeOut: 0.25, events: { fx: 0.22 },
  keys: [
    key(0, R()),
    key(0.12, R(PINS), [0, -0.01, 0], 'out'),
    key(0.3, R({ spine: [10, 0, 0], chest: [4, 0, 0], head: [10, 0, 0], 'upperarm.L': [-56, -10, 6], 'forearm.L': [-22, 0, 0], 'hand.L': [-30, 0, 0], 'upperarm.R': [-56, 10, -6], 'forearm.R': [-22, 0, 0], 'hand.R': [-30, 0, 0], 'thigh.L': [-10, 0, 6], 'shin.L': [20, 0, 0], 'thigh.R': [-6, 0, -6], 'shin.R': [20, 0, 0] }), [0, -0.05, 0], 'outExpo'),
    key(1.8, R({ spine: [12, 0, 0], chest: [4, 0, 0], head: [12, 0, 0], 'upperarm.L': [-60, -10, 6], 'forearm.L': [-18, 0, 0], 'hand.L': [-34, 0, 0], 'upperarm.R': [-60, 10, -6], 'forearm.R': [-18, 0, 0], 'hand.R': [-34, 0, 0], 'thigh.L': [-10, 0, 6], 'shin.L': [20, 0, 0], 'thigh.R': [-6, 0, -6], 'shin.R': [20, 0, 0] }), [0, -0.05, 0], 'inOut'),
    key(3.1, R({ spine: [10, 0, 0], chest: [4, 0, 0], head: [10, 0, 0], 'upperarm.L': [-56, -10, 6], 'forearm.L': [-22, 0, 0], 'hand.L': [-30, 0, 0], 'upperarm.R': [-56, 10, -6], 'forearm.R': [-22, 0, 0], 'hand.R': [-30, 0, 0], 'thigh.L': [-10, 0, 6], 'shin.L': [20, 0, 0], 'thigh.R': [-6, 0, -6], 'shin.R': [20, 0, 0] }), [0, -0.05, 0], 'inOut'),
    key(3.4, R(), [0, -0.01, 0], 'inOut'),
  ],
};

/** RMB: Koten Zanshun — the right hand to its pin, then flung at the enemy: Tsubaki goes. */
const koten: ClipDef = {
  name: 'or_koten', dur: 0.62, fadeIn: 0.04, fadeOut: 0.2, events: { fx: 0.2 },
  keys: [
    key(0, R()),
    key(0.1, R({ hips: [0, 18, 0], spine: [-2, 8, 0], head: [-4, -10, 0], 'upperarm.R': [-84, 12, -58], 'forearm.R': [-125, 0, 0], 'hand.R': [-6, 0, 0], 'upperarm.L': [-36, -32, -5], 'forearm.L': [-106, 0, 0] }), [0, -0.02, -0.02], 'out'),
    key(0.2, R({ ...STANCE, hips: [0, -20, 0], spine: [8, -12, 0], chest: [2, -8, 0], head: [0, 22, 0], 'upperarm.R': [-92, 0, 4], 'forearm.R': [-2, 0, 0], 'hand.R': [-16, 0, 0], 'upperarm.L': [-10, 0, 20], 'forearm.L': [-40, 0, 0] }), [0, -0.06, 0.08], 'outExpo'),
    key(0.4, R({ ...STANCE, hips: [0, -16, 0], spine: [6, -10, 0], head: [0, 18, 0], 'upperarm.R': [-88, 0, 4], 'forearm.R': [-8, 0, 0], 'hand.R': [-12, 0, 0], 'upperarm.L': [-10, 0, 20], 'forearm.L': [-40, 0, 0] }), [0, -0.06, 0.06], 'inOut'),
    key(0.62, R(), [0, -0.01, 0], 'inOut'),
  ],
};

/** R: Shiten Kōshun — the left hand to its pin, then one palm laid over the other, out front. */
const shiten: ClipDef = {
  name: 'or_shiten', dur: 0.7, fadeIn: 0.05, fadeOut: 0.2, events: { fx: 0.22 },
  keys: [
    key(0, R()),
    key(0.12, R({ 'upperarm.L': [-84, -12, 58], 'forearm.L': [-125, 0, 0], 'hand.L': [-6, 0, 0], head: [-4, 10, 0] }), [0, -0.01, 0], 'out'),
    key(0.22, R({ spine: [6, 0, 0], 'upperarm.L': [-80, -26, -8], 'forearm.L': [-30, 0, 0], 'hand.L': [-60, 0, 0], 'upperarm.R': [-74, 26, 8], 'forearm.R': [-36, 0, 0], 'hand.R': [-60, 0, 0], 'thigh.L': [-14, 0, 6], 'shin.L': [16, 0, 0], 'thigh.R': [8, 0, -6], 'shin.R': [12, 0, 0] }), [0, -0.04, 0.03], 'outExpo'),
    key(0.48, R({ spine: [6, 0, 0], 'upperarm.L': [-78, -26, -8], 'forearm.L': [-32, 0, 0], 'hand.L': [-56, 0, 0], 'upperarm.R': [-72, 26, 8], 'forearm.R': [-38, 0, 0], 'hand.R': [-56, 0, 0], 'thigh.L': [-14, 0, 6], 'shin.L': [16, 0, 0], 'thigh.R': [8, 0, -6], 'shin.R': [12, 0, 0] }), [0, -0.04, 0.03], 'inOut'),
    key(0.7, R(), [0, -0.01, 0], 'inOut'),
  ],
};

/** G: Resolve — the hands clasped tight, the head bowed, then lifted with her eyes set. */
const resolve: ClipDef = {
  name: 'or_resolve', dur: 1.0, fadeIn: 0.06, fadeOut: 0.22, events: { fx: 0.5 },
  keys: [
    key(0, R()),
    key(0.3, R({ spine: [8, 0, 0], chest: [6, 0, 0], neck: [10, 0, 0], head: [20, 0, 0], 'upperarm.L': [-22, -40, -8], 'forearm.L': [-116, 0, 0], 'upperarm.R': [-22, 40, 8], 'forearm.R': [-116, 0, 0] }), [0, -0.03, 0], 'inOut'),
    key(0.5, R({ spine: [-4, 0, 0], chest: [-6, 0, 0], neck: [-4, 0, 0], head: [-8, 0, 0], 'upperarm.L': [-10, 0, 24], 'forearm.L': [-20, 0, 0], 'hand.L': [0, 0, -20], 'upperarm.R': [-10, 0, -24], 'forearm.R': [-20, 0, 0], 'hand.R': [0, 0, 20], 'thigh.L': [-6, 0, 8], 'thigh.R': [-2, 0, -8] }), [0, 0, 0], 'outExpo'),
    key(0.78, R({ spine: [-2, 0, 0], head: [-4, 0, 0], 'upperarm.L': [-8, 0, 20], 'forearm.L': [-24, 0, 0], 'upperarm.R': [-8, 0, -20], 'forearm.R': [-24, 0, 0] }), [0, 0, 0], 'inOut'),
    key(1.0, R(), [0, -0.01, 0], 'inOut'),
  ],
};

/** F: Rokuten Shishun — the arms crossed over the chest, the head down; then thrown wide as the crimson rises. */
const rokuten: ClipDef = {
  name: 'or_rokuten', dur: 1.7, fadeIn: 0.08, fadeOut: 0.3, events: { gather: 0.2, burst: 0.85 },
  keys: [
    key(0, R()),
    key(0.6, R({ spine: [12, 0, 0], chest: [10, 0, 0], neck: [10, 0, 0], head: [16, 0, 0], 'upperarm.L': [-40, -50, -20], 'forearm.L': [-124, 0, 0], 'hand.L': [0, 0, 0], 'upperarm.R': [-44, 50, 20], 'forearm.R': [-124, 0, 0], 'hand.R': [0, 0, 0], 'thigh.L': [-14, 0, 4], 'shin.L': [28, 0, 0], 'thigh.R': [-14, 0, -4], 'shin.R': [28, 0, 0] }), [0, -0.1, 0], 'inOut'),
    key(0.85, R({ spine: [-10, 0, 0], chest: [-12, 0, 0], neck: [-8, 0, 0], head: [-18, 0, 0], 'upperarm.L': [-30, 0, 76], 'forearm.L': [-8, 0, 0], 'hand.L': [0, 0, -20], 'upperarm.R': [-30, 0, -76], 'forearm.R': [-8, 0, 0], 'hand.R': [0, 0, 20], 'thigh.L': [-4, 0, 8], 'shin.L': [6, 0, 0], 'thigh.R': [-2, 0, -8], 'shin.R': [6, 0, 0] }), [0, 0.06, 0], 'outExpo'),
    key(1.35, R({ spine: [-6, 0, 0], chest: [-8, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-26, 0, 64], 'forearm.L': [-14, 0, 0], 'upperarm.R': [-26, 0, -64], 'forearm.R': [-14, 0, 0], 'thigh.L': [-4, 0, 8], 'shin.L': [6, 0, 0], 'thigh.R': [-2, 0, -8], 'shin.R': [6, 0, 0] }), [0, 0.04, 0], 'inOut'),
    key(1.7, R(), [0, -0.01, 0], 'inOut'),
  ],
};

/** F in Rokuten Shishun: the Rejection — a rush, one palm laid on the enemy. */
const reject: ClipDef = {
  name: 'or_reject', dur: 1.1, fadeIn: 0.05, fadeOut: 0.25, events: { step: 0.1, hit: 0.36, end: 0.8 },
  keys: [
    key(0, R()),
    key(0.12, R({ ...STANCE, hips: [0, 10, 0], spine: [18, 6, 0], chest: [8, 0, 0], head: [-14, -6, 0], 'upperarm.R': [-30, 0, -30], 'forearm.R': [-90, 0, 0], 'upperarm.L': [30, 0, 20], 'forearm.L': [-30, 0, 0] }), [0, -0.12, 0.06], 'in'),
    key(0.36, R({ ...STANCE, hips: [0, -16, 0], spine: [10, -10, 0], chest: [4, -6, 0], head: [-2, 16, 0], 'upperarm.R': [-90, 0, 6], 'forearm.R': [-2, 0, 0], 'hand.R': [-76, 0, 0], 'upperarm.L': [10, 0, 26], 'forearm.L': [-30, 0, 0] }), [0, -0.1, 0.2], 'outExpo'),
    key(0.8, R({ ...STANCE, hips: [0, -14, 0], spine: [8, -8, 0], head: [-2, 14, 0], 'upperarm.R': [-88, 0, 6], 'forearm.R': [-6, 0, 0], 'hand.R': [-70, 0, 0], 'upperarm.L': [10, 0, 26], 'forearm.L': [-30, 0, 0] }), [0, -0.1, 0.18], 'inOut'),
    key(1.1, R(), [0, -0.01, 0], 'inOut'),
  ],
};

/** The erasure: she sinks to her knees, spent, as the crimson leaves her. */
const spent: ClipDef = {
  name: 'or_spent', dur: 2.4, fadeIn: 0.1, fadeOut: 0.4, events: {},
  keys: [
    key(0, R()),
    key(0.5, R({ hips: [0, 0, 0], spine: [24, 0, 0], chest: [10, 0, 0], neck: [10, 0, 0], head: [20, 0, 0], 'thigh.L': [-80, 0, 6], 'shin.L': [150, 0, 0], 'foot.L': [30, 0, 0], 'thigh.R': [-60, 0, -6], 'shin.R': [150, 0, 0], 'foot.R': [30, 0, 0], 'upperarm.L': [-20, 0, 10], 'forearm.L': [-30, 0, 0], 'upperarm.R': [-20, 0, -10], 'forearm.R': [-30, 0, 0] }), [0, -0.5, 0], 'inOut'),
    key(1.9, R({ hips: [0, 0, 0], spine: [20, 0, 0], chest: [8, 0, 0], neck: [8, 0, 0], head: [16, 0, 0], 'thigh.L': [-80, 0, 6], 'shin.L': [150, 0, 0], 'foot.L': [30, 0, 0], 'thigh.R': [-60, 0, -6], 'shin.R': [150, 0, 0], 'foot.R': [30, 0, 0], 'upperarm.L': [-20, 0, 10], 'forearm.L': [-34, 0, 0], 'upperarm.R': [-20, 0, -10], 'forearm.R': [-34, 0, 0] }), [0, -0.5, 0], 'inOut'),
    key(2.4, R(), [0, -0.01, 0], 'inOut'),
  ],
};

export const ORIHIME_CLIPS: ClipDef[] = [
  jab, palm, kick, bash, santen, soten, koten, shiten, resolve, rokuten, reject, spent,
  ...ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name)),
];
export const ORIHIME_CHAIN = ['or_jab', 'or_palm', 'or_kick', 'or_bash'];
