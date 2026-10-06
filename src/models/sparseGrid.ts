// Sparse voxel grid made of 8³ bricks, for model authoring (unbounded signed coordinates).
// Values are Uint16: low byte = palette index (0 = empty), high bits = per-voxel flags.

const B = 8;
const B3 = B * B * B;
const OFF = 4096; // brick coordinate offset (covers ±32768 voxels)

function bkey(bx: number, by: number, bz: number): number {
  return ((bx + OFF) * 8192 + (by + OFF)) * 8192 + (bz + OFF);
}

export class SparseGrid {
  private bricks = new Map<number, Uint16Array>();
  private lastKey = -1;
  private lastBrick: Uint16Array | null = null;

  get(x: number, y: number, z: number): number {
    const bx = x >> 3, by = y >> 3, bz = z >> 3;
    const k = bkey(bx, by, bz);
    let b: Uint16Array | null | undefined;
    if (k === this.lastKey) b = this.lastBrick;
    else {
      b = this.bricks.get(k);
      if (!b) return 0;
      this.lastKey = k;
      this.lastBrick = b;
    }
    return b![(x & 7) | ((y & 7) << 3) | ((z & 7) << 6)];
  }

  set(x: number, y: number, z: number, v: number): void {
    const bx = x >> 3, by = y >> 3, bz = z >> 3;
    const k = bkey(bx, by, bz);
    let b: Uint16Array | null | undefined;
    if (k === this.lastKey) b = this.lastBrick;
    else {
      b = this.bricks.get(k);
      if (!b) {
        if (v === 0) return;
        b = new Uint16Array(B3);
        this.bricks.set(k, b);
      }
      this.lastKey = k;
      this.lastBrick = b;
    }
    b![(x & 7) | ((y & 7) << 3) | ((z & 7) << 6)] = v;
  }

  /** Visit every non-empty voxel. */
  forEach(cb: (x: number, y: number, z: number, v: number) => void): void {
    for (const [k, b] of this.bricks) {
      const bz = (k % 8192) - OFF;
      const by = (Math.floor(k / 8192) % 8192) - OFF;
      const bx = Math.floor(k / (8192 * 8192)) - OFF;
      for (let i = 0; i < B3; i++) {
        const v = b[i];
        if (v !== 0) cb((bx << 3) | (i & 7), (by << 3) | ((i >> 3) & 7), (bz << 3) | (i >> 6), v);
      }
    }
  }

  /** Bounds of non-empty voxels [min, max] inclusive, or null when empty. */
  bounds(): { min: [number, number, number]; max: [number, number, number] } | null {
    const mn: [number, number, number] = [Infinity, Infinity, Infinity];
    const mx: [number, number, number] = [-Infinity, -Infinity, -Infinity];
    let any = false;
    this.forEach((x, y, z) => {
      any = true;
      if (x < mn[0]) mn[0] = x; if (y < mn[1]) mn[1] = y; if (z < mn[2]) mn[2] = z;
      if (x > mx[0]) mx[0] = x; if (y > mx[1]) mx[1] = y; if (z > mx[2]) mx[2] = z;
    });
    return any ? { min: mn, max: mx } : null;
  }

  count(): number {
    let n = 0;
    this.forEach(() => n++);
    return n;
  }

  clone(): SparseGrid {
    const g = new SparseGrid();
    for (const [k, b] of this.bricks) g.bricks.set(k, b.slice());
    return g;
  }

  clear(): void {
    this.bricks.clear();
    this.lastKey = -1;
    this.lastBrick = null;
  }
}
