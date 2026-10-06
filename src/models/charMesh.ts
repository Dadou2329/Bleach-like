// Turns a VoxelModel into GPU geometry: each bone's grid is greedy-meshed on its own (parts move
// independently, so faces between parts must exist), with vertex AO taken from the whole body's
// occupancy. Vertices carry the bone index for rigid skinning. Positions are model-space metres in
// the rest pose; the material re-derives voxel cells from them (rest position × res).
import * as THREE from 'three';
import { greedyMesh } from '../voxel/mesher';
import { F_SOLID } from '../voxel/materials';
import type { VoxelModel } from './builder';

const CHAR_FLAGS = new Uint8Array(256).fill(F_SOLID);
CHAR_FLAGS[0] = 0;

export interface ModelGeometryStats {
  voxels: number;
  triangles: number;
  ms: number;
}

/** Dense union occupancy of every bone grid, padded. */
function unionOccupancy(model: VoxelModel, pad: number) {
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  const bounds = model.grids.map((g) => g.bounds());
  for (const b of bounds) {
    if (!b) continue;
    for (let k = 0; k < 3; k++) {
      mn[k] = Math.min(mn[k], b.min[k]);
      mx[k] = Math.max(mx[k], b.max[k]);
    }
  }
  for (let k = 0; k < 3; k++) { mn[k] -= pad; mx[k] += pad; }
  const W = mx[0] - mn[0] + 1, H = mx[1] - mn[1] + 1, D = mx[2] - mn[2] + 1;
  const data = new Uint8Array(Math.max(1, W * H * D));
  let voxels = 0;
  model.grids.forEach((g) =>
    g.forEach((x, y, z) => {
      voxels++;
      data[x - mn[0] + W * (y - mn[1] + H * (z - mn[2]))] = 1;
    }),
  );
  return { data, mn, W, H, D, bounds, voxels };
}

/**
 * Build one BufferGeometry for the model.
 * @param skinned add skinIndex/skinWeight (bone = part) for a SkinnedMesh
 * @param boneFilter only mesh these bone indices (weapons / detachable parts)
 */
export function buildModelGeometry(model: VoxelModel, skinned = true, boneFilter?: (bone: number) => boolean): { geometry: THREE.BufferGeometry; stats: ModelGeometryStats } {
  const t0 = performance.now();
  const occ = unionOccupancy(model, 2);
  const res = model.res;
  const pos: number[] = [];
  const nrm: number[] = [];
  const vox: number[] = [];
  const skin: number[] = [];
  const idx: number[] = [];
  let vbase = 0;
  model.grids.forEach((g, bi) => {
    if (boneFilter && !boneFilter(bi)) return;
    const b = occ.bounds[bi];
    if (!b) return;
    const w = b.max[0] - b.min[0] + 1, h = b.max[1] - b.min[1] + 1, d = b.max[2] - b.min[2] + 1;
    const PX = w + 2, PY = h + 2, PZ = d + 2;
    const vol = new Uint8Array(PX * PY * PZ);
    const ov = new Uint8Array(PX * PY * PZ);
    g.forEach((x, y, z, v) => {
      vol[x - b.min[0] + 1 + PX * (y - b.min[1] + 1 + PY * (z - b.min[2] + 1))] = v & 0xff;
    });
    for (let z = 0; z < PZ; z++)
      for (let y = 0; y < PY; y++)
        for (let x = 0; x < PX; x++) {
          const ox = x - 1 + b.min[0] - occ.mn[0], oy = y - 1 + b.min[1] - occ.mn[1], oz = z - 1 + b.min[2] - occ.mn[2];
          if (ox < 0 || oy < 0 || oz < 0 || ox >= occ.W || oy >= occ.H || oz >= occ.D) continue;
          ov[x + PX * (y + PY * z)] = occ.data[ox + occ.W * (oy + occ.H * oz)];
        }
    const r = greedyMesh(vol, w, h, d, CHAR_FLAGS, ov).opaque;
    if (!r) return;
    for (let i = 0; i < r.vertexCount; i++) {
      pos.push((r.positions[i * 3] + b.min[0]) / res, (r.positions[i * 3 + 1] + b.min[1]) / res, (r.positions[i * 3 + 2] + b.min[2]) / res);
      nrm.push(r.normals[i * 3], r.normals[i * 3 + 1], r.normals[i * 3 + 2]);
      vox.push(r.vox[i * 2], r.vox[i * 2 + 1]);
      if (skinned) skin.push(bi);
    }
    for (let i = 0; i < r.indexCount; i++) idx.push(r.indices[i] + vbase);
    vbase += r.vertexCount;
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(new Int8Array(nrm), 3, true));
  geo.setAttribute('aVox', new THREE.BufferAttribute(new Uint8Array(vox), 2));
  if (skinned) {
    const si = new Uint16Array(skin.length * 4);
    const sw = new Float32Array(skin.length * 4);
    for (let i = 0; i < skin.length; i++) {
      si[i * 4] = skin[i];
      sw[i * 4] = 1;
    }
    geo.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4));
    geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
  }
  geo.setIndex(vbase > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1));
  geo.computeBoundingSphere();
  geo.computeBoundingBox();
  return { geometry: geo, stats: { voxels: occ.voxels, triangles: idx.length / 3, ms: performance.now() - t0 } };
}

/** Palette (sRGB colours) and per-entry params (roughness, metalness, glow) as 256×1 textures. */
export function buildModelPalette(model: VoxelModel): { palette: THREE.DataTexture; params: THREE.DataTexture } {
  const cdata = new Uint8Array(256 * 4);
  const pdata = new Uint8Array(256 * 4);
  const c = new THREE.Color();
  model.palette.forEach((e, i) => {
    c.set(e.color);
    const hex = c.getHex();
    cdata[i * 4] = (hex >> 16) & 255;
    cdata[i * 4 + 1] = (hex >> 8) & 255;
    cdata[i * 4 + 2] = hex & 255;
    cdata[i * 4 + 3] = 255;
    pdata[i * 4] = Math.round(e.rough * 255);
    pdata[i * 4 + 1] = Math.round(e.metal * 255);
    pdata[i * 4 + 2] = Math.min(255, Math.round((e.glow / 16) * 255));
    pdata[i * 4 + 3] = 0;
  });
  const palette = new THREE.DataTexture(cdata, 256, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
  palette.colorSpace = THREE.SRGBColorSpace;
  palette.magFilter = palette.minFilter = THREE.NearestFilter;
  palette.generateMipmaps = false;
  palette.needsUpdate = true;
  const params = new THREE.DataTexture(pdata, 256, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
  params.magFilter = params.minFilter = THREE.NearestFilter;
  params.generateMipmaps = false;
  params.needsUpdate = true;
  return { palette, params };
}
