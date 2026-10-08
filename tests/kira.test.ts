import { describe, expect, it } from 'vitest';
import { buildKira, kiraProp } from '../src/chars/kira';
import { KIRA_CHAIN, KIRA_CLIPS, WABISUKE_CHAIN, WABISUKE_CLIPS } from '../src/chars/kiraClips';
import { REACTION_CLIPS } from '../src/chars/reactionClips';

describe('Izuru Kira', () => {
  it('builds without floating islands', () => {
    const a = buildKira();
    const islands = a.warnings.filter((w) => w.includes('island'));
    expect(islands, islands.join(' | ')).toEqual([]);
  });
  for (const k of ['katana', 'saya', 'wabisuke'] as const) {
    it(`builds the ${k} in one piece`, () => {
      const m = kiraProp(k);
      expect(m.bones.length).toBeGreaterThan(0);
    });
  }
  it('has every clip the kit plays', () => {
    const s = KIRA_CLIPS.map((c) => c.name), w = WABISUKE_CLIPS.map((c) => c.name);
    for (const n of [...KIRA_CHAIN, 'kr_palm', 'kr_sajo', 'kr_gaten', 'kr_tozan', 'kr_kaido', 'kr_tenran', 'kr_release', 'dash', 'hit_heavy']) expect(s).toContain(n);
    for (const n of [...WABISUKE_CHAIN, 'kw_pull', 'kw_guillotine', 'kw_penance', 'kw_parry', 'kw_stomp', 'kw_drop', 'kw_debris', 'kw_seal', 'kr_kaido', 'dash', 'hit_heavy']) expect(w).toContain(n);
  });
  it('has the shared kneel and pin reactions', () => {
    const names = REACTION_CLIPS.map((c) => c.name);
    for (const n of ['weighed_kneel', 'weighed_pin']) expect(names).toContain(n);
  });
});
