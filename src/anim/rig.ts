// Rig: THREE bones built from a VoxelModel's skeleton; any number of rigid-skinned meshes (body
// forms) share it, and sockets (weapons, masks, effects) hang off bones.
import * as THREE from 'three';
import type { VoxelModel } from '../models/builder';
import type { BoneLookup } from './clip';
import type { Pose } from './pose';

const DEG = Math.PI / 180;

export class Rig implements BoneLookup {
  /** world-space character root (move/rotate this) */
  readonly object = new THREE.Group();
  readonly bones: THREE.Bone[] = [];
  readonly names: string[] = [];
  readonly parents: number[] = [];
  readonly restPos: THREE.Vector3[] = [];
  readonly skeleton: THREE.Skeleton;
  readonly meshes: THREE.SkinnedMesh[] = [];
  readonly sockets = new Map<string, THREE.Object3D>();
  readonly res: number;
  readonly hips: number;
  private map = new Map<string, number>();

  constructor(model: VoxelModel) {
    this.res = model.res;
    model.bones.forEach((b, i) => {
      const bone = new THREE.Bone();
      bone.name = b.name;
      const pp = b.parent >= 0 ? model.bones[b.parent].pivot : [0, 0, 0];
      bone.position.set((b.pivot[0] - pp[0]) / this.res, (b.pivot[1] - pp[1]) / this.res, (b.pivot[2] - pp[2]) / this.res);
      this.restPos.push(bone.position.clone());
      this.bones.push(bone);
      this.names.push(b.name);
      this.parents.push(b.parent);
      this.map.set(b.name, i);
      if (b.parent >= 0) this.bones[b.parent].add(bone);
      else this.object.add(bone);
    });
    this.object.updateMatrixWorld(true);
    this.skeleton = new THREE.Skeleton(this.bones);
    this.hips = this.index('hips');
    for (const [name, s] of Object.entries(model.sockets)) {
      const o = new THREE.Object3D();
      o.name = name;
      const pv = model.bones[s.bone].pivot;
      o.position.set((s.pos[0] - pv[0]) / this.res, (s.pos[1] - pv[1]) / this.res, (s.pos[2] - pv[2]) / this.res);
      o.rotation.set(s.rot[0] * DEG, s.rot[1] * DEG, s.rot[2] * DEG);
      this.bones[s.bone].add(o);
      this.sockets.set(name, o);
    }
  }

  get count(): number {
    return this.bones.length;
  }

  index(name: string): number {
    return this.map.get(name) ?? -1;
  }

  bone(name: string): THREE.Bone {
    const i = this.index(name);
    if (i < 0) throw new Error(`no bone ${name}`);
    return this.bones[i];
  }

  /** Bind a geometry (with skinIndex/skinWeight) to this rig's skeleton. */
  addMesh(geometry: THREE.BufferGeometry, material: THREE.Material): THREE.SkinnedMesh {
    const m = new THREE.SkinnedMesh(geometry, material);
    m.bind(this.skeleton, new THREE.Matrix4());
    m.frustumCulled = false;
    m.castShadow = true;
    m.receiveShadow = true;
    this.object.add(m);
    this.meshes.push(m);
    return m;
  }

  applyPose(p: Pose): void {
    for (let i = 0; i < this.bones.length; i++) {
      const b = this.bones[i];
      b.quaternion.set(p.q[i * 4], p.q[i * 4 + 1], p.q[i * 4 + 2], p.q[i * 4 + 3]);
    }
    if (this.hips >= 0) this.bones[this.hips].position.copy(this.restPos[this.hips]).add(p.hips);
  }

  /** Hide/show a bone's voxels (and its children) by collapsing its scale — used for form swaps. */
  setBoneVisible(name: string, on: boolean): void {
    const i = this.index(name);
    if (i >= 0) this.bones[i].scale.setScalar(on ? 1 : 1e-4);
  }
}
