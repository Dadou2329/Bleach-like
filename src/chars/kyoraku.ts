// Shunsui Kyōraku — Captain of the 8th Division (docs/roster/B2-captains-2.md). 1.92 m, tall and broad,
// a lazy slouch (92 voxels at 48 vox/m). The conical straw sugegasa; a long wavy brown ponytail with two
// pinwheel hairpins; a lock framing the left side of his face; stubble on the cheeks and a short beard on
// the chin; grey, half-lidded eyes. The pink flowered kimono over the white captain's haori (八 on the
// back, raspberry-rose lining), the black shihakushō open at the chest; bare feet in waraji. Katen
// Kyōkotsu at the left hip as a daishō with dark-blue hilts and cut-corner bronze guards; in Shikai two
// great black scimitars with silver edges, notched spines and long red tassels.
//
// Forms are outfits: 'captain' (hat, kimono and haori), 'haori' (the kimono thrown off) and 'shed' (the
// haori thrown off too, only the black shihakushō) — what he wears decides what Irooni lets him cut.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, prism, rotate, smoothPath, sphere, subtract, tube, union, type V3 } from '../models/sdf';
import {
  coatSkirt, faceLegend, feet, hakama, hands, head, humanoidSkeleton, kosodeSleeves, kosodeTorso, obi, shihakushoSprings, spikeHair,
  type HumanoidSpec, type Landmarks,
} from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

export const KYORAKU_RES = 92 / 1.92;
export type KyorakuForm = 'captain' | 'haori' | 'shed';

/** Tall and broad through the shoulders and chest. */
const SPEC: HumanoidSpec = {
  H: 92,
  chinY: 80,
  head: { w: 10, d: 11, h: 12 },
  neckR: 2.9,
  shoulder: [10.4, 74, -0.5],
  upperArm: 16,
  foreArm: 14.2,
  hand: 9.6,
  armR: 2.8,
  hipsY: 49.5,
  hip: [4.9, 46.5, 0],
  kneeY: 25.5,
  ankleY: 4.8,
  chest: [9.2, 5.5],
  waist: [7.5, 4.8],
  hips: [7.9, 5.1],
  chestY: 68,
  waistY: 57,
  foot: { len: 13, w: 5.4, heel: 3.2 },
};

function palette(b: ModelBuilder): void {
  b.mat('skin', ['#F4D9BF', '#EAC6A3', '#DDB592', '#CFA582', '#A88466'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#7A5032', '#6A4428', '#5A3920', '#48301C', '#341F12'], { base: 2, rough: 0.5, shadeK: 0.85, dither: 0.05 });
  b.mat('tie', ['#2A1E18']);
  b.mat('stub', ['#9E7C5E']);
  b.mat('beard', ['#4A2F1C']);
  b.mat('chestHair', ['#5A3A22']);
  b.mat('brow', ['#3E2816']);
  b.mat('lid', ['#2A1C14']);
  b.mat('sclera', ['#E8E4DC']);
  b.mat('iris', ['#8B9096']);
  b.mat('irisD', ['#4A4E54']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#9A6A58']);
  b.mat('black', ['#34343C', '#26262C', '#1A1A1F', '#141416'], { base: 2, rough: 0.85, shadeK: 0.9 });
  b.mat('collar', ['#EDEDEA', '#DCDCD8', '#C4C4C0'], { base: 0, rough: 0.8 });
  b.mat('obi', ['#EDEDEA', '#DCDCD8', '#C4C4C0'], { base: 0, rough: 0.8 });
  b.mat('haori', ['#F4F3EF', '#ECEBE6', '#DCDBD6', '#C4C5C9', '#A6A9B0'], { base: 1, rough: 0.8, shadeK: 0.9 });
  b.mat('haoriIn', ['#C85A80', '#B3446C', '#953457', '#742743'], { base: 1, rough: 0.85 });
  b.mat('kanji', ['#141418'], { rough: 0.9 });
  b.mat('kimono', ['#F4AFCC', '#E98FB5', '#D97AA2', '#C4658E', '#A44E74'], { base: 1, rough: 0.82, shadeK: 0.9 });
  b.mat('blossomW', ['#F7E4EC', '#EDD3DF', '#DDBDCB'], { base: 0, rough: 0.82 });
  b.mat('blossomD', ['#C65A86', '#B04C76', '#943E62'], { base: 0, rough: 0.82 });
  b.mat('blossomY', ['#F2C14E']);
  b.mat('straw', ['#E2C68A', '#CFAE6B', '#BC9A5A', '#9F8048', '#86683A'], { base: 1, rough: 0.9, shadeK: 0.9 });
  b.mat('strawIn', ['#8A6D3A', '#76592E', '#5E4524'], { base: 0, rough: 0.9 });
  b.mat('pinR', ['#D63C5C', '#B42E4A']);
  b.mat('pinW', ['#F3F0EA', '#DCD7CC']);
  b.mat('pinG', ['#E2C060', '#C9A23C', '#A07E28'], { base: 1, rough: 0.35, metal: 0.7 });
  b.mat('sole', ['#C9A86A', '#B99A63', '#8F7444'], { base: 1, rough: 0.9 });
  b.mat('cord', ['#5B4632']);
}

/** Lazy, heavy-lidded grey eyes; stubble on the cheeks, a moustache and a short beard on the chin. Rows 9 → 0. */
const FACE = [
  '. . . . . . . . . .',
  '. B B B . . B B B .',
  '. L L L . . L L L .',
  '. W I i . . i I W .',
  '. . . . . . . . . .',
  '. . . . . s . . . .',
  't . . . . . . . . t',
  't . . t . . t . . t',
  '. t . . m m . . t .',
  '. . . t g g t . . .',
];

const assetCache = new Map<KyorakuForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function kyorakuAsset(form: KyorakuForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildKyoraku(form)));
  return a;
}

/**
 * 'tachi' / 'waki' (the sealed daishō, in hand), 'sayaT' / 'sayaW' (their scabbards at the left hip),
 * 'katen' / 'kyokotsu' (the Shikai scimitars, the larger and the smaller).
 */
export type KyorakuProp = 'tachi' | 'waki' | 'sayaT' | 'sayaW' | 'katen' | 'kyokotsu';

export function kyorakuProp(kind: KyorakuProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'tachi' ? buildSword(36, 'katen-kyokotsu-tachi') : kind === 'waki' ? buildSword(21, 'katen-kyokotsu-wakizashi')
      : kind === 'sayaT' ? buildSheath(36, 'katen-kyokotsu-saya') : kind === 'sayaW' ? buildSheath(21, 'katen-kyokotsu-saya-w')
        : buildScimitar(kind === 'katen');
    propCache.set(kind, m);
  }
  return m;
}

/** blade points (prop frame, m) for the samplers */
export const TACHI_TIP_Z = 0.84;
export const WAKI_TIP_Z = 0.53;
export const KATEN_TIP_Z = 0.98;
export const KYOKOTSU_TIP_Z = 0.86;

export function buildKyoraku(form: KyorakuForm = 'captain'): CharacterAsset {
  const b = new ModelBuilder(`kyoraku-${form}`, KYORAKU_RES);
  palette(b);
  const s = SPEC;
  const L = humanoidSkeleton(b, s, { sleeves: true, hakama: true });
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 5, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5, wz + 1]);
  b.socket('finger.R', 'palm.R', [-wx + 0.2, wy - s.hand - 0.5, wz + 1]);
  b.socket('finger.L', 'palm.L', [wx - 0.2, wy - s.hand - 0.5, wz + 1]);
  // the daishō through the sash at his left hip: the tachi lower, the wakizashi above it
  b.socket('hip.L', 'hips', [10.4, s.waistY - 4.4, 4.2], [-24, 180, -8]);
  b.socket('hip.L2', 'hips', [9.8, s.waistY - 2.6, 4.8], [-18, 176, -4]);
  b.socket('back', 'chest', [0, s.chestY + 1, -8]);
  b.socket('chest.front', 'chest', [0, s.chestY, 7.5]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('hat', 'head', [0, s.chinY + 18, L.headC[2]]);
  b.stamp('head', hd.x0, hd.chin + 9, FACE, { ...faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), t: { mat: 'stub' }, g: { mat: 'beard' } }, hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  // high cheekbones
  for (const x of [-4, 3]) b.voxel('head', x, hd.chin + 5, hd.front - 1, 'skin', 2);
  const pony = hair(b, L, hd);
  hat(b, L, hd);
  hands(b, L, 'skin');
  feet(b, L, 'skin', 'sole', 'cord');
  const o = { black: 'black', collar: 'collar', skin: 'skin', obi: 'obi', crossY: s.chestY - 9, hemR: 9.4, hakamaHem: 3 };
  kosodeTorso(b, L, o);
  chestHair(b, L);
  obi(b, L, o);
  hakama(b, L, o);
  // the outermost sleeves decide the arms: kimono, haori, or the kosode's own
  const sleeveMat = form === 'captain' ? 'kimono' : form === 'haori' ? 'haori' : 'black';
  kosodeSleeves(b, L, { ...o, black: sleeveMat, collar: sleeveMat, obi: sleeveMat, bag: 5 });
  const springs: SpringDef[] = [...pony.springs];
  const colliders: ColliderDef[] = [...pony.colliders];
  if (form !== 'shed') {
    const coat = coats(b, L, form);
    springs.push(...coat.springs);
    colliders.push(...coat.colliders);
  }
  b.autoShade();
  b.lint();
  const base = shihakushoSprings();
  return { model: b.build(), springs: [...base.springs, ...springs], colliders: [...base.colliders, ...colliders], warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- head

/**
 * Wavy brown hair drawn back off the face under the hat; a long lock on the left side framing the face; the
 * ponytail from the back of the head to the middle of the back on three spring bones, tied off with a dark
 * cord, and two pinwheel hairpins pushed into it on the left.
 */
function hair(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const c = hd.chin;
  const front = hd.front;
  const R = KYORAKU_RES;
  spikeHair(b, L, 'hair', [
    // drawn back toward the tie, waves rolling down the sides
    { az: 0, el: 62, len: 2, r: 4.4, flat: 0.45, flow: [0, -0.2, -1] },
    { az: -55, el: 42, len: 2.2, r: 4.2, flat: 0.5, flow: [0, -0.5, -0.9] },
    { az: 55, el: 42, len: 2.2, r: 4.2, flat: 0.5, flow: [0, -0.5, -0.9] },
    { az: -100, el: 8, len: 2.6, r: 3.6, flat: 0.5, flow: [0, -1.2, -0.6], bend: [-0.1, 0, 0] },
    { az: 100, el: 8, len: 2.6, r: 3.6, flat: 0.5, flow: [0, -1.2, -0.6], bend: [0.1, 0, 0] },
    { az: -150, el: 20, len: 2.4, r: 4, flat: 0.5, flow: [0, -0.9, -0.5] },
    { az: 150, el: 20, len: 2.4, r: 4, flat: 0.5, flow: [0, -0.9, -0.5] },
  ], [
    { x: -3.4, tipY: c + 9.6, lean: -0.6, r: 1.6 },
    { x: 3.6, tipY: c + 9.2, lean: 0.8, r: 1.7 },
  ], { tufts: 0, hairline: c + s.head.h - 1.2, nape: c + 1.5, slope: 0.6 });
  // the lock framing the left side of the face, rolling in waves down past the jaw
  const lk = smoothPath([[5.4, c + 11, front - 3.2], [6.4, c + 7.5, front - 1.6], [5.8, c + 4, front - 1.2], [6.6, c + 0.5, front - 1.6], [5.9, c - 2.5, front - 2.2]], 4);
  b.add('head', tube(lk, lk.map((_, i) => 1.75 - i * 0.05)), 'hair', { thr: 0.3 });
  // and a shorter one on the right, behind the ear
  const rk = smoothPath([[-5.6, c + 10.4, front - 4.2], [-6.5, c + 6.8, front - 3.4], [-6.1, c + 3.4, front - 3.8]], 4);
  b.add('head', tube(rk, rk.map((_, i) => 1.55 - i * 0.05)), 'hair', { thr: 0.3 });
  // keep the eyes clear
  b.carve('head', aabb([-5, c + 5, front], [-1, c + 8, front + 6]));
  b.carve('head', aabb([1, c + 5, front], [5, c + 8, front + 6]));

  // ---- the ponytail: tied at the back of the head, hanging in waves to the middle of the back
  const back = L.headC[2] - s.head.d / 2;
  const tie: V3 = [0, c + 6.6, back - 1.2];
  const P = smoothPath([tie, [0.9, c - 0.5, back - 4.4], [-0.9, c - 8.5, back - 5.8], [1, c - 16.5, back - 6.4], [-0.5, c - 23.5, back - 6.2]], 5);
  const radii = P.map((_, i) => {
    const t = i / (P.length - 1);
    return t < 0.12 ? 2.1 + t * 8 : 3.1 * (1 - Math.pow(Math.max(0, t - 0.3) / 0.7, 1.6)) + 0.9;
  });
  const tail = tube(P, radii);
  // each bone takes the stretch of tail below its pivot, down to the next pivot
  const y1 = P[7][1], y2 = P[14][1];
  const bones: [string, string, V3, number, number][] = [['pony1', 'head', tie, y1 - 0.5, 200], ['pony2', 'pony1', P[7], y2 - 0.5, y1 + 0.5], ['pony3', 'pony2', P[14], -100, y2 + 0.5]];
  for (const [name, parent, pivot, y0, yTop] of bones) {
    b.bone(name, parent, pivot);
    b.add(name, intersect(tail, aabb([-20, y0, -30], [20, yTop, 10])), 'hair', { thr: 0.25 });
  }
  // the waves: grooves rolling round the tail, and a few loose strands
  b.paint(['pony1', 'pony2', 'pony3'], fn((x, y, z) => Math.abs((((y + Math.atan2(x, z - (back - 5)) * 2.2) % 3.2) + 3.2) % 3.2 - 1.6) - 0.35, [-8, c - 30, back - 14], [8, c + 10, back + 2]), 'hair', { shade: 3, where: b.isMat('hair') });
  for (const [k, y] of [[1, c - 4], [-1, c - 12]] as [number, number][]) {
    const st = smoothPath([[k * 1.8, y + 4, back - 5.2], [k * 3.2, y, back - 5.6], [k * 2.4, y - 4, back - 6.4]], 3);
    b.add(y > y2 ? 'pony2' : 'pony3', tube(st, st.map(() => 0.75)), 'hair', { thr: 0.25 });
  }
  // the tie
  b.add('pony1', cylinder([tie[0], tie[1] + 0.9, tie[2] + 0.6], [tie[0], tie[1] - 1.2, tie[2] - 0.5], 2.5), 'tie', { thr: 0.2 });

  // ---- two pinwheel hairpins pushed into the hair at the left of the tie
  for (const [base, axis] of [[[3.2, c + 8.6, back - 0.4], [0.8, 0.35, -0.5]], [[3.6, c + 5.2, back + 0.2], [0.85, -0.1, -0.5]]] as [V3, V3][]) {
    const al = Math.hypot(...axis);
    const A: V3 = [axis[0] / al, axis[1] / al, axis[2] / al];
    const hub: V3 = [base[0] + A[0] * 4.2, base[1] + A[1] * 4.2 + 1.2, base[2] + A[2] * 4.2];
    b.add('head', capsule(base, hub, 0.55), 'pinG', { thr: 0.2 });
    // the wheel faces out along the stick: four blades, red and white by turns, round a gold hub
    const U0: V3 = Math.abs(A[1]) < 0.9 ? [A[2], 0, -A[0]] : [1, 0, 0];
    const ul = Math.hypot(...U0);
    const U: V3 = [U0[0] / ul, U0[1] / ul, U0[2] / ul];
    const V: V3 = [A[1] * U[2] - A[2] * U[1], A[2] * U[0] - A[0] * U[2], A[0] * U[1] - A[1] * U[0]];
    for (let i = 0; i < 4; i++) {
      const a0 = (i / 4) * Math.PI * 2;
      // each blade rooted well inside the hub so it holds on
      const poly: [number, number][] = [[Math.cos(a0 - 0.6) * 0.7, Math.sin(a0 - 0.6) * 0.7], [Math.cos(a0) * 2.8, Math.sin(a0) * 2.8], [Math.cos(a0 + 1.05) * 1.7, Math.sin(a0 + 1.05) * 1.7], [Math.cos(a0 + 1.5) * 0.7, Math.sin(a0 + 1.5) * 0.7]];
      b.add('head', prism(poly, hub, U, V, 0.5), i % 2 ? 'pinW' : 'pinR', { thr: 0.2 });
    }
    b.add('head', sphere(hub, 1.1), 'pinG');
  }
  const springs: SpringDef[] = [
    { bone: 'pony1', tail: [(P[7][0] - tie[0]) / R, (P[7][1] - tie[1]) / R, (P[7][2] - tie[2]) / R], stiffness: 34, damping: 4.5, gravity: 11, limit: 55, radius: 0.06 },
    { bone: 'pony2', tail: [(P[14][0] - P[7][0]) / R, (P[14][1] - P[7][1]) / R, (P[14][2] - P[7][2]) / R], stiffness: 26, damping: 4, gravity: 12, limit: 65, radius: 0.06 },
    { bone: 'pony3', tail: [(P[P.length - 1][0] - P[14][0]) / R, (P[P.length - 1][1] - P[14][1]) / R, (P[P.length - 1][2] - P[14][2]) / R], stiffness: 20, damping: 3.5, gravity: 13, limit: 75, radius: 0.05 },
  ];
  const colliders: ColliderDef[] = [
    { bone: 'chest', offset: [0, 0.08, -0.02], radius: 0.19 },
    { bone: 'spine', offset: [0, 0.02, -0.01], radius: 0.16 },
  ];
  return { springs, colliders };
}

/**
 * The sugegasa: a wide, shallow cone of woven straw sitting on a ring round the crown, tipped forward so
 * the brim shades his eyes. Radial ribs and rings of weave; the underside darker.
 */
function hat(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): void {
  const c = hd.chin;
  const hc: V3 = [0, c + 10.8, L.headC[2] - 0.3];
  const apex = 6.6, Rb = 14.5, thick = 0.75;
  const slope = Math.hypot(1, apex / Rb);
  const ys = (r: number) => hc[1] + apex * (1 - r / Rb);
  const bounds: [V3, V3] = [[hc[0] - Rb - 1, hc[1] - 3, hc[2] - Rb - 1], [hc[0] + Rb + 1, hc[1] + apex + 2, hc[2] + Rb + 1]];
  const cone = fn((x, y, z) => {
    const r = Math.hypot(x - hc[0], z - hc[2]);
    return Math.max(Math.abs(y - ys(r)) / slope - thick, r - Rb);
  }, ...bounds);
  const ring = subtract(cylinder([hc[0], hc[1] - 0.6, hc[2]], [hc[0], hc[1] + 3.6, hc[2]], 6.6), cylinder([hc[0], hc[1] - 2, hc[2]], [hc[0], hc[1] + 5, hc[2]], 5.5));
  const tilt: V3 = [7, 0, -3];
  const pivot: V3 = [0, hc[1], hc[2]];
  const shape = rotate(union(cone, ring), pivot, tilt);
  // hair poking up through the cone is tucked under it (before the hat goes on)
  const above = fn((x, y, z) => {
    const r = Math.hypot(x - hc[0], z - hc[2]);
    return Math.max(ys(r) - thick * slope - y, r - Rb);
  }, [bounds[0][0], hc[1] - 1, bounds[0][2]], [bounds[1][0], hc[1] + apex + 6, bounds[1][2]]);
  b.carve('head', rotate(above, pivot, tilt));
  b.add('head', shape, 'straw');
  // the weave: thirty-two radial ribs and a ring every couple of voxels, on the top face
  const top = (d: (r: number, a: number) => number) => rotate(fn((x, y, z) => {
    const r = Math.hypot(x - hc[0], z - hc[2]);
    if (y < ys(r) - 0.1) return 1;
    return d(r, Math.atan2(x - hc[0], z - hc[2]));
  }, ...bounds), pivot, tilt);
  b.paint('head', top((_r, a) => 0.42 - Math.abs((((a / (Math.PI * 2)) * 32 + 64) % 1) - 0.5)), 'straw', { shade: 3, where: b.isMat('straw') });
  b.paint('head', top((r) => 0.38 - Math.abs(((r / 2.3) % 1) - 0.5)), 'straw', { shade: 2, where: b.isMat('straw') });
  // the underside and the ring inside, in shadow
  b.paint('head', rotate(fn((x, y, z) => {
    const r = Math.hypot(x - hc[0], z - hc[2]);
    return y - (ys(r) - 0.15);
  }, ...bounds), pivot, tilt), 'strawIn', { where: b.isMat('straw') });
  // a tight rim at the brim's edge
  b.paint('head', rotate(fn((x, _y, z) => Rb - 0.9 - Math.hypot(x - hc[0], z - hc[2]), ...bounds), pivot, tilt), 'straw', { shade: 3, where: b.isMat('straw') });
}

/** Chest hair in the open V of the kosode. */
function chestHair(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const h = (x: number, y: number) => {
    const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
  b.paint('chest', fn((x, y) => {
    if (y > s.chinY - 6 || y < s.chestY - 6 || Math.abs(x) > 3.2 - (s.chinY - 6 - y) * 0.12) return 1;
    // denser down the middle of the chest
    return h(x, y) < 0.42 + (2 - Math.abs(x)) * 0.1 ? -1 : 1;
  }, [-6, s.chestY - 7, 0], [6, s.chinY, 12]), 'chestHair', { where: b.isMat('skin') });
}

// ---------------------------------------------------------------------------------------------- coats

/**
 * The haori (white, open, 八 on the back, raspberry-rose lining) and over it, as captain, the pink flowered
 * kimono worn open like a coat. The kimono's opening is wider, so the haori's white shows inside it, and
 * the haori's hem a hand's breadth below the kimono's.
 */
function coats(b: ModelBuilder, L: Landmarks, form: KyorakuForm): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  // the cloth hangs from the shoulders over a smooth form (the kosode without its shoulder balls), so the
  // coats fall in planes instead of puffing up at the shoulders
  const torso = blend(3.6,
    box([0, s.chestY - 0.5, -0.3], [cx + 1.1, 6, cz + 1.1], { round: 3.4 }),
    box([0, s.waistY, -0.2], [wx + 1.1, 4.5, wz + 1.1], { round: 3 }),
    capsule([2.5, sy + 1.6, sz - 0.8], [sx + 0.6, sy - 0.6, sz], 2.9, 3.2),
    capsule([-2.5, sy + 1.6, sz - 0.8], [-sx - 0.6, sy - 0.6, sz], 2.9, 3.2));
  const front = halfSpace([0, 0, 1], [0, 0, -1]);
  const vee = (w: number, w2: number) => intersect(prism([[-2.8, 100], [2.8, 100], [w, s.chestY], [w2, 40], [-w2, 40], [-w, s.chestY]], [0, 0, 0], [1, 0, 0], [0, 1, 0], 30), front);
  const haoriOpen = vee(4.6, 5.6);
  const bands: [string, number, number][] = [['spine', s.waistY - 3, s.waistY + 6], ['chest', s.waistY + 6, 100]];
  // the haori's body: a shell over the kosode, open down the front
  const hShell = subtract(offset(torso, 1.9), offset(torso, -0.1), haoriOpen);
  for (const [bone, y0, y1] of bands) b.add(bone, intersect(hShell, aabb([-30, y0, -30], [30, y1, 30])), 'haori');
  b.paint(['chest', 'spine'], intersect(offset(haoriOpen, 0.8), front), 'haoriIn', { where: b.isMat('haori') });
  if (form === 'haori') {
    hachi(b, L);
    return coatSkirt(b, L, { mat: 'haori', lining: 'haoriIn', yTop: s.waistY - 2, yHem: 13, r0: 10.4, r1: 14, openFront: 16, res: KYORAKU_RES });
  }
  // the kimono: a looser shell over the haori with a wider opening; its collar a band of deeper pink
  const kOpen = vee(6.4, 7.6);
  const kShell = subtract(offset(torso, 3.4), offset(torso, 1.6), kOpen);
  for (const [bone, y0, y1] of bands) b.add(bone, intersect(kShell, aabb([-30, y0, -30], [30, y1, 30])), 'kimono');
  b.paint(['chest', 'spine'], intersect(offset(kOpen, 1.6), front), 'kimono', { shade: 3, where: b.isMat('kimono') });
  const coat = coatSkirt(b, L, { mat: 'kimono', lining: 'haori', yTop: s.waistY - 2, yHem: 13, r0: 11.2, r1: 15, openFront: 18, res: KYORAKU_RES });
  const panels = ['F.L', 'S.L', 'B.L', 'B.R', 'S.R', 'F.R'].flatMap((n) => [`coat.${n}`, `coat.${n}.2`]);
  // the haori's white hem showing below the kimono's
  b.paint(panels, fn((_x, y) => y - 15.2, [-30, 0, -30], [30, 20, 30]), 'haori', { where: b.isMat('kimono') });
  // blossoms all over the kimono: pale and deep pink, yellow hearts (visiting only the kimono's voxels)
  const isKimono = b.isMat('kimono');
  for (const bone of ['chest', 'spine', 'upperarm.L', 'upperarm.R', 'forearm.L', 'forearm.R', 'sleeve.L', 'sleeve.R', ...panels]) {
    const hits: [number, number, number, string][] = [];
    b.grid(bone).forEach((x, y, z, v) => {
      if (!isKimono(v)) return;
      const n = blossomAt(x, y, z);
      if (n.d < 0.85) hits.push([x, y, z, 'blossomY']);
      else if (n.d < 2.7 * (0.68 + 0.32 * Math.cos(5 * n.a))) hits.push([x, y, z, n.kind ? 'blossomD' : 'blossomW']);
    });
    for (const [x, y, z, m] of hits) b.voxel(bone, x, y, z, m, 'auto');
  }
  return coat;
}

const CELL = 7.2;
function hash3(i: number, j: number, k: number): number {
  const v = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453;
  return v - Math.floor(v);
}

/** the nearest blossom centre on a jittered lattice (some cells left empty) */
function blossomAt(x: number, y: number, z: number): { d: number; a: number; kind: number } {
  const ci = Math.floor(x / CELL), cj = Math.floor(y / CELL), ck = Math.floor(z / CELL);
  let best = 1e9, a = 0, kind = 0;
  for (let i = ci - 1; i <= ci + 1; i++)
    for (let j = cj - 1; j <= cj + 1; j++)
      for (let k = ck - 1; k <= ck + 1; k++) {
        const h1 = hash3(i, j, k);
        if (h1 > 0.66) continue;
        const fx = (i + 0.2 + hash3(j, k, i) * 0.6) * CELL, fy = (j + 0.2 + hash3(k, i, j) * 0.6) * CELL, fz = (k + 0.2 + hash3(i + 7, j - 3, k + 1) * 0.6) * CELL;
        const d = Math.hypot(x - fx, y - fy, z - fz);
        if (d < best) {
          best = d;
          a = Math.atan2(y - fy, x - fx + (z - fz) * 0.7);
          kind = h1 < 0.36 ? 0 : 1;
        }
      }
  return { d: best, a, kind };
}

/** 八 on the haori's back, drawn as seen from behind. */
function hachi(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const HACHI = [
    '...X.X...',
    '...X..X..',
    '...X..X..',
    '..X....X.',
    '..X....X.',
    '.X......X',
    'X.......X',
  ];
  const g = b.grid('chest');
  HACHI.forEach((row, r) => {
    for (let ci = 0; ci < row.length; ci++) {
      if (row[ci] !== 'X') continue;
      const x = 4 - ci, y = s.chestY + 4 - r;
      for (let z = -16; z < 2; z++)
        if (g.get(x, y, z) !== 0) {
          b.voxel('chest', x, y, z, 'kanji', 0);
          break;
        }
    }
  });
}

// ---------------------------------------------------------------------------------------------- props

/** the hilt both swords share: dark-blue wrap over pale ray skin, a cut-corner bronze guard engraved with petals */
function hilt(b: ModelBuilder, guard: number): void {
  b.mat('wrap', ['#2E3F78', '#1E2D5C', '#141E40'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#E8E4D8']);
  b.mat('bronze', ['#D9B866', '#B8923A', '#8E6E28', '#664E1C'], { base: 1, rough: 0.35, metal: 0.75, shadeK: 0.8 });
  const tz = 5.2;
  // the guard: a rectangle with its corners cut (an octagon), two holes, a petal engraved on each face
  const oct = prism([[-guard, -guard * 0.55], [-guard * 0.55, -guard], [guard * 0.55, -guard], [guard, -guard * 0.55], [guard, guard * 0.55], [guard * 0.55, guard], [-guard * 0.55, guard], [-guard, guard * 0.55]], [0, 0, tz], [1, 0, 0], [0, 1, 0], 0.55);
  b.add('root', oct, 'bronze');
  for (const k of [-1, 1]) b.carve('root', cylinder([k * guard * 0.55, guard * 0.3, tz - 1], [k * guard * 0.55, guard * 0.3, tz + 1], 0.55));
  b.paint('root', fn((x, y, z) => {
    if (Math.abs(z - tz) > 0.6) return 1;
    const a = Math.atan2(y + guard * 0.35, x), r = Math.hypot(x, y + guard * 0.35);
    return r - (0.4 + 0.9 * Math.abs(Math.cos(2.5 * a)));
  }, [-4, -4, tz - 1], [4, 4, tz + 1]), 'bronze', { shade: 3, where: b.isMat('bronze') });
  // the wrap with its diamonds, a bronze collar and pommel
  b.add('root', box([0, 0, -0.8], [1.1, 1.25, 5.6], { round: 0.5 }), 'wrap');
  b.paint('root', fn((_x, y, z) => Math.abs(((Math.abs(y) + z) % 2.6 + 2.6) % 2.6 - 1.3) - 0.42, [-2, -2, -6.5], [2, 2, 4.6]), 'ray', { where: b.isMat('wrap') });
  b.add('root', box([0, 0, 4.4], [1.2, 1.35, 0.45], { round: 0.3 }), 'bronze');
  b.add('root', box([0, 0, -6.8], [1.25, 1.4, 0.55], { round: 0.35 }), 'bronze');
}

/**
 * The sealed daishō: a katana-curved blade of `len` voxels (the tachi 36, the wakizashi 21) on the shared
 * hilt. Origin at the grip, blade along +Z, edge toward −Y.
 */
function buildSword(len: number, name: string): VoxelModel {
  const b = new ModelBuilder(name, 48);
  b.mat('steel', ['#EEF2F6', '#D3D8DE', '#A6ADB6'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#F3F3F0'], { rough: 0.12, metal: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  const z0 = 6.3, zTip = z0 + len, zEnd = zTip - 3.4;
  const curve = (z: number) => ((z - z0) / len) ** 2 * 1.6;
  b.add('root', fn((x, y, z) => {
    if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
    const c = curve(z);
    const top = 0.85 + c, bot = -1.05 + c + Math.max(0, z - zEnd) * 0.55;
    return Math.max(Math.abs(x) - 0.5, y - top, bot - y, z0 - z, z - zTip);
  }, [-2, -3, z0 - 1], [2, 5, zTip + 1]), 'steel', { thr: 0.3 });
  b.paint('root', fn((_x, y, z) => y - (-0.6 + curve(z) + Math.max(0, z - zEnd) * 0.55), [-2, -3, 0], [2, 5, zTip + 1]), 'edge');
  hilt(b, len > 30 ? 2.7 : 2.2);
  b.add('root', box([0, -0.05, 6], [0.85, 1.25, 0.5]), 'bronze'); // habaki
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** A black lacquered scabbard with bronze fittings for a blade of `len` voxels. Origin at the mouth, +Z. */
function buildSheath(len: number, name: string): VoxelModel {
  const b = new ModelBuilder(name, 48);
  b.mat('lacquer', ['#3A2C30', '#2A1F24', '#1E1619', '#141418'], { base: 1, rough: 0.28, shadeK: 0.8 });
  b.mat('bronze', ['#D9B866', '#B8923A', '#8E6E28'], { base: 1, rough: 0.35, metal: 0.75 });
  b.mat('cord', ['#3E5A9A', '#2E4278', '#1E2D5C'], { base: 1, rough: 0.85 });
  b.bone('root', null, [0, 0, 0]);
  const L = len + 1.5;
  const curve = (z: number) => (z / L) ** 2 * 1.6;
  b.add('root', fn((x, y, z) => {
    const c = curve(Math.max(0, z));
    return Math.max(Math.hypot(x / 1.0, (y - c) / 1.6) - 1, -z, z - L);
  }, [-2, -3, -1], [2, 5, L + 1]), 'lacquer');
  b.add('root', box([0, 0, 0.4], [1.3, 1.9, 0.6], { round: 0.3 }), 'bronze');
  b.add('root', box([0, curve(L - 0.3), L - 0.3], [1.15, 1.75, 0.6], { round: 0.4 }), 'bronze');
  b.add('root', fn((x, y, z) => Math.hypot(Math.hypot(x, y) - 1.7, z - 4.6) - 0.45, [-3, -3, 3], [3, 3, 6.2]), 'cord');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * Shikai: a great Chinese scimitar — a black blade widening toward a heavily curved point, a silver edge,
 * half-round notches down the spine; the shared hilt, and a long red tassel from the pommel. Katen (the
 * larger) is about 90 cm of blade; Kyōkotsu a little shorter. Origin at the grip, +Z, edge −Y.
 */
function buildScimitar(big: boolean): VoxelModel {
  const b = new ModelBuilder(big ? 'katen' : 'kyokotsu', 48);
  b.mat('blade', ['#34343A', '#26262C', '#1C1C21', '#141418'], { base: 1, rough: 0.25, metal: 0.7, shadeK: 0.7 });
  b.mat('edge', ['#E8EDF2', '#D5DBE1', '#B9C0C8'], { base: 0, rough: 0.12, metal: 0.85 });
  b.mat('tassel', ['#D8323F', '#C21F2E', '#9A1824', '#741019'], { base: 1, rough: 0.85 });
  b.bone('root', null, [0, 0, 0]);
  const z0 = 6.2, len = big ? 41 : 36, zTip = z0 + len;
  // the spine sweeps up toward the point; the edge's belly swells out, then rises sharply to meet it
  const u = (z: number) => Math.max(0, Math.min(1, (z - z0) / len));
  const spine = (z: number) => 1.1 + Math.pow(u(z), 2.2) * 3.2;
  const width = (t: number) => (t < 0.78 ? 2.4 + 2.6 * Math.pow(t / 0.78, 0.8) : 5 * Math.pow(1 - (t - 0.78) / 0.22, 0.7));
  const belly = (z: number) => spine(z) - width(u(z));
  const blade = fn((x, y, z) => {
    if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
    const top = spine(z), bot = belly(z);
    const th = 0.62 - u(z) * 0.12;
    return Math.max(Math.abs(x) - th, y - top, bot - y, z0 - z, z - zTip);
  }, [-2, -8, z0 - 1], [2, 8, zTip + 1]);
  b.add('root', blade, 'blade', { thr: 0.3 });
  // half-round notches down the spine
  for (const t of [0.3, 0.45, 0.6]) {
    const z = z0 + len * t;
    b.carve('root', cylinder([-2, spine(z) + 0.2, z], [2, spine(z) + 0.2, z], 1.15));
  }
  // the silver edge
  b.paint('root', fn((_x, y, z) => y - (belly(z) + 1.3), [-2, -8, z0 - 1], [2, 8, zTip + 1]), 'edge', { where: b.isMat('blade') });
  hilt(b, big ? 2.9 : 2.6);
  b.add('root', box([0, 0.2, 5.9], [0.85, 1.5, 0.5]), 'bronze');
  // the tassel: a cord from the pommel ring, a knot, and a long fringe hanging below
  b.add('root', cylinder([0, -1.3, -7.4], [0, -1.3, -7.9], 0.9), 'bronze');
  const cord = smoothPath([[0, -1.5, -7.8], [0, -3.4, -8.8], [0, -5.6, -9.2]], 3);
  b.add('root', tube(cord, cord.map(() => 0.45)), 'tassel', { thr: 0.2 });
  b.add('root', ellipsoid([0, -6.2, -9.3], [0.9, 0.9, 0.9]), 'tassel');
  b.add('root', cylinder([0, -6.6, -9.4], [0, -15.5, -10.6], 1.0, 1.7), 'tassel', { thr: 0.25 });
  b.paint('root', fn((x) => Math.abs(((x + 20) % 0.9) - 0.45) - 0.2, [-3, -17, -12], [3, -6.8, -8]), 'tassel', { shade: 3, where: b.isMat('tassel') });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}
