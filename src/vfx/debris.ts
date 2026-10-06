// Debris: thousands of small voxel cubes thrown by destruction. CPU-simulated against the voxel grid
// (bounce, friction, rest), rendered as one InstancedMesh with per-instance colours.
import * as THREE from 'three';
import type { VoxelWorld } from '../voxel/world';
import type { MaterialTable } from '../voxel/materials';

export class DebrisSystem {
  readonly mesh: THREE.InstancedMesh;
  readonly capacity: number;
  count = 0;
  private px: Float32Array; private py: Float32Array; private pz: Float32Array;
  private vx: Float32Array; private vy: Float32Array; private vz: Float32Array;
  private rx: Float32Array; private ry: Float32Array; private rz: Float32Array;
  private wx: Float32Array; private wy: Float32Array; private wz: Float32Array;
  private size: Float32Array; private life: Float32Array; private maxLife: Float32Array;
  private resting: Uint8Array;
  private mat: Uint8Array;
  private col: Float32Array;
  private matrix = new THREE.Matrix4();
  private quat = new THREE.Quaternion();
  private euler = new THREE.Euler();
  private pos = new THREE.Vector3();
  private scl = new THREE.Vector3();
  /** linear colours per material (6 shades × rgb) */
  private matColors: Float32Array;
  /** optional: deposit resting debris back into the world as rubble voxels */
  depositRubble = true;
  /** veto for deposits (e.g. inside a character's body) — world-space metres */
  depositBlocked: ((x: number, y: number, z: number) => boolean) | null = null;
  private depositBudget = 0;

  constructor(private world: VoxelWorld, mats: MaterialTable, capacity = 16000) {
    this.capacity = capacity;
    const f = () => new Float32Array(capacity);
    this.px = f(); this.py = f(); this.pz = f();
    this.vx = f(); this.vy = f(); this.vz = f();
    this.rx = f(); this.ry = f(); this.rz = f();
    this.wx = f(); this.wy = f(); this.wz = f();
    this.size = f(); this.life = f(); this.maxLife = f();
    this.resting = new Uint8Array(capacity);
    this.mat = new Uint8Array(capacity);
    this.col = new Float32Array(capacity * 3);
    this.matColors = new Float32Array(256 * 18);
    const c = new THREE.Color();
    for (let id = 0; id < mats.count; id++) {
      const ramp = mats.def(id).colors;
      for (let s = 0; s < 6; s++) {
        c.set(ramp[Math.min(ramp.length - 1, Math.floor((s / 6) * ramp.length))]);
        this.matColors[id * 18 + s * 3] = c.r;
        this.matColors[id * 18 + s * 3 + 1] = c.g;
        this.matColors[id * 18 + s * 3 + 2] = c.b;
      }
    }
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0 });
    this.mesh = new THREE.InstancedMesh(geo, material, capacity);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3);
    this.mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    this.mesh.count = 0;
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.frustumCulled = false;
  }

  /** Spawn one cube of material `m`. Returns false when full. */
  spawn(x: number, y: number, z: number, vx: number, vy: number, vz: number, size: number, m: number, life = 4): boolean {
    let i = this.count;
    if (i >= this.capacity) {
      // recycle a random resting particle
      i = Math.floor(Math.random() * this.capacity);
      if (!this.resting[i]) return false;
    } else this.count++;
    this.px[i] = x; this.py[i] = y; this.pz[i] = z;
    this.vx[i] = vx; this.vy[i] = vy; this.vz[i] = vz;
    this.rx[i] = Math.random() * 6.28; this.ry[i] = Math.random() * 6.28; this.rz[i] = Math.random() * 6.28;
    const spin = 4 + Math.hypot(vx, vy, vz) * 0.8;
    this.wx[i] = (Math.random() - 0.5) * spin; this.wy[i] = (Math.random() - 0.5) * spin; this.wz[i] = (Math.random() - 0.5) * spin;
    this.size[i] = size;
    this.life[i] = life * (0.75 + Math.random() * 0.5);
    this.maxLife[i] = this.life[i];
    this.resting[i] = 0;
    this.mat[i] = m;
    const s = Math.floor(Math.random() * 6);
    const o = m * 18 + s * 3;
    // slight darkening: debris shows inner faces
    const k = 0.85 + Math.random() * 0.15;
    this.col[i * 3] = this.matColors[o] * k;
    this.col[i * 3 + 1] = this.matColors[o + 1] * k;
    this.col[i * 3 + 2] = this.matColors[o + 2] * k;
    return true;
  }

  private kill(i: number): void {
    const j = --this.count;
    if (i === j) return;
    this.px[i] = this.px[j]; this.py[i] = this.py[j]; this.pz[i] = this.pz[j];
    this.vx[i] = this.vx[j]; this.vy[i] = this.vy[j]; this.vz[i] = this.vz[j];
    this.rx[i] = this.rx[j]; this.ry[i] = this.ry[j]; this.rz[i] = this.rz[j];
    this.wx[i] = this.wx[j]; this.wy[i] = this.wy[j]; this.wz[i] = this.wz[j];
    this.size[i] = this.size[j]; this.life[i] = this.life[j]; this.maxLife[i] = this.maxLife[j];
    this.resting[i] = this.resting[j]; this.mat[i] = this.mat[j];
    this.col[i * 3] = this.col[j * 3]; this.col[i * 3 + 1] = this.col[j * 3 + 1]; this.col[i * 3 + 2] = this.col[j * 3 + 2];
  }

  update(dt: number, gravity = -22): void {
    const w = this.world;
    const vs = w.vs;
    const inv = 1 / vs;
    const solid = (x: number, y: number, z: number) => w.isSolid(Math.floor(x * inv), Math.floor(y * inv), Math.floor(z * inv));
    this.depositBudget = 40;
    for (let i = 0; i < this.count; i++) {
      this.life[i] -= dt;
      if (this.life[i] <= 0 || this.py[i] < -2) {
        if (this.resting[i] && this.depositRubble && this.depositBudget > 0 && this.size[i] >= vs * 0.9) this.deposit(i);
        this.kill(i);
        i--;
        continue;
      }
      if (this.resting[i]) continue;
      this.vy[i] += gravity * dt;
      const drag = Math.exp(-0.25 * dt);
      this.vx[i] *= drag; this.vz[i] *= drag;
      const half = this.size[i] * 0.5;
      // X
      let nx = this.px[i] + this.vx[i] * dt;
      if (solid(nx, this.py[i], this.pz[i])) { this.vx[i] *= -0.3; nx = this.px[i]; }
      // Y
      let ny = this.py[i] + this.vy[i] * dt;
      if (solid(nx, ny - half, this.pz[i])) {
        if (this.vy[i] < 0) {
          this.vy[i] *= -0.28;
          this.vx[i] *= 0.6; this.vz[i] *= 0.6;
          this.wx[i] *= 0.5; this.wy[i] *= 0.5; this.wz[i] *= 0.5;
          if (Math.abs(this.vy[i]) < 1.2 && this.vx[i] * this.vx[i] + this.vz[i] * this.vz[i] < 0.5) {
            this.resting[i] = 1;
            this.vy[i] = 0;
            // settle flat onto the voxel top
            ny = Math.floor((ny - half) * inv + 1) * vs + half;
            this.rx[i] = Math.round(this.rx[i] / 1.5708) * 1.5708;
            this.rz[i] = Math.round(this.rz[i] / 1.5708) * 1.5708;
          } else ny = this.py[i];
        } else {
          this.vy[i] = 0;
          ny = this.py[i];
        }
      }
      // Z
      let nz = this.pz[i] + this.vz[i] * dt;
      if (solid(nx, ny, nz)) { this.vz[i] *= -0.3; nz = this.pz[i]; }
      this.px[i] = nx; this.py[i] = ny; this.pz[i] = nz;
      this.rx[i] += this.wx[i] * dt; this.ry[i] += this.wy[i] * dt; this.rz[i] += this.wz[i] * dt;
    }
    // upload
    const im = this.mesh.instanceMatrix.array as Float32Array;
    const ic = this.mesh.instanceColor!.array as Float32Array;
    for (let i = 0; i < this.count; i++) {
      const fade = Math.min(1, this.life[i] / 0.6);
      const s = this.size[i] * (0.35 + 0.65 * fade);
      this.euler.set(this.rx[i], this.ry[i], this.rz[i]);
      this.quat.setFromEuler(this.euler);
      this.matrix.compose(this.pos.set(this.px[i], this.py[i], this.pz[i]), this.quat, this.scl.set(s, s, s));
      this.matrix.toArray(im, i * 16);
      ic[i * 3] = this.col[i * 3];
      ic[i * 3 + 1] = this.col[i * 3 + 1];
      ic[i * 3 + 2] = this.col[i * 3 + 2];
    }
    this.mesh.count = this.count;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.instanceColor!.needsUpdate = true;
    if (this.count > 0) {
      this.mesh.instanceMatrix.clearUpdateRanges();
      this.mesh.instanceMatrix.addUpdateRange(0, this.count * 16);
      this.mesh.instanceColor!.clearUpdateRanges();
      this.mesh.instanceColor!.addUpdateRange(0, this.count * 3);
    }
  }

  /** Turn a resting particle into a rubble voxel if there is room and support. */
  private deposit(i: number): void {
    const w = this.world;
    const inv = 1 / w.vs;
    const x = Math.floor(this.px[i] * inv), y = Math.floor(this.py[i] * inv), z = Math.floor(this.pz[i] * inv);
    if (w.get(x, y, z) !== 0 || !w.isSolid(x, y - 1, z)) return;
    if (this.depositBlocked && this.depositBlocked((x + 0.5) * w.vs, (y + 0.5) * w.vs, (z + 0.5) * w.vs)) return;
    w.set(x, y, z, this.mat[i]);
    this.depositBudget--;
  }
}
