import { describe, expect, it } from 'vitest';
import { buildMeninas, meninasProp, type MeninasProp } from '../src/chars/meninas';
import { MENINAS_CHAIN, MENINAS_CLIPS, PORNIPORA_CHAIN, PORNIPORA_CLIPS } from '../src/chars/meninasClips';
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

describe('Meninas McAllon', () => {
  for (const form of ['base', 'pornipora', 'sklaverei'] as const) {
    it(`builds the ${form} body without floating islands`, () => {
      const a = buildMeninas(form);
      const isl = a.warnings.filter((w) => w.includes('island'));
      expect(isl, isl.join(' | ')).toEqual([]);
      for (const n of ['grip.L', 'grip.R', 'palm.R', 'bicep.L', 'bicep.R', 'fore.L', 'fore.R', 'chest.front', 'heart', 'halo', 'face', 'eye.L', 'toe.R']) expect(Object.keys(a.model.sockets)).toContain(n);
      const bones = a.model.bones.map((b) => b.name);
      for (const n of ['hair1', 'hair2', 'hair3', 'coat.F.L', 'coat.B.R']) expect(bones).toContain(n);
      if (form === 'base') expect(bones).not.toContain('wing.L');
      else for (const n of ['wing.L', 'wing.R']) expect(bones).toContain(n);
    });
  }
  it('stands 1.91 m, the tallest of the Bambies', () => {
    const m = buildMeninas('base').model;
    let hi = -Infinity;
    m.grids.forEach((g) => g.forEach((_x, y) => { hi = Math.max(hi, y); }));
    expect(hi / m.res).toBeGreaterThan(1.85);
    expect(hi / m.res).toBeLessThan(2.1);
  });
  for (const k of ['muscle.upper', 'muscle.fore', 'dumbbell', 'baton', 'halteres', 'bow', 'heart', 'halo'] as MeninasProp[]) {
    it(`builds the ${k} in one piece`, () => {
      const m = meninasProp(k);
      const counts = islands(m).filter((_n, i) => m.grids[i].count() > 0);
      for (const n of counts) expect(n, `${k}: ${counts.join(',')}`).toBe(1);
    });
  }
  it('every string and move names a clip', () => {
    const base = new Set(MENINAS_CLIPS.map((c) => c.name));
    for (const n of [...MENINAS_CHAIN, 'mn_power', 'mn_bow', 'mn_diamond', 'mn_lift', 'mn_drop', 'mn_grab', 'mn_drive', 'mn_slam', 'mn_flex', 'mn_release', 'dash', 'hit_heavy']) expect(base.has(n), n).toBe(true);
    const pp = new Set(PORNIPORA_CLIPS.map((c) => c.name));
    for (const n of [...PORNIPORA_CHAIN, 'mn_baton', 'mn_halteres', 'mn_sklav', 'mn_skydrop', 'mn_diamond', 'mn_grab', 'mn_drive', 'mn_slam', 'dash']) expect(pp.has(n), n).toBe(true);
  });
});
