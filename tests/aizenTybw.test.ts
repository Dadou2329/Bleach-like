import { describe, expect, it } from 'vitest';
import { buildAizen, aizenProp, type AizenProp } from '../src/chars/aizen';
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

describe('TYBW Aizen', () => {
  it('builds the prisoner body without floating islands', () => {
    const a = buildAizen('tybw');
    const isl = a.warnings.filter((w) => w.includes('island'));
    expect(isl, isl.join(' | ')).toEqual([]);
  });
  it('stands about 1.86 m with long hair on spring bones, a tunic and the chair socket', () => {
    const a = buildAizen('tybw');
    const h = height(a.model);
    expect(h).toBeGreaterThan(1.8);
    expect(h).toBeLessThan(1.95);
    const bones = a.model.bones.map((b) => b.name);
    for (const n of ['hair1', 'hair2', 'hair3']) expect(bones).toContain(n);
    expect(bones.some((n) => n.startsWith('coat'))).toBe(true);
    for (const n of ['chair', 'glasses', 'grip.R', 'palm.R', 'face']) expect(Object.keys(a.model.sockets)).toContain(n);
  });
  for (const k of ['chair', 'gag'] as AizenProp[]) {
    it(`builds the ${k} in one piece`, () => {
      const m = aizenProp(k);
      const counts = islands(m).filter((_n, i) => m.grids[i].count() > 0);
      for (const n of counts) expect(n, `${k}: ${counts.join(',')}`).toBe(1);
    });
  }
});
