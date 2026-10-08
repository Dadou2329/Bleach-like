// Szayelaporro Granz — Octava Espada (docs/roster/E2-espada-2.md §4). Brief: 185 cm, the standard 84-voxel body
// built at 45.4 vox/m, tall, very slender and long-legged. Silhouette keys: pink chin-length hair with the bangs swept
// to his right, rectangular bone-framed glasses (his mask), a long white tunic closed to the neck with three black
// stripes from the collar, the sword hanging at thigh height on two frilly light-purple cords.
// Fornicarás (Resurrección): a grey segmented bodice, a long layered lilac skirt to the floor, white sleeves flaring
// from the elbow with purple lining, three spikes on each elbow and drop-strands hanging under the sleeves, white
// hands with long purple fingertips, purple droplets in the hair, a bone band across the forehead with the lower
// halves of the glasses on fan-plates at the temples, four purple lines above and below the left eye, and four grey
// wing branches in a butterfly outline, each hung with twelve red drop-strands.
// (verify) the stripe colour, the sheath and cords, the skirt layers.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, prism, smoothPath, sphere, spike, subtract, torus, tube, type Sdf, type V3 } from '../models/sdf';
import { SPEC_ADULT_MALE, addBands, coatSkirt, faceLegend, hands, head, humanoidSkeleton, type HumanoidSpec, type Landmarks } from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

/** 84 voxels = 1.85 m */
export const SZAYEL_RES = 84 / 1.85;
export type SzayelForm = 'sealed' | 'fornicaras';

/** Tall and very slender: narrow shoulders and chest, thin arms, long legs. */
const SPEC: HumanoidSpec = {
  ...SPEC_ADULT_MALE,
  shoulder: [8.8, 66.5, -0.5],
  chest: [7.4, 4.4],
  waist: [5.7, 3.8],
  hips: [6.5, 4.2],
  armR: 2.25,
  neckR: 2.3,
  hipsY: 46,
  hip: [4.1, 43, 0],
  kneeY: 23.5,
};

function palette(b: ModelBuilder): void {
  b.mat('skin', ['#FBEBDF', '#F7E0CF', '#EACDB9', '#DDBFAA', '#C29E88'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#FFB0D3', '#F79BC4', '#F27BB1', '#DF68A0', '#CF5A92', '#A8467A'], { base: 2, rough: 0.45, shadeK: 0.85 });
  b.mat('brow', ['#CF5A92']);
  b.mat('lid', ['#4A2433']);
  b.mat('sclera', ['#F3F1EC']);
  b.mat('iris', ['#DFA03A'], { glow: 0.15 });
  b.mat('pupil', ['#7A4A12']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#8E4A4E']);
  b.mat('frame', ['#F1EDE3', '#DCD8CE', '#BDB8AC'], { base: 1, rough: 0.4 });
  b.mat('lens', ['#DCEBF1'], { rough: 0.1, metal: 0.3 });
  b.mat('white', ['#F3F3F0', '#ECEBE6', '#DAD9D3', '#C2C4C6', '#A6ABB1'], { base: 1, rough: 0.82, shadeK: 0.9 });
  b.mat('stripe', ['#2A2A30', '#1C1C21', '#141418'], { base: 1, rough: 0.8 });
  b.mat('glove', ['#F3F3F0', '#E6E7EA', '#CDD1D6', '#B3B9C1'], { base: 0, rough: 0.7 });
  b.mat('boot', ['#2E2E35', '#1A1A1F', '#141418'], { base: 1, rough: 0.45, metal: 0.1 });
  b.mat('line', ['#ECECEC'], { rough: 0.6 });
  b.mat('cord', ['#E4D0F2', '#C9A6E3', '#A982C8', '#8C66AE'], { base: 1, rough: 0.85 });
  // Fornicarás
  b.mat('bodice', ['#B9B8C0', '#A3A2AB', '#8E8D96', '#77767F', '#605F68'], { base: 1, rough: 0.5, shadeK: 0.9 });
  b.mat('seam', ['#5E5D66'], { rough: 0.6 });
  b.mat('skirt', ['#AC80D0', '#9C6BC4', '#8E5EB7', '#7C50A4'], { base: 1, rough: 0.6, shadeK: 0.55 });
  b.mat('hem', ['#E4D6F2', '#CDB3E6'], { base: 1, rough: 0.6 });
  b.mat('lining', ['#8A44AA', '#6F2C8E', '#55206E'], { base: 1, rough: 0.7 });
  b.mat('spike', ['#6A3488', '#4A1F62', '#38164A'], { base: 1, rough: 0.4 });
  b.mat('purple', ['#9A5CBE', '#7A3E9E', '#64317F', '#552A70'], { base: 1, rough: 0.45 });
  b.mat('mark', ['#7A3E9E']);
  b.mat('bone', ['#F1EDE3', '#E6E1D5', '#D2CCBE', '#B8B1A2'], { base: 0, rough: 0.42, shadeK: 1 });
  b.mat('branch', ['#A9A8B1', '#8F8E97', '#77767F', '#605F68'], { base: 1, rough: 0.55, shadeK: 0.9 });
  b.mat('drop', ['#E04A5E', '#C3122F', '#9A0E25'], { base: 1, rough: 0.35 });
}

/**
 * Face rows chin+9 → chin (column 0 is his right): slim brows over the frames, half-lidded amber eyes inside the
 * rectangular glasses (the frame painted flat on the face plate, the arms run back along the temples), a thin smile
 * pulled up on his left.
 */
const FACE = [
  '. . . . . . . . . .',
  '. B B B . . B B B .',
  'F F F F . . F F F F',
  'F L L L F F L L L F',
  'F W I i . . i I W F',
  'F . I * . . * I . F',
  'F F F F . . F F F F',
  '. . . . . s . m . .',
  '. . . . m m m . . .',
  '. . . . . . . . . .',
];

/** released: only the lower halves of the frames are left; purple lines above and below the left eye */
const FACE_RELEASED = [
  '. . . . . . . . . .',
  '. B B B . . B B B .',
  '. . . . . M . M . M',
  '. L L L . . L L L .',
  '. W I i . . i I W .',
  'F . I * . . * I . F',
  'F F F F . . F F F F',
  '. . . . . M . m . M',
  '. . . . m m m . . .',
  '. . . . . . . . . .',
];

const assetCache = new Map<SzayelForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function szayelAsset(form: SzayelForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildSzayel(form)));
  return a;
}

/** 'katana' (Fornicarás drawn), 'sheath' (with the sword in it, on its cords), 'sheath-empty', 'balon' (Telon Balon) */
export type SzayelProp = 'katana' | 'sheath' | 'sheath-empty' | 'balon';

export function szayelProp(kind: SzayelProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) propCache.set(kind, (m = kind === 'katana' ? buildKatana() : kind === 'balon' ? buildBalon() : buildSheath(kind === 'sheath')));
  return m;
}

/** Telon Balon's radius (m): the prop's origin is the sphere's centre */
export const BALON_R = 1.15;

/** blade sample points (prop frame, m) */
export const KATANA_BASE_Z = 6 / 48;
export const KATANA_TIP_Z = 40 / 48;

export function buildSzayel(form: SzayelForm = 'sealed'): CharacterAsset {
  const b = new ModelBuilder(`szayel-${form}`, SZAYEL_RES);
  palette(b);
  const s = SPEC;
  const sealed = form === 'sealed';
  const L = humanoidSkeleton(b, s);
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 5, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5, wz + 1]);
  b.socket('finger.R', 'palm.R', [-wx + 0.2, wy - s.hand - 0.5, wz + 1]);
  // the sword hangs low, at the thigh, from its cords
  b.socket('hip.L', 'hips', [8.4, 38, 2.6], [-14, 180, -4]);
  b.socket('chest.front', 'chest', [0, 61, 6]);
  b.socket('back', 'chest', [0, 63, -5]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('mouth', 'head', [0, s.chinY + 1.5, hd.front + 0.5]);
  b.stamp('head', hd.x0, hd.chin + 9, sealed ? FACE : FACE_RELEASED, {
    ...faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'pupil', hi: 'hi', mouth: 'mouth' }),
    M: { mat: 'mark' },
    F: { mat: 'frame' },
  }, hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  hair(b, L, hd, !sealed);
  if (sealed) glasses(b, hd);
  else boneBand(b, hd);
  const springs: SpringDef[] = [];
  const colliders: ColliderDef[] = [];
  if (sealed) {
    const t = tunic(b, L);
    springs.push(...t.springs);
    colliders.push(...t.colliders);
    trousers(b, L);
    cords(b, L);
    hands(b, L, 'glove');
  } else {
    const r = released(b, L);
    springs.push(...r.springs);
    colliders.push(...r.colliders);
  }
  b.autoShade();
  b.lint();
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- head

/**
 * Straight pink hair falling to the jaw all round, the bangs swept across the forehead to his right (−X) and down
 * over the right brow; two thin shaved lines above the left ear. Released: purple droplets hang in it.
 */
function hair(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }, released: boolean): void {
  const s = L.spec;
  const c = hd.chin;
  const cz = L.headC[2] - 0.6;
  const yTop = c + s.head.h + 1.6, yBot = c + 0.2;
  const field = (x: number, y: number, z: number) => {
    const t = Math.max(0, Math.min(1, (c + 9 - y) / (c + 9 - yBot)));
    const rx = s.head.w / 2 + 1.5 + t * 0.7, rz = s.head.d / 2 + 1.4 + t * 0.6;
    const crown = y > c + 9 ? (y - (c + 9)) / (yTop - (c + 9)) : 0;
    const k = Math.sqrt(Math.max(0, 1 - crown * crown));
    const e = (Math.abs(x / (rx * k + 1e-3)) ** 3 + Math.abs((z - cz) / (rz * k + 1e-3)) ** 3) ** (1 / 3) - 1;
    return Math.max(e * Math.min(rx, rz) * 0.9, yBot - y, y - yTop);
  };
  const shell = fn(field, [-10, yBot - 1, cz - 10], [10, yTop + 1, cz + 10]);
  // the face open from the jaw up to the swept fringe: high on his left, low over his right brow
  const fringe = (x: number) => c + 10.2 - (4.6 - x) * 0.32;
  const face = fn((x, y, z) => Math.max(Math.abs(x) - 4.4, y - fringe(x), yBot - 2 - y, hd.front - 2.6 - z), [-6, yBot - 3, hd.front - 4], [6, c + 13, hd.front + 6]);
  b.add('head', subtract(shell, face), 'hair', { only: 'empty', thr: 0.2 });
  // the swept fringe: strands running down across the forehead toward his right temple
  b.paint('head', fn((x, y, z) => Math.max(Math.abs(((x * 0.55 + y * 0.9 + 60) % 1.8) - 0.9) - 0.22, hd.front - 3 - z), [-7, c + 6, hd.front - 4], [7, c + 14, hd.front + 2]), 'hair', { shade: 4, where: b.isMat('hair') });
  // strands: straight grooves falling down the sides and the back
  b.paint('head', fn((x, _y, z) => Math.abs(((Math.atan2(x, z - cz) * 7 + 30) % 1.4) - 0.7) - 0.16, [-10, yBot - 1, cz - 10], [10, c + 9, cz + 10]), 'hair', { shade: 4, where: b.isMat('hair') });
  b.paint('head', aabb([-10, yBot - 1, cz - 10], [10, yBot + 0.6, cz + 10]), 'hair', { shade: 4, where: b.isMat('hair') });
  // the two shaved lines above his left ear, running back
  for (const y of [c + 8.6, c + 10.2]) b.paint('head', aabb([s.head.w / 2 - 0.5, y, cz - 3.5], [s.head.w / 2 + 4, y + 0.6, cz + 2.5]), 'skin', { shade: 2, where: b.isMat('hair') });
  // keep the eyes clear of the fringe
  b.carve('head', aabb([-5, c + 3, hd.front], [-1, c + 7, hd.front + 6]));
  b.carve('head', aabb([1, c + 3, hd.front], [5, c + 7, hd.front + 6]));
  if (released) {
    // purple droplets strung in the hair
    for (const [x, y, z] of [[-6.8, c + 5, cz + 2], [-7.0, c + 1.5, cz - 1.5], [6.8, c + 4, cz + 1.5], [7.0, c + 1, cz - 2.5], [-4, c + 1, cz - 6.5], [3.5, c + 0.5, cz - 6.8]] as V3[]) {
      b.add('head', capsule([x, y + 1.6, z], [x, y - 0.6, z], 0.55, 1.0), 'purple', { thr: 0.25 });
    }
  }
}

/**
 * The glasses: the frame is painted on the face plate (the stamp), its top and bottom bars stand a voxel proud so the
 * rims catch the light; the arms run back along the temples to the ears.
 */
function glasses(b: ModelBuilder, hd: { front: number; chin: number }): void {
  const c = hd.chin, z = hd.front;
  for (const k of [-1, 1]) {
    const x0 = k > 0 ? 1 : -5, x1 = k > 0 ? 5 : -1;
    b.add('head', aabb([x0, c + 7, z], [x1, c + 8, z + 1]), 'frame');
    b.add('head', aabb([x0, c + 3, z], [x1, c + 4, z + 1]), 'frame');
    b.add('head', aabb([k > 0 ? 4.6 : -5.6, c + 6.6, z - 7], [k > 0 ? 5.6 : -4.6, c + 7.4, z]), 'frame');
  }
}

/** Released: the mask a thin bone band across the forehead, the glasses' lower halves on fan-plates at each temple. */
function boneBand(b: ModelBuilder, hd: { front: number; chin: number }): void {
  const c = hd.chin, z = hd.front;
  b.add('head', fn((x, y, zz) => Math.max(Math.abs(Math.hypot(x * 0.95, zz - (z - 6)) - 6.8) - 0.6, Math.abs(y - (c + 9.6)) - 0.6, (z - 8) - zz), [-9, c + 8, z - 10], [9, c + 11, z + 2]), 'bone', { thr: 0.25 });
  for (const k of [-1, 1]) {
    // the fan: three ribs spreading back from the temple
    for (let i = 0; i < 3; i++) {
      const a = -0.5 + i * 0.5;
      b.add('head', prism([[0, -0.8], [5.5, -1.6 + a * 2], [6, 0.4 + a * 2], [0, 0.8]], [k * 6.2, c + 7.5, z - 4], [0, Math.sin(a) * 0.5, -1], [k * 0.35, Math.cos(a), 0], 0.45), 'bone', { thr: 0.2 });
    }
    // the old frames' lower halves (painted on the face) hang from the fans on short posts
    b.add('head', aabb([k > 0 ? 5.6 : -6.6, c + 3, z - 3], [k > 0 ? 6.6 : -5.6, c + 7.5, z - 1]), 'bone');
    b.add('head', aabb([k > 0 ? 4.6 : -6.6, c + 3, z - 1.5], [k > 0 ? 6.6 : -4.6, c + 4, z]), 'bone');
  }
}

// ---------------------------------------------------------------------------------------------- the uniform

function torsoSdf(L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  return blend(3,
    box([0, s.chestY - 0.5, -0.3], [cx, 6, cz], { round: 3.2 }),
    box([0, s.waistY, -0.2], [wx, 4.6, wz], { round: 2.8 }),
    box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 3.6, s.hips[1]], { round: 2.4 }),
    capsule([2.4, sy + 1.4, sz - 0.8], [sx - 1.5, sy - 0.2, sz], 2.6, 2.7),
    capsule([-2.4, sy + 1.4, sz - 0.8], [-sx + 1.5, sy - 0.2, sz], 2.6, 2.7),
    sphere([sx, sy - 0.5, sz], 3.0), sphere([-sx, sy - 0.5, sz], 3.0));
}

/**
 * The long tunic: closed from the hem to under the chin (a tall collar round the neck), long fitted sleeves, three
 * black stripes from the collar — one down the middle, one down each side of the chest — to the calf-length hem.
 */
function tunic(b: ModelBuilder, L: Landmarks): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  const torso = offset(torsoSdf(L), 0.9);
  addBands(b, intersect(torso, aabb([-30, 36, -30], [30, 78, 30])), 'white', [['hips', 36, 45], ['spine', 45, 56], ['chest', 54, 80]]);
  // the collar: a tall closed band round the neck up to the jaw
  const nz = L.headC[2] - 0.9;
  const collar = fn((x, y, z) => {
    const r = 3.9 + Math.max(0, Math.min(1, (sy + 1 - y) / 4)) * 1.6;
    const top = s.chinY + 1.2 + Math.max(0, -(z - nz)) * 0.25;
    return Math.max(Math.hypot(x, (z - nz) * 1.05) - r, y - top, sy - 3 - y);
  }, [-8, sy - 4, -8], [8, s.chinY + 4, 7]);
  b.add('chest', collar, 'white');
  b.paint('chest', fn((x, y, z) => Math.max(Math.abs(y - (s.chinY + 0.8)) - 0.45, Math.hypot(x, (z - nz) * 1.05) - 6), [-8, s.chinY - 1, -8], [8, s.chinY + 3, 7]), 'white', { shade: 3, where: b.isMat('white') });
  // stripes: down the middle of the front, and one down each side of the chest from the collar
  const front = (d: Sdf) => intersect(d, halfSpace([0, 0, 1], [0, 0, -1]));
  const lineXY = (x0: number, y0: number, x1: number, y1: number, r: number) => front(fn((x, y) => {
    const dx = x1 - x0, dy = y1 - y0;
    const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(x - x0 - dx * t, y - y0 - dy * t) - r;
  }, [Math.min(x0, x1) - 2, Math.min(y0, y1) - 2, -12], [Math.max(x0, x1) + 2, Math.max(y0, y1) + 2, 14]));
  const torsoBones = ['chest', 'spine', 'hips'];
  b.paint([...torsoBones, 'neck'], lineXY(0, s.chinY + 1, 0, 30, 0.55), 'stripe', { where: b.isMat('white') });
  for (const k of [-1, 1]) {
    b.paint(torsoBones, lineXY(k * 2.6, sy + 2, k * 4.4, s.waistY - 2, 0.55), 'stripe', { where: b.isMat('white') });
    b.paint(torsoBones, lineXY(k * 4.4, s.waistY - 2, k * 4.9, 30, 0.55), 'stripe', { where: b.isMat('white') });
  }
  // sleeves: long and fitted, a turned cuff at the wrist
  b.add('upperarm.L', blend(1.4, sphere([sx, sy - 0.5, sz], 3.3), cylinder([sx + 0.2, ey - 0.5, sz], [sx, sy - 0.5, sz], 2.9, 3.1, 1.1)), 'white', { mirror: true });
  b.add('forearm.L', blend(1.2, sphere([sx, ey, sz], 2.9), cylinder([sx, wy + 0.4, sz], [sx, ey + 1, sz], 3.0, 2.8, 1)), 'white', { mirror: true });
  b.paint('forearm.L', cylinder([sx, wy + 0.2, sz], [sx, wy + 1.4, sz], 3.4), 'white', { shade: 3, mirror: true, where: b.isMat('white') });
  b.carve('forearm.L', cylinder([sx, wy - 1, sz], [sx, wy + 1.1, sz], 1.9, 1.9), { mirror: true });
  b.add('forearm.L', capsule([sx, wy + 3.5, sz], [sx, wy - 0.5, sz], 1.6), 'glove', { mirror: true, only: 'empty' });
  b.paint('upperarm.L', torus([sx, ey + 1.4, sz], 3.0, 0.45), 'white', { shade: 3, mirror: true, where: b.isMat('white') });
  // the skirt of the tunic: closed, flaring a little to the calf, the middle stripe running on down the front
  const skirt = coatSkirt(b, L, { mat: 'white', lining: 'white', yTop: s.waistY - 4, yHem: 15, r0: 8.0, r1: 11.4, openFront: 2, res: SZAYEL_RES });
  const panels = ['coat.F.L', 'coat.F.L.2', 'coat.F.R', 'coat.F.R.2'];
  b.paint(panels, aabb([-0.55, 10, 0], [0.55, s.waistY, 20]), 'stripe', { where: b.isMat('white') });
  for (const k of [-1, 1]) b.paint(panels, fn((x, y, z) => Math.max(Math.abs(x - k * (4.9 + (s.waistY - 4 - y) * 0.06)) - 0.55, z < 2 ? 1 : -1, y - (s.waistY - 3), 13 - y), [-12, 12, 0], [12, s.waistY, 20]), 'stripe', { where: b.isMat('white') });
  b.paint(['coat.F.L.2', 'coat.S.L.2', 'coat.B.L.2', 'coat.B.R.2', 'coat.S.R.2', 'coat.F.R.2'], aabb([-20, 12, -20], [20, 16.4, 20]), 'white', { shade: 3, where: b.isMat('white') });
  return skirt;
}

/** Slightly cropped white trousers over black boots with the white line round the sole. */
function trousers(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [hx, hy, hz] = s.hip;
  const [kx, ky, kz] = L.knee;
  const [ax, ay, az] = L.ankle;
  b.add('thigh.L', blend(1.4, sphere([hx, hy, hz], 4.0), capsule([hx, hy, hz], [kx, ky + 1, kz], 3.7, 3.1)), 'white', { mirror: true });
  b.add('shin.L', blend(1.2, sphere([kx, ky, kz], 3.0), capsule([kx, ky, kz], [ax, ay + 5, az], 3.0, 2.9)), 'white', { mirror: true });
  b.paint('shin.L', torus([ax, ay + 5.4, az], 2.9, 0.45), 'white', { shade: 3, mirror: true, where: b.isMat('white') });
  // boots
  const f = s.foot;
  const toeZ = az + f.len - f.heel;
  b.add('foot.L', capsule([ax, ay + 6, az - 0.4], [ax, ay - 1, az - 0.4], 2.4, 2.3), 'boot', { mirror: true });
  b.add('foot.L', intersect(box([ax, 2.2, az + (f.len / 2 - f.heel)], [2.4, 2.2, f.len / 2 + 0.4], { round: 1.5 }), halfSpace([0, 5.2, toeZ - 3], [0, 1, 0.6])), 'boot', { mirror: true });
  b.paint('foot.L', aabb([ax - 5, 0, az - 8], [ax + 5, 1, az + 12]), 'line', { mirror: true });
}

/** Two frilly light-purple cords tied at his left hip, looping down to the sheath at thigh height. */
function cords(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const x = s.waist[0] + 1.6;
  for (const [dz, low] of [[1.6, 37.4], [-1.2, 38.6]] as [number, number][]) {
    const p = smoothPath([[x - 0.6, s.waistY - 3.5, dz], [x + 0.9, s.waistY - 7, dz + 0.4], [x + 1.6, low + 1.5, dz + 0.6], [x + 1.4, low, dz + 0.2]], 4);
    b.add('hips', tube(p, p.map(() => 0.75)), 'cord', { thr: 0.2 });
    // frills: little puffs along the cord
    for (let i = 2; i < p.length - 1; i += 3) b.add('hips', sphere(p[i], 1.05), 'cord', { thr: 0.2 });
  }
  // the knot at the waist
  b.add('hips', ellipsoid([x - 0.4, s.waistY - 3.6, 0.4], [1.3, 1.1, 1.6]), 'cord');
}

// ---------------------------------------------------------------------------------------------- Fornicarás

function released(b: ModelBuilder, L: Landmarks): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  const [wx2, wy2, wz2] = L.wrist;
  // the bodice: grey, fitted, in segments, up round the neck
  const torso = offset(torsoSdf(L), 0.6);
  addBands(b, intersect(torso, aabb([-30, 36, -30], [30, 78, 30])), 'bodice', [['hips', 36, 45], ['spine', 45, 56], ['chest', 54, 80]]);
  b.add('neck', capsule([0, s.chinY - 5, L.headC[2] - 0.6], [0, s.chinY + 0.5, L.headC[2] - 0.6], s.neckR + 0.4), 'bodice');
  for (let y = 40; y < 70; y += 3.4) b.paint(['chest', 'spine', 'hips'], aabb([-12, y, -12], [12, y + 0.55, 12]), 'seam', { where: b.isMat('bodice') });
  b.paint(['chest', 'spine', 'hips'], intersect(aabb([-0.5, 36, 0], [0.5, 72, 14]), halfSpace([0, 0, 1], [0, 0, -1])), 'seam', { where: b.isMat('bodice') });
  // upper arms in the bodice's grey; white sleeves from the elbow flaring to a wide cuff, lined purple
  b.add('upperarm.L', blend(1.4, sphere([sx, sy - 0.5, sz], 3.0), capsule([sx, sy - 1, sz], [sx, ey + 1, sz], 2.6, 2.3)), 'bodice', { mirror: true });
  const flare = (y: number) => Math.max(0, Math.min(1, (ey + 1 - y) / (ey + 1 - (wy + 0.5)))) ** 2 * 2.4;
  const sleeve = fn((x, y, z) => Math.max(Math.abs(Math.hypot(x - sx, z - sz) - 2.9 - flare(y) + 0.5) - 0.8, y - (ey + 1.5), wy + 0.3 - y), [sx - 8, wy - 2, sz - 8], [sx + 8, ey + 3, sz + 8]);
  b.add('forearm.L', sleeve, 'white', { mirror: true });
  b.paint('forearm.L', fn((x, y, z) => Math.hypot(x - sx, z - sz) - 2.6 - flare(y), [sx - 8, wy - 2, sz - 8], [sx + 8, ey + 3, sz + 8]), 'lining', { mirror: true, where: b.isMat('white') });
  b.add('forearm.L', capsule([sx, ey + 0.5, sz], [sx, wy + 0.5, sz], 2.1, 1.7), 'white', { mirror: true });
  b.add('forearm.L', sphere([sx, ey, sz], 2.4), 'bodice', { mirror: true });
  // three small spikes up off each elbow; four drop-strands hanging under each sleeve
  for (let i = 0; i < 3; i++) b.add('forearm.L', spike([sx + 0.6, ey + 0.5 - i * 1.2, sz - 2.2], [0.3, 0.5, -1], 2.6 - i * 0.4, 0.8, 0.6, { tip: 0.2 }), 'spike', { mirror: true, thr: 0.25 });
  // ... hanging from the underside of the sleeve, behind the hand
  for (let i = 0; i < 4; i++) {
    const a = Math.PI * (0.7 + i * 0.2);
    const top: V3 = [sx + Math.sin(a) * 3.8, wy + 2, sz + Math.cos(a) * 3.8];
    b.add('forearm.L', capsule(top, [top[0], top[1] - 5.5, top[2] - 0.6], 0.45, 1.0), 'spike', { mirror: true, thr: 0.25 });
  }
  // white hands with long purple fingertips
  hands(b, L, 'white');
  b.add('palm.L', capsule([wx2 - 0.2, wy2 - s.hand + 1.5, wz2 + 0.4], [wx2 - 0.2, wy2 - s.hand - 2.2, wz2 + 0.6], 1.0, 0.45), 'purple', { mirror: true, thr: 0.25 });
  b.paint('palm.L', aabb([wx2 - 3, wy2 - s.hand - 3, wz2 - 4], [wx2 + 3, wy2 - s.hand + 0.6, wz2 + 5]), 'purple', { mirror: true, where: b.isMat('white') });
  b.paint('fist.L', aabb([wx2 - 3, wy2 - 9, wz2 - 4], [wx2 + 3, wy2 - 7.4, wz2 + 5]), 'purple', { mirror: true, where: b.isMat('white') });
  // legs under the skirt (the bodice grey), slippers
  const [hx, hy, hz] = s.hip;
  b.add('thigh.L', capsule([hx, hy, hz], [L.knee[0], L.knee[1] + 1, L.knee[2]], 3.3, 2.8), 'bodice', { mirror: true });
  b.add('shin.L', capsule([L.knee[0], L.knee[1], L.knee[2]], [L.ankle[0], L.ankle[1] + 1, L.ankle[2]], 2.7, 2.1), 'bodice', { mirror: true });
  b.add('foot.L', blend(1, capsule([L.ankle[0], L.ankle[1] + 1, L.ankle[2]], [L.ankle[0], 1.4, L.ankle[2] + 6], 2.1, 1.6)), 'bodice', { mirror: true });
  // the long layered skirt: an outer layer to the shins over an inner one to the floor, pale edges
  const inner = coatSkirt(b, L, { mat: 'skirt', lining: 'lining', yTop: s.waistY - 3, yHem: 0, r0: 7.2, r1: 13.4, openFront: 0, res: SZAYEL_RES, prefix: 'skirt' });
  const outer = coatSkirt(b, L, { mat: 'skirt', lining: 'lining', yTop: s.waistY - 1, yHem: 16, r0: 8.6, r1: 16, openFront: 0, res: SZAYEL_RES, prefix: 'over' });
  for (const pre of ['skirt', 'over']) {
    const lows = ['F.L', 'S.L', 'B.L', 'B.R', 'S.R', 'F.R'].map((p) => `${pre}.${p}.2`);
    b.paint(lows, aabb([-30, pre === 'skirt' ? -1 : 14, -30], [30, pre === 'skirt' ? 1.4 : 17.4, 30]), 'hem', { where: b.isMat('skirt') });
  }
  // the wings: four grey branches in a butterfly outline from the shoulder blades, twelve red drops on each
  const springs = [...inner.springs, ...outer.springs];
  const colliders = [...inner.colliders, ...outer.colliders];
  wings(b, L, springs);
  return { springs, colliders };
}

/** Wing bones: wing.U.L/R (upper, up and out), wing.D.L/R (lower, down and out); twelve drop-strands each. */
function wings(b: ModelBuilder, L: Landmarks, springs: SpringDef[]): void {
  const s = L.spec;
  const root: V3 = [0, s.chestY + 1, -s.chest[1] - 0.5];
  for (const k of [1, -1]) {
    const side = k > 0 ? 'L' : 'R';
    for (const [kind, pts] of [
      ['U', [[k * 1.5, 0, 0], [k * 14, 16, -6], [k * 30, 34, -9], [k * 40, 52, -8], [k * 38, 66, -6]]],
      ['D', [[k * 1.5, -2, 0], [k * 14, -6, -6], [k * 28, -2, -9], [k * 38, -12, -8], [k * 36, -28, -5]]],
    ] as [string, V3[]][]) {
      const bone = `wing.${kind}.${side}`;
      b.bone(bone, 'chest', root);
      const path = smoothPath(pts.map((p) => [root[0] + p[0], root[1] + p[1], root[2] + p[2]] as V3), 6);
      b.add(bone, tube(path, path.map((_, i) => 2.0 - (i / path.length) * 1.3)), 'branch', { thr: 0.2 });
      // a few knots along the branch
      for (let i = 4; i < path.length - 2; i += 7) b.add(bone, sphere(path[i], 1.9 - (i / path.length) * 1.1), 'branch', { thr: 0.2 });
      // twelve red drop-strands hanging from it, evenly spaced along its outer part
      for (let i = 0; i < 12; i++) {
        const p = path[Math.min(path.length - 1, Math.round(4 + (i / 11) * (path.length - 6)))];
        const len = 7 + (i % 3) * 2;
        const top: V3 = [p[0], p[1] - 0.6, p[2]];
        b.add(bone, capsule(top, [top[0], top[1] - len + 2, top[2]], 0.45, 0.45), 'drop', { thr: 0.25 });
        b.add(bone, ellipsoid([top[0], top[1] - len + 1.2, top[2]], [1.1, 1.6, 1.1]), 'drop', { thr: 0.25 });
      }
      const tip = path[path.length - 1];
      springs.push({ bone, tail: [(tip[0] - root[0]) / SZAYEL_RES, (tip[1] - root[1]) / SZAYEL_RES, (tip[2] - root[2]) / SZAYEL_RES], stiffness: 140, damping: 7, gravity: 2, limit: 18, radius: 0.1 });
    }
  }
}

// ---------------------------------------------------------------------------------------------- props

/** Fornicarás sealed: a plain katana with a guard shaped like an atom, a grey-blue grip. */
function buildKatana(): VoxelModel {
  const b = new ModelBuilder('fornicaras', 48);
  b.mat('steel', ['#E8EBEF', '#D3D8DE', '#B0B7BF', '#8E959E'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#F3F3F0'], { rough: 0.12, metal: 0.8 });
  b.mat('wrap', ['#9AA8BC', '#7C8DA6', '#62728A'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#E6EAF0']);
  b.mat('guard', ['#D3D8DE', '#B9BFC6', '#8F969E'], { base: 1, rough: 0.3, metal: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  const z0 = 6, zTip = 40, zEnd = zTip - 3;
  const curve = (z: number) => Math.max(0, z - z0) ** 2 * 0.001;
  b.add('root', fn((x, y, z) => {
    if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
    const cv = curve(z);
    const top = 0.9 + cv, bot = -1.1 + cv + Math.max(0, z - zEnd) * 0.66;
    return Math.max(Math.abs(x) - 0.5, y - top, bot - y, z0 - z, z - zTip);
  }, [-2, -3, z0 - 1], [2, 3, zTip + 1]), 'steel', { thr: 0.3 });
  b.paint('root', fn((_x, y, z) => y - (-0.62 + curve(z) + Math.max(0, z - zEnd) * 0.66), [-2, -3, 0], [2, 3, zTip + 1]), 'edge');
  // the atom: a nucleus with three orbits round it, in the guard's place
  b.add('root', sphere([0, 0, 5], 1.3), 'guard');
  for (const [rx, ry] of [[0, 0], [60, 0], [-60, 0]] as [number, number][]) {
    const a = (rx * Math.PI) / 180;
    b.add('root', fn((x, y, z) => {
      // a ring of radius 3.4 in the XY plane round z = 5, tilted about Z by a
      const ca = Math.cos(a), sa = Math.sin(a);
      const u = x * ca + y * sa, v = -x * sa + y * ca;
      return Math.hypot(Math.hypot(u / 1.0, v / 0.45) - 3.4, z - 5) - 0.42;
    }, [-5, -5, 3], [5, 5, 7]), 'guard', { thr: 0.25 });
    void ry;
  }
  b.add('root', box([0, 0, 0], [1.05, 1.2, 4], { round: 0.5 }), 'wrap');
  b.paint('root', fn((_x, y, z) => Math.abs(((Math.abs(y) + z) % 2.6 + 2.6) % 2.6 - 1.3) - 0.42, [-2, -2, -4.5], [2, 2, 4]), 'ray', { where: b.isMat('wrap') });
  b.add('root', cylinder([0, 0, -4], [0, 0, -5], 1.15, 1.0, 0.3), 'guard');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** The grey sheath, hung on its cords; with the sword in it the atom guard and grip stand out of its mouth. */
function buildSheath(withSword: boolean): VoxelModel {
  const b = new ModelBuilder(withSword ? 'fornicaras-sheath-full' : 'fornicaras-sheath', 48);
  b.mat('lacquer', ['#A4A7AD', '#8D9096', '#74777D', '#5C5F65'], { base: 1, rough: 0.35, shadeK: 0.8 });
  b.mat('wrap', ['#9AA8BC', '#7C8DA6', '#62728A'], { base: 1, rough: 0.85 });
  b.mat('guard', ['#D3D8DE', '#B9BFC6', '#8F969E'], { base: 1, rough: 0.3, metal: 0.8 });
  b.mat('cord', ['#E4D0F2', '#C9A6E3', '#A982C8'], { base: 1, rough: 0.85 });
  b.bone('root', null, [0, 0, 0]);
  const Ls = 35;
  b.add('root', box([0, 0, Ls / 2], [0.95, 1.45, Ls / 2], { round: 0.6 }), 'lacquer');
  b.add('root', box([0, 0, 0.6], [1.15, 1.65, 0.6], { round: 0.3 }), 'guard');
  b.add('root', box([0, 0, Ls - 0.6], [1.1, 1.6, 0.7], { round: 0.5 }), 'guard');
  // the cord loops round it
  for (const z of [3.5, 9]) b.add('root', torus([0, 0, z], 1.6, 0.5, [90, 0, 0]), 'cord', { thr: 0.2 });
  if (withSword) {
    b.add('root', sphere([0, 0, -1], 1.3), 'guard');
    for (const a of [0, Math.PI / 3, -Math.PI / 3]) {
      b.add('root', fn((x, y, z) => {
        const u = x * Math.cos(a) + y * Math.sin(a), v = -x * Math.sin(a) + y * Math.cos(a);
        return Math.hypot(Math.hypot(u, v / 0.45) - 3.4, z + 1) - 0.42;
      }, [-5, -5, -3], [5, 5, 1]), 'guard', { thr: 0.25 });
    }
    b.add('root', box([0, 0, -6], [1.05, 1.2, 4], { round: 0.5 }), 'wrap');
    b.add('root', cylinder([0, 0, -10], [0, 0, -11], 1.15, 1.0, 0.3), 'guard');
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * Telon Balon: the four wings wrapped round him, swollen thick into a ball — grey branch-bark wound in bands, the red
 * drop-strands pressed flat in rows over it. 24 vox/m, the origin at the centre.
 */
function buildBalon(): VoxelModel {
  const b = new ModelBuilder('telon-balon', 24);
  b.mat('branch', ['#A9A8B1', '#8F8E97', '#77767F', '#605F68'], { base: 1, rough: 0.55, shadeK: 0.9 });
  b.mat('drop', ['#E04A5E', '#C3122F', '#9A0E25'], { base: 1, rough: 0.35 });
  b.bone('root', null, [0, 0, 0]);
  const R = BALON_R * 24;
  b.add('root', fn((x, y, z) => Math.abs(Math.hypot(x, y, z) - R + 1.2) - 1.3, [-R - 2, -R - 2, -R - 2], [R + 2, R + 2, R + 2]), 'branch');
  // the wound bands: grooves running round it at a slant, the wings' edges overlapping
  b.paint('root', fn((x, y, z) => Math.abs((((y * 0.8 + x * 0.35) / 3.2 + 100) % 2) - 1) - 0.18, [-R - 2, -R - 2, -R - 2], [R + 2, R + 2, R + 2]), 'branch', { shade: 3, where: b.isMat('branch') });
  // rows of red drops pressed into it
  for (let i = 0; i < 36; i++) {
    const yv = 1 - ((i + 0.5) / 36) * 2;
    const r = Math.sqrt(1 - yv * yv), a = i * 2.39996;
    const p: V3 = [Math.cos(a) * r * (R + 0.4), yv * (R + 0.4), Math.sin(a) * r * (R + 0.4)];
    b.add('root', ellipsoid(p, [1.3, 1.9, 1.3]), 'drop');
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}
