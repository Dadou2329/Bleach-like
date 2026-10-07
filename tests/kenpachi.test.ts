import { describe, expect, it } from 'vitest';
import { buildKenpachi, kenpachiProp } from '../src/chars/kenpachi';
import { KENPACHI_BANKAI_CHAIN, KENPACHI_CLIPS, KENPACHI_POOL, KENPACHI_SHIKAI_CHAIN } from '../src/chars/kenpachiClips';

describe('kenpachi', () => {
  it('builds both bodies without stray voxel islands', () => {
    for (const form of ['sealed', 'bankai'] as const) {
      const a = buildKenpachi(form);
      expect(a.warnings).toEqual([]);
      expect(a.model.grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(30000);
      for (const s of ['grip.R', 'grip.L', 'hip.L', 'patch', 'face']) expect(a.model.sockets[s]).toBeDefined();
    }
  });

  it('builds every prop', () => {
    for (const k of ['nozarashi', 'saya', 'eyepatch', 'cleaver', 'bankai-blade', 'yachiru'] as const) {
      const m = kenpachiProp(k);
      expect(m.grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(40);
    }
  });

  it('every move in the string pools has a clip with a hit frame', () => {
    const names = new Set(KENPACHI_CLIPS.map((c) => c.name));
    for (const n of [...KENPACHI_POOL, ...KENPACHI_SHIKAI_CHAIN, ...KENPACHI_BANKAI_CHAIN]) {
      expect(names.has(n)).toBe(true);
      expect(KENPACHI_CLIPS.find((c) => c.name === n)!.events?.hit).toBeGreaterThan(0);
    }
  });
});
