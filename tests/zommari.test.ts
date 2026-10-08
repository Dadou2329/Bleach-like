import { describe, expect, it } from 'vitest';
import { buildZommari, zommariProp } from '../src/chars/zommari';

describe('Zommari Rureaux', () => {
  for (const form of ['sealed', 'brujeria', 'blind'] as const) {
    it(`builds the ${form} body without floating islands`, () => {
      const a = buildZommari(form);
      const islands = a.warnings.filter((w) => w.includes('island'));
      expect(islands, islands.join(' | ')).toEqual([]);
    });
  }
  for (const k of ['katana', 'sheath', 'embrion'] as const) {
    it(`builds the ${k} in one piece`, () => {
      expect(zommariProp(k).bones.length).toBeGreaterThan(0);
    });
  }
});
