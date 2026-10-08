// Bazz-B's animation set. A cocky street-brawler: chin up, chest out, fists loose at his sides. The string: a
// burning right hook, a left cross, the melting palm (a spear-hand thrust) and the Burning Stomp (the knee up and
// the boot driven into the floor); the crossbow, shot one-handed at arm's length. The finger moves: Burner Finger 1
// snapped out at the target; 2 lit by the face and slashed down across him; 3 pointed at the floor ahead from a
// crouch; 4 raised overhead as the sword grows, then three huge cuts with it (the arm and the blade one lever) and the
// overhand throw; Burning Full Fingers braced with the left hand on the right forearm. The collar grab (the left hand),
// the point-blank finger and the slam; the Vollständig burst; the rapid fire; the Glory Thief (a finger to the sky,
// then levelled). Events: 'step' lunge, 'hit' strike frame, 'combo' next input, plus per-move fx events.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

const IDLE: Record<string, E> = {
  hips: [0, -8, 0], spine: [-2, 3, 0], chest: [-5, 5, 0], neck: [-2, 0, 0], head: [-7, -5, 3],
  'thigh.L': [-6, 0, 7], 'shin.L': [8, 0, 0], 'foot.L': [0, 0, -3],
  'thigh.R': [5, 0, -8], 'shin.R': [10, 0, 0], 'foot.R': [-4, 0, 3],
  'upperarm.L': [6, 0, 11], 'forearm.L': [-18, 0, 0], 'hand.L': [6, 0, 0],
  'upperarm.R': [-4, 0, -13], 'forearm.R': [-26, 0, 0], 'hand.R': [4, 0, 0],
};
const I = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });

export const BAZZB_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.015,
  run: { chest: [6, 0, 0], head: [-4, 0, 0], 'upperarm.L': [-6, 0, 10], 'upperarm.R': [-6, 0, -10], 'forearm.L': [-60, 0, 0], 'forearm.R': [-60, 0, 0] },
  sprint: { spine: [14, 0, 0], chest: [10, 0, 0], head: [-14, 0, 0], 'upperarm.L': [40, 0, 14], 'forearm.L': [-24, 0, 0], 'upperarm.R': [40, 0, -14], 'forearm.R': [-24, 0, 0] },
  swingL: 1,
  swingR: 1,
};

/** fists up for the string, the left leading */
const GUARD: Record<string, E> = {
  chest: [4, -10, 0], spine: [4, -6, 0], head: [2, 10, 0],
  'thigh.L': [-14, 0, 6], 'shin.L': [14, 0, 0], 'thigh.R': [8, 0, -6], 'shin.R': [14, 0, 0],
  'upperarm.L': [-40, 0, 10], 'forearm.L': [-100, 0, 0], 'hand.L': [0, 0, 0],
  'upperarm.R': [-30, 0, -14], 'forearm.R': [-112, 0, 0], 'hand.R': [0, 0, 0],
};
const g = (over: Record<string, E> = {}): Record<string, E> => ({ ...GUARD, ...over });

/** the right arm levelled at the target, the chest turned a little into it (a pointing finger, a crossbow) */
const POINT: Record<string, E> = {
  chest: [0, 22, 0], spine: [0, 8, 0], head: [-2, -18, 0],
  'upperarm.R': [-80, 0, 4], 'forearm.R': [-4, 0, 0], 'hand.R': [0, 0, 0],
  'upperarm.L': [8, 0, 14], 'forearm.L': [-22, 0, 0],
  'thigh.L': [-12, 0, 8], 'shin.L': [12, 0, 0], 'thigh.R': [6, 0, -8], 'shin.R': [8, 0, 0],
};
const P = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...POINT, ...over });

// ------------------------------------------------------------------ the string

const hook: ClipDef = {
  name: 'bz_hook', dur: 0.46, fadeIn: 0.04, fadeOut: 0.2, events: { step: 0.08, hit: 0.18, combo: 0.26 },
  keys: [
    key(0, g()),
    key(0.09, g({ chest: [2, -28, 0], spine: [2, -12, 0], 'upperarm.R': [-40, 0, -66], 'forearm.R': [-96, 0, 0] }), [0, -0.03, -0.02], 'out'),
    key(0.18, g({ chest: [8, 40, 0], spine: [6, 16, 0], head: [4, -18, 0], 'upperarm.R': [-36, 0, -80], 'forearm.R': [-90, 0, 0], 'upperarm.L': [-20, 0, 14], 'forearm.L': [-120, 0, 0] }), [0, -0.05, 0.08], 'outExpo'),
    key(0.46, g(), [0, -0.02, 0], 'inOut'),
  ],
};

const cross: ClipDef = {
  name: 'bz_cross', dur: 0.42, fadeIn: 0.04, fadeOut: 0.18, events: { step: 0.05, hit: 0.13, combo: 0.2 },
  keys: [
    key(0, g()),
    key(0.06, g({ chest: [2, 6, 0], 'upperarm.L': [-48, 0, 14], 'forearm.L': [-112, 0, 0] }), [0, -0.01, 0], 'out'),
    key(0.13, g({ chest: [6, -30, 0], spine: [4, -12, 0], head: [2, 22, 0], 'upperarm.L': [-90, 0, -8], 'forearm.L': [-4, 0, 0], 'thigh.R': [14, 0, -6], 'shin.R': [20, 0, 0] }), [0, -0.03, 0.1], 'outExpo'),
    key(0.42, g(), [0, -0.02, 0], 'inOut'),
  ],
};

/** the melting palm: a spear-hand driven through, the open hand burning */
const palm: ClipDef = {
  name: 'bz_palm', dur: 0.62, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.14, hit: 0.24, combo: 0.36 },
  keys: [
    key(0, g()),
    key(0.13, g({ chest: [0, -30, 0], spine: [4, -14, 0], 'upperarm.R': [26, 0, -16], 'forearm.R': [-96, 0, 0], 'hand.R': [0, 0, 0], 'upperarm.L': [-60, 0, 20], 'forearm.L': [-70, 0, 0] }), [0, -0.08, -0.06], 'out'),
    key(0.24, g({ chest: [10, 32, 0], spine: [10, 14, 0], head: [4, -20, 0], 'upperarm.R': [-90, 0, 4], 'forearm.R': [-2, 0, 0], 'hand.R': [-10, 0, 0], 'upperarm.L': [20, 0, 20], 'forearm.L': [-60, 0, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [56, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [22, 0, 0] }), [0, -0.12, 0.24], 'outExpo'),
    key(0.42, g({ chest: [8, 26, 0], 'upperarm.R': [-86, 0, 4], 'forearm.R': [-6, 0, 0] }), [0, -0.1, 0.2], 'inOut'),
    key(0.62, g(), [0, -0.02, 0], 'inOut'),
  ],
};

/** the Burning Stomp: the knee up high, the boot into the floor, fire rolling out */
const stomp: ClipDef = {
  name: 'bz_stomp', dur: 0.86, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.2, hit: 0.38 },
  keys: [
    key(0, g()),
    key(0.22, g({ spine: [-10, 0, 0], chest: [-8, 0, 0], head: [14, 0, 0], 'thigh.R': [-110, 0, -4], 'shin.R': [100, 0, 0], 'foot.R': [10, 0, 0], 'thigh.L': [4, 0, 6], 'shin.L': [8, 0, 0], 'upperarm.L': [-10, 0, 60], 'forearm.L': [-30, 0, 0], 'upperarm.R': [-10, 0, -60], 'forearm.R': [-30, 0, 0] }), [0, 0.08, -0.02], 'out'),
    key(0.38, g({ spine: [20, 0, 0], chest: [12, 0, 0], head: [6, 0, 0], 'thigh.R': [-30, 0, -6], 'shin.R': [34, 0, 0], 'foot.R': [-4, 0, 0], 'thigh.L': [24, 0, 8], 'shin.L': [40, 0, 0], 'upperarm.L': [10, 0, 44], 'forearm.L': [-50, 0, 0], 'upperarm.R': [10, 0, -44], 'forearm.R': [-50, 0, 0] }), [0, -0.16, 0.06], 'inExpo'),
    key(0.56, g({ spine: [16, 0, 0], chest: [10, 0, 0], 'thigh.R': [-30, 0, -6], 'shin.R': [34, 0, 0], 'thigh.L': [24, 0, 8], 'shin.L': [40, 0, 0] }), [0, -0.14, 0.06], 'linear'),
    key(0.86, g(), [0, -0.02, 0], 'inOut'),
  ],
};

/** the crossbow at arm's length, one-handed; a kick on the shot */
const shoot = (name: string, lean: number): ClipDef => ({
  name, dur: 0.38, fadeIn: 0.05, fadeOut: 0.18, events: { fire: 0.1, combo: 0.18 },
  keys: [
    key(0, P({ chest: [0, 18 + lean, 0] })),
    key(0.1, P({ chest: [0, 22 + lean, 0], 'upperarm.R': [-84, 0, 4] }), [0, -0.02, 0], 'out'),
    key(0.15, P({ chest: [-4, 24 + lean, 0], 'upperarm.R': [-96, 0, 4], 'forearm.R': [-14, 0, 0] }), [0, -0.02, -0.03], 'outExpo'),
    key(0.38, P({ chest: [0, 20 + lean, 0] }), [0, -0.02, 0], 'inOut'),
  ],
});

// ------------------------------------------------------------------ the fingers

/** Burner Finger 1: the index snapped out at the target */
const bf1: ClipDef = {
  name: 'bz_bf1', dur: 0.5, fadeIn: 0.04, fadeOut: 0.2, events: { fire: 0.1 },
  keys: [
    key(0, I()),
    key(0.08, P({ 'upperarm.R': [-84, 0, 4] }), [0, -0.02, 0], 'outExpo'),
    key(0.14, P({ chest: [-4, 24, 0], 'upperarm.R': [-92, 0, 4], 'forearm.R': [-8, 0, 0] }), [0, -0.02, -0.03], 'out'),
    key(0.3, P(), [0, -0.02, 0], 'inOut'),
    key(0.5, I(), [0, -0.015, 0], 'inOut'),
  ],
};

/** Burner Finger 2: two fingers lit before his face, then slashed down and across */
const bf2: ClipDef = {
  name: 'bz_bf2', dur: 0.8, fadeIn: 0.05, fadeOut: 0.22, events: { ignite: 0.1, step: 0.28, fire: 0.36 },
  keys: [
    key(0, I()),
    key(0.16, I({ chest: [-4, -20, 0], spine: [-2, -8, 0], head: [-4, 10, 0], 'upperarm.R': [-118, 0, -52], 'forearm.R': [-62, 0, 0], 'hand.R': [0, 0, 0] }), [0, 0, -0.02], 'out'),
    key(0.26, I({ chest: [-6, -26, 0], spine: [-2, -10, 0], head: [-6, 12, 0], 'upperarm.R': [-160, 0, -40], 'forearm.R': [-24, 0, 0] }), [0, 0.01, -0.03], 'inOut'),
    key(0.38, I({ chest: [10, 34, 0], spine: [8, 14, 0], head: [2, -20, 0], 'upperarm.R': [-40, 0, 36], 'forearm.R': [-10, 0, 0], 'thigh.L': [-36, 0, 6], 'shin.L': [40, 0, 0], 'thigh.R': [20, 0, -6], 'shin.R': [16, 0, 0] }), [0, -0.1, 0.14], 'outExpo'),
    key(0.56, I({ chest: [8, 30, 0], spine: [6, 12, 0], 'upperarm.R': [-36, 0, 34], 'forearm.R': [-12, 0, 0], 'thigh.L': [-36, 0, 6], 'shin.L': [40, 0, 0] }), [0, -0.09, 0.12], 'linear'),
    key(0.8, I(), [0, -0.015, 0], 'inOut'),
  ],
};

/** Burner Finger 3: three fingers at the floor ahead, from a crouch */
const bf3: ClipDef = {
  name: 'bz_bf3', dur: 1.0, fadeIn: 0.06, fadeOut: 0.24, events: { point: 0.32 },
  keys: [
    key(0, I()),
    key(0.2, I({ spine: [10, 10, 0], chest: [10, 16, 0], head: [6, -12, 0], 'upperarm.R': [-60, 0, -4], 'forearm.R': [-10, 0, 0], 'hand.R': [-16, 0, 0], 'thigh.L': [-40, 0, 8], 'shin.L': [56, 0, 0], 'thigh.R': [-6, 0, -10], 'shin.R': [44, 0, 0] }), [0, -0.12, 0.04], 'out'),
    key(0.32, I({ spine: [16, 10, 0], chest: [14, 18, 0], head: [10, -14, 0], 'upperarm.R': [-52, 0, -2], 'forearm.R': [-4, 0, 0], 'hand.R': [-24, 0, 0], 'thigh.L': [-46, 0, 8], 'shin.L': [64, 0, 0], 'thigh.R': [-8, 0, -10], 'shin.R': [52, 0, 0] }), [0, -0.16, 0.06], 'outExpo'),
    key(0.7, I({ spine: [14, 10, 0], chest: [12, 16, 0], head: [8, -12, 0], 'upperarm.R': [-52, 0, -2], 'forearm.R': [-4, 0, 0], 'hand.R': [-24, 0, 0], 'thigh.L': [-46, 0, 8], 'shin.L': [64, 0, 0], 'thigh.R': [-8, 0, -10], 'shin.R': [52, 0, 0] }), [0, -0.16, 0.06], 'linear'),
    key(1.0, I(), [0, -0.015, 0], 'inOut'),
  ],
};

/** Burner Finger 4: the four fingers raised overhead as the sword grows, then brought down to the ready */
const SWORD_READY: Record<string, E> = { chest: [2, 14, 0], spine: [2, 6, 0], head: [-2, -10, 0], 'upperarm.R': [-50, 0, -18], 'forearm.R': [-34, 0, 0], 'hand.R': [-10, 0, 0], 'upperarm.L': [-20, 0, 16], 'forearm.L': [-50, 0, 0] };
const S = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...SWORD_READY, ...over });
const bf4: ClipDef = {
  name: 'bz_bf4', dur: 1.0, fadeIn: 0.06, fadeOut: 0.24, events: { form: 0.3 },
  keys: [
    key(0, I()),
    key(0.24, I({ chest: [-8, 6, 0], spine: [-4, 2, 0], head: [-14, -4, 0], 'upperarm.R': [-172, 0, -8], 'forearm.R': [-4, 0, 0], 'hand.R': [0, 0, 0], 'upperarm.L': [10, 0, 24], 'forearm.L': [-30, 0, 0] }), [0, 0.01, 0], 'out'),
    key(0.6, I({ chest: [-8, 6, 0], spine: [-4, 2, 0], head: [-14, -4, 0], 'upperarm.R': [-174, 0, -8], 'forearm.R': [-4, 0, 0], 'upperarm.L': [10, 0, 24], 'forearm.L': [-30, 0, 0] }), [0, 0.01, 0], 'linear'),
    key(1.0, S(), [0, -0.02, 0], 'inOut'),
  ],
};

/** the sword string: the arm and the blade one lever */
const sw1: ClipDef = {
  name: 'bz_sw1', dur: 0.66, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.08, hit: 0.22, combo: 0.32 },
  keys: [
    key(0, S()),
    key(0.12, S({ chest: [-6, -34, 0], spine: [-2, -14, 0], head: [-4, 16, 0], 'upperarm.R': [-150, 0, -40], 'forearm.R': [-8, 0, 0], 'hand.R': [0, 0, 0] }), [0, 0.01, -0.03], 'out'),
    key(0.24, S({ chest: [12, 36, 0], spine: [8, 16, 0], head: [4, -22, 0], 'upperarm.R': [-40, 0, 30], 'forearm.R': [-6, 0, 0], 'thigh.L': [-36, 0, 6], 'shin.L': [40, 0, 0], 'thigh.R': [22, 0, -6], 'shin.R': [18, 0, 0] }), [0, -0.1, 0.14], 'outExpo'),
    key(0.4, S({ chest: [10, 32, 0], spine: [6, 14, 0], 'upperarm.R': [-34, 0, 34], 'forearm.R': [-8, 0, 0], 'thigh.L': [-36, 0, 6], 'shin.L': [40, 0, 0] }), [0, -0.09, 0.12], 'linear'),
    key(0.66, S(), [0, -0.02, 0], 'inOut'),
  ],
};
const sw2: ClipDef = {
  name: 'bz_sw2', dur: 0.62, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.06, hit: 0.18, combo: 0.28 },
  keys: [
    key(0, S()),
    key(0.1, S({ chest: [2, 40, 0], spine: [2, 16, 0], head: [0, -24, 0], 'upperarm.R': [-90, 0, 50], 'forearm.R': [-10, 0, 0] }), [0, -0.03, 0], 'out'),
    key(0.2, S({ chest: [4, -40, 0], spine: [4, -18, 0], head: [2, 26, 0], 'upperarm.R': [-92, 0, -70], 'forearm.R': [-4, 0, 0], 'thigh.L': [-20, 0, 8], 'shin.L': [22, 0, 0], 'thigh.R': [12, 0, -10] }), [0, -0.06, 0.08], 'outExpo'),
    key(0.36, S({ chest: [4, -36, 0], spine: [4, -16, 0], 'upperarm.R': [-90, 0, -66], 'forearm.R': [-6, 0, 0] }), [0, -0.05, 0.06], 'linear'),
    key(0.62, S(), [0, -0.02, 0], 'inOut'),
  ],
};
const sw3: ClipDef = {
  name: 'bz_sw3', dur: 0.9, fadeIn: 0.05, fadeOut: 0.24, events: { step: 0.16, hit: 0.32 },
  keys: [
    key(0, S()),
    key(0.2, S({ spine: [-12, 0, 0], chest: [-10, 4, 0], head: [-8, -2, 0], 'upperarm.R': [-178, 0, -6], 'forearm.R': [-6, 0, 0], 'upperarm.L': [-150, 0, 10], 'forearm.L': [-30, 0, 0] }), [0, 0.03, -0.04], 'out'),
    key(0.34, S({ spine: [24, 0, 0], chest: [16, 6, 0], head: [4, -4, 0], 'upperarm.R': [-34, 0, -4], 'forearm.R': [-4, 0, 0], 'upperarm.L': [-20, 0, 30], 'forearm.L': [-50, 0, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [60, 0, 0], 'thigh.R': [24, 0, -6], 'shin.R': [30, 0, 0] }), [0, -0.18, 0.18], 'inExpo'),
    key(0.6, S({ spine: [22, 0, 0], chest: [14, 6, 0], 'upperarm.R': [-30, 0, -4], 'forearm.R': [-4, 0, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [60, 0, 0], 'thigh.R': [24, 0, -6], 'shin.R': [30, 0, 0] }), [0, -0.17, 0.17], 'linear'),
    key(0.9, S(), [0, -0.02, 0], 'inOut'),
  ],
};
/** R again: the sword hurled overhand, spinning */
const throwC: ClipDef = {
  name: 'bz_throw', dur: 0.72, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.12, throw: 0.3 },
  keys: [
    key(0, S()),
    key(0.18, S({ chest: [-8, -30, 0], spine: [-4, -12, 0], head: [-4, 18, 0], 'upperarm.R': [-160, 0, -30], 'forearm.R': [-60, 0, 0], 'upperarm.L': [-70, 0, 20], 'forearm.L': [-20, 0, 0] }), [0, 0, -0.04], 'out'),
    key(0.3, S({ chest: [12, 30, 0], spine: [8, 14, 0], head: [2, -18, 0], 'upperarm.R': [-70, 0, 10], 'forearm.R': [-6, 0, 0], 'upperarm.L': [10, 0, 30], 'forearm.L': [-40, 0, 0], 'thigh.L': [-36, 0, 6], 'shin.L': [40, 0, 0], 'thigh.R': [20, 0, -6] }), [0, -0.08, 0.14], 'outExpo'),
    key(0.72, I(), [0, -0.015, 0], 'inOut'),
  ],
};

/** Burning Full Fingers: the right arm levelled, the left hand clamped on its forearm, legs wide */
const BRACE: Record<string, E> = {
  chest: [4, 26, 0], spine: [4, 10, 0], head: [-2, -20, 0],
  'upperarm.R': [-90, 0, 2], 'forearm.R': [-2, 0, 0], 'hand.R': [-8, 0, 0],
  'upperarm.L': [-70, -10, -34], 'forearm.L': [-62, 0, 0], 'hand.L': [0, 0, 0],
  'thigh.L': [-34, 0, 12], 'shin.L': [40, 0, 0], 'thigh.R': [16, 0, -12], 'shin.R': [20, 0, 0],
};
const bff: ClipDef = {
  name: 'bz_bff', dur: 2.1, fadeIn: 0.08, fadeOut: 0.26, events: { fire: 0.3 },
  keys: [
    key(0, I()),
    key(0.24, I(BRACE), [0, -0.1, 0.02], 'out'),
    key(0.32, I({ ...BRACE, chest: [-2, 28, 0] }), [0, -0.1, -0.04], 'outExpo'),
    key(0.9, I({ ...BRACE, chest: [0, 26, 0] }), [0, -0.1, -0.02], 'inOut'),
    key(1.5, I({ ...BRACE, chest: [-2, 28, 0] }), [0, -0.1, -0.03], 'inOut'),
    key(1.86, I(BRACE), [0, -0.1, -0.02], 'inOut'),
    key(2.1, I(), [0, -0.015, 0], 'inOut'),
  ],
};

// ------------------------------------------------------------------ the collar

/** the left hand fastened on a collar, the head jutting in */
const GRAB: Record<string, E> = {
  chest: [6, -16, 0], spine: [6, -8, 0], neck: [6, 0, 0], head: [2, 12, 0],
  'upperarm.L': [-78, 0, -12], 'forearm.L': [-26, 0, 0], 'hand.L': [0, 0, 0],
  'upperarm.R': [-10, 0, -20], 'forearm.R': [-40, 0, 0],
  'thigh.L': [-24, 0, 8], 'shin.L': [26, 0, 0], 'thigh.R': [10, 0, -8], 'shin.R': [12, 0, 0],
};
const grab: ClipDef = {
  name: 'bz_grab', dur: 0.9, fadeIn: 0.03, fadeOut: 0.2, events: { grab: 0.06 },
  keys: [key(0, I(GRAB), [0, -0.04, 0.04]), key(0.06, I(GRAB), [0, -0.05, 0.05], 'outExpo'), key(0.9, I(GRAB), [0, -0.05, 0.05], 'linear')],
};
const pointBlank: ClipDef = {
  name: 'bz_pointblank', dur: 0.62, fadeIn: 0.04, fadeOut: 0.22, events: { fire: 0.14 },
  keys: [
    key(0, I(GRAB), [0, -0.05, 0.05]),
    key(0.1, I({ ...GRAB, chest: [4, 8, 0], 'upperarm.R': [-104, 0, 16], 'forearm.R': [-30, 0, 0] }), [0, -0.05, 0.05], 'outExpo'),
    key(0.18, I({ ...GRAB, chest: [0, 12, 0], 'upperarm.R': [-112, 0, 16], 'forearm.R': [-36, 0, 0] }), [0, -0.05, 0.03], 'out'),
    key(0.62, I(), [0, -0.015, 0], 'inOut'),
  ],
};
const slam: ClipDef = {
  name: 'bz_slam', dur: 0.8, fadeIn: 0.04, fadeOut: 0.22, events: { hit: 0.3 },
  keys: [
    key(0, I(GRAB), [0, -0.05, 0.05]),
    key(0.14, I({ ...GRAB, 'upperarm.L': [-130, 0, -10], 'forearm.L': [-30, 0, 0], spine: [-6, -8, 0], chest: [-6, -12, 0] }), [0, 0, 0.02], 'out'),
    key(0.3, I({ spine: [30, -8, 0], chest: [16, -10, 0], head: [10, 8, 0], 'upperarm.L': [-26, 0, -8], 'forearm.L': [-12, 0, 0], 'upperarm.R': [10, 0, -30], 'thigh.L': [-60, 0, 8], 'shin.L': [80, 0, 0], 'thigh.R': [-10, 0, -8], 'shin.R': [70, 0, 0] }), [0, -0.3, 0.12], 'inExpo'),
    key(0.52, I({ spine: [26, -8, 0], chest: [14, -10, 0], 'upperarm.L': [-24, 0, -8], 'forearm.L': [-12, 0, 0], 'thigh.L': [-60, 0, 8], 'shin.L': [80, 0, 0], 'thigh.R': [-10, 0, -8], 'shin.R': [70, 0, 0] }), [0, -0.28, 0.12], 'linear'),
    key(0.8, I(), [0, -0.015, 0], 'inOut'),
  ],
};

// ------------------------------------------------------------------ Vollständig

const voll: ClipDef = {
  name: 'bz_voll', dur: 1.5, fadeIn: 0.08, fadeOut: 0.3, events: { burst: 0.7 },
  keys: [
    key(0, I()),
    key(0.5, I({ spine: [14, 0, 0], chest: [14, 0, 0], head: [16, 0, 0], 'upperarm.L': [-30, 0, -14], 'forearm.L': [-90, 0, 0], 'upperarm.R': [-30, 0, 14], 'forearm.R': [-90, 0, 0], 'thigh.L': [-30, 0, 8], 'shin.L': [44, 0, 0], 'thigh.R': [-30, 0, -8], 'shin.R': [44, 0, 0] }), [0, -0.12, 0], 'inOut'),
    key(0.72, I({ spine: [-12, 0, 0], chest: [-14, 0, 0], head: [-20, 0, 0], 'upperarm.L': [-10, 0, 70], 'forearm.L': [-16, 0, 0], 'upperarm.R': [-10, 0, -70], 'forearm.R': [-16, 0, 0], 'thigh.L': [-4, 0, 10], 'thigh.R': [4, 0, -10] }), [0, 0.02, 0], 'outExpo'),
    key(1.2, I({ spine: [-10, 0, 0], chest: [-12, 0, 0], head: [-16, 0, 0], 'upperarm.L': [-8, 0, 64], 'forearm.L': [-18, 0, 0], 'upperarm.R': [-8, 0, -64], 'forearm.R': [-18, 0, 0] }), [0, 0.01, 0], 'linear'),
    key(1.5, I(), [0, -0.015, 0], 'inOut'),
  ],
};
/** the rapid Burner Finger 1: the finger held on the target, a kick on every beam */
const rapid: ClipDef = {
  name: 'bz_rapid', dur: 0.72, fadeIn: 0.04, fadeOut: 0.2, events: { f0: 0.08, f1: 0.15, f2: 0.22, f3: 0.29, f4: 0.36, f5: 0.43 },
  keys: [
    key(0, I()),
    key(0.07, P({ 'upperarm.R': [-84, 0, 4] }), [0, -0.02, 0], 'outExpo'),
    ...[0.11, 0.18, 0.25, 0.32, 0.39, 0.46].flatMap((t, i) => [
      key(t, P({ chest: [-3, 23 + (i % 2) * 2, 0], 'upperarm.R': [-89, 0, 4], 'forearm.R': [-6, 0, 0] }), [0, -0.02, -0.02], 'out'),
      key(t + 0.035, P({ 'upperarm.R': [-84, 0, 4] }), [0, -0.02, 0], 'inOut'),
    ]),
    key(0.72, I(), [0, -0.015, 0], 'inOut'),
  ],
};
/** Glory Thief: a finger to the sky, the marks, then levelled */
const glory: ClipDef = {
  name: 'bz_glory', dur: 1.6, fadeIn: 0.08, fadeOut: 0.26, events: { mark: 0.32, fire: 0.72 },
  keys: [
    key(0, I()),
    key(0.3, I({ chest: [-10, 10, 0], head: [-20, -6, 0], 'upperarm.R': [-176, 0, -10], 'forearm.R': [-2, 0, 0] }), [0, 0.01, 0], 'out'),
    key(0.6, I({ chest: [-10, 10, 0], head: [-20, -6, 0], 'upperarm.R': [-176, 0, -10], 'forearm.R': [-2, 0, 0] }), [0, 0.01, 0], 'linear'),
    key(0.72, P({ 'upperarm.R': [-84, 0, 4] }), [0, -0.02, 0], 'outExpo'),
    key(1.3, P({ chest: [-2, 24, 0], 'upperarm.R': [-88, 0, 4] }), [0, -0.02, -0.02], 'linear'),
    key(1.6, I(), [0, -0.015, 0], 'inOut'),
  ],
};

export const BAZZB_CLIPS: ClipDef[] = [
  hook, cross, palm, stomp, shoot('bz_shoot1', 0), shoot('bz_shoot2', -4), shoot('bz_shoot3', 4),
  bf1, bf2, bf3, bf4, sw1, sw2, sw3, throwC, bff, grab, pointBlank, slam, voll, rapid, glory,
  ...ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name)),
];
export const BAZZB_CHAIN = ['bz_hook', 'bz_cross', 'bz_palm', 'bz_stomp'];
export const BAZZB_BOW_CHAIN = ['bz_shoot1', 'bz_shoot2', 'bz_shoot3'];
export const BAZZB_SWORD_CHAIN = ['bz_sw1', 'bz_sw2', 'bz_sw3'];
