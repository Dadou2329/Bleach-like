// Ichigo Kurosaki — Substitute Shinigami. Palette and construction from docs/roster/A1-ichigo.md
// (colours ×, sizes ×1.5 from the 32/m dossier to 48/m) and the voxel-art skill (characters.md).
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, box, capsule, cylinder, fn, intersect, prism, sphere, subtract, torus, type V3 } from '../models/sdf';
import {
  SPEC_ADULT_MALE, faceLegend, feet, hakama, hands, head, humanoidSkeleton, kosodeSleeves, kosodeTorso, obi,
  shihakushoSprings, spikeHair, type Bang, type Spike, type Landmarks,
} from './humanoid';
import type { SpringDef, ColliderDef } from '../anim/springs';

export type IchigoForm = 'shikai' | 'bankai';

function palette(b: ModelBuilder): void {
  b.mat('skin', ['#F7D9C4', '#E9BBA0', '#C08A74', '#8E5F50'], { base: 1, rough: 0.7, dither: 0.08 });
  b.mat('hair', ['#FFC867', '#FFAD4C', '#F7962F', '#E8792A', '#C2591B', '#8F3E13'], { base: 2, rough: 0.65, shadeK: 0.85 });
  b.mat('brow', ['#C8661F']);
  b.mat('lid', ['#1B120C']);
  b.mat('sclera', ['#EFECE6'], { rough: 0.4 });
  b.mat('iris', ['#7A4A2C'], { rough: 0.3 });
  b.mat('irisD', ['#3E2414'], { rough: 0.3 });
  b.mat('hi', ['#F0ECE4'], { rough: 0.2 });
  b.mat('mouth', ['#A9705F']);
  b.mat('black', ['#4A4956', '#3A3944', '#24232B', '#1A1A20', '#141418'], { base: 2, rough: 0.92, shadeK: 1, dither: 0.04 });
  b.mat('collar', ['#F3F1EC', '#E6E3DD', '#B9B5AF'], { base: 0, rough: 0.85, dither: 0.04 });
  b.mat('obi', ['#F1EEE8', '#E2DFD8', '#B8B4AC'], { base: 0, rough: 0.85, dither: 0.04 });
  b.mat('tabi', ['#F3F2EE', '#E4E2DD', '#C9C6BF'], { base: 0, rough: 0.85 });
  b.mat('straw', ['#CDB683', '#B59C6A', '#8A6A3E'], { base: 1, rough: 0.95 });
  b.mat('cord', ['#8A6A3E', '#5E4526'], { base: 0 });
  b.mat('red', ['#C9403F', '#A3242B', '#6A1419'], { base: 1, rough: 0.6 });
  b.mat('seam', ['#3E0C10']);
  // Bankai coat: blue-black, crimson lining
  b.mat('coat', ['#46454F', '#34333B', '#1D1C22', '#16151A', '#121115'], { base: 2, rough: 0.8, shadeK: 1, dither: 0.04 });
  b.mat('lining', ['#C23A42', '#9E1F27', '#6E141B'], { base: 1, rough: 0.7 });
}

const CROWN: V3 = [0, 0.32, -0.5];
const HAIR: Spike[] = [
  // crown: chunky spikes up and back
  { az: 0, el: 70, len: 5, r: 4.2, flow: CROWN },
  { az: -42, el: 60, len: 5, r: 4, flow: CROWN },
  { az: 40, el: 62, len: 5.5, r: 4, flow: CROWN },
  { az: -95, el: 52, len: 4.5, r: 3.8, flow: [0, 0.2, -0.45] },
  { az: 92, el: 54, len: 5, r: 3.8, flow: [0, 0.2, -0.45] },
  { az: -140, el: 50, len: 5, r: 4, flow: [0, 0.1, -0.5] },
  { az: 138, el: 52, len: 5, r: 4, flow: [0, 0.1, -0.5] },
  { az: 180, el: 60, len: 5.5, r: 4.2, flow: [0, 0.15, -0.55] },
  // front: spikes rising up over the forehead (break the front silhouette)
  { az: -40, el: 44, len: 4, r: 3.2, flow: [-0.15, 0.9, 0] },
  { az: 38, el: 46, len: 4, r: 3.2, flow: [0.15, 0.9, 0] },
  // bangs: locks sweeping forward from the front-top then curving down over the forehead
  { az: -30, el: 50, len: 6, r: 2.8, flow: [-0.1, -0.45, 0.35], bend: [-0.12, -1.2, -0.45] },
  { az: -9, el: 54, len: 8, r: 3, flow: [0, -0.45, 0.35], bend: [0, -1.3, -0.5] },
  { az: 13, el: 52, len: 6.5, r: 2.9, flow: [0.05, -0.45, 0.35], bend: [0.06, -1.2, -0.45] },
  { az: 35, el: 48, len: 5.5, r: 2.7, flow: [0.12, -0.45, 0.3], bend: [0.12, -1.15, -0.4] },
  // sides: out and back over the ears
  { az: -74, el: 24, len: 4, r: 3.4, flow: [0, 0.05, -0.45] },
  { az: 74, el: 26, len: 4, r: 3.4, flow: [0, 0.05, -0.45] },
  { az: -104, el: 12, len: 3.5, r: 3.2, flow: [0, -0.35, -0.35] },
  { az: 104, el: 12, len: 3.5, r: 3.2, flow: [0, -0.35, -0.35] },
  // back / nape
  { az: -152, el: 16, len: 4, r: 3.6, flow: [0, -0.35, -0.35] },
  { az: 152, el: 16, len: 4, r: 3.6, flow: [0, -0.35, -0.35] },
  { az: 180, el: 26, len: 4.5, r: 3.8, flow: [0, -0.3, -0.45] },
  { az: -166, el: -6, len: 3.5, r: 3.2, flow: [0, -0.85, -0.3] },
  { az: 166, el: -6, len: 3.5, r: 3.2, flow: [0, -0.85, -0.3] },
];
const BANGS: Bang[] = [
  { x: -4.2, tipY: 79.8, lean: -1, r: 2.4 },
  { x: -1.6, tipY: 78.8, lean: -0.3, r: 2.4 },
  { x: 0.4, tipY: 76.6, lean: -0.2, r: 2.5 },
  { x: 3.2, tipY: 79.4, lean: 0.9, r: 2.5 },
];

/** T2 scowl (characters.md §2.2), rows 9 → 0 of the 12-row adult male head. */
const FACE = [
  '. . . . . . . . . .',
  '. b B . . . . B b .',
  '. L L B s s B L L .',
  '. W * I . . * I W .',
  '. W i i . . i i W .',
  '. . . . . . . . . .',
  '. . . . . s . . . .',
  '. . . . . . . . . .',
  '. . . . m m . . . .',
  '. . . . . . . . . .',
];

/** Red kite-link strap (Shikai v1): right shoulder → left hip, around the back. */
function kiteStrap(b: ModelBuilder): void {
  const A: V3 = [-5, 70.5, 0]; // over the right trapezius
  const B: V3 = [9.5, 47.5, 0]; // left hip
  const ab = [B[0] - A[0], B[1] - A[1]];
  const abl = Math.hypot(ab[0], ab[1]);
  const t = [ab[0] / abl, ab[1] / abl];
  const n = [-t[1], t[0]]; // in-plane normal (x, y)
  const half = 2.3;
  const link = 6.2;
  // kite link, flat top and bottom: narrow neck → widest at 40% → tapering to a flat foot
  const kite = (u: number) => (u < 0.12 ? 0 : u < 0.22 ? 0.5 : u < 0.42 ? 0.5 + ((u - 0.22) / 0.2) * 0.5 : u < 0.9 ? 1 - ((u - 0.42) / 0.48) * 0.5 : 0);
  const set = (bone: string, x: number, y: number, z: number, mat: string, shade: number) => b.grid(bone).set(x, y, z, b.val(mat, shade));
  b.surfaceVoxels(['chest', 'spine', 'hips'], [-12, 44, -9], [12, 74, 9], (bone, x, y, z, nx, ny, nz) => {
    const px = x + 0.5 - A[0], py = y + 0.5 - A[1];
    const w = px * n[0] + py * n[1];
    if (Math.abs(w) > half) return;
    const s = (px * t[0] + py * t[1]) * (z >= 0 ? 1 : -1) + 60;
    const u = (s % link) / link;
    const wn = Math.abs(w) / half;
    const ox = x + nx, oy = y + ny, oz = z + nz;
    const k = kite(u);
    if (k > 0 && wn <= k) {
      // highlight on the upper face and the side toward the key light, shade at the foot
      const shade = u < 0.34 || (w > 0 && wn > k - 0.3 && u < 0.6) ? 0 : u > 0.74 ? 2 : 1;
      set(bone, x, y, z, 'seam', 0);
      set(bone, ox, oy, oz, 'red', shade); // raised 1 voxel
    } else if (wn < 0.3) {
      set(bone, x, y, z, 'seam', 0); // connector ring between links
    }
  });
}

export interface CharacterAsset {
  model: VoxelModel;
  springs: SpringDef[];
  colliders: ColliderDef[];
  warnings: string[];
}

const assetCache = new Map<string, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

/** Cached builds (form swaps must not re-run the DSL mid-fight). */
export function ichigoAsset(form: IchigoForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildIchigo(form)));
  return a;
}

export function ichigoSword(form: IchigoForm): VoxelModel {
  let m = propCache.get(form);
  if (!m) propCache.set(form, (m = form === 'bankai' ? buildTensaZangetsu() : buildZangetsuShikai()));
  return m;
}

export function buildIchigo(form: IchigoForm = 'shikai'): CharacterAsset {
  const b = new ModelBuilder(`ichigo-${form}`, 48);
  palette(b);
  const s = SPEC_ADULT_MALE;
  const L: Landmarks = humanoidSkeleton(b, s, { sleeves: true, hakama: true });
  // sockets: sword grips through the fists (grip axis = +Z), sheath on the back
  b.socket('grip.R', 'fist.R', [-L.wrist[0] + 0.1, L.wrist[1] - 4.3, L.wrist[2] + 0.4]);
  b.socket('grip.L', 'fist.L', [L.wrist[0] - 0.1, L.wrist[1] - 4.3, L.wrist[2] + 0.4]);
  b.socket('back', 'chest', [1, 62, -7.5], [0, 0, 0]);
  b.socket('head.top', 'head', [0, 86, 0]);
  b.socket('chest.front', 'chest', [0, 61, 7]);

  const hd = head(b, L, 'skin');
  spikeHair(b, L, 'hair', HAIR, [], { tufts: 46 });
  // keep the eyes clear: no hair in front of the eye rows (the face plate itself is at z < front)
  b.carve('head', aabb([-5, hd.chin + 4, hd.front], [-1, hd.chin + 7, hd.front + 6]));
  b.carve('head', aabb([1, hd.chin + 4, hd.front], [5, hd.chin + 7, hd.front + 6]));
  b.stamp('head', hd.x0, hd.chin + 9, FACE, faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), hd.front - 1);
  // nose: a 1-voxel bump
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);

  hands(b, L, 'skin');
  feet(b, L, 'tabi', 'straw', 'cord');
  if (form === 'shikai') {
    const o = { black: 'black', collar: 'collar', skin: 'skin', obi: 'obi' };
    kosodeTorso(b, L, o);
    kosodeSleeves(b, L, o);
    obi(b, L, o);
    hakama(b, L, o);
    kiteStrap(b);
    b.autoShade();
    b.lint();
    const { springs, colliders } = shihakushoSprings();
    return { model: b.build(), springs, colliders, warnings: b.warnings };
  }
  // ---- Bankai: Tensa Zangetsu's coat
  const o = { black: 'coat', collar: 'lining', skin: 'skin', obi: 'coat', hemR: 6.4 };
  kosodeTorso(b, L, o);
  bankaiSleeves(b, L);
  hakama(b, L, { ...o, black: 'black' });
  const tails = coatTails(b, L);
  b.autoShade();
  b.lint();
  const base = shihakushoSprings();
  return { model: b.build(), springs: [...base.springs.filter((sp) => !sp.bone.startsWith('sleeve')), ...tails.springs], colliders: [...base.colliders, ...tails.colliders], warnings: b.warnings };
}

/** Bankai coat sleeves: long, fitted at the shoulder, flaring to a ragged cuff with crimson inside. */
function bankaiSleeves(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', cylinder([sx + 0.3, ey - 1.5, sz - 0.3], [sx + 0.1, sy + 0.5, sz - 0.1], 3.6, 3.1, 1.3), 'coat', { mirror: true });
  b.add('upperarm.L', sphere([sx, sy - 0.5, sz], 2.9), 'coat', { mirror: true });
  b.add('forearm.L', cylinder([sx + 0.5, wy - 1.5, sz - 0.6], [sx + 0.4, ey + 1.5, sz - 0.3], 4.6, 3.6, 1), 'coat', { mirror: true });
  b.add('forearm.L', sphere([sx + 0.3, ey, sz - 0.2], 3.4), 'coat', { mirror: true });
  // ragged cuff: notches cut from the hem
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    b.carve('forearm.L', box([sx + 0.5 + Math.sin(a) * 4.4, wy - 1.8, sz - 0.6 + Math.cos(a) * 4.4], [0.9, 1.4, 0.9], { rot: [0, (a * 180) / Math.PI, 25] }), { mirror: true });
  }
  b.carve('forearm.L', cylinder([sx + 0.5, wy - 2.5, sz - 0.6], [sx + 0.5, wy + 2.2, sz - 0.6], 3.4, 3.2), { mirror: true });
  b.paint('forearm.L', cylinder([sx + 0.5, wy - 2.5, sz - 0.6], [sx + 0.5, wy + 3.2, sz - 0.6], 4.1, 3.9), 'lining', { mirror: true });
  b.add('forearm.L', capsule([sx, wy + 6, sz], [sx, wy - 0.5, sz], 1.9), 'skin', { mirror: true, only: 'empty' });
}

/**
 * The coat below the waist: six flared panels on two-bone spring chains, flame-like tattered hems,
 * crimson lining on the inside.
 */
function coatTails(b: ModelBuilder, L: Landmarks): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const yTop = s.waistY - 2, ySplit = L.knee[1] + 4, yHem = 4;
  const r0 = 9.2, r1 = 15.5;
  const cz = -0.6;
  const R = (y: number) => r0 + (r1 - r0) * Math.max(0, Math.min(1, (yTop - y) / (yTop - yHem)));
  const panels: [string, number, number][] = [
    ['F.L', 6, 58], ['S.L', 62, 118], ['B.L', 122, 176], ['B.R', -176, -122], ['S.R', -118, -62], ['F.R', -58, -6],
  ];
  const springs: SpringDef[] = [];
  const rng = (k: number) => Math.abs(Math.sin(k * 91.7 + 3.1) * 4375.85) % 1;
  panels.forEach(([name, a0d, a1d], pi) => {
    const a0 = (a0d * Math.PI) / 180, a1 = (a1d * Math.PI) / 180;
    const am = (a0 + a1) / 2;
    const top = `coat.${name}`, low = `coat.${name}.2`;
    const pTop: V3 = [Math.sin(am) * (r0 - 1), yTop, cz + Math.cos(am) * (r0 - 1)];
    const pLow: V3 = [Math.sin(am) * R(ySplit), ySplit, cz + Math.cos(am) * R(ySplit)];
    b.bone(top, 'hips', pTop);
    b.bone(low, top, pLow);
    // flame tatters: 2-3 points per panel
    const nPts = 2 + (pi % 2);
    const hem = (th: number) => {
      const u = (th - a0) / (a1 - a0);
      const saw = Math.abs(((u * nPts) % 1) - 0.5) * 2; // 1 at the notches, 0 at the points
      return yHem + 1 + saw * (6 + rng(pi * 7 + Math.floor(u * nPts)) * 4);
    };
    const shellSdf = (y0: number, y1: number) =>
      fn(
        (x, y, z) => {
          const dz = z - cz;
          const rho = Math.hypot(x, dz);
          const th = Math.atan2(x, dz);
          const dr = Math.abs(rho - R(y)) - 0.85;
          // angular extent (handle the ±180° wrap for the back panels)
          let da = 0;
          const lo = Math.min(a0, a1), hi = Math.max(a0, a1);
          if (th < lo) da = (lo - th) * rho;
          else if (th > hi) da = (th - hi) * rho;
          const dyTop = y - y1, dyBot = Math.max(y0, hem(th)) - y;
          return Math.max(dr, da, dyTop, dyBot);
        },
        [-r1 - 2, y0 - 1, cz - r1 - 2],
        [r1 + 2, y1 + 1, cz + r1 + 2],
      );
    b.add(top, shellSdf(ySplit - 1, yTop), 'coat');
    b.add(low, shellSdf(yHem - 2, ySplit + 1), 'coat');
    // lining: inner half of the shell
    const lining = fn((x, y, z) => Math.hypot(x, z - cz) - (R(y) - 0.15), [-r1 - 2, yHem - 3, cz - r1 - 2], [r1 + 2, yTop + 1, cz + r1 + 2]);
    b.paint([top, low], lining, 'lining', { where: b.isMat('coat') });
    // a fold down the middle of each panel
    const fx = Math.sin(am), fz = Math.cos(am);
    b.paint([top, low], capsule([fx * (R(yTop) + 0.6), yTop - 2, cz + fz * (R(yTop) + 0.6)], [fx * (R(yHem + 8) + 0.6), yHem + 8, cz + fz * (R(yHem + 8) + 0.6)], 0.7), 'coat', { shade: 3 });
    const tailTop = [(pLow[0] - pTop[0]) / 48, (pLow[1] - pTop[1]) / 48, (pLow[2] - pTop[2]) / 48] as [number, number, number];
    const hemP: V3 = [Math.sin(am) * R(yHem + 4), yHem + 4, cz + Math.cos(am) * R(yHem + 4)];
    const tailLow = [(hemP[0] - pLow[0]) / 48, (hemP[1] - pLow[1]) / 48, (hemP[2] - pLow[2]) / 48] as [number, number, number];
    springs.push({ bone: top, tail: tailTop, stiffness: 95, damping: 6, gravity: 9, limit: 45, radius: 0.1 });
    springs.push({ bone: low, tail: tailLow, stiffness: 50, damping: 4.5, gravity: 13, limit: 65, radius: 0.08 });
  });
  const colliders: ColliderDef[] = [
    { bone: 'thigh.L', offset: [0, -0.18, 0.02], radius: 0.16 },
    { bone: 'thigh.R', offset: [0, -0.18, 0.02], radius: 0.16 },
    { bone: 'shin.L', offset: [0, -0.12, 0], radius: 0.12 },
    { bone: 'shin.R', offset: [0, -0.12, 0], radius: 0.12 },
  ];
  return { springs, colliders };
}

/**
 * Tensa Zangetsu (Bankai v1): black daitō, manji (卍) guard of four bent prongs, black wrapped handle
 * with rayskin diamonds, short chain with a broken last link. Same local frame as Zangetsu.
 */
export function buildTensaZangetsu(): VoxelModel {
  const b = new ModelBuilder('tensa-zangetsu', 48);
  b.mat('blade', ['#3B4250', '#1E2026', '#121215', '#0E0E11'], { base: 2, rough: 0.25, metal: 0.7, shadeK: 0.7 });
  b.mat('edge', ['#5C6678'], { rough: 0.15, metal: 0.8 });
  b.mat('guard', ['#2A2A30', '#16161A', '#101013'], { base: 1, rough: 0.4, metal: 0.6 });
  b.mat('wrap', ['#2E2E33', '#232327', '#18181B'], { base: 1, rough: 0.9 });
  b.mat('ray', ['#4A4A52']);
  b.mat('chain', ['#4A4C53', '#2E2F34', '#1C1D21'], { base: 1, rough: 0.35, metal: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  // blade: 36 long, 3 wide, 1 thick, clipped point
  const z0 = 7.5, zEnd = 41, zTip = 44.5;
  const outline = prism([[z0, -1.6], [zEnd, -1.6], [zTip, 1.4], [z0, 1.4]], [0, 0, 0], [0, 0, 1], [0, 1, 0], 0.55);
  b.add('root', outline, 'blade');
  b.paint('root', fn((x, y, z) => y - (-1.2 + Math.max(0, z - zEnd) * 0.85), [-2, -3, 0], [2, 3, 50]), 'edge');
  // habaki collar
  b.add('root', box([0, -0.1, 7.2], [1, 1.9, 0.7], { round: 0.3 }), 'guard');
  // manji guard in the XY plane: four prongs, each out then bent 90°
  for (let k = 0; k < 4; k++) {
    const r = (k * Math.PI) / 2;
    const rot = (p: [number, number]): V3 => [p[0] * Math.cos(r) - p[1] * Math.sin(r), p[0] * Math.sin(r) + p[1] * Math.cos(r), 6.2];
    b.add('root', capsule(rot([0, 0.8]), rot([0, 4.2]), 0.75), 'guard', { thr: 0.2 });
    b.add('root', capsule(rot([0, 4.2]), rot([-3.2, 4.2]), 0.75), 'guard', { thr: 0.2 });
  }
  b.add('root', cylinder([0, 0, 5.6], [0, 0, 6.9], 1.6), 'guard');
  // handle with diamond wrap
  b.add('root', box([0, 0, -1.2], [1.25, 1.35, 6.6], { round: 0.5 }), 'wrap');
  b.paint('root', fn((x, y, z) => Math.abs(((Math.abs(y) + z) % 3 + 3) % 3 - 1.5) - 0.55, [-2, -2, -8], [2, 2, 5.4]), 'ray', { where: b.isMat('wrap') });
  b.add('root', box([0, 0, -8.1], [1.4, 1.5, 0.6], { round: 0.4 }), 'guard'); // pommel cap
  // chain: alternating links hanging from the pommel; the last one broken
  let z = -9.6;
  for (let i = 0; i < 4; i++) {
    const vertical = i % 2 === 0;
    const ring = torus([0, -0.3 * i, z], 1.3, 0.42, vertical ? [0, 90, 0] : [90, 0, 0]);
    if (i === 3) b.add('root', subtract(ring, box([0, -0.3 * i - 1, z - 1.2], [1.2, 1.2, 0.8])), 'chain', { thr: 0.25 });
    else b.add('root', ring, 'chain', { thr: 0.25 });
    z -= 2.1;
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * Zangetsu, Shikai v1: khyber-knife cleaver as tall as Ichigo (≈1.7 m), no guard, cloth-wrapped tang.
 * Local frame: origin at the grip centre, blade along +Z, edge toward −Y, flat faces ±X.
 */
export function buildZangetsuShikai(): VoxelModel {
  const b = new ModelBuilder('zangetsu-shikai', 48);
  b.mat('spine', ['#45454D', '#2B2B31', '#17171B'], { base: 1, rough: 0.35, metal: 0.6, shadeK: 0.6 });
  b.mat('steel', ['#F5F6F8', '#DADDE2', '#A3A8B1'], { base: 1, rough: 0.22, metal: 0.9, shadeK: 0.6 });
  b.mat('glint', ['#EEF0F3'], { rough: 0.15, metal: 0.8 });
  b.mat('cloth', ['#F2EFE9', '#E8E4DC', '#C9CDD3', '#A9B3BE'], { base: 1, rough: 0.9 });
  b.bone('root', null, [0, 0, 0]);
  const z0 = 5.5, zEdgeEnd = 66, zTip = 75.5;
  const yS = 5, yE = -5.5;
  // outline in the (z, y) plane, thickness tapering from the spine (3) to the edge (1)
  const outline = prism([[z0, yE], [zEdgeEnd, yE], [zTip, yS], [z0, yS]], [0, 0, 0], [0, 0, 1], [0, 1, 0], 1.6);
  const bevel = fn((x, y) => Math.abs(x) - (0.55 + Math.max(0, Math.min(1, (y - yE) / ((yS - yE) * 0.55))) * 1.0), [-2, -7, 0], [2, 7, 80]);
  const blade = intersect(outline, bevel);
  b.add('root', blade, 'spine');
  // silver bevel on the edge half, glint along the very edge
  b.paint('root', fn((x, y, z) => y - (yE + 0.5 + (yS - yE) * 0.45 + Math.max(0, z - zEdgeEnd) * 0.9), [-3, -7, 0], [3, 7, 80]), 'steel');
  b.paint('root', fn((x, y, z) => y - (yE + 1.05 + Math.max(0, z - zEdgeEnd) * ((yS - yE) / (zTip - zEdgeEnd))), [-3, -7, 0], [3, 7, 80]), 'glint');
  // tang wrapped in cloth, through the fist
  b.add('root', box([0, -0.2, -0.5], [1.4, 1.6, 6.5], { round: 0.6 }), 'cloth');
  b.add('root', box([0, -0.2, 4.6], [1.6, 2.2, 1.2], { round: 0.5 }), 'cloth');
  // diagonal wrap bands
  b.paint('root', fn((x, y, z) => Math.cos((z + y * 0.8) * 1.4), [-2, -3, -8], [2, 3, 6.5]), 'cloth', { shade: 2, where: b.isMat('cloth') });
  // butt knot with a short tail (the long streamer is a ribbon effect)
  b.add('root', box([0, -0.6, -7.2], [1.7, 1.9, 0.9], { round: 0.6 }), 'cloth', { shade: 2 });
  b.add('root', capsule([0, -1.2, -7.6], [0, -5, -9.5], 1.1, 0.7), 'cloth', { thr: 0.25 });
  b.autoShade({ up: 0.4, open: 2.2, front: 0 });
  b.lint();
  return b.build();
}

/** Sanity numbers for tests/QA. */
export function ichigoStats(a: CharacterAsset): { voxels: number; bones: number } {
  let voxels = 0;
  a.model.grids.forEach((g) => (voxels += g.count()));
  return { voxels, bones: a.model.bones.length };
}
