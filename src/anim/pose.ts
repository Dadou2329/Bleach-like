// Skeletal pose: one local rotation per bone (relative to the rest pose) plus a hips translation.
import * as THREE from 'three';

const DEG = Math.PI / 180;
const _e = new THREE.Euler();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();

export class Pose {
  readonly q: Float32Array;
  /** hips offset from rest (metres, parent space of the hips bone) */
  readonly hips = new THREE.Vector3();

  constructor(readonly n: number) {
    this.q = new Float32Array(n * 4);
    this.identity();
  }

  identity(): this {
    for (let i = 0; i < this.n; i++) {
      this.q[i * 4] = 0; this.q[i * 4 + 1] = 0; this.q[i * 4 + 2] = 0; this.q[i * 4 + 3] = 1;
    }
    this.hips.set(0, 0, 0);
    return this;
  }

  copy(p: Pose): this {
    this.q.set(p.q);
    this.hips.copy(p.hips);
    return this;
  }

  get(i: number, out: THREE.Quaternion): THREE.Quaternion {
    return out.set(this.q[i * 4], this.q[i * 4 + 1], this.q[i * 4 + 2], this.q[i * 4 + 3]);
  }

  set(i: number, q: THREE.Quaternion): this {
    this.q[i * 4] = q.x; this.q[i * 4 + 1] = q.y; this.q[i * 4 + 2] = q.z; this.q[i * 4 + 3] = q.w;
    return this;
  }

  /** Set a bone rotation from XYZ Euler degrees. */
  setEuler(i: number, x: number, y: number, z: number): this {
    if (i < 0) return this;
    _q.setFromEuler(_e.set(x * DEG, y * DEG, z * DEG, 'XYZ'));
    return this.set(i, _q);
  }

  /** Post-multiply (local, additive) a rotation in XYZ Euler degrees. */
  addEuler(i: number, x: number, y: number, z: number): this {
    if (i < 0 || (x === 0 && y === 0 && z === 0)) return this;
    this.get(i, _q2);
    _q.setFromEuler(_e.set(x * DEG, y * DEG, z * DEG, 'XYZ'));
    _q2.multiply(_q);
    return this.set(i, _q2);
  }

  /** Pre-multiply (in parent space) a rotation in XYZ Euler degrees. */
  preEuler(i: number, x: number, y: number, z: number): this {
    if (i < 0 || (x === 0 && y === 0 && z === 0)) return this;
    this.get(i, _q2);
    _q.setFromEuler(_e.set(x * DEG, y * DEG, z * DEG, 'XYZ'));
    _q2.premultiply(_q);
    return this.set(i, _q2);
  }

  /**
   * Blend this pose toward `b` by weight w (per-bone weights optional). Uses normalised lerp with
   * hemisphere correction — smooth, cheap and order-independent enough for crossfades.
   */
  blendTo(b: Pose, w: number, boneW?: Float32Array | null, hipsW = 1): this {
    if (w <= 0) return this;
    const a = this.q, bq = b.q;
    for (let i = 0; i < this.n; i++) {
      const wi = boneW ? w * boneW[i] : w;
      if (wi <= 0) continue;
      const o = i * 4;
      if (wi >= 1) {
        a[o] = bq[o]; a[o + 1] = bq[o + 1]; a[o + 2] = bq[o + 2]; a[o + 3] = bq[o + 3];
        continue;
      }
      const dot = a[o] * bq[o] + a[o + 1] * bq[o + 1] + a[o + 2] * bq[o + 2] + a[o + 3] * bq[o + 3];
      const s = dot < 0 ? -wi : wi;
      const k = 1 - wi;
      let x = a[o] * k + bq[o] * s, y = a[o + 1] * k + bq[o + 1] * s, z = a[o + 2] * k + bq[o + 2] * s, ww = a[o + 3] * k + bq[o + 3] * s;
      const l = Math.hypot(x, y, z, ww) || 1;
      x /= l; y /= l; z /= l; ww /= l;
      a[o] = x; a[o + 1] = y; a[o + 2] = z; a[o + 3] = ww;
    }
    this.hips.lerp(b.hips, Math.min(1, w * hipsW));
    return this;
  }
}

export { DEG };
