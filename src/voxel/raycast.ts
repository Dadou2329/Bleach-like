import type { VoxelWorld } from './world';
import { F_SOLID } from './materials';

export interface VoxelHit {
  x: number; y: number; z: number;
  /** face normal of the entered face */
  nx: number; ny: number; nz: number;
  /** distance in metres */
  dist: number;
  m: number;
}

/** 3D DDA (Amanatides & Woo) through the voxel grid. Origin/dir in metres; dir need not be normalised. */
export function raycastVoxels(
  world: VoxelWorld,
  ox: number, oy: number, oz: number,
  dx: number, dy: number, dz: number,
  maxDist: number,
  mask = F_SOLID,
): VoxelHit | null {
  const len = Math.hypot(dx, dy, dz);
  if (len === 0) return null;
  dx /= len; dy /= len; dz /= len;
  const vs = world.vs;
  let x = Math.floor(ox / vs), y = Math.floor(oy / vs), z = Math.floor(oz / vs);
  const stepX = dx > 0 ? 1 : -1, stepY = dy > 0 ? 1 : -1, stepZ = dz > 0 ? 1 : -1;
  const tDeltaX = dx !== 0 ? Math.abs(vs / dx) : Infinity;
  const tDeltaY = dy !== 0 ? Math.abs(vs / dy) : Infinity;
  const tDeltaZ = dz !== 0 ? Math.abs(vs / dz) : Infinity;
  const fx = ox / vs - x, fy = oy / vs - y, fz = oz / vs - z;
  let tMaxX = dx !== 0 ? (dx > 0 ? 1 - fx : fx) * tDeltaX : Infinity;
  let tMaxY = dy !== 0 ? (dy > 0 ? 1 - fy : fy) * tDeltaY : Infinity;
  let tMaxZ = dz !== 0 ? (dz > 0 ? 1 - fz : fz) * tDeltaZ : Infinity;
  let nx = 0, ny = 0, nz = 0;
  let t = 0;
  const flags = world.mats.flags;
  for (let i = 0; i < 4096 && t <= maxDist; i++) {
    const m = world.get(x, y, z);
    if (m !== 0 && (flags[m] & mask) !== 0) return { x, y, z, nx, ny, nz, dist: t, m };
    if (tMaxX < tMaxY && tMaxX < tMaxZ) {
      x += stepX; t = tMaxX; tMaxX += tDeltaX; nx = -stepX; ny = 0; nz = 0;
    } else if (tMaxY < tMaxZ) {
      y += stepY; t = tMaxY; tMaxY += tDeltaY; nx = 0; ny = -stepY; nz = 0;
    } else {
      z += stepZ; t = tMaxZ; tMaxZ += tDeltaZ; nx = 0; ny = 0; nz = -stepZ;
    }
    if (y < -1 || y > world.sy + 1) {
      if ((dy > 0 && y > world.sy) || (dy < 0 && y < 0)) break;
    }
  }
  return null;
}
