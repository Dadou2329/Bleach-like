// Rapier world with lazily created voxel colliders for world chunks.
//
// Chunk colliders contain only a 2-voxel "skin" (solid voxels within 2 of air): buried voxels never
// touch anything, and skins are ~10× cheaper to build than full chunks. Colliders exist only near
// dynamic bodies and are freed when unused.
import RAPIER from '@dimforge/rapier3d-compat';
import { CS, CS_BITS, CS_MASK, vidx } from '../voxel/chunk';
import { F_LIQUID, F_SOLID } from '../voxel/materials';
import type { VoxelWorld } from '../voxel/world';

export { RAPIER };

interface ChunkCollider {
  body: RAPIER.RigidBody;
  col: RAPIER.Collider | null;
  lastUsed: number;
  /** pending per-voxel edits; if too many we rebuild instead */
  edits: number;
  needsRebuild: boolean;
  /** the voxel collider's domain (chunk-local, inclusive): Rapier cannot grow it, so edits outside rebuild */
  lo: [number, number, number];
  hi: [number, number, number];
}

let rapierReady: Promise<void> | null = null;
export function initRapier(): Promise<void> {
  if (!rapierReady) rapierReady = RAPIER.init();
  return rapierReady;
}

export class Physics {
  readonly rw: RAPIER.World;
  readonly events: RAPIER.EventQueue;
  private colliders = new Map<number, ChunkCollider>();
  private buildQueue: number[] = [];
  private queued = new Set<number>();
  time = 0;
  stats = { chunkColliders: 0, built: 0, buildMs: 0 };
  /**
   * Rapier traps (a WASM "unreachable") on a dead collider handle, and after a trap its world cannot be
   * trusted: we then stop calling into it (debris falls back to plain sprites) rather than crash the game.
   */
  broken = false;

  constructor(readonly world: VoxelWorld) {
    this.rw = new RAPIER.World({ x: 0, y: -18, z: 0 }); // stylised heavier gravity for punchy falls
    this.rw.integrationParameters.numSolverIterations = 4;
    this.events = new RAPIER.EventQueue(true);
  }

  private solid(m: number): boolean {
    const f = this.world.mats.flags[m];
    return (f & F_SOLID) !== 0 && (f & F_LIQUID) === 0;
  }

  /** Request colliders for every chunk overlapping the voxel box (built over the next frames). */
  require(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, urgent = false): void {
    if (this.broken) return;
    const w = this.world;
    const cx0 = Math.max(0, x0 >> CS_BITS), cy0 = Math.max(0, y0 >> CS_BITS), cz0 = Math.max(0, z0 >> CS_BITS);
    const cx1 = Math.min(w.cx - 1, x1 >> CS_BITS), cy1 = Math.min(w.cy - 1, y1 >> CS_BITS), cz1 = Math.min(w.cz - 1, z1 >> CS_BITS);
    for (let cz = cz0; cz <= cz1; cz++)
      for (let cy = cy0; cy <= cy1; cy++)
        for (let cx = cx0; cx <= cx1; cx++) {
          const ci = w.chunkIndex(cx, cy, cz);
          const c = this.colliders.get(ci);
          if (c) {
            c.lastUsed = this.time;
            continue;
          }
          if (!w.chunks[ci]) continue;
          if (urgent) this.build(ci);
          else if (!this.queued.has(ci)) {
            this.queued.add(ci);
            this.buildQueue.push(ci);
          }
        }
  }

  private build(ci: number): void {
    try {
      this.buildChunk(ci);
    } catch (e) {
      this.fail(e);
    }
  }

  /** Stop using Rapier for good (see `broken`). */
  fail(e: unknown): void {
    if (this.broken) return;
    this.broken = true;
    this.colliders.clear();
    this.buildQueue.length = 0;
    this.queued.clear();
    console.warn('physics: Rapier failed, rigid-body debris disabled', e);
  }

  private buildChunk(ci: number): void {
    const t0 = performance.now();
    this.queued.delete(ci);
    const w = this.world;
    const [cx, cy, cz] = w.chunkCoords(ci);
    const bx = cx << CS_BITS, by = cy << CS_BITS, bz = cz << CS_BITS;
    const chunk = w.chunks[ci];
    let entry = this.colliders.get(ci);
    if (entry && !entry.body.isValid()) {
      this.colliders.delete(ci);
      entry = undefined;
    }
    if (!entry) {
      const body = this.rw.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(bx * w.vs, by * w.vs, bz * w.vs));
      entry = { body, col: null, lastUsed: this.time, edits: 0, needsRebuild: false, lo: [0, 0, 0], hi: [-1, -1, -1] };
      this.colliders.set(ci, entry);
    }
    if (entry.col) {
      if (entry.col.isValid()) this.rw.removeCollider(entry.col, false);
      entry.col = null;
    }
    entry.needsRebuild = false;
    entry.edits = 0;
    if (!chunk) return;
    const coords: number[] = [];
    const g = (x: number, y: number, z: number) => this.solid(w.get(x, y, z));
    for (let z = 0; z < CS; z++)
      for (let y = 0; y < CS; y++)
        for (let x = 0; x < CS; x++) {
          const m = chunk.get(vidx(x, y, z));
          if (!this.solid(m)) continue;
          const X = bx + x, Y = by + y, Z = bz + z;
          // skin test: any air within distance 2 along axes
          let skin = false;
          for (let d = 1; d <= 2 && !skin; d++)
            skin = !g(X + d, Y, Z) || !g(X - d, Y, Z) || !g(X, Y + d, Z) || !g(X, Y - d, Z) || !g(X, Y, Z + d) || !g(X, Y, Z - d);
          if (skin) coords.push(x, y, z);
        }
    entry.lo = [CS, CS, CS];
    entry.hi = [-1, -1, -1];
    for (let i = 0; i < coords.length; i += 3)
      for (let k = 0; k < 3; k++) {
        if (coords[i + k] < entry.lo[k]) entry.lo[k] = coords[i + k];
        if (coords[i + k] > entry.hi[k]) entry.hi[k] = coords[i + k];
      }
    if (coords.length > 0) {
      const desc = RAPIER.ColliderDesc.voxels(new Int32Array(coords), { x: w.vs, y: w.vs, z: w.vs })
        .setFriction(0.8)
        .setRestitution(0.05)
        .setCollisionGroups((0x0001 << 16) | 0xffff);
      entry.col = this.rw.createCollider(desc, entry.body);
    }
    this.stats.built++;
    this.stats.buildMs += performance.now() - t0;
  }

  /** Voxel edit hook: keep colliders in sync (removed voxel off, newly exposed neighbours on). */
  onVoxelEdit(x: number, y: number, z: number, oldV: number, newV: number): void {
    if (this.broken) return;
    const w = this.world;
    const ci = (x >> CS_BITS) + w.cx * ((y >> CS_BITS) + w.cy * (z >> CS_BITS));
    const e = this.colliders.get(ci);
    if (!e) return;
    if (e.needsRebuild) return;
    // a collider whose body is gone must never be touched (that is the trap): forget it and rebuild
    if (!e.body.isValid() || (e.col && !e.col.isValid())) {
      this.colliders.delete(ci);
      if (!this.queued.has(ci)) {
        this.queued.add(ci);
        this.buildQueue.unshift(ci);
      }
      return;
    }
    try {
      this.applyEdit(ci, e, x, y, z, oldV, newV);
    } catch (err) {
      this.fail(err);
    }
  }

  private applyEdit(ci: number, e: ChunkCollider, x: number, y: number, z: number, oldV: number, newV: number): void {
    const w = this.world;
    if (++e.edits > 1200 || !e.col) {
      e.needsRebuild = true;
      if (!this.queued.has(ci)) {
        this.queued.add(ci);
        this.buildQueue.unshift(ci);
      }
      return;
    }
    const nowSolid = this.solid(newV);
    if (nowSolid === this.solid(oldV)) return;
    // Rapier's voxel shape cannot grow past the domain it was built with (it traps): anything outside
    // it — a deep crater exposing buried voxels, new solid placed in the air — rebuilds the chunk
    const inside = (lx: number, ly: number, lz: number) => lx >= e.lo[0] && ly >= e.lo[1] && lz >= e.lo[2] && lx <= e.hi[0] && ly <= e.hi[1] && lz <= e.hi[2];
    const rebuild = () => {
      e.needsRebuild = true;
      if (!this.queued.has(ci)) {
        this.queued.add(ci);
        this.buildQueue.unshift(ci);
      }
    };
    const lx = x & CS_MASK, ly = y & CS_MASK, lz = z & CS_MASK;
    if (!inside(lx, ly, lz)) {
      if (nowSolid) rebuild();
      return;
    }
    e.col.setVoxel(lx, ly, lz, nowSolid);
    if (!nowSolid) {
      // expose neighbours inside the same chunk (other chunks handle their own edges lazily)
      for (let n = 0; n < 6; n++) {
        let nx = x, ny = y, nz = z;
        if (n === 0) nx--; else if (n === 1) nx++; else if (n === 2) ny--; else if (n === 3) ny++; else if (n === 4) nz--; else nz++;
        if (nx >> CS_BITS !== x >> CS_BITS || ny >> CS_BITS !== y >> CS_BITS || nz >> CS_BITS !== z >> CS_BITS) continue;
        if (!this.solid(w.get(nx, ny, nz))) continue;
        if (!inside(nx & CS_MASK, ny & CS_MASK, nz & CS_MASK)) {
          rebuild();
          return;
        }
        e.col.setVoxel(nx & CS_MASK, ny & CS_MASK, nz & CS_MASK, true);
      }
    }
  }

  step(dt: number, buildBudgetMs = 3): void {
    this.time += dt;
    if (this.broken) return;
    try {
      this.stepWorld(dt, buildBudgetMs);
    } catch (e) {
      this.fail(e);
    }
  }

  private stepWorld(dt: number, buildBudgetMs: number): void {
    const t0 = performance.now();
    while (this.buildQueue.length > 0 && performance.now() - t0 < buildBudgetMs) this.build(this.buildQueue.shift()!);
    this.rw.timestep = Math.min(dt, 1 / 30);
    this.rw.step(this.events);
    // free colliders not needed for a while
    if (Math.floor(this.time) !== Math.floor(this.time - dt)) {
      for (const [ci, e] of this.colliders) {
        if (this.time - e.lastUsed > 6 && !this.queued.has(ci)) {
          if (e.body.isValid()) this.rw.removeRigidBody(e.body);
          this.colliders.delete(ci);
        }
      }
    }
    this.stats.chunkColliders = this.colliders.size;
  }
}
