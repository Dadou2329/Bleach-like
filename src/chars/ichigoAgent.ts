// Agent of the Shinigami Ichigo's props (docs/kits/ichigo.md §4 Agent; dossier A1 §1 Weapons, looks #1-#2). Brief:
// the first sword, Rukia's power made into a plain katana scaled up to his height — 1.65 m (79 vox at 48/m): a 1.3 m
// blade with a slight curve and a rounded point, a brass collar, a rectangular bronze guard with a flame motif on its
// long sides and inward-curved short sides, a red-wrapped grip over white rayskin, a bronze cap and two light-blue
// tassels; its oversized brown lacquered sheath (1.4 m) slung on his back; and the wooden baseball bat of the first
// night. Props face +Z (blade / barrel along +Z, the edge toward −Y), the grip at the origin.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { box, capsule, cylinder, fn } from '../models/sdf';

/** the first sword's blade, base and point (m along +Z) */
export const FIRST_BASE_Z = 7 / 48;
export const FIRST_TIP_Z = 69 / 48;
/** the bat's barrel (m along +Z) */
export const BAT_BASE_Z = 6 / 48;
export const BAT_TIP_Z = 35 / 48;

/** how the empty sheath hangs on the 'back' socket: the mouth over the right shoulder, slanting down to the left hip */
export const SHEATH_ON_BACK = { pos: [-0.12, 0.17, -0.05] as const, dir: [0.6, -0.78, -0.12] as const };

const Z0 = 7, ZK = 61, ZT = 69;
/** the blade's curve: the spine rises toward the point */
const sori = (z: number) => 2.4 * Math.pow(Math.max(0, Math.min(1, (z - Z0) / (ZT - Z0))), 2);
/** the edge line: straight to the point's shoulder, then the rounded point closes onto the spine */
const edgeY = (z: number) => {
  if (z <= ZK) return -2.1;
  const t = Math.min(1, (z - ZK) / (ZT - ZK));
  return 2.1 - 4.2 * Math.sqrt(1 - t * t);
};

let swordModel: VoxelModel | null = null;
let sheathModel: VoxelModel | null = null;
let batModel: VoxelModel | null = null;

export function firstSword(): VoxelModel {
  return (swordModel ??= buildFirstSword());
}

export function firstSheath(): VoxelModel {
  return (sheathModel ??= buildFirstSheath());
}

export function baseballBat(): VoxelModel {
  return (batModel ??= buildBat());
}

function buildFirstSword(): VoxelModel {
  const b = new ModelBuilder('first-sword', 48);
  b.mat('steel', ['#EEF0F3', '#D3D7DD', '#AEB4BD', '#8A919C'], { base: 1, rough: 0.2, metal: 0.85, shadeK: 0.6 });
  b.mat('hamon', ['#F3F3F0'], { rough: 0.15, metal: 0.7 });
  b.mat('ridge', ['#7E858F', '#646B76'], { base: 0, rough: 0.25, metal: 0.8 });
  b.mat('brass', ['#E2C477', '#C9A85E', '#9C7E3E'], { base: 1, rough: 0.35, metal: 0.7 });
  b.mat('bronze', ['#B89A5C', '#8E7543', '#5D4A26'], { base: 1, rough: 0.45, metal: 0.65 });
  b.mat('ito', ['#B0303A', '#8E2028', '#5E141A'], { base: 1, rough: 0.85 });
  b.mat('same', ['#ECE6D9', '#D8D0BF'], { base: 0, rough: 0.7 });
  b.mat('tassel', ['#A8DCF2', '#8CC8E8', '#5E9FC4'], { base: 1, rough: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  // the blade: an approximate distance — inside the edge and spine lines, thicker at the spine
  b.add('root', fn((x, y, z) => {
    const yc = y - sori(z);
    const e = edgeY(z);
    const k = Math.max(0, Math.min(1, (yc - e) / Math.max(0.3, 2.1 - e)));
    const thick = 0.32 + 0.5 * k;
    return Math.max(e - yc, yc - 2.1, Math.abs(x) - thick, Z0 - z, z - ZT);
  }, [-2, -3, Z0 - 1], [2, 6, ZT + 1]), 'steel');
  // the spine ridge, and the temper line wavering along the edge
  b.paint('root', fn((_x, y, z) => 1.5 - (y - sori(z)), [-2, -3, Z0], [2, 6, ZT]), 'ridge');
  b.paint('root', fn((_x, y, z) => {
    const yc = y - sori(z) - edgeY(z);
    const band = 1.05 + 0.35 * Math.sin(z * 0.9) + 0.2 * Math.sin(z * 2.3);
    return Math.abs(yc - band) - 0.28;
  }, [-2, -3, Z0], [2, 6, ZK + 4]), 'hamon');
  // the brass collar and the guard: a bronze rectangle, the short sides curved in, the flame motif along the long sides
  b.add('root', box([0, 0.1, 6.6], [1, 2.6, 0.9], { round: 0.3 }), 'brass');
  b.add('root', box([0, 0.3, 5.4], [3.1, 4.2, 0.55], { round: 0.7 }), 'bronze');
  b.carve('root', cylinder([0, 5.2, 4.6], [0, 5.2, 6.2], 1.3));
  b.carve('root', cylinder([0, -4.6, 4.6], [0, -4.6, 6.2], 1.3));
  b.paint('root', fn((x, y) => Math.abs(Math.abs(x) - 2.2) - 0.45 + 0.35 * Math.sin(y * 2.1), [-4, -5, 4.5], [4, 5, 6.5]), 'bronze', { shade: 0 });
  b.paint('root', fn((x, y) => Math.abs(Math.abs(x) - 1.5) - 0.3 + 0.3 * Math.cos(y * 2.6), [-4, -5, 4.5], [4, 5, 6.5]), 'bronze', { shade: 2 });
  // the grip: red cord over white rayskin, the diamonds of skin showing between the crossings
  b.add('root', box([0, 0, -4.6], [1.35, 1.75, 9.4], { round: 0.8 }), 'ito');
  b.paint('root', fn((_x, y, z) => {
    const a = Math.abs((((z + y * 1.1) % 3.2) + 3.2) % 3.2 - 1.6);
    const c = Math.abs((((z - y * 1.1) % 3.2) + 3.2) % 3.2 - 1.6);
    return 0.55 - Math.min(a, c);
  }, [-2, -2.5, -13.5], [2, 2.5, 4.4]), 'same', { where: b.isMat('ito') });
  // the bronze cap and the two light-blue tassels
  b.add('root', box([0, 0, -14.4], [1.6, 2, 0.8], { round: 0.5 }), 'bronze');
  b.add('root', capsule([0, -0.6, -15], [0.4, -5.4, -17.4], 0.65, 0.45), 'tassel', { thr: 0.25 });
  b.add('root', capsule([0, -0.4, -15], [-0.6, -4.6, -16.2], 0.6, 0.45), 'tassel', { thr: 0.25 });
  b.autoShade({ up: 0.4, open: 2.2, front: 0 });
  b.lint();
  return b.build();
}

function buildFirstSheath(): VoxelModel {
  const b = new ModelBuilder('first-sheath', 48);
  b.mat('saya', ['#8A6240', '#6B4A2E', '#4E3520', '#3A2716'], { base: 1, rough: 0.45, shadeK: 0.8 });
  b.mat('band', ['#3E2A1A', '#2C1D12'], { base: 0, rough: 0.6 });
  b.mat('bronze', ['#B89A5C', '#8E7543', '#5D4A26'], { base: 1, rough: 0.45, metal: 0.65 });
  b.bone('root', null, [0, 0, 0]);
  // a long lacquered case following the blade's curve, its mouth at the origin
  b.add('root', fn((x, y, z) => {
    const yc = y - sori(z + 7) * 0.9;
    return Math.max(Math.abs(x) - 1.25, Math.abs(yc - 0.1) - 3, -z, z - 66);
  }, [-2, -4, -1], [2, 7, 67]), 'saya');
  // the mouth band, a band a third of the way down (where the strap's cord ties), the end cap
  b.paint('root', fn((_x, _y, z) => Math.abs(z - 1.2) - 1.2, [-2, -4, -1], [2, 7, 4]), 'band');
  b.paint('root', fn((_x, _y, z) => Math.abs(z - 17) - 1, [-2, -4, 14], [2, 7, 20]), 'band');
  b.add('root', box([0, 0.1 + sori(73) * 0.9, 66.2], [1.45, 3.2, 1.1], { round: 0.6 }), 'bronze');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

function buildBat(): VoxelModel {
  const b = new ModelBuilder('baseball-bat', 48);
  b.mat('wood', ['#E8CC98', '#D2B07A', '#B38E5A', '#8E6C40'], { base: 1, rough: 0.55, shadeK: 0.8 });
  b.mat('tape', ['#3A3A42', '#26262C'], { base: 0, rough: 0.9 });
  b.bone('root', null, [0, 0, 0]);
  // the knob, the taped handle, the long taper to the barrel and its rounded end
  b.add('root', cylinder([0, 0, -6.6], [0, 0, -5.6], 1.5, 1.5, 0.4), 'wood');
  b.add('root', cylinder([0, 0, -5.8], [0, 0, 8], 0.95, 1.05), 'tape');
  b.add('root', cylinder([0, 0, 8], [0, 0, 22], 1.05, 1.65), 'wood');
  b.add('root', capsule([0, 0, 22], [0, 0, 33.5], 1.7, 1.75), 'wood');
  b.paint('root', fn((_x, _y, z) => Math.abs(z - 27) - 2.5, [-3, -3, 22], [3, 3, 32]), 'wood', { shade: 0 });
  b.autoShade({ up: 0.5, open: 2, front: 0 });
  b.lint();
  return b.build();
}
