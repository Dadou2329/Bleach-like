// Breakable props (Hollow masks, armour plates): split a single-bone voxel model into shards along
// jagged Voronoi seams, and make progressively cracked copies of the whole model with one-voxel crack
// lines painted on some of those seams, so the cracks a player sees are lines the prop breaks along.
import { LOCK, type VoxelModel } from './builder';
import { SparseGrid } from './sparseGrid';

export interface Shard {
  model: VoxelModel;
  /** centroid in metres, in the model's local frame */
  center: [number, number, number];
  voxels: number;
}

export interface Shattered {
  /** progressively cracked copies (one per entry of `levels`) */
  cracked: VoxelModel[];
  shards: Shard[];
}

export interface ShatterOpts {
  pieces: number;
  seed?: number;
  /** crack line colour (sRGB hex) */
  crack?: string;
  /** seam wobble in voxels */
  jitter?: number;
  /** fraction of the seams drawn as visible cracks, per cracked copy (default [0.45]) */
  levels?: number[];
}

function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

function hash3(x: number, y: number, z: number, k: number): number {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647 + k * 1274126177) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Smooth value noise in [-1, 1] (period-free, cell size 1). */
function noise3(x: number, y: number, z: number, k: number): number {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), sz = fz * fz * (3 - 2 * fz);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => hash3(ix + dx, iy + dy, iz + dz, k);
  const v = l(
    l(l(c(0, 0, 0), c(1, 0, 0), sx), l(c(0, 1, 0), c(1, 1, 0), sx), sy),
    l(l(c(0, 0, 1), c(1, 0, 1), sx), l(c(0, 1, 1), c(1, 1, 1), sx), sy),
    sz,
  );
  return v * 2 - 1;
}

/** Split bone 0 of `model` into `pieces` shards. */
export function shatterModel(model: VoxelModel, o: ShatterOpts): Shattered {
  const g = model.grids[0];
  const xs: number[] = [], ys: number[] = [], zs: number[] = [], vals: number[] = [];
  g.forEach((x, y, z, v) => { xs.push(x); ys.push(y); zs.push(z); vals.push(v); });
  const n = vals.length;
  const K = Math.max(1, Math.min(o.pieces, n));
  const rand = rng(o.seed ?? 7);
  const jit = o.jitter ?? 1.6;
  // jittered positions: seams follow the noise instead of straight Voronoi planes
  const px = new Float32Array(n), py = new Float32Array(n), pz = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = xs[i] + 0.5, y = ys[i] + 0.5, z = zs[i] + 0.5;
    // wobble in the face plane only, so seams stay roughly perpendicular to a mask-like shell
    px[i] = x + noise3(x / 2.6, y / 2.6, z / 2.6, 1) * jit;
    py[i] = y + noise3(x / 2.6, y / 2.6, z / 2.6, 2) * jit;
    pz[i] = z;
  }
  // farthest-point seeds, then a few Lloyd steps so the pieces come out similar in size
  const cx = new Float32Array(K), cy = new Float32Array(K), cz = new Float32Array(K);
  const dmin = new Float32Array(n).fill(Infinity);
  let s = Math.floor(rand() * n);
  for (let k = 0; k < K; k++) {
    cx[k] = px[s]; cy[k] = py[s]; cz[k] = pz[s];
    let best = -1;
    for (let i = 0; i < n; i++) {
      const dx = px[i] - cx[k], dy = py[i] - cy[k], dz = pz[i] - cz[k];
      const d = dx * dx + dy * dy + dz * dz;
      if (d < dmin[i]) dmin[i] = d;
      const score = dmin[i] * (0.8 + 0.4 * hash3(i, k, 0, 9));
      if (score > best) { best = score; s = i; }
    }
  }
  const cell = new Int32Array(n);
  const assign = () => {
    for (let i = 0; i < n; i++) {
      let best = Infinity, bk = 0;
      for (let k = 0; k < K; k++) {
        const dx = px[i] - cx[k], dy = py[i] - cy[k], dz = pz[i] - cz[k];
        const d = dx * dx + dy * dy + dz * dz;
        if (d < best) { best = d; bk = k; }
      }
      cell[i] = bk;
    }
  };
  for (let it = 0; it < 4; it++) {
    assign();
    const sx = new Float32Array(K), sy = new Float32Array(K), sz = new Float32Array(K), cnt = new Float32Array(K);
    for (let i = 0; i < n; i++) { const k = cell[i]; sx[k] += px[i]; sy[k] += py[i]; sz[k] += pz[i]; cnt[k]++; }
    for (let k = 0; k < K; k++) if (cnt[k] > 0) { cx[k] = sx[k] / cnt[k]; cy[k] = sy[k] / cnt[k]; cz[k] = sz[k] / cnt[k]; }
  }
  assign();
  // lookup voxel → cell for the seam test
  const cellAt = new SparseGrid();
  for (let i = 0; i < n; i++) cellAt.set(xs[i], ys[i], zs[i], cell[i] + 1);
  // seams between neighbouring cells, in a random order; a cracked copy draws the first part of them
  const pairKey = (a: number, b: number) => (a < b ? a * 256 + b : b * 256 + a);
  const pairs = new Set<number>();
  const N6 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  for (let i = 0; i < n; i++) {
    const c = cell[i] + 1;
    for (const [dx, dy, dz] of N6) {
      const nb = cellAt.get(xs[i] + dx, ys[i] + dy, zs[i] + dz);
      if (nb !== 0 && nb !== c) pairs.add(pairKey(c, nb));
    }
  }
  const order = [...pairs].sort((a, b) => hash3(a, 0, 0, o.seed ?? 7) - hash3(b, 0, 0, o.seed ?? 7));
  const palette = model.palette.slice();
  const crackIdx = palette.length;
  palette.push({ color: o.crack ?? '#16100F', rough: 0.95, metal: 0, glow: 0 });
  const bones = model.bones.slice(0, 1);
  const cracked: VoxelModel[] = (o.levels ?? [0.45]).map((frac, li) => {
    const shown = new Set(order.slice(0, Math.max(1, Math.round(order.length * frac))));
    const grid = g.clone();
    for (let i = 0; i < n; i++) {
      const c = cell[i] + 1;
      // visible surfaces only (front and sides, not the back against the face); one voxel wide:
      // the cell with the higher number takes the line
      const front = cellAt.get(xs[i], ys[i], zs[i] + 1) === 0;
      const side = cellAt.get(xs[i] + 1, ys[i], zs[i]) === 0 || cellAt.get(xs[i] - 1, ys[i], zs[i]) === 0 ||
        cellAt.get(xs[i], ys[i] + 1, zs[i]) === 0 || cellAt.get(xs[i], ys[i] - 1, zs[i]) === 0;
      if (!front && !side) continue;
      for (const [dx, dy, dz] of N6) {
        const nb = cellAt.get(xs[i] + dx, ys[i] + dy, zs[i] + dz);
        if (nb !== 0 && nb < c && shown.has(pairKey(c, nb))) {
          grid.set(xs[i], ys[i], zs[i], crackIdx | LOCK);
          break;
        }
      }
    }
    return { name: `${model.name}~cracked${li}`, res: model.res, palette, bones, grids: [grid], sockets: {} };
  });
  // shards
  const grids = Array.from({ length: K }, () => new SparseGrid());
  const acc = Array.from({ length: K }, () => [0, 0, 0, 0]);
  for (let i = 0; i < n; i++) {
    const k = cell[i];
    grids[k].set(xs[i], ys[i], zs[i], vals[i]);
    const a = acc[k];
    a[0] += xs[i] + 0.5; a[1] += ys[i] + 0.5; a[2] += zs[i] + 0.5; a[3]++;
  }
  const shards: Shard[] = [];
  for (let k = 0; k < K; k++) {
    const a = acc[k];
    if (a[3] === 0) continue;
    shards.push({
      model: { name: `${model.name}~shard${k}`, res: model.res, palette: model.palette, bones, grids: [grids[k]], sockets: {} },
      center: [a[0] / a[3] / model.res, a[1] / a[3] / model.res, a[2] / a[3] / model.res],
      voxels: a[3],
    });
  }
  return { cracked, shards };
}
