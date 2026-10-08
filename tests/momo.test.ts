import { describe, expect, it } from 'vitest';
import { buildMomo, momoProp } from '../src/chars/momo';
import { MOMO_CHAIN, MOMO_CLIPS, TOBIUME_CLIPS } from '../src/chars/momoClips';
import { REACTION_CLIPS } from '../src/chars/reactionClips';

describe('Momo Hinamori', () => {
  it('builds without floating islands', () => {
    const a = buildMomo();
    const islands = a.warnings.filter((w) => w.includes('island'));
    expect(islands, islands.join(' | ')).toEqual([]);
  });
  for (const k of ['katana', 'saya', 'tobiume'] as const) {
    it(`builds the ${k}`, () => {
      expect(momoProp(k).bones.length).toBeGreaterThan(0);
    });
  }
  it('has every clip the kit plays', () => {
    const s = MOMO_CLIPS.map((c) => c.name), t = TOBIUME_CLIPS.map((c) => c.name);
    for (const n of [...MOMO_CHAIN, 'mo_palm', 'mo_web', 'mo_veil', 'mo_launch', 'mo_release', 'dash', 'hit_heavy']) expect(s).toContain(n);
    for (const n of [...MOMO_CHAIN, 'mo_fire', 'mo_volley', 'mo_web', 'mo_kaido', 'mo_veil', 'dash']) expect(t).toContain(n);
    expect(REACTION_CLIPS.map((c) => c.name)).toContain('slumber');
  });
});
