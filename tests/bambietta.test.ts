import { describe, expect, it } from 'vitest';
import { DAO_BASE_Z, DAO_TIP_Z, bambiettaProp, buildBambietta, type BambiettaProp } from '../src/chars/bambietta';
import { BAMBIETTA_CHAIN, BAMBIETTA_CLIPS } from '../src/chars/bambiettaClips';
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

describe('Bambietta Basterbine', () => {
  for (const form of ['base', 'zofiel'] as const) {
    it(`builds the ${form} body without floating islands`, () => {
      const a = buildBambietta(form);
      const isl = a.warnings.filter((w) => w.includes('island'));
      expect(isl, isl.join(' | ')).toEqual([]);
      for (const n of ['grip.R', 'palm.L', 'toe.R', 'halo', 'eye.L', 'back']) expect(Object.keys(a.model.sockets)).toContain(n);
      const bones = a.model.bones.map((b) => b.name);
      for (const n of ['hair1', 'hair3', 'cape.B.L']) expect(bones).toContain(n);
      if (form === 'zofiel') for (const n of ['wing.L', 'wing.R']) expect(bones).toContain(n);
      else expect(bones).not.toContain('wing.L');
    });
  }
  it('Zofiel roughly doubles her width', () => {
    const base = buildBambietta('base').model, z = buildBambietta('zofiel').model;
    const span = (m: VoxelModel) => {
      let lo = Infinity, hi = -Infinity;
      m.grids.forEach((g) => g.forEach((x) => {
        lo = Math.min(lo, x);
        hi = Math.max(hi, x);
      }));
      return hi - lo;
    };
    expect(span(z)).toBeGreaterThan(span(base) * 2);
  });
  for (const k of ['dao', 'halo', 'boulder'] as BambiettaProp[]) {
    it(`builds the ${k} in one piece`, () => {
      const m = bambiettaProp(k);
      const counts = islands(m).filter((n, i) => m.grids[i].count() > 0);
      for (const n of counts) expect(n, `${k}: ${counts.join(',')}`).toBe(1);
    });
  }
  it('the dao is a short blade (about 70 cm)', () => {
    expect(DAO_TIP_Z - DAO_BASE_Z).toBeGreaterThan(0.6);
    expect(DAO_TIP_Z - DAO_BASE_Z).toBeLessThan(0.8);
  });
  it('every string and move names a clip', () => {
    const names = new Set(BAMBIETTA_CLIPS.map((c) => c.name));
    for (const n of [...BAMBIETTA_CHAIN, 'bb_tag', 'bb_flick', 'bb_kickbomb', 'bb_globe', 'bb_hurl', 'bb_zofiel', 'bb_barrage', 'bb_point', 'bb_shell', 'bb_rise', 'dash', 'hit_heavy']) expect(names.has(n), n).toBe(true);
  });
});
