// Suì-Fēng's animation set. Low, springy and compact: a wide guard with the left palm out, the wakizashi
// held in a reverse grip so the blade lies back along the right forearm — every strike is a punch that
// whips the blade through a wide arc. Kicks are snapped from the hip; Kazaguruma throws her body into the
// air and scissors the legs into a kick that sends the target flying. Shikai: fast, straight jabs of the
// stinger on the middle finger. Bankai: the launcher braced along the right arm, the left hand under it,
// feet planted wide against the recoil.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

const IDLE: Record<string, E> = {
  hips: [6, -18, 0], spine: [6, 6, 0], chest: [4, 12, 0], neck: [0, 0, 0], head: [-6, 6, 0],
  'thigh.L': [-28, 0, 10], 'shin.L': [36, 0, 0], 'foot.L': [-8, 0, 0], 'thigh.R': [8, 0, -12], 'shin.R': [30, 0, 0], 'foot.R': [-38, 0, 0],
  'upperarm.L': [-44, 0, 18], 'forearm.L': [-64, 0, 0], 'hand.L': [-6, 0, 0],
};
const I = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });
/** reverse grip: the fist low by the hip, the blade lying back along the forearm */
const REV = { p: [-0.24, -0.22, 0.12] as E, dir: [-0.1, 0.28, -0.95] as E, edge: [0.02, -0.96, -0.28] as E, pole: [-0.6, -0.3, -0.75] as E };
type Grip = typeof REV;
const ik = (g: Grip, w = 1) => ({ '@gripR': g.p, '@dirR': g.dir, '@edgeR': g.edge, '@poleR': g.pole, '@ikR': [w, 0, 0] as E });
/** the punch at full extension: the fist out front, the blade swept out past the elbow */
const PUNCH = { p: [-0.1, 0.04, 0.48] as E, dir: [-0.6, 0.1, -0.79] as E, edge: [0.6, -0.5, 0.62] as E, pole: [-0.7, -0.6, 0] as E };
const BACKHAND = { p: [-0.42, 0.06, 0.28] as E, dir: [0.7, 0.1, -0.7] as E, edge: [0.7, -0.1, 0.7] as E, pole: [-0.5, -0.7, -0.4] as E };

export const SUIFENG_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.06,
  run: { spine: [14, 0, 0], chest: [8, 0, 0], 'upperarm.L': [30, 0, 16], 'forearm.L': [-40, 0, 0] },
  sprint: { spine: [26, 0, 0], chest: [12, 0, 0], head: [-18, 0, 0], 'upperarm.L': [60, 0, 14], 'forearm.L': [-20, 0, 0] },
  swingL: 0.6,
  swingR: 0.3,
  freqScale: 1.2,
  grip: {
    idle: REV,
    walk: REV,
    run: { p: [-0.26, -0.2, -0.04], dir: [-0.2, 0.2, -0.96], edge: [0, -0.98, -0.2], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.26, -0.12, -0.14], dir: [-0.2, 0.1, -0.97], edge: [0, -1, 0.1], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.3, -0.06, 0.08], dir: [-0.3, 0.3, -0.9], edge: [0, -0.95, -0.3], pole: [-0.4, -0.6, -0.6] },
  },
};

/** a reverse-grip punch-slash: right straight (0) or a backhand (1) */
const strike = (name: string, kind: 0 | 1, dur = 0.42): ClipDef => ({
  name, dur, fadeIn: 0.03, fadeOut: 0.15, events: { step: 0.04, hit: 0.1, combo: 0.18 },
  keys: mergeKeys(
    [{ t: 0, c: ik(REV) }, { t: 0.06, ease: 'out', c: ik(kind === 0 ? { ...REV, p: [-0.28, -0.12, -0.06] } : { ...REV, p: [-0.08, -0.04, 0.22], dir: [-0.8, 0.2, -0.5] }) }, { t: 0.1, ease: 'outExpo', c: ik(kind === 0 ? PUNCH : BACKHAND) }, { t: 0.2, ease: 'out', c: ik(kind === 0 ? PUNCH : BACKHAND) }, { t: dur, ease: 'inOut', c: ik(REV) }],
    [
      key(0, I()),
      key(0.06, I(kind === 0 ? { hips: [6, -30, 0], chest: [4, -10, 0], head: [-6, 22, 0] } : { hips: [6, 10, 0], chest: [4, 26, 0], head: [-6, -10, 0] }), [0, -0.07, 0], 'out'),
      key(0.1, I(kind === 0 ? { hips: [8, 20, 0], spine: [8, 12, 0], chest: [6, 22, 0], head: [-8, -16, 0], 'thigh.L': [-40, 0, 10], 'shin.L': [40, 0, 0], 'upperarm.L': [10, 0, 30], 'forearm.L': [-40, 0, 0] } : { hips: [8, -26, 0], spine: [8, -14, 0], chest: [4, -24, 0], head: [-6, 22, 0], 'thigh.L': [-34, 0, 10], 'shin.L': [36, 0, 0], 'upperarm.L': [-20, 0, 30] }), [0, -0.08, 0.08], 'outExpo'),
      key(dur, I(), [0, -0.06, 0], 'inOut'),
    ],
  ),
});

/** a snapped kick: a roundhouse from the right (0) or a front kick from the left (1) */
const kick = (name: string, kind: 0 | 1, dur = 0.5): ClipDef => ({
  name, dur, fadeIn: 0.04, fadeOut: 0.16, events: { step: 0.05, hit: 0.14, combo: 0.24 },
  keys: mergeKeys(
    [{ t: 0, c: ik(REV) }, { t: dur, c: ik(REV) }],
    [
      key(0, I()),
      key(0.08, I(kind === 0 ? { hips: [0, -20, -6], spine: [-4, -6, 0], chest: [-6, -8, 0], 'thigh.R': [-60, 0, -30], 'shin.R': [100, 0, 0], 'thigh.L': [-10, 0, 10], 'shin.L': [20, 0, 0] } : { hips: [-4, 10, 0], spine: [-8, 0, 0], chest: [-6, 6, 0], 'thigh.L': [-80, 0, 6], 'shin.L': [100, 0, 0], 'thigh.R': [6, 0, -10], 'shin.R': [20, 0, 0] }), [0, -0.04, 0], 'out'),
      key(0.14, I(kind === 0 ? { hips: [-4, 70, -24], spine: [-8, 10, -6], chest: [-10, 10, -4], head: [-6, -40, 10], 'thigh.R': [-80, -20, -76], 'shin.R': [10, 0, 0], 'foot.R': [30, 0, 0], 'thigh.L': [-10, 0, 10], 'shin.L': [14, 0, 0], 'upperarm.L': [-20, 0, 50] } : { hips: [-10, 6, 0], spine: [-14, 0, 0], chest: [-8, 6, 0], head: [-2, -4, 0], 'thigh.L': [-96, 0, 6], 'shin.L': [8, 0, 0], 'foot.L': [30, 0, 0], 'thigh.R': [10, 0, -10], 'shin.R': [16, 0, 0] }), [0, 0.02, 0.06], 'outExpo'),
      key(0.24, I(kind === 0 ? { hips: [-4, 74, -24], spine: [-8, 10, -6], chest: [-10, 10, -4], head: [-6, -42, 10], 'thigh.R': [-78, -20, -74], 'shin.R': [14, 0, 0], 'thigh.L': [-10, 0, 10], 'upperarm.L': [-20, 0, 50] } : { hips: [-10, 6, 0], spine: [-14, 0, 0], 'thigh.L': [-92, 0, 6], 'shin.L': [12, 0, 0], 'thigh.R': [10, 0, -10] }), [0, 0.02, 0.06], 'out'),
      key(dur, I(), [0, -0.06, 0], 'inOut'),
    ],
  ),
});

/** Kazaguruma: the body thrown into the air, the legs scissored past each other into a kick that sends the target flying */
const kazaguruma: ClipDef = {
  name: 'sf_kazaguruma', dur: 0.95, fadeIn: 0.04, fadeOut: 0.22, events: { step: 0.08, hit: 0.34, land: 0.6 },
  keys: mergeKeys(
    [{ t: 0, c: ik(REV) }, { t: 0.95, c: ik(REV) }],
    [
      key(0, I()),
      key(0.08, I({ hips: [10, -20, 0], spine: [10, -10, 0], 'thigh.L': [-50, 0, 10], 'shin.L': [80, 0, 0], 'thigh.R': [-30, 0, -10], 'shin.R': [80, 0, 0] }), [0, -0.18, 0], 'out'),
      key(0.22, I({ hips: [-30, 120, 40], spine: [-10, 20, 10], chest: [-10, 10, 0], head: [10, -50, 0], 'thigh.L': [-110, 0, 30], 'shin.L': [20, 0, 0], 'thigh.R': [40, 0, -40], 'shin.R': [70, 0, 0], 'upperarm.L': [-40, 0, 80] }), [0, 0.35, 0], 'out'),
      key(0.34, I({ hips: [-40, 250, 60], spine: [-10, 20, 10], chest: [-10, 10, 0], head: [10, -60, 0], 'thigh.L': [40, 0, 40], 'shin.L': [60, 0, 0], 'thigh.R': [-120, 0, -40], 'shin.R': [6, 0, 0], 'foot.R': [30, 0, 0], 'upperarm.L': [-60, 0, 90] }), [0, 0.42, 0.1], 'outExpo'),
      key(0.6, I({ hips: [20, 360, 0], spine: [10, 0, 0], 'thigh.L': [-50, 0, 10], 'shin.L': [80, 0, 0], 'thigh.R': [-20, 0, -12], 'shin.R': [70, 0, 0] }), [0, -0.16, 0.1], 'inOut'),
      key(0.95, I({ hips: [6, 342, 0] }), [0, -0.06, 0], 'inOut'),
    ],
    [{ t: 0, c: { '@spin': [0, 0, 0] } }, { t: 0.6, ease: 'inOut', c: { '@spin': [360, 0, 0] } }, { t: 0.95, c: { '@spin': [360, 0, 0] } }],
  ),
};

/** a fast stinger jab (Shikai): the middle finger straight out at the target */
const sting = (name: string, high: boolean, dur = 0.36): ClipDef => ({
  name, dur, fadeIn: 0.03, fadeOut: 0.12, events: { step: 0.03, hit: 0.08, combo: 0.15 },
  keys: [
    key(0, I({ 'upperarm.R': [-30, 0, -20], 'forearm.R': [-80, 0, 0] })),
    key(0.04, I({ hips: [6, -28, 0], chest: [4, -12, 0], 'upperarm.R': [-20, 0, -26], 'forearm.R': [-110, 0, 0] }), [0, -0.07, 0], 'out'),
    key(0.08, I({ hips: [8, 18, 0], spine: [8, 10, 0], chest: [6, 20, 0], head: [-8, -14, 0], 'thigh.L': [-40, 0, 10], 'shin.L': [40, 0, 0], 'upperarm.R': [high ? -100 : -84, 0, -4], 'forearm.R': [-4, 0, 0], 'hand.R': [0, 0, 0], 'upperarm.L': [10, 0, 30] }), [0, -0.08, 0.1], 'outExpo'),
    key(0.15, I({ hips: [8, 18, 0], spine: [8, 10, 0], chest: [6, 20, 0], 'thigh.L': [-40, 0, 10], 'shin.L': [40, 0, 0], 'upperarm.R': [high ? -98 : -82, 0, -4], 'forearm.R': [-8, 0, 0], 'upperarm.L': [10, 0, 30] }), [0, -0.08, 0.1], 'out'),
    key(dur, I({ 'upperarm.R': [-30, 0, -20], 'forearm.R': [-80, 0, 0] }), [0, -0.06, 0], 'inOut'),
  ],
});

/** the stinger lunge: a long low dive behind the point */
const lunge: ClipDef = {
  name: 'sf_lunge', dur: 0.7, fadeIn: 0.04, fadeOut: 0.2, events: { step: 0.08, hit: 0.18 },
  keys: [
    key(0, I({ 'upperarm.R': [-30, 0, -20], 'forearm.R': [-80, 0, 0] })),
    key(0.08, I({ hips: [10, -20, 0], spine: [10, -10, 0], 'thigh.L': [-40, 0, 10], 'shin.L': [70, 0, 0], 'thigh.R': [0, 0, -10], 'shin.R': [70, 0, 0], 'upperarm.R': [-20, 0, -30], 'forearm.R': [-120, 0, 0] }), [0, -0.2, -0.04], 'out'),
    key(0.18, I({ hips: [26, 10, 0], spine: [20, 8, 0], chest: [10, 10, 0], head: [-30, -8, 0], 'thigh.L': [-70, 0, 8], 'shin.L': [60, 0, 0], 'thigh.R': [50, 0, -8], 'shin.R': [10, 0, 0], 'upperarm.R': [-96, 0, -2], 'forearm.R': [0, 0, 0], 'upperarm.L': [30, 0, 40] }), [0, -0.26, 0.22], 'outExpo'),
    key(0.4, I({ hips: [26, 10, 0], spine: [20, 8, 0], chest: [10, 10, 0], head: [-30, -8, 0], 'thigh.L': [-68, 0, 8], 'shin.L': [58, 0, 0], 'thigh.R': [48, 0, -8], 'upperarm.R': [-94, 0, -2], 'upperarm.L': [30, 0, 40] }), [0, -0.26, 0.22], 'out'),
    key(0.7, I({ 'upperarm.R': [-30, 0, -20], 'forearm.R': [-80, 0, 0] }), [0, -0.06, 0], 'inOut'),
  ],
};

/** a two-handed seal (the speed clones, the binding Kidō) */
const seal = (name: string, dur: number, at: number): ClipDef => ({
  name, dur, fadeIn: 0.06, fadeOut: 0.2, events: { cast: at },
  keys: mergeKeys(
    [{ t: 0, c: ik(REV) }, { t: dur, c: ik(REV) }],
    [
      key(0, I()),
      key(at, I({ hips: [2, 0, 0], chest: [0, 0, 0], head: [-4, 0, 0], 'upperarm.L': [-60, 0, -20], 'forearm.L': [-90, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.05, 0], 'outExpo'),
      key(dur - 0.15, I({ hips: [2, 0, 0], chest: [0, 0, 0], head: [-4, 0, 0], 'upperarm.L': [-58, 0, -20], 'forearm.L': [-88, 0, 0] }), [0, -0.05, 0], 'inOut'),
      key(dur, I(), [0, -0.06, 0], 'inOut'),
    ],
  ),
});

/** Takigoi: the counter stance — the forearm up to catch, the weight back */
const takigoi: ClipDef = {
  name: 'sf_takigoi', dur: 0.8, fadeIn: 0.04, fadeOut: 0.2, events: { set: 0.08 },
  keys: mergeKeys(
    [{ t: 0, c: ik(REV) }, { t: 0.1, ease: 'out', c: ik({ ...REV, p: [-0.16, 0.1, 0.24], dir: [0.2, 0.9, -0.38], edge: [0.3, -0.4, -0.86] }) }, { t: 0.65, c: ik({ ...REV, p: [-0.16, 0.1, 0.24], dir: [0.2, 0.9, -0.38], edge: [0.3, -0.4, -0.86] }) }, { t: 0.8, ease: 'inOut', c: ik(REV) }],
    [
      key(0, I()),
      key(0.1, I({ hips: [0, -10, 0], spine: [-4, 0, 0], chest: [-4, 6, 0], head: [-2, 4, 0], 'thigh.L': [-16, 0, 10], 'shin.L': [40, 0, 0], 'thigh.R': [20, 0, -12], 'shin.R': [44, 0, 0], 'upperarm.L': [-70, 0, 10], 'forearm.L': [-80, 0, 0] }), [0, -0.12, -0.04], 'out'),
      key(0.65, I({ hips: [0, -10, 0], spine: [-4, 0, 0], chest: [-4, 6, 0], 'thigh.L': [-16, 0, 10], 'shin.L': [40, 0, 0], 'thigh.R': [20, 0, -12], 'shin.R': [44, 0, 0], 'upperarm.L': [-70, 0, 10], 'forearm.L': [-80, 0, 0] }), [0, -0.12, -0.04], 'inOut'),
      key(0.8, I(), [0, -0.06, 0], 'inOut'),
    ],
  ),
};

/** release: the sword raised, it glows and shrinks onto the hand ("Jinteki Shakusetsu") */
const release: ClipDef = {
  name: 'sf_release', dur: 1.2, fadeIn: 0.08, fadeOut: 0.25, events: { glow: 0.3, form: 0.62 },
  keys: mergeKeys(
    [{ t: 0, c: ik(REV) }, { t: 0.3, ease: 'out', c: ik({ p: [-0.14, 0.3, 0.26], dir: [0.1, 0.99, 0.1], edge: [0, -0.1, 0.99], pole: [-0.8, -0.4, -0.3] }) }, { t: 0.62, c: ik({ p: [-0.14, 0.3, 0.26], dir: [0.1, 0.99, 0.1], edge: [0, -0.1, 0.99], pole: [-0.8, -0.4, -0.3] }) }, { t: 0.8, ease: 'inOut', c: ik(REV, 0) }],
    [
      key(0, I()),
      key(0.3, I({ hips: [0, -10, 0], spine: [0, 0, 0], chest: [-4, 0, 0], head: [-10, 0, 0], 'thigh.L': [-14, 0, 8], 'thigh.R': [6, 0, -8] }), [0, -0.03, 0], 'out'),
      key(0.62, I({ hips: [0, -10, 0], spine: [0, 0, 0], chest: [-4, 0, 0], head: [-10, 0, 0], 'thigh.L': [-14, 0, 8], 'thigh.R': [6, 0, -8] }), [0, -0.03, 0], 'inOut'),
      key(1.2, I({ 'upperarm.R': [-30, 0, -20], 'forearm.R': [-80, 0, 0] }), [0, -0.06, 0], 'inOut'),
    ],
  ),
};

/** Shunkō / the wind bursting out of her back and arms: arms flung wide, the head back */
const shunko: ClipDef = {
  name: 'sf_shunko', dur: 1.1, fadeIn: 0.06, fadeOut: 0.25, events: { burst: 0.4 },
  keys: mergeKeys(
    [{ t: 0, c: ik(REV) }, { t: 1.1, c: ik(REV) }],
    [
      key(0, I()),
      key(0.3, I({ hips: [10, 0, 0], spine: [16, 0, 0], chest: [14, 0, 0], head: [10, 0, 0], 'upperarm.L': [10, 0, 10], 'forearm.L': [-110, 0, 0], 'thigh.L': [-30, 0, 12], 'shin.L': [50, 0, 0], 'thigh.R': [0, 0, -12], 'shin.R': [50, 0, 0] }), [0, -0.12, 0], 'out'),
      key(0.4, I({ hips: [-4, 0, 0], spine: [-10, 0, 0], chest: [-14, 0, 0], head: [-16, 0, 0], 'upperarm.L': [-10, 0, 80], 'forearm.L': [-10, 0, 0], 'thigh.L': [-24, 0, 16], 'shin.L': [30, 0, 0], 'thigh.R': [-4, 0, -16], 'shin.R': [30, 0, 0] }), [0, -0.04, 0], 'outExpo'),
      key(1.1, I(), [0, -0.06, 0], 'inOut'),
    ],
  ),
};

/** aiming the launcher: the right arm level, the left hand braced under it, feet wide */
const AIM: Record<string, E> = {
  hips: [2, 20, 0], spine: [2, 6, 0], chest: [0, 10, 0], head: [-4, -24, 0],
  'thigh.L': [-30, 0, 16], 'shin.L': [36, 0, 0], 'foot.L': [-6, 0, 0], 'thigh.R': [16, 0, -18], 'shin.R': [30, 0, 0], 'foot.R': [-40, 0, 0],
  'upperarm.R': [-88, 0, -14], 'forearm.R': [-2, 0, 0], 'hand.R': [0, 0, 0],
  'upperarm.L': [-70, -30, 30], 'forearm.L': [-50, 0, 0],
};

/** the Bankai: the arm raised as the pillar goes up and the launcher closes round it */
const bankai: ClipDef = {
  name: 'sf_bankai', dur: 1.6, fadeIn: 0.1, fadeOut: 0.3, events: { pillar: 0.3, form: 0.9 },
  keys: [
    key(0, I()),
    key(0.3, I({ hips: [0, -6, 0], spine: [-4, 0, 0], chest: [-8, 0, 0], head: [-14, 0, 0], 'upperarm.R': [-170, 0, 6], 'forearm.R': [-6, 0, 0], 'thigh.L': [-14, 0, 10], 'thigh.R': [6, 0, -10] }), [0, -0.03, 0], 'out'),
    key(0.9, I({ hips: [0, -6, 0], spine: [-4, 0, 0], chest: [-8, 0, 0], head: [-14, 0, 0], 'upperarm.R': [-168, 0, 6], 'forearm.R': [-8, 0, 0], 'thigh.L': [-14, 0, 10], 'thigh.R': [6, 0, -10] }), [0, -0.03, 0], 'inOut'),
    key(1.6, I(AIM), [0, -0.1, 0], 'inOut'),
  ],
};

/** the missile fired: the launcher kicks up and back, she skids */
const fire: ClipDef = {
  name: 'sf_fire', dur: 1.2, fadeIn: 0.08, fadeOut: 0.3, events: { fins: 0.25, fire: 0.5 },
  keys: [
    key(0, I(AIM), [0, -0.1, 0]),
    key(0.5, I(AIM), [0, -0.1, 0], 'inOut'),
    key(0.58, I({ ...AIM, spine: [-12, 6, 0], chest: [-16, 10, 0], head: [-14, -24, 0], 'upperarm.R': [-120, 0, -10], 'forearm.R': [-10, 0, 0], 'thigh.L': [-10, 0, 16], 'thigh.R': [30, 0, -18] }), [0, -0.06, -0.2], 'outExpo'),
    key(1.2, I(AIM), [0, -0.1, 0], 'inOut'),
  ],
};

/** a bash with the launcher */
const bash: ClipDef = {
  name: 'sf_bash', dur: 0.75, fadeIn: 0.05, fadeOut: 0.2, events: { step: 0.1, hit: 0.24, combo: 0.36 },
  keys: [
    key(0, I(AIM), [0, -0.1, 0]),
    key(0.12, I({ ...AIM, hips: [4, -20, 0], chest: [4, -20, 0], 'upperarm.R': [-60, 0, -40], 'forearm.R': [-30, 0, 0] }), [0, -0.1, -0.04], 'out'),
    key(0.24, I({ ...AIM, hips: [6, 30, 0], spine: [8, 14, 0], chest: [6, 26, 0], 'upperarm.R': [-90, 30, -10], 'forearm.R': [-6, 0, 0], 'thigh.L': [-40, 0, 16] }), [0, -0.12, 0.12], 'outExpo'),
    key(0.75, I(AIM), [0, -0.1, 0], 'inOut'),
  ],
};

/** the Bankai stance: the launcher carried level (a stance of its own: she can barely move) */
export const RAIKOBEN_STANCE: StanceDef = {
  idle: { ...IDLE, ...AIM },
  idleHips: -0.1,
  run: { spine: [8, 0, 0] },
  sprint: { spine: [10, 0, 0] },
  swingL: 0.15,
  swingR: 0,
  freqScale: 0.7,
};

/** Shikai stance: the gauntlet hand up and ready, no blade */
export const SHIKAI_STANCE: StanceDef = {
  idle: { ...IDLE, 'upperarm.R': [-36, 0, -22], 'forearm.R': [-84, 0, 0], 'hand.R': [0, 0, 0] },
  idleHips: -0.06,
  run: { spine: [14, 0, 0], chest: [8, 0, 0], 'upperarm.L': [30, 0, 16], 'forearm.L': [-40, 0, 0], 'upperarm.R': [30, 0, -16], 'forearm.R': [-40, 0, 0] },
  sprint: { spine: [26, 0, 0], chest: [12, 0, 0], head: [-18, 0, 0], 'upperarm.L': [60, 0, 14], 'forearm.L': [-20, 0, 0], 'upperarm.R': [60, 0, -14], 'forearm.R': [-20, 0, 0] },
  swingL: 0.6,
  swingR: 0.6,
  freqScale: 1.2,
};

export const SUIFENG_CLIPS: ClipDef[] = [
  strike('sf_strike', 0), strike('sf_back', 1), kick('sf_round', 0), kick('sf_front', 1), strike('sf_strike2', 0, 0.5), kazaguruma,
  sting('sf_sting', false), sting('sf_sting2', true), lunge, seal('sf_clones', 0.9, 0.25), seal('sf_bind', 0.8, 0.22), takigoi, release, shunko, bankai, fire, bash,
  ...ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name)),
];
export const SUIFENG_CHAIN = ['sf_strike', 'sf_back', 'sf_round', 'sf_strike2', 'sf_front'];
export const STING_CHAIN = ['sf_sting', 'sf_sting2', 'sf_sting', 'sf_round'];
