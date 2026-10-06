/**
 * Open-addressing hash set of non-negative integers stored as float64 (keys up to 2^53).
 * Much faster and leaner than Set<number> for millions of voxel indices. `clear()` costs O(size),
 * not O(capacity), so a big set can be reused for many small searches.
 */
export class NumSet {
  private keys: Float64Array;
  private mask: number;
  private used: Int32Array;
  size = 0;

  constructor(capacity = 1024) {
    let cap = 16;
    while (cap < capacity * 2) cap <<= 1;
    this.keys = new Float64Array(cap).fill(-1);
    this.mask = cap - 1;
    this.used = new Int32Array(cap >> 1);
  }

  private slot(k: number): number {
    const lo = k % 4294967296 | 0;
    const hi = (k / 4294967296) | 0;
    let h = Math.imul(lo ^ Math.imul(hi, 0x85ebca6b), 0x9e3779b1);
    h ^= h >>> 15;
    return h & this.mask;
  }

  has(k: number): boolean {
    const keys = this.keys;
    let i = this.slot(k);
    for (;;) {
      const v = keys[i];
      if (v === k) return true;
      if (v === -1) return false;
      i = (i + 1) & this.mask;
    }
  }

  /** Returns true if newly added. */
  add(k: number): boolean {
    if ((this.size + 1) * 2 > this.keys.length) this.grow();
    const keys = this.keys;
    let i = this.slot(k);
    for (;;) {
      const v = keys[i];
      if (v === k) return false;
      if (v === -1) {
        keys[i] = k;
        this.used[this.size++] = i;
        return true;
      }
      i = (i + 1) & this.mask;
    }
  }

  private grow(): void {
    const oldKeys = this.keys;
    const oldUsed = this.used;
    const n = this.size;
    this.keys = new Float64Array(oldKeys.length * 2).fill(-1);
    this.mask = this.keys.length - 1;
    this.used = new Int32Array(this.keys.length >> 1);
    this.size = 0;
    for (let j = 0; j < n; j++) this.add(oldKeys[oldUsed[j]]);
  }

  clear(): void {
    const keys = this.keys, used = this.used;
    for (let j = 0; j < this.size; j++) keys[used[j]] = -1;
    this.size = 0;
  }

  forEach(fn: (k: number) => void): void {
    const keys = this.keys, used = this.used;
    for (let j = 0; j < this.size; j++) fn(keys[used[j]]);
  }

  toArray(): Float64Array {
    const out = new Float64Array(this.size);
    const keys = this.keys, used = this.used;
    for (let j = 0; j < this.size; j++) out[j] = keys[used[j]];
    return out;
  }
}
