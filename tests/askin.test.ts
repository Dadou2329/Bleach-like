import { describe, expect, it } from 'vitest';
import { askinProp, buildAskin, type AskinProp } from '../src/chars/askin';
import { ASKIN_CHAIN, ASKIN_CLIPS, HASSHEIN_CHAIN, HASSHEIN_CLIPS } from '../src/chars/askinClips';
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

describe('Askin Nakk Le Vaar', () => {
  for (const form of ['base', 'hasshein'] as const) {
    it(`builds the ${form} body without floating islands`, () => {
      const a = buildAskin(form);
      const isl = a.warnings.filter((w) => w.includes('island'));
      expect(isl, isl.join(' | ')).toEqual([]);
      for (const n of ['grip.L', 'grip.R', 'palm.R', 'bracer', 'finger', 'mouth', 'face', 'halo', 'toe.R', 'chest.front']) expect(Object.keys(a.model.sockets)).toContain(n);
      const bones = a.model.bones.map((b) => b.name);
      for (const n of ['strand', 'point.R']) expect(bones).toContain(n);
      if (form === 'base') expect(bones).not.toContain('wing.L');
      else for (const n of ['wing.L', 'wing.R']) expect(bones).toContain(n);
    });
  }
  it('stands 1.87 m', () => {
    const m = buildAskin('base').model;
    let hi = -Infinity;
    m.grids.forEach((g) => g.forEach((_x, y) => { hi = Math.max(hi, y); }));
    expect(hi / m.res).toBeGreaterThan(1.82);
    expect(hi / m.res).toBeLessThan(1.95);
  });
  for (const k of ['bow', 'staff', 'thermos', 'halo'] as AskinProp[]) {
    it(`builds the ${k} in one piece`, () => {
      const m = askinProp(k);
      const counts = islands(m).filter((_n, i) => m.grids[i].count() > 0);
      for (const n of counts) expect(n, `${k}: ${counts.join(',')}`).toBe(1);
    });
  }
  it('every string and move names a clip', () => {
    const base = new Set(ASKIN_CLIPS.map((c) => c.name));
    for (const n of [...ASKIN_CHAIN, 'as_bow', 'as_toss', 'as_pool', 'as_taste', 'as_sip', 'as_analyse', 'as_crumple', 'as_release', 'dash', 'hit_heavy']) expect(base.has(n), n).toBe(true);
    const hs = new Set(HASSHEIN_CLIPS.map((c) => c.name));
    for (const n of [...HASSHEIN_CHAIN, 'hs_swarm', 'hs_ring', 'hs_deluxe', 'hs_bereich', 'hs_giant', 'as_taste', 'as_analyse', 'as_crumple', 'dash']) expect(hs.has(n), n).toBe(true);
  });
});
