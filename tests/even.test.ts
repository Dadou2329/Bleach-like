import { describe, expect, it } from 'vitest';
import { evenAsset, evenProp, type EvenForm } from '../src/chars/even';
import { EVEN_CHAIN, EVEN_CLIPS, EVEN_FINAL_CHAIN } from '../src/chars/evenClips';
import { SPECIAL_WIKI } from '../src/ui/wiki';

const FORMS: EvenForm[] = ['sealed', 'shikai', 'bankai', 'final'];

/** the colours of the materials the tests look for (the model keeps colours, not names) */
const COLOURS: Record<string, string[]> = { teeth: ['#EFEDE6'], cord: ['#6E5FDA', '#5547B8'], hairLit: ['#CDBDFF'], frame: ['#B9C1CD', '#9EA8B7', '#838E9F', '#6B7688'] };

/** voxels of a material in the model's grids (optionally only the named bones) */
function count(model: { palette: { color: string }[]; grids: { forEach(cb: (x: number, y: number, z: number, v: number) => void): void }[]; bones: { name: string }[] }, mat: string, bones?: string[]): number {
  const idx = new Set<number>();
  model.palette.forEach((p, i) => {
    if (COLOURS[mat].includes(p.color)) idx.add(i);
  });
  let n = 0;
  model.grids.forEach((g, bi) => {
    if (bones && !bones.includes(model.bones[bi].name)) return;
    g.forEach((_x, _y, _z, v) => {
      if (idx.has(v & 0xff)) n++;
    });
  });
  return n;
}

describe('Even', () => {
  for (const form of FORMS) {
    it(`builds the ${form} look without floating islands`, () => {
      const a = evenAsset(form);
      const islands = a.warnings.filter((w) => w.includes('island'));
      expect(islands, islands.join(' | ')).toEqual([]);
      // 181 cm at 48 vox/m: the crown at 87 voxels, the quiff a little above it
      let top = 0;
      for (const g of a.model.grids) {
        const b = g.bounds();
        if (b) top = Math.max(top, b.max[1]);
      }
      expect(top).toBeGreaterThanOrEqual(87);
      expect(top).toBeLessThanOrEqual(92);
    });
  }
  it('keeps his grin and the cord on his left wrist in every look', () => {
    for (const form of FORMS) {
      const m = evenAsset(form).model;
      expect(count(m, 'teeth', ['head']), form).toBeGreaterThanOrEqual(6);
      // both hand variants of the left hand carry the cord, the right hand none
      expect(count(m, 'cord', ['palm.L']), form).toBeGreaterThan(4);
      expect(count(m, 'cord', ['fist.L']), form).toBeGreaterThan(4);
      expect(count(m, 'cord', ['palm.R', 'fist.R']), form).toBe(0);
    }
  });
  it('runs violet light through the hair only in the final form', () => {
    expect(count(evenAsset('sealed').model, 'hairLit')).toBe(0);
    expect(count(evenAsset('final').model, 'hairLit')).toBeGreaterThan(8);
  });
  it('wears round glasses: a frame round both eyes and the arms back to the ears', () => {
    const g = evenProp('glasses');
    expect(count(g, 'frame')).toBeGreaterThan(60);
    // a frame on each side of the bridge
    let left = 0, right = 0;
    g.grids[0].forEach((x) => {
      if (x > 1) left++;
      if (x < -2) right++;
    });
    expect(left).toBeGreaterThan(20);
    expect(right).toBeGreaterThan(20);
  });
  for (const k of ['katana', 'saya', 'shikai', 'bankai', 'final', 'glasses', 'glassesLight', 'aureole'] as const) {
    it(`builds the ${k}`, () => {
      const m = evenProp(k);
      expect(m.bones.length).toBeGreaterThan(0);
      expect(m.grids.reduce((n, g) => n + g.count(), 0)).toBeGreaterThan(60);
    });
  }
  it('has every clip the kit plays', () => {
    const names = EVEN_CLIPS.map((c) => c.name);
    for (const n of [...EVEN_CHAIN, ...EVEN_FINAL_CHAIN, 'ef_float', 'ev_point', 'ev_twin', 'ev_wall', 'ev_bind', 'ev_coffin', 'ev_glasses', 'ev_release', 'ev_lens', 'ev_prism', 'ev_mirror', 'ev_focus', 'ev_flash', 'ev_bankai', 'ev_stab', 'ev_summon', 'ev_dive', 'ev_prison', 'ev_wave', 'ev_seal', 'ev_kaigen', 'ef_issen', 'ef_frame', 'ef_sun', 'ef_rebel', 'ef_judge', 'dash', 'hit_heavy'])
      expect(names).toContain(n);
    expect(new Set(names).size).toBe(names.length);
  });
  it('has a wiki page covering every form and every key', () => {
    const w = SPECIAL_WIKI.find((e) => e.id === 'even')!;
    expect(w).toBeDefined();
    expect(w.forms.length).toBeGreaterThanOrEqual(3);
    for (const f of w.forms) for (const k of ['LMB', 'RMB', 'Q', 'E', 'R', 'G', 'F']) expect(f.moves.some((m) => m.key === k), `${f.name} ${k}`).toBe(true);
  });
});
