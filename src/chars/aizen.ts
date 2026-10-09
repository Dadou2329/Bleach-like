// Sōsuke Aizen. Construction and palette from docs/roster/B2-captains-2.md §Aizen.
// Captain, 5th Division: soft curtain bangs parted at the centre, gentle drooping eyes, a mild smile,
// square black glasses (a prop: he crushes them), black shihakushō under a long-sleeved white haori
// with turquoise lining and 五 on the back, Kyōka Suigetsu at the left hip. The reveal: the same
// outfit, the hair swept back with a single strand over the forehead, the eyes sharpened. Hōgyoku —
// the Chrysalis: a pure white shell from head to toe, solid violet eyes, four violet lines crossing
// out from the orb below the chest, the shell opening into four long tails at the waist, heeled feet,
// the sword fused into the right forearm. TYBW, the Muken prisoner: a uniform of wide black leather bands with white
// trim flaring into a tunic below the knee, a grey neckcloth capelet, a band across the right eye, the hair grown long
// and loose; props: the restraint chair and the bands over the left eye and mouth he wears until the first key turns.
// 1.86 m: the standard body at 45.3 vox/m.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, prism, smoothPath, sphere, spike, subtract, tube, type Sdf, type V3 } from '../models/sdf';
import {
  SPEC_ADULT_MALE, addBands, coatSkirt, feet, hakama, hands, head, humanoidSkeleton, kosodeSleeves, kosodeTorso, obi, shihakushoSprings, spikeHair,
  type HumanoidSpec, type Landmarks, type Spike,
} from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

export const AIZEN_RES = (48 * 84) / 89;
export type AizenForm = 'captain' | 'traitor' | 'chrysalis' | 'tybw';

/** Tall and lean: level shoulders, narrow waist, long legs. */
const SPEC: HumanoidSpec = {
  ...SPEC_ADULT_MALE,
  shoulder: [9.6, 66.5, -0.5],
  chest: [8.3, 4.8],
  waist: [6.6, 4.2],
  hips: [7.1, 4.6],
};

function palette(b: ModelBuilder, form: AizenForm): void {
  b.mat('skin', ['#FBE6D6', '#F1D3BC', '#E4C0A6', '#D6AE93', '#BC9278'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#8C6040', '#7D5434', '#6A4630', '#5B3A24', '#4A2F1D', '#3B2516'], { base: 3, rough: 0.55, shadeK: 0.85, dither: 0.08 });
  b.mat('brow', ['#4A2F1D']);
  b.mat('lid', ['#2E1C12']);
  b.mat('sclera', ['#F3F1EC']);
  b.mat('iris', ['#5A3A26']);
  b.mat('irisD', ['#2A1A10']);
  b.mat('mouth', ['#A06A58']);
  b.mat('black', ['#3B3B42', '#2B2B31', '#1E1E23', '#17171B', '#141418'], { base: 2, rough: 0.88, shadeK: 1, dither: 0.04 });
  b.mat('collar', ['#F1F0EC', '#E3E2DE', '#C6C5C1'], { base: 0, rough: 0.85 });
  b.mat('obi', ['#F1F0EC', '#E3E2DE', '#C6C5C1'], { base: 0, rough: 0.85 });
  b.mat('haori', ['#F3F3F0', '#ECECE8', '#DCDCD8', '#C3C5C9', '#A4A8AF'], { base: 1, rough: 0.82, shadeK: 0.9 });
  b.mat('haoriIn', ['#C8F5F5', '#AFEEEE', '#8CD6D6'], { base: 1, rough: 0.85 });
  b.mat('kanji', ['#141418'], { rough: 0.9 });
  b.mat('tabi', ['#F3F2EE', '#E4E2DD', '#C9C6BF'], { base: 0, rough: 0.85 });
  b.mat('straw', ['#CDB683', '#B99A63', '#8A6A3E'], { base: 1, rough: 0.95 });
  b.mat('cord', ['#5B4632']);
  // the Chrysalis
  b.mat('shell', ['#F3F3F0', '#F2F0EA', '#E2DFD6', '#CBC7BC', '#ABA699'], { base: 1, rough: 0.3, shadeK: 0.95 });
  b.mat('vein', ['#B57DFF', '#9B4DFF', '#7A3AB8'], { base: 1, rough: 0.3, glow: 1.4 });
  b.mat('voidEye', form === 'chrysalis' ? ['#6E2BB8'] : ['#141418'], { glow: form === 'chrysalis' ? 0.8 : 0 });
  b.mat('tailIn', ['#4A2878', '#3A1D60', '#2A1448'], { base: 1, rough: 0.5 });
  b.mat('orb', ['#F2EEFF', '#C9B6FF', '#8E6BE8'], { base: 1, rough: 0.15, glow: 1.4 });
  // the Muken prisoner
  b.mat('leather', ['#3A3A40', '#2C2C31', '#212125', '#19191C', '#141418'], { base: 2, rough: 0.42, shadeK: 1, metal: 0.05 });
  b.mat('leatherIn', ['#2A2A2E', '#1E1E22', '#161619'], { base: 1, rough: 0.6 });
  b.mat('trim', ['#F0F0EE', '#E9E9E9', '#CFCFCD', '#AEAEAC'], { base: 1, rough: 0.6 });
  b.mat('cape', ['#A6A6A9', '#929295', '#8C8C8E', '#747477', '#5C5C60'], { base: 2, rough: 0.9, shadeK: 0.95 });
}

/** Captain: gentle eyes drooping at the outer corners, soft brows, a mild closed smile. */
const FACE_CAPTAIN = [
  '. . . . . . . . . .',
  '. . . . . . . . . .',
  '. B B . . . . B B .',
  '. . L L . . L L . .',
  '. L W I . . I W L .',
  '. . . i . . i . . .',
  '. . . . . s . . . .',
  '. . . m . . m . . .',
  '. . . . m m . . . .',
  '. . . . . . . . . .',
];
/** The reveal: the brows level and lowered, the eyes narrowed and cold, the smile thinned. */
const FACE_TRAITOR = [
  '. . . . . . . . . .',
  '. . . . . . . . . .',
  '. . B B . . B B . .',
  '. B L L . . L L B .',
  '. L W I . . I W L .',
  '. . . i . . i . . .',
  '. . . . . s . . . .',
  '. . . . . . m . . .',
  '. . . m m m . . . .',
  '. . . . . . . . . .',
];

const assetCache = new Map<AizenForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function aizenAsset(form: AizenForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildAizen(form)));
  return a;
}

export type AizenProp = 'katana' | 'sheath' | 'sheath-empty' | 'glasses' | 'fused' | 'chair' | 'gag';

/** The fused blade on the grip.R socket (Euler XYZ, radians): turned down the forearm, tipped forward. */
export const FUSED_ATTACH: [number, number, number] = [Math.PI / 2 - 0.6, 0, 0];

export function aizenProp(kind: AizenProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'katana' ? buildKyoka() : kind === 'glasses' ? buildGlasses() : kind === 'fused' ? buildFusedBlade() : kind === 'chair' ? buildChair() : kind === 'gag' ? buildGag() : buildSheath(kind === 'sheath');
    propCache.set(kind, m);
  }
  return m;
}

export function buildAizen(form: AizenForm = 'captain'): CharacterAsset {
  const b = new ModelBuilder(`aizen-${form}`, AIZEN_RES);
  palette(b, form);
  const s = SPEC;
  const chrys = form === 'chrysalis';
  const tybw = form === 'tybw';
  const L = humanoidSkeleton(b, s, { sleeves: !chrys && !tybw, hakama: !chrys && !tybw });
  b.socket('grip.R', 'fist.R', [-L.wrist[0] + 0.1, L.wrist[1] - 4.3, L.wrist[2] + 0.4]);
  b.socket('grip.L', 'fist.L', [L.wrist[0] - 0.1, L.wrist[1] - 4.3, L.wrist[2] + 0.4]);
  b.socket('palm.R', 'palm.R', [-L.wrist[0] + 0.6, L.wrist[1] - 5, L.wrist[2] + 1]);
  b.socket('palm.L', 'palm.L', [L.wrist[0] - 0.6, L.wrist[1] - 5, L.wrist[2] + 1]);
  b.socket('finger.R', 'palm.R', [-L.wrist[0] + 0.2, L.wrist[1] - s.hand - 0.5, L.wrist[2] + 1]);
  b.socket('finger.L', 'palm.L', [L.wrist[0] - 0.2, L.wrist[1] - s.hand - 0.5, L.wrist[2] + 1]);
  b.socket('hip.L', 'hips', [9.2, 46.5, 3.4], [-26, 180, -8]);
  b.socket('chest.front', 'chest', [0, 61, 7]);
  b.socket('back', 'chest', [0, 60, -7]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  // the glasses prop sits on the head's own voxel lattice
  b.socket('glasses', 'head', [0, s.chinY + 5, hd.front]);
  if (chrys) return chrysalis(b, L, hd);
  // the restraint chair stands where he does
  b.socket('chair', 'root', [0, 0, 0]);
  if (tybw) return prisoner(b, L, hd);
  b.stamp('head', hd.x0, hd.chin + 9, form === 'captain' ? FACE_CAPTAIN : FACE_TRAITOR, {
    B: { mat: 'brow' }, L: { mat: 'lid' }, W: { mat: 'sclera' }, I: { mat: 'iris' }, i: { mat: 'irisD' }, s: { mat: 'skin', shade: 3 }, m: { mat: 'mouth' },
  }, hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  if (form === 'captain') curtainHair(b, L, hd);
  else slickedHair(b, L, hd);
  hands(b, L, 'skin');
  feet(b, L, 'tabi', 'straw', 'cord');
  const o = { black: 'black', collar: 'collar', skin: 'skin', obi: 'obi' };
  const torso = kosodeTorso(b, L, o);
  kosodeSleeves(b, L, o);
  obi(b, L, o);
  hakama(b, L, o);
  const coat = haori(b, L, torso);
  b.autoShade();
  b.lint();
  const base = shihakushoSprings();
  return {
    model: b.build(),
    springs: [...base.springs, ...coat.springs],
    colliders: [...base.colliders, ...coat.colliders],
    warnings: b.warnings,
  };
}

// ---------------------------------------------------------------------------------------------- hair

/**
 * Captain: soft, wavy, medium-length hair — a smooth rounded mass over the crown and the back of the
 * head down to the nape, the sides falling over the ears to the jaw, and a fringe parted at the centre
 * whose locks curve down and out over the forehead to the brows.
 */
function curtainHair(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): void {
  const s = L.spec;
  const c = hd.chin, front = hd.front;
  const back = L.headC[2] - s.head.d / 2;
  spikeHair(b, L, 'hair', [
    // a smooth crown: broad flat locks lying back and down
    { az: 0, el: 66, len: 2.2, r: 4.6, flat: 0.45, flow: [0, -0.2, -1] },
    { az: -60, el: 50, len: 2.4, r: 4.4, flat: 0.45, flow: [-0.1, -0.5, -0.8] },
    { az: 60, el: 50, len: 2.4, r: 4.4, flat: 0.45, flow: [0.1, -0.5, -0.8] },
    { az: 180, el: 40, len: 2.6, r: 4.6, flat: 0.5, flow: [0, -0.8, -0.4] },
    { az: -135, el: 28, len: 2.6, r: 4.4, flat: 0.5, flow: [0, -0.9, -0.3] },
    { az: 135, el: 28, len: 2.6, r: 4.4, flat: 0.5, flow: [0, -0.9, -0.3] },
  ], [], { tufts: 0, hairline: c + s.head.h - 1, slope: 0.6 });
  // the back: a rounded mass to the nape, the ends turned slightly out
  b.add('head', blend(1.6,
    ellipsoid([0, c + 6.8, back + 1.6], [6.4, 6.6, 4.2]),
    ellipsoid([0, c + 1.4, back + 1.2], [5.8, 2.6, 2.6])), 'hair');
  // sides: wavy locks over the ears down to the jaw
  for (const k of [-1, 1]) {
    for (const [dz, len, r] of [[-1.2, 0, 2.1], [-3.6, 1, 2.2], [-6, 0.5, 2]] as [number, number, number][]) {
      const pts = smoothPath([[k * 5.2, c + 11, front + dz - 1], [k * 6.4, c + 7.5, front + dz - 1.4], [k * 6.0, c + 4.2 - len, front + dz - 1.2], [k * 6.6, c + 1.6 - len, front + dz - 1.6]], 4);
      b.add('head', tube(pts, pts.map((_, j) => r - j * 0.09)), 'hair', { thr: 0.3 });
    }
  }
  // the fringe: from a centre parting, three locks a side curving down and out, ends lifting at the brows
  for (const k of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const x0 = k * (0.6 + i * 1.4);
      const pts = smoothPath([
        [k * 0.4, c + 12.6, front - 2.4],
        [x0, c + 11.2, front - 0.3],
        [x0 + k * (0.8 + i * 0.5), c + 9.2 - i * 0.2, front + 0.5],
        [x0 + k * (1.6 + i * 0.8), c + 7.8 - i * 0.6, front + 0.3],
        [x0 + k * (2.4 + i * 0.9), c + 7.6 - i * 0.5, front - 0.4],
      ], 3);
      b.add('head', tube(pts, pts.map((_, j) => 1.55 - j * 0.07)), 'hair', { thr: 0.3 });
    }
  }
  // strands: soft diagonal waves, darker in the grooves
  b.paint('head', fn((x, y, z) => Math.abs(((x * 0.8 + y * 0.35 + Math.sin(z * 0.6) * 0.8 + 40) % 2.4) - 1.2) - 0.32, [-9, c - 2, -12], [9, c + 15, 9]), 'hair', { shade: 4, where: b.isMat('hair') });
  b.carve('head', aabb([-5, c + 4, front], [-1, c + 7, front + 6]));
  b.carve('head', aabb([1, c + 4, front], [5, c + 7, front + 6]));
}

/**
 * The reveal: everything combed straight back over the crown to a full, smooth mass behind the head and
 * down to the nape, the sides swept back above the ears, a single strand falling over the forehead.
 */
function slickedHair(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): void {
  const s = L.spec;
  const c = hd.chin, front = hd.front;
  const back = L.headC[2] - s.head.d / 2;
  spikeHair(b, L, 'hair', [
    { az: 0, el: 58, len: 1.4, r: 4.8, flat: 0.36, flow: [0, 0.1, -1.4], bend: [0, -0.15, -0.3] },
    { az: -40, el: 50, len: 1.3, r: 4.6, flat: 0.36, flow: [-0.05, 0, -1.3], bend: [0, -0.15, -0.3] },
    { az: 40, el: 50, len: 1.3, r: 4.6, flat: 0.36, flow: [0.05, 0, -1.3], bend: [0, -0.15, -0.3] },
    { az: -85, el: 32, len: 1, r: 3.8, flat: 0.36, flow: [0, 0.1, -1.2] },
    { az: 85, el: 32, len: 1, r: 3.8, flat: 0.36, flow: [0, 0.1, -1.2] },
  ], [], { tufts: 0, hairline: c + s.head.h - 0.5, slope: 0.85 });
  // the mass behind: combed back, full at the crown, tapering to the nape with the ends flicked up
  b.add('head', blend(1.8,
    ellipsoid([0, c + 8.2, back + 0.6], [6.2, 5.6, 4.6]),
    ellipsoid([0, c + 3.6, back + 0.4], [5.4, 3.6, 3.4]),
    capsule([0, c + 1.4, back - 0.4], [0, c + 0.8, back - 2.6], 3.2, 2.6)), 'hair');
  // grooves combed straight back
  b.paint('head', fn((x) => Math.abs(((x + 40) % 2) - 1) - 0.32, [-9, c, -14], [9, c + 16, 9]), 'hair', { shade: 4, where: b.isMat('hair') });
  // the strand: from the hairline, curling down over the forehead to the brow
  const pts = smoothPath([[0.6, c + 12.2, front - 1.4], [0.4, c + 11, front + 0.3], [1.4, c + 9.4, front + 0.8], [0.8, c + 8, front + 0.6]], 4);
  b.add('head', tube(pts, pts.map((_, j) => 0.9 - j * 0.03)), 'hair', { thr: 0.3 });
  b.carve('head', aabb([-5, c + 4, front], [-1, c + 7, front + 6]));
  b.carve('head', aabb([1, c + 4, front], [5, c + 7, front + 6]));
}

// ---------------------------------------------------------------------------------------------- TYBW

/**
 * TYBW, the Muken prisoner: a uniform of wide horizontal black leather bands — a fitted jacket closing at the front with
 * a white-trimmed crossing edge, flaring into a tunic below the knee; fitted sleeves with white cuffs; trousers and boots
 * of the same — a grey neckcloth over the shoulders like a capelet, a leather band across the right eye, the hair grown
 * long and loose down the back.
 */
function prisoner(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }): CharacterAsset {
  const s = L.spec;
  const c = hd.chin;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  const [hx, hy, hz] = s.hip;
  const [kx, ky, kz] = L.knee;
  const [ax, ay, az] = L.ankle;
  b.stamp('head', hd.x0, c + 9, FACE_TRAITOR, {
    B: { mat: 'brow' }, L: { mat: 'lid' }, W: { mat: 'sclera' }, I: { mat: 'iris' }, i: { mat: 'irisD' }, s: { mat: 'skin', shade: 3 }, m: { mat: 'mouth' },
  }, hd.front - 1);
  b.voxel('head', 0, c + 3, hd.front, 'skin', 1);
  curtainHair(b, L, hd);
  const springs = longHair(b, L, hd);
  // his back is slim: colliders that hug it, so the hair rests on it instead of being shoved off
  const hair = { springs, colliders: [{ bone: 'chest', offset: [0, 0.07, 0.0] as const, radius: 0.115 }, { bone: 'spine', offset: [0, 0.02, 0.0] as const, radius: 0.105 }] };
  eyeBand(b, L, hd);
  hands(b, L, 'skin');
  // the jacket: the crossing front edge is the white trim, the V filled with leather
  const o = { black: 'leather', collar: 'trim', skin: 'leather', obi: 'leather' };
  const torso = kosodeTorso(b, L, o);
  // fitted sleeves, white cuffs
  b.add('upperarm.L', blend(1.2, sphere([sx, sy - 0.5, sz], 3.4), capsule([sx, sy - 1, sz], [sx, ey, sz], 3.1, 2.9)), 'leather', { mirror: true });
  b.add('forearm.L', blend(1, sphere([sx, ey, sz], 2.9), capsule([sx, ey, sz], [sx, wy + 1.2, sz], 2.85, 2.45)), 'leather', { mirror: true });
  b.paint('forearm.L', cylinder([sx, wy + 0.2, sz], [sx, wy + 1.9, sz], 3.3), 'trim', { mirror: true, where: b.isMat('leather') });
  // trousers and boots
  b.add('hips', box([0, s.hipsY - 0.5, -0.3], [s.hips[0] + 0.8, 3.8, s.hips[1] + 0.8], { round: 2.6 }), 'leather');
  b.add('thigh.L', blend(1.4, sphere([hx, hy, hz], 4.6), capsule([hx, hy, hz], [kx, ky + 1, kz], 4.6, 3.8)), 'leather', { mirror: true });
  b.add('shin.L', blend(1.2, sphere([kx, ky, kz], 3.8), capsule([kx, ky, kz], [ax, ay + 2, az], 3.6, 3.1)), 'leather', { mirror: true });
  b.add('foot.L', capsule([ax, ay + 5, az - 0.4], [ax, ay - 1, az - 0.4], 2.9, 2.8), 'leather', { mirror: true });
  b.add('foot.L', intersect(box([ax, 2.2, az + 3], [2.8, 2.2, 6.3], { round: 1.6 }), halfSpace([0, 5.2, az + 6.5], [0, 1, 0.6])), 'leather', { mirror: true });
  b.paint('foot.L', aabb([ax - 5, 0, az - 8], [ax + 5, 1, az + 12]), 'leatherIn', { mirror: true });
  // the tunic below the jacket, to below the knee
  const yHem = ky - 6;
  const skirt = coatSkirt(b, L, { mat: 'leather', lining: 'leatherIn', yTop: s.waistY - 2, yHem, r0: s.hips[0] + 2.4, r1: 12.6, openFront: 9, res: AIZEN_RES });
  // the bands: a seam every 2.6 voxels over everything leather, and white trim along the tunic's hem
  const all = b.bones.map((x) => x.name);
  b.paint(all, fn((_x, y) => Math.abs(((((y + 100) % 2.6) + 2.6) % 2.6) - 1.3) - 0.26, [-40, -2, -40], [40, 100, 40]), 'leather', { shade: 3, where: b.isMat('leather') });
  b.paint(all.filter((n) => n.startsWith('coat')), fn((_x, y) => y - (yHem + 1.1), [-40, yHem - 6, -40], [40, yHem + 4, 40]), 'trim', { where: b.isMat('leather') });
  capelet(b, L, torso);
  b.autoShade();
  b.lint();
  return {
    model: b.build(),
    springs: [...skirt.springs, ...hair.springs],
    colliders: [...skirt.colliders, ...hair.colliders],
    warnings: b.warnings,
  };
}

/**
 * The hair grown long in Muken: a rounded mass from the back of the head, narrowing at the nape and spreading over the
 * shoulder blades, ridged into five locks that part near the ends and taper to points (the middle one longest).
 * Three spring bones down its length.
 */
function longHair(b: ModelBuilder, L: Landmarks, hd: { chin: number }): SpringDef[] {
  const s = L.spec;
  const c = hd.chin;
  const hw = s.head.w / 2;
  const back = L.headC[2] - s.head.d / 2;
  const yTop = c + 9, yBot = s.chestY - 10, yCore = yBot + 5;
  const tOf = (y: number) => Math.max(0, Math.min(1, (yTop - y) / (yTop - yBot)));
  // lying on the back: out over the nape, then down the shoulder blades
  const zc = (y: number) => {
    const t = tOf(y);
    return back - 0.5 - Math.sin(Math.min(1, t * 2.4) * Math.PI * 0.5) * 2.7 + t * 0.7;
  };
  const width = (y: number) => {
    const t = tOf(y);
    return t < 0.2 ? hw + 1.3 - (t / 0.2) * 1.8 : hw - 0.5 + ((t - 0.2) / 0.8) * 1.4;
  };
  const thick = (y: number) => 2.5 - tOf(y) * 0.7;
  const LOCKS = [
    { k: -1, tip: 2.4, dz: 0.2 },
    { k: -0.5, tip: 0.8, dz: -0.1 },
    { k: 0, tip: -1.4, dz: 0 },
    { k: 0.5, tip: 0.4, dz: -0.2 },
    { k: 1, tip: 2.8, dz: 0.1 },
  ];
  const lockX = (k: number, y: number) => k * width(y) * 0.76 * (1 + Math.max(0, (yCore + 4 - y) / 10) * 0.25);
  const hair = fn((x, y, z) => {
    if (y > yTop) return y - yTop;
    const w = width(y), th = thick(y), z0 = zc(y);
    // the core: thinner than the locks so they stand out as ridges; it stops above the parted ends
    const core = Math.max((Math.hypot(x / (w * 0.92), (z - z0) / (th * 0.72)) - 1) * Math.min(w, th * 0.72), yCore - y);
    let d = core;
    for (const l of LOCKS) {
      const tipY = yBot + l.tip;
      const u = (y - tipY) / (yCore + 3 - tipY);
      if (u <= 0) continue;
      const taper = Math.sqrt(Math.min(1, u));
      const rx = w * 0.3 * taper + 0.35, rz = th * taper + 0.3;
      d = Math.min(d, (Math.hypot((x - lockX(l.k, y)) / rx, (z - z0 - l.dz) / rz) - 1) * Math.min(rx, rz));
    }
    return d;
  }, [-16, yBot - 3, back - 14], [16, yTop + 1, back + 3]);
  const ySplit1 = s.chestY + 6, ySplit2 = s.chestY - 2;
  const p1: V3 = [0, c + 6, back - 1], p2: V3 = [0, ySplit1, zc(ySplit1)], p3: V3 = [0, ySplit2, zc(ySplit2)];
  // each segment reaches up under the one above it, so a swing never opens a step between them
  const bones: [string, string, V3, number, number][] = [['hair1', 'head', p1, p2[1] - 0.5, 300], ['hair2', 'hair1', p2, p3[1] - 0.5, p2[1] + 2.5], ['hair3', 'hair2', p3, -100, p3[1] + 2.5]];
  for (const [name, parent, pivot, y0, y1] of bones) {
    b.bone(name, parent, pivot);
    b.add(name, intersect(hair, aabb([-24, y0, -40], [24, y1, 10])), 'hair', { thr: 0.25 });
  }
  // the partings between the locks, darker
  b.paint(['hair1', 'hair2', 'hair3'], fn((x, y) => {
    let g = 99;
    for (let i = 0; i < LOCKS.length - 1; i++) g = Math.min(g, Math.abs(x - (lockX(LOCKS[i].k, y) + lockX(LOCKS[i + 1].k, y)) / 2));
    return g - 0.45;
  }, [-16, yBot - 3, back - 14], [16, yTop - 3, back + 3]), 'hair', { shade: 4, where: b.isMat('hair') });
  const R = AIZEN_RES;
  const tip: V3 = [0, yBot, zc(yBot)];
  return [
    { bone: 'hair1', tail: [(p2[0] - p1[0]) / R, (p2[1] - p1[1]) / R, (p2[2] - p1[2]) / R], stiffness: 52, damping: 5.5, gravity: 10, limit: 30, radius: 0.05 },
    { bone: 'hair2', tail: [(p3[0] - p2[0]) / R, (p3[1] - p2[1]) / R, (p3[2] - p2[2]) / R], stiffness: 40, damping: 5, gravity: 11, limit: 40, radius: 0.05 },
    { bone: 'hair3', tail: [(tip[0] - p3[0]) / R, (tip[1] - p3[1]) / R, (tip[2] - p3[2]) / R], stiffness: 30, damping: 4.5, gravity: 12, limit: 50, radius: 0.045 },
  ];
}

/** A leather band round the head, slanting from over the right eye up across the forehead above the left brow. */
function eyeBand(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): void {
  const s = L.spec;
  const c = hd.chin;
  const C: V3 = [0, c + 6, L.headC[2]];
  const R: V3 = [s.head.w / 2 + 1, s.head.h / 2 + 1, s.head.d / 2 + 1];
  const mid = (x: number) => c + 7.4 + 0.72 * x;
  const e = (x: number, y: number, z: number) => Math.hypot((x - C[0]) / R[0], (y - C[1]) / R[1], (z - C[2]) / R[2]);
  b.add('head', fn((x, y, z) => Math.max(Math.abs(e(x, y, z) - 0.94) * 7 - 1.25, Math.abs(y - mid(x)) - 1.75), [-10, c - 2, -12], [10, c + 18, 10]), 'leather', { thr: 0.25 });
}

/** The grey neckcloth: a short cloth over the shoulders, its hem falling in soft folds over the upper chest and back. */
function capelet(b: ModelBuilder, L: Landmarks, torso: Sdf): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const hem = (x: number, z: number) => s.chestY + 4.2 - Math.abs(x) * 0.12 + Math.sin(Math.atan2(z, x) * 5) * 0.6;
  const body = blend(2, torso, sphere([sx, sy - 0.5, sz], 3.5), sphere([-sx, sy - 0.5, sz], 3.5));
  const shell = subtract(offset(body, 1.25), offset(body, 0.2));
  b.add('chest', intersect(shell, fn((x, y, z) => Math.max(hem(x, z) - y, y - (sy + 2.6)), [-24, s.chestY - 2, -16], [24, sy + 5, 16])), 'cape');
  // folds
  for (const [x, z] of [[4, 6], [-4, 6], [7.5, 2.5], [-7.5, 2.5], [3, -6.5], [-3, -6.5]] as [number, number][])
    b.paint('chest', capsule([x, sy + 1, z], [x * 1.08, s.chestY + 3.6, z * 1.08], 0.6), 'cape', { shade: 3, where: b.isMat('cape') });
}

// ---------------------------------------------------------------------------------------------- haori

/** Long-sleeved haori: wide sleeves to the wrist, turquoise lining at the cuffs and front, 五 on the back. */
function haori(b: ModelBuilder, L: Landmarks, torso: Sdf): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  const opening = intersect(
    prism([[-2.4, 80], [2.4, 80], [4.2, 64], [5.6, 52], [6.2, 40], [-6.2, 40], [-5.6, 52], [-4.2, 64]], [0, 0, 0], [1, 0, 0], [0, 1, 0], 30),
    halfSpace([0, 0, 1], [0, 0, -1]),
  );
  const neckCut = fn((x, y, z) => y - (sy + 3.2 - Math.max(0, 3.2 - Math.hypot(x, z + 1) * 0.55)), [-30, 40, -30], [30, 90, 30]);
  const shell = subtract(intersect(offset(torso, 1.5), neckCut), offset(torso, 0.25), opening);
  for (const [bone, y0, y1] of [['spine', 46, 56], ['chest', 54, 80]] as [string, number, number][]) b.add(bone, intersect(shell, aabb([-30, y0, -30], [30, y1, 30])), 'haori');
  b.paint(['chest', 'spine'], intersect(offset(opening, 1.0), halfSpace([0, 0, 1], [0, 0, -1])), 'haoriIn', { where: b.isMat('haori') });
  // long wide sleeves over the kosode's, turquoise at the mouth
  b.add('upperarm.L', blend(1.2, sphere([sx, sy - 0.8, sz], 4.2), cylinder([sx + 0.4, ey - 1, sz - 0.4], [sx + 0.2, sy - 0.5, sz - 0.2], 5.0, 4.0, 1.2)), 'haori', { mirror: true });
  b.add('forearm.L', blend(1.2, sphere([sx + 0.4, ey, sz - 0.3], 4.6), cylinder([sx + 0.9, wy - 0.6, sz - 0.8], [sx + 0.6, ey + 1.5, sz - 0.4], 5.6, 4.8, 1.2)), 'haori', { mirror: true });
  b.carve('forearm.L', cylinder([sx + 0.9, wy - 1.6, sz - 0.8], [sx + 0.9, wy + 3, sz - 0.8], 4.4, 4.2), { mirror: true });
  b.paint('forearm.L', cylinder([sx + 0.9, wy - 1.6, sz - 0.8], [sx + 0.9, wy + 1.2, sz - 0.8], 6.2), 'haoriIn', { mirror: true, where: b.isMat('haori') });
  b.add('forearm.L', capsule([sx, wy + 6, sz], [sx, wy - 0.5, sz], 1.9), 'skin', { mirror: true, only: 'empty' });
  b.paint('forearm.L', capsule([sx + 5.4, ey - 1, sz + 2], [sx + 5.6, wy + 3, sz - 1], 0.6), 'haori', { shade: 3, mirror: true });
  // the haori sleeve hangs in a deep bag behind the forearm (the kosode's black bag stays hidden inside)
  b.carve(['sleeve.L', 'sleeve.R'], aabb([-60, 0, -60], [60, 100, 60]));
  const bz = sz - 6.4;
  b.add('sleeve.L', blend(1.6,
    box([sx + 0.8, (ey + wy) / 2 - 1.6, bz], [4.0, (ey - wy) / 2 + 0.8, 3.4], { round: 1.6 }),
    ellipsoid([sx + 0.8, wy - 2.2, bz + 0.4], [3.9, 3.8, 3.6])), 'haori', { mirror: true });
  b.paint('sleeve.L', box([sx + 0.8, wy - 4.6, bz + 0.4], [4.4, 1.2, 4]), 'haoriIn', { mirror: true, where: b.isMat('haori') });
  for (const dz of [-1.8, 1.2]) b.paint('sleeve.L', capsule([sx + 4.6, ey - 2, bz + dz], [sx + 4.5, wy - 3, bz + dz * 1.3], 0.55), 'haori', { shade: 3, mirror: true });
  // 五 on the back
  const GO = [
    'XXXXXXXXX',
    '...X.....',
    '...X.....',
    '..XXXXXX.',
    '..X....X.',
    '..X....X.',
    '.X.....X.',
    '.X.....X.',
    'XXXXXXXXX',
  ];
  const g = b.grid('chest');
  GO.forEach((row, r) => {
    for (let ci = 0; ci < row.length; ci++) {
      if (row[ci] !== 'X') continue;
      const x = 4 - ci, y = s.chestY + 5 - r;
      for (let z = -16; z < 2; z++)
        if (g.get(x, y, z) !== 0) {
          b.voxel('chest', x, y, z, 'kanji', 0);
          break;
        }
    }
  });
  return coatSkirt(b, L, { mat: 'haori', lining: 'haoriIn', yTop: s.waistY - 2, yHem: 11, r0: 9.6, r1: 13.2, openFront: 16, res: AIZEN_RES });
}

// ---------------------------------------------------------------------------------------------- Chrysalis

/** The Hōgyoku chrysalis: white shell, violet eyes and veins, four tails, heeled feet, the fused blade. */
function chrysalis(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }): CharacterAsset {
  const s = L.spec;
  const R = AIZEN_RES;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  const [hx, hipY] = s.hip;
  const ky = L.knee[1], ay = L.ankle[1];
  const c = hd.chin;
  // the head: a smooth casing over the skull, a crest running back, the eyes left open
  b.paint('head', aabb([-20, c - 10, -20], [20, c + 30, 20]), 'shell');
  b.add('head', intersect(ellipsoid([0, c + 7.5, -1.2], [6.2, 7.2, 6.8]), halfSpace([0, c + 1.5, 0], [0, -1, 0])), 'shell');
  b.add('head', spike([0, c + 12, -2], [0, 0.3, -1], 9, 1.6, 0.9, { side: [1, 0, 0], tip: 0.3 }), 'shell', { thr: 0.25 });
  // a raised crest from the brow over the crown to the nape, and a heavy brow ledge over the eyes
  b.add('head', tube(smoothPath([[0, c + 11.5, hd.front - 1.2], [0, c + 14.4, -0.6], [0, c + 12.6, -6.2], [0, c + 8.6, -8.2]], 4), [1.2, 1.15, 1.1, 1, 0.9, 0.85, 0.8, 0.7, 0.6, 0.5, 0.45, 0.4, 0.35]), 'shell', { thr: 0.3 });
  b.carve('head', aabb([-20, c - 4, hd.front], [20, c + 20, hd.front + 8]));
  b.add('head', capsule([-4.6, c + 7.4, hd.front - 0.5], [4.6, c + 7.4, hd.front - 0.5], 0.75), 'shell', { thr: 0.2 });
  b.stamp('head', hd.x0, hd.chin + 9, [
    '. . . . . . . . . .',
    '. . . . . . . . . .',
    '. . . . . . . . . .',
    '. . . . . . . . . .',
    '. E E E . . E E E .',
    '. . E E . . E E . .',
    '. . . . . . . . . .',
    '. . . . . . . . . .',
    '. . . . . . . . . .',
    '. . . . . . . . . .',
  ], { E: { mat: 'voidEye' } }, hd.front - 1);
  // a slim shelled body, shoulders capped
  const torso = blend(3,
    box([0, s.chestY - 0.5, -0.3], [s.chest[0] - 0.4, 6, s.chest[1] - 0.2], { round: 3.2 }),
    box([0, s.waistY, -0.2], [s.waist[0] - 0.4, 4.6, s.waist[1] - 0.2], { round: 2.8 }),
    box([0, s.hipsY + 0.5, -0.3], [s.hips[0] - 0.2, 3.6, s.hips[1]], { round: 2.4 }),
    capsule([2.4, sy + 1.4, sz - 0.8], [sx - 1.5, sy - 0.2, sz], 2.8, 3),
    capsule([-2.4, sy + 1.4, sz - 0.8], [-sx + 1.5, sy - 0.2, sz], 2.8, 3),
    sphere([sx, sy - 0.5, sz], 3.4), sphere([-sx, sy - 0.5, sz], 3.4),
    capsule([0, s.chinY - 6, -1], [0, s.chinY + 1, -1], 2.6));
  addBands(b, torso, 'shell', [['hips', 36, 45], ['spine', 45, 56], ['chest', 54, 80]]);
  b.paint('neck', aabb([-10, 50, -10], [10, 90, 10]), 'shell');
  // the Hōgyoku below the chest, four violet lines crossing out from it, one climbing to the face
  const oy = s.chestY - 4;
  // a line on the front of the body: within r of the segment (a → b) in x/y, at any depth in front of z0
  const lineXY = (a: [number, number], q: [number, number], r: number, z0: number) => fn((x, y, z) => {
    const dx = q[0] - a[0], dy = q[1] - a[1];
    const u = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy)));
    return Math.max(Math.hypot(x - a[0] - dx * u, y - a[1] - dy * u) - r, z0 - z);
  }, [Math.min(a[0], q[0]) - r - 1, Math.min(a[1], q[1]) - r - 1, z0 - 1], [Math.max(a[0], q[0]) + r + 1, Math.max(a[1], q[1]) + r + 1, 20]);
  // the socket the orb sits in, then the orb
  b.paint('chest', sphere([0, oy, s.chest[1] + 0.4], 2.6), 'tailIn', { where: b.isMat('shell') });
  b.add('chest', sphere([0, oy, s.chest[1] + 0.4], 1.6), 'orb');
  for (const [dx, dy] of [[1, 0.25], [-1, 0.25], [0.35, -1], [-0.35, -1]] as [number, number][])
    b.paint(['chest', 'spine', 'hips'], lineXY([dx * 2.2, oy + dy * 2.2], [dx * 9.5, oy + dy * 9.5], 0.7, 1), 'vein', { where: b.isMat('shell') });
  b.paint(['chest', 'neck'], lineXY([0, oy + 2.4], [0, s.chinY - 1], 0.45, 1), 'vein', { where: b.isMat('shell') });
  b.paint('head', lineXY([0, c + 8.2], [0, c + 12.5], 0.45, hd.front - 3), 'vein', { where: b.isMat('shell') });
  // arms: smooth shell; the right forearm grows into a white blade
  b.add('upperarm.L', blend(1.4, sphere([sx, sy - 0.5, sz], 3.0), capsule([sx, sy - 1, sz], [sx, ey + 1, sz], 2.6, 2.3)), 'shell', { mirror: true });
  b.add('forearm.L', blend(1.2, sphere([sx, ey, sz], 2.4), capsule([sx, ey - 0.5, sz], [sx, wy + 1, sz], 2.3, 1.8)), 'shell', { mirror: true });
  hands(b, L, 'shell');
  // legs: slim shell, heeled feet
  b.add('thigh.L', blend(1.5, sphere([hx, hipY, 0], 4.2), capsule([hx, hipY, 0], [hx, ky + 1, 0], 3.7, 2.9)), 'shell', { mirror: true });
  b.add('shin.L', blend(1.2, sphere([hx, ky, 0], 2.9), capsule([hx, ky, 0], [hx, ay + 2, 0], 2.8, 2.1)), 'shell', { mirror: true });
  b.add('foot.L', blend(1.2, capsule([hx, ay + 3, -0.4], [hx, ay - 1, 0.3], 2.2, 2.3), intersect(box([hx, 2, 3.4], [2.3, 2, 4.4], { round: 1.5 }), halfSpace([0, 4.4, 7], [0, 1, 0.5]))), 'shell', { mirror: true });
  b.add('foot.L', spike([hx, 1.6, -1.6], [0, -1, -0.15], 2.4, 0.8, 0.8, { tip: 0.4 }), 'shell', { mirror: true, thr: 0.3 });
  // the four tails: from the waist, long, on two-bone spring chains, dark violet inside
  const springs: SpringDef[] = [];
  const tails: [string, number][] = [['F.L', 32], ['B.L', 150], ['B.R', -150], ['F.R', -32]];
  for (const [name, azd] of tails) {
    const az = (azd * Math.PI) / 180;
    const d: V3 = [Math.sin(az), 0, Math.cos(az)];
    const p0: V3 = [d[0] * (s.waist[0] + 0.5), s.waistY - 3, d[2] * (s.waist[1] + 0.5) - 0.3];
    const p1: V3 = [d[0] * 10, 24, d[2] * 9 - 0.3];
    const p2: V3 = [d[0] * 13, 4, d[2] * 12 - 0.3];
    const top = `tail.${name}`, low = `tail.${name}.2`;
    b.bone(top, 'hips', p0);
    b.bone(low, top, p1);
    const blade = (a: V3, q: V3, w0: number, w1: number) => fn((x, y, z) => {
      const dx = q[0] - a[0], dy = q[1] - a[1], dz = q[2] - a[2];
      const l2 = dx * dx + dy * dy + dz * dz;
      const u = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy + (z - a[2]) * dz) / l2));
      const cx = a[0] + dx * u, cy = a[1] + dy * u, cz = a[2] + dz * u;
      const w = w0 + (w1 - w0) * u;
      // a curved strip: wide across (tangent to the waist), thin through
      const ox = x - cx, oy2 = y - cy, oz = z - cz;
      const across = Math.abs(ox * d[2] - oz * d[0]);
      const through = Math.abs(ox * d[0] + oz * d[2]);
      return Math.max(across - w, through - 0.9, Math.abs(oy2) - 1.2);
    }, [Math.min(a[0], q[0]) - 6, Math.min(a[1], q[1]) - 2, Math.min(a[2], q[2]) - 6], [Math.max(a[0], q[0]) + 6, Math.max(a[1], q[1]) + 2, Math.max(a[2], q[2]) + 6]);
    b.add(top, blade(p0, p1, 3.2, 3.8), 'shell', { thr: 0.3 });
    b.add(low, blade(p1, p2, 3.8, 1.2), 'shell', { thr: 0.3 });
    b.add(low, spike(p2, [d[0] * 0.3, -1, d[2] * 0.3], 3, 1.2, 0.8, { tip: 0.3 }), 'shell', { thr: 0.3 });
    // the inner face of each tail (the half toward the body) is dark violet; outside they stay white
    const rad = (p: V3) => p[0] * d[0] + (p[2] + 0.3) * d[2];
    const r0 = rad(p0), r1 = rad(p1), r2 = rad(p2);
    const rc = (y: number) => (y >= p1[1] ? r1 + (r0 - r1) * Math.min(1, (y - p1[1]) / (p0[1] - p1[1])) : r2 + (r1 - r2) * Math.max(0, (y - p2[1]) / (p1[1] - p2[1])));
    const inner = fn((x, y, z) => x * d[0] + (z + 0.3) * d[2] - (rc(y) - 0.25), [-24, 0, -24], [24, 60, 24]);
    b.paint([top, low], inner, 'tailIn', { where: b.isMat('shell') });
    springs.push({ bone: top, tail: [(p1[0] - p0[0]) / R, (p1[1] - p0[1]) / R, (p1[2] - p0[2]) / R], stiffness: 80, damping: 5.5, gravity: 9, limit: 40, radius: 0.08 });
    springs.push({ bone: low, tail: [(p2[0] - p1[0]) / R, (p2[1] - p1[1]) / R, (p2[2] - p1[2]) / R], stiffness: 50, damping: 4.5, gravity: 12, limit: 55, radius: 0.06 });
  }
  b.autoShade();
  b.lint();
  const colliders: ColliderDef[] = [
    { bone: 'thigh.L', offset: [0, -0.18, 0.02], radius: 0.14 },
    { bone: 'thigh.R', offset: [0, -0.18, 0.02], radius: 0.14 },
    { bone: 'shin.L', offset: [0, -0.12, 0], radius: 0.1 },
    { bone: 'shin.R', offset: [0, -0.12, 0], radius: 0.1 },
  ];
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- props

/**
 * Kyōka Suigetsu: a plain katana with a hexagonal gold guard, green wrap with rayskin in the diamond
 * gaps and a gold pommel. Local frame: origin at the grip, blade along +Z, edge toward −Y.
 */
function buildKyoka(): VoxelModel {
  const b = new ModelBuilder('kyoka-suigetsu', 48);
  b.mat('steel', ['#EEF2F6', '#D9DEE4', '#B2B9C1'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#F3F3F0'], { rough: 0.12, metal: 0.8 });
  b.mat('gold', ['#E6C46A', '#C8A23C', '#9C7A24', '#6E541A'], { base: 1, rough: 0.3, metal: 0.85, shadeK: 0.8 });
  b.mat('wrap', ['#3E8A54', '#2E6B3E', '#20502D'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#EDE6D3']);
  b.bone('root', null, [0, 0, 0]);
  const z0 = 6.5, zEnd = 38, zTip = 41;
  const curve = (z: number) => ((z - z0) / (zTip - z0)) ** 2 * 1.6;
  b.add('root', fn((x, y, z) => {
    if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
    const cv = curve(z);
    const top = 0.85 + cv, bot = -1.0 + cv + Math.max(0, z - zEnd) * 0.6;
    return Math.max(Math.abs(x) - 0.5, y - top, bot - y, z0 - z, z - zTip);
  }, [-2, -3, z0 - 1], [2, 5, zTip + 1]), 'steel', { thr: 0.3 });
  b.paint('root', fn((x, y, z) => y - (-0.6 + curve(z) + Math.max(0, z - zEnd) * 0.6), [-2, -3, 0], [2, 5, zTip + 1]), 'edge');
  // hexagonal tsuba
  const hex: [number, number][] = [];
  for (let i = 0; i < 6; i++) hex.push([Math.cos((i / 6) * Math.PI * 2) * 2.9, Math.sin((i / 6) * Math.PI * 2) * 2.9]);
  b.add('root', prism(hex, [0, 0, 5.3], [1, 0, 0], [0, 1, 0], 0.55), 'gold');
  b.add('root', box([0, -0.05, 6.2], [0.85, 1.25, 0.5]), 'gold');
  b.add('root', box([0, 0, -0.6], [1.1, 1.25, 5.6], { round: 0.5 }), 'wrap');
  b.paint('root', fn((x, y, z) => Math.abs(((Math.abs(y) + z) % 2.6 + 2.6) % 2.6 - 1.3) - 0.45, [-2, -2, -6.5], [2, 2, 5]), 'ray', { where: b.isMat('wrap') });
  b.add('root', box([0, 0, -6.6], [1.25, 1.4, 0.55], { round: 0.35 }), 'gold');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** Green saya (manga). Origin at the mouth, along +Z. */
function buildSheath(withSword: boolean): VoxelModel {
  const b = new ModelBuilder(withSword ? 'kyoka-sheath-full' : 'kyoka-sheath', 48);
  b.mat('lacquer', ['#3E7A4A', '#2E5A36', '#20422A', '#16301E'], { base: 1, rough: 0.3, shadeK: 0.8 });
  b.mat('gold', ['#E6C46A', '#C8A23C', '#9C7A24'], { base: 1, rough: 0.3, metal: 0.85 });
  b.mat('wrap', ['#3E8A54', '#2E6B3E', '#20502D'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#EDE6D3']);
  b.bone('root', null, [0, 0, 0]);
  const curve = (z: number) => (z / 36) ** 2 * 1.6;
  b.add('root', fn((x, y, z) => Math.max(Math.hypot(x, (y - curve(Math.max(0, z))) / 1.6) - 1, -z, z - 35.5), [-2, -3, -1], [2, 5, 37]), 'lacquer');
  b.add('root', box([0, 0, 0.4], [1.3, 1.9, 0.6], { round: 0.3 }), 'gold');
  b.add('root', box([0, curve(35), 35.2], [1.15, 1.8, 0.6], { round: 0.4 }), 'gold');
  if (withSword) {
    const hex: [number, number][] = [];
    for (let i = 0; i < 6; i++) hex.push([Math.cos((i / 6) * Math.PI * 2) * 2.9, Math.sin((i / 6) * Math.PI * 2) * 2.9]);
    b.add('root', prism(hex, [0, 0, -1.1], [1, 0, 0], [0, 1, 0], 0.55), 'gold');
    b.add('root', box([0, 0, -7.4], [1.1, 1.25, 5.6], { round: 0.5 }), 'wrap');
    b.paint('root', fn((x, y, z) => Math.abs(((Math.abs(y) + z) % 2.6 + 2.6) % 2.6 - 1.3) - 0.45, [-2, -2, -13.5], [2, 2, -1.6]), 'ray', { where: b.isMat('wrap') });
    b.add('root', box([0, 0, -13.4], [1.25, 1.4, 0.55], { round: 0.35 }), 'gold');
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * The glasses, on the head's lattice: origin at the 'glasses' socket (the face plate, eye row), +Z out
 * of the face. Two square black frames standing one voxel off the face, a bridge, arms back to the ears.
 */
function buildGlasses(): VoxelModel {
  // twice the head's density: the frames are half a head-voxel thick (coordinates below are fine voxels)
  const b = new ModelBuilder('aizen-glasses', AIZEN_RES * 2);
  b.mat('frame', ['#3A3A40', '#2A2A2F', '#1C1C20'], { base: 1, rough: 0.3, metal: 0.4 });
  b.bone('root', null, [0, 0, 0]);
  for (const k of [-1, 1]) {
    const cx = k * 5;
    // a rectangle round each eye: the opening frames the eye block, the top bar sits under the brows
    b.add('root', subtract(aabb([cx - 4, -3, 0], [cx + 4, 5, 1]), aabb([cx - 3, -2, -1], [cx + 3, 4, 2])), 'frame');
    // the hinge at the outer corner and the arm back along the side of the head to the ear
    b.add('root', aabb([k > 0 ? 8 : -11, 3, 0], [k > 0 ? 11 : -8, 4, 1]), 'frame');
    b.add('root', aabb([k > 0 ? 10 : -11, 3, -12], [k > 0 ? 11 : -10, 4, 1]), 'frame');
  }
  b.add('root', aabb([-1, 3, 0], [1, 4, 1]), 'frame');
  b.lint(2);
  return b.build();
}

/**
 * Chrysalis: the blade grown out of the right forearm — seamless white shell with a violet edge line.
 * Same frame as the katana (origin at the grip, along +Z, edge −Y); attached turned down the arm.
 */
function buildFusedBlade(): VoxelModel {
  const b = new ModelBuilder('aizen-fused-blade', 48);
  b.mat('shell', ['#F3F3F0', '#F2F0EA', '#E2DFD6', '#CBC7BC'], { base: 1, rough: 0.3, shadeK: 0.9 });
  b.mat('vein', ['#B57DFF', '#9B4DFF'], { base: 1, rough: 0.3, glow: 1.4 });
  b.bone('root', null, [0, 0, 0]);
  const zEnd = 40, zTip = 44;
  const curve = (z: number) => (Math.max(0, z) / zTip) ** 2 * 1.4;
  b.add('root', fn((x, y, z) => {
    if (z < -3 || z > zTip + 0.5) return 1;
    const c = curve(z);
    const w = z < 3 ? 1.6 + (3 - z) * 0.25 : 1.2;
    const top = w + c, bot = -w - 0.3 + c + Math.max(0, z - zEnd) * 0.7;
    return Math.max(Math.abs(x) - (z < 3 ? 1.3 : 0.6), y - top, bot - y, -3 - z, z - zTip);
  }, [-3, -4, -4], [3, 5, zTip + 1]), 'shell', { thr: 0.3 });
  b.paint('root', fn((x, y, z) => Math.abs(y - (curve(z) - 0.2)) - 0.35 + (z < 4 ? 9 : 0), [-3, -4, 0], [3, 5, zTip + 1]), 'vein', { where: b.isMat('shell') });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

// ---------------------------------------------------------------------------------------------- TYBW props

/**
 * The restraint chair that confines his reiatsu (not described in canon: estimated) — a heavy high-backed seat of dark
 * iron on a square plinth, broad armrests, pale seal glyphs down the back, leather straps with white trim over the
 * armrests and the front of the seat. 24 vox/m; origin on the ground under his hips, +Z forward.
 */
function buildChair(): VoxelModel {
  const b = new ModelBuilder('aizen-chair', 24);
  b.mat('iron', ['#4A4A52', '#3A3A41', '#2B2B30', '#222226', '#1A1A1E'], { base: 2, rough: 0.45, metal: 0.6, shadeK: 0.85 });
  b.mat('glyph', ['#E2DCC0', '#D8D2B0', '#B8B090'], { base: 1, rough: 0.5, glow: 0.25 });
  b.mat('strap', ['#2C2C31', '#1E1E22', '#141418'], { base: 1, rough: 0.45 });
  b.mat('trim', ['#F0F0EE', '#D8D8D6'], { base: 0, rough: 0.6 });
  b.bone('root', null, [0, 0, 0]);
  const zb = -4.6; // the backrest's front face
  // plinth and seat (top at 12.5 vox = 0.52 m)
  b.add('root', box([0, 2, 2], [8.6, 2, 9], { round: 0.6 }), 'iron');
  b.add('root', box([0, 7.5, 2], [6.6, 3.6, 6.6], { round: 0.8 }), 'iron');
  b.add('root', box([0, 11.6, 2.1], [7.2, 0.9, 7], { round: 0.6 }), 'iron');
  // the high back with a headrest
  b.add('root', box([0, 24.5, zb - 1], [7.4, 12.6, 1.9], { round: 0.8 }), 'iron');
  b.add('root', box([0, 38, zb - 1.6], [5.4, 2.6, 1.6], { round: 1 }), 'iron');
  b.add('root', box([0, 30.5, zb - 3], [8.2, 1, 0.8], { round: 0.4 }), 'iron');
  // armrests on posts (top at 18.6 vox = 0.78 m)
  for (const k of [-1, 1]) {
    b.add('root', box([k * 8.2, 17.8, 2.4], [1.4, 0.8, 7.4], { round: 0.5 }), 'iron');
    b.add('root', box([k * 8.2, 14.6, 7.8], [1, 2.6, 1], { round: 0.4 }), 'iron');
    b.add('root', box([k * 8.2, 14.6, zb + 1], [1, 2.6, 1], { round: 0.4 }), 'iron');
    // the straps over the armrest (wrists) and the front of the seat (shins)
    for (const z of [0.4, 6.4]) {
      b.add('root', box([k * 8.2, 17.8, z], [2.1, 1.5, 0.9], { round: 0.4 }), 'strap');
      b.paint('root', box([k * 8.2, 17.8, z], [2.2, 1.6, 0.25]), 'trim', { where: b.isMat('strap') });
    }
    b.add('root', box([k * 3.6, 8.4, 8.7], [2.4, 0.9, 0.9], { round: 0.4 }), 'strap');
  }
  // seal glyphs down the back and round the plinth: rings with a cross
  const glyph = (x: number, y: number) => {
    b.paint('root', fn((px, py, pz) => Math.max(Math.abs(Math.hypot(px - x, py - y) - 2) - 0.4, Math.abs(pz - (zb + 0.1)) - 0.8), [x - 4, y - 4, zb - 2], [x + 4, y + 4, zb + 2]), 'glyph', { where: b.isMat('iron') });
    b.paint('root', fn((px, py, pz) => Math.max(Math.min(Math.abs(px - x), Math.abs(py - y)) - 0.35, Math.hypot(px - x, py - y) - 1.6, Math.abs(pz - (zb + 0.1)) - 0.8), [x - 4, y - 4, zb - 2], [x + 4, y + 4, zb + 2]), 'glyph', { where: b.isMat('iron') });
  };
  glyph(0, 32);
  glyph(0, 23);
  glyph(-4, 27.5);
  glyph(4, 27.5);
  b.paint('root', fn((px, py, pz) => Math.max(Math.abs(py - 2) - 0.45, Math.abs(Math.abs(pz - 2) - 9.1) - 0.4, Math.abs(((px + 40) % 3) - 1.5) - 0.9), [-11, 0, -9], [11, 5, 13]), 'glyph', { where: b.isMat('iron') });
  b.autoShade({ up: 0.4, open: 2, front: 0.3 });
  b.lint(2);
  return b.build();
}

/**
 * The bands over his left eye and his mouth while he sits bound (the right eye's band is part of the body): leather
 * strips round the front of the head, joined at the cheeks. Built on the head's lattice at the 'glasses' socket.
 */
function buildGag(): VoxelModel {
  const b = new ModelBuilder('aizen-gag', AIZEN_RES);
  b.mat('strap', ['#2C2C31', '#1E1E22', '#141418'], { base: 1, rough: 0.45 });
  b.mat('trim', ['#F0F0EE', '#D8D8D6'], { base: 0, rough: 0.6 });
  b.bone('root', null, [0, 0, 0]);
  const e = (x: number, z: number) => Math.hypot(x / 6.1, (z + 5.4) / 6.5);
  const shell = (y0: number, y1: number) => fn((x, y, z) => Math.max(Math.abs(e(x, z) - 1.02) * 6 - 0.85, y0 - y, y - y1, -6.5 - z), [-9, y0 - 1, -9], [9, y1 + 1, 4]);
  b.add('root', shell(-1.2, 2.4), 'strap', { thr: 0.25 });
  b.add('root', shell(-5.4, -2.4), 'strap', { thr: 0.25 });
  // joined at both cheeks
  for (const k of [-1, 1]) b.add('root', fn((x, y, z) => Math.max(Math.abs(e(x, z) - 1.02) * 6 - 0.85, Math.abs(x - k * 5.2) - 0.9, -5.4 - y, y - 2.4), [-9, -6, -9], [9, 3, 4]), 'strap', { thr: 0.25 });
  b.paint('root', fn((_x, y) => Math.min(Math.abs(y - 2.1), Math.abs(y + 1), Math.abs(y + 2.6), Math.abs(y + 5.2)) - 0.3, [-9, -6, -9], [9, 3, 4]), 'trim', { where: b.isMat('strap') });
  b.autoShade({ up: 0.4, open: 2, front: 0.3 });
  b.lint(2);
  return b.build();
}
