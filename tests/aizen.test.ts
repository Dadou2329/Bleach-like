import { describe, expect, it } from 'vitest';
import { aizenProp, buildAizen } from '../src/chars/aizen';
import { AIZEN_CHAIN, AIZEN_CLIPS, CHRYSALIS_CHAIN } from '../src/chars/aizenClips';

describe('aizen', () => {
  it('builds all three bodies without stray voxel islands', () => {
    for (const form of ['captain', 'traitor', 'chrysalis'] as const) {
      const a = buildAizen(form);
      expect(a.warnings).toEqual([]);
      expect(a.model.grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(10000);
    }
  });

  it('builds every prop', () => {
    for (const k of ['katana', 'sheath', 'sheath-empty', 'glasses', 'fused'] as const) {
      expect(aizenProp(k).grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(30);
    }
  });

  it('the chrysalis grows four two-bone tails on springs', () => {
    const a = buildAizen('chrysalis');
    const tails = a.springs.filter((s) => s.bone.startsWith('tail.'));
    expect(tails.length).toBe(8);
  });
});

describe('aizen clips', () => {
  it('every move in the strings has a clip with a hit frame', () => {
    const names = new Set(AIZEN_CLIPS.map((c) => c.name));
    for (const n of [...AIZEN_CHAIN, ...CHRYSALIS_CHAIN, 'az_pass']) {
      expect(names.has(n)).toBe(true);
      expect(AIZEN_CLIPS.find((c) => c.name === n)!.events?.hit).toBeGreaterThan(0);
    }
    for (const n of ['az_finger', 'az_kurohitsugi', 'az_raikoho', 'az_dragons', 'az_reveal', 'az_kudakero', 'az_awaken', 'dash', 'airstep', 'hit_heavy']) expect(names.has(n)).toBe(true);
    expect(AIZEN_CLIPS.find((c) => c.name === 'az_reveal')!.events).toMatchObject({ glasses: expect.any(Number), crush: expect.any(Number), sweep: expect.any(Number) });
  });
});
