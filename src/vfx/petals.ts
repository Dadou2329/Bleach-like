// Senbonzakura's blades: a swarm of small pink blade-petals simulated on the CPU (each petal springs
// toward its slot in a formation, with damping and a little flutter) and drawn as one InstancedMesh.
// Formations: orbit around the owner, a stream flowing along a curve, a sphere around a target
// (Gōkei), an advancing wave front, a wall, a dome. The owner moves the formation and the petals follow
// with lag — that lag is what makes the motion read as a living flock rather than a rigid shape.
import * as THREE from 'three';

export type Formation =
  | { kind: 'orbit'; center: THREE.Vector3; radius: number; height: number; spin: number }
  | { kind: 'stream'; from: THREE.Vector3; ctrl: THREE.Vector3; to: THREE.Vector3; radius: number; speed: number }
  | { kind: 'sphere'; center: THREE.Vector3; radius: number; spin: number }
  | { kind: 'wave'; origin: THREE.Vector3; dir: THREE.Vector3; width: number; height: number; front: number; depth: number }
  | { kind: 'wall'; center: THREE.Vector3; normal: THREE.Vector3; width: number; height: number }
  | { kind: 'dome'; center: THREE.Vector3; radius: number };

const _t = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _n = new THREE.Vector3();
const _bn = new THREE.Vector3();
const _side = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _r = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const _s = new THREE.Vector3();
const Z = new THREE.Vector3(0, 0, 1);
const UP = new THREE.Vector3(0, 1, 0);

/** Point on the quadratic Bézier from → ctrl → to. */
export function bezier(from: THREE.Vector3, ctrl: THREE.Vector3, to: THREE.Vector3, u: number, out: THREE.Vector3): THREE.Vector3 {
  const a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u;
  return out.set(from.x * a + ctrl.x * b + to.x * c, from.y * a + ctrl.y * b + to.y * c, from.z * a + ctrl.z * b + to.z * c);
}

function bezierTangent(from: THREE.Vector3, ctrl: THREE.Vector3, to: THREE.Vector3, u: number, out: THREE.Vector3): THREE.Vector3 {
  out.set(
    2 * (1 - u) * (ctrl.x - from.x) + 2 * u * (to.x - ctrl.x),
    2 * (1 - u) * (ctrl.y - from.y) + 2 * u * (to.y - ctrl.y),
    2 * (1 - u) * (ctrl.z - from.z) + 2 * u * (to.z - ctrl.z),
  );
  return out.lengthSq() > 1e-8 ? out.normalize() : out.set(0, 0, 1);
}

export class PetalSwarm {
  readonly mesh: THREE.InstancedMesh;
  readonly max: number;
  count = 0;
  formation: Formation;
  /** spring toward the slot and velocity damping */
  stiffness = 20;
  damping = 5.2;
  /** 0..1 global fade (dispersal) */
  alpha = 1;
  private p: Float32Array;
  private v: Float32Array;
  private seed: Float32Array;
  private tint: Float32Array;
  private time = 0;

  constructor(max: number, color = '#F5A9C4') {
    this.max = max;
    this.p = new Float32Array(max * 3);
    this.v = new Float32Array(max * 3);
    this.seed = new Float32Array(max * 4);
    this.tint = new Float32Array(max);
    for (let i = 0; i < max * 4; i++) this.seed[i] = Math.random();
    for (let i = 0; i < max; i++) this.tint[i] = Math.random();
    // a slender blade: a flattened, stretched octahedron
    const geo = new THREE.OctahedronGeometry(1, 0);
    geo.scale(0.032, 0.008, 0.1);
    const mat = new THREE.MeshStandardMaterial({ color, emissive: '#E77FA6', emissiveIntensity: 0.45, roughness: 0.22, metalness: 0.35, flatShading: true });
    this.mesh = new THREE.InstancedMesh(geo, mat, max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3);
    this.mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.formation = { kind: 'orbit', center: new THREE.Vector3(), radius: 1.6, height: 2, spin: 0.8 };
  }

  /** Grow or shrink the swarm; new petals appear at `spawn(i)` (default: their formation slot). */
  setCount(n: number, spawn?: (i: number, out: THREE.Vector3) => THREE.Vector3): void {
    n = Math.max(0, Math.min(this.max, Math.floor(n)));
    for (let i = this.count; i < n; i++) {
      const o = spawn ? spawn(i, _t) : this.slot(i, _t);
      this.p[i * 3] = o.x; this.p[i * 3 + 1] = o.y; this.p[i * 3 + 2] = o.z;
      this.v[i * 3] = (Math.random() - 0.5) * 4; this.v[i * 3 + 1] = Math.random() * 3; this.v[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    this.count = n;
    this.mesh.count = n;
  }

  /** Position of petal i (world). */
  pos(i: number, out: THREE.Vector3): THREE.Vector3 {
    return out.set(this.p[i * 3], this.p[i * 3 + 1], this.p[i * 3 + 2]);
  }

  /** Where petal i wants to be in the current formation. */
  slot(i: number, out: THREE.Vector3): THREE.Vector3 {
    const s0 = this.seed[i * 4], s1 = this.seed[i * 4 + 1], s2 = this.seed[i * 4 + 2], s3 = this.seed[i * 4 + 3];
    const t = this.time;
    const f = this.formation;
    switch (f.kind) {
      case 'orbit': {
        const a = s0 * Math.PI * 2 + t * f.spin * (0.6 + 0.8 * s1);
        const r = f.radius * (0.45 + 0.55 * Math.sqrt(s1));
        const y = (s2 - 0.25) * f.height + Math.sin(t * 1.3 + s3 * 6.28) * 0.25;
        return out.set(f.center.x + Math.cos(a) * r, f.center.y + y, f.center.z + Math.sin(a) * r);
      }
      case 'stream': {
        const u = (s0 + t * f.speed * (0.8 + 0.4 * s3)) % 1;
        bezier(f.from, f.ctrl, f.to, u, out);
        bezierTangent(f.from, f.ctrl, f.to, u, _a);
        _n.crossVectors(_a, UP);
        if (_n.lengthSq() < 1e-4) _n.set(1, 0, 0);
        _n.normalize();
        _bn.crossVectors(_a, _n).normalize();
        const ang = s1 * Math.PI * 2 + t * 4;
        const rad = f.radius * Math.sqrt(s2) * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, u * 1.25)));
        return out.addScaledVector(_n, Math.cos(ang) * rad).addScaledVector(_bn, Math.sin(ang) * rad);
      }
      case 'sphere': {
        const th = s0 * Math.PI * 2 + t * f.spin * (0.7 + 0.6 * s3);
        const ph = Math.acos(2 * s1 - 1);
        const r = f.radius * (0.88 + 0.24 * s2);
        return out.set(f.center.x + Math.sin(ph) * Math.cos(th) * r, f.center.y + Math.cos(ph) * r, f.center.z + Math.sin(ph) * Math.sin(th) * r);
      }
      case 'dome': {
        const th = s0 * Math.PI * 2 + t * 1.8;
        const ph = Math.acos(s1) * 0.98;
        const r = f.radius * (0.9 + 0.2 * s2);
        return out.set(f.center.x + Math.sin(ph) * Math.cos(th) * r, f.center.y + Math.cos(ph) * r - 0.3, f.center.z + Math.sin(ph) * Math.sin(th) * r);
      }
      case 'wave': {
        _side.set(f.dir.z, 0, -f.dir.x).normalize();
        const curl = Math.sin(s0 * 12 + t * 3) * 0.4;
        const z = f.front - s2 * s2 * f.depth;
        const y = s1 * s1 * f.height * (1 - 0.35 * Math.abs(s0 - 0.5) * 2) + curl;
        return out.copy(f.origin).addScaledVector(_side, (s0 - 0.5) * f.width).addScaledVector(f.dir, z + Math.sin(t * 5 + s3 * 9) * 0.3).setY(f.origin.y + y);
      }
      case 'wall': {
        _side.crossVectors(UP, f.normal).normalize();
        const swirl = t * 2 + s3 * 6.28;
        return out.copy(f.center).addScaledVector(_side, (s0 - 0.5) * f.width + Math.cos(swirl) * 0.2)
          .addScaledVector(UP, (s1 - 0.5) * f.height + Math.sin(swirl) * 0.2).addScaledVector(f.normal, (s2 - 0.5) * 0.5);
      }
    }
  }

  update(dt: number): void {
    this.time += dt;
    const k = this.stiffness, c = this.damping;
    const damp = Math.exp(-c * dt);
    for (let i = 0; i < this.count; i++) {
      this.slot(i, _t);
      const j = i * 3;
      const s3 = this.seed[i * 4 + 3];
      // springs + flutter
      const fx = (_t.x - this.p[j]) * k + Math.sin(this.time * 7 + s3 * 40) * 1.5;
      const fy = (_t.y - this.p[j + 1]) * k + Math.cos(this.time * 6 + s3 * 31) * 1.5;
      const fz = (_t.z - this.p[j + 2]) * k + Math.sin(this.time * 8 + s3 * 17) * 1.5;
      this.v[j] = (this.v[j] + fx * dt) * damp;
      this.v[j + 1] = (this.v[j + 1] + fy * dt) * damp;
      this.v[j + 2] = (this.v[j + 2] + fz * dt) * damp;
      this.p[j] += this.v[j] * dt;
      this.p[j + 1] += this.v[j + 1] * dt;
      this.p[j + 2] += this.v[j + 2] * dt;
    }
  }

  /** Write instance transforms (blades align with their velocity and roll as they fly) and glints. */
  render(time: number): void {
    const im = this.mesh.instanceMatrix.array as Float32Array;
    const ic = this.mesh.instanceColor!.array as Float32Array;
    const a = this.alpha;
    for (let i = 0; i < this.count; i++) {
      const j = i * 3;
      _a.set(this.v[j], this.v[j + 1], this.v[j + 2]);
      const sp = _a.length();
      if (sp > 1e-3) _q.setFromUnitVectors(Z, _a.divideScalar(sp));
      else _q.identity();
      _r.setFromAxisAngle(Z, time * (6 + this.tint[i] * 10) + this.seed[i * 4] * 6.28);
      _q.multiply(_r);
      const sc = a * (0.8 + this.tint[i] * 0.5);
      _m.compose(_b.set(this.p[j], this.p[j + 1], this.p[j + 2]), _q, _s.set(sc, sc, sc * (1 + Math.min(1.5, sp * 0.04))));
      _m.toArray(im, i * 16);
      // pink with white blades scattered through, and glints that flicker
      const w = this.tint[i];
      const glint = Math.sin(time * 9 + this.seed[i * 4 + 1] * 50) > 0.96 ? 2.2 : 1;
      ic[j] = (0.95 + w * 0.05) * glint;
      ic[j + 1] = (0.72 + w * 0.26) * glint;
      ic[j + 2] = (0.82 + w * 0.16) * glint;
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.instanceColor!.needsUpdate = true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
