// Ichigo's Hollowfied "lizard" body — the Visored training, when the Hollow took the body while Ichigo fought it
// inside (docs/kits/ichigo.md §4 Hollowfied; dossier A1 §1 look #6, §0 row 6 and the "Hollow bodies" palette). Brief:
// 84 vox on a heavier frame than the Shinigami body (broader shoulders, a deeper chest, thick forearms) plus a 42-vox
// tail. Silhouette keys: the long thick tail, the bony spikes on the shoulders, the clawed hunch, the near-full mask.
// Lizard-white skin (#ECE6E8 → #C8BEC4) with dark maroon markings (#7E3940 → #4B1F23): chevrons over the chest and the
// back, bands round the arms, the shins and the tail; white bone spikes (#DDD8D2) on the shoulders; long talons on the
// fingers; three-toed taloned feet with an extra back toe at the ankle; maroon fur at the wrists and ankles; the orange
// hair grown to the shoulder blades; the black hakama torn to mid-shin and the white obi. The mask is a prop
// (`lizardMask`, on the 'face' socket): the first full mask — a skull with a jaw full of teeth, a rounded forehead,
// three red stripes on the left — grown back over the crown and the sides, broken open round the right eye only. The
// arm-maw (`wormHead`, `wormSegment`): the worm that lunges from the stump when the left arm is blown off — white
// flesh ringed in maroon, a round mouth of teeth, a studded tongue. Canon asymmetries (character's right = −X): the
// mask's stripes on the left, the right eye uncovered.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, sphere, spike, type V3 } from '../models/sdf';
import { SPEC_ADULT_MALE, addBands, hakama, hands, humanoidSkeleton, obi, type HumanoidSpec, type Landmarks } from './humanoid';
import { ichigoPalette, type CharacterAsset } from './ichigo';
import { humanHead } from './ichigoHuman';
import { mane, tatters } from './ichigoHollow';
import type { ColliderDef, SpringDef } from '../anim/springs';

const RES = 48;

/** the heavier frame: broader shoulders, a deeper chest, thicker arms (same bone lengths as the Shinigami body) */
export const SPEC_LIZARD: HumanoidSpec = { ...SPEC_ADULT_MALE, shoulder: [10.2, 66.5, -0.5], chest: [9.4, 5.7], waist: [7.6, 4.8], hips: [8, 5.1], armR: 3, neckR: 3 };

/** the tail's spine: the root at the small of the back, sweeping back and down, the tip held off the ground */
export const LIZARD_TAIL: V3[] = [[0, 44, -5], [0, 37.5, -13], [0, 31, -21.5], [0, 25, -30], [0, 20.5, -39]];
const TAIL_R = [3.6, 3.1, 2.4, 1.7, 0.9];

function palette(b: ModelBuilder): void {
  b.mat('skin', ['#F3EFF0', '#ECE6E8', '#DDD5D8', '#C8BEC4', '#A79CA3'], { base: 1, rough: 0.55, shadeK: 0.9 });
  ichigoPalette(b);
  b.mat('mark', ['#7E3940', '#64292F', '#4B1F23'], { base: 1, rough: 0.6 });
  b.mat('spike', ['#F0ECE6', '#DDD8D2', '#C4BEB6', '#A39C94'], { base: 1, rough: 0.4, shadeK: 0.9 });
  b.mat('claw', ['#F3EEE7', '#DDD5CB', '#B9B0A8'], { base: 0, rough: 0.3 });
  b.mat('fur', ['#9A4A52', '#7E3940', '#64292F', '#4B1F23'], { base: 1, rough: 0.9, shadeK: 0.9, dither: 0.12 });
}

let cached: CharacterAsset | null = null;

/** Cached: the Hollowfied body. */
export function lizardAsset(): CharacterAsset {
  return (cached ??= buildIchigoLizard());
}

export function buildIchigoLizard(): CharacterAsset {
  const b = new ModelBuilder('ichigo-lizard', RES);
  palette(b);
  const s = SPEC_LIZARD;
  const L = humanoidSkeleton(b, s, { hakama: true });
  const [wx, wy, wz] = L.wrist;
  const [sx, sy, sz] = s.shoulder;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx, wy - 5, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx, wy - 5, wz + 1]);
  // the two-finger Cero gathers at the tips of the right hand's fingers
  b.socket('fingers.R', 'palm.R', [-wx + 0.2, wy - s.hand - 1.5, wz + 0.6]);
  b.socket('knuckle.R', 'fist.R', [-wx, wy - 4.3, wz + 3.4]);
  b.socket('knuckle.L', 'fist.L', [wx, wy - 4.3, wz + 3.4]);
  b.socket('chest.front', 'chest', [0, s.chestY + 2.4, 7]);
  b.socket('back', 'chest', [1, 62, -7.5]);
  // the stump the worm comes out of when the left arm is gone
  b.socket('shoulder.L', 'chest', [sx, sy - 1, sz]);
  const hd = humanHead(b, L, true, 46);
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('mouth', 'head', [0, s.chinY + 1.5, hd.front + 2]);
  const maneSprings = mane(b, L, 0.5);
  body(b, L);
  hands(b, L, 'skin');
  talons(b, L);
  const o = { black: 'black', collar: 'black', skin: 'skin', obi: 'obi', hakamaHem: 15, hemR: 8.4 };
  obi(b, L, o);
  hakama(b, L, o);
  tatters(b, L, 15, 8.4);
  legs(b, L);
  fur(b, L);
  const tailSprings = tail(b);
  b.socket('tailTip', 'tail4', LIZARD_TAIL[4]);
  b.autoShade();
  b.lint();
  const springs: SpringDef[] = [...maneSprings, ...tailSprings];
  for (const side of ['L', 'R']) springs.push({ bone: `hakama.${side}`, tail: [0, -0.4, 0], stiffness: 70, damping: 6, gravity: 8, limit: 55, radius: 0.12 });
  const colliders: ColliderDef[] = [
    { bone: 'shin.L', offset: [0, -0.15, 0], radius: 0.08 },
    { bone: 'shin.R', offset: [0, -0.15, 0], radius: 0.08 },
    { bone: 'chest', offset: [0, 0.05, -0.02], radius: 0.19 },
    { bone: 'spine', offset: [0, 0, -0.02], radius: 0.17 },
    { bone: 'hips', offset: [0, 0.02, -0.02], radius: 0.18 },
  ];
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- body

/** Heavy, hard white muscle; the maroon markings; the bone spikes on the shoulders. */
function body(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  const torso = blend(3,
    box([0, s.chestY - 0.5, -0.3], [cx, 6.2, cz], { round: 3.3 }),
    box([0, s.waistY, -0.2], [wx, 4.6, wz], { round: 2.8 }),
    box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 3.6, s.hips[1]], { round: 2.4 }),
    // the trapezius rising to the neck, the shoulder caps
    capsule([2.6, sy + 1.8, sz - 1], [sx - 1.5, sy - 0.2, sz], 3.2, 3.3),
    capsule([-2.6, sy + 1.8, sz - 1], [-sx + 1.5, sy - 0.2, sz], 3.2, 3.3),
    sphere([sx, sy - 0.5, sz], 3.5), sphere([-sx, sy - 0.5, sz], 3.5),
    // pectorals and the lats flaring under the arms
    ellipsoid([3.6, s.chestY + 1, cz - 0.5], [4.1, 3.2, 2]), ellipsoid([-3.6, s.chestY + 1, cz - 0.5], [4.1, 3.2, 2]),
    ellipsoid([cx - 1.2, s.chestY - 2.5, -1.2], [2.2, 4.5, 3.8]), ellipsoid([-cx + 1.2, s.chestY - 2.5, -1.2], [2.2, 4.5, 3.8]));
  addBands(b, torso, 'skin', [['hips', 36, 45], ['spine', 45, 56], ['chest', 54, 80]]);
  b.add('upperarm.L', blend(1.4, sphere([sx, sy - 0.5, sz], 3.4), capsule([sx, sy - 1, sz], [sx, ey + 1, sz], 3.1, 2.6)), 'skin', { mirror: true });
  // a thick forearm, swelling below the elbow
  b.add('forearm.L', blend(1.2, sphere([sx, ey, sz], 2.6), capsule([sx, ey - 0.5, sz], [sx, ey - 4, sz + 0.3], 2.6, 2.8), capsule([sx, ey - 4, sz + 0.3], [sx, wy + 1, sz], 2.8, 2)), 'skin', { mirror: true });
  // the lines of the muscle: under the pecs, the abdominal grid
  for (const k of [-1, 1]) b.paint('chest', capsule([k * 0.8, s.chestY - 2, cz + 1.2], [k * 6.4, s.chestY - 1.3, cz - 0.4], 0.4), 'skin', { shade: 3 });
  b.paint(['chest', 'spine'], capsule([0, s.chestY - 2, cz + 1.2], [0, s.waistY - 2, wz + 0.8], 0.35), 'skin', { shade: 3 });
  for (const y of [s.chestY - 4.8, s.waistY + 2.2]) b.paint(['chest', 'spine'], capsule([-3.2, y, wz + 0.8], [3.2, y, wz + 0.8], 0.32), 'skin', { shade: 3 });
  // the markings, laid on like a projection (front and back halves): two maroon chevrons over each side of the chest
  // running in and down to the sternum, three short slashes along each flank, the same chevrons down the back
  const seg2 = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
    const dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(px - ax - dx * t, py - ay - dy * t);
  };
  const strokes = (front: boolean): [number, number, number, number, number][] => {
    const out: [number, number, number, number, number][] = [];
    for (const k of [-1, 1]) {
      out.push([k * 8.8, s.chestY + 4.6, k * 2.2, s.chestY - 1.4, 0.85]);
      out.push([k * 9.4, s.chestY + 0.6, k * 3.4, s.chestY - 5.4, 0.8]);
      if (front) for (const [y, l] of [[s.waistY + 3.6, 3.6], [s.waistY + 0.6, 3.2], [s.waistY - 2.4, 2.8]]) out.push([k * (wx + 1.2), y, k * (wx + 1.2 - l), y - 1.4, 0.7]);
      else out.push([k * 8.4, s.chestY - 3, k * 2.6, s.waistY + 1, 0.8]);
    }
    return out;
  };
  for (const front of [true, false]) {
    const list = strokes(front);
    b.paint(['chest', 'spine', 'hips'], fn((x, y, z) => {
      if (front ? z < 0.5 : z > -0.5) return 1;
      let d = Infinity;
      for (const [ax, ay, bx, by, w] of list) d = Math.min(d, seg2(x, y, ax, ay, bx, by) - w);
      return d;
    }, [-16, s.hipsY - 6, -12], [16, s.chinY, 12]), 'mark', { where: b.isMat('skin') });
  }
  // bands round the arms
  const band = (y0: number, w: number) => fn((_x, y) => Math.abs(y - y0) - w, [-30, y0 - 3, -12], [30, y0 + 3, 12]);
  for (const y of [wy + 3.4, wy + 6.6, ey - 3.6]) b.paint('forearm.L', band(y, 0.7), 'mark', { mirror: true, where: b.isMat('skin') });
  for (const y of [ey + 4.6, ey + 8.4]) b.paint('upperarm.L', band(y, 0.75), 'mark', { mirror: true, where: b.isMat('skin') });
  // the bone spikes on the shoulders: three on each, up, out and back
  b.add('upperarm.L', spike([sx + 1.2, sy + 2.2, sz - 0.6], [0.4, 1, -0.25], 8, 1.9, 1.5, { tip: 0.2, bend: [0.06, 0, -0.04] }), 'spike', { mirror: true, thr: 0.25 });
  b.add('upperarm.L', spike([sx + 3, sy + 0.6, sz - 1.2], [0.95, 0.5, -0.3], 6.5, 1.7, 1.3, { tip: 0.2 }), 'spike', { mirror: true, thr: 0.25 });
  b.add('upperarm.L', spike([sx + 1, sy + 1.2, sz - 2.8], [0.3, 0.7, -0.95], 5.5, 1.5, 1.2, { tip: 0.2 }), 'spike', { mirror: true, thr: 0.25 });
  b.add('upperarm.L', ellipsoid([sx + 1.4, sy + 1.2, sz - 1.2], [2.4, 1.6, 2.4]), 'spike', { mirror: true });
}

/** Long talons on the open fingers, shorter hooks over the fist. */
function talons(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [wx, wy, wz] = L.wrist;
  for (let i = 0; i < 4; i++) {
    const z = wz - 1.2 + i * 1.3;
    b.add('palm.L', spike([wx - 0.3, wy - s.hand + 1.6, z], [-0.25, -1, 0.15], 3.4, 0.62, 0.55, { tip: 0.15, bend: [-0.1, 0, 0] }), 'claw', { mirror: true, thr: 0.3 });
    b.add('fist.L', spike([wx - 2, wy - 6.6, z + 0.6], [-0.4, -0.5, 0.8], 2.6, 0.58, 0.55, { tip: 0.15 }), 'claw', { mirror: true, thr: 0.3 });
  }
  b.add('palm.L', spike([wx - 1.4, wy - 5.2, wz + 3.6], [-0.3, -0.6, 0.75], 2.4, 0.6, 0.55, { tip: 0.2 }), 'claw', { mirror: true, thr: 0.3 });
}

/** Bare white shins below the torn hem, three-toed taloned feet, the extra toe at the back of the ankle. */
function legs(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [ax, ay, az] = L.ankle;
  const ky = L.knee[1];
  const f = s.foot;
  const toeZ = az + f.len - f.heel;
  b.add('shin.L', blend(1, capsule([ax, ky + 1, 0], [ax, ky - 5, 0.3], 2.8, 3), capsule([ax, ky - 5, 0.3], [ax, ay + 2, 0], 3, 2.2)), 'skin', { mirror: true });
  b.add('foot.L', capsule([ax, ay + 3, az - 0.5], [ax, ay - 1, az - 0.5], 2.3), 'skin', { mirror: true });
  b.add('foot.L', intersect(box([ax, 2.1, az + (f.len / 2 - f.heel)], [f.w / 2 + 0.3, 2, f.len / 2], { round: 1.4 }), halfSpace([0, 4.2, toeZ - 3], [0, 1, 0.7])), 'skin', { mirror: true });
  // three toes split apart, a talon on each
  for (const dx of [-1.2, 1.2]) b.carve('foot.L', aabb([ax + dx - 0.5, 0, toeZ - 2.5], [ax + dx + 0.5, 3, toeZ + 1]), { mirror: true });
  for (let i = 0; i < 3; i++) b.add('foot.L', spike([ax - 1.9 + i * 1.9, 1, toeZ - 0.4], [(i - 1) * 0.15, -0.45, 1], 2.8, 0.65, 0.6, { tip: 0.15, bend: [0, -0.08, 0] }), 'claw', { mirror: true, thr: 0.3 });
  // the back toe, a hooked spur out of the back of the ankle
  b.add('foot.L', spike([ax, ay + 0.6, az - 2.4], [0, -0.55, -1], 3, 0.8, 0.6, { tip: 0.15, bend: [0, -0.1, 0] }), 'claw', { mirror: true, thr: 0.3 });
  // two maroon bands round the shin
  for (const y of [ay + 8.5, ay + 12.5]) {
    b.paint('shin.L', fn((x, yy, z) => Math.abs(yy - y - 0.6 * Math.sin(Math.atan2(z, x - ax) * 3)) - 0.65, [ax - 6, y - 3, -6], [ax + 6, y + 3, 6]), 'mark', { mirror: true, where: b.isMat('skin') });
  }
}

/** Maroon fur: a cuff of tufts round each wrist and each ankle. */
function fur(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, , sz] = s.shoulder;
  const wy = L.wrist[1];
  const [ax, ay] = L.ankle;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    b.add('forearm.L', spike([sx + Math.sin(a) * 2.1, wy + 1.8, sz + Math.cos(a) * 2.1], [Math.sin(a), -0.55, Math.cos(a)], 2.6 + (i % 2) * 0.7, 1.1, 0.7, { tip: 0.3 }), 'fur', { mirror: true, thr: 0.3 });
  }
  b.add('forearm.L', capsule([sx, wy + 2.8, sz], [sx, wy + 0.6, sz], 2.6), 'fur', { mirror: true, thr: 0.2 });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.2;
    b.add('shin.L', spike([ax + Math.sin(a) * 2.3, ay + 3.6, Math.cos(a) * 2.3], [Math.sin(a), -0.3, Math.cos(a)], 2.4 + (i % 2) * 0.6, 1.1, 0.7, { tip: 0.3 }), 'fur', { mirror: true, thr: 0.3 });
  }
  b.add('shin.L', capsule([ax, ay + 4.6, 0], [ax, ay + 2.6, 0], 2.7), 'fur', { mirror: true, thr: 0.2 });
  b.paint(['forearm.L', 'forearm.R', 'shin.L', 'shin.R'], fn((x, y, z) => Math.abs(((x * 1.7 + z * 1.3 + y * 0.4 + 90) % 1.6) - 0.8) - 0.22, [-20, 0, -20], [20, 80, 20]), 'fur', { shade: 3, where: b.isMat('fur') });
}

/** The tail on four spring bones: thick at the root, banded in maroon, a short point at the tip. */
function tail(b: ModelBuilder): SpringDef[] {
  const T = LIZARD_TAIL;
  const names = ['tail1', 'tail2', 'tail3', 'tail4'];
  b.bone('tail1', 'hips', T[0]);
  b.bone('tail2', 'tail1', T[1]);
  b.bone('tail3', 'tail2', T[2]);
  b.bone('tail4', 'tail3', T[3]);
  let along = 0;
  const springs: SpringDef[] = [];
  for (let i = 0; i < 4; i++) {
    const a = T[i], e = T[i + 1];
    b.add(names[i], capsule(a, e, TAIL_R[i], TAIL_R[i + 1]), 'skin');
    // a ridge along the top
    b.add(names[i], capsule([a[0], a[1] + TAIL_R[i] * 0.8, a[2]], [e[0], e[1] + TAIL_R[i + 1] * 0.8, e[2]], TAIL_R[i] * 0.4, TAIL_R[i + 1] * 0.4), 'skin');
    const d: V3 = [e[0] - a[0], e[1] - a[1], e[2] - a[2]];
    const len = Math.hypot(...d);
    const u: V3 = [d[0] / len, d[1] / len, d[2] / len];
    const s0 = along;
    // maroon bands every 6 voxels along it
    b.paint(names[i], fn((x, y, z) => {
      const t = s0 + (x - a[0]) * u[0] + (y - a[1]) * u[1] + (z - a[2]) * u[2];
      return Math.abs((((t - 2) % 6) + 6) % 6 - 0.9) - 0.75;
    }, [-6, Math.min(a[1], e[1]) - 6, Math.min(a[2], e[2]) - 6], [6, Math.max(a[1], e[1]) + 6, Math.max(a[2], e[2]) + 6]), 'mark', { where: b.isMat('skin') });
    along += len;
    springs.push({ bone: names[i], tail: [d[0] / RES, d[1] / RES, d[2] / RES], stiffness: [46, 34, 24, 16][i], damping: 5, gravity: 3, limit: [28, 34, 40, 46][i], radius: 0.07 });
  }
  b.add('tail4', spike(T[4], [0, -0.25, -1], 4, TAIL_R[4], 0.5, { tip: 0.2 }), 'skin', { thr: 0.25 });
  return springs;
}

// ---------------------------------------------------------------------------------------------- the mask

let maskModel: VoxelModel | null = null;

/**
 * The lizard's mask on the 'face' socket: the first full mask (a skull with a jaw full of teeth, a rounded forehead,
 * three red stripes on the left) grown back over the crown and the sides; only the right eye is uncovered, the bone
 * broken open round it in a jagged window.
 */
export function lizardMask(): VoxelModel {
  return (maskModel ??= buildLizardMask());
}

function buildLizardMask(): VoxelModel {
  const b = new ModelBuilder('ichigo-mask-lizard', 48);
  b.mat('bone', ['#F7F5F0', '#EEE9DF', '#DED6C8', '#C2B8A8', '#A99F90'], { base: 1, rough: 0.42, shadeK: 1 });
  b.mat('stripe', ['#A51D29', '#861922', '#64141A'], { base: 1, rough: 0.5 });
  b.mat('dark', ['#141418'], { rough: 0.9 });
  b.mat('iris', ['#F2D84E'], { rough: 0.3, glow: 1.6 });
  b.mat('teeth', ['#F3EEE4'], { rough: 0.35 });
  b.mat('gap', ['#1A1416'], { rough: 0.9 });
  b.bone('root', null, [0, 0, 0]);
  // the skull: the face cap, the jaw, and the bone grown on back over the crown and down the sides
  const cap = intersect(
    blend(1.5, ellipsoid([0, 0.8, -3.6], [6.6, 7.6, 6.8]), ellipsoid([0, -4.6, -2.8], [5.2, 3.2, 5.6])),
    fn((_x, y, z) => Math.max(-8.6 - z, y < -2 ? -1.6 - z : -9), [-8, -10, -11], [8, 10, 5]),
  );
  b.add('root', cap, 'bone');
  // the left (+X) brow, heavy over its eye hole; on the right the bone is broken away
  b.add('root', ellipsoid([2.9, 1.9, 1.7], [2.5, 0.8, 1.5], [0, 0, 12]), 'bone');
  b.carve('root', ellipsoid([2.6, 0.4, 3.2], [1.9, 1.05, 2.4], [0, 0, 14]));
  b.paint('root', ellipsoid([2.6, 0.4, 2.2], [2.3, 1.4, 2.4], [0, 0, 14]), 'dark');
  b.voxel('root', 2, 0, 1, 'iris');
  // the window round the right eye: a jagged hole down to the face
  b.carve('root', fn((x, y, z) => {
    const dx = (x + 2.8) / 3.1, dy = (y + 0.4) / 2.5;
    const a = Math.atan2(dy, dx);
    const r = 1 + 0.16 * Math.sin(a * 5 + 0.6) + 0.1 * Math.sin(a * 11 + 1.3);
    return Math.max(Math.hypot(dx, dy) - r, -1.2 - z);
  }, [-8, -5, -1], [2, 4, 6]));
  // the grin: rows of teeth across the jaw, a black slit between them and seams between the teeth
  const g = b.grid('root');
  for (let x = -8; x < 8; x++) {
    for (let y = -7; y <= -3; y++) {
      let z = 12;
      while (z > -2 && g.get(x, y, z) === 0) z--;
      if (g.get(x, y, z) === 0) continue;
      b.voxel('root', x, y, z, y === -5 || x === 1 || x === -2 || x === 5 || x === -6 ? 'gap' : 'teeth', 'flat');
    }
  }
  // the three thin red stripes on the left, from the crown down across the eye to the cheek
  for (const [x, y0, y1] of [[1, 9, -1], [3, 9, -2], [5, 7, -1]] as const) b.paint('root', aabb([x, y1, -6], [x + 1, y0, 6]), 'stripe', { where: b.isMat('bone') });
  b.autoShade({ up: 0.5, open: 2.4, front: 0.2 });
  b.lint();
  return b.build();
}

// ---------------------------------------------------------------------------------------------- the arm-maw

let wormHeadModel: VoxelModel | null = null;
let wormSegModel: VoxelModel | null = null;

function wormMats(b: ModelBuilder): void {
  b.mat('flesh', ['#F3EDEF', '#E6DCE0', '#D2C4CA', '#B5A4AC'], { base: 1, rough: 0.5, shadeK: 0.9 });
  b.mat('mark', ['#7E3940', '#64292F', '#4B1F23'], { base: 1, rough: 0.6 });
  b.mat('maw', ['#4B1F23', '#2E1216'], { base: 0, rough: 0.8 });
  b.mat('teeth', ['#F3EEE4', '#DDD6CA'], { base: 0, rough: 0.35 });
  b.mat('tongue', ['#C2566A', '#A23E52', '#7E2C3C'], { base: 1, rough: 0.5 });
  b.mat('stud', ['#EFE8DE', '#D2C8BA'], { base: 0, rough: 0.4 });
}

/** The worm's head: a blunt white snout split by a round maw ringed with teeth, the studded tongue lolling out (+Z). */
export function wormHead(): VoxelModel {
  return (wormHeadModel ??= buildWormHead());
}

function buildWormHead(): VoxelModel {
  const b = new ModelBuilder('lizard-worm-head', 48);
  wormMats(b);
  b.bone('root', null, [0, 0, 0]);
  b.add('root', blend(2, capsule([0, 0, -10], [0, 0, 4], 7.5, 8.5), ellipsoid([0, 0.6, 3], [9, 8.6, 6])), 'flesh');
  // the maw: a deep round mouth, dark inside
  b.carve('root', cylinder([0, -0.4, 2], [0, -0.4, 12], 6.2, 6.8));
  b.paint('root', cylinder([0, -0.4, -2], [0, -0.4, 3], 7.2), 'maw');
  // teeth all round the rim, pointing in
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    b.add('root', spike([Math.cos(a) * 6.8, -0.4 + Math.sin(a) * 6.8, 7.4], [-Math.cos(a), -Math.sin(a), 0.35], 2.6 + (i % 2) * 0.8, 0.9, 0.8, { tip: 0.2 }), 'teeth', { thr: 0.3 });
  }
  // the tongue, studded along its back
  b.add('root', capsule([0, -3.6, -1], [0, -4.6, 13], 2.2, 1.6), 'tongue');
  for (let i = 0; i < 5; i++) b.add('root', sphere([((i % 2) - 0.5) * 1.6, -2.2 - i * 0.2, 1.5 + i * 2.4], 0.95), 'stud');
  // maroon rings behind the head
  b.paint('root', fn((_x, _y, z) => Math.abs((((z + 40) % 5) + 5) % 5 - 1) - 0.7, [-10, -10, -18], [10, 10, -2]), 'mark', { where: b.isMat('flesh') });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** One ring of the worm's body (along Z, 0.3 m), a maroon band round its middle. */
export function wormSegment(): VoxelModel {
  return (wormSegModel ??= buildWormSeg());
}

function buildWormSeg(): VoxelModel {
  const b = new ModelBuilder('lizard-worm-seg', 48);
  wormMats(b);
  b.bone('root', null, [0, 0, 0]);
  b.add('root', blend(1.5, cylinder([0, 0, -7.5], [0, 0, 7.5], 6), sphere([0, 0, 0], 6.6)), 'flesh');
  b.paint('root', aabb([-8, -8, -1], [8, 8, 1.2]), 'mark', { where: b.isMat('flesh') });
  // the creases between the rings
  for (const z of [-7, 6]) b.paint('root', aabb([-8, -8, z], [8, 8, z + 1]), 'flesh', { shade: 3 });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}
