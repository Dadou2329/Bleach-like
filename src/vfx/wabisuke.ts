// Izuru Kira's effects (docs/kits/kira.md). Wabisuke's weight: multiplier tags and indigo rings that slide down
// whatever has been doubled, dust and cracks under very heavy feet. Hadō #58 Tenran: a widening tornado that
// pushes and lifts and tears the surface up. Bakudō #39 Enkōsen: a spinning disc of dull-yellow light before his
// palm. Bakudō #73 Tōzanshō: an inverted pyramid of blue light round a target (or round himself). Bakudō #37
// Tsuriboshi: a net of light that catches him. Kaidō's green glow, Gaten's drop. Debris Rain [novel]: chunks of
// ground torn up by the whirlwind, struck until they weigh ×16, dropped on the target.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { box, ellipsoid } from '../models/sdf';
import { PropMesh } from '../game/characterFactory';
import { SphereShape } from '../destruction/shapes';
import { groundAt } from './iceArts';
import { TEX_GLOW, TEX_PUFF, TEX_RING, TEX_STREAK } from './sprites';

export const KIRA_BLUE = { core: '#DCEBFF', body: '#4F8FE0', rim: '#2A5AA8' };
const LIGHT = new THREE.Color('#9FC2FF');
const DEEP = new THREE.Color('#3B3F9E');
const WIND = new THREE.Color('#D9F2FF');
const DISC = new THREE.Color('#C9B14A');
const TOZAN = new THREE.Color('#3F86FF');
const TOZAN_EDGE = new THREE.Color('#BFE0FF');
const NET = new THREE.Color('#5AA8FF');
const KAIDO = new THREE.Color('#6BE08A');
const GATEN = new THREE.Color('#5ED16A');

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _a = new THREE.Vector3();
const _c = new THREE.Color();
const Z = new THREE.Vector3(0, 0, 1);

/** pale blue deepening to indigo as the doublings climb (n of 10) */
export function weightColor(n: number, out = new THREE.Color()): THREE.Color {
  return out.copy(LIGHT).lerp(DEEP, Math.max(0, Math.min(1, n / 9)));
}

export function weightHex(n: number): string {
  return `#${weightColor(n, _c).getHexString()}`;
}

/** a flat ring of weight at a point, sinking (a doubling landing; bigger and darker as the weight climbs) */
export function weightRing(g: Game, at: THREE.Vector3, n: number, size = 0.5): void {
  const c = weightColor(n, _c);
  g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, vy: -1.6, size: size * 0.4, sizeEnd: size * (1.2 + n * 0.08), life: 0.4, r: c.r * 1.6, g: c.g * 1.6, b: c.b * 1.8, alpha: 0.9, alphaEnd: 0, tex: TEX_RING });
  g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, size: size * 0.6, sizeEnd: 0.05, life: 0.18, r: 1.2, g: 1.3, b: 1.6, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
}

/**
 * The weight showing on a fighter each frame: rings sliding down the body (and off the weapon's tip), dust and
 * grit under feet that weigh ×16 and more, the ground cracking under ×64 (call with the frame's dt).
 */
export function weighDown(g: Game, o: Fighter, dt: number): void {
  const glow = g.engine.glow;
  const nb = o.heavyB, nw = o.heavyW;
  if (nb > 0 && Math.random() < dt * (1.5 + nb * 1.2)) {
    const c = weightColor(nb, _c);
    const y = o.pos.y + o.def.height * (0.35 + Math.random() * 0.55);
    glow.spawn({ x: o.pos.x, y, z: o.pos.z, vy: -2.2 - nb * 0.4, size: o.def.radius * 2.4, sizeEnd: o.def.radius * 2.8, life: 0.35, r: c.r * 1.3, g: c.g * 1.3, b: c.b * 1.6, alpha: 0.55, alphaEnd: 0, tex: TEX_RING, rot: 0 });
  }
  if (nw > 0 && o.bladeValid && Math.random() < dt * (1 + nw)) {
    const tip = o.blade.tip;
    const c = weightColor(nw, _c);
    glow.spawn({ x: tip.x, y: tip.y, z: tip.z, vy: -3 - nw * 0.5, size: 0.18, sizeEnd: 0.4, life: 0.3, r: c.r * 1.5, g: c.g * 1.5, b: c.b * 1.8, alpha: 0.8, alphaEnd: 0, tex: TEX_RING });
    // a blade heavy enough drags: sparks where its point meets the ground
    if (nw >= 4) {
      const gy = groundAt(g, tip.x, tip.y + 0.3, tip.z, 0.8);
      if (gy !== null && tip.y - gy < 0.25)
        glow.spawn({ x: tip.x, y: gy + 0.04, z: tip.z, vx: (Math.random() - 0.5) * 4, vy: 1 + Math.random() * 2, vz: (Math.random() - 0.5) * 4, size: 0.08, sizeEnd: 0.02, life: 0.25, r: 1, g: 0.85, b: 0.5, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2, gravity: -9 });
    }
  }
  if (nb >= 4 && o.grounded && Math.random() < dt * nb * 0.8) {
    const a = Math.random() * Math.PI * 2, r = o.def.radius * (0.6 + Math.random() * 0.8);
    g.engine.dust.spawn({ x: o.pos.x + Math.cos(a) * r, y: o.pos.y + 0.05, z: o.pos.z + Math.sin(a) * r, vx: Math.cos(a) * 1.5, vy: 0.3, vz: Math.sin(a) * 1.5, size: 0.3, sizeEnd: 0.8, life: 0.6, r: 0.6, g: 0.57, b: 0.52, alpha: 0.4, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
  }
}

// ------------------------------------------------------------------ Tenran

export interface TenranOpts {
  speed: number;
  range: number;
  /** damage per touch (every 0.15 s) */
  damage: number;
  /** called once per fighter it first catches */
  onCatch?: (o: Fighter) => void;
}

/** Hadō #58 Tenran: a tornado off the spinning blade that widens as it travels, pushing and lifting, tearing the surface up. */
export class TenranWind implements Projectile {
  done = false;
  readonly pos: THREE.Vector3;
  private dir: THREE.Vector3;
  private travelled = 0;
  private tick = 0;
  private carveAt = 0;
  private caught = new Set<number>();
  private spin = 0;
  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, dir: THREE.Vector3, private o: TenranOpts) {
    this.pos = from.clone();
    this.dir = dir.clone().setY(0).normalize();
    g.sfx.play('swingHeavy', from, 1.1);
  }
  get radius(): number {
    return 0.6 + 1.6 * Math.min(1, this.travelled / this.o.range);
  }
  update(dt: number, g: Game): void {
    const step = this.o.speed * dt;
    this.pos.addScaledVector(this.dir, step);
    this.travelled += step;
    const gy = groundAt(g, this.pos.x, this.pos.y + 1.5, this.pos.z, 6);
    if (gy !== null) this.pos.y += (gy - this.pos.y) * Math.min(1, dt * 10);
    if (this.travelled >= this.o.range) {
      this.done = true;
      return;
    }
    const r = this.radius;
    this.spin += dt * 14;
    // the funnel: streaks wound round its axis, widening as they climb
    const glow = g.engine.glow;
    const p = this.pos;
    for (let i = 0; i < 26; i++) {
      const h = Math.random() * 3.8;
      const rr = r * (0.35 + (h / 3.8) * 0.75) + Math.random() * 0.2;
      const a = this.spin + Math.random() * Math.PI * 2;
      const tx = -Math.sin(a), tz = Math.cos(a);
      glow.spawn({ x: p.x + Math.cos(a) * rr, y: p.y + h, z: p.z + Math.sin(a) * rr, vx: tx * (7 + h * 2) + this.dir.x * this.o.speed, vy: 2 + Math.random() * 2, vz: tz * (7 + h * 2) + this.dir.z * this.o.speed, size: 0.34, sizeEnd: 0.08, life: 0.32 + Math.random() * 0.2, r: WIND.r * 1.6, g: WIND.g * 1.6, b: WIND.b * 1.8, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: 4, drag: 1 });
    }
    // the body of the wind: pale curls filling the funnel
    for (let i = 0; i < 3; i++) {
      const h = Math.random() * 3.4, a = this.spin + Math.random() * Math.PI * 2, rr = r * (0.3 + (h / 3.4) * 0.6);
      g.engine.dust.spawn({ x: p.x + Math.cos(a) * rr, y: p.y + h, z: p.z + Math.sin(a) * rr, vx: -Math.sin(a) * 6 + this.dir.x * this.o.speed, vy: 1.5, vz: Math.cos(a) * 6 + this.dir.z * this.o.speed, size: 0.7, sizeEnd: 1.6, life: 0.45, r: 0.86, g: 0.92, b: 0.97, alpha: 0.35, alphaEnd: 0, tex: TEX_PUFF, drag: 1.5 });
    }
    if (Math.random() < 0.8) {
      const a = Math.random() * Math.PI * 2, rr = r * (0.8 + Math.random() * 0.4);
      g.engine.dust.spawn({ x: p.x + Math.cos(a) * rr, y: p.y + 0.15, z: p.z + Math.sin(a) * rr, vx: -Math.sin(a) * 6, vy: 2.5 + Math.random() * 2, vz: Math.cos(a) * 6, size: 0.5, sizeEnd: 1.6, life: 0.7, r: 0.66, g: 0.62, b: 0.56, alpha: 0.45, alphaEnd: 0, tex: TEX_PUFF, drag: 1.2 });
    }
    // the surface it crosses torn up and flung into the funnel
    if (this.travelled >= this.carveAt) {
      this.carveAt = this.travelled + 0.9;
      g.engine.destruction.carve(new SphereShape(new THREE.Vector3(p.x, p.y, p.z), 0.55 + r * 0.15, 0.4), { mode: 'smash', power: 120, impulse: 9, dust: 0.6 });
    }
    // pushes and lifts what it catches
    this.tick -= dt;
    if (this.tick > 0) return;
    this.tick = 0.15;
    for (const o of g.enemiesOf(this.owner)) {
      if (o.dead) continue;
      const dx = o.pos.x - p.x, dz = o.pos.z - p.z;
      if (dx * dx + dz * dz > (r + o.def.radius) ** 2 || o.pos.y > p.y + 4 || o.pos.y + o.def.height < p.y - 0.5) continue;
      const first = !this.caught.has(o.id);
      this.caught.add(o.id);
      g.damage(o, this.o.damage, this.owner, this.dir.clone(), { knock: first ? 9 : 2.5, launch: first ? 6 : 2.5, quiet: !first, hitstop: 0.03 });
      if (first) this.o.onCatch?.(o);
    }
  }
  /** swatted aside (Abirama's wings): a strong enough blow undoes it */
  reject(at: THREE.Vector3, radius: number, by: Fighter): boolean {
    if (this.done || by.team === this.owner.team || this.pos.distanceTo(at) > radius + this.radius) return false;
    this.done = true;
    return true;
  }
  dispose(): void {}
}

// ------------------------------------------------------------------ Enkōsen

/** Bakudō #39 Enkōsen: a disc of dull-yellow light spinning before his palm. It turns blows and shots from the front. */
export class EnkosenDisc implements Projectile {
  done = false;
  private t = 0;
  private group = new THREE.Group();
  private disc: THREE.Mesh;
  private spokes: THREE.LineSegments;
  private rim: THREE.Mesh;
  /** blows it can still turn */
  hp = 2;
  constructor(private g: Game, readonly owner: Fighter, readonly dur: number) {
    const mat = new THREE.MeshBasicMaterial({ color: DISC.clone().multiplyScalar(1.4), transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.disc = new THREE.Mesh(new THREE.CircleGeometry(0.85, 36), mat);
    const pts: number[] = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      pts.push(Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0.01, Math.cos(a + 0.5) * 0.82, Math.sin(a + 0.5) * 0.82, 0.01);
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    this.spokes = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: DISC.clone().multiplyScalar(2.4), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.rim = new THREE.Mesh(new THREE.RingGeometry(0.8, 0.88, 40), new THREE.MeshBasicMaterial({ color: DISC.clone().multiplyScalar(2.2), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    this.group.add(this.disc, this.spokes, this.rim);
    this.group.traverse((m) => {
      m.frustumCulled = false;
      m.renderOrder = 7;
    });
    g.engine.gr.scene.add(this.group);
    g.sfx.play('ting', owner.center(), 0.8);
  }
  /** the centre of the disc and its facing */
  centre(out: THREE.Vector3): THREE.Vector3 {
    const f = this.owner;
    return f.center(out).addScaledVector(f.forward(_a), 0.75);
  }
  /** a blow turned: the disc cracks (a heavy one shatters it); returns false once it is broken */
  absorb(heavy: boolean): void {
    this.hp -= heavy ? 2 : 1;
    const c = this.centre(_v);
    this.g.sparks(c, this.owner.forward(_w), '#E8D27A', 10);
    if (this.hp <= 0) this.shatter();
  }
  shatter(): void {
    if (this.done) return;
    const c = this.centre(_v);
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * Math.PI * 2, s = 3 + Math.random() * 6;
      this.g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: (Math.random() - 0.5) * 4, size: 0.12, sizeEnd: 0.02, life: 0.4, r: DISC.r * 2, g: DISC.g * 2, b: DISC.b * 1.6, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2, gravity: -6 });
    }
    this.g.sfx.play('impact', c, 0.7);
    this.done = true;
  }
  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.t >= this.dur || this.owner.dead) {
      this.done = true;
      return;
    }
    // shots from the front stop on it
    g.rejectNear(this.centre(_v), 1.0, this.owner, false);
  }
  render(): void {
    const f = this.owner;
    const c = this.centre(_v);
    this.group.position.copy(c);
    this.group.quaternion.setFromUnitVectors(Z, f.forward(_w));
    this.group.rotateZ(this.t * 9);
    const k = Math.min(1, this.t / 0.06) * Math.min(1, (this.dur - this.t) / 0.12);
    this.group.scale.setScalar(0.4 + 0.6 * k);
    const crack = this.hp < 2 ? 0.6 : 1;
    (this.disc.material as THREE.MeshBasicMaterial).opacity = 0.38 * k * crack;
    (this.rim.material as THREE.MeshBasicMaterial).opacity = 0.9 * k;
    (this.spokes.material as THREE.LineBasicMaterial).opacity = 0.9 * k * crack;
  }
  dispose(): void {
    this.group.removeFromParent();
    this.group.traverse((m) => {
      const mm = m as THREE.Mesh;
      mm.geometry?.dispose();
      (mm.material as THREE.Material | undefined)?.dispose();
    });
  }
}

// ------------------------------------------------------------------ Tōzanshō

/**
 * Bakudō #73 Tōzanshō: an inverted pyramid of light, its point at the feet and its square mouth overhead, closed
 * round a target (rooted, its shots stay inside) or round the caster (nothing gets in). The kit applies the rules;
 * this draws it and stops shots inside.
 */
export class Tozansho implements Projectile {
  done = false;
  private t = 0;
  private group = new THREE.Group();
  private faces: THREE.Mesh;
  private edges: THREE.LineSegments;
  constructor(private g: Game, readonly owner: Fighter, readonly inside: Fighter, readonly dur: number, readonly half = 1.7, readonly height = 3.6) {
    const s = half, h = height;
    // the point at the origin (the feet), the mouth at y = h
    const top = [[-s, h, -s], [s, h, -s], [s, h, s], [-s, h, s]];
    const tri: number[] = [];
    for (let i = 0; i < 4; i++) {
      const a = top[i], b = top[(i + 1) % 4];
      tri.push(0, -0.1, 0, ...a, ...b);
    }
    tri.push(...top[0], ...top[1], ...top[2], ...top[0], ...top[2], ...top[3]);
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.Float32BufferAttribute(tri, 3));
    this.faces = new THREE.Mesh(fg, new THREE.MeshBasicMaterial({ color: TOZAN.clone().multiplyScalar(1.1), transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    const ln: number[] = [];
    for (let i = 0; i < 4; i++) {
      const a = top[i], b = top[(i + 1) % 4];
      ln.push(0, -0.1, 0, ...a, ...a, ...b);
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(ln, 3));
    this.edges = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: TOZAN_EDGE.clone().multiplyScalar(2.4), transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.group.add(this.faces, this.edges);
    this.group.traverse((m) => {
      m.frustumCulled = false;
      m.renderOrder = 7;
    });
    g.engine.gr.scene.add(this.group);
    g.sfx.play('ting', inside.center(), 1);
    g.addRing(inside.pos.clone().setY(inside.pos.y + 0.05), 3, TOZAN_EDGE, 0.4);
  }
  get centre(): THREE.Vector3 {
    return this.inside.center(_a);
  }
  /** broken early (the kit ends it) */
  end(): void {
    if (this.done) return;
    this.done = true;
    const c = this.inside.center(_v);
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2, e = Math.random() * 3.2;
      this.g.engine.glow.spawn({ x: c.x + Math.cos(a) * this.half * (e / 3.2), y: this.inside.pos.y + e, z: c.z + Math.sin(a) * this.half * (e / 3.2), vx: Math.cos(a) * 2, vy: 1, vz: Math.sin(a) * 2, size: 0.12, sizeEnd: 0.02, life: 0.5, r: TOZAN_EDGE.r * 2, g: TOZAN_EDGE.g * 2, b: TOZAN_EDGE.b * 2, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    }
  }
  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.t >= this.dur || this.inside.dead || this.owner.dead) {
      this.end();
      return;
    }
    // no shot crosses its walls: the caster's enemies' shots inside it are undone
    g.rejectNear(this.inside.center(_v), this.half + 0.3, this.owner, false);
    if (Math.random() < dt * 10) {
      const e = Math.random(), a = Math.floor(Math.random() * 4);
      const s = this.half * e, h = this.height * e;
      const corner = [[-s, -s], [s, -s], [s, s], [-s, s]][a];
      const p = this.inside.pos;
      g.engine.glow.spawn({ x: p.x + corner[0], y: p.y + h, z: p.z + corner[1], vy: 0.6, size: 0.14, sizeEnd: 0.02, life: 0.4, r: TOZAN_EDGE.r * 2, g: TOZAN_EDGE.g * 2, b: TOZAN_EDGE.b * 2, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    }
  }
  render(): void {
    const p = this.inside.pos;
    this.group.position.set(p.x, p.y, p.z);
    const k = Math.min(1, this.t / 0.12) * Math.min(1, (this.dur - this.t) / 0.15);
    this.group.scale.set(1, 0.3 + 0.7 * Math.min(1, this.t / 0.12), 1);
    (this.faces.material as THREE.MeshBasicMaterial).opacity = 0.22 * k;
    (this.edges.material as THREE.LineBasicMaterial).opacity = k;
  }
  dispose(): void {
    this.group.removeFromParent();
    this.faces.geometry.dispose();
    (this.faces.material as THREE.Material).dispose();
    this.edges.geometry.dispose();
    (this.edges.material as THREE.Material).dispose();
  }
}

// ------------------------------------------------------------------ Tsuriboshi, Kaidō, Gaten

/** Bakudō #37 Tsuriboshi: a net of light strung behind him on four points, bowing as it catches him. */
export class TsuriboshiNet implements Projectile {
  done = false;
  private t = 0;
  private lines: THREE.LineSegments;
  private at: THREE.Vector3;
  private normal: THREE.Vector3;
  constructor(g: Game, f: Fighter, from: THREE.Vector3) {
    // the net faces the way he was flying from
    this.normal = from.clone().setY(0);
    if (this.normal.lengthSq() < 1e-4) f.forward(this.normal).negate();
    this.normal.normalize();
    this.at = f.center().addScaledVector(this.normal, -0.5);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(6 * 2 * 7 * 3), 3));
    this.lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: NET.clone().multiplyScalar(2.2), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.lines.frustumCulled = false;
    this.lines.renderOrder = 7;
    g.engine.gr.scene.add(this.lines);
    g.sfx.play('ting', this.at, 0.9);
    const side = _v.set(this.normal.z, 0, -this.normal.x);
    for (const [u, w] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const p = _w.copy(this.at).addScaledVector(side, u * 1.3).add(_a.set(0, w * 1.1, 0));
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.35, sizeEnd: 0.15, life: 0.7, r: NET.r * 2.2, g: NET.g * 2.2, b: NET.b * 2.2, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    }
  }
  update(dt: number): void {
    this.t += dt;
    if (this.t > 0.7) this.done = true;
  }
  render(): void {
    const pos = this.lines.geometry.getAttribute('position') as THREE.BufferAttribute;
    const side = _v.set(this.normal.z, 0, -this.normal.x);
    // the bow: deepest at the middle, springing back
    const bow = Math.sin(Math.min(1, this.t / 0.5) * Math.PI) * 0.55;
    const pt = (u: number, w: number, out: THREE.Vector3) => out.copy(this.at).addScaledVector(side, u * 1.3).add(_a.set(0, w * 1.1, 0)).addScaledVector(this.normal, -bow * (1 - u * u) * (1 - w * w));
    let i = 0;
    const p0 = new THREE.Vector3(), p1 = new THREE.Vector3();
    for (let k = 0; k <= 6; k++) {
      const s = -1 + (k / 6) * 2;
      for (let j = 0; j < 6; j++) {
        const s0 = -1 + (j / 6) * 2, s1 = -1 + ((j + 1) / 6) * 2;
        pt(s, s0, p0); pt(s, s1, p1);
        pos.setXYZ(i++, p0.x, p0.y, p0.z); pos.setXYZ(i++, p1.x, p1.y, p1.z);
        pt(s0, s, p0); pt(s1, s, p1);
        pos.setXYZ(i++, p0.x, p0.y, p0.z); pos.setXYZ(i++, p1.x, p1.y, p1.z);
      }
    }
    pos.needsUpdate = true;
    (this.lines.material as THREE.LineBasicMaterial).opacity = 0.95 * Math.min(1, (0.7 - this.t) / 0.25);
  }
  dispose(): void {
    this.lines.removeFromParent();
    this.lines.geometry.dispose();
    (this.lines.material as THREE.Material).dispose();
  }
}

/** Kaidō's glow over the hands (one frame's worth) */
export function kaidoGlow(g: Game, at: THREE.Vector3, k = 1): void {
  const glow = g.engine.glow;
  glow.spawn({ x: at.x, y: at.y, z: at.z, size: 0.5 * k, sizeEnd: 0.7 * k, life: 0.12, r: KAIDO.r * 1.4, g: KAIDO.g * 1.4, b: KAIDO.b * 1.2, alpha: 0.5, alphaEnd: 0, tex: TEX_GLOW });
  if (Math.random() < 0.5)
    glow.spawn({ x: at.x + (Math.random() - 0.5) * 0.4, y: at.y + (Math.random() - 0.5) * 0.3, z: at.z + (Math.random() - 0.5) * 0.4, vy: 0.8, size: 0.07, sizeEnd: 0.02, life: 0.5, r: KAIDO.r * 2, g: KAIDO.g * 2, b: KAIDO.b * 1.6, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
}

/** Gaten: a drop of green liquid on the neck */
export function gatenDrop(g: Game, at: THREE.Vector3): void {
  const glow = g.engine.glow;
  glow.spawn({ x: at.x, y: at.y, z: at.z, size: 0.25, sizeEnd: 0.6, life: 0.3, r: GATEN.r * 1.8, g: GATEN.g * 1.8, b: GATEN.b * 1.4, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
  for (let i = 0; i < 8; i++)
    glow.spawn({ x: at.x, y: at.y, z: at.z, vx: (Math.random() - 0.5) * 2, vy: Math.random() * 1.5, vz: (Math.random() - 0.5) * 2, size: 0.06, sizeEnd: 0.02, life: 0.4, r: GATEN.r * 2, g: GATEN.g * 2, b: GATEN.b * 1.6, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, gravity: -6 });
}

// ------------------------------------------------------------------ Debris Rain

const rocks: VoxelModel[] = [];

/** a chunk of street torn up (16 vox/m): concrete under a skin of asphalt, rough-edged */
function rockModel(i: number): VoxelModel {
  if (!rocks[i]) {
    const b = new ModelBuilder(`rubble-${i}`, 16);
    b.mat('stone', ['#9A9792', '#86837E', '#716E69', '#5C5955'], { base: 1, rough: 0.9, shadeK: 0.9 });
    b.mat('asphalt', ['#5C5E63', '#4E5055', '#404247'], { base: 1, rough: 0.95 });
    b.bone('root', null, [0, 0, 0]);
    const s = [[5, 3.4, 4.2], [4.2, 3, 5], [4.6, 3.8, 3.8]][i % 3];
    b.add('root', box([0, 0, 0], [s[0], s[1], s[2]], { round: 1.2, rot: [i * 17, i * 31, i * 11] }), 'stone', { thr: 0.3 });
    b.add('root', ellipsoid([1.5 - i, 1, -1], [s[0] * 0.7, s[1] * 0.8, s[2] * 0.6]), 'stone', { thr: 0.3 });
    b.paint('root', box([0, s[1] + 2, 0], [8, 2.6, 8], { rot: [i * 17, i * 31, i * 11] }), 'asphalt', { where: b.isMat('stone') });
    b.autoShade({ up: 0.5, open: 2, front: 0 });
    b.lint();
    rocks[i] = b.build();
  }
  return rocks[i];
}

export interface ChunkOpts {
  /** time it rises, then hovers until struck and dropped */
  rise: number;
  /** damage on the one it lands on (and next to) */
  damage: number;
  onHit?: (o: Fighter) => void;
}

/**
 * One chunk of the Debris Rain: torn up out of the ground, it hovers in the whirlwind; `strike` doubles it (a ring
 * and its multiplier), `drop` sends it down onto a point like a stone ten times its size.
 */
export class DebrisChunk implements Projectile {
  done = false;
  readonly pos: THREE.Vector3;
  private mesh: PropMesh;
  private t = 0;
  private from: THREE.Vector3;
  private hover: THREE.Vector3;
  private spin = new THREE.Vector3(Math.random() * 3, Math.random() * 3, Math.random() * 3);
  private falling: THREE.Vector3 | null = null;
  private vel = new THREE.Vector3();
  weight = 0;
  constructor(private g: Game, readonly owner: Fighter, ground: THREE.Vector3, hover: THREE.Vector3, private o: ChunkOpts) {
    this.from = ground.clone();
    this.hover = hover.clone();
    this.pos = ground.clone();
    this.mesh = new PropMesh(rockModel(Math.floor(Math.random() * 3)));
    this.mesh.position.copy(ground);
    g.engine.gr.scene.add(this.mesh);
    // where it came from: a hole in the street
    g.engine.destruction.carve(new SphereShape(ground.clone(), 0.6, 0.5), { mode: 'smash', power: 160, impulse: 6, dust: 0.8 });
  }
  /** struck: one more doubling (`tag`: float its multiplier) */
  strike(tag = true): void {
    this.weight++;
    weightRing(this.g, this.pos, this.weight + 2, 0.9);
    if (tag) this.g.hud?.floatText(this.pos.clone().setY(this.pos.y + 0.6), `×${2 ** this.weight}`, weightHex(this.weight + 2), 16);
    this.g.sfx.play('ting', this.pos, 0.5);
    this.spin.multiplyScalar(0.6);
  }
  drop(at: THREE.Vector3): void {
    this.falling = at.clone();
    this.vel.set(0, 6, 0);
  }
  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.owner.dead && !this.falling) this.drop(this.pos.clone().setY(this.pos.y - 6));
    if (!this.falling) {
      const k = Math.min(1, this.t / this.o.rise);
      const e = 1 - (1 - k) ** 3;
      this.pos.lerpVectors(this.from, this.hover, e);
      this.pos.y += Math.sin(this.t * 3 + this.from.x) * 0.08 * k;
      if (this.t > 6) this.drop(this.pos.clone().setY(this.pos.y - 6));
      return;
    }
    // down onto the point, heavier the more it was struck
    _v.subVectors(this.falling, this.pos);
    const d = _v.length();
    const sp = 26 + this.weight * 4;
    this.vel.lerp(_v.normalize().multiplyScalar(sp), Math.min(1, dt * 8));
    this.pos.addScaledVector(this.vel, dt);
    if (Math.random() < 0.6) g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, size: 0.5, sizeEnd: 0.2, life: 0.2, r: DEEP.r * 1.6, g: DEEP.g * 1.6, b: DEEP.b * 2, alpha: 0.5, alphaEnd: 0, tex: TEX_GLOW });
    // a fighter in the way
    let struck: Fighter | null = null;
    for (const o of g.enemiesOf(this.owner)) {
      if (o.dead) continue;
      const cy = Math.max(o.pos.y, Math.min(o.pos.y + o.def.height, this.pos.y));
      if (Math.hypot(o.pos.x - this.pos.x, cy - this.pos.y, o.pos.z - this.pos.z) < o.def.radius + 0.45) struck = o;
    }
    const gy = groundAt(g, this.pos.x, this.pos.y + 0.5, this.pos.z, 1.2);
    if (struck || d < 0.4 || (gy !== null && this.pos.y <= gy + 0.2)) this.land(g);
  }
  private land(g: Game): void {
    this.done = true;
    const p = this.pos;
    g.engine.destruction.carve(new SphereShape(p.clone(), 0.75 + this.weight * 0.06, 0.5), { mode: 'smash', power: 360 + this.weight * 80, impulse: 10, dust: 1 });
    g.sfx.play('impact', p, 0.9);
    for (const o of g.enemiesOf(this.owner)) {
      if (o.dead) continue;
      const cy = Math.max(o.pos.y, Math.min(o.pos.y + o.def.height, p.y));
      if (Math.hypot(o.pos.x - p.x, cy - p.y, o.pos.z - p.z) > o.def.radius + 1.1) continue;
      g.damage(o, this.o.damage, this.owner, _w.set(0, -1, 0).clone(), { knock: 2, heavy: true, hitstop: 0.05, shake: 0.2 });
      if (!o.def.boss && !o.grounded) o.body.vel.y = Math.min(o.body.vel.y, -14);
      this.o.onHit?.(o);
    }
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.dust.spawn({ x: p.x, y: p.y + 0.2, z: p.z, vx: Math.cos(a) * 4, vy: 1 + Math.random() * 2, vz: Math.sin(a) * 4, size: 0.5, sizeEnd: 1.4, life: 0.8, r: 0.6, g: 0.57, b: 0.52, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
    }
  }
  render(): void {
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.x += this.spin.x * 0.016;
    this.mesh.rotation.y += this.spin.y * 0.016;
    this.mesh.rotation.z += this.spin.z * 0.016;
  }
  dispose(): void {
    this.mesh.removeFromParent();
  }
}

/** the stomp of a foot doubled seven times: a crater, a ring of shock, grit thrown up */
export function heavyStomp(g: Game, at: THREE.Vector3, radius: number, power: number): void {
  g.engine.destruction.carve(new SphereShape(at.clone(), radius, 0.45), { mode: 'smash', power, impulse: 12, dust: 1.2 });
  g.addRing(at.clone().setY(at.y + 0.05), radius * 2.4, '#7F8CFF', 0.5);
  weightRing(g, at.clone().setY(at.y + 0.1), 9, radius * 1.4);
  g.sfx.play('explode', at, 0.9);
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    g.engine.dust.spawn({ x: at.x + Math.cos(a) * radius * 0.7, y: at.y + 0.2, z: at.z + Math.sin(a) * radius * 0.7, vx: Math.cos(a) * (6 + Math.random() * 5), vy: 0.6 + Math.random(), vz: Math.sin(a) * (6 + Math.random() * 5), size: 0.6, sizeEnd: 2.2, life: 1 + Math.random() * 0.5, r: 0.62, g: 0.58, b: 0.52, alpha: 0.55, alphaEnd: 0, tex: TEX_PUFF, drag: 2.2 });
  }
}
