import { describe, expect, it } from 'vitest';
import { buildBaraggan, baragganProp } from '../src/chars/baraggan';

describe('Baraggan', () => {
  it('builds both forms without floating islands', () => {
    for (const form of ['sealed', 'arrogante'] as const) {
      const a = buildBaraggan(form);
      const islands = a.warnings.filter((w) => w.includes('island'));
      expect(islands, `${form}: ${islands.join(' | ')}`).toEqual([]);
    }
  });
  it('builds its axes', () => {
    for (const k of ['arrogante', 'granCaida'] as const) {
      const m = baragganProp(k);
      expect(m).toBeTruthy();
    }
  });
});

describe('Baraggan clips', () => {
  it('cuts land after their step, every technique fires inside its clip', async () => {
    const { ARROGANTE_CHAIN, BARAGGAN_CHAIN, BARAGGAN_CLIPS } = await import('../src/chars/baragganClips');
    const byName = new Map(BARAGGAN_CLIPS.map((c) => [c.name, c]));
    const ev = (clip: string, key: string): number => byName.get(clip)?.events?.[key] ?? -1;
    for (const n of [...BARAGGAN_CHAIN, ...ARROGANTE_CHAIN, 'bg_heavy', 'ar_heavy']) expect(ev(n, 'hit')).toBeGreaterThan(ev(n, 'step'));
    for (const [n, k] of [['bg_heavy', 'cleave'], ['bg_touch', 'touch'], ['bg_grab', 'grab'], ['bg_grab', 'throw'], ['bg_flare', 'burst'], ['bg_field', 'field'], ['bg_release', 'form'], ['ar_respira', 'breath'], ['ar_slash', 'fire'], ['ar_throw', 'throw'], ['ar_total', 'burst']] as const) {
      const c = byName.get(n);
      expect(c, n).toBeTruthy();
      expect(ev(n, k), `${n}.${k}`).toBeGreaterThan(0);
      expect(ev(n, k), `${n}.${k}`).toBeLessThan(c!.dur);
    }
    expect(ev('bg_grab', 'throw')).toBeGreaterThan(ev('bg_grab', 'grab'));
    expect(ev('bg_release', 'form')).toBeGreaterThan(ev('bg_release', 'flames'));
    for (const n of ['dash', 'airstep', 'hit_heavy']) expect(byName.has(n)).toBe(true);
  });
});
