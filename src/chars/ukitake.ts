// Jūshirō Ukitake — Captain of the 13th Division (docs/roster/B3-captains-3.md). 187 cm → 90 vox: tall and
// thin from a lifetime of illness, a gentle face. Long white hair to the waist, parted on the left, one long
// lock falling over the right eye; black brows, green eyes. The shihakushō under a long-sleeved white haori
// with a crimson lining and 十三 in a rhombus on the back, a band of black lozenges along its hem; the
// narrow white obi holds the sword at his left hip. Sealed: a katana with a rectangular bronze guard and a
// dark-red hilt in a black lacquered sheath. Shikai — Sōgyo no Kotowari: two thinner blades, each with a
// second, inward-edged blade running back toward the hilt from halfway along (a jitte's fin), the guards
// crept up the blades, a ring on each pommel for the red rope and its five charms (drawn live, vfx/sogyo).
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, fn, halfSpace, intersect, offset, prism, smoothPath, sphere, subtract, torus, tube, type V3 } from '../models/sdf';
import { coatSkirt, faceLegend, feet, hakama, hands, head, humanoidSkeleton, kosodeSleeves, kosodeTorso, obi, shihakushoSprings, spikeHair, type HumanoidSpec, type Landmarks } from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

export const UKITAKE_RES = 90 / 1.87;

const SPEC: HumanoidSpec = {
  H: 90,
  chinY: 78,
  head: { w: 10, d: 11, h: 12 },
  neckR: 2.5,
  shoulder: [9.2, 72, -0.5],
  upperArm: 15.8,
  foreArm: 14,
  hand: 9.4,
  armR: 2.3,
  hipsY: 48.5,
  hip: [4.5, 45.5, 0],
  kneeY: 25,
  ankleY: 4.6,
  chest: [7.6, 4.4],
  waist: [6.0, 3.9],
  hips: [6.6, 4.3],
  chestY: 66,
  waistY: 55.5,
  foot: { len: 12.5, w: 5, heel: 3 },
};

function palette(b: ModelBuilder): void {
  b.mat('skin', ['#F7E6D8', '#EFD6C4', '#E4C6B1', '#D9BCA8', '#BC9C88'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#F3F3F0', '#EDECE7', '#E0DDD5', '#CFCAC2', '#B4AEA5'], { base: 1, rough: 0.55, shadeK: 0.85, dither: 0.04 });
  b.mat('brow', ['#1E1E22']);
  b.mat('lid', ['#3A3232']);
  b.mat('sclera', ['#F0EEE8']);
  b.mat('iris', ['#4E9A63']);
  b.mat('irisD', ['#2C5E3A']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#A06A64']);
  b.mat('black', ['#34343C', '#26262C', '#1A1A1F', '#141416'], { base: 2, rough: 0.85, shadeK: 0.9 });
  b.mat('collar', ['#EDEDEA', '#DCDCD8', '#C4C4C0'], { base: 0, rough: 0.8 });
  b.mat('obi', ['#F2F2EF', '#E2E2DE', '#CACAC6'], { base: 0, rough: 0.8 });
  b.mat('haori', ['#F4F3EF', '#ECEBE6', '#DCDBD6', '#C4C5C9', '#A6A9B0'], { base: 1, rough: 0.8, shadeK: 0.9 });
  b.mat('haoriIn', ['#B5303F', '#9C1B2B', '#821523', '#64101B'], { base: 1, rough: 0.85 });
  b.mat('kanji', ['#141418'], { rough: 0.9 });
  b.mat('sole', ['#C9A86A', '#B99A63', '#8F7444'], { base: 1, rough: 0.9 });
  b.mat('cord', ['#5B4632']);
}

/** Kind, slightly tired green eyes under black brows; a small, soft mouth. Rows 9 → 0. */
const FACE = [
  '. B B B . . B B B .',
  '. . . . . . . . . .',
  '. L L L . . L L L .',
  '. W I i . . i I W .',
  '. . . . . . . . . .',
  '. . . . . s . . . .',
  '. . . . . . . . . .',
  '. . . . . . . . . .',
  '. . . . m m . . . .',
  '. . . . . . . . . .',
];

export type UkitakeProp = 'katana' | 'sheath' | 'sheath-empty' | 'sogyo';

const assetCache = new Map<string, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function ukitakeAsset(): CharacterAsset {
  let a = assetCache.get('captain');
  if (!a) assetCache.set('captain', (a = buildUkitake()));
  return a;
}

export function ukitakeProp(kind: UkitakeProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'katana' ? buildKatana() : kind === 'sogyo' ? buildSogyo() : buildSheath(kind === 'sheath');
    propCache.set(kind, m);
  }
  return m;
}

/** blade points (prop frame, m) */
export const KATANA_TIP_Z = 0.8;
export const SOGYO_TIP_Z = 0.78;
/** the ring on each Shikai pommel the rope is tied to (prop frame, m) */
export const SOGYO_POMMEL: V3 = [0, 0, -7.4 / 48];

export function buildUkitake(): CharacterAsset {
  const b = new ModelBuilder('ukitake', UKITAKE_RES);
  palette(b);
  const s = SPEC;
  const L = humanoidSkeleton(b, s, { sleeves: true, hakama: true });
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 5, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5, wz + 1]);
  b.socket('finger.R', 'palm.R', [-wx + 0.2, wy - s.hand - 0.5, wz + 1]);
  b.socket('finger.L', 'palm.L', [wx - 0.2, wy - s.hand - 0.5, wz + 1]);
  // the sword through the obi at his left hip, the hilt forward
  b.socket('hip.L', 'hips', [9.4, s.waistY - 3.6, 3.8], [-24, 180, -8]);
  b.socket('back', 'chest', [0, s.chestY + 1, -8]);
  b.socket('chest.front', 'chest', [0, s.chestY, 7]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('mouth', 'head', [0, s.chinY + 1.5, hd.front + 0.5]);
  b.stamp('head', hd.x0, hd.chin + 9, FACE, faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  // a hollow under the cheekbones (he is thin)
  for (const x of [-4, 3]) b.voxel('head', x, hd.chin + 3, hd.front - 1, 'skin', 2);
  const hair = hairDo(b, L, hd);
  hands(b, L, 'skin');
  feet(b, L, 'skin', 'sole', 'cord');
  const o = { black: 'black', collar: 'collar', skin: 'skin', obi: 'obi', crossY: s.chestY - 8, hemR: 8.8, hakamaHem: 3 };
  kosodeTorso(b, L, o);
  obi(b, L, o);
  hakama(b, L, o);
  // the haori's long sleeves are the outermost: white, the crimson lining showing at the mouths
  kosodeSleeves(b, L, { ...o, black: 'haori', collar: 'haori', obi: 'haori', bag: 5.2 });
  const [sx, , sz] = s.shoulder;
  b.paint('forearm.L', cylinder([sx + 0.8, wy - 1.2, sz - 0.6], [sx + 0.8, wy + 2.6, sz - 0.6], 3.95), 'haoriIn', { mirror: true, where: b.isMat('haori') });
  const coat = haori(b, L);
  b.autoShade();
  b.lint();
  const base = shihakushoSprings();
  return { model: b.build(), springs: [...base.springs, ...coat.springs, ...hair.springs], colliders: [...base.colliders, ...coat.colliders, ...hair.colliders], warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- hair

/**
 * Long, straight white hair parted on the left: a cap with locks falling to the nape and over the ears,
 * a lock across the forehead hanging over the right eye, a strand down in front of each shoulder, and the
 * long fall down the back to the waist on three spring bones (a slightly ragged bottom edge).
 */
function hairDo(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const c = hd.chin;
  const front = hd.front;
  const R = UKITAKE_RES;
  spikeHair(b, L, 'hair', [
    // falling straight from the part on the left, down the sides and the back
    { az: 20, el: 62, len: 2, r: 4.4, flat: 0.45, flow: [-0.4, -0.3, -0.9] },
    { az: -40, el: 45, len: 2.2, r: 4.2, flat: 0.5, flow: [-0.3, -0.6, -0.8] },
    { az: 70, el: 40, len: 2.2, r: 4.2, flat: 0.5, flow: [0.2, -0.6, -0.8] },
    { az: -95, el: 10, len: 3.4, r: 3.6, flat: 0.5, flow: [-0.05, -1.4, -0.3] },
    { az: 95, el: 10, len: 3.4, r: 3.6, flat: 0.5, flow: [0.05, -1.4, -0.3] },
    { az: -140, el: 18, len: 3, r: 4.2, flat: 0.5, flow: [0, -1.2, -0.5] },
    { az: 140, el: 18, len: 3, r: 4.2, flat: 0.5, flow: [0, -1.2, -0.5] },
    { az: 180, el: 26, len: 3, r: 4.4, flat: 0.5, flow: [0, -1.2, -0.5] },
  ], [
    // the fringe parted on his left: short over the left brow, the long lock swept right
    { x: 3.8, tipY: c + 9.8, lean: 0.7, r: 1.6 },
  ], { tufts: 0, hairline: c + s.head.h - 1.2, nape: c + 1, slope: 0.5 });
  // the long lock from the part, across the forehead and down over the right eye to the cheek
  const lk = smoothPath([[2, c + 12.2, front - 1.6], [-1.2, c + 11.4, front + 0.4], [-3.4, c + 8.6, front + 1.1], [-3.8, c + 5.4, front + 1.2], [-3.4, c + 1.8, front + 0.6]], 4);
  b.add('head', tube(lk, lk.map((_, i) => 1.5 - i * 0.04)), 'hair', { thr: 0.3 });
  // a strand down in front of each shoulder, from behind the ear to the collarbone
  for (const k of [1, -1]) {
    const st = smoothPath([[k * 5.4, c + 8, front - 5.6], [k * 6.4, c + 3, front - 5.2], [k * 6.8, c - 2.5, front - 4.4], [k * 6.6, c - 7, front - 3.4]], 4);
    b.add('head', tube(st, st.map((_, i) => 1.6 - i * 0.05)), 'hair', { thr: 0.3 });
  }
  // keep the eyes clear (the lock over the right eye stays)
  b.carve('head', aabb([0.6, c + 5, front], [4.8, c + 10, front + 6]));
  b.carve('head', aabb([-4.8, c + 5, front], [-0.6, c + 10, front - 0.2 + 1]));

  // ---- the long fall down the back: a thick, slightly curved sheet from the nape to the waist
  const back = L.headC[2] - s.head.d / 2;
  const yTop = c + 6, yBot = s.waistY - 3;
  const zc = (y: number) => {
    // behind the skull, then lying on the haori's back
    const t = Math.max(0, Math.min(1, (yTop - y) / (yTop - yBot)));
    return back - 0.6 - Math.sin(Math.min(1, t * 2.4) * Math.PI * 0.5) * 2.4 + t * 0.6;
  };
  const sheet = fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (yTop - y) / (yTop - yBot)));
    const w = 6.2 - t * 1.6 + Math.sin(t * 3.1) * 0.6;
    const bot = yBot + Math.abs(Math.sin(x * 0.85)) * 2.2;
    return Math.max(Math.abs(x) - w, Math.abs(z - zc(y)) - (1.9 - t * 0.5), y - yTop, bot - y);
  }, [-9, yBot - 1, back - 10], [9, yTop + 1, back + 3]);
  const p1: V3 = [0, c + 4, back - 1], p2: V3 = [0, 66, zc(66)], p3: V3 = [0, 59, zc(59)];
  const bones: [string, string, V3, number, number][] = [['hair1', 'head', p1, p2[1] - 0.5, 200], ['hair2', 'hair1', p2, p3[1] - 0.5, p2[1] + 0.5], ['hair3', 'hair2', p3, -100, p3[1] + 0.5]];
  for (const [name, parent, pivot, y0, y1] of bones) {
    b.bone(name, parent, pivot);
    b.add(name, intersect(sheet, aabb([-20, y0, -30], [20, y1, 10])), 'hair', { thr: 0.25 });
  }
  // strands: shallow grooves running down the sheet
  b.paint(['hair1', 'hair2', 'hair3'], fn((x) => Math.abs(((x + 30) % 2.6) - 1.3) - 0.3, [-9, yBot - 3, back - 12], [9, yTop + 2, back + 3]), 'hair', { shade: 3, where: b.isMat('hair') });
  const tip: V3 = [0, yBot, zc(yBot)];
  const springs: SpringDef[] = [
    { bone: 'hair1', tail: [(p2[0] - p1[0]) / R, (p2[1] - p1[1]) / R, (p2[2] - p1[2]) / R], stiffness: 40, damping: 5, gravity: 11, limit: 40, radius: 0.07 },
    { bone: 'hair2', tail: [(p3[0] - p2[0]) / R, (p3[1] - p2[1]) / R, (p3[2] - p2[2]) / R], stiffness: 30, damping: 4.5, gravity: 12, limit: 50, radius: 0.07 },
    { bone: 'hair3', tail: [(tip[0] - p3[0]) / R, (tip[1] - p3[1]) / R, (tip[2] - p3[2]) / R], stiffness: 24, damping: 4, gravity: 13, limit: 60, radius: 0.06 },
  ];
  const colliders: ColliderDef[] = [
    { bone: 'chest', offset: [0, 0.08, -0.02], radius: 0.18 },
    { bone: 'spine', offset: [0, 0.02, -0.01], radius: 0.15 },
  ];
  return { springs, colliders };
}

// ---------------------------------------------------------------------------------------------- haori

/** The long-sleeved haori: a shell over the kosode open down the front, 十三 in a rhombus on the back. */
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
  // 十三 in a rhombus, drawn as seen from behind (viewer's left = the character's left = +X)
  const W = 15, H = 19, mx = (W - 1) / 2, my = (H - 1) / 2;
  const rows: string[] = [];
  for (let r = 0; r < H; r++) {
    let row = '';
    for (let ci = 0; ci < W; ci++) {
      const e = Math.abs(ci - mx) / (mx + 0.5) + Math.abs(r - my) / (my + 0.5);
      const ring = e > 0.9 && e <= 1.02;
      const ju = (r === 5 && ci >= 4 && ci <= 10) || (ci === 7 && r >= 3 && r <= 8);
      const san = ((r === 10 || r === 12) && ci >= 6 && ci <= 8) || (r === 14 && ci >= 5 && ci <= 9);
      row += ring || ju || san ? 'X' : '.';
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
  const yHem = 13;
  const coat = coatSkirt(b, L, { mat: 'haori', lining: 'haoriIn', yTop: s.waistY - 2, yHem, r0: 9.8, r1: 13.4, openFront: 16, res: UKITAKE_RES });
  // the hem: a band of black lozenges a couple of voxels above the edge
  const panels = ['F.L', 'S.L', 'B.L', 'B.R', 'S.R', 'F.R'].map((n) => `coat.${n}.2`);
  const yc = yHem + 4.2;
  b.paint(panels, fn((x, y, z) => {
    const u = Math.atan2(x, z + 0.6) * Math.hypot(x, z + 0.6);
    const m = ((u % 5.2) + 5.2) % 5.2 - 2.6;
    return Math.abs(m) * 0.62 + Math.abs(y - yc) * 0.5 - 1;
  }, [-20, yHem, -20], [20, yHem + 8, 20]), 'kanji', { where: b.isMat('haori') });
  return coat;
}

// ---------------------------------------------------------------------------------------------- props

function hilt(b: ModelBuilder, guardZ: number, shift = 0): void {
  b.mat('wrap', ['#8A2A30', '#6B1A1F', '#521317'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#E8E2D2']);
  b.mat('bronze', ['#C99A55', '#A67D3D', '#82602C', '#5E4420'], { base: 1, rough: 0.35, metal: 0.75, shadeK: 0.8 });
  // the rectangular guard
  b.add('root', box([0, 0, guardZ], [2.2, 2.7, 0.5], { round: 0.35 }), 'bronze');
  b.add('root', box([0, 0, -1 + shift], [1.05, 1.2, 5.2], { round: 0.5 }), 'wrap');
  b.paint('root', fn((_x, y, z) => Math.abs(((Math.abs(y) + z) % 2.6 + 2.6) % 2.6 - 1.3) - 0.42, [-2, -2, -6.5 + shift], [2, 2, 4 + shift]), 'ray', { where: b.isMat('wrap') });
  b.add('root', box([0, 0, -6.4 + shift], [1.2, 1.35, 0.55], { round: 0.35 }), 'bronze');
}

/** The sealed katana: a slight curve, the rectangular bronze guard, the dark-red hilt. Origin at the grip. */
function buildKatana(): VoxelModel {
  const b = new ModelBuilder('ukitake-katana', 48);
  b.mat('steel', ['#EEF2F6', '#D7DDE2', '#A6ADB6'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#F3F3F0'], { rough: 0.12, metal: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  const z0 = 5.6, zTip = 38.6, zEnd = zTip - 3.4;
  const curve = (z: number) => ((z - z0) / (zTip - z0)) ** 2 * 1.5;
  b.add('root', fn((x, y, z) => {
    if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
    const c = curve(z);
    return Math.max(Math.abs(x) - 0.5, y - (0.85 + c), -1.05 + c + Math.max(0, z - zEnd) * 0.55 - y, z0 - z, z - zTip);
  }, [-2, -3, z0 - 1], [2, 5, zTip + 1]), 'steel', { thr: 0.3 });
  b.paint('root', fn((_x, y, z) => y - (-0.6 + curve(z) + Math.max(0, z - zEnd) * 0.55), [-2, -3, 0], [2, 5, zTip + 1]), 'edge');
  hilt(b, 4.7);
  b.add('root', box([0, -0.05, 5.4], [0.85, 1.25, 0.5]), 'bronze');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** The black lacquered sheath with bronze fittings (with the hilt standing out of it, or empty). */
function buildSheath(withSword: boolean): VoxelModel {
  const b = new ModelBuilder(withSword ? 'ukitake-sheath' : 'ukitake-sheath-empty', 48);
  b.mat('lacquer', ['#3A2C30', '#2A1F24', '#1E1619', '#141418'], { base: 1, rough: 0.28, shadeK: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  const Lz = 35;
  const curve = (z: number) => (z / Lz) ** 2 * 1.5;
  b.add('root', fn((x, y, z) => {
    const c = curve(Math.max(0, z));
    return Math.max(Math.hypot(x / 1.0, (y - c) / 1.6) - 1, -z, z - Lz);
  }, [-2, -3, -1], [2, 5, Lz + 1]), 'lacquer');
  // with the sword home, its hilt stands out of the mouth
  if (withSword) hilt(b, -0.9, -5.6);
  else b.mat('bronze', ['#C99A55', '#A67D3D', '#82602C'], { base: 1, rough: 0.35, metal: 0.75 });
  b.add('root', box([0, 0, 0.4], [1.3, 1.9, 0.6], { round: 0.3 }), 'bronze');
  b.add('root', box([0, curve(Lz - 0.3), Lz - 0.3], [1.15, 1.75, 0.6], { round: 0.4 }), 'bronze');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * One blade of Sōgyo no Kotowari: thinner and straighter than the sealed sword, the guard crept a hand's
 * breadth up the blade, and from halfway along a second, inward-edged blade running back toward the hilt
 * on the spine side (the fish fin); a bronze ring on the pommel for the rope. Origin at the grip, +Z,
 * edge −Y.
 */
function buildSogyo(): VoxelModel {
  const b = new ModelBuilder('sogyo', 48);
  b.mat('steel', ['#EEF2F5', '#D3D9DE', '#A9B0B8'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#F3F3F0'], { rough: 0.12, metal: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  const z0 = 4.4, zTip = 37.6, zEnd = zTip - 3.6;
  // the main blade, straight, a little narrower than a katana
  b.add('root', fn((x, y, z) => {
    if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
    return Math.max(Math.abs(x) - 0.45, y - 0.7, -0.85 + Math.max(0, z - zEnd) * 0.45 - y, z0 - z, z - zTip);
  }, [-2, -3, z0 - 1], [2, 3, zTip + 1]), 'steel', { thr: 0.3 });
  b.paint('root', fn((_x, y, z) => y - (-0.5 + Math.max(0, z - zEnd) * 0.45), [-2, -3, 0], [2, 3, zTip + 1]), 'edge');
  // the fin: a bridge out to the spine side at mid-blade, then a blade running back toward the hilt
  const zm = 22.5, zf = 12.5;
  b.add('root', box([0, 1.6, zm], [0.8, 1.2, 0.9]), 'steel');
  b.add('root', fn((x, y, z) => {
    if (z < zf - 0.5 || z > zm + 1) return 1;
    // its edge faces the main blade (−Y), its back the outside; the end runs out to a point
    const taper = Math.max(0, (zf + 3.5 - z)) * 0.35;
    return Math.max(Math.abs(x) - 0.42, y - (3.3 - taper * 0.4), 2.1 + taper * 0.6 - y, zf - z, z - (zm + 0.8));
  }, [-2, 0, zf - 1], [2, 5, zm + 2]), 'steel', { thr: 0.3 });
  b.paint('root', fn((_x, y, z) => (z > zm - 0.6 ? 1 : y - 2.45), [-2, 0, zf - 1], [2, 5, zm + 1]), 'edge', { where: b.isMat('steel') });
  // the guard, crept up the blade; the hilt; the pommel ring
  hilt(b, 9);
  b.add('root', box([0, -0.05, 5], [0.8, 1.15, 0.45]), 'bronze');
  b.add('root', torus([0, 0, -7.4], 1.1, 0.6, [0, 0, 90]), 'bronze', { thr: 0.2 });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}
