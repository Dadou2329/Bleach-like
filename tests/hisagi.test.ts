import { describe, expect, it } from 'vitest';
import { buildHisagi, hisagiProp } from '../src/chars/hisagi';

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
});
