// Kannonbiraki Benihime Aratame (docs/roster/A3-urahara-shop-and-shiba.md §1, Look 4): the giant doll
// Benihime and the black curtain she leans out of. The doll is a colossal ball-jointed woman seen from the
// waist up — porcelain skin, a serene face with the eyes closed and red lips, black hair in a huge looped
// coiffure with long hanks down the sides, a crimson robe open over the chest with long draped sleeves,
// visible ball joints at the elbows and wrists, segmented fingers. Her hand alone is about Urahara's
// height. The curtain is black velvet hung in deep folds. Both are built at 8 vox/m.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, ellipsoid, fn, intersect, smoothPath, sphere, subtract, torus, tube, type V3 } from '../models/sdf';
import type { CharacterAsset } from './ichigo';

export const DOLL_RES = 8;

let dollCache: CharacterAsset | null = null;
let curtainCache: VoxelModel | null = null;

export function benihimeDoll(): CharacterAsset {
  return (dollCache ??= buildDoll());
}

export function benihimeCurtain(): VoxelModel {
  return (curtainCache ??= buildCurtain());
}

/**
 * The doll, in her own voxel space (8 vox/m): the waist at y = 0, the shoulders at y = 32, the crown of
 * the coiffure near y = 62. Facing +Z; +X is her left.
 */
function buildDoll(): CharacterAsset {
  const b = new ModelBuilder('benihime-doll', DOLL_RES);
  b.mat('porcelain', ['#F4EEE8', '#ECE4DD', '#E6DDD5', '#D2C7BF', '#BDB2AA'], { base: 1, rough: 0.35, shadeK: 0.85 });
  b.mat('joint', ['#B4AAA2', '#9E948C', '#857B74']);
  b.mat('hair', ['#3F2D42', '#2A2230', '#1E1B22', '#16161A'], { base: 2, rough: 0.4, shadeK: 0.85 });
  b.mat('robe', ['#C2404B', '#B2343F', '#8E1F2E', '#701826', '#5A1420'], { base: 2, rough: 0.7, shadeK: 0.9 });
  b.mat('robeIn', ['#5A1420', '#45101A']);
  b.mat('gold', ['#E8CC7A', '#C9A646', '#9C7E2E'], { base: 1, rough: 0.3, metal: 0.8 });
  b.mat('lid', ['#6E5A58']);
  b.mat('lips', ['#C0303C']);
  b.mat('brow', ['#2A2230']);
  b.bone('root', null, [0, 0, 0]);
  b.bone('torso', 'root', [0, 0, 0]);
  b.bone('head', 'torso', [0, 34, 0]);
  for (const k of [1, -1]) {
    const s = k > 0 ? 'L' : 'R';
    b.bone(`upperarm.${s}`, 'torso', [k * 14, 30, 0]);
    b.bone(`forearm.${s}`, `upperarm.${s}`, [k * 15, 13, 0]);
    b.bone(`hand.${s}`, `forearm.${s}`, [k * 15.5, -2, 0]);
  }

  // ---- the body: a slim porcelain torso, the robe open over the chest
  const torso = blend(4,
    box([0, 22, 0], [10, 9, 6.5], { round: 5 }),
    box([0, 8, 0], [8, 9, 5.6], { round: 4.5 }),
    sphere([12, 29, 0], 4.2), sphere([-12, 29, 0], 4.2),
    ellipsoid([4.4, 22, 4.6], [4.2, 4, 3]), ellipsoid([-4.4, 22, 4.6], [4.2, 4, 3]));
  b.add('torso', torso, 'porcelain');
  b.add('torso', capsule([0, 30, -0.5], [0, 36, -0.5], 3.4), 'porcelain');
  // the robe: a shell over the torso, open in a deep V over the chest
  const robe = subtract(
    blend(4, box([0, 21, -0.2], [11.5, 10.5, 8], { round: 5.5 }), box([0, 6, 0], [10.5, 10, 7.4], { round: 5 })),
    blend(4, box([0, 21, -0.2], [10.2, 9.6, 6.8], { round: 5 }), box([0, 6, 0], [8.8, 9.4, 6.2], { round: 4.5 })),
    fn((x, y, z) => (z < 0 ? 1 : Math.abs(x) - (0.6 + Math.max(0, y - 6) * 0.42)), [-14, 4, 0], [14, 40, 12]),
  );
  b.add('torso', intersect(robe, aabb([-20, -6, -20], [20, 31.5, 20])), 'robe');
  b.paint('torso', fn((x, y, z) => (z < 0 ? 1 : Math.abs(Math.abs(x) - (0.6 + Math.max(0, y - 6) * 0.42)) - 1.1), [-14, 4, 0], [14, 40, 12]), 'robeIn', { where: b.isMat('robe') });
  // a gold sash high on the waist
  b.add('torso', intersect(subtract(box([0, 4, 0], [11.2, 2.2, 7.8], { round: 5 }), box([0, 4, 0], [10, 4, 6.6], { round: 4.5 })), aabb([-20, 1.8, -20], [20, 6.2, 20])), 'gold');
  // the collar standing round the back of the neck
  b.add('torso', intersect(subtract(ellipsoid([0, 31, -1], [8, 6, 7]), ellipsoid([0, 31, -1], [6.4, 7, 5.6])), aabb([-20, 29, -20], [20, 37, 1.5])), 'robe');

  // ---- the head: an oval porcelain face, eyes closed, red lips; the coiffure of looped black hair
  const hc: V3 = [0, 44, 0.4];
  b.add('head', blend(2, ellipsoid(hc, [6, 7.6, 6.4]), ellipsoid([0, 39.5, 1.6], [4.2, 3.6, 4.4])), 'porcelain');
  const fz = (x: number, y: number) => {
    for (let z = 10; z > -2; z -= 0.25) if (b.grid('head').get(Math.round(x), Math.round(y), Math.round(z)) !== 0) return Math.round(z);
    return 6;
  };
  // the closed eyes: two downward-curving lid lines with a lash at the outer corner; thin brows
  for (const k of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const x = k * (1.6 + i * 0.8);
      const y = 44 - Math.sin((i / 4) * Math.PI) * 0.6;
      b.voxel('head', Math.round(x), Math.round(y), fz(x, y), 'lid', 0);
    }
    b.voxel('head', Math.round(k * 5.4), 43, fz(k * 5.4, 43), 'lid', 0);
    for (let i = 0; i < 4; i++) b.voxel('head', Math.round(k * (1.8 + i * 0.9)), 47 + (i === 1 || i === 2 ? 1 : 0), fz(k * (1.8 + i * 0.9), 47), 'brow', 0);
  }
  for (const x of [-1, 0, 1]) b.voxel('head', x, 38, fz(x, 38), 'lips', 0);
  b.voxel('head', 0, 37, fz(0, 37), 'lips', 0);
  b.voxel('head', 0, 41, fz(0, 41) + 1, 'porcelain', 1);
  // the coiffure: hair over the crown, a huge looped knot on top, side loops, long hanks down the sides
  b.add('head', subtract(ellipsoid([0, 46, -0.6], [6.8, 7.4, 7.2]), aabb([-5.2, 36, 1.5], [5.2, 47.5, 12]), aabb([-12, 30, -12], [12, 41, 12])), 'hair');
  b.add('head', torus([0, 56, -1], 5.2, 2.2, [90, 0, 0]), 'hair', { thr: 0.2 });
  b.add('head', torus([0, 55, -1], 3.6, 1.8, [0, 0, 0]), 'hair', { thr: 0.2 });
  for (const k of [-1, 1]) {
    b.add('head', torus([k * 7.2, 51, -1.5], 3.4, 1.6, [0, 90, 18 * k]), 'hair', { thr: 0.2 });
    const hank = smoothPath([[k * 6, 44, 1], [k * 7.2, 38, 1.2], [k * 7.6, 30, 0.4], [k * 7.4, 22, -0.6]], 4);
    b.add('head', tube(hank, hank.map((_, i) => 2.2 - i * 0.08)), 'hair', { thr: 0.25 });
  }
  b.add('head', ellipsoid([0, 50, -5.5], [5.4, 5, 3.6]), 'hair');
  // ornaments: gold pins through the knot
  for (const k of [-1, 1]) b.add('head', capsule([k * 2.5, 57.5, 2], [k * 6.5, 61, -3], 0.55), 'gold', { thr: 0.2 });

  // ---- the arms: porcelain with ball joints, the robe's long sleeves draped from the upper arms
  for (const k of [1, -1]) {
    const s = k > 0 ? 'L' : 'R';
    const sh: V3 = [k * 14, 30, 0], el: V3 = [k * 15, 13, 0], wr: V3 = [k * 15.5, -2, 0];
    b.add(`upperarm.${s}`, capsule(sh, [el[0], el[1] + 1.5, el[2]], 3.2, 2.7), 'porcelain');
    b.add(`upperarm.${s}`, sphere(sh, 4), 'robe');
    // the long sleeve hangs from the upper arm in a wide bag
    b.add(`upperarm.${s}`, subtract(
      blend(2, ellipsoid([k * 15.5, 16, -3], [6.5, 12, 6.8]), ellipsoid([k * 14.5, 26, -1], [5.4, 6, 5.4])),
      ellipsoid([k * 15.5, 6, -3], [5, 7, 5.4])), 'robe', { thr: 0.25 });
    b.paint(`upperarm.${s}`, fn((x, y) => y - 6.5, [-30, 2, -14], [30, 30, 14]), 'robeIn', { where: b.isMat('robe') });
    b.add(`forearm.${s}`, sphere(el, 2.9), 'joint');
    b.add(`forearm.${s}`, capsule([el[0], el[1] - 1.5, el[2]], [wr[0], wr[1] + 1.4, wr[2]], 2.5, 2.0), 'porcelain');
    // the hand: palm and segmented fingers, a ball joint at the wrist
    b.add(`hand.${s}`, sphere(wr, 2.2), 'joint');
    b.add(`hand.${s}`, box([wr[0], wr[1] - 5, wr[2] + 0.4], [1.5, 3.4, 3], { round: 1.2 }), 'porcelain');
    for (let i = 0; i < 4; i++) {
      const z = wr[2] - 2 + i * 1.5;
      const f0: V3 = [wr[0], wr[1] - 8, z], f1: V3 = [wr[0], wr[1] - 11, z + 0.2], f2: V3 = [wr[0] - k * 0.3, wr[1] - 13.5 + (i === 0 || i === 3 ? 1 : 0), z + 0.4];
      b.add(`hand.${s}`, capsule(f0, f1, 0.75), 'porcelain');
      b.add(`hand.${s}`, capsule(f1, f2, 0.65), 'porcelain');
      b.add(`hand.${s}`, sphere(f1, 0.85), 'joint');
    }
    b.add(`hand.${s}`, capsule([wr[0] - k * 0.6, wr[1] - 3, wr[2] + 3], [wr[0] - k * 1.4, wr[1] - 7.5, wr[2] + 4.6], 0.85, 0.7), 'porcelain');
  }
  b.autoShade();
  b.lint();
  return { model: b.build(), springs: [], colliders: [], warnings: b.warnings };
}

/** The curtain: black velvet in deep vertical folds, 12 m wide and 12.5 m tall, hung from a dark rod. Origin at the bottom centre. */
function buildCurtain(): VoxelModel {
  const b = new ModelBuilder('benihime-curtain', DOLL_RES);
  b.mat('velvet', ['#3A3A44', '#2A2A32', '#1E1E24', '#16161A'], { base: 2, rough: 0.95, shadeK: 0.9 });
  b.mat('rod', ['#4A3A30', '#3A2E28', '#2A221E'], { base: 1, rough: 0.5 });
  b.bone('root', null, [0, 0, 0]);
  const W = 48, H = 100;
  b.add('root', fn((x, y, z) => {
    if (y < 0 || y > H || Math.abs(x) > W) return 1;
    // deep folds, a little deeper toward the hem; a slit up the middle where she leans through
    const fold = Math.sin(x * 0.45) * (1.6 + (1 - y / H) * 1.4);
    const slit = Math.abs(x) < 1.2 && y < H * 0.82 ? 1 : 0;
    return slit ? 1 : Math.abs(z - fold) - 0.9;
  }, [-W - 1, -1, -6], [W + 1, H + 1, 6]), 'velvet', { thr: 0.2 });
  b.add('root', capsule([-W - 2, H + 1, 0], [W + 2, H + 1, 0], 1.6), 'rod');
  b.autoShade({ up: 0.3, open: 2, front: 0 });
  b.lint();
  return b.build();
}
