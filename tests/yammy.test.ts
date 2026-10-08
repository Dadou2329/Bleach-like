import { describe, expect, it } from 'vitest';
import { buildApe, buildIra, buildYammy, yammyProp } from '../src/chars/yammy';
import { APE_CHAIN, APE_CLIPS, IRA_CHAIN, IRA_CLIPS, YAMMY_CHAIN, YAMMY_CLIPS } from '../src/chars/yammyClips';

describe('Yammy Llargo', () => {
  for (const [name, build] of [['sealed', buildYammy], ['ira', buildIra], ['ape', buildApe]] as const) {
    it(`builds the ${name} body without floating islands`, () => {
      const a = build();
      const islands = a.warnings.filter((w) => w.includes('island'));
      expect(islands, islands.join(' | ')).toEqual([]);
    });
  }
  it('builds the sheath', () => {
    expect(yammyProp('sheath').bones.length).toBeGreaterThan(0);
  });
  it('has the sockets the kit fires from', () => {
    for (const a of [buildYammy(), buildIra(), buildApe()]) {
      const names = Object.keys(a.model.sockets);
      for (const n of ['mouth', 'grip.R', 'grip.L']) expect(names).toContain(n);
    }
  });
  it('has every clip the kit plays', () => {
    const s = YAMMY_CLIPS.map((c) => c.name), i = IRA_CLIPS.map((c) => c.name), a = APE_CLIPS.map((c) => c.name);
    for (const n of [...YAMMY_CHAIN, 'yy_bala', 'yy_cero', 'yy_gonzui', 'yy_grab', 'yy_rip', 'yy_brace', 'yy_release', 'yy_doze', 'dash', 'hit_heavy']) expect(s).toContain(n);
    for (const n of [...IRA_CHAIN, 'yi_bala', 'yi_cero', 'yi_oscuras', 'yi_stomp', 'yi_shield', 'yi_roar', 'dash', 'hit_heavy']) expect(i).toContain(n);
    for (const n of [...APE_CHAIN, 'ya_bala', 'ya_cero', 'ya_oscuras', 'ya_stomp', 'ya_shield', 'ya_roar', 'dash', 'hit_heavy']) expect(a).toContain(n);
  });
  it('fires the Bala, Cero and piston events', () => {
    const ev = (list: typeof YAMMY_CLIPS, n: string) => list.find((c) => c.name === n)!.events ?? {};
    expect(Object.keys(ev(YAMMY_CLIPS, 'yy_bala'))).toHaveLength(6);
    expect(Object.keys(ev(IRA_CLIPS, 'yi_bala'))).toHaveLength(4);
    expect(Object.keys(ev(APE_CLIPS, 'ya_bala'))).toHaveLength(4);
    for (const n of ['yi_s1', 'yi_s2', 'yi_s3']) expect(ev(IRA_CLIPS, n).piston).toBeGreaterThan(ev(IRA_CLIPS, n).hit);
    expect(ev(IRA_CLIPS, 'yi_oscuras').fire).toBeCloseTo(1.5);
  });
});
