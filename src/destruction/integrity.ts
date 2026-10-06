// Structural integrity: after voxels are removed, find solid components that are no longer
// connected to an anchor (bedrock, indestructible material, or the map's side boundary).
//
// Gravity-guided search: always expand the lowest voxel first. A component that still touches
// the ground finds it in roughly O(height) steps; a floating one is explored completely and
// returned so it can become a falling fragment.
import { NumSet } from '../core/numset';
import { F_INDESTRUCTIBLE, F_LIQUID, F_SOLID } from '../voxel/materials';
import type { VoxelWorld } from '../voxel/world';

export interface FloatingComponent {
  /** packed voxel indices x + sx*(y + sy*z) */
  voxels: Float64Array;
  minX: number; minY: number; minZ: number;
  maxX: number; maxY: number; maxZ: number;
}

export class IntegrityChecker {
  /** voxels with y < anchorY are anchored (bedrock layers) */
  anchorY = 2;
  private supported = new NumSet(1 << 14);
  private claimed = new NumSet(1 << 12);
  private visited = new NumSet(1 << 14);
  private buckets: number[][] = [];
  stats = { searches: 0, visited: 0, floating: 0, ms: 0 };

  constructor(private world: VoxelWorld) {
    for (let y = 0; y < world.sy; y++) this.buckets.push([]);
  }

  key(x: number, y: number, z: number): number {
    return x + this.world.sx * (y + this.world.sy * z);
  }

  private isSupportMat(m: number): boolean {
    const f = this.world.mats.flags[m];
    return (f & F_SOLID) !== 0 && (f & F_LIQUID) === 0;
  }

  /**
   * @param seeds packed voxel indices to start from (solid neighbours of removed voxels)
   * @param maxComponent components bigger than this are assumed supported
   * @param maxTotal total voxel visit budget for this call
   */
  findFloating(seeds: number[], maxComponent = 450_000, maxTotal = 2_500_000): FloatingComponent[] {
    const t0 = performance.now();
    const w = this.world;
    const sx = w.sx, sy = w.sy, sxy = sx * sy;
    const out: FloatingComponent[] = [];
    this.supported.clear();
    this.claimed.clear();
    let total = 0;
    for (const seed of seeds) {
      if (total > maxTotal) break;
      if (this.supported.has(seed) || this.claimed.has(seed)) continue;
      const sx0 = seed % sx, sy0 = Math.floor(seed / sx) % sy, sz0 = Math.floor(seed / sxy);
      if (!this.isSupportMat(w.get(sx0, sy0, sz0))) continue;
      this.stats.searches++;
      const res = this.search(seed, maxComponent);
      total += this.visited.size;
      if (res) {
        out.push(res);
        for (let i = 0; i < res.voxels.length; i++) this.claimed.add(res.voxels[i]);
      }
    }
    this.stats.visited += total;
    this.stats.floating += out.length;
    this.stats.ms += performance.now() - t0;
    return out;
  }

  /** Returns the component if floating, null if supported. */
  private search(seed: number, maxComponent: number): FloatingComponent | null {
    const w = this.world;
    const sx = w.sx, sy = w.sy, sz = w.sz, sxy = sx * sy;
    const flags = w.mats.flags;
    const visited = this.visited;
    visited.clear();
    const buckets = this.buckets;
    let lowest = sy;
    let pending = 0;
    const push = (k: number, y: number) => {
      buckets[y].push(k);
      if (y < lowest) lowest = y;
      pending++;
    };
    const sy0 = Math.floor(seed / sx) % sy;
    visited.add(seed);
    push(seed, sy0);
    let minX = sx, minY = sy, minZ = sz, maxX = -1, maxY = -1, maxZ = -1;
    let supported = false;
    while (pending > 0) {
      while (buckets[lowest].length === 0) lowest++;
      const k = buckets[lowest].pop()!;
      pending--;
      const x = k % sx, y = lowest, z = Math.floor(k / sxy);
      // anchors
      if (y < this.anchorY || x === 0 || z === 0 || x === sx - 1 || z === sz - 1 || flags[w.get(x, y, z)] & F_INDESTRUCTIBLE) {
        supported = true;
        break;
      }
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
      // neighbours (down first is implicit via bucket order)
      for (let n = 0; n < 6; n++) {
        let nx = x, ny = y, nz = z;
        if (n === 0) ny--; else if (n === 1) ny++; else if (n === 2) nx--; else if (n === 3) nx++; else if (n === 4) nz--; else nz++;
        if (ny < 0 || ny >= sy) continue;
        const nk = nx + sx * (ny + sy * nz);
        if (this.supported.has(nk)) { supported = true; break; }
        if (visited.has(nk)) continue;
        const m = w.get(nx, ny, nz);
        if (m === 0 || !this.isSupportMat(m)) continue;
        visited.add(nk);
        push(nk, ny);
      }
      if (supported) break;
      if (visited.size > maxComponent) { supported = true; break; }
    }
    // drain buckets
    for (let y = lowest; y < sy && pending > 0; y++) {
      pending -= buckets[y].length;
      buckets[y].length = 0;
    }
    if (supported) {
      visited.forEach((k) => this.supported.add(k));
      return null;
    }
    return { voxels: visited.toArray(), minX, minY, minZ, maxX, maxY, maxZ };
  }
}
