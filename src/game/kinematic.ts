// Kinematic character body against the voxel world: an AABB that moves axis by axis in sub-voxel
// increments, steps up ledges, snaps to the ground and reports wall/ceiling contacts. Shinigami can
// also stand on reishi in mid-air (air-hover) — the controller just turns gravity off for that.
import * as THREE from 'three';
import type { VoxelWorld } from '../voxel/world';

export class KinematicBody {
  readonly pos = new THREE.Vector3();
  readonly vel = new THREE.Vector3();
  /** position at the start of the last step (render interpolation) */
  readonly prev = new THREE.Vector3();
  hw = 0.27;
  h = 1.7;
  stepUp = 0.6;
  grounded = false;
  /** seconds since last grounded (coyote time) */
  airTime = 0;
  hitWall = false;
  hitCeiling = false;
  wallNormal = new THREE.Vector3();
  gravity = -30;
  /** gravity off (reishi footing / hover / dash) */
  float = false;
  /** visual step smoothing offset (m), decays toward 0 */
  stepOffset = 0;
  /** ignore collisions (cinematics, noclip) */
  ghost = false;

  constructor(readonly world: VoxelWorld) {}

  private solidAt(x: number, y: number, z: number): boolean {
    return this.world.isSolid(x, y, z);
  }

  /** Does the body overlap solid voxels at foot position (px, py, pz)? */
  overlaps(px: number, py: number, pz: number): boolean {
    const vs = this.world.vs;
    const e = 1e-4;
    const x0 = Math.floor((px - this.hw + e) / vs), x1 = Math.floor((px + this.hw - e) / vs);
    const y0 = Math.floor((py + e) / vs), y1 = Math.floor((py + this.h - e) / vs);
    const z0 = Math.floor((pz - this.hw + e) / vs), z1 = Math.floor((pz + this.hw - e) / vs);
    for (let y = y0; y <= y1; y++)
      for (let z = z0; z <= z1; z++)
        for (let x = x0; x <= x1; x++) if (this.solidAt(x, y, z)) return true;
    return false;
  }

  /** Highest solid voxel top under the footprint within `maxDrop` below py (or null). */
  groundBelow(px: number, py: number, pz: number, maxDrop: number): number | null {
    const vs = this.world.vs;
    const e = 1e-4;
    const x0 = Math.floor((px - this.hw + e) / vs), x1 = Math.floor((px + this.hw - e) / vs);
    const z0 = Math.floor((pz - this.hw + e) / vs), z1 = Math.floor((pz + this.hw - e) / vs);
    const yTop = Math.floor((py - e) / vs), yBot = Math.floor((py - maxDrop) / vs);
    for (let y = yTop; y >= yBot; y--)
      for (let z = z0; z <= z1; z++)
        for (let x = x0; x <= x1; x++) if (this.solidAt(x, y, z)) return (y + 1) * vs;
    return null;
  }

  private moveAxis(axis: 0 | 1 | 2, d: number): boolean {
    if (d === 0) return false;
    const vs = this.world.vs;
    const n = Math.max(1, Math.ceil(Math.abs(d) / (vs * 0.45)));
    const s = d / n;
    const p = this.pos;
    for (let i = 0; i < n; i++) {
      const nx = axis === 0 ? p.x + s : p.x, ny = axis === 1 ? p.y + s : p.y, nz = axis === 2 ? p.z + s : p.z;
      if (!this.overlaps(nx, ny, nz)) {
        p.set(nx, ny, nz);
        continue;
      }
      // horizontal: try stepping up
      if (axis !== 1 && (this.grounded || this.airTime < 0.12) && this.vel.y <= 0.5) {
        let up = vs;
        let stepped = false;
        while (up <= this.stepUp + 1e-6) {
          if (!this.overlaps(nx, p.y + up, nz) && !this.overlaps(p.x, p.y + up, p.z)) {
            p.set(nx, p.y + up, nz);
            this.stepOffset -= up;
            stepped = true;
            break;
          }
          up += vs;
        }
        if (stepped) continue;
      }
      return true; // blocked
    }
    return false;
  }

  /** Integrate one step. */
  step(dt: number): void {
    this.prev.copy(this.pos);
    if (!this.float) this.vel.y += this.gravity * dt;
    if (this.ghost) {
      this.pos.addScaledVector(this.vel, dt);
      return;
    }
    // un-stick if spawned/carved into something
    if (this.overlaps(this.pos.x, this.pos.y, this.pos.z)) {
      for (let k = 1; k <= 24; k++) if (!this.overlaps(this.pos.x, this.pos.y + k * this.world.vs, this.pos.z)) { this.pos.y += k * this.world.vs; break; }
    }
    this.hitWall = false;
    this.hitCeiling = false;
    const bx = this.moveAxis(0, this.vel.x * dt);
    if (bx) { this.hitWall = true; this.wallNormal.set(-Math.sign(this.vel.x), 0, 0); this.vel.x = 0; }
    const bz = this.moveAxis(2, this.vel.z * dt);
    if (bz) { this.hitWall = true; this.wallNormal.set(0, 0, -Math.sign(this.vel.z)); this.vel.z = 0; }
    const by = this.moveAxis(1, this.vel.y * dt);
    const wasGrounded = this.grounded;
    if (by) {
      if (this.vel.y < 0) this.grounded = true;
      else this.hitCeiling = true;
      this.vel.y = 0;
    } else {
      this.grounded = false;
      // ground snap when walking down slopes/stairs
      if (wasGrounded && this.vel.y <= 0 && !this.float) {
        const g = this.groundBelow(this.pos.x, this.pos.y, this.pos.z, this.stepUp + 0.05);
        if (g !== null) {
          this.stepOffset += this.pos.y - g;
          this.pos.y = g;
          this.grounded = true;
        }
      }
    }
    if (this.grounded) {
      // support check (ground carved away under our feet)
      const g = this.groundBelow(this.pos.x, this.pos.y + 0.01, this.pos.z, 0.03);
      if (g === null) this.grounded = false;
    }
    this.airTime = this.grounded ? 0 : this.airTime + dt;
    this.stepOffset *= Math.exp(-dt * 14);
    // world bounds
    const W = this.world.sx * this.world.vs, D = this.world.sz * this.world.vs;
    this.pos.x = Math.min(W - this.hw - 0.01, Math.max(this.hw + 0.01, this.pos.x));
    this.pos.z = Math.min(D - this.hw - 0.01, Math.max(this.hw + 0.01, this.pos.z));
    if (this.pos.y < -20) {
      this.pos.y = this.world.sy * this.world.vs;
      this.vel.set(0, 0, 0);
    }
  }
}
