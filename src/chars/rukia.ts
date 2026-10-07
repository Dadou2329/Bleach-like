// Rukia Kuchiki — 13th Division. Construction and palette from docs/roster/A2-karakura-allies.md §1, the
// classic Shinigami look: very petite (1.44 m, about six heads tall on the standard face plate), blue-black
// chin-length hair that flares outward at the tips with one long lock hanging between large violet eyes,
// a plain black shihakushō whose sleeves and hakama look oversized on her, and Sode no Shirayuki at the
// left hip (gold rectangular guard with notched corners, maroon grip). 72 voxels at 50 vox/m.
// Shikai: the whole sword white, the guard a hollow snowflake ring; the long ribbon from the pommel is cloth
// simulated at runtime. Bankai, Hakka no Togame: white hair and frost-pale skin, a white kimono with
// ice-blue folds and frost glitter, a tall flaring collar and angular shoulder plates of clear ice, very
// long wide sleeves, great ribbon loops tied at her back, an ice flower on the chest, a half-crown of ice
// crystals round the back of the head; the sword clear ice.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, prism, smoothPath, sphere, spike, subtract, torus, tube, type Sdf, type V3 } from '../models/sdf';
import {
  faceLegend, feet, hakama, hands, head, humanoidSkeleton, kosodeSleeves, kosodeTorso, obi, spikeHair,
  type HumanoidSpec, type Landmarks, type Spike,
} from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

/** 72 voxels = 1.44 m */
export const RUKIA_RES = 72 / 1.44;
export type RukiaForm = 'shinigami' | 'bankai';

/** Petite: the standard face plate on a small, slender body; narrow shoulders, thin limbs. */
const SPEC: HumanoidSpec = {
  H: 72,
  chinY: 60,
  head: { w: 10, d: 11, h: 12 },
  neckR: 2.0,
  shoulder: [7.0, 55.2, -0.5],
  upperArm: 11.5,
  foreArm: 10.5,
  hand: 7,
  armR: 1.9,
  hipsY: 37,
  hip: [3.8, 34.5, 0],
  kneeY: 19.5,
  ankleY: 3.8,
  chest: [6.1, 4.1],
  waist: [5.0, 3.5],
  hips: [6.0, 4.2],
  chestY: 50,
  waistY: 43,
  foot: { len: 9.5, w: 4, heel: 2.4 },
};

function palette(b: ModelBuilder, form: RukiaForm): void {
  const bankai = form === 'bankai';
  b.mat('skin', bankai ? ['#F3EEE8', '#ECE4DC', '#DDD2C8', '#CBBFB5', '#B0A49B'] : ['#F6E2D6', '#EED2C4', '#DDBDAB', '#CBA996', '#AB8B7A'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', bankai ? ['#EEF0F3', '#E2E2EA', '#CFCDDB', '#B9B6CA', '#9C99B2'] : ['#4A4D5C', '#2E303B', '#25252E', '#1C1C24', '#141418'], { base: 1, rough: 0.45, shadeK: 0.85, dither: 0.05 });
  b.mat('sheen', bankai ? ['#F3F3F0'] : ['#888EA1']);
  b.mat('brow', bankai ? ['#B9B6CA'] : ['#25252E']);
  b.mat('lid', bankai ? ['#6E6A86'] : ['#1E1C2A']);
  b.mat('sclera', ['#F3F2EF']);
  b.mat('iris', bankai ? ['#B4B1D2'] : ['#5E5590']);
  b.mat('irisD', bankai ? ['#8A86B0'] : ['#26223D']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#C98A82']);
  b.mat('blush', ['#F2B9AE']);
  b.mat('black', ['#383A3F', '#26272D', '#1C1D22', '#141418'], { base: 1, rough: 0.85, shadeK: 0.9 });
  b.mat('collar', ['#F3F3F0', '#E2E0DC', '#C9C7C2'], { base: 0, rough: 0.8 });
  b.mat('obi', ['#F3F2EE', '#E0DED9', '#A39D99'], { base: 0, rough: 0.8 });
  b.mat('tabi', ['#F3F2EE', '#DEDDDA', '#C2C1BD'], { base: 0, rough: 0.8 });
  b.mat('straw', ['#C9B9A0', '#B0A888', '#8C8268'], { base: 1, rough: 0.9 });
  b.mat('cord', ['#5B4632']);
  if (bankai) {
    b.mat('kimono', ['#DCF0F2', '#CDE7F2', '#B4D9EE', '#94C6EA', '#78AEDC'], { base: 0, rough: 0.6, shadeK: 0.9, dither: 0.04 });
    b.mat('frost', ['#F3F3F0', '#E6F4FA'], { glow: 0.5 });
    b.mat('ice', ['#EAF6FA', '#D6ECF6', '#BFE0F2', '#9FCBE8', '#7FB2DA'], { base: 1, rough: 0.1, metal: 0.1, shadeK: 0.85, glow: 0.25 });
    b.mat('ribbon', ['#EAF6FF', '#D2E6F6', '#AFCBE6', '#7DA1C5'], { base: 0, rough: 0.5, shadeK: 0.9 });
    b.mat('crystal', ['#D8EDF6', '#B9D2E6', '#9DACC0'], { base: 0, rough: 0.1, glow: 0.4 });
  }
}

/** Large violet eyes under thin brows; the long lock hangs between them. Rows 9 → 0. */
const FACE = [
  '. . . . . . . . . .',
  '. B B B . . B B B .',
  '. L L L . . L L L .',
  'L W I I . . I I W L',
  '. W * i . . i * W .',
  '. . I I . . I I . .',
  '. . . . . s . . . .',
  '. . . . . . . . . .',
  '. . . . m m . . . .',
  '. . . . . . . . . .',
];

const assetCache = new Map<RukiaForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function rukiaAsset(form: RukiaForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildRukia(form)));
  return a;
}

/**
 * 'katana' (sealed Sode no Shirayuki), 'sheath' / 'sheath-empty', 'shikai' (the white sword, ring guard),
 * 'bankai-sword' (clear ice), 'shirafune' (the ice blade grown off the tip, 16 vox/m).
 */
export type RukiaProp = 'katana' | 'sheath' | 'sheath-empty' | 'shikai' | 'bankai-sword' | 'shirafune';

export function rukiaProp(kind: RukiaProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'sheath' || kind === 'sheath-empty' ? buildSheath(kind === 'sheath') : kind === 'shirafune' ? buildShirafune() : buildSword(kind === 'katana' ? 'sealed' : kind === 'shikai' ? 'shikai' : 'bankai');
    propCache.set(kind, m);
  }
  return m;
}

/** where the ribbon hangs from (sword prop frame, m) */
export const POMMEL_Z = -0.2;
/** the blade's tip (sword prop frame, m) */
export const BLADE_TIP_Z = 0.74;

export function buildRukia(form: RukiaForm = 'shinigami'): CharacterAsset {
  const b = new ModelBuilder(`rukia-${form}`, RUKIA_RES);
  palette(b, form);
  const s = SPEC;
  const bankai = form === 'bankai';
  const L = humanoidSkeleton(b, s, { sleeves: true, hakama: true });
  b.socket('grip.R', 'fist.R', [-L.wrist[0] + 0.1, L.wrist[1] - 4.3, L.wrist[2] + 0.4]);
  b.socket('grip.L', 'fist.L', [L.wrist[0] - 0.1, L.wrist[1] - 4.3, L.wrist[2] + 0.4]);
  b.socket('palm.R', 'palm.R', [-L.wrist[0] + 0.6, L.wrist[1] - 5, L.wrist[2] + 1]);
  b.socket('palm.L', 'palm.L', [L.wrist[0] - 0.6, L.wrist[1] - 5, L.wrist[2] + 1]);
  b.socket('finger.R', 'palm.R', [-L.wrist[0] + 0.2, L.wrist[1] - s.hand - 0.5, L.wrist[2] + 1]);
  b.socket('finger.L', 'palm.L', [L.wrist[0] - 0.2, L.wrist[1] - s.hand - 0.5, L.wrist[2] + 1]);
  b.socket('hip.L', 'hips', [7.4, s.hipsY + 1, 2.8], [-26, 180, -8]);
  b.socket('chest.front', 'chest', [0, s.chestY, 6]);
  b.socket('back', 'chest', [0, s.chestY, -6]);

  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.stamp('head', hd.x0, hd.chin + 9, FACE, faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  // a little colour on the cheeks
  for (const x of [-4, 3]) b.voxel('head', x, hd.chin + 3, hd.front - 1, 'blush', 0);
  hair(b, L, hd, bankai);
  hands(b, L, 'skin');
  feet(b, L, 'tabi', 'straw', 'cord');
  const cloth = bankai ? 'kimono' : 'black';
  const o = { black: cloth, collar: bankai ? 'kimono' : 'collar', skin: 'skin', obi: bankai ? 'ribbon' : 'obi', hemR: 7.2, bag: 3.4 };
  kosodeTorso(b, L, o);
  kosodeSleeves(b, L, o);
  obi(b, L, o);
  hakama(b, L, o);
  const springs: SpringDef[] = [];
  const colliders: ColliderDef[] = [];
  if (bankai) springs.push(...hakkaNoTogame(b, L, hd));
  b.autoShade();
  b.lint();
  const R = RUKIA_RES;
  for (const side of ['L', 'R']) {
    springs.push({ bone: `sleeve.${side}`, tail: [0, -(bankai ? 16 : 10) / R, -2.5 / R], stiffness: bankai ? 26 : 38, damping: 5, gravity: 10, limit: 95, radius: 0.04 });
    springs.push({ bone: `hakama.${side}`, tail: [0, -18 / R, 0], stiffness: 70, damping: 6, gravity: 8, limit: 55, radius: 0.08 });
  }
  springs.push({ bone: 'lock', tail: [0, -0.07, 0.01], stiffness: 60, damping: 6, gravity: 6, limit: 30, radius: 0.01 });
  return {
    model: b.build(),
    springs,
    colliders: [...colliders, { bone: 'shin.L', offset: [0, -0.1, 0], radius: 0.055 }, { bone: 'shin.R', offset: [0, -0.1, 0], radius: 0.055 }],
    warnings: b.warnings,
  };
}

// ---------------------------------------------------------------------------------------------- hair

/**
 * A chin-length cut: a smooth cap, locks hanging down the sides and the back that flare outward into
 * points at their ends, side-swept bangs framing the face — and the one long lock that hangs between the
 * eyes (on its own spring bone). Bankai: white, with a half-crown of ice crystals round the back.
 */
function hair(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }, bankai: boolean): void {
  const s = L.spec;
  const c = hd.chin;
  const front = hd.front;
  const locks: Spike[] = [];
  // the fall: flat locks round the sides and back, hanging down and flaring out at the ends
  for (const az of [-100, -122, -145, -168, 168, 145, 122, 100]) {
    const k = Math.sign(az), back = Math.abs(az) > 150;
    locks.push({ az, el: -10, len: back ? 4.5 : 5.2, r: 3.2, flat: 0.35, flow: [0, -1.5, 0], bend: [k * (back ? 0.15 : 0.32), 0.02, back ? -0.2 : -0.05], taper: 1 });
  }
  // the front of the sides: shorter, framing the cheeks, flipping outward
  for (const k of [-1, 1]) {
    locks.push({ az: k * 78, el: -4, len: 4, r: 2.6, flat: 0.35, flow: [0, -1.6, 0.15], bend: [k * 0.35, 0.05, 0], taper: 1 });
    locks.push({ az: k * 60, el: 18, len: 2.6, r: 2.4, flat: 0.4, flow: [k * 0.2, -1.2, 0.2], bend: [k * 0.3, 0, 0], taper: 1 });
  }
  // a little volume at the back of the crown
  for (const az of [-150, 150, 180]) locks.push({ az, el: 40, len: 0.8, r: 3, flat: 0.55, flow: [0, -0.2, -0.5] });
  spikeHair(b, L, 'hair', locks, [
    // the bangs part off-centre and sweep out to the sides; the eyes stay clear
    { x: -3.6, tipY: c + 8.4, lean: -1.4, r: 1.5 },
    { x: 3.4, tipY: c + 8.6, lean: 1.4, r: 1.5 },
    { x: -5.2, tipY: c + 6.4, lean: -0.6, r: 1.3 },
    { x: 5.0, tipY: c + 6.6, lean: 0.6, r: 1.3 },
  ], { hairline: c + s.head.h - 1.2, nape: c + 1, slope: 0.6 });
  // the lock between the eyes, from the hairline down past the nose, on its own bone so it sways
  b.bone('lock', 'head', [0, c + s.head.h - 1, front]);
  b.add('lock', tube(smoothPath([[0.3, c + s.head.h - 0.5, front - 0.2], [-0.2, c + 8.5, front + 0.6], [0.4, c + 5.6, front + 0.9], [-0.3, c + 3.4, front + 0.8]], 4), [1.1, 1.0, 0.85, 0.6, 0.45, 0.35, 0.3, 0.25, 0.2, 0.2, 0.2, 0.2, 0.2]), 'hair', { thr: 0.25 });
  // a cool sheen across the crown
  b.paint('head', torus([0, c + s.head.h - 1.2, L.headC[2] - 1], 4.6, 0.7, [20, 0, 0]), 'sheen', { where: b.isMat('hair') });
  // keep the eyes clear
  b.carve('head', aabb([-5, c + 4, front], [-1, c + 7, front + 6]));
  b.carve('head', aabb([1, c + 4, front], [5, c + 7, front + 6]));
  if (bankai) {
    // a half-crown of ice crystals round the back of the head, with icicle tassels at the sides
    const hc = L.headC;
    for (let i = 0; i < 9; i++) {
      const a = ((i / 8) - 0.5) * Math.PI * 1.15 + Math.PI;
      const dir: V3 = [Math.sin(a) * 0.8, 0.75 + (i % 2) * 0.25, Math.cos(a) * 0.8];
      const base: V3 = [hc[0] + Math.sin(a) * 5.6, c + s.head.h - 2.5, hc[2] + Math.cos(a) * 6];
      b.add('head', spike(base, dir, 4 + (i % 2) * 2.5, 1.4, 0.8, { tip: 0.3 }), 'crystal', { thr: 0.25 });
    }
    for (const k of [-1, 1]) {
      const base: V3 = [k * 6.2, c + 8, hc[2] - 1.5];
      b.add('head', blend(0.6, sphere(base, 1.3), spike(base, [k * 0.1, -1, 0], 5, 0.8, 0.6, { tip: 0.3 })), 'crystal', { thr: 0.25 });
    }
  }
}

// ---------------------------------------------------------------------------------------------- Bankai

/**
 * Hakka no Togame: the shihakushō becomes a white kimono (frost glitter, ice-blue folds) with a tall
 * flaring collar and angular shoulder plates of clear ice, longer sleeves, an ice flower on the chest, and
 * great ribbon loops tied at the back that trail behind her (spring bones).
 */
function hakkaNoTogame(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): SpringDef[] {
  const s = L.spec;
  const R = RUKIA_RES;
  const [sx, sy, sz] = s.shoulder;
  const springs: SpringDef[] = [];
  // frost glitter scattered over the kimono
  for (const bone of ['chest', 'spine', 'hips', 'hakama.L', 'hakama.R', 'sleeve.L', 'sleeve.R', 'upperarm.L', 'upperarm.R', 'forearm.L', 'forearm.R'])
    b.paint(bone, fn((x, y, z) => (Math.abs(Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453) % 1) > 0.94 ? -1 : 1, [-30, 0, -30], [30, 90, 30]), 'frost', { where: b.isMat('kimono') });
  // the collar: a tall flaring stand-up ring of ice round the neck, open at the front
  const ny = s.chinY - 3;
  const collar = subtract(
    intersect(
      fn((x, y, z) => {
        const t = (y - ny) / 9;
        const r = 5.2 + t * 3.4;
        return Math.abs(Math.hypot(x, (z - L.headC[2] + 1) * 1.05) - r) - 0.55;
      }, [-12, ny - 1, -12], [12, ny + 10, 12]),
      aabb([-12, ny, -12], [12, ny + 9, 12]),
    ),
    prism([[-2.5, ny - 1], [2.5, ny - 1], [5.5, ny + 10], [-5.5, ny + 10]], [0, 0, 6], [1, 0, 0], [0, 1, 0], 6),
  );
  b.add('chest', collar, 'ice', { thr: 0.25 });
  // shoulder plates: angular slabs of ice standing off both shoulders
  for (const k of [1, -1]) {
    const bone = k > 0 ? 'upperarm.L' : 'upperarm.R';
    // a cap of ice over the shoulder, and the plate standing off it
    b.add(bone, ellipsoid([k * (sx + 0.6), sy + 1.4, sz - 1.2], [3.2, 1.8, 3.4]), 'ice', { thr: 0.25 });
    b.add(bone, prism([[0, 0], [5.5, 1.5], [6.5, -3.5], [2, -6]], [k * (sx + 0.4), sy + 2.2, sz - 3.2], [k * 0.9, 0.35, 0], [0, 0.3, 1], 0.7), 'ice', { thr: 0.25 });
    b.add(bone, spike([k * (sx + 2.5), sy + 1.5, sz + 0.5], [k * 0.9, 0.6, 0.1], 4, 1.3, 0.5, { tip: 0.3 }), 'ice', { thr: 0.25 });
  }
  // the ice flower on the chest: five pointed petals round a bead
  const fy = s.chestY + 1.5;
  let fz = 0;
  for (let z = 12; z > -12; z -= 0.25) if (b.grid('chest').get(0, Math.round(fy), Math.round(z)) !== 0) { fz = z + 0.8; break; }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + Math.PI / 2;
    b.add('chest', spike([0, fy, fz], [Math.cos(a), Math.sin(a), 0.25], 2.6, 1, 0.5, { tip: 0.3 }), 'crystal', { thr: 0.2 });
  }
  b.add('chest', sphere([0, fy, fz + 0.4], 0.9), 'crystal');
  // ribbon loops tied at the back of the obi: a knot, two big loops, two long trailing tails
  const ky = s.waistY - 1, kz = -s.waist[1] - 1.6;
  b.add('spine', ellipsoid([0, ky, kz], [1.8, 1.6, 1.2]), 'ribbon');
  for (const k of [-1, 1]) {
    b.add('spine', subtract(torus([k * 3.6, ky + 1.5, kz - 1], 3.4, 0.9, [0, 0, k * 22]), aabb([-0.6, -10, -20], [0.6, 80, 20])), 'ribbon', { thr: 0.25 });
    b.bone(`ribbon.${k > 0 ? 'L' : 'R'}`, 'spine', [k * 0.8, ky, kz - 0.5]);
    const pts = smoothPath([[k * 0.8, ky - 0.5, kz - 0.6], [k * 2.2, ky - 8, kz - 2.5], [k * 3.4, ky - 18, kz - 4.5], [k * 4.2, ky - 27, kz - 6]], 5);
    b.add(`ribbon.${k > 0 ? 'L' : 'R'}`, tube(pts, pts.map((_, i) => 1.15 - i * 0.025)), 'ribbon', { thr: 0.25 });
    springs.push({ bone: `ribbon.${k > 0 ? 'L' : 'R'}`, tail: [k * 3 / R, -26 / R, -5 / R], stiffness: 18, damping: 3, gravity: 7, limit: 80, radius: 0.05 });
  }
  // the hems of the sleeves and hakama edged in ice
  b.paint(['sleeve.L', 'sleeve.R'], fn((x, y) => y - (L.wrist[1] - 4.5), [-30, 0, -30], [30, 90, 30]), 'ice', { where: b.isMat('kimono') });
  b.paint(['hakama.L', 'hakama.R'], fn((x, y) => y - 3.5, [-30, -2, -30], [30, 90, 30]), 'ice', { where: b.isMat('kimono') });
  return springs;
}

// ---------------------------------------------------------------------------------------------- props

function swordMats(b: ModelBuilder, kind: 'sealed' | 'shikai' | 'bankai'): void {
  if (kind === 'sealed') {
    b.mat('steel', ['#E2E6EC', '#C9CED6', '#A8AEB8', '#8A909A'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
    b.mat('edge', ['#EEF1F4'], { rough: 0.12, metal: 0.8 });
    b.mat('guard', ['#ECE8C6', '#B7AA7C', '#8D805F', '#615440'], { base: 1, rough: 0.35, metal: 0.8, shadeK: 0.8 });
    b.mat('wrap', ['#8A5A5C', '#734749', '#5A3436'], { base: 1, rough: 0.85 });
    b.mat('ray', ['#BCAF80', '#8D805F']);
  } else if (kind === 'shikai') {
    b.mat('steel', ['#F0F3F5', '#E2ECF4', '#CFE3F2', '#AFCBE2'], { base: 1, rough: 0.2, metal: 0.3, shadeK: 0.7, glow: 0.15 });
    b.mat('edge', ['#F3F3F0'], { rough: 0.12, glow: 0.2 });
    b.mat('guard', ['#F0F3F5', '#DCE8F2', '#CFE3F2', '#A9C4DC'], { base: 1, rough: 0.3, shadeK: 0.8, glow: 0.1 });
    b.mat('wrap', ['#F0F3F5', '#E2ECF4', '#CFE3F2'], { base: 1, rough: 0.7 });
    b.mat('ray', ['#DCE8F2', '#CFE3F2']);
  } else {
    b.mat('steel', ['#B9D8EC', '#8CB8D6', '#6A9CC6', '#4C85B9'], { base: 1, rough: 0.08, metal: 0.1, shadeK: 0.8, glow: 0.35 });
    b.mat('edge', ['#E6F4FA'], { rough: 0.05, glow: 0.4 });
    b.mat('guard', ['#E6F4FA', '#BFE3F2', '#8CC4E0', '#6A9CC6'], { base: 1, rough: 0.1, shadeK: 0.8, glow: 0.3 });
    b.mat('wrap', ['#F0F3F5', '#E2ECF4', '#CFE3F2'], { base: 1, rough: 0.6 });
    b.mat('ray', ['#DCE8F2', '#CFE3F2']);
  }
}

/**
 * Sode no Shirayuki at 48 vox/m: a slim katana, 0.95 m. Sealed: the rectangular gold guard with notched
 * corners and slits above and below the blade, a maroon grip over pale diamonds. Shikai: all white, the guard
 * a hollow ring with six points like a snowflake. Bankai: the same shape in clear ice. Origin at the grip,
 * +Z, edge −Y.
 */
function buildSword(kind: 'sealed' | 'shikai' | 'bankai'): VoxelModel {
  const b = new ModelBuilder(`shirayuki-${kind}`, 48);
  swordMats(b, kind);
  b.bone('root', null, [0, 0, 0]);
  // grip and wrap
  b.add('root', box([0, 0, -4.4], [1.0, 1.15, 5.2], { round: 0.5 }), 'wrap');
  b.paint('root', fn((x, y, z) => Math.abs(((Math.abs(y) + z) % 2.4 + 2.4) % 2.4 - 1.2) - 0.42, [-2, -2, -10], [2, 2, 1]), 'ray', { where: b.isMat('wrap') });
  b.add('root', box([0, 0, -9.8], [1.15, 1.3, 0.5], { round: 0.35 }), 'guard');
  b.add('root', box([0, 0, 1.0], [1.1, 1.25, 0.45], { round: 0.3 }), 'guard');
  const tz = 1.8;
  if (kind === 'sealed') {
    // the rectangular guard: notched corners, slits above and below the blade
    b.add('root', subtract(
      box([0, 0, tz], [2.2, 3.0, 0.5], { round: 0.3 }),
      sphere([2.2, 3.0, tz], 0.9), sphere([-2.2, 3.0, tz], 0.9), sphere([2.2, -3.0, tz], 0.9), sphere([-2.2, -3.0, tz], 0.9),
      box([0, 2.0, tz], [1.2, 0.35, 1]), box([0, -2.0, tz], [1.2, 0.35, 1])), 'guard');
  } else {
    // the snowflake ring: a hollow ring with six short points
    b.add('root', subtract(cylinder([0, 0, tz - 0.5], [0, 0, tz + 0.5], 3.4), cylinder([0, 0, tz - 1], [0, 0, tz + 1], 2.2)), 'guard', { thr: 0.25 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      b.add('root', spike([Math.cos(a) * 3.1, Math.sin(a) * 3.1, tz], [Math.cos(a), Math.sin(a), 0], 1.6, 0.6, 0.4, { tip: 0.3 }), 'guard', { thr: 0.25 });
    }
    b.add('root', box([0, 0, tz], [0.8, 1.1, 0.5]), 'guard');
  }
  // the blade: slim, a gentle curve
  const z0 = 2.4, zEnd = 32.5, zTip = 35.5;
  const curve = (z: number) => ((z - z0) / (zTip - z0)) ** 2 * 1.2;
  b.add('root', fn((x, y, z) => {
    if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
    const cv = curve(z);
    const top = 0.75 + cv, bot = -0.9 + cv + Math.max(0, z - zEnd) * 0.55;
    return Math.max(Math.abs(x) - 0.45, y - top, bot - y, z0 - z, z - zTip);
  }, [-2, -3, z0 - 1], [2, 5, zTip + 1]), 'steel', { thr: 0.3 });
  b.paint('root', fn((x, y, z) => y - (-0.55 + curve(z) + Math.max(0, z - zEnd) * 0.55), [-2, -3, 0], [2, 5, zTip + 1]), 'edge');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** The charcoal sheath. Origin at the mouth, along +Z. */
function buildSheath(withSword: boolean): VoxelModel {
  const b = new ModelBuilder(withSword ? 'shirayuki-sheath-full' : 'shirayuki-sheath', 48);
  swordMats(b, 'sealed');
  b.mat('saya', ['#6A6964', '#5D5B57', '#4A4946', '#383734'], { base: 1, rough: 0.35, shadeK: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  const curve = (z: number) => (z / 33) ** 2 * 1.2;
  b.add('root', fn((x, y, z) => Math.max(Math.hypot(x, (y - curve(Math.max(0, z))) / 1.5) - 0.95, -z, z - 33), [-2, -3, -1], [2, 5, 34]), 'saya');
  b.add('root', box([0, 0, 0.4], [1.2, 1.7, 0.5], { round: 0.3 }), 'guard');
  b.add('root', box([0, curve(32.5), 32.6], [1.05, 1.6, 0.5], { round: 0.4 }), 'guard');
  if (withSword) {
    b.add('root', subtract(box([0, 0, -0.9], [2.2, 3.0, 0.5], { round: 0.3 }), box([0, 2.0, -0.9], [1.2, 0.35, 1]), box([0, -2.0, -0.9], [1.2, 0.35, 1])), 'guard');
    b.add('root', box([0, 0, -6.6], [1.0, 1.15, 5.2], { round: 0.5 }), 'wrap');
    b.paint('root', fn((x, y, z) => Math.abs(((Math.abs(y) + z) % 2.4 + 2.4) % 2.4 - 1.2) - 0.42, [-2, -2, -12], [2, 2, -1.4]), 'ray', { where: b.isMat('wrap') });
    b.add('root', box([0, 0, -12], [1.15, 1.3, 0.5], { round: 0.35 }), 'guard');
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** San no mai, Shirafune: a long blade of ice grown off the tip (16 vox/m, 3 m), faceted, glittering. Origin at its root, +Z. */
function buildShirafune(): VoxelModel {
  const b = new ModelBuilder('shirafune', 16);
  b.mat('ice', ['#E6F4FA', '#BFE3F2', '#8CC4E0', '#6A9CC6', '#4C85B9'], { base: 1, rough: 0.08, metal: 0.1, shadeK: 0.8, glow: 0.45 });
  b.mat('core', ['#F3F3F0'], { glow: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  const len = 48;
  b.add('root', fn((x, y, z) => {
    if (z < -0.5 || z > len + 0.5) return 1;
    const k = 1 - z / len;
    const w = 0.6 + k * 1.1, h = 0.9 + k * 1.6;
    // a diamond cross-section, narrowing to the point
    return Math.max(Math.abs(x) / w + Math.abs(y) / h - 1, -z, z - len) * Math.min(w, h);
  }, [-3, -4, -1], [3, 4, len + 1]), 'ice', { thr: 0.25 });
  // a few spurs of frost along the back
  for (let i = 0; i < 5; i++) b.add('root', spike([0, 1.2 - i * 0.2, 6 + i * 8], [0, 0.6, 0.8], 3 - i * 0.4, 0.7, 0.5, { tip: 0.3 }), 'ice', { thr: 0.25 });
  b.paint('root', capsule([0, 0, 0], [0, 0, len * 0.85], 0.5), 'core');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}
