// Katen, the elder of Katen Kyōkotsu's two spirits (docs/roster/B2-captains-2.md): she leans over
// Shunsui's shoulder while Karamatsu Shinjū plays. Violet corkscrew twin-tails, one turquoise eye and a
// black patch over the right, a red ribbon at the throat, a gold headdress of bones, a long dark low-cut
// dress, and an indigo cape printed with a great skull and the two blades crossed. Built at 48 vox/m and
// shown on a fixed pose (she does not fight).
import { ModelBuilder } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, intersect, sphere, torus, tube, type V3 } from '../models/sdf';
import { faceLegend, hands, head, humanoidSkeleton, spikeHair, type HumanoidSpec, type Landmarks } from './humanoid';
import type { CharacterAsset } from './ichigo';

const SPEC: HumanoidSpec = {
  H: 80,
  chinY: 68,
  head: { w: 10, d: 11, h: 12 },
  neckR: 2.0,
  shoulder: [7.4, 63, -0.5],
  upperArm: 13,
  foreArm: 12,
  hand: 7.5,
  armR: 1.8,
  hipsY: 42,
  hip: [4.2, 39.5, 0],
  kneeY: 22,
  ankleY: 4,
  chest: [6.4, 4.4],
  waist: [4.8, 3.6],
  hips: [6.4, 4.6],
  chestY: 57,
  waistY: 49,
  foot: { len: 10, w: 4, heel: 2.5 },
};

/** One turquoise eye under a fine brow; the right eye hidden by a black patch; dark red lips. Rows 9 → 0. */
const FACE = [
  '. . . . . . . . . .',
  '. . . . . . B B B .',
  '. P P P . . L L L .',
  '. P P P . . W I I .',
  '. P P P . . . i . .',
  '. . . . . . . . . .',
  '. . . . . s . . . .',
  '. . . . . . . . . .',
  '. . . . m m . . . .',
  '. . . . . . . . . .',
];

let cache: CharacterAsset | null = null;

export function katenAsset(): CharacterAsset {
  return (cache ??= buildKaten());
}

export function buildKaten(): CharacterAsset {
  const b = new ModelBuilder('katen', 48);
  b.mat('skin', ['#F8E8E2', '#F0DAD2', '#E2C6BE', '#CDAFA8', '#A88C86'], { base: 1, rough: 0.55, shadeK: 0.9 });
  b.mat('hair', ['#9B74CC', '#8A62BE', '#7B52AE', '#64409A', '#4C2F7C'], { base: 2, rough: 0.45, shadeK: 0.85, dither: 0.05 });
  b.mat('brow', ['#4C2F7C']);
  b.mat('lid', ['#2A1E3A']);
  b.mat('sclera', ['#F0EEF2']);
  b.mat('iris', ['#3CC7BE']);
  b.mat('irisD', ['#1E7A74']);
  b.mat('patch', ['#1A1A1E', '#141418']);
  b.mat('lips', ['#8E2A3A']);
  b.mat('dress', ['#2E2A40', '#24202E', '#1C1A28', '#161420', '#141418'], { base: 2, rough: 0.6, shadeK: 0.9 });
  b.mat('cape', ['#3E3A8A', '#34307C', '#2D2A6E', '#24225A', '#1C1A46'], { base: 2, rough: 0.75, shadeK: 0.9 });
  b.mat('print', ['#E9E4D8', '#D6D0C2'], { base: 0, rough: 0.7 });
  b.mat('ribbon', ['#C83040', '#B1202B', '#8C1822'], { base: 1, rough: 0.6 });
  b.mat('bone', ['#F0D88A', '#D7B451', '#B8923A', '#8E6E28'], { base: 1, rough: 0.3, metal: 0.7, shadeK: 0.8 });
  const s = SPEC;
  const L = humanoidSkeleton(b, s, {});
  const hd = head(b, L, 'skin');
  b.stamp('head', hd.x0, hd.chin + 9, FACE, { ...faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'sclera', mouth: 'lips' }), P: { mat: 'patch', proud: 1 } }, hd.front - 1);
  hairAndCrown(b, L, hd);
  hands(b, L, 'skin');
  body(b, L);
  b.autoShade();
  b.lint();
  return { model: b.build(), springs: [], colliders: [], warnings: b.warnings };
}

function hairAndCrown(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): void {
  const s = L.spec;
  const c = hd.chin;
  spikeHair(b, L, 'hair', [
    { az: 0, el: 60, len: 1.5, r: 4.2, flat: 0.45, flow: [0, -0.2, -1] },
    { az: -70, el: 30, len: 2, r: 4, flat: 0.5, flow: [0, -0.8, -0.4] },
    { az: 70, el: 30, len: 2, r: 4, flat: 0.5, flow: [0, -0.8, -0.4] },
    { az: 180, el: 20, len: 2.4, r: 4.4, flat: 0.5, flow: [0, -0.9, -0.3] },
  ], [
    { x: -3, tipY: c + 8.2, lean: -0.4, r: 1.8 },
    { x: 3.2, tipY: c + 8.4, lean: 0.5, r: 1.8 },
  ], { tufts: 0, hairline: c + s.head.h - 2.6, nape: c + 2, slope: 0.6 });
  // the twin-tails: tight corkscrew curls from high at the sides of the head down past the waist
  for (const k of [-1, 1]) {
    const top: V3 = [k * 6.2, c + 9.5, -2.4];
    b.add('head', sphere(top, 2.6), 'hair');
    const pts: V3[] = [];
    const n = 64;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const y = top[1] - 2 - u * 34;
      const R = 1.8 + u * 0.9;
      const a = u * Math.PI * 2 * 5.5;
      pts.push([top[0] + k * (1.2 + u * 2.2) + Math.cos(a) * R, y, top[2] - u * 2.4 + Math.sin(a) * R]);
    }
    b.add('head', tube(pts, pts.map((_, i) => 1.7 - (i / n) * 0.9)), 'hair', { thr: 0.25 });
  }
  // the headdress: a gold band set with bones rising round the crown
  const hc: V3 = [0, c + 9.2, L.headC[2] - 0.5];
  b.add('head', torus([hc[0], hc[1], hc[2]], 6.2, 0.85, [8, 0, 0]), 'bone');
  for (const a of [-60, -30, 0, 30, 60, 150, -150]) {
    const r = (a * Math.PI) / 180;
    const base: V3 = [hc[0] + Math.sin(r) * 6.1, hc[1] + 0.6, hc[2] + Math.cos(r) * 6.1];
    const tip: V3 = [base[0] + Math.sin(r) * 1.4, base[1] + (Math.abs(a) < 40 ? 5 : 3.6), base[2] + Math.cos(r) * 1.4];
    b.add('head', capsule(base, tip, 0.85, 0.65), 'bone', { thr: 0.2 });
    b.add('head', sphere(tip, 1.05), 'bone');
  }
}

function body(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const torso = blend(2.4,
    box([0, s.chestY - 0.5, -0.3], [cx, 5.4, cz], { round: 3 }),
    box([0, s.waistY, -0.2], [wx, 4.2, wz], { round: 2.4 }),
    box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 3.6, s.hips[1]], { round: 2.6 }),
    capsule([2.0, sy + 1.2, sz - 0.8], [sx - 1.4, sy - 0.2, sz], 2.1, 2.1),
    capsule([-2.0, sy + 1.2, sz - 0.8], [-sx + 1.4, sy - 0.2, sz], 2.1, 2.1),
    ellipsoid([2.3, s.chestY - 1.2, cz - 0.4], [2.3, 2.1, 2.1]), ellipsoid([-2.3, s.chestY - 1.2, cz - 0.4], [2.3, 2.1, 2.1]));
  for (const [bone, y0, y1] of [['hips', 0, s.waistY - 1], ['spine', s.waistY - 1, s.chestY - 4], ['chest', s.chestY - 4, 100]] as [string, number, number][]) b.add(bone, intersect(torso, aabb([-30, y0, -30], [30, y1, 30])), 'dress');
  // the low neckline: skin in a deep V
  b.paint('chest', fn((x, y, z) => (z > 1 && y > s.chestY - 3 ? Math.abs(x) - (y - (s.chestY - 3)) * 0.5 : 1), [-10, s.chestY - 4, -10], [10, 80, 10]), 'skin', { where: b.isMat('dress') });
  // long sleeves
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(1.2, sphere([sx, sy - 0.5, sz], 2.4), capsule([sx, sy - 1, sz], [sx, ey + 0.5, sz], 2.1, 1.9)), 'dress', { mirror: true });
  b.add('forearm.L', blend(1.1, sphere([sx, ey, sz], 1.9), cylinder([sx, wy + 0.5, sz], [sx, ey, sz], 2.4, 1.8)), 'dress', { mirror: true });
  // the skirt, long and flaring to the ground, on the thighs and shins
  for (const k of [1, -1]) {
    const side = k > 0 ? 'L' : 'R';
    b.add(`thigh.${side}`, cylinder([k * 3.2, L.knee[1] - 0.5, -0.4], [k * 2.6, s.hipsY + 1, -0.4], 5.8, 5.2, 1), 'dress');
    b.add(`shin.${side}`, cylinder([k * 3.4, 1.5, -0.4], [k * 3.2, L.knee[1] + 0.5, -0.4], 6.6, 5.8, 1), 'dress');
  }
  // the red ribbon tied at the throat
  const ny = s.chinY - 3;
  b.add('neck', torus([0, ny, L.headC[2] - 0.6], 2.3, 0.6), 'ribbon');
  for (const k of [-1, 1]) b.add('neck', ellipsoid([k * 1.4, ny, L.headC[2] + 2.2], [1.3, 0.9, 0.6]), 'ribbon');
  b.add('neck', capsule([0.4, ny - 0.6, L.headC[2] + 2.2], [1.2, ny - 4, L.headC[2] + 2.6], 0.5, 0.4), 'ribbon', { thr: 0.2 });
  // the cape: from the shoulders down the back past the knees, the skull and the crossed blades on it
  // hung close on the back (it must touch the body to stay on)
  const capeZ = -cz - 0.9;
  const cape = fn((x, y, z) => {
    if (y > sy + 2 || y < L.knee[1] - 4) return 1;
    const t = (sy + 2 - y) / (sy + 6 - L.knee[1]);
    const half = 9.5 + t * 4;
    const zc = capeZ - t * 0.7 - Math.cos(x * 0.5) * 0.4;
    return Math.max(Math.abs(x) - half, Math.abs(z - zc) - 0.7);
  }, [-16, L.knee[1] - 5, capeZ - 6], [16, sy + 3, capeZ + 2]);
  b.add('chest', intersect(cape, aabb([-20, s.chestY - 4, -20], [20, 100, 20])), 'cape');
  b.add('spine', intersect(cape, aabb([-20, s.waistY - 1, -20], [20, s.chestY - 4, 20])), 'cape');
  b.add('hips', intersect(cape, aabb([-20, -10, -20], [20, s.waistY - 1, 20])), 'cape');
  // the print, seen from behind: a great skull, and two blades crossed beneath it
  const sk: V3 = [0, s.chestY - 3, 0];
  const onBack = (d: (x: number, y: number) => number) => fn((x, y, z) => (z > capeZ + 1.2 ? 1 : d(x, y)), [-16, 0, capeZ - 6], [16, 100, capeZ + 2]);
  const bones = ['chest', 'spine', 'hips'];
  b.paint(bones, onBack((x, y) => Math.hypot(x / 4.4, (y - sk[1]) / 4.8) - 1), 'print', { where: b.isMat('cape') });
  b.paint(bones, onBack((x, y) => Math.max(Math.abs(x) - 2.6, Math.abs(y - (sk[1] - 5.6)) - 1.8)), 'print', { where: b.isMat('cape') });
  for (const k of [-1, 1]) b.paint(bones, onBack((x, y) => Math.hypot(x - k * 1.8, y - (sk[1] + 0.2)) - 1.2), 'cape', { shade: 4, where: b.isMat('print') });
  b.paint(bones, onBack((x, y) => Math.abs(x) + Math.abs(y - (sk[1] - 2.2)) * 1.6 - 0.8), 'cape', { shade: 4, where: b.isMat('print') });
  for (const k of [-1, 1]) b.paint(bones, onBack((x, y) => Math.abs((x - k * 0) * Math.cos(k * 0.7) + (y - (sk[1] - 12)) * Math.sin(k * 0.7)) - 0.9 + Math.max(0, Math.abs(-(x) * Math.sin(k * 0.7) + (y - (sk[1] - 12)) * Math.cos(k * 0.7)) - 8.5) * 9), 'print', { where: b.isMat('cape') });
}
