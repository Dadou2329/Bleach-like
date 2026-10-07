import { describe, expect, it } from 'vitest';
import { buildYoruichi } from '../src/chars/yoruichi';
import { YORUICHI_CHAIN, YORUICHI_CLIPS } from '../src/chars/yoruichiClips';

describe('yoruichi', () => {
  it('builds all three forms without stray voxel islands', () => {
    const n: Record<string, number> = {};
    for (const form of ['standard', 'shunko', 'raijin'] as const) {
      const a = buildYoruichi(form);
      expect(a.warnings).toEqual([]);
      n[form] = a.model.grids.reduce((s, g) => s + g.count(), 0);
    }
    // Shunkō tears the orange top away; Raijin Senkei adds the horns
    expect(n.shunko).toBeLessThan(n.standard);
    expect(n.raijin).toBeGreaterThan(n.shunko);
  });

  it('has the sockets the kit strikes and sparks from, and the ponytail on springs', () => {
    const a = buildYoruichi('standard');
    const names = new Set(Object.keys(a.model.sockets));
    for (const s of ['knuckle.R', 'knuckle.L', 'toe.R', 'toe.L', 'heel.R', 'back', 'shoulder.L', 'shoulder.R', 'palm.R', 'face']) expect(names.has(s)).toBe(true);
    const springs = new Set(a.springs.map((s) => s.bone));
    for (const b of ['pony1', 'pony2', 'pony3', 'sash.tails']) expect(springs.has(b)).toBe(true);
  });
});

describe('yoruichi clips', () => {
  it('every strike lands, every technique has its beat in order', () => {
    const byName = new Map(YORUICHI_CLIPS.map((c) => [c.name, c]));
    const ev = (clip: string, key: string): number => byName.get(clip)?.events?.[key] ?? -1;
    for (const n of YORUICHI_CHAIN) expect(ev(n, 'hit')).toBeGreaterThan(0);
    for (const n of YORUICHI_CHAIN.slice(0, -1)) expect(ev(n, 'combo')).toBeGreaterThan(ev(n, 'hit'));
    for (let i = 1; i < 10; i++) expect(ev('yr_barrage', `hit${i}`)).toBeGreaterThan(ev('yr_barrage', `hit${i - 1}`));
    expect(ev('yr_barrage', 'finish')).toBeGreaterThan(ev('yr_barrage', 'hit9'));
    expect(ev('yr_blow', 'hit')).toBeGreaterThan(ev('yr_blow', 'step'));
    expect(ev('yr_shunko', 'burst')).toBeGreaterThan(ev('yr_shunko', 'tear'));
    expect(ev('yr_raijin', 'burst')).toBeGreaterThan(ev('yr_raijin', 'drums'));
    expect(ev('yr_column', 'stop')).toBeGreaterThan(ev('yr_column', 'fire'));
    expect(ev('yr_hanki', 'release')).toBeGreaterThan(ev('yr_hanki', 'block'));
    for (const n of ['yr_strikeA', 'yr_strikeB', 'yr_strikeC', 'yr_vanish', 'yr_anken', 'yr_burst', 'dash', 'hit_heavy']) expect(byName.has(n)).toBe(true);
  });
});
