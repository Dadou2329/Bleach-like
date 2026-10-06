// Assemble a renderable, animatable character from a model asset: rig + skinned body + weapons on
// sockets + spring bones. Geometry builds are cached per model name.
import * as THREE from 'three';
import type { VoxelModel } from '../models/builder';
import { buildModelGeometry, buildModelPalette } from '../models/charMesh';
import { createCharMaterial, type CharMaterial } from '../render/charMaterial';
import { Rig } from '../anim/rig';
import { SpringSystem, type ColliderDef, type SpringDef } from '../anim/springs';

interface Built {
  geometry: THREE.BufferGeometry;
  palette: THREE.DataTexture;
  params: THREE.DataTexture;
  ms: number;
  voxels: number;
  triangles: number;
}

const cache = new Map<string, Built>();

export function buildCached(model: VoxelModel, skinned: boolean): Built {
  const key = `${model.name}:${skinned ? 's' : 'r'}`;
  let b = cache.get(key);
  if (!b) {
    const { geometry, stats } = buildModelGeometry(model, skinned);
    const { palette, params } = buildModelPalette(model);
    b = { geometry, palette, params, ms: stats.ms, voxels: stats.voxels, triangles: stats.triangles };
    cache.set(key, b);
  }
  return b;
}

export class PropMesh extends THREE.Mesh {
  declare material: CharMaterial;
  constructor(model: VoxelModel) {
    const b = buildCached(model, false);
    super(b.geometry, createCharMaterial(b.palette, b.params, model.res));
    this.castShadow = true;
    this.receiveShadow = true;
  }
}

export class CharacterVisual {
  readonly rig: Rig;
  readonly material: CharMaterial;
  readonly body: THREE.SkinnedMesh;
  readonly springs: SpringSystem;
  readonly props = new Map<string, PropMesh>();
  readonly stats: { buildMs: number; voxels: number; triangles: number };

  constructor(readonly model: VoxelModel, springs: SpringDef[] = [], colliders: ColliderDef[] = []) {
    this.rig = new Rig(model);
    const b = buildCached(model, true);
    this.material = createCharMaterial(b.palette, b.params, model.res);
    this.body = this.rig.addMesh(b.geometry, this.material);
    this.springs = new SpringSystem(this.rig, springs, colliders);
    this.stats = { buildMs: b.ms, voxels: b.voxels, triangles: b.triangles };
  }

  get object(): THREE.Group {
    return this.rig.object;
  }

  /** Attach a prop model to a socket (replacing what was there under the same key). */
  attach(key: string, model: VoxelModel, socket: string, offset?: THREE.Vector3, rot?: THREE.Euler): PropMesh {
    this.detach(key);
    const m = new PropMesh(model);
    if (offset) m.position.copy(offset);
    if (rot) m.rotation.copy(rot);
    const s = this.rig.sockets.get(socket);
    if (!s) throw new Error(`no socket ${socket}`);
    s.add(m);
    this.props.set(key, m);
    return m;
  }

  /** Move an attached prop to another socket keeping its local offset. */
  moveProp(key: string, socket: string, offset?: THREE.Vector3, rot?: THREE.Euler): void {
    const m = this.props.get(key);
    const s = this.rig.sockets.get(socket);
    if (!m || !s) return;
    s.add(m);
    if (offset) m.position.copy(offset);
    if (rot) m.rotation.copy(rot);
  }

  detach(key: string): void {
    const m = this.props.get(key);
    if (!m) return;
    m.removeFromParent();
    this.props.delete(key);
  }

  /** Apply a uniform to body and props. */
  forEachMaterial(f: (m: CharMaterial) => void): void {
    f(this.material);
    for (const p of this.props.values()) f(p.material);
  }
}
