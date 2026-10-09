import { describe, expect, it } from 'vitest';
import { buildGerard, gerardProp, type GerardProp } from '../src/chars/gerard';
import { GERARD_CHAIN, GERARD_CLIPS, GIANT_CHAIN, KNIGHT_CHAIN, KNIGHT_CLIPS } from '../src/chars/gerardClips';
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

function height(m: VoxelModel): number {
  let hi = -Infinity;
  m.grids.forEach((g) => g.forEach((_x, y) => { hi = Math.max(hi, y); }));
  return hi / m.res;
}

describe('Gerard Valkyrie', () => {
  for (const form of ['helm', 'bare', 'asch', 'knight', 'bones'] as const) {
    it(`builds the ${form} body without floating islands`, () => {
      const a = buildGerard(form, form === 'bare');
      const isl = a.warnings.filter((w) => w.includes('island'));
      expect(isl, isl.join(' | ')).toEqual([]);
      for (const n of ['grip.R', 'grip.L', 'shield', 'back', 'chest.front', 'face', 'mouth', 'heart', 'helm.socket']) expect(Object.keys(a.model.sockets)).toContain(n);
    });
  }
  it('stands about 2.2 m', () => {
    const h = height(buildGerard('bare').model);
    expect(h).toBeGreaterThan(2.15);
    expect(h).toBeLessThan(2.35);
  });
  for (const k of ['hoffnung', 'hoffnung-gold', 'shield', 'shield-asch', 'bow', 'helm-asch', 'wings'] as GerardProp[]) {
    it(`builds the ${k} in one piece`, () => {
      const m = gerardProp(k);
      const counts = islands(m).filter((_n, i) => m.grids[i].count() > 0);
      for (const n of counts) expect(n, `${k}: ${counts.join(',')}`).toBe(1);
    });
  }
  it('every string and move names a clip', () => {
    const base = new Set(GERARD_CLIPS.map((c) => c.name));
    for (const n of [...GERARD_CHAIN, ...GIANT_CHAIN, 'gv_road', 'gv_flying', 'gv_cape', 'gv_bow', 'gv_vene', 'gv_miracle', 'gv_zeichen', 'gv_leap', 'gv_land', 'gv_charge', 'gv_breaker', 'gv_toss', 'gv_gale', 'gv_lariat', 'gv_grab', 'gv_squeeze', 'gv_fling', 'gv_grow', 'gv_topple', 'gv_beam', 'gv_wake', 'gv_sthrow', 'dash', 'hit_heavy']) expect(base.has(n), n).toBe(true);
    const kn = new Set(KNIGHT_CLIPS.map((c) => c.name));
    for (const n of [...KNIGHT_CHAIN, 'kn_blast', 'kn_roar', 'kn_rise', 'kn_topple', 'dash']) expect(kn.has(n), n).toBe(true);
  });
});
