import { describe, expect, it } from 'vitest';
import { buildChad } from '../src/chars/chad';
import { CHAD_CHAIN, CHAD_CLIPS } from '../src/chars/chadClips';

describe('chad', () => {
  it('builds all three forms without stray voxel islands', () => {
    let prev = 0;
    for (const form of ['human', 'gigante', 'true'] as const) {
      const a = buildChad(form);
      expect(a.warnings).toEqual([]);
      const n = a.model.grids.reduce((s, g) => s + g.count(), 0);
      // each step up the ladder adds armour
      expect(n).toBeGreaterThan(prev);
      prev = n;
    }
  });

  it('has the sockets the kit fires from', () => {
    const a = buildChad('gigante');
    const names = new Set(Object.keys(a.model.sockets));
    for (const n of ['knuckle.R', 'knuckle.L', 'fin', 'face']) expect(names.has(n)).toBe(true);
  });
});

describe('chad clips', () => {
  it('every punch lands, every technique has its beat', () => {
    const byName = new Map(CHAD_CLIPS.map((c) => [c.name, c]));
    const ev = (clip: string, key: string): number => byName.get(clip)?.events?.[key] ?? -1;
    for (const n of CHAD_CHAIN) expect(ev(n, 'hit')).toBeGreaterThan(0);
    expect(ev('ch_haymaker', 'hit')).toBeGreaterThan(0);
    expect(ev('ch_directo', 'fire')).toBeGreaterThan(ev('ch_directo', 'charge'));
    expect(ev('ch_muerte', 'hit')).toBeGreaterThan(ev('ch_muerte', 'charge'));
    expect(ev('ch_throw', 'slam')).toBeGreaterThan(ev('ch_throw', 'grab'));
    for (const n of ['ch_tackle', 'ch_guard', 'ch_coat', 'dash', 'hit_heavy']) expect(byName.has(n)).toBe(true);
  });
});
