import { describe, expect, it } from 'vitest';
import { buildRenjiTybw, renjiTybwProp, type RenjiTybwProp } from '../src/chars/renjiTybw';
import { renjiProp } from '../src/chars/renji';
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

describe('TYBW Renji', () => {
  for (const form of ['oken', 'soo'] as const) {
    it(`builds the ${form} body without floating islands`, () => {
      const a = buildRenjiTybw(form);
      const isl = a.warnings.filter((w) => w.includes('island'));
      expect(isl, isl.join(' | ')).toEqual([]);
      for (const n of ['grip.R', 'grip.L', 'palm.L', 'face', 'back']) expect(Object.keys(a.model.sockets)).toContain(n);
      if (form === 'soo') expect(Object.keys(a.model.sockets)).toContain('nozzle');
    });
  }
  for (const k of ['soo-blade', 'orochio', 'orochio-hot', 'tail-vert', 'hihio', 'hihio-bare', 'fur-clump', 'hand-open', 'hand-fist'] as RenjiTybwProp[]) {
    it(`builds the ${k} prop in one piece per bone`, () => {
      const m = renjiTybwProp(k);
      const counts = islands(m).filter((n, i) => m.grids[i].count() > 0);
      for (const n of counts) expect(n, `${k}: ${counts.join(',')}`).toBe(1);
    });
  }
  it('Hihiō carries his left arm bone names and its sockets', () => {
    const m = renjiTybwProp('hihio');
    const names = m.bones.map((b) => b.name);
    for (const n of ['shoulder.L', 'upperarm.L', 'forearm.L', 'hand.L', 'palm.L', 'fist.L']) expect(names).toContain(n);
    for (const s of ['fist', 'palm', 'nozzle']) expect(Object.keys(m.sockets)).toContain(s);
  });
  it('builds the burning skull like the bone one', () => {
    expect(islands(renjiProp('skull-flame'))).toEqual(islands(renjiProp('skull')));
  });
});
