import { describe, expect, it } from 'vitest';
import { buildLilynette, buildStarrk, starrkProp } from '../src/chars/starrk';
import { ModelBuilder } from '../src/models/builder';
import { LILY_CLIPS, LOBOS_CHAIN, STARRK_CHAIN, STARRK_CLIPS } from '../src/chars/starrkClips';

describe('starrk', () => {
  it('builds every form, Lilynette and the props without stray voxel islands', () => {
    for (const form of ['sealed', 'glove', 'lobos'] as const) {
      const a = buildStarrk(form);
      expect(a.warnings).toEqual([]);
      expect(a.model.grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(14000);
      const sockets = new Set(Object.keys(a.model.sockets));
      for (const n of ['grip.R', 'grip.L', 'hip.L', 'face', 'chin', 'hole', 'back']) expect(sockets.has(n)).toBe(true);
    }
    const l = buildLilynette();
    expect(l.warnings).toEqual([]);
    const ls = new Set(Object.keys(l.model.sockets));
    for (const n of ['grip.R', 'face', 'horn', 'back']) expect(ls.has(n)).toBe(true);
    // props keep their lint warnings on the builder: collect them as they build
    const warned: string[] = [];
    const build = ModelBuilder.prototype.build;
    ModelBuilder.prototype.build = function (this: ModelBuilder) {
      warned.push(...this.warnings);
      return build.call(this);
    };
    try {
      for (const k of ['katana', 'sheath', 'sheath-empty', 'gunR', 'gunL', 'colmillo', 'wolf', 'lilyBlade'] as const) expect(starrkProp(k).grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(40);
    } finally {
      ModelBuilder.prototype.build = build;
    }
    expect(warned).toEqual([]);
  });
});

describe('starrk clips', () => {
  it('cuts land after their step, shots fire before the chain moves on, the release touches her before the form', () => {
    const byName = new Map(STARRK_CLIPS.map((c) => [c.name, c]));
    const ev = (clip: string, key: string): number => byName.get(clip)?.events?.[key] ?? -1;
    for (const n of STARRK_CHAIN) expect(ev(n, 'hit')).toBeGreaterThan(ev(n, 'step'));
    for (const n of LOBOS_CHAIN) {
      const fire = Math.max(ev(n, 'fireR'), ev(n, 'fireL'), ev(n, 'hit'));
      expect(fire).toBeGreaterThan(0);
      expect(ev(n, 'combo')).toBeGreaterThan(fire);
    }
    expect(ev('st_release', 'form')).toBeGreaterThan(ev('st_release', 'touch'));
    expect(ev('st_charged', 'fireR')).toBeGreaterThan(ev('st_charged', 'charge'));
    expect(ev('st_metralleta', 'end')).toBeGreaterThan(ev('st_metralleta', 'start') + 2);
    expect(ev('st_spray', 'end')).toBeGreaterThan(ev('st_spray', 'start'));
    for (const [n, k] of [['st_cero', 'fire'], ['st_cero_chest', 'fire'], ['st_glove', 'off'], ['st_wolves', 'pour'], ['st_colmillo', 'draw'], ['st_feint', 'go']]) expect(ev(n, k)).toBeGreaterThan(0);
    for (const n of ['dash', 'airstep', 'hit_heavy']) expect(byName.has(n)).toBe(true);
  });
  it("Lilynette's clips: her hits come in order and her Cero charges before it fires", () => {
    const byName = new Map(LILY_CLIPS.map((c) => [c.name, c]));
    const ev = (clip: string, key: string): number => byName.get(clip)?.events?.[key] ?? -1;
    expect(ev('ll_kick', 'hit')).toBeGreaterThan(ev('ll_kick', 'hop'));
    expect(ev('ll_slash', 'hit3')).toBeGreaterThan(ev('ll_slash', 'hit2'));
    expect(ev('ll_slash', 'hit2')).toBeGreaterThan(ev('ll_slash', 'hit1'));
    expect(ev('ll_cero', 'fire')).toBeGreaterThan(ev('ll_cero', 'charge'));
    expect(ev('ll_head', 'hit')).toBeGreaterThan(0);
    expect(ev('ll_draw', 'draw')).toBeGreaterThan(0);
    expect(byName.has('ll_merge')).toBe(true);
  });
});
