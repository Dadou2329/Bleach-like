// Even — the Grand Kidō Chief (docs/kits/even.md). An original character, a tribute: his face and hair come from
// photos of the person he honours. Brief: 181 cm → 87 vox to the crown (48 vox/m), tall and slim; the head 12 rows
// (≈ 1/7.2 of his height). Must-haves from the photos: dark, near-black brown hair swept up and back into a soft quiff
// with a side parting, the sides kept short; round clear glasses (pale frames standing proud of the face, a glint in
// each lens); dark brown eyes under straight dark brows; a fair complexion; a big open grin showing the upper teeth;
// a thin violet-blue cord on his left wrist; a round black lens (the badge he wears) — here the guard of his sword.
// Silhouette keys: the quiff, the glasses, the sleeveless cream haori over the black shihakushō, the katana with a
// round black guard at his left hip.
// Looks: 'sealed' — black shihakushō, a violet obi, the sleeveless cream haori of the Grand Kidō Chief (a violet hem
// with cream diamonds, the lens crest on the back); 'shikai' — the same (the blade changes); 'bankai' — the haori
// turned to a long white coat with sleeves, lined with mirror silver, violet at the hem; 'final' (Kōmyō Henjō) — a
// white and silver robe whose trim is violet light, violet light in the quiff, glowing violet eyes (the glasses'
// frames turn to light: a prop of their own).
// Props: Meikyō sealed (a katana: the round black lens guard, a violet wrap) and its sheath; the Shikai (a straight
// blade of clear crystal splitting the light, a silver mirror ring round the lens); the Bankai (a long faceted crystal
// blade with a core of light); the final blade (light); the glasses (twice the head's density) and their final
// version; the aureole (twelve mirror shards round a ring of light).
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, prism, smoothPath, sphere, subtract, torus, tube, type Sdf, type V3 } from '../models/sdf';
import { coatSkirt, faceLegend, feet, hakama, hands, head, humanoidSkeleton, kosodeSleeves, kosodeTorso, obi, shihakushoSprings, type HumanoidSpec, type Landmarks } from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

/** 87 voxels = 1.81 m (to the crown; the quiff stands a little higher) */
export const EVEN_RES = 87 / 1.81;
export type EvenForm = 'sealed' | 'shikai' | 'bankai' | 'final';

/** Tall and slim: a long torso and long legs, narrow shoulders and waist, the adult male head. */
const SPEC: HumanoidSpec = {
  H: 87,
  chinY: 75,
  head: { w: 10, d: 11, h: 12 },
  neckR: 2.4,
  shoulder: [9.1, 69.3, -0.5],
  upperArm: 15.0,
  foreArm: 13.6,
  hand: 9.2,
  armR: 2.3,
  hipsY: 46.6,
  hip: [4.4, 43.6, 0],
  kneeY: 24,
  ankleY: 4.6,
  chest: [7.8, 4.7],
  waist: [6.2, 4.0],
  hips: [6.8, 4.4],
  chestY: 63.4,
  waistY: 53,
  foot: { len: 12.4, w: 5, heel: 3 },
};

const coated = (form: EvenForm) => form === 'bankai' || form === 'final';

function palette(b: ModelBuilder, form: EvenForm): void {
  b.mat('skin', ['#F3DAC6', '#EACAB4', '#DCB59D', '#C79D84', '#AA826A'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#4C3C33', '#3B2E27', '#2F2520', '#241C19', '#1A1517'], { base: 2, rough: 0.45, shadeK: 0.85, dither: 0.03 });
  b.mat('hairLit', ['#CDBDFF'], { glow: 1.5 });
  b.mat('brow', ['#2A1F1A']);
  b.mat('lid', ['#231915']);
  b.mat('sclera', ['#F1EEE8']);
  if (form === 'final') {
    b.mat('iris', ['#C3ABFF'], { glow: 0.9 });
    b.mat('irisD', ['#7556D8'], { glow: 0.5 });
  } else {
    b.mat('iris', ['#4F3729']);
    b.mat('irisD', ['#1E1510']);
  }
  b.mat('hi', form === 'final' ? ['#F3EEFF'] : ['#C4A58E'], form === 'final' ? { glow: 1.2 } : {});
  b.mat('mouth', ['#844C49']);
  b.mat('teeth', ['#EFEDE6']);
  b.mat('black', ['#383A40', '#26272D', '#1C1D22', '#141418'], { base: 1, rough: 0.85, shadeK: 0.9 });
  b.mat('collar', ['#F1F0EC', '#E0DED9', '#C8C6C1'], { base: 0, rough: 0.8 });
  b.mat('obi', ['#5C4F9E', '#4C4088', '#3D3370', '#30285A'], { base: 1, rough: 0.8 });
  // the thin cord on his left wrist (violet-blue, as in the photos)
  b.mat('cord', ['#6E5FDA', '#5547B8']);
  if (form === 'bankai') {
    b.mat('haori', ['#F3F3F0', '#E8E9EA', '#D4D7DC', '#BCC1C9', '#9EA5B0'], { base: 1, rough: 0.75, shadeK: 0.9 });
    b.mat('haoriIn', ['#E6ECF4', '#C7D0DC', '#A3AEBE', '#7D899C'], { base: 1, rough: 0.15, metal: 0.85 });
  } else if (form === 'final') {
    b.mat('haori', ['#F3F2F6', '#E7E5EE', '#D3D0DE', '#BAB6C8', '#9C98AE'], { base: 1, rough: 0.7, shadeK: 0.9 });
    b.mat('haoriIn', ['#E9EDF6', '#CBD3E2', '#A9B3C8', '#8590A8'], { base: 1, rough: 0.15, metal: 0.85 });
  } else {
    b.mat('haori', ['#F1EDE2', '#E7E1D2', '#D6CEBB', '#BEB59F', '#A19780'], { base: 1, rough: 0.8, shadeK: 0.9 });
    b.mat('haoriIn', ['#52468F', '#433979', '#362E64', '#2A234F'], { base: 1, rough: 0.85 });
  }
  b.mat('hem', ['#5E4DAC', '#4E3F94', '#40347C', '#332966'], { base: 1, rough: 0.8 });
  b.mat('diamond', ['#EEE9DC', '#DDD6C6']);
  b.mat('crest', ['#4E3F94']);
  b.mat('silver', ['#E6EAF0', '#C9CFD8', '#A8B0BC', '#7E8796'], { base: 1, rough: 0.25, metal: 0.85, shadeK: 0.8 });
  b.mat('violetGlow', ['#DCCDFF'], { glow: 1.8, rough: 0.3 });
  b.mat('tabi', ['#3A3B41', '#2B2C32', '#202126', '#17171C'], { base: 1, rough: 0.7 });
  b.mat('sole', ['#55555C', '#3E3E45', '#2C2C32'], { base: 1, rough: 0.9 });
  b.mat('strap', ['#4A4458']);
}

/**
 * Rows chin+9 → chin (column 0 is his right), the adult male template with the brows raised a row and arched (the open,
 * cheerful look of the photos; the glasses' top rim sits in the gap), the lid line, dark brown eyes (a light-brown
 * catch-light in the same corner of both — a white one merges with the sclera beside it), the nose as one shade
 * voxel, and the grin — a wide row of upper teeth between the corners, the lower lip under it.
 */
const FACE = [
  '. . B B . . B B . .',
  '. B . . . . . . B .',
  '. L L L . . L L L .',
  '. W * I . . * I W .',
  '. W i i . . i i W .',
  '. . . . . . . . . .',
  '. . . . . s . . . .',
  '. m T T T T T T m .',
  '. . . m m m m . . .',
  '. . . . . . . . . .',
];

const assetCache = new Map<EvenForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function evenAsset(form: EvenForm = 'sealed'): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildEven(form)));
  return a;
}

/**
 * 'katana' (sealed Meikyō), 'saya' (its sheath), 'shikai', 'bankai', 'final' (the blade of light), 'glasses',
 * 'glassesLight' (the final form's frames of light), 'aureole' (twelve mirror shards on a ring of light).
 */
export type EvenProp = 'katana' | 'saya' | 'shikai' | 'bankai' | 'final' | 'glasses' | 'glassesLight' | 'aureole';

export function evenProp(kind: EvenProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'saya' ? buildSaya() : kind === 'glasses' || kind === 'glassesLight' ? buildGlasses(kind === 'glassesLight') : kind === 'aureole' ? buildAureole() : buildBlade(kind);
    propCache.set(kind, m);
  }
  return m;
}

/** blade sample points (prop frame, m) */
export const KATANA_BASE_Z = 5 / 48;
export const KATANA_TIP_Z = 40 / 48;
export const SHIKAI_TIP_Z = 43 / 48;
export const BANKAI_TIP_Z = 55 / 48;
export const FINAL_TIP_Z = 50 / 48;

export function buildEven(form: EvenForm = 'sealed'): CharacterAsset {
  const b = new ModelBuilder(`even-${form}`, EVEN_RES);
  palette(b, form);
  const s = SPEC;
  const L = humanoidSkeleton(b, s, { sleeves: true, hakama: true });
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.5, wy - 4.8, wz + 0.9]);
  b.socket('palm.L', 'palm.L', [wx - 0.5, wy - 4.8, wz + 0.9]);
  b.socket('finger.R', 'palm.R', [-wx + 0.2, wy - s.hand - 0.4, wz + 0.9]);
  b.socket('finger.L', 'palm.L', [wx - 0.2, wy - s.hand - 0.4, wz + 0.9]);
  // Meikyō at the left hip, outside the haori, the hilt forward
  b.socket('hip.L', 'hips', [s.waist[0] + 3.6, s.waistY - 3.6, 2.4], [-20, 0, 6]);
  b.socket('back', 'chest', [0, s.chestY + 2, -8.5]);
  // the final form's aureole hangs behind his shoulders
  b.socket('halo', 'chest', [0, s.chinY + 3, -11]);
  b.socket('chest.front', 'chest', [0, s.chestY, 6.5]);
  b.socket('throat', 'chest', [0, s.chinY - 5, 2.6]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('mouth', 'head', [0, s.chinY + 1.5, hd.front + 0.5]);
  // the glasses sit on the head's own lattice, the eye block's bottom edge
  b.socket('glasses', 'head', [0, s.chinY + 5, hd.front + 0.6]);
  // a lean jaw
  for (const k of [-1, 1]) b.carve('head', box([k * 5.4, hd.chin + 1.2, hd.front - 2], [0.9, 2.2, 3], { rot: [0, 0, k * 16] }));
  const legend = faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth', teeth: 'teeth' });
  b.stamp('head', hd.x0, hd.chin + 9, FACE, legend, hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  hands(b, L, 'skin', 1.2);
  // the cord on his left wrist, just below the sleeve, on both hand variants
  b.paint(['palm.L', 'fist.L'], cylinder([wx, wy - 0.9, wz], [wx, wy + 0.1, wz], 2.6), 'cord', { where: b.isMat('skin') });
  feet(b, L, 'tabi', 'sole', 'strap');
  const o = { black: 'black', collar: 'collar', skin: 'skin', obi: 'obi', crossY: s.chestY - 1, hemR: 8.4, hakamaHem: 3 };
  const torso = kosodeTorso(b, L, o);
  obi(b, L, o);
  hakama(b, L, o);
  let coat: { springs: SpringDef[]; colliders: ColliderDef[] };
  if (coated(form)) {
    // the long coat's sleeves are the outermost, the mirror lining showing at the mouths
    kosodeSleeves(b, L, { ...o, black: 'haori', collar: 'haori', obi: 'haori', bag: 4.4 });
    const [sx, , sz] = s.shoulder;
    b.paint('forearm.L', cylinder([sx + 0.8, wy - 1.2, sz - 0.6], [sx + 0.8, wy + 2.4, sz - 0.6], 3.6), 'haoriIn', { mirror: true, where: b.isMat('haori') });
    b.paint('forearm.L', cylinder([sx + 0.8, wy + 0.0, sz - 0.6], [sx + 0.8, wy + 1.2, sz - 0.6], 4.9), form === 'final' ? 'violetGlow' : 'hem', { mirror: true, where: b.isMat('haori') });
    coat = longCoat(b, L, form);
  } else {
    kosodeSleeves(b, L, o);
    coat = haori(b, L, torso);
  }
  const hair = quiff(b, L, hd, form);
  b.autoShade();
  b.lint();
  const base = shihakushoSprings();
  return {
    model: b.build(),
    springs: [...base.springs, ...coat.springs, ...hair.springs],
    colliders: [...base.colliders, ...coat.colliders, ...hair.colliders],
    warnings: b.warnings,
  };
}

// ---------------------------------------------------------------------------------------------- the haori and coat

/** The lens crest (13 × 13): a ring, a hexagonal aperture inside it and the bright point at its centre. */
const LENS = [
  '....XXXXX....',
  '..XX.....XX..',
  '.X.........X.',
  '.X...XXX...X.',
  'X...X...X...X',
  'X..X.....X..X',
  'X..X..X..X..X',
  'X..X.....X..X',
  'X...X...X...X',
  '.X...XXX...X.',
  '.X.........X.',
  '..XX.....XX..',
  '....XXXXX....',
];

/** paint pixel art on the back of the body (the backmost voxel of chest or spine at each cell), seen from behind */
function backStamp(b: ModelBuilder, rows: string[], top: number, mat: string): void {
  const mx = (rows[0].length - 1) / 2;
  rows.forEach((row, r) => {
    for (let ci = 0; ci < row.length; ci++) {
      if (row[ci] !== 'X') continue;
      const x = mx - ci, y = top - r;
      let best: { bone: string; z: number } | null = null;
      for (const bone of ['chest', 'spine']) {
        const g = b.grid(bone);
        for (let z = -16; z < 2; z++)
          if (g.get(x, y, z) !== 0) {
            if (!best || z < best.z) best = { bone, z };
            break;
          }
      }
      if (best) b.voxel(best.bone, x, y, best.z, mat, 0);
    }
  });
}

/** the skirt bones a coat builds */
const SKIRT = ['F.L', 'S.L', 'B.L', 'B.R', 'S.R', 'F.R'].flatMap((p) => [`coat.${p}`, `coat.${p}.2`]);

/** cream diamonds in a violet band round the hem, at height yc */
function diamonds(yc: number, h: number): Sdf {
  return fn((x, y, z) => {
    const a = Math.atan2(x, z + 0.6);
    const u = a * 11;
    const P = 6.2;
    const du = Math.abs((((u % P) + P) % P) - P / 2);
    return du / (P / 2) + Math.abs(y - yc) / h - 0.9;
  }, [-30, yc - h - 1, -30], [30, yc + h + 1, 30]);
}

/**
 * Sealed and Shikai: the sleeveless haori of the Grand Kidō Chief, open down the front, the armholes cut round the
 * shoulders; a violet hem band with cream diamonds and the lens crest on the back.
 */
function haori(b: ModelBuilder, L: Landmarks, torso: Sdf): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const top = s.chinY + 8;
  const opening = intersect(
    prism([[-2.3, top], [2.3, top], [3.5, s.chestY + 3], [4.5, s.waistY + 2], [5, s.hipsY - 6], [-5, s.hipsY - 6], [-4.5, s.waistY + 2], [-3.5, s.chestY + 3]], [0, 0, 0], [1, 0, 0], [0, 1, 0], 30),
    halfSpace([0, 0, 1], [0, 0, -1]),
  );
  const shell = subtract(offset(torso, 1.45), offset(torso, 0.2), opening);
  const armholes = [cylinder([sx + 3, sy - 1, sz], [sx - 1.6, sy - 1, sz], 3.3), cylinder([-sx - 3, sy - 1, sz], [-sx + 1.6, sy - 1, sz], 3.3)];
  const body = subtract(shell, ...armholes);
  for (const [bone, y0, y1] of [['spine', s.hipsY + 1, s.waistY + 5], ['chest', s.chestY - 7, top]] as [string, number, number][]) b.add(bone, intersect(body, aabb([-30, y0, -30], [30, y1, 30])), 'haori');
  b.paint(['chest', 'spine'], intersect(offset(opening, 1.0), halfSpace([0, 0, 1], [0, 0, -1])), 'haoriIn', { where: b.isMat('haori') });
  b.paint('chest', blend(0.5, ...armholes.map((a) => offset(a, 0.8))), 'haoriIn', { where: b.isMat('haori') });
  backStamp(b, LENS, Math.round(s.chestY + 6), 'crest');
  const yHem = 9;
  const coat = coatSkirt(b, L, { mat: 'haori', lining: 'haoriIn', yTop: s.waistY - 2, yHem, r0: s.waist[0] + 2.7, r1: s.waist[0] + 6.2, openFront: 15, overlap: 4, thick: 1.4, res: EVEN_RES });
  const outer = b.isMat('haori');
  // the panels' painted folds read as dark streaks on the cream: let the auto-shade model the cloth instead
  b.paint(SKIRT, aabb([-17, -1, -17], [17, s.waistY + 1, 17]), 'haori', { where: outer });
  b.paint(SKIRT, aabb([-30, yHem - 3, -30], [30, yHem + 5.5, 30]), 'hem', { where: outer });
  b.paint(SKIRT, diamonds(yHem + 1.4, 2.6), 'diamond', { where: b.isMat('hem') });
  return coat;
}

/**
 * Bankai and final: the long coat — the haori grown long sleeves and a hem at the ankles, lined with mirror silver,
 * open down the front; violet at the hem (violet light in the final form) and the crest in silver (light).
 */
function longCoat(b: ModelBuilder, L: Landmarks, form: EvenForm): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const torso = blend(3.2,
    box([0, s.chestY - 0.5, -0.3], [cx + 1.1, 5.6, cz + 1.1], { round: 3 }),
    box([0, s.waistY, -0.2], [wx + 1.1, 4.4, wz + 1.1], { round: 2.8 }),
    capsule([2.4, sy + 1.5, sz - 0.8], [sx + 0.5, sy - 0.6, sz], 2.8, 3.1),
    capsule([-2.4, sy + 1.5, sz - 0.8], [-sx - 0.5, sy - 0.6, sz], 2.8, 3.1));
  const front = halfSpace([0, 0, 1], [0, 0, -1]);
  const open = intersect(prism([[-2.6, 100], [2.6, 100], [4.2, s.chestY + 1], [7.6, 30], [-7.6, 30], [-4.2, s.chestY + 1]], [0, 0, 0], [1, 0, 0], [0, 1, 0], 30), front);
  const shellSdf = subtract(offset(torso, 1.7), offset(torso, -0.1), open);
  for (const [bone, y0, y1] of [['spine', s.waistY - 3, s.waistY + 5.5], ['chest', s.waistY + 5.5, 100]] as [string, number, number][]) b.add(bone, intersect(shellSdf, aabb([-30, y0, -30], [30, y1, 30])), 'haori');
  b.paint(['chest', 'spine'], intersect(offset(open, 0.8), front), 'haoriIn', { where: b.isMat('haori') });
  backStamp(b, LENS, Math.round(s.chestY + 6), form === 'final' ? 'violetGlow' : 'crest');
  const yHem = 5;
  const coat = coatSkirt(b, L, { mat: 'haori', lining: 'haoriIn', yTop: s.waistY - 2, yHem, r0: 9.0, r1: 13.4, openFront: 36, overlap: 5, thick: 1.4, res: EVEN_RES });
  const outer = b.isMat('haori');
  b.paint(SKIRT, aabb([-17, -1, -17], [17, s.waistY + 1, 17]), 'haori', { where: outer });
  if (form === 'final') {
    b.paint(SKIRT, aabb([-30, yHem - 3, -30], [30, yHem + 1.4, 30]), 'violetGlow', { where: outer });
    b.paint(SKIRT, aabb([-30, yHem + 3.2, -30], [30, yHem + 4.2, 30]), 'violetGlow', { where: outer });
  } else {
    b.paint(SKIRT, aabb([-30, yHem - 3, -30], [30, yHem + 4, 30]), 'hem', { where: outer });
    // a row of small mirrors above the hem
    b.paint(SKIRT, diamonds(yHem + 7.2, 2.0), 'hem', { where: outer });
  }
  return coat;
}

// ---------------------------------------------------------------------------------------------- hair

/**
 * Short dark hair swept up and back into a soft quiff, parted on his left: the right of the parting lifted in a wave
 * over the forehead and combed back over the crown, the left of it lying flat; the sides short above the ears, the
 * back tapered to the nape. The final form runs violet light along the combed grooves.
 */
function quiff(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }, form: EvenForm): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const c = hd.chin;
  const front = hd.front;
  const hc: V3 = [L.headC[0], L.headC[1] + 1.2, L.headC[2] - 0.4];
  const capR: V3 = [s.head.w / 2 + 0.55, s.head.h / 2 + 0.8, s.head.d / 2 + 0.8];
  // the cap: a short shell over the skull from the hairline back to the nape
  const cap = intersect(
    ellipsoid(hc, capR),
    halfSpace([0, c + 10, front], [0, -1, 0.82]),
    halfSpace([0, c + 1.6, 0], [0, -1, 0]),
  );
  b.add('head', cap, 'hair');
  // short at the sides: the ears and the temples clear, a trimmed sideburn in front of each ear
  for (const k of [-1, 1]) b.carve('head', box([k * 5.6, c + 5.6, -1.2], [1.4, 2.4, 2.4], { round: 0.8 }));
  for (const k of [-1, 1]) b.paint('head', box([k * 4.9, c + 7.8, 0.6], [0.7, 0.9, 0.8]), 'hair', { where: b.isMat('skin') });
  // the quiff: one smooth mass lifted off the forehead and combed back over the crown, fuller on his right
  b.add('head', blend(2.2,
    ellipsoid([-0.7, c + 12.4, front - 2.6], [4.6, 2.1, 2.5], [-26, 0, 0]),
    ellipsoid([-0.5, c + 12.5, front - 5.4], [4.9, 2.2, 3.2]),
    ellipsoid([0, c + 11.7, front - 8.6], [4.8, 2.0, 2.8])), 'hair');
  // the flat side of the parting
  b.add('head', ellipsoid([3.6, c + 11.3, front - 4.2], [2.2, 1.5, 3.6]), 'hair');
  // the parting: a darker line from the hairline back over the crown, on his left
  b.paint('head', capsule([2.7, c + 12.6, front - 1.8], [2.4, c + 12.3, front - 8.2], 0.5), 'hair', { shade: 4, where: b.isMat('hair') });
  // combed grooves: from the parting up over the lift and back toward his right
  for (let i = 0; i < 4; i++) {
    const x0 = 1.6 - i * 1.7;
    const groove = smoothPath([[x0 + 0.5, c + 13.0, front - 1.0], [x0 - 0.4, c + 14.2, front - 3.2], [x0 - 1.0, c + 14.0, front - 6.4], [x0 - 1.2, c + 13.0, front - 9.4]], 3);
    const lit = form === 'final' && i % 2 === 0;
    b.paint('head', tube(groove, groove.map(() => 0.45)), lit ? 'hairLit' : 'hair', { shade: lit ? 'flat' : 4, where: b.isMat('hair') });
  }
  // keep the face plate bare below the hairline
  b.carve('head', aabb([-5.2, c + 1, front], [5.2, c + 10, front + 6]));
  return { springs: [], colliders: [] };
}

// ---------------------------------------------------------------------------------------------- props

/** the hilt every blade shares: a violet wrap in diamonds over pale ray skin, silver collar and pommel cap */
function hilt(b: ModelBuilder): void {
  b.mat('wrap', ['#6A5CC4', '#5649A6', '#453A88', '#352C6C'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#EDE8DE', '#D6CEC0']);
  b.add('root', box([0, 0, -3.6], [1.05, 1.2, 7.6], { round: 0.5 }), 'wrap');
  b.paint('root', fn((_x, y, z) => Math.abs(((Math.abs(y) + z) % 2.6 + 2.6) % 2.6 - 1.3) - 0.42, [-2, -2, -11.8], [2, 2, 4.5]), 'ray', { where: b.isMat('wrap') });
  b.add('root', box([0, 0, -11.4], [1.2, 1.35, 0.6], { round: 0.35 }), 'silver');
  b.add('root', box([0, -0.05, 4.7], [0.85, 1.2, 0.5]), 'silver');
}

/**
 * Meikyō. The katana (sealed): a slight curve, a round black guard like a camera's lens — a black ring round a disc
 * of glass, a fine silver ring engraved in it. The Shikai: a straight double-edged blade of clear crystal, bands of
 * split light inside it, the guard a silver mirror ring round the lens. The Bankai: a long faceted crystal blade, a
 * core of light down its middle, small mirror petals round the guard. The final blade: light. Origin at the grip, +Z
 * along the blade, the edge toward −Y.
 */
function buildBlade(kind: 'katana' | 'shikai' | 'bankai' | 'final'): VoxelModel {
  const b = new ModelBuilder(`meikyo-${kind}`, 48);
  b.mat('silver', ['#EEF1F5', '#D2D8E0', '#AEB6C2', '#848D9A'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.8 });
  b.mat('black', ['#3A3A42', '#2A2A31', '#1E1E24', '#16161B'], { base: 1, rough: 0.3, metal: 0.3 });
  b.mat('lens', ['#C9D6F2', '#A9B8E2', '#8797CC'], { base: 1, rough: 0.05, metal: 0.6, glow: kind === 'katana' ? 0 : 0.35 });
  if (kind === 'katana') {
    b.mat('steel', ['#E9ECF0', '#D5D9DE', '#B2B8BF', '#9097A0'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
    b.mat('edge', ['#F3F3F0'], { rough: 0.12, metal: 0.8 });
  } else if (kind === 'shikai' || kind === 'bankai') {
    b.mat('steel', ['#F1F5FF', '#DCE5FB', '#C3CFF1', '#A6B2DE'], { base: 1, rough: 0.05, metal: 0.55, glow: 0.22, shadeK: 0.5 });
    b.mat('edge', ['#F6F8FF'], { rough: 0.05, metal: 0.6, glow: 0.7 });
    b.mat('pR', ['#FF9AAE'], { glow: 1.2 });
    b.mat('pY', ['#FFE59A'], { glow: 1.2 });
    b.mat('pC', ['#9AEBFF'], { glow: 1.2 });
    b.mat('pV', ['#BDA6FF'], { glow: 1.2 });
    b.mat('core', ['#D4F6FF'], { glow: 1.8 });
  } else {
    b.mat('steel', ['#F8F5FF', '#ECE4FF', '#DCCFFF'], { base: 1, rough: 0.1, glow: 1.7, shadeK: 0.4 });
    b.mat('edge', ['#FBF9FF'], { glow: 2.6 });
  }
  b.bone('root', null, [0, 0, 0]);
  const z0 = 5;
  const zTip = kind === 'katana' ? 40 : kind === 'shikai' ? 43 : kind === 'bankai' ? 55 : 50;
  if (kind === 'katana') {
    const zEnd = zTip - 3;
    const curve = (z: number) => Math.max(0, z - z0) ** 2 * 0.001;
    b.add('root', fn((x, y, z) => {
      if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
      const cv = curve(z);
      return Math.max(Math.abs(x) - 0.5, y - (0.9 + cv), -1.1 + cv + Math.max(0, z - zEnd) * 0.66 - y, z0 - z, z - zTip);
    }, [-2, -3, z0 - 1], [2, 4, zTip + 1]), 'steel', { thr: 0.3 });
    b.paint('root', fn((_x, y, z) => y - (-0.62 + curve(z) + Math.max(0, z - zEnd) * 0.66), [-2, -3, 0], [2, 4, zTip + 1]), 'edge');
  } else {
    // straight and double-edged, a ridge down the middle (the Bankai's faceted wider), the point a long taper
    const wide = kind === 'bankai' ? 1.6 : 1.25;
    const taper = kind === 'bankai' ? 6 : 4;
    b.add('root', fn((x, y, z) => {
      if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
      const w = wide * Math.min(1, (zTip - z) / taper);
      return Math.max(Math.abs(x) - 0.55 + Math.abs(y) * (kind === 'bankai' ? 0.22 : 0.1), Math.abs(y) - w, z0 - z, z - zTip);
    }, [-2, -3, z0 - 1], [2, 3, zTip + 1]), 'steel', { thr: 0.3 });
    b.paint('root', fn((_x, y) => wide * 0.62 - Math.abs(y), [-2, -3, z0], [2, 3, zTip + 1]), 'edge', { where: b.isMat('steel') });
    if (kind === 'shikai' || kind === 'bankai') {
      // light split inside the crystal: thin slanted bands of colour across both flats
      const bands: [string, number][] = [['pR', 0], ['pY', 1], ['pC', 2], ['pV', 3]];
      for (const [m, i] of bands) {
        const zc = z0 + 6 + i * 1.1;
        b.paint('root', fn((_x, y, z) => Math.abs(z - (zc + y * 1.3) - Math.floor((z - zc - y * 1.3 + 4) / (kind === 'bankai' ? 14 : 12)) * (kind === 'bankai' ? 14 : 12)) - 0.45, [-2, -3, z0 + 2], [2, 3, zTip - 4]), m, { where: b.isMat('steel') });
      }
      if (kind === 'bankai') b.paint('root', fn((_x, y, z) => Math.max(Math.abs(y) - 0.35, z0 + 1 - z, z - (zTip - 5)), [-2, -2, z0], [2, 2, zTip]), 'core', { where: b.isMat('steel') });
    }
  }
  // the guard: a round lens
  const gz = 3.8;
  if (kind === 'katana') {
    b.add('root', torus([0, 0, gz], 3.0, 0.75, [90, 0, 0]), 'black');
    b.add('root', cylinder([0, 0, gz - 0.45], [0, 0, gz + 0.45], 2.8), 'lens', { only: 'empty' });
    b.paint('root', subtract(cylinder([0, 0, gz - 1], [0, 0, gz + 1], 2.15), cylinder([0, 0, gz - 2], [0, 0, gz + 2], 1.6)), 'silver', { where: b.isMat('lens') });
  } else {
    b.add('root', torus([0, 0, gz], 4.0, 0.6, [90, 0, 0]), 'silver');
    b.add('root', cylinder([0, 0, gz - 0.45], [0, 0, gz + 0.45], 3.7), 'lens', { only: 'empty' });
    if (kind === 'bankai' || kind === 'final')
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        const c: V3 = [Math.cos(a) * 5.4, Math.sin(a) * 5.4, gz];
        b.add('root', prism([[0, 1.6], [0.9, 0], [0, -1.2], [-0.9, 0]], c, [-Math.sin(a), Math.cos(a), 0], [Math.cos(a), Math.sin(a), 0], 0.45), 'silver');
      }
  }
  b.add('root', cylinder([0, 0, gz - 0.7], [0, 0, gz + 1.0], 1.4), 'silver');
  hilt(b);
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** The sheath: violet-black lacquer, silver at the mouth and the tip, the violet cord wound below the mouth. */
function buildSaya(): VoxelModel {
  const b = new ModelBuilder('meikyo-saya', 48);
  b.mat('lacquer', ['#3B3452', '#2D2842', '#231F35', '#1A1728'], { base: 1, rough: 0.28, shadeK: 0.8 });
  b.mat('silver', ['#E6EAF0', '#C9CFD8', '#A8B0BC'], { base: 1, rough: 0.25, metal: 0.85 });
  b.mat('cord', ['#6E5FDA', '#5547B8', '#45399A']);
  b.bone('root', null, [0, 0, 0]);
  const Ls = 37;
  b.add('root', box([0, 0, -Ls / 2], [0.95, 1.45, Ls / 2], { round: 0.6 }), 'lacquer');
  b.add('root', box([0, 0, -0.5], [1.15, 1.65, 0.6], { round: 0.3 }), 'silver');
  b.add('root', box([0, 0, -Ls + 0.6], [1.1, 1.6, 0.7], { round: 0.5 }), 'silver');
  for (let i = 0; i < 3; i++) b.add('root', box([0, 0, -3.2 - i * 1.6], [1.2, 1.7, 0.45], { round: 0.3 }), 'cord');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * The glasses at twice the head's density: round frames of clear acrylic standing one voxel off the face, a glint in
 * the same upper corner of each lens, the bridge high between them, the arms back over the ears. Origin at the
 * 'glasses' socket (the bottom of the eye block, on the face plate), +Z out of the face, fine voxels. The final
 * form's frames are violet light.
 */
function buildGlasses(light: boolean): VoxelModel {
  const b = new ModelBuilder(light ? 'even-glasses-light' : 'even-glasses', EVEN_RES * 2);
  if (light) {
    b.mat('frame', ['#EFE8FF', '#DCCFFF', '#C6B4FF'], { base: 1, rough: 0.2, glow: 1.6 });
    b.mat('glint', ['#FFFFFF'], { glow: 2.2 });
  } else {
    b.mat('frame', ['#B9C1CD', '#9EA8B7', '#838E9F', '#6B7688'], { base: 1, rough: 0.2, metal: 0.2 });
    b.mat('glint', ['#F3F3F0'], { rough: 0.05, glow: 0.25 });
  }
  b.bone('root', null, [0, 0, 0]);
  /** signed distance to a rounded rectangle in the XY plane */
  const rr = (x: number, y: number, cx: number, cy: number, hx: number, hy: number, r: number): number => {
    const qx = Math.abs(x - cx) - (hx - r), qy = Math.abs(y - cy) - (hy - r);
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
  };
  for (const k of [-1, 1]) {
    // each lens a rounded square over the eye block: fine x 1..9 from the nose, y −1 (under the eye) to 7 (the brow)
    const x0 = k > 0 ? 1 : -9, x1 = k > 0 ? 9 : -1;
    const cx = (x0 + x1) / 2;
    b.add('root', fn((x, y, z) => {
      const d = rr(x, y, cx, 3, 4, 4, 2.4);
      return Math.max(d, -(d + 1), Math.abs(z - 0.5) - 0.5);
    }, [cx - 6, -3, -1], [cx + 6, 9, 2]), 'frame');
    // the glint: the upper corner toward his right on both lenses (one light)
    b.add('root', aabb([x0 + 2, 5, 0.2], [x0 + 3, 6, 0.8]), 'glint');
    // the arm: from the outer edge back along the side of the head to the ear
    const ax = k > 0 ? 10 : -11;
    b.add('root', aabb([k > 0 ? 9 : -10, 5, 0], [k > 0 ? 10 : -9, 6, 1]), 'frame');
    b.add('root', aabb([ax, 5, -12], [ax + 1, 6, 1]), 'frame');
  }
  // the bridge, high between the lenses
  b.add('root', aabb([-1, 5, 0], [1, 6, 1]), 'frame');
  b.lint(2);
  return b.build();
}

/**
 * The aureole of the final form: twelve long mirror shards standing round a thin ring of light behind his shoulders
 * (built in the XY plane, facing +Z), their edges violet light.
 */
function buildAureole(): VoxelModel {
  const b = new ModelBuilder('meikyo-aureole', 48);
  b.mat('mirror', ['#F2F5FA', '#D6DEE9', '#B3BFCF', '#8E9AAD'], { base: 1, rough: 0.08, metal: 0.95, shadeK: 0.6 });
  b.mat('light', ['#E6DCFF', '#CDBDFF'], { base: 0, glow: 2.2, rough: 0.2 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', torus([0, 0, 0], 13, 0.7, [90, 0, 0]), 'light');
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + Math.PI / 12;
    const long = i % 3 === 0 ? 1.25 : 1;
    const c: V3 = [Math.cos(a) * 18.5 * long, Math.sin(a) * 18.5 * long, -0.5];
    const along: V3 = [Math.cos(a), Math.sin(a), 0], side: V3 = [-Math.sin(a), Math.cos(a), 0];
    // a long diamond: the point outward, the foot on the ring
    b.add('root', prism([[-4.8 * long, 0], [0, 1.7], [5.4 * long, 0], [0, -1.7]], c, along, side, 0.6), 'mirror');
    b.paint('root', subtract(prism([[-4.8 * long, 0], [0, 1.7], [5.4 * long, 0], [0, -1.7]], c, along, side, 2), prism([[-3.7 * long, 0], [0, 0.9], [4.2 * long, 0], [0, -0.9]], c, along, side, 3)), 'light', { where: b.isMat('mirror') });
  }
  b.lint();
  return b.build();
}
