// Signed distance shapes for voxel model authoring. Units are whatever the caller uses consistently
// (the model DSL works in voxels of the model resolution). Only the sign matters for rasterisation;
// magnitudes matter for smooth unions and dilation, so shapes keep them roughly metric.
import * as THREE from 'three';

export type V3 = readonly [number, number, number];
export type V2 = readonly [number, number];

export interface Sdf {
  /** signed distance (negative inside) */
  d(x: number, y: number, z: number): number;
  /** conservative bounds */
  min: [number, number, number];
  max: [number, number, number];
}

const INF = 1e9;

/** Inverse rotation (transpose) of an XYZ Euler rotation in degrees, row-major 3×3. */
function invRot(rot?: V3): Float64Array | null {
  if (!rot || (rot[0] === 0 && rot[1] === 0 && rot[2] === 0)) return null;
  const m = new THREE.Matrix4().makeRotationFromEuler(
    new THREE.Euler(rot[0] * THREE.MathUtils.DEG2RAD, rot[1] * THREE.MathUtils.DEG2RAD, rot[2] * THREE.MathUtils.DEG2RAD, 'XYZ'),
  );
  const e = m.elements; // column-major
  // transpose of the 3×3 rotation, stored row-major: row i = column i of R
  return new Float64Array([e[0], e[1], e[2], e[4], e[5], e[6], e[8], e[9], e[10]]);
}

function rotBounds(c: V3, ext: V3, rot?: V3): { min: [number, number, number]; max: [number, number, number] } {
  if (!rot || (rot[0] === 0 && rot[1] === 0 && rot[2] === 0))
    return { min: [c[0] - ext[0], c[1] - ext[1], c[2] - ext[2]], max: [c[0] + ext[0], c[1] + ext[1], c[2] + ext[2]] };
  const m = new THREE.Matrix4().makeRotationFromEuler(
    new THREE.Euler(rot[0] * THREE.MathUtils.DEG2RAD, rot[1] * THREE.MathUtils.DEG2RAD, rot[2] * THREE.MathUtils.DEG2RAD, 'XYZ'),
  );
  const e = m.elements;
  const hx = Math.abs(e[0]) * ext[0] + Math.abs(e[4]) * ext[1] + Math.abs(e[8]) * ext[2];
  const hy = Math.abs(e[1]) * ext[0] + Math.abs(e[5]) * ext[1] + Math.abs(e[9]) * ext[2];
  const hz = Math.abs(e[2]) * ext[0] + Math.abs(e[6]) * ext[1] + Math.abs(e[10]) * ext[2];
  return { min: [c[0] - hx, c[1] - hy, c[2] - hz], max: [c[0] + hx, c[1] + hy, c[2] + hz] };
}

export function sphere(c: V3, r: number): Sdf {
  const [cx, cy, cz] = c;
  return {
    d: (x, y, z) => Math.hypot(x - cx, y - cy, z - cz) - r,
    min: [cx - r, cy - r, cz - r],
    max: [cx + r, cy + r, cz + r],
  };
}

/** Ellipsoid (approximate distance, exact sign). */
export function ellipsoid(c: V3, r: V3, rot?: V3): Sdf {
  const [cx, cy, cz] = c;
  const [rx, ry, rz] = r;
  const R = invRot(rot);
  const rmin = Math.min(rx, ry, rz);
  const b = rotBounds(c, r, rot);
  return {
    d: (x, y, z) => {
      let px = x - cx, py = y - cy, pz = z - cz;
      if (R) {
        const qx = R[0] * px + R[1] * py + R[2] * pz;
        const qy = R[3] * px + R[4] * py + R[5] * pz;
        const qz = R[6] * px + R[7] * py + R[8] * pz;
        px = qx; py = qy; pz = qz;
      }
      const k = Math.hypot(px / rx, py / ry, pz / rz);
      return (k - 1) * rmin;
    },
    ...b,
  };
}

/** Box with half extents, optional XYZ Euler rotation (deg) and corner rounding. */
export function box(c: V3, half: V3, opts: { rot?: V3; round?: number } = {}): Sdf {
  const [cx, cy, cz] = c;
  const rr = opts.round ?? 0;
  const hx = half[0] - rr, hy = half[1] - rr, hz = half[2] - rr;
  const R = invRot(opts.rot);
  const b = rotBounds(c, half, opts.rot);
  return {
    d: (x, y, z) => {
      let px = x - cx, py = y - cy, pz = z - cz;
      if (R) {
        const qx = R[0] * px + R[1] * py + R[2] * pz;
        const qy = R[3] * px + R[4] * py + R[5] * pz;
        const qz = R[6] * px + R[7] * py + R[8] * pz;
        px = qx; py = qy; pz = qz;
      }
      const qx = Math.abs(px) - hx, qy = Math.abs(py) - hy, qz = Math.abs(pz) - hz;
      const ox = Math.max(qx, 0), oy = Math.max(qy, 0), oz = Math.max(qz, 0);
      return Math.hypot(ox, oy, oz) + Math.min(Math.max(qx, qy, qz), 0) - rr;
    },
    ...b,
  };
}

/** Axis-aligned box from min/max corners (inclusive-exclusive in voxel terms when used with integer coords). */
export function aabb(min: V3, max: V3, round = 0): Sdf {
  return box(
    [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2],
    [(max[0] - min[0]) / 2, (max[1] - min[1]) / 2, (max[2] - min[2]) / 2],
    { round },
  );
}

/** Tapered capsule ("round cone") from a (radius ra) to b (radius rb). */
export function capsule(a: V3, b: V3, ra: number, rb = ra): Sdf {
  const [ax, ay, az] = a;
  const bax = b[0] - ax, bay = b[1] - ay, baz = b[2] - az;
  const l2 = bax * bax + bay * bay + baz * baz || 1e-9;
  const rm = Math.max(ra, rb);
  return {
    d: (x, y, z) => {
      const px = x - ax, py = y - ay, pz = z - az;
      let t = (px * bax + py * bay + pz * baz) / l2;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      return Math.hypot(px - bax * t, py - bay * t, pz - baz * t) - (ra + (rb - ra) * t);
    },
    min: [Math.min(ax, b[0]) - rm, Math.min(ay, b[1]) - rm, Math.min(az, b[2]) - rm],
    max: [Math.max(ax, b[0]) + rm, Math.max(ay, b[1]) + rm, Math.max(az, b[2]) + rm],
  };
}

/** Flat-capped cylinder from a to b, radius r (optionally tapering to r1), optional edge rounding. */
export function cylinder(a: V3, b: V3, r: number, r1 = r, round = 0): Sdf {
  const [ax, ay, az] = a;
  const bax = b[0] - ax, bay = b[1] - ay, baz = b[2] - az;
  const len = Math.hypot(bax, bay, baz) || 1e-9;
  const ux = bax / len, uy = bay / len, uz = baz / len;
  const rm = Math.max(r, r1);
  return {
    d: (x, y, z) => {
      const px = x - ax, py = y - ay, pz = z - az;
      const t = px * ux + py * uy + pz * uz;
      const rad = Math.hypot(px - ux * t, py - uy * t, pz - uz * t);
      const rt = r + (r1 - r) * Math.min(1, Math.max(0, t / len));
      const dr = rad - (rt - round);
      const dh = Math.abs(t - len / 2) - (len / 2 - round);
      return Math.min(Math.max(dr, dh), 0) + Math.hypot(Math.max(dr, 0), Math.max(dh, 0)) - round;
    },
    min: [Math.min(ax, b[0]) - rm, Math.min(ay, b[1]) - rm, Math.min(az, b[2]) - rm],
    max: [Math.max(ax, b[0]) + rm, Math.max(ay, b[1]) + rm, Math.max(az, b[2]) + rm],
  };
}

/** Torus: ring of major radius R in the local XZ plane, tube radius r. */
export function torus(c: V3, R: number, r: number, rot?: V3): Sdf {
  const [cx, cy, cz] = c;
  const Ri = invRot(rot);
  const b = rotBounds(c, [R + r, r, R + r], rot);
  return {
    d: (x, y, z) => {
      let px = x - cx, py = y - cy, pz = z - cz;
      if (Ri) {
        const qx = Ri[0] * px + Ri[1] * py + Ri[2] * pz;
        const qy = Ri[3] * px + Ri[4] * py + Ri[5] * pz;
        const qz = Ri[6] * px + Ri[7] * py + Ri[8] * pz;
        px = qx; py = qy; pz = qz;
      }
      return Math.hypot(Math.hypot(px, pz) - R, py) - r;
    },
    ...b,
  };
}

/** 2D polygon signed distance (iq). */
function polyDist(px: number, py: number, v: Float64Array, n: number): number {
  let d = (px - v[0]) ** 2 + (py - v[1]) ** 2;
  let s = 1;
  for (let i = 0, j = n - 1; i < n; j = i, i++) {
    const vix = v[i * 2], viy = v[i * 2 + 1], vjx = v[j * 2], vjy = v[j * 2 + 1];
    const ex = vjx - vix, ey = vjy - viy;
    const wx = px - vix, wy = py - viy;
    let t = (wx * ex + wy * ey) / (ex * ex + ey * ey || 1e-9);
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const bx = wx - ex * t, by = wy - ey * t;
    d = Math.min(d, bx * bx + by * by);
    const c1 = py >= viy, c2 = py < vjy, c3 = ex * wy > ey * wx;
    if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
  }
  return s * Math.sqrt(d);
}

/**
 * Extruded polygon. The polygon lives in the plane spanned by unit axes u, v through origin o;
 * it is extruded ±halfDepth along w = u × v. Polygon points are (u, v) pairs.
 */
export function prism(poly: readonly V2[], o: V3, u: V3, v: V3, halfDepth: number, round = 0): Sdf {
  const n = poly.length;
  const pv = new Float64Array(n * 2);
  poly.forEach((p, i) => { pv[i * 2] = p[0]; pv[i * 2 + 1] = p[1]; });
  const w: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const mn: [number, number, number] = [INF, INF, INF], mx: [number, number, number] = [-INF, -INF, -INF];
  for (const p of poly)
    for (const s of [-1, 1])
      for (let k = 0; k < 3; k++) {
        const val = o[k] + u[k] * p[0] + v[k] * p[1] + w[k] * halfDepth * s;
        mn[k] = Math.min(mn[k], val - round);
        mx[k] = Math.max(mx[k], val + round);
      }
  return {
    d: (x, y, z) => {
      const px = x - o[0], py = y - o[1], pz = z - o[2];
      const pu = px * u[0] + py * u[1] + pz * u[2];
      const pvv = px * v[0] + py * v[1] + pz * v[2];
      const pw = px * w[0] + py * w[1] + pz * w[2];
      const d2 = polyDist(pu, pvv, pv, n);
      const dw = Math.abs(pw) - halfDepth;
      return Math.min(Math.max(d2, dw), 0) + Math.hypot(Math.max(d2, 0), Math.max(dw, 0)) - round;
    },
    min: mn,
    max: mx,
  };
}

/** Swept tube along a polyline with per-point radii (union of round cones). */
export function tube(pts: readonly V3[], radii: readonly number[]): Sdf {
  const segs: Sdf[] = [];
  for (let i = 0; i + 1 < pts.length; i++) segs.push(capsule(pts[i], pts[i + 1], radii[i], radii[i + 1]));
  return union(...segs);
}

/** Catmull-Rom resampling of control points into a smooth polyline (for hair locks, tails, coat tatters). */
export function smoothPath(ctrl: readonly V3[], perSeg = 4): V3[] {
  if (ctrl.length < 3) return [...ctrl];
  const out: V3[] = [];
  for (let i = 0; i + 1 < ctrl.length; i++) {
    const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    for (let s = 0; s < perSeg; s++) {
      const t = s / perSeg, t2 = t * t, t3 = t2 * t;
      const f = (k: number) =>
        0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      out.push([f(0), f(1), f(2)]);
    }
  }
  out.push(ctrl[ctrl.length - 1]);
  return out;
}

/** Half-space: inside where dot(x − p, n) < 0. Unbounded; use inside intersect/subtract. */
export function halfSpace(p: V3, n: V3): Sdf {
  const l = Math.hypot(n[0], n[1], n[2]) || 1;
  const nx = n[0] / l, ny = n[1] / l, nz = n[2] / l;
  return {
    d: (x, y, z) => (x - p[0]) * nx + (y - p[1]) * ny + (z - p[2]) * nz,
    min: [-INF, -INF, -INF],
    max: [INF, INF, INF],
  };
}

export function union(...s: Sdf[]): Sdf {
  if (s.length === 1) return s[0];
  const mn: [number, number, number] = [INF, INF, INF], mx: [number, number, number] = [-INF, -INF, -INF];
  for (const a of s)
    for (let k = 0; k < 3; k++) {
      mn[k] = Math.min(mn[k], a.min[k]);
      mx[k] = Math.max(mx[k], a.max[k]);
    }
  return {
    d: (x, y, z) => {
      let d = INF;
      for (let i = 0; i < s.length; i++) {
        const v = s[i].d(x, y, z);
        if (v < d) d = v;
      }
      return d;
    },
    min: mn,
    max: mx,
  };
}

/** Polynomial smooth union with blend radius k. */
export function blend(k: number, ...s: Sdf[]): Sdf {
  const u = union(...s);
  const mn = u.min.map((v) => v - k) as [number, number, number];
  const mx = u.max.map((v) => v + k) as [number, number, number];
  return {
    d: (x, y, z) => {
      let d = s[0].d(x, y, z);
      for (let i = 1; i < s.length; i++) {
        const b = s[i].d(x, y, z);
        const h = Math.max(k - Math.abs(d - b), 0) / k;
        d = Math.min(d, b) - h * h * k * 0.25;
      }
      return d;
    },
    min: mn,
    max: mx,
  };
}

export function intersect(...s: Sdf[]): Sdf {
  const mn: [number, number, number] = [-INF, -INF, -INF], mx: [number, number, number] = [INF, INF, INF];
  for (const a of s)
    for (let k = 0; k < 3; k++) {
      mn[k] = Math.max(mn[k], a.min[k]);
      mx[k] = Math.min(mx[k], a.max[k]);
    }
  return {
    d: (x, y, z) => {
      let d = -INF;
      for (let i = 0; i < s.length; i++) {
        const v = s[i].d(x, y, z);
        if (v > d) d = v;
      }
      return d;
    },
    min: mn,
    max: mx,
  };
}

export function subtract(a: Sdf, ...cut: Sdf[]): Sdf {
  return {
    d: (x, y, z) => {
      let d = a.d(x, y, z);
      for (let i = 0; i < cut.length; i++) d = Math.max(d, -cut[i].d(x, y, z));
      return d;
    },
    min: a.min,
    max: a.max,
  };
}

/** Grow (positive r) or shrink a shape. */
export function offset(a: Sdf, r: number): Sdf {
  return {
    d: (x, y, z) => a.d(x, y, z) - r,
    min: a.min.map((v) => v - Math.max(0, r)) as [number, number, number],
    max: a.max.map((v) => v + Math.max(0, r)) as [number, number, number],
  };
}

/** Hollow shell of thickness t (inside surface of a). */
export function shell(a: Sdf, t: number): Sdf {
  return {
    d: (x, y, z) => Math.abs(a.d(x, y, z) + t / 2) - t / 2,
    min: a.min,
    max: a.max,
  };
}

export function translate(a: Sdf, t: V3): Sdf {
  return {
    d: (x, y, z) => a.d(x - t[0], y - t[1], z - t[2]),
    min: [a.min[0] + t[0], a.min[1] + t[1], a.min[2] + t[2]],
    max: [a.max[0] + t[0], a.max[1] + t[1], a.max[2] + t[2]],
  };
}

/** Mirror across the x = 0 plane. */
export function mirrorX(a: Sdf): Sdf {
  return {
    d: (x, y, z) => a.d(-x, y, z),
    min: [-a.max[0], a.min[1], a.min[2]],
    max: [-a.min[0], a.max[1], a.max[2]],
  };
}

/** Rotate a shape about a pivot by XYZ Euler degrees. */
export function rotate(a: Sdf, pivot: V3, rot: V3): Sdf {
  const R = invRot(rot);
  if (!R) return a;
  const ext: V3 = [
    Math.max(Math.abs(a.min[0] - pivot[0]), Math.abs(a.max[0] - pivot[0])),
    Math.max(Math.abs(a.min[1] - pivot[1]), Math.abs(a.max[1] - pivot[1])),
    Math.max(Math.abs(a.min[2] - pivot[2]), Math.abs(a.max[2] - pivot[2])),
  ];
  const b = rotBounds(pivot, ext, rot);
  return {
    d: (x, y, z) => {
      const px = x - pivot[0], py = y - pivot[1], pz = z - pivot[2];
      return a.d(
        pivot[0] + R[0] * px + R[1] * py + R[2] * pz,
        pivot[1] + R[3] * px + R[4] * py + R[5] * pz,
        pivot[2] + R[6] * px + R[7] * py + R[8] * pz,
      );
    },
    ...b,
  };
}

/** Add low-frequency displacement (noise in [-amp, amp]) — for organic surfaces, rocks, fur clumps. */
export function displace(a: Sdf, amp: number, fn: (x: number, y: number, z: number) => number): Sdf {
  return {
    d: (x, y, z) => a.d(x, y, z) + amp * fn(x, y, z),
    min: a.min.map((v) => v - amp) as [number, number, number],
    max: a.max.map((v) => v + amp) as [number, number, number],
  };
}

/** Arbitrary function shape with explicit bounds. */
export function fn(d: (x: number, y: number, z: number) => number, min: V3, max: V3): Sdf {
  return { d, min: [min[0], min[1], min[2]], max: [max[0], max[1], max[2]] };
}

/**
 * Hair spike / horn / claw: a tapered blade from `base` along `dir` with an elliptical cross-section
 * (radii ra along `side`, rb along dir × side), optional bend (added along the length as t²) and
 * taper exponent (1 = straight cone, <1 = fuller, >1 = needle).
 */
export function spike(base: V3, dir: V3, len: number, ra: number, rb: number, o: { side?: V3; bend?: V3; taper?: number; tip?: number } = {}): Sdf {
  const dl = Math.hypot(dir[0], dir[1], dir[2]) || 1;
  const D = [dir[0] / dl, dir[1] / dl, dir[2] / dl];
  // side axis: given or any perpendicular
  let S = o.side ? [...o.side] : Math.abs(D[1]) < 0.9 ? [D[2], 0, -D[0]] : [1, 0, 0];
  const sd = S[0] * D[0] + S[1] * D[1] + S[2] * D[2];
  S = [S[0] - D[0] * sd, S[1] - D[1] * sd, S[2] - D[2] * sd];
  const sl = Math.hypot(S[0], S[1], S[2]) || 1;
  S = [S[0] / sl, S[1] / sl, S[2] / sl];
  const T = [D[1] * S[2] - D[2] * S[1], D[2] * S[0] - D[0] * S[2], D[0] * S[1] - D[1] * S[0]];
  const B = o.bend ?? [0, 0, 0];
  const taper = o.taper ?? 1;
  const tip = o.tip ?? 0.35;
  const rm = Math.max(ra, rb);
  const ends = [base, [base[0] + D[0] * len + B[0] * len, base[1] + D[1] * len + B[1] * len, base[2] + D[2] * len + B[2] * len]];
  const mn: [number, number, number] = [0, 0, 0], mx: [number, number, number] = [0, 0, 0];
  for (let k = 0; k < 3; k++) {
    mn[k] = Math.min(ends[0][k], ends[1][k]) - rm - 1;
    mx[k] = Math.max(ends[0][k], ends[1][k]) + rm + 1;
  }
  return {
    d: (x, y, z) => {
      const px = x - base[0], py = y - base[1], pz = z - base[2];
      // project on the straight axis, then remove the bend offset at that t
      let t = (px * D[0] + py * D[1] + pz * D[2]) / len;
      const tc = t < 0 ? 0 : t > 1 ? 1 : t;
      const qx = px - (D[0] * tc + B[0] * tc * tc) * len;
      const qy = py - (D[1] * tc + B[1] * tc * tc) * len;
      const qz = pz - (D[2] * tc + B[2] * tc * tc) * len;
      const u = qx * S[0] + qy * S[1] + qz * S[2];
      const v = qx * T[0] + qy * T[1] + qz * T[2];
      const w = qx * D[0] + qy * D[1] + qz * D[2];
      const k = Math.max(0, Math.pow(1 - tc, taper));
      const a = Math.max(tip, ra * k), b = Math.max(tip, rb * k);
      const radial = (Math.hypot(u / a, v / b) - 1) * Math.min(a, b);
      // caps
      const cap = t < 0 ? -t * len : t > 1 ? (t - 1) * len : Math.abs(w) * 0;
      return Math.max(radial, cap > 0 ? cap : -1e9);
    },
    min: mn,
    max: mx,
  };
}
