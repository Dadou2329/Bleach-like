import { describe, expect, it } from 'vitest';
import { buildGiant, buildKomamura, komamuraProp } from '../src/chars/komamura';

describe('Komamura', () => {
  it('builds the captain and the giant without floating islands', () => {
    for (const a of [buildKomamura(), buildGiant(), buildGiant('limbs')]) {
      const islands = a.warnings.filter((w) => w.includes('island'));
      expect(islands, islands.join(' | ')).toEqual([]);
    }
  });
  it('builds Tenken and the giant sword', () => {
    for (const k of ['tenken', 'giantSword'] as const) expect(komamuraProp(k)).toBeTruthy();
  });
});
