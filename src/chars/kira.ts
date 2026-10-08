// Izuru Kira — Lieutenant of the 3rd Division (docs/roster/C1-lieutenants-1.md §Izuru Kira). Brief: 173 cm, the
// standard body at 48.6 vox/m (84 vox); slender and narrow-shouldered with a slight slouch, a melancholy face with
// shadows under the eyes. Silhouette keys: pale-blond hair combed into three points — two at the back of the neck,
// one long bang sweeping across and hiding his left eye; the square-hooked Shikai blade. The standard shihakushō
// with its wide sleeves, the lieutenant's badge (三 and a marigold) tied on the left upper arm, Wabisuke's black
// sheath at the left hip.
// Props: sealed Wabisuke (a plain katana, a rectangular guard with an Ω in its top and bottom halves, a navy wrap
// over white rayskin) and its sheath; the Shikai (the blade gone straight, its end turned 90° twice into a square
// hook with the edge on the inside).
// (verify) the hilt wrap and the sheath colours, the guard's motif colour, the hook's size (about 15 cm).
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, box, capsule, cylinder, fn, prism, spike, sphere, subtract } from '../models/sdf';
import { SPEC_ADULT_MALE, faceLegend, feet, hakama, hands, head, humanoidSkeleton, kosodeSleeves, kosodeTorso, obi, shihakushoSprings, type HumanoidSpec, type Landmarks } from './humanoid';
import type { CharacterAsset } from './ichigo';

/** 84 voxels = 1.73 m */
export const KIRA_RES = 84 / 1.73;

/** Slender, narrow in the shoulder and the chest. */
const SPEC: HumanoidSpec = {
  ...SPEC_ADULT_MALE,
  shoulder: [9.0, 66.3, -0.5],
  upperArm: 14.4,
  foreArm: 13,
  armR: 2.35,
  neckR: 2.4,
  chest: [7.8, 4.6],
  waist: [6.3, 4.0],
  hips: [6.9, 4.4],
};

function palette(b: ModelBuilder): void {
  b.mat('skin', ['#F6E0CB', '#F0D3BA', '#E2C1A6', '#D4B29A', '#B8957E'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#F3E7B6', '#EED98E', '#DEC77A', '#CDB66C', '#AE9655'], { base: 1, rough: 0.5, shadeK: 0.85 });
  b.mat('brow', ['#BFA45E']);
  b.mat('lid', ['#4A3A34']);
  b.mat('sclera', ['#F1F0EC']);
  b.mat('iris', ['#4C79C2']);
  b.mat('irisD', ['#2A4A80']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#9A6A5C']);
  b.mat('gloom', ['#C9A99A']);
  b.mat('black', ['#34343C', '#24242A', '#18181D', '#141418'], { base: 2, rough: 0.85, shadeK: 0.9 });
  b.mat('collar', ['#F3F3F0', '#E4E5E7', '#C9CCD1'], { base: 0, rough: 0.8 });
  b.mat('obi', ['#F3F3F0', '#E2E3E5', '#C6C9CE'], { base: 0, rough: 0.8 });
  b.mat('badge', ['#EFE6CF', '#D9CDB0', '#B9AB8C'], { base: 0, rough: 0.8 });
  b.mat('wood', ['#8B6340', '#6B4A2B', '#4E3520'], { base: 1, rough: 0.8 });
  b.mat('ink', ['#1E1A16']);
  b.mat('marigold', ['#E8A93A']);
  b.mat('tabi', ['#F3F2EE', '#DEDDDA', '#C2C1BD'], { base: 0, rough: 0.8 });
  b.mat('straw', ['#C9A86A', '#A8874F', '#86683A'], { base: 1, rough: 0.9 });
  b.mat('cord', ['#5B4632']);
}

/**
 * Rows chin+9 → chin (column 0 is his right). Brows tilted up toward the middle (worried), the lids heavy over a
 * blue iris, shadows under the eyes, a small mouth turned down at the corners. The left eye is drawn too, though
 * the bang hides it.
 */
const FACE = [
  '. . . . . . . . . .',
  '. . . B . . B . . .',
  '. B B . . . . B B .',
  '. L L L . . L L L .',
  '. W I i . . i I W .',
  '. g g g . . g g g .',
  '. . . . . s . . . .',
  '. . . . . . . . . .',
  '. . . . m m . . . .',
  '. . . . . . . . . .',
];

/** the 3rd Division: 三 on the badge (pixel impression, 3 × 3) */
const SAN = [
  'x x x',
  '. . .',
  'x x x',
];

let assetCache: CharacterAsset | null = null;
const propCache = new Map<string, VoxelModel>();

export function kiraAsset(): CharacterAsset {
  if (!assetCache) assetCache = buildKira();
  return assetCache;
}

/** 'katana' (sealed Wabisuke), 'saya' (its sheath), 'wabisuke' (the Shikai: the square hook) */
export type KiraProp = 'katana' | 'saya' | 'wabisuke';

export function kiraProp(kind: KiraProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'katana' ? buildKatana() : kind === 'saya' ? buildSaya() : buildWabisuke();
    propCache.set(kind, m);
  }
  return m;
}

/** the sealed blade (prop frame, m) */
export const KATANA_BASE_Z = 5 / 48;
export const KATANA_TIP_Z = 39 / 48;
/** the Shikai (prop frame, m): the straight blade's base and the hook's far corner (it reaches −y by HOOK_Y) */
export const WABISUKE_BASE_Z = 5 / 48;
export const WABISUKE_TOP_Z = 40 / 48;
export const WABISUKE_HOOK_Y = -9.5 / 48;

export function buildKira(): CharacterAsset {
  const b = new ModelBuilder('kira', KIRA_RES);
  palette(b);
  const s = SPEC;
  const L = humanoidSkeleton(b, s, { sleeves: true, hakama: true });
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 5, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5, wz + 1]);
  b.socket('finger.L', 'palm.L', [wx - 0.2, wy - s.hand - 0.5, wz + 1]);
  b.socket('chest.front', 'chest', [0, 61, 6]);
  b.socket('back', 'chest', [0, 58, -7]);
  // the sheath through the obi at his left hip, the mouth forward and up
  b.socket('hip.L', 'hips', [s.waist[0] + 1.6, s.waistY - 3, 2], [-20, 0, 6]);
  b.socket('foot.R', 'foot.R', [-L.ankle[0], 1, 2]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('mouth', 'head', [0, s.chinY + 1.5, hd.front + 0.5]);
  // a thin, drawn face: the jaw shaved in a little
  for (const k of [-1, 1]) b.carve('head', box([k * 5.4, hd.chin + 1.2, hd.front - 2], [0.9, 2.2, 3], { rot: [0, 0, k * 18] }));
  const legend = { ...faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), g: { mat: 'gloom' } };
  b.stamp('head', hd.x0, hd.chin + 9, FACE, legend, hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  hair(b, L, hd);
  hands(b, L, 'skin');
  feet(b, L, 'tabi', 'straw', 'cord');
  const o = { black: 'black', collar: 'collar', skin: 'skin', obi: 'obi', bag: 4 };
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
 * Straight pale-blond hair to the jaw: a smooth shell rounded over the crown, falling straight, parted on his
 * right. The face is open on his right up to a short fringe; on his left the long bang sweeps down from the
 * parting over the left eye to the jaw. At the back it ends in two points at the nape.
 */
function hair(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number; x0: number }): void {
  const s = L.spec;
  const c = hd.chin, front = hd.front;
  const cz = L.headC[2] - 0.6;
  const yTop = c + s.head.h + 2.3, yBot = c + 0.6;
  const shellField = (x: number, y: number, z: number): number => {
    const t = Math.max(0, Math.min(1, (c + 9 - y) / (c + 9 - yBot)));
    const rx = s.head.w / 2 + 1.4 + t * 0.4, rz = s.head.d / 2 + 1.3 + t * 0.3;
    const crown = y > c + 9 ? (y - (c + 9)) / (yTop - (c + 9)) : 0;
    const k = Math.sqrt(Math.max(0, 1 - crown * crown));
    const e = (Math.abs(x / (rx * k + 1e-3)) ** 3 + Math.abs((z - cz) / (rz * k + 1e-3)) ** 3) ** (1 / 3) - 1;
    return Math.max(e * Math.min(rx, rz) * 0.9, yBot - y, y - yTop);
  };
  const shell = fn(shellField, [-10, yBot - 1, cz - 10], [10, yTop + 1, cz + 10]);
  // the face opening (x, y): his right side open up to the fringe, the bang's edge running down from the parting
  // across the nose to the left jaw
  const opening = prism([[-4.8, c - 2], [-4.8, c + 8.8], [-1.8, c + 9.7], [0.1, c + 7.2], [0.8, c + 4.6], [4.9, c + 0.9], [4.9, c - 2]], [0, 0, front + 2], [1, 0, 0], [0, 1, 0], 4.6);
  b.add('head', subtract(shell, opening), 'hair', { only: 'empty', thr: 0.2 });
  // strands: shallow grooves falling straight down; the bang's grooves follow its sweep
  b.paint('head', fn((x, _y, z) => {
    const a = Math.atan2(x, z - cz);
    return Math.abs(((a * 7 + 30) % 1.4) - 0.7) - 0.16;
  }, [-10, yBot - 1, cz - 10], [10, c + 9, cz + 3]), 'hair', { shade: 3, where: b.isMat('hair') });
  b.paint('head', fn((x, y, z) => (z < front - 0.5 ? 1 : Math.abs((((x - (c + 10 - y) * 0.55) % 1.8) + 1.8) % 1.8 - 0.9) - 0.22), [0, c, front - 1], [8, c + 11, front + 4]), 'hair', { shade: 3, where: b.isMat('hair') });
  // the parting over his right temple
  b.paint('head', capsule([-1.9, c + 13.2, cz + 1], [-1.9, c + 10.6, front + 1.2], 0.45), 'hair', { shade: 4, where: b.isMat('hair') });
  // the ends a shade darker
  b.paint('head', aabb([-10, yBot - 1, cz - 10], [10, yBot + 0.6, cz + 10]), 'hair', { shade: 3, where: b.isMat('hair') });
  // the two points at the nape, flicking outward, a notch between them
  const back = L.headC[2] - s.head.d / 2;
  b.carve('head', fn((x, y, z) => (z > back + 1 ? 1 : (y - (c + 0.2)) - (2.6 - Math.abs(x) * 1.3)), [-3, c - 1, back - 4], [3, c + 3, back + 1]));
  for (const k of [-1, 1]) {
    b.add('head', spike([k * 2.6, c + 4, back - 0.9], [k * 0.62, -1, -0.26], 10, 2.6, 0.6, { side: [1, 0, 0], tip: 0.2 }), 'hair', { thr: 0.3 });
  }
  // strands over the crown, combed back from the parting
  b.paint('head', fn((x, y, z) => (y < c + 9.5 ? 1 : Math.abs(((((x + 1.9) * 0.9 + (z - front) * 0.15) % 1.7) + 1.7) % 1.7 - 0.85) - 0.2), [-10, c + 9, cz - 10], [10, yTop + 1, front + 4]), 'hair', { shade: 2, where: b.isMat('hair') });
}

/**
 * The lieutenant's badge tied round the left sleeve: a white cloth band, the wooden plaque on its outside (三 and
 * the 3rd Division's marigold), the knot.
 */
function badge(b: ModelBuilder, L: Landmarks): void {
  const [sx, sy, sz] = L.spec.shoulder;
  const yb = sy - 6.5;
  b.add('upperarm.L', cylinder([sx + 0.4, yb - 0.75, sz - 0.3], [sx + 0.4, yb + 0.75, sz - 0.3], 4.0), 'collar');
  b.add('upperarm.L', box([sx + 4.1, yb - 0.4, sz - 0.3], [0.45, 2.3, 1.7]), 'wood');
  b.add('upperarm.L', box([sx + 4.5, yb - 0.4, sz - 0.3], [0.3, 1.8, 1.3]), 'badge');
  SAN.forEach((row, r) => row.split(' ').forEach((ch, col) => {
    if (ch === 'x') b.voxel('upperarm.L', Math.round(sx + 4.9), Math.round(yb + 1 - r), Math.round(sz - 1.3 + col), 'ink');
  }));
  b.voxel('upperarm.L', Math.round(sx + 4.9), Math.round(yb - 2), Math.round(sz - 0.3), 'marigold');
  b.add('upperarm.L', sphere([sx + 3.0, yb - 0.2, sz + 3.0], 0.95), 'collar');
}

// ---------------------------------------------------------------------------------------------- props

/** Sealed Wabisuke: a plain katana; a rectangular iron guard with an Ω in its top and bottom halves; a navy wrap. */
function buildKatana(): VoxelModel {
  const b = new ModelBuilder('wabisuke-sealed', 48);
  b.mat('steel', ['#E7EAEE', '#CFD3D8', '#AEB3BA', '#8E949C'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#F3F3F0'], { rough: 0.12, metal: 0.8 });
  b.mat('guard', ['#B4B8BE', '#9A9EA4', '#7E8288', '#62666C'], { base: 1, rough: 0.35, metal: 0.85 });
  b.mat('motif', ['#4A4E55'], { rough: 0.4, metal: 0.8 });
  b.mat('wrap', ['#2C3A5C', '#1F2A44', '#161E33'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#E6E0D2']);
  b.bone('root', null, [0, 0, 0]);
  const z0 = 5, zTip = 39, zEnd = zTip - 3;
  const curve = (z: number) => Math.max(0, z - z0) ** 2 * 0.0011;
  b.add('root', fn((x, y, z) => {
    if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
    const cv = curve(z);
    const top = 0.95 + cv, bot = -1.15 + cv + Math.max(0, z - zEnd) * 0.68;
    return Math.max(Math.abs(x) - 0.5, y - top, bot - y, z0 - z, z - zTip);
  }, [-2, -3, z0 - 1], [2, 3, zTip + 1]), 'steel', { thr: 0.3 });
  b.paint('root', fn((_x, y, z) => y - (-0.65 + curve(z) + Math.max(0, z - zEnd) * 0.68), [-2, -3, 0], [2, 3, zTip + 1]), 'edge');
  b.add('root', box([0, -0.1, 4.6], [0.85, 1.3, 0.55]), 'guard');
  // the rectangular guard, longer across the blade's width (y) than its thickness (x)
  const gz = 3.8;
  b.add('root', box([0, 0, gz], [2.4, 3.6, 0.5], { round: 0.4 }), 'guard');
  // the Ω in each half, on both faces
  const OMEGA = ['. x .', 'x . x', 'x . x'];
  for (const half of [1, -1]) for (const face of [-0.6, 0.6]) {
    OMEGA.forEach((row, r) => row.split(' ').forEach((ch, col) => {
      if (ch === 'x') b.voxel('root', Math.round(face * 3) + (face > 0 ? -1 : 0), Math.round(half * (2.6 - r * 0.9) - (half < 0 ? 1 : 0)), Math.round(gz) - 1 + col - 1, 'motif');
    }));
  }
  b.add('root', box([0, 0, -1.4], [1.1, 1.25, 5.0], { round: 0.5 }), 'wrap');
  b.paint('root', fn((_x, y, z) => Math.abs(((Math.abs(y) + z) % 2.6 + 2.6) % 2.6 - 1.3) - 0.42, [-2, -2, -7], [2, 2, 3]), 'ray', { where: b.isMat('wrap') });
  b.add('root', cylinder([0, 0, -6.4], [0, 0, -7.4], 1.25, 1.05, 0.3), 'guard');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** The sheath: black lacquer, steel at the mouth and the tip; the mouth at the origin, the body along −Z. */
function buildSaya(): VoxelModel {
  const b = new ModelBuilder('wabisuke-saya', 48);
  b.mat('lacquer', ['#34343A', '#26262B', '#1C1C1E', '#141418'], { base: 1, rough: 0.28, shadeK: 0.8 });
  b.mat('fit', ['#9A9EA4', '#7E8288', '#62666C'], { base: 1, rough: 0.35, metal: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  const Ls = 36;
  b.add('root', box([0, 0, -Ls / 2], [1.0, 1.55, Ls / 2], { round: 0.6 }), 'lacquer');
  b.add('root', box([0, 0, -0.5], [1.2, 1.75, 0.6], { round: 0.3 }), 'fit');
  b.add('root', box([0, 0, -Ls + 0.6], [1.15, 1.7, 0.7], { round: 0.5 }), 'fit');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * Wabisuke released: the blade has lost its curve and runs straight; at the length where a katana would end it
 * turns 90° toward the edge, runs a hook's width, and turns 90° again back toward the hilt — three sides of a
 * square, the cutting edge on the inside of the angles. The guard and hilt stay.
 */
function buildWabisuke(): VoxelModel {
  const b = new ModelBuilder('wabisuke', 48);
  b.mat('steel', ['#E4E8EC', '#C9CED4', '#AEB4BB', '#8F959D'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#EEF1F4'], { rough: 0.12, metal: 0.8 });
  b.mat('guard', ['#B4B8BE', '#9A9EA4', '#7E8288', '#62666C'], { base: 1, rough: 0.35, metal: 0.85 });
  b.mat('motif', ['#4A4E55'], { rough: 0.4, metal: 0.8 });
  b.mat('wrap', ['#2C3A5C', '#1F2A44', '#161E33'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#E6E0D2']);
  b.bone('root', null, [0, 0, 0]);
  const z0 = 5, zTop = 40, w = 2.1, hookY = -9.5, tipZ = zTop - 8;
  // the straight blade: spine on +y, edge on −y
  const blade = box([0, 0, (z0 + zTop) / 2], [0.5, w / 2 + 0.05, (zTop - z0) / 2]);
  // the bar across the top, toward the edge side, and the drop back down toward the hilt
  const bar = box([0, (hookY + w / 2) / 2, zTop - w / 2], [0.5, (w / 2 - hookY) / 2, w / 2]);
  const drop = box([0, hookY + w / 2, (tipZ + zTop) / 2], [0.5, w / 2, (zTop - tipZ) / 2]);
  b.add('root', blade, 'steel', { thr: 0.3 });
  b.add('root', bar, 'steel', { thr: 0.3 });
  b.add('root', drop, 'steel', { thr: 0.3 });
  // the drop's end slanted: the inner side (facing the blade) shorter than the outer
  b.carve('root', fn((_x, y, z) => (z - tipZ) - (y - hookY) * 0.8, [-2, hookY - 0.5, tipZ - 1], [2, hookY + w + 0.5, tipZ + 2.5]));
  // the edges on the inside of the square: the blade's −y face, the bar's underside, the drop's +y face
  b.paint('root', box([0, -w / 2 + 0.35, (z0 + 6 + zTop - w) / 2], [0.6, 0.45, (zTop - w - z0 - 6) / 2]), 'edge', { where: b.isMat('steel') });
  b.paint('root', box([0, (hookY + w / 2 - w / 2) / 2, zTop - w + 0.35], [0.6, (-hookY) / 2 - 0.4, 0.45]), 'edge', { where: b.isMat('steel') });
  b.paint('root', box([0, hookY + w - 0.35, (tipZ + zTop - w) / 2], [0.6, 0.45, (zTop - w - tipZ) / 2]), 'edge', { where: b.isMat('steel') });
  // the same guard and hilt as sealed
  b.add('root', box([0, -0.1, 4.6], [0.85, 1.3, 0.55]), 'guard');
  const gz = 3.8;
  b.add('root', box([0, 0, gz], [2.4, 3.6, 0.5], { round: 0.4 }), 'guard');
  const OMEGA = ['. x .', 'x . x', 'x . x'];
  for (const half of [1, -1]) for (const face of [-0.6, 0.6]) {
    OMEGA.forEach((row, r) => row.split(' ').forEach((ch, col) => {
      if (ch === 'x') b.voxel('root', Math.round(face * 3) + (face > 0 ? -1 : 0), Math.round(half * (2.6 - r * 0.9) - (half < 0 ? 1 : 0)), Math.round(gz) - 1 + col - 1, 'motif');
    }));
  }
  b.add('root', box([0, 0, -1.4], [1.1, 1.25, 5.0], { round: 0.5 }), 'wrap');
  b.paint('root', fn((_x, y, z) => Math.abs(((Math.abs(y) + z) % 2.6 + 2.6) % 2.6 - 1.3) - 0.42, [-2, -2, -7], [2, 2, 3]), 'ray', { where: b.isMat('wrap') });
  b.add('root', cylinder([0, 0, -6.4], [0, 0, -7.4], 1.25, 1.05, 0.3), 'guard');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}
