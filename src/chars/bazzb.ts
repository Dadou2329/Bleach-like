// Bazz-B (docs/roster/H2-sternritter-1.md §1; kit docs/kits/bazzb.md). Brief: 179 cm → 86 vox at 48/m (head 12.4,
// ≈ 1/6.9); an athletic brawler — broad shoulders, a narrow waist, thick forearms. Silhouette keys: the tall
// swept-back blade of red hair over shaved sides (a rooster's comb, Renji says), the white thigh-length coat, white
// trousers cropped over chunky black military boots, black armbands. Face: green eyes under heavy red brows angled
// into a scowl, a cocky grin. Hardware: two hex nuts in the upper-left ear, a bolt through the lower-right; the thin
// neck chain with the Wandenreich pendant at the open collar. Gloves black, a white skull on the back of each; the
// armbands black with the white skull and crossbones. The right hand carries every finger count (bones fing1-5.R:
// the index; index and middle in a V; three fanned; four together, the thumb folded; five spread like a claw) — the
// finger count *is* the move. Forms: 'base'; 'voll' (Quincy: Vollständig: two long thin straight rods angled up and
// out of the shoulder blades; the spiky red Zeichen halo is a prop). Props: the Heilig Bogen (a pistol-grip
// crossbow of blue-white reishi), Burner Finger 4's flame sword (the blade growing from the four fingers, the long
// crossguard round the hand) and the halo. (verify) the coat's collar (open at the throat here, for the chain).
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, intersect, offset, prism, sphere, spike, subtract, torus, type Sdf, type V3 } from '../models/sdf';
import { addBands, coatSkirt, faceLegend, hands, head, humanoidSkeleton, type HumanoidSpec, type Landmarks } from './humanoid';
import { badge, frontOf } from './sternritter';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

export const BAZZB_RES = 48;
export type BazzbForm = 'base' | 'voll';

/** Broad in the shoulders, narrow in the waist, thick forearms. */
const SPEC: HumanoidSpec = {
  H: 86,
  chinY: 73.6,
  head: { w: 10, d: 11, h: 12.4 },
  neckR: 2.8,
  shoulder: [10.4, 68.0, -0.5],
  upperArm: 14.8,
  foreArm: 13.4,
  hand: 9.2,
  armR: 2.7,
  hipsY: 46.2,
  hip: [4.6, 43, 0],
  kneeY: 23.6,
  ankleY: 4.6,
  chest: [9.0, 5.4],
  waist: [6.6, 4.3],
  hips: [7.0, 4.6],
  chestY: 62.2,
  waistY: 52.2,
  foot: { len: 13.4, w: 5.6, heel: 3.2 },
};

function palette(b: ModelBuilder, form: BazzbForm): void {
  b.mat('skin', ['#F6DCC6', '#F0D0B4', '#E0BC9E', '#CFA488', '#B48A70'], { base: 1, rough: 0.6, shadeK: 0.9 });
  // the shaved scalp: a reddish stubble over the skin
  b.mat('shaved', ['#DDAA92', '#CD9881', '#B9846E'], { base: 1, rough: 0.9 });
  b.mat('hair', ['#FF5A4A', '#E8383A', '#D42A2F', '#B32228', '#8F1A1F'], { base: 2, rough: 0.45, shadeK: 0.85, dither: 0.04 });
  b.mat('brow', ['#A3202A']);
  b.mat('lid', ['#6E1A1C']);
  b.mat('sclera', ['#F3F3F0']);
  b.mat('iris', ['#2E9E55']);
  b.mat('irisD', ['#123A22']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#9A5548']);
  b.mat('teeth', ['#F0EEE6']);
  b.mat('coat', ['#F3F3F0', '#F1F2EF', '#DDE0E4', '#C9CCD3', '#A4ABB8'], { base: 1, rough: 0.75, shadeK: 0.9 });
  b.mat('coatIn', ['#D9DCE2', '#C3C8D0', '#A5ACB8'], { base: 1, rough: 0.8 });
  // gloves, boots, the belt and the armbands
  b.mat('black', ['#34333C', '#2A2931', '#222128', '#1A1A1F'], { base: 1, rough: 0.7, shadeK: 0.85 });
  b.mat('print', ['#F2F3F0', '#D8D9D6']);
  b.mat('steel', ['#D3D8DF', '#B9C0C8', '#9DA6B0', '#7A838E'], { base: 1, rough: 0.3, metal: 0.7 });
  b.mat('sole', ['#3A3940', '#2E2D33']);
  if (form === 'voll') b.mat('rod', ['#FFD9A0', '#FF8A6A', '#F0503A', '#E3262F', '#B01820'], { base: 3, rough: 0.2, glow: 0.5, dither: 0 });
}

/** Heavy red brows angled down into a scowl, green eyes, a grin with the teeth showing. Rows 9 → 0. */
const FACE = [
  '. . . . . . . . . .',
  '. B B . . . . B B .',
  '. . . B . . B . . .',
  '. L L L . . L L L .',
  '. W I I . . I I W .',
  '. . i * . . * i . .',
  '. . . . . s . . . .',
  '. . m m m m m m . .',
  '. . . T T T T m . .',
  '. . . . m m . . . .',
];

const assetCache = new Map<BazzbForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function bazzbAsset(form: BazzbForm = 'base'): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildBazzb(form)));
  return a;
}

/**
 * 'crossbow' (the Heilig Bogen: origin at the pistol grip, the grip along ±Z through the fist, the rail above it at
 * +Z and shooting along −Y), 'flame' (Burner Finger 4's sword: origin at the fingertips, the blade along +Z, the
 * guard across ±Y) and 'halo' (the Vollständig Zeichen, facing +Z).
 */
export type BazzbProp = 'crossbow' | 'flame' | 'halo';

export function bazzbProp(kind: BazzbProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) propCache.set(kind, (m = kind === 'crossbow' ? buildCrossbow() : kind === 'flame' ? buildFlameSword() : buildHalo()));
  return m;
}

/** the flame sword's blade along its +Z (m) */
export const BZ_SWORD_BASE_Z = 4 / 48;
export const BZ_SWORD_TIP_Z = 124 / 48;
/** where a bolt leaves the crossbow, in its frame (m) */
export const BZ_BOW_MUZZLE: V3 = [0, -36 / 48, 6 / 48];

/** the finger-count hand variants on the right hand */
export const FINGER_HANDS = ['fing1.R', 'fing2.R', 'fing3.R', 'fing4.R', 'fing5.R'] as const;

export function buildBazzb(form: BazzbForm = 'base'): CharacterAsset {
  const b = new ModelBuilder(`bazzb-${form}`, BAZZB_RES);
  palette(b, form);
  const s = SPEC;
  const L = humanoidSkeleton(b, s);
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.6, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.6, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 5.2, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5.2, wz + 1]);
  b.socket('back', 'chest', [0, s.chestY + 2, -10]);
  b.socket('chest.front', 'chest', [0, s.chestY, 7]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('eye.L', 'head', [2.5, s.chinY + 5.5, hd.front + 0.3]);
  b.socket('eye.R', 'head', [-2.5, s.chinY + 5.5, hd.front + 0.3]);
  // the halo stands behind his head, facing forward
  b.socket('halo', 'head', [0, s.chinY + 9, hd.front - s.head.d - 6]);
  b.stamp('head', hd.x0, hd.chin + 9, FACE, faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth', teeth: 'teeth' }), hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  mohawk(b, L, hd);
  ears(b, L, hd);
  hands(b, L, 'black');
  fingers(b, L);
  gloveSkulls(b, L);
  const torso = body(b, L);
  const coat = uniform(b, L, torso);
  legs(b, L);
  if (form === 'voll') rods(b, L);
  b.autoShade();
  b.lint();
  return {
    model: b.build(),
    springs: coat.springs,
    colliders: [...coat.colliders, { bone: 'thigh.L', offset: [0, -0.1, 0.02], radius: 0.11 }, { bone: 'thigh.R', offset: [0, -0.1, 0.02], radius: 0.11 }],
    warnings: b.warnings,
  };
}

// ---------------------------------------------------------------------------------------------- head

/**
 * The mohawk: the scalp shaved to a reddish stubble all round, and down the middle from the forehead to the nape a
 * tall blade of red hair — a comb of swept-back spikes, tallest over the brow, falling away toward the back.
 */
function mohawk(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): void {
  const s = L.spec;
  const c = hd.chin, front = hd.front;
  const back = front - s.head.d;
  const cz = L.headC[2];
  // a shaved skull is round: the cranium's top edges taken off above the forehead
  b.carve('head', subtract(aabb([-12, c + 9.5, back - 4], [12, c + 20, front + 2]), ellipsoid([0, c + 6, cz - 0.3], [L.spec.head.w / 2 + 1.2, 7.6, s.head.d / 2 + 1.6])));
  b.paint('head', fn((_x, y, z) => {
    const top = y - (c + 10.4);
    const side = Math.min(y - (c + 7.8), (front - 2.4) - z);
    const nape = Math.min(y - (c + 1.6), (cz - 2.6) - z);
    return -Math.max(top, side, nape);
  }, [-12, c - 2, back - 3], [12, c + 16, front + 2]), 'shaved', { where: b.isMat('skin') });
  // the crest: one flat fin from the forehead to the nape, its top edge a row of points swept back, the front point
  // the tallest and leaning forward a little (a rooster's comb), thinning toward the top
  const fin: [number, number][] = [
    [front - 1.0, c + 10.6], [front + 1.2, c + 17.0], [front + 0.6, c + 22.4], [front - 2.4, c + 18.6],
    [front - 3.8, c + 21.6], [front - 6.2, c + 17.6], [front - 8.4, c + 19.8], [front - 10.0, c + 15.8],
    [back - 1.6, c + 16.4], [back - 0.6, c + 12.2], [back - 2.2, c + 10.8], [back + 0.4, c + 6.0],
    [back + 4.0, c + 9.0], [front - 3.0, c + 9.4],
  ];
  b.add('head', intersect(
    prism(fin, [0, 0, 0], [0, 0, 1], [0, 1, 0], 2.0, 0.7),
    fn((x, y) => Math.abs(x) - (1.9 - Math.max(0, y - (c + 13)) * 0.07), [-4, c, back - 6], [4, c + 26, front + 4]),
  ), 'hair', { thr: 0.25 });
  // strands along the blade
  b.paint('head', fn((_x, y, z) => Math.abs(((y * 0.8 - z * 0.6 + 40) % 2.4) - 1.2) - 0.3, [-3, c + 9, back - 8], [3, c + 26, front + 2]), 'hair', { shade: 4, where: b.isMat('hair') });
  b.paint('head', fn((x) => Math.abs(x) - 0.4, [-3, c + 14, back - 8], [3, c + 26, front + 4]), 'hair', { shade: 0, where: b.isMat('hair') });
}

/** Two hex nuts in the upper-left ear, a bolt through the lower-right. */
function ears(b: ModelBuilder, L: Landmarks, hd: { chin: number }): void {
  const hw = L.spec.head.w / 2;
  const c = hd.chin;
  b.voxel('head', hw + 1, c + 6, -2, 'steel', 0);
  b.voxel('head', hw + 1, c + 6, -1, 'steel', 1);
  b.voxel('head', hw, c + 7, -2, 'steel', 1);
  b.voxel('head', -hw - 1, c + 4, -1, 'steel', 1);
  b.voxel('head', -hw - 2, c + 4, -1, 'steel', 0);
}

// ---------------------------------------------------------------------------------------------- hands

/**
 * The finger counts, on the right hand (bones under hand.R at the wrist; the kit shows one at a time): the knuckles,
 * the curled fingers tucked under, the extended ones fanned so each reads, the thumb over the curl, across the palm
 * (four) or out (five). Fingers hang along −Y at rest, the index to the front (+Z), the palm facing in (+X).
 */
function fingers(b: ModelBuilder, L: Landmarks): void {
  const [wx0, wy, wz] = L.wrist;
  const wx = -wx0;
  const kn = wy - 5.4;
  // index, middle, ring, little: slot (z), length
  const F: [number, number][] = [[wz + 1.9, 4.8], [wz + 0.6, 5.2], [wz - 0.7, 4.8], [wz - 1.9, 3.9]];
  // per count: which fingers are out and how their tips fan (z), how they curl toward the palm (x)
  const counts: { out: boolean[]; fan: number[]; curl: number; thumb: 'tuck' | 'fold' | 'out' }[] = [
    { out: [true, false, false, false], fan: [0.2, 0, 0, 0], curl: 0, thumb: 'tuck' },
    { out: [true, true, false, false], fan: [1.5, -0.9, 0, 0], curl: 0, thumb: 'tuck' },
    { out: [true, true, true, false], fan: [1.6, 0, -1.5, 0], curl: 0, thumb: 'tuck' },
    { out: [true, true, true, true], fan: [0.3, 0.1, -0.1, -0.3], curl: 0, thumb: 'fold' },
    { out: [true, true, true, true], fan: [2.4, 0.8, -0.8, -2.2], curl: 1.2, thumb: 'out' },
  ];
  counts.forEach((cnt, i) => {
    const bone = `fing${i + 1}.R`;
    b.bone(bone, 'hand.R', [wx, wy, wz]);
    // the back of the hand and the knuckles
    b.add(bone, box([wx, wy - 3, wz + 0.2], [1.5, 2.9, 2.6], { round: 1 }), 'black');
    b.add(bone, capsule([wx, wy + 0.5, wz], [wx, wy - 1.5, wz], 1.9), 'black');
    for (let k = 0; k < 4; k++) {
      const [z, len] = F[k];
      if (cnt.out[k]) {
        const tip: V3 = [wx + cnt.curl, kn - len, z + cnt.fan[k]];
        b.add(bone, capsule([wx, kn + 0.6, z], tip, 1.0, 0.85), 'black', { thr: 0.2 });
      } else {
        // curled under toward the palm
        b.add(bone, capsule([wx + 0.2, kn + 0.2, z], [wx + 1.6, kn - 1.4, z], 1.05), 'black', { thr: 0.2 });
      }
    }
    if (cnt.thumb === 'tuck') b.add(bone, capsule([wx + 1.7, wy - 3.6, wz + 2.3], [wx + 1.9, kn - 0.8, wz + 0.6], 1.0), 'black', { thr: 0.2 });
    else if (cnt.thumb === 'fold') b.add(bone, capsule([wx + 1.4, wy - 2.4, wz + 2.2], [wx + 1.7, wy - 4.4, wz + 0.2], 1.0), 'black', { thr: 0.2 });
    else b.add(bone, capsule([wx + 0.6, wy - 2, wz + 2.4], [wx + 1.4, wy - 5.4, wz + 4.8], 1.05, 0.9), 'black', { thr: 0.2 });
    // the knuckle line
    b.paint(bone, box([wx - 1.6, kn + 1.2, wz + 0.2], [0.6, 0.5, 2.8]), 'black', { shade: 0 });
  });
  // where the finger fire comes out: the index tip, between the two tips, the middle of the three, the fan of five
  b.socket('finger1', 'fing1.R', [wx, kn - F[0][1] - 0.6, F[0][0] + 0.2]);
  b.socket('finger2', 'fing2.R', [wx, kn - 5.2, wz + 1.2]);
  b.socket('finger3', 'fing3.R', [wx, kn - 5.4, wz + 0.6]);
  b.socket('finger5', 'fing5.R', [wx + 1.2, kn - 4.2, wz + 0.4]);
  // the flame sword grows from the four fingertips, along them (its +Z down the hand's −Y)
  b.socket('bf4', 'fing4.R', [wx, kn - 4.6, wz + 0.4], [90, 0, 0]);
}

/** A small white skull on the back of every glove. */
function gloveSkulls(b: ModelBuilder, L: Landmarks): void {
  const [wx, wy, wz] = L.wrist;
  const rows = ['X X X', 'X . X', '. X .'];
  const bones: [string, number][] = [['palm.L', 1], ['fist.L', 1], ['palm.R', -1], ['fist.R', -1], ...FINGER_HANDS.map((n) => [n, -1] as [string, number])];
  for (const [bone, k] of bones) {
    const g = b.grid(bone);
    rows.forEach((row, r) => row.split(' ').forEach((ch, ci) => {
      if (ch !== 'X') return;
      const y = Math.round(wy - 2 - r), z = Math.round(wz + 1 - ci);
      // the outermost voxel on the back of the hand (the outside of the arm)
      for (let x = Math.round(k * (wx + 4)); Math.abs(x) > Math.abs(wx) - 3; x -= k)
        if (g.get(x, y, z) !== 0) {
          b.voxel(bone, x, y, z, 'print', 0);
          break;
        }
    }));
  }
}

// ---------------------------------------------------------------------------------------------- body & clothes

function torsoSdf(L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  return blend(2.6,
    box([0, s.chestY - 0.5, -0.3], [cx, 6.4, cz], { round: 3 }),
    box([0, s.waistY, -0.2], [wx, 5, wz], { round: 2.8 }),
    box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 3.8, s.hips[1]], { round: 2.4 }),
    capsule([2.4, sy + 1.6, sz - 0.8], [sx - 1.4, sy - 0.2, sz], 2.8, 2.9),
    capsule([-2.4, sy + 1.6, sz - 0.8], [-sx + 1.4, sy - 0.2, sz], 2.8, 2.9),
    sphere([sx, sy - 0.5, sz], 3.4), sphere([-sx, sy - 0.5, sz], 3.4));
}

/** The coat over a broad chest and thick arms; the neck; the cuffs; the armbands. */
function body(b: ModelBuilder, L: Landmarks): Sdf {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const torso = torsoSdf(L);
  addBands(b, offset(torso, 0.7), 'coat', [['hips', 36, 47], ['spine', 47, 58], ['chest', 56, 90]]);
  b.add('neck', capsule([0, s.chinY - 5, L.headC[2] - 0.5], [0, s.chinY + 2, L.headC[2] - 0.5], s.neckR), 'skin');
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(1.4, sphere([sx, sy - 0.5, sz], 3.8), capsule([sx, sy - 1, sz], [sx, ey + 0.5, sz], 3.4, 3.0)), 'coat', { mirror: true });
  b.add('forearm.L', blend(1.2, sphere([sx, ey, sz], 3.1), capsule([sx, ey - 0.5, sz], [sx, wy + 1.8, sz], 3.2, 2.8)), 'coat', { mirror: true });
  b.add('forearm.L', cylinder([sx, wy + 0.4, sz], [sx, wy + 3.6, sz], 3.5), 'coat', { mirror: true });
  b.paint('forearm.L', cylinder([sx, wy + 3.2, sz], [sx, wy + 3.8, sz], 3.8), 'coatIn', { mirror: true, where: b.isMat('coat') });
  // the glove cuffs reach into the sleeves
  b.add('forearm.L', capsule([sx, wy + 3, sz], [sx, wy - 0.4, sz], 2.3), 'black', { mirror: true, only: 'empty' });
  // the armbands round the biceps, the skull and crossbones on the outside
  const by = ey + 6.5;
  b.add('upperarm.L', cylinder([sx, by - 1.7, sz], [sx, by + 1.7, sz], 3.75), 'black', { mirror: true });
  const skull = ['. X X X .', 'X . X . X', '. X X X .', 'X . . . X'];
  for (const k of [1, -1]) {
    const bone = `upperarm.${k > 0 ? 'L' : 'R'}`;
    const g = b.grid(bone);
    skull.forEach((row, r) => row.split(' ').forEach((ch, ci) => {
      if (ch !== 'X') return;
      const y = Math.round(by + 1.5 - r), z = Math.round(sz + 2 - ci);
      for (let x = Math.round(k * (sx + 6)); Math.abs(x) > sx - 1; x -= k)
        if (g.get(x, y, z) !== 0) {
          b.voxel(bone, x, y, z, 'print', 0);
          break;
        }
    }));
  }
  return torso;
}

/**
 * The Sternritter coat, worn his way: a stand collar left open at the throat (the chain and the pendant show), two
 * rows of Zeichen buttons, the black belt and its steel buckle, the seams over the shoulders, the skirt to just
 * above the knee.
 */
function uniform(b: ModelBuilder, L: Landmarks, torso: Sdf): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const nz = L.headC[2] - 0.8;
  const collar = subtract(fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (y - (sy - 0.5)) / (s.chinY - sy)));
    const r = s.neckR + 1.6 + t * 0.8;
    return Math.max(Math.abs(Math.hypot(x, (z - nz) * 1.08) - r) - 0.7, y - (s.chinY - 2.6), sy - 1 - y);
  }, [-10, sy - 2, nz - 10], [10, s.chinY + 1, nz + 10]),
  // open at the front
  fn((x, y, z) => Math.max(Math.abs(x) - (1.4 + Math.max(0, y - sy) * 0.5), nz + 1 - z), [-8, sy - 2, nz], [8, s.chinY + 2, nz + 12]));
  b.add('chest', collar, 'coat');
  // the throat bare in a short V under the open collar
  b.paint('chest', fn((x, y, z) => Math.max(Math.abs(x) - (0.8 + (y - (sy - 4.4)) * 0.45), sy - 4.4 - y, 2 - z), [-8, sy - 6, 0], [8, sy + 6, 20]), 'skin', { where: b.isMat('coat') });
  // the neck chain and the Wandenreich pendant
  b.add('chest', torus([0, sy + 1.2, nz + 0.8], s.neckR + 0.9, 0.45, [-24, 0, 0]), 'steel', { thr: 0.25 });
  badge(b, ['. X .', 'X X X', '. X .', 'X . X'], 0, Math.round(sy - 1), 'steel', { bones: ['chest'], shade: 0 });
  // the seams over the shoulders, collar to shoulder point
  for (const k of [1, -1]) b.paint(['chest', `upperarm.${k > 0 ? 'L' : 'R'}`], capsule([k * 3.8, sy + 2.8, sz - 0.8], [k * (sx + 1.6), sy + 0.6, sz], 0.5), 'coat', { shade: 3, where: b.isMat('coat') });
  // double-breasted: the overlapping edge, two rows of three buttons
  b.paint(['chest', 'spine'], aabb([-5.8, s.waistY - 1, 0], [-4.8, sy - 3.5, 20]), 'coat', { shade: 3, where: b.isMat('coat') });
  for (const k of [1, -1])
    for (const y of [s.chestY + 1.5, s.chestY - 3, s.waistY + 3]) {
      const x = Math.round(k * 3.4 - 0.5);
      for (const [dx, dy, sh] of [[0, 0, 0], [1, 0, 1], [0, -1, 1], [1, -1, 2]] as const) {
        const at = frontOf(b, ['chest', 'spine'], x + dx, Math.round(y) + dy);
        if (at) b.voxel(at.bone, x + dx, Math.round(y) + dy, at.z + 1, 'steel', sh);
      }
    }
  // the black belt and its buckle
  b.add('spine', intersect(subtract(offset(torso, 1.6), offset(torso, 0.3)), aabb([-20, s.waistY - 3.8, -20], [20, s.waistY - 1.4, 20])), 'black');
  const bz = frontOf(b, ['spine'], 0, Math.round(s.waistY - 2.6))?.z ?? 5;
  b.add('spine', box([0, s.waistY - 2.6, bz + 0.6], [2.1, 1.6, 0.7]), 'steel');
  b.paint('spine', box([0, s.waistY - 2.6, bz + 1.4], [0.9, 0.6, 0.6]), 'steel', { shade: 2 });
  // the skirt, flaring a little, to just above the knee
  const skirt = coatSkirt(b, L, { mat: 'coat', lining: 'coatIn', yTop: s.waistY - 4, yHem: L.knee[1] + 1, r0: 7.9, r1: 10.4, openFront: 9, overlap: 3, res: BAZZB_RES, depth: 0.85 });
  return skirt;
}

/** White trousers cropped over chunky black military boots, the laces up the front, thick soles. */
function legs(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [hx, hy, hz] = s.hip;
  const [kx, ky, kz] = L.knee;
  const [ax, ay, az] = L.ankle;
  b.add('hips', box([0, s.hipsY - 0.5, -0.3], [s.hips[0] + 0.6, 3.8, s.hips[1] + 0.6], { round: 2.4 }), 'coat');
  b.add('thigh.L', blend(1.3, sphere([hx, hy, hz], 3.8), capsule([hx, hy, hz], [kx, ky + 1, kz], 3.8, 3.1)), 'coat', { mirror: true });
  b.add('shin.L', blend(1.1, sphere([kx, ky, kz], 3.1), capsule([kx, ky, kz], [ax, ay + 9, az], 3.0, 2.8)), 'coat', { mirror: true });
  // the boots to mid-calf, the trouser hem tucked over their tops
  const bootTop = ay + 10;
  b.add('shin.L', capsule([ax, bootTop, az], [ax, ay + 0.5, az], 3.25, 3.1), 'black', { mirror: true });
  b.add('shin.L', cylinder([ax, bootTop - 0.4, az], [ax, bootTop + 1.4, az], 3.6), 'coat', { mirror: true });
  b.paint('shin.L', cylinder([ax, bootTop - 0.4, az], [ax, bootTop + 0.2, az], 3.9), 'coatIn', { mirror: true, where: b.isMat('coat') });
  // laces criss-crossing up the front of the shaft
  for (let y = ay + 2; y < bootTop - 1; y += 2) b.paint('shin.L', box([ax, y, az + 3], [1.4, 0.4, 1]), 'black', { shade: 0, mirror: true, where: b.isMat('black') });
  const f = s.foot;
  b.add('foot.L', capsule([ax, ay + 1.5, az - 0.4], [ax, ay - 1, az - 0.4], 3.0), 'black', { mirror: true });
  b.add('foot.L', intersect(box([ax, 2.4, az + (f.len / 2 - f.heel)], [f.w / 2, 2.4, f.len / 2], { round: 1.5 }), fn((x, y, z) => y - 4.8 + (z - (az + f.len - f.heel - 3)) * 0.6, [-20, -2, -20], [20, 10, 30])), 'black', { mirror: true });
  // the thick sole, a welt round it
  b.paint('foot.L', aabb([ax - 6, -1, az - 8], [ax + 6, 1.4, az + 16]), 'sole', { mirror: true });
}

/**
 * Quincy: Vollständig: two long thin straight rods out of the shoulder blades, angled up and out, a light core down
 * each, a knob at the root.
 */
function rods(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [, sy] = s.shoulder;
  for (const k of [1, -1]) {
    const side = k > 0 ? 'L' : 'R';
    const root: V3 = [k * 3.6, sy - 5, -s.chest[1] - 1.2];
    b.bone(`wing.${side}`, 'chest', root);
    const dir: V3 = [k * 0.62, 0.74, -0.26];
    const len = 52;
    const tip: V3 = [root[0] + dir[0] * len, root[1] + dir[1] * len, root[2] + dir[2] * len];
    b.add(`wing.${side}`, capsule(root, tip, 1.15, 0.55), 'rod', { thr: 0.2 });
    b.add(`wing.${side}`, sphere(root, 2.0), 'rod');
    b.paint(`wing.${side}`, capsule(root, tip, 0.5, 0.3), 'rod', { shade: 0 });
  }
}

// ---------------------------------------------------------------------------------------------- props

/**
 * The Heilig Bogen at 48 vox/m: a pistol-grip crossbow of blue-white reishi — the grip along ±Z through the fist, the
 * stock running over the hand and the wrist to the front, the prod across its front end (limbs ±X, swept back), the
 * string drawn back to the latch, a bolt in the groove. Shoots along −Y.
 */
function buildCrossbow(): VoxelModel {
  const b = new ModelBuilder('bazzb-crossbow', 48);
  b.mat('reishi', ['#E8F7FF', '#C2E9FB', '#9AD8F4', '#6FC0EA', '#3F94D0'], { base: 2, rough: 0.2, glow: 0.22, dither: 0 });
  b.mat('core', ['#F3FCFF'], { glow: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  // the grip, a little raked
  b.add('root', capsule([0, 0.6, -3.6], [0, -0.6, 4.2], 1.2), 'reishi');
  // the stock: over the hand, from behind the wrist to the muzzle
  b.add('root', box([0, -14, 6], [1.4, 22, 1.4], { round: 0.6 }), 'reishi');
  b.add('root', box([0, 6, 5.2], [1.2, 3, 2.2], { round: 0.8 }), 'reishi');
  // the trigger guard
  b.add('root', torus([0, -2.6, 3.4], 1.7, 0.65, [0, 0, 90]), 'reishi', { thr: 0.2 });
  // the prod: two limbs swept back from the front end
  for (const k of [1, -1]) b.add('root', capsule([0, -33, 6.4], [k * 13, -28, 6.4], 1.1, 0.6), 'reishi', { thr: 0.2 });
  b.add('root', box([0, -33.5, 6.4], [2.4, 1.6, 1.6], { round: 0.6 }), 'reishi');
  // the string to the latch, and the bolt in the groove
  for (const k of [1, -1]) b.add('root', capsule([k * 12.6, -27.6, 6.4], [0, -12, 7.0], 0.65), 'core', { thr: 0.15 });
  b.add('root', capsule([0, -12, 7.4], [0, -36, 7.4], 0.65), 'core', { thr: 0.15 });
  b.add('root', spike([0, -36, 7.4], [0, -1, 0], 3.2, 1.2, 0.8, { side: [1, 0, 0], tip: 0.6 }), 'core', { thr: 0.2 });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * Burner Finger 4 at 48 vox/m: a great sword of fire growing from the fingertips — a long straight crossguard round
 * the hand (across ±Y), a broad blade to a point (2.5 m) along +Z, its edges licking in tongues, a pale hot core.
 */
function buildFlameSword(): VoxelModel {
  const b = new ModelBuilder('burner-finger-4', 48);
  b.mat('fire', ['#FFC23A', '#FF9A2A', '#FF7A1A', '#E8501E', '#D9361C'], { base: 2, rough: 0.6, glow: 0.8, dither: 0 });
  b.mat('hot', ['#FFE9A8', '#FFD36A'], { glow: 1.4 });
  b.mat('core', ['#FFF6C8'], { glow: 2.4 });
  b.bone('root', null, [0, 0, 0]);
  // the guard: a long bar across the hand, flared ends
  b.add('root', box([0, 0, 1.6], [1.6, 23, 1.4], { round: 0.6 }), 'fire');
  for (const k of [1, -1]) b.add('root', spike([0, k * 22, 1.6], [0, k, 0.5], 5, 1.8, 1.8), 'fire', { thr: 0.2 });
  // the blade: broad, tapering to the point, the edges in tongues
  b.add('root', fn((x, y, z) => {
    if (z < 3 || z > 125) return 1;
    const t = (z - 3) / 122;
    // the edges lick in tongues that lean back toward the hand
    const tongue = Math.max(0, Math.sin(z * 0.36 + (y > 0 ? 0 : 1.9))) * 2.6 * (1 - t * 0.4);
    const w = (7.0 * (1 - Math.pow(t, 2.0)) + 0.6) + tongue;
    const th = 1.8 * (1 - t * 0.5) + 0.3;
    return Math.max(Math.abs(y) - w, Math.abs(x) - th, 3 - z, z - 125);
  }, [-3, -12, 2], [3, 12, 126]), 'fire', { thr: 0.25 });
  // hotter toward the middle, the white-hot core down the centre
  b.paint('root', fn((_x, y, z) => Math.max(Math.abs(y) - 4.2 * (1 - (z - 3) / 150), 3 - z, z - 121), [-3, -12, 2], [3, 12, 126]), 'hot', {});
  b.paint('root', fn((_x, y, z) => Math.max(Math.abs(y) - 1.8 * (1 - (z - 3) / 150), 3 - z, z - 116), [-3, -12, 2], [3, 12, 126]), 'core', {});
  b.autoShade({ up: 0.2, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/**
 * The Vollständig halo at 48 vox/m: a spiky Zeichen — the five limbs of the star cross with a ring through them and
 * spikes standing out of the ring between the limbs. Faces +Z (a vertical disc).
 */
function buildHalo(): VoxelModel {
  const b = new ModelBuilder('bazzb-halo', 48);
  b.mat('halo', ['#FFD9A0', '#FF8A6A', '#F0503A', '#E3262F', '#B01820'], { base: 3, rough: 0.2, glow: 0.7, dither: 0 });
  b.bone('root', null, [0, 0, 0]);
  const R = 11;
  b.add('root', torus([0, 0, 0], R, 0.9, [90, 0, 0]), 'halo', { thr: 0.2 });
  // the star cross: up, the bar across, the two legs splaying down
  for (const a of [90, 0, 180, -55, -125]) {
    const r = (a * Math.PI) / 180;
    b.add('root', capsule([0, 0, 0], [Math.cos(r) * (R + 5), Math.sin(r) * (R + 5), 0], 1.3, 0.8), 'halo', { thr: 0.2 });
  }
  // spikes out of the ring between the limbs
  for (let i = 0; i < 10; i++) {
    const r = ((i + 0.5) / 10) * Math.PI * 2;
    b.add('root', spike([Math.cos(r) * (R - 0.4), Math.sin(r) * (R - 0.4), 0], [Math.cos(r), Math.sin(r), 0], 4.4, 1.3, 1.1, { side: [0, 0, 1], tip: 0.85 }), 'halo', { thr: 0.2 });
  }
  b.add('root', sphere([0, 0, 0], 2.2), 'halo');
  b.autoShade({ up: 0.2, open: 1, front: 0 });
  b.lint();
  return b.build();
}
