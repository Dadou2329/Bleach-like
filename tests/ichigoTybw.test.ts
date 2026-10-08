import { describe, expect, it } from 'vitest';
import { bankaiShell, buildIchigoTybw, tybwBlade } from '../src/chars/ichigoTybw';

describe('TYBW Ichigo', () => {
  for (const form of ['shikai', 'hollow', 'chains'] as const) {
    it(`builds the ${form} body without floating islands`, () => {
      const a = buildIchigoTybw(form);
      const islands = a.warnings.filter((w) => w.includes('island'));
      expect(islands, islands.join(' | ')).toEqual([]);
      for (const n of ['grip.R', 'grip.L', 'hip.R', 'back', 'face', 'neck']) expect(Object.keys(a.model.sockets)).toContain(n);
    });
  }
  for (const k of ['large', 'small', 'large-white', 'large-veins', 'chains', 'bankai'] as const) {
    it(`builds the ${k} blade in one piece`, () => {
      const m = tybwBlade(k);
      expect(m.bones.length).toBe(1);
    });
  }
  it('breaks the True Bankai shell into shards', () => {
    expect(bankaiShell().shards.length).toBeGreaterThan(6);
  });
});

import { BANKAI_CHAIN, CHAINS_CHAIN, HOLLOW_CHAIN, TYBW_CHAIN, TYBW_CLIPS } from '../src/chars/ichigoTybwClips';
import * as fs from 'node:fs';

describe('TYBW Ichigo clips', () => {
  it('has every clip the kit plays', () => {
    const names = new Set(TYBW_CLIPS.map((c) => c.name));
    const src = fs.readFileSync('src/game/kits/ichigoTybw.ts', 'utf8');
    const used = new Set<string>([...TYBW_CHAIN, ...HOLLOW_CHAIN, ...CHAINS_CHAIN, ...BANKAI_CHAIN, 'dash', 'airstep', 'hit_heavy']);
    for (const m of src.matchAll(/(?:playClip\(f, |anim\.play\(|clip: )'([a-z_0-9]+)'/g)) used.add(m[1]);
    const missing = [...used].filter((n) => !names.has(n));
    expect(missing).toEqual([]);
  });
  it('keys every clip event inside its duration', () => {
    for (const c of TYBW_CLIPS) for (const [n, t] of Object.entries(c.events ?? {})) expect(t, `${c.name}.${n}`).toBeLessThanOrEqual(c.dur);
  });
});
