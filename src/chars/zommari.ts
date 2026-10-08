// Zommari Rureaux — Séptima Espada (docs/roster/E2-espada-2.md §3). Brief: 196 cm, 94 voxels at 48 vox/m, tall,
// broad and muscular, an upright and serene bearing. Silhouette keys: the bald head with a ridge of bone spikes from
// the forehead to the nape (a mohawk of bone), skull earrings, a thick necklace of bone beads, the long white
// mandarin-collar coat to the shins with a small opening at the chest, the black sash, black kung-fu shoes with white
// soles; dark brown skin, golden eyes, full lips; the estigma: three downward triangles on the chin and four thin
// lines ending in dots above each eye (two per eye at this size). Brujería at his left hip: a pink grip and a spiked
// disc guard.
// Brujería (Resurrección): the upper body stays his size, armoured in bone and studded with eyes (a big one in the
// right palm), a skull brace round the neck with one eye, eight slits across the forehead, new marks (two triangles
// under the eyes, five under the mouth); from the waist down a ribbed pink bulb 2.6 m across ringed with one-eyed
// faces like his own. El Embrion closes the bulb over him (a separate prop).
// (verify) the estigma's colour (near-black), the guard's metal (antique gold), the body eyes' irises (gold).
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, sphere, spike, subtract, torus, type Sdf, type V3 } from '../models/sdf';
import { addBands, coatSkirt, faceLegend, hands, head, humanoidSkeleton, type HumanoidSpec, type Landmarks } from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

/** 94 voxels = 1.96 m */
export const ZOMMARI_RES = 94 / 1.96;
/** 'blind': Brujería after El Embrion — every body eye blank white and bleeding */
export type ZommariForm = 'sealed' | 'brujeria' | 'blind';

/** Tall, broad and muscular. */
const SPEC: HumanoidSpec = {
  H: 94,
  chinY: 81,
  head: { w: 12, d: 12, h: 13 },
  neckR: 3.1,
  shoulder: [11.2, 74.5, -0.5],
  upperArm: 16,
  foreArm: 14.5,
  hand: 10,
  armR: 3.1,
  hipsY: 50,
  hip: [5.2, 47, 0],
  kneeY: 26,
  ankleY: 5,
  chest: [10.2, 6.0],
  waist: [7.8, 5.0],
  hips: [8.4, 5.4],
  chestY: 68,
  waistY: 57,
  foot: { len: 13, w: 5.5, heel: 3 },
};

/** the bulb's radius and centre height (voxels): the human torso sits on top of it */
const BULB_R = 54;
const BULB_Y = 48;
/** the bulb is squat, a pumpkin rather than a ball */
const BULB_SQUASH = 0.82;
/** Brujería: the same body raised onto the bulb (its legs are inside it and never shown) */
const LIFT = Math.round(BULB_Y + BULB_R * BULB_SQUASH * 0.9 - (SPEC.waistY - 3));
const SPEC_REL: HumanoidSpec = {
  ...SPEC,
  H: SPEC.H + LIFT,
  chinY: SPEC.chinY + LIFT,
  shoulder: [SPEC.shoulder[0], SPEC.shoulder[1] + LIFT, SPEC.shoulder[2]],
  hipsY: SPEC.hipsY + LIFT,
  hip: [SPEC.hip[0], SPEC.hip[1] + LIFT, 0],
  kneeY: SPEC.kneeY + LIFT,
  ankleY: SPEC.ankleY + LIFT,
  chestY: SPEC.chestY + LIFT,
  waistY: SPEC.waistY + LIFT,
};

function palette(b: ModelBuilder): void {
  b.mat('skin', ['#7A5440', '#6E4A38', '#5E3E2F', '#4E3326', '#34221A'], { base: 3, rough: 0.6, shadeK: 0.95 });
  b.mat('lip', ['#5A3430', '#4A2A26', '#3A201D']);
  b.mat('lid', ['#1E1412']);
  b.mat('sclera', ['#EFEAE0']);
  b.mat('iris', ['#E8B923'], { glow: 0.2 });
  b.mat('pupil', ['#141418']);
  b.mat('mark', ['#16141A']);
  // the forehead lines: a deep brown-black, thin marks on dark skin rather than holes
  b.mat('line', ['#24170F']);
  b.mat('bone', ['#F3F0E8', '#EEE8DA', '#DCD5C5', '#C8C0AE', '#A9A190'], { base: 1, rough: 0.42, shadeK: 1 });
  b.mat('white', ['#F3F3F0', '#ECEBE6', '#DCDAD3', '#C8C6BF', '#A9A8A2'], { base: 1, rough: 0.82, shadeK: 0.9 });
  b.mat('sash', ['#2C2C32', '#1C1C21', '#141418'], { base: 1, rough: 0.8 });
  b.mat('shoe', ['#2E2E33', '#1F1F24', '#141418'], { base: 1, rough: 0.6 });
  b.mat('sole', ['#ECECEC', '#D6D6D2'], { base: 0, rough: 0.7 });
  // Brujería
  b.mat('plate', ['#E2DCCC', '#D5CFBF', '#C2BBA9', '#A9A190'], { base: 1, rough: 0.45, shadeK: 1 });
  b.mat('bulb', ['#F6B6D2', '#EFA2C6', '#E890B8', '#D97CA8', '#C96C98', '#A9547D'], { base: 2, rough: 0.55, shadeK: 0.85 });
  b.mat('rib', ['#C96C98', '#B05A84', '#94486C'], { base: 1, rough: 0.6 });
  b.mat('amor', ['#C78BFF'], { glow: 1.6 });
  b.mat('blood', ['#8E1420', '#6E0E18'], { base: 0, rough: 0.4 });
}

/**
 * Face rows chin+11 → chin (column 0 is his right): two "!" marks above each eye (a line, a gap, a dot), heavy lids
 * over golden eyes, a broad nose, full lips, three dark marks on the chin.
 */
const FACE = [
  '. . . . . . . . . . . .',
  '. . d . d . . d . d . .',
  '. . . . . . . . . . . .',
  '. . l . l . . l . l . .',
  '. . . . . . . . . . . .',
  '. L L L L . . L L L L .',
  '. W I i W . . W i I W .',
  '. . . . . s s . . . . .',
  '. . . . s . . s . . . .',
  '. . . U U U U U U . . .',
  '. . . P P P P P P . . .',
  '. . T T . T T . T T . .',
];

/**
 * Released: eight slits across the forehead in two rows, the same golden eyes, a downward triangle under each eye,
 * five under the mouth (a beard of marks).
 */
const FACE_RELEASED = [
  'S S . S S . . S S . S S',
  '. . . . . . . . . . . .',
  'S S . S S . . S S . S S',
  '. . . . . . . . . . . .',
  '. . . . . . . . . . . .',
  '. L L L L . . L L L L .',
  '. W I i W . . W i I W .',
  '. . T T . s s . T T . .',
  '. . . T . . . . T . . .',
  '. . . U U U U U U . . .',
  '. . . P P P P P P . . .',
  '. T . T . T T . T . T .',
];

const assetCache = new Map<ZommariForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function zommariAsset(form: ZommariForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildZommari(form)));
  return a;
}

/** 'katana' (Brujería drawn), 'sheath' (with the sword in it), 'embrion' (the closed bulb) */
export type ZommariProp = 'katana' | 'sheath' | 'embrion';

export function zommariProp(kind: ZommariProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) propCache.set(kind, (m = kind === 'katana' ? buildKatana() : kind === 'sheath' ? buildSheath() : buildEmbrion()));
  return m;
}

/** blade sample points (prop frame, m) */
export const KATANA_BASE_Z = 5 / 48;
export const KATANA_TIP_Z = 38 / 48;
/** the bulb's radius and centre height (m) */
export const BULB_RADIUS = BULB_R / ZOMMARI_RES;
export const BULB_CENTER_Y = BULB_Y / ZOMMARI_RES;

export function buildZommari(form: ZommariForm = 'sealed'): CharacterAsset {
  const b = new ModelBuilder(`zommari-${form}`, ZOMMARI_RES);
  palette(b);
  const sealed = form === 'sealed';
  const s = sealed ? SPEC : SPEC_REL;
  const L = humanoidSkeleton(b, s);
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.8, wy - 5.5, wz + 1.2]);
  b.socket('palm.L', 'palm.L', [wx - 0.8, wy - 5.5, wz + 1.2]);
  b.socket('hip.L', 'hips', [s.hips[0] + 2.2, s.waistY - 6, 3.4], [-28, 180, -6]);
  b.socket('chest.front', 'chest', [0, s.chestY, s.chest[1] + 1]);
  b.socket('back', 'chest', [0, s.chestY + 2, -s.chest[1] - 1]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 6, hd.front]);
  b.socket('mouth', 'head', [0, s.chinY + 2.5, hd.front + 0.5]);
  b.socket('brow', 'head', [0, s.chinY + 10, hd.front + 0.5]);
  // a broad chin and full lips stand out of the face plate
  b.add('head', box([0, s.chinY + 1.4, hd.front - 2.6], [4.4, 1.6, 2.4], { round: 1 }), 'skin', { only: 'empty' });
  b.stamp('head', hd.x0, hd.chin + 11, sealed ? FACE : FACE_RELEASED, {
    ...faceLegend({ skin: 'skin', brow: 'skin', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'pupil', hi: 'sclera', mouth: 'lip' }),
    U: { mat: 'lip', shade: 1 },
    P: { mat: 'lip' },
    d: { mat: 'line' },
    l: { mat: 'line' },
    T: { mat: 'mark' },
    S: { mat: 'mark' },
  }, hd.front - 1);
  for (let x = -2; x < 2; x++) b.voxel('head', x, hd.chin + 2, hd.front, 'lip', 1);
  crest(b, L, hd);
  earrings(b, L, hd);
  const springs: SpringDef[] = [];
  const colliders: ColliderDef[] = [];
  if (sealed) {
    const c = coat(b, L);
    springs.push(...c.springs);
    colliders.push(...c.colliders);
    necklace(b, L, hd);
    legs(b, L);
    hands(b, L, 'skin', 1.3);
  } else {
    blindEyes = form === 'blind';
    try {
      released(b, L, hd);
    } finally {
      blindEyes = false;
    }
    b.socket('embrion', 'root', [0, (s.H + 2) / 2, 0]);
  }
  b.autoShade();
  b.lint();
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- head

/** The mask: a ridge of bone spikes from the forehead back over the crown to the nape. */
function crest(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): void {
  const s = L.spec;
  const c = hd.chin, hh = s.head.h, back = hd.front - s.head.d;
  // the base ridge along the midline, following the skull
  const skull = blend(1.2,
    box([0, c + 4 + (hh - 4) / 2, (hd.front + back) / 2], [s.head.w / 2, (hh - 4) / 2, s.head.d / 2], { round: 2.2 }),
    ellipsoid([0, c + hh * 0.62, back + 4], [s.head.w / 2 + 0.3, hh * 0.42, 4.5]));
  b.add('head', intersect(offset(skull, 1.1), aabb([-1.4, c + 9, back - 3], [1.4, c + hh + 3, hd.front - 2.5])), 'bone', { only: 'empty' });
  // seven spikes from the top of the forehead back over the crown to the nape, tallest over the crown, leaning back
  const n = 7;
  const cz = (hd.front + back) / 2 - 0.5, cy = c + hh * 0.5;
  const r = s.head.d * 0.5;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    // θ from the vertical: −35° over the forehead to +105° at the nape
    const th = ((-35 + u * 140) * Math.PI) / 180;
    const base: V3 = [0, cy + Math.cos(th) * r * 0.95, cz - Math.sin(th) * r * 0.95];
    const len = 3.2 + Math.sin(u * Math.PI) * 2.8;
    b.add('head', spike(base, [0, Math.cos(th) + 0.1, -Math.sin(th) - 0.45], len, 1.5, 0.9, { side: [1, 0, 0], tip: 0.3 }), 'bone', { thr: 0.25 });
  }
}

/** Skull earrings hanging from both lobes. */
function earrings(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): void {
  const s = L.spec;
  const hw = s.head.w / 2;
  for (const k of [-1, 1]) {
    const x = k * (hw + 0.9), y = hd.chin + 2, z = -0.6;
    b.add('head', capsule([k * (hw + 0.4), hd.chin + 4.2, z], [x, y + 1.6, z], 0.45), 'bone', { thr: 0.2 });
    b.add('head', blend(0.5, sphere([x, y, z], 1.3), box([x, y - 1.0, z + 0.2], [0.8, 0.7, 0.8])), 'bone');
    // the little skull's eye sockets, facing out
    for (const dz of [-0.5, 0.5]) b.paint('head', sphere([x + k * 1.2, y + 0.3, z + dz], 0.5), 'mark', { where: b.isMat('bone') });
  }
}

/** A thick necklace of bone beads round the base of the neck, lying on the coat over the collar, lower at the front. */
function necklace(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): void {
  const s = L.spec;
  const nz = L.headC[2] - 0.8;
  const y0 = s.shoulder[1] - 0.5;
  const n = 18;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const ca = Math.cos(a);
    const rz = ca > 0 ? 8.4 : 6.6;
    const drop = Math.max(0, ca) * 3.4;
    b.add('chest', sphere([Math.sin(a) * 7.4, y0 - drop, nz + ca * rz], 1.35), 'bone');
  }
  void hd;
}

// ---------------------------------------------------------------------------------------------- the coat

function torsoSdf(L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  return blend(3.4,
    box([0, s.chestY - 0.5, -0.3], [cx, 7, cz], { round: 3.6 }),
    box([0, s.waistY, -0.2], [wx, 5, wz], { round: 3.2 }),
    box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 4, s.hips[1]], { round: 2.8 }),
    capsule([2.8, sy + 1.6, sz - 0.8], [sx - 1.8, sy - 0.2, sz], 3.1, 3.2),
    capsule([-2.8, sy + 1.6, sz - 0.8], [-sx + 1.8, sy - 0.2, sz], 3.1, 3.2),
    sphere([sx, sy - 0.5, sz], 3.6), sphere([-sx, sy - 0.5, sz], 3.6));
}

/**
 * The long white coat: closed, a mandarin collar standing round the neck, a small opening at the chest, long sleeves
 * with turned cuffs, the black sash at the waist, the skirt to the shins.
 */
function coat(b: ModelBuilder, L: Landmarks): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  const torso = torsoSdf(L);
  // the skin under the opening
  addBands(b, intersect(torso, aabb([-20, s.chestY - 4, -20], [20, s.chinY, 20])), 'skin', [['chest', s.chestY - 4, s.chinY]]);
  const coatShell = offset(torso, 1.0);
  const opening = ellipsoid([0, s.chestY + 3.2, s.chest[1] + 2], [2.6, 3.6, 4]);
  addBands(b, subtract(intersect(coatShell, aabb([-30, 40, -30], [30, 86, 30])), opening), 'white', [['hips', 40, 50], ['spine', 50, 61], ['chest', 59, 86]]);
  // the mandarin collar: a short upright band round the neck
  const nz = L.headC[2] - 0.9;
  b.add('chest', fn((x, y, z) => {
    const r = 4.4 + Math.max(0, Math.min(1, (sy + 1 - y) / 4)) * 1.4;
    return Math.max(Math.abs(Math.hypot(x, (z - nz) * 1.05) - r) - 0.85, y - (s.chinY - 2.5), sy - 1 - y);
  }, [-9, sy - 3, -9], [9, s.chinY, 8]), 'white');
  // the sash
  b.add('spine', intersect(offset(torso, 1.9), aabb([-30, s.waistY - 3.4, -30], [30, s.waistY + 0.6, 30])), 'sash');
  // sleeves
  b.add('upperarm.L', blend(1.4, sphere([sx, sy - 0.5, sz], 4.0), cylinder([sx + 0.2, ey - 0.5, sz], [sx, sy - 0.5, sz], 3.5, 3.8, 1.1)), 'white', { mirror: true });
  b.add('forearm.L', blend(1.2, sphere([sx, ey, sz], 3.5), cylinder([sx, wy + 0.4, sz], [sx, ey + 1, sz], 3.7, 3.4, 1)), 'white', { mirror: true });
  b.paint('forearm.L', cylinder([sx, wy + 0.3, sz], [sx, wy + 1.8, sz], 4.2), 'white', { shade: 3, mirror: true, where: b.isMat('white') });
  b.carve('forearm.L', cylinder([sx, wy - 1, sz], [sx, wy + 1.2, sz], 2.3, 2.3), { mirror: true });
  b.add('forearm.L', capsule([sx, wy + 3.5, sz], [sx, wy - 0.5, sz], 2.1), 'skin', { mirror: true, only: 'empty' });
  // the skirt: closed, to the shins
  const skirt = coatSkirt(b, L, { mat: 'white', lining: 'white', yTop: s.waistY - 3, yHem: 13, r0: 9.4, r1: 13.6, openFront: 3, res: ZOMMARI_RES });
  b.paint(['coat.F.L.2', 'coat.S.L.2', 'coat.B.L.2', 'coat.B.R.2', 'coat.S.R.2', 'coat.F.R.2'], aabb([-20, 10, -20], [20, 14.6, 20]), 'white', { shade: 3, where: b.isMat('white') });
  return skirt;
}

/** White hakama to the ankles, black cloth shoes with white soles. */
function legs(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [hx, hy, hz] = s.hip;
  const [kx, ky, kz] = L.knee;
  const [ax, ay, az] = L.ankle;
  b.add('thigh.L', blend(1.4, sphere([hx, hy, hz], 4.6), capsule([hx, hy, hz], [kx, ky + 1, kz], 4.4, 3.9)), 'white', { mirror: true });
  b.add('shin.L', blend(1.2, sphere([kx, ky, kz], 3.9), capsule([kx, ky, kz], [ax, ay + 4, az], 3.9, 3.6)), 'white', { mirror: true });
  b.paint('shin.L', torus([ax, ay + 4.4, az], 3.6, 0.5), 'white', { shade: 3, mirror: true, where: b.isMat('white') });
  const f = s.foot;
  const toeZ = az + f.len - f.heel;
  b.add('foot.L', capsule([ax, ay + 4, az - 0.4], [ax, ay - 1, az - 0.4], 2.6, 2.5), 'shoe', { mirror: true });
  b.add('foot.L', intersect(box([ax, 2.2, az + (f.len / 2 - f.heel)], [2.7, 2.2, f.len / 2 + 0.4], { round: 1.5 }), halfSpace([0, 5, toeZ - 3], [0, 1, 0.6])), 'shoe', { mirror: true });
  b.paint('foot.L', aabb([ax - 5, 0, az - 8], [ax + 5, 1, az + 14]), 'sole', { mirror: true });
}

// ---------------------------------------------------------------------------------------------- Brujería

/** Paint an eye on whatever surface lies round p: a dark socket ring, the white, a golden iris, a black pupil, facing n. */
let blindEyes = false;

function eye(b: ModelBuilder, bone: string | string[], p: V3, n: V3, r: number, on: string[] = ['plate', 'bone', 'skin']): void {
  const at = (d: number): V3 => [p[0] + n[0] * d, p[1] + n[1] * d, p[2] + n[2] * d];
  b.paint(bone, ellipsoid(p, [r * 1.45, r * 1.05, r * 1.45]), 'lid', { where: b.isMat(...on) });
  b.paint(bone, ellipsoid(p, [r, r * 0.7, r]), 'sclera', { where: b.isMat('lid') });
  if (blindEyes) {
    // blank white, a streak of blood running down from it
    b.paint(bone, capsule([p[0], p[1] - r * 0.9, p[2] + n[2] * 0.3], [p[0], p[1] - r * 3.2, p[2] + n[2] * 0.3], r * 0.32), 'blood', { where: b.isMat(...on) });
    return;
  }
  b.paint(bone, sphere(at(r * 0.3), r * 0.7), 'iris', { where: b.isMat('sclera') });
  b.paint(bone, sphere(at(r * 0.5), r * 0.34), 'pupil', { where: b.isMat('iris') });
}

/** The released body: bone-armoured, studded with eyes, on the ribbed pink bulb. */
function released(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  const torso = torsoSdf(L);
  // the bone armour over the torso, the skin of the neck under the brace
  addBands(b, intersect(offset(torso, 0.6), aabb([-30, s.waistY - 6, -30], [30, s.chinY - 3, 30])), 'plate', [['spine', s.waistY - 6, s.chestY - 4], ['chest', s.chestY - 4, s.chinY]]);
  // plate seams: a band under the pecs, the sternum line, rows across the belly
  const front = (d: Sdf) => intersect(d, halfSpace([0, 0, 1], [0, 0, -1]));
  for (const k of [-1, 1]) b.paint(['chest', 'spine'], front(capsule([k * 1.2, s.chestY - 3, s.chest[1] + 1], [k * 10, s.chestY - 1.4, s.chest[1]], 0.55)), 'bone', { shade: 4, where: b.isMat('plate') });
  b.paint(['chest', 'spine'], front(capsule([0, s.chestY + 6, s.chest[1] + 1], [0, s.waistY - 5, s.chest[1] + 1], 0.5)), 'bone', { shade: 4, where: b.isMat('plate') });
  for (const y of [s.waistY + 2, s.waistY - 2]) b.paint('spine', front(capsule([-7, y, s.waist[1] + 1], [7, y, s.waist[1] + 1], 0.5)), 'bone', { shade: 4, where: b.isMat('plate') });
  // the skull brace round the neck, one eye at its front
  const nz = L.headC[2] - 0.8;
  b.add('neck', blend(1, torus([0, s.chinY - 3.6, nz], 4.6, 1.8, [0, 0, 0]), ellipsoid([0, s.chinY - 3.2, nz + 4.6], [3.4, 2.8, 1.8])), 'bone');
  eye(b, 'neck', [0, s.chinY - 3.2, nz + 6.3], [0, 0, 1], 1.5, ['bone']);
  // arms: bone-clad, the hands bare
  b.add('upperarm.L', blend(1.6, sphere([sx, sy - 0.5, sz], 4.2), capsule([sx, sy - 1, sz], [sx, ey + 1, sz], 3.8, 3.4)), 'plate', { mirror: true });
  b.add('forearm.L', blend(1.4, sphere([sx, ey, sz], 3.5), capsule([sx, ey - 0.5, sz], [sx, wy + 1.2, sz], 3.5, 2.8)), 'plate', { mirror: true });
  b.paint('upperarm.L', torus([sx, ey + 2, sz], 3.5, 0.5), 'bone', { shade: 4, mirror: true, where: b.isMat('plate') });
  b.paint('forearm.L', torus([sx, wy + 2.2, sz], 3.0, 0.5), 'bone', { shade: 4, mirror: true, where: b.isMat('plate') });
  hands(b, L, 'skin', 1.3);
  // the eye in the right palm (the hand that raises it at a target)
  eye(b, 'palm.R', [-L.wrist[0] - 0.2, wy - 4.6, L.wrist[2] + 2.3], [0, 0, 1], 1.6, ['skin']);
  // eyes over the torso and arms
  const torsoEyes: [number, number][] = [[-6, s.chestY + 3.5], [6, s.chestY + 3.5], [-2.6, s.chestY - 1.5], [2.6, s.chestY - 1.5], [-8, s.chestY - 5], [8, s.chestY - 5], [0, s.waistY + 4], [-5, s.waistY], [5, s.waistY], [-2.6, s.waistY - 4.5], [2.6, s.waistY - 4.5]];
  for (const [x, y] of torsoEyes) {
    const zf = s.chest[1] + 1.2 - Math.abs(x) * 0.18;
    eye(b, y > s.chestY - 4 ? 'chest' : 'spine', [x, y, zf], [x * 0.04, 0, 1], 1.45);
  }
  for (const [x, y] of [[-5, s.chestY + 2], [5, s.chestY + 2], [0, s.waistY + 1], [-6, s.waistY - 3], [6, s.waistY - 3]] as [number, number][])
    eye(b, y > s.chestY - 4 ? 'chest' : 'spine', [x, y, -s.chest[1] - 0.8], [0, 0, -1], 1.4);
  for (const k of [-1, 1]) {
    eye(b, k > 0 ? 'upperarm.L' : 'upperarm.R', [k * (sx + 3.6), sy - 6, sz + 0.6], [k, 0, 0.3], 1.1);
    eye(b, k > 0 ? 'upperarm.L' : 'upperarm.R', [k * (sx + 2.2), sy - 11, sz + 2.6], [k * 0.5, 0, 1], 1.0);
    eye(b, k > 0 ? 'forearm.L' : 'forearm.R', [k * (sx + 3), ey - 5, sz + 1.2], [k, 0, 0.4], 1.0);
    eye(b, k > 0 ? 'forearm.L' : 'forearm.R', [k * (sx + 1.6), ey - 10, sz + 2.6], [k * 0.4, 0, 1], 0.9);
    eye(b, 'chest', [k * (sx + 2.6), sy + 0.8, sz], [k, 0.6, 0], 1.0);
  }
  bulb(b, L);
  void hd;
}

/**
 * The bulb: a ribbed pink sphere (a hollow shell, its ribs running pole to pole), the waist set into its crown and a
 * ring of eight one-eyed faces round its equator.
 */
function bulb(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const R = BULB_R, cy = BULB_Y;
  const ribs = 14;
  const radius = (x: number, z: number) => {
    const a = Math.atan2(x, z);
    return R * (1 + 0.035 * Math.cos(a * ribs));
  };
  const body = fn((x, y, z) => {
    const dy = (y - cy) / BULB_SQUASH;
    const d = Math.hypot(x, dy, z);
    return (d - radius(x, z)) * BULB_SQUASH;
  }, [-R - 4, cy - R - 4, -R - 4], [R + 4, cy + R + 4, R + 4]);
  // only the outer skin is filled (the inside is never seen)
  const skin = fn((x, y, z) => Math.abs(body.d(x, y, z) + 2) - 2, body.min, body.max);
  b.add('hips', skin, 'bulb');
  // the grooves between the ribs
  b.paint('hips', fn((x, y, z) => {
    const a = Math.atan2(x, z);
    // w: 0 in the grooves between the ribs, 0.5 on their crests
    const w = Math.abs(((a * ribs) / (Math.PI * 2) % 1 + 1) % 1 - 0.5);
    return w - 0.06 + 0 * y;
  }, body.min, body.max), 'rib', { where: b.isMat('bulb') });
  // the waist sunk into the crown
  b.add('hips', blend(4, ellipsoid([0, cy + R * BULB_SQUASH * 0.86, 0], [s.hips[0] + 4, 7, s.hips[1] + 4]), box([0, s.hipsY + 1, -0.3], [s.hips[0] + 0.6, 6, s.hips[1] + 0.6], { round: 3 })), 'plate');
  // eight faces round the equator, flat against the bulb: each one his own face with a single great eye, the bone
  // crest over it, a mouth and the marks on the chin
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2;
    const nx = Math.sin(a), nz = Math.cos(a);
    const rr = radius(nx, nz);
    const c: V3 = [nx * (rr - 2), cy + 1, nz * (rr - 2)];
    const out = (d: number, dy: number, side = 0): V3 => [c[0] + nx * d + nz * side, c[1] + dy, c[2] + nz * d - nx * side];
    b.add('hips', ellipsoid(out(0, 0), [8.5, 11, 8.5]), 'skin', { only: 'empty' });
    b.paint('hips', ellipsoid(out(0, 0), [8.8, 11.4, 8.8]), 'skin', { where: b.isMat('bulb', 'rib') });
    eye(b, 'hips', out(8.2, 2.4), [nx, 0, nz], 3.1, ['skin']);
    b.add('hips', ellipsoid(out(8.4, -2.6), [1.5, 2, 1.5]), 'skin');
    b.paint('hips', ellipsoid(out(7.4, -6.2), [4.2, 1.1, 4.2]), 'lip', { where: b.isMat('skin') });
    for (const sd of [-2.6, 0, 2.6]) b.paint('hips', ellipsoid(out(6.2, -9, sd), [0.9, 1.1, 0.9]), 'mark', { where: b.isMat('skin') });
    b.add('hips', spike(out(5, 9), [nx * 0.3, 1, nz * 0.3], 5, 1.6, 1.0, { side: [nz, 0, -nx], tip: 0.3 }), 'bone', { thr: 0.25 });
  }
  void s;
}

// ---------------------------------------------------------------------------------------------- props

/** Brujería sealed: a plain katana, the pink grip, a thick disc guard with spikes round the rim. */
function buildKatana(): VoxelModel {
  const b = new ModelBuilder('brujeria', 48);
  b.mat('steel', ['#E8EBEF', '#D3D7DB', '#B0B7BF', '#8E959E'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#F3F3F0'], { rough: 0.12, metal: 0.8 });
  b.mat('wrap', ['#F2A9CB', '#E78FBB', '#CC6E9E'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#F7D7E6']);
  b.mat('guard', ['#D8B66A', '#B8954A', '#94743A'], { base: 1, rough: 0.35, metal: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  const z0 = 5, zTip = 38, zEnd = zTip - 3;
  const curve = (z: number) => Math.max(0, z - z0) ** 2 * 0.0009;
  b.add('root', fn((x, y, z) => {
    if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
    const cv = curve(z);
    const top = 0.9 + cv, bot = -1.1 + cv + Math.max(0, z - zEnd) * 0.66;
    return Math.max(Math.abs(x) - 0.5, y - top, bot - y, z0 - z, z - zTip);
  }, [-2, -3, z0 - 1], [2, 3, zTip + 1]), 'steel', { thr: 0.3 });
  b.paint('root', fn((_x, y, z) => y - (-0.62 + curve(z) + Math.max(0, z - zEnd) * 0.66), [-2, -3, 0], [2, 3, zTip + 1]), 'edge');
  // the disc guard and its rim of spikes
  b.add('root', cylinder([0, 0, 3.4], [0, 0, 4.6], 3.2, 3.2, 0.4), 'guard');
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    b.add('root', spike([Math.cos(a) * 2.8, Math.sin(a) * 2.8, 4], [Math.cos(a), Math.sin(a), 0], 2.2, 0.8, 0.6, { tip: 0.3 }), 'guard', { thr: 0.25 });
  }
  b.add('root', box([0, 0, -0.6], [1.05, 1.2, 4], { round: 0.5 }), 'wrap');
  b.paint('root', fn((_x, y, z) => Math.abs(((Math.abs(y) + z) % 2.6 + 2.6) % 2.6 - 1.3) - 0.42, [-2, -2, -5], [2, 2, 3.4]), 'ray', { where: b.isMat('wrap') });
  b.add('root', cylinder([0, 0, -4.6], [0, 0, -5.6], 1.15, 1.0, 0.3), 'guard');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** The white sheath with the sword in it: the spiked guard and the pink grip stand out of its mouth. */
function buildSheath(): VoxelModel {
  const b = new ModelBuilder('brujeria-sheath', 48);
  b.mat('lacquer', ['#F3F3F0', '#E4E3DE', '#C9C6BE'], { base: 1, rough: 0.5 });
  b.mat('wrap', ['#F2A9CB', '#E78FBB', '#CC6E9E'], { base: 1, rough: 0.85 });
  b.mat('guard', ['#D8B66A', '#B8954A', '#94743A'], { base: 1, rough: 0.35, metal: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  const Ls = 34;
  b.add('root', box([0, 0, Ls / 2], [0.95, 1.45, Ls / 2], { round: 0.6 }), 'lacquer');
  b.add('root', cylinder([0, 0, -1.2], [0, 0, 0], 3.2, 3.2, 0.4), 'guard');
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    b.add('root', spike([Math.cos(a) * 2.8, Math.sin(a) * 2.8, -0.6], [Math.cos(a), Math.sin(a), 0], 2.2, 0.8, 0.6, { tip: 0.3 }), 'guard', { thr: 0.25 });
  }
  b.add('root', box([0, 0, -5.4], [1.05, 1.2, 4.2], { round: 0.5 }), 'wrap');
  b.add('root', cylinder([0, 0, -9.6], [0, 0, -10.6], 1.15, 1.0, 0.3), 'guard');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** El Embrion: the bulb grown up over him into a closed ribbed sphere, its seam closing at the top (24 vox/m). */
function buildEmbrion(): VoxelModel {
  const res = 24;
  const b = new ModelBuilder('el-embrion', res);
  b.mat('bulb', ['#F6B6D2', '#EFA2C6', '#E890B8', '#D97CA8', '#C96C98', '#A9547D'], { base: 2, rough: 0.55, shadeK: 0.85 });
  b.mat('rib', ['#C96C98', '#B05A84', '#94486C'], { base: 1, rough: 0.6 });
  b.mat('seam', ['#8A3F63'], { rough: 0.6 });
  b.bone('root', null, [0, 0, 0]);
  const R = (SPEC_REL.H / 2 / ZOMMARI_RES) * res * 1.06;
  const ribs = 14;
  const body = fn((x, y, z) => Math.hypot(x, y / 1.05, z) - R * (1 + 0.035 * Math.cos(Math.atan2(x, z) * ribs)), [-R - 3, -R * 1.05 - 3, -R - 3], [R + 3, R * 1.05 + 3, R + 3]);
  b.add('root', fn((x, y, z) => Math.abs(body.d(x, y, z) + 1.5) - 1.5, body.min, body.max), 'bulb');
  b.paint('root', fn((x, _y, z) => {
    const a = Math.atan2(x, z);
    const w = Math.abs(((a * ribs) / (Math.PI * 2) % 1 + 1) % 1 - 0.5);
    return w - 0.06;
  }, body.min, body.max), 'rib', { where: b.isMat('bulb') });
  // the petals' seam twisted shut at the crown
  b.paint('root', fn((x, y, z) => Math.max(Math.abs(Math.atan2(x, z) - y * 0.05) - 0.08, R * 0.55 - y), body.min, body.max), 'seam', { where: b.isMat('bulb', 'rib') });
  b.autoShade();
  b.lint();
  return b.build();
}
