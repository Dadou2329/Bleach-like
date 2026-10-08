import { describe, expect, it } from 'vitest';
import { buildHitsugaya } from '../src/chars/hitsugaya';
import { adultWings, buildHitsugayaAdult } from '../src/chars/hitsugayaAdult';
import type { VoxelModel } from '../src/models/builder';

/** 6-connected components of a one-bone prop */
function islands(m: VoxelModel): number {
  const g = m.grids[0];
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
}

describe('TYBW Hitsugaya', () => {
  for (const form of ['tybw', 'tybw-bankai', 'tybw-hollow'] as const) {
    it(`builds the ${form} body without floating islands`, () => {
      const a = buildHitsugaya(form);
      const isl = a.warnings.filter((w) => w.includes('island'));
      expect(isl, isl.join(' | ')).toEqual([]);
      for (const n of ['grip.R', 'back', 'face', 'finger.L']) expect(Object.keys(a.model.sockets)).toContain(n);
    });
  }
  it('builds the adult (Complete Bankai) body without floating islands', () => {
    const a = buildHitsugayaAdult();
    const isl = a.warnings.filter((w) => w.includes('island'));
    expect(isl, isl.join(' | ')).toEqual([]);
    for (const n of ['grip.R', 'back', 'face', 'finger.L']) expect(Object.keys(a.model.sockets)).toContain(n);
  });
  it('builds the thin ice wings in one piece', () => {
    const m = adultWings();
    expect(m.bones.length).toBe(1);
    expect(islands(m)).toBe(1);
  });
});
