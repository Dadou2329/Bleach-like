// Kaname Tōsen (docs/roster/B2-captains-2.md), as he stood in Aizen's army: 1.76 m (84 voxels), slim, wiry and
// very straight, the head a little tilted as if listening. Dark brown skin; long dark braids let down over his
// back and shoulders from neat rows on the scalp; a thin smoky band visor across his blind eyes. A white
// sleeveless coat closed over the chest and open below the waist to the knees, an orange rope slung from his
// right shoulder to under his left arm, bare upper arms and long black gloves to above the elbows, black
// hakama, white boots. Suzumushi: a plain katana with an orange hilt and a teardrop tsuba whose point juts
// below the edge, a row of tiny teardrop holes along its curve and a small ring hanging from the point.
// Masked: the smooth white Hollow mask over the whole head and throat (one seam down the middle, the braids
// out of the back), a chest plate and two slim shoulder guards in its style; the rope is gone.
// Character's left is +X.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, smoothPath, sphere, subtract, torus, tube, type Sdf, type V3 } from '../models/sdf';
import { SPEC_ADULT_MALE, coatSkirt, hakama, hands, head, humanoidSkeleton, kosodeTorso, obi, shihakushoSprings, type HumanoidSpec, type Landmarks } from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

export const TOSEN_RES = 48;
export type TosenForm = 'traitor' | 'masked';

/** Slim and wiry: narrow chest and waist, long arms. */
const SPEC: HumanoidSpec = {
  ...SPEC_ADULT_MALE,
  shoulder: [9.2, 66.5, -0.5],
  upperArm: 14.8,
  foreArm: 13.3,
  armR: 2.4,
  chest: [8, 4.7],
  waist: [6.5, 4.1],
  hips: [7.1, 4.6],
};

function palette(b: ModelBuilder): void {
  b.mat('skin', ['#86593F', '#7A5038', '#6A4530', '#5B3A29', '#4A2F21'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#4A3428', '#3B2A20', '#2C201A', '#221A18'], { base: 1, rough: 0.7, shadeK: 0.9 });
  b.mat('lip', ['#4A2A22', '#3A211B']);
  b.mat('visor', ['#8C98A4', '#5E6A76', '#46505A', '#363E46'], { base: 2, rough: 0.12, metal: 0.4 });
  b.mat('coat', ['#F3F3F0', '#EEEDE8', '#DCDBD6', '#C3C4C8', '#A6A8AE'], { base: 1, rough: 0.82, shadeK: 0.9 });
  b.mat('edge', ['#D8D9DC', '#BFC1C6']);
  b.mat('black', ['#3B3B42', '#2B2B31', '#1E1E23', '#17171B', '#141418'], { base: 2, rough: 0.88, shadeK: 1 });
  b.mat('glove', ['#34343A', '#26262B', '#1B1B1F'], { base: 1, rough: 0.55 });
  b.mat('rope', ['#F2A05A', '#E07A2C', '#B85F1E', '#8E4716'], { base: 1, rough: 0.85 });
  b.mat('boot', ['#F3F2EE', '#E2E0DA', '#C4C1BA', '#A9A59D'], { base: 1, rough: 0.6 });
  b.mat('mask', ['#F3F1E8', '#E8E4D8', '#D2CCBC', '#B4AE9E'], { base: 1, rough: 0.35, shadeK: 0.9 });
  b.mat('seam', ['#2A2A2E']);
}

/**
 * Rows top → bottom from chin + 9 (column 0 is his right). The visor band across the eyes (a lighter lens
 * line along it), the nose's shadow, a calm closed mouth.
 */
const FACE = [
  '. . . . . . . . . .',
  '. . . . . . . . . .',
  '. . b b . . b b . .',
  'V V V V V V V V V V',
  'V v v v V V v v v V',
  '. . . . . . . . . .',
  '. . . . s s . . . .',
  '. . . . . . . . . .',
  '. . . m m m m . . .',
  '. . . . . . . . . .',
];

const assetCache = new Map<TosenForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function tosenAsset(form: TosenForm = 'traitor'): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildTosen(form)));
  return a;
}

export type TosenProp = 'suzumushi' | 'sheath' | 'sheath-empty';

export function tosenProp(kind: TosenProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) propCache.set(kind, (m = kind === 'suzumushi' ? buildSuzumushi() : buildSheath(kind === 'sheath')));
  return m;
}

/** Suzumushi's blade in its prop frame (m): from just past the guard to the tip, along +Z */
export const SUZUMUSHI_BASE: V3 = [0, 0, 4 / 48];
export const SUZUMUSHI_TIP: V3 = [0, 0, 38 / 48];
/** the ring hanging from the tsuba's point (prop frame, m): the Bankai's dome rings grow out of it */
export const SUZUMUSHI_RING: V3 = [0, -4.6 / 48, 2.2 / 48];

export function buildTosen(form: TosenForm = 'traitor'): CharacterAsset {
  const b = new ModelBuilder(`tosen-${form}`, TOSEN_RES);
  palette(b);
  const s = SPEC;
  const L = humanoidSkeleton(b, s, { hakama: true });
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 5, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5, wz + 1]);
  b.socket('hip.L', 'hips', [s.waist[0] + 2.2, s.waistY - 3, 2.4], [-26, 180, -10]);
  b.socket('chest.front', 'chest', [0, s.chestY, 6]);
  b.socket('back', 'chest', [0, s.chestY, -6.5]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('mouth', 'head', [0, s.chinY + 1.5, hd.front]);
  // a lean face: the jaw shaved in a little, the cheekbones kept
  for (const k of [-1, 1]) b.carve('head', box([k * 5.4, hd.chin + 1.2, hd.front - 2], [0.8, 2.2, 3], { rot: [0, 0, k * 18] }));
  b.stamp('head', hd.x0, hd.chin + 9, FACE, {
    V: { mat: 'visor', proud: 1 }, v: { mat: 'visor', shade: 0, proud: 1 }, b: { mat: 'hair', shade: 2 }, s: { mat: 'skin', shade: 3 }, m: { mat: 'lip' },
  }, hd.front - 1);
  // the visor wraps round to the ears
  const cranium = box([0, hd.chin + 4 + (s.head.h - 4) / 2, hd.front - s.head.d / 2], [s.head.w / 2, (s.head.h - 4) / 2, s.head.d / 2], { round: 2.2 });
  b.add('head', intersect(subtract(offset(cranium, 0.8), offset(cranium, -0.4)), aabb([-20, hd.chin + 5, hd.front - 7], [20, hd.chin + 7, hd.front + 2])), 'visor', { thr: 0.2 });
  b.paint('head', aabb([-20, hd.chin + 5, hd.front - 8], [20, hd.chin + 6, hd.front + 2]), 'visor', { shade: 0, where: b.isMat('visor') });
  const hair = braids(b, L, hd, form === 'traitor');
  hands(b, L, 'glove');
  arms(b, L);
  boots(b, L);
  const o = { black: 'coat', collar: 'edge', skin: 'black', obi: 'coat', crossY: s.chestY - 2, hakamaHem: 9, hemR: 7.6 };
  const torso = kosodeTorso(b, L, o);
  // an armhole each side: the coat ends at the shoulder, the bare arm comes out of it
  obi(b, L, { ...o, obi: 'coat' });
  hakama(b, L, { ...o, black: 'black' });
  const skirt = coatSkirt(b, L, { mat: 'coat', lining: 'edge', yTop: s.waistY - 2, yHem: 14, r0: 9.4, r1: 11.8, openFront: 16, res: TOSEN_RES });
  if (form === 'traitor') rope(b, L, torso);
  else mask(b, L, hd, torso);
  b.autoShade();
  b.lint();
  const base = shihakushoSprings();
  const springs: SpringDef[] = [...base.springs.filter((sp) => !sp.bone.startsWith('sleeve')), ...skirt.springs, ...hair.springs];
  const colliders: ColliderDef[] = [...base.colliders, ...skirt.colliders, ...hair.colliders];
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- head

/**
 * Neat rows of braids from the hairline back over the scalp, let down: a mass of long braids down his back
 * (a spring bone), a few in front of each shoulder (spring bones), each braid banded so the plait reads.
 */
function braids(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }, front3 = true): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const c = hd.chin, front = hd.front, back = front - s.head.d;
  const hw = s.head.w / 2;
  const top = c + s.head.h;
  // the scalp: a close cap of hair with raised rows running back from the hairline
  const cap = intersect(ellipsoid([0, c + s.head.h * 0.62, (front + back) / 2 - 0.3], [hw + 1, s.head.h * 0.52, s.head.d / 2 + 1.1]), halfSpace([0, c + 6.6, 0], [0, -1, 0.35]));
  b.add('head', cap, 'hair');
  for (let i = -2; i <= 2; i++) {
    const x = i * 1.9;
    const row = smoothPath([[x * 0.9, top - 0.6, front - 1.2], [x, top + 0.4, front - 4.5], [x * 1.05, top - 0.2, back + 3], [x * 1.1, c + 6, back - 0.6]], 3);
    b.add('head', tube(row, row.map(() => 0.85)), 'hair', { thr: 0.3 });
  }
  b.paint('head', fn((x, y, z) => Math.abs(((x + 40) % 1.9) - 0.95) - 0.35, [-hw - 2, c + 6, back - 2], [hw + 2, top + 2, front]), 'hair', { shade: 3, where: b.isMat('hair') });
  // the bones the long braids hang from: the back of the head, and behind each ear
  const nape: V3 = [0, c + 4, back + 1.5];
  b.bone('braids.B', 'head', nape);
  b.bone('braids.L', 'head', [hw - 0.5, c + 5, back + 4.5]);
  b.bone('braids.R', 'head', [-hw + 0.5, c + 5, back + 4.5]);
  /** one braid: a banded plait from p0 along the control points */
  const plait = (bone: string, ctrl: V3[], r: number) => {
    const pts = smoothPath(ctrl, 4);
    const radii = pts.map((_, i) => r * (1 - (i / pts.length) * 0.35));
    b.add(bone, tube(pts, radii), 'hair', { thr: 0.25 });
    // the plait: a darker band every couple of voxels along it
    for (let i = 1; i < pts.length; i += 2) b.paint(bone, sphere(pts[i], radii[i] + 0.4), 'hair', { shade: 3, where: b.isMat('hair') });
  };
  // the back mass: braids fanned across the back of the head, joined at the root
  b.add('braids.B', ellipsoid([0, c + 4.5, back + 1.4], [hw - 0.4, 3.2, 2]), 'hair');
  for (let i = 0; i < 9; i++) {
    const u = i / 8 - 0.5;
    const x0 = u * (2 * hw - 2.4);
    const len = 25 + (i % 3) * 2 - Math.abs(u) * 5;
    plait('braids.B', [[x0, c + 5, back + 1.2], [x0 * 1.2, c + 1, back - 0.4], [x0 * 1.45, c - 6, back - 1.6], [x0 * 1.6, c + 5 - len, back - 2.2]], 1.15);
  }
  // in front of each shoulder: three braids falling past the collarbone (masked, they all go out of the back)
  for (const k of front3 ? [-1, 1] : []) {
    const bone = k > 0 ? 'braids.L' : 'braids.R';
    b.add(bone, ellipsoid([k * (hw - 0.5), c + 5, back + 4.4], [1.6, 2.6, 2.4]), 'hair');
    for (let i = 0; i < 3; i++) {
      const z0 = back + 3.4 + i * 1.3;
      plait(bone, [[k * (hw - 0.4), c + 5.5, z0], [k * (hw + 0.8), c + 1, z0 + 0.6], [k * (hw + 1.6 + i * 0.3), c - 6, z0 + 1.6], [k * (hw + 1.8 + i * 0.4), c - 16 + i * 2, z0 + 2.2]], 1.05);
    }
  }
  const springs: SpringDef[] = [
    { bone: 'braids.B', tail: [0, -0.5, -0.06], stiffness: 34, damping: 4.5, gravity: 11, limit: 70, radius: 0.09 },
    { bone: 'braids.L', tail: [0.03, -0.3, 0.06], stiffness: 40, damping: 5, gravity: 11, limit: 60, radius: 0.05 },
    { bone: 'braids.R', tail: [-0.03, -0.3, 0.06], stiffness: 40, damping: 5, gravity: 11, limit: 60, radius: 0.05 },
  ];
  const colliders: ColliderDef[] = [
    { bone: 'chest', offset: [0, 0.04, -0.02], radius: 0.17 },
    { bone: 'chest', offset: [0, 0.16, -0.04], radius: 0.13 },
    { bone: 'spine', offset: [0, 0, -0.02], radius: 0.14 },
  ];
  return { springs, colliders };
}

// ---------------------------------------------------------------------------------------------- body

/** Bare dark arms out of the sleeveless coat, long black gloves from the hand to above the elbow. */
function arms(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(1.2, sphere([sx, sy - 0.5, sz], 3), capsule([sx, sy - 1, sz], [sx, ey + 0.5, sz], 2.6, 2.2)), 'skin', { mirror: true });
  b.add('upperarm.L', capsule([sx, ey + 4.5, sz], [sx, ey + 0.2, sz], 2.55, 2.35), 'glove', { mirror: true });
  b.add('forearm.L', blend(1, sphere([sx, ey, sz], 2.4), capsule([sx, ey - 0.5, sz], [sx, wy + 0.5, sz], 2.45, 1.95)), 'glove', { mirror: true });
  // the cuff at the top of the glove
  b.add('upperarm.L', torus([sx, ey + 4.6, sz], 2.55, 0.65), 'glove', { mirror: true, thr: 0.2 });
}

/** White boots to mid-shin over the hakama's hem. */
function boots(b: ModelBuilder, L: Landmarks): void {
  const [ax, ay, az] = L.ankle;
  const f = L.spec.foot;
  b.add('shin.L', cylinder([ax, ay + 1, az], [ax, ay + 12, az + 0.3], 3, 3.6, 1), 'boot', { mirror: true });
  b.add('shin.L', torus([ax, ay + 12, az + 0.3], 3.6, 0.8), 'boot', { mirror: true, thr: 0.2 });
  b.paint('shin.L', aabb([ax - 6, ay + 4, az - 6], [ax + 6, ay + 4.8, az + 6]), 'boot', { shade: 2, mirror: true, where: b.isMat('boot') });
  b.add('foot.L', capsule([ax, ay + 2.5, az - 0.4], [ax, ay - 1.5, az - 0.4], 2.8), 'boot', { mirror: true });
  b.add('foot.L', intersect(box([ax, 2.4, az + (f.len / 2 - f.heel)], [f.w / 2 + 0.3, 2.4, f.len / 2 + 0.3], { round: 1.4 }), halfSpace([0, 4.6, az + f.len - f.heel - 3], [0, 1, 0.7])), 'boot', { mirror: true });
  b.paint('foot.L', aabb([ax - 6, 0, az - 6], [ax + 6, 1, az + 16]), 'boot', { shade: 3, mirror: true });
}

/** The orange rope slung from his right shoulder across the chest to under his left arm, and round the back. */
function rope(b: ModelBuilder, L: Landmarks, torso: Sdf): void {
  const s = L.spec;
  const [sx, sy] = s.shoulder;
  /** a point on the coat's surface along a direction from the body axis, at height y */
  const surf = (x: number, y: number, zSign: number): V3 => {
    for (let z = zSign * 14; Math.abs(z) > 0; z -= zSign * 0.1) if (torso.d(x, y, z) <= 0.5) return [x, y, z];
    return [x, y, 0];
  };
  const frontPts: V3[] = [[-sx + 2.2, sy + 1.6, -0.8], surf(-5.5, s.chestY + 3, 1), surf(-1.5, s.chestY - 0.5, 1), surf(2.5, s.chestY - 4, 1), surf(6, s.chestY - 7, 1), [s.chest[0] + 1.4, s.chestY - 8.5, 0]];
  const backPts: V3[] = [[s.chest[0] + 1.4, s.chestY - 8.5, 0], surf(6, s.chestY - 7, -1), surf(2.5, s.chestY - 4, -1), surf(-1.5, s.chestY - 0.5, -1), surf(-5.5, s.chestY + 3, -1), [-sx + 2.2, sy + 1.6, -0.8]];
  for (const pts of [frontPts, backPts]) {
    const path = smoothPath(pts, 3);
    b.add('chest', tube(path, path.map(() => 1.15)), 'rope', { thr: 0.2 });
    // the twist of the rope
    for (let i = 0; i < path.length; i += 2) b.paint('chest', sphere(path[i], 1.5), 'rope', { shade: 2, where: b.isMat('rope') });
  }
}

/** The Hollow mask over the whole head and throat, the seam down its middle; a chest plate and two shoulder guards. */
function mask(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }, torso: Sdf): void {
  const s = L.spec;
  const c = hd.chin, front = hd.front, back = front - s.head.d;
  const hw = s.head.w / 2;
  // an egg over the head, open at the back for the braids, down over the throat
  const egg = blend(1.5, ellipsoid([0, c + 6.5, (front + back) / 2 + 0.6], [hw + 1.4, s.head.h * 0.66, s.head.d / 2 + 1.6]), capsule([0, c - 4, -0.6], [0, c + 2, 0.6], 3.6, 4.6));
  const shell = subtract(egg, ellipsoid([0, c + 6.8, (front + back) / 2 + 0.2], [hw + 0.2, s.head.h * 0.6, s.head.d / 2 + 0.4]), ellipsoid([0, c + 3.5, back - 1.5], [3.6, 3.4, 3]));
  b.add('head', intersect(shell, halfSpace([0, c - 1, 0], [0, -1, 0])), 'mask');
  b.add('neck', intersect(capsule([0, c - 6, -0.6], [0, c + 1, 0.4], 3.7, 3.9), halfSpace([0, 0, -2.4], [0, 0, -1])), 'mask');
  // the seam down the middle of the face and over the crown
  b.paint(['head', 'neck'], fn((x) => Math.abs(x) - 0.9, [-1, c - 8, back - 6], [1, c + 20, front + 6]), 'seam', { where: b.isMat('mask') });
  // the mouth line where it can split open: short vertical tooth lines
  for (const x of [-2.4, -1.2, 1.2, 2.4]) b.paint('head', aabb([x - 0.4, c + 0.6, front - 2], [x + 0.4, c + 2.6, front + 4]), 'seam', { where: b.isMat('mask') });
  b.paint('head', aabb([-3.4, c + 1.4, front - 2], [3.4, c + 1.8, front + 4]), 'seam', { where: b.isMat('mask') });
  // the chest plate over the coat, rounded, the seam continuing down it
  const [sx, sy] = s.shoulder;
  const plate = intersect(subtract(offset(torso, 2.4), offset(torso, 1)), aabb([-7, s.chestY - 6, 0], [7, sy + 3, 20]));
  b.add('chest', plate, 'mask');
  b.paint('chest', fn((x) => Math.abs(x) - 0.9, [-1, s.chestY - 7, 0], [1, sy + 4, 20]), 'seam', { where: b.isMat('mask') });
  // slim shoulder guards
  for (const k of [-1, 1]) b.add(k > 0 ? 'upperarm.L' : 'upperarm.R', intersect(subtract(sphere([k * sx, sy, -0.5], 4.4), sphere([k * sx, sy, -0.5], 3.2)), halfSpace([0, sy - 2, 0], [0, -1, 0])), 'mask');
}

// ---------------------------------------------------------------------------------------------- props

/**
 * Suzumushi (prop frame: the grip at the origin, the blade along +Z, the edge toward -Y): a plain katana, the
 * long grip wrapped orange over white rayskin, a teardrop tsuba — its round end over the back of the blade,
 * its point jutting below the edge, a row of tiny teardrop holes along its lower curve — and the small ring
 * hanging from its point.
 */
function buildSuzumushi(): VoxelModel {
  const b = new ModelBuilder('tosen-suzumushi', TOSEN_RES);
  b.mat('steel', ['#ECEFF3', '#D9DEE4', '#BEC5CD', '#9EA6B0'], { base: 1, rough: 0.2, metal: 0.9 });
  b.mat('edge', ['#F3F3F0'], { rough: 0.15, metal: 0.9 });
  b.mat('brass', ['#D8B45A', '#B8913A', '#8E6C26'], { base: 1, rough: 0.35, metal: 0.8 });
  b.mat('ring', ['#DDE1E6', '#C9CDD2', '#A3A8AE'], { base: 1, rough: 0.3, metal: 0.85 });
  b.mat('wrap', ['#F09A4C', '#E07A2E', '#B85F1E'], { base: 1, rough: 0.8 });
  b.mat('same', ['#EDE6D3', '#D5CCB4']);
  b.bone('root', null, [0, 0, 0]);
  // the blade: back along +Y, a gentle curve, the point clipped
  const curve = (z: number) => ((z - 4) / 34) ** 2 * 1.2;
  b.add('root', fn((x, y, z) => {
    if (z < 3 || z > 39) return 1;
    const u = (z - 3) / 36;
    const w = 1.25 - u * 0.25;
    const yc = curve(z);
    const tip = z > 35 ? (z - 35) * 0.9 : 0;
    return Math.max(Math.abs(x) - 0.45, Math.abs(y - yc) - w, y - yc - w + tip * 0.8, -(y - yc) - w + tip * 0.15);
  }, [-1, -2.5, 2], [1, 4, 40]), 'steel');
  b.paint('root', fn((x, y, z) => y - (curve(z) - 0.6), [-1, -3, 2], [1, 4, 40]), 'edge', { where: b.isMat('steel') });
  // the teardrop tsuba: round over the back, its point below the edge
  const drop = fn((x, y, z) => {
    if (Math.abs(z - 2.2) > 0.6) return Math.abs(z - 2.2) - 0.6;
    const cy = 0.8, R = 2.3;
    const d0 = Math.hypot(x, y - cy) - R;
    // the point: a cone down to y = -3.8
    const t = Math.max(0, Math.min(1, (cy - y) / (cy + 3.8)));
    const dPoint = Math.abs(x) - R * (1 - t) * 0.95;
    return y < cy ? Math.min(d0, Math.max(dPoint, -3.8 - y)) : d0;
  }, [-3, -4.5, 1], [3, 3.5, 3.5]);
  b.add('root', drop, 'brass');
  // the row of tiny teardrop holes along the lower curve
  for (const [x, y] of [[-1.5, -0.6], [-0.8, -1.8], [0, -2.6], [0.8, -1.8], [1.5, -0.6]] as [number, number][]) b.carve('root', aabb([x - 0.4, y - 0.4, 1], [x + 0.4, y + 0.4, 3.5]));
  // the ring hanging from the point
  b.add('root', torus([0, -4.6, 2.2], 0.9, 0.38, [0, 90, 0]), 'ring', { thr: 0.2 });
  b.add('root', box([0, -3.9, 2.2], [0.35, 0.5, 0.35]), 'ring');
  // the grip: rayskin wrapped orange in diamonds, a pommel
  b.add('root', box([0, 0, -4.5], [0.8, 1, 6], { round: 0.5 }), 'same');
  b.add('root', fn((x, y, z) => {
    if (z < -10.5 || z > 1.4) return 1;
    const band = Math.abs(((z + 40) % 2) - 1) - 0.4 + Math.abs(x) * 0.3;
    return Math.max(Math.hypot(x / 1, y / 1.25) - 1, band);
  }, [-2, -2, -11], [2, 2, 2]), 'wrap');
  b.add('root', box([0, 0, -11], [1, 1.2, 0.7], { round: 0.4 }), 'brass');
  b.autoShade();
  b.lint();
  return b.build();
}

/** The sheath on a cord at his left hip: black lacquer, an orange cord. */
function buildSheath(withSword: boolean): VoxelModel {
  const b = new ModelBuilder(withSword ? 'tosen-sheath' : 'tosen-sheath-empty', TOSEN_RES);
  b.mat('lacquer', ['#3A3A40', '#26262B', '#1A1A1E'], { base: 1, rough: 0.3, metal: 0.2 });
  b.mat('cord', ['#F09A4C', '#E07A2E', '#B85F1E'], { base: 1, rough: 0.8 });
  b.mat('wrap', ['#F09A4C', '#E07A2E', '#B85F1E'], { base: 1, rough: 0.8 });
  b.mat('brass', ['#D8B45A', '#B8913A', '#8E6C26'], { base: 1, rough: 0.35, metal: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', box([0, 0, 18], [0.9, 1.5, 18], { round: 0.8 }), 'lacquer');
  b.add('root', torus([0, 0, 4], 1.7, 0.45, [0, 90, 0]), 'cord', { thr: 0.2 });
  if (withSword) {
    b.add('root', fn((x, y, z) => Math.max(Math.hypot(x, y - 0.8) - 2.2, Math.abs(z + 0.6) - 0.6), [-3, -3, -2], [3, 3, 1]), 'brass');
    b.add('root', box([0, 0, -6.5], [0.9, 1.1, 6], { round: 0.5 }), 'wrap');
  }
  b.autoShade();
  b.lint();
  return b.build();
}
