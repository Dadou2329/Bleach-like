import { describe, expect, it } from 'vitest';
import { buildSzayel, szayelProp } from '../src/chars/szayel';
import { FORNICARAS_CHAIN, FORNICARAS_CLIPS, SZAYEL_CHAIN, SZAYEL_CLIPS } from '../src/chars/szayelClips';
import { FRACCION_CLIPS, buildFraccion } from '../src/chars/szayelFraccion';

describe('Szayelaporro Granz', () => {
  for (const form of ['sealed', 'fornicaras'] as const) {
    it(`builds the ${form} body without floating islands`, () => {
      const a = buildSzayel(form);
      const islands = a.warnings.filter((w) => w.includes('island'));
      expect(islands, islands.join(' | ')).toEqual([]);
    });
  }
  for (const k of ['katana', 'sheath', 'sheath-empty', 'balon'] as const) {
    it(`builds the ${k}`, () => {
      expect(szayelProp(k).bones.length).toBeGreaterThan(0);
    });
  }
  for (const k of ['lumina', 'verona'] as const) {
    it(`builds ${k}`, () => {
      const a = buildFraccion(k);
      const islands = a.warnings.filter((w) => w.includes('island'));
      expect(islands, islands.join(' | ')).toEqual([]);
    });
  }
  it('has every clip the kit plays', () => {
    const s = SZAYEL_CLIPS.map((c) => c.name), f = FORNICARAS_CLIPS.map((c) => c.name), l = FRACCION_CLIPS.map((c) => c.name);
    for (const n of [...SZAYEL_CHAIN, 'sz_needle', 'sz_snap', 'sz_remote', 'sz_eat', 'sz_release', 'dash', 'hit_heavy']) expect(s).toContain(n);
    for (const n of [...FORNICARAS_CHAIN, 'sf_burrow', 'sf_copy', 'sf_snap', 'sf_teatro', 'sf_flick', 'sf_press', 'sf_pinch', 'sf_crush', 'sf_balon', 'sf_gabriel', 'sf_eat', 'dash']) expect(f).toContain(n);
    for (const n of ['lv_slap', 'lv_bump', 'lv_cheer', 'lv_struggle', 'dash', 'hit_heavy']) expect(l).toContain(n);
  });
});
