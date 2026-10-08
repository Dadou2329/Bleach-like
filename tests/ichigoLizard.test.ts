import { describe, expect, it } from 'vitest';
import { buildIchigoLizard, lizardMask, wormHead, wormSegment } from '../src/chars/ichigoLizard';
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

describe('Hollowfied Ichigo (the lizard)', () => {
  it('builds the body without floating islands, with the tail and the sockets the kit uses', () => {
    const a = buildIchigoLizard();
    const isl = a.warnings.filter((w) => w.includes('island'));
    expect(isl, isl.join(' | ')).toEqual([]);
    const bones = a.model.bones.map((b) => b.name);
    for (const n of ['tail1', 'tail2', 'tail3', 'tail4', 'mane1']) expect(bones).toContain(n);
    for (const n of ['fingers.R', 'shoulder.L', 'face', 'mouth', 'tailTip', 'knuckle.R', 'knuckle.L']) expect(Object.keys(a.model.sockets)).toContain(n);
    for (const t of ['tail1', 'tail2', 'tail3', 'tail4']) expect(a.springs.some((s) => s.bone === t)).toBe(true);
  });
  for (const [name, m] of [['mask', lizardMask], ['worm head', wormHead], ['worm segment', wormSegment]] as const) {
    it(`builds the ${name} in one piece`, () => {
      const model = m();
      expect(model.bones.length).toBe(1);
      expect(islands(model)).toBe(1);
    });
  }
});
