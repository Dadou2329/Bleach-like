import { describe, expect, it } from 'vitest';
import { buildSuifeng, suifengProp } from '../src/chars/suifeng';
import { STING_CHAIN, SUIFENG_CHAIN, SUIFENG_CLIPS } from '../src/chars/suifengClips';

describe('suifeng', () => {
  it('builds both bodies and every prop without stray voxel islands', () => {
    for (const form of ['captain', 'keisen'] as const) {
      const a = buildSuifeng(form);
      expect(a.warnings).toEqual([]);
      expect(a.model.grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(12000);
      const sockets = new Set(Object.keys(a.model.sockets));
      for (const n of ['grip.R', 'arm.R', 'knuckle.R', 'toe.R', 'toe.L', 'face', 'waist.back']) expect(sockets.has(n)).toBe(true);
      const bones = new Set(a.model.bones.map((b) => b.name));
      for (const n of ['braid.L', 'braid.L.2', 'braid.R', 'braid.R.2']) expect(bones.has(n)).toBe(true);
    }
    for (const k of ['sword', 'sheath', 'gauntlet', 'launcher', 'guard', 'missile'] as const) expect(suifengProp(k).grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(30);
  });
});

describe('suifeng clips', () => {
  it('every blow lands after its step; the techniques carry their beats', () => {
    const byName = new Map(SUIFENG_CLIPS.map((c) => [c.name, c]));
    const ev = (clip: string, key: string): number => byName.get(clip)?.events?.[key] ?? -1;
    for (const n of [...SUIFENG_CHAIN, ...STING_CHAIN, 'sf_kazaguruma', 'sf_lunge', 'sf_bash']) expect(ev(n, 'hit')).toBeGreaterThan(ev(n, 'step'));
    expect(ev('sf_release', 'form')).toBeGreaterThan(ev('sf_release', 'glow'));
    expect(ev('sf_bankai', 'form')).toBeGreaterThan(ev('sf_bankai', 'pillar'));
    expect(ev('sf_fire', 'fire')).toBeGreaterThan(ev('sf_fire', 'fins'));
    for (const [n, k] of [['sf_clones', 'cast'], ['sf_bind', 'cast'], ['sf_takigoi', 'set'], ['sf_shunko', 'burst']]) expect(ev(n, k)).toBeGreaterThan(0);
    for (const n of ['dash', 'airstep', 'hit_heavy']) expect(byName.has(n)).toBe(true);
  });
});
