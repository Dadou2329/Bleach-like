import { describe, expect, it } from 'vitest';
import { buildKenpachi, kenpachiProp, type KenpachiProp } from '../src/chars/kenpachi';
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

describe('TYBW Kenpachi', () => {
  for (const form of ['tybw', 'tybw-bankai'] as const) {
    it(`builds the ${form} body without floating islands`, () => {
      const a = buildKenpachi(form);
      const isl = a.warnings.filter((w) => w.includes('island'));
      expect(isl, isl.join(' | ')).toEqual([]);
    });
  }
  it('stands about 2 m with long hair on three spring bones, and a socket for the torn arm', () => {
    const a = buildKenpachi('tybw');
    const h = height(a.model);
    expect(h).toBeGreaterThan(1.95);
    expect(h).toBeLessThan(2.2);
    const bones = a.model.bones.map((b) => b.name);
    for (const n of ['mane.1', 'mane.2', 'mane.3', 'forearm.R']) expect(bones).toContain(n);
    for (const n of ['mane.1', 'mane.2', 'mane.3']) expect(a.springs.map((s) => s.bone)).toContain(n);
    for (const n of ['grip.R', 'hip.L', 'patch', 'elbow.R', 'face']) expect(Object.keys(a.model.sockets)).toContain(n);
  });
  it('the Bankai keeps the long hair and grows horns', () => {
    const a = buildKenpachi('tybw-bankai');
    expect(a.model.bones.map((b) => b.name)).toContain('mane.3');
    expect(height(a.model)).toBeGreaterThan(2.0);
  });
  for (const k of ['eyepatch-tybw', 'stump'] as KenpachiProp[]) {
    it(`builds the ${k} in one piece`, () => {
      const m = kenpachiProp(k);
      const counts = islands(m).filter((_n, i) => m.grids[i].count() > 0);
      for (const n of counts) expect(n, `${k}: ${counts.join(',')}`).toBe(1);
    });
  }
});
