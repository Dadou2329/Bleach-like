import { describe, expect, it } from 'vitest';
import { aaronieroProp, buildAaroniero } from '../src/chars/aaroniero';

describe('Aaroniero Arruruerie', () => {
  for (const form of ['sealed', 'glotoneria'] as const) {
    it(`builds the ${form} body without floating islands`, () => {
      const a = buildAaroniero(form);
      const islands = a.warnings.filter((w) => w.includes('island'));
      expect(islands, islands.join(' | ')).toEqual([]);
      for (const n of ['skull', 'grip.R', 'maw', 'hip.L']) expect(Object.keys(a.model.sockets)).toContain(n);
    });
  }
  for (const k of ['mask', 'capsule', 'kaien', 'glot-mask', 'glot-capsule', 'glot-kaien', 'katana', 'sheath', 'sheath-empty', 'nejibana', 'maw', 'mass', 'tentacle'] as const) {
    it(`builds the ${k}`, () => {
      const m = aaronieroProp(k);
      expect(m.bones.length).toBeGreaterThan(0);
    });
  }
});
