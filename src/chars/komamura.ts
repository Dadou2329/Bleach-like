// Sajin Komamura — Captain of the 7th Division, of the Wolfman Clan (docs/roster/B2-captains-2.md). 2.88 m
// (138 voxels at 48 vox/m): the tallest captain, a huge upright wolf — a barrel chest, massive shoulders and
// forearms, a long muzzle, upright pointed ears, golden eyes; light brown fur with a pale throat and chest.
// Unmasked (after the helmet era): the black shihakushō, the white captain's haori without sleeves (dark tan
// lining, 七 in a rhombus on the back), big iron weights on his shoulders, bracers and gloves the same light
// brown as his fur, heavy plated iron boots. Tenken: a plain katana scaled to him, its guard a squared
// hourglass with lines engraved along it.
// The Bankai giant (Kokujō Tengen Myō'ō) is built separately, coarse, on the same skeleton so it can mirror
// him bone for bone: black armour over grey skin, a horned kabuto and a menpō, black ropes coiled round it,
// a sword like Tenken with a red cord off the hilt.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, prism, smoothPath, sphere, spike, subtract, torus, tube, type Sdf, type V3 } from '../models/sdf';
import { addBands, coatSkirt, humanoidSkeleton, type HumanoidSpec, type Landmarks } from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

/** 138 voxels = 2.88 m */
export const KOMAMURA_RES = 138 / 2.88;
/** the giant: about 30 m tall in the game (canon: ~100 m), built coarse */
export const GIANT_RES = 4;
export const GIANT_SCALE = 30 / 2.88;

/** A huge, heavy frame: a deep chest, a thick waist, long massive arms, sturdy legs. */
const SPEC: HumanoidSpec = {
  H: 138,
  chinY: 117,
  head: { w: 18, d: 20, h: 21 },
  neckR: 6.2,
  shoulder: [21.5, 106, -1],
  upperArm: 25,
  foreArm: 23,
  hand: 15,
  armR: 6,
  hipsY: 68,
  hip: [9, 64, 0],
  kneeY: 37,
  ankleY: 7.5,
  chest: [18.5, 12.5],
  waist: [15.5, 11.5],
  hips: [15, 10.5],
  chestY: 96,
  waistY: 82,
  foot: { len: 22, w: 9.5, heel: 5.5 },
};

function palette(b: ModelBuilder): void {
  b.mat('fur', ['#D2A774', '#C0915D', '#B4824F', '#9C6E40', '#7C5532'], { base: 2, rough: 0.9, shadeK: 0.9 });
  b.mat('pale', ['#F0E0BC', '#E8D2A6', '#D6BC8E', '#BFA274'], { base: 1, rough: 0.9, shadeK: 0.9 });
  b.mat('earIn', ['#A07650', '#8D6340', '#6F4C30']);
  b.mat('nose', ['#2C2522', '#1A1614', '#141418'], { base: 1, rough: 0.3 });
  b.mat('lip', ['#1A1614']);
  b.mat('eye', ['#F6CC52', '#E3A82A', '#B88018'], { base: 0, rough: 0.25 });
  b.mat('pupil', ['#141418']);
  b.mat('black', ['#383A3F', '#26272D', '#1C1D22', '#141418'], { base: 1, rough: 0.85, shadeK: 0.9 });
  b.mat('collar', ['#F3F3F0', '#EDEDEA', '#D2D0CB'], { base: 0, rough: 0.8 });
  b.mat('haori', ['#F3F3F0', '#EEEDE8', '#DCDBD6', '#C3C4C8', '#A6A8AE'], { base: 1, rough: 0.82, shadeK: 0.9 });
  b.mat('haoriIn', ['#A39462', '#918151', '#766841'], { base: 1, rough: 0.85 });
  b.mat('kanji', ['#1A1A1C']);
  b.mat('iron', ['#55524E', '#45423F', '#3A3836', '#2C2A29', '#1E1D1C'], { base: 2, rough: 0.55, metal: 0.45, shadeK: 1 });
  b.mat('ironRim', ['#6A6661', '#57534F'], { base: 0, rough: 0.45, metal: 0.55 });
  b.mat('leather', ['#C8986A', '#B4824F', '#9C6E40', '#7C5532'], { base: 1, rough: 0.7 });
  b.mat('lace', ['#3A2E25', '#2A211B']);
  b.mat('obi', ['#F3F3F0', '#ECEBE7', '#B5B1AA'], { base: 0, rough: 0.8 });
}

const assetCache = new Map<string, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function komamuraAsset(): CharacterAsset {
  let a = assetCache.get('captain');
  if (!a) assetCache.set('captain', (a = buildKomamura()));
  return a;
}

/** the Bankai giant, or only its limbs (Tenken's phantom arms and legs) */
export function giantAsset(part: GiantPart = 'whole'): CharacterAsset {
  let a = assetCache.get(`giant:${part}`);
  if (!a) assetCache.set(`giant:${part}`, (a = buildGiant(part)));
  return a;
}

export type KomamuraProp = 'tenken' | 'giantSword';

export function komamuraProp(kind: KomamuraProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'tenken' ? buildTenken() : buildGiantSword();
    propCache.set(kind, m);
  }
  return m;
}

/** Tenken (prop frame, m): the blade from just past the guard to the tip, along +Z */
export const TENKEN_BASE: V3 = [0, 0, 6 / 48];
export const TENKEN_TIP: V3 = [0, 0, 60 / 48];
/** the giant's sword, in the giant's prop frame (m, before the giant's scale) */
export const GIANT_SWORD_BASE: V3 = [0, 0, 0.3];
export const GIANT_SWORD_TIP: V3 = [0, 0, 1.7];

export function buildKomamura(): CharacterAsset {
  const b = new ModelBuilder('komamura', KOMAMURA_RES);
  palette(b);
  const s = SPEC;
  const L = humanoidSkeleton(b, s, { sleeves: true, hakama: true });
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.2, wy - 7.2, wz + 0.6]);
  b.socket('grip.L', 'fist.L', [wx - 0.2, wy - 7.2, wz + 0.6]);
  b.socket('palm.R', 'palm.R', [-wx + 1, wy - 8, wz + 1.6]);
  b.socket('palm.L', 'palm.L', [wx - 1, wy - 8, wz + 1.6]);
  b.socket('knuckle.R', 'fist.R', [-wx, wy - 7.2, wz + 5.6]);
  b.socket('knuckle.L', 'fist.L', [wx, wy - 7.2, wz + 5.6]);
  b.socket('hip.L', 'hips', [17, s.hipsY + 1, 5.6], [-24, 180, -8]);
  b.socket('chest.front', 'chest', [0, s.chestY, 14]);
  b.socket('back', 'chest', [0, s.chestY + 2, -14]);
  const torso = body(b, L);
  const front = wolfHead(b, L);
  b.socket('face', 'head', [0, s.chinY + 7, front]);
  b.socket('mouth', 'head', [0, s.chinY + 3, front + 10]);
  hands(b, L);
  kosode(b, L, torso);
  sleeves(b, L);
  const haoriSprings = haori(b, L, torso);
  weights(b, L);
  bracers(b, L);
  hakama(b, L);
  boots(b, L);
  b.autoShade();
  b.lint();
  const R = KOMAMURA_RES;
  const springs: SpringDef[] = [...haoriSprings.springs];
  for (const side of ['L', 'R']) {
    springs.push({ bone: `sleeve.${side}`, tail: [0, -16 / R, -4 / R], stiffness: 38, damping: 5, gravity: 10, limit: 90, radius: 0.08 });
    springs.push({ bone: `hakama.${side}`, tail: [0, -26 / R, 0], stiffness: 70, damping: 6, gravity: 8, limit: 50, radius: 0.2 });
  }
  // the haori hangs over a very wide hakama: the legs push it out as far as the hakama reaches
  const colliders: ColliderDef[] = [
    { bone: 'thigh.L', offset: [0, -0.3, 0.02], radius: 0.28 },
    { bone: 'thigh.R', offset: [0, -0.3, 0.02], radius: 0.28 },
    { bone: 'shin.L', offset: [0, -0.04, 0], radius: 0.27 },
    { bone: 'shin.R', offset: [0, -0.04, 0], radius: 0.27 },
    { bone: 'shin.L', offset: [0, -0.32, 0.02], radius: 0.18 },
    { bone: 'shin.R', offset: [0, -0.32, 0.02], radius: 0.18 },
    { bone: 'hips', offset: [0, -0.1, 0], radius: 0.4 },
    { bone: 'chest', offset: [0, 0.08, 0], radius: 0.36 },
    { bone: 'spine', offset: [0, 0, 0.04], radius: 0.33 },
  ];
  void haoriSprings.colliders;
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- body

/** the barrel chest under the kosode (only the V of the pale chest fur shows), the thick neck, arms, legs */
function body(b: ModelBuilder, L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const torso = blend(5,
    box([0, s.chestY - 1, -0.5], [cx, 11, cz], { round: 7 }),
    box([0, s.waistY, -0.5], [wx, 8, wz], { round: 6 }),
    box([0, s.hipsY + 1, -0.5], [s.hips[0], 6.5, s.hips[1]], { round: 5 }),
    capsule([4, sy + 3.5, sz - 1.5], [sx - 3, sy, sz], 5.4, 5.6),
    capsule([-4, sy + 3.5, sz - 1.5], [-sx + 3, sy, sz], 5.4, 5.6),
    sphere([sx, sy - 1, sz], 6.2), sphere([-sx, sy - 1, sz], 6.2));
  addBands(b, torso, 'fur', [['hips', 40, s.waistY - 1], ['spine', s.waistY - 1, s.chestY - 6], ['chest', s.chestY - 6, 200]]);
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(2, sphere([sx, sy - 1, sz], 6), capsule([sx, sy - 2, sz], [sx, ey + 1, sz], 5.6, 4.8)), 'fur', { mirror: true });
  b.add('forearm.L', blend(2, sphere([sx, ey, sz], 4.8), capsule([sx, ey - 1, sz], [sx, wy + 1.5, sz], 5, 3.8)), 'fur', { mirror: true });
  b.add('neck', capsule([0, s.chinY - 10, L.headC[2] - 1.5], [0, s.chinY + 3, L.headC[2] - 1.5], s.neckR), 'fur');
  b.paint('neck', capsule([0, s.chinY - 10, L.headC[2] + 3.5], [0, s.chinY + 3, L.headC[2] + 3.5], 4.2), 'pale', { where: b.isMat('fur') });
  b.add('thigh.L', blend(2, sphere([s.hip[0], s.hip[1], 0], 7.4), capsule([s.hip[0], s.hip[1], 0], [L.knee[0], L.knee[1] + 2, 0], 7, 5.4)), 'fur', { mirror: true });
  b.add('shin.L', blend(2, sphere([L.knee[0], L.knee[1], 0], 5.4), capsule([L.knee[0], L.knee[1], 0], [L.ankle[0], L.ankle[1] + 2, 0], 5, 3.8)), 'fur', { mirror: true });
  return torso;
}

/**
 * The wolf's head: a broad skull, a long muzzle with a black nose and a dark lip line, the pale throat and
 * underjaw, golden almond eyes under a heavy brow, tall pointed ears with dark insides, a ruff of fur
 * swept back from the cheeks. Returns the z of the brow (the face front).
 */
function wolfHead(b: ModelBuilder, L: Landmarks): number {
  const s = L.spec;
  const c = s.chinY;
  const hz = L.headC[2] - 1;
  const skull = ellipsoid([0, c + 11, hz], [8.6, 9.2, 9.6]);
  const brow = ellipsoid([0, c + 10, hz + 6], [7.4, 4, 4.4]);
  const cheeks = [-1, 1].map((k) => ellipsoid([k * 5.6, c + 6.5, hz + 2.5], [3.6, 4.4, 5.2]));
  // the muzzle: long and broad, narrowing a little, a little lower at the tip
  const muzzle = tube([[0, c + 7.6, hz + 6], [0, c + 7.2, hz + 12], [0, c + 6.6, hz + 18.5]], [5, 4.3, 3.4]);
  const jaw = tube([[0, c + 3.6, hz + 5], [0, c + 3.8, hz + 11], [0, c + 4.3, hz + 16.5]], [3.8, 3.2, 2.4]);
  const head = blend(2, skull, brow, ...cheeks, muzzle, jaw);
  b.add('head', head, 'fur');
  /** z of the head's front surface at (x, y) */
  const front = (x: number, y: number) => {
    for (let z = hz + 26; z > hz - 12; z -= 0.1) if (head.d(x, y, z) <= 0) return z;
    return hz;
  };
  // structured fur: the darker saddle over the crown and down the back of the neck, the muzzle's bridge lighter
  b.paint('head', fn((x, y, z) => -(y - (c + 14.5) + Math.max(0, z - (hz + 4)) * 0.9 - Math.abs(x) * 0.25), [-14, c + 8, hz - 14], [14, c + 30, hz + 12]), 'fur', { shade: 3, where: b.isMat('fur') });
  b.paint('head', capsule([0, c + 10.8, hz + 8], [0, c + 9.8, hz + 18], 1.4), 'fur', { shade: 1, where: b.isMat('fur') });
  // the pale underjaw, throat and the lower lip
  b.paint('head', fn((x, y, z) => y - (c + 5.4 + Math.max(0, z - hz) * 0.05), [-12, c - 4, hz - 12], [12, c + 20, hz + 24]), 'pale', { where: b.isMat('fur') });
  // the black nose at the tip, nostrils, and the lip line running back along the side of the muzzle
  b.add('head', ellipsoid([0, c + 7.6, hz + 20.6], [2.2, 1.7, 1.6]), 'nose');
  for (const k of [-1, 1]) b.paint('head', sphere([k * 0.9, c + 7.1, hz + 22], 0.6), 'pupil');
  for (const k of [-1, 1]) {
    const lip = smoothPath([[k * 2.2, c + 5.4, hz + 20], [k * 3.1, c + 5.2, hz + 15], [k * 4, c + 5.4, hz + 9.5], [k * 4.8, c + 6.2, hz + 6.5]], 3);
    b.paint('head', tube(lip, lip.map(() => 0.7)), 'lip', { where: b.isMat('fur', 'pale') });
  }
  // golden almond eyes on the surface, slanting up at the outer corners, under the heavy brow; dark pupils,
  // a dark rim along the lids, a dark brow ridge above
  for (const k of [-1, 1]) {
    const ex = k * 4.3, ey = c + 10.4;
    const e: V3 = [ex, ey, front(ex, ey) - 0.4];
    b.paint('head', ellipsoid(e, [2.1, 1.25, 1.6], [0, 0, k * 16]), 'eye', { where: b.isMat('fur', 'pale') });
    b.paint('head', ellipsoid([e[0] + k * 0.2, e[1] - 0.1, e[2]], [0.62, 1.05, 1.8]), 'pupil', { where: b.isMat('eye') });
    const lid = smoothPath([[k * 2.1, ey + 0.2, front(k * 2.1, ey + 0.2)], [ex, ey + 1.35, front(ex, ey + 1.35)], [k * 6.6, ey + 1.8, front(k * 6.6, ey + 1.8)]], 3);
    b.paint('head', tube(lid, lid.map(() => 0.6)), 'lip', { where: b.isMat('fur', 'pale') });
    const ridge = smoothPath([[k * 1.8, ey + 2.4, front(k * 1.8, ey + 2.4)], [ex, ey + 3, front(ex, ey + 3)], [k * 6.8, ey + 3.4, front(k * 6.8, ey + 3.4)]], 3);
    b.paint('head', tube(ridge, ridge.map(() => 0.8)), 'fur', { shade: 4, where: b.isMat('fur') });
  }
  // the ears: tall, pointed, flattened front to back, dark inside
  for (const k of [-1, 1]) {
    const base: V3 = [k * 5.6, c + 17, hz - 2];
    b.add('head', intersect(spike(base, [k * 0.3, 1, -0.1], 11, 4, 3, { tip: 0.2 }), fn((x, y, z) => Math.abs(z - (hz - 2) + (y - (c + 17)) * 0.1) - 2.2, [-20, c + 10, hz - 14], [20, c + 34, hz + 10])), 'fur', { thr: 0.3 });
    b.paint('head', intersect(spike([base[0] - k * 0.2, base[1] + 1, base[2] + 1.6], [k * 0.3, 1, -0.1], 8.5, 2.4, 1.6, { tip: 0.25 }), halfSpace([0, 0, hz - 1.2], [0, 0, -1])), 'earIn', { where: b.isMat('fur') });
    b.paint('head', spike([base[0], base[1] + 6, base[2]], [k * 0.3, 1, -0.1], 5, 2.6, 1.6, { tip: 0.2 }), 'fur', { shade: 4, where: b.isMat('fur') });
  }
  // the ruff: thick clumps of fur swept back off the cheeks and round the back of the head
  for (let i = 0; i < 12; i++) {
    const a = -1.25 + (i / 11) * 2.5;
    const k = Math.sign(a) || 1;
    const p: V3 = [Math.sin(a) * 8.4, c + 3.4 + (i % 3) * 1.6, hz + Math.cos(a) * 4 - 1];
    b.add('head', spike(p, [k * 0.5, -0.45, -0.75], 5.5 + (i % 3), 2.6, 1.8, { tip: 0.3 }), i % 3 === 1 ? 'pale' : 'fur', { thr: 0.3 });
  }
  return hz + 14;
}

/** Big gloved hands: an open hand and a fist round a grip channel, the gloves light brown like his fur. */
function hands(b: ModelBuilder, L: Landmarks): void {
  const [wx, wy, wz] = L.wrist;
  const gy = wy - 7.2;
  b.add('palm.L', blend(1.6, box([wx, wy - 4.6, wz + 0.5], [2.6, 4.6, 4], { round: 1.6 }), box([wx - 0.3, wy - 11, wz + 0.7], [2, 4, 3.6], { round: 1.4 })), 'leather', { mirror: true });
  b.add('palm.L', capsule([wx - 1, wy - 3, wz + 3.8], [wx - 2.4, wy - 8.4, wz + 5.6], 1.7, 1.4), 'leather', { mirror: true });
  b.add('palm.L', capsule([wx, wy + 1, wz], [wx, wy - 2.5, wz], 3.2), 'leather', { mirror: true });
  b.add('fist.L', subtract(box([wx - 0.2, gy, wz + 0.6], [3.5, 5, 4.6], { round: 1.8 }), cylinder([wx - 0.2, gy, wz - 10], [wx - 0.2, gy, wz + 10], 1.9)), 'leather', { mirror: true });
  b.add('fist.L', capsule([wx, wy + 1, wz], [wx, wy - 2.5, wz], 3.2), 'leather', { mirror: true });
  b.add('fist.L', capsule([wx - 3, gy + 2.6, wz + 3.6], [wx - 2, gy - 1, wz + 5.2], 1.6), 'leather', { mirror: true });
  for (const y of [gy + 2.4, gy, gy - 2.4]) b.paint('fist.L', aabb([wx + 2.6, y - 0.3, wz - 4], [wx + 4.2, y + 0.3, wz + 5.2]), 'leather', { shade: 3, mirror: true });
}

// ---------------------------------------------------------------------------------------------- clothes

/** The kosode: black over the torso, a deep V showing the pale chest fur, the white collar along its edges. */
function kosode(b: ModelBuilder, L: Landmarks, torso: Sdf): void {
  const s = L.spec;
  const [sx, sy] = s.shoulder;
  // the V: chest fur showing between the lapels (cut out of the cloth, the fur under it painted pale)
  const vt = intersect(prism([[-6.5, sy + 10], [6.5, sy + 10], [0, s.chestY - 6]], [0, 0, 0], [1, 0, 0], [0, 1, 0], 30), halfSpace([0, 0, 4], [0, 0, -1]));
  const shell = subtract(intersect(subtract(offset(torso, 1.6), offset(torso, 0.1)), aabb([-40, s.hipsY - 2, -40], [40, sy + 9, 40])), vt);
  addBands(b, shell, 'black', [['spine', s.hipsY - 3, s.chestY - 6], ['chest', s.chestY - 6, 200]]);
  b.paint('chest', offset(vt, 1), 'pale', { where: b.isMat('fur') });
  // the white collar along both edges of the V, crossing left over right
  const zf = (x: number, y: number) => {
    for (let z = 24; z > -24; z -= 0.1) if (torso.d(x, y, z) <= 1.4) return z;
    return 0;
  };
  for (const k of [-1, 1]) {
    const pts: V3[] = [];
    for (let i = 0; i <= 6; i++) {
      const y = sy + 7 - i * ((sy + 7 - (s.chestY - 6)) / 6);
      const x = k * (6.6 - (i / 6) * 6.2);
      pts.push([x, y, zf(x, y) + 0.4]);
    }
    b.add('chest', tube(pts, pts.map(() => 1.5)), 'collar', { thr: 0.2 });
  }
  b.add('chest', capsule([-6.6, sy + 7, -6], [6.6, sy + 7, -6], 1.7), 'collar');
  // the obi
  const y = s.waistY - 4.5;
  b.add('hips', subtract(box([0, y, -0.5], [s.waist[0] + 3.4, 2.4, s.waist[1] + 3.4], { round: 4 }), box([0, y, -0.5], [s.waist[0] - 0.4, 6, s.waist[1] - 0.4], { round: 3.6 })), 'obi');
  // big folds
  for (const k of [-1, 1]) b.paint('chest', capsule([k * 11, s.chestY + 6, 12.8], [k * 5, s.chestY - 8, 12.6], 1.1), 'black', { shade: 3, where: b.isMat('black') });
  b.paint('chest', capsule([0, sy + 2, -14.6], [0, s.chestY - 10, -14.2], 1), 'black', { shade: 3, where: b.isMat('black') });
}

/** Wide black kosode sleeves to the wrist, the bag hanging behind (spring bones). */
function sleeves(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', cylinder([sx + 1, ey - 2.5, sz - 0.6], [sx + 0.4, sy + 1, sz - 0.3], 7.4, 6.2, 2), 'black', { mirror: true });
  b.add('forearm.L', cylinder([sx + 1.3, wy + 9, sz - 1], [sx + 1, ey + 2.5, sz - 0.6], 7.8, 7, 2), 'black', { mirror: true });
  b.add('forearm.L', sphere([sx + 0.7, ey, sz - 0.5], 6.4), 'black', { mirror: true });
  b.paint('forearm.L', capsule([sx + 7.9, ey - 2, sz + 3], [sx + 8.2, ey - 7, sz - 3], 1), 'black', { shade: 3, mirror: true });
  // the bag
  // the bag: a flat fall of cloth behind the forearm, the lower corner rounded
  const bz = sz - 9.5;
  b.add('sleeve.L', blend(2, box([sx + 1, (ey + wy) / 2 + 1, bz], [2.4, (ey - wy) / 2 + 1, 4.4], { round: 2 }), ellipsoid([sx + 1, wy + 1.5, bz - 0.8], [2.6, 4.4, 5.2])), 'black', { mirror: true });
  for (const dz of [-2.4, 1.8]) b.paint('sleeve.L', capsule([sx + 3.4, ey - 3, bz + dz], [sx + 3.4, wy - 1, bz + dz * 1.2 - 0.5], 0.8), 'black', { shade: 3, mirror: true });
}

/**
 * The captain's haori: white, sleeveless (the shoulder weights cover its shoulders), open down the front, the
 * dark tan lining showing at the edges; 七 in a rhombus on the back; a straight hem near the ankles.
 */
function haori(b: ModelBuilder, L: Landmarks, torso: Sdf): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy] = s.shoulder;
  const opening = intersect(prism([[-5, sy + 14], [5, sy + 14], [8, s.chestY - 4], [9.5, s.hipsY - 6], [-9.5, s.hipsY - 6], [-8, s.chestY - 4]], [0, 0, 0], [1, 0, 0], [0, 1, 0], 40), halfSpace([0, 0, 2], [0, 0, -1]));
  // armholes: the haori stops at the shoulder; the iron weights sit over its edge
  const arms = [-1, 1].map((k) => capsule([k * (sx + 2), sy + 6, -1], [k * (sx - 1), sy - 16, -1], 6.6));
  const shell = subtract(intersect(subtract(offset(torso, 3.6), offset(torso, 1.9)), aabb([-40, s.hipsY - 2, -40], [40, sy + 8, 40])), opening, ...arms);
  addBands(b, shell, 'haori', [['spine', s.hipsY - 3, s.chestY - 6], ['chest', s.chestY - 6, 200]]);
  b.paint(['chest', 'spine'], offset(torso, 2.5), 'haoriIn', { where: b.isMat('haori') });
  // 七 in a rhombus on the back, drawn as seen from behind (the viewer's left is the character's left, +X)
  const SHICHI = [
    '...X......',
    '...X......',
    '...X....XX',
    'XXXXXXXX..',
    '...X......',
    '...X......',
    '...X......',
    '...X....X.',
    '....XXXXX.',
  ];
  const g = b.grid('chest');
  const y0 = s.chestY + 9;
  const mark = (x: number, y: number) => {
    for (let z = -26; z < 2; z++)
      if (g.get(x, y, z) !== 0) {
        b.voxel('chest', x, y, z, 'kanji', 0);
        break;
      }
  };
  SHICHI.forEach((row, r) => {
    for (let ci = 0; ci < row.length; ci++) if (row[ci] === 'X') mark(5 - ci, y0 - r);
  });
  // the rhombus: a diamond outline round it
  const cyR = y0 - 4, R = 10;
  for (let i = -R; i <= R; i++) {
    const w = R - Math.abs(i);
    mark(w, cyR + i);
    mark(-w, cyR + i);
  }
  return coatSkirt(b, L, { mat: 'haori', lining: 'haoriIn', yTop: s.waistY - 2, yHem: 12, r0: 20, r1: 24.5, openFront: 18, overlap: 8, res: KOMAMURA_RES });
}

/** The shoulder weights: heavy iron blocks riding on his shoulders, rimmed, a rope knotted through each. */
function weights(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  b.add('chest', blend(1.2, box([sx - 1, sy + 4.5, sz], [6.5, 3.6, 8.6], { round: 2.4 }), box([sx + 2.5, sy + 1.5, sz], [3.4, 4, 7.6], { round: 2 })), 'iron', { mirror: true });
  b.paint('chest', fn((x, y, z) => Math.max(Math.abs(y - (sy + 7.4)) - 0.7, Math.abs(Math.abs(x) - (sx - 1)) - 7.2), [sx - 10, sy - 4, sz - 12], [sx + 10, sy + 10, sz + 12]), 'ironRim', { mirror: true, where: b.isMat('iron') });
  for (const dz of [-4.5, 0, 4.5]) b.add('chest', sphere([sx + 0.5, sy + 8.4, sz + dz], 1.1), 'ironRim', { mirror: true });
  b.add('chest', torus([sx + 4.6, sy + 2, sz], 2.2, 0.8, [0, 0, 90]), 'lace', { mirror: true, thr: 0.2 });
}

/** Bracers over the forearms: light brown leather laced along the outside, a rim at each end. */
function bracers(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, , sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('forearm.L', cylinder([sx, wy + 0.5, sz], [sx, wy + 13, sz], 5.4, 6.2, 1.2), 'leather', { mirror: true });
  for (const y of [wy + 1, wy + 12.5]) b.add('forearm.L', torus([sx, y, sz], y > wy + 5 ? 6.2 : 5.4, 0.8), 'leather', { mirror: true, thr: 0.2 });
  for (let y = wy + 3; y < wy + 11; y += 2.4) b.paint('forearm.L', capsule([sx + 5.6, y, sz - 1.4], [sx + 5.9, y + 1.2, sz + 1.4], 0.45), 'lace', { mirror: true });
  void ey;
}

/** The hakama: wide black legs gathered into the boots below the knee. */
function hakama(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [hx, hy] = s.hip;
  const ky = L.knee[1];
  b.add('hips', box([0, s.hipsY - 2, -0.5], [s.hips[0] + 3.4, 9, s.hips[1] + 4], { round: 4.5 }), 'black');
  b.add('thigh.L', blend(2, sphere([hx, hy, 0], 9), cylinder([hx + 0.6, ky + 3, -0.5], [hx, hy + 2, -0.5], 10.6, 9.6, 2.4)), 'black', { mirror: true });
  b.add('hakama.L', subtract(cylinder([hx + 1, ky - 8, -0.6], [hx + 0.6, ky + 8, -0.6], 11.4, 10.4, 2), cylinder([hx + 1, ky - 10, -0.6], [hx + 1, ky - 4, -0.6], 9, 9)), 'black', { mirror: true });
  for (const a of [-50, -15, 20, 55, 150, 210]) {
    const r = (a * Math.PI) / 180;
    b.paint('thigh.L', capsule([hx + Math.sin(r) * 10, hy - 2, Math.cos(r) * 10], [hx + Math.sin(r) * 10.6, ky + 4, Math.cos(r) * 10.6], 1.1), 'black', { shade: 3, mirror: true, where: b.isMat('black') });
    b.paint('hakama.L', capsule([hx + Math.sin(r) * 11, ky + 7, Math.cos(r) * 11], [hx + Math.sin(r) * 11.6, ky - 7, Math.cos(r) * 11.6], 1.1), 'black', { shade: 3, mirror: true, where: b.isMat('black') });
  }
  b.add('shin.L', capsule([hx, ky + 2, 0], [hx, L.ankle[1] + 6, 0], 5.6, 4.6), 'black', { mirror: true });
}

/** Heavy plated iron boots to below the knee: overlapping plates down the shin, a broad iron foot. */
function boots(b: ModelBuilder, L: Landmarks): void {
  const [ax, ay, az] = L.ankle;
  const f = L.spec.foot;
  const ky = L.knee[1];
  b.add('shin.L', cylinder([ax, ay + 2, az], [ax, ky - 3, az + 0.6], 6, 7, 1.6), 'iron', { mirror: true });
  for (let i = 0; i < 4; i++) {
    const y = ay + 6 + i * 5.4;
    b.add('shin.L', intersect(cylinder([ax, y, az + 0.4], [ax, y + 4.8, az + 0.6], 6.9, 7.5, 1), halfSpace([0, 0, az - 1], [0, 0, -1])), 'iron', { mirror: true });
    b.paint('shin.L', aabb([ax - 9, y - 0.4, az - 1], [ax + 9, y + 0.5, az + 10]), 'ironRim', { mirror: true, where: b.isMat('iron') });
  }
  b.add('shin.L', torus([ax, ky - 2.6, az + 0.6], 7.2, 1.2), 'ironRim', { mirror: true, thr: 0.2 });
  b.add('foot.L', capsule([ax, ay + 4, az - 0.6], [ax, ay - 2, az - 0.6], 6), 'iron', { mirror: true });
  b.add('foot.L', intersect(box([ax, 3.6, az + (f.len / 2 - f.heel)], [f.w / 2 + 0.6, 3.6, f.len / 2 + 0.4], { round: 2.4 }), halfSpace([0, 7.6, az + f.len - f.heel - 6], [0, 1, 0.7])), 'iron', { mirror: true });
  for (const z of [az + 6, az + 10.5]) b.paint('foot.L', aabb([ax - 8, 0, z - 0.4], [ax + 8, 10, z + 0.5]), 'ironRim', { mirror: true, where: b.isMat('iron') });
  b.paint('foot.L', aabb([ax - 9, 0, az - 10], [ax + 9, 1.2, az + 24]), 'iron', { shade: 4, mirror: true });
}

// ---------------------------------------------------------------------------------------------- props

/**
 * Tenken: a plain katana scaled to him — a long straight blade with a slight curve and a pale hamon, a
 * squared hourglass guard with lines engraved along it, a long dark-wrapped grip and an iron pommel.
 * Prop frame: the grip at the origin, the blade along +Z, the edge toward -Y.
 */
function buildTenken(): VoxelModel {
  const b = new ModelBuilder('komamura-tenken', KOMAMURA_RES);
  b.mat('steel', ['#E4E8EC', '#D4D9DF', '#B9BFC6', '#9AA1A9'], { base: 1, rough: 0.2, metal: 0.9 });
  b.mat('edge', ['#EEF1F3'], { rough: 0.15, metal: 0.9 });
  b.mat('guard', ['#5E5E60', '#4A4A4C', '#363638'], { base: 1, rough: 0.4, metal: 0.7 });
  b.mat('wrap', ['#4A3B30', '#3A2E25', '#2A211B'], { base: 1, rough: 0.8 });
  b.mat('same', ['#E8E0CE', '#D4C9B0']);
  b.bone('root', null, [0, 0, 0]);
  // the blade: back along +Y, a gentle curve, the point clipped
  const curve = (z: number) => ((z - 6) / 54) ** 2 * 2.2;
  b.add('root', fn((x, y, z) => {
    if (z < 5 || z > 61) return 1;
    const u = (z - 5) / 56;
    const w = 2.1 - u * 0.4;
    const yc = curve(z);
    const tip = z > 56 ? (z - 56) * 0.9 : 0;
    return Math.max(Math.abs(x) - 0.6, Math.abs(y - yc) - w, y - yc - w + tip * 0.8, -(y - yc) - w + tip * 0.15);
  }, [-2, -4, 4], [2, 6, 62]), 'steel');
  b.paint('root', fn((x, y, z) => y - (curve(z) - 1.1), [-2, -4, 4], [2, 6, 62]), 'edge', { where: b.isMat('steel') });
  // the guard: a squared hourglass, the long sides pinched in, lines engraved along it
  b.add('root', fn((x, y, z) => {
    const pinch = 3.4 - Math.cos((x / 4.6) * Math.PI * 0.5) * 0.9;
    return Math.max(Math.abs(x) - 4.6, Math.abs(y) - pinch, Math.abs(z - 3.6) - 0.8);
  }, [-6, -5, 2], [6, 5, 5.5]), 'guard');
  for (const x of [-3, -1, 1, 3]) b.paint('root', aabb([x - 0.2, -5, 2], [x + 0.2, 5, 5.5]), 'guard', { shade: 2 });
  b.add('root', cylinder([0, 0, 2.6], [0, 0, 5.4], 1.7, 1.7, 0.4), 'guard');
  // the grip: long, wrapped in diamonds over the same
  b.add('root', box([0, 0, -6], [1.3, 1.6, 8.6], { round: 0.8 }), 'same');
  b.add('root', fn((x, y, z) => {
    if (z < -14 || z > 2.4) return 1;
    const band = Math.abs(((z + 40) % 3) - 1.5) - 0.6 + Math.abs(x) * 0.3;
    return Math.max(Math.hypot(x / 1.5, y / 1.8) - 1, band);
  }, [-3, -3, -15], [3, 3, 3]), 'wrap');
  b.add('root', box([0, 0, -15.2], [1.6, 1.9, 1], { round: 0.6 }), 'guard');
  b.autoShade();
  b.lint();
  return b.build();
}

/**
 * The giant's sword (prop frame in metres before the giant's scale; built at the giant's density): a long
 * blade, a guard like Tenken's, a red cord hanging from the hilt.
 */
function buildGiantSword(): VoxelModel {
  const b = new ModelBuilder('komamura-giant-sword', GIANT_RES * GIANT_SCALE);
  b.mat('steel', ['#D2D7DD', '#B9BFC6', '#9AA1A9', '#7D848C'], { base: 1, rough: 0.25, metal: 0.85 });
  b.mat('edge', ['#E6E9EC'], { rough: 0.15, metal: 0.9 });
  b.mat('guard', ['#3A3A3C', '#2A2A2C', '#1C1C1E'], { base: 1, rough: 0.4, metal: 0.6 });
  b.mat('wrap', ['#2A2422', '#1C1816', '#141418'], { base: 1, rough: 0.8 });
  b.mat('cord', ['#C24A3E', '#B03A2E', '#8A2C22'], { base: 1, rough: 0.7 });
  b.bone('root', null, [0, 0, 0]);
  // model metres to voxels (the giant is built at Komamura's size and scaled up at runtime)
  const v = (m: number) => m * GIANT_RES * GIANT_SCALE;
  // blade: from just past the guard to the point, along +Z
  b.add('root', fn((x, y, z) => {
    if (z < v(0.12) || z > v(1.78)) return 1;
    const u = (z - v(0.12)) / v(1.66);
    const w = v(0.07) * (1 - u * 0.25);
    const tip = z > v(1.6) ? (z - v(1.6)) * 0.8 : 0;
    return Math.max(Math.abs(x) - v(0.014) - 0.5, Math.abs(y) - w + tip);
  }, [-3, -v(0.1), v(0.1)], [3, v(0.1), v(1.8)]), 'steel');
  b.paint('root', fn((x, y) => y + v(0.04), [-3, -v(0.1), v(0.1)], [3, v(0.1), v(1.8)]), 'edge', { where: b.isMat('steel') });
  b.add('root', box([0, 0, v(0.07)], [v(0.2), v(0.13), v(0.035)], { round: 0.5 }), 'guard');
  b.add('root', box([0, 0, -v(0.25)], [v(0.045), v(0.05), v(0.3)], { round: 0.5 }), 'wrap');
  // the red cord off the pommel
  b.add('root', tube([[0, 0, -v(0.55)], [0, -v(0.12), -v(0.7)], [0, -v(0.3), -v(0.75)], [0, -v(0.5), -v(0.72)]], [v(0.02) + 0.6, v(0.02) + 0.6, v(0.018) + 0.6, v(0.015) + 0.6]), 'cord', { thr: 0.2 });
  b.autoShade();
  b.lint();
  return b.build();
}

// ---------------------------------------------------------------------------------------------- the giant

export type GiantPart = 'whole' | 'limbs';

/**
 * Kokujō Tengen Myō'ō: the armoured samurai giant. Built at GIANT_RES vox per (scaled) metre on Komamura's
 * proportions so the same pose drives it: grey skin, black lacquered armour (a horned kabuto with a brim and a
 * crest, a menpō over the jaw, broad layered sode, a laced cuirass, a skirt of plates, thigh guards), grey
 * gauntlets and greaves, black ropes coiled round the chest and the arms, eyes glaring out of the kabuto's
 * shadow. `limbs` builds only the arms and legs: Tenken's phantom limbs (the rest of the body is never there).
 */
export function buildGiant(part: GiantPart = 'whole'): CharacterAsset {
  const res = GIANT_RES * GIANT_SCALE;
  const b = new ModelBuilder(part === 'whole' ? 'komamura-giant' : 'komamura-giant-limbs', res);
  b.mat('skin', ['#A6A6A8', '#8D8D8F', '#727274', '#58585A'], { base: 1, rough: 0.7, shadeK: 0.9 });
  b.mat('armor', ['#3E3E43', '#2C2C31', '#212125', '#18181A', '#141418'], { base: 2, rough: 0.38, metal: 0.3, shadeK: 1 });
  b.mat('trim', ['#8A8A8E', '#6E6E70', '#555557'], { base: 1, rough: 0.4, metal: 0.5 });
  b.mat('rope', ['#2C2C2F', '#1E1E21', '#141418'], { base: 1, rough: 0.9 });
  b.mat('eye', ['#FFD86A', '#FFB22E'], { base: 0, rough: 0.3, glow: 2.2 });
  b.mat('horn', ['#9A9A9C', '#7E7E80', '#606062'], { base: 1, rough: 0.35, metal: 0.4 });
  b.mat('teeth', ['#D8D6CF', '#B9B6AE'], { base: 0, rough: 0.5 });
  // the skeleton on Komamura's proportions, in giant voxels (1 giant voxel = 48 / res metres-per-48 of his)
  const k = res / KOMAMURA_RES;
  const sc = (v: number) => v * k;
  const S = SPEC;
  const gs: HumanoidSpec = {
    H: sc(S.H), chinY: sc(S.chinY), head: { w: sc(S.head.w), d: sc(S.head.d), h: sc(S.head.h) }, neckR: sc(S.neckR),
    shoulder: [sc(S.shoulder[0]), sc(S.shoulder[1]), sc(S.shoulder[2])], upperArm: sc(S.upperArm), foreArm: sc(S.foreArm), hand: sc(S.hand), armR: sc(S.armR),
    hipsY: sc(S.hipsY), hip: [sc(S.hip[0]), sc(S.hip[1]), sc(S.hip[2])], kneeY: sc(S.kneeY), ankleY: sc(S.ankleY),
    chest: [sc(S.chest[0]), sc(S.chest[1])], waist: [sc(S.waist[0]), sc(S.waist[1])], hips: [sc(S.hips[0]), sc(S.hips[1])],
    chestY: sc(S.chestY), waistY: sc(S.waistY), foot: { len: sc(S.foot.len), w: sc(S.foot.w), heel: sc(S.foot.heel) },
  };
  const L = humanoidSkeleton(b, gs, {});
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx, wy - sc(7.2), wz + sc(0.6)]);
  b.socket('grip.L', 'fist.L', [wx, wy - sc(7.2), wz + sc(0.6)]);
  b.socket('knuckle.R', 'fist.R', [-wx, wy - sc(7.2), wz + sc(5.6)]);
  b.socket('knuckle.L', 'fist.L', [wx, wy - sc(7.2), wz + sc(5.6)]);
  const [sx, sy, sz] = gs.shoulder;
  if (part === 'whole') giantTorso(b, L, sc);
  // ---- arms: grey skin under black upper-arm plates, grey kote down the forearms, a rope coiled at the biceps
  const ey = L.elbow[1];
  b.add('upperarm.L', blend(sc(2), sphere([sx, sy - sc(1), sz], sc(7)), capsule([sx, sy - sc(2), sz], [sx, ey + sc(1), sz], sc(6.6), sc(5.6))), 'skin', { mirror: true });
  b.add('upperarm.L', intersect(subtract(capsule([sx, sy - sc(6), sz], [sx, ey + sc(3), sz], sc(7.8), sc(6.8)), capsule([sx, sy - sc(6), sz], [sx, ey + sc(3), sz], sc(5.8), sc(5))), halfSpace([sx - sc(1), 0, 0], [-1, 0, 0])), 'armor', { mirror: true });
  for (const dy of [0, sc(1.8)]) b.add('upperarm.L', torus([sx, ey + sc(6.5) + dy, sz], sc(6.7), sc(1.1)), 'rope', { mirror: true, thr: 0.2 });
  b.add('forearm.L', blend(sc(2), sphere([sx, ey, sz], sc(5.8)), capsule([sx, ey - sc(1), sz], [sx, wy + sc(1.5), sz], sc(6.4), sc(5.2))), 'trim', { mirror: true });
  for (let i = 0; i < 4; i++) {
    const y = wy + sc(3) + i * sc(4.4);
    b.add('forearm.L', intersect(capsule([sx, y, sz], [sx, y + sc(3.6), sz], sc(6.9) - i * sc(0.15), sc(6.6) - i * sc(0.15)), halfSpace([sx + sc(1.5), 0, 0], [-1, 0, 0])), 'armor', { mirror: true });
  }
  b.add('forearm.L', torus([sx, ey - sc(1), sz], sc(6.2), sc(1)), 'trim', { mirror: true, thr: 0.2 });
  // ---- the sode: broad layered shoulder plates
  for (let i = 0; i < 3; i++) {
    const r = sc(11.6) - i * sc(0.5), y0 = sy - sc(3) - i * sc(3.4);
    b.add('upperarm.L', intersect(subtract(sphere([sx, sy, sz], r), sphere([sx, sy, sz], r - sc(1.8))), halfSpace([0, y0, 0], [0, -1, 0]), halfSpace([0, y0 + sc(4.6), 0], [0, 1, 0]), halfSpace([sx - sc(2.5), 0, 0], [-1, 0, 0])), 'armor', { mirror: true });
    b.paint('upperarm.L', aabb([sx - sc(2), y0 - 0.6, sz - sc(14)], [sx + sc(14), y0 + 0.6, sz + sc(14)]), 'trim', { mirror: true, where: b.isMat('armor') });
  }
  b.add('upperarm.L', intersect(subtract(sphere([sx, sy, sz], sc(11.6)), sphere([sx, sy, sz], sc(9.8))), halfSpace([0, sy - sc(3), 0], [0, -1, 0]), halfSpace([sx - sc(2.5), 0, 0], [-1, 0, 0])), 'armor', { mirror: true });
  // ---- hands: armoured fists and open hands
  b.add('fist.L', box([wx, wy - sc(6), wz + sc(0.6)], [sc(4.2), sc(5.8), sc(5.2)], { round: sc(1.8) }), 'trim', { mirror: true });
  b.add('fist.L', box([wx + sc(1.2), wy - sc(2.4), wz + sc(0.6)], [sc(3.4), sc(2.6), sc(5)], { round: sc(1.2) }), 'armor', { mirror: true });
  for (const y of [wy - sc(4.4), wy - sc(6.8), wy - sc(9.2)]) b.paint('fist.L', aabb([wx - sc(5), y - 0.5, wz - sc(6)], [wx + sc(5), y + 0.5, wz + sc(6)]), 'trim', { shade: 2, mirror: true, where: b.isMat('trim') });
  b.add('palm.L', box([wx, wy - sc(6.4), wz + sc(0.6)], [sc(3.2), sc(6.6), sc(4.8)], { round: sc(1.6) }), 'trim', { mirror: true });
  b.add('palm.L', box([wx + sc(1.2), wy - sc(2.4), wz + sc(0.6)], [sc(3.4), sc(2.6), sc(5)], { round: sc(1.2) }), 'armor', { mirror: true });
  // ---- legs: black thighs under plated haidate, grey greaves with knee guards, armoured feet
  b.add('thigh.L', blend(sc(2), sphere([gs.hip[0], gs.hip[1], 0], sc(8.4)), capsule([gs.hip[0], gs.hip[1], 0], [L.knee[0], L.knee[1] + sc(2), 0], sc(8), sc(6.4))), 'armor', { mirror: true });
  for (let i = 0; i < 3; i++) {
    const y = gs.hip[1] - sc(4) - i * sc(6.4);
    b.add('thigh.L', intersect(subtract(cylinder([gs.hip[0], y - sc(6), 0], [gs.hip[0], y, 0], sc(10.4) - i * sc(0.4), sc(10) - i * sc(0.4), 1), cylinder([gs.hip[0], y - sc(8), 0], [gs.hip[0], y + sc(2), 0], sc(8.4) - i * sc(0.4), sc(8.4) - i * sc(0.4))), halfSpace([0, 0, -sc(2)], [0, 0, -1])), 'armor', { mirror: true });
    b.paint('thigh.L', aabb([gs.hip[0] - sc(14), y - sc(6) - 0.5, -sc(2)], [gs.hip[0] + sc(14), y - sc(6) + 0.6, sc(14)]), 'trim', { mirror: true, where: b.isMat('armor') });
  }
  b.add('shin.L', blend(sc(2), sphere([L.knee[0], L.knee[1], 0], sc(6.2)), capsule([L.knee[0], L.knee[1], 0], [L.ankle[0], L.ankle[1] + sc(2), 0], sc(6.4), sc(5.2))), 'trim', { mirror: true });
  b.add('shin.L', intersect(subtract(capsule([L.knee[0], L.knee[1] - sc(4), 0], [L.ankle[0], L.ankle[1] + sc(4), 0], sc(7.6), sc(6.4)), capsule([L.knee[0], L.knee[1] - sc(4), 0], [L.ankle[0], L.ankle[1] + sc(4), 0], sc(5.6), sc(4.6))), halfSpace([0, 0, -sc(0.5)], [0, 0, -1])), 'armor', { mirror: true });
  b.add('shin.L', ellipsoid([L.knee[0], L.knee[1] + sc(0.5), sc(4.8)], [sc(5), sc(5.4), sc(3)]), 'armor', { mirror: true });
  b.add('shin.L', torus([L.ankle[0], L.ankle[1] + sc(9), 0], sc(6.2), sc(1)), 'rope', { mirror: true, thr: 0.2 });
  b.add('foot.L', box([L.ankle[0], sc(3.6), L.ankle[2] + sc(5)], [sc(5.6), sc(3.6), sc(11.6)], { round: sc(2.2) }), 'armor', { mirror: true });
  for (const z of [sc(4), sc(8.5)]) b.paint('foot.L', aabb([L.ankle[0] - sc(8), 0, L.ankle[2] + z - 0.5], [L.ankle[0] + sc(8), sc(10), L.ankle[2] + z + 0.5]), 'trim', { mirror: true, where: b.isMat('armor') });
  b.autoShade();
  b.lint();
  return { model: b.build(), springs: [], colliders: [], warnings: b.warnings };
}

/** the giant's torso, neck and head (not part of Tenken's phantom limbs) */
function giantTorso(b: ModelBuilder, L: Landmarks, sc: (v: number) => number): void {
  const gs = L.spec;
  const [cx, cz] = gs.chest, [wxx, wzz] = gs.waist;
  const [sx, sy, sz] = gs.shoulder;
  const torso = blend(sc(5),
    box([0, gs.chestY - sc(1), -sc(0.5)], [cx + sc(1), sc(11), cz + sc(0.5)], { round: sc(7) }),
    box([0, gs.waistY, -sc(0.5)], [wxx + sc(1), sc(8), wzz + sc(0.5)], { round: sc(6) }),
    box([0, gs.hipsY + sc(1), -sc(0.5)], [gs.hips[0] + sc(1), sc(6.5), gs.hips[1] + sc(0.5)], { round: sc(5) }),
    capsule([sc(4), sy + sc(3.5), sz - sc(1.5)], [sx - sc(3), sy, sz], sc(5.6), sc(5.8)),
    capsule([-sc(4), sy + sc(3.5), sz - sc(1.5)], [-sx + sc(3), sy, sz], sc(5.6), sc(5.8)),
    sphere([sx, sy - sc(1), sz], sc(6.8)), sphere([-sx, sy - sc(1), sz], sc(6.8)));
  addBands(b, torso, 'skin', [['hips', 0, gs.waistY - sc(1)], ['spine', gs.waistY - sc(1), gs.chestY - sc(6)], ['chest', gs.chestY - sc(6), 400]]);
  // the cuirass: black lacquer in rows of plates, each row's lower edge standing proud
  const outer = offset(torso, sc(2));
  const cuirass = intersect(subtract(outer, offset(torso, sc(0.2))), aabb([-90, gs.hipsY - sc(2), -90], [90, sy + sc(5), 90]));
  addBands(b, cuirass, 'armor', [['spine', 0, gs.chestY - sc(6)], ['chest', gs.chestY - sc(6), 400]]);
  for (let y = gs.waistY - sc(5); y < gs.chestY + sc(6); y += sc(4.8)) {
    const ridge = intersect(subtract(offset(torso, sc(2.9)), offset(torso, sc(1))), aabb([-90, y - 0.6, -90], [90, y + 0.6, 90]));
    addBands(b, ridge, 'armor', [['spine', 0, gs.chestY - sc(6)], ['chest', gs.chestY - sc(6), 400]]);
    b.paint(['spine', 'chest'], aabb([-90, y - 0.6, -90], [90, y + 0.6, 90]), 'armor', { shade: 0, where: b.isMat('armor') });
  }
  // lacing: short vertical cords down the plates, front and back
  for (const x of [-sc(6), sc(6)])
    for (const zs of [1, -1])
      b.paint(['spine', 'chest'], fn((px, py, pz) => Math.max(Math.abs(px - x) - 0.5, -(pz * zs)), [x - 2, gs.waistY - sc(6), -90], [x + 2, gs.chestY + sc(7), 90]), 'rope', { where: b.isMat('armor') });
  // the black ropes coiled round the chest: closed loops hugging the cuirass
  const loop = (y: number, tilt: number, r: number): V3[] => {
    const pts: V3[] = [];
    for (let i = 0; i <= 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      const dx = Math.sin(a), dz = Math.cos(a);
      const yy = y + dz * tilt;
      let rr = 0;
      while (rr < 80 && outer.d(dx * rr, yy, -sc(0.5) + dz * rr) < 0) rr += 0.25;
      pts.push([dx * (rr + r * 0.55), yy, -sc(0.5) + dz * (rr + r * 0.55)]);
    }
    return pts;
  };
  for (const [dy, tilt] of [[sc(-1), sc(1.5)], [sc(3.4), sc(1.5)], [sc(7.8), sc(1.5)]]) {
    const pts = loop(gs.chestY + dy, tilt, sc(1.3));
    b.add('chest', tube(pts, pts.map(() => sc(1.3))), 'rope', { thr: 0.2 });
  }
  // the knot of the ropes over the sternum, the ends hanging
  b.add('chest', sphere([0, gs.chestY + sc(3.4), cz + sc(3.6)], sc(2.4)), 'rope');
  for (const kk of [-1, 1]) b.add('chest', tube([[kk * sc(1), gs.chestY + sc(2), cz + sc(4)], [kk * sc(2.2), gs.chestY - sc(4), cz + sc(4.4)], [kk * sc(2.8), gs.chestY - sc(10), cz + sc(4.2)]], [sc(1.1), sc(1), sc(0.9)]), 'rope', { thr: 0.2 });
  // the plate skirt (kusazuri): seven tassets of four lames each, hung from inside the cuirass
  for (let i = 0; i < 7; i++) {
    const a = ((i - 3) / 7) * Math.PI * 2 + Math.PI;
    const r = gs.hips[0] + sc(0.4);
    const px = Math.sin(a) * r, pz = Math.cos(a) * r * 0.8 - sc(0.5);
    for (let j = 0; j < 4; j++) {
      const y = gs.hipsY - sc(1) - j * sc(3.2);
      const out = j * sc(0.7);
      b.add('hips', box([px + Math.sin(a) * out, y, pz + Math.cos(a) * out], [sc(5.2), sc(1.9), sc(1.4)], { rot: [-8 - j * 4, (a * 180) / Math.PI, 0], round: 0.6 }), 'armor');
    }
    b.paint('hips', aabb([px - sc(6), gs.hipsY - sc(13), pz - sc(6)], [px + sc(6), gs.hipsY - sc(12.2), pz + sc(6)]), 'trim', { where: b.isMat('armor') });
  }
  b.add('hips', box([0, gs.hipsY + sc(0.5), -sc(0.5)], [gs.hips[0] + sc(1.6), sc(2.6), gs.hips[1] + sc(1.6)], { round: sc(2.4) }), 'rope');
  // the gorget round the neck
  b.add('chest', intersect(subtract(ellipsoid([0, sy + sc(4.5), sz - sc(1)], [sc(11), sc(6.4), sc(9.6)]), ellipsoid([0, sy + sc(4.5), sz - sc(1)], [sc(7.6), sc(9), sc(6.6)])), halfSpace([0, sy + sc(4), 0], [0, -1, 0]), halfSpace([0, sy + sc(8.6), 0], [0, 1, 0])), 'armor');
  b.add('neck', capsule([0, gs.chinY - sc(10), L.headC[2] - sc(1.5)], [0, gs.chinY + sc(3), L.headC[2] - sc(1.5)], gs.neckR + sc(0.6)), 'skin');
  giantHead(b, L, sc);
}

/** the kabuto (horns, a crest, the brim, the flaring neck guard), the glaring eyes, the menpō with its grimace */
function giantHead(b: ModelBuilder, L: Landmarks, sc: (v: number) => number): void {
  const gs = L.spec;
  const c = gs.chinY, hz = L.headC[2];
  const face = blend(sc(2), ellipsoid([0, c + sc(10), hz], [sc(8.8), sc(10), sc(9.4)]), box([0, c + sc(4), hz + sc(3)], [sc(7), sc(4.8), sc(6.6)], { round: sc(2) }));
  b.add('head', face, 'skin');
  const front = (x: number, y: number) => {
    for (let z = hz + sc(24); z > hz - sc(10); z -= 0.1) if (face.d(x, y, z) <= 0) return z;
    return hz;
  };
  // the kabuto bowl: plates down from a crown ring, ridges between them
  const bowl = intersect(subtract(ellipsoid([0, c + sc(12.4), hz - sc(0.6)], [sc(10.8), sc(9.8), sc(11.2)]), ellipsoid([0, c + sc(11.4), hz - sc(0.6)], [sc(9.2), sc(8.6), sc(9.6)])), halfSpace([0, c + sc(10.8), 0], [0, -1, 0]));
  b.add('head', bowl, 'armor');
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    b.paint('head', fn((x, y, z) => Math.abs(Math.sin(Math.atan2(x, z - (hz - sc(0.6))) - a)) * Math.hypot(x, z - (hz - sc(0.6))) - 0.6, [-60, c + sc(10), hz - 60], [60, c + sc(24), hz + 60]), 'armor', { shade: 0, where: b.isMat('armor') });
  }
  b.add('head', cylinder([0, c + sc(21.4), hz - sc(0.6)], [0, c + sc(22.6), hz - sc(0.6)], sc(2.6), sc(2.2), 0.5), 'trim');
  // the brim jutting over the eyes
  b.add('head', intersect(subtract(ellipsoid([0, c + sc(11.2), hz + sc(1)], [sc(11.4), sc(1.6), sc(12.4)]), ellipsoid([0, c + sc(11.2), hz - sc(0.6)], [sc(8.6), sc(4), sc(9.2)])), halfSpace([0, 0, hz + sc(1)], [0, 0, -1])), 'armor');
  b.paint('head', fn((x, y, z) => Math.abs(Math.hypot(x / sc(11.4), (z - hz - sc(1)) / sc(12.4)) - 0.97) * 12 - 0.5, [-60, c + sc(9), hz], [60, c + sc(13), hz + 60]), 'trim', { where: b.isMat('armor') });
  // the neck guard (shikoro) flaring out behind and to the sides in three lames
  for (let i = 0; i < 3; i++) {
    const y = c + sc(9.6) - i * sc(2.6);
    const r = sc(11.6) + i * sc(1.2);
    b.add('head', intersect(subtract(ellipsoid([0, y, hz - sc(2)], [r, sc(3.2), r * 0.95]), ellipsoid([0, y + sc(1.4), hz - sc(1.6)], [r - sc(1.8), sc(4), r * 0.95 - sc(1.8)])), halfSpace([0, 0, hz + sc(2.5)], [0, 0, 1]), halfSpace([0, y + sc(1.2), 0], [0, 1, 0])), 'armor');
    b.paint('head', aabb([-60, y - sc(1.8), hz - 60], [60, y - sc(1.1), hz + sc(3)]), 'trim', { where: b.isMat('armor') });
  }
  // the kuwagata horns and the crest plate between them
  for (const kk of [-1, 1]) b.add('head', spike([kk * sc(3.4), c + sc(18), hz + sc(8.6)], [kk * 0.75, 1, 0.25], sc(15), sc(2.4), sc(1.4), { bend: [kk * 0.25, 0.3, 0], tip: 0.3 }), 'horn', { thr: 0.3 });
  b.add('head', box([0, c + sc(17), hz + sc(9.6)], [sc(4), sc(3), sc(1)], { rot: [-14, 0, 45], round: 0.5 }), 'horn');
  b.add('head', box([0, c + sc(14.6), hz + sc(9.8)], [sc(2.6), sc(2.6), sc(1.2)], { round: 0.5 }), 'horn');
  // the eyes: the kabuto's shadow over the brow, the eyes glaring out of it
  b.paint('head', aabb([-sc(8), c + sc(7.8), hz], [sc(8), c + sc(10.8), hz + sc(14)]), 'skin', { shade: 3, where: b.isMat('skin') });
  for (const kk of [-1, 1]) {
    const ex = kk * sc(3.6), ey = c + sc(9.2);
    b.paint('head', ellipsoid([ex, ey, front(ex, ey) - sc(0.5)], [sc(2.4), sc(1.05), sc(1.8)], [0, 0, kk * 12]), 'eye', { where: b.isMat('skin') });
    b.paint('head', capsule([kk * sc(1.4), c + sc(10.4), front(kk * sc(1.4), c + sc(10.4)) - 0.4], [kk * sc(6.4), c + sc(11.2), front(kk * sc(6.4), c + sc(11.2)) - 0.4], sc(0.7)), 'skin', { shade: 3, where: b.isMat('skin') });
  }
  // the menpō: a shaped plate over the jaw and the cheeks, a grimace cut into it, teeth behind, a bristling moustache
  const jaw = blend(sc(1.5), box([0, c + sc(4), hz + sc(3)], [sc(7), sc(4.8), sc(6.6)], { round: sc(2) }), ellipsoid([0, c + sc(6), hz + sc(4)], [sc(8.4), sc(4), sc(7)]));
  const menpo = intersect(subtract(offset(jaw, sc(1.6)), jaw), halfSpace([0, c + sc(7.4), 0], [0, 1, 0]), halfSpace([0, 0, hz + sc(1)], [0, 0, -1]));
  b.add('head', menpo, 'armor');
  const mouthY = c + sc(4.4);
  b.paint('head', fn((x, y, z) => Math.max(Math.abs(y - mouthY - Math.abs(x) * 0.12) - sc(0.9), Math.abs(x) - sc(4.6)), [-sc(8), mouthY - sc(3), hz], [sc(8), mouthY + sc(3), hz + sc(16)]), 'teeth', { where: b.isMat('armor') });
  for (const x of [-sc(3.4), -sc(1.7), 0, sc(1.7), sc(3.4)]) b.paint('head', aabb([x - 0.5, mouthY - sc(2), hz], [x + 0.5, mouthY + sc(2), hz + sc(16)]), 'rope', { where: b.isMat('teeth') });
  for (const kk of [-1, 1]) b.add('head', spike([kk * sc(1.4), c + sc(6.8), front(kk * sc(1.4), c + sc(6.8)) + sc(1)], [kk * 1, -0.35, 0.2], sc(7), sc(1.4), sc(0.9), { bend: [0, -0.3, 0], tip: 0.3 }), 'rope', { thr: 0.3 });
  b.add('head', ellipsoid([0, c + sc(7.4), front(0, c + sc(7.4)) + sc(0.8)], [sc(1.8), sc(1.6), sc(1.6)]), 'armor');
  // the throat guard hanging under the menpō
  b.add('head', intersect(subtract(ellipsoid([0, c + sc(0.5), hz + sc(3)], [sc(8.8), sc(4.6), sc(8.6)]), ellipsoid([0, c + sc(1.5), hz + sc(2)], [sc(7), sc(4.6), sc(6.8)])), halfSpace([0, c + sc(1.4), 0], [0, 1, 0]), halfSpace([0, 0, hz + sc(1)], [0, 0, -1])), 'armor');
}
