// Lille Barro (docs/roster/H1-vandenreich-leaders.md, "Lille Barro"; kit docs/kits/lille.md). Brief: 182 cm → 87 vox at
// 48/m (head 12.4, ≈ 1/7); lean, upright, composed. Silhouette keys: the dark-green fur bicorne worn athwart (a tiny
// Zeichen on each side), the dark-green fur pauldron on his RIGHT shoulder, the long white cloak, and Diagramm — a black
// rifle longer than he is. Face: dark skin, short white hair with short sideburns; the LEFT eye always shut under a black
// tattoo of an X in a circle, the right eye calm. Outfit: a light sleeveless shirt with a stand-up collar, bare arms,
// white gloves to mid-forearm with a winged X on the back, dark-green trousers under white leg pieces (the calves cut
// away, the tops strapped up to the shirt), light shoes. Forms: 'base' (the eye shut); 'open' (both eyes open, the
// tattoo glowing green: intangible). Jilliel and the True Form are in lilleGod.ts. Props: 'diagramm' (the grip at the
// origin, the barrel along +Z: the fur-wrapped receiver with one button under it, the stock with its two square fins, the
// oversized trigger guard, the foregrip, the scope with its dial, the long thin barrel and the notched plus-shaped muzzle)
// and 'diagramm-r' (re-formed in green reishi: shorter, the fur gone, holes along the top of the stock). (verify) the
// open eye's colour; the glove embroidery's thread colour.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, intersect, sphere, subtract, type Sdf } from '../models/sdf';
import { addBands, faceLegend, hands, head, humanoidSkeleton, type HumanoidSpec, type Landmarks } from './humanoid';
import { longCape } from './sternritter';
import type { CharacterAsset } from './ichigo';

export const LILLE_RES = 48;
export type LilleForm = 'base' | 'open';

/** Lean and upright: long arms, a narrow waist. */
const SPEC: HumanoidSpec = {
  H: 87,
  chinY: 74.5,
  head: { w: 10, d: 11, h: 12.4 },
  neckR: 2.5,
  shoulder: [9.4, 69.2, -0.5],
  upperArm: 15,
  foreArm: 13.6,
  hand: 9.2,
  armR: 2.3,
  hipsY: 47,
  hip: [4.4, 43.6, 0],
  kneeY: 24,
  ankleY: 4.6,
  chest: [8.0, 4.9],
  waist: [6.2, 4.1],
  hips: [6.8, 4.4],
  chestY: 63.5,
  waistY: 53.5,
  foot: { len: 12.4, w: 5, heel: 3.1 },
};

function palette(b: ModelBuilder, form: LilleForm): void {
  lilleHeadPalette(b, form === 'open');
  b.mat('shirt', ['#F1EFE8', '#E6E3DA', '#D3CFC4', '#BCB7AB', '#A29C90'], { base: 1, rough: 0.75, shadeK: 0.9 });
  b.mat('cloak', ['#F3F3F0', '#EFEFEA', '#DCDCD6', '#C5C6C2', '#A7A9A8'], { base: 1, rough: 0.75, shadeK: 0.9 });
  b.mat('cloakIn', ['#D8D8D2', '#C2C3BE', '#A7A8A4'], { base: 1, rough: 0.8 });
  b.mat('glove', ['#F3F3F0', '#F2F2EE', '#DDDDD8', '#C4C4BF'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('thread', ['#2C4632']);
  b.mat('fur', ['#577B5E', '#456A4C', '#355239', '#2C4632', '#22382A'], { base: 2, rough: 0.95, shadeK: 0.9, dither: 0.09 });
  b.mat('pants', ['#3F5641', '#344A36', '#2B3D2C', '#223224', '#1B281C'], { base: 2, rough: 0.8, shadeK: 0.9 });
  b.mat('panel', ['#F3F3F0', '#ECEBE6', '#D7D6D1', '#BFBEB9', '#A4A39E'], { base: 1, rough: 0.7, shadeK: 0.9 });
  b.mat('shoe', ['#E7E4DB', '#DCD9D0', '#C5C2B9', '#A9A69D'], { base: 1, rough: 0.5 });
  b.mat('sole', ['#8B877D']);
  b.mat('emblem', ['#E6E2D2', '#C9C3AE'], { base: 0, rough: 0.35, metal: 0.6 });
}

/**
 * The right eye calm and half-lidded; the left shut under the tattoo (t): a circle with an X through it. Open, the
 * tattoo glows and the eye shows through its centre. Rows 9 → 0.
 */
const FACE_SHUT = [
  '. . . . . . . . . .',
  '. . . . . . t t t .',
  '. B B B . t t . t t',
  '. L L L . t . t . t',
  '. W I * . t t . t t',
  '. . i . . . t t t .',
  '. . . . . s . . . .',
  '. . . . . . . . . .',
  '. . . m m m . . . .',
  '. . . . . . . . . .',
];
const FACE_OPEN = [
  '. . . . . . . . . .',
  '. . . . . . t t t .',
  '. B B B . t t . t t',
  '. L L L . t W I W t',
  '. W I * . t t i t t',
  '. . i . . . t t t .',
  '. . . . . s . . . .',
  '. . . . . . . . . .',
  '. . . m m m . . . .',
  '. . . . . . . . . .',
];

/** Jilliel's face above the robe: both eyes open, the tattoo glowing, white lines (w) across the face */
const FACE_GOD = [
  '. . . . . . . . . .',
  'w w w . . . t t t .',
  '. B B B . t t . t t',
  '. L L L . t W I W t',
  '. W I * . t t i t t',
  'w . i . . . t t t w',
  'w w . . . s . . w w',
  '. . . . . . . . . .',
  '. . . m m m . . . .',
  '. . . . . . . . . .',
];

const assetCache = new Map<LilleForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function lilleAsset(form: LilleForm = 'base'): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildLille(form)));
  return a;
}

/** 'diagramm' and 'diagramm-r' (the grip at the origin, the barrel along +Z, the scope up +Y). */
export type LilleProp = 'diagramm' | 'diagramm-r';

export function lilleProp(kind: LilleProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) propCache.set(kind, (m = buildDiagramm(kind === 'diagramm-r')));
  return m;
}

/** along the rifle's +Z from the grip (m): the muzzle, and where the left hand takes the foregrip */
export const DIAGRAMM_MUZZLE = 90 / 48;
export const DIAGRAMM_MUZZLE_R = 64 / 48;
export const DIAGRAMM_FOREGRIP = 22 / 48;

export function buildLille(form: LilleForm = 'base'): CharacterAsset {
  const b = new ModelBuilder(`lille-${form}`, LILLE_RES);
  palette(b, form);
  const s = SPEC;
  const L = humanoidSkeleton(b, s);
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.6, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.6, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 5.2, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5.2, wz + 1]);
  // the rifle slung across his back when his hands are busy (the barrel up over the right shoulder)
  b.socket('back', 'chest', [0, s.chestY + 1, -8], [0, 0, -30]);
  b.socket('chest.front', 'chest', [0, s.chestY, 6]);
  const hd = lilleHead(b, L, form === 'open' ? 'open' : 'shut');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('eye.L', 'head', [2.5, s.chinY + 5.5, hd.front + 0.3]);
  b.socket('eye.R', 'head', [-2.5, s.chinY + 5.5, hd.front + 0.3]);
  b.socket('halo', 'head', [0, s.chinY + 18, L.headC[2] - 1]);
  hands(b, L, 'skin');
  const torso = body(b, L);
  gloves(b, L);
  pauldron(b, L);
  const cape = longCape(b, L, torso, { mat: 'cloak', lining: 'cloakIn', res: LILLE_RES, yHem: 5, r0: 10.8, r1: 15.4 });
  legs(b, L);
  b.autoShade();
  b.lint();
  return {
    model: b.build(),
    springs: cape.springs,
    colliders: [...cape.colliders, { bone: 'thigh.L', offset: [0, -0.1, 0.02], radius: 0.1 }, { bone: 'thigh.R', offset: [0, -0.1, 0.02], radius: 0.1 }],
    warnings: b.warnings,
  };
}

// ---------------------------------------------------------------------------------------------- head

/**
 * The head: skull, face, the cropped hair; 'shut' and 'open' wear the bicorne, 'god' (Jilliel's head) has none, both
 * eyes open and white lines across the face. Needs the 'head' and 'neck' bones and the head materials.
 */
export function lilleHead(b: ModelBuilder, L: Landmarks, v: 'shut' | 'open' | 'god'): { front: number; x0: number; chin: number } {
  const hd = head(b, L, 'skin');
  b.stamp('head', hd.x0, hd.chin + 9, v === 'shut' ? FACE_SHUT : v === 'open' ? FACE_OPEN : FACE_GOD, { ...faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), t: { mat: 'tattoo' }, w: { mat: 'line' } }, hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  hairDo(b, L, hd);
  if (v !== 'god') bicorne(b, L, hd);
  return hd;
}

/** the head's materials (the god forms share them) */
export function lilleHeadPalette(b: ModelBuilder, open: boolean): void {
  b.mat('skin', ['#7E5644', '#6C4836', '#5B3A2B', '#4C3124', '#3E271C'], { base: 2, rough: 0.55, shadeK: 0.9 });
  b.mat('hair', ['#F3F3F0', '#E8E8E3', '#D6D6D1', '#BDBDB8', '#A3A39F'], { base: 1, rough: 0.5, shadeK: 0.85, dither: 0.04 });
  b.mat('brow', ['#D6D6D1']);
  b.mat('lid', ['#2C1A12']);
  b.mat('sclera', ['#E9E6DE']);
  b.mat('iris', ['#3A2A1E']);
  b.mat('irisD', ['#1B120C']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#3F2219']);
  b.mat('tattoo', open ? ['#5CF09A'] : ['#16161B'], open ? { glow: 0.9 } : { rough: 0.6 });
  b.mat('line', ['#F3F3F0']);
}

/** Short white hair, cropped close: a cap round the back and sides under the hat, short sideburns to the ear lobes. */
function hairDo(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): void {
  const s = L.spec;
  const c = hd.chin, front = hd.front;
  const cz = L.headC[2] - 0.4;
  const hw = s.head.w / 2;
  const cap = subtract(
    intersect(box([0, c + 9.4, cz - 0.4], [hw + 0.6, 5.4, s.head.d / 2 + 0.8], { round: 3.4 }), fn((_x, y, z) => c + 6.5 - Math.max(0, (cz - z) * 0.5) - y, [-12, c - 4, -20], [12, c + 18, 20])),
    // the face, clear of hair below the hairline (a short fringe line straight across)
    fn((x, y, z) => Math.max(z - (front + 3), (front - 2.4) - z, y - (c + 10.8), Math.abs(x) - (hw - 0.3)), [-12, c - 4, front - 4], [12, c + 14, front + 4]),
  );
  b.add('head', cap, 'hair', { only: 'empty', thr: 0.2 });
  // the crop's texture: short strokes back over the skull
  b.paint('head', fn((x, y, z) => Math.abs(Math.sin(x * 1.3 + z * 0.4) * 1.2 + Math.sin(y * 0.9)) - 0.3, [-12, c + 3, -14], [12, c + 18, 14]), 'hair', { shade: 3, where: b.isMat('hair') });
  // short sideburns in front of the ears, down to the lobes
  for (const k of [1, -1]) b.add('head', box([k * (hw + 0.1), c + 6.2, front - 4.2], [0.6, 1.4, 0.8]), 'hair', { thr: 0.2 });
}

/**
 * The fur bicorne, worn athwart: seen from the front a wide half-moon over the brow, its points far out past the ears;
 * a low crown under it; a tiny Zeichen on each side of the front.
 */
function bicorne(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): void {
  const c = hd.chin;
  const cz = L.headC[2] - 0.6;
  const yb = c + 10.4;
  const brim = fn((x, y, z) => {
    // the half-moon: an ellipse cut flat along its base, a thick slab front to back, bulging a little in the middle
    const e = Math.hypot(x / 13.2, (y - yb) / 7.4) - 1;
    const slab = Math.abs(z - cz) - (2.6 + Math.max(0, 1 - Math.abs(x) / 9) * 1.6);
    return Math.max(e * 6, slab, yb - y);
  }, [-15, yb - 1, cz - 6], [15, yb + 9, cz + 6]);
  b.add('head', brim, 'fur', { thr: 0.2 });
  b.add('head', ellipsoid([0, c + 12.2, cz], [6.2, 3.0, 6.0]), 'fur', { thr: 0.2 });
  // the fur's lie: soft streaks up and out from the base
  b.paint('head', fn((x, y, z) => Math.abs(Math.sin(x * 0.9 + (y - yb) * 0.35) * 1.4 + Math.cos(z * 0.8)) - 0.35, [-15, yb - 1, cz - 7], [15, yb + 10, cz + 7]), 'fur', { shade: 4, where: b.isMat('fur') });
  // the points: a darker tip at each end
  for (const k of [1, -1]) b.paint('head', sphere([k * 12.6, yb + 0.8, cz], 1.6), 'fur', { shade: 3, where: b.isMat('fur') });
  // a tiny Zeichen on each side of the front: a stroke and a bar, proud of the fur
  const fz = cz + 3.4;
  for (const k of [1, -1]) {
    const x0 = k * 7.4;
    for (const [dx, dy] of [[0, 0], [0, 1], [0, 2], [-1, 1], [1, 1]] as [number, number][]) {
      const x = Math.round(x0 + dx), y = Math.round(yb + 1.4 + dy);
      let z = Math.round(fz + 3);
      while (z > fz - 4 && b.grid('head').get(x, y, z) === 0) z--;
      b.voxel('head', x, y, z + 1, 'emblem', 0);
    }
  }
}

// ---------------------------------------------------------------------------------------------- body

function torsoSdf(L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  return blend(2.4,
    ellipsoid([0, s.chestY - 0.2, -0.3], [cx + 0.3, 6.4, cz + 0.3]),
    box([0, s.chestY + 1.5, -0.6], [cx - 0.6, 3.6, cz - 0.6], { round: 2.6 }),
    box([0, s.waistY, -0.2], [wx, 4.4, wz], { round: 2.6 }),
    box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 3.6, s.hips[1]], { round: 2.4 }),
    capsule([2.4, sy + 1.4, sz - 0.6], [sx - 1.4, sy - 0.2, sz], 2.4, 2.5), capsule([-2.4, sy + 1.4, sz - 0.6], [-sx + 1.4, sy - 0.2, sz], 2.4, 2.5),
    sphere([sx - 0.4, sy - 0.6, sz], 2.8), sphere([-sx + 0.4, sy - 0.6, sz], 2.8));
}

/** The sleeveless shirt with its stand-up collar; the bare arms. */
function body(b: ModelBuilder, L: Landmarks): Sdf {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const torso = torsoSdf(L);
  addBands(b, torso, 'shirt', [['hips', 30, s.waistY - 1], ['spine', s.waistY - 1, s.chestY - 4], ['chest', s.chestY - 4, 90]], { thr: 1.1 });
  // the arm-holes: the shoulder's skin shows where the sleeves would be
  for (const k of [1, -1]) b.paint('chest', sphere([k * (sx - 0.2), sy - 0.8, sz], 2.9), 'skin', { where: b.isMat('shirt') });
  // the stand-up collar round the neck
  const nz = L.headC[2] - 0.6;
  b.add('chest', fn((x, y, z) => {
    const ring = Math.abs(Math.hypot(x, (z - nz) * 1.05) - (s.neckR + 1.6)) - 0.8;
    return Math.max(ring, y - (s.chinY - 1.2), (s.chinY - 6.2) - y);
  }, [-8, s.chinY - 7, nz - 8], [8, s.chinY + 1, nz + 8]), 'shirt', { thr: 0.2 });
  // seams down the front and a waistband
  b.paint(['chest', 'spine'], box([0, s.chestY - 6, s.chest[1] + 1], [0.45, 10, 1.5]), 'shirt', { shade: 3, where: b.isMat('shirt') });
  b.add('hips', box([0, s.waistY - 2.6, -0.2], [s.waist[0] + 1.2, 1.0, s.waist[1] + 1.2], { round: 1 }), 'pants', { only: 'empty' });
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(1.2, sphere([sx, sy - 0.6, sz], 2.7), capsule([sx, sy - 1, sz], [sx, ey + 0.4, sz], 2.4, 2.1)), 'skin', { mirror: true });
  b.add('forearm.L', blend(1.0, sphere([sx, ey, sz], 2.1), capsule([sx, ey, sz], [sx, wy + 1, sz], 2.1, 1.7)), 'skin', { mirror: true });
  return torso;
}

/** White gloves to mid-forearm, the cuff flared; a winged X stitched on the back of each hand. */
function gloves(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, , sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  const cuffY = (ey + wy) / 2 - 1;
  b.add('forearm.L', blend(0.8, capsule([sx, cuffY, sz], [sx, wy + 0.6, sz], 2.35, 2.0), cylinder([sx, cuffY - 0.6, sz], [sx, cuffY + 0.8, sz], 2.75)), 'glove', { mirror: true });
  for (const bone of ['palm.L', 'fist.L']) b.paint(bone, aabb([-40, -10, -40], [40, wy + 3, 40]), 'glove', { mirror: true, where: b.isMat('skin') });
  // the winged X on the back of the hand (the outside face): two crossed strokes and a little wing off each top arm
  const [wx, , wz] = L.wrist;
  const hy = wy - 3.2;
  const mark = fn((x, y, z) => {
    const u = y - hy, v = z - (wz + 0.2);
    const cross = Math.min(Math.abs(u - v), Math.abs(u + v)) / 1.414 - 0.45;
    const wings = Math.max(Math.abs(u - 2.0) - 0.45, Math.abs(Math.abs(v) - 2.6) - 0.9);
    return Math.max(Math.min(cross, wings), Math.abs(u) - 2.6, Math.abs(v) - 3.6, wx + 0.8 - x);
  }, [wx - 1, hy - 4, wz - 5], [wx + 4, hy + 4, wz + 5]);
  for (const bone of ['palm.L', 'fist.L']) b.paint(bone, mark, 'thread', { mirror: true, where: b.isMat('glove') });
}

/** The fur pauldron on the right shoulder: a heavy mound with a hanging fringe. */
function pauldron(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const x = -sx - 0.4;
  b.add('upperarm.R', blend(1.6,
    ellipsoid([x, sy + 1.4, sz + 0.2], [5.0, 3.6, 5.4]),
    ellipsoid([x - 1.0, sy - 2.0, sz + 0.1], [4.4, 2.8, 5.0]),
    ellipsoid([x + 3.2, sy + 2.6, sz - 0.2], [3.6, 2.4, 4.4])), 'fur', { thr: 0.2 });
  // the fringe: clumps hanging off the lower edge
  for (let i = 0; i < 7; i++) {
    const a = -1.2 + i * 0.4;
    const px = x - 1.6 * Math.cos(a) - 1, pz = sz + Math.sin(a) * 4.6;
    b.add('upperarm.R', capsule([px, sy - 2.4, pz], [px - 0.8, sy - 5.6 - (i % 2) * 1.2, pz * 1.04], 1.2, 0.7), 'fur', { thr: 0.3 });
  }
  b.paint('upperarm.R', fn((xx, y, z) => Math.abs(Math.sin(xx * 0.8 + y * 0.5) + Math.cos(z * 0.9)) - 0.3, [x - 9, sy - 9, sz - 8], [x + 9, sy + 7, sz + 8]), 'fur', { shade: 4, where: b.isMat('fur') });
}

/**
 * Dark-green trousers under white leg pieces: the white covers the front and outer side from the hip to the shoe, cut
 * away round the calf, its top strapped up to the shirt; light shoes.
 */
function legs(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [hx, hy, hz] = s.hip;
  const [kx, ky, kz] = L.knee;
  const [ax, ay, az] = L.ankle;
  b.add('thigh.L', blend(1.4, sphere([hx, hy, hz], 3.4), capsule([hx, hy, hz], [kx, ky + 1, kz], 3.2, 2.6)), 'pants', { mirror: true });
  b.add('shin.L', blend(1.1, sphere([kx, ky, kz], 2.6), capsule([kx, ky, kz], [ax, ay + 2.5, az], 2.5, 2.0)), 'pants', { mirror: true });
  // the white leg pieces over the front and the outer side, from the waistband to the instep; a window cut away at
  // the outside of each calf; strapped up over the waistband to the shirt
  const outer = (x: number, cx: number) => (x - cx) * Math.sign(cx);
  b.paint('thigh.L', fn((x, y, z) => {
    const a = Math.atan2(outer(x, hx), z - hz);
    return Math.max(a > -1.25 && a < 2.4 ? -1 : 1, y - (hy + 5), (ky - 2) - y);
  }, [hx - 6, ky - 3, hz - 6], [hx + 6, hy + 6, hz + 6]), 'panel', { mirror: true, where: b.isMat('pants') });
  b.paint('shin.L', fn((x, y, z) => {
    const a = Math.atan2(outer(x, kx), z - kz);
    const win = a > 0.75 && y > ay + 6 && y < ky - 4;
    return Math.max(a > -1.05 && a < 2.4 && !win ? -1 : 1, y - (ky + 1), (ay - 1) - y);
  }, [kx - 5, ay - 2, kz - 5], [kx + 5, ky + 2, kz + 5]), 'panel', { mirror: true, where: b.isMat('pants') });
  for (const k of [1, -1]) for (const dx of [-1.4, 1.4]) b.paint('hips', box([k * (hx + dx), s.waistY - 3, s.hips[1]], [0.5, 2.6, 3]), 'panel', { where: b.isMat('pants') });
  const f = s.foot;
  b.add('foot.L', capsule([ax, ay + 1.8, az - 0.3], [ax, ay - 1, az - 0.3], 2.3), 'shoe', { mirror: true });
  b.add('foot.L', box([ax, 1.9, az + (f.len / 2 - f.heel) + 0.2], [f.w / 2 + 0.2, 1.8, f.len / 2 + 0.2], { round: 1.4 }), 'shoe', { mirror: true });
  b.paint('foot.L', aabb([ax - 5, -1, az - 8], [ax + 5, 0.6, az + 16]), 'sole', { mirror: true, where: b.isMat('shoe') });
}

// ---------------------------------------------------------------------------------------------- Diagramm

/**
 * Diagramm, 48 vox/m, 2.3 m: the grip at the origin, the barrel along +Z, the scope up. Re-formed (`reformed`): the fur
 * gone, a row of holes along the top of the stock, the barrel shorter and of green reishi, no muzzle cross.
 */
function buildDiagramm(reformed: boolean): VoxelModel {
  const b = new ModelBuilder(reformed ? 'lille-diagramm-r' : 'lille-diagramm', 48);
  b.mat('metal', ['#45474E', '#35373D', '#2A2C31', '#202126', '#18191D'], { base: 2, rough: 0.35, metal: 0.65, shadeK: 0.9 });
  b.mat('fur', ['#577B5E', '#456A4C', '#355239', '#2C4632', '#22382A'], { base: 2, rough: 0.95, dither: 0.09 });
  b.mat('button', ['#4A4A52', '#3A3A40']);
  b.mat('lens', ['#2A3A32', '#1E2A24'], { rough: 0.1, metal: 0.4 });
  b.mat('reticle', ['#7CF0A8'], { glow: 0.6 });
  b.mat('reishi', ['#B6F7CF', '#7CEBA4', '#46D17A'], { base: 1, glow: 0.9 });
  b.bone('root', null, [0, 0, 0]);
  // the stock: a heavy block behind the grip, deeper toward the back, the two square fins at its end (one up, one down)
  b.add('root', blend(1.2, box([0, -0.6, -9], [1.8, 2.4, 9.4], { round: 0.8 }), box([0, -0.6, -17], [1.9, 3.4, 3.2], { round: 0.8 })), 'metal');
  b.add('root', box([0, 5.6, -18], [1.5, 3.2, 2.4], { round: 0.4 }), 'metal');
  b.add('root', box([0, -6.8, -18], [1.5, 3.2, 2.4], { round: 0.4 }), 'metal');
  if (reformed) for (let i = 0; i < 4; i++) b.carve('root', cylinder([0, 2.4, -3 - i * 4], [0, 0.6, -3 - i * 4], 0.9));
  // the receiver and forestock: fur-wrapped (bare metal when re-formed), one button under it
  const recv = box([0, 0.2, 14], [2.1, 2.3, 14], { round: 1 });
  b.add('root', recv, reformed ? 'metal' : 'fur');
  if (!reformed) {
    b.paint('root', fn((x, y, z) => Math.abs(Math.sin(z * 0.7 + y * 0.6) + Math.cos(x * 1.1)) - 0.3, [-4, -3, 0], [4, 4, 29]), 'fur', { shade: 4, where: b.isMat('fur') });
    b.add('root', sphere([0, -2.4, 14], 0.9), 'button');
  }
  // the oversized trigger guard: a loop under the grip
  b.add('root', fn((x, y, z) => Math.max(Math.abs(Math.hypot(y + 3.4, (z - 2) * 0.62) - 3.2) - 0.6, Math.abs(x) - 0.7, y + 1.4), [-2, -8, -6], [2, 0, 10]), 'metal', { thr: 0.2 });
  // the foregrip under the front, where the left hand goes
  b.add('root', capsule([0, -2, 22], [0, -6.4, 23], 1.2), 'metal');
  // the scope: a tube on two rings, the dial on its side, the lens with an X reticle
  b.add('root', cylinder([0, 4.6, 4], [0, 4.6, 21], 1.5, 1.5, 0.4), 'metal');
  b.add('root', cylinder([0, 4.6, 19], [0, 4.6, 22], 1.9, 1.9, 0.3), 'metal');
  for (const z of [7, 17]) b.add('root', box([0, 3, z], [0.8, 1.2, 0.8]), 'metal');
  b.add('root', cylinder([1.2, 4.6, 12], [2.8, 4.6, 12], 1.1), 'metal', { shade: 1 });
  b.paint('root', box([0, 4.6, 22.3], [1.6, 1.6, 0.6]), 'lens');
  for (const [dx, dy] of [[0, 0], [-1, -1], [1, 1], [-1, 1], [1, -1]] as [number, number][]) b.voxel('root', dx, 5 + dy, 22, 'reticle', 0);
  if (!reformed) {
    // the barrel: long and thin, a collar where it leaves the receiver
    b.add('root', cylinder([0, 0.6, 27], [0, 0.6, 86], 1.0, 0.9), 'metal');
    b.add('root', cylinder([0, 0.6, 27], [0, 0.6, 31], 1.6), 'metal');
    // the plus-shaped muzzle, its arms notched
    const mz = 88;
    b.add('root', box([0, 0.6, mz], [3.2, 0.9, 1.6], { round: 0.3 }), 'metal');
    b.add('root', box([0, 0.6, mz], [0.9, 3.2, 1.6], { round: 0.3 }), 'metal');
    for (const [x, y] of [[2.2, 0.6], [-2.2, 0.6], [0, 2.8], [0, -1.6]] as [number, number][]) b.carve('root', box([x, y, mz + 1.2], [0.5, 0.5, 0.8]));
    b.carve('root', cylinder([0, 0.6, mz - 3], [0, 0.6, mz + 3], 0.5));
  } else {
    // re-formed in reishi: a shorter barrel, glowing
    b.add('root', cylinder([0, 0.6, 27], [0, 0.6, 62], 1.2, 1.0), 'reishi');
    b.add('root', cylinder([0, 0.6, 27], [0, 0.6, 31], 1.7), 'reishi', { shade: 2 });
    b.carve('root', cylinder([0, 0.6, 58], [0, 0.6, 64], 0.5));
  }
  b.autoShade({ up: 0.5, open: 1, front: 0 });
  b.lint();
  return b.build();
}

export { SPEC as LILLE_SPEC };
