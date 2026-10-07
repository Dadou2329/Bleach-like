import { describe, expect, it } from 'vitest';
import { buildRenji, renjiProp, SEGMENT_LEN } from '../src/chars/renji';
import { RENJI_CHAIN, RENJI_CLIPS, ZABIMARU_CHAIN } from '../src/chars/renjiClips';

describe('renji', () => {
  it('builds both bodies without stray voxel islands', () => {
    for (const form of ['lieutenant', 'bankai'] as const) {
      const a = buildRenji(form);
      expect(a.warnings).toEqual([]);
      expect(a.model.grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(20000);
      // the headband's tails swing on a spring
      expect(a.springs.some((s) => s.bone === 'band.tails')).toBe(true);
    }
  });

  it('builds every prop, the six Shikai segments growing toward the tip', () => {
    for (const k of ['katana', 'sheath', 'sheath-empty', 'hilt', 'handle', 'skull', 'vertebra'] as const) {
      expect(renjiProp(k).grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(60);
    }
    expect(SEGMENT_LEN).toHaveLength(6);
    const sizes = [0, 1, 2, 3, 4, 5].map((i) => renjiProp(`seg${i}` as 'seg0').grids.reduce((s, g) => s + g.count(), 0));
    for (const n of sizes) expect(n).toBeGreaterThan(60);
    expect(sizes[4]).toBeGreaterThan(sizes[0] * 1.3);
  });
});

describe('renji clips', () => {
  it('every lash has its throw and recall, every strike its moment', () => {
    const byName = new Map(RENJI_CLIPS.map((c) => [c.name, c]));
    const ev = (clip: string, key: string): number => byName.get(clip)?.events?.[key] ?? -1;
    for (const n of [...RENJI_CHAIN, 'dash', 'airstep', 'hit_heavy', 'rj_spin', 'rj_shikai', 'rj_bankai']) expect(byName.has(n)).toBe(true);
    for (const n of [...ZABIMARU_CHAIN, 'rj_reach', 'rj_curve']) {
      expect(ev(n, 'lash')).toBeGreaterThan(0);
      expect(ev(n, 'back')).toBeGreaterThan(ev(n, 'lash'));
    }
    expect(ev('rj_wrap', 'pull')).toBeGreaterThan(ev('rj_wrap', 'lash'));
    expect(ev('rj_cast', 'cast')).toBeGreaterThan(0);
    expect(ev('rj_chant', 'cast')).toBeGreaterThan(1);
    expect(ev('rj_command', 'strike')).toBeGreaterThan(0);
    expect(ev('rj_slam', 'slam')).toBeGreaterThan(ev('rj_slam', 'raise'));
    expect(ev('rj_roar', 'fire')).toBeGreaterThan(0);
  });
});
