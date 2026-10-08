// Nejibana (捩花), Kaien Shiba's Zanpakutō (docs/roster/A3-urahara-shop-and-shiba.md §7; Aaroniero wields it with his
// face, E2 §5). Sealed: a plain katana with a square gold guard with cut corners and wave reliefs, a dark-blue wrap
// with gold diamonds, a brown sheath. Released ("Suiten sakamake, Nejibana"): a 2.4 m silver trident — a leaf-shaped
// central head narrowing at the middle, two side blades curving outward each joined to it by two bars, a thick blue
// tassel under the head, a corkscrew butt. All at 48 vox/m.
// (verify) the sheath colour (brown in the anime, dark blue in the colour manga).
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { box, capsule, cylinder, fn, intersect, smoothPath, sphere, spike, tube, blend } from '../models/sdf';

export type NejibanaProp = 'katana' | 'sheath' | 'sheath-empty' | 'trident';

const cache = new Map<NejibanaProp, VoxelModel>();

export function nejibanaProp(kind: NejibanaProp): VoxelModel {
  let m = cache.get(kind);
  if (!m) {
    m = kind === 'katana' ? buildKatana() : kind === 'sheath' ? buildSheath(true) : kind === 'sheath-empty' ? buildSheath(false) : buildNejibana();
    cache.set(kind, m);
  }
  return m;
}

/** blade sample points (prop frame, m): the sealed katana and the trident's central head */
export const KATANA_BASE_Z = 5 / 48;
export const KATANA_TIP_Z = 38 / 48;
export const NEJIBANA_BASE_Z = 50 / 48;
export const NEJIBANA_TIP_Z = 82 / 48;
/** the trident's butt end (prop frame, m) */
export const NEJIBANA_BUTT_Z = -33 / 48;

/** the square gold guard with cut corners and wave reliefs */
function waveGuard(b: ModelBuilder, z: number): void {
  b.add('root', intersect(box([0, 0, z], [3.2, 3.2, 0.6], { round: 0.3 }), fn((x, y) => Math.abs(x) + Math.abs(y) - 5.2, [-4, -4, z - 1], [4, 4, z + 1])), 'guard');
  b.paint('root', fn((x, y, zz) => Math.max(Math.abs(Math.sin(x * 1.3) * 1.2 - y) - 0.35, Math.abs(zz - z) - 0.7), [-4, -4, z - 1], [4, 4, z + 1]), 'guard', { shade: 3, where: b.isMat('guard') });
}

/** Nejibana sealed: a plain katana, the gold guard, the dark-blue wrap with gold diamonds. */
function buildKatana(): VoxelModel {
  const b = new ModelBuilder('nejibana-sealed', 48);
  b.mat('steel', ['#E8EBEF', '#C8D0D8', '#AEB6BF', '#8E959E'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#EEF3F7'], { rough: 0.12, metal: 0.8 });
  b.mat('wrap', ['#2A3A70', '#1E2A55', '#11141D'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#C9A646']);
  b.mat('guard', ['#E0C060', '#C9A646', '#8E7430'], { base: 1, rough: 0.35, metal: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  const z0 = 5, zTip = 38, zEnd = zTip - 3;
  const curve = (z: number) => Math.max(0, z - z0) ** 2 * 0.0009;
  b.add('root', fn((x, y, z) => {
    if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
    const cv = curve(z);
    const top = 0.9 + cv, bot = -1.1 + cv + Math.max(0, z - zEnd) * 0.66;
    return Math.max(Math.abs(x) - 0.5, y - top, bot - y, z0 - z, z - zTip);
  }, [-2, -3, z0 - 1], [2, 3, zTip + 1]), 'steel', { thr: 0.3 });
  b.paint('root', fn((_x, y, z) => y - (-0.62 + curve(z) + Math.max(0, z - zEnd) * 0.66), [-2, -3, 0], [2, 3, zTip + 1]), 'edge');
  waveGuard(b, 4);
  b.add('root', box([0, 0, -0.6], [1.05, 1.2, 4], { round: 0.5 }), 'wrap');
  b.paint('root', fn((_x, y, z) => Math.abs(((Math.abs(y) + z) % 2.6 + 2.6) % 2.6 - 1.3) - 0.42, [-2, -2, -5], [2, 2, 3.4]), 'ray', { where: b.isMat('wrap') });
  b.add('root', cylinder([0, 0, -4.6], [0, 0, -5.6], 1.15, 1.0, 0.3), 'guard');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** The brown sheath (with the sword in it, or empty). */
function buildSheath(full: boolean): VoxelModel {
  const b = new ModelBuilder(full ? 'nejibana-sheath-full' : 'nejibana-sheath', 48);
  b.mat('lacquer', ['#8A6442', '#6B4A30', '#4E3622', '#3A281A'], { base: 1, rough: 0.4 });
  b.mat('wrap', ['#2A3A70', '#1E2A55', '#11141D'], { base: 1, rough: 0.85 });
  b.mat('guard', ['#E0C060', '#C9A646', '#8E7430'], { base: 1, rough: 0.35, metal: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  const Ls = 34;
  b.add('root', box([0, 0, Ls / 2], [0.95, 1.45, Ls / 2], { round: 0.6 }), 'lacquer');
  b.add('root', box([0, 0, Ls - 0.6], [1.1, 1.6, 0.7], { round: 0.5 }), 'guard');
  if (full) {
    waveGuard(b, -0.6);
    b.add('root', box([0, 0, -5.6], [1.05, 1.2, 4.2], { round: 0.5 }), 'wrap');
    b.add('root', cylinder([0, 0, -9.8], [0, 0, -10.8], 1.15, 1.0, 0.3), 'guard');
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * Nejibana released: a 2.4 m silver trident. The shaft along +Z, the grip at the origin; the leaf-shaped central head,
 * two side blades curving outward each joined to it by two bars, the thick blue tassel under the head, the
 * corkscrew butt.
 */
function buildNejibana(): VoxelModel {
  const b = new ModelBuilder('nejibana', 48);
  b.mat('steel', ['#D3DAE1', '#BCC4CD', '#8C95A2', '#676B73', '#4A4E58'], { base: 1, rough: 0.34, metal: 0.8, shadeK: 0.65 });
  b.mat('edge', ['#DCE3E9'], { rough: 0.28, metal: 0.75 });
  b.mat('shaft', ['#B9C0C8', '#8C95A2', '#676B73'], { base: 1, rough: 0.3, metal: 0.8 });
  b.mat('tassel', ['#5A70E0', '#3A4FB0', '#2E376C', '#11172D'], { base: 1, rough: 0.9, shadeK: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  const zHead = 50, zTip = 82, zButt = -33;
  // the shaft
  b.add('root', cylinder([0, 0, zButt + 6], [0, 0, zHead + 1], 0.85, 0.85), 'shaft');
  // rings along it
  for (const z of [-10, 12, zHead - 1]) b.add('root', cylinder([0, 0, z - 0.6], [0, 0, z + 0.6], 1.3, 1.3), 'steel');
  // the central head: a leaf narrowing at the middle (flat in X)
  b.add('root', fn((x, y, z) => {
    if (z < zHead || z > zTip) return 1;
    const u = (z - zHead) / (zTip - zHead);
    const w = 2.8 * Math.sin(Math.PI * Math.min(1, u * 1.05)) * (1 - 0.35 * Math.exp(-((u - 0.45) ** 2) / 0.01)) + 0.3;
    return Math.max(Math.abs(x) - 0.55, Math.abs(y) - w);
  }, [-2, -4, zHead - 1], [2, 4, zTip + 1]), 'steel', { thr: 0.3 });
  b.paint('root', fn((x, y, z) => Math.abs(y) - 0.4 + 0 * x + 0 * z, [-2, -1, zHead], [2, 1, zTip]), 'edge');
  // the side blades: curving outward from the base of the head, joined by two bars each
  for (const k of [-1, 1]) {
    const p = smoothPath([[0, k * 1.2, zHead + 1], [0, k * 4.6, zHead + 4], [0, k * 6.4, zHead + 11], [0, k * 6.0, zHead + 19]], 5);
    b.add('root', tube(p, p.map((_, i) => 1.0 - i * 0.04)), 'steel', { thr: 0.25 });
    b.add('root', spike([0, k * 6.0, zHead + 18.5], [0, k * -0.15, 1], 5, 1.1, 0.5, { side: [0, 1, 0], tip: 0.3 }), 'steel', { thr: 0.25 });
    for (const zb of [zHead + 7, zHead + 13]) b.add('root', capsule([0, k * 1.6, zb], [0, k * 5.6, zb + 1], 0.5), 'steel', { thr: 0.25 });
  }
  // the tassel: a thick blue plume hanging from below the head
  b.add('root', blend(1, sphere([0, 0, zHead - 2], 1.8), capsule([0, -1.5, zHead - 3], [0, -6, zHead - 9], 2.2, 1.4)), 'tassel');
  b.paint('root', fn((x, y, z) => Math.abs(((x * 1.7 + z * 0.4) % 1.6 + 1.6) % 1.6 - 0.8) - 0.25 + 0 * y, [-4, -9, zHead - 12], [4, 2, zHead]), 'tassel', { shade: 3, where: b.isMat('tassel') });
  // the corkscrew butt
  b.add('root', fn((x, y, z) => {
    if (z < zButt || z > zButt + 7) return 1;
    const u = (z - zButt) / 7;
    const r = 0.4 + u * 1.4;
    const a = Math.atan2(y, x) - z * 1.4;
    const rr = r + 0.45 * Math.sin(a * 2);
    return Math.hypot(x, y) - rr;
  }, [-3, -3, zButt - 1], [3, 3, zButt + 8]), 'steel', { thr: 0.3 });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}
