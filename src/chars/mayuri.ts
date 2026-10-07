// Mayuri Kurotsuchi — Captain of the 12th Division, President of the Shinigami Research and Development
// Institute (docs/roster/B3-captains-3.md), in his Soul Society look. 174 cm → 84 vox: gaunt and skeletal,
// long thin limbs, long spidery hands with blue nails (the right middle nail as long as the finger). The face
// painted white with its inner part painted black but for the nose; gold eyes, a constant bared-teeth grin;
// golden cones in place of his ears; a white hat with two ends jutting out to his right; a big purple cravat
// knotted at the throat. The black shihakushō under a long-sleeved white haori with 十二 in a rhombus on the
// back (the lining's colour is undocumented: an olive, the division's (verify)). Ashisogi Jizō, sealed: a
// katana with a pink hilt and a cloth-wrapped guard bristling with golden leaf spikes, its sheath hung
// straight down in front of him from a hook on the pommel. Shikai: a deformed trident — a long straight
// centre blade rising from a golden guard shaped like a baby's head with its hands joined in prayer, two
// serpentine side blades, golden leaf spikes below.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, prism, smoothPath, sphere, spike, subtract, torus, tube, type Sdf, type V3 } from '../models/sdf';
import { coatSkirt, feet, hakama, hands, head, humanoidSkeleton, kosodeSleeves, kosodeTorso, obi, shihakushoSprings, type HumanoidSpec, type Landmarks } from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

/** 84 voxels = 1.74 m */
export const MAYURI_RES = 84 / 1.74;

/** Gaunt: a narrow chest and waist, long arms and long hands. */
const SPEC: HumanoidSpec = {
  H: 84,
  chinY: 72,
  head: { w: 10, d: 11, h: 12 },
  neckR: 2.2,
  shoulder: [9.0, 66.5, -0.5],
  upperArm: 15,
  foreArm: 13.5,
  hand: 9.6,
  armR: 2.0,
  hipsY: 45,
  hip: [4.3, 42, 0],
  kneeY: 23,
  ankleY: 4.5,
  chest: [7.2, 4.4],
  waist: [5.8, 3.8],
  hips: [6.4, 4.2],
  chestY: 61,
  waistY: 51,
  foot: { len: 12, w: 4.6, heel: 3 },
};

function palette(b: ModelBuilder): void {
  // the body paint: chalk white, and black
  b.mat('paint', ['#F3F2EC', '#ECEBE4', '#DEDCD3', '#C9C6BC', '#A9A69C'], { base: 1, rough: 0.55, shadeK: 0.9 });
  b.mat('ink', ['#2A2A30', '#1E1E24', '#18181C', '#141418'], { base: 1, rough: 0.5 });
  b.mat('gold', ['#F2D27A', '#E3B84A', '#D4A437', '#B0852A', '#8A661E'], { base: 2, rough: 0.3, metal: 0.8, shadeK: 0.8 });
  b.mat('eye', ['#F0C640', '#E3B32A', '#B88A1C'], { base: 1, glow: 0.15 });
  b.mat('pupil', ['#141418']);
  b.mat('teeth', ['#F3F2EA', '#E6E3D8', '#CFCABA'], { base: 0, rough: 0.4 });
  b.mat('nail', ['#4A78D8', '#2F5DC4', '#22459A'], { base: 1, rough: 0.3 });
  b.mat('hat', ['#F4F4F0', '#ECECE7', '#DCDBD5', '#C6C6C2', '#A8A9AE'], { base: 1, rough: 0.7, shadeK: 0.9 });
  b.mat('cravat', ['#8E62C2', '#7B50B0', '#6B3FA0', '#563088', '#40226A'], { base: 2, rough: 0.6, shadeK: 0.85 });
  b.mat('black', ['#34343C', '#26262C', '#1A1A1F', '#141416'], { base: 2, rough: 0.85, shadeK: 0.9 });
  b.mat('collar', ['#EDEDEA', '#DCDCD8', '#C4C4C0'], { base: 0, rough: 0.8 });
  b.mat('obi', ['#F2F2EF', '#E2E2DE', '#CACAC6'], { base: 0, rough: 0.8 });
  b.mat('haori', ['#F4F3EF', '#ECEBE6', '#DCDBD6', '#C4C5C9', '#A6A9B0'], { base: 1, rough: 0.8, shadeK: 0.9 });
  b.mat('haoriIn', ['#78782A', '#5E5E10', '#4A4A0C', '#36360A'], { base: 1, rough: 0.85 });
  b.mat('kanji', ['#141418'], { rough: 0.9 });
  b.mat('tabi', ['#F2F2EE', '#DEDDDA', '#C2C1BD'], { base: 0, rough: 0.8 });
  b.mat('sole', ['#C9A86A', '#B99A63', '#8F7444'], { base: 1, rough: 0.9 });
  b.mat('cord', ['#5B4632']);
}

/**
 * The painted face, rows 9 → 0 (column 0 is his right). White round the edge, the inner face black, the nose
 * left white; gold eyes with pin pupils; the wide grin of bared teeth, both rows, a dark line between.
 */
const FACE = [
  'W K K K K K K K K W',
  'W K G G K K G G K W',
  'W K G p K K p G K W',
  'W K G G K K G G K W',
  'W K K K N N K K K W',
  'W K K K N N K K K W',
  'K T U T U U T U T K',
  'K t t t t t t t t K',
  'K T U T U U T U T K',
  'W K K K K K K K K W',
];

const assetCache = new Map<string, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function mayuriAsset(): CharacterAsset {
  let a = assetCache.get('captain');
  if (!a) assetCache.set('captain', (a = buildMayuri()));
  return a;
}

/** 'sword' (sealed Ashisogi Jizō), 'sheath' / 'sheath-empty' (hung before him), 'trident' (the Shikai) */
export type MayuriProp = 'sword' | 'sheath' | 'sheath-empty' | 'trident';

export function mayuriProp(kind: MayuriProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'sword' ? buildSword() : kind === 'trident' ? buildTrident() : buildSheath(kind === 'sheath');
    propCache.set(kind, m);
  }
  return m;
}

/** blade points (prop frame, m) */
export const SWORD_BASE_Z = 4 / 48;
export const SWORD_TIP_Z = 0.8;
export const TRIDENT_TIP_Z = 1.02;
/** the baby's face on the Shikai guard: its eyes and mouth (prop frame, m) */
export const BABY_MOUTH: V3 = [0, -0.4 / 48, 6.4 / 48];

export function buildMayuri(): CharacterAsset {
  const b = new ModelBuilder('mayuri', MAYURI_RES);
  palette(b);
  const s = SPEC;
  const L = humanoidSkeleton(b, s, { sleeves: true, hakama: true });
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 5, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5, wz + 1]);
  b.socket('finger.R', 'palm.R', [-wx + 0.2, wy - s.hand - 0.5, wz + 1]);
  // the sheath hangs straight down before him from the obi, the pommel hooked on (the prop's +Z points down)
  b.socket('front', 'hips', [0, s.waistY - 2.6, 6.2], [90, 0, 0]);
  b.socket('back', 'chest', [0, s.chestY + 1, -8]);
  b.socket('chest.front', 'chest', [0, s.chestY, 7]);
  // the left ear cone (it hides the kusarigama) and the left shoulder (Jabarakaina leaves from here)
  b.socket('ear.L', 'head', [s.head.w / 2 + 3.2, s.chinY + 5.5, -1]);
  b.socket('shoulder.L', 'upperarm.L', [s.shoulder[0], s.shoulder[1] - 2, s.shoulder[2]]);
  const hd = head(b, L, 'paint');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('mouth', 'head', [0, s.chinY + 2, hd.front + 0.5]);
  // a gaunt skull: the cheeks hollowed under the cheekbones
  for (const k of [-1, 1]) b.carve('head', box([k * 5.3, hd.chin + 2.2, hd.front - 2.2], [0.7, 1.8, 2.6], { rot: [0, 0, k * 14] }));
  b.stamp('head', hd.x0, hd.chin + 9, FACE, {
    W: { mat: 'paint', shade: 1 }, K: { mat: 'ink' }, N: { mat: 'paint', shade: 0, proud: 1 },
    G: { mat: 'eye' }, p: { mat: 'pupil' }, T: { mat: 'teeth', proud: 1 }, U: { mat: 'teeth', shade: 2, proud: 1 }, t: { mat: 'ink' },
  }, hd.front - 1);
  hat(b, L, hd);
  earCones(b, L);
  hands(b, L, 'paint');
  nails(b, L);
  feet(b, L, 'tabi', 'sole', 'cord');
  const o = { black: 'black', collar: 'collar', skin: 'paint', obi: 'obi', crossY: s.chestY - 7, hemR: 8.4, hakamaHem: 3 };
  const torso = kosodeTorso(b, L, o);
  obi(b, L, o);
  hakama(b, L, o);
  kosodeSleeves(b, L, { ...o, black: 'haori', collar: 'haori', obi: 'haori', bag: 5 });
  const [sx, , sz] = s.shoulder;
  b.paint('forearm.L', cylinder([sx + 0.8, wy - 1.2, sz - 0.6], [sx + 0.8, wy + 2.6, sz - 0.6], 3.95), 'haoriIn', { mirror: true, where: b.isMat('haori') });
  const coat = haori(b, L);
  cravat(b, L, torso);
  b.autoShade();
  b.lint();
  const base = shihakushoSprings();
  return { model: b.build(), springs: [...base.springs, ...coat.springs], colliders: [...base.colliders, ...coat.colliders], warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- head

/**
 * The white hat: a close cap over the crown and the back of the head, and its two ends — long tapering horns
 * jutting out sideways to his right, the upper one rising a little, the lower one sweeping back.
 */
function hat(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }): void {
  const s = L.spec;
  const c = hd.chin;
  const front = hd.front, back = front - s.head.d;
  const hw = s.head.w / 2;
  const cran = ellipsoid([0, c + 7.4, (front + back) / 2 - 0.2], [hw + 1.3, 6.4, s.head.d / 2 + 1.2]);
  // the cap: above a brim line across the forehead, lower at the back (to the nape)
  const cap = intersect(subtract(cran, ellipsoid([0, c + 7.2, (front + back) / 2 - 0.2], [hw - 0.2, 5.2, s.head.d / 2 - 0.4])), halfSpace([0, c + 9.6, front], [0, -1, 0.42]));
  b.add('head', cap, 'hat');
  // the skull under the cap is hat-white too (no skin shows through the gaps)
  b.paint('head', intersect(ellipsoid([0, c + 7.4, (front + back) / 2 - 0.2], [hw + 2, 7.4, s.head.d / 2 + 2]), halfSpace([0, c + 10.2, front], [0, -1, 0.42])), 'hat', { where: b.isMat('paint') });
  // the two ends, out to his right (−X)
  const horns: [V3, V3[], number][] = [
    [[-hw, c + 11.2, -1], [[-hw - 3, c + 12.2, -1.5], [-hw - 6.5, c + 13.4, -2.2], [-hw - 9.5, c + 15.2, -3.2]], 2.0],
    [[-hw, c + 8.6, -3], [[-hw - 3.2, c + 8.8, -4], [-hw - 6.8, c + 9.6, -5.6], [-hw - 9.8, c + 11, -7.6]], 1.8],
  ];
  for (const [root, path, r] of horns) {
    const pts = smoothPath([[root[0] + 2.2, root[1], root[2]], root, ...path], 4);
    b.add('head', tube(pts, pts.map((_, i) => r * (1.25 - 1.05 * (i / (pts.length - 1)) ** 0.9) + 0.2)), 'hat', { thr: 0.35 });
  }
}

/** Golden cones where his ears should be, stubby, pointing out. */
function earCones(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const hw = s.head.w / 2;
  const y = s.chinY + 5.5;
  b.add('head', cylinder([hw - 0.6, y, -1], [hw + 3.4, y, -1], 2.1, 0.5, 0.4), 'gold', { mirror: false });
  b.add('head', cylinder([-hw + 0.6, y, -1], [-hw - 3.4, y, -1], 2.1, 0.5, 0.4), 'gold');
  // a ring of rivets round each base
  for (const k of [-1, 1]) b.paint('head', torus([k * (hw + 0.6), y, -1], 1.9, 0.45, [0, 0, 90]), 'gold', { shade: 4, where: b.isMat('gold') });
}

/** Blue nails on the fingertips, and the long one on his right middle finger. */
function nails(b: ModelBuilder, L: Landmarks): void {
  const [wx, wy, wz] = L.wrist;
  const len = L.spec.hand;
  b.paint('palm.L', box([wx - 0.2, wy - len + 1.2, wz + 0.4], [1.5, 1.0, 2.5]), 'nail', { mirror: true, where: b.isMat('paint') });
  b.paint('fist.L', box([wx + 1.6, wy - 5.6, wz + 0.4], [0.7, 1.2, 2.8]), 'nail', { mirror: true, where: b.isMat('paint') });
  // the long nail: as long as the finger, a thin blue spike off the middle of the right hand's fingertips
  b.add('palm.R', spike([-wx + 0.2, wy - len + 1.6, wz + 0.4], [0, -1, 0.1], 4.4, 0.7, 0.5, { tip: 0.2 }), 'nail', { thr: 0.3 });
}

// ---------------------------------------------------------------------------------------------- clothes

/** The big purple cravat: a puffy wrap round the throat, the knot, two broad tails over the chest. */
function cravat(b: ModelBuilder, L: Landmarks, torso: Sdf): void {
  const s = L.spec;
  const c = s.chinY;
  const nz = L.headC[2] - 0.5;
  // the wrap: a fat ring round the neck, puffed
  b.add('chest', intersect(torus([0, c - 3.4, nz + 0.6], 3.6, 2.2), halfSpace([0, c - 0.2, 0], [0, 1, 0])), 'cravat');
  b.add('chest', ellipsoid([0, c - 4.4, nz + 5.2], [3.4, 2.4, 2.2]), 'cravat');
  // the tails: broad, rounded, spreading a little, lying on the chest
  const zOn = (y: number) => {
    for (let z = 14; z > -4; z -= 0.5) if (torso.d(0.5, y, z) <= 0.5) return z + 1.4;
    return 6;
  };
  for (const k of [-1, 1]) {
    const p0: V3 = [k * 1.2, c - 5.6, zOn(c - 5.6)], p1: V3 = [k * 3.2, c - 11.5, zOn(c - 11.5) + 0.6];
    b.add('chest', capsule(p0, p1, 2.5, 2.9), 'cravat');
  }
  // folds: a crease down each tail and round the wrap
  for (const k of [-1, 1]) b.paint('chest', capsule([k * 1.4, c - 6.4, 9], [k * 3.2, c - 12.2, 10], 0.55), 'cravat', { shade: 4, where: b.isMat('cravat') });
  b.paint('chest', torus([0, c - 3.4, nz + 0.6], 3.7, 0.5), 'cravat', { shade: 4, where: b.isMat('cravat') });
}

/** The long-sleeved haori, open down the front, 十二 in a rhombus on the back. */
function haori(b: ModelBuilder, L: Landmarks): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const torso = blend(3.6,
    box([0, s.chestY - 0.5, -0.3], [cx + 1.1, 6, cz + 1.1], { round: 3.4 }),
    box([0, s.waistY, -0.2], [wx + 1.1, 4.5, wz + 1.1], { round: 3 }),
    capsule([2.5, sy + 1.6, sz - 0.8], [sx + 0.6, sy - 0.6, sz], 2.9, 3.2),
    capsule([-2.5, sy + 1.6, sz - 0.8], [-sx - 0.6, sy - 0.6, sz], 2.9, 3.2));
  const front = halfSpace([0, 0, 1], [0, 0, -1]);
  const open = intersect(prism([[-2.8, 100], [2.8, 100], [4.4, s.chestY], [5.4, 40], [-5.4, 40], [-4.4, s.chestY]], [0, 0, 0], [1, 0, 0], [0, 1, 0], 30), front);
  const shell = subtract(offset(torso, 1.9), offset(torso, -0.1), open);
  for (const [bone, y0, y1] of [['spine', s.waistY - 3, s.waistY + 6], ['chest', s.waistY + 6, 100]] as [string, number, number][]) b.add(bone, intersect(shell, aabb([-30, y0, -30], [30, y1, 30])), 'haori');
  b.paint(['chest', 'spine'], intersect(offset(open, 0.8), front), 'haoriIn', { where: b.isMat('haori') });
  // 十二 in a rhombus, drawn as seen from behind (viewer's left = the character's left = +X)
  const W = 15, H = 19, mx = (W - 1) / 2, my = (H - 1) / 2;
  const rows: string[] = [];
  for (let r = 0; r < H; r++) {
    let row = '';
    for (let ci = 0; ci < W; ci++) {
      const e = Math.abs(ci - mx) / (mx + 0.5) + Math.abs(r - my) / (my + 0.5);
      const ring = e > 0.9 && e <= 1.02;
      const ju = (r === 5 && ci >= 4 && ci <= 10) || (ci === 7 && r >= 3 && r <= 8);
      const ni = (r === 11 && ci >= 5 && ci <= 9) || (r === 14 && ci >= 4 && ci <= 10);
      row += ring || ju || ni ? 'X' : '.';
    }
    rows.push(row);
  }
  const top = s.chestY + 5;
  rows.forEach((row, r) => {
    for (let ci = 0; ci < row.length; ci++) {
      if (row[ci] !== 'X') continue;
      const x = mx - ci, y = top - r;
      for (const bone of ['chest', 'spine']) {
        const g = b.grid(bone);
        let hit = false;
        for (let z = -16; z < 2 && !hit; z++)
          if (g.get(x, y, z) !== 0) {
            b.voxel(bone, x, y, z, 'kanji', 0);
            hit = true;
          }
        if (hit) break;
      }
    }
  });
  return coatSkirt(b, L, { mat: 'haori', lining: 'haoriIn', yTop: s.waistY - 2, yHem: 12, r0: 9.6, r1: 13.2, openFront: 16, res: MAYURI_RES });
}

// ---------------------------------------------------------------------------------------------- props

/** the hilt shared by the sealed sword and the trident: the pink grip, the cloth-wrapped guard, the leaf spikes */
function hilt(b: ModelBuilder): void {
  b.mat('pink', ['#F2A6C8', '#E68AB4', '#C86C98', '#A0507A'], { base: 1, rough: 0.7 });
  b.mat('wrap', ['#B89C7C', '#A08868', '#86704F', '#6A5638'], { base: 1, rough: 0.9 });
  b.mat('leaf', ['#E8C258', '#C8A03A', '#A07C26', '#7A5C18'], { base: 1, rough: 0.35, metal: 0.75 });
  b.mat('steel', ['#E4E8EC', '#C9CED4', '#AAB0B8', '#8A9098'], { base: 1, rough: 0.22, metal: 0.9 });
  // the grip: pink, a diamond wrap
  b.add('root', box([0, 0, -4.5], [1.1, 1.3, 5.5], { round: 0.8 }), 'pink');
  b.paint('root', fn((x, y, z) => Math.abs(((z + y * 0.9 + 40) % 2.2) - 1.1) - 0.3, [-2, -2, -11], [2, 2, 1]), 'pink', { shade: 3, where: b.isMat('pink') });
  // the pommel and its hook
  b.add('root', sphere([0, 0, -10.2], 1.5), 'leaf');
  b.add('root', torus([0, 0, -11.6], 1.1, 0.45, [0, 90, 0]), 'leaf', { thr: 0.3 });
  // the guard wrapped in cloth, leaf spikes bristling up round the blade
  b.add('root', ellipsoid([0, 0, 1.4], [2.6, 2.4, 1.8]), 'wrap');
  b.paint('root', fn((x, y, z) => Math.abs(((z * 1.4 + Math.atan2(y, x) * 2.4 + 20) % 1.8) - 0.9) - 0.3, [-3, -3, -1], [3, 3, 4]), 'wrap', { shade: 3, where: b.isMat('wrap') });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    const d: V3 = [Math.cos(a) * 0.55, Math.sin(a) * 0.55, 1];
    b.add('root', spike([Math.cos(a) * 1.8, Math.sin(a) * 1.8, 2.2], d, 3.4, 0.9, 0.35, { side: [-Math.sin(a), Math.cos(a), 0], tip: 0.25 }), 'leaf', { thr: 0.3 });
  }
}

/** Ashisogi Jizō, sealed (prop frame: the grip at the origin, the blade along +Z, the edge toward −Y). */
function buildSword(): VoxelModel {
  const b = new ModelBuilder('mayuri-sword', 48);
  b.bone('root', null, [0, 0, 0]);
  hilt(b);
  b.mat('edge', ['#F3F3F0'], { rough: 0.15, metal: 0.9 });
  b.add('root', fn((x, y, z) => {
    if (z < 3 || z > 39) return 1;
    const u = (z - 3) / 36;
    const w = 1.25 - u * 0.25;
    const tip = z > 35 ? (z - 35) * 0.9 : 0;
    return Math.max(Math.abs(x) - 0.45, Math.abs(y) - w, y - w + tip * 0.8, -y - w + tip * 0.15);
  }, [-1, -2.5, 2], [1, 3, 40]), 'steel');
  b.paint('root', fn((x, y) => y + 0.6, [-1, -3, 2], [1, 3, 40]), 'edge', { where: b.isMat('steel') });
  b.autoShade();
  return b.build();
}

/** The sheath, hung straight down (prop frame like the sword: +Z toward the tip). */
function buildSheath(withSword: boolean): VoxelModel {
  const b = new ModelBuilder(withSword ? 'mayuri-sheath' : 'mayuri-sheath-empty', 48);
  b.bone('root', null, [0, 0, 0]);
  b.mat('lacquer', ['#3E3A44', '#2C2A32', '#201E24', '#16151A'], { base: 1, rough: 0.3 });
  b.mat('fit', ['#E8C258', '#C8A03A', '#A07C26'], { base: 1, rough: 0.35, metal: 0.75 });
  b.add('root', box([0, 0, 21], [1.0, 1.7, 19], { round: 0.9 }), 'lacquer');
  b.add('root', box([0, 0, 2.6], [1.2, 1.9, 0.8], { round: 0.5 }), 'fit');
  b.add('root', box([0, 0, 39.4], [1.1, 1.8, 0.9], { round: 0.6 }), 'fit');
  if (withSword) {
    hilt(b);
    // (the hilt rises out of the mouth of the sheath; the prop's origin is at the guard)
  }
  b.autoShade();
  return b.build();
}

/**
 * The Shikai: a deformed trident. The long straight centre blade rises from the guard, a golden baby's head
 * with its hands joined in prayer (the mouth gapes: the poison leaks from it); two serpentine side blades
 * curl up from beside the head; golden leaf spikes below.
 */
function buildTrident(): VoxelModel {
  const b = new ModelBuilder('mayuri-trident', 48);
  b.bone('root', null, [0, 0, 0]);
  hilt(b);
  b.mat('babyG', ['#F0CC6A', '#D7AE3B', '#B8902A', '#8A6A1C'], { base: 1, rough: 0.35, metal: 0.7, shadeK: 0.85 });
  b.mat('mouthIn', ['#3A1830']);
  b.mat('babyEye', ['#2A1A10']);
  b.mat('edge', ['#F3F3F0'], { rough: 0.15, metal: 0.9 });
  // the baby's head above the guard, facing along −Y (the edge side), its hands joined below the chin
  const hc: V3 = [0, -0.4, 6.6];
  b.add('root', ellipsoid(hc, [3.0, 2.8, 3.1]), 'babyG');
  b.add('root', capsule([-1.6, -2.2, 4.0], [1.6, -2.2, 4.0], 1.1), 'babyG');
  b.add('root', capsule([0, -2.6, 3.4], [0, -2.9, 5.2], 0.9), 'babyG');
  // the face: two closed eyes, the gaping mouth
  for (const x of [-1.2, 1.2]) b.add('root', box([x, -3.0, 7.4], [0.6, 0.4, 0.3]), 'babyEye');
  b.carve('root', ellipsoid([0, -3.2, 5.8], [0.9, 1.2, 0.9]));
  b.add('root', ellipsoid([0, -2.4, 5.8], [0.9, 0.6, 0.9]), 'mouthIn', { only: 'empty' });
  // the centre blade: long and straight from the crown of the head
  b.add('root', fn((x, y, z) => {
    if (z < 8.5 || z > 49) return 1;
    const u = (z - 8.5) / 40.5;
    const w = 1.2 - u * 0.4;
    const tip = z > 45 ? (z - 45) * 0.8 : 0;
    return Math.max(Math.abs(x) - 0.45, Math.abs(y) - w + tip, -1);
  }, [-1, -2.5, 8], [1, 2.5, 50]), 'steel');
  b.paint('root', fn((x, y) => Math.abs(y) - 0.5, [-1, -3, 8], [1, 3, 50]), 'edge', { where: b.isMat('steel') });
  // the side blades: snaking up from beside the head, curling out and back in
  for (const k of [-1, 1]) {
    const pts = smoothPath([[k * 2.6, 0, 5.4], [k * 4.8, 0, 8.2], [k * 4.0, 0, 12.4], [k * 5.6, 0, 16.4], [k * 4.6, 0, 20.6], [k * 5.4, 0, 24.4]], 4);
    b.add('root', tube(pts, pts.map((_, i) => 0.95 - i * 0.03)), 'steel', { thr: 0.3 });
  }
  b.autoShade();
  return b.build();
}
