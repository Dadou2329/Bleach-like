// Yammy Llargo — Diez, then Cero Espada (docs/roster/E2-espada-2.md §6). Brief: 230 cm, a hulking 100-voxel body at
// 43.5 vox/m: massive shoulders and arms, a barrel chest, a thick neck, a heavy jaw, a slumped and bored stance.
// Silhouette keys: the bald scalp lined with bony ridges, black sideburns and a thin black ponytail, orange eyebrows,
// red estigma under the eyes, the bone lower jaw with eight teeth on his chin, the open white jacket over a bare chest
// with the hole in its centre, "10" on the left shoulder, white hakama, Ira (never drawn) at his left hip.
// Ira, the kaiju (8 vox/m, 11 m): the human torso grown colossal on a white quadruped trunk — elephant legs with three
// toes and carapace joints, a bony tail club, piston tubes on the elbows, five black tubes on the back, black nodules
// on the forearms, the skull ridges grown into two bone plates sweeping back, the flame estigma, a longer ponytail.
// Ira, the ape (6 vox/m, 15 m): knuckle-walking, a portly belly, hairy legs and tail, a crown of horns, two great
// horns on the back, crack marks round the eyes.
// (verify) the jacket's sleeves (built sleeveless so the "10" shows), Ira's leg count (four), the cracks' colour.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, prism, smoothPath, sphere, spike, subtract, tube, type Sdf, type V3 } from '../models/sdf';
import { addBands, faceLegend, hakama, head, humanoidSkeleton, obi, type HumanoidSpec, type Landmarks } from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

/** 100 voxels = 2.3 m */
export const YAMMY_RES = 100 / 2.3;
export type YammyForm = 'sealed' | 'ira' | 'ape';

/** Hulking: very broad shoulders, thick arms and neck, a barrel chest, a heavy jaw. */
const SPEC: HumanoidSpec = {
  H: 100,
  chinY: 86,
  head: { w: 12, d: 13, h: 14 },
  neckR: 4.6,
  shoulder: [14.2, 79, -0.5],
  upperArm: 17,
  foreArm: 15.5,
  hand: 10.5,
  armR: 4.4,
  hipsY: 50,
  hip: [6.6, 47, 0],
  kneeY: 26,
  ankleY: 5,
  chest: [13.5, 8.6],
  waist: [10.6, 7.6],
  hips: [11, 7.6],
  chestY: 72,
  waistY: 59,
  foot: { len: 15, w: 7, heel: 3.5 },
};

function palette(b: ModelBuilder): void {
  b.mat('skin', ['#E8B88A', '#E0AE80', '#C99364', '#B07D52', '#94643C'], { base: 2, rough: 0.6, shadeK: 0.95 });
  b.mat('hair', ['#2A2A2E', '#1E1E22', '#161618', '#141418'], { base: 1, rough: 0.5, shadeK: 0.85 });
  b.mat('ridge', ['#EFCDA8', '#E5BD94', '#D3A57A', '#BB8D62'], { base: 1, rough: 0.55, shadeK: 0.95 });
  b.mat('brow', ['#E5772A']);
  b.mat('lid', ['#3A2416']);
  b.mat('sclera', ['#F0ECE2']);
  b.mat('iris', ['#6A3E1F']);
  b.mat('pupil', ['#2A1A10']);
  b.mat('mark', ['#C51E2B']);
  b.mat('mouth', ['#5A2626']);
  b.mat('bone', ['#F3F1EA', '#EFEBDF', '#DCD6C6', '#C2BCAB', '#A39C8A'], { base: 1, rough: 0.42, shadeK: 1 });
  b.mat('ink', ['#141418']);
  b.mat('void', ['#141418'], { rough: 1 });
  b.mat('white', ['#F3F3F0', '#ECEBE6', '#E0DFDA', '#D8D5CE', '#B9B7B0'], { base: 1, rough: 0.82, shadeK: 0.9 });
  b.mat('lining', ['#2A2A2F', '#1C1C20', '#141418'], { base: 1, rough: 0.85 });
  b.mat('sash', ['#2C2C32', '#17171B', '#141418'], { base: 1, rough: 0.8 });
  b.mat('boot', ['#2E2E35', '#1A1A1F', '#141418'], { base: 1, rough: 0.45 });
  b.mat('line', ['#ECECEC'], { rough: 0.6 });
}

/**
 * Face rows chin+9 → chin (column 0 is his right): thick orange brows low over small, bored brown eyes, the red
 * estigma running down from under them, a broad nose, a flat wide mouth just above the bone jaw.
 */
const FACE = [
  '. . . . . . . . . . . .',
  '. B B B B . . B B B B .',
  '. . L L L . . L L L . .',
  '. . W I i . . i I W . .',
  '. . G . . . . . . G . .',
  '. . G . . s s . . G . .',
  '. . G . . . . . . G . .',
  '. . . m m m m m m . . .',
  '. . . . . . . . . . . .',
  '. . . . . . . . . . . .',
];

const assetCache = new Map<YammyForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function yammyAsset(form: YammyForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = form === 'sealed' ? buildYammy() : form === 'ira' ? buildIra() : buildApe()));
  return a;
}

/** 'sheath' (Ira at his hip, never drawn) */
export function yammyProp(kind: 'sheath'): VoxelModel {
  let m = propCache.get(kind);
  if (!m) propCache.set(kind, (m = buildSheath()));
  return m;
}

export function buildYammy(): CharacterAsset {
  const b = new ModelBuilder('yammy-sealed', YAMMY_RES);
  palette(b);
  const s = SPEC;
  const L = humanoidSkeleton(b, s, { hakama: true });
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 6.2, wz + 0.6]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 6.2, wz + 0.6]);
  b.socket('palm.R', 'palm.R', [-wx + 0.8, wy - 6.5, wz + 1.6]);
  b.socket('palm.L', 'palm.L', [wx - 0.8, wy - 6.5, wz + 1.6]);
  b.socket('hip.L', 'hips', [s.hips[0] + 2.6, s.waistY - 6, 3.2], [-30, 180, -8]);
  b.socket('chest.front', 'chest', [0, s.chestY, s.chest[1] + 1]);
  b.socket('back', 'chest', [0, s.chestY + 2, -s.chest[1] - 1]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 6, hd.front]);
  b.socket('mouth', 'head', [0, s.chinY + 2.5, hd.front + 0.5]);
  // a heavy, square jaw and a brow ridge
  b.add('head', box([0, s.chinY + 1.6, L.headC[2] + 1.2], [5.6, 2.2, 5.2], { round: 1.2 }), 'skin', { only: 'empty' });
  b.add('head', box([0, s.chinY + 8.6, hd.front - 1.2], [5.8, 0.9, 1.0], { round: 0.6 }), 'skin', { only: 'empty' });
  b.stamp('head', hd.x0, hd.chin + 9, FACE, { ...faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'pupil', hi: 'sclera', mouth: 'mouth' }), G: { mat: 'mark' } }, hd.front - 1);
  scalp(b, L, hd);
  jawMask(b, L, hd);
  const torso = body(b, L);
  jacket(b, L, torso);
  bigHands(b, L, 1.45);
  const o = { black: 'white', collar: 'white', skin: 'skin', obi: 'sash', hemR: 9.6 };
  hakama(b, L, o);
  obi(b, L, o);
  boots(b, L);
  b.autoShade();
  b.lint();
  const springs: SpringDef[] = [];
  for (const side of ['L', 'R']) springs.push({ bone: `hakama.${side}`, tail: [0, -0.5, 0], stiffness: 70, damping: 6, gravity: 8, limit: 50, radius: 0.14 });
  springs.push({ bone: 'tail.hair', tail: [0, -0.3, -0.06], stiffness: 50, damping: 4, gravity: 10, limit: 50, radius: 0.04 });
  const colliders: ColliderDef[] = [
    { bone: 'thigh.L', offset: [0, -0.15, 0.02], radius: 0.17 },
    { bone: 'thigh.R', offset: [0, -0.15, 0.02], radius: 0.17 },
    { bone: 'chest', offset: [0, 0.05, -0.12], radius: 0.24 },
  ];
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- head

/** Bald, the scalp lined with bony ridges front to back; bushy black sideburns; a thin ponytail at the back. */
function scalp(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): void {
  const s = L.spec;
  const c = hd.chin;
  const cz = L.headC[2] - 0.5;
  const hw = s.head.w / 2;
  // ridges: five low crests of bone under the skin, from the hairline back over the crown (the skull, swollen a voxel)
  const hh = s.head.h, d = s.head.d, back = hd.front - d;
  const skull = blend(1.2,
    box([0, c + 4 + (hh - 4) / 2, (hd.front + back) / 2], [hw, (hh - 4) / 2, d / 2], { round: 2.2 }),
    ellipsoid([0, c + hh * 0.62, back + 4], [hw + 0.3, hh * 0.42, 4.5]));
  const stripes = fn((x) => Math.min(...[-3.6, -1.8, 0, 1.8, 3.6].map((r) => Math.abs(x - r) - 0.45)), [-8, c + 10, back - 2], [8, c + hh + 3, hd.front]);
  b.add('head', intersect(offset(skull, 0.9), stripes, halfSpace([0, c + 10.5, 0], [0, -1, 0]), halfSpace([0, 0, hd.front - 2.5], [0, 0, 1])), 'ridge', { only: 'empty' });
  // sideburns: bushy black patches in front of the ears, wide at the temple, narrowing down to the jaw
  for (const k of [-1, 1])
    b.paint('head', fn((x, y, z) => {
      const u = Math.max(0, Math.min(1, (y - (c + 2)) / 7));
      const z0 = hd.front - 4.6 - u * 2.6, z1 = hd.front - 3 - u * 0.6;
      return Math.max(Math.abs(z - (z0 + z1) / 2) - (z1 - z0) / 2, c + 2 - y, y - (c + 9.4), (hw - 1.4) - k * x);
    }, [k > 0 ? hw - 2 : -hw - 2, c + 1, hd.front - 9], [k > 0 ? hw + 2 : -hw + 2, c + 10, hd.front - 2]), 'hair');
  // the thin ponytail: a knot at the back of the crown, a tail down to the upper back
  b.bone('tail.hair', 'head', [0, c + 11, cz - 6.2]);
  b.add('head', sphere([0, c + 11, cz - 6.2], 1.6), 'hair');
  const p = smoothPath([[0, c + 10.6, cz - 7], [0, c + 6, cz - 8.4], [0, c - 2, cz - 8.6], [0, c - 9, cz - 8.2]], 5);
  b.add('tail.hair', tube(p, p.map((_, i) => 1.3 - i * 0.03)), 'hair', { thr: 0.25 });
}

/**
 * Eight teeth standing up from the jawbone, a voxel apart so each one reads: six across the front of the chin, one
 * more round each side. c: the chin row, front: the face plate.
 */
function teeth(b: ModelBuilder, c: number, front: number, h = 1.6): void {
  for (const x of [-5.5, -3.5, -1.5, 1.5, 3.5, 5.5]) b.add('head', box([x, c + 0.6 + h / 2, front + 0.5], [0.45, h / 2, 0.45]), 'bone', { thr: 0.1 });
  for (const k of [-1, 1]) b.add('head', box([k * 6.5, c + 0.4 + h / 2, front - 2.5], [0.45, h / 2, 0.45]), 'bone', { thr: 0.1 });
}

/**
 * Bands of one body shape split between bones, each band reaching a few voxels into the next one inside a slightly
 * shrunk copy of the shape: when the spine bends the overlap fills the crease instead of a dark gap opening.
 */
function lappedBands(b: ModelBuilder, shape: Sdf, mat: string, bands: [string, number, number][], lap = 3): void {
  addBands(b, shape, mat, bands);
  const inner = offset(shape, -0.8);
  for (let i = 0; i < bands.length; i++) {
    const [bone, y0, y1] = bands[i];
    if (i > 0) b.add(bone, intersect(inner, aabb([-200, y0 - lap, -200], [200, y0, 200])), mat, { only: 'empty' });
    if (i < bands.length - 1) b.add(bone, intersect(inner, aabb([-200, y1, -200], [200, y1 + lap, 200])), mat, { only: 'empty' });
  }
}

/** Big hands for a big man, scaled k about the wrist: the open palm, and the fist he fights with. */
function bigHands(b: ModelBuilder, L: Landmarks, k: number): void {
  const [wx, wy, wz] = L.wrist;
  const P = (dx: number, dy: number, dz: number): V3 => [wx + dx * k, wy + dy * k, wz + dz * k];
  const o = { mirror: true };
  b.add('palm.L', blend(1.2 * k, box(P(0, -3, 0.3), [1.6 * k, 3 * k, 2.6 * k], { round: k }), box(P(-0.2, -6.6, 0.4), [1.3 * k, 2.6 * k, 2.4 * k], { round: k })), 'skin', o);
  b.add('palm.L', capsule(P(-0.6, -2, 2.4), P(-1.4, -5.2, 3.6), 1.1 * k, 0.9 * k), 'skin', o);
  b.add('palm.L', capsule(P(0, 0.5, 0), P(0, -1.5, 0), 2 * k), 'skin', o);
  for (const dz of [-1.2, 0, 1.2]) b.paint('palm.L', box(P(-0.2, -8, 0.4 + dz), [2 * k, 1.4 * k, 0.12 * k]), 'skin', { ...o, shade: 4 });
  const gy = -4.3;
  b.add('fist.L', box(P(-0.1, gy, 0.4), [2.2 * k, 3.1 * k, 2.9 * k], { round: 1.1 * k }), 'skin', o);
  b.add('fist.L', capsule(P(0, 0.5, 0), P(0, -1.5, 0), 2 * k), 'skin', o);
  b.add('fist.L', capsule(P(-1.9, gy + 1.6, 2.2), P(-1.2, gy - 0.6, 3.2), 1.05 * k), 'skin', o);
  // the knuckle ridge outside, the curled fingers inside
  b.paint('fist.L', box(P(2.1, gy + 1.5, 0.4), [0.6 * k, 0.5 * k, 3 * k]), 'skin', { ...o, shade: 2 });
  for (const dz of [-1.45, 0, 1.45]) b.paint('fist.L', box(P(-2.3, gy - 0.4, 0.4 + dz), [0.7 * k, 2.6 * k, 0.12 * k]), 'skin', { ...o, shade: 4 });
}

/** The mask: a lower jawbone hugging his chin a voxel off the skin, eight teeth standing up in front of his lower lip. */
function jawMask(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): void {
  const c = hd.chin;
  const cz = hd.front - 4.6;
  const jaw = intersect(
    fn((x, y, z) => Math.max(Math.abs(Math.hypot(x / 1.05, z - cz) - 4.9) - 0.75, Math.abs(y - (c - 0.2)) - 0.9), [-8, c - 2, cz - 7], [8, c + 2, hd.front + 2]),
    halfSpace([0, 0, cz - 1], [0, 0, -1]),
  );
  b.add('head', jaw, 'bone', { thr: 0.25 });
  teeth(b, c, hd.front);
}

// ---------------------------------------------------------------------------------------------- body

/** A massive bare torso: slabs of pectoral, a heavy belly, the hole through the centre of the chest. */
function body(b: ModelBuilder, L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const chest = box([0, s.chestY - 0.5, -0.3], [cx, 8, cz], { round: 4.6 });
  const waist = box([0, s.waistY, -0.2], [wx, 6, wz], { round: 4 });
  const pelvis = box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 4.6, s.hips[1]], { round: 3.6 });
  const traps = [capsule([3.6, sy + 3, sz - 1.2], [sx - 2, sy - 0.2, sz], 4.6, 4.4), capsule([-3.6, sy + 3, sz - 1.2], [-sx + 2, sy - 0.2, sz], 4.6, 4.4)];
  const delts = [sphere([sx, sy - 0.8, sz], 5.4), sphere([-sx, sy - 0.8, sz], 5.4)];
  const pecs = [ellipsoid([5.2, s.chestY + 1.6, cz - 0.2], [5.8, 4.2, 2.6], [0, 0, -10]), ellipsoid([-5.2, s.chestY + 1.6, cz - 0.2], [5.8, 4.2, 2.6], [0, 0, 10])];
  const belly = ellipsoid([0, s.waistY - 0.5, 1.2], [wx - 0.5, 6.4, wz]);
  const torso = blend(4, chest, waist, pelvis, ...traps, ...delts, ...pecs, belly);
  lappedBands(b, torso, 'skin', [['hips', 40, s.waistY - 5], ['spine', s.waistY - 5, s.chestY - 6], ['chest', s.chestY - 6, 96]]);
  b.add('neck', capsule([0, s.chinY - 7, L.headC[2] - 1], [0, s.chinY + 2, L.headC[2] - 1], s.neckR), 'skin');
  // muscle lines: the pecs' undersides, the sternum, a heavy belly line
  const F = (d: Sdf) => intersect(d, halfSpace([0, 0, 2], [0, 0, -1]));
  for (const k of [-1, 1]) b.paint(['chest', 'spine'], F(capsule([k * 1.2, s.chestY - 2.4, cz + 1], [k * 9.4, s.chestY - 1, cz], 0.6)), 'skin', { shade: 4, where: b.isMat('skin') });
  b.paint(['chest', 'spine'], F(capsule([0, s.chestY + 5, cz + 1], [0, s.chestY - 2, cz + 1], 0.55)), 'skin', { shade: 4, where: b.isMat('skin') });
  // the hole: through the centre of the chest, rimmed dark
  const hy = s.chestY - 4.5;
  b.carve(['chest', 'spine'], cylinder([0, hy, -16], [0, hy, 16], 3.2));
  b.paint(['chest', 'spine'], cylinder([0, hy, -16], [0, hy, 16], 4.2), 'void', { where: b.isMat('skin') });
  // arms: huge bare biceps and forearms
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(1.8, sphere([sx, sy - 0.8, sz], 5.0), capsule([sx, sy - 1.5, sz], [sx, ey + 1, sz], 4.6, 4.0), ellipsoid([sx + 0.3, sy - 8, sz + 1.4], [3.8, 5.6, 3.4])), 'skin', { mirror: true });
  b.add('forearm.L', blend(1.6, sphere([sx, ey, sz], 4.0), capsule([sx, ey - 0.5, sz], [sx, wy + 1.4, sz], 4.2, 3.0), ellipsoid([sx, ey - 4, sz + 0.6], [3.8, 5, 3.6])), 'skin', { mirror: true });
  // "10" on the left shoulder, ink on the outside of the deltoid
  const ox = sx + 4.7;
  for (const [y0, y1, z0, z1] of [[sy - 7, sy - 2, -2.6, -1.8], [sy - 7, sy - 2, -0.6, 0.2], [sy - 7, sy - 2, 1.8, 2.6], [sy - 2.6, sy - 1.8, -0.6, 2.6], [sy - 7, sy - 6.2, -0.6, 2.6]] as [number, number, number, number][])
    b.paint('upperarm.L', aabb([ox - 2, y0, sz + z0], [ox + 3, y1, sz + z1]), 'ink', { where: b.isMat('skin') });
  return torso;
}

/** The open jacket: sleeveless, the collar standing round the neck, black lining at the edges, a short skirt. */
function jacket(b: ModelBuilder, L: Landmarks, torso: Sdf): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const top = s.chinY - 4;
  const opening = intersect(
    prism([[-5.5, top + 6], [5.5, top + 6], [8.5, s.chestY], [10.5, s.waistY], [12, 30], [-12, 30], [-10.5, s.waistY], [-8.5, s.chestY]], [0, 0, 0], [1, 0, 0], [0, 1, 0], 40),
    halfSpace([0, 0, 1.5], [0, 0, -1]),
  );
  // no sleeves: the arm-holes cut round the deltoids
  const holes = [ellipsoid([sx + 1.5, sy - 2, sz], [6, 7.6, 6.6]), ellipsoid([-sx - 1.5, sy - 2, sz], [6, 7.6, 6.6])];
  const shell = subtract(offset(torso, 1.4), offset(torso, 0.2), opening, ...holes);
  addBands(b, intersect(shell, aabb([-40, s.hipsY - 2, -40], [40, top + 4, 40])), 'white', [['spine', s.hipsY - 2, s.chestY - 6], ['chest', s.chestY - 6, top + 4]]);
  b.paint(['chest', 'spine'], intersect(offset(opening, 1.3), halfSpace([0, 0, 1.5], [0, 0, -1])), 'lining', { where: b.isMat('white') });
  // the collar: a stiff band standing round the back of the neck
  const nz = L.headC[2] - 1.4;
  b.add('chest', fn((x, y, z) => {
    const r = 6 + Math.max(0, Math.min(1, (y - top) / 6)) * 1.2;
    return Math.max(Math.abs(Math.hypot(x, (z - nz) * 1.1) - r) - 0.8, y - (s.chinY + 3 - Math.max(0, z - nz + 2) * 1.0), top - 1 - y, z - (nz + 2));
  }, [-10, top - 2, -10], [10, s.chinY + 5, 8]), 'white');
}

function boots(b: ModelBuilder, L: Landmarks): void {
  const [ax, ay, az] = L.ankle;
  const f = L.spec.foot;
  b.add('foot.L', capsule([ax, ay + 7, az - 0.4], [ax, ay - 1, az - 0.4], 3.8, 3.6), 'boot', { mirror: true });
  b.add('foot.L', intersect(box([ax, 2.6, az + (f.len / 2 - f.heel)], [3.6, 2.6, f.len / 2 + 0.4], { round: 2 }), halfSpace([0, 6, az + f.len - f.heel - 4], [0, 1, 0.6])), 'boot', { mirror: true });
  b.paint('foot.L', aabb([ax - 6, 0, az - 9], [ax + 6, 1, az + 16]), 'line', { mirror: true });
}

/** Ira sheathed: a red grip, a rounded-rectangle guard with two prongs a side, a white sheath. */
function buildSheath(): VoxelModel {
  const b = new ModelBuilder('ira-sheath', 48);
  b.mat('white', ['#F3F3F0', '#E4E3DE', '#C9C6BE'], { base: 1, rough: 0.6 });
  b.mat('wrap', ['#C8343E', '#B3222C', '#8E1820'], { base: 1, rough: 0.85 });
  b.mat('guard', ['#7A7A80', '#5E5E62', '#45454A'], { base: 1, rough: 0.35, metal: 0.7 });
  b.bone('root', null, [0, 0, 0]);
  const Ls = 40;
  b.add('root', box([0, 0, Ls / 2], [1.1, 1.6, Ls / 2], { round: 0.7 }), 'white');
  b.add('root', box([0, 0, -0.6], [3.4, 2.4, 0.6], { round: 1.4 }), 'guard');
  for (const k of [-1, 1]) for (const dy of [-1.2, 1.2]) b.add('root', box([k * 3.9, dy, -0.6], [0.8, 0.4, 0.5]), 'guard');
  b.add('root', box([0, 0, -6.5], [1.2, 1.4, 5.5], { round: 0.6 }), 'wrap');
  b.add('root', box([0, 0, -12.4], [1.3, 1.5, 0.5], { round: 0.3 }), 'guard');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}


// ---------------------------------------------------------------------------------------------- Ira

/** Ira is built at 8 vox/m: 88 voxels = 11 m */
export const IRA_RES = 8;
/** the ape at 6 vox/m: 90 voxels = 15 m */
export const APE_RES = 6;

/** The kaiju's torso (a humanoid spec on the animal body; the legs fields are unused). */
const ISPEC: HumanoidSpec = {
  H: 88,
  chinY: 74,
  head: { w: 12, d: 13, h: 13 },
  neckR: 5.4,
  shoulder: [18.5, 67, 0],
  upperArm: 16,
  foreArm: 15,
  hand: 8,
  armR: 5.2,
  hipsY: 50,
  hip: [0, 0, 0],
  kneeY: 0,
  ankleY: 0,
  chest: [16, 10],
  waist: [13, 9.5],
  hips: [13, 9.5],
  chestY: 60,
  waistY: 51,
  foot: { len: 0, w: 0, heel: 0 },
};

/** the animal body: the barrel's pivot, the four elephant legs, the tail */
const KAIJU = {
  barrel: [0, 34, -18] as V3,
  fore: { hip: [10, 32, 0] as V3, knee: [10.5, 17, 1] as V3, ankle: [10.5, 4, 0] as V3 },
  hind: { hip: [10, 33, -40] as V3, knee: [10.5, 17, -42] as V3, ankle: [10.5, 4, -41] as V3 },
  tail: [0, 38, -52] as V3,
};

function iraPalette(b: ModelBuilder): void {
  palette(b);
  b.mat('shell', ['#F6F4EC', '#EEEBE2', '#DEDACD', '#C9C4B5', '#ADA796'], { base: 1, rough: 0.45, shadeK: 0.95 });
  b.mat('piston', ['#958EA6', '#77708A', '#5F5973', '#57516A'], { base: 1, rough: 0.35, metal: 0.4 });
  b.mat('tube', ['#2E2E33', '#1B1B1E', '#141418'], { base: 1, rough: 0.4, metal: 0.2 });
  b.mat('fur', ['#3E2F26', '#2A1E17', '#1E1612', '#141418'], { base: 1, rough: 0.9, shadeK: 0.9 });
}

function kaijuSkeleton(b: ModelBuilder, s: HumanoidSpec, K: typeof KAIJU, foreParent = 'hips'): Landmarks {
  const sh = s.shoulder;
  const elbow: V3 = [sh[0], sh[1] - s.upperArm, sh[2]];
  const wrist: V3 = [sh[0], elbow[1] - s.foreArm, sh[2]];
  b.bone('root', null, [0, 0, 0]);
  b.bone('hips', 'root', K.barrel);
  b.bone('spine', 'hips', [0, s.waistY - 1, 0]);
  b.bone('chest', 'spine', [0, s.chestY - 4, 0]);
  b.bone('neck', 'chest', [0, s.chinY - 4, -0.5]);
  b.bone('head', 'neck', [0, s.chinY + 0.5, -0.5]);
  b.boneSym('shoulder.L', 'chest', [4, sh[1] - 1, sh[2]]);
  b.boneSym('upperarm.L', 'shoulder.L', sh);
  b.boneSym('forearm.L', 'upperarm.L', elbow);
  b.boneSym('hand.L', 'forearm.L', wrist);
  b.boneSym('palm.L', 'hand.L', wrist);
  b.boneSym('fist.L', 'hand.L', wrist);
  b.boneSym('fthigh.L', foreParent, K.fore.hip);
  b.boneSym('fshin.L', 'fthigh.L', K.fore.knee);
  b.boneSym('ffoot.L', 'fshin.L', K.fore.ankle);
  b.boneSym('thigh.L', 'hips', K.hind.hip);
  b.boneSym('shin.L', 'thigh.L', K.hind.knee);
  b.boneSym('foot.L', 'shin.L', K.hind.ankle);
  b.bone('tail1', 'hips', K.tail);
  b.bone('tail2', 'tail1', [K.tail[0], K.tail[1] - 14, K.tail[2] - 16]);
  return { spec: s, headC: [0, s.chinY + s.head.h / 2, -0.5], elbow, wrist, knee: K.hind.knee, ankle: K.hind.ankle };
}

/** An elephant leg: a thick column, the white carapace over the joints, three big toes. */
function elephantLeg(b: ModelBuilder, bones: [string, string, string], hip: V3, knee: V3, ankle: V3, mat: string, mirror: boolean): void {
  const o = { mirror };
  b.add(bones[0], blend(2, sphere(hip, 7.5), capsule(hip, knee, 6.4, 5.4)), mat, o);
  b.add(bones[1], blend(1.6, sphere(knee, 5.6), capsule(knee, [ankle[0], ankle[1] + 2, ankle[2]], 5.2, 4.8)), mat, o);
  b.add(bones[1], intersect(sphere(knee, 6.8), halfSpace([0, 0, knee[2] - 1], [0, 0, -1])), 'shell', o);
  b.add(bones[2], blend(1.4, cylinder([ankle[0], 0, ankle[2]], [ankle[0], ankle[1] + 3, ankle[2]], 5.6, 5, 1.5)), mat, o);
  for (const dx of [-3, 0, 3]) b.add(bones[2], ellipsoid([ankle[0] + dx, 1.4, ankle[2] + 4.4], [1.6, 1.4, 1.6]), 'shell', o);
  b.paint(bones[2], aabb([ankle[0] - 7, 0, ankle[2] - 7], [ankle[0] + 7, 1, ankle[2] + 7]), mat, { shade: 4, mirror, where: b.isMat(mat) });
}

export function buildIra(): CharacterAsset {
  const b = new ModelBuilder('yammy-ira', IRA_RES);
  iraPalette(b);
  const s = ISPEC;
  const L = kaijuSkeleton(b, s, KAIJU);
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 6.4, wz + 0.6]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 6.4, wz + 0.6]);
  b.socket('palm.R', 'palm.R', [-wx + 0.8, wy - 6.5, wz + 1.6]);
  b.socket('palm.L', 'palm.L', [wx - 0.8, wy - 6.5, wz + 1.6]);
  b.socket('chest.front', 'chest', [0, s.chestY, s.chest[1] + 1]);
  b.socket('back', 'chest', [0, s.chestY + 2, -s.chest[1] - 1]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 6, hd.front]);
  b.socket('mouth', 'head', [0, s.chinY + 2.5, hd.front + 1]);
  b.stamp('head', hd.x0, hd.chin + 9, FACE, { ...faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'pupil', hi: 'sclera', mouth: 'mouth' }), G: { mat: 'mark' } }, hd.front - 1);
  // the flame estigma: from under the eyes sweeping back along the cheeks to the temples
  for (const k of [-1, 1]) b.add('head', spike([k * 5.6, s.chinY + 4, hd.front - 1.5], [k * 0.15, 0.55, -1], 7, 1.0, 0.5, { side: [1, 0, 0], tip: 0.3 }), 'mark', { thr: 0.25 });
  // the head plates: two great bone plates from the brow sweeping back over the skull and past it
  for (const k of [-1, 1])
    b.add('head', spike([k * 2.6, s.chinY + 11.2, hd.front - 1.5], [k * 0.2, 0.12, -1], 18, 3.2, 1.3, { side: [1, 0, 0], bend: [k * 0.1, 0.22, 0], taper: 0.6, tip: 0.5 }), 'bone', { thr: 0.25 });
  b.paint('head', aabb([-10, s.chinY + 11.5, -40], [10, s.chinY + 20, 40]), 'bone');
  // the mask is his jaw now: the lower face turned to bone, eight teeth standing along it
  b.paint('head', aabb([-10, s.chinY - 3, hd.front - 9], [10, s.chinY + 1.5, hd.front + 2]), 'bone');
  teeth(b, s.chinY, hd.front, 2.2);
  // a longer ponytail
  b.bone('tail.hair', 'head', [0, s.chinY + 11, L.headC[2] - 6.5]);
  const pt = smoothPath([[0, s.chinY + 10.5, L.headC[2] - 7], [0, s.chinY + 4, L.headC[2] - 9], [0, s.chinY - 6, L.headC[2] - 10], [0, s.chinY - 16, L.headC[2] - 9]], 5);
  b.add('tail.hair', tube(pt, pt.map((_, i) => 1.4 - i * 0.04)), 'hair', { thr: 0.25 });
  // the colossal torso, the hole through the chest
  const [cx, cz] = s.chest, [wwx, wwz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const torso = blend(5,
    box([0, s.chestY - 0.5, 0], [cx, 9, cz], { round: 5.5 }),
    box([0, s.waistY, 0.4], [wwx, 7, wwz], { round: 5 }),
    capsule([4, sy + 4, sz - 1.4], [sx - 2.5, sy - 0.5, sz], 6, 5.6), capsule([-4, sy + 4, sz - 1.4], [-sx + 2.5, sy - 0.5, sz], 6, 5.6),
    sphere([sx, sy - 1, sz], 7), sphere([-sx, sy - 1, sz], 7),
    ellipsoid([6.5, s.chestY + 2.5, cz - 1], [7.4, 5.4, 3.4]), ellipsoid([-6.5, s.chestY + 2.5, cz - 1], [7.4, 5.4, 3.4]));
  lappedBands(b, torso, 'skin', [['spine', 38, s.chestY - 6], ['chest', s.chestY - 6, 90]]);
  b.add('neck', capsule([0, s.chinY - 7, L.headC[2] - 1], [0, s.chinY + 2, L.headC[2] - 1], s.neckR), 'skin');
  const hy = s.chestY - 5;
  b.carve(['chest', 'spine'], cylinder([0, hy, -18], [0, hy, 18], 3.6));
  b.paint(['chest', 'spine'], cylinder([0, hy, -18], [0, hy, 18], 4.6), 'void', { where: b.isMat('skin') });
  // "0": the "1" melted away
  b.paint('upperarm.L', fn((x, y, z) => Math.max(Math.abs(Math.hypot((y - (sy - 6)) / 1.6, z - sz) - 2) - 0.55, sx + 3 - x), [sx, sy - 12, sz - 6], [sx + 9, sy, sz + 6]), 'ink', { where: b.isMat('skin') });
  // five black tubes on the back, half the length of the elbow pistons
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * 4.2;
    b.add('chest', capsule([x, s.chestY + 4 - Math.abs(i - 2), -cz + 1], [x * 1.1, s.chestY + 10 - Math.abs(i - 2), -cz - 6], 1.4), 'tube', { thr: 0.25 });
  }
  // arms: huge; piston tubes on the elbows; six black nodules along each forearm
  const ey = L.elbow[1];
  b.add('upperarm.L', blend(2, sphere([sx, sy - 1, sz], 6.4), capsule([sx, sy - 2, sz], [sx, ey + 1, sz], 6, 5.2)), 'skin', { mirror: true });
  b.add('forearm.L', blend(1.8, sphere([sx, ey, sz], 5.4), capsule([sx, ey - 0.5, sz], [sx, wy + 1.5, sz], 5.6, 4.4)), 'skin', { mirror: true });
  b.add('forearm.L', capsule([sx, ey + 4, sz - 5.6], [sx, ey - 9, sz - 5.2], 1.9), 'piston', { mirror: true, thr: 0.25 });
  b.add('forearm.L', cylinder([sx, ey + 5, sz - 5.6], [sx, ey + 2, sz - 5.6], 2.6, 2.6, 0.6), 'piston', { mirror: true });
  for (let i = 0; i < 6; i++) {
    const t = Math.min(1, (1.5 + i * 2.5) / (ey - 0.5 - wy - 1.5));
    b.add('forearm.L', sphere([sx + 5.5 - 1.1 * t, ey - 2 - i * 2.5, sz + 1.2], 0.9), 'tube', { mirror: true, thr: 0.1 });
  }
  bigHands(b, L, 1.5);
  // the animal body: a long white trunk from under his waist back to the tail
  const trunk = blend(4,
    ellipsoid([0, 36, -18], [15, 15, 30]),
    ellipsoid([0, 40, 2], [13.5, 12, 10]),
    ellipsoid([0, 34, -44], [13, 12.5, 10]));
  b.add('hips', trunk, 'shell');
  // carapace plates along the back of the trunk, a ridge down the spine
  for (let i = 0; i < 6; i++) b.paint('hips', fn((x, y, z) => Math.abs(z - (8 - i * 10)) - 0.6, [-20, 20, -60], [20, 60, 20]), 'shell', { shade: 3, where: b.isMat('shell') });
  for (let i = 0; i < 7; i++) {
    const z = 6 - i * 9;
    b.add('hips', spike([0, z > -28 ? 49.5 : 45, z], [0, 1, -0.3], 3.5, 2.2, 1.2, { tip: 0.3 }), 'shell', { thr: 0.25 });
  }
  // the legs
  for (const [bones, leg] of [[['fthigh.L', 'fshin.L', 'ffoot.L'], KAIJU.fore], [['thigh.L', 'shin.L', 'foot.L'], KAIJU.hind]] as [[string, string, string], typeof KAIJU.fore][])
    elephantLeg(b, bones, leg.hip, leg.knee, leg.ankle, 'shell', true);
  // the tail: segments tapering back to the bony club
  const t0 = KAIJU.tail, t1: V3 = [t0[0], t0[1] - 14, t0[2] - 16];
  b.add('tail1', blend(2, capsule(t0, [t1[0], t1[1] + 2, t1[2] + 2], 6.4, 4.6)), 'shell');
  b.add('tail2', blend(2, capsule(t1, [t1[0], t1[1] - 10, t1[2] - 16], 4.4, 3.4), ellipsoid([t1[0], t1[1] - 12, t1[2] - 20], [7.5, 5.4, 7.5])), 'shell');
  for (const [dx, dy, dz] of [[-5.5, 0, 0], [5.5, 0, 0], [0, 4, 2], [0, -3.5, -3], [-3, 2, -5], [3, 2, -5]] as V3[])
    b.add('tail2', spike([t1[0] + dx * 0.9, t1[1] - 12 + dy, t1[2] - 20 + dz], [dx, dy, dz - 0.5], 3.6, 1.8, 1.0, { tip: 0.3 }), 'shell', { thr: 0.25 });
  for (let i = 0; i < 4; i++) b.paint(['tail1', 'tail2'], fn((x, y, z) => Math.abs(y - z * 0.6 - (12 - i * 9)) - 0.7, [-12, -20, -110], [12, 60, -40]), 'shell', { shade: 3, where: b.isMat('shell') });
  b.autoShade();
  b.lint();
  const springs: SpringDef[] = [
    { bone: 'tail.hair', tail: [0, -2.0, -0.2], stiffness: 50, damping: 4, gravity: 10, limit: 50, radius: 0.2 },
    { bone: 'tail1', tail: [0, -1.7, -2.0], stiffness: 120, damping: 7, gravity: 4, limit: 20, radius: 0.6 },
    { bone: 'tail2', tail: [0, -1.5, -2.4], stiffness: 80, damping: 6, gravity: 6, limit: 25, radius: 0.6 },
  ];
  return { model: b.build(), springs, colliders: [], warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- the ape

/** the ape: a knuckle-walker; the arms are the front legs (on the chest), the short hairy legs behind */
const APE_SPEC: HumanoidSpec = { ...ISPEC, H: 90, chinY: 62, shoulder: [20, 56, 6], upperArm: 20, foreArm: 18, hand: 9, armR: 6.4, chest: [18, 13], waist: [16, 12.5], hips: [15, 12], chestY: 50, waistY: 40 };
const APE = {
  barrel: [0, 30, -10] as V3,
  fore: { hip: [21, 56, 8] as V3, knee: [22, 34, 10] as V3, ankle: [22, 5, 9] as V3 },
  hind: { hip: [11, 26, -20] as V3, knee: [12, 14, -14] as V3, ankle: [12, 4, -18] as V3 },
  tail: [0, 26, -30] as V3,
};

export function buildApe(): CharacterAsset {
  const b = new ModelBuilder('yammy-ape', APE_RES);
  iraPalette(b);
  const s = APE_SPEC;
  // the arms here are the front legs: the humanoid arm bones exist but stay empty (clips swing the legs)
  const L = kaijuSkeleton(b, s, APE, 'chest');
  b.socket('chest.front', 'chest', [0, s.chestY, s.chest[1] + 1]);
  b.socket('back', 'chest', [0, s.chestY + 4, -s.chest[1] - 1]);
  b.socket('grip.R', 'ffoot.R', [-APE.fore.ankle[0], APE.fore.ankle[1] + 2, APE.fore.ankle[2] + 2]);
  b.socket('grip.L', 'ffoot.L', [APE.fore.ankle[0], APE.fore.ankle[1] + 2, APE.fore.ankle[2] + 2]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 6, hd.front]);
  b.socket('mouth', 'head', [0, s.chinY + 2.5, hd.front + 1]);
  b.stamp('head', hd.x0, hd.chin + 9, FACE, { ...faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'pupil', hi: 'sclera', mouth: 'mouth' }), G: { mat: 'mark' } }, hd.front - 1);
  // crack marks framing the eyes
  for (const k of [-1, 1]) {
    b.add('head', spike([k * 5.6, s.chinY + 8, hd.front - 0.5], [k * 0.3, 1, -0.4], 4, 0.7, 0.4, { side: [1, 0, 0], tip: 0.3 }), 'mark', { thr: 0.25 });
    b.add('head', spike([k * 5.6, s.chinY + 4, hd.front - 0.5], [k * 0.4, -0.8, -0.4], 4, 0.7, 0.4, { side: [1, 0, 0], tip: 0.3 }), 'mark', { thr: 0.25 });
  }
  // the crown of horns, some curling down over the jaw
  b.add('head', intersect(ellipsoid([0, s.chinY + 9, L.headC[2]], [6.8, 6.2, 7.6]), halfSpace([0, s.chinY + 10, 0], [0, -1, 0])), 'bone');
  for (let i = 0; i < 7; i++) {
    const a = ((i - 3) / 3) * 1.2;
    b.add('head', spike([Math.sin(a) * 5.6, s.chinY + 12, L.headC[2] + Math.cos(a) * 5], [Math.sin(a) * 0.6, 1, Math.cos(a) * 0.3 - 0.3], 5 + (3 - Math.abs(i - 3)) * 1.5, 1.6, 1.1, { tip: 0.3 }), 'bone', { thr: 0.25 });
  }
  for (const k of [-1, 1]) b.add('head', spike([k * 6.2, s.chinY + 6, hd.front - 3], [k * 0.4, -1, 0.5], 7, 1.6, 1.1, { bend: [0, 0, 0.4], tip: 0.3 }), 'bone', { thr: 0.25 });
  b.paint('head', aabb([-10, s.chinY - 3, hd.front - 9], [10, s.chinY + 1.5, hd.front + 2]), 'bone');
  teeth(b, s.chinY, hd.front, 2.2);
  // a hunched torso and a portly belly hung low between the arms and legs
  const torso = blend(6,
    ellipsoid([0, 50, 2], [19, 14, 14]),
    ellipsoid([0, 36, -6], [17, 13, 15]),
    ellipsoid([0, 26, -18], [14, 10, 12]),
    sphere([20, 55, 6], 8), sphere([-20, 55, 6], 8));
  lappedBands(b, torso, 'skin', [['hips', 0, 34], ['spine', 34, 44], ['chest', 44, 80]]);
  b.add('neck', capsule([0, s.chinY - 6, L.headC[2] - 1], [0, s.chinY + 2, L.headC[2] - 1], 6.2), 'skin');
  const hy = 47;
  b.carve(['chest', 'spine'], cylinder([0, hy, -20], [0, hy, 22], 4));
  b.paint(['chest', 'spine'], cylinder([0, hy, -20], [0, hy, 22], 5), 'void', { where: b.isMat('skin') });
  // two great horns on the back
  for (const k of [-1, 1]) b.add('chest', spike([k * 7, 60, -8], [k * 0.35, 1, -0.5], 18, 3.6, 2.4, { bend: [k * 0.1, 0, -0.2], tip: 0.3 }), 'bone', { thr: 0.25 });
  // the arms as front legs: huge, knuckles down
  const F = APE.fore;
  b.add('fthigh.L', blend(2.4, sphere(F.hip, 8), capsule(F.hip, F.knee, 7.4, 6.2)), 'skin', { mirror: true });
  b.add('fshin.L', blend(2, sphere(F.knee, 6.4), capsule(F.knee, [F.ankle[0], F.ankle[1] + 4, F.ankle[2]], 6.6, 5.2)), 'skin', { mirror: true });
  b.add('ffoot.L', box([F.ankle[0], 4, F.ankle[2] + 1], [5.4, 4.4, 5.6], { round: 2.4 }), 'skin', { mirror: true });
  for (const dz of [-2.6, 0, 2.6]) b.paint('ffoot.L', aabb([F.ankle[0] - 6, 0, F.ankle[2] + 1 + dz - 0.3], [F.ankle[0] + 6, 3, F.ankle[2] + 1 + dz + 0.3]), 'skin', { shade: 4, mirror: true, where: b.isMat('skin') });
  for (let i = 0; i < 6; i++) b.add('fshin.L', sphere([F.knee[0] + 5.6, F.knee[1] - 4 - i * 4, F.knee[2] + 1], 1.5), 'tube', { mirror: true, thr: 0.25 });
  // short hairy legs, stubby toes
  const H = APE.hind;
  b.add('thigh.L', blend(2, sphere(H.hip, 7.5), capsule(H.hip, H.knee, 7, 6)), 'fur', { mirror: true });
  b.add('shin.L', capsule(H.knee, [H.ankle[0], H.ankle[1] + 2, H.ankle[2]], 5.8, 5), 'fur', { mirror: true });
  b.add('foot.L', box([H.ankle[0], 2.5, H.ankle[2] + 3], [4.6, 2.5, 6], { round: 2 }), 'skin', { mirror: true });
  b.paint(['thigh.L', 'thigh.R', 'shin.L', 'shin.R'], fn((x, y, z) => Math.abs(((x * 1.3 + z * 0.9 + y * 0.2 + 60) % 2.4) - 1.2) - 0.35, [-30, 0, -40], [30, 40, 10]), 'fur', { shade: 3, where: b.isMat('fur') });
  // a hairy tail
  const t0 = APE.tail, t1: V3 = [t0[0], t0[1] - 14, t0[2] - 16];
  b.add('tail1', capsule(t0, [t1[0], t1[1] + 2, t1[2] + 2], 4.4, 3.4), 'fur');
  b.add('tail2', capsule(t1, [t1[0], t1[1] - 6, t1[2] - 14], 3.4, 2.2), 'fur');
  b.autoShade();
  b.lint();
  const springs: SpringDef[] = [
    { bone: 'tail1', tail: [0, -2.3, -2.7], stiffness: 90, damping: 6, gravity: 6, limit: 25, radius: 0.6 },
    { bone: 'tail2', tail: [0, -1, -2.3], stiffness: 60, damping: 5, gravity: 8, limit: 30, radius: 0.5 },
  ];
  return { model: b.build(), springs, colliders: [], warnings: b.warnings };
}
