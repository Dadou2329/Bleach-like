// Damage shapes: volumes that carve / affect voxels. All in metres.
//
// Every shape reports an AABB and a signed distance, and can enumerate the voxels it covers.
// Thin or long shapes (slices, beams, crescents) enumerate parametrically instead of scanning
// their whole AABB, so a 40 m diagonal cut stays cheap.
import * as THREE from 'three';

export type VoxelVisitor = (x: number, y: number, z: number, depth: number) => void;

export interface DamageShape {
  readonly kind: string;
  /** centre used for debris direction and falloff */
  readonly center: THREE.Vector3;
  aabb(out: THREE.Box3): THREE.Box3;
  /** signed distance (m), negative inside */
  sdf(p: THREE.Vector3): number;
  /**
   * Visit every voxel whose centre is inside the shape exactly once.
   * `depth` ∈ [0,1]: 0 at the surface, 1 at the core (drives power falloff).
   */
  forEachVoxel(vs: number, visit: VoxelVisitor): void;
}

const _p = new THREE.Vector3();
const _box = new THREE.Box3();

/** Generic AABB scan using the SDF. `core` = distance at which depth reaches 1. */
function scanAabb(shape: DamageShape, vs: number, core: number, visit: VoxelVisitor): void {
  shape.aabb(_box);
  const x0 = Math.floor(_box.min.x / vs), y0 = Math.floor(_box.min.y / vs), z0 = Math.floor(_box.min.z / vs);
  const x1 = Math.ceil(_box.max.x / vs), y1 = Math.ceil(_box.max.y / vs), z1 = Math.ceil(_box.max.z / vs);
  for (let z = z0; z <= z1; z++)
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        _p.set((x + 0.5) * vs, (y + 0.5) * vs, (z + 0.5) * vs);
        const d = shape.sdf(_p);
        if (d <= 0) visit(x, y, z, Math.min(1, -d / core));
      }
}

/** Dedupe helper for parametric enumeration. */
class VisitedSet {
  private set = new Set<number>();
  key(x: number, y: number, z: number): number {
    // 17 bits per axis (coords within ±65536) → < 2^51, exact in float64
    return ((x + 65536) * 131072 + (y + 65536)) * 131072 + (z + 65536);
  }
  add(x: number, y: number, z: number): boolean {
    const k = this.key(x, y, z);
    if (this.set.has(k)) return false;
    this.set.add(k);
    return true;
  }
}

export class SphereShape implements DamageShape {
  readonly kind = 'sphere';
  constructor(readonly center: THREE.Vector3, readonly radius: number, readonly squashY = 1) {}
  aabb(out: THREE.Box3): THREE.Box3 {
    const r = this.radius;
    return out.set(
      _p.set(this.center.x - r, this.center.y - r * this.squashY, this.center.z - r).clone(),
      _p.set(this.center.x + r, this.center.y + r * this.squashY, this.center.z + r).clone(),
    );
  }
  sdf(p: THREE.Vector3): number {
    const dx = p.x - this.center.x, dy = (p.y - this.center.y) / this.squashY, dz = p.z - this.center.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz) - this.radius;
  }
  forEachVoxel(vs: number, visit: VoxelVisitor): void {
    scanAabb(this, vs, this.radius * 0.8, visit);
  }
}

/** Capsule / beam between a and b. Long beams are enumerated along their axis. */
export class CapsuleShape implements DamageShape {
  readonly kind = 'capsule';
  readonly center = new THREE.Vector3();
  private ab = new THREE.Vector3();
  constructor(readonly a: THREE.Vector3, readonly b: THREE.Vector3, readonly radius: number) {
    this.center.copy(a).add(b).multiplyScalar(0.5);
    this.ab.subVectors(b, a);
  }
  aabb(out: THREE.Box3): THREE.Box3 {
    out.makeEmpty();
    out.expandByPoint(this.a);
    out.expandByPoint(this.b);
    return out.expandByScalar(this.radius);
  }
  sdf(p: THREE.Vector3): number {
    const abl = this.ab.lengthSq();
    let t = abl > 0 ? ((p.x - this.a.x) * this.ab.x + (p.y - this.a.y) * this.ab.y + (p.z - this.a.z) * this.ab.z) / abl : 0;
    t = Math.max(0, Math.min(1, t));
    const dx = p.x - (this.a.x + this.ab.x * t), dy = p.y - (this.a.y + this.ab.y * t), dz = p.z - (this.a.z + this.ab.z * t);
    return Math.sqrt(dx * dx + dy * dy + dz * dz) - this.radius;
  }
  forEachVoxel(vs: number, visit: VoxelVisitor): void {
    const len = this.ab.length();
    if (len < this.radius * 6) {
      scanAabb(this, vs, this.radius * 0.8, visit);
      return;
    }
    // march along the axis, scanning a small box per step
    const seen = new VisitedSet();
    const step = vs;
    const n = Math.ceil(len / step);
    const r = this.radius;
    const rv = Math.ceil(r / vs) + 1;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const cx = this.a.x + this.ab.x * t, cy = this.a.y + this.ab.y * t, cz = this.a.z + this.ab.z * t;
      const bx = Math.floor(cx / vs), by = Math.floor(cy / vs), bz = Math.floor(cz / vs);
      for (let z = bz - rv; z <= bz + rv; z++)
        for (let y = by - rv; y <= by + rv; y++)
          for (let x = bx - rv; x <= bx + rv; x++) {
            _p.set((x + 0.5) * vs, (y + 0.5) * vs, (z + 0.5) * vs);
            const d = this.sdf(_p);
            if (d <= 0 && seen.add(x, y, z)) visit(x, y, z, Math.min(1, -d / (r * 0.8)));
          }
    }
  }
}

/**
 * Oriented box. Thin/large boxes (slices) enumerate over their local grid.
 * `rot` maps local axes (x=u, y=v, z=w) into world.
 */
export class BoxShape implements DamageShape {
  readonly kind = 'box';
  private inv = new THREE.Quaternion();
  private axes: THREE.Vector3[];
  constructor(readonly center: THREE.Vector3, readonly half: THREE.Vector3, readonly rot: THREE.Quaternion = new THREE.Quaternion()) {
    this.inv.copy(rot).invert();
    this.axes = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)].map((v) => v.applyQuaternion(rot));
  }
  aabb(out: THREE.Box3): THREE.Box3 {
    const e = new THREE.Vector3();
    for (let i = 0; i < 3; i++) {
      const a = this.axes[i];
      const h = [this.half.x, this.half.y, this.half.z][i];
      e.x += Math.abs(a.x) * h;
      e.y += Math.abs(a.y) * h;
      e.z += Math.abs(a.z) * h;
    }
    return out.set(this.center.clone().sub(e), this.center.clone().add(e));
  }
  sdf(p: THREE.Vector3): number {
    const l = _p.copy(p).sub(this.center).applyQuaternion(this.inv);
    const qx = Math.abs(l.x) - this.half.x, qy = Math.abs(l.y) - this.half.y, qz = Math.abs(l.z) - this.half.z;
    const ox = Math.max(qx, 0), oy = Math.max(qy, 0), oz = Math.max(qz, 0);
    return Math.sqrt(ox * ox + oy * oy + oz * oz) + Math.min(Math.max(qx, Math.max(qy, qz)), 0);
  }
  forEachVoxel(vs: number, visit: VoxelVisitor): void {
    const minHalf = Math.min(this.half.x, this.half.y, this.half.z);
    const vol = this.half.x * this.half.y * this.half.z * 8;
    const aabbVol = this.aabb(_box).getSize(new THREE.Vector3());
    if (aabbVol.x * aabbVol.y * aabbVol.z < vol * 4 || vol / (vs * vs * vs) < 20000) {
      scanAabb(this, vs, Math.max(vs, minHalf), visit);
      return;
    }
    // parametric: step through the local grid at half-voxel spacing
    const seen = new VisitedSet();
    const s = vs * 0.5;
    const nx = Math.ceil(this.half.x / s), ny = Math.ceil(this.half.y / s), nz = Math.ceil(this.half.z / s);
    const [ax, ay, az] = this.axes;
    for (let k = -nz; k <= nz; k++)
      for (let j = -ny; j <= ny; j++)
        for (let i = -nx; i <= nx; i++) {
          const lx = Math.max(-this.half.x, Math.min(this.half.x, i * s));
          const ly = Math.max(-this.half.y, Math.min(this.half.y, j * s));
          const lz = Math.max(-this.half.z, Math.min(this.half.z, k * s));
          const px = this.center.x + ax.x * lx + ay.x * ly + az.x * lz;
          const py = this.center.y + ax.y * lx + ay.y * ly + az.y * lz;
          const pz = this.center.z + ax.z * lx + ay.z * ly + az.z * lz;
          const x = Math.floor(px / vs), y = Math.floor(py / vs), z = Math.floor(pz / vs);
          if (!seen.add(x, y, z)) continue;
          // depth by distance to the thin axis surface
          const depth = Math.min(1, Math.min(this.half.x - Math.abs(lx), this.half.y - Math.abs(ly), this.half.z - Math.abs(lz)) / Math.max(vs, minHalf));
          visit(x, y, z, depth);
        }
  }
}

/**
 * Crescent ("Getsuga"): an arc band of radius R around `center`, lying in the plane spanned by
 * `forward` and `side` (normal = forward × side), covering ±halfAngle around `forward`, with radial
 * thickness `thick` (tapering at the tips) and plane width `width`.
 */
export class CrescentShape implements DamageShape {
  readonly kind = 'crescent';
  private nrm = new THREE.Vector3();
  constructor(
    readonly center: THREE.Vector3,
    readonly forward: THREE.Vector3,
    readonly side: THREE.Vector3,
    readonly radius: number,
    readonly halfAngle: number,
    readonly thick: number,
    readonly width: number,
  ) {
    this.forward.normalize();
    this.side.normalize();
    this.nrm.crossVectors(this.forward, this.side).normalize();
  }
  aabb(out: THREE.Box3): THREE.Box3 {
    const r = this.radius + this.thick;
    return out.setFromCenterAndSize(this.center, new THREE.Vector3(r * 2, r * 2, r * 2));
  }
  sdf(p: THREE.Vector3): number {
    const d = _p.copy(p).sub(this.center);
    const pn = d.dot(this.nrm);
    const pf = d.dot(this.forward), ps = d.dot(this.side);
    const ang = Math.atan2(ps, pf);
    const rr = Math.hypot(pf, ps);
    const taper = Math.max(0, 1 - Math.pow(Math.abs(ang) / this.halfAngle, 3));
    if (Math.abs(ang) > this.halfAngle) return Math.abs(ang) - this.halfAngle + 0.5;
    const radial = Math.abs(rr - this.radius) - this.thick * taper;
    return Math.max(radial, Math.abs(pn) - this.width * (0.35 + 0.65 * taper));
  }
  forEachVoxel(vs: number, visit: VoxelVisitor): void {
    const seen = new VisitedSet();
    const s = vs * 0.5;
    const arcLen = this.radius * this.halfAngle * 2;
    const na = Math.ceil(arcLen / s);
    for (let ia = 0; ia <= na; ia++) {
      const ang = -this.halfAngle + (ia / na) * this.halfAngle * 2;
      const taper = Math.max(0, 1 - Math.pow(Math.abs(ang) / this.halfAngle, 3));
      const th = this.thick * taper, wd = this.width * (0.35 + 0.65 * taper);
      const ca = Math.cos(ang), sa = Math.sin(ang);
      const nr = Math.ceil(th / s), nw = Math.ceil(wd / s);
      for (let ir = -nr; ir <= nr; ir++)
        for (let iw = -nw; iw <= nw; iw++) {
          const r = this.radius + Math.max(-th, Math.min(th, ir * s));
          const wv = Math.max(-wd, Math.min(wd, iw * s));
          const px = this.center.x + (this.forward.x * ca + this.side.x * sa) * r + this.nrm.x * wv;
          const py = this.center.y + (this.forward.y * ca + this.side.y * sa) * r + this.nrm.y * wv;
          const pz = this.center.z + (this.forward.z * ca + this.side.z * sa) * r + this.nrm.z * wv;
          const x = Math.floor(px / vs), y = Math.floor(py / vs), z = Math.floor(pz / vs);
          if (!seen.add(x, y, z)) continue;
          const depth = Math.min(1, (th - Math.abs(r - this.radius)) / Math.max(vs, th));
          visit(x, y, z, depth * taper);
        }
    }
  }
}

/** Cone from apex along dir with half-angle and length (shockwaves, Cero muzzle, Respira). */
export class ConeShape implements DamageShape {
  readonly kind = 'cone';
  readonly center = new THREE.Vector3();
  constructor(readonly apex: THREE.Vector3, readonly dir: THREE.Vector3, readonly halfAngle: number, readonly length: number) {
    this.dir.normalize();
    this.center.copy(apex).addScaledVector(dir, length * 0.6);
  }
  aabb(out: THREE.Box3): THREE.Box3 {
    const r = Math.tan(this.halfAngle) * this.length;
    out.makeEmpty();
    out.expandByPoint(this.apex);
    out.expandByPoint(_p.copy(this.apex).addScaledVector(this.dir, this.length));
    return out.expandByScalar(r);
  }
  sdf(p: THREE.Vector3): number {
    const d = _p.copy(p).sub(this.apex);
    const t = d.dot(this.dir);
    if (t < 0 || t > this.length) return 1;
    const radial = Math.sqrt(Math.max(0, d.lengthSq() - t * t));
    return radial - Math.tan(this.halfAngle) * t;
  }
  forEachVoxel(vs: number, visit: VoxelVisitor): void {
    scanAabb(this, vs, Math.tan(this.halfAngle) * this.length * 0.5, visit);
  }
}
