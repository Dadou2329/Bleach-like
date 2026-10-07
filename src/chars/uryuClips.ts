// Uryū's animation set: an archer. Standing easy with the left hand forward; to shoot he turns side-on, the
// bow hand straight out at the target, the right hand drawn back to the cheek and snapped open on the
// release. Rapid fire draws and looses in a blur; the charged shot is a long, steady draw; Licht Regen
// raises the bow arm high while the charge crawls up past the shoulder; Seele Schneider is drawn from the
// coat and nocked; Sprenger throws five of them round the target and pours the Gintō; Gintō is a flick of
// the wrist; Letzt Stil — the glove torn away, arms flung wide.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

const IDLE: Record<string, E> = {
  hips: [0, -8, 0], spine: [2, 0, 0], chest: [0, -6, 0], head: [-2, 6, 0],
  'thigh.L': [-8, 0, 4], 'shin.L': [8, 0, 0], 'thigh.R': [6, 0, -4], 'shin.R': [10, 0, 0], 'foot.R': [-4, 0, 0],
  'upperarm.L': [-16, 0, 8], 'forearm.L': [-22, 0, 0], 'hand.L': [0, 0, 0],
  'upperarm.R': [4, 0, -8], 'forearm.R': [-14, 0, 0],
};

export const URYU_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.015,
  run: { chest: [4, -4, 0], 'upperarm.L': [-10, 0, 8], 'forearm.L': [-40, 0, 0] },
  sprint: { spine: [12, 0, 0], chest: [6, 0, 0], head: [-8, 0, 0], 'upperarm.L': [30, 0, 10], 'forearm.L': [-30, 0, 0], 'upperarm.R': [30, 0, -10], 'forearm.R': [-30, 0, 0] },
  swingL: 0.5,
  swingR: 0.9,
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

/** One shot: up, draw, loose. */
const shot: ClipDef = {
  name: 'uy_shot', dur: 0.46, fadeIn: 0.04, fadeOut: 0.18, events: { fire: 0.12, combo: 0.18 },
  keys: [
    key(0, R()),
    key(0.1, A(), [0, -0.02, 0], 'outExpo'),
    key(0.14, { ...LOOSE }, [0, -0.02, 0], 'outExpo'),
    key(0.26, A(), [0, -0.02, 0], 'out'),
    key(0.46, R(), [0, -0.015, 0], 'inOut'),
  ],
};

/** Three loosed in a blur, the bow held steady. */
const rapid: ClipDef = {
  name: 'uy_rapid', dur: 0.62, fadeIn: 0.04, fadeOut: 0.2, events: { fire1: 0.1, fire2: 0.2, fire3: 0.3, combo: 0.34 },
  keys: [
    key(0, R()),
    key(0.08, A(), [0, -0.02, 0], 'outExpo'),
    key(0.11, { ...LOOSE }, [0, -0.02, 0], 'linear'),
    key(0.17, A(), [0, -0.02, 0], 'linear'),
    key(0.21, { ...LOOSE }, [0, -0.02, 0], 'linear'),
    key(0.27, A(), [0, -0.02, 0], 'linear'),
    key(0.31, { ...LOOSE }, [0, -0.02, 0], 'linear'),
    key(0.42, A(), [0, -0.02, 0], 'out'),
    key(0.62, R(), [0, -0.015, 0], 'inOut'),
  ],
};

/** The charged shot: a long steady draw, the string pulled past the ear, then loosed. */
const charge: ClipDef = {
  name: 'uy_charge', dur: 1.15, fadeIn: 0.06, fadeOut: 0.24, events: { draw: 0.12, fire: 0.72 },
  keys: [
    key(0, R()),
    key(0.16, A({ 'thigh.L': [-20, 0, 10], 'shin.L': [16, 0, 0], 'thigh.R': [16, 0, -10], 'shin.R': [18, 0, 0] }), [0, -0.05, 0], 'out'),
    key(0.68, A({ 'upperarm.R': [-84, -20, -22], 'forearm.R': [-150, 0, 0], 'thigh.L': [-20, 0, 10], 'shin.L': [16, 0, 0], 'thigh.R': [16, 0, -10], 'shin.R': [18, 0, 0] }), [0, -0.05, 0], 'inOut'),
    key(0.74, { ...LOOSE, 'thigh.L': [-20, 0, 10], 'shin.L': [16, 0, 0], 'thigh.R': [16, 0, -10], 'shin.R': [18, 0, 0] }, [0, -0.05, -0.03], 'outExpo'),
    key(0.9, A(), [0, -0.03, 0], 'out'),
    key(1.15, R(), [0, -0.015, 0], 'inOut'),
  ],
};

/** Licht Regen: the bow arm raised high while the charge crawls up past the shoulder, then levelled and the volley loosed. */
const licht: ClipDef = {
  name: 'uy_licht', dur: 1.9, fadeIn: 0.08, fadeOut: 0.28, events: { charge: 0.15, fire: 0.95, stop: 1.5 },
  keys: [
    key(0, R()),
    key(0.3, R({ chest: [-8, -20, 0], head: [-14, 20, 0], 'upperarm.L': [-150, 20, 10], 'forearm.L': [-6, 0, 0], 'upperarm.R': [-20, 0, -20], 'forearm.R': [-60, 0, 0], 'thigh.L': [-14, 0, 8], 'thigh.R': [12, 0, -8] }), [0, -0.02, 0], 'out'),
    key(0.85, R({ chest: [-10, -22, 0], head: [-16, 22, 0], 'upperarm.L': [-156, 20, 10], 'forearm.L': [-4, 0, 0], 'upperarm.R': [-20, 0, -20], 'forearm.R': [-60, 0, 0], 'thigh.L': [-14, 0, 8], 'thigh.R': [12, 0, -8] }), [0, -0.02, 0], 'inOut'),
    key(0.95, A(), [0, -0.03, 0], 'outExpo'),
    key(1.02, { ...LOOSE }, [0, -0.03, 0], 'linear'),
    key(1.1, A(), [0, -0.03, 0], 'linear'),
    key(1.18, { ...LOOSE }, [0, -0.03, 0], 'linear'),
    key(1.26, A(), [0, -0.03, 0], 'linear'),
    key(1.34, { ...LOOSE }, [0, -0.03, 0], 'linear'),
    key(1.5, A(), [0, -0.03, 0], 'out'),
    key(1.9, R(), [0, -0.015, 0], 'inOut'),
  ],
};

/** Seele Schneider: drawn from inside the coat, nocked on the bow, loosed as an arrow. */
const seele: ClipDef = {
  name: 'uy_seele', dur: 1.05, fadeIn: 0.06, fadeOut: 0.24, events: { draw: 0.2, nock: 0.42, fire: 0.66 },
  keys: [
    key(0, R()),
    key(0.2, R({ chest: [0, 10, 0], head: [6, -6, 0], 'upperarm.R': [-30, 0, 30], 'forearm.R': [-120, 0, 0], 'hand.R': [0, 0, 0] }), [0, -0.01, 0], 'out'),
    key(0.42, A(), [0, -0.03, 0], 'inOut'),
    key(0.62, A({ 'upperarm.R': [-84, -20, -22], 'forearm.R': [-150, 0, 0] }), [0, -0.03, 0], 'inOut'),
    key(0.68, { ...LOOSE }, [0, -0.03, -0.02], 'outExpo'),
    key(0.82, A(), [0, -0.03, 0], 'out'),
    key(1.05, R(), [0, -0.015, 0], 'inOut'),
  ],
};

/** Sprenger: five blades flung one after another round the target, then the Gintō poured. */
const THROW = (k: number): Record<string, E> => R({ chest: [0, -18 + k * 8, 0], head: [0, 14, 0], 'upperarm.R': [-100, 0, -10 + k * 12], 'forearm.R': [-10, 0, 0], 'hand.R': [-20, 0, 0], 'thigh.L': [-14, 0, 8], 'thigh.R': [12, 0, -8] });
const WIND: Record<string, E> = R({ chest: [0, 14, 0], head: [0, -6, 0], 'upperarm.R': [-40, 0, 40], 'forearm.R': [-100, 0, 0] });
const sprenger: ClipDef = {
  name: 'uy_sprenger', dur: 1.7, fadeIn: 0.06, fadeOut: 0.3, events: { throw1: 0.16, throw2: 0.3, throw3: 0.44, throw4: 0.58, throw5: 0.72, pour: 1.0, blast: 1.12 },
  keys: [
    key(0, R()),
    key(0.1, { ...WIND }, [0, -0.02, 0], 'out'),
    key(0.16, THROW(0), [0, -0.02, 0], 'outExpo'),
    key(0.24, { ...WIND }, [0, -0.02, 0], 'out'),
    key(0.3, THROW(1), [0, -0.02, 0], 'outExpo'),
    key(0.38, { ...WIND }, [0, -0.02, 0], 'out'),
    key(0.44, THROW(2), [0, -0.02, 0], 'outExpo'),
    key(0.52, { ...WIND }, [0, -0.02, 0], 'out'),
    key(0.58, THROW(3), [0, -0.02, 0], 'outExpo'),
    key(0.66, { ...WIND }, [0, -0.02, 0], 'out'),
    key(0.72, THROW(4), [0, -0.02, 0], 'outExpo'),
    key(0.95, R({ chest: [6, 0, 0], head: [10, 0, 0], 'upperarm.R': [-70, 0, 0], 'forearm.R': [-30, 0, 0], 'hand.R': [40, 0, 0] }), [0, -0.03, 0], 'inOut'),
    key(1.05, R({ chest: [6, 0, 0], head: [10, 0, 0], 'upperarm.R': [-70, 0, 0], 'forearm.R': [-30, 0, 0], 'hand.R': [70, 0, 0] }), [0, -0.03, 0], 'out'),
    key(1.7, R(), [0, -0.015, 0], 'inOut'),
  ],
};

/** A Gintō tube flicked from the fingers. */
const ginto: ClipDef = {
  name: 'uy_ginto', dur: 0.7, fadeIn: 0.05, fadeOut: 0.22, events: { throw: 0.2 },
  keys: [
    key(0, R()),
    key(0.12, R({ chest: [0, 10, 0], 'upperarm.R': [-40, 0, 30], 'forearm.R': [-110, 0, 0] }), [0, -0.01, 0], 'out'),
    key(0.2, R({ chest: [0, -14, 0], head: [0, 10, 0], 'upperarm.R': [-96, 0, -6], 'forearm.R': [-8, 0, 0], 'hand.R': [-30, 0, 0] }), [0, -0.02, 0.02], 'outExpo'),
    key(0.7, R(), [0, -0.015, 0], 'inOut'),
  ],
};

/** Quincy: Letzt Stil — the glove pulled off, arms flung wide as the reishi floods in. */
const letzt: ClipDef = {
  name: 'uy_letzt', dur: 2.0, fadeIn: 0.1, fadeOut: 0.3, events: { tear: 0.45, burst: 0.95 },
  keys: [
    key(0, R()),
    key(0.4, R({ chest: [6, 0, 0], head: [12, 0, 0], 'upperarm.L': [-60, 0, -20], 'forearm.L': [-70, 0, 0], 'upperarm.R': [-50, 0, 30], 'forearm.R': [-90, 0, 0] }), [0, -0.02, 0], 'inOut'),
    key(0.95, R({ spine: [-8, 0, 0], chest: [-12, 0, 0], head: [-18, 0, 0], 'upperarm.L': [-20, 0, 70], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-20, 0, -70], 'forearm.R': [-10, 0, 0], 'thigh.L': [-10, 0, 10], 'thigh.R': [8, 0, -10] }), [0, 0.02, 0], 'outExpo'),
    key(1.5, R({ spine: [-6, 0, 0], chest: [-10, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-20, 0, 66], 'upperarm.R': [-20, 0, -66] }), [0, 0.02, 0], 'out'),
    key(2.0, R(), [0, -0.015, 0], 'inOut'),
  ],
};

export const URYU_CLIPS: ClipDef[] = [
  shot, rapid, charge, licht, seele, sprenger, ginto, letzt,
  ...ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name)),
];
export const URYU_CHAIN = ['uy_shot', 'uy_shot', 'uy_rapid'];
