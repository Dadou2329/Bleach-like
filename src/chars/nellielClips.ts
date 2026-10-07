// Nelliel Tu Odelschwanck's animation set (docs/roster/E2-espada-2.md §7).
// Adult: an elegant, economical swordswoman who weaves kicks into her cuts — a forehand cut, a falling backhand,
// a high kick to the neck, a spinning heel kick; the precise lunge; the Cero from the mouth; Cero Doble (the left
// palm stops the attack, she swallows it and spits it back fused with her own); Sonído; "Utae, Gamuza" with the
// sword held level before her. Nel Tu: flailing slaps, a headbutt, a whirl; the Tamapunch; the gulp-and-spit
// Cero Doble; Nel Shower; Chōkasoku (a homing headbutt rocket); growing up. Gamuza (a centaur — the legs walk,
// trot and gallop procedurally): the double-ended lance thrust, the rear point swept round, the reverse thrust
// with the other end, a rearing strike of the front hooves; the plunge; Lanzador Verde (the lance flipped,
// rear back, hurled); the couched charge of Galope; the release burst.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type C3 = [number, number, number];
type B = NonNullable<KeyDef['b']>;

function grip(p: C3, dir: C3, pole: C3, ref: C3 = [0, -1, 0]): Record<string, C3> {
  const l = Math.hypot(dir[0], dir[1], dir[2]) || 1;
  const d: C3 = [dir[0] / l, dir[1] / l, dir[2] / l];
  let k = ref[0] * d[0] + ref[1] * d[1] + ref[2] * d[2];
  let e: C3 = [ref[0] - d[0] * k, ref[1] - d[1] * k, ref[2] - d[2] * k];
  if (Math.hypot(e[0], e[1], e[2]) < 0.2) {
    k = d[2];
    e = [-d[0] * k, -d[1] * k, 1 - d[2] * k];
  }
  const el = Math.hypot(e[0], e[1], e[2]) || 1;
  e = [e[0] / el, e[1] / el, e[2] / el];
  return { '@gripR': p, '@dirR': d, '@edgeR': e, '@poleR': pole, '@ikR': [1, 0, 0] };
}

function body(t: number, b: B, hips?: KeyDef['hips'], ease?: KeyDef['ease']): KeyDef {
  return { t, b, hips, ease };
}

const ch = (t: number, c: Record<string, C3>, ease?: KeyDef['ease']): KeyDef => ({ t, ease, c });
const two = (t: number, w: number, ease?: KeyDef['ease']): KeyDef => ({ t, ease, c: { '@twoHand': [w, 0, 0] } });
/** a full turn of the root that wraps back to 0 the instant it completes (no unwinding in the fade) */
const spinKeys = (t0: number, t1: number, wind = -20): KeyDef[] => [
  { t: 0, c: { '@spin': [0, 0, 0] } },
  { t: t0, ease: 'out', c: { '@spin': [wind, 0, 0] } },
  { t: t1, ease: 'inOut', c: { '@spin': [360, 0, 0] } },
  { t: t1 + 0.01, ease: 'hold', c: { '@spin': [0, 0, 0] } },
];

const SHARED = ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name));

// ================================================================== adult

const N_IDLE: B = {
  hips: [0, -12, 2], spine: [1, 4, -1], chest: [0, 6, 0], neck: [0, 0, 0], head: [2, 3, -2],
  'thigh.L': [-14, 0, 3], 'shin.L': [18, 0, 0], 'foot.L': [-6, 0, 0], 'thigh.R': [6, 0, -5], 'shin.R': [6, 0, 0], 'foot.R': [-4, 0, 0],
  'upperarm.L': [4, 0, 9], 'forearm.L': [-14, 0, 0], 'hand.L': [6, 0, 10],
};
const N_HIPS: C3 = [0, -0.02, 0];
const NG = { p: [-0.27, -0.3, 0.17] as C3, dir: [0.1, -0.42, 0.9] as C3, edge: [0, -0.9, -0.42] as C3, pole: [-0.6, -0.3, -0.75] as C3 };
const NG_IDLE = { '@gripR': NG.p, '@dirR': NG.dir, '@edgeR': NG.edge, '@poleR': NG.pole, '@ikR': [1, 0, 0] as C3 };

/** Calm and light on her feet, Gamuza low in her right hand, its point toward the ground ahead. */
export const NEL_STANCE: StanceDef = {
  idle: N_IDLE,
  idleHips: -0.02,
  run: { 'upperarm.L': [-4, 0, 6], chest: [0, 4, 0] },
  sprint: { 'upperarm.L': [14, 0, 12], 'forearm.L': [-30, 0, 0] },
  swingL: 0.9,
  swingR: 0.2,
  grip: {
    idle: NG,
    walk: { p: [-0.28, -0.3, 0.12], dir: [0.05, -0.5, 0.86], edge: [0, -0.86, -0.5], pole: [-0.6, -0.3, -0.75] },
    run: { p: [-0.3, -0.26, -0.08], dir: [-0.2, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.28, -0.14, -0.18], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.38, -0.06, 0.12], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

// the forehand: a level cut from her right across to her left
const cut1: ClipDef = {
  name: 'nl_cut1', dur: 0.5, fadeIn: 0.05, fadeOut: 0.18,
  events: { step: 0.08, hit: 0.16, combo: 0.3 },
  keys: mergeKeys(
    swingKeys({ a: [-1, 0, 0], b: [0, 0, 1], c: [-0.04, 0.0, 0.12], r: 0.36, tilt: -0.08, pole: [-0.7, -0.4, -0.5], keys: [[0, 60, 'out'], [0.11, -30, 'out'], [0.24, 178, 'outExpo'], [0.5, 150, 'inOut']] }),
    [
      body(0, N_IDLE, N_HIPS),
      body(0.11, { hips: [0, -26, 0], spine: [4, -10, 0], chest: [2, -14, 0], head: [0, 20, 0], 'thigh.L': [-22, 0, 4], 'shin.L': [22, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [14, 0, 0], 'upperarm.L': [0, 0, 30], 'forearm.L': [-30, 0, 0] }, [0, -0.04, 0], 'out'),
      body(0.24, { hips: [4, 20, 0], spine: [8, 14, 0], chest: [6, 22, 0], head: [0, -22, 0], 'thigh.L': [-36, 0, 6], 'shin.L': [30, 0, 0], 'foot.L': [4, 0, 0], 'thigh.R': [22, 0, -6], 'shin.R': [18, 0, 0], 'upperarm.L': [12, 0, 52], 'forearm.L': [-20, 0, 0] }, [0, -0.07, 0.08], 'outExpo'),
      body(0.5, N_IDLE, N_HIPS, 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.4, 0, 0] } }],
  ),
};

// the backhand: high on her left, falling diagonally across to low on her right
const cut2: ClipDef = {
  name: 'nl_cut2', dur: 0.5, fadeIn: 0.04, fadeOut: 0.18,
  events: { step: 0.06, hit: 0.15, combo: 0.3 },
  keys: mergeKeys(
    swingKeys({ a: [-0.8, -0.6, 0], b: [0, 0, 1], c: [-0.02, 0.06, 0.12], r: 0.36, sense: -1, pole: [-0.6, -0.5, -0.5], keys: [[0, 150, 'out'], [0.1, 200, 'out'], [0.23, -18, 'outExpo'], [0.5, 10, 'inOut']] }),
    [
      body(0, { ...N_IDLE, hips: [4, 20, 0], chest: [6, 18, 0] }, N_HIPS),
      body(0.1, { hips: [2, 30, 0], spine: [-2, 12, 0], chest: [-4, 18, 0], head: [-4, -22, 0], 'thigh.L': [-16, 0, 4], 'shin.L': [18, 0, 0], 'thigh.R': [12, 0, -6], 'shin.R': [14, 0, 0], 'upperarm.L': [8, 0, 40], 'forearm.L': [-30, 0, 0] }, [0, -0.02, 0], 'out'),
      body(0.23, { hips: [8, -24, 0], spine: [12, -14, 0], chest: [10, -18, 0], head: [-8, 22, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [36, 0, 0], 'foot.L': [6, 0, 0], 'thigh.R': [24, 0, -6], 'shin.R': [22, 0, 0], 'upperarm.L': [-10, 0, 46], 'forearm.L': [-24, 0, 0] }, [0, -0.08, 0.1], 'outExpo'),
      body(0.5, N_IDLE, N_HIPS, 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.4, 0, 0] } }],
  ),
};

// a high kick to the neck: the right leg swung round and up, the sword held out for balance
const SWORD_OUT = grip([-0.42, -0.12, -0.02], [-0.7, -0.35, 0.6], [-0.4, -0.6, -0.6]);
const kick: ClipDef = {
  name: 'nl_kick', dur: 0.62, fadeIn: 0.04, fadeOut: 0.2,
  events: { step: 0.05, hit: 0.2, combo: 0.36 },
  keys: mergeKeys(
    [ch(0, NG_IDLE), ch(0.1, SWORD_OUT, 'out'), ch(0.42, SWORD_OUT), ch(0.62, NG_IDLE, 'inOut')],
    [
      body(0, N_IDLE, N_HIPS),
      body(0.09, { hips: [-4, 26, 4], spine: [-4, -8, 4], chest: [-4, -10, 0], head: [2, -14, 0], 'thigh.L': [-8, 0, 2], 'shin.L': [14, 0, 0], 'thigh.R': [-56, 0, -20], 'shin.R': [96, 0, 0], 'foot.R': [20, 0, 0], 'upperarm.L': [-10, 0, 44], 'forearm.L': [-34, 0, 0] }, [0, 0, 0], 'out'),
      body(0.2, { hips: [-10, 56, 14], spine: [-12, -18, 12], chest: [-8, -20, 8], head: [4, -24, -8], 'thigh.L': [4, 0, 4], 'shin.L': [10, 0, 0], 'foot.L': [0, 0, 0], 'thigh.R': [-104, 0, -42], 'shin.R': [12, 0, 0], 'foot.R': [36, 0, 0], 'upperarm.L': [-20, 0, 74], 'forearm.L': [-16, 0, 0] }, [0, 0.03, 0.02], 'outExpo'),
      body(0.34, { hips: [-8, 48, 12], spine: [-10, -16, 10], chest: [-6, -18, 6], head: [4, -22, -6], 'thigh.L': [2, 0, 4], 'shin.L': [12, 0, 0], 'thigh.R': [-92, 0, -36], 'shin.R': [40, 0, 0], 'foot.R': [24, 0, 0], 'upperarm.L': [-16, 0, 66], 'forearm.L': [-20, 0, 0] }, [0, 0.02, 0.02], 'out'),
      body(0.62, N_IDLE, N_HIPS, 'inOut'),
    ],
  ),
};

// a spinning heel kick: a full turn on the right foot, the left leg sweeping out at the front of the turn
const spin: ClipDef = {
  name: 'nl_spin', dur: 0.7, fadeIn: 0.04, fadeOut: 0.22,
  events: { step: 0.06, hit: 0.3, combo: 0.48 },
  keys: mergeKeys(
    spinKeys(0.08, 0.44),
    [ch(0, NG_IDLE), ch(0.1, SWORD_OUT, 'out'), ch(0.5, SWORD_OUT), ch(0.7, NG_IDLE, 'inOut')],
    [
      body(0, N_IDLE, N_HIPS),
      body(0.1, { hips: [4, -10, 0], spine: [6, 0, 0], chest: [4, 0, 0], 'thigh.L': [-20, 0, 6], 'shin.L': [40, 0, 0], 'thigh.R': [-10, 0, -4], 'shin.R': [22, 0, 0], 'upperarm.L': [-20, 0, 40], 'forearm.L': [-40, 0, 0] }, [0, -0.06, 0], 'out'),
      body(0.3, { hips: [-14, 0, -30], spine: [-6, 0, -12], chest: [-4, 0, -10], head: [6, 0, 14], 'thigh.L': [-70, 0, 66], 'shin.L': [8, 0, 0], 'foot.L': [30, 0, 0], 'thigh.R': [4, 0, -4], 'shin.R': [12, 0, 0], 'upperarm.L': [-10, 0, 30], 'forearm.L': [-30, 0, 0] }, [0, 0.04, 0], 'out'),
      body(0.46, { hips: [-6, 0, -12], spine: [-2, 0, -6], 'thigh.L': [-30, 0, 30], 'shin.L': [40, 0, 0], 'thigh.R': [0, 0, -4], 'shin.R': [14, 0, 0], 'upperarm.L': [-6, 0, 24], 'forearm.L': [-30, 0, 0] }, [0, 0, 0], 'inOut'),
      body(0.7, N_IDLE, N_HIPS, 'inOut'),
    ],
  ),
};

// the precise cut: a gliding lunge and one rising diagonal through guard and Hierro alike
const precise: ClipDef = {
  name: 'nl_precise', dur: 0.72, fadeIn: 0.05, fadeOut: 0.22,
  events: { step: 0.12, hit: 0.3 },
  keys: mergeKeys(
    swingKeys({ a: [-0.75, -0.66, 0], b: [0, 0, 1], c: [-0.04, 0.02, 0.16], r: 0.4, pole: [-0.7, -0.4, -0.5], keys: [[0, 30, 'out'], [0.2, -20, 'inOut'], [0.34, 190, 'outExpo'], [0.72, 160, 'inOut']] }),
    [
      body(0, N_IDLE, N_HIPS),
      body(0.2, { hips: [10, -30, 0], spine: [12, -12, 0], chest: [10, -16, 0], head: [-14, 24, 0], 'thigh.L': [-54, 0, 6], 'shin.L': [70, 0, 0], 'foot.L': [-6, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [44, 0, 0], 'foot.R': [-14, 0, 0], 'upperarm.L': [10, 0, 34], 'forearm.L': [-40, 0, 0] }, [0, -0.2, 0.06], 'inOut'),
      body(0.34, { hips: [2, 26, 0], spine: [-2, 14, 0], chest: [-6, 22, 0], head: [-2, -24, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [52, 0, 0], 'thigh.R': [34, 0, -6], 'shin.R': [24, 0, 0], 'foot.R': [-10, 0, 0], 'upperarm.L': [-30, 0, 60], 'forearm.L': [-10, 0, 0] }, [0, -0.12, 0.2], 'outExpo'),
      body(0.5, { hips: [2, 22, 0], spine: [-2, 12, 0], chest: [-4, 18, 0], head: [-2, -20, 0], 'thigh.L': [-46, 0, 6], 'shin.L': [48, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [22, 0, 0], 'upperarm.L': [-26, 0, 56], 'forearm.L': [-12, 0, 0] }, [0, -0.11, 0.18], 'out'),
      body(0.72, N_IDLE, N_HIPS, 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.5, 0, 0] } }],
  ),
};

// the Cero: chin up as it gathers between her lips, then forward as it fires
const cero: ClipDef = {
  name: 'nl_cero', dur: 1.0, fadeIn: 0.08, fadeOut: 0.24,
  events: { charge: 0.08, fire: 0.42 },
  keys: mergeKeys(
    [ch(0, NG_IDLE)],
    [
      body(0, N_IDLE, N_HIPS),
      body(0.32, { hips: [-4, -8, 0], spine: [-8, 2, 0], chest: [-8, 4, 0], neck: [-10, 0, 0], head: [-16, 0, 0], 'thigh.L': [-18, 0, 4], 'shin.L': [16, 0, 0], 'thigh.R': [12, 0, -5], 'shin.R': [10, 0, 0], 'upperarm.L': [10, 0, 26], 'forearm.L': [-50, 0, 0], 'hand.L': [0, 0, 20] }, [0, -0.02, -0.03], 'inOut'),
      body(0.44, { hips: [8, -8, 0], spine: [10, 2, 0], chest: [8, 4, 0], neck: [8, 0, 0], head: [4, 0, 0], 'thigh.L': [-30, 0, 4], 'shin.L': [26, 0, 0], 'thigh.R': [20, 0, -5], 'shin.R': [14, 0, 0], 'upperarm.L': [0, 0, 40], 'forearm.L': [-30, 0, 0] }, [0, -0.05, 0.05], 'outExpo'),
      body(0.7, { hips: [6, -8, 0], spine: [8, 2, 0], chest: [6, 4, 0], neck: [6, 0, 0], head: [2, 0, 0], 'thigh.L': [-28, 0, 4], 'shin.L': [24, 0, 0], 'thigh.R': [18, 0, -5], 'shin.R': [14, 0, 0], 'upperarm.L': [0, 0, 36], 'forearm.L': [-30, 0, 0] }, [0, -0.05, 0.05], 'out'),
      body(1.0, N_IDLE, N_HIPS, 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.8, 0, 0] } }],
  ),
};

// Cero Doble, the catch: the left palm thrust out to meet the attack and held there (played held)
const CATCH_B: B = {
  hips: [2, -20, 0], spine: [4, -6, 0], chest: [2, -10, 0], neck: [0, 6, 0], head: [-2, 10, 0],
  'thigh.L': [-30, 0, 6], 'shin.L': [30, 0, 0], 'foot.L': [0, 0, 0], 'thigh.R': [22, 0, -8], 'shin.R': [20, 0, 0], 'foot.R': [-10, 0, 0],
  'upperarm.L': [-82, 26, 8], 'forearm.L': [-6, 0, 0], 'hand.L': [-60, 0, 0],
};
const catchClip: ClipDef = {
  name: 'nl_catch', dur: 0.5, fadeIn: 0.05, fadeOut: 0.16,
  events: { open: 0.1 },
  keys: mergeKeys(
    [ch(0, NG_IDLE), ch(0.14, grip([-0.36, -0.24, -0.1], [-0.4, -0.5, 0.75], [-0.5, -0.5, -0.6]), 'out')],
    [body(0, N_IDLE, N_HIPS), body(0.14, CATCH_B, [0, -0.06, 0.02], 'outExpo'), body(0.5, CATCH_B, [0, -0.06, 0.02])],
  ),
};

// Cero Doble, the return: the head thrown back as she swallows it, then forward as it comes out fused
const doble: ClipDef = {
  name: 'nl_doble', dur: 1.05, fadeIn: 0.06, fadeOut: 0.26,
  events: { swallow: 0.12, fire: 0.5 },
  keys: mergeKeys(
    [ch(0, grip([-0.36, -0.24, -0.1], [-0.4, -0.5, 0.75], [-0.5, -0.5, -0.6])), ch(0.4, NG_IDLE, 'inOut')],
    [
      body(0, CATCH_B, [0, -0.06, 0.02]),
      body(0.14, { ...CATCH_B, 'upperarm.L': [-60, 20, 14], 'forearm.L': [-90, 0, 0], 'hand.L': [-20, 0, 0], neck: [-6, 0, 0], head: [-12, 0, 0] }, [0, -0.05, 0], 'out'),
      body(0.38, { hips: [-6, -10, 0], spine: [-14, 0, 0], chest: [-12, 0, 0], neck: [-14, 0, 0], head: [-24, 0, 0], 'thigh.L': [-14, 0, 4], 'shin.L': [12, 0, 0], 'thigh.R': [14, 0, -6], 'shin.R': [12, 0, 0], 'upperarm.L': [0, 0, 30], 'forearm.L': [-40, 0, 0] }, [0, 0, -0.04], 'inOut'),
      body(0.52, { hips: [10, -10, 0], spine: [14, 0, 0], chest: [10, 0, 0], neck: [10, 0, 0], head: [6, 0, 0], 'thigh.L': [-34, 0, 4], 'shin.L': [30, 0, 0], 'thigh.R': [22, 0, -6], 'shin.R': [16, 0, 0], 'upperarm.L': [0, 0, 44], 'forearm.L': [-24, 0, 0] }, [0, -0.06, 0.06], 'outExpo'),
      body(0.8, { hips: [8, -10, 0], spine: [12, 0, 0], chest: [8, 0, 0], neck: [8, 0, 0], head: [4, 0, 0], 'thigh.L': [-32, 0, 4], 'shin.L': [28, 0, 0], 'thigh.R': [20, 0, -6], 'shin.R': [16, 0, 0], 'upperarm.L': [0, 0, 40], 'forearm.L': [-24, 0, 0] }, [0, -0.06, 0.06], 'out'),
      body(1.05, N_IDLE, N_HIPS, 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.6, 0, 0] } }],
  ),
};

// Sonído: a dip and gone (the kit moves her), then a cross-body cut as she reappears beside him
const sonido: ClipDef = {
  name: 'nl_sonido', dur: 0.62, fadeIn: 0.04, fadeOut: 0.2,
  events: { vanish: 0.06, appear: 0.15, hit: 0.2 },
  keys: mergeKeys(
    swingKeys({ a: [-1, 0, 0], b: [0, 0, 1], c: [-0.04, -0.02, 0.1], r: 0.36, pole: [-0.7, -0.4, -0.5], keys: [[0, 40, 'out'], [0.16, -40, 'out'], [0.3, 185, 'outExpo'], [0.62, 160, 'inOut']] }),
    [
      body(0, N_IDLE, N_HIPS),
      body(0.08, { hips: [16, -10, 0], spine: [16, 0, 0], chest: [10, 0, 0], head: [-14, 0, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [80, 0, 0], 'thigh.R': [20, 0, -6], 'shin.R': [60, 0, 0], 'upperarm.L': [20, 0, 20], 'forearm.L': [-40, 0, 0] }, [0, -0.2, 0], 'out'),
      body(0.2, { hips: [8, -30, 0], spine: [8, -12, 0], chest: [6, -16, 0], head: [-6, 24, 0], 'thigh.L': [-40, 0, 8], 'shin.L': [50, 0, 0], 'thigh.R': [26, 0, -6], 'shin.R': [36, 0, 0], 'upperarm.L': [0, 0, 40], 'forearm.L': [-30, 0, 0] }, [0, -0.12, 0], 'out'),
      body(0.32, { hips: [6, 28, 0], spine: [8, 16, 0], chest: [6, 22, 0], head: [-4, -24, 0], 'thigh.L': [-44, 0, 6], 'shin.L': [40, 0, 0], 'thigh.R': [26, 0, -6], 'shin.R': [24, 0, 0], 'upperarm.L': [10, 0, 56], 'forearm.L': [-16, 0, 0] }, [0, -0.1, 0.1], 'outExpo'),
      body(0.62, N_IDLE, N_HIPS, 'inOut'),
    ],
  ),
};

// "Utae, Gamuza": the sword raised level before her chest, point to her left, the left hand under the blade
const RELEASE_B: B = {
  hips: [0, 0, 0], spine: [-2, 0, 0], chest: [-4, 0, 0], neck: [-2, 0, 0], head: [2, 0, 0],
  'thigh.L': [-6, 0, 4], 'shin.L': [6, 0, 0], 'thigh.R': [4, 0, -4], 'shin.R': [6, 0, 0],
  'upperarm.L': [-58, 40, 14], 'forearm.L': [-70, 0, 0], 'hand.L': [0, 0, -30],
};
const release: ClipDef = {
  name: 'nl_release', dur: 1.6, fadeIn: 0.12, fadeOut: 0.3,
  events: { raise: 0.25, name: 0.7, burst: 1.0 },
  keys: mergeKeys(
    [
      ch(0, NG_IDLE),
      ch(0.35, grip([-0.08, 0.06, 0.34], [1, 0.02, 0.05], [-0.7, -0.6, 0.2], [0, 1, 0]), 'inOut'),
      ch(1.3, grip([-0.08, 0.06, 0.34], [1, 0.02, 0.05], [-0.7, -0.6, 0.2], [0, 1, 0])),
    ],
    [
      body(0, N_IDLE, N_HIPS),
      body(0.35, RELEASE_B, [0, 0, 0], 'inOut'),
      body(0.95, { ...RELEASE_B, chest: [-6, 0, 0], head: [-4, 0, 0] }, [0, 0.01, 0], 'inOut'),
      body(1.1, { ...RELEASE_B, hips: [-4, 0, 0], spine: [-8, 0, 0], chest: [-10, 0, 0], head: [-8, 0, 0], 'upperarm.L': [-40, 30, 40], 'forearm.L': [-40, 0, 0] }, [0, 0.02, 0], 'outExpo'),
      body(1.6, N_IDLE, N_HIPS, 'inOut'),
    ],
  ),
};

// the armband: knees in, arms round herself, a puff — and she is small again (or the other way)
const shrink: ClipDef = {
  name: 'nl_shrink', dur: 0.6, fadeIn: 0.06, fadeOut: 0.2,
  events: { swap: 0.26 },
  keys: mergeKeys(
    [ch(0, NG_IDLE)],
    [
      body(0, N_IDLE, N_HIPS),
      body(0.26, { hips: [10, 0, 0], spine: [16, 0, 0], chest: [12, 0, 0], neck: [10, 0, 0], head: [10, 0, 0], 'thigh.L': [-40, 0, -4], 'shin.L': [70, 0, 0], 'thigh.R': [-40, 0, 4], 'shin.R': [70, 0, 0], 'upperarm.L': [-40, 30, -10], 'forearm.L': [-100, 0, 0] }, [0, -0.18, 0], 'inOut'),
      body(0.6, N_IDLE, N_HIPS, 'inOut'),
    ],
  ),
};

export const NEL_CLIPS: ClipDef[] = [cut1, cut2, kick, spin, precise, cero, catchClip, doble, sonido, release, shrink, ...SHARED];
export const NEL_CHAIN = ['nl_cut1', 'nl_cut2', 'nl_kick', 'nl_spin'];

// ================================================================== Nel Tu

const C_IDLE: B = {
  hips: [0, 0, 0], spine: [-4, 0, 0], chest: [-4, 0, 0], neck: [0, 0, 0], head: [-6, 0, 4],
  'thigh.L': [-4, 0, 6], 'shin.L': [8, 0, 0], 'thigh.R': [-4, 0, -6], 'shin.R': [8, 0, 0],
  'upperarm.L': [-20, 0, 34], 'forearm.L': [-40, 0, 0], 'upperarm.R': [-20, 0, -34], 'forearm.R': [-40, 0, 0],
};

/** A bouncy little stance, arms out, head tilted. */
export const NEL_CHILD_STANCE: StanceDef = {
  idle: C_IDLE,
  run: { 'upperarm.L': [-30, 0, 40], 'upperarm.R': [-30, 0, -40], 'forearm.L': [-30, 0, 0], 'forearm.R': [-30, 0, 0], head: [-8, 0, 0] },
  sprint: { 'upperarm.L': [40, 0, 50], 'upperarm.R': [40, 0, -50], spine: [10, 0, 0], head: [-14, 0, 0] },
  swingL: 1.4,
  swingR: 1.4,
  freqScale: 1.5,
};

// flailing slaps: both arms windmilling at him
const slap: ClipDef = {
  name: 'nc_slap', dur: 0.5, fadeIn: 0.04, fadeOut: 0.16,
  events: { hit: 0.14, hit2: 0.28, combo: 0.32 },
  keys: [
    body(0, C_IDLE),
    body(0.08, { ...C_IDLE, spine: [6, 10, 0], 'upperarm.R': [-160, 0, -20], 'forearm.R': [-20, 0, 0], 'upperarm.L': [-40, 0, 40] }, undefined, 'out'),
    body(0.14, { ...C_IDLE, spine: [10, -10, 0], 'upperarm.R': [-60, 0, -10], 'forearm.R': [-10, 0, 0], 'upperarm.L': [-150, 0, 20], 'forearm.L': [-20, 0, 0] }, undefined, 'outExpo'),
    body(0.22, { ...C_IDLE, spine: [10, 10, 0], 'upperarm.L': [-60, 0, 10], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-150, 0, -20], 'forearm.R': [-20, 0, 0] }, undefined, 'out'),
    body(0.28, { ...C_IDLE, spine: [10, -10, 0], 'upperarm.R': [-60, 0, -10], 'forearm.R': [-10, 0, 0], 'upperarm.L': [-150, 0, 20], 'forearm.L': [-20, 0, 0] }, undefined, 'outExpo'),
    body(0.5, C_IDLE, undefined, 'inOut'),
  ],
};

// a headbutt with the whole of her (the skull first)
const butt: ClipDef = {
  name: 'nc_butt', dur: 0.5, fadeIn: 0.04, fadeOut: 0.18,
  events: { step: 0.06, hit: 0.2, combo: 0.32 },
  keys: [
    body(0, C_IDLE),
    body(0.1, { ...C_IDLE, hips: [-10, 0, 0], spine: [-20, 0, 0], chest: [-10, 0, 0], head: [-20, 0, 0], 'upperarm.L': [30, 0, 30], 'upperarm.R': [30, 0, -30] }, [0, 0.01, -0.04], 'out'),
    body(0.2, { ...C_IDLE, hips: [12, 0, 0], spine: [16, 0, 0], chest: [10, 0, 0], head: [14, 0, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [40, 0, 0], 'thigh.R': [20, 0, -6], 'upperarm.L': [40, 0, 50], 'upperarm.R': [40, 0, -50] }, [0, -0.02, 0.12], 'outExpo'),
    body(0.5, C_IDLE, undefined, 'inOut'),
  ],
};

// a whirl: arms out, round and round
const whirl: ClipDef = {
  name: 'nc_whirl', dur: 0.6, fadeIn: 0.04, fadeOut: 0.18,
  events: { hit: 0.2, hit2: 0.36 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@spin': [0, 0, 0] } },
      { t: 0.06, ease: 'out', c: { '@spin': [-20, 0, 0] } },
      { t: 0.46, ease: 'inOut', c: { '@spin': [720, 0, 0] } },
      { t: 0.47, ease: 'hold', c: { '@spin': [0, 0, 0] } },
    ],
    [
      body(0, C_IDLE),
      body(0.1, { ...C_IDLE, 'upperarm.L': [0, 0, 84], 'forearm.L': [0, 0, 0], 'upperarm.R': [0, 0, -84], 'forearm.R': [0, 0, 0], head: [-10, 0, 0] }, undefined, 'out'),
      body(0.42, { ...C_IDLE, 'upperarm.L': [0, 0, 84], 'forearm.L': [0, 0, 0], 'upperarm.R': [0, 0, -84], 'forearm.R': [0, 0, 0], head: [-10, 0, 10] }),
      body(0.6, C_IDLE, undefined, 'inOut'),
    ],
  ),
};

// Nel Tamapunch: a low, earnest punch straight ahead
const tama: ClipDef = {
  name: 'nc_tama', dur: 0.6, fadeIn: 0.05, fadeOut: 0.2,
  events: { step: 0.1, hit: 0.24 },
  keys: [
    body(0, C_IDLE),
    body(0.14, { ...C_IDLE, hips: [6, 30, 0], spine: [6, 20, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [40, 0, 0], 'thigh.R': [20, 0, -6], 'shin.R': [30, 0, 0], 'upperarm.R': [10, 0, -20], 'forearm.R': [-110, 0, 0], 'upperarm.L': [-40, 0, 30] }, [0, -0.04, -0.02], 'inOut'),
    body(0.24, { ...C_IDLE, hips: [14, -30, 0], spine: [16, -20, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [50, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [20, 0, 0], 'upperarm.R': [-80, 0, -6], 'forearm.R': [-6, 0, 0], 'upperarm.L': [20, 0, 40], 'forearm.L': [-60, 0, 0] }, [0, -0.06, 0.08], 'outExpo'),
    body(0.4, { ...C_IDLE, hips: [12, -26, 0], spine: [14, -18, 0], 'thigh.L': [-46, 0, 6], 'shin.L': [46, 0, 0], 'thigh.R': [26, 0, -6], 'shin.R': [20, 0, 0], 'upperarm.R': [-76, 0, -6], 'forearm.R': [-10, 0, 0], 'upperarm.L': [20, 0, 40], 'forearm.L': [-60, 0, 0] }, [0, -0.06, 0.08], 'out'),
    body(0.6, C_IDLE, undefined, 'inOut'),
  ],
};

// her Cero Doble: mouth wide, head forward to gulp the attack, cheeks full, then spat back
const C_GULP: B = { ...C_IDLE, hips: [-4, 0, 0], spine: [8, 0, 0], chest: [10, 0, 0], neck: [6, 0, 0], head: [10, 0, 0], 'upperarm.L': [-50, 0, 50], 'forearm.L': [-20, 0, 0], 'upperarm.R': [-50, 0, -50], 'forearm.R': [-20, 0, 0] };
const swallow: ClipDef = {
  name: 'nc_swallow', dur: 0.4, fadeIn: 0.04, fadeOut: 0.12,
  events: { open: 0.08 },
  keys: [body(0, C_IDLE), body(0.12, C_GULP, [0, -0.02, 0.02], 'outExpo'), body(0.4, C_GULP, [0, -0.02, 0.02])],
};
const spit: ClipDef = {
  name: 'nc_spit', dur: 0.9, fadeIn: 0.04, fadeOut: 0.22,
  events: { fire: 0.42 },
  keys: [
    body(0, C_GULP, [0, -0.02, 0.02]),
    body(0.3, { ...C_IDLE, hips: [-8, 0, 0], spine: [-14, 0, 0], chest: [-10, 0, 0], neck: [-10, 0, 0], head: [-20, 0, 0], 'upperarm.L': [0, 0, 20], 'upperarm.R': [0, 0, -20] }, [0, 0.01, -0.02], 'inOut'),
    body(0.44, { ...C_IDLE, hips: [10, 0, 0], spine: [16, 0, 0], chest: [12, 0, 0], neck: [10, 0, 0], head: [8, 0, 0], 'thigh.L': [-24, 0, 6], 'shin.L': [20, 0, 0], 'upperarm.L': [30, 0, 40], 'upperarm.R': [30, 0, -40] }, [0, -0.02, 0.04], 'outExpo'),
    body(0.7, { ...C_IDLE, hips: [6, 0, 0], spine: [10, 0, 0], head: [4, 0, 0], 'upperarm.L': [20, 0, 40], 'upperarm.R': [20, 0, -40] }, [0, -0.02, 0.03], 'out'),
    body(0.9, C_IDLE, undefined, 'inOut'),
  ],
};

// Nel Shower: a hand to her mouth, a gag, and a gush of green (she sprays it over herself)
const shower: ClipDef = {
  name: 'nc_shower', dur: 1.4, fadeIn: 0.06, fadeOut: 0.24,
  events: { gag: 0.3, gush: 0.6 },
  keys: [
    body(0, C_IDLE),
    body(0.3, { ...C_IDLE, spine: [10, 0, 0], head: [16, 0, 0], 'upperarm.R': [-70, 20, -10], 'forearm.R': [-120, 0, 0], 'upperarm.L': [10, 0, 30] }, undefined, 'inOut'),
    body(0.6, { ...C_IDLE, spine: [-10, 0, 0], chest: [-8, 0, 0], head: [-34, 0, 0], 'upperarm.R': [-20, 0, -50], 'forearm.R': [-30, 0, 0], 'upperarm.L': [-20, 0, 50], 'forearm.L': [-30, 0, 0] }, [0, 0.01, 0], 'outExpo'),
    body(1.1, { ...C_IDLE, spine: [-8, 0, 0], head: [-26, 0, 0], 'upperarm.R': [-20, 0, -50], 'upperarm.L': [-20, 0, 50] }),
    body(1.4, C_IDLE, undefined, 'inOut'),
  ],
};

// Chōkasoku: crouched, the mask's eyes alight, then off like a rocket head first (held while she flies)
const C_ROCKET: B = { hips: [70, 0, 0], spine: [10, 0, 0], chest: [6, 0, 0], neck: [-20, 0, 0], head: [-30, 0, 0], 'thigh.L': [40, 0, 6], 'shin.L': [20, 0, 0], 'thigh.R': [40, 0, -6], 'shin.R': [20, 0, 0], 'upperarm.L': [60, 0, 10], 'forearm.L': [0, 0, 0], 'upperarm.R': [60, 0, -10], 'forearm.R': [0, 0, 0] };
const rocket: ClipDef = {
  name: 'nc_rocket', dur: 0.5, fadeIn: 0.04, fadeOut: 0.18,
  events: { launch: 0.2 },
  keys: [
    body(0, C_IDLE),
    body(0.18, { ...C_IDLE, hips: [20, 0, 0], spine: [20, 0, 0], head: [-10, 0, 0], 'thigh.L': [-60, 0, 6], 'shin.L': [100, 0, 0], 'thigh.R': [-60, 0, -6], 'shin.R': [100, 0, 0], 'upperarm.L': [40, 0, 20], 'upperarm.R': [40, 0, -20] }, [0, -0.1, 0], 'inOut'),
    body(0.26, C_ROCKET, [0, 0.22, -0.1], 'outExpo'),
    body(0.5, C_ROCKET, [0, 0.22, -0.1]),
  ],
};

// growing up: a burst of pink smoke from a crouch (the swap happens inside it)
const grow: ClipDef = {
  name: 'nc_grow', dur: 0.6, fadeIn: 0.06, fadeOut: 0.2,
  events: { swap: 0.3 },
  keys: [
    body(0, C_IDLE),
    body(0.3, { ...C_IDLE, hips: [10, 0, 0], spine: [20, 0, 0], head: [16, 0, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [70, 0, 0], 'thigh.R': [-40, 0, -6], 'shin.R': [70, 0, 0], 'upperarm.L': [-40, 30, -10], 'forearm.L': [-100, 0, 0], 'upperarm.R': [-40, -30, 10], 'forearm.R': [-100, 0, 0] }, [0, -0.06, 0], 'inOut'),
    body(0.6, C_IDLE, undefined, 'inOut'),
  ],
};

export const NEL_CHILD_CLIPS: ClipDef[] = [slap, butt, whirl, tama, swallow, spit, shower, rocket, grow, ...SHARED];
export const NEL_CHILD_CHAIN = ['nc_slap', 'nc_butt', 'nc_whirl'];

// ================================================================== Gamuza

/** the animal's resting legs: square under her, one hind leg cocked */
const LEGS_IDLE: B = {
  'fthigh.L': [-2, 0, 0], 'fshin.L': [4, 0, 0], 'ffoot.L': [-2, 0, 0], 'fthigh.R': [2, 0, 0], 'fshin.R': [2, 0, 0], 'ffoot.R': [-2, 0, 0],
  'thigh.L': [-4, 0, 0], 'shin.L': [8, 0, 0], 'foot.L': [-4, 0, 0], 'thigh.R': [4, 0, 0], 'shin.R': [20, 0, 0], 'foot.R': [-10, 0, 0],
};
const G_IDLE: B = {
  ...LEGS_IDLE,
  hips: [0, 0, 0], spine: [-2, -10, 0], chest: [0, -6, 0], neck: [0, 0, 0], head: [2, 8, 0],
  'upperarm.L': [4, 0, 12], 'forearm.L': [-24, 0, 0], 'hand.L': [6, 0, 8],
};
/** the lance carried upright at her right side, a little forward */
const LG = { p: [-0.32, -0.22, 0.12] as C3, dir: [-0.12, 0.88, 0.46] as C3, edge: [0, 0.46, -0.88] as C3, pole: [-0.7, -0.4, -0.5] as C3 };
const LG_IDLE = grip(LG.p, LG.dir, LG.pole, [0, 0, -1]);

/** Gamuza: tall on four legs, the lance upright in her right hand. The legs walk, trot and gallop on their own. */
export const GAMUZA_STANCE: StanceDef = {
  idle: G_IDLE,
  run: { spine: [4, -6, 0], chest: [2, -4, 0], 'upperarm.L': [10, 0, 16], 'forearm.L': [-40, 0, 0] },
  sprint: { spine: [10, -4, 0], chest: [6, -2, 0], 'upperarm.L': [20, 0, 18], 'forearm.L': [-50, 0, 0] },
  swingL: 0.3,
  swingR: 0.1,
  freqScale: 0.85,
  quad: { stride: 0.8, rock: 6 },
  grip: {
    idle: LG,
    walk: LG,
    run: { p: [-0.3, -0.16, 0.1], dir: [-0.05, 0.5, 0.86], edge: [0, 0.86, -0.5], pole: [-0.7, -0.4, -0.5] },
    sprint: { p: [-0.3, -0.12, 0.08], dir: [0, 0.12, 0.99], edge: [0, 0.99, -0.12], pole: [-0.7, -0.4, -0.5] },
    air: { p: [-0.34, -0.12, 0.1], dir: [-0.1, 0.6, 0.79], edge: [0, 0.79, -0.6], pole: [-0.7, -0.4, -0.5] },
  },
};

/** the lance level, point ahead (two hands, the left a little behind the right) */
const LANCE_BACK = grip([-0.18, -0.18, -0.34], [0.02, -0.1, 1], [-0.7, -0.5, -0.3], [0, 1, 0]);
const LANCE_OUT = grip([-0.12, -0.1, 0.56], [0, -0.26, 0.96], [-0.6, -0.6, 0], [0, 1, 0]);

// the thrust: drawn back, then driven straight out
const gThrust: ClipDef = {
  name: 'gz_thrust', dur: 0.56, fadeIn: 0.05, fadeOut: 0.18,
  events: { step: 0.08, hit: 0.2, combo: 0.32 },
  keys: mergeKeys(
    [ch(0, LG_IDLE), ch(0.12, LANCE_BACK, 'inOut'), ch(0.22, LANCE_OUT, 'outExpo'), ch(0.36, LANCE_OUT), ch(0.56, LG_IDLE, 'inOut')],
    [two(0, 0), two(0.1, 1, 'out'), two(0.4, 1), two(0.56, 0, 'inOut')],
    [
      body(0, G_IDLE),
      body(0.12, { ...G_IDLE, hips: [-3, 0, 0], spine: [-6, -24, 0], chest: [-4, -16, 0], head: [0, 26, 0], 'fthigh.L': [-8, 0, 0], 'fshin.L': [10, 0, 0] }, [0, 0, -0.06], 'inOut'),
      body(0.22, { ...G_IDLE, hips: [4, 0, 0], spine: [14, 8, 0], chest: [8, 10, 0], head: [-10, -14, 0], 'fthigh.L': [-30, 0, 0], 'fshin.L': [30, 0, 0], 'thigh.L': [10, 0, 0], 'thigh.R': [14, 0, 0] }, [0, -0.04, 0.12], 'outExpo'),
      body(0.36, { ...G_IDLE, hips: [3, 0, 0], spine: [12, 6, 0], chest: [6, 8, 0], head: [-8, -12, 0], 'fthigh.L': [-26, 0, 0], 'fshin.L': [24, 0, 0] }, [0, -0.03, 0.1], 'out'),
      body(0.56, G_IDLE, undefined, 'inOut'),
    ],
  ),
};

// the rear point swept round in front of her: the lance turned level across her body, right to left
const gSweep: ClipDef = {
  name: 'gz_sweep', dur: 0.6, fadeIn: 0.04, fadeOut: 0.2,
  events: { step: 0.06, hit: 0.2, combo: 0.36 },
  keys: mergeKeys(
    swingKeys({ a: [1, 0.1, 0], b: [0, 0.32, -0.95], c: [-0.14, -0.1, 0.34], r: 0.1, pole: [-0.7, -0.5, -0.3], keys: [[0, 20, 'out'], [0.1, -10, 'out'], [0.3, 175, 'outExpo'], [0.6, 160, 'inOut']] }),
    [two(0, 0), two(0.08, 1, 'out'), two(0.42, 1), two(0.6, 0, 'inOut')],
    [
      body(0, G_IDLE),
      body(0.1, { ...G_IDLE, spine: [0, 30, 0], chest: [0, 20, 0], head: [0, -30, 0] }, undefined, 'out'),
      body(0.3, { ...G_IDLE, hips: [0, -8, 0], spine: [6, -34, 0], chest: [4, -24, 0], head: [-4, 34, 0], 'fthigh.R': [-20, 0, 0], 'fshin.R': [30, 0, 0] }, [0, -0.02, 0.04], 'outExpo'),
      body(0.6, G_IDLE, undefined, 'inOut'),
    ],
  ),
};

// the reverse thrust: the lance flipped in her hands, the other point driven out ahead
const LANCE_REV_BACK = grip([-0.08, -0.12, -0.12], [0.02, 0.2, -0.98], [-0.7, -0.5, -0.3], [0, 1, 0]);
const LANCE_REV_OUT = grip([-0.1, -0.16, 0.46], [0, 0.26, -0.96], [-0.6, -0.6, 0], [0, 1, 0]);
const gReverse: ClipDef = {
  name: 'gz_reverse', dur: 0.56, fadeIn: 0.04, fadeOut: 0.18,
  events: { step: 0.06, hit: 0.2, combo: 0.32 },
  keys: mergeKeys(
    [ch(0, LANCE_REV_BACK), ch(0.1, grip([-0.1, -0.12, -0.2], [0, 0.22, -0.97], [-0.7, -0.5, -0.3], [0, 1, 0]), 'inOut'), ch(0.22, LANCE_REV_OUT, 'outExpo'), ch(0.36, LANCE_REV_OUT), ch(0.56, LG_IDLE, 'inOut')],
    [two(0, 1), two(0.4, 1), two(0.56, 0, 'inOut')],
    [
      body(0, { ...G_IDLE, spine: [4, -20, 0], chest: [2, -14, 0] }),
      body(0.1, { ...G_IDLE, spine: [-4, -10, 0], chest: [-2, -6, 0] }, undefined, 'inOut'),
      body(0.22, { ...G_IDLE, hips: [4, 0, 0], spine: [16, 10, 0], chest: [8, 10, 0], head: [-12, -14, 0], 'fthigh.R': [-30, 0, 0], 'fshin.R': [30, 0, 0] }, [0, -0.04, 0.12], 'outExpo'),
      body(0.36, { ...G_IDLE, hips: [3, 0, 0], spine: [14, 8, 0], chest: [6, 8, 0], head: [-10, -12, 0] }, [0, -0.03, 0.1], 'out'),
      body(0.56, G_IDLE, undefined, 'inOut'),
    ],
  ),
};

/** rearing: the body tipped up about the hind legs (they stay planted), the front legs folded */
function rear(deg: number, extra: B = {}): B {
  return {
    ...G_IDLE,
    hips: [-deg, 0, 0], spine: [deg * 0.75, -6, 0], chest: [deg * 0.1, -4, 0], head: [deg * 0.1, 6, 0],
    'thigh.L': [deg + 6, 0, 0], 'shin.L': [14, 0, 0], 'foot.L': [-14, 0, 0], 'thigh.R': [deg + 2, 0, 0], 'shin.R': [18, 0, 0], 'foot.R': [-16, 0, 0],
    'fthigh.L': [-70, 0, 0], 'fshin.L': [110, 0, 0], 'ffoot.L': [30, 0, 0], 'fthigh.R': [-60, 0, 0], 'fshin.R': [100, 0, 0], 'ffoot.R': [30, 0, 0],
    ...extra,
  };
}
/** hips offset that keeps the hind hips in place while the body tips up about its middle (m) */
function rearHips(deg: number): C3 {
  const a = (deg * Math.PI) / 180, R = 48;
  // the hind hip joint sits 28 voxels behind and 2 above the body's pivot
  const dz = -28, dy = 2;
  // the body pitches by −deg about X (front up): y' = y·cos + z·sin, z' = z·cos − y·sin
  const ny = dy * Math.cos(a) + dz * Math.sin(a), nz = dz * Math.cos(a) - dy * Math.sin(a);
  return [0, (dy - ny) / R, (dz - nz) / R];
}

// the front hooves: she rears and strikes down with both
const gHooves: ClipDef = {
  name: 'gz_hooves', dur: 0.8, fadeIn: 0.06, fadeOut: 0.22,
  events: { rear: 0.1, hit: 0.42, stomp: 0.44 },
  keys: mergeKeys(
    [ch(0, LG_IDLE), ch(0.2, grip([-0.36, 0.0, 0.0], [-0.2, 0.95, 0.2], [-0.7, -0.4, -0.5], [0, 0, -1]), 'out'), ch(0.8, LG_IDLE, 'inOut')],
    [
      body(0, G_IDLE),
      body(0.28, rear(32, { 'fthigh.L': [-90, 0, 0], 'fshin.L': [90, 0, 0], 'fthigh.R': [-84, 0, 0], 'fshin.R': [96, 0, 0], 'upperarm.L': [-30, 0, 40], 'forearm.L': [-30, 0, 0] }), rearHips(32), 'out'),
      body(0.44, rear(-2, { 'fthigh.L': [-14, 0, 0], 'fshin.L': [4, 0, 0], 'ffoot.L': [-10, 0, 0], 'fthigh.R': [-10, 0, 0], 'fshin.R': [4, 0, 0], 'ffoot.R': [-10, 0, 0], spine: [12, 0, 0], chest: [8, 0, 0] }), rearHips(-2), 'inExpo'),
      body(0.56, G_IDLE, undefined, 'out'),
      body(0.8, G_IDLE, undefined, 'inOut'),
    ],
  ),
};

// the plunge: rear high, come down with a stomp that cracks the ground and drive the lance down into it
const gPlunge: ClipDef = {
  name: 'gz_plunge', dur: 1.0, fadeIn: 0.06, fadeOut: 0.24,
  events: { rear: 0.12, stomp: 0.5, hit: 0.54 },
  keys: mergeKeys(
    [
      ch(0, LG_IDLE),
      ch(0.34, grip([-0.24, 0.42, 0.06], [0.05, -0.55, 0.83], [-0.6, -0.2, -0.75], [0, 1, 0]), 'inOut'),
      ch(0.54, grip([-0.14, -0.22, 0.52], [0.02, -0.78, 0.62], [-0.6, -0.6, 0], [0, 1, 0]), 'inOut'),
      ch(0.74, grip([-0.14, -0.22, 0.52], [0.02, -0.78, 0.62], [-0.6, -0.6, 0], [0, 1, 0])),
      ch(1.0, LG_IDLE, 'inOut'),
    ],
    [two(0, 0), two(0.3, 1, 'inOut'), two(0.78, 1), two(1.0, 0, 'inOut')],
    [
      body(0, G_IDLE),
      body(0.34, rear(40, { spine: [10, 0, 0], chest: [-10, 0, 0], head: [-6, 0, 0] }), rearHips(40), 'inOut'),
      body(0.52, rear(-4, { spine: [22, 0, 0], chest: [12, 0, 0], head: [-14, 0, 0], 'fthigh.L': [-20, 0, 0], 'fshin.L': [6, 0, 0], 'ffoot.L': [-8, 0, 0], 'fthigh.R': [-16, 0, 0], 'fshin.R': [6, 0, 0], 'ffoot.R': [-8, 0, 0] }), rearHips(-4), 'inExpo'),
      body(0.74, rear(-2, { spine: [20, 0, 0], chest: [10, 0, 0], head: [-12, 0, 0], 'fthigh.L': [-10, 0, 0], 'fshin.L': [8, 0, 0], 'fthigh.R': [-6, 0, 0], 'fshin.R': [6, 0, 0] }), rearHips(-2), 'out'),
      body(1.0, G_IDLE, undefined, 'inOut'),
    ],
  ),
};

// Lanzador Verde: the lance flipped up into a javelin grip over her shoulder, a rear back, the hurl
const gLanzador: ClipDef = {
  name: 'gz_lanzador', dur: 1.25, fadeIn: 0.08, fadeOut: 0.26,
  events: { flip: 0.2, gather: 0.3, throw: 0.72 },
  keys: mergeKeys(
    [
      ch(0, LG_IDLE),
      ch(0.24, grip([-0.3, 0.1, 0.0], [0.1, 0.6, 0.79], [-0.7, -0.3, -0.6], [0, 1, 0]), 'inOut'),
      ch(0.56, grip([-0.3, 0.3, -0.36], [0.05, 0.12, 0.99], [-0.6, 0.2, -0.75], [0, 1, 0]), 'inOut'),
      ch(0.74, grip([-0.2, 0.28, 0.56], [0.04, 0.0, 1], [-0.6, -0.4, -0.3], [0, 1, 0]), 'outExpo'),
      ch(0.9, grip([-0.16, 0.0, 0.58], [0.0, -0.4, 0.92], [-0.6, -0.6, 0], [0, 1, 0]), 'out'),
      ch(1.25, LG_IDLE, 'inOut'),
    ],
    [
      body(0, G_IDLE),
      body(0.24, { ...G_IDLE, spine: [0, -20, 0], chest: [0, -14, 0], head: [0, 20, 0], 'upperarm.L': [-60, 0, 20], 'forearm.L': [-20, 0, 0] }, undefined, 'inOut'),
      body(0.56, rear(22, { spine: [-6, -34, 0], chest: [-8, -24, 0], head: [6, 36, 0], 'upperarm.L': [-80, 10, 20], 'forearm.L': [-6, 0, 0], 'hand.L': [-30, 0, 0] }), rearHips(22), 'inOut'),
      body(0.74, rear(-4, { spine: [20, 18, 0], chest: [14, 18, 0], head: [-12, -16, 0], 'upperarm.L': [20, 0, 40], 'forearm.L': [-40, 0, 0], 'fthigh.L': [-30, 0, 0], 'fshin.L': [20, 0, 0], 'fthigh.R': [-10, 0, 0], 'fshin.R': [6, 0, 0] }), rearHips(-4), 'outExpo'),
      body(0.9, rear(-2, { spine: [16, 14, 0], chest: [10, 14, 0], head: [-10, -12, 0], 'upperarm.L': [10, 0, 40], 'forearm.L': [-40, 0, 0] }), rearHips(-2), 'out'),
      body(1.25, G_IDLE, undefined, 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.7, 0, 0] } }],
  ),
};

// Galope: the lance couched under her arm, point ahead (held while she charges)
const COUCH = grip([-0.24, -0.2, 0.3], [0.02, -0.04, 1], [-0.7, -0.5, -0.3], [0, 1, 0]);
const gCharge: ClipDef = {
  name: 'gz_charge', dur: 0.4, fadeIn: 0.08, fadeOut: 0.2,
  keys: mergeKeys(
    [ch(0, LG_IDLE), ch(0.2, COUCH, 'out'), ch(0.4, COUCH)],
    [two(0, 0), two(0.2, 1, 'out'), two(0.4, 1)],
    [body(0, G_IDLE), body(0.2, { spine: [16, 0, 0], chest: [8, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-20, 0, 20] }, undefined, 'out'), body(0.4, { spine: [16, 0, 0], chest: [8, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-20, 0, 20] })],
  ),
  weights: { hips: 0, 'thigh.L': 0, 'thigh.R': 0, 'shin.L': 0, 'shin.R': 0, 'foot.L': 0, 'foot.R': 0, 'fthigh.L': 0, 'fthigh.R': 0, 'fshin.L': 0, 'fshin.R': 0, 'ffoot.L': 0, 'ffoot.R': 0 },
};

// Cero Doble on horseback: the left palm out, held; then the swallow and the fused beam
const G_CATCH: B = { ...G_IDLE, spine: [4, -14, 0], chest: [2, -10, 0], neck: [0, 6, 0], head: [-2, 12, 0], 'upperarm.L': [-82, 26, 8], 'forearm.L': [-6, 0, 0], 'hand.L': [-60, 0, 0] };
const gCatch: ClipDef = {
  name: 'gz_catch', dur: 0.5, fadeIn: 0.05, fadeOut: 0.16,
  events: { open: 0.1 },
  keys: mergeKeys([ch(0, LG_IDLE)], [body(0, G_IDLE), body(0.14, G_CATCH, undefined, 'outExpo'), body(0.5, G_CATCH)]),
};
const gDoble: ClipDef = {
  name: 'gz_doble', dur: 1.05, fadeIn: 0.06, fadeOut: 0.26,
  events: { swallow: 0.12, fire: 0.5 },
  keys: mergeKeys(
    [ch(0, LG_IDLE)],
    [
      body(0, G_CATCH),
      body(0.14, { ...G_CATCH, 'upperarm.L': [-60, 20, 14], 'forearm.L': [-90, 0, 0], neck: [-6, 0, 0], head: [-12, 0, 0] }, undefined, 'out'),
      body(0.38, { ...G_IDLE, spine: [-14, 0, 0], chest: [-12, 0, 0], neck: [-14, 0, 0], head: [-24, 0, 0], 'upperarm.L': [0, 0, 30], 'forearm.L': [-40, 0, 0] }, undefined, 'inOut'),
      body(0.52, { ...G_IDLE, hips: [3, 0, 0], spine: [14, 0, 0], chest: [10, 0, 0], neck: [10, 0, 0], head: [6, 0, 0], 'upperarm.L': [0, 0, 44], 'forearm.L': [-24, 0, 0] }, [0, -0.02, 0.04], 'outExpo'),
      body(0.8, { ...G_IDLE, hips: [2, 0, 0], spine: [12, 0, 0], chest: [8, 0, 0], neck: [8, 0, 0], head: [4, 0, 0], 'upperarm.L': [0, 0, 40], 'forearm.L': [-24, 0, 0] }, [0, -0.02, 0.04], 'out'),
      body(1.05, G_IDLE, undefined, 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.6, 0, 0] } }],
  ),
};

// the release burst: she rears, lance high, and the reiatsu throws everyone back
const gBurst: ClipDef = {
  name: 'gz_burst', dur: 1.1, fadeIn: 0.08, fadeOut: 0.26,
  events: { rear: 0.1, burst: 0.4 },
  keys: mergeKeys(
    [ch(0, LG_IDLE), ch(0.36, grip([-0.3, 0.36, 0.06], [-0.1, 0.99, 0.1], [-0.7, -0.2, -0.6], [0, 0, -1]), 'out'), ch(0.8, grip([-0.3, 0.36, 0.06], [-0.1, 0.99, 0.1], [-0.7, -0.2, -0.6], [0, 0, -1])), ch(1.1, LG_IDLE, 'inOut')],
    [
      body(0, G_IDLE),
      body(0.36, rear(30, { spine: [16, 0, 0], chest: [-14, 0, 0], neck: [-8, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-20, 0, 70], 'forearm.L': [-10, 0, 0] }), rearHips(30), 'outExpo'),
      body(0.8, rear(26, { spine: [14, 0, 0], chest: [-12, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-20, 0, 64], 'forearm.L': [-14, 0, 0] }), rearHips(26), 'inOut'),
      body(1.1, G_IDLE, undefined, 'inOut'),
    ],
  ),
};

// the seal: the lance laid level, she sinks and is a woman again (the swap happens in the flash)
const gSeal: ClipDef = {
  name: 'gz_seal', dur: 0.6, fadeIn: 0.06, fadeOut: 0.2,
  events: { swap: 0.3 },
  keys: mergeKeys(
    [ch(0, LG_IDLE), ch(0.3, grip([-0.08, 0.04, 0.38], [1, 0.02, 0.05], [-0.7, -0.6, 0.2], [0, 1, 0]), 'inOut')],
    [body(0, G_IDLE), body(0.3, { ...G_IDLE, spine: [10, 0, 0], chest: [6, 0, 0], head: [8, 0, 0], 'fthigh.L': [-20, 0, 0], 'fshin.L': [50, 0, 0], 'fthigh.R': [-20, 0, 0], 'fshin.R': [50, 0, 0] }, [0, -0.06, 0], 'inOut'), body(0.6, G_IDLE, undefined, 'inOut')],
  ),
};

// the centaur's own dash (a bound, all four legs reaching), air step and heavy hit
const gDash: ClipDef = {
  name: 'dash', dur: 0.3, fadeIn: 0.04, fadeOut: 0.12,
  keys: [
    body(0, G_IDLE),
    body(0.08, { ...G_IDLE, hips: [-6, 0, 0], spine: [16, 0, 0], 'fthigh.L': [-60, 0, 0], 'fshin.L': [20, 0, 0], 'fthigh.R': [-56, 0, 0], 'fshin.R': [24, 0, 0], 'thigh.L': [40, 0, 0], 'shin.L': [10, 0, 0], 'thigh.R': [44, 0, 0], 'shin.R': [8, 0, 0] }, [0, 0.06, 0], 'out'),
    body(0.3, G_IDLE, undefined, 'inOut'),
  ],
};
const gAirstep: ClipDef = {
  name: 'airstep', dur: 0.36, fadeIn: 0.04, fadeOut: 0.14,
  keys: [
    body(0, G_IDLE),
    body(0.12, { ...G_IDLE, hips: [-10, 0, 0], spine: [12, 0, 0], 'fthigh.L': [-70, 0, 0], 'fshin.L': [100, 0, 0], 'fthigh.R': [-64, 0, 0], 'fshin.R': [96, 0, 0], 'thigh.L': [30, 0, 0], 'shin.L': [40, 0, 0], 'thigh.R': [34, 0, 0], 'shin.R': [36, 0, 0] }, undefined, 'out'),
    body(0.36, G_IDLE, undefined, 'inOut'),
  ],
};
const gHit: ClipDef = {
  name: 'hit_heavy', dur: 0.5, fadeIn: 0.03, fadeOut: 0.18,
  keys: [
    body(0, G_IDLE),
    body(0.08, { ...G_IDLE, hips: [-8, 0, 4], spine: [-16, 0, 6], chest: [-12, 0, 0], head: [-20, 0, 0], 'fthigh.L': [-30, 0, 0], 'fshin.L': [40, 0, 0], 'upperarm.L': [-30, 0, 50] }, [0, 0.04, -0.06], 'outExpo'),
    body(0.5, G_IDLE, undefined, 'inOut'),
  ],
};

export const GAMUZA_CLIPS: ClipDef[] = [gThrust, gSweep, gReverse, gHooves, gPlunge, gLanzador, gCharge, gCatch, gDoble, gBurst, gSeal, gDash, gAirstep, gHit];
export const GAMUZA_CHAIN = ['gz_thrust', 'gz_sweep', 'gz_reverse', 'gz_hooves'];
