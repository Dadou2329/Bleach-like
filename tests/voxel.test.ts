import { describe, expect, it } from 'vitest';
import { Chunk, CS3, PackedChunk, vidx } from '../src/voxel/chunk';
import { createBaseMaterials } from '../src/voxel/materials';
import { greedyMeshDense } from '../src/voxel/mesher';
import { VoxelWorld } from '../src/voxel/world';
import { Rng } from '../src/core/rng';

describe('PackedChunk', () => {
  it('round-trips dense data with varied palette sizes per brick', () => {
    const rng = new Rng(7);
    const dense = new Uint8Array(CS3);
    for (let i = 0; i < CS3; i++) {
      const x = i & 31, y = (i >> 5) & 31;
      // different complexity per region: uniform, 2 colours, 4, 16, many
      if (y < 8) dense[i] = 3;
      else if (y < 16) dense[i] = rng.chance(0.5) ? 1 : 2;
      else if (y < 24) dense[i] = x < 16 ? rng.int(0, 3) : rng.int(10, 25);
      else dense[i] = rng.int(0, 200);
    }
    const p = PackedChunk.fromDense(dense);
    const out = new Uint8Array(CS3);
    p.decodeInto(out);
    expect(out).toEqual(dense);
    for (let k = 0; k < 2000; k++) {
      const i = rng.int(0, CS3 - 1);
      expect(p.get(i)).toBe(dense[i]);
    }
    expect(p.byteSize).toBeLessThan(CS3);
  });
});

describe('Chunk', () => {
  it('handles uniform → dense → packed → uniform transitions', () => {
    const c = new Chunk(5);
    expect(c.get(vidx(3, 4, 5))).toBe(5);
    c.set(vidx(1, 1, 1), 9);
    expect(c.dense).not.toBeNull();
    expect(c.get(vidx(1, 1, 1))).toBe(9);
    c.compress();
    expect(c.dense).toBeNull();
    expect(c.packed).not.toBeNull();
    expect(c.get(vidx(1, 1, 1))).toBe(9);
    expect(c.get(vidx(2, 1, 1))).toBe(5);
    c.set(vidx(1, 1, 1), 5);
    c.compress();
    expect(c.isUniform).toBe(true);
    expect(c.uniform).toBe(5);
  });
});

describe('VoxelWorld', () => {
  it('sets/gets across chunks, fills boxes and pads borders', () => {
    const mats = createBaseMaterials();
    const w = new VoxelWorld(mats, { x: 96, y: 64, z: 96 }, 0.125);
    const stone = mats.id('stone');
    w.fillBox(0, 0, 0, 96, 10, 96, stone);
    expect(w.get(50, 5, 50)).toBe(stone);
    expect(w.get(50, 10, 50)).toBe(0);
    expect(w.get(50, -1, 50)).toBe(w.bedrockId);
    w.set(31, 10, 31, stone);
    expect(w.dirty.has(w.chunkIndex(0, 0, 0))).toBe(true);
    expect(w.dirty.has(w.chunkIndex(1, 0, 0))).toBe(true); // border neighbour marked
    const pad = new Uint8Array(34 * 34 * 34);
    w.copyPadded(1, 0, 1, pad);
    // padded (0, y+1, z+1) is world (31, y, 31) for chunk (1,0,1)
    expect(pad[0 + 34 * (11 + 34 * 0)]).toBe(stone); // x=-1,y=10,z=-1 → world (31,10,31)
    const r = w.compressAll();
    expect(r.chunks).toBeGreaterThan(0);
    expect(w.get(31, 10, 31)).toBe(stone);
  });
});

describe('greedyMesh', () => {
  const mats = createBaseMaterials();
  const stone = mats.id('stone');

  it('meshes a single voxel into 6 quads', () => {
    const r = greedyMeshDense(Uint8Array.of(stone), 1, 1, 1, mats.flags);
    expect(r.opaque!.vertexCount).toBe(24);
    expect(r.opaque!.indexCount).toBe(36);
    expect(r.transparent).toBeNull();
  });

  it('merges coplanar faces of a box into 6 quads', () => {
    const w = 4, h = 3, d = 5;
    const vol = new Uint8Array(w * h * d).fill(stone);
    const r = greedyMeshDense(vol, w, h, d, mats.flags);
    expect(r.opaque!.vertexCount).toBe(24);
  });

  it('computes AO darkening where a face meets a wall', () => {
    // floor 3x1x3 plus one block on top at the centre → floor top face corners touching the block get AO < 3
    const w = 3, h = 2, d = 3;
    const vol = new Uint8Array(w * h * d);
    for (let z = 0; z < 3; z++) for (let x = 0; x < 3; x++) vol[x + w * (0 + h * z)] = stone;
    vol[1 + w * (1 + h * 1)] = stone;
    const r = greedyMeshDense(vol, w, h, d, mats.flags);
    const o = r.opaque!;
    let minAo = 3;
    for (let v = 0; v < o.vertexCount; v++) {
      const ny = o.normals[v * 3 + 1];
      if (ny > 0 && o.positions[v * 3 + 1] === 1) minAo = Math.min(minAo, o.vox[v * 2 + 1]);
    }
    expect(minAo).toBeLessThan(3);
  });

  it('puts glass in the transparent stream and keeps faces behind it', () => {
    const glass = mats.id('glass');
    const vol = Uint8Array.of(stone, glass);
    const r = greedyMeshDense(vol, 2, 1, 1, mats.flags);
    expect(r.transparent).not.toBeNull();
    // stone face toward the glass must exist (6 stone faces)
    expect(r.opaque!.vertexCount).toBe(24);
    expect(r.transparent!.vertexCount).toBe(20); // 5 glass faces (none toward stone)
  });
});
