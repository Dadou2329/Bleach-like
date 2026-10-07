// Nelliel Tu Odelschwanck — former Tres Espada, Sacrifice (docs/roster/E2-espada-2.md §7). Three bodies on
// one skeleton family:
// - Adult (Hueco Mundo): 1.76 m, tall and very curvy, long legs; long wavy green hair; a ram-horned skull
//   worn on top of the head (the upper skull with its eye sockets and a row of teeth over her forehead, two
//   missing); the scar from the forehead down between her eyes and the crimson line across her cheeks and nose;
//   lower canines. The child's gown torn by the growth: a green top with ragged cap sleeves, a short ragged
//   skirt and one strip of cloth down her belly between them; bare feet; a big "3" in the middle of her back.
//   Gamuza sealed: a katana with a green hilt and a guard of two crescent moons back to back.
// - Nel Tu (child): ≈95 cm, super-deformed (the head a third of her height), huge hazel eyes, the cartoon
//   skull perched on her head (a crack down its left side, four teeth on its left broken off), the big scar,
//   the crimson line under her eyes and big lower fangs; a little green hooded gown down to her bare feet.
// - Gamuza (Resurrección): her torso on a chamois-like body, olive-brown, slim legs with cloven hooves, a black
//   horse tail with a white ring at its root; longer horns that curve down to frame her cheeks; white spaulders
//   from the shoulder blades to the neck, black-sheathed arms with white elbow guards and gauntlets; the
//   double-ended lance. The torso keeps the green top.
// Character's left = +X. Colours from the dossier (green hair of the TYBW anime; hazel eyes).
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, prism, smoothPath, sphere, spike, subtract, torus, tube, union, type Sdf, type V3 } from '../models/sdf';
import { addBands, coatSkirt, faceLegend, hands, head, humanoidSkeleton, spikeHair, type HumanoidSpec, type Landmarks, type Spike } from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

/** 84 voxels = 1.76 m */
export const NEL_RES = 84 / 1.76;
/** 'adult' (Hueco Mundo, torn gown), 'child' (Nel Tu), 'gamuza' (the Resurrección: a centaur) */
export type NelForm = 'adult' | 'child' | 'gamuza';

/** Tall and curvy: a small waist between a very full bust and wide hips, long legs. */
const SPEC: HumanoidSpec = {
  H: 84,
  chinY: 72,
  head: { w: 10, d: 11, h: 12 },
  neckR: 2.2,
  shoulder: [8.3, 66.2, -0.5],
  upperArm: 13.8,
  foreArm: 12.6,
  hand: 8,
  armR: 2.1,
  hipsY: 45.5,
  hip: [4.5, 42.5, 0],
  kneeY: 23.5,
  ankleY: 4.3,
  chest: [6.6, 4.6],
  waist: [4.9, 3.6],
  hips: [7.4, 5.0],
  chestY: 60,
  waistY: 51.5,
  foot: { len: 11, w: 4.5, heel: 2.8 },
};
const BUST_Y = SPEC.chestY - 1.8;

/** Nel Tu: ≈95 cm, the head a third of her height. */
const CHILD: HumanoidSpec = {
  H: 46,
  chinY: 30,
  head: { w: 14, d: 13, h: 15 },
  neckR: 1.9,
  shoulder: [5.0, 27.5, -0.3],
  upperArm: 6.6,
  foreArm: 5.8,
  hand: 4.4,
  armR: 1.7,
  hipsY: 15.5,
  hip: [2.5, 14, 0],
  kneeY: 8,
  ankleY: 2.4,
  chest: [4.8, 4.0],
  waist: [4.7, 3.9],
  hips: [5.0, 4.1],
  chestY: 23.5,
  waistY: 19,
  foot: { len: 6, w: 3.2, heel: 1.6 },
};

/** Gamuza: the torso rides 0.52 m higher, on the front of the animal body. */
const DY = 25;
const GSPEC: HumanoidSpec = {
  ...SPEC,
  H: SPEC.H + DY,
  chinY: SPEC.chinY + DY,
  shoulder: [SPEC.shoulder[0], SPEC.shoulder[1] + DY, SPEC.shoulder[2]],
  hipsY: SPEC.hipsY + DY,
  hip: [SPEC.hip[0], SPEC.hip[1] + DY, SPEC.hip[2]],
  kneeY: SPEC.kneeY + DY,
  ankleY: SPEC.ankleY + DY,
  chestY: SPEC.chestY + DY,
  waistY: SPEC.waistY + DY,
};
/** the animal body (voxels): the barrel's centre, the legs' joints (left side), the tail's root */
const HORSE = {
  barrel: [0, 55, -30] as V3,
  fore: { hip: [6.2, 56, 1] as V3, knee: [6.2, 25, 2.5] as V3, fetlock: [6.2, 7, 3] as V3 },
  hind: { hip: [6.6, 57, -58] as V3, hock: [6.6, 25, -66] as V3, fetlock: [6.6, 7, -64.5] as V3 },
  tail: [0, 62, -69.5] as V3,
};

function palette(b: ModelBuilder, form: NelForm): void {
  b.mat('skin', ['#F8DCC8', '#F0CBB3', '#E2B59C', '#CC9C84', '#AE7F6B'], { base: 1, rough: 0.55, shadeK: 0.85 });
  // the hair a cool, sea green; the gown a warmer leaf green, so the two masses part
  b.mat('hair', ['#86D4AC', '#62C092', '#4AA87C', '#3A8E68', '#2B7052'], { base: 1, rough: 0.45, shadeK: 0.8, dither: 0.03 });
  b.mat('brow', ['#3A8E68']);
  b.mat('lid', ['#2B2420']);
  b.mat('sclera', ['#F1EEE8']);
  b.mat('iris', ['#9A7039']);
  b.mat('irisD', ['#4A3018']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#7E3A42']);
  b.mat('teeth', ['#F3F1EA'], { rough: 0.35 });
  b.mat('scar', ['#D99A8C']);
  b.mat('estigma', ['#B32638']);
  b.mat('gown', ['#7CC261', '#5FAA4B', '#4E953F', '#3F7D34', '#2F6127'], { base: 1, rough: 0.85, shadeK: 0.6 });
  b.mat('gownIn', ['#2F6127'], { rough: 0.9 });
  b.mat('bone', ['#F3F0E6', '#ECE6D8', '#DCD3C1', '#C9C0AC', '#A79E8A'], { base: 1, rough: 0.42, shadeK: 1 });
  b.mat('void', ['#16161A'], { rough: 1 });
  b.mat('ink', ['#2A2A30']);
  if (form === 'gamuza') {
    b.mat('coat', ['#9A9762', '#8A8756', '#7D7A49', '#6E6B3F', '#5C5935'], { base: 2, rough: 0.8, shadeK: 0.5, dither: 0.06 });
    b.mat('belly', ['#B8B48A', '#A5A077', '#8F8A63'], { base: 1, rough: 0.85, shadeK: 0.5, dither: 0.06 });
    b.mat('tail', ['#34343A', '#26262B', '#1C1C20', '#141418'], { base: 1, rough: 0.6, shadeK: 0.8 });
    b.mat('armor', ['#F3F1EA', '#EBE7DC', '#D8D3C6', '#BFBAAE', '#A29D92'], { base: 1, rough: 0.38, shadeK: 1 });
    b.mat('sheath', ['#3A3A42', '#2A2A30', '#1E1E22', '#151517'], { base: 1, rough: 0.5, shadeK: 0.85 });
    b.mat('hoof', ['#3E3832', '#2E2A25', '#211E1A'], { base: 1, rough: 0.45 });
  }
}

/** Big hazel eyes under a dark lash line; green brows; the scar between the eyes; the crimson line across the
 *  face; lower canines at the corners of the mouth. Rows chin+9 → chin. */
const FACE = [
  '. b b b . S b b b .',
  'L L L L . S L L L L',
  '. W I I . S I I W .',
  '. W * I . . I * W .',
  '. . i I . . I i . .',
  '. E E E E E E E E .',
  '. . . . . . . . . .',
  '. . . . . . . . . .',
  '. . . T m m T . . .',
  '. . . . . . . . . .',
];
/** Nel Tu: huge eyes, the big scar from the forehead to the nose, the crimson line under the eyes, a wide
 *  mouth with big lower fangs. 14 columns, rows chin+11 → chin. */
const CHILD_FACE = [
  '. . . . . . S S . . . . . .',
  '. . . . . . S S . . . . . .',
  '. L L L L . S S . L L L L .',
  'L W I I I L S S L I I I W L',
  '. W I * I I S S I I * I W .',
  '. W I I i I S S I i I I W .',
  '. . I I I . S S . I I I . .',
  'E E E E E E E E E E E E E E',
  '. . . . . . . . . . . . . .',
  '. . . . T D D D D T . . . .',
  '. . . . . m m m m . . . . .',
  '. . . . . . . . . . . . . .',
];
/** the Espada number on her back */
const THREE = ['x x x', '. . x', '. x x', '. . x', 'x x x'];

const assetCache = new Map<NelForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function nelAsset(form: NelForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildNelliel(form)));
  return a;
}

export type NelProp = 'gamuza' | 'lance';

export function nelProp(kind: NelProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) propCache.set(kind, (m = kind === 'gamuza' ? buildGamuzaSword() : buildLance()));
  return m;
}

/** the katana's blade (prop frame, m) */
export const GAMUZA_BASE_Z = 6 / 48;
export const GAMUZA_TIP_Z = 40 / 48;
/** the lance: grip at the origin, a point at each end (prop frame, m) */
export const LANCE_TIP_Z = 62 / 48;
export const LANCE_CONE_Z = 9 / 48;

export function buildNelliel(form: NelForm = 'adult'): CharacterAsset {
  if (form === 'child') return buildChild();
  if (form === 'gamuza') return buildGamuza();
  const b = new ModelBuilder('nelliel-adult', NEL_RES);
  palette(b, form);
  const s = SPEC;
  const L = humanoidSkeleton(b, s);
  sockets(b, L);
  const hd = head(b, L, 'skin');
  face(b, L, hd);
  const springs: SpringDef[] = [];
  const colliders: ColliderDef[] = [];
  const full = body(b, L);
  legs(b, L);
  hands(b, L, 'skin');
  bareFeet(b, L);
  top(b, L, full, false);
  strip(b, L, full);
  const sk = coatSkirt(b, L, { mat: 'gown', lining: 'gownIn', yTop: s.hipsY + 3.5, yHem: 33, r0: 8.0, r1: 10.6, openFront: 0, depth: 0.8, profile: 0.8, res: NEL_RES, prefix: 'skirt' });
  springs.push(...sk.springs.filter((sp) => !sp.bone.endsWith('.2')).map((sp) => ({ ...sp, stiffness: 110, damping: 7, limit: 40, radius: 0.09 })));
  const skirtBones = ['F.L', 'S.L', 'B.L', 'B.R', 'S.R', 'F.R'].flatMap((p) => [`skirt.${p}`, `skirt.${p}.2`]);
  b.paint(skirtBones, aabb([-20, 20, -20], [20, 60, 20]), 'gown', { where: b.isMat('gown') });
  for (const a of [-50, -10, 30, 75, 140, -120]) {
    const r = (a * Math.PI) / 180;
    b.paint(skirtBones, capsule([Math.sin(r) * 8.6, s.hipsY + 1, -0.6 + Math.cos(r) * 7], [Math.sin(r) * 11.6, 33, -0.6 + Math.cos(r) * 9.2], 0.8), 'gown', { shade: 2, where: b.isMat('gown') });
  }
  raggedHem(b, 34, 3.2);
  // smooth light on the thin cloth: the skirt's cone with six soft folds, the top over the body's form
  const skirtForm = fn((x, y, z) => Math.hypot(x, (z + 0.6) / 0.8) - (8.0 + 2.6 * Math.max(0, Math.min(1, (s.hipsY + 3.5 - y) / (s.hipsY + 3.5 - 33)))), [-14, 28, -14], [14, s.hipsY + 6, 14]);
  const folds = (x: number, _y: number, z: number) => { const a = Math.atan2(x, z); return Math.max(0, Math.cos(a * 4 + 0.4)) * 0.55 - 0.15; };
  litShade(b, skirtBones, 'gown', skirtForm, { base: 1.7, k: 1.4, extra: (x, y, z) => folds(x, y, z) + Math.max(0, 38 - y) * 0.12 });
  litShade(b, ['spine', 'chest'], 'gown', offset(clothBody(full, s), 1.0), { base: 1.6, k: 1.6 });
  litShade(b, ['hips', 'spine', 'chest'], 'gown', offset(full, 1.0), { base: 1.6, k: 1.6, max: [6, s.chestY - 4, 20], min: [-6, s.hipsY, 0] });
  colliders.push(
    { bone: 'thigh.L', offset: [0, -0.14, 0.02], radius: 0.095 },
    { bone: 'thigh.R', offset: [0, -0.14, 0.02], radius: 0.095 },
  );
  number3(b, s.waistY + 2, ['spine']);
  hair(b, L, hd, springs, colliders, 'adult');
  helmet(b, L, hd, 'adult');
  b.autoShade();
  b.lint();
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

function sockets(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 5, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5, wz + 1]);
  b.socket('chest.front', 'chest', [0, s.chestY + 1, 7.5]);
  b.socket('back', 'chest', [0, s.chestY, -7]);
}

function face(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }): void {
  const s = L.spec;
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('mouth', 'head', [0, s.chinY + 1.5, hd.front + 0.5]);
  b.stamp('head', hd.x0, hd.chin + 9, FACE, { ...faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth', teeth: 'teeth' }), b: { mat: 'brow' }, S: { mat: 'scar' }, E: { mat: 'estigma' } }, hd.front - 1);
  // the nose under the crimson line; the line carries round onto the sides of the cheeks
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  for (const k of [-1, 1]) for (let z = hd.front - 3; z < hd.front - 1; z++) {
    const x = k > 0 ? -hd.x0 - 1 : hd.x0;
    if (b.grid('head').get(x, hd.chin + 4, z) !== 0) b.voxel('head', x, hd.chin + 4, z, 'estigma');
  }
}

// ---------------------------------------------------------------------------------------------- body

/** The bare body: a curvy torso (a very full bust, small waist, wide hips and seat) and arms. */
function body(b: ModelBuilder, L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const torso = blend(2.6,
    box([0, s.chestY - 0.5, -0.4], [cx, 5.8, cz], { round: 3.2 }),
    box([0, s.waistY, -0.3], [wx, 4.4, wz], { round: 2.8 }),
    box([0, s.hipsY + 0.2, -0.4], [s.hips[0], 4.0, s.hips[1]], { round: 3 }),
    capsule([2.0, sy + 1.4, sz - 0.8], [sx - 1.4, sy - 0.2, sz], 2.3, 2.4),
    capsule([-2.0, sy + 1.4, sz - 0.8], [-sx + 1.4, sy - 0.2, sz], 2.3, 2.4),
    sphere([sx, sy - 0.5, sz], 2.7), sphere([-sx, sy - 0.5, sz], 2.7));
  const seat = ellipsoid([0, s.hipsY - 1.2, -s.hips[1] + 1.4], [6.2, 3.8, 2.8]);
  const full = blend(1.0, blend(1.6, torso, seat), bust(s));
  addBands(b, full, 'skin', [['hips', 28, s.waistY - 1], ['spine', s.waistY - 1, s.chestY - 4], ['chest', s.chestY - 4, 100]]);
  arms(b, L, 'skin');
  return full;
}

function arms(b: ModelBuilder, L: Landmarks, mat: string): void {
  const [sx, sy, sz] = L.spec.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(1.3, sphere([sx, sy - 0.5, sz], 2.7), capsule([sx, sy - 1, sz], [sx, ey + 0.5, sz], 2.4, 2.0)), mat, { mirror: true });
  b.add('forearm.L', blend(1.1, sphere([sx, ey, sz], 2.0), capsule([sx, ey - 0.5, sz], [sx, wy + 1, sz], 2.0, 1.6)), mat, { mirror: true });
}

function legs(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [hx, hy, hz] = s.hip;
  const [kx, ky, kz] = L.knee;
  const [ax, ay, az] = L.ankle;
  b.add('thigh.L', blend(1.4, sphere([hx, hy, hz], 3.9), capsule([hx + 0.2, hy, hz], [kx, ky + 1, kz], 3.8, 2.6)), 'skin', { mirror: true });
  b.add('shin.L', blend(1.2, sphere([kx, ky, kz], 2.6), capsule([kx, ky - 1, kz - 0.4], [kx, ky - 7, kz - 0.6], 2.6, 2.4), capsule([kx, ky - 7, kz - 0.4], [ax, ay + 1.5, az], 2.4, 1.6)), 'skin', { mirror: true });
}

function bust(s: HumanoidSpec): Sdf {
  const cz = s.chest[1];
  const y = s.chestY - 1.8;
  return blend(0.8, ellipsoid([3.2, y, cz - 0.1], [3.4, 3.2, 3.3]), ellipsoid([-3.2, y, cz - 0.1], [3.4, 3.2, 3.3]));
}

/** the body as cloth sees it: the cleavage bridged over */
function clothBody(full: Sdf, s: HumanoidSpec): Sdf {
  const cz = s.chest[1];
  const y = s.chestY - 1.8;
  return blend(1.4, full, box([0, y + 0.4, cz + 1.3], [4.8, 2.4, 1.9], { round: 1.6 }));
}

/** Bare feet: the ankle, a slim foot with a toe line, pink nails. */
function bareFeet(b: ModelBuilder, L: Landmarks): void {
  const [ax, ay, az] = L.ankle;
  const f = L.spec.foot;
  b.add('foot.L', capsule([ax, ay + 2.8, az - 0.4], [ax, ay - 0.8, az - 0.4], 1.7, 1.9), 'skin', { mirror: true });
  const toeZ = az + f.len - f.heel;
  const foot = intersect(box([ax, 1.4, az + (f.len / 2 - f.heel)], [f.w / 2, 1.4, f.len / 2], { round: 1.1 }), halfSpace([0, 3.2, toeZ - 4], [0, 1, 0.75]));
  b.add('foot.L', blend(1.2, foot, ellipsoid([ax, 1.6, az - 0.6], [2.0, 1.6, 2.0])), 'skin', { mirror: true });
  // the toes: a shaded line between them, the nails
  for (let i = 0; i < 4; i++) b.paint('foot.L', box([ax - 1.6 + i * 1.1, 1.0, toeZ - 0.8], [0.12, 1.2, 1.2]), 'skin', { mirror: true, shade: 3 });
  b.paint('foot.L', aabb([ax - 2.4, 1, toeZ - 1], [ax + 2.4, 2.2, toeZ + 1]), 'skin', { mirror: true, shade: 0 });
}

// ---------------------------------------------------------------------------------------------- clothes

/**
 * The torn top: a green shell over the bust and shoulders with a round neck, ragged cap sleeves and a ragged
 * hem under the bust; at the back it stops at the shoulder blades, so the "3" shows on her bare back.
 */
function top(b: ModelBuilder, L: Landmarks, full: Sdf, sleeves: boolean): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const cloth = clothBody(full, s);
  const bustY = s.chestY - 1.8;
  const saw = (u: number, per: number, amp: number) => (Math.abs(((u / per) % 1 + 1) % 1 - 0.5) * 2) * amp;
  const hemF = (x: number) => bustY - 3.9 + saw(x + 0.6, 2.6, 1.6) + Math.max(0, Math.abs(x) - 5) * 0.3;
  const hemB = (x: number) => s.chestY - 1.6 + saw(x + 1.3, 2.4, 1.4);
  const hem = (x: number, z: number) => {
    const t = Math.max(0, Math.min(1, (z + 1.5) / 3.5));
    return hemB(x) + (hemF(x) - hemB(x)) * t;
  };
  const nz = L.headC[2] - 0.5;
  const shell = fn((x, y, z) => {
    const d0 = Math.max(cloth.d(x, y, z) - 1.0, 0.05 - cloth.d(x, y, z));
    const dHem = hem(x, z) - y;
    const dTop = y - (sy + 3.2);
    // the round neck; sleeveless, the shoulder balls left bare
    const dNeck = (s.neckR + 1.5) - Math.hypot(x, (z - nz) * 1.05);
    const dArm = sleeves ? -1 : Math.abs(x) - (sx - 1.8 + Math.max(0, bustY + 2 - y) * 0.6);
    return Math.max(d0, dHem, dTop, dNeck, dArm);
  }, [-14, s.waistY - 2, -10], [14, sy + 5, 12]);
  addBands(b, shell, 'gown', [['spine', s.waistY - 4, s.chestY - 4], ['chest', s.chestY - 4, 100]]);
  // folds pulled across the bust and gathered under it
  for (const k of [-1, 1]) {
    b.paint('chest', capsule([k * 6.2, bustY - 2.6, 4.4], [k * 1.2, bustY - 3.4, 6.6], 0.6), 'gown', { shade: 3, where: b.isMat('gown') });
    b.paint('chest', capsule([k * 7.4, sy - 1, 1.5], [k * 3.4, bustY + 1.6, 6.2], 0.5), 'gown', { shade: 3, where: b.isMat('gown') });
  }
  if (!sleeves) return;
  // ragged cap sleeves over the shoulders
  const ey = L.elbow[1];
  const slv = fn((x, y, z) => {
    const r = Math.hypot(x - sx, z - sz);
    const ry = 3.4 + Math.max(0, (sy - 1 - y)) * 0.06;
    const dR = Math.max(r - ry, (ry - 1.1) - r);
    const yHem = sy - 5.5 + saw(Math.atan2(z - sz, x - sx) * 3, 2.2, 1.8);
    const dCap = sphere([sx, sy - 0.5, sz], 3.8).d(x, y, z);
    return Math.min(Math.max(dR, yHem - y, y - (sy - 0.5)), Math.max(dCap, (sy - 0.5) - y, -(dCap + 1.2)));
  }, [sx - 6, ey, sz - 6], [sx + 6, sy + 4, sz + 6]);
  b.add('upperarm.L', slv, 'gown', { mirror: true, thr: 0.15 });
}

/** A few torn notches in the skirt's hem (big triangles, not a fringe). */
function raggedHem(b: ModelBuilder, yHem: number, depth: number): void {
  const bones: string[] = [];
  for (const p of ['F.L', 'S.L', 'B.L', 'B.R', 'S.R', 'F.R']) bones.push(`skirt.${p}`, `skirt.${p}.2`);
  const teeth = 11;
  b.carve(bones, fn((x, y, z) => {
    const a = Math.atan2(x, z) / (Math.PI * 2) + 0.5;
    const u = (a * teeth + 0.3) % 1;
    const k = Math.floor(a * teeth);
    const h = depth * (0.6 + (Math.abs(Math.sin(k * 12.9898) * 43758.5) % 1) * 0.6);
    // a triangle notch: deepest in the middle of each tooth gap
    const notch = yHem + Math.max(0, h * (1 - Math.abs(u - 0.5) * 4));
    return y - notch;
  }, [-16, yHem - 4, -16], [16, yHem + depth * 1.4 + 1, 16]));
}

/** the strip of cloth down her belly from the top to the skirt */
function strip(b: ModelBuilder, L: Landmarks, full: Sdf): void {
  const s = L.spec;
  const bustY = s.chestY - 1.8;
  const band = fn((x, y, z) => {
    const d = full.d(x, y, z);
    return Math.max(d - 0.9, 0.05 - d, Math.abs(x + Math.sin(y * 0.5) * 0.3) - 1.9, -z);
  }, [-4, s.hipsY + 1, -2], [4, bustY - 2, 12]);
  addBands(b, band, 'gown', [['hips', 28, s.waistY - 1], ['spine', s.waistY - 1, s.chestY - 4], ['chest', s.chestY - 4, 100]]);
}

/** The Espada number in the middle of her back (2×2 voxels per pixel), drawn on whatever skin is there. */
function number3(b: ModelBuilder, yBot: number, bones: string[]): void {
  const px = 2;
  const w = 3 * px, h = 5 * px;
  const x0 = -w / 2, yTop = yBot + h;
  const on = (x: number, y: number) => {
    const c = Math.floor((x - x0) / px), r = Math.floor((yTop - y) / px);
    if (c < 0 || c > 2 || r < 0 || r > 4) return false;
    return THREE[r].split(' ')[c] === 'x';
  };
  b.paint(bones, fn((x, y, z) => (z > -2.5 ? 1 : on(x, y) ? -1 : 1), [x0 - 1, yBot - 1, -12], [x0 + w + 1, yTop + 1, -2]), 'ink', { where: b.isMat('skin') });
}

/**
 * Lock the surface of a smooth or thin piece to shades from its own analytic normal (light from above, ahead
 * and on her left), so a big curved body and thin cloth shade in smooth bands instead of the stripes and rings
 * the voxel staircase gives auto-shade. `form` is the piece's smooth shape (the body under the cloth).
 */
function litShade(b: ModelBuilder, bones: string[], mat: string, form: Sdf, o: { base?: number; k?: number; extra?: (x: number, y: number, z: number) => number; min?: V3; max?: V3 } = {}): void {
  const Lx = 0.3, Ly = 0.82, Lz = 0.48;
  const ll = Math.hypot(Lx, Ly, Lz);
  const e = 0.8;
  const isM = b.isMat(mat);
  b.surfaceVoxels(bones, o.min ?? form.min, o.max ?? form.max, (bone, x, y, z) => {
    const v = b.grid(bone).get(x, y, z);
    if (!isM(v)) return;
    const cx = x + 0.5, cy = y + 0.5, cz = z + 0.5;
    const gx = form.d(cx + e, cy, cz) - form.d(cx - e, cy, cz);
    const gy = form.d(cx, cy + e, cz) - form.d(cx, cy - e, cz);
    const gz = form.d(cx, cy, cz + e) - form.d(cx, cy, cz - e);
    const gl = Math.hypot(gx, gy, gz) || 1;
    const lam = (gx * Lx + gy * Ly + gz * Lz) / (gl * ll);
    const level = (o.base ?? 1.8) - lam * (o.k ?? 1.6) + (o.extra ? o.extra(cx, cy, cz) : 0);
    const n = b.matOf(v).mat?.colors.length ?? 1;
    b.voxel(bone, x, y, z, mat, Math.max(0, Math.min(n - 1, Math.round(level))));
  });
}

// ---------------------------------------------------------------------------------------------- hair

/**
 * Long wavy green hair: a soft cap under the skull, wavy bangs from under its teeth, a thick lock falling in
 * front of each shoulder, and the fall down her back to the hips in three columns on spring chains, its
 * surface rippling in waves.
 */
function hair(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }, springs: SpringDef[], colliders: ColliderDef[], form: NelForm): void {
  const s = L.spec;
  const c = hd.chin;
  const back = L.headC[2] - s.head.d / 2;
  const R = NEL_RES;
  const locks: Spike[] = [];
  for (const az of [-165, 180, 165, -135, 135]) locks.push({ az, el: 26, len: 1.6, r: 3.8, flat: 0.5, flow: [0, -0.5, -0.5] });
  for (const [az, el] of [[-100, 50], [100, 50], [180, 54], [-150, 44], [150, 44]] as [number, number][]) locks.push({ az, el, len: 1.4, r: 4.0, flat: 0.55, flow: [0, -0.3, -0.6] });
  for (const k of [-1, 1]) {
    // full, wavy volume over the ears
    locks.push({ az: k * 80, el: 22, len: 2.4, r: 3.6, flat: 0.5, flow: [k * 0.35, -0.6, -0.4], bend: [k * 0.4, -0.3, 0] });
    locks.push({ az: k * 104, el: 0, len: 2.8, r: 3.6, flat: 0.5, flow: [k * 0.3, -1.0, -0.6] });
    locks.push({ az: k * 126, el: -10, len: 2.8, r: 3.4, flat: 0.5, flow: [k * 0.2, -1.2, -0.4] });
  }
  spikeHair(b, L, 'hair', locks, [
    { x: -4.1, tipY: c + 7.6, lean: -1.4, r: 2.0 },
    { x: -2.0, tipY: c + 8.4, lean: -0.9, r: 1.8 },
    { x: 2.2, tipY: c + 8.2, lean: 1.0, r: 1.8 },
    { x: 4.2, tipY: c + 7.4, lean: 1.5, r: 2.0 },
  ], { hairline: c + s.head.h - 0.8, nape: c - 1, slope: 0.55, capR: [s.head.w / 2 + 1.8, s.head.h / 2 + 1.6, s.head.d / 2 + 1.7] });

  // ---- the fall
  const yN = c - 1;
  const yM = s.chestY - 4;
  const yHem = form === 'gamuza' ? s.waistY - 5 : s.hipsY - 3.5;
  const zTop = back - 0.4, zBot = -8.6;
  const zf = (y: number) => zTop + (zBot - zTop) * Math.max(0, Math.min(1, (c + 3 - y) / (c + 3 - yHem)));
  const halfW = (y: number) => (y > s.shoulder[1] ? 6.8 + (c + 3 - y) * 0.25 : Math.min(9.6, 8.6 + (s.shoulder[1] - y) * 0.06) - Math.max(0, s.hipsY - 1 - y) * 0.12);
  const wave = (x: number, y: number) => Math.sin(y * 0.42 + x * 0.25) * 0.9;
  const hemY = (x: number) => yHem + Math.abs(Math.sin(x * 0.7)) * 2.4 + Math.max(0, Math.abs(x) - 4) * 0.45;
  const sheet = (dz: number, xMin: number, xMax: number, y0: number, y1: number) =>
    fn((x, y, z) => {
      const front = zf(y) + dz + 0.05 * x * x + wave(x, y);
      const th = 3.0;
      const dzIn = Math.max(z - front, front - th - z);
      const dx = Math.max(Math.abs(x) - halfW(y) - Math.sin(y * 0.42) * 0.6, xMin - x, x - xMax);
      const dy = Math.max(hemY(x) - y, y - y1, y0 - y);
      return Math.max(dzIn, dx, dy);
    }, [xMin - 2, y0 - 2, zBot - 8], [xMax + 2, y1 + 1, back + 4]);
  b.add('head', sheet(0, -10, 10, yN - 0.5, c + 4), 'hair', { thr: 0.2 });
  b.bone('hair1.L', 'head', [3.8, yN, zf(yN) - 1.4]);
  b.bone('hair1.R', 'head', [-3.8, yN, zf(yN) - 1.4]);
  b.bone('hair1.C', 'head', [0, yN, zf(yN) - 1.9]);
  b.bone('hair2.L', 'hair1.L', [4.2, yM, zf(yM) - 1.4]);
  b.bone('hair2.R', 'hair1.R', [-4.2, yM, zf(yM) - 1.4]);
  b.bone('hair2.C', 'hair1.C', [0, yM, zf(yM) - 1.9]);
  b.add('hair1.L', sheet(0, 2.2, 11, yM - 0.5, yN + 0.5), 'hair', { thr: 0.2, mirror: true });
  b.add('hair2.L', sheet(0, 2.2, 11, -100, yM + 0.5), 'hair', { thr: 0.2, mirror: true });
  b.add('hair1.C', sheet(-1, -3.0, 3.0, yM - 0.5, yN + 0.5), 'hair', { thr: 0.2 });
  b.add('hair2.C', sheet(-1, -3.0, 3.0, -100, yM + 0.5), 'hair', { thr: 0.2 });
  // the waves: darker troughs running across the fall, strands down it
  const bones = ['head', 'hair1.L', 'hair1.R', 'hair1.C', 'hair2.L', 'hair2.R', 'hair2.C'];
  b.paint(bones, intersect(fn((x, y) => Math.abs(Math.sin(y * 0.42 + x * 0.25) + 0.7) - 0.28, [-14, yHem - 6, -20], [14, c + 4, 6]), halfSpace([0, c + 3, 0], [0, 1, 0.2])), 'hair', { shade: 3, where: b.isMat('hair') });
  b.paint(bones, intersect(fn((x) => Math.abs(((x + 40) % 3.4) - 1.7) - 0.3, [-14, yHem - 6, -20], [14, c + 15, 8]), halfSpace([0, c + 3, 0], [0, 1, 0.25])), 'hair', { shade: 2, where: b.isMat('hair') });
  for (const [n, x, z] of [['L', 4.2, -1.4], ['R', -4.2, -1.4], ['C', 0, -1.9]] as [string, number, number][]) {
    springs.push({ bone: `hair1.${n}`, tail: [(x * 1.05 - x) / R, (yM - yN) / R, (zf(yM) - zf(yN)) / R], stiffness: 55, damping: 5, gravity: 9, limit: 40, radius: 0.035 });
    springs.push({ bone: `hair2.${n}`, tail: [0, (yHem - yM) / R, (zf(yHem) + z - (zf(yM) + z)) / R], stiffness: 34, damping: 4.5, gravity: 11, limit: 55, radius: 0.035 });
  }
  // ---- a thick wavy lock in front of each shoulder, down over the bust
  const bustY = s.chestY - 1.8;
  const lockTop: V3 = [5.6, c + 1, hd.front - 4.4];
  b.bone('lock.L', 'head', lockTop);
  b.bone('lock.R', 'head', [-lockTop[0], lockTop[1], lockTop[2]]);
  const lockPath = smoothPath([[5.4, c + 5, hd.front - 4.2], [6.6, c + 0.5, hd.front - 3.8], [7.6, c - 4, hd.front - 3.4], [8.2, s.shoulder[1] + 0.5, 1.6]], 4);
  const lockR = lockPath.map((_, i) => 2.1 + Math.sin(i * 0.9) * 0.3 - (i / lockPath.length) * 0.9);
  b.add('lock.L', tube(lockPath, lockR), 'hair', { mirror: true, thr: 0.2 });
  b.paint('lock.L', fn((x, y) => Math.abs(Math.sin(y * 0.6 + x)) - 0.25, [0, bustY - 4, -4], [12, c + 6, 12]), 'hair', { shade: 3, mirror: true, where: b.isMat('hair') });
  const tl = lockPath[lockPath.length - 1];
  for (const n of ['L', 'R']) springs.push({ bone: `lock.${n}`, tail: [((n === 'L' ? 1 : -1) * tl[0] - (n === 'L' ? 1 : -1) * lockTop[0]) / R, (tl[1] - lockTop[1]) / R, (tl[2] - lockTop[2]) / R], stiffness: 60, damping: 6, gravity: 8, limit: 35, radius: 0.03 });
  colliders.push(
    { bone: 'chest', offset: [0, 0.06, -0.005], radius: 0.115 },
    { bone: 'chest', offset: [0.065, -0.03, 0.07], radius: 0.07 },
    { bone: 'chest', offset: [-0.065, -0.03, 0.07], radius: 0.07 },
    { bone: 'spine', offset: [0, 0.02, -0.01], radius: 0.085 },
    { bone: 'hips', offset: [0, -0.03, -0.01], radius: 0.12 },
  );
}

// ---------------------------------------------------------------------------------------------- the skull

/**
 * The ram's skull worn over the crown: a dome down to just above the brows, its face jutting over her
 * forehead (two eye sockets, the nasal notch, a row of teeth hanging over the bangs with two missing) and the
 * curled horns from its temples round behind the ears. Gamuza's horns grow longer and come down to frame her
 * cheeks.
 */
function helmet(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }, form: NelForm): void {
  const s = L.spec;
  const c = hd.chin;
  const hz = L.headC[2];
  // the dome sits on the hair: its front edge just above the bangs, lower at the back
  const dome = intersect(ellipsoid([0, c + 13.6, hz + 0.2], [6.8, 4.6, 7.2]), halfSpace([0, c + 11.4, 0], [0, -1, 0.2]));
  const snout = box([0, c + 13.0, hd.front + 0.6], [4.0, 1.7, 1.7], { round: 1.3 });
  const brow = capsule([-4.4, c + 14.3, hd.front - 0.2], [4.4, c + 14.3, hd.front - 0.2], 1.3);
  b.add('head', blend(1.4, dome, snout, brow), 'bone');
  // the eye sockets: dark, one voxel deep, under the bony brow ridge
  for (const k of [-1, 1]) {
    const ec: V3 = [k * 2.2, c + 13.3, hd.front + 2.4];
    b.carve('head', ellipsoid(ec, [0.8, 0.7, 0.9]));
    b.paint('head', ellipsoid([ec[0], ec[1], ec[2] - 1], [1.1, 0.9, 1.4]), 'void', { where: b.isMat('bone') });
  }
  // the nasal notch
  b.paint('head', fn((x, y, z) => (z < hd.front + 1.4 ? 1 : Math.max(Math.abs(x) - (y - (c + 11.6)) * 0.45, y - (c + 13.0), c + 11.8 - y)), [-2, c + 11, hd.front], [2, c + 14, hd.front + 4]), 'void', { where: b.isMat('bone') });
  // the teeth over the forehead, two of them broken off
  const teeth = form === 'child' ? [] : [-3.3, -2.2, -1.1, 0, 1.1, 2.2, 3.3];
  const missing = new Set([1, 4]);
  teeth.forEach((x, i) => {
    if (missing.has(i)) return;
    b.add('head', box([x, c + 11.2, hd.front + 1.2], [0.42, 0.85, 0.45]), 'teeth', { thr: 0.25 });
  });
  // a seam along the top of the skull
  b.paint('head', fn((x, y, z) => (y < c + 16 ? 1 : Math.abs(x) - 0.35 + Math.abs(Math.sin(z * 0.9)) * 0.15), [-2, c + 15, hz - 8], [2, c + 20, hd.front + 3]), 'bone', { shade: 3, where: b.isMat('bone') });
  // the horns
  const g = form === 'gamuza';
  const ctrl: V3[] = g
    ? [[5.0, c + 14.0, hz - 0.4], [8.4, c + 16.0, hz - 2.6], [11.0, c + 14.4, hz - 6.2], [12.2, c + 9.4, hz - 7.4], [11.4, c + 4.0, hz - 5.0], [9.6, c + 0.8, hz - 1.4], [8.0, c - 0.6, hz + 2.4]]
    : [[5.0, c + 14.0, hz - 0.4], [8.0, c + 15.6, hz - 2.4], [10.0, c + 14.2, hz - 5.4], [10.8, c + 11.0, hz - 6.6], [10.0, c + 8.2, hz - 5.0], [9.0, c + 7.8, hz - 2.6], [8.8, c + 9.4, hz - 0.8]];
  const path = smoothPath(ctrl, 4);
  const r0 = g ? 2.4 : 2.2, r1 = g ? 0.7 : 0.8;
  const radii = path.map((_, i) => r0 + (r1 - r0) * Math.pow(i / (path.length - 1), 0.9));
  b.add('head', tube(path, radii), 'bone', { mirror: true, thr: 0.2 });
  // the horn's growth rings
  const cc: V3 = g ? [10.4, c + 8.0, hz - 3.6] : [9.2, c + 11.0, hz - 3.4];
  b.paint('head', fn((x, y, z) => {
    if (x < 4.5) return 1;
    const a = Math.atan2(y - cc[1], z - cc[2]);
    return Math.abs(((a * 7) / Math.PI) % 1 + 1) % 1 < 0.22 ? -1 : 1;
  }, [4, c - 4, hz - 12], [14, c + 18, hz + 6]), 'bone', { shade: 3, mirror: true, where: b.isMat('bone') });
}

// ---------------------------------------------------------------------------------------------- child

function buildChild(): CharacterAsset {
  const b = new ModelBuilder('nelliel-child', NEL_RES);
  palette(b, 'child');
  const s = CHILD;
  const L = humanoidSkeleton(b, s);
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 2.6, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 2.6, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.4, wy - 2.8, wz + 0.6]);
  b.socket('palm.L', 'palm.L', [wx - 0.4, wy - 2.8, wz + 0.6]);
  b.socket('chest.front', 'chest', [0, s.chestY, 5.5]);
  b.socket('back', 'chest', [0, s.chestY, -5.5]);
  // a round head: full cheeks, a soft jaw
  const hd = head(b, L, 'skin');
  const c = hd.chin;
  b.add('head', intersect(ellipsoid([0, c + 4.2, L.headC[2] + 0.6], [7.2, 5.0, 6.2]), aabb([-8, c - 1, -10], [8, c + 8, hd.front])), 'skin');
  b.socket('face', 'head', [0, c + 7, hd.front]);
  b.socket('mouth', 'head', [0, c + 2, hd.front + 0.5]);
  b.stamp('head', hd.x0, c + 11, CHILD_FACE, { ...faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth', teeth: 'teeth', inner: 'void' }), S: { mat: 'scar' }, E: { mat: 'estigma' } }, hd.front - 1);
  b.voxel('head', -1, c + 5, hd.front, 'scar');
  b.voxel('head', 0, c + 5, hd.front, 'scar');
  // the body under the gown, short limbs
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1];
  const torso = blend(2.0, box([0, s.chestY - 1, -0.2], [4.6, 4.0, 3.8], { round: 2.6 }), box([0, s.hipsY + 1.5, -0.2], [4.9, 3.6, 4.0], { round: 2.6 }));
  addBands(b, torso, 'skin', [['hips', 8, s.waistY - 1], ['spine', s.waistY - 1, s.chestY - 4], ['chest', s.chestY - 4, 40]]);
  const [hx, hy, hz] = s.hip, [kx, ky, kz] = L.knee, [ax, ay, az] = L.ankle;
  b.add('thigh.L', blend(1.0, sphere([hx, hy, hz], 2.4), capsule([hx, hy, hz], [kx, ky + 0.5, kz], 2.2, 1.7)), 'skin', { mirror: true });
  b.add('shin.L', capsule([kx, ky, kz], [ax, ay + 0.8, az], 1.7, 1.3), 'skin', { mirror: true });
  b.add('foot.L', blend(0.8, capsule([ax, ay + 0.6, az - 0.2], [ax, 1.2, az - 0.2], 1.4, 1.5), box([ax, 1.0, az + 1.2], [1.5, 1.0, 2.8], { round: 0.9 })), 'skin', { mirror: true });
  b.paint('foot.L', aabb([ax - 2, 0, az + 3.2], [ax + 2, 1.6, az + 5]), 'skin', { mirror: true, shade: 0 });
  // little mitten hands (the open hand and the fist alike)
  for (const bone of ['palm.L', 'fist.L']) b.add(bone, blend(0.8, sphere([wx, wy - 1.6, wz + 0.3], 1.7), capsule([wx, wy - 0.6, wz + 1.2], [wx - 0.6, wy - 2.2, wz + 2.2], 0.75)), 'skin', { mirror: true });
  // the gown: a little bell from the neck to the ankles, long sleeves, the hood gathered behind the neck
  const gown = fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (sy + 1 - y) / (sy + 1 - 4)));
    const rx = 4.8 + t * 3.6, rz = 4.2 + t * 2.8;
    const d = (Math.hypot(x / rx, (z + 0.2) / rz) - 1) * Math.min(rx, rz);
    return Math.max(d, 4 + Math.abs(Math.sin(x * 0.9 + z * 0.7)) * 0.8 - y, y - (sy + 1.6));
  }, [-10, 2, -9], [10, sy + 3, 9]);
  const shoulders = blend(1.6, capsule([sx - 1, sy, sz], [-sx + 1, sy, sz], 2.8), ellipsoid([0, sy + 0.5, -0.3], [4.6, 2.4, 3.8]));
  const gownAll = subtract(blend(1.2, gown, shoulders), cylinder([0, sy - 1, L.headC[2] - 0.4], [0, sy + 5, L.headC[2] - 0.4], s.neckR + 0.4));
  addBands(b, gownAll, 'gown', [['hips', 0, s.waistY - 1], ['spine', s.waistY - 1, s.chestY - 4], ['chest', s.chestY - 4, 40]]);
  litShade(b, ['hips', 'spine', 'chest'], 'gown', gownAll, { base: 1.6, k: 1.5, extra: (x, y, z) => (y < 5.2 ? 0.9 : 0) + Math.max(0, Math.cos(Math.atan2(x, z) * 3 + 0.5)) * 0.45 - 0.1 });
  // the round cheeks and jaw: smooth light (the staircase would stripe them)
  litShade(b, ['head'], 'skin', ellipsoid([0, c + 4.6, L.headC[2] + 0.4], [7.2, 6.0, 6.4]), { base: 1.2, k: 1.2, min: [-9, c - 2, L.headC[2] - 2], max: [9, c + 6, 12] });
  // the hood, gathered behind the neck
  b.add('chest', blend(1.0, ellipsoid([0, sy + 1.2, -4.4], [4.6, 2.6, 2.4]), ellipsoid([0, sy - 1.2, -4.8], [3.4, 2.6, 1.8])), 'gown');
  b.paint('chest', torus([0, sy + 1.2, -3.2], 3.2, 0.7, [90, 0, 0]), 'gown', { shade: 3, where: b.isMat('gown') });
  // the sleeves: wide, down to the wrists
  b.add('upperarm.L', blend(1.0, sphere([sx, sy - 0.4, sz], 2.8), capsule([sx, sy - 0.6, sz], [sx, ey + 0.4, sz], 2.4, 2.3)), 'gown', { mirror: true });
  b.add('forearm.L', blend(1.0, sphere([sx, ey, sz], 2.2), cylinder([sx, wy + 0.2, sz], [sx, ey + 0.4, sz], 2.8, 2.2, 0.6)), 'gown', { mirror: true });
  b.paint('forearm.L', aabb([sx - 4, wy - 0.5, sz - 4], [sx + 4, wy + 1.2, sz + 4]), 'gown', { mirror: true, shade: 3, where: b.isMat('gown') });
  // a short mop of curly green hair under the skull, curls over the ears
  const locks: Spike[] = [];
  for (const k of [-1, 1]) {
    locks.push({ az: k * 84, el: 10, len: 1.6, r: 3.0, flat: 0.6, flow: [k * 0.2, -0.8, 0], bend: [k * 0.3, 0, 0.3] });
    locks.push({ az: k * 120, el: 0, len: 1.6, r: 3.0, flat: 0.6, flow: [0, -0.9, -0.2] });
  }
  locks.push({ az: 180, el: 0, len: 1.5, r: 3.4, flat: 0.6, flow: [0, -0.9, -0.3] });
  spikeHair(b, L, 'hair', locks, [
    { x: -4.6, tipY: c + 10.6, lean: -0.8, r: 2.0 },
    { x: 4.6, tipY: c + 10.6, lean: 0.8, r: 2.0 },
  ], { hairline: c + s.head.h - 1.4, nape: c, slope: 0.4, capR: [s.head.w / 2 + 1.2, s.head.h / 2 + 1.0, s.head.d / 2 + 1.2] });
  childMask(b, L, hd);
  b.autoShade();
  b.lint();
  const springs: SpringDef[] = [];
  return { model: b.build(), springs, colliders: [], warnings: b.warnings };
}

/** Nel Tu's cartoon skull perched on top of her head: big round sockets, a crack down its left side and the
 *  teeth along its front edge with the four on its left broken off. */
function childMask(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }): void {
  const s = L.spec;
  const c = hd.chin;
  const hz = L.headC[2];
  const top = c + s.head.h;
  const skull = blend(1.6,
    intersect(ellipsoid([0, top + 1.0, hz + 0.4], [7.8, 5.0, 7.8]), halfSpace([0, c + 13.4, 0], [0, -1, 0.2])),
    box([0, c + 14.8, hd.front + 0.2], [5.2, 1.7, 1.6], { round: 1.4 }));
  b.add('head', skull, 'bone');
  for (const k of [-1, 1]) {
    const ec: V3 = [k * 3.0, c + 15.4, hd.front + 2.0];
    b.carve('head', ellipsoid(ec, [1.0, 1.0, 1.2]));
    b.paint('head', ellipsoid([ec[0], ec[1], ec[2] - 1], [1.3, 1.3, 1.8]), 'void', { where: b.isMat('bone') });
    b.socket(k > 0 ? 'maskEye.L' : 'maskEye.R', 'head', [ec[0], ec[1], ec[2] + 0.4]);
  }
  // the teeth over her forehead: the four on the left (+X) broken off
  for (const x of [-4.2, -2.9, -1.6, -0.3]) b.add('head', box([x, c + 13.0, hd.front + 0.9], [0.45, 0.9, 0.5]), 'teeth', { thr: 0.25 });
  // the crack: a zigzag down the left side from the crown to the socket
  b.paint('head', fn((x, y, z) => {
    if (z < hz - 2) return 1;
    const xc = 5.6 + Math.sin(y * 1.7) * 0.5 + (y - (c + 17)) * 0.2;
    return Math.abs(x - xc) - 0.4;
  }, [3, c + 16.6, hz - 4], [9, top + 7, hd.front + 4]), 'void', { where: b.isMat('bone') });
}

// ---------------------------------------------------------------------------------------------- Gamuza

/** the centaur skeleton: her torso as usual, the animal body on 'hips', its legs and the tail */
function centaurSkeleton(b: ModelBuilder, s: HumanoidSpec): Landmarks {
  const sh = s.shoulder;
  const elbow: V3 = [sh[0], sh[1] - s.upperArm, sh[2]];
  const wrist: V3 = [sh[0], elbow[1] - s.foreArm, sh[2]];
  b.bone('root', null, [0, 0, 0]);
  b.bone('hips', 'root', HORSE.barrel);
  b.bone('spine', 'hips', [0, s.waistY - 1, -0.5]);
  b.bone('chest', 'spine', [0, s.chestY - 4, -0.5]);
  b.bone('neck', 'chest', [0, s.chinY - 3, -0.8]);
  b.bone('head', 'neck', [0, s.chinY + 0.5, -0.8]);
  b.boneSym('shoulder.L', 'chest', [3, sh[1] - 0.5, sh[2]]);
  b.boneSym('upperarm.L', 'shoulder.L', sh);
  b.boneSym('forearm.L', 'upperarm.L', elbow);
  b.boneSym('hand.L', 'forearm.L', wrist);
  b.boneSym('palm.L', 'hand.L', wrist);
  b.boneSym('fist.L', 'hand.L', wrist);
  b.boneSym('fthigh.L', 'hips', HORSE.fore.hip);
  b.boneSym('fshin.L', 'fthigh.L', HORSE.fore.knee);
  b.boneSym('ffoot.L', 'fshin.L', HORSE.fore.fetlock);
  b.boneSym('thigh.L', 'hips', HORSE.hind.hip);
  b.boneSym('shin.L', 'thigh.L', HORSE.hind.hock);
  b.boneSym('foot.L', 'shin.L', HORSE.hind.fetlock);
  b.bone('tail1', 'hips', HORSE.tail);
  b.bone('tail2', 'tail1', [0, 48, -77.5]);
  return { spec: s, headC: [0, s.chinY + s.head.h / 2, -0.5], elbow, wrist, knee: HORSE.hind.hock, ankle: HORSE.hind.fetlock };
}

function buildGamuza(): CharacterAsset {
  const b = new ModelBuilder('nelliel-gamuza', NEL_RES);
  palette(b, 'gamuza');
  const s = GSPEC;
  const L = centaurSkeleton(b, s);
  sockets(b, L);
  const hd = head(b, L, 'skin');
  face(b, L, hd);
  const springs: SpringDef[] = [];
  const colliders: ColliderDef[] = [];
  // her torso, down into the animal's chest
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const torso = blend(2.6,
    box([0, s.chestY - 0.5, -0.4], [cx, 5.8, cz], { round: 3.2 }),
    box([0, s.waistY, -0.3], [wx, 4.4, wz], { round: 2.8 }),
    box([0, s.waistY - 6.5, -0.2], [6.4, 3.6, 5.2], { round: 3 }),
    capsule([2.0, sy + 1.4, sz - 0.8], [sx - 1.4, sy - 0.2, sz], 2.3, 2.4),
    capsule([-2.0, sy + 1.4, sz - 0.8], [-sx + 1.4, sy - 0.2, sz], 2.3, 2.4),
    sphere([sx, sy - 0.5, sz], 2.7), sphere([-sx, sy - 0.5, sz], 2.7));
  const full = blend(1.0, torso, bust(s));
  addBands(b, full, 'skin', [['spine', s.waistY - 1, s.chestY - 4], ['chest', s.chestY - 4, 200]]);
  addBands(b, intersect(full, aabb([-20, s.waistY - 12, -20], [20, s.waistY - 1, 20])), 'skin', [['hips', 0, 200]]);
  arms(b, L, 'sheath');
  hands(b, L, 'sheath');
  horseBody(b, s);
  litShade(b, ['spine', 'chest'], 'gown', offset(clothBody(full, s), 1.0), { base: 1.6, k: 1.6 });
  // the fur begins at her hip line, a soft zigzag edge
  const furLine = (x: number, z: number) => s.waistY - 4.5 + Math.abs(Math.sin(Math.atan2(x, z) * 5)) * 1.6;
  b.paint('hips', fn((x, y, z) => y - furLine(x, z), [-20, 30, -30], [20, s.waistY + 1, 20]), 'coat', { where: b.isMat('skin') });
  b.paint('hips', fn((x, y, z) => Math.abs(y - furLine(x, z) + 0.5) - 0.6, [-20, s.waistY - 9, -30], [20, s.waistY + 1, 20]), 'coat', { shade: 0, where: b.isMat('coat') });
  top(b, L, full, false);
  armor(b, L);
  number3(b, s.waistY + 1, ['spine']);
  hair(b, L, hd, springs, colliders, 'gamuza');
  helmet(b, L, hd, 'gamuza');
  // the tail: a long black horse tail
  const R = NEL_RES;
  springs.push({ bone: 'tail1', tail: [0, (48 - HORSE.tail[1]) / R, (-77.5 - HORSE.tail[2]) / R], stiffness: 40, damping: 4, gravity: 10, limit: 60, radius: 0.06 });
  springs.push({ bone: 'tail2', tail: [0, -24 / R, 1.5 / R], stiffness: 26, damping: 3.5, gravity: 12, limit: 70, radius: 0.06 });
  colliders.push(
    { bone: 'thigh.L', offset: [0, -0.15, -0.04], radius: 0.1 },
    { bone: 'thigh.R', offset: [0, -0.15, -0.04], radius: 0.1 },
  );
  b.autoShade();
  b.lint();
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

/** The chamois body: a deep chest under her torso, the barrel, high haunches; slim legs, cloven hooves, the
 *  pale belly, the tail. */
function horseBody(b: ModelBuilder, s: HumanoidSpec): void {
  const yw = s.waistY;
  const chestH = ellipsoid([0, 52, -1], [10.4, 13.2, 11.4]);
  const barrel = ellipsoid([0, 54, -30], [11.0, 13.0, 24]);
  const rump = ellipsoid([0, 57, -57], [11.6, 12.4, 14.0]);
  // the withers rise into her waist
  const withers = capsule([0, yw - 8, -1.5], [0, 62, -10], 7.0, 6.2);
  const haunch = blend(2.0, ellipsoid([6.4, 50, -60], [5.4, 11.5, 10.5]), ellipsoid([-6.4, 50, -60], [5.4, 11.5, 10.5]));
  const shoulderM = blend(2.0, ellipsoid([6.0, 48, 1], [4.6, 10.5, 7.4]), ellipsoid([-6.0, 48, 1], [4.6, 10.5, 7.4]));
  const animal = blend(4.0, chestH, barrel, rump, withers, haunch, shoulderM);
  b.add('hips', intersect(animal, aabb([-20, 30, -90], [20, yw - 1, 20])), 'coat');
  // the pale belly and the inside of the legs
  b.paint('hips', intersect(animal, halfSpace([0, 45, 0], [0, 1, 0])), 'belly', { where: b.isMat('coat') });
  // smooth light over the big curves (auto-shade would terrace them into contour rings)
  litShade(b, ['hips'], 'coat', animal, { base: 2.0, k: 1.7, min: [-20, 30, -90], max: [20, yw, 20] });
  litShade(b, ['hips'], 'belly', animal, { base: 0.9, k: 1.2, min: [-20, 30, -90], max: [20, 50, 20] });
  // a darker dorsal stripe down the back (chamois), the chest's middle groove
  b.paint('hips', fn((x, y, z) => (z > -4 ? 1 : Math.abs(x) - 1.6 + (y - 62) * 0.04), [-4, 58, -80], [4, 74, -2]), 'coat', { shade: 4, where: b.isMat('coat') });
  b.paint('hips', fn((x, y, z) => (z < 6 ? 1 : Math.abs(x) - 0.5), [-2, 40, 4], [2, 60, 14]), 'coat', { shade: 4, where: b.isMat('coat') });
  // the legs: forearm/gaskin muscle, a bony knee/hock, slim cannons, fetlocks, cloven hooves
  const F = HORSE.fore, H = HORSE.hind;
  b.add('fthigh.L', blend(1.6, ellipsoid([F.hip[0], 48, F.hip[2] - 0.5], [3.8, 9.5, 5.0]), capsule([F.hip[0], 44, F.hip[2] - 1], [F.knee[0], F.knee[1] + 2, F.knee[2]], 3.6, 2.3), sphere([F.hip[0], 40, F.hip[2] - 3.2], 2.6)), 'coat', { mirror: true });
  b.add('fshin.L', blend(0.8, sphere(F.knee, 2.5), capsule(F.knee, [F.fetlock[0], F.fetlock[1] + 1, F.fetlock[2]], 1.9, 1.6)), 'coat', { mirror: true });
  b.add('thigh.L', blend(1.6, ellipsoid([H.hip[0], 47, H.hip[2] - 1], [4.4, 10.5, 7.0]), capsule([H.hip[0], 42, H.hip[2] - 3], [H.hock[0], H.hock[1] + 3, H.hock[2] + 0.5], 4.0, 2.4)), 'coat', { mirror: true });
  b.add('shin.L', blend(0.8, sphere(H.hock, 2.5), sphere([H.hock[0], H.hock[1] + 1.5, H.hock[2] - 2.2], 1.6), capsule(H.hock, [H.fetlock[0], H.fetlock[1] + 1, H.fetlock[2]], 1.9, 1.6)), 'coat', { mirror: true });
  for (const [bone, p] of [['ffoot.L', F.fetlock], ['foot.L', H.fetlock]] as [string, V3][]) {
    b.add(bone, blend(0.9, sphere(p, 2.2), capsule(p, [p[0], 3.2, p[2] + 1.6], 1.8, 1.7)), 'coat', { mirror: true });
    // the hoof: two toes split at the front, a dew claw behind
    const hoof = subtract(box([p[0], 1.6, p[2] + 2.4], [2.3, 1.6, 2.6], { round: 0.9 }), aabb([p[0] - 0.5, 0, p[2] + 3.2], [p[0] + 0.5, 3.4, p[2] + 6]));
    b.add(bone, hoof, 'hoof', { mirror: true });
    b.add(bone, sphere([p[0], 4.2, p[2] - 1.9], 0.8), 'hoof', { mirror: true, thr: 0.2 });
    // the fetlock's dark sock
    b.paint(bone, aabb([p[0] - 3, 3, p[2] - 4], [p[0] + 3, p[1] + 1.5, p[2] + 5]), 'coat', { mirror: true, shade: 4, where: b.isMat('coat') });
  }
  // the tail: a white ring at its root, then long black hair
  const tr = HORSE.tail;
  b.add('hips', torus([tr[0], tr[1] - 0.4, tr[2] - 0.8], 1.9, 1.25, [55, 0, 0]), 'armor');
  const t1 = smoothPath([[0, tr[1] - 0.6, tr[2] - 1.2], [0, 56, -75], [0, 48, -77.5]], 3);
  b.add('tail1', tube(t1, t1.map((_, i) => 2.2 + i * 0.35)), 'tail', { thr: 0.2 });
  const t2 = smoothPath([[0, 48, -77.5], [0, 39, -78.5], [0, 31, -77.5], [0, 24, -76]], 3);
  b.add('tail2', tube(t2, t2.map((_, i) => 3.6 - Math.max(0, i - 5) * 0.4)), 'tail', { thr: 0.2 });
  b.paint(['tail1', 'tail2'], fn((x, y) => Math.abs(((x * 1.3 + y * 0.25 + 40) % 2.2) - 1.1) - 0.3, [-6, 20, -90], [6, 70, -70]), 'tail', { shade: 3, where: b.isMat('tail') });
}

/** White spaulders from the shoulder blades over the shoulders to the neck, elbow guards and gauntlets. */
function armor(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  // the mantle: round the back of the neck and over the shoulder blades
  const mantle = fn((x, y, z) => {
    const d = ellipsoid([0, sy - 1.2, -1.6], [10.2, 6.0, 6.6]).d(x, y, z);
    const inner = ellipsoid([0, sy - 1.2, -1.6], [8.6, 4.8, 5.2]).d(x, y, z);
    return Math.max(d, -inner, (sy - 6.5) - y, z - (1.8 - Math.max(0, y - sy) * 0.6));
  }, [-12, sy - 8, -10], [12, sy + 6, 4]);
  b.add('chest', mantle, 'armor');
  b.paint('chest', fn((x, y) => Math.abs(y - (sy - 4.5)) - 0.4 + Math.abs(x) * 0, [-12, sy - 7, -10], [12, sy - 2, 4]), 'armor', { shade: 3, where: b.isMat('armor') });
  // pauldrons over the shoulder balls
  b.add('upperarm.L', intersect(subtract(sphere([sx + 0.6, sy - 0.4, sz], 4.0), sphere([sx + 0.6, sy - 0.4, sz], 2.8)), halfSpace([0, sy - 3.4, 0], [0, -1, 0])), 'armor', { mirror: true });
  // the elbow guard: a cap over the point of the elbow
  b.add('forearm.L', intersect(subtract(sphere([sx, ey, sz - 0.6], 2.9), sphere([sx, ey, sz + 0.4], 2.1)), halfSpace([sx, ey, sz], [0, 0, -1])), 'armor', { mirror: true });
  // gauntlets: white from the wrist to mid-forearm, flared at the top, a ridge down the back
  b.add('forearm.L', cylinder([sx, wy + 0.4, sz], [sx, wy + 6.6, sz], 2.3, 2.7, 0.5), 'armor', { mirror: true });
  b.paint('forearm.L', torus([sx, wy + 6.2, sz], 2.6, 0.5, [0, 0, 0]), 'armor', { mirror: true, shade: 3, where: b.isMat('armor') });
}

// ---------------------------------------------------------------------------------------------- weapons

/** Gamuza sealed: a katana, a light-green wrap, a guard of two crescent moons back to back. Grip at the origin. */
function buildGamuzaSword(): VoxelModel {
  const b = new ModelBuilder('gamuza', 48);
  b.mat('steel', ['#E7EAEE', '#CFD3D8', '#AEB3BA', '#8E949C'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#F3F3F0'], { rough: 0.12, metal: 0.8 });
  b.mat('silver', ['#D6DADF', '#BFC5CB', '#9EA4AB', '#80868D'], { base: 1, rough: 0.3, metal: 0.85 });
  b.mat('wrap', ['#B9E3BD', '#A3D9A9', '#82BE88', '#5F9A66'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#E9EFE6']);
  b.bone('root', null, [0, 0, 0]);
  const z0 = 6, zTip = 40, zEnd = zTip - 3.2;
  const curve = (z: number) => ((z - z0) / (zTip - z0)) ** 2 * 1.1;
  b.add('root', fn((x, y, z) => {
    if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
    const c = curve(z);
    const top = 0.9 + c, bot = -1.1 + c + Math.max(0, z - zEnd) * 0.6;
    return Math.max(Math.abs(x) - 0.5, y - top, bot - y, z0 - z, z - zTip);
  }, [-2, -3, z0 - 1], [2, 5, zTip + 1]), 'steel', { thr: 0.3 });
  b.paint('root', fn((_x, y, z) => y - (-0.62 + curve(z) + Math.max(0, z - zEnd) * 0.6), [-2, -3, 0], [2, 5, zTip + 1]), 'edge');
  b.add('root', box([0, -0.05, 5.6], [0.85, 1.3, 0.5]), 'silver');
  // the guard: two crescents, their backs touching at the blade
  const tz = 4.7;
  const moon = (k: number) => subtract(cylinder([k * 2.0, 0, tz - 0.5], [k * 2.0, 0, tz + 0.5], 2.7), cylinder([k * 3.4, 0, tz - 1], [k * 3.4, 0, tz + 1], 2.3));
  b.add('root', union(moon(1), moon(-1)), 'silver', { thr: 0.2 });
  b.add('root', box([0, 0, -0.9], [1.1, 1.25, 5.2], { round: 0.5 }), 'wrap');
  b.paint('root', fn((_x, y, z) => Math.abs(((Math.abs(y) + z) % 2.6 + 2.6) % 2.6 - 1.3) - 0.42, [-2, -2, -6], [2, 2, 4]), 'ray', { where: b.isMat('wrap') });
  b.add('root', box([0, 0, -6.4], [1.2, 1.35, 0.55], { round: 0.35 }), 'silver');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** Gamuza released: a double-ended lance — a wrapped grip between two round hand guards and a long fluted
 *  cone to a point at each end. Grip at the origin, along Z. */
function buildLance(): VoxelModel {
  const b = new ModelBuilder('gamuza-lance', 48);
  b.mat('ivory', ['#F3F1E8', '#EEEBE1', '#DDD8C9', '#C5BFAE', '#A8A291'], { base: 1, rough: 0.35, shadeK: 0.9 });
  b.mat('wrap', ['#4E9A63', '#3A7E4E', '#2E643E'], { base: 1, rough: 0.8 });
  b.mat('gold', ['#E6CD7C', '#CDAE57', '#A88A3A'], { base: 1, rough: 0.3, metal: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  const zc = 9, zt = 62;
  b.add('root', cylinder([0, 0, -zc], [0, 0, zc], 1.15), 'wrap');
  b.paint('root', fn((_x, _y, z) => Math.abs(((z + 40) % 2.2) - 1.1) - 0.35, [-2, -2, -zc], [2, 2, zc]), 'wrap', { shade: 2 });
  for (const k of [-1, 1]) {
    const z0 = k * zc;
    // the hand guard: a dished disc
    b.add('root', cylinder([0, 0, z0 - k * 0.6], [0, 0, z0 + k * 0.6], 3.3, 3.3, 0.5), 'gold');
    // the cone, fluted
    b.add('root', fn((x, y, z) => {
      const u = (z - z0) * k;
      if (u < 0 || u > zt - zc) return 1;
      const r = 2.7 * (1 - u / (zt - zc)) + 0.25;
      return Math.hypot(x, y) - r;
    }, [-4, -4, Math.min(z0, k * zt) - 1], [4, 4, Math.max(z0, k * zt) + 1]), 'ivory', { thr: 0.2 });
    b.paint('root', fn((x, y, z) => {
      if ((z - z0) * k < 1.5) return 1;
      const a = Math.atan2(y, x);
      return Math.abs(((a * 3) / Math.PI) % 1 + 1) % 1 < 0.2 ? -1 : 1;
    }, [-4, -4, Math.min(z0, k * zt) - 1], [4, 4, Math.max(z0, k * zt) + 1]), 'ivory', { shade: 3, where: b.isMat('ivory') });
    // a gold ring a third of the way up the cone
    b.paint('root', aabb([-4, -4, Math.min(z0 + k * 14, z0 + k * 15.4)], [4, 4, Math.max(z0 + k * 14, z0 + k * 15.4)]), 'gold', { where: b.isMat('ivory') });
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}
