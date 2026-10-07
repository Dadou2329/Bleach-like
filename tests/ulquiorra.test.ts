import { describe, expect, it } from 'vitest';
import { buildUlquiorra, ulquiorraProp } from '../src/chars/ulquiorra';

describe('ulquiorra', () => {
  it('builds all three bodies without stray voxel islands', () => {
    for (const form of ['sealed', 'murcielago', 'segunda'] as const) {
      const a = buildUlquiorra(form);
      expect(a.warnings).toEqual([]);
      expect(a.model.grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(20000);
    }
  });

  it('builds every prop', () => {
    for (const k of ['katana', 'sheath', 'sheath-empty', 'luz', 'lanza'] as const) {
      expect(ulquiorraProp(k).grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(40);
    }
  });
});

import { MURCIELAGO_CHAIN, SEGUNDA_CHAIN, ULQUIORRA_CHAIN, ULQUIORRA_CLIPS, ULQUIORRA_SWORD_CHAIN } from '../src/chars/ulquiorraClips';

describe('ulquiorra clips', () => {
  it('every move in the strings has a clip with a hit frame', () => {
    const names = new Set(ULQUIORRA_CLIPS.map((c) => c.name));
    for (const n of [...ULQUIORRA_CHAIN, ...ULQUIORRA_SWORD_CHAIN, ...MURCIELAGO_CHAIN, ...SEGUNDA_CHAIN, 'ul_nukite']) {
      expect(names.has(n)).toBe(true);
      expect(ULQUIORRA_CLIPS.find((c) => c.name === n)!.events?.hit).toBeGreaterThan(0);
    }
    for (const n of ['ul_cero', 'ul_bala', 'ul_draw', 'ul_throw', 'ul_oscuras', 'ul_wingslap', 'ul_flap', 'ul_release', 'ul_grab', 'ul_lanza', 'ul_segunda', 'dash', 'hit_heavy']) expect(names.has(n)).toBe(true);
  });
});
