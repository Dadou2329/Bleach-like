import { describe, expect, it } from 'vitest';
import { SHINJI_PROP_WARNINGS, buildShinji, shinjiProp } from '../src/chars/shinji';
import { buildFlower } from '../src/chars/shinjiFlower';

describe('Shinji', () => {
  it('builds without floating islands', () => {
    const a = buildShinji();
    const islands = a.warnings.filter((w) => w.includes('island'));
    expect(islands, islands.join(' | ')).toEqual([]);
  });
  it('builds Sakanade (sealed, Shikai, Bankai) and the mask', () => {
    for (const k of ['katana', 'shikai', 'bankai', 'mask'] as const) {
      const m = shinjiProp(k);
      expect(m).toBeTruthy();
      const islands = (SHINJI_PROP_WARNINGS[k] ?? []).filter((w) => w.includes('island'));
      expect(islands, `${k}: ${islands.join(' | ')}`).toEqual([]);
    }
  });
  it('builds the Bankai flower: eight petals and the receptacle, each one piece', () => {
    const a = buildFlower();
    const islands = a.warnings.filter((w) => w.includes('island'));
    expect(islands, islands.join(' | ')).toEqual([]);
    for (let i = 0; i < 8; i++) expect(a.model.bones.some((bn) => bn.name === `petal${i}`)).toBe(true);
  });
});
