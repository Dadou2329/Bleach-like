// Retsu Unohana — Captain of the 4th Division, the first Kenpachi (docs/roster/B1-captains-1.md §5).
// Brief: 159 cm → 76 vox; slender and graceful, a soft face. Silhouette keys: the single thick braid that
// starts at the throat and hangs down the front to the waist (it hides her scar), the long-sleeved white
// haori with 四 in a rhombus on the back, a wide white obi instead of the usual sash, and Minazuki — a long
// nodachi with an oval guard and a red hilt — hung at her left hip from a rope strap over the right shoulder.
// Black hair with a dark-blue cast, centre-parted bangs framing the face, blue eyes half-lidded over a calm
// smile. Yachiru (the braid undone): the hair loose down her back and over the shoulders, the scar between
// the collarbones bared, a dead-eyed stare and a grin. Props: the sealed nodachi, its sheath, the Bankai
// blade (dripping dark red) and her hidden daggers. Her Shikai creature lives in unohanaMinazuki.ts.
// (verify) the haori lining colour; the exact shape of the scar; how the rope strap is tied.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, prism, smoothPath, sphere, subtract, tube, type Sdf, type V3 } from '../models/sdf';
import { addBands, coatSkirt, faceLegend, feet, hakama, hands, head, humanoidSkeleton, kosodeSleeves, kosodeTorso, shihakushoSprings, spikeHair, type HumanoidSpec, type Landmarks } from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

/** 76 voxels = 1.59 m */
export const UNOHANA_RES = 76 / 1.59;
export type UnohanaForm = 'retsu' | 'yachiru';

/** Slender: narrow shoulders, a small waist, long legs under the hakama. */
const SPEC: HumanoidSpec = {
  H: 76,
  chinY: 64,
  head: { w: 10, d: 11, h: 12 },
  neckR: 2.1,
  shoulder: [7.4, 59, -0.5],
  upperArm: 12.3,
  foreArm: 11.1,
  hand: 7.6,
  armR: 1.9,
  hipsY: 39,
  hip: [4.0, 36.4, 0],
  kneeY: 20.6,
  ankleY: 4.0,
  chest: [6.3, 4.2],
  waist: [5.0, 3.6],
  hips: [6.3, 4.4],
  chestY: 53,
  waistY: 45.5,
  foot: { len: 10, w: 4.2, heel: 2.5 },
};

function palette(b: ModelBuilder): void {
  b.mat('skin', ['#F8EADF', '#F2DCCD', '#E6CAB8', '#D7B8A5', '#BA988A'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#434A60', '#30364A', '#242838', '#1B1E2A', '#141418'], { base: 2, rough: 0.45, shadeK: 0.85, dither: 0.03 });
  b.mat('brow', ['#1D2130']);
  b.mat('lid', ['#1A1A26']);
  b.mat('sclera', ['#F2F0EC']);
  b.mat('iris', ['#3E5FA0']);
  b.mat('irisD', ['#22345E']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#B87A74']);
  b.mat('teeth', ['#F0EEE8']);
  b.mat('scar', ['#D8A898', '#C99484']);
  b.mat('black', ['#383A3F', '#26272D', '#1C1D22', '#141418'], { base: 1, rough: 0.85, shadeK: 0.9 });
  b.mat('collar', ['#F1F0EC', '#E0DED9', '#C8C6C1'], { base: 0, rough: 0.8 });
  b.mat('obi', ['#F0EEE8', '#E2DFD8', '#CDC9C0', '#B1ACA2'], { base: 1, rough: 0.8 });
  b.mat('haori', ['#F3F2EE', '#EAE9E4', '#DAD9D4', '#C2C3C7', '#A4A7AE'], { base: 1, rough: 0.8, shadeK: 0.9 });
  b.mat('haoriIn', ['#D9DCE0', '#C2C6CC', '#A8ADB5', '#8D929B'], { base: 1, rough: 0.85 });
  b.mat('kanji', ['#141418'], { rough: 0.9 });
  b.mat('rope', ['#E4DDD0', '#D8CFC0', '#BDB2A0', '#9C907E'], { base: 1, rough: 0.9 });
  b.mat('tie', ['#F0EEE8', '#D8D4CC']);
  b.mat('tabi', ['#F3F2EE', '#DEDDDA', '#C2C1BD'], { base: 0, rough: 0.8 });
  b.mat('sole', ['#C9B9A0', '#B0A888', '#8C8268'], { base: 1, rough: 0.9 });
  b.mat('cord', ['#5B4632']);
}

/** Retsu: blue eyes half-lidded under soft brows, a calm small smile. Rows 9 → 0. */
const FACE_RETSU = [
  '. . . . . . . . . .',
  '. . b B . . B b . .',
  '. . . . . . . . . .',
  '. L L L . . L L L .',
  '. . I i . . i I . .',
  '. . . . . . . . . .',
  '. . . . . s . . . .',
  '. . . s . . s . . .',
  '. . . . m m . . . .',
  '. . . . . . . . . .',
];
/** Yachiru: the eyes wide and dead (small pupils), the brows drawn down, a grin with teeth. */
const FACE_YACHIRU = [
  '. . . . . . . . . .',
  '. b B . . . . B b .',
  '. . . B . . B . . .',
  '. L L L . . L L L .',
  '. W I i . . i I W .',
  '. . I I . . I I . .',
  '. . . . . s . . . .',
  '. m . . . . . . m .',
  '. . m T T T T m . .',
  '. . . . . . . . . .',
];

const assetCache = new Map<UnohanaForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function unohanaAsset(form: UnohanaForm = 'retsu'): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildUnohana(form)));
  return a;
}

/** 'nodachi' (sealed Minazuki), 'sheath' / 'sheath-empty', 'bankai' (the blood-wet blade), 'dagger' */
export type UnohanaProp = 'nodachi' | 'sheath' | 'sheath-empty' | 'bankai' | 'dagger';

export function unohanaProp(kind: UnohanaProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'sheath' || kind === 'sheath-empty' ? buildSheath(kind === 'sheath') : kind === 'dagger' ? buildDagger() : buildNodachi(kind === 'bankai');
    propCache.set(kind, m);
  }
  return m;
}

/** blade points (prop frame, m) */
export const NODACHI_BASE_Z = 6 / 48;
export const NODACHI_TIP_Z = 44 / 48;
export const DAGGER_TIP_Z = 9.5 / 48;

export function buildUnohana(form: UnohanaForm = 'retsu'): CharacterAsset {
  const b = new ModelBuilder(`unohana-${form}`, UNOHANA_RES);
  palette(b);
  const s = SPEC;
  const yachiru = form === 'yachiru';
  const L = humanoidSkeleton(b, s, { sleeves: true, hakama: true });
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 3.8, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 3.8, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.5, wy - 4.4, wz + 0.9]);
  b.socket('palm.L', 'palm.L', [wx - 0.5, wy - 4.4, wz + 0.9]);
  b.socket('finger.R', 'palm.R', [-wx + 0.2, wy - s.hand - 0.4, wz + 0.9]);
  b.socket('finger.L', 'palm.L', [wx - 0.2, wy - s.hand - 0.4, wz + 0.9]);
  // Minazuki hangs at her left hip outside the haori, the hilt forward, from the rope strap
  b.socket('hip.L', 'hips', [9.6, s.waistY - 4.4, 3.2], [-30, 180, -6]);
  b.socket('back', 'chest', [0, s.chestY + 1, -7]);
  b.socket('chest.front', 'chest', [0, s.chestY, 6.5]);
  b.socket('throat', 'chest', [0, s.chinY - 4, 2.6]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('mouth', 'head', [0, s.chinY + 1.5, hd.front + 0.5]);
  const legend = faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth', teeth: 'teeth' });
  b.stamp('head', hd.x0, hd.chin + 9, yachiru ? FACE_YACHIRU : FACE_RETSU, legend, hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  // a soft jaw: the cheeks a shade warmer under the eyes
  for (const x of [-4, 3]) b.voxel('head', x, hd.chin + 3, hd.front - 1, 'skin', 0);
  hands(b, L, 'skin', 1.1);
  feet(b, L, 'tabi', 'sole', 'cord');
  const o = { black: 'black', collar: 'collar', skin: 'skin', obi: 'obi', crossY: s.chestY - (yachiru ? 3 : 1), hemR: 7.6, hakamaHem: 3 };
  kosodeTorso(b, L, o);
  // a slender bust under the kosode
  const [, cz] = s.chest;
  b.add('chest', blend(0.9, ellipsoid([2.4, s.chestY - 1.6, cz + 0.5], [2.3, 2.1, 1.5]), ellipsoid([-2.4, s.chestY - 1.6, cz + 0.5], [2.3, 2.1, 1.5])), 'black', { only: 'empty' });
  if (yachiru) scar(b, L);
  wideObi(b, L);
  hakama(b, L, o);
  // the haori's long sleeves are the outermost, the lining showing at the mouths
  kosodeSleeves(b, L, { ...o, black: 'haori', collar: 'haori', obi: 'haori', bag: 4.6 });
  const [sx, , sz] = s.shoulder;
  b.paint('forearm.L', cylinder([sx + 0.8, wy - 1.2, sz - 0.6], [sx + 0.8, wy + 2.4, sz - 0.6], 3.6), 'haoriIn', { mirror: true, where: b.isMat('haori') });
  const coat = haori(b, L);
  rope(b, L);
  const hair = yachiru ? looseHair(b, L, hd) : braidedHair(b, L, hd);
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

// ---------------------------------------------------------------------------------------------- garments

/** The wide white obi: a tall band round the waist, a flat knot at the front-left with two short ends. */
function wideObi(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const y = s.waistY - 2.2;
  const [wx, wz] = s.waist;
  const band = subtract(
    box([0, y, -0.2], [wx + 2.5, 3.3, wz + 2.5], { round: 2.4 }),
    box([0, y, -0.2], [wx + 1, 5, wz + 1], { round: 2 }),
  );
  b.add('spine', intersect(band, aabb([-30, y - 0.5, -30], [30, 50, 30])), 'obi');
  b.add('hips', intersect(band, aabb([-30, -10, -30], [30, y - 0.5, 30])), 'obi');
  // edges and a middle fold: three bands of shade so the width reads
  for (const dy of [-3, 0.2, 3]) b.paint(['spine', 'hips'], box([0, y + dy, -0.2], [wx + 3, 0.45, wz + 3], { round: 2.4 }), 'obi', { shade: dy === 0.2 ? 2 : 3, where: b.isMat('obi') });
  // the knot, flat against the front at her left, and two ends hanging from it
  const kx = 3.4, kz = wz + 2.7;
  b.add('spine', ellipsoid([kx, y + 0.6, kz], [2.1, 1.7, 1.1]), 'obi');
  b.add('hips', capsule([kx - 0.4, y - 1, kz + 0.2], [kx - 1.4, y - 7.5, kz + 1.3], 1.2, 0.9), 'obi', { thr: 0.25 });
  b.add('hips', capsule([kx + 0.6, y - 1, kz + 0.1], [kx + 2.2, y - 6, kz + 1.0], 1.15, 0.85), 'obi', { thr: 0.25 });
  b.paint(['spine', 'hips'], sphere([kx, y + 0.6, kz + 1], 0.9), 'obi', { shade: 3, where: b.isMat('obi') });
}

/** The rope strap: over the right shoulder, across the chest and the back, down to the sheath at the left hip. */
function rope(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, sy] = s.shoulder;
  const hipP: V3 = [7.9, s.waistY - 2.4, 1.4];
  const top: V3 = [-sx + 2.4, sy + 2.6, -0.6];
  const frontPts = smoothPath([top, [-sx + 1.2, sy + 1.2, 4.6], [-2.6, s.chestY + 1, 7.0], [3.6, s.waistY + 3.4, 6.8], [7.6, s.waistY + 0.2, 5.4], hipP], 4);
  const backPts = smoothPath([top, [-sx + 1.0, sy + 0.6, -5.2], [-sx + 0.4, s.chestY + 1, -6.4], [-sx + 0.6, s.waistY + 1.5, -5.6]], 4);
  const ropeSdf = (pts: V3[]) => tube(pts, pts.map(() => 0.85));
  for (const pts of [frontPts, backPts]) addBands(b, ropeSdf(pts), 'rope', [['chest', s.chestY - 7, 100], ['spine', s.waistY - 1.5, s.chestY - 7], ['hips', -10, s.waistY - 1.5]], { thr: 0.2 });
  // the knot where both ends are tied off against the obi
  b.add('hips', sphere(hipP, 1.4), 'rope');
  // the twist of the rope: diagonal grooves
  b.paint(['chest', 'spine', 'hips'], fn((x, y, z) => Math.abs(((x + y + z * 0.5 + 60) % 1.6) - 0.8) - 0.22, [-14, s.waistY - 8, -12], [14, sy + 5, 12]), 'rope', { shade: 3, where: b.isMat('rope') });
}

/** Yachiru's scar between the collarbones: a vertical stab mark with a short crossing (verify). */
function scar(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const y0 = s.chinY - 7.5;
  b.paint('chest', capsule([0, y0 + 2.2, 4], [0, y0 - 2.6, 4.6], 0.75), 'scar', { where: b.isMat('skin') });
  b.paint('chest', capsule([-1.3, y0 + 0.2, 4.3], [1.3, y0 - 0.3, 4.3], 0.55), 'scar', { shade: 1, where: b.isMat('skin') });
}

/** The long-sleeved haori: a shell over the kosode open down the front, 四 in a rhombus on the back. */
function haori(b: ModelBuilder, L: Landmarks): { springs: SpringDef[]; colliders: ColliderDef[] } {
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
  // the haori stops above the obi in front and covers it at the back and the sides
  for (const [bone, y0, y1] of [['spine', s.waistY - 3, s.waistY + 5.5], ['chest', s.waistY + 5.5, 100]] as [string, number, number][]) b.add(bone, intersect(shellSdf, aabb([-30, y0, -30], [30, y1, 30])), 'haori');
  b.paint(['chest', 'spine'], intersect(offset(open, 0.8), front), 'haoriIn', { where: b.isMat('haori') });
  // 四 in a rhombus, drawn as seen from behind (viewer's left = the character's left = +X)
  const W = 13, H = 15, mx = (W - 1) / 2, my = (H - 1) / 2;
  const SHI = [
    'XXXXXXX',
    'X.X.X.X',
    'X.X.X.X',
    'X.X..XX',
    'XX....X',
    'X.....X',
    'XXXXXXX',
  ];
  const rows: string[] = [];
  for (let r = 0; r < H; r++) {
    let row = '';
    for (let ci = 0; ci < W; ci++) {
      const e = Math.abs(ci - mx) / (mx + 0.5) + Math.abs(r - my) / (my + 0.5);
      const ring = e > 0.88 && e <= 1.02;
      // 四 seen from behind is mirrored on the cloth: index the glyph from the viewer's side
      const gr = r - 4, gc = ci - 3;
      const k = gr >= 0 && gr < 7 && gc >= 0 && gc < 7 && SHI[gr][gc] === 'X';
      row += ring || k ? 'X' : '.';
    }
    rows.push(row);
  }
  const top = s.chestY + 5.5;
  rows.forEach((row, r) => {
    for (let ci = 0; ci < row.length; ci++) {
      if (row[ci] !== 'X') continue;
      const x = mx - ci, y = top - r;
      // the outermost voxel at the back, whichever band of the haori it is on
      let best: { bone: string; z: number } | null = null;
      for (const bone of ['chest', 'spine']) {
        const g = b.grid(bone);
        for (let z = -16; z < 2; z++)
          if (g.get(x, y, z) !== 0) {
            if (!best || z < best.z) best = { bone, z };
            break;
          }
      }
      if (best) b.voxel(best.bone, x, y, best.z, 'kanji', 0);
    }
  });
  return coatSkirt(b, L, { mat: 'haori', lining: 'haoriIn', yTop: s.waistY - 2, yHem: 11, r0: 8.6, r1: 12.2, openFront: 40, overlap: 5, res: UNOHANA_RES });
}

// ---------------------------------------------------------------------------------------------- hair

const HAIR_CAP = (L: Landmarks): V3 => [L.spec.head.w / 2 + 1.3, L.spec.head.h / 2 + 1.1, L.spec.head.d / 2 + 1.2];

/** The cap, the centre-parted bangs and the long locks framing the face down to the jaw. */
function hairCap(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }, back: 'gathered' | 'loose'): void {
  const s = L.spec;
  const c = hd.chin;
  const front = hd.front;
  const fall = back === 'loose' ? -1.4 : -1.0;
  spikeHair(b, L, 'hair', [
    // smooth hair drawn from the crown down the sides and the back
    { az: 95, el: 12, len: 2.6, r: 3.6, flat: 0.5, flow: [0.05, fall, -0.25] },
    { az: -95, el: 12, len: 2.6, r: 3.6, flat: 0.5, flow: [-0.05, fall, -0.25] },
    { az: 140, el: 20, len: 2.2, r: 4.2, flat: 0.5, flow: [0, -1.1, -0.4] },
    { az: -140, el: 20, len: 2.2, r: 4.2, flat: 0.5, flow: [0, -1.1, -0.4] },
    { az: 180, el: 28, len: 2.2, r: 4.4, flat: 0.5, flow: [0, -1.1, -0.4] },
  ], [], { capR: HAIR_CAP(L), tufts: 0, hairline: c + 10.6, nape: c + 1, slope: 0.6 });
  // the fringe parted in the middle: a lock either side, from the parting down over the forehead's corner
  for (const k of [1, -1]) {
    const fr = smoothPath([[k * 0.7, c + 12.4, front - 2.4], [k * 2.4, c + 11.8, front - 0.4], [k * 4.0, c + 10.2, front + 0.4], [k * 4.9, c + 8.2, front - 0.2]], 4);
    b.add('head', tube(fr, fr.map((_, i) => 1.7 - i * 0.04)), 'hair', { thr: 0.3 });
  }
  // the long locks either side of the face, from the temple to the jaw (a slight curve in toward the chin)
  for (const k of [1, -1]) {
    const lk = smoothPath([[k * 4.6, c + 11, front - 1.2], [k * 5.6, c + 7, front - 0.4], [k * 5.5, c + 3, front - 0.6], [k * 4.6, c - 1.2, front - 1.3]], 4);
    b.add('head', tube(lk, lk.map((_, i) => 1.6 - i * 0.05)), 'hair', { thr: 0.3 });
  }
  // keep the face plate clear between the locks
  b.carve('head', aabb([-3.6, c + 3.5, front - 0.2], [3.6, c + 8.6, front + 6]));
}

/** Retsu: the hair gathered from behind the ears round both sides of the neck into the braid at the throat. */
function braidedHair(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const c = hd.chin;
  const R = UNOHANA_RES;
  hairCap(b, L, hd, 'gathered');
  // two thick sections from behind the ears, down and forward along the neck to the throat
  for (const k of [1, -1]) {
    const sec = smoothPath([[k * 5.2, c + 6, -2.8], [k * 5.0, c + 1.5, -1.4], [k * 3.6, c - 2.2, 1.0], [k * 1.4, c - 3.6, 2.6]], 4);
    b.add('head', tube(sec, sec.map((_, i) => 1.9 - i * 0.03)), 'hair', { thr: 0.3 });
  }
  // the braid: lobes crossing left and right down a path over the chest to the waist, a white tie and a tuft
  const pivot: V3 = [0, c - 3.2, 2.8];
  const path = smoothPath([pivot, [0, c - 6.5, 5.8], [0.2, s.chestY - 1, 7.2], [0.4, s.waistY + 4, 6.6], [0.4, s.waistY - 2.5, 7.4]], 6);
  const split = s.chestY - 2.5;
  b.bone('braid', 'chest', pivot);
  const mid = path.reduce((a, p) => (Math.abs(p[1] - split) < Math.abs(a[1] - split) ? p : a), path[0]);
  b.bone('braid.2', 'braid', mid);
  const lobes: Sdf[] = [];
  const n = 13;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const p = at(path, t);
    const w = 2.5 - t * 0.7;
    const side = i % 2 === 0 ? 1 : -1;
    // each lobe leans across the braid, alternating, overlapping its neighbours
    lobes.push(ellipsoid([p[0] + side * 0.55, p[1], p[2]], [w * 0.75, 1.9, 1.5], [0, 0, side * 32]));
  }
  const braid = blend(0.5, ...lobes);
  const top = intersect(braid, halfSpace([0, mid[1], 0], [0, -1, 0]));
  const low = intersect(braid, halfSpace([0, mid[1], 0], [0, 1, 0]));
  b.add('braid', top, 'hair', { thr: 0.3 });
  b.add('braid.2', low, 'hair', { thr: 0.3 });
  // the grooves between the lobes
  for (let i = 0; i < n; i++) {
    const t = (i + 1) / n;
    const p = at(path, t);
    const side = i % 2 === 0 ? 1 : -1;
    b.paint(p[1] > mid[1] ? 'braid' : 'braid.2', capsule([p[0] - 1.8, p[1] + side * 0.5, p[2] + 1.2], [p[0] + 1.8, p[1] - side * 0.5, p[2] + 1.2], 0.45), 'hair', { shade: 4, where: b.isMat('hair') });
  }
  const end = path[path.length - 1];
  b.add('braid.2', cylinder([end[0], end[1] + 0.8, end[2]], [end[0], end[1] - 0.8, end[2]], 1.5), 'tie');
  b.add('braid.2', ellipsoid([end[0], end[1] - 2.8, end[2] + 0.1], [1.6, 2.6, 1.2]), 'hair', { thr: 0.3 });
  const tip: V3 = [end[0], end[1] - 4.8, end[2]];
  const springs: SpringDef[] = [
    { bone: 'braid', tail: [(mid[0] - pivot[0]) / R, (mid[1] - pivot[1]) / R, (mid[2] - pivot[2]) / R], stiffness: 120, damping: 8, gravity: 8, limit: 25, radius: 0.04 },
    { bone: 'braid.2', tail: [(tip[0] - mid[0]) / R, (tip[1] - mid[1]) / R, (tip[2] - mid[2]) / R], stiffness: 70, damping: 6, gravity: 10, limit: 35, radius: 0.035 },
  ];
  const colliders: ColliderDef[] = [
    { bone: 'chest', offset: [0, 0.02, 0.03], radius: 0.13 },
    { bone: 'spine', offset: [0, 0, 0.02], radius: 0.12 },
  ];
  return { springs, colliders };
}

/** a point along a polyline at parameter t ∈ [0, 1] (by index) */
function at(path: V3[], t: number): V3 {
  const f = Math.max(0, Math.min(1, t)) * (path.length - 1);
  const i = Math.min(path.length - 2, Math.floor(f));
  const u = f - i;
  const a = path[i], c = path[i + 1];
  return [a[0] + (c[0] - a[0]) * u, a[1] + (c[1] - a[1]) * u, a[2] + (c[2] - a[2]) * u];
}

/**
 * Yachiru: the braid undone. The hair falls straight down her back to the waist on three spring bones (a
 * ragged edge), and a long lock hangs in front of each shoulder.
 */
function looseHair(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const c = hd.chin;
  const front = hd.front;
  const R = UNOHANA_RES;
  hairCap(b, L, hd, 'loose');
  // a long lock in front of each shoulder, from behind the ear down over the collarbone to the chest
  for (const k of [1, -1]) {
    const st = smoothPath([[k * 5.3, c + 6, front - 5.4], [k * 6.2, c + 1, front - 4.6], [k * 6.4, c - 4, front - 3.2], [k * 5.8, c - 10, front - 1.6]], 4);
    b.add('head', tube(st, st.map((_, i) => 1.8 - i * 0.05)), 'hair', { thr: 0.3 });
  }
  const back = L.headC[2] - s.head.d / 2;
  const yTop = c + 6, yBot = s.waistY - 2;
  const zc = (y: number) => {
    const t = Math.max(0, Math.min(1, (yTop - y) / (yTop - yBot)));
    return back - 0.6 - Math.sin(Math.min(1, t * 2.4) * Math.PI * 0.5) * 2.0 + t * 0.4;
  };
  const sheet = fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (yTop - y) / (yTop - yBot)));
    const w = 6.0 - t * 1.3 + Math.sin(t * 3.1) * 0.6;
    const bot = yBot + Math.abs(Math.sin(x * 0.9)) * 2.4;
    return Math.max(Math.abs(x) - w, Math.abs(z - zc(y)) - (1.8 - t * 0.5), y - yTop, bot - y);
  }, [-9, yBot - 1, back - 10], [9, yTop + 1, back + 3]);
  const p1: V3 = [0, c + 4, back - 1], p2: V3 = [0, s.chestY + 3, zc(s.chestY + 3)], p3: V3 = [0, s.chestY - 4, zc(s.chestY - 4)];
  const bones: [string, string, V3, number, number][] = [['hair1', 'head', p1, p2[1] - 0.5, 200], ['hair2', 'hair1', p2, p3[1] - 0.5, p2[1] + 0.5], ['hair3', 'hair2', p3, -100, p3[1] + 0.5]];
  for (const [name, parent, pivot, y0, y1] of bones) {
    b.bone(name, parent, pivot);
    b.add(name, intersect(sheet, aabb([-20, y0, -30], [20, y1, 10])), 'hair', { thr: 0.25 });
  }
  b.paint(['hair1', 'hair2', 'hair3'], fn((x) => Math.abs(((x + 30) % 2.4) - 1.2) - 0.3, [-9, yBot - 3, back - 12], [9, yTop + 2, back + 3]), 'hair', { shade: 4, where: b.isMat('hair') });
  const tip: V3 = [0, yBot, zc(yBot)];
  const springs: SpringDef[] = [
    { bone: 'hair1', tail: [(p2[0] - p1[0]) / R, (p2[1] - p1[1]) / R, (p2[2] - p1[2]) / R], stiffness: 40, damping: 5, gravity: 11, limit: 40, radius: 0.07 },
    { bone: 'hair2', tail: [(p3[0] - p2[0]) / R, (p3[1] - p2[1]) / R, (p3[2] - p2[2]) / R], stiffness: 30, damping: 4.5, gravity: 12, limit: 50, radius: 0.07 },
    { bone: 'hair3', tail: [(tip[0] - p3[0]) / R, (tip[1] - p3[1]) / R, (tip[2] - p3[2]) / R], stiffness: 24, damping: 4, gravity: 13, limit: 60, radius: 0.06 },
  ];
  const colliders: ColliderDef[] = [
    { bone: 'chest', offset: [0, 0.07, -0.02], radius: 0.16 },
    { bone: 'spine', offset: [0, 0.02, -0.01], radius: 0.14 },
  ];
  return { springs, colliders };
}

// ---------------------------------------------------------------------------------------------- props

function nodachiMats(b: ModelBuilder, bankai: boolean): void {
  if (bankai) {
    b.mat('steel', ['#8E1420', '#6E0E19', '#560A12', '#3E060C'], { base: 1, rough: 0.1, metal: 0.35, shadeK: 0.7 });
    b.mat('edge', ['#B0222E'], { rough: 0.08, metal: 0.3 });
    b.mat('drip', ['#5C0A12', '#420810'], { rough: 0.08 });
  } else {
    b.mat('steel', ['#EEF2F6', '#D7DDE2', '#A6ADB6'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
    b.mat('edge', ['#F3F3F0'], { rough: 0.12, metal: 0.8 });
  }
  b.mat('wrap', ['#B83440', '#A3202B', '#82161F', '#5E0F16'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#E8E2D2', '#CFC8B8']);
  b.mat('bronze', ['#A88A55', '#8C6E3F', '#6E552E', '#4E3B1F'], { base: 1, rough: 0.4, metal: 0.7, shadeK: 0.8 });
}

/** the long red hilt with its diamond wrap, the oval guard, the pommel cap */
function hilt(b: ModelBuilder, guardZ: number, shift = 0): void {
  // the oval tsuba
  b.add('root', fn((x, y, z) => Math.max(Math.hypot(x / 2.3, y / 2.9) - 1, Math.abs(z - guardZ) - 0.5), [-3, -4, guardZ - 1], [3, 4, guardZ + 1]), 'bronze');
  b.paint('root', fn((x, y, z) => Math.max(Math.abs(Math.hypot(x / 2.3, y / 2.9) - 0.82) - 0.1, Math.abs(z - guardZ) - 0.6), [-3, -4, guardZ - 1], [3, 4, guardZ + 1]), 'bronze', { shade: 3 });
  // the long grip: red cord over pale ray skin in diamonds
  b.add('root', box([0, 0, -3.4 + shift], [1.05, 1.2, 7.4], { round: 0.5 }), 'wrap');
  b.paint('root', fn((_x, y, z) => Math.abs(((Math.abs(y) + z) % 2.6 + 2.6) % 2.6 - 1.3) - 0.42, [-2, -2, -11.5 + shift], [2, 2, 4.5 + shift]), 'ray', { where: b.isMat('wrap') });
  b.add('root', box([0, 0, -11 + shift], [1.2, 1.35, 0.6], { round: 0.35 }), 'bronze');
  b.add('root', box([0, -0.05, guardZ + 0.7], [0.85, 1.2, 0.45]), 'bronze');
}

/**
 * Minazuki, sealed: longer than a katana, a nodachi's long blade with a slight curve, the oval guard and the
 * red hilt. Bankai: the same blade re-solidified out of the blood, dark red and dripping. Origin at the
 * grip, +Z along the blade, edge −Y.
 */
function buildNodachi(bankai: boolean): VoxelModel {
  const b = new ModelBuilder(bankai ? 'minazuki-bankai' : 'minazuki', 48);
  nodachiMats(b, bankai);
  b.bone('root', null, [0, 0, 0]);
  const z0 = 6, zTip = 44, zEnd = zTip - 3.6;
  const curve = (z: number) => ((z - z0) / (zTip - z0)) ** 2 * 1.8;
  b.add('root', fn((x, y, z) => {
    if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
    const c = curve(z);
    return Math.max(Math.abs(x) - 0.5, y - (0.9 + c), -1.1 + c + Math.max(0, z - zEnd) * 0.55 - y, z0 - z, z - zTip);
  }, [-2, -3, z0 - 1], [2, 5, zTip + 1]), 'steel', { thr: 0.3 });
  b.paint('root', fn((_x, y, z) => y - (-0.65 + curve(z) + Math.max(0, z - zEnd) * 0.55), [-2, -3, 0], [2, 5, zTip + 1]), 'edge');
  if (bankai) {
    // beads of the fluid on the edge, and runs of it down the flats
    for (const z of [13, 21, 30, 38]) {
      const c = curve(z);
      b.add('root', sphere([0, -1.0 + c, z], 0.65), 'drip', { thr: 0.2 });
    }
    b.paint('root', fn((x, y, z) => Math.abs(((z * 0.8 + y * 2.1) % 3.4 + 3.4) % 3.4 - 1.7) - 0.35, [-2, -3, z0], [2, 5, zTip]), 'drip', { where: b.isMat('steel') });
  }
  hilt(b, 5);
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** The dark lacquered sheath with two bronze mounts the rope is tied to (with the hilt standing out of it, or empty). */
function buildSheath(withSword: boolean): VoxelModel {
  const b = new ModelBuilder(withSword ? 'minazuki-sheath' : 'minazuki-sheath-empty', 48);
  b.mat('lacquer', ['#43362E', '#2B2420', '#211B18', '#161214'], { base: 1, rough: 0.3, shadeK: 0.8 });
  nodachiMats(b, false);
  b.mat('rope', ['#E4DDD0', '#D8CFC0', '#BDB2A0'], { base: 1, rough: 0.9 });
  b.bone('root', null, [0, 0, 0]);
  const Lz = 41;
  const curve = (z: number) => (z / Lz) ** 2 * 1.8;
  b.add('root', fn((x, y, z) => {
    const c = curve(Math.max(0, z));
    return Math.max(Math.hypot(x / 1.0, (y - c) / 1.65) - 1, -z, z - Lz);
  }, [-2, -3, -1], [2, 5, Lz + 1]), 'lacquer');
  if (withSword) hilt(b, -0.9, -5.9);
  // the mouth, the two mounts (with rope loops) and the chape
  b.add('root', box([0, 0, 0.4], [1.3, 1.95, 0.6], { round: 0.3 }), 'bronze');
  for (const z of [4.5, 10.5]) {
    const c = curve(z);
    b.add('root', box([0, c, z], [1.25, 1.9, 0.55], { round: 0.3 }), 'bronze');
    b.add('root', ellipsoid([0, c + 2.4, z], [0.8, 1.1, 0.8]), 'bronze');
    b.add('root', capsule([0, c + 3.2, z], [0, c + 4.4, z + 0.6], 0.55), 'rope', { thr: 0.2 });
  }
  b.add('root', box([0, curve(Lz - 0.4), Lz - 0.4], [1.15, 1.8, 0.7], { round: 0.45 }), 'bronze');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** A hidden dagger: a short straight double-edged blade, a black grip. Origin at the grip, +Z along the blade. */
function buildDagger(): VoxelModel {
  const b = new ModelBuilder('unohana-dagger', 48);
  b.mat('steel', ['#E4E8EC', '#C9CED4', '#A6ADB6'], { base: 1, rough: 0.2, metal: 0.9 });
  b.mat('grip', ['#34343A', '#26262C', '#1E1E22'], { base: 1, rough: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', fn((x, y, z) => Math.max(Math.abs(x) - 0.35, Math.abs(y) - (0.8 - Math.max(0, z - 6) * 0.22), 1.5 - z, z - 9.5), [-1, -2, 1], [1, 2, 10]), 'steel', { thr: 0.3 });
  b.add('root', box([0, 0, 1.1], [0.6, 1.3, 0.35]), 'steel');
  b.add('root', box([0, 0, -1.4], [0.6, 0.7, 2.2], { round: 0.3 }), 'grip');
  b.add('root', sphere([0, 0, -3.8], 0.75), 'steel');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}
