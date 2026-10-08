// Shūhei Hisagi — co-Lieutenant of the 9th Division (docs/roster/C1-lieutenants-1.md §Hisagi). Brief: 181 cm, the
// standard body at 46.4 vox/m (84 vox); tall, lean and athletic, bare muscular arms (the 9th Division's sleeveless
// kosode). Silhouette keys: short spiky black hair; three straight scars down over his right eye; "69" on his left
// cheek; the blue stripe across the left cheek and the bridge of the nose; the black choker and the black bands round
// both upper arms (they are explosives); the lieutenant's badge tied on the left arm.
// Props: sealed Kazeshini (a katana with an octagonal guard, black wrap over white) and its black sheath (at his
// left hip); the Shikai: two kusarigama, each a black spiked rod with two curved blades pointing opposite ways like
// a pinwheel, one long chain between their butts (drawn by the kit); the novel Bankai's orb of tangled chains.
// (verify) the stripe's hue; the hilt and sheath colours; the orb's size.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, intersect, sphere, subtract, torus, type Sdf } from '../models/sdf';
import { SPEC_ADULT_MALE, faceLegend, feet, hakama, hands, head, humanoidSkeleton, kosodeTorso, obi, shihakushoSprings, spikeHair, type HumanoidSpec, type Landmarks, type Spike } from './humanoid';
import type { CharacterAsset } from './ichigo';

/** 84 voxels = 1.81 m */
export const HISAGI_RES = 84 / 1.81;

/** Lean, athletic, broad in the shoulder. */
const SPEC: HumanoidSpec = {
  ...SPEC_ADULT_MALE,
  shoulder: [9.8, 66.5, -0.5],
  upperArm: 14.6,
  foreArm: 13.2,
  armR: 2.7,
  chest: [8.6, 5.0],
  waist: [6.8, 4.3],
  hips: [7.2, 4.6],
};

function palette(b: ModelBuilder): void {
  b.mat('skin', ['#F2CDA8', '#E7B993', '#D8A57F', '#C2916C', '#A47554'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#3A4150', '#2C3340', '#1F232C', '#18191F', '#141418'], { base: 2, rough: 0.5, shadeK: 0.85 });
  b.mat('brow', ['#2C2E36']);
  b.mat('lid', ['#232227']);
  b.mat('sclera', ['#F1F0EC']);
  b.mat('iris', ['#4B4F57']);
  b.mat('irisD', ['#26282E']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#8A5A4E']);
  b.mat('scar', ['#C98572']);
  b.mat('stripe', ['#3E86C9']);
  b.mat('tattoo', ['#18181C']);
  b.mat('black', ['#34343C', '#24242A', '#18181D', '#141418'], { base: 2, rough: 0.85, shadeK: 0.9 });
  b.mat('band', ['#3A3A42', '#2A2A30', '#1C1C20'], { base: 2, rough: 0.5 });
  b.mat('collar', ['#F3F3F0', '#E4E5E7', '#C9CCD1'], { base: 0, rough: 0.8 });
  b.mat('obi', ['#F3F3F0', '#E2E3E5', '#C6C9CE'], { base: 0, rough: 0.8 });
  b.mat('badge', ['#EFE6CF', '#D9CDB0', '#B9AB8C'], { base: 0, rough: 0.8 });
  b.mat('wood', ['#8B6340', '#6B4A2B', '#4E3520'], { base: 1, rough: 0.8 });
  b.mat('ink', ['#1E1A16']);
  b.mat('tabi', ['#F3F2EE', '#DEDDDA', '#C2C1BD'], { base: 0, rough: 0.8 });
  b.mat('straw', ['#C9A86A', '#A8874F', '#86683A'], { base: 1, rough: 0.9 });
  b.mat('cord', ['#5B4632']);
}

/**
 * Narrow, level eyes under straight brows, a firm mouth. The three scars run straight down over his right eye
 * (the stamp's left), the blue stripe crosses from the bridge of the nose over the left cheek, and the "69" sits
 * under it. Rows chin+9 → chin.
 */
const FACE = [
  '. . . . . . . . . .',
  'a B a B a . B B B .',
  'a . a . a . . . . .',
  'a L L L a . L L L .',
  'a W I i a . i I W .',
  'a . a . t t t t t t',
  'a . a . . s . . . .',
  '. . a . . . . . . .',
  '. . . . m m . . . .',
  '. . . . . . . . . .',
];
/** the "69" on his left cheek, at twice the body's resolution (a decal laid on the cheek), 7 × 5 */
const SIXTY_NINE = [
  '. x x . x x x',
  'x . . . x . x',
  'x x x . x x x',
  'x . x . . . x',
  'x x x . x x .',
];

/** the 9th Division: 九 on the badge (pixel impression, 3 × 3) */
const KU = [
  'x x .',
  '. x x',
  'x . x',
];

const HAIR: Spike[] = [
  // crown: short chunky spikes up and back
  { az: 0, el: 72, len: 3.6, r: 3.6, flow: [0, 0.35, -0.5] },
  { az: -44, el: 62, len: 3.4, r: 3.4, flow: [-0.1, 0.3, -0.5] },
  { az: 44, el: 62, len: 3.4, r: 3.4, flow: [0.1, 0.3, -0.5] },
  { az: -98, el: 50, len: 3, r: 3.2, flow: [0, 0.15, -0.5] },
  { az: 98, el: 50, len: 3, r: 3.2, flow: [0, 0.15, -0.5] },
  { az: -144, el: 46, len: 3.4, r: 3.4, flow: [0, 0.05, -0.6] },
  { az: 144, el: 46, len: 3.4, r: 3.4, flow: [0, 0.05, -0.6] },
  { az: 180, el: 56, len: 4, r: 3.6, flow: [0, 0.15, -0.6] },
  // the front: short spikes standing up over the forehead, a little forward
  { az: -26, el: 40, len: 3, r: 2.8, flow: [-0.08, 0.85, 0.2] },
  { az: 0, el: 43, len: 3.6, r: 2.9, flow: [0, 0.9, 0.25] },
  { az: 26, el: 40, len: 3, r: 2.8, flow: [0.08, 0.85, 0.2] },
  // sides back over the ears, the nape
  { az: -80, el: 20, len: 2.6, r: 3, flow: [0, 0, -0.5] },
  { az: 80, el: 20, len: 2.6, r: 3, flow: [0, 0, -0.5] },
  { az: -160, el: 6, len: 2.6, r: 3, flow: [0, -0.6, -0.4] },
  { az: 160, el: 6, len: 2.6, r: 3, flow: [0, -0.6, -0.4] },
  { az: 180, el: 22, len: 3, r: 3.2, flow: [0, -0.4, -0.5] },
];

let assetCache: CharacterAsset | null = null;
const propCache = new Map<string, VoxelModel>();

export function hisagiAsset(): CharacterAsset {
  if (!assetCache) assetCache = buildHisagi();
  return assetCache;
}

/**
 * 'katana' (sealed Kazeshini), 'saya' (its sheath), 'sickle' (one of the Shikai's two kusarigama), 'orb' (the novel
 * Bankai's orb of chains), 'tattoo' (the "69" on his cheek: a decal at twice the body's resolution)
 */
export type HisagiProp = 'katana' | 'saya' | 'sickle' | 'orb' | 'tattoo';

export function hisagiProp(kind: HisagiProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'katana' ? buildKatana() : kind === 'saya' ? buildSaya() : kind === 'sickle' ? buildSickle() : kind === 'tattoo' ? buildTattoo() : buildOrb();
    propCache.set(kind, m);
  }
  return m;
}

/** the katana's blade (prop frame, m) */
export const KAZESHINI_BASE_Z = 6 / 48;
export const KAZESHINI_TIP_Z = 43 / 48;
/** a sickle (prop frame, m: the hand at the origin, the rod up +Z): the chain ring at the butt, the blades' reach */
export const SICKLE_BUTT_Z = -3.4 / 48;
export const SICKLE_TOP_Z = 15 / 48;
/** the blades span ±x this far from the rod (m) */
export const SICKLE_SPAN = 11.5 / 48;

export function buildHisagi(): CharacterAsset {
  const b = new ModelBuilder('hisagi', HISAGI_RES);
  palette(b);
  const s = SPEC;
  const L = humanoidSkeleton(b, s, { hakama: true });
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 5, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5, wz + 1]);
  b.socket('chest.front', 'chest', [0, 61, 7]);
  b.socket('back', 'chest', [0, 58, -9]);
  // the sheath in the obi at his left hip, the mouth forward and up
  b.socket('hip.L', 'hips', [s.waist[0] + 1.6, s.waistY - 3, 2], [-20, 0, 6]);
  // the explosive bands (the kit hides each one as it is thrown)
  b.socket('choker', 'neck', [0, s.chinY - 3.2, L.headC[2] + 2.6]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  // the "69" decal: its centre on the left cheek, under the stripe
  b.socket('cheek.L', 'head', [2.9, s.chinY + 2.5, hd.front + 0.05]);
  b.socket('mouth', 'head', [0, s.chinY + 1.5, hd.front + 0.5]);
  spikeHair(b, L, 'hair', HAIR, [], { tufts: 30 });
  // keep the eyes and the face's marks clear of hair
  b.carve('head', aabb([-5, hd.chin + 3, hd.front], [5, hd.chin + 8.6, hd.front + 6]));
  const legend = {
    ...faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }),
    a: { mat: 'scar' }, t: { mat: 'stripe' },
  };
  b.stamp('head', hd.x0, hd.chin + 9, FACE, legend, hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  // the scars carry on up into the hairline, the stripe round the side of his left cheek
  for (const x of [-5, -3]) if (b.grid('head').get(x, hd.chin + 10, hd.front - 1) !== 0) b.voxel('head', x, hd.chin + 10, hd.front - 1, 'scar');
  for (const dz of [1, 2]) {
    const z = hd.front - 1 - dz, x = -hd.x0 - 1;
    if (b.grid('head').get(x, hd.chin + 5, z) !== 0) b.voxel('head', x, hd.chin + 5, z, 'stripe');
  }
  hands(b, L, 'skin');
  feet(b, L, 'tabi', 'straw', 'cord');
  const o = { black: 'black', collar: 'collar', skin: 'skin', obi: 'obi' };
  kosodeTorso(b, L, o);
  arms(b, L);
  obi(b, L, o);
  hakama(b, L, o);
  bands(b, L);
  b.autoShade();
  b.lint();
  const base = shihakushoSprings();
  // no sleeve bags: drop their springs
  return { model: b.build(), springs: base.springs.filter((sp) => !sp.bone.startsWith('sleeve')), colliders: base.colliders, warnings: b.warnings };
}

/** Bare arms, lean and muscled: smooth tapered limbs with one broad swell each (small blends dimple the voxels). */
function arms(b: ModelBuilder, L: Landmarks): void {
  const [sx, sy, sz] = L.spec.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(2.4,
    capsule([sx, sy - 0.6, sz], [sx, ey + 1, sz], 2.8, 2.3),
    ellipsoid([sx + 0.1, sy - 6.2, sz + 0.6], [2.6, 4.4, 2.4])), 'skin', { mirror: true });
  b.add('forearm.L', blend(2.0,
    capsule([sx, ey, sz], [sx, wy + 1, sz], 2.45, 1.8),
    ellipsoid([sx + 0.15, ey - 3.0, sz + 0.2], [2.6, 3.6, 2.5])), 'skin', { mirror: true });
}

/**
 * The black choker and the bands round both upper arms (explosives: the kit hides each one as it is torn off and
 * thrown) — on their own bones so they can vanish; the badge tied on the left arm below its band.
 */
function bands(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const cy = s.chinY - 3.6;
  b.bone('choker', 'neck', [0, cy, L.headC[2] - 0.5]);
  // solid through (the inside is hidden in the neck), so the ring never breaks into pieces
  b.add('choker', cylinder([0, cy - 0.9, L.headC[2] - 0.5], [0, cy + 0.9, L.headC[2] - 0.5], s.neckR + 0.9), 'band');
  b.paint('choker', cylinder([0, cy - 0.15, L.headC[2] - 0.5], [0, cy + 0.15, L.headC[2] - 0.5], s.neckR + 2), 'band', { shade: 0, where: b.isMat('band') });
  const by = sy - 5.2;
  for (const k of [1, -1]) {
    const bone = k > 0 ? 'armband.L' : 'armband.R';
    b.bone(bone, k > 0 ? 'upperarm.L' : 'upperarm.R', [k * sx, by, sz]);
    b.add(bone, cylinder([k * sx, by - 1.1, sz], [k * sx, by + 1.1, sz], 3.5), 'band');
    b.paint(bone, cylinder([k * sx, by - 0.2, sz], [k * sx, by + 0.2, sz], 4), 'band', { shade: 0, where: b.isMat('band') });
  }
  // the badge on the left arm: a white cloth band, the plaque (九 and the poppy) on its outside, a knot
  const yb = sy - 9;
  b.add('upperarm.L', cylinder([sx, yb - 0.7, sz], [sx, yb + 0.7, sz], 3.2), 'collar', { only: 'empty' });
  b.add('upperarm.L', box([sx + 3.0, yb, sz], [0.45, 2.0, 1.6]), 'wood');
  b.add('upperarm.L', box([sx + 3.4, yb, sz], [0.3, 1.5, 1.2]), 'badge');
  KU.forEach((row, r) => row.split(' ').forEach((ch, c) => {
    if (ch === 'x') b.voxel('upperarm.L', Math.round(sx + 3.8), Math.round(yb + 1 - r), Math.round(sz - 1 + c), 'ink');
  }));
  b.add('upperarm.L', sphere([sx + 2.2, yb - 0.2, sz + 2.6], 0.9), 'collar');
}

// ---------------------------------------------------------------------------------------------- props

/** Sealed Kazeshini: a straight katana, an octagonal dark-iron guard, a black wrap over white rayskin. */
function buildKatana(): VoxelModel {
  const b = new ModelBuilder('kazeshini', 48);
  b.mat('steel', ['#E7EAEE', '#CFD3D8', '#AEB3BA', '#8E949C'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#F3F3F0'], { rough: 0.12, metal: 0.8 });
  b.mat('iron', ['#5A5A62', '#46464D', '#3B3B40', '#2A2A2F'], { base: 1, rough: 0.4, metal: 0.8 });
  b.mat('wrap', ['#2E2E34', '#24242A', '#1C1C20'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#E6E2DA']);
  b.bone('root', null, [0, 0, 0]);
  const z0 = 6, zTip = 43, zEnd = zTip - 3.2;
  b.add('root', fn((x, y, z) => {
    if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
    const top = 0.95, bot = -1.15 + Math.max(0, z - zEnd) * 0.6;
    return Math.max(Math.abs(x) - 0.5, y - top, bot - y, z0 - z, z - zTip);
  }, [-2, -3, z0 - 1], [2, 3, zTip + 1]), 'steel', { thr: 0.3 });
  b.paint('root', fn((_x, y, z) => y - (-0.65 + Math.max(0, z - zEnd) * 0.6), [-2, -3, 0], [2, 3, zTip + 1]), 'edge');
  b.add('root', box([0, -0.1, 5.6], [0.85, 1.3, 0.55]), 'iron');
  // the octagonal guard: a square with its corners cut
  const gz = 4.7;
  const oct = intersect(box([0, 0, gz], [2.6, 2.6, 0.55]), fn((x, y) => (Math.abs(x) + Math.abs(y)) / Math.SQRT2 - 2.75, [-4, -4, gz - 1], [4, 4, gz + 1]));
  b.add('root', oct, 'iron');
  b.paint('root', intersect(oct, fn((x, y) => 2.0 - Math.max(Math.abs(x), Math.abs(y)), [-4, -4, gz - 1], [4, 4, gz + 1])), 'iron', { shade: 0 });
  b.add('root', box([0, 0, -0.9], [1.1, 1.25, 5.2], { round: 0.5 }), 'wrap');
  b.paint('root', fn((_x, y, z) => Math.abs(((Math.abs(y) + z) % 2.6 + 2.6) % 2.6 - 1.3) - 0.42, [-2, -2, -6], [2, 2, 4]), 'ray', { where: b.isMat('wrap') });
  b.add('root', cylinder([0, 0, -6.2], [0, 0, -7.4], 1.25, 1.05, 0.3), 'iron');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** The sheath: black lacquer, iron at the mouth and the tip; the mouth at the origin, the body along −Z. */
function buildSaya(): VoxelModel {
  const b = new ModelBuilder('kazeshini-saya', 48);
  b.mat('lacquer', ['#34343A', '#26262B', '#1C1C1E', '#141418'], { base: 1, rough: 0.28, shadeK: 0.8 });
  b.mat('iron', ['#5A5A62', '#46464D', '#3B3B40'], { base: 1, rough: 0.4, metal: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  const Ls = 38;
  b.add('root', box([0, 0, -Ls / 2], [1.0, 1.55, Ls / 2], { round: 0.6 }), 'lacquer');
  b.add('root', box([0, 0, -0.5], [1.2, 1.75, 0.6], { round: 0.3 }), 'iron');
  b.add('root', box([0, 0, -Ls + 0.6], [1.15, 1.7, 0.7], { round: 0.5 }), 'iron');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** one curved blade of the pinwheel: from the rod's top out to +x and curving back down (k = −1: the mirror turn) */
function blade(k: 1 | -1, top: number): { body: Sdf; edge: Sdf } {
  // rotating the pair 180° about the rod's top makes the second blade curve the other way (the pinwheel)
  const m = (x: number, z: number): [number, number] => (k > 0 ? [x, z] : [-x, 2 * top - z]);
  const outer = fn((x, y, z) => {
    const [u, w] = m(x, z);
    return Math.max(Math.hypot(u - 4, w - (top - 6)) - 7.2, Math.abs(y) - 0.65);
  }, [-14, -2, top - 14], [14, 2, top + 14]);
  const inner = fn((x, y, z) => {
    const [u, w] = m(x, z);
    return Math.hypot(u - 3.4, w - (top - 7.6)) - 6.0;
  }, [-14, -2, top - 14], [14, 2, top + 14]);
  const side = fn((x, _y, z) => {
    const [u, w] = m(x, z);
    return Math.max(0.2 - u, (top - 9) - w);
  }, [-14, -2, top - 14], [14, 2, top + 14]);
  const body = intersect(subtract(outer, inner), side);
  const edge = fn((x, _y, z) => {
    const [u, w] = m(x, z);
    return 6.4 - Math.hypot(u - 4, w - (top - 6));
  }, [-14, -2, top - 14], [14, 2, top + 14]);
  return { body, edge };
}

/**
 * One of Kazeshini's two kusarigama: a black rod with steel spikes (the hand at the origin, the rod along +Z),
 * two curved blades at its top pointing opposite ways like a pinwheel, the chain's ring at the butt.
 */
function buildSickle(): VoxelModel {
  const b = new ModelBuilder('kazeshini-sickle', 48);
  b.mat('steel', ['#E3E7EC', '#C7CCD3', '#A9AFB7', '#8C929A'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#EEF1F4'], { rough: 0.12, metal: 0.8 });
  b.mat('rod', ['#3A3A42', '#2A2A30', '#1C1C20'], { base: 1, rough: 0.45, metal: 0.4 });
  b.mat('spike', ['#B5BAC1', '#9DA3AA', '#7E848B'], { base: 1, rough: 0.3, metal: 0.85 });
  b.mat('chain', ['#A3A8AE', '#8A8F96', '#5B6066'], { base: 1, rough: 0.35, metal: 0.85 });
  b.bone('root', null, [0, 0, 0]);
  const top = 15;
  // the rod: a grip wrapped at the bottom, the spiked shaft above
  b.add('root', cylinder([0, 0, -2.6], [0, 0, top + 0.8], 1.05, 0.9), 'rod');
  for (const z of [3, 7, 11]) for (const k of [-1, 1]) b.add('root', cylinder([0, k * 0.6, z], [0, k * 2.6, z], 0.75, 0.15), 'spike', { thr: 0.25 });
  b.add('root', sphere([0, 0, top + 0.6], 1.6), 'rod');
  for (const k of [1, -1] as const) {
    const { body, edge } = blade(k, top);
    b.add('root', body, 'steel', { thr: 0.25 });
    b.paint('root', edge, 'edge', { where: b.isMat('steel') });
  }
  // the chain's ring at the butt
  b.add('root', torus([0, 0, -3.6], 1.3, 0.55, [0, 0, 90]), 'chain');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** The "69": one layer of ink at 2 × the body's density, centred on the origin, facing +Z. */
function buildTattoo(): VoxelModel {
  const b = new ModelBuilder('hisagi-69', HISAGI_RES * 2);
  b.mat('ink', ['#18181C']);
  b.bone('root', null, [0, 0, 0]);
  SIXTY_NINE.forEach((row, r) => row.split(' ').forEach((ch, c) => {
    if (ch === 'x') b.voxel('root', c - 3, 2 - r, 0, 'ink');
  }));
  return b.build();
}

/** The novel Bankai's orb: a ball of tangled black chain loops (game scale, about 2.4 m across at 12 vox/m). */
function buildOrb(): VoxelModel {
  const b = new ModelBuilder('fushi-orb', 12);
  b.mat('orb', ['#4A4E57', '#2A2D33', '#1C1D22', '#141418'], { base: 2, rough: 0.35, metal: 0.7 });
  b.bone('root', null, [0, 0, 0]);
  const R = 14;
  // a core and loops of chain wound round it in every direction
  b.add('root', sphere([0, 0, 0], R - 4), 'orb');
  for (let i = 0; i < 14; i++) b.add('root', torus([0, 0, 0], R - 1.5 - (i % 3), 1.0, [(i * 37) % 180, (i * 71) % 180, (i * 23) % 90]), 'orb', { thr: 0.2 });
  b.paint('root', fn((x, y, z) => Math.abs(((x * 0.7 + y * 0.9 + z * 0.5 + 60) % 3) - 1.5) - 0.45, [-R - 2, -R - 2, -R - 2], [R + 2, R + 2, R + 2]), 'orb', { shade: 0, where: b.isMat('orb') });
  b.autoShade({ up: 0.5, open: 2, front: 0 });
  b.lint();
  return b.build();
}
