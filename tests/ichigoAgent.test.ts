import { describe, expect, it } from 'vitest';
import { baseballBat, firstSheath, firstSword } from '../src/chars/ichigoAgent';
import { buildIchigo, halfMask } from '../src/chars/ichigo';
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

describe('Agent of the Shinigami Ichigo', () => {
  it('builds the Substitute body with the brown strap, without floating islands', () => {
    const a = buildIchigo('substitute');
    const islands = a.warnings.filter((w) => w.includes('island'));
    expect(islands, islands.join(' | ')).toEqual([]);
  });
  for (const [name, m] of [['first sword', firstSword], ['sheath', firstSheath], ['bat', baseballBat], ['half mask', halfMask]] as const) {
    it(`builds the ${name} in one piece`, () => {
      const model = m();
      expect(model.bones.length).toBe(1);
      let n = 0;
      model.grids.forEach((g) => (n += g.count()));
      expect(n).toBeGreaterThan(50);
      expect(islands(model)).toBe(1);
    });
  }
});
