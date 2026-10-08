// Ikkaku Madarame — 3rd Seat of the 11th Division (docs/roster/C1-lieutenants-1.md §Ikkaku). 1.82 m: the standard
// body at 46 vox/m, lean and wiry with long arms. Silhouette keys: the gleaming bald head (a lighter, glossier
// scalp), the red marks flicking out from the outer corners of both eyes, a cocky grin; the plain black
// shihakushō with the scar down the left of his chest showing in the collar, bare feet in waraji, and (the later
// arcs) the gold plate on his right shoulder stamped 龍. Weapons held, not worn:
// - Hōzukimaru sealed: a plain katana (oval guard, three teardrops in relief above and below, a deep-blue wrap
//   over white) in his right hand, the black lacquered sheath reversed in his left.
// - Shikai ("Nobiro"): one wax-wood spear with a single-edged head and a red horsehair tassel at the butt; its
//   iron ferrules mark the three sections that "Sakero" splits on chains. Split props: 'staff' (the butt and
//   middle sections, still in his hands) and 'head' (the blade section, flung on its chain).
// - Bankai, Ryūmon Hōzukimaru: a monk's spade (crescent head) in his left hand and a guandao in his right, each
//   with a red tassel at the hilt and a long iron pommel weight, both chained to the great axe-like centre blade
//   that floats behind his back, a dragon crest engraved on its face ('crest' is the engraving alone, laid over
//   it, so it can fill with red light).
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, smoothPath, sphere, subtract, torus, tube, type V3 } from '../models/sdf';
import { SPEC_ADULT_MALE, faceLegend, feet, hakama, hands, head, humanoidSkeleton, kosodeSleeves, kosodeTorso, obi, shihakushoSprings, type HumanoidSpec, type Landmarks } from './humanoid';
import type { CharacterAsset } from './ichigo';

/** 84 voxels = 1.82 m */
export const IKKAKU_RES = (48 * 84) / 87.4;

/** Lean and wiry, long-armed. */
const SPEC: HumanoidSpec = {
  ...SPEC_ADULT_MALE,
  shoulder: [9.9, 66.5, -0.5],
  upperArm: 15,
  foreArm: 13.6,
  chest: [8.6, 5.0],
  waist: [6.7, 4.3],
  hips: [7.2, 4.6],
};

function palette(b: ModelBuilder): void {
  b.mat('skin', ['#F2CDA6', '#E8BC92', '#D7A77E', '#C49570', '#A67A58'], { base: 1, rough: 0.6, shadeK: 0.9 });
  // the scalp: the same skin, lighter and glossy (it catches the light like the moon)
  b.mat('scalp', ['#FFEAD2', '#F0CDA6', '#E8BC92', '#D7A77E', '#C49570'], { base: 2, rough: 0.22, shadeK: 0.95 });
  b.mat('brow', ['#A87B5C']);
  b.mat('mark', ['#D7262E']);
  b.mat('lid', ['#2A1E18']);
  b.mat('sclera', ['#F3F1EC']);
  b.mat('iris', ['#3A2C24']);
  b.mat('irisD', ['#1A1412']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#8E4E44']);
  b.mat('teeth', ['#F1EEE6'], { rough: 0.4 });
  b.mat('scar', ['#C98E74']);
  b.mat('black', ['#34343C', '#24242A', '#18181D', '#141418'], { base: 2, rough: 0.85, shadeK: 0.9 });
  b.mat('collar', ['#F3F3F0', '#E4E5E7', '#C9CCD1'], { base: 0, rough: 0.8 });
  b.mat('obi', ['#F3F3F0', '#E2E3E5', '#C6C9CE'], { base: 0, rough: 0.8 });
  b.mat('straw', ['#C9A86A', '#A8874F', '#86683A'], { base: 1, rough: 0.9 });
  b.mat('cord', ['#5B4632']);
  b.mat('gold', ['#F2D271', '#D4A62A', '#B88A20', '#9C7518'], { base: 1, rough: 0.3, metal: 0.85, shadeK: 0.9 });
  b.mat('ink', ['#1E1A16']);
}

/**
 * Narrow, cocky eyes under thin brows; the red marks run out from the outer corner of each eye; a wide grin
 * with the teeth showing. Rows chin+9 → chin.
 */
const FACE = [
  '. . . . . . . . . .',
  '. b b b . . b b b .',
  '. . . . . . . . . .',
  'R L L L . . L L L R',
  '. . W I . . I W . .',
  '. . . i . . i . . .',
  '. . . . . s . . . .',
  '. . . . . . . . . .',
  '. . m T T T T m . .',
  '. . . m m m m . . .',
];
/** 龍 — the dragon on the shoulder plate (pixel impression, 6 × 7) */
const RYU = [
  '. x . x x x',
  'x x x . x .',
  '. x . x x x',
  'x x x x . x',
  'x . x x x x',
  'x x x . x .',
  'x . x . x x',
];

let assetCache: CharacterAsset | null = null;
const propCache = new Map<string, VoxelModel>();

export function ikkakuAsset(): CharacterAsset {
  if (!assetCache) assetCache = buildIkkaku();
  return assetCache;
}

export type IkkakuProp = 'katana' | 'sheath' | 'spear' | 'staff' | 'head' | 'spade' | 'guandao' | 'center' | 'crest';

/** one slice of the dragon crest (0 = the tail end … CREST_SLICES − 1 = the head), laid over the centre blade */
export function ikkakuCrestSlice(i: number): VoxelModel {
  const key = `crest${i}`;
  let m = propCache.get(key);
  if (!m) {
    m = buildCenter(true, i);
    propCache.set(key, m);
  }
  return m;
}

export function ikkakuProp(kind: IkkakuProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'katana' ? buildKatana() : kind === 'sheath' ? buildSheath() : kind === 'spear' || kind === 'staff' || kind === 'head' ? buildSpear(kind)
      : kind === 'spade' ? buildSpade() : kind === 'guandao' ? buildGuandao() : buildCenter(kind === 'crest');
    propCache.set(kind, m);
  }
  return m;
}

/** the katana's blade (prop frame, m) */
export const KATANA_BASE_Z = 6 / 48;
export const KATANA_TIP_Z = 42 / 48;
/** the sheath's length (m), mouth at the origin, along −Z (held reversed) */
export const SHEATH_LEN = 38 / 48;
/** the spear (the right hand at the origin): its point, the split between the middle and head sections, the butt */
export const SPEAR_TIP_Z = 58 / 48;
export const SPEAR_HEAD_Z = 26 / 48;
export const SPEAR_BUTT_Z = -38 / 48;
/** the head section alone (as a flung segment): the chain ties on at its butt (0), the point at +Z */
export const HEAD_LEN = 32 / 48;
/** Bankai: the spade's and the guandao's heads (prop frame, m, the hand at the origin) and the pommel ends */
export const SPADE_HEAD: [number, number] = [52 / 48, 76 / 48];
export const GUANDAO_HEAD: [number, number] = [44 / 48, 84 / 48];
export const POLE_POMMEL_Z = -44 / 48;
/** the centre blade (prop frame, m): its handle along X at the origin, the edge down (−Y); half-width */
export const CENTER_HALF_W = 40 / 48;
/** its chain rings (±x, y), the handle's height, the spine and the edge's lowest point (y) */
export const CENTER_RING: [number, number] = [41.5 / 48, -4 / 48];
export const CENTER_HANDLE_Y = 2.6 / 48;
export const CENTER_EDGE_Y = -27 / 48;
export const CENTER_MID_Y = -15 / 48;
/** the outer weapons' chain ring, behind the pommel weight (prop +Z, m) */
export const POLE_RING_Z = -45.6 / 48;
/** the crest is cut in this many slices along the blade, so it can fill with red bit by bit (tail → head) */
export const CREST_SLICES = 8;

export function buildIkkaku(): CharacterAsset {
  const b = new ModelBuilder('ikkaku', IKKAKU_RES);
  palette(b);
  const s = SPEC;
  const L = humanoidSkeleton(b, s, { sleeves: true, hakama: true });
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 5, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5, wz + 1]);
  b.socket('chest.front', 'chest', [0, 61, 7]);
  b.socket('back', 'chest', [0, 58, -9]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('mouth', 'head', [0, s.chinY + 1.5, hd.front + 0.5]);
  scalp(b, L, hd);
  b.stamp('head', hd.x0, hd.chin + 9, FACE, { ...faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth', teeth: 'teeth' }), b: { mat: 'brow' }, R: { mat: 'mark' } }, hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  // the marks carry on round the sides of the face, flicking up toward the temples
  for (const k of [-1, 1]) {
    const x = k > 0 ? -hd.x0 - 1 : hd.x0;
    for (const [dy, dz] of [[0, -2], [1, -3]] as [number, number][]) {
      const y = hd.chin + 6 + dy, z = hd.front - 1 + dz;
      if (b.grid('head').get(x, y, z) !== 0) b.voxel('head', x, y, z, 'mark');
    }
  }
  hands(b, L, 'skin');
  feet(b, L, 'skin', 'straw', 'cord');
  const o = { black: 'black', collar: 'collar', skin: 'skin', obi: 'obi' };
  kosodeTorso(b, L, o);
  kosodeSleeves(b, L, o);
  obi(b, L, o);
  hakama(b, L, o);
  // the scar down the left of his chest, in the collar's opening
  b.paint('chest', capsule([2.6, s.chinY - 4, 6], [0.4, s.chestY + 2.5, 7], 0.45), 'scar', { where: b.isMat('skin') });
  pauldron(b, L);
  b.autoShade();
  b.lint();
  const base = shihakushoSprings();
  return { model: b.build(), springs: base.springs, colliders: base.colliders, warnings: b.warnings };
}

/** The bald crown: the top of the head in the glossy scalp ramp, a highlight just off its top. */
function scalp(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }): void {
  const s = L.spec;
  const c = hd.chin;
  // a smooth dome over the cranium (no hair), the brow ridge left as skin
  b.add('head', intersect(ellipsoid([0, c + 7.8, L.headC[2] - 0.3], [s.head.w / 2 + 0.5, s.head.h / 2 + 0.6, s.head.d / 2 + 0.4]), halfSpace([0, c + 9.4, 0], [0, -1, 0.35])), 'skin', { only: 'empty' });
  b.paint('head', intersect(halfSpace([0, c + 9.6, hd.front], [0, -1, 0.3]), aabb([-12, c + 4, -14], [12, c + 20, 14])), 'scalp', { where: b.isMat('skin') });
  // the glint: a light patch up front of the crown
  b.paint('head', ellipsoid([-1.2, c + 12.6, hd.front - 3.4], [1.6, 1.0, 1.6]), 'scalp', { shade: 0, where: b.isMat('scalp') });
}

/** The gold plate over his right shoulder, stamped 龍, strapped under the arm. */
function pauldron(b: ModelBuilder, L: Landmarks): void {
  const [sx, sy, sz] = L.spec.shoulder;
  const c: V3 = [-sx - 0.4, sy - 0.8, sz];
  const shell = intersect(subtract(ellipsoid(c, [4.8, 4.2, 4.6]), ellipsoid(c, [3.6, 3.0, 3.4])), halfSpace([0, sy - 4.2, 0], [0, -1, 0]), halfSpace([-sx + 1.6, 0, 0], [1, 0, 0]));
  b.add('upperarm.R', shell, 'gold');
  // a rolled rim along its edge
  b.paint('upperarm.R', intersect(shell, aabb([-30, sy - 4.2, -30], [30, sy - 3.0, 30])), 'gold', { shade: 2 });
  // the dragon kanji on the outer face (proud by one voxel)
  const x0 = c[0] - 4.8, yTop = sy + 2.4;
  RYU.forEach((row, r) => row.split(' ').forEach((ch, k) => {
    if (ch !== 'x') return;
    const y = yTop - r, z = Math.round(sz - 2.5 + k);
    for (let x = Math.floor(x0) - 1; x < Math.floor(x0) + 3; x++) if (b.grid('upperarm.R').get(x, y, z) !== 0) {
      b.voxel('upperarm.R', x, y, z, 'ink');
      break;
    }
  }));
}

// ---------------------------------------------------------------------------------------------- weapons

/** Hōzukimaru sealed: a plain katana; oval guard with three teardrops above and below; a deep-blue wrap. */
function buildKatana(): VoxelModel {
  const b = new ModelBuilder('hozukimaru', 48);
  b.mat('steel', ['#E7EAEE', '#CFD3D8', '#AEB3BA', '#8E949C'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#F3F3F0'], { rough: 0.12, metal: 0.8 });
  b.mat('brass', ['#D2AE5E', '#B58A3A', '#946C28', '#73521C'], { base: 1, rough: 0.35, metal: 0.8 });
  b.mat('wrap', ['#3A4C6E', '#2B3A55', '#202B40'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#E6E0D2']);
  b.mat('iron', ['#9C9EA2', '#8D8F92', '#6E7074'], { base: 1, rough: 0.4, metal: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  const z0 = 6, zTip = 42, zEnd = zTip - 3.2;
  const curve = (z: number) => ((z - z0) / (zTip - z0)) ** 2 * 1.2;
  b.add('root', fn((x, y, z) => {
    if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
    const c = curve(z);
    const top = 0.9 + c, bot = -1.1 + c + Math.max(0, z - zEnd) * 0.6;
    return Math.max(Math.abs(x) - 0.5, y - top, bot - y, z0 - z, z - zTip);
  }, [-2, -3, z0 - 1], [2, 5, zTip + 1]), 'steel', { thr: 0.3 });
  b.paint('root', fn((_x, y, z) => y - (-0.62 + curve(z) + Math.max(0, z - zEnd) * 0.6), [-2, -3, 0], [2, 5, zTip + 1]), 'edge');
  b.add('root', box([0, -0.05, 5.6], [0.85, 1.3, 0.5]), 'brass');
  // the oval guard with its teardrops
  const tz = 4.7;
  b.add('root', cylinder([0, 0, tz - 0.5], [0, 0, tz + 0.5], 1, 1, 0), 'brass');
  b.add('root', intersect(ellipsoid([0, 0, tz], [2.4, 3.2, 0.6]), aabb([-4, -4, tz - 0.6], [4, 4, tz + 0.6])), 'brass');
  for (const k of [-1, 1]) for (const x of [-1, 0, 1]) b.paint('root', sphere([x * 1.0, k * 2.2, tz + 0.6], 0.55), 'brass', { shade: 3, where: b.isMat('brass') });
  b.add('root', box([0, 0, -0.9], [1.1, 1.25, 5.2], { round: 0.5 }), 'wrap');
  b.paint('root', fn((_x, y, z) => Math.abs(((Math.abs(y) + z) % 2.6 + 2.6) % 2.6 - 1.3) - 0.42, [-2, -2, -6], [2, 2, 4]), 'ray', { where: b.isMat('wrap') });
  // the pommel that unscrews (the styptic inside)
  b.add('root', cylinder([0, 0, -6.4], [0, 0, -7.8], 1.3, 1.1, 0.3), 'iron');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** The sheath, black lacquer, held reversed: the mouth at the origin, the body along −Z. */
function buildSheath(): VoxelModel {
  const b = new ModelBuilder('hozukimaru-saya', 48);
  b.mat('lacquer', ['#34343A', '#26262B', '#1C1C1E', '#141418'], { base: 1, rough: 0.28, shadeK: 0.8 });
  b.mat('brass', ['#D2AE5E', '#B58A3A', '#946C28'], { base: 1, rough: 0.35, metal: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  const Ls = 38;
  b.add('root', fn((x, y, z) => {
    if (z > 0.5 || z < -Ls - 0.5) return 1;
    const u = -z / Ls;
    const c = u * u * 1.2;
    return Math.max(Math.abs(x) - 0.95, Math.abs(y - c) - 1.5, z - 0, -Ls - z);
  }, [-2, -3, -Ls - 1], [2, 4, 1]), 'lacquer', { thr: 0.2 });
  b.add('root', box([0, 0, -0.6], [1.15, 1.7, 0.7], { round: 0.3 }), 'brass');
  b.add('root', box([0, 1.2, -Ls + 0.6], [1.1, 1.7, 0.8], { round: 0.5 }), 'brass');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * The Shikai: a wax-wood spear, the right hand at the origin. Butt section −38…−6 with the red tassel past it,
 * the middle section −6…26, the head section 26…58 (its single-edged blade from 42). 'staff' leaves the head
 * off; 'head' is the head section alone, re-based so its butt is the origin.
 */
function buildSpear(kind: 'spear' | 'staff' | 'head'): VoxelModel {
  const b = new ModelBuilder(`hozukimaru-${kind}`, 48);
  b.mat('wood', ['#DDBB80', '#C9A46A', '#B48E57', '#A9844C', '#8A6A3A'], { base: 1, rough: 0.7, shadeK: 0.8 });
  b.mat('iron', ['#6E7278', '#4A4D52', '#36393D'], { base: 1, rough: 0.4, metal: 0.8 });
  b.mat('steel', ['#E7EAEE', '#CFD3D8', '#AEB3BA', '#8E949C'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#F3F3F0'], { rough: 0.12, metal: 0.8 });
  b.mat('tassel', ['#E0343C', '#C41E2A', '#9E1620', '#7A1018'], { base: 1, rough: 0.9, shadeK: 0.9, dither: 0.08 });
  b.bone('root', null, [0, 0, 0]);
  const dz = kind === 'head' ? -26 : 0;
  const zA = kind === 'head' ? 26 : -38, zB = kind === 'staff' ? 26 : 42;
  // the shaft, a little thicker at the butt
  b.add('root', cylinder([0, 0, zA + dz], [0, 0, zB + dz], 1.15, 1.0, 0.3), 'wood');
  b.paint('root', fn((x, y, z) => Math.abs(Math.sin((z + 40) * 0.7 + Math.atan2(y, x) * 2)) - 0.18, [-2, -2, zA + dz], [2, 2, zB + dz]), 'wood', { shade: 3, where: b.isMat('wood') });
  // the iron ferrules at the section joints and the ends
  for (const z of [-38, -6, 26]) if (z >= zA - 1 && z <= zB + 1) b.add('root', cylinder([0, 0, z + dz - 1.2], [0, 0, z + dz + 1.2], 1.45, 1.45, 0.3), 'iron');
  if (kind !== 'staff') {
    // the head: a socket and a long single-edged blade, the edge down (−Y)
    b.add('root', cylinder([0, 0, 40 + dz], [0, 0, 43 + dz], 1.4, 1.2, 0.3), 'iron');
    b.add('root', fn((x, y, z) => {
      const zz = z - dz;
      if (zz < 42 || zz > 58.5) return 1;
      const u = (zz - 42) / 16.5;
      const top = 0.9 - u * 0.4, bot = -1.6 + u * 1.9 + Math.max(0, u - 0.75) * 3;
      return Math.max(Math.abs(x) - 0.5 + u * 0.2, y - top, bot - y);
    }, [-2, -3, 41 + dz], [2, 3, 59 + dz]), 'steel', { thr: 0.25 });
    b.paint('root', fn((_x, y, z) => y + 0.6 - (z - dz - 42) * 0.08, [-2, -3, 42 + dz], [2, 3, 59 + dz]), 'edge', { where: b.isMat('steel') });
  }
  if (kind !== 'head') {
    // the red horsehair tassel off the butt
    const tz = -38;
    b.add('root', sphere([0, 0, tz - 1.6], 1.6), 'tassel');
    const strands = smoothPath([[0, 0, tz - 2.4], [0, -1.5, tz - 5], [0, -4.5, tz - 7], [0, -8, tz - 8]], 3);
    b.add('root', tube(strands, strands.map((_, i) => 1.9 + i * 0.12)), 'tassel', { thr: 0.2 });
    b.paint('root', fn((x, y) => Math.abs(((x * 2.1 + y * 0.4 + 40) % 1.6) - 0.8) - 0.22, [-4, -12, tz - 12], [4, 2, tz]), 'tassel', { shade: 3, where: b.isMat('tassel') });
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** Ryūmon Hōzukimaru's monk's spade: a long shaft, a crescent head (the moon's horns forward), red tassel, pommel weight. */
function buildSpade(): VoxelModel {
  const b = poleBase('ryumon-spade');
  const z0 = 52, z1 = 76;
  // the crescent: a disc with a smaller disc taken out of its far side, flat (2 thick), the horns pointing ahead
  const blade = subtract(cylinder([-0.9, 0, (z0 + z1) / 2], [0.9, 0, (z0 + z1) / 2], 13), cylinder([-2, 0, z1 + 4], [2, 0, z1 + 4], 11.5));
  b.add('root', intersect(blade, aabb([-2, -14, z0 - 1], [2, 14, z1 + 6])), 'steel', { thr: 0.2 });
  b.paint('root', fn((_x, y, z) => {
    const r = Math.hypot(y, z - (z1 + 4));
    return r - 12.8;
  }, [-2, -14, z0], [2, 14, z1 + 6]), 'edge', { where: b.isMat('steel') });
  // the flats darker toward the shaft, a ridge down the middle
  b.paint('root', box([0, 0, z0 + 4], [1, 1.1, 6]), 'steel', { shade: 3, where: b.isMat('steel') });
  b.add('root', cylinder([0, 0, z0 - 4], [0, 0, z0 + 2], 2.1, 1.6, 0.4), 'iron');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** Ryūmon Hōzukimaru's guandao: a long shaft and a broad curved blade with a notch on its back. */
function buildGuandao(): VoxelModel {
  const b = poleBase('ryumon-guandao');
  const z0 = 44, z1 = 84;
  b.add('root', fn((x, y, z) => {
    if (z < z0 || z > z1 + 0.5) return 1;
    const u = (z - z0) / (z1 - z0);
    // the back runs straight, the edge bellies out and sweeps up to the point
    const back = 1.6 + u * 1.4 - Math.max(0, u - 0.8) * 9;
    const edge = -1.4 - Math.sin(u * Math.PI * 0.95) * 7.5 + Math.max(0, u - 0.85) * 26;
    // the notch on the back, a third of the way up
    const notch = Math.abs(u - 0.35) < 0.06 ? 1.6 : 0;
    return Math.max(Math.abs(x) - 0.75 + u * 0.2, y - (back - notch), edge - y);
  }, [-2, -10, z0 - 1], [2, 5, z1 + 1]), 'steel', { thr: 0.2 });
  b.paint('root', fn((_x, y, z) => {
    const u = (z - z0) / (z1 - z0);
    const edge = -1.4 - Math.sin(u * Math.PI * 0.95) * 7.5 + Math.max(0, u - 0.85) * 26;
    return y - edge - 1.2;
  }, [-2, -10, z0], [2, 5, z1 + 1]), 'edge', { where: b.isMat('steel') });
  // a dragon's mouth at the blade's root (the collar)
  b.add('root', cylinder([0, 0, z0 - 5], [0, 0, z0 + 1], 2.2, 1.6, 0.4), 'iron');
  b.paint('root', fn((x, y, z) => Math.abs(z - (z0 - 2)) - 0.5, [-3, -3, z0 - 6], [3, 3, z0 + 2]), 'iron', { shade: 2, where: b.isMat('iron') });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** the shared shaft: wrapped grip at the hand, red tassel below the head, the long iron pommel weight with its chain ring */
function poleBase(name: string): ModelBuilder {
  const b = new ModelBuilder(name, 48);
  b.mat('steel', ['#E2E6EA', '#BFC5CC', '#9AA1A9', '#7D848C'], { base: 1, rough: 0.22, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#E8ECEF'], { rough: 0.12, metal: 0.8 });
  b.mat('iron', ['#5A5E64', '#3F4247', '#2E3034'], { base: 1, rough: 0.4, metal: 0.8 });
  b.mat('wrap', ['#3A3A40', '#2E2E33', '#232327'], { base: 1, rough: 0.85 });
  b.mat('shaft', ['#4E4440', '#3E3532', '#2F2826'], { base: 1, rough: 0.6 });
  b.mat('tassel', ['#E0343C', '#C41E2A', '#9E1620', '#7A1018'], { base: 1, rough: 0.9, shadeK: 0.9, dither: 0.08 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', cylinder([0, 0, -36], [0, 0, 48], 1.25, 1.15, 0.3), 'shaft');
  b.add('root', cylinder([0, 0, -8], [0, 0, 10], 1.4, 1.4, 0.3), 'wrap');
  b.paint('root', fn((_x, _y, z) => Math.abs(((z + 40) % 2.4) - 1.2) - 0.4, [-2, -2, -8], [2, 2, 10]), 'wrap', { shade: 2, where: b.isMat('wrap') });
  // the pommel weight: a long iron cylinder, a ring for the chain
  b.add('root', cylinder([0, 0, -36], [0, 0, -44], 2.0, 2.0, 0.5), 'iron');
  b.add('root', torus([0, 0, -45.6], 1.3, 0.55, [90, 0, 0]), 'iron', { thr: 0.2 });
  // the tassel hanging off the hilt, under the head
  const t: V3 = [0, -1.5, 40];
  b.add('root', sphere(t, 1.6), 'tassel');
  const strands = smoothPath([[0, -2.4, 40], [0, -6, 39], [0, -10, 37], [0, -13, 35]], 3);
  b.add('root', tube(strands, strands.map((_, i) => 1.8 + i * 0.12)), 'tassel', { thr: 0.2 });
  b.paint('root', fn((x, y, z) => Math.abs(((x * 2.1 + z * 0.4 + 40) % 1.6) - 0.8) - 0.22, [-4, -16, 30], [4, -2, 42]), 'tassel', { shade: 3, where: b.isMat('tassel') });
  return b;
}

/**
 * The centre blade: a broad axe-like slab, its handle forged along its spine (the origin, along X), the edge
 * down; the dragon crest engraved on its face (+Z). 'crest' builds the engraving alone, proud of the face, so
 * it can be lit separately as the crest fills.
 */
function buildCenter(crestOnly: boolean, slice = -1): VoxelModel {
  const b = new ModelBuilder(crestOnly ? (slice >= 0 ? `ryumon-crest-${slice}` : 'ryumon-crest') : 'ryumon-center', 48);
  b.mat('steel', ['#E2E6EA', '#BFC5CC', '#9AA1A9', '#7D848C'], { base: 1, rough: 0.22, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#E8ECEF'], { rough: 0.12, metal: 0.8 });
  b.mat('iron', ['#5A5E64', '#3F4247', '#2E3034'], { base: 1, rough: 0.4, metal: 0.8 });
  b.mat('wrap', ['#3A3A40', '#2E2E33', '#232327'], { base: 1, rough: 0.85 });
  b.mat('crest', ['#7A7F86', '#5E636A', '#4A4E54'], { base: 1, rough: 0.5, metal: 0.6 });
  b.bone('root', null, [0, 0, 0]);
  const W = 40, H0 = -3, H1 = -27;
  // the dragon, in profile along the blade, its head at the left end (−x) and its tail at the right
  const seg = (px: number, py: number, ax: number, ay: number, bx: number, by: number, r: number) => {
    const dx = bx - ax, dy = by - ay;
    const h = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(px - ax - dx * h, py - ay - dy * h) - r;
  };
  const body = (x: number) => -14 + Math.sin((x + 24) * 0.13) * 3.6;
  const crest = (x: number, y: number) => {
    if (x < -37 || x > 37 || y < -24.5 || y > -5) return 1;
    let d = 1;
    // the coiling body, thick at the neck and thin toward the tail
    if (x >= -26 && x <= 30) d = Math.abs(y - body(x)) - (2.4 - ((x + 26) / 56) * 1.4);
    // spines along its back
    for (let sx = -20; sx <= 24; sx += 5) {
      const top = body(sx) + 2.2 - ((sx + 26) / 56) * 1.2;
      d = Math.min(d, seg(x, y, sx - 1, top - 0.4, sx + 1.3, top + 1.9, 0.55));
    }
    // the head: a skull, the upper jaw thrust forward, the lower jaw dropped open, an eye (left bare)
    d = Math.min(d, Math.hypot((x + 27.5) / 4.2, (y + 11.6) / 3.2) - 1);
    d = Math.min(d, seg(x, y, -30, -10.6, -36, -11.2, 1.45));
    d = Math.min(d, seg(x, y, -29.5, -16.2, -35, -18.6, 0.95));
    // the open mouth between the jaws, a fang at its corner
    if (seg(x, y, -30.5, -13.6, -37, -14.6, 0.75) < 0 && seg(x, y, -33, -12.2, -33.4, -14.4, 0.45) > 0) return 1;
    // horns swept back over the neck, a whisker streaming under the jaw
    d = Math.min(d, seg(x, y, -26, -9.5, -19.5, -6.2, 0.85));
    d = Math.min(d, seg(x, y, -27.5, -9.8, -23.5, -5.8, 0.75));
    d = Math.min(d, seg(x, y, -34.5, -13, -31, -19.5, 0.55), seg(x, y, -31, -19.5, -24, -21.5, 0.55));
    if (Math.hypot(x + 27, y + 10.8) < 1.15) return 1;
    // two legs, each a thigh down to a three-clawed foot
    for (const lx of [-12, 24]) {
      const ly = body(lx), fx = lx - 2, fy = ly - 5;
      d = Math.min(d, seg(x, y, lx, ly, fx, fy, 1.1));
      d = Math.min(d, seg(x, y, fx, fy, fx - 3, fy - 1.6, 0.5), seg(x, y, fx, fy, fx - 1.6, fy - 2.6, 0.5), seg(x, y, fx, fy, fx + 0.6, fy - 2.4, 0.5));
    }
    // the tail ends in a tuft of flame
    const ty = body(30);
    d = Math.min(d, seg(x, y, 29, ty, 35.5, ty + 3, 0.6), seg(x, y, 29, ty, 36.5, ty, 0.6), seg(x, y, 29, ty, 35.5, ty - 3, 0.6));
    return d;
  };
  if (crestOnly) {
    // a slice: from the tail (+x) toward the head (−x)
    const w = 74 / CREST_SLICES, x1 = 37 - slice * w, x0 = x1 - w;
    const inSlice = (x: number) => slice < 0 || (x >= x0 && x < x1);
    b.add('root', fn((x, y, z) => (z < 1.2 || z > 2.2 || !inSlice(x) ? 1 : crest(x, y)), [-38, H1, 0], [38, H0, 3]), 'crest', { thr: 0.1 });
    b.lint(1);
    return b.build();
  }
  // the slab: flat, broad, the edge a gentle curve
  b.add('root', fn((x, y, z) => {
    const u = x / W;
    const bottom = H1 + Math.abs(u) ** 2 * 6;
    return Math.max(Math.abs(z) - 1.0, Math.abs(x) - W, y - H0, bottom - y);
  }, [-W - 1, H1 - 1, -2], [W + 1, H0 + 1, 2]), 'steel', { thr: 0.2 });
  b.paint('root', fn((x, y) => y - (H1 + Math.abs(x / W) ** 2 * 6) - 1.6, [-W - 1, H1 - 1, -2], [W + 1, H0 + 1, 2]), 'edge', { where: b.isMat('steel') });
  // the engraving, cut a voxel into the face (it fills with red light: the 'crest' prop)
  b.paint('root', fn((x, y, z) => (z < 0.2 ? 1 : crest(x, y)), [-38, H1, 0], [38, H0, 2]), 'crest', { where: b.isMat('steel') });
  // the spine and the handle forged along it, with two rings for the chains at its ends
  b.add('root', box([0, H0 - 0.6, 0], [W - 2, 1.4, 1.5], { round: 0.6 }), 'iron');
  b.add('root', cylinder([-W + 6, 2.6, 0], [W - 6, 2.6, 0], 1.3, 1.3, 0.3), 'wrap');
  for (const k of [-1, 1]) {
    b.add('root', box([k * (W - 7), 0.6, 0], [1.0, 2.6, 1.0]), 'iron');
    b.add('root', torus([k * (W + 1.5), H0 - 1, 0], 1.5, 0.6, [90, 0, 0]), 'iron', { thr: 0.2 });
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}
