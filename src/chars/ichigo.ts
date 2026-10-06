// Ichigo Kurosaki — Substitute Shinigami. Palette and construction from docs/roster/A1-ichigo.md
// (colours ×, sizes ×1.5 from the 32/m dossier to 48/m) and the voxel-art skill (characters.md).
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, box, capsule, fn, intersect, prism, type V3 } from '../models/sdf';
import {
  SPEC_ADULT_MALE, faceLegend, feet, hakama, hands, head, humanoidSkeleton, kosodeSleeves, kosodeTorso, obi,
  shihakushoSprings, spikyHair, type Clump, type Landmarks,
} from './humanoid';
import type { SpringDef, ColliderDef } from '../anim/springs';

export type IchigoForm = 'shikai' | 'bankai';

function palette(b: ModelBuilder): void {
  b.mat('skin', ['#F7D9C4', '#E9BBA0', '#C08A74', '#8E5F50'], { base: 1, rough: 0.7, dither: 0.08 });
  b.mat('hair', ['#FFC867', '#FFAD4C', '#F7962F', '#E8792A', '#C2591B', '#8F3E13'], { base: 2, rough: 0.65, shadeK: 1.25 });
  b.mat('brow', ['#C8661F']);
  b.mat('lid', ['#1B120C']);
  b.mat('sclera', ['#F4F1EC'], { rough: 0.4 });
  b.mat('iris', ['#7A4A2C'], { rough: 0.3 });
  b.mat('irisD', ['#3E2414'], { rough: 0.3 });
  b.mat('hi', ['#F7F2EA'], { rough: 0.2 });
  b.mat('mouth', ['#9E5F52']);
  b.mat('black', ['#4A4956', '#3A3944', '#24232B', '#141418', '#0C0C0F'], { base: 2, rough: 0.92, shadeK: 1.1 });
  b.mat('collar', ['#F7F5F1', '#ECE9E4', '#B9B5AF'], { base: 1, rough: 0.85 });
  b.mat('obi', ['#F2EFEA', '#E6E3DD', '#B8B4AC'], { base: 1, rough: 0.85 });
  b.mat('tabi', ['#F7F6F3', '#EEECE8', '#C9C6BF'], { base: 1, rough: 0.85 });
  b.mat('straw', ['#CDB683', '#B59C6A', '#8A6A3E'], { base: 1, rough: 0.95 });
  b.mat('cord', ['#8A6A3E', '#5E4526'], { base: 0 });
  b.mat('red', ['#C9403F', '#A3242B', '#6A1419'], { base: 1, rough: 0.6 });
  b.mat('seam', ['#3E0C10']);
}

const HAIR: Clump[] = [
  // bangs: short, over the forehead, one lock dropping between the eyes
  { az: -30, el: 30, dir: [-0.35, -0.8, 0.55], len: 4.5, r: 2.1 },
  { az: -9, el: 36, dir: [-0.12, -0.8, 0.6], len: 6.5, r: 2.3, tip: 0.5 },
  { az: 12, el: 34, dir: [0.2, -0.8, 0.55], len: 5, r: 2.2 },
  { az: 34, el: 28, dir: [0.45, -0.75, 0.5], len: 4.5, r: 2 },
  // front-top spikes, swept up/forward
  { az: -18, el: 54, dir: [-0.25, 0.55, 0.8], len: 6.5, r: 2.6, bend: [0, 0.4, -0.2] },
  { az: 22, el: 57, dir: [0.3, 0.6, 0.75], len: 6.5, r: 2.6, bend: [0, 0.4, -0.2] },
  // crown: tall spikes up and back
  { az: 0, el: 78, dir: [0.05, 1, -0.25], len: 7.5, r: 3 },
  { az: -62, el: 64, dir: [-0.65, 0.75, -0.15], len: 7.5, r: 2.8 },
  { az: 62, el: 64, dir: [0.65, 0.72, -0.1], len: 7, r: 2.8 },
  { az: 180, el: 58, dir: [0, 0.65, -0.8], len: 8, r: 2.9 },
  { az: -130, el: 52, dir: [-0.55, 0.45, -0.7], len: 7, r: 2.6 },
  { az: 128, el: 54, dir: [0.6, 0.45, -0.65], len: 7.5, r: 2.6 },
  { az: -165, el: 70, dir: [-0.2, 0.9, -0.5], len: 6, r: 2.6 },
  // sides: out and down over the ears
  { az: -96, el: 24, dir: [-0.85, -0.3, 0.15], len: 5.5, r: 2.3 },
  { az: -112, el: 4, dir: [-0.55, -0.8, -0.1], len: 5.5, r: 2.1 },
  { az: 96, el: 24, dir: [0.85, -0.25, 0.15], len: 6, r: 2.3 },
  { az: 114, el: 4, dir: [0.55, -0.8, -0.1], len: 5, r: 2.1 },
  // nape
  { az: 158, el: 8, dir: [0.25, -0.6, -0.75], len: 6, r: 2.3 },
  { az: -164, el: 4, dir: [-0.25, -0.65, -0.7], len: 6.5, r: 2.3 },
  { az: 180, el: 28, dir: [0.05, -0.15, -1], len: 5, r: 2.6 },
];

/** T2 scowl (characters.md §2.2), rows 9 → 0 of the 12-row adult male head. */
const FACE = [
  '. . . . . . . . . .',
  '. b B . . . . B b .',
  '. L L B s s B L L .',
  '. W * I . . * I W .',
  '. W i i . . i i W .',
  '. . . . . . . . . .',
  '. . . . . s . . . .',
  '. . . . . . . . . .',
  '. . . s m m s . . .',
  '. . . . . . . . . .',
];

/** Red kite-link strap (Shikai v1): right shoulder → left hip, around the back. */
function kiteStrap(b: ModelBuilder): void {
  const A: V3 = [-5, 70.5, 0]; // over the right trapezius
  const B: V3 = [9.5, 47.5, 0]; // left hip
  const ab = [B[0] - A[0], B[1] - A[1]];
  const abl = Math.hypot(ab[0], ab[1]);
  const t = [ab[0] / abl, ab[1] / abl];
  const n = [-t[1], t[0]]; // in-plane normal (x, y)
  const half = 1.85;
  const link = 4.6;
  const kite = (u: number) => (u < 0.18 ? 0.55 : u < 0.4 ? 0.55 + ((u - 0.18) / 0.22) * 0.45 : 1 - ((u - 0.4) / 0.6) * 0.55);
  const set = (bone: string, x: number, y: number, z: number, mat: string, shade: number) => b.grid(bone).set(x, y, z, b.val(mat, shade));
  b.surfaceVoxels(['chest', 'spine', 'hips'], [-12, 44, -9], [12, 74, 9], (bone, x, y, z, nx, ny, nz) => {
    const px = x + 0.5 - A[0], py = y + 0.5 - A[1];
    const w = px * n[0] + py * n[1];
    if (Math.abs(w) > half) return;
    if (ny > 0 && Math.abs(w) > half - 0.5) return;
    const s = (px * t[0] + py * t[1]) * (z >= 0 ? 1 : -1) + 60;
    const u = (s % link) / link;
    const wn = Math.abs(w) / half;
    const ox = x + nx, oy = y + ny, oz = z + nz;
    if (wn <= kite(u)) {
      const shade = u < 0.3 ? 0 : u > 0.78 ? 2 : 1;
      set(bone, x, y, z, 'red', shade);
      set(bone, ox, oy, oz, 'red', shade); // raised 1 voxel
    } else if (wn < 0.35) {
      set(bone, x, y, z, 'seam', 0); // connector between links
    } else {
      set(bone, x, y, z, 'seam', 0);
    }
  });
}

export interface CharacterAsset {
  model: VoxelModel;
  springs: SpringDef[];
  colliders: ColliderDef[];
  warnings: string[];
}

export function buildIchigo(form: IchigoForm = 'shikai'): CharacterAsset {
  const b = new ModelBuilder(`ichigo-${form}`, 48);
  palette(b);
  const s = SPEC_ADULT_MALE;
  const L: Landmarks = humanoidSkeleton(b, s, { sleeves: true, hakama: true });
  // sockets: sword grips through the fists (grip axis = +Z), sheath on the back
  b.socket('grip.R', 'fist.R', [-L.wrist[0] + 0.1, L.wrist[1] - 4.3, L.wrist[2] + 0.4]);
  b.socket('grip.L', 'fist.L', [L.wrist[0] - 0.1, L.wrist[1] - 4.3, L.wrist[2] + 0.4]);
  b.socket('back', 'chest', [1, 62, -7.5], [0, 0, 0]);
  b.socket('head.top', 'head', [0, 86, 0]);
  b.socket('chest.front', 'chest', [0, 61, 7]);

  const hd = head(b, L, 'skin');
  b.stamp('head', hd.x0, hd.chin + 9, FACE, faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), 30);
  // nose: a 1-voxel bump
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  spikyHair(b, L, 'hair', HAIR);
  // the bangs must not hide the eyes: clear hair in front of the eye rows
  b.carve('head', aabb([-4, hd.chin + 5, hd.front - 0.5], [-1, hd.chin + 7, hd.front + 4]));
  b.carve('head', aabb([1, hd.chin + 5, hd.front - 0.5], [4, hd.chin + 7, hd.front + 4]));

  const o = { black: 'black', collar: 'collar', skin: 'skin', obi: 'obi' };
  kosodeTorso(b, L, o);
  kosodeSleeves(b, L, o);
  obi(b, L, o);
  hakama(b, L, o);
  hands(b, L, 'skin');
  feet(b, L, 'tabi', 'straw', 'cord');
  if (form === 'shikai') kiteStrap(b);

  b.autoShade();
  b.lint();
  const { springs, colliders } = shihakushoSprings();
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

/**
 * Zangetsu, Shikai v1: khyber-knife cleaver as tall as Ichigo (≈1.7 m), no guard, cloth-wrapped tang.
 * Local frame: origin at the grip centre, blade along +Z, edge toward −Y, flat faces ±X.
 */
export function buildZangetsuShikai(): VoxelModel {
  const b = new ModelBuilder('zangetsu-shikai', 48);
  b.mat('spine', ['#45454D', '#2B2B31', '#17171B'], { base: 1, rough: 0.35, metal: 0.6, shadeK: 0.6 });
  b.mat('steel', ['#F5F6F8', '#DADDE2', '#A3A8B1'], { base: 1, rough: 0.22, metal: 0.9, shadeK: 0.6 });
  b.mat('glint', ['#FFFFFF'], { rough: 0.1, metal: 1 });
  b.mat('cloth', ['#F2EFE9', '#E8E4DC', '#C9CDD3', '#A9B3BE'], { base: 1, rough: 0.9 });
  b.bone('root', null, [0, 0, 0]);
  const z0 = 5.5, zEdgeEnd = 66, zTip = 75.5;
  const yS = 5, yE = -5.5;
  // outline in the (z, y) plane, thickness tapering from the spine (3) to the edge (1)
  const outline = prism([[z0, yE], [zEdgeEnd, yE], [zTip, yS], [z0, yS]], [0, 0, 0], [0, 0, 1], [0, 1, 0], 1.6);
  const bevel = fn((x, y) => Math.abs(x) - (0.55 + Math.max(0, Math.min(1, (y - yE) / ((yS - yE) * 0.55))) * 1.0), [-2, -7, 0], [2, 7, 80]);
  const blade = intersect(outline, bevel);
  b.add('root', blade, 'spine');
  // silver bevel on the edge half, glint along the very edge
  b.paint('root', fn((x, y, z) => y - (yE + 0.5 + (yS - yE) * 0.45 + Math.max(0, z - zEdgeEnd) * 0.9), [-3, -7, 0], [3, 7, 80]), 'steel');
  b.paint('root', fn((x, y, z) => y - (yE + 1.05 + Math.max(0, z - zEdgeEnd) * ((yS - yE) / (zTip - zEdgeEnd))), [-3, -7, 0], [3, 7, 80]), 'glint');
  // tang wrapped in cloth, through the fist
  b.add('root', box([0, -0.2, -0.5], [1.4, 1.6, 6.5], { round: 0.6 }), 'cloth');
  b.add('root', box([0, -0.2, 4.6], [1.6, 2.2, 1.2], { round: 0.5 }), 'cloth');
  // diagonal wrap bands
  b.paint('root', fn((x, y, z) => Math.cos((z + y * 0.8) * 1.4), [-2, -3, -8], [2, 3, 6.5]), 'cloth', { shade: 2, where: b.isMat('cloth') });
  // butt knot with a short tail (the long streamer is a ribbon effect)
  b.add('root', box([0, -0.6, -7.2], [1.7, 1.9, 0.9], { round: 0.6 }), 'cloth', { shade: 2 });
  b.add('root', capsule([0, -1.2, -7.6], [0, -5, -9.5], 1.1, 0.7), 'cloth', { thr: 0.25 });
  b.autoShade({ up: 0.4, open: 2.2, front: 0 });
  b.lint();
  return b.build();
}

/** Sanity numbers for tests/QA. */
export function ichigoStats(a: CharacterAsset): { voxels: number; bones: number } {
  let voxels = 0;
  a.model.grids.forEach((g) => (voxels += g.count()));
  return { voxels, bones: a.model.bones.length };
}
