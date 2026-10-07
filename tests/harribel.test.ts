import { describe, expect, it } from 'vitest';
import { buildHarribel, harribelProp } from '../src/chars/harribel';
import { ModelBuilder } from '../src/models/builder';

describe('harribel', () => {
  it('builds every form and the props without stray voxel islands', () => {
    for (const form of ['sealed', 'unzipped', 'tiburon'] as const) {
      const a = buildHarribel(form);
      expect(a.warnings).toEqual([]);
      expect(a.model.grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(10000);
      const sockets = new Set(Object.keys(a.model.sockets));
      for (const n of ['grip.R', 'grip.L', 'palm.L', 'back', 'face', 'mouth', 'hole', 'chest.front']) expect(sockets.has(n)).toBe(true);
      const bones = new Set(a.model.bones.map((b) => b.name));
      if (form === 'tiburon') for (const n of ['ribbon.L1', 'ribbon.R3', 'skirt.F', 'skirt.B']) expect(bones.has(n)).toBe(true);
      else for (const n of ['hakama.L', 'hakama.R']) expect(bones.has(n)).toBe(true);
    }
    const warned: string[] = [];
    const build = ModelBuilder.prototype.build;
    ModelBuilder.prototype.build = function (this: ModelBuilder) {
      warned.push(...this.warnings);
      return build.call(this);
    };
    try {
      for (const k of ['tiburon', 'sheath', 'sheath-empty', 'pata'] as const) expect(harribelProp(k).grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(60);
    } finally {
      ModelBuilder.prototype.build = build;
    }
    expect(warned).toEqual([]);
  });
});

describe('harribel clips', () => {
  it('cuts land after their step, the hand-off comes first, and the techniques fire in order', async () => {
    const { HARRIBEL_CHAIN, HARRIBEL_CLIPS, LEFT_CUTS, TIBURON_CHAIN } = await import('../src/chars/harribelClips');
    const byName = new Map(HARRIBEL_CLIPS.map((c) => [c.name, c]));
    const ev = (clip: string, key: string): number => byName.get(clip)?.events?.[key] ?? -1;
    for (const n of [...HARRIBEL_CHAIN, ...TIBURON_CHAIN]) expect(ev(n, 'hit')).toBeGreaterThan(ev(n, 'step'));
    // the sword changes hands before the left hand cuts, and comes back before the two-handed finisher
    expect(ev('hb_cut3', 'swap')).toBeGreaterThanOrEqual(0);
    expect(ev('hb_cut3', 'swap')).toBeLessThan(ev('hb_cut3', 'hit'));
    expect(ev('hb_cut5', 'swap')).toBeLessThan(ev('hb_cut5', 'hit'));
    expect([...LEFT_CUTS].every((n) => HARRIBEL_CHAIN.includes(n))).toBe(true);
    expect(ev('hb_release', 'surge')).toBeGreaterThan(ev('hb_release', 'call'));
    expect(ev('tb_trident', 'fire2')).toBeGreaterThan(ev('tb_trident', 'fire1'));
    expect(ev('tb_trident', 'fire3')).toBeGreaterThan(ev('tb_trident', 'fire2'));
    expect(ev('tb_real', 'drop')).toBeGreaterThan(ev('tb_real', 'call'));
    for (const [n, k] of [['hb_ola', 'fire'], ['hb_cero', 'fire'], ['hb_unzip', 'open'], ['tb_gota', 'fire'], ['tb_cascada', 'surge'], ['tb_cero', 'fire'], ['tb_burst', 'cut'], ['hb_regrip', 'swap']]) expect(ev(n, k)).toBeGreaterThan(0);
    for (const n of ['dash', 'airstep', 'hit_heavy', 'hb_read', 'hb_counter', 'tb_hirviendo']) expect(byName.has(n)).toBe(true);
  });
});
