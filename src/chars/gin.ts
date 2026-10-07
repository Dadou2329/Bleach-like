// Gin Ichimaru (docs/roster/B1-captains-1.md §4), as he stood in Aizen's army: 1.85 m and very thin,
// long-limbed, loose-jointed and a little hunched. Ear-length silver hair with lavender shadows and a long
// fringe; the permanent fox grin; the eyes two closed arcs (G opens them: sky blue, the grin gone). The long
// white robe of Las Noches over a black under-kosode, open in a narrow V to the waist, closed to below the
// hips and open again to a mid-calf hem, its edges and lining black; bell sleeves that swallow most of the
// hands; black hakama, tabi and sandals. Shinsō is an ordinary-looking wakizashi: light-blue hilt, a guard
// of two thin swirls looping round the blade like an "S". The standard body at 48 × 84 / 89 vox/m.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, box, capsule, cylinder, ellipsoid, fn, smoothPath, sphere, spike, subtract, torus, tube, type V3 } from '../models/sdf';
import {
  SPEC_ADULT_MALE, coatSkirt, faceLegend, feet, hakama, hands, head, humanoidSkeleton, kosodeTorso, obi, shihakushoSprings, spikeHair,
  type HumanoidSpec, type Landmarks, type Spike,
} from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

export const GIN_RES = (48 * 84) / 89;
export type GinFace = 'grin' | 'open';

/** Tall and thin: narrow chest and waist, long arms, a long reach. */
const SPEC: HumanoidSpec = {
  ...SPEC_ADULT_MALE,
  shoulder: [9.1, 66.5, -0.5],
  upperArm: 15,
  foreArm: 13.6,
  armR: 2.3,
  chest: [7.6, 4.4],
  waist: [6.1, 3.9],
  hips: [6.7, 4.3],
};

function palette(b: ModelBuilder, face: GinFace): void {
  b.mat('skin', ['#F8EADB', '#F1DFCD', '#E2CDB9', '#D2BBA6', '#B39A86'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#E4E8EF', '#CBD0DA', '#B8BDCB', '#A7ACBD', '#8C90A4'], { base: 1, rough: 0.5, shadeK: 0.85, dither: 0.05 });
  b.mat('brow', ['#A7ACBD']);
  b.mat('lid', ['#5E4C52']);
  b.mat('sclera', ['#F3F1EC']);
  b.mat('iris', ['#5EC4F0'], { glow: face === 'open' ? 0.4 : 0 });
  b.mat('irisD', ['#2A6E96']);
  b.mat('mouth', ['#4E3436']);
  b.mat('teeth', ['#F3F1EA']);
  b.mat('black', ['#3B3B42', '#2B2B31', '#1E1E23', '#17171B', '#141418'], { base: 2, rough: 0.88, shadeK: 1, dither: 0.04 });
  b.mat('robe', ['#F3F3F0', '#EFEEEA', '#DDDCD7', '#C5C6C8', '#A7AAB0'], { base: 1, rough: 0.82, shadeK: 0.9 });
  b.mat('edge', ['#2A2A30', '#1E1E23', '#141418'], { base: 1, rough: 0.8 });
  b.mat('tabi', ['#F3F2EE', '#E4E2DD', '#C9C6BF'], { base: 0, rough: 0.85 });
  b.mat('straw', ['#CDB683', '#B99A63', '#8A6A3E'], { base: 1, rough: 0.95 });
  b.mat('cord', ['#5B4632']);
}

/**
 * Rows 9 → 0 (column 0 is his right). The eyes two closed arcs bowed upward, thin brows high; the grin
 * from cheek to cheek, its corners pulled high, the teeth showing.
 */
const FACE_GRIN = [
  '. . . . . . . . . .',
  '. . . . . . . . . .',
  '. b B . . . . B b .',
  '. . L L . . L L . .',
  '. L . . L L . . L .',
  '. . . . . . . . . .',
  '. . . . . s . . . .',
  '. m . . . . . . m .',
  '. . m T T T T m . .',
  '. . . . . . . . . .',
];
/** Eyes open: narrow, sky blue; the grin gone to a thin line. */
const FACE_OPEN = [
  '. . . . . . . . . .',
  '. . . . . . . . . .',
  '. . B B . . B B . .',
  '. L L L . . L L L .',
  '. W I I . . I I W .',
  '. . i . . . . i . .',
  '. . . . . s . . . .',
  '. . . . . . . . . .',
  '. . . m m m m . . .',
  '. . . . . . . . . .',
];

const assetCache = new Map<GinFace, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function ginAsset(face: GinFace = 'grin'): CharacterAsset {
  let a = assetCache.get(face);
  if (!a) assetCache.set(face, (a = buildGin(face)));
  return a;
}

/** Shinsō (sealed and Bankai look alike): the wakizashi. */
export function ginProp(kind: 'shinso' = 'shinso'): VoxelModel {
  let m = propCache.get(kind);
  if (!m) propCache.set(kind, (m = buildShinso()));
  return m;
}

/** blade (prop frame, m): base and tip, for the samplers; the extension grows out of the tip */
export const SHINSO_BASE_Z = 0.09;
export const SHINSO_TIP_Z = 0.44;

export function buildGin(face: GinFace = 'grin'): CharacterAsset {
  const b = new ModelBuilder(`gin-${face}`, GIN_RES);
  palette(b, face);
  const s = SPEC;
  const L = humanoidSkeleton(b, s, { sleeves: true, hakama: true });
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 5, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5, wz + 1]);
  b.socket('finger.L', 'palm.L', [wx - 0.2, wy - s.hand - 0.5, wz + 1]);
  b.socket('chest.front', 'chest', [0, 61, 6]);
  b.socket('back', 'chest', [0, 60, -6.5]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  // a narrow, sharp face: shave the jaw in a little
  for (const k of [-1, 1]) b.carve('head', box([k * 5.4, hd.chin + 1.2, hd.front - 2], [0.9, 2.2, 3], { rot: [0, 0, k * 20] }));
  b.stamp('head', hd.x0, hd.chin + 9, face === 'grin' ? FACE_GRIN : FACE_OPEN, faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'sclera', mouth: 'mouth', teeth: 'teeth' }), hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  hair(b, L, hd, face);
  hands(b, L, 'skin');
  feet(b, L, 'tabi', 'straw', 'cord');
  const o = { black: 'robe', collar: 'edge', skin: 'black', obi: 'black', crossY: s.chestY - 9, hakamaHem: 2.5 };
  kosodeTorso(b, L, o);
  sleeves(b, L);
  obi(b, L, o);
  hakama(b, L, { ...o, black: 'black' });
  const skirt = coatSkirt(b, L, { mat: 'robe', lining: 'edge', yTop: s.waistY - 2, yHem: 13, r0: 9.6, r1: 12.4, openFront: 14, res: GIN_RES });
  // the black edge down the robe's opening and round the hem
  b.paint(['F.L', 'F.R', 'S.L', 'S.R', 'B.L', 'B.R'].flatMap((n) => [`coat.${n}`, `coat.${n}.2`]), fn((x, y) => y - 14.4, [-30, 0, -30], [30, 15, 30]), 'edge', { where: b.isMat('robe') });
  b.autoShade();
  b.lint();
  const base = shihakushoSprings();
  return { model: b.build(), springs: [...base.springs, ...skirt.springs], colliders: [...base.colliders, ...skirt.colliders], warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- head

/** Straight silver hair to the ears and the nape; the long fringe falls between and over the eyes. */
function hair(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }, face: GinFace): void {
  const s = L.spec;
  const c = hd.chin, front = hd.front;
  const CAP: Spike[] = [
    { az: 0, el: 64, len: 2, r: 3.8, flat: 0.5, flow: [0, -0.1, 0.9] },
    { az: -48, el: 56, len: 2.6, r: 3.6, flat: 0.5, flow: [-0.1, -0.3, 0.6] },
    { az: 48, el: 56, len: 2.6, r: 3.6, flat: 0.5, flow: [0.1, -0.3, 0.6] },
    { az: 180, el: 50, len: 3, r: 4, flat: 0.5, flow: [0, -0.6, -0.4] },
    { az: -130, el: 32, len: 3.4, r: 3.8, flat: 0.5, flow: [0, -0.8, -0.2] },
    { az: 130, el: 32, len: 3.4, r: 3.8, flat: 0.5, flow: [0, -0.8, -0.2] },
    { az: -92, el: 22, len: 3, r: 3.4, flat: 0.5, flow: [0, -0.85, 0.05] },
    { az: 92, el: 22, len: 3, r: 3.4, flat: 0.5, flow: [0, -0.85, 0.05] },
    { az: 180, el: 14, len: 3.6, r: 3.6, flat: 0.55, flow: [0, -0.95, -0.1] },
    { az: -158, el: 6, len: 3.4, r: 3.2, flat: 0.55, flow: [0, -0.95, -0.05] },
    { az: 158, el: 6, len: 3.4, r: 3.2, flat: 0.55, flow: [0, -0.95, -0.05] },
  ];
  spikeHair(b, L, 'hair', CAP, [], { tufts: 22, tuftFlow: [0, -0.5, -0.2], hairline: c + s.head.h - 1, slope: 0.6 });
  // the fringe: straight locks down over the forehead to the eyes, parted a little off centre; with the
  // eyes closed one falls between them
  const locks: [number, number, number, number][] = [[-4.3, c + 6.8, 1.3, -0.3], [-2.3, c + 6.2, 1.35, 0.1], [-0.3, c + (face === 'grin' ? 4.6 : 7.4), 1.15, 0.2], [1.8, c + 6.6, 1.35, -0.1], [3.9, c + 7.2, 1.3, 0.4]];
  for (const [x, tipY, r, lean] of locks) {
    const top: V3 = [x - lean, c + 11.8, front - 1.2];
    b.add('head', spike(top, [lean * 0.3, -1, 0.1], top[1] - tipY, r, r * 0.55, { side: [1, 0, 0], tip: 0.3 }), 'hair', { thr: 0.3 });
  }
  // keep the open eyes clear
  if (face === 'open') {
    b.carve('head', aabb([-5, c + 4, front], [-1, c + 7, front + 4]));
    b.carve('head', aabb([1, c + 4, front], [5, c + 7, front + 4]));
  }
  // over the ears to the jaw line
  for (const k of [-1, 1]) {
    const pts = smoothPath([[k * 5.6, c + 10.5, front - 4.5], [k * 6.2, c + 6.5, front - 4.6], [k * 6, c + 2.6, front - 5]], 3);
    b.add('head', tube(pts, pts.map((_, i) => 1.9 - i * 0.14)), 'hair', { thr: 0.3 });
  }
  // the back: straight to the nape
  const back = L.headC[2] - s.head.d / 2;
  for (let i = -2; i <= 2; i++) {
    const pts = smoothPath([[i * 1.8, c + 9, back + 1], [i * 2, c + 3, back - 0.6], [i * 2.1, c - 1 + Math.abs(i) * 0.6, back - 0.8]], 3);
    b.add('head', tube(pts, pts.map((_, j) => 1.7 - j * 0.12)), 'hair', { thr: 0.3 });
  }
}

// ---------------------------------------------------------------------------------------------- sleeves

/**
 * The robe's long bell sleeves: narrow at the shoulder, flaring past the elbow into a wide mouth that hangs
 * over the hand; black inside. Their hanging backs ride the sleeve spring bones.
 */
function sleeves(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', cylinder([sx + 0.4, ey - 1.5, sz - 0.3], [sx + 0.2, sy + 0.5, sz - 0.2], 3.7, 3, 1.3), 'robe', { mirror: true });
  b.add('upperarm.L', sphere([sx, sy - 0.5, sz], 2.8), 'robe', { mirror: true });
  // the bell: from the elbow down past the wrist, flaring
  b.add('forearm.L', cylinder([sx + 0.6, wy - 3.6, sz - 0.6], [sx + 0.4, ey + 1.5, sz - 0.3], 5.6, 3.6, 1.2), 'robe', { mirror: true });
  b.add('forearm.L', sphere([sx + 0.3, ey, sz - 0.2], 3.4), 'robe', { mirror: true });
  // hollow mouth (dark lining), the wrist inside
  b.carve('forearm.L', cylinder([sx + 0.6, wy - 4.6, sz - 0.6], [sx + 0.6, wy + 2.5, sz - 0.6], 4.4, 2.6));
  b.carve('forearm.R', cylinder([-sx - 0.6, wy - 4.6, sz - 0.6], [-sx - 0.6, wy + 2.5, sz - 0.6], 4.4, 2.6));
  b.paint('forearm.L', cylinder([sx + 0.6, wy - 4, sz - 0.6], [sx + 0.6, wy + 3, sz - 0.6], 5.2, 3.4), 'edge', { mirror: true, where: b.isMat('robe') });
  b.add('forearm.L', capsule([sx, wy + 6, sz], [sx, wy - 0.5, sz], 1.7), 'skin', { mirror: true, only: 'empty' });
  // the hanging back of each sleeve
  const bz = sz - 5.6;
  b.add('sleeve.L', ellipsoid([sx + 0.8, (ey + wy) / 2 - 2, bz], [3.2, (ey - wy) / 2 + 2.4, 2.6]), 'robe', { mirror: true });
  b.paint('sleeve.L', aabb([sx - 4, wy - 8, bz - 6], [sx + 6, wy - 3.8, bz + 6]), 'edge', { mirror: true, where: b.isMat('robe') });
  // fold lines
  for (const dz of [-1.4, 1.2]) b.paint('sleeve.L', capsule([sx + 3.8, ey - 2, bz + dz], [sx + 3.9, wy - 4, bz + dz * 1.3], 0.5), 'robe', { shade: 3, mirror: true });
}

// ---------------------------------------------------------------------------------------------- Shinsō

/**
 * Shinsō: a wakizashi, ~55 cm overall. Origin at the grip, blade along +Z, edge toward −Y. A light-blue
 * wrapped hilt with a dark diamond pattern, a small round pommel; the guard two thin steel swirls looping
 * round the blade's base into an open "S"; a steel blade with a slight curve and a bright edge.
 */
function buildShinso(): VoxelModel {
  const b = new ModelBuilder('shinso', 48);
  b.mat('wrap', ['#B7DDF0', '#8CC6E3', '#6FAED0', '#4F8FB4'], { base: 1, rough: 0.8 });
  b.mat('ray', ['#2E4F66']);
  b.mat('steel', ['#E8ECF0', '#D4D9DE', '#B7BDC5', '#959CA6'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('edgeLine', ['#F3F3F0'], { rough: 0.15, metal: 0.8 });
  b.mat('guard', ['#C2C8D0', '#AEB4BC', '#8E949D'], { base: 1, rough: 0.3, metal: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  // hilt
  b.add('root', box([0, 0, -1.6], [1, 1.15, 3.8], { round: 0.5 }), 'wrap');
  b.paint('root', fn((x, y, z) => Math.abs(((Math.abs(y) + z + 30) % 2.6) - 1.3) - 0.45, [-2, -2, -6], [2, 2, 2.4]), 'ray', { where: b.isMat('wrap') });
  b.add('root', sphere([0, 0, -5.6], 1.25), 'guard');
  // the S guard: two thin loops round the blade's base, open on opposite sides
  b.add('root', subtract(torus([0, 1.2, 2.9], 1.6, 0.38), box([1.6, 1.2, 2.9], [1.2, 1.2, 1])), 'guard', { thr: 0.2 });
  b.add('root', subtract(torus([0, -1.2, 2.9], 1.6, 0.38), box([-1.6, -1.2, 2.9], [1.2, 1.2, 1])), 'guard', { thr: 0.2 });
  b.add('root', box([0, 0, 3.4], [0.8, 1.4, 0.6], { round: 0.3 }), 'guard');
  // blade: 17 long, 2.4 wide, a slight curve toward the spine, the point clipped
  const z0 = 4, zEnd = 19.6, zTip = 21.6;
  const curve = (z: number) => Math.max(0, z - z0) * Math.max(0, z - z0) * 0.0024;
  const blade = fn((x, y, z) => {
    const c = curve(z);
    const top = 1.2 + c, bot = -1.2 + c + Math.max(0, z - zEnd) * (2.4 / (zTip - zEnd));
    return Math.max(Math.abs(x) - 0.42, y - top, bot - y, z0 - z, z - zTip);
  }, [-1, -2, z0 - 1], [1, 3, zTip + 1]);
  b.add('root', blade, 'steel', { thr: 0.2 });
  b.paint('root', fn((x, y, z) => y - (-0.6 + curve(z) + Math.max(0, z - zEnd) * (2.4 / (zTip - zEnd))), [-1, -2, z0 - 1], [1, 3, zTip + 1]), 'edgeLine', { where: b.isMat('steel') });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

