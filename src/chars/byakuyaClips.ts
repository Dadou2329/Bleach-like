// Byakuya's animation set: noble stillness. Sealed and Shikai sword work reuses the IK swing arcs at a
// quicker, more economical tempo; Kidō is cast with the free left hand; the releases (raise the blade:
// "Chire"; let it fall into the ground: Bankai) and the Bankai hand gestures that steer the blades
// are body keys.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease'], c?: KeyDef['c']): KeyDef => ({ t, b, hips, ease, c });

/** A copy of one of Ichigo's sword clips under a new name, played `k` times faster. */
function retime(src: string, name: string, k: number): ClipDef {
  const c = ICHIGO_CLIPS.find((x) => x.name === src)!;
  return {
    ...c,
    name,
    dur: c.dur / k,
    fadeIn: (c.fadeIn ?? 0.1) / k,
    fadeOut: (c.fadeOut ?? 0.2) / k,
    events: c.events ? Object.fromEntries(Object.entries(c.events).map(([e, t]) => [e, t / k])) : undefined,
    keys: c.keys.map((kd) => ({ ...kd, t: kd.t / k })),
  };
}

const IDLE: Record<string, E> = {
  hips: [0, -6, 0], spine: [1, 2, 0], chest: [0, 4, 0], neck: [0, 0, 0], head: [2, -2, 0],
  'thigh.L': [-5, 0, 4], 'shin.L': [5, 0, 0], 'foot.L': [0, 0, 0], 'thigh.R': [3, 0, -4], 'shin.R': [5, 0, 0],
  'upperarm.L': [4, 0, 7], 'forearm.L': [-12, 0, 0], 'hand.L': [4, 0, 0],
};

export const BYAKUYA_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.012,
  run: { chest: [6, 0, 0], 'upperarm.L': [-4, 0, 6] },
  sprint: { spine: [12, 0, 0], chest: [8, 0, 0], head: [-10, 0, 0], 'upperarm.L': [36, 0, 12], 'forearm.L': [-24, 0, 0] },
  swingL: 0.55,
  swingR: 0.2,
  grip: {
    // blade held low at his right, point forward and down
    idle: { p: [-0.25, -0.33, 0.14], dir: [-0.06, -0.62, 0.78], edge: [0.12, -0.78, -0.62], pole: [-0.55, -0.3, -0.8] },
    walk: { p: [-0.26, -0.32, 0.1], dir: [-0.1, -0.7, 0.7], edge: [0.1, -0.7, -0.7], pole: [-0.55, -0.3, -0.8] },
    run: { p: [-0.28, -0.26, -0.06], dir: [-0.22, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.28, -0.16, -0.16], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.36, -0.1, 0.1], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

/** Bankai: the hands are empty; he stands with them at rest and steers the blades with gestures. */
export const BYAKUYA_BANKAI_STANCE: StanceDef = {
  idle: { ...IDLE, 'upperarm.R': [4, 0, -7], 'forearm.R': [-12, 0, 0], 'hand.R': [4, 0, 0] },
  idleHips: -0.012,
  run: { chest: [6, 0, 0], 'upperarm.L': [-4, 0, 6], 'upperarm.R': [-4, 0, -6] },
  sprint: { spine: [12, 0, 0], chest: [8, 0, 0], head: [-10, 0, 0], 'upperarm.L': [36, 0, 12], 'forearm.L': [-24, 0, 0], 'upperarm.R': [36, 0, -12], 'forearm.R': [-24, 0, 0] },
  swingL: 0.55,
  swingR: 0.55,
};

// ------------------------------------------------------------------ Kidō with the left hand
const point: ClipDef = {
  name: 'by_point', dur: 0.75, fadeIn: 0.06, fadeOut: 0.22, events: { fire: 0.22 },
  keys: [
    key(0, { chest: [0, 4, 0], 'upperarm.L': [4, 0, 7], 'forearm.L': [-12, 0, 0] }),
    key(0.18, { chest: [0, -16, 0], spine: [0, -6, 0], head: [0, 14, 0], 'upperarm.L': [-88, 0, -8], 'forearm.L': [-4, 0, 0], 'hand.L': [0, 0, 0] }, [0, -0.01, 0], 'outExpo'),
    key(0.5, { chest: [0, -18, 0], spine: [0, -6, 0], head: [0, 14, 0], 'upperarm.L': [-90, 0, -8], 'forearm.L': [-2, 0, 0] }, [0, -0.01, 0], 'inOut'),
    key(0.75, { chest: [0, 4, 0], 'upperarm.L': [4, 0, 7], 'forearm.L': [-12, 0, 0] }, [0, -0.012, 0], 'inOut'),
  ],
};

const sokatsui: ClipDef = {
  name: 'by_sokatsui', dur: 0.9, fadeIn: 0.06, fadeOut: 0.25, events: { fire: 0.3 },
  keys: [
    key(0, { chest: [0, 4, 0], 'upperarm.L': [4, 0, 7], 'forearm.L': [-12, 0, 0] }),
    key(0.2, { chest: [-2, 10, 0], 'upperarm.L': [-30, 0, 20], 'forearm.L': [-110, 0, 0], 'hand.L': [-20, 0, 0] }, [0, -0.02, -0.02], 'out'),
    key(0.32, { chest: [4, -20, 0], spine: [2, -8, 0], head: [0, 16, 0], 'upperarm.L': [-90, 0, -4], 'forearm.L': [-6, 0, 0], 'hand.L': [-60, 0, 0] }, [0, -0.04, 0.06], 'outExpo'),
    key(0.6, { chest: [2, -18, 0], 'upperarm.L': [-88, 0, -4], 'forearm.L': [-8, 0, 0], 'hand.L': [-56, 0, 0] }, [0, -0.04, 0.05], 'inOut'),
    key(0.9, { chest: [0, 4, 0], 'upperarm.L': [4, 0, 7], 'forearm.L': [-12, 0, 0], 'hand.L': [4, 0, 0] }, [0, -0.012, 0], 'inOut'),
  ],
};

// ------------------------------------------------------------------ releases
/** "Chire, Senbonzakura": the blade raised upright before his face, then it scatters. */
const shikai: ClipDef = {
  name: 'by_shikai', dur: 1.3, fadeIn: 0.1, fadeOut: 0.3, events: { scatter: 0.62 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@gripR': [-0.25, -0.33, 0.14], '@dirR': [-0.06, -0.62, 0.78], '@edgeR': [0.12, -0.78, -0.62], '@poleR': [-0.55, -0.3, -0.8], '@ikR': [1, 0, 0] } },
      { t: 0.45, ease: 'out', c: { '@gripR': [-0.08, 0.08, 0.34], '@dirR': [0.05, 0.98, 0.15], '@edgeR': [0, 0.1, -1], '@poleR': [-0.7, -0.5, -0.3], '@ikR': [1, 0, 0] } },
      { t: 1.0, ease: 'inOut', c: { '@gripR': [-0.08, 0.1, 0.34], '@dirR': [0.05, 0.98, 0.15], '@edgeR': [0, 0.1, -1], '@poleR': [-0.7, -0.5, -0.3], '@ikR': [1, 0, 0] } },
      { t: 1.3, ease: 'inOut', c: { '@gripR': [-0.25, -0.33, 0.14], '@dirR': [-0.06, -0.62, 0.78], '@edgeR': [0.12, -0.78, -0.62], '@poleR': [-0.55, -0.3, -0.8], '@ikR': [1, 0, 0] } },
    ],
    [
      key(0, { head: [2, -2, 0] }),
      key(0.45, { head: [6, 0, 0], chest: [0, 2, 0] }, [0, -0.01, 0], 'out'),
      key(1.3, { head: [2, -2, 0], chest: [0, 4, 0] }, [0, -0.012, 0], 'inOut'),
    ],
  ),
};

/** Bankai: the sword held point-down at arm's length is let go; it sinks into the ground. */
const bankai: ClipDef = {
  name: 'by_bankai', dur: 2.6, fadeIn: 0.12, fadeOut: 0.4, events: { drop: 0.7, rise: 1.0, shatter: 2.0 },
  keys: mergeKeys(
    [
      { t: 0, c: { '@gripR': [-0.25, -0.33, 0.14], '@dirR': [-0.06, -0.62, 0.78], '@edgeR': [0.12, -0.78, -0.62], '@poleR': [-0.55, -0.3, -0.8], '@ikR': [1, 0, 0] } },
      { t: 0.55, ease: 'out', c: { '@gripR': [-0.05, -0.12, 0.4], '@dirR': [0, -1, 0.02], '@edgeR': [0, 0, -1], '@poleR': [-0.7, -0.3, -0.4], '@ikR': [1, 0, 0] } },
      { t: 0.75, ease: 'linear', c: { '@gripR': [-0.05, -0.12, 0.4], '@dirR': [0, -1, 0.02], '@edgeR': [0, 0, -1], '@poleR': [-0.7, -0.3, -0.4], '@ikR': [0, 0, 0] } },
    ],
    [
      key(0, { head: [2, -2, 0] }),
      key(0.55, { head: [8, 0, 0], chest: [2, 2, 0] }, [0, -0.01, 0], 'out'),
      key(0.9, { head: [10, 0, 0], chest: [2, 2, 0], 'upperarm.R': [-30, 0, -6], 'forearm.R': [-30, 0, 0], 'hand.R': [10, 0, 0] }, [0, -0.012, 0], 'inOut'),
      key(2.6, { head: [2, -2, 0], chest: [0, 4, 0], 'upperarm.R': [4, 0, -7], 'forearm.R': [-12, 0, 0] }, [0, -0.012, 0], 'inOut'),
    ],
  ),
};

// ------------------------------------------------------------------ Bankai gestures
/** Right hand sweeps across, left to right: a wave of blades follows it. */
const wave1: ClipDef = {
  name: 'by_wave1', dur: 0.62, fadeIn: 0.05, fadeOut: 0.2, events: { cast: 0.2, combo: 0.32 },
  keys: [
    key(0, { chest: [0, 4, 0], 'upperarm.R': [4, 0, -7], 'forearm.R': [-12, 0, 0] }),
    key(0.12, { chest: [0, 20, 0], spine: [0, 8, 0], 'upperarm.R': [-62, 0, 34], 'forearm.R': [-40, 0, 0], 'hand.R': [0, 0, 0] }, [0, -0.01, 0], 'out'),
    key(0.22, { chest: [2, -22, 0], spine: [0, -10, 0], head: [0, 8, 0], 'upperarm.R': [-74, 0, -62], 'forearm.R': [-10, 0, 0], 'hand.R': [0, 0, -20] }, [0, -0.02, 0.03], 'outExpo'),
    key(0.62, { chest: [0, 4, 0], 'upperarm.R': [4, 0, -7], 'forearm.R': [-12, 0, 0], 'hand.R': [4, 0, 0] }, [0, -0.012, 0], 'inOut'),
  ],
};

/** Left hand thrust forward. */
const wave2: ClipDef = {
  name: 'by_wave2', dur: 0.62, fadeIn: 0.05, fadeOut: 0.2, events: { cast: 0.2, combo: 0.32 },
  keys: [
    key(0, { chest: [0, 4, 0], 'upperarm.L': [4, 0, 7], 'forearm.L': [-12, 0, 0] }),
    key(0.12, { chest: [0, -12, 0], 'upperarm.L': [-40, 0, 30], 'forearm.L': [-90, 0, 0] }, [0, -0.01, -0.02], 'out'),
    key(0.22, { chest: [2, 18, 0], spine: [0, 8, 0], head: [0, -10, 0], 'upperarm.L': [-88, 0, -6], 'forearm.L': [-4, 0, 0], 'hand.L': [-50, 0, 0] }, [0, -0.02, 0.04], 'outExpo'),
    key(0.62, { chest: [0, 4, 0], 'upperarm.L': [4, 0, 7], 'forearm.L': [-12, 0, 0], 'hand.L': [4, 0, 0] }, [0, -0.012, 0], 'inOut'),
  ],
};

/** Both arms sweep out: the grand wave. */
const push: ClipDef = {
  name: 'by_push', dur: 1.1, fadeIn: 0.08, fadeOut: 0.3, events: { cast: 0.38 },
  keys: [
    key(0, { chest: [0, 4, 0] }),
    key(0.28, { chest: [-6, 0, 0], spine: [-4, 0, 0], 'upperarm.L': [-60, 0, -30], 'forearm.L': [-90, 0, 0], 'upperarm.R': [-60, 0, 30], 'forearm.R': [-90, 0, 0] }, [0, -0.02, -0.03], 'out'),
    key(0.4, { chest: [6, 0, 0], spine: [4, 0, 0], head: [-4, 0, 0], 'upperarm.L': [-80, 0, 50], 'forearm.L': [-6, 0, 0], 'upperarm.R': [-80, 0, -50], 'forearm.R': [-6, 0, 0] }, [0, -0.04, 0.06], 'outExpo'),
    key(0.8, { chest: [4, 0, 0], 'upperarm.L': [-74, 0, 46], 'forearm.L': [-8, 0, 0], 'upperarm.R': [-74, 0, -46], 'forearm.R': [-8, 0, 0] }, [0, -0.04, 0.05], 'inOut'),
    key(1.1, { chest: [0, 4, 0], 'upperarm.L': [4, 0, 7], 'forearm.L': [-12, 0, 0], 'upperarm.R': [4, 0, -7], 'forearm.R': [-12, 0, 0] }, [0, -0.012, 0], 'inOut'),
  ],
};

/** Left hand raised: the swords turn on the target (Gōkei, Senkei, Ikka Senjinka). */
const raise: ClipDef = {
  name: 'by_raise', dur: 1.2, fadeIn: 0.08, fadeOut: 0.3, events: { cast: 0.35 },
  keys: [
    key(0, { chest: [0, 4, 0], 'upperarm.L': [4, 0, 7], 'forearm.L': [-12, 0, 0] }),
    key(0.32, { chest: [-4, -10, 0], head: [-6, 10, 0], 'upperarm.L': [-150, 0, 10], 'forearm.L': [-14, 0, 0], 'hand.L': [-10, 0, 0] }, [0, -0.01, 0], 'outExpo'),
    key(0.9, { chest: [-4, -10, 0], head: [-6, 10, 0], 'upperarm.L': [-152, 0, 10], 'forearm.L': [-12, 0, 0] }, [0, -0.01, 0], 'inOut'),
    key(1.2, { chest: [0, 4, 0], head: [2, -2, 0], 'upperarm.L': [4, 0, 7], 'forearm.L': [-12, 0, 0], 'hand.L': [4, 0, 0] }, [0, -0.012, 0], 'inOut'),
  ],
};

/** Shūkei: Hakuteiken — the white sword raised, then one great diagonal cut. */
const hakuteiken: ClipDef = retime('slash3', 'by_hakuteiken', 0.8);

export const BYAKUYA_CLIPS: ClipDef[] = [
  retime('slash1', 'by_slash1', 1.15), retime('slash2', 'by_slash2', 1.15), retime('slash4', 'by_slash3', 1.1), retime('slash3', 'by_cleave', 1.05),
  retime('slash1', 'by_hilt1', 1.35), retime('slash2', 'by_hilt2', 1.35),
  point, sokatsui, shikai, bankai, wave1, wave2, push, raise, hakuteiken,
  ...ICHIGO_CLIPS.filter((c) => c.name === 'dash' || c.name === 'airstep' || c.name === 'hit_heavy'),
];

export const BYAKUYA_CHAIN = ['by_slash1', 'by_slash2', 'by_slash3'];
export const BYAKUYA_SHIKAI_CHAIN = ['by_hilt1', 'by_hilt2'];
export const BYAKUYA_BANKAI_CHAIN = ['by_wave1', 'by_wave2'];
