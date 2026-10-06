// Third-person action camera: mouse orbit around the fighter with a shoulder offset, voxel-raycast
// collision, smoothed follow, lock-on framing, trauma shake and FOV punches.
import * as THREE from 'three';
import type { VoxelWorld } from '../voxel/world';
import { raycastVoxels } from '../voxel/raycast';
import { damp, dampAngle, valueNoise2 } from '../core/math';

export class ActionCamera {
  yaw = 0;
  pitch = 0.18;
  dist = 4.6;
  minDist = 1.6;
  maxDist = 14;
  shoulder = 0.55;
  height = 1.55;
  readonly focus = new THREE.Vector3();
  private smoothFocus = new THREE.Vector3();
  private curDist = 4.6;
  private trauma = 0;
  private fovKick = 0;
  baseFov = 62;
  private t = 0;
  /** lock-on target (world) */
  lockTarget: THREE.Vector3 | null = null;
  /** fixed camera override (cinematics / tests) */
  override: { pos: THREE.Vector3; target: THREE.Vector3 } | null = null;
  private inited = false;

  constructor(readonly cam: THREE.PerspectiveCamera, readonly world: VoxelWorld) {}

  addTrauma(a: number): void {
    this.trauma = Math.min(1, this.trauma + a);
  }

  punchFov(deg: number): void {
    this.fovKick = Math.max(this.fovKick, deg);
  }

  /** Mouse look (radians of delta). */
  look(dx: number, dy: number): void {
    this.yaw -= dx;
    this.pitch = Math.max(-1.25, Math.min(1.35, this.pitch + dy));
  }

  zoom(steps: number): void {
    this.dist = Math.max(this.minDist, Math.min(this.maxDist, this.dist * Math.pow(1.12, steps)));
  }

  /** Forward direction on the ground plane (for movement input). */
  flatForward(out: THREE.Vector3): THREE.Vector3 {
    return out.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
  }

  update(dt: number, target: THREE.Vector3): void {
    this.t += dt;
    if (this.override) {
      this.cam.position.copy(this.override.pos);
      this.cam.lookAt(this.override.target);
      return;
    }
    this.focus.copy(target);
    this.focus.y += this.height;
    if (!this.inited) {
      this.smoothFocus.copy(this.focus);
      this.inited = true;
    }
    // lock-on: steer yaw so target and fighter share the frame
    if (this.lockTarget) {
      const dx = this.lockTarget.x - target.x, dz = this.lockTarget.z - target.z;
      const want = Math.atan2(-dx, -dz);
      this.yaw = dampAngle(this.yaw, want, 6, dt);
      const dy = this.lockTarget.y - (target.y + 1);
      const flat = Math.hypot(dx, dz);
      this.pitch = damp(this.pitch, Math.max(-0.4, Math.min(0.8, 0.15 - Math.atan2(dy, flat) * 0.5)), 4, dt);
    }
    this.smoothFocus.x = damp(this.smoothFocus.x, this.focus.x, 18, dt);
    this.smoothFocus.z = damp(this.smoothFocus.z, this.focus.z, 18, dt);
    this.smoothFocus.y = damp(this.smoothFocus.y, this.focus.y, 10, dt);
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const back = new THREE.Vector3(Math.sin(this.yaw) * cp, sp, Math.cos(this.yaw) * cp);
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const pivot = this.smoothFocus.clone().addScaledVector(right, this.shoulder);
    // collision: pull in when voxels are between the pivot and the desired spot
    const want = this.dist;
    const hit = raycastVoxels(this.world, pivot.x, pivot.y, pivot.z, back.x, back.y, back.z, want + 0.4);
    let d = want;
    if (hit) d = Math.max(0.4, hit.dist - 0.35);
    this.curDist = d < this.curDist ? d : damp(this.curDist, d, 4, dt);
    const pos = pivot.clone().addScaledVector(back, this.curDist);
    // shake (trauma²)
    const sh = this.trauma * this.trauma;
    if (sh > 0) {
      const n = (s: number) => (valueNoise2(this.t * 28, s) - 0.5) * 2;
      pos.x += n(1) * 0.35 * sh;
      pos.y += n(2) * 0.3 * sh;
      pos.z += n(3) * 0.35 * sh;
    }
    this.trauma = Math.max(0, this.trauma - dt * 1.6);
    this.cam.position.copy(pos);
    const look = pivot.clone().addScaledVector(back, -6);
    if (this.lockTarget) look.lerp(this.lockTarget, 0.35);
    this.cam.lookAt(look);
    if (sh > 0) this.cam.rotateZ((valueNoise2(this.t * 22, 9) - 0.5) * 0.08 * sh);
    this.fovKick = damp(this.fovKick, 0, 5, dt);
    const fov = this.baseFov + this.fovKick;
    if (Math.abs(this.cam.fov - fov) > 0.01) {
      this.cam.fov = fov;
      this.cam.updateProjectionMatrix();
    }
  }
}
