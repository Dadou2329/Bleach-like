import { describe, expect, it } from 'vitest';
import { CREST_SLICES, buildIkkaku, ikkakuCrestSlice, ikkakuProp } from '../src/chars/ikkaku';
import { HOZUKIMARU_CHAIN, HOZUKIMARU_CLIPS, IKKAKU_CHAIN, IKKAKU_CLIPS, RYUMON_CHAIN, RYUMON_CLIPS } from '../src/chars/ikkakuClips';

describe('Ikkaku Madarame', () => {
  it('builds without floating islands', () => {
    const a = buildIkkaku();
    const islands = a.warnings.filter((w) => w.includes('island'));
    expect(islands, islands.join(' | ')).toEqual([]);
  });
  for (const k of ['katana', 'sheath', 'spear', 'staff', 'head', 'spade', 'guandao', 'center', 'crest'] as const) {
    it(`builds the ${k}`, () => {
      expect(ikkakuProp(k).bones.length).toBeGreaterThan(0);
    });
  }
  it('cuts the crest into slices that cover it', () => {
    let n = 0;
    for (let i = 0; i < CREST_SLICES; i++) {
      const m = ikkakuCrestSlice(i);
      expect(m.bones.length).toBeGreaterThan(0);
      n += m.grids.reduce((k, g) => k + g.count(), 0);
    }
    expect(n).toBe(ikkakuProp('crest').grids.reduce((k, g) => k + g.count(), 0));
  });
  it('has every clip the kit plays', () => {
    const s = IKKAKU_CLIPS.map((c) => c.name), k = HOZUKIMARU_CLIPS.map((c) => c.name), b = RYUMON_CLIPS.map((c) => c.name);
    for (const n of [...IKKAKU_CHAIN, 'ik_press', 'ik_swap', 'ik_butt', 'ik_styptic', 'ik_dance', 'ik_nobiro', 'dash', 'hit_heavy']) expect(s).toContain(n);
    for (const n of [...HOZUKIMARU_CHAIN, 'ik_smash', 'ik_sakero', 'ik_hurl', 'ik_styptic', 'ik_dance', 'ik_bankai', 'ik_nobiro', 'dash', 'hit_heavy']) expect(k).toContain(n);
    for (const n of [...RYUMON_CHAIN, 'ik_xcrash', 'ik_spin', 'ik_fling', 'ik_explode', 'ik_wake', 'ik_bankai', 'dash', 'hit_heavy']) expect(b).toContain(n);
  });
});
