// Spring bones for secondary motion (sleeves, hakama panels, coat tails, long hair, ribbons).
// Each spring simulates its tail point in world space with verlet integration, pulled toward the
// animated pose, pushed by gravity, kept at bone length and outside collider spheres; the bone is then
// rotated to aim at the simulated tail. Runs after the animator, before rendering.
import * as THREE from 'three';
import type { Rig } from './rig';

export interface SpringDef {
  bone: string;
  /** tail offset in the bone's local rest space (metres) */
  tail: readonly [number, number, number];
  /** pull toward the animated direction (higher = stiffer) */
  stiffness?: number;
  /** fraction of velocity lost per second */
  damping?: number;
  /** gravity on the tail (m/s²) */
  gravity?: number;
  /** max deviation from the animated direction (degrees) */
  limit?: number;
  /** tail collision radius */
  radius?: number;
}

export interface ColliderDef {
  bone: string;
  offset: readonly [number, number, number];
  radius: number;
}

interface SpringState {
  def: Required<Omit<SpringDef, 'bone' | 'tail'>>;
  bone: number;
  tail: THREE.Vector3;
  len: number;
  cur: THREE.Vector3;
  prev: THREE.Vector3;
  init: boolean;
}

const _P = new THREE.Vector3();
const _T = new THREE.Vector3();
const _N = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _wq = new THREE.Quaternion();
const _pq = new THREE.Quaternion();
const _c = new THREE.Vector3();

export class SpringSystem {
  private springs: SpringState[] = [];
  private colliders: { bone: number; offset: THREE.Vector3; radius: number }[] = [];
  /** extra world acceleration (wind, aura updraft) */
  readonly wind = new THREE.Vector3();

  constructor(private rig: Rig, defs: SpringDef[], colliders: ColliderDef[] = []) {
    for (const d of defs) {
      const bi = rig.index(d.bone);
      if (bi < 0) continue;
      const tail = new THREE.Vector3(...d.tail);
      this.springs.push({
        def: {
          stiffness: d.stiffness ?? 60,
          damping: d.damping ?? 4,
          gravity: d.gravity ?? 9,
          limit: d.limit ?? 75,
          radius: d.radius ?? 0.04,
        },
        bone: bi,
        tail,
        len: tail.length(),
        cur: new THREE.Vector3(),
        prev: new THREE.Vector3(),
        init: false,
      });
    }
    // parents before children
    const depth = (i: number): number => (rig.parents[i] < 0 ? 0 : 1 + depth(rig.parents[i]));
    this.springs.sort((a, b) => depth(a.bone) - depth(b.bone));
    for (const c of colliders) {
      const bi = rig.index(c.bone);
      if (bi >= 0) this.colliders.push({ bone: bi, offset: new THREE.Vector3(...c.offset), radius: c.radius });
    }
  }

  reset(): void {
    for (const s of this.springs) s.init = false;
  }

  /** Call after the pose is applied and the rig's world matrices are current. */
  update(dt: number): void {
    if (dt <= 0) return;
    const steps = Math.min(4, Math.max(1, Math.ceil(dt / (1 / 120))));
    const h = dt / steps;
    for (const s of this.springs) {
      const bone = this.rig.bones[s.bone];
      bone.updateMatrixWorld(true);
      bone.getWorldPosition(_P);
      _T.copy(s.tail).applyMatrix4(bone.matrixWorld);
      if (!s.init || s.cur.distanceTo(_T) > s.len * 4 + 0.5) {
        s.cur.copy(_T);
        s.prev.copy(_T);
        s.init = true;
      }
      for (let k = 0; k < steps; k++) {
        // verlet
        _a.subVectors(s.cur, s.prev).multiplyScalar(Math.max(0, 1 - s.def.damping * h));
        _b.subVectors(_T, s.cur).multiplyScalar(s.def.stiffness);
        _b.y -= s.def.gravity;
        _b.add(this.wind);
        s.prev.copy(s.cur);
        s.cur.add(_a).addScaledVector(_b, h * h);
        // length constraint
        _N.subVectors(s.cur, _P);
        const l = _N.length() || 1e-6;
        s.cur.copy(_P).addScaledVector(_N, s.len / l);
        // colliders
        for (const c of this.colliders) {
          _c.copy(c.offset).applyMatrix4(this.rig.bones[c.bone].matrixWorld);
          const r = c.radius + s.def.radius;
          _N.subVectors(s.cur, _c);
          const dl = _N.length();
          if (dl < r && dl > 1e-6) {
            s.cur.copy(_c).addScaledVector(_N, r / dl);
            _N.subVectors(s.cur, _P);
            s.cur.copy(_P).addScaledVector(_N, s.len / (_N.length() || 1e-6));
          }
        }
        // angular limit around the animated direction
        _a.subVectors(_T, _P).normalize();
        _b.subVectors(s.cur, _P).normalize();
        const ang = Math.acos(Math.max(-1, Math.min(1, _a.dot(_b))));
        const lim = (s.def.limit * Math.PI) / 180;
        if (ang > lim) {
          _q.setFromUnitVectors(_a, _b);
          const f = lim / ang;
          _q.slerp(new THREE.Quaternion(), 1 - f);
          s.cur.copy(_a).applyQuaternion(_q).multiplyScalar(s.len).add(_P);
        }
      }
      // aim the bone at the simulated tail
      _a.subVectors(_T, _P).normalize();
      _b.subVectors(s.cur, _P).normalize();
      _q.setFromUnitVectors(_a, _b);
      bone.getWorldQuaternion(_wq);
      _wq.premultiply(_q);
      const parent = bone.parent!;
      parent.getWorldQuaternion(_pq);
      bone.quaternion.copy(_pq.invert().multiply(_wq));
      bone.updateMatrixWorld(true);
    }
  }
}
