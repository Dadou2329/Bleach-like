// Greedy mesher with per-vertex ambient occlusion.
//
// Input: a padded volume (W+2)×(H+2)×(D+2) of material ids (index x + PX*(y + PY*z)) whose 1-voxel
// shell holds the neighbours. Output: quads merged per (material, AO pattern), split into an opaque
// and a transparent stream. Positions are integer voxel corners (Uint16), normals Int8, and `vox`
// carries [material id, AO 0..3] per vertex.
//
// Pure function: used by mesher workers (chunks), fragments and character parts.

import { F_SOLID, F_TRANSPARENT, F_LIQUID, F_FOLIAGE } from './materials';

export interface MeshBuffers {
  positions: Uint16Array;
  normals: Int8Array;
  vox: Uint8Array;
  indices: Uint32Array;
  vertexCount: number;
  indexCount: number;
}

export interface MeshResult {
  opaque: MeshBuffers | null;
  transparent: MeshBuffers | null;
}

class Builder {
  pos: Uint16Array;
  nor: Int8Array;
  vox: Uint8Array;
  idx: Uint32Array;
  vc = 0;
  ic = 0;

  constructor(cap = 4096) {
    this.pos = new Uint16Array(cap * 3);
    this.nor = new Int8Array(cap * 3);
    this.vox = new Uint8Array(cap * 2);
    this.idx = new Uint32Array(cap * 1.5);
  }

  reset(): void {
    this.vc = 0;
    this.ic = 0;
  }

  private grow(): void {
    const cap = (this.pos.length / 3) * 2;
    const p = new Uint16Array(cap * 3); p.set(this.pos); this.pos = p;
    const n = new Int8Array(cap * 3); n.set(this.nor); this.nor = n;
    const v = new Uint8Array(cap * 2); v.set(this.vox); this.vox = v;
    const i = new Uint32Array(cap * 1.5); i.set(this.idx); this.idx = i;
  }

  quad(c: number[], nx: number, ny: number, nz: number, mat: number, ao: number[], flipWinding: boolean): void {
    if ((this.vc + 4) * 3 > this.pos.length || this.ic + 6 > this.idx.length) this.grow();
    const base = this.vc;
    for (let k = 0; k < 4; k++) {
      const o = (base + k) * 3;
      this.pos[o] = c[k * 3];
      this.pos[o + 1] = c[k * 3 + 1];
      this.pos[o + 2] = c[k * 3 + 2];
      this.nor[o] = nx * 127;
      this.nor[o + 1] = ny * 127;
      this.nor[o + 2] = nz * 127;
      this.vox[(base + k) * 2] = mat;
      this.vox[(base + k) * 2 + 1] = ao[k];
    }
    this.vc += 4;
    // AO-aware diagonal: keep dark corners from smearing across the quad
    const diag13 = ao[0] + ao[2] < ao[1] + ao[3];
    const t = diag13 ? [0, 1, 3, 1, 2, 3] : [0, 1, 2, 0, 2, 3];
    if (flipWinding) {
      this.idx[this.ic++] = base + t[0]; this.idx[this.ic++] = base + t[2]; this.idx[this.ic++] = base + t[1];
      this.idx[this.ic++] = base + t[3]; this.idx[this.ic++] = base + t[5]; this.idx[this.ic++] = base + t[4];
    } else {
      for (let k = 0; k < 6; k++) this.idx[this.ic++] = base + t[k];
    }
  }

  take(): MeshBuffers | null {
    if (this.vc === 0) return null;
    return {
      positions: this.pos.slice(0, this.vc * 3),
      normals: this.nor.slice(0, this.vc * 3),
      vox: this.vox.slice(0, this.vc * 2),
      indices: this.idx.slice(0, this.ic),
      vertexCount: this.vc,
      indexCount: this.ic,
    };
  }
}

const opaqueB = new Builder();
const transB = new Builder();
let maskKey = new Int32Array(0);
let maskAo = new Int32Array(0);

/**
 * @param vol padded volume, dims (w+2)(h+2)(d+2)
 * @param w,h,d interior size in voxels
 * @param flags material flag table (256 entries)
 * @param occ optional padded occupancy volume (same layout) used for AO instead of `vol` — character
 *            parts mesh one bone at a time but take AO from the whole body
 */
export function greedyMesh(vol: Uint8Array, w: number, h: number, d: number, flags: Uint8Array, occ?: Uint8Array): MeshResult {
  const PX = w + 2, PY = h + 2;
  const st = [1, PX, PX * PY];
  const dims = [w, h, d];
  const origin = 1 + PX + PX * PY;
  opaqueB.reset();
  transB.reset();
  const corner = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const aoArr = [0, 0, 0, 0];

  const isOpaque = (m: number) => (flags[m] & (F_SOLID | F_TRANSPARENT | F_LIQUID)) === F_SOLID;
  const isClear = (m: number) => m === 0 || (flags[m] & (F_TRANSPARENT | F_LIQUID)) !== 0;
  const occludesMat = (m: number) => (flags[m] & (F_SOLID | F_TRANSPARENT | F_LIQUID | F_FOLIAGE)) === F_SOLID;
  const src = occ ?? vol;
  const occludes = occ ? (o: number) => o !== 0 : occludesMat;

  for (let dd = 0; dd < 3; dd++) {
    const uu = (dd + 1) % 3, vv = (dd + 2) % 3;
    const W = dims[uu], H = dims[vv];
    const sd = st[dd], su = st[uu], sv = st[vv];
    if (maskKey.length < W * H) {
      maskKey = new Int32Array(W * H);
      maskAo = new Int32Array(W * H);
    }
    for (let side = -1; side <= 1; side += 2) {
      const nrm = [0, 0, 0];
      nrm[dd] = side;
      for (let s = 0; s < dims[dd]; s++) {
        // ---- build the face mask for this slice
        let any = false;
        for (let j = 0; j < H; j++) {
          for (let i = 0; i < W; i++) {
            const id = origin + s * sd + i * su + j * sv;
            const a = vol[id];
            const mi = i + j * W;
            if (a === 0) { maskKey[mi] = 0; continue; }
            const q = id + side * sd;
            const b = vol[q];
            let key = 0;
            if (isOpaque(a)) {
              if (isClear(b)) key = a;
            } else if (b !== a && isClear(b)) {
              key = a | 0x10000; // transparent stream
            }
            if (key === 0) { maskKey[mi] = 0; continue; }
            any = true;
            let ao = 0xff;
            if (!(key & 0x10000)) {
              const s1n = occludes(src[q - su]) ? 1 : 0, s1p = occludes(src[q + su]) ? 1 : 0;
              const s2n = occludes(src[q - sv]) ? 1 : 0, s2p = occludes(src[q + sv]) ? 1 : 0;
              const cnn = occludes(src[q - su - sv]) ? 1 : 0, cpn = occludes(src[q + su - sv]) ? 1 : 0;
              const cpp = occludes(src[q + su + sv]) ? 1 : 0, cnp = occludes(src[q - su + sv]) ? 1 : 0;
              const a0 = s1n && s2n ? 0 : 3 - (s1n + s2n + cnn);
              const a1 = s1p && s2n ? 0 : 3 - (s1p + s2n + cpn);
              const a2 = s1p && s2p ? 0 : 3 - (s1p + s2p + cpp);
              const a3 = s1n && s2p ? 0 : 3 - (s1n + s2p + cnp);
              ao = a0 | (a1 << 2) | (a2 << 4) | (a3 << 6);
            }
            maskKey[mi] = key;
            maskAo[mi] = ao;
          }
        }
        if (!any) continue;
        // ---- greedy merge
        const plane = s + (side > 0 ? 1 : 0);
        for (let j = 0; j < H; j++) {
          for (let i = 0; i < W; ) {
            const mi = i + j * W;
            const key = maskKey[mi];
            if (key === 0) { i++; continue; }
            const ao = maskAo[mi];
            let ww = 1;
            while (i + ww < W && maskKey[mi + ww] === key && maskAo[mi + ww] === ao) ww++;
            let hh = 1;
            outer: while (j + hh < H) {
              const row = (j + hh) * W + i;
              for (let k = 0; k < ww; k++) if (maskKey[row + k] !== key || maskAo[row + k] !== ao) break outer;
              hh++;
            }
            for (let jj = 0; jj < hh; jj++) maskKey.fill(0, (j + jj) * W + i, (j + jj) * W + i + ww);
            // corners (u,v): (i,j) (i+ww,j) (i+ww,j+hh) (i,j+hh)
            const cu = [i, i + ww, i + ww, i], cv = [j, j, j + hh, j + hh];
            for (let k = 0; k < 4; k++) {
              corner[k * 3 + dd] = plane;
              corner[k * 3 + uu] = cu[k];
              corner[k * 3 + vv] = cv[k];
            }
            aoArr[0] = ao & 3; aoArr[1] = (ao >> 2) & 3; aoArr[2] = (ao >> 4) & 3; aoArr[3] = (ao >> 6) & 3;
            const builder = key & 0x10000 ? transB : opaqueB;
            builder.quad(corner, nrm[0], nrm[1], nrm[2], key & 0xff, aoArr, side < 0);
            i += ww;
          }
        }
      }
    }
  }
  return { opaque: opaqueB.take(), transparent: transB.take() };
}

/** Convenience: mesh an unpadded dense volume (x + w*(y + h*z)) surrounded by air. */
export function greedyMeshDense(dense: Uint8Array, w: number, h: number, d: number, flags: Uint8Array): MeshResult {
  const PX = w + 2, PY = h + 2, PZ = d + 2;
  const vol = new Uint8Array(PX * PY * PZ);
  for (let z = 0; z < d; z++)
    for (let y = 0; y < h; y++) {
      const src = w * (y + h * z);
      vol.set(dense.subarray(src, src + w), 1 + PX * (y + 1 + PY * (z + 1)));
    }
  return greedyMesh(vol, w, h, d, flags);
}
