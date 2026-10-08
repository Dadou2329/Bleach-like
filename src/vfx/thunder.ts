// Candice's lightning (docs/kits/candice.md). ThickBolts: jagged bolts drawn as camera-facing ribbons — a white core
// over a coloured sheath — so they read from across a street (a one-pixel line does not). Zap: a bolt between two
// points (or two moving ones) flickering for a moment, with branches. Crackle: arcs crawling over a body (a charged
// target, her flare) or Barbarriel's thread of lightning coiling round her. SkyBolt: a mark on the ground, then a
// bolt out of the sky that craters and scorches. GalvanoBolt: the 5-gigajoule shot, a beam boring a tunnel through
// everything on its line. WingJavelin: a wing thrown point first, bursting where it lands (a blade swung into it
// breaks it). SixWheel: the wings spun round her, cutting, then flung one by one. StreamBolt: a thick bolt held on the
// target, sweeping after it and leaping on to the bodies near it. ElectroPillar and ElectroBlast: Electrocution's
// pillar surging round her and the blast thrown out of it, gouging a trench. lightningBurst: bolts out of a point in
// every direction.
import * as THREE from 'three';
import type { Fighter } from '../game/fighter';
import type { Game, Projectile } from '../game/game';
import type { VoxelModel } from '../models/builder';
import { CapsuleShape, SphereShape } from '../destruction/shapes';
import { raycastVoxels } from '../voxel/raycast';
import { PropMesh } from '../game/characterFactory';
import { groundAt } from './iceArts';
import { TEX_GLOW, TEX_STREAK } from './sprites';

export interface BoltColors {
  core: THREE.ColorRepresentation;
  edge: THREE.ColorRepresentation;
}
/** the Schrift in her base state: electric blue */
export const BOLT_BLUE: BoltColors = { core: '#EAFBFF', edge: '#3FB8FF' };
/** Barbarriel: neon green */
export const BOLT_GREEN: BoltColors = { core: '#F2FFEC', edge: '#2BE86E' };
/** Galvano Blast: blue-white */
export const BOLT_GALVANO: BoltColors = { core: '#F4FDFF', edge: '#9AE6FF' };

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _d = new THREE.Vector3();
const _s = new THREE.Vector3();
const _c = new THREE.Color();
const UP = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1);

type At = THREE.Vector3 | (() => THREE.Vector3);
const at = (p: At): THREE.Vector3 => (typeof p === 'function' ? p() : p);

/** a fighter's bone (or socket) in the world */
function bonePos(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (s) {
    s.updateWorldMatrix(true, false);
    return s.getWorldPosition(out);
  }
  const b = f.visual.rig.bone(name);
  b.updateWorldMatrix(true, false);
  return b.getWorldPosition(out);
}

/** the distance from p to the segment a-b, the nearest point written to `near` */
function segDist(p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3, near?: THREE.Vector3): number {
  _d.subVectors(b, a);
  const l2 = _d.lengthSq();
  const t = l2 > 0 ? Math.max(0, Math.min(1, _s.subVectors(p, a).dot(_d) / l2)) : 0;
  const q = (near ?? _w).copy(a).addScaledVector(_d, t);
  return q.distanceTo(p);
}

// ------------------------------------------------------------------ the ribbons

/** Jagged ribbons facing the camera, rebuilt whenever asked: a bright core inside a coloured sheath. */
export class ThickBolts {
  private core: THREE.Mesh;
  private edge: THREE.Mesh;
  private pc: Float32Array;
  private pe: Float32Array;
  private nc = 0;
  private ne = 0;
  readonly coreMat: THREE.MeshBasicMaterial;
  readonly edgeMat: THREE.MeshBasicMaterial;

  constructor(private g: Game, readonly max = 192, colors: BoltColors = BOLT_BLUE) {
    this.pc = new Float32Array(max * 18);
    this.pe = new Float32Array(max * 18);
    const mk = (arr: Float32Array, mat: THREE.Material) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      const m = new THREE.Mesh(geo, mat);
      m.frustumCulled = false;
      g.engine.gr.scene.add(m);
      return m;
    };
    this.coreMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(colors.core).multiplyScalar(3), transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.edgeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(colors.edge).multiplyScalar(1.8), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.edge = mk(this.pe, this.edgeMat);
    this.core = mk(this.pc, this.coreMat);
    this.edge.renderOrder = 8;
    this.core.renderOrder = 9;
  }

  setColors(c: BoltColors): void {
    this.coreMat.color.set(c.core).multiplyScalar(3);
    this.edgeMat.color.set(c.edge).multiplyScalar(1.8);
  }

  begin(): void {
    this.nc = 0;
    this.ne = 0;
  }

  /** one ribbon segment p → q of width w facing the camera, a little overlapped at the ends so kinks close */
  private quad(arr: Float32Array, n: number, p: THREE.Vector3, q: THREE.Vector3, w: number): boolean {
    if (n >= this.max) return false;
    const cam = this.g.engine.gr.camera.position;
    _d.subVectors(q, p);
    const len = _d.length();
    if (len < 1e-4) return false;
    _d.multiplyScalar(1 / len);
    _v.addVectors(p, q).multiplyScalar(0.5);
    _s.subVectors(cam, _v).cross(_d);
    if (_s.lengthSq() < 1e-8) _s.set(0, 1, 0).cross(_d);
    _s.normalize().multiplyScalar(w / 2);
    const ext = w * 0.35;
    const ax = p.x - _d.x * ext, ay = p.y - _d.y * ext, az = p.z - _d.z * ext;
    const bx = q.x + _d.x * ext, by = q.y + _d.y * ext, bz = q.z + _d.z * ext;
    const o = n * 18;
    arr[o] = ax - _s.x; arr[o + 1] = ay - _s.y; arr[o + 2] = az - _s.z;
    arr[o + 3] = ax + _s.x; arr[o + 4] = ay + _s.y; arr[o + 5] = az + _s.z;
    arr[o + 6] = bx + _s.x; arr[o + 7] = by + _s.y; arr[o + 8] = bz + _s.z;
    arr[o + 9] = ax - _s.x; arr[o + 10] = ay - _s.y; arr[o + 11] = az - _s.z;
    arr[o + 12] = bx + _s.x; arr[o + 13] = by + _s.y; arr[o + 14] = bz + _s.z;
    arr[o + 15] = bx - _s.x; arr[o + 16] = by - _s.y; arr[o + 17] = bz - _s.z;
    return true;
  }

  /** a straight piece of ribbon (no kinks): sheath width w, the core a third of it */
  segment(p: THREE.Vector3, q: THREE.Vector3, w: number): void {
    if (this.quad(this.pe, this.ne, p, q, w)) this.ne++;
    if (this.quad(this.pc, this.nc, p, q, w * 0.34)) this.nc++;
  }

  /** a bolt from a to b in `segs` jagged segments, each kink up to `jag` (m) off the line; returns its kinks in `out` */
  bolt(a: THREE.Vector3, b: THREE.Vector3, jag: number, segs: number, w: number, out?: THREE.Vector3[]): void {
    const p = a.clone();
    for (let i = 1; i <= segs; i++) {
      const t = i / segs;
      const j = i === segs ? 0 : jag * (0.4 + 0.6 * Math.sin(t * Math.PI));
      const q = new THREE.Vector3(
        a.x + (b.x - a.x) * t + (Math.random() - 0.5) * 2 * j,
        a.y + (b.y - a.y) * t + (Math.random() - 0.5) * 2 * j,
        a.z + (b.z - a.z) * t + (Math.random() - 0.5) * 2 * j,
      );
      // thinner toward the far end
      this.segment(p, q, w * (1 - 0.35 * t));
      if (out && i < segs) out.push(q.clone());
      p.copy(q);
    }
  }

  end(): void {
    for (const [m, n] of [[this.core, this.nc], [this.edge, this.ne]] as [THREE.Mesh, number][]) {
      const geo = m.geometry;
      geo.setDrawRange(0, n * 6);
      (geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    }
  }

  set opacity(k: number) {
    this.coreMat.opacity = k;
    this.edgeMat.opacity = 0.85 * k;
  }

  set visible(v: boolean) {
    this.core.visible = this.edge.visible = v;
  }

  dispose(): void {
    for (const m of [this.core, this.edge]) {
      m.removeFromParent();
      m.geometry.dispose();
    }
    this.coreMat.dispose();
    this.edgeMat.dispose();
  }
}

/** a burst of glow sprites in a bolt's colours */
function flash(g: Game, p: THREE.Vector3, c: BoltColors, size: number, n = 6): void {
  _c.set(c.core);
  g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size, sizeEnd: size * 1.8, life: 0.12, r: _c.r, g: _c.g, b: _c.b, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  _c.set(c.edge);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.3) * 2;
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * 7, vy: e * 4, vz: Math.sin(a) * 7, size: 0.1, sizeEnd: 0.02, life: 0.3, r: _c.r, g: _c.g, b: _c.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 2 });
  }
}

// ------------------------------------------------------------------ a bolt between two points

export interface ZapOpts {
  life?: number;
  width?: number;
  jag?: number;
  segs?: number;
  colors?: BoltColors;
  /** side branches off the kinks */
  branches?: number;
}

/** A bolt between two points (fixed, or followed each frame), flickering and branching for a moment. */
export class Zap implements Projectile {
  done = false;
  private t = 0;
  private flick = 0;
  private bolts: ThickBolts;
  private life: number;

  constructor(private g: Game, private a: At, private b: At, readonly o: ZapOpts = {}) {
    this.life = o.life ?? 0.22;
    this.bolts = new ThickBolts(g, 64, o.colors ?? BOLT_BLUE);
    this.render(1);
    flash(g, at(b), o.colors ?? BOLT_BLUE, (o.width ?? 0.2) * 4, 4);
  }

  update(dt: number): void {
    this.t += dt;
    if (this.t >= this.life) this.done = true;
  }

  render(dt: number): void {
    const k = Math.max(0, 1 - this.t / this.life);
    this.bolts.opacity = 0.4 + 0.6 * k;
    this.flick -= dt;
    if (this.flick > 0) return;
    this.flick = 0.035;
    const a = at(this.a), b = at(this.b);
    const len = a.distanceTo(b);
    const w = this.o.width ?? 0.2;
    const kinks: THREE.Vector3[] = [];
    this.bolts.begin();
    this.bolts.bolt(a, b, this.o.jag ?? Math.min(1.6, 0.08 + len * 0.06), this.o.segs ?? Math.max(4, Math.min(16, Math.round(len * 1.2))), w, kinks);
    for (let i = 0; i < (this.o.branches ?? 2) && kinks.length; i++) {
      const p = kinks[Math.floor(Math.random() * kinks.length)];
      const d = _v.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(0.4 + Math.random() * len * 0.2);
      this.bolts.bolt(p, p.clone().add(d), 0.1 + len * 0.02, 3, w * 0.5);
    }
    this.bolts.end();
  }

  dispose(): void {
    this.bolts.dispose();
  }
}

/** Lightning out of a point in every direction (`n` bolts of length up to `len`). */
export function lightningBurst(g: Game, p: THREE.Vector3, colors: BoltColors, n: number, len: number, width = 0.16, life = 0.25): void {
  for (let i = 0; i < n; i++) {
    const d = new THREE.Vector3(Math.random() - 0.5, (Math.random() - 0.35) * 0.8, Math.random() - 0.5).normalize();
    g.addProjectile(new Zap(g, p.clone(), p.clone().addScaledVector(d, len * (0.6 + Math.random() * 0.4)), { colors, width, life: life * (0.7 + Math.random() * 0.6), branches: 1 }));
  }
  flash(g, p, colors, Math.min(6, len * 0.5), 10);
}

// ------------------------------------------------------------------ arcs crawling over a body

const LIMBS: [string, string][] = [
  ['chest', 'upperarm.L'], ['chest', 'upperarm.R'], ['upperarm.L', 'forearm.L'], ['upperarm.R', 'forearm.R'],
  ['forearm.L', 'hand.L'], ['forearm.R', 'hand.R'], ['spine', 'chest'], ['hips', 'spine'],
  ['hips', 'thigh.L'], ['hips', 'thigh.R'], ['thigh.L', 'shin.L'], ['thigh.R', 'shin.R'], ['chest', 'head'],
];

/**
 * Arcs crawling over a body: `level` 0..1 sets how many. With `coil`, Barbarriel's thread of lightning winding round
 * her from the feet to over her head as well.
 */
export class Crackle implements Projectile {
  done = false;
  level = 0;
  coil = false;
  private bolts: ThickBolts;
  private flick = 0;
  private spin = 0;

  constructor(private g: Game, readonly f: Fighter, public colors: BoltColors = BOLT_BLUE) {
    this.bolts = new ThickBolts(g, 160, colors);
  }

  setColors(c: BoltColors): void {
    this.colors = c;
    this.bolts.setColors(c);
  }

  update(dt: number): void {
    this.spin += dt * 3.2;
    if (this.f.dead && this.level <= 0) this.done = true;
  }

  render(dt: number): void {
    const f = this.f;
    const k = f.dead ? 0 : this.level;
    const on = k > 0.02 || (this.coil && !f.dead);
    this.bolts.visible = on;
    if (!on) return;
    this.flick -= dt;
    if (this.flick > 0) return;
    this.flick = 0.05;
    const rig = f.visual.rig;
    const P = (n: string) => (rig.sockets.has(n) || rig.index(n) >= 0 ? bonePos(f, n) : f.center());
    this.bolts.begin();
    const arcs = Math.round(k * 7);
    const kinks: THREE.Vector3[] = [];
    for (let i = 0; i < arcs; i++) {
      const [a, b] = LIMBS[Math.floor(Math.random() * LIMBS.length)];
      this.bolts.bolt(P(a), P(b), 0.07, 4, 0.045 + 0.03 * k, kinks);
    }
    for (let i = 0; i < Math.round(k * 4); i++) {
      const p = kinks.length ? kinks[Math.floor(Math.random() * kinks.length)] : f.center();
      const d = _v.set(Math.random() - 0.5, Math.random() - 0.2, Math.random() - 0.5).normalize().multiplyScalar(0.2 + Math.random() * 0.4 * k);
      this.bolts.bolt(p, p.clone().add(d), 0.05, 3, 0.035);
    }
    if (this.coil) {
      // the thread: a helix from her ankles to over her head, turning
      const c = f.pos;
      const h = f.def.height + 0.3;
      const n = 22;
      let prev: THREE.Vector3 | null = null;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const a = this.spin + t * Math.PI * 2 * 2.5;
        const r = 0.42 + 0.08 * Math.sin(t * 9 + this.spin);
        const p = new THREE.Vector3(c.x + Math.cos(a) * r + (Math.random() - 0.5) * 0.06, c.y + 0.1 + t * h, c.z + Math.sin(a) * r + (Math.random() - 0.5) * 0.06);
        if (prev) this.bolts.segment(prev, p, 0.05);
        prev = p;
      }
    }
    this.bolts.end();
    this.bolts.opacity = 0.6 + 0.4 * Math.max(k, this.coil ? 0.6 : 0);
  }

  dispose(): void {
    this.bolts.dispose();
  }
}

// ------------------------------------------------------------------ the sky

export interface SkyBoltOpts {
  /** seconds the mark glows before the bolt falls */
  delay: number;
  dmg: number;
  /** blast radius (m) */
  r: number;
  colors: BoltColors;
  /** bolt width (m) */
  width?: number;
  power?: number;
  heavy?: boolean;
  onHit?: (f: Fighter) => void;
}

/** A mark on the ground, then a bolt out of the sky onto it: a crater, a burnt ring, whoever stands in it thrown. */
export class SkyBolt implements Projectile {
  done = false;
  private t = 0;
  private struck = false;
  private bolts: ThickBolts;
  private flick = 0;
  readonly base: THREE.Vector3;
  private top: THREE.Vector3;

  constructor(private g: Game, readonly owner: Fighter, p: THREE.Vector3, readonly o: SkyBoltOpts) {
    const gy = groundAt(g, p.x, p.y + 1.5, p.z, 14);
    this.base = new THREE.Vector3(p.x, gy ?? p.y, p.z);
    this.top = new THREE.Vector3(p.x + (Math.random() - 0.5) * 8, this.base.y + 46, p.z + (Math.random() - 0.5) * 8);
    this.bolts = new ThickBolts(g, 96, o.colors);
    this.bolts.visible = false;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const o = this.o;
    if (!this.struck && this.t >= o.delay) {
      this.struck = true;
      const b = this.base;
      g.engine.destruction.carve(new SphereShape(b.clone(), o.r * 0.62, 0.6), { mode: 'explode', power: o.power ?? 700, impulse: 10, dust: 0.6 });
      g.engine.destruction.carve(new SphereShape(b.clone(), o.r * 1.35, 0.25), { mode: 'burn', power: 300, dust: 0.2 });
      for (const e of g.enemiesOf(this.owner)) {
        if (e.dead) continue;
        const dx = e.pos.x - b.x, dz = e.pos.z - b.z;
        if (Math.hypot(dx, dz) > o.r + e.def.radius || e.pos.y > b.y + 4 || e.pos.y + e.def.height < b.y - 1) continue;
        const dir = new THREE.Vector3(dx, 0, dz);
        if (dir.lengthSq() < 1e-4) dir.set(0, 0, 1);
        dir.normalize();
        g.damage(e, o.dmg, this.owner, dir, { energy: true, knock: 7, launch: 5, heavy: o.heavy, hitstop: o.heavy ? 0.12 : 0.07, shake: 0.3, color: new THREE.Color(o.colors.edge).getStyle() });
        o.onHit?.(e);
      }
      flash(g, b.clone().setY(b.y + 0.4), o.colors, o.r * 2.4, 14);
      lightningBurst(g, b.clone().setY(b.y + 0.3), o.colors, 5, o.r * 1.4, 0.1, 0.2);
      g.sfx.play('crack', b, 1.4);
      g.sfx.play('explode', b, 0.9);
      if (g.player && g.player.pos.distanceTo(b) < 30) g.shake(o.heavy ? 0.45 : 0.25);
      this.bolts.visible = true;
    }
    if (!this.struck) {
      // the mark: a ring of sparks on the ground, closing in
      _c.set(o.colors.edge);
      const k = this.t / o.delay;
      const r = o.r * (1.2 - 0.4 * k);
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        g.engine.glow.spawn({ x: this.base.x + Math.cos(a) * r, y: this.base.y + 0.08, z: this.base.z + Math.sin(a) * r, vy: 0.8, size: 0.16, sizeEnd: 0.03, life: 0.3, r: _c.r, g: _c.g, b: _c.b, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
      }
      if (Math.random() < 0.5) g.engine.glow.spawn({ x: this.base.x, y: this.base.y + 0.1, z: this.base.z, size: o.r * 0.8 * k, sizeEnd: o.r * k, life: 0.08, r: _c.r, g: _c.g, b: _c.b, alpha: 0.35, alphaEnd: 0, tex: TEX_GLOW });
    }
    if (this.t > o.delay + 0.3) this.done = true;
  }

  render(dt: number): void {
    if (!this.struck) return;
    const k = Math.max(0, 1 - (this.t - this.o.delay) / 0.3);
    this.bolts.opacity = k;
    this.flick -= dt;
    if (this.flick > 0) return;
    this.flick = 0.04;
    const w = this.o.width ?? 0.36;
    const kinks: THREE.Vector3[] = [];
    this.bolts.begin();
    this.bolts.bolt(this.top, this.base, 2.4, 14, w, kinks);
    for (let i = 0; i < 4 && kinks.length; i++) {
      const p = kinks[Math.floor(Math.random() * kinks.length)];
      this.bolts.bolt(p, p.clone().add(_v.set((Math.random() - 0.5) * 8, -2 - Math.random() * 5, (Math.random() - 0.5) * 8)), 1, 5, w * 0.45);
    }
    this.bolts.end();
  }

  dispose(): void {
    this.bolts.dispose();
  }
}

// ------------------------------------------------------------------ beams

/** two open cylinders along a line (a core and a sheath), scaled and faded by the caller */
class BeamMesh {
  readonly core: THREE.Mesh;
  readonly sheath: THREE.Mesh;
  private coreMat: THREE.MeshBasicMaterial;
  private sheathMat: THREE.MeshBasicMaterial;

  constructor(g: Game, colors: BoltColors) {
    const geo = new THREE.CylinderGeometry(1, 1, 1, 12, 1, true);
    geo.translate(0, 0.5, 0);
    geo.rotateX(Math.PI / 2);
    this.coreMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(colors.core).multiplyScalar(3), transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
    this.sheathMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(colors.edge).multiplyScalar(1.6), transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.core = new THREE.Mesh(geo, this.coreMat);
    this.sheath = new THREE.Mesh(geo, this.sheathMat);
    for (const m of [this.core, this.sheath]) {
      m.frustumCulled = false;
      m.renderOrder = 7;
      g.engine.gr.scene.add(m);
    }
  }

  place(from: THREE.Vector3, dir: THREE.Vector3, len: number, rCore: number, rSheath: number, k: number): void {
    for (const m of [this.core, this.sheath]) {
      m.position.copy(from);
      m.quaternion.setFromUnitVectors(Z, dir);
    }
    this.core.scale.set(rCore, rCore, len);
    this.sheath.scale.set(rSheath, rSheath, len);
    this.coreMat.opacity = k;
    this.sheathMat.opacity = 0.7 * k * k;
  }

  dispose(): void {
    this.core.removeFromParent();
    this.sheath.removeFromParent();
    this.core.geometry.dispose();
    this.coreMat.dispose();
    this.sheathMat.dispose();
  }
}

export interface GalvanoOpts {
  dmg: number;
  range?: number;
  /** the tunnel's radius (m) */
  width?: number;
  colors?: BoltColors;
  power?: number;
  onHit?: (f: Fighter) => void;
}

/** Galvano Blast: an instant beam that bores a round tunnel through everything on its line and strikes whoever is on it. */
export class GalvanoBolt implements Projectile {
  done = false;
  private t = 0;
  private beam: BeamMesh;
  private bolts: ThickBolts;
  private flick = 0;
  readonly len: number;
  readonly dur = 0.55;

  constructor(private g: Game, readonly owner: Fighter, readonly from: THREE.Vector3, readonly dir: THREE.Vector3, readonly o: GalvanoOpts) {
    dir.normalize();
    const range = (this.len = o.range ?? 70);
    const w = o.width ?? 1.1;
    const colors = o.colors ?? BOLT_GALVANO;
    // the tunnel: capsules end to end along the whole line
    for (let s = 0.8; s < range; s += 2.5) {
      const a = from.clone().addScaledVector(dir, s), b = from.clone().addScaledVector(dir, Math.min(range, s + 2.6));
      g.engine.destruction.carve(new CapsuleShape(a, b, w), { mode: 'bore', power: o.power ?? 2600, sparks: [0.6, 0.9, 1], dust: 0.3, impulse: 8, debris: 0.06 });
    }
    const near = new THREE.Vector3();
    const end = from.clone().addScaledVector(dir, range);
    for (const e of g.enemiesOf(owner)) {
      if (e.dead) continue;
      if (segDist(e.center(), from, end, near) > w + e.def.radius + 0.3) continue;
      g.damage(e, o.dmg, owner, dir, { energy: true, knock: 18, launch: 4, heavy: true, hitstop: 0.16, shake: 0.6, color: new THREE.Color(colors.edge).getStyle() });
      lightningBurst(g, near.clone(), colors, 6, 2.4, 0.12);
      o.onHit?.(e);
    }
    this.beam = new BeamMesh(g, colors);
    this.bolts = new ThickBolts(g, 128, colors);
    flash(g, from, colors, 3, 12);
    g.sfx.play('beam', from, 1.6);
    g.sfx.play('crack', from, 1.4);
    g.shake(owner === g.player ? 0.6 : 0.25);
    g.engine.gr.chroma.offset.set(0.007, 0.007);
    this.render(1);
  }

  update(dt: number): void {
    this.t += dt;
    if (this.t >= this.dur) this.done = true;
  }

  render(dt: number): void {
    const k = Math.max(0, 1 - this.t / this.dur);
    const w = this.o.width ?? 1.1;
    this.beam.place(this.from, this.dir, this.len, w * 0.28 * (0.5 + 0.5 * k), w * (0.7 + 0.5 * k), k);
    this.bolts.opacity = k;
    this.flick -= dt;
    if (this.flick > 0) return;
    this.flick = 0.035;
    // lightning crawling along the beam
    this.bolts.begin();
    const side = _v.set(0, 1, 0).cross(this.dir).normalize();
    const up = _w.crossVectors(this.dir, side).normalize();
    for (let i = 0; i < 6; i++) {
      const s0 = Math.random() * this.len * 0.8;
      const s1 = s0 + 4 + Math.random() * 10;
      const off = () => side.clone().multiplyScalar((Math.random() - 0.5) * w * 2.4).addScaledVector(up, (Math.random() - 0.5) * w * 2.4);
      this.bolts.bolt(this.from.clone().addScaledVector(this.dir, s0).add(off()), this.from.clone().addScaledVector(this.dir, Math.min(this.len, s1)).add(off()), w * 0.4, 6, 0.12);
    }
    this.bolts.end();
  }

  dispose(): void {
    this.beam.dispose();
    this.bolts.dispose();
  }
}

// ------------------------------------------------------------------ the wings

export interface JavelinOpts {
  dmg: number;
  r: number;
  speed?: number;
  colors?: BoltColors;
  onHit?: (f: Fighter) => void;
}

/** A wing thrown point first: it homes a little, bursts on what it meets; a blade swung into it breaks it. */
export class WingJavelin implements Projectile {
  done = false;
  private mesh: PropMesh;
  readonly pos: THREE.Vector3;
  readonly vel: THREE.Vector3;
  private t = 0;
  private trail: ThickBolts;
  private tail: THREE.Vector3[] = [];

  constructor(private g: Game, readonly owner: Fighter, model: VoxelModel, from: THREE.Vector3, readonly target: Fighter | null, dir: THREE.Vector3, readonly o: JavelinOpts) {
    this.pos = from.clone();
    this.vel = dir.clone().normalize().multiplyScalar(o.speed ?? 58);
    this.mesh = new PropMesh(model);
    this.mesh.castShadow = false;
    g.engine.gr.scene.add(this.mesh);
    this.trail = new ThickBolts(g, 24, o.colors ?? BOLT_GREEN);
    g.sfx.play('crack', from, 0.8);
  }

  private burst(p: THREE.Vector3, cancelled = false): void {
    const { g, o } = this;
    this.done = true;
    const colors = o.colors ?? BOLT_GREEN;
    if (cancelled) {
      g.sparks(p, this.vel.clone().normalize().negate(), new THREE.Color(colors.edge), 18);
      lightningBurst(g, p, colors, 4, 1.6, 0.08, 0.18);
      g.sfx.play('shatter', p, 0.9);
      return;
    }
    g.engine.destruction.carve(new SphereShape(p.clone(), o.r * 0.6, 0.6), { mode: 'explode', power: 1100, impulse: 12, dust: 0.5 });
    for (const e of g.enemiesOf(this.owner)) {
      if (e.dead || e.center().distanceTo(p) > o.r + e.def.radius) continue;
      const d = e.center().sub(p).setY(0);
      if (d.lengthSq() < 1e-4) d.copy(this.vel).setY(0);
      g.damage(e, o.dmg, this.owner, d.normalize(), { energy: true, knock: 12, launch: 4, heavy: true, hitstop: 0.1, shake: 0.4, color: new THREE.Color(colors.edge).getStyle() });
      o.onHit?.(e);
    }
    lightningBurst(g, p, colors, 7, o.r * 1.2, 0.14);
    g.sfx.play('explode', p, 1.1);
    if (g.player && g.player.pos.distanceTo(p) < 25) g.shake(0.3);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const tg = this.target;
    if (tg && !tg.dead && this.t > 0.05) {
      const want = _v.subVectors(tg.center(), this.pos).normalize().multiplyScalar(this.vel.length());
      this.vel.lerp(want, Math.min(1, dt * 3.5));
    }
    const step = this.vel.length() * dt;
    const d = _d.copy(this.vel).normalize();
    // a blade swung into it breaks it (an equal and opposite attack)
    for (const e of g.enemiesOf(this.owner)) {
      if (!e.bladeActive || !e.blade) continue;
      if (segDist(this.pos, e.blade.base ?? e.center(), e.blade.tip) < 0.9) {
        this.burst(this.pos.clone(), true);
        return;
      }
    }
    for (const e of g.enemiesOf(this.owner)) {
      if (e.dead) continue;
      const c = e.center();
      const along = Math.max(0, Math.min(step, _s.subVectors(c, this.pos).dot(d)));
      if (_w.copy(this.pos).addScaledVector(d, along).distanceTo(c) < e.def.radius + 0.5) {
        this.burst(_w.clone());
        return;
      }
    }
    const hit = raycastVoxels(g.engine.world, this.pos.x, this.pos.y, this.pos.z, d.x, d.y, d.z, step);
    if (hit) {
      this.burst(this.pos.clone().addScaledVector(d, hit.dist));
      return;
    }
    this.pos.addScaledVector(this.vel, dt);
    this.tail.unshift(this.pos.clone());
    if (this.tail.length > 5) this.tail.pop();
    if (this.t > 2.4) this.burst(this.pos.clone());
  }

  render(): void {
    this.mesh.position.copy(this.pos);
    this.mesh.quaternion.setFromUnitVectors(Z, _v.copy(this.vel).normalize());
    // pushed back so the point leads
    this.mesh.position.addScaledVector(_v, -0.5);
    this.trail.begin();
    for (let i = 1; i < this.tail.length; i++) this.trail.bolt(this.tail[i - 1], this.tail[i], 0.12, 2, 0.12 * (1 - i / 6));
    this.trail.end();
  }

  reject(p: THREE.Vector3, radius: number): boolean {
    if (this.pos.distanceTo(p) > radius) return false;
    this.burst(this.pos.clone(), true);
    return true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.material.dispose();
    this.trail.dispose();
  }
}

/** "I've got six": the wings spun round her in a wheel, cutting what they pass, then flung one by one at the target. */
export class SixWheel implements Projectile {
  done = false;
  private t = 0;
  private wings: { mesh: PropMesh; gone: boolean; pos: THREE.Vector3 }[] = [];
  private hitAt = new Map<number, number>();
  private bolts: ThickBolts;
  private flick = 0;

  constructor(private g: Game, readonly owner: Fighter, readonly model: VoxelModel, n: number, readonly o: { dmg: number; radius?: number; life?: number; colors?: BoltColors; onHit?: (f: Fighter) => void }) {
    for (let i = 0; i < n; i++) {
      const mesh = new PropMesh(model);
      mesh.castShadow = false;
      g.engine.gr.scene.add(mesh);
      this.wings.push({ mesh, gone: false, pos: owner.center() });
    }
    this.bolts = new ThickBolts(g, 64, o.colors ?? BOLT_GREEN);
  }

  /** the angle of wing i */
  private ang(i: number): number {
    return this.t * 8 + (i / this.wings.length) * Math.PI * 2;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const R = this.o.radius ?? 2.2;
    const c = this.owner.center();
    for (const [i, w] of this.wings.entries()) {
      if (w.gone) continue;
      const a = this.ang(i);
      w.pos.set(c.x + Math.cos(a) * R, c.y + Math.sin(a * 2) * 0.25, c.z + Math.sin(a) * R);
      g.engine.destruction.carve(new SphereShape(w.pos.clone(), 0.45, 0.5), { mode: 'cut', power: 900, dust: 0.2 });
      for (const e of g.enemiesOf(this.owner)) {
        if (e.dead || e.center().distanceTo(w.pos) > e.def.radius + 0.7) continue;
        if (g.time - (this.hitAt.get(e.id) ?? -9) < 0.22) continue;
        this.hitAt.set(e.id, g.time);
        const d = e.center().sub(c).setY(0).normalize();
        g.damage(e, this.o.dmg, this.owner, d, { energy: true, knock: 3, hitstop: 0.03, quiet: false, color: new THREE.Color((this.o.colors ?? BOLT_GREEN).edge).getStyle() });
        this.o.onHit?.(e);
      }
    }
    if (this.wings.every((w) => w.gone) || this.t > (this.o.life ?? 4) || this.owner.dead) this.done = true;
  }

  /** fling the next wing still turning at the target (returns false when none is left) */
  fling(target: Fighter | null, jav: Omit<JavelinOpts, 'colors'>): boolean {
    const w = this.wings.find((x) => !x.gone);
    if (!w) return false;
    w.gone = true;
    w.mesh.visible = false;
    const dir = target ? target.center().sub(w.pos).normalize() : this.owner.forward(new THREE.Vector3());
    this.g.addProjectile(new WingJavelin(this.g, this.owner, this.model, w.pos.clone(), target, dir, { ...jav, colors: this.o.colors }));
    return true;
  }

  render(dt: number): void {
    const R = this.o.radius ?? 2.2;
    for (const [i, w] of this.wings.entries()) {
      if (w.gone) continue;
      const a = this.ang(i);
      // the blade along the direction of travel, its middle on the circle
      const tan = _v.set(-Math.sin(a), 0, Math.cos(a));
      w.mesh.quaternion.setFromUnitVectors(Z, tan);
      w.mesh.position.copy(w.pos).addScaledVector(tan, -0.5);
    }
    this.flick -= dt;
    if (this.flick > 0) return;
    this.flick = 0.05;
    this.bolts.begin();
    const live = this.wings.filter((w) => !w.gone);
    for (let i = 0; i < live.length; i++) if (Math.random() < 0.6) this.bolts.bolt(live[i].pos, live[(i + 1) % live.length].pos, 0.2, 5, 0.06);
    this.bolts.end();
    void R;
  }

  dispose(): void {
    for (const w of this.wings) {
      w.mesh.removeFromParent();
      w.mesh.material.dispose();
    }
    this.bolts.dispose();
  }
}

// ------------------------------------------------------------------ the stream

/** A thick bolt held on the target for a while: it sweeps after it, ticks, and leaps on to the bodies near it. */
export class StreamBolt implements Projectile {
  done = false;
  private t = 0;
  private tick = 0;
  private aim: THREE.Vector3;
  private end = new THREE.Vector3();
  private chained: Fighter[] = [];
  private bolts: ThickBolts;
  private flick = 0;

  constructor(private g: Game, readonly owner: Fighter, readonly from: () => THREE.Vector3, readonly target: Fighter, readonly o: { dur: number; dmg: number; chain?: number; chainR?: number; colors?: BoltColors; onHit?: (f: Fighter) => void }) {
    this.aim = target.center();
    this.bolts = new ThickBolts(g, 96, o.colors ?? BOLT_GREEN);
    g.sfx.play('beam', from(), 1.2);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const a = this.from();
    if (!this.target.dead) this.aim.lerp(this.target.center(), Math.min(1, dt * 6));
    const d = _d.subVectors(this.aim, a);
    const len = Math.min(34, d.length());
    d.normalize();
    const hit = raycastVoxels(g.engine.world, a.x, a.y, a.z, d.x, d.y, d.z, len);
    this.end.copy(a).addScaledVector(d, hit ? hit.dist : len);
    this.tick -= dt;
    if (this.tick <= 0) {
      this.tick = 0.12;
      if (hit) g.engine.destruction.carve(new SphereShape(this.end.clone(), 0.7, 0.5), { mode: 'explode', power: 500, impulse: 4, dust: 0.3 });
      const colors = this.o.colors ?? BOLT_GREEN;
      const col = new THREE.Color(colors.edge).getStyle();
      this.chained = [];
      for (const e of g.enemiesOf(this.owner)) {
        if (e.dead || segDist(e.center(), a, this.end) > e.def.radius + 0.6) continue;
        g.damage(e, this.o.dmg, this.owner, d, { energy: true, knock: 1, hitstop: 0, quiet: true, color: col });
        e.hitstun = Math.max(e.hitstun, 0.2);
        this.o.onHit?.(e);
        // the leap on to the nearest others
        const others = g.enemiesOf(this.owner).filter((x) => x !== e && !x.dead && x.pos.distanceTo(e.pos) < (this.o.chainR ?? 6)).slice(0, this.o.chain ?? 2);
        for (const x of others) {
          g.damage(x, this.o.dmg * 0.6, this.owner, d, { energy: true, knock: 2, quiet: true, color: col });
          this.o.onHit?.(x);
          this.chained.push(x);
        }
      }
    }
    if (this.t >= this.o.dur || this.owner.dead) this.done = true;
  }

  render(dt: number): void {
    this.flick -= dt;
    if (this.flick > 0) return;
    this.flick = 0.03;
    const a = this.from();
    const len = a.distanceTo(this.end);
    this.bolts.begin();
    this.bolts.bolt(a, this.end, Math.min(0.6, 0.1 + len * 0.02), Math.max(6, Math.round(len * 0.7)), 0.34);
    this.bolts.bolt(a, this.end, Math.min(0.9, 0.2 + len * 0.03), Math.max(6, Math.round(len * 0.7)), 0.12);
    const tc = this.target.center();
    for (const x of this.chained) this.bolts.bolt(tc, x.center(), 0.3, 6, 0.12);
    this.bolts.end();
    flash(this.g, this.end, this.o.colors ?? BOLT_GREEN, 0.9, 2);
  }

  dispose(): void {
    this.bolts.dispose();
  }
}

// ------------------------------------------------------------------ Electrocution

/** Electrocution's pillar: lightning surging round her from the ground to the sky; `squeeze` 0..1 draws it in round her arm. */
export class ElectroPillar implements Projectile {
  done = false;
  squeeze = 0;
  private t = 0;
  private tick = 0;
  private bolts: ThickBolts;
  private flick = 0;
  private col: THREE.Mesh;
  private colMat: THREE.MeshBasicMaterial;

  constructor(private g: Game, readonly owner: Fighter, readonly o: { dur: number; radius: number; dmg: number; colors?: BoltColors; arm?: string }) {
    const colors = o.colors ?? BOLT_GREEN;
    this.bolts = new ThickBolts(g, 160, colors);
    const geo = new THREE.CylinderGeometry(1, 1, 30, 20, 1, true);
    geo.translate(0, 15, 0);
    this.colMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(colors.edge).multiplyScalar(1.3), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.col = new THREE.Mesh(geo, this.colMat);
    this.col.frustumCulled = false;
    this.col.renderOrder = 7;
    g.engine.gr.scene.add(this.col);
    g.sfx.play('charge', owner.center(), 1.4);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    this.tick -= dt;
    const R = this.o.radius * (1 - 0.75 * this.squeeze);
    if (this.tick <= 0 && this.squeeze < 0.5) {
      this.tick = 0.15;
      const c = this.owner.pos;
      for (const e of g.enemiesOf(this.owner)) {
        if (e.dead || Math.hypot(e.pos.x - c.x, e.pos.z - c.z) > R + e.def.radius + 0.4) continue;
        const d = e.pos.clone().sub(c).setY(0).normalize();
        g.damage(e, this.o.dmg, this.owner, d, { energy: true, knock: 5, quiet: true, color: new THREE.Color((this.o.colors ?? BOLT_GREEN).edge).getStyle() });
        e.hitstun = Math.max(e.hitstun, 0.25);
      }
    }
    if (this.t >= this.o.dur || this.owner.dead) this.done = true;
  }

  render(dt: number): void {
    const f = this.owner;
    const k = Math.min(1, this.t / 0.15) * Math.max(0, Math.min(1, (this.o.dur - this.t) / 0.15));
    const R = this.o.radius * (1 - 0.75 * this.squeeze);
    this.col.position.copy(f.pos);
    this.col.scale.set(R * (0.9 + Math.random() * 0.2), 1, R * (0.9 + Math.random() * 0.2));
    this.colMat.opacity = 0.32 * k * (1 - this.squeeze * 0.6);
    this.flick -= dt;
    if (this.flick > 0) return;
    this.flick = 0.04;
    const c = f.pos;
    const arm = this.o.arm ? bonePos(f, this.o.arm) : f.center();
    this.bolts.begin();
    for (let i = 0; i < 9; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = R * (0.6 + Math.random() * 0.5);
      const y0 = Math.random() * 18;
      const p0 = new THREE.Vector3(c.x + Math.cos(a) * r, c.y + y0 + 6, c.z + Math.sin(a) * r);
      const p1 = this.squeeze > 0.2 && Math.random() < this.squeeze ? arm : new THREE.Vector3(c.x + Math.cos(a + 0.5) * r, c.y + y0, c.z + Math.sin(a + 0.5) * r);
      this.bolts.bolt(p0, p1, 0.5, 6, 0.16);
    }
    // the lightning leaking from her eyes
    for (const s of ['eye.L', 'eye.R']) {
      if (!f.visual.rig.sockets.has(s)) continue;
      const e = bonePos(f, s);
      this.bolts.bolt(e, e.clone().add(_v.set((Math.random() - 0.5) * 0.4, -0.15 - Math.random() * 0.3, 0.1 + Math.random() * 0.2).applyAxisAngle(UP, f.yaw)), 0.04, 3, 0.03);
    }
    this.bolts.end();
    this.bolts.opacity = k;
  }

  dispose(): void {
    this.bolts.dispose();
    this.col.removeFromParent();
    this.col.geometry.dispose();
    this.colMat.dispose();
  }
}

/** Electrocution's blast: a massive bolt thrown out along a line, held a moment, boring through and gouging a trench. */
export class ElectroBlast implements Projectile {
  done = false;
  private t = 0;
  private tick = 0;
  private beam: BeamMesh;
  private bolts: ThickBolts;
  private flick = 0;
  readonly len: number;

  constructor(private g: Game, readonly owner: Fighter, readonly from: THREE.Vector3, readonly dir: THREE.Vector3, readonly o: { dmg: number; tickDmg: number; dur?: number; range?: number; width?: number; colors?: BoltColors; onHit?: (f: Fighter) => void }) {
    dir.normalize();
    const range = (this.len = o.range ?? 60);
    const w = o.width ?? 1.8;
    const colors = o.colors ?? BOLT_GREEN;
    for (let s = 0.8; s < range; s += 3) {
      const a = from.clone().addScaledVector(dir, s), b = from.clone().addScaledVector(dir, Math.min(range, s + 3.1));
      g.engine.destruction.carve(new CapsuleShape(a, b, w), { mode: 'explode', power: 3200, sparks: [0.5, 1, 0.5], dust: 0.4, impulse: 14, debris: 0.12 });
      // the trench gouged under it
      const gy = groundAt(g, a.x, a.y, a.z, 6);
      if (gy !== null && a.y - gy < w * 2.5) g.engine.destruction.carve(new SphereShape(new THREE.Vector3(a.x, gy, a.z), w * 1.3, 0.5), { mode: 'explode', power: 1600, impulse: 10, dust: 0.5 });
    }
    const end = from.clone().addScaledVector(dir, range);
    const near = new THREE.Vector3();
    for (const e of g.enemiesOf(owner)) {
      if (e.dead || segDist(e.center(), from, end, near) > w + e.def.radius + 0.4) continue;
      g.damage(e, o.dmg, owner, dir, { energy: true, knock: 24, launch: 7, heavy: true, hitstop: 0.2, shake: 0.8, color: new THREE.Color(colors.edge).getStyle() });
      lightningBurst(g, near.clone(), colors, 8, 3, 0.14);
      o.onHit?.(e);
    }
    this.beam = new BeamMesh(g, colors);
    this.bolts = new ThickBolts(g, 160, colors);
    flash(g, from, colors, 5, 16);
    g.sfx.play('beam', from, 2);
    g.sfx.play('explode', from, 1.4);
    g.shake(owner === g.player ? 0.8 : 0.35);
    g.slowMo(0.4, 0.4);
    g.engine.gr.chroma.offset.set(0.01, 0.01);
    this.render(1);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const dur = this.o.dur ?? 0.6;
    this.tick -= dt;
    if (this.tick <= 0 && this.t < dur) {
      this.tick = 0.1;
      const end = this.from.clone().addScaledVector(this.dir, this.len);
      for (const e of g.enemiesOf(this.owner)) {
        if (e.dead || segDist(e.center(), this.from, end) > (this.o.width ?? 1.8) + e.def.radius + 0.4) continue;
        g.damage(e, this.o.tickDmg, this.owner, this.dir, { energy: true, knock: 4, quiet: true, color: new THREE.Color((this.o.colors ?? BOLT_GREEN).edge).getStyle() });
      }
    }
    if (this.t >= dur + 0.35) this.done = true;
  }

  render(dt: number): void {
    const dur = this.o.dur ?? 0.6;
    const k = this.t < dur ? 1 : Math.max(0, 1 - (this.t - dur) / 0.35);
    const w = this.o.width ?? 1.8;
    const pulse = 0.85 + Math.random() * 0.3;
    this.beam.place(this.from, this.dir, this.len, w * 0.35 * pulse * (0.4 + 0.6 * k), w * (0.8 + 0.4 * k) * pulse, k);
    this.bolts.opacity = k;
    this.flick -= dt;
    if (this.flick > 0) return;
    this.flick = 0.035;
    this.bolts.begin();
    const side = _v.set(0, 1, 0).cross(this.dir).normalize();
    const up = _w.crossVectors(this.dir, side).normalize();
    for (let i = 0; i < 10; i++) {
      const s0 = Math.random() * this.len * 0.85;
      const s1 = s0 + 5 + Math.random() * 12;
      const off = () => side.clone().multiplyScalar((Math.random() - 0.5) * w * 3).addScaledVector(up, (Math.random() - 0.5) * w * 3);
      this.bolts.bolt(this.from.clone().addScaledVector(this.dir, s0).add(off()), this.from.clone().addScaledVector(this.dir, Math.min(this.len, s1)).add(off()), w * 0.5, 7, 0.2);
    }
    this.bolts.end();
  }

  dispose(): void {
    this.beam.dispose();
    this.bolts.dispose();
  }
}
