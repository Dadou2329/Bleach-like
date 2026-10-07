import { describe, expect, it } from 'vitest';
import { buildTosen, tosenProp } from '../src/chars/tosen';

describe('Tōsen', () => {
  it('builds every form without floating islands', () => {
    for (const form of ['traitor', 'masked'] as const) {
      const a = buildTosen(form);
      const islands = a.warnings.filter((w) => w.includes('island'));
      expect(islands, `${form}: ${islands.join(' | ')}`).toEqual([]);
    }
  });
  it('builds Suzumushi and the sheaths', () => {
    for (const k of ['suzumushi', 'sheath', 'sheath-empty'] as const) expect(tosenProp(k)).toBeTruthy();
  });
});

describe('Grillar Grillo', () => {
  it('builds without floating islands', async () => {
    const { buildGrillo } = await import('../src/chars/tosenGrillo');
    const a = buildGrillo();
    const islands = a.warnings.filter((w) => w.includes('island'));
    expect(islands, islands.join(' | ')).toEqual([]);
  });
});
