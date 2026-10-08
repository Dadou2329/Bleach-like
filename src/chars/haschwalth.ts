// Jugram Haschwalth (docs/roster/H1-vandenreich-leaders.md, "Jugram Haschwalth"; kit docs/kits/haschwalth.md). Brief:
// 189 cm → 91 vox at 48/m (head 12.6, ≈ 1/7.2); tall, thin, young and handsome, composed to the point of blankness.
// Silhouette keys: the sheet of pale blond hair falling past the waist, the calf-length trench coat with a strip of
// dark-green fur from the left collar down the front, the order's hooded cloak behind him, the angular gold shield on
// the left forearm, the long-gripped cruciform broadsword. Face: light green-blue eyes under blond lashes, the bangs
// parted off-centre to his right, one strand hanging between the eyes over the left. Outfit: the white coat, a green
// belt with a gold buckle, white trousers and shoes. Forms: 'day'; 'night' (The Almighty: crimson irises, three
// pupils to an eye); 'vessel' (hAschwAlth [anime]: black tears down the face, the hands and boots coated black, a
// black sash crossed twice over the chest and trailing behind, the eyes blue again). Props: the Blade of Judgment
// (a black two-hand grip, a gold cross-guard and pommel, a long double-edged blade with a fuller) and the Freund
// Schild (a gold Zeichen whose bottom limb runs far past the others, the spaces between the limbs filled with pale
// solidified reishi). (verify) eye hue (green vs blue); the cloak's back emblem.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, intersect, offset, prism, smoothPath, sphere, subtract, tube, type Sdf, type V3 } from '../models/sdf';
import { addBands, coatSkirt, faceLegend, hands, head, humanoidSkeleton, type HumanoidSpec, type Landmarks } from './humanoid';
import { ZEICHEN_11, badge, frontOf, hairSheet, longCape } from './sternritter';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

export const HASCHWALTH_RES = 48;
export type HaschwalthForm = 'day' | 'night' | 'vessel';

/** Tall and thin: long limbs, a slim chest. */
const SPEC: HumanoidSpec = {
  H: 91,
  chinY: 78,
  head: { w: 10, d: 11, h: 12.6 },
  neckR: 2.5,
  shoulder: [9.6, 72.2, -0.5],
  upperArm: 15.8,
  foreArm: 14.2,
  hand: 9.6,
  armR: 2.4,
  hipsY: 49,
  hip: [4.4, 45.5, 0],
  kneeY: 25,
  ankleY: 4.8,
  chest: [8.0, 4.9],
  waist: [6.4, 4.1],
  hips: [7.0, 4.5],
  chestY: 66,
  waistY: 55.5,
  foot: { len: 12.8, w: 5, heel: 3.2 },
};

function palette(b: ModelBuilder, form: HaschwalthForm): void {
  b.mat('skin', ['#F7E6D8', '#F2E0D0', '#E2CCBA', '#CDB4A0', '#B19983'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#F3E9C2', '#EBD9A0', '#DCC88C', '#CBB672', '#A99350'], { base: 1, rough: 0.4, shadeK: 0.85, dither: 0.04 });
  b.mat('brow', ['#BFA45E']);
  b.mat('lid', ['#9C8247']);
  b.mat('sclera', ['#F3F3F0']);
  b.mat('iris', form === 'night' ? ['#C0182A'] : form === 'vessel' ? ['#7FA6C8'] : ['#8CC7B4'], form === 'night' ? { glow: 0.5 } : {});
  b.mat('irisD', [form === 'night' ? '#3A0A0E' : '#2E4A44']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#B88A7E']);
  b.mat('coat', ['#F3F3F0', '#F0F0EB', '#DCDDDB', '#C5C8CE', '#A2A7B0'], { base: 1, rough: 0.75, shadeK: 0.9 });
  b.mat('coatIn', ['#D6D8DC', '#BFC2C9', '#A3A8B2'], { base: 1, rough: 0.8 });
  b.mat('fur', ['#5A7A5E', '#44614A', '#2E4632', '#22362A'], { base: 2, rough: 0.95, shadeK: 0.9, dither: 0.08 });
  b.mat('belt', ['#4F7D5A', '#3D6A48', '#2C4E35'], { base: 1, rough: 0.6 });
  b.mat('gold', ['#EBCB72', '#D4AF45', '#A8862E'], { base: 1, rough: 0.3, metal: 0.75 });
  b.mat('shoe', ['#ECEBE6', '#D6D5D0', '#B9B8B3'], { base: 1, rough: 0.5 });
  b.mat('sole', ['#8E949E']);
  if (form === 'vessel') b.mat('black', ['#24222C', '#17161D', '#0F0E13', '#0B0A0E', '#08080B'], { base: 2, rough: 0.25, metal: 0.3, shadeK: 0.7 });
}

/** Composed, blank: level brows, blond lashes, green-blue eyes; a strand of hair (h) between the eyes. Rows 9 → 0. */
const FACE_DAY = [
  '. . . . . . . . . .',
  '. . . . . . . . . .',
  '. B B B . . B B B .',
  '. L L L . h L L L .',
  '. W I I . h I I W .',
  '. . i * . . * i . .',
  '. . . . . s . . . .',
  '. . . . . . . . . .',
  '. . . . m m . . . .',
  '. . . . . . . . . .',
];
/** The Almighty borrowed: crimson irises, three pupils to an eye */
const FACE_NIGHT = [
  '. . . . . . . . . .',
  '. . . . . . . . . .',
  '. B B B . . B B B .',
  '. L L L . h L L L .',
  '. i I i . h i I i .',
  '. W i W . . W i W .',
  '. . . . . s . . . .',
  '. . . . . . . . . .',
  '. . . . m m . . . .',
  '. . . . . . . . . .',
];
/** hAschwAlth: blue eyes again, black running from them down the cheeks (k) */
const FACE_VESSEL = [
  '. . . . . . . . . .',
  '. . . . . . . . . .',
  '. B B B . . B B B .',
  '. L L L . h L L L .',
  '. W I I . h I I W .',
  '. . k * . . * k . .',
  '. . k . . s . k . .',
  '. . k . . . . k . .',
  '. . . k m m k . . .',
  '. . . . . . . . . .',
];

const assetCache = new Map<HaschwalthForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function haschwalthAsset(form: HaschwalthForm = 'day'): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildHaschwalth(form)));
  return a;
}

/** 'sword' (the Blade of Judgment: origin at the grip, the blade along +Z, edges ±Y) and 'shield' (the Freund Schild). */
export type HaschwalthProp = 'sword' | 'shield';

export function haschwalthProp(kind: HaschwalthProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) propCache.set(kind, (m = kind === 'sword' ? buildSword() : buildShield()));
  return m;
}

/** blade base and tip along the prop's +Z (m) */
export const HW_SWORD_BASE_Z = 5 / 48;
export const HW_SWORD_TIP_Z = 62 / 48;

export function buildHaschwalth(form: HaschwalthForm = 'day'): CharacterAsset {
  const b = new ModelBuilder(`haschwalth-${form}`, HASCHWALTH_RES);
  palette(b, form);
  const s = SPEC;
  const L = humanoidSkeleton(b, s);
  const [wx, wy, wz] = L.wrist;
  const [sx, , sz] = s.shoulder;
  const ey = L.elbow[1];
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.6, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.6, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 5.2, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5.2, wz + 1]);
  // the shield rides the outside of the left forearm, its face outward
  // (the long limb along the forearm's −Z: it hangs straight down when the forearm is carried level before him)
  b.socket('shield', 'forearm.L', [sx + 3.2, (ey + wy) / 2 + 1, sz], [90, 0, 0]);
  b.socket('back', 'chest', [0, s.chestY + 2, -10]);
  b.socket('chest.front', 'chest', [0, s.chestY, 6]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('eye.L', 'head', [2.5, s.chinY + 5.5, hd.front + 0.3]);
  b.socket('eye.R', 'head', [-2.5, s.chinY + 5.5, hd.front + 0.3]);
  const face = form === 'night' ? FACE_NIGHT : form === 'vessel' ? FACE_VESSEL : FACE_DAY;
  b.stamp('head', hd.x0, hd.chin + 9, face, { ...faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), h: { mat: 'hair' }, ...(form === 'vessel' ? { k: { mat: 'black' } } : {}) }, hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  const hair = hairDo(b, L, hd);
  hands(b, L, 'skin');
  const torso = body(b, L);
  const coat = uniform(b, L, torso);
  legs(b, L);
  const extra = form === 'vessel' ? vessel(b, L) : { springs: [], colliders: [] };
  b.autoShade();
  b.lint();
  return {
    model: b.build(),
    springs: [...coat.springs, ...hair.springs, ...extra.springs],
    colliders: [...coat.colliders, ...hair.colliders, ...extra.colliders, { bone: 'thigh.L', offset: [0, -0.1, 0.02], radius: 0.1 }, { bone: 'thigh.R', offset: [0, -0.1, 0.02], radius: 0.1 }],
    warnings: b.warnings,
  };
}

// ---------------------------------------------------------------------------------------------- hair

/**
 * Straight pale hair: a smooth cap, the bangs parted off-centre to his right and falling to the brows, one strand down
 * between the eyes, side locks in front of the ears to the collar, and the sheet down the back past the waist.
 */
function hairDo(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const c = hd.chin, front = hd.front;
  const cz = L.headC[2] - 0.4;
  const hw = s.head.w / 2;
  // the cap: the skull swollen a little, cut away over the face below the hairline
  const cap = subtract(
    intersect(box([0, c + 9.6, cz - 0.4], [hw + 0.9, 5.8, s.head.d / 2 + 1.1], { round: 3.6 }), fn((_x, y) => c + 3 - y, [-12, c - 4, -20], [12, c + 18, 20])),
    fn((x, y, z) => Math.max(z - (front + 3), (front - 2.6) - z, y - (c + 10.4 - Math.abs(x + 2) * 0.22), Math.abs(x) - (hw - 0.4)), [-12, c - 4, front - 4], [12, c + 14, front + 4]),
  );
  b.add('head', cap, 'hair', { only: 'empty', thr: 0.2 });
  // the parting, off-centre to his right
  b.paint('head', box([-2, c + 13.6, front - 2.4], [0.4, 2, 3.2]), 'hair', { shade: 4, where: b.isMat('hair') });
  // the bangs: flat locks from the parting sweeping out to either side, down to the brows
  const bangs: [V3, V3, number][] = [
    [[-2.6, c + 12.4, front - 0.2], [-4.6, c + 8.4, front + 0.4], 1.1],
    [[-1.4, c + 12.6, front - 0.1], [-3.0, c + 8.2, front + 0.5], 1.0],
    [[-0.6, c + 12.6, front], [1.6, c + 8.6, front + 0.5], 1.0],
    [[0.4, c + 12.4, front], [3.6, c + 8.4, front + 0.4], 1.1],
    [[1.6, c + 12.0, front - 0.2], [4.8, c + 8.2, front - 0.2], 1.1],
  ];
  for (const [a, e, r] of bangs) b.add('head', tube(smoothPath([a, [(a[0] + e[0]) / 2, (a[1] + e[1]) / 2 + 0.6, front + 0.7], e], 3), [r, r, r * 0.9, r * 0.8, r * 0.7, r * 0.6, r * 0.5]), 'hair', { thr: 0.3 });
  // the strand between the eyes, over the left
  b.add('head', tube(smoothPath([[0.4, c + 11, front + 0.2], [0.6, c + 8, front + 0.6], [0.5, c + 4.4, front + 0.4]], 3), [0.55, 0.55, 0.5, 0.5, 0.45, 0.45, 0.4]), 'hair', { thr: 0.3 });
  // the side locks: in front of the ears, straight down past the jaw to the collar
  for (const k of [1, -1]) {
    const lock = smoothPath([[k * (hw - 0.2), c + 10.4, front - 1.6], [k * (hw + 0.7), c + 5, front - 2.4], [k * (hw + 0.8), c - 1, front - 3.4], [k * (hw + 0.6), c - 6, front - 4.6]], 4);
    b.add('head', tube(lock, lock.map((_, i) => 1.5 - i * 0.05)), 'hair', { thr: 0.3 });
    const side = smoothPath([[k * (hw + 0.5), c + 9, front - 5], [k * (hw + 0.8), c + 3, front - 6.4], [k * (hw + 0.6), c - 3, front - 8.4]], 4);
    b.add('head', tube(side, side.map((_, i) => 1.8 - i * 0.04)), 'hair', { thr: 0.3 });
  }
  // the eyes stay clear (the strand between them stays)
  b.carve('head', aabb([-4, c + 4, front], [0, c + 7, front + 6]));
  b.carve('head', aabb([1, c + 4, front], [5, c + 7, front + 6]));
  b.paint('head', ellipsoid([0, c + 13.4, cz - 1], [4, 1.4, 4.4]), 'hair', { shade: 0, where: b.isMat('hair') });
  return hairSheet(b, L, hd, { mat: 'hair', res: HASCHWALTH_RES, yBot: s.waistY - 6, width: hw + 1.4, thick: 2.0, out: 3.6 });
}

// ---------------------------------------------------------------------------------------------- body & clothes

function body(b: ModelBuilder, L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const torso = blend(2.6,
    box([0, s.chestY - 0.5, -0.3], [cx, 6.4, cz], { round: 3 }),
    box([0, s.waistY, -0.2], [wx, 5, wz], { round: 2.8 }),
    box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 3.8, s.hips[1]], { round: 2.4 }),
    capsule([2.4, sy + 1.6, sz - 0.8], [sx - 1.4, sy - 0.2, sz], 2.6, 2.7),
    capsule([-2.4, sy + 1.6, sz - 0.8], [-sx + 1.4, sy - 0.2, sz], 2.6, 2.7),
    sphere([sx, sy - 0.5, sz], 3.1), sphere([-sx, sy - 0.5, sz], 3.1));
  addBands(b, offset(torso, 0.7), 'coat', [['hips', 38, 50], ['spine', 50, 61], ['chest', 59, 90]]);
  b.add('neck', capsule([0, s.chinY - 5, L.headC[2] - 0.5], [0, s.chinY + 2, L.headC[2] - 0.5], s.neckR), 'skin');
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(1.4, sphere([sx, sy - 0.5, sz], 3.5), capsule([sx, sy - 1, sz], [sx, ey + 0.5, sz], 3.1, 2.8)), 'coat', { mirror: true });
  b.add('forearm.L', blend(1.2, sphere([sx, ey, sz], 2.9), capsule([sx, ey - 0.5, sz], [sx, wy + 1.8, sz], 2.9, 2.6)), 'coat', { mirror: true });
  b.add('forearm.L', cylinder([sx, wy + 0.4, sz], [sx, wy + 3.6, sz], 3.3), 'coat', { mirror: true });
  b.paint('forearm.L', cylinder([sx, wy + 3.2, sz], [sx, wy + 3.8, sz], 3.6), 'coatIn', { mirror: true, where: b.isMat('coat') });
  b.add('forearm.L', capsule([sx, wy + 3, sz], [sx, wy - 0.4, sz], 2.1), 'skin', { mirror: true, only: 'empty' });
  return torso;
}

/**
 * The Grandmaster's coat: a stand collar, the dark-green fur from the left side of the collar down the front edge to the
 * hem, the green belt and gold buckle, the skirt to the calves; the order's hooded cloak behind, the Zeichen on its back.
 */
function uniform(b: ModelBuilder, L: Landmarks, torso: Sdf): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const nz = L.headC[2] - 0.8;
  // the stand collar
  const collar = fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (y - (sy - 0.5)) / (s.chinY - sy)));
    const r = s.neckR + 1.6 + t * 0.6;
    return Math.max(Math.abs(Math.hypot(x, (z - nz) * 1.08) - r) - 0.7, y - (s.chinY - 0.6), sy - 1 - y);
  }, [-10, sy - 2, nz - 10], [10, s.chinY + 1, nz + 10]);
  b.add('chest', collar, 'coat');
  // the fur: round the left half of the collar and down the coat's front edge (his left of centre)
  const furBand = (y0: number, y1: number) => intersect(subtract(offset(torso, 2.0), offset(torso, 0.5)), aabb([0.6, y0, 0.5], [4.8, y1, 20]));
  addBands(b, furBand(s.hipsY - 4, sy + 2), 'fur', [['hips', s.hipsY - 4, 50], ['spine', 50, 61], ['chest', 59, sy + 2]]);
  b.add('chest', intersect(offset(collar, 0.9), aabb([0.2, sy - 1, nz - 10], [10, s.chinY + 0.4, nz + 10])), 'fur', { thr: 0.2 });
  for (let y = s.hipsY - 3; y < sy + 1; y += 2.2) {
    const x = 2.6 + Math.sin(y * 1.7) * 1.2;
    const bone = y > 59 ? 'chest' : y > 50 ? 'spine' : 'hips';
    const at = frontOf(b, [bone], Math.round(x), Math.round(y));
    if (at) b.add(bone, sphere([x, y, at.z - 0.2], 1.25), 'fur', { thr: 0.2 });
  }
  // the green belt and its gold buckle
  b.add('spine', intersect(subtract(offset(torso, 1.6), offset(torso, 0.3)), aabb([-20, s.waistY - 3.8, -20], [20, s.waistY - 1.4, 20])), 'belt');
  const bz = frontOf(b, ['spine'], -2, Math.round(s.waistY - 2.6))?.z ?? 5;
  b.add('spine', box([-2, s.waistY - 2.6, bz + 0.6], [2, 1.7, 0.7]), 'gold');
  b.paint('spine', box([-2, s.waistY - 2.6, bz + 1.4], [0.9, 0.6, 0.6]), 'gold', { shade: 2 });
  // the seams over the shoulders
  for (const k of [1, -1]) b.paint(['chest', `upperarm.${k > 0 ? 'L' : 'R'}`], capsule([k * 3.6, sy + 2.6, sz - 0.8], [k * (sx + 1.4), sy + 0.6, sz], 0.5), 'coat', { shade: 3, where: b.isMat('coat') });
  // the skirt to the calves; the fur runs down its front-left edge
  const skirt = coatSkirt(b, L, { mat: 'coat', lining: 'coatIn', yTop: s.waistY - 4, yHem: 15, r0: 7.8, r1: 11.4, openFront: 10, overlap: 3, res: HASCHWALTH_RES, depth: 0.85 });
  b.paint(['coat.F.L', 'coat.F.L.2'], fn((x, _y, z) => {
    const a = Math.atan2(x, z + 0.6);
    return Math.max(0.15 - a, a - 0.52);
  }, [-30, 0, -30], [30, 70, 30]), 'fur');
  // the hooded cloak, the Zeichen on its back
  const cape = longCape(b, L, torso, { mat: 'coat', lining: 'coatIn', res: HASCHWALTH_RES, hood: true, yHem: 4, r0: 10.6, r1: 14.2 });
  badge(b, ZEICHEN_11, 0, Math.round(s.chestY + 3), 'coatIn', { back: true, bones: ['chest'], shade: 1 });
  return { springs: [...skirt.springs, ...cape.springs], colliders: [...skirt.colliders, ...cape.colliders] };
}

/** White trousers and white shoes. */
function legs(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [hx, hy, hz] = s.hip;
  const [kx, ky, kz] = L.knee;
  const [ax, ay, az] = L.ankle;
  b.add('hips', box([0, s.hipsY - 0.5, -0.3], [s.hips[0] + 0.6, 3.8, s.hips[1] + 0.6], { round: 2.4 }), 'coat');
  b.add('thigh.L', blend(1.3, sphere([hx, hy, hz], 3.6), capsule([hx, hy, hz], [kx, ky + 1, kz], 3.6, 3.0)), 'coat', { mirror: true });
  b.add('shin.L', blend(1.1, sphere([kx, ky, kz], 3.0), capsule([kx, ky, kz], [ax, ay + 2, az], 2.9, 2.6)), 'coat', { mirror: true });
  const f = s.foot;
  b.add('foot.L', capsule([ax, ay + 1.5, az - 0.4], [ax, ay - 1, az - 0.4], 2.6), 'shoe', { mirror: true });
  b.add('foot.L', intersect(box([ax, 2.2, az + (f.len / 2 - f.heel)], [f.w / 2, 2.2, f.len / 2], { round: 1.4 }), fn((x, y, z) => y - 4.4 + (z - (az + f.len - f.heel - 3)) * 0.65, [-20, -2, -20], [20, 10, 30])), 'shoe', { mirror: true });
  b.paint('foot.L', aabb([ax - 5, 0, az - 8], [ax + 5, 1, az + 16]), 'sole', { mirror: true });
}

/**
 * hAschwAlth: the black over the hands and the boots, and the sash of it wrapped twice across the chest in an X, its
 * ends trailing far behind on spring bones.
 */
function vessel(b: ModelBuilder, L: Landmarks): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy] = s.shoulder;
  b.paint(['hand.L', 'hand.R', 'fist.L', 'fist.R', 'palm.L', 'palm.R'], aabb([-99, -99, -99], [99, 199, 99]), 'black');
  b.paint(['foot.L', 'foot.R'], aabb([-99, -99, -99], [99, 199, 99]), 'black');
  b.paint(['shin.L', 'shin.R'], aabb([-99, -99, -99], [99, L.ankle[1] + 6, 99]), 'black');
  // the X across the chest: two bands, shoulder to opposite hip, standing a voxel proud of the coat
  for (const k of [1, -1]) {
    const band = fn((x, y, z) => {
      const u = (x * k - (y - s.waistY) * 0.42);
      return Math.max(Math.abs(u) - 1.6, z - 30, s.waistY - 6 - y, y - (sy + 2));
    }, [-20, s.waistY - 7, -20], [20, sy + 3, 20]);
    for (const [bone, y0, y1] of [['chest', 59, 90], ['spine', 50, 61]] as const) b.add(bone, intersect(band, subtract(offset(offset(blendTorso(L), 0.7), 1.6), offset(blendTorso(L), 0.7)), aabb([-30, y0, -30], [30, y1, 30])), 'black');
  }
  // the trailing ends: from the small of the back to the knees, two chains of three bones
  const springs: SpringDef[] = [];
  const res = HASCHWALTH_RES;
  for (const k of [1, -1]) {
    const side = k > 0 ? 'L' : 'R';
    const x0 = k * 2.2, z0 = -(s.waist[1] + 3.2);
    const pts: V3[] = [[x0, s.waistY - 2, z0], [x0 + k * 1.2, s.waistY - 14, z0 - 4], [x0 + k * 2, s.waistY - 28, z0 - 7], [x0 + k * 2.4, s.waistY - 40, z0 - 9]];
    for (let i = 0; i < 3; i++) {
      const name = `sash.${side}.${i}`;
      b.bone(name, i === 0 ? 'spine' : `sash.${side}.${i - 1}`, pts[i]);
      b.add(name, fn((x, y, z) => {
        const a = pts[i], c = pts[i + 1];
        const ab: V3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
        const l2 = ab[0] * ab[0] + ab[1] * ab[1] + ab[2] * ab[2];
        const t = Math.max(0, Math.min(1, ((x - a[0]) * ab[0] + (y - a[1]) * ab[1] + (z - a[2]) * ab[2]) / l2));
        const px = a[0] + ab[0] * t, py = a[1] + ab[1] * t, pz = a[2] + ab[2] * t;
        // a flat ribbon: wide across, thin front to back
        return Math.max(Math.abs(x - px) - (2.0 - (i + t) * 0.35), Math.abs(z - pz) - 0.6, Math.abs(y - py) - 0.6 - Math.abs(ab[1]) * 0.5);
      }, [Math.min(pts[i][0], pts[i + 1][0]) - 4, pts[i + 1][1] - 2, Math.min(pts[i][2], pts[i + 1][2]) - 3], [Math.max(pts[i][0], pts[i + 1][0]) + 4, pts[i][1] + 2, Math.max(pts[i][2], pts[i + 1][2]) + 3]), 'black', { thr: 0.25 });
      const a = pts[i], c = pts[i + 1];
      springs.push({ bone: name, tail: [(c[0] - a[0]) / res, (c[1] - a[1]) / res, (c[2] - a[2]) / res], stiffness: 40 - i * 8, damping: 5, gravity: 10 + i * 2, limit: 50 + i * 10, radius: 0.06 });
    }
  }
  return { springs, colliders: [] };
}

/** the torso shape again (for the sash) */
function blendTorso(L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  return blend(2.6,
    box([0, s.chestY - 0.5, -0.3], [cx, 6.4, cz], { round: 3 }),
    box([0, s.waistY, -0.2], [wx, 5, wz], { round: 2.8 }),
    box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 3.8, s.hips[1]], { round: 2.4 }),
    capsule([2.4, sy + 1.6, sz - 0.8], [sx - 1.4, sy - 0.2, sz], 2.6, 2.7),
    capsule([-2.4, sy + 1.6, sz - 0.8], [-sx + 1.4, sy - 0.2, sz], 2.6, 2.7),
    sphere([sx, sy - 0.5, sz], 3.1), sphere([-sx, sy - 0.5, sz], 3.1));
}

// ---------------------------------------------------------------------------------------------- props

/**
 * The Blade of Judgment at 48 vox/m: a black two-hand grip with a gold pommel, a straight gold cross-guard, a long
 * double-edged blade with a fuller down the middle tapering to a point. Origin at the grip, +Z along the blade, the
 * edges ±Y.
 */
function buildSword(): VoxelModel {
  const b = new ModelBuilder('blade-of-judgment', 48);
  b.mat('steel', ['#EEF1F5', '#D8DCE3', '#B9BFC9', '#8E95A1'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('gold', ['#E6C567', '#C9A43E', '#9C7C2A'], { base: 1, rough: 0.3, metal: 0.8 });
  b.mat('grip', ['#2C2C33', '#222228', '#19191D'], { base: 1, rough: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  // the grip, long enough for both hands, wrapped
  b.add('root', cylinder([0, 0, -12], [0, 0, 3], 0.95), 'grip');
  for (let z = -11; z < 3; z += 2) b.paint('root', cylinder([0, 0, z], [0, 0, z + 0.7], 1.2), 'grip', { shade: 0 });
  // the pommel, a gold knob with a ring
  b.add('root', ellipsoid([0, 0, -13.4], [1.5, 1.5, 1.4]), 'gold');
  b.add('root', cylinder([0, 0, -12.4], [0, 0, -11.8], 1.4), 'gold');
  // the cross-guard: a straight gold bar across the edges, flared ends
  b.add('root', box([0, 0, 3.8], [1.0, 7.4, 0.9], { round: 0.4 }), 'gold');
  for (const k of [1, -1]) b.add('root', box([0, k * 7.6, 3.8], [1.2, 0.9, 1.3], { round: 0.4 }), 'gold');
  b.add('root', box([0, 0, 4.6], [1.2, 2.0, 1.0], { round: 0.4 }), 'gold');
  // the blade: double-edged, a fuller, tapering to the point
  b.add('root', fn((x, y, z) => {
    if (z < 5 || z > 63) return 1;
    const t = (z - 5) / 58;
    const w = 2.4 * (1 - Math.max(0, t - 0.82) / 0.18) + 0.4;
    const th = 0.55 + 0.25 * (1 - Math.abs(y) / Math.max(0.5, w));
    return Math.max(Math.abs(y) - w, Math.abs(x) - th, 5 - z, z - 63);
  }, [-2, -4, 4], [2, 4, 64]), 'steel', { thr: 0.25 });
  b.paint('root', box([0, 0, 30], [2, 0.5, 22]), 'steel', { shade: 2 });
  b.paint('root', fn((_x, y, z) => Math.max(1.6 - Math.abs(y), 5 - z, z - 64), [-2, -4, 4], [2, 4, 64]), 'steel', { shade: 0 });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * The Freund Schild at 48 vox/m: a gold Quincy Zeichen — the stroke up, the bar across, the two legs down — whose
 * bottom limb runs far past the others, the spaces between the limbs filled with pale solidified reishi into an
 * angular kite. Origin at the limbs' crossing; the long limb down (−Y), the face outward (+X).
 */
function buildShield(): VoxelModel {
  const b = new ModelBuilder('freund-schild', 48);
  b.mat('gold', ['#F0CE6E', '#E0B44A', '#C3962F', '#A9802A'], { base: 1, rough: 0.3, metal: 0.75, shadeK: 0.8 });
  b.mat('fill', ['#F3EBCB', '#EAD9A6', '#D9C58A'], { base: 1, rough: 0.4, glow: 0.12, dither: 0 });
  b.bone('root', null, [0, 0, 0]);
  // the plate: an angular kite, thin, in the YZ plane
  const kite: [number, number][] = [[0, 15], [12.5, 5.5], [10.5, -12], [0, -39], [-10.5, -12], [-12.5, 5.5]];
  b.add('root', prism(kite.map(([u, v]) => [u, v] as [number, number]), [0, 0, 0], [0, 0, 1], [0, 1, 0], 0.55), 'fill', { thr: 0.2 });
  // the limbs: raised gold bars on the face, and a gold rim
  const bar = (a: [number, number], c: [number, number], r: number): Sdf => capsule([0.9, a[1], a[0]], [0.9, c[1], c[0]], r, r);
  for (const [a, c, r] of [[[0, 0], [0, 14.2], 1.3], [[-12, 5], [12, 5], 1.2], [[0, 0], [-9.6, -11.2], 1.2], [[0, 0], [9.6, -11.2], 1.2], [[0, 0], [0, -38], 1.4]] as [[number, number], [number, number], number][]) b.add('root', bar(a, c, r), 'gold', { thr: 0.2 });
  for (let i = 0; i < kite.length; i++) {
    const a = kite[i], c = kite[(i + 1) % kite.length];
    b.add('root', capsule([0.2, a[1], a[0]], [0.2, c[1], c[0]], 0.85), 'gold', { thr: 0.2 });
  }
  b.add('root', sphere([1.2, 5, 0], 2.0), 'gold');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}
