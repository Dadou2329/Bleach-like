// Post-Dangai Ichigo (docs/kits/ichigo.md: Fake Karakura; dossier A1 §1 looks #8-#9, Bankai v2, Mugetsu).
// Brief: 181 cm ("noticeably taller") on the 84-vox skeleton. Bankai v2: the spiky orange hair grown long, down the
// upper back; a calm face (level brows); the Bankai coat open at the chest with white inner edges and crimson
// lining, the right sleeve gone — the right arm bare, a black glove on the right hand, the pommel chain spiralling
// up the arm with the end dangling from the biceps; the left sleeve long. The daitō's manji guard has longer, thinner
// prongs. Saigo no Getsuga Tenshō: black hair to the waist, red eyes, a blue-grey carapace of bandages wound round
// the torso, the right arm, the neck and the lower face (to just under the eyes), black flame marks across the chest
// and spiralling round the bare left arm, a tattered black cloak over the legs. Canon asymmetries (character's right
// = −X): the bare gloved right arm and its chain (v2); the bandaged right arm and the marked left (final).
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, intersect, prism, sphere, torus, type V3 } from '../models/sdf';
import {
  SPEC_ADULT_MALE, addBands, coatSkirt, faceLegend, feet, hakama, hands, head, humanoidSkeleton, kosodeTorso, shihakushoSprings, spikeHair,
  type Landmarks, type Spike,
} from './humanoid';
import { ICHIGO_HAIR, ichigoPalette, type CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

export type DangaiForm = 'bankai' | 'final';
export const DANGAI_RES = 84 / 1.81;
/** the Bankai v2 blade's tip and base (m, along +Z) */
export const DANGAI_TIP_Z = 44.5 / 48;
export const DANGAI_BASE_Z = 7.5 / 48;

function palette(b: ModelBuilder, form: DangaiForm): void {
  if (form === 'final') {
    b.mat('hair', ['#3E3D47', '#2E2D35', '#24232A', '#1A1A1F', '#141418'], { base: 2, rough: 0.6, shadeK: 0.8 });
    b.mat('brow', ['#1A1A1E']);
  }
  ichigoPalette(b);
  b.mat('edge', ['#F0EDE8', '#E9E6E1', '#C9C5BF'], { base: 1, rough: 0.8 });
  b.mat('glove', ['#2E2E35', '#1E1E24', '#141418'], { base: 1, rough: 0.55 });
  b.mat('chain', ['#565961', '#3A3C43', '#24252A'], { base: 1, rough: 0.35, metal: 0.8 });
  if (form === 'final') {
    b.mat('band', ['#C0C3C1', '#A6ACAD', '#858E91', '#6E7678', '#5B6162'], { base: 2, rough: 0.85, shadeK: 0.9, dither: 0.03 });
    b.mat('flame', ['#1E1E22', '#141418'], { base: 1, rough: 0.8 });
    b.mat('eyeR', ['#E8202E'], { rough: 0.3, glow: 2.2 });
    b.mat('void', ['#141418']);
    b.mat('cloak', ['#34333B', '#24232A', '#1A1A1F', '#141418'], { base: 1, rough: 0.9, shadeK: 1, dither: 0.04 });
  }
}

/** level brows, a closed mouth: the calm after the Dangai */
const FACE_CALM = [
  '. . . . . . . . . .',
  '. b B B . . B B b .',
  '. L L L . . L L L .',
  '. W * I . . * I W .',
  '. W i i . . i i W .',
  '. . . . . . . . . .',
  '. . . . . s . . . .',
  '. . . . . . . . . .',
  '. . . . m m . . . .',
  '. . . . . . . . . .',
];

/** red eyes over the bandage: the lower face is wound up to just under them */
const FACE_FINAL = [
  '. . . . . . . . . .',
  '. b B . . . . B b .',
  '. L L B . . B L L .',
  '. V R R . . R R V .',
  '. V R V . . V R V .',
];

/** Hair grown long: tapering spiky locks from the nape down the upper back (two spring bones), or (final) a straight
 *  black curtain to the waist (three). */
function mane(b: ModelBuilder, L: Landmarks, final: boolean): SpringDef[] {
  const c = L.spec.chinY;
  const P: V3[] = final
    ? [[0, c + 6, -6.2], [0, c - 8, -8.8], [0, c - 20, -9.4], [0, c - 33, -8.8]]
    : [[0, c + 5, -6.4], [0, c - 6, -8.6], [0, c - 17, -9.4]];
  const W = final ? [5.8, 6.6, 6.2, 5] : [5.8, 6.4, 4.4];
  const names = final ? ['mane1', 'mane2', 'mane3'] : ['mane1', 'mane2'];
  b.bone(names[0], 'head', P[0]);
  for (let i = 1; i < names.length; i++) b.bone(names[i], names[i - 1], P[i]);
  const slab = (a: V3, e: V3, w0: number, w1: number, t: number) => fn((x, y, z) => {
    const dy = e[1] - a[1], dz = e[2] - a[2];
    const len = Math.hypot(dy, dz);
    const along = ((y - a[1]) * dy + (z - a[2]) * dz) / len;
    const u = Math.max(0, Math.min(1, along / len));
    const py = a[1] + dy * u, pz = a[2] + dz * u;
    const w = w0 + (w1 - w0) * u;
    const px = a[0] + (e[0] - a[0]) * u;
    return Math.max(Math.abs(x - px) - w, Math.hypot(y - py, z - pz) - t, -along - 0.5, along - len - 0.5);
  }, [Math.min(a[0], e[0]) - Math.max(w0, w1) - 2, Math.min(a[1], e[1]) - 3, Math.min(a[2], e[2]) - t - 3], [Math.max(a[0], e[0]) + Math.max(w0, w1) + 2, Math.max(a[1], e[1]) + 3, Math.max(a[2], e[2]) + t + 3]);
  const locks = [-4.8, -2.4, 0, 2.4, 4.8];
  for (let i = 0; i < names.length; i++) {
    const last = i === names.length - 1;
    locks.forEach((x0, j) => {
      const dz = ((j * 5) % 3) * 0.35 - 0.35;
      const k0 = W[i] / 5.8, k1 = W[i + 1] / 5.8;
      // spiky locks taper to points at the end (final: blunt, straight)
      const endW = final ? 1.15 : last ? 0.35 : 1.05;
      const drop = last ? (final ? (j % 2) * 1.6 : [2.5, 0, 3.5, 1, 3][j]) : 0;
      const a: V3 = [x0 * k0, P[i][1] + (i === 0 ? 0 : 0.6), P[i][2] + dz];
      const e: V3 = [x0 * k1 * (last && !final ? 1.15 : 1), P[i + 1][1] - drop, P[i + 1][2] + dz];
      b.add(names[i], slab(a, e, 1.4 - i * 0.06, endW, 1.3 - i * 0.08), 'hair', { thr: 0.2 });
    });
  }
  b.add(names[0], ellipsoid([0, c + 3.6, -6.6], [6.3, 3.4, 2.2]), 'hair', { thr: 0.2 });
  for (const k of [-1, 1]) b.add(names[0], capsule([k * 5.2, c + 4, -4.6], [k * 6.2, c - 3, -6.4], 1.5, 1.2), 'hair', { thr: 0.25 });
  b.paint(names, fn((x) => Math.abs((((x + 31.3) % 1.9) + 1.9) % 1.9 - 0.95) - 0.28, [-9, c - 36, -14], [9, c + 10, 0]), 'hair', { shade: 3, where: b.isMat('hair') });
  const springs: SpringDef[] = [];
  for (let i = 0; i < names.length; i++) {
    const t: V3 = [(P[i + 1][0] - P[i][0]) / DANGAI_RES, (P[i + 1][1] - P[i][1]) / DANGAI_RES, (P[i + 1][2] - P[i][2]) / DANGAI_RES];
    springs.push({ bone: names[i], tail: t, stiffness: [24, 17, 12][i], damping: 5, gravity: 13, limit: [65, 80, 90][i], radius: 0.09 });
  }
  return springs;
}

/** The final form's hair: smoother, sleeker spikes swept back. */
const FINAL_HAIR: Spike[] = [
  { az: 0, el: 64, len: 3.6, r: 4.2, flow: [0, 0.1, -0.9] },
  { az: -40, el: 58, len: 3.6, r: 4, flow: [0, 0.05, -0.9] },
  { az: 40, el: 58, len: 3.6, r: 4, flow: [0, 0.05, -0.9] },
  { az: -90, el: 40, len: 3, r: 3.8, flow: [0, -0.3, -0.8] },
  { az: 90, el: 40, len: 3, r: 3.8, flow: [0, -0.3, -0.8] },
  { az: 180, el: 50, len: 3.4, r: 4.2, flow: [0, -0.4, -0.7] },
  { az: -30, el: 46, len: 4.5, r: 2.9, flow: [-0.1, -0.5, 0.35], bend: [-0.1, -1.2, -0.4], bone: 'bangs' },
  { az: 0, el: 52, len: 5.5, r: 3, flow: [0, -0.5, 0.35], bend: [0, -1.25, -0.45], bone: 'bangs' },
  { az: 30, el: 46, len: 4.5, r: 2.9, flow: [0.1, -0.5, 0.35], bend: [0.1, -1.2, -0.4], bone: 'bangs' },
];

/** Bankai v2's left coat sleeve: long, flaring to a ragged cuff with crimson inside. */
function leftSleeve(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', cylinder([sx + 0.3, ey - 1.5, sz - 0.3], [sx + 0.1, sy + 0.5, sz - 0.1], 3.6, 3.1, 1.3), 'coat');
  b.add('upperarm.L', sphere([sx, sy - 0.5, sz], 2.9), 'coat');
  b.add('forearm.L', cylinder([sx + 0.5, wy - 1.5, sz - 0.6], [sx + 0.4, ey + 1.5, sz - 0.3], 4.6, 3.6, 1), 'coat');
  b.add('forearm.L', sphere([sx + 0.3, ey, sz - 0.2], 3.4), 'coat');
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    b.carve('forearm.L', box([sx + 0.5 + Math.sin(a) * 4.4, wy - 1.8, sz - 0.6 + Math.cos(a) * 4.4], [0.9, 1.4, 0.9], { rot: [0, (a * 180) / Math.PI, 25] }));
  }
  b.carve('forearm.L', cylinder([sx + 0.5, wy - 2.5, sz - 0.6], [sx + 0.5, wy + 2.2, sz - 0.6], 3.4, 3.2));
  b.paint('forearm.L', cylinder([sx + 0.5, wy - 2.5, sz - 0.6], [sx + 0.5, wy + 3.2, sz - 0.6], 4.1, 3.9), 'lining');
  b.add('forearm.L', capsule([sx, wy + 6, sz], [sx, wy - 0.5, sz], 1.9), 'skin', { only: 'empty' });
}

/** A bare arm (skin) on one side: the shoulder ball, the upper arm and the forearm. */
function bareArm(b: ModelBuilder, L: Landmarks, side: 'L' | 'R', mat = 'skin'): void {
  const s = L.spec;
  const k = side === 'L' ? 1 : -1;
  const [sx0, sy, sz] = s.shoulder;
  const sx = sx0 * k;
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add(`upperarm.${side}`, blend(1.4, sphere([sx, sy - 0.5, sz], 3), capsule([sx, sy - 1, sz], [sx, ey + 1, sz], 2.7, 2.3)), mat);
  b.add(`forearm.${side}`, blend(1.2, sphere([sx, ey, sz], 2.3), capsule([sx, ey - 0.5, sz], [sx, wy + 1, sz], 2.3, 1.9)), mat);
}

/** The pommel chain spiralling up the bare right arm, the slack end dangling from the biceps. */
function armChain(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx0, sy, sz] = s.shoulder;
  const sx = -sx0;
  const ey = L.elbow[1], wy = L.wrist[1];
  const helix = (bone: string, y0: number, y1: number, r: number, turns: number, n: number) => {
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const a = u * turns * Math.PI * 2;
      const y = y0 + (y1 - y0) * u;
      const p: V3 = [sx + Math.cos(a) * r, y, sz + Math.sin(a) * r];
      b.add(bone, torus(p, 0.9, 0.36, [i % 2 ? 0 : 90, (-a * 180) / Math.PI, 20]), 'chain', { thr: 0.25 });
    }
  };
  helix('forearm.R', wy + 0.8, ey - 0.5, 2.55, 2.2, 15);
  helix('upperarm.R', ey + 0.5, sy - 7, 3, 1.2, 9);
  // the slack: a short hanging length from the biceps
  for (let i = 0; i < 4; i++) b.add('upperarm.R', torus([sx - 2.6, sy - 8.5 - i * 1.7, sz + 1.6], 0.85, 0.34, [i % 2 ? 0 : 90, 90, 0]), 'chain', { thr: 0.25 });
}

/** Saigo no Getsuga Tenshō: the bandage carapace, the flame marks, the bandaged lower face. */
function finalBody(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }): void {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const torso = blend(3,
    box([0, s.chestY - 0.5, -0.3], [cx + 0.4, 6, cz + 0.4], { round: 3.2 }),
    box([0, s.waistY, -0.2], [wx + 0.4, 4.6, wz + 0.4], { round: 2.8 }),
    box([0, s.hipsY + 0.5, -0.3], [s.hips[0] + 0.3, 3.6, s.hips[1] + 0.3], { round: 2.4 }),
    capsule([2.4, sy + 1.4, sz - 0.8], [sx - 1.5, sy - 0.2, sz], 2.9, 3),
    capsule([-2.4, sy + 1.4, sz - 0.8], [-sx + 1.5, sy - 0.2, sz], 2.9, 3),
    sphere([sx, sy - 0.5, sz], 3.2), sphere([-sx, sy - 0.5, sz], 3.2));
  addBands(b, torso, 'band', [['hips', 36, 45], ['spine', 45, 56], ['chest', 54, 80]]);
  // the windings: shallow diagonal grooves round the body
  b.paint(['chest', 'spine', 'hips'], fn((x, y, z) => {
    const a = Math.atan2(x, z) * 2.2;
    return Math.abs((((y + a) % 2.6) + 2.6) % 2.6 - 1.3) - 0.32;
  }, [-14, 36, -10], [14, 76, 10]), 'band', { shade: 3, where: b.isMat('band') });
  // the black flame marks across the chest: tongues rising from a band under the pectorals
  b.paint(['chest', 'spine'], fn((x, y, z) => {
    const tongue = Math.abs(Math.sin(x * 0.75 + 0.6)) * 5.5 + Math.abs(Math.sin(x * 1.7)) * 1.5;
    const base = s.chestY - 4;
    return Math.max(base - 1.2 - y, y - (base + tongue), -z);
  }, [-12, s.chestY - 8, -2], [12, s.chestY + 6, 10]), 'flame', { where: b.isMat('band') });
  // the right arm wound, the left bare with a flame spiral
  bareArm(b, L, 'R', 'band');
  bareArm(b, L, 'L');
  b.paint(['forearm.R', 'upperarm.R'], fn((x, y, z) => Math.abs((((y + Math.atan2(z, x + sx) * 1.4) % 2.4) + 2.4) % 2.4 - 1.2) - 0.3, [-16, 20, -6], [-4, 70, 6]), 'band', { shade: 3, where: b.isMat('band') });
  b.paint(['forearm.L', 'upperarm.L'], fn((x, y, z) => {
    const a = Math.atan2(z - sz, x - sx);
    const u = (((y * 0.32 + a / (Math.PI * 2)) % 1) + 1) % 1;
    return Math.abs(u - 0.5) * 6 - 1.1 - Math.abs(Math.sin(y * 1.3)) * 0.6;
  }, [4, 20, -6], [16, 70, 6]), 'flame', { where: b.isMat('skin') });
  // the neck and the lower face wound to just under the eyes
  b.add('neck', capsule([0, s.chinY - 5, L.headC[2] - 0.5], [0, s.chinY + 2, L.headC[2] - 0.5], L.spec.neckR + 0.5), 'band');
  b.add('head', intersect(
    ellipsoid([0, hd.chin + 2.4, L.headC[2] + 0.4], [s.head.w / 2 + 0.7, 3.4, s.head.d / 2 + 0.8]),
    fn((_x, y) => y - (hd.chin + 4.6), [-8, hd.chin - 4, -8], [8, hd.chin + 6, 10]),
  ), 'band');
  b.paint('head', fn((x, y) => Math.abs((((y + x * 0.4) % 1.8) + 1.8) % 1.8 - 0.9) - 0.25, [-8, hd.chin - 2, -8], [8, hd.chin + 5, 10]), 'band', { shade: 3, where: b.isMat('band') });
}

const assetCache = new Map<DangaiForm, CharacterAsset>();

export function dangaiAsset(form: DangaiForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildDangai(form)));
  return a;
}

export function buildDangai(form: DangaiForm = 'bankai'): CharacterAsset {
  const final = form === 'final';
  const b = new ModelBuilder(`ichigo-dangai-${form}`, DANGAI_RES);
  palette(b, form);
  const s = SPEC_ADULT_MALE;
  const L = humanoidSkeleton(b, s, { sleeves: true, hakama: !final });
  b.socket('grip.R', 'fist.R', [-L.wrist[0] + 0.1, L.wrist[1] - 4.3, L.wrist[2] + 0.4]);
  b.socket('grip.L', 'fist.L', [L.wrist[0] - 0.1, L.wrist[1] - 4.3, L.wrist[2] + 0.4]);
  b.socket('palm.R', 'palm.R', [-L.wrist[0], L.wrist[1] - 5, L.wrist[2] + 1]);
  b.socket('palm.L', 'palm.L', [L.wrist[0], L.wrist[1] - 5, L.wrist[2] + 1]);
  b.socket('back', 'chest', [1, 62, -7.5]);
  b.socket('face', 'head', [0, s.chinY + 5.5, Math.round(L.headC[2] + s.head.d / 2)]);
  b.socket('chest.front', 'chest', [0, 61, 7]);
  b.socket('forearm.R', 'forearm.R', [-s.shoulder[0], L.elbow[1] - 6, 0]);
  // the striking surfaces (the Final Getsuga form fights with its arm, the spent human with fists and feet)
  b.socket('knuckle.R', 'fist.R', [-L.wrist[0], L.wrist[1] - 4.3, L.wrist[2] + 3.4]);
  b.socket('knuckle.L', 'fist.L', [L.wrist[0], L.wrist[1] - 4.3, L.wrist[2] + 3.4]);
  b.socket('toe.R', 'foot.R', [-L.ankle[0], 1.5, L.ankle[2] + s.foot.len - s.foot.heel]);
  b.socket('toe.L', 'foot.L', [L.ankle[0], 1.5, L.ankle[2] + s.foot.len - s.foot.heel]);
  b.socket('heel.R', 'foot.R', [-L.ankle[0], 1.5, L.ankle[2] - s.foot.heel]);

  const hd = head(b, L, 'skin');
  b.bone('bangs', 'head', [0, s.chinY + 0.5, -0.8]);
  spikeHair(b, L, 'hair', final ? FINAL_HAIR : ICHIGO_HAIR, [], { tufts: final ? 30 : 46 });
  b.carve(['head', 'bangs'], aabb([-5, hd.chin + 4, hd.front], [-1, hd.chin + 7, hd.front + 6]));
  b.carve(['head', 'bangs'], aabb([1, hd.chin + 4, hd.front], [5, hd.chin + 7, hd.front + 6]));
  const legend = faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' });
  if (final) b.stamp('head', hd.x0, hd.chin + 9, FACE_FINAL, { ...legend, V: { mat: 'void' }, R: { mat: 'eyeR' } }, hd.front - 1);
  else {
    b.stamp('head', hd.x0, hd.chin + 9, FACE_CALM, legend, hd.front - 1);
    b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  }
  hands(b, L, 'skin');
  const springs: SpringDef[] = [...mane(b, L, final)];
  const colliders: ColliderDef[] = [];
  if (final) {
    finalBody(b, L, hd);
    // legs under the cloak, dark; the tattered black cloak over them
    const [hx, hy] = s.hip;
    for (const k of [-1, 1]) {
      const side = k > 0 ? 'L' : 'R';
      b.add(`thigh.${side}`, blend(1.5, sphere([k * hx, hy, 0], 4), capsule([k * hx, hy, 0], [k * hx, L.knee[1], 0.2], 3.6, 3)), 'cloak');
      b.add(`shin.${side}`, capsule([k * hx, L.knee[1], 0.2], [k * hx, L.ankle[1] + 1.5, -0.2], 3, 2.5), 'cloak');
      b.add(`foot.${side}`, blend(1, capsule([k * hx, L.ankle[1] + 2, -0.4], [k * hx, 1.5, -0.4], 2.2), box([k * hx, 1.5, 2.5], [2.2, 1.5, 4.6], { round: 1.2 })), 'cloak');
    }
    b.add('hips', box([0, s.hipsY - 1, -0.3], [s.hips[0] + 1.2, 4, s.hips[1] + 1.2], { round: 2.4 }), 'cloak');
    const cloak = coatSkirt(b, L, { mat: 'cloak', lining: 'cloak', tatter: true, tatterDepth: 8, tatterTeeth: 1, openFront: 4, yTop: s.waistY - 1, yHem: 3, r0: 9.4, r1: 13.8, thick: 1.3, res: DANGAI_RES });
    springs.push(...cloak.springs);
    colliders.push(...cloak.colliders);
  } else {
    feet(b, L, 'tabi', 'straw', 'cord');
    // the coat, open at the chest with white edges; the right sleeve gone
    const o = { black: 'coat', collar: 'edge', skin: 'skin', obi: 'coat', crossY: s.chestY - 7 };
    kosodeTorso(b, L, o);
    leftSleeve(b, L);
    bareArm(b, L, 'R');
    // the black glove on the right hand
    b.paint(['fist.R', 'palm.R'], aabb([-20, 0, -20], [0, 40, 20]), 'glove', { where: b.isMat('skin') });
    b.add('forearm.R', cylinder([-s.shoulder[0], L.wrist[1] - 0.2, s.shoulder[2]], [-s.shoulder[0], L.wrist[1] + 2.4, s.shoulder[2]], 2.3), 'glove');
    armChain(b, L);
    hakama(b, L, { black: 'black', collar: 'edge', skin: 'skin', obi: 'coat', hemR: 6.4 });
    const tails = coatSkirt(b, L, { mat: 'coat', lining: 'lining', tatter: true, openFront: 10, res: DANGAI_RES });
    const base = shihakushoSprings();
    springs.push(...base.springs.filter((sp) => sp.bone !== 'sleeve.R'), ...tails.springs);
    colliders.push(...base.colliders, ...tails.colliders);
  }
  b.autoShade();
  b.lint();
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

let swordV2: VoxelModel | null = null;

/** Tensa Zangetsu v2: the black daitō, its manji guard's four prongs longer and thinner; no chain on the pommel (it is on his arm). */
export function dangaiSword(): VoxelModel {
  return (swordV2 ??= buildTensaV2());
}

function buildTensaV2(): VoxelModel {
  const b = new ModelBuilder('tensa-zangetsu-v2', 48);
  b.mat('blade', ['#3B4250', '#1E2026', '#141418'], { base: 1, rough: 0.25, metal: 0.7, shadeK: 0.7 });
  b.mat('edge', ['#5C6678'], { rough: 0.15, metal: 0.8 });
  b.mat('guard', ['#2A2A30', '#18181C', '#141418'], { base: 1, rough: 0.4, metal: 0.6 });
  b.mat('wrap', ['#2E2E33', '#232327', '#18181B'], { base: 1, rough: 0.9 });
  b.mat('ray', ['#4A4A52']);
  b.bone('root', null, [0, 0, 0]);
  const z0 = 7.5, zEnd = 41, zTip = 44.5;
  b.add('root', prism([[z0, -1.6], [zEnd, -1.6], [zTip, 1.4], [z0, 1.4]], [0, 0, 0], [0, 0, 1], [0, 1, 0], 0.55), 'blade');
  b.paint('root', fn((x, y, z) => y - (-1.2 + Math.max(0, z - zEnd) * 0.85), [-2, -3, 0], [2, 3, 50]), 'edge');
  b.add('root', box([0, -0.1, 7.2], [1, 1.9, 0.7], { round: 0.3 }), 'guard');
  // the manji: four prongs, longer and thinner than in the first Bankai, the bent ends drawn out
  for (let k = 0; k < 4; k++) {
    const r = (k * Math.PI) / 2;
    const rot = (p: [number, number]): V3 => [p[0] * Math.cos(r) - p[1] * Math.sin(r), p[0] * Math.sin(r) + p[1] * Math.cos(r), 6.2];
    b.add('root', capsule(rot([0, 0.8]), rot([0, 5.6]), 0.55), 'guard', { thr: 0.2 });
    b.add('root', capsule(rot([0, 5.6]), rot([-4.6, 5.9]), 0.55, 0.4), 'guard', { thr: 0.2 });
  }
  b.add('root', cylinder([0, 0, 5.6], [0, 0, 6.9], 1.6), 'guard');
  b.add('root', box([0, 0, -1.2], [1.25, 1.35, 6.6], { round: 0.5 }), 'wrap');
  b.paint('root', fn((x, y, z) => Math.abs(((Math.abs(y) + z) % 3 + 3) % 3 - 1.5) - 0.55, [-2, -2, -8], [2, 2, 5.4]), 'ray', { where: b.isMat('wrap') });
  b.add('root', box([0, 0, -8.1], [1.4, 1.5, 0.6], { round: 0.4 }), 'guard');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}


/** Mugetsu's blade (m along +Z): its base at the fist and its point */
export const MUGETSU_BASE_Z = 4 / 48;
export const MUGETSU_TIP_Z = 80 / 48;

let mugetsuV: VoxelModel | null = null;

/**
 * Mugetsu's blade: the black reiatsu drawn out of the wound right hand into a long, thin, guardless blade, its edge
 * a smouldering crimson line, ragged wisps tearing off its back.
 */
export function mugetsuBlade(): VoxelModel {
  return (mugetsuV ??= buildMugetsu());
}

function buildMugetsu(): VoxelModel {
  const b = new ModelBuilder('mugetsu-blade', 48);
  b.mat('void', ['#2C2A33', '#1E1D24', '#17161B', '#141418'], { base: 1, rough: 0.7, shadeK: 0.6 });
  b.mat('ember', ['#9A0E18'], { glow: 1.6 });
  b.bone('root', null, [0, 0, 0]);
  const z0 = 3, zEnd = 70, zTip = 80;
  // the hilt is the fist's own black, wound into the blade
  b.add('root', box([0, 0.2, 0.5], [1.5, 1.7, 3.2], { round: 0.8 }), 'void');
  b.add('root', prism([[z0, -2.2], [zEnd, -2.2], [zTip, 1.6], [z0, 1.6]], [0, 0, 0], [0, 0, 1], [0, 1, 0], 0.7), 'void');
  b.paint('root', fn((_x, y, z) => y - (-1.7 + Math.max(0, z - zEnd) * 0.4), [-2, -3, 0], [2, 3, zTip + 2]), 'ember');
  // the wisps: ragged teeth leaning back off the blade's back, longer toward the hand
  for (let i = 0; i < 7; i++) {
    const z = 8 + i * 9 + (i % 2) * 2;
    const h = 2.6 - i * 0.22;
    b.add('root', capsule([0, 1.4, z], [0, 1.4 + h, z - 3.4], 0.55, 0.3), 'void', { thr: 0.2 });
  }
  b.autoShade({ up: 0.3, open: 2, front: 0 });
  b.lint();
  return b.build();
}
