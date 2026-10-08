// Liltotto Lamperd (docs/roster/H3-sternritter-2.md § Liltotto Lamperd; kit docs/kits/liltotto.md). Brief: 149 cm → 72
// vox at 48/m (head 13, ≈ 1/5.5: petite, child-like, short limbs). Silhouette keys: the chin-length straight blonde bob
// with blunt bangs under the white peaked cap; the closed white uniform jacket over a knee-length white skirt (no long
// coat); dark leggings with a small light cross motif; short white boots; a lollipop stick in the corner of her mouth.
// Face: half-lidded gold eyes under flat brows, a flat little mouth — bored. Trim: gold buttons, the black belt with the
// gold heart case at its back (the folded bow). Forms: 'base'; 'gagael' (Quincy: Vollständig: golden wings of long
// curved fangs fanned off the shoulder blades, fang cuffs at the wrists and ankles; the star halo is a prop); 'sklaverei'
// (the same with a second, lower pair of wings shaped like open jaws; anime-only). Props at 24 vox/m: 'maw.upper' and
// 'maw.lower' (The Glutton: two jaws of her own flesh, jagged teeth on gum, the hinge at the origin, opening along +Z),
// 'trap' parts (a bear trap: 'trap.base', 'trap.jaw'), 'bow' (the Heilig Bogen: bear-trap jaws round a heart grip),
// 'link' (a fang link of Spife's whip); at 48 vox/m 'candy' (the lollipop) and 'halo'.
// (verify) the leggings' pattern (charcoal with light crosses here); the boots (short, white).
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, intersect, prism, smoothPath, sphere, spike, subtract, torus, tube, type Sdf, type V3 } from '../models/sdf';
import { addBands, coatSkirt, faceLegend, hands, head, humanoidSkeleton, type HumanoidSpec, type Landmarks } from './humanoid';
import { backOf, frontOf, peakedCap } from './sternritter';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

/** 72 voxels = 1.49 m */
export const LILTOTTO_RES = 72 / 1.49;
export type LiltottoForm = 'base' | 'gagael' | 'sklaverei';

/** Petite and child-like: a big head, short limbs. */
const SPEC: HumanoidSpec = {
  H: 72,
  chinY: 58.8,
  head: { w: 10, d: 11, h: 13 },
  neckR: 1.7,
  shoulder: [6.2, 54.2, -0.5],
  upperArm: 11,
  foreArm: 9.6,
  hand: 6.6,
  armR: 1.7,
  hipsY: 34.4,
  hip: [3.6, 32.2, 0],
  kneeY: 17.6,
  ankleY: 3.6,
  chest: [5.2, 3.7],
  waist: [4.4, 3.2],
  hips: [5.6, 3.9],
  chestY: 48.4,
  waistY: 41.6,
  foot: { len: 8.6, w: 3.6, heel: 2.2 },
};

function palette(b: ModelBuilder, form: LiltottoForm): void {
  b.mat('skin', ['#FCE8DA', '#F8DCCB', '#ECCBB6', '#DDB49C', '#C49A82'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#FFF1BE', '#F7E09A', '#F0D27C', '#DDB960', '#C9A24E', '#A9843A'], { base: 2, rough: 0.4, shadeK: 0.85, dither: 0.04 });
  b.mat('brow', ['#A9843A']);
  b.mat('lid', ['#3B2A20']);
  b.mat('sclera', ['#F3F3F0']);
  b.mat('iris', ['#E2AE34']);
  b.mat('irisD', ['#8A5E12']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#B0606A']);
  b.mat('coat', ['#F3F3F0', '#F1F2EF', '#DDE0E4', '#C9CCD3', '#A4ABB8'], { base: 1, rough: 0.75, shadeK: 0.9 });
  b.mat('coatIn', ['#D9DCE2', '#C3C8D0', '#A5ACB8'], { base: 1, rough: 0.8 });
  b.mat('legging', ['#3A3A45', '#2E2E38', '#24242C', '#1C1C22'], { base: 1, rough: 0.6, shadeK: 0.85 });
  b.mat('motif', ['#9A9AA8', '#7E7E8C']);
  b.mat('belt', ['#2A2A31', '#1E1E24', '#17171B'], { base: 1, rough: 0.4 });
  b.mat('gold', ['#F4D878', '#E9C24A', '#C79E2E', '#9E7C26'], { base: 1, rough: 0.3, metal: 0.75 });
  b.mat('peak', ['#2A2A31', '#1E1E24', '#17171B'], { base: 1, rough: 0.25, metal: 0.2 });
  b.mat('sole', ['#9AA2AE', '#7F8794', '#666E7A'], { base: 1, rough: 0.6 });
  if (form !== 'base') b.mat('fang', ['#FFF0A6', '#FFD45A', '#FFC83A', '#E59A1E', '#B8740E'], { base: 2, rough: 0.3, glow: 0.55, dither: 0 });
}

/** Flat brows, heavy half-closed lids over dull gold eyes, a flat little mouth: bored. Rows 9 → 0. */
const FACE = [
  '. . . . . . . . . .',
  '. B B B . . B B B .',
  '. . . . . . . . . .',
  '. L L L . . L L L .',
  'L L L L . . L L L L',
  '. W I i . . i I W .',
  '. . I I . . I I . .',
  '. . . . . s . . . .',
  '. . . . m m m . . .',
  '. . . . . . . . . .',
];

const assetCache = new Map<LiltottoForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function liltottoAsset(form: LiltottoForm = 'base'): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildLiltotto(form)));
  return a;
}

export type LiltottoProp = 'maw.upper' | 'maw.lower' | 'trap.base' | 'trap.jaw' | 'bow' | 'link' | 'candy' | 'halo';

export function liltottoProp(kind: LiltottoProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'maw.upper' ? buildJaw(true) : kind === 'maw.lower' ? buildJaw(false) : kind === 'trap.base' ? buildTrapBase() : kind === 'trap.jaw' ? buildTrapJaw()
      : kind === 'bow' ? buildBow() : kind === 'link' ? buildLink() : kind === 'candy' ? buildCandy() : buildHalo();
    propCache.set(kind, m);
  }
  return m;
}

/** the maw at scale 1 (m): from the hinge forward, and the jaws' half-width */
export const MAW_LEN = 26 / 24;
export const MAW_HALF = 13 / 24;
/** the bear trap at scale 1 (m): the jaws' radius */
export const TRAP_R = 12 / 24;
/** one link of Spife's whip along +Z (m) */
export const LINK_LEN = 10 / 24;

export function buildLiltotto(form: LiltottoForm = 'base'): CharacterAsset {
  const b = new ModelBuilder(`liltotto-${form}`, LILTOTTO_RES);
  palette(b, form);
  const s = SPEC;
  const L = humanoidSkeleton(b, s);
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 3.6, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 3.6, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.5, wy - 4.0, wz + 0.9]);
  b.socket('palm.L', 'palm.L', [wx - 0.5, wy - 4.0, wz + 0.9]);
  b.socket('wrist.R', 'forearm.R', [-wx, wy + 1.2, wz]);
  b.socket('wrist.L', 'forearm.L', [wx, wy + 1.2, wz]);
  b.socket('back', 'chest', [0, s.chestY + 2, -7]);
  b.socket('chest.front', 'chest', [0, s.chestY, 5]);
  b.socket('toe.R', 'foot.R', [-L.ankle[0], 2, L.ankle[2] + s.foot.len - s.foot.heel]);
  b.socket('toe.L', 'foot.L', [L.ankle[0], 2, L.ankle[2] + s.foot.len - s.foot.heel]);
  // the heart case at the back of her belt
  b.socket('heart', 'hips', [0, s.waistY - 2.8, -s.waist[1] - 2.2]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5, hd.front]);
  // the maw's hinge: the corners of the mouth, just in front of the face
  b.socket('mouth', 'head', [0, s.chinY + 1.8, hd.front + 0.4]);
  b.socket('candy', 'head', [-1.6, s.chinY + 1.2, hd.front + 0.6], [10, -30, 0]);
  b.socket('eye.L', 'head', [2.5, s.chinY + 4.5, hd.front + 0.3]);
  b.socket('eye.R', 'head', [-2.5, s.chinY + 4.5, hd.front + 0.3]);
  b.socket('halo', 'head', [0, s.chinY + 20, hd.front - s.head.d - 2]);
  for (const k of [-1, 1]) b.carve('head', box([k * 5.4, hd.chin + 1.2, hd.front - 2], [0.9, 2.2, 3], { rot: [0, 0, k * 18] }));
  const hair = bob(b, L, hd);
  peakedCap(b, L, hd, { mat: 'coat', trim: 'coatIn', gold: 'gold', peak: 'peak', lift: 1.0, grow: 0.5 });
  b.paint('head', aabb([-4.5, hd.chin + 0.5, hd.front - 1.5], [4.5, hd.chin + 10, hd.front + 1]), 'skin', { shade: 1, where: b.isMat('skin') });
  b.paint('head', aabb([-5.5, hd.chin - 1, hd.front - 5], [5.5, hd.chin + 3.5, hd.front + 1]), 'skin', { shade: 0, where: b.isMat('skin') });
  b.stamp('head', hd.x0, hd.chin + 9, FACE, faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), hd.front - 1);
  b.voxel('head', 0, hd.chin + 2, hd.front, 'skin', 1);
  hands(b, L, 'coat', 1.0);
  const torso = body(b, L);
  const skirt = uniform(b, L, torso);
  legs(b, L);
  if (form !== 'base') {
    fangWings(b, L);
    cuffs(b, L);
  }
  if (form === 'sklaverei') jawWings(b, L);
  b.autoShade();
  b.lint();
  return {
    model: b.build(),
    springs: [...skirt.springs, ...hair.springs],
    colliders: [...skirt.colliders, ...hair.colliders],
    warnings: b.warnings,
  };
}

// ---------------------------------------------------------------------------------------------- the head

/**
 * The bob: a full cap of straight hair under the cap, blunt bangs cut straight across over the brows, the sides and the
 * back falling straight to the chin and curling in a little at the ends. The back hangs on one short spring bone.
 */
function bob(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const c = hd.chin, front = hd.front;
  const hw = s.head.w / 2;
  const cz = L.headC[2] - 0.5;
  // the bell of the bob: round over the skull, straight down the sides, the ends turned in under the jaw line
  const bell = fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (c + 6 - y) / 6));
    const rx = hw + 1.7 - t * t * 0.9, rz = s.head.d / 2 + 1.5 - t * t * 0.7;
    const top = Math.hypot(x / (hw + 1.7), (y - (c + 6)) / 8.0, (z - cz) / (s.head.d / 2 + 1.5)) - 1;
    const side = y > c + 6 ? top : Math.hypot(x / rx, (z - cz) / rz) - 1;
    return Math.max(side * 4, c - 0.4 + Math.abs(x) * 0.05 - y);
  }, [-10, c - 2, cz - 10], [10, c + 16, cz + 10]);
  // the face left open below the bangs
  const face = fn((x, y, z) => Math.max(z - (front + 4), (front - 3.2) - z, y - (c + 9.6), Math.abs(x) - (hw - 0.4)), [-10, c - 4, front - 5], [10, c + 12, front + 5]);
  // the back of the bob on its own bone (it sways a little)
  const back = L.headC[2] - 1.2;
  b.bone('hair1', 'head', [0, c + 7, back]);
  b.add('head', intersect(subtract(bell, face), fn((_x, _y, z) => back - z, [-12, c - 4, -12], [12, c + 18, 12])), 'hair', { only: 'empty', thr: 0.2 });
  b.add('hair1', intersect(bell, fn((_x, y, z) => Math.max(z - back, y - (c + 9)), [-12, c - 4, -14], [12, c + 12, 2])), 'hair', { thr: 0.2 });
  // the blunt bangs: cut straight across just above the brows
  b.add('head', fn((x, y, z) => Math.max(Math.abs(x) - (hw + 0.6), c + 9.4 - y, y - (c + 12.5), Math.abs(z - (front + 0.1)) - 0.8 - Math.max(0, y - (c + 11)) * 0.5), [-8, c + 8, front - 3], [8, c + 14, front + 3]), 'hair', { thr: 0.2 });
  // the plate clear under the bangs; strands down the bob
  b.carve('head', aabb([-4.6, c + 0.5, front + 0.01], [4.6, c + 9.4, front + 6]));
  b.paint('head', aabb([-4.6, c + 0.5, front - 3], [4.6, c + 9.4, front]), 'skin', { where: b.isMat('hair') });
  const strands = fn((x, y) => (y > c + 12.5 ? 1 : Math.abs(((x + 40) % 2.4) - 1.2) - 0.3), [-12, c - 3, -14], [12, c + 16, 12]);
  b.paint(['head', 'hair1'], strands, 'hair', { shade: 3, where: b.isMat('hair') });
  b.paint(['head', 'hair1'], fn((_x, y) => Math.abs(y - (c + 0.2)) - 0.6, [-12, c - 2, -14], [12, c + 2, 12]), 'hair', { shade: 4, where: b.isMat('hair') });
  b.paint('head', ellipsoid([0, c + 12.6, cz - 1.0], [3.4, 1.2, 3.6]), 'hair', { shade: 0, where: b.isMat('hair') });
  const R = LILTOTTO_RES;
  return {
    springs: [{ bone: 'hair1', tail: [0, -7 / R, -1 / R], stiffness: 60, damping: 6, gravity: 8, limit: 18, radius: 0.06 }],
    colliders: [{ bone: 'neck', offset: [0, 0, -0.02], radius: 0.06 }],
  };
}

// ---------------------------------------------------------------------------------------------- body and clothes

function body(b: ModelBuilder, L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const torso = blend(2.2,
    box([0, s.chestY - 0.5, -0.2], [cx, 5.0, cz], { round: 2.6 }),
    box([0, s.waistY, -0.2], [wx, 3.8, wz], { round: 2.2 }),
    box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 3.2, s.hips[1]], { round: 2.2 }),
    capsule([2, sy + 1.1, sz - 0.6], [sx - 1.2, sy - 0.2, sz], 2.0, 2.1),
    capsule([-2, sy + 1.1, sz - 0.6], [-sx + 1.2, sy - 0.2, sz], 2.0, 2.1),
    sphere([sx, sy - 0.5, sz], 2.4), sphere([-sx, sy - 0.5, sz], 2.4));
  addBands(b, blend(1, torso, box([0, s.chestY - 0.5, 0.6], [cx - 0.4, 4.2, cz - 0.2], { round: 2.4 })), 'coat', [['hips', 28, 39], ['spine', 39, 45.5], ['chest', 45.5, 80]]);
  b.add('neck', capsule([0, s.chinY - 5, L.headC[2] - 0.5], [0, s.chinY + 2, L.headC[2] - 0.5], s.neckR), 'skin');
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(1.2, sphere([sx, sy - 0.5, sz], 2.6), capsule([sx, sy - 1, sz], [sx, ey + 0.5, sz], 2.2, 2.0)), 'coat', { mirror: true });
  b.add('forearm.L', blend(1.1, sphere([sx, ey, sz], 2.0), capsule([sx, ey - 0.5, sz], [sx, wy + 1.4, sz], 2.0, 1.9)), 'coat', { mirror: true });
  b.add('forearm.L', cylinder([sx, wy + 0.2, sz], [sx, wy + 2.4, sz], 2.3), 'coat', { mirror: true });
  b.paint('forearm.L', cylinder([sx, wy + 2.0, sz], [sx, wy + 2.6, sz], 2.6), 'coatIn', { mirror: true, where: b.isMat('coat') });
  return torso;
}

/**
 * The jacket closed to a stand collar with two rows of gold buttons, the black belt and the gold heart case at its
 * back, and the knee-length white skirt flaring a little.
 */
function uniform(b: ModelBuilder, L: Landmarks, torso: Sdf): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const nz = L.headC[2] - 0.8;
  const collar = fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (y - (sy - 0.5)) / (s.chinY - sy)));
    const r = s.neckR + 1.3 + t * 0.5;
    return Math.max(Math.abs(Math.hypot(x, (z - nz) * 1.08) - r) - 0.6, y - (s.chinY - 1.4), sy - 1 - y);
  }, [-8, sy - 2, nz - 8], [8, s.chinY + 1, nz + 8]);
  b.add('chest', collar, 'coat');
  b.paint('chest', aabb([-0.5, sy - 1, nz + 1], [0.5, s.chinY, nz + 8]), 'coatIn', { where: b.isMat('coat') });
  // the double row of buttons
  for (const x of [-2, 2]) for (const y of [s.chestY + 3, s.chestY - 1, s.waistY + 2]) {
    const at = frontOf(b, ['chest', 'spine'], x, Math.round(y));
    if (at) b.voxel(at.bone, x, Math.round(y), at.z + 1, 'gold', 0);
  }
  for (const k of [1, -1]) b.paint(['chest', `upperarm.${k > 0 ? 'L' : 'R'}`], capsule([k * 3, sy + 2, sz - 0.6], [k * (sx + 1.1), sy + 0.4, sz], 0.45), 'coat', { shade: 3, where: b.isMat('coat') });
  // the belt, and the gold heart case at the back of it
  b.add('spine', intersect(fn((x, y, z) => Math.max(torso.d(x, y, z) - 1.2, 0.2 - torso.d(x, y, z)), [-12, s.waistY - 4, -10], [12, s.waistY - 1, 10]), aabb([-20, s.waistY - 3.4, -20], [20, s.waistY - 1.8, 20])), 'belt');
  const heart: [number, number][] = [[0, -2.2], [2.1, 0.1], [2.2, 1.2], [1.4, 1.9], [0.5, 1.6], [0, 1.0], [-0.5, 1.6], [-1.4, 1.9], [-2.2, 1.2], [-2.1, 0.1]];
  const hz = backOf(b, ['spine'], 0, Math.round(s.waistY - 2.6))?.z ?? -4;
  b.add('spine', prism(heart.map(([u, v]) => [u * 1.1, v * 1.1]), [0, s.waistY - 2.8, hz - 0.6], [-1, 0, 0], [0, 1, 0], 0.7, 0.25), 'gold', { thr: 0.2 });
  // the skirt
  return coatSkirt(b, L, { mat: 'coat', lining: 'coatIn', yTop: s.waistY - 3, yHem: L.knee[1] + 2.5, r0: 6.0, r1: 9.0, openFront: 0, overlap: 4, res: LILTOTTO_RES, depth: 0.85 });
}

/** Dark leggings with a scatter of small light crosses; short white boots. */
function legs(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [hx, hy, hz] = s.hip;
  const [kx, ky, kz] = L.knee;
  const [ax, ay, az] = L.ankle;
  b.add('hips', box([0, s.hipsY - 0.5, -0.3], [s.hips[0] + 0.3, 3.0, s.hips[1] + 0.3], { round: 2.0 }), 'coat');
  b.add('thigh.L', blend(1.2, sphere([hx, hy, hz], 2.9), capsule([hx, hy, hz], [kx, ky + 1, kz], 2.9, 2.2)), 'legging', { mirror: true });
  b.add('shin.L', blend(1, sphere([kx, ky, kz], 2.1), capsule([kx, ky, kz], [ax, ay + 2, az], 2.1, 1.7)), 'legging', { mirror: true });
  // the motif: small crosses in a loose grid down the fronts and sides
  const cross = fn((x, y, z) => {
    const v = ((y + 40) % 4.2) - 2.1;
    const k = Math.floor((y + 40) / 4.2) % 2 === 0 ? 0 : 1.8;
    const uu = ((x + 40 + k) % 3.6) - 1.8;
    return Math.min(Math.max(Math.abs(uu) - 0.5, Math.abs(v) - 1.2), Math.max(Math.abs(uu) - 1.2, Math.abs(v) - 0.5)) + (z < -1.5 ? 2 : 0);
  }, [-20, 0, -20], [20, 60, 20]);
  b.paint(['thigh.L', 'thigh.R', 'shin.L', 'shin.R'], cross, 'motif', { where: b.isMat('legging') });
  // the boots to mid-calf
  const top = ay + 7.5;
  b.add('shin.L', capsule([ax, top, az], [ax, ay + 0.6, az], 2.3, 2.15), 'coat', { mirror: true });
  b.paint('shin.L', cylinder([ax, top - 0.4, az], [ax, top + 0.6, az], 2.7), 'coatIn', { mirror: true, where: b.isMat('coat') });
  const f = s.foot;
  b.add('foot.L', capsule([ax, ay + 1.2, az - 0.3], [ax, ay - 0.8, az - 0.3], 2.1), 'coat', { mirror: true });
  b.add('foot.L', intersect(box([ax, 1.9, az + (f.len / 2 - f.heel)], [f.w / 2 + 0.2, 1.9, f.len / 2], { round: 1.3 }), fn((x, y, z) => y - 3.8 + (z - (az + f.len - f.heel - 3)) * 0.7, [-20, -2, -20], [20, 10, 30])), 'coat', { mirror: true });
  b.paint('foot.L', aabb([ax - 5, 0, az - 8], [ax + 5, 0.8, az + 14]), 'sole', { mirror: true });
}

// ---------------------------------------------------------------------------------------------- Gagael

/** Gagael's wings: per side a fan of long curved fangs out of the shoulder blade, each on the wing's bone. */
function fangWings(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [, sy] = s.shoulder;
  for (const k of [1, -1]) {
    const side = k > 0 ? 'L' : 'R';
    const root: V3 = [k * 3, sy - 4, -s.chest[1] - 1.6];
    b.bone(`wing.${side}`, 'chest', root);
    // the fangs: from the root out and up, longest in the middle of the fan, curling at the tips
    const fan: [number, number, number][] = [[-24, 22, 2.0], [-6, 32, 2.4], [12, 40, 2.6], [30, 42, 2.6], [48, 36, 2.4], [66, 26, 2.0], [82, 18, 1.7]];
    for (const [el, len, r] of fan) {
      const e = (el * Math.PI) / 180;
      const dir: V3 = [k * Math.cos(e), Math.sin(e), -0.35];
      b.add(`wing.${side}`, spike([root[0], root[1], root[2]], dir, len, r, r * 0.8, { bend: [0, -0.18, -0.05], taper: 1.1, tip: 0.5, side: [0, 0, 1] }), 'fang', { thr: 0.25 });
    }
    // the root knot the fangs grow from
    b.add(`wing.${side}`, sphere(root, 3.0), 'fang');
  }
}

/** Fang cuffs at the wrists and ankles: gold rings ringed with short teeth (Spork, Spife and Golden Crunch fly off them). */
function cuffs(b: ModelBuilder, L: Landmarks): void {
  const [sx, , sz] = L.spec.shoulder;
  const wy = L.wrist[1];
  const [ax, ay, az] = L.ankle;
  const ring = (bone: string, c: V3, r: number) => {
    b.add(bone, torus(c, r, 0.9, [0, 0, 0]), 'fang', { mirror: true, thr: 0.2 });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const p: V3 = [c[0] + Math.cos(a) * (r + 0.4), c[1], c[2] + Math.sin(a) * (r + 0.4)];
      b.add(bone, spike(p, [Math.cos(a), i % 2 ? 0.5 : -0.5, Math.sin(a)], 2.2, 0.8, 0.8, { tip: 0.3 }), 'fang', { mirror: true, thr: 0.25 });
    }
  };
  ring('forearm.L', [sx, wy + 3.4, sz], 2.5);
  ring('shin.L', [ax, ay + 8.6, az], 2.6);
}

/** Sklaverei's second pair: lower on the back, wings shaped like open jaws — an arc above, an arc below, teeth between. */
function jawWings(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  for (const k of [1, -1]) {
    const side = k > 0 ? 'L' : 'R';
    const root: V3 = [k * 3, s.waistY + 1, -s.waist[1] - 2];
    b.bone(`jaw.${side}`, 'spine', root);
    const P = (a: number, h: number): V3 => [root[0] + k * a * 0.95, root[1] + h, root[2] - a * 0.3];
    for (const sgn of [1, -1]) {
      const arc = smoothPath([P(0, 0), P(8, sgn * 9), P(20, sgn * 12), P(32, sgn * 8), P(38, sgn * 1.5)], 4);
      b.add(`jaw.${side}`, tube(arc, arc.map((_, i) => 2.2 - i * 0.08)), 'fang', { thr: 0.2 });
      for (let i = 3; i < arc.length - 2; i += 2) {
        const p = arc[i];
        b.add(`jaw.${side}`, spike(p, [0, -sgn, 0], 3.2, 0.9, 0.9, { tip: 0.3 }), 'fang', { thr: 0.25 });
      }
    }
  }
}

// ---------------------------------------------------------------------------------------------- props

function mawMats(b: ModelBuilder): void {
  b.mat('skin', ['#FCE8DA', '#F8DCCB', '#ECCBB6', '#DDB49C'], { base: 1, rough: 0.6 });
  b.mat('lip', ['#D8687A', '#C4475A', '#A83A4C'], { base: 1, rough: 0.5 });
  b.mat('gum', ['#E07C8C', '#C4475A'], { base: 1, rough: 0.5 });
  b.mat('maw', ['#7A1A2E', '#5E1222', '#46101C'], { base: 1, rough: 0.6 });
  b.mat('tooth', ['#FFF6E8', '#F1E6D2', '#D9CCB4'], { base: 0, rough: 0.3 });
  b.mat('tongue', ['#E8899A', '#D96A7A', '#B9505F'], { base: 1, rough: 0.5 });
}

/**
 * One jaw of The Glutton at 24 vox/m (the upper, or the lower mirrored): half of a hollow egg of her flesh running
 * forward from the hinge at the origin along +Z, lips round the rim, a row of jagged teeth hanging off the gum, the
 * inside dark; the lower jaw carries the tongue.
 */
function buildJaw(upper: boolean): VoxelModel {
  const b = new ModelBuilder(upper ? 'liltotto-maw-upper' : 'liltotto-maw-lower', 24);
  mawMats(b);
  b.bone('root', null, [0, 0, 0]);
  const sg = upper ? 1 : -1;
  const C: V3 = [0, 0, 13];
  const outer = ellipsoid(C, [13, upper ? 10 : 8, 13]);
  const inner = ellipsoid(C, [11.2, upper ? 8.4 : 6.4, 11.4]);
  const half = fn((_x, y) => -sg * y, [-16, -16, -2], [16, 16, 28]);
  // the shell, open at the hinge end (it joins her face there)
  b.add('root', intersect(subtract(outer, inner), half, fn((_x, _y, z) => 0.5 - z, [-16, -16, -2], [16, 16, 28])), 'skin', { thr: 0.2 });
  // the lips: the rim and the front of the shell
  b.paint('root', fn((x, y, z) => Math.max(Math.abs(y) - 2.2, outer.d(x, y, z) - 0.5), [-16, -4, -2], [16, 4, 28]), 'lip');
  b.paint('root', fn((x, y, z) => Math.max(-sg * y - 0.5, z - 30, 18 - z) + (outer.d(x, y, z) > 0.4 ? 9 : 0), [-16, -16, 12], [16, 16, 28]), 'lip');
  // the inside, and the gum along the rim
  b.paint('root', fn((x, y, z) => inner.d(x, y, z) - 1.2, [-16, -16, -2], [16, 16, 28]), 'maw');
  b.paint('root', fn((x, y, z) => Math.max(Math.abs(y) - 1.4, inner.d(x, y, z) - 1.2), [-16, -4, -2], [16, 4, 28]), 'gum');
  // the teeth: a ragged row round the rim, pointing into the mouth
  for (let i = 0; i <= 18; i++) {
    const a = -Math.PI / 2 + (i / 18) * Math.PI;
    const p: V3 = [Math.sin(a) * 10.4, sg * 0.4, C[2] + Math.cos(a) * 10.6];
    if (p[2] < 2.5) continue;
    const len = 3.2 + ((i * 7) % 5) * 0.55;
    b.add('root', spike(p, [-Math.sin(a) * 0.25, -sg, -Math.cos(a) * 0.25], len, 1.2, 1.0, { tip: 0.35 }), 'tooth', { thr: 0.25 });
  }
  if (!upper) b.add('root', intersect(ellipsoid([0, -4.6, 13], [6.4, 2.6, 9]), fn((_x, y) => y + 6.8, [-8, -8, 2], [8, 0, 24])), 'tongue', { thr: 0.2 });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** A bear trap's base at 24 vox/m: a flat gold ring with the hinge bar across it. */
function buildTrapBase(): VoxelModel {
  const b = new ModelBuilder('liltotto-trap-base', 24);
  b.mat('fang', ['#FFF0A6', '#FFD45A', '#FFC83A', '#E59A1E', '#B8740E'], { base: 2, rough: 0.3, glow: 0.5, dither: 0 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', torus([0, 0, 0], 11, 1.2, [0, 0, 0]), 'fang', { thr: 0.2 });
  b.add('root', capsule([-12, 0, 0], [12, 0, 0], 1.4), 'fang');
  b.add('root', cylinder([0, -0.6, 0], [0, 0.6, 0], 3.2), 'fang');
  b.autoShade({ up: 0.4, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** One jaw of the bear trap at 24 vox/m: a half ring standing on the hinge line (the X axis), teeth along its inner edge. */
function buildTrapJaw(): VoxelModel {
  const b = new ModelBuilder('liltotto-trap-jaw', 24);
  b.mat('fang', ['#FFF0A6', '#FFD45A', '#FFC83A', '#E59A1E', '#B8740E'], { base: 2, rough: 0.3, glow: 0.5, dither: 0 });
  b.bone('root', null, [0, 0, 0]);
  // the half ring lies flat (open) along +Z from the hinge; the trap closes by turning it up about X
  const arc = smoothPath(Array.from({ length: 13 }, (_, i) => {
    const a = (i / 12) * Math.PI;
    return [-Math.cos(a) * 12, 0, Math.sin(a) * 12] as V3;
  }), 3);
  b.add('root', tube(arc, arc.map(() => 1.5)), 'fang', { thr: 0.2 });
  for (let i = 1; i < arc.length - 1; i += 2) {
    const p = arc[i];
    const inward: V3 = [-p[0], 0, -p[2]];
    b.add('root', spike(p, [inward[0] * 0.25, 1, inward[2] * 0.25], 3.4, 1.1, 1.1, { tip: 0.3 }), 'fang', { thr: 0.25 });
  }
  b.autoShade({ up: 0.4, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** The Heilig Bogen at 48 vox/m: a pair of bear-trap jaws (curved, toothed) as the limbs along ±Z round a heart grip. */
function buildBow(): VoxelModel {
  const b = new ModelBuilder('liltotto-bow', 48);
  b.mat('fang', ['#FFF0A6', '#FFD45A', '#FFC83A', '#E59A1E', '#B8740E'], { base: 2, rough: 0.3, glow: 0.6, dither: 0 });
  b.mat('gold', ['#F4D878', '#E9C24A', '#C79E2E'], { base: 1, rough: 0.3, metal: 0.75 });
  b.bone('root', null, [0, 0, 0]);
  const heart: [number, number][] = [[0, -2.2], [2.1, 0.1], [2.2, 1.2], [1.4, 1.9], [0.5, 1.6], [0, 1.0], [-0.5, 1.6], [-1.4, 1.9], [-2.2, 1.2], [-2.1, 0.1]];
  b.add('root', prism(heart.map(([u, v]) => [u * 1.4, v * 1.4]), [0, 0.4, 0], [0, 0, 1], [0, 1, 0], 1.1, 0.25), 'gold', { thr: 0.2 });
  for (const k of [1, -1]) {
    const arc = smoothPath([[0, 0.6, k * 2.2], [0, 3.0, k * 8], [0, 4.0, k * 14], [0, 2.6, k * 19]], 4);
    b.add('root', tube(arc, arc.map((_, i) => 1.5 - i * 0.05)), 'fang', { thr: 0.2 });
    for (let i = 2; i < arc.length - 1; i += 2) b.add('root', spike(arc[i], [0, -1, 0], 2.4, 0.8, 0.8, { tip: 0.3 }), 'fang', { thr: 0.25 });
  }
  b.autoShade({ up: 0.3, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** One link of Spife's whip at 24 vox/m: a flat fang-edged segment along +Z, a hook at each end. */
function buildLink(): VoxelModel {
  const b = new ModelBuilder('liltotto-link', 24);
  b.mat('fang', ['#FFF0A6', '#FFD45A', '#FFC83A', '#E59A1E', '#B8740E'], { base: 2, rough: 0.3, glow: 0.55, dither: 0 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', box([0, 0, 5], [1.6, 0.8, 5], { round: 0.6 }), 'fang');
  for (const k of [1, -1]) for (let z = 1.5; z < 10; z += 2.6) b.add('root', spike([k * 1.4, 0, z], [k, 0, 0.4], 2.4, 0.9, 0.6, { tip: 0.3 }), 'fang', { thr: 0.25 });
  b.autoShade({ up: 0.3, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** The lollipop at 48 vox/m: a white stick along +Z and a swirled pink candy at its end. */
function buildCandy(): VoxelModel {
  const b = new ModelBuilder('liltotto-candy', 48);
  b.mat('stick', ['#F1F1EC', '#DCDCD6']);
  b.mat('candy', ['#F7A8C8', '#F28AB2', '#C0569A'], { base: 1, rough: 0.25 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', cylinder([0, 0, -1], [0, 0, 6], 0.55), 'stick');
  b.add('root', cylinder([0, 0, 6], [0, 0, 7.6], 2.4, 2.4, 0.6), 'candy');
  b.paint('root', fn((x, y) => Math.abs(((Math.atan2(y, x) * 2 + Math.hypot(x, y) * 1.6) % 2.4 + 2.4) % 2.4 - 1.2) - 0.45, [-3, -3, 5], [3, 3, 9]), 'candy', { shade: 2 });
  b.autoShade({ up: 0.3, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** Gagael's halo at 48 vox/m: a gold star outline round a small Zeichen. Faces +Z. */
function buildHalo(): VoxelModel {
  const b = new ModelBuilder('liltotto-halo', 48);
  b.mat('halo', ['#FFF0A6', '#FFD45A', '#FFC83A', '#E59A1E', '#B8740E'], { base: 2, rough: 0.2, glow: 0.9, dither: 0 });
  b.bone('root', null, [0, 0, 0]);
  const R = 12, r = 5;
  const pts: V3[] = [];
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI / 2 + (i / 10) * Math.PI * 2;
    const rr = i % 2 === 0 ? R : r;
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr, 0]);
  }
  for (let i = 0; i < 10; i++) b.add('root', capsule(pts[i], pts[i + 1], 1.0), 'halo', { thr: 0.2 });
  b.add('root', capsule([0, -3.4, 0], [0, 3.4, 0], 0.9), 'halo', { thr: 0.2 });
  b.add('root', capsule([-3, 1, 0], [3, 1, 0], 0.9), 'halo', { thr: 0.2 });
  for (let i = 0; i < 5; i++) b.add('root', capsule([0, 0, 0], [Math.cos(Math.PI / 2 + (i / 5) * Math.PI * 2) * r, Math.sin(Math.PI / 2 + (i / 5) * Math.PI * 2) * r, 0], 0.8), 'halo', { thr: 0.2 });
  b.autoShade({ up: 0.2, open: 1, front: 0 });
  b.lint();
  return b.build();
}
