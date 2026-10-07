// Yoruichi Shihōin — the Flash Goddess. Construction and palette from docs/roster/A3-urahara-shop-and-shiba.md
// §2, the Soul Society → Arrancar arc look: slender and athletic (1.56 m, long legs), dark skin, golden
// cat-like eyes, plum-purple hair pulled back into a long ponytail (cream tie, red cord) with chin-length side
// bangs framing the face; an orange wrap-front over-shirt with two white straps over each shoulder, worn over
// a black high-necked, sleeveless, backless undershirt; a beige sash, black stretch pants, long beige arm and
// leg warmers cinched with dark bands, light brown shoes. 78 voxels at 50 vox/m.
// Shunkō: the orange layer is gone, so the back and shoulders (where the lightning Kidō is compressed) are
// bare. Raijin Senkei: the bangs are swept up into two horns.
import { ModelBuilder } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, smoothPath, sphere, spike, subtract, torus, tube, type Sdf, type V3 } from '../models/sdf';
import { addBands, faceLegend, hands, head, humanoidSkeleton, spikeHair, type HumanoidSpec, type Landmarks, type Spike } from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

/** 78 voxels = 1.56 m */
export const YORUICHI_RES = 78 / 1.56;
export type YoruichiForm = 'standard' | 'shunko' | 'raijin';

/** Slender and athletic: narrow shoulders, a small waist, long legs. */
const SPEC: HumanoidSpec = {
  H: 78,
  chinY: 66,
  head: { w: 10, d: 11, h: 12 },
  neckR: 2.1,
  shoulder: [7.6, 60.6, -0.5],
  upperArm: 12.6,
  foreArm: 11.6,
  hand: 7.4,
  armR: 2.0,
  hipsY: 41,
  hip: [4.1, 38.5, 0],
  kneeY: 21.5,
  ankleY: 4,
  chest: [6.4, 4.3],
  waist: [4.8, 3.5],
  hips: [6.6, 4.6],
  chestY: 55,
  waistY: 47,
  foot: { len: 10, w: 4.2, heel: 2.6 },
};

function palette(b: ModelBuilder): void {
  b.mat('skin', ['#B98A69', '#AC7D5C', '#9C6B4E', '#7A533E', '#5A3E30'], { base: 2, rough: 0.55, shadeK: 0.9 });
  b.mat('hair', ['#8A4E82', '#6E3A66', '#55284A', '#3E2032', '#281E2A'], { base: 2, rough: 0.45, shadeK: 0.85, dither: 0.05 });
  b.mat('sheen', ['#946088']);
  b.mat('brow', ['#3A2030']);
  b.mat('lid', ['#24161E']);
  b.mat('sclera', ['#F1EDE4']);
  b.mat('iris', ['#D9B035']);
  b.mat('irisD', ['#2A1A10']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#6E3A32']);
  b.mat('orange', ['#F0A05A', '#E9924A', '#D2783A', '#B45426', '#7A3A22'], { base: 2, rough: 0.75, shadeK: 0.9 });
  b.mat('black', ['#45434A', '#343038', '#28252B', '#1C1A1E', '#141418'], { base: 2, rough: 0.7, shadeK: 0.9 });
  b.mat('strap', ['#F3F3F0', '#E9F1F5', '#C7C6C7'], { base: 1, rough: 0.7 });
  b.mat('beige', ['#F0E4C4', '#E6D7B0', '#D2BF94', '#B39C72', '#8E7A55'], { base: 2, rough: 0.85, shadeK: 0.9 });
  b.mat('band', ['#8E7A55', '#6E5C3E']);
  b.mat('cord', ['#D8383E', '#C8282E', '#8E1A20']);
  b.mat('shoe', ['#8C8274', '#7A7166', '#5E5448', '#4B4033'], { base: 1, rough: 0.6 });
  b.mat('sole', ['#3E352C']);
}

/** Golden cat eyes under a heavy upper lash line that flicks out at the corners; a sly half-smile. Rows 9 → 0. */
const FACE = [
  '. B B . . . . B B .',
  'L . . . . . . . . L',
  '. L L L . . L L L .',
  '. W I I . . I I W .',
  '. W * i . . i * W .',
  '. . I I . . I I . .',
  '. . . . . s . . . .',
  '. . . . . . . m . .',
  '. . . . m m m . . .',
  '. . . . . . . . . .',
];

const assetCache = new Map<YoruichiForm, CharacterAsset>();

export function yoruichiAsset(form: YoruichiForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildYoruichi(form)));
  return a;
}

export function buildYoruichi(form: YoruichiForm = 'standard'): CharacterAsset {
  const b = new ModelBuilder(`yoruichi-${form}`, YORUICHI_RES);
  palette(b);
  const s = SPEC;
  const L = humanoidSkeleton(b, s);
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 5, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5, wz + 1]);
  // the striking surfaces: knuckles, and the toes of each foot
  b.socket('knuckle.R', 'fist.R', [-wx, wy - 4.3, wz + 3.4]);
  b.socket('knuckle.L', 'fist.L', [wx, wy - 4.3, wz + 3.4]);
  const toeZ = L.ankle[2] + s.foot.len - s.foot.heel;
  b.socket('toe.R', 'foot.R', [-L.ankle[0], 1.5, toeZ]);
  b.socket('toe.L', 'foot.L', [L.ankle[0], 1.5, toeZ]);
  b.socket('heel.R', 'foot.R', [-L.ankle[0], 1.5, L.ankle[2] - s.foot.heel]);
  b.socket('chest.front', 'chest', [0, s.chestY, 6]);
  b.socket('back', 'chest', [0, s.chestY + 1, -6]);
  b.socket('shoulder.R', 'upperarm.R', [-s.shoulder[0], s.shoulder[1] + 2, s.shoulder[2]]);
  b.socket('shoulder.L', 'upperarm.L', [s.shoulder[0], s.shoulder[1] + 2, s.shoulder[2]]);

  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.stamp('head', hd.x0, hd.chin + 9, FACE, faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  const springs = hair(b, L, hd, form);
  hands(b, L, 'skin');
  const torso = body(b, L);
  undershirt(b, L);
  if (form === 'standard') overShirt(b, L, torso);
  springs.push(...sash(b, L, torso));
  warmers(b, L);
  legs(b, L);
  b.autoShade();
  b.lint();
  const colliders: ColliderDef[] = [
    { bone: 'chest', offset: [0, 0.08, -0.02], radius: 0.13 },
    { bone: 'spine', offset: [0, 0.02, -0.01], radius: 0.11 },
    { bone: 'hips', offset: [0, -0.02, -0.01], radius: 0.13 },
    { bone: 'head', offset: [0, 0.12, -0.01], radius: 0.12 },
    { bone: 'thigh.L', offset: [0, -0.1, 0.02], radius: 0.09 },
    { bone: 'thigh.R', offset: [0, -0.1, 0.02], radius: 0.09 },
  ];
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- hair

/**
 * Swept back off the face into a long ponytail tied high at the back of the head (a cream band and a red
 * cord), with bangs parted over the forehead and a long lock down each side of the face to the chin. The
 * ponytail hangs on a chain of three spring bones. Raijin Senkei: the bangs stand up into two horns.
 */
function hair(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }, form: YoruichiForm): SpringDef[] {
  const s = L.spec;
  const c = hd.chin;
  const front = hd.front;
  const back = front - s.head.d;
  const R = YORUICHI_RES;
  const locks: Spike[] = [];
  // pulled back: flat locks over the crown and sides, all flowing to the tie
  for (const [az, el] of [[-100, 20], [100, 20], [-130, 30], [130, 30], [0, 62], [-30, 55], [30, 55]] as const)
    locks.push({ az, el, len: 0.8, r: 3.2, flat: 0.45, flow: [0, 0.35, -1.2] });
  // the side locks: from the temples down past the cheeks to the jaw, curving in a little at the ends
  for (const k of [-1, 1]) {
    locks.push({ az: k * 76, el: 6, len: 6.4, r: 2.3, flat: 0.4, flow: [k * 0.05, -1.8, 0.25], bend: [-k * 0.08, 0, 0.08], taper: 1 });
    locks.push({ az: k * 64, el: 22, len: 3.2, r: 2, flat: 0.4, flow: [k * 0.1, -1.4, 0.2], bend: [k * 0.15, 0, 0], taper: 1 });
  }
  const raijin = form === 'raijin';
  spikeHair(b, L, 'hair', locks, raijin ? [] : [
    // parted bangs, falling to either side of the brow; the eyes stay clear
    { x: -4.3, tipY: c + 8.4, lean: -1.2, r: 1.5 },
    { x: 4.3, tipY: c + 8.4, lean: 1.2, r: 1.5 },
    { x: -1.1, tipY: c + 9.8, lean: -0.5, r: 1.2 },
    { x: 1.3, tipY: c + 9.6, lean: 0.5, r: 1.2 },
  ], { hairline: c + s.head.h - 1.2, nape: c + 2.5, slope: 0.55 });
  if (raijin) {
    // Raijin Senkei: the bangs swept straight up into two horns
    for (const k of [-1, 1]) b.add('head', spike([k * 2.4, c + s.head.h - 1, front - 2], [k * 0.28, 1, -0.3], 9, 2.4, 1.3, { side: [1, 0, 0], bend: [k * 0.05, 0, -0.25], tip: 0.5 }), 'hair', { thr: 0.3 });
  }
  b.paint('head', torus([0, c + s.head.h - 1.1, L.headC[2] - 1], 4.5, 0.6, [22, 0, 0]), 'sheen', { where: b.isMat('hair') });
  // the outer bangs' roots poke out above the crown at the front corners
  if (!raijin) for (const k of [-1, 1]) b.carve('head', aabb([k > 0 ? 3 : -9, c + s.head.h + 0.2, front - 2.5], [k > 0 ? 9 : -3, c + 17, front + 3]));
  // keep the eyes clear
  b.carve('head', aabb([-5, c + 4, front], [-1, c + 7, front + 6]));
  b.carve('head', aabb([1, c + 4, front], [5, c + 7, front + 6]));

  // the ponytail: tied high at the back of the head, flaring, then tapering to a point at the waist
  const tie: V3 = [0, c + 9, back - 0.2];
  b.add('head', torus([tie[0], tie[1], tie[2] - 0.8], 2.2, 0.9, [70, 0, 0]), 'beige', { thr: 0.2 });
  b.add('head', torus([tie[0], tie[1] - 0.2, tie[2] - 1.6], 1.9, 0.6, [70, 0, 0]), 'cord', { thr: 0.2 });
  // the cord's tied ends hang off the knot
  for (const k of [-1, 1]) b.add('head', capsule([k * 0.8, tie[1] - 1, tie[2] - 2.2], [k * 1.8, tie[1] - 4.5, tie[2] - 2.6], 0.55, 0.45), 'cord', { thr: 0.2 });
  const p0 = tie, p1: V3 = [0, c - 1, back - 3], p2: V3 = [0, c - 11, back - 3.4], p3: V3 = [0, c - 22, back - 2.8];
  b.bone('pony1', 'head', [p0[0], p0[1], p0[2] - 1.5]);
  b.bone('pony2', 'pony1', p1);
  b.bone('pony3', 'pony2', p2);
  const path = smoothPath([[0, tie[1] + 0.5, tie[2] - 1], [0, tie[1] - 3, tie[2] - 3.2], p1, [0, c - 6, back - 3.6], p2, [0, c - 17, back - 3.3], p3], 3);
  const radii = path.map((_, i) => {
    const t = i / (path.length - 1);
    // tight at the tie, full through the middle, a point at the end
    return t < 0.08 ? 2.1 : 2.1 + Math.sin(Math.min(1, (t - 0.08) / 0.8) * Math.PI * 0.62) * 1.7 * (1 - Math.max(0, t - 0.6) / 0.4);
  });
  const tail = tube(path, radii.map((r) => Math.max(0.35, r)));
  const flat = intersect(tail, fn((x, y, z) => Math.abs(x) * 0.78 - 4, [-8, c - 26, back - 9], [8, c + 12, back + 2]));
  const bands: [string, number, number][] = [['pony1', p1[1], c + 12], ['pony2', p2[1], p1[1]], ['pony3', c - 26, p2[1]]];
  for (const [bone, y0, y1] of bands) b.add(bone, intersect(flat, aabb([-20, y0, -40], [20, y1, 40])), 'hair', { thr: 0.3 });
  // strands: a few grooves down its length
  for (const x of [-1.2, 1.2]) for (const [bone, y0, y1] of bands) b.paint(bone, intersect(capsule([x, c + 6, back - 4.5], [x * 0.6, c - 24, back - 4.6], 0.5), aabb([-20, y0, -40], [20, y1, 40])), 'hair', { shade: 3, where: b.isMat('hair') });
  return [
    { bone: 'pony1', tail: [0, (p1[1] - p0[1]) / R, (p1[2] - p0[2] + 1.5) / R], stiffness: 55, damping: 5, gravity: 9, limit: 65, radius: 0.05 },
    { bone: 'pony2', tail: [0, (p2[1] - p1[1]) / R, (p2[2] - p1[2]) / R], stiffness: 34, damping: 4.5, gravity: 10, limit: 60, radius: 0.05 },
    { bone: 'pony3', tail: [0, (p3[1] - p2[1]) / R, (p3[2] - p2[2]) / R], stiffness: 22, damping: 4, gravity: 11, limit: 55, radius: 0.04 },
  ];
}

// ---------------------------------------------------------------------------------------------- body

/** The bare body: a slim, curvy torso, bare shoulders and upper arms. */
function body(b: ModelBuilder, L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const torso = blend(2.4,
    box([0, s.chestY - 0.5, -0.3], [cx, 5.6, cz], { round: 3 }),
    box([0, s.waistY, -0.2], [wx, 4.4, wz], { round: 2.6 }),
    box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 3.8, s.hips[1]], { round: 2.8 }),
    capsule([2.0, sy + 1.4, sz - 0.8], [sx - 1.4, sy - 0.2, sz], 2.2, 2.2),
    capsule([-2.0, sy + 1.4, sz - 0.8], [-sx + 1.4, sy - 0.2, sz], 2.2, 2.2),
    sphere([sx, sy - 0.5, sz], 2.5), sphere([-sx, sy - 0.5, sz], 2.5));
  const bust = blend(1.0, ellipsoid([2.5, s.chestY - 1.2, cz - 0.4], [2.6, 2.4, 2.3]), ellipsoid([-2.5, s.chestY - 1.2, cz - 0.4], [2.6, 2.4, 2.3]));
  const full = blend(1.2, torso, bust);
  addBands(b, full, 'skin', [['hips', 30, s.waistY - 1], ['spine', s.waistY - 1, s.chestY - 4], ['chest', s.chestY - 4, 72]]);
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(1.3, sphere([sx, sy - 0.5, sz], 2.6), capsule([sx, sy - 1, sz], [sx, ey + 0.5, sz], 2.3, 2.0)), 'skin', { mirror: true });
  b.add('forearm.L', blend(1.1, sphere([sx, ey, sz], 2.0), capsule([sx, ey - 0.5, sz], [sx, wy + 1, sz], 2.0, 1.6)), 'skin', { mirror: true });
  return full;
}

/**
 * The black undershirt: a high neck, no sleeves and no back. Halter straps run from the collar to the
 * armpits, so the shoulders are bare.
 */
function undershirt(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const armpit = s.shoulder[1] - 4;
  const region = fn((x, y, z) => {
    if (y < s.waistY - 4 || y > s.chinY - 1) return 1;
    // the back is bare above the waistband
    const backCut = z < -1.6 + Math.max(0, (y - armpit) * 0.08) && y > s.waistY - 1 ? 1 : -1;
    // halter: narrow at the neck, widening to the armpits
    const w = y > armpit ? 3.3 + (s.chinY - 1 - y) * 0.42 : 30;
    return Math.max(backCut, Math.abs(x) - w);
  }, [-20, s.waistY - 5, -20], [20, s.chinY, 20]);
  b.paint(['chest', 'spine', 'hips'], region, 'black', { where: b.isMat('skin') });
  // the high collar round the neck
  const nz = L.headC[2] - 0.5;
  b.add('neck', subtract(cylinder([0, s.chinY - 6.5, nz], [0, s.chinY - 1.2, nz], s.neckR + 0.9, s.neckR + 0.7), cylinder([0, s.chinY - 7, nz], [0, s.chinY, nz], s.neckR - 0.2)), 'black');
}

/**
 * The orange over-shirt: a short wrap-front top over the undershirt, hem at the hips, the left panel
 * crossing over the right in a deep V that shows the black high neck. It is sleeveless, with the shoulders
 * capped. Two white straps run over each shoulder.
 */
function overShirt(b: ModelBuilder, L: Landmarks, torso: Sdf): void {
  const s = L.spec;
  const [sx, sy] = s.shoulder;
  const shellT = intersect(subtract(offset(torso, 0.8), offset(torso, -0.1)), aabb([-30, s.hipsY - 3, -30], [30, sy + 2.4, 30]));
  // the V: open from the collar down to the sternum, its point a little to her right (the wrap)
  const vee = fn((x, y, z) => {
    if (z < 0) return 1;
    const depth = s.chestY - 3.5;
    if (y < depth) return 1;
    const half = 0.6 + (y - depth) * 0.42;
    return Math.abs(x + 0.8) - half;
  }, [-12, s.chestY - 5, 0], [12, sy + 5, 14]);
  // armholes: the arms come out bare under a short cap over each shoulder
  const arm = (k: number) => capsule([k * (sx + 0.4), sy - 1.8, s.shoulder[2]], [k * (sx + 0.4), sy - 9, s.shoulder[2]], 3.6);
  const shirt = subtract(shellT, vee, arm(1), arm(-1));
  addBands(b, shirt, 'orange', [['hips', 30, s.waistY - 1], ['spine', s.waistY - 1, s.chestY - 4], ['chest', s.chestY - 4, 72]]);
  // the wrap seam: the left panel's edge running from her left collar to her right hip
  b.paint(['chest', 'spine', 'hips'], fn((x, y, z) => {
    if (z < 0 || y > s.chestY - 3.5) return 1;
    const t = (s.chestY - 3.5 - y) / (s.chestY - 3.5 - (s.hipsY - 2));
    return Math.abs(x - (-0.8 - t * 4.5)) - 0.5;
  }, [-12, s.hipsY - 4, 0], [12, s.chestY, 14]), 'orange', { shade: 3, where: b.isMat('orange') });
  // the white straps over each shoulder, front to back
  for (const k of [-1, 1]) for (const x of [3.6, 5.4])
    b.paint('chest', fn((px, y) => (y < s.chestY + 0.5 ? 1 : Math.abs(px - k * x) - 0.55), [-14, s.chestY, -14], [14, sy + 5, 14]), 'strap', { where: b.isMat('orange') });
}

/** The beige sash round the waist, knotted at her left hip with two short tails on a spring bone. */
function sash(b: ModelBuilder, L: Landmarks, torso: Sdf): SpringDef[] {
  const s = L.spec;
  const y = s.waistY - 2.2;
  b.add('spine', intersect(subtract(offset(torso, 1.9), offset(torso, -0.6)), aabb([-30, y - 1.6, -30], [30, y + 1.6, 30])), 'beige');
  b.paint('spine', intersect(offset(torso, 2), aabb([-30, y - 0.3, -30], [30, y + 0.3, 30])), 'beige', { shade: 3, where: b.isMat('beige') });
  const knot: V3 = [s.waist[0] + 1.2, y, 1.2];
  b.add('spine', ellipsoid(knot, [1.6, 1.5, 1.4]), 'beige');
  b.bone('sash.tails', 'spine', [knot[0], knot[1] - 0.5, knot[2]]);
  b.add('sash.tails', capsule([knot[0] + 0.2, y - 0.6, knot[2] + 0.4], [knot[0] + 1.2, y - 7, knot[2] + 1.0], 1.0, 0.8), 'beige', { thr: 0.2 });
  b.add('sash.tails', capsule([knot[0] + 0.4, y - 0.6, knot[2] - 0.6], [knot[0] + 1.8, y - 5.5, knot[2] - 1.0], 0.9, 0.7), 'beige', { thr: 0.2 });
  return [{ bone: 'sash.tails', tail: [0.02, -0.12, 0.01], stiffness: 45, damping: 5, gravity: 9, limit: 60, radius: 0.03 }];
}

/** Long beige warmers from the wrists to below the elbows, cinched with dark bands. */
function warmers(b: ModelBuilder, L: Landmarks): void {
  const [sx, , sz] = L.spec.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('forearm.L', capsule([sx, ey - 1.5, sz], [sx, wy + 0.4, sz], 2.55, 2.25), 'beige', { mirror: true });
  b.add('forearm.L', cylinder([sx, ey - 1.6, sz], [sx, ey - 0.9, sz], 2.75), 'beige', { mirror: true });
  for (const y of [ey - 1.2, wy + 4.5, wy + 1.2]) b.paint('forearm.L', cylinder([sx, y - 0.45, sz], [sx, y + 0.45, sz], 3), 'band', { mirror: true, where: b.isMat('beige') });
}

/** Black stretch pants, beige leg warmers from the ankles to below the knees, light shoes. */
function legs(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [hx, hy, hz] = s.hip;
  const [kx, ky, kz] = L.knee;
  const [ax, ay, az] = L.ankle;
  b.add('hips', box([0, s.hipsY - 0.5, -0.3], [s.hips[0] + 0.4, 3.8, s.hips[1] + 0.4], { round: 2.6 }), 'black');
  b.add('thigh.L', blend(1.3, sphere([hx, hy, hz], 3.4), capsule([hx, hy, hz], [kx, ky + 1, kz], 3.3, 2.5)), 'black', { mirror: true });
  b.add('shin.L', blend(1.1, sphere([kx, ky, kz], 2.5), capsule([kx, ky, kz], [ax, ay + 2, az], 2.4, 1.8)), 'black', { mirror: true });
  // the leg warmers: loose, slouching a little at the top
  b.add('shin.L', capsule([kx, ky - 3, kz - 0.1], [ax, ay + 1.5, az], 2.9, 2.5), 'beige', { mirror: true });
  b.add('shin.L', cylinder([kx, ky - 3.6, kz - 0.1], [kx, ky - 2.4, kz - 0.1], 3.1), 'beige', { mirror: true });
  for (const y of [ky - 3, ay + 8, ay + 2.4]) b.paint('shin.L', cylinder([kx, y - 0.45, kz], [kx, y + 0.45, kz], 3.4), 'band', { mirror: true, where: b.isMat('beige') });
  // light, soft shoes
  const f = s.foot;
  const toeZ = az + f.len - f.heel;
  b.add('foot.L', capsule([ax, ay + 1.2, az - 0.3], [ax, ay - 1, az - 0.3], 2.2), 'shoe', { mirror: true });
  b.add('foot.L', intersect(box([ax, 2.0, az + (f.len / 2 - f.heel)], [f.w / 2, 2.0, f.len / 2], { round: 1.4 }), halfSpace([0, 4.2, toeZ - 3], [0, 1, 0.7])), 'shoe', { mirror: true });
  b.paint('foot.L', aabb([ax - 5, 0, az - 8], [ax + 5, 1, az + 14]), 'sole', { mirror: true });
}
