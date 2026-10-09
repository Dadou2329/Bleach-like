import { describe, expect, it } from 'vitest';
import { natachaAsset, natachaProp, type NatachaForm } from '../src/chars/natacha';
import { NATACHA_CHAIN, NATACHA_CLIPS, NATACHA_FINAL_CHAIN } from '../src/chars/natachaClips';
import { SPECIAL_WIKI } from '../src/ui/wiki';

const FORMS: NatachaForm[] = ['sealed', 'shikai', 'bankai', 'final'];

/** the colours of the materials the tests look for (the model keeps colours, not names) */
const COLOURS: Record<string, string[]> = { freckle: ['#C88A66', '#F4C27C'], stoneLit: ['#FFF2C0'], stone: ['#AEBBE6'] };

/** voxels of a material anywhere in the model */
function count(form: NatachaForm, mat: string): number {
  const a = natachaAsset(form);
  const idx = new Set<number>();
  a.model.palette.forEach((p, i) => {
    if (COLOURS[mat].includes(p.color)) idx.add(i);
  });
  let n = 0;
  for (const g of a.model.grids) g.forEach((_x, _y, _z, v) => {
    if (idx.has(v & 0xff)) n++;
  });
  return n;
}

describe('Natacha', () => {
  for (const form of FORMS) {
    it(`builds the ${form} look without floating islands`, () => {
      const a = natachaAsset(form);
      const islands = a.warnings.filter((w) => w.includes('island'));
      expect(islands, islands.join(' | ')).toEqual([]);
      // 165 cm at 48 vox/m: the crown at 79 voxels
      let top = 0;
      for (const g of a.model.grids) {
        const b = g.bounds();
        if (b) top = Math.max(top, b.max[1]);
      }
      expect(top).toBeGreaterThanOrEqual(78);
    });
  }
  it('keeps her freckles on the face in every look', () => {
    // across the nose and the cheeks, and round the sides of the face (the loose hair hides a few of those)
    expect(count('sealed', 'freckle')).toBeGreaterThanOrEqual(10);
    for (const form of FORMS) expect(count(form, 'freckle'), form).toBeGreaterThanOrEqual(7);
  });
  it('lights one stone of the necklace per release', () => {
    expect(count('sealed', 'stoneLit')).toBe(0);
    expect(count('shikai', 'stoneLit')).toBe(1);
    expect(count('bankai', 'stoneLit')).toBe(2);
    expect(count('final', 'stoneLit')).toBe(3);
    expect(count('sealed', 'stone')).toBe(3);
  });
  for (const k of ['katana', 'saya', 'shikai', 'bankai', 'final', 'halo'] as const) {
    it(`builds the ${k}`, () => {
      const m = natachaProp(k);
      expect(m.bones.length).toBeGreaterThan(0);
      expect(m.grids.reduce((n, g) => n + g.count(), 0)).toBeGreaterThan(100);
    });
  }
  it('has every clip the kit plays', () => {
    const names = NATACHA_CLIPS.map((c) => c.name);
    for (const n of [...NATACHA_CHAIN, ...NATACHA_FINAL_CHAIN, 'nt_float', 'nt_iai', 'nt_palm', 'nt_point', 'nt_curtain', 'nt_read', 'nt_release', 'nt_trace', 'nt_sky', 'nt_aim', 'nt_heave', 'nt_bankai', 'nt_summon', 'nt_crush', 'nt_seal', 'nt_korin', 'nf_nova', 'nf_halt', 'nf_aim', 'nf_dawn', 'dash', 'hit_heavy'])
      expect(names).toContain(n);
    expect(new Set(names).size).toBe(names.length);
  });
  it('has a wiki page covering every form and every key', () => {
    const w = SPECIAL_WIKI.find((e) => e.id === 'natacha')!;
    expect(w).toBeDefined();
    expect(w.forms.length).toBeGreaterThanOrEqual(3);
    for (const f of w.forms) for (const k of ['LMB', 'RMB', 'Q', 'E', 'R', 'G', 'F']) expect(f.moves.some((m) => m.key === k), `${f.name} ${k}`).toBe(true);
  });
});
