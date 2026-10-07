import { describe, expect, it } from 'vitest';
import { buildNnoitra, nnoitraProp } from '../src/chars/nnoitra';
import { ModelBuilder } from '../src/models/builder';

describe('nnoitra', () => {
  it('builds every form and the props without stray voxel islands', () => {
    for (const form of ['sealed', 'patch', 'santa'] as const) {
      const a = buildNnoitra(form);
      expect(a.warnings).toEqual([]);
      expect(a.model.grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(12000);
      const sockets = new Set(Object.keys(a.model.sockets));
      for (const n of ['grip.R', 'grip.L', 'face', 'mouth', 'chain', 'chest.front']) expect(sockets.has(n)).toBe(true);
      const bones = new Set(a.model.bones.map((b) => b.name));
      if (form === 'santa') for (const n of ['upperarm2.L', 'forearm2.R', 'fist2.L']) expect(bones.has(n)).toBe(true);
      if (form === 'santa') for (const n of ['grip2.L', 'grip2.R']) expect(sockets.has(n)).toBe(true);
    }
    const warned: string[] = [];
    const build = ModelBuilder.prototype.build;
    ModelBuilder.prototype.build = function (this: ModelBuilder) {
      warned.push(...this.warnings);
      return build.call(this);
    };
    try {
      for (const k of ['teresa', 'scythe', 'tongue'] as const) expect(nnoitraProp(k).grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(60);
    } finally {
      ModelBuilder.prototype.build = build;
    }
    expect(warned).toEqual([]);
  });
});
