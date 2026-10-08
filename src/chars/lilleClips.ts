// Lille Barro's animation set. Upright and still, the rifle resting on his right shoulder; to shoot he snaps it to the
// shoulder two-handed (the left hand on the foregrip), the head down against the stock, and lets the recoil kick it
// up. Up close the rifle is a club: the stock driven forward, a shot from the hip, the barrel swept round. The long
// shots take a knee and the scope. Opening the eye is a stillness; Jilliel and the True Form have their own sets.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
/** a key: bones, and the '@' IK channels split out of the same map */
const key = (t: number, all: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => {
  const b: Record<string, E> = {}, c: Record<string, E> = {};
  for (const [k, v] of Object.entries(all)) (k.startsWith('@') ? c : b)[k] = v;
  return Object.keys(c).length ? { t, b, hips, ease, c } : { t, b, hips, ease };
};

/** composed: upright, the weight even, the free arm loose */
const IDLE: Record<string, E> = {
  hips: [0, -4, 0], spine: [-2, 2, 0], chest: [-2, 2, 0], neck: [2, 0, 0], head: [-2, -2, 0],
  'thigh.L': [-3, 0, 4], 'shin.L': [5, 0, 0], 'foot.L': [-2, 0, -4], 'thigh.R': [1, 0, -4], 'shin.R': [4, 0, 0], 'foot.R': [-2, 0, 4],
  'upperarm.L': [2, 0, 8], 'forearm.L': [-12, 0, 0], 'hand.L': [4, 0, 0],
};
const I = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });

interface Grip { p: E; dir: E; edge: E; pole: E }
const ik = (g: Grip, two = 0) => ({ '@gripR': g.p, '@dirR': g.dir, '@edgeR': g.edge, '@poleR': g.pole, '@ikR': [1, 0, 0] as E, '@twoHand': [two, 0, 0] as E });
const free = { '@ikR': [0, 0, 0] as E, '@twoHand': [0, 0, 0] as E };

/** the rifle on his right shoulder, the barrel up and back, the right hand on the grip */
const CARRY: Grip = { p: [-0.2, 0.06, 0.12], dir: [-0.08, 0.6, -0.8], edge: [0, -0.8, -0.6], pole: [-0.9, -0.4, 0.1] };
/** shouldered and aimed: level, two-handed, the scope up */
const AIM: Grip = { p: [-0.13, 0.12, 0.05], dir: [0.03, 0, 1], edge: [0, -1, 0], pole: [-0.8, -0.55, -0.15] };
/** the recoil: the muzzle kicked up, the stock back into the shoulder */
const KICK: Grip = { p: [-0.13, 0.15, 0.0], dir: [0.03, 0.2, 0.98], edge: [0, -0.98, 0.2], pole: [-0.8, -0.55, -0.15] };
/** from the hip, point-blank */
const HIP: Grip = { p: [-0.18, -0.22, 0.2], dir: [0.06, 0.06, 1], edge: [0, -1, 0.06], pole: [-0.9, -0.3, -0.3] };
/** the stock driven forward: barrel down and back, the butt up into them */
const BUTT: Grip = { p: [-0.06, 0.08, 0.4], dir: [0.05, -0.6, -0.8], edge: [0, -0.8, 0.6], pole: [-0.9, -0.3, -0.3] };
const BUTT_WIND: Grip = { p: [-0.24, -0.05, -0.02], dir: [0.1, -0.2, 0.97], edge: [0, -0.98, -0.2], pole: [-0.9, -0.3, 0.2] };

export const LILLE_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.01,
  run: { spine: [10, 0, 0], chest: [4, 0, 0], head: [-8, 0, 0], 'upperarm.L': [10, 0, 10], 'forearm.L': [-34, 0, 0] },
  sprint: { spine: [18, 0, 0], chest: [6, 0, 0], head: [-14, 0, 0], 'upperarm.L': [30, 0, 12], 'forearm.L': [-40, 0, 0] },
  swingL: 0.7,
  swingR: 0.05,
  grip: {
    idle: CARRY,
    walk: CARRY,
    run: { p: [-0.2, 0.04, 0.14], dir: [-0.05, 0.5, -0.86], edge: [0, -0.86, -0.5], pole: [-0.9, -0.4, 0.1] },
    sprint: { p: [-0.2, 0.0, 0.16], dir: [-0.05, 0.42, -0.9], edge: [0, -0.9, -0.42], pole: [-0.9, -0.4, 0.2] },
    air: CARRY,
  },
};

/** aiming: the torso square to the target, the head down to the stock */
const AIM_B: Record<string, E> = { spine: [2, 0, 0], chest: [0, 0, 0], neck: [6, 0, 0], head: [8, -6, -8], 'thigh.L': [-8, 0, 6], 'shin.L': [8, 0, 0], 'thigh.R': [4, 0, -6], 'shin.R': [6, 0, 0] };

const clip = (name: string, dur: number, events: Record<string, number>, keys: KeyDef[], o: { fadeIn?: number; fadeOut?: number } = {}): ClipDef => ({
  name, dur, fadeIn: o.fadeIn ?? 0.06, fadeOut: o.fadeOut ?? 0.18, events, keys,
});

/** one Heilig Pfeil bullet: up to the shoulder, fire, the kick */
const shot = clip('ll_shot', 0.34, { fire: 0.08, combo: 0.16 }, [
  key(0, I({ ...AIM_B, ...ik(AIM, 1) })),
  key(0.08, I({ ...AIM_B, ...ik(AIM, 1) })),
  key(0.12, I({ ...AIM_B, chest: [-3, 0, 0], ...ik(KICK, 1) }), [0, 0, -0.01], 'outExpo'),
  key(0.34, I({ ...AIM_B, ...ik(AIM, 1) }), [0, 0, 0], 'inOut'),
], { fadeIn: 0.05 });

/** the Scoped Shot: the eye to the scope, the dial turned, a long breath, the shot */
const scope = clip('ll_scope', 1.1, { dial: 0.3, fire: 0.72 }, [
  key(0, I()),
  key(0.15, I({ ...AIM_B, head: [12, -8, -10], ...ik(AIM, 1) }), [0, -0.01, 0], 'outExpo'),
  key(0.7, I({ ...AIM_B, head: [12, -8, -10], ...ik(AIM, 1) }), [0, -0.01, 0], 'inOut'),
  key(0.78, I({ ...AIM_B, head: [10, -8, -10], chest: [-5, 0, 0], ...ik(KICK, 1) }), [0, -0.01, -0.02], 'outExpo'),
  key(1.1, I(free), [0, 0, 0], 'inOut'),
]);

/** the X-Axis: quick and exact */
const xaxis = clip('ll_xaxis', 0.6, { fire: 0.24 }, [
  key(0, I()),
  key(0.14, I({ ...AIM_B, ...ik(AIM, 1) }), [0, 0, 0], 'outExpo'),
  key(0.24, I({ ...AIM_B, ...ik(AIM, 1) })),
  key(0.3, I({ ...AIM_B, chest: [-2, 0, 0], ...ik(KICK, 1) }), [0, 0, -0.01], 'outExpo'),
  key(0.6, I(free), [0, 0, 0], 'inOut'),
]);

/** Bullet Hail: the muzzle swept across them, left to right */
const sweep = (x: number): Grip => ({ p: [-0.13 + x * 0.06, 0.12, 0.05], dir: [x * 0.55, 0, 0.84], edge: [0, -1, 0], pole: [-0.8, -0.55, -0.15] });
const hail = clip('ll_hail', 0.8, { fan: 0.12 }, [
  key(0, I()),
  key(0.12, I({ ...AIM_B, chest: [0, 14, 0], ...ik(sweep(-1), 1) }), [0, 0, 0], 'outExpo'),
  key(0.5, I({ ...AIM_B, chest: [0, -14, 0], ...ik(sweep(1), 1) }), [0, 0, 0], 'linear'),
  key(0.8, I(free), [0, 0, 0], 'inOut'),
]);

/** Long Snipe: a knee down, the scope, the dial, the shot */
const KNEEL: Record<string, E> = {
  hips: [0, -4, 0], spine: [6, 0, 0], neck: [4, 0, 0], head: [12, -8, -10],
  'thigh.L': [-80, 0, 6], 'shin.L': [78, 0, 0], 'foot.L': [0, 0, 0], 'thigh.R': [-6, 0, -6], 'shin.R': [100, 0, 0], 'foot.R': [-20, 0, 0],
};
const kneel = clip('ll_kneel', 1.6, { dial: 0.55, fire: 1.2 }, [
  key(0, I()),
  key(0.35, I({ ...KNEEL, ...ik(AIM, 1) }), [0, -0.36, -0.06], 'inOut'),
  key(1.18, I({ ...KNEEL, ...ik(AIM, 1) }), [0, -0.36, -0.06], 'inOut'),
  key(1.26, I({ ...KNEEL, chest: [-5, 0, 0], ...ik(KICK, 1) }), [0, -0.36, -0.08], 'outExpo'),
  key(1.6, I(free), [0, 0, 0], 'inOut'),
]);

/** the stock string: the butt driven up into them */
const butt = clip('ll_butt', 0.46, { hit: 0.18, combo: 0.28 }, [
  key(0, I({ ...ik(BUTT_WIND, 1) })),
  key(0.08, I({ spine: [-4, 14, 0], chest: [-2, 14, 0], ...ik(BUTT_WIND, 1) }), [0, 0, -0.02], 'out'),
  key(0.18, I({ spine: [8, -10, 0], chest: [6, -12, 0], 'thigh.L': [-22, 0, 4], 'shin.L': [14, 0, 0], ...ik(BUTT, 1) }), [0, -0.02, 0.1], 'outExpo'),
  key(0.46, I(free), [0, 0, 0], 'inOut'),
]);
/** a shot from the hip, point-blank */
const hip = clip('ll_hip', 0.42, { fire: 0.14, combo: 0.24 }, [
  key(0, I({ ...ik(HIP, 1) })),
  key(0.12, I({ spine: [4, -8, 0], 'thigh.L': [-14, 0, 4], 'shin.L': [10, 0, 0], ...ik(HIP, 1) }), [0, -0.03, 0.06], 'outExpo'),
  key(0.18, I({ spine: [0, -8, 0], ...ik({ ...HIP, dir: [0.06, 0.3, 0.95], p: [-0.18, -0.2, 0.15] }, 1) }), [0, -0.03, 0.03], 'outExpo'),
  key(0.42, I(free), [0, 0, 0], 'inOut'),
]);
/** the barrel swept round, the fins leading */
const swing = (x: number, z: number): Grip => ({ p: [-0.12 + x * 0.12, -0.02, 0.2 + z * 0.1], dir: [x, 0.05, z], edge: [0, -1, 0], pole: [-0.9, -0.3, -0.3] });
const fin = clip('ll_fin', 0.62, { hit: 0.3, combo: 0.4 }, [
  key(0, I({ ...ik(swing(-0.8, 0.6), 1) })),
  key(0.14, I({ spine: [-4, 28, 0], chest: [-2, 24, 0], ...ik(swing(-0.95, -0.3), 1) }), [0, 0, -0.02], 'out'),
  key(0.3, I({ spine: [6, -26, 0], chest: [4, -26, 0], 'thigh.L': [-20, 0, 6], 'shin.L': [12, 0, 0], ...ik(swing(0.9, 0.45), 1) }), [0, -0.03, 0.08], 'outExpo'),
  key(0.62, I(free), [0, 0, 0], 'inOut'),
]);

/** the left eye opens: a stillness, the chin up a touch */
const eye = clip('ll_eye', 0.45, { open: 0.14 }, [
  key(0, I()),
  key(0.14, I({ chest: [-4, 0, 0], neck: [-4, 0, 0], head: [-8, 4, 0] }), [0, 0.01, 0], 'outExpo'),
  key(0.45, I(), [0, 0, 0], 'inOut'),
]);
/** the beacon: the rifle lowered, the reiatsu let out */
const flare = clip('ll_flare', 0.6, { burst: 0.2 }, [
  key(0, I()),
  key(0.2, I({ chest: [-8, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-10, 0, 40], 'forearm.L': [-20, 0, 0] }), [0, 0.02, 0], 'outExpo'),
  key(0.6, I(), [0, 0, 0], 'inOut'),
]);
/** Reflexes: a leap straight up and clear */
const leap = clip('ll_leap', 0.5, { jump: 0.06 }, [
  key(0, I({ 'thigh.L': [-30, 0, 4], 'shin.L': [50, 0, 0], 'thigh.R': [-26, 0, -4], 'shin.R': [46, 0, 0] }), [0, -0.12, 0]),
  key(0.12, I({ 'thigh.L': [-50, 0, 6], 'shin.L': [80, 0, 0], 'thigh.R': [-20, 0, -6], 'shin.R': [70, 0, 0], spine: [-6, 0, 0] }), [0, 0, 0], 'outExpo'),
  key(0.5, I(), [0, 0, 0], 'inOut'),
]);
/** Jilliel comes: arms out, the head thrown back, the rifle let go */
const release = clip('ll_release', 1.2, { zeichen: 0.3, burst: 0.7 }, [
  key(0, I()),
  key(0.3, I({ chest: [-6, 0, 0], head: [-6, 0, 0], 'upperarm.L': [-10, 0, 30] }), [0, 0.01, 0], 'inOut'),
  key(0.7, I({ spine: [-8, 0, 0], chest: [-12, 0, 0], neck: [-8, 0, 0], head: [-18, 0, 0], 'upperarm.L': [-20, 0, 70], 'forearm.L': [-6, 0, 0], 'upperarm.R': [-20, 0, -70], 'forearm.R': [-6, 0, 0] }), [0, 0.04, 0], 'outExpo'),
  key(1.2, I({ spine: [-4, 0, 0], head: [-8, 0, 0], 'upperarm.L': [-10, 0, 40], 'upperarm.R': [-10, 0, -40] }), [0, 0.03, 0], 'inOut'),
]);

const SHARED = ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name));

/** Jilliel: still as a statue under the robe, the wings doing the work */
export const JILLIEL_STANCE: StanceDef = {
  idle: { neck: [2, 0, 0], head: [-2, 0, 0] },
  idleHips: 0,
  run: { spine: [6, 0, 0], head: [-6, 0, 0] },
  sprint: { spine: [10, 0, 0], head: [-10, 0, 0] },
  swingL: 0,
  swingR: 0,
  freqScale: 0.75,
};
/** the True Form: the long neck swaying forward, the arms hanging long */
export const TRUE_STANCE: StanceDef = {
  idle: { spine: [4, 0, 0], neck: [20, 0, 0], neck2: [-4, 0, 0], neck3: [-14, 0, 0], head: [-6, 0, 0], 'upperarm.L': [-34, 0, 34], 'upperarm.R': [-34, 0, -34], 'forearm.L': [-56, 0, 0], 'forearm.R': [-56, 0, 0] },
  idleHips: 0,
  run: { spine: [10, 0, 0], neck: [16, 0, 0], head: [-10, 0, 0] },
  sprint: { spine: [14, 0, 0], neck: [20, 0, 0], head: [-14, 0, 0] },
  swingL: 0.4,
  swingR: 0.4,
  freqScale: 0.55,
  speedScale: 2.4,
};
/** the remnant birds: a bob of the long neck */
export const REMNANT_STANCE: StanceDef = {
  idle: { chest: [8, 0, 0], neck: [6, 0, 0], head: [-10, 0, 0], 'upperarm.L': [0, 0, 10], 'upperarm.R': [0, 0, -10] },
  run: { chest: [16, 0, 0], neck: [14, 0, 0], head: [-18, 0, 0] },
  sprint: { chest: [22, 0, 0], neck: [18, 0, 0], head: [-22, 0, 0] },
  swingL: 0.5,
  swingR: 0.5,
  freqScale: 1.3,
};

/** the bullet string and the stock string (up close) */
export const LILLE_SHOTS = ['ll_shot'];
export const LILLE_STOCK = ['ll_butt', 'll_hip', 'll_fin'];
export const LILLE_CLIPS: ClipDef[] = [shot, scope, xaxis, hail, kneel, butt, hip, fin, eye, flare, leap, release, ...SHARED];

// ---------------------------------------------------------------------------------------------- Jilliel

/** the wings: four a side; +Y folds a left wing back (−Y a right one), +Z raises a left one (−Z a right one) */
const wings = (spread: number, raise = 0, tremble = 0): Record<string, E> => {
  const o: Record<string, E> = {};
  for (let i = 1; i <= 4; i++) {
    const t = tremble * (i % 2 === 0 ? 1 : -1);
    o[`wing.L${i}`] = [t, -spread, raise];
    o[`wing.R${i}`] = [t, spread, -raise];
  }
  return o;
};
const J_IDLE: Record<string, E> = { neck: [2, 0, 0], head: [-2, 0, 0] };
const J = (over: Record<string, E> = {}): Record<string, E> => ({ ...J_IDLE, ...over });

/** a press of wing shots: the wings twitch as the holes fire */
const jlWing = clip('jl_wing', 0.32, { fire: 0.08, combo: 0.14 }, [
  key(0, J(wings(0))),
  key(0.08, J(wings(-8, 4, 3)), [0, 0, 0], 'outExpo'),
  key(0.32, J(wings(0)), [0, 0, 0], 'inOut'),
]);
/** the Six-Hole Blast: the wings spread forward round him, the holes glowing, then the blast */
const jlSix = clip('jl_six', 1.15, { charge: 0.1, fire: 0.72 }, [
  key(0, J(wings(0))),
  key(0.5, J({ head: [6, 0, 0], ...wings(-24, 8) }), [0, 0.02, 0], 'inOut'),
  key(0.72, J({ head: [8, 0, 0], ...wings(-30, 10, 4) }), [0, 0.02, -0.04], 'outExpo'),
  key(1.15, J(wings(0)), [0, 0, 0], 'inOut'),
]);
/** the 24-barrel barrage: every wing flung wide and shaking with the shots */
const jlBarrage = clip('jl_barrage', 1.5, { fire: 0.22 }, [
  key(0, J(wings(0))),
  key(0.22, J({ head: [-6, 0, 0], ...wings(-34, 14, 6) }), [0, 0.04, 0], 'outExpo'),
  key(0.6, J({ head: [-6, 0, 0], ...wings(-30, 12, -6) }), [0, 0.04, 0], 'inOut'),
  key(1.0, J({ head: [-6, 0, 0], ...wings(-34, 14, 6) }), [0, 0.04, 0], 'inOut'),
  key(1.5, J(wings(0)), [0, 0, 0], 'inOut'),
]);
/** Divine Pressure: the head lifted, the wings thrown up */
const jlPressure = clip('jl_pressure', 0.85, { burst: 0.3 }, [
  key(0, J(wings(0))),
  key(0.3, J({ neck: [-8, 0, 0], head: [-14, 0, 0], ...wings(-10, 34) }), [0, 0.06, 0], 'outExpo'),
  key(0.85, J(wings(0)), [0, 0, 0], 'inOut'),
]);
/** the Teleport-Snipe: a lean in, point-blank */
const jlSnipe = clip('jl_snipe', 0.62, { fire: 0.26 }, [
  key(0, J(wings(0))),
  key(0.22, J({ spine: [10, 0, 0], head: [6, 0, 0], ...wings(-18, 0) }), [0, 0, 0.06], 'outExpo'),
  key(0.62, J(wings(0)), [0, 0, 0], 'inOut'),
]);
/** Descent: up, then down onto the stilt points */
const jlDescent = clip('jl_descent', 1.0, { land: 0.55 }, [
  key(0, J(wings(0))),
  key(0.35, J({ ...wings(-6, 30) }), [0, 0.9, 0], 'out'),
  key(0.55, J({ spine: [8, 0, 0], ...wings(10, -10) }), [0, -0.25, 0], 'inExpo'),
  key(1.0, J(wings(0)), [0, 0, 0], 'inOut'),
]);
/** Judgement of God: every wing opened forward toward one point, held */
const jlJudge = clip('jl_judge', 2.3, { aim: 0.25 }, [
  key(0, J(wings(0))),
  key(0.25, J({ head: [-10, 0, 0], ...wings(-40, 18) }), [0, 0.08, 0], 'outExpo'),
  key(1.9, J({ head: [-12, 0, 0], ...wings(-44, 22, 4) }), [0, 0.1, 0], 'inOut'),
  key(2.3, J(wings(0)), [0, 0, 0], 'inOut'),
]);

// ---------------------------------------------------------------------------------------------- the True Form

const T_IDLE: Record<string, E> = { spine: [4, 0, 0], neck: [20, 0, 0], neck2: [-4, 0, 0], neck3: [-14, 0, 0], head: [-6, 0, 0], 'upperarm.L': [-34, 0, 34], 'upperarm.R': [-34, 0, -34], 'forearm.L': [-56, 0, 0], 'forearm.R': [-56, 0, 0] };
const T = (over: Record<string, E> = {}): Record<string, E> => ({ ...T_IDLE, ...over });

/** a long arm swept across in front of him */
const tfSlash = (name: string, side: 'L' | 'R'): ClipDef => {
  const k = side === 'L' ? 1 : -1;
  return clip(name, 0.56, { hit: 0.26, combo: 0.36 }, [
    key(0, T()),
    key(0.14, T({ chest: [0, k * 26, 0], [`upperarm.${side}`]: [-60, 0, k * 80], [`forearm.${side}`]: [-20, 0, 0] }), [0, 0, 0], 'out'),
    key(0.26, T({ chest: [0, -k * 26, 0], [`upperarm.${side}`]: [-84, 0, -k * 30], [`forearm.${side}`]: [-8, 0, 0] }), [0, 0, 0.1], 'outExpo'),
    key(0.56, T(), [0, 0, 0], 'inOut'),
  ]);
};
/** golden finger beams: the right arm pointed straight at them */
const tfBeam = clip('tf_beam', 0.42, { fire: 0.14, combo: 0.22 }, [
  key(0, T()),
  key(0.12, T({ 'upperarm.R': [-88, 0, -6], 'forearm.R': [0, 0, 0], neck3: [-6, 0, 0] }), [0, 0, 0], 'outExpo'),
  key(0.42, T(), [0, 0, 0], 'inOut'),
]);
/** Sabaki no Kōmyō: the arm raised high, chopped down */
const tfSabaki = clip('tf_sabaki', 1.1, { raise: 0.1, chop: 0.56 }, [
  key(0, T()),
  key(0.42, T({ spine: [-8, 0, 0], 'upperarm.R': [-170, 0, -8], 'forearm.R': [-6, 0, 0], neck: [10, 0, 0] }), [0, 0.05, 0], 'inOut'),
  key(0.56, T({ spine: [14, 0, 0], 'upperarm.R': [-70, 0, 6], 'forearm.R': [-4, 0, 0] }), [0, -0.05, 0.1], 'outExpo'),
  key(1.1, T(), [0, 0, 0], 'inOut'),
]);
/** the golden volley: both arms out, every finger fired */
const tfVolley = clip('tf_volley', 0.9, { fire: 0.34 }, [
  key(0, T()),
  key(0.3, T({ 'upperarm.L': [-90, 0, 18], 'forearm.L': [0, 0, 0], 'upperarm.R': [-90, 0, -18], 'forearm.R': [0, 0, 0] }), [0, 0, 0], 'outExpo'),
  key(0.9, T(), [0, 0, 0], 'inOut'),
]);
/** the light ball: a hand raised, the sphere off the fingertips */
const tfBall = clip('tf_ball', 0.9, { ball: 0.4 }, [
  key(0, T()),
  key(0.4, T({ 'upperarm.R': [-150, 0, -20], 'forearm.R': [-10, 0, 0], neck: [6, 0, 0] }), [0, 0.04, 0], 'outExpo'),
  key(0.9, T(), [0, 0, 0], 'inOut'),
]);
/** Grow Arms: the arms flung wide, the new pair coming out */
const tfArms = clip('tf_arms', 0.9, { grow: 0.4 }, [
  key(0, T()),
  key(0.4, T({ chest: [-8, 0, 0], 'upperarm.L': [-20, 0, 90], 'forearm.L': [0, 0, 0], 'upperarm.R': [-20, 0, -90], 'forearm.R': [0, 0, 0] }), [0, 0.05, 0], 'outExpo'),
  key(0.9, T(), [0, 0, 0], 'inOut'),
]);
/** Owl Eyes: the neck stretched up, the head turned all the way round and back */
const tfOwl = clip('tf_owl', 0.9, { look: 0.2 }, [
  key(0, T()),
  key(0.3, T({ neck: [0, 0, 0], neck2: [-6, 0, 0], neck3: [-6, 0, 0], head: [0, 160, 0] }), [0, 0.1, 0], 'inOut'),
  key(0.6, T({ neck: [0, 0, 0], neck2: [-6, 0, 0], neck3: [-6, 0, 0], head: [0, -160, 0] }), [0, 0.1, 0], 'inOut'),
  key(0.9, T(), [0, 0, 0], 'inOut'),
]);
/** Trompete: the fist to the beak, the head thrown up — then he blows */
const tfTrompete = clip('tf_trompete', 2.3, { draw: 0.1, blow: 1.7 }, [
  key(0, T()),
  key(0.5, T({ neck: [6, 0, 0], neck3: [-20, 0, 0], head: [-20, 0, 0], 'upperarm.R': [-120, 0, -36], 'forearm.R': [-120, 0, 0], 'upperarm.L': [-20, 0, 60] }), [0, 0.04, 0], 'inOut'),
  key(1.7, T({ neck: [6, 0, 0], neck3: [-24, 0, 0], head: [-24, 0, 0], 'upperarm.R': [-124, 0, -36], 'forearm.R': [-124, 0, 0], 'upperarm.L': [-26, 0, 70] }), [0, 0.04, 0], 'inOut'),
  key(1.85, T({ chest: [-10, 0, 0], neck3: [-30, 0, 0], head: [-30, 0, 0], 'upperarm.R': [-124, 0, -36], 'forearm.R': [-124, 0, 0], 'upperarm.L': [-30, 0, 80] }), [0, 0.06, -0.08], 'outExpo'),
  key(2.3, T(), [0, 0, 0], 'inOut'),
]);
/** the rebirth: slumped headless, then the new neck and head rising out of it */
const tfRise = clip('tf_rise', 1.6, { rise: 0.8 }, [
  key(0, T({ spine: [30, 0, 0], neck: [60, 0, 0], neck2: [30, 0, 0], neck3: [20, 0, 0], 'upperarm.L': [0, 0, 10], 'upperarm.R': [0, 0, -10], 'forearm.L': [0, 0, 0], 'forearm.R': [0, 0, 0] }), [0, -0.3, 0]),
  key(0.8, T({ spine: [-6, 0, 0], neck: [-10, 0, 0], neck2: [-10, 0, 0], neck3: [-20, 0, 0], head: [-20, 0, 0], 'upperarm.L': [-30, 0, 80], 'upperarm.R': [-30, 0, -80] }), [0, 0.1, 0], 'outExpo'),
  key(1.6, T(), [0, 0, 0], 'inOut'),
]);

// ---------------------------------------------------------------------------------------------- the remnants

const R_IDLE: Record<string, E> = { chest: [8, 0, 0], neck: [6, 0, 0], head: [-10, 0, 0], 'upperarm.L': [0, 0, 10], 'upperarm.R': [0, 0, -10] };
const R = (over: Record<string, E> = {}): Record<string, E> => ({ ...R_IDLE, ...over });
/** a peck */
const rmPeck = clip('rm_peck', 0.42, { hit: 0.2, combo: 0.3 }, [
  key(0, R()),
  key(0.1, R({ neck: [-20, 0, 0], head: [-20, 0, 0] }), [0, 0, -0.04], 'out'),
  key(0.2, R({ chest: [20, 0, 0], neck: [40, 0, 0], head: [10, 0, 0] }), [0, 0, 0.08], 'outExpo'),
  key(0.42, R(), [0, 0, 0], 'inOut'),
]);
/** a blast gathering in front of the beak */
const rmCharge = clip('rm_charge', 0.9, { charge: 0.1, fire: 0.62 }, [
  key(0, R()),
  key(0.5, R({ neck: [24, 0, 0], head: [-6, 0, 0], 'upperarm.L': [0, 0, 50], 'upperarm.R': [0, 0, -50] }), [0, -0.04, 0], 'inOut'),
  key(0.66, R({ neck: [30, 0, 0], head: [-14, 0, 0], 'upperarm.L': [0, 0, 60], 'upperarm.R': [0, 0, -60] }), [0, -0.04, -0.04], 'outExpo'),
  key(0.9, R(), [0, 0, 0], 'inOut'),
]);
/** the head spun round, firing in several directions */
const rmSpin = clip('rm_spin', 1.0, { a: 0.2, b: 0.45, c: 0.7 }, [
  key(0, R()),
  key(0.33, R({ head: [-10, 120, 0] }), [0, 0, 0], 'linear'),
  key(0.66, R({ head: [-10, 240, 0] }), [0, 0, 0], 'linear'),
  key(1.0, R({ head: [-10, 360, 0] }), [0, 0, 0], 'linear'),
]);

// the release ends on the new body: the rest of it plays as the god's first pulse
export const JILLIEL_CLIPS: ClipDef[] = [jlWing, jlSix, jlBarrage, jlPressure, jlSnipe, jlDescent, jlJudge, { ...jlPressure, name: 'll_release' }, ...SHARED];
export const TRUE_CLIPS: ClipDef[] = [tfSlash('tf_slash1', 'R'), tfSlash('tf_slash2', 'L'), tfBeam, tfSabaki, tfVolley, tfBall, tfArms, tfOwl, tfTrompete, tfRise, ...SHARED];
export const TRUE_CHAIN = ['tf_slash1', 'tf_slash2'];
export const REMNANT_CLIPS: ClipDef[] = [rmPeck, rmCharge, rmSpin, ...SHARED];
