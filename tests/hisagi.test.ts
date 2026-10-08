import { describe, expect, it } from 'vitest';
import { buildHisagi, hisagiProp } from '../src/chars/hisagi';
import { HISAGI_CHAIN, HISAGI_CLIPS, KAZESHINI_CHAIN, KAZESHINI_CLIPS } from '../src/chars/hisagiClips';

describe('Shūhei Hisagi', () => {
  it('builds without floating islands', () => {
    const a = buildHisagi();
    const islands = a.warnings.filter((w) => w.includes('island'));
    expect(islands, islands.join(' | ')).toEqual([]);
  });
  for (const k of ['katana', 'saya', 'sickle', 'orb', 'tattoo'] as const) {
    it(`builds the ${k}`, () => {
      const m = hisagiProp(k);
      expect(m.bones.length).toBeGreaterThan(0);
    });
  }
  it('has every clip the kit plays', () => {
    const s = HISAGI_CLIPS.map((c) => c.name), k = KAZESHINI_CLIPS.map((c) => c.name);
    for (const n of [...HISAGI_CHAIN, 'hs_draw', 'hs_rod', 'hs_band', 'hs_raiden', 'hs_sajo', 'hs_kare', 'dash', 'hit_heavy']) expect(s).toContain(n);
    for (const n of [...KAZESHINI_CHAIN, 'hs_fan', 'hs_steer', 'hs_kubi', 'hs_bind', 'hs_life', 'hs_bankai', 'hs_noose', 'hs_verdict', 'hs_band', 'hs_kare', 'dash', 'hit_heavy']) expect(k).toContain(n);
  });
  it('keeps the explosive bands on their own bones (the kit hides them as they are thrown)', () => {
    const m = buildHisagi().model;
    for (const bone of ['choker', 'armband.L', 'armband.R']) {
      const i = m.bones.findIndex((b) => b.name === bone);
      expect(i, bone).toBeGreaterThanOrEqual(0);
      expect(m.grids[i].count(), bone).toBeGreaterThan(20);
    }
  });
});
