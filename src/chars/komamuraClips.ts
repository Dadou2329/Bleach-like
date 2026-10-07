// Sajin Komamura's animation set: a towering, heavy captain — upright, the weight low, Tenken held in his
// right hand with the point lowered before him, the left fist loose at his side. The chain is two great
// one-handed cuts (a forehand diagonal down to the left, a rising backhand), a straight left from the
// gauntlet and a two-handed overhead chop that cracks the ground. RMB the Earth-Splitting Draw (raised high
// over his head with both hands, then down through the ground); the overhead throw (seized with the left
// hand, lifted over his head and driven into the ground); the haymaker; the iron forearm raised to catch a
// blade, then the shove; the roar; the lunging straight left and the stomp that Tenken's limbs and the
// giant copy at their scale; "Todoroke, Tenken"; "Bankai"; the One Blow. Tenken's phantom limbs and the
// Bankai giant mirror these poses bone for bone, so every move reads at three scales.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });
const grip = (t: number, g: Grip, ease?: KeyDef['ease'], two = 0): KeyDef => ({
  t, ease, c: { '@gripR': g.p, '@dirR': g.dir, '@edgeR': g.edge, '@poleR': g.pole, '@ikR': [1, 0, 0], '@twoHand': [two, 0, 0] },
});

interface Grip { p: E; dir: E; edge: E; pole: E }

// ------------------------------------------------------------------ stance

/** upright and planted, the feet wide, the head a little lowered; the left fist loose */
const IDLE: Record<string, E> = {
  hips: [0, -8, 0], spine: [5, 2, 0], chest: [3, 6, 0], neck: [4, 0, 0], head: [-6, -6, 0],
  'thigh.L': [-8, 0, 7], 'shin.L': [10, 0, 0], 'foot.L': [-2, 0, -4],
  'thigh.R': [5, 0, -8], 'shin.R': [8, 0, 0], 'foot.R': [-4, 0, 4],
  'upperarm.L': [-4, 0, 9], 'forearm.L': [-16, 0, 0], 'hand.L': [4, 0, 0],
};
const I = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });

/** Tenken held low at his right, the point lowered toward the ground in front of him */
const LOW: Grip = { p: [-0.5, -0.5, 0.28], dir: [0.12, -0.5, 0.86], edge: [0.02, -0.86, -0.5], pole: [-0.8, -0.3, -0.5] };
/** the swing centre for one-handed cuts (chest space, m): in front of the right shoulder */
const SH: E = [-0.3, 0.26, 0.06];

export const KOMAMURA_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.04,
  run: { spine: [10, 0, 0], chest: [4, 0, 0], head: [-8, 0, 0], 'upperarm.L': [10, 0, 10] },
  sprint: { spine: [20, 0, 0], chest: [8, 0, 0], head: [-14, 0, 0], 'upperarm.L': [40, 0, 12], 'forearm.L': [-34, 0, 0] },
  swingL: 0.8,
  swingR: 0.1,
  freqScale: 0.82,
  grip: {
    idle: LOW,
    walk: { ...LOW, p: [-0.5, -0.48, 0.24] },
    run: { p: [-0.48, -0.38, -0.07], dir: [-0.25, -0.33, -0.91], edge: [0, -0.94, 0.33], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.47, -0.23, -0.26], dir: [-0.2, -0.08, -0.97], edge: [0, -1, 0.08], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.62, -0.08, 0.2], dir: [-0.62, -0.2, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

// ------------------------------------------------------------------ the chain

/** LMB 1: a great forehand diagonal, from high behind his right shoulder down across to his left */
const cut1: ClipDef = {
  name: 'km_cut1', dur: 0.86, fadeIn: 0.06, fadeOut: 0.24, events: { step: 0.14, hit: 0.3, combo: 0.44 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [1, -0.62, 0], c: SH, r: 0.72, pole: [-0.5, -0.6, -0.6],
      keys: [[0, -60, 'out'], [0.18, -138, 'out'], [0.3, 28, 'outExpo'], [0.44, 112, 'out'], [0.86, 80, 'inOut']],
    }),
    [
      key(0, I()),
      key(0.18, I({ hips: [0, -26, 0], spine: [2, -14, 0], chest: [-4, -22, 0], head: [-6, 22, 0], 'thigh.L': [-14, 0, 8], 'thigh.R': [12, 0, -8], 'shin.R': [18, 0, 0], 'upperarm.L': [-24, 0, 28], 'forearm.L': [-40, 0, 0] }), [0, -0.06, -0.03], 'out'),
      key(0.3, I({ hips: [6, 18, 0], spine: [12, 14, 0], chest: [10, 22, 0], head: [-12, -16, 0], 'thigh.L': [-40, 0, 8], 'shin.L': [40, 0, 0], 'foot.L': [-4, 0, 0], 'thigh.R': [24, 0, -6], 'shin.R': [26, 0, 0], 'upperarm.L': [-6, 0, 46], 'forearm.L': [-22, 0, 0] }), [0, -0.14, 0.12], 'outExpo'),
      key(0.44, I({ hips: [8, 22, 0], spine: [14, 16, 0], chest: [12, 26, 0], head: [-14, -20, 0], 'thigh.L': [-42, 0, 8], 'shin.L': [42, 0, 0], 'thigh.R': [26, 0, -6], 'shin.R': [28, 0, 0], 'upperarm.L': [-2, 0, 50], 'forearm.L': [-24, 0, 0] }), [0, -0.15, 0.13], 'out'),
      key(0.86, I(), [0, -0.04, 0], 'inOut'),
    ],
  ),
};

/** LMB 2: the rising backhand, from low on his left up across to high on his right */
const cut2: ClipDef = {
  name: 'km_cut2', dur: 0.8, fadeIn: 0.05, fadeOut: 0.24, events: { step: 0.1, hit: 0.26, combo: 0.4 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [-0.85, 0.52, 0], c: [-0.14, 0.14, 0.08], r: 0.68, pole: [-0.3, -0.4, -0.85],
      keys: [[0, -140, 'out'], [0.14, -124, 'out'], [0.26, 50, 'outExpo'], [0.4, 118, 'out'], [0.8, 90, 'inOut']],
    }),
    [
      key(0, I({ hips: [0, 16, 0], spine: [8, 12, 0], chest: [6, 18, -4] })),
      key(0.14, I({ hips: [0, 26, 0], spine: [10, 18, 6], chest: [10, 26, 6], head: [-4, -22, 0], 'thigh.L': [-20, 0, 8], 'shin.L': [28, 0, 0], 'thigh.R': [16, 0, -4], 'upperarm.L': [10, 0, 22] }), [0, -0.12, 0], 'out'),
      key(0.26, I({ hips: [0, -20, 0], spine: [-4, -20, -4], chest: [-12, -28, -8], head: [-14, 20, 0], 'thigh.L': [-8, 0, 6], 'thigh.R': [-10, 0, -10], 'shin.R': [16, 0, 0], 'upperarm.L': [20, 0, 40], 'forearm.L': [-20, 0, 0] }), [0, -0.02, 0.08], 'outExpo'),
      key(0.4, I({ hips: [0, -24, 0], spine: [-6, -22, -4], chest: [-14, -30, -10], head: [-16, 22, 0], 'thigh.L': [-8, 0, 6], 'thigh.R': [-10, 0, -10], 'shin.R': [16, 0, 0], 'upperarm.L': [24, 0, 44], 'forearm.L': [-22, 0, 0] }), [0, 0, 0.09], 'out'),
      key(0.8, I(), [0, -0.04, 0], 'inOut'),
    ],
  ),
};

/** LMB 3: the gauntlet — a straight left, the shoulder and hips turning in behind it */
const punch: ClipDef = {
  name: 'km_punch', dur: 0.62, fadeIn: 0.05, fadeOut: 0.2, events: { step: 0.08, hit: 0.18, combo: 0.3 },
  keys: mergeKeys(
    [grip(0, LOW), grip(0.18, { ...LOW, p: [-0.56, -0.42, 0.0] }, 'out'), grip(0.62, LOW, 'inOut')],
    [
      key(0, I()),
      key(0.09, I({ hips: [0, 14, 0], chest: [2, 12, 0], spine: [6, 8, 0], 'upperarm.L': [-40, 0, 22], 'forearm.L': [-116, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.04, -0.03], 'out'),
      key(0.18, I({ hips: [4, -14, 0], chest: [8, -30, 0], spine: [8, -14, 0], head: [-8, 22, 0], 'upperarm.L': [-90, 0, -4], 'forearm.L': [-6, 0, 0], 'hand.L': [0, 0, 0], 'thigh.L': [-32, 0, 6], 'shin.L': [32, 0, 0], 'thigh.R': [22, 0, -6], 'shin.R': [20, 0, 0] }), [0, -0.08, 0.14], 'outExpo'),
      key(0.3, I({ hips: [4, -12, 0], chest: [8, -28, 0], spine: [8, -12, 0], head: [-8, 20, 0], 'upperarm.L': [-86, 0, -2], 'forearm.L': [-10, 0, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [30, 0, 0], 'thigh.R': [20, 0, -6] }), [0, -0.08, 0.13], 'out'),
      key(0.62, I(), [0, -0.04, 0], 'inOut'),
    ],
  ),
};

/**
 * The two-handed overhead chop: Tenken raised over his head, then driven straight down through the ground
 * in front of him. `hold` lengthens the raised tell (the Earth-Splitting Draw).
 */
const chop = (name: string, o: { up: number; hold: number; T: number; events: Record<string, number> }): ClipDef => {
  const { up, hold, T } = o;
  const down = hold + 0.08;
  return {
    name, dur: T, fadeIn: 0.07, fadeOut: 0.28, events: o.events,
    keys: mergeKeys(
      swingKeys({
        a: [0, 0, 1], b: [0, -1, 0], c: [-0.08, 0.36, 0.14], r: 0.66, pole: [-0.75, -0.25, -0.6],
        keys: [[0, -100, 'out'], [up, -168, 'inOut'], [hold, -172, 'linear'], [down, 44, 'outExpo'], [down + 0.16, 54, 'out'], [T, 30, 'inOut']],
        twoHand: [0.3, 1, 1, 1, 1, 0],
      }),
      [
        key(0, I()),
        key(up, I({ hips: [-4, 0, 0], spine: [-12, 0, 0], chest: [-16, 0, 0], neck: [-4, 0, 0], head: [-6, 0, 0], 'thigh.L': [-22, 0, 8], 'shin.L': [24, 0, 0], 'thigh.R': [16, 0, -8], 'shin.R': [20, 0, 0] }), [0, 0.02, -0.05], 'inOut'),
        key(hold, I({ hips: [-6, 0, 0], spine: [-14, 0, 0], chest: [-18, 0, 0], neck: [-4, 0, 0], head: [-6, 0, 0], 'thigh.L': [-24, 0, 8], 'shin.L': [26, 0, 0], 'thigh.R': [18, 0, -8], 'shin.R': [22, 0, 0] }), [0, 0.02, -0.06], 'linear'),
        key(down, I({ hips: [14, 0, 0], spine: [26, 0, 0], chest: [18, 0, 0], neck: [6, 0, 0], head: [-22, 0, 0], 'thigh.L': [-60, 0, 8], 'shin.L': [66, 0, 0], 'foot.L': [-6, 0, 0], 'thigh.R': [32, 0, -8], 'shin.R': [42, 0, 0], 'foot.R': [-14, 0, 0] }), [0, -0.3, 0.2], 'outExpo'),
        key(down + 0.16, I({ hips: [16, 0, 0], spine: [28, 0, 0], chest: [20, 0, 0], head: [-24, 0, 0], 'thigh.L': [-62, 0, 8], 'shin.L': [68, 0, 0], 'thigh.R': [34, 0, -8], 'shin.R': [44, 0, 0] }), [0, -0.31, 0.21], 'out'),
        key(T, I(), [0, -0.04, 0], 'inOut'),
      ],
    ),
  };
};

const cut3 = chop('km_cut3', { up: 0.28, hold: 0.36, T: 1.1, events: { step: 0.3, hit: 0.43, slam: 0.45 } });
/** RMB: the Earth-Splitting Draw (Shikai: Tenken's phantom arm; Bankai: Heavenly Punishment) */
const draw = chop('km_draw', { up: 0.42, hold: 0.64, T: 1.5, events: { charge: 0.1, step: 0.6, hit: 0.71, split: 0.73 } });

// ------------------------------------------------------------------ techniques

/** Q (sealed): the overhead throw — seized by the left hand, hoisted over his head, driven into the ground */
const throwK: ClipDef = {
  name: 'km_throw', dur: 1.3, fadeIn: 0.06, fadeOut: 0.26, events: { grab: 0.2, lift: 0.5, slam: 0.84 },
  keys: mergeKeys(
    [grip(0, LOW), grip(0.5, { p: [-0.6, -0.24, 0.02], dir: [-0.3, -0.6, -0.74], edge: [0, -0.78, 0.62], pole: [-0.8, -0.3, 0.4] }, 'inOut'), grip(0.84, { ...LOW, p: [-0.56, -0.46, 0.2] }, 'out'), grip(1.3, LOW, 'inOut')],
    [
      key(0, I()),
      key(0.2, I({ hips: [4, 8, 0], spine: [14, 4, 0], chest: [10, 6, 0], 'upperarm.L': [-84, 0, 6], 'forearm.L': [-30, 0, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [40, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [34, 0, 0] }), [0, -0.12, 0.08], 'out'),
      key(0.5, I({ hips: [-4, 0, 0], spine: [-14, 0, 0], chest: [-18, 0, 0], head: [-16, 0, 0], 'upperarm.L': [-168, 0, 10], 'forearm.L': [-26, 0, 0], 'thigh.L': [-10, 0, 6], 'shin.L': [10, 0, 0], 'thigh.R': [8, 0, -6], 'shin.R': [10, 0, 0] }), [0, 0.03, -0.04], 'inOut'),
      key(0.84, I({ hips: [14, 0, 0], spine: [30, 0, 0], chest: [26, 0, 0], head: [-18, 0, 0], 'upperarm.L': [-60, 0, 10], 'forearm.L': [-8, 0, 0], 'thigh.L': [-52, 0, 6], 'shin.L': [58, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [36, 0, 0] }), [0, -0.2, 0.14], 'outExpo'),
      key(1.3, I(), [0, -0.04, 0], 'inOut'),
    ],
  ),
};

/** E (sealed): the haymaker — the left fist wound far back, then swung round with all his weight */
const haymaker: ClipDef = {
  name: 'km_haymaker', dur: 1.0, fadeIn: 0.06, fadeOut: 0.26, events: { step: 0.26, hit: 0.36 },
  keys: mergeKeys(
    [grip(0, LOW), grip(0.24, { ...LOW, p: [-0.44, -0.46, 0.34] }, 'inOut'), grip(0.36, { ...LOW, p: [-0.58, -0.4, -0.04] }, 'outExpo'), grip(1.0, LOW, 'inOut')],
    [
      key(0, I()),
      key(0.24, I({ hips: [0, 32, 0], spine: [-2, 20, 0], chest: [-4, 28, 4], head: [-6, -26, 0], 'upperarm.L': [20, 0, 46], 'forearm.L': [-96, 0, 0], 'thigh.L': [-12, 0, 10], 'thigh.R': [18, 0, -8], 'shin.R': [30, 0, 0] }), [0, -0.1, -0.05], 'inOut'),
      key(0.36, I({ hips: [4, -24, 0], spine: [10, -18, 0], chest: [8, -34, 0], head: [-10, 26, 0], 'upperarm.L': [-84, 0, -18], 'forearm.L': [-86, 0, 0], 'hand.L': [0, 0, 0], 'thigh.L': [-46, 0, 6], 'shin.L': [44, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [24, 0, 0], 'foot.R': [16, 0, 0] }), [0, -0.16, 0.18], 'outExpo'),
      key(0.56, I({ hips: [4, -30, 0], spine: [10, -22, 0], chest: [8, -42, 0], head: [-10, 30, 0], 'upperarm.L': [-74, 0, -28], 'forearm.L': [-96, 0, 0], 'thigh.L': [-44, 0, 6], 'shin.L': [42, 0, 0], 'thigh.R': [28, 0, -6] }), [0, -0.16, 0.17], 'out'),
      key(1.0, I(), [0, -0.04, 0], 'inOut'),
    ],
  ),
};

/** R: the iron forearm raised across his face to take the blade; held while the guard is up */
const guard: ClipDef = {
  name: 'km_guard', dur: 0.95, fadeIn: 0.04, fadeOut: 0.2, events: { up: 0.07 },
  keys: mergeKeys(
    [grip(0, LOW), grip(0.08, { ...LOW, p: [-0.56, -0.46, 0.12] }, 'outExpo'), grip(0.95, LOW, 'inOut')],
    [
      key(0, I()),
      key(0.08, I({ hips: [0, 14, 0], chest: [6, 16, 0], head: [-2, -8, 0], 'upperarm.L': [-74, 0, 28], 'forearm.L': [-70, 0, 0], 'hand.L': [0, 0, 0], 'thigh.L': [-24, 0, 8], 'shin.L': [28, 0, 0], 'thigh.R': [14, 0, -8], 'shin.R': [28, 0, 0] }), [0, -0.12, 0], 'outExpo'),
      key(0.72, I({ hips: [0, 14, 0], chest: [6, 16, 0], head: [-2, -8, 0], 'upperarm.L': [-74, 0, 28], 'forearm.L': [-70, 0, 0], 'thigh.L': [-24, 0, 8], 'shin.L': [28, 0, 0], 'thigh.R': [14, 0, -8], 'shin.R': [28, 0, 0] }), [0, -0.12, 0], 'linear'),
      key(0.95, I(), [0, -0.04, 0], 'inOut'),
    ],
  ),
};

/** the counter after a caught blow: the forearm and shoulder driven forward through whoever struck */
const shove: ClipDef = {
  name: 'km_shove', dur: 0.62, fadeIn: 0.03, fadeOut: 0.2, events: { hit: 0.14 },
  keys: mergeKeys(
    [grip(0, LOW), grip(0.62, LOW, 'inOut')],
    [
      key(0, I({ hips: [0, 14, 0], chest: [6, 16, 0], 'upperarm.L': [-74, 0, 28], 'forearm.L': [-70, 0, 0] })),
      key(0.14, I({ hips: [8, -20, 0], spine: [14, -14, 0], chest: [12, -24, 0], head: [-14, 18, 0], 'upperarm.L': [-80, 0, -20], 'forearm.L': [-60, 0, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [48, 0, 0], 'thigh.R': [32, 0, -6], 'shin.R': [24, 0, 0], 'foot.R': [16, 0, 0] }), [0, -0.16, 0.24], 'outExpo'),
      key(0.3, I({ hips: [8, -20, 0], spine: [14, -14, 0], chest: [12, -24, 0], head: [-14, 18, 0], 'upperarm.L': [-78, 0, -18], 'forearm.L': [-64, 0, 0], 'thigh.L': [-48, 0, 6], 'shin.L': [46, 0, 0], 'thigh.R': [30, 0, -6] }), [0, -0.16, 0.22], 'out'),
      key(0.62, I(), [0, -0.04, 0], 'inOut'),
    ],
  ),
};

/** G: the roar — chest thrown out, head back, arms spread and fists clenched */
const roar: ClipDef = {
  name: 'km_roar', dur: 1.25, fadeIn: 0.08, fadeOut: 0.3, events: { roar: 0.34 },
  keys: mergeKeys(
    [grip(0, LOW), grip(0.3, { p: [-0.68, -0.24, 0.2], dir: [-0.3, -0.7, 0.64], edge: [0.1, -0.68, -0.73], pole: [-0.6, -0.4, -0.6] }, 'out'), grip(0.95, { p: [-0.68, -0.24, 0.2], dir: [-0.3, -0.7, 0.64], edge: [0.1, -0.68, -0.73], pole: [-0.6, -0.4, -0.6] }), grip(1.25, LOW, 'inOut')],
    [
      key(0, I()),
      key(0.24, I({ hips: [8, 0, 0], spine: [16, 0, 0], chest: [12, 0, 0], neck: [4, 0, 0], head: [6, 0, 0], 'thigh.L': [-26, 0, 12], 'shin.L': [36, 0, 0], 'thigh.R': [-14, 0, -12], 'shin.R': [32, 0, 0], 'upperarm.L': [-20, 0, 16], 'forearm.L': [-90, 0, 0] }), [0, -0.14, 0], 'inOut'),
      key(0.34, I({ hips: [-6, 0, 0], spine: [-10, 0, 0], chest: [-14, 0, 0], neck: [-10, 0, 0], head: [-24, 0, 0], 'thigh.L': [-14, 0, 16], 'shin.L': [20, 0, 0], 'thigh.R': [-6, 0, -16], 'shin.R': [18, 0, 0], 'upperarm.L': [-30, 0, 60], 'forearm.L': [-40, 0, 0] }), [0, -0.06, 0], 'outExpo'),
      key(0.95, I({ hips: [-5, 0, 0], spine: [-8, 0, 0], chest: [-12, 0, 0], neck: [-9, 0, 0], head: [-22, 0, 0], 'thigh.L': [-14, 0, 16], 'shin.L': [20, 0, 0], 'thigh.R': [-6, 0, -16], 'shin.R': [18, 0, 0], 'upperarm.L': [-28, 0, 58], 'forearm.L': [-44, 0, 0] }), [0, -0.06, 0], 'out'),
      key(1.25, I(), [0, -0.04, 0], 'inOut'),
    ],
  ),
};

/** Q (Shikai / Bankai): the lunging straight left that a giant fist copies */
const fist: ClipDef = {
  name: 'km_fist', dur: 0.95, fadeIn: 0.06, fadeOut: 0.24, events: { step: 0.18, hit: 0.3 },
  keys: mergeKeys(
    [grip(0, LOW), grip(0.3, { ...LOW, p: [-0.6, -0.4, -0.06] }, 'outExpo'), grip(0.95, LOW, 'inOut')],
    [
      key(0, I()),
      key(0.18, I({ hips: [0, 22, 0], spine: [4, 14, 0], chest: [0, 18, 0], head: [-6, -18, 0], 'upperarm.L': [30, 0, 24], 'forearm.L': [-120, 0, 0], 'thigh.L': [-8, 0, 8], 'thigh.R': [14, 0, -8], 'shin.R': [24, 0, 0] }), [0, -0.08, -0.06], 'inOut'),
      key(0.3, I({ hips: [6, -10, 0], spine: [10, -16, 0], chest: [10, -34, 0], head: [-10, 26, 0], 'upperarm.L': [-92, 0, -6], 'forearm.L': [-4, 0, 0], 'hand.L': [0, 0, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [50, 0, 0], 'foot.L': [-6, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [24, 0, 0], 'foot.R': [16, 0, 0] }), [0, -0.2, 0.28], 'outExpo'),
      key(0.48, I({ hips: [6, -10, 0], spine: [10, -16, 0], chest: [10, -32, 0], head: [-10, 24, 0], 'upperarm.L': [-88, 0, -4], 'forearm.L': [-8, 0, 0], 'thigh.L': [-48, 0, 6], 'shin.L': [48, 0, 0], 'thigh.R': [28, 0, -6] }), [0, -0.2, 0.27], 'out'),
      key(0.95, I(), [0, -0.04, 0], 'inOut'),
    ],
  ),
};

/** E (Shikai / Bankai): the stomp — the right knee drawn high, then the foot driven down */
const stomp: ClipDef = {
  name: 'km_stomp', dur: 1.0, fadeIn: 0.06, fadeOut: 0.26, events: { lift: 0.12, stomp: 0.44 },
  keys: mergeKeys(
    [grip(0, LOW), grip(0.3, { ...LOW, p: [-0.62, -0.36, 0.18] }, 'inOut'), grip(0.44, { ...LOW, p: [-0.56, -0.52, 0.26] }, 'outExpo'), grip(1.0, LOW, 'inOut')],
    [
      key(0, I()),
      key(0.3, I({ hips: [-6, -6, 0], spine: [-6, 0, 0], chest: [-8, 4, 0], head: [6, 0, 0], 'thigh.R': [-86, 0, -10], 'shin.R': [96, 0, 0], 'foot.R': [20, 0, 0], 'thigh.L': [-4, 0, 6], 'shin.L': [14, 0, 0], 'upperarm.L': [-20, 0, 52], 'forearm.L': [-40, 0, 0] }), [0, 0.06, -0.04], 'inOut'),
      key(0.44, I({ hips: [12, -4, 0], spine: [14, 0, 0], chest: [10, 4, 0], head: [-14, 0, 0], 'thigh.R': [-34, 0, -12], 'shin.R': [30, 0, 0], 'foot.R': [-4, 0, 0], 'thigh.L': [16, 0, 8], 'shin.L': [40, 0, 0], 'upperarm.L': [-6, 0, 40], 'forearm.L': [-30, 0, 0] }), [0, -0.22, 0.12], 'outExpo'),
      key(0.62, I({ hips: [12, -4, 0], spine: [14, 0, 0], chest: [10, 4, 0], head: [-14, 0, 0], 'thigh.R': [-34, 0, -12], 'shin.R': [32, 0, 0], 'thigh.L': [16, 0, 8], 'shin.L': [40, 0, 0], 'upperarm.L': [-6, 0, 38] }), [0, -0.22, 0.12], 'out'),
      key(1.0, I(), [0, -0.04, 0], 'inOut'),
    ],
  ),
};

/** F (sealed): "Todoroke, Tenken" — the sword raised upright before him, then swept down to his side */
const shikai: ClipDef = {
  name: 'km_shikai', dur: 1.4, fadeIn: 0.1, fadeOut: 0.3, events: { word: 0.3, form: 0.72 },
  keys: mergeKeys(
    [
      grip(0, LOW),
      grip(0.32, { p: [-0.24, 0.1, 0.5], dir: [0.02, 0.98, 0.18], edge: [0, 0.18, -0.98], pole: [-0.7, -0.5, -0.3] }, 'out'),
      grip(0.62, { p: [-0.25, 0.12, 0.5], dir: [0.02, 0.98, 0.18], edge: [0, 0.18, -0.98], pole: [-0.7, -0.5, -0.3] }, 'linear'),
      grip(0.8, { p: [-0.62, -0.36, 0.3], dir: [-0.3, -0.62, 0.72], edge: [0.1, -0.72, -0.66], pole: [-0.7, -0.4, -0.6] }, 'outExpo'),
      grip(1.4, LOW, 'inOut'),
    ],
    [
      key(0, I()),
      key(0.32, I({ head: [-10, -4, 0], chest: [-4, 4, 0], 'upperarm.L': [-6, 0, 20], 'forearm.L': [-30, 0, 0] }), [0, -0.04, 0], 'out'),
      key(0.62, I({ head: [-12, -4, 0], chest: [-6, 4, 0], 'upperarm.L': [-6, 0, 22], 'forearm.L': [-30, 0, 0] }), [0, -0.04, 0], 'linear'),
      key(0.8, I({ hips: [6, 10, 0], spine: [10, 8, 0], chest: [8, 14, 0], head: [-14, -10, 0], 'thigh.L': [-30, 0, 8], 'shin.L': [30, 0, 0], 'thigh.R': [16, 0, -8], 'upperarm.L': [-10, 0, 40], 'forearm.L': [-30, 0, 0] }), [0, -0.12, 0.06], 'outExpo'),
      key(1.4, I(), [0, -0.04, 0], 'inOut'),
    ],
  ),
};

/** F (Shikai): "Bankai" — Tenken raised high over his head in both hands while the giant rises behind him */
const bankai: ClipDef = {
  name: 'km_bankai', dur: 2.2, fadeIn: 0.12, fadeOut: 0.35, events: { word: 0.4, rise: 0.7, form: 1.5 },
  keys: mergeKeys(
    [
      grip(0, LOW),
      grip(0.5, { p: [-0.06, 0.62, 0.22], dir: [0.02, 0.96, 0.28], edge: [0, 0.28, -0.96], pole: [-0.8, -0.2, -0.5] }, 'inOut', 1),
      grip(1.7, { p: [-0.06, 0.64, 0.22], dir: [0.02, 0.96, 0.28], edge: [0, 0.28, -0.96], pole: [-0.8, -0.2, -0.5] }, 'linear', 1),
      grip(2.2, LOW, 'inOut'),
    ],
    [
      key(0, I()),
      key(0.5, I({ hips: [-2, 0, 0], spine: [-8, 0, 0], chest: [-10, 0, 0], neck: [-6, 0, 0], head: [-14, 0, 0], 'thigh.L': [-16, 0, 14], 'shin.L': [20, 0, 0], 'thigh.R': [-6, 0, -14], 'shin.R': [18, 0, 0] }), [0, -0.06, 0], 'inOut'),
      key(1.7, I({ hips: [-3, 0, 0], spine: [-9, 0, 0], chest: [-11, 0, 0], neck: [-6, 0, 0], head: [-16, 0, 0], 'thigh.L': [-16, 0, 14], 'shin.L': [20, 0, 0], 'thigh.R': [-6, 0, -14], 'shin.R': [18, 0, 0] }), [0, -0.07, 0], 'linear'),
      key(2.2, I(), [0, -0.04, 0], 'inOut'),
    ],
  ),
};

/** F (Bankai): the One Blow — wound far back over his right shoulder, then one full-weight cut */
const oneBlow: ClipDef = {
  name: 'km_oneblow', dur: 1.7, fadeIn: 0.1, fadeOut: 0.32, events: { charge: 0.1, step: 0.78, hit: 0.88, blow: 0.9 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [1, -0.45, 0], c: SH, r: 0.74, pole: [-0.5, -0.6, -0.6],
      keys: [[0, -60, 'out'], [0.5, -150, 'inOut'], [0.8, -156, 'linear'], [0.9, 40, 'outExpo'], [1.1, 120, 'out'], [1.7, 80, 'inOut']],
      twoHand: [0.2, 1, 1, 0.6, 0, 0],
    }),
    [
      key(0, I()),
      key(0.5, I({ hips: [0, -40, 0], spine: [4, -20, 0], chest: [-4, -30, 0], head: [-8, 34, 0], 'thigh.L': [-18, 0, 10], 'thigh.R': [18, 0, -8], 'shin.R': [28, 0, 0] }), [0, -0.1, -0.06], 'inOut'),
      key(0.8, I({ hips: [0, -44, 0], spine: [4, -22, 0], chest: [-4, -32, 0], head: [-8, 36, 0], 'thigh.L': [-20, 0, 10], 'thigh.R': [20, 0, -8], 'shin.R': [30, 0, 0] }), [0, -0.12, -0.07], 'linear'),
      key(0.9, I({ hips: [8, 26, 0], spine: [16, 18, 0], chest: [12, 30, 0], head: [-16, -22, 0], 'thigh.L': [-56, 0, 8], 'shin.L': [60, 0, 0], 'foot.L': [-6, 0, 0], 'thigh.R': [32, 0, -6], 'shin.R': [36, 0, 0], 'upperarm.L': [-4, 0, 50], 'forearm.L': [-24, 0, 0] }), [0, -0.26, 0.2], 'outExpo'),
      key(1.1, I({ hips: [10, 30, 0], spine: [18, 20, 0], chest: [14, 34, 0], head: [-18, -26, 0], 'thigh.L': [-58, 0, 8], 'shin.L': [62, 0, 0], 'thigh.R': [34, 0, -6], 'shin.R': [38, 0, 0], 'upperarm.L': [0, 0, 54] }), [0, -0.27, 0.21], 'out'),
      key(1.7, I(), [0, -0.04, 0], 'inOut'),
    ],
  ),
};

export const KOMAMURA_CLIPS: ClipDef[] = [
  cut1, cut2, punch, cut3, draw, throwK, haymaker, guard, shove, roar, fist, stomp, shikai, bankai, oneBlow,
  ...ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name)),
];
export const KOMAMURA_CHAIN = ['km_cut1', 'km_cut2', 'km_punch', 'km_cut3'];
