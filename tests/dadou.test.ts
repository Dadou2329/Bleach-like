import { describe, expect, it } from 'vitest';
import { dadouAsset, dadouProp, type DadouForm } from '../src/chars/dadou';
import { DADOU_BANKAI_CHAIN, DADOU_CHAIN, DADOU_CLIPS, DADOU_FINAL_CHAIN } from '../src/chars/dadouClips';
import { hajunModels } from '../src/vfx/hajun';
import { SPECIAL_WIKI } from '../src/ui/wiki';

const FORMS: DadouForm[] = ['sealed', 'shikai', 'bankai', 'final'];

/** the colours of the materials the tests look for (the model keeps colours, not names) */
const COLOURS: Record<string, string[]> = {
  teeth: ['#EFEDE6'],
  horn: ['#4A4046', '#372F35', '#282226', '#1C181B', '#151316'],
  lacquer: ['#423D48', '#312D36', '#25222A', '#1B1920', '#151418'],
  blackFace: ['#3A3238', '#2C262B', '#221D21', '#1A1619'],
  eyeGlow: ['#FF3B50'],
  gold: ['#F3DA8C', '#E2BE5E', '#C49C3E', '#9C772A', '#76581E'],
};

type Model = { palette: { color: string }[]; grids: { forEach(cb: (x: number, y: number, z: number, v: number) => void): void }[]; bones: { name: string }[] };

/** voxels of a material in the model's grids (optionally only the named bones, and only inside a box) */
function count(model: Model, mat: string, bones?: string[], box?: [number, number, number, number, number, number]): number {
  const idx = new Set<number>();
  model.palette.forEach((p, i) => {
    if (COLOURS[mat].includes(p.color)) idx.add(i);
  });
  let n = 0;
  model.grids.forEach((g, bi) => {
    if (bones && !bones.includes(model.bones[bi].name)) return;
    g.forEach((x, y, z, v) => {
      if (!idx.has(v & 0xff)) return;
      if (box && (x < box[0] || y < box[1] || z < box[2] || x > box[3] || y > box[4] || z > box[5])) return;
      n++;
    });
  });
  return n;
}

describe('Dadou', () => {
  for (const form of FORMS) {
    it(`builds the ${form} look without floating islands`, () => {
      const a = dadouAsset(form);
      const islands = a.warnings.filter((w) => w.includes('island'));
      expect(islands, islands.join(' | ')).toEqual([]);
      // 179 cm at 48 vox/m: the crown at 86 voxels, the hair (and the horns and crown spikes) a little above it
      let top = 0;
      for (const g of a.model.grids) {
        const b = g.bounds();
        if (b) top = Math.max(top, b.max[1]);
      }
      expect(top).toBeGreaterThanOrEqual(86);
      expect(top).toBeLessThanOrEqual(100);
    });
  }
  it('grins in every form but the last, where black takes half his face and that eye burns', () => {
    for (const form of ['sealed', 'shikai', 'bankai'] as const) {
      const m = dadouAsset(form).model;
      expect(count(m, 'teeth', ['head']), form).toBeGreaterThanOrEqual(6);
      expect(count(m, 'blackFace', ['head']), form).toBe(0);
    }
    const fin = dadouAsset('final').model;
    expect(count(fin, 'teeth', ['head'])).toBe(0);
    // the black is on his left (+x) side only
    expect(count(fin, 'blackFace', ['head'], [1, 60, -20, 20, 100, 20])).toBeGreaterThan(30);
    expect(count(fin, 'blackFace', ['head'], [-20, 60, 0, -2, 100, 20])).toBe(0);
    expect(count(fin, 'eyeGlow', ['head'])).toBeGreaterThanOrEqual(2);
  });
  it('wears the gold chain and its pendant in every form', () => {
    for (const form of FORMS) {
      const m = dadouAsset(form).model;
      // the pendant hangs at the middle of the chest, in front
      expect(count(m, 'gold', ['chest'], [-2, 60, 2, 2, 70, 16]), form).toBeGreaterThan(4);
    }
  });
  it('grows horns from the Shikai on, wears the crown only in the Bankai', () => {
    expect(count(dadouAsset('sealed').model, 'horn', ['head'])).toBe(0);
    for (const form of ['shikai', 'bankai', 'final'] as const) expect(count(dadouAsset(form).model, 'horn', ['head']), form).toBeGreaterThan(30);
    expect(count(dadouAsset('bankai').model, 'lacquer', ['head'])).toBeGreaterThan(60);
    expect(count(dadouAsset('final').model, 'lacquer', ['head'])).toBe(0);
  });
  it('has the second pair of arms only in the final form', () => {
    for (const form of FORMS) {
      const names = dadouAsset(form).model.bones.map((b) => b.name);
      expect(names.includes('upperarm2.L') && names.includes('upperarm2.R'), form).toBe(form === 'final');
    }
  });
  for (const k of ['katana', 'saya', 'shikai', 'bankai', 'final', 'halo', 'wheel'] as const) {
    it(`builds the ${k}`, () => {
      const m = dadouProp(k);
      expect(m.bones.length).toBeGreaterThan(0);
      expect(m.grids.reduce((n, g) => n + g.count(), 0)).toBeGreaterThan(60);
    });
  }
  it('builds every model of his fire (pillars, throne, demon heads, rocks, the Gates)', () => {
    const ms = hajunModels();
    expect(ms.length).toBeGreaterThanOrEqual(9);
    for (const m of ms) expect(m.grids.reduce((n, g) => n + g.count(), 0), m.name).toBeGreaterThan(60);
  });
  it('has every clip the kit plays', () => {
    const names = DADOU_CLIPS.map((c) => c.name);
    for (const n of [...DADOU_CHAIN, ...DADOU_BANKAI_CHAIN, ...DADOU_FINAL_CHAIN, 'df_float', 'dd_haien', 'dd_shakka', 'dd_oi', 'dd_gochu', 'dd_throne', 'dd_release', 'dd_kokuen', 'dd_onibi', 'dd_kensaku', 'dd_goka', 'dd_hyakki', 'dd_bankai', 'db_gates', 'db_chains', 'db_grab', 'db_hells', 'db_daitenma', 'db_tenka', 'df_cannon', 'df_wheel', 'df_muken', 'df_descent', 'df_tenka', 'df_seal', 'dash', 'hit_heavy'])
      expect(names).toContain(n);
    expect(new Set(names).size).toBe(names.length);
  });
  it('has a wiki page covering every form and every key', () => {
    const w = SPECIAL_WIKI.find((e) => e.id === 'dadou')!;
    expect(w).toBeDefined();
    expect(w.forms.length).toBe(4);
    for (const f of w.forms) for (const k of ['LMB', 'RMB', 'Q', 'E', 'R', 'G', 'F']) expect(f.moves.some((m) => m.key === k), `${f.name} ${k}`).toBe(true);
  });
});
