// Uryū's Blood War animation set (Sternritter "A" and Quincy: Vollständig). He stands straighter now, cooler: the bow
// hand loose at his side. To shoot he turns side-on, the bow arm straight out, the string hand drawn to the cheek and
// snapped open; up close a front kick and a palm thrust loose arrows point-blank. Instant Licht Regen is one hard
// release; Antithesis two fingers raised at the target; the Standspitze a long, careful draw; a Leiden Scherben chip
// flicked down and a snap of the fingers to set them off. Vollständig: arms flung wide as the pillar of light comes
// down; the flechettes are commanded with pointing hands; Sternenstaub is called down with a raised arm and a thrust
// palm; the Reishi Cage closes with a fist; Federzwinger is an arm swept down; Sklaverei the arms spread, palms up.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

const IDLE: Record<string, E> = {
  hips: [0, -6, 0], spine: [0, 0, 0], chest: [0, -4, 0], head: [-2, 4, 0],
  'thigh.L': [-6, 0, 3], 'shin.L': [6, 0, 0], 'thigh.R': [5, 0, -3], 'shin.R': [8, 0, 0], 'foot.R': [-3, 0, 0],
  'upperarm.L': [-6, 0, 6], 'forearm.L': [-14, 0, 0], 'hand.L': [0, 0, 0],
  'upperarm.R': [2, 0, -6], 'forearm.R': [-10, 0, 0],
};

export const URYU_TYBW_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.012,
  run: { chest: [4, -4, 0], 'upperarm.L': [-10, 0, 8], 'forearm.L': [-36, 0, 0] },
  sprint: { spine: [12, 0, 0], chest: [6, 0, 0], head: [-8, 0, 0], 'upperarm.L': [30, 0, 10], 'forearm.L': [-30, 0, 0], 'upperarm.R': [30, 0, -10], 'forearm.R': [-30, 0, 0] },
  swingL: 0.5,
  swingR: 0.8,
};

/** Vollständig: the wings held wide, he hangs lightly, legs together, the hands open. */
const VOLL_IDLE: Record<string, E> = {
  ...IDLE,
  'thigh.L': [-8, 0, 2], 'shin.L': [14, 0, 0], 'thigh.R': [-2, 0, -2], 'shin.R': [18, 0, 0], 'foot.L': [16, 0, 0], 'foot.R': [18, 0, 0],
  'upperarm.L': [-8, 0, 16], 'forearm.L': [-18, 0, 0], 'upperarm.R': [-6, 0, -16], 'forearm.R': [-18, 0, 0],
  'wing.L': [0, 0, 0], 'wing.R': [0, 0, 0],
};

export const URYU_VOLL_STANCE: StanceDef = {
  idle: VOLL_IDLE,
  idleHips: -0.01,
  run: { chest: [8, 0, 0], 'upperarm.L': [10, 0, 20], 'upperarm.R': [10, 0, -20], 'wing.L': [0, 14, 0], 'wing.R': [0, -14, 0] },
  sprint: { spine: [14, 0, 0], chest: [8, 0, 0], head: [-10, 0, 0], 'upperarm.L': [36, 0, 18], 'upperarm.R': [36, 0, -18], 'wing.L': [0, 30, -6], 'wing.R': [0, -30, 6] },
  swingL: 0.3,
  swingR: 0.3,
};

const R = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });

/** side-on, the bow arm out at the target, the right hand drawn to the cheek */
const AIM: Record<string, E> = {
  hips: [0, -18, 0], spine: [0, -8, 0], chest: [0, -24, 0], head: [0, 28, 0],
  'thigh.L': [-14, 0, 8], 'shin.L': [10, 0, 0], 'thigh.R': [12, 0, -8], 'shin.R': [12, 0, 0],
  'upperarm.L': [-88, 24, 2], 'forearm.L': [-4, 0, 0], 'hand.L': [0, 0, 0],
  'upperarm.R': [-82, -14, -12], 'forearm.R': [-142, 0, 0], 'hand.R': [10, 0, 0],
};
/** the instant after the release: the drawing hand flies back open */
const LOOSE: Record<string, E> = { ...AIM, 'upperarm.R': [-66, -26, -36], 'forearm.R': [-118, 0, 0], 'hand.R': [-20, 0, 0] };
const A = (over: Record<string, E> = {}): Record<string, E> => ({ ...AIM, ...over });
const WIDE: Record<string, E> = { 'thigh.L': [-20, 0, 10], 'shin.L': [16, 0, 0], 'thigh.R': [16, 0, -10], 'shin.R': [18, 0, 0] };

const shot: ClipDef = {
  name: 'ut_shot', dur: 0.44, fadeIn: 0.04, fadeOut: 0.18, events: { fire: 0.11, combo: 0.17 },
  keys: [
    key(0, R()),
    key(0.09, A(), [0, -0.02, 0], 'outExpo'),
    key(0.13, { ...LOOSE }, [0, -0.02, 0], 'outExpo'),
    key(0.25, A(), [0, -0.02, 0], 'out'),
    key(0.44, R(), [0, -0.012, 0], 'inOut'),
  ],
};

const rapid: ClipDef = {
  name: 'ut_rapid', dur: 0.6, fadeIn: 0.04, fadeOut: 0.2, events: { fire1: 0.1, fire2: 0.19, fire3: 0.28, combo: 0.32 },
  keys: [
    key(0, R()),
    key(0.08, A(), [0, -0.02, 0], 'outExpo'),
    key(0.11, { ...LOOSE }, [0, -0.02, 0], 'linear'),
    key(0.16, A(), [0, -0.02, 0], 'linear'),
    key(0.2, { ...LOOSE }, [0, -0.02, 0], 'linear'),
    key(0.25, A(), [0, -0.02, 0], 'linear'),
    key(0.29, { ...LOOSE }, [0, -0.02, 0], 'linear'),
    key(0.4, A(), [0, -0.02, 0], 'out'),
    key(0.6, R(), [0, -0.012, 0], 'inOut'),
  ],
};

/** Point-blank: a snapping front kick, an arrow off the sole. */
const kick: ClipDef = {
  name: 'ut_kick', dur: 0.56, fadeIn: 0.04, fadeOut: 0.2, events: { fire: 0.16, combo: 0.24 },
  keys: [
    key(0, R()),
    key(0.09, R({ hips: [0, -10, 0], spine: [-6, 0, 0], chest: [-6, 8, 0], 'thigh.R': [-70, 0, -4], 'shin.R': [90, 0, 0], 'thigh.L': [-4, 0, 4], 'shin.L': [10, 0, 0], 'upperarm.L': [-30, 0, 30], 'forearm.L': [-40, 0, 0], 'upperarm.R': [10, 0, -30] }), [0, -0.01, -0.03], 'out'),
    key(0.16, R({ hips: [0, -14, 0], spine: [-12, 0, 0], chest: [-10, 10, 0], head: [8, -6, 0], 'thigh.R': [-96, 0, -4], 'shin.R': [6, 0, 0], 'foot.R': [-20, 0, 0], 'thigh.L': [-2, 0, 4], 'shin.L': [8, 0, 0], 'upperarm.L': [-40, 0, 40], 'forearm.L': [-30, 0, 0], 'upperarm.R': [16, 0, -36] }), [0, 0, -0.06], 'outExpo'),
    key(0.3, R({ hips: [0, -10, 0], 'thigh.R': [-50, 0, -4], 'shin.R': [70, 0, 0], 'upperarm.L': [-24, 0, 24], 'forearm.L': [-30, 0, 0] }), [0, -0.01, -0.02], 'inOut'),
    key(0.56, R(), [0, -0.012, 0], 'inOut'),
  ],
};

/** Point-blank: the right palm driven into the target, an arrow off the heel of the hand. */
const palm: ClipDef = {
  name: 'ut_palm', dur: 0.5, fadeIn: 0.04, fadeOut: 0.18, events: { fire: 0.13, combo: 0.2 },
  keys: [
    key(0, R()),
    key(0.07, R({ hips: [0, 16, 0], chest: [0, 18, 0], 'upperarm.R': [-30, 0, -20], 'forearm.R': [-110, 0, 0], 'hand.R': [-30, 0, 0], 'thigh.L': [-16, 0, 8], 'shin.L': [12, 0, 0], 'thigh.R': [12, 0, -8] }), [0, -0.02, -0.02], 'out'),
    key(0.13, R({ hips: [0, -14, 0], spine: [6, 0, 0], chest: [4, -20, 0], head: [0, 16, 0], 'upperarm.R': [-90, -8, -4], 'forearm.R': [-6, 0, 0], 'hand.R': [-60, 0, 0], 'upperarm.L': [-10, 0, 20], 'thigh.L': [-24, 0, 8], 'shin.L': [20, 0, 0], 'thigh.R': [16, 0, -8], 'shin.R': [10, 0, 0] }), [0, -0.03, 0.06], 'outExpo'),
    key(0.28, R({ hips: [0, -8, 0], chest: [2, -10, 0], 'upperarm.R': [-70, 0, -8], 'forearm.R': [-30, 0, 0], 'hand.R': [-40, 0, 0] }), [0, -0.02, 0.03], 'inOut'),
    key(0.5, R(), [0, -0.012, 0], 'inOut'),
  ],
};

/** The power shot: a long steady draw, the string past the ear, then loosed with a jolt. */
const charge: ClipDef = {
  name: 'ut_charge', dur: 1.05, fadeIn: 0.06, fadeOut: 0.24, events: { draw: 0.12, fire: 0.66 },
  keys: [
    key(0, R()),
    key(0.15, A(WIDE), [0, -0.05, 0], 'out'),
    key(0.62, A({ ...WIDE, 'upperarm.R': [-84, -20, -22], 'forearm.R': [-150, 0, 0] }), [0, -0.05, 0], 'inOut'),
    key(0.68, { ...LOOSE, ...WIDE }, [0, -0.05, -0.04], 'outExpo'),
    key(0.84, A(), [0, -0.03, 0], 'out'),
    key(1.05, R(), [0, -0.012, 0], 'inOut'),
  ],
};

/** Instant Licht Regen: no charge — the bow up, one hard release, the hand flung back as the barrage pours out. */
const licht: ClipDef = {
  name: 'ut_licht', dur: 1.0, fadeIn: 0.05, fadeOut: 0.26, events: { fire: 0.12, stop: 0.62 },
  keys: [
    key(0, R()),
    key(0.1, A({ ...WIDE, chest: [-6, -24, 0], 'upperarm.L': [-100, 24, 2] }), [0, -0.04, 0], 'outExpo'),
    key(0.16, { ...LOOSE, ...WIDE, chest: [-8, -26, 0], 'upperarm.L': [-100, 24, 2], 'upperarm.R': [-50, -30, -50], 'forearm.R': [-90, 0, 0] }, [0, -0.05, -0.05], 'outExpo'),
    key(0.62, { ...LOOSE, ...WIDE, chest: [-8, -26, 0], 'upperarm.L': [-98, 24, 2], 'upperarm.R': [-56, -30, -46], 'forearm.R': [-96, 0, 0] }, [0, -0.05, -0.04], 'inOut'),
    key(1.0, R(), [0, -0.012, 0], 'inOut'),
  ],
};

/** Antithesis: two fingers raised at the target, still. */
const antithesis: ClipDef = {
  name: 'ut_antithesis', dur: 1.0, fadeIn: 0.06, fadeOut: 0.24, events: { mark: 0.08, swap: 0.3 },
  keys: [
    key(0, R()),
    key(0.12, R({ hips: [0, -8, 0], chest: [0, -12, 0], head: [-4, 10, 0], 'upperarm.R': [-96, -10, -8], 'forearm.R': [-8, 0, 0], 'hand.R': [-6, 0, 0], 'upperarm.L': [-4, 0, 8] }), [0, -0.012, 0], 'out'),
    key(0.3, R({ hips: [0, -8, 0], chest: [0, -12, 0], head: [-6, 10, 0], 'upperarm.R': [-100, -10, -8], 'forearm.R': [-6, 0, 0], 'hand.R': [-4, 0, 0], 'upperarm.L': [-4, 0, 8] }), [0, -0.012, 0], 'outExpo'),
    key(0.7, R({ hips: [0, -8, 0], chest: [0, -10, 0], 'upperarm.R': [-90, -10, -8], 'forearm.R': [-10, 0, 0] }), [0, -0.012, 0], 'inOut'),
    key(1.0, R(), [0, -0.012, 0], 'inOut'),
  ],
};

/** The Standspitze: the Still-Silver head nocked, the long careful draw, then the release. */
const standspitze: ClipDef = {
  name: 'ut_standspitze', dur: 1.0, fadeIn: 0.06, fadeOut: 0.24, events: { nock: 0.12, fire: 0.42 },
  keys: [
    key(0, R()),
    key(0.12, R({ chest: [0, 10, 0], head: [6, -6, 0], 'upperarm.R': [-30, 0, 30], 'forearm.R': [-120, 0, 0] }), [0, -0.01, 0], 'out'),
    key(0.36, A({ ...WIDE, 'upperarm.R': [-84, -20, -22], 'forearm.R': [-150, 0, 0] }), [0, -0.04, 0], 'inOut'),
    key(0.44, { ...LOOSE, ...WIDE }, [0, -0.04, -0.03], 'outExpo'),
    key(0.66, A(), [0, -0.03, 0], 'out'),
    key(1.0, R(), [0, -0.012, 0], 'inOut'),
  ],
};

/** A Leiden Scherben chip flicked out and down to where he aims. */
const chip: ClipDef = {
  name: 'ut_chip', dur: 0.56, fadeIn: 0.05, fadeOut: 0.2, events: { throw: 0.16 },
  keys: [
    key(0, R()),
    key(0.09, R({ chest: [0, 12, 0], 'upperarm.R': [-36, 0, 30], 'forearm.R': [-100, 0, 0] }), [0, -0.01, 0], 'out'),
    key(0.16, R({ chest: [4, -14, 0], head: [6, 10, 0], 'upperarm.R': [-70, 0, -8], 'forearm.R': [-10, 0, 0], 'hand.R': [-30, 0, 0] }), [0, -0.02, 0.02], 'outExpo'),
    key(0.56, R(), [0, -0.012, 0], 'inOut'),
  ],
};

/** The chips set off: the right hand raised, a snap. */
const detonate: ClipDef = {
  name: 'ut_detonate', dur: 0.6, fadeIn: 0.05, fadeOut: 0.22, events: { snap: 0.16 },
  keys: [
    key(0, R()),
    key(0.1, R({ chest: [0, -6, 0], head: [-4, 6, 0], 'upperarm.R': [-60, 0, -40], 'forearm.R': [-100, 0, 0], 'hand.R': [10, 0, 0] }), [0, -0.01, 0], 'out'),
    key(0.16, R({ chest: [0, -8, 0], head: [-4, 6, 0], 'upperarm.R': [-64, 0, -42], 'forearm.R': [-108, 0, 0], 'hand.R': [-24, 0, 0] }), [0, -0.012, 0], 'outExpo'),
    key(0.6, R(), [0, -0.012, 0], 'inOut'),
  ],
};

/** Quincy: Vollständig — the pillar of light comes down; arms flung wide, head back. */
const release: ClipDef = {
  name: 'ut_release', dur: 1.9, fadeIn: 0.1, fadeOut: 0.3, events: { pillar: 0.2, burst: 0.9 },
  keys: [
    key(0, R()),
    key(0.45, R({ chest: [8, 0, 0], head: [14, 0, 0], 'upperarm.L': [-40, 0, 20], 'forearm.L': [-80, 0, 0], 'upperarm.R': [-40, 0, -20], 'forearm.R': [-80, 0, 0], 'wing.L': [0, 50, 0], 'wing.R': [0, -50, 0] }), [0, -0.03, 0], 'inOut'),
    key(0.9, R({ spine: [-8, 0, 0], chest: [-12, 0, 0], head: [-20, 0, 0], 'upperarm.L': [-24, 0, 72], 'forearm.L': [-8, 0, 0], 'upperarm.R': [-24, 0, -72], 'forearm.R': [-8, 0, 0], 'thigh.L': [-8, 0, 8], 'thigh.R': [6, 0, -8], 'wing.L': [0, -8, 0], 'wing.R': [0, 8, 0] }), [0, 0.04, 0], 'outExpo'),
    key(1.45, R({ spine: [-6, 0, 0], chest: [-10, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-22, 0, 66], 'upperarm.R': [-22, 0, -66], 'wing.L': [0, 0, 0], 'wing.R': [0, 0, 0] }), [0, 0.04, 0], 'out'),
    key(1.9, R(), [0, -0.012, 0], 'inOut'),
  ],
};

/** A hand pointed at the target: the flechettes go. 'R' or 'L'. */
const point = (side: 'R' | 'L', name: string): ClipDef => {
  const k = side === 'R' ? 1 : -1;
  return {
    name, dur: 0.46, fadeIn: 0.04, fadeOut: 0.18, events: { fire: 0.12, combo: 0.18 },
    keys: [
      key(0, R()),
      key(0.06, R({ chest: [0, k * 14, 0], [`upperarm.${side}`]: [-40, 0, -k * 26], [`forearm.${side}`]: [-80, 0, 0] }), [0, -0.01, 0], 'out'),
      key(0.12, R({ hips: [0, -k * 10, 0], chest: [0, -k * 16, 0], head: [0, k * 12, 0], [`upperarm.${side}`]: [-94, -k * 8, -k * 6], [`forearm.${side}`]: [-4, 0, 0], [`hand.${side}`]: [-10, 0, 0] }), [0, -0.012, 0.03], 'outExpo'),
      key(0.26, R({ chest: [0, -k * 10, 0], [`upperarm.${side}`]: [-80, -k * 6, -k * 8], [`forearm.${side}`]: [-12, 0, 0] }), [0, -0.012, 0.02], 'inOut'),
      key(0.46, R(), [0, -0.012, 0], 'inOut'),
    ],
  };
};

/** The composite Heilig Pfeil: both hands drawn back, then thrust out together. */
const composite: ClipDef = {
  name: 'ut_composite', dur: 0.8, fadeIn: 0.05, fadeOut: 0.22, events: { merge: 0.08, fire: 0.4 },
  keys: [
    key(0, R()),
    key(0.3, R({ ...WIDE, chest: [-6, 0, 0], 'upperarm.L': [-50, 0, 40], 'forearm.L': [-100, 0, 0], 'upperarm.R': [-50, 0, -40], 'forearm.R': [-100, 0, 0] }), [0, -0.04, -0.03], 'inOut'),
    key(0.4, R({ ...WIDE, spine: [8, 0, 0], chest: [4, 0, 0], 'upperarm.L': [-88, 0, 4], 'forearm.L': [-4, 0, 0], 'hand.L': [-50, 0, 0], 'upperarm.R': [-88, 0, -4], 'forearm.R': [-4, 0, 0], 'hand.R': [-50, 0, 0] }), [0, -0.05, 0.06], 'outExpo'),
    key(0.8, R(), [0, -0.012, 0], 'inOut'),
  ],
};

/** Sternenstaub: the right arm raised as the great arrow forms, then the palm thrust at the target. */
const stern: ClipDef = {
  name: 'ut_stern', dur: 1.3, fadeIn: 0.08, fadeOut: 0.28, events: { form: 0.05, fire: 0.72 },
  keys: [
    key(0, R()),
    key(0.3, R({ chest: [-6, 10, 0], head: [-14, 0, 0], 'upperarm.R': [-160, 0, -20], 'forearm.R': [-10, 0, 0], 'hand.R': [0, 0, 0], 'upperarm.L': [-20, 0, 30], 'wing.L': [0, 20, 0], 'wing.R': [0, -20, 0] }), [0, -0.01, 0], 'out'),
    key(0.66, R({ chest: [-8, 12, 0], head: [-16, 0, 0], 'upperarm.R': [-166, 0, -22], 'forearm.R': [-8, 0, 0], 'upperarm.L': [-20, 0, 30], 'wing.L': [0, 26, 0], 'wing.R': [0, -26, 0] }), [0, -0.01, 0], 'inOut'),
    key(0.74, R({ ...WIDE, hips: [0, -12, 0], spine: [8, 0, 0], chest: [6, -16, 0], head: [0, 12, 0], 'upperarm.R': [-92, -6, -4], 'forearm.R': [-2, 0, 0], 'hand.R': [-70, 0, 0], 'upperarm.L': [-20, 0, 40], 'wing.L': [0, -10, 0], 'wing.R': [0, 10, 0] }), [0, -0.04, 0.06], 'outExpo'),
    key(1.3, R(), [0, -0.012, 0], 'inOut'),
  ],
};

/** The Reishi Cage: the hand reaches for the target and closes into a fist. */
const cage: ClipDef = {
  name: 'ut_cage', dur: 0.95, fadeIn: 0.05, fadeOut: 0.24, events: { cage: 0.14, close: 0.5 },
  keys: [
    key(0, R()),
    key(0.14, R({ hips: [0, -10, 0], chest: [0, -14, 0], head: [0, 10, 0], 'upperarm.R': [-92, -10, -10], 'forearm.R': [-6, 0, 0], 'hand.R': [-50, 0, 0] }), [0, -0.012, 0.02], 'out'),
    key(0.46, R({ hips: [0, -10, 0], chest: [0, -14, 0], head: [0, 10, 0], 'upperarm.R': [-94, -10, -10], 'forearm.R': [-10, 0, 0], 'hand.R': [-40, 0, 0] }), [0, -0.012, 0.02], 'inOut'),
    key(0.52, R({ hips: [0, -10, 0], chest: [2, -16, 0], head: [0, 10, 0], 'upperarm.R': [-86, -10, -10], 'forearm.R': [-30, 0, 0], 'hand.R': [10, 0, 0] }), [0, -0.015, 0.02], 'outExpo'),
    key(0.95, R(), [0, -0.012, 0], 'inOut'),
  ],
};

/** Federzwinger: the arm raised, then swept down — the five rods rain onto the target. */
const feder: ClipDef = {
  name: 'ut_feder', dur: 0.9, fadeIn: 0.05, fadeOut: 0.24, events: { rain: 0.32 },
  keys: [
    key(0, R()),
    key(0.22, R({ chest: [-6, 8, 0], head: [-8, 0, 0], 'upperarm.R': [-150, 0, -30], 'forearm.R': [-20, 0, 0] }), [0, -0.01, 0], 'out'),
    key(0.32, R({ chest: [10, -10, 0], head: [8, 6, 0], 'upperarm.R': [-50, 0, -20], 'forearm.R': [-10, 0, 0], 'hand.R': [-20, 0, 0] }), [0, -0.03, 0.02], 'outExpo'),
    key(0.9, R(), [0, -0.012, 0], 'inOut'),
  ],
};

/** Sklaverei: the arms spread low, palms up, chest open — the world comes apart into him. Held by the kit. */
const sklaverei: ClipDef = {
  name: 'ut_sklaverei', dur: 2.4, fadeIn: 0.12, fadeOut: 0.3, events: { start: 0.2 },
  keys: [
    key(0, R()),
    key(0.3, R({ spine: [-6, 0, 0], chest: [-10, 0, 0], head: [-12, 0, 0], 'upperarm.L': [-30, 0, 46], 'forearm.L': [-30, -60, 0], 'upperarm.R': [-30, 0, -46], 'forearm.R': [-30, 60, 0], 'wing.L': [0, 30, 0], 'wing.R': [0, -30, 0] }), [0, 0.02, 0], 'out'),
    key(2.0, R({ spine: [-8, 0, 0], chest: [-12, 0, 0], head: [-16, 0, 0], 'upperarm.L': [-34, 0, 50], 'forearm.L': [-30, -60, 0], 'upperarm.R': [-34, 0, -50], 'forearm.R': [-30, 60, 0], 'wing.L': [0, 36, 0], 'wing.R': [0, -36, 0] }), [0, 0.03, 0], 'inOut'),
    key(2.4, R(), [0, -0.012, 0], 'inOut'),
  ],
};

/** The Icosahedron Barrier raised: arms crossed before him, then opened. */
const barrier: ClipDef = {
  name: 'ut_barrier', dur: 0.7, fadeIn: 0.05, fadeOut: 0.22, events: { raise: 0.22 },
  keys: [
    key(0, R()),
    key(0.14, R({ chest: [6, 0, 0], 'upperarm.L': [-70, 0, -30], 'forearm.L': [-70, 0, 0], 'upperarm.R': [-70, 0, 30], 'forearm.R': [-70, 0, 0], 'wing.L': [0, 40, 0], 'wing.R': [0, -40, 0] }), [0, -0.02, 0], 'out'),
    key(0.24, R({ chest: [-4, 0, 0], 'upperarm.L': [-40, 0, 50], 'forearm.L': [-20, 0, 0], 'upperarm.R': [-40, 0, -50], 'forearm.R': [-20, 0, 0], 'wing.L': [0, -10, 0], 'wing.R': [0, 10, 0] }), [0, 0, 0], 'outExpo'),
    key(0.7, R(), [0, -0.012, 0], 'inOut'),
  ],
};

/** The barrier's panels unfold and fire: both hands thrust at the target. */
const beams: ClipDef = {
  name: 'ut_beams', dur: 1.3, fadeIn: 0.05, fadeOut: 0.26, events: { fire: 0.16 },
  keys: [
    key(0, R()),
    key(0.16, R({ ...WIDE, spine: [6, 0, 0], 'upperarm.L': [-86, 0, 10], 'forearm.L': [-4, 0, 0], 'hand.L': [-60, 0, 0], 'upperarm.R': [-86, 0, -10], 'forearm.R': [-4, 0, 0], 'hand.R': [-60, 0, 0], 'wing.L': [0, -20, 0], 'wing.R': [0, 20, 0] }), [0, -0.04, 0.04], 'outExpo'),
    key(1.0, R({ ...WIDE, spine: [6, 0, 0], 'upperarm.L': [-84, 0, 12], 'forearm.L': [-8, 0, 0], 'hand.L': [-60, 0, 0], 'upperarm.R': [-84, 0, -12], 'forearm.R': [-8, 0, 0], 'hand.R': [-60, 0, 0], 'wing.L': [0, -20, 0], 'wing.R': [0, 20, 0] }), [0, -0.04, 0.03], 'inOut'),
    key(1.3, R(), [0, -0.012, 0], 'inOut'),
  ],
};

/** The wings beat (layered over the stance while he flies: only the wing bones are keyed). */
const beat: ClipDef = {
  name: 'ut_beat', dur: 0.9, fadeIn: 0.2, fadeOut: 0.3, loop: true,
  keys: [
    key(0, { 'wing.L': [6, 18, -4], 'wing.R': [6, -18, 4] }, undefined, 'inOut'),
    key(0.45, { 'wing.L': [-4, -14, 6], 'wing.R': [-4, 14, -6] }, undefined, 'inOut'),
    key(0.9, { 'wing.L': [6, 18, -4], 'wing.R': [6, -18, 4] }, undefined, 'inOut'),
  ],
};

export const URYU_TYBW_CLIPS: ClipDef[] = [
  shot, rapid, kick, palm, charge, licht, antithesis, standspitze, chip, detonate, release,
  point('R', 'ut_point'), point('L', 'ut_point2'), composite, stern, cage, feder, sklaverei, barrier, beams, beat,
  ...ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name)),
];
/** the LMB string: two shots and a three-arrow burst; point-blank: the kick and the palm */
export const URYU_TYBW_CHAIN = ['ut_shot', 'ut_shot', 'ut_rapid'];
export const URYU_TYBW_CLOSE = ['ut_kick', 'ut_palm'];
/** Vollständig: three pointed volleys, then the composite arrow */
export const URYU_VOLL_CHAIN = ['ut_point', 'ut_point2', 'ut_point', 'ut_composite'];
