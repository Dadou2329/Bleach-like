// Renji Abarai — Lieutenant of the 6th Division. Construction and palette from
// docs/roster/C1-lieutenants-1.md §Renji, Soul Society look: crimson hair pulled up into a high spiky
// "pineapple" ponytail over a sharp widow's peak, a white headband round the forehead, jagged black tattoo
// brows splitting toward the temples, tribal bands down the sides of the neck, the plain black
// shihakushō, and Zabimaru (red hilt and sheath, jagged bronze guard) on the left hip. 1.88 m: the
// standard body at 44.8 vox/m, broad-shouldered and long-limbed.
// Shikai: six blade segments on a thread, each wider than the last, two long pick teeth on the edge and
// two short on the back, an arrowhead tip (separate props, laid out along the whip path every frame).
// Bankai, Hihiō Zabimaru: red fur pauldrons with a baboon skull on the left shoulder, a tooth necklace, fur
// down the right arm; the bone tail end in his hand — and the giant bone snake itself (skull with a red
// mane and vertebrae at 16 vox/m), driven as a chain.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, prism, smoothPath, sphere, spike, subtract, torus, tube, type V3 } from '../models/sdf';
import {
  SPEC_ADULT_MALE, faceLegend, feet, hakama, hands, head, humanoidSkeleton, kosodeSleeves, kosodeTorso, obi, shihakushoSprings, spikeHair,
  type HumanoidSpec, type Landmarks,
} from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { SpringDef } from '../anim/springs';

export const RENJI_RES = (48 * 84) / 90;
export type RenjiForm = 'lieutenant' | 'bankai';

/** Tall, broad-shouldered, long-limbed, lean. */
const SPEC: HumanoidSpec = {
  ...SPEC_ADULT_MALE,
  shoulder: [10.2, 66.5, -0.5],
  upperArm: 14.8,
  foreArm: 13.4,
  chest: [9.0, 5.1],
  waist: [7.0, 4.4],
  hips: [7.4, 4.7],
};

function palette(b: ModelBuilder, form: RenjiForm): void {
  b.mat('skin', ['#F3CBA6', '#E9BA90', '#D9A47C', '#C99671', '#A8765A'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#E84652', '#C7202F', '#A51A28', '#871321', '#6A0F1A'], { base: 1, rough: 0.5, shadeK: 0.85, dither: 0.06 });
  b.mat('band', ['#F3F3F0', '#E2E2E0', '#C8C8C6'], { base: 0, rough: 0.8 });
  b.mat('tattoo', ['#141418']);
  b.mat('lid', ['#2A1A14']);
  b.mat('sclera', ['#F3F1EC']);
  b.mat('iris', ['#8A4A2E']);
  b.mat('irisD', ['#4A2216']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#9A5E4C']);
  b.mat('black', ['#34343C', '#24242A', '#18181D', '#141418'], { base: 2, rough: 0.85, shadeK: 0.9 });
  b.mat('collar', ['#F3F3F0', '#E4E5E7', '#C9CCD1'], { base: 0, rough: 0.8 });
  b.mat('obi', ['#F3F3F0', '#E2E3E5', '#C6C9CE'], { base: 0, rough: 0.8 });
  b.mat('tabi', ['#F3F3F0', '#DEDFE1', '#C2C5CA'], { base: 0, rough: 0.8 });
  b.mat('straw', ['#C9A86A', '#A8874F', '#86683A'], { base: 1, rough: 0.9 });
  b.mat('cord', ['#5B4632']);
  if (form === 'bankai') {
    b.mat('fur', ['#C24A42', '#9E2B2B', '#7E1E22', '#5E1418'], { base: 1, rough: 0.95, shadeK: 0.9, dither: 0.1 });
    b.mat('bone', ['#F0E8D4', '#E6DCC4', '#CFC2A4', '#B9AC8E', '#8E8268'], { base: 1, rough: 0.7, shadeK: 0.9 });
    b.mat('socket', ['#2A2018']);
  }
}

/**
 * Sharp, cocky: the tattooed brows as single heavy strokes that break into a point toward the temples, a
 * skin row between them and the narrow eyes, a toothy smirk. Rows 9 → 0 (row 9 sits under the headband).
 */
const FACE = [
  '. . . . . . . . . .',
  '. T T T . . T T T .',
  'T . . . . . . . . T',
  '. . L L . . L L . .',
  '. L W I . . I W L .',
  '. . . i . . i . . .',
  '. . . . . s . . . .',
  '. . . . . . . m . .',
  '. . . m W W m . . .',
  '. . . . . . . . . .',
];

const assetCache = new Map<RenjiForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function renjiAsset(form: RenjiForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildRenji(form)));
  return a;
}

/**
 * 'katana' (sealed Zabimaru), 'sheath' / 'sheath-empty', 'hilt' (the Shikai's hilt and guard),
 * 'seg0'..'seg5' (the six Shikai segments, base → tip), 'handle' (the Bankai's bone tail end),
 * 'skull' and 'vertebra' (Hihiō Zabimaru, 16 vox/m).
 */
export type RenjiProp = 'katana' | 'sheath' | 'sheath-empty' | 'hilt' | 'seg0' | 'seg1' | 'seg2' | 'seg3' | 'seg4' | 'seg5' | 'handle' | 'skull' | 'vertebra';

export function renjiProp(kind: RenjiProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'katana' ? buildKatana(true) : kind === 'hilt' ? buildKatana(false) : kind === 'sheath' || kind === 'sheath-empty' ? buildSheath(kind === 'sheath')
      : kind === 'handle' ? buildHandle() : kind === 'skull' ? buildSnakeSkull() : kind === 'vertebra' ? buildVertebra() : buildSegment(Number(kind.slice(3)));
    propCache.set(kind, m);
  }
  return m;
}

/** Shikai segment geometry (m): each segment's length along the blade, base → tip. */
export const SEGMENT_LEN = [0.19, 0.18, 0.18, 0.18, 0.17, 0.21];
/** where the first segment starts, from the grip along +Z (m) */
export const SEGMENT_BASE = 0.14;

export function buildRenji(form: RenjiForm = 'lieutenant'): CharacterAsset {
  const b = new ModelBuilder(`renji-${form}`, RENJI_RES);
  palette(b, form);
  const s = SPEC;
  const L = humanoidSkeleton(b, s, { sleeves: true, hakama: true });
  b.socket('grip.R', 'fist.R', [-L.wrist[0] + 0.1, L.wrist[1] - 4.3, L.wrist[2] + 0.4]);
  b.socket('grip.L', 'fist.L', [L.wrist[0] - 0.1, L.wrist[1] - 4.3, L.wrist[2] + 0.4]);
  b.socket('palm.R', 'palm.R', [-L.wrist[0] + 0.6, L.wrist[1] - 5, L.wrist[2] + 1]);
  b.socket('palm.L', 'palm.L', [L.wrist[0] - 0.6, L.wrist[1] - 5, L.wrist[2] + 1]);
  b.socket('finger.R', 'palm.R', [-L.wrist[0] + 0.2, L.wrist[1] - s.hand - 0.5, L.wrist[2] + 1]);
  b.socket('finger.L', 'palm.L', [L.wrist[0] - 0.2, L.wrist[1] - s.hand - 0.5, L.wrist[2] + 1]);
  b.socket('hip.L', 'hips', [9.4, 46.5, 3.4], [-26, 180, -8]);
  b.socket('chest.front', 'chest', [0, 61, 7]);
  b.socket('back', 'chest', [0, 60, -8]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.stamp('head', hd.x0, hd.chin + 9, FACE, { ...faceLegend({ skin: 'skin', brow: 'tattoo', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), T: { mat: 'tattoo' } }, hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  hair(b, L, hd);
  tattoos(b, L);
  hands(b, L, 'skin');
  feet(b, L, 'tabi', 'straw', 'cord');
  const o = { black: 'black', collar: 'collar', skin: 'skin', obi: 'obi' };
  kosodeTorso(b, L, o);
  kosodeSleeves(b, L, o);
  obi(b, L, o);
  hakama(b, L, o);
  if (form === 'bankai') baboonGarb(b, L);
  b.autoShade();
  b.lint();
  const base = shihakushoSprings();
  const springs: SpringDef[] = [...base.springs, { bone: 'band.tails', tail: [0, -0.1, -0.12], stiffness: 30, damping: 4, gravity: 8, limit: 70, radius: 0.03 }];
  return { model: b.build(), springs, colliders: base.colliders, warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- head

/**
 * Crimson hair: everything drawn up and back from a sharp widow's peak to a white tie high on the back of
 * the crown, where it bursts into a fan of thick spikes (the "pineapple"); the white headband round the
 * forehead, knotted at the back with two short tails on a spring bone.
 */
function hair(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }): void {
  const s = L.spec;
  const c = hd.chin, front = hd.front;
  const back = L.headC[2] - s.head.d / 2;
  // the cap: pulled tight, flowing up and back
  spikeHair(b, L, 'hair', [
    { az: 0, el: 60, len: 1.8, r: 4.4, flat: 0.4, flow: [0, 0.8, -1] },
    { az: -60, el: 40, len: 1.8, r: 4.2, flat: 0.4, flow: [0, 0.8, -1] },
    { az: 60, el: 40, len: 1.8, r: 4.2, flat: 0.4, flow: [0, 0.8, -1] },
    { az: -120, el: 25, len: 1.6, r: 4, flat: 0.4, flow: [0, 1, -0.6] },
    { az: 120, el: 25, len: 1.6, r: 4, flat: 0.4, flow: [0, 1, -0.6] },
    { az: 180, el: 15, len: 1.4, r: 4, flat: 0.4, flow: [0, 1, -0.4] },
  ], [], { tufts: 0, hairline: c + s.head.h - 2, slope: 0.7 });
  // the widow's peak: a point of hair down the middle of the forehead
  b.add('head', intersect(prism([[-2.6, c + 12.2], [2.6, c + 12.2], [0, c + 9.4]], [0, 0, front - 0.6], [1, 0, 0], [0, 1, 0], 0.8), halfSpace([0, 0, front - 1.6], [0, 0, -1])), 'hair', { thr: 0.2 });
  // the tie, high on the back of the crown, and the ponytail bursting out of it
  const tie: V3 = [0, c + 13.2, back + 2.4];
  b.add('head', torus(tie, 2.1, 0.8, [55, 0, 0]), 'band', { thr: 0.25 });
  b.add('head', sphere(tie, 2.2), 'hair');
  const tail: [V3, number, number][] = [
    [[0, 1, -0.35], 11, 3.2], [[0.45, 0.85, -0.45], 10, 3], [[-0.45, 0.85, -0.45], 10, 3],
    [[0.75, 0.45, -0.6], 9, 2.8], [[-0.75, 0.45, -0.6], 9, 2.8], [[0, 0.55, -0.85], 10.5, 3.1],
    [[0.35, 0.1, -1], 8.5, 2.7], [[-0.35, 0.1, -1], 8.5, 2.7], [[0, -0.25, -1], 7.5, 2.6],
  ];
  for (const [d, len, r] of tail) b.add('head', spike(tie, d, len, r, r * 0.6, { tip: 0.3 }), 'hair', { thr: 0.3 });
  // strands drawn back
  b.paint('head', fn((x) => Math.abs(((x + 40) % 2.2) - 1.1) - 0.32, [-9, c, -16], [9, c + 22, 9]), 'hair', { shade: 3, where: b.isMat('hair') });
  // the headband: a white band round the forehead just under the hairline, knotted at the back
  const by = c + 10.2;
  b.add('head', intersect(
    subtract(ellipsoid([0, by, L.headC[2] - 0.2], [6.6, 1.4, 6.9]), ellipsoid([0, by, L.headC[2] - 0.2], [5.4, 3, 5.7])),
    aabb([-10, by - 1, -12], [10, by + 1, 12])), 'band', { thr: 0.2 });
  b.add('head', sphere([0, by, back - 0.6], 1.3), 'band');
  b.bone('band.tails', 'head', [0, by, back - 1]);
  for (const k of [-1, 1]) b.add('band.tails', capsule([k * 0.4, by, back - 1.2], [k * 1.6, by - 4.5, back - 2.4], 0.75, 0.6), 'band', { thr: 0.2 });
  // the eyes clear
  b.carve('head', aabb([-5, c + 4, front], [-1, c + 7, front + 6]));
  b.carve('head', aabb([1, c + 4, front], [5, c + 7, front + 6]));
}

/** Tribal bands down both sides of the neck to the collar, jagged. */
function tattoos(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const c = s.chinY;
  for (const k of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const y0 = c - 0.5 - i * 1.8;
      b.paint('neck', capsule([k * 1.4, y0, 0.8], [k * 2.8, y0 - 1.2, -0.6], 0.5), 'tattoo', { where: b.isMat('skin') });
    }
    b.paint('neck', capsule([k * 2.4, c + 0.5, -1.6], [k * 2.4, c - 5, -0.6], 0.45), 'tattoo', { where: b.isMat('skin') });
  }
}

// ---------------------------------------------------------------------------------------------- Bankai garb

/** Hihiō Zabimaru garb: red fur pauldrons, a baboon skull on the left shoulder, a tooth necklace, fur down the right arm. */
function baboonGarb(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1];
  for (const k of [1, -1]) {
    const bone = k > 0 ? 'upperarm.L' : 'upperarm.R';
    b.add(bone, blend(1.4, ellipsoid([k * (sx + 0.4), sy + 0.8, sz], [4.6, 3.2, 4.8]), ellipsoid([k * (sx + 1.2), sy - 2.4, sz], [3.8, 3.4, 4.2])), 'fur', { thr: 0.3 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      b.add(bone, spike([k * (sx + 1.2) + Math.cos(a) * 2.6, sy - 3.4, sz + Math.sin(a) * 3], [Math.cos(a) * 0.3, -1, Math.sin(a) * 0.3], 3, 1.1, 0.8, { tip: 0.3 }), 'fur', { thr: 0.3 });
    }
  }
  // the baboon skull on the left shoulder, staring forward: cranium, heavy brow, long muzzle, deep sockets
  const kx = sx + 0.6, ky = sy + 4.4, kz = sz + 0.6;
  b.add('upperarm.L', blend(1.1,
    ellipsoid([kx, ky, kz], [3.5, 3.2, 3.4]),
    box([kx, ky - 1.4, kz + 3.4], [2.3, 1.7, 2.3], { round: 1 })), 'bone');
  b.add('upperarm.L', capsule([kx - 2.5, ky + 1.1, kz + 2.4], [kx + 2.5, ky + 1.1, kz + 2.4], 1), 'bone');
  for (const dx of [-1.45, 1.45]) {
    b.carve('upperarm.L', sphere([kx + dx, ky + 0.1, kz + 3.3], 1.25));
    b.paint('upperarm.L', sphere([kx + dx, ky + 0.1, kz + 2.7], 1.7), 'socket', { where: b.isMat('bone') });
  }
  // nostrils and the clenched teeth along the muzzle
  for (const dx of [-0.6, 0.6]) b.paint('upperarm.L', sphere([kx + dx, ky - 0.6, kz + 5.8], 0.55), 'socket', { where: b.isMat('bone') });
  b.paint('upperarm.L', box([kx, ky - 2.4, kz + 5.4], [2, 0.3, 1]), 'socket', { where: b.isMat('bone') });
  // the tooth necklace across the chest, standing proud of the collar
  const nz = s.chest[1] + 2.4;
  const pts = smoothPath([[-sx + 1, sy + 1.4, sz + 3], [-4.4, s.chestY + 1.5, nz], [0, s.chestY - 0.8, nz + 0.4], [4.4, s.chestY + 1.5, nz], [sx - 1, sy + 1.4, sz + 3]], 4);
  b.add('chest', tube(pts, pts.map(() => 0.6)), 'socket', { thr: 0.2 });
  for (let i = 2; i < pts.length - 2; i += 2) b.add('chest', spike(pts[i], [0, -1, 0.3], 2.8, 0.95, 0.75, { tip: 0.3 }), 'bone', { thr: 0.2 });
  // fur running down the right arm, over the sleeve
  b.paint('upperarm.R', capsule([-sx, sy - 1, sz], [-sx - 0.6, ey - 1, sz], 5), 'fur', { where: b.isMat('black') });
  for (let i = 0; i < 5; i++) {
    const y = sy - 2 - i * 2.2;
    b.add('upperarm.R', spike([-sx - 3.6, y, sz + (i % 2 ? 1.4 : -1.2)], [-0.6, -1, 0.1], 2.6, 1.2, 0.8, { tip: 0.3 }), 'fur', { thr: 0.3 });
  }
}

// ---------------------------------------------------------------------------------------------- props

function bladeMats(b: ModelBuilder): void {
  b.mat('steel', ['#E2E5E9', '#C9CDD2', '#A5AAB1', '#8B9096'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#EEF1F4'], { rough: 0.12, metal: 0.8 });
  b.mat('spine', ['#9AA0A7', '#8B9096', '#6E737A'], { base: 1, rough: 0.3, metal: 0.85 });
  b.mat('bronze', ['#C89A55', '#9C6B2E', '#7A5222', '#5A3C18'], { base: 1, rough: 0.35, metal: 0.8, shadeK: 0.8 });
  b.mat('wrap', ['#C0283A', '#A3192A', '#7E1220'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#EDE7DA']);
  b.mat('lacquer', ['#C2343A', '#8C1622', '#6A1019', '#4E0B12'], { base: 1, rough: 0.3, shadeK: 0.8 });
}

/** The hilt and the jagged rectangular guard (shared by the katana and the Shikai). */
function hiltAndGuard(b: ModelBuilder): void {
  // the guard: a rectangle with notched corners
  const tz = 5.4;
  b.add('root', subtract(box([0, 0, tz], [2.4, 3.2, 0.55], { round: 0.3 }), box([2.4, 3.2, tz], [0.9, 0.9, 1]), box([-2.4, -3.2, tz], [0.9, 0.9, 1]), box([2.4, -1.2, tz], [0.6, 0.5, 1]), box([-2.4, 1.2, tz], [0.6, 0.5, 1])), 'bronze');
  b.add('root', box([0, 0, -0.8], [1.1, 1.25, 5.8], { round: 0.5 }), 'wrap');
  b.paint('root', fn((x, y, z) => Math.abs(((Math.abs(y) + z) % 2.6 + 2.6) % 2.6 - 1.3) - 0.45, [-2, -2, -7], [2, 2, 4.8]), 'ray', { where: b.isMat('wrap') });
  b.add('root', box([0, 0, 4.6], [1.2, 1.35, 0.45], { round: 0.3 }), 'bronze');
  b.add('root', box([0, 0, -7], [1.25, 1.4, 0.55], { round: 0.35 }), 'bronze');
}

/** Sealed Zabimaru: a plain katana (or just its hilt and guard, for the Shikai). Origin at the grip, +Z, edge −Y. */
function buildKatana(withBlade: boolean): VoxelModel {
  const b = new ModelBuilder(withBlade ? 'zabimaru' : 'zabimaru-hilt', 48);
  bladeMats(b);
  b.bone('root', null, [0, 0, 0]);
  hiltAndGuard(b);
  if (withBlade) {
    const z0 = 6.5, zEnd = 37, zTip = 40;
    const curve = (z: number) => ((z - z0) / (zTip - z0)) ** 2 * 1.6;
    b.add('root', fn((x, y, z) => {
      if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
      const cv = curve(z);
      const top = 0.85 + cv, bot = -1.0 + cv + Math.max(0, z - zEnd) * 0.6;
      return Math.max(Math.abs(x) - 0.5, y - top, bot - y, z0 - z, z - zTip);
    }, [-2, -3, z0 - 1], [2, 5, zTip + 1]), 'steel', { thr: 0.3 });
    b.paint('root', fn((x, y, z) => y - (-0.6 + curve(z) + Math.max(0, z - zEnd) * 0.6), [-2, -3, 0], [2, 5, zTip + 1]), 'edge');
    b.add('root', box([0, -0.05, 6.3], [0.85, 1.25, 0.5]), 'bronze');
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** Red sheath. Origin at the mouth, along +Z. */
function buildSheath(withSword: boolean): VoxelModel {
  const b = new ModelBuilder(withSword ? 'zabimaru-sheath-full' : 'zabimaru-sheath', 48);
  bladeMats(b);
  b.bone('root', null, [0, 0, 0]);
  const curve = (z: number) => (z / 35) ** 2 * 1.6;
  b.add('root', fn((x, y, z) => Math.max(Math.hypot(x, (y - curve(Math.max(0, z))) / 1.6) - 1, -z, z - 34.5), [-2, -3, -1], [2, 5, 36]), 'lacquer');
  b.add('root', box([0, 0, 0.4], [1.3, 1.9, 0.6], { round: 0.3 }), 'bronze');
  b.add('root', box([0, curve(34), 34.2], [1.15, 1.8, 0.6], { round: 0.4 }), 'bronze');
  if (withSword) {
    b.add('root', subtract(box([0, 0, -1.1], [2.4, 3.2, 0.55], { round: 0.3 }), box([2.4, 3.2, -1.1], [0.9, 0.9, 1]), box([-2.4, -3.2, -1.1], [0.9, 0.9, 1])), 'bronze');
    b.add('root', box([0, 0, -7.6], [1.1, 1.25, 5.8], { round: 0.5 }), 'wrap');
    b.paint('root', fn((x, y, z) => Math.abs(((Math.abs(y) + z) % 2.6 + 2.6) % 2.6 - 1.3) - 0.45, [-2, -2, -14], [2, 2, -1.7]), 'ray', { where: b.isMat('wrap') });
    b.add('root', box([0, 0, -13.8], [1.25, 1.4, 0.55], { round: 0.35 }), 'bronze');
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * One Shikai segment (i = 0 at the guard … 5 the arrowhead tip): a flat blade plate, wider toward the tip,
 * with two long pick teeth hooking forward off the edge (−Y) and two short ones on the back (+Y).
 * Origin at the segment's base joint, along +Z.
 */
function buildSegment(i: number): VoxelModel {
  const b = new ModelBuilder(`zabimaru-seg${i}`, 48);
  bladeMats(b);
  b.bone('root', null, [0, 0, 0]);
  const len = SEGMENT_LEN[i] * 48;
  const h0 = 1.3 + i * 0.42, h1 = 1.5 + i * 0.46;
  if (i < 5) {
    // the plate, a little narrower at its base where the previous segment overlaps
    b.add('root', fn((x, y, z) => {
      if (z < -0.5 || z > len + 0.5) return 1;
      const h = h0 + (h1 - h0) * (z / len);
      return Math.max(Math.abs(x) - 0.55, Math.abs(y) - h, -z, z - len);
    }, [-2, -6, -1], [2, 6, len + 1]), 'steel', { thr: 0.3 });
    // the edge teeth: two long picks hooking forward, the back: two short ones
    for (const [zt, ln] of [[len * 0.35, 3.2 + i * 0.5], [len * 0.85, 3.6 + i * 0.55]] as [number, number][])
      b.add('root', spike([0, -h0 - 0.2, zt], [0, -0.75, 0.75], ln, 0.9, 0.5, { side: [0, 0, 1], tip: 0.3 }), 'edge', { thr: 0.25 });
    for (const zt of [len * 0.3, len * 0.8]) b.add('root', spike([0, h0 - 0.2, zt], [0, 0.6, 0.8], 1.8 + i * 0.2, 0.7, 0.45, { side: [0, 0, 1], tip: 0.3 }), 'spine', { thr: 0.25 });
    b.paint('root', fn((x, y, z) => y - (-(h0 + (h1 - h0) * (z / len)) + 0.7), [-2, -8, -1], [2, 8, len + 1]), 'edge', { where: b.isMat('steel') });
    b.paint('root', fn((x, y, z) => (h0 + (h1 - h0) * (z / len)) - 0.6 - y, [-2, -8, -1], [2, 8, len + 1]), 'spine', { where: b.isMat('steel') });
  } else {
    // the arrowhead tip
    b.add('root', prism([[0, -h1 - 0.6], [len * 0.55, -h1 - 1.4], [len, 0], [len * 0.55, h1 + 0.6], [0, h1 - 0.2]], [0, 0, 0], [0, 0, 1], [0, 1, 0], 0.55), 'steel', { thr: 0.25 });
    b.add('root', spike([0, -h1, len * 0.3], [0, -0.75, 0.75], 3.6, 0.9, 0.5, { side: [0, 0, 1], tip: 0.3 }), 'edge', { thr: 0.25 });
    b.paint('root', fn((x, y, z) => Math.abs(y) - (h1 + 0.6) * (1 - z / len) + 1, [-2, -8, -1], [2, 8, len + 1]), 'edge', { where: b.isMat('steel') });
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** The Bankai's handle: the bony tail end of the snake, held like a hilt. Origin at the grip, +Z toward the snake. */
function buildHandle(): VoxelModel {
  const b = new ModelBuilder('hihio-handle', 48);
  b.mat('bone', ['#F0E8D4', '#E6DCC4', '#CFC2A4', '#B9AC8E', '#8E8268'], { base: 1, rough: 0.7, shadeK: 0.9 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', capsule([0, 0, -6], [0, 0, 7], 1.3, 1.6), 'bone');
  for (let i = 0; i < 4; i++) {
    const z = 8 + i * 3.4;
    b.add('root', blend(0.8, sphere([0, 0, z], 2 + i * 0.35), cylinder([0, 0, z - 1.4], [0, 0, z + 1.4], 1.4 + i * 0.3)), 'bone');
    b.add('root', spike([0, -1.6 - i * 0.3, z], [0, -0.8, 0.6], 2.4 + i * 0.4, 0.7, 0.5, { side: [0, 0, 1], tip: 0.3 }), 'bone', { thr: 0.25 });
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * Hihiō Zabimaru's skull at 16 vox/m (≈4 m): a long serpent skull with deep eye sockets, a heavy upper
 * jaw full of fangs, a hinged-open lower jaw, a ridge of horn-plates — and a great red mane round the back
 * of it. Origin at the back of the skull (where the first vertebra joins), looking along +Z.
 */
function buildSnakeSkull(): VoxelModel {
  const b = new ModelBuilder('hihio-skull', 16);
  b.mat('bone', ['#F0E8D4', '#E6DCC4', '#CFC2A4', '#B9AC8E', '#8E8268'], { base: 1, rough: 0.7, shadeK: 0.9 });
  b.mat('socket', ['#2A2018', '#1C1612']);
  b.mat('fang', ['#F3F0E6', '#E2DCCB']);
  b.mat('mane', ['#D23A44', '#B5232E', '#931B26', '#7E1620'], { base: 1, rough: 0.95, shadeK: 0.9, dither: 0.12 });
  b.mat('glow', ['#FF8A7A', '#FF2E2E'], { glow: 2.2 });
  b.bone('root', null, [0, 0, 0]);
  // cranium and the long snout
  b.add('root', blend(3,
    ellipsoid([0, 2, 12], [12, 10, 13]),
    box([0, 1, 34], [8, 5.5, 14], { round: 4 }),
    ellipsoid([0, 2.5, 48], [7, 5, 6])), 'bone');
  // brow ridges over the sockets, horn plates down the middle
  for (const k of [-1, 1]) b.add('root', capsule([k * 3, 10, 16], [k * 9, 8, 26], 3.2, 2.2), 'bone');
  for (let i = 0; i < 5; i++) b.add('root', spike([0, 10 - i * 0.6, 22 - i * 5], [0, 1, -0.6], 7 - i * 0.8, 2.6, 1.4, { side: [1, 0, 0], tip: 0.3 }), 'bone', { thr: 0.3 });
  // the sockets, deep, with a red glint inside
  for (const k of [-1, 1]) {
    b.carve('root', ellipsoid([k * 7, 5, 26], [3.6, 3, 3.4]));
    b.add('root', sphere([k * 6.2, 4.6, 25], 1.3), 'glow');
    b.paint('root', ellipsoid([k * 7, 5, 26], [4.6, 4, 4.4]), 'socket', { where: b.isMat('bone') });
  }
  // the jaw: hanging open beneath the snout
  b.add('root', blend(2, box([0, -9, 30], [6.5, 2.4, 14], { round: 2 }), ellipsoid([0, -5, 14], [9, 5, 8])), 'bone');
  b.carve('root', box([0, -4.2, 36], [6, 2.6, 14]));
  // fangs: long ones down from the upper jaw, upward from the lower
  for (const k of [-1, 1]) {
    for (let i = 0; i < 4; i++) b.add('root', spike([k * (5.6 - i * 0.6), -2.4, 46 - i * 6], [0, -1, 0.1], 7 - i * 1.2, 1.6, 1.2, { tip: 0.3 }), 'fang', { thr: 0.3 });
    for (let i = 0; i < 3; i++) b.add('root', spike([k * (4.6 - i * 0.5), -7, 40 - i * 6], [0, 1, 0.15], 4.4 - i * 0.8, 1.3, 1, { tip: 0.3 }), 'fang', { thr: 0.3 });
  }
  // nostrils
  for (const k of [-1, 1]) b.paint('root', sphere([k * 2.4, 6.4, 52], 1.2), 'socket', { where: b.isMat('bone') });
  // the mane: a great ruff of red fur round the back of the skull, in thick tufts swept back
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    const d: V3 = [Math.cos(a), Math.sin(a), -0.7];
    b.add('root', spike([Math.cos(a) * 9, 2 + Math.sin(a) * 8, 6], d, 12 + (i % 3) * 3, 4.2, 2.6, { bend: [0, -0.15, -0.3], tip: 0.3 }), 'mane', { thr: 0.3 });
  }
  b.add('root', ellipsoid([0, 2, 2], [11, 10, 6]), 'mane', { only: 'empty' });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint(8);
  return b.build();
}

/**
 * One vertebra of the snake at 16 vox/m (≈1.4 m): a thick spool of bone with a ridge plate on top and the
 * Shikai's teeth grown huge on either side — two long picks down and out, two short up. Origin at the
 * joint with the next segment toward the head; the segment runs back along −Z.
 */
function buildVertebra(): VoxelModel {
  const b = new ModelBuilder('hihio-vertebra', 16);
  b.mat('bone', ['#F0E8D4', '#E6DCC4', '#CFC2A4', '#B9AC8E', '#8E8268'], { base: 1, rough: 0.7, shadeK: 0.9 });
  b.mat('crevice', ['#8E8268', '#6E6450']);
  b.bone('root', null, [0, 0, 0]);
  b.add('root', blend(2, cylinder([0, 0, -2], [0, 0, -20], 6.5, 5.8, 2), sphere([0, 0, -11], 7.2)), 'bone');
  b.paint('root', cylinder([0, 0, -10.6], [0, 0, -11.4], 8), 'crevice', { where: b.isMat('bone') });
  // the ridge plate and the picks
  b.add('root', spike([0, 5, -9], [0, 1, -0.5], 8, 3.4, 1.4, { side: [0, 0, 1], tip: 0.3 }), 'bone', { thr: 0.3 });
  for (const k of [-1, 1]) {
    b.add('root', spike([k * 5, -3, -8], [k * 0.7, -0.6, 0.35], 11, 2.2, 1.4, { tip: 0.3 }), 'bone', { thr: 0.3 });
    b.add('root', spike([k * 5, 3, -14], [k * 0.75, 0.5, 0.2], 6, 1.8, 1.2, { tip: 0.3 }), 'bone', { thr: 0.3 });
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint(8);
  return b.build();
}
