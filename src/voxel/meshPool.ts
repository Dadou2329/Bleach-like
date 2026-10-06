import type { MeshResult } from './mesher';
import { greedyMesh } from './mesher';

type Callback = (res: MeshResult) => void;

interface Pending {
  cb: Callback;
}

/**
 * Pool of mesher workers. Jobs carry a padded volume (transferred, then returned for reuse).
 * Falls back to synchronous meshing when workers are unavailable (tests / Node).
 */
export class MeshPool {
  private workers: Worker[] = [];
  private busy: number[] = [];
  private pending = new Map<number, Pending>();
  private nextId = 1;
  private flags: Uint8Array;
  private freeVols: Uint8Array[] = [];
  readonly size: number;

  constructor(flags: Uint8Array, size = Math.max(1, Math.min(6, (navigator.hardwareConcurrency || 4) - 1))) {
    this.flags = flags;
    let n = 0;
    if (typeof Worker !== 'undefined') {
      for (let i = 0; i < size; i++) {
        try {
          const w = new Worker(new URL('./mesher.worker.ts', import.meta.url), { type: 'module' });
          w.onmessage = (e) => this.onMessage(i, e);
          w.postMessage({ type: 'flags', flags });
          this.workers.push(w);
          this.busy.push(0);
          n++;
        } catch {
          break;
        }
      }
    }
    this.size = n;
  }

  /** Number of jobs in flight. */
  get inFlight(): number {
    return this.pending.size;
  }

  /** Borrow a scratch volume of at least `len` bytes. */
  borrowVolume(len: number): Uint8Array {
    for (let i = 0; i < this.freeVols.length; i++) {
      if (this.freeVols[i].length === len) return this.freeVols.splice(i, 1)[0];
    }
    return new Uint8Array(len);
  }

  updateFlags(flags: Uint8Array): void {
    this.flags = flags;
    for (const w of this.workers) w.postMessage({ type: 'flags', flags });
  }

  submit(vol: Uint8Array, w: number, h: number, d: number, cb: Callback): void {
    if (this.workers.length === 0) {
      cb(greedyMesh(vol, w, h, d, this.flags));
      this.freeVols.push(vol);
      return;
    }
    // least busy worker
    let best = 0;
    for (let i = 1; i < this.workers.length; i++) if (this.busy[i] < this.busy[best]) best = i;
    const id = this.nextId++;
    this.pending.set(id, { cb });
    this.busy[best]++;
    this.workers[best].postMessage({ type: 'mesh', id, vol, w, h, d }, [vol.buffer]);
  }

  private onMessage(worker: number, e: MessageEvent): void {
    const msg = e.data;
    if (msg.type !== 'mesh') return;
    this.busy[worker]--;
    const p = this.pending.get(msg.id);
    this.pending.delete(msg.id);
    if (msg.vol) this.freeVols.push(msg.vol as Uint8Array);
    if (p) p.cb(msg.res as MeshResult);
  }

  dispose(): void {
    for (const w of this.workers) w.terminate();
    this.workers = [];
  }
}
