// Genryūsai Shigekuni Yamamoto — Captain-Commander. Construction and palette from
// docs/roster/B1-captains-1.md §2: 1.68 m and stooped (81 voxels at 48 vox/m), frail-looking in his robes but
// dense and heavily muscled beneath; a bald dome, long white eyebrows drooping past eyes kept shut, a long
// drooping mustache and a white beard to the hips bound with a purple band; two crossed scars above the right
// eye. The oversized captain's haori is worn as a cape, the arms not in its sleeves, the hem near the ankles,
// black lozenges round it and 一 in a rhombus on the back; the black shihakushō under it; a gnarled cane.
// 'stripped' — the haori and the top of the shihakushō taken off for battle: a bare, bulging, scarred torso,
// the kosode hanging from the sash. 'tybw' — the Bankai: no haori, the left arm gone at the shoulder and its
// sleeve hanging empty.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, prism, smoothPath, sphere, spike, subtract, tube, type Sdf, type V3 } from '../models/sdf';
import {
  coatSkirt, faceLegend, feet, hakama, hands, head, humanoidSkeleton, kosodeSleeves, kosodeTorso, obi,
  type HumanoidSpec, type Landmarks,
} from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

export const YAMAMOTO_RES = 81 / 1.68;
export type YamamotoForm = 'robed' | 'stripped' | 'tybw';

/** Average height, broad and thick through the chest and arms. */
const SPEC: HumanoidSpec = {
  H: 81,
  chinY: 69,
  head: { w: 10, d: 11, h: 12 },
  neckR: 3.0,
  shoulder: [10.2, 63.5, -0.5],
  upperArm: 13.8,
  foreArm: 12.6,
  hand: 8.8,
  armR: 3.1,
  hipsY: 43,
  hip: [4.8, 40, 0],
  kneeY: 22,
  ankleY: 4.4,
  chest: [9.4, 5.8],
  waist: [8.2, 5.4],
  hips: [8.0, 5.2],
  chestY: 58.5,
  waistY: 49,
  foot: { len: 11.5, w: 5, heel: 3 },
};

function palette(b: ModelBuilder): void {
  b.mat('skin', ['#F0D2B2', '#E3BE9A', '#D0A884', '#B98F6C', '#8E6A50'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('scar', ['#C98F7D', '#A87060']);
  b.mat('wrinkle', ['#C99F7E']);
  b.mat('whiteHair', ['#F3F3F0', '#F2F0EA', '#E2DED5', '#CFCBC2', '#AEA99F'], { base: 1, rough: 0.6, shadeK: 0.85, dither: 0.04 });
  b.mat('band', ['#8A5AAE', '#6B3F8E', '#4E2C6A']);
  b.mat('lid', ['#5A3A2A']);
  b.mat('black', ['#383A3F', '#26272D', '#1C1D22', '#141418'], { base: 1, rough: 0.85, shadeK: 0.9 });
  b.mat('collar', ['#F3F3F0', '#ECEBE7', '#CFCDC8'], { base: 0, rough: 0.8 });
  b.mat('obi', ['#F3F3F0', '#ECEBE7', '#B5B1AA'], { base: 0, rough: 0.8 });
  b.mat('tabi', ['#F3F3F0', '#ECEBE7', '#C9C7C2'], { base: 0, rough: 0.8 });
  b.mat('straw', ['#C9B48A', '#B49A6A', '#8C7650'], { base: 1, rough: 0.9 });
  b.mat('cord', ['#5B4632']);
  b.mat('haori', ['#F4F3EF', '#EEEDE8', '#DCDBD6', '#C3C4C8', '#A6A8AE'], { base: 1, rough: 0.82, shadeK: 0.9 });
  b.mat('haoriIn', ['#C9C1B0', '#B0A894', '#958D7A'], { base: 1, rough: 0.85 });
  b.mat('ink', ['#1E1E1E', '#151515'], { base: 1 });
}

/** Eyes kept shut under the brows; the nose long and hooked; the mouth lost under the mustache. Rows 9 → 0. */
const FACE = [
  '. . . . . . . . . .',
  '. . . . . . . . . .',
  '. B B B . . B B B .',
  '. . L L . . L L . .',
  '. . . . . . . . . .',
  '. . . . . s . . . .',
  '. . . . . s . . . .',
  '. . . . . . . . . .',
  '. . . . . . . . . .',
  '. . . . . . . . . .',
];

const assetCache = new Map<YamamotoForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function yamamotoAsset(form: YamamotoForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildYamamoto(form)));
  return a;
}

/** 'cane' (the sealed Ryūjin Jakka), 'katana' (drawn), 'sheath', 'bankai' (Zanka no Tachi: charred, ember-cracked). */
export type YamamotoProp = 'cane' | 'katana' | 'sheath' | 'bankai';

export function yamamotoProp(kind: YamamotoProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'cane' ? buildCane() : kind === 'sheath' ? buildSheath() : buildKatana(kind === 'bankai');
    propCache.set(kind, m);
  }
  return m;
}

export const KATANA_TIP_Z = 0.84;
export const CANE_TIP_Z = 0.86;

export function buildYamamoto(form: YamamotoForm = 'robed'): CharacterAsset {
  const b = new ModelBuilder(`yamamoto-${form}`, YAMAMOTO_RES);
  palette(b);
  const s = SPEC;
  const L = humanoidSkeleton(b, s, { sleeves: true, hakama: true });
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 5, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5, wz + 1]);
  b.socket('knuckle.R', 'fist.R', [-wx, wy - 4.3, wz + 3.4]);
  b.socket('knuckle.L', 'fist.L', [wx, wy - 4.3, wz + 3.4]);
  b.socket('hip.L', 'hips', [9.6, s.hipsY + 1, 3.4], [-26, 180, -8]);
  b.socket('chest.front', 'chest', [0, s.chestY, 7]);
  b.socket('back', 'chest', [0, s.chestY + 1, -8]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('eyes', 'head', [0, s.chinY + 6.5, hd.front + 0.3]);
  b.stamp('head', hd.x0, hd.chin + 9, FACE, faceLegend({ skin: 'skin', brow: 'whiteHair', lid: 'lid', sclera: 'skin', iris: 'skin', pupil: 'lid', hi: 'skin', mouth: 'skin' }), hd.front - 1);
  // the hooked nose stands out from the face plate
  b.add('head', capsule([0, hd.chin + 6.5, hd.front], [0, hd.chin + 3.6, hd.front + 0.9], 0.75), 'skin');
  face(b, L, hd);
  hands(b, L, 'skin');
  // thick, heavy forearms and wrists
  feet(b, L, 'tabi', 'straw', 'cord');
  const o = { black: 'black', collar: 'collar', skin: 'skin', obi: 'obi', hemR: 9.4 };
  const springs: SpringDef[] = [];
  const colliders: ColliderDef[] = [];
  if (form === 'stripped') stripped(b, L);
  else {
    kosodeTorso(b, L, o);
    if (form === 'tybw') tybwSleeves(b, L);
    else kosodeSleeves(b, L, o);
  }
  obi(b, L, o);
  hakama(b, L, o);
  if (form === 'robed') {
    const cape = haoriCape(b, L);
    springs.push(...cape.springs);
    colliders.push(...cape.colliders);
  }
  springs.push(...beard(b, L, hd));
  b.autoShade();
  b.lint();
  const R = YAMAMOTO_RES;
  for (const side of ['L', 'R']) {
    if (form !== 'stripped' && !(form === 'tybw' && side === 'L')) springs.push({ bone: `sleeve.${side}`, tail: [0, -0.22, -0.06], stiffness: 38, damping: 5, gravity: 10, limit: 95, radius: 0.05 });
    springs.push({ bone: `hakama.${side}`, tail: [0, -18 / R, 0], stiffness: 70, damping: 6, gravity: 8, limit: 55, radius: 0.12 });
  }
  colliders.push({ bone: 'shin.L', offset: [0, -0.15, 0], radius: 0.07 }, { bone: 'shin.R', offset: [0, -0.15, 0], radius: 0.07 }, { bone: 'chest', offset: [0, 0.04, 0.02], radius: 0.16 }, { bone: 'spine', offset: [0, 0, 0.04], radius: 0.15 });
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- head

/**
 * The long white eyebrows drooping down past the eyes, the crossed scars above the right eye, wrinkles,
 * the long mustache from under the nose drooping past the mouth.
 */
function face(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }): void {
  const c = hd.chin, f = hd.front;
  // the brows: long white tufts from the brow ridge, falling outward and down past the cheeks
  for (const k of [-1, 1]) {
    const path = smoothPath([[k * 1.4, c + 7.6, f - 0.2], [k * 3.6, c + 7.9, f + 0.3], [k * 5.6, c + 6.6, f + 0.4], [k * 6.4, c + 3.8, f - 0.2]], 4);
    b.add('head', tube(path, path.map((_, i) => 1.15 - i * 0.05)), 'whiteHair', { thr: 0.25 });
  }
  // the crossed scars above his right eye (the character's right is −X)
  b.paint('head', capsule([-4.6, c + 10.4, f - 0.5], [-1.6, c + 7.9, f - 0.5], 0.4), 'scar');
  b.paint('head', capsule([-4.4, c + 8, f - 0.5], [-1.8, c + 10.6, f - 0.5], 0.4), 'scar');
  // wrinkles across the forehead and down from the nose
  b.paint('head', capsule([-0.5, c + 10.2, f - 0.5], [3.4, c + 10.4, f - 0.5], 0.3), 'wrinkle');
  for (const k of [-1, 1]) b.paint('head', capsule([k * 1.6, c + 4.6, f - 0.5], [k * 2.8, c + 2.4, f - 0.5], 0.3), 'wrinkle');
  // the bald dome: a faint sheen on the crown
  b.paint('head', sphere([0, c + 12, L.headC[2] - 0.5], 2.4), 'skin', { shade: 0, where: b.isMat('skin') });
  // the mustache: from under the nose, out along the lip and drooping past the mouth to the jaw
  for (const k of [-1, 1]) {
    const path = smoothPath([[k * 0.4, c + 3.4, f + 0.6], [k * 2.4, c + 3, f + 0.8], [k * 3.6, c + 1, f + 0.4], [k * 3.9, c - 2.5, f - 0.2]], 4);
    b.add('head', tube(path, path.map((_, i) => 1.1 - i * 0.04)), 'whiteHair', { thr: 0.25 });
  }
}

/**
 * The beard: white, from the jaw and chin down to the hips, bound with a purple band below the chin; it
 * hangs on a chain of two spring bones.
 */
function beard(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): SpringDef[] {
  const s = L.spec;
  const c = hd.chin, f = hd.front;
  // the beard's root covers the jaw from ear to ear
  b.add('head', intersect(ellipsoid([0, c + 1.4, L.headC[2] + 1.6], [5.8, 3.8, 5.6]), halfSpace([0, c + 3.2, 0], [0, 1, 0]), halfSpace([0, 0, L.headC[2] - 1.5], [0, 0, -1])), 'whiteHair', { thr: 0.2 });
  const top: V3 = [0, c - 1, f - 0.6];
  const mid: V3 = [0, s.chestY - 4, s.chest[1] + 3.6];
  const end: V3 = [0, s.waistY - 6, s.waist[1] + 4.2];
  b.bone('beard1', 'head', top);
  b.bone('beard2', 'beard1', mid);
  const p1 = smoothPath([top, [0, c - 5, f + 0.2], [0, s.chestY + 2, s.chest[1] + 3.4], mid], 4);
  b.add('beard1', tube(p1, p1.map((_, i) => 3.6 - i * 0.12)), 'whiteHair', { thr: 0.25 });
  const p2 = smoothPath([mid, [0, s.chestY - 9, s.chest[1] + 3.9], [0, s.waistY - 1, s.waist[1] + 4.2], end], 4);
  b.add('beard2', tube(p2, p2.map((_, i) => 2.2 - i * 0.12)), 'whiteHair', { thr: 0.25 });
  // strands down its length
  for (const x of [-1.2, 0, 1.2]) b.paint(['beard1', 'beard2'], capsule([x, c - 2, f + 4], [x * 0.5, s.waistY - 6, s.waist[1] + 6.4], 0.45), 'whiteHair', { shade: 3, where: b.isMat('whiteHair') });
  // the purple band below the chin
  b.paint('beard1', aabb([-5, c - 6.2, -20], [5, c - 4.2, 20]), 'band', { where: b.isMat('whiteHair') });
  b.add('beard1', intersect(ellipsoid([0, c - 5.2, f + 0.5], [3.2, 1.1, 3.2]), aabb([-5, c - 6.3, -20], [5, c - 4.1, 20])), 'band', { thr: 0.2 });
  const R = YAMAMOTO_RES;
  return [
    { bone: 'beard1', tail: [(mid[0] - top[0]) / R, (mid[1] - top[1]) / R, (mid[2] - top[2]) / R], stiffness: 70, damping: 6, gravity: 8, limit: 25, radius: 0.08 },
    { bone: 'beard2', tail: [(end[0] - mid[0]) / R, (end[1] - mid[1]) / R, (end[2] - mid[2]) / R], stiffness: 45, damping: 5, gravity: 10, limit: 40, radius: 0.06 },
  ];
}

// ---------------------------------------------------------------------------------------------- the haori

/**
 * The captain's haori worn as a cape: it rests on the shoulders and drapes over the arms, open down the front,
 * the hem near the ankles; the empty sleeves hang at its sides; black lozenges round the hem, 一 in a rhombus
 * on the back.
 */
function haoriCape(b: ModelBuilder, L: Landmarks): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1];
  // the body the cape drapes over: the torso and the hanging upper arms
  const under = blend(3,
    box([0, s.chestY - 0.5, -0.3], [s.chest[0] + 1.1, 6.2, s.chest[1] + 1.1], { round: 3.4 }),
    box([0, s.waistY, -0.2], [s.waist[0] + 1.1, 4.6, s.waist[1] + 1.1], { round: 3 }),
    capsule([sx + 1, sy, sz], [sx + 1.6, ey, sz - 0.5], 4.6), capsule([-sx - 1, sy, sz], [-sx - 1.6, ey, sz - 0.5], 4.6));
  const opening = intersect(
    prism([[-3, 90], [3, 90], [5.6, s.chestY], [8.8, 46], [-8.8, 46], [-5.6, s.chestY]], [0, 0, 0], [1, 0, 0], [0, 1, 0], 30),
    halfSpace([0, 0, 1], [0, 0, -1]),
  );
  const cutY = (x: number, z: number) => sy + 3.4 - Math.max(0, 3.4 - Math.hypot(x, z + 1) * 0.5);
  const neckCut = fn((x, y, z) => y - cutY(x, z), [-30, 30, -30], [30, 90, 30]);
  // hollow inside for the arms to move in, but closed over the shoulders (no open tubes at the top)
  const hollow = intersect(offset(under, 0.3), fn((x, y, z) => y - (cutY(x, z) - 1.8), [-30, 30, -30], [30, 90, 30]));
  const shell = subtract(intersect(offset(under, 1.6), neckCut), hollow, opening);
  for (const [bone, y0, y1] of [['spine', s.waistY - 4, s.waistY + 6], ['chest', s.waistY + 6, 90]] as [string, number, number][]) b.add(bone, intersect(shell, aabb([-30, y0, -30], [30, y1, 30])), 'haori');
  b.paint(['chest', 'spine'], intersect(offset(opening, 1.0), halfSpace([0, 0, 1], [0, 0, -1])), 'haoriIn', { where: b.isMat('haori') });
  // the empty sleeves, hanging from the cape's shoulders at its sides
  const R = YAMAMOTO_RES;
  const springs: SpringDef[] = [];
  for (const k of [1, -1]) {
    const side = k > 0 ? 'L' : 'R';
    b.bone(`cape.${side}`, 'chest', [k * (sx + 3.2), sy - 2, sz - 1]);
    b.add(`cape.${side}`, blend(1.5,
      box([k * (sx + 4), sy - 12, sz - 1.5], [2.0, 10, 5.6], { round: 1.6 }),
      ellipsoid([k * (sx + 3.6), sy - 3, sz - 1], [3, 3.6, 5])), 'haori', { thr: 0.25 });
    // the sleeve's mouth at the bottom shows its lining
    b.paint(`cape.${side}`, aabb([k * (sx + 4) - 3, sy - 23, sz - 8], [k * (sx + 4) + 3, sy - 21, sz + 5]), 'haoriIn', { where: b.isMat('haori') });
    springs.push({ bone: `cape.${side}`, tail: [0, -20 / R, -1 / R], stiffness: 50, damping: 5, gravity: 10, limit: 60, radius: 0.08 });
  }
  // 一 in a rhombus on the upper back
  const g = b.grid('chest');
  const yc = s.chestY + 3;
  for (let x = -7; x <= 7; x++)
    for (let y = yc - 7; y <= yc + 7; y++) {
      const d = Math.abs(x) + Math.abs(y - yc);
      const mark = Math.abs(d - 6.5) < 0.6 || (Math.abs(y - yc) <= 0 && Math.abs(x) <= 3);
      if (!mark) continue;
      for (let z = -18; z < 0; z++)
        if (g.get(x, y, z) !== 0) {
          b.voxel('chest', x, y, z, 'ink', 0);
          break;
        }
    }
  const coat = coatSkirt(b, L, { mat: 'haori', lining: 'haoriIn', yTop: s.waistY - 2, yHem: 6, r0: 11.2, r1: 15.5, openFront: 22, res: YAMAMOTO_RES });
  // the black lozenges round the hem: a band of tall diamonds standing on the hem line
  const cz = -0.6;
  const loz = fn((x, y, z) => {
    const a = Math.atan2(x, z - cz);
    const r = Math.hypot(x, z - cz);
    const n = 20;
    const cell = (a / (Math.PI * 2)) * n;
    const da = (cell - Math.round(cell)) * ((Math.PI * 2) / n) * r;
    return Math.abs(da) / 2.4 + Math.abs(y - 8) / 4.5 - 1;
  }, [-30, 4, -30], [30, 14, 30]);
  b.paint(['F.L', 'S.L', 'B.L', 'B.R', 'S.R', 'F.R'].map((n) => `coat.${n}.2`), loz, 'ink', { where: b.isMat('haori') });
  return { springs: [...springs, ...coat.springs], colliders: coat.colliders };
}

// ---------------------------------------------------------------------------------------------- stripped, TYBW

/** Stripped for battle: a bare, bulging, heavily scarred torso; the kosode hangs from the sash round the hips. */
function stripped(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const torso = blend(3,
    box([0, s.chestY - 0.5, -0.3], [cx, 6, cz], { round: 3.4 }),
    box([0, s.waistY, -0.2], [wx, 4.6, wz], { round: 3 }),
    capsule([2.6, sy + 1.8, sz - 0.8], [sx - 1.5, sy - 0.2, sz], 3.3, 3.4),
    capsule([-2.6, sy + 1.8, sz - 0.8], [-sx + 1.5, sy - 0.2, sz], 3.3, 3.4),
    sphere([sx, sy - 0.5, sz], 3.8), sphere([-sx, sy - 0.5, sz], 3.8),
    // pectorals
    ellipsoid([3.6, s.chestY + 1, cz - 0.6], [4.2, 3.4, 2.2]), ellipsoid([-3.6, s.chestY + 1, cz - 0.6], [4.2, 3.4, 2.2]));
  b.add('spine', intersect(torso, aabb([-30, s.hipsY, -30], [30, s.waistY + 5, 30])), 'skin');
  b.add('chest', intersect(torso, aabb([-30, s.waistY + 5, -30], [30, 90, 30])), 'skin');
  // the muscle lines: the pecs' lower edge, the abdominal grid
  for (const k of [-1, 1]) b.paint('chest', capsule([k * 0.8, s.chestY - 2.2, cz + 1], [k * 6.6, s.chestY - 1.4, cz - 0.4], 0.45), 'skin', { shade: 3 });
  b.paint(['chest', 'spine'], capsule([0, s.chestY - 2, cz + 1], [0, s.waistY - 2, wz + 0.8], 0.4), 'skin', { shade: 3 });
  for (const y of [s.chestY - 5, s.waistY + 2.5, s.waistY - 0.5]) b.paint(['chest', 'spine'], capsule([-3.4, y, wz + 0.8], [3.4, y, wz + 0.8], 0.35), 'skin', { shade: 3 });
  // scars, a lot of them, across the chest, arms and back
  const scars: [V3, V3][] = [
    [[-6.4, s.chestY + 3, cz + 0.6], [2.6, s.chestY - 3, cz + 0.8]], [[3.2, s.chestY + 4.6, cz + 0.4], [7.6, s.chestY - 1, cz - 0.4]],
    [[-2, s.waistY + 3, wz + 0.6], [4.6, s.waistY - 1.6, wz + 0.4]], [[-7, s.chestY - 4, -cz - 0.4], [3, s.chestY + 4, -cz - 0.4]],
    [[5, s.waistY + 5, -wz - 0.4], [-3, s.waistY - 2, -wz - 0.4]],
  ];
  for (const [a, c] of scars) b.paint(['chest', 'spine'], capsule(a, c, 0.45), 'scar');
  // thick, bare arms
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(1.6, sphere([sx, sy - 0.5, sz], 3.7), capsule([sx, sy - 1, sz], [sx, ey + 0.5, sz], 3.6, 3.2), ellipsoid([sx + 0.4, sy - 6, sz + 1.2], [2.6, 4, 2.4])), 'skin', { mirror: true });
  b.add('forearm.L', blend(1.4, sphere([sx, ey, sz], 3.1), capsule([sx, ey - 0.5, sz], [sx, wy + 1, sz], 3.2, 2.4)), 'skin', { mirror: true });
  b.paint('upperarm.L', capsule([sx + 2.6, sy - 3, sz + 2], [sx + 3, sy - 9, sz - 1], 0.4), 'scar', { mirror: true });
  b.paint('forearm.L', capsule([sx + 2, ey - 2, sz + 2], [sx + 2.4, ey - 7, sz - 1.5], 0.4), 'scar', { mirror: true });
  // the kosode top hanging down from the sash, folded round the hips
  const y = s.waistY - 3.5;
  b.add('hips', intersect(subtract(ellipsoid([0, y - 2, -0.3], [wx + 4.2, 4.6, wz + 4.4]), ellipsoid([0, y - 2, -0.3], [wx + 2.4, 6, wz + 2.6])), aabb([-30, y - 6, -30], [30, y + 0.5, 30])), 'black', { thr: 0.25 });
  for (const k of [-1, 1]) b.paint('hips', capsule([k * 3, y - 0.5, wz + 4.4], [k * 5.8, y - 5.6, wz + 3.2], 0.6), 'black', { shade: 3 });
  b.add('hips', capsule([-4, y - 1, wz + 4], [-2.2, y - 6.4, wz + 3.8], 1.2), 'collar', { thr: 0.2 });
}

/** The TYBW sleeves: the right arm's as usual, the left an empty sleeve hanging flat from the shoulder. */
function tybwSleeves(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  // the right arm (mirror the helper's left side onto the right by hand)
  b.add('upperarm.R', cylinder([-sx - 0.6, ey - 1.5, sz - 0.4], [-sx - 0.2, sy + 0.5, sz - 0.2], 4.6, 3.6, 1.4), 'black');
  b.add('upperarm.R', sphere([-sx, sy - 0.5, sz], 3.2), 'black');
  b.add('forearm.R', cylinder([-sx - 0.8, wy + 0.2, sz - 0.6], [-sx - 0.6, ey + 1.5, sz - 0.4], 4.8, 4.4, 1.2), 'black');
  b.carve('forearm.R', cylinder([-sx - 0.8, wy - 1, sz - 0.6], [-sx - 0.8, wy + 3.2, sz - 0.6], 3.5, 3.5));
  b.add('forearm.R', capsule([-sx, wy + 6, sz], [-sx, wy - 0.5, sz], 2.2), 'skin', { only: 'empty' });
  // the left: no arm, an empty sleeve on the chest, flat and hanging, its mouth tucked into the sash
  b.add('chest', blend(1.2, sphere([sx - 0.5, sy - 1, sz], 3.6), box([sx + 0.6, sy - 9, sz - 0.6], [2, 8, 4.2], { round: 1.4 })), 'black');
  b.add('spine', box([sx - 0.4, s.waistY + 1, sz + 0.6], [1.6, 3.8, 3.4], { round: 1.2 }), 'black');
}

// ---------------------------------------------------------------------------------------------- props

/** The gnarled wooden cane at 48 vox/m, the sealed Ryūjin Jakka; held by the knob. Origin at the grip, +Z. */
function buildCane(): VoxelModel {
  const b = new ModelBuilder('ryujin-cane', 48);
  b.mat('wood', ['#9C7448', '#8A6440', '#7B5634', '#5A3D24', '#45301C'], { base: 2, rough: 0.8, shadeK: 0.85 });
  b.bone('root', null, [0, 0, 0]);
  // the knob above the hand and the shaft, crooked and knotted
  const path = smoothPath([[0, 0, -4.5], [0.2, 0.3, 4], [-0.4, -0.2, 14], [0.3, 0.2, 25], [-0.2, -0.1, 34], [0, 0, 41]], 4);
  b.add('root', tube(path, path.map((_, i) => 1.4 - i * 0.025)), 'wood', { thr: 0.2 });
  b.add('root', ellipsoid([0, 0, -5], [2, 2, 2.4]), 'wood');
  for (const z of [9, 19, 29]) b.add('root', ellipsoid([0.6, 0.3, z], [1.4, 1.2, 1.6]), 'wood');
  // the grain
  b.paint('root', fn((x, y, z) => Math.abs(Math.sin(z * 1.3 + Math.atan2(y, x) * 2)) - 0.18, [-3, -3, -8], [3, 3, 42]), 'wood', { shade: 4, where: b.isMat('wood') });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * Ryūjin Jakka at 48 vox/m: a dark-purple wrap over pale rays, a circular bronze guard, a plain steel blade.
 * Zanka no Tachi: the same shape gone charred black, rust patches, hairline ember cracks, a pale line on the
 * edge (Kyokujitsujin). Origin at the grip, +Z, edge −Y.
 */
function buildKatana(bankai: boolean): VoxelModel {
  const b = new ModelBuilder(bankai ? 'zanka-no-tachi' : 'ryujin-jakka', 48);
  b.mat('wrap', ['#5A4280', '#4A3468', '#3B2756', '#2A1C3E'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#D8D2C0', '#B8B19C']);
  b.mat('guard', ['#C9A35A', '#B08A48', '#9C773A', '#7A5A28'], { base: 1, rough: 0.35, metal: 0.8, shadeK: 0.8 });
  if (bankai) {
    b.mat('steel', ['#3A302B', '#2E2724', '#231C19', '#1A1614'], { base: 1, rough: 0.7, metal: 0.4, shadeK: 0.8 });
    b.mat('rust', ['#6E4632', '#5A3828']);
    b.mat('ember', ['#FF8A2A', '#FF5A1A'], { glow: 1.4 });
    b.mat('edge', ['#FFF1C9'], { glow: 1.6 });
  } else {
    b.mat('steel', ['#E2E6EC', '#CDD2D8', '#A8AEB8', '#8A909A'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
    b.mat('edge', ['#F0F3F5'], { rough: 0.12, metal: 0.8 });
  }
  b.bone('root', null, [0, 0, 0]);
  b.add('root', box([0, 0, -4.4], [1.05, 1.2, 5.2], { round: 0.5 }), 'wrap');
  b.paint('root', fn((x, y, z) => Math.abs(((Math.abs(y) + z) % 2.4 + 2.4) % 2.4 - 1.2) - 0.42, [-2, -2, -10], [2, 2, 1]), 'ray', { where: b.isMat('wrap') });
  b.add('root', box([0, 0, -9.8], [1.2, 1.35, 0.5], { round: 0.35 }), 'guard');
  b.add('root', cylinder([0, 0, 1.2], [0, 0, 2.2], 3.4), 'guard', { thr: 0.25 });
  b.add('root', box([0, 0, 2.8], [0.9, 1.2, 0.5]), 'guard');
  const z0 = 3.2, zEnd = 37, zTip = 40.5;
  const curve = (z: number) => ((z - z0) / (zTip - z0)) ** 2 * 1.4;
  b.add('root', fn((x, y, z) => {
    if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
    const cv = curve(z);
    const top = 0.8 + cv, bot = -1.0 + cv + Math.max(0, z - zEnd) * 0.55;
    // the Bankai blade is worn and nicked along its edge
    const nick = bankai ? (Math.sin(z * 2.7) > 0.86 ? 0.4 : 0) : 0;
    return Math.max(Math.abs(x) - 0.45, y - top, bot + nick - y, z0 - z, z - zTip);
  }, [-2, -3, z0 - 1], [2, 5, zTip + 1]), 'steel', { thr: 0.3 });
  b.paint('root', fn((x, y, z) => y - (-0.65 + curve(z) + Math.max(0, z - zEnd) * 0.55), [-2, -3, 0], [2, 5, zTip + 1]), 'edge', { where: b.isMat('steel') });
  if (bankai) {
    b.paint('root', fn((x, y, z) => (Math.abs(Math.sin(z * 0.9 + y * 2.1) * Math.cos(z * 0.37)) > 0.82 ? -1 : 1), [-2, -3, z0], [2, 5, zTip]), 'rust', { where: b.isMat('steel') });
    b.paint('root', fn((x, y, z) => Math.abs(y - (0.1 + curve(z) + Math.sin(z * 1.7) * 0.35)) - 0.22, [-2, -3, z0 + 2], [2, 5, zEnd]), 'ember', { where: b.isMat('steel') });
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** The brown sheath. Origin at the mouth, along +Z. */
function buildSheath(): VoxelModel {
  const b = new ModelBuilder('ryujin-sheath', 48);
  b.mat('saya', ['#7A5034', '#6A452B', '#5B3A22', '#45301C'], { base: 1, rough: 0.4, shadeK: 0.8 });
  b.mat('guard', ['#C9A35A', '#9C773A', '#7A5A28'], { base: 1, rough: 0.35, metal: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  const curve = (z: number) => (z / 38) ** 2 * 1.4;
  b.add('root', fn((x, y, z) => Math.max(Math.hypot(x, (y - curve(Math.max(0, z))) / 1.5) - 1.0, -z, z - 38), [-2, -3, -1], [2, 5, 39]), 'saya');
  b.add('root', box([0, 0, 0.4], [1.25, 1.75, 0.5], { round: 0.3 }), 'guard');
  b.add('root', box([0, curve(37.5), 37.6], [1.1, 1.65, 0.5], { round: 0.4 }), 'guard');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

export { spike };
