import { describe, expect, it } from 'vitest';
import { SWORD_BASE_Z, SWORD_TIP_Z, WING_BONES, buildCandice, candiceProp, type CandiceProp } from '../src/chars/candice';
import { BARBARRIEL_CHAIN, BARBARRIEL_CLIPS, CANDICE_CHAIN, CANDICE_CLIPS } from '../src/chars/candiceClips';
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

describe('Candice Catnipp', () => {
  for (const form of ['base', 'barbarriel', 'sklaverei'] as const) {
    it(`builds the ${form} body without floating islands`, () => {
      const a = buildCandice(form);
      const isl = a.warnings.filter((w) => w.includes('island'));
      expect(isl, isl.join(' | ')).toEqual([]);
      for (const n of ['grip.R', 'grip.L', 'palm.R', 'tip.R', 'toe.R', 'heart', 'halo', 'eye.L', 'eye.R', 'back']) expect(Object.keys(a.model.sockets)).toContain(n);
      const bones = a.model.bones.map((b) => b.name);
      for (const n of ['hair1', 'hair2', 'hair3']) expect(bones).toContain(n);
      for (const n of WING_BONES) if (form === 'base') expect(bones).not.toContain(n);
      else expect(bones).toContain(n);
    });
  }
  it('her six wings spread her far wider than her shoulders', () => {
    const span = (m: VoxelModel) => {
      let lo = Infinity, hi = -Infinity;
      m.grids.forEach((g) => g.forEach((x) => {
        lo = Math.min(lo, x);
        hi = Math.max(hi, x);
      }));
      return hi - lo;
    };
    expect(span(buildCandice('barbarriel').model)).toBeGreaterThan(span(buildCandice('base').model) * 3);
  });
  for (const k of ['sword', 'bow', 'halo'] as CandiceProp[]) {
    it(`builds the ${k} in one piece`, () => {
      const m = candiceProp(k);
      const counts = islands(m).filter((n, i) => m.grids[i].count() > 0);
      for (const n of counts) expect(n, `${k}: ${counts.join(',')}`).toBe(1);
    });
  }
  it('a wing sword is about a metre of blade', () => {
    expect(SWORD_TIP_Z - SWORD_BASE_Z).toBeGreaterThan(0.85);
    expect(SWORD_TIP_Z - SWORD_BASE_Z).toBeLessThan(1.1);
  });
  it('every string and move names a clip', () => {
    const base = new Set(CANDICE_CLIPS.map((c) => c.name));
    for (const n of [...CANDICE_CHAIN, 'cc_engulf', 'cc_point', 'cc_sky', 'cc_galvano', 'cc_rage', 'cc_release', 'dash', 'hit_heavy']) expect(base.has(n), n).toBe(true);
    const barb = new Set(BARBARRIEL_CLIPS.map((c) => c.name));
    for (const n of [...BARBARRIEL_CHAIN, 'cc_six', 'cc_javelin', 'cc_thunder', 'cc_stream', 'cc_sklav', 'cc_electro', 'dash', 'hit_heavy']) expect(barb.has(n), n).toBe(true);
  });
});
