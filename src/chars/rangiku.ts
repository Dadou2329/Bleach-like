// Rangiku Matsumoto — Lieutenant of the 10th Division (docs/roster/C1-lieutenants-1.md §Rangiku). Brief: 172 cm →
// 83 vox; an hourglass figure, long legs, a very full bust (the open kosode is part of her silhouette). Silhouette
// keys: the long wavy strawberry-blond mane past the shoulders with a lock framing her face, the pink stole draped
// across her back and through the crooks of her arms, the kosode open in a deep V, and Haineko's sheath slung
// crosswise on the back of the obi. Blue eyes under curved brows, full lips, the beauty mark under the right corner
// of her mouth; a thin gold chain; the lieutenant's badge on the sash at her left, tied in a bow.
// Props: sealed Haineko (a katana whose guard is a cat's head — two ear points over the back of the blade, the chin
// a point below — with a dark-red grip), its wine-dark sheath, the Shikai hilt (guard and grip alone: the blade is
// ash) and the Gentei Reiin, the daffodil seal on her chest in the Human World.
// (verify) the guard metal; the sheath colour.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, smoothPath, sphere, subtract, tube, type Sdf, type V3 } from '../models/sdf';
import { addBands, faceLegend, feet, hakama, hands, head, humanoidSkeleton, kosodeSleeves, shihakushoSprings, spikeHair, type HumanoidSpec, type Landmarks } from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

/** 83 voxels = 1.72 m */
export const RANGIKU_RES = 83 / 1.72;

/** An hourglass: a full bust, a narrow waist, wide hips, long legs. */
const SPEC: HumanoidSpec = {
  H: 83,
  chinY: 70.5,
  head: { w: 10, d: 11, h: 12.5 },
  neckR: 2.1,
  shoulder: [8.0, 64.6, -0.5],
  upperArm: 13.6,
  foreArm: 12.2,
  hand: 8,
  armR: 1.95,
  hipsY: 43,
  hip: [4.7, 40.6, 0],
  kneeY: 23,
  ankleY: 4.2,
  chest: [6.4, 4.3],
  waist: [4.9, 3.6],
  hips: [7.4, 4.9],
  chestY: 58.5,
  waistY: 50.5,
  foot: { len: 10.5, w: 4.2, heel: 2.6 },
};
/** the bust's centre height and the bottom of the V */
const BUST_Y = SPEC.chestY - 2.2;
const CROSS_Y = SPEC.waistY + 2.4;

function palette(b: ModelBuilder): void {
  b.mat('skin', ['#FBE3CF', '#F6D4B8', '#E9C2A3', '#D9AE90', '#BC9073'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#FFD08A', '#F8B86E', '#F3A65A', '#DC8C45', '#C97A34', '#A9632A'], { base: 2, rough: 0.45, shadeK: 0.85, dither: 0.04 });
  b.mat('brow', ['#C77E3C']);
  b.mat('lid', ['#3A2418']);
  b.mat('sclera', ['#F3F1EC']);
  b.mat('iris', ['#5F8FD1']);
  b.mat('irisD', ['#2E4F8A']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#B45A62']);
  b.mat('lip', ['#E2A39C']);
  b.mat('mole', ['#5A3A2A']);
  b.mat('black', ['#383A3F', '#26272D', '#1C1D22', '#141418'], { base: 1, rough: 0.85, shadeK: 0.9 });
  b.mat('collar', ['#F1F0EC', '#E0DED9', '#C8C6C1'], { base: 0, rough: 0.8 });
  b.mat('obi', ['#F0EEE8', '#E2DFD8', '#CDC9C0', '#B1ACA2'], { base: 1, rough: 0.8 });
  b.mat('stole', ['#FBC6D4', '#F3A9BE', '#E491A9', '#D9839C', '#B8657E'], { base: 1, rough: 0.9, shadeK: 0.85 });
  b.mat('gold', ['#F2D271', '#D9B44A', '#B88A20'], { base: 1, rough: 0.3, metal: 0.85 });
  b.mat('badge', ['#EFE6CF', '#D9CDB0', '#B9AB8C'], { base: 0, rough: 0.8 });
  b.mat('wood', ['#8B6340', '#6B4A2B', '#4E3520'], { base: 1, rough: 0.8 });
  b.mat('ink', ['#1E1A16']);
  b.mat('flower', ['#F2CF5A', '#E8C14A']);
  b.mat('tabi', ['#F3F2EE', '#DEDDDA', '#C2C1BD'], { base: 0, rough: 0.8 });
  b.mat('sole', ['#C9B9A0', '#B0A888', '#8C8268'], { base: 1, rough: 0.9 });
  b.mat('cord', ['#5B4632']);
}

/**
 * Big blue eyes with lashes flicking out at the corners under curved brows, a small nose, full lips; the beauty
 * mark (o) below the right corner of her mouth (her right is the stamp's left). Rows chin+9 → chin.
 */
const FACE = [
  '. . . . . . . . . .',
  '. b B B . . B B b .',
  '. . . . . . . . . .',
  'L L L L . . L L L L',
  '. W I * . . * I W .',
  '. . I i . . i I . .',
  '. . . . . s . . . .',
  '. . . . m m . . . .',
  '. . . . l l . . . .',
  '. . . o . . . . . .',
];
/** the Gentei Reiin: a six-petalled daffodil with its trumpet (7 × 7) */
const DAFFODIL = [
  '. y . y .',
  'y . y . y',
  '. y o y .',
  'y . y . y',
  '. y . y .',
];

let assetCache: CharacterAsset | null = null;
const propCache = new Map<string, VoxelModel>();

export function rangikuAsset(): CharacterAsset {
  if (!assetCache) assetCache = buildRangiku();
  return assetCache;
}

/**
 * 'katana' (sealed Haineko), 'saya' (its sheath, empty), 'hilt' (the Shikai: guard and grip, the blade gone to
 * ash), 'blade' (the blade alone, crumbling into ash on the release), 'seal' (the Gentei Reiin)
 */
export type RangikuProp = 'katana' | 'saya' | 'hilt' | 'blade' | 'seal';

export function rangikuProp(kind: RangikuProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'katana' || kind === 'hilt' || kind === 'blade' ? buildHaineko(kind) : kind === 'saya' ? buildSaya() : buildSeal();
    propCache.set(kind, m);
  }
  return m;
}

/** Haineko's blade (prop frame, m) */
export const HAINEKO_BASE_Z = 6 / 48;
export const HAINEKO_TIP_Z = 41 / 48;

export function buildRangiku(): CharacterAsset {
  const b = new ModelBuilder('rangiku', RANGIKU_RES);
  palette(b);
  const s = SPEC;
  const L = humanoidSkeleton(b, s, { sleeves: true, hakama: true });
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.0, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.0, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.5, wy - 4.6, wz + 0.9]);
  b.socket('palm.L', 'palm.L', [wx - 0.5, wy - 4.6, wz + 0.9]);
  b.socket('finger.L', 'palm.L', [wx - 0.2, wy - s.hand - 0.4, wz + 0.9]);
  b.socket('back', 'chest', [0, s.chestY + 1, -7]);
  // the sheath lies crosswise on the back of the obi, the mouth at her right hip
  b.socket('obi.back', 'hips', [-15, s.waistY - 2.6, -s.waist[1] - 3.4], [0, -90, 0]);
  b.socket('chest.front', 'chest', [0, BUST_Y + 3.2, s.chest[1] + 2.4]);
  b.socket('throat', 'chest', [0, s.chinY - 4, 2.6]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('mouth', 'head', [0, s.chinY + 1.5, hd.front + 0.5]);
  hands(b, L, 'skin', 1.1);
  feet(b, L, 'tabi', 'sole', 'cord');
  const o = { black: 'black', collar: 'collar', skin: 'skin', obi: 'obi', hemR: 8.4, hakamaHem: 2.6 };
  openKosode(b, L);
  kosodeSleeves(b, L, { ...o, bag: 4.2 });
  sash(b, L);
  hakama(b, L, o);
  necklace(b, L);
  const stoleRig = stole(b, L);
  const hairRig = hair(b, L, hd);
  // the face goes on last, over the plate the hair left clear
  const legend = { ...faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), o: { mat: 'mole' }, l: { mat: 'lip' } };
  b.stamp('head', hd.x0, hd.chin + 9, FACE, legend, hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  b.autoShade();
  b.lint();
  const base = shihakushoSprings();
  return {
    model: b.build(),
    springs: [...base.springs, ...stoleRig.springs, ...hairRig.springs],
    colliders: [...base.colliders, ...stoleRig.colliders, ...hairRig.colliders],
    warnings: b.warnings,
  };
}

// ---------------------------------------------------------------------------------------------- body and garments

/** half-width of the open V at height y: wide at the collarbones, narrowing over the bust to the crossing */
function vHalf(y: number): number {
  const top = SPEC.chinY - 3;
  const t = Math.max(0, Math.min(1, (y - CROSS_Y) / (top - CROSS_Y)));
  return 3.6 * Math.pow(t, 0.7);
}

/**
 * The kosode worn open: the torso with the bust under black cloth, a deep V of skin from the collarbones to just
 * above the obi (the cleavage in it), the white collar along both edges and the black lapel outside it.
 */
function openKosode(b: ModelBuilder, L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const t = 1.1;
  const [sx, sy, sz] = s.shoulder;
  const chest = box([0, s.chestY - 0.5, -0.4], [cx + t, 5.8, cz + t - 0.3], { round: 3.2 });
  const waist = box([0, s.waistY, -0.2], [wx + t, 4.4, wz + t], { round: 2.8 });
  const trapL = capsule([2.3, sy + 1.5, sz - 0.8], [sx - 1.4, sy - 0.2, sz], 2.6, 2.7);
  const trapR = capsule([-2.3, sy + 1.5, sz - 0.8], [-sx + 1.4, sy - 0.2, sz], 2.6, 2.7);
  const balls = [sphere([sx, sy - 0.5, sz], 3.1), sphere([-sx, sy - 0.5, sz], 3.1)];
  const bust = blend(0.6, ellipsoid([3.0, BUST_Y, cz + 0.6], [3.3, 3.0, 3.1]), ellipsoid([-3.0, BUST_Y, cz + 0.6], [3.3, 3.0, 3.1]));
  const torso = blend(1.0, blend(3.0, chest, waist, trapL, trapR, ...balls), bust);
  addBands(b, torso, 'black', [
    ['spine', s.hipsY, s.waistY + 5],
    ['chest', s.waistY + 5, s.chinY + 8],
  ]);
  // the V: skin from the collarbones down between the breasts to the crossing (front only)
  const front = (y: number) => (y > s.waistY + 5 ? 0.5 : 1.2);
  const vee = fn((x, y, z) => {
    if (y < CROSS_Y - 0.3 || y > s.chinY - 1 || z < front(y)) return 1;
    return Math.abs(x) - vHalf(y);
  }, [-8, CROSS_Y - 1, 0], [8, s.chinY, 14]);
  b.paint(['chest', 'spine'], vee, 'skin', { where: b.isMat('black') });
  // the cleavage: a soft crease where the breasts meet
  b.paint('chest', capsule([0, BUST_Y + 1.6, cz + 3.4], [0, BUST_Y - 2.6, cz + 3.0], 0.45), 'skin', { shade: 3, where: b.isMat('skin') });
  // the white collar and the black lapel along both edges, riding on the surface
  const zf = (x: number, y: number) => {
    for (let z = 14; z > -14; z -= 0.1) if (torso.d(x, y, z) <= 0) return z + 0.2;
    return 0;
  };
  const top = s.chinY - 2.5;
  for (const k of [1, -1]) {
    const ys = [top - 0.5, top - 3, BUST_Y + 3.4, BUST_Y + 0.6, BUST_Y - 2.6, CROSS_Y + 1.2];
    const pts: V3[] = [[k * 2.6, top + 2.2, -3.4], [k * 3.5, top + 1, 1.4], ...ys.map((y) => [k * (vHalf(y) + 0.8), y, zf(k * (vHalf(y) + 0.8), y)] as V3)];
    const path = smoothPath(pts, 3);
    addBands(b, tube(path, path.map(() => 1.05)), 'collar', [['chest', s.waistY + 5, 100], ['spine', -10, s.waistY + 5]], { thr: 0.15 });
    const lap = path.slice(4).map((p) => [p[0] + k * 1.6, p[1] - 0.3, p[2] - 0.35] as V3);
    addBands(b, tube(lap, lap.map(() => 0.8)), 'black', [['chest', s.waistY + 5, 100], ['spine', -10, s.waistY + 5]], { thr: 0.15 });
  }
  b.add('chest', capsule([-2.7, top + 2.2, -3.5], [2.7, top + 2.2, -3.5], 1.2), 'collar');
  // big folds only: the cloth pulled over the bust toward the waist, and a seam down the back
  for (const k of [-1, 1]) {
    b.paint('chest', capsule([k * 6.8, BUST_Y - 1.5, cz + 0.8], [k * 4.4, s.waistY + 4.5, wz + 1.4], 0.65), 'black', { shade: 3, where: b.isMat('black') });
    b.paint('chest', capsule([k * (cx + t + 0.2), s.chestY + 2, -1], [k * (cx + t - 0.6), s.chestY - 5, 1.5], 0.65), 'black', { shade: 3, where: b.isMat('black') });
  }
  b.paint('chest', capsule([0, sy, -cz - t - 0.3], [0, s.chestY - 6, -cz - t - 0.3], 0.55), 'black', { shade: 3, where: b.isMat('black') });
  return torso;
}

/** The white sash; the lieutenant's badge on it at her left front, tied in a white bow. */
function sash(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const y = s.waistY - 2.5;
  const band = subtract(
    box([0, y, -0.2], [s.waist[0] + 2.5, 1.7, s.waist[1] + 2.5], { round: 2.4 }),
    box([0, y, -0.2], [s.waist[0] + 1, 4, s.waist[1] + 1], { round: 2 }),
  );
  b.add('hips', band, 'obi');
  // the badge: a cream plaque in a dark wooden rim with 十, and the bow it hangs from
  const bx = 3.6, bz = s.waist[1] + 3.6;
  b.add('hips', box([bx + 0.4, y - 3.4, bz], [1.9, 2.4, 0.5]), 'wood');
  b.add('hips', box([bx + 0.4, y - 3.4, bz + 0.5], [1.3, 1.8, 0.3]), 'badge');
  for (const [dx, dy] of [[0, -1], [0, 0], [0, 1], [-1, 0], [1, 0]] as [number, number][]) b.voxel('hips', Math.round(bx + 0.4 + dx), Math.round(y - 3.4 + dy), Math.round(bz + 1), 'ink', 0);
  b.add('hips', ellipsoid([bx - 0.6, y + 0.2, bz - 0.4], [1.4, 1.0, 0.8]), 'obi');
  b.add('hips', ellipsoid([bx + 1.6, y + 0.2, bz - 0.5], [1.4, 1.0, 0.8]), 'obi');
  b.add('hips', sphere([bx + 0.5, y + 0.2, bz - 0.1], 0.8), 'obi');
}

/** A thin gold chain round her neck, its line running down into the V. */
function necklace(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const cz = s.chest[1];
  for (const k of [1, -1]) {
    const pts = smoothPath([[k * 2.4, s.chinY - 2.8, 1.6], [k * 1.6, s.chinY - 6, cz + 2.2], [k * 0.4, BUST_Y + 3.6, cz + 3.4], [0, BUST_Y + 2.4, cz + 3.6]], 3);
    b.paint('chest', tube(pts, pts.map(() => 0.42)), 'gold', { where: b.isMat('skin') });
  }
}

/**
 * The pink stole: across the back below the shoulder blades, over the backs of the upper arms and through the
 * crooks of the elbows, the ends hanging in front of the forearms on spring bones.
 */
function stole(b: ModelBuilder, L: Landmarks): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const R = RANGIKU_RES;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1];
  const cz = s.chest[1];
  // the back: a band sagging between the shoulders
  const back = smoothPath([[-sx - 1.4, sy - 2.4, -2.6], [-4, sy - 4.6, -cz - 2.4], [0, sy - 5.6, -cz - 2.6], [4, sy - 4.6, -cz - 2.4], [sx + 1.4, sy - 2.4, -2.6]], 4);
  b.add('chest', tube(back, back.map((_, i) => 1.5 - Math.abs(i / (back.length - 1) - 0.5) * 0.4)), 'stole', { thr: 0.25 });
  const springs: SpringDef[] = [];
  for (const k of [1, -1]) {
    const arm = k > 0 ? 'upperarm.L' : 'upperarm.R';
    const fore = k > 0 ? 'forearm.L' : 'forearm.R';
    // over the back and the outside of the upper arm, down to the crook of the elbow
    const up = smoothPath([[k * (sx + 0.6), sy - 2.2, -3.2], [k * (sx + 2.6), sy - 6, -1.6], [k * (sx + 2.2), ey + 3, 1.2], [k * (sx + 0.4), ey + 0.6, 3.2]], 3);
    b.add(arm, tube(up, up.map(() => 1.35)), 'stole', { thr: 0.25 });
    // the end through the elbow and hanging before the forearm, loose
    const pivot: V3 = [k * (sx + 0.2), ey + 0.2, sz + 3.2];
    const bone = k > 0 ? 'stole.L' : 'stole.R';
    b.bone(bone, fore, pivot);
    const hang = smoothPath([pivot, [k * (sx + 0.6), ey - 4, sz + 4.6], [k * (sx + 1.0), ey - 9, sz + 4.2], [k * (sx + 1.2), ey - 13.5, sz + 3.2]], 3);
    b.add(bone, tube(hang, hang.map((_, i) => 1.35 + i * 0.03)), 'stole', { thr: 0.25 });
    b.paint(bone, capsule(hang[hang.length - 1], hang[hang.length - 1], 1.6), 'stole', { shade: 3, where: b.isMat('stole') });
    const tip = hang[hang.length - 1];
    springs.push({ bone, tail: [(tip[0] - pivot[0]) / R, (tip[1] - pivot[1]) / R, (tip[2] - pivot[2]) / R], stiffness: 55, damping: 5, gravity: 10, limit: 45, radius: 0.04 });
  }
  // the gauzy folds: a few long darker lines along the band
  b.paint(['chest'], fn((x, y) => Math.abs(((x * 0.6 + y + 80) % 2.6) - 1.3) - 0.35, [-14, sy - 9, -12], [14, sy, 0]), 'stole', { shade: 2, where: b.isMat('stole') });
  return { springs, colliders: [] };
}

// ---------------------------------------------------------------------------------------------- hair

/**
 * The mane: a full cap parted at her left with the fringe swept across her brow, a long wavy lock framing each side
 * of her face down over the collarbones, and the wavy mass down her back to the shoulder blades on three spring
 * bones, the ends curling outward.
 */
function hair(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const c = hd.chin;
  const front = hd.front;
  const R = RANGIKU_RES;
  spikeHair(b, L, 'hair', [
    // volume: soft rounded masses drawn back and down from the crown
    { az: 100, el: 16, len: 2.6, r: 3.6, flat: 0.75, flow: [0.1, -1.3, -0.3] },
    { az: -100, el: 16, len: 2.6, r: 3.6, flat: 0.75, flow: [-0.1, -1.3, -0.3] },
    { az: 140, el: 24, len: 2.4, r: 4.0, flat: 0.75, flow: [0.1, -1.2, -0.4] },
    { az: -140, el: 24, len: 2.4, r: 4.0, flat: 0.75, flow: [-0.1, -1.2, -0.4] },
    { az: 180, el: 30, len: 2.2, r: 4.2, flat: 0.75, flow: [0, -1.2, -0.4] },
  ], [], { capR: [s.head.w / 2 + 1.5, s.head.h / 2 + 1.2, s.head.d / 2 + 1.4], tufts: 0, hairline: c + 11.2, nape: c, slope: 0.6 });
  // the fringe parted high at her left (+x) and swept across the forehead to her right, over the right temple
  const sweep = [
    smoothPath([[2.6, c + 13.4, front - 2.0], [0.4, c + 12.6, front - 0.1], [-2.4, c + 11.4, front + 0.2], [-4.8, c + 10.0, front - 0.4], [-6.0, c + 8.4, front - 1.6]], 4),
    smoothPath([[3.4, c + 13.0, front - 1.2], [4.8, c + 11.6, front - 0.6], [5.6, c + 10.0, front - 1.0]], 4),
  ];
  for (const p of sweep) b.add('head', tube(p, p.map((_, i) => 2.0 - i * 0.06)), 'hair', { thr: 0.3 });
  // the locks framing the face: wavy, from the temples down past the jaw to the collarbones, clear of the cheeks
  for (const k of [1, -1]) {
    const lk = smoothPath([[k * 6.0, c + 10, front - 2.4], [k * 6.6, c + 6, front - 1.8], [k * 6.2, c + 2, front - 2.0], [k * 7.0, c - 2, front - 1.6], [k * 6.4, c - 5.5, front - 1.0], [k * 7.2, c - 8.5, front - 1.2]], 4);
    b.add('head', tube(lk, lk.map((_, i) => 1.8 - i * 0.03)), 'hair', { thr: 0.3 });
  }
  // keep the face plate clear between the locks and under the fringe: nothing proud of it, no hair in it
  b.carve('head', aabb([-4.6, c + 0.5, front + 0.01], [4.6, c + 9.4, front + 6]));
  b.paint('head', aabb([-4.6, c + 0.5, front - 3], [4.6, c + 9.4, front]), 'skin', { where: b.isMat('hair') });
  // the mass down her back: wide and wavy, the hem of curls flipping outward
  const backZ = L.headC[2] - s.head.d / 2;
  const yTop = c + 8, yBot = s.chestY - 5.5;
  const zc = (y: number) => {
    const t = Math.max(0, Math.min(1, (yTop - y) / (yTop - yBot)));
    return backZ - 0.8 - Math.sin(Math.min(1, t * 2.2) * Math.PI * 0.5) * 2.4 + t * 0.6;
  };
  const sheet = fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (yTop - y) / (yTop - yBot)));
    // full at the shoulders, waves running down it, the hem scalloped into curls
    const w = 7.6 + Math.sin(t * Math.PI) * 1.6 + Math.sin(y * 0.55) * 0.5;
    const bot = yBot + Math.abs(Math.sin(x * 0.75)) * 2.6;
    const wave = Math.sin(y * 0.6 + x * 0.35) * 0.45;
    return Math.max(Math.abs(x) - w, Math.abs(z - zc(y) - wave) - (2.3 - t * 0.4), y - yTop, bot - y);
  }, [-11, yBot - 1, backZ - 11], [11, yTop + 1, backZ + 3]);
  const p1: V3 = [0, c + 4, backZ - 1], p2: V3 = [0, s.chestY + 6, zc(s.chestY + 6)], p3: V3 = [0, s.chestY + 0.5, zc(s.chestY + 0.5)];
  const bones: [string, string, V3, number, number][] = [['hair1', 'head', p1, p2[1] - 0.5, 200], ['hair2', 'hair1', p2, p3[1] - 0.5, p2[1] + 0.5], ['hair3', 'hair2', p3, -100, p3[1] + 0.5]];
  for (const [name, parent, pivot, y0, y1] of bones) {
    b.bone(name, parent, pivot);
    b.add(name, intersect(sheet, aabb([-20, y0, -30], [20, y1, 10])), 'hair', { thr: 0.25 });
  }
  // the curls at the ends flip outward at the sides
  for (const k of [1, -1]) {
    const curl = smoothPath([[k * 7.4, yBot + 3, zc(yBot + 3)], [k * 9.2, yBot + 0.4, zc(yBot) + 1.0], [k * 9.8, yBot + 2.2, zc(yBot) + 2.0]], 3);
    b.add('hair3', tube(curl, curl.map((_, i) => 1.6 - i * 0.1)), 'hair', { thr: 0.3 });
  }
  // the waves: long diagonal bands of shade down the mass (structure, not noise)
  b.paint(['hair1', 'hair2', 'hair3'], fn((x, y) => Math.abs(((y * 0.9 + Math.abs(x) * 0.6 + 60) % 3.2) - 1.6) - 0.42, [-12, yBot - 3, backZ - 12], [12, yTop + 2, backZ + 3]), 'hair', { shade: 4, where: b.isMat('hair') });
  b.paint('head', fn((x, y, z) => (z > front - 3 ? 1 : Math.abs(((y * 0.9 + Math.abs(x) * 0.6 + 60) % 3.2) - 1.6) - 0.42), [-12, c - 10, -12], [12, c + 16, 12]), 'hair', { shade: 4, where: b.isMat('hair') });
  const tip: V3 = [0, yBot, zc(yBot)];
  const springs: SpringDef[] = [
    { bone: 'hair1', tail: [(p2[0] - p1[0]) / R, (p2[1] - p1[1]) / R, (p2[2] - p1[2]) / R], stiffness: 45, damping: 5, gravity: 11, limit: 35, radius: 0.08 },
    { bone: 'hair2', tail: [(p3[0] - p2[0]) / R, (p3[1] - p2[1]) / R, (p3[2] - p2[2]) / R], stiffness: 32, damping: 4.5, gravity: 12, limit: 45, radius: 0.08 },
    { bone: 'hair3', tail: [(tip[0] - p3[0]) / R, (tip[1] - p3[1]) / R, (tip[2] - p3[2]) / R], stiffness: 26, damping: 4, gravity: 13, limit: 55, radius: 0.07 },
  ];
  const colliders: ColliderDef[] = [
    { bone: 'chest', offset: [0, 0.03, -0.02], radius: 0.15 },
    { bone: 'spine', offset: [0, 0, -0.01], radius: 0.12 },
  ];
  return { springs, colliders };
}

// ---------------------------------------------------------------------------------------------- props

/**
 * Haineko: a straight katana, the guard a cat's head (a rounded face, two ear points over the back of the blade,
 * the chin narrowing to a point under the edge), a dark-red wrap over white rayskin, a brass pommel. 'hilt' is the
 * Shikai's hilt alone, 'blade' the blade alone.
 */
function buildHaineko(kind: 'katana' | 'hilt' | 'blade'): VoxelModel {
  const blade = kind !== 'hilt';
  const b = new ModelBuilder(kind === 'katana' ? 'haineko' : `haineko-${kind}`, 48);
  b.mat('steel', ['#E7EAEE', '#CFD3D8', '#AEB3BA', '#8E949C'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#F3F3F0'], { rough: 0.12, metal: 0.8 });
  b.mat('brass', ['#E2C068', '#C9A040', '#A57F2C', '#7E601E'], { base: 1, rough: 0.35, metal: 0.85 });
  b.mat('wrap', ['#9A2C3A', '#7A1F2B', '#5E1621', '#43101A'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#E6E0D2']);
  b.bone('root', null, [0, 0, 0]);
  const z0 = 6, zTip = 41;
  if (blade) {
    const zEnd = zTip - 3.4;
    b.add('root', fn((x, y, z) => {
      if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
      const top = 0.95, bot = -1.15 + Math.max(0, z - zEnd) * 0.62;
      return Math.max(Math.abs(x) - 0.5, y - top, bot - y, z0 - z, z - zTip);
    }, [-2, -3, z0 - 1], [2, 3, zTip + 1]), 'steel', { thr: 0.3 });
    b.paint('root', fn((_x, y, z) => y - (-0.65 + Math.max(0, z - zEnd) * 0.62), [-2, -3, 0], [2, 3, zTip + 1]), 'edge');
    b.add('root', box([0, -0.1, 5.6], [0.85, 1.3, 0.55]), 'brass');
  }
  if (kind === 'blade') {
    b.autoShade({ up: 0.4, open: 2, front: 0 });
    b.lint();
    return b.build();
  }
  // the cat's head guard, flat across the blade: face, ears, chin
  const gz = 4.6;
  const face = ellipsoid([0, 0.2, gz], [2.5, 2.3, 0.6]);
  const ears = [prismEar(-1.6, gz), prismEar(1.6, gz)];
  const chin = intersect(ellipsoid([0, -1.8, gz], [1.4, 1.6, 0.6]), halfSpace([0, -1.2, 0], [0, 1, 0]));
  b.add('root', blend(0.5, face, ...ears, chin), 'brass', { thr: 0.25 });
  // its eyes and the mouth line, pressed into the face
  for (const x of [-1, 1]) b.paint('root', sphere([x * 0.9, 0.6, gz + 0.7], 0.45), 'brass', { shade: 3, where: b.isMat('brass') });
  b.paint('root', box([0, -0.6, gz + 0.7], [0.6, 0.25, 0.3]), 'brass', { shade: 3, where: b.isMat('brass') });
  // the grip: red wrap over rayskin, a brass pommel
  b.add('root', box([0, 0, -1.0], [1.05, 1.25, 5.0], { round: 0.5 }), 'wrap');
  b.paint('root', fn((_x, y, z) => Math.abs(((Math.abs(y) + z) % 2.6 + 2.6) % 2.6 - 1.3) - 0.42, [-2, -2, -6], [2, 2, 4]), 'ray', { where: b.isMat('wrap') });
  b.add('root', cylinder([0, 0, -6.0], [0, 0, -7.2], 1.25, 1.05, 0.3), 'brass');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** one ear of the cat's head: a short blunt triangle pointing up and a little out */
function prismEar(x: number, gz: number): Sdf {
  return intersect(
    cylinder([x, 1.4, gz - 0.55], [x, 1.4, gz + 0.55], 1.25),
    halfSpace([x, 3.6, gz], [Math.sign(x) * 0.35, 1, 0]),
    halfSpace([x - Math.sign(x) * 1.2, 2.4, gz], [-Math.sign(x), 0.25, 0]),
    aabb([x - 1.4, 1.0, gz - 0.6], [x + 1.4, 4.0, gz + 0.6]),
  );
}

/** The sheath: dark wine lacquer, brass at the mouth and the tip; the mouth at the origin, the body along −Z. */
function buildSaya(): VoxelModel {
  const b = new ModelBuilder('haineko-saya', 48);
  b.mat('lacquer', ['#4A2328', '#3A1A1E', '#2A1416', '#1C0E10'], { base: 1, rough: 0.28, shadeK: 0.8 });
  b.mat('brass', ['#E2C068', '#C9A040', '#A57F2C'], { base: 1, rough: 0.35, metal: 0.85 });
  b.bone('root', null, [0, 0, 0]);
  const Ls = 36;
  b.add('root', box([0, 0, -Ls / 2], [1.0, 1.55, Ls / 2], { round: 0.6 }), 'lacquer');
  b.add('root', box([0, 0, -0.5], [1.2, 1.75, 0.6], { round: 0.3 }), 'brass');
  b.add('root', box([0, 0, -Ls + 0.6], [1.15, 1.7, 0.7], { round: 0.5 }), 'brass');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** the Gentei Reiin: a flat daffodil seal (prop frame: the face toward +Z) */
function buildSeal(): VoxelModel {
  const b = new ModelBuilder('rangiku-seal', 48);
  b.mat('flower', ['#EBCB6A', '#E2BC52', '#C9A040'], { base: 1, rough: 0.7 });
  b.mat('trumpet', ['#E8A04A', '#D08A36']);
  b.bone('root', null, [0, 0, 0]);
  DAFFODIL.forEach((row, r) => row.split(' ').forEach((ch, k) => {
    if (ch === '.') return;
    b.voxel('root', k - 2, 2 - r, 0, ch === 'o' ? 'trumpet' : 'flower', ch === 'o' ? 0 : 1);
  }));
  b.lint(1);
  return b.build();
}
