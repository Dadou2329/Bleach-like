import { describe, expect, it } from 'vitest';
import { buildNelliel, nelProp } from '../src/chars/nelliel';

describe('Nelliel Tu Odelschwanck', () => {
  for (const form of ['adult', 'child', 'gamuza'] as const) {
    it(`builds the ${form} without floating islands`, () => {
      const a = buildNelliel(form);
      const islands = a.warnings.filter((w) => w.includes('island'));
      expect(islands, islands.join(' | ')).toEqual([]);
    });
  }
  it('builds Gamuza sealed and the lance', () => {
    expect(nelProp('gamuza').bones.length).toBeGreaterThan(0);
    expect(nelProp('lance').bones.length).toBeGreaterThan(0);
  });
});
