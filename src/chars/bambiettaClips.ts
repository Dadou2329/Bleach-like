// Bambietta's animation set. Haughty and light on her feet: the weight on one leg, the left hand on her hip, the dao
// held low and loose in the right. The string: a cut down across, a rising cut, a level cut, and the kick that sends an
// orb point-blank. Tag Strike, a wound-up level sweep; the orbs flicked off the left fingers; the big kick of the kick
// bomb; the tantrum (curled in, then thrown open screaming); the boulder ripped up and thrown with the left hand;
// Zofiel's release (arms crossed, then flung wide). In Zofiel: the barrage (both arms swept forward with the wings),
// the pointed finger of the armor trap, the bomb shell (curled, then out), the rise for Flatland. Events: 'step' lunge,
// 'hit' strike frame, 'combo' next input, plus per-move fx events.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys, type SwingDef } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });
interface Grip { p: E; dir: E; edge: E; pole: E }
const ik = (g: Grip) => ({ '@gripR': g.p, '@dirR': g.dir, '@edgeR': g.edge, '@poleR': g.pole, '@ikR': [1, 0, 0] as E, '@twoHand': [0, 0, 0] as E });

/** the left hand on her hip */
const HIP_HAND: Record<string, E> = { 'upperarm.L': [14, 0, 24], 'forearm.L': [-72, -20, 0], 'hand.L': [10, 0, 10] };
const IDLE: Record<string, E> = {
  hips: [0, 8, -4], spine: [-2, -2, 2], chest: [-4, -6, 2], neck: [0, 0, 0], head: [-4, 8, -4],
  'thigh.L': [-4, 0, 2], 'shin.L': [6, 0, 0], 'thigh.R': [4, 0, -6], 'shin.R': [12, 0, 0], 'foot.R': [-6, 0, 4],
  ...HIP_HAND,
};
const I = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });

/** the dao held low at her right, the point toward the ground ahead */
const LOW: Grip = { p: [-0.26, -0.34, 0.12], dir: [-0.15, -0.4, 0.9], edge: [0, -0.9, -0.4], pole: [-0.6, -0.3, -0.75] };

export const BAMBIETTA_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.01,
  run: { spine: [8, 0, 0], chest: [2, 0, 0], head: [-6, 0, 0], 'upperarm.L': [-10, 0, 10], 'forearm.L': [-50, 0, 0] },
  sprint: { spine: [16, 0, 0], chest: [4, 0, 0], head: [-10, 0, 0], 'upperarm.L': [30, 0, 14], 'forearm.L': [-40, 0, 0] },
  swingL: 0.9,
  swingR: 0.1,
  freqScale: 1.1,
  grip: {
    idle: LOW,
    walk: LOW,
    run: { p: [-0.28, -0.22, -0.08], dir: [-0.2, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.3, -0.12, -0.18], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.36, -0.06, 0.1], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

function cut(name: string, o: {
  dur: number; step: number; hit: number; combo?: number; extra?: Record<string, number>;
  swing: Omit<SwingDef, 'keys'> & { keys: [number, number, KeyDef['ease']?][] };
  wind: Record<string, E>; strike: Record<string, E>; strikeHips?: E; windHips?: E;
}): ClipDef {
  const tFollow = o.swing.keys[o.swing.keys.length - 2]?.[0] ?? o.hit + 0.12;
  return {
    name, dur: o.dur, fadeIn: 0.05, fadeOut: 0.2, events: { step: o.step, hit: o.hit, ...(o.combo !== undefined ? { combo: o.combo } : {}), ...(o.extra ?? {}) },
    keys: mergeKeys(
      swingKeys(o.swing as SwingDef),
      [
        key(0, I()),
        key(o.swing.keys[1][0], I(o.wind), o.windHips ?? [0, -0.03, -0.02], 'out'),
        key(o.swing.keys[2][0], I(o.strike), o.strikeHips ?? [0, -0.05, 0.05], 'out'),
        key(tFollow, I(o.strike), o.strikeHips ?? [0, -0.05, 0.05], 'out'),
        key(o.dur, I(), [0, -0.012, 0], 'inOut'),
      ],
    ),
  };
}

/** a held pose for moves that do not swing: the dao kept low */
const pose = (name: string, dur: number, events: Record<string, number>, keys: KeyDef[], grips: { t: number; g: Grip; e?: KeyDef['ease'] }[] = [{ t: 0, g: LOW }, { t: dur, g: LOW }]): ClipDef => ({
  name, dur, fadeIn: 0.06, fadeOut: 0.24, events,
  keys: mergeKeys(grips.map((k) => ({ t: k.t, ease: k.e ?? 'inOut', c: ik(k.g) })), keys),
});

// ------------------------------------------------------------------ the string

const cut1 = cut('bb_cut1', {
  dur: 0.5, step: 0.05, hit: 0.14, combo: 0.22,
  swing: { a: [0, 1, 0.2], b: [0.9, -0.3, 0.2], c: [-0.06, 0.14, 0.08], r: 0.4, pole: [-0.6, -0.5, -0.5], keys: [[0, 70, 'out'], [0.07, 150, 'out'], [0.16, -10, 'out'], [0.26, -50, 'out'], [0.5, 10, 'inOut']] },
  wind: { hips: [0, -12, 0], chest: [-2, -14, 0], head: [-2, 10, 0], 'upperarm.L': [-20, 0, 30], 'forearm.L': [-40, 0, 0] },
  strike: { hips: [2, 16, 0], spine: [4, 8, 0], chest: [4, 16, 0], head: [-4, -12, 0], 'thigh.L': [-22, 0, 4], 'shin.L': [22, 0, 0], 'upperarm.L': [-10, 0, 40], 'forearm.L': [-30, 0, 0] },
});
const cut2 = cut('bb_cut2', {
  dur: 0.48, step: 0.05, hit: 0.13, combo: 0.21,
  swing: { a: [0, 0, 1], b: [0.8, 0.6, 0], c: [-0.06, 0.06, 0.08], r: 0.42, pole: [-0.6, -0.5, -0.5], keys: [[0, -30, 'out'], [0.06, -130, 'out'], [0.15, 50, 'out'], [0.26, 90, 'out'], [0.48, 40, 'inOut']] },
  wind: { hips: [0, 14, 0], chest: [0, 12, 0], head: [-2, -10, 0] },
  strike: { hips: [2, -14, 0], spine: [4, -8, 0], chest: [2, -14, 0], head: [-6, 10, 0], 'thigh.L': [-20, 0, 4], 'shin.L': [20, 0, 0] },
});
const cut3 = cut('bb_cut3', {
  dur: 0.5, step: 0.05, hit: 0.14, combo: 0.23,
  swing: { a: [0, 0, 1], b: [1, 0, 0], c: [-0.08, 0.1, 0.06], r: 0.42, pole: [-0.5, -0.6, -0.6], keys: [[0, -60, 'out'], [0.07, -130, 'out'], [0.16, 50, 'out'], [0.28, 90, 'out'], [0.5, 40, 'inOut']] },
  wind: { hips: [0, -18, 0], chest: [0, -14, 0], head: [-2, 10, 0] },
  strike: { hips: [0, 16, 0], spine: [2, 8, 0], chest: [2, 16, 0], head: [-2, -12, 0] },
});
/** LMB 4: the left hand drops an orb and her right boot sends it into them */
const kick = pose('bb_kick', 0.66, { step: 0.08, orb: 0.1, hit: 0.24 }, [
  key(0, I()),
  key(0.12, I({ spine: [-6, 0, 0], chest: [-6, -8, 0], 'upperarm.L': [-60, 0, 14], 'forearm.L': [-30, 0, 0], 'hand.L': [-20, 0, 0], 'thigh.R': [30, 0, -4], 'shin.R': [60, 0, 0] }), [0, -0.03, -0.04], 'out'),
  key(0.24, I({ spine: [-14, 0, 0], chest: [-10, -4, 0], head: [10, 0, 0], 'upperarm.L': [-20, 0, 50], 'forearm.L': [-20, 0, 0], 'thigh.R': [-96, 0, -4], 'shin.R': [6, 0, 0], 'foot.R': [20, 0, 0], 'thigh.L': [8, 0, 6], 'shin.L': [12, 0, 0] }), [0, 0.04, 0.06], 'outExpo'),
  key(0.4, I({ spine: [-10, 0, 0], 'thigh.R': [-70, 0, -4], 'shin.R': [30, 0, 0] }), [0, 0.02, 0.04], 'inOut'),
  key(0.66, I(), [0, -0.012, 0], 'inOut'),
]);

// ------------------------------------------------------------------ the skills

/** RMB: Tag Strike — wound far back, one level sweep that arms whatever it passes */
const tag = cut('bb_tag', {
  dur: 0.86, step: 0.3, hit: 0.4, extra: { wind: 0.06 },
  swing: { a: [0, 0, 1], b: [1, 0.05, 0], c: [-0.08, 0.1, 0.06], r: 0.46, pole: [-0.5, -0.6, -0.6], keys: [[0, -40, 'out'], [0.3, -150, 'inOut'], [0.42, 70, 'out'], [0.56, 110, 'out'], [0.86, 50, 'inOut']] },
  wind: { hips: [0, -30, 0], spine: [0, -12, 0], chest: [0, -24, 0], head: [-2, 20, 0], 'thigh.L': [-10, 0, 8], 'thigh.R': [10, 0, -8], 'upperarm.L': [-40, 0, 30], 'forearm.L': [-50, 0, 0] },
  strike: { hips: [4, 24, 0], spine: [6, 12, 0], chest: [4, 24, 0], head: [-4, -18, 0], 'thigh.L': [-34, 0, 6], 'shin.L': [36, 0, 0], 'thigh.R': [18, 0, -6], 'upperarm.L': [-10, 0, 60], 'forearm.L': [-20, 0, 0] },
  strikeHips: [0, -0.1, 0.12],
});
/** Q: three orbs flicked off the left fingers */
const flick = pose('bb_flick', 0.7, { o0: 0.14, o1: 0.2, o2: 0.26 }, [
  key(0, I()),
  key(0.1, I({ chest: [0, -20, 0], head: [0, 12, 0], 'upperarm.L': [-40, 0, 50], 'forearm.L': [-80, 0, 0], 'hand.L': [-20, 0, 0] }), [0, -0.02, 0], 'out'),
  key(0.22, I({ chest: [2, 16, 0], head: [-2, -10, 0], 'upperarm.L': [-88, 0, 20], 'forearm.L': [-6, 0, 0], 'hand.L': [-30, 0, 0] }), [0, -0.02, 0.03], 'outExpo'),
  key(0.4, I({ chest: [2, 14, 0], 'upperarm.L': [-84, 0, 18], 'forearm.L': [-8, 0, 0], 'hand.L': [-20, 0, 0] }), [0, -0.02, 0.03], 'linear'),
  key(0.7, I(), [0, -0.012, 0], 'inOut'),
]);
/** E: the kick bomb — the orb set down, a big swinging kick */
const kickBomb = pose('bb_kickbomb', 0.9, { orb: 0.08, step: 0.24, kick: 0.36 }, [
  key(0, I()),
  key(0.16, I({ spine: [8, 0, 0], chest: [6, 0, 0], 'upperarm.L': [-50, 0, 10], 'forearm.L': [-20, 0, 0], 'thigh.R': [40, 0, -6], 'shin.R': [80, 0, 0], 'thigh.L': [-6, 0, 6], 'shin.L': [14, 0, 0] }), [0, -0.06, -0.06], 'out'),
  key(0.36, I({ spine: [-16, 0, 0], chest: [-12, 0, 0], head: [12, 0, 0], 'upperarm.L': [-10, 0, 60], 'forearm.L': [-20, 0, 0], 'upperarm.R': [10, 0, -40], 'thigh.R': [-110, 0, -4], 'shin.R': [4, 0, 0], 'foot.R': [24, 0, 0], 'thigh.L': [10, 0, 6], 'shin.L': [10, 0, 0] }), [0, 0.04, 0.1], 'outExpo'),
  key(0.56, I({ spine: [-10, 0, 0], 'thigh.R': [-80, 0, -4], 'shin.R': [30, 0, 0] }), [0, 0.02, 0.06], 'inOut'),
  key(0.9, I(), [0, -0.012, 0], 'inOut'),
]);
/** R: the tantrum — curled in, fists clenched, then thrown open screaming */
const globe = pose('bb_globe', 1.4, { charge: 0.1, burst: 0.62 }, [
  key(0, I()),
  key(0.5, I({ spine: [18, 0, 0], chest: [18, 0, 0], neck: [10, 0, 0], head: [14, 0, 0], 'upperarm.L': [-40, 0, -10], 'forearm.L': [-110, 0, 0], 'hand.L': [0, 0, 0], 'thigh.L': [-30, 0, 8], 'shin.L': [44, 0, 0], 'thigh.R': [-30, 0, -8], 'shin.R': [44, 0, 0] }), [0, -0.12, 0], 'inOut'),
  key(0.66, I({ spine: [-14, 0, 0], chest: [-16, 0, 0], neck: [-8, 0, 0], head: [-22, 0, 0], 'upperarm.L': [-20, 0, 80], 'forearm.L': [-10, 0, 0], 'thigh.L': [-4, 0, 12], 'thigh.R': [4, 0, -12] }), [0, 0.04, 0], 'outExpo'),
  key(1.1, I({ spine: [-12, 0, 0], chest: [-14, 0, 0], head: [-18, 0, 0], 'upperarm.L': [-18, 0, 74], 'forearm.L': [-12, 0, 0] }), [0, 0.03, 0], 'linear'),
  key(1.4, I(), [0, -0.012, 0], 'inOut'),
], [
  { t: 0, g: LOW },
  { t: 0.5, g: { p: [-0.18, -0.06, 0.16], dir: [0.2, -0.9, 0.3], edge: [0, -0.3, -0.95], pole: [-0.6, -0.4, -0.6] } },
  { t: 0.66, g: { p: [-0.5, 0.2, 0.0], dir: [-0.7, 0.6, 0.2], edge: [0, -0.3, -0.95], pole: [-0.4, -0.7, -0.4] }, e: 'outExpo' },
  { t: 1.1, g: { p: [-0.48, 0.18, 0.0], dir: [-0.7, 0.6, 0.2], edge: [0, -0.3, -0.95], pole: [-0.4, -0.7, -0.4] }, e: 'linear' },
  { t: 1.4, g: LOW },
]);
/** G: the boulder ripped up with the left hand and thrown overhand */
const hurl = pose('bb_hurl', 1.1, { rip: 0.22, throw: 0.62 }, [
  key(0, I()),
  key(0.22, I({ spine: [30, 0, 0], chest: [20, 0, 0], head: [10, 0, 0], 'upperarm.L': [-60, 0, 10], 'forearm.L': [-10, 0, 0], 'thigh.L': [-50, 0, 8], 'shin.L': [80, 0, 0], 'thigh.R': [-20, 0, -8], 'shin.R': [60, 0, 0] }), [0, -0.24, 0.06], 'inOut'),
  key(0.46, I({ spine: [-8, 0, 0], chest: [-10, 16, 0], head: [-6, -10, 0], 'upperarm.L': [-170, 0, 10], 'forearm.L': [-40, 0, 0], 'thigh.L': [-10, 0, 8], 'thigh.R': [10, 0, -8] }), [0, 0, -0.04], 'out'),
  key(0.62, I({ spine: [14, 0, 0], chest: [10, -24, 0], head: [-2, 16, 0], 'upperarm.L': [-60, 0, 10], 'forearm.L': [-6, 0, 0], 'thigh.L': [-36, 0, 8], 'shin.L': [40, 0, 0], 'thigh.R': [20, 0, -8] }), [0, -0.08, 0.12], 'outExpo'),
  key(1.1, I(), [0, -0.012, 0], 'inOut'),
]);
/** F: Zofiel — the arms crossed over her chest, then flung wide */
const release = pose('bb_zofiel', 1.5, { burst: 0.74 }, [
  key(0, I()),
  key(0.5, I({ spine: [10, 0, 0], chest: [10, 0, 0], head: [12, 0, 0], 'upperarm.L': [-60, -40, -20], 'forearm.L': [-100, 0, 0] }), [0, -0.06, 0], 'inOut'),
  key(0.76, I({ spine: [-12, 0, 0], chest: [-14, 0, 0], head: [-18, 0, 0], 'upperarm.L': [-10, 0, 80], 'forearm.L': [-10, 0, 0] }), [0, 0.03, 0], 'outExpo'),
  key(1.2, I({ spine: [-10, 0, 0], chest: [-12, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-8, 0, 74], 'forearm.L': [-12, 0, 0] }), [0, 0.02, 0], 'linear'),
  key(1.5, I(), [0, -0.012, 0], 'inOut'),
], [
  { t: 0, g: LOW },
  { t: 0.5, g: { p: [0.08, 0.16, 0.2], dir: [0.4, 0.8, 0.4], edge: [0, -0.4, 0.9], pole: [-0.7, -0.5, -0.4] } },
  { t: 0.76, g: { p: [-0.52, 0.16, 0.0], dir: [-0.7, 0.6, 0.2], edge: [0, -0.3, -0.95], pole: [-0.4, -0.7, -0.4] }, e: 'outExpo' },
  { t: 1.2, g: { p: [-0.5, 0.15, 0.0], dir: [-0.7, 0.6, 0.2], edge: [0, -0.3, -0.95], pole: [-0.4, -0.7, -0.4] }, e: 'linear' },
  { t: 1.5, g: LOW },
]);

// ------------------------------------------------------------------ Zofiel

/** the barrage: both arms swept forward as the wings loose their orbs */
const barrage = pose('bb_barrage', 0.62, { fire: 0.16 }, [
  key(0, I()),
  key(0.12, I({ spine: [-8, 0, 0], chest: [-10, 0, 0], head: [-6, 0, 0], 'upperarm.L': [-30, 0, 60], 'forearm.L': [-30, 0, 0] }), [0, 0, -0.02], 'out'),
  key(0.2, I({ spine: [10, 0, 0], chest: [10, 0, 0], head: [4, 0, 0], 'upperarm.L': [-90, 0, 10], 'forearm.L': [-6, 0, 0], 'hand.L': [-30, 0, 0] }), [0, -0.02, 0.04], 'outExpo'),
  key(0.62, I(), [0, -0.012, 0], 'inOut'),
], [
  { t: 0, g: LOW },
  { t: 0.12, g: { p: [-0.5, 0.16, -0.04], dir: [-0.7, 0.6, -0.2], edge: [0, -0.3, -0.95], pole: [-0.4, -0.7, -0.4] } },
  { t: 0.2, g: { p: [-0.18, 0.06, 0.5], dir: [-0.1, 0.3, 0.95], edge: [0, -1, 0.3], pole: [-0.8, -0.5, 0] }, e: 'outExpo' },
  { t: 0.62, g: LOW },
]);
/** the armor trap: the left index levelled at the target */
const point = pose('bb_point', 0.8, { mark: 0.2 }, [
  key(0, I()),
  key(0.16, I({ chest: [0, 20, 0], head: [-2, -14, 0], 'upperarm.L': [-88, 0, -6], 'forearm.L': [-4, 0, 0], 'hand.L': [0, 0, 0] }), [0, -0.01, 0], 'outExpo'),
  key(0.5, I({ chest: [0, 20, 0], head: [-2, -14, 0], 'upperarm.L': [-88, 0, -6], 'forearm.L': [-4, 0, 0] }), [0, -0.01, 0], 'linear'),
  key(0.8, I(), [0, -0.012, 0], 'inOut'),
]);
/** the bomb shell: curled tight, then out */
const shell = pose('bb_shell', 0.8, { burst: 0.3 }, [
  key(0, I()),
  key(0.24, I({ spine: [20, 0, 0], chest: [20, 0, 0], head: [16, 0, 0], 'upperarm.L': [-50, 0, -10], 'forearm.L': [-120, 0, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [60, 0, 0], 'thigh.R': [-40, 0, -6], 'shin.R': [60, 0, 0] }), [0, -0.06, 0], 'inOut'),
  key(0.34, I({ spine: [-12, 0, 0], chest: [-14, 0, 0], head: [-16, 0, 0], 'upperarm.L': [-10, 0, 80], 'forearm.L': [-10, 0, 0], 'thigh.L': [-4, 0, 14], 'thigh.R': [4, 0, -14] }), [0, 0.02, 0], 'outExpo'),
  key(0.8, I(), [0, -0.012, 0], 'inOut'),
]);
/** Flatland: she rises, the arms raised, and lets it rain */
const rise = pose('bb_rise', 1.6, { rain: 0.4 }, [
  key(0, I()),
  key(0.4, I({ spine: [-12, 0, 0], chest: [-14, 0, 0], head: [-24, 0, 0], 'upperarm.L': [-160, 0, 30], 'forearm.L': [-10, 0, 0], 'thigh.L': [-20, 0, 4], 'shin.L': [40, 0, 0], 'thigh.R': [-10, 0, -4], 'shin.R': [30, 0, 0] }), [0, 0.02, 0], 'out'),
  key(1.3, I({ spine: [-10, 0, 0], chest: [-12, 0, 0], head: [-20, 0, 0], 'upperarm.L': [-156, 0, 30], 'forearm.L': [-12, 0, 0], 'thigh.L': [-20, 0, 4], 'shin.L': [40, 0, 0] }), [0, 0.02, 0], 'linear'),
  key(1.6, I(), [0, -0.012, 0], 'inOut'),
], [
  { t: 0, g: LOW },
  { t: 0.4, g: { p: [-0.3, 0.5, 0.0], dir: [-0.2, 1, 0.1], edge: [0, -0.1, -1], pole: [-0.8, -0.3, -0.3] }, e: 'out' },
  { t: 1.3, g: { p: [-0.3, 0.48, 0.0], dir: [-0.2, 1, 0.1], edge: [0, -0.1, -1], pole: [-0.8, -0.3, -0.3] }, e: 'linear' },
  { t: 1.6, g: LOW },
]);

export const BAMBIETTA_CLIPS: ClipDef[] = [
  cut1, cut2, cut3, kick, tag, flick, kickBomb, globe, hurl, release, barrage, point, shell, rise,
  ...ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name)),
];
export const BAMBIETTA_CHAIN = ['bb_cut1', 'bb_cut2', 'bb_cut3', 'bb_kick'];
