import { describe, expect, it } from 'vitest';
import { buildLille, lilleProp, type LilleProp } from '../src/chars/lille';
import { buildJilliel, buildRemnant, buildTrueForm, lilleGodProp, type LilleGodProp } from '../src/chars/lilleGod';
import { JILLIEL_CLIPS, LILLE_CLIPS, LILLE_SHOTS, LILLE_STOCK, REMNANT_CLIPS, TRUE_CHAIN, TRUE_CLIPS } from '../src/chars/lilleClips';
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

function height(m: VoxelModel): number {
  let hi = -Infinity;
  m.grids.forEach((g) => g.forEach((_x, y) => { hi = Math.max(hi, y); }));
  return hi / m.res;
}

describe('Lille Barro', () => {
  for (const form of ['base', 'open'] as const) {
    it(`builds the ${form} body without floating islands`, () => {
      const a = buildLille(form);
      const isl = a.warnings.filter((w) => w.includes('island'));
      expect(isl, isl.join(' | ')).toEqual([]);
      for (const n of ['grip.R', 'grip.L', 'palm.R', 'back', 'chest.front', 'face', 'eye.L', 'eye.R', 'halo']) expect(Object.keys(a.model.sockets)).toContain(n);
    });
  }
  it('stands about 1.8 m', () => {
    const h = height(buildLille('base').model);
    expect(h).toBeGreaterThan(1.7);
    expect(h).toBeLessThan(1.95);
  });
  it('builds Jilliel with eight wings and 24 barrels', () => {
    const a = buildJilliel();
    const isl = a.warnings.filter((w) => w.includes('island'));
    expect(isl, isl.join(' | ')).toEqual([]);
    const s = Object.keys(a.model.sockets);
    for (let i = 0; i < 24; i++) expect(s).toContain(`barrel.${i}`);
    for (const n of ['headProp', 'halo', 'grip.R', 'grip.L']) expect(s).toContain(n);
    const h = height(a.model);
    expect(h).toBeGreaterThan(3);
    expect(h).toBeLessThan(4.5);
  });
  it('builds the True Form with gold wings, a long neck and room for two more arms', () => {
    const a = buildTrueForm();
    const isl = a.warnings.filter((w) => w.includes('island'));
    expect(isl, isl.join(' | ')).toEqual([]);
    const s = Object.keys(a.model.sockets);
    for (let i = 0; i < 24; i++) expect(s).toContain(`barrel.${i}`);
    for (const n of ['headProp', 'halo', 'mouth', 'finger.R', 'finger.L', 'arm2.L', 'arm2.R']) expect(s).toContain(n);
    const bones = a.model.bones.map((b) => b.name);
    for (const n of ['neck', 'neck2', 'neck3']) expect(bones).toContain(n);
    expect(height(a.model)).toBeGreaterThan(5.5);
  });
  it('builds a remnant bird', () => {
    const a = buildRemnant();
    const isl = a.warnings.filter((w) => w.includes('island'));
    expect(isl, isl.join(' | ')).toEqual([]);
    expect(Object.keys(a.model.sockets)).toContain('mouth');
  });
  for (const k of ['diagramm', 'diagramm-r'] as LilleProp[]) {
    it(`builds the ${k} in one piece`, () => {
      const m = lilleProp(k);
      const counts = islands(m).filter((_n, i) => m.grids[i].count() > 0);
      for (const n of counts) expect(n, `${k}: ${counts.join(',')}`).toBe(1);
    });
  }
  for (const k of ['halo-green', 'halo-gold', 'head-god', 'head-owl', 'trompete', 'arm'] as LilleGodProp[]) {
    it(`builds the ${k} in one piece`, () => {
      const m = lilleGodProp(k);
      const counts = islands(m).filter((_n, i) => m.grids[i].count() > 0);
      for (const n of counts) expect(n, `${k}: ${counts.join(',')}`).toBe(1);
    });
  }
  it('every string and move names a clip', () => {
    const base = new Set(LILLE_CLIPS.map((c) => c.name));
    for (const n of [...LILLE_SHOTS, ...LILLE_STOCK, 'll_scope', 'll_xaxis', 'll_hail', 'll_kneel', 'll_eye', 'll_flare', 'll_leap', 'll_release', 'dash', 'hit_heavy']) expect(base.has(n), n).toBe(true);
    const jil = new Set(JILLIEL_CLIPS.map((c) => c.name));
    for (const n of ['jl_wing', 'jl_six', 'jl_barrage', 'jl_pressure', 'jl_snipe', 'jl_descent', 'jl_judge', 'dash']) expect(jil.has(n), n).toBe(true);
    const tf = new Set(TRUE_CLIPS.map((c) => c.name));
    for (const n of [...TRUE_CHAIN, 'tf_beam', 'tf_sabaki', 'tf_volley', 'tf_ball', 'tf_arms', 'tf_owl', 'tf_trompete', 'tf_rise', 'dash']) expect(tf.has(n), n).toBe(true);
    const rm = new Set(REMNANT_CLIPS.map((c) => c.name));
    for (const n of ['rm_peck', 'rm_charge', 'rm_spin']) expect(rm.has(n), n).toBe(true);
  });
});
