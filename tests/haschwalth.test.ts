import { describe, expect, it } from 'vitest';
import { buildHaschwalth, haschwalthProp, HW_SWORD_BASE_Z, HW_SWORD_TIP_Z, type HaschwalthProp } from '../src/chars/haschwalth';
import { HASCHWALTH_CHAIN, HASCHWALTH_CLIPS } from '../src/chars/haschwalthClips';
import type { VoxelModel } from '../src/models/builder';

/** 6-connected components of every bone grid of a model */
function islands(m: VoxelModel): number[] {
  return m.grids.map((g) => {
    const seen = new Set<string>();
    let n = 0;
    g.forEach((x, y, z) => {
      if (seen.has(`${x},${y},${z}`)) return;
      n++;
      const stack: [number, number, number][] = [[x, y, z]];
      seen.add(`${x},${y},${z}`);
      while (stack.length) {
        const [a, b, c] = stack.pop()!;
        for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
          const k = `${a + dx},${b + dy},${c + dz}`;
          if (!seen.has(k) && g.get(a + dx, b + dy, c + dz) !== 0) {
            seen.add(k);
            stack.push([a + dx, b + dy, c + dz]);
          }
        }
      }
    });
    return n;
  });
}

describe('Jugram Haschwalth', () => {
  for (const form of ['day', 'night', 'vessel'] as const) {
    it(`builds the ${form} body without floating islands`, () => {
      const a = buildHaschwalth(form);
      const isl = a.warnings.filter((w) => w.includes('island'));
      expect(isl, isl.join(' | ')).toEqual([]);
      for (const n of ['grip.R', 'grip.L', 'shield', 'palm.R', 'palm.L', 'eye.L', 'eye.R', 'back']) expect(Object.keys(a.model.sockets)).toContain(n);
      const bones = a.model.bones.map((b) => b.name);
      // the hair down his back and the order's cloak hang on spring chains, open in front
      for (const n of ['hair1', 'hair2', 'hair3']) expect(bones).toContain(n);
      expect(a.springs.some((s) => s.bone === 'hair3')).toBe(true);
      expect(a.springs.some((s) => s.bone.startsWith('cape.B'))).toBe(true);
      expect(a.springs.some((s) => s.bone.startsWith('cape.F.'))).toBe(false);
    });
  }
  for (const k of ['sword', 'shield'] as HaschwalthProp[]) {
    it(`builds the ${k} in one piece`, () => {
      const m = haschwalthProp(k);
      const counts = islands(m).filter((n, i) => m.grids[i].count() > 0);
      for (const n of counts) expect(n, `${k}: ${counts.join(',')}`).toBe(1);
    });
  }
  it('the Blade of Judgment reaches its tip', () => {
    const m = haschwalthProp('sword');
    let hi = -Infinity;
    m.grids[0].forEach((_x, _y, z) => (hi = Math.max(hi, z)));
    expect(Math.abs((hi + 1) / m.res - HW_SWORD_TIP_Z)).toBeLessThan(0.06);
    expect(HW_SWORD_TIP_Z - HW_SWORD_BASE_Z).toBeGreaterThan(1);
  });
  it('every string and move names a clip', () => {
    const names = new Set(HASCHWALTH_CLIPS.map((c) => c.name));
    for (const n of [...HASCHWALTH_CHAIN, 'hw_judgment', 'hw_blast', 'hw_scales', 'hw_key', 'hw_invert', 'hw_guard', 'hw_night', 'hw_vessel', 'hw_verdict', 'hw_bslash', 'hw_torrent', 'hw_thorns', 'hw_mend']) expect(names.has(n), n).toBe(true);
  });
});
