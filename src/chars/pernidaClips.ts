// Pernida Parnkgjas's animation set. The cloak: a small hooded thing that glides, hunched, the head a little down,
// the pale left hand held before it with the long fingers loose and the right sleeve hanging; it lashes nerves out
// of its sleeves (the flick string), raises the hand with the fingers spread for the Compulsory, presses it to the
// ground for the stone hands, draws the bow between its fingers. The Hand and the Arm: a giant left hand on a knot of
// nerve roots (the quad gait walks the roots): fingers rake, the palm slams, the back of the hand swats; the fingers
// spread for the Compulsory and clench for the nerve storm; five fingertip bows; two fingers bent back and torn off
// (the clones); the palm opens a mouth (devour). The Arm bends at the stump (spine) and the elbow (chest).
// Finger bones: f.<thumb|index|middle|ring|pinky>.<1-3>; +X curls a finger toward the palm (the palm faces +Z).
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

// ---------------------------------------------------------------------------------------------- the cloak

/** hunched, the head a little down, the left hand held before it, the right sleeve hanging */
const CLOAK_IDLE: Record<string, E> = {
  spine: [4, 0, 0], chest: [4, 0, 0], neck: [5, 0, 0], head: [7, 0, 0],
  'upperarm.L': [-16, 0, 13], 'forearm.L': [-34, 0, 0], 'hand.L': [6, -20, 0],
  'upperarm.R': [-5, 0, -11], 'forearm.R': [-12, 0, 0],
};

export const CLOAK_STANCE: StanceDef = {
  idle: CLOAK_IDLE,
  idleHips: -0.01,
  run: { spine: [12, 0, 0], chest: [6, 0, 0], head: [-6, 0, 0], 'upperarm.L': [16, 0, 16], 'forearm.L': [-10, 0, 0], 'upperarm.R': [16, 0, -16], 'forearm.R': [-10, 0, 0] },
  sprint: { spine: [20, 0, 0], chest: [8, 0, 0], head: [-12, 0, 0], 'upperarm.L': [30, 0, 18], 'forearm.L': [-6, 0, 0], 'upperarm.R': [30, 0, -18], 'forearm.R': [-6, 0, 0] },
  swingL: 0.05,
  swingR: 0.05,
  freqScale: 1.1,
};

// ---------------------------------------------------------------------------------------------- the hand and the arm

const FINGERS = ['index', 'middle', 'ring', 'pinky'] as const;

/** every finger curled by c (per joint, degrees) and spread by s (Z, outward from the middle), the thumb by tc */
function hand(c: [number, number, number], s = 0, tc: [number, number, number] = [0, 0, 0]): Record<string, E> {
  const o: Record<string, E> = {};
  FINGERS.forEach((n, i) => {
    const spread = (i - 1.2) * -s;
    o[`f.${n}.1`] = [c[0], 0, spread];
    o[`f.${n}.2`] = [c[1], 0, 0];
    o[`f.${n}.3`] = [c[2], 0, 0];
  });
  o['f.thumb.1'] = [tc[0] * 0.5, 0, -tc[0] * 0.6];
  o['f.thumb.2'] = [tc[1], 0, -tc[1] * 0.3];
  o['f.thumb.3'] = [tc[2], 0, 0];
  return o;
}

/** the giant hand at rest: the fingers a little curled, the palm leaning toward its target */
const HAND_IDLE: Record<string, E> = { spine: [4, 0, 0], palm: [3, 0, 0], ...hand([6, 9, 7], 3, [6, 8, 6]) };

export const HAND_STANCE: StanceDef = {
  idle: HAND_IDLE,
  run: { spine: [10, 0, 0], palm: [6, 0, 0], ...hand([10, 14, 10], 5, [10, 10, 8]) },
  sprint: { spine: [16, 0, 0], palm: [10, 0, 0], ...hand([14, 18, 12], 6, [12, 12, 10]) },
  quad: { stride: 0.7, rock: 3 },
  freqScale: 0.85,
};

/** the arm stands straight up from its roots, the hand at the top a little forward */
const ARM_IDLE: Record<string, E> = { spine: [3, 0, 0], chest: [6, 0, 0], palm: [4, 0, 0], ...hand([6, 9, 7], 3, [6, 8, 6]) };

export const ARM_STANCE: StanceDef = {
  idle: ARM_IDLE,
  run: { spine: [8, 0, 0], chest: [10, 0, 0], palm: [8, 0, 0], ...hand([10, 14, 10], 5, [10, 10, 8]) },
  sprint: { spine: [12, 0, 0], chest: [14, 0, 0], palm: [10, 0, 0], ...hand([12, 16, 12], 6, [12, 12, 10]) },
  quad: { stride: 0.8, rock: 2 },
  freqScale: 0.6,
  speedScale: 2.2,
};

// ---------------------------------------------------------------------------------------------- the cloak's clips

const C = (over: Record<string, E> = {}): Record<string, E> => ({ ...CLOAK_IDLE, ...over });

/** a nerve lash out of one sleeve: the arm thrown out wide, then whipped forward across the body */
function flick(name: string, side: 'L' | 'R'): ClipDef {
  const k = side === 'L' ? 1 : -1;
  const ua = `upperarm.${side}`, fa = `forearm.${side}`, hd = `hand.${side}`;
  return {
    name, dur: 0.38, fadeIn: 0.05, fadeOut: 0.18, events: { hit: 0.13 },
    keys: [
      key(0, C()),
      key(0.08, C({ spine: [2, 16 * k, 0], chest: [2, 10 * k, 0], [ua]: [8, 0, 40 * k], [fa]: [-50, 0, 0], [hd]: [20, -30 * k, 0] }), [0, 0, -0.02], 'out'),
      key(0.14, C({ spine: [6, -14 * k, 0], chest: [4, -12 * k, 0], [ua]: [-78, -24 * k, 8 * k], [fa]: [-6, 0, 0], [hd]: [-10, -40 * k, 0] }), [0, 0, 0.04], 'outExpo'),
      key(0.38, C(), undefined, 'inOut'),
    ],
  };
}

const pnFlick3: ClipDef = {
  name: 'pn_flick3', dur: 0.46, fadeIn: 0.05, fadeOut: 0.2, events: { hit: 0.2 },
  keys: [
    key(0, C()),
    key(0.12, C({ spine: [16, 0, 0], chest: [8, 0, 0], 'upperarm.L': [10, 0, 22], 'upperarm.R': [10, 0, -22], 'forearm.L': [-20, 0, 0], 'forearm.R': [-20, 0, 0] }), [0, -0.06, 0], 'out'),
    key(0.22, C({ spine: [-12, 0, 0], chest: [-8, 0, 0], head: [-8, 0, 0], 'upperarm.L': [-150, 0, 18], 'upperarm.R': [-150, 0, -18], 'forearm.L': [-4, 0, 0], 'forearm.R': [-4, 0, 0] }), [0, 0.04, 0.03], 'outExpo'),
    key(0.46, C(), undefined, 'inOut'),
  ],
};

const pnFlick4: ClipDef = {
  name: 'pn_flick4', dur: 0.56, fadeIn: 0.05, fadeOut: 0.22, events: { hit: 0.24 },
  keys: [
    key(0, C()),
    key(0.14, C({ spine: [-4, 24, 0], chest: [-4, 14, 0], 'upperarm.L': [-30, 0, 30], 'forearm.L': [-90, 0, 0], 'hand.L': [0, 0, 0] }), [0, 0, -0.06], 'out'),
    key(0.24, C({ spine: [16, -10, 0], chest: [8, -6, 0], 'upperarm.L': [-88, -6, 4], 'forearm.L': [-4, 0, 0], 'hand.L': [6, 0, 0] }), [0, -0.04, 0.16], 'outExpo'),
    key(0.56, C(), undefined, 'inOut'),
  ],
};

/** the Compulsory: the hand raised at them, the fingers spread (the eyes flare first); held while the grip runs */
const COMPEL: Record<string, E> = { spine: [-2, 8, 0], chest: [-4, 6, 0], head: [-6, 0, 0], 'upperarm.L': [-96, 0, 12], 'forearm.L': [-8, 0, 0], 'hand.L': [-18, -10, 0], 'upperarm.R': [-10, 0, -20], 'forearm.R': [-30, 0, 0] };
const pnCompel: ClipDef = {
  name: 'pn_compel', dur: 0.62, fadeIn: 0.08, fadeOut: 0.25, events: { fire: 0.3 },
  keys: [
    key(0, C()),
    key(0.3, C(COMPEL), [0, 0, 0.02], 'outBack'),
    // the wrist turns: the wringing
    key(0.62, C({ ...COMPEL, 'hand.L': [-18, 70, 0], 'forearm.L': [-14, 30, 0] }), [0, 0, 0.02], 'inOut'),
  ],
};
/** the fold: the hand closed and pulled down hard */
const pnFold: ClipDef = {
  name: 'pn_fold', dur: 0.56, fadeIn: 0.04, fadeOut: 0.24, events: { crush: 0.2 },
  keys: [
    key(0, C({ ...COMPEL, 'hand.L': [-18, 70, 0] })),
    key(0.2, C({ ...COMPEL, spine: [14, 8, 0], chest: [8, 6, 0], 'upperarm.L': [-58, 0, 10], 'forearm.L': [-76, 0, 0], 'hand.L': [30, 90, 0] }), [0, -0.06, 0], 'outExpo'),
    key(0.56, C(), undefined, 'inOut'),
  ],
};

const pnLance: ClipDef = {
  name: 'pn_lance', dur: 0.62, fadeIn: 0.05, fadeOut: 0.22, events: { fire: 0.24 },
  keys: [
    key(0, C()),
    key(0.14, C({ spine: [-8, 0, 0], 'upperarm.L': [-40, 0, 26], 'upperarm.R': [-40, 0, -26], 'forearm.L': [-80, 0, 0], 'forearm.R': [-80, 0, 0] }), [0, 0, -0.05], 'out'),
    key(0.24, C({ spine: [14, 0, 0], chest: [6, 0, 0], 'upperarm.L': [-90, -8, 6], 'upperarm.R': [-90, 8, -6], 'forearm.L': [-2, 0, 0], 'forearm.R': [-2, 0, 0] }), [0, -0.02, 0.12], 'outExpo'),
    key(0.62, C(), undefined, 'inOut'),
  ],
};

/** crouched, the left palm pressed to the ground: the nerves go into the stone */
const STONE: Record<string, E> = { spine: [44, 0, 0], chest: [22, 0, 0], neck: [-6, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-64, 0, 10], 'forearm.L': [-6, 0, 0], 'hand.L': [70, 0, 0] };
const pnStone: ClipDef = {
  name: 'pn_stone', dur: 1.0, fadeIn: 0.06, fadeOut: 0.25, events: { press: 0.36 },
  keys: [
    key(0, C()),
    key(0.22, C({ spine: [30, 0, 0], chest: [16, 0, 0], 'upperarm.L': [-50, 0, 14], 'forearm.L': [-26, 0, 0], 'hand.L': [40, 0, 0] }), [0, -0.18, 0.06], 'out'),
    key(0.36, C(STONE), [0, -0.3, 0.1], 'outExpo'),
    key(0.7, C({ ...STONE, 'hand.L': [74, 0, 4] }), [0, -0.3, 0.1], 'inOut'),
    key(1.0, C(), undefined, 'inOut'),
  ],
};

/** Heilig Bogen: the bow held out in the left fist, the right sleeve drawing to the hood, loosed */
const BOW: Record<string, E> = { spine: [0, -26, 0], chest: [0, -18, 0], head: [-4, 36, 0], 'upperarm.L': [-88, 0, 6], 'forearm.L': [0, 0, 0], 'hand.L': [0, 0, 0] };
const pnBow: ClipDef = {
  name: 'pn_bow', dur: 1.15, fadeIn: 0.08, fadeOut: 0.25, events: { draw: 0.3, loose: 0.76 },
  keys: [
    key(0, C()),
    key(0.3, C({ ...BOW, 'upperarm.R': [-80, -30, -14], 'forearm.R': [-60, 0, 0] }), [0, 0, 0], 'out'),
    key(0.72, C({ ...BOW, 'upperarm.R': [-84, -52, -16], 'forearm.R': [-122, 0, 0] }), [0, 0, -0.02], 'inOut'),
    key(0.8, C({ ...BOW, 'upperarm.R': [-70, -52, -40], 'forearm.R': [-56, 0, 0] }), [0, 0, -0.04], 'outExpo'),
    key(1.15, C(), undefined, 'inOut'),
  ],
};

const pnStep: ClipDef = {
  name: 'pn_step', dur: 0.3, fadeIn: 0.02, fadeOut: 0.15,
  keys: [
    key(0, C({ spine: [14, 0, 0], chest: [8, 0, 0], head: [10, 0, 0] }), [0, -0.08, 0]),
    key(0.3, C(), undefined, 'out'),
  ],
};

/** the cloak heaves and tears from inside: the hood bulging, the body thrown about, the arms flung wide */
const pnUnveil: ClipDef = {
  name: 'pn_unveil', dur: 1.4, fadeIn: 0.08, fadeOut: 0.1, events: { tear: 1.3 },
  keys: [
    key(0, C()),
    key(0.3, C({ spine: [20, 0, 6], chest: [24, 0, -6], neck: [20, 0, 0], head: [20, 0, 0], 'upperarm.L': [10, 0, 20], 'upperarm.R': [10, 0, -20] }), [0, -0.1, 0], 'inOut'),
    key(0.6, C({ spine: [-10, 0, -8], chest: [-16, 0, 8], head: [-20, 10, 0], 'upperarm.L': [-40, 0, 60], 'upperarm.R': [-40, 0, -60] }), [0, 0.04, 0], 'outBack'),
    key(0.9, C({ spine: [26, 0, 0], chest: [30, 0, 0], head: [30, 0, 0], 'upperarm.L': [0, 0, 30], 'upperarm.R': [0, 0, -30] }), [0, -0.16, 0], 'inOut'),
    key(1.4, C({ spine: [-20, 0, 0], chest: [-20, 0, 0], head: [-30, 0, 0], 'upperarm.L': [-120, 0, 70], 'upperarm.R': [-120, 0, -70] }), [0, 0.1, 0], 'outExpo'),
  ],
};

/** the Vollständig: the arms opened wide, the head thrown back, the wings bursting out */
const pnVoll: ClipDef = {
  name: 'pn_voll', dur: 1.2, fadeIn: 0.08, fadeOut: 0.3, events: { burst: 0.66 },
  keys: [
    key(0, C()),
    key(0.5, C({ spine: [20, 0, 0], chest: [16, 0, 0], head: [16, 0, 0], 'upperarm.L': [0, 0, 8], 'upperarm.R': [0, 0, -8], 'forearm.L': [-60, 0, 0], 'forearm.R': [-60, 0, 0] }), [0, -0.1, 0], 'inOut'),
    key(0.7, C({ spine: [-14, 0, 0], chest: [-14, 0, 0], head: [-26, 0, 0], 'upperarm.L': [-30, 0, 76], 'upperarm.R': [-30, 0, -76], 'forearm.L': [-6, 0, 0], 'forearm.R': [-6, 0, 0] }), [0, 0.06, 0], 'outExpo'),
    key(1.2, C(), undefined, 'inOut'),
  ],
};

/** silent pressure: hunched lower, then the hood slowly lifts */
const pnPressure: ClipDef = {
  name: 'pn_pressure', dur: 1.0, fadeIn: 0.1, fadeOut: 0.3, events: { pulse: 0.55 },
  keys: [
    key(0, C()),
    key(0.45, C({ spine: [16, 0, 0], chest: [12, 0, 0], neck: [12, 0, 0], head: [18, 0, 0], 'upperarm.L': [-6, 0, 20], 'upperarm.R': [-6, 0, -20] }), [0, -0.08, 0], 'inOut'),
    key(0.6, C({ spine: [-4, 0, 0], chest: [-4, 0, 0], neck: [-6, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-10, 0, 34], 'upperarm.R': [-10, 0, -34] }), [0, 0.02, 0], 'outExpo'),
    key(1.0, C(), undefined, 'inOut'),
  ],
};

// the Vollständig's wings: wing.L swings forward with −Y, wing.R with +Y
function slap(name: string, side: 'L' | 'R'): ClipDef {
  const k = side === 'L' ? -1 : 1;
  return {
    name, dur: 0.42, fadeIn: 0.04, fadeOut: 0.2, events: { hit: 0.16 },
    keys: [
      key(0, C()),
      key(0.1, C({ [`wing.${side}`]: [10, -30 * k, 0], spine: [0, 12 * k, 0] }), [0, 0, -0.02], 'out'),
      key(0.17, C({ [`wing.${side}`]: [-10, 80 * k, 0], spine: [6, -14 * k, 0] }), [0, 0, 0.05], 'outExpo'),
      key(0.42, C(), undefined, 'inOut'),
    ],
  };
}
const pvClap: ClipDef = {
  name: 'pv_clap', dur: 0.5, fadeIn: 0.04, fadeOut: 0.22, events: { hit: 0.22 },
  keys: [
    key(0, C()),
    key(0.12, C({ 'wing.L': [0, 30, 0], 'wing.R': [0, -30, 0], spine: [-8, 0, 0] }), [0, 0, -0.03], 'out'),
    key(0.22, C({ 'wing.L': [-6, -88, 0], 'wing.R': [-6, 88, 0], spine: [10, 0, 0] }), [0, 0, 0.06], 'outExpo'),
    key(0.5, C(), undefined, 'inOut'),
  ],
};
const pvDrive: ClipDef = {
  name: 'pv_drive', dur: 0.58, fadeIn: 0.04, fadeOut: 0.24, events: { hit: 0.26 },
  keys: [
    key(0, C()),
    key(0.14, C({ 'wing.L': [-40, 20, 0], 'wing.R': [-40, -20, 0], spine: [-10, 0, 0] }), [0, 0.05, -0.04], 'out'),
    key(0.26, C({ 'wing.L': [50, -60, 0], 'wing.R': [50, 60, 0], spine: [20, 0, 0], chest: [10, 0, 0] }), [0, -0.06, 0.1], 'outExpo'),
    key(0.58, C(), undefined, 'inOut'),
  ],
};
/** a wing reaching out to seize: held while it carries them */
const pvGrab: ClipDef = {
  name: 'pv_grab', dur: 0.5, fadeIn: 0.05, fadeOut: 0.25, events: { reach: 0.24 },
  keys: [
    key(0, C()),
    key(0.24, C({ 'wing.L': [-20, -96, -10], spine: [10, -16, 0], 'upperarm.L': [-80, 0, 30] }), [0, 0, 0.06], 'outExpo'),
    key(0.5, C({ 'wing.L': [-16, -90, -6], spine: [8, -12, 0], 'upperarm.L': [-70, 0, 26] }), [0, 0, 0.05], 'inOut'),
  ],
};

const SHARED = ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name));

export const PERNIDA_CHAIN = ['pn_flick1', 'pn_flick2', 'pn_flick3', 'pn_flick4'];
export const VOLL_CHAIN = ['pv_slap1', 'pv_slap2', 'pv_clap', 'pv_drive'];
export const PERNIDA_CLIPS: ClipDef[] = [
  flick('pn_flick1', 'L'), flick('pn_flick2', 'R'), pnFlick3, pnFlick4, pnCompel, pnFold, pnLance, pnStone, pnBow, pnStep, pnUnveil, pnVoll, pnPressure,
  slap('pv_slap1', 'L'), slap('pv_slap2', 'R'), pvClap, pvDrive, pvGrab, ...SHARED,
];

// ---------------------------------------------------------------------------------------------- the hand's clips

const H = (over: Record<string, E> = {}): Record<string, E> => ({ ...HAND_IDLE, ...over });
const SPREAD = hand([-12, -8, -4], 16, [-10, -10, 0]);
const FIST = hand([78, 96, 72], 0, [40, 55, 40]);
const FLAT = hand([-6, -4, 0], 10, [0, 0, 0]);

const phRake: ClipDef = {
  name: 'ph_rake', dur: 0.52, fadeIn: 0.05, fadeOut: 0.22, events: { hit: 0.22 },
  keys: [
    key(0, H()),
    key(0.16, H({ spine: [-18, 0, 0], palm: [-14, 0, 0], ...hand([-10, -6, 0], 8) }), [0, 0.1, -0.1], 'out'),
    key(0.26, H({ spine: [40, 0, 0], palm: [24, 0, 0], ...hand([45, 60, 45], 4, [30, 30, 20]) }), [0, -0.1, 0.25], 'outExpo'),
    key(0.52, H(), undefined, 'inOut'),
  ],
};
const phSlam: ClipDef = {
  name: 'ph_slam', dur: 0.76, fadeIn: 0.05, fadeOut: 0.24, events: { hit: 0.37 },
  keys: [
    key(0, H()),
    key(0.26, H({ spine: [-24, 0, 0], palm: [-16, 0, 0], ...FLAT }), [0, 0.2, -0.15], 'out'),
    key(0.38, H({ spine: [78, 0, 0], palm: [14, 0, 0], ...FLAT }), [0, -0.2, 0.4], 'outExpo'),
    key(0.55, H({ spine: [76, 0, 0], palm: [12, 0, 0], ...FLAT }), [0, -0.2, 0.4], 'inOut'),
    key(0.76, H(), undefined, 'inOut'),
  ],
};
const phBackhand: ClipDef = {
  name: 'ph_backhand', dur: 0.62, fadeIn: 0.05, fadeOut: 0.24, events: { hit: 0.28 },
  keys: [
    key(0, H()),
    key(0.18, H({ hips: [0, 60, 0], spine: [10, 20, -20], palm: [0, 20, 0] }), [0, 0, 0], 'out'),
    key(0.3, H({ hips: [0, -50, 0], spine: [20, -30, 30], palm: [0, -30, 0] }), [0, 0, 0.1], 'outExpo'),
    key(0.62, H(), undefined, 'inOut'),
  ],
};
const phCompel: ClipDef = {
  name: 'ph_compel', dur: 0.5, fadeIn: 0.06, fadeOut: 0.25, events: { fire: 0.3 },
  keys: [
    key(0, H()),
    key(0.3, H({ spine: [16, 0, 0], palm: [12, 0, 0], ...SPREAD }), [0, 0, 0.1], 'outBack'),
    key(0.5, H({ spine: [18, 0, 0], palm: [14, 0, 0], ...hand([-10, -6, -2], 18, [-8, -8, 0]) }), [0, 0, 0.1], 'inOut'),
  ],
};
const phBall: ClipDef = {
  name: 'ph_ball', dur: 0.62, fadeIn: 0.04, fadeOut: 0.26, events: { crush: 0.22 },
  keys: [
    key(0, H({ spine: [16, 0, 0], palm: [12, 0, 0], ...SPREAD }), [0, 0, 0.1]),
    key(0.22, H({ spine: [6, 0, 0], palm: [4, 0, 0], ...FIST }), [0, -0.06, 0], 'outExpo'),
    key(0.42, H({ spine: [6, 0, 0], palm: [4, 0, 0], ...FIST }), [0, -0.06, 0], 'inOut'),
    key(0.62, H(), undefined, 'inOut'),
  ],
};
const phStorm: ClipDef = {
  name: 'ph_storm', dur: 1.0, fadeIn: 0.08, fadeOut: 0.26, events: { fire: 0.55 },
  keys: [
    key(0, H()),
    key(0.45, H({ spine: [-6, 0, 0], ...FIST }), [0, -0.1, 0], 'inOut'),
    key(0.56, H({ spine: [8, 0, 0], palm: [6, 0, 0], ...hand([-18, -14, -8], 24, [-20, -20, -10]) }), [0, 0.12, 0], 'outExpo'),
    key(1.0, H(), undefined, 'inOut'),
  ],
};
const phStone: ClipDef = {
  name: 'ph_stone', dur: 0.95, fadeIn: 0.06, fadeOut: 0.26, events: { press: 0.38 },
  keys: [
    key(0, H()),
    key(0.24, H({ spine: [-14, 0, 0], ...hand([-8, -6, -2], 12) }), [0, 0.12, -0.1], 'out'),
    key(0.38, H({ spine: [82, 0, 0], palm: [8, 0, 0], ...FLAT }), [0, -0.25, 0.35], 'outExpo'),
    key(0.7, H({ spine: [80, 0, 0], palm: [8, 0, 0], ...hand([4, 8, 6], 10) }), [0, -0.25, 0.35], 'inOut'),
    key(0.95, H(), undefined, 'inOut'),
  ],
};
const phVolley: ClipDef = {
  name: 'ph_volley', dur: 1.2, fadeIn: 0.08, fadeOut: 0.26, events: { draw: 0.3, loose: 0.8 },
  keys: [
    key(0, H()),
    key(0.3, H({ spine: [10, 0, 0], palm: [6, 0, 0], ...hand([-6, -4, 0], 12, [-30, -20, 0]) }), [0, 0.05, 0], 'out'),
    key(0.76, H({ spine: [12, 0, 0], palm: [8, 0, 0], ...hand([-8, -6, 0], 13, [-40, -30, -10]) }), [0, 0.05, -0.04], 'inOut'),
    key(0.82, H({ spine: [16, 0, 0], palm: [10, 0, 0], ...hand([-4, -2, 0], 12, [30, 20, 10]) }), [0, 0.04, 0.06], 'outExpo'),
    key(1.2, H(), undefined, 'inOut'),
  ],
};
/** two fingers (the ring and the little) bent back until they tear off */
const phTear: ClipDef = {
  name: 'ph_tear', dur: 1.1, fadeIn: 0.08, fadeOut: 0.3, events: { tear: 0.72 },
  keys: [
    key(0, H()),
    key(0.4, H({ spine: [-8, 0, 0], palm: [0, 14, 0], ...hand([10, 14, 10], 4), 'f.ring.1': [-50, 0, -8], 'f.pinky.1': [-58, 0, -14], 'f.ring.2': [-20, 0, 0], 'f.pinky.2': [-24, 0, 0] }), [0, 0, 0], 'inOut'),
    key(0.7, H({ spine: [-12, 0, 0], palm: [0, 22, 0], ...hand([30, 40, 30], 4), 'f.ring.1': [-90, 0, -12], 'f.pinky.1': [-100, 0, -20], 'f.ring.2': [-30, 0, 0], 'f.pinky.2': [-30, 0, 0] }), [0, 0.02, 0], 'inOut'),
    key(0.8, H({ spine: [6, 0, 0], palm: [0, -8, 0], ...hand([-6, -4, 0], 12) }), [0, -0.04, 0], 'outExpo'),
    key(1.1, H(), undefined, 'inOut'),
  ],
};
/** onto its fingertips: the rush */
const phGallop: ClipDef = {
  name: 'ph_gallop', dur: 0.5, fadeIn: 0.05, fadeOut: 0.2,
  keys: [
    key(0, H({ spine: [40, 0, 0], palm: [20, 0, 0], ...hand([30, 30, 20], 10) }), [0, -0.2, 0]),
    key(0.25, H({ spine: [56, 0, 0], palm: [26, 0, 0], ...hand([46, 40, 30], 12) }), [0, -0.35, 0.1], 'inOut'),
    key(0.5, H(), undefined, 'inOut'),
  ],
};
/** the chains strain and snap: the fingers wrenched apart */
const phChains: ClipDef = {
  name: 'ph_chains', dur: 1.4, fadeIn: 0.08, fadeOut: 0.2, events: { snap: 1.0 },
  keys: [
    key(0, H()),
    key(0.3, H({ spine: [-8, 0, 0], ...hand([10, 14, 10], 0) }), [0, -0.1, 0], 'inOut'),
    key(0.55, H({ spine: [-14, 0, 4], ...hand([-14, -10, -6], 22, [-20, -16, 0]) }), [0, 0.05, 0], 'out'),
    key(0.7, H({ spine: [-12, 0, -4], ...hand([-10, -8, -4], 18, [-16, -12, 0]) }), [0, 0.02, 0], 'inOut'),
    key(0.85, H({ spine: [-16, 0, 4], ...hand([-16, -12, -6], 24, [-22, -18, 0]) }), [0, 0.06, 0], 'inOut'),
    key(1.02, H({ spine: [-20, 0, 0], palm: [-10, 0, 0], ...hand([-22, -16, -10], 30, [-30, -24, -10]) }), [0, 0.1, 0], 'outExpo'),
    key(1.4, H(), undefined, 'inOut'),
  ],
};
/** out of the shredded cloak: the hand unfolding upward from a crouch */
const phRise: ClipDef = {
  name: 'ph_rise', dur: 1.2, fadeIn: 0.02, fadeOut: 0.3,
  keys: [
    key(0, H({ spine: [60, 0, 0], palm: [40, 0, 0], ...FIST }), [0, -1.2, 0]),
    key(0.6, H({ spine: [20, 0, 0], palm: [10, 0, 0], ...hand([40, 50, 40], 4) }), [0, -0.3, 0], 'out'),
    key(0.9, H({ spine: [-10, 0, 0], palm: [-6, 0, 0], ...hand([-12, -8, -4], 18, [-14, -10, 0]) }), [0, 0.08, 0], 'outBack'),
    key(1.2, H(), undefined, 'inOut'),
  ],
};
const phDash: ClipDef = {
  name: 'dash', dur: 0.3, fadeIn: 0.03, fadeOut: 0.15,
  keys: [key(0, H({ spine: [30, 0, 0], palm: [16, 0, 0], ...hand([20, 24, 18], 8) }), [0, -0.1, 0]), key(0.3, H(), undefined, 'out')],
};
const phHit: ClipDef = {
  name: 'hit_heavy', dur: 0.5, fadeIn: 0.03, fadeOut: 0.2,
  keys: [
    key(0, H()),
    key(0.08, H({ spine: [-22, 0, 6], palm: [-14, 0, 0], ...hand([-14, -10, -6], 18, [-16, -12, 0]) }), [0, 0.06, -0.12], 'outExpo'),
    key(0.5, H(), undefined, 'inOut'),
  ],
};

export const HAND_CHAIN = ['ph_rake', 'ph_slam', 'ph_backhand'];
export const HAND_CLIPS: ClipDef[] = [phRake, phSlam, phBackhand, phCompel, phBall, phStorm, phStone, phVolley, phTear, phGallop, phChains, phRise, phDash, phHit];

// ---------------------------------------------------------------------------------------------- the arm's clips

const A = (over: Record<string, E> = {}): Record<string, E> => ({ ...ARM_IDLE, ...over });

const paSweep: ClipDef = {
  name: 'pa_sweep', dur: 0.95, fadeIn: 0.08, fadeOut: 0.3, events: { hit: 0.44, end: 0.6 },
  keys: [
    key(0, A()),
    key(0.34, A({ hips: [0, 70, 0], spine: [40, 0, 0], chest: [70, 0, 0], palm: [10, 0, 0], ...hand([10, 10, 10], 6) }), [0, 0, 0], 'inOut'),
    key(0.56, A({ hips: [0, -62, 0], spine: [44, 0, 0], chest: [74, 0, 0], palm: [10, 0, 0], ...hand([10, 10, 10], 6) }), [0, 0, 0], 'outExpo'),
    key(0.95, A(), undefined, 'inOut'),
  ],
};
const paSlam: ClipDef = {
  name: 'pa_slam', dur: 1.15, fadeIn: 0.08, fadeOut: 0.3, events: { hit: 0.56 },
  keys: [
    key(0, A()),
    key(0.4, A({ spine: [-14, 0, 0], chest: [-20, 0, 0], palm: [-20, 0, 0], ...hand([-10, -6, 0], 10) }), [0, 0.3, 0], 'out'),
    key(0.57, A({ spine: [64, 0, 0], chest: [56, 0, 0], palm: [20, 0, 0], ...FLAT }), [0, -0.3, 0], 'outExpo'),
    key(0.82, A({ spine: [62, 0, 0], chest: [54, 0, 0], palm: [18, 0, 0], ...FLAT }), [0, -0.3, 0], 'inOut'),
    key(1.15, A(), undefined, 'inOut'),
  ],
};
const paBackhand: ClipDef = {
  name: 'pa_backhand', dur: 0.9, fadeIn: 0.08, fadeOut: 0.3, events: { hit: 0.42, end: 0.56 },
  keys: [
    key(0, A()),
    key(0.32, A({ hips: [0, -66, 0], spine: [38, 0, 0], chest: [62, 0, 0], palm: [0, 30, 0] }), [0, 0, 0], 'inOut'),
    key(0.52, A({ hips: [0, 64, 0], spine: [42, 0, 0], chest: [66, 0, 0], palm: [0, -30, 0] }), [0, 0, 0], 'outExpo'),
    key(0.9, A(), undefined, 'inOut'),
  ],
};
const paCompel: ClipDef = {
  name: 'pa_compel', dur: 0.6, fadeIn: 0.08, fadeOut: 0.3, events: { fire: 0.35 },
  keys: [
    key(0, A()),
    key(0.35, A({ spine: [22, 0, 0], chest: [38, 0, 0], palm: [12, 0, 0], ...SPREAD }), [0, 0, 0], 'outBack'),
    key(0.6, A({ spine: [24, 0, 0], chest: [40, 0, 0], palm: [14, 0, 0], ...hand([-10, -6, -2], 18, [-8, -8, 0]) }), [0, 0, 0], 'inOut'),
  ],
};
const paBall: ClipDef = {
  name: 'pa_ball', dur: 0.66, fadeIn: 0.04, fadeOut: 0.3, events: { crush: 0.24 },
  keys: [
    key(0, A({ spine: [24, 0, 0], chest: [40, 0, 0], palm: [14, 0, 0], ...SPREAD })),
    key(0.24, A({ spine: [14, 0, 0], chest: [24, 0, 0], palm: [6, 0, 0], ...FIST }), [0, -0.1, 0], 'outExpo'),
    key(0.44, A({ spine: [14, 0, 0], chest: [24, 0, 0], palm: [6, 0, 0], ...FIST }), [0, -0.1, 0], 'inOut'),
    key(0.66, A(), undefined, 'inOut'),
  ],
};
const paStorm: ClipDef = {
  name: 'pa_storm', dur: 1.1, fadeIn: 0.08, fadeOut: 0.3, events: { fire: 0.6 },
  keys: [
    key(0, A()),
    key(0.5, A({ spine: [-4, 0, 0], chest: [-6, 0, 0], ...FIST }), [0, -0.2, 0], 'inOut'),
    key(0.62, A({ spine: [6, 0, 0], chest: [8, 0, 0], palm: [6, 0, 0], ...hand([-18, -14, -8], 24, [-20, -20, -10]) }), [0, 0.2, 0], 'outExpo'),
    key(1.1, A(), undefined, 'inOut'),
  ],
};
/** the fingers twitch, and stone hands climb out of the buildings */
const paWalls: ClipDef = {
  name: 'pa_walls', dur: 1.1, fadeIn: 0.08, fadeOut: 0.3, events: { rise: 0.5 },
  keys: [
    key(0, A()),
    key(0.2, A({ chest: [10, 0, 0], ...hand([20, 10, 30], 8) }), [0, 0, 0], 'out'),
    key(0.32, A({ chest: [8, 0, 0], ...hand([-6, 30, -4], 12) }), [0, 0, 0], 'out'),
    key(0.44, A({ chest: [12, 0, 0], ...hand([24, -8, 26], 6) }), [0, 0, 0], 'out'),
    key(0.56, A({ spine: [-6, 0, 0], chest: [-6, 0, 0], ...hand([-16, -12, -6], 22, [-16, -12, 0]) }), [0, 0.1, 0], 'outExpo'),
    key(1.1, A(), undefined, 'inOut'),
  ],
};
const paVolley: ClipDef = {
  name: 'pa_volley', dur: 1.3, fadeIn: 0.08, fadeOut: 0.3, events: { draw: 0.34, loose: 0.88 },
  keys: [
    key(0, A()),
    key(0.34, A({ spine: [12, 0, 0], chest: [26, 0, 0], palm: [6, 0, 0], ...hand([-6, -4, 0], 12, [-30, -20, 0]) }), [0, 0, 0], 'out'),
    key(0.84, A({ spine: [14, 0, 0], chest: [28, 0, 0], palm: [8, 0, 0], ...hand([-8, -6, 0], 13, [-40, -30, -10]) }), [0, 0, 0], 'inOut'),
    key(0.9, A({ spine: [18, 0, 0], chest: [32, 0, 0], palm: [10, 0, 0], ...hand([-4, -2, 0], 12, [30, 20, 10]) }), [0, 0, 0], 'outExpo'),
    key(1.3, A(), undefined, 'inOut'),
  ],
};
const paTear: ClipDef = {
  name: 'pa_tear', dur: 1.2, fadeIn: 0.08, fadeOut: 0.3, events: { tear: 0.78 },
  keys: [
    key(0, A()),
    key(0.45, A({ chest: [-6, 0, 0], palm: [0, 14, 0], ...hand([10, 14, 10], 4), 'f.ring.1': [-50, 0, -8], 'f.pinky.1': [-58, 0, -14] }), [0, 0, 0], 'inOut'),
    key(0.76, A({ chest: [-10, 0, 0], palm: [0, 22, 0], ...hand([30, 40, 30], 4), 'f.ring.1': [-90, 0, -12], 'f.pinky.1': [-100, 0, -20] }), [0, 0, 0], 'inOut'),
    key(0.86, A({ chest: [6, 0, 0], palm: [0, -8, 0], ...hand([-6, -4, 0], 12) }), [0, 0, 0], 'outExpo'),
    key(1.2, A(), undefined, 'inOut'),
  ],
};
/** the hand comes down, closes on a body, lifts it palm-up to the mouth that opens there, and bites three times */
const paDevour: ClipDef = {
  name: 'pa_devour', dur: 2.1, fadeIn: 0.1, fadeOut: 0.3, events: { grab: 0.46, open: 0.95, bite1: 1.15, bite2: 1.45, bite3: 1.75, drop: 1.95 },
  keys: [
    key(0, A()),
    key(0.46, A({ spine: [48, 0, 0], chest: [84, 0, 0], palm: [16, 0, 0], ...FIST }), [0, 0, 0], 'outExpo'),
    key(0.95, A({ spine: [10, 0, 0], chest: [40, 0, 0], palm: [-70, 0, 0], ...hand([40, 50, 40], 4, [30, 30, 20]) }), [0, 0, 0], 'inOut'),
    key(1.15, A({ spine: [12, 0, 0], chest: [44, 0, 0], palm: [-64, 0, 0], ...hand([50, 60, 50], 4, [30, 30, 20]) }), [0, -0.1, 0], 'out'),
    key(1.45, A({ spine: [12, 0, 0], chest: [44, 0, 0], palm: [-64, 0, 0], ...hand([50, 60, 50], 4, [30, 30, 20]) }), [0, -0.1, 0], 'inOut'),
    key(1.75, A({ spine: [12, 0, 0], chest: [44, 0, 0], palm: [-64, 0, 0], ...hand([50, 60, 50], 4, [30, 30, 20]) }), [0, -0.1, 0], 'inOut'),
    key(2.1, A(), undefined, 'inOut'),
  ],
};
const paGrow: ClipDef = {
  name: 'pa_grow', dur: 1.6, fadeIn: 0.1, fadeOut: 0.3, events: { grow: 0.6 },
  keys: [
    key(0, A()),
    key(0.4, A({ spine: [-6, 0, 4], chest: [-10, 0, -4], ...FIST }), [0, -0.3, 0], 'inOut'),
    key(0.7, A({ spine: [-12, 0, 0], chest: [-16, 0, 0], palm: [-12, 0, 0], ...hand([-22, -16, -10], 28, [-30, -24, -10]) }), [0, 0.2, 0], 'outExpo'),
    key(1.6, A(), undefined, 'inOut'),
  ],
};
const paDash: ClipDef = {
  name: 'dash', dur: 0.4, fadeIn: 0.04, fadeOut: 0.2,
  keys: [key(0, A({ spine: [24, 0, 0], chest: [20, 0, 0] }), [0, -0.3, 0]), key(0.4, A(), undefined, 'out')],
};
const paHit: ClipDef = {
  name: 'hit_heavy', dur: 0.6, fadeIn: 0.03, fadeOut: 0.25,
  keys: [
    key(0, A()),
    key(0.1, A({ spine: [-12, 0, 6], chest: [-18, 0, 0], palm: [-14, 0, 0], ...hand([-14, -10, -6], 18, [-16, -12, 0]) }), [0, 0.05, -0.2], 'outExpo'),
    key(0.6, A(), undefined, 'inOut'),
  ],
};

export const ARM_CHAIN = ['pa_sweep', 'pa_slam', 'pa_backhand'];
export const ARM_CLIPS: ClipDef[] = [paSweep, paSlam, paBackhand, paCompel, paBall, paStorm, paWalls, paVolley, paTear, paDevour, paGrow, { ...phChains, name: 'pa_chains' }, paDash, paHit];
