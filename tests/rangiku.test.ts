import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildRangiku, rangikuProp } from '../src/chars/rangiku';
import { HAINEKO_CHAIN, HAINEKO_CLIPS, RANGIKU_CHAIN, RANGIKU_CLIPS } from '../src/chars/rangikuClips';
import { AshGrains } from '../src/vfx/haineko';

describe('Rangiku Matsumoto', () => {
  it('builds without floating islands', () => {
    const a = buildRangiku();
    const islands = a.warnings.filter((w) => w.includes('island'));
    expect(islands, islands.join(' | ')).toEqual([]);
  });
  for (const k of ['katana', 'saya', 'hilt', 'blade', 'seal'] as const) {
    it(`builds the ${k}`, () => {
      expect(rangikuProp(k).bones.length).toBeGreaterThan(0);
    });
  }
  it('splits the katana into the hilt and the blade', () => {
    const n = (k: 'katana' | 'hilt' | 'blade') => rangikuProp(k).grids.reduce((s, g) => s + g.count(), 0);
    expect(n('hilt') + n('blade')).toBeGreaterThanOrEqual(n('katana') - 4);
    expect(n('blade')).toBeGreaterThan(n('hilt'));
  });
  it('has every clip the kit plays', () => {
    const s = RANGIKU_CLIPS.map((c) => c.name), k = HAINEKO_CLIPS.map((c) => c.name);
    for (const n of [...RANGIKU_CHAIN, 'rk_wide', 'rk_shakka', 'rk_provoke', 'rk_dead', 'rk_throat', 'rk_gentei', 'rk_tentei', 'rk_unare', 'rk_house', 'dash', 'hit_heavy']) expect(s).toContain(n);
    for (const n of [...HAINEKO_CHAIN, 'rk_tide', 'rk_veil', 'rk_flick', 'rk_rinbu', 'rk_shield', 'rk_house', 'rk_unare', 'dash', 'hit_heavy']) expect(k).toContain(n);
  });
});

describe('Haineko ash grains', () => {
  const home = () => ({ kind: 'cloud' as const, center: new THREE.Vector3(), radius: 2, height: 2, spin: 0.5 });
  it('hands grains between groups and back home', () => {
    const a = new AshGrains(400, home());
    a.grow(300, 0, (_i, o) => o.set(Math.random(), Math.random(), Math.random()));
    const gid = a.open({ kind: 'dome', center: new THREE.Vector3(), radius: 2 });
    expect(a.move(0, gid, 120)).toBe(120);
    expect(a.members[0]).toBe(180);
    expect(a.members[gid]).toBe(120);
    for (let i = 0; i < 30; i++) a.update(1 / 60);
    a.close(gid);
    expect(a.members[0]).toBe(300);
    expect(a.group(gid)).toBeNull();
    a.dispose();
  });
  it('kills from the preferred group first and keeps the counts straight', () => {
    const a = new AshGrains(400, home());
    a.grow(200, 0, (_i, o) => o.set(0, 0, 0));
    const gid = a.open({ kind: 'dome', center: new THREE.Vector3(), radius: 2 });
    a.move(0, gid, 50);
    expect(a.kill(170, 0)).toBe(170);
    expect(a.count).toBe(30);
    expect(a.members[0]).toBe(0);
    expect(a.members[gid]).toBe(30);
    expect(a.kill(1000, 0)).toBe(30);
    expect(a.count).toBe(0);
    a.dispose();
  });
  it('keeps every grain finite through every formation', () => {
    const a = new AshGrains(600, home());
    a.grow(600, 0, (_i, o) => o.set(Math.random() * 4, Math.random() * 2, Math.random() * 4));
    const v = () => new THREE.Vector3(Math.random(), Math.random(), Math.random());
    const forms = [
      { kind: 'stream' as const, from: v(), ctrl: v(), to: v().addScalar(5), radius: 0.8, speed: 1.4 },
      { kind: 'line' as const, from: v(), ctrl: v(), to: v().addScalar(3), radius: 0.2, reach: 0.6 },
      { kind: 'column' as const, base: v(), radius: 1, height: 4, spin: 3 },
      { kind: 'tornado' as const, center: v(), radius: 2.4, height: 5, spin: 3 },
      { kind: 'wave' as const, origin: v(), dir: new THREE.Vector3(0, 0, 1), width: 7, height: 2.8, front: 4, depth: 4 },
      { kind: 'layers' as const, center: v(), normal: new THREE.Vector3(1, 0, 0), width: 3, height: 3, layers: 5, gap: 0.3 },
      { kind: 'coat' as const, base: v(), radius: 0.4, height: 1.8 },
      { kind: 'patches' as const, points: [v(), v()], normals: [new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0)], radius: 0.5 },
      { kind: 'patches' as const, points: [], normals: [], radius: 0.5 },
      { kind: 'burst' as const, center: v(), radius: 3 },
    ];
    for (const f of forms) a.move(0, a.open(f), 50);
    for (let i = 0; i < 120; i++) a.update(1 / 60);
    const p = new THREE.Vector3();
    for (let i = 0; i < a.count; i++) {
      a.pos(i, p);
      expect(Number.isFinite(p.x + p.y + p.z)).toBe(true);
    }
    a.dispose();
  });
});
