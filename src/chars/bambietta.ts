// Bambietta Basterbine (docs/roster/H2-sternritter-1.md §3; kit docs/kits/bambietta.md). Brief: 156 cm → 75 vox at
// 48/m (head 12, ≈ 1/6.2); slender and small. Silhouette keys: the long straight dark-purple hair to the hips, the
// white peaked cap (gold band, black peak, the Zeichen on its front), the white coat flaring over a miniskirt, black
// stockings and white knee boots, the order's hooded cloak behind her. Face: dark-purple eyes under thin brows, lashes,
// a smug half-smile. Trim: red at the gloves' and boots' cuffs, the red heart buckle. Forms: 'base'; 'zofiel'
// (Quincy: Vollständig: two great crimson wings off the upper back — a leading edge and long blade feathers hanging
// from it — with clusters of reishi orbs budding along their undersides; the star halo is a prop). Props: the reishi
// dao (a short broad single-edged blade widening toward a forked tip, a ring guard, a wrapped grip) and the halo.
// (verify) the boots' colour (white here); the coat's front (closed to the belt, open below).
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, intersect, offset, prism, smoothPath, sphere, spike, subtract, torus, tube, type Sdf, type V3 } from '../models/sdf';
import { addBands, coatSkirt, faceLegend, hands, head, humanoidSkeleton, type HumanoidSpec, type Landmarks } from './humanoid';
import { ZEICHEN_7, badge, frontOf, hairSheet, longCape, peakedCap } from './sternritter';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

/** 75 voxels = 1.56 m */
export const BAMBIETTA_RES = 75 / 1.56;
export type BambiettaForm = 'base' | 'zofiel';

/** Slender and small. */
const SPEC: HumanoidSpec = {
  H: 75,
  chinY: 62.6,
  head: { w: 10, d: 11, h: 12 },
  neckR: 1.9,
  shoulder: [7.0, 57.6, -0.5],
  upperArm: 12,
  foreArm: 10.8,
  hand: 7.2,
  armR: 1.9,
  hipsY: 38.8,
  hip: [3.9, 36.2, 0],
  kneeY: 20.4,
  ankleY: 4,
  chest: [6.0, 4.3],
  waist: [4.7, 3.4],
  hips: [6.3, 4.4],
  chestY: 52,
  waistY: 45,
  foot: { len: 9.6, w: 3.9, heel: 2.4 },
};

function palette(b: ModelBuilder, form: BambiettaForm): void {
  b.mat('skin', ['#FBE8DB', '#F6DCCB', '#E8C6B2', '#D6AF99', '#BA937E'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#6A4382', '#5E3A73', '#4A2D5C', '#3A2348', '#2A1934'], { base: 2, rough: 0.4, shadeK: 0.85, dither: 0.04 });
  b.mat('brow', ['#3A2348']);
  b.mat('lid', ['#24142E']);
  b.mat('sclera', ['#F3F3F0']);
  b.mat('iris', ['#7A3C92']);
  b.mat('irisD', ['#3A1648']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#8E4A54']);
  b.mat('coat', ['#F3F3F0', '#F1F2EF', '#DDE0E4', '#C9CCD3', '#A4ABB8'], { base: 1, rough: 0.75, shadeK: 0.9 });
  b.mat('coatIn', ['#D9DCE2', '#C3C8D0', '#A5ACB8'], { base: 1, rough: 0.8 });
  b.mat('stocking', ['#34313D', '#2A2732', '#1F1D26', '#18171E'], { base: 1, rough: 0.6, shadeK: 0.85 });
  b.mat('red', ['#E0384E', '#C51F35', '#9C1428'], { base: 1, rough: 0.5 });
  b.mat('gold', ['#E8C866', '#C9A23A', '#9E7C26'], { base: 1, rough: 0.3, metal: 0.75 });
  b.mat('peak', ['#2A2A31', '#1E1E24', '#17171B'], { base: 1, rough: 0.25, metal: 0.2 });
  b.mat('sole', ['#8C96A6']);
  if (form === 'zofiel') {
    b.mat('wing', ['#FF6B7F', '#E8324E', '#D11A3A', '#B3122E', '#850A20'], { base: 2, rough: 0.35, glow: 0.35, shadeK: 0.8, dither: 0 });
    b.mat('orb', ['#FFF1F4', '#FFC2CF', '#FF7D96'], { base: 0, rough: 0.2, glow: 1.2, dither: 0 });
  }
}

/** Thin arched brows, dark lashes, big dark-purple eyes a little narrowed, a smug half-smile. Rows 9 → 0. */
const FACE = [
  '. . . . . . . . . .',
  '. . B B . . B B . .',
  '. L L L . . L L L .',
  'L W I I . . I I W L',
  '. W * i . . i * W .',
  '. . I I . . I I . .',
  '. . . . . s . . . .',
  '. . . . . . m . . .',
  '. . . . m m . . . .',
  '. . . . . . . . . .',
];

const assetCache = new Map<BambiettaForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function bambiettaAsset(form: BambiettaForm = 'base'): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildBambietta(form)));
  return a;
}

/**
 * 'dao' (the reishi sword: origin at the grip, the blade along +Z, the edge toward −Y), 'halo' (Zofiel's star, facing
 * +Z) and 'boulder' (a chunk of the ground she rips up to throw, centred on its origin).
 */
export type BambiettaProp = 'dao' | 'halo' | 'boulder';

export function bambiettaProp(kind: BambiettaProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) propCache.set(kind, (m = kind === 'dao' ? buildDao() : kind === 'halo' ? buildStarHalo() : buildBoulder()));
  return m;
}

/** the dao's blade along its +Z (m) */
export const DAO_BASE_Z = 4 / 48;
export const DAO_TIP_Z = 38 / 48;

export function buildBambietta(form: BambiettaForm = 'base'): CharacterAsset {
  const b = new ModelBuilder(`bambietta-${form}`, BAMBIETTA_RES);
  palette(b, form);
  const s = SPEC;
  const L = humanoidSkeleton(b, s);
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 3.6, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 3.6, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.5, wy - 4.2, wz + 0.9]);
  b.socket('palm.L', 'palm.L', [wx - 0.5, wy - 4.2, wz + 0.9]);
  b.socket('back', 'chest', [0, s.chestY + 2, -8]);
  b.socket('chest.front', 'chest', [0, s.chestY, 5]);
  b.socket('toe.R', 'foot.R', [-L.ankle[0], 2, L.ankle[2] + s.foot.len - s.foot.heel]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('eye.L', 'head', [2.5, s.chinY + 5.5, hd.front + 0.3]);
  b.socket('eye.R', 'head', [-2.5, s.chinY + 5.5, hd.front + 0.3]);
  // the star halo floats above and behind her head
  b.socket('halo', 'head', [0, s.chinY + 19, hd.front - s.head.d - 2]);
  // a soft chin
  for (const k of [-1, 1]) b.carve('head', box([k * 5.4, hd.chin + 1.2, hd.front - 2], [0.9, 2.2, 3], { rot: [0, 0, k * 18] }));
  b.stamp('head', hd.x0, hd.chin + 9, FACE, faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  const hair = hairDo(b, L, hd);
  peakedCap(b, L, hd, { mat: 'coat', trim: 'coatIn', gold: 'gold', peak: 'peak' });
  hands(b, L, 'coat', 1.0);
  gloves(b, L);
  const torso = body(b, L);
  const coat = uniform(b, L, torso);
  legs(b, L);
  const extra = form === 'zofiel' ? wings(b, L) : { springs: [], colliders: [] };
  b.autoShade();
  b.lint();
  return {
    model: b.build(),
    springs: [...coat.springs, ...hair.springs, ...extra.springs],
    colliders: [...coat.colliders, ...hair.colliders, { bone: 'thigh.L', offset: [0, -0.09, 0.02], radius: 0.08 }, { bone: 'thigh.R', offset: [0, -0.09, 0.02], radius: 0.08 }],
    warnings: b.warnings,
  };
}

// ---------------------------------------------------------------------------------------------- head

/**
 * Long straight hair: a cap of it under the hat, a straight fringe over the brows parted a little off-centre, side
 * locks falling in front of the shoulders to the chest, and the sheet down the back to the hips.
 */
function hairDo(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const c = hd.chin, front = hd.front;
  const cz = L.headC[2] - 0.4;
  const hw = s.head.w / 2;
  const capS = subtract(
    intersect(box([0, c + 9.2, cz - 0.4], [hw + 0.9, 5.6, s.head.d / 2 + 1.1], { round: 3.4 }), fn((_x, y) => c + 2.6 - y, [-12, c - 4, -20], [12, c + 18, 20])),
    fn((x, y, z) => Math.max(z - (front + 3), (front - 2.6) - z, y - (c + 9.6), Math.abs(x) - (hw - 0.4)), [-12, c - 4, front - 4], [12, c + 14, front + 4]),
  );
  b.add('head', capS, 'hair', { only: 'empty', thr: 0.2 });
  // the fringe: straight locks to the brows, a little longer at the sides
  for (let x = -4.2; x <= 4.21; x += 1.4) {
    const len = 3.4 + Math.abs(x) * 0.2;
    b.add('head', capsule([x, c + 11.6, front - 0.6], [x * 1.04, c + 11.6 - len, front + 0.4], 0.95, 0.75), 'hair', { thr: 0.3 });
  }
  // the side locks: in front of the ears, down past the jaw to the chest
  for (const k of [1, -1]) {
    const lock = smoothPath([[k * (hw - 0.2), c + 10, front - 1.8], [k * (hw + 0.8), c + 4, front - 2.4], [k * (hw + 1.2), c - 3, front - 3.2], [k * (hw + 1.6), c - 9, front - 3.6]], 4);
    b.add('head', tube(lock, lock.map((_, i) => 1.5 - i * 0.04)), 'hair', { thr: 0.3 });
  }
  // the eyes stay clear
  b.carve('head', aabb([-4.6, c + 4, front], [-1, c + 7.2, front + 6]));
  b.carve('head', aabb([1, c + 4, front], [4.6, c + 7.2, front + 6]));
  b.paint('head', ellipsoid([0, c + 12.4, cz - 1.4], [3.6, 1.2, 4]), 'hair', { shade: 0, where: b.isMat('hair') });
  return hairSheet(b, L, hd, { mat: 'hair', res: BAMBIETTA_RES, yBot: s.hipsY - 3, width: hw + 1.2, thick: 1.8, out: 2.6 });
}

/** White gloves, a red band at the cuff. */
function gloves(b: ModelBuilder, L: Landmarks): void {
  const [sx, , sz] = L.spec.shoulder;
  const wy = L.wrist[1];
  b.add('forearm.L', cylinder([sx, wy + 0.2, sz], [sx, wy + 2.8, sz], 2.4), 'coat', { mirror: true });
  b.paint('forearm.L', cylinder([sx, wy + 2.0, sz], [sx, wy + 2.9, sz], 2.7), 'red', { mirror: true });
}

// ---------------------------------------------------------------------------------------------- body & clothes

function body(b: ModelBuilder, L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const torso = blend(2.4,
    box([0, s.chestY - 0.5, -0.2], [cx, 5.2, cz], { round: 2.8 }),
    ellipsoid([0, s.chestY - 1, 2.0], [cx - 0.6, 3.2, 2.8]),
    box([0, s.waistY, -0.2], [wx, 4, wz], { round: 2.4 }),
    box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 3.4, s.hips[1]], { round: 2.4 }),
    capsule([2, sy + 1.2, sz - 0.6], [sx - 1.2, sy - 0.2, sz], 2.1, 2.2),
    capsule([-2, sy + 1.2, sz - 0.6], [-sx + 1.2, sy - 0.2, sz], 2.1, 2.2),
    sphere([sx, sy - 0.5, sz], 2.5), sphere([-sx, sy - 0.5, sz], 2.5));
  addBands(b, offset(torso, 0.5), 'coat', [['hips', 32, 41], ['spine', 41, 49], ['chest', 47, 80]]);
  b.add('neck', capsule([0, s.chinY - 5, L.headC[2] - 0.5], [0, s.chinY + 2, L.headC[2] - 0.5], s.neckR), 'skin');
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(1.2, sphere([sx, sy - 0.5, sz], 2.8), capsule([sx, sy - 1, sz], [sx, ey + 0.5, sz], 2.4, 2.2)), 'coat', { mirror: true });
  b.add('forearm.L', blend(1.1, sphere([sx, ey, sz], 2.2), capsule([sx, ey - 0.5, sz], [sx, wy + 1.6, sz], 2.2, 2.0)), 'coat', { mirror: true });
  return torso;
}

/**
 * The coat: a stand collar closed at the throat, the front closed to the belt (a row of Zeichen buttons), the black
 * belt and the red heart buckle, the skirt flaring to mid-thigh and open in front over the miniskirt; the order's
 * hooded cloak behind, the Zeichen on its back.
 */
function uniform(b: ModelBuilder, L: Landmarks, torso: Sdf): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const nz = L.headC[2] - 0.8;
  const collar = fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (y - (sy - 0.5)) / (s.chinY - sy)));
    const r = s.neckR + 1.3 + t * 0.5;
    return Math.max(Math.abs(Math.hypot(x, (z - nz) * 1.08) - r) - 0.6, y - (s.chinY - 1.2), sy - 1 - y);
  }, [-8, sy - 2, nz - 8], [8, s.chinY + 1, nz + 8]);
  b.add('chest', collar, 'coat');
  b.paint('chest', aabb([-0.5, sy - 1, nz + 1], [0.5, s.chinY, nz + 8]), 'coatIn', { where: b.isMat('coat') });
  // the front seam and its buttons
  b.paint(['chest', 'spine'], aabb([-0.5, s.waistY - 1, 0], [0.5, sy, 20]), 'coatIn', { where: b.isMat('coat') });
  for (const y of [s.chestY + 2, s.chestY - 2, s.waistY + 2]) {
    const at = frontOf(b, ['chest', 'spine'], 0, Math.round(y));
    if (at) b.voxel(at.bone, 0, Math.round(y), at.z + 1, 'gold', 0);
  }
  // the seams over the shoulders
  for (const k of [1, -1]) b.paint(['chest', `upperarm.${k > 0 ? 'L' : 'R'}`], capsule([k * 3, sy + 2, sz - 0.6], [k * (sx + 1.2), sy + 0.4, sz], 0.45), 'coat', { shade: 3, where: b.isMat('coat') });
  // the belt and the red heart buckle
  b.add('spine', intersect(subtract(offset(torso, 1.3), offset(torso, 0.2)), aabb([-20, s.waistY - 3.2, -20], [20, s.waistY - 1.4, 20])), 'peak');
  const bz = frontOf(b, ['spine'], 0, Math.round(s.waistY - 2.3))?.z ?? 4;
  const heart: [number, number][] = [[0, -2.2], [2.1, 0.1], [2.2, 1.2], [1.4, 1.9], [0.5, 1.6], [0, 1.0], [-0.5, 1.6], [-1.4, 1.9], [-2.2, 1.2], [-2.1, 0.1]];
  b.add('spine', prism(heart, [0, s.waistY - 2.3, bz + 0.4], [1, 0, 0], [0, 1, 0], 0.6, 0.2), 'red', { thr: 0.2 });
  // the miniskirt under the coat: short pleats to the upper thigh
  b.add('hips', fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (s.hipsY + 1 - y) / 7));
    const r = 6.6 + t * 2.0 + Math.abs(Math.sin(Math.atan2(x, z) * 8)) * 0.4;
    return Math.max(Math.abs(Math.hypot(x, (z + 0.3) * 1.25) - r) - 0.7, y - (s.hipsY + 1), s.hipsY - 6.5 - y);
  }, [-12, s.hipsY - 8, -12], [12, s.hipsY + 2, 12]), 'coat', { thr: 0.2 });
  // the coat's skirt, open in front, flaring to mid-thigh
  const skirt = coatSkirt(b, L, { mat: 'coat', lining: 'coatIn', yTop: s.waistY - 3, yHem: L.knee[1] + 7, r0: 6.6, r1: 9.6, openFront: 30, overlap: 3, res: BAMBIETTA_RES, depth: 0.85 });
  // red trim along the hem
  b.paint(['coat.F.L.2', 'coat.F.R.2', 'coat.S.L.2', 'coat.S.R.2', 'coat.B.L.2', 'coat.B.R.2', 'coat.F.L', 'coat.F.R', 'coat.S.L', 'coat.S.R', 'coat.B.L', 'coat.B.R'], aabb([-40, L.knee[1] + 5, -40], [40, L.knee[1] + 8.4, 40]), 'red', { where: b.isMat('coat') });
  // the hooded cloak behind, the Zeichen on its back
  const cape = longCape(b, L, torso, { mat: 'coat', lining: 'coatIn', res: BAMBIETTA_RES, hood: true, yHem: 4, r0: 9, r1: 12.4 });
  badge(b, ZEICHEN_7, 0, Math.round(s.chestY + 2), 'coatIn', { back: true, bones: ['chest'], shade: 1 });
  return { springs: [...skirt.springs, ...cape.springs], colliders: [...skirt.colliders, ...cape.colliders] };
}

/** Black stockings to the thigh, white knee boots with a red band at the top, a small heel. */
function legs(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [hx, hy, hz] = s.hip;
  const [kx, ky, kz] = L.knee;
  const [ax, ay, az] = L.ankle;
  b.add('hips', box([0, s.hipsY - 0.5, -0.3], [s.hips[0] + 0.3, 3.2, s.hips[1] + 0.3], { round: 2.2 }), 'coat');
  b.add('thigh.L', blend(1.2, sphere([hx, hy, hz], 3.1), capsule([hx, hy, hz], [kx, ky + 1, kz], 3.1, 2.4)), 'stocking', { mirror: true });
  b.add('shin.L', blend(1, sphere([kx, ky, kz], 2.3), capsule([kx, ky, kz], [ax, ay + 2, az], 2.3, 1.9)), 'stocking', { mirror: true });
  // the boots to just below the knee
  const top = ky - 2;
  b.add('shin.L', capsule([kx, top, kz], [ax, ay + 0.8, az], 2.65, 2.25), 'coat', { mirror: true });
  b.paint('shin.L', cylinder([kx, top - 1.2, kz], [kx, top + 1, kz], 3.2), 'red', { mirror: true, where: b.isMat('coat') });
  const f = s.foot;
  b.add('foot.L', capsule([ax, ay + 1.4, az - 0.4], [ax, ay - 1, az - 0.4], 2.3), 'coat', { mirror: true });
  b.add('foot.L', intersect(box([ax, 2.0, az + (f.len / 2 - f.heel)], [f.w / 2, 2.0, f.len / 2], { round: 1.3 }), fn((x, y, z) => y - 4.0 + (z - (az + f.len - f.heel - 3)) * 0.7, [-20, -2, -20], [20, 10, 30])), 'coat', { mirror: true });
  // the heel
  b.add('foot.L', box([ax, 0.9, az - f.heel + 0.8], [1.1, 0.9, 1.0]), 'sole', { mirror: true });
  b.paint('foot.L', aabb([ax - 5, 0, az - 8], [ax + 5, 0.8, az + 14]), 'sole', { mirror: true });
}

// ---------------------------------------------------------------------------------------------- Zofiel

/**
 * Zofiel's wings: per side a leading edge rising out and up from the shoulder blade and curving down to a tip far out,
 * six long blade feathers hanging from it, longest toward the tip, and the reishi orbs budding in clusters along the
 * underside of the edge. Bones wing.L / wing.R so they spread and beat.
 */
function wings(b: ModelBuilder, L: Landmarks): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [, sy] = s.shoulder;
  // the wing's outline in its own plane (out from the root, up), the lower edge a row of feather points
  const outline: [number, number][] = [
    [0, 2], [8, 12], [18, 19], [30, 21], [42, 16], [52, 5], [57, -8],
    [51, -17], [47, -7], [42, -24], [38, -9], [33, -26], [29, -9], [24, -24], [20, -7], [15, -18], [11, -4], [6, -9], [2, -3],
  ];
  for (const k of [1, -1]) {
    const side = k > 0 ? 'L' : 'R';
    const root: V3 = [k * 3, sy - 5, -s.chest[1] - 1];
    b.bone(`wing.${side}`, 'chest', root);
    // the plane sweeps back as it goes out
    const u: V3 = [k * 0.97, 0, -0.24];
    const v: V3 = [0, 1, 0];
    b.add(`wing.${side}`, prism(outline, root, u, v, 0.9, 0.3), 'wing', { thr: 0.2 });
    const P = (a: number, h: number): V3 => [root[0] + u[0] * a, root[1] + h, root[2] + u[2] * a];
    // the leading edge, thicker and lighter
    const edge = smoothPath([P(0, 2), P(8, 12), P(18, 19), P(30, 21), P(42, 16), P(52, 5), P(57, -8)], 4);
    b.add(`wing.${side}`, tube(edge, edge.map((_, i) => 1.9 - (i / edge.length) * 0.8)), 'wing', { thr: 0.2 });
    b.paint(`wing.${side}`, tube(edge, edge.map(() => 1.0)), 'wing', { shade: 0 });
    // the feathers: darker grooves from the edge down to each point
    for (const [a, h] of [[49, -14], [42, -22], [33, -24], [24, -22], [15, -16], [6, -8]] as [number, number][]) {
      const top = P(a * 0.86, Math.min(19, h + 30));
      b.paint(`wing.${side}`, capsule(top, P(a, h + 2), 0.45), 'wing', { shade: 4 });
    }
    // the orbs budding in clusters on the face of the wing, along its lower part
    for (const [a, h] of [[44, -10], [37, -14], [30, -15], [23, -12], [16, -9], [10, -3], [48, -2]] as [number, number][]) {
      for (let j = 0; j < 3; j++) {
        const c = P(a + (j - 1) * 1.8, h + (j % 2) * 1.6);
        b.add(`wing.${side}`, sphere([c[0], c[1], c[2] + 1.2], 1.25), 'orb');
      }
    }
  }
  return { springs: [], colliders: [] };
}

// ---------------------------------------------------------------------------------------------- props

/**
 * The reishi dao at 48 vox/m: a wrapped grip, a ring guard, a short single-edged blade with a straight back (+Y) whose
 * edge (−Y) swells toward the end, the end split into two points (the forked tip). Pale blue reishi.
 */
function buildDao(): VoxelModel {
  const b = new ModelBuilder('bambietta-dao', 48);
  b.mat('reishi', ['#DDF1FF', '#C2E6FC', '#9ED8FF', '#7CC3F2', '#5AA6E0'], { base: 2, rough: 0.2, glow: 0.25, dither: 0 });
  b.mat('grip', ['#2C2C33', '#222228', '#19191D'], { base: 1, rough: 0.8 });
  b.mat('gold', ['#E8C866', '#C9A23A', '#9E7C26'], { base: 1, rough: 0.3, metal: 0.75 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', cylinder([0, 0, -8], [0, 0, 2.5], 0.95), 'grip');
  for (let z = -7; z < 2; z += 2) b.paint('root', cylinder([0, 0, z], [0, 0, z + 0.7], 1.2), 'grip', { shade: 0 });
  b.add('root', ellipsoid([0, 0, -8.8], [1.3, 1.3, 1.1]), 'gold');
  // the guard: a flattened ring round the blade's root
  b.add('root', torus([0, 0, 3], 2.6, 0.8, [0, 0, 0]), 'gold', { thr: 0.2 });
  b.add('root', cylinder([0, 0, 2.4], [0, 0, 3.6], 2.0), 'gold');
  // the blade: the back straight along +Y, the edge swelling toward the end, the end forked
  b.add('root', fn((x, y, z) => {
    if (z < 3.6 || z > 38) return 1;
    const t = (z - 3.6) / 34.4;
    const back = 1.4;
    const edge = -(1.8 + 2.6 * Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.62));
    const th = 0.55 + 0.35 * (1 - t);
    // the fork: a notch cut into the end, between the edge's point and the back's
    const mid = (back + edge) / 2;
    const notch = t > 0.82 ? Math.max(0, (t - 0.82) / 0.18) * ((back - edge) * 0.28) - Math.abs(y - mid) : -1;
    return Math.max(y - back, edge - y, Math.abs(x) - th, notch, 3.6 - z, z - 38 + Math.max(0, Math.abs(y - mid) - 0.6) * 0.6);
  }, [-2, -6, 3], [2, 3, 39]), 'reishi', { thr: 0.25 });
  // the edge's bright bevel
  b.paint('root', fn((_x, y, z) => Math.max(y + 2.4 + Math.sin(Math.min(1, (z - 3.6) / 30) * Math.PI * 0.62) * 2.2, 3.6 - z), [-2, -6, 3], [2, 3, 39]), 'reishi', { shade: 0 });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** Zofiel's halo at 48 vox/m: a five-pointed star outline round a small Zeichen, crimson light. Faces +Z. */
function buildStarHalo(): VoxelModel {
  const b = new ModelBuilder('bambietta-halo', 48);
  b.mat('halo', ['#FFC2CF', '#FF7D96', '#FF4058', '#D11A3A', '#9C0E26'], { base: 2, rough: 0.2, glow: 0.8, dither: 0 });
  b.bone('root', null, [0, 0, 0]);
  const R = 12, r = 5;
  const pts: V3[] = [];
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI / 2 + (i / 10) * Math.PI * 2;
    const rr = i % 2 === 0 ? R : r;
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr, 0]);
  }
  for (let i = 0; i < 10; i++) b.add('root', capsule(pts[i], pts[i + 1], 1.0), 'halo', { thr: 0.2 });
  // the cross at its heart
  b.add('root', capsule([0, -3.4, 0], [0, 3.4, 0], 0.9), 'halo', { thr: 0.2 });
  b.add('root', capsule([-3, 1, 0], [3, 1, 0], 0.9), 'halo', { thr: 0.2 });
  for (let i = 0; i < 5; i++) b.add('root', capsule([0, 0, 0], [Math.cos(Math.PI / 2 + (i / 5) * Math.PI * 2) * r, Math.sin(Math.PI / 2 + (i / 5) * Math.PI * 2) * r, 0], 0.8), 'halo', { thr: 0.2 });
  b.autoShade({ up: 0.2, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** A chunk of the ground at 24 vox/m: a lumpy block of earth and rock, turf still on its top, about 1.2 m across. */
function buildBoulder(): VoxelModel {
  const b = new ModelBuilder('bambietta-boulder', 24);
  b.mat('rock', ['#8A867E', '#7A7770', '#6B6862', '#5B5852', '#4A4843'], { base: 2, rough: 0.9, shadeK: 0.8 });
  b.mat('earth', ['#86634A', '#7A583E', '#6B4C36', '#5A4030'], { base: 1, rough: 0.95 });
  b.mat('turf', ['#78AA44', '#679A3A', '#5A8A33', '#4E7A2C'], { base: 1, rough: 0.9 });
  b.bone('root', null, [0, 0, 0]);
  const lump = fn((x, y, z) => {
    const n = Math.sin(x * 0.9 + 1.3) * Math.sin(y * 0.8) * Math.sin(z * 0.7 + 0.5) * 1.6 + Math.sin(x * 2.1 + z * 1.7) * 0.6;
    return Math.hypot(x / 15, y / 11, z / 14) * 13 - 13 + n;
  }, [-18, -14, -18], [18, 14, 18]);
  b.add('root', lump, 'earth', { thr: 0.2 });
  // rock showing through the earth, turf on top
  b.paint('root', fn((x, y, z) => Math.sin(x * 0.55 + y * 0.4) * Math.sin(z * 0.6 - y * 0.3) - 0.25, [-18, -14, -18], [18, 6, 18]), 'rock', { where: b.isMat('earth') });
  b.paint('root', aabb([-20, 7, -20], [20, 20, 20]), 'turf', { where: b.isMat('earth') });
  b.autoShade({ up: 0.6, open: 2, front: 0 });
  b.lint();
  return b.build();
}
