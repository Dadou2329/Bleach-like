// Tier Harribel — Tres Espada, Sacrifice (docs/roster/E1-espada-1.md). 1.75 m, tall and curvy with long
// legs and tan skin; she stands very still. Sealed: short, messy golden hair with three braided locks (two
// hanging in front over the collar, one down her back) and aqua-green eyes under heavy lashes; the white
// jacket with the high collar that hides her face from the nose down (a black rim, the zipper, two beige
// air filters), cropped under the bust; sleeves ending in black paw gloves; a black sash and white hakama;
// Tiburón — the wide, hollow blade with the purple handle and three holes at each end of the guard — worn
// across the small of her upper back. Unzipped: the jacket open, the bone mask over her lower face and the
// bone collar running down over her chest, and the "3" on her right breast. Tiburón: wild hair and a blue
// lightning estigma on each cheek; the bone collar and the band over her bust, the spine-like ridge up her
// stomach, the Hollow hole low on her belly; shark-fin spaulders, two ribbons off her back, the pointed
// bone skirt over a dark undergarment, elbow gloves and knee boots; the pata, a giant shark tooth with
// gills, over her right hand. The anime cut throughout.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, prism, smoothPath, sphere, spike, subtract, torus, tube, union, type Sdf, type V3 } from '../models/sdf';
import { addBands, faceLegend, hakama, hands, head, humanoidSkeleton, spikeHair, type Bang, type HumanoidSpec, type Landmarks, type Spike } from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

/** 84 voxels = 1.75 m */
export const HARRIBEL_RES = 84 / 1.75;
/** 'sealed', 'unzipped' (the jacket open on the mask: serious), 'tiburon' (the Resurrección) */
export type HarribelForm = 'sealed' | 'unzipped' | 'tiburon';

/** Tall and curvy: a small waist between a full bust and wide hips, long legs. */
const SPEC: HumanoidSpec = {
  H: 84,
  chinY: 72,
  head: { w: 10, d: 11, h: 12 },
  neckR: 2.2,
  shoulder: [8.3, 66.2, -0.5],
  upperArm: 13.8,
  foreArm: 12.6,
  hand: 8,
  armR: 2.1,
  hipsY: 45.5,
  hip: [4.5, 42.5, 0],
  kneeY: 23.5,
  ankleY: 4.3,
  chest: [6.6, 4.5],
  waist: [5.0, 3.7],
  hips: [7.4, 5.0],
  chestY: 60,
  waistY: 51.5,
  foot: { len: 11, w: 4.5, heel: 2.8 },
};
/** the bust's centre height */
const BUST_Y = SPEC.chestY - 1.6;

function palette(b: ModelBuilder): void {
  b.mat('skin', ['#C99C7A', '#B48562', '#A07253', '#8A6047', '#6B4836'], { base: 1, rough: 0.55, shadeK: 0.85 });
  b.mat('hair', ['#F2DC74', '#E8C24A', '#D4AC3A', '#B8932E', '#8E6E1E'], { base: 1, rough: 0.45, shadeK: 0.85, dither: 0.05 });
  b.mat('brow', ['#A8842A']);
  b.mat('lid', ['#2A1E14']);
  b.mat('sclera', ['#EDE9E1']);
  b.mat('iris', ['#2FB59A']);
  b.mat('irisD', ['#135447']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#8A5444']);
  b.mat('white', ['#F3F2EE', '#ECEBE6', '#DCDCD8', '#C4C6C9', '#A6AAB2'], { base: 1, rough: 0.82, shadeK: 0.9 });
  b.mat('trim', ['#2A2A2E', '#1A1A1C', '#141418'], { base: 1, rough: 0.8 });
  b.mat('zip', ['#8F9399', '#6E7278'], { base: 0, rough: 0.35, metal: 0.7 });
  b.mat('filter', ['#E2D3AE', '#D8C7A0', '#BFAE86', '#9C8C66'], { base: 1, rough: 0.9 });
  b.mat('glove', ['#3A3A40', '#26262B', '#1A1A1E', '#141418'], { base: 1, rough: 0.6 });
  b.mat('sash', ['#2C2C32', '#1C1C20', '#141418'], { base: 1, rough: 0.8 });
  b.mat('shoe', ['#2E2E35', '#1A1A1C', '#141418'], { base: 1, rough: 0.45, metal: 0.1 });
  b.mat('bone', ['#F4F1E8', '#ECE7DA', '#DAD3C2', '#C2BAA6', '#A39B87'], { base: 1, rough: 0.42, shadeK: 1 });
  b.mat('teeth', ['#F3F1EA'], { rough: 0.35 });
  b.mat('ink', ['#1A1A1E']);
  b.mat('void', ['#060609'], { rough: 1 });
  // Tiburón
  b.mat('estigma', ['#2F6FE0']);
  b.mat('under', ['#3A3B44', '#2A2B33', '#202128', '#16171C'], { base: 1, rough: 0.7 });
  b.mat('ribbon', ['#F2EFE6', '#E8E4D8', '#D2CCBC', '#B6AF9C'], { base: 1, rough: 0.6 });
}

/**
 * Aqua-green eyes under a heavy upper lash line that runs out to the corners, a dark lower lash under the
 * iris; blond brows; a small mouth (behind the collar or the mask until the release). Rows 9 → 0.
 */
const FACE = [
  '. b b b . . b b b .',
  '. . . . . . . . . .',
  'L L L L . . L L L L',
  '. W I I . . I I W .',
  '. W * i . . i * W .',
  '. . L L . . L L . .',
  '. . . . . s . . . .',
  '. . . . . . . . . .',
  '. . . m m m m . . .',
  '. . . . . . . . . .',
];
/** Tiburón: the same eyes; a lightning bolt of estigma down each cheek, from under the eye to the jaw. */
const FACE_REL = [
  '. b b b . . b b b .',
  '. . . . . . . . . .',
  'L L L L . . L L L L',
  '. W I I . . I I W .',
  '. W * i . . i * W .',
  '. . L L . . L L . .',
  '. E . . . s . . E .',
  '. . E . . . . E . .',
  '. E . . m m . . E .',
  '. . E . . . . E . .',
];
/** the "3" (inner side of her right breast) */
const THREE = ['x x x', '. . x', '. x x', '. . x', 'x x x'];

const assetCache = new Map<HarribelForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function harribelAsset(form: HarribelForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildHarribel(form)));
  return a;
}

export type HarribelProp = 'tiburon' | 'sheath' | 'sheath-empty' | 'pata';

export function harribelProp(kind: HarribelProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'tiburon' ? buildTiburon() : kind === 'pata' ? buildPata() : buildSheath(kind === 'sheath');
    propCache.set(kind, m);
  }
  return m;
}

/** the sealed blade (prop frame, m): its point, the centre of the hollow window and the window's size */
export const TIBURON_TIP_Z = 50 / 48;
export const TIBURON_WINDOW: { c: V3; w: number; h: number } = { c: [0, 0.1 / 48, 24 / 48], w: 4.8 / 48, h: 26 / 48 };
/** the window through the blade (prop voxels) */
const TIB_WINDOW = box([0, 0.1, 24], [3, 2.4, 13], { round: 1.4 });
/** the pata's blade runs along −Y past the knuckles (prop frame, m) */
export const PATA_BASE: V3 = [0, -6 / 48, 0.2 / 48];
export const PATA_TIP: V3 = [0, -44 / 48, 1.2 / 48];

export function buildHarribel(form: HarribelForm = 'sealed'): CharacterAsset {
  const b = new ModelBuilder(`harribel-${form}`, HARRIBEL_RES);
  palette(b);
  const s = SPEC;
  const rel = form === 'tiburon';
  const L = humanoidSkeleton(b, s, { hakama: !rel });
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 5, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5, wz + 1]);
  b.socket('chest.front', 'chest', [0, s.chestY + 1, 7.5]);
  // Tiburón across her upper back below the collar, the hilt out past her right side
  b.socket('back', 'chest', [-20, BUST_Y - 2, -8.4], [0, 90, 0]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('mouth', 'head', [0, s.chinY + 1.5, hd.front + 0.5]);
  b.stamp('head', hd.x0, hd.chin + 9, rel ? FACE_REL : FACE, { ...faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), b: { mat: 'brow' }, E: { mat: 'estigma' } }, hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  const springs: SpringDef[] = [];
  const colliders: ColliderDef[] = [
    { bone: 'thigh.L', offset: [0, -0.1, 0.02], radius: 0.1 },
    { bone: 'thigh.R', offset: [0, -0.1, 0.02], radius: 0.1 },
    { bone: 'shin.L', offset: [0, -0.15, 0], radius: 0.07 },
    { bone: 'shin.R', offset: [0, -0.15, 0], radius: 0.07 },
  ];
  const full = body(b, L);
  // the Hollow hole, low on her belly (under the hakama until the release)
  const hy = s.hipsY + 1.2;
  b.socket('hole', 'hips', [0, hy, 5.5]);
  if (rel) {
    wildHair(b, L, hd);
    hands(b, L, 'ribbon');
    tiburonArmor(b, L, full, springs, colliders);
    b.carve(['hips', 'spine'], cylinder([0, hy, -1.5], [0, hy, 14], 1.6));
    b.paint(['hips', 'spine'], cylinder([0, hy, -2.5], [0, hy, 14], 2.1), 'void', { where: b.isMat('skin') });
  } else {
    sealedHair(b, L, hd);
    hands(b, L, 'glove');
    pawGloves(b, L);
    const open = form === 'unzipped';
    if (open) mask(b, L, hd, full);
    jacket(b, L, full, open);
    collar(b, L, open);
    braids(b, L);
    const o = { black: 'white', collar: 'white', skin: 'skin', obi: 'sash', hemR: 8.4, hakamaHem: 3 };
    hakama(b, L, o);
    sash(b, L, full);
    shoes(b, L);
    for (const side of ['L', 'R']) springs.push({ bone: `hakama.${side}`, tail: [0, -0.46, 0], stiffness: 70, damping: 6, gravity: 8, limit: 55, radius: 0.12 });
    // the navel on the bare midriff
    navel(b, s.waistY - 1.2);
  }
  b.autoShade();
  b.lint();
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- body

/** First filled voxel from the front of a bone at (x, y). */
function frontZ(b: ModelBuilder, bone: string, x: number, y: number): number | null {
  const g = b.grid(bone);
  for (let z = 24; z > -24; z--) if (g.get(x, y, z) !== 0) return z;
  return null;
}

function navel(b: ModelBuilder, y: number): void {
  const yy = Math.round(y);
  for (const bone of ['spine', 'hips']) {
    const z = frontZ(b, bone, 0, yy);
    if (z !== null && b.matOf(b.grid(bone).get(0, yy, z)).mat?.name === 'skin') {
      b.voxel(bone, 0, yy, z, 'skin', 4);
      b.voxel(bone, -1, yy, z, 'skin', 3);
      return;
    }
  }
}

/** The bare body: a curvy torso (bust, small waist, wide hips and seat), arms and legs. */
function body(b: ModelBuilder, L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const torso = blend(2.6,
    box([0, s.chestY - 0.5, -0.4], [cx, 5.8, cz], { round: 3.2 }),
    box([0, s.waistY, -0.3], [wx, 4.4, wz], { round: 2.8 }),
    box([0, s.hipsY + 0.2, -0.4], [s.hips[0], 4.0, s.hips[1]], { round: 3 }),
    capsule([2.0, sy + 1.4, sz - 0.8], [sx - 1.4, sy - 0.2, sz], 2.3, 2.4),
    capsule([-2.0, sy + 1.4, sz - 0.8], [-sx + 1.4, sy - 0.2, sz], 2.3, 2.4),
    sphere([sx, sy - 0.5, sz], 2.7), sphere([-sx, sy - 0.5, sz], 2.7));
  const seat = ellipsoid([0, s.hipsY - 1.2, -s.hips[1] + 1.4], [6.2, 3.8, 2.8]);
  const full = blend(1.0, blend(1.6, torso, seat), bust());
  addBands(b, full, 'skin', [['hips', 28, s.waistY - 1], ['spine', s.waistY - 1, s.chestY - 4], ['chest', s.chestY - 4, 100]]);
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(1.3, sphere([sx, sy - 0.5, sz], 2.7), capsule([sx, sy - 1, sz], [sx, ey + 0.5, sz], 2.4, 2.0)), 'skin', { mirror: true });
  b.add('forearm.L', blend(1.1, sphere([sx, ey, sz], 2.0), capsule([sx, ey - 0.5, sz], [sx, wy + 1, sz], 2.0, 1.6)), 'skin', { mirror: true });
  const [hx, hy, hz] = s.hip;
  const [kx, ky, kz] = L.knee;
  const [ax, ay, az] = L.ankle;
  b.add('thigh.L', blend(1.4, sphere([hx, hy, hz], 3.9), capsule([hx + 0.2, hy, hz], [kx, ky + 1, kz], 3.8, 2.6)), 'skin', { mirror: true });
  b.add('shin.L', blend(1.2, sphere([kx, ky, kz], 2.6), capsule([kx, ky - 1, kz - 0.4], [kx, ky - 7, kz - 0.6], 2.6, 2.4), capsule([kx, ky - 7, kz - 0.4], [ax, ay + 1.5, az], 2.4, 1.6)), 'skin', { mirror: true });
  return full;
}

function bust(): Sdf {
  const cz = SPEC.chest[1];
  return blend(0.8, ellipsoid([3.0, BUST_Y, cz - 0.2], [3.1, 2.9, 3.0]), ellipsoid([-3.0, BUST_Y, cz - 0.2], [3.1, 2.9, 3.0]));
}

/** the body as cloth sees it: the cleavage bridged over */
function clothBody(full: Sdf): Sdf {
  const cz = SPEC.chest[1];
  return blend(1.4, full, box([0, BUST_Y + 0.4, cz + 1.2], [4.4, 2.2, 1.8], { round: 1.6 }));
}

// ---------------------------------------------------------------------------------------------- hair

/** Short, messy golden hair: locks over the ears and the nape, bangs to the brows and one between the eyes. */
function sealedHair(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }): void {
  const c = hd.chin;
  const locks: Spike[] = [];
  // the sides, over the ears to the jaw (hidden in the collar)
  for (const k of [-1, 1]) {
    locks.push({ az: k * 84, el: 4, len: 3.6, r: 2.6, flat: 0.5, flow: [k * 0.15, -1.6, 0.2], taper: 1 });
    locks.push({ az: k * 64, el: 18, len: 2.6, r: 2.3, flat: 0.5, flow: [k * 0.3, -1.2, 0.4], taper: 1 });
    locks.push({ az: k * 112, el: 10, len: 3.2, r: 2.6, flat: 0.5, flow: [k * 0.2, -1.4, -0.3], taper: 1 });
  }
  // the nape: messy points falling over the collar
  for (const az of [-160, -135, 135, 160, 180]) locks.push({ az, el: 4, len: 3.4, r: 2.6, flat: 0.55, flow: [0, -1.3, -0.4], taper: 1 });
  // the crown: a few points tossed up and back
  for (const [az, el] of [[0, 62], [-35, 50], [35, 50], [-80, 40], [80, 40], [150, 40], [-150, 40]] as const)
    locks.push({ az, el, len: 1.3, r: 2.6, flat: 0.5, flow: [0, -0.5, -0.9], taper: 1 });
  const bangs: Bang[] = [
    { x: -4.4, tipY: c + 8.2, lean: -0.8, r: 1.7 },
    { x: -2.2, tipY: c + 7.8, lean: -0.3, r: 1.5 },
    { x: 0, tipY: c + 5.6, lean: 0.1, r: 1.1 },
    { x: 2.3, tipY: c + 7.8, lean: 0.3, r: 1.5 },
    { x: 4.4, tipY: c + 8.2, lean: 0.8, r: 1.7 },
  ];
  spikeHair(b, L, 'hair', locks, bangs, { hairline: c + L.spec.head.h - 1.3, nape: c + 1.5, slope: 0.6, tufts: 16, tuftFlow: [0, -0.55, -0.6] });
  clearEyes(b, hd);
}

/** Tiburón: the braids gone, the hair wilder — longer points flaring out at the sides and the back. */
function wildHair(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }): void {
  const c = hd.chin;
  const locks: Spike[] = [];
  for (const k of [-1, 1]) {
    locks.push({ az: k * 86, el: 2, len: 5.2, r: 2.7, flat: 0.5, flow: [k * 0.5, -1.4, 0.1], bend: [k * 0.15, 0, 0], taper: 1 });
    locks.push({ az: k * 66, el: 16, len: 4, r: 2.4, flat: 0.5, flow: [k * 0.6, -1, 0.4], bend: [k * 0.1, 0.05, 0], taper: 1 });
    locks.push({ az: k * 112, el: 8, len: 5.4, r: 2.7, flat: 0.5, flow: [k * 0.6, -1.2, -0.4], bend: [k * 0.15, 0, -0.05], taper: 1 });
    locks.push({ az: k * 100, el: 34, len: 3.8, r: 2.4, flat: 0.5, flow: [k * 0.9, -0.2, -0.3], taper: 1 });
  }
  for (const az of [-165, -140, 140, 165, 180]) locks.push({ az, el: 2, len: 6, r: 2.8, flat: 0.55, flow: [0, -1.1, -0.6], bend: [0, 0.05, -0.1], taper: 1 });
  for (const [az, el] of [[0, 64], [-40, 52], [40, 52], [-90, 46], [90, 46], [150, 44], [-150, 44]] as const)
    locks.push({ az, el, len: 2.4, r: 2.6, flat: 0.5, flow: [az > 0 ? 0.3 : az < 0 ? -0.3 : 0, -0.25, -1], taper: 1 });
  const bangs: Bang[] = [
    { x: -4.6, tipY: c + 7.4, lean: -1.2, r: 1.8 },
    { x: -2.3, tipY: c + 7.6, lean: -0.6, r: 1.5 },
    { x: 0, tipY: c + 5.4, lean: 0.2, r: 1.2 },
    { x: 2.4, tipY: c + 7.6, lean: 0.6, r: 1.5 },
    { x: 4.6, tipY: c + 7.4, lean: 1.2, r: 1.8 },
  ];
  spikeHair(b, L, 'hair', locks, bangs, { hairline: c + L.spec.head.h - 1.3, nape: c + 0.5, slope: 0.6, tufts: 20, tuftFlow: [0, -0.35, -0.7] });
  clearEyes(b, hd);
}

function clearEyes(b: ModelBuilder, hd: { front: number; chin: number }): void {
  const c = hd.chin, front = hd.front;
  // the outer bangs' roots poke out above the crown at the front corners
  for (const k of [-1, 1]) b.carve('head', aabb([k > 0 ? 3 : -9, c + 12.2, front - 2.5], [k > 0 ? 9 : -3, c + 17, front + 3]));
  b.carve('head', aabb([-5, c + 4, front], [-1, c + 8, front + 6]));
  b.carve('head', aabb([1, c + 4, front], [5, c + 8, front + 6]));
  // the cheeks under the eyes stay clear too (the estigma, the collar's rim)
  b.carve('head', aabb([-5, c, front], [5, c + 4, front + 6]));
}

/**
 * One braid along a path: bumps alternating from side to side with a dark parting between them, a small
 * point at the end.
 */
function braid(b: ModelBuilder, bone: string, ctrl: V3[], r: number): void {
  const path = smoothPath(ctrl, 6);
  // resample at even spacing
  const pts: V3[] = [path[0]];
  let acc = 0;
  for (let i = 1; i < path.length; i++) {
    const p = path[i - 1], q = path[i];
    acc += Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
    if (acc >= 1.5) {
      pts.push(q);
      acc = 0;
    }
  }
  b.add(bone, tube(pts, pts.map((_, i) => r * (1 - 0.25 * (i / pts.length)))), 'hair', { thr: 0.3 });
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i], q = pts[i + 1];
    const d: V3 = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
    const dl = Math.hypot(...d) || 1;
    // sideways in the plane facing out from the body
    const side: V3 = [d[1] / dl, -d[0] / dl, 0];
    const k = i % 2 ? 0.4 : -0.4;
    const rr = r * (1 - 0.25 * (i / pts.length));
    b.add(bone, sphere([p[0] + side[0] * k, p[1] + side[1] * k, p[2]], rr + 0.12), 'hair', { thr: 0.25 });
    // the parting between two bumps
    b.paint(bone, sphere([p[0] - (d[0] / dl) * 0.75, p[1] - (d[1] / dl) * 0.75, p[2] - (d[2] / dl) * 0.75], rr * 0.55 + 0.6), 'hair', { shade: 3, where: b.isMat('hair') });
  }
  const end = pts[pts.length - 1], pre = pts[pts.length - 2];
  const dir: V3 = [end[0] - pre[0], end[1] - pre[1], end[2] - pre[2]];
  b.add(bone, spike(end, dir, 2.6, r * 0.9, r * 0.6, { tip: 0.4 }), 'hair', { thr: 0.3 });
}

/** The three braids: two over the collar in front, one down her back (on the neck, with the collar). */
function braids(b: ModelBuilder, L: Landmarks): void {
  const c = L.spec.chinY;
  for (const k of [-1, 1])
    braid(b, 'neck', [[k * 5.4, c + 6.4, 2.2], [k * 7.4, c + 4.2, 3.0], [k * 8.5, c + 0.5, 3.4], [k * 8.5, c - 3.5, 3.8], [k * 7.9, c - 7.5, 4.6], [k * 7.3, c - 10.5, 5.4]], 1.0);
  braid(b, 'neck', [[0, c + 3.6, -6.4], [0, c + 4.3, -9.4], [0, c + 1, -11.0], [0, c - 4, -10.9], [0, c - 8, -11.7], [0, c - 13, -11.7]], 1.05);
}

// ---------------------------------------------------------------------------------------------- sealed

/**
 * The jacket: white, cropped under the bust with a black hem, the zipper down the middle; long full
 * sleeves ending in the black paw gloves. Unzipped, it hangs open down the front.
 */
function jacket(b: ModelBuilder, L: Landmarks, full: Sdf, open: boolean): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const hem = BUST_Y - 3.8;
  const cloth = clothBody(full);
  let shell = intersect(subtract(offset(cloth, 1.1), offset(cloth, 0.1)), aabb([-30, hem, -30], [30, sy + 6, 30]));
  if (open) {
    // hanging open: the gap widens down to the hem as the bust parts it
    const gap = fn((x, y, z) => (z < 0 ? 1 : Math.abs(x) - (2.6 + Math.max(0, sy - 1 - y) * 0.36)), [-12, hem - 2, 0], [12, sy + 8, 14]);
    shell = subtract(shell, gap);
  }
  addBands(b, shell, 'white', [['spine', hem - 1, s.chestY - 4], ['chest', s.chestY - 4, 100]]);
  // the black hem
  b.paint(['chest', 'spine'], aabb([-30, hem - 1, -30], [30, hem + 0.9, 30]), 'trim', { where: b.isMat('white') });
  if (open) {
    // the black edges of the opening
    const edge = fn((x, y, z) => (z < 0 ? 1 : Math.abs(Math.abs(x) - (2.6 + Math.max(0, sy - 1 - y) * 0.36)) - 1.1), [-12, hem - 2, 0], [12, sy + 8, 14]);
    b.paint(['chest', 'spine'], edge, 'trim', { where: b.isMat('white') });
  } else {
    // the zipper: a black line up the middle with a metal track
    b.paint(['chest', 'spine'], intersect(aabb([-0.5, hem - 1, 0], [0.5, sy + 8, 16])), 'trim', { where: b.isMat('white') });
  }
  // the folds under the bust and across the shoulders (big shapes only)
  for (const k of [-1, 1]) b.paint('chest', capsule([k * 6.6, sy + 0.4, 3.5], [k * 4.2, BUST_Y + 2.4, 7.2], 0.6), 'white', { shade: 3, where: b.isMat('white') });
  // long, full sleeves with folds at the elbow
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(1.5, sphere([sx, sy - 0.5, sz], 3.7), cylinder([sx + 0.2, ey - 0.5, sz], [sx, sy - 0.5, sz], 3.4, 3.6, 1.2)), 'white', { mirror: true });
  b.add('forearm.L', blend(1.2, sphere([sx, ey, sz], 3.4), cylinder([sx, wy + 1.4, sz], [sx, ey + 1, sz], 3.9, 3.4, 1)), 'white', { mirror: true });
  for (const dy of [2.2, -1.8]) b.paint('forearm.L', torus([sx, ey + dy, sz], 3.5, 0.55), 'white', { shade: 3, mirror: true });
  b.paint('upperarm.L', torus([sx, ey + 3.5, sz], 3.4, 0.5, [0, 0, 8]), 'white', { shade: 3, mirror: true });
}

/** The black paw gloves: big rounded mittens with a cuff swallowing the wrist. */
function pawGloves(b: ModelBuilder, L: Landmarks): void {
  const [wx, wy, wz] = L.wrist;
  b.add('forearm.L', cylinder([wx, wy - 0.6, wz], [wx, wy + 2.6, wz], 3.3, 3.9, 0.8), 'glove', { mirror: true });
  b.add('palm.L', ellipsoid([wx - 0.1, wy - 3.6, wz + 0.4], [2.1, 3.6, 2.9]), 'glove', { mirror: true, only: 'empty' });
  b.add('fist.L', ellipsoid([wx - 0.1, wy - 3.8, wz + 0.4], [2.5, 3.4, 3.2]), 'glove', { mirror: true, only: 'empty' });
  // the paw pads: a lighter seam round the cuff
  b.paint('forearm.L', cylinder([wx, wy + 1.9, wz], [wx, wy + 2.6, wz], 4.2), 'glove', { shade: 0, mirror: true, where: b.isMat('glove') });
}

/**
 * The high collar: a funnel round the neck and the lower face up to the nose, a black rim, the zipper
 * up its front with the pull at the top, and the two beige air filters either side of the mouth.
 * Unzipped, its front falls open.
 */
function collar(b: ModelBuilder, L: Landmarks, open: boolean): void {
  const s = L.spec;
  const sy = s.shoulder[1];
  const nz = L.headC[2] - 0.6;
  const top = s.chinY + 3.6;
  const bot = sy - 2.5;
  const R = (y: number): [number, number] => {
    const k = Math.max(0, Math.min(1, (y - bot) / (top - bot)));
    return [6.5 + k * 0.9, 7.1 + k * 1.0];
  };
  const ell = (x: number, y: number, z: number) => {
    const [rx, rz] = R(y);
    return (Math.hypot(x / rx, (z - nz) / rz) - 1) * Math.min(rx, rz);
  };
  let shape: Sdf = fn((x, y, z) => Math.max(Math.abs(ell(x, y, z)) - 0.8, y - top, bot - y), [-10, bot - 1, -11], [10, top + 1, 9]);
  if (open) {
    // the front fallen open: the collar stands only round the back and sides
    shape = subtract(shape, fn((x, y, z) => (z < 1 ? 1 : Math.abs(x) - (3.6 + Math.max(0, top - y) * 0.15)), [-10, bot - 2, 0], [10, top + 2, 12]));
  }
  // its base: a ring closing the gap down to the neck, inside the jacket's neckline
  shape = union(shape, intersect(fn((x, y, z) => ell(x, y, z), [-10, bot - 1, -11], [10, top + 1, 9]), aabb([-10, bot, -11], [10, bot + 1.3, 9])));
  if (open) shape = subtract(shape, fn((x, y, z) => (z < 1 ? 1 : Math.abs(x) - (3.6 + Math.max(0, top - y) * 0.15)), [-10, bot - 2, 0], [10, top + 2, 12]));
  b.add('neck', shape, 'white');
  // the inside a shade down, the rim black
  b.paint('neck', fn((x, y, z) => ell(x, y, z) + 0.05, [-10, bot - 1, -11], [10, top + 1, 9]), 'white', { shade: 3, where: b.isMat('white') });
  b.paint('neck', aabb([-12, top - 0.9, -12], [12, top + 1, 12]), 'trim', { where: b.isMat('white') });
  if (open) return;
  // the zipper up the front of the collar
  b.paint('neck', aabb([-0.5, bot - 1, 0], [0.5, top + 1, 14]), 'trim', { where: b.isMat('white') });
  const zf = Math.round(nz + R(top)[1] + 0.8);
  b.voxel('neck', 0, Math.round(top) - 2, zf, 'zip', 0);
  b.voxel('neck', 0, Math.round(top) - 3, zf, 'zip', 1);
  // the air filters: a beige grille each side of the mouth, proud of the collar
  for (const k of [-1, 1]) {
    const x0 = k > 0 ? 1.6 : -4.4;
    const y0 = s.chinY - 1.4, y1 = s.chinY + 1.9;
    b.add('neck', intersect(fn((x, y, z) => Math.max(ell(x, y, z) - 1.45, 0.2 - ell(x, y, z)), [-10, y0, 0], [10, y1, 12]), aabb([x0, y0, 0], [x0 + 2.8, y1, 12]), halfSpace([0, 0, 2], [0, 0, -1])), 'filter');
    b.paint('neck', intersect(aabb([x0, s.chinY + 0.1, 0], [x0 + 2.8, s.chinY + 0.9, 12])), 'filter', { shade: 3, where: b.isMat('filter') });
  }
}

/** The bone mask over her lower face (a toothed jaw), the bone collar, and its extensions over the bust. */
function mask(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }, full: Sdf): void {
  const s = L.spec;
  const c = hd.chin, front = hd.front;
  const hc = L.headC;
  // the jaw: a shell round the face and the sides below the nose
  const jaw = intersect(
    subtract(ellipsoid([0, c + 1.6, hc[2] + 0.4], [5.8, 4.5, 6.6]), ellipsoid([0, c + 1.6, hc[2] + 0.4], [4.8, 3.5, 5.5])),
    aabb([-8, c - 2.5, hc[2] - 2], [8, c + 3.6, front + 3]),
  );
  b.add('head', jaw, 'bone');
  b.add('head', aabb([-4.5, c - 1, front], [4.5, c + 3.6, front + 1.2]), 'bone');
  // the teeth: upper and lower rows parted by the dark mouth line
  for (let x = -4; x < 4; x++) {
    b.voxel('head', x, c + 1, front + 1, 'ink', 0);
    if (x % 2 === 0) {
      b.voxel('head', x, c + 2, front + 1, 'teeth', 0);
      b.voxel('head', x, c, front + 1, 'teeth', 0);
    } else {
      b.voxel('head', x, c + 2, front + 1, 'ink', 0);
      b.voxel('head', x, c, front + 1, 'ink', 0);
    }
  }
  // the collar round the neck
  const nz = hc[2] - 0.8;
  b.add('neck', subtract(cylinder([0, c - 6, nz], [0, c - 0.5, nz], s.neckR + 1.7, s.neckR + 1.3), cylinder([0, c - 7, nz], [0, c, nz], s.neckR + 0.2)), 'bone');
  // its extensions: down from the collar over each breast
  const cz = s.chest[1];
  for (const k of [-1, 1]) {
    b.add('chest', capsule([k * 3.0, c - 5.8, nz + 3.0], [k * 4.4, BUST_Y + 2.0, cz + 2.4], 0.8, 1.0), 'bone', { thr: 0.2 });
    const cup = intersect(subtract(offset(full, 0.9), offset(full, -0.2)), ellipsoid([k * 3.4, BUST_Y + 0.2, cz + 2.6], [2.0, 2.0, 2.4]));
    b.add('chest', cup, 'bone');
  }
  // the "3": the inner side of her right breast, between the bone
  b.stamp('chest', -3, Math.round(BUST_Y + 5.6), THREE, { x: { mat: 'ink' } }, 16, 2);
}

/** The black sash round the hakama's top, knotted at her left hip. */
function sash(b: ModelBuilder, L: Landmarks, full: Sdf): void {
  const s = L.spec;
  const y = s.hipsY + 2.4;
  b.add('hips', intersect(subtract(offset(full, 3.4), offset(full, 1.2)), aabb([-30, y - 1.6, -30], [30, y + 1.6, 30])), 'sash');
  b.paint('hips', intersect(offset(full, 3.5), aabb([-30, y - 0.2, -30], [30, y + 0.2, 30])), 'sash', { shade: 2, where: b.isMat('sash') });
  const kx = s.hips[0] + 2.6;
  b.add('hips', ellipsoid([kx, y - 0.4, 2], [1.4, 1.5, 1.6]), 'sash');
  b.add('hips', capsule([kx + 0.3, y - 1.4, 2.4], [kx + 0.8, y - 7, 3], 1, 0.8), 'sash', { thr: 0.2 });
  b.add('hips', capsule([kx - 0.2, y - 1.4, 1.2], [kx + 0.3, y - 5.5, 0.6], 1, 0.8), 'sash', { thr: 0.2 });
}

/** Black shoes under the hakama. */
function shoes(b: ModelBuilder, L: Landmarks): void {
  const [ax, ay, az] = L.ankle;
  const f = L.spec.foot;
  b.add('foot.L', capsule([ax, ay + 3, az - 0.4], [ax, ay - 1, az - 0.4], 2.4, 2.3), 'shoe', { mirror: true });
  b.add('foot.L', intersect(box([ax, 2.0, az + (f.len / 2 - f.heel)], [f.w / 2 + 0.2, 2.0, f.len / 2], { round: 1.4 }), halfSpace([0, 4.4, az + f.len - f.heel - 3], [0, 1, 0.7])), 'shoe', { mirror: true });
}

// ---------------------------------------------------------------------------------------------- Tiburón

/**
 * The Resurrección: the bone collar and the band over the bust joined by a plate down the sternum, the
 * spine ridge up her stomach, the pointed skirt over the dark undergarment, elbow gloves, knee boots, the
 * shark-fin spaulders and the two ribbons off her back.
 */
function tiburonArmor(b: ModelBuilder, L: Landmarks, full: Sdf, springs: SpringDef[], colliders: ColliderDef[]): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const c = s.chinY;
  const cz = s.chest[1];
  const nz = L.headC[2] - 0.8;
  // the gorget, its point dipping to the sternum
  b.add('neck', subtract(cylinder([0, c - 6.2, nz], [0, c - 0.6, nz], s.neckR + 1.8, s.neckR + 1.2), cylinder([0, c - 7, nz], [0, c, nz], s.neckR + 0.2)), 'bone');
  b.add('chest', spike([0, c - 4.5, nz + 3.6], [0, -1, 0.35], 6.5, 1.8, 0.9, { side: [1, 0, 0], tip: 0.4 }), 'bone', { thr: 0.2 });
  // the band over the bust, a strap round the back
  const cloth = clothBody(full);
  const band = intersect(subtract(offset(cloth, 1.15), offset(cloth, -0.15)), fn((_x, y, z) => {
    const y0 = z > 0 ? BUST_Y - 3.0 : BUST_Y - 1.4, y1 = z > 0 ? BUST_Y + 2.6 : BUST_Y + 1.2;
    return Math.max(y0 - y, y - y1);
  }, [-14, BUST_Y - 5, -12], [14, BUST_Y + 5, 14]));
  b.add('chest', band, 'bone');
  b.paint('chest', intersect(offset(cloth, 1.1), aabb([-14, BUST_Y - 3.1, -12], [14, BUST_Y - 2.2, 14])), 'bone', { shade: 3, where: b.isMat('bone') });
  // the spine-like ridge up her stomach, from above the hole to under the band
  for (let y = s.hipsY + 3.6; y < BUST_Y - 3.2; y += 1.7) {
    const yy = Math.round(y);
    const z = frontZ(b, yy < s.waistY - 1 ? 'hips' : 'spine', 0, yy);
    if (z === null) continue;
    b.add(yy < s.waistY - 1 ? 'hips' : 'spine', box([0, yy + 0.5, z + 1], [1.1, 0.6, 0.6]), 'bone');
  }
  // the dark undergarment under the skirt
  b.paint('hips', aabb([-12, 28, -12], [12, s.hipsY - 1.5, 12]), 'under', { where: b.isMat('skin') });
  b.paint('thigh.L', aabb([-14, s.hip[1] - 3.5, -10], [14, 60, 10]), 'under', { mirror: true, where: b.isMat('skin') });
  // the skirt: four bone panels flaring from the hips to points at mid-thigh, on stiff springs
  const yTop = s.hipsY - 1.0, yHem = s.hipsY - 11;
  const skirt = (a0: number, a1: number) => fn((x, y, z) => {
    const k = Math.max(0, Math.min(1, (yTop - y) / (yTop - yHem)));
    const rx = 8.3 + k * 2.4, rzz = 6.4 + k * 2.2;
    const zc = z + 0.6;
    const rho = Math.hypot(x / rx, zc / rzz);
    const dr = Math.abs(rho - 1) * Math.min(rx, rzz) - 0.7;
    const th = Math.atan2(x, zc);
    const da = th < a0 ? (a0 - th) * 8 : th > a1 ? (th - a1) * 8 : 0;
    // the hem in points: three teeth per panel
    const u = (th - a0) / (a1 - a0);
    const saw = Math.abs(((u * 3) % 1) - 0.5) * 2;
    return Math.max(dr, da, y - yTop, yHem + saw * 3.4 - y);
  }, [-14, yHem - 1, -12], [14, yTop + 1, 12]);
  const panels: [string, number, number, V3][] = [
    ['skirt.F', -0.62, 0.62, [0, yTop, 5.5]],
    ['skirt.L', 0.66, 1.98, [7.5, yTop, 0.5]],
    ['skirt.R', -1.98, -0.66, [-7.5, yTop, 0.5]],
    ['skirt.B', 2.02, Math.PI, [0, yTop, -6]],
  ];
  for (const [bone, a0, a1, p] of panels) {
    b.bone(bone, 'hips', p);
    b.add(bone, bone === 'skirt.B' ? blend(0.01, skirt(a0, a1), skirt(-Math.PI, -2.02)) : skirt(a0, a1), 'bone');
    b.paint(bone, fn((_x, y) => y - (yTop - 1.2), [-14, yHem - 2, -12], [14, yTop + 1, 12]), 'bone', { shade: 3, where: b.isMat('bone') });
    const out = Math.hypot(p[0], p[2]) || 1;
    springs.push({ bone, tail: [(p[0] / out) * 0.08, -0.2, (p[2] / out) * 0.06], stiffness: 130, damping: 7, gravity: 6, limit: 32, radius: 0.05 });
  }
  // elbow gloves: white to above the elbow, a flared cuff
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('forearm.L', blend(1.1, sphere([sx, ey, sz], 2.4), capsule([sx, ey - 0.5, sz], [sx, wy + 0.6, sz], 2.35, 1.95)), 'ribbon', { mirror: true });
  b.add('upperarm.L', cylinder([sx, ey + 0.4, sz], [sx, ey + 3.4, sz], 2.6, 3.1, 0.5), 'ribbon', { mirror: true });
  b.paint('upperarm.L', cylinder([sx, ey + 2.6, sz], [sx, ey + 3.4, sz], 3.6), 'ribbon', { shade: 2, mirror: true, where: b.isMat('ribbon') });
  // knee boots, a pointed top over the knee
  const [kx, ky, kz] = L.knee;
  const [ax, ay, az] = L.ankle;
  b.add('shin.L', blend(1, capsule([kx, ky - 2, kz - 0.3], [ax, ay + 1.4, az], 2.9, 2.2), sphere([kx, ky - 1.5, kz + 0.6], 2.4)), 'bone', { mirror: true });
  b.add('shin.L', spike([kx, ky - 3, kz + 1.6], [0, 1, 0.25], 5.2, 2.0, 0.8, { side: [1, 0, 0], tip: 0.4 }), 'bone', { mirror: true, thr: 0.2 });
  b.paint('shin.L', cylinder([kx, ky - 3.6, kz], [kx, ky - 2.6, kz], 3.6), 'bone', { shade: 3, mirror: true, where: b.isMat('bone') });
  const f = s.foot;
  b.add('foot.L', capsule([ax, ay + 3, az - 0.4], [ax, ay - 1, az - 0.4], 2.4, 2.3), 'bone', { mirror: true });
  b.add('foot.L', intersect(box([ax, 2.0, az + (f.len / 2 - f.heel)], [f.w / 2 + 0.1, 2.0, f.len / 2], { round: 1.4 }), halfSpace([0, 4.2, az + f.len - f.heel - 3], [0, 1, 0.7])), 'bone', { mirror: true });
  b.paint('foot.L', aabb([ax - 5, 0, az - 8], [ax + 5, 1, az + 14]), 'under', { mirror: true });
  // the shark-fin spaulders: a cap over the shoulder and a fin rising from it, swept back
  const cap = intersect(subtract(ellipsoid([sx + 0.8, sy - 0.2, sz], [3.9, 3.4, 4.3]), ellipsoid([sx + 0.8, sy - 0.6, sz], [2.6, 2.1, 3.0])), halfSpace([0, sy - 2.2, 0], [0, -1, 0]));
  b.add('upperarm.L', cap, 'bone', { mirror: true });
  const fin: [number, number][] = [[4, 0], [3.2, 3], [1.4, 6.4], [-1.4, 9.6], [-5.4, 13.4], [-8.6, 14.6], [-6.4, 11.4], [-5.2, 7.6], [-5, 3.4], [-5.6, 0]];
  b.add('upperarm.L', prism(fin, [sx + 1.2, sy + 1.4, sz], [0, 0, 1], [0, 1, 0], 0.9, 0.3), 'bone', { mirror: true, thr: 0.1 });
  // its leading edge a shade lighter, a groove along its root
  const lead: V3[] = fin.slice(0, 6).map(([u, v]) => [sx + 1.2, sy + 1.4 + v, sz + u] as V3);
  b.paint('upperarm.L', tube(lead, lead.map(() => 0.85)), 'bone', { shade: 0, mirror: true, where: b.isMat('bone') });
  b.paint('upperarm.L', capsule([sx + 1.2, sy + 2.2, sz + 3], [sx + 1.2, sy + 2.4, sz - 5], 0.55), 'bone', { shade: 3, mirror: true, where: b.isMat('bone') });
  // the two ribbons off her back, from the band's strap to the backs of her knees
  const R = HARRIBEL_RES;
  for (const k of [-1, 1]) {
    const side = k > 0 ? 'L' : 'R';
    const x0 = k * 2.8, z0 = -cz - 1.6;
    const ys = [BUST_Y - 0.5, s.waistY - 6, s.hipsY - 12, 23];
    const bones = [`ribbon.${side}1`, `ribbon.${side}2`, `ribbon.${side}3`];
    b.bone(bones[0], 'chest', [x0, ys[0], z0]);
    b.bone(bones[1], bones[0], [x0 + k * 0.4, ys[1], z0 - 3.6]);
    b.bone(bones[2], bones[1], [x0 + k * 0.8, ys[2], z0 - 5.4]);
    const pts: V3[] = [[x0, ys[0] + 1, z0 + 0.6], [x0 + k * 0.4, ys[1], z0 - 3.6], [x0 + k * 0.8, ys[2], z0 - 5.4], [x0 + k * 1.1, ys[3], z0 - 5.8]];
    for (let i = 0; i < 3; i++) {
      const p = pts[i], q = pts[i + 1];
      const flat = fn((x, y, z) => {
        // a flat strip 3 wide, 1 thick, from p to q
        const t = Math.max(0, Math.min(1, (p[1] - y) / (p[1] - q[1])));
        const cx = p[0] + (q[0] - p[0]) * t, czz = p[2] + (q[2] - p[2]) * t;
        const w = i === 2 ? 1.7 * (1 - t * 0.5) : 1.7;
        return Math.max(Math.abs(x - cx) - w, Math.abs(z - czz) - 0.55, y - p[1] - 0.6, q[1] - 0.6 - y);
      }, [x0 - 5, q[1] - 1, z0 - 9], [x0 + 5, p[1] + 1, z0 + 3]);
      b.add(bones[i], flat, 'ribbon', { thr: 0.1 });
      const tail: V3 = [(q[0] - p[0]) / R, (q[1] - p[1]) / R, (q[2] - p[2]) / R];
      springs.push({ bone: bones[i], tail, stiffness: 46 - i * 10, damping: 4.5, gravity: 10, limit: 70, radius: 0.04 });
    }
  }
  colliders.push({ bone: 'hips', offset: [0, -0.04, -0.06], radius: 0.13 }, { bone: 'spine', offset: [0, 0.02, -0.04], radius: 0.11 });
}

// ---------------------------------------------------------------------------------------------- props

/**
 * Tiburón sealed: a broad, short blade that is only an outline — a long window through the middle — with
 * a point skewed toward the edge; the steel guard as wide as the blade, three holes at each end; the purple
 * handle. Prop frame: the grip at the origin, the blade along +Z, its edge toward −Y.
 */
function buildTiburon(): VoxelModel {
  const b = new ModelBuilder('harribel-tiburon', HARRIBEL_RES);
  b.mat('steel', ['#E9EDF0', '#C9CED3', '#A9AEB4', '#868B92'], { base: 1, rough: 0.28, metal: 0.85 });
  b.mat('edge', ['#F1F3F4'], { rough: 0.2, metal: 0.9 });
  b.mat('wrap', ['#8A55B0', '#6B3B8E', '#522B6E', '#3C1F52'], { base: 1, rough: 0.8 });
  b.mat('pommel', ['#B6BBC1', '#9A9FA6', '#7C8188'], { base: 1, rough: 0.35, metal: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  addTiburon(b, 'root');
  b.autoShade();
  b.lint();
  return b.build();
}

/** the blade's outline: straight from the guard, then the spine sweeps down to a point near the edge */
const BL = { z0: 7, zs: 37, ze: 43, zt: 50, ye: -5.5, ys: 5.5, yp: -2.6 };
const spineAt = (z: number) => (z <= BL.zs ? BL.ys : BL.ys + ((BL.yp - BL.ys) * (z - BL.zs)) / (BL.zt - BL.zs));
const edgeAt = (z: number) => (z <= BL.ze ? BL.ye : BL.ye + ((BL.yp - BL.ye) * (z - BL.ze)) / (BL.zt - BL.ze));
/** the outline as a 2D distance (y across, z along), inset by `inset` */
function bladeOutline(y: number, z: number, inset: number): number {
  return Math.max(edgeAt(z) + inset - y, y - (spineAt(z) - inset), BL.z0 + inset - z, z - (BL.zt - inset * 1.6));
}

function addTiburon(b: ModelBuilder, bone: string): void {
  // the blade: 2 thick, the long window cut through its middle (the point stays solid)
  const frame = fn((x, y, z) => Math.max(Math.abs(x) - 1, bladeOutline(y, z, 0)), [-2, -7, 5], [2, 7, 52]);
  b.add(bone, subtract(frame, TIB_WINDOW), 'steel');
  // the edge: the outermost line along the cutting side
  b.paint(bone, fn((x, y, z) => Math.max(Math.abs(x) - 1, bladeOutline(y, z, 0), y - (edgeAt(z) + 1.0)), [-2, -7, 5], [2, 7, 52]), 'edge', { where: b.isMat('steel') });
  // the guard: as wide as the blade, three holes at each end
  b.add(bone, box([0, 0, 5.2], [1.6, 7.2, 1.6], { round: 0.6 }), 'steel');
  for (const cell of [1, 3, 5]) {
    b.carve(bone, aabb([-3, cell + 0.1, 5.1], [3, cell + 0.9, 5.9]));
    b.carve(bone, aabb([-3, -cell - 0.9, 5.1], [3, -cell - 0.1, 5.9]));
  }
  // the handle: purple wrap with a diamond pattern, a steel pommel
  b.add(bone, cylinder([0, 0, -8.2], [0, 0, 3.8], 1.25), 'wrap');
  for (let z = -7.5; z < 3.5; z += 2.2) b.paint(bone, torus([0, 0, z], 1.25, 0.45, [90, 0, 0]), 'wrap', { shade: 3 });
  b.add(bone, ellipsoid([0, 0, -9.4], [1.7, 1.7, 1.3]), 'pommel');
  b.add(bone, cylinder([0, 0, 3.4], [0, 0, 3.9], 1.7), 'pommel');
}

/**
 * The sheath on her back: a flat white sleeve with black ends, shorter than the blade (the point stands out
 * past it). With the sword in it, the hilt sits out at the mouth.
 */
function buildSheath(withSword: boolean): VoxelModel {
  const b = new ModelBuilder(`harribel-sheath${withSword ? '' : '-empty'}`, HARRIBEL_RES);
  b.mat('sheath', ['#3A3A40', '#2A2A2E', '#1E1E22', '#141418'], { base: 1, rough: 0.55 });
  b.mat('trimS', ['#B6BBC1', '#9A9FA6', '#7C8188'], { base: 1, rough: 0.35, metal: 0.8 });
  b.mat('steel', ['#E9EDF0', '#C9CED3', '#A9AEB4', '#868B92'], { base: 1, rough: 0.28, metal: 0.85 });
  b.mat('edge', ['#F1F3F4'], { rough: 0.2, metal: 0.9 });
  b.mat('wrap', ['#8A55B0', '#6B3B8E', '#522B6E', '#3C1F52'], { base: 1, rough: 0.8 });
  b.mat('pommel', ['#B6BBC1', '#9A9FA6', '#7C8188'], { base: 1, rough: 0.35, metal: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  const z0 = 6.4, z1 = 33;
  // a sleeve hugging the blade, cut open over its window so the sword reads as hollow
  b.add('root', subtract(box([0, -0.1, (z0 + z1) / 2], [2.1, 6.6, (z1 - z0) / 2], { round: 1.0 }), box([0, -0.1, (z0 + z1) / 2], [1.1, 5.8, (z1 - z0) / 2 + 2]), box([0, 0.1, 21], [4, 2.4, 9.5], { round: 1.2 })), 'sheath');
  b.paint('root', aabb([-4, -9, z0 - 1], [4, 9, z0 + 1.4]), 'trimS', { where: b.isMat('sheath') });
  b.paint('root', aabb([-4, -9, z1 - 1.4], [4, 9, z1 + 1]), 'trimS', { where: b.isMat('sheath') });
  // a band across the middle, and the cord loops that hold it on her back
  b.paint('root', aabb([-4, -9, 19], [4, 9, 20.4]), 'trimS', { where: b.isMat('sheath') });
  if (withSword) addTiburon(b, 'root');
  else {
    // empty: close the mouth's inside so it reads dark, not see-through
    b.add('root', box([0, -0.2, z0 + 1], [1.3, 5.9, 0.5]), 'trimS');
  }
  b.autoShade();
  b.lint();
  return b.build();
}

/**
 * The pata: a broad bone blade like an elongated shark tooth, gill slits along both faces near its root, a
 * guard that closes round the whole fist and wrist. Prop frame: the grip at the origin; the blade runs along
 * −Y past the knuckles (along the forearm), its flat facing ±X.
 */
function buildPata(): VoxelModel {
  const b = new ModelBuilder('harribel-pata', HARRIBEL_RES);
  b.mat('bone', ['#F4F1E8', '#ECE7DA', '#DAD3C2', '#C2BAA6', '#A39B87'], { base: 1, rough: 0.38, shadeK: 1 });
  b.mat('gill', ['#2B2B2B', '#1E1E22'], { base: 0, rough: 0.6 });
  b.mat('rim', ['#C9C2B0', '#ADA591'], { base: 0, rough: 0.4 });
  b.bone('root', null, [0, 0, 0]);
  // the guard: a rounded shell round the fist and wrist, open at the elbow end
  const guard = subtract(ellipsoid([0, 0.8, 0.3], [3.2, 6.4, 3.9]), ellipsoid([0, 2.4, 0.3], [2.2, 5.6, 2.9]), aabb([-5, 6, -5], [5, 9, 5]));
  b.add('root', guard, 'bone');
  b.paint('root', aabb([-5, 4.6, -5], [5, 6, 5]), 'rim', { where: b.isMat('bone') });
  // the tooth: wide at the root, its edges curving to the point, a little forward-swept
  const tooth = fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (-4.5 - y) / 39.5));
    const zc = 0.3 + t * t * 2.2;
    const half = 4.6 * (1 - Math.pow(t, 1.35)) + 0.35;
    const thick = 1.25 * (1 - t * 0.6);
    return Math.max(Math.abs(z - zc) - half, Math.abs(x) - thick, y - (-3.5), -44.5 - y);
  }, [-2, -45, -6], [2, -3, 7]);
  b.add('root', tooth, 'bone', { thr: 0.1 });
  // a ridge down the middle of each face
  b.add('root', capsule([0, -5, 0.4], [0, -30, 1.6], 1.45, 0.6), 'bone');
  b.paint('root', capsule([0, -5, 0.4], [0, -30, 1.6], 1.5, 0.65), 'bone', { shade: 0, where: b.isMat('bone') });
  // the gills: four slits slanting back along each face
  for (let i = 0; i < 4; i++) {
    const y0 = -9 - i * 3.2;
    for (const k of [-1, 1]) b.paint('root', capsule([k * 1.6, y0, -2.6], [k * 1.6, y0 - 1.6, 2.2], 0.5), 'gill', { where: b.isMat('bone') });
  }
  // the edges a shade lighter
  b.paint('root', fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (-4.5 - y) / 39.5));
    const zc = 0.3 + t * t * 2.2;
    const half = 4.6 * (1 - Math.pow(t, 1.35)) + 0.35;
    return Math.max(-(Math.abs(z - zc) - (half - 0.9)), Math.abs(x) - 3);
  }, [-3, -45, -6], [3, -4, 7]), 'bone', { shade: 0, where: b.isMat('bone') });
  b.autoShade();
  b.lint();
  return b.build();
}
