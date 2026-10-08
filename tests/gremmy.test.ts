import { describe, expect, it } from 'vitest';
import { buildGremmy, gremmyProp, type GremmyProp } from '../src/chars/gremmy';
import { BULK_CHAIN, BULK_CLIPS, GREMMY_CHAIN, GREMMY_CLIPS } from '../src/chars/gremmyClips';
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

describe('Gremmy Thoumeaux', () => {
  for (const form of ['base', 'steel', 'bulk'] as const) {
    it(`builds the ${form} body without floating islands`, () => {
      const a = buildGremmy(form);
      const isl = a.warnings.filter((w) => w.includes('island'));
      expect(isl, isl.join(' | ')).toEqual([]);
      for (const n of ['grip.L', 'grip.R', 'palm.R', 'face', 'brain', 'chest.front', 'toe.R']) expect(Object.keys(a.model.sockets)).toContain(n);
      const bones = a.model.bones.map((b) => b.name);
      for (const n of ['coat.F.L', 'coat.B.R']) expect(bones).toContain(n);
    });
  }
  it('stands 1.55 m', () => {
    const m = buildGremmy('base').model;
    let hi = -Infinity;
    m.grids.forEach((g) => g.forEach((_x, y) => { hi = Math.max(hi, y); }));
    expect(hi / m.res).toBeGreaterThan(1.5);
    expect(hi / m.res).toBeLessThan(1.7);
  });
  for (const k of ['brain', 'spike', 'bar', 'block', 'column', 'hand', 'meteor', 'rifle', 'missile', 'bomb', 'dome'] as GremmyProp[]) {
    it(`builds the ${k} in one piece`, () => {
      const m = gremmyProp(k);
      const counts = islands(m).filter((_n, i) => m.grids[i].count() > 0);
      for (const n of counts) expect(n, `${k}: ${counts.join(',')}`).toBe(1);
    });
  }
  it('every string and move names a clip', () => {
    const base = new Set(GREMMY_CLIPS.map((c) => c.name));
    for (const n of [...GREMMY_CHAIN, 'gm_nod', 'gm_tilt', 'gm_spread', 'gm_down', 'gm_raise', 'gm_split', 'gm_harden', 'gm_swell', 'dash', 'hit_heavy']) expect(base.has(n), n).toBe(true);
    const bulk = new Set(BULK_CLIPS.map((c) => c.name));
    for (const n of [...BULK_CHAIN, 'gm_swell', 'dash']) expect(bulk.has(n), n).toBe(true);
  });
});
