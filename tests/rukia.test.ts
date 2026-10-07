import { describe, expect, it } from 'vitest';
import { buildRukia, rukiaProp } from '../src/chars/rukia';
import { RUKIA_CHAIN, RUKIA_CLIPS } from '../src/chars/rukiaClips';

describe('rukia', () => {
  it('builds both bodies without stray voxel islands', () => {
    for (const form of ['shinigami', 'bankai'] as const) {
      const a = buildRukia(form);
      expect(a.warnings).toEqual([]);
      expect(a.model.grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(18000);
      // the lock between her eyes sways on its own bone
      expect(a.springs.some((s) => s.bone === 'lock')).toBe(true);
    }
  });

  it('the Bankai ties its ribbons at the back, on springs', () => {
    const a = buildRukia('bankai');
    const names = new Set(a.model.bones.map((b) => b.name));
    for (const n of ['ribbon.L', 'ribbon.R', 'lock']) expect(names.has(n)).toBe(true);
    expect(a.springs.filter((s) => s.bone.startsWith('ribbon.')).length).toBe(2);
  });

  it('builds every prop', () => {
    for (const k of ['katana', 'sheath', 'sheath-empty', 'shikai', 'bankai-sword', 'shirafune'] as const) {
      expect(rukiaProp(k).grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(100);
    }
  });
});

describe('rukia clips', () => {
  it('every cut has its moment, every dance its beats', () => {
    const byName = new Map(RUKIA_CLIPS.map((c) => [c.name, c]));
    const ev = (clip: string, key: string): number => byName.get(clip)?.events?.[key] ?? -1;
    for (const n of RUKIA_CHAIN) expect(ev(n, 'hit')).toBeGreaterThan(0);
    for (const n of ['rk_thrust', 'rk_palm', 'rk_point', 'rk_rope', 'rk_shikai', 'rk_tsukishiro', 'rk_hakuren', 'rk_shirafune', 'rk_bankai', 'rk_wave', 'dash', 'airstep', 'hit_heavy']) expect(byName.has(n)).toBe(true);
    expect(ev('rk_rope', 'bind')).toBeGreaterThan(ev('rk_rope', 'throw'));
    expect(ev('rk_tsukishiro', 'rise')).toBeGreaterThan(ev('rk_tsukishiro', 'circle'));
    for (let i = 1; i <= 4; i++) expect(ev('rk_hakuren', `stab${i}`)).toBeGreaterThan(ev('rk_hakuren', `stab${i - 1}`));
    expect(ev('rk_hakuren', 'release')).toBeGreaterThan(ev('rk_hakuren', 'stab4'));
    expect(ev('rk_shirafune', 'shatter')).toBeGreaterThan(ev('rk_shirafune', 'grow'));
    expect(ev('rk_shikai', 'mae')).toBeGreaterThan(0);
    expect(ev('rk_bankai', 'burst')).toBeGreaterThan(ev('rk_bankai', 'mist'));
  });
});
