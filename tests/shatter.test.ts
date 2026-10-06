import { describe, expect, it } from 'vitest';
import { buildHollowMask } from '../src/chars/ichigo';
import { shatterModel } from '../src/models/shatter';

describe('shatter', () => {
  it('splits a prop into shards that cover every voxel once, with growing crack lines', () => {
    const mask = buildHollowMask();
    const total = mask.grids[0].count();
    const s = shatterModel(mask, { pieces: 9, seed: 11, levels: [0.25, 0.6] });
    expect(s.shards.length).toBeGreaterThanOrEqual(6);
    // shards partition the voxels
    const seen = new Set<string>();
    let sum = 0;
    for (const sh of s.shards) {
      expect(sh.voxels).toBeGreaterThan(5);
      sh.model.grids[0].forEach((x, y, z, v) => {
        const k = `${x},${y},${z}`;
        expect(seen.has(k)).toBe(false);
        seen.add(k);
        expect(v).toBe(mask.grids[0].get(x, y, z));
        sum++;
      });
    }
    expect(sum).toBe(total);
    // cracked copies keep the shape; later levels show more crack voxels
    const crackIdx = mask.palette.length;
    const cracks = s.cracked.map((m) => {
      expect(m.grids[0].count()).toBe(total);
      let n = 0;
      m.grids[0].forEach((_x, _y, _z, v) => { if ((v & 0xff) === crackIdx) n++; });
      return n;
    });
    expect(cracks[0]).toBeGreaterThan(0);
    expect(cracks[1]).toBeGreaterThan(cracks[0]);
    // cracks stay thin: a minority of the surface
    expect(cracks[1]).toBeLessThan(total * 0.25);
  });
});
