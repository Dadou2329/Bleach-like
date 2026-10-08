// Meninas McAllon (docs/roster/H3-sternritter-2.md § Meninas McAllon; kit docs/kits/meninas.md). Brief: 191 cm → 92
// vox at 48/m (head 13, ≈ 1/7); the tallest of the Bambies, slender and long-limbed. Silhouette keys: long wavy pink hair
// to the waist with short blunt bangs; the white peaked cap turned sideways (the peak over her right ear); a huge
// purple bow at the throat with the white Zeichen on its knot; the closed white jacket, a frilled skirt over dark
// leggings, white gloves with frilled cuffs, white boots to below the knee with frilled tops. Face: big pink eyes under
// long lashes, a small soft mouth — dreamy. Trim: gold buttons, the black belt, the pink heart case on her left hip.
// Forms: 'base'; 'pornipora' (Quincy: Vollständig, anime look: wings of four big pink hearts stacked down each side,
// each on the wing's bone; the spiky star halo is a prop); 'sklaverei' (the same with heart-shaped kneeguards and a
// heart-shaped chestplate; anime-only). The Power: 'muscle.upper' / 'muscle.fore' props, the swollen bicep and forearm
// (the fist inside a swollen glove), set on the 'bicep.*' and 'fore.*' sockets and swelled by scale. Props at 48 vox/m:
// 'dumbbell' (the pink reishi dumbbell, along +Z), 'baton' (its handle stretched into a staff), 'halteres' (one turned into
// a huge broad blade), 'bow' (the small heart bow), 'heart' (a heart arrowhead), 'halo'.
// (verify) the leggings' colour (a dark plum here); the heart case's side (her left); pink eyes (ch. 640 shows green).
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, intersect, prism, smoothPath, sphere, spike, subtract, tube, type Sdf, type V3 } from '../models/sdf';
import { addBands, faceLegend, hands, head, humanoidSkeleton, type HumanoidSpec, type Landmarks } from './humanoid';
import { frontOf } from './sternritter';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

/** 92 voxels = 1.91 m */
export const MENINAS_RES = 92 / 1.91;
export type MeninasForm = 'base' | 'pornipora' | 'sklaverei';

/** Tall, slender, long-limbed. */
const SPEC: HumanoidSpec = {
  H: 92,
  chinY: 78.2,
  head: { w: 10.4, d: 11.4, h: 13 },
  neckR: 2.1,
  shoulder: [8.6, 71.8, -0.5],
  upperArm: 15.2,
  foreArm: 13.8,
  hand: 8.4,
  armR: 2.0,
  hipsY: 48.6,
  hip: [5.2, 45.8, 0],
  kneeY: 25.8,
  ankleY: 5.2,
  chest: [6.8, 4.5],
  waist: [5.0, 3.5],
  hips: [7.8, 5.1],
  chestY: 65.0,
  waistY: 56.6,
  foot: { len: 11.6, w: 4.4, heel: 2.9 },
};
const BUST_Y = SPEC.chestY - 2.2;

const PINK_RAMP = ['#FFE6F2', '#FFC2DE', '#FF9ECB', '#FF7EB8', '#E0408A'];

function palette(b: ModelBuilder, form: MeninasForm): void {
  b.mat('skin', ['#FDEBE0', '#F9E1D2', '#EECDBC', '#E0B8A4', '#C99C88'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#FFD3E6', '#FAB4D2', '#F59CC4', '#E583B0', '#D46E9E', '#B4527F'], { base: 2, rough: 0.45, shadeK: 0.85, dither: 0.04 });
  b.mat('brow', ['#B4527F']);
  b.mat('lid', ['#5A2A44']);
  b.mat('sclera', ['#F3F3F0']);
  b.mat('iris', ['#E0609A']);
  b.mat('irisD', ['#8E2A5C']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#C26A7E']);
  b.mat('coat', ['#F3F3F0', '#F1F2EF', '#DDE0E4', '#C9CCD3', '#A4ABB8'], { base: 1, rough: 0.75, shadeK: 0.9 });
  b.mat('coatIn', ['#D9DCE2', '#C3C8D0', '#A5ACB8'], { base: 1, rough: 0.8 });
  b.mat('legging', ['#4A3E56', '#3C3247', '#30283A', '#26202E'], { base: 1, rough: 0.6, shadeK: 0.85 });
  b.mat('belt', ['#2A2A31', '#1E1E24', '#17171B'], { base: 1, rough: 0.4 });
  b.mat('bow', ['#A877E0', '#8E5BCC', '#7A3FB7', '#62309A', '#4C2378'], { base: 2, rough: 0.5, shadeK: 0.9 });
  b.mat('heart', ['#FFB8D8', '#FF8EC0', '#FF6FAE', '#D84E8C'], { base: 1, rough: 0.25, metal: 0.3 });
  b.mat('gold', ['#E8C866', '#C9A641', '#9E7C26'], { base: 1, rough: 0.3, metal: 0.75 });
  b.mat('peak', ['#2A2A31', '#1E1E24', '#17171B'], { base: 1, rough: 0.25, metal: 0.2 });
  b.mat('sole', ['#9AA2AE', '#7F8794', '#666E7A'], { base: 1, rough: 0.6 });
  if (form !== 'base') b.mat('reishi', PINK_RAMP, { base: 3, rough: 0.3, glow: 0.4, dither: 0 });
}

/** Big round pink eyes (no white showing) under soft lashes, a small open mouth: dreamy. Rows 9 → 0. */
const FACE = [
  '. . . . . . . . . .',
  '. . B B . . B B . .',
  '. L L L . . L L L .',
  'L I I I . . I I I L',
  '. I * i . . i * I .',
  '. . I I . . I I . .',
  '. . . . . . . . . .',
  '. . . . . s . . . .',
  '. . . . m m . . . .',
  '. . . . . . . . . .',
]

const assetCache = new Map<MeninasForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function meninasAsset(form: MeninasForm = 'base'): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildMeninas(form)));
  return a;
}

/**
 * 'muscle.upper' / 'muscle.fore' (authored along −Y from the socket, as the arm hangs in the bind pose), 'dumbbell'
 * (grip at the origin, the bar along ±X), 'baton' (grip at the origin, the staff along ±Z), 'halteres' (grip at the
 * origin, the blade along +Z), 'bow' (the heart grip at the origin, the limbs along ±Z curling to +Y), 'heart' (pointing
 * +Z), 'halo' (facing +Z).
 */
export type MeninasProp = 'muscle.upper' | 'muscle.fore' | 'dumbbell' | 'baton' | 'halteres' | 'bow' | 'heart' | 'halo';

export function meninasProp(kind: MeninasProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'muscle.upper' ? buildMuscle(false) : kind === 'muscle.fore' ? buildMuscle(true) : kind === 'dumbbell' ? buildDumbbell()
      : kind === 'baton' ? buildBaton() : kind === 'halteres' ? buildHalteres() : kind === 'bow' ? buildBow() : kind === 'heart' ? buildHeart() : buildHalo();
    propCache.set(kind, m);
  }
  return m;
}

/** the baton's half-length and the halteres' blade length (m) */
export const BATON_HALF = 44 / 48;
export const HALTERES_LEN = 62 / 48;
/** the wing bones */
export const WING_BONES = ['wing.L', 'wing.R'];

export function buildMeninas(form: MeninasForm = 'base'): CharacterAsset {
  const b = new ModelBuilder(`meninas-${form}`, MENINAS_RES);
  palette(b, form);
  const s = SPEC;
  const L = humanoidSkeleton(b, s);
  const [wx, wy, wz] = L.wrist;
  const [sx, sy, sz] = s.shoulder;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.4, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.4, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.5, wy - 4.8, wz + 0.9]);
  b.socket('palm.L', 'palm.L', [wx - 0.5, wy - 4.8, wz + 0.9]);
  // the swollen muscles sit over the middle of the upper arm and the forearm
  b.socket('bicep.R', 'upperarm.R', [-sx, sy - 1.2, sz]);
  b.socket('bicep.L', 'upperarm.L', [sx, sy - 1.2, sz]);
  b.socket('fore.R', 'forearm.R', [-L.elbow[0], L.elbow[1] - 0.6, L.elbow[2]]);
  b.socket('fore.L', 'forearm.L', [L.elbow[0], L.elbow[1] - 0.6, L.elbow[2]]);
  b.socket('back', 'chest', [0, s.chestY + 2, -8]);
  b.socket('chest.front', 'chest', [0, BUST_Y + 2, s.chest[1] + 3]);
  b.socket('toe.R', 'foot.R', [-L.ankle[0], 2, L.ankle[2] + s.foot.len - s.foot.heel]);
  b.socket('toe.L', 'foot.L', [L.ankle[0], 2, L.ankle[2] + s.foot.len - s.foot.heel]);
  b.socket('heart', 'hips', [s.hips[0] + 1.8, s.hipsY + 2.4, 0.8]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('eye.L', 'head', [2.5, s.chinY + 5.5, hd.front + 0.3]);
  b.socket('eye.R', 'head', [-2.5, s.chinY + 5.5, hd.front + 0.3]);
  b.socket('halo', 'head', [0, s.chinY + 23, hd.front - s.head.d - 3]);
  for (const k of [-1, 1]) b.carve('head', box([k * 5.6, hd.chin + 1.2, hd.front - 2], [0.9, 2.2, 3], { rot: [0, 0, k * 18] }));
  const hair = hairDo(b, L, hd);
  sidewaysCap(b, L, hd);
  b.paint('head', aabb([-4.6, hd.chin + 0.5, hd.front - 1.5], [4.6, hd.chin + 10, hd.front + 1]), 'skin', { shade: 1, where: b.isMat('skin') });
  b.paint('head', aabb([-5.6, hd.chin - 1, hd.front - 5], [5.6, hd.chin + 3.5, hd.front + 1]), 'skin', { shade: 0, where: b.isMat('skin') });
  b.stamp('head', hd.x0, hd.chin + 9, FACE, faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  hands(b, L, 'coat', 1.1);
  const torso = body(b, L);
  const coat = uniform(b, L, torso);
  throatBow(b, L);
  legs(b, L);
  const springs = [...hair.springs, ...coat.springs];
  const colliders = [...hair.colliders, ...coat.colliders];
  if (form !== 'base') heartWings(b, L);
  if (form === 'sklaverei') heartArmour(b, L);
  b.autoShade();
  b.lint();
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- the head

/**
 * The hair: full over the crown under the sideways cap, short blunt bangs, a wavy lock down each side of the face to the
 * bust, and the long wavy mass down the back to the waist on three spring bones, the ends curling.
 */
function hairDo(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const c = hd.chin, front = hd.front;
  const R = MENINAS_RES;
  const hw = s.head.w / 2;
  const cz = L.headC[2];
  const mass = subtract(
    intersect(ellipsoid([0, c + 8.2, cz - 1.0], [hw + 2.4, 6.6, s.head.d / 2 + 2.2]), fn((_x, y) => c + 1.5 - y, [-14, c - 2, -14], [14, c + 18, 14])),
    fn((x, y, z) => Math.max(z - (front + 4), (front - 3) - z, y - (c + 9.6), Math.abs(x) - (hw - 0.4)), [-12, c - 4, front - 5], [12, c + 13, front + 5]),
  );
  b.add('head', mass, 'hair', { only: 'empty', thr: 0.2 });
  for (const k of [1, -1]) b.add('head', ellipsoid([k * (hw + 1.6), c + 2.8, cz - 2.6], [2.6, 6.6, 3.6]), 'hair', { only: 'empty', thr: 0.2 });
  // short blunt bangs, cut straight across above the brows
  b.add('head', fn((x, y, z) => Math.max(Math.abs(x) - (hw + 0.8), c + 9.8 - y, y - (c + 13.2), Math.abs(z - (front + 0.1)) - 0.8 - Math.max(0, y - (c + 11.6)) * 0.5), [-8, c + 8, front - 3], [8, c + 15, front + 3]), 'hair', { thr: 0.2 });
  // a wavy lock down each side of the face to the bust
  for (const k of [1, -1]) {
    const lk = smoothPath([[k * (hw + 0.8), c + 10, front - 2.2], [k * (hw + 1.8), c + 4, front - 2.0], [k * (hw + 1.2), c - 2, front - 2.4], [k * (hw + 2.2), c - 8, front - 2.2], [k * (hw + 1.4), c - 14, front - 1.8]], 4);
    b.add('head', tube(lk, lk.map((_, i) => 1.9 - i * 0.03)), 'hair', { thr: 0.3 });
  }
  b.carve('head', aabb([-4.7, c + 0.5, front + 0.01], [4.7, c + 9.8, front + 6]));
  b.paint('head', aabb([-4.7, c + 0.5, front - 3], [4.7, c + 9.8, front]), 'skin', { where: b.isMat('hair') });
  // the long wavy mass down the back
  const backZ = cz - s.head.d / 2;
  const yTop = c + 9, yBot = s.waistY - 6;
  const zc = (y: number) => {
    const t = Math.max(0, Math.min(1, (yTop - y) / (yTop - yBot)));
    return backZ - 0.8 - Math.sin(Math.min(1, t * 2.4) * Math.PI * 0.5) * 2.2 + t * 0.6;
  };
  const sheet = fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (yTop - y) / (yTop - yBot)));
    const w = 8.6 + Math.sin(t * Math.PI) * 2.0 + Math.sin(y * 0.5) * 0.6;
    const bot = yBot + Math.abs(Math.sin(x * 0.7)) * 3.0;
    const wave = Math.sin(y * 0.55 + x * 0.3) * 0.6;
    return Math.max(Math.abs(x) - w, Math.abs(z - zc(y) - wave) - (2.4 - t * 0.5), y - yTop, bot - y);
  }, [-13, yBot - 1, backZ - 13], [13, yTop + 1, backZ + 3]);
  const p1: V3 = [0, c + 5, backZ - 1.2], p2: V3 = [0, s.chestY + 4, zc(s.chestY + 4)], p3: V3 = [0, s.waistY + 2, zc(s.waistY + 2)];
  const bones: [string, string, V3, number, number][] = [['hair1', 'head', p1, p2[1] - 0.5, 200], ['hair2', 'hair1', p2, p3[1] - 0.5, p2[1] + 0.5], ['hair3', 'hair2', p3, -100, p3[1] + 0.5]];
  for (const [name, parent, pivot, y0, y1] of bones) {
    b.bone(name, parent, pivot);
    b.add(name, intersect(sheet, aabb([-24, y0, -30], [24, y1, 10])), 'hair', { thr: 0.25 });
  }
  for (const k of [1, -1]) {
    const curl = smoothPath([[k * 8.2, yBot + 4, zc(yBot + 4)], [k * 10.2, yBot + 0.8, zc(yBot) + 1.0], [k * 11.0, yBot + 2.8, zc(yBot) + 2.0]], 3);
    b.add('hair3', tube(curl, curl.map((_, i) => 1.8 - i * 0.1)), 'hair', { thr: 0.3 });
  }
  // the waves: long diagonal bands of shade down the mass
  const bands = (x: number, y: number) => Math.abs(((x + Math.sin(y * 0.22) * 1.4 + 60) % 3.0) - 1.5) - 0.38;
  b.paint(['hair1', 'hair2', 'hair3'], fn((x, y) => bands(x, y), [-14, yBot - 3, backZ - 14], [14, yTop + 2, backZ + 3]), 'hair', { shade: 4, where: b.isMat('hair') });
  b.paint('head', fn((x, y, z) => (z > front - 3 && Math.abs(x) < 4.9 ? 1 : bands(x, y)), [-14, c - 16, -14], [14, c + 17, 14]), 'hair', { shade: 4, where: b.isMat('hair') });
  b.paint('head', ellipsoid([0, c + 13.6, cz - 1.0], [4.0, 1.4, 4.4]), 'hair', { shade: 0, where: b.isMat('hair') });
  const tip: V3 = [0, yBot, zc(yBot)];
  const springs: SpringDef[] = [
    { bone: 'hair1', tail: [(p2[0] - p1[0]) / R, (p2[1] - p1[1]) / R, (p2[2] - p1[2]) / R], stiffness: 44, damping: 5, gravity: 11, limit: 32, radius: 0.09 },
    { bone: 'hair2', tail: [(p3[0] - p2[0]) / R, (p3[1] - p2[1]) / R, (p3[2] - p2[2]) / R], stiffness: 32, damping: 4.5, gravity: 12, limit: 42, radius: 0.09 },
    { bone: 'hair3', tail: [(tip[0] - p3[0]) / R, (tip[1] - p3[1]) / R, (tip[2] - p3[2]) / R], stiffness: 24, damping: 4, gravity: 13, limit: 52, radius: 0.08 },
  ];
  const colliders: ColliderDef[] = [
    { bone: 'chest', offset: [0, 0.05, -0.02], radius: 0.15 },
    { bone: 'spine', offset: [0, 0, -0.02], radius: 0.12 },
    { bone: 'hips', offset: [0, -0.04, -0.03], radius: 0.15 },
  ];
  return { springs, colliders };
}

/** The peaked cap turned sideways: the white crown flaring to its top, the gold band, the black peak over her right ear. */
function sidewaysCap(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): void {
  const s = L.spec;
  const c = hd.chin;
  const cz = L.headC[2] - 0.6;
  const hw = s.head.w / 2 + 0.8, hd2 = s.head.d / 2 + 0.6;
  const yb = c + 12.2;
  const H = 3.6;
  const crown = fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (y - yb) / H));
    const rx = hw + 0.8 + t * 1.0, rz = hd2 + 0.8 + t * 1.2;
    return Math.max(Math.hypot(x / rx, (z - cz) / rz) - 1, yb - y, y - (yb + H));
  }, [-14, yb - 1, cz - 14], [14, yb + 7, cz + 14]);
  b.add('head', crown, 'coat', { thr: 0.2 });
  b.carve('head', fn((x, y, z) => Math.max(Math.hypot(x / (hw + 0.4), (z - cz) / (hd2 + 0.2)) - 1, yb + 0.6 - y, y - (yb + 2.6)), [-12, yb, cz - 12], [12, yb + 4, cz + 12]));
  b.paint('head', fn((_x, y) => Math.abs(y - (yb + 0.5)) - 0.55, [-14, yb - 1, cz - 14], [14, yb + 2, cz + 14]), 'gold', { where: b.isMat('coat') });
  // the peak, out over her right ear and angled down
  const px = -(hw + 0.4);
  b.add('head', fn((x, y, z) => {
    const u = (px - x) / 3.8;
    if (u < -0.3 || u > 1) return 1;
    const w = hd2 * 0.85 * Math.sqrt(Math.max(0, 1 - u * u * 0.8));
    return Math.max(Math.abs(z - cz) - w, Math.abs(y - (yb + 0.1 - u * 1.4)) - 0.45);
  }, [px - 6, yb - 4, cz - 10], [px + 2, yb + 2, cz + 10]), 'peak', { thr: 0.2 });
  // the Zeichen on the crown above the peak
  const g = b.grid('head');
  const rows = ['. X .', 'X X X', 'X . X'];
  rows.forEach((row, r) => row.split(' ').forEach((ch, ci) => {
    if (ch !== 'X') return;
    const z = Math.round(cz) + ci - 1, y = Math.round(yb + 3.0 - r);
    for (let x = -20; x < 0; x++) if (g.get(x, y, z) !== 0) {
      b.voxel('head', x, y, z, 'gold', 0);
      break;
    }
  }));
}

// ---------------------------------------------------------------------------------------------- body and clothes

/** The torso in the jacket: a small waist, the bust; the arms in long sleeves under white gloves with frilled cuffs. */
function body(b: ModelBuilder, L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const torso = blend(1.0,
    blend(2.6,
      box([0, s.chestY - 0.5, -0.3], [cx, 5.8, cz], { round: 3 }),
      box([0, s.waistY - 0.5, -0.2], [wx, 4.4, wz], { round: 2.6 }),
      box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 3.8, s.hips[1]], { round: 2.6 }),
      capsule([2.3, sy + 1.4, sz - 0.7], [sx - 1.3, sy - 0.2, sz], 2.4, 2.5), capsule([-2.3, sy + 1.4, sz - 0.7], [-sx + 1.3, sy - 0.2, sz], 2.4, 2.5),
      sphere([sx, sy - 0.5, sz], 2.8), sphere([-sx, sy - 0.5, sz], 2.8)),
    ellipsoid([3.0, BUST_Y, cz + 0.6], [3.4, 3.1, 3.2]), ellipsoid([-3.0, BUST_Y, cz + 0.6], [3.4, 3.1, 3.2]));
  addBands(b, torso, 'coat', [['hips', 30, 52], ['spine', 52, 60], ['chest', 60, 110]]);
  b.add('neck', capsule([0, s.chinY - 5, L.headC[2] - 0.5], [0, s.chinY + 2, L.headC[2] - 0.5], s.neckR), 'skin');
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(1.2, sphere([sx, sy - 0.5, sz], 3.0), capsule([sx, sy - 1, sz], [sx, ey + 0.5, sz], 2.55, 2.3)), 'coat', { mirror: true });
  b.add('forearm.L', blend(1.1, sphere([sx, ey, sz], 2.3), capsule([sx, ey - 0.5, sz], [sx, wy + 1.6, sz], 2.25, 2.05)), 'coat', { mirror: true });
  // the glove's frilled cuff at mid-forearm: a ruffled ring, lined
  const fy = wy + 5.2;
  b.add('forearm.L', fn((x, y, z) => {
    const a = Math.atan2(z - sz, x - sx);
    const r = 3.0 + Math.sin(a * 6) * 0.35;
    return Math.max(Math.abs(Math.hypot(x - sx, z - sz) - r + 0.4) - 0.65, Math.abs(y - fy) - 0.9);
  }, [sx - 6, fy - 2, sz - 6], [sx + 6, fy + 2, sz + 6]), 'coat', { mirror: true, thr: 0.2 });
  b.paint('forearm.L', fn((x, y, z) => Math.max(Math.hypot(x - sx, z - sz) - 2.9, Math.abs(y - fy) - 1.2), [sx - 6, fy - 2, sz - 6], [sx + 6, fy + 2, sz + 6]), 'coatIn', { mirror: true, where: b.isMat('coat') });
  return torso;
}

/**
 * The jacket closed to a stand collar with gold buttons, the black belt with the pink heart case on her left hip, and
 * the frilled skirt below: six spring panels flaring to mid-thigh, a ruffle round the hem.
 */
function uniform(b: ModelBuilder, L: Landmarks, torso: Sdf): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const nz = L.headC[2] - 0.8;
  const collar = fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (y - (sy - 0.5)) / (s.chinY - sy)));
    const r = s.neckR + 1.4 + t * 0.5;
    return Math.max(Math.abs(Math.hypot(x, (z - nz) * 1.08) - r) - 0.6, y - (s.chinY - 2.0), sy - 1 - y);
  }, [-9, sy - 2, nz - 9], [9, s.chinY + 1, nz + 9]);
  b.add('chest', collar, 'coat');
  for (const y of [BUST_Y - 3.6, s.waistY + 2.4, s.waistY - 0.6]) {
    const yy = Math.round(y);
    const at = frontOf(b, ['chest', 'spine'], 0, yy);
    if (at) b.voxel(at.bone, 0, yy, at.z + 1, 'gold', 0);
  }
  b.paint(['chest', 'spine'], fn((x, _y, z) => Math.max(Math.abs(x) - 0.4, 1.5 - z), [-10, s.waistY - 4, -10], [10, sy, 10]), 'coat', { shade: 3, where: b.isMat('coat') });
  for (const k of [1, -1]) b.paint(['chest', `upperarm.${k > 0 ? 'L' : 'R'}`], capsule([k * 3.4, sy + 2.2, sz - 0.6], [k * (sx + 1.3), sy + 0.6, sz], 0.45), 'coat', { shade: 3, where: b.isMat('coat') });
  // the belt, its gold buckle, the heart case on her left hip hung from a ring
  const by = s.hipsY + 3.2;
  b.add('spine', intersect(fn((x, y, z) => Math.max(torso.d(x, y, z) - 1.2, 0.2 - torso.d(x, y, z)), [-14, by - 2, -12], [14, by + 2, 12]), aabb([-20, by - 0.9, -20], [20, by + 0.9, 20])), 'belt');
  const bz = frontOf(b, ['spine'], 0, Math.round(by))?.z ?? 5;
  b.add('spine', box([0, by, bz + 0.2], [1.3, 1.0, 0.5]), 'gold');
  const heart: [number, number][] = [[0, -2.2], [2.1, 0.1], [2.2, 1.2], [1.4, 1.9], [0.5, 1.6], [0, 1.0], [-0.5, 1.6], [-1.4, 1.9], [-2.2, 1.2], [-2.1, 0.1]];
  const hc: V3 = [s.hips[0] + 1.8, by - 3.3, 0.8];
  b.add('hips', prism(heart.map(([u, v]) => [u * 1.2, v * 1.2]), hc, [0, 0, -1], [0, 1, 0], 0.8, 0.25), 'heart', { thr: 0.2 });
  b.add('hips', capsule([hc[0] - 0.4, hc[1] + 2.5, hc[2]], [hc[0] - 0.9, by - 0.5, hc[2]], 0.45), 'gold', { thr: 0.2 });
  b.add('hips', box([0, s.hipsY - 0.5, -0.3], [s.hips[0] + 0.3, 3.4, s.hips[1] + 0.3], { round: 2.0 }), 'legging');
  return frillSkirt(b, L, { yTop: by - 0.6, yHem: 33.5, r0: 8.4, r1: 11.4 });
}

/** The frilled skirt: six panels on single spring bones (coat.F/S/B.L/R), a ruffle round the hem, lined. */
function frillSkirt(b: ModelBuilder, L: Landmarks, o: { yTop: number; yHem: number; r0: number; r1: number }): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const R = MENINAS_RES;
  const cz = -0.5;
  const kz = 0.8;
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
      // the ruffle: the last two voxels of the hem fluted outward
      const flute = y < o.yHem + 2.2 ? Math.sin(th * 18) * 0.7 + 0.6 : 0;
      const dr = Math.abs(rho - rad(y) - dR - flute) - 0.85;
      let da = 0;
      const lo = Math.min(a0, a1), hi = Math.max(a0, a1);
      if (th < lo) da = (lo - th) * rho;
      else if (th > hi) da = (th - hi) * rho;
      return Math.max(dr, da, y - o.yTop, o.yHem - y);
    }, [-o.r1 - 4, o.yHem - 1, cz - o.r1 - 4], [o.r1 + 4, o.yTop + 1, cz + o.r1 + 4]);
    b.add(bone, shell, 'coat');
    b.paint(bone, fn((x, y, z) => Math.hypot(x, (z - cz) / kz) - (rad(y) + dR - 0.15), [-o.r1 - 4, o.yHem - 2, cz - o.r1 - 4], [o.r1 + 4, o.yTop + 1, cz + o.r1 + 4]), 'coatIn', { where: b.isMat('coat') });
    b.paint(bone, fn((_x, y) => Math.abs(y - (o.yHem + 2.6)) - 0.45, [-o.r1 - 4, o.yHem - 1, cz - o.r1 - 4], [o.r1 + 4, o.yHem + 4, cz + o.r1 + 4]), 'coatIn', { where: b.isMat('coat') });
    const hem: V3 = [Math.sin(am) * rad(o.yHem + 1), o.yHem + 1, cz + Math.cos(am) * rad(o.yHem + 1) * kz];
    springs.push({ bone, tail: [(hem[0] - pivot[0]) / R, (hem[1] - pivot[1]) / R, (hem[2] - pivot[2]) / R], stiffness: 80, damping: 6, gravity: 10, limit: 40, radius: 0.09 });
  });
  const colliders: ColliderDef[] = [
    { bone: 'thigh.L', offset: [0, -0.08, 0.01], radius: 0.085 },
    { bone: 'thigh.R', offset: [0, -0.08, 0.01], radius: 0.085 },
  ];
  return { springs, colliders };
}

/** The huge purple bow at her throat: two big loops, the knot with the white Zeichen, two tails down the chest. */
function throatBow(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const y = s.chinY - 3.4;
  const z = L.headC[2] + 4.2;
  b.add('chest', box([0, y, z], [1.6, 1.5, 1.2], { round: 0.6 }), 'bow', { thr: 0.2, shade: 1 });
  for (const k of [1, -1]) {
    const loop = fn((x, yy, zz) => {
      const u = (x - k * 4.2) / 3.6, v = (yy - (y + 0.6)) / 2.5;
      const ring = Math.abs(Math.hypot(u, v) - 0.72) * 3.0 - 0.6;
      return Math.max(ring, Math.abs(zz - (z - 0.4 + Math.abs(x) * 0.12)) - 1.0);
    }, [k * 4.2 - 5, y - 4, z - 4], [k * 4.2 + 5, y + 5, z + 4]);
    b.add('chest', loop, 'bow', { thr: 0.2 });
    b.add('chest', ellipsoid([k * 4.2, y + 0.6, z - 0.6 + 0.5], [2.2, 1.5, 0.7]), 'bow', { thr: 0.2, shade: 3 });
    const tail = smoothPath([[k * 0.9, y - 1, z], [k * 2.0, y - 4.5, z + 0.4], [k * 2.6, y - 8.5, z + 0.6]], 3);
    b.add('chest', tube(tail, tail.map((_, i) => 1.15 - i * 0.03)), 'bow', { thr: 0.3 });
  }
  // the Zeichen on the knot, in white
  for (const [x, yy] of [[0, 1], [-1, 0], [0, 0], [1, 0], [-1, -1], [1, -1]]) b.voxel('chest', x, Math.round(y) + yy, Math.round(z + 1.2), 'coat', 0);
}

/** Dark leggings; white boots to below the knee with frilled tops and a low heel. */
function legs(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [hx, hy, hz] = s.hip;
  const [kx, ky, kz] = L.knee;
  const [ax, ay, az] = L.ankle;
  b.add('thigh.L', blend(1.2, sphere([hx, hy, hz], 3.5), capsule([hx, hy, hz], [kx, ky + 1, kz], 3.5, 2.5)), 'legging', { mirror: true });
  b.add('shin.L', blend(1, sphere([kx, ky, kz], 2.45), capsule([kx, ky, kz], [ax, ay + 2, az], 2.4, 1.8)), 'legging', { mirror: true });
  const top = ky - 2.4;
  b.add('shin.L', capsule([kx, top, kz], [ax, ay + 0.4, az], 2.85, 2.45), 'coat', { mirror: true });
  // the frilled top of the boot
  b.add('shin.L', fn((x, y, z) => {
    const a = Math.atan2(z - kz, x - kx);
    const r = 3.4 + Math.sin(a * 6) * 0.35;
    return Math.max(Math.abs(Math.hypot(x - kx, z - kz) - r + 0.4) - 0.7, Math.abs(y - (top + 0.4)) - 1.0);
  }, [kx - 6, top - 2, kz - 6], [kx + 6, top + 3, kz + 6]), 'coat', { mirror: true, thr: 0.2 });
  b.paint('shin.L', fn((x, y, z) => Math.max(Math.hypot(x - kx, z - kz) - 3.3, Math.abs(y - (top + 0.4)) - 1.3), [kx - 6, top - 2, kz - 6], [kx + 6, top + 3, kz + 6]), 'coatIn', { mirror: true, where: b.isMat('coat') });
  const f = s.foot;
  b.add('foot.L', capsule([ax, ay + 1.6, az - 0.3], [ax, ay - 1.2, az - 0.3], 2.5), 'coat', { mirror: true });
  b.add('foot.L', intersect(box([ax, 2.3, az + (f.len / 2 - f.heel) + 0.2], [f.w / 2 + 0.4, 2.1, f.len / 2 + 0.3], { round: 1.4 }), fn((x, y, z) => y - 4.4 + (z - (az + f.len - f.heel - 3.6)) * 0.7, [-20, -2, -20], [20, 10, 30])), 'coat', { mirror: true });
  b.paint('foot.L', aabb([ax - 6, 0, az - 9], [ax + 6, 0.8, az + 16]), 'sole', { mirror: true });
  b.add('foot.L', box([ax, 1.3, az - f.heel + 1.0], [1.5, 1.3, 1.4], { round: 0.3 }), 'sole', { mirror: true });
}

// ---------------------------------------------------------------------------------------------- Pornipora

const HEART: [number, number][] = [[0, -2.2], [2.1, 0.1], [2.2, 1.2], [1.4, 1.9], [0.5, 1.6], [0, 1.0], [-0.5, 1.6], [-1.4, 1.9], [-2.2, 1.2], [-2.1, 0.1]];

/**
 * Pornipora's wings: four big hearts stacked down each side in a fan, biggest at the top, each an open frame of light
 * with a paler fill, strung on a spar from the shoulder blade, on the wing's bone.
 */
function heartWings(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [, sy] = s.shoulder;
  for (const k of [1, -1]) {
    const side = k > 0 ? 'L' : 'R';
    const root: V3 = [k * 3.2, sy - 3.4, -s.chest[1] - 1.6];
    b.bone(`wing.${side}`, 'chest', root);
    const stack: [number, number, number, number][] = [[13, 17, 5.6, 24], [21, 2, 5.0, 8], [21, -14, 4.4, -8], [15, -29, 3.8, -22]];
    let prev: V3 = root;
    for (const [dx, dy, size, tilt] of stack) {
      const c: V3 = [root[0] + k * dx, root[1] + dy, root[2] - 4 - dx * 0.2];
      const t = (tilt * Math.PI) / 180;
      const u: V3 = [k * Math.cos(t), -Math.sin(t), -0.3];
      const v: V3 = [k * Math.sin(t), Math.cos(t), 0];
      const outer = prism(HEART.map(([a, bb]) => [a * size, bb * size]), c, u, v, 0.7, 0.2);
      const inner = prism(HEART.map(([a, bb]) => [a * size * 0.74, bb * size * 0.74 + size * 0.1]), c, u, v, 2, 0);
      b.add(`wing.${side}`, subtract(outer, inner), 'reishi', { thr: 0.2 });
      b.add(`wing.${side}`, prism(HEART.map(([a, bb]) => [a * size * 0.74, bb * size * 0.74 + size * 0.1]), c, u, v, 0.35, 0), 'reishi', { thr: 0.2, shade: 0 });
      b.add(`wing.${side}`, capsule(prev, [c[0] - k * size * 0.4, c[1] - size * 1.6, c[2]], 0.85), 'reishi', { thr: 0.2 });
      prev = [c[0] - k * size * 0.4, c[1] - size * 1.6, c[2]];
    }
    b.add(`wing.${side}`, sphere(root, 2.4), 'reishi');
  }
}

/** Sklaverei's armour: heart-shaped kneeguards and a heart-shaped chestplate, pink reishi. */
function heartArmour(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [kx, ky, kz] = L.knee;
  b.add('shin.L', prism(HEART.map(([a, bb]) => [a * 1.5, bb * 1.5]), [kx, ky - 0.5, kz + 3.0], [1, 0, 0], [0, 1, 0], 0.8, 0.3), 'reishi', { mirror: true, thr: 0.2 });
  const z = s.chest[1] + 2.6;
  b.add('chest', prism(HEART.map(([a, bb]) => [a * 2.6, bb * 2.6]), [0, BUST_Y + 1.5, z], [1, 0, 0], [0, 1, 0], 0.8, 0.3), 'reishi', { thr: 0.2 });
}

// ---------------------------------------------------------------------------------------------- props

function reishiMats(b: ModelBuilder): void {
  b.mat('reishi', PINK_RAMP, { base: 2, rough: 0.3, glow: 0.5, dither: 0 });
  b.mat('core', ['#FFF2F8', '#FFD6EA'], { base: 0, rough: 0.2, glow: 1.0, dither: 0 });
}

/**
 * A swollen muscle at 48 vox/m, along −Y from the socket. The upper arm: a deltoid cap, the biceps' great belly in front
 * and the triceps behind, a ring of torn sleeve at the shoulder. The forearm: thick under the elbow and tapering, ending
 * in the swollen gloved fist with its frilled cuff. Veins stand out down the fronts.
 */
function buildMuscle(fore: boolean): VoxelModel {
  const b = new ModelBuilder(fore ? 'meninas-muscle-fore' : 'meninas-muscle-upper', 48);
  b.mat('skin', ['#F9DCCB', '#EFC6B0', '#E2B09A', '#CF9A84', '#B98270'], { base: 1, rough: 0.5, shadeK: 1 });
  b.mat('vein', ['#D3907F', '#BE7C6E']);
  b.mat('coat', ['#F3F3F0', '#F1F2EF', '#DDE0E4', '#C9CCD3', '#A4ABB8'], { base: 1, rough: 0.75 });
  b.mat('coatIn', ['#D9DCE2', '#C3C8D0', '#A5ACB8'], { base: 1, rough: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  if (!fore) {
    const arm = blend(1.6,
      sphere([0, 0.6, 0], 4.6),
      ellipsoid([0, -6.8, 2.2], [4.6, 6.2, 4.4]),
      ellipsoid([0, -5.6, -1.8], [4.0, 6.6, 3.8]),
      capsule([0, -1, 0], [0, -14, 0.4], 3.4, 3.0));
    b.add('root', arm, 'skin', { thr: 0.2 });
    // the line between biceps and triceps, the deltoid's edge
    b.paint('root', fn((x, y, z) => Math.max(Math.abs(z - 0.2 - Math.sin(y * 0.3) * 0.4) - 0.5, -y - 13, y + 2), [-8, -15, -8], [8, 4, 8]), 'skin', { shade: 3, where: b.isMat('skin') });
    b.paint('root', fn((x, y, z) => Math.abs(Math.hypot(x, z) - 4.3) - 0.6 + Math.abs(y + 2.6) * 0.8, [-8, -6, -8], [8, 1, 8]), 'skin', { shade: 3, where: b.isMat('skin') });
    // the torn sleeve round the shoulder
    b.add('root', fn((x, y, z) => Math.max(Math.abs(Math.hypot(x, z) - 4.9) - 0.8, Math.abs(y - 1.8) - 1.4 - Math.sin(Math.atan2(z, x) * 5) * 0.9), [-7, -3, -7], [7, 5, 7]), 'coat', { thr: 0.2 });
    b.paint('root', fn((x, y, z) => Math.abs(x - Math.sin(y * 0.6) * 1.6 - 1.0) - 0.5 + (z < 2 ? 9 : 0), [-8, -14, -8], [8, -1, 8]), 'vein', { where: b.isMat('skin') });
  } else {
    b.add('root', blend(1.8, ellipsoid([0, -3.4, 0.8], [5.2, 5.6, 4.8]), ellipsoid([1.4, -4.0, -0.6], [3.6, 5.0, 3.6]), capsule([0, -4, 0], [0, -12.5, 0.4], 4.2, 3.3)), 'skin', { thr: 0.2 });
    b.paint('root', fn((x, y, z) => Math.max(Math.abs(x - 1.6) - 0.5, -y - 11, y + 1, -z + 1), [-8, -13, -8], [8, 2, 8]), 'skin', { shade: 3, where: b.isMat('skin') });
    // the swollen fist in the glove, the frilled cuff above it
    b.add('root', box([0, -17.6, 1.2], [4.2, 4.2, 4.6], { round: 2.0 }), 'coat', { thr: 0.2 });
    b.add('root', fn((x, y, z) => {
      const a = Math.atan2(z, x);
      return Math.max(Math.abs(Math.hypot(x, z) - 4.5 - Math.sin(a * 6) * 0.5) - 0.8, Math.abs(y + 12.8) - 1.0);
    }, [-7, -15, -7], [7, -10, 7]), 'coat', { thr: 0.2 });
    b.paint('root', fn((x, y, z) => Math.max(Math.abs(y + 12.8) - 1.2, Math.hypot(x, z) - 4.6), [-7, -15, -7], [7, -10, 7]), 'coatIn', { where: b.isMat('coat') });
    // the knuckles' ridge
    b.paint('root', fn((_x, y, z) => Math.max(Math.abs(y + 19.4) - 0.5, -z + 4.4), [-6, -22, -6], [6, -16, 8]), 'coatIn', { where: b.isMat('coat') });
    b.paint('root', fn((x, y, z) => Math.abs(x + Math.sin(y * 0.7) * 1.4 - 0.4) - 0.5 + (z < 1.5 ? 9 : 0), [-8, -12, -8], [8, 2, 8]), 'vein', { where: b.isMat('skin') });
  }
  b.autoShade({ up: 0.4, open: 1, front: 0.3 });
  b.lint();
  return b.build();
}

/** The pink reishi dumbbell: a bar along ±X with a grip of light, heavy heart-faced weights at each end. */
function buildDumbbell(): VoxelModel {
  const b = new ModelBuilder('meninas-dumbbell', 48);
  reishiMats(b);
  b.bone('root', null, [0, 0, 0]);
  b.add('root', cylinder([-9, 0, 0], [9, 0, 0], 1.3), 'core');
  for (const k of [1, -1]) {
    b.add('root', cylinder([k * 6, 0, 0], [k * 11, 0, 0], 5.2, 5.2, 1.2), 'reishi', { thr: 0.2 });
    b.add('root', prism(HEART.map(([a, bb]) => [a * 1.4, bb * 1.4]), [k * 11.4, 0.2, 0], [0, 0, k], [0, 1, 0], 0.6, 0.2), 'core', { thr: 0.2 });
  }
  b.autoShade({ up: 0.3, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** Baton Beat: the dumbbell's handle stretched into a long staff along ±Z, the weights shrunk to its ends. */
function buildBaton(): VoxelModel {
  const b = new ModelBuilder('meninas-baton', 48);
  reishiMats(b);
  b.bone('root', null, [0, 0, 0]);
  b.add('root', cylinder([0, 0, -40], [0, 0, 40], 1.4), 'core');
  for (const k of [1, -1]) b.add('root', cylinder([0, 0, k * 38], [0, 0, k * 44], 3.6, 3.6, 1), 'reishi', { thr: 0.2 });
  b.autoShade({ up: 0.3, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** Halteres: one dumbbell turned into a huge broad blade along +Z off the grip, a weight for a pommel. */
function buildHalteres(): VoxelModel {
  const b = new ModelBuilder('meninas-halteres', 48);
  reishiMats(b);
  b.bone('root', null, [0, 0, 0]);
  b.add('root', cylinder([0, 0, -7], [0, 0, 8], 1.4), 'core');
  b.add('root', cylinder([0, 0, -11], [0, 0, -7], 4.4, 4.4, 1), 'reishi', { thr: 0.2 });
  const blade: [number, number][] = [[8, -3], [12, -11], [36, -15], [58, -9], [62, 0], [58, 9], [36, 15], [12, 11], [8, 3]];
  b.add('root', prism(blade, [0, 0, 0], [0, 0, 1], [0, 1, 0], 1.1, 0.2), 'reishi', { thr: 0.2 });
  b.paint('root', prism(blade.map(([a, c]) => [a, c * 0.4]), [0, 0, 0], [0, 0, 1], [0, 1, 0], 2, 0), 'core', { where: b.isMat('reishi') });
  b.autoShade({ up: 0.3, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** The small Heilig Bogen: a heart grip, short plain limbs of light along ±Z curling to +Y. */
function buildBow(): VoxelModel {
  const b = new ModelBuilder('meninas-bow', 48);
  reishiMats(b);
  b.mat('heart', ['#FFB8D8', '#FF8EC0', '#FF6FAE', '#D84E8C'], { base: 1, rough: 0.25, metal: 0.3 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', prism(HEART.map(([u, v]) => [u * 1.4, v * 1.4]), [0, 0.4, 0], [0, 0, 1], [0, 1, 0], 1.1, 0.25), 'heart', { thr: 0.2 });
  for (const k of [1, -1]) {
    const p = smoothPath([[0, 0.8, k * 2.4], [0, 1.6, k * 8], [0, 3.6, k * 12.5]], 3);
    b.add('root', tube(p, p.map((_, i) => 1.0 - i * 0.04)), 'reishi', { thr: 0.3 });
  }
  b.autoShade({ up: 0.3, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** A heart arrowhead pointing +Z. */
function buildHeart(): VoxelModel {
  const b = new ModelBuilder('meninas-heart', 48);
  reishiMats(b);
  b.bone('root', null, [0, 0, 0]);
  b.add('root', prism(HEART.map(([u, v]) => [v * 1.6, u * 1.6]), [0, 0, 0], [0, 0, -1], [1, 0, 0], 0.9, 0.3), 'reishi', { thr: 0.2 });
  b.add('root', cylinder([0, 0, -8], [0, 0, -2], 0.7), 'core');
  b.autoShade({ up: 0.3, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** Pornipora's halo: a spiky star round the Zeichen, facing +Z. */
function buildHalo(): VoxelModel {
  const b = new ModelBuilder('meninas-halo', 48);
  reishiMats(b);
  b.bone('root', null, [0, 0, 0]);
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i / 10) * Math.PI * 2;
    const len = i % 2 === 0 ? 13 : 9;
    b.add('root', spike([Math.cos(a) * 3, Math.sin(a) * 3, 0], [Math.cos(a), Math.sin(a), 0], len - 3, 1.7, 1.4, { tip: 0.75, side: [0, 0, 1] }), 'reishi', { thr: 0.2 });
  }
  b.add('root', cylinder([0, 0, -0.8], [0, 0, 0.8], 4.0), 'reishi');
  b.add('root', capsule([0, -2.6, 0.8], [0, 2.6, 0.8], 0.75), 'core', { thr: 0.2 });
  b.add('root', capsule([-2.4, 0.9, 0.8], [2.4, 0.9, 0.8], 0.75), 'core', { thr: 0.2 });
  b.autoShade({ up: 0.2, open: 1, front: 0 });
  b.lint();
  return b.build();
}

