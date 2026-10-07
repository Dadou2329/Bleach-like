import { describe, expect, it } from 'vitest';
import { buildIchigoHollow } from '../src/chars/ichigoHollow';
import { VASTO_CHAIN, VASTO_CLIPS } from '../src/chars/ichigoHollowClips';
import { ICHIGO_CLIPS } from '../src/chars/ichigoClips';

describe('ichigo full hollow', () => {
  it('builds the body without stray voxel islands, with the sockets and spring bones the kit uses', () => {
    const a = buildIchigoHollow();
    expect(a.warnings).toEqual([]);
    expect(a.model.grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(20000);
    const sockets = new Set(Object.keys(a.model.sockets));
    for (const n of ['grip.R', 'face', 'horns', 'chest.front']) expect(sockets.has(n)).toBe(true);
    const bones = new Set(a.model.bones.map((b) => b.name));
    for (const n of ['mane1', 'mane2', 'mane3', 'hakama.L', 'hakama.R']) expect(bones.has(n)).toBe(true);
    for (const n of ['mane1', 'mane2', 'mane3']) expect(a.springs.some((s) => s.bone === n)).toBe(true);
  });

  it('its clips carry their beats in order, and the locomotion clips it needs', () => {
    const byName = new Map(VASTO_CLIPS.map((c) => [c.name, c]));
    const ev = (clip: string, key: string): number => byName.get(clip)?.events?.[key] ?? -1;
    for (const n of VASTO_CHAIN) expect(ev(n, 'hit')).toBeGreaterThan(ev(n, 'step'));
    expect(ev('vl_rise', 'rise')).toBeGreaterThan(ev('vl_rise', 'twitch'));
    expect(ev('vl_rise', 'roar')).toBeGreaterThan(ev('vl_rise', 'rise'));
    expect(ev('vl_cero', 'fire')).toBeGreaterThan(ev('vl_cero', 'charge'));
    expect(ev('vl_cero', 'stop')).toBeGreaterThan(ev('vl_cero', 'fire'));
    expect(ev('vl_break', 'kneel')).toBeGreaterThan(ev('vl_break', 'crack'));
    expect(ev('vl_smash', 'fx')).toBeGreaterThan(ev('vl_smash', 'step'));
    for (const n of ['dash', 'airstep', 'hit_heavy', 'vl_roar']) expect(byName.has(n)).toBe(true);
  });
});

describe('ichigo moveset clips', () => {
  it('the new skills fire on their beats', () => {
    const byName = new Map(ICHIGO_CLIPS.map((c) => [c.name, c]));
    const ev = (clip: string, key: string): number => byName.get(clip)?.events?.[key] ?? -1;
    expect(ev('ig_plow', 'fx')).toBeGreaterThan(ev('ig_plow', 'step'));
    expect(ev('ig_throw', 'throw')).toBeGreaterThan(ev('ig_throw', 'step'));
    expect(ev('ig_catch', 'catch')).toBeGreaterThan(0);
    expect(ev('ig_thrust', 'fx')).toBeGreaterThan(ev('ig_thrust', 'step'));
    expect(ev('ig_matoi', 'fx')).toBeGreaterThan(0);
  });
});
