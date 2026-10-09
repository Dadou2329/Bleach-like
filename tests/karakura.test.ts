import { describe, expect, it } from 'vitest';
import { generateKarakura } from '../src/maps/karakura';

describe('karakura', () => {
  it('generates a big town on deep ground with its landmarks in reasonable time', () => {
    const t0 = performance.now();
    const town = generateKarakura(7);
    const ms = performance.now() - t0;
    const w = town.world;
    const vs = w.vs;
    const name = (x: number, y: number, z: number) => w.mats.def(w.get(x, y, z)).name;
    const at = (m: number) => Math.floor(m / vs);
    expect(town.size).toBe(320);
    expect(w.sx * vs).toBeGreaterThanOrEqual(320);
    // spawn is on the road surface
    const sx = at(town.spawn[0]), sz = at(town.spawn[1]);
    let gy = 0;
    for (let y = w.sy - 1; y >= 0; y--) if (w.isSolid(sx, y, sz)) { gy = y; break; }
    expect(name(sx, gy, sz)).toMatch(/asphalt|road/);
    expect(Object.keys(town.spots)).toEqual(
      expect.arrayContaining(['school', 'clinic', 'river', 'park', 'shrine', 'urahara', 'station', 'hospital', 'store', 'site', 'training', 'works', 'pylon']),
    );
    // the ground is deep: 32 m of earth and rock, the layers in order, bedrock only at the bottom
    expect(town.ground).toBeCloseTo(32, 1);
    const G = at(town.ground);
    const x = at(5), z = at(160);
    expect(name(x, G - 1, z)).toBe('grass');
    expect(name(x, G - at(3), z)).toBe('clay');
    expect(name(x, G - at(6), z)).toBe('sand');
    expect(name(x, G - at(14), z)).toMatch(/stone/);
    expect(name(x, G - at(29), z)).toBe('granite');
    expect(name(x, 0, z)).toBe('bedrock');
    // a sewer conduit runs under the main road: air 3-5 m below the asphalt at the road's centre line
    const mz = at(77);
    let tunnel = false;
    for (let y = at(town.ground - 5); y < at(town.ground - 2.8); y++) if (w.get(at(30), y, mz) === 0) tunnel = true;
    expect(tunnel).toBe(true);
    // towers rise downtown, along the main street
    let tall = 0;
    for (let xx = 0; xx < w.sx; xx += 8) for (let zz = at(30); zz < at(120); zz += 8) if (w.isSolid(xx, at(town.ground + 30), zz)) tall++;
    expect(tall).toBeGreaterThan(20);
    // the railway: rails on the viaduct over the fourth east-west road, 8 m above the street
    let rails = 0;
    for (let zz = at(176); zz < at(186); zz++) for (let y = G + at(7); y < G + at(10); y++) if (name(at(10), y, zz) === 'rail') rails++;
    expect(rails).toBeGreaterThanOrEqual(4);
    // deep under Urahara Shop: a cavern with a painted sky over it (probed beside the ladder shaft in its middle)
    const [tx, tz] = town.spots.training;
    const floor = G - at(29);
    let open = 0, sky = 0;
    for (const [ox, oz] of [[4, 0], [-4, 0], [0, 5], [0, -5], [9, 7], [-9, -7]]) {
      const px = at(tx + ox), pz = at(tz + oz);
      if (w.get(px, floor + at(4), pz) === 0) open++;
      for (let y = floor; y < G; y++) if (name(px, y, pz) === 'sky_mural') { sky++; break; }
    }
    expect(open).toBeGreaterThanOrEqual(4);
    expect(sky).toBeGreaterThanOrEqual(4);
    console.log(`karakura: ${ms.toFixed(0)} ms, chunks ${w.chunks.filter(Boolean).length}`);
    expect(ms).toBeLessThan(20000);
  }, 60000);
});
