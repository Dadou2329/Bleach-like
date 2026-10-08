import { describe, expect, it } from 'vitest';
import { buildFullbring, fbArmBlade, fbGuard, fbMachete, fbSheath, tensaV3, zangetsuV2 } from '../src/chars/ichigoFullbring';
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

describe('Lost Agent Ichigo', () => {
  for (const form of ['fb2', 'fb3', 'shikai2', 'bankai3'] as const) {
    it(`builds the ${form} body without floating islands`, () => {
      const a = buildFullbring(form);
      const isl = a.warnings.filter((w) => w.includes('island'));
      expect(isl, isl.join(' | ')).toEqual([]);
      for (const n of ['grip.R', 'forearm.R', 'back', 'knuckle.R', 'toe.R']) expect(Object.keys(a.model.sockets)).toContain(n);
    });
  }
  for (const [name, m] of [['guard', fbGuard], ['arm blade', fbArmBlade], ['machete', fbMachete], ['sheath', fbSheath], ['Shikai v2', zangetsuV2], ['Bankai v3', tensaV3]] as const) {
    it(`builds the ${name} in one piece`, () => {
      const model = m();
      expect(model.bones.length).toBe(1);
      expect(islands(model)).toBe(1);
    });
  }
});
