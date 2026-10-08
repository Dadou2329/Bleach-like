import { describe, expect, it } from 'vitest';
import { buildIchigoHuman } from '../src/chars/ichigoHuman';

describe('Human Ichigo', () => {
  for (const look of ['school', 'casual'] as const) {
    it(`builds the ${look} body without floating islands`, () => {
      const a = buildIchigoHuman(look);
      const islands = a.warnings.filter((w) => w.includes('island'));
      expect(islands, islands.join(' | ')).toEqual([]);
      for (const n of ['grip.R', 'grip.L', 'palm.R', 'face']) expect(Object.keys(a.model.sockets)).toContain(n);
    });
  }
});
