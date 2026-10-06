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
    for (let b = 0; b < BRICKS; b++) {
      const bx = (b & 3) << 3, by = ((b >> 2) & 3) << 3, bz = (b >> 4) << 3;
      const bits = this.bits[b];
      const po = this.palOff[b];
      if (bits === 0) {
        const v = this.palette[po];
        for (let z = 0; z < 8; z++)
          for (let y = 0; y < 8; y++) {
            const s = vidx(bx, by + y, bz + z);
            out.fill(v, s, s + 8);
          }
        continue;
      }
      const mask = (1 << bits) - 1;
      const off = this.dataOff[b];
      let li = 0;
      for (let z = 0; z < 8; z++)
        for (let y = 0; y < 8; y++) {
          const s = vidx(bx, by + y, bz + z);
          for (let x = 0; x < 8; x++, li++) {
            const bitPos = li * bits;
            out[s + x] = this.palette[po + ((this.data[off + (bitPos >>> 5)] >>> (bitPos & 31)) & mask)];
          }
        }
    }
  }

  static fromDense(dense: Uint8Array): PackedChunk {
    const bits = new Uint8Array(BRICKS);
    const palOff = new Uint16Array(BRICKS);
    const dataOff = new Uint32Array(BRICKS);
    const palette: number[] = [];
    const words: number[] = [];
    const remap = new Int16Array(256);
    const local = new Uint8Array(BRICK_VOX);
    for (let b = 0; b < BRICKS; b++) {
      const bx = (b & 3) << 3, by = ((b >> 2) & 3) << 3, bz = (b >> 4) << 3;
      remap.fill(-1);
      const pal: number[] = [];
      let li = 0;
      for (let z = 0; z < 8; z++)
        for (let y = 0; y < 8; y++) {
          const s = vidx(bx, by + y, bz + z);
          for (let x = 0; x < 8; x++, li++) {
            const v = dense[s + x];
            let r = remap[v];
            if (r < 0) {
              r = remap[v] = pal.length;
              pal.push(v);
            }
            local[li] = r;
          }
        }
      palOff[b] = palette.length;
      for (const v of pal) palette.push(v);
      const n = pal.length;
      const nb = n <= 1 ? 0 : n <= 2 ? 1 : n <= 4 ? 2 : n <= 16 ? 4 : 8;
      bits[b] = nb;
      if (nb === 0) continue;
      dataOff[b] = words.length;
      const nWords = (BRICK_VOX * nb) >>> 5;
      const base = words.length;
      for (let w = 0; w < nWords; w++) words.push(0);
      for (let i = 0; i < BRICK_VOX; i++) {
        const bitPos = i * nb;
        const wi = base + (bitPos >>> 5);
        words[wi] = (words[wi] | (local[i] << (bitPos & 31))) >>> 0;
      }
    }
    return new PackedChunk(bits, palOff, dataOff, Uint8Array.from(palette), Uint32Array.from(words));
  }
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
    const d = new Uint8Array(CS3);
    if (this.packed) this.packed.decodeInto(d);
    else if (this.uniform !== 0) d.fill(this.uniform);
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

  /** Dense → packed/uniform. Returns approx bytes used afterwards. */
  compress(): number {
    if (!this.dense) return this.packed ? this.packed.byteSize : 0;
    const d = this.dense;
    const first = d[0];
    let uniform = true;
    for (let i = 1; i < CS3; i++)
      if (d[i] !== first) {
        uniform = false;
        break;
      }
    this.dense = null;
    if (uniform) {
      this.uniform = first;
      this.packed = null;
      return 0;
    }
    this.packed = PackedChunk.fromDense(d);
    return this.packed.byteSize;
  }

  /** True if every voxel is air (cheap check for uniform chunks only). */
  get isEmptyUniform(): boolean {
    return this.isUniform && this.uniform === 0;
  }
}
