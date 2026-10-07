import { describe, expect, it } from 'vitest';
import { buildGin, ginProp } from '../src/chars/gin';
import { GIN_CHAIN, GIN_CLIPS } from '../src/chars/ginClips';

describe('gin', () => {
  it('builds both faces and Shinsō without stray voxel islands', () => {
    for (const face of ['grin', 'open'] as const) {
      const a = buildGin(face);
      expect(a.warnings).toEqual([]);
      expect(a.model.grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(20000);
      const sockets = new Set(Object.keys(a.model.sockets));
      for (const n of ['grip.R', 'palm.L', 'face', 'chest.front']) expect(sockets.has(n)).toBe(true);
    }
    expect(ginProp().grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(80);
  });
});

describe('gin clips', () => {
  it('every beat comes in order', () => {
    const byName = new Map(GIN_CLIPS.map((c) => [c.name, c]));
    const ev = (clip: string, key: string): number => byName.get(clip)?.events?.[key] ?? -1;
    for (const n of GIN_CHAIN.slice(0, 3)) expect(ev(n, 'hit')).toBeGreaterThan(ev(n, 'step'));
    for (const n of ['gn_poke', 'gn_snipe', 'gn_push']) expect(ev(n, 'retract')).toBeGreaterThan(ev(n, 'fx'));
    for (const n of ['gn_sweep', 'gn_split']) {
      expect(ev(n, 'sweep')).toBeGreaterThan(ev(n, 'fx'));
      expect(ev(n, 'done')).toBeGreaterThan(ev(n, 'sweep'));
      expect(ev(n, 'retract')).toBeGreaterThan(ev(n, 'done'));
    }
    expect(ev('gn_buto', 'fire0')).toBeGreaterThan(ev('gn_buto', 'set'));
    expect(ev('gn_renjin', 'fire11')).toBeGreaterThan(ev('gn_renjin', 'fire0'));
    expect(ev('gn_hakuja', 'wrap')).toBeGreaterThan(ev('gn_hakuja', 'throw'));
    for (const n of ['gn_hakufuku', 'gn_korose']) expect(ev(n, 'cast')).toBeGreaterThan(0);
    for (const n of ['gn_bankai', 'gn_eyes', 'dash', 'airstep', 'hit_heavy']) expect(byName.has(n)).toBe(true);
  });
});
