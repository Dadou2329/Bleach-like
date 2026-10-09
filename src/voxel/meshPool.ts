import type { MeshResult } from './mesher';
import { greedyMesh } from './mesher';
import { reportProblem } from '../render/problems';

type Callback = (res: MeshResult) => void;

interface Job {
  cb: Callback;
  vol: Uint8Array;
  w: number;
  h: number;
  d: number;
  /** the worker it went to (-1: the main thread) */
  worker: number;
}

/** a worker that has had jobs for this long without answering one is taken as hung */
const STALL_MS = 20000;

/**
 * Pool of mesher workers. Each job's padded volume is copied to the worker and kept here until its answer comes back,
 * so a worker that fails to load, crashes or hangs costs nothing: its jobs go to another worker, or are meshed on the
 * main thread a few at a time when none is left (as in tests / Node, where there are no workers).
 */
export class MeshPool {
  private workers: (Worker | null)[] = [];
  private busy: number[] = [];
  private lastHeard: number[] = [];
  private pending = new Map<number, Job>();
  private nextId = 1;
  private flags: Uint8Array;
  private freeVols: Uint8Array[] = [];
  /** jobs waiting for the main thread */
  private local: Job[] = [];
  private localTimer: ReturnType<typeof setTimeout> | null = null;
  private watch: ReturnType<typeof setInterval> | null = null;
  readonly size: number;

  constructor(flags: Uint8Array, size = Math.max(1, Math.min(6, (navigator.hardwareConcurrency || 4) - 1))) {
    this.flags = flags;
    let n = 0;
    if (typeof Worker !== 'undefined') {
      for (let i = 0; i < size; i++) {
        try {
          const w = new Worker(new URL('./mesher.worker.ts', import.meta.url), { type: 'module' });
          const idx = this.workers.length;
          w.onmessage = (e) => this.onMessage(idx, e);
          // a module worker that cannot load (or throws) says so only here: without it the town would never appear
          w.onerror = (e) => {
            e.preventDefault?.();
            this.fail(idx, e.message || 'the worker script failed to load');
          };
          w.onmessageerror = () => this.fail(idx, 'a message could not be read');
          w.postMessage({ type: 'flags', flags });
          this.workers.push(w);
          this.busy.push(0);
          this.lastHeard.push(performance.now());
          n++;
        } catch {
          break;
        }
      }
      if (n > 0 && typeof setInterval !== 'undefined') this.watch = setInterval(() => this.checkStalls(), 2000);
    }
    this.size = n;
  }

  /** Number of jobs in flight. */
  get inFlight(): number {
    return this.pending.size + this.local.length;
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
    for (const w of this.workers) w?.postMessage({ type: 'flags', flags });
  }

  submit(vol: Uint8Array, w: number, h: number, d: number, cb: Callback): void {
    const job: Job = { cb, vol, w, h, d, worker: -1 };
    this.dispatch(job);
  }

  private dispatch(job: Job): void {
    // least busy live worker
    let best = -1;
    for (let i = 0; i < this.workers.length; i++) if (this.workers[i] && (best < 0 || this.busy[i] < this.busy[best])) best = i;
    if (best < 0) {
      job.worker = -1;
      this.local.push(job);
      this.pumpLocal();
      return;
    }
    const id = this.nextId++;
    job.worker = best;
    this.pending.set(id, job);
    if (this.busy[best] === 0) this.lastHeard[best] = performance.now();
    this.busy[best]++;
    // copied, not transferred: the volume stays here in case the worker never answers
    this.workers[best]!.postMessage({ type: 'mesh', id, vol: job.vol, w: job.w, h: job.h, d: job.d });
  }

  /** mesh the waiting jobs on the main thread, ~8 ms at a time (synchronously when there is no event loop to wait on) */
  private pumpLocal(): void {
    if (this.localTimer !== null) return;
    const run = () => {
      this.localTimer = null;
      const t0 = performance.now();
      while (this.local.length && performance.now() - t0 < 8) {
        const j = this.local.shift()!;
        const res = greedyMesh(j.vol, j.w, j.h, j.d, this.flags);
        this.freeVols.push(j.vol);
        j.cb(res);
      }
      if (this.local.length) this.localTimer = setTimeout(run, 0);
    };
    if (this.workers.length === 0) {
      // tests / Node: no workers at all, answer at once
      while (this.local.length) {
        const j = this.local.shift()!;
        const res = greedyMesh(j.vol, j.w, j.h, j.d, this.flags);
        this.freeVols.push(j.vol);
        j.cb(res);
      }
      return;
    }
    this.localTimer = setTimeout(run, 0);
  }

  /** a worker is gone: hand its jobs to the others (or to the main thread) */
  private fail(i: number, why: string): void {
    const w = this.workers[i];
    if (!w) return;
    this.workers[i] = null;
    try { w.terminate(); } catch { /* already gone */ }
    const live = this.workers.filter(Boolean).length;
    reportProblem({
      id: live ? `worker-${i}` : 'workers-all',
      level: live ? 'info' : 'warn',
      title: live ? 'A mesh worker failed; the others take its work' : 'The mesh workers failed: building the town on the main thread (slower)',
      detail: why,
    });
    const moved: Job[] = [];
    for (const [id, j] of this.pending) if (j.worker === i) { this.pending.delete(id); moved.push(j); }
    this.busy[i] = 0;
    for (const j of moved) this.dispatch(j);
  }

  private checkStalls(): void {
    if (typeof document !== 'undefined' && document.hidden) {
      // a background tab is throttled: do not blame the workers for it
      for (let i = 0; i < this.lastHeard.length; i++) this.lastHeard[i] = performance.now();
      return;
    }
    const now = performance.now();
    for (let i = 0; i < this.workers.length; i++) {
      if (this.workers[i] && this.busy[i] > 0 && now - this.lastHeard[i] > STALL_MS) this.fail(i, `no answer for ${Math.round(STALL_MS / 1000)} s`);
    }
  }

  private onMessage(worker: number, e: MessageEvent): void {
    const msg = e.data;
    if (msg.type !== 'mesh') return;
    this.lastHeard[worker] = performance.now();
    const p = this.pending.get(msg.id);
    if (!p) return;
    this.busy[worker] = Math.max(0, this.busy[worker] - 1);
    this.pending.delete(msg.id);
    this.freeVols.push(p.vol);
    p.cb(msg.res as MeshResult);
  }

  dispose(): void {
    for (const w of this.workers) w?.terminate();
    this.workers = [];
    if (this.watch) clearInterval(this.watch);
    if (this.localTimer !== null) clearTimeout(this.localTimer);
  }
}
