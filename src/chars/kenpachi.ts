// Kenpachi Zaraki — Captain of the 11th Division. Construction and palette from
// docs/roster/B3-captains-3.md (Kenpachi), Soul Society arc look: stiff "sea-urchin" spikes each tipped
// with a brass bell, the long scar through the left eye, hairless brow ridges and a fanged grin, a black
// choker, the black shihakushō with a white bandage band round the midsection, and a ragged
// short-sleeved haori with 十一 on the back. The eyepatch (black, gold trim, a chain strap) is a prop
// on the face, because he tears it off. Nozarashi sealed: a chipped nodachi with a long serrated
// guard and a bandaged hilt; Shikai: the giant war-cleaver; Bankai: crimson skin, horns and black
// markings, and a jagged broken cleaver. 2.02 m: the standard body at 41.6 vox/m with longer arms.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, prism, sphere, spike, subtract, torus, tube, type Sdf, type V3 } from '../models/sdf';
import {
  SPEC_ADULT_MALE, coatSkirt, feet, hakama, hands, head, humanoidSkeleton, kosodeSleeves, kosodeTorso, shihakushoSprings, spikeHair, spikeTip,
  type HumanoidSpec, type Landmarks, type Spike,
} from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';
import { Rng } from '../core/rng';

export const KENPACHI_RES = (48 * 84) / 97;
export type KenpachiForm = 'sealed' | 'bankai';

/** Tall and rangy: broad shoulders, long arms and big hands, a thick neck. */
const SPEC: HumanoidSpec = {
  ...SPEC_ADULT_MALE,
  shoulder: [10.4, 66.5, -0.5],
  upperArm: 14.8,
  foreArm: 13.4,
  hand: 9.2,
  armR: 2.8,
  neckR: 3.0,
  chest: [9.2, 5.4],
  waist: [7.0, 4.6],
  hips: [7.4, 4.9],
};

function palette(b: ModelBuilder, form: KenpachiForm): void {
  const bankai = form === 'bankai';
  b.mat('skin', bankai ? ['#E2584B', '#CB3B30', '#B3231D', '#97201A', '#7E1712', '#5E0F0C'] : ['#E8BC97', '#DAAA82', '#C8966E', '#B5835C', '#A47250', '#82573A'], { base: 2, rough: 0.6, shadeK: 0.9 });
  b.mat('scar', bankai ? ['#4A0C0A'] : ['#B87A6A', '#9E5F52'], { base: bankai ? 0 : 1, rough: 0.55 });
  b.mat('hair', ['#454F63', '#2B3140', '#22262F', '#1A1C22', '#16171B', '#141418'], { base: 3, rough: 0.45, shadeK: 0.85, dither: 0.06 });
  b.mat('lid', ['#3A2219']);
  b.mat('sclera', bankai ? ['#1A1010'] : ['#EEEAE2']);
  b.mat('iris', bankai ? ['#FFD45A'] : ['#7D838B'], bankai ? { glow: 0.9 } : {});
  b.mat('mouth', ['#3C1716']);
  b.mat('teeth', ['#F3EFE6', '#DCD6CA'], { base: 0, rough: 0.35 });
  b.mat('mark', ['#141418'], { rough: 0.7 });
  b.mat('horn', ['#6A5656', '#4A3A3A', '#2E2424', '#1C1616'], { base: 1, rough: 0.35, shadeK: 0.8 });
  b.mat('hornTip', ['#E6D8C2', '#C9B49A', '#9C8670', '#6E5C4C'], { base: 1, rough: 0.3, shadeK: 0.8 });
  b.mat('black', ['#3B3B42', '#2B2B31', '#1E1E23', '#17171B', '#141418'], { base: 2, rough: 0.88, shadeK: 1, dither: 0.04 });
  b.mat('collar', ['#F1F0EC', '#E3E2DE', '#C6C5C1'], { base: 0, rough: 0.85 });
  b.mat('band', ['#F2EEE3', '#E7E1D2', '#D6CEBB', '#BDB39E'], { base: 1, rough: 0.92, shadeK: 0.9 });
  b.mat('haori', ['#F3F3F0', '#ECECE8', '#DCDCD8', '#C3C5C9', '#A4A8AF'], { base: 1, rough: 0.82, shadeK: 0.9 });
  b.mat('haoriIn', ['#D6D2DE', '#BDB7C8', '#A29BAF'], { base: 1, rough: 0.85 });
  b.mat('kanji', ['#141418'], { rough: 0.9 });
  b.mat('choker', ['#2E2E33', '#1C1C20', '#141418'], { base: 1, rough: 0.45 });
  b.mat('bell', ['#FFE07A', '#E8B830', '#C08A1C', '#8A5E12'], { base: 1, rough: 0.28, metal: 0.3, shadeK: 0.75 });
  b.mat('tabi', ['#F3F2EE', '#E4E2DD', '#C9C6BF'], { base: 0, rough: 0.85 });
  b.mat('straw', ['#CDB683', '#B59C6A', '#8A6A3E'], { base: 1, rough: 0.95 });
  b.mat('cord', ['#5B4632']);
}

/**
 * Rows 9 → 0 (chin + 9 … chin; column 0 is his right). Hairless brow ridges standing proud, heavy
 * lids over small grey eyes, the scar running down through the left eye (column 7), a fanged grin
 * with the corners hauled up to the nose.
 */
const FACE = [
  '. . . . . . . c . .',
  '. . . . . . . c . .',
  '. R R R . . R K R .',
  '. l L L . . L L l .',
  '. W I W . . W I W .',
  '. . . . . . . c . .',
  '. m . . . n . c m .',
  '. . m T T T T m . .',
  '. . . T D D T . . .',
  '. . . . . . . . . .',
];
const LEGEND = {
  c: { mat: 'scar' },
  K: { mat: 'scar', proud: 1 },
  R: { mat: 'skin', shade: 1, proud: 1 },
  // the line under the hairless brow ridge is shadow, not brow: dark skin, the outer corners lighter
  L: { mat: 'lid' },
  l: { mat: 'skin', shade: 5 },
  W: { mat: 'sclera' },
  I: { mat: 'iris' },
  m: { mat: 'mouth' },
  D: { mat: 'mouth' },
  T: { mat: 'teeth' },
  n: { mat: 'skin', shade: 4 },
};

/** Bankai: black kumadori — flames off the eye corners to the temples, stripes down the cheeks. */
const BANKAI_MARKS = [
  'k . . . . . . . . k',
  'k k . . . . . . k k',
  '. . . . k k . . . .',
  'k . . . . . . . . k',
  '. . . . . . . . . .',
  'k k . . . . . . k k',
  '. k . . . . . . k .',
  '. . . . . . . . . .',
  '. . . . . . . . . .',
  '. . . . . . . . . .',
];

const sp = (az: number, el: number, len: number, r: number, flow: V3 = [0, 0, 0]): Spike => ({ az, el, len, r, flat: 0.8, flow, taper: 1.1 });

/** Sea-urchin hair: stiff conical spikes radiating all round the skull, two short ones over the brow. */
const SPIKES: Spike[] = [
  // crown
  sp(0, 82, 8, 2.6, [0, 0.4, -0.1]),
  sp(120, 72, 8.5, 2.6),
  sp(-120, 72, 8.5, 2.6),
  // upper ring
  sp(38, 52, 9, 2.6, [0, 0.25, 0]),
  sp(-38, 52, 9, 2.6, [0, 0.25, 0]),
  sp(86, 46, 9.5, 2.6),
  sp(-86, 46, 9.5, 2.6),
  sp(140, 44, 9.5, 2.6),
  sp(-140, 44, 9.5, 2.6),
  sp(180, 50, 9, 2.6),
  // middle ring: sides and back
  sp(72, 20, 9, 2.5, [0, 0.05, -0.15]),
  sp(-72, 20, 9, 2.5, [0, 0.05, -0.15]),
  sp(108, 14, 9.5, 2.5),
  sp(-108, 14, 9.5, 2.5),
  sp(146, 16, 9.5, 2.5),
  sp(-146, 16, 9.5, 2.5),
  sp(180, 18, 9, 2.5),
  // low ring: behind the ears and the nape
  sp(118, -14, 8, 2.4, [0, -0.1, 0]),
  sp(-118, -14, 8, 2.4, [0, -0.1, 0]),
  sp(156, -16, 8, 2.4),
  sp(-156, -16, 8, 2.4),
  sp(180, -30, 6.5, 2.3),
  // over the brow: two short spikes up and forward
  sp(18, 60, 6.5, 2.3, [0.05, 0.5, 0.3]),
  sp(-18, 60, 6.5, 2.3, [-0.05, 0.5, 0.3]),
];

const assetCache = new Map<KenpachiForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function kenpachiAsset(form: KenpachiForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildKenpachi(form)));
  return a;
}

export type KenpachiProp = 'nozarashi' | 'saya' | 'eyepatch' | 'cleaver' | 'bankai-blade' | 'yachiru';

/** Props: the sealed sword, its bandaged saya, the eyepatch, the Shikai cleaver, the Bankai blade. */
export function kenpachiProp(kind: KenpachiProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'nozarashi' ? buildNozarashi() : kind === 'saya' ? buildSaya() : kind === 'eyepatch' ? buildEyepatch() : kind === 'cleaver' ? buildCleaver() : kind === 'yachiru' ? buildYachiru() : buildBankaiBlade();
    propCache.set(kind, m);
  }
  return m;
}

export function buildKenpachi(form: KenpachiForm = 'sealed'): CharacterAsset {
  const bankai = form === 'bankai';
  const b = new ModelBuilder(`kenpachi-${form}`, KENPACHI_RES);
  palette(b, form);
  const s = SPEC;
  const L = humanoidSkeleton(b, s, { sleeves: true, hakama: true });
  b.socket('grip.R', 'fist.R', [-L.wrist[0] + 0.1, L.wrist[1] - 4.3, L.wrist[2] + 0.4]);
  b.socket('grip.L', 'fist.L', [L.wrist[0] - 0.1, L.wrist[1] - 4.3, L.wrist[2] + 0.4]);
  b.socket('palm.R', 'palm.R', [-L.wrist[0] + 0.6, L.wrist[1] - 5, L.wrist[2] + 1]);
  b.socket('palm.L', 'palm.L', [L.wrist[0] - 0.6, L.wrist[1] - 5, L.wrist[2] + 1]);
  b.socket('hip.L', 'hips', [9.8, 46.5, 3.6], [-24, 180, -8]);
  b.socket('back', 'chest', [0, 60, -8]);
  b.socket('chest.front', 'chest', [0, 61, 7]);
  // Yachiru's seat: on top of his left shoulder
  b.socket('rider', 'chest', [12, 69.4, -1.4]);

  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  // the eyepatch prop is built on the head's own voxel lattice: its origin sits on a lattice corner
  b.socket('patch', 'head', [0, s.chinY + 5, hd.front]);
  b.stamp('head', hd.x0, hd.chin + 9, FACE, LEGEND, hd.front - 1);
  if (bankai) b.stamp('head', hd.x0, hd.chin + 9, BANKAI_MARKS, { k: { mat: 'mark' } }, hd.front - 1);
  // a long straight nose: bridge and tip stand one voxel proud
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 2);
  b.voxel('head', 0, hd.chin + 4, hd.front, 'skin', 1);
  // a longer jaw: the chin drops one row
  b.add('head', box([0, hd.chin - 0.5, hd.front - 3], [1.9, 0.6, 2.4], { round: 0.5 }), 'skin');
  hair(b, L, hd, bankai);
  if (bankai) horns(b, hd);
  hands(b, L, 'skin', 1.25);
  feet(b, L, 'tabi', 'straw', 'cord');
  const o = { black: 'black', collar: 'collar', skin: 'skin', obi: 'band' };
  const torso = kosodeTorso(b, L, o);
  kosodeSleeves(b, L, o);
  bandage(b, L);
  hakama(b, L, o);
  choker(b, L);
  const haoriSprings = haori(b, L, torso);
  b.autoShade();
  b.lint();
  const base = shihakushoSprings();
  return {
    model: b.build(),
    springs: [...base.springs, ...haoriSprings.springs],
    colliders: [...base.colliders, ...haoriSprings.colliders],
    warnings: b.warnings,
  };
}

// ---------------------------------------------------------------------------------------------- head

function hair(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }, bankai: boolean): void {
  const s = L.spec;
  spikeHair(b, L, 'hair', SPIKES, [], { tufts: 20, tuftFlow: [0, 0.25, -0.15], hairline: s.chinY + 11, slope: 0.9 });
  // keep the eyes and the brow ridges clear
  b.carve('head', aabb([-5, hd.chin + 4, hd.front], [5, hd.chin + 9, hd.front + 8]));
  // a brass bell tied to the tip of every spike (the Bankai's are gone)
  for (const k of SPIKES) {
    const { tip, dir } = spikeTip(L, k);
    const c: V3 = [tip[0] + dir[0] * 0.4, tip[1] + dir[1] * 0.4, tip[2] + dir[2] * 0.4];
    // the spike's needle tip is thinner than a voxel: a short hair-coloured tie reaches the bell
    b.add('head', capsule([tip[0] - dir[0] * 2.6, tip[1] - dir[1] * 2.6, tip[2] - dir[2] * 2.6], bankai ? tip : c, 0.75), 'hair', { thr: 0.3, only: 'empty' });
    if (bankai) continue;
    b.add('head', sphere(c, 1.15), 'bell', { thr: 0.25 });
    // the slot of the bell: one dark voxel on the far side
    const m: V3 = [c[0] + dir[0] * 1.2, c[1] + dir[1] * 1.2, c[2] + dir[2] * 1.2];
    b.paint('head', sphere(m, 0.7), 'bell', { shade: 3, where: b.isMat('bell') });
  }
}

/** Bankai: two short thick horns out of the upper forehead, curving up and out. */
function horns(b: ModelBuilder, hd: { front: number; chin: number }): void {
  for (const k of [-1, 1]) {
    const base: V3 = [k * 2.7, hd.chin + 10.2, hd.front - 1.6];
    const dir: V3 = [k * 0.3, 1, 0.7];
    b.add('head', spike(base, dir, 9, 1.9, 1.6, { bend: [k * 0.15, 0.2, -0.45], taper: 1.05, tip: 0.35 }), 'horn', { thr: 0.25 });
    // bone-pale toward the points
    b.paint('head', sphere([base[0] + k * 2.4, base[1] + 8.2, base[2] + 2.6], 4.2), 'hornTip', { where: b.isMat('horn') });
  }
}

/** Black choker round the throat. */
function choker(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const nz = L.headC[2] - 0.5;
  b.add('neck', torus([0, s.chinY - 2.2, nz], s.neckR + 0.25, 0.85), 'choker');
}

// ---------------------------------------------------------------------------------------------- body

/** The white bandage band wound round the midsection over the kosode, its loose end hanging at the front. */
function bandage(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const y0 = s.waistY - 4.2, y1 = s.waistY + 2.6;
  const rx = s.waist[0] + 2.1, rz = s.waist[1] + 2.1;
  const band = fn((x, y, z) => {
    // slightly uneven turns: the radius wobbles with height
    const w = 1 + 0.03 * Math.sin(y * 2.1 + x * 0.3);
    const rho = Math.hypot(x / (rx * w), (z + 0.2) / (rz * w));
    return Math.max((rho - 1) * Math.min(rx, rz), y0 - y, y - y1);
  }, [-rx - 2, y0 - 1, -rz - 2], [rx + 2, y1 + 1, rz + 2]);
  b.add('spine', band, 'band');
  // the turns: slanted grooves between wraps
  b.paint('spine', fn((x, y) => Math.abs((((y + x * 0.14 + 100) % 1.75) + 1.75) % 1.75 - 0.875) - 0.2, [-rx - 2, y0 - 1, -rz - 2], [rx + 2, y1 + 1, rz + 2]), 'band', { shade: 3, where: b.isMat('band') });
  // the loose end: tucked in at the front-left, hanging over the hakama
  b.add('hips', capsule([3.4, y0 + 0.2, rz + 0.2], [3.9, y0 - 4.5, rz + 0.8], 1.0, 0.8), 'band', { thr: 0.2 });
  b.add('hips', capsule([4.6, y0 + 0.1, rz], [5.6, y0 - 3, rz + 0.4], 0.8, 0.6), 'band', { thr: 0.2 });
}

/** Short-sleeved haori: torn-off ragged sleeves, a ragged hem on spring panels, 十一 on the back. */
function haori(b: ModelBuilder, L: Landmarks, torso: Sdf): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1];
  const opening = intersect(
    prism([[-2.6, 80], [2.6, 80], [4.6, 64], [6.0, 52], [6.6, 40], [-6.6, 40], [-6.0, 52], [-4.6, 64]], [0, 0, 0], [1, 0, 0], [0, 1, 0], 30),
    halfSpace([0, 0, 1], [0, 0, -1]),
  );
  // the haori hangs off the shoulders: it stops at the base of the neck (no puffed ruff round it)
  const neckCut = fn((x, y, z) => y - (s.shoulder[1] + 3.2 - Math.max(0, 3.2 - Math.hypot(x, z + 1) * 0.55)), [-30, 40, -30], [30, 90, 30]);
  const shell = subtract(intersect(offset(torso, 1.6), neckCut), offset(torso, 0.25), opening);
  for (const [bone, y0, y1] of [['spine', 46, 56], ['chest', 54, 80]] as [string, number, number][]) b.add(bone, intersect(shell, aabb([-30, y0, -30], [30, y1, 30])), 'haori');
  b.paint(['chest', 'spine'], intersect(offset(opening, 1.0), halfSpace([0, 0, 1], [0, 0, -1])), 'haoriIn', { where: b.isMat('haori') });
  // sleeves torn off above the elbow: a saw-tooth hem of uneven rags
  const rag = (th: number) => {
    const u = (((th / (Math.PI * 2)) * 7) % 1 + 1) % 1;
    return Math.abs(u - 0.5) * 2;
  };
  const sleeve = fn((x, y, z) => {
    const dx = x - (sx + 0.3), dz = z - (sz - 0.3);
    const rho = Math.hypot(dx, dz);
    const th = Math.atan2(dz, dx);
    const k = Math.max(0, Math.min(1, (sy - y) / (sy - ey)));
    const R = 4.3 + k * 1.2;
    const hem = ey + 2.5 + rag(th) * 4 + Math.sin(th * 3 + 1) * 0.9;
    return Math.max(Math.abs(rho - R) - 0.8, hem - y, y - (sy + 1));
  }, [sx - 8, ey - 2, sz - 8], [sx + 8, sy + 2, sz + 8]);
  b.add('upperarm.L', blend(1.2, sphere([sx, sy - 0.9, sz], 4.3), sleeve), 'haori', { mirror: true });
  b.paint('upperarm.L', fn((x, y, z) => Math.hypot(x - (sx + 0.3), z - (sz - 0.3)) - (4.3 + Math.max(0, Math.min(1, (sy - y) / (sy - ey))) * 1.2) + 0.15, [sx - 8, ey - 2, sz - 8], [sx + 8, sy - 3, sz + 8]), 'haoriIn', { mirror: true, where: b.isMat('haori') });
  // a couple of tears and frayed patches in the body (darker cloth showing through)
  b.paint('chest', capsule([7.4, s.chestY - 4.5, -5.8], [8.6, s.chestY - 7, -4.2], 0.6), 'haori', { shade: 4 });
  b.paint('spine', capsule([-8.2, s.waistY + 2.5, -3.5], [-8.6, s.waistY - 1.5, -2.6], 0.55), 'haori', { shade: 4 });
  // 十一 on the back, drawn as seen from behind (viewer's left = the character's left = +X)
  const JUICHI = [
    '.....X.....',
    '.....X.....',
    'XXXXXXXXXXX',
    '.....X.....',
    '.....X.....',
    '.....X.....',
    '.....X.....',
    '...........',
    '...........',
    '.XXXXXXXXX.',
  ];
  const g = b.grid('chest');
  JUICHI.forEach((row, r) => {
    for (let ci = 0; ci < row.length; ci++) {
      if (row[ci] !== 'X') continue;
      const x = 5 - ci, y = s.chestY + 6 - r;
      for (let z = -16; z < 2; z++)
        if (g.get(x, y, z) !== 0) {
          b.voxel('chest', x, y, z, 'kanji', 0);
          break;
        }
    }
  });
  return coatSkirt(b, L, { mat: 'haori', lining: 'haoriIn', yTop: s.waistY - 2, yHem: 9, r0: 10.4, r1: 15, tatter: true, tatterDepth: 2, tatterTeeth: 2, openFront: 16, res: KENPACHI_RES });
}

// ---------------------------------------------------------------------------------------------- eyepatch

/**
 * The eyepatch on the head's voxel lattice: origin at the 'patch' socket (face plate, eye row), +Z out
 * of the face. A black oval over the right eye with a gold rim; a strap across the forehead into the
 * hair and a chain strap back over the ear.
 */
function buildEyepatch(): VoxelModel {
  const b = new ModelBuilder('kenpachi-eyepatch', KENPACHI_RES);
  b.mat('patch', ['#2E2E33', '#202024', '#18181C', '#141418'], { base: 2, rough: 0.4, shadeK: 0.9 });
  b.mat('gold', ['#E8C66A', '#C9A34A', '#A27E2E', '#7A5C1E'], { base: 1, rough: 0.3, metal: 0.85, shadeK: 0.8 });
  b.mat('strap', ['#26262B', '#18181C', '#141418'], { base: 1, rough: 0.6 });
  b.mat('chain', ['#D8D8D8', '#B9B9B9', '#8C8C90'], { base: 1, rough: 0.3, metal: 0.9 });
  b.bone('root', null, [0, 0, 0]);
  // the plate: an oval two voxels deep lying on the face over the right eye and its brow
  const cx = -2.6, cy = 1.2;
  const plate = fn((x, y, z) => Math.max(Math.hypot((x - cx) / 2.6, (y - cy) / 2.1) - 1, -z, z - 2), [cx - 4, cy - 4, -1], [cx + 4, cy + 4, 3]);
  b.add('root', plate, 'patch');
  // the brow ridge (one voxel proud on the head) lives in this space at z = 0: leave its cells to the head
  b.carve('root', aabb([-4, 2, 0], [-1, 3, 1]));
  // gold trim round the rim, on the outer layer
  b.paint('root', fn((x, y, z) => Math.max(1 - Math.hypot((x - cx) / 2.6, (y - cy) / 2.1) - 0.32, 1 - z), [cx - 4, cy - 4, -1], [cx + 4, cy + 4, 3]), 'gold');
  // strap: from the top-inner corner diagonally up across the forehead into the hair
  b.add('root', tube([[-1.2, 2.8, 0.6], [0.6, 4.2, 0.5], [2.4, 5.6, 0.2], [3.8, 7.2, -0.8]], [0.55, 0.55, 0.55, 0.55]), 'strap', { thr: 0.25 });
  // chain: from the outer corner back along the temple, over the ear, into the hair at the back
  const chain: V3[] = [[-5.0, 0.8, 0.6], [-5.9, 0.9, -1.6], [-6.5, 1.2, -4.2], [-6.6, 1.6, -7.2], [-6.2, 2.2, -9.4]];
  b.add('root', tube(chain, chain.map(() => 0.6)), 'chain', { thr: 0.25 });
  b.paint('root', fn((x, y, z) => Math.abs(((z + 40) % 1.6) - 0.8) - 0.38, [-8, -2, -11], [-4, 4, 2]), 'chain', { shade: 2, where: b.isMat('chain') });
  b.autoShade({ up: 0.4, open: 2, front: 0.3 });
  b.lint(2);
  return b.build();
}

// ---------------------------------------------------------------------------------------------- Nozarashi

/**
 * Nozarashi, sealed: a nodachi with a chipped, worn edge, a long narrow serrated guard and a long
 * hilt wrapped in white bandages. Local frame like Zangetsu: origin at the grip centre, blade along
 * +Z, edge toward −Y.
 */
function buildNozarashi(): VoxelModel {
  const b = new ModelBuilder('nozarashi', 48);
  b.mat('steel', ['#C9CED3', '#AEB4BA', '#9CA2A8', '#80868C', '#666C72'], { base: 2, rough: 0.32, metal: 0.85, shadeK: 0.7 });
  b.mat('edge', ['#E2E6EA', '#C9CED3'], { base: 0, rough: 0.2, metal: 0.8 });
  b.mat('chip', ['#6E747A', '#565B61'], { base: 0, rough: 0.6, metal: 0.6 });
  b.mat('iron', ['#5A5A61', '#3F3F44', '#2C2C31', '#1E1E22'], { base: 1, rough: 0.45, metal: 0.7, shadeK: 0.8 });
  b.mat('wrap', ['#F3F1EA', '#EFECE5', '#E3DCCB', '#CFC6B1'], { base: 1, rough: 0.92 });
  b.bone('root', null, [0, 0, 0]);
  const z0 = 7, zTip = 62;
  const curve = (z: number) => Math.max(0, (z - z0) / (zTip - z0)) ** 2 * 1.5;
  const pointDrop = (z: number) => Math.max(0, z - (zTip - 5)) * 0.44;
  const blade = fn((x, y, z) => {
    if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
    const c = curve(z);
    const top = 1.05 + c, bot = -1.25 + c + pointDrop(z);
    return Math.max(Math.abs(x) - 0.5, y - top, bot - y, z0 - z, z - zTip);
  }, [-2, -3, z0 - 1], [2, 5, zTip + 1]);
  b.add('root', blade, 'steel', { thr: 0.3 });
  b.paint('root', fn((x, y, z) => y - (-0.65 + curve(z) + pointDrop(z)), [-2, -3, 0], [2, 5, zTip + 1]), 'edge');
  // chips bitten out of the edge, the steel around them dulled
  const rng = new Rng(11);
  for (let i = 0; i < 10; i++) {
    const z = z0 + 3 + rng.next() * (zTip - z0 - 9);
    const c = curve(z);
    const r = 0.7 + rng.next() * 0.8;
    b.paint('root', sphere([0, -1.4 + c, z], r + 1.1), 'chip', { where: b.isMat('edge', 'steel') });
    b.carve('root', sphere([0, -1.75 + c, z + (rng.next() - 0.5)], r));
  }
  // a nick in the spine too
  b.carve('root', sphere([0, 1.9 + curve(40), 40], 0.75));
  // habaki
  b.add('root', box([0, -0.1, 6.6], [0.9, 1.45, 0.6]), 'iron');
  // the guard: long and narrow along the edge-back axis, its rim serrated
  const tz = 5.4;
  const guard = fn((x, y, z) => {
    const th = Math.atan2(y, x * 2.6);
    const r = 1 + 0.12 * Math.abs(((th / Math.PI) * 6 % 1 + 1) % 1 - 0.5) * 2;
    return Math.max(Math.hypot(x / 1.25, y / 3.4) - r, Math.abs(z - tz) - 0.6);
  }, [-2.5, -5, tz - 1.5], [2.5, 5, tz + 1.5]);
  b.add('root', guard, 'iron');
  // hilt: long, wrapped in white bandages in overlapping diagonal turns
  b.add('root', box([0, 0, -4.6], [1.15, 1.3, 9.2], { round: 0.5 }), 'wrap');
  b.paint('root', fn((x, y, z) => Math.abs((((z + y * 0.6 + 60) % 2.3) + 2.3) % 2.3 - 1.15) - 0.32, [-2, -2, -14.5], [2, 2, 5]), 'wrap', { shade: 2, where: b.isMat('wrap') });
  b.add('root', box([0, 0, -14.1], [1.3, 1.45, 0.6], { round: 0.35 }), 'iron');
  // the loose end of the bandage trailing from the pommel
  b.add('root', capsule([0.3, -0.6, -14.6], [0.6, -3.4, -17.6], 0.6, 0.45), 'wrap', { thr: 0.3 });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** Brown saya bound in bandages. Local frame: origin at the mouth, sheath along +Z. */
function buildSaya(): VoxelModel {
  const b = new ModelBuilder('nozarashi-saya', 48);
  b.mat('wood', ['#8A6340', '#6D4A2D', '#563A22', '#40291A'], { base: 1, rough: 0.55, shadeK: 0.85 });
  b.mat('wrap', ['#EFECE5', '#E3DCCB', '#CFC6B1'], { base: 1, rough: 0.92 });
  b.mat('iron', ['#5A5A61', '#3F3F44', '#2C2C31'], { base: 1, rough: 0.45, metal: 0.7 });
  b.bone('root', null, [0, 0, 0]);
  const curve = (z: number) => (z / 58) ** 2 * 1.6;
  const body = fn((x, y, z) => Math.max(Math.hypot(x / 1.05, (y - curve(Math.max(0, z))) / 1.9) - 1, -z, z - 58), [-2, -3, -1], [2, 5, 59]);
  b.add('root', body, 'wood');
  // bandage bands at the mouth, the middle and the tip, a few loose diagonal turns between
  for (const [z, w] of [[2.4, 2.2], [24, 1.6], [30, 1.2], [52, 2]] as [number, number][]) {
    b.add('root', fn((x, y, zz) => Math.max(Math.hypot(x / 1.05, (y - curve(Math.max(0, zz))) / 1.9) - 1.32, Math.abs(zz - z - y * 0.25) - w), [-3, -3, z - w - 3], [3, 5, z + w + 3]), 'wrap');
  }
  b.add('root', box([0, curve(57.6), 58], [1.2, 2.0, 0.55], { round: 0.4 }), 'iron');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * Shikai: Nozarashi as a giant war-cleaver longer than he is tall — a long cloth-wrapped haft, a broad
 * slab of a blade with a convex edge, a brass cap over the top of the spine and a green tassel hanging
 * from the back. Same frame as the sword: origin at the grip, haft along +Z, edge toward −Y.
 */
function buildCleaver(): VoxelModel {
  const b = new ModelBuilder('nozarashi-shikai', 40);
  b.mat('steel', ['#B7BEC5', '#9AA1A8', '#8F969D', '#737A81', '#585E64'], { base: 2, rough: 0.34, metal: 0.85, shadeK: 0.75 });
  b.mat('edge', ['#DDE2E7', '#C2C8CE'], { base: 0, rough: 0.2, metal: 0.8 });
  b.mat('brass', ['#E2BC6A', '#B98A3B', '#916A28', '#6A4C1A'], { base: 1, rough: 0.3, metal: 0.85, shadeK: 0.8 });
  b.mat('cloth', ['#EFEADC', '#E4DDCA', '#CEC4AC', '#B1A68C'], { base: 1, rough: 0.9 });
  b.mat('tassel', ['#4B9E5E', '#2E7B3F', '#1F5A2D'], { base: 1, rough: 0.8 });
  b.mat('iron', ['#4A4A50', '#33333A', '#222226'], { base: 1, rough: 0.45, metal: 0.7 });
  b.bone('root', null, [0, 0, 0]);
  // haft: pommel to head, wrapped in cloth
  b.add('root', box([0, 0, 19], [1.2, 1.3, 33], { round: 0.5 }), 'cloth');
  b.paint('root', fn((x, y, z) => Math.abs((((z + y * 0.5 + 80) % 2.2) + 2.2) % 2.2 - 1.1) - 0.3, [-2, -2, -15], [2, 2, 53]), 'cloth', { shade: 2, where: b.isMat('cloth') });
  b.add('root', box([0, 0, -14.5], [1.5, 1.6, 0.8], { round: 0.4 }), 'iron');
  // the blade: spine along the haft line, edge out toward −Y, broadening toward the head
  const zA = 22, zB = 92;
  const width = (z: number) => 9 + 14 * Math.min(1, (z - zA) / (zB - zA - 12)) ** 0.8; // edge reach (voxels, along −Y)
  const blade = fn((x, y, z) => {
    if (z < zA - 1 || z > zB + 1) return 1;
    // the edge bulges (convex), the head slopes back to a point at the top-front corner
    const w = width(Math.min(z, zB - 12)) + Math.sin(Math.min(1, (z - zA) / (zB - zA)) * Math.PI) * 2.5;
    const head = z > zB - 12 ? (z - (zB - 12)) * 1.6 : 0; // top: the edge corner rises to meet the spine
    const lo = -w + head, hi = 1.6;
    const thick = 1.3 - 0.75 * Math.max(0, Math.min(1, (hi - y) / Math.max(1, hi - lo)));
    return Math.max(Math.abs(x) - thick, y - hi, lo - y, zA - z, z - zB);
  }, [-2, -27, zA - 2], [2, 3, zB + 2]);
  b.add('root', blade, 'steel', { thr: 0.25 });
  // bevelled edge
  b.paint('root', fn((x, y, z) => {
    const w = width(Math.min(z, zB - 12)) + Math.sin(Math.min(1, (z - zA) / (zB - zA)) * Math.PI) * 2.5;
    const head = z > zB - 12 ? (z - (zB - 12)) * 1.6 : 0;
    return y - (-w + head + 2.2);
  }, [-2, -27, zA - 2], [2, 3, zB + 2]), 'edge');
  // a dull band along the spine and two fullers
  b.paint('root', fn((x, y, z) => Math.abs(y + 6) - 0.5 + (z < zA + 6 || z > zB - 16 ? 9 : 0), [-2, -27, zA - 2], [2, 3, zB + 2]), 'steel', { shade: 4 });
  b.paint('root', fn((x, y, z) => Math.abs(y + 12) - 0.5 + (z < zA + 14 || z > zB - 18 ? 9 : 0), [-2, -27, zA - 2], [2, 3, zB + 2]), 'steel', { shade: 4 });
  // brass cap over the top of the spine, and the collar where the blade meets the haft
  b.add('root', box([0, -1.6, zB - 3], [1.9, 3.6, 4.2], { round: 0.6 }), 'brass');
  b.add('root', box([0, 0, zA - 1.5], [1.7, 1.8, 1.4], { round: 0.4 }), 'brass');
  b.add('root', box([0, 0, 52.5], [1.6, 1.7, 1], { round: 0.4 }), 'brass');
  // the green tassel on the back of the blade: cord and a long fringe
  const t0: V3 = [0, 2.6, zB - 8];
  b.add('root', capsule([0, 1.6, zB - 7], t0, 0.6), 'tassel', { thr: 0.3 });
  b.add('root', capsule(t0, [0.3, 4.4, zB - 14], 0.55), 'tassel', { thr: 0.3 });
  b.add('root', ellipsoid([0.3, 4.6, zB - 15], [1.3, 1.3, 1.6]), 'brass');
  for (let i = -1; i <= 1; i++) b.add('root', capsule([0.3 + i * 0.7, 4.7, zB - 16], [0.5 + i * 1.1, 5.4, zB - 26], 0.55, 0.4), 'tassel', { thr: 0.3 });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** Bankai: a shorter, jagged, broken-looking cleaver of raw gunmetal. Same frame as the others. */
function buildBankaiBlade(): VoxelModel {
  const b = new ModelBuilder('nozarashi-bankai', 40);
  b.mat('metal', ['#5A5A62', '#46464E', '#3A3A40', '#2C2C31', '#202024'], { base: 2, rough: 0.5, metal: 0.8, shadeK: 0.8, dither: 0.1 });
  b.mat('raw', ['#A4A6AB', '#7D7F84'], { base: 1, rough: 0.35, metal: 0.8 });
  b.mat('wrap', ['#C9C1AE', '#A99F88', '#857B66'], { base: 1, rough: 0.92 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', box([0, 0, -2], [1.2, 1.35, 8], { round: 0.5 }), 'wrap');
  b.paint('root', fn((x, y, z) => Math.abs((((z + y * 0.6 + 40) % 2.2) + 2.2) % 2.2 - 1.1) - 0.3, [-2, -2, -11], [2, 2, 7]), 'wrap', { shade: 2, where: b.isMat('wrap') });
  const rng = new Rng(5);
  const teeth = Array.from({ length: 16 }, () => rng.next());
  const zA = 5, zB = 62;
  const blade = fn((x, y, z) => {
    if (z < zA - 1 || z > zB + 1) return 1;
    const u = (z - zA) / (zB - zA);
    // ragged edge and spine: saw teeth of uneven depth
    const ti = Math.min(15, Math.floor(u * 16));
    const saw = Math.abs(((u * 16) % 1) - 0.5) * 2;
    const lo = -(8 + u * 6) - saw * (1 + teeth[ti] * 2.5) + Math.max(0, u - 0.82) * 40;
    const hi = 2.2 + (1 - saw) * teeth[(ti + 5) % 16] * 1.6 - Math.max(0, u - 0.9) * 14;
    return Math.max(Math.abs(x) - 1.2, y - hi, lo - y, zA - z, z - zB);
  }, [-2, -20, zA - 2], [2, 6, zB + 2]);
  b.add('root', blade, 'metal', { thr: 0.25 });
  // raw edges and cracks
  b.paint('root', fn((x, y, z) => {
    const u = (z - zA) / (zB - zA);
    return y - (-(8 + u * 6) + 1.6 + Math.max(0, u - 0.82) * 40);
  }, [-2, -20, zA - 2], [2, 6, zB + 2]), 'raw');
  for (let i = 0; i < 4; i++) {
    const z = zA + 8 + rng.next() * (zB - zA - 16);
    b.paint('root', capsule([0, -2 - rng.next() * 2, z], [0, -7 - rng.next() * 4, z + (rng.next() - 0.5) * 6], 0.5), 'metal', { shade: 4, where: b.isMat('metal') });
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

// ---------------------------------------------------------------------------------------------- Yachiru

/** Rows 11 → 0 of her 12-wide face: big dark-pink eyes, a permanent blush, a little open smile. */
const YACHIRU_FACE = [
  '. . . . . . . . . . . .',
  '. . . . . . . . . . . .',
  '. . . . . . . . . . . .',
  '. . . . . . . . . . . .',
  '. . L L L . . L L L . .',
  '. . I I W . . W I I . .',
  '. . I i W . . W i I . .',
  '. P P . . . . . . P P .',
  '. . . . . . . . . . . .',
  '. . . . . m m . . . . .',
  '. . . . . . . . . . . .',
  '. . . . . . . . . . . .',
];

/**
 * Yachiru Kusajishi perched on his left shoulder: a tiny lieutenant with short fluffy pink hair and a
 * permanent blush, sitting with her legs over the front of his shoulder, one hand holding a spike of his
 * hair, the other pointing the way. A prop at 56 vox/m (≈0.9 m sitting tall); origin at her seat, +Z
 * forward, +X her left.
 */
function buildYachiru(): VoxelModel {
  const b = new ModelBuilder('yachiru', 56);
  b.mat('skin', ['#FCEDE4', '#F8E0D2', '#EDC9B8', '#D9AE9B'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#FFB3CF', '#F58FB5', '#E06C98', '#B84B76'], { base: 1, rough: 0.6, shadeK: 0.85, dither: 0.06 });
  b.mat('blush', ['#F4A0AE']);
  b.mat('lid', ['#5A1A30']);
  b.mat('sclera', ['#F3F1EE']);
  b.mat('iris', ['#C2275F']);
  b.mat('irisD', ['#6A1236']);
  b.mat('mouth', ['#B0485C']);
  b.mat('black', ['#3B3B42', '#2B2B31', '#1E1E23', '#17171B'], { base: 2, rough: 0.88 });
  b.mat('collar', ['#F1F0EC', '#E3E2DE', '#C6C5C1'], { base: 0, rough: 0.85 });
  b.mat('band', ['#F3F1EA', '#E2DED2'], { base: 0, rough: 0.8 });
  b.mat('badge', ['#734F96']);
  b.mat('tabi', ['#F3F2EE', '#E4E2DD'], { base: 0, rough: 0.85 });
  b.mat('straw', ['#CDB683', '#A8874F'], { base: 0, rough: 0.95 });
  b.bone('root', null, [0, 0, 0]);
  // seated body: hips on the shoulder, thighs forward, shins hanging over his chest
  b.add('root', box([0, 2.2, -0.4], [3.4, 2.2, 3], { round: 1.4 }), 'black');
  for (const k of [-1, 1]) {
    b.add('root', capsule([k * 1.8, 2.4, 0.5], [k * 1.9, 2.6, 7.2], 1.75, 1.55), 'black');
    b.add('root', capsule([k * 1.9, 2.4, 7.4], [k * 2, -5, 8.6], 1.45, 1.2), 'black');
    b.add('root', capsule([k * 2, -5.4, 8.6], [k * 2, -7, 8.8], 1.05), 'tabi');
    b.add('root', box([k * 2, -7.6, 9.6], [1.1, 0.6, 1.8], { round: 0.5 }), 'tabi');
    b.add('root', box([k * 2, -8.3, 9.6], [1.3, 0.35, 2.1], { round: 0.3 }), 'straw');
  }
  // torso, white collar in a V, the obi
  b.add('root', box([0, 8.6, 0], [3.4, 4.8, 2.5], { round: 1.6 }), 'black');
  b.paint('root', prism([[-1.6, 13.6], [1.6, 13.6], [0, 9.6]], [0, 0, 0], [1, 0, 0], [0, 1, 0], 6), 'skin', { where: b.isMat('black') });
  for (const k of [-1, 1]) b.add('root', capsule([k * 1.8, 13.4, 2.1], [k * 0.1, 9.4, 2.4], 0.6), 'collar', { thr: 0.2 });
  b.add('root', box([0, 4.9, 0], [3.6, 0.9, 2.7], { round: 0.6 }), 'band');
  // neck and the big head
  b.add('root', capsule([0, 12.8, -0.2], [0, 15, -0.2], 1.3), 'skin');
  const chin = 14;
  const head = blend(1.6, box([0, chin + 6.4, 0], [6, 5.6, 5.4], { round: 3 }), ellipsoid([0, chin + 3, 1.3], [4.6, 3.6, 3.8]));
  b.add('root', head, 'skin');
  b.carve('root', aabb([-7, chin - 1, 5.5], [7, chin + 13, 9]));
  b.stamp('root', -6, chin + 11, YACHIRU_FACE, { L: 'lid', I: 'iris', i: 'irisD', W: 'sclera', P: 'blush', m: 'mouth' }, 5.4);
  // fluffy pink hair: a round cap, a puffy fringe, the sides flicking out at the bottom
  const capC: V3 = [0, chin + 7.6, -0.6];
  b.add('root', intersect(ellipsoid(capC, [7.2, 6.6, 6.6]), halfSpace([0, chin + 8.2, 5.6], [0, -1, 0.7])), 'hair');
  for (let i = -3; i <= 3; i++) b.add('root', ellipsoid([i * 1.7, chin + 9.4 - Math.abs(i) * 0.25, 4.9], [1.3, 1.9, 1.3]), 'hair');
  for (const k of [-1, 1]) {
    b.add('root', ellipsoid([k * 6.2, chin + 4.2, 0.4], [1.8, 3.4, 3.6]), 'hair');
    b.add('root', spike([k * 6.4, chin + 2.4, 1], [k * 0.9, -0.2, 0.3], 2.6, 1.3, 1.0, { tip: 0.3 }), 'hair', { thr: 0.3 });
    b.add('root', spike([k * 5.2, chin + 2.6, -3], [k * 0.7, -0.3, -0.5], 2.4, 1.3, 1.0, { tip: 0.3 }), 'hair', { thr: 0.3 });
  }
  b.add('root', ellipsoid([0, chin + 4, -4.6], [5.4, 4.2, 2.4]), 'hair');
  // arms in wide little sleeves: the left points the way, the right reaches up to hold his hair
  const arm = (sh: V3, el: V3, hand: V3) => {
    b.add('root', capsule(sh, el, 1.7, 1.9), 'black');
    b.add('root', capsule(el, [el[0] + (hand[0] - el[0]) * 0.55, el[1] + (hand[1] - el[1]) * 0.55, el[2] + (hand[2] - el[2]) * 0.55], 1.9, 2.1), 'black');
    b.add('root', capsule([el[0] + (hand[0] - el[0]) * 0.5, el[1] + (hand[1] - el[1]) * 0.5, el[2] + (hand[2] - el[2]) * 0.5], hand, 0.8), 'skin');
    b.add('root', sphere(hand, 1.05), 'skin');
  };
  arm([3.6, 12, 0], [5, 12.6, 3.6], [5.2, 14.6, 9.4]);
  arm([-3.6, 12, 0], [-5.6, 15.2, -0.6], [-6.4, 19.2, -1.8]);
  // the lieutenant's armband on her left arm
  b.add('root', capsule([3.7, 12.1, 0.6], [4.6, 12.5, 2.8], 2.1), 'band');
  b.paint('root', sphere([5.8, 12.4, 1.8], 0.9), 'badge', { where: b.isMat('band') });
  b.autoShade({ up: 0.4, open: 2, front: 0.3 });
  b.lint();
  return b.build();
}
