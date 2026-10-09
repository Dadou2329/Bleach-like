// Dadou's animation set (docs/kits/dadou.md). On foot (sealed, Shikai): an emperor's bearing — upright, the chest open,
// the chin up, the left hand folded behind his back, the blade low in the right hand; the left hand comes out from
// behind him for every command. The string: a diagonal cut, its reverse, a level cut, a thrust, a rising cut. Skills:
// the left palm thrust out (Haien), two fingers sweeping a fan (Shakkahō), the palm pressed down on the world (Ōi), the
// hand raised and brought down at the target (Gochūtekkan), sitting down on the throne, "Hirefuse" with the blade held
// level and the left hand drawn along it, the lunge of Kokuen, the palm raised with the wisps over it (Onibi), the
// rope thrown and hauled in (Kensaku), the point lowered at the target's feet (Gōka), the arm swept forward to send the
// parade (Hyakki Yakō), and the Bankai with the blade driven into the ground.
// Bankai (on foot, the nodachi): held low at his right, the point trailing behind; heavy two-handed cuts the giant
// repeats; the claw raised for the Gates, both arms brought down for the chains, the reach, grip, lift and slam of the
// Demon's Hand, the stamp of the burning hells, the great overhead cut, "Tenka Fubu" with the arms thrown open.
// Final form (floating): the legs relaxed, the second pair of arms raised behind his shoulders; six cuts with both
// pairs, the four hands joined for the cannon, the wheel thrown from his back, the fist closed on Muken, the blade
// raised and stabbed down for the descent, all four arms lifted to the sky for Tenka Fubu.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { mergeKeys, swingKeys } from '../anim/swing';
import { ICHIGO_CLIPS } from './ichigoClips';

type C3 = [number, number, number];
type B = NonNullable<KeyDef['b']>;

function grip(p: C3, dir: C3, pole: C3, ref: C3 = [0, -1, 0], h: 'R' | 'R2' | 'L2' = 'R'): Record<string, C3> {
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
  return { [`@grip${h}`]: p, [`@dir${h}`]: d, [`@edge${h}`]: e, [`@pole${h}`]: pole, [`@ik${h}`]: [1, 0, 0] };
}
const body = (t: number, b: B, hips?: KeyDef['hips'], ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });
const ch = (t: number, c: Record<string, C3>, ease?: KeyDef['ease']): KeyDef => ({ t, ease, c });

const SHARED = ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name));

// ================================================================== stances

/** the left hand folded behind the small of his back */
const BEHIND: B = { 'upperarm.L': [38, -60, -12], 'forearm.L': [-112, 0, 0], 'hand.L': [0, 0, 0] };
const IDLE: B = {
  // upright, the chest open and the chin up, the feet apart, the weight even
  hips: [0, -4, 0], spine: [-3, 0, 0], chest: [-5, 2, 0], neck: [-2, 0, 0], head: [-4, -4, 0],
  'thigh.L': [-3, 0, 6], 'shin.L': [5, 0, 0], 'foot.L': [-2, 0, -4], 'thigh.R': [2, 0, -6], 'shin.R': [5, 0, 0], 'foot.R': [-3, 0, 4],
  ...BEHIND,
};
const R = (over: B = {}): B => ({ ...IDLE, ...over });
const HIPS: C3 = [0, -0.008, 0];
/** the blade low in the right hand, its point forward and down */
const G = { p: [-0.27, -0.33, 0.14] as C3, dir: [-0.14, -0.46, 0.88] as C3, pole: [-0.6, -0.3, -0.75] as C3 };
const SG = grip(G.p, G.dir, G.pole);
/** the left arm out from behind his back (for the commands) */
const FREE: B = { 'upperarm.L': [-6, 0, 10], 'forearm.L': [-24, 0, 0], 'hand.L': [0, 0, 0] };

export const DADOU_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.008,
  run: { spine: [10, 0, 0], chest: [4, 0, 0], head: [-8, 0, 0], 'upperarm.L': [14, 0, 12], 'forearm.L': [-34, 0, 0], 'hand.L': [0, 0, 0] },
  sprint: { spine: [18, 0, 0], chest: [8, 0, 0], head: [-12, 0, 0], 'upperarm.L': [40, 0, 14], 'forearm.L': [-28, 0, 0], 'hand.L': [0, 0, 0] },
  swingL: 0.25,
  swingR: 0.12,
  freqScale: 0.96,
  grip: {
    idle: { p: G.p, dir: G.dir, edge: [0, -0.88, -0.47], pole: G.pole },
    walk: { p: [-0.28, -0.32, 0.12], dir: [-0.14, -0.47, 0.87], edge: [0, -0.88, -0.48], pole: G.pole },
    run: { p: [-0.28, -0.22, -0.08], dir: [-0.2, -0.3, -0.93], edge: [0, -0.95, 0.3], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.28, -0.14, -0.16], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.34, -0.08, 0.08], dir: [-0.6, -0.25, 0.75], edge: [0, -1, 0], pole: [-0.4, -0.6, -0.6] },
  },
};

/** the Bankai: the nodachi low at his right, the point trailing behind him */
const BG = { p: [-0.3, -0.31, 0.06] as C3, dir: [-0.28, -0.32, -0.9] as C3, pole: [-0.8, -0.2, 0.4] as C3 };
const BSG = grip(BG.p, BG.dir, BG.pole);
export const DADOU_BANKAI_STANCE: StanceDef = {
  ...DADOU_STANCE,
  swingR: 0.06,
  freqScale: 0.92,
  grip: {
    idle: { p: BG.p, dir: BG.dir, edge: [0, -0.94, 0.33], pole: BG.pole },
    walk: { p: BG.p, dir: BG.dir, edge: [0, -0.94, 0.33], pole: BG.pole },
    run: { p: [-0.3, -0.24, -0.06], dir: [-0.25, -0.2, -0.95], edge: [0, -0.98, 0.2], pole: [-0.8, -0.2, 0.5] },
    sprint: { p: [-0.3, -0.16, -0.14], dir: [-0.2, -0.05, -0.98], edge: [0, -1, 0.05], pole: [-0.8, -0.2, 0.5] },
    air: { p: [-0.34, -0.1, 0.0], dir: [-0.45, -0.3, -0.84], edge: [0, -0.95, 0.3], pole: [-0.6, -0.5, 0.5] },
  },
};

/** the final form floats: the legs relaxed, the left hand open, the second pair of arms raised behind his shoulders */
const ARMS2: B = { 'upperarm2.L': [-28, 0, 104], 'forearm2.L': [-46, 0, 0], 'hand2.L': [0, 0, 10], 'upperarm2.R': [-28, 0, -104], 'forearm2.R': [-46, 0, 0], 'hand2.R': [0, 0, -10] };
const FLOAT: B = {
  hips: [0, -4, 0], spine: [-3, 2, 0], chest: [-5, 2, 0], neck: [0, 0, 0], head: [-6, -2, 0],
  'thigh.L': [-12, 0, 4], 'shin.L': [30, 0, 0], 'foot.L': [30, 0, -2], 'thigh.R': [-2, 0, -3], 'shin.R': [10, 0, 0], 'foot.R': [34, 0, 2],
  'upperarm.L': [-14, 0, 28], 'forearm.L': [-24, 0, 0], 'hand.L': [10, 0, 12],
  ...ARMS2,
};
const F = (over: B = {}): B => ({ ...FLOAT, ...over });
const FG = { p: [-0.38, -0.24, 0.1] as C3, dir: [-0.45, -0.5, 0.74] as C3, pole: [-0.7, -0.2, -0.6] as C3 };
const FSG = grip(FG.p, FG.dir, FG.pole);
const FLEGS: B = { 'thigh.L': FLOAT['thigh.L'], 'shin.L': FLOAT['shin.L'], 'foot.L': FLOAT['foot.L'], 'thigh.R': FLOAT['thigh.R'], 'shin.R': FLOAT['shin.R'], 'foot.R': FLOAT['foot.R'] };

export const DADOU_FINAL_STANCE: StanceDef = {
  idle: FLOAT,
  idleHips: 0,
  run: { spine: [16, 0, 0], chest: [6, 0, 0], head: [-14, 0, 0], 'upperarm.L': [34, 0, 24], 'forearm.L': [-10, 0, 0], ...ARMS2 },
  sprint: { spine: [26, 0, 0], chest: [10, 0, 0], head: [-20, 0, 0], 'upperarm.L': [50, 0, 26], 'forearm.L': [-6, 0, 0], ...ARMS2 },
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
  name: 'df_float', dur: 3.2, loop: true, fadeIn: 0.3, fadeOut: 0.3,
  keys: [
    body(0, FLEGS),
    body(1.6, { ...FLEGS, 'thigh.L': [-16, 0, 5], 'shin.L': [34, 0, 0], 'thigh.R': [0, 0, -3], 'shin.R': [8, 0, 0] }, undefined, 'inOut'),
    body(3.2, FLEGS, undefined, 'inOut'),
  ],
};

// ================================================================== the string (on foot)

function cut(name: string, a: C3, keys: [number, number, 'out' | 'inOut'][], twist: number, o: { launch?: boolean; base?: (over?: B) => B; hips?: C3; grip?: Record<string, C3>; r?: number; two?: boolean; c?: C3 } = {}): ClipDef {
  const end = keys[keys.length - 1][0];
  const base = o.base ?? R;
  const H0 = o.hips ?? HIPS;
  const two: KeyDef[] = o.two ? [ch(0, { '@twoHand': [1, 0, 0] }), ch(end - 0.08, { '@twoHand': [1, 0, 0] }), ch(end, { '@twoHand': [0, 0, 0] }, 'inOut')] : [];
  return {
    name, dur: end, fadeIn: 0.04, fadeOut: 0.15,
    events: { step: 0.06, combo: keys[keys.length - 2][0] + 0.06 },
    keys: mergeKeys(
      swingKeys({ a, b: [0, 0, 1], c: o.c ?? [-0.04, 0.04, 0.1], r: o.r ?? 0.33, pole: [-0.7, -0.4, -0.5], keys }),
      [ch(end, o.grip ?? SG, 'inOut')],
      two,
      [
        body(0, base(), H0),
        body(keys[1][0], base({ hips: [0, -twist, 0], spine: [4, -twist * 0.4, 0], chest: [0, -twist * 0.6, 0] }), H0, 'out'),
        body(keys[2][0], base(o.launch
          ? { hips: [-6, twist, 0], spine: [-8, twist * 0.5, 0], chest: [-10, twist * 0.6, 0], ...FREE }
          : { hips: [6, twist, 0], spine: [10, twist * 0.5, 0], chest: [6, twist * 0.7, 0], 'thigh.L': [-28, 0, 6], 'shin.L': [24, 0, 0], 'thigh.R': [16, 0, -8], 'shin.R': [18, 0, 0] }), [H0[0], H0[1] - 0.05, H0[2] + 0.07], 'out'),
        body(end, base(), H0, 'inOut'),
      ],
    ),
  };
}
const s1 = cut('dd_s1', [-0.7, 0.7, 0], [[0, 40, 'out'], [0.1, 0, 'out'], [0.2, 172, 'out'], [0.42, 140, 'inOut']], 24);
const s2 = cut('dd_s2', [0.7, 0.7, 0], [[0, 40, 'out'], [0.1, 0, 'out'], [0.2, 172, 'out'], [0.42, 140, 'inOut']], -24);
const s3 = cut('dd_s3', [-1, 0.05, 0], [[0, -10, 'out'], [0.1, -40, 'out'], [0.24, 200, 'out'], [0.5, 170, 'inOut']], 40);
const s4: ClipDef = {
  name: 'dd_s4', dur: 0.42, fadeIn: 0.04, fadeOut: 0.15,
  events: { step: 0.06, combo: 0.26 },
  keys: mergeKeys(
    [
      ch(0, SG),
      ch(0.09, grip([-0.2, -0.1, -0.06], [-0.05, -0.04, 1], [-0.7, -0.3, -0.6]), 'out'),
      ch(0.16, grip([-0.1, 0.04, 0.52], [-0.08, 0.02, 1], [-0.7, -0.3, -0.4]), 'outExpo'),
      ch(0.26, grip([-0.1, 0.02, 0.5], [-0.08, 0, 1], [-0.7, -0.3, -0.4])),
      ch(0.42, SG, 'inOut'),
    ],
    [
      body(0, R(), HIPS),
      body(0.09, R({ hips: [0, -18, 0], chest: [0, -8, 0], 'thigh.R': [12, 0, -6], 'shin.R': [18, 0, 0] }), [0, -0.04, -0.02], 'out'),
      body(0.16, R({ hips: [4, 6, 0], spine: [8, 2, 0], chest: [4, 2, 0], 'thigh.L': [-36, 0, 4], 'shin.L': [30, 0, 0], 'thigh.R': [22, 0, -6], 'shin.R': [16, 0, 0] }), [0, -0.08, 0.12], 'outExpo'),
      body(0.42, R(), HIPS, 'inOut'),
    ],
  ),
};
const s5 = cut('dd_s5', [0.6, -0.8, 0], [[0, 30, 'out'], [0.1, 10, 'out'], [0.21, 174, 'out'], [0.5, 150, 'inOut']], 14, { launch: true });
s5.events = { step: 0.06 };

export const DADOU_CHAIN = ['dd_s1', 'dd_s2', 'dd_s3', 'dd_s4', 'dd_s5'];

// ================================================================== the Bankai's string (the nodachi, two hands)

const BH: C3 = [0, -0.02, 0];
const b1 = cut('db_s1', [-0.7, 0.7, 0], [[0, 40, 'out'], [0.14, -10, 'out'], [0.27, 176, 'out'], [0.55, 150, 'inOut']], 30, { grip: BSG, r: 0.4, two: true, hips: BH });
const b2 = cut('db_s2', [0.7, 0.7, 0], [[0, 40, 'out'], [0.14, -10, 'out'], [0.27, 176, 'out'], [0.55, 150, 'inOut']], -30, { grip: BSG, r: 0.4, two: true, hips: BH });
const b3 = cut('db_s3', [-1, 0.05, 0], [[0, -10, 'out'], [0.14, -50, 'out'], [0.3, 205, 'out'], [0.62, 175, 'inOut']], 46, { grip: BSG, r: 0.42, two: true, hips: BH });
const b4 = cut('db_s4', [0, 1, -0.2], [[0, -10, 'out'], [0.16, -60, 'out'], [0.32, 150, 'out'], [0.64, 130, 'inOut']], 0, { grip: BSG, r: 0.44, two: true, hips: BH });
const b5 = cut('db_s5', [0.6, -0.8, 0], [[0, 30, 'out'], [0.14, 10, 'out'], [0.28, 178, 'out'], [0.62, 150, 'inOut']], 18, { launch: true, grip: BSG, r: 0.42, two: true, hips: BH });
b5.events = { step: 0.06 };

export const DADOU_BANKAI_CHAIN = ['db_s1', 'db_s2', 'db_s3', 'db_s4', 'db_s5'];

// ================================================================== the string (floating, four arms)

const FH: C3 = [0, 0, 0];
/** the second pair's shoulders in the chest frame (m) */
const SH2R: C3 = [-0.17, 0.22, -0.1];
const SH2L: C3 = [0.17, 0.22, -0.1];

/** a cut by the main arm with the second pair cutting the mirrored arc a beat behind */
function cut4(name: string, a: C3, keys: [number, number, 'out' | 'inOut'][], twist: number, o: { launch?: boolean } = {}): ClipDef {
  const c = cut(name, a, keys, twist, { base: F, hips: FH, grip: FSG, r: 0.36, launch: o.launch });
  const lag = 0.03;
  const k2 = keys.map(([t, deg, e], i) => [i === 0 ? t : Math.min(keys[keys.length - 1][0], t + lag), deg, e] as [number, number, 'out' | 'inOut']);
  const end = keys[keys.length - 1][0];
  const am: C3 = [-a[0], a[1], a[2]];
  c.keys = mergeKeys(
    c.keys,
    swingKeys({ a, b: [0, 0, 1], c: [SH2R[0] - 0.12, SH2R[1] + 0.08, SH2R[2] + 0.22], r: 0.4, pole: [-0.6, -0.5, -0.6], keys: k2, hand: 'R2' }),
    swingKeys({ a: am, b: [0, 0, 1], c: [SH2L[0] + 0.12, SH2L[1] + 0.08, SH2L[2] + 0.22], r: 0.4, pole: [0.6, -0.5, -0.6], keys: k2, hand: 'L2' }),
    [ch(end, { '@ikR2': [0, 0, 0], '@ikL2': [0, 0, 0] }, 'inOut')],
  );
  return c;
}
const f1 = cut4('df_s1', [-0.7, 0.7, 0], [[0, 40, 'out'], [0.08, 0, 'out'], [0.17, 172, 'out'], [0.36, 140, 'inOut']], 22);
const f2 = cut4('df_s2', [0.7, 0.7, 0], [[0, 40, 'out'], [0.08, 0, 'out'], [0.17, 172, 'out'], [0.36, 140, 'inOut']], -22);
const f3 = cut4('df_s3', [-1, 0.05, 0], [[0, -10, 'out'], [0.08, -40, 'out'], [0.2, 200, 'out'], [0.42, 170, 'inOut']], 44);
const f4 = cut4('df_s4', [1, 0.05, 0], [[0, -10, 'out'], [0.08, -40, 'out'], [0.2, 200, 'out'], [0.42, 170, 'inOut']], -44);
const f5 = cut4('df_s5', [0.6, -0.8, 0], [[0, 30, 'out'], [0.08, 10, 'out'], [0.18, 174, 'out'], [0.4, 150, 'inOut']], 14, { launch: true });
const f6 = cut4('df_s6', [0, 1, -0.15], [[0, -20, 'out'], [0.12, -60, 'out'], [0.26, 160, 'out'], [0.56, 140, 'inOut']], 0);
f6.events = { step: 0.06 };

export const DADOU_FINAL_CHAIN = ['df_s1', 'df_s2', 'df_s3', 'df_s4', 'df_s5', 'df_s6'];

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

const PALM: B = { 'upperarm.L': [-84, 0, -4], 'forearm.L': [-4, 0, 0], 'hand.L': [-70, 0, 0] };
/** Haien: the left palm thrust out at the target */
const haien = poseClip('dd_haien', 0.6, { fire: 0.25 }, [
  [0, R(), SG],
  [0.18, R({ hips: [0, -8, 0], chest: [-4, -6, 0], head: [-4, 4, 0], 'upperarm.L': [-40, 0, 20], 'forearm.L': [-80, 0, 0], 'hand.L': [0, 0, 0] }), SG, [0, -0.02, -0.02], 'inOut'],
  [0.26, R({ hips: [2, 10, 0], spine: [6, 4, 0], chest: [4, 8, 0], head: [-2, -8, 0], ...PALM, 'thigh.L': [-28, 0, 4], 'shin.L': [24, 0, 0], 'thigh.R': [14, 0, -6], 'shin.R': [12, 0, 0] }), SG, [0, -0.04, 0.07], 'outExpo'],
  [0.44, R({ hips: [2, 10, 0], spine: [6, 4, 0], chest: [4, 8, 0], head: [-2, -8, 0], ...PALM, 'thigh.L': [-28, 0, 4], 'shin.L': [24, 0, 0], 'thigh.R': [14, 0, -6], 'shin.R': [12, 0, 0] }), SG, [0, -0.04, 0.07]],
  [0.6, R(), SG, HIPS, 'inOut'],
]);

/** Shakkahō: two fingers pointed and swept across a fan of five */
const POINT: B = { 'upperarm.L': [-92, 0, -6], 'forearm.L': [0, 0, 0], 'hand.L': [-10, 0, 0] };
const shakka = poseClip('dd_shakka', 0.65, { fire: 0.3 }, [
  [0, R(), SG],
  [0.16, R({ hips: [0, 26, 0], chest: [2, 18, 0], head: [-4, -20, 0], ...POINT, 'upperarm.L': [-92, -30, -6] }), SG, HIPS, 'outExpo'],
  [0.42, R({ hips: [0, 4, 0], chest: [2, -4, 0], head: [-4, 0, 0], ...POINT, 'upperarm.L': [-92, 30, -6] }), SG, HIPS, 'inOut'],
  [0.65, R(), SG, HIPS, 'inOut'],
]);

/** Ōi: the left palm raised and pressed down on the world before him; the chin up */
const oi = poseClip('dd_oi', 0.6, { press: 0.2 }, [
  [0, R(), SG],
  [0.12, R({ chest: [-6, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-70, 0, 6], 'forearm.L': [-40, 0, 0], 'hand.L': [70, 0, 0] }), SG, [0, 0.01, 0], 'outExpo'],
  [0.22, R({ hips: [4, 0, 0], chest: [2, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-40, 0, 6], 'forearm.L': [-20, 0, 0], 'hand.L': [80, 0, 0], 'thigh.L': [-14, 0, 8], 'shin.L': [20, 0, 0], 'thigh.R': [-6, 0, -8], 'shin.R': [20, 0, 0] }), SG, [0, -0.06, 0], 'outExpo'],
  [0.44, R({ hips: [4, 0, 0], chest: [2, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-40, 0, 6], 'forearm.L': [-20, 0, 0], 'hand.L': [80, 0, 0], 'thigh.L': [-14, 0, 8], 'shin.L': [20, 0, 0], 'thigh.R': [-6, 0, -8], 'shin.R': [20, 0, 0] }), SG, [0, -0.06, 0]],
  [0.6, R(), SG, HIPS, 'inOut'],
]);

/** Gochūtekkan: the left hand raised high, then brought down to point at the target — the pillars fall */
const gochu = poseClip('dd_gochu', 0.75, { cast: 0.35 }, [
  [0, R(), SG],
  [0.22, R({ chest: [-8, 6, 0], head: [-16, -4, 0], 'upperarm.L': [-170, 0, 10], 'forearm.L': [-10, 0, 0], 'hand.L': [0, 0, 0] }), SG, [0, 0.01, 0], 'inOut'],
  [0.34, R({ hips: [2, 12, 0], chest: [4, 12, 0], head: [-4, -12, 0], ...POINT, 'upperarm.L': [-70, 0, -6] }), SG, [0, -0.03, 0.03], 'outExpo'],
  [0.56, R({ hips: [2, 12, 0], chest: [4, 12, 0], head: [-4, -12, 0], ...POINT, 'upperarm.L': [-70, 0, -6] }), SG, [0, -0.03, 0.03]],
  [0.75, R(), SG, HIPS, 'inOut'],
]);

/** Gyokuza: he sits down on the throne behind him — one ankle on the other knee, the left elbow on the armrest, the
 *  chin on the knuckles, the blade across his lap — holds, and stands */
const SEATED: B = {
  hips: [-6, 0, 0], spine: [-4, 0, 0], chest: [-2, 6, 0], neck: [2, 0, 0], head: [-4, 10, 8],
  'thigh.L': [-84, 0, 14], 'shin.L': [80, 0, 0], 'foot.L': [0, 0, 0],
  'thigh.R': [-70, 0, -30], 'shin.R': [60, 0, 0], 'foot.R': [0, 0, -10],
  'upperarm.L': [-20, 0, 20], 'forearm.L': [-110, 0, 0], 'hand.L': [-20, 0, 30],
};
const throne = poseClip('dd_throne', 3.6, { sit: 0.5, erupt1: 1.2, erupt2: 2.4 }, [
  [0, R(), SG],
  [0.5, SEATED, grip([-0.26, -0.3, 0.26], [0.6, -0.1, 0.8], [-0.6, -0.4, -0.6]), [0, -0.44, -0.18], 'inOut'],
  [3.0, SEATED, grip([-0.26, -0.3, 0.26], [0.6, -0.1, 0.8], [-0.6, -0.4, -0.6]), [0, -0.44, -0.18]],
  [3.6, R(), SG, HIPS, 'inOut'],
], { fadeOut: 0.3 });

/** "Hirefuse, Hajun": the blade held level before him, the left hand drawn along it (fire follows the fingers), then
 *  the point lowered — everything bows */
const release = poseClip('dd_release', 1.0, { name: 0.25, burn: 0.6 }, [
  [0, R(), SG],
  [0.25, R({ chest: [-4, 0, 0], head: [-6, 0, 0], 'upperarm.L': [-70, 0, 0], 'forearm.L': [-60, 0, 0], 'hand.L': [-30, 0, 0] }), grip([-0.3, 0.1, 0.3], [0.95, 0.05, 0.3], [-0.7, -0.3, -0.5]), HIPS, 'inOut'],
  [0.55, R({ chest: [-4, -8, 0], head: [-6, 6, 0], 'upperarm.L': [-80, 40, 0], 'forearm.L': [-20, 0, 0], 'hand.L': [-30, 0, 0] }), grip([-0.3, 0.1, 0.3], [0.95, 0.05, 0.3], [-0.7, -0.3, -0.5])],
  [0.68, R({ hips: [4, 0, 0], chest: [4, 0, 0], head: [-10, 0, 0], 'upperarm.L': [-20, 0, 40], 'forearm.L': [-10, 0, 0] }), grip([-0.2, -0.12, 0.42], [-0.05, -0.6, 0.8], [-0.7, -0.4, -0.4]), [0, -0.03, 0.02], 'outExpo'],
  [1.0, R(), SG, HIPS, 'inOut'],
]);

/** Kokuen: the lunge — the point driven out low and the black fire pours off it */
const kokuen = poseClip('dd_kokuen', 0.7, { fire: 0.3 }, [
  [0, R(), SG],
  [0.18, R({ hips: [0, -22, 0], chest: [0, -12, 0], 'thigh.R': [14, 0, -6], 'shin.R': [20, 0, 0] }), grip([-0.2, -0.08, -0.1], [-0.05, -0.04, 1], [-0.7, -0.3, -0.6]), [0, -0.05, -0.03], 'inOut'],
  [0.3, R({ hips: [8, 8, 0], spine: [12, 4, 0], chest: [6, 4, 0], 'thigh.L': [-50, 0, 4], 'shin.L': [44, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [20, 0, 0], ...FREE }), grip([-0.08, -0.04, 0.62], [-0.06, -0.08, 1], [-0.7, -0.3, -0.4]), [0, -0.14, 0.2], 'outExpo'],
  [0.5, R({ hips: [8, 8, 0], spine: [12, 4, 0], chest: [6, 4, 0], 'thigh.L': [-50, 0, 4], 'shin.L': [44, 0, 0], 'thigh.R': [30, 0, -6], 'shin.R': [20, 0, 0], ...FREE }), grip([-0.08, -0.04, 0.6], [-0.06, -0.08, 1], [-0.7, -0.3, -0.4]), [0, -0.14, 0.2]],
  [0.7, R(), SG, HIPS, 'inOut'],
]);

/** Onibi: the left palm raised, the wisps gathering over it — then flicked at the target */
const onibi = poseClip('dd_onibi', 0.75, { raise: 0.15, fire: 0.5 }, [
  [0, R(), SG],
  [0.16, R({ chest: [-4, 8, 0], head: [-8, -4, 0], 'upperarm.L': [-100, 0, 30], 'forearm.L': [-40, 0, 0], 'hand.L': [60, 0, 0] }), SG, HIPS, 'inOut'],
  [0.44, R({ chest: [-4, 8, 0], head: [-8, -4, 0], 'upperarm.L': [-104, 0, 30], 'forearm.L': [-44, 0, 0], 'hand.L': [60, 0, 0] }), SG],
  [0.52, R({ hips: [2, 10, 0], chest: [2, 10, 0], head: [-4, -10, 0], ...PALM }), SG, [0, -0.02, 0.03], 'outExpo'],
  [0.75, R(), SG, HIPS, 'inOut'],
]);

/** Kensaku: the rope of fire thrown overhand with the left hand, then hauled in */
const kensaku = poseClip('dd_kensaku', 0.85, { throw: 0.25, pull: 0.55 }, [
  [0, R(), SG],
  [0.14, R({ hips: [0, -14, 0], chest: [-6, -12, 0], head: [-4, 10, 0], 'upperarm.L': [-150, 0, 40], 'forearm.L': [-40, 0, 0] }), SG, HIPS, 'inOut'],
  [0.26, R({ hips: [2, 14, 0], chest: [6, 14, 0], head: [-4, -12, 0], ...PALM, 'hand.L': [-20, 0, 0], 'thigh.L': [-24, 0, 4], 'shin.L': [20, 0, 0] }), SG, [0, -0.03, 0.05], 'outExpo'],
  [0.5, R({ hips: [2, 14, 0], chest: [6, 14, 0], head: [-4, -12, 0], ...PALM, 'hand.L': [-20, 0, 0], 'thigh.L': [-24, 0, 4], 'shin.L': [20, 0, 0] }), SG, [0, -0.03, 0.05]],
  [0.62, R({ hips: [-4, -10, 0], chest: [-8, -12, 0], head: [-6, 8, 0], 'upperarm.L': [-30, 0, 30], 'forearm.L': [-110, 0, 0], 'hand.L': [0, 0, 0], 'thigh.R': [14, 0, -6], 'shin.R': [18, 0, 0] }), SG, [0, -0.04, -0.06], 'outExpo'],
  [0.85, R(), SG, HIPS, 'inOut'],
]);

/** Gōka: the point lowered at the ground under the target, then lifted sharply — the pillar erupts */
const goka = poseClip('dd_goka', 0.85, { mark: 0.2, erupt: 0.6 }, [
  [0, R(), SG],
  [0.2, R({ hips: [4, 8, 0], chest: [6, 6, 0], head: [6, -6, 0], ...FREE }), grip([-0.16, -0.2, 0.42], [-0.04, -0.7, 0.7], [-0.7, -0.4, -0.4]), [0, -0.03, 0.02], 'inOut'],
  [0.5, R({ hips: [4, 8, 0], chest: [6, 6, 0], head: [6, -6, 0], ...FREE }), grip([-0.16, -0.22, 0.42], [-0.04, -0.7, 0.7], [-0.7, -0.4, -0.4])],
  [0.6, R({ chest: [-8, 0, 0], head: [-10, 0, 0], ...FREE }), grip([-0.2, 0.3, 0.2], [-0.04, 0.96, 0.25], [-0.8, -0.3, -0.4], [0, 0, 1]), [0, 0.01, 0], 'outExpo'],
  [0.85, R(), SG, HIPS, 'inOut'],
]);

/** Hyakki Yakō: the left arm swept forward from behind him, the fingers spread — the parade charges */
const hyakki = poseClip('dd_hyakki', 0.9, { call: 0.45 }, [
  [0, R(), SG],
  [0.3, R({ hips: [0, -18, 0], chest: [-6, -16, 0], head: [-6, 12, 0], 'upperarm.L': [40, 0, 50], 'forearm.L': [-10, 0, 0], 'hand.L': [0, 0, 0] }), SG, HIPS, 'inOut'],
  [0.46, R({ hips: [4, 16, 0], spine: [6, 6, 0], chest: [4, 12, 0], head: [-8, -14, 0], 'upperarm.L': [-96, 0, 30], 'forearm.L': [-6, 0, 0], 'hand.L': [-40, 0, 0], 'thigh.L': [-28, 0, 6], 'shin.L': [26, 0, 0] }), SG, [0, -0.04, 0.06], 'outExpo'],
  [0.7, R({ hips: [4, 16, 0], spine: [6, 6, 0], chest: [4, 12, 0], head: [-8, -14, 0], 'upperarm.L': [-98, 0, 30], 'forearm.L': [-6, 0, 0], 'hand.L': [-40, 0, 0], 'thigh.L': [-28, 0, 6], 'shin.L': [26, 0, 0] }), SG, [0, -0.04, 0.06]],
  [0.9, R(), SG, HIPS, 'inOut'],
]);

/** the Bankai: the blade lifted in both hands, then driven point-down into the ground before him */
const bankai = poseClip('dd_bankai', 1.5, { name: 0.3, rise: 0.85 }, [
  [0, R(), SG],
  [0.4, R({ spine: [-4, 0, 0], chest: [-8, 0, 0], head: [-14, 0, 0] }), { ...grip([-0.08, 0.36, 0.22], [0, 0.94, 0.34], [-0.8, -0.3, -0.4], [0, 0, 1]), '@twoHand': [1, 0, 0] }, [0, 0.01, 0], 'inOut'],
  [0.78, R({ spine: [-6, 0, 0], chest: [-10, 0, 0], head: [-16, 0, 0] }), { ...grip([-0.08, 0.4, 0.22], [0, 0.94, 0.34], [-0.8, -0.3, -0.4], [0, 0, 1]), '@twoHand': [1, 0, 0] }],
  [0.88, R({ hips: [16, 0, 0], spine: [20, 0, 0], chest: [10, 0, 0], head: [6, 0, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [70, 0, 0], 'thigh.R': [-10, 0, -6], 'shin.R': [80, 0, 0] }), { ...grip([-0.06, -0.24, 0.34], [0, -1, 0.06], [-0.7, -0.4, -0.4], [0, 0, 1]), '@twoHand': [1, 0, 0] }, [0, -0.26, 0.06], 'outExpo'],
  [1.25, R({ hips: [16, 0, 0], spine: [20, 0, 0], chest: [10, 0, 0], head: [-2, 0, 0], 'thigh.L': [-50, 0, 6], 'shin.L': [70, 0, 0], 'thigh.R': [-10, 0, -6], 'shin.R': [80, 0, 0] }), { ...grip([-0.06, -0.26, 0.34], [0, -1, 0.06], [-0.7, -0.4, -0.4], [0, 0, 1]), '@twoHand': [1, 0, 0] }, [0, -0.26, 0.06]],
  [1.5, R(), { ...BSG, '@twoHand': [0, 0, 0] }, HIPS, 'inOut'],
], { fadeOut: 0.3 });

// ================================================================== skills (the Bankai)

/** the Gates: the left hand raised with the fingers clawed, then closed and pulled down */
const gates = poseClip('db_gates', 1.3, { rise: 0.3, open: 0.9 }, [
  [0, R(), BSG],
  [0.3, R({ chest: [-6, 10, 0], head: [-10, -8, 0], 'upperarm.L': [-140, 0, 20], 'forearm.L': [-30, 0, 0], 'hand.L': [40, 0, 0] }), BSG, [0, 0.01, 0], 'inOut'],
  [0.86, R({ chest: [-6, 10, 0], head: [-10, -8, 0], 'upperarm.L': [-144, 0, 20], 'forearm.L': [-34, 0, 0], 'hand.L': [40, 0, 0] }), BSG],
  [0.96, R({ hips: [4, 12, 0], chest: [6, 14, 0], head: [-2, -12, 0], 'upperarm.L': [-60, 0, 10], 'forearm.L': [-60, 0, 0], 'hand.L': [-20, 0, 0] }), BSG, [0, -0.04, 0.02], 'outExpo'],
  [1.3, R(), BSG, HIPS, 'inOut'],
], { fadeOut: 0.25 });

/** the Wardens' Chains: both arms raised, then brought down hard — the chains burst from the ground */
const chains = poseClip('db_chains', 0.95, { cast: 0.5 }, [
  [0, R(), BSG],
  [0.36, R({ spine: [-6, 0, 0], chest: [-10, 0, 0], head: [-16, 0, 0], 'upperarm.L': [-160, 0, 30], 'forearm.L': [-20, 0, 0] }), { ...grip([-0.1, 0.42, 0.1], [0, 0.95, -0.3], [-0.8, -0.3, -0.4], [0, 0, 1]) }, [0, 0.02, 0], 'inOut'],
  [0.5, R({ hips: [10, 0, 0], spine: [14, 0, 0], chest: [10, 0, 0], head: [4, 0, 0], 'upperarm.L': [-40, 0, 40], 'forearm.L': [-20, 0, 0], 'thigh.L': [-30, 0, 8], 'shin.L': [44, 0, 0], 'thigh.R': [-8, 0, -8], 'shin.R': [40, 0, 0] }), grip([-0.2, -0.3, 0.3], [-0.2, -0.85, 0.5], [-0.7, -0.4, -0.4]), [0, -0.14, 0.04], 'outExpo'],
  [0.75, R({ hips: [10, 0, 0], spine: [14, 0, 0], chest: [10, 0, 0], head: [4, 0, 0], 'upperarm.L': [-40, 0, 40], 'forearm.L': [-20, 0, 0], 'thigh.L': [-30, 0, 8], 'shin.L': [44, 0, 0], 'thigh.R': [-8, 0, -8], 'shin.R': [40, 0, 0] }), grip([-0.2, -0.3, 0.3], [-0.2, -0.85, 0.5], [-0.7, -0.4, -0.4]), [0, -0.14, 0.04]],
  [0.95, R(), BSG, HIPS, 'inOut'],
]);

/** the Demon's Hand: the left arm reaches out, the hand closes, lifts high, and slams down (the giant copies it) */
const grab = poseClip('db_grab', 1.4, { grab: 0.35, lift: 0.6, slam: 0.95 }, [
  [0, R(), BSG],
  [0.32, R({ hips: [4, 14, 0], chest: [6, 14, 0], head: [-2, -12, 0], 'upperarm.L': [-80, 0, -4], 'forearm.L': [-6, 0, 0], 'hand.L': [-40, 0, 0], 'thigh.L': [-24, 0, 4], 'shin.L': [20, 0, 0] }), BSG, [0, -0.03, 0.04], 'outExpo'],
  [0.4, R({ hips: [4, 14, 0], chest: [6, 14, 0], head: [-2, -12, 0], 'upperarm.L': [-80, 0, -4], 'forearm.L': [-30, 0, 0], 'hand.L': [-10, 0, 0], 'thigh.L': [-24, 0, 4], 'shin.L': [20, 0, 0] }), BSG, [0, -0.03, 0.04]],
  [0.7, R({ spine: [-6, 0, 0], chest: [-10, 4, 0], head: [-18, -4, 0], 'upperarm.L': [-170, 0, 10], 'forearm.L': [-20, 0, 0], 'hand.L': [0, 0, 0] }), BSG, [0, 0.02, 0], 'inOut'],
  [0.96, R({ hips: [14, 6, 0], spine: [18, 4, 0], chest: [12, 4, 0], head: [6, -4, 0], 'upperarm.L': [-60, 0, 10], 'forearm.L': [-10, 0, 0], 'hand.L': [0, 0, 0], 'thigh.L': [-40, 0, 8], 'shin.L': [56, 0, 0], 'thigh.R': [-10, 0, -8], 'shin.R': [50, 0, 0] }), BSG, [0, -0.2, 0.05], 'outExpo'],
  [1.4, R(), BSG, HIPS, 'inOut'],
], { fadeOut: 0.25 });

/** the Eight Burning Hells: a stamp of the right foot and the blade driven into the ground at his side */
const hells = poseClip('db_hells', 1.0, { cast: 0.4 }, [
  [0, R(), BSG],
  [0.28, R({ hips: [-4, 0, 0], chest: [-6, 0, 0], head: [-8, 0, 0], 'thigh.R': [-60, 0, -6], 'shin.R': [70, 0, 0], ...FREE }), grip([-0.24, 0.1, 0.2], [-0.1, 0.9, 0.4], [-0.8, -0.3, -0.4], [0, 0, 1]), [0, 0.03, 0], 'inOut'],
  [0.4, R({ hips: [10, 0, 0], spine: [12, 0, 0], chest: [8, 0, 0], head: [2, 0, 0], 'thigh.L': [-20, 0, 8], 'shin.L': [30, 0, 0], 'thigh.R': [10, 0, -8], 'shin.R': [20, 0, 0], ...FREE }), grip([-0.3, -0.34, 0.2], [-0.15, -1, 0.1], [-0.7, -0.4, -0.4], [0, 0, 1]), [0, -0.12, 0], 'outExpo'],
  [0.78, R({ hips: [10, 0, 0], spine: [12, 0, 0], chest: [8, 0, 0], head: [-6, 0, 0], 'thigh.L': [-20, 0, 8], 'shin.L': [30, 0, 0], 'thigh.R': [10, 0, -8], 'shin.R': [20, 0, 0], ...FREE }), grip([-0.3, -0.36, 0.2], [-0.15, -1, 0.1], [-0.7, -0.4, -0.4], [0, 0, 1]), [0, -0.12, 0]],
  [1.0, R(), BSG, HIPS, 'inOut'],
]);

/** the Great Demon's Cut: the nodachi raised high overhead in both hands, held, then brought down through everything */
const daitenma = poseClip('db_daitenma', 1.6, { raise: 0.3, cut: 1.1 }, [
  [0, R(), BSG],
  [0.5, R({ spine: [-8, 0, 0], chest: [-14, 0, 0], head: [-16, 0, 0], 'thigh.L': [-20, 0, 6], 'shin.L': [20, 0, 0] }), { ...grip([-0.06, 0.5, -0.06], [0, 0.5, -0.86], [-0.8, -0.3, -0.4], [0, 0, 1]), '@twoHand': [1, 0, 0] }, [0, 0.02, -0.02], 'inOut'],
  [1.0, R({ spine: [-10, 0, 0], chest: [-16, 0, 0], head: [-18, 0, 0], 'thigh.L': [-22, 0, 6], 'shin.L': [22, 0, 0] }), { ...grip([-0.06, 0.52, -0.08], [0, 0.45, -0.89], [-0.8, -0.3, -0.4], [0, 0, 1]), '@twoHand': [1, 0, 0] }, [0, 0.02, -0.02]],
  [1.14, R({ hips: [18, 0, 0], spine: [22, 0, 0], chest: [12, 0, 0], head: [4, 0, 0], 'thigh.L': [-56, 0, 6], 'shin.L': [60, 0, 0], 'thigh.R': [24, 0, -6], 'shin.R': [30, 0, 0] }), { ...grip([-0.06, -0.24, 0.5], [0, -0.75, 0.66], [-0.7, -0.4, -0.4], [0, 0, 1]), '@twoHand': [1, 0, 0] }, [0, -0.2, 0.14], 'outExpo'],
  [1.4, R({ hips: [18, 0, 0], spine: [22, 0, 0], chest: [12, 0, 0], head: [0, 0, 0], 'thigh.L': [-56, 0, 6], 'shin.L': [60, 0, 0], 'thigh.R': [24, 0, -6], 'shin.R': [30, 0, 0] }), { ...grip([-0.06, -0.26, 0.5], [0, -0.75, 0.66], [-0.7, -0.4, -0.4], [0, 0, 1]), '@twoHand': [1, 0, 0] }, [0, -0.2, 0.14]],
  [1.6, R(), { ...BSG, '@twoHand': [0, 0, 0] }, HIPS, 'inOut'],
], { fadeOut: 0.3 });

/** "Tenka Fubu": the left hand closed before his face — then the arms thrown open, the head back, and he rises */
const kaigen = poseClip('db_tenka', 1.6, { name: 0.3, rise: 0.8 }, [
  [0, R(), BSG],
  [0.3, R({ neck: [6, 0, 0], head: [10, 0, 0], 'upperarm.L': [-60, 0, -30], 'forearm.L': [-110, 0, 0], 'hand.L': [-10, 0, 0] }), grip([-0.18, -0.08, 0.24], [0, -0.35, 0.94], [-0.7, -0.3, -0.5]), [0, -0.03, 0], 'inOut'],
  [0.7, R({ neck: [6, 0, 0], head: [12, 0, 0], 'upperarm.L': [-60, 0, -30], 'forearm.L': [-112, 0, 0], 'hand.L': [-10, 0, 0] }), grip([-0.18, -0.08, 0.24], [0, -0.35, 0.94], [-0.7, -0.3, -0.5])],
  [1.0, F({ spine: [-8, 0, 0], chest: [-14, 0, 0], head: [-24, 0, 0], 'upperarm.L': [-20, 0, 80], 'forearm.L': [-6, 0, 0], 'hand.L': [0, 0, 16] }), grip([-0.52, 0.1, 0.1], [-0.82, 0.3, 0.48], [-0.6, -0.4, -0.6]), [0, 0.04, 0], 'inOut'],
  [1.6, F(), FSG, [0, 0, 0], 'inOut'],
], { fadeOut: 0.3 });

// ================================================================== skills (floating)

const FA2 = (over: B = {}): B => F(over);
/** Gokuen-hō: all four hands brought together before him, the beam pours out of them */
const cannon = poseClip('df_cannon', 2.1, { charge: 0.2, fire: 0.5 }, [
  [0, F(), FSG, [0, 0, 0]],
  [0.35, FA2({ chest: [-4, 0, 0], head: [-4, 0, 0], 'upperarm.L': [-84, 0, -10], 'forearm.L': [-20, 0, 0], 'hand.L': [-60, 0, 0], 'upperarm2.L': [-80, 0, 30], 'forearm2.L': [-20, 0, 0], 'upperarm2.R': [-80, 0, -30], 'forearm2.R': [-20, 0, 0] }), grip([-0.06, 0.02, 0.44], [0.1, 0.05, 1], [-0.7, -0.4, -0.4]), [0, 0, 0], 'inOut'],
  [1.8, FA2({ chest: [-4, 0, 0], head: [-4, 0, 0], 'upperarm.L': [-86, 0, -10], 'forearm.L': [-20, 0, 0], 'hand.L': [-60, 0, 0], 'upperarm2.L': [-82, 0, 30], 'forearm2.L': [-20, 0, 0], 'upperarm2.R': [-82, 0, -30], 'forearm2.R': [-20, 0, 0] }), grip([-0.06, 0.02, 0.44], [0.1, 0.05, 1], [-0.7, -0.4, -0.4])],
  [2.1, F(), FSG, [0, 0, 0], 'inOut'],
], { fadeOut: 0.3 });

/** Kaen-rin: the second pair reach back for the wheel and hurl it forward */
const wheel = poseClip('df_wheel', 0.9, { throw: 0.4 }, [
  [0, F(), FSG, [0, 0, 0]],
  [0.3, FA2({ chest: [-8, 0, 0], head: [-8, 0, 0], 'upperarm2.L': [-170, 0, 40], 'forearm2.L': [-20, 0, 0], 'upperarm2.R': [-170, 0, -40], 'forearm2.R': [-20, 0, 0] }), FSG, [0, 0, 0], 'inOut'],
  [0.42, FA2({ hips: [6, 0, 0], spine: [10, 0, 0], chest: [8, 0, 0], head: [0, 0, 0], 'upperarm2.L': [-80, 0, 20], 'forearm2.L': [-10, 0, 0], 'upperarm2.R': [-80, 0, -20], 'forearm2.R': [-10, 0, 0] }), FSG, [0, 0, 0], 'outExpo'],
  [0.9, F(), FSG, [0, 0, 0], 'inOut'],
]);

/** Muken: the left hand opened at the target, then closed into a fist — the hell closes round it */
const muken = poseClip('df_muken', 0.8, { cast: 0.3 }, [
  [0, F(), FSG, [0, 0, 0]],
  [0.2, F({ hips: [0, 14, 0], chest: [-2, 12, 0], head: [-4, -12, 0], 'upperarm.L': [-88, 0, -6], 'forearm.L': [-6, 0, 0], 'hand.L': [-80, 0, 0] }), FSG, [0, 0, 0.03], 'outExpo'],
  [0.32, F({ hips: [0, 14, 0], chest: [-2, 12, 0], head: [-4, -12, 0], 'upperarm.L': [-84, 0, -6], 'forearm.L': [-30, 0, 0], 'hand.L': [-10, 0, 0] }), FSG, [0, 0, 0.03], 'outExpo'],
  [0.6, F({ hips: [0, 14, 0], chest: [-2, 12, 0], head: [-4, -12, 0], 'upperarm.L': [-84, 0, -6], 'forearm.L': [-32, 0, 0], 'hand.L': [-10, 0, 0] }), FSG, [0, 0, 0.03]],
  [0.8, F(), FSG, [0, 0, 0], 'inOut'],
]);

/** Tenma Kōrin: the blade raised point-down overhead, held, then stabbed down (the colossus stabs with him) */
const descent = poseClip('df_descent', 1.4, { raise: 0.4, stab: 1.0 }, [
  [0, F(), FSG, [0, 0, 0]],
  [0.4, F({ spine: [-6, 0, 0], chest: [-10, 0, 0], head: [-14, 0, 0] }), { ...grip([-0.08, 0.48, 0.18], [0, -0.2, 0.98], [-0.8, -0.3, -0.4], [0, 1, 0]), '@twoHand': [1, 0, 0] }, [0, 0.02, 0], 'inOut'],
  [0.94, F({ spine: [-8, 0, 0], chest: [-12, 0, 0], head: [-16, 0, 0] }), { ...grip([-0.08, 0.5, 0.18], [0, -0.2, 0.98], [-0.8, -0.3, -0.4], [0, 1, 0]), '@twoHand': [1, 0, 0] }],
  [1.04, F({ hips: [14, 0, 0], spine: [18, 0, 0], chest: [10, 0, 0], head: [4, 0, 0] }), { ...grip([-0.06, -0.3, 0.36], [0, -1, 0.1], [-0.7, -0.4, -0.4], [0, 0, 1]), '@twoHand': [1, 0, 0] }, [0, -0.06, 0.04], 'outExpo'],
  [1.4, F(), { ...FSG, '@twoHand': [0, 0, 0] }, [0, 0, 0], 'inOut'],
], { fadeOut: 0.3 });

/** Tenka Fubu: all four arms raised to the sky — held while the ceiling of fire spreads — then thrown down */
const tenka = poseClip('df_tenka', 1.6, { call: 0.8, rain: 1.2 }, [
  [0, F(), FSG, [0, 0, 0]],
  [0.5, FA2({ spine: [-10, 0, 0], chest: [-16, 0, 0], head: [-28, 0, 0], 'upperarm.L': [-170, 0, 20], 'forearm.L': [-10, 0, 0], 'upperarm2.L': [-160, 0, 60], 'forearm2.L': [-10, 0, 0], 'upperarm2.R': [-160, 0, -60], 'forearm2.R': [-10, 0, 0] }), grip([-0.12, 0.5, 0.04], [-0.05, 1, 0.08], [-0.8, -0.3, -0.4], [0, 0, 1]), [0, 0.03, 0], 'inOut'],
  [1.1, FA2({ spine: [-10, 0, 0], chest: [-18, 0, 0], head: [-30, 0, 0], 'upperarm.L': [-172, 0, 20], 'forearm.L': [-10, 0, 0], 'upperarm2.L': [-162, 0, 60], 'forearm2.L': [-10, 0, 0], 'upperarm2.R': [-162, 0, -60], 'forearm2.R': [-10, 0, 0] }), grip([-0.12, 0.52, 0.04], [-0.05, 1, 0.08], [-0.8, -0.3, -0.4], [0, 0, 1])],
  [1.24, FA2({ hips: [6, 0, 0], spine: [12, 0, 0], chest: [8, 0, 0], head: [0, 0, 0], 'upperarm.L': [-40, 0, 40], 'forearm.L': [-10, 0, 0], 'upperarm2.L': [-50, 0, 80], 'forearm2.L': [-10, 0, 0], 'upperarm2.R': [-50, 0, -80], 'forearm2.R': [-10, 0, 0] }), grip([-0.2, -0.1, 0.44], [-0.1, -0.6, 0.8], [-0.7, -0.4, -0.4]), [0, 0, 0.04], 'outExpo'],
  [1.6, F(), FSG, [0, 0, 0], 'inOut'],
], { fadeOut: 0.3 });

/** the seal: the arms lowered, the blade swept down */
const seal = poseClip('df_seal', 0.5, { cast: 0.2 }, [
  [0, F(), FSG, [0, 0, 0]],
  [0.2, F({ head: [6, 0, 0], 'upperarm.L': [-30, 0, -10], 'forearm.L': [-90, 0, 0] }), grip([-0.2, -0.1, 0.3], [0, -0.5, 0.86], [-0.7, -0.3, -0.5]), [0, 0, 0], 'inOut'],
  [0.5, F(), FSG, [0, 0, 0], 'inOut'],
]);

// ================================================================== sets

const COMMON = [s1, s2, s3, s4, s5, haien, shakka, oi, gochu, throne, release, kokuen, onibi, kensaku, goka, hyakki, bankai];
const BANKAI = [b1, b2, b3, b4, b5, gates, chains, grab, hells, daitenma, kaigen];
const FINAL = [float, f1, f2, f3, f4, f5, f6, cannon, wheel, muken, descent, tenka, seal];
export const DADOU_CLIPS: ClipDef[] = [...SHARED, ...COMMON, ...BANKAI, ...FINAL];
