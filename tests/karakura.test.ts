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
    expect(Object.keys(town.spots)).toEqual(expect.arrayContaining(['school', 'clinic', 'river', 'park', 'shrine', 'urahara']));
    // the ground is deep: 14 m of earth and rock, bedrock only at the bottom
    expect(town.ground).toBeCloseTo(14, 1);
    const mid = Math.floor(w.sx / 2);
    expect(w.mats.def(w.get(5, Math.floor(7 / vs), mid)).name).toMatch(/stone/);
    expect(w.mats.def(w.get(5, 0, mid)).name).toBe('bedrock');
    // a sewer conduit runs under the main road: air 3-5 m below the asphalt at the road's centre line
    const mz = Math.floor(77 / vs);
    let tunnel = false;
    for (let y = Math.floor((town.ground - 5) / vs); y < Math.floor((town.ground - 2.8) / vs); y++) if (w.get(Math.floor(30 / vs), y, mz) === 0) tunnel = true;
    expect(tunnel).toBe(true);
    // office towers rise over the main road
    let tall = 0;
    for (let x = 0; x < w.sx; x += 8) for (let z = Math.floor(60 / vs); z < Math.floor(95 / vs); z += 8) if (w.isSolid(x, Math.floor((town.ground + 26) / vs), z)) tall++;
    expect(tall).toBeGreaterThan(4);
    console.log(`karakura: ${ms.toFixed(0)} ms, ${(w.memoryBytes() / 1048576).toFixed(1)} MB, chunks ${w.chunks.filter(Boolean).length}`);
    expect(ms).toBeLessThan(15000);
  }, 30000);
});
