import { describe, expect, it } from 'vitest';
import { buildIsshin, isshinProp } from '../src/chars/isshin';
import { ISSHIN_CHAIN, ISSHIN_CLIPS, ISSHIN_DOCTOR_CHAIN, ISSHIN_DOCTOR_CLIPS } from '../src/chars/isshinClips';

describe('Isshin Kurosaki', () => {
  for (const form of ['doctor', 'shinigami'] as const) {
    it(`builds the ${form} without floating islands`, () => {
      const a = buildIsshin(form);
      const islands = a.warnings.filter((w) => w.includes('island'));
      expect(islands, islands.join(' | ')).toEqual([]);
    });
  }
  it('builds Engetsu and its scabbard', () => {
    expect(isshinProp('engetsu').bones.length).toBeGreaterThan(0);
    expect(isshinProp('saya').bones.length).toBeGreaterThan(0);
  });
  it('has every clip the kit plays', () => {
    const sh = ISSHIN_CLIPS.map((c) => c.name), doc = ISSHIN_DOCTOR_CLIPS.map((c) => c.name);
    for (const n of [...ISSHIN_CHAIN, 'is_agito', 'is_getsuga', 'is_flick', 'is_headbutt', 'is_kotei', 'release', 'is_blood', 'dash', 'hit_heavy']) expect(sh).toContain(n);
    for (const n of [...ISSHIN_DOCTOR_CHAIN, 'is_d_headbutt', 'is_d_flick', 'is_heal', 'is_charm', 'is_step', 'dash', 'hit_heavy']) expect(doc).toContain(n);
  });
});
