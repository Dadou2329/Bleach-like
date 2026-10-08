// Liltotto's animation set. Bored and economical: a slight slouch, the head cocked, arms loose. The string is the
// cleanest of the Bambies: a palm, a knee, a low sweep and the lunging chomp (the head driven forward as the small maw
// snaps). The Arterie haymaker wound far back; The Glutton's bite (the head thrust forward on a lunge); Swallow (the
// maw held open, the chin out); the bow out of the heart case at her back, three shots; Feast (a slow walk, the head
// forward, chomping); the release (curled, then thrown open). In Gagael: Spork (an arm thrust out, the cuff fired),
// Spife (the whip swung overhead and cracked down), Golden Crunch (both palms slapped onto the ground), Sklaverei
// (arms open low) and Full Course (arms raised wide, then brought down together like closing jaws).
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

const IDLE: Record<string, E> = {
  hips: [0, 6, 0], spine: [4, -2, 0], chest: [2, -4, 0], neck: [2, 0, 0], head: [2, 8, 8],
  'thigh.L': [-2, 0, 3], 'shin.L': [4, 0, 0], 'thigh.R': [3, 0, -4], 'shin.R': [8, 0, 0],
  'upperarm.L': [4, 0, 8], 'forearm.L': [-14, 0, 0], 'upperarm.R': [2, 0, -8], 'forearm.R': [-18, 0, 0],
};
const I = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });

export const LILTOTTO_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.01,
  run: { spine: [10, 0, 0], chest: [2, 0, 0], head: [-6, 0, 0], 'upperarm.L': [-10, 0, 10], 'forearm.L': [-60, 0, 0], 'upperarm.R': [-10, 0, -10], 'forearm.R': [-60, 0, 0] },
  sprint: { spine: [18, 0, 0], chest: [4, 0, 0], head: [-12, 0, 0], 'upperarm.L': [36, 0, 12], 'forearm.L': [-30, 0, 0], 'upperarm.R': [36, 0, -12], 'forearm.R': [-30, 0, 0] },
  swingL: 0.9,
  swingR: 0.9,
  freqScale: 1.15,
};

const clip = (name: string, dur: number, events: Record<string, number>, keys: KeyDef[], o: { fadeIn?: number; fadeOut?: number; loop?: boolean } = {}): ClipDef => ({
  name, dur, fadeIn: o.fadeIn ?? 0.05, fadeOut: o.fadeOut ?? 0.22, events, keys, ...(o.loop ? { loop: true } : {}),
});

// ------------------------------------------------------------------ the string

/** LMB 1: a straight right palm */
const palm = clip('lt_palm', 0.42, { step: 0.04, hit: 0.12, combo: 0.2 }, [
  key(0, I()),
  key(0.07, I({ hips: [0, -14, 0], chest: [0, -16, 0], 'upperarm.R': [14, 0, -24], 'forearm.R': [-100, 0, 0] }), [0, -0.03, -0.03], 'out'),
  key(0.13, I({ hips: [2, 18, 0], spine: [6, 6, 0], chest: [4, 18, 0], head: [0, -12, 0], 'thigh.L': [-26, 0, 4], 'shin.L': [26, 0, 0], 'upperarm.R': [-88, 0, -4], 'forearm.R': [-6, 0, 0], 'hand.R': [0, 0, -70], 'upperarm.L': [-20, 0, 20], 'forearm.L': [-80, 0, 0] }), [0, -0.05, 0.07], 'outExpo'),
  key(0.25, I({ hips: [2, 18, 0], spine: [6, 6, 0], chest: [4, 18, 0], head: [0, -12, 0], 'thigh.L': [-26, 0, 4], 'shin.L': [26, 0, 0], 'upperarm.R': [-86, 0, -4], 'forearm.R': [-8, 0, 0], 'hand.R': [0, 0, -66], 'upperarm.L': [-20, 0, 20], 'forearm.L': [-80, 0, 0] }), [0, -0.05, 0.06], 'linear'),
  key(0.42, I(), [0, -0.012, 0], 'inOut'),
]);
/** LMB 2: a left knee driven up, the hands pulling down */
const knee = clip('lt_knee', 0.46, { step: 0.05, hit: 0.14, combo: 0.22 }, [
  key(0, I()),
  key(0.08, I({ spine: [-4, 0, 0], 'thigh.L': [-30, 0, 4], 'shin.L': [70, 0, 0], 'upperarm.L': [-60, 0, 10], 'forearm.L': [-50, 0, 0], 'upperarm.R': [-60, 0, -10], 'forearm.R': [-50, 0, 0] }), [0, -0.02, 0], 'out'),
  key(0.15, I({ spine: [12, 0, 0], chest: [8, 0, 0], 'thigh.L': [-96, 0, 2], 'shin.L': [110, 0, 0], 'foot.L': [30, 0, 0], 'thigh.R': [6, 0, -4], 'shin.R': [8, 0, 0], 'upperarm.L': [-40, 0, 10], 'forearm.L': [-90, 0, 0], 'upperarm.R': [-40, 0, -10], 'forearm.R': [-90, 0, 0] }), [0, 0.04, 0.06], 'outExpo'),
  key(0.3, I({ spine: [8, 0, 0], 'thigh.L': [-70, 0, 2], 'shin.L': [90, 0, 0] }), [0, 0.02, 0.04], 'inOut'),
  key(0.46, I(), [0, -0.012, 0], 'inOut'),
]);
/** LMB 3: a low spinning sweep of the right leg */
const sweep = clip('lt_sweep', 0.56, { step: 0.06, hit: 0.2, combo: 0.3 }, [
  key(0, I()),
  key(0.1, I({ hips: [0, 30, 0], spine: [20, 0, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [90, 0, 0], 'thigh.R': [-10, 0, -40], 'shin.R': [20, 0, 0], 'upperarm.L': [-30, 0, 40], 'upperarm.R': [-30, 0, -40] }), [0, -0.3, 0], 'out'),
  key(0.2, I({ hips: [0, -60, 0], spine: [24, 0, 0], 'thigh.L': [-60, 0, 6], 'shin.L': [110, 0, 0], 'thigh.R': [-20, 0, -70], 'shin.R': [6, 0, 0], 'upperarm.L': [-30, 0, 50], 'upperarm.R': [-30, 0, -50] }), [0, -0.36, 0], 'outExpo'),
  key(0.36, I({ hips: [0, -90, 0], spine: [20, 0, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [90, 0, 0], 'thigh.R': [-10, 0, -40], 'shin.R': [20, 0, 0] }), [0, -0.3, 0], 'inOut'),
  key(0.56, I(), [0, -0.012, 0], 'inOut'),
]);
/** LMB 4: the lunging chomp — the head driven forward, the small maw snapping */
const chomp = clip('lt_chomp', 0.62, { step: 0.08, open: 0.1, hit: 0.22, combo: 0.36 }, [
  key(0, I()),
  key(0.12, I({ spine: [-8, 0, 0], chest: [-8, 0, 0], neck: [-10, 0, 0], head: [-16, 0, 0], 'upperarm.L': [10, 0, 30], 'upperarm.R': [10, 0, -30] }), [0, -0.02, -0.02], 'out'),
  key(0.22, I({ spine: [22, 0, 0], chest: [14, 0, 0], neck: [10, 0, 0], head: [6, 0, 0], 'thigh.L': [-30, 0, 4], 'shin.L': [30, 0, 0], 'thigh.R': [16, 0, -4], 'upperarm.L': [30, 0, 40], 'forearm.L': [-20, 0, 0], 'upperarm.R': [30, 0, -40], 'forearm.R': [-20, 0, 0] }), [0, -0.08, 0.12], 'outExpo'),
  key(0.38, I({ spine: [16, 0, 0], chest: [10, 0, 0], neck: [6, 0, 0], 'thigh.L': [-24, 0, 4], 'shin.L': [24, 0, 0] }), [0, -0.06, 0.1], 'inOut'),
  key(0.62, I(), [0, -0.012, 0], 'inOut'),
]);
export const LILTOTTO_CHAIN = ['lt_palm', 'lt_knee', 'lt_sweep', 'lt_chomp'];

// ------------------------------------------------------------------ the skills

/** RMB: the Arterie haymaker — wound far back (the veins lighting down the arm), thrown from the hip */
const haymaker = clip('lt_haymaker', 0.8, { step: 0.3, charge: 0.06, hit: 0.4 }, [
  key(0, I()),
  key(0.3, I({ hips: [0, -30, 0], spine: [-4, -10, 0], chest: [-6, -24, 0], head: [0, 26, 0], 'thigh.L': [-12, 0, 8], 'thigh.R': [12, 0, -8], 'upperarm.R': [30, 0, -40], 'forearm.R': [-110, 0, 0], 'upperarm.L': [-60, 0, 30], 'forearm.L': [-40, 0, 0] }), [0, -0.05, -0.04], 'inOut'),
  key(0.41, I({ hips: [4, 26, 0], spine: [10, 12, 0], chest: [6, 26, 0], head: [-2, -20, 0], 'thigh.L': [-36, 0, 6], 'shin.L': [36, 0, 0], 'thigh.R': [20, 0, -6], 'upperarm.R': [-92, 0, -2], 'forearm.R': [-4, 0, 0], 'upperarm.L': [-10, 0, 40], 'forearm.L': [-60, 0, 0] }), [0, -0.1, 0.14], 'outExpo'),
  key(0.6, I({ hips: [4, 26, 0], spine: [10, 12, 0], chest: [6, 26, 0], 'thigh.L': [-34, 0, 6], 'shin.L': [34, 0, 0], 'upperarm.R': [-88, 0, -2], 'forearm.R': [-8, 0, 0] }), [0, -0.09, 0.12], 'linear'),
  key(0.8, I(), [0, -0.012, 0], 'inOut'),
]);
/** Q: The Glutton — a lunge, the head thrust out as the maw opens and slams shut */
const bite = clip('lt_bite', 0.86, { step: 0.08, open: 0.1, hit: 0.36 }, [
  key(0, I()),
  key(0.14, I({ spine: [-10, 0, 0], chest: [-10, 0, 0], neck: [-10, 0, 0], head: [-20, 0, 0], 'upperarm.L': [10, 0, 40], 'forearm.L': [-20, 0, 0], 'upperarm.R': [10, 0, -40], 'forearm.R': [-20, 0, 0] }), [0, 0.0, -0.02], 'out'),
  key(0.36, I({ spine: [26, 0, 0], chest: [16, 0, 0], neck: [12, 0, 0], head: [10, 0, 0], 'thigh.L': [-40, 0, 4], 'shin.L': [40, 0, 0], 'thigh.R': [24, 0, -4], 'shin.R': [10, 0, 0], 'upperarm.L': [36, 0, 30], 'upperarm.R': [36, 0, -30] }), [0, -0.1, 0.16], 'outExpo'),
  key(0.6, I({ spine: [18, 0, 0], chest: [10, 0, 0], neck: [6, 0, 0], 'thigh.L': [-30, 0, 4], 'shin.L': [30, 0, 0] }), [0, -0.07, 0.12], 'inOut'),
  key(0.86, I(), [0, -0.012, 0], 'inOut'),
]);
/** E: Swallow — the chin out, the maw held open before her */
const swallow = clip('lt_swallow', 1.4, { open: 0.1, close: 1.2 }, [
  key(0, I()),
  key(0.12, I({ spine: [10, 0, 0], chest: [4, 0, 0], neck: [-6, 0, 0], head: [-14, 0, 0], 'thigh.L': [-16, 0, 6], 'shin.L': [16, 0, 0], 'upperarm.L': [10, 0, 26], 'upperarm.R': [10, 0, -26] }), [0, -0.04, 0.02], 'outExpo'),
  key(1.2, I({ spine: [12, 0, 0], chest: [4, 0, 0], neck: [-6, 0, 0], head: [-12, 0, 0], 'thigh.L': [-16, 0, 6], 'shin.L': [16, 0, 0], 'upperarm.L': [10, 0, 26], 'upperarm.R': [10, 0, -26] }), [0, -0.04, 0.02], 'linear'),
  key(1.4, I(), [0, -0.012, 0], 'inOut'),
]);
/** R: the bow — a hand to the heart case at her back, the bow caught as it springs over her shoulder, three shots */
const DRAW: Record<string, E> = { hips: [0, -26, 0], spine: [-2, -8, 0], chest: [-4, -18, 0], head: [-2, 28, 0], 'upperarm.L': [-88, 0, 24], 'forearm.L': [-2, 0, 0], 'hand.L': [0, 0, 0], 'upperarm.R': [-84, 0, 40], 'forearm.R': [-140, 0, 0] };
const LOOSE: Record<string, E> = { ...DRAW, chest: [-8, -22, 0], 'upperarm.R': [-60, 0, -10], 'forearm.R': [-70, 0, 0] };
const bow = clip('lt_bow', 1.3, { pop: 0.12, catch: 0.3, a0: 0.62, a1: 0.8, a2: 0.98 }, [
  key(0, I()),
  key(0.12, I({ chest: [0, 16, 0], 'upperarm.R': [40, 0, -10], 'forearm.R': [-80, 0, 0] }), [0, -0.01, 0], 'out'),
  key(0.3, I({ head: [-16, 0, 0], 'upperarm.L': [-150, 0, 20], 'forearm.L': [-10, 0, 0] }), [0, 0.01, 0], 'outExpo'),
  key(0.5, I(DRAW), [0, -0.02, 0], 'inOut'),
  key(0.62, I(LOOSE), [0, -0.02, -0.02], 'outExpo'),
  key(0.72, I(DRAW), [0, -0.02, 0], 'inOut'),
  key(0.8, I(LOOSE), [0, -0.02, -0.02], 'outExpo'),
  key(0.9, I(DRAW), [0, -0.02, 0], 'inOut'),
  key(0.98, I(LOOSE), [0, -0.02, -0.02], 'outExpo'),
  key(1.3, I(), [0, -0.012, 0], 'inOut'),
], { fadeOut: 0.26 });
/** G: Feast — a slow walk, the head forward, the maw chomping (looped while she eats) */
const feast = clip('lt_feast', 0.6, { chomp: 0.3 }, [
  key(0, { spine: [16, 0, 0], chest: [8, 0, 0], neck: [6, 0, 0], head: [-6, 0, 0], 'upperarm.L': [20, 0, 20], 'forearm.L': [-30, 0, 0], 'upperarm.R': [20, 0, -20], 'forearm.R': [-30, 0, 0] }, undefined, 'inOut'),
  key(0.3, { spine: [22, 0, 0], chest: [12, 0, 0], neck: [10, 0, 0], head: [6, 0, 0], 'upperarm.L': [24, 0, 22], 'forearm.L': [-30, 0, 0], 'upperarm.R': [24, 0, -22], 'forearm.R': [-30, 0, 0] }, undefined, 'outExpo'),
  key(0.6, { spine: [16, 0, 0], chest: [8, 0, 0], neck: [6, 0, 0], head: [-6, 0, 0], 'upperarm.L': [20, 0, 20], 'forearm.L': [-30, 0, 0], 'upperarm.R': [20, 0, -20], 'forearm.R': [-30, 0, 0] }, undefined, 'inOut'),
], { loop: true, fadeIn: 0.12, fadeOut: 0.2 });
/** F: Gagael — curled in, then thrown open, the head back */
const release = clip('lt_release', 1.1, { burst: 0.6 }, [
  key(0, I()),
  key(0.38, I({ spine: [18, 0, 0], chest: [12, 0, 0], head: [12, 0, 0], 'thigh.L': [-24, 0, 4], 'shin.L': [40, 0, 0], 'thigh.R': [-18, 0, -4], 'shin.R': [36, 0, 0], 'upperarm.L': [-60, 0, -20], 'forearm.L': [-110, 0, 0], 'upperarm.R': [-60, 0, 20], 'forearm.R': [-110, 0, 0] }), [0, -0.08, 0], 'inOut'),
  key(0.6, I({ spine: [-12, 0, 0], chest: [-14, 0, 0], head: [-22, 0, 0], 'upperarm.L': [-20, 0, 70], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-20, 0, -70], 'forearm.R': [-10, 0, 0] }), [0, 0.02, 0], 'outExpo'),
  key(0.85, I({ spine: [-10, 0, 0], chest: [-12, 0, 0], head: [-18, 0, 0], 'upperarm.L': [-20, 0, 64], 'upperarm.R': [-20, 0, -64] }), [0, 0.01, 0], 'inOut'),
  key(1.1, I(), [0, -0.012, 0], 'inOut'),
]);

// ------------------------------------------------------------------ Gagael

/** Q: Spork — the right arm thrown out, the cuff fired off the wrist */
const spork = clip('lt_spork', 0.7, { fire: 0.2 }, [
  key(0, I()),
  key(0.12, I({ hips: [0, -16, 0], chest: [0, -20, 0], 'upperarm.R': [10, 0, -30], 'forearm.R': [-110, 0, 0] }), [0, -0.02, -0.02], 'out'),
  key(0.2, I({ hips: [2, 16, 0], spine: [6, 6, 0], chest: [4, 18, 0], head: [-2, -10, 0], 'upperarm.R': [-90, 0, -2], 'forearm.R': [-2, 0, 0], 'hand.R': [0, 0, -20], 'thigh.L': [-24, 0, 4], 'shin.L': [24, 0, 0] }), [0, -0.04, 0.06], 'outExpo'),
  key(0.42, I({ hips: [2, 14, 0], chest: [4, 16, 0], 'upperarm.R': [-86, 0, -4], 'forearm.R': [-6, 0, 0] }), [0, -0.04, 0.05], 'linear'),
  key(0.7, I(), [0, -0.012, 0], 'inOut'),
]);
/** E: Spife — the left arm swings the whip up over her head and cracks it down */
const spife = clip('lt_spife', 0.9, { out: 0.14, crack: 0.34 }, [
  key(0, I()),
  key(0.18, I({ spine: [-10, 0, 0], chest: [-12, 10, 0], head: [-6, -6, 0], 'upperarm.L': [-170, 0, 20], 'forearm.L': [-30, 0, 0] }), [0, 0.01, -0.02], 'inOut'),
  key(0.34, I({ spine: [18, 0, 0], chest: [10, -8, 0], head: [4, 6, 0], 'upperarm.L': [-70, 0, 10], 'forearm.L': [-4, 0, 0], 'thigh.L': [-26, 0, 4], 'shin.L': [26, 0, 0] }), [0, -0.06, 0.08], 'outExpo'),
  key(0.6, I({ spine: [14, 0, 0], chest: [8, -6, 0], 'upperarm.L': [-60, 0, 12], 'forearm.L': [-10, 0, 0], 'thigh.L': [-22, 0, 4], 'shin.L': [22, 0, 0] }), [0, -0.05, 0.06], 'inOut'),
  key(0.9, I(), [0, -0.012, 0], 'inOut'),
]);
/** R: Golden Crunch — down on one knee, both palms slapped onto the ground, held as the wave runs */
const crunch = clip('lt_crunch', 1.2, { press: 0.3 }, [
  key(0, I()),
  key(0.3, I({ spine: [40, 0, 0], chest: [14, 0, 0], head: [-30, 0, 0], 'thigh.L': [-80, 0, 6], 'shin.L': [100, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [110, 0, 0], 'upperarm.L': [-60, 0, 14], 'forearm.L': [-6, 0, 0], 'upperarm.R': [-60, 0, -14], 'forearm.R': [-6, 0, 0], 'hand.L': [0, 0, 60], 'hand.R': [0, 0, -60] }), [0, -0.42, 0.06], 'outExpo'),
  key(0.95, I({ spine: [40, 0, 0], chest: [14, 0, 0], head: [-30, 0, 0], 'thigh.L': [-80, 0, 6], 'shin.L': [100, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [110, 0, 0], 'upperarm.L': [-60, 0, 14], 'forearm.L': [-6, 0, 0], 'upperarm.R': [-60, 0, -14], 'forearm.R': [-6, 0, 0] }), [0, -0.42, 0.06], 'linear'),
  key(1.2, I(), [0, -0.012, 0], 'inOut'),
]);
/** G: Sklaverei — arms open low, palms up; held by the kit */
const sklav = clip('lt_sklav', 2.4, { start: 0.2 }, [
  key(0, I()),
  key(0.3, I({ spine: [-6, 0, 0], chest: [-10, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-26, 0, 46], 'forearm.L': [-26, -50, 0], 'upperarm.R': [-26, 0, -46], 'forearm.R': [-26, 50, 0] }), [0, 0.02, 0], 'out'),
  key(2.0, I({ spine: [-8, 0, 0], chest: [-12, 0, 0], head: [-18, 0, 0], 'upperarm.L': [-30, 0, 50], 'forearm.L': [-26, -50, 0], 'upperarm.R': [-30, 0, -50], 'forearm.R': [-26, 50, 0] }), [0, 0.03, 0], 'inOut'),
  key(2.4, I(), [0, -0.012, 0], 'inOut'),
]);
/** F in Gagael: Full Course — arms raised wide like open jaws, then brought down together as the giant maw closes */
const full = clip('lt_full', 1.6, { rise: 0.3, bite: 1.05 }, [
  key(0, I()),
  key(0.3, I({ spine: [-8, 0, 0], chest: [-10, 0, 0], head: [-16, 0, 0], 'upperarm.L': [-150, 0, 40], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-150, 0, -40], 'forearm.R': [-10, 0, 0] }), [0, 0.02, 0], 'outExpo'),
  key(0.95, I({ spine: [-10, 0, 0], chest: [-12, 0, 0], head: [-18, 0, 0], 'upperarm.L': [-156, 0, 50], 'forearm.L': [-12, 0, 0], 'upperarm.R': [-156, 0, -50], 'forearm.R': [-12, 0, 0] }), [0, 0.02, 0], 'linear'),
  key(1.07, I({ spine: [20, 0, 0], chest: [12, 0, 0], head: [4, 0, 0], 'upperarm.L': [-80, 0, -10], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-80, 0, 10], 'forearm.R': [-10, 0, 0] }), [0, -0.06, 0.06], 'outExpo'),
  key(1.6, I(), [0, -0.012, 0], 'inOut'),
]);

const SHARED = ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name));
export const LILTOTTO_CLIPS: ClipDef[] = [palm, knee, sweep, chomp, haymaker, bite, swallow, bow, feast, release, spork, spife, crunch, sklav, full, ...SHARED];
