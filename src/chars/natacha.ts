// Natacha — the Star Reader of the Royal Guard (docs/kits/natacha.md). An original character, a tribute: her face
// and hair come from photos of the person she honours. Brief: 165 cm → 79 vox (47.9 vox/m), slim; the head ≈ 1/6.6
// of her height. Must-haves from the photos: copper-auburn hair (a low twisted bun at the nape, or worn down long
// and wavy), a fair warm complexion with freckles across the nose, the cheeks and the forehead, dark brown eyes,
// thin arched auburn brows, a wide warm smile with teeth, a thin gold necklace with a tiny three-stone pendant.
// Silhouette keys: the copper bun (or the long copper waves), the long-sleeved white haori with a night-sky hem and
// an eight-pointed star in a rhombus on the back, the katana with a star-shaped guard at her left hip.
// Looks: 'sealed' — black shihakushō, the white haori, a navy obi with a gold cord, the bun with a gold star pin,
// the necklace's stones dark; 'shikai' — the same, the freckles glinting gold (her freckles are stars), the first
// stone lit; 'bankai' — the hair down in long waves, the haori turned to a midnight mantle sown with stars (burgundy
// lining), two stones lit; 'final' (Myōjō Kōrin) — the hair turned to copper-gold light, the robe white and gold,
// golden eyes, all three stones lit (the eight-pointed halo is a prop on 'back').
// Props: the sealed Myōjō (a katana: a gold eight-pointed star guard, a wine-red wrap) and its navy sheath sown with
// gold flecks; the Shikai (straight, pale gold steel, a glowing fuller, a larger star guard in a ring); the Bankai (a
// long blade cut out of the night sky: midnight steel full of stars, a glowing gold edge); the final blade (light);
// the halo.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, prism, smoothPath, sphere, subtract, torus, tube, type Sdf, type V3 } from '../models/sdf';
import { coatSkirt, faceLegend, feet, hakama, hands, head, humanoidSkeleton, kosodeSleeves, kosodeTorso, shihakushoSprings, spikeHair, type HumanoidSpec, type Landmarks } from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';
import { hash3 } from '../core/math';

/** 79 voxels = 1.65 m */
export const NATACHA_RES = 79 / 1.65;
export type NatachaForm = 'sealed' | 'shikai' | 'bankai' | 'final';

/** Slim: narrow shoulders, a small waist, long legs under the hakama. */
const SPEC: HumanoidSpec = {
  H: 79,
  chinY: 67,
  head: { w: 10, d: 11, h: 12 },
  neckR: 2.1,
  shoulder: [7.6, 61.6, -0.5],
  upperArm: 12.8,
  foreArm: 11.5,
  hand: 7.9,
  armR: 1.9,
  hipsY: 40.6,
  hip: [4.15, 37.9, 0],
  kneeY: 21.4,
  ankleY: 4.2,
  chest: [6.4, 4.3],
  waist: [5.0, 3.6],
  hips: [6.5, 4.5],
  chestY: 55.2,
  waistY: 47.4,
  foot: { len: 10.3, w: 4.2, heel: 2.5 },
};

const released = (form: NatachaForm) => form !== 'sealed';
const loose = (form: NatachaForm) => form === 'bankai' || form === 'final';
/** how many of the necklace's three stones are lit */
const litStones = (form: NatachaForm) => (form === 'sealed' ? 0 : form === 'shikai' ? 1 : form === 'bankai' ? 2 : 3);

function palette(b: ModelBuilder, form: NatachaForm): void {
  b.mat('skin', ['#F5DAC6', '#EDCBB3', '#E0B89F', '#CEA088', '#B28470'], { base: 1, rough: 0.6, shadeK: 0.9 });
  if (form === 'final') b.mat('hair', ['#FFB57C', '#F4975A', '#E27C42', '#C8622F', '#A34A23'], { base: 2, rough: 0.4, glow: 0.32, shadeK: 0.85, dither: 0.03 });
  else b.mat('hair', ['#DE8C55', '#CA7142', '#B15B32', '#8F4626', '#6C331B'], { base: 2, rough: 0.45, shadeK: 0.85, dither: 0.03 });
  b.mat('brow', ['#9C5532']);
  b.mat('lid', ['#4E2C20']);
  b.mat('sclera', ['#F3F1EC']);
  if (form === 'final') {
    b.mat('iris', ['#FFC94A'], { glow: 0.5 });
    b.mat('irisD', ['#B87A24'], { glow: 0.3 });
  } else {
    b.mat('iris', ['#6A4028']);
    b.mat('irisD', ['#2E1B13']);
  }
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#C27670']);
  b.mat('teeth', ['#EDE9E1']);
  // the freckles: cinnamon on the skin; released, they glint like gold dust (her freckles are stars)
  if (released(form)) b.mat('freckle', ['#F4C27C'], { glow: 0.7 });
  else b.mat('freckle', ['#C88A66']);
  b.mat('black', ['#383A40', '#26272D', '#1C1D22', '#141418'], { base: 1, rough: 0.85, shadeK: 0.9 });
  b.mat('collar', ['#F1F0EC', '#E0DED9', '#C8C6C1'], { base: 0, rough: 0.8 });
  b.mat('obi', ['#34446F', '#28375E', '#1F2B4C', '#18213C'], { base: 1, rough: 0.8 });
  b.mat('gold', ['#F4D88A', '#E3BC5E', '#C99B40', '#A27A2C'], { base: 1, rough: 0.35, metal: 0.85, shadeK: 0.8 });
  b.mat('goldGlow', ['#FFE7A6'], { glow: 1.6, rough: 0.3, metal: 0.6 });
  if (form === 'bankai') {
    b.mat('haori', ['#2E3A6C', '#232D58', '#1B2447', '#161C38', '#141418'], { base: 1, rough: 0.75, shadeK: 0.9 });
    b.mat('haoriIn', ['#86304A', '#6A253B', '#521C2D', '#3E1522'], { base: 1, rough: 0.8 });
  } else if (form === 'final') {
    b.mat('haori', ['#F3EFE2', '#ECE3CA', '#DDCFAC', '#C8B78D', '#A99567'], { base: 1, rough: 0.7, shadeK: 0.9 });
    b.mat('haoriIn', ['#F2DFA6', '#E2C67E', '#C9A65A', '#A8853E'], { base: 1, rough: 0.6, metal: 0.3 });
  } else {
    b.mat('haori', ['#F3F2EE', '#EAE9E4', '#DAD9D4', '#C2C3C7', '#A4A7AE'], { base: 1, rough: 0.8, shadeK: 0.9 });
    b.mat('haoriIn', ['#3C4C7C', '#2E3D68', '#243157', '#1C2747'], { base: 1, rough: 0.85 });
  }
  // the night-sky hem of the white haori (on the mantle and the robe it is the trim)
  b.mat('hem', ['#2E3E70', '#24325E', '#1C284D', '#161F3D'], { base: 1, rough: 0.8 });
  b.mat('star', ['#FFF1C4'], { glow: form === 'sealed' ? 0 : 2.4 });
  b.mat('starBlue', ['#C6D8FF'], { glow: 2.2 });
  b.mat('stone', ['#AEBBE6', '#8E9CCB']);
  b.mat('stoneLit', ['#FFF2C0'], { glow: 3.2 });
  b.mat('tabi', ['#F3F2EE', '#DEDDDA', '#C2C1BD'], { base: 0, rough: 0.8 });
  b.mat('sole', ['#C9B9A0', '#B0A888', '#8C8268'], { base: 1, rough: 0.9 });
  b.mat('cord', ['#5B4632']);
}

/**
 * Rows chin+9 → chin (column 0 is her right), the adult female template: thin short brows, a soft brown lash line,
 * dark brown eyes (the catch-light in the same corner of both, the darkest brown at the bottom), freckles across the
 * bridge of the nose and the cheeks, a warm open smile: the upper teeth between the corners, the lower lip under them.
 */
const FACE = [
  '. . . . . . . . . .',
  '. . B B . . B B . .',
  '. L L L . . L L L .',
  '. W * I . . * I W .',
  '. W I I . . I I W .',
  'f . i i f . i i . f',
  '. f . f . s f . f .',
  '. . m T T T T m . .',
  '. . . m m m m . . .',
  '. . . . . . . . . .',
];

const assetCache = new Map<NatachaForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function natachaAsset(form: NatachaForm = 'sealed'): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildNatacha(form)));
  return a;
}

/** 'katana' (sealed Myōjō), 'saya' (its sheath), 'shikai', 'bankai', 'final' (the blade of light), 'halo' */
export type NatachaProp = 'katana' | 'saya' | 'shikai' | 'bankai' | 'final' | 'halo';

export function natachaProp(kind: NatachaProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'saya' ? buildSaya() : kind === 'halo' ? buildHalo() : buildBlade(kind);
    propCache.set(kind, m);
  }
  return m;
}

/** blade sample points (prop frame, m) */
export const KATANA_BASE_Z = 5 / 48;
export const KATANA_TIP_Z = 38 / 48;
export const SHIKAI_TIP_Z = 41 / 48;
export const BANKAI_TIP_Z = 52 / 48;
export const FINAL_TIP_Z = 47 / 48;

export function buildNatacha(form: NatachaForm = 'sealed'): CharacterAsset {
  const b = new ModelBuilder(`natacha-${form}`, NATACHA_RES);
  palette(b, form);
  const s = SPEC;
  const L = humanoidSkeleton(b, s, { sleeves: true, hakama: true });
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 3.8, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 3.8, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.5, wy - 4.4, wz + 0.9]);
  b.socket('palm.L', 'palm.L', [wx - 0.5, wy - 4.4, wz + 0.9]);
  b.socket('finger.R', 'palm.R', [-wx + 0.2, wy - s.hand - 0.4, wz + 0.9]);
  b.socket('finger.L', 'palm.L', [wx - 0.2, wy - s.hand - 0.4, wz + 0.9]);
  // Myōjō at the left hip, outside the haori, the hilt forward
  b.socket('hip.L', 'hips', [s.waist[0] + 3.4, s.waistY - 3.4, 2.4], [-20, 0, 6]);
  b.socket('back', 'chest', [0, s.chestY + 2, -8.5]);
  // the final form's halo hangs behind her head
  b.socket('halo', 'chest', [0, s.chinY + 5, -10]);
  b.socket('chest.front', 'chest', [0, s.chestY, 6.5]);
  b.socket('throat', 'chest', [0, s.chinY - 5, 2.6]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('mouth', 'head', [0, s.chinY + 1.5, hd.front + 0.5]);
  // a soft, rounded jaw
  for (const k of [-1, 1]) b.carve('head', box([k * 5.4, hd.chin + 1.2, hd.front - 2], [0.9, 2.2, 3], { rot: [0, 0, k * 18] }));
  const legend = { ...faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth', teeth: 'teeth' }), f: { mat: 'freckle' } };
  b.stamp('head', hd.x0, hd.chin + 9, FACE, legend, hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  // more freckles over the cheekbones, round the sides of the face (seen from three quarters)
  const hg = b.grid('head');
  for (const k of [-1, 1])
    for (const [dy, dz] of [[4, -2], [3, -3], [5, -3]] as [number, number][]) {
      const y = hd.chin + dy, z = hd.front - 1 + dz;
      for (let i = 0; i < 6; i++) {
        const x = k < 0 ? -8 + i : 7 - i;
        const v = hg.get(x, y, z);
        if (v === 0) continue;
        if (b.isMat('skin')(v)) b.voxel('head', x, y, z, 'freckle', 0);
        break;
      }
    }
  hands(b, L, 'skin', 1.1);
  feet(b, L, 'tabi', 'sole', 'cord');
  const o = { black: 'black', collar: 'collar', skin: 'skin', obi: 'obi', crossY: s.chestY - 1, hemR: 7.8, hakamaHem: 3 };
  kosodeTorso(b, L, o);
  // a slender bust under the kosode
  const [, cz] = s.chest;
  b.add('chest', blend(0.9, ellipsoid([2.4, s.chestY - 1.6, cz + 0.5], [2.3, 2.1, 1.5]), ellipsoid([-2.4, s.chestY - 1.6, cz + 0.5], [2.3, 2.1, 1.5])), 'black', { only: 'empty' });
  necklace(b, L, form);
  sash(b, L);
  hakama(b, L, o);
  // the haori's long sleeves are the outermost, the lining showing at the mouths
  kosodeSleeves(b, L, { ...o, black: 'haori', collar: 'haori', obi: 'haori', bag: 4.6 });
  const [sx, , sz] = s.shoulder;
  b.paint('forearm.L', cylinder([sx + 0.8, wy - 1.2, sz - 0.6], [sx + 0.8, wy + 2.4, sz - 0.6], 3.6), 'haoriIn', { mirror: true, where: b.isMat('haori') });
  const coat = haori(b, L, form);
  const hair = loose(form) ? looseHair(b, L, hd, form) : bunHair(b, L, hd);
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

// ---------------------------------------------------------------------------------------------- jewellery & sash

/** the frontmost filled voxel of a bone at (x, y), or null */
function frontZ(b: ModelBuilder, bone: string, x: number, y: number): number | null {
  const g = b.grid(bone);
  for (let z = 20; z > -20; z--) if (g.get(x, y, z) !== 0) return z;
  return null;
}

/**
 * The thin gold chain round the base of the neck, dipping into the kosode's V, and the tiny pendant: three stones in
 * a gold frame. One stone lights with each release (the three seals).
 */
function necklace(b: ModelBuilder, L: Landmarks, form: NatachaForm): void {
  const s = L.spec;
  const top = s.chinY - 3;
  // the chain: painted flush on the skin of the neckline, from either side of the neck down to the pendant's loop
  const chain: [number, number][] = [[-3, top + 1], [-3, top], [-2, top - 1], [-2, top - 2], [-1, top - 2], [0, top - 2], [1, top - 1], [1, top], [2, top + 1]];
  for (const [x, y] of chain) {
    const z = frontZ(b, 'chest', x, y);
    if (z !== null && b.isMat('skin')(b.grid('chest').get(x, y, z))) b.voxel('chest', x, y, z, 'gold', 0);
  }
  // the pendant: a gold bail and three small stones under it, one voxel wide
  const lit = litStones(form);
  for (let i = 0; i < 4; i++) {
    const y = top - 3 - i;
    const z = frontZ(b, 'chest', -1, y);
    if (z === null) continue;
    const k = i - 1;
    b.voxel('chest', -1, y, z, i === 0 ? 'gold' : k < lit ? 'stoneLit' : 'stone', 0);
  }
}

/** The navy obi: a band round the waist with a gold cord tied in a small bow at her left front. */
function sash(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const y = s.waistY - 2.4;
  const [wx, wz] = s.waist;
  const band = subtract(
    box([0, y, -0.2], [wx + 2.4, 2.6, wz + 2.4], { round: 2.4 }),
    box([0, y, -0.2], [wx + 1, 5, wz + 1], { round: 2 }),
  );
  b.add('spine', intersect(band, aabb([-30, y - 0.5, -30], [30, 50, 30])), 'obi');
  b.add('hips', intersect(band, aabb([-30, -10, -30], [30, y - 0.5, 30])), 'obi');
  // the gold cord round its middle
  b.paint(['spine', 'hips'], box([0, y - 0.2, -0.2], [wx + 3, 0.5, wz + 3], { round: 2.4 }), 'gold', { where: b.isMat('obi') });
  // the bow and two short tails
  const kx = 3.2, kz = wz + 2.6;
  b.add('hips', ellipsoid([kx, y - 0.2, kz], [1.4, 0.9, 0.8]), 'gold');
  b.add('hips', capsule([kx - 0.3, y - 0.8, kz + 0.2], [kx - 1.0, y - 4.6, kz + 0.9], 0.6, 0.5), 'gold', { thr: 0.25 });
  b.add('hips', capsule([kx + 0.4, y - 0.8, kz + 0.1], [kx + 1.4, y - 4.0, kz + 0.7], 0.6, 0.5), 'gold', { thr: 0.25 });
}

// ---------------------------------------------------------------------------------------------- the haori

/** an eight-pointed star (7 × 7), the crest in her rhombus */
const STAR8 = [
  '...X...',
  '.X.X.X.',
  '..XXX..',
  'XXXXXXX',
  '..XXX..',
  '.X.X.X.',
  '...X...',
];

/**
 * The long-sleeved haori: a shell over the kosode open down the front, the eight-pointed star in a rhombus on the
 * back. Sealed and Shikai: white with a navy lining and a night-sky hem (a navy band sown with gold stars under a gold
 * line). Bankai: a midnight mantle sown with glowing stars, a burgundy lining. Final: white and gold, the trim alight.
 */
function haori(b: ModelBuilder, L: Landmarks, form: NatachaForm): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const torso = blend(3.2,
    box([0, s.chestY - 0.5, -0.3], [cx + 1.1, 5.4, cz + 1.1], { round: 3 }),
    box([0, s.waistY, -0.2], [wx + 1.1, 4.2, wz + 1.1], { round: 2.8 }),
    capsule([2.3, sy + 1.4, sz - 0.8], [sx + 0.5, sy - 0.6, sz], 2.6, 2.9),
    capsule([-2.3, sy + 1.4, sz - 0.8], [-sx - 0.5, sy - 0.6, sz], 2.6, 2.9));
  const front = halfSpace([0, 0, 1], [0, 0, -1]);
  const open = intersect(prism([[-2.6, 100], [2.6, 100], [4.4, s.chestY], [8.2, 30], [-8.2, 30], [-4.4, s.chestY]], [0, 0, 0], [1, 0, 0], [0, 1, 0], 30), front);
  const shellSdf = subtract(offset(torso, 1.7), offset(torso, -0.1), open);
  for (const [bone, y0, y1] of [['spine', s.waistY - 3, s.waistY + 5.5], ['chest', s.waistY + 5.5, 100]] as [string, number, number][]) b.add(bone, intersect(shellSdf, aabb([-30, y0, -30], [30, y1, 30])), 'haori');
  b.paint(['chest', 'spine'], intersect(offset(open, 0.8), front), 'haoriIn', { where: b.isMat('haori') });
  // the crest: the eight-pointed star in a rhombus (symmetric, so it reads the same from behind)
  const W = 13, H = 13, mx = (W - 1) / 2, my = (H - 1) / 2;
  const rows: string[] = [];
  for (let r = 0; r < H; r++) {
    let row = '';
    for (let ci = 0; ci < W; ci++) {
      const e = Math.abs(ci - mx) / (mx + 0.5) + Math.abs(r - my) / (my + 0.5);
      const ring = e > 0.86 && e <= 1.02;
      const gr = r - 3, gc = ci - 3;
      const k = gr >= 0 && gr < 7 && gc >= 0 && gc < 7 && STAR8[gr][gc] === 'X';
      row += ring || k ? 'X' : '.';
    }
    rows.push(row);
  }
  const crest = form === 'sealed' || form === 'shikai' ? 'hem' : 'goldGlow';
  const top = Math.round(s.chestY + 7.8);
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
      if (best) b.voxel(best.bone, x, y, best.z, crest, 0);
    }
  });
  const yHem = 12;
  const coat = coatSkirt(b, L, { mat: 'haori', lining: 'haoriIn', yTop: s.waistY - 2, yHem, r0: 8.8, r1: 12.6, openFront: 40, overlap: 5, res: NATACHA_RES });
  const skirt = ['F.L', 'S.L', 'B.L', 'B.R', 'S.R', 'F.R'].flatMap((p) => [`coat.${p}`, `coat.${p}.2`]);
  const outer = (v: number) => b.isMat('haori')(v);
  if (form === 'bankai') {
    // the mantle sown with stars: a few gold, a few pale blue, scattered over the whole outside
    const all = ['chest', 'spine', 'upperarm.L', 'upperarm.R', 'forearm.L', 'forearm.R', 'sleeve.L', 'sleeve.R', ...skirt];
    b.paint(all, fn((x, y, z) => (hash3(Math.floor(x), Math.floor(y), Math.floor(z)) < 0.022 ? -1 : 1), [-30, 0, -30], [30, 90, 30]), 'star', { where: outer });
    b.paint(all, fn((x, y, z) => (hash3(Math.floor(x) + 71, Math.floor(y), Math.floor(z) - 13) < 0.012 ? -1 : 1), [-30, 0, -30], [30, 90, 30]), 'starBlue', { where: outer });
    // a gold trim at the hem
    b.paint(skirt, aabb([-30, yHem - 3, -30], [30, yHem + 1.5, 30]), 'goldGlow', { where: outer });
  } else if (form === 'final') {
    b.paint(skirt, aabb([-30, yHem - 3, -30], [30, yHem + 1.5, 30]), 'goldGlow', { where: outer });
    b.paint(skirt, aabb([-30, yHem + 3.5, -30], [30, yHem + 4.5, 30]), 'goldGlow', { where: outer });
  } else {
    // the night-sky hem: a navy band under a gold line, gold stars scattered in it
    b.paint(skirt, aabb([-30, yHem - 3, -30], [30, yHem + 5, 30]), 'hem', { where: outer });
    b.paint(skirt, aabb([-30, yHem + 5, -30], [30, yHem + 6, 30]), 'gold', { where: outer, shade: 1 });
    b.paint(skirt, fn((x, y, z) => (hash3(Math.floor(x), Math.floor(y), Math.floor(z)) < 0.09 ? -1 : 1), [-30, yHem - 3, -30], [30, yHem + 4, 30]), 'star', { where: b.isMat('hem') });
  }
  return coat;
}

// ---------------------------------------------------------------------------------------------- hair

const HAIR_CAP = (L: Landmarks): V3 => [L.spec.head.w / 2 + 1.1, L.spec.head.h / 2 + 1.0, L.spec.head.d / 2 + 1.1];

/** The cap parted in the middle, the soft fringe swept to either temple, the wavy tendrils framing the face. */
function hairCap(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }, fall: number): void {
  const c = hd.chin;
  const front = hd.front;
  // smooth hair drawn back from the face: short, flat locks lying along the skull
  spikeHair(b, L, 'hair', [
    { az: 95, el: 14, len: 0.7, r: 3.2, flat: 0.4, flow: [0.05, fall, -0.6] },
    { az: -95, el: 14, len: 0.7, r: 3.2, flat: 0.4, flow: [-0.05, fall, -0.6] },
    { az: 140, el: 20, len: 0.6, r: 3.6, flat: 0.4, flow: [0, -1.0, -0.7] },
    { az: -140, el: 20, len: 0.6, r: 3.6, flat: 0.4, flow: [0, -1.0, -0.7] },
    { az: 180, el: 28, len: 0.6, r: 3.8, flat: 0.4, flow: [0, -1.0, -0.6] },
  ], [], { capR: HAIR_CAP(L), tufts: 0, hairline: c + 11.2, nape: c + 1.5, slope: 0.6 });
  // the parting: a darker line from the hairline back over the crown
  b.paint('head', capsule([0, c + 12.8, front - 2.0], [0, c + 12.2, front - 8.5], 0.55), 'hair', { shade: 4, where: b.isMat('hair') });
  // the fringe swept from the parting back over each temple, the forehead left bare
  for (const k of [1, -1]) {
    const fr = smoothPath([[k * 0.9, c + 12.7, front - 2.6], [k * 2.9, c + 12.3, front - 0.9], [k * 4.5, c + 11.1, front - 0.6], [k * 5.5, c + 9.4, front - 1.4]], 4);
    b.add('head', tube(fr, fr.map((_, i) => 1.4 - i * 0.03)), 'hair', { thr: 0.3 });
  }
  // loose strands beside the face: from the temple past the ear to the jaw, in a gentle wave, clear of the cheeks
  for (const k of [1, -1]) {
    const td = smoothPath([[k * 5.6, c + 9.2, front - 3.0], [k * 6.2, c + 7.0, front - 3.4], [k * 5.8, c + 4.8, front - 3.6], [k * 6.3, c + 2.6, front - 3.9]], 4);
    b.add('head', tube(td, td.map((_, i) => 0.85 - i * 0.02)), 'hair', { thr: 0.3 });
  }
  // keep the face plate bare: nothing in front of it
  b.carve('head', aabb([-5.2, c + 1, front], [5.2, c + 10.4, front + 6]));
}

/** Sealed and Shikai: the hair drawn back from the face into a low twisted bun at the nape, a gold star pin through it. */
function bunHair(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const c = hd.chin;
  hairCap(b, L, hd, -0.9);
  const back = L.headC[2] - s.head.d / 2;
  // the hair from behind each ear sweeping down and back to the bun
  for (const k of [1, -1]) {
    const sec = smoothPath([[k * 5.4, c + 7, -1.6], [k * 5.2, c + 4.4, back + 1.4], [k * 3.4, c + 2.6, back - 0.4], [k * 1.2, c + 2.2, back - 1.0]], 4);
    b.add('head', tube(sec, sec.map((_, i) => 1.8 - i * 0.05)), 'hair', { thr: 0.3 });
  }
  // the bun: a coil of hair low at the nape, twisted (grooves spiralling round it)
  const bc: V3 = [0, c + 2.4, back - 2.0];
  b.add('head', torus(bc, 2.5, 1.7, [90, 0, 0]), 'hair');
  b.add('head', ellipsoid([bc[0], bc[1], bc[2] - 0.4], [2.2, 2.1, 1.7]), 'hair');
  b.add('head', capsule([0, c + 3.4, back + 0.6], [0, c + 2.6, back - 1.4], 2.2), 'hair');
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const p0: V3 = [bc[0] + Math.cos(a) * 1.0, bc[1] + Math.sin(a) * 1.0, bc[2] - 1.9];
    const p1: V3 = [bc[0] + Math.cos(a + 1.1) * 3.6, bc[1] + Math.sin(a + 1.1) * 3.4, bc[2] - 0.2];
    b.paint('head', capsule(p0, p1, 0.42), 'hair', { shade: 4, where: b.isMat('hair') });
  }
  // the pin: a gold rod through the bun, a small star at her left end
  b.add('head', capsule([-4.4, bc[1] + 1.6, bc[2] - 0.6], [4.6, bc[1] - 0.4, bc[2] - 0.9], 0.5), 'gold', { thr: 0.3 });
  const sp: V3 = [5.6, bc[1] - 0.6, bc[2] - 0.9];
  b.add('head', sphere(sp, 0.9), 'gold');
  for (const d of [[1.6, 0, 0], [-1.2, 0, 0], [0, 1.6, 0], [0, -1.6, 0]] as V3[]) b.add('head', capsule(sp, [sp[0] + d[0], sp[1] + d[1], sp[2] + d[2]], 0.55, 0.3), 'gold', { thr: 0.3 });
  return { springs: [], colliders: [] };
}

/**
 * Bankai and Final: the hair let down — long copper waves down her back on three spring bones, a long wavy lock in
 * front of each shoulder. In the final form the hair is light, a little longer, and floats.
 */
function looseHair(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }, form: NatachaForm): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const c = hd.chin;
  const front = hd.front;
  const R = NATACHA_RES;
  const fin = form === 'final';
  hairCap(b, L, hd, -1.3);
  // a long wavy lock in front of each shoulder, down over the collarbone to the chest
  for (const k of [1, -1]) {
    const st = smoothPath([[k * 5.4, c + 6, front - 5.2], [k * 6.4, c + 1.5, front - 4.4], [k * 5.9, c - 3, front - 3.2], [k * 6.8, c - 7.5, front - 2.2], [k * 6.0, c - 12, front - 1.6]], 4);
    b.add('head', tube(st, st.map((_, i) => 1.9 - i * 0.045)), 'hair', { thr: 0.3 });
  }
  const back = L.headC[2] - s.head.d / 2;
  const yTop = c + 6, yBot = fin ? s.waistY - 6 : s.waistY - 1;
  const zc = (y: number) => {
    const t = Math.max(0, Math.min(1, (yTop - y) / (yTop - yBot)));
    // out over the shoulder blades, then a slow wave down the back
    return back - 0.6 - Math.sin(Math.min(1, t * 2.4) * Math.PI * 0.5) * 2.2 + t * 0.4 + Math.sin(t * 9) * 0.7;
  };
  const sheet = fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (yTop - y) / (yTop - yBot)));
    // wider toward the ends, where the waves fan out
    const w = 6.0 - t * 0.6 + Math.sin(t * 3.1) * 0.9;
    const bot = yBot + Math.abs(Math.sin(x * 0.8)) * 3.0;
    // the waves: the surface rippling side to side down its length
    const ripple = Math.sin(y * 0.7 + x * 0.9) * 0.45;
    return Math.max(Math.abs(x) - w, Math.abs(z - zc(y) - ripple) - (1.9 - t * 0.4), y - yTop, bot - y);
  }, [-9, yBot - 1, back - 12], [9, yTop + 1, back + 3]);
  const p1: V3 = [0, c + 4, back - 1], p2: V3 = [0, s.chestY + 3, zc(s.chestY + 3)], p3: V3 = [0, s.chestY - 5, zc(s.chestY - 5)];
  const bones: [string, string, V3, number, number][] = [['hair1', 'head', p1, p2[1] - 0.5, 200], ['hair2', 'hair1', p2, p3[1] - 0.5, p2[1] + 0.5], ['hair3', 'hair2', p3, -100, p3[1] + 0.5]];
  for (const [name, parent, pivot, y0, y1] of bones) {
    b.bone(name, parent, pivot);
    b.add(name, intersect(sheet, aabb([-20, y0, -30], [20, y1, 10])), 'hair', { thr: 0.25 });
  }
  // the locks within the mass: darker grooves following the waves
  b.paint(['hair1', 'hair2', 'hair3'], fn((x, y) => Math.abs(((x + Math.sin(y * 0.7) * 0.8 + 30) % 2.6) - 1.3) - 0.32, [-9, yBot - 3, back - 14], [9, yTop + 2, back + 3]), 'hair', { shade: 4, where: b.isMat('hair') });
  const tip: V3 = [0, yBot, zc(yBot)];
  const g = fin ? 0.35 : 1;
  const springs: SpringDef[] = [
    { bone: 'hair1', tail: [(p2[0] - p1[0]) / R, (p2[1] - p1[1]) / R, (p2[2] - p1[2]) / R], stiffness: 40, damping: 5, gravity: 11 * g, limit: 40, radius: 0.07 },
    { bone: 'hair2', tail: [(p3[0] - p2[0]) / R, (p3[1] - p2[1]) / R, (p3[2] - p2[2]) / R], stiffness: 30, damping: 4.5, gravity: 12 * g, limit: 50, radius: 0.07 },
    { bone: 'hair3', tail: [(tip[0] - p3[0]) / R, (tip[1] - p3[1]) / R, (tip[2] - p3[2]) / R], stiffness: 24, damping: 4, gravity: 13 * g, limit: 60, radius: 0.06 },
  ];
  const colliders: ColliderDef[] = [
    { bone: 'chest', offset: [0, 0.07, -0.03], radius: 0.17 },
    { bone: 'spine', offset: [0, 0.02, -0.02], radius: 0.15 },
  ];
  return { springs, colliders };
}

// ---------------------------------------------------------------------------------------------- props

/** an eight-pointed star in the guard's plane (XY), points of length `r` and `r2` (the diagonals) */
function star8(c: V3, r: number, r2: number, thick: number): Sdf {
  const pts: [number, number][] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const rr = i % 2 === 0 ? (i % 4 === 0 ? r : r2) : r * 0.38;
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  return prism(pts, c, [1, 0, 0], [0, 1, 0], thick);
}

/** the hilt every blade shares: a wine-red wrap in diamonds over pale ray skin, gold collar and pommel cap */
function hilt(b: ModelBuilder): void {
  b.mat('wrap', ['#9A2F45', '#7E2236', '#62192A', '#4A1320'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#EDE6DA', '#D6CDBD']);
  b.add('root', box([0, 0, -3.4], [1.05, 1.2, 7.4], { round: 0.5 }), 'wrap');
  b.paint('root', fn((_x, y, z) => Math.abs(((Math.abs(y) + z) % 2.6 + 2.6) % 2.6 - 1.3) - 0.42, [-2, -2, -11.5], [2, 2, 4.5]), 'ray', { where: b.isMat('wrap') });
  b.add('root', box([0, 0, -11], [1.2, 1.35, 0.6], { round: 0.35 }), 'gold');
  b.add('root', box([0, -0.05, 4.7], [0.85, 1.2, 0.5]), 'gold');
}

/**
 * Myōjō. The katana (sealed): a slight curve, the gold eight-pointed star for a guard. The Shikai: straight, pale gold
 * steel, a glowing fuller, a larger star in a ring. The Bankai: a long blade cut out of the night sky (midnight steel
 * full of stars), its edge glowing gold. The final blade: light. Origin at the grip, +Z along the blade, edge −Y.
 */
function buildBlade(kind: 'katana' | 'shikai' | 'bankai' | 'final'): VoxelModel {
  const b = new ModelBuilder(`myojo-${kind}`, 48);
  b.mat('gold', ['#F4D88A', '#E3BC5E', '#C99B40', '#A27A2C'], { base: 1, rough: 0.3, metal: 0.9, shadeK: 0.8 });
  if (kind === 'katana') {
    b.mat('steel', ['#E9ECF0', '#D5D9DE', '#B2B8BF', '#9097A0'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
    b.mat('edge', ['#F3F3F0'], { rough: 0.12, metal: 0.8 });
  } else if (kind === 'shikai') {
    b.mat('steel', ['#F3ECD6', '#E6D9B4', '#CDBB8C', '#A8955F'], { base: 1, rough: 0.18, metal: 0.9, shadeK: 0.6 });
    b.mat('edge', ['#FFF4D2'], { rough: 0.1, metal: 0.8 });
    b.mat('fuller', ['#FFE7A0'], { glow: 2.2 });
  } else if (kind === 'bankai') {
    b.mat('steel', ['#33407A', '#273264', '#1D2650', '#171E40'], { base: 1, rough: 0.15, metal: 0.4, shadeK: 0.6 });
    b.mat('edge', ['#FFE3A0'], { glow: 1.8, rough: 0.1 });
    b.mat('star', ['#FFF5D6'], { glow: 2.8 });
    b.mat('starBlue', ['#C6D8FF'], { glow: 2.4 });
  } else {
    b.mat('steel', ['#FFF4D8', '#FFE8B4', '#FFD98E'], { base: 1, rough: 0.1, glow: 1.6, shadeK: 0.4 });
    b.mat('edge', ['#FFFBEA'], { glow: 2.6 });
  }
  b.bone('root', null, [0, 0, 0]);
  const z0 = 5;
  const zTip = kind === 'katana' ? 38 : kind === 'shikai' ? 41 : kind === 'bankai' ? 52 : 47;
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
    // straight and double-edged, a ridge down the middle, the point a long taper
    const wide = kind === 'bankai' ? 1.5 : 1.2;
    const taper = kind === 'bankai' ? 5 : 3.6;
    b.add('root', fn((x, y, z) => {
      if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
      const w = wide * Math.min(1, (zTip - z) / taper);
      return Math.max(Math.abs(x) - 0.5 + Math.abs(y) * 0.1, Math.abs(y) - w, z0 - z, z - zTip);
    }, [-2, -3, z0 - 1], [2, 3, zTip + 1]), 'steel', { thr: 0.3 });
    b.paint('root', fn((_x, y) => wide * 0.62 - Math.abs(y), [-2, -3, z0], [2, 3, zTip + 1]), 'edge', { where: b.isMat('steel') });
    if (kind === 'shikai') b.paint('root', fn((x, y, z) => Math.max(Math.abs(y) - 0.3, z0 + 1.5 - z, z - (zTip - 5), 0.2 - Math.abs(x)), [-2, -2, z0], [2, 2, zTip]), 'fuller', { where: b.isMat('steel') });
    if (kind === 'bankai') {
      // the night inside the blade: stars scattered over both flats
      b.paint('root', fn((x, y, z) => (Math.abs(y) < wide * 0.6 && hash3(Math.floor(x) + 5, Math.floor(y) + 9, Math.floor(z)) < 0.16 ? -1 : 1), [-2, -3, z0], [2, 3, zTip - 2]), 'star', { where: b.isMat('steel') });
      b.paint('root', fn((x, y, z) => (Math.abs(y) < wide * 0.6 && hash3(Math.floor(x) - 3, Math.floor(y) + 2, Math.floor(z) + 7) < 0.07 ? -1 : 1), [-2, -3, z0], [2, 3, zTip - 2]), 'starBlue', { where: b.isMat('steel') });
    }
  }
  // the guard: an eight-pointed star in gold (released: larger, inside a ring)
  const gz = 3.8;
  if (kind === 'katana') b.add('root', star8([0, 0, gz], 3.6, 2.6, 0.5), 'gold');
  else {
    b.add('root', star8([0, 0, gz], 4.8, 3.2, 0.5), 'gold');
    b.add('root', torus([0, 0, gz], 3.2, 0.5, [90, 0, 0]), 'gold');
  }
  b.add('root', cylinder([0, 0, gz - 0.6], [0, 0, gz + 0.9], 1.5), 'gold');
  hilt(b);
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** The sheath: navy lacquer sown with gold flecks, gold at the mouth and the tip. */
function buildSaya(): VoxelModel {
  const b = new ModelBuilder('myojo-saya', 48);
  b.mat('lacquer', ['#2E3B66', '#222D52', '#1A2342', '#151B33'], { base: 1, rough: 0.28, shadeK: 0.8 });
  b.mat('gold', ['#F4D88A', '#E3BC5E', '#C99B40'], { base: 1, rough: 0.35, metal: 0.85 });
  b.mat('fleck', ['#F2D88E'], { rough: 0.3, metal: 0.7 });
  b.bone('root', null, [0, 0, 0]);
  const Ls = 35;
  b.add('root', box([0, 0, -Ls / 2], [0.95, 1.45, Ls / 2], { round: 0.6 }), 'lacquer');
  b.paint('root', fn((x, y, z) => (hash3(Math.floor(x) + 3, Math.floor(y), Math.floor(z)) < 0.06 ? -1 : 1), [-2, -2, -Ls], [2, 2, 0]), 'fleck', { where: b.isMat('lacquer') });
  b.add('root', box([0, 0, -0.5], [1.15, 1.65, 0.6], { round: 0.3 }), 'gold');
  b.add('root', box([0, 0, -Ls + 0.6], [1.1, 1.6, 0.7], { round: 0.5 }), 'gold');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * The halo of the final form: a ring of light with eight points around it (the four long ones on the axes), standing
 * behind her back (built in the XY plane, facing +Z).
 */
function buildHalo(): VoxelModel {
  const b = new ModelBuilder('myojo-halo', 48);
  b.mat('light', ['#FFF1C8', '#FFE29A', '#FFCB6A'], { base: 1, glow: 2.4, rough: 0.2, shadeK: 0.4 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', torus([0, 0, 0], 13, 0.9, [90, 0, 0]), 'light');
  b.add('root', star8([0, 0, 0], 22, 17, 0.6), 'light', { only: 'empty' });
  // hollow the star inside the ring: only the points outside it remain
  b.carve('root', cylinder([0, 0, -2], [0, 0, 2], 12.1));
  b.add('root', torus([0, 0, 0], 13, 0.9, [90, 0, 0]), 'light');
  b.lint();
  return b.build();
}
