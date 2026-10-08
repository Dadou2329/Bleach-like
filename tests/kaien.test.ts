import { describe, expect, it } from 'vitest';
import { buildKaien, nejibanaProp } from '../src/chars/kaien';

describe('Kaien Shiba', () => {
  for (const form of ['lieutenant', 'possessed'] as const) {
    it(`builds the ${form} body without floating islands`, () => {
      const a = buildKaien(form);
      const islands = a.warnings.filter((w) => w.includes('island'));
      expect(islands, islands.join(' | ')).toEqual([]);
      for (const n of ['grip.R', 'palm.L', 'hip.L', 'back', 'face']) expect(Object.keys(a.model.sockets)).toContain(n);
    });
  }
  it('gives the possessed body its tentacle springs', () => {
    const a = buildKaien('possessed');
    expect(a.springs.filter((s) => s.bone.startsWith('tent')).length).toBe(9);
  });
  for (const k of ['katana', 'sheath', 'sheath-empty', 'trident'] as const) {
    it(`builds Nejibana's ${k}`, () => {
      expect(nejibanaProp(k).bones.length).toBeGreaterThan(0);
    });
  }
});
