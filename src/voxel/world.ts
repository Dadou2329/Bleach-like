import { Chunk, CS, CS_BITS, CS_MASK, CS3, PackedChunk, vidx } from './chunk';
import { MaterialTable, F_SOLID } from './materials';

export type EditHook = (x: number, y: number, z: number, oldV: number, newV: number) => void;

/**
 * A bounded voxel world made of 32³ chunks. Voxel coordinates are integers with the origin at the
 * map's min corner; world position (metres) = voxel × `vs`.
 */
export class VoxelWorld {
  readonly vs: number;
  readonly cx: number;
  readonly cy: number;
  readonly cz: number;
  readonly sx: number;
  readonly sy: number;
  readonly sz: number;
  readonly chunks: (Chunk | null)[];
  readonly mats: MaterialTable;
  readonly bedrockId: number;
  /** chunk indices whose meshes need rebuilding */
  readonly dirty = new Set<number>();
  /** chunk indices written since the last `takeTouched()` (colliders, compression bookkeeping) */
  private touched = new Set<number>();
  /** chunks turned dense by writes since the last `compressHot()` (generation keeps its working set small) */
  private hot = new Set<number>();
  /** optional per-voxel edit hook (restoration log, replicas); not called during generation */
  onEdit: EditHook | null = null;
  /** sim clock, stamped onto chunks for hot→cold compression */
  time = 0;

  constructor(mats: MaterialTable, sizeVoxels: { x: number; y: number; z: number }, voxelSize: number) {
    this.mats = mats;
    this.vs = voxelSize;
    this.cx = Math.ceil(sizeVoxels.x / CS);
    this.cy = Math.ceil(sizeVoxels.y / CS);
    this.cz = Math.ceil(sizeVoxels.z / CS);
    this.sx = this.cx * CS;
    this.sy = this.cy * CS;
    this.sz = this.cz * CS;
    this.chunks = new Array(this.cx * this.cy * this.cz).fill(null);
    this.bedrockId = mats.has('bedrock') ? mats.id('bedrock') : 1;
  }

  static fromMeters(mats: MaterialTable, size: { x: number; y: number; z: number }, voxelSize: number): VoxelWorld {
    return new VoxelWorld(
      mats,
      { x: Math.round(size.x / voxelSize), y: Math.round(size.y / voxelSize), z: Math.round(size.z / voxelSize) },
      voxelSize,
    );
  }

  chunkIndex(cx: number, cy: number, cz: number): number {
    return cx + this.cx * (cy + this.cy * cz);
  }

  chunkCoords(ci: number): [number, number, number] {
    const cx = ci % this.cx;
    const cy = Math.floor(ci / this.cx) % this.cy;
    const cz = Math.floor(ci / (this.cx * this.cy));
    return [cx, cy, cz];
  }

  inBounds(x: number, y: number, z: number): boolean {
    return x >= 0 && y >= 0 && z >= 0 && x < this.sx && y < this.sy && z < this.sz;
  }

  /** Material at voxel. Below the map = bedrock, elsewhere outside = air. */
  get(x: number, y: number, z: number): number {
    if (y < 0) return this.bedrockId;
    if (x < 0 || z < 0 || x >= this.sx || y >= this.sy || z >= this.sz) return 0;
    const c = this.chunks[(x >> CS_BITS) + this.cx * ((y >> CS_BITS) + this.cy * (z >> CS_BITS))];
    return c ? c.get(vidx(x & CS_MASK, y & CS_MASK, z & CS_MASK)) : 0;
  }

  isSolid(x: number, y: number, z: number): boolean {
    return (this.mats.flags[this.get(x, y, z)] & F_SOLID) !== 0;
  }

  /** Solid test at a world position in metres. */
  isSolidAtPos(px: number, py: number, pz: number): boolean {
    const s = 1 / this.vs;
    return this.isSolid(Math.floor(px * s), Math.floor(py * s), Math.floor(pz * s));
  }

  getChunk(ci: number, create: boolean): Chunk | null {
    let c = this.chunks[ci];
    if (!c && create) c = this.chunks[ci] = new Chunk(0);
    return c;
  }

  /** Set a voxel. Returns the previous value. Marks meshes dirty (including neighbours on borders). */
  set(x: number, y: number, z: number, v: number): number {
    if (!this.inBounds(x, y, z)) return 0;
    const cxi = x >> CS_BITS, cyi = y >> CS_BITS, czi = z >> CS_BITS;
    const ci = cxi + this.cx * (cyi + this.cy * czi);
    let c = this.chunks[ci];
    if (!c) {
      if (v === 0) return 0;
      c = this.chunks[ci] = new Chunk(0);
    }
    const lx = x & CS_MASK, ly = y & CS_MASK, lz = z & CS_MASK;
    const wasDense = c.dense !== null;
    const old = c.set(vidx(lx, ly, lz), v);
    if (old === v) return old;
    if (!wasDense) this.hot.add(ci);
    c.lastWrite = this.time;
    this.dirty.add(ci);
    this.touched.add(ci);
    // neighbours share faces/AO on borders
    if (lx === 0 && cxi > 0) this.dirty.add(ci - 1);
    if (lx === CS_MASK && cxi < this.cx - 1) this.dirty.add(ci + 1);
    if (ly === 0 && cyi > 0) this.dirty.add(ci - this.cx);
    if (ly === CS_MASK && cyi < this.cy - 1) this.dirty.add(ci + this.cx);
    if (lz === 0 && czi > 0) this.dirty.add(ci - this.cx * this.cy);
    if (lz === CS_MASK && czi < this.cz - 1) this.dirty.add(ci + this.cx * this.cy);
    // AO also reads diagonal neighbours: mark edge/corner neighbours too
    if (lx === 0 || lx === CS_MASK || ly === 0 || ly === CS_MASK || lz === 0 || lz === CS_MASK) this.markDiagonalNeighbours(cxi, cyi, czi, lx, ly, lz);
    if (this.onEdit) this.onEdit(x, y, z, old, v);
    return old;
  }

  private markDiagonalNeighbours(cxi: number, cyi: number, czi: number, lx: number, ly: number, lz: number): void {
    const dxs = lx === 0 ? [-1, 0] : lx === CS_MASK ? [0, 1] : [0];
    const dys = ly === 0 ? [-1, 0] : ly === CS_MASK ? [0, 1] : [0];
    const dzs = lz === 0 ? [-1, 0] : lz === CS_MASK ? [0, 1] : [0];
    for (const dx of dxs)
      for (const dy of dys)
        for (const dz of dzs) {
          const nx = cxi + dx, ny = cyi + dy, nz = czi + dz;
          if (nx < 0 || ny < 0 || nz < 0 || nx >= this.cx || ny >= this.cy || nz >= this.cz) continue;
          this.dirty.add(this.chunkIndex(nx, ny, nz));
        }
  }

  /** Chunks written since last call (and clears the set). */
  takeTouched(): number[] {
    const out = [...this.touched];
    this.touched.clear();
    return out;
  }

  /** Fill an inclusive-exclusive voxel box [x0,x1)×[y0,y1)×[z0,z1). Fast path for generation. */
  fillBox(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, v: number): void {
    x0 = Math.max(0, x0); y0 = Math.max(0, y0); z0 = Math.max(0, z0);
    x1 = Math.min(this.sx, x1); y1 = Math.min(this.sy, y1); z1 = Math.min(this.sz, z1);
    if (x0 >= x1 || y0 >= y1 || z0 >= z1) return;
    for (let cz = z0 >> CS_BITS; cz <= (z1 - 1) >> CS_BITS; cz++)
      for (let cy = y0 >> CS_BITS; cy <= (y1 - 1) >> CS_BITS; cy++)
        for (let cx = x0 >> CS_BITS; cx <= (x1 - 1) >> CS_BITS; cx++) {
          const ci = this.chunkIndex(cx, cy, cz);
          const bx = cx << CS_BITS, by = cy << CS_BITS, bz = cz << CS_BITS;
          const lx0 = Math.max(x0 - bx, 0), lx1 = Math.min(x1 - bx, CS);
          const ly0 = Math.max(y0 - by, 0), ly1 = Math.min(y1 - by, CS);
          const lz0 = Math.max(z0 - bz, 0), lz1 = Math.min(z1 - bz, CS);
          let c = this.chunks[ci];
          // whole chunk covered → uniform
          if (lx0 === 0 && ly0 === 0 && lz0 === 0 && lx1 === CS && ly1 === CS && lz1 === CS) {
            if (!c) c = this.chunks[ci] = new Chunk(v);
            else {
              c.dense = null;
              c.packed = null;
              c.uniform = v;
              c.version++;
            }
            this.dirty.add(ci);
            continue;
          }
          if (!c) {
            if (v === 0) continue;
            c = this.chunks[ci] = new Chunk(0);
          }
          if (!c.dense) this.hot.add(ci);
          const d = c.ensureDense();
          for (let z = lz0; z < lz1; z++)
            for (let y = ly0; y < ly1; y++) {
              const s = vidx(0, y, z);
              d.fill(v, s + lx0, s + lx1);
            }
          c.version++;
          this.dirty.add(ci);
        }
  }

  /** Compress every hot chunk (after generation) and drop all-air chunks. */
  compressAll(): { bytes: number; chunks: number } {
    let bytes = 0, n = 0;
    for (let i = 0; i < this.chunks.length; i++) {
      const c = this.chunks[i];
      if (!c) continue;
      bytes += c.compress(true);
      if (c.isEmptyUniform) this.chunks[i] = null;
      else n++;
    }
    this.hot.clear();
    return { bytes, chunks: n };
  }

  /**
   * Generation: once more than `limit` chunks have gone dense, pack them all again (their arrays are reused by the
   * next ones), so a big map is built with a bounded working set instead of a dense array per chunk it touched.
   */
  compressHot(limit = 0): void {
    if (this.hot.size <= limit) return;
    for (const i of this.hot) {
      const c = this.chunks[i];
      if (!c) continue;
      c.compress(true);
      if (c.isEmptyUniform) this.chunks[i] = null;
    }
    this.hot.clear();
  }

  /**
   * Generation: horizontal strata over the whole map, from the bottom up to `yTop` (exclusive); `matAt(y)` is the
   * material of the voxel row at height y. Every column of chunks shares one immutable packed chunk per chunk layer
   * (a write copies it out first), so deep ground costs next to nothing until something digs into it.
   */
  fillStrata(yTop: number, matAt: (y: number) => number): void {
    const d = new Uint8Array(CS3);
    for (let cy = 0; cy < this.cy && cy * CS < yTop; cy++) {
      for (let ly = 0; ly < CS; ly++) {
        const y = cy * CS + ly;
        const m = y < yTop ? matAt(y) : 0;
        for (let lz = 0; lz < CS; lz++) d.fill(m, vidx(0, ly, lz), vidx(0, ly, lz) + CS);
      }
      let uniform = true;
      for (let i = 1; i < CS3; i++)
        if (d[i] !== d[0]) {
          uniform = false;
          break;
        }
      const packed = uniform ? null : PackedChunk.fromDense(d);
      for (let cz = 0; cz < this.cz; cz++)
        for (let cx = 0; cx < this.cx; cx++) {
          const ci = this.chunkIndex(cx, cy, cz);
          const c = new Chunk(uniform ? d[0] : 0);
          c.packed = packed;
          this.chunks[ci] = uniform && d[0] === 0 ? null : c;
          this.dirty.add(ci);
        }
    }
  }

  /** Compress chunks that have not been written for `idleSeconds`. */
  compressIdle(idleSeconds: number, maxPerCall = 8): void {
    let done = 0;
    for (let i = 0; i < this.chunks.length && done < maxPerCall; i++) {
      const c = this.chunks[i];
      if (c && c.dense && this.time - c.lastWrite > idleSeconds) {
        c.compress();
        if (c.isEmptyUniform) this.chunks[i] = null;
        done++;
      }
    }
  }

  /**
   * Copy chunk (cx,cy,cz) plus a 1-voxel border into `out` (34³, index x + 34*(y + 34*z)).
   * Used by the mesher (borders give correct faces and AO across chunk seams).
   */
  copyPadded(cxi: number, cyi: number, czi: number, out: Uint8Array): void {
    const P = CS + 2;
    const bx = cxi << CS_BITS, by = cyi << CS_BITS, bz = czi << CS_BITS;
    const c = this.chunks[this.chunkIndex(cxi, cyi, czi)];
    // interior
    if (c && c.dense) {
      const d = c.dense;
      for (let z = 0; z < CS; z++)
        for (let y = 0; y < CS; y++) {
          const o = 1 + P * (y + 1 + P * (z + 1));
          const s = vidx(0, y, z);
          for (let x = 0; x < CS; x++) out[o + x] = d[s + x];
        }
    } else if (c && c.packed) {
      c.packed.decodePadded(out, P);
    } else {
      const u = c ? c.uniform : 0;
      for (let z = 0; z < CS; z++)
        for (let y = 0; y < CS; y++) {
          const o = 1 + P * (y + 1 + P * (z + 1));
          out.fill(u, o, o + CS);
        }
    }
    // border shell (6536 voxels), read straight from the 26 neighbouring chunks
    const nb = scratchNeighbours;
    for (let dz = -1; dz <= 1; dz++)
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = cxi + dx, ny = cyi + dy, nz = czi + dz;
          const k = dx + 1 + 3 * (dy + 1 + 3 * (dz + 1));
          if (ny < 0) {
            nb[k] = null;
            nbFill[k] = this.bedrockId;
          } else if (nx < 0 || nz < 0 || nx >= this.cx || ny >= this.cy || nz >= this.cz) {
            nb[k] = null;
            nbFill[k] = 0;
          } else {
            const n = this.chunks[this.chunkIndex(nx, ny, nz)];
            if (!n || n.isUniform) {
              nb[k] = null;
              nbFill[k] = n ? n.uniform : 0;
            } else {
              nb[k] = n;
              nbFill[k] = -1;
            }
          }
        }
    const read = (x: number, y: number, z: number): number => {
      const kx = x < 0 ? 0 : x >= CS ? 2 : 1, ky = y < 0 ? 0 : y >= CS ? 2 : 1, kz = z < 0 ? 0 : z >= CS ? 2 : 1;
      const k = kx + 3 * (ky + 3 * kz);
      const n = nb[k];
      return n ? n.get(vidx(x & CS_MASK, y & CS_MASK, z & CS_MASK)) : nbFill[k];
    };
    for (let z = -1; z <= CS; z++)
      for (let y = -1; y <= CS; y++) {
        const edgeYZ = z === -1 || z === CS || y === -1 || y === CS;
        const rowBase = P * (y + 1 + P * (z + 1));
        if (edgeYZ) {
          // a whole row in one neighbour that is uniform: fill it
          const ky = y < 0 ? 0 : y >= CS ? 2 : 1, kz = z < 0 ? 0 : z >= CS ? 2 : 1;
          const kMid = 1 + 3 * (ky + 3 * kz);
          if (nb[kMid] === null && nb[kMid - 1] === null && nb[kMid + 1] === null && nbFill[kMid] === nbFill[kMid - 1] && nbFill[kMid] === nbFill[kMid + 1]) {
            out.fill(nbFill[kMid], rowBase, rowBase + P);
            continue;
          }
          for (let x = -1; x <= CS; x++) out[rowBase + x + 1] = read(x, y, z);
        } else {
          out[rowBase] = read(-1, y, z);
          out[rowBase + CS + 1] = read(CS, y, z);
        }
      }
  }

  /** Approximate memory used by voxel data (bytes). */
  memoryBytes(): number {
    let b = 0;
    for (const c of this.chunks) {
      if (!c) continue;
      if (c.dense) b += c.dense.byteLength;
      else if (c.packed) b += c.packed.byteSize;
      b += 48;
    }
    return b;
  }
}

/** the 27 chunks around (and including) the one being padded; null with `nbFill` its value when uniform or outside */
const scratchNeighbours: (Chunk | null)[] = new Array(27).fill(null);
const nbFill = new Int16Array(27);
