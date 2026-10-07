// Orihime Inoue — Human, wielder of Shun Shun Rikka. Construction and palette from
// docs/roster/A2-karakura-allies.md §2, in the Hueco Mundo look (the white Arrancar-style dress Aizen gave
// her): 1.57 m, slender with a full bust and a soft round face; waist-length burnt-orange hair falling like a
// cape to her hips, short bangs over the top of the forehead, the sides tucked behind her ears under the two
// six-petal hairpins (light blue, at the temples); big grey eyes (classic anime). The dress: long sleeves
// with black cuffs, a high stand-up collar open at the throat and lined black, black princess seams from the
// shoulders over the bust, and a long flared skirt that wraps over at the front (black edge) and ends above
// the ankles, hemmed black; black flat shoes. 80 voxels at 51 vox/m (6.7 heads on the standard face plate).
// (verify) the exact seam layout of the dress and the shoe colour against the Hueco Mundo arc.
// Rokuten Shishun: the hair and the dress steeped in crimson, the pins burning red.
// The six fairies of Shun Shun Rikka are separate props, built at 96 vox/m (13-14 cm tall): Tsubaki (spiky
// black hair with a red streak, a cream scarf over his mouth, dark garb), Ayame (a black bob, an oversized
// red-orange hooded dress trimmed yellow), Shun'ō (a blond topknot), Hinagiku (bald, pointed ears, a lavender
// eyepatch ending in a horn, purple suit), Lily (pink hair in buns, yellow goggles, blue swimsuit, orange
// frill collar) and Baigon (brawny, bald, a white mouth-mask with gold lines and pink blossoms, long blond
// hair at the back).
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, sphere, spike, subtract, torus, type Sdf, type V3 } from '../models/sdf';
import { addBands, coatSkirt, faceLegend, hands, head, humanoidSkeleton, spikeHair, type HumanoidSpec, type Landmarks, type Spike } from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

/** 80 voxels = 1.57 m */
export const ORIHIME_RES = 80 / 1.57;
/** 'hueco' (the white dress of Las Noches), 'rokuten' (Rokuten Shishun: the hair and dress steeped in crimson) */
export type OrihimeForm = 'hueco' | 'rokuten';

/** Slender, a full bust, a small waist, rounded hips; slim arms and legs. */
const SPEC: HumanoidSpec = {
  H: 80,
  chinY: 68,
  head: { w: 10, d: 11, h: 12 },
  neckR: 2.0,
  shoulder: [7.6, 62.8, -0.5],
  upperArm: 13,
  foreArm: 11.8,
  hand: 7.6,
  armR: 1.9,
  hipsY: 42.5,
  hip: [4.2, 40, 0],
  kneeY: 22,
  ankleY: 4,
  chest: [6.0, 4.2],
  waist: [4.6, 3.4],
  hips: [6.8, 4.6],
  chestY: 57,
  waistY: 49,
  foot: { len: 10, w: 4, heel: 2.6 },
};
/** the bust's centre height */
const BUST_Y = SPEC.chestY - 1.8;
/** the skirt: top, hem, radii and the oval that hugs the hips */
const SKIRT = { top: SPEC.waistY - 1, hem: 8, r0: 6.4, r1: 12.8, open: -9, overlap: 7, profile: 0.65 };
const skirtDepth = (y: number) => 0.8 + 0.12 * Math.max(0, Math.min(1, (SKIRT.top - y) / (SKIRT.top - SKIRT.hem)));

function palette(b: ModelBuilder, form: OrihimeForm): void {
  const red = form === 'rokuten';
  b.mat('skin', ['#F9E6D8', '#F3D3C0', '#E6BFAA', '#D9AE98', '#BA8F7A'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', red ? ['#F0907A', '#DC5E4C', '#C2404A', '#9C2A3C', '#721C2E'] : ['#EFA562', '#DE7F36', '#C96D2E', '#B05A26', '#874220'], { base: 1, rough: 0.45, shadeK: 0.85, dither: 0.04 });
  b.mat('brow', [red ? '#8C2A30' : '#A0522A']);
  b.mat('lid', ['#3C2420']);
  b.mat('sclera', ['#F3F1EE']);
  b.mat('iris', [red ? '#A06C7C' : '#77778F']);
  b.mat('irisD', [red ? '#4A2030' : '#34344A']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#D08880']);
  b.mat('blush', ['#F2B0A6']);
  b.mat('white', red ? ['#F6E4E6', '#EED2D6', '#DEB8BE', '#C89AA2', '#A87A84'] : ['#F3F2EE', '#E9E7E4', '#D8D5D4', '#C4C1C6', '#A5A2AC'], { base: 1, rough: 0.8, shadeK: 0.9 });
  b.mat('whiteIn', red ? ['#D8B4BA', '#C2949C', '#A27880'] : ['#D6D3D3', '#C1BEC3', '#A3A0AA'], { base: 0, rough: 0.85 });
  b.mat('trim', ['#34343A', '#26262C', '#1C1C21', '#141418'], { base: 1, rough: 0.8 });
  b.mat('shoe', ['#3C3A42', '#2C2A32', '#201E24', '#141418'], { base: 1, rough: 0.45 });
  b.mat('pin', red ? ['#FBC0CC', '#E85A78', '#C83A58', '#A02A44', '#7C1A30'] : ['#D8F3F8', '#B0E4F0', '#94D0DE', '#7FB8CC', '#5E96AE'], { base: 1, rough: 0.3, glow: red ? 0.35 : 0.04 });
  b.mat('pinC', [red ? '#8C1521' : '#5E96AE'], { glow: red ? 0.3 : 0 });
}

/** Big round grey eyes under thin brows, a small mouth. Rows 9 → 0. */
const FACE = [
  '. . . . . . . . . .',
  '. . B B . . B B . .',
  '. L L L . . L L L .',
  'L W I I . . I I W L',
  '. W * i . . i * W .',
  '. W I I . . I I W .',
  '. . . . . s . . . .',
  '. . . . . . . . . .',
  '. . . . m m . . . .',
  '. . . . . . . . . .',
];

const assetCache = new Map<OrihimeForm, CharacterAsset>();

export function orihimeAsset(form: OrihimeForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildOrihime(form)));
  return a;
}

export function buildOrihime(form: OrihimeForm = 'hueco'): CharacterAsset {
  const b = new ModelBuilder(`orihime-${form}`, ORIHIME_RES);
  palette(b, form);
  const s = SPEC;
  const L = humanoidSkeleton(b, s);
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 4.6, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 4.6, wz + 1]);
  b.socket('chest.front', 'chest', [0, s.chestY, 7]);
  b.socket('back', 'chest', [0, s.chestY, -8]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.stamp('head', hd.x0, hd.chin + 9, FACE, faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  for (const x of [-4, 3]) b.voxel('head', x, hd.chin + 3, hd.front - 1, 'blush', 0);
  const springs: SpringDef[] = [];
  const colliders: ColliderDef[] = [];
  const full = body(b, L);
  hands(b, L, 'skin');
  shoes(b, L);
  bodice(b, L, full);
  sleeves(b, L);
  collar(b, L);
  const sk = coatSkirt(b, L, { mat: 'white', lining: 'whiteIn', yTop: SKIRT.top, yHem: SKIRT.hem, r0: SKIRT.r0, r1: SKIRT.r1, openFront: SKIRT.open, overlap: SKIRT.overlap, depth: skirtDepth, profile: SKIRT.profile, res: ORIHIME_RES });
  // a long dress, not a coat: the upper panels hang fixed from the hips, the lower ones swing a little
  springs.push(...sk.springs.filter((sp) => sp.bone.endsWith('.2')).map((sp) => ({ ...sp, stiffness: 85, damping: 7, limit: 30, radius: 0.04 })));
  colliders.push(
    { bone: 'thigh.L', offset: [0, -0.14, 0.02], radius: 0.085 },
    { bone: 'thigh.R', offset: [0, -0.14, 0.02], radius: 0.085 },
    { bone: 'shin.L', offset: [0, -0.1, 0], radius: 0.07 },
    { bone: 'shin.R', offset: [0, -0.1, 0], radius: 0.07 },
  );
  skirtTrim(b);
  hair(b, L, hd, springs, colliders);
  pins(b, L, hd);
  b.autoShade();
  b.lint();
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- body

/** The body: a curvy torso (dress-white: whatever presses through the cloth reads as cloth), legs, feet. */
function body(b: ModelBuilder, L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const torso = blend(2.6,
    box([0, s.chestY - 0.5, -0.4], [cx, 5.6, cz], { round: 3.2 }),
    box([0, s.waistY, -0.3], [wx, 4.2, wz], { round: 2.8 }),
    box([0, s.hipsY + 0.2, -0.4], [s.hips[0], 3.9, s.hips[1]], { round: 3 }),
    capsule([1.8, sy + 1.3, sz - 0.8], [sx - 1.3, sy - 0.2, sz], 2.1, 2.2),
    capsule([-1.8, sy + 1.3, sz - 0.8], [-sx + 1.3, sy - 0.2, sz], 2.1, 2.2),
    sphere([sx, sy - 0.5, sz], 2.5), sphere([-sx, sy - 0.5, sz], 2.5));
  const seat = ellipsoid([0, s.hipsY - 1.2, -s.hips[1] + 1.4], [5.8, 3.6, 2.6]);
  const full = blend(1.0, blend(1.6, torso, seat), bust());
  addBands(b, full, 'white', [['hips', 26, s.waistY - 1], ['spine', s.waistY - 1, s.chestY - 4], ['chest', s.chestY - 4, 100]]);
  const [hx, hy, hz] = s.hip;
  const [kx, ky, kz] = L.knee;
  const [ax, ay, az] = L.ankle;
  b.add('thigh.L', blend(1.4, sphere([hx, hy, hz], 3.6), capsule([hx + 0.2, hy, hz], [kx, ky + 1, kz], 3.5, 2.4)), 'white', { mirror: true });
  b.add('shin.L', blend(1.2, sphere([kx, ky, kz], 2.4), capsule([kx, ky - 1, kz - 0.4], [kx, ky - 7, kz - 0.6], 2.4, 2.2), capsule([kx, ky - 7, kz - 0.4], [ax, ay + 1.5, az], 2.2, 1.5)), 'skin', { mirror: true });
  return full;
}

function bust(): Sdf {
  const cz = SPEC.chest[1];
  return blend(0.8, ellipsoid([2.8, BUST_Y, cz - 0.3], [2.9, 2.7, 2.8]), ellipsoid([-2.8, BUST_Y, cz - 0.3], [2.9, 2.7, 2.8]));
}

/** the body as cloth sees it: the cleavage bridged over */
function clothBody(full: Sdf): Sdf {
  const cz = SPEC.chest[1];
  return blend(1.4, full, box([0, BUST_Y + 0.4, cz + 1.0], [4.0, 2.2, 1.8], { round: 1.6 }));
}

/** Black flats: a rounded toe and low sides; the ankle bare. */
function shoes(b: ModelBuilder, L: Landmarks): void {
  const [ax, ay, az] = L.ankle;
  const f = L.spec.foot;
  b.add('foot.L', capsule([ax, ay + 2.6, az - 0.4], [ax, ay - 0.6, az - 0.4], 1.6, 1.8), 'skin', { mirror: true });
  const shoe = intersect(box([ax, 1.7, az + (f.len / 2 - f.heel)], [f.w / 2 + 0.2, 1.7, f.len / 2], { round: 1.3 }), halfSpace([0, 3.6, az + f.len - f.heel - 3], [0, 1, 0.8]));
  b.add('foot.L', shoe, 'shoe', { mirror: true });
  // the opening over the instep shows a sliver of skin
  b.paint('foot.L', box([ax, 3.2, az + 2.6], [f.w / 2 - 0.6, 0.6, 1.6]), 'skin', { mirror: true, where: b.isMat('shoe') });
}

// ---------------------------------------------------------------------------------------------- dress

/** The bodice: a fitted white shell over the torso with black princess seams, gathered at the waist. */
function bodice(b: ModelBuilder, L: Landmarks, full: Sdf): void {
  const s = L.spec;
  const [, sy] = s.shoulder;
  const cloth = clothBody(full);
  const shellSdf = intersect(subtract(offset(cloth, 1.0), offset(cloth, 0.05)), aabb([-30, s.waistY - 4, -30], [30, sy + 6, 30]));
  addBands(b, shellSdf, 'white', [['spine', s.waistY - 4, s.chestY - 4], ['chest', s.chestY - 4, 100]]);
  // princess seams: from the shoulders, over the bust, to the waist (front), straight down the back
  const seamX = (y: number) => (y > BUST_Y ? 3.0 + (y - BUST_Y) * 0.22 : 3.0 - (BUST_Y - y) * 0.06);
  for (const k of [-1, 1]) {
    b.paint(['chest', 'spine'], fn((x, y, z) => (z < 1 ? 1 : Math.abs(x - k * seamX(y)) - 0.5), [-12, s.waistY - 5, 0], [12, sy + 4, 14]), 'trim', { where: b.isMat('white') });
    b.paint(['chest', 'spine'], fn((x, y, z) => (z > -1 ? 1 : Math.abs(x - k * 3.4) - 0.5), [-12, s.waistY - 5, -14], [12, sy + 4, 0]), 'trim', { where: b.isMat('white') });
  }
  // the cloth gathers under the bust and draws in to the waist (big shapes only)
  for (const k of [-1, 1]) {
    b.paint('chest', capsule([k * 5.6, BUST_Y - 2.4, 4.6], [k * 1.4, BUST_Y - 3.4, 6.2], 0.6), 'white', { shade: 3, where: b.isMat('white') });
    b.paint('spine', capsule([k * 4.2, s.waistY + 3.6, 3.4], [k * 3.2, s.waistY - 2.2, 3.6], 0.55), 'white', { shade: 3, where: b.isMat('white') });
  }
}

/** Long sleeves, a little loose and belled at the wrist, black cuffs. */
function sleeves(b: ModelBuilder, L: Landmarks): void {
  const [sx, sy, sz] = L.spec.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(1.3, sphere([sx, sy - 0.5, sz], 3.0), capsule([sx, sy - 1, sz], [sx, ey + 0.5, sz], 2.8, 2.5)), 'white', { mirror: true });
  b.add('forearm.L', blend(1.1, sphere([sx, ey, sz], 2.6), cylinder([sx, wy + 0.4, sz], [sx, ey + 0.6, sz], 3.1, 2.5, 0.8)), 'white', { mirror: true });
  // the black cuff
  b.paint('forearm.L', aabb([sx - 5, wy - 1, sz - 5], [sx + 5, wy + 2.0, sz + 5]), 'trim', { mirror: true, where: b.isMat('white') });
  // folds at the elbow and the inner arm
  b.paint('forearm.L', torus([sx, ey - 1.8, sz], 2.8, 0.5, [0, 0, -10]), 'white', { shade: 3, mirror: true, where: b.isMat('white') });
  b.paint('upperarm.L', torus([sx, ey + 3.2, sz], 2.7, 0.5, [0, 0, 8]), 'white', { shade: 3, mirror: true, where: b.isMat('white') });
}

/** The high stand-up collar, flaring a little at the top, open at the throat; lined black, black edges. */
function collar(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const c = s.chinY;
  const nz = L.headC[2] - 0.5;
  const y0 = s.shoulder[1] - 1.4, y1 = c + 0.6;
  const t = (y: number) => Math.max(0, Math.min(1, (y - y0) / (y1 - y0)));
  const outer = (y: number) => 4.0 + 0.9 * t(y);
  const gap = (y: number) => 0.9 + t(y) * 2.2;
  const ring = fn((x, y, z) => {
    const ro = outer(y), ri = ro - 1.8;
    const r = Math.hypot(x, z - nz);
    const dRing = Math.max(r - ro, ri - r);
    const dY = Math.max(y0 - y, y - y1);
    const open = z > nz ? gap(y) - Math.abs(x) : -10;
    return Math.max(dRing, dY, open);
  }, [-7, y0 - 1, nz - 7], [7, y1 + 1, nz + 7]);
  b.add('chest', ring, 'white', { thr: 0.2 });
  // the lining inside (shadowed white), the black edges of the opening and the black top rim
  b.paint('chest', fn((x, y, z) => Math.hypot(x, z - nz) - (outer(y) - 1.0), [-7, y0 - 1, nz - 7], [7, y1 + 1, nz + 7]), 'whiteIn', { where: b.isMat('white') });
  b.paint('chest', fn((x, y, z) => (z <= nz ? 1 : Math.abs(x) - (gap(y) + 0.9)), [-7, y0, nz], [7, y1 + 1, nz + 7]), 'trim', { where: b.isMat('white') });
  b.paint('chest', aabb([-8, y1 - 0.9, nz - 8], [8, y1 + 1, nz + 8]), 'trim', { where: b.isMat('white') });
}

/** The skirt's black hem, the black edge where it wraps over at the front, and the seams down the front. */
function skirtTrim(b: ModelBuilder): void {
  const bones = ['coat.F.L', 'coat.F.L.2', 'coat.S.L', 'coat.S.L.2', 'coat.B.L', 'coat.B.L.2', 'coat.B.R', 'coat.B.R.2', 'coat.S.R', 'coat.S.R.2', 'coat.F.R', 'coat.F.R.2'];
  b.paint(bones, aabb([-30, SKIRT.hem - 3, -30], [30, SKIRT.hem + 1.6, 30]), 'trim', { where: b.isMat('white') });
  const cz = -0.6;
  const ang = (x: number, y: number, z: number) => Math.atan2(x, (z - cz) / skirtDepth(y));
  const rho = (x: number, y: number, z: number) => Math.hypot(x, (z - cz) / skirtDepth(y));
  // the wrap: the outer front panel (the character's right) laps over to the left of centre; its edge is black
  const edge = (SKIRT.open * -1 * Math.PI) / 180;
  b.paint(['coat.F.R', 'coat.F.R.2'], fn((x, y, z) => Math.abs(ang(x, y, z) - (edge - 0.07)) * rho(x, y, z) - 0.7, [-20, SKIRT.hem - 3, -2], [20, SKIRT.top + 2, 20]), 'trim', { where: b.isMat('white') });
  // the princess seams carry on down the front panels
  for (const k of [-1, 1]) {
    const a = (k * 27 * Math.PI) / 180;
    b.paint(k > 0 ? ['coat.F.L', 'coat.F.L.2'] : ['coat.F.R', 'coat.F.R.2'], fn((x, y, z) => Math.abs(ang(x, y, z) - a) * rho(x, y, z) - 0.5, [-20, SKIRT.hem - 3, -2], [20, SKIRT.top + 2, 20]), 'trim', { where: b.isMat('white') });
  }
}

// ---------------------------------------------------------------------------------------------- hair

/**
 * Waist-length hair: a smooth cap with short bangs over the top of the forehead, the sides swept back over
 * the ears, and the long fall down her back to the hips — one wide sheet in three columns (left, centre,
 * right) on two-bone spring chains; the centre column hangs a voxel further back so no slit opens.
 */
function hair(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }, springs: SpringDef[], colliders: ColliderDef[]): void {
  const s = L.spec;
  const c = hd.chin;
  const back = L.headC[2] - s.head.d / 2;
  const locks: Spike[] = [];
  for (const az of [-160, 180, 160, -132, 132]) locks.push({ az, el: 30, len: 1.1, r: 3.6, flat: 0.5, flow: [0, -0.5, -0.5] });
  // a rounded crown: broad locks over the top, falling back from the parting
  for (const [az, el] of [[-40, 62], [40, 62], [-100, 56], [100, 56], [180, 60], [-150, 52], [150, 52]] as [number, number][]) locks.push({ az, el, len: 0.8, r: 3.8, flat: 0.55, flow: [0, -0.3, -0.6] });
  for (const k of [-1, 1]) {
    locks.push({ az: k * 68, el: 30, len: 1.4, r: 3.2, flat: 0.45, flow: [k * 0.1, -0.5, -1.1] });
    locks.push({ az: k * 98, el: 6, len: 2.0, r: 3.4, flat: 0.45, flow: [0, -1.0, -0.9] });
    locks.push({ az: k * 122, el: -8, len: 2.4, r: 3.2, flat: 0.45, flow: [0, -1.2, -0.5] });
  }
  spikeHair(b, L, 'hair', locks, [
    { x: -3.8, tipY: c + 9.7, lean: -0.8, r: 1.8 },
    { x: -1.4, tipY: c + 9.3, lean: -0.4, r: 1.7 },
    { x: 1.2, tipY: c + 9.5, lean: 0.5, r: 1.7 },
    { x: 3.7, tipY: c + 9.9, lean: 0.9, r: 1.8 },
  ], { hairline: c + s.head.h - 1.0, nape: c - 1, slope: 0.55, capR: [s.head.w / 2 + 1.5, s.head.h / 2 + 1.6, s.head.d / 2 + 1.5] });

  // ---- the fall
  const yN = c - 1; // the nape: the head carries everything above
  const yM = s.chestY - 4; // the shoulder blades
  const yHem = s.hipsY - 3; // the ends, at the hips
  const zTop = back - 0.2, zBot = -7.8;
  const zf = (y: number) => zTop + (zBot - zTop) * Math.max(0, Math.min(1, (c + 3 - y) / (c + 3 - yHem)));
  const halfW = (y: number) => (y > s.shoulder[1] ? 6.0 + (c + 3 - y) * 0.2 : Math.min(8.2, 7.6 + (s.shoulder[1] - y) * 0.05) - Math.max(0, 44 - y) * 0.15);
  const hemY = (x: number) => yHem + Math.abs(Math.sin(x * 0.75)) * 1.6 + Math.max(0, Math.abs(x) - 4) * 0.5;
  const sheet = (dz: number, xMin: number, xMax: number, y0: number, y1: number) =>
    fn((x, y, z) => {
      const front = zf(y) + dz + 0.045 * x * x; // the sheet wraps a little round her back
      const th = 2.6;
      const dzIn = Math.max(z - front, front - th - z);
      const dx = Math.max(Math.abs(x) - halfW(y), xMin - x, x - xMax);
      const dy = Math.max(hemY(x) - y, y - y1, y0 - y);
      return Math.max(dzIn, dx, dy);
    }, [xMin - 1, y0 - 2, zBot - 6], [xMax + 1, y1 + 1, back + 3]);
  // the head's share: the back of the head down to the nape
  b.add('head', sheet(0, -8, 8, yN - 0.5, c + 4), 'hair', { thr: 0.2 });
  // the columns
  b.bone('hair1.L', 'head', [3.6, yN, zf(yN) - 1.3]);
  b.bone('hair1.R', 'head', [-3.6, yN, zf(yN) - 1.3]);
  b.bone('hair1.C', 'head', [0, yN, zf(yN) - 1.8]);
  b.bone('hair2.L', 'hair1.L', [3.8, yM, zf(yM) - 1.3]);
  b.bone('hair2.R', 'hair1.R', [-3.8, yM, zf(yM) - 1.3]);
  b.bone('hair2.C', 'hair1.C', [0, yM, zf(yM) - 1.8]);
  b.add('hair1.L', sheet(0, 2.0, 9, yM - 0.5, yN + 0.5), 'hair', { thr: 0.2, mirror: true });
  b.add('hair2.L', sheet(0, 2.0, 9, -100, yM + 0.5), 'hair', { thr: 0.2, mirror: true });
  b.add('hair1.C', sheet(-1, -2.8, 2.8, yM - 0.5, yN + 0.5), 'hair', { thr: 0.2 });
  b.add('hair2.C', sheet(-1, -2.8, 2.8, -100, yM + 0.5), 'hair', { thr: 0.2 });
  // strands: grooves running down the fall and over the cap
  const strands = fn((x) => Math.abs(((x + 40) % 2.3) - 1.15) - 0.32, [-10, yHem - 4, -16], [10, c + 15, 8]);
  b.paint(['head', 'hair1.L', 'hair1.R', 'hair1.C', 'hair2.L', 'hair2.R', 'hair2.C'], intersect(strands, halfSpace([0, c + 3, 0], [0, 1, 0.25])), 'hair', { shade: 3, where: b.isMat('hair') });
  const R = ORIHIME_RES;
  for (const [n, x, z] of [['L', 3.8, -1.3], ['R', -3.8, -1.3], ['C', 0, -1.8]] as [string, number, number][]) {
    springs.push({ bone: `hair1.${n}`, tail: [(x * 1.05 - x) / R, (yM - yN) / R, (zf(yM) - zf(yN)) / R], stiffness: 55, damping: 5, gravity: 9, limit: 40, radius: 0.03 });
    springs.push({ bone: `hair2.${n}`, tail: [0, (yHem - yM) / R, (zf(yHem) + z - (zf(yM) + z)) / R], stiffness: 34, damping: 4.5, gravity: 11, limit: 55, radius: 0.03 });
  }
  colliders.push(
    { bone: 'chest', offset: [0, 0.06, -0.005], radius: 0.11 },
    { bone: 'spine', offset: [0, 0.02, -0.01], radius: 0.085 },
    { bone: 'hips', offset: [0, -0.03, -0.01], radius: 0.115 },
  );
}

/** The two six-petal hairpins of Shun Shun Rikka, pinned at her temples over the swept-back hair. */
function pins(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }): void {
  const s = L.spec;
  for (const k of [-1, 1]) {
    const c: V3 = [k * (s.head.w / 2 + 0.5), hd.chin + 9.8, hd.front - 3.4];
    flower(b, 'head', c, [k * 0.88, 0.12, 0.46], 2.3);
    b.socket(k > 0 ? 'pin.L' : 'pin.R', 'head', [c[0] + k * 1.2, c[1], c[2]]);
  }
}

/** A six-petal flower facing n: round petals round a darker centre. */
function flower(b: ModelBuilder, bone: string, c: V3, n: V3, R: number): void {
  const nl = Math.hypot(...n);
  const N: V3 = [n[0] / nl, n[1] / nl, n[2] / nl];
  // U: the up direction flattened onto the flower's plane, V = N × U
  const d = N[1];
  const u0: V3 = [-N[0] * d, 1 - N[1] * d, -N[2] * d];
  const ul = Math.hypot(...u0);
  const U: V3 = [u0[0] / ul, u0[1] / ul, u0[2] / ul];
  const V: V3 = [N[1] * U[2] - N[2] * U[1], N[2] * U[0] - N[0] * U[2], N[0] * U[1] - N[1] * U[0]];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const dx = U[0] * Math.cos(a) + V[0] * Math.sin(a), dy = U[1] * Math.cos(a) + V[1] * Math.sin(a), dz = U[2] * Math.cos(a) + V[2] * Math.sin(a);
    b.add(bone, capsule([c[0] + dx * 0.5, c[1] + dy * 0.5, c[2] + dz * 0.5], [c[0] + dx * R, c[1] + dy * R, c[2] + dz * R], 0.85, 0.7), 'pin', { thr: 0.25 });
  }
  b.add(bone, sphere([c[0] + N[0] * 0.3, c[1] + N[1] * 0.3, c[2] + N[2] * 0.3], 0.95), 'pinC');
}

// ---------------------------------------------------------------------------------------------- the fairies

export type FairyName = 'tsubaki' | 'ayame' | 'shuno' | 'hinagiku' | 'lily' | 'baigon';
export const FAIRY_NAMES: readonly FairyName[] = ['tsubaki', 'ayame', 'shuno', 'hinagiku', 'lily', 'baigon'];
export const FAIRY_RES = 96;
/** the fairies' centre above their feet (m), where glows and trails attach */
export const FAIRY_CENTER = 7 / FAIRY_RES;

const fairyCache = new Map<FairyName, VoxelModel>();

export function rikkaFairy(name: FairyName): VoxelModel {
  let m = fairyCache.get(name);
  if (!m) fairyCache.set(name, (m = buildFairy(name).model));
  return m;
}

/**
 * A fairy, 13-14 cm tall: a big head (chibi proportions), a small body, stubby limbs, two-voxel eyes, and
 * the one or two shapes that name them.
 */
export function buildFairy(name: FairyName): { model: VoxelModel; warnings: string[] } {
  const b = new ModelBuilder(`rikka-${name}`, FAIRY_RES);
  const skinC: Record<FairyName, string[]> = {
    tsubaki: ['#E8C898', '#DEB888', '#C8A070', '#A88458'],
    ayame: ['#FBEBDD', '#F5DCC8', '#E2C2AC', '#C4A28C'],
    shuno: ['#F8E8C4', '#F3DEB1', '#DEC294', '#BEA076'],
    hinagiku: ['#FDF8EE', '#FBF3E4', '#E8DCC8', '#C8BAA6'],
    lily: ['#FBE6D6', '#F6D8C4', '#E4BEA8', '#C49C88'],
    baigon: ['#F8D6B0', '#F5C79B', '#DEAA7E', '#BC8A62'],
  };
  b.mat('skin', skinC[name], { base: 1, rough: 0.6 });
  b.mat('eye', ['#2A1E22']);
  b.mat('hi', ['#F3F3F0']);
  b.bone('root', null, [0, 0, 0]);
  const brawny = name === 'baigon';
  const tw = brawny ? 2.5 : 1.9, td = brawny ? 1.7 : 1.3;
  // clothes and hair materials
  const cloth: Record<FairyName, string[]> = {
    tsubaki: ['#4A4444', '#2E2A2A', '#221F20', '#161517'],
    ayame: ['#EE8A82', '#DD6761', '#B04640', '#641815'],
    shuno: ['#F3F0E6', '#E2DCCB', '#C8C0AA', '#A69E88'],
    hinagiku: ['#C4AEDC', '#A88EC7', '#8470B0', '#6356A0'],
    lily: ['#4A78B0', '#2D568C', '#22446E', '#183252'],
    baigon: ['#8C6A9C', '#6E5080', '#543C64', '#3C2A48'],
  };
  b.mat('cloth', cloth[name], { base: 1, rough: 0.75 });
  const headC: V3 = [0, 10.4, 0.2];
  const headR: V3 = brawny ? [2.7, 2.6, 2.5] : [2.8, 2.7, 2.6];
  // legs, body, arms, head
  for (const k of [-1, 1]) b.add('root', capsule([k * 1.0, 0.6, 0], [k * (brawny ? 1.2 : 1.0), 4.4, 0], brawny ? 1.1 : 0.9), name === 'lily' || name === 'baigon' ? 'skin' : 'cloth');
  b.add('root', box([0, 6.3, 0], [tw, 2.1, td], { round: 0.9 }), 'cloth');
  for (const k of [-1, 1]) b.add('root', capsule([k * (tw + 0.4), 7.6, 0], [k * (tw + 1.0), 4.6, 0.4], brawny ? 1.05 : 0.75), name === 'lily' ? 'skin' : 'cloth');
  for (const k of [-1, 1]) b.add('root', sphere([k * (tw + 1.0), 4.3, 0.5], brawny ? 1.0 : 0.8), 'skin');
  b.add('root', ellipsoid(headC, headR), 'skin');
  const front = headC[2] + headR[2];
  const eyeY = 10;
  // the eyes: two dark voxels with a glint above, set into the face
  const eyes = (x0: number, x1: number) => {
    for (const x of [x0, x1]) {
      let z = Math.ceil(front) + 1;
      while (z > -4 && b.grid('root').get(x, eyeY, z) === 0) z--;
      b.voxel('root', x, eyeY, z, 'eye');
      b.voxel('root', x, eyeY + 1, z, 'eye');
    }
  };
  switch (name) {
    case 'tsubaki': {
      b.mat('hair', ['#3A3634', '#262423', '#1C1A1A', '#141418'], { base: 1, rough: 0.5 });
      b.mat('streak', ['#E05A40', '#C8402A', '#9A2A1C']);
      b.mat('scarf', ['#F6F0E2', '#EFE6D1', '#D8CCB2', '#B8AA90'], { base: 1 });
      b.mat('mark', ['#D02828']);
      b.add('root', ellipsoid([0, 11.6, -0.2], [3.0, 2.0, 2.8]), 'hair');
      const spikes: [V3, V3, number][] = [[[0, 12.5, -0.6], [0, 1, -0.5], 3.2], [[-1.8, 12.2, -0.2], [-0.8, 1, -0.4], 2.8], [[1.8, 12.2, -0.2], [0.8, 1, -0.4], 2.8], [[0, 11.4, -2.2], [0, 0.4, -1], 2.6], [[-2.4, 11.2, -1.2], [-1, 0.2, -0.6], 2.2], [[2.4, 11.2, -1.2], [1, 0.2, -0.6], 2.2]];
      spikes.forEach(([p, d, l], i) => b.add('root', spike(p, d, l, 1.3, 0.9, { tip: 0.3 }), i === 1 ? 'streak' : 'hair', { thr: 0.3 }));
      // the scarf over his mouth and nose, the end trailing behind
      b.add('root', intersect(subtract(ellipsoid([0, 9, 0.3], [3.0, 1.4, 2.9]), ellipsoid([0, 9, 0.3], [2.4, 3, 2.3])), halfSpace([0, 8.0, 0], [0, -1, 0])), 'scarf', { thr: 0.2 });
      b.add('root', capsule([0.6, 8.6, -2.4], [1.8, 6.6, -4.2], 0.7, 0.5), 'scarf', { thr: 0.3 });
      b.carve('root', aabb([-3, eyeY - 0.5, front - 1], [3, eyeY + 2, front + 2]), {});
      b.add('root', aabb([-2.5, eyeY, front - 1.6], [2.5, eyeY + 2, front - 0.6]), 'skin');
      eyes(-2, 1);
      b.voxel('root', -3, eyeY, Math.floor(front - 1.6), 'mark');
      b.voxel('root', 2, eyeY, Math.floor(front - 1.6), 'mark');
      break;
    }
    case 'ayame': {
      b.mat('hair', ['#3E3238', '#2B2328', '#201A1E', '#141418'], { base: 1 });
      b.mat('trimY', ['#F0DE70', '#E8D25A', '#C4AE40']);
      b.mat('suit', ['#F6B4CC', '#F2A0C0', '#D880A4']);
      // the blunt bob: a cap down to the jaw with straight bangs
      b.add('root', intersect(ellipsoid([0, 10.7, -0.1], [3.2, 3.1, 3.0]), halfSpace([0, 8.4, 0], [0, -1, 0])), 'hair');
      b.carve('root', intersect(aabb([-2.4, 7, 0.6], [2.4, eyeY + 1.4, 6]), ellipsoid([0, 9.6, 1.4], [2.6, 3, 3])), {});
      b.add('root', intersect(ellipsoid(headC, headR), aabb([-2.4, 7, -1], [2.4, eyeY + 1.4, 6])), 'skin');
      // the oversized hooded dress: a wide bell to the feet, long sleeves past the hands, the hood behind
      b.add('root', intersect(cylinder([0, 0, 0], [0, 8.6, 0], 3.8, 2.2), halfSpace([0, 8.6, 0], [0, 1, 0])), 'cloth');
      b.carve('root', cylinder([0, -1, 0], [0, 1.2, 0], 2.6, 2.6));
      for (const k of [-1, 1]) b.add('root', capsule([k * 2.4, 7.8, 0], [k * 3.2, 4.0, 0.5], 1.2, 1.4), 'cloth');
      b.add('root', intersect(subtract(ellipsoid([0, 10.6, -0.6], [3.6, 3.4, 3.4]), ellipsoid([0, 10.6, 0.1], [3.1, 3.2, 3.1])), halfSpace([0, 0, 0.6], [0, 0, 1])), 'cloth', { thr: 0.2 });
      b.paint('root', aabb([-5, 0, -5], [5, 1.4, 5]), 'trimY', { where: b.isMat('cloth') });
      b.paint('root', fn((x, y, z) => (z < -0.4 ? Math.abs(Math.hypot(x, y - 10.6, (z + 0.6) * 0.95) - 3.3) - 0.45 : 1), [-5, 6, -5], [5, 15, 2]), 'trimY', { where: b.isMat('cloth') });
      for (const k of [-1, 1]) b.paint('root', sphere([k * 3.2, 4.0, 0.6], 1.1), 'suit', { where: b.isMat('cloth') });
      eyes(-2, 1);
      break;
    }
    case 'shuno': {
      b.mat('hair', ['#FFF9CA', '#FCECBD', '#E8D29C', '#C8B07A'], { base: 1 });
      b.mat('sash', ['#E8C860', '#C8A040']);
      b.add('root', intersect(ellipsoid([0, 11.2, -0.3], [3.0, 2.6, 2.8]), halfSpace([0, 10.4, 2.0], [0, -1, 0.6])), 'hair');
      b.add('root', sphere([0, 13.6, -0.6], 1.4), 'hair');
      b.add('root', capsule([0, 13.6, -0.6], [0, 15.4, -1.4], 0.9, 0.5), 'hair', { thr: 0.3 });
      b.paint('root', box([0, 5.0, 0], [tw + 0.4, 0.6, td + 0.4]), 'sash', { where: b.isMat('cloth') });
      eyes(-2, 1);
      break;
    }
    case 'hinagiku': {
      b.mat('patch', ['#E4D8EE', '#D6C7E2', '#BCA8CE', '#9C88B2'], { base: 1 });
      b.mat('lens', ['#E060B8', '#D040A0', '#A02C7C'], { glow: 0.2 });
      for (const k of [-1, 1]) b.add('root', spike([k * 2.4, 10.8, -0.2], [k, 0.5, -0.2], 2.4, 0.8, 0.5, { tip: 0.3 }), 'skin', { thr: 0.3 });
      eyes(-2, 1);
      // the eyepatch over his right eye, curving up and out into a horn
      b.add('root', cylinder([-1.6, eyeY + 0.5, front - 1.2], [-1.6, eyeY + 0.5, front + 0.6], 1.7), 'patch');
      b.add('root', spike([-2.6, eyeY + 1.6, front - 0.6], [-0.7, 1, -0.2], 4, 1.0, 0.8, { bend: [0.6, -0.1, 0], tip: 0.3 }), 'patch', { thr: 0.3 });
      b.add('root', cylinder([-1.6, eyeY + 0.5, front + 0.4], [-1.6, eyeY + 0.5, front + 1.0], 0.9), 'lens');
      break;
    }
    case 'lily': {
      b.mat('hair', ['#F8A0B2', '#F5819A', '#E85C70', '#C84458'], { base: 1 });
      b.mat('goggle', ['#FCF6D0', '#FBF1B4', '#E8D880'], { glow: 0.1 });
      b.mat('frill', ['#F69A58', '#F07A30', '#C85A20']);
      b.add('root', intersect(ellipsoid([0, 11.0, -0.3], [3.0, 2.8, 2.8]), halfSpace([0, 11.8, 2.0], [0, -1, 0.7])), 'hair');
      for (const k of [-1, 1]) b.add('root', sphere([k * 2.2, 13.2, -0.6], 1.5), 'hair');
      // the swimsuit leaves the arms and legs bare; the frill collar round the neck
      b.add('root', torus([0, 8.4, 0], 1.9, 0.8), 'frill');
      eyes(-2, 1);
      // the goggles: a band round the head and two lenses over the eyes
      b.add('root', intersect(subtract(ellipsoid([0, eyeY + 0.5, 0.2], [3.1, 1.2, 2.9]), ellipsoid([0, eyeY + 0.5, 0.2], [2.6, 3, 2.4])), halfSpace([0, 0, -2.5], [0, 0, -1])), 'hair', { thr: 0.2 });
      for (const x of [-1.5, 1.5]) b.add('root', cylinder([x, eyeY + 0.5, front - 0.6], [x, eyeY + 0.5, front + 0.6], 1.2), 'goggle');
      break;
    }
    case 'baigon': {
      b.mat('mask', ['#F8F4F8', '#F3EDF3', '#DCD2DC', '#BCB0BC'], { base: 1 });
      b.mat('gold', ['#F0D480', '#E0C060', '#B8962C']);
      b.mat('blossom', ['#F0A8C4', '#E58FB0']);
      b.mat('hair', ['#ECD098', '#E0C080', '#C4A060', '#A07E44'], { base: 1 });
      // the long hair from the back of the head, hanging down his back
      b.add('root', capsule([0, 11.2, -2.2], [0, 6.0, -3.2], 1.6, 1.0), 'hair', { thr: 0.3 });
      // the mouth-mask over the lower face, a gold line across it and two pink blossoms
      b.add('root', intersect(ellipsoid([0, 8.9, 0.4], [2.9, 1.6, 2.8]), halfSpace([0, 0, -0.5], [0, 0, -1])), 'mask');
      b.paint('root', aabb([-4, 8.8, -1], [4, 9.4, 5]), 'gold', { where: b.isMat('mask') });
      for (const x of [-1.6, 1.4]) b.paint('root', sphere([x, 8.0, front], 0.7), 'blossom', { where: b.isMat('mask') });
      eyes(-2, 1);
      break;
    }
  }
  b.autoShade();
  b.lint();
  return { model: b.build(), warnings: b.warnings };
}
