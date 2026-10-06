import { describe, expect, it } from 'vitest';
import { generateKarakura } from '../src/maps/karakura';

describe('karakura', () => {
  it('generates a town with roads, buildings and a river in reasonable time', () => {
    const t0 = performance.now();
    const town = generateKarakura(7);
    const ms = performance.now() - t0;
    const w = town.world;
    const vs = w.vs;
    // spawn is on the road surface
    const sx = Math.floor(town.spawn[0] / vs), sz = Math.floor(town.spawn[1] / vs);
    let gy = 0;
    for (let y = w.sy - 1; y >= 0; y--) if (w.isSolid(sx, y, sz)) { gy = y; break; }
    expect(w.mats.def(w.get(sx, gy, sz)).name).toMatch(/asphalt|road/);
    expect(Object.keys(town.spots)).toEqual(expect.arrayContaining(['school', 'clinic', 'river', 'park']));
    console.log(`karakura: ${ms.toFixed(0)} ms, ${(w.memoryBytes() / 1048576).toFixed(1)} MB, chunks ${w.chunks.filter(Boolean).length}`);
    expect(ms).toBeLessThan(15000);
  }, 30000);
});
