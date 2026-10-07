// Suì-Fēng, Captain of the 2nd Division and Commander-in-Chief of the Onmitsukidō (docs/roster/
// B1-captains-1.md §3). 1.50 m, petite and wiry. Short black hair with a blue sheen, and two long braids
// wrapped in white cloth that end in large gold rings; grey eyes under sharp brows. The Keisen Shōzoku: a
// black top with no sleeves and no back (Shunkō would tear them away), long black bands from the wrists up
// the arms, a white sash with a yellow one a layer above and lower, black hakama, black Chinese shoes over
// white socks. As captain, a sleeveless white haori with 二 on the back; Shunkō throws it off. Suzumebachi
// sealed is a wakizashi with a yellow hilt slung horizontally across the small of her back; Shikai turns
// it into a black-and-gold gauntlet with a stinger on the middle finger; the Bankai is a gold launcher
// that encases the right arm past the shoulder, and a guard over the right half of her face.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, prism, smoothPath, sphere, spike, subtract, torus, tube, type Sdf, type V3 } from '../models/sdf';
import { addBands, faceLegend, hakama, hands, head, humanoidSkeleton, spikeHair, type HumanoidSpec, type Landmarks, type Spike } from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

/** 72 voxels = 1.50 m */
export const SUIFENG_RES = 72 / 1.5;
export type SuifengForm = 'captain' | 'keisen';

const SPEC: HumanoidSpec = {
  H: 72,
  chinY: 60,
  head: { w: 10, d: 11, h: 12 },
  neckR: 2.0,
  shoulder: [7.2, 55.2, -0.5],
  upperArm: 11.8,
  foreArm: 10.8,
  hand: 7,
  armR: 1.9,
  hipsY: 37,
  hip: [3.9, 34.5, 0],
  kneeY: 19.5,
  ankleY: 3.8,
  chest: [6.2, 4.1],
  waist: [4.8, 3.4],
  hips: [6.0, 4.2],
  chestY: 50,
  waistY: 43,
  foot: { len: 9.5, w: 4, heel: 2.4 },
};

function palette(b: ModelBuilder): void {
  b.mat('skin', ['#F8E4D4', '#F2D8C4', '#E4C4AE', '#D3B29C', '#B08E7A'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#3A3F57', '#2A2E42', '#1B1C27', '#16161E', '#141418'], { base: 2, rough: 0.45, shadeK: 0.85, dither: 0.05 });
  b.mat('sheen', ['#4C5470']);
  b.mat('brow', ['#1B1C27']);
  b.mat('lid', ['#141418']);
  b.mat('sclera', ['#F3F1EC']);
  b.mat('iris', ['#8D9099']);
  b.mat('irisD', ['#4A4C54']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#9E6A60']);
  b.mat('wrap', ['#F3F3F1', '#E8E7E2', '#D2D1CB', '#B9B8B2'], { base: 1, rough: 0.85 });
  b.mat('gold', ['#F2D36A', '#D7B03A', '#C29C30', '#A9852A', '#7E621E'], { base: 1, rough: 0.3, metal: 0.8, shadeK: 0.8 });
  b.mat('black', ['#3B3B42', '#2B2B31', '#1E1E23', '#17171B', '#141418'], { base: 2, rough: 0.85, shadeK: 1, dither: 0.04 });
  b.mat('band', ['#2A2A30', '#1E1E23', '#141418'], { base: 1, rough: 0.8 });
  b.mat('sashW', ['#F3F2EE', '#EDEBE6', '#D4D2CC'], { base: 0, rough: 0.85 });
  b.mat('sashY', ['#F0D060', '#E2BF3F', '#C6A22E', '#A08020'], { base: 1, rough: 0.8 });
  b.mat('haori', ['#F4F3EF', '#ECECE8', '#DCDCD8', '#C3C5C9', '#A4A8AF'], { base: 1, rough: 0.82, shadeK: 0.9 });
  b.mat('kanji', ['#141418']);
  b.mat('shoe', ['#2A2A30', '#1E1E23', '#18181C'], { base: 1, rough: 0.6 });
  b.mat('sock', ['#F4F4F2', '#E6E5E1', '#CFCEC9'], { base: 0, rough: 0.85 });
}

/** Grey eyes under sharp, slanted brows; a small, set mouth. Rows 9 → 0. */
const FACE = [
  '. . . . . . . . . .',
  'B B . . . . . . B B',
  '. B B B . . B B B .',
  '. L L L . . L L L .',
  '. W I * . . * I W .',
  '. . i i . . i i . .',
  '. . . . . s . . . .',
  '. . . . . . . . . .',
  '. . . . m m . . . .',
  '. . . . . . . . . .',
];

const assetCache = new Map<SuifengForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function suifengAsset(form: SuifengForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildSuifeng(form)));
  return a;
}

export type SuifengProp = 'sword' | 'sheath' | 'gauntlet' | 'launcher' | 'guard' | 'missile';

export function suifengProp(kind: SuifengProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'sword' ? buildSword() : kind === 'sheath' ? buildSheath() : kind === 'gauntlet' ? buildGauntlet() : kind === 'launcher' ? buildLauncher() : kind === 'guard' ? buildGuard() : buildMissile();
    propCache.set(kind, m);
  }
  return m;
}

/** blade points (prop frame, m) for the samplers: the reverse-grip wakizashi and the stinger */
export const SWORD_TIP_Z = 0.38;
export const STINGER_TIP_Z = 0.2;
/** the launcher's muzzle (prop frame, m), where the missile leaves */
export const MUZZLE: V3 = [0, 0.03, 1.05];

export function buildSuifeng(form: SuifengForm = 'captain'): CharacterAsset {
  const b = new ModelBuilder(`suifeng-${form}`, SUIFENG_RES);
  palette(b);
  const s = SPEC;
  const L = humanoidSkeleton(b, s, { hakama: true });
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 5, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5, wz + 1]);
  b.socket('knuckle.R', 'fist.R', [-wx, wy - 4.3, wz + 3.2]);
  b.socket('knuckle.L', 'fist.L', [wx, wy - 4.3, wz + 3.2]);
  // the gauntlet and the launcher run along the right forearm: +Z down the arm, out past the knuckles
  // (on hand.R, which is never hidden when the fist and palm swap)
  b.socket('arm.R', 'hand.R', [-wx, wy - 4.3, wz + 0.4], [90, 0, 0]);
  b.socket('shoulder.R', 'upperarm.R', [-s.shoulder[0], s.shoulder[1] + 1.5, s.shoulder[2]]);
  const toeZ = L.ankle[2] + s.foot.len - s.foot.heel;
  b.socket('toe.R', 'foot.R', [-L.ankle[0], 1.5, toeZ]);
  b.socket('toe.L', 'foot.L', [L.ankle[0], 1.5, toeZ]);
  b.socket('chest.front', 'chest', [0, s.chestY, 6]);
  b.socket('back', 'chest', [0, s.chestY + 1, -5.5]);
  // the sword rides horizontally across the small of her back, hilt to her right
  b.socket('waist.back', 'spine', [0, s.waistY + 0.6, -s.waist[1] - 2], [0, -90, 0]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.stamp('head', hd.x0, hd.chin + 9, FACE, faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  const springs = hair(b, L, hd);
  hands(b, L, 'skin');
  const torso = body(b, L);
  top(b, L);
  armBands(b, L);
  sashes(b, L, torso);
  hakama(b, L, { black: 'black', collar: 'black', skin: 'skin', obi: 'black', hemR: 7.4, hakamaHem: 3.4 });
  shoes(b, L);
  const colliders: ColliderDef[] = [
    { bone: 'chest', offset: [0, 0.06, -0.02], radius: 0.12 },
    { bone: 'spine', offset: [0, 0.02, -0.01], radius: 0.1 },
    { bone: 'hips', offset: [0, -0.02, -0.01], radius: 0.12 },
    { bone: 'head', offset: [0, 0.12, -0.01], radius: 0.12 },
    { bone: 'thigh.L', offset: [0, -0.1, 0.02], radius: 0.1 },
    { bone: 'thigh.R', offset: [0, -0.1, 0.02], radius: 0.1 },
  ];
  if (form === 'captain') springs.push(...haori(b, L));
  for (const side of ['L', 'R']) springs.push({ bone: `hakama.${side}`, tail: [0, -0.36, 0], stiffness: 70, damping: 6, gravity: 8, limit: 55, radius: 0.1 });
  b.autoShade();
  b.lint();
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- hair

/**
 * Short black hair, the back cropped high, sides to the jaw, a fringe of points over the brow; and from
 * behind each ear a long braid wrapped in white cloth to a large gold ring, on two spring bones a side.
 */
function hair(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): SpringDef[] {
  const s = L.spec;
  const c = hd.chin, front = hd.front;
  const back = front - s.head.d;
  const R = SUIFENG_RES;
  const CAP: Spike[] = [
    { az: 0, el: 60, len: 1.6, r: 3.6, flat: 0.5, flow: [0, -0.3, 0.8] },
    { az: -50, el: 50, len: 2, r: 3.4, flat: 0.5, flow: [-0.1, -0.5, 0.5] },
    { az: 50, el: 50, len: 2, r: 3.4, flat: 0.5, flow: [0.1, -0.5, 0.5] },
    { az: 180, el: 45, len: 2.2, r: 3.6, flat: 0.5, flow: [0, -0.6, -0.4] },
    { az: -130, el: 26, len: 2.4, r: 3.4, flat: 0.5, flow: [0, -0.9, -0.1] },
    { az: 130, el: 26, len: 2.4, r: 3.4, flat: 0.5, flow: [0, -0.9, -0.1] },
    { az: -80, el: 14, len: 3.6, r: 2.6, flat: 0.45, flow: [0, -1.6, 0.2], taper: 1 },
    { az: 80, el: 14, len: 3.6, r: 2.6, flat: 0.45, flow: [0, -1.6, 0.2], taper: 1 },
    { az: 180, el: 10, len: 2, r: 3.2, flat: 0.55, flow: [0, -1, -0.1] },
  ];
  spikeHair(b, L, 'hair', CAP, [
    { x: -3.6, tipY: c + 8.6, lean: -0.6, r: 1.4 },
    { x: -1.3, tipY: c + 8.1, lean: -0.2, r: 1.3 },
    { x: 1.2, tipY: c + 8.2, lean: 0.3, r: 1.3 },
    { x: 3.6, tipY: c + 8.6, lean: 0.6, r: 1.4 },
  ], { hairline: c + s.head.h - 1.2, nape: c + 3, slope: 0.6 });
  b.paint('head', torus([0, c + s.head.h - 1.2, L.headC[2] - 1], 4.3, 0.55, [22, 0, 0]), 'sheen', { where: b.isMat('hair') });
  // the bangs' roots poke out above the crown at the front corners
  for (const k of [-1, 1]) b.carve('head', aabb([k > 0 ? 3 : -9, c + s.head.h + 0.2, front - 2.5], [k > 0 ? 9 : -3, c + 17, front + 3]));
  b.carve('head', aabb([-5, c + 4, front], [-1, c + 7, front + 6]));
  b.carve('head', aabb([1, c + 4, front], [5, c + 7, front + 6]));
  // the braids: from behind the ears, wrapped in white cloth, ending in gold rings
  const springs: SpringDef[] = [];
  for (const k of [-1, 1]) {
    const side = k > 0 ? 'L' : 'R';
    const root: V3 = [k * 4.8, c + 3.5, back + 2.4];
    const mid: V3 = [k * 5.4, c - 9, back - 0.6];
    const end: V3 = [k * 5.6, c - 21, back - 0.4];
    b.bone(`braid.${side}`, 'head', root);
    b.bone(`braid.${side}.2`, `braid.${side}`, mid);
    // a short black root, then the wrapped length
    b.add('head', capsule([k * 4.4, c + 6, back + 2.8], root, 1.4, 1.3), 'hair', { thr: 0.2 });
    const p1 = smoothPath([root, [k * 5.2, c - 3, back + 0.4], mid], 3);
    b.add(`braid.${side}`, tube(p1, p1.map(() => 1.15)), 'wrap', { thr: 0.2 });
    const p2 = smoothPath([mid, [k * 5.6, c - 15, back - 0.7], [end[0], end[1] + 2.4, end[2]]], 3);
    b.add(`braid.${side}.2`, tube(p2, p2.map((_, i) => 1.1 - i * 0.04)), 'wrap', { thr: 0.2 });
    // the binding wraps: thin dark lines round the cloth
    for (let i = 0; i < 7; i++) {
      const y = c + 1 - i * 3.2;
      b.paint([`braid.${side}`, `braid.${side}.2`], cylinder([k * 5.3, y - 0.25, back], [k * 5.3, y + 0.25, back], 2.4), 'wrap', { shade: 3, where: b.isMat('wrap') });
    }
    // the gold ring at the end, standing in the plane of the braid
    b.add(`braid.${side}.2`, torus([end[0], end[1] - 0.6, end[2]], 2.4, 0.6, [90, 0, 0]), 'gold', { thr: 0.2 });
    b.add(`braid.${side}.2`, cylinder([end[0], end[1] + 2.6, end[2]], [end[0], end[1] + 1.4, end[2]], 0.9), 'gold');
    springs.push(
      { bone: `braid.${side}`, tail: [(mid[0] - root[0]) / R, (mid[1] - root[1]) / R, (mid[2] - root[2]) / R], stiffness: 40, damping: 5, gravity: 10, limit: 60, radius: 0.035 },
      { bone: `braid.${side}.2`, tail: [(end[0] - mid[0]) / R, (end[1] - mid[1]) / R, (end[2] - mid[2]) / R], stiffness: 28, damping: 4.5, gravity: 11, limit: 60, radius: 0.04 },
    );
  }
  return springs;
}

// ---------------------------------------------------------------------------------------------- body

/** Petite and wiry: a slim torso, bare shoulders and arms. */
function body(b: ModelBuilder, L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const torso = blend(2.4,
    box([0, s.chestY - 0.5, -0.3], [cx, 5.4, cz], { round: 3 }),
    box([0, s.waistY, -0.2], [wx, 4.2, wz], { round: 2.4 }),
    box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 3.6, s.hips[1]], { round: 2.6 }),
    capsule([2.0, sy + 1.4, sz - 0.8], [sx - 1.4, sy - 0.2, sz], 2.1, 2.1),
    capsule([-2.0, sy + 1.4, sz - 0.8], [-sx + 1.4, sy - 0.2, sz], 2.1, 2.1),
    sphere([sx, sy - 0.5, sz], 2.4), sphere([-sx, sy - 0.5, sz], 2.4));
  const bust = blend(1, ellipsoid([2.3, s.chestY - 1.2, cz - 0.4], [2.2, 2, 2]), ellipsoid([-2.3, s.chestY - 1.2, cz - 0.4], [2.2, 2, 2]));
  const full = blend(1.1, torso, bust);
  addBands(b, full, 'skin', [['hips', 28, s.waistY - 1], ['spine', s.waistY - 1, s.chestY - 4], ['chest', s.chestY - 4, 70]]);
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(1.3, sphere([sx, sy - 0.5, sz], 2.4), capsule([sx, sy - 1, sz], [sx, ey + 0.5, sz], 2.1, 1.9)), 'skin', { mirror: true });
  b.add('forearm.L', blend(1.1, sphere([sx, ey, sz], 1.9), capsule([sx, ey - 0.5, sz], [sx, wy + 1, sz], 1.9, 1.5)), 'skin', { mirror: true });
  return full;
}

/** The Keisen top: black, no sleeves and no back, cut high round the neck. */
function top(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const armpit = s.shoulder[1] - 4;
  const region = fn((x, y, z) => {
    if (y < s.waistY - 4 || y > s.chinY - 2) return 1;
    // the back is bare above the waist
    const backCut = z < -1.4 + Math.max(0, (y - armpit) * 0.1) && y > s.waistY - 2 ? 1 : -1;
    // narrow at the neck, widening to the armpits: the shoulders stay bare
    const w = y > armpit ? 3.2 + (s.chinY - 2 - y) * 0.45 : 30;
    return Math.max(backCut, Math.abs(x) - w);
  }, [-20, s.waistY - 5, -20], [20, s.chinY, 20]);
  b.paint(['chest', 'spine', 'hips'], region, 'black', { where: b.isMat('skin') });
  // a low collar round the base of the neck
  const nz = L.headC[2] - 0.5;
  b.add('neck', subtract(cylinder([0, s.chinY - 6.5, nz], [0, s.chinY - 3.6, nz], s.neckR + 0.8, s.neckR + 0.6), cylinder([0, s.chinY - 7, nz], [0, s.chinY, nz], s.neckR - 0.2)), 'black');
}

/** Long black bands from the wrists up over the elbows to the upper arms, tied at both ends. */
function armBands(b: ModelBuilder, L: Landmarks): void {
  const [sx, sy, sz] = L.spec.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('forearm.L', capsule([sx, ey + 0.5, sz], [sx, wy + 0.3, sz], 2.3, 1.9), 'band', { mirror: true });
  b.add('upperarm.L', capsule([sx, sy - 4.5, sz], [sx, ey + 0.5, sz], 2.4, 2.3), 'band', { mirror: true });
  // the tied ends: a cuff at each end and a short loose tail at the upper tie
  for (const y of [wy + 0.8, sy - 4.2]) b.add(y > ey ? 'upperarm.L' : 'forearm.L', cylinder([sx, y - 0.5, sz], [sx, y + 0.5, sz], y > ey ? 2.8 : 2.4), 'band', { mirror: true });
  b.add('upperarm.L', capsule([sx + 2.4, sy - 4.2, sz - 0.6], [sx + 2.9, sy - 7.4, sz - 1.4], 0.6, 0.45), 'band', { mirror: true, thr: 0.2 });
  // the wraps' spiral lines
  b.paint(['forearm.L', 'forearm.R', 'upperarm.L', 'upperarm.R'], fn((x, y, z) => Math.abs((((y + Math.atan2(z, x) * 1.2) % 2.2) + 2.2) % 2.2 - 1.1) - 0.3, [-20, 10, -10], [20, 60, 10]), 'band', { shade: 2, where: b.isMat('band') });
}

/** The white sash at the waist, and the yellow one a layer above it and lower on the hips. */
function sashes(b: ModelBuilder, L: Landmarks, torso: Sdf): void {
  const s = L.spec;
  const y = s.waistY - 2.4;
  b.add('spine', intersect(subtract(offset(torso, 1.5), offset(torso, -0.6)), aabb([-30, y - 1.2, -30], [30, y + 1.2, 30])), 'sashW');
  const y2 = y - 2;
  b.add('hips', intersect(subtract(offset(torso, 2.3), offset(torso, 0.2)), aabb([-30, y2 - 1, -30], [30, y2 + 0.9, 30]), halfSpace([0, y2, 0], [0.18, -1, 0]), halfSpace([0, y2 - 2, 0], [-0.18, 1, 0])), 'sashY');
  // the yellow sash's knot and tails at her left hip
  const knot: V3 = [s.hips[0] + 1.6, y2, 1];
  b.add('hips', ellipsoid(knot, [1.2, 1.1, 1.1]), 'sashY');
  b.add('hips', capsule([knot[0] + 0.3, y2 - 0.6, knot[2] + 0.3], [knot[0] + 0.9, y2 - 6, knot[2] + 0.8], 0.8, 0.6), 'sashY', { thr: 0.2 });
  b.add('hips', capsule([knot[0] + 0.3, y2 - 0.6, knot[2] - 0.5], [knot[0] + 1.3, y2 - 4.6, knot[2] - 0.9], 0.75, 0.55), 'sashY', { thr: 0.2 });
}

/** Black Chinese slippers over white socks. */
function shoes(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [ax, ay, az] = L.ankle;
  const f = s.foot;
  const toeZ = az + f.len - f.heel;
  b.add('foot.L', capsule([ax, ay + 3.5, az - 0.3], [ax, ay - 1, az - 0.3], 2), 'sock', { mirror: true });
  b.add('foot.L', intersect(box([ax, 1.8, az + (f.len / 2 - f.heel)], [f.w / 2, 1.8, f.len / 2], { round: 1.3 }), halfSpace([0, 3.6, toeZ - 3], [0, 1, 0.7])), 'shoe', { mirror: true });
  b.paint('foot.L', aabb([ax - 5, 0, az - 8], [ax + 5, 0.9, az + 14]), 'shoe', { mirror: true, shade: 3 });
}

/** The captain's haori, sleeveless: from the shoulders to the knees, open down the front, 二 on the back. */
function haori(b: ModelBuilder, L: Landmarks): SpringDef[] {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const R = SUIFENG_RES;
  // the cloth hangs over a smooth form (no bust, no shoulder caps) so it falls in flat planes
  const form = blend(3,
    box([0, s.chestY - 0.5, -0.3], [cx + 0.2, 5.4, cz + 0.4], { round: 3 }),
    box([0, s.waistY, -0.2], [wx + 0.5, 4.2, wz + 0.5], { round: 2.4 }),
    capsule([1.8, sy + 1.4, sz - 0.6], [sx + 0.2, sy - 0.4, sz], 2.4, 2.4),
    capsule([-1.8, sy + 1.4, sz - 0.6], [-sx - 0.2, sy - 0.4, sz], 2.4, 2.4));
  // two voxels of cloth, reaching a little under the form, so the shell rasterises solid (no pinholes)
  const shell = subtract(offset(form, 1.9), offset(form, -0.4));
  const armhole = (k: number) => capsule([k * (sx + 0.6), sy - 1.5, sz], [k * (sx + 0.6), sy - 8, sz], 3.2);
  // open down the front: a V from the back of the neck to the chest, then straight down past the sashes
  const top = s.chinY - 2.4;
  const half = (y: number) => 4.9 - Math.min(1, Math.max(0, (y - s.chestY - 2) / (top - s.chestY - 2))) * 2.5;
  const front = fn((x, y, z) => (z > 0.5 ? Math.abs(x) - half(y) : 1), [-14, 20, -14], [14, 70, 14]);
  const neck = fn((_x, y) => y - top, [-14, 20, -14], [14, 80, 14]);
  const coat = subtract(intersect(shell, neck), armhole(1), armhole(-1), front);
  b.add('chest', intersect(coat, aabb([-30, s.chestY - 4, -30], [30, 80, 30])), 'haori');
  b.add('spine', intersect(coat, aabb([-30, s.waistY - 2, -30], [30, s.chestY - 4, 30])), 'haori');
  // the collar band, a shade down: along both edges of the opening and round the back of the neck
  b.paint(['chest', 'spine'], fn((x, y, z) => (z > 0.5 ? Math.abs(Math.abs(x) - half(y) - 0.8) - 0.9 : top - 1.6 - y), [-14, 20, -14], [14, 70, 14]), 'haori', { shade: 2, where: b.isMat('haori') });
  // the skirt: two panels front, one back, hanging to the knees on spring bones
  const springs: SpringDef[] = [];
  const panels: [string, number, number][] = [['F.L', 40, 100], ['F.R', -100, -40], ['B', 120, 240]];
  for (const [name, a0, a1] of panels) {
    const bone = `haori.${name}`;
    const mid = ((a0 + a1) / 2) * (Math.PI / 180);
    b.bone(bone, 'hips', [Math.sin(mid) * 5, s.waistY - 1, Math.cos(mid) * 4]);
    b.add(bone, fn((x, y, z) => {
      const a = Math.atan2(x, z) * (180 / Math.PI);
      const aa = a < -60 && a0 > 100 ? a + 360 : a;
      const r = Math.hypot(x, z * 1.15);
      const t = (s.waistY - 1 - y) / (s.waistY - 1 - L.knee[1]);
      const R0 = 7.2 + Math.max(0, t) * 2.6;
      return Math.max(Math.abs(r - R0) - 0.6, Math.max(a0 - aa, aa - a1) * 0.1, y - (s.waistY - 1), L.knee[1] + 1 - y);
    }, [-14, L.knee[1], -14], [14, s.waistY, 14]), 'haori', { thr: 0.2 });
    springs.push({ bone, tail: [0, -18 / R, 0], stiffness: 55, damping: 5, gravity: 9, limit: 50, radius: 0.12 });
  }
  // 二 on the upper back
  const g = b.grid('chest');
  const yc = s.chestY + 2;
  for (let x = -4; x <= 4; x++) {
    for (const y of [yc + 2, yc - 2]) {
      if (y === yc + 2 && Math.abs(x) > 2) continue;
      for (let z = -14; z < 0; z++)
        if (g.get(x, y, z) !== 0) {
          b.voxel('chest', x, y, z, 'kanji', 0);
          break;
        }
    }
  }
  return springs;
}

// ---------------------------------------------------------------------------------------------- props

/** Suzumebachi sealed: a short wakizashi with a yellow hilt and a dao-like guard. Origin at the grip, +Z. */
function buildSword(): VoxelModel {
  const b = new ModelBuilder('suzumebachi', 48);
  b.mat('hilt', ['#F0CC5A', '#E0B53A', '#C49A2A', '#9E7A1E'], { base: 1, rough: 0.7 });
  b.mat('steel', ['#E8ECF0', '#D2D7DD', '#B5BBC3', '#959CA6'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('guard', ['#2A2620', '#1C1A17', '#141418'], { base: 1, rough: 0.4, metal: 0.4 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', box([0, 0, -1.2], [0.9, 1.05, 3.4], { round: 0.5 }), 'hilt');
  b.paint('root', fn((x, y, z) => Math.abs(((z + 30) % 1.6) - 0.8) - 0.25, [-2, -2, -5], [2, 2, 2.2]), 'hilt', { shade: 3, where: b.isMat('hilt') });
  b.add('root', sphere([0, 0, -4.8], 1.0), 'guard');
  b.add('root', box([0, 0, 2.6], [1.5, 1.7, 0.45], { round: 0.5 }), 'guard');
  const z0 = 3.1, zTip = 18.4;
  b.add('root', fn((x, y, z) => Math.max(Math.abs(x) - 0.4, Math.abs(y + 0.1 * (z - z0) * 0) - (1.1 - Math.max(0, z - zTip + 2.6) * 0.42), z0 - z, z - zTip), [-1, -2, z0 - 1], [1, 2, zTip + 1]), 'steel', { thr: 0.2 });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** The sheath (empty: the blade is in her hand), carried across the small of the back; origin at its mouth, +Z toward the tip. */
function buildSheath(): VoxelModel {
  const b = new ModelBuilder('suzumebachi-sheath', 48);
  b.mat('lacquer', ['#3A342C', '#2A2620', '#1C1A17', '#141418'], { base: 1, rough: 0.35 });
  b.mat('rope', ['#D8C49A', '#C9B28A', '#A88F68'], { base: 1, rough: 0.9 });
  b.mat('hilt', ['#F0CC5A', '#E0B53A', '#C49A2A', '#9E7A1E'], { base: 1, rough: 0.7 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', box([0, 0, 8.4], [0.8, 1.4, 8.2], { round: 0.6 }), 'lacquer');
  b.add('root', box([0, 0, 0.2], [1.4, 1.6, 0.4], { round: 0.4 }), 'lacquer');
  for (const z of [3, 13]) b.add('root', torus([0, 0, z], 1.6, 0.4, [0, 0, 0]), 'rope', { thr: 0.2 });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * Shikai: the gauntlet on the right hand and forearm, gold with black hornet bands, and the stinger on
 * the middle finger linked by a fine chain. Origin at the grip socket (in the fist), +Z forward of the
 * knuckles, the forearm toward −Z... the stinger points out along +Z past the fingers.
 */
function buildGauntlet(): VoxelModel {
  const b = new ModelBuilder('suzumebachi-shikai', 48);
  b.mat('gold', ['#F2D36A', '#D9A928', '#BC9020', '#9A741A', '#6E5212'], { base: 1, rough: 0.3, metal: 0.8, shadeK: 0.8 });
  b.mat('bandK', ['#1E1E1E', '#141418'], { base: 0, rough: 0.4 });
  b.mat('chain', ['#D2B860', '#B79A4A', '#8E7636'], { base: 1, rough: 0.3, metal: 0.8 });
  b.mat('sting', ['#2A2A2E', '#1A1A1E', '#141418'], { base: 1, rough: 0.2, metal: 0.6 });
  b.bone('root', null, [0, 0, 0]);
  // the hand guard over the back of the fist and the cuff up the forearm (−Y is down the arm in grip space)
  b.add('root', box([0, 0.3, 0.6], [2.4, 2.2, 2.6], { round: 1 }), 'gold');
  b.add('root', cylinder([0, 0, -1], [0, 0, -9], 2.7, 2.4, 0.8), 'gold');
  for (const z of [-3, -5.6, -8]) b.paint('root', cylinder([0, 0, z - 0.5], [0, 0, z + 0.5], 3), 'bandK', { where: b.isMat('gold') });
  // the stinger: from the middle finger's ring, straight out ahead of the fist, black with a gold base
  b.add('root', torus([0, -0.2, 3.4], 1.0, 0.4, [0, 0, 0]), 'gold', { thr: 0.2 });
  b.add('root', spike([0, -0.2, 3.8], [0, 0, 1], 6.5, 0.85, 0.85, { tip: 0.12, taper: 1.2 }), 'sting', { thr: 0.25 });
  b.paint('root', aabb([-2, -2, 3.6], [2, 2, 5]), 'gold', { where: b.isMat('sting') });
  // the fine chain from the cuff to the ring
  const pts = smoothPath([[0, 2.2, -1], [0, 2.6, 1.2], [0, 1.4, 3]], 4);
  b.add('root', tube(pts, pts.map(() => 0.35)), 'chain', { thr: 0.15 });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * Bankai: Jakuhō Raikōben — a gold launcher encasing the right arm from the hand past the shoulder, the
 * barrel ahead of the fist, black markings, a ring of vents at the muzzle. Origin at the grip socket,
 * +Z out along the barrel, the arm runs back toward −Z.
 */
function buildLauncher(): VoxelModel {
  const b = new ModelBuilder('jakuho-raikoben', 48);
  b.mat('gold', ['#F2D36A', '#E1B12C', '#C99A24', '#B5871F', '#7E5E14'], { base: 1, rough: 0.28, metal: 0.85, shadeK: 0.8 });
  b.mat('mark', ['#1A1A1A', '#141418'], { base: 0, rough: 0.4 });
  b.mat('bore', ['#141418']);
  b.bone('root', null, [0, 0, 0]);
  // the numbers are laid out at two-thirds scale; k brings it to about two metres long and half a metre
  // through the swell, far bigger than she is
  const k = 1.5;
  const p = (x: number, y: number, z: number): V3 => [x * k, y * k, z * k];
  // the barrel: a fat tube ahead of the fist, swelling over the forearm, tapering up the arm
  const body = blend(2 * k,
    cylinder(p(0, 1, -26), p(0, 1, 34), 6.2 * k, 6.4 * k, 2 * k),
    ellipsoid(p(0, 1.6, -18), p(8, 8, 12)),
    cylinder(p(0, 1, 24), p(0, 1, 36), 7.2 * k, 7.6 * k, 1.5 * k));
  b.add('root', body, 'gold');
  // the muzzle: open, dark inside
  b.carve('root', cylinder(p(0, 1, 30), p(0, 1, 40), 5 * k));
  b.paint('root', cylinder(p(0, 1, 26), p(0, 1, 40), 5.6 * k), 'bore', { where: b.isMat('gold') });
  // black markings: rings and a stripe along the top
  for (const z of [-6, 6, 18]) b.paint('root', cylinder(p(0, 1, z - 0.8), p(0, 1, z + 0.8), 9 * k), 'mark', { where: b.isMat('gold') });
  b.paint('root', aabb(p(-1.2, 6, -24), p(1.2, 12, 30)), 'mark', { where: b.isMat('gold') });
  // fins round the rear
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    b.add('root', prism([[-20 * k, 0], [-10 * k, 0], [-14 * k, 4.5 * k], [-20 * k, 4.5 * k]], [Math.sin(a) * 6.4 * k, (1 + Math.cos(a) * 6.4) * k, 0], [0, 0, 1], [Math.sin(a), Math.cos(a), 0], 0.5 * k), 'gold', { thr: 0.2 });
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** The guard over the right half of her face, two sight slits (origin at the face socket, +Z out). */
function buildGuard(): VoxelModel {
  const b = new ModelBuilder('jakuho-guard', 48);
  b.mat('gold', ['#F2D36A', '#E1B12C', '#C99A24', '#B5871F'], { base: 1, rough: 0.28, metal: 0.85, shadeK: 0.8 });
  b.mat('slit', ['#141418']);
  b.bone('root', null, [0, 0, 0]);
  b.add('root', intersect(ellipsoid([-1.6, 0.6, -2.6], [4.4, 6.8, 4.2]), fn((x) => x - 0.2, [-8, -8, -8], [8, 8, 8]), fn((_x, _y, z) => -z - 0.4, [-8, -8, -8], [8, 8, 8])), 'gold');
  for (const y of [1.1, -0.6]) b.paint('root', aabb([-4.6, y - 0.4, -1], [-0.6, y + 0.4, 3]), 'slit', { where: b.isMat('gold') });
  b.autoShade({ up: 0.4, open: 2, front: 0.2 });
  b.lint();
  return b.build();
}

/** The missile: a pointed gold cylinder twice her height, black markings, fins (origin at its centre, +Z forward). */
function buildMissile(): VoxelModel {
  const b = new ModelBuilder('jakuho-missile', 24);
  b.mat('gold', ['#F2D36A', '#E1B12C', '#C99A24', '#B5871F', '#7E5E14'], { base: 1, rough: 0.28, metal: 0.85, shadeK: 0.8 });
  b.mat('mark', ['#1A1A1A', '#141418'], { base: 0, rough: 0.4 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', blend(1.5, cylinder([0, 0, -30], [0, 0, 22], 5.6), spike([0, 0, 22], [0, 0, 1], 14, 5.6, 5.6, { tip: 0.4, taper: 1.4 })), 'gold');
  for (const z of [-24, -8, 10]) b.paint('root', cylinder([0, 0, z - 1], [0, 0, z + 1], 7), 'mark', { where: b.isMat('gold') });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    b.add('root', prism([[-30, 0], [-20, 0], [-24, 6], [-30, 6]], [Math.sin(a) * 5.2, Math.cos(a) * 5.2, 0], [0, 0, 1], [Math.sin(a), Math.cos(a), 0], 0.7), 'gold', { thr: 0.2 });
    b.add('root', prism([[0, 0], [8, 0], [4, 3], [0, 3]], [Math.sin(a + 0.8) * 5.2, Math.cos(a + 0.8) * 5.2, 0], [0, 0, 1], [Math.sin(a + 0.8), Math.cos(a + 0.8), 0], 0.5), 'gold', { thr: 0.2 });
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}
