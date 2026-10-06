// Voxel model DSL. Models are authored code-first in *voxel units* of the model resolution
// (characters: 48 voxels per metre). Shapes (SDFs from ./sdf) are rasterised into one sparse grid per
// bone, so parts may overlap (ball joints: the parent owns the whole joint sphere, the child a sphere one
// voxel smaller, and rotations never open gaps). After the shapes, an auto-shade pass picks ramp shades
// from the local surface normal and openness of the union (lit tops, shaded undersides, dark creases,
// light convex edges) — painted pixel-art shading that stays consistent under real lighting.
//
// Conventions: +Y up, the model faces +Z, +X is the character's LEFT. Voxel (i,j,k) has its centre at
// (i+.5, j+.5, k+.5). The model origin is on the ground between the feet; the mirror plane is x = 0.
import type { Sdf, V3 } from './sdf';
import { SparseGrid } from './sparseGrid';
import { hash3 } from '../core/math';

export const LOCK = 0x100; // voxel flag: explicit colour, skip auto-shade

export interface PaletteEntry {
  color: string;
  rough: number;
  metal: number;
  glow: number;
}

export interface MatDef {
  name: string;
  colors: string[];
  /** palette index of colors[0] */
  first: number;
  /** ramp index of the main tone (ramps are ordered light → dark) */
  base: number;
  /** auto-shade strength (0 = flat) */
  shadeK: number;
  /** auto-shade dither amplitude */
  dither: number;
}

export interface MatOpts {
  base?: number;
  rough?: number;
  metal?: number;
  /** emissive strength (HDR multiplier, 0 = none) */
  glow?: number;
  shadeK?: number;
  dither?: number;
}

export interface BoneDef {
  name: string;
  parent: number;
  /** pivot in model voxel units */
  pivot: V3;
}

export interface SocketDef {
  bone: number;
  pos: V3;
  /** XYZ Euler degrees */
  rot: V3;
}

export interface VoxelModel {
  name: string;
  res: number;
  palette: PaletteEntry[];
  bones: BoneDef[];
  grids: SparseGrid[];
  sockets: Record<string, SocketDef>;
}

export type Shade = 'auto' | 'flat' | number;

export interface OpOpts {
  /** 'auto' (default for ramps) | 'flat' (base, locked) | explicit ramp index (locked) */
  shade?: Shade;
  /** also apply the mirrored op (x → −x) to the mirrored bone (.L ↔ .R) */
  mirror?: boolean;
  /** inclusion threshold in voxels (0.5 = thin-feature protection) */
  thr?: number;
  /** add only into empty cells / paint only filled cells (paint always does) */
  only?: 'empty';
}

export interface StampEntry {
  mat: string;
  shade?: number;
  /** extra voxels added in front of the surface (brows, scars) */
  proud?: number;
  /** recess: remove this many voxels from the front first */
  sink?: number;
}

export function mirrorName(n: string): string {
  if (n.endsWith('.L')) return n.slice(0, -2) + '.R';
  if (n.endsWith('.R')) return n.slice(0, -2) + '.L';
  return n;
}

export class ModelBuilder {
  readonly palette: PaletteEntry[] = [{ color: '#ff00ff', rough: 1, metal: 0, glow: 0 }];
  readonly mats = new Map<string, MatDef>();
  /** palette index → material / ramp index */
  private palMat: MatDef[] = [];
  private palShade: number[] = [];
  readonly bones: BoneDef[] = [];
  readonly grids: SparseGrid[] = [];
  private boneIdx = new Map<string, number>();
  readonly sockets: Record<string, SocketDef> = {};
  warnings: string[] = [];

  constructor(readonly name: string, readonly res = 48) {}

  // ------------------------------------------------------------------ palette

  mat(name: string, colors: string[], o: MatOpts = {}): this {
    if (this.mats.has(name)) throw new Error(`material ${name} redefined`);
    const first = this.palette.length;
    if (first + colors.length > 256) throw new Error(`palette overflow at ${name}`);
    const def: MatDef = {
      name,
      colors,
      first,
      base: o.base ?? Math.floor((colors.length - 1) / 2),
      shadeK: o.shadeK ?? 1,
      dither: o.dither ?? 0.12,
    };
    colors.forEach((c, i) => {
      this.palette.push({ color: c, rough: o.rough ?? 0.85, metal: o.metal ?? 0, glow: o.glow ?? 0 });
      this.palMat[first + i] = def;
      this.palShade[first + i] = i;
    });
    this.mats.set(name, def);
    return this;
  }

  private matDef(name: string): MatDef {
    const m = this.mats.get(name);
    if (!m) throw new Error(`unknown material ${name} in model ${this.name}`);
    return m;
  }

  /** Grid value for a material + shade (for custom voxel ops). */
  val(mat: string, shade: Shade = 'auto'): number {
    return this.value(mat, shade);
  }

  /** Material / ramp index of a grid value. */
  matOf(v: number): { mat: MatDef | undefined; shade: number } {
    return { mat: this.palMat[v & 0xff], shade: this.palShade[v & 0xff] };
  }

  /**
   * Visit voxels of the given bones that lie on the surface of the union of ALL bones, inside a box.
   * The callback gets the outward axis (an empty 6-neighbour direction, preferring ±Z then ±X then ±Y).
   */
  surfaceVoxels(bones: string[], min: V3, max: V3, cb: (bone: string, x: number, y: number, z: number, nx: number, ny: number, nz: number) => void): void {
    const filled = (x: number, y: number, z: number) => {
      for (const g of this.grids) if (g.get(x, y, z) !== 0) return true;
      return false;
    };
    const dirs = [[0, 0, 1], [0, 0, -1], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0]];
    const hits: [string, number, number, number, number, number, number][] = [];
    for (const bone of bones) {
      const g = this.grid(bone);
      for (let z = Math.floor(min[2]); z <= Math.ceil(max[2]); z++)
        for (let y = Math.floor(min[1]); y <= Math.ceil(max[1]); y++)
          for (let x = Math.floor(min[0]); x <= Math.ceil(max[0]); x++) {
            if (g.get(x, y, z) === 0) continue;
            for (const [dx, dy, dz] of dirs)
              if (!filled(x + dx, y + dy, z + dz)) {
                hits.push([bone, x, y, z, dx, dy, dz]);
                break;
              }
          }
    }
    for (const h of hits) cb(...h);
  }

  private value(mat: string, shade: Shade = 'auto'): number {
    const m = this.matDef(mat);
    if (shade === 'auto') return m.first + m.base;
    if (shade === 'flat') return (m.first + m.base) | LOCK;
    const s = Math.max(0, Math.min(m.colors.length - 1, shade));
    return (m.first + s) | LOCK;
  }

  // ------------------------------------------------------------------ skeleton

  bone(name: string, parent: string | null, pivot: V3): this {
    if (this.boneIdx.has(name)) throw new Error(`bone ${name} redefined`);
    const p = parent === null ? -1 : this.boneIndex(parent);
    this.boneIdx.set(name, this.bones.length);
    this.bones.push({ name, parent: p, pivot });
    this.grids.push(new SparseGrid());
    return this;
  }

  /** Define a .L bone and its mirrored .R twin (parents mirrored too). */
  boneSym(nameL: string, parentL: string | null, pivotL: V3): this {
    this.bone(nameL, parentL, pivotL);
    this.bone(mirrorName(nameL), parentL === null ? null : mirrorName(parentL), [-pivotL[0], pivotL[1], pivotL[2]]);
    return this;
  }

  boneIndex(name: string): number {
    const i = this.boneIdx.get(name);
    if (i === undefined) throw new Error(`unknown bone ${name} in model ${this.name}`);
    return i;
  }

  hasBone(name: string): boolean {
    return this.boneIdx.has(name);
  }

  pivot(name: string): V3 {
    return this.bones[this.boneIndex(name)].pivot;
  }

  socket(name: string, bone: string, pos: V3, rot: V3 = [0, 0, 0]): this {
    this.sockets[name] = { bone: this.boneIndex(bone), pos, rot };
    return this;
  }

  grid(bone: string): SparseGrid {
    return this.grids[this.boneIndex(bone)];
  }

  // ------------------------------------------------------------------ rasterisation

  private raster(s: Sdf, thr: number, mirror: boolean, cb: (x: number, y: number, z: number) => void): void {
    const x0 = Math.floor(s.min[0] - 1), x1 = Math.ceil(s.max[0] + 1);
    const y0 = Math.floor(s.min[1] - 1), y1 = Math.ceil(s.max[1] + 1);
    const z0 = Math.floor(s.min[2] - 1), z1 = Math.ceil(s.max[2] + 1);
    if (x1 - x0 > 4000 || y1 - y0 > 4000 || z1 - z0 > 4000) throw new Error('unbounded shape rasterised');
    for (let z = z0; z <= z1; z++)
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          if (s.d(x + 0.5, y + 0.5, z + 0.5) <= thr) cb(mirror ? -1 - x : x, y, z);
        }
  }

  private targets(bone: string | string[]): number[] {
    if (bone === '*') return this.bones.map((_, i) => i);
    return (Array.isArray(bone) ? bone : [bone]).map((b) => this.boneIndex(b));
  }

  /** Union a shape into a bone with a material. */
  add(bone: string, s: Sdf, mat: string, o: OpOpts = {}): this {
    const v = this.value(mat, o.shade);
    const pass = (bi: number, mirror: boolean) => {
      const g = this.grids[bi];
      this.raster(s, o.thr ?? 0, mirror, (x, y, z) => {
        if (o.only === 'empty' && g.get(x, y, z) !== 0) return;
        g.set(x, y, z, v);
      });
    };
    pass(this.boneIndex(bone), false);
    if (o.mirror) pass(this.boneIndex(mirrorName(bone)), true);
    return this;
  }

  /** Remove a shape from one bone, several, or '*' (all). */
  carve(bone: string | string[], s: Sdf, o: Pick<OpOpts, 'mirror' | 'thr'> = {}): this {
    for (const bi of this.targets(bone)) {
      const g = this.grids[bi];
      this.raster(s, o.thr ?? 0, false, (x, y, z) => g.set(x, y, z, 0));
      if (o.mirror) {
        const mb = this.grids[this.boneIndex(mirrorName(this.bones[bi].name))];
        this.raster(s, o.thr ?? 0, true, (x, y, z) => mb.set(x, y, z, 0));
      }
    }
    return this;
  }

  /** Recolour existing voxels inside a shape. */
  paint(bone: string | string[], s: Sdf, mat: string, o: Omit<OpOpts, 'only'> & { where?: (v: number) => boolean } = {}): this {
    const v = this.value(mat, o.shade);
    for (const bi of this.targets(bone)) {
      const pass = (g: SparseGrid, mirror: boolean) =>
        this.raster(s, o.thr ?? 0, mirror, (x, y, z) => {
          const cur = g.get(x, y, z);
          if (cur === 0) return;
          if (o.where && !o.where(cur)) return;
          g.set(x, y, z, v);
        });
      pass(this.grids[bi], false);
      if (o.mirror) pass(this.grids[this.boneIndex(mirrorName(this.bones[bi].name))], true);
    }
    return this;
  }

  /** Predicate helper for paint({ where }): only voxels currently of one of these materials. */
  isMat(...names: string[]): (v: number) => boolean {
    const defs = new Set(names.map((n) => this.matDef(n)));
    return (v) => defs.has(this.palMat[v & 0xff]);
  }

  /** Set one voxel. */
  voxel(bone: string, x: number, y: number, z: number, mat: string, shade: Shade = 'flat'): this {
    this.grid(bone).set(x, y, z, this.value(mat, shade));
    return this;
  }

  /** Fill an integer voxel box [x0..x1]×[y0..y1]×[z0..z1] (inclusive). */
  fill(bone: string, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, mat: string, shade: Shade = 'auto'): this {
    const g = this.grid(bone);
    const v = this.value(mat, shade);
    for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++)
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
        for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) g.set(x, y, z, v);
    return this;
  }

  /**
   * Stamp pixel art onto the front (+Z) surface of a bone. rows[0] is the TOP row; column 0 is at x0
   * (the character's right side when the art is read as a viewer facing the model). Characters not in
   * the legend (and '.' / ' ') are skipped.
   */
  stamp(bone: string, x0: number, yTop: number, rows: string[], legend: Record<string, string | StampEntry>, zMax = 64, zMin = -64): this {
    const g = this.grid(bone);
    rows.forEach((row, r) => {
      const y = yTop - r;
      const cells = row.includes(' ') ? row.split(/\s+/).filter((s) => s.length > 0) : row.split('');
      cells.forEach((ch, c) => {
        const e = legend[ch];
        if (!e) return;
        const ent: StampEntry = typeof e === 'string' ? { mat: e } : e;
        const x = x0 + c;
        let z = zMax;
        while (z >= zMin && g.get(x, y, z) === 0) z--;
        if (z < zMin) return;
        for (let k = 0; k < (ent.sink ?? 0); k++) g.set(x, y, z - k, 0);
        z -= ent.sink ?? 0;
        const v = this.value(ent.mat, ent.shade ?? 'flat');
        g.set(x, y, z, v);
        for (let k = 1; k <= (ent.proud ?? 0); k++) g.set(x, y, z + k, v);
      });
    });
    return this;
  }

  /** Copy all voxels of one bone grid into another, transformed by fn (e.g. to build variants). */
  copyBone(from: string, to: string, map?: (x: number, y: number, z: number) => V3 | null): this {
    const src = this.grid(from), dst = this.grid(to);
    src.forEach((x, y, z, v) => {
      const p = map ? map(x, y, z) : [x, y, z];
      if (p) dst.set(p[0], p[1], p[2], v);
    });
    return this;
  }

  // ------------------------------------------------------------------ finishing passes

  /** Union occupancy as a dense grid (with padding) for shading / AO. */
  occupancy(pad = 4): { data: Uint8Array; min: [number, number, number]; dims: [number, number, number] } {
    const mn: [number, number, number] = [Infinity, Infinity, Infinity];
    const mx: [number, number, number] = [-Infinity, -Infinity, -Infinity];
    for (const g of this.grids) {
      const b = g.bounds();
      if (!b) continue;
      for (let k = 0; k < 3; k++) {
        mn[k] = Math.min(mn[k], b.min[k]);
        mx[k] = Math.max(mx[k], b.max[k]);
      }
    }
    if (mn[0] === Infinity) return { data: new Uint8Array(1), min: [0, 0, 0], dims: [1, 1, 1] };
    for (let k = 0; k < 3; k++) { mn[k] -= pad; mx[k] += pad; }
    const dims: [number, number, number] = [mx[0] - mn[0] + 1, mx[1] - mn[1] + 1, mx[2] - mn[2] + 1];
    const data = new Uint8Array(dims[0] * dims[1] * dims[2]);
    for (const g of this.grids)
      g.forEach((x, y, z) => {
        data[x - mn[0] + dims[0] * (y - mn[1] + dims[1] * (z - mn[2]))] = 1;
      });
    return { data, min: mn, dims };
  }

  /**
   * Pick ramp shades for all unlocked voxels from the union's local surface normal (up = lighter)
   * and openness (convex edges lighter, creases darker).
   */
  autoShade(o: { up?: number; open?: number; front?: number } = {}): this {
    const kUp = o.up ?? 0.85, kOpen = o.open ?? 3.2, kFront = o.front ?? 0.15;
    const occ = this.occupancy(4);
    const [W, H] = occ.dims;
    const D = occ.dims[2];
    const at = (x: number, y: number, z: number) => {
      const ix = x - occ.min[0], iy = y - occ.min[1], iz = z - occ.min[2];
      if (ix < 0 || iy < 0 || iz < 0 || ix >= W || iy >= H || iz >= D) return 0;
      return occ.data[ix + W * (iy + H * iz)];
    };
    // precomputed kernels
    const nrmK: number[] = [];
    for (let dz = -2; dz <= 2; dz++) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (dx || dy || dz) nrmK.push(dx, dy, dz);
    const openK: number[] = [];
    for (let dz = -3; dz <= 3; dz++) for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if ((dx || dy || dz) && dx * dx + dy * dy + dz * dz <= 9) openK.push(dx, dy, dz);
    const openN = openK.length / 3;
    for (const g of this.grids) {
      const updates: number[] = [];
      g.forEach((x, y, z, v) => {
        if (v & LOCK) return;
        const m = this.palMat[v & 0xff];
        if (!m || m.colors.length < 2 || m.shadeK === 0) return;
        const surface = !at(x + 1, y, z) || !at(x - 1, y, z) || !at(x, y + 1, z) || !at(x, y - 1, z) || !at(x, y, z + 1) || !at(x, y, z - 1);
        let idx = m.base;
        if (surface) {
          let nx = 0, ny = 0, nz = 0;
          for (let i = 0; i < nrmK.length; i += 3) {
            if (!at(x + nrmK[i], y + nrmK[i + 1], z + nrmK[i + 2])) {
              nx += nrmK[i]; ny += nrmK[i + 1]; nz += nrmK[i + 2];
            }
          }
          const nl = Math.hypot(nx, ny, nz) || 1;
          nx /= nl; ny /= nl; nz /= nl;
          let empty = 0;
          for (let i = 0; i < openK.length; i += 3) if (!at(x + openK[i], y + openK[i + 1], z + openK[i + 2])) empty++;
          const open = empty / openN;
          const dither = (hash3(x, y, z) - 0.5) * 2 * m.dither;
          const light = kUp * ny + kOpen * (open - 0.4) + kFront * nz + dither;
          idx = m.base - Math.round(light * m.shadeK);
        }
        idx = Math.max(0, Math.min(m.colors.length - 1, idx));
        updates.push(x, y, z, m.first + idx);
      });
      for (let i = 0; i < updates.length; i += 4) g.set(updates[i], updates[i + 1], updates[i + 2], updates[i + 3]);
    }
    return this;
  }

  /** Remove tiny disconnected bits per bone and report larger floating islands. */
  lint(minKeep = 4): this {
    this.grids.forEach((g, bi) => {
      const seen = new Set<string>();
      const comps: [number, number, number][][] = [];
      g.forEach((x, y, z) => {
        const k0 = `${x},${y},${z}`;
        if (seen.has(k0)) return;
        const comp: [number, number, number][] = [];
        const stack: [number, number, number][] = [[x, y, z]];
        seen.add(k0);
        while (stack.length) {
          const p = stack.pop()!;
          comp.push(p);
          for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
            const q: [number, number, number] = [p[0] + dx, p[1] + dy, p[2] + dz];
            const k = `${q[0]},${q[1]},${q[2]}`;
            if (!seen.has(k) && g.get(q[0], q[1], q[2]) !== 0) {
              seen.add(k);
              stack.push(q);
            }
          }
        }
        comps.push(comp);
      });
      if (comps.length <= 1) return;
      comps.sort((a, b) => b.length - a.length);
      for (let i = 1; i < comps.length; i++) {
        const c = comps[i];
        if (c.length < minKeep) for (const p of c) g.set(p[0], p[1], p[2], 0);
        else this.warnings.push(`${this.name}/${this.bones[bi].name}: floating island of ${c.length} voxels at ${c[0].join(',')}`);
      }
    });
    return this;
  }

  build(): VoxelModel {
    return {
      name: this.name,
      res: this.res,
      palette: this.palette,
      bones: this.bones,
      grids: this.grids,
      sockets: this.sockets,
    };
  }

  /** Total voxel count (diagnostics). */
  count(): number {
    return this.grids.reduce((n, g) => n + g.count(), 0);
  }
}
