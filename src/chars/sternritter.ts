// Shared pieces for the Sternritter models (docs/roster/H1–H3, "Sternritter equipment"): pixel badges set into the
// front of a coat (buttons, pins, the Wandenreich Zeichen), the long cape or hooded cloak of the order hanging from
// behind the collar and the shoulders to the ankles (rigid to the waist, spring panels below, open in front), and a
// sheet of long straight hair falling down the back on three spring bones.
import { ModelBuilder } from '../models/builder';
import { aabb, blend, cylinder, ellipsoid, fn, intersect, offset, rotate, subtract, type Sdf, type V3 } from '../models/sdf';
import { addBands, coatSkirt, type Landmarks } from './humanoid';
import type { ColliderDef, SpringDef } from '../anim/springs';

/** The outermost voxel in front of (x, y) among some bones. */
export function frontOf(b: ModelBuilder, bones: string[], x: number, y: number): { bone: string; z: number } | null {
  let best: { bone: string; z: number } | null = null;
  for (const bone of bones) {
    const g = b.grid(bone);
    for (let z = 24; z > -4; z--)
      if (g.get(x, y, z) !== 0) {
        if (!best || z > best.z) best = { bone, z };
        break;
      }
  }
  return best;
}

/** The outermost voxel behind (x, y) among some bones. */
export function backOf(b: ModelBuilder, bones: string[], x: number, y: number): { bone: string; z: number } | null {
  let best: { bone: string; z: number } | null = null;
  for (const bone of bones) {
    const g = b.grid(bone);
    for (let z = -30; z < 4; z++)
      if (g.get(x, y, z) !== 0) {
        if (!best || z < best.z) best = { bone, z };
        break;
      }
  }
  return best;
}

/**
 * A pixel-art badge set into the front of the coat (rows as seen from the front, centred on cx): 'X' flush, 'o' proud
 * by one voxel and lit. `back` stamps it on the back instead (rows as seen from behind).
 */
export function badge(b: ModelBuilder, rows: string[], cx: number, yTop: number, mat: string, o: { shade?: number; bones?: string[]; back?: boolean } = {}): void {
  const bones = o.bones ?? ['chest', 'spine'];
  rows.forEach((row, r) => {
    const cells = row.split(/\s+/).filter((c) => c.length > 0);
    cells.forEach((ch, ci) => {
      if (ch === '.') return;
      const off = ci - (cells.length - 1) / 2;
      const x = Math.round(o.back ? cx - off : cx + off), y = yTop - r;
      const at = o.back ? backOf(b, bones, x, y) : frontOf(b, bones, x, y);
      if (!at) return;
      b.voxel(at.bone, x, y, at.z, mat, ch === 'o' ? 0 : o.shade ?? 1);
      if (ch === 'o') b.voxel(at.bone, x, y, at.z + (o.back ? -1 : 1), mat, 0);
    });
  });
}

/** The Wandenreich Zeichen, 7×7: a vertical stroke, a cross-bar, and two legs splaying down from the crossing. */
export const ZEICHEN_7 = [
  '. . . X . . .',
  '. . . X . . .',
  'X X X X X X X',
  '. X . X . X .',
  '. . X X X . .',
  '. X . . . X .',
  'X . . . . . X',
];

/** The same, 11×11, for a cloak's back. */
export const ZEICHEN_11 = [
  '. . . . . X . . . . .',
  '. . . . . X . . . . .',
  '. . . . . X . . . . .',
  'X X X X X X X X X X X',
  '. . . X . X . X . . .',
  '. . . . X X X . . . .',
  '. . . X . X . X . . .',
  '. . X . . . . . X . .',
  '. X . . . . . . . X .',
  'X . . . . . . . . . X',
  '. . . . . . . . . . .',
];

export interface CapeOpts {
  mat: string;
  lining: string;
  res: number;
  /** hem height (voxels; default near the ankles) */
  yHem?: number;
  /** skirt radii at the waist and at the hem */
  r0?: number;
  r1?: number;
  /** a hood thrown back, bunched behind the neck */
  hood?: boolean;
  /** bone name prefix for the panels (default 'cape') */
  prefix?: string;
}

/**
 * The order's long cape (or sleeveless hooded cloak): a thin shell from behind the collar and the backs of the
 * shoulders down the back, spring panels from the waist at the sides and back to the ankles, open in front.
 */
export function longCape(b: ModelBuilder, L: Landmarks, torso: Sdf, o: CapeOpts): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy] = s.shoulder;
  const nz = L.headC[2] - 0.8;
  const prefix = o.prefix ?? 'cape';
  const drape = blend(2.0, offset(torso, 2.2), ellipsoid([0, sy - 8, -1.6], [sx + 2.4, 10.5, s.chest[1] + 3]));
  const mantle = subtract(
    intersect(subtract(drape, offset(drape, -1.1), offset(torso, 1.2)), aabb([-40, s.waistY - 5, -40], [40, sy + 8, 40]),
      fn((x, y, z) => Math.max(z - (Math.abs(x) < 4.8 ? nz - 2.4 : -1.2), y - (sy + 4.4 - Math.max(0, Math.abs(x) - 3) * 0.3)), [-40, 0, -40], [40, 140, 40])),
    cylinder([0, sy - 2, nz], [0, sy + 14, nz], s.neckR + 2.3),
  );
  addBands(b, mantle, o.mat, [['spine', s.waistY - 5, s.chestY - 4], ['chest', s.chestY - 6, 160]]);
  // folds falling down the back
  for (const x0 of [-6.2, -2.1, 2.1, 6.2]) b.paint(['chest', 'spine'], fn((x, y, z) => Math.max(Math.abs(x - x0 * (1 + (sy - y) * 0.012)) - 0.5, z + 3), [-30, s.waistY - 6, -30], [30, sy + 4, 0]), o.mat, { shade: 3, where: b.isMat(o.mat) });
  if (o.hood) {
    // the hood thrown back: a rolled bunch of cloth behind the neck
    b.add('chest', subtract(ellipsoid([0, sy + 3.4, nz - 3.6], [5.6, 3.4, 3.2]), ellipsoid([0, sy + 4.2, nz - 2.6], [3.8, 2.8, 2.6]), cylinder([0, sy - 2, nz], [0, sy + 14, nz], s.neckR + 1.6)), o.mat, { thr: 0.2 });
    b.paint('chest', ellipsoid([0, sy + 4.4, nz - 3.2], [4.4, 1.6, 2.6]), o.lining, { where: b.isMat(o.mat) });
  }
  const skirt = coatSkirt(b, L, { mat: o.mat, lining: o.lining, yTop: s.waistY - 4, yHem: o.yHem ?? 3, r0: o.r0 ?? 10.2, r1: o.r1 ?? 13.8, openFront: 24, overlap: 4, res: o.res, prefix, depth: 0.92, thick: 1.0 });
  // empty the front panels (a box round the whole skirt: rasterising a far bigger one cost seconds per cape)
  for (const n of [`${prefix}.F.L`, `${prefix}.F.L.2`, `${prefix}.F.R`, `${prefix}.F.R.2`]) b.carve(n, aabb([-48, -12, -48], [48, s.waistY + 14, 48]));
  return { springs: skirt.springs.filter((sp) => !sp.bone.startsWith(`${prefix}.F.`)), colliders: [] };
}

export interface HairSheetOpts {
  mat: string;
  res: number;
  /** where the ends fall to (voxel height) */
  yBot: number;
  /** half-width at the head and the half-thickness of the sheet */
  width?: number;
  thick?: number;
  /** how far the sheet hangs behind the back of the head at its widest (to clear a cape) */
  out?: number;
}

/**
 * Long straight hair: a sheet falling from the back of the head down the back, wide at the head and narrowing a
 * little, on three bones (hair1-3) so it sways; strand grooves down its length, ragged ends.
 */
export function hairSheet(b: ModelBuilder, L: Landmarks, hd: { chin: number }, o: HairSheetOpts): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const c = hd.chin;
  const hw = s.head.w / 2;
  const back = L.headC[2] - s.head.d / 2;
  const yTop = c + 9, yBot = o.yBot;
  const out = o.out ?? 3.2;
  const w0 = (o.width ?? hw + 1.6);
  const zc = (y: number) => {
    const t = Math.max(0, Math.min(1, (yTop - y) / (yTop - yBot)));
    return back - 0.6 - Math.sin(Math.min(1, t * 2.6) * Math.PI * 0.5) * out + t * 0.6;
  };
  const sheet = fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (yTop - y) / (yTop - yBot)));
    const w = w0 - t * 0.8;
    const bot = yBot + Math.abs(Math.sin(x * 0.8)) * 2.6;
    return Math.max(Math.abs(x) - w, Math.abs(z - zc(y)) - ((o.thick ?? 2.2) - t * 0.6), y - yTop, bot - y);
  }, [-16, yBot - 1, back - 16], [16, yTop + 1, back + 3]);
  const ySplit1 = s.chestY + 4, ySplit2 = Math.max(yBot + 6, s.chestY - 8);
  const p1: V3 = [0, c + 6, back - 1], p2: V3 = [0, ySplit1, zc(ySplit1)], p3: V3 = [0, ySplit2, zc(ySplit2)];
  const bones: [string, string, V3, number, number][] = [['hair1', 'head', p1, p2[1] - 0.5, 300], ['hair2', 'hair1', p2, p3[1] - 0.5, p2[1] + 0.5], ['hair3', 'hair2', p3, -100, p3[1] + 0.5]];
  for (const [name, parent, pivot, y0, y1] of bones) {
    b.bone(name, parent, pivot);
    b.add(name, intersect(sheet, aabb([-24, y0, -40], [24, y1, 10])), o.mat, { thr: 0.25 });
  }
  b.paint(['hair1', 'hair2', 'hair3'], fn((x) => Math.abs(((x + 30) % 2.6) - 1.3) - 0.32, [-16, yBot - 3, back - 18], [16, yTop + 2, back + 3]), o.mat, { shade: 4, where: b.isMat(o.mat) });
  const R = o.res;
  const tip: V3 = [0, yBot, zc(yBot)];
  const springs: SpringDef[] = [
    { bone: 'hair1', tail: [(p2[0] - p1[0]) / R, (p2[1] - p1[1]) / R, (p2[2] - p1[2]) / R], stiffness: 46, damping: 5.5, gravity: 11, limit: 35, radius: 0.08 },
    { bone: 'hair2', tail: [(p3[0] - p2[0]) / R, (p3[1] - p2[1]) / R, (p3[2] - p2[2]) / R], stiffness: 34, damping: 5, gravity: 12, limit: 45, radius: 0.08 },
    { bone: 'hair3', tail: [(tip[0] - p3[0]) / R, (tip[1] - p3[1]) / R, (tip[2] - p3[2]) / R], stiffness: 26, damping: 4.5, gravity: 13, limit: 55, radius: 0.07 },
  ];
  const colliders: ColliderDef[] = [
    { bone: 'chest', offset: [0, 0.08, -0.04], radius: 0.22 },
    { bone: 'spine', offset: [0, 0.02, -0.03], radius: 0.19 },
  ];
  return { springs, colliders };
}

export interface CapOpts {
  mat: string;
  /** the piping round the top */
  trim: string;
  gold: string;
  peak: string;
  /** raised above the head by (voxels): sitting on a mass of hair */
  lift?: number;
  /** tipped back by (degrees), about the band's back */
  tilt?: number;
  /** the crown and the peak widened by (voxels) */
  grow?: number;
}

/**
 * The order's peaked cap: a short white crown flaring to a wide top, raised at the front, a narrow gold band, a thin
 * black peak angled down over the brow, the Zeichen in gold on the front of the crown.
 */
export function peakedCap(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }, o: CapOpts): void {
  const s = L.spec;
  const c = hd.chin;
  const cz = L.headC[2] - 0.4;
  const hw = s.head.w / 2 + (o.grow ?? 0);
  const hd2 = s.head.d / 2 + (o.grow ?? 0);
  const yb = c + 10.8 + (o.lift ?? 0);
  const tilt = o.tilt ?? 0;
  const tip = (sdf: Sdf): Sdf => (tilt ? rotate(sdf, [0, yb, cz - hd2], [-tilt, 0, 0]) : sdf);
  // the crown: from the band up 3.4, the top flaring out and raised at the front
  const crown = fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (y - yb) / 3.4));
    const rx = hw + 1.0 + t * 1.5, rz = hd2 + 0.8 + t * 1.8;
    const zc = cz - t * 0.5;
    const top = yb + 3.4 + Math.max(0, (z - cz) / hd2) * 0.9;
    return Math.max(Math.hypot(x / rx, (z - zc) / rz) - 1, yb - y, y - top);
  }, [-12 - hw + 5, yb - 1, cz - 12 - hd2 + 5.5], [12 + hw - 5, yb + 6, cz + 12 + hd2 - 5.5]);
  b.add('head', tip(crown), o.mat, { thr: 0.2 });
  b.carve('head', tip(fn((x, y, z) => Math.max(Math.hypot(x / (hw + 0.4), (z - cz) / (hd2 + 0.2)) - 1, yb + 0.6 - y, y - (yb + 2.6)), [-10, yb, cz - 10], [10, yb + 4, cz + 10])));
  // the piping round the top's edge
  b.paint('head', tip(fn((x, y, z) => Math.max(Math.abs(Math.hypot(x / (hw + 2.4), (z - cz + 0.5) / (hd2 + 2.5)) - 1) * 6 - 0.6, y - (yb + 4.6), yb + 2.4 - y), [-12, yb + 2, cz - 12], [12, yb + 5, cz + 12])), o.trim, { where: b.isMat(o.mat) });
  // the narrow gold band round the base
  b.paint('head', tip(fn((x, y) => Math.max(Math.abs(y - (yb + 0.5)) - 0.55, Math.abs(x) - 20), [-12, yb - 1, cz - 12], [12, yb + 2, cz + 12])), o.gold, { where: b.isMat(o.mat) });
  // the peak: a thin black visor angled down over the brow
  const pz = cz + hd2 + 0.4;
  b.add('head', tip(fn((x, y, z) => {
    const u = (z - pz) / 3.6;
    if (u < -0.3 || u > 1) return 1;
    const w = hw * Math.sqrt(Math.max(0, 1 - u * u * 0.8));
    const yc = yb + 0.1 - u * 1.3;
    return Math.max(Math.abs(x) - w, Math.abs(y - yc) - 0.45);
  }, [-9, yb - 3, pz - 2], [9, yb + 2, pz + 5])), o.peak, { thr: 0.2 });
  // the Zeichen on the front of the crown
  const at = (x: number, y: number) => {
    const g = b.grid('head');
    for (let z = 20; z > 0; z--) if (g.get(x, y, z) !== 0) return z;
    return null;
  };
  const rows = ['. X .', 'X X X', 'X . X'];
  rows.forEach((row, r) => row.split(' ').forEach((ch, ci) => {
    if (ch !== 'X') return;
    const x = ci - 1, y = Math.round(yb + 3.2 - r + (tilt ? (hd2 * 2 + 1) * Math.sin((tilt * Math.PI) / 180) : 0));
    const z = at(x, y);
    if (z !== null) b.voxel('head', x, y, z, o.gold, 0);
  }));
}
