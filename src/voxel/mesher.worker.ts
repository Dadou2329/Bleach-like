/// <reference lib="webworker" />
import { greedyMesh, type MeshBuffers } from './mesher';

let flags: Uint8Array = new Uint8Array(256);

interface MeshJob {
  type: 'mesh';
  id: number;
  vol: Uint8Array;
  w: number;
  h: number;
  d: number;
}

self.onmessage = (e: MessageEvent) => {
  const msg = e.data;
  if (msg.type === 'flags') {
    flags = msg.flags as Uint8Array;
    return;
  }
  if (msg.type === 'mesh') {
    const job = msg as MeshJob;
    const res = greedyMesh(job.vol, job.w, job.h, job.d, flags);
    const transfer: Transferable[] = [job.vol.buffer];
    const add = (b: MeshBuffers | null) => {
      if (!b) return;
      transfer.push(b.positions.buffer, b.normals.buffer, b.vox.buffer, b.indices.buffer);
    };
    add(res.opaque);
    add(res.transparent);
    (self as unknown as Worker).postMessage({ type: 'mesh', id: job.id, res, vol: job.vol }, transfer);
  }
};
