import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildIchigo, buildTensaZangetsu, buildZangetsuShikai } from '../src/chars/ichigo';
import { buildIchigoHollow } from '../src/chars/ichigoHollow';
import { HOLLOW_ICHIGO_CLIPS } from '../src/chars/hollowIchigoClips';
import { segSegDist2 } from '../src/vfx/shiro';

describe('Hollow Ichigo', () => {
  for (const form of ['shikai', 'bankai'] as const) {
    it(`builds the white ${form} without floating islands`, () => {
      const a = buildIchigo(form, 'white');
      const islands = a.warnings.filter((w) => w.includes('island'));
      expect(islands, islands.join(' | ')).toEqual([]);
    });
  }
  it('builds the monochrome Full Hollow without floating islands', () => {
    const a = buildIchigoHollow(true);
    const islands = a.warnings.filter((w) => w.includes('island'));
    expect(islands, islands.join(' | ')).toEqual([]);
  });
  it('builds the white swords', () => {
    expect(buildZangetsuShikai(true).bones.length).toBeGreaterThan(0);
    expect(buildTensaZangetsu(true).bones.length).toBeGreaterThan(0);
  });
  it('has the tether clips, the looping ones closed', () => {
    const names = HOLLOW_ICHIGO_CLIPS.map((c) => c.name);
    for (const n of ['hi_fling', 'hi_yank', 'hi_upswing', 'hi_whirl', 'hi_twirl', 'hi_toss', 'hi_reel', 'hi_catch', 'hi_grab', 'hi_laugh', 'hi_rise', 'slash1', 'getsuga', 'release']) expect(names).toContain(n);
    for (const c of HOLLOW_ICHIGO_CLIPS.filter((x) => x.loop)) {
      const first = c.keys.find((k) => k.c?.['@gripR'])!.c!['@gripR'];
      const last = [...c.keys].reverse().find((k) => k.c?.['@gripR'])!.c!['@gripR'];
      for (let i = 0; i < 3; i++) expect(Math.abs(first[i] - last[i])).toBeLessThan(1e-6);
    }
  });
  it('measures blade-to-body distances', () => {
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    // crossing segments touch
    expect(segSegDist2(v(-1, 0, 0), v(1, 0, 0), v(0, -1, 0), v(0, 1, 0))).toBeCloseTo(0);
    // parallel, 2 apart
    expect(Math.sqrt(segSegDist2(v(0, 0, 0), v(0, 1, 0), v(2, 0, 0), v(2, 1, 0)))).toBeCloseTo(2);
    // past the end of one segment
    expect(Math.sqrt(segSegDist2(v(0, 0, 0), v(1, 0, 0), v(3, -1, 0), v(3, 1, 0)))).toBeCloseTo(2);
  });
});
