// Shinji's Bankai, Sakashima Yokoshima Happōfusagari (docs/roster/D-visored.md §2): a large golden metal flower
// that bursts up under him and closes its petals round him; the pink mist pours from its crown. Brief: ~4.6 m
// tall when shut (Shinji is 1.76 m), eight petals for the "eight treasures" (a design choice — canon never
// counts them), in two whorls so the shut bud overlaps without z-fighting; a low ring of a receptacle with
// eight sepals lying out on the ground; Shinji stands on the ground inside the ring. Golden metal `#E2B23A`,
// shade `#B9861A`, edge highlight `#FFE58A` (dossier palette). Built at 12 vox/m (a construct the size of a
// small building, coarser than a character, finer than the world grid at an integer ratio). Bones: 'base' and
// 'petal0'…'petal7' pivoting on the receptacle ring — rotate a petal about its ring tangent to open it.
import { ModelBuilder } from '../models/builder';
import { capsule, cylinder, fn, subtract, torus, type V3 } from '../models/sdf';
import type { CharacterAsset } from './ichigo';

/** 12 voxels per metre */
export const FLOWER_RES = 12;
export const FLOWER_PETALS = 8;
/** the petal pivots: ring radius and height (m) */
export const FLOWER_RING_R = 13.2 / FLOWER_RES;
export const FLOWER_RING_Y = 4.2 / FLOWER_RES;
/** the crown where the petals meet when shut (m): the mist pours out of it */
export const FLOWER_CROWN_Y = 55 / FLOWER_RES;

let cache: CharacterAsset | null = null;

export function flowerAsset(): CharacterAsset {
  if (!cache) cache = buildFlower();
  return cache;
}

/** azimuth of petal i (radians, measured from +Z toward +X) */
export function petalAzimuth(i: number): number {
  return (i / FLOWER_PETALS) * Math.PI * 2;
}

export function buildFlower(): CharacterAsset {
  const b = new ModelBuilder('happo-flower', FLOWER_RES);
  b.mat('gold', ['#FFE58A', '#F0C850', '#E2B23A', '#C99A2A', '#B9861A', '#8A6212'], { base: 2, rough: 0.3, metal: 0.85, shadeK: 0.85 });
  b.mat('goldIn', ['#F6D27A', '#E8B850', '#D49E36', '#B9861A', '#946A14'], { base: 2, rough: 0.38, metal: 0.75, shadeK: 0.9 });
  b.mat('vein', ['#FFE58A'], { rough: 0.25, metal: 0.9, glow: 0.12 });

  b.bone('root', null, [0, 0, 0]);
  b.bone('base', 'root', [0, 0, 0]);
  const y0 = 4.2, H = 50.8;
  const R0 = FLOWER_RING_R * FLOWER_RES;
  /** the shut bud's radius at height fraction t (voxels): wide at the ring, fullest at 60 %, a point at the top */
  const profile = (t: number) => (R0 + 15.6 * t) * Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, t), 2.4)));
  /** a petal's half-width (radians) at height fraction t: overlapping its neighbours below, pointed at the tip */
  const halfW = (t: number) => 0.44 * Math.pow(Math.max(0, 1 - Math.pow(Math.max(0, t), 1.7)), 0.62) + 0.015;

  for (let i = 0; i < FLOWER_PETALS; i++) {
    const a = petalAzimuth(i);
    // the outer whorl sits two voxels out, so the shut petals overlap like a real bud
    const off = i % 2 === 1 ? 2.1 : 0;
    const th = 2.1;
    const name = `petal${i}`;
    b.bone(name, 'base', [Math.sin(a) * (R0 + off), y0, Math.cos(a) * (R0 + off)]);
    const wrap = (d: number) => Math.atan2(Math.sin(d), Math.cos(d));
    const petal = fn((x, y, z) => {
      const t = (y - y0) / H;
      if (t < -0.05 || t > 1.02) return 2;
      const rr = Math.hypot(x, z);
      const tt = Math.max(0, Math.min(1, t));
      // distance to the bud's surface across its slope (near the crown it turns flat, so a purely radial
      // measure would leave the top layers apart)
      const slope = Math.min(12, Math.abs(profile(Math.min(1, tt + 0.01)) - profile(Math.max(0, tt - 0.01))) / (0.02 * H));
      const radial = Math.abs(rr - profile(tt) - off * (1 - tt)) / Math.sqrt(1 + slope * slope) - th / 2;
      const da = wrap(Math.atan2(x, z) - a);
      // never thinner than a couple of voxels, so the tips stay whole where they meet at the crown
      const rw = Math.max(rr, 3);
      const side = Math.abs(da) * rw - Math.max(halfW(tt) * rw, 1.3);
      return Math.max(radial, side, y0 - 0.5 - y, y - (y0 + H * 0.99));
    }, [-24, 3, -24], [24, 57, 24]);
    b.add(name, petal, 'gold', { thr: 0.3 });
    // the inner face a warmer, deeper gold
    b.paint(name, fn((x, y, z) => {
      const t = Math.max(0, Math.min(1, (y - y0) / H));
      return Math.hypot(x, z) - (profile(t) + off * (1 - t)) + 0.4;
    }, [-24, 3, -24], [24, 57, 24]), 'goldIn', { where: b.isMat('gold') });
    // the midrib up the outside, and the rims catching the light
    b.paint(name, fn((x, y, z) => {
      const t = Math.max(0, Math.min(1, (y - y0) / H));
      const rr = Math.hypot(x, z);
      if (rr < profile(t) + off * (1 - t) - 0.2 || t > 0.93) return 1;
      return Math.abs(wrap(Math.atan2(x, z) - a)) * Math.max(rr, 3) - 0.6;
    }, [-24, 3, -24], [24, 57, 24]), 'vein', { where: b.isMat('gold') });
    b.paint(name, fn((x, y, z) => {
      const t = Math.max(0, Math.min(1, (y - y0) / H));
      const rr = Math.hypot(x, z);
      const edge = (halfW(t) - Math.abs(wrap(Math.atan2(x, z) - a))) * Math.max(rr, 3);
      return edge - 0.9;
    }, [-24, 3, -24], [24, 57, 24]), 'gold', { shade: 0, where: b.isMat('gold', 'goldIn') });
  }

  // ---- the receptacle: a low ring Shinji stands inside, its rim under the petal pivots
  b.add('base', subtract(cylinder([0, 0, 0], [0, 4.6, 0], R0 + 2.6), cylinder([0, -1, 0], [0, 6, 0], R0 - 3.4)), 'gold', { thr: 0.25 });
  b.add('base', torus([0, 4.4, 0], R0 + 0.4, 1.6), 'gold', { thr: 0.25 });
  b.paint('base', torus([0, 2.2, 0], R0 + 2.6, 0.6), 'gold', { shade: 4, where: b.isMat('gold') });
  // the eight sepals lying out on the ground between the petals, curling up at the tips
  for (let i = 0; i < FLOWER_PETALS; i++) {
    const a = petalAzimuth(i) + Math.PI / FLOWER_PETALS;
    const dir: V3 = [Math.sin(a), 0, Math.cos(a)];
    const p0: V3 = [dir[0] * (R0 + 1), 1.6, dir[2] * (R0 + 1)];
    const p1: V3 = [dir[0] * (R0 + 16), 1.2, dir[2] * (R0 + 16)];
    const leaf = fn((x, y, z) => {
      // along and across the sepal
      const u = (x - p0[0]) * dir[0] + (z - p0[2]) * dir[2];
      const v = -(x - p0[0]) * dir[2] + (z - p0[2]) * dir[0];
      const L = 15;
      const k = Math.max(0, Math.min(1, u / L));
      const w = 4.2 * Math.sin(Math.PI * Math.pow(k, 0.7)) + 0.4;
      const yc = 1.4 + k * k * 2.6;
      return Math.max(Math.abs(v) - w, Math.abs(y - yc) - 1.1, -u, u - L);
    }, [Math.min(p0[0], p1[0]) - 6, -1, Math.min(p0[2], p1[2]) - 6], [Math.max(p0[0], p1[0]) + 6, 7, Math.max(p0[2], p1[2]) + 6]);
    b.add('base', leaf, 'gold', { thr: 0.3 });
    b.paint('base', capsule(p0, [p1[0], 3.4, p1[2]], 0.6), 'vein', { where: b.isMat('gold') });
  }
  b.autoShade({ up: 0.6, open: 1.6, front: 0.1 });
  b.lint();
  return { model: b.build(), springs: [], colliders: [], warnings: b.warnings };
}
