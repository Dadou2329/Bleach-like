// Hollow Ichigo's animation set (docs/roster/A1-ichigo.md §2): Ichigo's body and his cuts, a looser, hungrier
// stance — hunched, the head cocked, the blade trailing low — and the tether moves: the cleaver flung out and
// yanked back on its cloth, swung up over the head on it, whirled round above him like a lasso; the Bankai spun
// round his hand by its chain and hurled to impale, the chain hauled in; the bare-hand catch and the crush; the
// laugh; the claw at his own face as the Full Hollow takes him. Grip channels are in chest space (m, +X his left).
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys } from '../anim/swing';
import { ICHIGO_CLIPS, ICHIGO_STANCE } from './ichigoClips';

type C3 = [number, number, number];

/** IK channels for the sword hand: grip position, blade direction (normalised), the edge turned toward `ref`. */
function grip(p: C3, dir: C3, pole: C3, ref: C3 = [0, -1, 0]): Record<string, C3> {
  const l = Math.hypot(dir[0], dir[1], dir[2]) || 1;
  const d: C3 = [dir[0] / l, dir[1] / l, dir[2] / l];
  let k = ref[0] * d[0] + ref[1] * d[1] + ref[2] * d[2];
  let e: C3 = [ref[0] - d[0] * k, ref[1] - d[1] * k, ref[2] - d[2] * k];
  if (Math.hypot(e[0], e[1], e[2]) < 0.2) {
    k = d[2];
    e = [-d[0] * k, -d[1] * k, 1 - d[2] * k];
  }
  const el = Math.hypot(e[0], e[1], e[2]) || 1;
  e = [e[0] / el, e[1] / el, e[2] / el];
  return { '@gripR': p, '@dirR': d, '@edgeR': e, '@poleR': pole, '@ikR': [1, 0, 0] };
}

function body(t: number, b: KeyDef['b'], hips?: KeyDef['hips'], ease?: KeyDef['ease']): KeyDef {
  return { t, b, hips, ease };
}

const IDLE_B = {
  hips: [4, -16, 0], spine: [10, 6, 0], chest: [8, 10, -3], neck: [-4, 0, 0], head: [-6, -6, 12],
  'thigh.L': [-22, 0, 9], 'shin.L': [30, 0, 0], 'foot.L': [-6, 0, 0], 'thigh.R': [12, 0, -10], 'shin.R': [30, 0, 0], 'foot.R': [-14, 0, 0],
  'upperarm.L': [10, 6, 16], 'forearm.L': [-14, 0, 0], 'hand.L': [10, 0, 0],
} as NonNullable<KeyDef['b']>;
const IDLE_HIPS: C3 = [0, -0.07, 0];
const G_IDLE = { p: [-0.29, -0.38, 0.1] as C3, dir: [-0.25, -0.55, 0.8] as C3, edge: [0.1, -0.82, -0.56] as C3, pole: [-0.6, -0.3, -0.75] as C3 };
const GRIP_IDLE = { '@gripR': G_IDLE.p, '@dirR': G_IDLE.dir, '@edgeR': G_IDLE.edge, '@poleR': G_IDLE.pole, '@ikR': [1, 0, 0] as C3 };
/** the arm out in front holding the cloth or the chain (the blade gone from the hand) */
const OUT = grip([-0.15, 0.05, 0.5], [0.05, 0, 1], [-0.7, -0.6, 0]);

/** Hunched and loose: the knees deep, the head cocked, the left hand hanging, the blade trailing low. */
export const HOLLOW_ICHIGO_STANCE: StanceDef = {
  ...ICHIGO_STANCE,
  idle: IDLE_B,
  idleHips: -0.07,
  run: { 'upperarm.L': [-4, 0, 10], chest: [6, 4, 0], head: [-10, 0, 6] },
  grip: { ...ICHIGO_STANCE.grip, idle: G_IDLE, walk: { ...G_IDLE, p: [-0.3, -0.36, 0.06] } },
};

// ------------------------------------------------------------------ the cloth (Shikai)

// the cleaver flung sidearm on its cloth, the arm left out holding the cloth
const fling: ClipDef = {
  name: 'hi_fling', dur: 0.6, fadeIn: 0.05, fadeOut: 0.2,
  events: { step: 0.06, throw: 0.16 },
  keys: mergeKeys(
    [
      { t: 0, c: GRIP_IDLE },
      { t: 0.1, ease: 'out', c: grip([-0.42, 0, -0.18], [-0.5, 0.15, -0.85], [-0.8, -0.2, 0.3]) },
      { t: 0.16, ease: 'outExpo', c: grip([-0.16, 0.08, 0.52], [0.05, 0.05, 1], [-0.7, -0.6, 0]) },
      { t: 0.6, ease: 'out', c: OUT },
    ],
    [
      body(0, IDLE_B, IDLE_HIPS),
      body(0.1, { hips: [-4, -26, 0], spine: [-6, -16, 0], chest: [-8, -22, 0], head: [-4, 22, 4], 'thigh.L': [-26, 0, 8], 'shin.L': [26, 0, 0], 'thigh.R': [16, 0, -8], 'shin.R': [26, 0, 0], 'upperarm.L': [-40, 0, 20], 'forearm.L': [-30, 0, 0] }, [0, -0.05, -0.04], 'out'),
      body(0.16, { hips: [8, 18, 0], spine: [12, 14, 0], chest: [8, 20, 0], head: [-12, -18, 6], 'thigh.L': [-44, 0, 8], 'shin.L': [46, 0, 0], 'thigh.R': [24, 0, -8], 'shin.R': [26, 0, 0], 'upperarm.L': [14, 0, 36], 'forearm.L': [-26, 0, 0] }, [0, -0.1, 0.1], 'outExpo'),
      body(0.6, { hips: [6, 12, 0], spine: [10, 10, 0], chest: [6, 14, 0], head: [-10, -12, 8], 'thigh.L': [-40, 0, 8], 'shin.L': [42, 0, 0], 'thigh.R': [22, 0, -8], 'shin.R': [24, 0, 0], 'upperarm.L': [10, 0, 32], 'forearm.L': [-28, 0, 0] }, [0, -0.09, 0.09], 'out'),
    ],
    [{ t: 0, c: { '@look': [0.3, 0, 0] } }],
  ),
};

// the cloth hauled in and the blade caught out of the air, then back to the stance
const yank: ClipDef = {
  name: 'hi_yank', dur: 0.42, fadeIn: 0.04, fadeOut: 0.18,
  events: { catch: 0.14 },
  keys: mergeKeys(
    [
      { t: 0, c: OUT },
      { t: 0.14, ease: 'outExpo', c: grip([-0.32, 0.16, -0.04], [-0.25, 0.75, 0.6], [-0.8, -0.4, -0.3]) },
      { t: 0.42, ease: 'inOut', c: GRIP_IDLE },
    ],
    [
      body(0, { hips: [6, 12, 0], spine: [10, 10, 0], chest: [6, 14, 0], head: [-10, -12, 8], 'upperarm.L': [10, 0, 32], 'forearm.L': [-28, 0, 0] }, [0, -0.09, 0.09]),
      body(0.14, { hips: [-6, -18, 0], spine: [-8, -10, 0], chest: [-10, -14, 0], head: [-4, 14, 6], 'thigh.L': [-22, 0, 8], 'shin.L': [22, 0, 0], 'thigh.R': [20, 0, -8], 'shin.R': [30, 0, 0], 'upperarm.L': [-10, 0, 30], 'forearm.L': [-30, 0, 0] }, [0, -0.06, -0.06], 'outExpo'),
      body(0.42, IDLE_B, IDLE_HIPS, 'inOut'),
    ],
  ),
};

// the cleaver swung on its cloth from low behind, up through a big arc over the front: a launcher
const upswing: ClipDef = {
  name: 'hi_upswing', dur: 0.62, fadeIn: 0.05, fadeOut: 0.2,
  events: { step: 0.04, swing: 0.1, hit: 0.24 },
  keys: mergeKeys(
    [
      { t: 0, c: GRIP_IDLE },
      { t: 0.1, ease: 'out', c: grip([-0.34, -0.42, -0.22], [-0.3, -0.75, -0.6], [-0.8, -0.2, 0.4]) },
      { t: 0.24, ease: 'outExpo', c: grip([-0.14, 0.42, 0.32], [0.05, 0.85, 0.5], [-0.8, -0.4, -0.3], [0, 0, 1]) },
      { t: 0.62, ease: 'inOut', c: GRIP_IDLE },
    ],
    [
      body(0, IDLE_B, IDLE_HIPS),
      body(0.1, { hips: [10, -10, 0], spine: [14, -6, 0], chest: [10, -10, 0], head: [-10, 8, 6], 'thigh.L': [-34, 0, 8], 'shin.L': [52, 0, 0], 'thigh.R': [18, 0, -8], 'shin.R': [44, 0, 0], 'upperarm.L': [10, 0, 30] }, [0, -0.13, -0.02], 'out'),
      body(0.24, { hips: [-8, 8, 0], spine: [-14, 6, 0], chest: [-16, 10, 0], head: [-14, 0, 4], 'thigh.L': [-20, 0, 8], 'shin.L': [16, 0, 0], 'thigh.R': [10, 0, -8], 'shin.R': [12, 0, 0], 'upperarm.L': [20, 0, 40], 'forearm.L': [-16, 0, 0] }, [0, 0.03, 0.06], 'outExpo'),
      body(0.62, IDLE_B, IDLE_HIPS, 'inOut'),
    ],
    [{ t: 0, c: { '@look': [0.2, 0, 0] } }],
  ),
};

/** a loop of the hand circling at `c` (radius r) in the plane of u and v, starting along u */
function circle(c: C3, r: number, u: C3, v: C3, dur: number, dirOut: (a: number) => C3, pole: C3): KeyDef[] {
  const out: KeyDef[] = [];
  for (let i = 0; i <= 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    const p: C3 = [c[0] + r * (ca * u[0] + sa * v[0]), c[1] + r * (ca * u[1] + sa * v[1]), c[2] + r * (ca * u[2] + sa * v[2])];
    out.push({ t: (i / 8) * dur, ease: 'linear', c: grip(p, dirOut(a), pole) });
  }
  return out;
}

// the lasso: the hand circling over his head, the blade whirling round him on the cloth
const WHIRL_DUR = 0.36;
const whirl: ClipDef = {
  name: 'hi_whirl', dur: WHIRL_DUR, loop: true, fadeIn: 0.08, fadeOut: 0.2, tension: 1,
  keys: mergeKeys(
    circle([-0.12, 0.5, 0.06], 0.09, [0, 0, 1], [-1, 0, 0], WHIRL_DUR, (a) => [-Math.sin(a), 0.35, Math.cos(a)], [-0.8, -0.3, 0]),
    [
      body(0, { hips: [0, -6, 0], spine: [-6, 0, 0], chest: [-8, 4, 0], head: [-10, -4, 8], 'thigh.L': [-20, 0, 10], 'shin.L': [26, 0, 0], 'thigh.R': [14, 0, -10], 'shin.R': [26, 0, 0], 'upperarm.L': [10, 0, 42], 'forearm.L': [-20, 0, 0] }, [0, -0.06, 0]),
      body(WHIRL_DUR / 2, { hips: [0, 6, 0], spine: [-6, 4, 0], chest: [-8, 6, 0], head: [-10, -6, 8], 'thigh.L': [-20, 0, 10], 'shin.L': [26, 0, 0], 'thigh.R': [14, 0, -10], 'shin.R': [26, 0, 0], 'upperarm.L': [10, 0, 46], 'forearm.L': [-20, 0, 0] }, [0, -0.07, 0], 'inOut'),
      body(WHIRL_DUR, { hips: [0, -6, 0], spine: [-6, 0, 0], chest: [-8, 4, 0], head: [-10, -4, 8], 'thigh.L': [-20, 0, 10], 'shin.L': [26, 0, 0], 'thigh.R': [14, 0, -10], 'shin.R': [26, 0, 0], 'upperarm.L': [10, 0, 42], 'forearm.L': [-20, 0, 0] }, [0, -0.06, 0], 'inOut'),
    ],
  ),
};

// ------------------------------------------------------------------ the chain (Bankai)

// Tensa Zangetsu spun round his hand by the chain, the arm out to the right at shoulder height
const TWIRL_DUR = 0.3;
const twirl: ClipDef = {
  name: 'hi_twirl', dur: TWIRL_DUR, loop: true, fadeIn: 0.08, fadeOut: 0.15, tension: 1,
  keys: mergeKeys(
    circle([-0.4, 0.1, 0.28], 0.05, [0, 0, 1], [0, 1, 0], TWIRL_DUR, () => [-0.3, 0, 0.95], [-0.8, -0.5, 0]),
    [
      body(0, { hips: [0, -10, 0], spine: [2, -6, 0], chest: [0, -8, 0], head: [-8, 12, 10], 'thigh.L': [-18, 0, 9], 'shin.L': [24, 0, 0], 'thigh.R': [12, 0, -10], 'shin.R': [24, 0, 0], 'upperarm.L': [6, 0, 18], 'forearm.L': [-20, 0, 0] }, [0, -0.05, 0]),
      body(TWIRL_DUR, { hips: [0, -10, 0], spine: [2, -6, 0], chest: [0, -8, 0], head: [-8, 12, 10], 'thigh.L': [-18, 0, 9], 'shin.L': [24, 0, 0], 'thigh.R': [12, 0, -10], 'shin.R': [24, 0, 0], 'upperarm.L': [6, 0, 18], 'forearm.L': [-20, 0, 0] }, [0, -0.05, 0]),
    ],
  ),
};

// out of the spin, the blade hurled point-first; the arm stays out on the chain
const toss: ClipDef = {
  name: 'hi_toss', dur: 0.55, fadeIn: 0.04, fadeOut: 0.2,
  events: { step: 0.03, throw: 0.12 },
  keys: mergeKeys(
    [
      { t: 0, c: grip([-0.4, 0.12, 0.3], [-0.3, 0, 0.95], [-0.8, -0.5, 0]) },
      { t: 0.07, ease: 'out', c: grip([-0.44, 0.28, -0.06], [-0.4, 0.6, -0.7], [-0.8, -0.3, 0.3]) },
      { t: 0.12, ease: 'outExpo', c: grip([-0.12, 0.12, 0.6], [0.05, 0, 1], [-0.7, -0.6, 0]) },
      { t: 0.55, ease: 'out', c: grip([-0.12, 0.1, 0.58], [0.05, 0, 1], [-0.7, -0.6, 0]) },
    ],
    [
      body(0, { hips: [0, -10, 0], spine: [2, -6, 0], chest: [0, -8, 0], head: [-8, 12, 10] }, [0, -0.05, 0]),
      body(0.07, { hips: [-6, -28, 0], spine: [-10, -18, 0], chest: [-12, -24, 0], head: [-4, 24, 4], 'thigh.L': [-30, 0, 8], 'shin.L': [26, 0, 0], 'thigh.R': [16, 0, -8], 'shin.R': [26, 0, 0], 'upperarm.L': [-50, 0, 20], 'forearm.L': [-20, 0, 0] }, [0, -0.04, -0.06], 'out'),
      body(0.12, { hips: [10, 18, 0], spine: [16, 14, 0], chest: [10, 20, 0], head: [-14, -16, 6], 'thigh.L': [-50, 0, 8], 'shin.L': [52, 0, 0], 'thigh.R': [28, 0, -8], 'shin.R': [28, 0, 0], 'upperarm.L': [10, 0, 40], 'forearm.L': [-30, 0, 0] }, [0, -0.11, 0.13], 'outExpo'),
      body(0.55, { hips: [8, 12, 0], spine: [12, 10, 0], chest: [8, 14, 0], head: [-12, -12, 8], 'thigh.L': [-44, 0, 8], 'shin.L': [46, 0, 0], 'thigh.R': [24, 0, -8], 'shin.R': [26, 0, 0], 'upperarm.L': [8, 0, 34], 'forearm.L': [-30, 0, 0] }, [0, -0.1, 0.11], 'out'),
    ],
    [{ t: 0, c: { '@look': [0.4, 0, 0] } }],
  ),
};

// the chain hauled in two-handed, leaning back: whatever is on the end comes with it
const reel: ClipDef = {
  name: 'hi_reel', dur: 0.55, fadeIn: 0.04, fadeOut: 0.2,
  events: { yank: 0.12 },
  keys: mergeKeys(
    [
      { t: 0, c: grip([-0.12, 0.1, 0.58], [0.05, 0, 1], [-0.7, -0.6, 0]) },
      { t: 0.12, ease: 'outExpo', c: grip([-0.3, -0.24, -0.1], [-0.2, -0.4, 0.9], [-0.7, -0.3, -0.6]) },
      { t: 0.55, ease: 'inOut', c: GRIP_IDLE },
    ],
    [
      body(0, { hips: [8, 12, 0], spine: [12, 10, 0], chest: [8, 14, 0], head: [-12, -12, 8], 'upperarm.L': [8, 0, 34], 'forearm.L': [-30, 0, 0] }, [0, -0.1, 0.11]),
      body(0.12, { hips: [-8, -24, 0], spine: [-14, -14, 0], chest: [-16, -18, 0], head: [-8, 16, 6], 'thigh.L': [-30, 0, 8], 'shin.L': [20, 0, 0], 'thigh.R': [24, 0, -8], 'shin.R': [30, 0, 0], 'upperarm.L': [-50, 0, 10], 'forearm.L': [-60, 0, 0] }, [0, -0.08, -0.1], 'outExpo'),
      body(0.55, IDLE_B, IDLE_HIPS, 'inOut'),
    ],
  ),
};

// ------------------------------------------------------------------ bare hands

// the left hand thrust out open at face height, the blade low and loose in the right
const catchClip: ClipDef = {
  name: 'hi_catch', dur: 0.75, fadeIn: 0.04, fadeOut: 0.2,
  events: { open: 0.08 },
  keys: mergeKeys(
    [{ t: 0, c: GRIP_IDLE }, { t: 0.75, c: GRIP_IDLE }],
    [
      body(0, IDLE_B, IDLE_HIPS),
      body(0.08, { hips: [0, 10, 0], spine: [-4, 10, 0], chest: [-6, 14, 0], neck: [-2, 0, 0], head: [-4, -6, 10], 'thigh.L': [-28, 0, 9], 'shin.L': [30, 0, 0], 'thigh.R': [18, 0, -10], 'shin.R': [34, 0, 0], 'upperarm.L': [-84, -10, -6], 'forearm.L': [-12, 0, 0], 'hand.L': [-12, 0, 0] }, [0, -0.06, 0.02], 'outExpo'),
      body(0.5, { hips: [0, 10, 0], spine: [-4, 10, 0], chest: [-6, 14, 0], neck: [-2, 0, 0], head: [-4, -6, 12], 'thigh.L': [-28, 0, 9], 'shin.L': [30, 0, 0], 'thigh.R': [18, 0, -10], 'shin.R': [34, 0, 0], 'upperarm.L': [-82, -10, -6], 'forearm.L': [-14, 0, 0], 'hand.L': [-12, 0, 0] }, [0, -0.06, 0.02], 'inOut'),
      body(0.75, IDLE_B, IDLE_HIPS, 'inOut'),
    ],
  ),
};

// the caught blade crushed in the fist: a twist, the face pushed in close, grinning
const grab: ClipDef = {
  name: 'hi_grab', dur: 0.5, fadeIn: 0.03, fadeOut: 0.18,
  events: { crush: 0.14 },
  keys: mergeKeys(
    [{ t: 0, c: GRIP_IDLE }, { t: 0.5, c: GRIP_IDLE }],
    [
      body(0, { hips: [0, 10, 0], spine: [-4, 10, 0], chest: [-6, 14, 0], head: [-4, -6, 12], 'upperarm.L': [-82, -10, -6], 'forearm.L': [-14, 0, 0], 'hand.L': [-12, 0, 0] }, [0, -0.06, 0.02]),
      body(0.14, { hips: [6, 14, 0], spine: [8, 12, 0], chest: [6, 16, 0], head: [-10, -10, 16], 'thigh.L': [-34, 0, 9], 'shin.L': [36, 0, 0], 'upperarm.L': [-74, -16, -4], 'forearm.L': [-24, 0, -10], 'hand.L': [-20, 0, -40] }, [0, -0.08, 0.06], 'outExpo'),
      body(0.5, { hips: [6, 14, 0], spine: [8, 12, 0], chest: [6, 16, 0], head: [-10, -10, 16], 'thigh.L': [-34, 0, 9], 'shin.L': [36, 0, 0], 'upperarm.L': [-70, -16, -4], 'forearm.L': [-26, 0, -10], 'hand.L': [-20, 0, -40] }, [0, -0.08, 0.06], 'inOut'),
    ],
  ),
};

// the laugh: the head thrown back, the shoulders shaking, the blade hanging from a loose hand
const laugh: ClipDef = {
  name: 'hi_laugh', dur: 1.6, fadeIn: 0.12, fadeOut: 0.3,
  events: { laugh: 0.2 },
  keys: mergeKeys(
    [{ t: 0, c: GRIP_IDLE }, { t: 0.3, ease: 'inOut', c: grip([-0.3, -0.44, 0.02], [-0.3, -0.85, 0.42], [-0.6, -0.3, -0.75]) }, { t: 1.6, ease: 'inOut', c: GRIP_IDLE }],
    [
      body(0, IDLE_B, IDLE_HIPS),
      body(0.25, { hips: [-4, -10, 0], spine: [-6, 0, 0], chest: [-10, 4, 0], neck: [-12, 0, 0], head: [-28, 0, 6], 'upperarm.L': [6, 0, 30], 'forearm.L': [-10, 0, 0] }, [0, -0.04, 0], 'out'),
      body(0.42, { hips: [-4, -10, 0], spine: [-4, 0, 0], chest: [-6, 4, 0], neck: [-10, 0, 0], head: [-22, 0, 4], 'upperarm.L': [6, 0, 26], 'forearm.L': [-10, 0, 0] }, [0, -0.05, 0], 'inOut'),
      body(0.58, { hips: [-4, -10, 0], spine: [-6, 0, 0], chest: [-12, 4, 0], neck: [-12, 0, 0], head: [-30, 0, 8], 'upperarm.L': [6, 0, 32], 'forearm.L': [-10, 0, 0] }, [0, -0.04, 0], 'inOut'),
      body(0.74, { hips: [-4, -10, 0], spine: [-4, 0, 0], chest: [-6, 4, 0], neck: [-10, 0, 0], head: [-22, 0, 4], 'upperarm.L': [6, 0, 26], 'forearm.L': [-10, 0, 0] }, [0, -0.05, 0], 'inOut'),
      body(0.9, { hips: [-4, -10, 0], spine: [-6, 0, 0], chest: [-12, 4, 0], neck: [-12, 0, 0], head: [-30, 0, 8], 'upperarm.L': [6, 0, 32], 'forearm.L': [-10, 0, 0] }, [0, -0.04, 0], 'inOut'),
      body(1.1, { hips: [4, -14, 0], spine: [12, 4, 0], chest: [10, 8, 0], neck: [-4, 0, 0], head: [-10, -6, 14], 'upperarm.L': [10, 6, 16], 'forearm.L': [-14, 0, 0] }, [0, -0.07, 0], 'inOut'),
      body(1.6, IDLE_B, IDLE_HIPS, 'inOut'),
    ],
  ),
};

// the Full Hollow takes him: doubled over, both hands clawing at his face, then thrown open
const rise: ClipDef = {
  name: 'hi_rise', dur: 1.3, fadeIn: 0.06, fadeOut: 0.25,
  events: { claw: 0.2, burst: 0.85 },
  keys: mergeKeys(
    [
      { t: 0, c: GRIP_IDLE },
      { t: 0.3, ease: 'out', c: grip([-0.1, 0.3, 0.2], [0.2, 0.9, 0.3], [-0.8, -0.5, -0.2], [0, 0, 1]) },
      { t: 0.8, ease: 'inOut', c: grip([-0.08, 0.28, 0.2], [0.2, 0.9, 0.3], [-0.8, -0.5, -0.2], [0, 0, 1]) },
      { t: 0.95, ease: 'outExpo', c: grip([-0.5, 0.1, 0.1], [-0.9, 0.2, 0.3], [-0.6, -0.6, -0.4]) },
      { t: 1.3, ease: 'inOut', c: GRIP_IDLE },
    ],
    [
      body(0, IDLE_B, IDLE_HIPS),
      body(0.3, { hips: [16, 0, 0], spine: [24, 0, 0], chest: [20, 0, 0], neck: [10, 0, 0], head: [20, 0, 0], 'thigh.L': [-42, 0, 8], 'shin.L': [62, 0, 0], 'thigh.R': [2, 0, -8], 'shin.R': [56, 0, 0], 'upperarm.L': [-128, 20, -30], 'forearm.L': [-112, 0, 0], 'hand.L': [-10, 0, 0] }, [0, -0.2, 0], 'out'),
      body(0.8, { hips: [18, 0, 0], spine: [26, 0, 6], chest: [22, 0, -6], neck: [12, 0, 0], head: [22, 0, 6], 'thigh.L': [-44, 0, 8], 'shin.L': [64, 0, 0], 'thigh.R': [0, 0, -8], 'shin.R': [58, 0, 0], 'upperarm.L': [-130, 20, -32], 'forearm.L': [-114, 0, 0], 'hand.L': [-10, 0, 0] }, [0, -0.21, 0], 'inOut'),
      body(0.95, { hips: [-8, 0, 0], spine: [-14, 0, 0], chest: [-18, 0, 0], neck: [-10, 0, 0], head: [-20, 0, 0], 'thigh.L': [-24, 0, 12], 'shin.L': [26, 0, 0], 'thigh.R': [14, 0, -12], 'shin.R': [26, 0, 0], 'upperarm.L': [0, 0, 64], 'forearm.L': [-16, 0, 0], 'hand.L': [0, 0, 0] }, [0, -0.06, 0], 'outExpo'),
      body(1.3, IDLE_B, IDLE_HIPS, 'inOut'),
    ],
  ),
};

/** Ichigo's cuts and specials (the clips Hollow Ichigo shares with him) plus his own. */
export const HOLLOW_ICHIGO_CLIPS: ClipDef[] = [...ICHIGO_CLIPS, fling, yank, upswing, whirl, twirl, toss, reel, catchClip, grab, laugh, rise];
/** the bare-hand catch works in the Full Hollow body too */
export const HOLLOW_ICHIGO_EXTRA_VASTO: ClipDef[] = [catchClip, grab];
