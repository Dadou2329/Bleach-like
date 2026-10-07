// Kaname Tōsen's Resurrección, Suzumushi Hyakushiki: Grillar Grillo (docs/roster/B2-captains-2.md, Hollow
// forms). A hunched cricket-Hollow about 4 m tall, covered in black fur, a large Hollow hole through the chest;
// four insect arms with clawed hands; on the hump of the back two long spiralling silver horns, each with two
// rings near the tip from which chains hang; an elongated bone mask with the seam down its middle, huge
// bulbous eyes (orange sclera, emerald slit pupils) and big rings hanging from protrusions at its sides; a small
// opening at the bottom showing his own jaw and jagged teeth; a long bushy tail (a spring chain); two pairs of
// insect wings (pale, veined). Built upright on the humanoid skeleton (plus a second pair of arms, the wings
// and the tail) at 30 vox/m; the stance hunches it. Character's left is +X.
import { ModelBuilder } from '../models/builder';
import { aabb, blend, box, capsule, ellipsoid, fn, halfSpace, intersect, offset, smoothPath, sphere, spike, subtract, torus, tube, type Sdf, type V3 } from '../models/sdf';
import { addBands, humanoidSkeleton, type HumanoidSpec, type Landmarks } from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

export const GRILLO_RES = 30;

const SPEC: HumanoidSpec = {
  H: 126,
  chinY: 104,
  head: { w: 14, d: 18, h: 18 },
  neckR: 5,
  shoulder: [17, 97, -2],
  upperArm: 27,
  foreArm: 26,
  hand: 14,
  armR: 4.6,
  hipsY: 62,
  hip: [9, 58, 0],
  kneeY: 32,
  ankleY: 7,
  chest: [16, 12],
  waist: [11, 8.5],
  hips: [12, 9],
  chestY: 87,
  waistY: 72,
  foot: { len: 20, w: 9, heel: 5 },
};
/** the second pair of arms, from the sides of the ribs below the shoulders */
export const GRILLO_SHOULDER2: V3 = [14, 80, 0];

function palette(b: ModelBuilder): void {
  b.mat('fur', ['#3E3C45', '#2E2C34', '#232128', '#1A191E', '#141418'], { base: 2, rough: 0.92, shadeK: 1 });
  b.mat('furHi', ['#5A5766', '#46434F'], { base: 0, rough: 0.9 });
  b.mat('mask', ['#F3F1E8', '#E8E4D8', '#D2CCBC', '#B4AE9E', '#948E80'], { base: 1, rough: 0.35, shadeK: 0.9 });
  b.mat('seam', ['#2A2A2E']);
  b.mat('sclera', ['#FFB04A', '#FF8A1F', '#D86A10'], { base: 1, rough: 0.25, glow: 0.6 });
  b.mat('pupil', ['#1FC468', '#18A558', '#0E7A3E'], { base: 1, rough: 0.25, glow: 0.8 });
  b.mat('silver', ['#E3E7EC', '#BFC4CA', '#9AA0A8', '#767C84'], { base: 1, rough: 0.3, metal: 0.85 });
  b.mat('claw', ['#F3F1E8', '#D2CCBC', '#A9A291'], { base: 1, rough: 0.35 });
  b.mat('skin', ['#7A5038', '#6A4530', '#5B3A29'], { base: 1, rough: 0.6 });
  b.mat('teeth', ['#F3F1EA', '#D8D4C8']);
  b.mat('mouth', ['#2A1A1A']);
  b.mat('wing', ['#E4EEE8', '#D8E7E0', '#BFD0C8', '#A6B8B0'], { base: 1, rough: 0.2, metal: 0.1 });
  b.mat('vein', ['#3A4A42', '#2B3A33']);
  b.mat('hole', ['#141418']);
}

let cached: CharacterAsset | null = null;
export function grilloAsset(): CharacterAsset {
  if (!cached) cached = buildGrillo();
  return cached;
}

export function buildGrillo(): CharacterAsset {
  const b = new ModelBuilder('tosen-grillo', GRILLO_RES);
  palette(b);
  const s = SPEC;
  const L = humanoidSkeleton(b, s, {});
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx, wy - 6, wz + 0.6]);
  b.socket('grip.L', 'fist.L', [wx, wy - 6, wz + 0.6]);
  b.socket('claw.R', 'fist.R', [-wx, wy - 12, wz + 2]);
  b.socket('claw.L', 'fist.L', [wx, wy - 12, wz + 2]);
  b.socket('chest.front', 'chest', [0, s.chestY, s.chest[1] + 2]);
  b.socket('back', 'chest', [0, s.chestY + 4, -s.chest[1] - 4]);
  const torso = body(b, L);
  const eyes = head(b, L);
  b.socket('eye.L', 'head', eyes[0]);
  b.socket('eye.R', 'head', eyes[1]);
  b.socket('mouth', 'head', [0, s.chinY + 1, L.headC[2] + 14]);
  arms(b, L);
  arms2(b, L);
  legs(b, L);
  horns(b, L);
  const wings = wingPairs(b, L);
  const tail = tailChain(b, L);
  void torso;
  b.autoShade();
  b.lint();
  const springs: SpringDef[] = [...tail];
  const colliders: ColliderDef[] = [
    { bone: 'thigh.L', offset: [0, -0.4, 0], radius: 0.24 },
    { bone: 'thigh.R', offset: [0, -0.4, 0], radius: 0.24 },
  ];
  void wings;
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- body

/** a barrel of black fur, the hump over the shoulders, the Hollow hole through the chest */
function body(b: ModelBuilder, L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const torso = blend(5,
    box([0, s.chestY - 1, -1], [cx, 11, cz], { round: 7 }),
    box([0, s.waistY, -0.5], [wx, 8, wz], { round: 6 }),
    box([0, s.hipsY + 1, -0.5], [s.hips[0], 6.5, s.hips[1]], { round: 5 }),
    // the hump on the upper back, where the horns and wings root
    ellipsoid([0, sy - 2, -cz + 2], [cx - 2, 12, 9]),
    capsule([4, sy + 3, sz - 2], [sx - 3, sy, sz], 6, 6.5),
    capsule([-4, sy + 3, sz - 2], [-sx + 3, sy, sz], 6, 6.5),
    sphere([sx, sy - 1, sz], 7), sphere([-sx, sy - 1, sz], 7));
  // the Hollow hole straight through the middle of the chest
  const holeC: V3 = [0, s.chestY - 6, 0];
  const hole = capsule([holeC[0], holeC[1], -30], [holeC[0], holeC[1], 30], 5);
  addBands(b, subtract(torso, hole), 'fur', [['hips', 0, s.waistY - 1], ['spine', s.waistY - 1, s.chestY - 8], ['chest', s.chestY - 8, 300]]);
  b.paint(['spine', 'chest'], capsule([holeC[0], holeC[1], -30], [holeC[0], holeC[1], 30], 6.2), 'hole', { where: b.isMat('fur') });
  // shaggy fur: tufts down the flanks and over the hump, a paler sheen along the back
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const y = s.waistY + (i % 3) * 5;
    const p: V3 = [Math.sin(a) * (wx + 1), y, Math.cos(a) * (wz + 1) - 0.5];
    b.add(y > s.chestY - 8 ? 'chest' : 'spine', spike(p, [Math.sin(a) * 0.4, -1, Math.cos(a) * 0.4], 7, 2.6, 1.6, { tip: 0.3 }), 'fur', { thr: 0.3 });
  }
  b.paint('chest', ellipsoid([0, sy + 4, -cz + 1], [cx - 4, 6, 5]), 'furHi', { where: b.isMat('fur') });
  // the neck: thick, thrust forward
  b.add('neck', capsule([0, s.chinY - 12, L.headC[2] - 2], [0, s.chinY + 2, L.headC[2] + 2], s.neckR + 1.6), 'fur');
  return torso;
}

/**
 * The elongated bone mask pushed forward like a cricket's face: the seam down its middle, huge bulging eyes at
 * its sides (orange, emerald slits), side protrusions with big silver rings hanging from them, and the small
 * opening at the bottom with his own jaw and jagged teeth. Returns the two eye centres.
 */
function head(b: ModelBuilder, L: Landmarks): [V3, V3] {
  const s = L.spec;
  const c = s.chinY, hz = L.headC[2];
  // the skull behind (fur) and the long mask in front of it
  b.add('head', ellipsoid([0, c + 10, hz - 2], [s.head.w / 2 + 1, s.head.h / 2, s.head.d / 2 - 1]), 'fur');
  const mask = blend(3,
    ellipsoid([0, c + 10, hz + 4], [6.6, 9, 11]),
    capsule([0, c + 8, hz + 8], [0, c + 2, hz + 18], 5.4, 3.6));
  b.add('head', mask, 'mask');
  b.paint('head', fn((x) => Math.abs(x) - 0.9, [-1, c - 6, hz - 4], [1, c + 22, hz + 26]), 'seam', { where: b.isMat('mask') });
  // the mouth opening at the bottom: his own jaw, the teeth jagged
  b.carve('head', ellipsoid([0, c + 1.5, hz + 17.5], [2.6, 2.2, 3]));
  b.add('head', ellipsoid([0, c + 1, hz + 15.5], [2.3, 1.6, 2.2]), 'skin');
  for (const x of [-1.5, -0.5, 0.5, 1.5]) b.add('head', spike([x, c + 3.4, hz + 17.6], [0, -1, 0.2], 1.8, 0.6, 0.4, { tip: 0.3 }), 'teeth', { thr: 0.2 });
  for (const x of [-1, 0, 1]) b.add('head', spike([x, c - 0.2, hz + 17.2], [0, 1, 0.2], 1.4, 0.55, 0.4, { tip: 0.3 }), 'teeth', { thr: 0.2 });
  b.paint('head', ellipsoid([0, c + 1.6, hz + 16.6], [2, 1.2, 1.6]), 'mouth', { where: b.isMat('skin') });
  // the eyes: big orange bulbs bulging out of the sides of the mask, emerald slit pupils
  const eyes: [V3, V3] = [[6.4, c + 11, hz + 6], [-6.4, c + 11, hz + 6]];
  for (const e of eyes) {
    const k = Math.sign(e[0]);
    b.add('head', sphere(e, 4.6), 'sclera');
    b.paint('head', fn((x, y, z) => Math.max(Math.abs((z - e[2]) * 0.9 + (x - e[0]) * 0.1 * k) - 0.7, Math.abs(y - e[1]) - 3.6, -(x - e[0]) * k - 1.5), [e[0] - 6, e[1] - 6, e[2] - 6], [e[0] + 6, e[1] + 6, e[2] + 6]), 'pupil', { where: b.isMat('sclera') });
    // the side protrusion below and behind the eye, a big ring hanging from it
    b.add('head', capsule([k * 5, c + 5, hz + 2], [k * 9.5, c + 3, hz - 1], 1.8, 1.3), 'mask');
    b.add('head', torus([k * 9.6, c - 2.4, hz - 1], 4.4, 0.8, [0, 0, 90]), 'silver', { thr: 0.2 });
  }
  return eyes;
}

/** the main arms: long, furred, ending in bone-white hooked claws */
function arms(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(2, sphere([sx, sy - 1, sz], 6.6), capsule([sx, sy - 2, sz], [sx, ey + 1, sz], 5.6, 4.6)), 'fur', { mirror: true });
  b.add('forearm.L', blend(2, sphere([sx, ey, sz], 4.6), capsule([sx, ey - 1, sz], [sx, wy + 1.5, sz], 4.4, 3.4)), 'fur', { mirror: true });
  // a fringe of long hair off the back of the forearm
  for (let i = 0; i < 3; i++) b.add('forearm.L', spike([sx + 1, ey - 4 - i * 6, sz - 3.5], [0.2, -0.6, -0.8], 6, 2.2, 1.4, { tip: 0.3 }), 'fur', { mirror: true, thr: 0.3 });
  clawHand(b, 'fist.L', 'palm.L', [sx, wy, sz]);
}

/** a clawed hand: a furred knuckle block and three long hooked claws (the fist and the open hand) */
function clawHand(b: ModelBuilder, fist: string, palm: string, w: V3): void {
  const [x, y, z] = w;
  b.add(fist, capsule([x, y + 1, z], [x, y - 2, z], 3.4), 'fur', { mirror: true });
  b.add(fist, box([x, y - 5, z + 0.8], [3.4, 3.8, 4], { round: 1.6 }), 'fur', { mirror: true });
  for (const dz of [-2.4, 0.6, 3.4]) b.add(fist, spike([x, y - 8, z + dz], [0.15, -1, 0.35], 8, 1.3, 0.9, { bend: [0, 0, 0.6], tip: 0.25 }), 'claw', { mirror: true, thr: 0.25 });
  b.add(palm, capsule([x, y + 1, z], [x, y - 2, z], 3.4), 'fur', { mirror: true });
  b.add(palm, box([x, y - 5, z + 0.6], [2.6, 4.2, 3.8], { round: 1.4 }), 'fur', { mirror: true });
  for (const dz of [-2.2, 0.6, 3.2]) b.add(palm, capsule([x, y - 7, z + dz], [x, y - 15, z + dz + 1.4], 1.3, 0.75), 'claw', { mirror: true });
}

/** the second, slighter pair of arms out of the ribs */
function arms2(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [x2, y2, z2] = GRILLO_SHOULDER2;
  const up = 22, fo = 21;
  const ey = y2 - up, wy = ey - fo;
  b.boneSym('upperarm2.L', 'chest', GRILLO_SHOULDER2);
  b.boneSym('forearm2.L', 'upperarm2.L', [x2, ey, z2]);
  b.boneSym('hand2.L', 'forearm2.L', [x2, wy, z2]);
  b.boneSym('fist2.L', 'hand2.L', [x2, wy, z2]);
  b.boneSym('palm2.L', 'hand2.L', [x2, wy, z2]);
  b.socket('grip2.R', 'fist2.R', [-x2, wy - 6, z2 + 0.6]);
  b.socket('grip2.L', 'fist2.L', [x2, wy - 6, z2 + 0.6]);
  b.add('chest', ellipsoid([x2 - 1.5, y2, z2], [4.4, 5, 4.4]), 'fur', { mirror: true });
  b.add('upperarm2.L', blend(2, sphere([x2, y2, z2], 4.6), capsule([x2, y2 - 1, z2], [x2, ey + 1, z2], 4, 3.4)), 'fur', { mirror: true });
  b.add('forearm2.L', blend(2, sphere([x2, ey, z2], 3.4), capsule([x2, ey - 1, z2], [x2, wy + 1, z2], 3.4, 2.8)), 'fur', { mirror: true });
  clawHand(b, 'fist2.L', 'palm2.L', [x2, wy, z2]);
  void s;
}

/** bestial legs: thick furred thighs, lean shins, splayed clawed feet */
function legs(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [hx, hy] = s.hip;
  const [kx, ky] = L.knee, [ax, ay, az] = L.ankle;
  b.add('thigh.L', blend(2, sphere([hx, hy, 0], 7.6), capsule([hx, hy, 0], [kx, ky + 2, 0], 7.2, 5.2)), 'fur', { mirror: true });
  b.add('shin.L', blend(2, sphere([kx, ky, 0], 5), capsule([kx, ky, 0], [ax, ay + 2, 0], 4.6, 3.4)), 'fur', { mirror: true });
  for (let i = 0; i < 3; i++) b.add('thigh.L', spike([hx + 2, hy - 6 - i * 7, -4.5], [0.3, -0.7, -0.6], 7, 2.4, 1.6, { tip: 0.3 }), 'fur', { mirror: true, thr: 0.3 });
  b.add('foot.L', blend(1.6, capsule([ax, ay + 3, az], [ax, ay - 2, az], 3.6), box([ax, 3, az + 5], [4.4, 3, 7], { round: 2 })), 'fur', { mirror: true });
  for (const dx of [-2.6, 0, 2.6]) b.add('foot.L', spike([ax + dx, 2, az + 11], [dx * 0.08, -0.3, 1], 5, 1.2, 0.8, { bend: [0, -0.4, 0], tip: 0.25 }), 'claw', { mirror: true, thr: 0.25 });
}

/** two long spiralling silver horns up off the hump, two rings near each tip, short chains hanging from them */
function horns(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [, sy] = s.shoulder;
  const cz = s.chest[1];
  for (const k of [-1, 1]) {
    const base: V3 = [k * 5, sy + 4, -cz + 1];
    const pts: V3[] = [];
    const n = 40;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const a = t * Math.PI * 4.2;
      const r = 2.6 * (1 - t * 0.5);
      // rising up and back, a little outward, coiling round its own axis
      const ax: V3 = [base[0] + k * t * 10, base[1] + t * 58, base[2] - t * 16];
      pts.push([ax[0] + Math.cos(a) * r * k, ax[1], ax[2] + Math.sin(a) * r]);
    }
    const rad = pts.map((_, i) => 2.6 * (1 - (i / n) * 0.8) + 0.5);
    b.add('chest', tube(pts, rad), 'silver', { thr: 0.25 });
    // the rings near the tip, collared round the horn, and a short chain hanging from each
    for (const t of [0.72, 0.84]) {
      const i = Math.round(t * n);
      const p = pts[i];
      const R = rad[i] + 1.4;
      b.add('chest', torus(p, R, 0.9), 'silver', { thr: 0.2 });
      const top: V3 = [p[0] + k * R, p[1], p[2]];
      const chain = [top, [top[0] + k * 0.6, top[1] - 4, top[2] - 0.4], [top[0] + k * 0.9, top[1] - 8, top[2] - 1]] as V3[];
      b.add('chest', tube(chain, [0.8, 0.75, 0.7]), 'silver', { thr: 0.2 });
      for (let j = 1; j < 4; j++) b.paint('chest', sphere([top[0] + k * 0.3 * j, top[1] - j * 2, top[2] - 0.3 * j], 0.9), 'silver', { shade: 3, where: b.isMat('silver') });
    }
  }
}

/**
 * Two pairs of insect wings from the hump: long, narrow, rounded at the tip, pale and veined; each on its own
 * bone so they can beat.
 */
function wingPairs(b: ModelBuilder, L: Landmarks): string[] {
  const s = L.spec;
  const [, sy] = s.shoulder;
  const cz = s.chest[1];
  const out: string[] = [];
  const pairs: [string, V3, number, number, number][] = [
    ['wing', [6, sy, -cz - 2], 54, 9, 26],
    ['wing2', [6, sy - 9, -cz - 1], 44, 8, 10],
  ];
  for (const [name, root, len, wid, rise] of pairs) {
    b.boneSym(`${name}.L`, 'chest', root);
    const tipDir: V3 = [Math.cos((rise * Math.PI) / 180), Math.sin((rise * Math.PI) / 180), -0.45];
    const tip: V3 = [root[0] + tipDir[0] * len, root[1] + tipDir[1] * len, root[2] + tipDir[2] * len];
    // a flat, tapering blade of membrane (two voxels thick) in the plane of its length and the 'up' across it,
    // broadest a third of the way out, rounded at the tip
    const ul = Math.hypot(...tipDir);
    const u: V3 = [tipDir[0] / ul, tipDir[1] / ul, tipDir[2] / ul];
    const nn: V3 = [-u[2], 0, u[0]];
    const nl = Math.hypot(...nn);
    const n: V3 = [nn[0] / nl, nn[1] / nl, nn[2] / nl];
    const w: V3 = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
    const memb = fn((x, y, z) => {
      const dx = x - root[0], dy = y - root[1], dz = z - root[2];
      const along = dx * u[0] + dy * u[1] + dz * u[2];
      const across = dx * w[0] + dy * w[1] + dz * w[2];
      const thick = dx * n[0] + dy * n[1] + dz * n[2];
      const t = along / len;
      const halfW = Math.max(1.2, wid * Math.sin(Math.PI * Math.min(1, Math.max(0, 0.1 + t * 0.9))) * (1 - t * 0.25));
      return Math.max(-along, along - len, Math.abs(across) - halfW, Math.abs(thick) - 1);
    }, [root[0] - wid - 4, root[1] - wid - 4, root[2] - len - 4], [root[0] + len + 4, root[1] + len + wid + 4, root[2] + wid + 4]);
    b.add(`${name}.L`, memb, 'wing', { mirror: true });
    // veins: the leading edge, a midrib and a few cross veins
    const midrib = smoothPath([root, [root[0] + tipDir[0] * len * 0.5, root[1] + tipDir[1] * len * 0.5 + 1, root[2] + tipDir[2] * len * 0.5], tip], 4);
    b.paint(`${name}.L`, tube(midrib, midrib.map(() => 0.9)), 'vein', { mirror: true, where: b.isMat('wing') });
    for (let i = 1; i < 6; i++) {
      const t = i / 6;
      const c: V3 = [root[0] + tipDir[0] * len * t, root[1] + tipDir[1] * len * t, root[2] + tipDir[2] * len * t];
      b.paint(`${name}.L`, capsule([c[0], c[1] - wid, c[2]], [c[0] + 2, c[1] + wid, c[2]], 0.6), 'vein', { mirror: true, where: b.isMat('wing') });
    }
    // the root knuckle that holds it to the hump
    b.add(`${name}.L`, sphere(root, 3), 'fur', { mirror: true });
    out.push(`${name}.L`, `${name}.R`);
  }
  return out;
}

/** the long bushy tail: four spring bones off the base of the spine */
function tailChain(b: ModelBuilder, L: Landmarks): SpringDef[] {
  const s = L.spec;
  const base: V3 = [0, s.hipsY - 2, -s.hips[1] + 1];
  const segs = 4, segLen = 12;
  const springs: SpringDef[] = [];
  let parent = 'hips';
  for (let i = 0; i < segs; i++) {
    const name = `tail.${i + 1}`;
    const p: V3 = [0, base[1] - i * segLen * 0.55, base[2] - i * segLen * 0.85];
    const q: V3 = [0, base[1] - (i + 1) * segLen * 0.55, base[2] - (i + 1) * segLen * 0.85];
    b.bone(name, parent, p);
    // bushy: a fat furry spindle per segment, overlapping the next
    const r0 = 4.6 - i * 0.4, r1 = 4.2 - i * 0.6;
    b.add(name, capsule(p, q, r0, r1), 'fur');
    for (let j = 0; j < 4; j++) {
      const a = (j / 4) * Math.PI * 2 + i;
      b.add(name, spike([p[0] + Math.cos(a) * r0 * 0.6, (p[1] + q[1]) / 2 + Math.sin(a) * r0 * 0.6, (p[2] + q[2]) / 2], [Math.cos(a) * 0.5, -0.5 + Math.sin(a) * 0.3, -0.8], 6, 2.2, 1.4, { tip: 0.3 }), 'fur', { thr: 0.3 });
    }
    if (i === segs - 1) b.add(name, ellipsoid(q, [r1 + 1.6, r1 + 1.6, r1 + 3]), 'fur');
    springs.push({ bone: name, tail: [(q[0] - p[0]) / GRILLO_RES, (q[1] - p[1]) / GRILLO_RES, (q[2] - p[2]) / GRILLO_RES], stiffness: 60 - i * 10, damping: 5, gravity: 6, limit: 50, radius: 0.12 });
    parent = name;
  }
  return springs;
}

void aabb;
void halfSpace;
void intersect;
void offset;
