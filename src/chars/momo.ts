// Momo Hinamori — Lieutenant of the 5th Division (docs/roster/C2-lieutenants-2.md §2). Brief: 151 cm, a petite body
// of 75 vox at 49.7 vox/m; slim, narrow shoulders, a youthful face with big round eyes (the head ≈ 1/6.3 of her
// height). Silhouette keys: the round bun at the back of the head wrapped in an off-white cloth and tied, two long
// locks framing the face, the lieutenant's badge (五 and a lily of the valley) on the left arm, Tobiume at the left hip
// looking long on her.
// Props: sealed Tobiume (a katana: a light-red wrap, a rectangular brass guard stamped with five-petal plum blossoms,
// a dark lacquer sheath); the Shikai (the blade straight and double-edged, three short jutte prongs along it angled
// toward the point, alternating sides).
// (verify) the bun cloth's colour, the sheath's colour, the prongs' placement.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, box, capsule, cylinder, ellipsoid, fn, smoothPath, sphere, spike, torus, tube, type V3 } from '../models/sdf';
import { faceLegend, feet, hakama, hands, head, humanoidSkeleton, kosodeSleeves, kosodeTorso, obi, shihakushoSprings, spikeHair, type HumanoidSpec, type Landmarks, type Spike } from './humanoid';
import type { CharacterAsset } from './ichigo';

/** 75 voxels = 1.51 m */
export const MOMO_RES = 75 / 1.51;

/** Petite and slim (Rukia's frame, a little taller). */
const SPEC: HumanoidSpec = {
  H: 75,
  chinY: 62.5,
  head: { w: 10, d: 11, h: 12 },
  neckR: 2.0,
  shoulder: [7.2, 57.5, -0.5],
  upperArm: 12,
  foreArm: 10.9,
  hand: 7.2,
  armR: 1.95,
  hipsY: 38.6,
  hip: [3.9, 36, 0],
  kneeY: 20.3,
  ankleY: 4,
  chest: [6.2, 4.2],
  waist: [5.1, 3.6],
  hips: [6.2, 4.3],
  chestY: 52,
  waistY: 44.8,
  foot: { len: 9.8, w: 4.1, heel: 2.5 },
};

function palette(b: ModelBuilder): void {
  b.mat('skin', ['#FAE6D8', '#F6DCC9', '#E8C6B1', '#D8B19A', '#BC937D'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#4A3833', '#3B2B27', '#2C211F', '#221A1A', '#16121A'], { base: 2, rough: 0.45, shadeK: 0.85 });
  b.mat('brow', ['#2C211F']);
  b.mat('lid', ['#2A1E1C']);
  b.mat('sclera', ['#F3F1EC']);
  b.mat('iris', ['#8A5A3E']);
  b.mat('irisD', ['#6A3F2A']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#C9877A']);
  b.mat('blush', ['#F0C2B0']);
  b.mat('cloth', ['#F3F0E8', '#EEE9DF', '#DAD3C6', '#C2B9AA'], { base: 1, rough: 0.8 });
  b.mat('tie', ['#E2D9CA', '#D6CDBE', '#B9AE9C'], { base: 1, rough: 0.8 });
  b.mat('black', ['#34343C', '#24242A', '#18181D', '#141418'], { base: 2, rough: 0.85, shadeK: 0.9 });
  b.mat('collar', ['#F3F3F0', '#E4E5E7', '#C9CCD1'], { base: 0, rough: 0.8 });
  b.mat('obi', ['#F3F3F0', '#E2E3E5', '#C6C9CE'], { base: 0, rough: 0.8 });
  b.mat('badge', ['#EFE6CF', '#D9CDB0', '#B9AB8C'], { base: 0, rough: 0.8 });
  b.mat('wood', ['#8B6340', '#6B4A2B', '#4E3520'], { base: 1, rough: 0.8 });
  b.mat('ink', ['#1E1A16']);
  b.mat('lily', ['#AFEEEE']);
  b.mat('tabi', ['#F3F2EE', '#DEDDDA', '#C2C1BD'], { base: 0, rough: 0.8 });
  b.mat('straw', ['#C9A86A', '#A8874F', '#86683A'], { base: 1, rough: 0.9 });
  b.mat('cord', ['#5B4632']);
}

/**
 * Rows chin+9 → chin (column 0 is her right). Big round eyes, three rows tall with a bright catch-light, soft brows,
 * a touch of blush, a small mouth.
 */
const FACE = [
  '. . . . . . . . . .',
  '. B B B . . B B B .',
  '. L L L . . L L L .',
  'L W I I . . I I W L',
  '. W * i . . i * W .',
  '. . I I . . I I . .',
  '. p . . . s . . p .',
  '. . . . . . . . . .',
  '. . . . m m . . . .',
  '. . . . . . . . . .',
];

/** the 5th Division: 五 on the badge (pixel impression, 3 × 3) */
const GO = [
  'x x x',
  '. x .',
  'x x x',
];

let assetCache: CharacterAsset | null = null;
const propCache = new Map<string, VoxelModel>();

export function momoAsset(): CharacterAsset {
  if (!assetCache) assetCache = buildMomo();
  return assetCache;
}

/** 'katana' (sealed Tobiume), 'saya' (its sheath), 'tobiume' (the Shikai: straight, double-edged, three prongs) */
export type MomoProp = 'katana' | 'saya' | 'tobiume';

export function momoProp(kind: MomoProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'katana' ? buildKatana() : kind === 'saya' ? buildSaya() : buildTobiume();
    propCache.set(kind, m);
  }
  return m;
}

/** blade sample points (prop frame, m) */
export const KATANA_BASE_Z = 5 / 48;
export const KATANA_TIP_Z = 37 / 48;
/** the released blade (straight, a little longer) */
export const TOBIUME_BASE_Z = 5 / 48;
export const TOBIUME_TIP_Z = 38 / 48;

export function buildMomo(): CharacterAsset {
  const b = new ModelBuilder('momo', MOMO_RES);
  palette(b);
  const s = SPEC;
  const L = humanoidSkeleton(b, s, { sleeves: true, hakama: true });
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 3.6, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 3.6, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.5, wy - 4.2, wz + 0.9]);
  b.socket('palm.L', 'palm.L', [wx - 0.5, wy - 4.2, wz + 0.9]);
  b.socket('chest.front', 'chest', [0, s.chestY, 5]);
  b.socket('back', 'chest', [0, s.chestY - 2, -6]);
  b.socket('hip.L', 'hips', [s.waist[0] + 1.4, s.waistY - 3, 2], [-20, 0, 6]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('mouth', 'head', [0, s.chinY + 1.5, hd.front + 0.5]);
  // a soft round chin
  for (const k of [-1, 1]) b.carve('head', box([k * 5.4, hd.chin + 1.2, hd.front - 2], [0.9, 2.2, 3], { rot: [0, 0, k * 18] }));
  const legend = { ...faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), p: { mat: 'blush' } };
  b.stamp('head', hd.x0, hd.chin + 9, FACE, legend, hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  hair(b, L, hd);
  hands(b, L, 'skin', 1.0);
  feet(b, L, 'tabi', 'straw', 'cord');
  const o = { black: 'black', collar: 'collar', skin: 'skin', obi: 'obi', bag: 3.4, hakamaHem: 2, hemR: 7.4 };
  kosodeTorso(b, L, o);
  kosodeSleeves(b, L, o);
  obi(b, L, o);
  hakama(b, L, o);
  badge(b, L);
  b.autoShade();
  b.lint();
  const base = shihakushoSprings();
  return { model: b.build(), springs: base.springs, colliders: base.colliders, warnings: b.warnings };
}

/**
 * Near-black brown hair drawn back into a round bun behind the head, the bun wrapped in an off-white cloth tied with
 * a band; medium bangs over the brow; two long locks framing the face down past the chin.
 */
function hair(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }): void {
  const s = L.spec;
  const c = hd.chin, front = hd.front;
  const back = L.headC[2] - s.head.d / 2;
  // the hair drawn back smooth over the skull toward the bun
  const locks: Spike[] = [];
  for (const az of [-120, -150, 180, 150, 120]) locks.push({ az, el: 10, len: 1.2, r: 3.4, flat: 0.5, flow: [0, 0.3, -0.6] });
  for (const k of [-1, 1]) locks.push({ az: k * 85, el: 10, len: 1.4, r: 3, flat: 0.45, flow: [0, -0.4, -0.3] });
  spikeHair(b, L, 'hair', locks, [
    { x: -3.2, tipY: c + 8.2, lean: -0.8, r: 1.6 },
    { x: -0.8, tipY: c + 8.6, lean: -0.2, r: 1.5 },
    { x: 1.6, tipY: c + 8.4, lean: 0.4, r: 1.5 },
    { x: 3.6, tipY: c + 8.0, lean: 0.9, r: 1.5 },
  ], { hairline: c + s.head.h - 1.2, nape: c + 3, slope: 0.6, tufts: 10, tuftFlow: [0, 0.1, -0.6] });
  // the two long locks framing the face, down past the jaw
  for (const k of [-1, 1]) {
    const pts = smoothPath([[k * 4.8, c + 9.6, front - 1.6], [k * 5.5, c + 5.6, front - 0.8], [k * 5.3, c + 1.0, front - 0.8], [k * 5.0, c - 2.6, front - 1.2]], 3);
    b.add('head', tube(pts, pts.map((_, i) => 1.5 - i * 0.07)), 'hair', { thr: 0.3 });
  }
  // keep the eyes clear
  b.carve('head', aabb([-4.6, c + 4, front], [-1, c + 7.2, front + 6]));
  b.carve('head', aabb([1, c + 4, front], [4.6, c + 7.2, front + 6]));
  // the bun: a round knot behind the head, wrapped in cloth, a band tied round it with two short tails
  const bc: V3 = [0, c + 6.6, back - 2.6];
  b.add('head', ellipsoid(bc, [3.6, 3.4, 3.2]), 'cloth');
  b.add('head', capsule([0, c + 6.4, back + 0.5], [0, c + 6.6, back - 1.2], 2.2), 'hair');
  b.add('head', torus([bc[0], bc[1], bc[2] + 0.4], 3.2, 0.6, [0, 0, 0]), 'tie', { thr: 0.25 });
  // the cloth's folds gathered at the tie
  for (const a of [0, 60, 120, 180, 240, 300]) {
    const r = (a * Math.PI) / 180;
    b.paint('head', capsule([bc[0] + Math.cos(r) * 1.2, bc[1] + Math.sin(r) * 1.2, bc[2] - 3.2], [bc[0] + Math.cos(r) * 3.4, bc[1] + Math.sin(r) * 3.2, bc[2] - 0.2], 0.4), 'cloth', { shade: 2, where: b.isMat('cloth') });
  }
  for (const k of [-1, 1]) b.add('head', spike([k * 1.2, bc[1] - 2.6, bc[2] + 0.2], [k * 0.4, -1, -0.3], 3.2, 1.0, 0.45, { side: [1, 0, 0], tip: 0.3 }), 'tie', { thr: 0.25 });
}

/** The lieutenant's badge on the left sleeve: the cloth band, the plaque (五 and a lily of the valley), the knot. */
function badge(b: ModelBuilder, L: Landmarks): void {
  const [sx, sy, sz] = L.spec.shoulder;
  const yb = sy - 5.5;
  b.add('upperarm.L', cylinder([sx + 0.4, yb - 0.65, sz - 0.3], [sx + 0.4, yb + 0.65, sz - 0.3], 3.7), 'collar');
  b.add('upperarm.L', box([sx + 3.8, yb - 0.4, sz - 0.3], [0.45, 2.1, 1.6]), 'wood');
  b.add('upperarm.L', box([sx + 4.2, yb - 0.4, sz - 0.3], [0.3, 1.7, 1.25]), 'badge');
  GO.forEach((row, r) => row.split(' ').forEach((ch, col) => {
    if (ch === 'x') b.voxel('upperarm.L', Math.round(sx + 4.6), Math.round(yb + 0.8 - r), Math.round(sz - 1.3 + col), 'ink');
  }));
  b.voxel('upperarm.L', Math.round(sx + 4.6), Math.round(yb - 2), Math.round(sz - 0.3), 'lily');
  b.add('upperarm.L', sphere([sx + 2.7, yb - 0.2, sz + 2.8], 0.9), 'collar');
}

// ---------------------------------------------------------------------------------------------- props

/** the hilt and guard both forms share: a light-red wrap over white, a rectangular brass guard with plum blossoms */
function hilt(b: ModelBuilder): void {
  b.mat('brass', ['#E0BC64', '#C9A24A', '#A6823A', '#82642B'], { base: 1, rough: 0.35, metal: 0.85, shadeK: 0.8 });
  b.mat('plum', ['#F3D2DA'], { rough: 0.5, metal: 0.4 });
  b.mat('wrap', ['#EC7F86', '#E0646B', '#C44F57', '#A33F47'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#EDE6DA']);
  const gz = 3.8;
  b.add('root', box([0, 0, gz], [2.3, 3.3, 0.5], { round: 0.4 }), 'brass');
  // five-petal blossoms stamped in each half
  for (const half of [1, -1]) for (const face of [-1, 1]) {
    const cy = half * 1.9;
    for (const [dy, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) b.voxel('root', face > 0 ? 2 : -3, Math.round(cy + dy), Math.round(gz + dz), 'plum');
  }
  b.add('root', box([0, -0.1, 4.6], [0.8, 1.2, 0.55]), 'brass');
  b.add('root', box([0, 0, -1.4], [1.0, 1.15, 4.8], { round: 0.5 }), 'wrap');
  b.paint('root', fn((_x, y, z) => Math.abs(((Math.abs(y) + z) % 2.6 + 2.6) % 2.6 - 1.3) - 0.42, [-2, -2, -7], [2, 2, 3]), 'ray', { where: b.isMat('wrap') });
  b.add('root', cylinder([0, 0, -6.2], [0, 0, -7.2], 1.15, 0.95, 0.3), 'brass');
}

/** Sealed Tobiume: a plain katana. */
function buildKatana(): VoxelModel {
  const b = new ModelBuilder('tobiume-sealed', 48);
  b.mat('steel', ['#E7EAEE', '#D5D9DE', '#B2B8BF', '#9097A0'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#F3F3F0'], { rough: 0.12, metal: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  const z0 = 5, zTip = 37, zEnd = zTip - 3;
  const curve = (z: number) => Math.max(0, z - z0) ** 2 * 0.0011;
  b.add('root', fn((x, y, z) => {
    if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
    const cv = curve(z);
    const top = 0.9 + cv, bot = -1.1 + cv + Math.max(0, z - zEnd) * 0.66;
    return Math.max(Math.abs(x) - 0.5, y - top, bot - y, z0 - z, z - zTip);
  }, [-2, -3, z0 - 1], [2, 3, zTip + 1]), 'steel', { thr: 0.3 });
  b.paint('root', fn((_x, y, z) => y - (-0.62 + curve(z) + Math.max(0, z - zEnd) * 0.66), [-2, -3, 0], [2, 3, zTip + 1]), 'edge');
  hilt(b);
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** The sheath: dark lacquer, brass at the mouth and the tip. */
function buildSaya(): VoxelModel {
  const b = new ModelBuilder('tobiume-saya', 48);
  b.mat('lacquer', ['#3E2A2D', '#2A1C1E', '#1E1416', '#141418'], { base: 1, rough: 0.28, shadeK: 0.8 });
  b.mat('brass', ['#E0BC64', '#C9A24A', '#A6823A'], { base: 1, rough: 0.35, metal: 0.85 });
  b.bone('root', null, [0, 0, 0]);
  const Ls = 34;
  b.add('root', box([0, 0, -Ls / 2], [0.95, 1.45, Ls / 2], { round: 0.6 }), 'lacquer');
  b.add('root', box([0, 0, -0.5], [1.15, 1.65, 0.6], { round: 0.3 }), 'brass');
  b.add('root', box([0, 0, -Ls + 0.6], [1.1, 1.6, 0.7], { round: 0.5 }), 'brass');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * Tobiume released: the blade straight and double-edged, a ridge down its middle; three short jutte prongs spring
 * from its edges, alternating sides, angled toward the point.
 */
function buildTobiume(): VoxelModel {
  const b = new ModelBuilder('tobiume', 48);
  b.mat('steel', ['#ECEFF2', '#DDE2E7', '#BEC5CD', '#9AA2AC'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#F3F3F0'], { rough: 0.12, metal: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  const z0 = 5, zTip = 38;
  b.add('root', fn((x, y, z) => {
    if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
    const w = 1.15 * Math.min(1, (zTip - z) / 3.2);
    return Math.max(Math.abs(x) - 0.5 + Math.abs(y) * 0.12, Math.abs(y) - w, z0 - z, z - zTip);
  }, [-2, -3, z0 - 1], [2, 3, zTip + 1]), 'steel', { thr: 0.3 });
  b.paint('root', fn((_x, y) => 0.7 - Math.abs(y), [-2, -3, z0], [2, 3, zTip + 1]), 'edge', { where: b.isMat('steel') });
  // the prongs: short hooks off alternate edges, leaning toward the point
  for (const [i, z] of [12, 19, 26].entries()) {
    const k = i % 2 === 0 ? 1 : -1;
    b.add('root', spike([0, k * 0.9, z], [0, k * 0.85, 0.6], 5.2, 1.05, 0.6, { side: [1, 0, 0], tip: 0.3 }), 'steel', { thr: 0.25 });
  }
  hilt(b);
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}
