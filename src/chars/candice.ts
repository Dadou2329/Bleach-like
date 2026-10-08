// Candice Catnipp (docs/roster/H3-sternritter-2.md § Candice Catnipp; kit docs/kits/candice.md). Brief: 166 cm → 80
// vox at 48/m (head 12.2, ≈ 1/6.6); tall, long-legged and curvy. Silhouette keys: the very long, voluminous light-green
// hair fanning down her back to the thighs with big locks framing the face, the white peaked cap perched on top of it;
// the white jacket open over the bust and knotted under it, a bare midriff, short shorts, long bare legs and bulky
// white heeled boots to below the knee. Face: zig-zag (lightning-bolt) brows in a darker green, big green eyes under
// long lashes, pink lips in a cocky grin. Trim: gold on the cap, the black belt, the green heart case on her left hip
// (the folded bow). Forms: 'base'; 'barbarriel' (Quincy: Vollständig: six neon-green lightning-bolt wings fanned
// behind the shoulders, three a side, each on its own bone so the kit can pull them off; the star halo is a prop);
// 'sklaverei' (the same, with glowing lightning marks down the thighs, the boots and the chest; anime-only). Props:
// 'sword' (a wing pulled off: a zig-zag bolt with a grip of light; thrown, it is the javelin), 'bow' (the Heilig
// Bogen: zig-zag lightning limbs round a heart grip), 'halo' (a star of jagged lightning round the Zeichen).
// (verify) the heart case's side (her left here); bare hands; full-length sleeves.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, intersect, offset, prism, smoothPath, sphere, subtract, tube, type Sdf, type V3 } from '../models/sdf';
import { addBands, faceLegend, hands, head, humanoidSkeleton, type HumanoidSpec, type Landmarks } from './humanoid';
import { frontOf, peakedCap } from './sternritter';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

/** 80 voxels = 1.66 m */
export const CANDICE_RES = 80 / 1.66;
export type CandiceForm = 'base' | 'barbarriel' | 'sklaverei';

/** Tall, long-legged, curvy. */
const SPEC: HumanoidSpec = {
  H: 80,
  chinY: 67.6,
  head: { w: 10, d: 11, h: 12.2 },
  neckR: 2.0,
  shoulder: [7.7, 62.0, -0.5],
  upperArm: 13,
  foreArm: 11.8,
  hand: 7.6,
  armR: 1.85,
  hipsY: 42,
  hip: [4.6, 39.6, 0],
  kneeY: 22.4,
  ankleY: 4.6,
  chest: [6.2, 4.2],
  waist: [4.5, 3.3],
  hips: [7.0, 4.7],
  chestY: 56.4,
  waistY: 49,
  foot: { len: 10.2, w: 4.0, heel: 2.6 },
};
/** the bust's centre height; the jacket's hem under it (the knot) */
const BUST_Y = SPEC.chestY - 2.0;
const HEM_Y = BUST_Y - 3.6;

function palette(b: ModelBuilder, form: CandiceForm): void {
  b.mat('skin', ['#FCE6D8', '#F6D5C1', '#ECC4AD', '#E2B49C', '#C99880'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#DDF7CF', '#C2EDB4', '#A9E2A0', '#8CCF92', '#6FBF84', '#589E6C'], { base: 2, rough: 0.45, shadeK: 0.85, dither: 0.04 });
  b.mat('brow', ['#356B45']);
  b.mat('lid', ['#22302A']);
  b.mat('sclera', ['#F3F3F0']);
  b.mat('iris', ['#36B86A']);
  b.mat('irisD', ['#1C6A3C']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('lip', ['#E68C98']);
  b.mat('mouth', ['#9A4452']);
  b.mat('teeth', ['#EFEFEA']);
  b.mat('coat', ['#F3F3F0', '#F1F2EF', '#DDE0E4', '#C9CCD3', '#A4ABB8'], { base: 1, rough: 0.75, shadeK: 0.9 });
  b.mat('coatIn', ['#D9DCE2', '#C3C8D0', '#A5ACB8'], { base: 1, rough: 0.8 });
  b.mat('belt', ['#2A2A31', '#1E1E24', '#17171B'], { base: 1, rough: 0.4 });
  b.mat('heart', ['#7DF0B0', '#2FD07A', '#1FA460', '#178A50'], { base: 1, rough: 0.25, metal: 0.3 });
  b.mat('gold', ['#E8C866', '#C9A641', '#9E7C26'], { base: 1, rough: 0.3, metal: 0.75 });
  b.mat('peak', ['#2A2A31', '#1E1E24', '#17171B'], { base: 1, rough: 0.25, metal: 0.2 });
  b.mat('sole', ['#9AA2AE', '#7F8794', '#666E7A'], { base: 1, rough: 0.6 });
  if (form !== 'base') {
    b.mat('wing', ['#E6FFE0', '#B8FFB0', '#5CFF5C', '#2BE86E', '#1A9C4A'], { base: 2, rough: 0.3, glow: 0.9, dither: 0 });
    b.mat('core', ['#F2FFEC', '#D8FFD0'], { base: 0, rough: 0.2, glow: 1.6, dither: 0 });
  }
  if (form === 'sklaverei') b.mat('mark', ['#B8FFB0', '#5CFF5C', '#2BE86E'], { base: 1, rough: 0.3, glow: 1.2, dither: 0 });
}

/** Zig-zag brows (her lightning), big green eyes under long lashes, a cocky grin. Rows 9 → 0. */
const FACE = [
  '. . B B . . B B . .',
  'B B B . . . . B B B',
  '. L L L . . L L L .',
  'L W I I . . I I W L',
  '. W * i . . i * W .',
  '. . I I . . I I . .',
  '. . . . . s . . . .',
  '. . . l T T l . . .',
  '. . . . l l . . . .',
  '. . . . . . . . . .',
];

const assetCache = new Map<CandiceForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function candiceAsset(form: CandiceForm = 'base'): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildCandice(form)));
  return a;
}

/**
 * 'sword' (a wing pulled off: origin at the grip, the blade along +Z, flat to ±X), 'bow' (the Heilig Bogen: origin at
 * the heart grip, the limbs along ±Z, the lobes and the string side toward +Y) and 'halo' (the star, facing +Z).
 */
export type CandiceProp = 'sword' | 'bow' | 'halo';

export function candiceProp(kind: CandiceProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) propCache.set(kind, (m = kind === 'sword' ? buildSword() : kind === 'bow' ? buildBow() : buildHalo()));
  return m;
}

/** the sword's blade along its +Z (m) */
export const SWORD_BASE_Z = 4 / 48;
export const SWORD_TIP_Z = 50 / 48;
/** the bow's limb tips along ±Z (m) and how far they curl toward +Y */
export const BOW_TIP_Z = 19 / 48;
export const BOW_TIP_Y = 5 / 48;
/** the wing bones, top to bottom, her left then her right */
export const WING_BONES = ['wing1.L', 'wing2.L', 'wing3.L', 'wing1.R', 'wing2.R', 'wing3.R'];

export function buildCandice(form: CandiceForm = 'base'): CharacterAsset {
  const b = new ModelBuilder(`candice-${form}`, CANDICE_RES);
  palette(b, form);
  const s = SPEC;
  const L = humanoidSkeleton(b, s);
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.0, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.0, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.5, wy - 4.4, wz + 0.9]);
  b.socket('palm.L', 'palm.L', [wx - 0.5, wy - 4.4, wz + 0.9]);
  // the fingertips: where her bolts leave the hand
  b.socket('tip.R', 'palm.R', [-wx + 0.2, wy - s.hand - 0.4, wz + 0.6]);
  b.socket('tip.L', 'palm.L', [wx - 0.2, wy - s.hand - 0.4, wz + 0.6]);
  b.socket('back', 'chest', [0, s.chestY + 2, -8]);
  b.socket('chest.front', 'chest', [0, BUST_Y + 2, s.chest[1] + 3]);
  b.socket('toe.R', 'foot.R', [-L.ankle[0], 2, L.ankle[2] + s.foot.len - s.foot.heel]);
  b.socket('toe.L', 'foot.L', [L.ankle[0], 2, L.ankle[2] + s.foot.len - s.foot.heel]);
  // the heart case on her left hip
  b.socket('heart', 'hips', [s.hips[0] + 1.6, s.hipsY - 0.6, 0.6]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('eye.L', 'head', [2.5, s.chinY + 5.5, hd.front + 0.3]);
  b.socket('eye.R', 'head', [-2.5, s.chinY + 5.5, hd.front + 0.3]);
  // the star halo floats above and behind the cap
  b.socket('halo', 'head', [0, s.chinY + 22, hd.front - s.head.d - 3]);
  // a soft chin
  for (const k of [-1, 1]) b.carve('head', box([k * 5.4, hd.chin + 1.2, hd.front - 2], [0.9, 2.2, 3], { rot: [0, 0, k * 18] }));
  const hair = hairDo(b, L, hd);
  peakedCap(b, L, hd, { mat: 'coat', trim: 'coatIn', gold: 'gold', peak: 'peak', lift: 2.2, tilt: 7, grow: 0.7 });
  // the face plate at an even shade (the locks beside it would darken its edges), then the face over it
  b.paint('head', aabb([-4.5, hd.chin + 0.5, hd.front - 1.5], [4.5, hd.chin + 10, hd.front + 1]), 'skin', { shade: 1, where: b.isMat('skin') });
  // the jaw's stepped underside lit a shade lighter, so it does not read as a shadow (a beard) seen from below
  b.paint('head', aabb([-5.5, hd.chin - 1, hd.front - 5], [5.5, hd.chin + 3.5, hd.front + 1]), 'skin', { shade: 0, where: b.isMat('skin') });
  const legend = { ...faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth', teeth: 'teeth' }), l: { mat: 'lip' } };
  b.stamp('head', hd.x0, hd.chin + 9, FACE, legend, hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  hands(b, L, 'skin', 1.0);
  const torso = body(b, L);
  jacket(b, L, torso);
  shorts(b, L, torso);
  legs(b, L);
  if (form !== 'base') wings(b, L);
  if (form === 'sklaverei') marks(b, L);
  b.autoShade();
  b.lint();
  return {
    model: b.build(),
    springs: [...hair.springs],
    colliders: [...hair.colliders, { bone: 'thigh.L', offset: [0, -0.09, 0.02], radius: 0.085 }, { bone: 'thigh.R', offset: [0, -0.09, 0.02], radius: 0.085 }],
    warnings: b.warnings,
  };
}

// ---------------------------------------------------------------------------------------------- the hair

/**
 * The mane: a full mass swelling out round the head under the cap, curtain bangs parted in the middle and swept out
 * over the temples (the brows left clear), a big lock framing each side of the face down to the bust, a fullness over
 * the ears joining it to the mass behind, and that mass falling wide and wavy down the back to mid-thigh on three
 * spring bones, the ends curling outward.
 */
function hairDo(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const c = hd.chin, front = hd.front;
  const R = CANDICE_RES;
  const hw = s.head.w / 2;
  const cz = L.headC[2];
  // the volume round the head, the face left open
  const mass = subtract(
    intersect(ellipsoid([0, c + 8.4, cz - 1.2], [hw + 3.2, 6.8, s.head.d / 2 + 2.6]), fn((_x, y) => c + 1.5 - y, [-14, c - 2, -14], [14, c + 18, 14])),
    fn((x, y, z) => Math.max(z - (front + 4), (front - 3) - z, y - (c + 10.2), Math.abs(x) - (hw - 0.4)), [-12, c - 4, front - 5], [12, c + 13, front + 5]),
  );
  b.add('head', mass, 'hair', { only: 'empty', thr: 0.2 });
  // the fullness over the ears, down the sides of the neck to the mass behind
  for (const k of [1, -1]) b.add('head', ellipsoid([k * (hw + 2.0), c + 2.6, cz - 3.0], [3.0, 7.0, 3.8]), 'hair', { only: 'empty', thr: 0.2 });
  // the curtain bangs: parted in the middle, swept out over the temples
  for (const k of [1, -1]) {
    const locks = [
      smoothPath([[k * 0.4, c + 13.2, front - 1.8], [k * 1.9, c + 11.9, front + 0.1], [k * 3.7, c + 11.0, front + 0.2], [k * 5.3, c + 9.4, front - 0.6], [k * 6.0, c + 7.6, front - 1.8]], 4),
      smoothPath([[k * 1.6, c + 13.6, front - 2.4], [k * 3.5, c + 12.3, front - 0.4], [k * 5.3, c + 11.0, front - 0.6], [k * 6.7, c + 8.8, front - 1.9]], 4),
    ];
    for (const p of locks) b.add('head', tube(p, p.map((_, i) => 1.6 - i * 0.04)), 'hair', { thr: 0.3 });
  }
  // the locks framing the face, from the temples down past the jaw to the bust, waving a little
  for (const k of [1, -1]) {
    const lk = smoothPath([[k * (hw + 0.6), c + 10, front - 2.0], [k * (hw + 1.6), c + 5, front - 1.8], [k * (hw + 2.0), c, front - 2.2], [k * (hw + 2.6), c - 5, front - 2.0], [k * (hw + 2.2), c - 9.5, front - 1.4], [k * (hw + 2.8), c - 13.5, front - 1.2]], 4);
    b.add('head', tube(lk, lk.map((_, i) => 2.1 - i * 0.045)), 'hair', { thr: 0.3 });
  }
  // the face plate stays clear between the locks and under the bangs
  b.carve('head', aabb([-4.6, c + 0.5, front + 0.01], [4.6, c + 10.0, front + 6]));
  b.paint('head', aabb([-4.6, c + 0.5, front - 3], [4.6, c + 10.0, front]), 'skin', { where: b.isMat('hair') });
  // the mass down her back: wide and wavy, fuller toward the waist, the hem scalloped into curls
  const backZ = cz - s.head.d / 2;
  const yTop = c + 9, yBot = 29;
  const zc = (y: number) => {
    const t = Math.max(0, Math.min(1, (yTop - y) / (yTop - yBot)));
    return backZ - 0.8 - Math.sin(Math.min(1, t * 2.4) * Math.PI * 0.5) * 2.4 + t * 0.6;
  };
  const sheet = fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (yTop - y) / (yTop - yBot)));
    const w = 8.8 + Math.sin(t * Math.PI) * 2.4 + Math.sin(y * 0.5) * 0.5;
    const bot = yBot + Math.abs(Math.sin(x * 0.7)) * 3.0;
    const wave = Math.sin(y * 0.55 + x * 0.3) * 0.5;
    return Math.max(Math.abs(x) - w, Math.abs(z - zc(y) - wave) - (2.4 - t * 0.5), y - yTop, bot - y);
  }, [-13, yBot - 1, backZ - 13], [13, yTop + 1, backZ + 3]);
  const p1: V3 = [0, c + 5, backZ - 1.2], p2: V3 = [0, s.chestY + 4, zc(s.chestY + 4)], p3: V3 = [0, s.waistY - 4, zc(s.waistY - 4)];
  const bones: [string, string, V3, number, number][] = [['hair1', 'head', p1, p2[1] - 0.5, 200], ['hair2', 'hair1', p2, p3[1] - 0.5, p2[1] + 0.5], ['hair3', 'hair2', p3, -100, p3[1] + 0.5]];
  for (const [name, parent, pivot, y0, y1] of bones) {
    b.bone(name, parent, pivot);
    b.add(name, intersect(sheet, aabb([-24, y0, -30], [24, y1, 10])), 'hair', { thr: 0.25 });
  }
  // the curls at the ends flip outward at the sides
  for (const k of [1, -1]) {
    const curl = smoothPath([[k * 8.6, yBot + 4, zc(yBot + 4)], [k * 10.6, yBot + 0.8, zc(yBot) + 1.0], [k * 11.4, yBot + 2.8, zc(yBot) + 2.0]], 3);
    b.add('hair3', tube(curl, curl.map((_, i) => 1.8 - i * 0.1)), 'hair', { thr: 0.3 });
  }
  // the waves: long diagonal bands of shade down the mass (structure, not noise)
  const bands = (x: number, y: number) => Math.abs(((x + Math.sin(y * 0.22) * 1.4 + 60) % 2.8) - 1.4) - 0.36;
  b.paint(['hair1', 'hair2', 'hair3'], fn((x, y) => bands(x, y), [-14, yBot - 3, backZ - 14], [14, yTop + 2, backZ + 3]), 'hair', { shade: 3, where: b.isMat('hair') });
  b.paint('head', fn((x, y, z) => (z > front - 3 && Math.abs(x) < 4.8 ? 1 : bands(x, y)), [-14, c - 16, -14], [14, c + 17, 14]), 'hair', { shade: 3, where: b.isMat('hair') });
  b.paint('head', ellipsoid([0, c + 14.2, cz - 1.0], [4.2, 1.4, 4.6]), 'hair', { shade: 0, where: b.isMat('hair') });
  const tip: V3 = [0, yBot, zc(yBot)];
  const springs: SpringDef[] = [
    { bone: 'hair1', tail: [(p2[0] - p1[0]) / R, (p2[1] - p1[1]) / R, (p2[2] - p1[2]) / R], stiffness: 44, damping: 5, gravity: 11, limit: 32, radius: 0.09 },
    { bone: 'hair2', tail: [(p3[0] - p2[0]) / R, (p3[1] - p2[1]) / R, (p3[2] - p2[2]) / R], stiffness: 32, damping: 4.5, gravity: 12, limit: 42, radius: 0.09 },
    { bone: 'hair3', tail: [(tip[0] - p3[0]) / R, (tip[1] - p3[1]) / R, (tip[2] - p3[2]) / R], stiffness: 24, damping: 4, gravity: 13, limit: 52, radius: 0.08 },
  ];
  const colliders: ColliderDef[] = [
    { bone: 'chest', offset: [0, 0.06, -0.03], radius: 0.18 },
    { bone: 'spine', offset: [0, 0, -0.02], radius: 0.14 },
    { bone: 'hips', offset: [0, -0.04, -0.03], radius: 0.17 },
  ];
  return { springs, colliders };
}

// ---------------------------------------------------------------------------------------------- body and clothes

/** The bare torso: a narrow waist, the bust, full hips; the neck; the arms under the sleeves. */
function body(b: ModelBuilder, L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const chest = box([0, s.chestY - 0.5, -0.3], [cx, 5.4, cz], { round: 3 });
  const waist = box([0, s.waistY - 0.5, -0.2], [wx, 4.2, wz], { round: 2.6 });
  const hips = box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 3.6, s.hips[1]], { round: 2.6 });
  const traps = [capsule([2.2, sy + 1.3, sz - 0.7], [sx - 1.3, sy - 0.2, sz], 2.3, 2.4), capsule([-2.2, sy + 1.3, sz - 0.7], [-sx + 1.3, sy - 0.2, sz], 2.3, 2.4)];
  const balls = [sphere([sx, sy - 0.5, sz], 2.7), sphere([-sx, sy - 0.5, sz], 2.7)];
  const bust = blend(0.6, ellipsoid([2.9, BUST_Y, cz + 0.5], [3.2, 2.9, 3.0]), ellipsoid([-2.9, BUST_Y, cz + 0.5], [3.2, 2.9, 3.0]));
  const torso = blend(1.0, blend(2.6, chest, waist, hips, ...traps, ...balls), bust);
  addBands(b, torso, 'skin', [['hips', 30, 45.5], ['spine', 45.5, 52.5], ['chest', 52.5, 90]]);
  // the cleavage, the navel
  b.paint('chest', capsule([0, BUST_Y + 1.6, cz + 3.4], [0, BUST_Y - 2.4, cz + 3.0], 0.45), 'skin', { shade: 3, where: b.isMat('skin') });
  const nz = frontOf(b, ['spine'], 0, Math.round(s.waistY - 2))?.z ?? 3;
  b.voxel('spine', 0, Math.round(s.waistY - 2), nz, 'skin', 3);
  b.add('neck', capsule([0, s.chinY - 5, L.headC[2] - 0.5], [0, s.chinY + 2, L.headC[2] - 0.5], s.neckR), 'skin');
  // the arms in their sleeves
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(1.2, sphere([sx, sy - 0.5, sz], 2.9), capsule([sx, sy - 1, sz], [sx, ey + 0.5, sz], 2.45, 2.25)), 'coat', { mirror: true });
  b.add('forearm.L', blend(1.1, sphere([sx, ey, sz], 2.25), capsule([sx, ey - 0.5, sz], [sx, wy + 1.6, sz], 2.2, 2.0)), 'coat', { mirror: true });
  // the cuffs
  b.add('forearm.L', cylinder([sx, wy + 0.2, sz], [sx, wy + 2.6, sz], 2.45), 'coat', { mirror: true });
  b.paint('forearm.L', cylinder([sx, wy + 2.2, sz], [sx, wy + 2.8, sz], 2.8), 'coatIn', { mirror: true, where: b.isMat('coat') });
  return torso;
}

/** half-width of the jacket's opening at height y: the lapels run from the open collar down over the bust to the knot */
function openHalf(y: number): number {
  const pts: [number, number][] = [[HEM_Y, 0.4], [BUST_Y - 2, 1.8], [BUST_Y + 1, 2.5], [SPEC.shoulder[1] - 1, 2.9], [SPEC.chinY - 3.4, 2.4]];
  if (y <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (y <= pts[i][0]) {
    const t = (y - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]);
    return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t;
  }
  return pts[pts.length - 1][1];
}

/**
 * The jacket: high-collared and long-sleeved, worn open and knotted under the bust — the cloth drawn smoothly over
 * the bust (not hugging it), the hem level all round just below it, the lapels a deep V from the open stand collar
 * down to the knot, standing a voxel proud; two gold buttons a side on the chest; the knot and its two short tails.
 */
function jacket(b: ModelBuilder, L: Landmarks, torso: Sdf): void {
  const s = L.spec;
  const [cx, cz] = s.chest;
  const [sx, sy, sz] = s.shoulder;
  const nz = L.headC[2] - 0.8;
  // the cloth's form: the chest and the bust bridged in one smooth swell, the shoulders and the top of the waist
  const cloth = blend(2.6,
    box([0, s.chestY - 0.5, -0.3], [cx + 0.2, 5.4, cz], { round: 3 }),
    ellipsoid([2.9, BUST_Y, cz + 0.5], [3.4, 3.1, 3.2]), ellipsoid([-2.9, BUST_Y, cz + 0.5], [3.4, 3.1, 3.2]),
    capsule([2.2, sy + 1.3, sz - 0.7], [sx - 1.3, sy - 0.2, sz], 2.3, 2.4), capsule([-2.2, sy + 1.3, sz - 0.7], [-sx + 1.3, sy - 0.2, sz], 2.3, 2.4),
    sphere([sx, sy - 0.5, sz], 2.7), sphere([-sx, sy - 0.5, sz], 2.7),
    box([0, s.waistY + 1, -0.2], [s.waist[0], 2.6, s.waist[1]], { round: 2.4 }));
  const hem = (x: number, z: number) => HEM_Y + (z < 0 ? 0.6 : 0) - Math.max(0, 1 - Math.abs(x) / 3.2) * 0.4;
  const shell = fn((x, y, z) => {
    const d = Math.min(cloth.d(x, y, z), torso.d(x, y, z)) - 0.9;
    const cut = Math.max(hem(x, z) - y, y - (sy + 6));
    const open = z > 0.5 && y < s.chinY ? openHalf(y) - Math.abs(x) : -1;
    return Math.max(d, cut, open);
  }, [-16, HEM_Y - 2, -12], [16, sy + 7, 12]);
  addBands(b, shell, 'coat', [['spine', 40, 52.5], ['chest', 52.5, 90]]);
  // the lapels: the opening's edges standing a voxel proud, flat white
  const lapel = fn((x, y, z) => {
    if (z < 1 || y < HEM_Y + 0.3 || y > s.chinY - 3) return 1;
    const e = Math.abs(x) - openHalf(y);
    return Math.max(Math.abs(e - 0.7) - 0.7, cloth.d(x, y, z) - 1.8, 0.2 - cloth.d(x, y, z));
  }, [-12, HEM_Y, 0], [12, s.chinY, 14]);
  addBands(b, lapel, 'coat', [['spine', 40, 52.5], ['chest', 52.5, 90]], { shade: 1 });
  // the hem's piping
  b.paint(['chest', 'spine'], fn((x, y, z) => Math.abs(y - hem(x, z) - 0.4) - 0.45, [-16, HEM_Y - 2, -12], [16, HEM_Y + 3, 12]), 'coatIn', { where: b.isMat('coat') });
  // the stand collar, open at the throat
  const collar = fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (y - (sy - 0.5)) / (s.chinY - sy)));
    const r = s.neckR + 1.5 + t * 0.6;
    const ring = Math.max(Math.abs(Math.hypot(x, (z - nz) * 1.08) - r) - 0.6, y - (s.chinY - 1.0), sy - 1 - y);
    return Math.max(ring, z > nz + 1 ? 2.4 - Math.abs(x) : -1);
  }, [-8, sy - 2, nz - 8], [8, s.chinY + 1, nz + 8]);
  b.add('chest', collar, 'coat');
  // the knot under the bust: the two fronts tied, two short tails
  const zf = (x: number, y: number) => {
    for (let z = 14; z > -14; z -= 0.1) if (torso.d(x, y, z) <= 0) return z;
    return 4;
  };
  const kz = zf(0, HEM_Y) + 1.1;
  b.add('spine', box([0, HEM_Y - 0.1, kz], [1.9, 1.2, 1.1], { round: 0.8 }), 'coat', { thr: 0.2, shade: 1 });
  for (const k of [1, -1]) b.add('spine', box([k * 1.5, HEM_Y - 2.3, kz - 0.2], [0.75, 1.6, 0.5], { rot: [0, 0, k * 22], round: 0.3 }), 'coat', { thr: 0.2, shade: 2 });
  // two gold buttons on each front, on the chest above the bust
  for (const k of [1, -1]) for (const y of [BUST_Y + 4.6, BUST_Y + 2.4]) {
    const x = Math.round(k * (openHalf(y) + 2.4));
    const at = frontOf(b, ['chest'], x, Math.round(y));
    if (at) b.voxel(at.bone, x, Math.round(y), at.z + 1, 'gold', 0);
  }
  // the seams over the shoulders
  for (const k of [1, -1]) b.paint(['chest', `upperarm.${k > 0 ? 'L' : 'R'}`], capsule([k * 3.2, sy + 2.2, sz - 0.6], [k * (sx + 1.3), sy + 0.6, sz], 0.45), 'coat', { shade: 3, where: b.isMat('coat') });
}

/** Short white shorts, the black belt slung on the hips, a gold buckle, the green heart case at her left hip. */
function shorts(b: ModelBuilder, L: Landmarks, torso: Sdf): void {
  const s = L.spec;
  const [hx, hy, hz] = s.hip;
  b.add('hips', intersect(offset(torso, 0.6), aabb([-20, 33, -20], [20, s.hipsY + 1.0, 20])), 'coat');
  b.add('thigh.L', cylinder([hx, hy + 1.2, hz], [hx, hy - 3.9, hz], 3.75, 3.6), 'coat', { mirror: true });
  b.paint('thigh.L', cylinder([hx, hy - 3.9, hz], [hx, hy - 3.2, hz], 4.0), 'coatIn', { mirror: true, where: b.isMat('coat') });
  // the seat's seam and the fly
  b.paint('hips', aabb([-0.5, 33, -20], [0.5, s.hipsY - 1.5, -2]), 'coat', { shade: 3, where: b.isMat('coat') });
  b.paint('hips', aabb([-0.5, s.hipsY - 4.5, 2], [0.5, s.hipsY - 0.6, 20]), 'coat', { shade: 3, where: b.isMat('coat') });
  // the belt
  b.add('hips', intersect(subtract(offset(torso, 1.4), offset(torso, 0.4)), aabb([-20, s.hipsY + 0.2, -20], [20, s.hipsY + 1.7, 20])), 'belt');
  const bz = frontOf(b, ['hips'], 0, Math.round(s.hipsY + 1))?.z ?? 5;
  b.add('hips', box([0, s.hipsY + 0.95, bz + 0.3], [1.3, 1.0, 0.5]), 'gold');
  // the heart case, on its side at her left hip, hung from the belt by a ring
  const heart: [number, number][] = [[0, -2.2], [2.1, 0.1], [2.2, 1.2], [1.4, 1.9], [0.5, 1.6], [0, 1.0], [-0.5, 1.6], [-1.4, 1.9], [-2.2, 1.2], [-2.1, 0.1]];
  const hc: V3 = [s.hips[0] + 1.6, s.hipsY - 1.4, 0.6];
  b.add('hips', prism(heart.map(([u, v]) => [u * 1.15, v * 1.15]), hc, [0, 0, -1], [0, 1, 0], 0.75, 0.25), 'heart', { thr: 0.2 });
  b.add('hips', capsule([hc[0] - 0.4, hc[1] + 2.4, hc[2]], [hc[0] - 0.8, s.hipsY + 0.8, hc[2]], 0.45), 'gold', { thr: 0.2 });
}

/** Long bare legs; bulky white boots to below the knee with a turned-down cuff, a platform sole and a block heel. */
function legs(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [hx, hy, hz] = s.hip;
  const [kx, ky, kz] = L.knee;
  const [ax, ay, az] = L.ankle;
  b.add('thigh.L', blend(1.2, sphere([hx, hy, hz], 3.4), capsule([hx, hy, hz], [kx, ky + 1, kz], 3.4, 2.4)), 'skin', { mirror: true });
  b.add('shin.L', blend(1, sphere([kx, ky, kz], 2.35), capsule([kx, ky, kz], [ax, ay + 2, az], 2.3, 1.7)), 'skin', { mirror: true });
  const top = ky - 1.8;
  b.add('shin.L', capsule([kx, top, kz], [ax, ay + 0.4, az], 3.0, 2.55), 'coat', { mirror: true });
  b.add('shin.L', cylinder([kx, top - 1.4, kz], [kx, top + 0.5, kz], 3.45), 'coat', { mirror: true });
  b.paint('shin.L', cylinder([kx, top - 1.9, kz], [kx, top - 1.3, kz], 3.9), 'coatIn', { mirror: true, where: b.isMat('coat') });
  const f = s.foot;
  b.add('foot.L', capsule([ax, ay + 1.6, az - 0.3], [ax, ay - 1.2, az - 0.3], 2.6), 'coat', { mirror: true });
  b.add('foot.L', intersect(box([ax, 2.4, az + (f.len / 2 - f.heel) + 0.2], [f.w / 2 + 0.5, 2.1, f.len / 2 + 0.3], { round: 1.4 }), fn((x, y, z) => y - 4.4 + (z - (az + f.len - f.heel - 3.4)) * 0.7, [-20, -2, -20], [20, 10, 30])), 'coat', { mirror: true });
  // the platform sole and the block heel
  b.add('foot.L', box([ax, 0.6, az + (f.len / 2 - f.heel) + 0.6], [f.w / 2 + 0.7, 0.6, f.len / 2 + 0.3], { round: 0.4 }), 'sole', { mirror: true });
  b.add('foot.L', box([ax, 1.5, az - f.heel + 0.9], [1.4, 1.5, 1.3], { round: 0.3 }), 'sole', { mirror: true });
}

// ---------------------------------------------------------------------------------------------- Barbarriel

/** a lightning bolt's outline along +a (root 0 → tip len): a zig-zag ribbon tapering to a point */
function boltShape(len: number, w0: number, kinks: number, amp: number): [number, number][] {
  const n = kinks + 1;
  const top: [number, number][] = [], bot: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = len * t;
    const h = i === 0 || i === n ? 0 : (i % 2 ? amp : -amp) * (1 - t * 0.4);
    if (i === n) {
      top.push([a, h]);
      break;
    }
    const w = (w0 * (1 - t * 0.9)) / 2;
    top.push([a, h + w]);
    bot.push([a, h - w]);
  }
  return [...top, ...bot.reverse()];
}

/** the bolt's centre line (its kinks) */
function boltLine(len: number, kinks: number, amp: number): [number, number][] {
  const n = kinks + 1;
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push([len * t, i === 0 || i === n ? 0 : (i % 2 ? amp : -amp) * (1 - t * 0.4)]);
  }
  return out;
}

const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
};

/**
 * Barbarriel's six wings: three lightning bolts a side fanned out behind the shoulders (up, level, down), each a
 * zig-zag ribbon tapering to a point with a white-hot core down its middle, on its own bone (wing1-3.L/R).
 */
function wings(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [, sy] = s.shoulder;
  const fan: [number, number, number][] = [[40, 50, 11], [8, 56, 12.5], [-22, 46, 10.5]];
  for (const k of [1, -1]) {
    const side = k > 0 ? 'L' : 'R';
    fan.forEach(([el, len, w0], i) => {
      const root: V3 = [k * 4.2, sy - 2.5 - i * 2.4, -s.chest[1] - 2.4];
      const name = `wing${i + 1}.${side}`;
      b.bone(name, 'chest', root);
      const e = (el * Math.PI) / 180;
      const u = norm([k * Math.cos(e), Math.sin(e), -0.42]);
      const v = norm([-k * Math.sin(e), Math.cos(e), 0]);
      const amp = w0 * 0.42;
      b.add(name, prism(boltShape(len, w0, 4, amp), root, u, v, 1.0, 0.2), 'wing', { thr: 0.2 });
      const line = boltLine(len * 0.94, 4, amp).map(([a, h]): V3 => [root[0] + u[0] * a + v[0] * h, root[1] + u[1] * a + v[1] * h, root[2] + u[2] * a + v[2] * h]);
      b.paint(name, tube(line, line.map((_, j) => 1.3 - j * 0.15)), 'core', { shade: 0, where: b.isMat('wing') });
    });
  }
}

/** Sklaverei's marks: lightning zig-zags down the fronts of the thighs and the boots, and from the collarbones down the chest. */
function marks(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [hx, hy] = s.hip;
  const [kx, ky] = L.knee;
  const [, ay] = L.ankle;
  const tri = (y: number, per: number) => 2 * Math.abs((((y / per) % 1) + 1) % 1 - 0.5) * 2 - 1;
  b.paint('thigh.L', fn((x, y, z) => Math.max(Math.abs(x - hx - tri(y, 3.2) * 0.9) - 0.55, 1.2 - z, y - (hy - 5), ky + 3 - y), [-16, 0, -8], [16, 60, 12]), 'mark', { mirror: true, where: b.isMat('skin') });
  b.paint('shin.L', fn((x, y, z) => Math.max(Math.abs(x - kx - tri(y, 3.0) * 0.9) - 0.55, 1.4 - z, y - (ky - 4), ay + 2 - y), [-16, 0, -8], [16, 40, 12]), 'mark', { mirror: true, where: b.isMat('coat') });
  b.paint('chest', fn((x, y, z) => {
    if (z < 2) return 1;
    const t = (s.shoulder[1] - 1.5 - y) / 5;
    if (t < 0 || t > 1) return 1;
    const cx = Math.sign(x) * (3.4 - t * 1.6) + tri(y, 2.4) * 0.6 * Math.sign(x);
    return Math.abs(x - cx) - 0.55;
  }, [-10, BUST_Y, 0], [10, s.shoulder[1], 14]), 'mark', { where: b.isMat('skin') });
}

// ---------------------------------------------------------------------------------------------- props

function lightningMats(b: ModelBuilder): void {
  b.mat('wing', ['#E6FFE0', '#B8FFB0', '#5CFF5C', '#2BE86E', '#1A9C4A'], { base: 2, rough: 0.3, glow: 0.9, dither: 0 });
  b.mat('core', ['#F2FFEC', '#D8FFD0'], { base: 0, rough: 0.2, glow: 1.6, dither: 0 });
}

/** A wing pulled off as a sword at 48 vox/m: a grip of light, the zig-zag blade along +Z, flat to ±X. */
function buildSword(): VoxelModel {
  const b = new ModelBuilder('candice-sword', 48);
  lightningMats(b);
  b.bone('root', null, [0, 0, 0]);
  b.add('root', cylinder([0, 0, -7], [0, 0, 3.5], 1.0), 'core');
  b.add('root', ellipsoid([0, 0, -7.4], [1.3, 1.3, 1.1]), 'wing');
  const len = 46, w0 = 8, amp = 3.2;
  b.add('root', prism(boltShape(len, w0, 4, amp), [0, 0, 3], [0, 0, 1], [0, 1, 0], 0.8, 0.2), 'wing', { thr: 0.2 });
  const line = boltLine(len * 0.94, 4, amp).map(([a, h]): V3 => [0, h, 3 + a]);
  b.paint('root', tube(line, line.map((_, j) => 1.2 - j * 0.14)), 'core', { shade: 0, where: b.isMat('wing') });
  b.autoShade({ up: 0.3, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** The Heilig Bogen at 48 vox/m: a heart grip, two zig-zag lightning limbs along ±Z curling toward +Y at the tips. */
function buildBow(): VoxelModel {
  const b = new ModelBuilder('candice-bow', 48);
  b.mat('reishi', ['#EAFBFF', '#BFEFFF', '#7FD6FF', '#3FB8FF', '#1F8AD0'], { base: 2, rough: 0.2, glow: 0.7, dither: 0 });
  b.mat('heart', ['#7DF0B0', '#2FD07A', '#1FA460', '#178A50'], { base: 1, rough: 0.25, metal: 0.3 });
  b.bone('root', null, [0, 0, 0]);
  const heart: [number, number][] = [[0, -2.2], [2.1, 0.1], [2.2, 1.2], [1.4, 1.9], [0.5, 1.6], [0, 1.0], [-0.5, 1.6], [-1.4, 1.9], [-2.2, 1.2], [-2.1, 0.1]];
  b.add('root', prism(heart.map(([u, v]) => [u * 1.45, v * 1.45]), [0, 0.4, 0], [0, 0, 1], [0, 1, 0], 1.1, 0.25), 'heart', { thr: 0.2 });
  for (const k of [1, -1]) {
    const u = norm([0, 0.25, k]);
    const v = norm([0, 1, -0.25 * k]);
    const root: V3 = [0, 0.8, k * 2.4];
    b.add('root', prism(boltShape(17, 3.4, 3, 1.3), root, u, v, 0.7, 0.2), 'reishi', { thr: 0.2 });
  }
  b.autoShade({ up: 0.3, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** Barbarriel's halo at 48 vox/m: a five-pointed star whose every edge is a jagged bolt, the Zeichen at its heart. Faces +Z. */
function buildHalo(): VoxelModel {
  const b = new ModelBuilder('candice-halo', 48);
  b.mat('halo', ['#F2FFEC', '#B8FFB0', '#5CFF5C', '#2BE86E', '#1A9C4A'], { base: 2, rough: 0.2, glow: 1.0, dither: 0 });
  b.bone('root', null, [0, 0, 0]);
  const R = 13, r = 5.4;
  const pts: V3[] = [];
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI / 2 + (i / 10) * Math.PI * 2;
    const rr = i % 2 === 0 ? R : r;
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr, 0]);
  }
  for (let i = 0; i < 10; i++) {
    const a = pts[i], c = pts[i + 1];
    const dx = c[0] - a[0], dy = c[1] - a[1];
    const l = Math.hypot(dx, dy);
    const nx = -dy / l, ny = dx / l;
    const k1: V3 = [a[0] + dx * 0.36 + nx * 1.2, a[1] + dy * 0.36 + ny * 1.2, 0];
    const k2: V3 = [a[0] + dx * 0.64 - nx * 1.2, a[1] + dy * 0.64 - ny * 1.2, 0];
    b.add('root', capsule(a, k1, 0.85), 'halo', { thr: 0.2 });
    b.add('root', capsule(k1, k2, 0.85), 'halo', { thr: 0.2 });
    b.add('root', capsule(k2, c, 0.85), 'halo', { thr: 0.2 });
  }
  b.add('root', capsule([0, -3.4, 0], [0, 3.4, 0], 0.85), 'halo', { thr: 0.2 });
  b.add('root', capsule([-3, 1, 0], [3, 1, 0], 0.85), 'halo', { thr: 0.2 });
  for (let i = 0; i < 5; i++) b.add('root', capsule([0, 0, 0], [Math.cos(Math.PI / 2 + (i / 5) * Math.PI * 2) * r, Math.sin(Math.PI / 2 + (i / 5) * Math.PI * 2) * r, 0], 0.75), 'halo', { thr: 0.2 });
  b.autoShade({ up: 0.2, open: 1, front: 0 });
  b.lint();
  return b.build();
}
