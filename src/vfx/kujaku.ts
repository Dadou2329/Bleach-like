// Yumichika's Ruri'iro Kujaku (docs/kits/yumichika.md): peacock-patterned vines pouring from the hilt. A vine is a
// tube rebuilt along a moving path each frame (`VineMesh`): peacock green and teal with gold eye-rings, turning lapis
// once it holds someone, brown as it withers. `PeacockVines` drives them for the kit: lashes and bursts that reach
// out and snap back, the ensnare (vines that coil round a target, buds swelling along them in the victim's reiatsu
// colour as they drink), the bloom (the buds open into flowers), the wither, and the thicket over the ground.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { groundAt } from './iceArts';
import { TEX_GLOW, TEX_PUFF, TEX_RING } from './sprites';

const GREEN = new THREE.Color('#2E8B57');
const TEAL = new THREE.Color('#1FA79A');
const GOLD = new THREE.Color('#E8C14A');
const LAPIS = new THREE.Color('#1E50A2');
const LAPIS_HI = new THREE.Color('#3F6FD1');
const WITHER = new THREE.Color('#6B5B3E');
const PETAL = new THREE.Color('#EAF0FF');

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Color();

/** a tube's colours: bands a and b, a ring colour every fifth ring (peacock by default) */
export interface VineLook {
  a: THREE.Color;
  b: THREE.Color;
  ring: THREE.Color;
  emissive?: string;
  /** the colours it turns while it holds someone (tint > 0) and as it withers (tint < 0) */
  hold?: THREE.Color;
  holdRing?: THREE.Color;
  wither?: THREE.Color;
}
const PEACOCK: VineLook = { a: GREEN, b: TEAL, ring: GOLD };

/** A tube along a path of `segs + 1` points, rebuilt in place each frame. */
export class VineMesh {
  readonly mesh: THREE.Mesh;
  private pos: Float32Array;
  private col: Float32Array;
  private normal = new THREE.Vector3(0, 1, 0);
  /** 0: peacock, 1: lapis (holding), −1: withered */
  tint = 0;
  constructor(scene: THREE.Object3D, readonly segs = 20, readonly radial = 6, readonly r0 = 0.07, readonly r1 = 0.025, readonly look: VineLook = PEACOCK) {
    const n = (segs + 1) * radial;
    this.pos = new Float32Array(n * 3);
    this.col = new Float32Array(n * 3);
    const idx: number[] = [];
    for (let i = 0; i < segs; i++)
      for (let j = 0; j < radial; j++) {
        const a = i * radial + j, b = i * radial + ((j + 1) % radial), c = (i + 1) * radial + j, d = (i + 1) * radial + ((j + 1) % radial);
        idx.push(a, c, b, b, c, d);
      }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    geo.setIndex(idx);
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: new THREE.Color(look.emissive ?? '#0E2A2E') });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = true;
    scene.add(this.mesh);
  }
  /** lay the tube along pts (segs + 1 points) */
  setPath(pts: THREE.Vector3[]): void {
    const S = this.segs, R = this.radial;
    const tan = _v, side = _w, up = _a;
    for (let i = 0; i <= S; i++) {
      const p = pts[i];
      const q = pts[Math.min(S, i + 1)], o = pts[Math.max(0, i - 1)];
      tan.subVectors(q, o);
      if (tan.lengthSq() < 1e-8) tan.set(0, 0, 1);
      tan.normalize();
      // parallel transport of the frame keeps the tube from twisting
      side.crossVectors(tan, this.normal);
      if (side.lengthSq() < 1e-6) side.crossVectors(tan, up.set(1, 0, 0));
      side.normalize();
      this.normal.crossVectors(side, tan).normalize();
      const k = i / S;
      const r = this.r0 + (this.r1 - this.r0) * k;
      // the peacock pattern: green and teal bands, a gold eye-ring every fifth ring
      const ring = i % 5 === 2;
      const base = ring ? this.look.ring : i % 2 ? this.look.b : this.look.a;
      _c.copy(base);
      if (this.tint > 0) _c.lerp(ring ? (this.look.holdRing ?? LAPIS_HI) : (this.look.hold ?? LAPIS), this.tint);
      else if (this.tint < 0) _c.lerp(this.look.wither ?? WITHER, -this.tint);
      for (let j = 0; j < R; j++) {
        const a = (j / R) * Math.PI * 2;
        const cs = Math.cos(a) * r, sn = Math.sin(a) * r;
        const vi = (i * R + j) * 3;
        this.pos[vi] = p.x + side.x * cs + this.normal.x * sn;
        this.pos[vi + 1] = p.y + side.y * cs + this.normal.y * sn;
        this.pos[vi + 2] = p.z + side.z * cs + this.normal.z * sn;
        const shade = 0.8 + 0.2 * Math.sin(a);
        this.col[vi] = _c.r * shade;
        this.col[vi + 1] = _c.g * shade;
        this.col[vi + 2] = _c.b * shade;
      }
    }
    const geo = this.mesh.geometry;
    (geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (geo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    geo.computeVertexNormals();
  }
  set visible(v: boolean) {
    this.mesh.visible = v;
  }
  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

/** a path from a to b bowing sideways by `bow`, cut at fraction `e` of its length, as n + 1 points */
function arcPath(a: THREE.Vector3, b: THREE.Vector3, bow: THREE.Vector3, e: number, n: number, out: THREE.Vector3[]): void {
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * e;
    const u = 1 - t;
    // quadratic Bézier through the bowed midpoint
    out[i].set(
      u * u * a.x + 2 * u * t * (a.x * 0.5 + b.x * 0.5 + bow.x) + t * t * b.x,
      u * u * a.y + 2 * u * t * (a.y * 0.5 + b.y * 0.5 + bow.y) + t * t * b.y,
      u * u * a.z + 2 * u * t * (a.z * 0.5 + b.z * 0.5 + bow.z) + t * t * b.z,
    );
  }
}

interface Lash {
  vine: VineMesh;
  to: THREE.Vector3;
  bow: THREE.Vector3;
  t: number;
  dur: number;
  /** called once with the reach point when it is fully out */
  onReach?: (tip: THREE.Vector3) => void;
  reached: boolean;
}

interface Coil {
  vine: VineMesh;
  bow: THREE.Vector3;
  turns: number;
  phase: number;
  y0: number;
  y1: number;
}

interface Snare {
  o: Fighter;
  coils: Coil[];
  t: number;
  /** buds' fill 0..1 */
  fill: number;
  color: THREE.Color;
  withering: number;
}

interface Thicket {
  vines: VineMesh[];
  paths: THREE.Vector3[][];
  center: THREE.Vector3;
  radius: number;
  t: number;
  dur: number;
}

/**
 * All of Ruri'iro Kujaku's vines for one wielder. `root()` is where they leave the hilt. The kit calls lash / burst /
 * ensnare / bloom / letGo / thicket and reads `snare` (who is held, how full the buds are).
 */
export class PeacockVines implements Projectile {
  done = false;
  private lashes: Lash[] = [];
  snare: Snare | null = null;
  private thickets: Thicket[] = [];
  private pool: VineMesh[] = [];
  private pts: THREE.Vector3[] = [];
  constructor(private g: Game, readonly owner: Fighter, private root: (out: THREE.Vector3) => THREE.Vector3, private look?: VineLook, private r1 = 0.022) {
    for (let i = 0; i <= 24; i++) this.pts.push(new THREE.Vector3());
  }

  private take(r0 = 0.07): VineMesh {
    const v = this.pool.pop() ?? new VineMesh(this.g.engine.gr.scene, 20, 6, r0, this.r1, this.look);
    v.visible = true;
    v.tint = 0;
    return v;
  }

  private give(v: VineMesh): void {
    v.visible = false;
    this.pool.push(v);
  }

  /** one vine out to `to` and back over `dur` seconds */
  lash(to: THREE.Vector3, dur: number, onReach?: (tip: THREE.Vector3) => void): void {
    const from = this.root(_v);
    const d = _w.subVectors(to, from);
    const side = new THREE.Vector3(d.z, 0, -d.x).normalize().multiplyScalar((Math.random() - 0.5) * d.length() * 0.35);
    side.y += d.length() * (0.08 + Math.random() * 0.1);
    this.lashes.push({ vine: this.take(), to: to.clone(), bow: side, t: 0, dur, onReach, reached: false });
  }

  /** wrap a fighter: five vines coil round it */
  ensnare(o: Fighter): void {
    this.letGo(true);
    const coils: Coil[] = [];
    for (let i = 0; i < 5; i++) {
      coils.push({
        vine: this.take(0.065),
        bow: new THREE.Vector3((Math.random() - 0.5) * 1.6, 0.6 + Math.random() * 1.2, (Math.random() - 0.5) * 1.6),
        turns: 1.2 + Math.random() * 0.8,
        phase: (i / 5) * Math.PI * 2,
        y0: 0.15 + i * 0.12,
        y1: 0.75 + Math.random() * 0.2,
      });
    }
    this.snare = { o, coils, t: 0, fill: 0, color: new THREE.Color(o.def.aura.body), withering: 0 };
  }

  /** the vines let the victim go: withering into the hilt (`quick`: no wither, gone at once) */
  letGo(quick = false): void {
    const s = this.snare;
    if (!s) return;
    if (quick) {
      for (const c of s.coils) this.give(c.vine);
      this.snare = null;
      return;
    }
    s.withering = Math.max(s.withering, 0.0001);
  }

  /** the buds open: flowers over the victim (the kit deals the damage) */
  bloom(): void {
    const s = this.snare;
    if (!s) return;
    const glow = this.g.engine.glow;
    for (const c of s.coils)
      for (let i = 6; i <= 20; i += 3) {
        const p = this.coilPoint(s, c, i / 20, _v);
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2;
          glow.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * 2.2, vy: 1 + Math.random(), vz: Math.sin(a) * 2.2, size: 0.18, sizeEnd: 0.32, life: 0.7, r: PETAL.r * 1.2, g: PETAL.g * 1.2, b: PETAL.b * 1.4, alpha: 0.95, alphaEnd: 0, tex: TEX_PUFF, drag: 2.5, gravity: -1.5 });
        }
        glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.25, sizeEnd: 0.9, life: 0.4, r: LAPIS_HI.r * 2.4, g: LAPIS_HI.g * 2.4, b: LAPIS_HI.b * 2.6, alpha: 1, alphaEnd: 0, tex: TEX_RING });
      }
    this.letGo();
  }

  /** vines laid over the ground round a point for `dur` seconds */
  thicket(center: THREE.Vector3, radius: number, dur: number): void {
    const vines: VineMesh[] = [];
    const paths: THREE.Vector3[][] = [];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + Math.random() * 0.4;
      const path: THREE.Vector3[] = [];
      for (let k = 0; k <= 20; k++) {
        const r = (k / 20) * radius;
        const aa = a + Math.sin(k * 0.6 + i) * 0.35;
        const x = center.x + Math.cos(aa) * r, z = center.z + Math.sin(aa) * r;
        const gy = groundAt(this.g, x, center.y + 1.5, z, 4) ?? center.y;
        path.push(new THREE.Vector3(x, gy + 0.06 + Math.abs(Math.sin(k * 0.9 + i)) * 0.12, z));
      }
      const v = this.take(0.08);
      vines.push(v);
      paths.push(path);
    }
    this.thickets.push({ vines, paths, center: center.clone(), radius, t: 0, dur });
  }

  /** is a point inside a live thicket */
  inThicket(p: THREE.Vector3): boolean {
    for (const th of this.thickets) if (th.t < th.dur && Math.hypot(p.x - th.center.x, p.z - th.center.z) < th.radius) return true;
    return false;
  }

  private coilPoint(s: Snare, c: Coil, k: number, out: THREE.Vector3): THREE.Vector3 {
    const o = s.o;
    const from = this.root(_b);
    // the first 40 %: a bowed run from the hilt to the victim's side; the rest: a helix round the body
    const r = o.def.radius + 0.1;
    if (k < 0.4) {
      const t = k / 0.4;
      const a0 = c.phase;
      const end = _a.set(o.pos.x + Math.cos(a0) * r, o.pos.y + o.def.height * c.y0, o.pos.z + Math.sin(a0) * r);
      const u = 1 - t;
      const mx = (from.x + end.x) / 2 + c.bow.x, my = (from.y + end.y) / 2 + c.bow.y, mz = (from.z + end.z) / 2 + c.bow.z;
      return out.set(u * u * from.x + 2 * u * t * mx + t * t * end.x, u * u * from.y + 2 * u * t * my + t * t * end.y, u * u * from.z + 2 * u * t * mz + t * t * end.z);
    }
    const t = (k - 0.4) / 0.6;
    const a = c.phase + t * c.turns * Math.PI * 2;
    const y = o.pos.y + o.def.height * (c.y0 + (c.y1 - c.y0) * t);
    return out.set(o.pos.x + Math.cos(a) * r, y, o.pos.z + Math.sin(a) * r);
  }

  update(dt: number, g: Game): void {
    if (this.owner.dead) {
      this.letGo();
    }
    // lashes: out (ease) then back
    for (let i = this.lashes.length - 1; i >= 0; i--) {
      const l = this.lashes[i];
      l.t += dt;
      const k = l.t / l.dur;
      if (k >= 1) {
        this.give(l.vine);
        this.lashes.splice(i, 1);
        continue;
      }
      const e = k < 0.45 ? 1 - (1 - k / 0.45) ** 3 : 1 - ((k - 0.45) / 0.55) ** 2;
      if (!l.reached && k >= 0.45) {
        l.reached = true;
        l.onReach?.(l.to);
      }
      const from = this.root(_v);
      arcPath(from, l.to, l.bow, Math.max(0.02, e), 20, this.pts);
      l.vine.setPath(this.pts);
    }
    // the snare
    const s = this.snare;
    if (s) {
      s.t += dt;
      const grow = Math.min(1, s.t / 0.25);
      if (s.withering > 0) s.withering += dt;
      if (s.o.dead && s.withering <= 0) s.withering = 0.0001;
      const w = s.withering > 0 ? Math.min(1, s.withering / 0.6) : 0;
      for (const c of s.coils) {
        c.vine.tint = w > 0 ? -w : Math.min(1, s.t / 0.6);
        const n = 20;
        for (let i = 0; i <= n; i++) this.coilPoint(s, c, (i / n) * grow * (1 - w * 0.9), this.pts[i]);
        c.vine.setPath(this.pts);
      }
      // the buds: swelling along the coils in the victim's colour as they drink
      if (w === 0 && s.fill > 0.02) {
        const glow = g.engine.glow;
        for (const c of s.coils)
          for (let i = 9; i <= 20; i += 4) {
            const p = this.coilPoint(s, c, i / 20, _w);
            const sz = 0.09 + s.fill * 0.3;
            glow.spawn({ x: p.x, y: p.y, z: p.z, size: sz, sizeEnd: sz, life: dt * 1.5, r: s.color.r * 2, g: s.color.g * 2, b: s.color.b * 2, alpha: 0.95, alphaEnd: 0.9, tex: TEX_GLOW });
            if (s.fill > 0.4) glow.spawn({ x: p.x, y: p.y, z: p.z, size: sz * 0.9, sizeEnd: sz * 0.9, life: dt * 1.5, r: 1.6, g: 1.7, b: 2, alpha: 0.5, alphaEnd: 0.45, tex: TEX_RING });
          }
      }
      if (w >= 1) this.letGo(true);
    }
    // thickets: grow over the ground, hold, wither
    for (let i = this.thickets.length - 1; i >= 0; i--) {
      const th = this.thickets[i];
      th.t += dt;
      const grow = Math.min(1, th.t / 0.4);
      const wither = Math.max(0, (th.t - th.dur) / 0.6);
      th.vines.forEach((v, j) => {
        v.tint = -Math.min(1, wither);
        const path = th.paths[j];
        const e = grow * (1 - Math.min(1, wither) * 0.95);
        for (let k = 0; k <= 20; k++) {
          const f = (k / 20) * e * 20;
          const i0 = Math.floor(f), i1 = Math.min(20, i0 + 1);
          this.pts[k].lerpVectors(path[i0], path[i1], f - i0);
        }
        v.setPath(this.pts);
      });
      if (wither >= 1) {
        for (const v of th.vines) this.give(v);
        this.thickets.splice(i, 1);
      }
    }
  }

  /** nothing left out (the kit can drop this when it seals) */
  get idle(): boolean {
    return this.lashes.length === 0 && !this.snare && this.thickets.length === 0;
  }

  dispose(): void {
    for (const l of this.lashes) l.vine.dispose();
    if (this.snare) for (const c of this.snare.coils) c.vine.dispose();
    for (const th of this.thickets) for (const v of th.vines) v.dispose();
    for (const v of this.pool) v.dispose();
  }
}

/** Fuji Kujaku released: a wisteria shimmer along the fan */
export function wisteriaFlash(g: Game, at: THREE.Vector3): void {
  const c = new THREE.Color('#A59ACA');
  for (let i = 0; i < 16; i++) {
    const a = Math.random() * Math.PI * 2;
    g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, vx: Math.cos(a) * 2, vy: Math.random() * 2, vz: Math.sin(a) * 2, size: 0.14, sizeEnd: 0.03, life: 0.6, r: c.r * 1.8, g: c.g * 1.8, b: c.b * 2, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, drag: 2 });
  }
  g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, size: 0.4, sizeEnd: 1.4, life: 0.3, r: c.r * 2, g: c.g * 2, b: c.b * 2.2, alpha: 0.8, alphaEnd: 0, tex: TEX_RING });
}

/** feathers fluttering off him (his Shunpo, the hair fix) */
export function featherFlutter(g: Game, at: THREE.Vector3, n = 6): void {
  const cols = ['#F5C83A', '#EE7F2D', '#D9452B'];
  for (let i = 0; i < n; i++) {
    const c = new THREE.Color(cols[i % 3]);
    g.engine.dust.spawn({ x: at.x + (Math.random() - 0.5) * 0.4, y: at.y + (Math.random() - 0.5) * 0.4, z: at.z + (Math.random() - 0.5) * 0.4, vx: (Math.random() - 0.5) * 1.5, vy: 0.4 + Math.random(), vz: (Math.random() - 0.5) * 1.5, size: 0.08, sizeEnd: 0.06, life: 1.2, r: c.r, g: c.g, b: c.b, alpha: 1, alphaEnd: 0, tex: TEX_PUFF, drag: 2.5, gravity: -1.2 });
  }
}
