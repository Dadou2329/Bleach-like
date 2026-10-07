import { describe, expect, it } from 'vitest';
import { buildHitsugaya, hitsugayaProp } from '../src/chars/hitsugaya';
import { DAIGUREN_CHAIN, HITSUGAYA_CHAIN, HITSUGAYA_CLIPS } from '../src/chars/hitsugayaClips';

describe('hitsugaya', () => {
  it('builds both bodies without stray voxel islands', () => {
    for (const form of ['captain', 'bankai'] as const) {
      const a = buildHitsugaya(form);
      expect(a.warnings).toEqual([]);
      expect(a.model.grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(20000);
    }
  });

  it('the Bankai carries wings, a four-segment tail and twelve petals', () => {
    const a = buildHitsugaya('bankai');
    const names = new Set(a.model.bones.map((b) => b.name));
    for (const n of ['wing.L', 'wing.R', 'tail.1', 'tail.4', 'flowers']) expect(names.has(n)).toBe(true);
    for (let i = 0; i < 12; i++) expect(names.has(`petal.${i}`)).toBe(true);
    expect(a.springs.some((s) => s.bone === 'wing.L')).toBe(true);
  });

  it('builds every prop', () => {
    for (const k of ['sword', 'sheathed', 'crescent', 'bankai-sword', 'dragon-head'] as const) {
      expect(hitsugayaProp(k).grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(60);
    }
  });
});

describe('hitsugaya clips', () => {
  it('every move in the strings has a clip with a hit frame', () => {
    const names = new Set(HITSUGAYA_CLIPS.map((c) => c.name));
    for (const n of [...HITSUGAYA_CHAIN, ...DAIGUREN_CHAIN, 'hg_thrust']) {
      expect(names.has(n)).toBe(true);
      expect(HITSUGAYA_CLIPS.find((c) => c.name === n)!.events?.hit).toBeGreaterThan(0);
    }
    for (const n of ['hg_draw', 'hg_shikai', 'hg_bankai', 'hg_dragon', 'hg_chain', 'hg_wave', 'hg_senbi', 'hg_tsurara', 'hg_hyoro', 'hg_hyakkaso', 'hg_flap', 'dash', 'hit_heavy']) expect(names.has(n)).toBe(true);
  });
});
