// Voxel construction helpers for map generators. Coordinates are voxel units unless suffixed with M (metres).
import type { VoxelWorld } from '../voxel/world';
import type { Rng } from '../core/rng';

export class Builder {
  readonly vs: number;
  readonly vpm: number; // voxels per metre

  constructor(readonly w: VoxelWorld) {
    this.vs = w.vs;
    this.vpm = Math.round(1 / w.vs);
  }

  /** metres → voxels (rounded) */
  v(m: number): number {
    return Math.round(m * this.vpm);
  }

  id(name: string): number {
    return this.w.mats.id(name);
  }

  set(x: number, y: number, z: number, mat: number): void {
    this.w.set(x, y, z, mat);
  }

  /** Fill [x0,x1)×[y0,y1)×[z0,z1). */
  box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, mat: number): void {
    this.w.fillBox(Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1), Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1), mat);
  }

  /** Only write where currently air. */
  boxIfAir(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, mat: number): void {
    for (let z = z0; z < z1; z++) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (this.w.get(x, y, z) === 0) this.w.set(x, y, z, mat);
  }

  /** Replace only voxels of material `from`. */
  replace(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, from: number, to: number): void {
    for (let z = z0; z < z1; z++) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (this.w.get(x, y, z) === from) this.w.set(x, y, z, to);
  }

  /** Walls of a box with thickness t (no top/bottom). */
  walls(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, t: number, mat: number): void {
    this.box(x0, y0, z0, x1, y1, z0 + t, mat);
    this.box(x0, y0, z1 - t, x1, y1, z1, mat);
    this.box(x0, y0, z0, x0 + t, y1, z1, mat);
    this.box(x1 - t, y0, z0, x1, y1, z1, mat);
  }

  sphere(cx: number, cy: number, cz: number, r: number, mat: number, rng?: Rng, jitter = 0): void {
    const r2 = r * r;
    for (let z = Math.floor(cz - r); z <= cz + r; z++)
      for (let y = Math.floor(cy - r); y <= cy + r; y++)
        for (let x = Math.floor(cx - r); x <= cx + r; x++) {
          const dx = x + 0.5 - cx, dy = y + 0.5 - cy, dz = z + 0.5 - cz;
          const d2 = dx * dx + dy * dy + dz * dz;
          const rr = jitter && rng ? r2 * (1 - jitter + rng.next() * jitter) : r2;
          if (d2 <= rr) this.w.set(x, y, z, mat);
        }
  }

  ellipsoid(cx: number, cy: number, cz: number, rx: number, ry: number, rz: number, mat: number, onlyAir = false): void {
    for (let z = Math.floor(cz - rz); z <= cz + rz; z++)
      for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
        for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
          const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, dz = (z + 0.5 - cz) / rz;
          if (dx * dx + dy * dy + dz * dz <= 1) {
            if (onlyAir && this.w.get(x, y, z) !== 0) continue;
            this.w.set(x, y, z, mat);
          }
        }
  }

  cylinderY(cx: number, cz: number, y0: number, y1: number, r: number, mat: number): void {
    const r2 = r * r;
    for (let z = Math.floor(cz - r); z <= cz + r; z++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        const dx = x + 0.5 - cx, dz = z + 0.5 - cz;
        if (dx * dx + dz * dz <= r2) for (let y = y0; y < y1; y++) this.w.set(x, y, z, mat);
      }
  }

  /** Thick 3D line (for branches, wires, frames). */
  line(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, r: number, mat: number): void {
    const len = Math.hypot(x1 - x0, y1 - y0, z1 - z0);
    const steps = Math.max(1, Math.ceil(len * 2));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, z = z0 + (z1 - z0) * t;
      if (r <= 0.6) this.w.set(Math.floor(x), Math.floor(y), Math.floor(z), mat);
      else this.sphere(x, y, z, r, mat);
    }
  }
}
