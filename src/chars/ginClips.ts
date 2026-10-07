// Gin's animation set. Loose and a little hunched, the head tipped to one side, the left hand lost in its
// sleeve, Shinsō held low and lazily in the right. Light, effortless one-handed flicks; the extension
// thrust (the arm out level, the blade shooting out of the point); the extended sweep (the arm carried
// across while the blade is long); Butō (both hands, the hilt pressed to the middle of the chest); Butō:
// Renjin (the same, again and again); the raised hand of Hakufuku and Korose; the cloth whirl of Sentan
// Hakuja; the eyes opening.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

const IDLE: Record<string, E> = {
  hips: [2, -10, 0], spine: [6, 4, 0], chest: [6, 6, 0], neck: [6, 0, 0], head: [-8, 8, 7],
  'thigh.L': [-8, 0, 4], 'shin.L': [10, 0, 0], 'foot.L': [-2, 0, 0], 'thigh.R': [6, 0, -4], 'shin.R': [12, 0, 0], 'foot.R': [-18, 0, 0],
  'upperarm.L': [6, 0, 8], 'forearm.L': [-16, 0, 0], 'hand.L': [4, 0, 0],
};
const I = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });
/** Shinsō held low and loose, point down and forward */
const LOW = { p: [-0.25, -0.38, 0.12] as E, dir: [-0.1, -0.85, 0.5] as E, edge: [0.05, -0.5, -0.85] as E, pole: [-0.55, -0.3, -0.8] as E };
/** the arm out level in front, the blade pointing at the target */
const OUT = { p: [-0.12, 0.08, 0.5] as E, dir: [0.04, 0, 1] as E, edge: [0, -1, 0] as E, pole: [-0.7, -0.6, 0] as E };
/** Butō: both hands, the hilt pressed to the middle of the chest */
const BUTO = { p: [0, -0.02, 0.2] as E, dir: [0, 0, 1] as E, edge: [0, -1, 0] as E, pole: [-0.8, -0.5, -0.2] as E };
type Grip = typeof LOW;
const ik = (g: Grip, two = 0) => ({ '@gripR': g.p, '@dirR': g.dir, '@edgeR': g.edge, '@poleR': g.pole, '@ikR': [1, 0, 0] as E, '@twoHand': [two, 0, 0] as E });

export const GIN_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.02,
  run: { spine: [10, 0, 0], chest: [6, 0, 0], 'upperarm.L': [10, 0, 10], 'forearm.L': [-20, 0, 0] },
  sprint: { spine: [18, 0, 0], chest: [10, 0, 0], head: [-14, 0, 0], 'upperarm.L': [40, 0, 12], 'forearm.L': [-20, 0, 0] },
  swingL: 0.5,
  swingR: 0.15,
  freqScale: 0.95,
  grip: {
    idle: LOW,
    walk: LOW,
    run: { p: [-0.28, -0.24, -0.06], dir: [-0.2, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.28, -0.15, -0.16], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.36, -0.1, 0.1], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

const SH: E = [-0.2, 0.16, 0.02];

/** the light flicks of the string */
const flick = (name: string, kind: 0 | 1 | 2): ClipDef => ({
  name, dur: 0.5, fadeIn: 0.04, fadeOut: 0.18, events: { step: 0.06, hit: 0.13, combo: 0.22 },
  keys: mergeKeys(
    swingKeys(kind === 0
      ? { a: [0, 0, 1], b: [1, -0.1, 0], c: SH, r: 0.34, pole: [-0.5, -0.65, -0.55], keys: [[0, -60, 'out'], [0.08, -112, 'out'], [0.14, 30, 'outExpo'], [0.26, 92, 'out'], [0.5, 60, 'inOut']] }
      : kind === 1
        ? { a: [0, 0, 1], b: [-0.85, 0.52, 0], c: [-0.08, 0.1, 0.06], r: 0.34, pole: [-0.3, -0.4, -0.85], keys: [[0, -140, 'out'], [0.08, -118, 'out'], [0.14, 44, 'outExpo'], [0.26, 100, 'out'], [0.5, 70, 'inOut']] }
        : { a: [0, 0, 1], b: [0, -1, 0], c: [-0.08, 0.2, 0.1], r: 0.36, pole: [-0.7, -0.2, -0.65], keys: [[0, 30, 'out'], [0.08, -124, 'out'], [0.14, 6, 'outExpo'], [0.28, 20, 'out'], [0.5, 40, 'inOut']] }),
    [
      key(0, I()),
      key(0.08, I(kind === 1 ? { hips: [2, 16, 0], spine: [6, 12, 0], chest: [6, 16, 0], head: [-8, -8, 7] } : { hips: [2, -22, 0], spine: [6, -10, 0], chest: [4, -14, 0], head: [-8, 18, 7] }), [0, -0.03, 0], 'out'),
      key(0.14, I(kind === 1 ? { hips: [2, -16, 0], spine: [6, -12, 0], chest: [4, -18, 0], head: [-8, 18, 7], 'thigh.L': [-22, 0, 4], 'shin.L': [24, 0, 0] } : { hips: [4, 12, 0], spine: [8, 10, 0], chest: [6, 16, 0], head: [-8, -4, 7], 'thigh.L': [-24, 0, 4], 'shin.L': [26, 0, 0], 'thigh.R': [12, 0, -4] }), [0, -0.05, 0.06], 'outExpo'),
      key(0.5, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
});

/** the extension thrust: the arm thrown out level, the blade shoots from the point and back */
const poke = (name: string, dur: number, fx: number, back: number): ClipDef => ({
  name, dur, fadeIn: 0.04, fadeOut: 0.2, events: { step: 0.06, fx, retract: back },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: fx - 0.04, ease: 'out', c: ik(OUT) }, { t: back, ease: 'inOut', c: ik(OUT) }, { t: dur, ease: 'inOut', c: ik(LOW) }],
    [
      key(0, I()),
      key(fx - 0.04, I({ hips: [4, 14, 0], spine: [8, 10, 0], chest: [6, 18, 0], head: [-10, -10, 4], 'thigh.L': [-26, 0, 4], 'shin.L': [26, 0, 0], 'thigh.R': [14, 0, -4], 'upperarm.L': [10, 0, 12] }), [0, -0.05, 0.06], 'out'),
      key(back, I({ hips: [4, 16, 0], spine: [8, 10, 0], chest: [6, 20, 0], head: [-10, -12, 4], 'thigh.L': [-26, 0, 4], 'shin.L': [26, 0, 0], 'thigh.R': [14, 0, -4], 'upperarm.L': [10, 0, 12] }), [0, -0.05, 0.06], 'inOut'),
      key(dur, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
});

/** the gate push: a lunge, both hands, the blade driven out at full length */
const push: ClipDef = {
  name: 'gn_push', dur: 1.3, fadeIn: 0.05, fadeOut: 0.25, events: { step: 0.14, fx: 0.24, retract: 0.9 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 0.14, ease: 'inOut', c: ik({ ...OUT, p: [-0.18, -0.06, 0.08] }, 1) }, { t: 0.24, ease: 'outExpo', c: ik({ ...OUT, p: [-0.06, 0.04, 0.46] }, 1) }, { t: 0.9, ease: 'inOut', c: ik({ ...OUT, p: [-0.06, 0.04, 0.46] }, 1) }, { t: 1.3, ease: 'inOut', c: ik(LOW) }],
    [
      key(0, I()),
      key(0.14, I({ hips: [2, -18, 0], spine: [4, -10, 0], chest: [2, -12, 0], head: [-6, 16, 4], 'thigh.L': [-18, 0, 6], 'shin.L': [24, 0, 0], 'thigh.R': [12, 0, -6], 'shin.R': [24, 0, 0] }), [0, -0.08, -0.02], 'inOut'),
      key(0.24, I({ hips: [8, 6, 0], spine: [12, 4, 0], chest: [8, 6, 0], head: [-14, 0, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [52, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [20, 0, 0] }), [0, -0.12, 0.22], 'outExpo'),
      key(0.9, I({ hips: [8, 6, 0], spine: [12, 4, 0], chest: [8, 6, 0], head: [-14, 0, 0], 'thigh.L': [-48, 0, 6], 'shin.L': [50, 0, 0], 'thigh.R': [28, 0, -6], 'shin.R': [20, 0, 0] }), [0, -0.12, 0.2], 'inOut'),
      key(1.3, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** the extended sweep: the arm carried right to left across the front with the blade held long */
const sweep = (name: string, dur: number, fx: number, s0: number, s1: number, back: number): ClipDef => ({
  name, dur, fadeIn: 0.05, fadeOut: 0.25, events: { fx, sweep: s0, done: s1, retract: back },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [1, -0.05, 0], c: SH, r: 0.46, pole: [-0.5, -0.7, -0.4],
      keys: [[0, -40, 'out'], [fx, -96, 'out'], [s0, -92, 'linear'], [s1, 84, 'inOut'], [back, 88, 'linear'], [dur, 60, 'inOut']],
    }),
    [
      key(0, I()),
      key(fx, I({ hips: [2, -30, 0], spine: [4, -16, 0], chest: [2, -20, 0], head: [-8, 22, 4], 'thigh.L': [-14, 0, 8], 'thigh.R': [12, 0, -8], 'shin.R': [20, 0, 0] }), [0, -0.06, 0], 'out'),
      key(s0, I({ hips: [2, -30, 0], spine: [4, -16, 0], chest: [2, -20, 0], head: [-8, 22, 4], 'thigh.L': [-14, 0, 8], 'thigh.R': [12, 0, -8], 'shin.R': [20, 0, 0] }), [0, -0.06, 0], 'linear'),
      key(s1, I({ hips: [2, 26, 0], spine: [4, 16, 0], chest: [2, 22, 0], head: [-8, -20, 4], 'thigh.L': [-22, 0, 8], 'shin.L': [20, 0, 0], 'thigh.R': [16, 0, -8], 'upperarm.L': [8, 0, 24] }), [0, -0.06, 0.04], 'inOut'),
      key(back, I({ hips: [2, 28, 0], spine: [4, 18, 0], chest: [2, 24, 0], head: [-8, -22, 4], 'thigh.L': [-22, 0, 8], 'shin.L': [20, 0, 0], 'thigh.R': [16, 0, -8], 'upperarm.L': [8, 0, 24] }), [0, -0.06, 0.04], 'linear'),
      key(dur, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
});

/** Butō: the hilt pressed to the chest with both hands; (n = 1) one shot, (n > 1) Renjin's pumping */
const buto = (name: string, dur: number, shots: number): ClipDef => {
  const g: { t: number; ease?: KeyDef['ease']; c: Record<string, E> }[] = [{ t: 0, c: ik(LOW) }, { t: 0.24, ease: 'inOut', c: ik(BUTO, 1) }];
  const ev: Record<string, number> = { set: 0.24 };
  const step = (dur - 0.6) / shots;
  for (let i = 0; i < shots; i++) {
    const t0 = 0.3 + i * step;
    ev[`fire${i}`] = t0;
    g.push({ t: t0, ease: 'outExpo', c: ik({ ...BUTO, p: [0, -0.02, 0.26] }, 1) }, { t: t0 + step * 0.6, ease: 'inOut', c: ik(BUTO, 1) });
  }
  g.push({ t: dur - 0.25, ease: 'inOut', c: ik(BUTO, 1) }, { t: dur, ease: 'inOut', c: ik(LOW) });
  return {
    name, dur, fadeIn: 0.06, fadeOut: 0.22, events: ev,
    keys: mergeKeys(g, [
      key(0, I()),
      key(0.24, I({ hips: [2, 0, 0], spine: [4, 0, 0], chest: [2, 0, 0], neck: [2, 0, 0], head: [-4, 0, 0], 'thigh.L': [-24, 0, 8], 'shin.L': [26, 0, 0], 'thigh.R': [14, 0, -8], 'shin.R': [22, 0, 0] }), [0, -0.06, 0], 'inOut'),
      key(dur - 0.25, I({ hips: [2, 0, 0], spine: [4, 0, 0], chest: [2, 0, 0], neck: [2, 0, 0], head: [-4, 0, 0], 'thigh.L': [-24, 0, 8], 'shin.L': [26, 0, 0], 'thigh.R': [14, 0, -8], 'shin.R': [22, 0, 0] }), [0, -0.06, 0], 'inOut'),
      key(dur, I(), [0, -0.02, 0], 'inOut'),
    ]),
  };
};

/** a hand raised toward the target: Hakufuku (fingers spread) and Korose (the palm, "die") */
const raise = (name: string, dur: number, at: number): ClipDef => ({
  name, dur, fadeIn: 0.08, fadeOut: 0.25, events: { cast: at },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: dur, c: ik(LOW) }],
    [
      key(0, I()),
      key(at - 0.15, I({ chest: [4, 14, 0], head: [-6, -6, 2], 'upperarm.L': [-78, 0, 6], 'forearm.L': [-12, 0, 0], 'hand.L': [-30, 0, 0] }), [0, -0.02, 0], 'out'),
      key(at, I({ chest: [4, 16, 0], head: [-8, -8, 0], 'upperarm.L': [-86, 0, 4], 'forearm.L': [-4, 0, 0], 'hand.L': [-44, 0, 0] }), [0, -0.02, 0.02], 'outExpo'),
      key(dur - 0.3, I({ chest: [4, 16, 0], head: [-8, -8, 0], 'upperarm.L': [-84, 0, 4], 'forearm.L': [-6, 0, 0], 'hand.L': [-40, 0, 0] }), [0, -0.02, 0.02], 'inOut'),
      key(dur, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
});

/** Sentan Hakuja: the left arm whirls the cloth out round the target */
const hakuja: ClipDef = {
  name: 'gn_hakuja', dur: 1.2, fadeIn: 0.06, fadeOut: 0.25, events: { throw: 0.3, wrap: 0.75 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 1.2, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.15, I({ chest: [2, -20, 0], 'upperarm.L': [-40, 30, 70], 'forearm.L': [-30, 0, 0] }), [0, -0.02, 0], 'out'),
      key(0.3, I({ chest: [4, 22, 0], head: [-8, -14, 4], 'upperarm.L': [-90, -30, 10], 'forearm.L': [-6, 0, 0], 'hand.L': [-20, 0, 0] }), [0, -0.03, 0.04], 'outExpo'),
      key(0.75, I({ chest: [4, 22, 0], head: [-8, -14, 4], 'upperarm.L': [-88, -30, 14], 'forearm.L': [-20, 0, 0], 'hand.L': [20, 0, 0] }), [0, -0.03, 0.04], 'inOut'),
      key(1.2, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** "Ban… kai": the blade held level across the chest, the left hand on the hilt */
const bankai: ClipDef = {
  name: 'gn_bankai', dur: 1.6, fadeIn: 0.1, fadeOut: 0.3, events: { pulse: 0.7 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 0.5, ease: 'inOut', c: ik({ p: [-0.06, 0.06, 0.32], dir: [0.98, 0.05, 0.15], edge: [0, -1, 0.05], pole: [-0.7, -0.6, -0.3] }, 1) }, { t: 1.2, ease: 'inOut', c: ik({ p: [-0.06, 0.06, 0.32], dir: [0.98, 0.05, 0.15], edge: [0, -1, 0.05], pole: [-0.7, -0.6, -0.3] }, 1) }, { t: 1.6, ease: 'inOut', c: ik(LOW) }],
    [
      key(0, I()),
      key(0.5, I({ hips: [0, -6, 0], spine: [2, 0, 0], chest: [0, 0, 0], neck: [0, 0, 0], head: [-6, 0, 0], 'thigh.L': [-14, 0, 8], 'thigh.R': [10, 0, -8] }), [0, -0.03, 0], 'inOut'),
      key(1.2, I({ hips: [0, -6, 0], spine: [2, 0, 0], chest: [0, 0, 0], neck: [0, 0, 0], head: [-6, 0, 0], 'thigh.L': [-14, 0, 8], 'thigh.R': [10, 0, -8] }), [0, -0.03, 0], 'inOut'),
      key(1.6, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** the eyes open: the head comes upright and still */
const eyes: ClipDef = {
  name: 'gn_eyes', dur: 0.9, fadeIn: 0.08, fadeOut: 0.25, events: { open: 0.35 },
  keys: mergeKeys(
    [{ t: 0, c: ik(LOW) }, { t: 0.9, c: ik(LOW) }],
    [
      key(0, I()),
      key(0.35, I({ spine: [2, 0, 0], chest: [0, 0, 0], neck: [0, 0, 0], head: [-2, 0, 0] }), [0, -0.01, 0], 'inOut'),
      key(0.9, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

export const GIN_CLIPS: ClipDef[] = [
  flick('gn_cut1', 0), flick('gn_cut2', 1), flick('gn_cut3', 2), poke('gn_poke', 0.62, 0.14, 0.36), poke('gn_snipe', 1.1, 0.18, 0.7), push,
  sweep('gn_sweep', 1.4, 0.2, 0.3, 0.85, 1.0), sweep('gn_split', 1.5, 0.24, 0.36, 0.8, 1.1),
  buto('gn_buto', 1.0, 1), buto('gn_renjin', 2.0, 12), raise('gn_hakufuku', 1.2, 0.4), raise('gn_korose', 1.3, 0.45), hakuja, bankai, eyes,
  ...ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name)),
];
export const GIN_CHAIN = ['gn_cut1', 'gn_cut2', 'gn_cut3', 'gn_poke'];
