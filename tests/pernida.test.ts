import { describe, expect, it } from 'vitest';
import { buildPernida, pernidaProp, type PernidaForm, type PernidaProp } from '../src/chars/pernida';
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

describe('Pernida Parnkgjas', () => {
  for (const form of ['cloak', 'voll', 'hand', 'arm', 'clone'] as PernidaForm[]) {
    it(`builds the ${form} without floating islands`, () => {
      const a = buildPernida(form);
      const isl = a.warnings.filter((w) => w.includes('island'));
      expect(isl, isl.join(' | ')).toEqual([]);
    });
  }
  it('the cloak stands about 1.5 m with its sockets', () => {
    const a = buildPernida('cloak');
    const h = height(a.model);
    expect(h).toBeGreaterThan(1.45);
    expect(h).toBeLessThan(1.65);
    for (const n of ['grip.L', 'palm.L', 'palm.R', 'tip.L', 'sleeve.L', 'sleeve.R', 'back', 'face', 'eye.L', 'eye.R', 'halo']) expect(Object.keys(a.model.sockets)).toContain(n);
  });
  it('the Vollständig grows two hand-wings', () => {
    const bones = buildPernida('voll').model.bones.map((b) => b.name);
    for (const n of ['wing.L', 'wing.R']) expect(bones).toContain(n);
  });
  it('the hand stands about 4.5 m on four roots, the arm about 11.7 m', () => {
    const hand = buildPernida('hand').model;
    expect(height(hand)).toBeGreaterThan(4.2);
    expect(height(hand)).toBeLessThan(4.8);
    const arm = buildPernida('arm').model;
    expect(height(arm)).toBeGreaterThan(11);
    expect(height(arm)).toBeLessThan(12.4);
    for (const m of [hand, arm]) {
      const bones = m.bones.map((b) => b.name);
      for (const n of ['hips', 'palm', 'thigh.L', 'shin.R', 'fthigh.L', 'ffoot.R', 'f.thumb.3', 'f.index.3', 'f.middle.3', 'f.ring.3', 'f.pinky.3']) expect(bones).toContain(n);
      const s = Object.keys(m.sockets);
      for (const n of ['palm.eye', 'palm.mouth', 'knot', 'tip.index', 'band.pinky', 'band.thumb']) expect(s).toContain(n);
    }
    expect(arm.bones.map((b) => b.name)).toContain('chest');
  });
  for (const k of ['bow', 'bow-tip', 'stone-hand', 'finger', 'halo', 'mouth'] as PernidaProp[]) {
    it(`builds the ${k} in one piece`, () => {
      const m = pernidaProp(k);
      const counts = islands(m).filter((_n, i) => m.grids[i].count() > 0);
      for (const n of counts) expect(n, `${k}: ${counts.join(',')}`).toBe(1);
    });
  }
});
