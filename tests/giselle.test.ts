import { describe, expect, it } from 'vitest';
import { buildGiselle, giselleProp, skeletonAsset, type GiselleProp } from '../src/chars/giselle';
import { AZHALBIORA_CHAIN, AZHALBIORA_CLIPS, GISELLE_CHAIN, GISELLE_CLIPS, SKELETON_CLIPS } from '../src/chars/giselleClips';
import { REACTION_CLIPS } from '../src/chars/reactionClips';
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

describe('Giselle Gewelle', () => {
  for (const form of ['base', 'azhalbiora', 'sklaverei'] as const) {
    it(`builds the ${form} body without floating islands`, () => {
      const a = buildGiselle(form);
      const isl = a.warnings.filter((w) => w.includes('island'));
      expect(isl, isl.join(' | ')).toEqual([]);
      for (const n of ['grip.L', 'grip.R', 'palm.R', 'knuckle.L', 'knuckle.R', 'thumb.R', 'heart', 'halo', 'mouth', 'eye.L', 'toe.R', 'tail']) expect(Object.keys(a.model.sockets)).toContain(n);
      const bones = a.model.bones.map((b) => b.name);
      for (const n of ['hair1', 'hair2', 'hair3', 'coat.F.L', 'coat.B.R']) expect(bones).toContain(n);
      if (form === 'base') expect(bones).not.toContain('wing.L');
      else for (const n of ['wing.L', 'wing.R', 'tail1', 'tail2', 'tail3']) expect(bones).toContain(n);
    });
  }
  it('stands 1.6 m, the antennae included', () => {
    const m = buildGiselle('base').model;
    let hi = -Infinity;
    m.grids.forEach((g) => g.forEach((_x, y) => { hi = Math.max(hi, y); }));
    expect(hi / m.res).toBeGreaterThan(1.55);
    expect(hi / m.res).toBeLessThan(1.95);
  });
  for (const k of ['bow', 'skull', 'bone', 'halo'] as GiselleProp[]) {
    it(`builds the ${k} in one piece`, () => {
      const m = giselleProp(k);
      const counts = islands(m).filter((_n, i) => m.grids[i].count() > 0);
      for (const n of counts) expect(n, `${k}: ${counts.join(',')}`).toBe(1);
    });
  }
  it('builds the Dancing Dead Boys’ skeleton on a humanoid rig', () => {
    const a = skeletonAsset();
    const bones = a.model.bones.map((b) => b.name);
    for (const n of ['hips', 'chest', 'head', 'upperarm.L', 'forearm.R', 'thigh.L', 'shin.R']) expect(bones).toContain(n);
    const isl = a.warnings.filter((w) => w.includes('island'));
    expect(isl, isl.join(' | ')).toEqual([]);
  });
  it('every string and move names a clip', () => {
    const base = new Set(GISELLE_CLIPS.map((c) => c.name));
    for (const n of [...GISELLE_CHAIN, 'gg_bait', 'gg_grin', 'gg_bite', 'gg_command', 'gg_raise', 'gg_drink', 'gg_bow', 'gg_release', 'dash', 'hit_heavy']) expect(base.has(n), n).toBe(true);
    const azh = new Set(AZHALBIORA_CLIPS.map((c) => c.name));
    for (const n of [...AZHALBIORA_CHAIN, 'gz_munchy', 'gz_dance', 'gz_sklav', 'gz_march', 'gg_command', 'gg_raise', 'gg_bait', 'gg_grin', 'dash']) expect(azh.has(n), n).toBe(true);
    const sk = new Set(SKELETON_CLIPS.map((c) => c.name));
    for (const n of ['sk_slap', 'sk_dance', 'hit_heavy']) expect(sk.has(n), n).toBe(true);
    expect(REACTION_CLIPS.map((c) => c.name)).toContain('puppet_stab');
  });
});
