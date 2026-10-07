// Isshin Kurosaki (docs/roster/A1-ichigo.md §3) — the town doctor, Ichigo's father, once Captain Isshin Shiba of
// the 10th Division. 1.86 m (89 voxels at 48 vox/m), tall and broad, heavily muscled; short spiky black hair, a
// thin moustache running into a goatee, stubble along the jaw; brown eyes and a wide grin.
//
// Forms are outfits on one skeleton:
// - 'doctor': the white lab coat open over a dark blue-grey shirt, dark slacks and a belt, shoes;
// - 'shinigami': the black shihakushō and white obi, his captain's haori torn down to a white sash slanting from
//   the left shoulder across the body to the right hip (a tattered end hangs there), tabi and waraji. Engetsu
//   hangs edge-down at the left hip; Shikai only sets the blade (and the tassel) alight.
// Engetsu: a plain tachi (blade 36 vox ≈ 75 cm), red wrap over rayskin, a hexagonal dark-bronze guard, a blue
// tassel off the pommel; the scabbard black lacquer.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, prism, smoothPath, sphere, subtract, torus, tube, type Sdf, type V3 } from '../models/sdf';
import {
  addBands, coatSkirt, faceLegend, feet, hakama, hands, head, humanoidSkeleton, kosodeSleeves, kosodeTorso, obi, shihakushoSprings, spikeHair,
  type HumanoidSpec, type Landmarks, type Spike,
} from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

export type IsshinForm = 'doctor' | 'shinigami';
export const ISSHIN_RES = 89 / 1.86;

/** Tall, broad through the shoulders and chest, thick arms and neck. */
const SPEC: HumanoidSpec = {
  H: 89,
  chinY: 77,
  head: { w: 10, d: 11, h: 12 },
  neckR: 3.1,
  shoulder: [10.9, 71.6, -0.5],
  upperArm: 15.4,
  foreArm: 13.8,
  hand: 9.4,
  armR: 3.0,
  hipsY: 48,
  hip: [4.9, 45.2, 0],
  kneeY: 24.7,
  ankleY: 4.7,
  chest: [9.5, 5.8],
  waist: [7.6, 5.0],
  hips: [7.8, 5.2],
  chestY: 65.8,
  waistY: 55.2,
  foot: { len: 12.8, w: 5.4, heel: 3.2 },
};

function palette(b: ModelBuilder): void {
  b.mat('skin', ['#E9C2A8', '#D9AE95', '#C59A82', '#A9806A', '#7A5646'], { base: 1, rough: 0.62, shadeK: 0.9 });
  b.mat('hair', ['#3C3C46', '#2E2E36', '#24242A', '#1C1C21', '#141418'], { base: 2, rough: 0.5, shadeK: 0.85, dither: 0.05 });
  b.mat('stub', ['#9C7A66']);
  b.mat('beard', ['#2E2620']);
  b.mat('brow', ['#24201E']);
  b.mat('lid', ['#1F1A18']);
  b.mat('sclera', ['#EDEAE4']);
  b.mat('iris', ['#6A4A34']);
  b.mat('irisD', ['#3E2A1E']);
  b.mat('hi', ['#F3F0EA']);
  b.mat('mouth', ['#8E5A4A']);
  b.mat('teeth', ['#EFECE4']);
  // the shihakushō, the white under-collar and obi, the haori sash
  b.mat('black', ['#3E3E48', '#33333B', '#26262D', '#1C1C21', '#141418'], { base: 2, rough: 0.88, shadeK: 0.95, dither: 0.04 });
  b.mat('collar', ['#EEEDE8', '#DCDBD6', '#C3C0B8'], { base: 0, rough: 0.82 });
  b.mat('obi', ['#E3E1DB', '#CFCCC5', '#B5B1A9'], { base: 0, rough: 0.85 });
  b.mat('sash', ['#F3F2EE', '#EEEDE8', '#DAD8D2', '#C4C3C1', '#A8A9AD'], { base: 1, rough: 0.82, shadeK: 0.9, dither: 0.03 });
  b.mat('tabi', ['#F1F0EC', '#E0DED9', '#C8C5BF'], { base: 0, rough: 0.85 });
  b.mat('straw', ['#CDB683', '#B59C6A', '#8A6A3E'], { base: 1, rough: 0.95 });
  b.mat('cord', ['#5E4526', '#3E2E1A'], { base: 0 });
  // the doctor: lab coat, shirt, slacks, belt, shoes
  b.mat('coat', ['#F3F2EE', '#EFEDE8', '#DCDAD4', '#C6C5C3', '#A7A9AE'], { base: 1, rough: 0.78, shadeK: 0.95, dither: 0.03 });
  b.mat('shirt', ['#56606F', '#4A5362', '#3E4655', '#323947', '#272D38'], { base: 2, rough: 0.8, shadeK: 0.9 });
  b.mat('slacks', ['#43434D', '#36363F', '#2B2B33', '#222228', '#18181C'], { base: 2, rough: 0.82, shadeK: 0.9 });
  b.mat('belt', ['#3A2A20', '#2A1E18']);
  b.mat('buckle', ['#C9C6BC', '#9E9A90'], { base: 0, metal: 0.8, rough: 0.3 });
  b.mat('shoe', ['#4A3428', '#3A281E', '#2A1C14', '#1C140E'], { base: 1, rough: 0.45, shadeK: 0.8 });
  b.mat('sole', ['#1C1C20']);
  b.mat('pen', ['#2E5FA8', '#22477E']);
  b.mat('penCap', ['#D9D6CF']);
}

/**
 * Rows 9 → 0 (column 0 is his right): thick brows, brown eyes, a wide grin showing the upper teeth under a thin
 * moustache that runs down into the goatee; stubble along the cheeks and jaw.
 */
const FACE = [
  '. . . . . . . . . .',
  '. B B B . . B B B .',
  '. L L L . . L L L .',
  '. W * I . . * I W .',
  '. W i i . . i i W .',
  't . . . . . . . . t',
  't . . . . s . . . t',
  't t g g g g g g t t',
  '. t g T T T T g t .',
  '. . t g g g g t . .',
];

/** Short, spiky, messy black hair: chunky spikes up and back, short tufts at the sides and the nape. */
const HAIR: Spike[] = [
  { az: 0, el: 72, len: 3.4, r: 3.8, flow: [0, 0.4, -0.3] },
  { az: -45, el: 62, len: 3.2, r: 3.6, flow: [-0.1, 0.35, -0.35] },
  { az: 45, el: 62, len: 3.2, r: 3.6, flow: [0.1, 0.35, -0.35] },
  { az: 180, el: 55, len: 3.2, r: 3.8, flow: [0, 0.15, -0.5] },
  { az: -120, el: 45, len: 2.9, r: 3.6, flow: [0, 0, -0.5] },
  { az: 120, el: 45, len: 2.9, r: 3.6, flow: [0, 0, -0.5] },
  // over the forehead: short spikes standing up
  { az: -26, el: 48, len: 2.8, r: 3, flow: [-0.15, 0.8, 0.2] },
  { az: 22, el: 50, len: 3, r: 3, flow: [0.15, 0.8, 0.2] },
  { az: -2, el: 46, len: 2.5, r: 3, flow: [0, 0.9, 0.3] },
  // sides, back and nape
  { az: -82, el: 22, len: 2, r: 3.2, flow: [0, -0.1, -0.4] },
  { az: 82, el: 22, len: 2, r: 3.2, flow: [0, -0.1, -0.4] },
  { az: -155, el: 15, len: 2.2, r: 3.4, flow: [0, -0.4, -0.3] },
  { az: 155, el: 15, len: 2.2, r: 3.4, flow: [0, -0.4, -0.3] },
  { az: 180, el: 26, len: 2.4, r: 3.6, flow: [0, -0.3, -0.4] },
];

const assetCache = new Map<IsshinForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function isshinAsset(form: IsshinForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildIsshin(form)));
  return a;
}

/** 'engetsu' (the tachi, in hand) and 'saya' (its scabbard, edge-down at the left hip). */
export type IsshinProp = 'engetsu' | 'saya';

export function isshinProp(kind: IsshinProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) propCache.set(kind, (m = kind === 'engetsu' ? buildEngetsu() : buildSaya()));
  return m;
}

/** blade points (prop frame, m) */
export const ENGETSU_BASE_Z = 6.6 / 48;
export const ENGETSU_TIP_Z = 42.6 / 48;
/** the tassel's end (prop frame, m) — where the Shikai flames stream from */
export const ENGETSU_TASSEL: V3 = [0, -12 / 48, -10.5 / 48];

export function buildIsshin(form: IsshinForm = 'shinigami'): CharacterAsset {
  const b = new ModelBuilder(`isshin-${form}`, ISSHIN_RES);
  palette(b);
  const s = SPEC;
  const doctor = form === 'doctor';
  const L = humanoidSkeleton(b, s, { sleeves: !doctor, hakama: !doctor });
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 5, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5, wz + 1]);
  // the index finger of the open right hand (the Demon Forehead Flick)
  b.socket('finger.R', 'palm.R', [-wx + 0.2, wy - s.hand - 0.5, wz + 1]);
  // tachi-style: edge down, hung from the belt at the left hip, the hilt forward
  b.socket('hip.L', 'hips', [10.2, s.waistY - 5, 3.2], [-12, 180, 180]);
  b.socket('back', 'chest', [0, s.chestY + 1, -8]);
  b.socket('chest.front', 'chest', [0, s.chestY, 7.8]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('brow', 'head', [0, s.chinY + 9.5, hd.front]);
  face(b, L, hd);
  hands(b, L, 'skin');
  const springs: SpringDef[] = [];
  const colliders: ColliderDef[] = [];
  if (doctor) {
    const torso = chest(L);
    shirt(b, L, torso);
    slacks(b, L);
    const coat = labCoat(b, L, torso);
    springs.push(...coat.springs);
    colliders.push(...coat.colliders);
  } else {
    feet(b, L, 'tabi', 'straw', 'cord');
    const o = { black: 'black', collar: 'collar', skin: 'skin', obi: 'obi', hemR: 9.2 };
    kosodeTorso(b, L, o);
    kosodeSleeves(b, L, o);
    obi(b, L, o);
    hakama(b, L, o);
    const sh = sash(b, L);
    const base = shihakushoSprings();
    springs.push(...base.springs, ...sh);
    colliders.push(...base.colliders);
  }
  b.autoShade();
  b.lint();
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- head

function face(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }): void {
  const s = L.spec;
  const c = hd.chin, f = hd.front;
  spikeHair(b, L, 'hair', HAIR, [], { tufts: 30, hairline: c + s.head.h - 1.6 });
  // the eyes and the brow line kept clear of the hair
  b.carve('head', aabb([-5, c + 4, f], [-1, c + 9, f + 6]));
  b.carve('head', aabb([1, c + 4, f], [5, c + 9, f + 6]));
  b.stamp('head', hd.x0, c + 9, FACE, { ...faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth', teeth: 'teeth' }), t: { mat: 'stub' }, g: { mat: 'beard' } }, f - 1);
  // a strong nose, a heavy brow ridge
  b.voxel('head', 0, c + 3, f, 'skin', 1);
  b.voxel('head', -1, c + 3, f, 'skin', 2);
  // stubble round the jaw and up the cheeks
  b.paint('head', fn((x, y, z) => {
    if (y > c + 4.5 || y < c - 1 || z < f - 6) return 1;
    return Math.abs(x) >= 3.6 || y < c + 0.6 ? -1 : 1;
  }, [-7, c - 2, f - 7], [7, c + 6, f + 1]), 'stub', { where: b.isMat('skin') });
  // sideburns down to the jaw
  for (const k of [-1, 1]) b.add('head', box([k * 4.9, c + 6, f - 4.2], [0.7, 2.2, 1.2]), 'hair', { thr: 0.3 });
}

// ---------------------------------------------------------------------------------------------- Shinigami

/**
 * The captain's haori torn down to a sash: a broad white band raised off the kosode from the top of the left
 * shoulder diagonally down the front and the back to the right hip, a knot on the shoulder and a ragged end
 * hanging at the hip on a spring bone.
 */
function sash(b: ModelBuilder, L: Landmarks): SpringDef[] {
  const s = L.spec;
  const A: V3 = [7.4, s.shoulder[1] + 2.4, 0]; // over the left shoulder
  const B: V3 = [-9.2, s.waistY - 6.5, 0]; // the right hip
  const ab = [B[0] - A[0], B[1] - A[1]];
  const len = Math.hypot(ab[0], ab[1]);
  const t = [ab[0] / len, ab[1] / len];
  const n = [-t[1], t[0]];
  const half = 3.1;
  const set = (bone: string, x: number, y: number, z: number, shade: number) => b.grid(bone).set(x, y, z, b.val('sash', shade));
  b.surfaceVoxels(['chest', 'spine', 'hips', 'upperarm.L'], [-14, s.waistY - 10, -10], [14, s.chinY - 1, 10], (bone, x, y, z, nx, ny, nz) => {
    const px = x + 0.5 - A[0], py = y + 0.5 - A[1];
    const w = px * n[0] + py * n[1];
    const along = px * t[0] + py * t[1];
    if (Math.abs(w) > half || along < -4 || along > len + 2) return;
    // the edges a shade darker (the cloth turns under), a fold line down the middle
    const shade = Math.abs(w) > half - 0.8 ? 2 : Math.abs(w) < 0.5 ? 1 : 0;
    set(bone, x, y, z, shade);
    set(bone, x + nx, y + ny, z + nz, shade);
  });
  // the knot on top of the shoulder, where it is fastened
  b.add('chest', ellipsoid([A[0] - 0.6, A[1] - 0.6, 1.8], [2.6, 1.8, 2.2]), 'sash', { thr: 0.2 });
  b.add('chest', ellipsoid([A[0] + 0.4, A[1] - 2.2, 4.4], [1.6, 1.8, 1.2]), 'sash', { thr: 0.2 });
  // the torn end hanging at the right hip: a strip with a ragged hem
  b.bone('sash.tail', 'hips', [B[0] - 0.4, B[1] + 1, 1.2]);
  const tail = fn((x, y, z) => {
    const yb = B[1] - 13;
    // ragged: notches cut up into the hem
    const rag = yb + Math.abs(Math.sin(x * 1.9 + 0.7)) * 3.2;
    return Math.max(Math.abs(x - (B[0] - 0.6)) - 2.6, Math.abs(z - 5.4 + (B[1] - y) * 0.06) - 0.75, rag - y, y - (B[1] + 1.5));
  }, [B[0] - 5, B[1] - 18, 2], [B[0] + 4, B[1] + 3, 9]);
  b.add('sash.tail', tail, 'sash', { thr: 0.2 });
  b.paint('sash.tail', capsule([B[0] - 0.6, B[1], 6.3], [B[0] - 0.9, B[1] - 12, 6.4], 0.45), 'sash', { shade: 3, where: b.isMat('sash') });
  const R = ISSHIN_RES;
  return [{ bone: 'sash.tail', tail: [0, -12 / R, 0.4 / R], stiffness: 45, damping: 5, gravity: 12, limit: 60, radius: 0.05 }];
}

// ---------------------------------------------------------------------------------------------- the doctor

/** The chest, waist and hips as one shape (the shirt and the coat are shells round it). */
function chest(L: Landmarks): Sdf {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  return blend(2.6,
    box([0, s.chestY - 0.5, -0.4], [s.chest[0], 6.4, s.chest[1]], { round: 3.2 }),
    box([0, s.waistY, -0.3], [s.waist[0], 4.6, s.waist[1]], { round: 2.8 }),
    box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 3.6, s.hips[1]], { round: 2.4 }),
    capsule([2.6, sy + 1.2, sz - 0.8], [sx - 1.6, sy - 0.2, sz], 3.0, 3.1),
    capsule([-2.6, sy + 1.2, sz - 0.8], [-sx + 1.6, sy - 0.2, sz], 3.0, 3.1),
    sphere([sx, sy - 0.5, sz], 3.3), sphere([-sx, sy - 0.5, sz], 3.3),
    ellipsoid([3.6, s.chestY + 1, s.chest[1] - 0.6], [4, 3.2, 1.9]), ellipsoid([-3.6, s.chestY + 1, s.chest[1] - 0.6], [4, 3.2, 1.9]),
  );
}

/** The dark blue-grey shirt, open at the throat, tucked into the slacks (the coat hides the arms). */
function shirt(b: ModelBuilder, L: Landmarks, torso: Sdf): void {
  const s = L.spec;
  const neck = intersect(ellipsoid([0, s.chinY - 4, 3.2], [2.8, 4.2, 5.5]), halfSpace([0, 0, 0], [0, 0, -1]));
  const shell = subtract(offset(torso, 1.0), offset(torso, -1.0), neck);
  addBands(b, intersect(shell, aabb([-30, s.waistY - 6, -30], [30, 90, 30])), 'shirt', [['hips', s.waistY - 6, s.waistY - 4], ['spine', s.waistY - 5, s.chestY - 4], ['chest', s.chestY - 6, 90]]);
  // the collar standing round the neck, its points open on the chest
  b.add('chest', intersect(torus([0, s.chinY - 4.2, L.headC[2] - 0.8], 3.4, 1.0), halfSpace([0, 0, 2.4], [0, 0, 1])), 'shirt', { thr: 0.2 });
  for (const k of [1, -1]) {
    const pt = smoothPath([[k * 3.3, s.chinY - 3.2, 1.8], [k * 3.1, s.chinY - 5.0, 3.9], [k * 1.9, s.chinY - 7.4, 4.8]], 3);
    b.add('chest', tube(pt, pt.map((_, i) => 1.15 - i * 0.08)), 'shirt', { thr: 0.2 });
  }
  b.paint(['chest', 'spine'], aabb([-0.5, s.waistY - 6, 2], [0.5, s.chinY - 7.5, 10]), 'shirt', { shade: 3, where: b.isMat('shirt') });
}

/** Dark slacks with a belt, a pressed crease, and brown leather shoes. */
function slacks(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [hx, hy, hz] = s.hip;
  const [kx, ky, kz] = L.knee;
  const [ax, ay, az] = L.ankle;
  b.add('hips', box([0, s.hipsY - 0.2, -0.3], [s.hips[0] + 0.9, 4.6, s.hips[1] + 0.9], { round: 2.6 }), 'slacks');
  b.add('hips', box([0, s.waistY - 5.2, -0.3], [s.waist[0] + 1.6, 0.9, s.waist[1] + 1.4], { round: 1 }), 'belt');
  b.add('hips', box([0, s.waistY - 5.2, s.waist[1] + 1.8], [1.2, 0.9, 0.4]), 'buckle');
  b.add('thigh.L', blend(1.4, sphere([hx, hy, hz], 5.0), capsule([hx, hy, hz], [kx, ky + 1, kz], 4.6, 3.8)), 'slacks', { mirror: true });
  b.add('shin.L', blend(1.2, sphere([kx, ky, kz], 3.7), capsule([kx, ky, kz], [ax, ay + 1.6, az], 3.6, 3.4)), 'slacks', { mirror: true });
  b.paint('thigh.L', capsule([hx, hy - 2, hz + 4.8], [kx, ky + 1, kz + 3.9], 0.45), 'slacks', { shade: 0, mirror: true, where: b.isMat('slacks') });
  b.paint('shin.L', torus([ax, ay + 2.6, az], 3.5, 0.45), 'slacks', { shade: 3, mirror: true, where: b.isMat('slacks') });
  const f = s.foot;
  const toeZ = az + f.len - f.heel;
  b.add('foot.L', capsule([ax, ay + 1.2, az - 0.4], [ax, ay - 1, az - 0.4], 2.7), 'shoe', { mirror: true });
  b.add('foot.L', intersect(box([ax, 2.2, az + (f.len / 2 - f.heel)], [f.w / 2, 2.2, f.len / 2], { round: 1.6 }), halfSpace([0, 4.4, toeZ - 3.5], [0, 1, 0.6])), 'shoe', { mirror: true });
  b.paint('foot.L', aabb([ax - 5, 0, az - 8], [ax + 5, 1, az + 14]), 'sole', { mirror: true });
  b.paint('foot.L', capsule([ax - 1.2, 3.6, toeZ - 4], [ax + 1.2, 3.6, toeZ - 4], 0.4), 'shoe', { shade: 0, mirror: true, where: b.isMat('shoe') });
}

/**
 * The white lab coat, open down the front: a shell over the shoulders and chest with notched lapels folded back,
 * a breast pocket with a pen, fitted sleeves with turned-back cuffs, and the skirt to below the knee on spring
 * bones (it flares when he leaps). The shirt shows between the lapels.
 */
function labCoat(b: ModelBuilder, L: Landmarks, torso: Sdf): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  // open front: a V from the collar to the waist, wider at the top where the lapels fold back
  const open = fn((x, y, z) => {
    if (z < 1) return 1;
    const w = 1.6 + Math.max(0, (y - s.waistY) / (s.chinY - s.waistY)) * 3.4;
    return Math.abs(x) - w;
  }, [-12, s.waistY - 8, -2], [12, s.chinY + 2, 12]);
  const shell = subtract(offset(torso, 1.9), offset(torso, 0.4), open);
  addBands(b, intersect(shell, aabb([-30, s.waistY - 6, -30], [30, s.chinY - 1.5, 30])), 'coat', [['hips', s.waistY - 6, s.waistY - 4], ['spine', s.waistY - 5, s.chestY - 4], ['chest', s.chestY - 6, 90]]);
  // the collar round the back of the neck
  b.add('chest', intersect(torus([0, s.chinY - 3.6, L.headC[2] - 1.2], 3.9, 1.1), halfSpace([0, 0, 1.2], [0, 0, 1])), 'coat', { thr: 0.2 });
  // lapels: flat plates folded back from the collar down to the chest, notched near the top
  for (const k of [1, -1]) {
    const lap = prism([[0, 0], [3.4, 0.6], [2.6, -4.2], [0.6, -9.5]], [k * 2.2, s.chinY - 4.6, 6.4], [k, 0, 0], [0, 1, 0], 0.55);
    b.add('chest', subtract(lap, box([k * 4.9, s.chinY - 5.6, 6.4], [0.8, 0.7, 2])), 'coat', { thr: 0.2 });
  }
  // the breast pocket on the left, a pen clipped in it
  b.add('chest', box([5.4, s.chestY - 0.6, s.chest[1] + 2.1], [2, 1.9, 0.45]), 'coat', { shade: 2 });
  b.add('chest', box([6.2, s.chestY + 1.6, s.chest[1] + 2.5], [0.4, 1.6, 0.4]), 'pen');
  b.add('chest', box([6.2, s.chestY + 2.9, s.chest[1] + 2.5], [0.4, 0.4, 0.4]), 'penCap');
  // sleeves: fitted, a fold at the elbow, the cuffs turned back
  b.add('upperarm.L', blend(1.4, sphere([sx, sy - 1.1, sz], 3.6), capsule([sx, sy - 1.2, sz], [sx, ey + 0.5, sz], 3.4, 3.0)), 'coat', { mirror: true });
  b.add('forearm.L', blend(1.2, sphere([sx, ey, sz], 3.2), capsule([sx, ey - 0.5, sz], [sx, wy + 1.4, sz], 3.2, 2.9)), 'coat', { mirror: true });
  b.add('forearm.L', cylinder([sx, wy + 0.6, sz], [sx, wy + 2.6, sz], 3.25), 'coat', { mirror: true });
  b.paint('forearm.L', cylinder([sx, wy + 2.4, sz], [sx, wy + 2.8, sz], 3.5), 'coat', { shade: 3, mirror: true, where: b.isMat('coat') });
  b.add('forearm.L', capsule([sx, wy + 3, sz], [sx, wy - 0.4, sz], 1.7), 'skin', { mirror: true, only: 'empty' });
  b.paint('upperarm.L', capsule([sx + 3, ey + 2.5, sz + 1.6], [sx + 3.2, ey - 0.5, sz - 1.4], 0.55), 'coat', { shade: 3, mirror: true, where: b.isMat('coat') });
  // the skirt to below the knee, open at the front
  const skirt = coatSkirt(b, L, { mat: 'coat', lining: 'coat', yTop: s.waistY - 3, yHem: L.knee[1] - 7, r0: 9.6, r1: 12.4, openFront: 14, overlap: 3, depth: 0.82 });
  // two pockets low on the front panels
  for (const k of [1, -1]) b.paint(`coat.F.${k > 0 ? 'L' : 'R'}`, box([k * 6.6, s.hipsY - 3, 6.2], [2.4, 2.2, 3]), 'coat', { shade: 2, where: b.isMat('coat') });
  return skirt;
}

// ---------------------------------------------------------------------------------------------- Engetsu

/**
 * Engetsu: a plain tachi (blade 36 voxels, a gentle curve), the habaki, a hexagonal dark-bronze guard, the red
 * wrap with rayskin diamonds, a bronze pommel cap and the blue tassel off its ring. Origin at the grip, blade
 * along +Z, edge toward −Y.
 */
function buildEngetsu(): VoxelModel {
  const b = new ModelBuilder('engetsu', 48);
  b.mat('steel', ['#E7EAEE', '#CFD3D8', '#AEB3BA', '#8E949C'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#F3F3F0'], { rough: 0.12, metal: 0.8 });
  b.mat('bronze', ['#8A7C56', '#6E6242', '#5E5236', '#463C26'], { base: 2, rough: 0.35, metal: 0.75, shadeK: 0.8 });
  b.mat('wrap', ['#B8383A', '#9E2A2A', '#7A1E1F'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#E9E3D6']);
  b.mat('tassel', ['#7BC0E8', '#4FA3D8', '#3A82B4', '#2A6290'], { base: 1, rough: 0.85 });
  b.bone('root', null, [0, 0, 0]);
  const z0 = 6.6, len = 36, zTip = z0 + len, zEnd = zTip - 3.4;
  const curve = (z: number) => ((z - z0) / len) ** 2 * 1.4;
  b.add('root', fn((x, y, z) => {
    if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
    const c = curve(z);
    const top = 0.9 + c, bot = -1.1 + c + Math.max(0, z - zEnd) * 0.58;
    return Math.max(Math.abs(x) - 0.5, y - top, bot - y, z0 - z, z - zTip);
  }, [-2, -3, z0 - 1], [2, 5, zTip + 1]), 'steel', { thr: 0.3 });
  b.paint('root', fn((_x, y, z) => y - (-0.62 + curve(z) + Math.max(0, z - zEnd) * 0.58), [-2, -3, 0], [2, 5, zTip + 1]), 'edge');
  // the hamon: a soft line along the blade
  b.paint('root', fn((_x, y, z) => Math.abs(y - (-0.2 + curve(z) + Math.sin(z * 0.9) * 0.15)) - 0.2, [-2, -3, z0 + 1], [2, 5, zEnd]), 'steel', { shade: 0, where: b.isMat('steel') });
  b.add('root', box([0, -0.05, 6.2], [0.85, 1.3, 0.5]), 'bronze'); // habaki
  // the guard: a flat hexagon, two small holes
  const tz = 5.3, g = 2.9;
  const hex: [number, number][] = [];
  for (let i = 0; i < 6; i++) hex.push([Math.cos((i / 6) * Math.PI * 2 + Math.PI / 6) * g, Math.sin((i / 6) * Math.PI * 2 + Math.PI / 6) * g]);
  b.add('root', prism(hex, [0, 0, tz], [1, 0, 0], [0, 1, 0], 0.55), 'bronze');
  for (const k of [-1, 1]) b.carve('root', cylinder([k * 1.6, 0.4, tz - 1], [k * 1.6, 0.4, tz + 1], 0.5));
  b.paint('root', fn((x, y, z) => (Math.abs(z - tz) > 0.6 ? 1 : Math.abs(Math.hypot(x, y) - 2.1) - 0.3), [-4, -4, tz - 1], [4, 4, tz + 1]), 'bronze', { shade: 3, where: b.isMat('bronze') });
  // the wrap with its diamonds, a collar and the pommel cap with a ring
  b.add('root', box([0, 0, -0.9], [1.1, 1.25, 5.8], { round: 0.5 }), 'wrap');
  b.paint('root', fn((_x, y, z) => Math.abs(((Math.abs(y) + z) % 2.6 + 2.6) % 2.6 - 1.3) - 0.42, [-2, -2, -6.6], [2, 2, 4.6]), 'ray', { where: b.isMat('wrap') });
  b.add('root', box([0, 0, 4.5], [1.2, 1.35, 0.45], { round: 0.3 }), 'bronze');
  b.add('root', box([0, 0, -7], [1.25, 1.4, 0.55], { round: 0.35 }), 'bronze');
  b.add('root', torus([0, -1.4, -7.7], 0.75, 0.3, [0, 90, 0]), 'bronze', { thr: 0.25 });
  // the tassel: a cord, a knot, the fringe
  const cord = smoothPath([[0, -1.9, -7.9], [0, -3.8, -8.9], [0, -5.6, -9.4]], 3);
  b.add('root', tube(cord, cord.map(() => 0.45)), 'tassel', { thr: 0.2 });
  b.add('root', ellipsoid([0, -6.2, -9.5], [0.95, 0.95, 0.95]), 'tassel');
  b.add('root', cylinder([0, -6.6, -9.6], [0, -12, -10.4], 1.0, 1.6), 'tassel', { thr: 0.25 });
  b.paint('root', fn((x) => Math.abs(((x + 20) % 0.9) - 0.45) - 0.2, [-3, -13, -12], [3, -6.8, -8]), 'tassel', { shade: 3, where: b.isMat('tassel') });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** The scabbard: black lacquer with bronze fittings and two hanger mounts for the cords. Origin at the mouth, +Z. */
function buildSaya(): VoxelModel {
  const b = new ModelBuilder('engetsu-saya', 48);
  b.mat('lacquer', ['#2E2E36', '#222228', '#18181C', '#141418'], { base: 1, rough: 0.28, shadeK: 0.8 });
  b.mat('bronze', ['#8A7C56', '#6E6242', '#5E5236', '#463C26'], { base: 2, rough: 0.35, metal: 0.75 });
  b.mat('cord', ['#3A3A44', '#26262D'], { base: 1, rough: 0.85 });
  b.bone('root', null, [0, 0, 0]);
  const L = 37.5;
  const curve = (z: number) => (z / L) ** 2 * 1.4;
  b.add('root', fn((x, y, z) => {
    const c = curve(Math.max(0, z));
    return Math.max(Math.hypot(x / 1.0, (y - c) / 1.65) - 1, -z, z - L);
  }, [-2, -3, -1], [2, 5, L + 1]), 'lacquer');
  b.add('root', box([0, 0, 0.4], [1.3, 1.95, 0.6], { round: 0.3 }), 'bronze');
  b.add('root', box([0, curve(L - 0.3), L - 0.3], [1.15, 1.8, 0.6], { round: 0.4 }), 'bronze');
  // tachi hangers on the back (the edge side faces down when worn): two mounts and their cords
  for (const z of [3.5, 10]) {
    b.add('root', box([0, 1.9 + curve(z), z], [1.2, 0.7, 0.8], { round: 0.3 }), 'bronze');
    b.add('root', capsule([0, 2.4 + curve(z), z], [0, 4.6 + curve(z), z + 0.6], 0.5), 'cord', { thr: 0.25 });
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}
