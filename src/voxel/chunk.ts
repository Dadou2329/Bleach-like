// Chunk storage: a 32³ block of material ids (0 = air).
//
// Three states:
//   uniform — every voxel is `uniform` (no arrays; covers sky air and solid bedrock)
//   packed  — 64 bricks of 8³, each uniform or palette + bit-packed indices (1/2/4/8 bits)
//   dense   — a plain Uint8Array(32768), used while a chunk is being edited ("hot")
// Writes always go to dense; `compress()` turns a cold dense chunk back into packed/uniform.

export const CS = 32;
export const CS_BITS = 5;
export const CS_MASK = 31;
export const CS3 = CS * CS * CS;

/** Index of a voxel inside a chunk: x | y<<5 | z<<10. */
export function vidx(x: number, y: number, z: number): number {
  return x | (y << 5) | (z << 10);
}

const BRICKS = 64; // 4×4×4 bricks of 8³
const BRICK_VOX = 512;

/** Immutable packed chunk. */
export class PackedChunk {
  /** per brick: bits per index (0 = uniform brick) */
  readonly bits: Uint8Array;
  /** per brick: offset into `palette` */
  readonly palOff: Uint16Array;
  /** per brick: offset (in u32 words) into `data` */
  readonly dataOff: Uint32Array;
  readonly palette: Uint8Array;
  readonly data: Uint32Array;

  private constructor(bits: Uint8Array, palOff: Uint16Array, dataOff: Uint32Array, palette: Uint8Array, data: Uint32Array) {
    this.bits = bits;
    this.palOff = palOff;
    this.dataOff = dataOff;
    this.palette = palette;
    this.data = data;
  }

  get byteSize(): number {
    return this.bits.byteLength + this.palOff.byteLength + this.dataOff.byteLength + this.palette.byteLength + this.data.byteLength;
  }

  get(i: number): number {
    const x = i & 31, y = (i >> 5) & 31, z = i >> 10;
    const b = (x >> 3) | ((y >> 3) << 2) | ((z >> 3) << 4);
    const bits = this.bits[b];
    const po = this.palOff[b];
    if (bits === 0) return this.palette[po];
    const li = (x & 7) | ((y & 7) << 3) | ((z & 7) << 6);
    const bitPos = li * bits;
    const word = this.data[this.dataOff[b] + (bitPos >>> 5)];
    return this.palette[po + ((word >>> (bitPos & 31)) & ((1 << bits) - 1))];
  }

  /** Decode everything into a dense 32³ array. */
  decodeInto(out: Uint8Array): void {
    // rows of 8 voxels are 8-aligned: a uniform brick is written two words per row
    const o32 = new Uint32Array(out.buffer, out.byteOffset, CS3 >> 2);
    const data = this.data, palette = this.palette;
    for (let b = 0; b < BRICKS; b++) {
      const bx = (b & 3) << 3, by = ((b >> 2) & 3) << 3, bz = (b >> 4) << 3;
      const bits = this.bits[b];
      const po = this.palOff[b];
      if (bits === 0) {
        const pat = Math.imul(palette[po], 0x01010101) >>> 0;
        for (let z = 0; z < 8; z++)
          for (let y = 0; y < 8; y++) {
            const s = vidx(bx, by + y, bz + z) >> 2;
            o32[s] = pat;
            o32[s + 1] = pat;
          }
        continue;
      }
      const mask = (1 << bits) - 1;
      let wi = this.dataOff[b], word = data[wi], sh = 0;
      for (let z = 0; z < 8; z++)
        for (let y = 0; y < 8; y++) {
          const s = vidx(bx, by + y, bz + z);
          for (let x = 0; x < 8; x++) {
            out[s + x] = palette[po + ((word >>> sh) & mask)];
            sh += bits;
            if (sh === 32) {
              sh = 0;
              word = data[++wi];
            }
          }
        }
    }
  }

  /**
   * Decode into a padded volume (the mesher's (32+2)³ layout, index x + P·(y + P·z) with a one-voxel shell): the
   * chunk's voxel (x, y, z) lands at (x+1, y+1, z+1). The shell is left alone.
   */
  decodePadded(out: Uint8Array, P: number): void {
    const data = this.data, palette = this.palette;
    for (let b = 0; b < BRICKS; b++) {
      const bx = (b & 3) << 3, by = ((b >> 2) & 3) << 3, bz = (b >> 4) << 3;
      const bits = this.bits[b];
      const po = this.palOff[b];
      if (bits === 0) {
        const v = palette[po];
        for (let z = 0; z < 8; z++)
          for (let y = 0; y < 8; y++) {
            const o = bx + 1 + P * (by + y + 1 + P * (bz + z + 1));
            out.fill(v, o, o + 8);
          }
        continue;
      }
      const mask = (1 << bits) - 1;
      let wi = this.dataOff[b], word = data[wi], sh = 0;
      for (let z = 0; z < 8; z++)
        for (let y = 0; y < 8; y++) {
          const o = bx + 1 + P * (by + y + 1 + P * (bz + z + 1));
          for (let x = 0; x < 8; x++) {
            out[o + x] = palette[po + ((word >>> sh) & mask)];
            sh += bits;
            if (sh === 32) {
              sh = 0;
              word = data[++wi];
            }
          }
        }
    }
  }

  static fromDense(dense: Uint8Array): PackedChunk {
    const bits = new Uint8Array(BRICKS);
    const palOff = new Uint16Array(BRICKS);
    const dataOff = new Uint32Array(BRICKS);
    const pal = S_PAL, words = S_WORDS, local = S_LOCAL, stamp = S_STAMP, remap = S_REMAP;
    const d32 = new Uint32Array(dense.buffer, dense.byteOffset, CS3 >> 2);
    let np = 0, nw = 0;
    for (let b = 0; b < BRICKS; b++) {
      const bx = (b & 3) << 3, by = ((b >> 2) & 3) << 3, bz = (b >> 4) << 3;
      palOff[b] = np;
      // most bricks are one material (rock, sky, a slab): test that first, a row (two words) at a time
      const first = dense[vidx(bx, by, bz)];
      const pat = Math.imul(first, 0x01010101) >>> 0;
      let uniform = true;
      for (let z = 0; z < 8 && uniform; z++)
        for (let y = 0; y < 8; y++) {
          const s = vidx(bx, by + y, bz + z) >> 2;
          if (d32[s] !== pat || d32[s + 1] !== pat) {
            uniform = false;
            break;
          }
        }
      if (uniform) {
        pal[np++] = first;
        continue;
      }
      if (++stampGen > 0x3fffffff) {
        stamp.fill(0);
        stampGen = 1;
      }
      const gen = stampGen;
      let n = 0, li = 0;
      for (let z = 0; z < 8; z++)
        for (let y = 0; y < 8; y++) {
          const s = vidx(bx, by + y, bz + z);
          for (let x = 0; x < 8; x++, li++) {
            const v = dense[s + x];
            if (stamp[v] !== gen) {
              stamp[v] = gen;
              remap[v] = n;
              pal[np + n] = v;
              n++;
            }
            local[li] = remap[v];
          }
        }
      np += n;
      const nb = n <= 2 ? 1 : n <= 4 ? 2 : n <= 16 ? 4 : 8;
      bits[b] = nb;
      dataOff[b] = nw;
      // a word holds 32 / nb indices, lowest bits first
      const per = 32 / nb;
      for (let i = 0; i < BRICK_VOX; i += per) {
        let word = 0;
        for (let k = 0, sh = 0; k < per; k++, sh += nb) word |= local[i + k] << sh;
        words[nw++] = word;
      }
    }
    return new PackedChunk(bits, palOff, dataOff, pal.slice(0, np), words.slice(0, nw));
  }
}

// scratch for `fromDense` (compression runs on one thread at a time)
const S_PAL = new Uint8Array(BRICKS * 256);
const S_WORDS = new Uint32Array(BRICKS * ((BRICK_VOX * 8) >>> 5));
const S_LOCAL = new Uint8Array(BRICK_VOX);
const S_STAMP = new Int32Array(256);
const S_REMAP = new Uint8Array(256);
let stampGen = 0;

/**
 * Dense arrays handed back by bulk compression (`compress(true)`: generation, `compressAll`) and reused by the next
 * `ensureDense`, so building a big map does not allocate (and zero) a fresh 32 KB array for every chunk it touches.
 */
const densePool: Uint8Array[] = [];
const DENSE_POOL_MAX = 256;

export function clearDensePool(): void {
  densePool.length = 0;
}

export class Chunk {
  uniform = 0;
  dense: Uint8Array | null = null;
  packed: PackedChunk | null = null;
  /** bumps on every change; used to discard stale worker results */
  version = 0;
  /** sim time of the last write (for hot→cold compression) */
  lastWrite = 0;

  constructor(uniform = 0) {
    this.uniform = uniform;
  }

  get isUniform(): boolean {
    return this.dense === null && this.packed === null;
  }

  get(i: number): number {
    if (this.dense) return this.dense[i];
    if (this.packed) return this.packed.get(i);
    return this.uniform;
  }

  ensureDense(): Uint8Array {
    if (this.dense) return this.dense;
    const reused = densePool.pop();
    const d = reused ?? new Uint8Array(CS3);
    if (this.packed) this.packed.decodeInto(d);
    else if (this.uniform !== 0 || reused) d.fill(this.uniform);
    this.packed = null;
    this.dense = d;
    return d;
  }

  /** Returns the previous value. */
  set(i: number, v: number): number {
    if (!this.dense) {
      const cur = this.packed ? this.packed.get(i) : this.uniform;
      if (cur === v) return cur;
      this.ensureDense();
    }
    const d = this.dense!;
    const old = d[i];
    if (old !== v) {
      d[i] = v;
      this.version++;
    }
    return old;
  }

  /** Copy all voxels into `out` (dense 32³). */
  copyTo(out: Uint8Array): void {
    if (this.dense) out.set(this.dense);
    else if (this.packed) this.packed.decodeInto(out);
    else out.fill(this.uniform);
  }

  /**
   * Dense → packed/uniform. Returns approx bytes used afterwards. `recycle`: the dense array goes back to the pool
   * (only for callers that know nobody else still holds it: generation and bulk compression).
   */
  compress(recycle = false): number {
    if (!this.dense) return this.packed ? this.packed.byteSize : 0;
    const d = this.dense;
    const first = d[0];
    const pat = Math.imul(first, 0x01010101) >>> 0;
    const d32 = new Uint32Array(d.buffer, d.byteOffset, CS3 >> 2);
    let uniform = true;
    for (let i = 0; i < CS3 >> 2; i++)
      if (d32[i] !== pat) {
        uniform = false;
        break;
      }
    this.dense = null;
    if (uniform) {
      this.uniform = first;
      this.packed = null;
    } else this.packed = PackedChunk.fromDense(d);
    if (recycle && densePool.length < DENSE_POOL_MAX) densePool.push(d);
    return this.packed ? this.packed.byteSize : 0;
  }

  /**
   * True if every voxel is opaque (solid, neither transparent nor liquid), judged from the palette for a packed chunk:
   * such a chunk walled in by others like it has no face to draw.
   */
  allOpaque(opaque: (id: number) => boolean): boolean {
    if (this.packed) {
      const pal = this.packed.palette;
      for (let i = 0; i < pal.length; i++) if (!opaque(pal[i])) return false;
      return true;
    }
    if (this.dense) return false;
    return opaque(this.uniform);
  }

  /** True if every voxel is air (cheap check for uniform chunks only). */
  get isEmptyUniform(): boolean {
    return this.isUniform && this.uniform === 0;
  }
}
