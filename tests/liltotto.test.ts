import { describe, expect, it } from 'vitest';
import { buildLiltotto, liltottoProp, type LiltottoProp } from '../src/chars/liltotto';
import { LILTOTTO_CHAIN, LILTOTTO_CLIPS } from '../src/chars/liltottoClips';
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

describe('Liltotto Lamperd', () => {
  for (const form of ['base', 'gagael', 'sklaverei'] as const) {
    it(`builds the ${form} body without floating islands`, () => {
      const a = buildLiltotto(form);
      const isl = a.warnings.filter((w) => w.includes('island'));
      expect(isl, isl.join(' | ')).toEqual([]);
      for (const n of ['grip.L', 'palm.R', 'wrist.R', 'wrist.L', 'mouth', 'candy', 'heart', 'halo', 'eye.L', 'toe.R']) expect(Object.keys(a.model.sockets)).toContain(n);
      const bones = a.model.bones.map((b) => b.name);
      expect(bones).toContain('hair1');
      if (form === 'base') expect(bones).not.toContain('wing.L');
      else for (const n of ['wing.L', 'wing.R']) expect(bones).toContain(n);
      if (form === 'sklaverei') for (const n of ['jaw.L', 'jaw.R']) expect(bones).toContain(n);
    });
  }
  it('she is small: about a metre and a half', () => {
    const m = buildLiltotto('base').model;
    let hi = -Infinity;
    m.grids.forEach((g) => g.forEach((_x, y) => { hi = Math.max(hi, y); }));
    expect(hi / m.res).toBeGreaterThan(1.4);
    expect(hi / m.res).toBeLessThan(1.75);
  });
  for (const k of ['maw.upper', 'maw.lower', 'trap.base', 'trap.jaw', 'bow', 'link', 'candy', 'halo'] as LiltottoProp[]) {
    it(`builds the ${k} in one piece`, () => {
      const m = liltottoProp(k);
      const counts = islands(m).filter((n, i) => m.grids[i].count() > 0);
      for (const n of counts) expect(n, `${k}: ${counts.join(',')}`).toBe(1);
    });
  }
  it('every string and move names a clip', () => {
    const names = new Set(LILTOTTO_CLIPS.map((c) => c.name));
    for (const n of [...LILTOTTO_CHAIN, 'lt_haymaker', 'lt_bite', 'lt_swallow', 'lt_bow', 'lt_feast', 'lt_release', 'lt_spork', 'lt_spife', 'lt_crunch', 'lt_sklav', 'lt_full', 'dash', 'hit_heavy']) expect(names.has(n), n).toBe(true);
  });
});
