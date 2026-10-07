// Ring buffer of voxel edits for restoration (Orihime's Sōten Kisshun, map rewinds, training resets).
import type { VoxelWorld } from '../voxel/world';

export class EditLog {
  private x: Int32Array;
  private y: Int32Array;
  private z: Int32Array;
  private oldV: Uint8Array;
  private newV: Uint8Array;
  private t: Float32Array;
  private head = 0;
  private size = 0;
  enabled = true;

  constructor(private world: VoxelWorld, readonly capacity = 1 << 20) {
    this.x = new Int32Array(capacity);
    this.y = new Int32Array(capacity);
    this.z = new Int32Array(capacity);
    this.oldV = new Uint8Array(capacity);
    this.newV = new Uint8Array(capacity);
    this.t = new Float32Array(capacity);
  }

  record(x: number, y: number, z: number, oldV: number, newV: number): void {
    if (!this.enabled) return;
    const i = this.head;
    this.x[i] = x; this.y[i] = y; this.z[i] = z;
    this.oldV[i] = oldV; this.newV[i] = newV;
    this.t[i] = this.world.time;
    this.head = (i + 1) % this.capacity;
    if (this.size < this.capacity) this.size++;
  }

  /**
   * The live edits inside a sphere (voxel units) made after `since`, newest first, as log indices: a
   * restoration played out over time reverts them one by one with revert() (keep the order per voxel).
   */
  collect(cx: number, cy: number, cz: number, radius: number, since = -Infinity, max = 250000): number[] {
    const out: number[] = [];
    const r2 = radius * radius;
    for (let n = 0; n < this.size && out.length < max; n++) {
      const i = (this.head - 1 - n + this.capacity) % this.capacity;
      if (this.t[i] < since) break;
      if (this.newV[i] === this.oldV[i]) continue; // undone already
      const dx = this.x[i] - cx, dy = this.y[i] - cy, dz = this.z[i] - cz;
      if (dx * dx + dy * dy + dz * dz > r2) continue;
      out.push(i);
    }
    return out;
  }

  /** where a logged edit happened (voxel coordinates) and what was there before it */
  entry(i: number): { x: number; y: number; z: number; was: number; now: number } {
    return { x: this.x[i], y: this.y[i], z: this.z[i], was: this.oldV[i], now: this.newV[i] };
  }

  /**
   * Undo one logged edit, if the voxel still holds what the edit wrote (else it was overwritten since and
   * stays). Returns the material put back (0 = cleared), or -1 when nothing changed.
   */
  revert(i: number): number {
    const x = this.x[i], y = this.y[i], z = this.z[i];
    if (this.newV[i] === this.oldV[i] || this.world.get(x, y, z) !== this.newV[i]) return -1;
    const prev = this.enabled;
    this.enabled = false;
    this.world.set(x, y, z, this.oldV[i]);
    this.enabled = prev;
    this.newV[i] = this.oldV[i];
    return this.oldV[i];
  }

  /**
   * Revert edits inside a sphere (voxel units) made after `since` (seconds), newest first.
   * Returns the restored voxel positions + materials (for "flying back" VFX).
   */
  restore(cx: number, cy: number, cz: number, radius: number, since = -Infinity, max = 60000): { x: number; y: number; z: number; m: number }[] {
    const out: { x: number; y: number; z: number; m: number }[] = [];
    const r2 = radius * radius;
    const prevEnabled = this.enabled;
    this.enabled = false;
    for (let n = 0; n < this.size && out.length < max; n++) {
      const i = (this.head - 1 - n + this.capacity) % this.capacity;
      if (this.t[i] < since) break;
      const dx = this.x[i] - cx, dy = this.y[i] - cy, dz = this.z[i] - cz;
      if (dx * dx + dy * dy + dz * dz > r2) continue;
      const cur = this.world.get(this.x[i], this.y[i], this.z[i]);
      if (cur !== this.newV[i]) continue; // overwritten since; skip
      this.world.set(this.x[i], this.y[i], this.z[i], this.oldV[i]);
      this.newV[i] = this.oldV[i];
      if (this.oldV[i] !== 0) out.push({ x: this.x[i], y: this.y[i], z: this.z[i], m: this.oldV[i] });
    }
    this.enabled = prevEnabled;
    return out;
  }
}
