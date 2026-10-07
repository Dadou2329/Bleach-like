import { describe, expect, it } from 'vitest';
import { buildUryu, uryuProp } from '../src/chars/uryu';
import { URYU_CHAIN, URYU_CLIPS } from '../src/chars/uryuClips';

describe('uryu', () => {
  it('builds both forms and the props without stray voxel islands', () => {
    for (const form of ['quincy', 'letzt'] as const) {
      const a = buildUryu(form);
      expect(a.warnings).toEqual([]);
      expect(a.model.grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(8000);
    }
    for (const k of ['glasses', 'seele', 'cross'] as const) expect(uryuProp(k).grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(40);
  });

  it('has the sockets the kit shoots from', () => {
    for (const form of ['quincy', 'letzt'] as const) {
      const names = new Set(Object.keys(buildUryu(form).model.sockets));
      for (const n of ['bow', 'draw', 'grip.R', 'wrist.R', 'wing', 'glasses', 'face']) expect(names.has(n)).toBe(true);
    }
  });
});

describe('uryu clips', () => {
  it('every shot looses, every technique has its beat in order', () => {
    const byName = new Map(URYU_CLIPS.map((c) => [c.name, c]));
    const ev = (clip: string, key: string): number => byName.get(clip)?.events?.[key] ?? -1;
    for (const n of URYU_CHAIN) {
      const c = byName.get(n)!;
      expect(Object.keys(c.events ?? {}).some((k) => k.startsWith('fire'))).toBe(true);
      expect(ev(n, 'combo')).toBeGreaterThan(0);
    }
    expect(ev('uy_rapid', 'fire3')).toBeGreaterThan(ev('uy_rapid', 'fire1'));
    expect(ev('uy_charge', 'fire')).toBeGreaterThan(ev('uy_charge', 'draw'));
    expect(ev('uy_licht', 'stop')).toBeGreaterThan(ev('uy_licht', 'fire'));
    expect(ev('uy_licht', 'fire')).toBeGreaterThan(ev('uy_licht', 'charge'));
    expect(ev('uy_seele', 'fire')).toBeGreaterThan(ev('uy_seele', 'draw'));
    const throws = [1, 2, 3, 4, 5].map((i) => ev('uy_sprenger', `throw${i}`));
    for (let i = 1; i < 5; i++) expect(throws[i]).toBeGreaterThan(throws[i - 1]);
    expect(ev('uy_sprenger', 'pour')).toBeGreaterThan(throws[4]);
    expect(ev('uy_letzt', 'burst')).toBeGreaterThan(ev('uy_letzt', 'tear'));
    for (const n of ['uy_ginto', 'dash', 'airstep', 'hit_heavy']) expect(byName.has(n)).toBe(true);
  });
});
