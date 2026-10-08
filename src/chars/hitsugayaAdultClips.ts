// The adult Hitsugaya's animation set (Complete Bankai; docs/kits/hitsugaya.md). He fights like a grown swordsman:
// the string is the Shinigami sword string the 84-vox bodies share (slash1-5), the Freeze-Cut is the level sweep
// (dg_level). His own: the flash-freeze gesture (the open left hand toward the target), the sword pointed for Function
// Stop, the sword raised and driven into the ground to close Shikai Hyōketsu, the wings spread, and the exhausted kneel
// when the body gives out.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { ICHIGO_CLIPS, ICHIGO_STANCE } from './ichigoClips';
import { DANGAI_CLIPS } from './ichigoDangaiClips';

type E = [number, number, number];
const body = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

/** upright and unhurried: the sword low at his right, the point forward, the left hand loose */
export const ADULT_STANCE: StanceDef = {
  ...ICHIGO_STANCE,
  idle: { ...ICHIGO_STANCE.idle, hips: [0, -6, 0], spine: [2, 2, 0], chest: [0, 4, 0], head: [2, 0, 0], 'upperarm.L': [4, 0, 10], 'forearm.L': [-16, 0, 0] },
  idleHips: -0.02,
};

const IDLE: Record<string, E> = { hips: [0, -6, 0], spine: [2, 2, 0], chest: [0, 4, 0], head: [2, 0, 0], 'upperarm.L': [4, 0, 10], 'forearm.L': [-16, 0, 0] };
const I = (over: Record<string, E> = {}): Record<string, E> => ({ ...IDLE, ...over });
/** the sword held low at the right, as in the stance (chest space) */
const LOW = (t: number, ease?: KeyDef['ease']): KeyDef => ({ t, ease, c: { '@gripR': [-0.27, -0.31, 0.2], '@dirR': [-0.12, -0.5, 0.86], '@edgeR': [0.1, -0.85, -0.5], '@poleR': [-0.55, -0.3, -0.8], '@ikR': [1, 0, 0] } });

/** Q: the flash-freeze — the open left hand thrown out at the target */
const gesture: ClipDef = {
  name: 'ha_gesture', dur: 0.95, fadeIn: 0.05, fadeOut: 0.25, events: { cast: 0.2 },
  keys: mergeKeys(
    [LOW(0), LOW(0.95)],
    [
      body(0, I()),
      body(0.2, I({ hips: [0, -18, 0], spine: [2, -8, 0], chest: [0, -12, 0], head: [0, 20, 0], 'upperarm.L': [-86, 0, -4], 'forearm.L': [-6, 0, 0], 'hand.L': [-24, 0, 0], 'thigh.L': [-16, 0, 6], 'shin.L': [14, 0, 0], 'thigh.R': [10, 0, -6] }), [0, -0.03, 0.04], 'outExpo'),
      body(0.62, I({ hips: [0, -18, 0], spine: [2, -8, 0], chest: [0, -12, 0], head: [0, 20, 0], 'upperarm.L': [-84, 0, -4], 'forearm.L': [-8, 0, 0], 'hand.L': [-22, 0, 0], 'thigh.L': [-16, 0, 6], 'shin.L': [14, 0, 0], 'thigh.R': [10, 0, -6] }), [0, -0.03, 0.04], 'linear'),
      body(0.95, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** E: Function Stop — the sword's point leveled at the target */
const point: ClipDef = {
  name: 'ha_point', dur: 0.9, fadeIn: 0.05, fadeOut: 0.25, events: { cast: 0.18 },
  keys: mergeKeys(
    swingKeys({ a: [0, 0, 1], b: [1, 0, 0], c: [-0.16, 0.12, 0.12], r: 0.4, pole: [-0.6, -0.4, -0.6], keys: [[0, -50, 'out'], [0.18, -4, 'outExpo'], [0.66, 0, 'linear'], [0.9, -40, 'inOut']] }),
    [
      body(0, I()),
      body(0.18, I({ hips: [0, -24, 0], spine: [4, -10, 0], chest: [2, -14, 0], head: [0, 26, 0], 'upperarm.L': [10, 0, 24], 'thigh.L': [-22, 0, 6], 'shin.L': [20, 0, 0], 'thigh.R': [16, 0, -6], 'shin.R': [12, 0, 0] }), [0, -0.05, 0.06], 'outExpo'),
      body(0.66, I({ hips: [0, -24, 0], spine: [4, -10, 0], chest: [2, -14, 0], head: [0, 26, 0], 'upperarm.L': [10, 0, 24], 'thigh.L': [-22, 0, 6], 'shin.L': [20, 0, 0], 'thigh.R': [16, 0, -6] }), [0, -0.05, 0.06], 'linear'),
      body(0.9, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** R: Shikai Hyōketsu — the sword raised straight up, then driven point-down into the ground ('plant') */
const box: ClipDef = {
  name: 'ha_box', dur: 1.25, fadeIn: 0.06, fadeOut: 0.3, events: { plant: 0.5 },
  keys: mergeKeys(
    swingKeys({ a: [0, 1, 0], b: [0, 0, 1], c: [-0.12, 0.02, 0.22], r: 0.34, pole: [-0.7, -0.3, -0.6], keys: [[0, 120, 'out'], [0.3, 8, 'out'], [0.5, 178, 'outExpo'], [1.0, 178, 'linear'], [1.25, 120, 'inOut']] }),
    [
      body(0, I()),
      body(0.3, I({ hips: [-4, 0, 0], spine: [-6, 0, 0], chest: [-8, 0, 0], head: [-8, 0, 0], 'upperarm.L': [-20, 0, 40], 'forearm.L': [-30, 0, 0] }), [0, 0.02, 0], 'out'),
      body(0.5, I({ hips: [20, 0, 0], spine: [22, 0, 0], chest: [14, 0, 0], head: [-20, 0, 0], 'thigh.L': [-60, 0, 8], 'shin.L': [80, 0, 0], 'thigh.R': [-10, 0, -8], 'shin.R': [90, 0, 0], 'foot.R': [30, 0, 0], 'upperarm.L': [-10, 0, 50], 'forearm.L': [-20, 0, 0] }), [0, -0.36, 0.06], 'outExpo'),
      body(1.0, I({ hips: [20, 0, 0], spine: [22, 0, 0], chest: [14, 0, 0], head: [-18, 0, 0], 'thigh.L': [-58, 0, 8], 'shin.L': [78, 0, 0], 'thigh.R': [-10, 0, -8], 'shin.R': [88, 0, 0], 'foot.R': [30, 0, 0], 'upperarm.L': [-10, 0, 50], 'forearm.L': [-20, 0, 0] }), [0, -0.36, 0.06], 'linear'),
      body(1.25, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** F: the thin wings spread ('spread'), the chest lifted */
const wings: ClipDef = {
  name: 'ha_wings', dur: 0.8, fadeIn: 0.06, fadeOut: 0.24, events: { spread: 0.18 },
  keys: mergeKeys(
    [LOW(0), LOW(0.8)],
    [
      body(0, I()),
      body(0.18, I({ spine: [-8, 0, 0], chest: [-12, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-10, 0, 70], 'forearm.L': [-10, 0, 0], 'thigh.L': [-10, 0, 4], 'shin.L': [30, 0, 0], 'thigh.R': [6, 0, -4], 'shin.R': [40, 0, 0] }), [0, 0.04, 0], 'outExpo'),
      body(0.8, I(), [0, -0.02, 0], 'inOut'),
    ],
  ),
};

/** the body gives out: down on one knee, the sword planted (held until the next action) */
const kneel: ClipDef = {
  name: 'ha_kneel', dur: 1.4, fadeIn: 0.1, fadeOut: 0.3,
  keys: mergeKeys(
    swingKeys({ a: [0, 1, 0], b: [0, 0, 1], c: [-0.12, -0.02, 0.24], r: 0.3, pole: [-0.7, -0.3, -0.6], keys: [[0, 110, 'out'], [0.4, 176, 'out'], [1.4, 176, 'linear']] }),
    [
      body(0, I()),
      body(0.4, I({ hips: [24, 0, 0], spine: [20, 0, 0], chest: [16, 0, 0], head: [10, 0, 0], 'thigh.L': [-80, 0, 8], 'shin.L': [80, 0, 0], 'thigh.R': [0, 0, -8], 'shin.R': [110, 0, 0], 'foot.R': [40, 0, 0], 'upperarm.L': [10, 0, 14], 'forearm.L': [-40, 0, 0] }), [0, -0.46, 0], 'out'),
      body(1.4, I({ hips: [26, 0, 0], spine: [22, 0, 0], chest: [18, 0, 0], head: [14, 0, 0], 'thigh.L': [-80, 0, 8], 'shin.L': [80, 0, 0], 'thigh.R': [0, 0, -8], 'shin.R': [110, 0, 0], 'foot.R': [40, 0, 0], 'upperarm.L': [12, 0, 14], 'forearm.L': [-42, 0, 0] }), [0, -0.47, 0], 'linear'),
    ],
  ),
};

export const ADULT_CLIPS: ClipDef[] = [...ICHIGO_CLIPS, ...DANGAI_CLIPS.filter((c) => c.name === 'dg_level'), gesture, point, box, wings, kneel];
export const ADULT_CHAIN = ['slash1', 'slash2', 'slash3', 'slash4'];
