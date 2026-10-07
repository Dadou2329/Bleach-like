// Ukitake's animation set. Sealed: upright and calm, the katana low in the right hand; quick, precise cuts
// at vital points and a thrust; the iai-like step-in slash with both hands; Bakudō #8 Seki pushed out of
// the open left palm; Hadō #31 Shakkahō from the left hand; Kaidō, the left hand glowing over his chest;
// the coughing fit (a hand to the mouth, doubled over). The release: the sword held upright in both hands
// while he speaks the command, then the hands draw apart and the blade comes apart into two.
// Shikai: a blade in each hand, the left one held low in front (the intake), the right ready; the twin
// dance; the rope lashed across between the two hilts; the absorbing guard (the left blade raised at the
// attack) and the return (the right blade thrust out); the charms shaken bright.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

const IDLE: Record<string, E> = {
  hips: [0, -6, 0], spine: [3, 2, 0], chest: [3, 2, 0], neck: [5, 0, 0], head: [-2, -4, 2],
  'thigh.L': [-5, 0, 4], 'shin.L': [8, 0, 0], 'foot.L': [-2, 0, 0], 'thigh.R': [4, 0, -3], 'shin.R': [6, 0, 0], 'foot.R': [-6, 0, 0],
  'upperarm.L': [4, 0, 8], 'forearm.L': [-16, 0, 0], 'hand.L': [6, 0, 0],
};
const I = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });

/** the left blade held low in front, point forward (the intake) */
const GUARD_L: Record<string, E> = { 'upperarm.L': [-24, 0, 16], 'forearm.L': [-42, 0, 0], 'hand.L': [74, 0, 0] };
const DUAL: Record<string, E> = { ...IDLE, hips: [0, -10, 0], spine: [4, 4, 0], chest: [2, 6, 0], head: [-4, -6, 2], 'thigh.L': [-12, 0, 8], 'shin.L': [14, 0, 0], 'thigh.R': [8, 0, -8], 'shin.R': [14, 0, 0], ...GUARD_L };
const D = (over: Record<string, E> = {}): Record<string, E> => ({ ...DUAL, ...over });
/** the left blade raised at the attack */
const RAISE_L: Record<string, E> = { 'upperarm.L': [-64, -8, 10], 'forearm.L': [-26, 0, 0], 'hand.L': [70, 0, 0] };

/** the katana low in the right hand, point forward */
const LOW = { p: [-0.3, -0.4, 0.14] as E, dir: [-0.1, -0.68, 0.72] as E, edge: [0, -0.72, -0.68] as E, pole: [-0.6, -0.3, -0.75] as E };
/** a Shikai blade in the right hand, in guard */
const LOW_S = { p: [-0.32, -0.3, 0.12] as E, dir: [-0.25, -0.3, 0.92] as E, edge: [0, -0.95, -0.3] as E, pole: [-0.65, -0.4, -0.6] as E };
/** the right blade drawn back low (behind the absorbing guard) */
const BACK_S = { p: [-0.36, -0.22, -0.12] as E, dir: [-0.3, -0.5, -0.8] as E, edge: [0, -0.85, 0.5] as E, pole: [-0.8, -0.3, 0.4] as E };
/** the right blade thrust out at the target */
const OUT_S = { p: [-0.1, 0.08, 0.56] as E, dir: [0.05, 0.05, 1] as E, edge: [0, -1, 0.05] as E, pole: [-0.7, -0.6, 0] as E };
type Grip = typeof LOW;
const ik = (g: Grip, two = 0) => ({ '@gripR': g.p, '@dirR': g.dir, '@edgeR': g.edge, '@poleR': g.pole, '@ikR': [1, 0, 0] as E, '@twoHand': [two, 0, 0] as E });

export const UKITAKE_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.02,
  run: { spine: [12, 0, 0], chest: [6, 0, 0], head: [-8, 0, 0], 'upperarm.L': [16, 0, 10], 'forearm.L': [-30, 0, 0] },
  sprint: { spine: [20, 0, 0], chest: [10, 0, 0], head: [-14, 0, 0], 'upperarm.L': [44, 0, 12], 'forearm.L': [-26, 0, 0] },
  swingL: 0.5,
  swingR: 0.15,
  freqScale: 0.92,
  grip: {
    idle: LOW,
    walk: LOW,
    run: { p: [-0.3, -0.26, -0.08], dir: [-0.2, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.3, -0.16, -0.18], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.38, -0.1, 0.1], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

export const SOGYO_STANCE: StanceDef = {
  idle: DUAL,
  idleHips: -0.05,
  run: { spine: [14, 0, 0], chest: [6, 0, 0], head: [-8, 0, 0], 'upperarm.L': [30, 0, 18], 'forearm.L': [-40, 0, 0], 'hand.L': [20, 0, 0] },
  sprint: { spine: [20, 0, 0], chest: [10, 0, 0], head: [-14, 0, 0], 'upperarm.L': [50, 0, 16], 'forearm.L': [-30, 0, 0], 'hand.L': [10, 0, 0] },
  swingL: 0.1,
  swingR: 0.1,
  freqScale: 0.92,
  grip: {
    idle: LOW_S,
    walk: LOW_S,
    run: { p: [-0.32, -0.24, -0.1], dir: [-0.2, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.32, -0.14, -0.2], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.4, -0.08, 0.1], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

const SH: E = [-0.22, 0.2, 0.04];

/**
 * The sealed cuts: quick and exact. Each arc crosses the front a little after 'hit' opens the window (the
 * windup turns him right, the cut brings him back through square).
 */
const cut = (name: string, kind: 0 | 1 | 2): ClipDef => ({
  name, dur: 0.52, fadeIn: 0.04, fadeOut: 0.18, events: { step: 0.05, hit: 0.13, combo: 0.24 },
  keys: mergeKeys(
    swingKeys(kind === 0
      ? { a: [0, 0, 1], b: [1, -0.1, 0], c: SH, r: 0.4, pole: [-0.5, -0.65, -0.55], keys: [[0, -60, 'out'], [0.1, -110, 'out'], [0.18, 34, 'out'], [0.3, 90, 'out'], [0.52, 50, 'inOut']] }
      : kind === 1
        ? { a: [0, 0, 1], b: [-0.85, 0.52, 0], c: [-0.1, 0.12, 0.06], r: 0.4, pole: [-0.3, -0.4, -0.85], keys: [[0, -130, 'out'], [0.1, -116, 'out'], [0.18, 46, 'out'], [0.3, 96, 'out'], [0.52, 60, 'inOut']] }
        : { a: [0, 0, 1], b: [0, -1, 0], c: [-0.04, 0.22, 0.1], r: 0.42, pole: [-0.7, -0.2, -0.65], keys: [[0, 30, 'out'], [0.1, -122, 'out'], [0.18, 8, 'out'], [0.3, 22, 'out'], [0.52, 40, 'inOut']] }),
    [
      key(0, I()),
      key(0.1, I(kind === 1 ? { hips: [2, 14, 0], spine: [5, 10, 0], chest: [5, 14, 0], head: [-6, -8, 2] } : kind === 2 ? { hips: [-2, -8, 0], spine: [-4, -6, 0], chest: [-6, -8, 0], head: [-4, 8, 2] } : { hips: [2, -20, 0], spine: [5, -10, 0], chest: [4, -12, 0], head: [-6, 14, 2] }), [0, -0.03, 0], 'out'),
      key(0.18, I(kind === 1
        ? { hips: [2, -14, 0], spine: [5, -10, 0], chest: [4, -16, 0], head: [-6, 14, 2], 'thigh.L': [-22, 0, 5], 'shin.L': [24, 0, 0] }
        : kind === 2
          ? { hips: [6, 2, 0], spine: [9, 0, 0], chest: [7, 2, 0], head: [-8, 0, 2], 'thigh.L': [-26, 0, 5], 'shin.L': [28, 0, 0], 'thigh.R': [12, 0, -5] }
          : { hips: [4, 10, 0], spine: [7, 8, 0], chest: [5, 14, 0], head: [-6, -4, 2], 'thigh.L': [-24, 0, 5], 'shin.L': [26, 0, 0], 'thigh.R': [12, 0, -5] }), [0, -0.06, 0.06], 'out'),
      key(0.52, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
});

/** the thrust at a vital point: drawn back to the hip, then straight out with a long step */
const thrust: ClipDef = {
  name: 'uk_cut4', dur: 0.62, fadeIn: 0.05, fadeOut: 0.2, events: { step: 0.1, hit: 0.18, combo: 0.32 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(LOW) },
      { t: 0.1, ease: 'inOut', c: ik({ p: [-0.26, -0.12, -0.12], dir: [0, 0.02, 1], edge: [0, -1, 0.02], pole: [-0.9, -0.2, -0.3] }) },
      { t: 0.2, ease: 'out', c: ik({ p: [-0.08, 0.04, 0.62], dir: [0.04, 0, 1], edge: [0, -1, 0], pole: [-0.8, -0.5, 0] }) },
      { t: 0.36, ease: 'inOut', c: ik({ p: [-0.1, 0.02, 0.56], dir: [0.04, 0, 1], edge: [0, -1, 0], pole: [-0.8, -0.5, 0] }) },
      { t: 0.62, ease: 'inOut', c: ik(LOW) },
    ],
    [
      key(0, I()),
      key(0.1, I({ hips: [0, -26, 0], spine: [2, -12, 0], chest: [0, -14, 0], head: [-4, 20, 2], 'thigh.L': [-10, 0, 6], 'thigh.R': [8, 0, -6] }), [0, -0.04, -0.02], 'inOut'),
      key(0.2, I({ hips: [6, 10, 0], spine: [10, 6, 0], chest: [6, 8, 0], head: [-10, -6, 2], 'thigh.L': [-40, 0, 6], 'shin.L': [42, 0, 0], 'thigh.R': [22, 0, -6], 'shin.R': [18, 0, 0], 'upperarm.L': [30, 0, 20], 'forearm.L': [-20, 0, 0] }), [0, -0.12, 0.14], 'out'),
      key(0.62, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** RMB (sealed): the step-in slash — both hands, from over the right shoulder down across */
const iai: ClipDef = {
  name: 'uk_iai', dur: 0.8, fadeIn: 0.06, fadeOut: 0.24, events: { step: 0.14, hit: 0.26 },
  keys: mergeKeys(
    swingKeys({ a: [0, 0, 1], b: [0.62, -0.78, 0], c: [-0.06, 0.24, 0.08], r: 0.44, pole: [-0.6, -0.3, -0.7], keys: [[0, 10, 'out'], [0.16, -150, 'inOut'], [0.3, 24, 'out'], [0.44, 50, 'out'], [0.8, 40, 'inOut']], twoHand: [0, 1, 1, 1, 0] }),
    [
      key(0, I()),
      key(0.16, I({ hips: [-2, -18, 0], spine: [-6, -8, 0], chest: [-8, -10, 0], head: [-2, 14, 0], 'thigh.L': [-18, 0, 8], 'thigh.R': [10, 0, -8] }), [0, 0.02, -0.04], 'inOut'),
      key(0.3, I({ hips: [10, 12, 0], spine: [12, 8, 0], chest: [8, 10, 0], head: [-10, -6, 0], 'thigh.L': [-48, 0, 8], 'shin.L': [52, 0, 0], 'thigh.R': [26, 0, -8], 'shin.R': [24, 0, 0] }), [0, -0.16, 0.2], 'out'),
      key(0.8, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** Q (sealed): Bakudō #8 Seki — the open left palm pushed out, a flat disc of light that throws back */
const seki: ClipDef = {
  name: 'uk_seki', dur: 0.6, fadeIn: 0.04, fadeOut: 0.2, events: { cast: 0.12 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 0.6, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.1, I({ hips: [0, -16, 0], spine: [2, -8, 0], chest: [0, -10, 0], head: [-4, 10, 0], 'upperarm.L': [-84, -10, 6], 'forearm.L': [-4, 0, 0], 'hand.L': [72, 0, 0], 'thigh.L': [-16, 0, 6], 'shin.L': [16, 0, 0] }), [0, -0.03, 0.02], 'out'),
      key(0.32, I({ hips: [0, -16, 0], spine: [2, -8, 0], chest: [0, -10, 0], head: [-4, 10, 0], 'upperarm.L': [-80, -10, 6], 'forearm.L': [-8, 0, 0], 'hand.L': [70, 0, 0], 'thigh.L': [-16, 0, 6], 'shin.L': [16, 0, 0] }), [0, -0.03, 0.02], 'inOut'),
      key(0.6, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** E (sealed): Hadō #31 Shakkahō — the left hand out, the red ball swelling at the palm, fired */
const shakkaho: ClipDef = {
  name: 'uk_shakkaho', dur: 0.85, fadeIn: 0.06, fadeOut: 0.22, events: { charge: 0.1, fire: 0.42 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 0.85, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.12, I({ hips: [0, -18, 0], spine: [2, -10, 0], chest: [0, -12, 0], head: [-4, 12, 0], 'upperarm.L': [-80, -12, 6], 'forearm.L': [-14, 0, 0], 'hand.L': [60, 0, 0], 'thigh.L': [-18, 0, 6], 'shin.L': [18, 0, 0] }), [0, -0.04, 0], 'inOut'),
      key(0.42, I({ hips: [0, -18, 0], spine: [2, -10, 0], chest: [0, -12, 0], head: [-4, 12, 0], 'upperarm.L': [-84, -12, 6], 'forearm.L': [-6, 0, 0], 'hand.L': [64, 0, 0], 'thigh.L': [-18, 0, 6], 'shin.L': [18, 0, 0] }), [0, -0.04, 0.02], 'linear'),
      key(0.5, I({ hips: [-2, -16, 0], spine: [-2, -8, 0], chest: [-4, -10, 0], head: [-2, 10, 0], 'upperarm.L': [-96, -12, 6], 'forearm.L': [-10, 0, 0], 'hand.L': [50, 0, 0], 'thigh.L': [-14, 0, 6], 'shin.L': [14, 0, 0] }), [0, -0.03, -0.02], 'out'),
      key(0.85, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** R: Kaidō — the left hand laid on his chest, glowing green, the head bowed */
const kaido: ClipDef = {
  name: 'uk_kaido', dur: 1.3, fadeIn: 0.12, fadeOut: 0.3, events: { heal: 0.3 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 1.3, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.3, I({ spine: [4, 0, 0], chest: [6, 0, 0], neck: [8, 0, 0], head: [10, 0, 0], 'upperarm.L': [-30, -40, -10], 'forearm.L': [-100, 0, 0], 'hand.L': [10, 0, -10] }), [0, -0.03, 0], 'inOut'),
      key(1.0, I({ spine: [4, 0, 0], chest: [6, 0, 0], neck: [8, 0, 0], head: [12, 0, 0], 'upperarm.L': [-32, -40, -10], 'forearm.L': [-102, 0, 0], 'hand.L': [10, 0, -10] }), [0, -0.03, 0], 'linear'),
      key(1.3, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** his illness: a coughing fit — doubled over, the free hand to his mouth */
const cough: ClipDef = {
  name: 'uk_cough', dur: 1.2, fadeIn: 0.08, fadeOut: 0.3, events: { cough: 0.22, blood: 0.5 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 1.2, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.2, I({ hips: [6, 0, 0], spine: [14, 0, 0], chest: [16, 0, 0], neck: [10, 0, 0], head: [12, 0, 0], 'upperarm.L': [-40, -46, -10], 'forearm.L': [-118, 0, 0], 'hand.L': [-10, 0, 0], 'thigh.L': [-10, 0, 4], 'shin.L': [16, 0, 0], 'thigh.R': [-6, 0, -4], 'shin.R': [14, 0, 0] }), [0, -0.06, -0.02], 'out'),
      key(0.34, I({ hips: [4, 0, 0], spine: [10, 0, 0], chest: [10, 0, 0], neck: [6, 0, 0], head: [6, 0, 0], 'upperarm.L': [-40, -46, -10], 'forearm.L': [-118, 0, 0], 'hand.L': [-10, 0, 0], 'thigh.L': [-10, 0, 4], 'shin.L': [16, 0, 0], 'thigh.R': [-6, 0, -4], 'shin.R': [14, 0, 0] }), [0, -0.05, 0], 'inOut'),
      key(0.5, I({ hips: [8, 0, 0], spine: [16, 0, 0], chest: [18, 0, 0], neck: [12, 0, 0], head: [14, 0, 0], 'upperarm.L': [-40, -46, -10], 'forearm.L': [-118, 0, 0], 'hand.L': [-10, 0, 0], 'thigh.L': [-12, 0, 4], 'shin.L': [20, 0, 0], 'thigh.R': [-8, 0, -4], 'shin.R': [18, 0, 0] }), [0, -0.08, -0.02], 'out'),
      key(0.8, I({ hips: [4, 0, 0], spine: [8, 0, 0], chest: [8, 0, 0], neck: [6, 0, 0], head: [4, 0, 0], 'upperarm.L': [-20, -30, -4], 'forearm.L': [-80, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.04, 0], 'inOut'),
      key(1.2, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** F (sealed): "Nami kotogotoku…" — the sword upright in both hands, then drawn apart into two */
const release: ClipDef = {
  name: 'uk_release', dur: 1.6, fadeIn: 0.1, fadeOut: 0.3, events: { chant: 0.15, split: 1.0 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(LOW) },
      { t: 0.3, ease: 'inOut', c: ik({ p: [-0.04, 0.02, 0.34], dir: [0.02, 1, 0.12], edge: [0, -0.12, 1], pole: [-0.8, -0.4, -0.3] }, 1) },
      { t: 1.0, c: ik({ p: [-0.04, 0.04, 0.34], dir: [0.02, 1, 0.12], edge: [0, -0.12, 1], pole: [-0.8, -0.4, -0.3] }, 1) },
      { t: 1.25, ease: 'out', c: ik({ p: [-0.36, -0.18, 0.2], dir: [-0.4, -0.2, 0.9], edge: [0, -0.98, -0.2], pole: [-0.65, -0.4, -0.6] }) },
      { t: 1.6, ease: 'inOut', c: ik(LOW_S) },
    ],
    [
      key(0, I()),
      key(0.3, I({ spine: [2, 0, 0], chest: [0, 0, 0], head: [2, 0, 0], 'thigh.L': [-10, 0, 8], 'thigh.R': [6, 0, -8] }), [0, -0.02, 0], 'inOut'),
      key(1.0, I({ spine: [0, 0, 0], chest: [-2, 0, 0], head: [-2, 0, 0], 'thigh.L': [-10, 0, 8], 'thigh.R': [6, 0, -8] }), [0, -0.02, 0], 'linear'),
      key(1.25, D({ hips: [0, 0, 0], spine: [4, 0, 0], chest: [2, 0, 0], head: [-4, 0, 0], 'upperarm.L': [-30, 0, 40], 'forearm.L': [-30, 0, 0], 'hand.L': [60, 0, 0] }), [0, -0.06, 0], 'out'),
      key(1.6, D(), [0, -0.05, 0], 'inOut'),
    ],
  ),
};

// ------------------------------------------------------------------ Shikai

/** a cut from the right blade */
const twinR = (name: string, kind: 0 | 1): ClipDef => ({
  name, dur: 0.5, fadeIn: 0.04, fadeOut: 0.2, events: { step: 0.05, hit: 0.13, combo: 0.23 },
  keys: mergeKeys(
    swingKeys(kind === 0
      ? { a: [0, 0, 1], b: [-0.85, 0.52, 0], c: [-0.1, 0.12, 0.06], r: 0.42, pole: [-0.3, -0.4, -0.85], keys: [[0, -60, 'out'], [0.1, -122, 'out'], [0.18, 40, 'out'], [0.3, 96, 'out'], [0.5, 40, 'inOut']] }
      : { a: [0, 0, 1], b: [0, -1, 0], c: [-0.1, 0.22, 0.1], r: 0.44, pole: [-0.7, -0.2, -0.65], keys: [[0, -20, 'out'], [0.1, -124, 'out'], [0.18, 6, 'out'], [0.3, 20, 'out'], [0.5, 30, 'inOut']] }),
    [
      key(0, D()),
      key(0.1, D({ hips: [2, -18, 0], spine: [6, -10, 0], chest: [4, -12, 0], head: [-6, 12, 2] }), [0, -0.06, 0], 'out'),
      key(0.18, D(kind === 0 ? { hips: [4, 12, 0], spine: [8, 8, 0], chest: [6, 14, 0], head: [-6, -6, 2], 'thigh.L': [-28, 0, 8], 'shin.L': [30, 0, 0], 'thigh.R': [14, 0, -8] } : { hips: [6, 2, 0], spine: [9, 0, 0], chest: [7, 2, 0], head: [-8, 0, 2], 'thigh.L': [-28, 0, 8], 'shin.L': [30, 0, 0], 'thigh.R': [14, 0, -8] }), [0, -0.1, 0.06], 'out'),
      key(0.5, D(), [0, -0.05, 0], 'inOut'),
    ],
  ),
});

/** the left blade's cut: a flat sweep right to left across his front while the right holds guard */
const twinL: ClipDef = {
  name: 'uk_twin2', dur: 0.5, fadeIn: 0.04, fadeOut: 0.2, events: { step: 0.05, hitL: 0.13, combo: 0.23 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW_S) }, { t: 0.5, c: ik(LOW_S) }],
    [
      key(0, D()),
      key(0.1, D({ hips: [2, 24, 0], spine: [6, 12, 0], chest: [4, 16, 0], head: [-6, -14, 2], 'upperarm.L': [-60, 70, 30], 'forearm.L': [-50, 0, 0], 'hand.L': [10, 0, -20] }), [0, -0.06, 0], 'out'),
      key(0.18, D({ hips: [4, -16, 0], spine: [8, -10, 0], chest: [6, -14, 0], head: [-6, 12, 2], 'upperarm.L': [-80, -40, 50], 'forearm.L': [-6, 0, 0], 'hand.L': [0, 0, 10], 'thigh.L': [-28, 0, 8], 'shin.L': [30, 0, 0], 'thigh.R': [14, 0, -8] }), [0, -0.1, 0.06], 'out'),
      key(0.3, D({ hips: [4, -20, 0], spine: [8, -12, 0], chest: [6, -16, 0], head: [-6, 14, 2], 'upperarm.L': [-60, -60, 60], 'forearm.L': [-10, 0, 0], 'hand.L': [0, 0, 20], 'thigh.L': [-28, 0, 8], 'shin.L': [30, 0, 0], 'thigh.R': [14, 0, -8] }), [0, -0.1, 0.06], 'out'),
      key(0.5, D(), [0, -0.05, 0], 'inOut'),
    ],
  ),
};

/** both blades raised and brought down crossing: an X */
const cross: ClipDef = {
  name: 'uk_twin3', dur: 0.6, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.08, hit: 0.2, hitL: 0.22, combo: 0.32 },
  keys: mergeKeys(
    swingKeys({ a: [0, 0, 1], b: [0.45, -0.89, 0], c: [-0.06, 0.2, 0.1], r: 0.44, pole: [-0.7, -0.2, -0.65], keys: [[0, -20, 'out'], [0.12, -130, 'inOut'], [0.22, 16, 'out'], [0.34, 30, 'out'], [0.6, 30, 'inOut']] }),
    [
      key(0, D()),
      key(0.12, D({ hips: [-4, 0, 0], spine: [-4, 0, 0], chest: [-6, 0, 0], head: [-2, 0, 0], 'upperarm.L': [-160, -10, 10], 'forearm.L': [-30, 0, 0], 'hand.L': [-20, 0, 0], 'thigh.L': [-14, 0, 8], 'thigh.R': [10, 0, -8] }), [0, 0.02, -0.02], 'inOut'),
      key(0.24, D({ hips: [10, 0, 0], spine: [12, 0, 0], chest: [8, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-50, 30, -10], 'forearm.L': [-10, 0, 0], 'hand.L': [10, 0, 0], 'thigh.L': [-44, 0, 8], 'shin.L': [48, 0, 0], 'thigh.R': [22, 0, -8], 'shin.R': [22, 0, 0] }), [0, -0.16, 0.18], 'out'),
      key(0.6, D(), [0, -0.05, 0], 'inOut'),
    ],
  ),
};

/** the turning double cut: arms out, both blades round once */
const whirl: ClipDef = {
  name: 'uk_twin4', dur: 0.72, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.06, hit: 0.2, hitL: 0.26, combo: 0.45 },
  keys: mergeKeys(
    [
      { t: 0, c: { ...ik(LOW_S), '@spin': [0, 0, 0] } },
      { t: 0.1, ease: 'out', c: { ...ik({ p: [-0.5, 0.04, 0.08], dir: [-0.98, 0, 0.18], edge: [0.18, 0, 0.98], pole: [-0.2, -1, 0] }), '@spin': [-20, 0, 0] } },
      { t: 0.36, ease: 'inOut', c: { ...ik({ p: [-0.5, 0.04, 0.08], dir: [-0.98, 0, 0.18], edge: [0.18, 0, 0.98], pole: [-0.2, -1, 0] }), '@spin': [360, 0, 0] } },
      { t: 0.72, ease: 'inOut', c: { ...ik(LOW_S), '@spin': [360, 0, 0] } },
    ],
    [
      key(0, D()),
      key(0.1, D({ hips: [0, 0, 0], spine: [2, 0, 0], chest: [0, 0, 0], head: [-4, 0, 0], 'upperarm.L': [0, 0, 84], 'forearm.L': [-6, 0, 0], 'hand.L': [0, 90, 0], 'thigh.L': [-18, 0, 10], 'shin.L': [20, 0, 0], 'thigh.R': [12, 0, -10], 'shin.R': [20, 0, 0] }), [0, -0.1, 0], 'out'),
      key(0.36, D({ hips: [0, 0, 0], spine: [2, 0, 0], chest: [0, 0, 0], head: [-4, 0, 0], 'upperarm.L': [0, 0, 84], 'forearm.L': [-6, 0, 0], 'hand.L': [0, 90, 0], 'thigh.L': [-18, 0, 10], 'shin.L': [20, 0, 0], 'thigh.R': [12, 0, -10], 'shin.R': [20, 0, 0] }), [0, -0.1, 0], 'inOut'),
      key(0.72, D(), [0, -0.05, 0], 'inOut'),
    ],
  ),
};

/** RMB (Shikai): the rope lashed across — the arms flung apart and swept, the rope cutting an arc */
const rope: ClipDef = {
  name: 'uk_rope', dur: 0.8, fadeIn: 0.05, fadeOut: 0.24, events: { step: 0.1, lash: 0.22, end: 0.42 },
  keys: mergeKeys(
    [
      { t: 0, c: ik(LOW_S) },
      { t: 0.14, ease: 'inOut', c: ik({ p: [-0.52, 0.12, -0.14], dir: [-0.9, 0.2, -0.3], edge: [0.3, 0, -0.95], pole: [-0.3, -0.9, 0.2] }) },
      { t: 0.36, ease: 'out', c: ik({ p: [-0.4, 0.1, 0.42], dir: [-0.5, 0.1, 0.86], edge: [0.86, 0, 0.5], pole: [-0.4, -0.9, 0] }) },
      { t: 0.8, ease: 'inOut', c: ik(LOW_S) },
    ],
    [
      key(0, D()),
      key(0.14, D({ hips: [0, 30, 0], spine: [2, 14, 0], chest: [0, 18, 0], head: [-4, -20, 0], 'upperarm.L': [-70, 50, 20], 'forearm.L': [-20, 0, 0], 'hand.L': [40, 0, 0], 'thigh.L': [-16, 0, 10], 'thigh.R': [12, 0, -10] }), [0, -0.06, 0], 'inOut'),
      key(0.36, D({ hips: [4, -28, 0], spine: [6, -14, 0], chest: [4, -18, 0], head: [-6, 18, 0], 'upperarm.L': [-80, -30, 70], 'forearm.L': [-10, 0, 0], 'hand.L': [30, 0, 0], 'thigh.L': [-30, 0, 10], 'shin.L': [30, 0, 0], 'thigh.R': [16, 0, -10] }), [0, -0.1, 0.08], 'out'),
      key(0.8, D(), [0, -0.05, 0], 'inOut'),
    ],
  ),
};

/** Q (Shikai): the absorbing guard — the left blade raised at the attack, the right drawn back */
const absorb: ClipDef = {
  name: 'uk_absorb', dur: 0.5, fadeIn: 0.08, fadeOut: 0.25, events: {},
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW_S) }, { t: 0.2, ease: 'out', c: ik(BACK_S) }, { t: 0.5, c: ik(BACK_S) }],
    [
      key(0, D()),
      key(0.2, D({ hips: [0, 14, 0], spine: [2, 8, 0], chest: [0, 10, 0], head: [-4, -10, 0], ...RAISE_L, 'thigh.L': [-22, 0, 8], 'shin.L': [24, 0, 0], 'thigh.R': [14, 0, -8], 'shin.R': [12, 0, 0] }), [0, -0.08, 0], 'out'),
      key(0.5, D({ hips: [0, 14, 0], spine: [2, 8, 0], chest: [0, 10, 0], head: [-4, -10, 0], ...RAISE_L, 'thigh.L': [-22, 0, 8], 'shin.L': [24, 0, 0], 'thigh.R': [14, 0, -8], 'shin.R': [12, 0, 0] }), [0, -0.08, 0], 'linear'),
    ],
  ),
};

/** E (Shikai): the return — the right blade thrust out, the stored attack leaving its point */
const ret: ClipDef = {
  name: 'uk_return', dur: 0.62, fadeIn: 0.04, fadeOut: 0.22, events: { fire: 0.14 },
  keys: mergeKeys(
    [{ t: 0, c: ik(BACK_S) }, { t: 0.12, ease: 'out', c: ik(OUT_S) }, { t: 0.34, c: ik(OUT_S) }, { t: 0.62, ease: 'inOut', c: ik(LOW_S) }],
    [
      key(0, D({ ...RAISE_L })),
      key(0.12, D({ hips: [4, -18, 0], spine: [6, -10, 0], chest: [4, -12, 0], head: [-6, 10, 0], 'upperarm.L': [10, 0, 30], 'forearm.L': [-30, 0, 0], 'hand.L': [50, 0, 0], 'thigh.L': [-34, 0, 8], 'shin.L': [36, 0, 0], 'thigh.R': [18, 0, -8] }), [0, -0.1, 0.1], 'out'),
      key(0.34, D({ hips: [4, -18, 0], spine: [6, -10, 0], chest: [4, -12, 0], head: [-6, 10, 0], 'upperarm.L': [10, 0, 30], 'forearm.L': [-30, 0, 0], 'hand.L': [50, 0, 0], 'thigh.L': [-34, 0, 8], 'shin.L': [36, 0, 0], 'thigh.R': [18, 0, -8] }), [0, -0.1, 0.1], 'linear'),
      key(0.62, D(), [0, -0.05, 0], 'inOut'),
    ],
  ),
};

/** F (Shikai): the charms — both blades lifted, the rope shaken taut until the five charms blaze */
const charms: ClipDef = {
  name: 'uk_charms', dur: 1.0, fadeIn: 0.08, fadeOut: 0.25, events: { glow: 0.32 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW_S) }, { t: 0.3, ease: 'inOut', c: ik({ p: [-0.3, 0.32, 0.18], dir: [-0.3, 0.9, 0.3], edge: [0, -0.3, 0.95], pole: [-0.6, -0.6, -0.4] }) }, { t: 0.7, c: ik({ p: [-0.3, 0.34, 0.18], dir: [-0.3, 0.9, 0.3], edge: [0, -0.3, 0.95], pole: [-0.6, -0.6, -0.4] }) }, { t: 1.0, ease: 'inOut', c: ik(LOW_S) }],
    [
      key(0, D()),
      key(0.3, D({ hips: [0, 0, 0], spine: [-4, 0, 0], chest: [-6, 0, 0], head: [-8, 0, 0], 'upperarm.L': [-140, 0, 20], 'forearm.L': [-20, 0, 0], 'hand.L': [20, 0, 0], 'thigh.L': [-12, 0, 10], 'thigh.R': [10, 0, -10] }), [0, 0, 0], 'inOut'),
      key(0.7, D({ hips: [0, 0, 0], spine: [-4, 0, 0], chest: [-6, 0, 0], head: [-8, 0, 0], 'upperarm.L': [-142, 0, 22], 'forearm.L': [-20, 0, 0], 'hand.L': [20, 0, 0], 'thigh.L': [-12, 0, 10], 'thigh.R': [10, 0, -10] }), [0, 0, 0], 'linear'),
      key(1.0, D(), [0, -0.05, 0], 'inOut'),
    ],
  ),
};

export const UKITAKE_CLIPS: ClipDef[] = [
  cut('uk_cut1', 0), cut('uk_cut2', 1), cut('uk_cut3', 2), thrust, iai, seki, shakkaho, kaido, cough, release,
  twinR('uk_twin1', 0), twinL, cross, whirl, twinR('uk_twin5', 1), rope, absorb, ret, charms,
  ...ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name)),
];
export const UKITAKE_CHAIN = ['uk_cut1', 'uk_cut2', 'uk_cut3', 'uk_cut4'];
export const SOGYO_CHAIN = ['uk_twin1', 'uk_twin2', 'uk_twin3', 'uk_twin5', 'uk_twin4'];
