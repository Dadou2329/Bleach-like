import { describe, expect, it } from 'vitest';
import { YHWACH_PROP_WARNINGS, buildYhwach, yhwachProp } from '../src/chars/yhwach';

describe('Yhwach', () => {
  for (const form of ['emperor', 'almighty', 'soulking'] as const) {
    it(`builds the ${form} without floating islands`, () => {
      const a = buildYhwach(form);
      const islands = a.warnings.filter((w) => w.includes('island'));
      expect(islands, islands.join(' | ')).toEqual([]);
    });
  }
  it('builds the sword, the broadsword and the mask', () => {
    for (const k of ['sword', 'broadsword', 'mask'] as const) {
      expect(yhwachProp(k)).toBeTruthy();
      const islands = (YHWACH_PROP_WARNINGS[k] ?? []).filter((w) => w.includes('island'));
      expect(islands, `${k}: ${islands.join(' | ')}`).toEqual([]);
    }
  });
});
