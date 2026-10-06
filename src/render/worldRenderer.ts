import * as THREE from 'three';
import { CS } from '../voxel/chunk';
import type { MeshBuffers, MeshResult } from '../voxel/mesher';
import { MeshPool } from '../voxel/meshPool';
import { F_LIQUID, F_SOLID, F_TRANSPARENT } from '../voxel/materials';
import type { VoxelWorld } from '../voxel/world';

interface Slot {
  geo: number;
  inst: number;
}

interface ChunkSlots {
  opaque: Slot;
  trans: Slot;
}

const PAD = CS + 2;
const PAD3 = PAD * PAD * PAD;

/**
 * Renders a VoxelWorld with two BatchedMeshes (opaque + transparent). Dirty chunks are re-meshed in
 * the worker pool (closest to the camera first) and swapped into reserved geometry slots.
 */
export class WorldRenderer {
  readonly group = new THREE.Group();
  readonly opaque: THREE.BatchedMesh;
  readonly trans: THREE.BatchedMesh;
  private slots = new Map<number, ChunkSlots>();
  /** chunk index → version currently being meshed */
  private inflight = new Map<number, number>();
  /** completed results waiting to be uploaded */
  private ready: { ci: number; version: number; res: MeshResult }[] = [];
  private tmpMat = new THREE.Matrix4();
  private tmpGeo = new THREE.BufferGeometry();
  stats = { chunksMeshed: 0, opaqueVerts: 0, uploadsLastFrame: 0 };

  constructor(
    readonly world: VoxelWorld,
    readonly pool: MeshPool,
    opaqueMat: THREE.Material,
    transMat: THREE.Material,
    maxInstances = 24000,
  ) {
    this.opaque = new THREE.BatchedMesh(maxInstances, 1 << 20, (1 << 20) * 1.5, opaqueMat);
    this.trans = new THREE.BatchedMesh(Math.max(1024, maxInstances >> 2), 1 << 17, (1 << 17) * 1.5, transMat);
    for (const b of [this.opaque, this.trans]) {
      b.perObjectFrustumCulled = true;
      b.frustumCulled = false;
      b.receiveShadow = true;
    }
    this.opaque.castShadow = true;
    this.opaque.sortObjects = false;
    this.trans.sortObjects = true;
    this.trans.renderOrder = 2;
    this.group.add(this.opaque, this.trans);
  }

  /** Queue every non-empty chunk (initial build). */
  markAllDirty(): void {
    for (let i = 0; i < this.world.chunks.length; i++) if (this.world.chunks[i]) this.world.dirty.add(i);
  }

  get pending(): number {
    return this.world.dirty.size + this.inflight.size + this.ready.length;
  }

  /**
   * Submit dirty chunks to workers (nearest first) and upload finished meshes.
   * @param maxSubmit max jobs to start this frame
   * @param maxUploads max finished chunks to upload this frame
   */
  update(camPos: THREE.Vector3, maxSubmit = 24, maxUploads = 24): void {
    const w = this.world;
    // ---- submit
    if (w.dirty.size > 0) {
      const vs = w.vs, half = (CS * vs) / 2;
      const list: { ci: number; d: number }[] = [];
      for (const ci of w.dirty) {
        if (this.inflight.has(ci)) continue; // will be re-queued when the in-flight job lands (version check)
        const [cx, cy, cz] = w.chunkCoords(ci);
        const dx = cx * CS * vs + half - camPos.x, dy = cy * CS * vs + half - camPos.y, dz = cz * CS * vs + half - camPos.z;
        list.push({ ci, d: dx * dx + dy * dy * 4 + dz * dz });
      }
      if (list.length > maxSubmit) list.sort((a, b) => a.d - b.d);
      let submitted = 0;
      for (const { ci } of list) {
        if (submitted >= maxSubmit) break;
        w.dirty.delete(ci);
        const chunk = w.chunks[ci];
        if (!chunk || chunk.isEmptyUniform || this.isBuried(ci)) {
          this.ready.push({ ci, version: chunk ? chunk.version : -1, res: { opaque: null, transparent: null } });
          continue;
        }
        const [cx, cy, cz] = w.chunkCoords(ci);
        const vol = this.pool.borrowVolume(PAD3);
        w.copyPadded(cx, cy, cz, vol);
        const version = chunk.version;
        this.inflight.set(ci, version);
        this.pool.submit(vol, CS, CS, CS, (res) => {
          this.inflight.delete(ci);
          this.ready.push({ ci, version, res });
        });
        submitted++;
      }
    }
    // ---- upload
    let uploads = 0;
    while (this.ready.length > 0 && uploads < maxUploads) {
      const r = this.ready.shift()!;
      this.apply(r.ci, r.res);
      uploads++;
    }
    this.stats.uploadsLastFrame = uploads;
  }

  /** A uniform opaque chunk fully enclosed by uniform opaque neighbours has no visible faces. */
  private isBuried(ci: number): boolean {
    const w = this.world;
    const c = w.chunks[ci];
    if (!c || !c.isUniform || !isOpaqueId(w, c.uniform)) return false;
    const [cx, cy, cz] = w.chunkCoords(ci);
    const nb: [number, number, number][] = [[cx - 1, cy, cz], [cx + 1, cy, cz], [cx, cy - 1, cz], [cx, cy + 1, cz], [cx, cy, cz - 1], [cx, cy, cz + 1]];
    for (const [x, y, z] of nb) {
      if (y < 0) continue; // below the map is bedrock
      if (x < 0 || z < 0 || x >= w.cx || z >= w.cz || y >= w.cy) return false;
      const n = w.chunks[w.chunkIndex(x, y, z)];
      if (!n || !n.isUniform || !isOpaqueId(w, n.uniform)) return false;
    }
    return true;
  }

  private apply(ci: number, res: MeshResult): void {
    let s = this.slots.get(ci);
    if (!s) {
      s = { opaque: { geo: -1, inst: -1 }, trans: { geo: -1, inst: -1 } };
      this.slots.set(ci, s);
    }
    const [cx, cy, cz] = this.world.chunkCoords(ci);
    const vs = this.world.vs;
    this.tmpMat.makeScale(vs, vs, vs).setPosition(cx * CS * vs, cy * CS * vs, cz * CS * vs);
    this.applyStream(this.opaque, s.opaque, res.opaque);
    this.applyStream(this.trans, s.trans, res.transparent);
    if (s.opaque.geo < 0 && s.trans.geo < 0) this.slots.delete(ci);
    this.stats.chunksMeshed++;
  }

  private applyStream(batch: THREE.BatchedMesh, slot: Slot, buf: MeshBuffers | null): void {
    if (!buf) {
      if (slot.geo >= 0) {
        batch.deleteGeometry(slot.geo);
        slot.geo = slot.inst = -1;
      }
      return;
    }
    const g = this.fillGeometry(buf);
    if (slot.geo >= 0) {
      const range = batch.getGeometryRangeAt(slot.geo)!;
      if (buf.vertexCount <= range.reservedVertexCount && buf.indexCount <= range.reservedIndexCount) {
        batch.setGeometryAt(slot.geo, g);
        return;
      }
      batch.deleteGeometry(slot.geo);
      slot.geo = slot.inst = -1;
    }
    const rv = Math.ceil(buf.vertexCount * 1.3) + 64;
    const ri = Math.ceil(buf.indexCount * 1.3) + 96;
    this.ensureCapacity(batch, rv, ri);
    slot.geo = batch.addGeometry(g, rv, ri);
    slot.inst = batch.addInstance(slot.geo);
    batch.setMatrixAt(slot.inst, this.tmpMat);
  }

  private ensureCapacity(batch: THREE.BatchedMesh, rv: number, ri: number): void {
    if (batch.unusedVertexCount >= rv && batch.unusedIndexCount >= ri) return;
    batch.optimize();
    if (batch.unusedVertexCount >= rv && batch.unusedIndexCount >= ri) return;
    const info = batch as unknown as { _maxVertexCount: number; _maxIndexCount: number };
    const nv = Math.ceil(Math.max(info._maxVertexCount * 1.5, info._maxVertexCount + rv * 4));
    const ni = Math.ceil(Math.max(info._maxIndexCount * 1.5, info._maxIndexCount + ri * 4));
    batch.setGeometrySize(nv, ni);
  }

  private fillGeometry(buf: MeshBuffers): THREE.BufferGeometry {
    // a fresh lightweight geometry wrapper per upload (BatchedMesh copies the data)
    const g = this.tmpGeo;
    g.setAttribute('position', new THREE.BufferAttribute(buf.positions, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(buf.normals, 3, true));
    g.setAttribute('aVox', new THREE.BufferAttribute(buf.vox, 2));
    g.setIndex(new THREE.BufferAttribute(buf.indices, 1));
    // chunk-local bounds (voxel units, before the instance matrix)
    if (!g.boundingBox) g.boundingBox = new THREE.Box3();
    if (!g.boundingSphere) g.boundingSphere = new THREE.Sphere();
    computeBounds(buf.positions, buf.vertexCount, g.boundingBox);
    g.boundingBox.getBoundingSphere(g.boundingSphere);
    return g;
  }

  dispose(): void {
    this.opaque.dispose();
    this.trans.dispose();
  }
}

function isOpaqueId(w: VoxelWorld, id: number): boolean {
  const f = w.mats.flags[id];
  return (f & F_SOLID) !== 0 && (f & (F_TRANSPARENT | F_LIQUID)) === 0;
}

function computeBounds(pos: Uint16Array, n: number, box: THREE.Box3): void {
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
  for (let i = 0; i < n * 3; i += 3) {
    const x = pos[i], y = pos[i + 1], z = pos[i + 2];
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
    if (z < z0) z0 = z; if (z > z1) z1 = z;
  }
  box.min.set(x0, y0, z0);
  box.max.set(x1, y1, z1);
}
