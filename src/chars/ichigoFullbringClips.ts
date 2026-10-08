// Lost Agent Ichigo's animation set (docs/kits/ichigo.md §4 Lost Agent). FB1 fights from a karate guard with the badge
// in his right fist — the manji guard thrust out like a shield: the guard bash, the rising bash, the ram, the manji
// blast punched off the fist, the focused-leg kick, the braced guard, and the reiatsu closing over him (→ FB2). FB2
// leans in with the black blade along his right forearm: forehand and backhand arm cuts, the berserk sweep, and the
// explosion of the completed Fullbring (→ FB3). FB3 swings the machete with the classic cleaver arcs (ICHIGO_CLIPS) and
// kicks; Rukia's sword through his chest restores the Shinigami (→ Shikai v2). Events: 'step' (lunge), 'hit', 'fx',
// 'combo', and the special beats named per clip.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { DANGAI_CLIPS, HUMAN_CLIPS } from './ichigoDangaiClips';
import { AGENT_HUMAN_CLIPS } from './ichigoAgentClips';
import { ICHIGO_CLIPS, ICHIGO_STANCE } from './ichigoClips';

type B = NonNullable<KeyDef['b']>;

function body(t: number, b: B, hips?: KeyDef['hips'], ease?: KeyDef['ease']): KeyDef {
  return { t, b, hips, ease };
}

// ------------------------------------------------------------------------------------------------ FB1

/** the karate guard with the right fist (the badge, the manji before it) held forward like a shield */
const FB1_GUARD: B = {
  hips: [0, 18, 0], spine: [6, -4, 0], chest: [4, -8, 0], neck: [0, 0, 0], head: [-2, -6, 0],
  'thigh.R': [-18, 0, -6], 'shin.R': [20, 0, 0], 'foot.R': [-2, 0, 0], 'thigh.L': [14, 0, 8], 'shin.L': [22, 0, 0], 'foot.L': [-8, 0, 0],
  'upperarm.R': [-64, 0, -6], 'forearm.R': [-62, 0, 0], 'hand.R': [0, 0, 0],
  'upperarm.L': [-34, 0, 18], 'forearm.L': [-112, 0, 0], 'hand.L': [0, 0, 0],
};
const G1 = (over: B = {}): B => ({ ...FB1_GUARD, ...over });
const G1KEY = (t: number, ease: KeyDef['ease'] = 'inOut'): KeyDef => body(t, FB1_GUARD, [0, -0.05, 0], ease);

export const FB1_STANCE: StanceDef = {
  idle: FB1_GUARD,
  idleHips: -0.05,
  run: { 'upperarm.R': [-50, 0, -8], 'forearm.R': [-80, 0, 0], 'upperarm.L': [-20, 0, 10], 'forearm.L': [-70, 0, 0] },
  sprint: { 'upperarm.R': [-30, 0, -10], 'forearm.R': [-90, 0, 0], 'upperarm.L': [10, 0, 10], 'forearm.L': [-80, 0, 0] },
  swingL: 1,
  swingR: 0.3,
};

/** the guard bash: the right fist and its manji driven straight into the foe */
const bash: ClipDef = {
  name: 'fb_bash', dur: 0.46, fadeIn: 0.04, fadeOut: 0.18, events: { step: 0.04, hit: 0.12, combo: 0.22 },
  keys: [
    G1KEY(0),
    body(0.05, G1({ hips: [0, 26, 0], chest: [2, -4, 0], 'upperarm.R': [-40, 0, -14], 'forearm.R': [-110, 0, 0] }), [0, -0.05, -0.02], 'out'),
    body(0.12, G1({ hips: [0, -12, 0], spine: [10, -10, 0], chest: [8, -16, 0], head: [-4, 20, 0], 'upperarm.R': [-90, 0, 4], 'forearm.R': [-6, 0, 0], 'thigh.R': [-34, 0, -6], 'shin.R': [28, 0, 0], 'thigh.L': [22, 0, 6], 'shin.L': [16, 0, 0], 'foot.L': [12, 0, 0] }), [0, -0.07, 0.1], 'outExpo'),
    body(0.24, G1({ hips: [0, -8, 0], spine: [8, -8, 0], chest: [6, -12, 0], 'upperarm.R': [-80, 0, 0], 'forearm.R': [-30, 0, 0], 'thigh.R': [-30, 0, -6], 'shin.R': [26, 0, 0] }), [0, -0.065, 0.08], 'out'),
    G1KEY(0.46),
  ],
};

/** the rising bash: dropped low, the guard driven up under the chin — it launches */
const upper: ClipDef = {
  name: 'fb_upper', dur: 0.6, fadeIn: 0.05, fadeOut: 0.2, events: { step: 0.1, hit: 0.2, combo: 0.32 },
  keys: [
    G1KEY(0),
    body(0.12, G1({ hips: [0, 6, 0], spine: [16, 4, 0], chest: [14, 6, 0], 'upperarm.R': [10, 0, -14], 'forearm.R': [-100, 0, 0], 'thigh.R': [-40, 0, -8], 'shin.R': [56, 0, 0], 'thigh.L': [0, 0, 8], 'shin.L': [50, 0, 0] }), [0, -0.18, 0.02], 'out'),
    body(0.2, G1({ hips: [0, -10, 0], spine: [-10, -8, 0], chest: [-12, -14, 0], head: [-10, 10, 0], 'upperarm.R': [-150, 0, -8], 'forearm.R': [-60, 0, 0], 'thigh.R': [-10, 0, -6], 'shin.R': [8, 0, 0], 'thigh.L': [14, 0, 6], 'shin.L': [6, 0, 0], 'foot.L': [20, 0, 0] }), [0, 0.04, 0.04], 'outExpo'),
    body(0.34, G1({ hips: [0, -8, 0], spine: [-8, -6, 0], chest: [-10, -12, 0], 'upperarm.R': [-140, 0, -8], 'forearm.R': [-70, 0, 0] }), [0, 0.02, 0.03], 'out'),
    G1KEY(0.6),
  ],
};

/** RMB — the guard ram: the manji out front, the shoulder behind it, a charging lunge */
const ram: ClipDef = {
  name: 'fb_ram', dur: 0.8, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.16, hit: 0.3 },
  keys: [
    G1KEY(0),
    body(0.16, G1({ hips: [10, 10, 0], spine: [18, 6, 0], chest: [12, 4, 0], head: [-16, -6, 0], 'upperarm.R': [-76, 0, 4], 'forearm.R': [-40, 0, 0], 'thigh.R': [-50, 0, -6], 'shin.R': [70, 0, 0], 'thigh.L': [34, 0, 6], 'shin.L': [40, 0, 0] }), [0, -0.16, 0], 'out'),
    body(0.3, G1({ hips: [14, 4, 0], spine: [22, 4, 0], chest: [14, 2, 0], head: [-20, -4, 0], 'upperarm.R': [-84, 0, 0], 'forearm.R': [-26, 0, 0], 'upperarm.L': [-60, 0, 20], 'forearm.L': [-90, 0, 0], 'thigh.R': [-56, 0, -6], 'shin.R': [50, 0, 0], 'thigh.L': [36, 0, 6], 'shin.L': [12, 0, 0], 'foot.L': [16, 0, 0] }), [0, -0.18, 0.2], 'outExpo'),
    body(0.5, G1({ hips: [12, 4, 0], spine: [20, 4, 0], chest: [12, 2, 0], 'upperarm.R': [-80, 0, 0], 'forearm.R': [-34, 0, 0], 'thigh.R': [-52, 0, -6], 'shin.R': [52, 0, 0] }), [0, -0.17, 0.18], 'out'),
    G1KEY(0.8),
  ],
};

/** Q / E — the manji blast: the guard punched off the fist as a spinning blade of black reiatsu ('fire'; 'charge' holds) */
const blast: ClipDef = {
  name: 'fb_blast', dur: 0.72, fadeIn: 0.05, fadeOut: 0.22, events: { charge: 0.05, fire: 0.26 },
  keys: [
    G1KEY(0),
    body(0.18, G1({ hips: [0, 34, 0], spine: [2, 10, 0], chest: [0, 12, 0], head: [0, -36, 0], 'upperarm.R': [-34, 0, -20], 'forearm.R': [-118, 0, 0], 'upperarm.L': [-70, 0, 10], 'forearm.L': [-30, 0, 0], 'thigh.R': [-22, 0, -6], 'shin.R': [30, 0, 0], 'thigh.L': [18, 0, 8], 'shin.L': [30, 0, 0] }), [0, -0.09, -0.03], 'out'),
    body(0.26, G1({ hips: [0, -16, 0], spine: [8, -12, 0], chest: [6, -18, 0], head: [-4, 26, 0], 'upperarm.R': [-92, 0, 2], 'forearm.R': [-4, 0, 0], 'hand.R': [-6, 0, 0], 'upperarm.L': [-20, 0, 26], 'forearm.L': [-80, 0, 0], 'thigh.R': [-38, 0, -6], 'shin.R': [32, 0, 0], 'thigh.L': [26, 0, 6], 'shin.L': [18, 0, 0], 'foot.L': [14, 0, 0] }), [0, -0.08, 0.1], 'outExpo'),
    body(0.42, G1({ hips: [0, -14, 0], spine: [8, -10, 0], chest: [6, -16, 0], 'upperarm.R': [-88, 0, 2], 'forearm.R': [-14, 0, 0], 'thigh.R': [-36, 0, -6], 'shin.R': [30, 0, 0] }), [0, -0.075, 0.09], 'out'),
    G1KEY(0.72),
  ],
};

/** R — the focused leg: the whole of Bringer Light poured into one leg, a long step and a straight thrust kick */
const legKick: ClipDef = {
  name: 'fb_legkick', dur: 0.72, fadeIn: 0.04, fadeOut: 0.22, events: { step: 0.08, hit: 0.24 },
  keys: [
    G1KEY(0),
    body(0.14, G1({ hips: [0, 10, 0], spine: [-4, 6, 0], 'thigh.L': [-90, 0, 4], 'shin.L': [110, 0, 0], 'foot.L': [-10, 0, 0], 'thigh.R': [-8, 0, -6], 'shin.R': [24, 0, 0] }), [0, -0.04, 0.04], 'out'),
    body(0.24, G1({ hips: [-6, 4, 0], spine: [-16, 4, 0], chest: [-6, 2, 0], head: [10, 0, 0], 'thigh.L': [-100, 0, 2], 'shin.L': [2, 0, 0], 'foot.L': [-36, 0, 0], 'thigh.R': [-4, 0, -6], 'shin.R': [14, 0, 0], 'upperarm.L': [-10, 0, 40], 'forearm.L': [-40, 0, 0] }), [0, -0.02, 0.16], 'outExpo'),
    body(0.4, G1({ hips: [-4, 4, 0], spine: [-12, 4, 0], 'thigh.L': [-80, 0, 2], 'shin.L': [70, 0, 0], 'thigh.R': [-6, 0, -6], 'shin.R': [18, 0, 0] }), [0, -0.03, 0.12], 'inOut'),
    G1KEY(0.72),
  ],
};

/** G — the manji guard braced before him, the left hand behind the right wrist ('up') */
const guardUp: ClipDef = {
  name: 'fb_guard', dur: 0.6, fadeIn: 0.04, fadeOut: 0.2, events: { up: 0.06 },
  keys: [
    G1KEY(0),
    body(0.08, G1({ hips: [0, 6, 0], spine: [6, 0, 0], chest: [4, -2, 0], head: [-6, 0, 0], 'upperarm.R': [-80, 0, 0], 'forearm.R': [-40, 0, 0], 'hand.R': [10, 0, 0], 'upperarm.L': [-70, 0, -20], 'forearm.L': [-60, 0, 0], 'thigh.R': [-26, 0, -8], 'shin.R': [34, 0, 0], 'thigh.L': [20, 0, 8], 'shin.L': [36, 0, 0] }), [0, -0.1, 0], 'outExpo'),
    body(0.6, G1({ hips: [0, 6, 0], spine: [6, 0, 0], chest: [4, -2, 0], head: [-6, 0, 0], 'upperarm.R': [-80, 0, 0], 'forearm.R': [-40, 0, 0], 'hand.R': [10, 0, 0], 'upperarm.L': [-70, 0, -20], 'forearm.L': [-60, 0, 0], 'thigh.R': [-26, 0, -8], 'shin.R': [34, 0, 0], 'thigh.L': [20, 0, 8], 'shin.L': [36, 0, 0] }), [0, -0.1, 0], 'linear'),
  ],
};

/** F (FB1 → FB2): the badge's reiatsu closes over him — arms flung wide, the head back ('fx', 'burst') */
const cladUp: ClipDef = {
  name: 'fb_clad', dur: 1.2, fadeIn: 0.08, fadeOut: 0.25, events: { fx: 0.3, burst: 0.75 },
  keys: [
    G1KEY(0, 'out'),
    body(0.3, G1({ hips: [0, 0, 0], spine: [12, 0, 0], chest: [10, 0, 0], head: [16, 0, 0], 'upperarm.R': [-30, 0, -10], 'forearm.R': [-100, 0, 0], 'upperarm.L': [-30, 0, 10], 'forearm.L': [-100, 0, 0], 'thigh.R': [-10, 0, -10], 'shin.R': [30, 0, 0], 'thigh.L': [-10, 0, 10], 'shin.L': [30, 0, 0] }), [0, -0.12, 0], 'inOut'),
    body(0.75, G1({ hips: [-6, 0, 0], spine: [-16, 0, 0], chest: [-12, 0, 0], head: [-16, 0, 0], 'upperarm.R': [-10, 0, -70], 'forearm.R': [-10, 0, 0], 'upperarm.L': [-10, 0, 70], 'forearm.L': [-10, 0, 0], 'thigh.R': [-4, 0, -12], 'shin.R': [8, 0, 0], 'thigh.L': [-4, 0, 12], 'shin.L': [8, 0, 0] }), [0, 0, 0], 'outExpo'),
    body(1.2, G1({ 'upperarm.R': [-20, 0, -40], 'forearm.R': [-30, 0, 0], 'upperarm.L': [-20, 0, 40], 'forearm.L': [-30, 0, 0] }), [0, -0.05, 0], 'inOut'),
  ],
};

export const FB1_CLIPS: ClipDef[] = [...AGENT_HUMAN_CLIPS, bash, upper, ram, blast, legKick, guardUp, cladUp];
export const FB1_CHAIN = ['hm_jab', 'fb_bash', 'hm_round', 'fb_upper'];

// ------------------------------------------------------------------------------------------------ FB2

/** leaning in, the right forearm (and the blade along it) raised across the body */
const FB2_IDLE: B = {
  hips: [6, 14, 0], spine: [12, -2, 0], chest: [8, -8, 0], neck: [0, 0, 0], head: [-10, -4, 0],
  'thigh.R': [-22, 0, -8], 'shin.R': [28, 0, 0], 'foot.R': [-4, 0, 0], 'thigh.L': [16, 0, 10], 'shin.L': [30, 0, 0], 'foot.L': [-10, 0, 0],
  'upperarm.R': [-56, 0, -26], 'forearm.R': [-84, 0, 0], 'hand.R': [10, 0, 0],
  'upperarm.L': [-20, 0, 22], 'forearm.L': [-70, 0, 0], 'hand.L': [0, 0, 0],
};
const G2 = (over: B = {}): B => ({ ...FB2_IDLE, ...over });
const G2KEY = (t: number, ease: KeyDef['ease'] = 'inOut'): KeyDef => body(t, FB2_IDLE, [0, -0.08, 0], ease);

export const FB2_STANCE: StanceDef = {
  idle: FB2_IDLE,
  idleHips: -0.08,
  run: { 'upperarm.R': [-40, 0, -20], 'forearm.R': [-90, 0, 0], spine: [16, 0, 0] },
  sprint: { 'upperarm.R': [10, 0, -20], 'forearm.R': [-60, 0, 0], spine: [22, 0, 0] },
  swingL: 1,
  swingR: 0.2,
};

/** 1: the forehand — the forearm blade swept level from right to left */
const arm1: ClipDef = {
  name: 'fb2_s1', dur: 0.5, fadeIn: 0.04, fadeOut: 0.18, events: { step: 0.04, hit: 0.14, combo: 0.24 },
  keys: [
    G2KEY(0),
    body(0.07, G2({ hips: [6, 30, 0], chest: [6, 16, 0], head: [-8, -28, 0], 'upperarm.R': [-60, 0, -60], 'forearm.R': [-60, 0, 0] }), [0, -0.08, 0], 'out'),
    body(0.15, G2({ hips: [6, -18, 0], spine: [12, -12, 0], chest: [8, -24, 0], head: [-10, 30, 0], 'upperarm.R': [-84, 0, 40], 'forearm.R': [-10, 0, 0], 'hand.R': [0, 0, 0], 'thigh.R': [-34, 0, -8], 'shin.R': [30, 0, 0] }), [0, -0.1, 0.1], 'outExpo'),
    body(0.28, G2({ hips: [6, -22, 0], spine: [12, -14, 0], chest: [8, -28, 0], head: [-10, 34, 0], 'upperarm.R': [-76, 0, 52], 'forearm.R': [-20, 0, 0] }), [0, -0.1, 0.09], 'out'),
    G2KEY(0.5),
  ],
};

/** 2: the backhand — the blade brought back across, low left to high right */
const arm2: ClipDef = {
  name: 'fb2_s3', dur: 0.54, fadeIn: 0.04, fadeOut: 0.18, events: { step: 0.05, hit: 0.16, combo: 0.26 },
  keys: [
    G2KEY(0),
    body(0.08, G2({ hips: [6, -20, 0], chest: [6, -20, 0], head: [-8, 28, 0], 'upperarm.R': [-50, 0, 40], 'forearm.R': [-100, 0, 0] }), [0, -0.1, 0], 'out'),
    body(0.16, G2({ hips: [6, 26, 0], spine: [8, 14, 0], chest: [4, 26, 0], head: [-6, -30, 0], 'upperarm.R': [-120, 0, -70], 'forearm.R': [-10, 0, 0], 'thigh.L': [-30, 0, 8], 'shin.L': [30, 0, 0] }), [0, -0.08, 0.1], 'outExpo'),
    body(0.3, G2({ hips: [6, 30, 0], spine: [8, 16, 0], chest: [4, 30, 0], head: [-6, -34, 0], 'upperarm.R': [-126, 0, -76], 'forearm.R': [-20, 0, 0] }), [0, -0.08, 0.09], 'out'),
    G2KEY(0.54),
  ],
};

/** RMB — the berserk sweep: the black arm whirled right round him at full stretch */
const sweep: ClipDef = {
  name: 'fb2_sweep', dur: 0.86, fadeIn: 0.05, fadeOut: 0.22, events: { step: 0.08, hit: 0.2, hit2: 0.4 },
  keys: mergeKeys(
    [
      G2KEY(0),
      body(0.1, G2({ hips: [6, 40, 0], chest: [4, 20, 0], 'upperarm.R': [-80, 0, -80], 'forearm.R': [-6, 0, 0], 'thigh.R': [-24, 0, -12], 'shin.R': [34, 0, 0], 'thigh.L': [20, 0, 12], 'shin.L': [34, 0, 0] }), [0, -0.14, 0], 'out'),
      body(0.5, G2({ hips: [6, 40, 0], chest: [4, 20, 0], 'upperarm.R': [-84, 0, -84], 'forearm.R': [-6, 0, 0] }), [0, -0.14, 0], 'linear'),
      G2KEY(0.86),
    ],
    [
      { t: 0, c: { '@spin': [0, 0, 0] } },
      { t: 0.1, c: { '@spin': [-30, 0, 0] }, ease: 'out' },
      { t: 0.5, c: { '@spin': [-390, 0, 0] }, ease: 'inOut' },
      { t: 0.86, c: { '@spin': [-360, 0, 0] } },
    ],
  ),
};

/** F (FB2 → FB3): the completion — curled tight round the badge, then thrown open as it explodes ('fx', 'burst') */
const complete: ClipDef = {
  name: 'fb_complete', dur: 1.3, fadeIn: 0.08, fadeOut: 0.25, events: { fx: 0.4, burst: 0.8 },
  keys: [
    G2KEY(0, 'out'),
    body(0.4, G2({ hips: [10, 0, 0], spine: [26, 0, 0], chest: [18, 0, 0], head: [16, 0, 0], 'upperarm.R': [-50, 0, 30], 'forearm.R': [-120, 0, 0], 'upperarm.L': [-50, 0, -30], 'forearm.L': [-120, 0, 0], 'thigh.R': [-40, 0, -8], 'shin.R': [70, 0, 0], 'thigh.L': [-30, 0, 8], 'shin.L': [70, 0, 0] }), [0, -0.3, 0], 'inOut'),
    body(0.8, G2({ hips: [-8, 0, 0], spine: [-18, 0, 0], chest: [-14, 0, 0], head: [-20, 0, 0], 'upperarm.R': [-20, 0, -80], 'forearm.R': [-6, 0, 0], 'upperarm.L': [-20, 0, 80], 'forearm.L': [-6, 0, 0], 'thigh.R': [-6, 0, -10], 'shin.R': [8, 0, 0], 'thigh.L': [-6, 0, 10], 'shin.L': [8, 0, 0] }), [0, 0.02, 0], 'outExpo'),
    body(1.3, G2({ 'upperarm.R': [-30, 0, -40], 'forearm.R': [-40, 0, 0], 'upperarm.L': [-20, 0, 40], 'forearm.L': [-40, 0, 0] }), [0, -0.06, 0], 'inOut'),
  ],
};

export const FB2_CLIPS: ClipDef[] = [...AGENT_HUMAN_CLIPS, blast, legKick, arm1, arm2, sweep, complete];
export const FB2_CHAIN = ['fb2_s1', 'hm_front', 'fb2_s3', 'hm_spinback'];

// ------------------------------------------------------------------------------------------------ FB3

export const FB3_STANCE: StanceDef = ICHIGO_STANCE;

/** E (FB3) — the first-strike cut: from behind, one quick level draw across ('hit') */
const draw: ClipDef = {
  name: 'fb3_draw', dur: 0.62, fadeIn: 0.03, fadeOut: 0.2, events: { hit: 0.12 },
  keys: mergeKeys(
    swingKeys({
      a: [0, 0, 1], b: [1, -0.1, 0], c: [-0.2, 0.12, 0.04], r: 0.38, pole: [-0.5, -0.65, -0.55],
      // chest space: the torso unwinds from −30° to +40° under it, so the blade crosses the front at about 0.09 s
      keys: [[0, -120, 'out'], [0.05, -125, 'out'], [0.14, 20, 'out'], [0.3, 76, 'out'], [0.62, 60, 'inOut']],
    }),
    [
      body(0, { hips: [0, -14, 0], spine: [4, -8, 0], chest: [2, -8, 0], 'thigh.L': [-30, 0, 8], 'shin.L': [40, 0, 0], 'thigh.R': [20, 0, -8], 'shin.R': [40, 0, 0] }, [0, -0.14, 0]),
      body(0.14, { hips: [0, 14, 0], spine: [10, 12, 0], chest: [8, 14, -4], head: [0, -30, 0], 'thigh.L': [-36, 0, 8], 'shin.L': [36, 0, 0], 'thigh.R': [26, 0, -8], 'shin.R': [30, 0, 0] }, [0, -0.12, 0.08], 'out'),
      body(0.3, { hips: [0, 16, 0], spine: [10, 13, 0], chest: [8, 16, -4], head: [0, -34, 0] }, [0, -0.12, 0.08], 'out'),
    ],
  ),
};

/** F (FB3 → Shikai v2): Rukia's sword through his chest from behind — the body arched, the arms flung back ('stab', 'burst') */
const restore: ClipDef = {
  name: 'fb_restore', dur: 1.4, fadeIn: 0.06, fadeOut: 0.25, events: { stab: 0.12, burst: 0.85 },
  keys: [
    body(0, { spine: [4, 0, 0], chest: [2, 0, 0] }),
    body(0.14, { hips: [-8, 0, 0], spine: [-18, 0, 0], chest: [-16, 0, 0], neck: [-8, 0, 0], head: [-20, 0, 0], 'upperarm.R': [10, 0, -24], 'forearm.R': [-30, 0, 0], 'upperarm.L': [10, 0, 24], 'forearm.L': [-30, 0, 0], 'thigh.R': [-4, 0, -6], 'shin.R': [10, 0, 0], 'thigh.L': [-4, 0, 6], 'shin.L': [10, 0, 0] }, [0, 0, 0.04], 'outExpo'),
    body(0.7, { hips: [-10, 0, 0], spine: [-22, 0, 0], chest: [-18, 0, 0], neck: [-10, 0, 0], head: [-24, 0, 0], 'upperarm.R': [16, 0, -30], 'forearm.R': [-20, 0, 0], 'upperarm.L': [16, 0, 30], 'forearm.L': [-20, 0, 0] }, [0, -0.02, 0.05], 'inOut'),
    body(0.85, { hips: [4, 0, 0], spine: [10, 0, 0], chest: [6, 0, 0], head: [4, 0, 0], 'upperarm.R': [-30, 0, -60], 'forearm.R': [-20, 0, 0], 'upperarm.L': [-30, 0, 60], 'forearm.L': [-20, 0, 0] }, [0, -0.06, 0], 'outExpo'),
    body(1.4, { spine: [4, 4, 0], chest: [2, 8, 0], 'upperarm.L': [8, 0, 13], 'forearm.L': [-22, 0, 0] }, [0, -0.035, 0], 'inOut'),
  ],
};

const catchFb3 = DANGAI_CLIPS.find((c) => c.name === 'dg_catch')!;
const caughtFb3 = DANGAI_CLIPS.find((c) => c.name === 'dg_caught')!;

export const FB3_CLIPS: ClipDef[] = [...ICHIGO_CLIPS, ...HUMAN_CLIPS.filter((c) => c.name === 'hm_front' || c.name === 'hm_round'), blast, draw, restore, catchFb3, caughtFb3];
export const FB3_CHAIN = ['slash1', 'hm_front', 'slash2', 'slash3'];
