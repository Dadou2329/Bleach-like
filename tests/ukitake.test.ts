import { describe, expect, it } from 'vitest';
import { buildUkitake, ukitakeProp } from '../src/chars/ukitake';
import { ModelBuilder } from '../src/models/builder';
import { SOGYO_CHAIN, UKITAKE_CHAIN, UKITAKE_CLIPS } from '../src/chars/ukitakeClips';

describe('ukitake', () => {
  it('builds the captain and his props without stray voxel islands', () => {
    const a = buildUkitake();
    expect(a.warnings).toEqual([]);
    expect(a.model.grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(15000);
    const sockets = new Set(Object.keys(a.model.sockets));
    for (const n of ['grip.R', 'grip.L', 'palm.L', 'finger.R', 'hip.L', 'face', 'mouth', 'back']) expect(sockets.has(n)).toBe(true);
    const bones = new Set(a.model.bones.map((b) => b.name));
    for (const n of ['hair1', 'hair2', 'hair3', 'coat.B.L.2']) expect(bones.has(n)).toBe(true);
    const warned: string[] = [];
    const build = ModelBuilder.prototype.build;
    ModelBuilder.prototype.build = function (this: ModelBuilder) {
      warned.push(...this.warnings);
      return build.call(this);
    };
    try {
      for (const k of ['katana', 'sheath', 'sheath-empty', 'sogyo'] as const) expect(ukitakeProp(k).grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(60);
    } finally {
      ModelBuilder.prototype.build = build;
    }
    expect(warned).toEqual([]);
  });
});

describe('ukitake clips', () => {
  it('cuts land after their step; the release chants before it splits; the return fires early', () => {
    const byName = new Map(UKITAKE_CLIPS.map((c) => [c.name, c]));
    const ev = (clip: string, key: string): number => byName.get(clip)?.events?.[key] ?? -1;
    for (const n of [...UKITAKE_CHAIN, ...SOGYO_CHAIN]) expect(Math.max(ev(n, 'hit'), ev(n, 'hitL'))).toBeGreaterThan(ev(n, 'step'));
    expect(ev('uk_release', 'split')).toBeGreaterThan(ev('uk_release', 'chant'));
    expect(ev('uk_shakkaho', 'fire')).toBeGreaterThan(ev('uk_shakkaho', 'charge'));
    expect(ev('uk_cough', 'blood')).toBeGreaterThan(ev('uk_cough', 'cough'));
    expect(ev('uk_rope', 'end')).toBeGreaterThan(ev('uk_rope', 'lash'));
    for (const [n, k] of [['uk_iai', 'hit'], ['uk_seki', 'cast'], ['uk_kaido', 'heal'], ['uk_return', 'fire'], ['uk_charms', 'glow']]) expect(ev(n, k)).toBeGreaterThan(0);
    expect(byName.has('uk_absorb')).toBe(true);
    for (const n of ['dash', 'airstep', 'hit_heavy']) expect(byName.has(n)).toBe(true);
  });
});
