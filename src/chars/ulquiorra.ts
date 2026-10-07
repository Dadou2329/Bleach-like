// Ulquiorra Cifer — Cuarta Espada. Construction and palette from docs/roster/E1-espada-1.md §Ulquiorra.
// Sealed: short messy black hair with a lock between the eyes, green cat-slit eyes, teal tear tracks
// down the cheeks, a black upper lip; the broken half-helmet with one horn on the left of the head; a
// white coat with a high collar, black trim and long tails, the Hollow hole at the sternum; black sash,
// white hakama, black boots; hands in his pockets. Murciélago: huge black bat wings, a centred helmet
// with two horns sweeping out and forward, longer hair, wide black tear marks, a closed robe flaring to
// the ankles. Segunda Etapa: bare white torso with black streaks running from the widened hole, black
// fur on the waist, legs and arms, claws and talons, a long thin tail, bat ears, yellow eyes on green.
// 1.69 m: the standard body at 49.8 vox/m, slender.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import {
  aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, prism, smoothPath, sphere, spike, subtract, torus, tube, type Sdf, type V2, type V3,
} from '../models/sdf';
import {
  SPEC_ADULT_MALE, addBands, coatSkirt, hakama, hands, head, humanoidSkeleton, obi, spikeHair, type HumanoidSpec, type Landmarks, type Spike,
} from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

export const ULQUIORRA_RES = (48 * 84) / 81;
export type UlquiorraForm = 'sealed' | 'murcielago' | 'segunda';

/** Slender: narrow shoulders and chest, thin arms. */
const SPEC: HumanoidSpec = {
  ...SPEC_ADULT_MALE,
  shoulder: [9.0, 66.5, -0.5],
  chest: [7.8, 4.6],
  waist: [6.2, 4.0],
  hips: [6.8, 4.4],
  armR: 2.4,
  neckR: 2.4,
};

function palette(b: ModelBuilder, form: UlquiorraForm): void {
  const seg = form === 'segunda';
  b.mat('skin', ['#F3F3F0', '#F0EEEA', '#E2DFD9', '#CFCAC2', '#B3ADA4'], { base: 1, rough: 0.55, shadeK: 0.85 });
  b.mat('hair', ['#3A4048', '#2A2E34', '#22262B', '#1A1C20', '#16171A', '#141418'], { base: 3, rough: 0.45, shadeK: 0.85, dither: 0.06 });
  b.mat('brow', ['#141418']);
  b.mat('lid', ['#141418']);
  b.mat('sclera', seg ? ['#2FBF5A'] : ['#F3F3F0'], seg ? { glow: 0.35 } : {});
  b.mat('iris', seg ? ['#F2D21C'] : ['#2E9E4E'], { glow: seg ? 0.6 : 0.2 });
  b.mat('slit', ['#141418']);
  b.mat('tear', form === 'sealed' ? ['#1E8C84'] : ['#141418'], { rough: 0.6 });
  b.mat('lip', ['#141418']);
  b.mat('bone', ['#F3F1EA', '#EEEBE3', '#DCD8CC', '#C2BDB0', '#A29C8E'], { base: 1, rough: 0.42, shadeK: 1 });
  b.mat('void', ['#141418'], { rough: 1 });
  b.mat('white', ['#F3F3F0', '#ECECE8', '#DCDDDA', '#C3C6C9', '#A6ABB1'], { base: 1, rough: 0.82, shadeK: 0.9 });
  b.mat('trim', ['#2A2A2F', '#1C1C20', '#141418'], { base: 1, rough: 0.7 });
  b.mat('sash', ['#2C2C32', '#1C1C20', '#141418'], { base: 1, rough: 0.8 });
  b.mat('boot', ['#2E2E35', '#1A1A1F', '#141418'], { base: 1, rough: 0.45, metal: 0.1 });
  b.mat('line', ['#ECECEC'], { rough: 0.6 });
  b.mat('wing', ['#33403A', '#26302B', '#1C2A22', '#181E1B', '#141418'], { base: 2, rough: 0.5, shadeK: 0.85, dither: 0.05 });
  b.mat('spar', ['#56605B', '#3E4743', '#2A302D'], { base: 1, rough: 0.4 });
  b.mat('fur', ['#34343A', '#26262B', '#1C1C20', '#16161A', '#141418'], { base: 2, rough: 0.9, shadeK: 0.9, dither: 0.12 });
  b.mat('claw', ['#3A3F48', '#22252B', '#141418'], { base: 1, rough: 0.25, metal: 0.3 });
  b.mat('nail', ['#141418']);
}

/**
 * Rows 9 → 0 (column 0 is his right). Sealed: heavy straight brows drooping at the ends, green eyes
 * with black slit pupils, the teal tear tracks running from the lower lids down to the jaw, the black
 * upper lip. Released: the marks turn black and widen into triangles.
 */
const FACE_SEALED = [
  '. . . . . . . . . .',
  '. . . . . . . . . .',
  '. B B B . . B B B .',
  '. . L L . . L L . .',
  '. W G G . . G G W .',
  '. W s G . . G s W .',
  '. . T . . . . T . .',
  '. . T . . . . T . .',
  '. . T . m m . T . .',
  '. . . . . . . . . .',
];
const FACE_RELEASED = [
  '. . . . . . . . . .',
  '. . . . . . . . . .',
  '. B B B . . B B B .',
  '. . L L . . L L . .',
  '. W G G . . G G W .',
  '. W s G . . G s W .',
  '. T T . . . . T T .',
  '. . T . . . . T . .',
  '. . T . m m . T . .',
  '. . T . . . . T . .',
];

const HAIR_SHORT: Spike[] = [
  // messy flat locks lying down and back over the crown
  { az: 0, el: 66, len: 2.5, r: 3.8, flat: 0.5, flow: [0, 0, -0.9] },
  { az: -50, el: 56, len: 3, r: 3.6, flat: 0.5, flow: [-0.1, -0.2, -0.8] },
  { az: 50, el: 56, len: 3, r: 3.6, flat: 0.5, flow: [0.1, -0.2, -0.8] },
  { az: 180, el: 50, len: 3.5, r: 4, flat: 0.5, flow: [0, -0.5, -0.5] },
  { az: -130, el: 34, len: 3.5, r: 3.8, flat: 0.5, flow: [0, -0.7, -0.3] },
  { az: 130, el: 34, len: 3.5, r: 3.8, flat: 0.5, flow: [0, -0.7, -0.3] },
  { az: -90, el: 22, len: 3, r: 3.4, flat: 0.5, flow: [0, -0.8, 0] },
  { az: 90, el: 22, len: 3, r: 3.4, flat: 0.5, flow: [0, -0.8, 0] },
  { az: 180, el: 16, len: 4, r: 3.6, flat: 0.55, flow: [0, -0.9, -0.2] },
  { az: -160, el: 8, len: 4, r: 3.2, flat: 0.55, flow: [0, -0.95, -0.1] },
  { az: 160, el: 8, len: 4, r: 3.2, flat: 0.55, flow: [0, -0.95, -0.1] },
];

const assetCache = new Map<UlquiorraForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function ulquiorraAsset(form: UlquiorraForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildUlquiorra(form)));
  return a;
}

export type UlquiorraProp = 'katana' | 'sheath' | 'sheath-empty' | 'luz' | 'lanza';

export function ulquiorraProp(kind: UlquiorraProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'katana' ? buildMurcielago() : kind === 'luz' ? buildSpear(false) : kind === 'lanza' ? buildSpear(true) : buildSheath(kind === 'sheath');
    propCache.set(kind, m);
  }
  return m;
}

export function buildUlquiorra(form: UlquiorraForm = 'sealed'): CharacterAsset {
  const b = new ModelBuilder(`ulquiorra-${form}`, ULQUIORRA_RES);
  palette(b, form);
  const s = SPEC;
  const sealed = form === 'sealed', seg = form === 'segunda';
  const L = humanoidSkeleton(b, s, { hakama: sealed });
  b.socket('grip.R', 'fist.R', [-L.wrist[0] + 0.1, L.wrist[1] - 4.3, L.wrist[2] + 0.4]);
  b.socket('grip.L', 'fist.L', [L.wrist[0] - 0.1, L.wrist[1] - 4.3, L.wrist[2] + 0.4]);
  b.socket('palm.R', 'palm.R', [-L.wrist[0] + 0.6, L.wrist[1] - 5, L.wrist[2] + 1]);
  b.socket('palm.L', 'palm.L', [L.wrist[0] - 0.6, L.wrist[1] - 5, L.wrist[2] + 1]);
  b.socket('finger.R', 'palm.R', [-L.wrist[0] + 0.2, L.wrist[1] - s.hand - 0.5, L.wrist[2] + 1]);
  b.socket('finger.L', 'palm.L', [L.wrist[0] - 0.2, L.wrist[1] - s.hand - 0.5, L.wrist[2] + 1]);
  b.socket('hip.L', 'hips', [8.6, 46.5, 3.2], [-28, 180, -8]);
  b.socket('chest.front', 'chest', [0, 61, 7]);
  b.socket('back', 'chest', [0, 62, -6]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.stamp('head', hd.x0, hd.chin + 9, sealed ? FACE_SEALED : FACE_RELEASED, {
    B: { mat: 'brow' }, L: { mat: 'lid' }, W: { mat: 'sclera' }, G: { mat: 'iris' }, s: { mat: 'slit' }, T: { mat: 'tear' }, m: { mat: 'lip' },
  }, hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  hair(b, L, hd, form);
  if (!seg) helmet(b, hd, form);
  else batEars(b, hd);
  const torso = body(b, L, form);
  hands(b, L, 'skin');
  const springs: SpringDef[] = [];
  const colliders: ColliderDef[] = [];
  if (sealed) {
    const coat = sealedCoat(b, L, torso);
    springs.push(...coat.springs);
    colliders.push(...coat.colliders);
  } else {
    const w = wings(b, L);
    springs.push(...w);
    if (form === 'murcielago') {
      const robe = robeSkirt(b, L, torso);
      springs.push(...robe.springs);
      colliders.push(...robe.colliders);
    } else {
      const t = segunda(b, L);
      springs.push(...t.springs);
      colliders.push(...t.colliders);
    }
  }
  if (!seg) boots(b, L);
  b.autoShade();
  b.lint();
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- head

function hair(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }, form: UlquiorraForm): void {
  const s = L.spec;
  const c = hd.chin;
  const long = form !== 'sealed';
  spikeHair(b, L, 'hair', HAIR_SHORT, [], { tufts: 26, tuftFlow: [0, -0.4, -0.3], hairline: c + s.head.h - 1, slope: 0.7 });
  // the fringe: messy locks over the forehead stopping at the brows, one falling between the eyes
  const front = hd.front;
  for (const [x, tipY, r, lean] of [[-4.2, c + 8.2, 1.3, -0.4], [-2.2, c + 8.6, 1.3, 0.2], [0.1, c + 4.6, 1.05, 0.15], [2.4, c + 8.5, 1.3, -0.2], [4.3, c + 8.1, 1.25, 0.5]] as [number, number, number, number][]) {
    const top: V3 = [x - lean, c + 11.8, front - 1.2];
    b.add('head', spike(top, [lean * 0.3, -1, 0.08], top[1] - tipY, r, r * 0.55, { side: [1, 0, 0], tip: 0.3 }), 'hair', { thr: 0.3 });
  }
  // sides over the ears
  for (const k of [-1, 1]) {
    const pts = smoothPath([[k * 5.6, c + 10.5, front - 4.5], [k * 6.3, c + 6.5, front - 4.8], [k * 6.1, c + (long ? 0 : 3.4), front - 5.2]], 3);
    b.add('head', tube(pts, pts.map((_, i) => 1.9 - i * 0.12)), 'hair', { thr: 0.3 });
  }
  if (long) {
    // released: the hair grows long and wild down the back
    const back = L.headC[2] - s.head.d / 2;
    for (let i = -3; i <= 3; i++) {
      const pts = smoothPath([[i * 1.7, c + 9, back + 1], [i * 2.1, c + 2, back - 1.2], [i * 2.4 + Math.sin(i) * 0.8, c - 8, back - 2.2], [i * 2.6, c - 15 + Math.abs(i) * 1.5, back - 2.4]], 3);
      b.add('head', tube(pts, pts.map((_, j) => 1.8 - j * 0.11)), 'hair', { thr: 0.3 });
    }
  }
  b.paint('head', fn((x, y) => Math.abs(((x * 0.9 + y * 0.2 + 40) % 2.4) - 1.2) - 0.32, [-9, c - 18, -12], [9, c + 14, 9]), 'hair', { shade: 4, where: b.isMat('hair') });
  // keep the eyes clear
  b.carve('head', aabb([-5, c + 4, front], [-1, c + 7, front + 6]));
  b.carve('head', aabb([1, c + 4, front], [5, c + 7, front + 6]));
}

/**
 * Sealed: the broken remnant of his mask, a half-helmet over the top-left of the skull with one horn
 * rising from the left side. Murciélago: the helmet moves to the centre, two big horns sweeping out
 * sideways and curving forward.
 */
function helmet(b: ModelBuilder, hd: { front: number; chin: number }, form: UlquiorraForm): void {
  const c = hd.chin;
  const cc: V3 = [0, c + 8.2, -1.4];
  const shell = subtract(ellipsoid(cc, [6.9, 6.4, 7.0]), ellipsoid(cc, [5.7, 5.2, 5.8]));
  if (form === 'sealed') {
    // left half of the crown, a jagged break running front to back just right of centre
    const half = fn((x, y, z) => -(x - 0.6 - Math.sin(z * 1.3) * 0.9 - Math.sin(z * 0.45 + 1) * 0.6), [-1, c, -10], [10, c + 16, 8]);
    const above = halfSpace([0, c + 9.2, 0], [0, -1, 0.3]);
    // hair poking through the helmet's footprint is cut away so the bone reads as a smooth cap
    b.carve('head', intersect(subtract(ellipsoid(cc, [10, 10, 10]), ellipsoid(cc, [6.6, 6.1, 6.7])), half, above));
    b.add('head', intersect(shell, half, above), 'bone');
    // the horn: up out of the left side, sweeping back
    b.add('head', spike([5.2, c + 11.6, -1.2], [0.25, 1, -0.35], 7.5, 1.8, 1.4, { bend: [0.05, -0.1, -0.4], taper: 1.1, tip: 0.3 }), 'bone', { thr: 0.25 });
    b.paint('head', fn((x, y, z) => Math.abs(x - 0.6 - Math.sin(z * 1.3) * 0.9 - Math.sin(z * 0.45 + 1) * 0.6) - 0.7, [-1, c, -10], [10, c + 16, 8]), 'bone', { shade: 4, where: b.isMat('bone') });
    return;
  }
  // centred helmet with a ridge down the middle
  const above = halfSpace([0, c + 9.4, 0], [0, -1, 0.35]);
  b.carve('head', intersect(subtract(ellipsoid(cc, [10, 10, 10]), ellipsoid(cc, [6.6, 6.1, 6.7])), above));
  b.add('head', intersect(shell, above), 'bone');
  b.paint('head', aabb([-0.5, c + 9, -9], [0.5, c + 16, 7]), 'bone', { shade: 3, where: b.isMat('bone') });
  for (const k of [-1, 1]) {
    // out sideways from above the temples, curving forward at the points
    b.add('head', spike([k * 5.4, c + 11, -0.6], [k, 0.28, -0.1], 11, 2.1, 1.7, { bend: [0, 0.1, 0.55], taper: 1.1, tip: 0.3 }), 'bone', { thr: 0.25 });
  }
}

/** Segunda Etapa: two tall bat ears in place of the helmet. */
function batEars(b: ModelBuilder, hd: { front: number; chin: number }): void {
  const c = hd.chin;
  for (const k of [-1, 1]) {
    const base: V3 = [k * 4.6, c + 10.5, -1.6];
    b.add('head', prism([[-2.6, 0], [2.6, 0], [1.4, 9], [0.2, 15], [-1.2, 8]], base, [k * 0.94, 0, -0.34], [k * 0.22, 0.97, 0], 0.7), 'fur', { thr: 0.2 });
    b.paint('head', prism([[-1.4, 1], [1.4, 1], [0.6, 8], [0, 12], [-0.6, 7]], [base[0], base[1], base[2] + 0.6], [k * 0.94, 0, -0.34], [k * 0.22, 0.97, 0], 0.4), 'wing', { shade: 0 });
  }
}

// ---------------------------------------------------------------------------------------------- body

/** Slender torso and arms (skin), the Hollow hole at the sternum. */
function body(b: ModelBuilder, L: Landmarks, form: UlquiorraForm): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  const torso = blend(3,
    box([0, s.chestY - 0.5, -0.3], [cx, 6, cz], { round: 3.2 }),
    box([0, s.waistY, -0.2], [wx, 4.6, wz], { round: 2.8 }),
    box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 3.6, s.hips[1]], { round: 2.4 }),
    capsule([2.4, sy + 1.4, sz - 0.8], [sx - 1.5, sy - 0.2, sz], 2.7, 2.8),
    capsule([-2.4, sy + 1.4, sz - 0.8], [-sx + 1.5, sy - 0.2, sz], 2.7, 2.8),
    sphere([sx, sy - 0.5, sz], 3.1), sphere([-sx, sy - 0.5, sz], 3.1));
  addBands(b, torso, 'skin', [['hips', 36, 45], ['spine', 45, 56], ['chest', 54, 80]]);
  b.add('upperarm.L', blend(1.4, sphere([sx, sy - 0.5, sz], 2.8), capsule([sx, sy - 1, sz], [sx, ey + 1, sz], 2.4, 2.1)), 'skin', { mirror: true });
  b.add('forearm.L', blend(1.2, sphere([sx, ey, sz], 2.1), capsule([sx, ey - 0.5, sz], [sx, wy + 1, sz], 2.1, 1.6)), 'skin', { mirror: true });
  // the hole: at the sternum, wider in the second release, its rim dark
  const hy = s.chestY + 2.6;
  const hr = form === 'segunda' ? 3.3 : 2.3;
  b.carve(['chest', 'spine'], cylinder([0, hy, -14], [0, hy, 14], hr));
  b.paint(['chest', 'spine'], cylinder([0, hy, -14], [0, hy, 14], hr + 0.9), 'void', { where: b.isMat('skin') });
  if (form === 'segunda') {
    // black streaks running down from the hole like spilled blood
    for (const [x, len, w] of [[-2.2, 13, 0.7], [-0.6, 17, 0.6], [1, 11, 0.65], [2.6, 15, 0.55], [-3.4, 8, 0.5]] as [number, number, number][])
      b.paint(['chest', 'spine', 'hips'], intersect(capsule([x, hy - hr + 0.5, 0], [x * 1.12, hy - hr - len, 0], w, w * 0.6), halfSpace([0, 0, 1.5], [0, 0, -1])), 'void', { where: b.isMat('skin') });
  }
  return torso;
}

/** Black boots with a white line round the sole (shared with the Arrancar look). */
function boots(b: ModelBuilder, L: Landmarks): void {
  const [ax, ay, az] = L.ankle;
  b.add('foot.L', capsule([ax, ay + 6, az - 0.4], [ax, ay - 1, az - 0.4], 2.5, 2.4), 'boot', { mirror: true });
  b.add('foot.L', intersect(box([ax, 2.2, az + 3], [2.5, 2.2, 6], { round: 1.5 }), halfSpace([0, 5.2, az + 6.5], [0, 1, 0.6])), 'boot', { mirror: true });
  b.paint('foot.L', aabb([ax - 5, 0, az - 8], [ax + 5, 1, az + 12]), 'line', { mirror: true });
  b.paint('foot.L', capsule([ax - 2.6, 4.2, az + 1], [ax + 2.6, 4.2, az + 1], 0.45), 'line', { mirror: true, where: b.isMat('boot') });
}

/** Sealed: the white coat — closed over the chest with a V at the hole, a high collar, black trim, long tails. */
function sealedCoat(b: ModelBuilder, L: Landmarks, torso: Sdf): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  const hy = s.chestY + 2.6;
  // a narrow V at the throat opening down to the hole
  const v = intersect(prism([[-3.4, 80], [3.4, 80], [0.6, hy - 3.2], [-0.6, hy - 3.2]], [0, 0, 0], [1, 0, 0], [0, 1, 0], 30), halfSpace([0, 0, 1.5], [0, 0, -1]));
  const shell = subtract(offset(torso, 1.2), offset(torso, 0.1), v, cylinder([0, hy, -14], [0, hy, 14], 2.3));
  addBands(b, intersect(shell, aabb([-30, 44, -30], [30, 76, 30])), 'white', [['hips', 36, 45], ['spine', 45, 56], ['chest', 54, 80]]);
  // black trim down the closed front and round the V
  b.paint(['chest', 'spine', 'hips'], intersect(offset(v, 0.9), halfSpace([0, 0, 1.5], [0, 0, -1])), 'trim', { where: b.isMat('white') });
  b.paint(['chest', 'spine', 'hips'], intersect(aabb([-0.45, 36, 0], [0.45, hy - 3, 14]), halfSpace([0, 0, 1.5], [0, 0, -1])), 'trim', { where: b.isMat('white') });
  // the high collar: a tall band standing round the neck, open in front, black inside
  const nz = L.headC[2] - 1.0;
  const collar = fn((x, y, z) => {
    const k = Math.max(0, Math.min(1, (y - (sy - 1)) / 10));
    const r = 4.1 + k * 1.6;
    const rho = Math.hypot(x, (z - nz) * 1.05);
    const top = s.chinY + 6 - Math.max(0, z - nz + 1.5) * 1.2;
    return Math.max(Math.abs(rho - r) - 0.7, y - top, sy - 2 - y, z - (nz + 2.2));
  }, [-9, sy - 3, -9], [9, s.chinY + 7, 8]);
  b.add('chest', collar, 'white');
  b.paint('chest', fn((x, y, z) => Math.hypot(x, (z - nz) * 1.05) - (4.0 + Math.max(0, Math.min(1, (y - (sy - 1)) / 10)) * 1.6), [-9, sy - 1, -9], [9, s.chinY + 7, 8]), 'trim', { where: b.isMat('white') });
  // sleeves: long and fitted, black cuffs
  b.add('upperarm.L', blend(1.4, sphere([sx, sy - 0.5, sz], 3.5), cylinder([sx + 0.2, ey - 0.5, sz], [sx, sy - 0.5, sz], 3.1, 3.3, 1.1)), 'white', { mirror: true });
  b.add('forearm.L', blend(1.2, sphere([sx, ey, sz], 3.1), cylinder([sx, wy + 0.4, sz], [sx, ey + 1, sz], 3.1, 3.0, 1)), 'white', { mirror: true });
  b.paint('forearm.L', cylinder([sx, wy - 0.5, sz], [sx, wy + 1.6, sz], 3.6), 'trim', { mirror: true, where: b.isMat('white') });
  b.carve('forearm.L', cylinder([sx, wy - 1, sz], [sx, wy + 1.2, sz], 2, 2), { mirror: true });
  b.add('forearm.L', capsule([sx, wy + 4, sz], [sx, wy - 0.5, sz], 1.6), 'skin', { mirror: true, only: 'empty' });
  b.paint('forearm.L', torus([sx, ey, sz], 3.2, 0.5), 'white', { shade: 3, mirror: true });
  // sash, hakama
  const o = { black: 'white', collar: 'white', skin: 'skin', obi: 'sash', hemR: 8 };
  hakama(b, L, o);
  obi(b, L, o);
  // the long tails: white with a black hem
  const tails = coatSkirt(b, L, { mat: 'white', lining: 'trim', yTop: s.waistY - 3, yHem: 13, r0: 9.4, r1: 11.8, openFront: 30, res: ULQUIORRA_RES });
  b.paint(['coat.F.L.2', 'coat.S.L.2', 'coat.B.L.2', 'coat.B.R.2', 'coat.S.R.2', 'coat.F.R.2'], aabb([-20, 12, -20], [20, 15.2, 20]), 'trim', { where: b.isMat('white') });
  return tails;
}

/** Murciélago: the coat closes into a fitted robe that flares to the ankles. */
function robeSkirt(b: ModelBuilder, L: Landmarks, torso: Sdf): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  const hy = s.chestY + 2.6;
  const shell = subtract(offset(torso, 1.1), offset(torso, 0.1), cylinder([0, hy, -14], [0, hy, 14], 2.3));
  addBands(b, intersect(shell, aabb([-30, 36, -30], [30, 74, 30])), 'white', [['hips', 36, 45], ['spine', 45, 56], ['chest', 54, 80]]);
  // closed high at the top: a short stand collar
  const nz = L.headC[2] - 1.0;
  b.add('chest', fn((x, y, z) => Math.max(Math.abs(Math.hypot(x, z - nz) - 3.9) - 0.7, y - (s.chinY - 0.5), sy - 1 - y), [-7, sy - 2, -7], [7, s.chinY + 1, 6]), 'white');
  b.add('upperarm.L', blend(1.4, sphere([sx, sy - 0.5, sz], 3.4), cylinder([sx + 0.2, ey - 0.5, sz], [sx, sy - 0.5, sz], 3.0, 3.2, 1.1)), 'white', { mirror: true });
  b.add('forearm.L', blend(1.2, sphere([sx, ey, sz], 3.0), cylinder([sx, wy + 0.4, sz], [sx, ey + 1, sz], 3.6, 2.9, 1)), 'white', { mirror: true });
  b.carve('forearm.L', cylinder([sx, wy - 1, sz], [sx, wy + 1.2, sz], 2.4, 2.4), { mirror: true });
  b.add('forearm.L', capsule([sx, wy + 4, sz], [sx, wy - 0.5, sz], 1.6), 'skin', { mirror: true, only: 'empty' });
  b.add('spine', box([0, s.waistY - 2.5, -0.2], [s.waist[0] + 1.6, 1.4, s.waist[1] + 1.6], { round: 1.4 }), 'sash');
  // legs inside the robe (white trousers)
  const [hx, hipY] = s.hip;
  b.add('thigh.L', capsule([hx, hipY, 0], [hx, L.knee[1], 0], 3.4, 2.9), 'white', { mirror: true });
  b.add('shin.L', capsule([hx, L.knee[1], 0], [hx, L.ankle[1] + 3, 0], 2.8, 2.4), 'white', { mirror: true });
  return coatSkirt(b, L, { mat: 'white', lining: 'trim', yTop: s.waistY - 4, yHem: 3, r0: 8.8, r1: 14.5, openFront: 10, res: ULQUIORRA_RES });
}

/** Segunda Etapa: black fur on the waist, legs and forearms; claws, talons; the long thin tail. */
function segunda(b: ModelBuilder, L: Landmarks): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const R = ULQUIORRA_RES;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  const [hx, hipY] = s.hip;
  const ky = L.knee[1], ay = L.ankle[1];
  // fur: the hips and the waist up to a ragged line across the belly
  const furLine = (x: number, z: number) => s.waistY - 1 + Math.abs(Math.sin(x * 0.9 + z * 0.5)) * 2.2;
  b.add('hips', fn((x, y, z) => {
    const rx = s.hips[0] + 1.4, rz = s.hips[1] + 1.4;
    return Math.max(Math.hypot(x / rx, (z + 0.3) / rz) * Math.min(rx, rz) - Math.min(rx, rz), y - furLine(x, z), 34 - y);
  }, [-12, 33, -10], [12, 54, 10]), 'fur');
  b.add('spine', fn((x, y, z) => {
    const rx = s.waist[0] + 1.2, rz = s.waist[1] + 1.2;
    return Math.max(Math.hypot(x / rx, (z + 0.2) / rz) * Math.min(rx, rz) - Math.min(rx, rz), y - furLine(x, z), 45 - y);
  }, [-12, 44, -10], [12, 54, 10]), 'fur');
  // legs: furred, ending in black taloned feet
  b.add('thigh.L', blend(1.5, sphere([hx, hipY, 0], 4.2), capsule([hx, hipY, 0], [hx, ky + 1, 0], 3.9, 3.1)), 'fur', { mirror: true });
  b.add('shin.L', blend(1.2, sphere([hx, ky, 0], 3.1), capsule([hx, ky, 0], [hx, ay + 2, 0], 3, 2.2)), 'fur', { mirror: true });
  b.add('foot.L', blend(1.2, capsule([hx, ay + 3, -0.4], [hx, ay - 1.5, 0.3], 2.3, 2.5), box([hx, 1.8, 3.4], [2.6, 1.8, 4.4], { round: 1.5 })), 'fur', { mirror: true });
  for (let i = 0; i < 3; i++) b.add('foot.L', spike([hx - 1.5 + i * 1.5, 1.4, 7.4], [0, -0.4, 1], 3.6, 0.7, 0.5, { tip: 0.2 }), 'claw', { mirror: true, thr: 0.3 });
  b.add('foot.L', spike([hx, 1.6, -1], [0, -0.3, -1], 2.6, 0.7, 0.5, { tip: 0.2 }), 'claw', { mirror: true, thr: 0.3 });
  // fur strands: vertical grooves
  b.paint(['thigh.L', 'thigh.R', 'shin.L', 'shin.R', 'hips', 'spine'], fn((x, y, z) => Math.abs(((x * 1.3 + z * 0.9 + 60) % 2.2) - 1.1) - 0.32, [-20, 0, -20], [20, 60, 20]), 'fur', { shade: 4, where: b.isMat('fur') });
  // ragged fur fringe at the knees and round the belly line
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    b.add('thigh.L', spike([hx + Math.sin(a) * 3.2, ky + 2, Math.cos(a) * 3.2], [Math.sin(a) * 0.4, -1, Math.cos(a) * 0.4], 2.6, 1, 0.6, { tip: 0.2 }), 'fur', { mirror: true, thr: 0.3 });
  }
  // arms: black fur from above the elbow to the hands, clawed fingers
  b.add('upperarm.L', capsule([sx, ey + 5, sz], [sx, ey, sz], 2.7, 2.6), 'fur', { mirror: true });
  b.add('forearm.L', blend(1.2, sphere([sx, ey, sz], 2.6), capsule([sx, ey - 0.5, sz], [sx, wy + 0.5, sz], 2.5, 2.1)), 'fur', { mirror: true });
  for (const bone of ['palm.L', 'fist.L']) b.paint(bone, aabb([L.wrist[0] - 4, L.wrist[1] - 12, -6], [L.wrist[0] + 4, L.wrist[1] + 2, 6]), 'fur', { mirror: true, where: b.isMat('skin') });
  for (const bone of ['palm.L', 'fist.L']) {
    const tipY = bone === 'palm.L' ? wy - s.hand - 0.5 : wy - 7;
    for (let i = 0; i < 4; i++) {
      const z = L.wrist[2] - 1.1 + i * 1.3;
      b.add(bone, spike([L.wrist[0] - 0.4, tipY + 2.4, z], [-0.25, -1, 0.15], 4.5, 0.6, 0.45, { tip: 0.12, bend: [0.3, 0, 0.1] }), 'claw', { mirror: true, thr: 0.3 });
    }
  }
  // the tail: a long thin whip from the base of the spine, fur-edged, on an eight-bone spring chain
  const springs: SpringDef[] = [];
  let prev = 'hips';
  let p: V3 = [0, s.hipsY - 2, -s.hips[1] - 1.2];
  const seg = 9;
  for (let i = 0; i < 8; i++) {
    const name = `tail.${i + 1}`;
    b.bone(name, prev, p);
    const dir: V3 = i < 2 ? [0, -0.7, -0.72] : i < 5 ? [0, -0.2, -0.98] : [0, 0.25, -0.97];
    const q: V3 = [p[0] + dir[0] * seg, p[1] + dir[1] * seg, p[2] + dir[2] * seg];
    b.add(name, capsule(p, q, Math.max(0.65, 1.3 - i * 0.08), Math.max(0.6, 1.3 - (i + 1) * 0.08)), 'fur', { thr: 0.3 });
    springs.push({ bone: name, tail: [(q[0] - p[0]) / R, (q[1] - p[1]) / R, (q[2] - p[2]) / R], stiffness: 55 - i * 5, damping: 4, gravity: 4, limit: 45 + i * 5, radius: 0.035 });
    prev = name;
    p = q;
  }
  b.add('tail.8', spike(p, [0, 0.25, -0.97], 4, 1.4, 0.4, { tip: 0.2 }), 'fur', { thr: 0.3 });
  const colliders: ColliderDef[] = [
    { bone: 'thigh.L', offset: [0, -0.15, 0], radius: 0.1 },
    { bone: 'thigh.R', offset: [0, -0.15, 0], radius: 0.1 },
  ];
  return { springs, colliders };
}

// ---------------------------------------------------------------------------------------------- wings

/**
 * Bat wings from the upper back: an arm spar out to the wing wrist, four finger spars fanning from it,
 * the membrane stretched between them with a scalloped trailing edge. Two bones a side (wing / wing.2,
 * the fingers) so the wings can fold, spread and beat. Built half-spread, angled back.
 */
function wings(b: ModelBuilder, L: Landmarks): SpringDef[] {
  const s = L.spec;
  for (const k of [1, -1]) {
    const side = k > 0 ? 'L' : 'R';
    const root: V3 = [k * 2.2, s.chestY + 3, -s.chest[1] - 1.2];
    // the wing plane: out (and back), and up
    const U: V3 = [k * 0.9, 0, -0.436];
    const V: V3 = [0, 1, 0];
    const at = (u: number, v: number): V3 => [root[0] + U[0] * u, root[1] + v, root[2] + U[2] * u];
    const wrist: V2 = [30, 22];
    const tips: V2[] = [[64, 34], [74, 10], [64, -18], [42, -36]];
    b.bone(`wing.${side}`, 'chest', root);
    b.bone(`wing.${side}.2`, `wing.${side}`, at(wrist[0], wrist[1]));
    // membrane: inner panel (body → wrist → first two fingers) and outer panels, scalloped between tips
    const scallop = (a: V2, c: V2, depth: number, n = 4): V2[] => {
      const out: V2[] = [];
      for (let i = 1; i < n; i++) {
        const t = i / n;
        const mx = a[0] + (c[0] - a[0]) * t, my = a[1] + (c[1] - a[1]) * t;
        // pull toward the wrist
        const sag = Math.sin(Math.PI * t) * depth;
        const dx = wrist[0] - mx, dy = wrist[1] - my, dl = Math.hypot(dx, dy) || 1;
        out.push([mx + (dx / dl) * sag, my + (dy / dl) * sag]);
      }
      return out;
    };
    const inner: V2[] = [[0, 4], [wrist[0] * 0.5, wrist[1] * 0.6], wrist, tips[3], ...scallop(tips[3], [8, -22], 5), [8, -22], [0, -6]];
    const outer: V2[] = [wrist, tips[0], ...scallop(tips[0], tips[1], 5), tips[1], ...scallop(tips[1], tips[2], 6), tips[2], ...scallop(tips[2], tips[3], 6), tips[3]];
    // the wing is cupped: membrane and spars bow back together, deepest mid-wing
    const N: V3 = [U[1] * V[2] - U[2] * V[1], U[2] * V[0] - U[0] * V[2], U[0] * V[1] - U[1] * V[0]];
    const cup = (u: number, v: number) => -2.8 * Math.sin(Math.PI * Math.min(1, Math.hypot(u - wrist[0] * 0.6, v - wrist[1] * 0.3) / 50)) * Math.min(1, Math.max(0, u) / 12);
    const atD = (u: number, v: number): V3 => {
      const o = cup(u, v);
      return [root[0] + U[0] * u + N[0] * o, root[1] + v + N[1] * o, root[2] + U[2] * u + N[2] * o];
    };
    const billow = (poly: V2[]): Sdf => {
      const base = prism(poly, root, U, V, 0.55);
      return fn((x, y, z) => {
        const px = x - root[0], py = y - root[1], pz = z - root[2];
        const off = cup(px * U[0] + py * U[1] + pz * U[2], px * V[0] + py * V[1] + pz * V[2]);
        return base.d(x - N[0] * off, y - N[1] * off, z - N[2] * off);
      }, [base.min[0] - 4, base.min[1] - 4, base.min[2] - 4], [base.max[0] + 4, base.max[1] + 4, base.max[2] + 4]);
    };
    const spar = (a: V2, c: V2, r0: number, r1: number): Sdf => {
      const pts: V3[] = [], radii: number[] = [];
      for (let i = 0; i <= 6; i++) {
        const t = i / 6;
        pts.push(atD(a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t));
        radii.push(r0 + (r1 - r0) * t);
      }
      return tube(pts, radii);
    };
    b.add(`wing.${side}`, billow(inner), 'wing', { thr: 0.25 });
    b.add(`wing.${side}.2`, billow(outer), 'wing', { thr: 0.25 });
    // spars: the arm to the wrist, the fingers from the wrist, a claw at the wrist
    b.add(`wing.${side}`, spar([0, 2], [wrist[0] * 0.5, wrist[1] * 0.62], 1.5, 1.3), 'spar', { thr: 0.3 });
    b.add(`wing.${side}`, spar([wrist[0] * 0.5, wrist[1] * 0.62], wrist, 1.3, 1.2), 'spar', { thr: 0.3 });
    for (const t of tips) b.add(`wing.${side}.2`, spar(wrist, t, 1.0, 0.45), 'spar', { thr: 0.3 });
    b.add(`wing.${side}.2`, spike(atD(wrist[0], wrist[1]), [U[0] * 0.3, 1, U[2] * 0.3], 4, 0.9, 0.7, { tip: 0.2 }), 'claw', { thr: 0.3 });
    // membrane veins
    b.paint([`wing.${side}`, `wing.${side}.2`], fn((x, y, z) => Math.abs(((y * 0.8 + (x * U[0] + z * U[2]) * 0.3 + 80) % 4.2) - 2.1) - 0.3, [-90, 0, -60], [90, 120, 10]), 'wing', { shade: 0, where: b.isMat('wing') });
  }
  return [];
}

// ---------------------------------------------------------------------------------------------- weapons

/**
 * Murciélago, sealed: a plain katana, green-wrapped hilt, a guard shaped like an eye (two curved arms
 * off its long sides and a bar through both). Local frame: origin at the grip, blade along +Z, edge −Y.
 */
function buildMurcielago(): VoxelModel {
  const b = new ModelBuilder('murcielago', 48);
  b.mat('steel', ['#F0F3F6', '#D3D7DB', '#A9AFB6'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#F3F3F0'], { rough: 0.12, metal: 0.8 });
  b.mat('wrap', ['#3E9A63', '#2E7D4F', '#1F5C3A'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#DDEBE2']);
  b.mat('guard', ['#C6CBD0', '#9EA3A8', '#6F757B'], { base: 1, rough: 0.35, metal: 0.75 });
  b.bone('root', null, [0, 0, 0]);
  const z0 = 6.5, zEnd = 41, zTip = 44;
  const curve = (z: number) => ((z - z0) / (zTip - z0)) ** 2 * 1.4;
  b.add('root', fn((x, y, z) => {
    if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
    const c = curve(z);
    const top = 0.85 + c, bot = -1.0 + c + Math.max(0, z - zEnd) * 0.6;
    return Math.max(Math.abs(x) - 0.5, y - top, bot - y, z0 - z, z - zTip);
  }, [-2, -3, z0 - 1], [2, 5, zTip + 1]), 'steel', { thr: 0.3 });
  b.paint('root', fn((x, y, z) => y - (-0.6 + curve(z) + Math.max(0, z - zEnd) * 0.6), [-2, -3, 0], [2, 5, zTip + 1]), 'edge');
  // the eye guard: an almond ring across the blade axis with a bar through it
  const gz = 5.4;
  b.add('root', fn((x, y, z) => {
    const r = Math.hypot(x / 3.4, y / 1.7);
    return Math.max(Math.abs(r - 1) * 1.7 - 0.38, Math.abs(z - gz) - 0.55);
  }, [-4.5, -3, gz - 1.5], [4.5, 3, gz + 1.5]), 'guard');
  b.add('root', box([0, 0, gz], [3.8, 0.35, 0.5]), 'guard');
  b.add('root', box([0, -0.05, 6.3], [0.85, 1.25, 0.5]), 'guard');
  b.add('root', box([0, 0, -0.6], [1.1, 1.25, 5.6], { round: 0.5 }), 'wrap');
  b.paint('root', fn((x, y, z) => Math.abs(((Math.abs(y) + z) % 2.6 + 2.6) % 2.6 - 1.3) - 0.45, [-2, -2, -6.5], [2, 2, 5]), 'ray', { where: b.isMat('wrap') });
  b.add('root', box([0, 0, -6.6], [1.2, 1.35, 0.5], { round: 0.3 }), 'guard');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** Green lacquered sheath; with the sword in it the green hilt shows. Origin at the mouth, along +Z. */
function buildSheath(withSword: boolean): VoxelModel {
  const b = new ModelBuilder(withSword ? 'murcielago-sheath-full' : 'murcielago-sheath', 48);
  b.mat('lacquer', ['#3E9A63', '#2E7D4F', '#1F5C3A', '#174A2E'], { base: 1, rough: 0.3, shadeK: 0.8 });
  b.mat('wrap', ['#3E9A63', '#2E7D4F', '#1F5C3A'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#DDEBE2']);
  b.mat('guard', ['#C6CBD0', '#9EA3A8', '#6F757B'], { base: 1, rough: 0.35, metal: 0.75 });
  b.bone('root', null, [0, 0, 0]);
  const curve = (z: number) => (z / 39) ** 2 * 1.4;
  b.add('root', fn((x, y, z) => Math.max(Math.hypot(x, (y - curve(Math.max(0, z))) / 1.6) - 1, -z, z - 38.5), [-2, -3, -1], [2, 5, 40]), 'lacquer');
  b.add('root', box([0, 0, 0.4], [1.3, 1.9, 0.6], { round: 0.3 }), 'guard');
  b.add('root', box([0, curve(38), 38.2], [1.15, 1.8, 0.6], { round: 0.4 }), 'guard');
  if (withSword) {
    b.add('root', fn((x, y, z) => Math.max(Math.abs(Math.hypot(x / 3.4, y / 1.7) - 1) * 1.7 - 0.38, Math.abs(z + 1.1) - 0.55), [-4.5, -3, -3], [4.5, 3, 1]), 'guard');
    b.add('root', box([0, 0, -1.1], [3.8, 0.35, 0.5]), 'guard');
    b.add('root', box([0, 0, -7.4], [1.1, 1.25, 5.6], { round: 0.5 }), 'wrap');
    b.paint('root', fn((x, y, z) => Math.abs(((Math.abs(y) + z) % 2.6 + 2.6) % 2.6 - 1.3) - 0.45, [-2, -2, -13.5], [2, 2, -1.6]), 'ray', { where: b.isMat('wrap') });
    b.add('root', box([0, 0, -13.4], [1.2, 1.35, 0.5], { round: 0.3 }), 'guard');
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * Luz de la Luna: a javelin of green light about 2 m long; Lanza del Relámpago: the same with energy
 * flaring off both ends like flames, so it reads as an arrow. Held at the middle: origin at the grip,
 * the point along +Z. Glowing palette (the bloom does the rest).
 */
function buildSpear(lanza: boolean): VoxelModel {
  const b = new ModelBuilder(lanza ? 'lanza-del-relampago' : 'luz-de-la-luna', 32);
  b.mat('core', ['#E6FFE9', '#C9FFD4'], { base: 0, rough: 0.2, glow: 2.2 });
  b.mat('body', ['#8CFFA9', '#5CFF8A', '#38D46A'], { base: 1, rough: 0.3, glow: 1.6 });
  b.mat('flame', ['#D8FF7A', '#9CFF5A', '#3CFF7A'], { base: 1, rough: 0.3, glow: 2.4 });
  b.bone('root', null, [0, 0, 0]);
  const L0 = -28, L1 = 36;
  b.add('root', capsule([0, 0, L0], [0, 0, L1 - 6], 0.9, 0.9), 'body');
  b.add('root', capsule([0, 0, L0 + 1], [0, 0, L1 - 7], 0.45, 0.45), 'core');
  // the head: a long leaf blade
  b.add('root', fn((x, y, z) => {
    if (z < L1 - 9 || z > L1 + 0.5) return 1;
    const u = (z - (L1 - 9)) / 9.5;
    const w = 2.2 * Math.sin(Math.PI * Math.min(1, u * 1.3)) * (1 - u * 0.6) + 0.2;
    return Math.max(Math.abs(y) - w, Math.abs(x) - 0.6);
  }, [-2, -4, L1 - 10], [2, 4, L1 + 1]), 'body', { thr: 0.3 });
  b.paint('root', aabb([-0.6, -0.6, L1 - 10], [0.6, 0.6, L1 + 1]), 'core');
  if (lanza) {
    // flames streaming off both ends: forward around the point, back off the butt
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const dx = Math.cos(a), dy = Math.sin(a);
      b.add('root', spike([dx * 1.2, dy * 1.2, L1 - 8], [dx * 0.45, dy * 0.45, 1], 9 + (i % 2) * 3, 1.1, 0.8, { bend: [-dx * 0.2, -dy * 0.2, 0], tip: 0.2 }), 'flame', { thr: 0.3 });
      b.add('root', spike([dx * 1.1, dy * 1.1, L0 + 2], [dx * 0.6, dy * 0.6, -1], 10 + (i % 3) * 2, 1.2, 0.8, { bend: [dx * 0.3, dy * 0.3, 0], tip: 0.2 }), 'flame', { thr: 0.3 });
    }
  } else b.add('root', sphere([0, 0, L0], 1.3), 'body');
  b.lint(2);
  return b.build();
}
