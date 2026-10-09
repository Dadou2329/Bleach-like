// Pernida Parnkgjas, Sternritter "C" — The Compulsory, the Left Arm of the Soul King (docs/roster/H1-vandenreich-leaders.md
// § Pernida Parnkgjas; kit docs/kits/pernida.md).
// Brief — the cloak: 150 cm → 72 vox at 48/m. Silhouette keys: a small figure that is all cloak, a deep hood with
// nothing in it but two gold points, the long white cloak flaring to the ground, one pale long-fingered left hand out
// of the sleeve (the right sleeve hangs dark and empty). Look: the Schutzstaffel cloak (white #EFEEE9, shade #C5C6CB),
// three buttons down the front, the dark-red Hagal rune on its left breast.
// The hand and the arm at 16 vox/m (a giant: 6 % of the 48/m detail, close to the world's 8/m): the hand 4.5 m — a
// palm 1.45 × 1.25 m with the eye in it (two pupils in a gold iris), fingers up, the thumb on its right (−X: a left
// hand held up palm forward), iron bands round the fingertips where the chains hold, the Hagal rune on the wrist —
// standing on four nerve roots (the quad legs) out of a knot of nerves under the cut wrist. The arm: the same hand on
// a forearm and an upper arm, 11.7 m, the stump at the bottom spilling muscle, tendon and bone into the roots, broken
// chain ends hanging from the bands. The clone: the hand with one pupil and no rune.
// Forms: 'cloak', 'voll' (the cloak + the hand-shaped wings), 'hand', 'arm', 'clone'.
// Props: 'bow' (48/m: the cloak's Heilig Bogen, its limbs along +Z, the string toward +Y), 'bow-tip' (16/m: a fingertip
// bow), 'stone-hand' (8/m — the world's density — a stone left hand with its wrist sunk in the ground), 'finger' (16/m:
// a severed finger), 'halo' (48/m: the Zeichen halo), 'mouth' (16/m: the palm's mouth with its eyed tongue).
// (verify) the cloak's button count (three, per the dossier); the arm's height (8-12 m est.); the nerve colour.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, intersect, offset, rotate, smoothPath, sphere, spike, subtract, torus, tube, type Sdf, type V3 } from '../models/sdf';
import { addBands, humanoidSkeleton, type HumanoidSpec, type Landmarks } from './humanoid';
import { badge } from './sternritter';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

export const PERNIDA_RES = 48;
export const HAND_RES = 16;
export type PernidaForm = 'cloak' | 'voll' | 'hand' | 'arm' | 'clone';

/** 150 cm: small and narrow, all of it under the cloak. */
const SPEC: HumanoidSpec = {
  H: 72,
  chinY: 61,
  head: { w: 9, d: 10, h: 11 },
  neckR: 2.4,
  shoulder: [7.4, 56, -0.5],
  upperArm: 12,
  foreArm: 11,
  hand: 9,
  armR: 2.2,
  hipsY: 38,
  hip: [3.8, 36, 0],
  kneeY: 19.5,
  ankleY: 4,
  chest: [7, 4.4],
  waist: [6, 3.8],
  hips: [6.4, 4.2],
  chestY: 51,
  waistY: 43,
  foot: { len: 10, w: 4.2, heel: 2.6 },
};

/** The Hagal rune of the Wandenreich, 7×7: a stroke with an X through it. */
const HAGAL = [
  'X . . X . . X',
  '. X . X . X .',
  '. . X X X . .',
  '. . . X . . .',
  '. . X X X . .',
  '. X . X . X .',
  'X . . X . . X',
];

/**
 * The palm's eye, 15 × 9 as seen from the front: a lid fold (u), the lid line (l), the sclera (S), a gold iris with a
 * darker rim (i, I) and a glint (h), two pupils (P) set on a slant — polycoria.
 */
const EYE = [
  '. . . . . u u u u u . . . . .',
  '. . . u u l l l l l u u . . .',
  '. u l l S S i i i S S l l u .',
  'u l S S S i I h P i S S S l u',
  'u l S S i I P I P I i S S l u',
  'u l S S S i P I I i S S S l u',
  '. u l l S S i i i S S l l u .',
  '. . . u u l l l l l u u . . .',
  '. . . . . u u u u u . . . . .',
];
/** a clone's: one pupil, a slit */
const EYE_CLONE = EYE.map((row, r) => (r === 3 ? 'u l S S S i I P I i S S S l u' : r === 4 ? 'u l S S i I I P I I i S S l u' : r === 5 ? 'u l S S S i I P I i S S S l u' : row));

const assetCache = new Map<string, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function pernidaAsset(form: PernidaForm = 'cloak'): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildPernida(form)));
  return a;
}

export function buildPernida(form: PernidaForm = 'cloak'): CharacterAsset {
  return form === 'cloak' || form === 'voll' ? buildCloak(form === 'voll') : buildGiant(form);
}

export type PernidaProp = 'bow' | 'bow-tip' | 'stone-hand' | 'finger' | 'halo' | 'mouth';

export function pernidaProp(kind: PernidaProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    const make: Record<PernidaProp, () => VoxelModel> = {
      bow: () => buildBow(false), 'bow-tip': () => buildBow(true), 'stone-hand': buildStoneHand, finger: buildFinger, halo: buildHalo, mouth: buildMouth,
    };
    propCache.set(kind, (m = make[kind]()));
  }
  return m;
}

// ---------------------------------------------------------------------------------------------- the cloak

function cloakPalette(b: ModelBuilder, voll: boolean): void {
  b.mat('cloak', ['#F1F0EB', '#EFEEE9', '#DCDBD6', '#C5C6CB', '#A9AAB0'], { base: 1, rough: 0.78, shadeK: 0.9 });
  b.mat('cloakIn', ['#C9C8C3', '#B0AFAA', '#96958F'], { base: 1, rough: 0.85 });
  b.mat('void', ['#17171C', '#141418'], { base: 1, rough: 1, shadeK: 0 });
  b.mat('eyeGlow', ['#FFE07A', '#FFD34D'], { glow: 2.6 });
  b.mat('rune', ['#7A1520', '#6D111A', '#560B11'], { base: 1, rough: 0.6 });
  b.mat('button', ['#D2D6DC', '#A7ACB5', '#8A909A'], { base: 1, rough: 0.3, metal: 0.8 });
  b.mat('skin', ['#F1E7DC', '#E9DED3', '#D8CABD', '#BFAE9F', '#A39282'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('nail', ['#E2D3C6', '#D9C8BA', '#C2B0A1'], { base: 1, rough: 0.4 });
  if (voll) {
    b.mat('wing', ['#FFF2C4', '#F7DD84', '#F2C84B', '#D9A830'], { base: 1, rough: 0.35, glow: 0.9, shadeK: 0.8 });
    b.mat('wingLine', ['#D9A830', '#B8861A'], { base: 0, glow: 0.6 });
  }
}

function buildCloak(voll: boolean): CharacterAsset {
  const b = new ModelBuilder(voll ? 'pernida-voll' : 'pernida-cloak', PERNIDA_RES);
  cloakPalette(b, voll);
  const s = SPEC;
  const L = humanoidSkeleton(b, s);
  const [wx, wy, wz] = L.wrist;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1];
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.2, wz + 0.4]);
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.2, wz + 0.4]);
  b.socket('palm.L', 'palm.L', [wx - 0.4, wy - 4.5, wz + 0.4]);
  b.socket('palm.R', 'forearm.R', [-wx, wy - 2, wz - 0.4]);
  b.socket('tip.L', 'palm.L', [wx - 0.2, wy - 13, wz + 0.4]);
  b.socket('sleeve.L', 'forearm.L', [wx, wy - 2.6, wz - 0.4]);
  b.socket('sleeve.R', 'forearm.R', [-wx, wy - 2.6, wz - 0.4]);
  b.socket('back', 'chest', [0, s.chestY + 2, -7]);
  b.socket('chest.front', 'chest', [0, s.chestY, 7]);
  const hc: V3 = [0, s.chinY + 5.6, -0.8];
  b.socket('face', 'head', [0, hc[1], 4.4]);
  b.socket('eye.L', 'head', [2.1, hc[1] + 0.4, 4.0]);
  b.socket('eye.R', 'head', [-2.1, hc[1] + 0.4, 4.0]);
  b.socket('halo', 'head', [0, hc[1] + 10.5, -5]);
  // the body under it: just enough for the cloak to hang on
  const torso = blend(2.6, capsule([0, s.waistY - 3, -0.4], [0, s.chestY + 1, -0.4], 5.8, 6.6), ellipsoid([0, sy - 1.2, -0.6], [sx + 0.4, 3.4, 4.2]));
  const mantle = blend(2.0, offset(torso, 1.5), cylinder([0, sy - 4, -0.8], [0, s.chinY + 1.5, -0.8], s.neckR + 2.9, s.neckR + 2.1));
  addBands(b, intersect(mantle, aabb([-40, s.waistY - 5, -40], [40, 200, 40])), 'cloak', [['spine', s.waistY - 5, s.chestY - 4], ['chest', s.chestY - 4, s.chinY - 3], ['neck', s.chinY - 3, 200]]);
  // the cowl: a short cape from under the hood over the shoulders, its hem a little ragged
  const cy0 = s.chestY - 3, cy1 = s.chinY + 1.5;
  const cowlR = (y: number, th: number) => {
    const k = Math.max(0, Math.min(1, (cy1 - y) / (cy1 - cy0)));
    return 5.6 + 5.6 * Math.pow(k, 0.8) + 0.45 * Math.sin(th * 7) * k;
  };
  const cowl = fn((x, y, z) => {
    const zz = (z + 0.8) / 0.86;
    const r = Math.hypot(x, zz), th = Math.atan2(x, zz);
    const hem = cy0 + 0.8 * Math.sin(th * 5 + 0.6);
    return Math.max(Math.abs(r - cowlR(y, th) + 0.9) - 1.1, hem - y, y - cy1);
  }, [-14, cy0 - 3, -14], [14, cy1 + 1, 14]);
  addBands(b, cowl, 'cloak', [['chest', cy0 - 3, s.chinY - 3], ['neck', s.chinY - 3, 200]]);
  b.paint(['chest', 'neck'], fn((x, y, z) => Math.hypot(x, (z + 0.8) / 0.86) - (cowlR(y, Math.atan2(x, (z + 0.8) / 0.86)) - 1.0), [-14, cy0 - 3, -14], [14, cy1 + 1, 14]), 'cloakIn', { where: b.isMat('cloak') });
  // the seam down the front, three buttons, the rune on its left breast
  b.paint(['chest', 'spine'], box([0, s.chestY - 3, 9], [0.45, 12, 4]), 'cloak', { shade: 3, where: b.isMat('cloak') });
  for (const y of [s.chestY + 4, s.chestY - 2, s.waistY + 1]) badge(b, ['o'], 0, y, 'button');
  badge(b, HAGAL, 4.2, s.chestY + 5, 'rune');
  // the robe: one bell of cloth from the waist to the ground, closed, deep folds widening toward the hem (it glides —
  // there are no legs under it to see)
  robe(b, s.waistY - 2);
  hood(b, hc);
  sleeves(b, L);
  leftHand(b, L);
  if (voll) wings(b, s);
  b.autoShade();
  b.lint();
  return {
    model: b.build(),
    springs: [],
    colliders: [],
    warnings: b.warnings,
  };
}

/** The bell of the robe on the hips: a thick shell, five deep folds a side, the hem hanging a hand above the ground. */
function robe(b: ModelBuilder, yTop: number): void {
  const yHem = 1.5;
  const R = (y: number, th: number) => {
    const k = Math.max(0, Math.min(1, (yTop - y) / (yTop - yHem)));
    return 6.9 + 5.2 * Math.pow(k, 1.25) + (0.4 + 1.1 * k) * Math.sin(th * 5 + 0.4) * Math.min(1, k * 2.2);
  };
  const hem = (th: number) => yHem + 0.7 * Math.sin(th * 3 + 1.1) + 0.5 * Math.sin(th * 7);
  const shell = fn((x, y, z) => {
    const zz = (z + 0.4) / 0.9;
    const r = Math.hypot(x, zz), th = Math.atan2(x, zz);
    return Math.max(Math.abs(r - R(y, th) + 1.0) - 1.25, hem(th) - y, y - yTop);
  }, [-20, 0, -20], [20, yTop + 1, 20]);
  b.add('hips', shell, 'cloak');
  // the inside dark, the closing seam carried down the front
  b.paint('hips', fn((x, y, z) => Math.hypot(x, (z + 0.4) / 0.9) - (R(y, Math.atan2(x, (z + 0.4) / 0.9)) - 1.2), [-20, 0, -20], [20, yTop + 1, 20]), 'cloakIn', { where: b.isMat('cloak') });
  b.paint('hips', box([0, yTop / 2, 13], [0.45, yTop / 2, 4]), 'cloak', { shade: 3, where: b.isMat('cloak') });
}

/** The deep hood: a shell round the head opening to the front on a void, two gold points set back in it. */
function hood(b: ModelBuilder, hc: V3): void {
  // a deep hood a size too big, drawn to a soft point at the crown and falling wide onto the cowl
  const outer = blend(2.2,
    ellipsoid([0, hc[1] + 0.8, hc[2] - 0.6], [7.2, 8.0, 7.6]),
    ellipsoid([0, hc[1] - 4.6, hc[2] - 1.0], [7.6, 3.4, 7.4]),
    spike([0, hc[1] + 6.2, hc[2] - 2.2], [0, 0.55, -0.83], 5.2, 3.2, 1.0, { side: [1, 0, 0] }));
  const inner = ellipsoid([0, hc[1] + 0.2, hc[2] + 0.4], [5.4, 6.2, 6.0]);
  const opening = ellipsoid([0, hc[1] - 0.8, hc[2] + 6.8], [4.3, 5.6, 4.6]);
  b.add('head', subtract(outer, inner, opening, ellipsoid([0, hc[1] - 9.4, hc[2]], [9, 3.6, 9])), 'cloak');
  // creases where the cloth gathers at the back of the crown
  for (const x0 of [-3.2, 0, 3.2]) b.paint('head', fn((x, y, z) => Math.max(Math.abs(x - x0 * (1 + (hc[1] + 6 - y) * 0.03)) - 0.45, z - hc[2] + 2.5), [-12, hc[1] - 10, -14], [12, hc[1] + 12, 4]), 'cloak', { shade: 3, where: b.isMat('cloak') });
  // the rim folded back round the opening, the lining inside it
  b.add('head', subtract(torus([0, hc[1] - 0.8, hc[2] + 5.4], 4.9, 1.0, [90, 0, 0]), ellipsoid([0, hc[1] - 0.8, hc[2] + 6.6], [4.2, 5.3, 4.4])), 'cloak', { thr: 0.2 });
  b.paint('head', subtract(ellipsoid([0, hc[1] + 0.2, hc[2] + 0.4], [6.2, 7.0, 6.8]), ellipsoid([0, hc[1] - 0.8, hc[2] - 3], [7, 8, 5])), 'cloakIn', { where: b.isMat('cloak') });
  // nothing in it: a void set two voxels back from the rim
  const voidC: V3 = [0, hc[1] - 0.6, hc[2] - 0.2];
  b.add('head', ellipsoid(voidC, [4.7, 5.6, 4.6]), 'void', { only: 'empty' });
  // and two gold points
  const vz = Math.round(voidC[2] + 4.6) - 1;
  for (const x of [1, -3]) {
    b.fill('head', x, Math.round(hc[1]), vz, x + 1, Math.round(hc[1]), vz + 1, 'eyeGlow', 0);
    // the outer corners lifted: a glare
    b.voxel('head', x > 0 ? x + 1 : x, Math.round(hc[1]) + 1, vz + 1, 'eyeGlow', 1);
  }
}

/** Wide bell sleeves to past the wrists; the right one's mouth dark and empty. */
function sleeves(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  for (const side of [1, -1]) {
    const ua = side > 0 ? 'upperarm.L' : 'upperarm.R', fa = side > 0 ? 'forearm.L' : 'forearm.R';
    const x = side * sx;
    b.add(ua, capsule([x, sy, sz], [x, ey, sz], 3.3, 3.5), 'cloak');
    const mouthY = wy - 2.6;
    b.add(fa, capsule([x, ey + 0.5, sz], [x, ey - 2, sz - 0.2], 3.5, 3.6), 'cloak');
    b.add(fa, cylinder([x, ey - 1, sz - 0.2], [x, mouthY, sz - 0.5], 3.7, 5.2), 'cloak');
    b.carve(fa, cylinder([x, mouthY - 1, sz - 0.5], [x, mouthY + 4.5, sz - 0.4], 3.3, 3.5));
    b.paint(fa, cylinder([x, mouthY - 1, sz - 0.5], [x, mouthY + 5, sz - 0.4], 4.3, 4.3), 'cloakIn', { where: b.isMat('cloak') });
    b.add(fa, cylinder([x, mouthY + 4.2, sz - 0.4], [x, mouthY + 5.2, sz - 0.4], 3.9), 'void');
    // a crease where the sleeve breaks at the elbow
    b.paint(fa, torus([x, ey - 2.2, sz - 0.2], 3.8, 0.5, [0, 0, 0]), 'cloak', { shade: 3, where: b.isMat('cloak') });
  }
}

/** The left hand out of the sleeve: pale, thin, the fingers too long (open), and a fist for the bow. */
function leftHand(b: ModelBuilder, L: Landmarks): void {
  const [wx, wy, wz] = L.wrist;
  const hz = wz + 0.3;
  // open: the palm toward the body, the long fingers hanging
  b.add('palm.L', capsule([wx, wy + 0.5, hz - 0.3], [wx, wy - 2.5, hz - 0.3], 1.5), 'skin');
  b.add('palm.L', box([wx - 0.1, wy - 3.6, hz], [0.9, 2.2, 2.0], { round: 0.8 }), 'skin');
  const fingers: [number, number][] = [[1.6, 6.4], [0.55, 7.4], [-0.5, 7.0], [-1.5, 5.6]];
  for (const [dz, len] of fingers) {
    const top: V3 = [wx - 0.1, wy - 5.2, hz + dz];
    const bend: V3 = [wx - 0.5, wy - 5.2 - len * 0.55, hz + dz * 1.1];
    const tip: V3 = [wx - 1.1, wy - 5.2 - len, hz + dz * 1.15];
    b.add('palm.L', capsule(top, bend, 0.75, 0.68), 'skin', { thr: 0.25 });
    b.add('palm.L', capsule(bend, tip, 0.68, 0.55), 'skin', { thr: 0.25 });
    b.add('palm.L', sphere(tip, 0.6), 'nail', { thr: 0.3 });
  }
  b.add('palm.L', capsule([wx - 0.6, wy - 2.6, hz + 1.8], [wx - 1.3, wy - 6.2, hz + 2.7], 0.8, 0.65), 'skin', { thr: 0.25 });
  // fist: the bow's grip runs through it along Z
  const gy = wy - 4.2;
  b.add('fist.L', capsule([wx, wy + 0.5, hz - 0.3], [wx, wy - 2.5, hz - 0.3], 1.5), 'skin');
  b.add('fist.L', subtract(box([wx - 0.1, gy, hz + 0.1], [1.7, 2.6, 2.4], { round: 1.0 }), cylinder([wx - 0.1, gy, hz - 6], [wx - 0.1, gy, hz + 6], 1.0)), 'skin');
  b.add('fist.L', capsule([wx - 1.5, gy + 1.4, hz + 1.9], [wx - 1.0, gy - 0.6, hz + 2.7], 0.8), 'skin');
  b.paint('fist.L', box([wx + 1.6, gy + 1.2, hz + 0.1], [0.5, 0.4, 2.6]), 'skin', { shade: 3 });
}

/** The Vollständig's wings: two huge flat hands spread from the shoulder blades, the palms forward. */
function wings(b: ModelBuilder, s: HumanoidSpec): void {
  const piv: V3 = [3.2, s.chestY + 3, -5.5];
  b.boneSym('wing.L', 'chest', piv);
  // built flat (fingers up, the palm toward +Z, the thumb toward −X) round a base, then tilted out and back
  const base: V3 = [piv[0] + 4, piv[1] + 2, piv[2] - 3];
  const flat: Sdf[] = [];
  const palmC: V3 = [base[0], base[1] + 13, base[2]];
  flat.push(box(palmC, [11, 12, 1.4], { round: 1.2 }));
  const fingers: [number, number, number][] = [[-7.2, 26, -6], [-2.4, 30, -2], [2.4, 28.5, 2], [7, 22, 6]];
  for (const [dx, len, tilt] of fingers) {
    const a: V3 = [base[0] + dx, base[1] + 24, base[2]];
    const t = (tilt * Math.PI) / 180;
    const tip: V3 = [a[0] - Math.sin(t) * len, a[1] + Math.cos(t) * len, a[2]];
    flat.push(capsule(a, tip, 2.3, 1.5));
  }
  flat.push(capsule([base[0] - 9, base[1] + 6, base[2]], [base[0] - 22, base[1] + 17, base[2] + 1], 2.6, 1.7));
  const hand = flat.reduce((acc, sdf) => blend(1.0, acc, sdf));
  const tilted = rotate(hand, base, [-12, 18, -48]);
  b.add('wing.L', tilted, 'wing', { mirror: true, thr: 0.2 });
  // the lines of the palm and the finger joints, darker gold
  const lines: Sdf[] = [
    capsule([base[0] - 8, base[1] + 18, base[2] + 1.2], [base[0] + 9, base[1] + 20, base[2] + 1.2], 0.55),
    capsule([base[0] - 7, base[1] + 8, base[2] + 1.2], [base[0] - 1, base[1] + 21, base[2] + 1.2], 0.55),
  ];
  for (const [dx, len, tilt] of fingers) {
    const t = (tilt * Math.PI) / 180;
    for (const k of [0.4, 0.7]) {
      const c: V3 = [base[0] + dx - Math.sin(t) * len * k, base[1] + 24 + Math.cos(t) * len * k, base[2] + 1.6];
      lines.push(capsule([c[0] - 2.2, c[1], c[2]], [c[0] + 2.2, c[1], c[2]], 0.5));
    }
  }
  for (const l of lines) b.paint('wing.L', rotate(l, base, [-12, 18, -48]), 'wingLine', { mirror: true, where: b.isMat('wing') });
}

// ---------------------------------------------------------------------------------------------- the hand and the arm

function giantPalette(b: ModelBuilder): void {
  b.mat('skin', ['#F0E5D9', '#E4D6C8', '#CEBDAD', '#B3A090', '#958270'], { base: 1, rough: 0.6, shadeK: 1.1 });
  b.mat('crease', ['#A8927F', '#8E7A68'], { base: 0, rough: 0.7 });
  b.mat('nail', ['#E8DBCF', '#D9C8BA', '#C2B0A1'], { base: 1, rough: 0.35 });
  b.mat('iron', ['#6E6E76', '#5A5A62', '#4B4B52', '#38383E'], { base: 2, rough: 0.4, metal: 0.75 });
  b.mat('sclera', ['#E6EAEE', '#D2D8DE'], { base: 0, rough: 0.3 });
  b.mat('iris', ['#F0C040', '#D9A520'], { base: 1, rough: 0.3, glow: 0.55 });
  b.mat('irisD', ['#A8780F', '#8A600C'], { base: 0, rough: 0.3, glow: 0.2 });
  b.mat('pupil', ['#141418'], { rough: 0.2 });
  b.mat('glint', ['#F3F3F0'], { glow: 0.6 });
  b.mat('lid', ['#5E4A3E', '#4E3C32'], { base: 0 });
  b.mat('lidFold', ['#A89282', '#957E6E'], { base: 0 });
  b.mat('rune', ['#7A1520', '#6D111A', '#560B11'], { base: 1, rough: 0.6 });
  b.mat('nerve', ['#4E3E48', '#3E3039', '#2E252C', '#241D23'], { base: 2, rough: 0.7, shadeK: 0.9 });
  b.mat('nerveHi', ['#E8D0C8', '#C9A9A2'], { base: 0, rough: 0.5 });
  b.mat('flesh', ['#A8383A', '#8E2A2C', '#74201F', '#5A1717'], { base: 1, rough: 0.55 });
  b.mat('tendon', ['#F3EADB', '#EDE3D2', '#D5C9B4'], { base: 1, rough: 0.5 });
  b.mat('bone', ['#EFE8D6', '#E6DCC6', '#CFC3A9'], { base: 1, rough: 0.7 });
  b.mat('blood', ['#7E1016', '#6E0E12', '#560A0E'], { base: 1, rough: 0.25 });
}

/** a smooth tube through control points, the radii (one per control point) interpolated along it */
function rope(ctrl: readonly V3[], radii: readonly number[], perSeg = 4): Sdf {
  const pts = smoothPath(ctrl, perSeg);
  const rs = pts.map((_p, i) => {
    const u = (i / (pts.length - 1)) * (radii.length - 1);
    const k = Math.min(radii.length - 2, Math.floor(u));
    return radii[k] + (radii[k + 1] - radii[k]) * (u - k);
  });
  return tube(pts, rs);
}

/** a cylinder with an elliptic section (half-widths rx, rz) from y0 to y1, tapering */
function ellCyl(y0: number, y1: number, rx0: number, rz0: number, rx1: number, rz1: number, cz = 0): Sdf {
  return fn((x, y, z) => {
    const k = Math.max(0, Math.min(1, (y - y0) / (y1 - y0)));
    const rx = rx0 + (rx1 - rx0) * k, rz = rz0 + (rz1 - rz0) * k;
    const d = (Math.hypot(x / rx, (z - cz) / rz) - 1) * Math.min(rx, rz);
    return Math.max(d, y0 - y, y - y1);
  }, [-Math.max(rx0, rx1) - 1, y0 - 1, cz - Math.max(rz0, rz1) - 1], [Math.max(rx0, rx1) + 1, y1 + 1, cz + Math.max(rz0, rz1) + 1]);
}

interface FingerDef {
  name: string;
  base: V3;
  dir: V3;
  len: number;
  r: number;
}

const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
};
const along = (p: V3, d: V3, k: number): V3 => [p[0] + d[0] * k, p[1] + d[1] * k, p[2] + d[2] * k];

/**
 * The left hand at 16/m on bone 'palm' (pivot at the top of the wrist, y = P0): the palm, the eye, the creases, four
 * fingers and the thumb of three bones each (f.<name>.1-3), nails on their backs, an iron band near each tip.
 */
function giantHand(b: ModelBuilder, P0: number, clone: boolean, danglers: boolean): void {
  const F0 = P0 + 23;
  b.bone('palm', b.hasBone('chest') ? 'chest' : 'spine', [0, P0, 0]);
  const palm = blend(2.4,
    box([0, P0 + 11.5, -0.2], [9.4, 11.2, 3.1], { round: 2.6 }),
    ellipsoid([-6.4, P0 + 6.5, 1.0], [4.4, 7.0, 3.6]),
    ellipsoid([7.0, P0 + 8.5, 0.4], [3.2, 7.5, 3.1]),
    capsule([-7.2, F0 - 1.4, -0.2], [7.6, F0 - 1.8, -0.2], 3.0, 2.5),
    ellCyl(P0 - 1, P0 + 4, 7.4, 4.6, 8.6, 3.6, -0.2),
  );
  b.add('palm', palm, 'skin');
  // the eye: a dome in the middle of the palm with the pixel eye on it
  const eyeY = P0 + 12;
  b.add('palm', ellipsoid([0, eyeY, 2.4], [7.6, 4.6, 2.4]), 'skin');
  b.paint('palm', subtract(ellipsoid([0, eyeY, 2.4], [8.8, 5.8, 3.6]), ellipsoid([0, eyeY, 2.4], [7.0, 4.0, 3.2])), 'lidFold', { where: b.isMat('skin') });
  const legend = {
    u: { mat: 'lidFold' }, l: { mat: 'lid' }, S: { mat: 'sclera' }, i: { mat: 'irisD' }, I: { mat: 'iris' }, h: { mat: 'glint' }, P: { mat: 'pupil' },
  };
  b.stamp('palm', -7, eyeY + 4, clone ? EYE_CLONE : EYE, legend, 12, -4);
  // a few creases: the heart line across the top, the life line round the thumb's mound
  const front = (s: Sdf) => intersect(s, fn((_x, _y, z) => 1.6 - z, [-20, P0 - 4, -10], [20, F0 + 4, 10]));
  b.paint('palm', front(capsule([-8.5, F0 - 5.5, 3], [8.5, F0 - 4.2, 3], 0.6)), 'crease', { where: b.isMat('skin') });
  b.paint('palm', front(rope([[-8.8, F0 - 8, 3], [-4.6, P0 + 9, 3.4], [-3.4, P0 + 3, 3.4], [-4.2, P0 - 0.5, 3]], [0.55, 0.6, 0.6, 0.5], 4)), 'crease', { where: b.isMat('skin') });
  b.paint('palm', front(capsule([5.5, P0 + 2, 3], [7.5, P0 + 16, 3], 0.5)), 'crease', { where: b.isMat('skin') });
  // the fingers (the thumb on −X: a left hand held up palm forward)
  const fingers: FingerDef[] = [
    { name: 'index', base: [-6.8, F0 - 1.5, -0.3], dir: norm([-0.1, 1, 0]), len: 20, r: 2.15 },
    { name: 'middle', base: [-2.2, F0 - 1, -0.3], dir: norm([-0.02, 1, 0]), len: 22.5, r: 2.25 },
    { name: 'ring', base: [2.5, F0 - 1.3, -0.3], dir: norm([0.05, 1, 0]), len: 21, r: 2.05 },
    { name: 'pinky', base: [7.0, F0 - 2.4, -0.3], dir: norm([0.14, 1, 0]), len: 16.5, r: 1.8 },
    { name: 'thumb', base: [-8.6, P0 + 7.5, 1.4], dir: norm([-0.66, 0.7, 0.3]), len: 17, r: 2.45 },
  ];
  for (const f of fingers) finger(b, f, danglers);
  b.socket('palm.eye', 'palm', [0, eyeY, 5.2]);
  b.socket('palm.mouth', 'palm', [0, P0 + 5.5, 3.6]);
  b.socket('palm.c', 'palm', [0, P0 + 11, 0]);
}

/** One finger: three bones (the thumb too), joint balls, a nail on the back of the last, an iron band before the tip. */
function finger(b: ModelBuilder, f: FingerDef, danglers: boolean): void {
  const ks = [0, 0.44, 0.75, 1];
  const parent = 'palm';
  const pts = ks.map((k) => along(f.base, f.dir, f.len * k));
  for (let i = 0; i < 3; i++) {
    const bone = `f.${f.name}.${i + 1}`;
    b.bone(bone, i === 0 ? parent : `f.${f.name}.${i}`, pts[i]);
    const r0 = f.r * (1 - i * 0.08), r1 = f.r * (1 - (i + 1) * 0.08);
    b.add(bone, capsule(pts[i], pts[i + 1], r0, r1), 'skin');
    // the knuckle ball at the base, one voxel smaller than the parent's end
    b.add(bone, sphere(pts[i], r0 + (i === 0 ? 0.3 : 0.1)), 'skin', { only: 'empty' });
    // a crease on the back over each joint
    if (i > 0) b.paint(bone, intersect(sphere(pts[i], r0 + 0.6), fn((_x, _y, z) => z + 0.6, [-60, -60, -60], [60, 260, 60]), fn((x, y, z) => Math.abs((x - pts[i][0]) * f.dir[0] + (y - pts[i][1]) * f.dir[1] + (z - pts[i][2]) * f.dir[2]) - 0.6, [-60, -60, -60], [60, 260, 60])), 'crease', { where: b.isMat('skin') });
  }
  const tipBone = `f.${f.name}.3`;
  const tip = pts[3];
  // the nail on the back (−Z), over the outer half of the last joint
  const nailA = along(f.base, f.dir, f.len * 0.86), nailB = along(f.base, f.dir, f.len * 1.0);
  b.add(tipBone, intersect(capsule([nailA[0], nailA[1], nailA[2] - f.r * 0.45], [nailB[0], nailB[1] - 0.6, nailB[2] - f.r * 0.45], f.r * 0.82), fn((_x, _y, z) => z - (nailA[2] - f.r * 0.25), [-60, -60, -60], [60, 260, 60])), 'nail', { thr: 0.25 });
  // the iron band the chains hold by
  const bandC = along(f.base, f.dir, f.len * 0.8);
  const rot: V3 = [0, 0, (-Math.atan2(f.dir[0], f.dir[1]) * 180) / Math.PI];
  b.add(tipBone, torus(bandC, f.r * 0.98, 0.75, rot), 'iron', { thr: 0.25 });
  b.socket(`band.${f.name}`, tipBone, [bandC[0], bandC[1], bandC[2] - f.r * 0.6]);
  b.socket(`tip.${f.name}`, tipBone, tip);
  if (danglers && f.name !== 'thumb') {
    // the chain's broken end: three links hanging from the band, each overlapping the next
    let p: V3 = [bandC[0] + 0.4, bandC[1] - 0.4, bandC[2] - f.r * 0.98];
    for (let k = 0; k < 3; k++) {
      const q: V3 = [p[0] + 0.3, p[1] - 2.4, p[2] - 0.4];
      const c: V3 = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2];
      b.add(tipBone, box(c, k % 2 ? [0.55, 1.7, 1.0] : [1.0, 1.7, 0.55], { round: 0.4 }), 'iron', { thr: 0.3 });
      p = q;
    }
  }
}

/** The wrist on `bone` from y0 (the cut) to y1, the rune on its front unless a clone, the cut end of flesh and nerves. */
function wrist(b: ModelBuilder, bone: string, y0: number, y1: number, clone: boolean, cut: boolean): void {
  b.add(bone, ellCyl(y0, y1, 7.0, 4.4, 7.6, 4.6, -0.2), 'skin');
  // the wrist's tendons standing out under the skin on the front
  for (const x of [-2.6, 0.4, 3.2]) b.add(bone, capsule([x, y0 + 1.5, 3.6], [x * 1.08, y1 - 0.5, 3.8], 0.9), 'skin', { thr: 0.3 });
  if (!clone) {
    const legend = { X: { mat: 'rune' } };
    b.stamp(bone, -3, y1 - 1, HAGAL, legend, 10, -2);
  }
  if (cut) {
    // the cut: a ring of flesh round a core of nerves
    b.paint(bone, aabb([-10, y0 - 2, -8], [10, y0 + 0.9, 8]), 'flesh');
    b.paint(bone, ellCyl(y0 - 2, y0 + 1, 4.4, 2.6, 4.4, 2.6, -0.2), 'nerve');
  }
}

/** The knot of nerves under the hand (bone 'hips') and the four root legs (the quad stance's), plus loose tendrils. */
function roots(b: ModelBuilder, knotY: number, k: number, topY: number): void {
  b.bone('hips', 'root', [0, knotY, 0]);
  b.add('hips', blend(2.0, sphere([0, knotY, 0], 4.6 * k), ellipsoid([0, knotY + 2.4 * k, 0], [5.4 * k, 3 * k, 3.6 * k]), sphere([2.2 * k, knotY - 1.6 * k, 1.4 * k], 3.0 * k), sphere([-2.4 * k, knotY - 1.2 * k, -1.6 * k], 3.0 * k)), 'nerve');
  // cords from the knot up into the cut
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const p0: V3 = [Math.cos(a) * 3 * k, knotY + 1, Math.sin(a) * 2 * k];
    const p1: V3 = [Math.cos(a + 0.6) * 3.4 * k, (knotY + topY) / 2, Math.sin(a + 0.6) * 2.2 * k];
    const p2: V3 = [Math.cos(a + 1.1) * 2.6 * k, topY + 1, Math.sin(a + 1.1) * 1.6 * k];
    b.add('hips', rope([p0, p1, p2], [1.5 * k, 1.3 * k, 1.2 * k], 4), 'nerve', { thr: 0.2 });
  }
  const legs: [string, number, number][] = [['', 1, -1], ['', -1, -1], ['f', 1, 1], ['f', -1, 1]];
  for (const [pre, sx, sz] of legs) {
    const side = sx > 0 ? 'L' : 'R';
    const hip: V3 = [sx * 3.8 * k, knotY - 1.2 * k, sz * 3 * k];
    const knee: V3 = [sx * 11 * k, knotY + 1.6 * k, sz * 8.6 * k];
    const ankle: V3 = [sx * 15.6 * k, 2.4 * k, sz * 12.4 * k];
    const th = `${pre}thigh.${side}`, sh = `${pre}shin.${side}`, ft = `${pre}foot.${side}`;
    b.bone(th, 'hips', hip);
    b.bone(sh, th, knee);
    b.bone(ft, sh, ankle);
    b.add(th, rope([hip, [(hip[0] + knee[0]) / 2, knee[1] + 1.2 * k, (hip[2] + knee[2]) / 2], knee], [2.4 * k, 2.2 * k, 1.9 * k], 4), 'nerve');
    b.add(th, sphere(knee, 2.0 * k), 'nerve');
    b.add(sh, rope([knee, [knee[0] * 1.12, (knee[1] + ankle[1]) / 2 + 1 * k, knee[2] * 1.12], ankle], [1.8 * k, 1.5 * k, 1.3 * k], 4), 'nerve');
    b.add(sh, sphere(ankle, 1.3 * k), 'nerve');
    // the foot: the root splits into three on the ground
    for (const t of [-0.5, 0, 0.5]) {
      const dx = sx * Math.cos(t) * 0.7 - sz * Math.sin(t) * 0.5, dz = sz * Math.cos(t) * 0.7 + sx * Math.sin(t) * 0.5;
      const end: V3 = [ankle[0] + dx * 4.6 * k, 0.6, ankle[2] + dz * 4.6 * k];
      b.add(ft, rope([ankle, [ankle[0] + dx * 2.2 * k, 1.6 * k, ankle[2] + dz * 2.2 * k], end], [1.2 * k, 1.0 * k, 0.8 * k], 3), 'nerve', { thr: 0.25 });
    }
    // pale threads along the top of each root
    b.paint([th, sh], rope(([hip, knee, ankle] as V3[]).map((p) => [p[0], p[1] + 1.6 * k, p[2]] as V3), [0.6 * k, 0.5 * k, 0.4 * k], 4), 'nerveHi', { where: b.isMat('nerve') });
  }
  // loose tendrils between the legs, down to the ground
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2;
    const p0: V3 = [Math.cos(a) * 3.4 * k, knotY - 2 * k, Math.sin(a) * 3.4 * k];
    const p1: V3 = [Math.cos(a + 0.3) * 6.5 * k, knotY * 0.45, Math.sin(a + 0.3) * 6.5 * k];
    const p2: V3 = [Math.cos(a + 0.5) * 8.4 * k, 0.6, Math.sin(a + 0.5) * 8.4 * k];
    b.add('hips', rope([p0, p1, p2], [1.0 * k, 0.8 * k, 0.6 * k], 4), 'nerve', { thr: 0.25 });
  }
}

/** The hand (4.5 m), the arm (11.7 m) or a clone's hand, at 16 vox/m. */
function buildGiant(kind: 'hand' | 'arm' | 'clone'): CharacterAsset {
  const b = new ModelBuilder(`pernida-${kind}`, HAND_RES);
  giantPalette(b);
  b.bone('root', null, [0, 0, 0]);
  const clone = kind === 'clone';
  if (kind === 'arm') {
    roots(b, 14, 2.0, 22);
    b.bone('spine', 'hips', [0, 25, 0]);
    b.bone('chest', 'spine', [0, 82, 0]);
    // the upper arm: muscled, thick at the torn shoulder end, the biceps to the front
    b.add('spine', blend(3.0, ellCyl(22, 82, 9.4, 8.4, 8.0, 7.2, 0), ellipsoid([0, 58, 3.2], [6.4, 15, 5.6]), ellipsoid([0, 50, -3.4], [6.6, 18, 5.4]), ellipsoid([0, 30, 0], [10.6, 9, 9.2])), 'skin');
    b.add('spine', sphere([0, 82, 0], 8.0), 'skin');
    // the stump: muscle torn ragged, the head of the bone jutting out, tendons spilling into the roots, blood
    b.paint('spine', fn((x, y, z) => y - (24.5 + 1.6 * Math.sin(x * 0.9) + 1.3 * Math.cos(z * 1.1)), [-14, 10, -14], [14, 32, 14]), 'flesh');
    b.add('spine', ellipsoid([0, 19.5, 0.4], [8.8, 3.4, 7.8]), 'flesh');
    b.add('spine', blend(1.2, sphere([0.6, 16.4, -0.6], 4.4), capsule([0.6, 16.4, -0.6], [0.4, 24, -0.4], 2.8)), 'bone');
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.3;
      const p0: V3 = [Math.cos(a) * 6.2, 19, Math.sin(a) * 5.4];
      const p1: V3 = [Math.cos(a + 0.2) * 7.6, 14, Math.sin(a + 0.2) * 6.4];
      const p2: V3 = [Math.cos(a + 0.4) * 5.6, 9.5, Math.sin(a + 0.4) * 4.6];
      b.add('spine', rope([p0, p1, p2], [1.1, 0.9, 0.7], 3), i % 2 ? 'tendon' : 'flesh', { thr: 0.25 });
    }
    for (const [x, z, l] of [[5.6, 4.2, 6], [-6.4, 2.6, 4.5], [2.2, -6.6, 5.2]] as const) b.add('spine', capsule([x, 21, z], [x * 1.05, 21 - l, z * 1.05], 0.9, 0.6), 'blood', { thr: 0.3 });
    // the elbow and the forearm, narrowing to the wrist
    b.add('chest', sphere([0, 82, 0], 7.4), 'skin', { only: 'empty' });
    b.add('chest', blend(2.4, ellCyl(80, 132, 7.8, 7.2, 7.2, 4.6, -0.2), ellipsoid([0, 96, 0.6], [8.2, 10, 6.6]), sphere([0, 80.5, -5], 3.4)), 'skin');
    // the veins of a giant's forearm
    for (const [x0, x1] of [[-3, -4.8], [2.4, 4.6]] as const) b.add('chest', rope([[x0, 86, 6.4], [x0 * 1.3, 104, 5.6], [x1, 124, 4.6]], [0.8, 0.7, 0.6], 4), 'skin', { thr: 0.3 });
    wrist(b, 'chest', 132, 142, clone, false);
    giantHand(b, 142, clone, true);
  } else {
    roots(b, 15, 1, 16);
    b.bone('spine', 'hips', [0, 16, 0]);
    wrist(b, 'spine', 16, 26, clone, true);
    giantHand(b, 26, clone, false);
  }
  b.socket('knot', 'hips', [0, kind === 'arm' ? 14 : 15, 0]);
  b.autoShade();
  b.lint();
  return { model: b.build(), springs: [] as SpringDef[], colliders: [] as ColliderDef[], warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- props

/**
 * Heilig Bogen: a tall traditional bow of pale gold-white reishi, its limbs along ±Z from the grip at the origin and
 * bowed toward −Y (the back of the bow faces away from the archer), the string straight along +Y. `tip`: the small
 * bow that rides a fingertip at 16/m — its limbs across the hand (±X), its back toward +Z (the palm's way, the shot's),
 * the string behind.
 */
function buildBow(tip: boolean): VoxelModel {
  const res = tip ? HAND_RES : PERNIDA_RES;
  const b = new ModelBuilder(tip ? 'pernida-bow-tip' : 'pernida-bow', res);
  b.mat('bow', ['#FBF4D8', '#F3E7B0', '#E6D08A', '#CDB266'], { base: 1, rough: 0.3, glow: 1.1, dither: 0 });
  b.mat('string', ['#FFF8E0'], { glow: 1.6 });
  b.bone('root', null, [0, 0, 0]);
  const L = tip ? 7 : 36, bow = tip ? 2.2 : 8.5, r = tip ? 0.9 : 1.3;
  // in the bow's own frame: u along the limbs, v the way its back faces
  const at = (u: number, v: number): V3 => (tip ? [u, 0, v] : [0, -v, u]);
  const pts: V3[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = -1 + (2 * i) / 12;
    // a recurve: the limbs bow back, their tips flick forward again
    pts.push(at(t * L, bow * (1 - t * t) - (Math.abs(t) > 0.82 ? (Math.abs(t) - 0.82) * bow * 2.2 : 0)));
  }
  b.add('root', tube(pts, pts.map((_p, i) => r * (1 - Math.abs(i - 6) / 12 * 0.45))), 'bow', { thr: 0.2 });
  const g0 = tip ? 0.9 : 2.2;
  b.add('root', capsule(at(-g0, bow - 0.4), at(g0, bow - 0.4), r * 1.5), 'bow');
  const ua = -L + 0.6, ub = L - 0.6;
  const va = pts[0], vb = pts[12];
  const back = (p: V3) => (tip ? p[2] : -p[1]);
  b.add('root', capsule(at(ua, back(va) - 0.4), at(ub, back(vb) - 0.4), tip ? 0.35 : 0.45), 'string', { thr: 0.35 });
  b.autoShade({ up: 0.2, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/**
 * A stone left hand at the world's 8 vox/m, 4 m from the sunk wrist to the fingertips, the palm toward +Z and the thumb
 * toward −X, fingers a little curled to clap or grab; rough rock with cracks.
 */
function buildStoneHand(): VoxelModel {
  const b = new ModelBuilder('pernida-stone-hand', 8);
  b.mat('stone', ['#A9A39A', '#948E85', '#7F7970', '#6A655D', '#57534C'], { base: 1, rough: 0.95, shadeK: 1.0, dither: 0.08 });
  b.mat('crack', ['#3E3B36', '#34312D'], { base: 0 });
  b.bone('root', null, [0, 0, 0]);
  const P0 = 6;
  b.add('root', ellCyl(-6, P0 + 1, 4.2, 2.8, 4.6, 2.4, 0), 'stone');
  b.add('root', blend(1.4, box([0, P0 + 6, 0], [5.2, 6, 1.9], { round: 1.4 }), ellipsoid([-3.6, P0 + 3.5, 0.8], [2.4, 3.6, 2.0])), 'stone');
  const F0 = P0 + 12;
  const fingers: [number, number, number][] = [[-3.6, 10, 1.15], [-1.2, 11.5, 1.2], [1.3, 10.8, 1.1], [3.6, 8.4, 1.0]];
  for (const [x, len, r] of fingers) {
    const a: V3 = [x, F0 - 0.8, 0];
    const m: V3 = [x * 1.05, F0 + len * 0.55, 0.9];
    const t: V3 = [x * 1.1, F0 + len * 0.95, 2.8];
    b.add('root', tube([a, m, t], [r, r * 0.95, r * 0.8]), 'stone', { thr: 0.2 });
  }
  b.add('root', tube([[-4.8, P0 + 3, 0.8], [-7.6, P0 + 7.2, 2], [-8.4, P0 + 9.4, 3.4]], [1.4, 1.2, 1.0]), 'stone', { thr: 0.2 });
  // cracks across the knuckles and down the wrist
  b.paint('root', capsule([-5, F0 - 0.6, 2], [5, F0 - 1.2, 2], 0.45), 'crack', { where: b.isMat('stone') });
  b.paint('root', tube([[1.2, P0 + 10, 2], [-0.4, P0 + 5, 2.2], [0.6, P0 - 1, 2.6], [-0.4, -4, 3]], [0.45, 0.45, 0.45, 0.45]), 'crack', { where: b.isMat('stone') });
  b.autoShade();
  b.lint();
  return b.build();
}

/** A finger torn off (16/m): the nail, the iron band, a ragged red end — what a clone grows from. Lies along +Z. */
function buildFinger(): VoxelModel {
  const b = new ModelBuilder('pernida-finger', HAND_RES);
  giantPalette(b);
  b.bone('root', null, [0, 0, 0]);
  b.add('root', tube([[0, 0, -10], [0, 0.4, 0], [0, 0, 10]], [2.2, 2.1, 1.8]), 'skin');
  b.add('root', intersect(capsule([0, 1.0, 5.5], [0, 0.8, 10], 1.7), fn((_x, y) => 0.9 - y, [-9, -9, -12], [9, 9, 12])), 'nail', { thr: 0.25 });
  b.add('root', torus([0, 0, 6], 2.1, 0.75, [90, 0, 0]), 'iron', { thr: 0.25 });
  b.paint('root', fn((x, y, z) => -9.5 - z + 0.8 * Math.sin(x * 2.1 + y), [-4, -4, -12], [4, 4, -7]), 'flesh');
  b.add('root', capsule([0.4, 0.2, -10.4], [0.8, -0.6, -12.6], 0.7), 'nerve', { thr: 0.3 });
  b.autoShade();
  b.lint();
  return b.build();
}

/** The Vollständig's halo at 48/m: the Zeichen star in a ring, yellow-gold, facing +Z. */
function buildHalo(): VoxelModel {
  const b = new ModelBuilder('pernida-halo', PERNIDA_RES);
  b.mat('halo', ['#FFF2C4', '#F7DD84', '#F2C84B', '#D9A830', '#B8861A'], { base: 2, rough: 0.2, glow: 0.9, dither: 0 });
  b.bone('root', null, [0, 0, 0]);
  const R = 10;
  b.add('root', torus([0, 0, 0], R, 0.85, [90, 0, 0]), 'halo', { thr: 0.2 });
  b.add('root', torus([0, 0, 0], R - 3.2, 0.7, [90, 0, 0]), 'halo', { thr: 0.3 });
  for (const a of [90, 0, 180, -55, -125]) {
    const r = (a * Math.PI) / 180;
    b.add('root', capsule([0, 0, 0], [Math.cos(r) * (R + 4.5), Math.sin(r) * (R + 4.5), 0], 1.2, 0.7), 'halo', { thr: 0.2 });
  }
  b.add('root', sphere([0, 0, 0], 2.0), 'halo');
  b.autoShade({ up: 0.2, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** The mouth that opens in the palm to eat (16/m): lips round a red throat, a tongue out of it with an eye on its tip. */
function buildMouth(): VoxelModel {
  const b = new ModelBuilder('pernida-mouth', HAND_RES);
  giantPalette(b);
  b.mat('throat', ['#5A1717', '#3E0F10'], { base: 1 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', subtract(torus([0, 0, 0.6], 4.4, 1.5, [90, 0, 0]), ellipsoid([0, 0, 3], [3.4, 2.4, 2])), 'skin', { thr: 0.2 });
  b.add('root', ellipsoid([0, 0, -0.4], [4.2, 2.8, 1.4]), 'throat');
  // the tongue curling out and up, the eye on its tip
  const pts: V3[] = [[0, -0.6, 0.2], [0, -1.6, 3.6], [0, -0.4, 7.4], [0, 2.2, 9.6]];
  b.add('root', tube(pts, [1.8, 1.6, 1.3, 1.1]), 'flesh', { thr: 0.2 });
  b.add('root', sphere([0, 3.0, 10.4], 1.8), 'sclera');
  b.add('root', sphere([0, 3.2, 11.6], 0.9), 'iris');
  b.voxel('root', 0, 3, 12, 'pupil', 0);
  b.autoShade();
  b.lint();
  return b.build();
}
