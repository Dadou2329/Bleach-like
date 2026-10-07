// Kisuke Urahara — the shopkeeper. Construction and palette from docs/roster/A3-urahara-shop-and-shiba.md
// §1, the Karakura look: tall, lean and loose (1.83 m, 88 voxels at 48 vox/m), a green-and-white striped
// bucket hat pulled low so his eyes sit in the brim's shadow, shaggy pale hair spilling out under it to
// the jaw with strands between the eyes, chin stubble and a half-smile; a dark green samue wrapped open in
// a deep V and tied at the waist, ankle-cropped trousers over bare shins; a long olive-black haori worn
// open, with a row of tall white lozenges round its hem; two-tooth geta. The cane is the sealed Benihime
// (its shaft is the sheath, the crook handle the hilt). Shikai: Benihime, a black blade with a silver edge
// and a slanted razor tip, a U-guard of petals, a red cord with a paper charm, and a crimson tassel.
// Bankai: the giant doll Benihime and the black curtain she leans out of.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, prism, rotate, smoothPath, sphere, spike, subtract, torus, tube, type Sdf, type V3 } from '../models/sdf';
import { coatSkirt, faceLegend, hands, head, humanoidSkeleton, kosodeSleeves, kosodeTorso, spikeHair, type HumanoidSpec, type Landmarks, type Spike } from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

export const URAHARA_RES = 88 / 1.83;

/** Tall and lean, long limbs; the feet sit two voxels up on the geta. */
const SPEC: HumanoidSpec = {
  H: 88,
  chinY: 76,
  head: { w: 10, d: 11, h: 12 },
  neckR: 2.6,
  shoulder: [9.6, 70, -0.5],
  upperArm: 15.4,
  foreArm: 13.8,
  hand: 9.2,
  armR: 2.5,
  hipsY: 47.5,
  hip: [4.6, 44.5, 0],
  kneeY: 25,
  ankleY: 6.6,
  chest: [8.2, 4.8],
  waist: [6.6, 4.3],
  hips: [7.0, 4.7],
  chestY: 64.5,
  waistY: 54,
  foot: { len: 11.5, w: 5, heel: 3 },
};

function palette(b: ModelBuilder): void {
  b.mat('skin', ['#F5E2D3', '#ECD1B0', '#DDBFA2', '#C7A18F', '#8E6F5E'], { base: 1, rough: 0.6, shadeK: 0.9 });
  // the brim's shadow over the eyes
  b.mat('shade', ['#9E8574', '#8B7363', '#735E51']);
  b.mat('hair', ['#E2D0BD', '#D6C59E', '#C9B98F', '#B6A785', '#8B7F63'], { base: 2, rough: 0.5, shadeK: 0.85, dither: 0.05 });
  b.mat('stubble', ['#A08F72']);
  b.mat('brow', ['#5E5444']);
  b.mat('lid', ['#2A2420']);
  b.mat('sclera', ['#B9B1A6']);
  b.mat('iris', ['#5A5A59']);
  b.mat('irisD', ['#14110F']);
  b.mat('hi', ['#D8D2C8']);
  b.mat('mouth', ['#775A52']);
  b.mat('hatG', ['#5D735F', '#4B6453', '#3E5446', '#2E3F35'], { base: 1, rough: 0.8, shadeK: 0.9 });
  b.mat('hatW', ['#F3F3F0', '#EDEDE6', '#DFDFCB', '#C4C4B0'], { base: 1, rough: 0.8, shadeK: 0.9 });
  b.mat('samue', ['#778277', '#5D685A', '#4F5A4C', '#3E4639', '#2E3029'], { base: 2, rough: 0.85, shadeK: 0.9 });
  b.mat('samueD', ['#4A5446', '#3C4438', '#2E3029']);
  b.mat('haori', ['#5E5B51', '#524F46', '#48453D', '#3A3831', '#2B2A25'], { base: 2, rough: 0.85, shadeK: 0.9 });
  b.mat('haoriIn', ['#3E3C35', '#33312B', '#28271F'], { base: 1, rough: 0.9 });
  b.mat('lozenge', ['#F2F2F2', '#E4E3E0', '#CFCECC'], { base: 0, rough: 0.8 });
  b.mat('wood', ['#C9B48E', '#B39F7D', '#9A8667', '#797165'], { base: 1, rough: 0.7, shadeK: 0.85 });
  b.mat('thong', ['#3A2E28', '#231C19']);
}

/**
 * The eyes in the brim's shadow, half-lidded and amused; a half-smile with one corner up; stubble on the
 * chin. Rows 9 → 0.
 */
const FACE = [
  '. . . . . . . . . .',
  '. B B B . . B B B .',
  '. L L L . . L L L .',
  '. W I I . . I I W .',
  '. . i * . . * i . .',
  '. . . . . . . . . .',
  '. . . . . s . . . .',
  '. . . . . . . m . .',
  '. . . . m m m . . .',
  '. . t . t . t . t .',
];

const assetCache = new Map<string, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function uraharaAsset(): CharacterAsset {
  let a = assetCache.get('base');
  if (!a) assetCache.set('base', (a = buildUrahara()));
  return a;
}

/**
 * 'cane' (sealed Benihime: the crook-handled cane, the shaft its sheath), 'cane-blade' (the thin straight
 * blade drawn from it, used in the Bankai), 'shikai' (Benihime), 'fan' (the folding fan).
 */
export type UraharaProp = 'cane' | 'cane-blade' | 'shikai' | 'fan';

export function uraharaProp(kind: UraharaProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'shikai' ? buildBenihime() : kind === 'fan' ? buildFan() : buildCane(kind === 'cane-blade');
    propCache.set(kind, m);
  }
  return m;
}

/** blade tips (prop frame, m) for the blade samplers */
export const CANE_TIP_Z = 0.78;
export const SHIKAI_TIP_Z = 0.8;

export function buildUrahara(): CharacterAsset {
  const b = new ModelBuilder('urahara', URAHARA_RES);
  palette(b);
  const s = SPEC;
  const L = humanoidSkeleton(b, s, { sleeves: true });
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 5, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5, wz + 1]);
  b.socket('finger.R', 'palm.R', [-wx + 0.2, wy - s.hand - 0.5, wz + 1]);
  b.socket('finger.L', 'palm.L', [wx - 0.2, wy - s.hand - 0.5, wz + 1]);
  b.socket('chest.front', 'chest', [0, s.chestY, 6]);
  b.socket('back', 'chest', [0, s.chestY + 1, -7]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('hat', 'head', [0, s.chinY + 15, L.headC[2]]);
  b.stamp('head', hd.x0, hd.chin + 9, FACE, { ...faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), t: { mat: 'stubble' } }, hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  // the shadow of the brim falls across the eyes
  b.paint('head', aabb([-6, hd.chin + 5, hd.front - 3], [6, hd.chin + 11, hd.front + 1]), 'shade', { where: b.isMat('skin') });
  // a little more stubble along the jaw
  for (const x of [-4, 3]) b.voxel('head', x, hd.chin + 1, hd.front - 1, 'stubble', 0);
  hair(b, L, hd);
  hat(b, L, hd);
  hands(b, L, 'skin');
  const torso = samue(b, L);
  const coat = haori(b, L, torso);
  trousers(b, L);
  geta(b, L);
  b.autoShade();
  b.lint();
  const R = URAHARA_RES;
  const springs: SpringDef[] = [...coat.springs];
  for (const side of ['L', 'R']) springs.push({ bone: `sleeve.${side}`, tail: [0, -12 / R, -3 / R], stiffness: 36, damping: 5, gravity: 10, limit: 90, radius: 0.05 });
  const colliders: ColliderDef[] = [...coat.colliders, { bone: 'shin.L', offset: [0, -0.1, 0], radius: 0.06 }, { bone: 'shin.R', offset: [0, -0.1, 0], radius: 0.06 }];
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- head

/**
 * Shaggy pale hair spilling out from under the hat: uneven locks round the sides and back down to the jaw,
 * a few strands falling over the face between the eyes.
 */
function hair(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }): void {
  const s = L.spec;
  const c = hd.chin;
  const locks: Spike[] = [];
  // uneven locks out from under the brim, down the sides and the back to the jaw
  const azs = [-80, -98, -118, -136, -152, -170, 170, 152, 136, 118, 98, 80];
  azs.forEach((az, i) => {
    const len = 4.2 + ((i * 37) % 5) * 0.55;
    locks.push({ az, el: -6 - (i % 3) * 4, len, r: 2.4, flat: 0.45, flow: [Math.sign(az) * 0.1, -1.7, Math.abs(az) > 150 ? -0.2 : 0.05], bend: [Math.sign(az) * 0.12, 0, 0], taper: 1 });
  });
  for (const k of [-1, 1]) locks.push({ az: k * 66, el: 6, len: 4.6, r: 2.1, flat: 0.4, flow: [k * 0.05, -1.9, 0.2], bend: [-k * 0.1, 0, 0.1], taper: 1 });
  spikeHair(b, L, 'hair', locks, [
    // strands falling over the face between and beside the eyes
    { x: -0.3, tipY: c + 4.2, lean: 0.4, r: 1.0 },
    { x: -3.6, tipY: c + 5.6, lean: -0.6, r: 1.3 },
    { x: 3.2, tipY: c + 6.2, lean: 0.8, r: 1.3 },
    { x: 5.2, tipY: c + 4.8, lean: 0.4, r: 1.1 },
    { x: -5.4, tipY: c + 4.6, lean: -0.3, r: 1.1 },
  ], { hairline: c + s.head.h - 1.6, nape: c + 1, slope: 0.6 });
  // keep the eyes clear (the strand between them stays)
  b.carve('head', aabb([-5, c + 4, hd.front], [-1, c + 7, hd.front + 6]));
  b.carve('head', aabb([1, c + 4, hd.front], [5, c + 7, hd.front + 6]));
}

/**
 * The bucket hat: a soft crown pulled low over the head and a drooping brim, in alternating green and
 * white stripes (twelve round the crown, carried on out across the brim). Tilted forward a little so the
 * brim shades the eyes.
 */
function hat(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): void {
  const s = L.spec;
  const c = hd.chin;
  const hc: V3 = [0, c + 9.2, L.headC[2] - 0.4];
  const crown = blend(1.2,
    cylinder([hc[0], hc[1], hc[2]], [hc[0], hc[1] + 5.4, hc[2]], 6.9, 6.2, 1.6),
    ellipsoid([hc[0], hc[1] + 4.6, hc[2]], [6.2, 2.4, 6.2]));
  // the brim: a drooping ring, wider at the front and back
  const brim = fn((x, y, z) => {
    const dz = z - hc[2];
    const r = Math.hypot(x, dz * 0.94);
    const t = Math.max(0, Math.min(1, (r - 6) / 5));
    const yy = hc[1] + 0.6 - t * 2.1;
    return Math.max(Math.abs(y - yy) - 0.55, 6 - r, r - 11.2);
  }, [-12, hc[1] - 3, hc[2] - 12], [12, hc[1] + 2, hc[2] + 12]);
  const shape = rotate(blend(0.8, crown, brim), [0, hc[1], hc[2]], [9, 0, 0]);
  // stripes by angle round the crown's axis
  const stripes = (x: number, z: number) => {
    const a = Math.atan2(x, z - hc[2]) / (Math.PI * 2) + 0.5;
    return Math.floor(a * 12 + 0.25) % 2 === 0;
  };
  b.add('head', intersect(shape, fn((x, y, z) => (stripes(x, z) ? -1 : 1), [-14, hc[1] - 4, hc[2] - 14], [14, hc[1] + 9, hc[2] + 14])), 'hatG');
  b.add('head', intersect(shape, fn((x, y, z) => (stripes(x, z) ? 1 : -1), [-14, hc[1] - 4, hc[2] - 14], [14, hc[1] + 9, hc[2] + 14])), 'hatW');
  // the dent across the top of the crown
  b.paint('head', rotate(capsule([0, hc[1] + 6.2, hc[2] - 3.5], [0, hc[1] + 6.2, hc[2] + 3.5], 0.8), [0, hc[1], hc[2]], [9, 0, 0]), 'hatG', { shade: 3 });
  // a dark band where the crown meets the brim
  b.paint('head', rotate(cylinder([0, hc[1] + 0.2, hc[2]], [0, hc[1] + 1.1, hc[2]], 7.4), [0, hc[1], hc[2]], [9, 0, 0]), 'hatG', { shade: 3 });
  // locks that poke up through the brim or out beside the crown are tucked under the hat
  const above = fn((x, y, z) => {
    const r = Math.hypot(x, (z - hc[2]) * 0.94);
    const t = Math.max(0, Math.min(1, (r - 6) / 5));
    return Math.max(hc[1] + 0.95 - t * 2.1 - y, 5.6 - r);
  }, [-14, hc[1] - 3, hc[2] - 14], [14, hc[1] + 12, hc[2] + 14]);
  b.carve('head', subtract(rotate(above, [0, hc[1], hc[2]], [9, 0, 0]), shape));
}

// ---------------------------------------------------------------------------------------------- clothes

/** The samue jacket: wrapped open in a deep V over the bare chest, a thin tie at the waist. */
function samue(b: ModelBuilder, L: Landmarks): Sdf {
  const s = L.spec;
  const o = { black: 'samue', collar: 'samueD', skin: 'skin', obi: 'samueD', crossY: s.chestY - 7 };
  const torso = kosodeTorso(b, L, o);
  // the collarbones and the sternum in the open V
  for (const k of [-1, 1]) b.paint('chest', capsule([k * 0.8, s.chinY - 5, 6], [k * 4.4, s.chinY - 4.4, 6], 0.45), 'skin', { shade: 3, where: b.isMat('skin') });
  b.paint('chest', capsule([0, s.chestY + 2, 6.5], [0, s.chestY - 4, 6.5], 0.4), 'skin', { shade: 3, where: b.isMat('skin') });
  // the waist tie: a thin cord round the waist, knotted at the front
  const y = s.waistY - 2.4;
  b.add('spine', intersect(subtract(offset(torso, 1.9), offset(torso, 0.6)), aabb([-30, y - 0.8, -30], [30, y + 0.8, 30])), 'samueD');
  b.add('spine', ellipsoid([1.6, y, s.waist[1] + 2.4], [1.1, 1, 0.9]), 'samueD');
  b.add('spine', capsule([1.8, y - 0.8, s.waist[1] + 2.6], [2.4, y - 5, s.waist[1] + 2.9], 0.55), 'samueD', { thr: 0.2 });
  b.add('spine', capsule([1.2, y - 0.8, s.waist[1] + 2.5], [0.6, y - 4, s.waist[1] + 2.7], 0.55), 'samueD', { thr: 0.2 });
  return torso;
}

/**
 * The haori, worn open like a coat: wide sleeves with hanging bags over the samue, the body open down the
 * front, the skirt to mid-calf on spring panels with a row of tall white lozenges round the hem.
 */
function haori(b: ModelBuilder, L: Landmarks, torso: Sdf): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const opening = intersect(
    prism([[-3.2, 90], [3.2, 90], [5.2, s.chestY], [6.2, 46], [-6.2, 46], [-5.2, s.chestY]], [0, 0, 0], [1, 0, 0], [0, 1, 0], 30),
    halfSpace([0, 0, 1], [0, 0, -1]),
  );
  const shell = subtract(offset(torso, 1.6), offset(torso, 0.3), opening);
  for (const [bone, y0, y1] of [['spine', s.waistY - 4, s.waistY + 6], ['chest', s.waistY + 6, 90]] as [string, number, number][]) b.add(bone, intersect(shell, aabb([-30, y0, -30], [30, y1, 30])), 'haori');
  b.paint(['chest', 'spine'], intersect(offset(opening, 1.0), halfSpace([0, 0, 1], [0, 0, -1])), 'haoriIn', { where: b.isMat('haori') });
  // wide sleeves with bags, hanging over the samue
  kosodeSleeves(b, L, { black: 'haori', collar: 'haori', skin: 'skin', obi: 'haori', bag: 4.6 });
  const coat = coatSkirt(b, L, { mat: 'haori', lining: 'haoriIn', yTop: s.waistY - 2, yHem: 13, r0: 9.4, r1: 13.4, openFront: 20, res: URAHARA_RES });
  // the lozenges: tall white diamonds standing round the hem
  const cz = -0.6;
  const loz = fn((x, y, z) => {
    const a = Math.atan2(x, z - cz);
    const r = Math.hypot(x, z - cz);
    const n = 16;
    const cell = (a / (Math.PI * 2)) * n;
    const da = (cell - Math.round(cell)) * ((Math.PI * 2) / n) * r;
    const yc = 13 + 8;
    return Math.abs(da) / 2.6 + Math.abs(y - yc) / 7.5 - 1;
  }, [-20, 10, -20], [20, 32, 20]);
  const low = ['F.L', 'S.L', 'B.L', 'B.R', 'S.R', 'F.R'].map((n) => `coat.${n}.2`);
  b.paint(low, loz, 'lozenge', { where: b.isMat('haori') });
  b.paint(low.map((n) => n.replace('.2', '')), loz, 'lozenge', { where: b.isMat('haori') });
  return coat;
}

/** Loose samue trousers cropped above the ankle; bare shins below. */
function trousers(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [hx, hy, hz] = s.hip;
  const [kx, ky, kz] = L.knee;
  const [ax, ay, az] = L.ankle;
  b.add('hips', box([0, s.hipsY - 0.5, -0.3], [s.hips[0] + 0.8, 4, s.hips[1] + 0.8], { round: 2.6 }), 'samue');
  b.add('thigh.L', blend(1.4, sphere([hx, hy, hz], 4.2), capsule([hx, hy, hz], [kx, ky + 1, kz], 4.1, 3.6)), 'samue', { mirror: true });
  const cuff = ay + 6;
  b.add('shin.L', blend(1.2, sphere([kx, ky, kz], 3.6), capsule([kx, ky, kz], [ax, cuff, az], 3.5, 3.3)), 'samue', { mirror: true });
  b.paint('shin.L', cylinder([ax, cuff - 0.2, az], [ax, cuff + 1.2, az], 3.8), 'samueD', { mirror: true, where: b.isMat('samue') });
  // bare shin and ankle
  b.add('shin.L', capsule([ax, cuff + 2, az], [ax, ay - 0.5, az], 1.9, 1.7), 'skin', { mirror: true, only: 'empty' });
}

/** Bare feet on two-tooth wooden geta with dark thongs. */
function geta(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [ax, ay, az] = L.ankle;
  const f = s.foot;
  const sole = 2.4;
  const zc = az + (f.len / 2 - f.heel);
  const toeZ = az + f.len - f.heel;
  // the foot
  b.add('foot.L', capsule([ax, ay, az - 0.4], [ax, sole + 1.2, az - 0.4], 2.0), 'skin', { mirror: true });
  b.add('foot.L', intersect(box([ax, sole + 1.3, zc], [f.w / 2 - 0.4, 1.4, f.len / 2 - 0.2], { round: 1.1 }), halfSpace([0, sole + 3.2, toeZ - 3], [0, 1, 0.7])), 'skin', { mirror: true });
  // the toes, a little apart
  for (const dx of [-1.4, 0, 1.3]) b.paint('foot.L', capsule([ax + dx, sole + 0.8, toeZ - 1.4], [ax + dx, sole + 0.8, toeZ - 0.4], 0.45), 'skin', { shade: 3, mirror: true, where: b.isMat('skin') });
  // the geta: a board and two teeth
  b.add('foot.L', box([ax, sole - 0.5, zc], [f.w / 2 + 0.5, 0.5, f.len / 2 + 0.6], { round: 0.3 }), 'wood', { mirror: true });
  for (const dz of [-f.len * 0.28, f.len * 0.28]) b.add('foot.L', box([ax, (sole - 1) / 2, zc + dz], [f.w / 2 + 0.3, (sole - 1) / 2, 0.55]), 'wood', { mirror: true });
  // the thong: from between the toes back to both sides
  const tz = toeZ - 2.6;
  b.add('foot.L', capsule([ax - 0.4, sole, tz + 1], [ax - 0.2, sole + 2.6, tz - 0.4], 0.45), 'thong', { mirror: true, thr: 0.2 });
  b.add('foot.L', capsule([ax - 0.2, sole + 2.6, tz - 0.4], [ax + f.w / 2 + 0.2, sole + 0.3, tz - 2.4], 0.45), 'thong', { mirror: true, thr: 0.2 });
  b.add('foot.L', capsule([ax - 0.2, sole + 2.6, tz - 0.4], [ax - f.w / 2 - 0.2, sole + 0.3, tz - 2.4], 0.45), 'thong', { mirror: true, thr: 0.2 });
}

// ---------------------------------------------------------------------------------------------- props

/**
 * The cane at 48 vox/m. The crook handle (behind the fist, curling up and over) is the hilt; the shaft is
 * the sheath, ending in a silver ferrule. Drawn: a thin, straight, single-edged blade. Origin at the grip,
 * +Z, edge −Y.
 */
function buildCane(drawn: boolean): VoxelModel {
  const b = new ModelBuilder(drawn ? 'benihime-cane-blade' : 'benihime-cane', 48);
  b.mat('cane', ['#C3B6AE', '#B39F7D', '#9A8667', '#736958'], { base: 1, rough: 0.55, shadeK: 0.85 });
  b.mat('silver', ['#E4E7EC', '#C7CCD1', '#A8ADB6', '#7B7F88'], { base: 1, rough: 0.25, metal: 0.85, shadeK: 0.8 });
  b.mat('steel', ['#E2E6EC', '#C9CED6', '#A8AEB8', '#8A909A'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#F0F3F5'], { rough: 0.12, metal: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  // the handle and the crook: straight through the fist, then curling up and back over
  const crook = smoothPath([[0, 0, 1.6], [0, 0, -4.5], [0, 0.6, -6.6], [0, 2.6, -7.6], [0, 4.6, -6.8], [0, 5.2, -5.0], [0, 4.6, -3.6]], 4);
  b.add('root', tube(crook, crook.map(() => 0.95)), 'cane', { thr: 0.2 });
  b.add('root', cylinder([0, 0, 1.4], [0, 0, 2.4], 1.15), 'silver');
  if (!drawn) {
    // the shaft (the sheath), tapering a little to the ferrule
    b.add('root', cylinder([0, 0, 2.4], [0, 0, 36], 1.0, 0.85), 'cane');
    b.add('root', cylinder([0, 0, 36], [0, 0, 38], 0.85, 0.75), 'silver');
    // the joint where the blade is drawn from
    b.paint('root', cylinder([0, 0, 2.4], [0, 0, 3.2], 1.2), 'silver', { where: b.isMat('cane') });
  } else {
    const z0 = 2.4, zTip = 37.5;
    b.add('root', fn((x, y, z) => {
      if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
      const k = Math.max(0, z - (zTip - 3)) / 3;
      return Math.max(Math.abs(x) - 0.35, y - 0.7, -0.75 + k * 1.3 - y, z0 - z, z - zTip);
    }, [-2, -2, z0 - 1], [2, 2, zTip + 1]), 'steel', { thr: 0.3 });
    b.paint('root', fn((x, y, z) => y + 0.4 - Math.max(0, z - 34.5) * 0.43, [-2, -2, 0], [2, 2, zTip + 1]), 'edge');
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * Benihime at 72 vox/m: a straight, slim black blade with a silver edge and a tip cut on a slant like a
 * razor; a U-shaped olive-bronze guard sleeving the blade's base, petal-shaped; a red cord wrapped three
 * times with a three-loop bow, and a folded white paper charm; a black grip over khaki diamonds that bends
 * forward at the end, a pommel of three overlaps, and a crimson tassel. Origin at the grip, +Z, edge −Y.
 */
function buildBenihime(): VoxelModel {
  const b = new ModelBuilder('benihime-shikai', 72);
  b.mat('blade', ['#6E716F', '#595C5A', '#4A4D4B', '#3D403F'], { base: 1, rough: 0.25, metal: 0.8, shadeK: 0.7 });
  b.mat('edge', ['#EEF5F8', '#D5E5EB'], { rough: 0.1, metal: 0.85 });
  b.mat('guard', ['#969078', '#7A765F', '#636357', '#525148'], { base: 1, rough: 0.35, metal: 0.75, shadeK: 0.8 });
  b.mat('cord', ['#C2383A', '#A52A2A', '#7A2222', '#501F1D'], { base: 1, rough: 0.7 });
  b.mat('paper', ['#F3F3F0', '#F2EEE4', '#DDD6C6'], { base: 0, rough: 0.9 });
  b.mat('wrap', ['#2C302A', '#1D211B', '#161814'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#C8B06C', '#B39B5A']);
  b.mat('tassel', ['#D02C38', '#B01E2A', '#8E1820', '#6E1418'], { base: 1, rough: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  const S = 72 / 48;
  // the grip: from the guard back, bending toward the edge side at the end
  const gripPath = smoothPath([[0, 0, 2 * S], [0, 0, -4 * S], [0, -0.6 * S, -7.5 * S], [0, -1.6 * S, -9.6 * S]], 4);
  b.add('root', tube(gripPath, gripPath.map(() => 1.15 * S)), 'wrap', { thr: 0.2 });
  b.paint('root', fn((x, y, z) => Math.abs(((Math.abs(y) + z) % (2.4 * S) + 2.4 * S) % (2.4 * S) - 1.2 * S) - 0.42 * S, [-4, -4, -16], [4, 4, 4]), 'ray', { where: b.isMat('wrap') });
  // the pommel: three stacked overlaps
  for (let i = 0; i < 3; i++) b.add('root', ellipsoid([0, (-1.7 - i * 0.55) * S, (-9.7 - i * 0.5) * S], [1.35 * S, 0.75 * S, 1.25 * S]), 'guard', { thr: 0.2 });
  // the tassel, hanging from the pommel
  const tp: V3 = [0, -3.4 * S, -11 * S];
  b.add('root', tube(smoothPath([[0, -2.8 * S, -10.6 * S], tp, [0.4 * S, -6 * S, -11.4 * S], [0.6 * S, -8.6 * S, -11 * S]], 4), [0.45 * S, 0.5 * S, 0.65 * S, 0.9 * S, 1.2 * S, 1.35 * S, 1.3 * S, 1.1 * S, 0.8 * S, 0.5 * S, 0.4 * S, 0.3 * S, 0.3 * S]), 'tassel', { thr: 0.2 });
  // the U-guard: a sleeve round the blade's base, open toward the spine, with petal lobes along its sides
  const g0 = 2 * S, g1 = 6 * S;
  b.add('root', subtract(
    box([0, -0.4 * S, (g0 + g1) / 2], [1.25 * S, 1.6 * S, (g1 - g0) / 2], { round: 0.6 * S }),
    box([0, 1.2 * S, (g0 + g1) / 2 + 1], [0.5 * S, 0.9 * S, (g1 - g0) / 2 + 2])), 'guard');
  for (const k of [-1, 1]) for (let i = 0; i < 3; i++) b.add('root', ellipsoid([k * 1.25 * S, -0.6 * S, g0 + (0.7 + i * 1.3) * S], [0.4 * S, 1.0 * S, 0.65 * S]), 'guard', { thr: 0.2 });
  // the red cord wrapped three times at the guard's base, the three-loop bow at the back
  for (let i = 0; i < 3; i++) b.add('root', torus([0, -0.2 * S, (0.6 + i * 0.55) * S], 1.45 * S, 0.32 * S, [90, 0, 0]), 'cord', { thr: 0.2 });
  for (const [a, l] of [[-50, 2.2], [0, 2.6], [50, 2.2]] as [number, number][]) {
    const r = (a * Math.PI) / 180;
    b.add('root', torus([Math.sin(r) * l * S * 0.8, (1.3 + Math.cos(r) * l * 0.8) * S, 1.2 * S], 0.85 * S, 0.3 * S, [0, 0, a]), 'cord', { thr: 0.2 });
  }
  // the folded paper charm hanging on the front face: a zigzag strip
  const px = 1.6 * S;
  b.add('root', prism([[0, 0], [1.6, -1.2], [0.4, -2.6], [2, -3.8], [0.8, -5.4], [2.4, -6.6], [1.4, -6.8], [-0.2, -5.6], [1.2, -4.2], [-0.4, -3], [0.8, -1.6], [-0.6, -0.4]].map(([u, v]) => [u * S, v * S] as const), [px, -1.2 * S, 1 * S], [0, 0, 1], [0, 1, 0], 0.22 * S), 'paper', { thr: 0.15 });
  // the blade: straight, slim, the tip cut on a slant (the edge side longer, like a razor)
  const z0 = g1 - 0.5 * S, zEnd = 38 * S;
  b.add('root', fn((x, y, z) => {
    if (z < z0 - 0.5 || z > zEnd + 2 * S) return 1;
    // the slant: the end plane runs from the spine (shorter) to the edge (longer)
    const end = zEnd - (y + 1.0 * S) * 1.4;
    return Math.max(Math.abs(x) - 0.4 * S, y - 1.0 * S, -1.1 * S - y, z0 - z, z - end);
  }, [-2 * S, -2 * S, z0 - 1], [2 * S, 2 * S, zEnd + 4 * S]), 'blade', { thr: 0.3 });
  b.paint('root', fn((x, y, z) => y + 0.55 * S, [-2 * S, -2 * S, z0], [2 * S, 2 * S, zEnd + 4 * S]), 'edge', { where: b.isMat('blade') });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** The folding fan, open: paper over dark ribs, at 96 vox/m. Origin at the pivot, the fan spreading up (+Y). */
function buildFan(): VoxelModel {
  const b = new ModelBuilder('urahara-fan', 96);
  b.mat('paper', ['#F4F1E8', '#E6E1D3', '#CFC8B6'], { base: 0, rough: 0.9 });
  b.mat('rib', ['#7A6248', '#5A4632', '#3E3022'], { base: 1, rough: 0.6 });
  b.bone('root', null, [0, 0, 0]);
  // the fan opens along the hand's +Z (up, with the forearm raised level in front of him, as he holds it
  // before his mouth) and faces along -Y (forward in that pose)
  const R0 = 6, R1 = 21;
  b.add('root', fn((x, y, z) => {
    const r = Math.hypot(x, z);
    const a = Math.atan2(x, z);
    return Math.max(Math.abs(y) - 0.4 - Math.abs(Math.sin(a * 14)) * 0.5, R0 - r, r - R1, Math.abs(a) - 1.15);
  }, [-22, -2, -2], [22, 2, 22]), 'paper', { thr: 0.2 });
  for (let i = 0; i <= 10; i++) {
    const a = -1.15 + (i / 10) * 2.3;
    const R = i === 0 || i === 10 ? R1 : R0 + 1;
    b.add('root', capsule([0, 0.6, 0], [Math.sin(a) * R, 0.6, Math.cos(a) * R], 0.45), 'rib', { thr: 0.2 });
  }
  b.add('root', sphere([0, 0, 0], 1.2), 'rib');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

export { spike };
