import { describe, expect, it } from 'vitest';
import { buildKyoraku, kyorakuProp } from '../src/chars/kyoraku';
import { KATEN_CHAIN, KYORAKU_CHAIN, KYORAKU_CLIPS } from '../src/chars/kyorakuClips';
import { colourOf, coverage, irooniScale } from '../src/vfx/katen';
import { buildKaten } from '../src/chars/katen';

describe('kyoraku', () => {
  it('builds every outfit and prop without stray voxel islands', () => {
    for (const form of ['captain', 'haori', 'shed'] as const) {
      const a = buildKyoraku(form);
      expect(a.warnings).toEqual([]);
      expect(a.model.grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(15000);
      const sockets = new Set(Object.keys(a.model.sockets));
      for (const n of ['grip.R', 'grip.L', 'finger.L', 'finger.R', 'hip.L', 'hip.L2', 'face', 'hat', 'back']) expect(sockets.has(n)).toBe(true);
      const bones = new Set(a.model.bones.map((b) => b.name));
      for (const n of ['pony1', 'pony2', 'pony3']) expect(bones.has(n)).toBe(true);
      expect(bones.has('coat.F.L')).toBe(form !== 'shed');
    }
    for (const k of ['tachi', 'waki', 'sayaT', 'sayaW', 'katen', 'kyokotsu'] as const) expect(kyorakuProp(k).grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(60);
  });
  it('builds Katen, the spirit who leans over him in the Bankai', () => {
    const k = buildKaten();
    expect(k.warnings).toEqual([]);
    expect(k.model.grids.reduce((s, g) => s + g.count(), 0)).toBeGreaterThan(10000);
  });
});

describe('kyoraku clips', () => {
  it('every cut lands after its step; the techniques carry their beats in order', () => {
    const byName = new Map(KYORAKU_CLIPS.map((c) => [c.name, c]));
    const ev = (clip: string, key: string): number => byName.get(clip)?.events?.[key] ?? -1;
    for (const n of [...KYORAKU_CHAIN, ...KATEN_CHAIN, 'ky_finger']) expect(Math.max(ev(n, 'hit'), ev(n, 'hitL'))).toBeGreaterThan(ev(n, 'step'));
    expect(ev('ky_daisho', 'hit')).toBeGreaterThan(ev('ky_daisho', 'hitL'));
    expect(ev('ky_release', 'form')).toBeGreaterThan(ev('ky_release', 'cross'));
    expect(ev('ky_bankai', 'form')).toBeGreaterThan(ev('ky_bankai', 'pine'));
    expect(ev('ky_thread', 'cut')).toBeGreaterThan(ev('ky_thread', 'pull'));
    expect(ev('ky_thread', 'pull')).toBeGreaterThan(ev('ky_thread', 'thread'));
    for (const [n, k] of [['ky_zangerin', 'fire'], ['ky_spin', 'fire'], ['ky_takaoni', 'vanish'], ['ky_dive', 'hit'], ['ky_sink', 'sink'], ['ky_rise', 'hit'], ['ky_call', 'call'], ['ky_act', 'act'], ['ky_sheathe', 'sheathe'], ['ky_shed', 'throw'], ['ky_shedS', 'throw'], ['ky_sake', 'sip']]) expect(ev(n, k)).toBeGreaterThan(0);
    for (const n of ['dash', 'airstep', 'hit_heavy']) expect(byName.has(n)).toBe(true);
  });
});

describe('irooni', () => {
  it('sorts colours into the families a child would call', () => {
    expect(colourOf('#141418')).toBe('kuro');
    expect(colourOf('#F4F3EF')).toBe('shiro');
    expect(colourOf('#E98FB5')).toBe('momo');
    expect(colourOf('#9AA0A8')).toBe('haiiro');
    expect(colourOf('#4A7AD8')).toBe('ao');
    expect(colourOf('#EAC6A3')).toBe('hada');
  });
  it('reads the colours off the body: the coats off, the black goes up and so does the cut', () => {
    const dressed = coverage(buildKyoraku('captain').model);
    const shed = coverage(buildKyoraku('shed').model);
    expect(dressed.get('momo') ?? 0).toBeGreaterThan(0.2);
    expect(shed.get('kuro') ?? 0).toBeGreaterThan((dressed.get('kuro') ?? 0) + 0.15);
    expect(irooniScale(shed.get('kuro') ?? 0)).toBeGreaterThan(irooniScale(dressed.get('kuro') ?? 0) * 1.5);
  });
});
