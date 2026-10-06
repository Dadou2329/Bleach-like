// Grimmjow's animation set. Sealed: a slouched, hands-in-pockets street brawler — jab, hook, spinning
// back-kick, rising knee, axe-kick stomp, lunging nukite, palm Cero, the Gran Rey Cero ritual (draw,
// palm dragged along the blade, aim the bleeding hand) and "Kishire, Pantera". Pantera: a crouched
// feral stance, claw rakes, spinning heel kick, tail lash, pounce, Garra de la Pantera, the roar and
// Desgarrón. Events: 'step' lunge, 'hit' strike frame, 'combo' next input, plus per-move fx events.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

export const GRIMMJOW_STANCE: StanceDef = {
  idle: {
    hips: [0, -12, 0], spine: [5, 4, 0], chest: [2, 8, 0], neck: [-3, 0, 0], head: [-2, -8, 7],
    'thigh.L': [-8, 0, 7], 'shin.L': [8, 0, 0], 'foot.L': [0, 0, -3],
    'thigh.R': [6, 0, -9], 'shin.R': [12, 0, 0], 'foot.R': [-6, 0, 3],
    // hands jammed in the hakama pockets
    'upperarm.L': [14, 0, 13], 'forearm.L': [-30, -14, 0], 'hand.L': [12, 0, 0],
    'upperarm.R': [14, 0, -13], 'forearm.R': [-30, 14, 0], 'hand.R': [12, 0, 0],
  },
  idleHips: -0.02,
  run: { chest: [8, 0, 0], 'upperarm.L': [-6, 0, 8], 'upperarm.R': [-6, 0, -8], 'forearm.L': [-50, 0, 0], 'forearm.R': [-50, 0, 0] },
  sprint: { spine: [14, 0, 0], chest: [10, 0, 0], head: [-14, 0, 0], 'upperarm.L': [40, 0, 14], 'forearm.L': [-20, 0, 0], 'upperarm.R': [40, 0, -14], 'forearm.R': [-20, 0, 0] },
  swingL: 1,
  swingR: 1,
};

export const PANTERA_STANCE: StanceDef = {
  idle: {
    hips: [12, 0, 0], spine: [14, 0, 0], chest: [8, 0, 0], neck: [-12, 0, 0], head: [-12, 0, 0],
    'thigh.L': [-34, 0, 10], 'shin.L': [48, 0, 0], 'foot.L': [-14, 0, 0],
    'thigh.R': [-6, 0, -10], 'shin.R': [36, 0, 0], 'foot.R': [-24, 0, 0],
    'upperarm.L': [-36, 0, 24], 'forearm.L': [-50, 0, 0], 'hand.L': [-14, 0, 0],
    'upperarm.R': [-22, 0, -26], 'forearm.R': [-60, 0, 0], 'hand.R': [-14, 0, 0],
  },
  idleHips: -0.17,
  run: { spine: [24, 0, 0], chest: [12, 0, 0], neck: [-18, 0, 0], 'upperarm.L': [-20, 0, 14], 'upperarm.R': [-20, 0, -14] },
  sprint: { spine: [36, 0, 0], chest: [16, 0, 0], neck: [-26, 0, 0], head: [-14, 0, 0], 'upperarm.L': [44, 0, 16], 'forearm.L': [-30, 0, 0], 'upperarm.R': [44, 0, -16], 'forearm.R': [-30, 0, 0] },
  swingL: 1.25,
  swingR: 1.25,
  freqScale: 1.1,
};

// guard: fists up, left lead
const GUARD: Record<string, E> = {
  chest: [4, -10, 0], spine: [4, -6, 0], head: [6, 12, 0],
  'upperarm.L': [-38, 0, 8], 'forearm.L': [-104, 0, 0], 'hand.L': [0, 0, 0],
  'upperarm.R': [-30, 0, -12], 'forearm.R': [-118, 0, 0], 'hand.R': [0, 0, 0],
};
const g = (over: Record<string, E> = {}): Record<string, E> => ({ ...GUARD, ...over });

// ------------------------------------------------------------------ sealed chain
const jab: ClipDef = {
  name: 'gj_jab', dur: 0.4, fadeIn: 0.05, fadeOut: 0.18, events: { step: 0.05, hit: 0.13, combo: 0.19 },
  keys: [
    key(0, g()),
    key(0.07, g({ chest: [2, -2, 0], 'upperarm.L': [-48, 0, 14], 'forearm.L': [-112, 0, 0] }), [0, -0.01, 0], 'out'),
    key(0.13, g({ chest: [6, -26, 0], spine: [4, -10, 0], head: [2, 18, 0], 'upperarm.L': [-90, 0, -6], 'forearm.L': [-4, 0, 0] }), [0, -0.03, 0.08], 'outExpo'),
    key(0.4, g(), [0, -0.02, 0], 'inOut'),
  ],
};

const hook: ClipDef = {
  name: 'gj_hook', dur: 0.5, fadeIn: 0.04, fadeOut: 0.2, events: { step: 0.1, hit: 0.2, combo: 0.27 },
  keys: [
    key(0, g()),
    key(0.1, g({ chest: [2, -26, 0], spine: [2, -12, 0], 'upperarm.R': [-40, 0, -64], 'forearm.R': [-96, 0, 0] }), [0, -0.03, -0.02], 'out'),
    key(0.2, g({ chest: [8, 38, 0], spine: [6, 16, 0], head: [4, -16, 0], 'upperarm.R': [-34, 0, -78], 'forearm.R': [-92, 0, 0], 'upperarm.L': [-20, 0, 14], 'forearm.L': [-120, 0, 0] }), [0, -0.05, 0.08], 'outExpo'),
    key(0.5, g(), [0, -0.02, 0], 'inOut'),
  ],
};

const spinKick: ClipDef = {
  name: 'gj_spinkick', dur: 0.72, fadeIn: 0.04, fadeOut: 0.18, events: { step: 0.16, hit: 0.33, combo: 0.44 },
  keys: [
    key(0, g({ hips: [0, 0, 0] })),
    key(0.14, g({ hips: [0, -95, 0], spine: [8, -10, 0], 'thigh.R': [10, 0, 0], 'shin.R': [50, 0, 0] }), [0, -0.05, 0], 'in'),
    key(0.33, g({ hips: [0, -190, 0], spine: [26, 0, 6], chest: [14, 0, 0], head: [-20, -50, 0], 'thigh.R': [78, 0, -6], 'shin.R': [6, 0, 0], 'foot.R': [-30, 0, 0], 'thigh.L': [-14, 0, 6], 'shin.L': [26, 0, 0], 'upperarm.L': [-40, 0, 60], 'upperarm.R': [-40, 0, -60] }), [0, 0.02, 0], 'outExpo'),
    key(0.56, g({ hips: [0, -300, 0], spine: [8, -6, 0], 'thigh.R': [10, 0, 0], 'shin.R': [40, 0, 0] }), [0, -0.03, 0], 'inOut'),
    key(0.72, g({ hips: [0, -360, 0] }), [0, -0.02, 0], 'out'),
  ],
};

const knee: ClipDef = {
  name: 'gj_knee', dur: 0.6, fadeIn: 0.04, fadeOut: 0.2, events: { step: 0.12, hit: 0.24, combo: 0.34 },
  keys: [
    key(0, g()),
    key(0.12, g({ 'thigh.R': [12, 0, 0], 'shin.R': [44, 0, 0], 'upperarm.L': [-70, 0, -10], 'forearm.L': [-40, 0, 0], 'upperarm.R': [-70, 0, 10], 'forearm.R': [-40, 0, 0] }), [0, -0.07, 0.02], 'out'),
    key(0.24, g({ spine: [-6, 0, 0], chest: [-8, 0, 0], head: [12, 0, 0], 'thigh.R': [-118, 0, 0], 'shin.R': [128, 0, 0], 'foot.R': [20, 0, 0], 'thigh.L': [6, 0, 4], 'upperarm.L': [-48, 0, 22], 'forearm.L': [-28, 0, 0], 'upperarm.R': [-48, 0, -22], 'forearm.R': [-28, 0, 0] }), [0, 0.12, 0.1], 'outExpo'),
    key(0.6, g(), [0, -0.02, 0], 'inOut'),
  ],
};

const stomp: ClipDef = {
  name: 'gj_stomp', dur: 0.82, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.22, hit: 0.38 },
  keys: [
    key(0, g()),
    key(0.22, g({ spine: [-12, 0, 0], chest: [-6, 0, 0], head: [16, 0, 0], 'thigh.R': [-150, 0, -4], 'shin.R': [6, 0, 0], 'foot.R': [-20, 0, 0], 'thigh.L': [4, 0, 6], 'shin.L': [8, 0, 0], 'upperarm.L': [-10, 0, 70], 'forearm.L': [-20, 0, 0], 'upperarm.R': [-10, 0, -70], 'forearm.R': [-20, 0, 0] }), [0, 0.06, -0.04], 'out'),
    key(0.38, g({ spine: [22, 0, 0], chest: [10, 0, 0], head: [10, 0, 0], 'thigh.R': [-24, 0, 0], 'shin.R': [12, 0, 0], 'foot.R': [-6, 0, 0], 'thigh.L': [30, 0, 6], 'shin.L': [40, 0, 0], 'upperarm.L': [10, 0, 40], 'upperarm.R': [10, 0, -40] }), [0, -0.14, 0.18], 'inExpo'),
    key(0.82, g(), [0, -0.02, 0], 'inOut'),
  ],
};

// heavy: lunging spear-hand through the guard
const nukite: ClipDef = {
  name: 'gj_nukite', dur: 0.78, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.2, hit: 0.3 },
  keys: [
    key(0, g()),
    key(0.18, g({ chest: [0, -30, 0], spine: [4, -14, 0], 'upperarm.R': [30, 0, -16], 'forearm.R': [-96, 0, 0], 'hand.R': [0, 0, 0], 'upperarm.L': [-60, 0, 20], 'forearm.L': [-70, 0, 0] }), [0, -0.08, -0.06], 'out'),
    key(0.3, g({ chest: [10, 32, 0], spine: [10, 14, 0], head: [4, -20, 0], 'upperarm.R': [-90, 0, 4], 'forearm.R': [-2, 0, 0], 'hand.R': [0, 0, 0], 'upperarm.L': [20, 0, 20], 'forearm.L': [-60, 0, 0], 'thigh.L': [-56, 0, 6], 'shin.L': [62, 0, 0], 'thigh.R': [34, 0, -6], 'shin.R': [24, 0, 0] }), [0, -0.12, 0.26], 'outExpo'),
    key(0.55, g({ chest: [8, 26, 0], 'upperarm.R': [-86, 0, 4], 'forearm.R': [-6, 0, 0] }), [0, -0.1, 0.2], 'inOut'),
    key(0.78, g(), [0, -0.02, 0], 'inOut'),
  ],
};

// palm Cero from the right hand
const cero: ClipDef = {
  name: 'gj_cero', dur: 1.0, fadeIn: 0.06, fadeOut: 0.22, events: { charge: 0.12, fire: 0.42 },
  keys: [
    key(0, g()),
    key(0.16, g({ chest: [2, 24, 0], spine: [2, 10, 0], head: [2, -18, 0], 'upperarm.R': [-90, 0, 6], 'forearm.R': [-6, 0, 0], 'hand.R': [-62, 0, 0], 'upperarm.L': [-10, 0, 20], 'forearm.L': [-40, 0, 0] }), [0, -0.04, 0], 'out'),
    key(0.42, g({ chest: [0, 22, 0], spine: [0, 8, 0], head: [2, -16, 0], 'upperarm.R': [-92, 0, 4], 'forearm.R': [-4, 0, 0], 'hand.R': [-70, 0, 0], 'upperarm.L': [-10, 0, 20], 'forearm.L': [-40, 0, 0] }), [0, -0.05, -0.02], 'inOut'),
    key(0.5, g({ chest: [-4, 18, 0], 'upperarm.R': [-100, 0, 4], 'forearm.R': [-8, 0, 0], 'hand.R': [-60, 0, 0] }), [0, -0.04, -0.06], 'outExpo'),
    key(1.0, g(), [0, -0.02, 0], 'inOut'),
  ],
};

// Gran Rey Cero: draw, drag the left palm along the blade, aim the bleeding hand, fire
const granRey: ClipDef = {
  name: 'gj_granrey', dur: 2.7, fadeIn: 0.08, fadeOut: 0.3, events: { draw: 0.22, cut: 0.6, charge: 0.9, fire: 1.35, sheathe: 2.45 },
  keys: [
    key(0, g()),
    key(0.22, { chest: [6, 30, 0], spine: [4, 12, 0], head: [6, -10, 0], 'upperarm.R': [-34, 0, 46], 'forearm.R': [-70, 0, 0], 'hand.R': [0, 0, 0], 'upperarm.L': [10, 0, 10], 'forearm.L': [-40, 0, 0] }, [0, -0.04, 0], 'out'),
    key(0.42, { chest: [2, -4, 0], spine: [2, -2, 0], head: [10, 0, 0], 'upperarm.R': [-36, 0, -2], 'forearm.R': [-62, 0, 0], 'hand.R': [0, 0, 20], 'upperarm.L': [-50, 0, -16], 'forearm.L': [-80, 0, 0], 'hand.L': [0, 0, 0] }, [0, -0.04, 0], 'inOut'),
    key(0.68, { chest: [2, -8, 0], head: [14, -8, 0], 'upperarm.R': [-36, 0, -2], 'forearm.R': [-62, 0, 0], 'upperarm.L': [-74, 0, -24], 'forearm.L': [-20, 0, 0], 'hand.L': [0, 0, 0] }, [0, -0.04, 0], 'inOut'),
    key(0.95, { chest: [0, 26, 0], spine: [0, 12, 0], head: [0, -20, 0], 'upperarm.L': [-90, 0, -4], 'forearm.L': [-4, 0, 0], 'hand.L': [-66, 0, 0], 'upperarm.R': [16, 0, -20], 'forearm.R': [-20, 0, 0] }, [0, -0.08, -0.04], 'out'),
    key(2.35, { chest: [-2, 26, 0], spine: [0, 12, 0], head: [0, -20, 0], 'upperarm.L': [-92, 0, -4], 'forearm.L': [-4, 0, 0], 'hand.L': [-70, 0, 0], 'upperarm.R': [16, 0, -20], 'forearm.R': [-20, 0, 0] }, [0, -0.09, -0.07], 'inOut'),
    key(2.7, g(), [0, -0.02, 0], 'inOut'),
  ],
};

// "Kishire, Pantera": sword low in the right hand, the left hand rakes its fingers along the blade
const release: ClipDef = {
  name: 'gj_release', dur: 1.7, fadeIn: 0.1, fadeOut: 0.35, events: { draw: 0.18, rake: 0.62, burst: 1.0 },
  keys: [
    key(0, g()),
    key(0.18, { chest: [6, 30, 0], spine: [4, 12, 0], 'upperarm.R': [-34, 0, 46], 'forearm.R': [-70, 0, 0], 'upperarm.L': [10, 0, 10], 'forearm.L': [-40, 0, 0] }, [0, -0.04, 0], 'out'),
    key(0.45, { chest: [10, -6, 0], spine: [6, -4, 0], head: [22, 0, 0], 'upperarm.R': [-20, 0, -6], 'forearm.R': [-40, 0, 0], 'hand.R': [30, 0, 0], 'upperarm.L': [-40, 0, -30], 'forearm.L': [-70, 0, 0], 'hand.L': [-20, 0, 0] }, [0, -0.08, 0], 'inOut'),
    key(0.95, { chest: [12, -10, 0], spine: [8, -6, 0], head: [26, 6, 0], 'upperarm.R': [-20, 0, -6], 'forearm.R': [-40, 0, 0], 'hand.R': [30, 0, 0], 'upperarm.L': [-60, 0, -4], 'forearm.L': [-8, 0, 0], 'hand.L': [-30, 0, 0] }, [0, -0.1, 0], 'out'),
    key(1.15, { chest: [-14, 0, 0], spine: [-8, 0, 0], head: [-24, 0, 0], 'upperarm.R': [-20, 0, -50], 'forearm.R': [-20, 0, 0], 'upperarm.L': [-20, 0, 50], 'forearm.L': [-20, 0, 0] }, [0, -0.02, 0], 'outExpo'),
    key(1.7, { chest: [-6, 0, 0], head: [-10, 0, 0], 'upperarm.R': [-10, 0, -30], 'upperarm.L': [-10, 0, 30] }, [0, -0.06, 0], 'inOut'),
  ],
};

// Sonído: a low lean, arms trailing
const dash: ClipDef = {
  name: 'dash', dur: 0.3, fadeIn: 0.03, fadeOut: 0.15,
  keys: [
    key(0, { hips: [18, 0, 0], spine: [16, 0, 0], chest: [10, 0, 0], head: [-24, 0, 0], 'thigh.L': [-66, 0, 4], 'shin.L': [62, 0, 0], 'thigh.R': [40, 0, -4], 'shin.R': [70, 0, 0], 'upperarm.L': [40, 0, 18], 'forearm.L': [-30, 0, 0], 'upperarm.R': [40, 0, -18], 'forearm.R': [-30, 0, 0] }, [0, -0.12, 0]),
    key(0.3, { hips: [20, 0, 0], spine: [18, 0, 0], chest: [12, 0, 0], head: [-26, 0, 0], 'thigh.L': [-62, 0, 4], 'shin.L': [66, 0, 0], 'thigh.R': [42, 0, -4], 'shin.R': [72, 0, 0], 'upperarm.L': [44, 0, 20], 'forearm.L': [-32, 0, 0], 'upperarm.R': [44, 0, -20], 'forearm.R': [-32, 0, 0] }, [0, -0.13, 0]),
  ],
};

const airstep: ClipDef = {
  name: 'airstep', dur: 0.36, fadeIn: 0.04, fadeOut: 0.18,
  keys: [
    key(0, { 'thigh.L': [-60, 0, 6], 'shin.L': [90, 0, 0], 'thigh.R': [-10, 0, -6], 'shin.R': [30, 0, 0], spine: [8, 0, 0] }, [0, 0.02, 0]),
    key(0.12, { 'thigh.L': [-10, 0, 6], 'shin.L': [10, 0, 0], 'foot.L': [30, 0, 0], 'thigh.R': [-50, 0, -6], 'shin.R': [80, 0, 0], spine: [4, 0, 0] }, [0, 0, 0], 'outExpo'),
    key(0.36, { 'thigh.L': [-30, 0, 6], 'shin.L': [50, 0, 0], 'thigh.R': [-30, 0, -6], 'shin.R': [60, 0, 0], spine: [6, 0, 0] }, [0, 0, 0], 'out'),
  ],
};

const hitHeavy: ClipDef = {
  name: 'hit_heavy', dur: 0.7, fadeIn: 0.03, fadeOut: 0.25,
  keys: [
    key(0, { spine: [-20, 0, 0], chest: [-24, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-20, 0, 50], 'upperarm.R': [-20, 0, -50] }, [0, 0, -0.05]),
    key(0.12, { spine: [-26, 0, 6], chest: [-30, 6, 6], head: [-20, -10, 0], 'upperarm.L': [-40, 0, 70], 'forearm.L': [-30, 0, 0], 'upperarm.R': [-30, 0, -64], 'forearm.R': [-24, 0, 0], 'thigh.L': [-30, 0, 8], 'shin.L': [40, 0, 0] }, [0, -0.06, -0.08], 'outExpo'),
    key(0.7, { spine: [4, 0, 0], chest: [2, 8, 0], head: [3, 2, 0], 'upperarm.L': [8, 0, 13], 'forearm.L': [-22, 0, 0], 'upperarm.R': [8, 0, -13], 'forearm.R': [-22, 0, 0], 'thigh.L': [-12, 0, 5], 'shin.L': [14, 0, 0] }, [0, -0.035, 0], 'inOut'),
  ],
};

// ------------------------------------------------------------------ Pantera
const C: Record<string, E> = {
  hips: [12, 0, 0], spine: [14, 0, 0], chest: [8, 0, 0], neck: [-12, 0, 0], head: [-12, 0, 0],
  'upperarm.L': [-36, 0, 24], 'forearm.L': [-50, 0, 0], 'upperarm.R': [-22, 0, -26], 'forearm.R': [-60, 0, 0],
};
const c = (over: Record<string, E> = {}): Record<string, E> => ({ ...C, ...over });

const rake1: ClipDef = {
  name: 'pt_rake1', dur: 0.42, fadeIn: 0.04, fadeOut: 0.16, events: { step: 0.06, hit: 0.16, combo: 0.22 },
  keys: [
    key(0, c()),
    key(0.08, c({ chest: [0, -26, 0], spine: [8, -12, 0], 'upperarm.L': [-160, 0, 44], 'forearm.L': [-30, 0, 0], 'hand.L': [-20, 0, 0] }), [0, -0.12, -0.02], 'out'),
    key(0.16, c({ chest: [24, 26, 0], spine: [20, 12, 0], head: [-20, -12, 0], 'upperarm.L': [-26, 0, -34], 'forearm.L': [-16, 0, 0], 'hand.L': [10, 0, 0] }), [0, -0.2, 0.14], 'outExpo'),
    key(0.42, c(), [0, -0.17, 0], 'inOut'),
  ],
};

const rake2: ClipDef = {
  name: 'pt_rake2', dur: 0.42, fadeIn: 0.04, fadeOut: 0.16, events: { step: 0.06, hit: 0.16, combo: 0.22 },
  keys: [
    key(0, c()),
    key(0.08, c({ chest: [0, 26, 0], spine: [8, 12, 0], 'upperarm.R': [-160, 0, -44], 'forearm.R': [-30, 0, 0], 'hand.R': [-20, 0, 0] }), [0, -0.12, -0.02], 'out'),
    key(0.16, c({ chest: [24, -26, 0], spine: [20, -12, 0], head: [-20, 12, 0], 'upperarm.R': [-26, 0, 34], 'forearm.R': [-16, 0, 0], 'hand.R': [10, 0, 0] }), [0, -0.2, 0.14], 'outExpo'),
    key(0.42, c(), [0, -0.17, 0], 'inOut'),
  ],
};

const heelKick: ClipDef = {
  name: 'pt_heelkick', dur: 0.62, fadeIn: 0.04, fadeOut: 0.16, events: { step: 0.12, hit: 0.28, combo: 0.38 },
  keys: [
    key(0, c()),
    key(0.12, c({ hips: [0, -100, 0], spine: [10, 0, -8], 'thigh.R': [-20, 0, -10], 'shin.R': [60, 0, 0] }), [0, -0.12, 0], 'in'),
    key(0.28, c({ hips: [0, -210, 0], spine: [-4, 0, -26], chest: [0, 0, -14], head: [-10, -40, 10], 'thigh.R': [-84, 0, -54], 'shin.R': [8, 0, 0], 'thigh.L': [-10, 0, 12], 'shin.L': [30, 0, 0], 'upperarm.L': [-30, 0, 70], 'upperarm.R': [-20, 0, -40] }), [0, 0.04, 0], 'outExpo'),
    key(0.5, c({ hips: [0, -320, 0], 'thigh.R': [-20, 0, -10], 'shin.R': [50, 0, 0] }), [0, -0.12, 0], 'inOut'),
    key(0.62, c({ hips: [0, -348, 0] }), [0, -0.17, 0], 'out'),
  ],
};

const tailLash: ClipDef = {
  name: 'pt_tail', dur: 0.66, fadeIn: 0.04, fadeOut: 0.2, events: { step: 0.1, hit: 0.3 },
  keys: [
    key(0, c()),
    key(0.12, c({ hips: [24, 60, 0], spine: [22, 20, 0], 'thigh.L': [-60, 0, 10], 'shin.L': [80, 0, 0], 'thigh.R': [-40, 0, -10], 'shin.R': [80, 0, 0] }), [0, -0.3, 0], 'out'),
    key(0.32, c({ hips: [30, -200, 0], spine: [26, -10, 0], 'thigh.L': [-70, 0, 14], 'shin.L': [90, 0, 0], 'thigh.R': [-50, 0, -14], 'shin.R': [90, 0, 0], 'upperarm.L': [-60, 0, 40], 'upperarm.R': [-60, 0, -40] }), [0, -0.36, 0], 'outExpo'),
    key(0.66, c({ hips: [12, -360, 0] }), [0, -0.17, 0], 'inOut'),
  ],
};

const pounce: ClipDef = {
  name: 'pt_pounce', dur: 1.0, fadeIn: 0.05, fadeOut: 0.22, events: { leap: 0.2, hit: 0.55 },
  keys: [
    key(0, c()),
    key(0.18, c({ hips: [30, 0, 0], spine: [30, 0, 0], head: [-34, 0, 0], 'thigh.L': [-80, 0, 10], 'shin.L': [120, 0, 0], 'thigh.R': [-70, 0, -10], 'shin.R': [120, 0, 0], 'upperarm.L': [10, 0, 30], 'upperarm.R': [10, 0, -30] }), [0, -0.38, 0], 'out'),
    key(0.32, c({ hips: [-10, 0, 0], spine: [-6, 0, 0], head: [-10, 0, 0], 'thigh.L': [20, 0, 6], 'shin.L': [30, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [40, 0, 0], 'upperarm.L': [-170, 0, 30], 'forearm.L': [-20, 0, 0], 'upperarm.R': [-170, 0, -30], 'forearm.R': [-20, 0, 0] }), [0, 0.1, 0.1], 'outExpo'),
    key(0.55, c({ hips: [30, 0, 0], spine: [30, 0, 0], chest: [20, 0, 0], head: [-20, 0, 0], 'thigh.L': [-80, 0, 12], 'shin.L': [110, 0, 0], 'thigh.R': [-40, 0, -12], 'shin.R': [100, 0, 0], 'upperarm.L': [-60, 0, 10], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-60, 0, -10], 'forearm.R': [-10, 0, 0] }), [0, -0.36, 0.18], 'inExpo'),
    key(1.0, c(), [0, -0.17, 0], 'inOut'),
  ],
};

const garra: ClipDef = {
  name: 'pt_garra', dur: 1.05, fadeIn: 0.06, fadeOut: 0.25, events: { aim: 0.2, fire: 0.36 },
  keys: [
    key(0, c()),
    key(0.22, c({ chest: [4, 0, 0], head: [-6, 0, 0], 'upperarm.L': [-80, 0, -34], 'forearm.L': [-140, 0, 0], 'hand.L': [0, 0, 0], 'upperarm.R': [-80, 0, 34], 'forearm.R': [-140, 0, 0], 'hand.R': [0, 0, 0] }), [0, -0.12, -0.04], 'out'),
    key(0.4, c({ chest: [-6, 0, 0], head: [-4, 0, 0], 'upperarm.L': [-96, 0, -20], 'forearm.L': [-150, 0, 0], 'upperarm.R': [-96, 0, 20], 'forearm.R': [-150, 0, 0] }), [0, -0.1, -0.08], 'outExpo'),
    key(0.75, c({ chest: [-4, 0, 0], 'upperarm.L': [-90, 0, -24], 'forearm.L': [-146, 0, 0], 'upperarm.R': [-90, 0, 24], 'forearm.R': [-146, 0, 0] }), [0, -0.12, -0.06], 'inOut'),
    key(1.05, c(), [0, -0.17, 0], 'inOut'),
  ],
};

const roar: ClipDef = {
  name: 'pt_roar', dur: 1.3, fadeIn: 0.08, fadeOut: 0.3, events: { roar: 0.32 },
  keys: [
    key(0, c()),
    key(0.25, c({ hips: [4, 0, 0], spine: [20, 0, 0], chest: [16, 0, 0], neck: [10, 0, 0], head: [16, 0, 0], 'upperarm.L': [10, 0, 30], 'forearm.L': [-60, 0, 0], 'upperarm.R': [10, 0, -30], 'forearm.R': [-60, 0, 0] }), [0, -0.2, 0], 'out'),
    key(0.36, c({ hips: [-4, 0, 0], spine: [-14, 0, 0], chest: [-18, 0, 0], neck: [-18, 0, 0], head: [-30, 0, 0], 'upperarm.L': [26, 0, 64], 'forearm.L': [-30, 0, 0], 'upperarm.R': [26, 0, -64], 'forearm.R': [-30, 0, 0] }), [0, -0.08, -0.02], 'outExpo'),
    key(1.0, c({ hips: [-2, 0, 0], spine: [-12, 0, 0], chest: [-16, 0, 0], neck: [-16, 0, 0], head: [-28, 0, 0], 'upperarm.L': [24, 0, 62], 'upperarm.R': [24, 0, -62] }), [0, -0.09, -0.02], 'inOut'),
    key(1.3, c(), [0, -0.17, 0], 'inOut'),
  ],
};

const desgarron: ClipDef = {
  name: 'pt_desgarron', dur: 2.3, fadeIn: 0.08, fadeOut: 0.3, events: { charge: 0.2, left: 1.05, right: 1.5 },
  keys: [
    key(0, c()),
    key(0.35, c({ hips: [0, 0, 0], spine: [-6, 0, 0], chest: [-10, 0, 0], head: [-16, 0, 0], 'upperarm.L': [-168, 0, 36], 'forearm.L': [-16, 0, 0], 'hand.L': [-10, 0, 0], 'upperarm.R': [-168, 0, -36], 'forearm.R': [-16, 0, 0], 'hand.R': [-10, 0, 0], 'thigh.L': [-20, 0, 10], 'shin.L': [30, 0, 0], 'thigh.R': [-6, 0, -10], 'shin.R': [24, 0, 0] }), [0, -0.06, 0], 'out'),
    key(0.95, c({ hips: [0, 10, 0], spine: [-8, 6, 0], chest: [-12, 10, 0], head: [-18, -6, 0], 'upperarm.L': [-172, 0, 40], 'forearm.L': [-14, 0, 0], 'upperarm.R': [-160, 0, -34], 'forearm.R': [-20, 0, 0] }), [0, -0.06, 0], 'inOut'),
    key(1.08, c({ hips: [10, 20, 0], spine: [26, 16, 0], chest: [20, 20, 0], head: [-20, -14, 0], 'upperarm.L': [-20, 0, -30], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-150, 0, -40], 'forearm.R': [-20, 0, 0] }), [0, -0.16, 0.12], 'outExpo'),
    key(1.38, c({ hips: [6, -10, 0], spine: [10, -10, 0], chest: [6, -16, 0], 'upperarm.L': [-30, 0, -10], 'upperarm.R': [-140, 0, -60], 'forearm.R': [-30, 0, 0] }), [0, -0.12, 0.06], 'inOut'),
    key(1.52, c({ hips: [12, -26, 0], spine: [20, -18, 0], chest: [16, -26, 0], head: [-20, 16, 0], 'upperarm.R': [-84, 0, 40], 'forearm.R': [-6, 0, 0], 'upperarm.L': [10, 0, 30] }), [0, -0.18, 0.14], 'outExpo'),
    key(2.3, c(), [0, -0.17, 0], 'inOut'),
  ],
};

export const GRIMMJOW_CLIPS: ClipDef[] = [jab, hook, spinKick, knee, stomp, nukite, cero, granRey, release, dash, airstep, hitHeavy];
export const PANTERA_CLIPS: ClipDef[] = [rake1, rake2, heelKick, tailLash, pounce, garra, roar, desgarron, dash, airstep, hitHeavy, cero];
export const GRIMMJOW_CHAIN = ['gj_jab', 'gj_hook', 'gj_spinkick', 'gj_knee', 'gj_stomp'];
export const PANTERA_CHAIN = ['pt_rake1', 'pt_rake2', 'pt_heelkick', 'pt_tail'];
