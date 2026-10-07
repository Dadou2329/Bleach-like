import { describe, expect, it } from 'vitest';
import { buildYamamoto, yamamotoProp } from '../src/chars/yamamoto';
import { RYUJIN_CHAIN, YAMAMOTO_BARE_CHAIN, YAMAMOTO_CHAIN, YAMAMOTO_CLIPS } from '../src/chars/yamamotoClips';

describe('yamamoto', () => {
  it('builds every body and prop without stray voxel islands', () => {
    for (const form of ['robed', 'stripped', 'tybw'] as const) {
      const a = buildYamamoto(form);
      expect(a.warnings).toEqual([]);
      expect(a.model.grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(20000);
    }
    for (const k of ['cane', 'katana', 'sheath', 'bankai'] as const) expect(yamamotoProp(k).grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(100);
  });

  it('has the sockets and bones the kit uses', () => {
    for (const form of ['robed', 'stripped', 'tybw'] as const) {
      const a = buildYamamoto(form);
      const names = new Set(Object.keys(a.model.sockets));
      for (const n of ['grip.R', 'knuckle.L', 'knuckle.R', 'hip.L', 'chest.front', 'face']) expect(names.has(n)).toBe(true);
      const bones = new Set(a.model.bones.map((b) => b.name));
      for (const n of ['fist.L', 'fist.R', 'palm.L', 'palm.R']) expect(bones.has(n)).toBe(true);
    }
  });
});

describe('yamamoto clips', () => {
  it('every blow lands after its step, every technique has its beat in order', () => {
    const byName = new Map(YAMAMOTO_CLIPS.map((c) => [c.name, c]));
    const ev = (clip: string, key: string): number => byName.get(clip)?.events?.[key] ?? -1;
    for (const n of [...YAMAMOTO_CHAIN, ...YAMAMOTO_BARE_CHAIN, ...RYUJIN_CHAIN, 'ym_onibi', 'ym_nadegiri', 'ym_ikkotsu', 'ym_sokotsu', 'ym_wave']) expect(ev(n, 'hit')).toBeGreaterThan(ev(n, 'step'));
    expect(ev('ym_release', 'burst')).toBeGreaterThan(ev('ym_release', 'peel'));
    expect(ev('ym_jokaku', 'call')).toBeGreaterThan(ev('ym_jokaku', 'raise'));
    expect(ev('ym_ennetsu', 'rise')).toBeGreaterThan(ev('ym_ennetsu', 'plant'));
    expect(ev('ym_minami', 'rise')).toBeGreaterThan(ev('ym_minami', 'plant'));
    expect(ev('ym_itto', 'cast')).toBeGreaterThan(ev('ym_itto', 'grab'));
    expect(ev('ym_bankai', 'done')).toBeGreaterThan(ev('ym_bankai', 'recall'));
    for (const [n, k] of [['ym_strip', 'throw'], ['ym_taimatsu', 'fire'], ['ym_tap', 'tap']]) expect(ev(n, k)).toBeGreaterThan(0);
    for (const n of ['dash', 'airstep', 'hit_heavy']) expect(byName.has(n)).toBe(true);
  });
});
