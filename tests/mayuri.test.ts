import { describe, expect, it } from 'vitest';
import { buildMayuri, mayuriProp } from '../src/chars/mayuri';

describe('Mayuri', () => {
  it('builds without floating islands', () => {
    const a = buildMayuri();
    const islands = a.warnings.filter((w) => w.includes('island'));
    expect(islands, islands.join(' | ')).toEqual([]);
  });
  it('builds the sword, the sheaths and the trident', () => {
    for (const k of ['sword', 'sheath', 'sheath-empty', 'trident'] as const) expect(mayuriProp(k)).toBeTruthy();
  });
});

describe('Konjiki Ashisogi Jizō', () => {
  it('builds without floating islands', async () => {
    const { buildJizo } = await import('../src/chars/mayuriBankai');
    const a = buildJizo();
    const islands = a.warnings.filter((w) => w.includes('island'));
    expect(islands, islands.join(' | ')).toEqual([]);
  });
});
