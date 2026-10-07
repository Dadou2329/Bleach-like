import { describe, expect, it } from 'vitest';
import { buildUrahara, uraharaProp } from '../src/chars/urahara';
import { benihimeCurtain, benihimeDoll } from '../src/chars/uraharaBankai';
import { BENIHIME_CHAIN, URAHARA_CHAIN, URAHARA_CLIPS } from '../src/chars/uraharaClips';

describe('urahara', () => {
  it('builds the body, the props and the Bankai without stray voxel islands', () => {
    const a = buildUrahara();
    expect(a.warnings).toEqual([]);
    expect(a.model.grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(15000);
    for (const k of ['cane', 'cane-blade', 'shikai', 'fan'] as const) expect(uraharaProp(k).grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(100);
    const d = benihimeDoll();
    expect(d.warnings).toEqual([]);
    expect(benihimeCurtain().grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(5000);
  });

  it('has the sockets and bones the kit uses', () => {
    const a = buildUrahara();
    const names = new Set(Object.keys(a.model.sockets));
    for (const n of ['grip.R', 'finger.L', 'palm.L', 'face', 'hat', 'back']) expect(names.has(n)).toBe(true);
    const bones = new Set(benihimeDoll().model.bones.map((b) => b.name));
    for (const n of ['torso', 'head', 'upperarm.L', 'forearm.L', 'hand.L', 'upperarm.R', 'forearm.R', 'hand.R']) expect(bones.has(n)).toBe(true);
  });
});

describe('urahara clips', () => {
  it('every cut lands, every technique has its beat in order', () => {
    const byName = new Map(URAHARA_CLIPS.map((c) => [c.name, c]));
    const ev = (clip: string, key: string): number => byName.get(clip)?.events?.[key] ?? -1;
    for (const n of [...URAHARA_CHAIN, ...BENIHIME_CHAIN]) expect(ev(n, 'hit')).toBeGreaterThan(ev(n, 'step'));
    expect(ev('ur_pin', 'pin')).toBeGreaterThan(ev('ur_pin', 'hit'));
    expect(ev('ur_okiro', 'wake')).toBeGreaterThan(ev('ur_okiro', 'draw'));
    expect(ev('ur_shield', 'drop')).toBeGreaterThan(ev('ur_shield', 'raise'));
    expect(ev('ur_bankai', 'doll')).toBeGreaterThan(ev('ur_bankai', 'curtain'));
    for (const n of ['ur_finger', 'ur_palm', 'ur_bind']) expect(ev(n, 'cast')).toBeGreaterThan(0);
    for (const n of ['ur_nake', 'ur_kamisori', 'ur_shibari', 'ur_stab', 'ur_tsuppane', 'ur_gigai', 'dash', 'hit_heavy']) expect(byName.has(n)).toBe(true);
  });
});
