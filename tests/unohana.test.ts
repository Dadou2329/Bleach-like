import { describe, expect, it } from 'vitest';
import { buildUnohana, unohanaProp } from '../src/chars/unohana';

describe('Unohana', () => {
  for (const form of ['retsu', 'yachiru'] as const)
    it(`builds ${form} without floating islands`, () => {
      const a = buildUnohana(form);
      const islands = a.warnings.filter((w) => w.includes('island'));
      expect(islands, islands.join(' | ')).toEqual([]);
    });
  it('builds Minazuki, its sheaths, the Bankai blade and the daggers', () => {
    for (const k of ['nodachi', 'sheath', 'sheath-empty', 'bankai', 'dagger'] as const) {
      const m = unohanaProp(k);
      expect(m).toBeTruthy();
    }
  });
});

describe('Minazuki (Shikai creature)', () => {
  it('builds without floating islands', async () => {
    const { buildManta } = await import('../src/chars/unohanaMinazuki');
    const a = buildManta();
    const islands = a.warnings.filter((w) => w.includes('island'));
    expect(islands, islands.join(' | ')).toEqual([]);
  });
});
