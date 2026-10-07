// Shinji Hirako — the Visored's leader, once and again captain of the 5th Division (docs/roster/D-visored.md §2).
// Brief: 176 cm → 84 vox; lanky, narrow shoulders, long thin limbs. Silhouette keys: the "helmet" of hair (a
// blunt jaw-length blond bob with a straight fringe at the brows), the huge grin that bares the whole upper
// row of teeth, half-lidded bored eyes, and the Visored's Human-World clothes: a white dress shirt, a loose
// dark tie, grey slacks with a belt, dark brown shoes. Props: Sakanade sealed (green hilt, hourglass guard),
// the Shikai (a large ring for a pommel so the sword spins round his finger, the guard grown into a sleeve
// over the blade, five holes along it that vent the mist, a slanted chisel tip), the Bankai blade (a second
// ring for the tip) and his Hollow mask, a pharaoh's death mask: a smooth crown, a nemes-like hood flaring
// behind the ears and a short lappet down the nape, long slanted eye slits, a toothy grin.
// (verify) the tie and slacks colours; stripes on the mask's hood.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, smoothPath, sphere, subtract, torus, tube, type Sdf, type V3 } from '../models/sdf';
import { addBands, faceLegend, hands, head, humanoidSkeleton, type HumanoidSpec, type Landmarks } from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

/** 84 voxels = 1.76 m */
export const SHINJI_RES = 84 / 1.76;

/** Lanky: narrow shoulders, long thin arms and legs. */
const SPEC: HumanoidSpec = {
  H: 84,
  chinY: 72,
  head: { w: 10, d: 11, h: 12 },
  neckR: 2.3,
  shoulder: [8.4, 66.4, -0.5],
  upperArm: 15.2,
  foreArm: 13.8,
  hand: 9,
  armR: 2.0,
  hipsY: 45.5,
  hip: [4.2, 42.5, 0],
  kneeY: 23.5,
  ankleY: 4.5,
  chest: [7.2, 4.3],
  waist: [5.8, 3.8],
  hips: [6.2, 4.1],
  chestY: 61,
  waistY: 51.5,
  foot: { len: 12, w: 4.6, heel: 3 },
};

function palette(b: ModelBuilder): void {
  b.mat('skin', ['#F7E0C8', '#F2D3B7', '#E4C0A0', '#D7AE8E', '#B88E70'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#FFF1C2', '#EFD27E', '#DDBA62', '#C9A04C', '#A07C34'], { base: 1, rough: 0.45, shadeK: 0.85, dither: 0.03 });
  b.mat('lid', ['#3A2A1E']);
  b.mat('sclera', ['#F2EFE8']);
  b.mat('iris', ['#6B4428']);
  b.mat('irisD', ['#3E2616']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#A0524E']);
  b.mat('teeth', ['#F3F1EA']);
  b.mat('inner', ['#5E2028']);
  b.mat('shirt', ['#F3F3F0', '#E8E8E4', '#D6D6D2', '#BDBEC3', '#9FA1A9'], { base: 1, rough: 0.75, shadeK: 0.9 });
  b.mat('tie', ['#3A3A46', '#2A2A34', '#1F1F27', '#16161C'], { base: 1, rough: 0.6 });
  b.mat('slacks', ['#8C8F97', '#7A7D85', '#64676E', '#4E5056'], { base: 1, rough: 0.85, shadeK: 0.9 });
  b.mat('belt', ['#3A302A', '#2B2522', '#1E1A18'], { base: 1, rough: 0.5 });
  b.mat('buckle', ['#D4D8DE', '#A9AEB6'], { base: 0, rough: 0.3, metal: 0.8 });
  b.mat('shoe', ['#5A4434', '#3B2B22', '#2A1F18', '#1A1410'], { base: 1, rough: 0.4, shadeK: 0.85 });
  b.mat('sole', ['#2A2420', '#1C1816']);
}

/** Bored half-lidded brown eyes (the brows hide under the fringe); the grin bares the whole upper row. */
const FACE = [
  '. . . . . . . . . .',
  '. . . . . . . . . .',
  '. . . . . . . . . .',
  '. L L L . . L L L .',
  '. . I i . . i I . .',
  '. . . . . . . . . .',
  '. . . . . s . . . .',
  '. m T T T T T T m .',
  '. . m m m m m m . .',
  '. . . . . . . . . .',
];

const assetCache = new Map<string, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();
/** the props' lint warnings (floating islands and the like), for the tests */
export const SHINJI_PROP_WARNINGS: Record<string, string[]> = {};

export function shinjiAsset(): CharacterAsset {
  let a = assetCache.get('visored');
  if (!a) assetCache.set('visored', (a = buildShinji()));
  return a;
}

/** 'katana' (sealed Sakanade), 'shikai' (the ring sword), 'bankai' (rings at both ends), 'mask' (the Hollow mask) */
export type ShinjiProp = 'katana' | 'shikai' | 'bankai' | 'mask';

export function shinjiProp(kind: ShinjiProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'mask' ? buildMask() : buildSakanade(kind);
    propCache.set(kind, m);
  }
  return m;
}

/** blade points (prop frame, m) */
export const SAKANADE_BASE_Z = 5 / 48;
export const SAKANADE_TIP_Z = 38 / 48;
/** the Shikai's ring pommel centre (prop frame, m): the sword spins about it */
export const SAKANADE_RING_Z = -9.5 / 48;
/** the five holes along the Shikai blade (prop frame, m) */
export const SAKANADE_HOLES: number[] = [12, 17, 22, 27, 32].map((z) => z / 48);

export function buildShinji(): CharacterAsset {
  const b = new ModelBuilder('shinji', SHINJI_RES);
  palette(b);
  const s = SPEC;
  const L = humanoidSkeleton(b, s);
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 5, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5, wz + 1]);
  b.socket('finger.R', 'palm.R', [-wx + 0.2, wy - s.hand - 0.5, wz + 1]);
  b.socket('finger.L', 'palm.L', [wx - 0.2, wy - s.hand - 0.5, wz + 1]);
  b.socket('back', 'chest', [0, s.chestY + 1, -6]);
  b.socket('chest.front', 'chest', [0, s.chestY, 6]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('mouth', 'head', [0, s.chinY + 1.5, hd.front + 0.5]);
  b.stamp('head', hd.x0, hd.chin + 9, FACE, faceLegend({ skin: 'skin', brow: 'hair', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth', teeth: 'teeth', inner: 'inner' }), hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  // a long face: the jaw a little longer and narrower under the grin
  b.paint('head', aabb([-5, hd.chin, hd.front - 3], [5, hd.chin + 1, hd.front]), 'skin', { shade: 2, where: b.isMat('skin') });
  const torso = body(b, L);
  shirt(b, L, torso);
  tie(b, L);
  slacks(b, L);
  bob(b, L, hd);
  hands(b, L, 'skin');
  b.autoShade();
  b.lint();
  const springs: SpringDef[] = [];
  const colliders: ColliderDef[] = [];
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- body & clothes

/** The lanky body under the clothes: a narrow chest, a slim waist, thin arms and long legs. */
function body(b: ModelBuilder, L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const chest = box([0, s.chestY - 0.5, -0.3], [cx, 6.2, cz], { round: 3.4 });
  const waist = box([0, s.waistY, -0.2], [wx, 4.6, wz], { round: 3 });
  const pelvis = box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 3.8, s.hips[1]], { round: 2.8 });
  const traps = [capsule([2.4, sy + 1.8, sz - 1], [sx - 1.4, sy - 0.2, sz], 2.9, 3.1), capsule([-2.4, sy + 1.8, sz - 1], [-sx + 1.4, sy - 0.2, sz], 2.9, 3.1)];
  const balls = [sphere([sx, sy - 0.6, sz], 3.3), sphere([-sx, sy - 0.6, sz], 3.3)];
  const torso = blend(3, chest, waist, pelvis, ...traps, ...balls);
  addBands(b, torso, 'skin', [['hips', 36, s.waistY - 5], ['spine', s.waistY - 5, s.chestY - 6], ['chest', s.chestY - 6, 90]]);
  b.add('neck', capsule([0, s.chinY - 6, L.headC[2] - 0.8], [0, s.chinY + 1, L.headC[2] - 0.8], s.neckR), 'skin');
  return torso;
}

/** The white dress shirt: an open collar, a button placket under the tie, long sleeves with cuffs, tucked in. */
function shirt(b: ModelBuilder, L: Landmarks, torso: Sdf): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  // the open neck: a V down to the second button
  const neck = intersect(ellipsoid([0, s.chinY - 4, 3.2], [3, 4.6, 5.5]), halfSpace([0, 0, 0], [0, 0, -1]));
  const shell = subtract(offset(torso, 1.0), offset(torso, -1.0), neck);
  addBands(b, intersect(shell, aabb([-30, s.waistY - 6, -30], [30, 90, 30])), 'shirt', [['hips', s.waistY - 6, s.waistY - 4], ['spine', s.waistY - 5, s.chestY - 4], ['chest', s.chestY - 6, 90]]);
  // the collar: a folded band standing round the neck, its points lying open on the chest
  const ring = intersect(torus([0, s.chinY - 4.2, L.headC[2] - 0.8], 3.3, 1.0), halfSpace([0, 0, 2.2], [0, 0, 1]));
  b.add('chest', ring, 'shirt', { thr: 0.2 });
  for (const k of [1, -1]) {
    const pt = smoothPath([[k * 3.2, s.chinY - 3.2, 1.6], [k * 3.0, s.chinY - 5.0, 3.6], [k * 1.8, s.chinY - 7.4, 4.4]], 3);
    b.add('chest', tube(pt, pt.map((_, i) => 1.15 - i * 0.08)), 'shirt', { thr: 0.2 });
  }
  // the placket and its buttons (the tie hangs over most of them)
  b.paint(['chest', 'spine'], aabb([-0.5, s.waistY - 6, 2], [0.5, s.chinY - 7.5, 9]), 'shirt', { shade: 2, where: b.isMat('shirt') });
  // sleeves: loose, folds at the elbow, cuffs at the wrist
  b.add('upperarm.L', blend(1.4, sphere([sx, sy - 1.1, sz], 3.2), capsule([sx, sy - 1.2, sz], [sx, ey + 0.5, sz], 3.0, 2.6)), 'shirt', { mirror: true });
  b.add('forearm.L', blend(1.2, sphere([sx, ey, sz], 2.8), capsule([sx, ey - 0.5, sz], [sx, wy + 1.8, sz], 2.8, 2.4)), 'shirt', { mirror: true });
  b.add('forearm.L', cylinder([sx, wy + 0.4, sz], [sx, wy + 2.4, sz], 2.55), 'shirt', { mirror: true });
  b.paint('forearm.L', cylinder([sx, wy + 2.2, sz], [sx, wy + 2.7, sz], 2.9), 'shirt', { shade: 3, mirror: true, where: b.isMat('shirt') });
  b.add('forearm.L', capsule([sx, wy + 3, sz], [sx, wy - 0.4, sz], 1.6), 'skin', { mirror: true, only: 'empty' });
  b.paint('upperarm.L', capsule([sx + 2.6, ey + 2.5, sz + 1.6], [sx + 2.8, ey - 0.5, sz - 1.4], 0.55), 'shirt', { shade: 3, mirror: true, where: b.isMat('shirt') });
  // creases: under the arms, and pulled toward the belt where it is tucked in
  for (const k of [1, -1]) b.paint('spine', capsule([k * 4.2, s.waistY + 0.5, s.waist[1] + 1], [k * 2.2, s.waistY - 3.5, s.waist[1] + 0.9], 0.5), 'shirt', { shade: 2, where: b.isMat('shirt') });
}

/** The loose dark tie: the knot pulled down from the collar, the blade hanging down the placket to the belt. */
function tie(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const kz = 4.4;
  b.add('chest', ellipsoid([0, s.chinY - 7.2, kz], [1.5, 1.4, 1.2]), 'tie');
  // the loop round the neck, under the open collar
  for (const k of [1, -1]) {
    const lp = smoothPath([[k * 1.2, s.chinY - 7, kz - 0.4], [k * 2.6, s.chinY - 4.6, 2.2], [k * 2.6, s.chinY - 3.0, -0.2]], 3);
    b.add('chest', tube(lp, lp.map(() => 0.6)), 'tie', { thr: 0.15 });
  }
  // the blade: widening down to the point, lying on the shirt
  const zc = (y: number) => {
    const t = (s.chinY - 8 - y) / (s.chinY - 8 - (s.waistY - 2));
    return kz - 0.2 + Math.sin(Math.min(1, Math.max(0, t)) * Math.PI) * 0.8;
  };
  const blade = fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (s.chinY - 8 - y) / (s.chinY - 8 - (s.waistY - 2))));
    const w = 1.2 + t * 0.9;
    const point = y - (s.waistY - 2) - Math.abs(x) * 1.1;
    return Math.max(Math.abs(x) - w, Math.abs(z - zc(y)) - 0.55, y - (s.chinY - 7.4), -point);
  }, [-3, s.waistY - 4, 1], [3, s.chinY - 6, 8]);
  addBands(b, blade, 'tie', [['chest', s.chestY - 6, 90], ['spine', -10, s.chestY - 6]], { thr: 0.2 });
  b.paint(['chest', 'spine'], aabb([-0.3, s.waistY - 2, 2], [0.3, s.chinY - 8.5, 8]), 'tie', { shade: 2, where: b.isMat('tie') });
}

/** Grey slacks with a centre crease, a dark belt with a silver buckle, dark brown shoes. */
function slacks(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [hx, hy, hz] = s.hip;
  const [kx, ky, kz] = L.knee;
  const [ax, ay, az] = L.ankle;
  b.add('hips', box([0, s.hipsY - 0.2, -0.3], [s.hips[0] + 0.8, 4.6, s.hips[1] + 0.8], { round: 2.6 }), 'slacks');
  b.add('hips', box([0, s.waistY - 5.2, -0.3], [s.waist[0] + 1.6, 0.9, s.waist[1] + 1.4], { round: 1 }), 'belt');
  b.add('hips', box([0, s.waistY - 5.2, s.waist[1] + 1.8], [1.1, 0.9, 0.4]), 'buckle');
  b.add('thigh.L', blend(1.4, sphere([hx, hy, hz], 4.8), capsule([hx, hy, hz], [kx, ky + 1, kz], 4.4, 3.6)), 'slacks', { mirror: true });
  b.add('shin.L', blend(1.2, sphere([kx, ky, kz], 3.5), capsule([kx, ky, kz], [ax, ay + 1.6, az], 3.4, 3.3)), 'slacks', { mirror: true });
  // the pressed crease down the front of each leg, a break over the shoe
  b.paint('thigh.L', capsule([hx, hy - 2, hz + 4.6], [kx, ky + 1, kz + 3.7], 0.45), 'slacks', { shade: 0, mirror: true, where: b.isMat('slacks') });
  b.paint('shin.L', torus([ax, ay + 2.6, az], 3.4, 0.45), 'slacks', { shade: 3, mirror: true, where: b.isMat('slacks') });
  // the fly and the pockets
  b.paint('hips', aabb([-0.4, s.hipsY - 4, 3], [0.4, s.waistY - 6, 8]), 'slacks', { shade: 3, where: b.isMat('slacks') });
  for (const k of [1, -1]) b.paint('hips', capsule([k * 4.2, s.waistY - 6.4, s.hips[1] + 0.6], [k * 6.4, s.hipsY - 2, s.hips[1] - 0.6], 0.45), 'slacks', { shade: 3, where: b.isMat('slacks') });
  // the shoes: a rounded toe, a low heel, a dark sole
  const f = s.foot;
  const toeZ = az + f.len - f.heel;
  b.add('foot.L', capsule([ax, ay + 1.2, az - 0.4], [ax, ay - 1, az - 0.4], 2.6), 'shoe', { mirror: true });
  b.add('foot.L', intersect(box([ax, 2.2, az + (f.len / 2 - f.heel)], [f.w / 2, 2.2, f.len / 2], { round: 1.6 }), halfSpace([0, 4.4, toeZ - 3.5], [0, 1, 0.6])), 'shoe', { mirror: true });
  b.paint('foot.L', aabb([ax - 5, 0, az - 8], [ax + 5, 1, az + 14]), 'sole', { mirror: true });
  b.paint('foot.L', capsule([ax - 1.2, 3.6, toeZ - 4], [ax + 1.2, 3.6, toeZ - 4], 0.4), 'shoe', { shade: 0, mirror: true, where: b.isMat('shoe') });
}

// ---------------------------------------------------------------------------------------------- hair

/**
 * The bob: a helmet of straight blond hair from the crown down to the jaw, cut straight at the bottom, the
 * fringe cut straight across at the brows; the face open between the two sides.
 */
/**
 * The bob's volume (model voxels): a bell rounded over the crown, falling straight and flaring a little toward
 * the ends, squarish in plan (a helmet, not an egg, so the fringe covers the corners of the forehead too).
 * `grow` swells it evenly (the mask's nemes is built round it); `drop` lets it hang lower.
 */
function bobField(L: Landmarks, grow = 0, drop = 0): (x: number, y: number, z: number) => number {
  const s = L.spec;
  const c = s.chinY;
  const cz = L.headC[2] - 0.6;
  const yTop = c + s.head.h + 1.4 + grow, yBot = c + 0.4 - drop;
  return (x, y, z) => {
    const t = Math.max(0, Math.min(1, (c + 9 - y) / (c + 9 - yBot)));
    const rx = s.head.w / 2 + 1.5 + t * 0.6 + grow, rz = s.head.d / 2 + 1.4 + t * 0.5 + grow;
    const crown = y > c + 9 ? (y - (c + 9)) / (yTop - (c + 9)) : 0;
    const k = Math.sqrt(Math.max(0, 1 - crown * crown));
    const e = (Math.abs(x / (rx * k + 1e-3)) ** 3 + Math.abs((z - cz) / (rz * k + 1e-3)) ** 3) ** (1 / 3) - 1;
    return Math.max(e * Math.min(rx, rz) * 0.9, yBot - y, y - yTop);
  };
}

function bob(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): void {
  const s = L.spec;
  const c = hd.chin;
  const cz = L.headC[2] - 0.6;
  const yTop = c + s.head.h + 1.4, yBot = c + 0.4;
  const shell = fn(bobField(L), [-10, yBot - 1, cz - 10], [10, yTop + 1, cz + 10]);
  // the face open from the jaw up to the fringe's straight edge
  const face = aabb([-4.4, yBot - 2, hd.front - 2.5], [4.4, c + 7.5, hd.front + 6]);
  b.add('head', subtract(shell, face), 'hair', { only: 'empty', thr: 0.2 });
  // strands: shallow grooves falling straight down the sides and the back
  b.paint('head', fn((x, _y, z) => {
    const a = Math.atan2(x, z - cz);
    return Math.abs(((a * 7 + 30) % 1.4) - 0.7) - 0.16;
  }, [-10, yBot - 1, cz - 10], [10, c + 9, cz + 10]), 'hair', { shade: 3, where: b.isMat('hair') });
  // the ends turned under a little, a darker band
  b.paint('head', aabb([-10, yBot - 1, cz - 10], [10, yBot + 0.6, cz + 10]), 'hair', { shade: 3, where: b.isMat('hair') });
}

// ---------------------------------------------------------------------------------------------- props

/**
 * Sakanade. Sealed: a plain katana, a green-wrapped hilt, an hourglass guard. Shikai: the pommel a large ring
 * (the sword spins round his finger), the guard grown into a sleeve over the blade, a slim straight blade
 * with five holes and a slanted chisel tip. Bankai: a second ring where the tip was. Origin at the grip, +Z
 * along the blade, edge −Y.
 */
function buildSakanade(kind: 'katana' | 'shikai' | 'bankai'): VoxelModel {
  const b = new ModelBuilder(`sakanade-${kind}`, 48);
  b.mat('steel', ['#EEF2F6', '#D7DDE2', '#A6ADB6'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#F3F3F0'], { rough: 0.12, metal: 0.8 });
  b.mat('wrap', ['#5E9E4C', '#4B8A3C', '#3A6A33', '#2A5026'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#E8E2D2']);
  b.mat('gold', ['#E2C26A', '#C4A24B', '#A08236', '#7A6226'], { base: 1, rough: 0.35, metal: 0.8, shadeK: 0.8 });
  b.mat('hole', ['#2A2A2E']);
  b.bone('root', null, [0, 0, 0]);
  const shikai = kind !== 'katana';
  const z0 = shikai ? 8 : 5.6, zTip = 38, zEnd = zTip - (shikai ? 2.6 : 3.4);
  const curve = (z: number) => (shikai ? 0 : ((z - z0) / (zTip - z0)) ** 2 * 1.4);
  const halfW = shikai ? 1.45 : 0.95;
  b.add('root', fn((x, y, z) => {
    if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
    const c = curve(z);
    // the chisel tip: a straight slant from the spine down to the edge (Shikai), the usual point (sealed)
    const tip = kind === 'bankai' ? z - zTip : shikai ? z - (zTip - (y + halfW) * 1.6) : Math.max(0, z - zEnd) * 0.55;
    return Math.max(Math.abs(x) - 0.5, y - (halfW + c), -halfW + c + (shikai ? 0 : tip) - y, shikai ? tip : z - zTip, z0 - z);
  }, [-2, -3, z0 - 1], [2, 4, zTip + 1]), 'steel', { thr: 0.3 });
  b.paint('root', fn((_x, y, z) => y - (-halfW + 0.35 + curve(z) + (shikai ? 0 : Math.max(0, z - zEnd) * 0.55)), [-2, -3, 0], [2, 4, zTip + 1]), 'edge');
  if (shikai) {
    // the five holes, punched through
    for (const z of [12, 17, 22, 27, 32]) b.carve('root', cylinder([-2, 0.2, z], [2, 0.2, z], 0.75));
    // the guard grown into a sleeve over the first hand's breadth of the blade
    b.add('root', subtract(box([0, 0, 5.4], [0.95, 1.6, 2.6], { round: 0.5 }), box([0, 0, 5.4], [0.5, 1.0, 3])), 'gold');
    b.add('root', box([0, 0, 2.8], [1.5, 2.2, 0.5], { round: 0.4 }), 'gold');
    // the grip, the ring for a pommel
    b.add('root', box([0, 0, -2.6], [0.95, 1.1, 4.6], { round: 0.5 }), 'wrap');
    b.paint('root', fn((_x, y, z) => Math.abs(((Math.abs(y) + z) % 2.4 + 2.4) % 2.4 - 1.2) - 0.4, [-2, -2, -8], [2, 2, 2.4]), 'ray', { where: b.isMat('wrap') });
    b.add('root', torus([0, 0, -9.5], 2.4, 0.6, [0, 0, 90]), 'gold', { thr: 0.25 });
    b.add('root', box([0, 0, -7.2], [0.8, 0.8, 0.5]), 'gold');
    if (kind === 'bankai') {
      // a second ring for the tip: the blade ends square into it
      b.add('root', torus([0, 0, zTip + 2.6], 2.2, 0.6, [0, 0, 90]), 'gold', { thr: 0.25 });
      b.add('root', box([0, 0, zTip + 0.4], [0.6, 0.6, 0.8]), 'gold');
    }
  } else {
    // the hourglass guard: two lobes above and below the blade, pinched at the middle
    b.add('root', fn((x, y, z) => {
      const w = 1.4 + Math.abs(y) * 0.55;
      return Math.max(Math.abs(x) - w, Math.abs(y) - 2.6, Math.abs(z - 4.6) - 0.45);
    }, [-3, -3, 3.5], [3, 3, 5.6]), 'gold');
    b.add('root', box([0, 0, -1.2], [1.05, 1.2, 5.4], { round: 0.5 }), 'wrap');
    b.paint('root', fn((_x, y, z) => Math.abs(((Math.abs(y) + z) % 2.4 + 2.4) % 2.4 - 1.2) - 0.4, [-2, -2, -7], [2, 2, 4.2]), 'ray', { where: b.isMat('wrap') });
    b.add('root', box([0, 0, -6.8], [1.15, 1.3, 0.6], { round: 0.35 }), 'gold');
    b.add('root', box([0, -0.05, 5.4], [0.8, 1.15, 0.45]), 'gold');
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  SHINJI_PROP_WARNINGS[kind] = b.warnings;
  return b.build();
}

/**
 * The Hollow mask, a pharaoh's death mask: the smooth crown over the brow and skull, the hood flaring out
 * behind the ears and falling as a short lappet down the nape, long eye slits slanting down and out (black,
 * the grey irises glowing in them), a long grin of teeth across the lower face. Origin at the 'face' socket.
 */
function buildMask(): VoxelModel {
  const b = new ModelBuilder('shinji-mask', 48);
  b.mat('bone', ['#F7F4EC', '#EFEBE0', '#DED7C9', '#C9C3B4', '#ACA595'], { base: 1, rough: 0.42, shadeK: 1 });
  b.mat('dark', ['#0C0C10'], { rough: 0.9 });
  b.mat('iris', ['#B4B7BE'], { rough: 0.3, glow: 0.45 });
  b.mat('teeth', ['#F3EEE4'], { rough: 0.35 });
  b.mat('gap', ['#120D0D'], { rough: 0.9 });
  b.bone('root', null, [0, 0, 0]);
  // where the mask sits on his head: the 'face' socket (chin + 5.5, the front of the face) is its origin
  const L = humanoidSkeleton(new ModelBuilder('shinji-mask-frame', SHINJI_RES), SPEC);
  const front = Math.round(L.headC[2] + SPEC.head.d / 2);
  const oy = SPEC.chinY + 5.5;
  // the face: the front of an egg over the face
  const face = intersect(ellipsoid([0, 0.2, -3.8], [6.4, 7.8, 6.6]), fn((_x, _y, z) => -0.5 - z, [-9, -10, -12], [9, 10, 4]));
  // the nemes: the hair's own volume swollen a little and let down to the jaw, so the hood covers the bob
  // (only the tips peek out below it), the face left open for the plate above
  const hair = bobField(L, 1.4, 1.6);
  const nemes = subtract(
    fn((x, y, z) => hair(x, y + oy, z + front), [-12, -9, -18], [12, 12, 4]),
    box([0, -4, 2.2], [4.3, 6.4, 3.4]),
  );
  const zBack = L.headC[2] - 0.6 - front - (SPEC.head.d / 2 + 1.9 + 1.4);
  const lappet = box([0, -8.4, zBack + 0.9], [3.6, 5.6, 0.9], { round: 0.6 });
  b.add('root', face, 'bone');
  b.add('root', nemes, 'bone', { thr: 0.25 });
  b.add('root', lappet, 'bone');
  // the nemes stripes: shallow bands across the flaps and the lappet
  b.paint('root', fn((x, y) => (Math.abs(x) > 5.6 || y < -5.2 ? Math.abs(((y + 40) % 2.2) - 1.1) - 0.32 : 1), [-11, -15, -14], [11, 6, 2]), 'bone', { shade: 3, where: b.isMat('bone') });
  // the eye slits, long and slanting down toward the temples
  for (const sx of [-1, 1]) {
    b.carve('root', ellipsoid([sx * 2.7, 0.4, 2.4], [2.4, 0.75, 2.6], [0, 0, sx * -14]));
    b.paint('root', ellipsoid([sx * 2.7, 0.4, 1.4], [2.6, 0.85, 2.6], [0, 0, sx * -14]), 'dark');
    b.voxel('root', sx > 0 ? 2 : -3, 0, 0, 'iris');
  }
  // a ridge down the nose
  b.add('root', capsule([0, 2.6, 2.4], [0, -2, 2.6], 0.7), 'bone');
  // the grin: two rows of teeth with a dark seam, narrow gaps between them
  for (let x = -6; x < 6; x++) {
    for (let y = -6; y <= -3; y++) {
      const g = b.grid('root');
      let zf = -99;
      for (let z = 8; z >= -3; z--) if (g.get(x, y, z) !== 0) { zf = z; break; }
      if (zf < -50) continue;
      const seam = y === -5 || ((x + 30) % 3 === 0 && y !== -5);
      b.voxel('root', x, y, zf, seam ? 'gap' : 'teeth', 'flat');
    }
  }
  b.autoShade({ up: 0.5, open: 2.4, front: 0.2 });
  b.lint();
  SHINJI_PROP_WARNINGS.mask = b.warnings;
  return b.build();
}
