import { describe, expect, it } from 'vitest';
import { BZ_SWORD_BASE_Z, BZ_SWORD_TIP_Z, FINGER_HANDS, buildBazzb, bazzbProp, type BazzbProp } from '../src/chars/bazzb';
import { BAZZB_BOW_CHAIN, BAZZB_CHAIN, BAZZB_CLIPS, BAZZB_SWORD_CHAIN } from '../src/chars/bazzbClips';
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

describe('Bazz-B', () => {
  for (const form of ['base', 'voll'] as const) {
    it(`builds the ${form} body without floating islands`, () => {
      const a = buildBazzb(form);
      const isl = a.warnings.filter((w) => w.includes('island'));
      expect(isl, isl.join(' | ')).toEqual([]);
      for (const n of ['grip.R', 'grip.L', 'palm.R', 'finger1', 'finger2', 'finger3', 'finger5', 'bf4', 'halo', 'eye.L', 'back']) expect(Object.keys(a.model.sockets)).toContain(n);
      const bones = a.model.bones.map((b) => b.name);
      // every finger count is a hand of its own, and none is empty
      for (const n of FINGER_HANDS) {
        expect(bones).toContain(n);
        expect(a.model.grids[bones.indexOf(n)].count()).toBeGreaterThan(40);
      }
      if (form === 'voll') for (const n of ['wing.L', 'wing.R']) expect(bones).toContain(n);
      else expect(bones).not.toContain('wing.L');
    });
  }
  it('the counts differ: more fingers, more voxels below the knuckles', () => {
    const m = buildBazzb('base').model;
    const bones = m.bones.map((b) => b.name);
    const low = (n: string) => {
      let c = 0, top = -Infinity;
      m.grids[bones.indexOf(n)].forEach((_x, y) => (top = Math.max(top, y)));
      m.grids[bones.indexOf(n)].forEach((_x, y) => { if (y < top - 7) c++; });
      return c;
    };
    expect(low('fing2.R')).toBeGreaterThan(low('fing1.R'));
    expect(low('fing4.R')).toBeGreaterThan(low('fing2.R'));
  });
  for (const k of ['crossbow', 'flame', 'halo'] as BazzbProp[]) {
    it(`builds the ${k} in one piece`, () => {
      const m = bazzbProp(k);
      const counts = islands(m).filter((n, i) => m.grids[i].count() > 0);
      for (const n of counts) expect(n, `${k}: ${counts.join(',')}`).toBe(1);
    });
  }
  it('the flame sword is about 2.5 m', () => {
    expect(BZ_SWORD_TIP_Z - BZ_SWORD_BASE_Z).toBeGreaterThan(2.3);
    const m = bazzbProp('flame');
    let hi = -Infinity;
    m.grids[0].forEach((_x, _y, z) => (hi = Math.max(hi, z)));
    expect(Math.abs((hi + 1) / m.res - BZ_SWORD_TIP_Z)).toBeLessThan(0.08);
  });
  it('every string and move names a clip', () => {
    const names = new Set(BAZZB_CLIPS.map((c) => c.name));
    for (const n of [...BAZZB_CHAIN, ...BAZZB_BOW_CHAIN, ...BAZZB_SWORD_CHAIN, 'bz_bf1', 'bz_bf2', 'bz_bf3', 'bz_bf4', 'bz_throw', 'bz_bff', 'bz_grab', 'bz_pointblank', 'bz_slam', 'bz_voll', 'bz_rapid', 'bz_glory', 'dash', 'hit_heavy']) expect(names.has(n), n).toBe(true);
  });
});
