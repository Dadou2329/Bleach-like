// Haschwalth's animation set. Upright and still: the sword held low at his right, the shield arm carried bent before
// him. The knightly string (a rising cut, a level cut, the pommel driven into the face, the overhead execution);
// Judgment, a long rise and one vertical stroke; the sword blast, a level sweep; the Balance pose (the blade held
// level across him, his left hand under its far end) as the scales tip; the Key (the sword raised straight up);
// the point levelled at the target for Fortune Inversion; the shield raised (a layer on the left arm only). Night:
// the head bowed and lifted as the eyes open red; the black slash, the torrent poured off the point, the thorns
// flicked from the left hand, the hand on the chest for the mend; the lunging verdict; the vessel, arms opening.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys, type SwingDef } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });
interface Grip { p: E; dir: E; edge: E; pole: E }
const ik = (g: Grip, two = 0) => ({ '@gripR': g.p, '@dirR': g.dir, '@edgeR': g.edge, '@poleR': g.pole, '@ikR': [1, 0, 0] as E, '@twoHand': [two, 0, 0] as E });

/** the shield arm carried bent before him */
const SHIELD_ARM: Record<string, E> = { 'upperarm.L': [-22, 0, 14], 'forearm.L': [-58, 0, 0], 'hand.L': [0, 0, 0] };
const IDLE: Record<string, E> = {
  hips: [0, -4, 0], spine: [-1, 2, 0], chest: [-3, 2, 0], neck: [2, 0, 0], head: [-2, -2, 0],
  'thigh.L': [-3, 0, 4], 'shin.L': [4, 0, 0], 'thigh.R': [3, 0, -3], 'shin.R': [6, 0, 0], 'foot.R': [-3, 0, 2],
  ...SHIELD_ARM,
};
const I = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });

/** the sword held low at his right side, the point toward the ground ahead */
const LOW: Grip = { p: [-0.3, -0.36, 0.14], dir: [-0.12, -0.36, 0.93], edge: [0, -0.93, -0.36], pole: [-0.6, -0.3, -0.75] };

export const HASCHWALTH_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.012,
  run: { spine: [8, 0, 0], chest: [2, 0, 0], head: [-6, 0, 0], ...SHIELD_ARM },
  sprint: { spine: [16, 0, 0], chest: [4, 0, 0], head: [-10, 0, 0], 'upperarm.L': [20, 0, 14], 'forearm.L': [-50, 0, 0] },
  swingL: 0.05,
  swingR: 0.08,
  freqScale: 0.92,
  grip: {
    idle: LOW,
    walk: LOW,
    run: { p: [-0.3, -0.24, -0.08], dir: [-0.2, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.32, -0.14, -0.18], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.4, -0.08, 0.1], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

function cut(name: string, o: {
  dur: number; step: number; hit: number; combo?: number; extra?: Record<string, number>;
  swing: Omit<SwingDef, 'keys'> & { keys: [number, number, KeyDef['ease']?][] };
  wind: Record<string, E>; strike: Record<string, E>; strikeHips?: E; windHips?: E;
}): ClipDef {
  const tFollow = o.swing.keys[o.swing.keys.length - 2]?.[0] ?? o.hit + 0.12;
  return {
    name, dur: o.dur, fadeIn: 0.05, fadeOut: 0.22, events: { step: o.step, hit: o.hit, ...(o.combo !== undefined ? { combo: o.combo } : {}), ...(o.extra ?? {}) },
    keys: mergeKeys(
      swingKeys(o.swing as SwingDef),
      [
        key(0, I()),
        key(o.swing.keys[1][0], I(o.wind), o.windHips ?? [0, -0.03, -0.02], 'out'),
        key(o.swing.keys[2][0], I(o.strike), o.strikeHips ?? [0, -0.05, 0.05], 'out'),
        key(tFollow, I(o.strike), o.strikeHips ?? [0, -0.05, 0.05], 'out'),
        key(o.dur, I(), [0, -0.015, 0], 'inOut'),
      ],
    ),
  };
}

/** a held pose for skills that do not swing: the sword kept low */
const pose = (name: string, dur: number, events: Record<string, number>, keys: KeyDef[], grips: { t: number; g: Grip; e?: KeyDef['ease']; two?: number }[] = [{ t: 0, g: LOW }, { t: dur, g: LOW }]): ClipDef => ({
  name, dur, fadeIn: 0.06, fadeOut: 0.26, events,
  keys: mergeKeys(grips.map((k) => ({ t: k.t, ease: k.e ?? 'inOut', c: ik(k.g, k.two ?? 0) })), keys),
});

// ------------------------------------------------------------------ the string

/** LMB 1: the rising cut, low on his left up across to his right */
const cut1 = cut('hw_cut1', {
  dur: 0.6, step: 0.06, hit: 0.17, combo: 0.28,
  swing: { a: [0, 0, 1], b: [0.8, 0.5, 0], c: [-0.06, 0.06, 0.08], r: 0.48, pole: [-0.6, -0.5, -0.5], keys: [[0, -40, 'out'], [0.1, -150, 'out'], [0.2, 40, 'out'], [0.32, 96, 'out'], [0.6, 50, 'inOut']] },
  wind: { hips: [0, 16, 0], chest: [0, 14, 0], head: [-2, -10, 0] },
  strike: { hips: [2, -14, 0], spine: [4, -8, 0], chest: [2, -14, 0], head: [-4, 10, 0], 'thigh.L': [-22, 0, 4], 'shin.L': [22, 0, 0] },
});
/** LMB 2: a level cut, right to left */
const cut2 = cut('hw_cut2', {
  dur: 0.58, step: 0.05, hit: 0.16, combo: 0.27,
  swing: { a: [0, 0, 1], b: [1, 0, 0], c: [-0.1, 0.12, 0.06], r: 0.48, pole: [-0.5, -0.6, -0.6], keys: [[0, -60, 'out'], [0.08, -130, 'out'], [0.18, 50, 'out'], [0.3, 90, 'out'], [0.58, 50, 'inOut']] },
  wind: { hips: [0, -18, 0], chest: [0, -14, 0], head: [-2, 10, 0] },
  strike: { hips: [0, 16, 0], spine: [2, 8, 0], chest: [2, 16, 0], head: [-2, -12, 0] },
});
/** LMB 3: the pommel driven into the face, the blade trailing back past his shoulder */
const pommel = pose('hw_pommel', 0.6, { step: 0.06, hit: 0.16, combo: 0.28 }, [
  key(0, I()),
  key(0.08, I({ hips: [0, -12, 0], chest: [0, -10, 0], head: [-2, 8, 0] }), [0, -0.02, -0.02], 'out'),
  key(0.16, I({ hips: [4, 14, 0], spine: [6, 8, 0], chest: [4, 12, 0], head: [-6, -10, 0], 'thigh.L': [-30, 0, 4], 'shin.L': [30, 0, 0], 'thigh.R': [14, 0, -3] }), [0, -0.06, 0.12], 'out'),
  key(0.3, I({ hips: [4, 14, 0], spine: [6, 8, 0], chest: [4, 12, 0], head: [-6, -10, 0], 'thigh.L': [-30, 0, 4], 'shin.L': [30, 0, 0], 'thigh.R': [14, 0, -3] }), [0, -0.06, 0.12], 'linear'),
  key(0.6, I(), [0, -0.015, 0], 'inOut'),
], [
  { t: 0, g: LOW },
  { t: 0.08, g: { p: [-0.32, 0.12, -0.06], dir: [-0.2, 0.25, -0.95], edge: [0, -1, 0.2], pole: [-0.9, -0.3, 0.2] } },
  { t: 0.16, g: { p: [-0.12, 0.24, 0.5], dir: [-0.2, 0.3, -0.93], edge: [0, -1, 0.2], pole: [-0.9, -0.4, 0] }, e: 'out' },
  { t: 0.3, g: { p: [-0.13, 0.23, 0.47], dir: [-0.2, 0.3, -0.93], edge: [0, -1, 0.2], pole: [-0.9, -0.4, 0] }, e: 'linear' },
  { t: 0.6, g: LOW },
]);
/** LMB 4: the execution — up overhead and straight down */
const exec = cut('hw_exec', {
  dur: 0.78, step: 0.1, hit: 0.26,
  swing: { a: [0, 1, 0], b: [0, 0, 1], c: [-0.12, 0.26, 0.04], r: 0.46, pole: [-0.8, -0.3, -0.4], keys: [[0, 60, 'out'], [0.16, -24, 'inOut'], [0.28, 128, 'out'], [0.42, 150, 'out'], [0.78, 100, 'inOut']] },
  wind: { hips: [-4, -6, 0], spine: [-6, 0, 0], chest: [-8, -4, 0], head: [-10, 2, 0], 'upperarm.L': [-40, 0, 20], 'forearm.L': [-50, 0, 0] },
  strike: { hips: [10, 4, 0], spine: [12, 2, 0], chest: [10, 2, 0], head: [-6, 0, 0], 'thigh.L': [-36, 0, 4], 'shin.L': [40, 0, 0], 'thigh.R': [18, 0, -3], 'shin.R': [16, 0, 0] },
  strikeHips: [0, -0.12, 0.14],
});

// ------------------------------------------------------------------ the skills (day)

/** RMB: Judgment — the long rise, the one stroke straight down through whatever stands there */
const judgment = cut('hw_judgment', {
  dur: 1.05, step: 0.36, hit: 0.46, extra: { raise: 0.1 },
  swing: { a: [0, 1, 0], b: [0, 0, 1], c: [-0.12, 0.28, 0.04], r: 0.5, pole: [-0.8, -0.3, -0.4], keys: [[0, 60, 'out'], [0.34, -30, 'inOut'], [0.48, 134, 'out'], [0.66, 156, 'out'], [1.05, 110, 'inOut']] },
  wind: { hips: [-6, -10, 0], spine: [-8, 0, 0], chest: [-10, -6, 0], head: [-12, 4, 0], 'upperarm.L': [-50, 0, 24], 'forearm.L': [-40, 0, 0], 'thigh.L': [-10, 0, 6], 'thigh.R': [10, 0, -6] },
  strike: { hips: [14, 6, 0], spine: [16, 2, 0], chest: [12, 2, 0], head: [-8, 0, 0], 'thigh.L': [-46, 0, 4], 'shin.L': [52, 0, 0], 'thigh.R': [24, 0, -3], 'shin.R': [20, 0, 0] },
  strikeHips: [0, -0.18, 0.2],
});
/** Q: the sword blast — a level sweep that throws the stars off the edge */
const blast = cut('hw_blast', {
  dur: 0.7, step: 0.06, hit: 0.2, extra: { fire: 0.2 },
  swing: { a: [0, 0, 1], b: [1, 0.1, 0], c: [-0.1, 0.16, 0.06], r: 0.5, pole: [-0.5, -0.6, -0.6], keys: [[0, -60, 'out'], [0.1, -140, 'out'], [0.22, 60, 'out'], [0.34, 100, 'out'], [0.7, 50, 'inOut']] },
  wind: { hips: [0, -22, 0], chest: [0, -16, 0], head: [-2, 12, 0] },
  strike: { hips: [0, 18, 0], spine: [2, 10, 0], chest: [2, 18, 0], head: [-2, -14, 0], 'thigh.L': [-20, 0, 4], 'shin.L': [20, 0, 0] },
});
/** E: the Balance — the blade held level across him at arm's length, his left hand under its far end: the scales tip */
const BAL: Grip = { p: [-0.18, 0.12, 0.42], dir: [1, 0.04, 0.08], edge: [0, -1, 0], pole: [-0.5, -0.7, -0.4] };
const scales = pose('hw_scales', 1.15, { raise: 0.1, tip: 0.42 }, [
  key(0, I()),
  key(0.24, I({ hips: [0, 4, 0], chest: [-2, 4, 0], head: [-4, 0, 0], 'upperarm.L': [-74, 34, -6], 'forearm.L': [-34, 0, 0], 'hand.L': [-30, 0, 0] }), [0, 0, 0], 'out'),
  key(0.85, I({ hips: [0, 4, 0], chest: [-2, 4, 0], head: [-4, 0, 0], 'upperarm.L': [-74, 34, -6], 'forearm.L': [-34, 0, 0], 'hand.L': [-30, 0, 0] }), [0, 0, 0], 'linear'),
  key(1.15, I(), [0, -0.012, 0], 'inOut'),
], [{ t: 0, g: LOW }, { t: 0.24, g: BAL, e: 'out' }, { t: 0.85, g: BAL, e: 'linear' }, { t: 1.15, g: LOW }]);
/** E (nothing stored): the Key — the sword raised straight up, light from its point */
const UP: Grip = { p: [-0.12, 0.64, 0.08], dir: [0, 1, 0.08], edge: [0, -0.08, 1], pole: [-0.9, -0.2, -0.3] };
const theKey = pose('hw_key', 1.5, { rune: 0.3, pillar: 0.62 }, [
  key(0, I()),
  key(0.28, I({ spine: [-4, 0, 0], chest: [-6, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-10, 0, 20], 'forearm.L': [-30, 0, 0] }), [0, 0.01, 0], 'out'),
  key(1.2, I({ spine: [-4, 0, 0], chest: [-6, 0, 0], head: [-12, 0, 0], 'upperarm.L': [-10, 0, 20], 'forearm.L': [-30, 0, 0] }), [0, 0.01, 0], 'linear'),
  key(1.5, I(), [0, -0.012, 0], 'inOut'),
], [{ t: 0, g: LOW }, { t: 0.28, g: UP, e: 'out' }, { t: 1.2, g: UP, e: 'linear' }, { t: 1.5, g: LOW }]);
/** R: the point levelled at the target */
const POINT: Grip = { p: [-0.1, 0.12, 0.52], dir: [0.03, 0.04, 1], edge: [0, -1, 0.04], pole: [-0.8, -0.5, 0] };
const invert = pose('hw_invert', 0.85, { mark: 0.2 }, [
  key(0, I()),
  key(0.18, I({ hips: [2, 10, 0], spine: [4, 6, 0], chest: [2, 8, 0], head: [-4, -8, 0], 'thigh.L': [-22, 0, 4], 'shin.L': [22, 0, 0] }), [0, -0.04, 0.06], 'out'),
  key(0.55, I({ hips: [2, 10, 0], spine: [4, 6, 0], chest: [2, 8, 0], head: [-4, -8, 0], 'thigh.L': [-22, 0, 4], 'shin.L': [22, 0, 0] }), [0, -0.04, 0.06], 'linear'),
  key(0.85, I(), [0, -0.012, 0], 'inOut'),
], [{ t: 0, g: LOW }, { t: 0.18, g: POINT, e: 'out' }, { t: 0.55, g: POINT, e: 'linear' }, { t: 0.85, g: LOW }]);
/** G: the shield raised before him (a layer: the left arm only) */
const guard: ClipDef = {
  name: 'hw_guard', dur: 1.2, fadeIn: 0.12, fadeOut: 0.18, loop: true,
  keys: [
    key(0, { 'upperarm.L': [-22, -60, 10], 'forearm.L': [-94, 0, 0], 'hand.L': [0, 0, 0] }, undefined, 'inOut'),
    key(0.6, { 'upperarm.L': [-24, -60, 10], 'forearm.L': [-92, 0, 0], 'hand.L': [0, 0, 0] }, undefined, 'inOut'),
    key(1.2, { 'upperarm.L': [-22, -60, 10], 'forearm.L': [-94, 0, 0], 'hand.L': [0, 0, 0] }, undefined, 'inOut'),
  ],
};

// ------------------------------------------------------------------ the night

/** F: the head bowed, then lifted: the eyes open, red, three pupils to each */
const night = pose('hw_night', 1.5, { open: 0.72 }, [
  key(0, I()),
  key(0.36, I({ spine: [6, 0, 0], chest: [6, 0, 0], neck: [10, 0, 0], head: [18, 0, 0] }), [0, -0.02, 0], 'inOut'),
  key(0.64, I({ spine: [6, 0, 0], chest: [6, 0, 0], neck: [10, 0, 0], head: [20, 0, 0] }), [0, -0.02, 0], 'linear'),
  key(0.78, I({ spine: [-4, 0, 0], chest: [-6, 0, 0], neck: [-4, 0, 0], head: [-8, 0, 0] }), [0, 0.01, 0], 'out'),
  key(1.5, I(), [0, -0.012, 0], 'inOut'),
]);
/** F (night): hAschwAlth — the black floods out of him, the arms open */
const vesselC = pose('hw_vessel', 1.8, { burst: 0.85 }, [
  key(0, I()),
  key(0.5, I({ chest: [8, 0, 0], head: [14, 0, 0], 'upperarm.L': [-30, 0, 20], 'forearm.L': [-60, 0, 0] }), [0, -0.03, 0], 'inOut'),
  key(0.85, I({ spine: [-6, 0, 0], chest: [-10, 0, 0], head: [-16, 0, 0], 'upperarm.L': [-20, 0, 62], 'forearm.L': [-10, 0, 0] }), [0, 0.03, 0], 'outExpo'),
  key(1.4, I({ spine: [-4, 0, 0], chest: [-8, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-20, 0, 58] }), [0, 0.03, 0], 'out'),
  key(1.8, I(), [0, -0.012, 0], 'inOut'),
], [{ t: 0, g: LOW }, { t: 0.85, g: { p: [-0.46, 0.04, 0.12], dir: [-0.9, 0.1, 0.3], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] }, e: 'outExpo' }, { t: 1.4, g: { p: [-0.46, 0.04, 0.12], dir: [-0.9, 0.1, 0.3], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] } }, { t: 1.8, g: LOW }]);
/** Q (night): the black slash, a long diagonal from high on his right */
const bslash = cut('hw_bslash', {
  dur: 0.8, step: 0.08, hit: 0.24, extra: { fire: 0.24 },
  swing: { a: [0, 0, 1], b: [-0.75, 0.66, 0], c: [-0.06, 0.18, 0.06], r: 0.5, pole: [-0.5, -0.6, -0.6], keys: [[0, -30, 'out'], [0.14, 160, 'inOut'], [0.26, -20, 'out'], [0.4, -70, 'out'], [0.8, -40, 'inOut']] },
  wind: { hips: [-4, -20, 0], spine: [-4, -10, 0], chest: [-6, -18, 0], head: [-4, 16, 0] },
  strike: { hips: [10, 8, 0], spine: [12, 4, 0], chest: [10, 8, 0], head: [-6, -8, 0], 'thigh.L': [-46, 0, 4], 'shin.L': [52, 0, 0], 'thigh.R': [26, 0, -3], 'shin.R': [22, 0, 0] },
  strikeHips: [0, -0.16, 0.2],
});
/** E (night): the torrent poured off the point, the left hand opening behind it */
const torrent = pose('hw_torrent', 0.95, { pour: 0.22 }, [
  key(0, I()),
  key(0.22, I({ hips: [2, 8, 0], chest: [2, 6, 0], head: [-4, -6, 0], 'upperarm.L': [-70, -10, 30], 'forearm.L': [-20, 0, 0], 'hand.L': [-40, 0, 0], 'thigh.L': [-20, 0, 4], 'shin.L': [20, 0, 0] }), [0, -0.04, 0.05], 'out'),
  key(0.6, I({ hips: [2, 8, 0], chest: [2, 6, 0], head: [-4, -6, 0], 'upperarm.L': [-70, -10, 30], 'forearm.L': [-20, 0, 0], 'hand.L': [-40, 0, 0], 'thigh.L': [-20, 0, 4], 'shin.L': [20, 0, 0] }), [0, -0.04, 0.05], 'linear'),
  key(0.95, I(), [0, -0.012, 0], 'inOut'),
], [{ t: 0, g: LOW }, { t: 0.22, g: POINT, e: 'out' }, { t: 0.6, g: POINT, e: 'linear' }, { t: 0.95, g: LOW }]);
/** R (night): the thorns flicked from the left hand */
const thorns = pose('hw_thorns', 0.75, { thorns: 0.2 }, [
  key(0, I()),
  key(0.1, I({ chest: [0, -12, 0], 'upperarm.L': [-30, 0, 40], 'forearm.L': [-100, 0, 0] }), [0, -0.01, 0], 'out'),
  key(0.2, I({ hips: [0, 12, 0], chest: [2, 14, 0], head: [-2, -10, 0], 'upperarm.L': [-88, -16, 4], 'forearm.L': [-6, 0, 0], 'hand.L': [-30, 0, 0] }), [0, -0.02, 0.03], 'outExpo'),
  key(0.75, I(), [0, -0.012, 0], 'inOut'),
]);
/** G (night): the left hand laid on the chest, the black closing over the wounds */
const mend = pose('hw_mend', 0.9, { mend: 0.2 }, [
  key(0, I()),
  key(0.2, I({ chest: [4, 0, 0], head: [8, 0, 0], 'upperarm.L': [-30, 30, -10], 'forearm.L': [-110, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.01, 0], 'out'),
  key(0.65, I({ chest: [4, 0, 0], head: [8, 0, 0], 'upperarm.L': [-30, 30, -10], 'forearm.L': [-110, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.01, 0], 'linear'),
  key(0.9, I(), [0, -0.012, 0], 'inOut'),
]);
/** RMB (night): the foreseen verdict — a lunging thrust where they will be */
const verdict = pose('hw_verdict', 0.7, { step: 0.05, hit: 0.16 }, [
  key(0, I()),
  key(0.08, I({ hips: [0, -20, 0], chest: [0, -12, 0], head: [-2, 14, 0] }), [0, -0.04, -0.02], 'inOut'),
  key(0.16, I({ hips: [6, 10, 0], spine: [8, 6, 0], chest: [4, 8, 0], head: [-8, -8, 0], 'thigh.L': [-44, 0, 4], 'shin.L': [46, 0, 0], 'thigh.R': [24, 0, -3], 'shin.R': [16, 0, 0] }), [0, -0.12, 0.2], 'out'),
  key(0.34, I({ hips: [6, 10, 0], spine: [8, 6, 0], chest: [4, 8, 0], head: [-8, -8, 0], 'thigh.L': [-44, 0, 4], 'shin.L': [46, 0, 0], 'thigh.R': [24, 0, -3], 'shin.R': [16, 0, 0] }), [0, -0.12, 0.2], 'linear'),
  key(0.7, I(), [0, -0.012, 0], 'inOut'),
], [
  { t: 0, g: LOW },
  { t: 0.08, g: { p: [-0.26, -0.02, -0.14], dir: [0, 0.05, 1], edge: [0, -1, 0.05], pole: [-0.9, -0.2, -0.3] } },
  { t: 0.16, g: { p: [-0.06, 0.1, 0.66], dir: [0.04, 0.1, 0.99], edge: [0, -1, 0.1], pole: [-0.8, -0.5, 0] }, e: 'out' },
  { t: 0.34, g: { p: [-0.08, 0.09, 0.62], dir: [0.04, 0.1, 0.99], edge: [0, -1, 0.1], pole: [-0.8, -0.5, 0] }, e: 'linear' },
  { t: 0.7, g: LOW },
]);

export const HASCHWALTH_CLIPS: ClipDef[] = [
  cut1, cut2, pommel, exec, judgment, blast, scales, theKey, invert, guard, night, vesselC, bslash, torrent, thorns, mend, verdict,
  ...ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name)),
];
export const HASCHWALTH_CHAIN = ['hw_cut1', 'hw_cut2', 'hw_pommel', 'hw_exec'];
