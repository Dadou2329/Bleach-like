import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import { buildDangai, dangaiSword, mugetsuBlade } from '../src/chars/ichigoDangai';
import { DANGAI_CHAIN, DANGAI_CLIPS, FINAL_CHAIN, FINAL_CLIPS, HUMAN_CHAIN, HUMAN_CLIPS } from '../src/chars/ichigoDangaiClips';

describe('Post-Dangai Ichigo', () => {
  for (const form of ['bankai', 'final'] as const) {
    it(`builds the ${form} body without floating islands`, () => {
      const a = buildDangai(form);
      const islands = a.warnings.filter((w) => w.includes('island'));
      expect(islands, islands.join(' | ')).toEqual([]);
      for (const n of ['grip.R', 'palm.R', 'face', 'knuckle.R', 'toe.R', 'heel.R']) expect(Object.keys(a.model.sockets)).toContain(n);
      expect(a.springs.some((sp) => sp.bone === 'mane1')).toBe(true);
    });
  }
  it('builds the v2 daitō', () => {
    expect(dangaiSword().bones.length).toBe(1);
  });
  it("builds Mugetsu's blade", () => {
    expect(mugetsuBlade().bones.length).toBe(1);
  });
});

describe('Post-Dangai Ichigo clips', () => {
  const src = fs.readFileSync('src/game/kits/ichigoDangai.ts', 'utf8');
  const used = [...src.matchAll(/(?:playClip\(f, |anim\.play\(|StrikeAction\(this, )'([a-z_0-9]+)'/g)].map((m) => m[1]);
  it('has every clip the kit plays, in the form that plays it', () => {
    const all = new Set([...DANGAI_CLIPS, ...FINAL_CLIPS, ...HUMAN_CLIPS].map((c) => c.name));
    const missing = [...new Set([...used, ...DANGAI_CHAIN, ...FINAL_CHAIN, ...HUMAN_CHAIN])].filter((n) => !all.has(n));
    expect(missing).toEqual([]);
    for (const [list, chain] of [[DANGAI_CLIPS, DANGAI_CHAIN], [FINAL_CLIPS, FINAL_CHAIN], [HUMAN_CLIPS, HUMAN_CHAIN]] as const) {
      const names = new Set(list.map((c) => c.name));
      for (const n of [...chain, 'dash', 'airstep', 'hit_heavy']) expect(names.has(n), n).toBe(true);
    }
  });
  it('keys every clip event inside its duration', () => {
    for (const c of [...DANGAI_CLIPS, ...FINAL_CLIPS, ...HUMAN_CLIPS]) for (const [n, t] of Object.entries(c.events ?? {})) expect(t, `${c.name}.${n}`).toBeLessThanOrEqual(c.dur);
  });
});
