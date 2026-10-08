import { describe, expect, it } from 'vitest';
import { buildYumichika, yumichikaProp } from '../src/chars/yumichika';
import { FUJI_CHAIN, FUJI_CLIPS, RURI_CHAIN, RURI_CLIPS, YUMICHIKA_CHAIN, YUMICHIKA_CLIPS } from '../src/chars/yumichikaClips';

describe('Yumichika Ayasegawa', () => {
  it('builds without floating islands', () => {
    const a = buildYumichika();
    const islands = a.warnings.filter((w) => w.includes('island'));
    expect(islands, islands.join(' | ')).toEqual([]);
  });
  for (const k of ['katana', 'saya', 'fuji', 'ruri'] as const) {
    it(`builds the ${k}`, () => {
      expect(yumichikaProp(k).bones.length).toBeGreaterThan(0);
    });
  }
  it('has every clip the kit plays', () => {
    const s = YUMICHIKA_CLIPS.map((c) => c.name), f = FUJI_CLIPS.map((c) => c.name), r = RURI_CLIPS.map((c) => c.name);
    for (const n of [...YUMICHIKA_CHAIN, 'ym_flurry', 'ym_palm', 'ym_lift', 'ym_hair', 'ym_release', 'dash', 'hit_heavy']) expect(s).toContain(n);
    for (const n of [...FUJI_CHAIN, 'ym_flurry', 'ym_lift', 'ym_hair', 'yf_spin', 'yf_catch', 'yf_truth', 'dash']) expect(f).toContain(n);
    for (const n of [...RURI_CHAIN, 'yr_burst', 'yr_snare', 'yr_bloom', 'yr_petal', 'yr_thicket', 'yr_seal', 'dash']) expect(r).toContain(n);
  });
});
