// Lille Barro's effects (docs/kits/lille.md). The X-Axis: an instant piercing force — a perfectly round tunnel through
// everything between the muzzle and the target, a faint green shimmer along the line, a green ring where it went in;
// no guard stops it and nothing behind the target is touched (xAxis, xAxisLine, XTrace). Heilig Pfeil bullets
// (PfeilBullet: fast, a small crater; the Scoped Shot's is hyper-condensed and takes a building apart). The X reticle
// that settles on a target before the long shots (Reticle). Jilliel: the 24-barrel barrage raining from the wing holes
// (WingBarrage), Divine Pressure, the spiral teleport, Judgement of God (JudgementColumn: the holes converge, a column
// bores a pit). The True Form: Sabaki no Kōmyō's explosion trail (the cut itself is a PlanarSlash), the light ball,
// Trompete (reishi drawn in, then spherical waves), the golden rain. Long tunnels are carved in short segments.
import * as THREE from 'three';
import type { Fighter } from '../game/fighter';
import type { Game, Projectile } from '../game/game';
import { PropMesh } from '../game/characterFactory';
import { CapsuleShape, SphereShape } from '../destruction/shapes';
import { raycastVoxels } from '../voxel/raycast';
import { lilleGodProp } from '../chars/lilleGod';
import { TEX_GLOW, TEX_PUFF, TEX_RING, TEX_STREAK } from './sprites';

export const X_GREEN = '#7CF0A8';
export const BULLET_GREEN = '#B8FFD2';
export const JILLIEL_GREEN = '#4FE38A';
export const GOLD = '#F2C74E';
export const GOLD_LIGHT = '#FFF6D0';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _c = new THREE.Color();

/** a round tunnel from a to b, carved in short segments (a long capsule's box would be enormous) */
export function tunnel(g: Game, a: THREE.Vector3, b: THREE.Vector3, r: number, power = 100000, mode: 'erase' | 'bore' = 'erase'): void {
  const len = a.distanceTo(b);
  const n = Math.max(1, Math.ceil(len / 2.2));
  const p0 = new THREE.Vector3(), p1 = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    p0.lerpVectors(a, b, i / n);
    p1.lerpVectors(a, b, (i + 1) / n);
    g.engine.destruction.carve(new CapsuleShape(p0.clone(), p1.clone(), r), { mode, power, debris: mode === 'erase' ? 0 : undefined, dust: 0.15, noCollapse: false });
  }
}

/** the faint shimmer of an X-Axis line: a thread of light that is gone in a blink */
export class XTrace implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.Mesh;
  private mat: THREE.MeshBasicMaterial;
  constructor(private g: Game, a: THREE.Vector3, b: THREE.Vector3, color: THREE.ColorRepresentation = X_GREEN, readonly width = 0.035, readonly life = 0.22) {
    this.mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2.2), transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending });
    const len = a.distanceTo(b);
    const geo = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
    geo.translate(0, 0.5, 0);
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.position.copy(a);
    this.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), _v.subVectors(b, a).normalize());
    this.mesh.scale.set(width, len, width);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 6;
    g.engine.gr.scene.add(this.mesh);
    // the shimmer along it
    const c = _c.set(color);
    const n = Math.min(24, Math.ceil(len / 1.5));
    for (let i = 0; i < n; i++) {
      const p = _w.lerpVectors(a, b, Math.random());
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.18, sizeEnd: 0.04, life: 0.2 + Math.random() * 0.15, r: c.r, g: c.g, b: c.b, alpha: 0.5, alphaEnd: 0, tex: TEX_GLOW });
    }
  }
  update(dt: number): void {
    this.t += dt;
    const k = 1 - this.t / this.life;
    this.mat.opacity = Math.max(0, k) * 0.85;
    this.mesh.scale.x = this.mesh.scale.z = this.width * (0.4 + k * 0.6);
    if (this.t >= this.life) this.done = true;
  }
  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}

/** a ring of green light where the X-Axis went in (the hole is perfectly round) */
export function holeRing(g: Game, at: THREE.Vector3, size = 0.5, color: THREE.ColorRepresentation = X_GREEN): void {
  const c = _c.set(color);
  g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, size: size * 0.4, sizeEnd: size * 1.4, life: 0.3, r: c.r, g: c.g, b: c.b, alpha: 0.9, alphaEnd: 0, tex: TEX_RING });
  g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, size: size * 0.5, sizeEnd: size * 0.1, life: 0.16, r: 1, g: 1, b: 1, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
}

export interface XOpts {
  damage: number;
  /** the tunnel's radius (m) */
  radius?: number;
  color?: THREE.ColorRepresentation;
  knock?: number;
  heavy?: boolean;
  width?: number;
}

/**
 * The X-Axis at one fighter: instant. A tunnel through everything from the muzzle to them; nothing behind them is
 * touched; no guard stops it. Returns where it went in.
 */
export function xAxis(g: Game, owner: Fighter, from: THREE.Vector3, target: Fighter, o: XOpts): THREE.Vector3 {
  const hit = target.center().add(_v.set((Math.random() - 0.5) * 0.25, (Math.random() - 0.3) * 0.4, (Math.random() - 0.5) * 0.25));
  tunnel(g, from, hit, o.radius ?? 0.28);
  const dir = _w.subVectors(hit, from).setY(0);
  if (dir.lengthSq() < 1e-6) dir.copy(owner.forward());
  dir.normalize();
  g.damage(target, o.damage, owner, dir.clone(), { unblockable: true, energy: true, knock: o.knock ?? 3, heavy: o.heavy, hitstop: o.heavy ? 0.1 : 0.06, shake: o.heavy ? 0.35 : 0.15, color: o.color ?? X_GREEN });
  g.addProjectile(new XTrace(g, from, hit, o.color ?? X_GREEN, o.width ?? 0.035));
  holeRing(g, hit, 0.45, o.color ?? X_GREEN);
  holeRing(g, from, 0.35, o.color ?? X_GREEN);
  g.sfx.play('ting', from, 0.5);
  return hit;
}

/**
 * The X-Axis down a line ("line up so I can kill you all"): every enemy within `width` of the line is holed, and the
 * tunnel runs on for its whole length.
 */
export function xAxisLine(g: Game, owner: Fighter, from: THREE.Vector3, dir: THREE.Vector3, len: number, width: number, o: XOpts): Fighter[] {
  const d = dir.clone().normalize();
  const to = from.clone().addScaledVector(d, len);
  tunnel(g, from, to, o.radius ?? 0.32);
  const hit: Fighter[] = [];
  for (const e of g.enemiesOf(owner)) {
    if (e.dead) continue;
    const c = e.center();
    const t = _v.subVectors(c, from).dot(d);
    if (t < 0 || t > len) continue;
    const off = _v.subVectors(c, from).addScaledVector(d, -t).length();
    if (off > width + e.def.radius) continue;
    hit.push(e);
    g.damage(e, o.damage, owner, d.clone().setY(0).normalize(), { unblockable: true, energy: true, knock: o.knock ?? 4, heavy: o.heavy, hitstop: 0.1, shake: 0.4, color: o.color ?? X_GREEN });
    holeRing(g, c, 0.5, o.color ?? X_GREEN);
  }
  g.addProjectile(new XTrace(g, from, to, o.color ?? X_GREEN, (o.width ?? 0.05) * 1.4, 0.3));
  holeRing(g, from, 0.5, o.color ?? X_GREEN);
  g.sfx.play('beam', from, 0.5);
  return hit;
}

// ---------------------------------------------------------------------------------------------- bullets

export interface BulletOpts {
  speed: number;
  damage: number;
  /** crater radius on impact (m) and its power */
  blast: number;
  power: number;
  size?: number;
  color?: THREE.ColorRepresentation;
  knock?: number;
  heavy?: boolean;
  range?: number;
  /** blast damage to those near the impact (a fraction of `damage`) */
  splash?: number;
}

/** A Heilig Pfeil bullet: hyper-condensed reishi, a streak and a small crater. A fast enough blade still cuts it. */
export class PfeilBullet implements Projectile {
  done = false;
  private travelled = 0;
  private vel: THREE.Vector3;
  readonly pos: THREE.Vector3;
  private col: THREE.Color;
  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, dir: THREE.Vector3, readonly o: BulletOpts) {
    this.pos = from.clone();
    this.vel = dir.clone().normalize().multiplyScalar(o.speed);
    this.col = new THREE.Color(o.color ?? BULLET_GREEN);
    holeRing(g, from, (o.size ?? 0.1) * 4, this.col);
    g.sfx.play('gunshot', from, o.blast > 1.5 ? 1.2 : 0.55);
  }
  update(dt: number, g: Game): void {
    if (this.done) return;
    const step = this.vel.length() * dt;
    const dir = _v.copy(this.vel).normalize();
    // a fighter on the path
    let best: Fighter | null = null, bestT = step;
    for (const e of g.enemiesOf(this.owner)) {
      if (e.dead) continue;
      const c = e.center(_w);
      const t = Math.max(0, Math.min(step, (c.x - this.pos.x) * dir.x + (c.y - this.pos.y) * dir.y + (c.z - this.pos.z) * dir.z));
      const px = this.pos.x + dir.x * t - c.x, py = this.pos.y + dir.y * t - c.y, pz = this.pos.z + dir.z * t - c.z;
      const rr = e.def.radius + (this.o.size ?? 0.1) + 0.12;
      if (px * px + pz * pz < rr * rr && Math.abs(py) < e.def.height * 0.55 && t < bestT) { best = e; bestT = t; }
    }
    const wall = raycastVoxels(g.engine.world, this.pos.x, this.pos.y, this.pos.z, dir.x, dir.y, dir.z, step);
    if (best && (!wall || bestT <= wall.dist)) {
      this.pos.addScaledVector(dir, bestT);
      g.damage(best, this.o.damage, this.owner, dir.clone().setY(0).normalize(), { energy: true, knock: this.o.knock ?? 2, heavy: this.o.heavy, hitstop: this.o.heavy ? 0.1 : 0.03, shake: this.o.heavy ? 0.4 : 0.08, color: this.col });
      this.explode(g, best);
      return;
    }
    if (wall) {
      this.pos.addScaledVector(dir, wall.dist);
      this.explode(g, null);
      return;
    }
    this.pos.addScaledVector(dir, step);
    this.travelled += step;
    if (this.travelled > (this.o.range ?? 120)) this.done = true;
    // the streak
    const c = this.col;
    g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, vx: this.vel.x * 0.02, vy: this.vel.y * 0.02, vz: this.vel.z * 0.02, size: (this.o.size ?? 0.1) * 2.4, sizeEnd: 0.02, life: 0.1, r: c.r, g: c.g, b: c.b, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: 4 });
  }
  private explode(g: Game, hit: Fighter | null): void {
    this.done = true;
    const p = this.pos;
    const o = this.o;
    g.engine.destruction.carve(new SphereShape(p.clone(), o.blast), { mode: 'explode', power: o.power, impulse: 6 + o.blast * 4, dust: 0.5 });
    if (o.splash && o.blast > 0.8) {
      for (const e of g.enemiesOf(this.owner)) {
        if (e.dead || e === hit) continue;
        const d = e.center().distanceTo(p);
        if (d < o.blast + e.def.radius) g.damage(e, o.damage * o.splash * (1 - d / (o.blast + e.def.radius + 0.01)), this.owner, _v.subVectors(e.pos, p).setY(0.2).normalize().clone(), { energy: true, knock: 8, launch: 3, hitstop: 0.04 });
      }
    }
    const c = this.col;
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: o.blast * 1.2 + 0.3, sizeEnd: o.blast * 2.2 + 0.4, life: 0.22, r: c.r, g: c.g, b: c.b, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    if (o.blast > 1.5) {
      g.addRing(p.clone(), o.blast * 1.6, c, 0.45);
      g.sfx.play('explode', p, Math.min(1.4, 0.5 + o.blast * 0.2));
      if (g.player && g.player.pos.distanceTo(p) < 30) g.shake(0.25 + o.blast * 0.06);
    } else g.sfx.play('hit', p, 0.35);
  }
  dispose(): void {}
}

/** the X reticle settling on a target before the long shots: two green strokes crossing over them */
export class Reticle implements Projectile {
  done = false;
  private t = 0;
  constructor(private g: Game, readonly target: Fighter, readonly dur: number, readonly color: THREE.ColorRepresentation = X_GREEN) {}
  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.t >= this.dur || this.target.dead) {
      this.done = true;
      return;
    }
    const k = this.t / this.dur;
    const c = this.target.center(_v);
    const col = _c.set(this.color);
    // the strokes close in from wide to tight as the aim settles
    const r = 1.2 - k * 0.75;
    for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]] as [number, number][]) {
      const camR = _w.set(Math.cos(g.cam.yaw), 0, -Math.sin(g.cam.yaw));
      g.engine.glow.spawn({ x: c.x + camR.x * sx * r, y: c.y + sy * r, z: c.z + camR.z * sx * r, size: 0.12, sizeEnd: 0.06, life: dt * 1.5, r: col.r, g: col.g, b: col.b, alpha: 0.9, alphaEnd: 0.6, tex: TEX_GLOW });
    }
    if (Math.random() < dt * 8) g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: 0.3, sizeEnd: 0.8, life: 0.2, r: col.r, g: col.g, b: col.b, alpha: 0.5, alphaEnd: 0, tex: TEX_RING });
  }
  dispose(): void {}
}

// ---------------------------------------------------------------------------------------------- Jilliel

/** The 24-barrel barrage: every hole fires X-Axis shots into the ground round the target, one after another. */
export class WingBarrage implements Projectile {
  done = false;
  private t = 0;
  private fired = 0;
  private spots: THREE.Vector3[] = [];
  constructor(private g: Game, readonly owner: Fighter, private barrel: (i: number) => THREE.Vector3, readonly target: Fighter, readonly n = 24, readonly dur = 1.2, readonly damage = 8, readonly spread = 5) {
    for (let i = 0; i < n; i++) {
      // every third hole aims at them; the rest rake the ground round them
      const a = Math.random() * Math.PI * 2, r = i % 3 === 0 ? Math.random() * 0.4 : 0.8 + Math.sqrt(Math.random()) * (spread - 0.8);
      this.spots.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
    }
  }
  update(dt: number, g: Game): void {
    this.t += dt;
    const want = Math.min(this.n, Math.floor((this.t / this.dur) * this.n) + 1);
    while (this.fired < want) {
      const i = this.fired++;
      if (this.owner.dead) { this.done = true; return; }
      const from = this.barrel(i);
      const tp = this.target.pos;
      // the shot goes through the spot and on into the ground
      const spot = new THREE.Vector3(tp.x + this.spots[i].x, tp.y + (i % 3 === 0 ? 1 : 0.4), tp.z + this.spots[i].z);
      const dir = _v.subVectors(spot, from).normalize().clone();
      const to = spot.clone().addScaledVector(dir, 4);
      tunnel(this.g, from, to, 0.22, 3000, 'bore');
      g.addProjectile(new XTrace(g, from, to, X_GREEN, 0.04, 0.18));
      // where it goes into the ground the earth bursts: whoever stands close is caught in it
      const ground = new THREE.Vector3(spot.x, tp.y, spot.z);
      g.engine.destruction.carve(new SphereShape(ground, 0.5), { mode: 'explode', power: 380, impulse: 4, dust: 0.35 });
      for (const e of g.enemiesOf(this.owner)) {
        if (e.dead) continue;
        const c = e.center(_w);
        const t = Math.max(0, Math.min(from.distanceTo(to), _v.copy(c).sub(from).dot(dir)));
        const off = _v.copy(from).addScaledVector(dir, t).distanceTo(c);
        const near = Math.hypot(e.pos.x - ground.x, e.pos.z - ground.z) < 1.1 + e.def.radius && Math.abs(e.pos.y - ground.y) < 1.5;
        if (off < 0.55 + e.def.radius || near) {
          g.damage(e, off < 0.55 + e.def.radius ? this.damage : this.damage * 0.5, this.owner, dir.clone().setY(0).normalize(), { unblockable: true, energy: true, knock: 1.5, hitstop: 0.02, quiet: i % 3 !== 0, color: X_GREEN });
          holeRing(g, c, 0.35);
        }
      }
      holeRing(g, spot, 0.5);
    }
    if (this.fired >= this.n) this.done = true;
  }
  dispose(): void {}
}

/** Divine Pressure: his reiatsu lands on everyone near like a weight — they cannot move for a moment. */
export function divinePressure(g: Game, owner: Fighter, r: number, dur: number, color: THREE.ColorRepresentation = JILLIEL_GREEN): Fighter[] {
  const at = owner.center();
  const hit: Fighter[] = [];
  for (const e of g.enemiesOf(owner)) {
    if (e.dead || e.center().distanceTo(at) > r + e.def.radius) continue;
    e.stopAction();
    e.hitstun = Math.max(e.hitstun, dur);
    e.slow(0.15, dur);
    e.body.vel.y = Math.min(e.body.vel.y, -4);
    hit.push(e);
    const c = e.center();
    g.engine.glow.spawn({ x: c.x, y: c.y + 0.8, z: c.z, size: 1.2, sizeEnd: 0.4, life: 0.4, r: 0.6, g: 1, b: 0.75, alpha: 0.6, alphaEnd: 0, tex: TEX_RING });
  }
  g.addRing(owner.pos.clone(), r, color, 0.6);
  g.addRing(owner.pos.clone(), r * 0.6, color, 0.45);
  const c = _c.set(color);
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * Math.PI * 2;
    g.engine.dust.spawn({ x: at.x + Math.cos(a) * 2, y: owner.pos.y + 0.2, z: at.z + Math.sin(a) * 2, vx: Math.cos(a) * 14, vy: 0.5, vz: Math.sin(a) * 14, size: 0.8, sizeEnd: 2.4, life: 0.7, r: 0.75, g: 0.8, b: 0.76, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
  }
  g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, size: 3, sizeEnd: r * 1.4, life: 0.35, r: c.r, g: c.g, b: c.b, alpha: 0.6, alphaEnd: 0, tex: TEX_RING });
  g.sfx.play('roarBig', at, 0.5);
  if (g.player && (g.player === owner || hit.includes(g.player))) g.shake(0.5);
  return hit;
}

/** the spiral teleport: a green spiral at the far end, expanding into his body */
export function spiralTeleport(g: Game, from: THREE.Vector3, to: THREE.Vector3, color: THREE.ColorRepresentation = JILLIEL_GREEN, size = 1.6): void {
  const c = _c.set(color);
  for (let i = 0; i < 18; i++) {
    const a = i * 0.7, r = size * (0.2 + i * 0.05);
    g.engine.glow.spawn({ x: to.x + Math.cos(a) * r, y: to.y + 0.2 + i * 0.09, z: to.z + Math.sin(a) * r, vx: -Math.sin(a) * 2, vy: 0.6, vz: Math.cos(a) * 2, size: 0.22, sizeEnd: 0.05, life: 0.35 + i * 0.012, r: c.r, g: c.g, b: c.b, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
  }
  g.engine.glow.spawn({ x: to.x, y: to.y + 1, z: to.z, size: size * 0.3, sizeEnd: size * 1.8, life: 0.3, r: c.r, g: c.g, b: c.b, alpha: 0.85, alphaEnd: 0, tex: TEX_RING });
  g.engine.glow.spawn({ x: from.x, y: from.y + 1, z: from.z, size: size * 1.2, sizeEnd: size * 0.2, life: 0.25, r: c.r, g: c.g, b: c.b, alpha: 0.7, alphaEnd: 0, tex: TEX_RING });
  g.sfx.play('shunpo', to, 0.6);
}

/**
 * Judgement of God: every hole's line converges on one point above the target, a sphere of green swells there, then a
 * column drops through it into the ground and bores a pit.
 */
export class JudgementColumn implements Projectile {
  done = false;
  private t = 0;
  private focus = new THREE.Vector3();
  private sphere: THREE.Mesh;
  private column: THREE.Mesh;
  private mat: THREE.MeshBasicMaterial;
  private colMat: THREE.MeshBasicMaterial;
  private fired = false;
  private traceAcc = 0;
  constructor(private g: Game, readonly owner: Fighter, private barrel: (i: number) => THREE.Vector3, readonly target: Fighter, readonly charge = 1.8, readonly damage = 160, readonly r = 3, readonly color: THREE.ColorRepresentation = JILLIEL_GREEN) {
    this.mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2), transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending });
    this.colMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2.4), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    this.sphere = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), this.mat);
    const cg = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true);
    cg.translate(0, -0.5, 0);
    this.column = new THREE.Mesh(cg, this.colMat);
    this.column.visible = false;
    this.sphere.frustumCulled = this.column.frustumCulled = false;
    this.sphere.renderOrder = this.column.renderOrder = 7;
    g.engine.gr.scene.add(this.sphere, this.column);
    this.track();
  }
  private track(): void {
    const tp = this.target.pos;
    this.focus.set(tp.x, tp.y + 11, tp.z);
  }
  update(dt: number, g: Game): void {
    this.t += dt;
    if (!this.fired) {
      if (this.t < this.charge * 0.8 && !this.target.dead) this.track();
      const k = Math.min(1, this.t / this.charge);
      this.sphere.position.copy(this.focus);
      this.sphere.scale.setScalar(0.3 + k * 1.8);
      this.traceAcc += dt;
      if (this.traceAcc > 0.06 && !this.owner.dead) {
        this.traceAcc = 0;
        for (let i = 0; i < 24; i += 3) g.addProjectile(new XTrace(g, this.barrel(i + Math.floor(Math.random() * 3)), this.focus, this.color, 0.03, 0.08));
      }
      if (this.t >= this.charge) this.fire(g);
      return;
    }
    const ft = this.t - this.charge;
    this.colMat.opacity = Math.max(0, 0.9 - ft * 1.2);
    this.column.scale.set(this.r * (1 + ft * 0.4), this.column.scale.y, this.r * (1 + ft * 0.4));
    this.mat.opacity = Math.max(0, 0.85 - ft * 2);
    if (ft > 0.8) this.done = true;
  }
  private fire(g: Game): void {
    this.fired = true;
    const gy = this.target.pos.y;
    const depth = 9;
    this.column.visible = true;
    this.column.position.copy(this.focus);
    this.column.scale.set(this.r, this.focus.y - (gy - depth), this.r);
    this.colMat.opacity = 0.9;
    tunnel(g, this.focus, new THREE.Vector3(this.focus.x, gy - depth, this.focus.z), this.r, 3000, 'bore');
    for (const e of g.enemiesOf(this.owner)) {
      if (e.dead) continue;
      const d = Math.hypot(e.pos.x - this.focus.x, e.pos.z - this.focus.z);
      if (d > this.r * 1.6 + e.def.radius || e.pos.y > this.focus.y) continue;
      const k = Math.max(0.35, 1 - d / (this.r * 1.6 + e.def.radius));
      g.damage(e, this.damage * k, this.owner, _v.set(e.pos.x - this.focus.x, 0, e.pos.z - this.focus.z).normalize().clone(), { unblockable: true, energy: true, heavy: true, knock: 6, hitstop: 0.18, shake: 0.9, color: this.color });
      e.body.vel.y = Math.min(e.body.vel.y, -12);
    }
    g.addRing(new THREE.Vector3(this.focus.x, gy, this.focus.z), this.r * 3, this.color, 0.6);
    g.sfx.play('beam', this.focus, 1.5);
    g.sfx.play('explode', new THREE.Vector3(this.focus.x, gy, this.focus.z), 1.3);
    if (g.player && g.player.pos.distanceTo(this.focus) < 50) g.shake(0.8);
  }
  dispose(): void {
    this.sphere.removeFromParent();
    this.column.removeFromParent();
    this.sphere.geometry.dispose();
    this.column.geometry.dispose();
    this.mat.dispose();
    this.colMat.dispose();
  }
}

// ---------------------------------------------------------------------------------------------- the True Form

/** Sabaki no Kōmyō's wake: explosions going off along the path behind the wave of light, one after another. */
export class ExplosionTrail implements Projectile {
  done = false;
  private t = 0;
  private next = 0;
  constructor(private g: Game, readonly owner: Fighter, readonly origin: THREE.Vector3, readonly along: THREE.Vector3, readonly length: number, readonly speed: number, readonly damage = 20, readonly color: THREE.ColorRepresentation = GOLD) {}
  update(dt: number, g: Game): void {
    this.t += dt;
    // the wave front is at speed·t; the explosions follow a beat behind it, every 7 m
    const reach = Math.min(this.length, this.speed * Math.max(0, this.t - 0.12));
    while (this.next <= reach && this.next <= this.length) {
      const p = this.origin.clone().addScaledVector(this.along, this.next);
      const gy = groundY(g, p);
      if (gy !== null && p.y - gy < 6) p.y = gy + 0.4;
      g.engine.destruction.carve(new SphereShape(p, 1.6), { mode: 'explode', power: 900, impulse: 10, dust: 0.6 });
      for (const e of g.enemiesOf(this.owner)) {
        if (e.dead || e.center().distanceTo(p) > 2.4 + e.def.radius) continue;
        g.damage(e, this.damage, this.owner, this.along.clone().setY(0).normalize(), { energy: true, knock: 8, launch: 4, hitstop: 0.04, quiet: true });
      }
      const c = _c.set(this.color);
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 1.4, sizeEnd: 3.6, life: 0.35, r: c.r, g: c.g, b: c.b, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
      if (this.next % 21 < 7) g.sfx.play('explode', p, 0.6);
      this.next += 7;
    }
    if (this.next > this.length) this.done = true;
  }
  dispose(): void {}
}

function groundY(g: Game, p: THREE.Vector3): number | null {
  const hit = raycastVoxels(g.engine.world, p.x, p.y + 2, p.z, 0, -1, 0, 30);
  return hit ? p.y + 2 - hit.dist : null;
}

/** the light ball: a dazzling sphere off his fingertips that burns every shadow away */
export function lightBall(g: Game, at: THREE.Vector3, r: number): void {
  g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, size: 1, sizeEnd: r * 2.2, life: 0.5, r: 1, g: 0.97, b: 0.85, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, size: r * 0.5, sizeEnd: r * 2.6, life: 0.4, r: 1, g: 0.85, b: 0.45, alpha: 0.8, alphaEnd: 0, tex: TEX_RING });
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.3) * 1.2;
    const sp = 8 + Math.random() * 14;
    g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, vx: Math.cos(a) * Math.cos(e) * sp, vy: Math.sin(e) * sp, vz: Math.sin(a) * Math.cos(e) * sp, size: 0.25, sizeEnd: 0.05, life: 0.5, r: 1, g: 0.92, b: 0.6, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 2 });
  }
  g.sfx.play('flare', at, 1);
}

/** the golden rain: what is left of him falling over the field */
export function goldenRain(g: Game, at: THREE.Vector3, r: number, n = 160): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * r;
    g.engine.glow.spawn({ x: at.x + Math.cos(a) * d, y: at.y + 3 + Math.random() * 12, z: at.z + Math.sin(a) * d, vx: (Math.random() - 0.5) * 0.6, vy: -4 - Math.random() * 4, vz: (Math.random() - 0.5) * 0.6, size: 0.1, sizeEnd: 0.04, life: 1.4 + Math.random() * 1.4, r: 1, g: 0.85, b: 0.4, alpha: 0.95, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
  }
}

/** the halo shatters: shards of its light flung off */
export function haloShatter(g: Game, at: THREE.Vector3, color: THREE.ColorRepresentation, r = 1): void {
  const c = _c.set(color);
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    g.engine.glow.spawn({ x: at.x + Math.cos(a) * r, y: at.y, z: at.z + Math.sin(a) * r, vx: Math.cos(a) * 6, vy: 1 + Math.random() * 3, vz: Math.sin(a) * 6, size: 0.18, sizeEnd: 0.03, life: 0.6, r: c.r, g: c.g, b: c.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2.5, gravity: 6 });
  }
  g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, size: r, sizeEnd: r * 3, life: 0.3, r: c.r, g: c.g, b: c.b, alpha: 0.9, alphaEnd: 0, tex: TEX_RING });
  g.sfx.play('shatter', at, 1);
}

/**
 * Trompete: a golden trumpet bigger than he is floats over him; for `draw` seconds the reishi round him is drawn into
 * it (the ground dissolves upward in motes), then he blows — spherical waves of every colour bloom over the target and
 * erase the ground under them.
 */
export class Trompete implements Projectile {
  done = false;
  private t = 0;
  private mesh: PropMesh;
  private waves: THREE.Mesh[] = [];
  private waveMat: THREE.MeshBasicMaterial[] = [];
  private blew = false;
  private at = new THREE.Vector3();
  private eat = 0;
  constructor(private g: Game, readonly owner: Fighter, readonly target: () => THREE.Vector3, readonly draw = 1.6, readonly damage = 200, readonly r = 14, readonly onBlow?: () => void) {
    this.mesh = new PropMesh(lilleGodProp('trompete'));
    g.engine.gr.scene.add(this.mesh);
    const hues = ['#FFF6D0', '#F2C74E', '#9FF3C0', '#F7B2C8', '#B8D8FF'];
    for (let i = 0; i < 4; i++) {
      const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(hues[i]).multiplyScalar(1.6), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide });
      const s = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), m);
      s.visible = false;
      s.frustumCulled = false;
      s.renderOrder = 7;
      this.waves.push(s);
      this.waveMat.push(m);
      g.engine.gr.scene.add(s);
    }
    this.place();
  }
  private place(): void {
    const f = this.owner;
    const fw = f.forward();
    const h = f.def.height;
    this.mesh.position.set(f.pos.x - fw.x * 1.5, f.pos.y + h * 1.05, f.pos.z - fw.z * 1.5);
    const to = _v.subVectors(this.target(), this.mesh.position).normalize();
    this.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), to);
  }
  update(dt: number, g: Game): void {
    this.t += dt;
    if (!this.blew) {
      if (this.owner.dead) { this.done = true; return; }
      this.place();
      const k = Math.min(1, this.t / 0.4);
      this.mesh.scale.setScalar(Math.max(0.01, k));
      // the reishi drawn in: the ground round him dissolving upward into the bell
      this.eat += dt;
      const f = this.owner;
      const bell = _w.set(0, 0, 44 / 8).applyQuaternion(this.mesh.quaternion).add(this.mesh.position);
      while (this.eat > 0.05) {
        this.eat -= 0.05;
        const a = Math.random() * Math.PI * 2, d = 4 + Math.random() * 9;
        const p = new THREE.Vector3(f.pos.x + Math.cos(a) * d, f.pos.y - 0.3, f.pos.z + Math.sin(a) * d);
        g.engine.destruction.carve(new SphereShape(p, 0.7), { mode: 'erase', power: 600 });
        for (let i = 0; i < 3; i++) {
          const s = new THREE.Vector3().subVectors(bell, p).multiplyScalar(1.2);
          g.engine.glow.spawn({ x: p.x, y: p.y + 0.4, z: p.z, vx: s.x, vy: s.y, vz: s.z, size: 0.2, sizeEnd: 0.05, life: 0.8, r: 1, g: 0.85, b: 0.45, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
        }
      }
      if (this.t >= this.draw) this.blow(g);
      return;
    }
    const bt = this.t - this.draw;
    this.waves.forEach((w, i) => {
      const u = Math.max(0, bt - i * 0.08);
      const k = Math.min(1, u / 0.55);
      w.scale.setScalar(Math.max(0.01, this.r * (0.15 + 0.85 * Math.sqrt(k))));
      this.waveMat[i].opacity = u <= 0 ? 0 : Math.max(0, 0.6 * (1 - k * 0.7) - Math.max(0, bt - 0.7) * 1.5);
    });
    this.mesh.scale.setScalar(Math.max(0.01, 1 - Math.max(0, bt - 0.5) * 2));
    if (bt > 1.2) this.done = true;
  }
  private blow(g: Game): void {
    this.blew = true;
    this.at.copy(this.target());
    for (const w of this.waves) {
      w.visible = true;
      w.position.copy(this.at);
    }
    this.onBlow?.();
    // everything inside is erased: the damage falls off from the centre
    for (const e of g.enemiesOf(this.owner)) {
      if (e.dead) continue;
      const d = e.center().distanceTo(this.at);
      if (d > this.r + e.def.radius) continue;
      const k = Math.max(0.35, 1 - d / (this.r + e.def.radius));
      g.damage(e, this.damage * k, this.owner, _v.subVectors(e.pos, this.at).setY(0.3).normalize().clone(), { unblockable: true, energy: true, heavy: true, knock: 26, launch: 10, hitstop: 0.2, shake: 1.2, color: GOLD });
    }
    g.engine.destruction.carve(new SphereShape(this.at.clone(), this.r * 0.75), { mode: 'erase', power: 6000 });
    g.engine.destruction.carve(new SphereShape(this.at.clone(), this.r * 0.9, 0.6), { mode: 'explode', power: 3000, impulse: 20, dust: 1 });
    g.addRing(this.at.clone(), this.r * 1.6, GOLD, 0.8);
    g.engine.glow.spawn({ x: this.at.x, y: this.at.y, z: this.at.z, size: this.r, sizeEnd: this.r * 2.6, life: 0.5, r: 1, g: 0.95, b: 0.8, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    g.sfx.play('bankai', this.at, 1.2);
    g.sfx.play('explode', this.at, 1.6);
    if (g.player && g.player.pos.distanceTo(this.at) < 80) g.shake(1.2);
  }
  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.material.dispose();
    for (const w of this.waves) {
      w.removeFromParent();
      w.geometry.dispose();
    }
    for (const m of this.waveMat) m.dispose();
  }
}
