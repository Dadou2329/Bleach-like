// Dadou — the Emperor of Hell (docs/kits/dadou.md). An original character: the game's author, his face and hair taken
// from his photos. Brief: 179 cm → 86 vox to the crown (48 vox/m), an athletic build (broader in the shoulders and chest
// than Even); the head 12 rows. Must-haves from the photos: thick, wavy, near-black hair lifted off the forehead in a
// wave and swept back and to his left, kept short (it rises a little over two voxels above the skull) and short at the
// sides, the back and nape covered all round; no glasses (his wish); thick straight dark brows; dark brown eyes; a light
// olive complexion; a big open grin; a gold chain with a square gold pendant. Silhouette keys per form: the Emperor's haori (crimson, gold, a tall collar) → the burning black
// haori and short horns → armour, cape, crown, long horns and a halo of flames → the demon king: a Hollow's horns
// pointing forward, black over half his face, a second pair of arms of black fire and a wheel of fire.
// Looks: 'sealed' — black shihakushō under the Emperor's haori: deep crimson, ankle-length, long wide sleeves with gold
// cuffs, a tall black stand-up collar edged in gold, a black shoulder mantle edged in gold flames, gold borders down the
// front, a gold hem with gold flames above it, gold tasselled cords across the chest, a gold burning chrysanthemum on the
// back; 'shikai' — the haori turned black, crimson and violet flames climbing it from the hem, two short horns, red eyes;
// 'bankai' — black lacquered armour edged in gold (great shoulder plates laced in crimson, a breastplate with a gold demon
// face, gauntlets, skirt plates), a long cape black outside and crimson inside with a tall collar of black flame spikes,
// a black iron crown over long swept-back horns, red eyes; 'final' — his own face, calm and unsmiling, but black has taken
// its left side (edged in burning cracks, that eye burning red in a black socket); two horns like a Hollow's out of his
// hair at the temples and forward past his face; a second pair of arms of obsidian split by burning cracks; the haori
// become a robe of black and gold edged in violet fire.
// Props: Hajun sealed (a katana: a crimson wrap, a gold demon-mask guard) and its sheath; the Shikai (black, a crimson
// edge, violet fire in the groove); the Bankai (a great nodachi of black obsidian with a molten edge); the final blade
// (black fire); the Bankai's halo of flames (karura-en) and the final form's wheel of fire.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, prism, smoothPath, sphere, spike, subtract, torus, tube, type Sdf, type V3 } from '../models/sdf';
import { addBands, coatSkirt, faceLegend, feet, hakama, hands, head, humanoidSkeleton, kosodeSleeves, kosodeTorso, obi, shihakushoSprings, type HumanoidSpec, type Landmarks } from './humanoid';
import { badge, longCape } from './sternritter';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

/** 86 voxels = 1.79 m (to the crown; the hair stands a little higher) */
export const DADOU_RES = 86 / 1.79;
export type DadouForm = 'sealed' | 'shikai' | 'bankai' | 'final';

/** Athletic: broad shoulders and chest, a firm waist, the adult male head. */
const SPEC: HumanoidSpec = {
  H: 86,
  chinY: 74,
  head: { w: 10, d: 11, h: 12 },
  neckR: 2.6,
  shoulder: [9.7, 68.4, -0.5],
  upperArm: 14.8,
  foreArm: 13.4,
  hand: 9.0,
  armR: 2.5,
  hipsY: 46,
  hip: [4.5, 43, 0],
  kneeY: 23.6,
  ankleY: 4.6,
  chest: [8.5, 5.0],
  waist: [6.7, 4.3],
  hips: [7.0, 4.6],
  chestY: 62.6,
  waistY: 52.2,
  foot: { len: 12.4, w: 5.2, heel: 3 },
};

/** the second pair of arms (final form): behind and a little above the shoulders */
const SHOULDER2: V3 = [8.0, 68.6, -5.2];

function palette(b: ModelBuilder, form: DadouForm): void {
  const fin = form === 'final';
  // a light olive complexion (the photos); the demon king's obsidian
  b.mat('skin', ['#F1D0B4', '#E6BFA1', '#D5A988', '#BE9171', '#A17658'], { base: 1, rough: 0.6, shadeK: 0.9 });
  // the demon king's second pair of arms: obsidian
  b.mat('obsidian', ['#544A52', '#433B42', '#352F35', '#29242A', '#1E1A1F'], { base: 1, rough: 0.35, shadeK: 0.9 });
  b.mat('crack', ['#FF4F86'], { glow: 2.0 });
  b.mat('hair', ['#3E322E', '#302724', '#251E1C', '#1D1817', '#161315'], { base: 2, rough: 0.45, shadeK: 0.85, dither: 0.03 });
  b.mat('hairFire', ['#C356FF'], { glow: 1.9 });
  b.mat('brow', ['#1E1613']);
  b.mat('lid', ['#1C1411']);
  b.mat('sclera', ['#F1EEE8']);
  // the demon king: the black that has taken half his face, its burning edge, the eye inside it, his lips (a calm line)
  b.mat('blackFace', ['#3A3238', '#2C262B', '#221D21', '#1A1619'], { base: 1, rough: 0.3, shadeK: 0.9 });
  b.mat('blackEdge', ['#FF3048'], { glow: 1.8 });
  b.mat('eyeGlow', ['#FF3B50'], { glow: 2.6 });
  b.mat('eyeGlowD', ['#D0183A'], { glow: 1.4 });
  b.mat('lip', ['#C38A73']);
  if (form === 'sealed') {
    b.mat('iris', ['#46301F']);
    b.mat('irisD', ['#180F0A']);
    b.mat('hi', ['#B89276']);
  } else {
    b.mat('iris', ['#FF3B4E'], { glow: fin ? 1.0 : 0.8 });
    b.mat('irisD', ['#8A0C1E'], { glow: 0.4 });
    b.mat('hi', ['#FFD2D8'], { glow: fin ? 0.3 : 0.8 });
  }
  b.mat('mouth', ['#7E4440']);
  b.mat('teeth', ['#EFEDE6']);
  b.mat('black', ['#38363C', '#28272C', '#1E1D22', '#161519'], { base: 1, rough: 0.85, shadeK: 0.9 });
  b.mat('collar', ['#F1F0EC', '#E0DED9', '#C8C6C1'], { base: 0, rough: 0.8 });
  b.mat('obi', fin ? ['#F0D27E', '#D9B256', '#B58E3A', '#8C6B26'] : ['#A0233A', '#821B2E', '#661424', '#4C0E1B'], { base: 1, rough: fin ? 0.35 : 0.8, metal: fin ? 0.8 : 0 });
  // the Emperor's haori: crimson (sealed), black (Shikai, final)
  if (form === 'sealed') {
    b.mat('haori', ['#C42B40', '#A82337', '#8A1B2C', '#6B1422', '#500F1A'], { base: 1, rough: 0.7, shadeK: 0.9 });
    b.mat('haoriIn', ['#3A2C32', '#2C2126', '#21191D', '#181216'], { base: 1, rough: 0.8 });
  } else {
    b.mat('haori', ['#40303A', '#30232B', '#241A21', '#1B1419', '#151015'], { base: 1, rough: 0.7, shadeK: 0.9 });
    b.mat('haoriIn', fin ? ['#5A2088', '#481A6E', '#391556', '#2B1042'] : ['#94203A', '#771A2F', '#5C1424', '#440E1B'], { base: 1, rough: 0.8 });
  }
  b.mat('mantle', ['#36303A', '#29242C', '#1F1B22', '#17141A'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('crimsonDark', ['#74202E', '#5C1825', '#46121C', '#331015'], { base: 1, rough: 0.8, shadeK: 0.9 });
  b.mat('gold', ['#F3DA8C', '#E2BE5E', '#C49C3E', '#9C772A', '#76581E'], { base: 1, rough: 0.28, metal: 0.9, shadeK: 0.8 });
  b.mat('flameR', ['#FF5040'], { glow: 1.1 });
  b.mat('flameV', ['#B246FF'], { glow: 1.3 });
  b.mat('flameD', ['#5E1696'], { glow: 0.45 });
  // armour and crown (Bankai)
  b.mat('lacquer', ['#423D48', '#312D36', '#25222A', '#1B1920', '#151418'], { base: 1, rough: 0.22, metal: 0.35, shadeK: 0.85 });
  b.mat('lace', ['#C0253C', '#9C1D31', '#7A1626'], { base: 1, rough: 0.75 });
  b.mat('cape', ['#2E2A31', '#232026', '#1A181D', '#151418'], { base: 1, rough: 0.7, shadeK: 0.9 });
  b.mat('capeIn', ['#A81F36', '#8A192C', '#6C1323', '#500E1A'], { base: 1, rough: 0.75 });
  b.mat('horn', ['#4A4046', '#372F35', '#282226', '#1C181B', '#151316'], { base: 1, rough: 0.35, shadeK: 0.85 });
  b.mat('hornTip', ['#FF2A3C'], { glow: 1.1 });
  b.mat('hornEmber', ['#9E1A2E'], { glow: 0.45 });
  b.mat('ruby', ['#FF2A48'], { glow: 1.1, rough: 0.1 });
  b.mat('tabi', ['#3A3B41', '#2B2C32', '#202126', '#17171C'], { base: 1, rough: 0.7 });
  b.mat('sole', ['#55555C', '#3E3E45', '#2C2C32'], { base: 1, rough: 0.9 });
  b.mat('strap', ['#5A1A26']);
}

/**
 * Rows chin+9 → chin (column 0 is his right): thick straight brows close over the eyes, the lid line, dark eyes (a catch-light in the same corner of both), a strong nose (two shade voxels and a
 * two-voxel tip standing out), and the big grin of the photos — a wide row of upper teeth, the lower lip under it.
 */
const FACE = [
  '. B B B . . B B B .',
  '. . . . . . . . . .',
  '. L L L . . L L L .',
  '. W * I . . * I W .',
  '. W i i . . i i W .',
  '. . . . . . . . . .',
  '. . . . s s . . . .',
  '. m T T T T T T m .',
  '. . . m m m m . . .',
  '. . . . . . . . . .',
];

/**
 * The demon king's face: his own, calm and unsmiling (the lips a faint closed line), but black has taken its left side —
 * the brow, the eye and the cheek — edged in burning cracks, and that eye burns red in a black socket (the other keeps
 * the red of his Bankai).
 */
const FACE_FINAL = [
  '. B B B . . B B B .',
  '. . . . . . . . . .',
  '. L L L . . L L L .',
  '. W * I . . G G K .',
  '. W i i . . g g K .',
  '. . . . . . . . . .',
  '. . . . s s . . . .',
  '. . . p p p p . . .',
  '. . . . . . . . . .',
  '. . . . . . . . . .',
];

/** where the black ends on his face (x, his left being +x), row by row: down the middle, receding below the nose */
function blackEdgeX(y: number, chin: number): number {
  const jag = (((Math.floor(y) * 7) % 3) - 1) * 0.45;
  return 0.2 + Math.max(0, chin + 4 - y) * 0.75 + jag;
}

const assetCache = new Map<DadouForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function dadouAsset(form: DadouForm = 'sealed'): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildDadou(form)));
  return a;
}

/**
 * 'katana' (sealed Hajun), 'saya' (its sheath), 'shikai', 'bankai' (the nodachi), 'final' (black fire), 'halo' (the
 * Bankai's karura-en), 'wheel' (the final form's wheel of fire).
 */
export type DadouProp = 'katana' | 'saya' | 'shikai' | 'bankai' | 'final' | 'halo' | 'wheel';

export function dadouProp(kind: DadouProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'saya' ? buildSaya() : kind === 'halo' ? buildHalo() : kind === 'wheel' ? buildWheel() : buildBlade(kind);
    propCache.set(kind, m);
  }
  return m;
}

/** blade sample points (prop frame, m) */
export const HAJUN_BASE_Z = 5 / 48;
export const KATANA_TIP_Z = 41 / 48;
export const SHIKAI_TIP_Z = 44 / 48;
export const NODACHI_TIP_Z = 74 / 48;
export const FINAL_TIP_Z = 52 / 48;

export function buildDadou(form: DadouForm = 'sealed'): CharacterAsset {
  const b = new ModelBuilder(`dadou-${form}`, DADOU_RES);
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
  b.socket('hip.L', 'hips', [s.waist[0] + 3.8, s.waistY - 3.6, 2.4], [-20, 0, 6]);
  b.socket('back', 'chest', [0, s.chestY + 2, -9]);
  // the Bankai's halo and the final form's wheel hang behind his shoulders
  b.socket('halo', 'chest', [0, s.chinY - 1, -12]);
  b.socket('chest.front', 'chest', [0, s.chestY, 6.8]);
  b.socket('throat', 'chest', [0, s.chinY - 5, 2.8]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('mouth', 'head', [0, s.chinY + 1.5, hd.front + 0.5]);
  b.socket('crown', 'head', [0, s.chinY + 14, -0.5]);
  const legend = faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth', teeth: 'teeth' });
  // the nose stands out two voxels wide
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  b.voxel('head', -1, hd.chin + 3, hd.front, 'skin', 1);
  if (form === 'final') {
    // black over the left side of his face, up into the temple and back over the cheek, its edge burning
    const c = hd.chin;
    b.paint('head', fn((x, y) => blackEdgeX(y, c) - x, [-1, c - 1, hd.front - 7], [7, c + 12, hd.front + 1]), 'blackFace', { where: b.isMat('skin') });
    b.paint('head', fn((x, y) => Math.abs(x - blackEdgeX(y, c)) - 0.55, [-1, c - 1, hd.front - 2], [7, c + 12, hd.front + 1]), 'blackEdge', { where: b.isMat('blackFace') });
    // two cracks branching back across the black cheek
    for (const [y0, y1] of [[c + 6.5, c + 4.5], [c + 2.5, c + 1.5]]) b.paint('head', capsule([1.6, y0, hd.front - 0.5], [4.8, y1, hd.front - 2.5], 0.45), 'blackEdge', { where: b.isMat('blackFace') });
    b.stamp('head', hd.x0, hd.chin + 9, FACE_FINAL, { ...legend, G: { mat: 'eyeGlow' }, g: { mat: 'eyeGlowD' }, K: { mat: 'blackFace', shade: 3 }, p: { mat: 'lip' } }, hd.front - 1);
  } else b.stamp('head', hd.x0, hd.chin + 9, FACE, legend, hd.front - 1);
  hands(b, L, 'skin', 1.2);
  feet(b, L, 'tabi', 'sole', 'strap');
  const o = { black: 'black', collar: 'collar', skin: 'skin', obi: 'obi', crossY: s.chestY - 1, hemR: 8.6, hakamaHem: 3 };
  const torso = kosodeTorso(b, L, o);
  obi(b, L, o);
  hakama(b, L, form === 'bankai' ? { ...o, black: 'crimsonDark' } : o);
  let coat: { springs: SpringDef[]; colliders: ColliderDef[] };
  if (form === 'bankai') {
    armouredArms(b, L);
    coat = armour(b, L, torso);
  } else {
    kosodeSleeves(b, L, { ...o, black: 'haori', collar: 'haori', obi: 'haori', bag: 6 });
    sleeveTrim(b, L, form);
    coat = emperorHaori(b, L, torso, form);
  }
  necklace(b, L, form);
  if (form === 'final') {
    arms2(b, L);
  }
  const hair = dadouHair(b, L, hd);
  if (form === 'shikai') horns(b, hd, 'short');
  if (form === 'bankai') {
    horns(b, hd, 'long');
    crown(b, hd);
  }
  if (form === 'final') horns(b, hd, 'great');
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

// ---------------------------------------------------------------------------------------------- the Emperor's haori

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
        for (let z = -18; z < 2; z++)
          if (g.get(x, y, z) !== 0) {
            if (!best || z < best.z) best = { bone, z };
            break;
          }
      }
      if (best) b.voxel(best.bone, x, y, best.z, mat, 0);
    }
  });
}

/**
 * The burning chrysanthemum (17 × 17): the imperial flower — a disc, a ring and twelve petals — with three tongues of
 * fire rising from its top.
 */
export function chrysanthemum(): string[] {
  const n = 17, c = (n - 1) / 2;
  const rows: string[] = [];
  for (let r = 0; r < n; r++) {
    let row = '';
    for (let col = 0; col < n; col++) {
      const x = col - c, y = c - r + 1.6;
      const d = Math.hypot(x, y), a = Math.atan2(y, x);
      const centre = d < 1.6;
      const ring = d > 2.4 && d < 3.4;
      const petal = d > 3.4 && d < 6.6 && Math.cos(a * 12) > -0.15 && !(d > 5.8 && Math.cos(a * 12) < 0.55);
      // the flames above: three tongues, the middle one tallest
      const fy = c - r, fx = col - c;
      const tongue = (x0: number, h: number) => fy > 5.2 && fy < 5.2 + h && Math.abs(fx - x0 - Math.sin((fy - 5.2) * 0.9) * 0.6) < 1.3 * (1 - (fy - 5.2) / h) + 0.25;
      const flame = tongue(0, 3.4) || tongue(-3.2, 2.3) || tongue(3.2, 2.3);
      row += centre || ring || petal || flame ? 'X' : '.';
    }
    rows.push(row);
  }
  return rows;
}

/** the skirt bones a coat builds */
const SKIRT = ['F.L', 'S.L', 'B.L', 'B.R', 'S.R', 'F.R'].flatMap((p) => [`coat.${p}`, `coat.${p}.2`]);

/** tongues of flame rising from y0 (up to h high) round a garment, `period` voxels apart along its girth */
function flameTongues(y0: number, h: number, period: number, seed = 0): Sdf {
  return fn((x, y, z) => {
    const u = Math.atan2(x, z + 0.6) * 12;
    const i = Math.floor(u / period);
    const f = u / period - i;
    // each tongue its own height, leaning a little as it rises
    const hi = h * (0.55 + 0.45 * Math.abs(Math.sin(i * 12.9898 + seed)));
    const t = (y - y0) / hi;
    const lean = Math.sin(t * 2.6 + i) * 0.12;
    const w = 0.5 * (1 - Math.max(0, t)) ** 0.8;
    return Math.max(Math.abs(f - 0.5 - lean) - w, -t, t - 1) * period * 0.8;
  }, [-30, y0 - 1, -30], [30, y0 + h + 1, 30]);
}

/**
 * Sealed, Shikai and final: the Emperor's haori — ankle-length, open down the front, its long sleeves built with the
 * kosode's; a tall stand-up collar round the back of the neck, a short mantle over the shoulders edged in gold flames,
 * gold borders down the front, a gold hem with flames above it (gold when sealed; crimson and violet fire in the Shikai;
 * violet fire on the demon king's black robe), gold tasselled cords across the chest and the burning chrysanthemum on
 * the back.
 */
function emperorHaori(b: ModelBuilder, L: Landmarks, kosode: Sdf, form: DadouForm): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const torso = blend(3.2,
    box([0, s.chestY - 0.5, -0.3], [cx + 1.1, 5.8, cz + 1.1], { round: 3 }),
    box([0, s.waistY, -0.2], [wx + 1.1, 4.4, wz + 1.1], { round: 2.8 }),
    capsule([2.4, sy + 1.5, sz - 0.8], [sx + 0.5, sy - 0.6, sz], 2.9, 3.2),
    capsule([-2.4, sy + 1.5, sz - 0.8], [-sx - 0.5, sy - 0.6, sz], 2.9, 3.2));
  const front = halfSpace([0, 0, 1], [0, 0, -1]);
  const open = intersect(prism([[-2.8, 100], [2.8, 100], [4.4, s.chestY + 1], [7.4, 30], [-7.4, 30], [-4.4, s.chestY + 1]], [0, 0, 0], [1, 0, 0], [0, 1, 0], 30), front);
  const shellSdf = subtract(offset(torso, 1.8), offset(torso, -0.1), open);
  for (const [bone, y0, y1] of [['spine', s.waistY - 3, s.waistY + 5.5], ['chest', s.waistY + 5.5, 100]] as [string, number, number][]) b.add(bone, intersect(shellSdf, aabb([-30, y0, -30], [30, y1, 30])), 'haori');
  b.paint(['chest', 'spine'], intersect(offset(open, 0.8), front), 'haoriIn', { where: b.isMat('haori') });
  // gold borders down both edges of the opening
  b.paint(['chest', 'spine'], intersect(subtract(offset(open, 1.9), offset(open, 0.8)), front), 'gold', { where: b.isMat('haori') });
  // the shoulder mantle: a short cape over the shoulders and the top of the chest and back, edged in gold flames
  const yMan = s.chestY + 1.5;
  const mantleBody = subtract(offset(torso, 3.1), offset(torso, 1.6), offset(open, 1.2), aabb([-40, -10, -40], [40, yMan, 40]));
  b.add('chest', mantleBody, 'mantle', { thr: 0.1 });
  b.paint('chest', aabb([-40, yMan - 1, -40], [40, yMan + 1.6, 40]), 'gold', { where: b.isMat('mantle') });
  b.paint('chest', flameTongues(yMan + 1.6, 3.6, 4.2, 1.7), form === 'sealed' ? 'gold' : form === 'shikai' ? 'flameR' : 'flameV', { where: b.isMat('mantle') });
  // the tall collar: a flared band round the back and sides of the neck, black with a gold rim
  const nz = L.headC[2] - 1.4;
  const collarSdf = intersect(
    fn((x, y, z) => {
      const t = (y - (sy + 1)) / (s.chinY + 5 - (sy + 1));
      const r = s.neckR + 2.6 + Math.max(0, t) * 2.4;
      return Math.abs(Math.hypot(x, z - nz) - r) - 0.75;
    }, [-14, sy, -14], [14, s.chinY + 6, 10]),
    aabb([-14, sy + 1, -14], [14, s.chinY + 5, 10]),
    halfSpace([0, 0, nz + 1.6], [0, 0, 1]),
  );
  b.add('chest', collarSdf, 'mantle', { thr: 0.15 });
  b.paint('chest', aabb([-14, s.chinY + 3.8, -14], [14, s.chinY + 6, 10]), 'gold', { where: b.isMat('mantle') });
  // gold tasselled cords across the chest, from lapel to lapel, a tassel in the middle
  const cy = s.chestY + 1.2;
  const zf = (x: number) => {
    for (let z = 16; z > -4; z -= 0.1) if (shellSdf.d(x, cy, z) <= 0) return z + 0.3;
    return cz + 2.6;
  };
  const cord: V3[] = [[5.4, cy + 0.6, zf(5.4)], [2.4, cy - 1.8, zf(2.4) + 0.8], [0, cy - 2.6, zf(0) + 1.2], [-2.4, cy - 1.8, zf(-2.4) + 0.8], [-5.4, cy + 0.6, zf(-5.4)]];
  b.add('chest', tube(cord, cord.map(() => 0.55)), 'gold', { thr: 0.1 });
  b.add('chest', blend(0.6, sphere([0, cy - 3.1, zf(0) + 1.3], 0.9), capsule([0, cy - 3.6, zf(0) + 1.3], [0, cy - 6.4, zf(0) + 1.3], 0.7, 1.0)), 'gold');
  // the crest
  backStamp(b, chrysanthemum(), Math.round(s.chestY + 8), form === 'sealed' ? 'gold' : form === 'shikai' ? 'flameR' : 'gold');
  const yHem = 5;
  const coat = coatSkirt(b, L, { mat: 'haori', lining: 'haoriIn', yTop: s.waistY - 2, yHem, r0: 9.4, r1: 13.8, openFront: 34, overlap: 5, thick: 1.4, res: DADOU_RES });
  const outer = b.isMat('haori');
  // let the auto-shade model the cloth, then the gold hem and the flames above it
  b.paint(SKIRT, aabb([-17, -1, -17], [17, s.waistY + 1, 17]), 'haori', { where: outer });
  b.paint(SKIRT, aabb([-30, yHem - 3, -30], [30, yHem + 2.6, 30]), 'gold', { where: outer });
  if (form === 'sealed') b.paint(SKIRT, flameTongues(yHem + 2.6, 6.5, 4.6), 'gold', { where: outer });
  else if (form === 'shikai') {
    // fire climbing the black cloth: violet over crimson, high up the skirt
    b.paint(SKIRT, flameTongues(yHem + 2.6, 22, 5.4, 0.4), 'flameD', { where: outer });
    b.paint(SKIRT, flameTongues(yHem + 2.6, 15, 5.4, 0.4), 'flameV', { where: b.isMat('flameD') });
    b.paint(SKIRT, flameTongues(yHem + 2.6, 8, 5.4, 0.4), 'flameR', { where: b.isMat('flameV') });
  } else {
    b.paint(SKIRT, flameTongues(yHem + 2.6, 11, 4.8, 2.1), 'flameV', { where: outer });
    b.paint(SKIRT, flameTongues(yHem + 2.6, 5, 4.8, 2.1), 'flameR', { where: b.isMat('flameV') });
  }
  // the shell's lower back panel keeps a seam of gold where the skirt hangs from it
  b.paint('spine', aabb([-30, s.waistY - 3, -30], [30, s.waistY - 1.6, 30]), 'gold', { where: outer });
  void kosode;
  return coat;
}

/** gold cuffs at the mouths of the long sleeves (fire in the Shikai), the lining showing inside */
function sleeveTrim(b: ModelBuilder, L: Landmarks, form: DadouForm): void {
  const [sx, , sz] = L.spec.shoulder;
  const wy = L.wrist[1];
  b.paint('forearm.L', cylinder([sx + 0.8, wy - 1.2, sz - 0.6], [sx + 0.8, wy + 2.4, sz - 0.6], 3.8), 'haoriIn', { mirror: true, where: b.isMat('haori') });
  b.paint('forearm.L', cylinder([sx + 0.8, wy + 0.0, sz - 0.6], [sx + 0.8, wy + 1.6, sz - 0.6], 5.2), 'gold', { mirror: true, where: b.isMat('haori') });
  // the bags' hems: gold, with fire above them in the Shikai and on the demon king
  const bagHem = aabb([-40, wy - 8, -40], [40, wy - 3.2, 40]);
  b.paint('sleeve.L', bagHem, 'gold', { mirror: true, where: b.isMat('haori') });
  if (form !== 'sealed') b.paint('sleeve.L', aabb([-40, wy - 3.2, -40], [40, wy - 1.0, 40]), 'flameV', { mirror: true, where: b.isMat('haori') });
}

/** the gold chain round his neck and its square pendant (the photos), over whatever he wears */
function necklace(b: ModelBuilder, L: Landmarks, form: DadouForm): void {
  const s = L.spec;
  const armoured = form === 'bankai';
  const yP = armoured ? s.chestY + 3.5 : s.chestY + 1.0;
  // the pendant lies on the skin of the open V (or on the breastplate)
  let zp = s.chest[1] + 1.2;
  for (let z = 14; z > -2; z -= 0.25) {
    const g = b.grid('chest');
    if (g.get(0, Math.round(yP), Math.round(z)) !== 0) {
      zp = Math.round(z) + 0.6;
      break;
    }
  }
  const chain: V3[] = [[-3.4, s.chinY - 2.2, -0.4], [-2.8, s.chinY - 4.5, 2.4], [-1.2, yP + 3, zp - 0.2], [0, yP + 1.6, zp]];
  const chainR: V3[] = chain.map((p) => [-p[0], p[1], p[2]] as V3);
  b.add('chest', tube(chain, chain.map(() => 0.42)), 'gold', { thr: 0.05 });
  b.add('chest', tube(chainR, chainR.map(() => 0.42)), 'gold', { thr: 0.05 });
  b.add('chest', box([0, yP, zp + 0.2], [1.2, 1.4, 0.45]), 'gold');
  // an embossed mark on the pendant (darker, flat)
  b.paint('chest', box([0, yP, zp + 0.6], [0.5, 0.7, 0.4]), 'gold', { shade: 3 });
}

// ---------------------------------------------------------------------------------------------- the Bankai's armour

/** Tight black sleeves under lacquered gauntlets and the great shoulder plates laced in crimson. */
function armouredArms(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(1.2, sphere([sx, sy - 0.5, sz], 3.0), capsule([sx, sy - 1, sz], [sx, ey + 0.5, sz], 2.9, 2.6)), 'black', { mirror: true });
  b.add('forearm.L', blend(1.0, sphere([sx, ey, sz], 2.7), capsule([sx, ey - 0.5, sz], [sx, wy + 1, sz], 2.6, 2.2)), 'black', { mirror: true });
  // the gauntlet: a lacquered shell over the forearm, gold rings at the wrist and below the elbow
  b.add('forearm.L', subtract(capsule([sx, ey - 2, sz], [sx, wy + 0.4, sz], 3.3, 2.9), capsule([sx, ey - 1, sz], [sx, wy - 1, sz], 2.3, 2.0)), 'lacquer', { mirror: true });
  for (const y of [wy + 0.8, ey - 2.4]) b.paint('forearm.L', cylinder([sx, y - 0.6, sz], [sx, y + 0.6, sz], 3.6), 'gold', { mirror: true, where: b.isMat('lacquer') });
  b.add('forearm.L', spike([sx + 2.2, ey - 1, sz - 1.4], [0.4, 0.3, -1], 3.6, 1.1, 0.8, { tip: 0.3 }), 'lacquer', { mirror: true, thr: 0.2 });
  // the ō-sode: four lames hanging from the shoulder, each laced in crimson along its top, the top one capped in gold
  for (let i = 0; i < 4; i++) {
    const y = sy - 1.4 - i * 3.3;
    const out = 3.5 + i * 0.45;
    b.add('upperarm.L', box([sx + out, y, sz], [0.85, 1.6, 4.9 + i * 0.3], { rot: [0, 0, 14 + i * 2], round: 0.4 }), 'lacquer', { mirror: true });
    b.paint('upperarm.L', box([sx + out + 0.2, y + 1.0, sz], [1.4, 0.55, 5.6 + i * 0.3], { rot: [0, 0, 14 + i * 2] }), 'lace', { mirror: true, where: b.isMat('lacquer') });
  }
  b.add('upperarm.L', box([sx + 3.2, sy + 0.8, sz], [1.3, 0.8, 5.2], { rot: [0, 0, 14], round: 0.4 }), 'gold', { mirror: true });
  b.paint('upperarm.L', box([sx + 4.6, sy - 6.5, sz], [0.6, 7.5, 6], { rot: [0, 0, 18] }), 'gold', { mirror: true, where: b.isMat('lacquer'), shade: 2 });
}

/**
 * The breastplate (a gold demon face on its front, gold at its rims), the skirt plates over the hips, the long cape
 * (black outside, crimson inside) and its tall collar of black flame spikes.
 */
function armour(b: ModelBuilder, L: Landmarks, kosode: Sdf): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy] = s.shoulder;
  const dou = intersect(subtract(offset(kosode, 1.7), offset(kosode, 0.5)), aabb([-40, s.waistY - 4, -40], [40, s.chestY + 5.5, 40]));
  addBands(b, dou, 'lacquer', [['spine', s.waistY - 4, s.waistY + 5], ['chest', s.waistY + 5, s.chestY + 6]], { thr: 0.1 });
  b.paint(['chest', 'spine'], aabb([-40, s.chestY + 4, -40], [40, s.chestY + 6, 40]), 'gold', { where: b.isMat('lacquer') });
  b.paint('spine', aabb([-40, s.waistY - 4, -40], [40, s.waistY - 2.6, 40]), 'gold', { where: b.isMat('lacquer') });
  // horizontal lames across the plate
  for (const y of [s.waistY + 1, s.waistY + 4.5]) b.paint(['chest', 'spine'], aabb([-40, y - 0.4, -40], [40, y + 0.4, 40]), 'lacquer', { shade: 3, where: b.isMat('lacquer') });
  badge(b, [
    'X . . . . . . . . . X',
    'X X . . . . . . . X X',
    '. X X X X X X X X X .',
    '. X X o o X o o X X .',
    '. X X X X X X X X X .',
    '. . X . X X X . X . .',
    '. . . X . . . X . . .',
  ], 0, Math.round(s.chestY + 1), 'gold', { shade: 1 });
  // the skirt plates (kusazuri): four hanging round the hips, laced in crimson
  for (const [ax, az, ry] of [[3.6, 4.8, 18], [-3.6, 4.8, -18], [7.6, 0.4, 90], [-7.6, 0.4, -90]] as [number, number, number][]) {
    for (let i = 0; i < 3; i++) {
      const y = s.waistY - 6 - i * 2.8;
      const k = 1.32 + i * 0.1;
      b.add('hips', box([ax * k, y, az * k], [3.4, 1.4, 0.7], { rot: [6, ry, 0], round: 0.3 }), 'lacquer');
      b.paint('hips', box([ax * k, y + 1, az * k], [3.8, 0.45, 1.4], { rot: [6, ry, 0] }), 'lace', { where: b.isMat('lacquer') });
      // each lame hangs from the one above on crimson cords, the top one from the waist
      b.add('hips', capsule([ax * (k - (i === 0 ? 0.42 : 0.1)), y + (i === 0 ? 3.2 : 2.8), az * (k - (i === 0 ? 0.42 : 0.1))], [ax * k, y + 0.6, az * k], 0.75), 'lace');
    }
  }
  // the cape drapes over a cheap stand-in for the torso (the kosode's own field is many times slower to sample)
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const drapeOver = blend(3, box([0, s.chestY - 0.5, -0.3], [cx + 1.1, 6.2, cz + 1.1], { round: 3 }), box([0, s.waistY, -0.2], [wx + 1.1, 4.4, wz + 1.1], { round: 2.8 }));
  const cape = longCape(b, L, drapeOver, { mat: 'cape', lining: 'capeIn', res: DADOU_RES, yHem: 3, r0: 11, r1: 15 });
  // the collar of black flame: spikes rising round the back of the neck, the tallest behind the head
  const nz = L.headC[2] - 2.2;
  for (let i = -4; i <= 4; i++) {
    const a = (i / 4) * 1.75;
    const base: V3 = [Math.sin(a) * 6.2, sy + 1.5, nz - Math.cos(a) * 3.6];
    const h = 10 - Math.abs(i) * 1.3;
    const dir: V3 = [Math.sin(a) * 0.55, 1, -Math.cos(a) * 0.5];
    b.add('chest', spike(base, dir, h, 1.7, 1.2, { tip: 0.55 }), 'cape', { thr: 0.25 });
    const n = Math.hypot(...dir);
    const tip: V3 = [base[0] + (dir[0] / n) * h, base[1] + (dir[1] / n) * h, base[2] + (dir[2] / n) * h];
    b.paint('chest', sphere(tip, 2.4), 'hornTip', { where: b.isMat('cape') });
  }
  void sx;
  return cape;
}

// ---------------------------------------------------------------------------------------------- the demon king

/** the second pair of arms: obsidian, from behind the shoulders, with hands of their own */
function arms2(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [x2, y2, z2] = SHOULDER2;
  const ey = y2 - s.upperArm, wy = ey - s.foreArm;
  b.boneSym('upperarm2.L', 'chest', SHOULDER2);
  b.boneSym('forearm2.L', 'upperarm2.L', [x2, ey, z2]);
  b.boneSym('hand2.L', 'forearm2.L', [x2, wy, z2]);
  b.boneSym('fist2.L', 'hand2.L', [x2, wy, z2]);
  b.boneSym('palm2.L', 'hand2.L', [x2, wy, z2]);
  b.socket('grip2.R', 'fist2.R', [-x2 + 0.1, wy - 4.3, z2 + 0.4]);
  b.socket('grip2.L', 'fist2.L', [x2 - 0.1, wy - 4.3, z2 + 0.4]);
  b.add('chest', ellipsoid([x2 - 0.8, y2, z2 + 0.6], [2.8, 3.2, 3.0]), 'obsidian', { mirror: true });
  b.add('upperarm2.L', blend(1.3, sphere([x2, y2 - 0.5, z2], 3.0), capsule([x2, y2 - 1, z2], [x2, ey + 0.5, z2], 2.8, 2.4)), 'obsidian', { mirror: true });
  b.add('forearm2.L', blend(1.1, sphere([x2, ey, z2], 2.5), capsule([x2, ey - 0.5, z2], [x2, wy + 1, z2], 2.5, 2.0)), 'obsidian', { mirror: true });
  b.add('forearm2.L', spike([x2 + 1.8, ey - 0.6, z2 - 1.2], [0.4, 0.4, -1], 3.8, 1.1, 0.7, { tip: 0.3 }), 'horn', { mirror: true, thr: 0.2 });
  const gy = wy - 4.3;
  b.add('fist2.L', subtract(box([x2 - 0.1, gy, z2 + 0.4], [2.2, 3.1, 2.9], { round: 1.1 }), cylinder([x2 - 0.1, gy, z2 - 6], [x2 - 0.1, gy, z2 + 6], 1.2)), 'obsidian', { mirror: true });
  b.add('fist2.L', capsule([x2, wy + 0.5, z2], [x2, wy - 1.5, z2], 1.9), 'obsidian', { mirror: true });
  b.add('palm2.L', blend(1.2, box([x2, wy - 3, z2 + 0.3], [1.5, 3, 2.4], { round: 1 }), capsule([x2, wy + 0.5, z2], [x2, wy - 1.5, z2], 1.9)), 'obsidian', { mirror: true });
  for (const dz of [-1.4, 0.6, 2.4]) b.add('palm2.L', spike([x2 - 0.2, wy - 5, z2 + dz], [0, -1, 0.1], 3.2, 0.8, 0.6, { tip: 0.3 }), 'horn', { mirror: true, thr: 0.2 });
  // burning cracks down the arms
  for (const bone of ['upperarm2.L', 'forearm2.L']) b.paint(bone, crackField(1.0, [x2 - 5, wy - 2, z2 - 5], [x2 + 5, y2 + 4, z2 + 5]), 'crack', { mirror: true, where: b.isMat('obsidian') });
}

/** a network of thin cracks (where the field is negative), denser for larger k */
function crackField(k: number, min: V3, max: V3): Sdf {
  return fn((x, y, z) => {
    const a = Math.sin(x * 0.9 * k + y * 0.33 + Math.sin(z * 0.7) * 1.4);
    const c = Math.sin(y * 0.52 * k - z * 0.8 + Math.sin(x * 0.6) * 1.2);
    return Math.min(Math.abs(a), Math.abs(c)) - 0.11;
  }, min, max);
}

// ---------------------------------------------------------------------------------------------- hair, horns, crown

/**
 * The cap every look shares: a shell over the skull from the hairline back, cut short at the sides — open round each ear
 * — and down to the nape behind. It fills only empty voxels (the face and the ears keep their skin) and turns to hair any
 * skin still showing behind the ears and above them, so the back of the head is covered all round.
 */
function hairCap(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }, grow = 0): void {
  const s = L.spec;
  const c = hd.chin, front = hd.front, hw = s.head.w / 2;
  const hc: V3 = [L.headC[0], L.headC[1] + 1.1, L.headC[2] - 0.4];
  const capR: V3 = [hw + 0.6 + grow, s.head.h / 2 + 0.8 + grow, s.head.d / 2 + 0.9 + grow];
  const ears = [1, -1].map((k) => aabb(k > 0 ? [hw - 0.5, c + 3.5, -2.6] : [-hw - 2.5, c + 3.5, -2.6], k > 0 ? [hw + 2.5, c + 7.5, 0.6] : [-hw + 0.5, c + 7.5, 0.6]));
  const cap = subtract(intersect(ellipsoid(hc, capR), halfSpace([0, c + 10, front], [0, -1, 0.82]), halfSpace([0, c + 1.6, 0], [0, -1, 0])), ...ears);
  b.add('head', cap, 'hair', { only: 'empty' });
  const skin = b.isMat('skin');
  b.paint('head', aabb([-9, c + 2, -10], [9, c + 17, -2.6]), 'hair', { where: skin });
  b.paint('head', aabb([-9, c + 7.5, -3], [9, c + 17, front - 3]), 'hair', { where: skin });
  // a trimmed sideburn in front of each ear
  for (const k of [-1, 1]) b.paint('head', box([k * 5.0, c + 7.2, 0.8], [0.7, 1.2, 0.9]), 'hair', { where: skin });
}

/**
 * Thick, wavy, near-black hair, kept short: the cap, and on top a low mass lifted off the forehead in a wave and swept
 * back and to his left, with combed waves across it.
 */
function dadouHair(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const c = hd.chin, front = hd.front;
  hairCap(b, L, hd);
  // the volume on top: lifted off the forehead, swept back and toward his left
  b.add('head', blend(2.0,
    ellipsoid([0.4, c + 12.4, front - 2.8], [5.2, 2.1, 2.6], [-26, 0, 6]),
    ellipsoid([0.8, c + 12.7, front - 5.8], [5.6, 2.1, 3.3]),
    ellipsoid([0.6, c + 12.1, front - 8.9], [5.4, 1.9, 2.8])), 'hair');
  // the front wave: a low curl over the forehead rolling toward his left
  b.add('head', ellipsoid([2.0, c + 13.6, front - 2.6], [2.8, 1.1, 1.9], [-18, 0, 18]), 'hair');
  b.add('head', ellipsoid([-2.4, c + 13.2, front - 2.3], [2.2, 1.0, 1.6], [-24, 0, -8]), 'hair');
  // waves combed across the mass, right to left
  for (let i = 0; i < 4; i++) {
    const z0 = front - 1.8 - i * 2.4;
    const wave = smoothPath([[-5, c + 12.6 - i * 0.2, z0], [-2, c + 14.0 - i * 0.3, z0 - 0.6], [1, c + 14.2 - i * 0.4, z0 + 0.2], [4.5, c + 13.2 - i * 0.4, z0 - 0.4]], 3);
    b.paint('head', tube(wave, wave.map(() => 0.42)), 'hair', { shade: 4, where: b.isMat('hair') });
  }
  b.carve('head', aabb([-5.2, c + 1, front], [5.2, c + 9.6, front + 6]));
  return { springs: [], colliders: [] };
}

/** horns: two short ones through the hair (Shikai), long and swept back (Bankai), great and curving (final) */
function horns(b: ModelBuilder, hd: { front: number; chin: number }, kind: 'short' | 'long' | 'great'): void {
  const c = hd.chin, front = hd.front;
  for (const k of [-1, 1]) {
    if (kind === 'great') {
      // a Hollow's horns, like Ichigo's: out of the hair at the temples and straight forward past his face, a little
      // apart, the points turning up and in; the last third smoulders and the points burn
      const pts: V3[] = smoothPath([[k * 3.8, c + 11.4, front - 4.2], [k * 5.6, c + 11.9, front - 2.4], [k * 6.6, c + 12.1, front + 1.0], [k * 6.6, c + 12.3, front + 5.0], [k * 5.9, c + 12.9, front + 8.6], [k * 5.0, c + 13.8, front + 11.2]], 4);
      const n = pts.length - 1;
      const rad = pts.map((_, i) => 0.42 + 1.9 * Math.pow(1 - i / n, 1.2));
      b.add('head', tube(pts, rad), 'horn', { thr: 0.2 });
      pts.forEach((q, i) => {
        if (i > n * 0.68) b.paint('head', sphere(q, rad[i] + 0.55), 'hornEmber', { where: b.isMat('horn') });
      });
      pts.forEach((q, i) => {
        if (i > n * 0.88) b.paint('head', sphere(q, rad[i] + 0.55), 'hornTip', { where: b.isMat('horn', 'hornEmber') });
      });
    } else if (kind === 'long') {
      const base: V3 = [k * 4.0, c + 11.2, front - 3.4];
      b.add('head', spike(base, [k * 0.35, 0.75, -0.75], 13, 1.7, 1.3, { tip: 0.55, bend: [0, -0.2, -0.3] }), 'horn', { thr: 0.25 });
      b.paint('head', sphere([k * 7.4, c + 19.6, front - 13.2], 3.0), 'hornTip', { where: b.isMat('horn') });
    } else {
      const base: V3 = [k * 3.0, c + 12.4, front - 2.4];
      const dir: V3 = [k * 0.3, 1, -0.35];
      const n = Math.hypot(...dir), len = 8.6;
      b.add('head', spike(base, dir, len, 1.6, 1.3, { tip: 0.55 }), 'horn', { thr: 0.25 });
      b.paint('head', sphere([base[0] + (dir[0] / n) * len, base[1] + (dir[1] / n) * len, base[2] + (dir[2] / n) * len], 2.4), 'hornTip', { where: b.isMat('horn') });
    }
  }
}

/** the Bankai's crown: a band of black iron over the hair, gold at its rims, seven spikes, a ruby over the brow */
function crown(b: ModelBuilder, hd: { front: number; chin: number }): void {
  const c = hd.chin, front = hd.front;
  const zc = -0.5;
  const yb = c + 12.2;
  b.add('head', subtract(cylinder([0, yb - 1.2, zc], [0, yb + 1.4, zc], 7.1, 7.4), cylinder([0, yb - 3, zc], [0, yb + 3, zc], 5.9)), 'lacquer', { thr: 0.1 });
  b.paint('head', subtract(cylinder([0, yb - 1.3, zc], [0, yb - 0.5, zc], 7.8), cylinder([0, yb - 3, zc], [0, yb + 3, zc], 5.7)), 'gold', { where: b.isMat('lacquer') });
  b.paint('head', subtract(cylinder([0, yb + 0.7, zc], [0, yb + 1.5, zc], 7.8), cylinder([0, yb - 3, zc], [0, yb + 3, zc], 5.7)), 'gold', { where: b.isMat('lacquer') });
  for (let i = -3; i <= 3; i++) {
    const a = i * 0.52;
    const base: V3 = [Math.sin(a) * 6.9, yb + 1, zc + Math.cos(a) * 6.9];
    const h = 8.5 - Math.abs(i) * 1.3;
    b.add('head', spike(base, [Math.sin(a) * 0.15, 1, Math.cos(a) * 0.15], h, 1.4, 1.1, { tip: 0.5 }), 'lacquer', { thr: 0.25 });
    b.paint('head', sphere([base[0] + Math.sin(a) * 0.15 * h, base[1] + h, base[2] + Math.cos(a) * 0.15 * h], 1.3), 'gold', { where: b.isMat('lacquer') });
  }
  b.add('head', ellipsoid([0, yb + 0.2, zc + 7.3], [1.1, 1.3, 0.7]), 'ruby');
  void front;
}

// ---------------------------------------------------------------------------------------------- props

/** the hilt every blade shares: a crimson wrap in diamonds over black ray skin, gold collar and pommel */
function hilt(b: ModelBuilder, long = false): void {
  b.mat('wrap', ['#C02A40', '#A02236', '#801B2C', '#601421'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#2E2A30', '#221F24']);
  const hl = long ? 11.6 : 7.6;
  b.add('root', box([0, 0, -hl / 2], [1.1, 1.25, hl / 2], { round: 0.5 }), 'wrap');
  b.paint('root', fn((_x, y, z) => Math.abs(((Math.abs(y) + z) % 2.6 + 2.6) % 2.6 - 1.3) - 0.42, [-2, -2, -hl - 1], [2, 2, 1]), 'ray', { where: b.isMat('wrap') });
  b.add('root', box([0, 0, -hl - 0.2], [1.25, 1.4, 0.6], { round: 0.35 }), 'gold');
  b.add('root', box([0, -0.05, 0.6], [0.9, 1.25, 0.5]), 'gold');
}

/**
 * Hajun. The katana (sealed): steel with a pale edge, a gold guard cast as a demon's face. The Shikai: black, a crimson
 * edge, violet fire in the groove, the guard's eyes burning. The Bankai: a great nodachi of black obsidian, a molten
 * crimson edge, a violet groove. The final blade: black fire with crimson edges and violet tongues along its back.
 * Origin at the grip, +Z along the blade, the edge toward −Y.
 */
function buildBlade(kind: 'katana' | 'shikai' | 'bankai' | 'final'): VoxelModel {
  const b = new ModelBuilder(`hajun-${kind}`, 48);
  b.mat('gold', ['#F3DA8C', '#E2BE5E', '#C49C3E', '#9C772A', '#76581E'], { base: 1, rough: 0.25, metal: 0.9, shadeK: 0.8 });
  b.mat('eye', ['#FF3048'], { glow: kind === 'katana' ? 0.3 : 1.6 });
  if (kind === 'katana') {
    b.mat('steel', ['#E9ECF0', '#D5D9DE', '#B2B8BF', '#9097A0'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
    b.mat('edge', ['#F3F3F0'], { rough: 0.12, metal: 0.8 });
    b.mat('groove', ['#A8AEB6']);
  } else if (kind === 'final') {
    b.mat('steel', ['#2C2430', '#221B26', '#1A1420', '#151018'], { base: 1, rough: 0.3, metal: 0.4, glow: 0.15 });
    b.mat('edge', ['#FF3B52'], { glow: 2.4 });
    b.mat('groove', ['#C256FF'], { glow: 2.0 });
  } else {
    b.mat('steel', ['#3C3640', '#2C2731', '#221E26', '#18151B'], { base: 1, rough: kind === 'bankai' ? 0.12 : 0.25, metal: 0.6, shadeK: 0.7 });
    b.mat('edge', ['#FF4A3C'], { glow: kind === 'bankai' ? 2.0 : 1.4 });
    b.mat('groove', ['#B648FF'], { glow: 1.6 });
  }
  b.bone('root', null, [0, 0, 0]);
  const z0 = 5;
  const zTip = kind === 'katana' ? 41 : kind === 'shikai' ? 44 : kind === 'bankai' ? 74 : 52;
  const wide = kind === 'bankai' ? 1.7 : kind === 'final' ? 1.5 : 1.0;
  const zEnd = zTip - (kind === 'bankai' ? 5 : 3);
  const curve = (z: number) => Math.max(0, z - z0) ** 2 * (kind === 'bankai' ? 0.0004 : 0.001);
  b.add('root', fn((x, y, z) => {
    if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
    const cv = curve(z);
    return Math.max(Math.abs(x) - (kind === 'bankai' ? 0.7 : 0.5), y - (wide - 0.1 + cv), -wide - 0.1 + cv + Math.max(0, z - zEnd) * (kind === 'bankai' ? 0.42 : 0.66) - y, z0 - z, z - zTip);
  }, [-2, -4, z0 - 1], [2, 5, zTip + 1]), 'steel', { thr: 0.3 });
  b.paint('root', fn((_x, y, z) => y - (-wide + 0.38 + curve(z) + Math.max(0, z - zEnd) * (kind === 'bankai' ? 0.42 : 0.66)), [-2, -4, 0], [2, 5, zTip + 1]), 'edge');
  // the groove (bo-hi) down the flat, filled with fire from the Shikai on
  b.paint('root', fn((_x, y, z) => Math.max(Math.abs(y - (wide * 0.35 + curve(z))) - 0.35, z0 + 2 - z, z - (zEnd - 3)), [-2, -4, z0], [2, 5, zTip]), 'groove', { where: b.isMat('steel') });
  if (kind === 'final') {
    // tongues of black fire licking up off the back of the blade
    for (let i = 0; i < 7; i++) {
      const z = z0 + 6 + i * 6;
      b.add('root', spike([0, wide + curve(z) - 0.2, z], [0, 1, 0.6], 3 + (i % 3), 0.7, 0.5, { tip: 0.2 }), 'steel', { thr: 0.2 });
      b.paint('root', sphere([0, wide + curve(z) + 2.4 + (i % 3) * 0.8, z + 1.8], 1.2), 'groove', { where: b.isMat('steel') });
    }
  }
  // the guard: a gold disc cast as a demon's face — horns, brow, two eyes (burning from the Shikai on), fangs
  const gz = 3.8;
  b.add('root', cylinder([0, 0, gz - 0.55], [0, 0, gz + 0.55], kind === 'bankai' ? 4.4 : 3.6), 'gold');
  for (const k of [-1, 1]) {
    b.add('root', spike([k * 2.2, 2.4, gz], [k * 0.7, 1, 0], 2.6, 0.7, 0.5, { tip: 0.3 }), 'gold', { thr: 0.2 });
    b.add('root', aabb([k * 1.6 - 0.5, 0.4, gz + 0.4], [k * 1.6 + 0.5, 1.4, gz + 1.2]), 'eye');
    b.add('root', spike([k * 0.9, -1.8, gz + 0.5], [0, -1, 0], 1.4, 0.4, 0.4, { tip: 0.3 }), 'gold', { thr: 0.2 });
  }
  b.add('root', cylinder([0, 0, gz - 0.8], [0, 0, gz + 1.1], 1.5), 'gold');
  hilt(b, kind === 'bankai');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** The sheath: black lacquer, gold at the mouth and the tip, a crimson cord wound below the mouth. */
function buildSaya(): VoxelModel {
  const b = new ModelBuilder('hajun-saya', 48);
  b.mat('lacquer', ['#3A3238', '#2C252B', '#211C21', '#181418'], { base: 1, rough: 0.25, shadeK: 0.8 });
  b.mat('gold', ['#F3DA8C', '#E2BE5E', '#C49C3E', '#9C772A'], { base: 1, rough: 0.25, metal: 0.9 });
  b.mat('cord', ['#C02A40', '#A02236', '#801B2C']);
  b.bone('root', null, [0, 0, 0]);
  const Ls = 38;
  b.add('root', box([0, 0, -Ls / 2], [0.95, 1.5, Ls / 2], { round: 0.6 }), 'lacquer');
  b.add('root', box([0, 0, -0.5], [1.15, 1.7, 0.6], { round: 0.3 }), 'gold');
  b.add('root', box([0, 0, -Ls + 0.6], [1.1, 1.65, 0.7], { round: 0.5 }), 'gold');
  for (let i = 0; i < 3; i++) b.add('root', box([0, 0, -3.2 - i * 1.6], [1.2, 1.75, 0.45], { round: 0.3 }), 'cord');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** a ring of flame tongues facing +Z (the XY plane) — the halo and the wheel share it */
function flameRing(b: ModelBuilder, r: number, n: number, h: number, mats: [string, string, string]): void {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const big = i % 2 === 0 ? 1 : 0.7;
    const base: V3 = [Math.cos(a) * r, Math.sin(a) * r, 0];
    const dir: V3 = [Math.cos(a + 0.35), Math.sin(a + 0.35), 0];
    b.add('root', spike(base, dir, h * big, 2.4 * big, 0.9, { tip: 0.2, bend: [-Math.sin(a) * 0.3, Math.cos(a) * 0.3, 0] }), mats[0], { thr: 0.25 });
    b.paint('root', sphere([base[0] + dir[0] * h * big * 0.55, base[1] + dir[1] * h * big * 0.55, 0], h * big * 0.32), mats[1], { where: b.isMat(mats[0]) });
    b.paint('root', sphere([base[0] + dir[0] * h * big * 0.95, base[1] + dir[1] * h * big * 0.95, 0], h * big * 0.22), mats[2], { where: b.isMat(mats[0]) });
  }
}

/** The Bankai's karura-en: a halo of fire (half density) — a burning ring, dense tongues crimson at the root and violet
 *  at the points, all leaning one way as if it turned, round a thin black core. */
function buildHalo(): VoxelModel {
  const b = new ModelBuilder('hajun-halo', 24);
  b.mat('iron', ['#3A343C', '#2A252C', '#1E1B21', '#161418'], { base: 1, rough: 0.4, metal: 0.4 });
  b.mat('fireD', ['#B0182E'], { glow: 1.2 });
  b.mat('fireR', ['#FF4438'], { glow: 2.0 });
  b.mat('fireV', ['#B444FF'], { glow: 2.2 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', torus([0, 0, 0], 11, 1.6, [90, 0, 0]), 'fireD');
  b.add('root', torus([0, 0, -0.4], 11, 0.8, [90, 0, 0]), 'iron');
  flameRing(b, 11.6, 28, 7.5, ['fireD', 'fireR', 'fireV']);
  b.lint();
  return b.build();
}

/**
 * The final form's wheel of fire (half density): a black rim with six burning spokes to a hub marked with the demon's
 * face, flame tongues all round the rim.
 */
function buildWheel(): VoxelModel {
  const b = new ModelBuilder('hajun-wheel', 24);
  b.mat('iron', ['#3A343C', '#2A252C', '#1E1B21', '#161418'], { base: 1, rough: 0.4, metal: 0.4 });
  b.mat('gold', ['#F3DA8C', '#E2BE5E', '#C49C3E', '#9C772A'], { base: 1, rough: 0.25, metal: 0.9 });
  b.mat('fireR', ['#FF4438'], { glow: 2.2 });
  b.mat('fireV', ['#B444FF'], { glow: 2.4 });
  b.bone('root', null, [0, 0, 0]);
  const R = 15;
  b.add('root', torus([0, 0, 0], R, 1.3, [90, 0, 0]), 'iron');
  b.paint('root', torus([0, 0, 0], R, 1.6, [90, 0, 0]), 'gold', { where: b.isMat('iron'), shade: 1 });
  b.paint('root', torus([0, 0, 0.6], R, 0.9, [90, 0, 0]), 'fireR', { where: b.isMat('gold') });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 2;
    b.add('root', capsule([Math.cos(a) * 3.2, Math.sin(a) * 3.2, 0], [Math.cos(a) * (R - 1), Math.sin(a) * (R - 1), 0], 1.0, 0.75), 'fireV');
  }
  b.add('root', cylinder([0, 0, -0.8], [0, 0, 0.8], 3.8), 'iron');
  b.paint('root', cylinder([0, 0, 0.2], [0, 0, 1], 2.8), 'gold', { where: b.isMat('iron') });
  b.add('root', aabb([-2, 0, 0.6], [-1, 1, 1.4]), 'fireR');
  b.add('root', aabb([1, 0, 0.6], [2, 1, 1.4]), 'fireR');
  flameRing(b, R, 16, 6, ['iron', 'fireR', 'fireV']);
  b.lint();
  return b.build();
}
