import { describe, expect, it } from 'vitest';
import { buildUryuTybw, uryuTybwProp, type UryuTybwProp } from '../src/chars/uryuTybw';
import { URYU_TYBW_CHAIN, URYU_TYBW_CLIPS, URYU_TYBW_CLOSE, URYU_VOLL_CHAIN } from '../src/chars/uryuTybwClips';
import type { VoxelModel } from '../src/models/builder';

/** 6-connected components of every bone grid of a model */
function islands(m: VoxelModel): number[] {
  return m.grids.map((g) => {
    const seen = new Set<string>();
    let n = 0;
    g.forEach((x, y, z) => {
      if (seen.has(`${x},${y},${z}`)) return;
      n++;
      const stack: [number, number, number][] = [[x, y, z]];
      seen.add(`${x},${y},${z}`);
      while (stack.length) {
        const [a, b, c] = stack.pop()!;
        for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
          const k = `${a + dx},${b + dy},${c + dz}`;
          if (!seen.has(k) && g.get(a + dx, b + dy, c + dz) !== 0) {
            seen.add(k);
            stack.push([a + dx, b + dy, c + dz]);
          }
        }
      }
    });
    return n;
  });
}

describe('TYBW Uryū', () => {
  for (const form of ['sternritter', 'vollstandig'] as const) {
    it(`builds the ${form} body without floating islands`, () => {
      const a = buildUryuTybw(form);
      const isl = a.warnings.filter((w) => w.includes('island'));
      expect(isl, isl.join(' | ')).toEqual([]);
      for (const n of ['grip.R', 'grip.L', 'bow', 'draw', 'palm.R', 'palm.L', 'toe.R', 'glasses', 'eye.L', 'eye.R', 'back']) expect(Object.keys(a.model.sockets)).toContain(n);
      const bones = a.model.bones.map((b) => b.name);
      if (form === 'vollstandig') for (const n of ['wing.L', 'wing.R']) expect(bones).toContain(n);
      else expect(bones).not.toContain('wing.L');
      // the cape hangs at the sides and back only, on spring chains
      expect(a.springs.some((s) => s.bone === 'cape.B.L')).toBe(true);
      expect(a.springs.some((s) => s.bone.startsWith('cape.F.'))).toBe(false);
    });
  }
  for (const k of ['bogen', 'flechette', 'standspitze', 'chip'] as UryuTybwProp[]) {
    it(`builds the ${k} prop in one piece`, () => {
      const m = uryuTybwProp(k);
      const counts = islands(m).filter((n, i) => m.grids[i].count() > 0);
      for (const n of counts) expect(n, `${k}: ${counts.join(',')}`).toBe(1);
    });
  }
  it('the Heilig Bogen stands about his height', () => {
    const m = uryuTybwProp('bogen');
    let lo = Infinity, hi = -Infinity;
    m.grids[0].forEach((_x, y) => {
      lo = Math.min(lo, y);
      hi = Math.max(hi, y);
    });
    const h = (hi - lo + 1) / m.res;
    expect(h).toBeGreaterThan(1.5);
    expect(h).toBeLessThan(1.9);
  });
  it('every string and move names a clip', () => {
    const names = new Set(URYU_TYBW_CLIPS.map((c) => c.name));
    for (const n of [...URYU_TYBW_CHAIN, ...URYU_TYBW_CLOSE, ...URYU_VOLL_CHAIN, 'ut_charge', 'ut_licht', 'ut_antithesis', 'ut_standspitze', 'ut_chip', 'ut_detonate', 'ut_release', 'ut_stern', 'ut_cage', 'ut_feder', 'ut_sklaverei', 'ut_barrier', 'ut_beams', 'ut_beat', 'dash', 'hit_heavy']) expect(names.has(n), n).toBe(true);
  });
});
