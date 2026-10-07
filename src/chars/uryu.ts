// Uryū Ishida — the last Quincy. Construction and palette from docs/roster/A2-karakura-allies.md §4, the
// Hueco Mundo look: tall and very slender (1.71 m), straight dark-navy hair to the jaw framing the face,
// thin silver glasses, steel-blue eyes; the white Quincy uniform — a high-collared fitted coat with a short
// shoulder cape and a long skirt, blue lines along every edge and a blue cross on the cape, white trousers,
// white shoes — and the pentacle Quincy cross hanging from the right wrist. 84 voxels at 49.1 vox/m.
// Letzt Stil: the coat parts into a white vest, silver armour over the left shoulder bearing a blue cross,
// and a great blue flame-like wing of reishi standing on the right shoulder.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, prism, smoothPath, sphere, spike, subtract, torus, tube, type Sdf, type V3 } from '../models/sdf';
import { SPEC_ADULT_MALE, addBands, coatSkirt, faceLegend, feet, hands, head, humanoidSkeleton, spikeHair, type HumanoidSpec, type Landmarks, type Spike } from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

export const URYU_RES = 84 / 1.71;
export type UryuForm = 'quincy' | 'letzt';

/** Slender: narrow shoulders and chest, a long waist, long legs. */
const SPEC: HumanoidSpec = {
  ...SPEC_ADULT_MALE,
  shoulder: [9.0, 66.5, -0.5],
  upperArm: 14.6,
  foreArm: 13.2,
  armR: 2.3,
  chest: [7.6, 4.6],
  waist: [6.0, 3.9],
  hips: [6.6, 4.3],
  hip: [4.2, 42, 0],
};

function palette(b: ModelBuilder, form: UryuForm): void {
  b.mat('skin', ['#F7E0D0', '#F1DACA', '#E3C8B6', '#D3BCAE', '#B8A195'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#4B4D58', '#354158', '#2D3547', '#2B3242', '#1C2230'], { base: 2, rough: 0.45, shadeK: 0.85, dither: 0.05 });
  b.mat('brow', ['#2B3242']);
  b.mat('lid', ['#1E2230']);
  b.mat('sclera', ['#F3F3F0']);
  b.mat('iris', ['#607C9A']);
  b.mat('irisD', ['#20130F']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#9E6A5C']);
  b.mat('white', ['#F3F3F0', '#F0EFEF', '#DADDE3', '#C6CAD2', '#9FB0C8'], { base: 1, rough: 0.75, shadeK: 0.9 });
  b.mat('blue', ['#4A90E0', '#2B78D0', '#0A51B4', '#1C3768'], { base: 1, rough: 0.5, shadeK: 0.85 });
  b.mat('silver', ['#E4E7EC', '#C8CCD4', '#A8ADB6', '#7B7F88'], { base: 1, rough: 0.25, metal: 0.85, shadeK: 0.8 });
  b.mat('shoe', ['#F0EFEF', '#DADDE3', '#B8BEC8'], { base: 1, rough: 0.5 });
  b.mat('sole', ['#8C96A6']);
  if (form === 'letzt') {
    b.mat('wing', ['#D6EBFF', '#9CC4EA', '#6E9ED0', '#4A74AA'], { base: 1, rough: 0.2, shadeK: 0.8, glow: 0.7 });
    b.mat('armor', ['#E6EAF0', '#C9CED6', '#A8AEB8', '#7E8590'], { base: 1, rough: 0.25, metal: 0.85, shadeK: 0.8 });
  }
}

/** A cool, level gaze behind the glasses; a thin mouth. Rows 9 → 0. */
const FACE = [
  '. . . . . . . . . .',
  '. . . . . . . . . .',
  '. B B B . . B B B .',
  '. L L L . . L L L .',
  '. W I I . . I I W .',
  '. . * i . . i * . .',
  '. . . . . s . . . .',
  '. . . . . . . . . .',
  '. . . . m m . . . .',
  '. . . . . . . . . .',
];

const assetCache = new Map<UryuForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function uryuAsset(form: UryuForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildUryu(form)));
  return a;
}

/** 'glasses' (2× resolution), 'seele' (Seele Schneider: silver hilt, blue blade), 'cross' (the pentacle on its chain). */
export type UryuProp = 'glasses' | 'seele' | 'cross';

export function uryuProp(kind: UryuProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'glasses' ? buildGlasses() : kind === 'seele' ? buildSeele() : buildCross();
    propCache.set(kind, m);
  }
  return m;
}

export function buildUryu(form: UryuForm = 'quincy'): CharacterAsset {
  const b = new ModelBuilder(`uryu-${form}`, URYU_RES);
  palette(b, form);
  const s = SPEC;
  const L = humanoidSkeleton(b, s);
  b.socket('grip.R', 'fist.R', [-L.wrist[0] + 0.1, L.wrist[1] - 4.3, L.wrist[2] + 0.4]);
  b.socket('grip.L', 'fist.L', [L.wrist[0] - 0.1, L.wrist[1] - 4.3, L.wrist[2] + 0.4]);
  b.socket('palm.R', 'palm.R', [-L.wrist[0] + 0.6, L.wrist[1] - 5, L.wrist[2] + 1]);
  b.socket('palm.L', 'palm.L', [L.wrist[0] - 0.6, L.wrist[1] - 5, L.wrist[2] + 1]);
  // the bow forms round the left fist; the right hand draws the string back to the cheek
  b.socket('bow', 'fist.L', [L.wrist[0], L.wrist[1] - 4.5, L.wrist[2] + 0.5]);
  b.socket('draw', 'fist.R', [-L.wrist[0], L.wrist[1] - 4.5, L.wrist[2] + 0.5]);
  b.socket('wrist.R', 'forearm.R', [-L.wrist[0] - 1.5, L.wrist[1] + 1, L.wrist[2]]);
  b.socket('chest.front', 'chest', [0, s.chestY, 6]);
  b.socket('wing', 'chest', [-s.shoulder[0] - 0.5, s.shoulder[1] + 4, s.shoulder[2] - 2]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('glasses', 'head', [0, s.chinY + 5.5, hd.front + 0.6]);
  b.stamp('head', hd.x0, hd.chin + 9, FACE, faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  hair(b, L, hd);
  hands(b, L, 'skin');
  const torso = body(b, L);
  const springs: SpringDef[] = [];
  const colliders: ColliderDef[] = [];
  if (form === 'quincy') {
    const coat = uniform(b, L, torso);
    springs.push(...coat.springs);
    colliders.push(...coat.colliders);
  } else letzt(b, L, torso);
  trousers(b, L);
  b.autoShade();
  b.lint();
  colliders.push({ bone: 'shin.L', offset: [0, -0.12, 0], radius: 0.06 }, { bone: 'shin.R', offset: [0, -0.12, 0], radius: 0.06 }, { bone: 'thigh.L', offset: [0, -0.1, 0.02], radius: 0.1 }, { bone: 'thigh.R', offset: [0, -0.1, 0.02], radius: 0.1 });
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- head

/** Straight hair to the jaw, parted slightly off-centre, framing the face; the bangs fall over the brow. */
function hair(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }): void {
  const s = L.spec;
  const c = hd.chin;
  const locks: Spike[] = [];
  // the fall: flat, straight locks down the sides and back to the jaw
  for (const az of [-95, -118, -142, -165, 165, 142, 118, 95]) locks.push({ az, el: -12, len: 4.6, r: 3.2, flat: 0.35, flow: [0, -1.7, -0.05], taper: 0.7 });
  for (const k of [-1, 1]) locks.push({ az: k * 76, el: -6, len: 4.2, r: 2.7, flat: 0.35, flow: [0, -1.8, 0.2], taper: 0.7 });
  spikeHair(b, L, 'hair', locks, [
    { x: -3.8, tipY: c + 7.6, lean: -0.5, r: 1.7 },
    { x: -1.2, tipY: c + 8.0, lean: 0.2, r: 1.6 },
    { x: 2.4, tipY: c + 8.4, lean: 0.8, r: 1.5 },
    { x: 4.6, tipY: c + 6.4, lean: 0.4, r: 1.3 },
  ], { hairline: c + s.head.h - 2.2, nape: c + 1, slope: 0.55 });
  // the outer bangs' roots poke out above the crown at the front corners
  for (const k of [-1, 1]) b.carve('head', aabb([k > 0 ? 3 : -9, c + s.head.h + 0.2, hd.front - 2.5], [k > 0 ? 9 : -3, c + 17, hd.front + 3]));
  // the sheen: a cool streak across the crown
  b.paint('head', torus([0, c + s.head.h - 1.4, L.headC[2] - 1], 4.4, 0.6, [18, 0, 0]), 'hair', { shade: 0, where: b.isMat('hair') });
  b.carve('head', aabb([-5, c + 4, hd.front], [-1, c + 7, hd.front + 6]));
  b.carve('head', aabb([1, c + 4, hd.front], [5, c + 7, hd.front + 6]));
}

// ---------------------------------------------------------------------------------------------- body

/** A slender torso (covered by the uniform) and thin arms in fitted sleeves. */
function body(b: ModelBuilder, L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const torso = blend(2.6,
    box([0, s.chestY - 0.5, -0.3], [cx, 6, cz], { round: 3 }),
    box([0, s.waistY, -0.2], [wx, 4.6, wz], { round: 2.8 }),
    box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 3.6, s.hips[1]], { round: 2.4 }),
    capsule([2.4, sy + 1.6, sz - 0.8], [sx - 1.4, sy - 0.2, sz], 2.6, 2.7),
    capsule([-2.4, sy + 1.6, sz - 0.8], [-sx + 1.4, sy - 0.2, sz], 2.6, 2.7),
    sphere([sx, sy - 0.5, sz], 3), sphere([-sx, sy - 0.5, sz], 3));
  addBands(b, torso, 'white', [['hips', 36, 46], ['spine', 46, 56], ['chest', 54, 82]]);
  b.add('neck', capsule([0, s.chinY - 5, L.headC[2] - 0.5], [0, s.chinY + 2, L.headC[2] - 0.5], s.neckR), 'skin');
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(1.4, sphere([sx, sy - 0.5, sz], 3.2), capsule([sx, sy - 1, sz], [sx, ey + 0.5, sz], 2.9, 2.6)), 'white', { mirror: true });
  b.add('forearm.L', blend(1.2, sphere([sx, ey, sz], 2.7), capsule([sx, ey - 0.5, sz], [sx, wy + 1, sz], 2.7, 2.3)), 'white', { mirror: true });
  // cuffs: a blue band at each wrist
  b.paint('forearm.L', cylinder([sx, wy + 1, sz], [sx, wy + 2.4, sz], 3.2), 'blue', { mirror: true, where: b.isMat('white') });
  return torso;
}

/**
 * The Quincy uniform: the fitted coat closed down the front (a blue line), a high stand-up collar, a short
 * cape round the shoulders with a blue cross on its back, a long skirt (spring panels) open at the front,
 * blue lines on every edge.
 */
function uniform(b: ModelBuilder, L: Landmarks, torso: Sdf): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  // the closure down the front and the belt
  b.paint(['chest', 'spine', 'hips'], intersect(aabb([-0.6, s.hipsY - 4, -20], [0.6, s.chinY, 20]), halfSpace([0, 0, 1], [0, 0, -1])), 'blue', { where: b.isMat('white') });
  b.add('spine', intersect(subtract(offset(torso, 0.9), offset(torso, -0.2)), aabb([-20, s.waistY - 3, -20], [20, s.waistY - 1.6, 20])), 'blue');
  // the stand-up collar, open at the throat
  const nz = L.headC[2] - 1;
  const collar = fn((x, y, z) => {
    const r = 4.1 + Math.max(0, Math.min(1, (y - (sy - 1)) / 8)) * 0.6;
    return Math.max(Math.abs(Math.hypot(x, (z - nz) * 1.1) - r) - 0.6, y - (s.chinY + 2.5), sy - 1 - y, z - (nz + 3.4) + Math.abs(x) * 0.3);
  }, [-8, sy - 2, -8], [8, s.chinY + 4, 8]);
  b.add('chest', collar, 'white');
  b.paint('chest', fn((x, y, z) => Math.abs(y - (s.chinY + 2)) - 0.5, [-8, s.chinY, -8], [8, s.chinY + 4, 8]), 'blue', { where: b.isMat('white') });
  // the cape: a short mantle over the shoulders, longer at the back
  const cape = fn((x, y, z) => {
    const back = z < 0 ? 1 : 0;
    const hem = sy - 7 - back * 4 + Math.abs(x) * 0.15;
    const r = Math.hypot(x / (sx + 3.4), (z + 0.6) / (s.chest[1] + 3.2));
    const top = sy + 2.6 - r * 1.5;
    return Math.max(Math.abs(Math.hypot(x / 1.12, (z + 0.6) * 1.15) - (sx + 1.6 - Math.max(0, (sy + 2 - y)) * 0.25 + 0.6)) - 0.7, y - top, hem - y, z - 3.6);
  }, [-sx - 6, sy - 14, -12], [sx + 6, sy + 5, 6]);
  b.add('chest', cape, 'white', { thr: 0.2 });
  b.paint('chest', intersect(offset(cape, 0.2), fn((x, y, z) => {
    const back = z < 0 ? 1 : 0;
    return Math.abs(y - (sy - 7 - back * 4 + Math.abs(x) * 0.15)) - 0.9;
  }, [-sx - 6, sy - 14, -12], [sx + 6, sy + 5, 6])), 'blue', { where: b.isMat('white') });
  // the blue cross on the cape's back
  const cz = -(s.chest[1] + 3.0);
  b.paint('chest', box([0, sy - 4, cz], [0.7, 3.4, 2]), 'blue', { where: b.isMat('white') });
  b.paint('chest', box([0, sy - 3.2, cz], [2.4, 0.7, 2]), 'blue', { where: b.isMat('white') });
  // the skirt: long panels to the knees, open at the front, blue at the hem and the front edges
  const coat = coatSkirt(b, L, { mat: 'white', lining: 'blue', yTop: s.waistY - 3, yHem: 18, r0: 7.6, r1: 10.4, openFront: 22, res: URYU_RES });
  return coat;
}

/**
 * Quincy: Letzt Stil — the coat gone to a white vest parted down the middle, silver armour over the left
 * shoulder spreading across the chest with a blue cross, white cloth with lines covering the legs, and the
 * great flame-like wing of reishi standing on the right shoulder.
 */
function letzt(b: ModelBuilder, L: Landmarks, torso: Sdf): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  // the vest parted down the middle
  b.paint(['chest', 'spine'], intersect(aabb([-1.2, s.waistY - 2, -20], [1.2, s.chinY, 20]), halfSpace([0, 0, 1], [0, 0, -1])), 'skin', { where: b.isMat('white') });
  for (const k of [-1, 1]) b.paint(['chest', 'spine', 'hips'], intersect(aabb([k * 3 - 0.4, s.hipsY - 4, -20], [k * 3 + 0.4, s.chestY + 4, 20]), halfSpace([0, 0, 1], [0, 0, -1])), 'blue', { where: b.isMat('white') });
  // armour over the left shoulder, down over the chest
  b.add('upperarm.L', blend(1.2, ellipsoid([sx + 0.4, sy + 0.6, sz], [4, 2.8, 4.2]), ellipsoid([sx + 1.2, sy - 2.2, sz], [3.4, 2.6, 3.8])), 'armor', { thr: 0.3 });
  b.add('chest', intersect(subtract(offset(torso, 1.3), offset(torso, 0.3)), aabb([1.4, s.chestY - 3, -20], [20, s.chinY, 20])), 'armor');
  b.paint('upperarm.L', box([sx + 3.8, sy - 0.6, sz], [0.6, 2.4, 0.7]), 'blue', { where: b.isMat('armor') });
  b.paint('upperarm.L', box([sx + 3.8, sy, sz], [0.6, 0.6, 1.8]), 'blue', { where: b.isMat('armor') });
  // the wing: a great blue flame of reishi standing on the right shoulder (on the chest bone, so it stays
  // upright while the arm draws), licking up, out and back in tongues
  const wx = -sx + 0.5;
  const root: V3 = [wx, sy + 2, sz - 1.5];
  const tongues: [V3, number, number][] = [
    [[-0.15, 1, -0.3], 36, 4.4], [[-0.45, 0.9, -0.4], 30, 3.8], [[0.12, 0.95, -0.45], 26, 3.4], [[-0.7, 0.7, -0.35], 24, 3.2],
    [[-0.25, 0.75, -0.75], 25, 3.2], [[-0.85, 0.45, -0.25], 18, 2.8], [[0.05, 0.6, -0.85], 19, 2.8],
  ];
  for (const [d, len, r] of tongues) b.add('chest', spike(root, d, len, r, r * 0.45, { bend: [-0.12, 0.05, -0.12], tip: 0.35 }), 'wing', { thr: 0.3 });
  b.add('chest', ellipsoid([wx - 0.5, sy + 2.5, sz - 1.5], [4.2, 3.4, 4.2]), 'wing');
}

/** White trousers, white shoes. */
function trousers(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [hx, hy, hz] = s.hip;
  const [kx, ky, kz] = L.knee;
  const [ax, ay, az] = L.ankle;
  b.add('hips', box([0, s.hipsY - 0.5, -0.3], [s.hips[0] + 0.5, 3.6, s.hips[1] + 0.5], { round: 2.4 }), 'white');
  b.add('thigh.L', blend(1.3, sphere([hx, hy, hz], 3.5), capsule([hx, hy, hz], [kx, ky + 1, kz], 3.5, 2.9)), 'white', { mirror: true });
  b.add('shin.L', blend(1.1, sphere([kx, ky, kz], 2.9), capsule([kx, ky, kz], [ax, ay + 2, az], 2.8, 2.6)), 'white', { mirror: true });
  const f = s.foot;
  const toeZ = az + f.len - f.heel;
  b.add('foot.L', capsule([ax, ay + 1.5, az - 0.4], [ax, ay - 1, az - 0.4], 2.5), 'shoe', { mirror: true });
  b.add('foot.L', intersect(box([ax, 2.2, az + (f.len / 2 - f.heel)], [f.w / 2, 2.2, f.len / 2], { round: 1.4 }), halfSpace([0, 4.4, toeZ - 3], [0, 1, 0.65])), 'shoe', { mirror: true });
  b.paint('foot.L', aabb([ax - 5, 0, az - 8], [ax + 5, 1, az + 14]), 'sole', { mirror: true });
}

// ---------------------------------------------------------------------------------------------- props

/** Thin silver frames at twice the head's density; rounded rectangles over the eyes. */
function buildGlasses(): VoxelModel {
  const b = new ModelBuilder('uryu-glasses', URYU_RES * 2.25);
  b.mat('frame', ['#D6D6D8', '#B4B4B5', '#7B7777'], { base: 1, rough: 0.25, metal: 0.8 });
  b.mat('lens', ['#E8F0F8'], { rough: 0.05, glow: 0.15 });
  b.bone('root', null, [0, 0, 0]);
  for (const k of [-1, 1]) {
    const cx = k * 5;
    b.add('root', subtract(aabb([cx - 4, -3, 0], [cx + 4, 4, 1]), aabb([cx - 3, -2, -1], [cx + 3, 3, 2])), 'frame');
    // a single glint in the corner of each lens
    b.add('root', aabb([cx + (k > 0 ? 1 : -3), 1, 0], [cx + (k > 0 ? 3 : -1), 3, 0.5]), 'lens');
    b.add('root', aabb([k > 0 ? 8 : -11, 2, 0], [k > 0 ? 11 : -8, 3, 1]), 'frame');
    b.add('root', aabb([k > 0 ? 10 : -11, 2, -12], [k > 0 ? 11 : -10, 3, 1]), 'frame');
  }
  b.add('root', aabb([-1, 2, 0], [1, 3, 1]), 'frame');
  b.lint(2);
  return b.build();
}

/** Seele Schneider at 48 vox/m: a thin silver hilt and a long blade of blue light. Origin at the grip, +Z. */
function buildSeele(): VoxelModel {
  const b = new ModelBuilder('seele-schneider', 48);
  b.mat('silver', ['#E4E7EC', '#C9CED6', '#A8ADB6', '#7B7F88'], { base: 1, rough: 0.25, metal: 0.85, shadeK: 0.8 });
  b.mat('light', ['#E6F8FF', '#9FE6FF', '#3FA9F5'], { base: 1, rough: 0.1, glow: 1.6 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', cylinder([0, 0, -7], [0, 0, 7], 0.9), 'silver');
  b.add('root', box([0, 0, 7.2], [1.6, 0.6, 0.6], { round: 0.3 }), 'silver');
  b.add('root', cylinder([0, 0, -7.8], [0, 0, -7], 1.2), 'silver');
  b.add('root', fn((x, y, z) => {
    if (z < 7.5 || z > 52) return 1;
    const w = 0.9 * (1 - Math.max(0, z - 44) / 8);
    return Math.max(Math.abs(x) - 0.35, Math.abs(y) - w, 7.5 - z, z - 52);
  }, [-2, -2, 7], [2, 2, 53]), 'light', { thr: 0.3 });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** The pentacle Quincy cross, a small silver star in a ring, on a short chain. Origin at the top of the chain. */
function buildCross(): VoxelModel {
  const b = new ModelBuilder('quincy-cross', 96);
  b.mat('silver', ['#E4E7EC', '#C8CCD4', '#A8ADB6', '#7B7F88'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', tube(smoothPath([[0, 0, 0], [0.4, -2.5, 0.2], [0, -5, 0]], 3), [0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45]), 'silver', { thr: 0.2 });
  const c: V3 = [0, -8.6, 0];
  b.add('root', torus(c, 3.4, 0.55, [90, 0, 0]), 'silver', { thr: 0.2 });
  const star: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2, r = i % 2 === 0 ? 3.2 : 1.3;
    star.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  b.add('root', prism(star, [c[0], c[1], c[2]], [1, 0, 0], [0, 1, 0], 0.45), 'silver', { thr: 0.2 });
  b.lint();
  return b.build();
}
