import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createBaseMaterials } from '../src/voxel/materials';
import { VoxelWorld } from '../src/voxel/world';
import { BoxShape, CapsuleShape, CrescentShape, SphereShape } from '../src/destruction/shapes';
import { IntegrityChecker } from '../src/destruction/integrity';

function towerWorld() {
  const mats = createBaseMaterials();
  const w = VoxelWorld.fromMeters(mats, { x: 32, y: 32, z: 32 }, 0.125);
  const stone = mats.id('stone'), conc = mats.id('concrete');
  w.fillBox(0, 0, 0, w.sx, 16, w.sz, stone); // ground 2 m
  // hollow tower 4×4 m, 16 m tall, walls 2 voxels, at x,z 12..16 m
  const x0 = 96, z0 = 96, x1 = 128, z1 = 128;
  for (let y = 16; y < 16 + 128; y++) {
    w.fillBox(x0, y, z0, x1, y + 1, z0 + 2, conc);
    w.fillBox(x0, y, z1 - 2, x1, y + 1, z1, conc);
    w.fillBox(x0, y, z0, x0 + 2, y + 1, z1, conc);
    w.fillBox(x1 - 2, y, z0, x1, y + 1, z1, conc);
  }
  return { w, mats, conc };
}

describe('shapes', () => {
  it('sphere enumerates voxels inside its radius', () => {
    const s = new SphereShape(new THREE.Vector3(2, 2, 2), 1);
    let n = 0;
    s.forEachVoxel(0.125, () => n++);
    // volume 4.19 m³ / 0.00195 ≈ 2145
    expect(n).toBeGreaterThan(1900);
    expect(n).toBeLessThan(2400);
  });

  it('rotated thin slab covers its full area without gaps', () => {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.45));
    const s = new BoxShape(new THREE.Vector3(14, 10, 14), new THREE.Vector3(9, 0.13, 9), q);
    const set = new Set<string>();
    s.forEachVoxel(0.125, (x, y, z) => set.add(`${x},${y},${z}`));
    expect(set.size).toBeGreaterThan(10000);
    // every column (x,z) inside the footprint must contain at least one voxel
    let missing = 0;
    for (let x = 100; x < 120; x++)
      for (let z = 100; z < 120; z++) {
        let found = false;
        for (let y = 0; y < 200 && !found; y++) if (set.has(`${x},${y},${z}`)) found = true;
        if (!found) missing++;
      }
    expect(missing).toBe(0);
  });

  it('crescent and capsule enumerate something', () => {
    let n = 0;
    new CrescentShape(new THREE.Vector3(5, 5, 5), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0), 3, 1.1, 0.4, 0.3).forEachVoxel(0.125, () => n++);
    expect(n).toBeGreaterThan(500);
    n = 0;
    new CapsuleShape(new THREE.Vector3(0, 5, 0), new THREE.Vector3(20, 6, 20), 1).forEachVoxel(0.125, () => n++);
    expect(n).toBeGreaterThan(30000);
  });
});

describe('integrity', () => {
  it('detects the top of a sliced tower as floating', () => {
    const { w } = towerWorld();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.45));
    const cut = new BoxShape(new THREE.Vector3(14, 10, 14), new THREE.Vector3(9, 0.13, 9), q);
    const seeds: number[] = [];
    let removed = 0;
    cut.forEachVoxel(w.vs, (x, y, z) => {
      if (w.get(x, y, z) !== 0 && w.inBounds(x, y, z)) {
        w.set(x, y, z, 0);
        removed++;
        for (const [dx, dy, dz] of [[0, 1, 0], [0, -1, 0]]) {
          const nx = x + dx, ny = y + dy, nz = z + dz;
          if (w.isSolid(nx, ny, nz)) seeds.push(nx + w.sx * (ny + w.sy * nz));
        }
      }
    });
    expect(removed).toBeGreaterThan(100);
    const ic = new IntegrityChecker(w);
    const comps = ic.findFloating(seeds);
    expect(comps.length).toBe(1);
    expect(comps[0].voxels.length).toBeGreaterThan(5000);
  });

  it('keeps a notched but connected tower supported', () => {
    const { w } = towerWorld();
    const seeds: number[] = [];
    new SphereShape(new THREE.Vector3(12, 8, 12), 1.2).forEachVoxel(w.vs, (x, y, z) => {
      if (w.get(x, y, z)) {
        w.set(x, y, z, 0);
        if (w.isSolid(x, y + 1, z)) seeds.push(x + w.sx * (y + 1 + w.sy * z));
      }
    });
    const comps = new IntegrityChecker(w).findFloating(seeds);
    expect(comps.length).toBe(0);
  });
});
