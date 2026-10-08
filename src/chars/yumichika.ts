// Yumichika Ayasegawa — 5th Seat of the 11th Division (docs/roster/C1-lieutenants-1.md §Yumichika). Brief: 169 cm,
// the standard body at 49.7 vox/m (84 vox); slim and graceful, a narrow waist, a long neck. Silhouette keys: the
// jaw-length black bob with face-framing locks, the colourful feathers at his right eye (outer brow and lashes:
// yellow and orange, red-orange tips), the orange piece round the neck and over the chest joined to an orange
// undersleeve on the right arm under the shihakushō; purple eyes, glossy skin.
// Props: the sealed katana (a bronze cross-pattée guard, a purple hilt) and its fuchsia sheath at the left hip; Fuji
// Kujaku (the blade a sickle with the edge on the inside, fanned on a hinge into four like a peacock's tail); Ruri'iro
// Kujaku's hilt with the four blades frayed into vine roots (the vines themselves are drawn by vfx/kujaku.ts).
// (verify) the feathers' count and colours; the Fuji Kujaku blade's length (about 80 cm).
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, box, capsule, cylinder, fn, prism, spike, sphere, subtract, type Sdf } from '../models/sdf';
import { SPEC_ADULT_MALE, faceLegend, feet, hakama, hands, head, humanoidSkeleton, kosodeSleeves, kosodeTorso, obi, shihakushoSprings, type HumanoidSpec, type Landmarks } from './humanoid';
import type { CharacterAsset } from './ichigo';

/** 84 voxels = 1.69 m */
export const YUMICHIKA_RES = 84 / 1.69;

/** Slim and graceful: narrow shoulders and waist, slender arms. */
const SPEC: HumanoidSpec = {
  ...SPEC_ADULT_MALE,
  shoulder: [8.8, 66.4, -0.5],
  upperArm: 14.2,
  foreArm: 12.8,
  armR: 2.3,
  neckR: 2.25,
  chest: [7.5, 4.4],
  waist: [5.9, 3.8],
  hips: [6.8, 4.4],
};

function palette(b: ModelBuilder): void {
  b.mat('skin', ['#FAE4CF', '#F2D3B7', '#E4C0A2', '#D4AD8E', '#B99276'], { base: 1, rough: 0.35, shadeK: 0.85 });
  b.mat('hair', ['#3A3448', '#2E2440', '#221B2E', '#18151F', '#141418'], { base: 2, rough: 0.3, shadeK: 0.85 });
  b.mat('brow', ['#221B2E']);
  b.mat('lid', ['#1C1724']);
  b.mat('sclera', ['#F3F1EC']);
  b.mat('iris', ['#7B4FA6']);
  b.mat('irisD', ['#4A2B6A']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#D99A8E']);
  b.mat('lash', ['#18151F']);
  b.mat('featherY', ['#F5C83A', '#E8B42C']);
  b.mat('featherO', ['#EE7F2D', '#D9452B']);
  b.mat('orange', ['#F08A40', '#E46F2A', '#CC5E20', '#B9521C', '#93401A'], { base: 1, rough: 0.7, shadeK: 0.9 });
  b.mat('black', ['#34343C', '#24242A', '#18181D', '#141418'], { base: 2, rough: 0.85, shadeK: 0.9 });
  b.mat('collar', ['#F3F3F0', '#E4E5E7', '#C9CCD1'], { base: 0, rough: 0.8 });
  b.mat('obi', ['#F3F3F0', '#E2E3E5', '#C6C9CE'], { base: 0, rough: 0.8 });
  b.mat('tabi', ['#F3F2EE', '#DEDDDA', '#C2C1BD'], { base: 0, rough: 0.8 });
  b.mat('straw', ['#C9A86A', '#A8874F', '#86683A'], { base: 1, rough: 0.9 });
  b.mat('cord', ['#5B4632']);
}

/**
 * Rows chin+9 → chin (column 0 is his right). Arched brows, heavy lashes over purple eyes, a small full mouth; the
 * right eye's outer lashes run long (the feathers are added in 3D beside them).
 */
const FACE = [
  '. . . . . . . . . .',
  '. B B B . . B B B .',
  'k . . . . . . . . .',
  'k k k k . . k k k .',
  '. W I i . . i I W .',
  '. . . . . . . . . .',
  '. . . . . s . . . .',
  '. . . . . . . . . .',
  '. . . . m m . . . .',
  '. . . . . . . . . .',
];

let assetCache: CharacterAsset | null = null;
const propCache = new Map<string, VoxelModel>();

export function yumichikaAsset(): CharacterAsset {
  if (!assetCache) assetCache = buildYumichika();
  return assetCache;
}

/** 'katana' (sealed), 'saya' (the fuchsia sheath), 'fuji' (Fuji Kujaku: the four-sickle fan), 'ruri' (the hilt, vines out) */
export type YumichikaProp = 'katana' | 'saya' | 'fuji' | 'ruri';

export function yumichikaProp(kind: YumichikaProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'katana' ? buildKatana() : kind === 'saya' ? buildSaya() : kind === 'fuji' ? buildFuji() : buildRuri();
    propCache.set(kind, m);
  }
  return m;
}

/** blade sample points (prop frame, m) */
export const KATANA_BASE_Z = 5 / 48;
export const KATANA_TIP_Z = 38 / 48;
/** Fuji Kujaku: the hinge and the fan's reach along +Z */
export const FUJI_BASE_Z = 5 / 48;
export const FUJI_TIP_Z = 31 / 48;
/** where the vines leave the hilt (prop frame, m) */
export const RURI_ROOT_Z = 5 / 48;

export function buildYumichika(): CharacterAsset {
  const b = new ModelBuilder('yumichika', YUMICHIKA_RES);
  palette(b);
  const s = SPEC;
  const L = humanoidSkeleton(b, s, { sleeves: true, hakama: true });
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 5, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5, wz + 1]);
  b.socket('chest.front', 'chest', [0, 61, 6]);
  b.socket('back', 'chest', [0, 58, -7]);
  b.socket('hip.L', 'hips', [s.waist[0] + 1.6, s.waistY - 3, 2], [-20, 0, 6]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('mouth', 'head', [0, s.chinY + 1.5, hd.front + 0.5]);
  // a fine, narrow face: the jaw shaved in
  for (const k of [-1, 1]) b.carve('head', box([k * 5.4, hd.chin + 1.2, hd.front - 2], [0.9, 2.2, 3], { rot: [0, 0, k * 20] }));
  const legend = { ...faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), k: { mat: 'lash' } };
  b.stamp('head', hd.x0, hd.chin + 9, FACE, legend, hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  hair(b, L, hd);
  feathers(b, hd);
  hands(b, L, 'skin');
  feet(b, L, 'tabi', 'straw', 'cord');
  // the orange piece fills the kosode's V
  const o = { black: 'black', collar: 'collar', skin: 'orange', obi: 'obi', bag: 4 };
  kosodeTorso(b, L, o);
  kosodeSleeves(b, L, { ...o, skin: 'skin' });
  obi(b, L, o);
  hakama(b, L, o);
  orangePiece(b, L);
  b.autoShade();
  b.lint();
  const base = shihakushoSprings();
  return { model: b.build(), springs: base.springs, colliders: base.colliders, warnings: b.warnings };
}

/**
 * The jaw-length bob: a smooth shell rounded over the crown and falling straight to the jaw, a fringe swept a little
 * to his left over the brows, two locks framing the face.
 */
function hair(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number; x0: number }): void {
  const s = L.spec;
  const c = hd.chin, front = hd.front;
  const cz = L.headC[2] - 0.6;
  const yTop = c + s.head.h + 2.2, yBot = c + 0.4;
  const shell = fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (c + 9 - y) / (c + 9 - yBot)));
    const rx = s.head.w / 2 + 1.5 + t * 0.7, rz = s.head.d / 2 + 1.4 + t * 0.5;
    const crown = y > c + 9 ? (y - (c + 9)) / (yTop - (c + 9)) : 0;
    const k = Math.sqrt(Math.max(0, 1 - crown * crown));
    const e = (Math.abs(x / (rx * k + 1e-3)) ** 3 + Math.abs((z - cz) / (rz * k + 1e-3)) ** 3) ** (1 / 3) - 1;
    return Math.max(e * Math.min(rx, rz) * 0.9, yBot - y, y - yTop);
  }, [-10, yBot - 1, cz - 10], [10, yTop + 1, cz + 10]);
  // the face open from the jaw to the fringe, whose edge dips toward his left
  const opening = prism([[-4.6, c - 2], [-4.6, c + 7.6], [-1, c + 8.4], [2.2, c + 7.9], [4.6, c + 7.2], [4.6, c - 2]], [0, 0, front + 2], [1, 0, 0], [0, 1, 0], 4.6);
  b.add('head', subtract(shell, opening), 'hair', { only: 'empty', thr: 0.2 });
  // the locks framing the face: a little in front of the cheeks, down to the jaw
  for (const k of [-1, 1]) b.add('head', box([k * 4.6, c + 3.6, front - 0.6], [0.9, 3.6, 0.9], { round: 0.6 }), 'hair', { only: 'empty' });
  // strands, a glossy band, the ends darker
  b.paint('head', fn((x, _y, z) => {
    const a = Math.atan2(x, z - cz);
    return Math.abs(((a * 7 + 30) % 1.4) - 0.7) - 0.16;
  }, [-10, yBot - 1, cz - 10], [10, c + 9, cz + 10]), 'hair', { shade: 3, where: b.isMat('hair') });
  b.paint('head', fn((x, y, z) => Math.abs(y - (c + 10.5 - Math.abs(x) * 0.15)) - 0.5 + (z < cz - 4 ? 1 : 0), [-10, c + 8, cz - 10], [10, c + 13, cz + 10]), 'hair', { shade: 0, where: b.isMat('hair') });
  b.paint('head', aabb([-10, yBot - 1, cz - 10], [10, yBot + 0.6, cz + 10]), 'hair', { shade: 3, where: b.isMat('hair') });
}

/** The feathers at his right eye: yellow and orange plumes off the outer brow and the lower lashes, red-orange tips. */
function feathers(b: ModelBuilder, hd: { front: number; chin: number; x0: number }): void {
  const c = hd.chin, z = hd.front - 0.6;
  const plumes: { from: [number, number]; dir: [number, number, number]; len: number; mat: string; tip: string }[] = [
    { from: [-4.6, c + 7.6], dir: [-0.7, 0.75, 0.25], len: 3.6, mat: 'featherY', tip: 'featherO' },
    { from: [-4.8, c + 6.9], dir: [-0.95, 0.35, 0.25], len: 3.4, mat: 'featherO', tip: 'featherO' },
    { from: [-4.8, c + 5.6], dir: [-0.95, -0.2, 0.25], len: 3, mat: 'featherY', tip: 'featherO' },
    { from: [-4.4, c + 4.8], dir: [-0.6, -0.7, 0.3], len: 2.6, mat: 'featherO', tip: 'featherO' },
  ];
  for (const p of plumes) {
    const base: [number, number, number] = [p.from[0], p.from[1], z];
    b.add('head', spike(base, p.dir, p.len, 0.95, 0.5, { side: [0, 0, 1], tip: 0.25 }), p.mat, { thr: 0.25 });
    // the tips a shade redder
    const t: [number, number, number] = [base[0] + p.dir[0] * p.len * 0.8, base[1] + p.dir[1] * p.len * 0.8, base[2] + p.dir[2] * p.len * 0.8];
    b.paint('head', sphere(t, 0.9), p.tip, { shade: 1, where: (v) => b.matOf(v).mat?.name === p.mat });
  }
}

/**
 * The orange piece: a high collar round the neck (the V of the kosode filled with orange by the torso), joined to the
 * orange undersleeve on the right arm that shows at the sleeve's mouth and down to the wrist.
 */
function orangePiece(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const nz = L.headC[2] - 0.5;
  b.add('neck', cylinder([0, s.chinY - 5.5, nz], [0, s.chinY - 1.6, nz], s.neckR + 0.8), 'orange');
  b.paint('neck', cylinder([0, s.chinY - 2.2, nz], [0, s.chinY - 1.4, nz], s.neckR + 1.2), 'orange', { shade: 0, where: b.isMat('orange') });
  const [sx, , sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  // the undersleeve: the right forearm inside the sleeve is orange, a cuff shows past the mouth at the wrist
  b.paint('forearm.R', capsule([-sx, ey, sz], [-sx, wy - 1, sz], 2.6), 'orange', { where: b.isMat('skin') });
  b.add('forearm.R', cylinder([-sx, wy - 0.4, sz], [-sx, wy + 2.4, sz], 2.15), 'orange', { only: 'empty' });
  b.paint('forearm.R', cylinder([-sx, wy - 0.6, sz], [-sx, wy + 0.2, sz], 2.6), 'orange', { shade: 2, where: b.isMat('orange') });
}

// ---------------------------------------------------------------------------------------------- props

/** the hilt and guard every form shares: a purple wrap over white rayskin, a bronze cross-pattée guard */
function hilt(b: ModelBuilder): void {
  b.mat('bronze', ['#D2A050', '#A8742F', '#86591F', '#664216'], { base: 1, rough: 0.35, metal: 0.85, shadeK: 0.8 });
  b.mat('wrap', ['#8152B8', '#6B3FA0', '#552F82', '#40235F'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#EAE2D6']);
  // the cross pattée: four arms flaring out from the centre, the blade through the middle
  const gz = 3.8;
  const arm = (k: Sdf) => k;
  const cross: Sdf[] = [];
  for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const flare = fn((x, y, z) => {
      const along = x * ax + y * ay, across = Math.abs(x * ay - y * ax);
      return Math.max(-along + 0.4, along - 4.2, across - (0.9 + along * 0.38), Math.abs(z - gz) - 0.45);
    }, [-5, -5, gz - 1], [5, 5, gz + 1]);
    cross.push(arm(flare));
  }
  for (const c of cross) b.add('root', c, 'bronze', { thr: 0.3 });
  b.add('root', box([0, 0, gz], [1.4, 1.4, 0.5]), 'bronze');
  b.add('root', box([0, -0.1, 4.6], [0.85, 1.3, 0.55]), 'bronze');
  b.add('root', box([0, 0, -1.4], [1.05, 1.2, 5.0], { round: 0.5 }), 'wrap');
  b.paint('root', fn((_x, y, z) => Math.abs(((Math.abs(y) + z) % 2.6 + 2.6) % 2.6 - 1.3) - 0.42, [-2, -2, -7], [2, 2, 3]), 'ray', { where: b.isMat('wrap') });
  b.add('root', cylinder([0, 0, -6.4], [0, 0, -7.4], 1.2, 1.0, 0.3), 'bronze');
}

/** Sealed: a plain katana with the cross-pattée guard. */
function buildKatana(): VoxelModel {
  const b = new ModelBuilder('kujaku-sealed', 48);
  b.mat('steel', ['#E7EAEE', '#CFD3D8', '#AEB3BA', '#8E949C'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#F3F3F0'], { rough: 0.12, metal: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  const z0 = 5, zTip = 38, zEnd = zTip - 3;
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

/** The sheath: fuchsia lacquer with a bright highlight, bronze at the mouth and the tip. */
function buildSaya(): VoxelModel {
  const b = new ModelBuilder('kujaku-saya', 48);
  b.mat('lacquer', ['#E866B3', '#C8358F', '#A52A75', '#7E1F59'], { base: 1, rough: 0.25, shadeK: 0.8 });
  b.mat('bronze', ['#D2A050', '#A8742F', '#86591F'], { base: 1, rough: 0.35, metal: 0.85 });
  b.bone('root', null, [0, 0, 0]);
  const Ls = 35;
  b.add('root', box([0, 0, -Ls / 2], [1.0, 1.5, Ls / 2], { round: 0.6 }), 'lacquer');
  b.add('root', box([0, 0, -0.5], [1.2, 1.7, 0.6], { round: 0.3 }), 'bronze');
  b.add('root', box([0, 0, -Ls + 0.6], [1.15, 1.65, 0.7], { round: 0.5 }), 'bronze');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * Fuji Kujaku: four identical sickle blades fanned on a hinge above the guard like a peacock's tail, each a curved
 * crescent with the edge on its inside, spread in the blade's plane (y, z).
 */
function buildFuji(): VoxelModel {
  const b = new ModelBuilder('fuji-kujaku', 48);
  b.mat('steel', ['#E6E9EE', '#D0D5DB', '#B3B9C1', '#959CA6'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#EEF0F6'], { rough: 0.12, metal: 0.8 });
  b.mat('wisteria', ['#C9C0E6', '#A59ACA'], { rough: 0.3, metal: 0.6, glow: 0.25 });
  b.bone('root', null, [0, 0, 0]);
  hilt(b);
  // the hinge
  b.add('root', cylinder([-1.2, 0, 5.6], [1.2, 0, 5.6], 1.3), 'bronze');
  const hz = 5.6;
  for (const deg of [-39, -13, 13, 39]) {
    const a = (deg * Math.PI) / 180;
    // the blade's spine: an arc of radius R leaving the hinge at angle a, curving toward −y (the edge on the inside)
    const R = 22, len = 25;
    const dir = [Math.sin(a), Math.cos(a)]; // (y, z) unit, 0° = +z
    const nrm = [dir[1], -dir[0]]; // the curve's centre side (clockwise)
    const cy = nrm[0] * R, cz = hz + nrm[1] * R;
    const a0 = Math.atan2(-nrm[1], -nrm[0]);
    const sweep = len / R;
    const blade = fn((x, y, z) => {
      const dy = y - cy, dz = z - cz;
      const r = Math.hypot(dy, dz);
      let t = Math.atan2(dz, dy) - a0;
      while (t > Math.PI) t -= Math.PI * 2;
      while (t < -Math.PI) t += Math.PI * 2;
      // clockwise from a0: t runs 0 → −sweep
      const u = -t / sweep;
      if (u < -0.02 || u > 1) return 1;
      const w = 1.25 * (1 - u * 0.8);
      return Math.max(Math.abs(x) - 0.45, Math.abs(r - (R - w * 0.2)) - w);
    }, [-1, -24, -2], [1, 24, 34]);
    b.add('root', blade, 'steel', { thr: 0.25 });
    b.paint('root', fn((x, y, z) => {
      const dy = y - cy, dz = z - cz;
      return Math.hypot(dy, dz) - (R - 0.9);
    }, [-1, -24, -2], [1, 24, 34]), 'edge', { where: b.isMat('steel') });
  }
  // the faint wisteria sheen along the spine of the fan (it sulks)
  b.paint('root', fn((_x, y, z) => (z < 8 ? 1 : Math.abs(Math.hypot(y, z - hz) - 12) - 0.5), [-2, -24, 6], [2, 24, 34]), 'wisteria', { where: b.isMat('steel') });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** Ruri'iro Kujaku in the hand: the hilt, the four blades frayed into curling vine roots (the vines are VFX). */
function buildRuri(): VoxelModel {
  const b = new ModelBuilder('ruri-kujaku', 48);
  b.mat('vine', ['#3FB38A', '#2E8B57', '#1F6E46', '#16523A'], { base: 1, rough: 0.5, shadeK: 0.8 });
  b.mat('lapis', ['#3F6FD1', '#1E50A2'], { rough: 0.3, glow: 0.6 });
  b.bone('root', null, [0, 0, 0]);
  hilt(b);
  for (const [i, deg] of [-40, -14, 14, 40].entries()) {
    const a = (deg * Math.PI) / 180;
    b.add('root', spike([0, 0, 4.8], [0, Math.sin(a), Math.cos(a)], 6 + (i % 2) * 1.5, 1.1, 0.9, { side: [1, 0, 0], bend: [0, -0.2 * Math.sign(deg), 0.05], tip: 0.3 }), 'vine', { thr: 0.25 });
    b.add('root', sphere([0, Math.sin(a) * 4, 4.8 + Math.cos(a) * 4], 0.8), 'lapis');
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}
