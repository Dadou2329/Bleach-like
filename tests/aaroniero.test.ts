import { describe, expect, it } from 'vitest';
import { aaronieroProp, buildAaroniero } from '../src/chars/aaroniero';
import { AARONIERO_CLIPS, GLOT_CLIPS, KAIEN_CLIPS, NEJIBANA_CLIPS } from '../src/chars/aaronieroClips';

describe('Aaroniero Arruruerie', () => {
  for (const form of ['sealed', 'glotoneria'] as const) {
    it(`builds the ${form} body without floating islands`, () => {
      const a = buildAaroniero(form);
      const islands = a.warnings.filter((w) => w.includes('island'));
      expect(islands, islands.join(' | ')).toEqual([]);
      for (const n of ['skull', 'grip.R', 'maw', 'hip.L']) expect(Object.keys(a.model.sockets)).toContain(n);
    });
  }
  for (const k of ['mask', 'capsule', 'kaien', 'glot-mask', 'glot-capsule', 'glot-kaien', 'katana', 'sheath', 'sheath-empty', 'nejibana', 'maw', 'mass', 'tentacle'] as const) {
    it(`builds the ${k}`, () => {
      const m = aaronieroProp(k);
      expect(m.bones.length).toBeGreaterThan(0);
    });
  }
  it('has every clip the kit plays in each form', () => {
    const has = (set: { name: string }[], names: string[]) => {
      const n = new Set(set.map((c) => c.name));
      for (const x of names) expect(n.has(x), x).toBe(true);
    };
    has(AARONIERO_CLIPS, ['ar_s1', 'ar_s2', 'ar_s3', 'ar_s4', 'ar_devour', 'ar_fusion', 'ar_arm', 'ar_aspect', 'ar_release', 'hit_heavy']);
    has(KAIEN_CLIPS, ['kn_s1', 'kn_s2', 'kn_s3', 'kn_s4', 'kn_shakkaho', 'kn_release', 'ar_aspect', 'ar_release', 'hit_heavy']);
    has(NEJIBANA_CLIPS, ['nj_s1', 'nj_s2', 'nj_s3', 'nj_s4', 'nj_tide', 'nj_wave', 'nj_spiral', 'ar_aspect', 'ar_release', 'hit_heavy']);
    has(GLOT_CLIPS, ['gl_s1', 'gl_s2', 'gl_s3', 'gl_s4', 'gl_impale', 'gl_cero', 'gl_horde', 'gl_swallow', 'gl_guard', 'gl_roar', 'gl_rest', 'hit_heavy']);
  });
});
