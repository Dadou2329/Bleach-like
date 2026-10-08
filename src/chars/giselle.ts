// Giselle Gewelle (docs/roster/H3-sternritter-2.md § Giselle Gewelle; kit docs/kits/giselle.md). Brief: 160 cm → 77 vox
// at 48/m (head 12.4, ≈ 1/6.2); slim and girlish (Gigi is biologically male per Kubo; modelled exactly as drawn).
// Silhouette keys: very long straight black hair to the lower back with blunt bangs and two thin strands standing up
// from the crown like antennae; a small white peaked cap pinned on the side of the head (her right); the white
// long-sleeved coat closed to a stand collar, flaring below the belt to mid-thigh, the sleeves widening into loose
// cuffs over the backs of the hands; black leggings; white ankle boots. Face: big blue eyes, a wide goofy grin with a
// fang. Trim: gold buttons, the black belt, the blue heart case on her left hip (the folded bow). Forms: 'base';
// 'azhalbiora' (Quincy: Vollständig, anime look: large purple wings of bones off the shoulder blades — a long arm bone
// and four finger bones fanned out from its knuckle — and a skeletal reishi tail of vertebrae on three spring bones;
// the skull-star halo is a prop); 'sklaverei' (the same with skulls grown on the wing knuckles and bone spurs on the
// cuffs; anime-only). Props at 48 vox/m: 'bow' (the Heilig Bogen: limbs of linked vertebrae round a blue heart grip),
// 'skull' (a cartoon skull: the arrowheads, and scaled up the skull fists of Munchy Munchy Babies), 'bone' (one bone:
// Dancing Dead Boys Club's scattered bones), 'halo'. The skeleton of Dancing Dead Boys Club is its own small rig
// (`skeletonAsset`), 58 vox, a big grinning skull on a cartoon frame.
// (verify) the cap's side (her right here); the sleeves' length (to the knuckles here); the boots (white, ankle-high).
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, intersect, prism, rotate, smoothPath, sphere, spike, subtract, tube, type Sdf, type V3 } from '../models/sdf';
import { addBands, faceLegend, hands, head, humanoidSkeleton, type HumanoidSpec, type Landmarks } from './humanoid';
import { frontOf } from './sternritter';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

/** 77 voxels = 1.60 m */
export const GISELLE_RES = 77 / 1.6;
export type GiselleForm = 'base' | 'azhalbiora' | 'sklaverei';

/** Slim and girlish: narrow shoulders, long legs, a small waist. */
const SPEC: HumanoidSpec = {
  H: 77,
  chinY: 64.6,
  head: { w: 10, d: 11, h: 12.4 },
  neckR: 1.75,
  shoulder: [6.8, 59.4, -0.5],
  upperArm: 12.4,
  foreArm: 11.2,
  hand: 7.0,
  armR: 1.7,
  hipsY: 40.4,
  hip: [4.2, 38.2, 0],
  kneeY: 21.4,
  ankleY: 4.4,
  chest: [5.4, 3.8],
  waist: [4.1, 3.1],
  hips: [5.9, 4.2],
  chestY: 54.2,
  waistY: 47.2,
  foot: { len: 9.6, w: 3.7, heel: 2.4 },
};

const BONE_RAMP = ['#E2CCFF', '#C09AFA', '#9A5CF2', '#7C40DA', '#5A22A8'];

function palette(b: ModelBuilder, form: GiselleForm): void {
  b.mat('skin', ['#FCECE3', '#F6E0D6', '#ECCEC2', '#DDB8AA', '#C49C8E'], { base: 1, rough: 0.6, shadeK: 0.9 });
  // black hair with a cool sheen (never below the black floor)
  b.mat('hair', ['#3E4562', '#2F3349', '#25273A', '#1D1E2C', '#18181F', '#151519'], { base: 3, rough: 0.4, shadeK: 0.85, dither: 0.04 });
  b.mat('brow', ['#1A1A26']);
  b.mat('lid', ['#16161D']);
  b.mat('sclera', ['#F3F3F0']);
  b.mat('iris', ['#4C84D6']);
  b.mat('irisD', ['#24467E']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#62202E']);
  b.mat('teeth', ['#EFEFEA']);
  b.mat('coat', ['#F3F3F0', '#F1F2EF', '#DDE0E4', '#C9CCD3', '#A4ABB8'], { base: 1, rough: 0.75, shadeK: 0.9 });
  b.mat('coatIn', ['#D9DCE2', '#C3C8D0', '#A5ACB8'], { base: 1, rough: 0.8 });
  b.mat('legging', ['#3A3A46', '#2E2E38', '#25252D', '#1D1D23'], { base: 1, rough: 0.6, shadeK: 0.85 });
  b.mat('belt', ['#2A2A31', '#1E1E24', '#17171B'], { base: 1, rough: 0.4 });
  b.mat('heart', ['#9CC2FF', '#6B9EF2', '#3C78DE', '#2A5CB4'], { base: 1, rough: 0.25, metal: 0.3 });
  b.mat('gold', ['#E8C866', '#C9A641', '#9E7C26'], { base: 1, rough: 0.3, metal: 0.75 });
  b.mat('peak', ['#2A2A31', '#1E1E24', '#17171B'], { base: 1, rough: 0.25, metal: 0.2 });
  b.mat('sole', ['#9AA2AE', '#7F8794', '#666E7A'], { base: 1, rough: 0.6 });
  if (form !== 'base') b.mat('bone', BONE_RAMP, { base: 2, rough: 0.35, glow: 0.32, dither: 0 });
  if (form === 'sklaverei') {
    b.mat('socket', ['#2A1840']);
    b.mat('eye', ['#E2C8FF'], { base: 0, glow: 1.4, dither: 0 });
  }
}

/** Big blue eyes under thin brows, a wide goofy grin with one fang showing. Rows 9 → 0. */
const FACE = [
  '. . . . . . . . . .',
  '. B B . . . . B B .',
  'L L L . . . . L L L',
  '. W I I . . I I W .',
  '. W * i . . i * W .',
  '. . I I . . I I . .',
  '. . . . . s . . . .',
  '. . m . . . . m . .',
  '. . . m T m m . . .',
  '. . . . . . . . . .',
];

const assetCache = new Map<GiselleForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();
let skeletonCache: CharacterAsset | null = null;

export function giselleAsset(form: GiselleForm = 'base'): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildGiselle(form)));
  return a;
}

/**
 * 'bow' (origin at the heart grip, the limbs along ±Z curling toward +Y), 'skull' (facing +Z, its centre at the origin),
 * 'bone' (along +Z from the origin), 'halo' (facing +Z).
 */
export type GiselleProp = 'bow' | 'skull' | 'bone' | 'halo';

export function giselleProp(kind: GiselleProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) propCache.set(kind, (m = kind === 'bow' ? buildBow() : kind === 'skull' ? buildSkull() : kind === 'bone' ? buildBone() : buildHalo()));
  return m;
}

/** the skull prop's radius (m) and the bone's length (m) */
export const SKULL_R = 5 / 48;
export const BONE_LEN = 14 / 48;
/** the wing bones and the tail's */
export const WING_BONES = ['wing.L', 'wing.R'];
export const TAIL_BONES = ['tail1', 'tail2', 'tail3'];

export function buildGiselle(form: GiselleForm = 'base'): CharacterAsset {
  const b = new ModelBuilder(`giselle-${form}`, GISELLE_RES);
  palette(b, form);
  const s = SPEC;
  const L = humanoidSkeleton(b, s);
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.0, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.0, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.5, wy - 4.4, wz + 0.9]);
  b.socket('palm.L', 'palm.L', [wx - 0.5, wy - 4.4, wz + 0.9]);
  // the knuckles: where the skull fists sit
  b.socket('knuckle.R', 'fist.R', [-wx + 0.2, wy - 5.4, wz + 3.6]);
  b.socket('knuckle.L', 'fist.L', [wx - 0.2, wy - 5.4, wz + 3.6]);
  b.socket('back', 'chest', [0, s.chestY + 2, -7]);
  b.socket('chest.front', 'chest', [0, s.chestY, s.chest[1] + 2]);
  b.socket('toe.R', 'foot.R', [-L.ankle[0], 2, L.ankle[2] + s.foot.len - s.foot.heel]);
  b.socket('toe.L', 'foot.L', [L.ankle[0], 2, L.ankle[2] + s.foot.len - s.foot.heel]);
  // the heart case on her left hip; the thumb she bites; the tail's root
  b.socket('heart', 'hips', [s.hips[0] + 1.7, s.waistY - 4.2, 0.6]);
  b.socket('thumb.R', 'palm.R', [-wx + 1.4, wy - 5.2, wz + 3.6]);
  b.socket('tail', 'hips', [0, s.hipsY + 1, -s.hips[1] - 1.5]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5, hd.front]);
  b.socket('mouth', 'head', [0, s.chinY + 1.5, hd.front + 0.4]);
  b.socket('eye.L', 'head', [2.5, s.chinY + 5, hd.front + 0.3]);
  b.socket('eye.R', 'head', [-2.5, s.chinY + 5, hd.front + 0.3]);
  b.socket('halo', 'head', [0, s.chinY + 21, hd.front - s.head.d - 2]);
  // a small pointed chin
  for (const k of [-1, 1]) b.carve('head', box([k * 5.4, hd.chin + 1.2, hd.front - 2], [0.9, 2.2, 3], { rot: [0, 0, k * 18] }));
  const hair = hairDo(b, L, hd);
  sideCap(b, L, hd);
  b.paint('head', aabb([-4.5, hd.chin + 0.5, hd.front - 1.5], [4.5, hd.chin + 9.4, hd.front + 1]), 'skin', { shade: 1, where: b.isMat('skin') });
  b.paint('head', aabb([-5.5, hd.chin - 1, hd.front - 5], [5.5, hd.chin + 3.5, hd.front + 1]), 'skin', { shade: 0, where: b.isMat('skin') });
  b.stamp('head', hd.x0, hd.chin + 9, FACE, faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth', teeth: 'teeth' }), hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  hands(b, L, 'skin', 1.0);
  const torso = body(b, L);
  const coat = uniform(b, L, torso);
  legs(b, L);
  const springs = [...hair.springs, ...coat.springs];
  const colliders = [...hair.colliders, ...coat.colliders];
  if (form !== 'base') {
    boneWings(b, L, form === 'sklaverei');
    const t = tail(b, L);
    springs.push(...t.springs);
  }
  if (form === 'sklaverei') spurs(b, L);
  b.autoShade();
  b.lint();
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- the head

/**
 * The hair: a smooth cap over the skull, blunt bangs to the brows with a few points, a straight lock down each side
 * of the face to the chest, the long sheet down the back to the small of the back on three spring bones, and the two
 * antennae: thin strands springing up from the crown, curving apart and back.
 */
function hairDo(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const c = hd.chin, front = hd.front;
  const R = GISELLE_RES;
  const hw = s.head.w / 2;
  const cz = L.headC[2];
  // the cap over the skull, the face left open
  const cap = subtract(
    intersect(ellipsoid([0, c + 7.6, cz - 0.9], [hw + 1.6, 6.4, s.head.d / 2 + 1.5]), fn((_x, y) => c + 1 - y, [-12, c - 2, -12], [12, c + 16, 12])),
    fn((x, y, z) => Math.max(z - (front + 4), (front - 3) - z, y - (c + 9.4), Math.abs(x) - (hw - 0.4)), [-12, c - 4, front - 5], [12, c + 12, front + 5]),
  );
  b.add('head', cap, 'hair', { only: 'empty', thr: 0.2 });
  // over the ears, down to the nape
  for (const k of [1, -1]) b.add('head', ellipsoid([k * (hw + 1.0), c + 3.4, cz - 2.4], [2.0, 6.2, 3.6]), 'hair', { only: 'empty', thr: 0.2 });
  // the bangs: cut straight across at the brows with three shallow points
  b.add('head', fn((x, y, z) => {
    const pts = Math.abs(((x + 30) % 3.4) - 1.7) * 0.55;
    return Math.max(Math.abs(x) - (hw + 0.7), c + 8.6 + pts - y, y - (c + 12.6), Math.abs(z - (front + 0.1)) - 0.8 - Math.max(0, y - (c + 11)) * 0.5);
  }, [-8, c + 7, front - 3], [8, c + 14, front + 3]), 'hair', { thr: 0.2 });
  // a lock down each side of the face, past the jaw to the chest
  for (const k of [1, -1]) {
    const lk = smoothPath([[k * (hw + 0.4), c + 10, front - 2.2], [k * (hw + 1.0), c + 4, front - 2.0], [k * (hw + 1.1), c - 2, front - 2.4], [k * (hw + 1.3), c - 9, front - 2.6]], 4);
    b.add('head', tube(lk, lk.map((_, i) => 1.5 - i * 0.02)), 'hair', { thr: 0.3 });
  }
  // the face plate clear under the bangs and between the locks
  b.carve('head', aabb([-4.6, c + 0.5, front + 0.01], [4.6, c + 8.6, front + 6]));
  b.paint('head', aabb([-4.6, c + 0.5, front - 3], [4.6, c + 8.6, front]), 'skin', { where: b.isMat('hair') });
  // the antennae: from the crown, up and apart, curling back at the tips
  for (const k of [1, -1]) {
    const p = smoothPath([[k * 0.9, c + 12.4, cz + 0.8], [k * 1.5, c + 16.5, cz + 0.6], [k * 2.6, c + 20.5, cz - 0.2], [k * 4.0, c + 23.2, cz - 1.0]], 4);
    b.add('head', tube(p, p.map((_, i) => 1.0 - i * 0.02)), 'hair', { thr: 0.3 });
  }
  // the sheet down the back: straight, a little wider than the head, to the small of the back
  const backZ = cz - s.head.d / 2;
  const yTop = c + 8, yBot = s.hipsY - 1;
  const zc = (y: number) => {
    const t = Math.max(0, Math.min(1, (yTop - y) / (yTop - yBot)));
    return backZ - 0.6 - Math.sin(Math.min(1, t * 2.4) * Math.PI * 0.5) * 1.6 + t * 0.4;
  };
  const sheet = fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (yTop - y) / (yTop - yBot)));
    const w = hw + 2.0 - t * 0.6;
    const bot = yBot + Math.abs(Math.sin(x * 0.9)) * 2.2;
    return Math.max(Math.abs(x) - w, Math.abs(z - zc(y)) - (2.0 - t * 0.5), y - yTop, bot - y);
  }, [-12, yBot - 1, backZ - 12], [12, yTop + 1, backZ + 3]);
  const p1: V3 = [0, c + 5, backZ - 1], p2: V3 = [0, s.chestY + 3, zc(s.chestY + 3)], p3: V3 = [0, s.waistY - 2, zc(s.waistY - 2)];
  const bones: [string, string, V3, number, number][] = [['hair1', 'head', p1, p2[1] - 0.5, 200], ['hair2', 'hair1', p2, p3[1] - 0.5, p2[1] + 0.5], ['hair3', 'hair2', p3, -100, p3[1] + 0.5]];
  for (const [name, parent, pivot, y0, y1] of bones) {
    b.bone(name, parent, pivot);
    b.add(name, intersect(sheet, aabb([-24, y0, -30], [24, y1, 10])), 'hair', { thr: 0.25 });
  }
  // strands: long grooves down the sheet and the locks, the sheen across the crown
  const grooves = (x: number) => Math.abs(((x + 60) % 2.6) - 1.3) - 0.32;
  b.paint(['hair1', 'hair2', 'hair3'], fn((x) => grooves(x), [-14, yBot - 3, backZ - 14], [14, yTop + 2, backZ + 3]), 'hair', { shade: 4, where: b.isMat('hair') });
  b.paint('head', fn((x, y, z) => (z > front - 3 && Math.abs(x) < 4.8 ? 1 : y > c + 12 ? 1 : grooves(x)), [-14, c - 12, -14], [14, c + 17, 14]), 'hair', { shade: 4, where: b.isMat('hair') });
  b.paint('head', ellipsoid([1.0, c + 12.8, cz - 0.6], [3.2, 1.2, 3.6]), 'hair', { shade: 0, where: b.isMat('hair') });
  const tip: V3 = [0, yBot, zc(yBot)];
  const springs: SpringDef[] = [
    { bone: 'hair1', tail: [(p2[0] - p1[0]) / R, (p2[1] - p1[1]) / R, (p2[2] - p1[2]) / R], stiffness: 46, damping: 5.5, gravity: 11, limit: 32, radius: 0.08 },
    { bone: 'hair2', tail: [(p3[0] - p2[0]) / R, (p3[1] - p2[1]) / R, (p3[2] - p2[2]) / R], stiffness: 34, damping: 5, gravity: 12, limit: 42, radius: 0.08 },
    { bone: 'hair3', tail: [(tip[0] - p3[0]) / R, (tip[1] - p3[1]) / R, (tip[2] - p3[2]) / R], stiffness: 26, damping: 4.5, gravity: 13, limit: 52, radius: 0.07 },
  ];
  // a slim back: the colliders hug it, or the sheet stands off it like a board
  const colliders: ColliderDef[] = [
    { bone: 'chest', offset: [0, 0.04, -0.01], radius: 0.105 },
    { bone: 'spine', offset: [0, 0, -0.01], radius: 0.085 },
    { bone: 'hips', offset: [0, -0.03, -0.02], radius: 0.115 },
  ];
  return { springs, colliders };
}

/**
 * The little cap pinned over her right temple and tipped out that way: a white crown flaring to its top, a narrow gold
 * band, a black peak over the brow and the gold Zeichen on the front of the crown.
 */
function sideCap(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): void {
  const c = hd.chin;
  const cx = -4.2, cz = L.headC[2] + 1.0;
  const yb = c + 10.6;
  const tiltDeg = 22;
  const pivot: V3 = [cx, yb, cz];
  const tilt = (sdf: Sdf): Sdf => rotate(sdf, pivot, [0, 0, tiltDeg]);
  const H = 3.8;
  const crown = fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (y - yb) / H));
    const rx = 3.4 + t * 1.0, rz = 3.8 + t * 1.2;
    return Math.max(Math.hypot((x - cx) / rx, (z - cz) / rz) - 1, yb - y, y - (yb + H + Math.max(0, (z - cz) / 4) * 0.8));
  }, [cx - 7, yb - 1, cz - 7], [cx + 7, yb + 7, cz + 7]);
  b.add('head', tilt(crown), 'coat', { thr: 0.2 });
  // the hollow under the top (so the crown reads as a cap, not a lump) and the piping round the top
  b.paint('head', tilt(fn((x, y, z) => Math.max(Math.abs(Math.hypot((x - cx) / 4.5, (z - cz + 0.3) / 5.0) - 1) * 6 - 0.6, y - (yb + H + 1.2), yb + H - 1.0 - y), [cx - 7, yb + 1, cz - 7], [cx + 7, yb + 6, cz + 7])), 'coatIn', { where: b.isMat('coat') });
  b.paint('head', tilt(fn((x, y, z) => Math.max(Math.abs(y - (yb + 0.4)) - 0.5, Math.hypot((x - cx) / 4.0, (z - cz) / 4.4) - 1.05), [cx - 7, yb - 1, cz - 7], [cx + 7, yb + 2, cz + 7])), 'gold', { where: b.isMat('coat') });
  // the peak, angled down over the brow
  const pz = cz + 3.6;
  b.add('head', tilt(fn((x, y, z) => {
    const u = (z - pz) / 3.2;
    if (u < -0.3 || u > 1) return 1;
    const w = 3.2 * Math.sqrt(Math.max(0, 1 - u * u * 0.8));
    return Math.max(Math.abs(x - cx) - w, Math.abs(y - (yb + 0.1 - u * 1.2)) - 0.45);
  }, [cx - 6, yb - 4, pz - 2], [cx + 6, yb + 2, pz + 5])), 'peak', { thr: 0.2 });
  // the Zeichen on the crown's front, in the tipped cap's frame (only on the cap's white)
  const a = (tiltDeg * Math.PI) / 180;
  const place = (lx: number, ly: number) => {
    const dx = lx - pivot[0], dy = ly - pivot[1];
    return [Math.round(pivot[0] + dx * Math.cos(a) - dy * Math.sin(a)), Math.round(pivot[1] + dx * Math.sin(a) + dy * Math.cos(a))];
  };
  const g = b.grid('head');
  const white = b.isMat('coat');
  for (const [lx, ly] of [[cx, yb + 3.0], [cx - 1, yb + 2.0], [cx, yb + 2.0], [cx + 1, yb + 2.0], [cx - 1, yb + 1.2], [cx + 1, yb + 1.2]]) {
    const [x, y] = place(lx, ly);
    for (let z = 24; z > -4; z--) {
      const v = g.get(x, y, z);
      if (v === 0) continue;
      if (white(v)) b.voxel('head', x, y, z, 'gold', 0);
      break;
    }
  }
}

// ---------------------------------------------------------------------------------------------- body and clothes

/** The slim torso in the coat; the neck; the arms in long sleeves that widen into loose cuffs over the hands. */
function body(b: ModelBuilder, L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const torso = blend(2.3,
    box([0, s.chestY - 0.5, -0.2], [cx, 5.2, cz], { round: 2.8 }),
    box([0, s.waistY, -0.2], [wx, 3.8, wz], { round: 2.3 }),
    box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 3.3, s.hips[1]], { round: 2.4 }),
    capsule([2.1, sy + 1.2, sz - 0.6], [sx - 1.2, sy - 0.2, sz], 2.1, 2.2),
    capsule([-2.1, sy + 1.2, sz - 0.6], [-sx + 1.2, sy - 0.2, sz], 2.1, 2.2),
    sphere([sx, sy - 0.5, sz], 2.5), sphere([-sx, sy - 0.5, sz], 2.5));
  addBands(b, torso, 'coat', [['hips', 30, 44], ['spine', 44, 51], ['chest', 51, 90]]);
  b.add('neck', capsule([0, s.chinY - 5, L.headC[2] - 0.5], [0, s.chinY + 2, L.headC[2] - 0.5], s.neckR), 'skin');
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(1.2, sphere([sx, sy - 0.5, sz], 2.7), capsule([sx, sy - 1, sz], [sx, ey + 0.5, sz], 2.3, 2.15)), 'coat', { mirror: true });
  b.add('forearm.L', blend(1.1, sphere([sx, ey, sz], 2.1), capsule([sx, ey - 0.5, sz], [sx, wy + 2.4, sz], 2.1, 2.5)), 'coat', { mirror: true });
  // the loose cuff: a bell from the wrist down over the back of the hand, open below, lined
  const bell = fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (wy + 2.6 - y) / 5.2));
    const r = 2.6 + t * 1.1;
    return Math.max(Math.abs(Math.hypot(x - sx, z - sz) - r + 0.5) - 0.75, y - (wy + 2.6), wy - 2.6 - y);
  }, [sx - 6, wy - 4, sz - 6], [sx + 6, wy + 4, sz + 6]);
  b.add('forearm.L', bell, 'coat', { mirror: true, thr: 0.2 });
  b.paint('forearm.L', fn((x, y, z) => Math.max(Math.hypot(x - sx, z - sz) - 2.9, y - (wy + 0.6)), [sx - 6, wy - 4, sz - 6], [sx + 6, wy + 2, sz + 6]), 'coatIn', { mirror: true, where: b.isMat('coat') });
  b.paint('forearm.L', fn((x, y, z) => Math.max(Math.abs(y - (wy - 2.2)) - 0.45, 2.6 - Math.hypot(x - sx, z - sz)), [sx - 6, wy - 4, sz - 6], [sx + 6, wy, sz + 6]), 'coatIn', { mirror: true, where: b.isMat('coat') });
  return torso;
}

/**
 * The coat: closed to a stand collar, a double row of gold buttons, the black belt with the blue heart case on her
 * left hip, and below it a short skirt of six spring panels flaring to mid-thigh.
 */
function uniform(b: ModelBuilder, L: Landmarks, torso: Sdf): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const nz = L.headC[2] - 0.8;
  const collar = fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (y - (sy - 0.5)) / (s.chinY - sy)));
    const r = s.neckR + 1.3 + t * 0.5;
    return Math.max(Math.abs(Math.hypot(x, (z - nz) * 1.08) - r) - 0.6, y - (s.chinY - 1.2), sy - 1 - y);
  }, [-8, sy - 2, nz - 8], [8, s.chinY + 1, nz + 8]);
  b.add('chest', collar, 'coat');
  b.paint('chest', aabb([-0.5, sy - 1, nz + 1], [0.5, s.chinY, nz + 8]), 'coatIn', { where: b.isMat('coat') });
  // the front's overlap and the double row of buttons
  b.paint(['chest', 'spine'], fn((x, _y, z) => Math.max(Math.abs(x - 1.6) - 0.4, 1.5 - z), [-10, s.waistY - 3, -10], [10, sy, 10]), 'coat', { shade: 3, where: b.isMat('coat') });
  for (const x of [-2.4, 2.4]) for (const y of [s.chestY + 3, s.chestY - 0.5, s.waistY + 2]) {
    const xi = Math.round(x);
    const at = frontOf(b, ['chest', 'spine'], xi, Math.round(y));
    if (at) b.voxel(at.bone, xi, Math.round(y), at.z + 1, 'gold', 0);
  }
  for (const k of [1, -1]) b.paint(['chest', `upperarm.${k > 0 ? 'L' : 'R'}`], capsule([k * 3, sy + 2, sz - 0.6], [k * (sx + 1.1), sy + 0.4, sz], 0.45), 'coat', { shade: 3, where: b.isMat('coat') });
  // the belt and the heart case on her left hip, hung from it by a ring
  const by = s.waistY - 2.6;
  b.add('spine', intersect(fn((x, y, z) => Math.max(torso.d(x, y, z) - 1.2, 0.2 - torso.d(x, y, z)), [-12, by - 2, -10], [12, by + 2, 10]), aabb([-20, by - 0.8, -20], [20, by + 0.8, 20])), 'belt');
  const bz = frontOf(b, ['spine'], 0, Math.round(by))?.z ?? 4;
  b.add('spine', box([0, by, bz + 0.2], [1.2, 0.9, 0.5]), 'gold');
  const heart: [number, number][] = [[0, -2.2], [2.1, 0.1], [2.2, 1.2], [1.4, 1.9], [0.5, 1.6], [0, 1.0], [-0.5, 1.6], [-1.4, 1.9], [-2.2, 1.2], [-2.1, 0.1]];
  const hc: V3 = [s.hips[0] + 1.7, by - 3.2, 0.6];
  b.add('hips', prism(heart.map(([u, v]) => [u * 1.1, v * 1.1]), hc, [0, 0, -1], [0, 1, 0], 0.75, 0.25), 'heart', { thr: 0.2 });
  b.add('hips', capsule([hc[0] - 0.4, hc[1] + 2.3, hc[2]], [hc[0] - 0.9, by - 0.4, hc[2]], 0.45), 'gold', { thr: 0.2 });
  // the hips under the skirt
  b.add('hips', box([0, s.hipsY - 0.5, -0.3], [s.hips[0] + 0.3, 3.0, s.hips[1] + 0.3], { round: 2.0 }), 'legging');
  return skirt(b, L, { yTop: by - 0.6, yHem: 29, r0: 6.6, r1: 9.0 });
}

/**
 * A short flared skirt (the coat below the belt): six panels on single spring bones (coat.F/S/B.L/R), a fold down
 * each, lined, overlapping so no slit opens over the leggings.
 */
function skirt(b: ModelBuilder, L: Landmarks, o: { yTop: number; yHem: number; r0: number; r1: number }): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const R = GISELLE_RES;
  const cz = -0.5;
  const kz = 0.82;
  const rad = (y: number) => o.r0 + (o.r1 - o.r0) * Math.max(0, Math.min(1, (o.yTop - y) / (o.yTop - o.yHem)));
  const panels: [string, number, number][] = [['F.L', 0, 60], ['S.L', 60, 120], ['B.L', 120, 180], ['B.R', -180, -120], ['S.R', -120, -60], ['F.R', -60, 0]];
  const springs: SpringDef[] = [];
  panels.forEach(([name, a0d, a1d], pi) => {
    const am = (((a0d + a1d) / 2) * Math.PI) / 180;
    const a0 = ((a0d - 5) * Math.PI) / 180, a1 = ((a1d + 5) * Math.PI) / 180;
    const dR = pi % 2 === 1 ? 0.9 : 0;
    const bone = `coat.${name}`;
    const pivot: V3 = [Math.sin(am) * (o.r0 - 1), o.yTop, cz + Math.cos(am) * (o.r0 - 1) * kz];
    b.bone(bone, 'hips', pivot);
    const shell = fn((x, y, z) => {
      const ez = (z - cz) / kz;
      const rho = Math.hypot(x, ez);
      const th = Math.atan2(x, ez);
      const dr = Math.abs(rho - rad(y) - dR) - 0.85;
      let da = 0;
      const lo = Math.min(a0, a1), hi = Math.max(a0, a1);
      if (th < lo) da = (lo - th) * rho;
      else if (th > hi) da = (th - hi) * rho;
      return Math.max(dr, da, y - o.yTop, o.yHem - y);
    }, [-o.r1 - 3, o.yHem - 1, cz - o.r1 - 3], [o.r1 + 3, o.yTop + 1, cz + o.r1 + 3]);
    b.add(bone, shell, 'coat');
    b.paint(bone, fn((x, _y, z) => Math.hypot(x, (z - cz) / kz) - (rad(_y) + dR - 0.15), [-o.r1 - 3, o.yHem - 2, cz - o.r1 - 3], [o.r1 + 3, o.yTop + 1, cz + o.r1 + 3]), 'coatIn', { where: b.isMat('coat') });
    b.paint(bone, fn((_x, y) => Math.abs(y - (o.yHem + 0.4)) - 0.45, [-o.r1 - 3, o.yHem - 1, cz - o.r1 - 3], [o.r1 + 3, o.yHem + 2, cz + o.r1 + 3]), 'coatIn', { where: b.isMat('coat') });
    const fx = Math.sin(am), fz = Math.cos(am);
    b.paint(bone, capsule([fx * (rad(o.yTop) + 0.7), o.yTop - 1.5, cz + fz * (rad(o.yTop) + 0.7) * kz], [fx * (rad(o.yHem) + 0.7), o.yHem + 1, cz + fz * (rad(o.yHem) + 0.7) * kz], 0.6), 'coat', { shade: 3 });
    const hem: V3 = [Math.sin(am) * rad(o.yHem + 1), o.yHem + 1, cz + Math.cos(am) * rad(o.yHem + 1) * kz];
    springs.push({ bone, tail: [(hem[0] - pivot[0]) / R, (hem[1] - pivot[1]) / R, (hem[2] - pivot[2]) / R], stiffness: 80, damping: 6, gravity: 10, limit: 40, radius: 0.08 });
  });
  const colliders: ColliderDef[] = [
    { bone: 'thigh.L', offset: [0, -0.08, 0.01], radius: 0.075 },
    { bone: 'thigh.R', offset: [0, -0.08, 0.01], radius: 0.075 },
  ];
  return { springs, colliders };
}

/** Black leggings; white ankle boots with a turned cuff and a low heel. */
function legs(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [hx, hy, hz] = s.hip;
  const [kx, ky, kz] = L.knee;
  const [ax, ay, az] = L.ankle;
  b.add('thigh.L', blend(1.2, sphere([hx, hy, hz], 3.1), capsule([hx, hy, hz], [kx, ky + 1, kz], 3.1, 2.3)), 'legging', { mirror: true });
  b.add('shin.L', blend(1, sphere([kx, ky, kz], 2.2), capsule([kx, ky, kz], [ax, ay + 2, az], 2.2, 1.6)), 'legging', { mirror: true });
  // a lighter crease down the front of each leg (the knee, the shin)
  b.paint('shin.L', capsule([kx, ky + 0.5, kz + 2.0], [kx, ky - 1.5, kz + 2.0], 0.8), 'legging', { mirror: true, shade: 0 });
  const top = ay + 5.4;
  b.add('shin.L', capsule([ax, top, az], [ax, ay + 0.4, az], 2.25, 2.15), 'coat', { mirror: true });
  b.add('shin.L', cylinder([ax, top - 0.6, az], [ax, top + 0.6, az], 2.6), 'coat', { mirror: true });
  b.paint('shin.L', cylinder([ax, top - 0.8, az], [ax, top - 0.2, az], 2.9), 'coatIn', { mirror: true, where: b.isMat('coat') });
  const f = s.foot;
  b.add('foot.L', capsule([ax, ay + 1.4, az - 0.3], [ax, ay - 1.0, az - 0.3], 2.2), 'coat', { mirror: true });
  b.add('foot.L', intersect(box([ax, 2.0, az + (f.len / 2 - f.heel)], [f.w / 2 + 0.2, 2.0, f.len / 2], { round: 1.3 }), fn((x, y, z) => y - 4.0 + (z - (az + f.len - f.heel - 3.2)) * 0.7, [-20, -2, -20], [20, 10, 30])), 'coat', { mirror: true });
  b.paint('foot.L', aabb([ax - 5, 0, az - 8], [ax + 5, 0.8, az + 14]), 'sole', { mirror: true });
  b.add('foot.L', box([ax, 1.1, az - f.heel + 0.9], [1.3, 1.1, 1.2], { round: 0.3 }), 'sole', { mirror: true });
}

// ---------------------------------------------------------------------------------------------- Azhalbiora

/** a bone from a to b: a shaft with knobbed ends */
function boneSdf(a: V3, c: V3, r: number): Sdf {
  const d: V3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const l = Math.hypot(d[0], d[1], d[2]) || 1;
  const u: V3 = [d[0] / l, d[1] / l, d[2] / l];
  const side: V3 = Math.abs(u[1]) < 0.9 ? [-u[2], 0, u[0]] : [1, 0, 0];
  const sl = Math.hypot(side[0], side[1], side[2]) || 1;
  const s: V3 = [(side[0] / sl) * r * 0.75, (side[1] / sl) * r * 0.75, (side[2] / sl) * r * 0.75];
  const knob = (p: V3, dirK: number) => {
    const q: V3 = [p[0] + u[0] * dirK * r * 0.3, p[1] + u[1] * dirK * r * 0.3, p[2] + u[2] * dirK * r * 0.3];
    return [sphere([q[0] + s[0], q[1] + s[1], q[2] + s[2]], r * 1.25), sphere([q[0] - s[0], q[1] - s[1], q[2] - s[2]], r * 1.25)];
  };
  return blend(r * 0.8, capsule(a, c, r, r * 0.85), ...knob(a, 1), ...knob(c, -1));
}

/**
 * Azhalbiora's wings: per side a long arm bone rising up and out from the shoulder blade to a knuckle, and four finger
 * bones fanned out and down from it, longest at the top (a bat's wing with no membrane, all bone and purple light).
 */
function boneWings(b: ModelBuilder, L: Landmarks, sklav: boolean): void {
  const s = L.spec;
  const [, sy] = s.shoulder;
  for (const k of [1, -1]) {
    const side = k > 0 ? 'L' : 'R';
    const root: V3 = [k * 3.0, sy - 3.4, -s.chest[1] - 1.2];
    b.bone(`wing.${side}`, 'chest', root);
    const knuckle: V3 = [k * 16, sy + 12, -s.chest[1] - 7];
    b.add(`wing.${side}`, boneSdf(root, knuckle, 1.9), 'bone', { thr: 0.2 });
    b.add(`wing.${side}`, sphere(root, 2.8), 'bone');
    b.add(`wing.${side}`, sphere(knuckle, 3.1), 'bone');
    const fingers: [number, number][] = [[40, 30], [10, 35], [-20, 31], [-48, 25]];
    for (const [el, len] of fingers) {
      const e = (el * Math.PI) / 180;
      const tip: V3 = [knuckle[0] + k * Math.cos(e) * len, knuckle[1] + Math.sin(e) * len, knuckle[2] - 4 - len * 0.12];
      // each finger bowed outward at its joint
      const mid: V3 = [(knuckle[0] + tip[0]) / 2 + k * Math.sin(e) * -1.6, (knuckle[1] + tip[1]) / 2 + Math.cos(e) * 1.8, (knuckle[2] + tip[2]) / 2];
      b.add(`wing.${side}`, boneSdf(knuckle, mid, 1.55), 'bone', { thr: 0.2 });
      b.add(`wing.${side}`, boneSdf(mid, tip, 1.3), 'bone', { thr: 0.2 });
      // the claw at the end
      const dir: V3 = [tip[0] - mid[0], tip[1] - mid[1], tip[2] - mid[2]];
      b.add(`wing.${side}`, spike(tip, dir, 5.5, 1.35, 1.1, { tip: 0.3 }), 'bone', { thr: 0.25 });
      if (sklav) b.add(`wing.${side}`, sphere(mid, 2.3), 'bone');
    }
    // the joints lit a shade darker (the light gathers in the knuckles)
    b.paint(`wing.${side}`, sphere(knuckle, 3.3), 'bone', { shade: 4 });
    b.paint(`wing.${side}`, sphere(root, 3.0), 'bone', { shade: 4 });
    if (sklav) skullAt(b, `wing.${side}`, [knuckle[0] + k * 0.5, knuckle[1] + 3.4, knuckle[2] - 0.6], 3.4);
  }
}

/** a small skull grown on a bone (Sklaverei): a round cranium, dark sockets with a glint, a row of teeth */
function skullAt(b: ModelBuilder, bone: string, c: V3, r: number): void {
  b.add(bone, blend(0.8, sphere(c, r), box([c[0], c[1] - r * 0.75, c[2] + r * 0.25], [r * 0.6, r * 0.35, r * 0.6], { round: 0.4 })), 'bone', { thr: 0.2 });
  for (const k of [1, -1]) {
    b.carve(bone, sphere([c[0] + k * r * 0.38, c[1] + r * 0.05, c[2] + r * 0.95], r * 0.32));
    b.paint(bone, sphere([c[0] + k * r * 0.38, c[1] + r * 0.05, c[2] + r * 0.75], r * 0.4), 'socket', { where: b.isMat('bone') });
    b.voxel(bone, Math.round(c[0] + k * r * 0.38), Math.round(c[1] + r * 0.05), Math.round(c[2] + r * 0.55), 'eye', 0);
  }
}

/** The skeletal tail: vertebrae in a chain from the small of the back down and out behind her, on three spring bones. */
function tail(b: ModelBuilder, L: Landmarks): { springs: SpringDef[] } {
  const s = L.spec;
  const R = GISELLE_RES;
  const z0 = -s.hips[1] - 1.5;
  const path = smoothPath([[0, s.hipsY + 1, z0], [0, s.hipsY - 6, z0 - 6], [0, s.hipsY - 14, z0 - 15], [0, s.hipsY - 19, z0 - 26], [0, s.hipsY - 20, z0 - 38], [0, s.hipsY - 17, z0 - 48]], 6);
  const n = path.length;
  const cuts = [0, Math.floor(n / 3), Math.floor((2 * n) / 3), n - 1];
  const springs: SpringDef[] = [];
  for (let seg = 0; seg < 3; seg++) {
    const name = TAIL_BONES[seg];
    const p0 = path[cuts[seg]], p1 = path[cuts[seg + 1]];
    b.bone(name, seg === 0 ? 'hips' : TAIL_BONES[seg - 1], p0);
    for (let i = cuts[seg]; i <= cuts[seg + 1]; i++) {
      const t = i / (n - 1);
      const p = path[i];
      const r = 1.9 - t * 0.9;
      // a vertebra: a rounded block, a spur on top; the next one butting against it
      b.add(name, box(p, [r * 1.15, r * 0.9, r * 0.9], { round: r * 0.5 }), 'bone', { thr: 0.2 });
      if (i % 2 === 0) b.add(name, spike([p[0], p[1] + r * 0.6, p[2]], [0, 1, -0.4], 2.4 - t * 1.2, 0.8, 0.8, { tip: 0.3 }), 'bone', { thr: 0.25 });
      if (i < cuts[seg + 1]) b.add(name, capsule(p, path[i + 1], r * 0.55), 'bone', { thr: 0.2 });
    }
    b.paint(name, fn((x, y, z) => {
      let best = 1e9;
      for (let i = cuts[seg]; i <= cuts[seg + 1]; i += 2) best = Math.min(best, Math.hypot(x - path[i][0], y - path[i][1], z - path[i][2]));
      return best - 0.8;
    }, [-6, -10, -70], [6, 60, 4]), 'bone', { shade: 3 });
    springs.push({ bone: name, tail: [(p1[0] - p0[0]) / R, (p1[1] - p0[1]) / R, (p1[2] - p0[2]) / R], stiffness: 90 - seg * 16, damping: 5, gravity: 1.5, limit: 30 + seg * 10, radius: 0.06 });
  }
  // the tip: a long pointed bone
  const last = path[n - 1], prev = path[n - 2];
  b.add(TAIL_BONES[2], spike(last, [last[0] - prev[0], last[1] - prev[1], last[2] - prev[2]], 7, 1.1, 1.0, { tip: 0.3 }), 'bone', { thr: 0.25 });
  return { springs };
}

/** Sklaverei: bone spurs out of the cuffs, curving back along the forearms. */
function spurs(b: ModelBuilder, L: Landmarks): void {
  const [sx, , sz] = L.spec.shoulder;
  const wy = L.wrist[1];
  for (let i = 0; i < 3; i++) {
    const a = (-60 + i * 60) * (Math.PI / 180);
    b.add('forearm.L', spike([sx + Math.sin(a) * 2.6, wy + 2, sz - Math.cos(a) * 2.6], [Math.sin(a) * 0.6, 1, -Math.cos(a) * 0.6], 5, 1.0, 0.9, { tip: 0.3 }), 'bone', { mirror: true, thr: 0.25 });
  }
}

// ---------------------------------------------------------------------------------------------- props

function boneMats(b: ModelBuilder): void {
  b.mat('bone', BONE_RAMP, { base: 2, rough: 0.35, glow: 0.36, dither: 0 });
  b.mat('socket', ['#2A1840']);
  b.mat('eye', ['#E2C8FF'], { base: 0, glow: 1.4, dither: 0 });
}

/** The Heilig Bogen: a blue heart grip, two limbs of linked vertebrae along ±Z curling toward +Y at the tips. */
function buildBow(): VoxelModel {
  const b = new ModelBuilder('giselle-bow', 48);
  boneMats(b);
  b.mat('heart', ['#9CC2FF', '#6B9EF2', '#3C78DE', '#2A5CB4'], { base: 1, rough: 0.25, metal: 0.3 });
  b.bone('root', null, [0, 0, 0]);
  const heart: [number, number][] = [[0, -2.2], [2.1, 0.1], [2.2, 1.2], [1.4, 1.9], [0.5, 1.6], [0, 1.0], [-0.5, 1.6], [-1.4, 1.9], [-2.2, 1.2], [-2.1, 0.1]];
  b.add('root', prism(heart.map(([u, v]) => [u * 1.45, v * 1.45]), [0, 0.4, 0], [0, 0, 1], [0, 1, 0], 1.1, 0.25), 'heart', { thr: 0.2 });
  for (const k of [1, -1]) {
    const path = smoothPath([[0, 0.8, k * 2.6], [0, 1.6, k * 9], [0, 2.8, k * 15], [0, 5.2, k * 19.5]], 3);
    path.forEach((p, i) => {
      const r = 1.3 - (i / path.length) * 0.35;
      b.add('root', box(p, [r * 1.1, r * 0.95, r * 0.8], { round: r * 0.5 }), 'bone', { thr: 0.2 });
      if (i < path.length - 1) b.add('root', capsule(p, path[i + 1], r * 0.5), 'bone', { thr: 0.2 });
    });
    const tip = path[path.length - 1];
    b.add('root', sphere([tip[0], tip[1] + 0.6, tip[2] + k * 0.4], 1.6), 'bone');
  }
  b.autoShade({ up: 0.3, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** A cartoon skull facing +Z: a round cranium, a narrower jaw, two big dark sockets with a glint, a nose hole, teeth. */
function buildSkull(): VoxelModel {
  const b = new ModelBuilder('giselle-skull', 48);
  boneMats(b);
  b.bone('root', null, [0, 0, 0]);
  b.add('root', blend(1.0, sphere([0, 0.8, 0], 4.6), box([0, -2.6, 0.9], [2.8, 1.6, 2.8], { round: 1.0 })), 'bone', { thr: 0.2 });
  for (const k of [1, -1]) {
    b.carve('root', ellipsoid([k * 1.8, 0.8, 4.0], [1.4, 1.6, 1.4]));
    b.paint('root', ellipsoid([k * 1.8, 0.8, 3.0], [1.7, 1.9, 1.6]), 'socket', { where: b.isMat('bone') });
    b.voxel('root', Math.round(k * 1.8), 1, 3, 'eye', 0);
  }
  b.carve('root', box([0, -1.0, 4.2], [0.5, 0.7, 1]));
  b.paint('root', box([0, -1.0, 3.3], [0.6, 0.8, 1]), 'socket', { where: b.isMat('bone') });
  // the teeth: a row of notches across the jaw's front
  b.paint('root', fn((x, y, z) => Math.max(Math.abs(y + 2.6) - 0.5, 2.6 - z, Math.abs(((x + 20) % 1.6) - 0.8) - 0.35), [-4, -4, 0], [4, -1, 6]), 'socket', { where: b.isMat('bone') });
  b.autoShade({ up: 0.3, open: 1, front: 0.2 });
  b.lint();
  return b.build();
}

/** One bone along +Z, knobbed at both ends. */
function buildBone(): VoxelModel {
  const b = new ModelBuilder('giselle-bone', 48);
  boneMats(b);
  b.bone('root', null, [0, 0, 0]);
  b.add('root', boneSdf([0, 0, 1.5], [0, 0, 12.5], 1.1), 'bone', { thr: 0.2 });
  b.autoShade({ up: 0.3, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** Azhalbiora's halo: a five-pointed star of bones round a small grinning skull. Faces +Z. */
function buildHalo(): VoxelModel {
  const b = new ModelBuilder('giselle-halo', 48);
  boneMats(b);
  b.bone('root', null, [0, 0, 0]);
  const Ro = 12, ri = 5.2;
  const pts: V3[] = [];
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI / 2 + (i / 10) * Math.PI * 2;
    const rr = i % 2 === 0 ? Ro : ri;
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr, 0]);
  }
  for (let i = 0; i < 10; i++) b.add('root', boneSdf(pts[i], pts[i + 1], 0.75), 'bone', { thr: 0.2 });
  skullAt(b, 'root', [0, 0.4, 0], 3.2);
  b.autoShade({ up: 0.2, open: 1, front: 0 });
  b.lint();
  return b.build();
}

// ---------------------------------------------------------------------------------------------- the skeletons

/** A cartoon skeleton, 1.2 m: a big grinning skull, a ribcage, a column, a pelvis, thin limbs with knobbed joints. */
const SKEL: HumanoidSpec = {
  H: 58,
  chinY: 43.6,
  head: { w: 12, d: 12, h: 14 },
  neckR: 1.1,
  shoulder: [6.0, 40.4, -0.4],
  upperArm: 9.6,
  foreArm: 8.6,
  hand: 5.4,
  armR: 1.0,
  hipsY: 24.6,
  hip: [3.4, 23.2, 0],
  kneeY: 12.6,
  ankleY: 2.8,
  chest: [5.0, 3.6],
  waist: [1.6, 1.6],
  hips: [4.4, 2.8],
  chestY: 35.6,
  waistY: 29.6,
  foot: { len: 6.6, w: 3.0, heel: 1.6 },
};
export const SKELETON_RES = 48;

export function skeletonAsset(): CharacterAsset {
  if (!skeletonCache) skeletonCache = buildSkeleton();
  return skeletonCache;
}

function buildSkeleton(): CharacterAsset {
  const b = new ModelBuilder('giselle-skeleton', SKELETON_RES);
  boneMats(b);
  const s = SKEL;
  const L = humanoidSkeleton(b, s);
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 3.4, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 3.4, wz + 0.4]);
  // the skull: big and round, the jaw grinning
  const hc: V3 = [0, s.chinY + 7.4, L.headC[2]];
  b.add('head', blend(1.4, sphere(hc, 7.0), box([0, s.chinY + 2.0, hc[2] + 1.2], [4.4, 2.2, 4.2], { round: 1.4 })), 'bone', { thr: 0.2 });
  for (const k of [1, -1]) {
    b.carve('head', ellipsoid([k * 2.7, hc[1], hc[2] + 6.4], [2.0, 2.4, 2.0]));
    b.paint('head', ellipsoid([k * 2.7, hc[1], hc[2] + 5.0], [2.4, 2.8, 2.4]), 'socket', { where: b.isMat('bone') });
    b.voxel('head', Math.round(k * 2.7), Math.round(hc[1]), Math.round(hc[2] + 4.4), 'eye', 0);
  }
  b.carve('head', box([0, hc[1] - 3.6, hc[2] + 6.6], [0.7, 1.0, 1.2]));
  b.paint('head', fn((x, y, z) => Math.max(Math.abs(y - (s.chinY + 2.0)) - 0.5, hc[2] + 3.6 - z, Math.abs(((x + 20) % 1.8) - 0.9) - 0.4, Math.abs(x) - 3.8), [-6, s.chinY, hc[2]], [6, s.chinY + 4, hc[2] + 8]), 'socket', { where: b.isMat('bone') });
  b.add('neck', capsule([0, s.chinY - 4, L.headC[2] - 0.5], [0, s.chinY + 1, L.headC[2] - 0.5], 1.2), 'bone');
  // the ribcage: the column up the back, four ribs curving round from it to a sternum in front; the collarbones
  const colZ = -1.8;
  b.add('chest', capsule([0, s.chestY + 5, colZ], [0, s.waistY + 2, colZ], 1.1), 'bone');
  for (let i = 0; i < 4; i++) {
    const y = s.chestY + 3.4 - i * 2.4;
    const w = 4.4 - Math.abs(i - 1.2) * 0.35;
    for (const k of [1, -1]) {
      const p = smoothPath([[0, y, colZ], [k * w * 0.8, y - 0.3, colZ + 0.6], [k * w, y - 0.8, 1.2], [k * w * 0.6, y - 1.2, 3.2], [k * 1.0, y - 1.4, 3.6]], 3);
      b.add('chest', tube(p, p.map(() => 0.75)), 'bone', { thr: 0.2 });
    }
  }
  b.add('chest', capsule([0, s.chestY + 3, 3.7], [0, s.chestY - 5.6, 3.5], 0.95), 'bone');
  b.add('chest', capsule([-s.shoulder[0] + 1, s.shoulder[1] + 0.6, -0.4], [s.shoulder[0] - 1, s.shoulder[1] + 0.6, -0.4], 0.9), 'bone');
  b.add('spine', capsule([0, s.waistY + 3, colZ], [0, s.hipsY + 1, -1.6], 1.0), 'bone');
  for (let y = s.hipsY + 2; y < s.waistY + 3; y += 2) b.add('spine', sphere([0, y, -1.8], 1.3), 'bone');
  b.add('hips', blend(0.8, ellipsoid([2.4, s.hipsY - 0.4, -0.6], [2.6, 2.2, 1.6], [0, 0, -20]), ellipsoid([-2.4, s.hipsY - 0.4, -0.6], [2.6, 2.2, 1.6], [0, 0, 20])), 'bone', { thr: 0.2 });
  // the limbs
  const [sx, sy, sz] = s.shoulder;
  const [ex, ey, ez] = L.elbow;
  b.add('upperarm.L', boneSdf([sx, sy - 0.5, sz], [ex, ey + 0.5, ez], 0.9), 'bone', { mirror: true, thr: 0.2 });
  b.add('forearm.L', boneSdf([ex, ey - 0.3, ez], [wx, wy + 0.5, wz], 0.8), 'bone', { mirror: true, thr: 0.2 });
  hands(b, L, 'bone', 0.9);
  const [hx, hy, hz] = s.hip;
  const [kx, ky, kz] = L.knee;
  const [ax, ay, az] = L.ankle;
  b.add('thigh.L', boneSdf([hx, hy, hz], [kx, ky + 0.5, kz], 1.0), 'bone', { mirror: true, thr: 0.2 });
  b.add('shin.L', boneSdf([kx, ky - 0.3, kz], [ax, ay + 0.6, az], 0.9), 'bone', { mirror: true, thr: 0.2 });
  const f = s.foot;
  b.add('foot.L', box([ax, 1.2, az + (f.len / 2 - f.heel)], [f.w / 2, 1.2, f.len / 2], { round: 0.9 }), 'bone', { mirror: true });
  b.autoShade();
  b.lint();
  return { model: b.build(), springs: [], colliders: [], warnings: b.warnings };
}

