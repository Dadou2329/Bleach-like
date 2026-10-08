// Lille Barro's god forms (docs/roster/H1-vandenreich-leaders.md, "Lille Barro"; kit docs/kits/lille.md).
// Jilliel (神の裁き), 24 vox/m, ≈ 3.4 m: a huge white priestly robe riddled with dark holes, closed up to the eyes so he
// looks mouthless; the hem split into a skirt over stilt boots, each with a long toe point and a heel point; eight green
// wings fanned from the upper back, three holes through each (24 barrels). His own head rides the 'head' bone as a prop
// at 48 vox/m ('head-god': both eyes open, the tattoo glowing, white lines across the face). The halo is a prop: an
// oversized thin green ring.
// The True Form, 16 vox/m, ≈ 6.5 m: the robe split into a skirt over stilts spread wide in a split stance; long white
// arms with pauldrons and long fingers; a long snake-like neck (three bones) with white fur along its back; gold wings.
// The head is a prop at 18 vox/m ('head-owl', big on the long neck): a fair head with slicked-back white hair, round owl eyes, a hooked beak.
// The halo: small, spiked, gold.
// The remnants, 32 vox/m, ≈ 1.5 m: flamingo-like birds — a small body, long legs and neck, stubby wings, little owl heads.
// Props: 'halo-green', 'halo-gold', 'head-god', 'head-owl', 'trompete' (the golden trumpet with a wing-like flourish,
// 8 vox/m, the bell along +Z).
// (verify) the arms of Jilliel (hidden under the robe here); the True Form's wing count.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { blend, capsule, cylinder, ellipsoid, fn, intersect, smoothPath, sphere, spike, torus, tube, type V3 } from '../models/sdf';
import { humanoidSkeleton, type HumanoidSpec, type Landmarks } from './humanoid';
import { LILLE_SPEC, lilleHead, lilleHeadPalette } from './lille';
import type { CharacterAsset } from './ichigo';

export const JILLIEL_RES = 24;
export const TRUE_RES = 16;
export const REMNANT_RES = 32;

/** Jilliel at 24 vox/m: the arms are bones only (hidden under the robe), the legs are stilts. */
const SPEC_J: HumanoidSpec = {
  H: 82,
  chinY: 74.4,
  head: { w: 5, d: 5.5, h: 6.2 },
  neckR: 1.3,
  shoulder: [5.2, 68.5, -0.3],
  upperArm: 7.5,
  foreArm: 6.8,
  hand: 4.6,
  armR: 1.2,
  hipsY: 30,
  hip: [3.2, 28.5, 0],
  kneeY: 15,
  ankleY: 3.5,
  chest: [7, 5],
  waist: [6, 4.5],
  hips: [6, 4.5],
  chestY: 60,
  waistY: 46,
  foot: { len: 6, w: 2.4, heel: 2 },
};

const assetCache = new Map<string, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function jillielAsset(): CharacterAsset {
  let a = assetCache.get('jilliel');
  if (!a) assetCache.set('jilliel', (a = buildJilliel()));
  return a;
}
export function trueFormAsset(): CharacterAsset {
  let a = assetCache.get('true');
  if (!a) assetCache.set('true', (a = buildTrueForm()));
  return a;
}
export function remnantAsset(): CharacterAsset {
  let a = assetCache.get('remnant');
  if (!a) assetCache.set('remnant', (a = buildRemnant()));
  return a;
}

export type LilleGodProp = 'halo-green' | 'halo-gold' | 'head-god' | 'head-owl' | 'trompete' | 'arm';

export function lilleGodProp(kind: LilleGodProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    const make: Record<LilleGodProp, () => VoxelModel> = {
      'halo-green': () => buildHalo(false), 'halo-gold': () => buildHalo(true), 'head-god': buildGodHead, 'head-owl': buildOwlHead, trompete: buildTrompete, arm: buildExtraArm,
    };
    propCache.set(kind, (m = make[kind]()));
  }
  return m;
}

/** the wing bones of both god forms: four a side, top to bottom */
export const JILLIEL_WINGS = ['wing.L1', 'wing.L2', 'wing.L3', 'wing.L4', 'wing.R1', 'wing.R2', 'wing.R3', 'wing.R4'];
/** the wings' elevations (degrees above level, top to bottom) */
const WING_EL = [52, 22, -8, -38];

// ---------------------------------------------------------------------------------------------- shared shapes

/**
 * A wing: a long leaf-shaped blade from `root` along `dir`, its flat faces toward ±`n`, three round holes through it.
 * Returns the hole centres (the barrels).
 */
function wing(b: ModelBuilder, bone: string, root: V3, dir: V3, n: V3, len: number, width: number, thick: number, mat: string): V3[] {
  const dl = Math.hypot(...dir);
  const D: V3 = [dir[0] / dl, dir[1] / dl, dir[2] / dl];
  let W: V3 = [n[1] * D[2] - n[2] * D[1], n[2] * D[0] - n[0] * D[2], n[0] * D[1] - n[1] * D[0]];
  const wl = Math.hypot(...W);
  W = [W[0] / wl, W[1] / wl, W[2] / wl];
  const N: V3 = [D[1] * W[2] - D[2] * W[1], D[2] * W[0] - D[0] * W[2], D[0] * W[1] - D[1] * W[0]];
  const prof = (t: number) => (t < 0.4 ? 0.35 + 0.65 * Math.sin((t / 0.4) * Math.PI / 2) : Math.cos(((t - 0.4) / 0.6) * Math.PI / 2) * 0.92 + 0.08);
  const holes: [number, number][] = [[0.36, 0.42], [0.57, 0.4], [0.77, 0.36]];
  const ext = len + width + 2;
  const s = fn((x, y, z) => {
    const qx = x - root[0], qy = y - root[1], qz = z - root[2];
    const t = qx * D[0] + qy * D[1] + qz * D[2];
    const u = qx * W[0] + qy * W[1] + qz * W[2];
    const v = qx * N[0] + qy * N[1] + qz * N[2];
    const tn = Math.max(0, Math.min(1, t / len));
    const half = width * prof(tn);
    let d = Math.max(Math.abs(u) - half, Math.abs(v) - thick, -t, t - len);
    for (const [ht, hr] of holes) d = Math.max(d, hr * width * prof(ht) - Math.hypot(t - ht * len, u));
    return d;
  }, [root[0] - ext, root[1] - ext, root[2] - ext], [root[0] + ext, root[1] + ext, root[2] + ext]);
  b.add(bone, s, mat, { thr: 0.25 });
  // a rib down the middle, a shade darker
  b.paint(bone, fn((x, y, z) => {
    const qx = x - root[0], qy = y - root[1], qz = z - root[2];
    return Math.abs(qx * W[0] + qy * W[1] + qz * W[2]) - 0.5;
  }, [root[0] - ext, root[1] - ext, root[2] - ext], [root[0] + ext, root[1] + ext, root[2] + ext]), mat, { shade: 3, where: b.isMat(mat) });
  return holes.map(([ht]) => [root[0] + D[0] * ht * len, root[1] + D[1] * ht * len, root[2] + D[2] * ht * len] as V3);
}

/** the eight wings on the upper back; the barrels are sockets 'barrel.0' … 'barrel.23' */
function eightWings(b: ModelBuilder, at: V3, len: number, width: number, thick: number, mat: string): void {
  let k = 0;
  for (const side of ['L', 'R'] as const) {
    const sx = side === 'L' ? 1 : -1;
    WING_EL.forEach((el, i) => {
      const e = (el * Math.PI) / 180;
      const root: V3 = [at[0] + sx * 1.5, at[1] - i * 1.6, at[2]];
      const dir: V3 = [sx * Math.cos(e) * 0.93, Math.sin(e), -0.36];
      const bone = `wing.${side}${i + 1}`;
      b.bone(bone, 'chest', root);
      const holes = wing(b, bone, root, dir, [0, 0.2, 1], len * (1 - Math.abs(i - 1.2) * 0.07), width, thick, mat);
      for (const h of holes) b.socket(`barrel.${k++}`, bone, h);
    });
  }
}

// ---------------------------------------------------------------------------------------------- Jilliel

/** The robe's radius at a height (vox): narrow at the collar, a bell to the hem. */
const ROBE: [number, number][] = [[77.8, 4.4], [75, 4.6], [71, 6.6], [66, 10.6], [58, 13.6], [46, 16.6], [34, 19.4], [23, 21.4]];
function robeR(y: number): number {
  if (y >= ROBE[0][0]) return ROBE[0][1];
  for (let i = 1; i < ROBE.length; i++) {
    const [y0, r0] = ROBE[i - 1], [y1, r1] = ROBE[i];
    if (y >= y1) return r0 + ((y0 - y) / (y0 - y1)) * (r1 - r0);
  }
  return ROBE[ROBE.length - 1][1];
}

export function buildJilliel(): CharacterAsset {
  const b = new ModelBuilder('lille-jilliel', JILLIEL_RES);
  b.mat('robe', ['#F2F2EC', '#EBEBE5', '#DCDCD5', '#C5C6C0', '#A7A9A5'], { base: 1, rough: 0.7, shadeK: 0.9 });
  b.mat('hole', ['#2A2F2C', '#1C201E'], { rough: 0.9 });
  b.mat('wing', ['#B4F7CF', '#86EFAE', '#4FE38A', '#3DDB7C', '#2CB866'], { base: 2, rough: 0.4, glow: 0.45, shadeK: 0.85 });
  const s = SPEC_J;
  const L = humanoidSkeleton(b, s);
  b.socket('headProp', 'head', [0, s.chinY, L.headC[2]]);
  b.socket('halo', 'head', [0, s.chinY + 12, L.headC[2] - 2.5]);
  b.socket('chest.front', 'chest', [0, 64, 11]);
  b.socket('eye.L', 'head', [1.25, s.chinY + 2.8, L.headC[2] + 2.8]);
  b.socket('face', 'head', [0, s.chinY + 2.8, L.headC[2] + 2.8]);
  // the hands are inside the sleeves of the robe: sockets for the kit's grips
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'hand.R', [-wx, wy - 2, wz]);
  b.socket('grip.L', 'hand.L', [wx, wy - 2, wz]);
  // the robe: a bell from below the eyes to the hem, a touch flatter front to back
  const kz = 0.86;
  const robe = fn((x, y, z) => {
    const r = robeR(y);
    return Math.max(Math.hypot(x, (z + 0.6) / kz) - r, y - 77.8, 23 - y);
  }, [-24, 22, -22], [24, 78, 22]);
  const bands: [string, number, number][] = [['hips', 22, 40], ['spine', 40, 56], ['chest', 56, 79]];
  for (const [bone, y0, y1] of bands) b.add(bone, intersect(robe, fn((_x, y) => Math.max(y0 - y, y - y1), [-24, y0, -22], [24, y1, 22])), 'robe');
  // the collar's rim, a little proud, and the folds falling from it
  b.add('chest', fn((x, y, z) => Math.max(Math.abs(Math.hypot(x, (z + 0.6) / kz) - 4.8) - 0.8, Math.abs(y - 77.3) - 0.7), [-7, 75, -7], [7, 79, 7]), 'robe', { thr: 0.2 });
  // the head sits in the collar: hollow it out round the neck and the back of the skull (the face shows only above it)
  b.carve('chest', fn((x, y, z) => Math.max(Math.hypot(x, z + 0.6) - 3.2, 73.6 - y), [-5, 73, -5], [5, 80, 5]));
  for (const a of [0.35, 1.2, 2.0, 2.8, -0.35, -1.2, -2.0, -2.8]) {
    b.paint(['chest', 'spine', 'hips'], fn((x, y, z) => {
      const ang = Math.atan2(x, z + 0.6);
      return Math.abs(ang - a) * Math.hypot(x, z + 0.6) - 0.5 + (y > 70 ? 9 : 0);
    }, [-24, 22, -22], [24, 72, 22]), 'robe', { shade: 3, where: b.isMat('robe') });
  }
  // the holes riddling it: round pits, dark inside
  for (let i = 0; i < 30; i++) {
    const a = i * 2.39996 + 0.4;
    const y = 27 + ((i * 37) % 43);
    if (y > 70) continue;
    const r = robeR(y);
    const p: V3 = [Math.sin(a) * r, y, Math.cos(a) * r * kz - 0.6];
    const hr = 0.9 + (i % 3) * 0.3;
    const bone = y < 40 ? 'hips' : y < 56 ? 'spine' : 'chest';
    const o: V3 = [p[0] * 1.1, p[1], (p[2] + 0.6) * 1.1 - 0.6];
    b.carve(bone, sphere(o, hr + 0.3));
    b.paint(bone, sphere(o, hr + 1.0), 'hole', { where: b.isMat('robe') });
  }
  // the hem split into a skirt over the stilts: slits up from the hem
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.52;
    b.carve('hips', fn((x, y, z) => Math.max(Math.abs(Math.sin(Math.atan2(x, z + 0.6) - a)) * Math.hypot(x, z + 0.6) - 0.8, Math.cos(Math.atan2(x, z + 0.6) - a) < 0 ? 9 : -9, y - 33), [-24, 21, -22], [24, 34, 22]));
  }
  // the stilts: thin legs, the boots with a long toe point and a heel point
  const [hx, hy, hz] = s.hip;
  const [kx, ky, kzz] = L.knee;
  const [ax, ay, az] = L.ankle;
  b.add('thigh.L', capsule([hx, hy, hz], [kx, ky, kzz], 1.6, 1.2), 'robe', { mirror: true });
  b.add('shin.L', capsule([kx, ky, kzz], [ax, ay + 1, az], 1.2, 1.0), 'robe', { mirror: true });
  b.add('foot.L', blend(0.6, sphere([ax, ay, az], 1.5), spike([ax, ay, az + 0.5], [0, -0.42, 1], 8.5, 1.3, 1.1, { tip: 0.3 }), spike([ax, ay, az - 0.5], [0, -0.55, -1], 6.0, 1.2, 1.0, { tip: 0.3 })), 'robe', { mirror: true });
  b.socket('toe.L', 'foot.L', [ax, 0.5, az + 8]);
  b.socket('toe.R', 'foot.R', [-ax, 0.5, az + 8]);
  eightWings(b, [0, 64, -10], 38, 4.2, 1.15, 'wing');
  b.autoShade();
  b.lint();
  return { model: b.build(), springs: [], colliders: [], warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- the True Form

/**
 * The True Form at 16 vox/m: a custom skeleton (a long neck of three bones), arms long enough to reach the ground from
 * the shoulders, stilt legs set in a split.
 */
export function buildTrueForm(): CharacterAsset {
  const b = new ModelBuilder('lille-true', TRUE_RES);
  b.mat('robe', ['#F2F2EC', '#EBEBE5', '#DCDCD5', '#C5C6C0', '#A7A9A5'], { base: 1, rough: 0.7, shadeK: 0.9 });
  b.mat('hole', ['#2A2F2C', '#1C201E'], { rough: 0.9 });
  b.mat('arm', ['#F3F1EC', '#EDEBE5', '#DEDBD3', '#C6C2B9', '#ABA79E'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('fur', ['#F3F3F0', '#EAEAE6', '#D9D9D4', '#C2C2BD'], { base: 1, rough: 0.95, dither: 0.08 });
  b.mat('gold', ['#FFF0B8', '#F8DC7C', '#F2C74E', '#D9A93A', '#B88A2C'], { base: 2, rough: 0.35, metal: 0.4, glow: 0.4, shadeK: 0.85 });
  b.mat('light', ['#FFF6D0'], { glow: 1.6 });
  // the skeleton (vox at 16/m): hips 2.6 m, the shoulders 4.3 m, the head 6.2 m
  b.bone('root', null, [0, 0, 0]);
  b.bone('hips', 'root', [0, 42, 0]);
  b.bone('spine', 'hips', [0, 52, -0.5]);
  b.bone('chest', 'spine', [0, 62, -0.5]);
  b.bone('neck', 'chest', [0, 72, -1]);
  b.bone('neck2', 'neck', [0, 80, 1.5]);
  b.bone('neck3', 'neck2', [0, 88, 4]);
  b.bone('head', 'neck3', [0, 95, 6]);
  const sh: V3 = [13, 68, -0.5];
  const el: V3 = [16, 50, 0], wr: V3 = [17, 32, 1];
  b.boneSym('shoulder.L', 'chest', [5, 68, -0.5]);
  b.boneSym('upperarm.L', 'shoulder.L', sh);
  b.boneSym('forearm.L', 'upperarm.L', el);
  b.boneSym('hand.L', 'forearm.L', wr);
  b.boneSym('palm.L', 'hand.L', wr);
  b.boneSym('fist.L', 'hand.L', wr);
  // the legs: thighs flung out sideways, long stilts down to points far apart
  const hip: V3 = [5, 40, 0], knee: V3 = [19, 26, 0.5], ankle: V3 = [27, 4, 1];
  b.boneSym('thigh.L', 'hips', hip);
  b.boneSym('shin.L', 'thigh.L', knee);
  b.boneSym('foot.L', 'shin.L', ankle);
  b.socket('headProp', 'head', [0, 95, 6]);
  b.socket('halo', 'head', [0, 109, 1]);
  b.socket('face', 'head', [0, 101, 14]);
  b.socket('chest.front', 'chest', [0, 64, 10]);
  b.socket('mouth', 'head', [0, 99, 16]);
  b.socket('arm2.L', 'chest', [11, 60, 1]);
  b.socket('arm2.R', 'chest', [-11, 60, 1]);
  b.socket('toe.L', 'foot.L', [ankle[0], 0.5, ankle[2] + 4]);
  b.socket('toe.R', 'foot.R', [-ankle[0], 0.5, ankle[2] + 4]);
  // the body: the robe from the chest down to a short skirt over the split legs
  const body = blend(3, ellipsoid([0, 64, -0.5], [12, 9, 8]), ellipsoid([0, 52, -0.5], [10.5, 9, 7.5]), ellipsoid([0, 42, -0.3], [12.5, 6, 8.5]));
  b.add('chest', intersect(body, fn((_x, y) => 58 - y, [-30, 58, -30], [30, 90, 30])), 'robe');
  b.add('spine', intersect(body, fn((_x, y) => Math.max(47 - y, y - 58), [-30, 47, -30], [30, 58, 30])), 'robe');
  b.add('hips', intersect(body, fn((_x, y) => Math.max(30 - y, y - 47), [-30, 30, -30], [30, 47, 30])), 'robe');
  // the skirt: panels flaring over the thighs
  b.add('hips', fn((x, y, z) => {
    const r = 12 + (40 - y) * 0.55;
    return Math.max(Math.abs(Math.hypot(x, (z + 0.3) / 0.75) - r) - 0.9, y - 40, 31 - y, Math.abs(Math.sin(Math.atan2(x, z) * 3)) < 0.18 ? 9 : -9);
  }, [-25, 30, -22], [25, 41, 22]), 'robe', { thr: 0.25 });
  // the holes, and the light inside the deepest
  for (let i = 0; i < 16; i++) {
    const a = i * 2.39996;
    const y = 36 + ((i * 29) % 34);
    const bone = y < 47 ? 'hips' : y < 58 ? 'spine' : 'chest';
    const r = y > 60 ? 11 : y > 48 ? 10 : 12;
    const p: V3 = [Math.sin(a) * r, y, Math.cos(a) * r * 0.72 - 0.5];
    const o: V3 = [p[0] * 1.1, y, p[2] * 1.1];
    b.carve(bone, sphere(o, 1.3 + (i % 2) * 0.4));
    b.paint(bone, sphere(o, 2.1 + (i % 2) * 0.4), i % 4 === 0 ? 'light' : 'hole', { where: b.isMat('robe') });
  }
  // the neck: long, snaking up and forward, the white fur along its back
  const spine3: V3[] = smoothPath([[0, 68, -1], [0, 76, 0], [0, 84, 2.5], [0, 91, 5], [0, 96, 6.5]], 4);
  const neckBones: [string, number, number][] = [['neck', 60, 78], ['neck2', 78, 86], ['neck3', 86, 99]];
  const neck = tube(spine3, spine3.map((_, i) => 3.4 - i * 0.07));
  for (const [bone, y0, y1] of neckBones) b.add(bone, intersect(neck, fn((_x, y) => Math.max(y0 - y, y - y1), [-12, y0, -12], [12, y1, 12])), 'arm');
  for (let i = 0; i < 9; i++) {
    const p = spine3[Math.min(spine3.length - 1, 2 + i * 2)];
    const bone = p[1] < 78 ? 'neck' : p[1] < 86 ? 'neck2' : 'neck3';
    b.add(bone, spike([p[0], p[1], p[2] - 2.6], [0, 0.6, -1], 4.2, 2.0, 1.4, { side: [1, 0, 0], tip: 0.5 }), 'fur', { thr: 0.25 });
  }
  // the arms: long and white, a pauldron over each shoulder, long fingers
  b.add('upperarm.L', blend(1.2, sphere(sh, 3.2), capsule(sh, el, 2.8, 2.3)), 'arm', { mirror: true });
  b.add('upperarm.L', blend(1.0, ellipsoid([sh[0] + 0.5, sh[1] + 2.2, sh[2]], [5.6, 3.2, 5.2]), ellipsoid([sh[0] + 2.6, sh[1] - 0.6, sh[2]], [3.2, 3.4, 4.8])), 'arm', { mirror: true, shade: 1 });
  b.add('forearm.L', blend(1.0, sphere(el, 2.3), capsule(el, wr, 2.2, 1.7)), 'arm', { mirror: true });
  const fingers = (bone: string, curl: number) => {
    b.add(bone, ellipsoid([wr[0], wr[1] - 2.2, wr[2] + 0.6], [1.4, 2.8, 2.4]), 'arm', { mirror: true });
    for (let f = 0; f < 4; f++) {
      const z = wr[2] - 1.2 + f * 1.15;
      const base: V3 = [wr[0] - 0.2, wr[1] - 4.4, z];
      const tip: V3 = [wr[0] - curl * 3, wr[1] - 4.4 - 8.5 * (1 - curl * 0.6), z + curl * 1.5];
      b.add(bone, capsule(base, tip, 0.7, 0.5), 'arm', { mirror: true, thr: 0.3 });
    }
    b.add(bone, capsule([wr[0] - 0.8, wr[1] - 2.4, wr[2] + 2.2], [wr[0] - 1.6 - curl * 2, wr[1] - 6.4, wr[2] + 3.6], 0.7, 0.55), 'arm', { mirror: true, thr: 0.3 });
  };
  fingers('palm.L', 0);
  fingers('fist.L', 0.85);
  b.socket('grip.R', 'fist.R', [-wr[0], wr[1] - 5, wr[2] + 1]);
  b.socket('grip.L', 'fist.L', [wr[0], wr[1] - 5, wr[2] + 1]);
  b.socket('finger.R', 'palm.R', [-wr[0], wr[1] - 13, wr[2]]);
  b.socket('finger.L', 'palm.L', [wr[0], wr[1] - 13, wr[2]]);
  // the stilts
  b.add('thigh.L', capsule(hip, knee, 2.4, 1.8), 'robe', { mirror: true });
  b.add('shin.L', capsule(knee, ankle, 1.7, 1.2), 'robe', { mirror: true });
  b.add('foot.L', blend(0.6, sphere(ankle, 2.0), spike([ankle[0], ankle[1], ankle[2] + 0.5], [0.3, -0.5, 1], 7, 1.6, 1.3, { tip: 0.4 }), spike([ankle[0], ankle[1], ankle[2] - 0.5], [0.2, -0.6, -1], 5, 1.5, 1.2, { tip: 0.4 })), 'robe', { mirror: true });
  eightWings(b, [0, 70, -7.5], 46, 5.2, 1.2, 'gold');
  b.autoShade();
  b.lint();
  return { model: b.build(), springs: [], colliders: [], warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- the remnants

/** A remnant bird at 32 vox/m: a small body on long legs, a long neck, stubby wings, a little owl head and beak. */
export function buildRemnant(): CharacterAsset {
  const b = new ModelBuilder('lille-remnant', REMNANT_RES);
  b.mat('body', ['#F3EAD0', '#EDE0BA', '#E6D2A2', '#CDB580', '#AE9662'], { base: 1, rough: 0.6, glow: 0.12, shadeK: 0.9 });
  b.mat('beak', ['#D8B070', '#C9A060', '#A47E44']);
  b.mat('eye', ['#F0C030'], { glow: 0.8 });
  b.mat('pupil', ['#2A1E10']);
  b.bone('root', null, [0, 0, 0]);
  b.bone('hips', 'root', [0, 26, 0]);
  b.bone('spine', 'hips', [0, 28, 0]);
  b.bone('chest', 'spine', [0, 31, 1]);
  b.bone('neck', 'chest', [0, 33, 3]);
  b.bone('head', 'neck', [0, 44, 5]);
  const sh: V3 = [4.2, 32, 1], el: V3 = [6.5, 28, -1], wr: V3 = [7.5, 24, -3];
  b.boneSym('shoulder.L', 'chest', [2, 32, 1]);
  b.boneSym('upperarm.L', 'shoulder.L', sh);
  b.boneSym('forearm.L', 'upperarm.L', el);
  b.boneSym('hand.L', 'forearm.L', wr);
  b.boneSym('palm.L', 'hand.L', wr);
  b.boneSym('fist.L', 'hand.L', wr);
  const hip: V3 = [2.2, 25, 0], knee: V3 = [2.4, 14, 2], ankle: V3 = [2.4, 2, -0.5];
  b.boneSym('thigh.L', 'hips', hip);
  b.boneSym('shin.L', 'thigh.L', knee);
  b.boneSym('foot.L', 'shin.L', ankle);
  // the body: an egg tipped forward
  const body = ellipsoid([0, 29, 0.5], [5, 4.2, 6.5], [-10, 0, 0]);
  b.add('chest', intersect(body, fn((_x, y) => 29 - y, [-9, 29, -9], [9, 36, 9])), 'body');
  b.add('hips', intersect(body, fn((_x, y) => y - 29, [-9, 22, -9], [9, 29, 9])), 'body');
  b.add('hips', spike([0, 28, -5], [0, 0.2, -1], 4, 2.4, 1.6, { tip: 0.5 }), 'body', { thr: 0.25 });
  // the neck: an S up to the head
  const np = smoothPath([[0, 32, 4], [0, 37, 3], [0, 41, 5], [0, 44, 5]], 3);
  b.add('neck', tube(np, np.map((_, i) => 1.6 - i * 0.02)), 'body');
  // the head: round, two big eyes facing forward, the hooked beak
  b.add('head', ellipsoid([0, 46, 5.4], [3.2, 2.9, 3.0]), 'body');
  for (const k of [1, -1]) {
    b.add('head', ellipsoid([k * 1.3, 46.6, 7.9], [1.1, 1.1, 0.6]), 'eye');
    b.voxel('head', k > 0 ? 1 : -2, 46, 8, 'pupil', 0);
  }
  b.add('head', spike([0, 45.6, 8.2], [0, -0.7, 0.7], 2.6, 0.9, 0.8, { tip: 0.3 }), 'beak', { thr: 0.25 });
  // stubby wings
  b.add('upperarm.L', blend(1, ellipsoid([sh[0] + 1, sh[1] - 2, sh[2] - 1], [1.6, 3.4, 3.2]), capsule(sh, el, 1.4, 1.2)), 'body', { mirror: true });
  b.add('forearm.L', ellipsoid([el[0] + 0.4, el[1] - 2.2, el[2] - 1.2], [1.2, 2.8, 2.6]), 'body', { mirror: true });
  for (const n of ['palm.L', 'fist.L']) b.add(n, sphere([wr[0], wr[1], wr[2]], 0.9), 'body', { mirror: true });
  // the long legs and the feet
  b.add('thigh.L', capsule(hip, knee, 1.3, 1.0), 'body', { mirror: true });
  b.add('shin.L', capsule(knee, ankle, 0.95, 0.8), 'beak', { mirror: true });
  b.add('foot.L', blend(0.5, sphere(ankle, 1.0), spike([ankle[0], 1, ankle[2]], [0, -0.1, 1], 4, 0.9, 0.7, { tip: 0.3 })), 'beak', { mirror: true });
  b.socket('mouth', 'head', [0, 45, 10.5]);
  b.socket('toe.L', 'foot.L', [ankle[0], 0.5, ankle[2] + 3]);
  b.socket('toe.R', 'foot.R', [-ankle[0], 0.5, ankle[2] + 3]);
  b.socket('grip.R', 'fist.R', [-wr[0], wr[1], wr[2]]);
  b.socket('grip.L', 'fist.L', [wr[0], wr[1], wr[2]]);
  b.autoShade();
  b.lint();
  return { model: b.build(), springs: [], colliders: [], warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- props

/** The halos, facing up: Jilliel's oversized thin green ring; the True Form's small spiked gold one. */
function buildHalo(gold: boolean): VoxelModel {
  const b = new ModelBuilder(gold ? 'lille-halo-gold' : 'lille-halo-green', 24);
  b.mat('halo', gold ? ['#FFF6D0', '#F8DC7C', '#F2C74E'] : ['#B4F7CF', '#7FEBA6', '#4FE38A'], { base: 1, glow: 1.4 });
  b.bone('root', null, [0, 0, 0]);
  if (!gold) b.add('root', torus([0, 0, 0], 17, 0.9), 'halo', { thr: 0.25 });
  else {
    b.add('root', torus([0, 0, 0], 6.5, 1.0), 'halo', { thr: 0.25 });
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      b.add('root', spike([Math.cos(a) * 6.6, 0, Math.sin(a) * 6.6], [Math.cos(a), 0, Math.sin(a)], 4.2, 1.2, 0.9, { tip: 0.3 }), 'halo', { thr: 0.25 });
    }
  }
  b.autoShade({ up: 0, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** Jilliel's head (48 vox/m): Lille's own head, the hat gone, both eyes open, white lines across the face. */
function buildGodHead(): VoxelModel {
  const b = new ModelBuilder('lille-head-god', 48);
  lilleHeadPalette(b, true);
  const s: HumanoidSpec = { ...LILLE_SPEC, chinY: 0 };
  b.bone('root', null, [0, 0, 0]);
  b.bone('neck', 'root', [0, -3, -0.8]);
  b.bone('head', 'neck', [0, 0.5, -0.8]);
  const L: Landmarks = { spec: s, headC: [0, s.head.h / 2, -0.5], elbow: [0, 0, 0], wrist: [0, 0, 0], knee: [0, 0, 0], ankle: [0, 0, 0] };
  lilleHead(b, L, 'god');
  b.autoShade();
  b.lint();
  return b.build();
}

/**
 * The True Form's head (18 vox/m, ≈ 1 m): fair, the white hair slicked straight back, round owl eyes under heavy lids that
 * close sideways, a hooked beak where the nose and mouth were. Its origin at the base of the skull.
 */
function buildOwlHead(): VoxelModel {
  const b = new ModelBuilder('lille-head-owl', 18);
  b.mat('skin', ['#F3E3D4', '#ECD6C3', '#DCC1AA', '#C4A68D', '#A68A72'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#F3F3F0', '#E8E8E3', '#D6D6D1', '#BDBDB8'], { base: 1, rough: 0.5, dither: 0.04 });
  b.mat('eye', ['#F8D460', '#F0C030', '#C99820'], { base: 1, glow: 0.6 });
  b.mat('pupil', ['#1E140A']);
  b.mat('lid', ['#C4A68D', '#A68A72']);
  b.mat('beak', ['#E2BE84', '#C9A060', '#A47E44', '#86642E'], { base: 1, rough: 0.4 });
  b.bone('root', null, [0, 0, 0]);
  // the skull: rounder and longer than a man's, the face flat like an owl's disc
  b.add('root', blend(2, ellipsoid([0, 9, 1], [8.5, 9.5, 9]), ellipsoid([0, 6.5, 4.5], [8, 7, 6])), 'skin');
  // the facial disc: a shallow dish round the eyes
  b.carve('root', ellipsoid([0, 8.5, 14.6], [8.4, 6.6, 3.2]));
  // the hair, slicked straight back from the brow
  b.add('root', fn((x, y, z) => {
    const d = Math.hypot(x / 9.2, (y - 9.8) / 10, (z - 0.4) / 9.6) - 1;
    return Math.max(d * 8, 12.5 - y + Math.max(0, z - 6) * 0.4);
  }, [-11, 4, -12], [11, 21, 12]), 'hair', { thr: 0.2 });
  b.paint('root', fn((x, y, z) => Math.abs(Math.sin(x * 1.1 + Math.sin(z * 0.3))) - 0.25 + (y < 13 ? 9 : 0), [-11, 10, -12], [11, 21, 12]), 'hair', { shade: 3, where: b.isMat('hair') });
  // the eyes: big and round, the pupils dark, the lids at the outer corners (they close sideways)
  for (const k of [1, -1]) {
    b.add('root', ellipsoid([k * 3.4, 9.6, 11.6], [2.6, 2.6, 1.6]), 'eye');
    b.add('root', ellipsoid([k * 3.4, 9.6, 12.8], [1.1, 1.2, 0.8]), 'pupil');
    b.add('root', fn((x, y, z) => Math.max(Math.abs(Math.hypot(x - k * 3.4, y - 9.6) - 3.0) - 0.6, Math.abs(z - 11.4) - 1.2, (x - k * 3.4) * -k - 0.4), [k * 3.4 - 5, 5, 9], [k * 3.4 + 5, 14, 14]), 'lid', { thr: 0.2 });
  }
  // the beak: hooked, from between the eyes down over where the mouth was
  b.add('root', spike([0, 7.8, 12.2], [0, -0.55, 0.85], 6.0, 1.8, 1.5, { side: [1, 0, 0], bend: [0, -0.5, -0.1], tip: 0.55 }), 'beak', { thr: 0.25 });
  b.add('root', capsule([0, 6.4, 14.6], [0, 2.8, 15.0], 0.9, 0.75), 'beak');
  b.autoShade();
  b.lint();
  return b.build();
}

/**
 * Trompete (8 vox/m, ≈ 6 m): a golden trumpet floating over him — the mouthpiece at the origin, a long tube along +Z
 * with a loop, the bell flaring at the end, a wing-like flourish of feathers swept back from the bell.
 */
function buildTrompete(): VoxelModel {
  const b = new ModelBuilder('lille-trompete', 8);
  b.mat('gold', ['#FFF6D0', '#F8DC7C', '#F2C74E', '#D9A93A', '#B88A2C'], { base: 2, rough: 0.3, metal: 0.6, glow: 0.5, shadeK: 0.85 });
  b.bone('root', null, [0, 0, 0]);
  const path = smoothPath([[0, 0, 0], [0, 0, 10], [0, 3, 18], [0, 6, 14], [0, 3, 10], [0, 0, 22], [0, 0, 34]], 5);
  b.add('root', tube(path, path.map(() => 1.2)), 'gold', { thr: 0.3 });
  b.add('root', cylinder([0, 0, -1], [0, 0, 1.5], 1.8), 'gold');
  // the bell
  b.add('root', fn((x, y, z) => {
    const t = (z - 30) / 18;
    const r = 1.4 + Math.pow(Math.max(0, t), 2.2) * 12;
    return Math.max(Math.abs(Math.hypot(x, y) - r) - 0.8, 30 - z, z - 48);
  }, [-15, -15, 29], [15, 15, 49]), 'gold', { thr: 0.25 });
  // the flourish: feathers swept back from the bell's rim, like a wing
  for (let i = 0; i < 7; i++) {
    const a = -0.96 + i * 0.32;
    const r = 7.6;
    b.add('root', spike([Math.sin(a) * r, Math.cos(a) * r, 44], [Math.sin(a) * 0.55, Math.cos(a) * 0.55 + 0.25, -1], 14 - Math.abs(i - 3) * 1.6, 2.2, 1.05, { side: [Math.cos(a), -Math.sin(a), 0], tip: 0.65 }), 'gold', { thr: 0.25 });
  }
  b.autoShade({ up: 0.4, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** Grow Arms: one more long white arm (16 vox/m), the pauldron at the origin, reaching along +Z, the fingers spread */
function buildExtraArm(): VoxelModel {
  const b = new ModelBuilder('lille-arm', 16);
  b.mat('arm', ['#F3F1EC', '#EDEBE5', '#DEDBD3', '#C6C2B9', '#ABA79E'], { base: 1, rough: 0.6, glow: 0.15, shadeK: 0.9 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', blend(1.2, ellipsoid([0, 1.2, 0], [4.4, 3, 4.4]), capsule([0, 0, 0], [0, -1, 18], 2.6, 2.2), capsule([0, -1, 18], [0, -2, 34], 2.1, 1.7)), 'arm');
  b.add('root', ellipsoid([0, -2.2, 36.5], [2.2, 1.3, 2.8]), 'arm');
  for (let i = 0; i < 4; i++) {
    const x = -1.8 + i * 1.2;
    b.add('root', capsule([x, -2.2, 38], [x * 1.6, -2.6, 46], 0.65, 0.45), 'arm', { thr: 0.3 });
  }
  b.autoShade({ up: 0.4, open: 1, front: 0 });
  b.lint();
  return b.build();
}
