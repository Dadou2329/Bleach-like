import { describe, expect, it } from 'vitest';
import { buildFairy, buildOrihime, type FairyName } from '../src/chars/orihime';

describe('Orihime', () => {
  it('builds both forms without floating islands', () => {
    for (const form of ['hueco', 'rokuten'] as const) {
      const a = buildOrihime(form);
      const islands = a.warnings.filter((w) => w.includes('island'));
      expect(islands, `${form}: ${islands.join(' | ')}`).toEqual([]);
    }
  });
  it('builds the six fairies of Shun Shun Rikka', () => {
    for (const n of ['tsubaki', 'ayame', 'shuno', 'hinagiku', 'lily', 'baigon'] as FairyName[]) {
      const f = buildFairy(n);
      const islands = f.warnings.filter((w) => w.includes('island'));
      expect(islands, `${n}: ${islands.join(' | ')}`).toEqual([]);
    }
  });
});
