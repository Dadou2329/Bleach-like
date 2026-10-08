// Lost Agent Ichigo (docs/kits/ichigo.md §4 Lost Agent; dossier A1 §1 looks #10-#14, Weapons). Brief: 181 cm on the
// 84-vox skeleton (the Lost Agent body: the longer hair with sideburns). FB1 is the casual body (ichigoHuman 'casual')
// with the badge's black manji guard in the fist. FB2 (clad): a ragged shihakushō of black reiatsu over his clothes —
// white trims at the collar, the sleeve ends and the waist sash — tattered to the knees over the grey trousers, a black
// blade over the right forearm (the crimson streaks whipping round that arm are the kit's effect). FB3 (complete): a
// black bodysuit under bone-white segmented armour — rib plates either side of a raised spine line, a high collar
// meeting in a Y, shoulder caps, forearm guards, shin and boot plates — a white band across the nose, the hair spikier;
// the black machete with the badge for its guard, its white sheath on his back. Restored Shikai v2: the shihakushō with
// a thick red strap, black bands at the wrists and ankles, a black neck band with white ends, four lines down each
// sleeve; the cleaver with a silver hilt, a grey wrap, a short chain, the back of the tip curving in like a trench
// knife. Bankai v3: the open black coat over a white undershirt, held shut by three white X marks, long split
// coat-tails, black gloves with white X marks (and on the forearms); the long curved daitō with three teeth on its back
// near the point, a jagged guard, a long chain from the pommel looping back to the hand. Canon asymmetries (character's
// right = −X): the arm blade (FB2) on the right.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, intersect, prism, sphere, torus, type V3 } from '../models/sdf';
import { SPEC_ADULT_MALE, coatSkirt, feet, hakama, hands, humanoidSkeleton, kosodeSleeves, kosodeTorso, obi, shihakushoSprings, type Landmarks } from './humanoid';
import { humanHead, humanPalette, humanSockets, legs } from './ichigoHuman';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

export type FullbringForm = 'fb2' | 'fb3' | 'shikai2' | 'bankai3';
export const FB_RES = 84 / 1.81;

/** prop extents (m along +Z, the grip at the origin) */
export const MACHETE_BASE_Z = 5 / 48;
export const MACHETE_TIP_Z = 41 / 48;
export const V2_BASE_Z = 5.5 / 48;
export const V2_TIP_Z = 75.5 / 48;
export const V3_BASE_Z = 7 / 48;
export const V3_TIP_Z = 63 / 48;
/** the FB2 arm blade on the 'forearm.R' socket: it runs down the forearm (−Y) past the fist */
export const ARM_BLADE_BASE: V3 = [-2.8 / 48, -8 / 48, 1.6 / 48];
export const ARM_BLADE_TIP: V3 = [-2.8 / 48, -40 / 48, 1.2 / 48];
/** how the white sheath hangs on the 'back' socket (FB3) */
export const FB_SHEATH_ON_BACK = { pos: [0.1, 0.16, -0.05] as const, dir: [-0.55, -0.8, -0.12] as const };

function palette(b: ModelBuilder, form: FullbringForm): void {
  humanPalette(b, 'casual');
  if (form === 'fb2') {
    b.mat('clad', ['#3C3644', '#2C2732', '#211C26', '#18151C', '#141418'], { base: 2, rough: 0.85, shadeK: 1, dither: 0.04 });
    b.mat('trim', ['#F1EEE7', '#DCD8D0', '#B9B5AE'], { base: 0, rough: 0.8 });
  } else if (form === 'fb3') {
    b.mat('suit', ['#4A4A55', '#3A3A44', '#2C2C33', '#222228', '#18181D'], { base: 2, rough: 0.6, shadeK: 1, dither: 0.03 });
    b.mat('bone', ['#F3EEE5', '#E8E0D5', '#DDD5CB', '#C4BBAF', '#A69C8F'], { base: 1, rough: 0.45, shadeK: 0.9 });
    b.mat('line', ['#2C2C33']);
    b.mat('band', ['#E9E4DA', '#CFC8BC'], { base: 0, rough: 0.7 });
  } else if (form === 'shikai2') {
    b.mat('strap', ['#D4413F', '#B22A2E', '#7A181C'], { base: 1, rough: 0.6 });
    b.mat('wrap', ['#2A2A31', '#1C1C22', '#141418'], { base: 1, rough: 0.9 });
    b.mat('trim', ['#F1EEE7', '#D6D2CA'], { base: 0, rough: 0.8 });
  } else {
    b.mat('xmark', ['#F0F0EC', '#D6D6D2'], { base: 0, rough: 0.7 });
    b.mat('glove', ['#34343C', '#24242A', '#18181C'], { base: 1, rough: 0.55 });
  }
}

// ------------------------------------------------------------------------------------------------ FB2

/** FB2: the clad robe of black reiatsu, white-trimmed, ragged to the knees. */
function clad(b: ModelBuilder, L: Landmarks): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const o = { black: 'clad', collar: 'trim', skin: 'blazer', obi: 'trim' };
  kosodeTorso(b, L, o);
  kosodeSleeves(b, L, o);
  obi(b, L, o);
  legs(b, L);
  // the white trim round each sleeve's mouth (the forearm tube and the hanging bag at the same height)
  const [sx, , sz] = s.shoulder;
  const wy = L.wrist[1];
  b.paint(['forearm.L', 'sleeve.L'], aabb([sx - 9, wy - 0.2, sz - 14], [sx + 9, wy + 1.9, sz + 8]), 'trim', { where: b.isMat('clad'), mirror: true });
  const skirt = coatSkirt(b, L, { mat: 'clad', lining: 'clad', tatter: true, tatterDepth: 4, tatterTeeth: 1, openFront: 7, yTop: s.waistY - 3, yHem: L.knee[1] - 8, r0: 9.4, r1: 11.6, thick: 1.2, res: FB_RES });
  const base = shihakushoSprings();
  return { springs: [...base.springs.filter((sp) => sp.bone.startsWith('sleeve')), ...skirt.springs], colliders: [...base.colliders, ...skirt.colliders] };
}

// ------------------------------------------------------------------------------------------------ FB3

/** FB3: the black bodysuit, close as skin. */
function bodysuit(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const [hx, hy] = s.hip;
  const t = 0.5;
  const torso = blend(3.2,
    box([0, s.chestY - 0.5, -0.3], [cx + t, 6, cz + t], { round: 3.4 }),
    box([0, s.waistY, -0.2], [wx + t, 4.5, wz + t], { round: 3 }),
    box([0, s.hipsY + 0.5, -0.3], [s.hips[0] + t, 4.2, s.hips[1] + t], { round: 2.6 }),
    capsule([2.5, sy + 1.6, sz - 0.8], [sx - 1.5, sy - 0.2, sz], 2.9, 3),
    capsule([-2.5, sy + 1.6, sz - 0.8], [-sx + 1.5, sy - 0.2, sz], 2.9, 3),
    sphere([sx, sy - 0.5, sz], 3.2), sphere([-sx, sy - 0.5, sz], 3.2));
  b.add('hips', intersect(torso, aabb([-16, 30, -12], [16, s.hipsY + 2, 12])), 'suit');
  b.add('spine', intersect(torso, aabb([-16, s.hipsY + 2, -12], [16, s.waistY + 5, 12])), 'suit');
  b.add('chest', intersect(torso, aabb([-16, s.waistY + 5, -12], [16, s.chinY + 8, 12])), 'suit');
  b.add('neck', capsule([0, s.chinY - 5, L.headC[2] - 0.6], [0, s.chinY + 1, L.headC[2] - 0.6], L.spec.neckR + 0.3), 'suit');
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(1.4, sphere([sx, sy - 0.5, sz], 2.9), capsule([sx, sy - 1, sz], [sx, ey + 1, sz], 2.8, 2.4)), 'suit', { mirror: true });
  b.add('forearm.L', blend(1.2, sphere([sx, ey, sz], 2.4), capsule([sx, ey - 0.5, sz], [sx, wy + 0.6, sz], 2.4, 2)), 'suit', { mirror: true });
  b.add('thigh.L', blend(1.5, sphere([hx, hy, 0], 4.1), capsule([hx, hy, 0], [hx, L.knee[1], 0.2], 3.6, 3)), 'suit', { mirror: true });
  b.add('shin.L', blend(1.2, sphere([hx, L.knee[1], 0.2], 3), capsule([hx, L.knee[1], 0.2], [L.ankle[0], L.ankle[1] + 2.2, L.ankle[2] - 0.2], 2.9, 2.6)), 'suit', { mirror: true });
  // boots, plated over the toes
  const [ax, ay, az] = L.ankle;
  const f = s.foot;
  b.add('foot.L', capsule([ax, ay + 2.6, az - 0.5], [ax, ay - 0.5, az - 0.5], 2.6), 'suit', { mirror: true });
  b.add('foot.L', box([ax, 1.9, az + (f.len / 2 - f.heel)], [f.w / 2 + 0.3, 1.9, f.len / 2 + 0.4], { round: 1.4 }), 'suit', { mirror: true });
  b.add('foot.L', intersect(box([ax, 2.3, az + (f.len / 2 - f.heel) + 1.5], [f.w / 2 + 0.8, 2.2, f.len / 2 - 0.6], { round: 1.6 }), fn((_x, _y, z) => az + 1 - z, [ax - 6, -1, az - 8], [ax + 6, 7, az + 16])), 'bone', { mirror: true });
}

/** FB3: the bone-white armour plates. */
function armour(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }): void {
  const s = L.spec;
  const [cx, cz] = s.chest, [, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  // the ribs: four curved plates either side, sweeping out and down from the sternum
  for (const k of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const y = s.chestY + 3.6 - i * 2.7;
      b.add(i < 2 ? 'chest' : 'spine', tube3([[k * 1.6, y, cz + 1.4], [k * (cx * 0.55), y - 0.4, cz + 1.2], [k * (cx + 0.6), y - 1.6, cz - 1.6]], [0.85, 0.8, 0.6]), 'bone', { thr: 0.2 });
    }
  }
  // the raised spine line down the middle, dark seams either side of it
  b.add('chest', capsule([0, s.chestY + 4.6, cz + 1.3], [0, s.chestY - 4, cz + 1.3], 0.95), 'bone');
  b.add('spine', capsule([0, s.chestY - 4, wz + 1.6], [0, s.waistY - 0.5, wz + 1.6], 0.9), 'bone');
  b.paint(['chest', 'spine'], fn((x, _y, z) => Math.max(Math.abs(Math.abs(x) - 1.15) - 0.3, cz - 1 - z), [-3, s.waistY - 1, 0], [3, s.chestY + 5, 12]), 'line', { where: b.isMat('suit') });
  // the high collar, its two plates meeting in a Y at the throat
  b.add('chest', intersect(cylinder([0, s.chinY - 5.5, L.headC[2] - 0.6], [0, s.chinY - 1.2, L.headC[2] - 0.6], s.neckR + 2.2, s.neckR + 1.6, 0.6), fn((x, y, z) => -(Math.hypot(x, z - (L.headC[2] - 0.6)) - (s.neckR + 0.9)), [-8, s.chinY - 7, -8], [8, s.chinY, 8])), 'bone');
  b.paint('chest', fn((x, y, z) => {
    const yy = y - (s.chinY - 3.6);
    const arm = yy > 0 ? Math.abs(Math.abs(x) - yy * 0.9) : Math.abs(x);
    return Math.max(arm - 0.35, -(z - 2.5));
  }, [-6, s.chinY - 7, 0], [6, s.chinY, 10]), 'line', { where: b.isMat('bone') });
  // shoulder caps
  b.add('upperarm.L', intersect(ellipsoid([sx + 0.6, sy + 0.2, sz], [4, 3.2, 4.2]), fn((_x, y) => sy - 2.6 - y, [sx - 6, sy - 6, sz - 6], [sx + 6, sy + 6, sz + 6])), 'bone', { mirror: true });
  b.paint('upperarm.L', fn((_x, y) => Math.abs(y - (sy - 0.6)) - 0.3, [sx - 6, sy - 3, sz - 6], [sx + 6, sy + 4, sz + 6]), 'line', { where: b.isMat('bone'), mirror: true });
  // forearm guards (the outer half) and shin plates (the front half)
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('forearm.L', intersect(cylinder([sx, wy + 1.2, sz], [sx, ey - 1.2, sz], 3, 3.3, 0.6), fn((x) => sx - 0.4 - x, [sx - 6, wy - 2, sz - 6], [sx + 6, ey + 2, sz + 6])), 'bone', { mirror: true });
  const [hx] = s.hip;
  b.add('shin.L', intersect(cylinder([L.ankle[0], L.ankle[1] + 3, 0.2], [hx, L.knee[1] - 0.5, 0.4], 3.2, 3.6, 0.6), fn((_x, _y, z) => -0.4 - z, [hx - 7, L.ankle[1], -7], [hx + 7, L.knee[1] + 2, 7])), 'bone', { mirror: true });
  b.add('shin.L', ellipsoid([hx, L.knee[1] + 0.4, 2.6], [2.4, 2.2, 1.6]), 'bone', { mirror: true });
  // the band across the face over the nose bridge, just under the eyes, a dark seam down its middle
  b.add('head', intersect(
    ellipsoid([0, hd.chin + 4, L.headC[2] + 0.2], [s.head.w / 2 + 0.8, 1, hd.front - L.headC[2] + 0.6]),
    fn((_x, _y, z) => L.headC[2] - 1 - z, [-10, hd.chin + 2, -9], [10, hd.chin + 6, hd.front + 3]),
  ), 'band');
  b.paint('head', fn((x) => Math.abs(x - 0.5) - 0.4, [-2, hd.chin + 2, 0], [2, hd.chin + 6, hd.front + 3]), 'line', { where: b.isMat('band') });
}

/** a tube of capsules through points (a curved plate) */
function tube3(pts: V3[], r: number[]) {
  const parts = [];
  for (let i = 0; i < pts.length - 1; i++) parts.push(capsule(pts[i], pts[i + 1], r[i], r[i + 1]));
  return blend(0.6, ...parts);
}

// ------------------------------------------------------------------------------------------------ Shikai v2

/** Restored Shikai v2: the thick red strap, right shoulder to left hip and round the back, link seams across it. */
function thickStrap(b: ModelBuilder): void {
  const A: V3 = [-5.2, 70.5, 0];
  const B: V3 = [9.8, 47, 0];
  const ab = [B[0] - A[0], B[1] - A[1]];
  const abl = Math.hypot(ab[0], ab[1]);
  const t = [ab[0] / abl, ab[1] / abl];
  const n = [-t[1], t[0]];
  const half = 3.1;
  const set = (bone: string, x: number, y: number, z: number, shade: number) => b.grid(bone).set(x, y, z, b.val('strap', shade));
  b.surfaceVoxels(['chest', 'spine', 'hips'], [-12, 44, -9], [12, 74, 9], (bone, x, y, z, nx, ny, nz) => {
    const px = x + 0.5 - A[0], py = y + 0.5 - A[1];
    const w = px * n[0] + py * n[1];
    if (Math.abs(w) > half) return;
    const along = (px * t[0] + py * t[1]) * (z >= 0 ? 1 : -1) + 60;
    const seam = ((along % 6.5) + 6.5) % 6.5 < 0.9;
    set(bone, x + nx, y + ny, z + nz, seam ? 2 : w > 0.8 ? 0 : 1);
  });
}

/** Restored Shikai v2: the black neck band with its white ends, the wrist and ankle wraps, the lines down the sleeves. */
function restoredBands(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, , sz] = s.shoulder;
  const wy = L.wrist[1], ey = L.elbow[1];
  b.add('neck', cylinder([0, s.chinY - 4.4, L.headC[2] - 0.6], [0, s.chinY - 2.2, L.headC[2] - 0.6], s.neckR + 0.8), 'wrap');
  for (const k of [-1, 1]) b.add('chest', capsule([k * 1.4, s.chinY - 3.6, 3.4], [k * 2.2, s.chinY - 7.5, 4.6], 0.75, 0.6), 'trim', { thr: 0.2 });
  b.add('forearm.L', cylinder([sx + 0.5, wy - 2.8, sz - 0.6], [sx + 0.5, wy - 0.8, sz - 0.6], 4.9, 4.9, 0.6), 'wrap', { mirror: true });
  for (let i = 0; i < 4; i++) {
    const a = -0.9 + i * 0.6;
    b.paint('forearm.L', capsule([sx + 0.5 + Math.cos(a) * 5, ey - 2, sz - 0.6 + Math.sin(a) * 5], [sx + 0.5 + Math.cos(a) * 5.2, wy + 1, sz - 0.6 + Math.sin(a) * 5.2], 0.45), 'wrap', { mirror: true });
  }
  const [ax, ay, az] = L.ankle;
  b.add('foot.L', cylinder([ax, ay + 1.6, az - 0.5], [ax, ay + 3.4, az - 0.5], 2.9), 'wrap', { mirror: true });
}

// ------------------------------------------------------------------------------------------------ Bankai v3

/** Bankai v3: the coat's fitted sleeves, white X marks on the forearms. */
function v3Sleeves(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', cylinder([sx + 0.3, ey - 1.5, sz - 0.3], [sx + 0.1, sy + 0.5, sz - 0.1], 3.5, 3.1, 1.3), 'coat', { mirror: true });
  b.add('upperarm.L', sphere([sx, sy - 0.5, sz], 2.9), 'coat', { mirror: true });
  b.add('forearm.L', cylinder([sx + 0.4, wy - 0.5, sz - 0.4], [sx + 0.3, ey + 1.5, sz - 0.3], 3.4, 3.4, 1), 'coat', { mirror: true });
  b.add('forearm.L', sphere([sx + 0.3, ey, sz - 0.2], 3.3), 'coat', { mirror: true });
  b.add('forearm.L', capsule([sx, wy + 5, sz], [sx, wy - 0.5, sz], 1.9), 'skin', { mirror: true, only: 'empty' });
  // the X on the outside of each forearm
  const my = (ey + wy) / 2;
  b.paint('forearm.L', fn((_x, y, z) => {
    const u = y - my, v = z - sz;
    return Math.min(Math.abs(u - v), Math.abs(u + v)) - 0.5 + Math.max(0, Math.max(Math.abs(u), Math.abs(v)) - 2.4) * 3;
  }, [sx + 2, my - 4, sz - 4], [sx + 6, my + 4, sz + 4]), 'xmark', { where: b.isMat('coat'), mirror: true });
}

/** Bankai v3: three white X marks holding the coat shut down the front. */
function coatXs(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const marks: [string, number][] = [['chest', s.chestY - 1.5], ['chest', s.chestY - 5.5], ['spine', s.waistY + 1.5]];
  for (const [bone, y0] of marks) {
    b.paint(bone, fn((x, y, z) => {
      const u = x, v = y - y0;
      return Math.max(Math.min(Math.abs(u - v), Math.abs(u + v)) - 0.55 + Math.max(0, Math.max(Math.abs(u), Math.abs(v)) - 2.2) * 3, 1 - z);
    }, [-4, y0 - 3, 0], [4, y0 + 3, 14]), 'xmark', { where: b.isMat('coat') });
  }
}

/** Bankai v3: black gloves, a white X on the back of each hand. */
function gloves(b: ModelBuilder, L: Landmarks): void {
  b.paint(['fist.L', 'palm.L'], aabb([-30, -10, -30], [30, 60, 30]), 'glove', { where: b.isMat('skin'), mirror: true });
  const [wx, wy, wz] = L.wrist;
  b.paint('fist.L', fn((x, y, z) => {
    const u = y - (wy - 3), v = z - wz;
    return Math.max(Math.min(Math.abs(u - v), Math.abs(u + v)) - 0.45 + Math.max(0, Math.max(Math.abs(u), Math.abs(v)) - 1.6) * 3, wx + 0.8 - x);
  }, [wx - 3, wy - 7, wz - 4], [wx + 4, wy + 1, wz + 4]), 'xmark', { where: b.isMat('glove'), mirror: true });
}

// ------------------------------------------------------------------------------------------------ bodies

const assetCache = new Map<FullbringForm, CharacterAsset>();

export function fullbringAsset(form: FullbringForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildFullbring(form)));
  return a;
}

export function buildFullbring(form: FullbringForm): CharacterAsset {
  const b = new ModelBuilder(`ichigo-${form}`, FB_RES);
  palette(b, form);
  const s = SPEC_ADULT_MALE;
  const robe = form === 'shikai2' || form === 'bankai3';
  const L = humanoidSkeleton(b, s, { sleeves: form !== 'fb3' && form !== 'bankai3', hakama: robe });
  humanSockets(b, L);
  b.socket('hip.R', 'hips', [-9.6, 46, 3.2], [-10, 0, 8]);
  const hd = humanHead(b, L, true, form === 'fb3' ? 58 : 46);
  hands(b, L, 'skin');
  const springs: SpringDef[] = [];
  const colliders: ColliderDef[] = [];
  if (form === 'fb2') {
    const c = clad(b, L);
    springs.push(...c.springs);
    colliders.push(...c.colliders);
  } else if (form === 'fb3') {
    bodysuit(b, L);
    armour(b, L, hd);
  } else if (form === 'shikai2') {
    feet(b, L, 'tabi', 'straw', 'cord');
    const o = { black: 'black', collar: 'collar', skin: 'skin', obi: 'obi' };
    kosodeTorso(b, L, o);
    kosodeSleeves(b, L, o);
    obi(b, L, o);
    hakama(b, L, o);
    thickStrap(b);
    restoredBands(b, L);
    const base = shihakushoSprings();
    springs.push(...base.springs);
    colliders.push(...base.colliders);
  } else {
    feet(b, L, 'tabi', 'straw', 'cord');
    const o = { black: 'coat', collar: 'shirt', skin: 'shirt', obi: 'coat', crossY: s.chestY - 8 };
    kosodeTorso(b, L, o);
    v3Sleeves(b, L);
    coatXs(b, L);
    gloves(b, L);
    hakama(b, L, { black: 'black', collar: 'collar', skin: 'skin', obi: 'coat', hemR: 7.4 });
    // the long coat-tails, split at the back and open at the front
    const tails = coatSkirt(b, L, { mat: 'coat', lining: 'lining', openFront: 34, yTop: s.waistY - 1, yHem: 5, r0: 9.4, r1: 12.6, thick: 1.15, res: FB_RES });
    const base = shihakushoSprings();
    springs.push(...base.springs.filter((sp) => !sp.bone.startsWith('sleeve')), ...tails.springs);
    colliders.push(...base.colliders, ...tails.colliders);
  }
  b.autoShade();
  b.lint();
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

// ------------------------------------------------------------------------------------------------ weapons

const propCache = new Map<string, VoxelModel>();
const cached = (k: string, f: () => VoxelModel) => {
  let m = propCache.get(k);
  if (!m) propCache.set(k, (m = f()));
  return m;
};

const FB_BLACK = ['#3A2A32', '#2A1B22', '#1C1218', '#141418'];

/** signed distance from (px, py) to a closed polygon (negative inside) */
function polyDist(px: number, py: number, poly: readonly [number, number][]): number {
  let d = Infinity, inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, ay] = poly[j], [bx, by] = poly[i];
    const dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
    d = Math.min(d, Math.hypot(px - ax - dx * t, py - ay - dy * t));
    if (ay > py !== by > py && px < ax + ((py - ay) * dx) / dy) inside = !inside;
  }
  return inside ? -d : d;
}

/** FB1: the badge in the fist, the large black manji projected before it, outlined in crimson. */
export function fbGuard(): VoxelModel {
  return cached('guard', () => {
    const b = new ModelBuilder('fb-guard', 48);
    b.mat('fb', FB_BLACK, { base: 1, rough: 0.5, shadeK: 0.7 });
    b.mat('rim', ['#D02A3A'], { glow: 1.6 });
    b.mat('badge', ['#CDB98A', '#B9A16E', '#8A7448'], { base: 1, rough: 0.5, metal: 0.4 });
    b.bone('root', null, [0, 0, 0]);
    // the badge between the fingers, the manji standing out in front of the knuckles
    b.add('root', box([0, -0.4, 0.8], [0.8, 2.6, 2], { round: 0.6 }), 'badge');
    // the manji as a flat stroke: a hub, four arms out and each bent a right angle round, a slab two voxels thick
    const seg = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
      const dx = bx - ax, dy = by - ay;
      const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
      return Math.hypot(px - ax - dx * t, py - ay - dy * t);
    };
    const manji = (x: number, y: number) => {
      let d = Math.hypot(x, y) - 3.9;
      for (let k = 0; k < 4; k++) {
        const a = (k * Math.PI) / 2, c = Math.cos(a), s2 = Math.sin(a);
        // the arm along +Y rotated by a, then its bend toward −X rotated the same way
        d = Math.min(d, seg(x, y, 0, 0, -s2 * 12.5, c * 12.5) - 2.05, seg(x, y, -s2 * 12.5, c * 12.5, -s2 * 12.5 - c * 8.5, c * 12.5 - s2 * 8.5) - 1.9);
      }
      return d;
    };
    const lo: V3 = [-16, -16, 2], hi: V3 = [16, 16, 5];
    b.add('root', fn((x, y, z) => Math.max(manji(x, y), Math.abs(z - 3.4) - 1), lo, hi), 'fb');
    // the crimson outline: the stroke's outer voxel all round
    b.paint('root', fn((x, y) => -(manji(x, y) + 0.95), lo, hi), 'rim', { where: b.isMat('fb') });
    b.autoShade({ up: 0.4, open: 2, front: 0 });
    b.lint();
    return b.build();
  });
}

/** FB2: the black blade over the right forearm (on 'forearm.R': down the arm, past the fist). */
export function fbArmBlade(): VoxelModel {
  return cached('armblade', () => {
    const b = new ModelBuilder('fb-armblade', 48);
    b.mat('fb', FB_BLACK, { base: 1, rough: 0.4, shadeK: 0.7 });
    b.mat('rim', ['#D02A3A'], { glow: 1.6 });
    b.bone('root', null, [0, 0, 0]);
    // a broad flat blade along −Y over the back of the forearm: it comes out of the sleeve at the wrist and runs a hand's
    // length past the fist to a clipped point, outlined in crimson
    const poly: [number, number][] = [[4, -1.4], [-28, -2.6], [-41, 0.4], [-31, 3.4], [-14, 3.7], [4, 2.6]];
    b.add('root', prism(poly, [-2.8, 0, 1], [0, 1, 0], [0, 0, 1], 0.9), 'fb');
    b.paint('root', fn((_x, y, z) => -(polyDist(y, z - 1, poly) + 0.95), [-5, -43, -4], [0, 6, 7]), 'rim', { where: b.isMat('fb') });
    // the mount along its inner side where it grows out of the arm
    b.add('root', box([-2.1, -2, 0.6], [0.7, 4.5, 1.8], { round: 0.5 }), 'fb');
    b.autoShade({ up: 0.4, open: 2, front: 0 });
    b.lint();
    return b.build();
  });
}

/** FB3: the black machete, the badge (marked with a black cross) for its guard, a white cloth grip, a flat butt. */
export function fbMachete(): VoxelModel {
  return cached('machete', () => {
    const b = new ModelBuilder('fb-machete', 48);
    b.mat('fb', ['#3A3A42', '#26262C', '#18181C', '#141418'], { base: 1, rough: 0.35, metal: 0.6, shadeK: 0.7 });
    b.mat('edge', ['#E2E5EA', '#C9CDD3', '#A8AEB8'], { base: 1, rough: 0.2, metal: 0.85 });
    b.mat('badge', ['#CDB98A', '#B9A16E', '#8A7448'], { base: 1, rough: 0.5, metal: 0.4 });
    b.mat('cross', ['#1A1A1E']);
    b.mat('cloth', ['#F1EEE8', '#E2DED6', '#C9C4BA'], { base: 1, rough: 0.9 });
    b.bone('root', null, [0, 0, 0]);
    // a broad blade, widening toward a clipped point
    b.add('root', prism([[5, -2.2], [36, -2.9], [41, 1.4], [37, 2.2], [5, 2.2]], [0, 0, 0], [0, 0, 1], [0, 1, 0], 0.7), 'fb');
    b.paint('root', fn((_x, y, z) => y - (-2.2 - Math.max(0, z - 5) * 0.022 + 1), [-2, -4, 4], [2, 3, 42]), 'edge');
    // the badge for a guard, a black cross on it
    b.add('root', box([0, 0, 4.2], [1.1, 3.4, 1.4], { round: 0.5 }), 'badge');
    b.paint('root', fn((x, y, z) => Math.max(Math.min(Math.abs(y), Math.abs(z - 4.2)) - 0.35, Math.abs(y) - 2.2, Math.abs(z - 4.2) - 1.1, Math.abs(x) - 1.3 + 0.2), [-2, -4, 2.5], [2, 4, 6]), 'cross', { where: b.isMat('badge') });
    // the round hilt in white cloth, the flat butt
    b.add('root', cylinder([0, 0, -8.5], [0, 0, 3], 1.4), 'cloth');
    b.paint('root', fn((_x, _y, z) => Math.abs(((z % 2.2) + 2.2) % 2.2 - 1.1) - 0.3, [-2, -2, -8.5], [2, 2, 3]), 'cloth', { shade: 2 });
    b.add('root', box([0, 0, -9.2], [1.5, 1.8, 0.6], { round: 0.3 }), 'fb');
    b.autoShade({ up: 0.4, open: 2, front: 0 });
    b.lint();
    return b.build();
  });
}

/** FB3: the machete's white sheath (worn on the back). */
export function fbSheath(): VoxelModel {
  return cached('fbsheath', () => {
    const b = new ModelBuilder('fb-sheath', 48);
    b.mat('white', ['#EDEAE4', '#D6D2CA', '#B8B3AA'], { base: 1, rough: 0.6 });
    b.mat('band', ['#2C2C33']);
    b.bone('root', null, [0, 0, 0]);
    b.add('root', box([0, 0.1, 19], [1.3, 3.6, 19.5], { round: 1 }), 'white');
    b.paint('root', fn((_x, _y, z) => Math.abs(z - 1.4) - 0.8, [-2, -5, -1], [2, 5, 4]), 'band');
    b.paint('root', fn((_x, _y, z) => Math.abs(z - 37) - 0.8, [-2, -5, 34], [2, 5, 40]), 'band');
    b.autoShade({ up: 0.4, open: 2, front: 0 });
    b.lint();
    return b.build();
  });
}

/** Restored Shikai v2: the cleaver with a silver hilt, a grey wrap, a short chain, the back of the tip curving in. */
export function zangetsuV2(): VoxelModel {
  return cached('v2', () => {
    const b = new ModelBuilder('zangetsu-v2', 48);
    b.mat('spine', ['#45454D', '#2B2B31', '#17171B'], { base: 1, rough: 0.35, metal: 0.6, shadeK: 0.6 });
    b.mat('steel', ['#F3F4F6', '#DADDE2', '#A3A8B1'], { base: 1, rough: 0.22, metal: 0.9, shadeK: 0.6 });
    b.mat('silver', ['#D4D8DE', '#B9BEC6', '#8A9099', '#6C717A'], { base: 1, rough: 0.3, metal: 0.85 });
    b.mat('wrap', ['#84858B', '#6E6F75', '#55565C'], { base: 1, rough: 0.9 });
    b.mat('chain', ['#A8ACB4', '#8A8E96', '#666A72'], { base: 1, rough: 0.35, metal: 0.8 });
    b.bone('root', null, [0, 0, 0]);
    const z0 = 5.5, zEdgeEnd = 66, zTip = 75.5;
    const yS = 5, yE = -5.5;
    // the outline: the spine runs straight, then curves down and in toward the point like a trench knife's
    const outline = prism([[z0, yE], [zEdgeEnd, yE], [zTip, yS - 3.2], [zTip - 3.2, yS - 1.1], [zTip - 8, yS - 0.1], [z0, yS]], [0, 0, 0], [0, 0, 1], [0, 1, 0], 1.6);
    const bevel = fn((x, y) => Math.abs(x) - (0.55 + Math.max(0, Math.min(1, (y - yE) / ((yS - yE) * 0.55))) * 1.0), [-2, -7, 0], [2, 7, 80]);
    b.add('root', intersect(outline, bevel), 'spine');
    b.paint('root', fn((_x, y, z) => y - (yE + 0.5 + (yS - yE) * 0.45 + Math.max(0, z - zEdgeEnd) * 0.6), [-3, -7, 0], [3, 7, 80]), 'steel');
    // the silver hilt, the grey wrap in diamonds, the pommel cap
    b.add('root', box([0, -0.2, 4.4], [1.7, 2.4, 1.1], { round: 0.5 }), 'silver');
    b.add('root', box([0, -0.2, -0.8], [1.35, 1.6, 5.4], { round: 0.6 }), 'wrap');
    b.paint('root', fn((_x, y, z) => {
      const a = Math.abs((((z + y * 1.1) % 2.6) + 2.6) % 2.6 - 1.3);
      const c = Math.abs((((z - y * 1.1) % 2.6) + 2.6) % 2.6 - 1.3);
      return Math.min(a, c) - 0.35;
    }, [-2, -2.5, -6], [2, 2.5, 4.4]), 'wrap', { shade: 2, where: b.isMat('wrap') });
    b.add('root', box([0, -0.2, -6.6], [1.6, 1.9, 0.8], { round: 0.5 }), 'silver');
    // the short chain at the butt
    for (let i = 0; i < 4; i++) b.add('root', torus([0, -1.2 - i * 1.5, -7.9 - i * 0.4], 0.8, 0.32, [i % 2 ? 0 : 90, 0, 0]), 'chain', { thr: 0.25 });
    b.autoShade({ up: 0.4, open: 2.2, front: 0 });
    b.lint();
    return b.build();
  });
}

/** Bankai v3: the daitō lengthened to the Shikai's length, curving near the point with three teeth on its back. */
export function tensaV3(): VoxelModel {
  return cached('v3', () => {
    const b = new ModelBuilder('tensa-zangetsu-v3', 48);
    b.mat('blade', ['#3B4250', '#1E2026', '#141418'], { base: 1, rough: 0.25, metal: 0.7, shadeK: 0.7 });
    b.mat('edge', ['#5C6678'], { rough: 0.15, metal: 0.8 });
    b.mat('guard', ['#2A2A30', '#18181C', '#141418'], { base: 1, rough: 0.4, metal: 0.6 });
    b.mat('wrap', ['#2E2E33', '#232327', '#18181B'], { base: 1, rough: 0.9 });
    b.mat('ray', ['#4A4A52']);
    b.mat('chain', ['#3A3B42', '#2E2F34', '#1E1F24'], { base: 1, rough: 0.35, metal: 0.7 });
    b.bone('root', null, [0, 0, 0]);
    const z0 = 7, zC = 44, zT = 63;
    const curve = (z: number) => 2.6 * Math.pow(Math.max(0, (z - zC) / (zT - zC)), 2);
    b.add('root', fn((x, y, z) => {
      const yc = y - curve(z);
      const top = 1.5;
      const bot = z > zT - 6 ? -1.6 + ((z - (zT - 6)) / 6) * 3.1 : -1.6;
      return Math.max(bot - yc, yc - top, Math.abs(x) - 0.55, z0 - z, z - zT);
    }, [-2, -3, z0 - 1], [2, 6, zT + 1]), 'blade');
    b.paint('root', fn((_x, y, z) => y - curve(z) - (-1.15 + Math.max(0, z - (zT - 6)) * 0.5), [-2, -3, z0], [2, 6, zT]), 'edge');
    // three small teeth on the back edge near the point
    for (const z of [50, 54, 58]) b.add('root', prism([[z - 1.2, 0], [z + 1.2, 0], [z + 1.6, 1.8]], [0, 1.4 + curve(z), 0], [0, 0, 1], [0, 1, 0], 0.45), 'blade', { thr: 0.2 });
    // the guard: a manji whose prongs curl and break into points
    for (let k = 0; k < 4; k++) {
      const r = (k * Math.PI) / 2;
      const rot = (p: [number, number], z: number): V3 => [p[0] * Math.cos(r) - p[1] * Math.sin(r), p[0] * Math.sin(r) + p[1] * Math.cos(r), z];
      b.add('root', capsule(rot([0, 0.8], 6.2), rot([0.6, 5.2], 6.2), 0.6), 'guard', { thr: 0.2 });
      b.add('root', capsule(rot([0.6, 5.2], 6.2), rot([-2.6, 6.6], 6.2), 0.55, 0.45), 'guard', { thr: 0.2 });
      b.add('root', capsule(rot([-2.6, 6.6], 6.2), rot([-4.6, 5], 6.2), 0.45, 0.3), 'guard', { thr: 0.2 });
    }
    b.add('root', cylinder([0, 0, 5.6], [0, 0, 6.9], 1.6), 'guard');
    b.add('root', box([0, 0, -1.2], [1.25, 1.35, 6.9], { round: 0.5 }), 'wrap');
    b.paint('root', fn((_x, y, z) => Math.abs(((Math.abs(y) + z) % 3 + 3) % 3 - 1.5) - 0.55, [-2, -2, -8], [2, 2, 5.2]), 'ray', { where: b.isMat('wrap') });
    b.add('root', box([0, 0, -8.3], [1.4, 1.5, 0.6], { round: 0.4 }), 'guard');
    // the long chain: out of the pommel, a wide loop hanging below the hand and back up to the wrist
    const N = 14;
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      const a = Math.PI * u;
      const p: V3 = [0, -Math.sin(a) * 9.5, -9.2 + u * 9 - Math.sin(a) * 1.5];
      b.add('root', torus(p, 0.8, 0.32, [i % 2 ? 0 : 90, 0, (a * 180) / Math.PI]), 'chain', { thr: 0.25 });
    }
    b.autoShade({ up: 0.4, open: 2, front: 0 });
    b.lint();
    return b.build();
  });
}
