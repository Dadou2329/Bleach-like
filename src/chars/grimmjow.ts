// Grimmjow Jaegerjaquez — Sexta Espada. Construction and palette from docs/roster/E2-espada-2.md §2.
// Sealed: open white jacket with the collar flipped up, bare chest with the abdominal Hollow hole and
// the Getsuga scar, right-side jaw-bone mask, swept-back cyan hair, teal marks under the eyes, white
// hakama, black sash, katana (Pantera) on the left hip, black boots.
// Pantera (Resurrección): mane to the hips, swept-back cat ears, bone headpiece over the brow, white
// segmented armour, black claws and paws, forearm and calf blades, whip tail.
// 1.86 m tall: the standard 84-voxel humanoid body built at 45.3 vox/m.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import {
  aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, prism, smoothPath, sphere, spike, subtract, tube, type Sdf, type V3,
} from '../models/sdf';
import {
  SPEC_ADULT_MALE, addBands, faceLegend, hakama, hands, head, humanoidSkeleton, obi, spikeHair, type HumanoidSpec, type Landmarks, type Spike,
} from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

export const GRIMMJOW_RES = (48 * 84) / 89;
export type GrimmjowForm = 'sealed' | 'pantera';

/** Lean-muscular: broader shoulders and chest, narrow waist, slightly longer forearms. */
const SPEC: HumanoidSpec = {
  ...SPEC_ADULT_MALE,
  shoulder: [10.2, 66.5, -0.5],
  chest: [8.9, 5.2],
  waist: [6.5, 4.3],
  hips: [7.1, 4.7],
  armR: 2.7,
  foreArm: 13.2,
};

function palette(b: ModelBuilder): void {
  b.mat('skin', ['#FAE3CE', '#F2D2B6', '#E6BFA0', '#D8AE8E', '#B88A6C'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#B8EEF9', '#82DAF3', '#4FC6E8', '#39AAD5', '#2B93BE', '#1D6C90'], { base: 2, rough: 0.6, shadeK: 0.85, dither: 0.1 });
  b.mat('brow', ['#2B93BE']);
  b.mat('mark', ['#30BA95', '#23A383', '#187560'], { base: 1, rough: 0.5 });
  b.mat('lid', ['#2A2226']);
  b.mat('sclera', ['#F6F8F9']);
  b.mat('iris', ['#6ED3F4'], { glow: 0.35 });
  b.mat('irisD', ['#10303C']);
  b.mat('hi', ['#FFFFFF']);
  b.mat('mouth', ['#5A2626']);
  b.mat('teeth', ['#FBF9F2'], { rough: 0.35 });
  b.mat('bone', ['#FAF8F1', '#F3F0E6', '#E2DDD0', '#CCC6B5', '#ADA693'], { base: 1, rough: 0.42, shadeK: 1 });
  b.mat('scar', ['#CF8C78', '#B6705E'], { base: 0, rough: 0.6 });
  b.mat('void', ['#060609'], { rough: 1 });
  b.mat('white', ['#FFFFFF', '#F4F3EF', '#E4E6E9', '#CDD3DB', '#AAB3BF'], { base: 1, rough: 0.82, shadeK: 0.9 });
  b.mat('lining', ['#2A2A2F', '#141416', '#0B0B0D'], { base: 1, rough: 0.85 });
  b.mat('sash', ['#2C2C32', '#17171B', '#0E0E11'], { base: 1, rough: 0.8 });
  b.mat('boot', ['#2E2E35', '#121216', '#09090B'], { base: 1, rough: 0.45, metal: 0.1 });
  b.mat('line', ['#ECECEC'], { rough: 0.6 });
  // Pantera
  b.mat('armor', ['#FFFFFC', '#F3F1E8', '#E2DFD3', '#CBC6B6', '#A9A495'], { base: 1, rough: 0.38, shadeK: 1 });
  b.mat('seam', ['#8F8A7C'], { rough: 0.6 });
  b.mat('claw', ['#4A5262', '#23262E', '#141418', '#0A0A0D'], { base: 2, rough: 0.3, metal: 0.25, shadeK: 0.8 });
  b.mat('bladeW', ['#FFFFFF', '#EFECE2', '#D9D4C6', '#B9B2A0'], { base: 1, rough: 0.28, shadeK: 0.8 });
  b.mat('nail', ['#6C7588', '#4A5262', '#2E323C'], { base: 1, rough: 0.2, metal: 0.4, shadeK: 0.7 });
}

/**
 * Face, rows 9 → 0 (y = chin+9 … chin): cocky narrowed eyes with light-blue irises, teal estigma
 * running from the outer corners down the cheeks, a wide toothy grin.
 */
const FACE = [
  '. . . . . . . . . .',
  '. B B . . . . B B .',
  '. . . B . . B . . .',
  '. L W I . . I W L .',
  '. . L i . . i L . .',
  'G G . . . . . . G G',
  '. . . . . s . . . .',
  '. . m T T T T m . .',
  '. . . m m m m . . .',
  '. . . . . . . . . .',
];

const HAIR: Spike[] = [
  // crown: long spikes raked back
  { az: 0, el: 64, len: 7, r: 3.6, flow: [0, 0.35, -1.15], bend: [0, -0.15, -0.35] },
  { az: -36, el: 56, len: 7, r: 3.4, flow: [-0.1, 0.25, -1.05] },
  { az: 36, el: 56, len: 7, r: 3.4, flow: [0.1, 0.25, -1.05] },
  { az: -78, el: 40, len: 5.5, r: 3.2, flow: [-0.05, 0.2, -1.0] },
  { az: 78, el: 40, len: 5.5, r: 3.2, flow: [0.05, 0.2, -1.0] },
  { az: 180, el: 52, len: 6, r: 3.6, flow: [0, 0.1, -0.85] },
  { az: -142, el: 36, len: 5.5, r: 3.4, flow: [0, -0.05, -0.9] },
  { az: 142, el: 36, len: 5.5, r: 3.4, flow: [0, -0.05, -0.9] },
  { az: -112, el: 16, len: 4.2, r: 3.0, flow: [0, -0.2, -0.85] },
  { az: 112, el: 16, len: 4.2, r: 3.0, flow: [0, -0.2, -0.85] },
  { az: 180, el: 18, len: 4.5, r: 3.2, flow: [0, -0.3, -0.75] },
  // front: a fringe rising and sweeping back
  { az: -22, el: 44, len: 5.5, r: 3.0, flow: [-0.05, 1, -0.35] },
  { az: 22, el: 44, len: 5.5, r: 3.0, flow: [0.05, 1, -0.35] },
  { az: 0, el: 46, len: 5, r: 2.8, flow: [0, 1, -0.2] },
  // two loose strands falling over the forehead
  { az: -12, el: 50, len: 6, r: 1.6, flow: [-0.1, -0.5, 0.45], bend: [0, -1.1, -0.45] },
  { az: 11, el: 49, len: 5, r: 1.5, flow: [0.12, -0.5, 0.45], bend: [0.05, -1.0, -0.4] },
];

const assetCache = new Map<GrimmjowForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function grimmjowAsset(form: GrimmjowForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildGrimmjow(form)));
  return a;
}

/** 'katana' (drawn, in hand), 'sheath' (with the sword in it), 'sheath-empty'. */
export function grimmjowProp(kind: 'katana' | 'sheath' | 'sheath-empty'): VoxelModel {
  let m = propCache.get(kind);
  if (!m) propCache.set(kind, (m = kind === 'katana' ? buildPanteraKatana() : buildPanteraSheath(kind === 'sheath')));
  return m;
}

export function buildGrimmjow(form: GrimmjowForm = 'sealed'): CharacterAsset {
  const b = new ModelBuilder(`grimmjow-${form}`, GRIMMJOW_RES);
  palette(b);
  const s = SPEC;
  const sealed = form === 'sealed';
  const L = humanoidSkeleton(b, s, { hakama: sealed });
  b.socket('grip.R', 'fist.R', [-L.wrist[0] + 0.1, L.wrist[1] - 4.3, L.wrist[2] + 0.4]);
  b.socket('grip.L', 'fist.L', [L.wrist[0] - 0.1, L.wrist[1] - 4.3, L.wrist[2] + 0.4]);
  b.socket('palm.R', 'palm.R', [-L.wrist[0] + 0.6, L.wrist[1] - 5, L.wrist[2] + 1]);
  b.socket('palm.L', 'palm.L', [L.wrist[0] - 0.6, L.wrist[1] - 5, L.wrist[2] + 1]);
  b.socket('hip.L', 'hips', [9.2, 46.5, 3.2], [-28, 180, -8]);
  b.socket('face', 'head', [0, s.chinY + 5.5, Math.round(L.headC[2] + s.head.d / 2)]);
  b.socket('mouth', 'head', [0, s.chinY + 2, Math.round(L.headC[2] + s.head.d / 2) + 1]);
  b.socket('elbow.L', 'forearm.L', [L.elbow[0] + 0.5, L.elbow[1] - 1, L.elbow[2] - 3.5]);
  b.socket('elbow.R', 'forearm.R', [-L.elbow[0] - 0.5, L.elbow[1] - 1, L.elbow[2] - 3.5]);
  b.socket('chest.front', 'chest', [0, 61, 7]);

  const torso = bareTorso(b, L);
  const hd = head(b, L, 'skin');
  b.stamp('head', hd.x0, hd.chin + 9, FACE, {
    ...faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth', teeth: 'teeth' }),
    G: { mat: 'mark' },
  }, hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  arms(b, L);
  hands(b, L, sealed ? 'skin' : 'claw');
  if (sealed) {
    spikeHair(b, L, 'hair', HAIR, [], { tufts: 40, tuftFlow: [0, 0.1, -0.6] });
    b.carve('head', aabb([-5, hd.chin + 4, hd.front], [-1, hd.chin + 7, hd.front + 6]));
    b.carve('head', aabb([1, hd.chin + 4, hd.front], [5, hd.chin + 7, hd.front + 6]));
    jawMask(b, L, hd.front);
    jacket(b, L, torso);
    const o = { black: 'white', collar: 'white', skin: 'skin', obi: 'sash', hemR: 8.4 };
    hakama(b, L, o);
    obi(b, L, o);
    boots(b, L);
    b.autoShade();
    b.lint();
    const springs: SpringDef[] = [];
    for (const side of ['L', 'R']) springs.push({ bone: `hakama.${side}`, tail: [0, -0.48, 0], stiffness: 70, damping: 6, gravity: 8, limit: 55, radius: 0.12 });
    springs.push({ bone: 'jacket.L', tail: [0.02, -0.2, 0.02], stiffness: 80, damping: 5, gravity: 9, limit: 40, radius: 0.08 });
    springs.push({ bone: 'jacket.R', tail: [-0.02, -0.2, 0.02], stiffness: 80, damping: 5, gravity: 9, limit: 40, radius: 0.08 });
    springs.push({ bone: 'jacket.B', tail: [0, -0.2, -0.03], stiffness: 90, damping: 5, gravity: 9, limit: 35, radius: 0.08 });
    const colliders: ColliderDef[] = [
      { bone: 'shin.L', offset: [0, -0.15, 0], radius: 0.07 },
      { bone: 'shin.R', offset: [0, -0.15, 0], radius: 0.07 },
      { bone: 'thigh.L', offset: [0, -0.1, 0.02], radius: 0.13 },
      { bone: 'thigh.R', offset: [0, -0.1, 0.02], radius: 0.13 },
    ];
    return { model: b.build(), springs, colliders, warnings: b.warnings };
  }
  const extra = pantera(b, L, hd);
  b.autoShade();
  b.lint();
  return { model: b.build(), springs: extra.springs, colliders: extra.colliders, warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- body

/** Bare, defined torso with the Hollow hole through the abdomen and the Getsuga scar. */
function bareTorso(b: ModelBuilder, L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const chest = box([0, s.chestY - 0.5, -0.3], [cx, 6, cz], { round: 3.4 });
  const waist = box([0, s.waistY, -0.2], [wx, 4.6, wz], { round: 3 });
  const pelvis = box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 3.6, s.hips[1]], { round: 2.6 });
  const trapL = capsule([2.5, sy + 1.6, sz - 0.8], [sx - 1.5, sy - 0.2, sz], 3, 3.1);
  const trapR = capsule([-2.5, sy + 1.6, sz - 0.8], [-sx + 1.5, sy - 0.2, sz], 3, 3.1);
  const balls = [sphere([sx, sy - 0.5, sz], 3.4), sphere([-sx, sy - 0.5, sz], 3.4)];
  const pecs = [ellipsoid([3.7, s.chestY + 1.2, cz - 0.6], [3.9, 2.7, 1.7], [0, 0, -12]), ellipsoid([-3.7, s.chestY + 1.2, cz - 0.6], [3.9, 2.7, 1.7], [0, 0, 12])];
  const lats = [ellipsoid([cx - 0.6, s.chestY - 3, -1], [1.8, 4.5, 3.6]), ellipsoid([-cx + 0.6, s.chestY - 3, -1], [1.8, 4.5, 3.6])];
  const torso = blend(3, chest, waist, pelvis, trapL, trapR, ...balls, ...pecs, ...lats);
  addBands(b, torso, 'skin', [
    ['hips', 36, 45],
    ['spine', 45, 56],
    ['chest', 54, 80],
  ]);
  const F = 1.5; // paint from z > 1.5 (the front) only
  const front = (d: Sdf) => intersect(d, halfSpace([0, 0, F], [0, 0, -1]));
  const line2 = (x0: number, y0: number, x1: number, y1: number, r: number) =>
    front(fn((x, y) => {
      const dx = x1 - x0, dy = y1 - y0;
      const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy)));
      return Math.hypot(x - x0 - dx * t, y - y0 - dy * t) - r;
    }, [Math.min(x0, x1) - 2, Math.min(y0, y1) - 2, -12], [Math.max(x0, x1) + 2, Math.max(y0, y1) + 2, 14]));
  const bones = ['chest', 'spine', 'hips'];
  // pec undersides, sternum, linea alba, abs, the V of the obliques
  for (const k of [-1, 1]) {
    b.paint(bones, line2(k * 1, s.chestY - 1.6, k * 7.2, s.chestY - 0.4, 0.55), 'skin', { shade: 3, where: b.isMat('skin') });
    b.paint(bones, line2(k * 7.6, s.chestY - 1, k * 6.6, s.waistY - 3, 0.5), 'skin', { shade: 3, where: b.isMat('skin') });
    b.paint(bones, line2(k * 5.6, s.waistY - 2.5, k * 1.4, s.hipsY - 0.5, 0.5), 'skin', { shade: 3, where: b.isMat('skin') });
    for (const y of [s.waistY + 6.5, s.waistY - 2.6]) b.paint(bones, line2(k * 1, y, k * 4.4, y + 0.3, 0.45), 'skin', { shade: 3, where: b.isMat('skin') });
  }
  b.paint(bones, line2(0, s.chestY + 3, 0, s.hipsY + 1, 0.45), 'skin', { shade: 3, where: b.isMat('skin') });
  // the Hollow hole: through the abdomen just under the sternum, its rim black as void
  const hy = s.waistY + 2.5;
  b.carve(bones, cylinder([0, hy, -14], [0, hy, 14], 3.1));
  b.paint(bones, cylinder([0, hy, -14], [0, hy, 14], 4.1), 'void', { where: b.isMat('skin') });
  // the scar: left shoulder → right hip, across chest and abs
  b.paint(bones, line2(7.6, s.shoulder[1] - 1, -6.4, s.hipsY + 1.5, 0.5), 'scar', { where: b.isMat('skin') });
  return torso;
}

function arms(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  // upper arm: deltoid cap + biceps
  b.add('upperarm.L', blend(1.5, sphere([sx, sy - 0.5, sz], 3.1), capsule([sx, sy - 1, sz], [sx, ey + 1, sz], 2.8, 2.4), ellipsoid([sx, sy - 6, sz + 0.8], [2.4, 4, 2.2])), 'skin', { mirror: true });
  b.add('forearm.L', blend(1.2, sphere([sx, ey, sz], 2.4), capsule([sx, ey - 0.5, sz], [sx, wy + 1, sz], 2.5, 1.8)), 'skin', { mirror: true });
}

/** Right half of a lower jawbone hugging the right cheek and jaw, a row of teeth along the cheek. */
function jawMask(b: ModelBuilder, L: Landmarks, front: number): void {
  const c = L.spec.chinY;
  // jawline on the character's right (−X), one voxel off the skin: from below the ear to the chin
  const ctrl: V3[] = [[-6.1, c + 5, -1.4], [-6.0, c + 3.2, 0.8], [-5.3, c + 1.7, 2.9], [-3.9, c + 0.6, front - 0.2], [-2, c + 0.1, front + 0.7], [-0.2, c, front + 0.9]];
  const path = smoothPath(ctrl, 6);
  b.add('head', tube(path, path.map(() => 0.8)), 'bone', { thr: 0.3 });
  // teeth: a crenellated row along the upper edge, up the cheek
  let k = 0;
  for (let i = 2; i < path.length - 2; i += 2) {
    const p = path[i];
    const x = Math.floor(p[0] - (p[0] < -3 ? 0.4 : 0)), y = Math.floor(p[1] + 1.2), z = Math.floor(p[2] + (p[0] < -3 ? 0 : 0.4));
    if (k++ % 2 === 0) {
      b.voxel('head', x, y, z, 'teeth', 0);
      b.voxel('head', x, y + 1, z, 'teeth', 1);
    }
  }
}

/** Open white jacket: collar flipped up around the neck, black lining at the lapels, sleeves pushed up. */
function jacket(b: ModelBuilder, L: Landmarks, torso: Sdf): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1];
  // the front opening widens from the collar down to the hem
  const opening = intersect(
    prism([[-3.4, 77], [3.4, 77], [5.4, 62], [6.6, 50], [8.2, 30], [-8.2, 30], [-6.6, 50], [-5.4, 62]], [0, 0, 0], [1, 0, 0], [0, 1, 0], 30),
    halfSpace([0, 0, 1.2], [0, 0, -1]),
  );
  const shell = subtract(offset(torso, 1.3), offset(torso, 0.15), opening);
  addBands(b, intersect(shell, aabb([-30, 46.5, -30], [30, 80, 30])), 'white', [
    ['spine', 46.5, 56],
    ['chest', 54, 80],
  ]);
  // skirt below the waist on three spring panels, flaring over the hakama, open at the front
  const yTop = 47.5, yHem = 35;
  const skirt = (a0: number, a1: number) =>
    fn((x, y, z) => {
      const k = Math.max(0, Math.min(1, (yTop - y) / (yTop - yHem)));
      const rx = 9.8 + k * 1.6, rz = 6.6 + k * 1.4;
      const rho = Math.hypot(x / rx, (z + 0.4) / rz);
      const dr = Math.abs(rho - 1) * Math.min(rx, rz) - 0.6;
      const th = Math.atan2(x, z + 0.4);
      const da = th < a0 ? (a0 - th) * 8 : th > a1 ? (th - a1) * 8 : 0;
      return Math.max(dr, da, y - yTop, yHem - y);
    }, [-13, yHem - 1, -10], [13, yTop + 1, 10]);
  b.boneSym('jacket.L', 'hips', [6.8, yTop, 2]);
  b.bone('jacket.B', 'hips', [0, yTop, -5.5]);
  b.add('jacket.L', skirt(0.62, 1.62), 'white');
  b.add('jacket.R', skirt(-1.62, -0.62), 'white');
  b.add('jacket.B', union2(skirt(1.6, Math.PI), skirt(-Math.PI, -1.6)), 'white');
  // lining: the inner face of the back panel behind the hole (seen through it), and the open front edges
  const hy = s.waistY + 2.5;
  b.paint(['chest', 'spine'], intersect(cylinder([0, hy, -14], [0, hy, 0], 5.5), halfSpace([0, 0, -s.waist[1] - 0.6], [0, 0, -1])), 'lining', { where: b.isMat('white') });
  b.paint(['chest', 'spine'], intersect(offset(opening, 1.1), halfSpace([0, 0, 1.2], [0, 0, -1])), 'lining', { where: b.isMat('white') });
  for (const bone of ['jacket.L', 'jacket.R']) {
    const k = bone === 'jacket.L' ? 1 : -1;
    b.paint(bone, fn((x, y, z) => Math.abs(Math.atan2(x, z + 0.4) - k * 0.62) * 9 - 0.9, [-13, yHem - 1, -10], [13, yTop + 1, 10]), 'lining', { where: b.isMat('white') });
  }
  // collar flipped up: a tall band around the neck, open at the throat, black inside
  const nz = L.headC[2] - 1.1;
  const collar = fn((x, y, z) => {
    const k = Math.max(0, Math.min(1, (y - (sy - 1)) / 9));
    const r = 4.5 + k * 1.2; // flares outward as it rises
    const rho = Math.hypot(x, (z - nz) * 1.1);
    const top = s.chinY + 4 - Math.max(0, z - nz + 2) * 1.1; // high behind the ears, low toward the throat
    return Math.max(Math.abs(rho - r) - 0.7, y - top, sy - 2 - y, z - (nz + 1.6));
  }, [-8, sy - 3, -8], [8, s.chinY + 5, 8]);
  b.add('chest', collar, 'white');
  b.paint('chest', fn((x, y, z) => Math.hypot(x, (z - nz) * 1.1) - (4.4 + Math.max(0, Math.min(1, (y - (sy - 1)) / 9)) * 1.2), [-8, sy - 1, -8], [8, s.chinY + 5, 8]), 'lining', { where: b.isMat('white') });
  // shoulders and sleeves, pushed up to mid-forearm with a bunched cuff
  b.add('upperarm.L', blend(1.5, sphere([sx, sy - 0.5, sz], 3.9), cylinder([sx + 0.2, ey - 0.5, sz], [sx, sy - 0.5, sz], 3.5, 3.7, 1.2)), 'white', { mirror: true });
  const cuffY = ey - 6;
  b.add('forearm.L', blend(1.2, sphere([sx, ey, sz], 3.6), cylinder([sx, cuffY, sz], [sx, ey + 1, sz], 3.4, 3.5, 1)), 'white', { mirror: true });
  b.add('forearm.L', torus([sx, cuffY + 0.6, sz], 3.2, 1.1), 'white', { mirror: true });
  b.paint('forearm.L', cylinder([sx, cuffY - 0.8, sz], [sx, cuffY + 0.2, sz], 3.4), 'lining', { mirror: true, where: b.isMat('white') });
  // folds bunched at the elbow
  for (const dy of [2.2, -2.2]) b.paint('forearm.L', torus([sx, ey + dy, sz], 3.5, 0.55), 'white', { shade: 3, mirror: true });
  b.paint('upperarm.L', capsule([sx + 3.6, sy - 4, sz + 1], [sx + 3.4, ey + 1, sz - 1], 0.6), 'white', { shade: 3, mirror: true });
}

function union2(a: Sdf, c: Sdf): Sdf {
  return blend(0.01, a, c);
}

function torus(c: V3, R: number, r: number): Sdf {
  // ring around the Y axis
  return fn((x, y, z) => Math.hypot(Math.hypot(x - c[0], z - c[2]) - R, y - c[1]) - r, [c[0] - R - r - 1, c[1] - r - 1, c[2] - R - r - 1], [c[0] + R + r + 1, c[1] + r + 1, c[2] + R + r + 1]);
}

/** Black boots with a white line around the sole. */
function boots(b: ModelBuilder, L: Landmarks): void {
  const [ax, ay, az] = L.ankle;
  b.add('foot.L', capsule([ax, ay + 6, az - 0.4], [ax, ay - 1, az - 0.4], 2.7, 2.6), 'boot', { mirror: true });
  const foot = intersect(
    box([ax, 2.2, az + 3], [2.7, 2.2, 6.3], { round: 1.6 }),
    halfSpace([0, 5.2, az + 6.5], [0, 1, 0.6]),
  );
  b.add('foot.L', foot, 'boot', { mirror: true });
  b.paint('foot.L', aabb([ax - 5, 0, az - 8], [ax + 5, 1, az + 12]), 'line', { mirror: true });
  b.paint('foot.L', capsule([ax - 2.8, 4.2, az + 1], [ax + 2.8, 4.2, az + 1], 0.45), 'line', { mirror: true, where: b.isMat('boot') });
}

// ---------------------------------------------------------------------------------------------- Pantera

function pantera(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const R = GRIMMJOW_RES;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  const [hx, hy] = s.hip;
  const ky = L.knee[1], ay = L.ankle[1];
  const c = hd.chin;
  // ---- head: short raked hair on top, mane on three spring bones down to the hips
  spikeHair(b, L, 'hair', [
    { az: 0, el: 62, len: 4, r: 3.6, flow: [0, 0.2, -1.2] },
    { az: -40, el: 52, len: 4, r: 3.4, flow: [-0.1, 0.1, -1.1] },
    { az: 40, el: 52, len: 4, r: 3.4, flow: [0.1, 0.1, -1.1] },
    { az: -20, el: 44, len: 4.5, r: 2.8, flow: [-0.05, 0.9, -0.5] },
    { az: 20, el: 44, len: 4.5, r: 2.8, flow: [0.05, 0.9, -0.5] },
    { az: -90, el: 20, len: 3.5, r: 3.2, flow: [0, -0.3, -0.9] },
    { az: 90, el: 20, len: 3.5, r: 3.2, flow: [0, -0.3, -0.9] },
  ], [], { tufts: 30, tuftFlow: [0, 0, -0.8] });
  b.carve('head', aabb([-5, c + 4, hd.front], [-1, c + 7, hd.front + 6]));
  b.carve('head', aabb([1, c + 4, hd.front], [5, c + 7, hd.front + 6]));
  const back = L.headC[2] - s.head.d / 2;
  b.bone('mane.1', 'head', [0, c + 6, back - 0.5]);
  b.bone('mane.2', 'mane.1', [0, c - 12, back - 4]);
  b.bone('mane.3', 'mane.2', [0, c - 26, back - 5.5]);
  const maneSec = (y0: number, y1: number, z0: number, z1: number, w0: number, w1: number, t0: number, t1: number) =>
    fn((x, y, z) => {
      const k = Math.max(0, Math.min(1, (y0 - y) / (y0 - y1)));
      const w = w0 + (w1 - w0) * k, t = t0 + (t1 - t0) * k, zc = z0 + (z1 - z0) * k;
      // rounded section, locks rippling across the width
      const lock = Math.sin(x * 1.3 + k * 4) * 0.6;
      const ell = Math.hypot(x / w, (z - zc + lock * 0.5) / t) - 1;
      return Math.max(ell * Math.min(w, t), y - y0, y1 - y);
    }, [-14, y1 - 1, -20], [14, y0 + 1, 6]);
  b.add('mane.1', maneSec(c + 9, c - 12.5, back - 1, back - 4, 7, 8, 4.2, 3.4), 'hair');
  b.add('mane.2', maneSec(c - 11.5, c - 26.5, back - 4, back - 5.5, 8, 7.4, 3.4, 2.6), 'hair');
  // ragged tips on the last section
  b.add('mane.3', maneSec(c - 25.5, c - 34, back - 5.5, back - 6, 7.4, 5.6, 2.6, 1.8), 'hair');
  for (let i = -3; i <= 3; i++) b.add('mane.3', spike([i * 2, c - 33, back - 5.4], [i * 0.08, -1, -0.1], 4 + (i % 2 === 0 ? 3 : 0), 1.3, 0.8, { tip: 0.2 }), 'hair', { thr: 0.3 });
  // strands of hair along the locks
  b.paint(['mane.1', 'mane.2', 'mane.3'], fn((x) => Math.abs(((x + 30) % 2.6) - 1.3) - 0.35, [-14, c - 40, -20], [14, c + 10, 6]), 'hair', { shade: 4 });
  // cat ears, swept straight back from the top of the head
  for (const k of [-1, 1]) {
    b.add('head', spike([k * 4, c + 10.5, -1], [k * 0.35, 0.35, -1], 7, 2.4, 1.0, { side: [0, 1, 0], tip: 0.2 }), 'hair', { thr: 0.3 });
    b.paint('head', spike([k * 4.3, c + 10.6, -1.2], [k * 0.35, 0.35, -1], 6, 1.3, 0.5, { side: [0, 1, 0] }), 'skin', { shade: 2, where: b.isMat('hair') });
  }
  // bone headpiece across the brow: a band with a point over the nose
  const brow = blend(1.2,
    capsule([-5.6, c + 9.6, hd.front - 3], [5.6, c + 9.6, hd.front - 3], 1.1),
    capsule([-3, c + 10, hd.front - 0.2], [3, c + 10, hd.front - 0.2], 1.1),
    capsule([0, c + 10.5, hd.front + 0.3], [0, c + 8.3, hd.front + 0.8], 0.9, 0.6));
  b.add('head', brow, 'armor');
  // estigma stretched back to the ear tips
  for (const k of [-1, 1]) b.paint('head', capsule([k * 4.8, c + 4.5, hd.front - 1], [k * 5.6, c + 6.5, -2.5], 0.6), 'mark', { where: b.isMat('skin') });
  // fangs over the grin
  b.voxel('head', -2, c + 2, hd.front, 'teeth', 0);
  b.voxel('head', 1, c + 2, hd.front, 'teeth', 0);
  // ---- segmented armour, the hole still open
  const torsoA = blend(3,
    box([0, s.chestY - 0.5, -0.3], [s.chest[0] + 0.6, 6.2, s.chest[1] + 0.6], { round: 3.4 }),
    box([0, s.waistY, -0.2], [s.waist[0] + 0.6, 4.8, s.waist[1] + 0.6], { round: 3 }),
    box([0, s.hipsY, -0.3], [s.hips[0] + 0.6, 4, s.hips[1] + 0.6], { round: 2.6 }),
    capsule([2.5, sy + 1.6, sz - 0.8], [sx - 1.5, sy - 0.2, sz], 3.2, 3.3),
    capsule([-2.5, sy + 1.6, sz - 0.8], [-sx + 1.5, sy - 0.2, sz], 3.2, 3.3),
    sphere([sx, sy - 0.5, sz], 3.6), sphere([-sx, sy - 0.5, sz], 3.6),
    ellipsoid([3.7, s.chestY + 1.2, s.chest[1] - 0.2], [4, 2.8, 1.8], [0, 0, -12]),
    ellipsoid([-3.7, s.chestY + 1.2, s.chest[1] - 0.2], [4, 2.8, 1.8], [0, 0, 12]));
  addBands(b, torsoA, 'armor', [['hips', 36, 45], ['spine', 45, 56], ['chest', 54, 80]], { only: 'empty' });
  b.paint(['hips', 'spine', 'chest'], torsoA, 'armor', { where: (v) => ['skin', 'scar'].includes(b.matOf(v).mat?.name ?? '') });
  const holeY = s.waistY + 2.5;
  b.carve(['hips', 'spine', 'chest'], cylinder([0, holeY, -14], [0, holeY, 14], 3.1));
  b.paint(['hips', 'spine', 'chest'], cylinder([0, holeY, -14], [0, holeY, 14], 4.1), 'void');
  // segment seams: abdominal bands, chest plates, a spine ridge
  const seams = ['hips', 'spine', 'chest'];
  for (const y of [s.hipsY + 2, s.waistY - 2, s.waistY + 6, s.chestY - 2.2]) b.paint(seams, aabb([-14, y, -12], [14, y + 0.7, 12]), 'seam', { where: b.isMat('armor') });
  b.paint(seams, aabb([-0.4, s.chestY - 2, 1], [0.4, s.chestY + 4, 12]), 'seam', { where: b.isMat('armor') });
  b.add('chest', capsule([0, s.chestY + 4, -s.chest[1] - 1.2], [0, s.waistY - 2, -s.waist[1] - 1.4], 0.9), 'armor');
  // arms: armoured, forearm blades jutting back from the elbows, black claws
  b.add('upperarm.L', blend(1.5, sphere([sx, sy - 0.5, sz], 3.5), capsule([sx, sy - 1, sz], [sx, ey + 1, sz], 3.1, 2.8)), 'armor', { mirror: true });
  b.paint('upperarm.L', aabb([sx - 5, ey + 5, -8], [sx + 5, ey + 5.7, 8]), 'seam', { mirror: true, where: b.isMat('armor') });
  b.add('forearm.L', blend(1.2, sphere([sx, ey, sz], 2.9), capsule([sx, ey - 0.5, sz], [sx, wy + 1.5, sz], 2.9, 2.3)), 'armor', { mirror: true });
  b.paint('forearm.L', aabb([sx - 5, wy + 6, -8], [sx + 5, wy + 6.7, 8]), 'seam', { mirror: true, where: b.isMat('armor') });
  // blades jutting back and up from the forearms just below the elbows
  b.add('forearm.L', prism([[-1, 0], [12, 3.4], [3, 5.2]], [sx + 0.6, ey - 4, sz - 2.2], [0, 0.4472, -0.8944], [0, 0.8944, 0.4472], 0.7), 'bladeW', { mirror: true, thr: 0.2 });
  // claws: long black talons on the open hands and the fists
  for (const bone of ['palm.L', 'fist.L']) {
    const tipY = bone === 'palm.L' ? wy - s.hand - 0.5 : wy - 7;
    for (let i = 0; i < 4; i++) {
      const z = L.wrist[2] - 1.2 + i * 1.4;
      b.add(bone, spike([L.wrist[0] - 0.4, tipY + 2.5, z], [-0.25, -1, 0.15], 7, 0.8, 0.6, { tip: 0.12, bend: [0.35, 0, 0.1] }), 'nail', { mirror: true, thr: 0.3 });
    }
  }
  // legs: armoured thighs and shins, calf blades, black clawed paws
  b.add('thigh.L', blend(1.5, sphere([hx, hy, 0], 4.4), capsule([hx, hy, 0], [hx, ky + 1, 0], 4, 3.1)), 'armor', { mirror: true });
  b.paint('thigh.L', aabb([hx - 6, ky + 8, -8], [hx + 6, ky + 8.7, 8]), 'seam', { mirror: true, where: b.isMat('armor') });
  b.add('shin.L', blend(1.2, sphere([hx, ky, 0], 3.2), capsule([hx, ky, 0], [hx, ay + 2, 0], 3, 2.3), ellipsoid([hx, ky - 5, -1.8], [2.4, 4.5, 2.2])), 'armor', { mirror: true });
  b.add('shin.L', prism([[-1, 0], [10, 3.2], [2.5, 4.8]], [hx, ky - 4, -2.4], [0, 0.5145, -0.8575], [0, 0.8575, 0.5145], 0.7), 'bladeW', { mirror: true, thr: 0.2 });
  b.add('foot.L', blend(1.2, capsule([hx, ay + 3, -0.4], [hx, ay - 1.5, 0.3], 2.4, 2.6), box([hx, 1.8, 3.6], [2.8, 1.8, 4.6], { round: 1.6 })), 'claw', { mirror: true });
  for (let i = 0; i < 3; i++) b.add('foot.L', spike([hx - 1.6 + i * 1.6, 1.4, 7.6], [0, -0.35, 1], 3.5, 0.7, 0.55, { tip: 0.2 }), 'nail', { mirror: true, thr: 0.3 });
  // ---- tail: a long white whip from the lower back on a six-bone spring chain
  const tailBones = ['tail.1', 'tail.2', 'tail.3', 'tail.4', 'tail.5', 'tail.6'];
  let prev = 'hips';
  let p: V3 = [0, s.hipsY - 1, -s.hips[1] - 1];
  const seg = 10.5;
  const springs: SpringDef[] = [];
  tailBones.forEach((name, i) => {
    b.bone(name, prev, p);
    // droops then curls up toward the tip
    const dir: V3 = i < 2 ? [0, -0.55, -0.83] : i < 4 ? [0, -0.15, -1] : [0, 0.35, -0.94];
    const q: V3 = [p[0] + dir[0] * seg, p[1] + dir[1] * seg, p[2] + dir[2] * seg];
    const r0 = 1.7 - i * 0.2, r1 = 1.7 - (i + 1) * 0.2;
    b.add(name, capsule(p, q, Math.max(0.7, r0), Math.max(0.6, r1)), 'armor', { thr: 0.3 });
    if (i < 5) b.paint(name, sphere(q, 1.1), 'seam', { where: b.isMat('armor') });
    springs.push({ bone: name, tail: [(q[0] - p[0]) / R, (q[1] - p[1]) / R, (q[2] - p[2]) / R], stiffness: 60 - i * 7, damping: 4.5, gravity: 4, limit: 50 + i * 6, radius: 0.04 });
    prev = name;
    p = q;
  });
  b.add('tail.6', spike(p, [0, 0.35, -0.94], 4, 0.6, 0.4, { tip: 0.2 }), 'armor', { thr: 0.3 });
  // mane springs
  springs.push({ bone: 'mane.1', tail: [0, -18 / R, -3 / R], stiffness: 70, damping: 5, gravity: 7, limit: 40, radius: 0.12 });
  springs.push({ bone: 'mane.2', tail: [0, -14 / R, -1.5 / R], stiffness: 55, damping: 4.5, gravity: 9, limit: 50, radius: 0.1 });
  springs.push({ bone: 'mane.3', tail: [0, -9 / R, -0.5 / R], stiffness: 45, damping: 4, gravity: 10, limit: 60, radius: 0.08 });
  const colliders: ColliderDef[] = [
    { bone: 'chest', offset: [0, 0.05, -0.02], radius: 0.2 },
    { bone: 'spine', offset: [0, 0, -0.01], radius: 0.16 },
    { bone: 'thigh.L', offset: [0, -0.15, 0], radius: 0.1 },
    { bone: 'thigh.R', offset: [0, -0.15, 0], radius: 0.1 },
  ];
  return { springs, colliders };
}

// ---------------------------------------------------------------------------------------------- sword

/**
 * Pantera, sealed: a plain katana (≈70 cm blade), light-blue wrapped handle, a crooked "S" tsuba.
 * Local frame like Zangetsu: origin at the grip centre, blade along +Z, edge toward −Y.
 */
function buildPanteraKatana(): VoxelModel {
  const b = new ModelBuilder('grimmjow-katana', 48);
  b.mat('steel', ['#F2F6F9', '#D5DCE2', '#A9B2BB'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#FFFFFF'], { rough: 0.12, metal: 0.8 });
  b.mat('wrap', ['#A6DDF1', '#77C3E3', '#4E9DC0'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#EEF3F5']);
  b.mat('guard', ['#C3CAD0', '#9FA8AF', '#6E777E'], { base: 1, rough: 0.35, metal: 0.7 });
  b.bone('root', null, [0, 0, 0]);
  const z0 = 6.5, zEnd = 38, zTip = 41;
  // gently curved katana blade: back (+Y) and edge (−Y) lines rising toward the tip
  const curve = (z: number) => ((z - z0) / (zTip - z0)) ** 2 * 1.6;
  const blade = fn((x, y, z) => {
    if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
    const c = curve(z);
    const top = 0.9 + c, bot = -1.0 + c + Math.max(0, z - zEnd) * 0.6;
    return Math.max(Math.abs(x) - 0.55, y - top, bot - y, z0 - z, z - zTip);
  }, [-2, -3, z0 - 1], [2, 5, zTip + 1]);
  b.add('root', blade, 'steel', { thr: 0.3 });
  b.paint('root', fn((x, y, z) => y - (-0.6 + curve(z) + Math.max(0, z - zEnd) * 0.6), [-2, -3, 0], [2, 5, zTip + 1]), 'edge');
  // crooked "S" tsuba
  b.add('root', prism([[-2.8, 1.2], [-0.8, 2.6], [2.6, 2.4], [2.8, -1.2], [0.8, -2.6], [-2.6, -2.4]], [0, 0, 5.4], [1, 0, 0], [0, 1, 0], 0.55), 'guard');
  b.add('root', box([0, -0.05, 6.2], [0.9, 1.3, 0.5]), 'guard');
  // handle: wrapped with diamonds, pommel cap
  b.add('root', box([0, 0, -0.6], [1.1, 1.25, 5.6], { round: 0.5 }), 'wrap');
  b.paint('root', fn((x, y, z) => Math.abs(((Math.abs(y) + z) % 2.6 + 2.6) % 2.6 - 1.3) - 0.45, [-2, -2, -6.5], [2, 2, 5]), 'ray', { where: b.isMat('wrap') });
  b.add('root', box([0, 0, -6.6], [1.2, 1.35, 0.5], { round: 0.3 }), 'guard');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * Light-blue lacquered sheath; with the sword in it, the hilt sticks out of its mouth.
 * Local frame: origin at the sheath mouth, sheath along +Z, hilt toward −Z.
 */
function buildPanteraSheath(withSword: boolean): VoxelModel {
  const b = new ModelBuilder(withSword ? 'grimmjow-sheath-full' : 'grimmjow-sheath', 48);
  b.mat('lacquer', ['#B6E2F3', '#86CBE6', '#5DAFD1', '#3E8DB1'], { base: 1, rough: 0.3, shadeK: 0.8 });
  b.mat('wrap', ['#A6DDF1', '#77C3E3', '#4E9DC0'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#EEF3F5']);
  b.mat('guard', ['#C3CAD0', '#9FA8AF', '#6E777E'], { base: 1, rough: 0.35, metal: 0.7 });
  b.mat('cord', ['#2D5F86', '#1D4462'], { base: 0, rough: 0.9 });
  b.bone('root', null, [0, 0, 0]);
  const curve = (z: number) => (z / 36) ** 2 * 1.6;
  b.add('root', fn((x, y, z) => {
    const c = curve(Math.max(0, z));
    return Math.max(Math.hypot(x / 1.0, (y - c) / 1.6) - 1, -z, z - 35.5);
  }, [-2, -3, -1], [2, 5, 37]), 'lacquer');
  b.add('root', box([0, 0, 0.4], [1.3, 1.9, 0.6], { round: 0.3 }), 'guard'); // koiguchi
  b.add('root', box([0, curve(35), 35.2], [1.15, 1.8, 0.6], { round: 0.4 }), 'guard'); // kojiri
  b.add('root', torus2([0, 0.2, 4.5], 1.7, 0.45), 'cord'); // sageo knot
  if (withSword) {
    b.add('root', prism([[-2.8, 1.2], [-0.8, 2.6], [2.6, 2.4], [2.8, -1.2], [0.8, -2.6], [-2.6, -2.4]], [0, 0, -1], [1, 0, 0], [0, 1, 0], 0.55), 'guard');
    b.add('root', box([0, 0, -7.4], [1.1, 1.25, 5.6], { round: 0.5 }), 'wrap');
    b.paint('root', fn((x, y, z) => Math.abs(((Math.abs(y) + z) % 2.6 + 2.6) % 2.6 - 1.3) - 0.45, [-2, -2, -13.5], [2, 2, -1.6]), 'ray', { where: b.isMat('wrap') });
    b.add('root', box([0, 0, -13.4], [1.2, 1.35, 0.5], { round: 0.3 }), 'guard');
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** Ring around the Z axis. */
function torus2(c: V3, R: number, r: number): Sdf {
  return fn((x, y, z) => Math.hypot(Math.hypot(x - c[0], y - c[1]) - R, z - c[2]) - r, [c[0] - R - r - 1, c[1] - R - r - 1, c[2] - r - 1], [c[0] + R + r + 1, c[1] + R + r + 1, c[2] + r + 1]);
}
