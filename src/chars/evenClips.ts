// Even's animation set (docs/kits/even.md). On foot (sealed, Shikai, Bankai): tall and easy, the weight on one leg,
// the left hand on his hip (as in the photos), the blade low in the right hand; the left hand comes off the hip for
// every Kidō. The string: a thrust, two diagonal cuts, a turning level cut, a rising cut. Skills: two fingers at the
// target (Byakurai), the palm and the point together (Sōren Sōkatsui), the open palm raised (Dankū), the hand closed
// on the seals (Kuyō Shibari), the coffin pressed shut, the glasses pushed up with one finger (the opener and the
// releases), "Utsuse" with the blade turned flat before his face to catch the light, the wide cut through the lens,
// the prism raised in the left hand, the blade held upright as a mirror, the blade raised at the sun, the flash, the
// Bankai with the blade driven point-down into the ground, the stab into the water, the hand swept over it to call the
// reflections up, the dive into the mirror, the cage of fingers and the thrust, the wave lifted from low to high, and
// "Kaigen" with the hand over the glasses, then the arms opening as he rises.
// Final form (floating): the legs relaxed, six cuts of light, the iai of Issen, the photographer's frame of the
// kaleidoscope, the blade raised to the sun, the open palm of the rebellion, the blade held upright before the chest
// for the judgment.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type C3 = [number, number, number];
type B = NonNullable<KeyDef['b']>;

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
const body = (t: number, b: B, hips?: KeyDef['hips'], ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });
const ch = (t: number, c: Record<string, C3>, ease?: KeyDef['ease']): KeyDef => ({ t, ease, c });

const SHARED = ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name));

// ================================================================== stances

/** the left hand on his hip */
const HIP_HAND: B = { 'upperarm.L': [25, 0, 45], 'forearm.L': [-90, 0, -60], 'hand.L': [0, 0, 15] };
const IDLE: B = {
  // tall and easy, the weight on the right leg, the left knee loose, the head tipped a little: a grin on the way
  hips: [0, 8, -3], spine: [-2, -2, 2], chest: [-2, -5, 1], neck: [2, 0, 0], head: [-3, 6, -4],
  'thigh.L': [-6, 0, 4], 'shin.L': [10, 0, 0], 'foot.L': [-3, 0, -2], 'thigh.R': [3, 0, -5], 'shin.R': [5, 0, 0], 'foot.R': [-3, 0, 3],
  ...HIP_HAND,
};
const R = (over: B = {}): B => ({ ...IDLE, ...over });
const HIPS: C3 = [0, -0.012, 0];
/** the blade low in the right hand, its point forward and down */
const G = { p: [-0.26, -0.33, 0.14] as C3, dir: [-0.12, -0.45, 0.88] as C3, pole: [-0.6, -0.3, -0.75] as C3 };
const SG = grip(G.p, G.dir, G.pole);
/** the left arm off the hip, hanging free (for the casts) */
const FREE: B = { 'upperarm.L': [-6, 0, 10], 'forearm.L': [-24, 0, 0], 'hand.L': [0, 0, 0] };

export const EVEN_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.012,
  run: { spine: [10, 0, 0], chest: [4, 0, 0], head: [-8, 0, 0], 'upperarm.L': [14, 0, 12], 'forearm.L': [-34, 0, 0], 'hand.L': [0, 0, 0] },
  sprint: { spine: [18, 0, 0], chest: [8, 0, 0], head: [-12, 0, 0], 'upperarm.L': [40, 0, 14], 'forearm.L': [-28, 0, 0], 'hand.L': [0, 0, 0] },
  swingL: 0.35,
  swingR: 0.12,
  freqScale: 0.98,
  grip: {
    idle: { p: G.p, dir: G.dir, edge: [0, -0.88, -0.47], pole: G.pole },
    walk: { p: [-0.27, -0.32, 0.12], dir: [-0.12, -0.47, 0.87], edge: [0, -0.88, -0.48], pole: G.pole },
    run: { p: [-0.28, -0.22, -0.08], dir: [-0.2, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.28, -0.14, -0.16], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.34, -0.08, 0.08], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

/** the final form floats: the legs relaxed, one knee bent, the toes down; the left hand open at his side */
const FLOAT: B = {
  hips: [0, -4, 0], spine: [-2, 2, 0], chest: [-3, 2, 0], neck: [0, 0, 0], head: [-4, -2, 2],
  'thigh.L': [-14, 0, 4], 'shin.L': [34, 0, 0], 'foot.L': [30, 0, -2], 'thigh.R': [-2, 0, -3], 'shin.R': [10, 0, 0], 'foot.R': [34, 0, 2],
  'upperarm.L': [-12, 0, 26], 'forearm.L': [-22, 0, 0], 'hand.L': [10, 0, 12],
};
const F = (over: B = {}): B => ({ ...FLOAT, ...over });
const FG = { p: [-0.38, -0.24, 0.1] as C3, dir: [-0.45, -0.5, 0.74] as C3, pole: [-0.7, -0.2, -0.6] as C3 };
const FSG = grip(FG.p, FG.dir, FG.pole);
const FLEGS: B = { 'thigh.L': FLOAT['thigh.L'], 'shin.L': FLOAT['shin.L'], 'foot.L': FLOAT['foot.L'], 'thigh.R': FLOAT['thigh.R'], 'shin.R': FLOAT['shin.R'], 'foot.R': FLOAT['foot.R'] };

export const EVEN_FINAL_STANCE: StanceDef = {
  idle: FLOAT,
  idleHips: 0,
  run: { spine: [16, 0, 0], chest: [6, 0, 0], head: [-14, 0, 0], 'upperarm.L': [34, 0, 24], 'forearm.L': [-10, 0, 0] },
  sprint: { spine: [26, 0, 0], chest: [10, 0, 0], head: [-20, 0, 0], 'upperarm.L': [50, 0, 26], 'forearm.L': [-6, 0, 0] },
  swingL: 0.2,
  swingR: 0.05,
  grip: {
    idle: { p: FG.p, dir: FG.dir, edge: [0, -0.83, -0.56], pole: FG.pole },
    walk: { p: FG.p, dir: FG.dir, edge: [0, -0.83, -0.56], pole: FG.pole },
    run: { p: [-0.3, -0.18, -0.12], dir: [-0.3, -0.2, -0.93], edge: [0, -0.98, 0.2], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.3, -0.12, -0.18], dir: [-0.25, -0.05, -0.97], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: FG.p, dir: FG.dir, edge: [0, -0.83, -0.56], pole: FG.pole },
  },
};

/** held under everything in the final form: only the legs (the gait never walks him in the air), a slow sway */
const float: ClipDef = {
  name: 'ef_float', dur: 3.4, loop: true, fadeIn: 0.3, fadeOut: 0.3,
  keys: [
    body(0, FLEGS),
    body(1.7, { ...FLEGS, 'thigh.L': [-18, 0, 5], 'shin.L': [38, 0, 0], 'thigh.R': [0, 0, -3], 'shin.R': [8, 0, 0] }, undefined, 'inOut'),
    body(3.4, FLEGS, undefined, 'inOut'),
  ],
};

// ================================================================== the string (on foot)

const thrust: ClipDef = {
  name: 'ev_s1', dur: 0.4, fadeIn: 0.04, fadeOut: 0.15,
  events: { step: 0.06, combo: 0.24 },
  keys: mergeKeys(
    [
      ch(0, SG),
      ch(0.08, grip([-0.2, -0.12, -0.06], [-0.05, -0.04, 1], [-0.7, -0.3, -0.6]), 'out'),
      ch(0.15, grip([-0.1, 0.04, 0.5], [-0.08, 0.02, 1], [-0.7, -0.3, -0.4]), 'outExpo'),
      ch(0.24, grip([-0.1, 0.02, 0.48], [-0.08, 0, 1], [-0.7, -0.3, -0.4])),
      ch(0.4, SG, 'inOut'),
    ],
    [
      body(0, R(), HIPS),
      body(0.08, R({ hips: [0, -18, 0], chest: [0, -8, 0], 'thigh.R': [12, 0, -6], 'shin.R': [18, 0, 0] }), [0, -0.04, -0.02], 'out'),
      body(0.15, R({ hips: [4, 6, 0], spine: [8, 2, 0], chest: [4, 2, 0], 'thigh.L': [-36, 0, 4], 'shin.L': [30, 0, 0], 'thigh.R': [22, 0, -6], 'shin.R': [16, 0, 0], 'upperarm.L': [20, 0, 34], 'forearm.L': [-20, 0, 0] }), [0, -0.08, 0.12], 'outExpo'),
      body(0.4, R(), HIPS, 'inOut'),
    ],
  ),
};

function cut(name: string, a: C3, keys: [number, number, 'out' | 'inOut'][], twist: number, o: { launch?: boolean; base?: (over?: B) => B; hips?: C3; grip?: Record<string, C3>; r?: number } = {}): ClipDef {
  const end = keys[keys.length - 1][0];
  const base = o.base ?? R;
  const H0 = o.hips ?? HIPS;
  return {
    name, dur: end, fadeIn: 0.04, fadeOut: 0.15,
    events: { step: 0.06, combo: keys[keys.length - 2][0] + 0.06 },
    keys: mergeKeys(
      swingKeys({ a, b: [0, 0, 1], c: [-0.04, 0.04, 0.1], r: o.r ?? 0.33, pole: [-0.7, -0.4, -0.5], keys }),
      [ch(end, o.grip ?? SG, 'inOut')],
      [
        body(0, base(), H0),
        body(keys[1][0], base({ hips: [0, -twist, 0], spine: [4, -twist * 0.4, 0], chest: [0, -twist * 0.6, 0] }), H0, 'out'),
        body(keys[2][0], base(o.launch
          ? { hips: [-6, twist, 0], spine: [-8, twist * 0.5, 0], chest: [-10, twist * 0.6, 0], 'upperarm.L': [10, 0, 44], 'forearm.L': [-20, 0, 0] }
          : { hips: [6, twist, 0], spine: [10, twist * 0.5, 0], chest: [6, twist * 0.7, 0], 'thigh.L': [-28, 0, 6], 'shin.L': [24, 0, 0], 'thigh.R': [16, 0, -8], 'shin.R': [18, 0, 0], 'upperarm.L': [10, 0, 44], 'forearm.L': [-20, 0, 0] }), [H0[0], H0[1] - 0.05, H0[2] + 0.07], 'out'),
        body(end, base(), H0, 'inOut'),
      ],
    ),
  };
}
const s2 = cut('ev_s2', [-0.7, 0.7, 0], [[0, 40, 'out'], [0.1, 0, 'out'], [0.2, 172, 'out'], [0.42, 140, 'inOut']], 24);
const s3 = cut('ev_s3', [0.7, 0.7, 0], [[0, 40, 'out'], [0.1, 0, 'out'], [0.2, 172, 'out'], [0.42, 140, 'inOut']], -24);
const s4 = cut('ev_s4', [-1, 0.05, 0], [[0, -10, 'out'], [0.1, -40, 'out'], [0.24, 200, 'out'], [0.5, 170, 'inOut']], 40);
const s5 = cut('ev_s5', [0.6, -0.8, 0], [[0, 30, 'out'], [0.1, 10, 'out'], [0.21, 174, 'out'], [0.5, 150, 'inOut']], 14, { launch: true });
s5.events = { step: 0.06 };

export const EVEN_CHAIN = ['ev_s1', 'ev_s2', 'ev_s3', 'ev_s4', 'ev_s5'];

// ================================================================== the string (floating)

const FH: C3 = [0, 0, 0];
const f1 = cut('ef_s1', [-0.7, 0.7, 0], [[0, 40, 'out'], [0.08, 0, 'out'], [0.17, 172, 'out'], [0.36, 140, 'inOut']], 22, { base: F, hips: FH, grip: FSG, r: 0.36 });
const f2 = cut('ef_s2', [0.7, 0.7, 0], [[0, 40, 'out'], [0.08, 0, 'out'], [0.17, 172, 'out'], [0.36, 140, 'inOut']], -22, { base: F, hips: FH, grip: FSG, r: 0.36 });
const f3 = cut('ef_s3', [-1, 0.05, 0], [[0, -10, 'out'], [0.08, -40, 'out'], [0.2, 200, 'out'], [0.42, 170, 'inOut']], 44, { base: F, hips: FH, grip: FSG, r: 0.36 });
const f4 = cut('ef_s4', [1, 0.05, 0], [[0, -10, 'out'], [0.08, -40, 'out'], [0.2, 200, 'out'], [0.42, 170, 'inOut']], -44, { base: F, hips: FH, grip: FSG, r: 0.36 });
const f5 = cut('ef_s5', [0.6, -0.8, 0], [[0, 30, 'out'], [0.08, 10, 'out'], [0.18, 174, 'out'], [0.4, 150, 'inOut']], 14, { launch: true, base: F, hips: FH, grip: FSG, r: 0.36 });
const f6 = cut('ef_s6', [0, 1, -0.15], [[0, -20, 'out'], [0.12, -60, 'out'], [0.26, 160, 'out'], [0.56, 140, 'inOut']], 0, { base: F, hips: FH, grip: FSG, r: 0.38 });
f6.events = { step: 0.06 };

export const EVEN_FINAL_CHAIN = ['ef_s1', 'ef_s2', 'ef_s3', 'ef_s4', 'ef_s5', 'ef_s6'];

// ================================================================== skills (on foot)

/** a pose clip: body keys, and the blade's grip at each key (or the hand let go) */
function poseClip(name: string, dur: number, events: Record<string, number>, frames: [number, B, Record<string, C3> | null, C3?, KeyDef['ease']?][], o: { fadeIn?: number; fadeOut?: number } = {}): ClipDef {
  return {
    name, dur, fadeIn: o.fadeIn ?? 0.05, fadeOut: o.fadeOut ?? 0.18, events,
    keys: mergeKeys(
      frames.filter((f) => f[2]).map((f) => ch(f[0], f[2]!, f[4])),
      frames.map((f) => body(f[0], f[1], f[3] ?? HIPS, f[4])),
    ),
  };
}

/** two fingers of the left hand pointed at the target: Byakurai, three times */
const POINT: B = { 'upperarm.L': [-92, 0, -6], 'forearm.L': [0, 0, 0], 'hand.L': [-10, 0, 0] };
const point = poseClip('ev_point', 0.62, { fire1: 0.14, fire2: 0.26, fire3: 0.38 }, [
  [0, R(), SG],
  [0.12, R({ hips: [0, 20, 0], chest: [2, 14, 0], head: [-4, -16, 0], ...POINT }), SG, HIPS, 'outExpo'],
  [0.2, R({ hips: [0, 20, 0], chest: [0, 14, 0], head: [-4, -16, 0], ...POINT, 'upperarm.L': [-100, 0, -6] }), SG, HIPS, 'out'],
  [0.32, R({ hips: [0, 20, 0], chest: [2, 14, 0], head: [-4, -16, 0], ...POINT }), SG, HIPS, 'out'],
  [0.44, R({ hips: [0, 20, 0], chest: [0, 14, 0], head: [-4, -16, 0], ...POINT, 'upperarm.L': [-100, 0, -6] }), SG, HIPS, 'out'],
  [0.62, R(), SG, HIPS, 'inOut'],
]);

const PALM: B = { 'upperarm.L': [-84, 0, -4], 'forearm.L': [-4, 0, 0], 'hand.L': [-70, 0, 0] };
/** Sōren Sōkatsui: the left palm and the blade's point thrust out together, side by side */
const twin = poseClip('ev_twin', 0.7, { fire: 0.3 }, [
  [0, R(), SG],
  [0.22, R({ hips: [0, -6, 0], chest: [-4, -4, 0], head: [-4, 0, 0], 'upperarm.L': [-40, 0, 20], 'forearm.L': [-80, 0, 0], 'hand.L': [0, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [16, 0, 0] }), grip([-0.24, 0.0, 0.08], [-0.2, 0.3, -0.93], [-0.7, -0.3, 0.4]), [0, -0.02, -0.03], 'inOut'],
  [0.32, R({ hips: [2, 6, 0], spine: [6, 2, 0], chest: [4, 4, 0], head: [-2, -6, 0], ...PALM, 'thigh.L': [-30, 0, 4], 'shin.L': [26, 0, 0], 'thigh.R': [16, 0, -6], 'shin.R': [14, 0, 0] }), grip([-0.12, 0.04, 0.5], [-0.04, 0.02, 1], [-0.7, -0.4, -0.4]), [0, -0.05, 0.08], 'outExpo'],
  [0.5, R({ hips: [2, 6, 0], spine: [6, 2, 0], chest: [4, 4, 0], head: [-2, -6, 0], ...PALM, 'thigh.L': [-30, 0, 4], 'shin.L': [26, 0, 0], 'thigh.R': [16, 0, -6], 'shin.R': [14, 0, 0] }), grip([-0.12, 0.04, 0.48], [-0.04, 0.02, 1], [-0.7, -0.4, -0.4]), [0, -0.05, 0.08]],
  [0.7, R(), SG, HIPS, 'inOut'],
]);

/** Dankū: the left palm raised flat before him, the fingers up */
const wall = poseClip('ev_wall', 0.5, { cast: 0.12 }, [
  [0, R(), SG],
  [0.12, R({ chest: [-2, 6, 0], head: [-4, -4, 0], 'upperarm.L': [-70, 0, 4], 'forearm.L': [-50, 0, 0], 'hand.L': [40, 0, 0] }), SG, HIPS, 'outExpo'],
  [0.36, R({ chest: [-2, 6, 0], head: [-4, -4, 0], 'upperarm.L': [-72, 0, 4], 'forearm.L': [-48, 0, 0], 'hand.L': [40, 0, 0] }), SG],
  [0.5, R(), SG, HIPS, 'inOut'],
]);

/** Kuyō Shibari: the left hand out with the fingers spread, then closed into a fist on the seals */
const bind = poseClip('ev_bind', 0.55, { cast: 0.16 }, [
  [0, R(), SG],
  [0.12, R({ hips: [2, 14, 0], chest: [4, 12, 0], head: [-2, -12, 0], ...PALM }), SG, [0, -0.02, 0.04], 'outExpo'],
  [0.2, R({ hips: [4, 16, 0], chest: [6, 14, 0], head: [0, -12, 0], 'upperarm.L': [-80, 0, -4], 'forearm.L': [-30, 0, 0], 'hand.L': [-10, 0, 0] }), SG, [0, -0.02, 0.04], 'outExpo'],
  [0.4, R({ hips: [4, 16, 0], chest: [6, 14, 0], head: [0, -12, 0], 'upperarm.L': [-80, 0, -4], 'forearm.L': [-34, 0, 0], 'hand.L': [-10, 0, 0] }), SG],
  [0.55, R(), SG, HIPS, 'inOut'],
]);

/** Kurohitsugi: the left arm out, the palm up, held while the coffin builds; the hand turned over and pressed down */
const coffin = poseClip('ev_coffin', 1.0, { cast: 0.4 }, [
  [0, R(), SG],
  [0.2, R({ hips: [0, 16, 0], chest: [0, 12, 0], head: [-6, -14, 0], 'upperarm.L': [-86, 0, 2], 'forearm.L': [-8, 0, 0], 'hand.L': [0, 80, 0] }), SG, HIPS, 'inOut'],
  [0.38, R({ hips: [0, 16, 0], chest: [0, 12, 0], head: [-6, -14, 0], 'upperarm.L': [-90, 0, 2], 'forearm.L': [-6, 0, 0], 'hand.L': [0, 80, 0] }), SG],
  [0.48, R({ hips: [4, 18, 0], chest: [6, 14, 0], head: [0, -14, 0], 'upperarm.L': [-70, 0, 2], 'forearm.L': [-10, 0, 0], 'hand.L': [-40, -80, 0] }), SG, [0, -0.03, 0.03], 'outExpo'],
  [0.8, R({ hips: [4, 18, 0], chest: [6, 14, 0], head: [0, -14, 0], 'upperarm.L': [-70, 0, 2], 'forearm.L': [-10, 0, 0], 'hand.L': [-40, -80, 0] }), SG, [0, -0.03, 0.03]],
  [1.0, R(), SG, HIPS, 'inOut'],
]);

/** the glasses pushed up the nose with the left forefinger — the opener, and the beat before every release */
const GLASSES: B = { 'upperarm.L': [-34, 0, -20], 'forearm.L': [-136, 0, 0], 'hand.L': [-20, 0, -26] };
const glasses = poseClip('ev_glasses', 0.75, { glint: 0.26 }, [
  [0, R(), SG],
  [0.22, R({ neck: [4, 0, 0], head: [6, -4, 0], ...GLASSES }), SG, HIPS, 'inOut'],
  [0.3, R({ neck: [2, 0, 0], head: [-2, -4, 0], ...GLASSES, 'forearm.L': [-140, 0, 0] }), SG, HIPS, 'out'],
  [0.52, R({ neck: [2, 0, 0], head: [-4, -6, 0], ...GLASSES, 'forearm.L': [-140, 0, 0] }), SG],
  [0.75, R(), SG, HIPS, 'inOut'],
]);

/** "Utsuse, Meikyō": the blade raised upright before his face, then turned flat to catch the light, swept out */
const release = poseClip('ev_release', 0.9, { name: 0.22, shine: 0.48 }, [
  [0, R(), SG],
  [0.22, R({ chest: [-4, 0, 0], head: [-4, 0, 0], 'upperarm.L': [-50, 0, 10], 'forearm.L': [-80, 0, 0], 'hand.L': [-10, 0, -10] }), grip([-0.06, 0.12, 0.3], [0.02, 1, 0.06], [-0.8, -0.3, -0.4], [0, 0, 1]), HIPS, 'inOut'],
  [0.4, R({ chest: [-6, 0, 0], head: [-6, 0, 0], 'upperarm.L': [-50, 0, 10], 'forearm.L': [-80, 0, 0], 'hand.L': [-10, 0, -10] }), grip([-0.06, 0.14, 0.3], [0.02, 1, 0.06], [-0.8, -0.3, -0.4], [1, 0, 0])],
  [0.52, R({ hips: [2, -16, 0], chest: [4, -16, 0], head: [-2, 10, 0], 'upperarm.L': [0, 0, 40], 'forearm.L': [-20, 0, 0] }), grip([-0.5, -0.08, 0.16], [-0.85, -0.3, 0.42], [-0.6, -0.4, -0.6]), [0, -0.03, 0.03], 'outExpo'],
  [0.9, R(), SG, HIPS, 'inOut'],
]);

/** Kakudai: the blade drawn back to his left, then a great level sweep through the lens */
const lens = poseClip('ev_lens', 0.75, { lens: 0.12, cut: 0.32 }, [
  [0, R(), SG],
  [0.2, R({ hips: [6, 30, 0], spine: [6, 14, 0], chest: [4, 16, 0], head: [-6, -24, 0], 'thigh.L': [-34, 0, 8], 'shin.L': [44, 0, 0], 'thigh.R': [18, 0, -8], 'shin.R': [30, 0, 0], ...FREE }), grip([0.2, 0.06, 0.12], [0.7, 0.1, -0.7], [-0.7, -0.4, -0.5]), [0, -0.1, -0.02], 'inOut'],
  [0.34, R({ hips: [6, -34, 0], spine: [6, -16, 0], chest: [4, -20, 0], head: [-6, 22, 0], 'thigh.L': [-46, 0, 6], 'shin.L': [36, 0, 0], 'thigh.R': [28, 0, -8], 'shin.R': [28, 0, 0], 'upperarm.L': [10, 0, 60], 'forearm.L': [-10, 0, 0] }), grip([-0.54, 0.06, 0.24], [-0.9, 0.05, -0.42], [-0.6, -0.5, -0.5]), [0, -0.12, 0.1], 'outExpo'],
  [0.52, R({ hips: [6, -34, 0], spine: [6, -16, 0], chest: [4, -20, 0], head: [-6, 22, 0], 'thigh.L': [-46, 0, 6], 'shin.L': [36, 0, 0], 'thigh.R': [28, 0, -8], 'shin.R': [28, 0, 0], 'upperarm.L': [10, 0, 60], 'forearm.L': [-10, 0, 0] }), grip([-0.55, 0.04, 0.22], [-0.92, 0.0, -0.4], [-0.6, -0.5, -0.5]), [0, -0.12, 0.1]],
  [0.75, R(), SG, HIPS, 'inOut'],
]);

/** Bunkō: the prism lifted on the left palm before his face, the blade's point laid against it, then a step in */
const prismPose = poseClip('ev_prism', 0.75, { cast: 0.3 }, [
  [0, R(), SG],
  [0.2, R({ chest: [-2, 8, 0], head: [-4, -6, 0], 'upperarm.L': [-80, 0, -10], 'forearm.L': [-36, 0, 0], 'hand.L': [-60, 0, 0] }), grip([-0.16, 0.12, 0.34], [0.3, 0.1, 0.95], [-0.7, -0.4, -0.4]), HIPS, 'inOut'],
  [0.32, R({ hips: [2, 6, 0], spine: [4, 2, 0], chest: [0, 8, 0], head: [-4, -6, 0], 'upperarm.L': [-84, 0, -10], 'forearm.L': [-30, 0, 0], 'hand.L': [-60, 0, 0], 'thigh.L': [-26, 0, 4], 'shin.L': [22, 0, 0] }), grip([-0.12, 0.12, 0.42], [0.25, 0.08, 0.96], [-0.7, -0.4, -0.4]), [0, -0.03, 0.05], 'outExpo'],
  [0.55, R({ hips: [2, 6, 0], spine: [4, 2, 0], chest: [0, 8, 0], head: [-4, -6, 0], 'upperarm.L': [-84, 0, -10], 'forearm.L': [-30, 0, 0], 'hand.L': [-60, 0, 0], 'thigh.L': [-26, 0, 4], 'shin.L': [22, 0, 0] }), grip([-0.12, 0.12, 0.42], [0.25, 0.08, 0.96], [-0.7, -0.4, -0.4]), [0, -0.03, 0.05]],
  [0.75, R(), SG, HIPS, 'inOut'],
]);

/** Hansha: the blade held upright before him, the flat to the front, the left hand flat behind the blade */
const mirror = poseClip('ev_mirror', 0.6, { cast: 0.1 }, [
  [0, R(), SG],
  [0.1, R({ chest: [-4, 0, 0], head: [-6, 0, 0], 'upperarm.L': [-50, 0, 0], 'forearm.L': [-70, 0, 0], 'hand.L': [-20, 0, -20] }), grip([-0.04, 0.06, 0.34], [0.02, 1, 0.04], [-0.8, -0.3, -0.4], [1, 0, 0]), HIPS, 'outExpo'],
  [0.45, R({ chest: [-4, 0, 0], head: [-6, 0, 0], 'upperarm.L': [-50, 0, 0], 'forearm.L': [-70, 0, 0], 'hand.L': [-20, 0, -20] }), grip([-0.04, 0.08, 0.34], [0.02, 1, 0.04], [-0.8, -0.3, -0.4], [1, 0, 0])],
  [0.6, R(), SG, HIPS, 'inOut'],
]);

/** the blade raised at the sun, held, then pointed down at the target (Shōten) */
const focus = poseClip('ev_focus', 0.8, { raise: 0.2, call: 0.45 }, [
  [0, R(), SG],
  [0.2, R({ spine: [-6, 0, 0], chest: [-10, 0, 0], head: [-26, 0, 0], ...FREE }), grip([-0.12, 0.44, 0.06], [-0.05, 1, 0.1], [-0.8, -0.3, -0.4], [0, 0, 1]), [0, 0.01, 0], 'inOut'],
  [0.4, R({ spine: [-6, 0, 0], chest: [-12, 0, 0], head: [-28, 0, 0], ...FREE }), grip([-0.12, 0.46, 0.06], [-0.05, 1, 0.1], [-0.8, -0.3, -0.4], [0, 0, 1])],
  [0.52, R({ hips: [4, 0, 0], spine: [8, 0, 0], chest: [6, 0, 0], head: [2, 0, 0], 'thigh.L': [-26, 0, 4], 'shin.L': [24, 0, 0] }), grip([-0.16, 0.06, 0.48], [-0.08, -0.35, 0.93], [-0.7, -0.4, -0.4]), [0, -0.04, 0.05], 'outExpo'],
  [0.8, R(), SG, HIPS, 'inOut'],
]);

/** Senkō: the blade flicked up flat before his face to catch the sun; the grin */
const flash = poseClip('ev_flash', 0.55, { flash: 0.18 }, [
  [0, R(), SG],
  [0.16, R({ chest: [-6, 4, 0], head: [-8, -4, 0] }), grip([-0.14, 0.2, 0.3], [0.1, 0.9, 0.42], [-0.8, -0.3, -0.4], [1, 0, 0]), HIPS, 'outExpo'],
  [0.36, R({ chest: [-6, 4, 0], head: [-8, -4, 0] }), grip([-0.14, 0.22, 0.3], [0.1, 0.9, 0.42], [-0.8, -0.3, -0.4], [1, 0, 0])],
  [0.55, R(), SG, HIPS, 'inOut'],
]);

/** the Bankai: the blade lifted in both hands, then driven point-down into the ground before him */
const bankai = poseClip('ev_bankai', 1.5, { name: 0.3, lake: 0.85 }, [
  [0, R(), SG],
  [0.4, R({ spine: [-4, 0, 0], chest: [-8, 0, 0], head: [-14, 0, 0] }), { ...grip([-0.08, 0.36, 0.22], [0, 0.94, 0.34], [-0.8, -0.3, -0.4], [0, 0, 1]), '@twoHand': [1, 0, 0] }, [0, 0.01, 0], 'inOut'],
  [0.78, R({ spine: [-6, 0, 0], chest: [-10, 0, 0], head: [-16, 0, 0] }), { ...grip([-0.08, 0.4, 0.22], [0, 0.94, 0.34], [-0.8, -0.3, -0.4], [0, 0, 1]), '@twoHand': [1, 0, 0] }],
  [0.88, R({ hips: [16, 0, 0], spine: [20, 0, 0], chest: [10, 0, 0], head: [6, 0, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [70, 0, 0], 'thigh.R': [-10, 0, -6], 'shin.R': [80, 0, 0] }), { ...grip([-0.06, -0.24, 0.34], [0, -1, 0.06], [-0.7, -0.4, -0.4], [0, 0, 1]), '@twoHand': [1, 0, 0] }, [0, -0.26, 0.06], 'outExpo'],
  [1.25, R({ hips: [16, 0, 0], spine: [20, 0, 0], chest: [10, 0, 0], head: [-2, 0, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [70, 0, 0], 'thigh.R': [-10, 0, -6], 'shin.R': [80, 0, 0] }), { ...grip([-0.06, -0.26, 0.34], [0, -1, 0.06], [-0.7, -0.4, -0.4], [0, 0, 1]), '@twoHand': [1, 0, 0] }, [0, -0.26, 0.06]],
  [1.5, R(), { ...SG, '@twoHand': [0, 0, 0] }, HIPS, 'inOut'],
], { fadeOut: 0.3 });

/** Mizukagami-tsuki: the blade reversed and stabbed straight down into the water at his feet */
const stab = poseClip('ev_stab', 0.75, { stab: 0.3 }, [
  [0, R(), SG],
  [0.2, R({ spine: [-4, 0, 0], chest: [-6, 0, 0], ...FREE }), grip([-0.14, 0.24, 0.18], [0, 1, 0.05], [-0.8, -0.3, -0.4], [0, 0, 1]), [0, 0.01, 0], 'inOut'],
  [0.32, R({ hips: [14, 0, 0], spine: [18, 0, 0], chest: [10, 0, 0], head: [6, 0, 0], 'thigh.L': [-44, 0, 6], 'shin.L': [60, 0, 0], 'thigh.R': [-6, 0, -6], 'shin.R': [70, 0, 0], ...FREE }), grip([-0.1, -0.3, 0.3], [0, -1, 0.05], [-0.7, -0.4, -0.4], [0, 0, 1]), [0, -0.22, 0.05], 'outExpo'],
  [0.55, R({ hips: [14, 0, 0], spine: [18, 0, 0], chest: [10, 0, 0], head: [0, 0, 0], 'thigh.L': [-44, 0, 6], 'shin.L': [60, 0, 0], 'thigh.R': [-6, 0, -6], 'shin.R': [70, 0, 0], ...FREE }), grip([-0.1, -0.32, 0.3], [0, -1, 0.05], [-0.7, -0.4, -0.4], [0, 0, 1]), [0, -0.22, 0.05]],
  [0.75, R(), SG, HIPS, 'inOut'],
]);

/** Kyōzō: the left hand swept low over the water, palm down, then lifted — the reflections climb out */
const summon = poseClip('ev_summon', 0.9, { call: 0.5 }, [
  [0, R(), SG],
  [0.3, R({ hips: [10, -10, 0], spine: [14, -6, 0], chest: [8, -6, 0], head: [4, 8, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [40, 0, 0], 'thigh.R': [10, 0, -6], 'shin.R': [40, 0, 0], 'upperarm.L': [-50, 0, 60], 'forearm.L': [-10, 0, 0], 'hand.L': [-10, 0, 20] }), SG, [0, -0.1, 0], 'inOut'],
  [0.5, R({ hips: [0, 10, 0], spine: [-4, 6, 0], chest: [-6, 6, 0], head: [-10, -6, 0], 'upperarm.L': [-110, 0, 40], 'forearm.L': [-10, 0, 0], 'hand.L': [30, 0, 0] }), SG, [0, 0, 0], 'outExpo'],
  [0.7, R({ hips: [0, 10, 0], spine: [-4, 6, 0], chest: [-6, 6, 0], head: [-10, -6, 0], 'upperarm.L': [-112, 0, 40], 'forearm.L': [-10, 0, 0], 'hand.L': [30, 0, 0] }), SG],
  [0.9, R(), SG, HIPS, 'inOut'],
]);

/** Kagami-watari: a crouch and a dive into the mirror at his feet */
const dive = poseClip('ev_dive', 0.4, { sink: 0.12 }, [
  [0, R(), SG],
  [0.12, R({ hips: [30, 0, 0], spine: [20, 0, 0], chest: [10, 0, 0], head: [0, 0, 0], 'thigh.L': [-80, 0, 6], 'shin.L': [100, 0, 0], 'thigh.R': [-60, 0, -6], 'shin.R': [100, 0, 0], ...FREE }), SG, [0, -0.36, 0.08], 'outExpo'],
  [0.4, R({ hips: [30, 0, 0], spine: [20, 0, 0], chest: [10, 0, 0], head: [0, 0, 0], 'thigh.L': [-80, 0, 6], 'shin.L': [100, 0, 0], 'thigh.R': [-60, 0, -6], 'shin.R': [100, 0, 0], ...FREE }), SG, [0, -0.36, 0.08]],
]);

/** Senkyō Kōrō: the left hand out, the fingers spread round the cage; the blade's point thrust in to fire the ray */
const prisonPose = poseClip('ev_prison', 0.85, { cage: 0.2, fire: 0.5 }, [
  [0, R(), SG],
  [0.2, R({ hips: [2, 14, 0], chest: [4, 12, 0], head: [-2, -12, 0], ...PALM, 'hand.L': [-40, 0, 0] }), grip([-0.24, -0.04, 0.12], [-0.3, 0.1, 0.95], [-0.7, -0.3, -0.5]), [0, -0.02, 0.03], 'outExpo'],
  [0.44, R({ hips: [2, 14, 0], chest: [4, 12, 0], head: [-2, -12, 0], ...PALM, 'hand.L': [-40, 0, 0] }), grip([-0.24, -0.02, 0.14], [-0.3, 0.1, 0.95], [-0.7, -0.3, -0.5])],
  [0.52, R({ hips: [2, 4, 0], spine: [6, 2, 0], chest: [4, 4, 0], head: [-2, -6, 0], ...FREE, 'thigh.L': [-30, 0, 4], 'shin.L': [26, 0, 0], 'thigh.R': [16, 0, -6], 'shin.R': [14, 0, 0] }), grip([-0.1, 0.06, 0.54], [-0.04, 0.02, 1], [-0.7, -0.4, -0.4]), [0, -0.05, 0.08], 'outExpo'],
  [0.85, R(), SG, HIPS, 'inOut'],
]);

/** Kyōha: the blade swept from low at his left up over his right shoulder — the water rises — then flung forward */
const wave = poseClip('ev_wave', 1.2, { rise: 0.35, crash: 0.8 }, [
  [0, R(), SG],
  [0.2, R({ hips: [10, 24, 0], spine: [12, 10, 0], chest: [8, 12, 0], head: [0, -18, 0], 'thigh.L': [-30, 0, 6], 'shin.L': [44, 0, 0], 'thigh.R': [14, 0, -6], 'shin.R': [36, 0, 0], ...FREE }), grip([0.16, -0.36, 0.16], [0.6, -0.6, 0.5], [-0.7, -0.4, -0.5]), [0, -0.1, 0], 'inOut'],
  [0.45, R({ hips: [-4, -20, 0], spine: [-8, -10, 0], chest: [-12, -14, 0], head: [-20, 14, 0], 'upperarm.L': [-150, 0, 30], 'forearm.L': [-10, 0, 0] }), grip([-0.3, 0.46, -0.02], [-0.4, 0.88, -0.25], [-0.7, -0.3, -0.5]), [0, 0.02, 0], 'outExpo'],
  [0.72, R({ hips: [-4, -20, 0], spine: [-8, -10, 0], chest: [-12, -14, 0], head: [-20, 14, 0], 'upperarm.L': [-152, 0, 30], 'forearm.L': [-10, 0, 0] }), grip([-0.3, 0.48, -0.02], [-0.4, 0.88, -0.25], [-0.7, -0.3, -0.5])],
  [0.84, R({ hips: [10, 6, 0], spine: [14, 4, 0], chest: [10, 4, 0], head: [2, -4, 0], 'thigh.L': [-34, 0, 4], 'shin.L': [30, 0, 0], 'upperarm.L': [-60, 0, 20], 'forearm.L': [-10, 0, 0] }), grip([-0.12, -0.04, 0.5], [-0.05, -0.4, 0.92], [-0.7, -0.4, -0.4]), [0, -0.06, 0.08], 'outExpo'],
  [1.2, R(), SG, HIPS, 'inOut'],
], { fadeOut: 0.25 });

/** the seal: the blade swept down and the left hand back to the hip */
const seal = poseClip('ev_seal', 0.5, { cast: 0.2 }, [
  [0, R(), SG],
  [0.2, R({ head: [6, 0, 0], 'upperarm.L': [-30, 0, -10], 'forearm.L': [-90, 0, 0] }), grip([-0.2, -0.1, 0.3], [0, -0.5, 0.86], [-0.7, -0.3, -0.5]), HIPS, 'inOut'],
  [0.5, R(), SG, HIPS, 'inOut'],
]);

/** "Kaigen": the left hand over the glasses, the head bowed — then the arms open, the head thrown back, he rises */
const kaigen = poseClip('ev_kaigen', 1.6, { name: 0.3, rise: 0.75 }, [
  [0, R(), SG],
  [0.3, R({ neck: [8, 0, 0], head: [14, 0, 0], 'upperarm.L': [-40, 0, -34], 'forearm.L': [-132, 0, 0], 'hand.L': [-10, 0, -30] }), grip([-0.18, -0.08, 0.24], [0, -0.35, 0.94], [-0.7, -0.3, -0.5]), [0, -0.03, 0], 'inOut'],
  [0.66, R({ neck: [8, 0, 0], head: [14, 0, 0], 'upperarm.L': [-40, 0, -34], 'forearm.L': [-134, 0, 0], 'hand.L': [-10, 0, -30] }), grip([-0.18, -0.08, 0.24], [0, -0.35, 0.94], [-0.7, -0.3, -0.5])],
  [1.0, F({ spine: [-8, 0, 0], chest: [-14, 0, 0], head: [-24, 0, 0], 'upperarm.L': [-20, 0, 80], 'forearm.L': [-6, 0, 0], 'hand.L': [0, 0, 16] }), grip([-0.52, 0.1, 0.1], [-0.82, 0.3, 0.48], [-0.6, -0.4, -0.6]), [0, 0.04, 0], 'inOut'],
  [1.6, F(), FSG, [0, 0, 0], 'inOut'],
], { fadeOut: 0.3 });

// ================================================================== skills (floating)

/** Issen: the blade drawn back low by the left hip, held, then the level cut across everything */
const issen = poseClip('ef_issen', 0.9, { draw: 0.1, cut: 0.5 }, [
  [0, F(), FSG, [0, 0, 0]],
  [0.3, F({ hips: [6, 30, 0], spine: [8, 14, 0], chest: [6, 16, 0], head: [-6, -26, 0], 'upperarm.L': [-30, 0, -10], 'forearm.L': [-70, 0, 0] }), grip([0.2, -0.22, 0.04], [0.75, -0.2, -0.62], [-0.7, -0.4, -0.5]), [0, 0, 0], 'inOut'],
  [0.46, F({ hips: [6, 32, 0], spine: [8, 14, 0], chest: [6, 16, 0], head: [-6, -26, 0], 'upperarm.L': [-30, 0, -10], 'forearm.L': [-72, 0, 0] }), grip([0.21, -0.22, 0.04], [0.76, -0.2, -0.62], [-0.7, -0.4, -0.5])],
  [0.54, F({ hips: [6, -34, 0], spine: [8, -16, 0], chest: [4, -20, 0], head: [-6, 22, 0], 'upperarm.L': [10, 0, 60], 'forearm.L': [-10, 0, 0] }), grip([-0.54, 0.02, 0.22], [-0.9, 0.0, -0.42], [-0.6, -0.5, -0.5]), [0, 0, 0.06], 'outExpo'],
  [0.74, F({ hips: [6, -34, 0], spine: [8, -16, 0], chest: [4, -20, 0], head: [-6, 22, 0], 'upperarm.L': [10, 0, 60], 'forearm.L': [-10, 0, 0] }), grip([-0.55, 0.0, 0.2], [-0.92, -0.05, -0.38], [-0.6, -0.5, -0.5]), [0, 0, 0.06]],
  [0.9, F(), FSG, [0, 0, 0], 'inOut'],
]);

/** Hyakkakyō: the photographer's frame — the left hand's thumb and forefinger squared before his eye, the blade's
 *  point lifted to close the other corner */
const frame = poseClip('ef_frame', 0.8, { cast: 0.3 }, [
  [0, F(), FSG, [0, 0, 0]],
  [0.24, F({ chest: [-2, 6, 0], head: [-4, -4, 4], 'upperarm.L': [-70, 0, 20], 'forearm.L': [-90, 0, 0], 'hand.L': [-30, 40, 0] }), grip([-0.2, 0.16, 0.3], [0.3, 0.86, 0.4], [-0.8, -0.3, -0.4], [1, 0, 0]), [0, 0, 0], 'outExpo'],
  [0.6, F({ chest: [-2, 6, 0], head: [-4, -4, 4], 'upperarm.L': [-72, 0, 20], 'forearm.L': [-90, 0, 0], 'hand.L': [-30, 40, 0] }), grip([-0.2, 0.18, 0.3], [0.3, 0.86, 0.4], [-0.8, -0.3, -0.4], [1, 0, 0])],
  [0.8, F(), FSG, [0, 0, 0], 'inOut'],
]);

/** Tenkyō Shōten: the blade raised to the sun, held while the sky's mirror opens, then lowered at the target */
const sun = poseClip('ef_sun', 1.0, { open: 0.3, fire: 0.62 }, [
  [0, F(), FSG, [0, 0, 0]],
  [0.3, F({ spine: [-8, 0, 0], chest: [-12, 0, 0], head: [-30, 0, 0], 'upperarm.L': [-20, 0, 50], 'forearm.L': [-10, 0, 0] }), grip([-0.12, 0.5, 0.04], [-0.05, 1, 0.08], [-0.8, -0.3, -0.4], [0, 0, 1]), [0, 0.02, 0], 'inOut'],
  [0.56, F({ spine: [-8, 0, 0], chest: [-14, 0, 0], head: [-32, 0, 0], 'upperarm.L': [-20, 0, 54], 'forearm.L': [-10, 0, 0] }), grip([-0.12, 0.52, 0.04], [-0.05, 1, 0.08], [-0.8, -0.3, -0.4], [0, 0, 1])],
  [0.68, F({ hips: [4, 0, 0], spine: [8, 0, 0], chest: [6, 0, 0], head: [2, 0, 0] }), grip([-0.16, 0.04, 0.48], [-0.08, -0.4, 0.92], [-0.7, -0.4, -0.4]), [0, 0, 0.05], 'outExpo'],
  [1.0, F(), FSG, [0, 0, 0], 'inOut'],
]);

/** Kyōzō Hangyaku: the left palm held out at the target like a mirror shown to it */
const rebel = poseClip('ef_rebel', 0.8, { cast: 0.4 }, [
  [0, F(), FSG, [0, 0, 0]],
  [0.3, F({ hips: [0, 14, 0], chest: [-2, 12, 0], head: [-4, -12, 0], 'upperarm.L': [-88, 0, -6], 'forearm.L': [-6, 0, 0], 'hand.L': [-80, 0, 0] }), FSG, [0, 0, 0.03], 'outExpo'],
  [0.62, F({ hips: [0, 14, 0], chest: [-2, 12, 0], head: [-4, -12, 0], 'upperarm.L': [-90, 0, -6], 'forearm.L': [-6, 0, 0], 'hand.L': [-80, 0, 0] }), FSG, [0, 0, 0.03]],
  [0.8, F(), FSG, [0, 0, 0], 'inOut'],
]);

/** Jōhari no Kagami: the blade held upright before the chest, the left hand flat beside it, the head bowed; then the
 *  blade turned flat toward the target as the judgment falls */
const judge = poseClip('ef_judge', 1.6, { rise: 0.3, judge: 1.1 }, [
  [0, F(), FSG, [0, 0, 0]],
  [0.3, F({ neck: [6, 0, 0], head: [10, 0, 0], 'upperarm.L': [-50, 0, -14], 'forearm.L': [-90, 0, 0], 'hand.L': [-10, 0, -40] }), grip([-0.04, 0.06, 0.3], [0, 1, 0.04], [-0.8, -0.3, -0.4], [0, 0, 1]), [0, 0, 0], 'inOut'],
  [1.0, F({ neck: [6, 0, 0], head: [12, 0, 0], 'upperarm.L': [-50, 0, -14], 'forearm.L': [-92, 0, 0], 'hand.L': [-10, 0, -40] }), grip([-0.04, 0.08, 0.3], [0, 1, 0.04], [-0.8, -0.3, -0.4], [0, 0, 1])],
  [1.12, F({ hips: [0, -12, 0], chest: [-6, -10, 0], head: [-8, 8, 0], 'upperarm.L': [-10, 0, 70], 'forearm.L': [-6, 0, 0] }), grip([-0.3, 0.1, 0.4], [-0.3, 0.3, 0.9], [-0.7, -0.3, -0.5], [1, 0, 0]), [0, 0, 0.04], 'outExpo'],
  [1.6, F(), FSG, [0, 0, 0], 'inOut'],
], { fadeOut: 0.3 });

// ================================================================== sets

const COMMON = [thrust, s2, s3, s4, s5, point, twin, wall, bind, coffin, glasses, release, lens, prismPose, mirror, focus, flash, bankai, stab, summon, dive, prisonPose, wave, seal, kaigen];
const FINAL = [float, f1, f2, f3, f4, f5, f6, issen, frame, sun, rebel, judge];
export const EVEN_CLIPS: ClipDef[] = [...SHARED, ...COMMON, ...FINAL];
