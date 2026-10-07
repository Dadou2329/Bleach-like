// Nnoitra Gilga — Quinto Espada, Despair (docs/roster/E1-espada-1.md). 2.15 m, rail-thin and lanky, long
// arms and legs, a slight forward hunch. Sealed: long straight black hair curtaining the left side of his
// face over the large white eyepatch (the Hollow hole is under it), one narrow eye, a huge grin baring the
// upper teeth; the white jacket with the oversized spoon-shaped hood standing behind his head, open from the
// neck to the waist; three gold rings on each wrist; a black sash; the hakama tucked into long black boots
// whose toes curl up to a point. Santa Teresa: two gold crescent blades fused back to back on top of a long
// dark shaft, a chain from the butt ring to his waist. Released (Santa Teresa, "Inore"): the jacket and the
// hood gone; crescent-moon horns (the left one longer), a gold estigma from the forehead down past the right
// eye, the mask round the hole torn so its teeth stretch across it; white tendrils wrapping the sides of his
// torso; a second pair of arms; every arm in segmented ivory carapace ending in dark claws, each holding a
// mantis scythe with a gold tassel.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, smoothPath, sphere, spike, subtract, torus, tube, type Sdf, type V3 } from '../models/sdf';
import { addBands, faceLegend, hands, head, humanoidSkeleton, spikeHair, type HumanoidSpec, type Landmarks } from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

/** 103 voxels = 2.15 m */
export const NNOITRA_RES = 103 / 2.15;
/** 'sealed', 'patch' (the eyepatch lifted: the hole shown), 'santa' (Santa Teresa, four arms) */
export type NnoitraForm = 'sealed' | 'patch' | 'santa';

/** Very tall and lanky: a narrow chest and hips, long arms and legs. */
const SPEC: HumanoidSpec = {
  H: 103,
  chinY: 89,
  head: { w: 10, d: 12, h: 14 },
  neckR: 2.3,
  shoulder: [9.6, 83.5, -0.5],
  upperArm: 19,
  foreArm: 17,
  hand: 11,
  armR: 2.2,
  hipsY: 56,
  hip: [4.2, 53, 0],
  kneeY: 30,
  ankleY: 5,
  chest: [7.6, 4.6],
  waist: [5.6, 3.8],
  hips: [6.4, 4.3],
  chestY: 76,
  waistY: 65,
  foot: { len: 13, w: 5, heel: 3.2 },
};
/** the second pair of arms' shoulder (left side; Santa Teresa) */
const SHOULDER2: V3 = [8.4, 75, -1.2];

function palette(b: ModelBuilder): void {
  // pale, but a step warmer and darker than the white cloth so the bare chest and the face read against it
  b.mat('skin', ['#EEE4D6', '#E6D9C8', '#D6C6B2', '#BFAA94', '#9C8670'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#3A3B42', '#2A2B31', '#1E1F24', '#17181C', '#141418'], { base: 2, rough: 0.4, shadeK: 0.85, dither: 0.04 });
  b.mat('brow', ['#1E1F24']);
  b.mat('lid', ['#1E1F24']);
  b.mat('sclera', ['#E8E4DC']);
  b.mat('iris', ['#4A4D52']);
  b.mat('irisD', ['#1A1B1E']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#5A2A2E']);
  b.mat('inner', ['#2E1418']);
  b.mat('teeth', ['#F3F1EA'], { rough: 0.35 });
  b.mat('teethD', ['#9E9284']);
  // a cool white against the warm skin, its rim a shade down
  b.mat('patch', ['#F3F3F0', '#E9ECEE', '#D3D7DB', '#AEB3BA'], { base: 1, rough: 0.55 });
  b.mat('white', ['#F3F2EE', '#ECEBE6', '#DCDCD8', '#C4C6C9', '#A6AAB2'], { base: 1, rough: 0.82, shadeK: 0.9 });
  b.mat('trim', ['#2A2A2E', '#1A1A1C', '#141418'], { base: 1, rough: 0.8 });
  b.mat('sash', ['#2C2C32', '#1C1C20', '#141418'], { base: 1, rough: 0.8 });
  b.mat('gold', ['#F1D774', '#D9B23A', '#B08A22', '#86661A'], { base: 1, rough: 0.3, metal: 0.85 });
  b.mat('boot', ['#33333A', '#222227', '#18181C', '#141418'], { base: 1, rough: 0.45, metal: 0.1 });
  b.mat('bone', ['#F3F0E7', '#EAE4D4', '#D6CDBA', '#BDB29C', '#9C917C'], { base: 1, rough: 0.42, shadeK: 1 });
  b.mat('void', ['#060609'], { rough: 1 });
  // Santa Teresa
  b.mat('shell', ['#F2EEE3', '#ECE7DB', '#D9D2C2', '#C0B7A4', '#A0967F'], { base: 1, rough: 0.45, shadeK: 1 });
  b.mat('claw', ['#3A3530', '#2A2622', '#1C1916'], { base: 1, rough: 0.4 });
  b.mat('estigma', ['#E1B530']);
  b.mat('tendril', ['#F3F0E8', '#E9E5DA', '#D4CEBF'], { base: 1, rough: 0.6 });
}

/**
 * His right eye narrow and snake-like: a long slanted upper lid over a single row of white with the dark
 * gray iris, a thin brow angled down toward the nose. The grin runs cheek to cheek, its corners pulled up:
 * the upper lip line, two rows of big upper teeth (gaps sunk one voxel), the dark of the mouth under them.
 * The left side is the eyepatch (or the hole). Rows from the top (chin + 9) down to the chin.
 */
const FACE = [
  '. B B . . . . . . .',
  '. . . B . . . . . .',
  '. L L L L . . . . .',
  '. . W I W . . . . .',
  'm . . . . . . . . m',
  'm L L L L L L L L m',
  'm T T g T T g T T m',
  '. m T g T T g T m .',
  '. . m D D D D m . .',
  '. . . . . . . . . .',
];
/** Santa Teresa: the same grin, the estigma running from the forehead down past his right eye. */
const FACE_SANTA = [
  '. B E . . . . . . .',
  '. . E B . . . . . .',
  '. L L L L . . . . .',
  '. . W I W . . . . .',
  'm . E . . . . . . m',
  'm L L L L L L L L m',
  'm T T g T T g T T m',
  '. m T g T T g T m .',
  '. . m D D D D m . .',
  '. . . . . . . . . .',
];

const assetCache = new Map<NnoitraForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function nnoitraAsset(form: NnoitraForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildNnoitra(form)));
  return a;
}

export type NnoitraProp = 'teresa' | 'scythe' | 'tongue';

export function nnoitraProp(kind: NnoitraProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'teresa' ? buildTeresa() : kind === 'tongue' ? buildTongue() : buildScythe();
    propCache.set(kind, m);
  }
  return m;
}

/** Santa Teresa (prop frame, m): the crescents' centre, the butt ring the chain hangs from, the blade edges */
export const TERESA_HEAD_Z = 52 / 48;
export const TERESA_RING: V3 = [0, 0, -43 / 48];
export const TERESA_REACH = 0.66;
/** a mantis scythe (prop frame, m): the blade's root and tip */
export const SCYTHE_ROOT: V3 = [0, -0.04, 30 / 48];
export const SCYTHE_TIP: V3 = [0, -30 / 48, 18 / 48];

export function buildNnoitra(form: NnoitraForm = 'sealed'): CharacterAsset {
  const b = new ModelBuilder(`nnoitra-${form}`, NNOITRA_RES);
  palette(b);
  const s = SPEC;
  const santa = form === 'santa';
  const L = humanoidSkeleton(b, s);
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 5, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5, wz + 1]);
  b.socket('chest.front', 'chest', [0, s.chestY, 6]);
  b.socket('back', 'chest', [0, s.chestY + 2, -6]);
  // the chain is fixed at his waist, on his right hip
  b.socket('chain', 'hips', [-7.2, s.waistY - 6, 1.5]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  // the tongue (his Cero comes off its tip)
  b.socket('mouth', 'head', [0, s.chinY + 1.5, hd.front + 1]);
  b.stamp('head', hd.x0, hd.chin + 9, santa ? FACE_SANTA : FACE, {
    ...faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth', teeth: 'teeth', inner: 'inner' }),
    E: { mat: 'estigma' },
    g: { mat: 'teethD', sink: 1 },
    D: { mat: 'inner', sink: 1 },
  }, hd.front - 1);
  // the nose: one voxel proud between the eye and the grin's corner
  b.voxel('head', -1, hd.chin + 5, hd.front, 'skin', 1);
  const springs: SpringDef[] = [];
  const colliders: ColliderDef[] = [
    { bone: 'chest', offset: [0, 0.06, -0.02], radius: 0.13 },
    { bone: 'head', offset: [0, 0.12, -0.01], radius: 0.13 },
  ];
  const full = body(b, L);
  hair(b, L, hd, springs);
  hole(b, L, hd, form);
  if (santa) {
    arms2(b, L);
    carapace(b, L);
    horns(b, L, hd);
    tendrils(b, L, full);
  } else {
    hands(b, L, 'skin');
    jacket(b, L, full);
    hood(b, L);
    rings(b, L);
  }
  sash(b, L, full);
  trousers(b, L);
  boots(b, L);
  b.autoShade();
  b.lint();
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- body

/** A lean, long torso: the ribs and the stomach drawn on the bare front, narrow hips. */
function body(b: ModelBuilder, L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const torso = blend(3,
    box([0, s.chestY - 0.5, -0.4], [cx, 7, cz], { round: 3.2 }),
    box([0, s.waistY, -0.3], [wx, 5, wz], { round: 2.8 }),
    box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 4, s.hips[1]], { round: 2.6 }),
    capsule([2.3, sy + 1.6, sz - 0.8], [sx - 1.5, sy - 0.2, sz], 2.6, 2.7),
    capsule([-2.3, sy + 1.6, sz - 0.8], [-sx + 1.5, sy - 0.2, sz], 2.6, 2.7),
    sphere([sx, sy - 0.5, sz], 2.9), sphere([-sx, sy - 0.5, sz], 2.9));
  addBands(b, torso, 'skin', [['hips', 36, s.waistY - 1], ['spine', s.waistY - 1, s.chestY - 4], ['chest', s.chestY - 4, 120]]);
  // the bare front: pectorals, a lean six-pack, the ribs at the sides (shading lines only)
  for (const k of [-1, 1]) {
    b.paint('chest', capsule([k * 1, s.chestY - 1, cz + 0.6], [k * 6, s.chestY - 0.4, cz + 0.2], 0.55), 'skin', { shade: 3, where: b.isMat('skin') });
    for (const y of [s.waistY + 4.5, s.waistY + 1.5, s.waistY - 1.5]) b.paint(['spine', 'chest'], capsule([k * 0.8, y, wz + 1], [k * 3, y, wz + 0.6], 0.45), 'skin', { shade: 2, where: b.isMat('skin') });
    for (const y of [s.chestY - 3, s.chestY - 5.5]) b.paint('chest', capsule([k * (cx - 0.5), y, 1.5], [k * (cx - 1.6), y - 1.6, 3.4], 0.45), 'skin', { shade: 3, where: b.isMat('skin') });
  }
  b.paint(['spine', 'chest'], capsule([0, s.waistY + 6, wz + 1.2], [0, s.waistY - 3, wz + 1], 0.45), 'skin', { shade: 3, where: b.isMat('skin') });
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(1.3, sphere([sx, sy - 0.5, sz], 2.8), capsule([sx, sy - 1, sz], [sx, ey + 0.5, sz], 2.4, 2.0)), 'skin', { mirror: true });
  b.add('forearm.L', blend(1.1, sphere([sx, ey, sz], 2.1), capsule([sx, ey - 0.5, sz], [sx, wy + 1, sz], 2.1, 1.7)), 'skin', { mirror: true });
  b.add('thigh.L', blend(1.3, sphere([s.hip[0], s.hip[1], 0], 3.6), capsule([s.hip[0], s.hip[1], 0], [L.knee[0], L.knee[1] + 1, 0], 3.4, 2.6)), 'skin', { mirror: true });
  b.add('shin.L', blend(1.2, sphere([L.knee[0], L.knee[1], 0], 2.6), capsule([L.knee[0], L.knee[1], 0], [L.ankle[0], L.ankle[1], 0], 2.5, 1.8)), 'skin', { mirror: true });
  return torso;
}

/** the hole in his left eye socket (under the eyepatch), ringed by a small toothed jaw */
function hole(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }, form: NnoitraForm): void {
  const c = hd.chin, front = hd.front;
  const ex = 2.6, ey = c + 7;
  if (form === 'sealed') {
    // the eyepatch: a large rounded plate standing one voxel proud of his left eye socket, from the brow
    // down to the cheek beside the grin's corner; its rim a shade down so it reads against the pale skin
    const pc: V3 = [2.4, c + 7.9, 0];
    const ell = (x: number, y: number) => Math.hypot((x - pc[0]) / 2.9, (y - pc[1]) / 3.2);
    b.add('head', fn((x, y, z) => Math.max((ell(x, y) - 1) * 2.9, Math.abs(z - front) - 1), [-1, c + 4, front - 2], [6, c + 12, front + 2]), 'patch');
    b.paint('head', fn((x, y) => 0.68 - ell(x, y), [-1, c + 4, front - 2], [6, c + 12, front + 2]), 'patch', { shade: 3, where: b.isMat('patch') });
    b.paint('head', fn((x, y) => ell(x, y) - 0.45, [-1, c + 4, front - 2], [6, c + 12, front + 2]), 'patch', { shade: 0, where: b.isMat('patch') });
    return;
  }
  // the hole: straight through the socket, black inside
  b.carve('head', cylinder([ex, ey, -8], [ex, ey, front + 3], 1.7));
  b.paint('head', cylinder([ex, ey, -9], [ex, ey, front + 3], 2.6), 'void', { where: b.isMat('skin', 'hair') });
  // the mask fragment ringing it: a jaw with teeth along its rim
  // (kept clear of the grin's corner just under it)
  b.add('head', subtract(torus([ex, ey, front + 0.1], 2.5, 0.85, [90, 0, 0]), halfSpace([0, 0, front - 0.6], [0, 0, -1]), aabb([3.6, c + 3, front - 3], [6, c + 6, front + 3])), 'bone', { thr: 0.2 });
  const teeth = form === 'santa' ? 8 : 6;
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2 + 0.3;
    const r = form === 'santa' ? 0.4 : 1.6;
    // torn open (Santa Teresa): the teeth stretch right across the hole
    b.voxel('head', Math.round(ex + Math.cos(a) * r - 0.5), Math.round(ey + Math.sin(a) * r - 0.5), front, 'bone', 0);
  }
  if (form === 'santa') {
    for (const y of [ey - 1.2, ey + 0.8]) b.add('head', box([ex, y, front - 0.2], [2.3, 0.45, 0.6]), 'bone');
  }
}

// ---------------------------------------------------------------------------------------------- hair

/**
 * Long, straight black hair: a smooth cap, a curtain down the back to the shoulder blades, a lock down the
 * right side of his face, and a heavier curtain over the left side and the eyepatch.
 */
function hair(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }, springs: SpringDef[]): void {
  const s = L.spec;
  const c = hd.chin;
  const front = hd.front;
  spikeHair(b, L, 'hair', [
    { az: 0, el: 66, len: 2.4, r: 4.4, flat: 0.45, flow: [0, -0.2, -1] },
    { az: -60, el: 50, len: 2.4, r: 4.2, flat: 0.45, flow: [0, -0.4, -0.9] },
    { az: 60, el: 50, len: 2.4, r: 4.2, flat: 0.45, flow: [0, -0.4, -0.9] },
    { az: 180, el: 40, len: 3, r: 4.4, flat: 0.5, flow: [0, -0.8, -0.4] },
    { az: -140, el: 30, len: 3, r: 4.2, flat: 0.5, flow: [0, -0.9, -0.3] },
    { az: 140, el: 30, len: 3, r: 4.2, flat: 0.5, flow: [0, -0.9, -0.3] },
  ], [], { tufts: 0, hairline: c + s.head.h - 1, slope: 0.6 });
  // the back: a straight curtain to the shoulders, then on down the back on two spring bones
  const back = L.headC[2] - s.head.d / 2;
  b.add('head', blend(1.5,
    ellipsoid([0, c + 7.5, back + 1.5], [6.2, 7.6, 4.2]),
    box([0, c + 0.5, back + 0.6], [6, 5, 2.2], { round: 1.6 })), 'hair');
  b.bone('hairB1', 'head', [0, c - 3, back + 0.2]);
  b.bone('hairB2', 'hairB1', [0, c - 12, back - 0.8]);
  b.add('hairB1', box([0, c - 7.5, back - 0.2], [6, 5.2, 1.8], { round: 1.4 }), 'hair');
  b.add('hairB2', intersect(box([0, c - 16, back - 1], [5.6, 4.4, 1.6], { round: 1.2 }), fn((x, y) => c - 20.4 + Math.abs(Math.sin(x * 1.3)) * 2.4 - y, [-7, c - 22, back - 4], [7, c - 11, back + 3])), 'hair');
  const R = NNOITRA_RES;
  springs.push({ bone: 'hairB1', tail: [0, -9 / R, -1 / R], stiffness: 60, damping: 5, gravity: 9, limit: 40, radius: 0.05 });
  springs.push({ bone: 'hairB2', tail: [0, -8 / R, -0.5 / R], stiffness: 40, damping: 4.5, gravity: 10, limit: 45, radius: 0.05 });
  // the side curtains: straight strands packed edge to edge (each a little further back round the head), so
  // they read as one sheet with grooves. The left one falls over the eyepatch's outer edge, bows out past the
  // grin's corner and on down beside the jaw; the right one frames the cheek. The tips end at uneven lengths.
  const curtain = (k: number, n: number, x0: number, dx: number, z0: number, dz: number, tips: number[], over: boolean) => {
    for (let j = 0; j < n; j++) {
      const x = k * (x0 + dx * j), z = z0 - dz * j, sx = k;
      const ctrl: V3[] = over
        ? [[x - sx * 1.5, c + 14, z - 4], [x, c + 11, z], [x + sx * 0.6, c + 8, z - 0.1], [x + sx * 1.6, c + 6, z - 0.5], [x + sx * 2.2, c + 3.5, z - 1.3], [x + sx * 2.3, tips[j], z - 1.9]]
        : [[x - sx * 1, c + 13.5, z - 3], [x, c + 9, z], [x + sx * 0.4, c + 3, z - 0.4], [x + sx * 0.5, tips[j], z - 0.9]];
      const path = smoothPath(ctrl, 4);
      b.add('head', tube(path, path.map((_, i) => 1.15 * (1 - 0.55 * (i / (path.length - 1)) ** 2))), 'hair', { thr: 0.3 });
    }
  };
  curtain(1, 5, 3.6, 0.9, front + 1.1, 1, [c - 1.5, c - 3.5, c - 2.5, c - 4.5, c - 3], true);
  curtain(-1, 3, 5.5, 0.85, front - 2.2, 0.9, [c - 3.5, c - 2, c - 4], false);
  // the fringe: two locks parting high on the forehead
  for (const [x, tipY, r] of [[-3, c + 10.6, 1.3], [-0.6, c + 11, 1.2], [1.8, c + 10.2, 1.3]] as [number, number, number][]) {
    const top: V3 = [x, c + 13.4, front - 1.2];
    b.add('head', spike(top, [x * 0.04, -1, 0.08], top[1] - tipY, r, r * 0.55, { side: [1, 0, 0], tip: 0.3 }), 'hair', { thr: 0.3 });
  }
  // strand lines
  b.paint(['head', 'hairB1', 'hairB2'], fn((x) => Math.abs(((x + 40) % 2.2) - 1.1) - 0.3, [-8, c - 24, back - 6], [8, c + 15, back + 3]), 'hair', { shade: 3, where: b.isMat('hair') });
  // keep his right eye, the brow and the grin clear
  b.carve('head', aabb([-5, c + 4, front], [-1, c + 10, front + 6]));
  b.carve('head', aabb([-5, c, front], [5, c + 6, front + 6]));
}

// ---------------------------------------------------------------------------------------------- sealed

/** The jacket: white, black trims, open from the neck to the sash; long sleeves with black cuffs. */
function jacket(b: ModelBuilder, L: Landmarks, torso: Sdf): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  const open = fn((x, y, z) => (z < 0 ? 1 : Math.abs(x) - (3.2 + Math.max(0, y - s.waistY) * 0.08)), [-12, s.waistY - 8, 0], [12, sy + 10, 14]);
  const shell = subtract(intersect(subtract(offset(torso, 1.2), offset(torso, 0.1)), aabb([-30, s.waistY - 6, -30], [30, sy + 8, 30])), open);
  addBands(b, shell, 'white', [['spine', s.waistY - 6, s.chestY - 4], ['chest', s.chestY - 4, 120]]);
  // black trims down both edges of the opening and round the shoulders' seams
  b.paint(['chest', 'spine'], fn((x, y, z) => (z < 0 ? 1 : Math.abs(Math.abs(x) - (3.2 + Math.max(0, y - s.waistY) * 0.08)) - 1.1), [-12, s.waistY - 8, 0], [12, sy + 10, 14]), 'trim', { where: b.isMat('white') });
  // the collar standing up round the back of his neck (the hood springs from it)
  const nz = L.headC[2] - 1;
  b.add('chest', subtract(intersect(cylinder([0, sy - 2, nz], [0, s.chinY - 3, nz], 5.4, 5.2), halfSpace([0, 0, nz + 2.2], [0, 0, 1])), cylinder([0, sy - 3, nz], [0, s.chinY, nz], 4.2)), 'white');
  b.paint('chest', aabb([-8, s.chinY - 4.2, -12], [8, s.chinY - 2, 12]), 'trim', { where: b.isMat('white') });
  // long sleeves
  b.add('upperarm.L', blend(1.5, sphere([sx, sy - 0.5, sz], 3.6), cylinder([sx + 0.2, ey - 0.5, sz], [sx, sy - 0.5, sz], 3.2, 3.4, 1.1)), 'white', { mirror: true });
  b.add('forearm.L', blend(1.2, sphere([sx, ey, sz], 3.1), cylinder([sx, wy + 2.6, sz], [sx, ey + 1, sz], 3.4, 3.1, 1)), 'white', { mirror: true });
  b.paint('forearm.L', cylinder([sx, wy + 1.6, sz], [sx, wy + 2.8, sz], 3.8), 'trim', { mirror: true, where: b.isMat('white') });
  for (const dy of [2.2, -2.4]) b.paint('forearm.L', torus([sx, ey + dy, sz], 3.2, 0.5), 'white', { shade: 3, mirror: true });
  b.paint('upperarm.L', torus([sx, ey + 4, sz], 3.3, 0.5, [0, 0, 8]), 'white', { shade: 3, mirror: true });
  // the jacket's skirt over the hakama, open at the front
  const yTop = s.waistY - 5, yHem = s.hipsY - 14;
  b.add('hips', fn((x, y, z) => {
    const k = Math.max(0, Math.min(1, (yTop - y) / (yTop - yHem)));
    const rx = 8.2 + k * 2.2, rz = 6 + k * 2;
    const dr = Math.abs(Math.hypot(x / rx, (z + 0.3) / rz) - 1) * Math.min(rx, rz) - 0.6;
    const th = Math.abs(Math.atan2(x, z + 0.3));
    return Math.max(dr, 0.55 - th, y - yTop, yHem - y);
  }, [-13, yHem - 1, -10], [13, yTop + 1, 10]), 'white');
  b.paint('hips', fn((x, y, z) => Math.max(y - (yHem + 1.1), -(Math.abs(Math.atan2(x, z + 0.3)) - 0.5) - 0.2), [-13, yHem - 2, -10], [13, yTop + 1, 10]), 'trim', { where: b.isMat('white') });
}

/**
 * The hood: a huge spoon-bowl standing up behind his head from the back of the collar, its hollow toward
 * him, a black rim round its edge.
 */
function hood(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const c = s.chinY;
  const back = L.headC[2] - s.head.d / 2;
  const ctr: V3 = [0, c + 8, back - 5];
  const R: V3 = [8.6, 13, 3.6];
  const bowl = intersect(
    subtract(ellipsoid(ctr, R), ellipsoid([ctr[0], ctr[1], ctr[2] + 1.3], [R[0] - 1.2, R[1] - 1.2, R[2]])),
    halfSpace([0, 0, ctr[2] + 1.2], [0, 0, 1]),
    halfSpace([0, c - 4, 0], [0, -1, 0]),
  );
  b.add('chest', bowl, 'white');
  // the hollow a shade down, the rim black
  b.paint('chest', ellipsoid([ctr[0], ctr[1], ctr[2] + 1.4], [R[0] - 1.1, R[1] - 1.1, R[2]]), 'white', { shade: 3, where: b.isMat('white') });
  // the rim: the bowl's front lip all round, and a band just inside the outer edge
  b.paint('chest', aabb([-20, c - 1, ctr[2] + 0.1], [20, c + 30, ctr[2] + 1.4]), 'trim', { where: b.isMat('white') });
  b.paint('chest', intersect(subtract(ellipsoid(ctr, [R[0] + 0.5, R[1] + 0.5, R[2] + 0.5]), ellipsoid(ctr, [R[0] - 0.7, R[1] - 0.7, R[2] + 3])), halfSpace([0, c - 1, 0], [0, -1, 0])), 'trim', { where: b.isMat('white') });
  // the stem joining it to the collar at the back of his neck
  b.add('chest', box([0, c - 4, back - 3.4], [3.2, 2.8, 2.8], { round: 0.8 }), 'white');
}

/** three gold rings round each wrist */
function rings(b: ModelBuilder, L: Landmarks): void {
  const [sx, , sz] = L.spec.shoulder;
  const wy = L.wrist[1];
  for (const dy of [3.4, 5.2, 7]) b.add('forearm.L', torus([sx, wy + dy, sz], 2.0, 0.55), 'gold', { mirror: true, thr: 0.15 });
}

// ---------------------------------------------------------------------------------------------- legs

/** The black sash round the waist, knotted on his left. */
function sash(b: ModelBuilder, L: Landmarks, torso: Sdf): void {
  const s = L.spec;
  const y = s.waistY - 3;
  b.add('spine', intersect(subtract(offset(torso, 2.2), offset(torso, 0.2)), aabb([-30, y - 2, -30], [30, y + 2, 30])), 'sash');
  const kx = s.waist[0] + 2.2;
  b.add('hips', ellipsoid([kx, y - 2.4, 1.6], [1.4, 1.5, 1.6]), 'sash');
  b.add('hips', capsule([kx + 0.3, y - 3.4, 2], [kx + 0.8, y - 10, 2.6], 1, 0.8), 'sash', { thr: 0.2 });
}

/** The hakama: baggy over the thighs, gathered into the boots below the knee. */
function trousers(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [hx, hy] = s.hip;
  const ky = L.knee[1];
  b.add('hips', box([0, s.hipsY - 1, -0.3], [s.hips[0] + 1.8, 5.5, s.hips[1] + 1.8], { round: 2.6 }), 'white');
  b.add('thigh.L', blend(1.5, sphere([hx, hy, 0], 5), capsule([hx + 0.3, hy - 1, 0], [hx + 0.4, ky + 1, 0], 4.8, 4.2)), 'white', { mirror: true });
  b.add('shin.L', blend(1.2, sphere([hx + 0.4, ky, 0], 4.1), capsule([hx + 0.4, ky, 0], [hx + 0.2, 17, 0.2], 4, 3.2)), 'white', { mirror: true });
  // big folds running down the legs
  for (const a of [-40, 10, 60, 160]) {
    const r = (a * Math.PI) / 180;
    b.paint('thigh.L', capsule([hx + Math.sin(r) * 4.8, hy - 2, Math.cos(r) * 4.8], [hx + Math.sin(r) * 4.3, ky + 2, Math.cos(r) * 4.3], 0.6), 'white', { shade: 3, mirror: true, where: b.isMat('white') });
    b.paint('shin.L', capsule([hx + Math.sin(r) * 4.1, ky - 1, Math.cos(r) * 4.1], [hx + Math.sin(r) * 3.3, 18, Math.cos(r) * 3.3], 0.55), 'white', { shade: 3, mirror: true, where: b.isMat('white') });
  }
}

/** Long black boots to below the knee, the toes drawn out and curled up into a point. */
function boots(b: ModelBuilder, L: Landmarks): void {
  const [ax, ay, az] = L.ankle;
  const f = L.spec.foot;
  b.add('shin.L', cylinder([ax, ay + 2, az], [ax, 20, az + 0.2], 2.9, 3.4, 0.8), 'boot', { mirror: true });
  b.add('shin.L', torus([ax, 19.6, az + 0.2], 3.5, 0.7), 'boot', { mirror: true });
  b.add('foot.L', capsule([ax, ay + 3, az - 0.4], [ax, ay - 1, az - 0.4], 2.8, 2.6), 'boot', { mirror: true });
  b.add('foot.L', intersect(box([ax, 2.0, az + (f.len / 2 - f.heel)], [f.w / 2, 2.0, f.len / 2], { round: 1.4 }), halfSpace([0, 4.2, az + f.len - f.heel - 4], [0, 1, 0.6])), 'boot', { mirror: true });
  // the toe drawn out and curled up
  const toe = az + f.len - f.heel;
  b.add('foot.L', spike([ax, 1.6, toe - 2], [0, 0.15, 1], 6, 1.9, 1.5, { bend: [0, 0.55, -0.1], tip: 0.5 }), 'boot', { mirror: true, thr: 0.2 });
  b.paint('foot.L', aabb([ax - 5, 0, az - 8], [ax + 5, 0.9, az + 20]), 'boot', { shade: 3, mirror: true });
}

// ---------------------------------------------------------------------------------------------- Santa Teresa

/** Every arm in segmented ivory carapace, the hands clawed. */
function carapace(b: ModelBuilder, L: Landmarks): void {
  const [sx, sy, sz] = L.spec.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  armShell(b, ['upperarm.L', 'forearm.L', 'hand.L'], [sx, sy, sz], ey, wy);
  // the main hands: claws
  claws(b, 'fist.L', 'palm.L', [L.wrist[0], wy, L.wrist[2]]);
}

function armShell(b: ModelBuilder, bones: [string, string, string], sh: V3, ey: number, wy: number): void {
  const [sx, sy, sz] = sh;
  b.add(bones[0], blend(1.3, sphere([sx, sy - 0.5, sz], 3.2), capsule([sx, sy - 1, sz], [sx, ey + 0.5, sz], 2.9, 2.5)), 'shell', { mirror: true });
  b.add(bones[1], blend(1.1, sphere([sx, ey, sz], 2.6), capsule([sx, ey - 0.5, sz], [sx, wy + 1, sz], 2.6, 2.1)), 'shell', { mirror: true });
  // a spur off the elbow, segment grooves
  b.add(bones[1], spike([sx, ey - 1, sz - 1.6], [0.1, 0.2, -1], 4.5, 1.3, 1, { tip: 0.35 }), 'shell', { mirror: true, thr: 0.2 });
  for (const y of [sy - 6, sy - 11, sy - 15]) b.paint(bones[0], cylinder([sx, y - 0.4, sz], [sx, y + 0.4, sz], 3.4), 'shell', { shade: 3, mirror: true, where: b.isMat('shell') });
  for (const y of [ey - 5, ey - 10, ey - 14]) b.paint(bones[1], cylinder([sx, y - 0.4, sz], [sx, y + 0.4, sz], 3), 'shell', { shade: 3, mirror: true, where: b.isMat('shell') });
}

/** clawed hands: a carapace fist with three dark claws hooking down off the knuckles */
function claws(b: ModelBuilder, fist: string, palm: string, w: V3): void {
  const [wx, wy, wz] = w;
  const gy = wy - 4.3;
  b.add(fist, subtract(box([wx - 0.1, gy, wz + 0.4], [2.3, 3.2, 3], { round: 1.1 }), cylinder([wx - 0.1, gy, wz - 6], [wx - 0.1, gy, wz + 6], 1.2)), 'shell', { mirror: true });
  b.add(fist, capsule([wx, wy + 0.5, wz], [wx, wy - 1.5, wz], 2), 'shell', { mirror: true });
  for (const dz of [-1.6, 0.4, 2.4]) b.add(fist, spike([wx + 1.6, gy - 2, wz + dz], [0.4, -1, 0.15], 3.2, 0.8, 0.6, { tip: 0.3 }), 'claw', { mirror: true, thr: 0.2 });
  // the open hand (unused in the release, but the bone must not be empty)
  b.add(palm, blend(1.2, box([wx, wy - 3, wz + 0.3], [1.6, 3, 2.5], { round: 1 }), capsule([wx, wy + 0.5, wz], [wx, wy - 1.5, wz], 2)), 'shell', { mirror: true });
  for (const dz of [-1.4, 0.6, 2.4]) b.add(palm, spike([wx - 0.2, wy - 5, wz + dz], [0, -1, 0.1], 3.6, 0.8, 0.6, { tip: 0.3 }), 'claw', { mirror: true, thr: 0.2 });
}

/** The second pair of arms: from the sides of his chest below the shoulders, the same carapace and claws. */
function arms2(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [x2, y2, z2] = SHOULDER2;
  const ey = y2 - s.upperArm, wy = ey - s.foreArm;
  b.boneSym('upperarm2.L', 'chest', SHOULDER2);
  b.boneSym('forearm2.L', 'upperarm2.L', [x2, ey, z2]);
  b.boneSym('hand2.L', 'forearm2.L', [x2, wy, z2]);
  b.boneSym('fist2.L', 'hand2.L', [x2, wy, z2]);
  b.boneSym('palm2.L', 'hand2.L', [x2, wy, z2]);
  b.socket('grip2.R', 'fist2.R', [-x2 + 0.1, wy - 4.3, z2 + 0.4]);
  b.socket('grip2.L', 'fist2.L', [x2 - 0.1, wy - 4.3, z2 + 0.4]);
  // the root: a knot of carapace where it breaks out of his side
  b.add('chest', ellipsoid([x2 - 0.6, y2, z2], [2.6, 3, 3]), 'shell', { mirror: true });
  armShell(b, ['upperarm2.L', 'forearm2.L', 'hand2.L'], SHOULDER2, ey, wy);
  claws(b, 'fist2.L', 'palm2.L', [x2, wy, z2]);
}

/**
 * Half-moon horns, mismatched (the left one bigger): each rises from the side of his crown, swings out
 * and up round a circle and curls back in over his head at a point, flat like the crescents of the weapon.
 */
function horns(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): void {
  const c = hd.chin;
  for (const k of [-1, 1]) {
    const big = k > 0;
    const R = big ? 8 : 6.4;
    const a0 = (-120 * Math.PI) / 180, a1 = ((big ? 100 : 82) * Math.PI) / 180;
    const cx = k * (3.8 + 0.5 * R), cy = c + 13 + 0.866 * R;
    const pts: V3[] = [];
    const n = 16;
    for (let i = 0; i <= n; i++) {
      const a = a0 + (i / n) * (a1 - a0);
      pts.push([cx + k * R * Math.cos(a), cy + R * Math.sin(a), -1.2 - (i / n) * 1.5]);
    }
    // thick through the middle of the arc, tapering to the root and to a sharp tip
    const rad = pts.map((_, i) => {
      const t = i / n;
      return 0.45 + 1.9 * Math.sin(Math.PI * Math.min(1, t * 1.15)) ** 0.8 + (t < 0.12 ? 0.9 * (1 - t / 0.12) : 0);
    });
    b.add('head', intersect(tube(pts, rad), fn((x, y, z) => Math.abs(z + 1.2 + Math.max(0, Math.min(1, (y - c - 12) / 16)) * 1.5) - 1.4, [-30, c, -12], [30, c + 40, 10])), 'bone', { thr: 0.3 });
  }
}

/** White tendrils wrapping round the sides of his torso. */
function tendrils(b: ModelBuilder, L: Landmarks, torso: Sdf): void {
  const s = L.spec;
  for (const k of [-1, 1])
    for (let i = 0; i < 3; i++) {
      const y0 = s.chestY - 2 - i * 4.5;
      const pts: V3[] = [];
      for (let j = 0; j <= 8; j++) {
        const a = -1.2 + (j / 8) * 2.4;
        const yy = y0 - (j / 8) * 3;
        // wrapped on the surface: scan the torso inward along the ray
        const dx = Math.cos(a) * k, dz = Math.sin(a);
        let r = 12;
        while (r > 0 && torso.d(dx * r, yy, dz * r) > 0.4) r -= 0.2;
        pts.push([dx * r, yy, dz * r]);
      }
      b.add(y0 > s.chestY - 4 ? 'chest' : 'spine', tube(pts, pts.map(() => 0.9)), 'tendril', { thr: 0.2 });
    }
}

// ---------------------------------------------------------------------------------------------- props

/**
 * Santa Teresa: two gold crescents fused back to back on top of a long dark shaft (their horns point away
 * from the shaft, the cutting edges are the inner curves), a gold collar under them, a ring at the butt for
 * the chain. Prop frame: the grip at the origin, the shaft along +Z, the crescents spread along ±Y.
 */
function buildTeresa(): VoxelModel {
  const b = new ModelBuilder('nnoitra-teresa', NNOITRA_RES);
  b.mat('gold', ['#F1D774', '#D9B23A', '#B08A22', '#86661A'], { base: 1, rough: 0.42, metal: 0.8 });
  b.mat('edge', ['#F3E5A2'], { rough: 0.3, metal: 0.85 });
  b.mat('shaft', ['#3A3A42', '#2B2B30', '#1E1E22', '#141418'], { base: 1, rough: 0.5, metal: 0.3 });
  b.mat('steel', ['#B6BBC1', '#8C9096', '#6E7278'], { base: 1, rough: 0.3, metal: 0.85 });
  b.bone('root', null, [0, 0, 0]);
  // the shaft
  b.add('root', cylinder([0, 0, -40], [0, 0, 50], 1.3), 'shaft');
  for (const z of [-30, -14, 4, 20]) b.paint('root', cylinder([0, 0, z - 0.6], [0, 0, z + 0.6], 1.6), 'shaft', { shade: 3 });
  // the butt ring for the chain
  b.add('root', torus([0, 0, -42.4], 2.2, 0.7, [0, 0, 90]), 'steel', { thr: 0.2 });
  b.add('root', cylinder([0, 0, -41], [0, 0, -39], 1.7), 'steel');
  // the collar under the head
  b.add('root', cylinder([0, 0, 31], [0, 0, 35], 2.4, 1.8, 0.6), 'gold');
  // the crescents: discs minus offset discs, in the YZ plane, 2 thick
  const zH = 52, R = 22, d = 8;
  const cres = (k: number) => fn((x, y, z) => {
    const outer = Math.hypot(y - k * R, z - zH) - R;
    const inner = Math.hypot(y - k * (R + d), z - zH) - R * 0.94;
    return Math.max(Math.abs(x) - 1, outer, -inner);
  }, [-2, k > 0 ? -1 : -R * 2.4, zH - R - 2], [2, k > 0 ? R * 2.4 : 1, zH + R + 2]);
  b.add('root', cres(1), 'gold');
  b.add('root', cres(-1), 'gold');
  // their inner curves are the edges
  for (const k of [1, -1])
    b.paint('root', fn((x, y, z) => Math.max(Math.abs(x) - 2, Math.abs(Math.hypot(y - k * (R + d), z - zH) - R * 0.94 - 0.6) - 0.7), [-2, -R * 2.4, zH - R - 2], [2, R * 2.4, zH + R + 2]), 'edge', { where: b.isMat('gold') });
  // the join: a thick boss where the backs meet the shaft
  b.add('root', box([0, 0, zH], [2, 3, 8], { round: 1.4 }), 'gold');
  b.autoShade();
  b.lint();
  return b.build();
}

/**
 * His tongue stuck out to show his rank: long, pink, the "5" in black on top. Prop frame: its root at the
 * origin (the mouth socket), lying along +Z, its top toward +Y.
 */
function buildTongue(): VoxelModel {
  const b = new ModelBuilder('nnoitra-tongue', NNOITRA_RES);
  b.mat('tongue', ['#E6909A', '#D9737F', '#B85A66', '#94434F'], { base: 1, rough: 0.35 });
  b.mat('ink', ['#1A1A1E']);
  b.bone('root', null, [0, 0, 0]);
  b.add('root', blend(1, box([0, 0, 4], [2.2, 0.9, 4.2], { round: 0.8 }), ellipsoid([0, -0.2, 8.4], [2, 0.9, 1.8])), 'tongue');
  // the groove down its middle
  b.paint('root', aabb([-0.4, 0, 0], [0.4, 2, 9]), 'tongue', { shade: 2 });
  // the 5 on top, read from in front of him: rows run from the tip back toward the root
  const FIVE = ['x x x', 'x . .', 'x x x', '. . x', 'x x x'];
  const g = b.grid('root');
  FIVE.forEach((row, r) => row.split(' ').forEach((ch, c) => {
    if (ch !== 'x') return;
    const x = 1 - c, z = 7 - r;
    for (let y = 3; y > -3; y--) if (g.get(x, y, z) !== 0) {
      b.voxel('root', x, y, z, 'ink', 0);
      break;
    }
  }));
  b.autoShade();
  b.lint();
  return b.build();
}

/**
 * A mantis scythe: a long staff, a curved blade sweeping down off its top like a mantis's foreleg, a gold
 * tassel at the bottom. Prop frame: the grip at the origin, the staff along +Z, the blade toward −Y.
 */
function buildScythe(): VoxelModel {
  const b = new ModelBuilder('nnoitra-scythe', NNOITRA_RES);
  b.mat('bone', ['#F2EEE3', '#ECE7DB', '#D9D2C2', '#C0B7A4'], { base: 1, rough: 0.4 });
  b.mat('edge', ['#F3F1EA'], { rough: 0.25 });
  b.mat('gold', ['#F1D774', '#E0B030', '#B08A22'], { base: 1, rough: 0.35, metal: 0.7 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', cylinder([0, 0, -22], [0, 0, 31], 1.05), 'bone');
  for (const z of [-12, 0, 12, 22]) b.paint('root', cylinder([0, 0, z - 0.5], [0, 0, z + 0.5], 1.4), 'bone', { shade: 3 });
  // the blade: off the top, curving down and back like a mantis's foreleg
  const pts = smoothPath([[0, 0, 31], [0, -8, 32], [0, -18, 29], [0, -26, 23], [0, -30, 17]], 4);
  b.add('root', fn((x, y, z) => {
    let best = 1e9, bi = 0;
    for (let i = 0; i < pts.length; i++) {
      const d = Math.hypot(y - pts[i][1], z - pts[i][2]);
      if (d < best) { best = d; bi = i; }
    }
    const t = bi / (pts.length - 1);
    const w = 3.2 * (1 - t) + 1;
    // a flat blade: the inner (lower) side sharp
    return Math.max(Math.abs(x) - (1 - t * 0.3), best - w);
  }, [-2, -34, 12], [2, 2, 37]), 'bone');
  b.paint('root', fn((x, y, z) => {
    let best = 1e9;
    for (const p of pts) best = Math.min(best, Math.hypot(y - (p[1] - 2.2), z - (p[2] - 2.2)));
    return Math.max(Math.abs(x) - 2, best - 1.2);
  }, [-2, -34, 10], [2, 2, 37]), 'edge', { where: b.isMat('bone') });
  // the gold tassel
  b.add('root', sphere([0, 0, -23], 1.5), 'gold');
  b.add('root', cylinder([0, 0, -24], [0, 0, -29], 1.5, 2.1, 0.4), 'gold');
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) b.paint('root', capsule([dx * 1.8, dy * 1.8, -24], [dx * 2.1, dy * 2.1, -29], 0.5), 'gold', { shade: 3 });
  b.autoShade();
  b.lint();
  return b.build();
}
