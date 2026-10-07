// Yoruichi's animation set: Hakuda. A loose, low, cat-like stance, light on the balls of the feet, the left
// hand forward and open. The string is kicks: a snap kick, a spinning heel kick, a flying knee, then the
// axe heel dropped from a leg raised straight up. The double palm strike stands in for any kick. The
// concentrated blow is wound back low and driven in from the hip. Raiōken is two arms in a blur of
// straight punches with a final blow; the Shunshin strikes are short, sharp shapes she hits from every
// side; Utsusemi is a crouch and a spring; Anken flicks the boot knives off the toes; Shunkō tears the top
// away and throws the arms down as the lightning bursts; the Shunkō burst drives both palms forward;
// Raijin Senkei raises both arms to the drums and fires the column of lightning from the right hand.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

const IDLE: Record<string, E> = {
  hips: [0, -14, 0], spine: [6, 4, 0], chest: [4, 8, 0], neck: [-4, 0, 0], head: [-4, 6, 0],
  'thigh.L': [-22, 0, 8], 'shin.L': [30, 0, 0], 'foot.L': [-8, 0, 0],
  'thigh.R': [8, 0, -10], 'shin.R': [30, 0, 0], 'foot.R': [-14, 0, 0],
  'upperarm.L': [-34, 0, 14], 'forearm.L': [-62, 0, 0], 'hand.L': [-10, 0, 0],
  'upperarm.R': [-18, 0, -16], 'forearm.R': [-96, 0, 0], 'hand.R': [-6, 0, 0],
};

export const YORUICHI_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.06,
  run: { chest: [10, 0, 0], head: [-6, 0, 0], 'upperarm.L': [-10, 0, 10], 'upperarm.R': [-10, 0, -10], 'forearm.L': [-60, 0, 0], 'forearm.R': [-60, 0, 0] },
  // the Onmitsukidō run: bent low, the arms trailing straight back
  sprint: { spine: [22, 0, 0], chest: [10, 0, 0], neck: [-10, 0, 0], head: [-12, 0, 0], 'upperarm.L': [58, 0, 12], 'forearm.L': [-8, 0, 0], 'hand.L': [20, 0, 0], 'upperarm.R': [58, 0, -12], 'forearm.R': [-8, 0, 0], 'hand.R': [20, 0, 0] },
  swingL: 1,
  swingR: 1,
  freqScale: 1.12,
};

const R = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });

// ------------------------------------------------------------------ the string

/** 1: a snap kick off the back (right) leg, chambered and whipped straight out. */
const snap: ClipDef = {
  name: 'yr_snap', dur: 0.42, fadeIn: 0.04, fadeOut: 0.16, events: { step: 0.04, hit: 0.12, combo: 0.17 },
  keys: [
    key(0, R()),
    key(0.06, R({ hips: [0, -6, 0], spine: [-4, 0, 0], 'thigh.R': [-78, 0, 0], 'shin.R': [104, 0, 0], 'foot.R': [-10, 0, 0], 'thigh.L': [-6, 0, 6], 'shin.L': [20, 0, 0] }), [0, -0.03, 0.02], 'out'),
    key(0.12, R({ hips: [0, -4, 0], spine: [-12, 0, 0], chest: [-4, 6, 0], head: [8, 0, 0], 'thigh.R': [-104, 0, 0], 'shin.R': [4, 0, 0], 'foot.R': [-34, 0, 0], 'thigh.L': [-4, 0, 6], 'shin.L': [16, 0, 0], 'upperarm.L': [-26, 0, 44], 'forearm.L': [-40, 0, 0], 'upperarm.R': [-14, 0, -48], 'forearm.R': [-50, 0, 0] }), [0, -0.02, 0.1], 'outExpo'),
    key(0.2, R({ 'thigh.R': [-74, 0, 0], 'shin.R': [96, 0, 0], spine: [-4, 0, 0] }), [0, -0.03, 0.06], 'out'),
    key(0.42, R(), [0, -0.06, 0], 'inOut'),
  ],
};

/** 2: a spinning back heel kick — a full turn, the left leg whipping round at head height. */
const spin: ClipDef = {
  name: 'yr_spin', dur: 0.6, fadeIn: 0.04, fadeOut: 0.16, events: { step: 0.1, hit: 0.27, combo: 0.36 },
  keys: [
    key(0, R()),
    key(0.12, R({ hips: [0, -110, 0], spine: [8, -14, 0], head: [-6, 60, 0], 'thigh.L': [0, 0, 6], 'shin.L': [60, 0, 0], 'thigh.R': [-10, 0, -4], 'shin.R': [26, 0, 0] }), [0, -0.06, 0], 'in'),
    key(0.27, R({ hips: [0, -205, 0], spine: [-16, 0, -18], chest: [0, 0, -10], head: [-10, 74, 14], 'thigh.L': [-8, 0, 92], 'shin.L': [6, 0, 0], 'foot.L': [-30, 0, 0], 'thigh.R': [-6, 0, -8], 'shin.R': [18, 0, 0], 'upperarm.L': [-20, 0, 70], 'forearm.L': [-30, 0, 0], 'upperarm.R': [-30, 0, -40], 'forearm.R': [-80, 0, 0] }), [0, 0.03, 0.04], 'outExpo'),
    key(0.42, R({ hips: [0, -300, 0], spine: [6, -6, 0], 'thigh.L': [-20, 0, 30], 'shin.L': [50, 0, 0] }), [0, -0.04, 0.02], 'inOut'),
    key(0.6, R({ hips: [0, -374, 0] }), [0, -0.06, 0], 'out'),
  ],
};

/** 3: the flying knee, both hands pulling the target's head down onto it. */
const knee: ClipDef = {
  name: 'yr_knee', dur: 0.56, fadeIn: 0.04, fadeOut: 0.18, events: { step: 0.08, hit: 0.2, combo: 0.3 },
  keys: [
    key(0, R()),
    key(0.1, R({ 'thigh.R': [14, 0, -4], 'shin.R': [50, 0, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [44, 0, 0], 'upperarm.L': [-90, 0, 10], 'forearm.L': [-30, 0, 0], 'upperarm.R': [-90, 0, -10], 'forearm.R': [-30, 0, 0] }), [0, -0.1, 0], 'out'),
    key(0.2, R({ hips: [0, 0, 0], spine: [-6, 0, 0], chest: [6, 0, 0], head: [16, 0, 0], 'thigh.R': [-126, 0, 0], 'shin.R': [132, 0, 0], 'foot.R': [24, 0, 0], 'thigh.L': [12, 0, 4], 'shin.L': [40, 0, 0], 'upperarm.L': [-96, 0, -6], 'forearm.L': [-70, 0, 0], 'hand.L': [30, 0, 0], 'upperarm.R': [-96, 0, 6], 'forearm.R': [-70, 0, 0], 'hand.R': [30, 0, 0] }), [0, 0.24, 0.14], 'outExpo'),
    key(0.36, R({ 'thigh.R': [-60, 0, 0], 'shin.R': [90, 0, 0] }), [0, 0.08, 0.08], 'inOut'),
    key(0.56, R(), [0, -0.06, 0], 'inOut'),
  ],
};

/** 4 (finisher): the axe heel — the right leg raised straight up past her head, then dropped like a blade. */
const axe: ClipDef = {
  name: 'yr_axe', dur: 0.8, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.2, hit: 0.36 },
  keys: [
    key(0, R()),
    key(0.2, R({ hips: [0, 0, 0], spine: [-16, 0, 0], chest: [-8, 0, 0], head: [16, 0, 0], 'thigh.R': [-172, 0, -2], 'shin.R': [0, 0, 0], 'foot.R': [-30, 0, 0], 'thigh.L': [6, 0, 6], 'shin.L': [6, 0, 0], 'upperarm.L': [-14, 0, 70], 'forearm.L': [-16, 0, 0], 'upperarm.R': [-14, 0, -70], 'forearm.R': [-16, 0, 0] }), [0, 0.08, -0.04], 'out'),
    key(0.36, R({ hips: [0, 0, 0], spine: [24, 0, 0], chest: [12, 0, 0], head: [6, 0, 0], 'thigh.R': [-36, 0, 0], 'shin.R': [6, 0, 0], 'foot.R': [10, 0, 0], 'thigh.L': [30, 0, 6], 'shin.L': [46, 0, 0], 'upperarm.L': [14, 0, 40], 'upperarm.R': [14, 0, -40] }), [0, -0.16, 0.2], 'inExpo'),
    key(0.56, R({ spine: [18, 0, 0], 'thigh.R': [-30, 0, 0], 'shin.R': [20, 0, 0], 'thigh.L': [24, 0, 6], 'shin.L': [40, 0, 0] }), [0, -0.14, 0.18], 'inOut'),
    key(0.8, R(), [0, -0.06, 0], 'inOut'),
  ],
};

/** The double palm strike: both heels of the hands driven into the chest. */
const palm: ClipDef = {
  name: 'yr_palm', dur: 0.5, fadeIn: 0.04, fadeOut: 0.18, events: { step: 0.06, hit: 0.16, combo: 0.24 },
  keys: [
    key(0, R()),
    key(0.08, R({ hips: [0, 6, 0], chest: [0, 16, 0], 'upperarm.L': [-10, 0, 30], 'forearm.L': [-120, 0, 0], 'hand.L': [-40, 0, 0], 'upperarm.R': [-10, 0, -30], 'forearm.R': [-120, 0, 0], 'hand.R': [-40, 0, 0] }), [0, -0.08, -0.03], 'out'),
    key(0.16, R({ hips: [0, 0, 0], spine: [14, 0, 0], chest: [6, 0, 0], head: [-6, 0, 0], 'upperarm.L': [-86, 0, -4], 'forearm.L': [-6, 0, 0], 'hand.L': [-70, 0, 0], 'upperarm.R': [-86, 0, 4], 'forearm.R': [-6, 0, 0], 'hand.R': [-70, 0, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [56, 0, 0], 'thigh.R': [26, 0, -6], 'shin.R': [20, 0, 0] }), [0, -0.12, 0.2], 'outExpo'),
    key(0.5, R(), [0, -0.06, 0], 'inOut'),
  ],
};

// ------------------------------------------------------------------ heavies

/** RMB: the concentrated blow — wound back low at the hip, then driven straight through. */
const blow: ClipDef = {
  name: 'yr_blow', dur: 0.95, fadeIn: 0.06, fadeOut: 0.22, events: { charge: 0.1, step: 0.42, hit: 0.5 },
  keys: [
    key(0, R()),
    key(0.36, R({ hips: [0, -30, 0], spine: [10, -16, 0], chest: [4, -20, 0], head: [0, 30, 0], 'thigh.L': [-40, 0, 10], 'shin.L': [60, 0, 0], 'thigh.R': [20, 0, -10], 'shin.R': [50, 0, 0], 'upperarm.R': [40, 0, -24], 'forearm.R': [-110, 0, 0], 'upperarm.L': [-80, 0, 20], 'forearm.L': [-20, 0, 0], 'hand.L': [-40, 0, 0] }), [0, -0.16, -0.06], 'inOut'),
    key(0.5, R({ hips: [0, 20, 0], spine: [12, 16, 0], chest: [6, 22, 0], head: [-4, -24, 0], 'thigh.L': [-62, 0, 8], 'shin.L': [58, 0, 0], 'thigh.R': [34, 0, -8], 'shin.R': [16, 0, 0], 'upperarm.R': [-90, 0, 0], 'forearm.R': [-4, 0, 0], 'upperarm.L': [20, 0, 30], 'forearm.L': [-90, 0, 0] }), [0, -0.14, 0.32], 'outExpo'),
    key(0.68, R({ hips: [0, 18, 0], chest: [6, 20, 0], 'upperarm.R': [-88, 0, 0], 'forearm.R': [-8, 0, 0], 'thigh.L': [-58, 0, 8], 'shin.L': [56, 0, 0] }), [0, -0.12, 0.28], 'inOut'),
    key(0.95, R(), [0, -0.06, 0], 'inOut'),
  ],
};

/** R: Raiōken — straight punches in a blur from both arms, then the final blow. hit0..hit9, then 'finish'. */
function barrage(): ClipDef {
  const keys: KeyDef[] = [key(0, R()), key(0.1, R({ hips: [0, -8, 0], chest: [6, 0, 0], 'thigh.L': [-40, 0, 10], 'shin.L': [46, 0, 0], 'thigh.R': [20, 0, -10], 'shin.R': [30, 0, 0] }), [0, -0.12, 0.04], 'out')];
  const events: Record<string, number> = { step: 0.08 };
  const stance = { hips: [0, 0, 0] as E, spine: [10, 0, 0] as E, 'thigh.L': [-40, 0, 10] as E, 'shin.L': [46, 0, 0] as E, 'thigh.R': [20, 0, -10] as E, 'shin.R': [30, 0, 0] as E };
  const outL = { 'upperarm.L': [-90, 0, -4] as E, 'forearm.L': [-4, 0, 0] as E, 'upperarm.R': [-30, 0, -14] as E, 'forearm.R': [-120, 0, 0] as E };
  const outR = { 'upperarm.R': [-90, 0, 4] as E, 'forearm.R': [-4, 0, 0] as E, 'upperarm.L': [-30, 0, 14] as E, 'forearm.L': [-120, 0, 0] as E };
  let t = 0.16;
  for (let i = 0; i < 10; i++) {
    const left = i % 2 === 0;
    keys.push(key(t, R({ ...stance, chest: [8, left ? -14 : 14, 0], head: [-6, left ? 10 : -10, 0], ...(left ? outL : outR) }), [0, -0.12, 0.06], 'outExpo'));
    events[`hit${i}`] = t;
    t += 0.075;
  }
  // the final blow: the right fist driven through from the hip
  keys.push(key(t + 0.04, R({ ...stance, chest: [4, -24, 0], spine: [6, -10, 0], 'upperarm.R': [30, 0, -20], 'forearm.R': [-110, 0, 0], 'upperarm.L': [-70, 0, 10], 'forearm.L': [-40, 0, 0] }), [0, -0.14, 0], 'out'));
  keys.push(key(t + 0.16, R({ ...stance, chest: [8, 26, 0], spine: [12, 14, 0], head: [-6, -20, 0], 'thigh.L': [-60, 0, 8], 'shin.L': [56, 0, 0], 'thigh.R': [36, 0, -8], 'shin.R': [14, 0, 0], ...outR }), [0, -0.14, 0.24], 'outExpo'));
  events.finish = t + 0.16;
  keys.push(key(t + 0.5, R(), [0, -0.06, 0], 'inOut'));
  return { name: 'yr_barrage', dur: t + 0.5, fadeIn: 0.05, fadeOut: 0.2, events, keys };
}

/** The Shunshin strikes: short, sharp shapes she lands from every side, one per flash step. */
const strikeA: ClipDef = {
  name: 'yr_strikeA', dur: 0.24, fadeIn: 0.02, fadeOut: 0.1, events: { hit: 0.07 },
  keys: [
    key(0, R({ 'thigh.R': [-60, 0, 0], 'shin.R': [90, 0, 0] }), [0, -0.04, 0]),
    key(0.07, R({ spine: [-10, 0, -10], 'thigh.R': [-6, 0, -88], 'shin.R': [4, 0, 0], 'foot.R': [-30, 0, 0], 'upperarm.L': [-20, 0, 60], 'upperarm.R': [-20, 0, -30] }), [0, 0.02, 0.04], 'outExpo'),
    key(0.24, R(), [0, -0.05, 0], 'inOut'),
  ],
};
const strikeB: ClipDef = {
  name: 'yr_strikeB', dur: 0.24, fadeIn: 0.02, fadeOut: 0.1, events: { hit: 0.07 },
  keys: [
    key(0, R({ chest: [0, -30, 0], 'upperarm.R': [20, 0, -20], 'forearm.R': [-110, 0, 0] }), [0, -0.06, 0]),
    key(0.07, R({ chest: [10, 26, 0], spine: [8, 12, 0], 'upperarm.R': [-90, 0, 0], 'forearm.R': [-4, 0, 0], 'hand.R': [-60, 0, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [50, 0, 0] }), [0, -0.1, 0.1], 'outExpo'),
    key(0.24, R(), [0, -0.05, 0], 'inOut'),
  ],
};
const strikeC: ClipDef = {
  name: 'yr_strikeC', dur: 0.26, fadeIn: 0.02, fadeOut: 0.1, events: { hit: 0.08 },
  keys: [
    key(0, R({ 'thigh.L': [10, 0, 0], 'shin.L': [70, 0, 0] }), [0, 0.04, 0]),
    key(0.08, R({ spine: [-14, 0, 0], head: [10, 0, 0], 'thigh.L': [-120, 0, 0], 'shin.L': [8, 0, 0], 'foot.L': [-30, 0, 0], 'thigh.R': [14, 0, -6], 'shin.R': [20, 0, 0], 'upperarm.L': [-30, 0, 50], 'upperarm.R': [-30, 0, -50] }), [0, 0.16, 0.06], 'outExpo'),
    key(0.26, R(), [0, -0.05, 0], 'inOut'),
  ],
};

/** Q: Utsusemi — a crouch, and she is gone (the shell stays behind). */
const vanish: ClipDef = {
  name: 'yr_vanish', dur: 0.3, fadeIn: 0.03, fadeOut: 0.1, events: { vanish: 0.08 },
  keys: [
    key(0, R()),
    key(0.08, R({ spine: [20, 0, 0], 'thigh.L': [-60, 0, 10], 'shin.L': [100, 0, 0], 'thigh.R': [-20, 0, -10], 'shin.R': [100, 0, 0], 'upperarm.L': [30, 0, 20], 'upperarm.R': [30, 0, -20] }), [0, -0.3, 0], 'out'),
    key(0.3, R(), [0, -0.06, 0], 'inOut'),
  ],
};

/** G: Anken — the boot knives flicked off the toes of a rising front kick. */
const anken: ClipDef = {
  name: 'yr_anken', dur: 0.56, fadeIn: 0.04, fadeOut: 0.18, events: { throw: 0.17 },
  keys: [
    key(0, R()),
    key(0.1, R({ 'thigh.R': [-50, 0, 0], 'shin.R': [100, 0, 0], spine: [-6, 0, 0] }), [0, -0.03, 0], 'out'),
    key(0.17, R({ spine: [-14, 0, 0], head: [10, 0, 0], 'thigh.R': [-120, 0, 0], 'shin.R': [0, 0, 0], 'foot.R': [-40, 0, 0], 'upperarm.L': [-30, 0, 50], 'upperarm.R': [-30, 0, -50], 'forearm.L': [-40, 0, 0], 'forearm.R': [-40, 0, 0] }), [0, 0, 0.04], 'outExpo'),
    key(0.56, R(), [0, -0.06, 0], 'inOut'),
  ],
};

/** Taketonbo: the hand shot out at the face, the target flipped over it onto its back. */
const taketonbo: ClipDef = {
  name: 'yr_taketonbo', dur: 0.8, fadeIn: 0.04, fadeOut: 0.22, events: { step: 0.06, grab: 0.14, flip: 0.4 },
  keys: [
    key(0, R()),
    key(0.14, R({ chest: [6, 10, 0], 'upperarm.R': [-96, 0, 0], 'forearm.R': [-6, 0, 0], 'hand.R': [-50, 0, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [50, 0, 0] }), [0, -0.1, 0.16], 'outExpo'),
    key(0.4, R({ spine: [-10, 0, 0], chest: [-14, -10, 0], 'upperarm.R': [-170, 0, -10], 'forearm.R': [-10, 0, 0], 'hand.R': [-30, 0, 0], 'thigh.L': [-40, 0, 6], 'shin.L': [40, 0, 0] }), [0, -0.06, 0.1], 'inOut'),
    key(0.52, R({ spine: [30, 0, 0], chest: [16, 0, 0], 'upperarm.R': [-40, 0, -10], 'forearm.R': [-10, 0, 0] }), [0, -0.18, 0.14], 'inExpo'),
    key(0.8, R(), [0, -0.06, 0], 'inOut'),
  ],
};

// ------------------------------------------------------------------ Shunkō, Raijin Senkei

/** F: Shunkō — the arms crossed over the chest, the orange top torn away, the arms flung down as it bursts. */
const shunko: ClipDef = {
  name: 'yr_shunko', dur: 1.6, fadeIn: 0.08, fadeOut: 0.3, events: { charge: 0.1, tear: 0.55, burst: 0.9 },
  keys: [
    key(0, R()),
    key(0.5, R({ hips: [0, 0, 0], spine: [14, 0, 0], chest: [10, 0, 0], head: [10, 0, 0], 'upperarm.L': [-60, -30, -40], 'forearm.L': [-110, 0, 0], 'upperarm.R': [-60, 30, 40], 'forearm.R': [-110, 0, 0], 'thigh.L': [-30, 0, 12], 'shin.L': [50, 0, 0], 'thigh.R': [-10, 0, -12], 'shin.R': [50, 0, 0] }), [0, -0.16, 0], 'inOut'),
    key(0.9, R({ hips: [0, 0, 0], spine: [-10, 0, 0], chest: [-14, 0, 0], head: [-14, 0, 0], 'upperarm.L': [10, 0, 34], 'forearm.L': [-10, 0, 0], 'hand.L': [0, 0, -30], 'upperarm.R': [10, 0, -34], 'forearm.R': [-10, 0, 0], 'hand.R': [0, 0, 30], 'thigh.L': [-24, 0, 16], 'shin.L': [36, 0, 0], 'thigh.R': [-4, 0, -16], 'shin.R': [36, 0, 0] }), [0, -0.1, 0], 'outExpo'),
    key(1.3, R({ hips: [0, 0, 0], spine: [-6, 0, 0], chest: [-8, 0, 0], 'upperarm.L': [8, 0, 30], 'upperarm.R': [8, 0, -30], 'thigh.L': [-24, 0, 16], 'shin.L': [36, 0, 0], 'thigh.R': [-4, 0, -16], 'shin.R': [36, 0, 0] }), [0, -0.1, 0], 'out'),
    key(1.6, R(), [0, -0.06, 0], 'inOut'),
  ],
};

/** Shunkō RMB: both palms driven forward and the compressed Kidō fired out of them. */
const burst: ClipDef = {
  name: 'yr_burst', dur: 0.9, fadeIn: 0.05, fadeOut: 0.22, events: { charge: 0.12, fire: 0.42 },
  keys: [
    key(0, R()),
    key(0.36, R({ hips: [0, -20, 0], chest: [0, -20, 0], 'upperarm.L': [10, 0, 30], 'forearm.L': [-110, 0, 0], 'hand.L': [-40, 0, 0], 'upperarm.R': [10, 0, -30], 'forearm.R': [-110, 0, 0], 'hand.R': [-40, 0, 0], 'thigh.L': [-46, 0, 12], 'shin.L': [60, 0, 0], 'thigh.R': [16, 0, -12], 'shin.R': [50, 0, 0] }), [0, -0.18, -0.04], 'inOut'),
    key(0.44, R({ hips: [0, 0, 0], spine: [12, 0, 0], chest: [4, 0, 0], 'upperarm.L': [-88, 0, -8], 'forearm.L': [-4, 0, 0], 'hand.L': [-70, 0, 0], 'upperarm.R': [-88, 0, 8], 'forearm.R': [-4, 0, 0], 'hand.R': [-70, 0, 0], 'thigh.L': [-60, 0, 12], 'shin.L': [60, 0, 0], 'thigh.R': [30, 0, -12], 'shin.R': [20, 0, 0] }), [0, -0.2, 0.2], 'outExpo'),
    key(0.66, R({ spine: [10, 0, 0], 'upperarm.L': [-84, 0, -6], 'forearm.L': [-8, 0, 0], 'upperarm.R': [-84, 0, 6], 'forearm.R': [-8, 0, 0], 'thigh.L': [-56, 0, 12], 'shin.L': [58, 0, 0] }), [0, -0.18, 0.16], 'inOut'),
    key(0.9, R(), [0, -0.06, 0], 'inOut'),
  ],
};

/** Hanki: the hands turning the incoming Kidō aside with a spin of her own. 'block' runs from 0.06 to 0.5. */
const hanki: ClipDef = {
  name: 'yr_hanki', dur: 0.64, fadeIn: 0.04, fadeOut: 0.18, events: { block: 0.06, release: 0.5 },
  keys: [
    key(0, R()),
    key(0.08, R({ hips: [0, 0, 0], spine: [4, 0, 0], 'upperarm.L': [-80, 0, -10], 'forearm.L': [-30, 0, 0], 'hand.L': [-80, 0, 0], 'upperarm.R': [-70, 0, 20], 'forearm.R': [-50, 0, 0], 'hand.R': [-60, 0, 0] }), [0, -0.1, 0], 'outExpo'),
    key(0.3, R({ hips: [0, 0, 0], spine: [4, 0, 0], 'upperarm.L': [-70, 0, 20], 'forearm.L': [-50, 0, 0], 'hand.L': [-60, 0, 0], 'upperarm.R': [-80, 0, -10], 'forearm.R': [-30, 0, 0], 'hand.R': [-80, 0, 0] }), [0, -0.1, 0], 'inOut'),
    key(0.5, R({ hips: [0, 0, 0], spine: [8, 0, 0], 'upperarm.L': [-86, 0, 30], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-86, 0, -30], 'forearm.R': [-10, 0, 0] }), [0, -0.1, 0.06], 'outExpo'),
    key(0.64, R(), [0, -0.06, 0], 'inOut'),
  ],
};

/** F again: Raijin Senkei — both arms raised to the ring of drums forming behind her. */
const raijin: ClipDef = {
  name: 'yr_raijin', dur: 2.0, fadeIn: 0.08, fadeOut: 0.3, events: { drums: 0.5, burst: 1.1 },
  keys: [
    key(0, R()),
    key(0.6, R({ hips: [0, 0, 0], spine: [-8, 0, 0], chest: [-10, 0, 0], head: [-20, 0, 0], 'upperarm.L': [-160, 0, 20], 'forearm.L': [-20, 0, 0], 'hand.L': [0, 0, 0], 'upperarm.R': [-160, 0, -20], 'forearm.R': [-20, 0, 0], 'hand.R': [0, 0, 0], 'thigh.L': [-10, 0, 14], 'shin.L': [14, 0, 0], 'thigh.R': [-6, 0, -14], 'shin.R': [14, 0, 0] }), [0, -0.02, 0], 'inOut'),
    key(1.1, R({ hips: [0, 0, 0], spine: [-12, 0, 0], chest: [-14, 0, 0], head: [-26, 0, 0], 'upperarm.L': [-170, 0, 40], 'forearm.L': [-6, 0, 0], 'upperarm.R': [-170, 0, -40], 'forearm.R': [-6, 0, 0], 'thigh.L': [-10, 0, 18], 'shin.L': [10, 0, 0], 'thigh.R': [-6, 0, -18], 'shin.R': [10, 0, 0] }), [0, 0.02, 0], 'outExpo'),
    key(1.6, R({ hips: [0, 0, 0], spine: [-6, 0, 0], 'upperarm.L': [-30, 0, 50], 'upperarm.R': [-30, 0, -50] }), [0, -0.04, 0], 'inOut'),
    key(2.0, R(), [0, -0.06, 0], 'inOut'),
  ],
};

/** Raijin Senkei: the column — the right hand thrust out and the lightning poured down it. */
const column: ClipDef = {
  name: 'yr_column', dur: 1.4, fadeIn: 0.06, fadeOut: 0.26, events: { charge: 0.12, fire: 0.5, stop: 1.05 },
  keys: [
    key(0, R()),
    key(0.42, R({ hips: [0, -24, 0], chest: [-6, -24, 0], head: [0, 30, 0], 'upperarm.R': [-150, 0, -20], 'forearm.R': [-30, 0, 0], 'upperarm.L': [-60, 0, 30], 'forearm.L': [-60, 0, 0], 'thigh.L': [-40, 0, 12], 'shin.L': [50, 0, 0], 'thigh.R': [16, 0, -12], 'shin.R': [40, 0, 0] }), [0, -0.12, -0.04], 'inOut'),
    key(0.52, R({ hips: [0, 10, 0], spine: [10, 10, 0], chest: [6, 18, 0], head: [-6, -16, 0], 'upperarm.R': [-96, 0, 0], 'forearm.R': [-2, 0, 0], 'hand.R': [-60, 0, 0], 'upperarm.L': [10, 0, 34], 'forearm.L': [-80, 0, 0], 'thigh.L': [-60, 0, 10], 'shin.L': [60, 0, 0], 'thigh.R': [30, 0, -10], 'shin.R': [20, 0, 0] }), [0, -0.16, 0.18], 'outExpo'),
    key(1.05, R({ hips: [0, 10, 0], spine: [8, 10, 0], chest: [4, 16, 0], 'upperarm.R': [-94, 0, 0], 'forearm.R': [-4, 0, 0], 'hand.R': [-60, 0, 0], 'upperarm.L': [10, 0, 34], 'forearm.L': [-80, 0, 0], 'thigh.L': [-56, 0, 10], 'shin.L': [58, 0, 0], 'thigh.R': [28, 0, -10], 'shin.R': [22, 0, 0] }), [0, -0.15, 0.16], 'inOut'),
    key(1.4, R(), [0, -0.06, 0], 'inOut'),
  ],
};

export const YORUICHI_CLIPS: ClipDef[] = [
  snap, spin, knee, axe, palm, blow, barrage(), strikeA, strikeB, strikeC, vanish, anken, taketonbo, shunko, burst, hanki, raijin, column,
  ...ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name)),
];
export const YORUICHI_CHAIN = ['yr_snap', 'yr_spin', 'yr_knee', 'yr_palm', 'yr_axe'];
