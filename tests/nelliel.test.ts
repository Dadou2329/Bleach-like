import { describe, expect, it } from 'vitest';
import { buildNelliel, nelProp } from '../src/chars/nelliel';
import { GAMUZA_CHAIN, GAMUZA_CLIPS, GAMUZA_STANCE, NEL_CHAIN, NEL_CHILD_CHAIN, NEL_CHILD_CLIPS, NEL_CLIPS } from '../src/chars/nellielClips';

describe('Nelliel Tu Odelschwanck', () => {
  for (const form of ['adult', 'child', 'gamuza'] as const) {
    it(`builds the ${form} without floating islands`, () => {
      const a = buildNelliel(form);
      const islands = a.warnings.filter((w) => w.includes('island'));
      expect(islands, islands.join(' | ')).toEqual([]);
    });
  }
  it('builds Gamuza sealed and the lance', () => {
    expect(nelProp('gamuza').bones.length).toBeGreaterThan(0);
    expect(nelProp('lance').bones.length).toBeGreaterThan(0);
  });
  it('rigs the centaur with four legs and a tail', () => {
    const names = buildNelliel('gamuza').model.bones.map((b) => b.name);
    for (const n of ['fthigh.L', 'fshin.R', 'ffoot.L', 'thigh.R', 'shin.L', 'foot.R', 'tail1', 'tail2', 'upperarm.R', 'head']) expect(names).toContain(n);
    expect(GAMUZA_STANCE.quad).toBeTruthy();
  });
  it('has every clip the kit plays', () => {
    const a = NEL_CLIPS.map((c) => c.name), c = NEL_CHILD_CLIPS.map((c) => c.name), gz = GAMUZA_CLIPS.map((c) => c.name);
    for (const n of [...NEL_CHAIN, 'nl_precise', 'nl_cero', 'nl_catch', 'nl_doble', 'nl_sonido', 'nl_release', 'nl_shrink', 'dash', 'hit_heavy']) expect(a).toContain(n);
    for (const n of [...NEL_CHILD_CHAIN, 'nc_tama', 'nc_swallow', 'nc_spit', 'nc_shower', 'nc_rocket', 'nc_grow', 'dash', 'hit_heavy']) expect(c).toContain(n);
    for (const n of [...GAMUZA_CHAIN, 'gz_plunge', 'gz_lanzador', 'gz_charge', 'gz_catch', 'gz_doble', 'gz_burst', 'gz_seal', 'dash', 'airstep', 'hit_heavy']) expect(gz).toContain(n);
  });
});
