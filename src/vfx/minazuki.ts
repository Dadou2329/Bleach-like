// Retsu Unohana's effects (docs/roster/B1-captains-1.md §5): the hidden daggers, Bakudō #62 Hyapporankan (a
// rod of light hurled that splits into many and pins the target), Hadō #4 Byakurai and #63 Raikōhō thrown
// from the back of Minazuki, the creature itself as a mount, the weapon flicked out of an enemy's hand, and
// the Bankai: the blood pouring down from above into a flood, the liquid slashes, the loose sphere of small
// liquid blades round her, and blades drawn up out of the pool.
import * as THREE from 'three';
import type { DamageOpts, Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { CharacterVisual, PropMesh } from '../game/characterFactory';
import { GetsugaProjectile } from '../game/projectiles/getsuga';
import { SphereShape } from '../destruction/shapes';
import { raycastVoxels } from '../voxel/raycast';
import { unohanaProp } from '../chars/unohana';
import { MANTA_SADDLE, mantaAsset } from '../chars/unohanaMinazuki';
import { groundAt } from './iceArts';
import type { EnergyColors } from './energy';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

/** the Bankai's fluid */
export const BLOOD: EnergyColors = { core: '#FF7A7A', body: '#A8121C', rim: '#3E0006', dark: '#1E0003' };
export const KAIDO_GREEN = '#7DFFA0';
const LIGHT_ROD = '#FFF2A8';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const Z = new THREE.Vector3(0, 0, 1);

function hits(g: Game, owner: Fighter, p: THREE.Vector3, r: number): Fighter | null {
  for (const f of g.enemiesOf(owner)) {
    if (f.dead) continue;
    const cy = Math.max(f.pos.y + 0.2, Math.min(f.pos.y + f.def.height - 0.2, p.y));
    if (Math.hypot(f.pos.x - p.x, cy - p.y, f.pos.z - p.z) < f.def.radius + r) return f;
  }
  return null;
}

/** green motes rising off a healing body (Kaidō) */
export function kaidoMotes(g: Game, at: THREE.Vector3, n = 1, color = KAIDO_GREEN): void {
  const c = new THREE.Color(color);
  for (let i = 0; i < n; i++)
    g.engine.glow.spawn({ x: at.x + (Math.random() - 0.5) * 0.5, y: at.y + (Math.random() - 0.5) * 0.5, z: at.z + (Math.random() - 0.5) * 0.5, vx: 0, vy: 0.7, vz: 0, size: 0.18, sizeEnd: 0.04, life: 0.7, r: c.r * 1.2, g: c.g * 1.2, b: c.b * 1.2, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
}

// ------------------------------------------------------------------ the daggers

/** A hidden dagger thrown point first: it sticks in whatever it meets (a fighter takes a sharp sting). */
export class ThrownDagger implements Projectile {
  done = false;
  readonly pos: THREE.Vector3;
  readonly dir: THREE.Vector3;
  private mesh: PropMesh;
  private travelled = 0;
  private stuck = -1;

  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, dir: THREE.Vector3, readonly o: { speed?: number; damage?: number; range?: number } = {}) {
    this.pos = from.clone();
    this.dir = dir.clone().normalize();
    this.mesh = new PropMesh(unohanaProp('dagger'));
    this.mesh.quaternion.setFromUnitVectors(Z, this.dir);
    this.mesh.position.copy(this.pos);
    g.engine.gr.scene.add(this.mesh);
  }

  reject(at: THREE.Vector3, radius: number, by: Fighter): boolean {
    if (this.done || this.stuck >= 0 || by.team === this.owner.team || this.pos.distanceTo(at) > radius) return false;
    this.done = true;
    return true;
  }

  update(dt: number, g: Game): void {
    if (this.stuck >= 0) {
      this.stuck += dt;
      if (this.stuck > 2.5) this.done = true;
      return;
    }
    const step = (this.o.speed ?? 46) * dt;
    const wall = raycastVoxels(g.engine.world, this.pos.x, this.pos.y, this.pos.z, this.dir.x, this.dir.y, this.dir.z, step + 0.05);
    const f = hits(g, this.owner, this.pos, 0.3);
    if (f) {
      g.damage(f, this.o.damage ?? 10, this.owner, this.dir.clone(), { knock: 3, hitstop: 0.03, shake: 0.08 });
      g.sparks(this.pos.clone(), this.dir.clone().negate(), '#E8ECF2', 6);
      this.done = true;
      return;
    }
    if (wall) {
      this.pos.addScaledVector(this.dir, Math.max(0, wall.dist - 0.08));
      this.stuck = 0;
      g.sparks(this.pos.clone(), this.dir.clone().negate(), '#E8ECF2', 5);
      g.sfx.play('ting', this.pos, 0.35);
      return;
    }
    this.pos.addScaledVector(this.dir, step);
    this.travelled += step;
    if (this.travelled > (this.o.range ?? 32)) this.done = true;
  }

  render(): void {
    this.mesh.position.copy(this.pos);
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.material.dispose();
  }
}

// ------------------------------------------------------------------ Bakudō #62 Hyapporankan

let rodGeo: THREE.BufferGeometry | null = null;
function rodGeometry(): THREE.BufferGeometry {
  if (rodGeo) return rodGeo;
  // a square rod 1 m long along +Z, pointed at the front
  const g = new THREE.CylinderGeometry(0.035, 0.055, 1, 4, 1);
  g.rotateX(Math.PI / 2);
  g.rotateZ(Math.PI / 4);
  rodGeo = g;
  return g;
}

/**
 * Hyapporankan: a rod of light hurled at the target; reaching it, it splits into many that drive into the
 * ground round it at a slant, crossing through its clothes and pinning it where it stands.
 */
export class Hyapporankan implements Projectile {
  done = false;
  readonly pos: THREE.Vector3;
  private dir = new THREE.Vector3();
  private t = 0;
  private phase: 'fly' | 'pin' | 'fade' = 'fly';
  private rods: THREE.InstancedMesh;
  private mat: THREE.MeshBasicMaterial;
  private n = 14;
  private pins: { from: THREE.Vector3; to: THREE.Vector3 }[] = [];
  private victim: Fighter | null = null;
  private pinT = 0;
  private travelled = 0;

  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, private target: Fighter | null, aim: THREE.Vector3, readonly o: { hold?: number; damage?: number; speed?: number } = {}) {
    this.pos = from.clone();
    this.dir.subVectors(aim, from).normalize();
    this.mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(LIGHT_ROD).multiplyScalar(2.6), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
    this.rods = new THREE.InstancedMesh(rodGeometry(), this.mat, this.n + 1);
    this.rods.frustumCulled = false;
    this.rods.count = 1;
    g.engine.gr.scene.add(this.rods);
  }

  reject(at: THREE.Vector3, radius: number, by: Fighter): boolean {
    if (this.done || this.phase !== 'fly' || by.team === this.owner.team || this.pos.distanceTo(at) > radius) return false;
    this.done = true;
    return true;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.phase === 'fly') {
      // it bends a little toward the target
      if (this.target && !this.target.dead) {
        _v.subVectors(this.target.center(_w), this.pos).normalize();
        this.dir.lerp(_v, Math.min(1, dt * 3)).normalize();
      }
      const step = (this.o.speed ?? 44) * dt;
      const f = hits(g, this.owner, this.pos, 0.5);
      if (f) return this.split(g, f);
      const wall = raycastVoxels(g.engine.world, this.pos.x, this.pos.y, this.pos.z, this.dir.x, this.dir.y, this.dir.z, step + 0.1);
      if (wall) {
        this.pos.addScaledVector(this.dir, wall.dist);
        this.burst(g, 10);
        this.done = true;
        return;
      }
      this.pos.addScaledVector(this.dir, step);
      this.travelled += step;
      g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, vx: -this.dir.x * 4, vy: -this.dir.y * 4, vz: -this.dir.z * 4, size: 0.4, sizeEnd: 0.06, life: 0.2, r: 1.6, g: 1.5, b: 1.0, alpha: 0.8, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
      if (this.travelled > 40) {
        this.burst(g, 10);
        this.done = true;
      }
      return;
    }
    if (this.phase === 'pin') {
      this.pinT += dt;
      const v = this.victim;
      if (v && !v.dead) {
        // held where it stands
        v.hitstun = Math.max(v.hitstun, 0.15);
        v.body.vel.x *= 0.5;
        v.body.vel.z *= 0.5;
        v.push.multiplyScalar(0.5);
      }
      if (this.pinT > (this.o.hold ?? 2.4)) {
        this.phase = 'fade';
        this.t = 0;
        this.burst(g, 16);
      }
      return;
    }
    if (this.t > 0.3) this.done = true;
  }

  private split(g: Game, f: Fighter): void {
    this.phase = 'pin';
    this.victim = f;
    f.stopAction();
    f.slow(0.95, this.o.hold ?? 2.4);
    g.damage(f, this.o.damage ?? 12, this.owner, this.dir.clone(), { knock: 0, energy: true, hitstop: 0.06, shake: 0.2 });
    // the rods: from a ring of points above and round the target, down through it into the ground
    const c = f.pos;
    const gy = groundAt(g, c.x, c.y + 1, c.z, 4) ?? c.y;
    for (let i = 0; i < this.n; i++) {
      const a = (i / this.n) * Math.PI * 2 + Math.random() * 0.2;
      const h = f.def.height * (0.25 + (i % 3) * 0.25);
      const through = new THREE.Vector3(c.x + Math.cos(a) * f.def.radius * 0.7, c.y + h, c.z + Math.sin(a) * f.def.radius * 0.7);
      const to = new THREE.Vector3(c.x - Math.cos(a) * (0.6 + Math.random() * 0.5), gy - 0.25, c.z - Math.sin(a) * (0.6 + Math.random() * 0.5));
      const dirv = _v.subVectors(through, to).normalize();
      const from = through.clone().addScaledVector(dirv, 0.6 + Math.random() * 0.4);
      this.pins.push({ from, to });
    }
    this.rods.count = this.n;
    g.sfx.play('charge', c, 0.9);
    g.addRing(new THREE.Vector3(c.x, gy + 0.05, c.z), 1.6, LIGHT_ROD, 0.4);
    this.burst(g, 12);
  }

  private burst(g: Game, n: number): void {
    const p = this.victim ? this.victim.center() : this.pos;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * 3, vy: (Math.random() - 0.3) * 3, vz: Math.sin(a) * 3, size: 0.16, sizeEnd: 0.02, life: 0.4, r: 1.6, g: 1.5, b: 1.0, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
  }

  render(): void {
    const m = new THREE.Matrix4();
    const s = new THREE.Vector3();
    if (this.phase === 'fly') {
      _q.setFromUnitVectors(Z, this.dir);
      s.set(1.4, 1.4, 1.4);
      m.compose(this.pos, _q, s);
      this.rods.setMatrixAt(0, m);
    } else {
      // each rod slides into place over the first instants, then holds
      const k = this.phase === 'pin' ? Math.min(1, this.pinT / 0.12) : 1;
      this.pins.forEach((p, i) => {
        const d = _v.subVectors(p.from, p.to);
        const len = d.length();
        _q.setFromUnitVectors(Z, d.normalize().negate());
        const mid = _w.copy(p.to).addScaledVector(d.negate(), len * (1 - 0.5 * k) - len * 0.5 * (1 - k));
        s.set(1, 1, len * k + 0.01);
        m.compose(mid, _q, s);
        this.rods.setMatrixAt(i, m);
      });
      this.mat.opacity = this.phase === 'fade' ? Math.max(0, 0.95 - this.t * 3) : 0.95;
    }
    this.rods.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.rods.removeFromParent();
    this.mat.dispose();
  }
}

// ------------------------------------------------------------------ Hadō from the creature's back

/** Hadō #4 Byakurai: a thin white bolt from the fingertip, straight through the first thing it meets. */
export function byakurai(g: Game, owner: Fighter, from: THREE.Vector3, dir: THREE.Vector3, o: { range?: number; damage?: number } = {}): void {
  const range = o.range ?? 40;
  const d = dir.clone().normalize();
  let len = range;
  const wall = raycastVoxels(g.engine.world, from.x, from.y, from.z, d.x, d.y, d.z, range);
  if (wall) len = wall.dist;
  let hit: Fighter | null = null;
  for (const f of g.enemiesOf(owner)) {
    if (f.dead) continue;
    const c = f.center(_w);
    const t = _v.subVectors(c, from).dot(d);
    if (t < 0 || t > len) continue;
    const off = _v.copy(from).addScaledVector(d, t).distanceTo(c);
    if (off < f.def.radius + 0.35 && (!hit || t < _v.subVectors(hit.center(), from).dot(d))) hit = f;
  }
  if (hit) {
    len = Math.max(0.5, _v.subVectors(hit.center(_w), from).dot(d));
    g.damage(hit, o.damage ?? 14, owner, d.clone(), { knock: 4, energy: true, hitstop: 0.04, shake: 0.1 });
  } else if (wall) g.engine.destruction.carve(new SphereShape(from.clone().addScaledVector(d, len), 0.5, 0.8), { mode: 'bore', power: 300 });
  // the bolt: streaks laid along the line, a flash at both ends
  for (let s = 0; s < len; s += 0.7) {
    const p = _v.copy(from).addScaledVector(d, s);
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: d.x * 2, vy: d.y * 2, vz: d.z * 2, size: 0.35, sizeEnd: 0.05, life: 0.18, r: 1.8, g: 1.9, b: 2.4, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 4 });
  }
  const end = from.clone().addScaledVector(d, len);
  g.engine.glow.spawn({ x: end.x, y: end.y, z: end.z, size: 0.4, sizeEnd: 1.4, life: 0.18, r: 1.8, g: 1.9, b: 2.4, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  g.engine.glow.spawn({ x: from.x, y: from.y, z: from.z, size: 0.3, sizeEnd: 0.8, life: 0.12, r: 1.8, g: 1.9, b: 2.4, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  g.sfx.play('beam', from, 0.5);
}

/** Hadō #63 Raikōhō: a ball of yellow lightning flung at the target; it bursts in a crackling blast. */
export class Raikoho implements Projectile {
  done = false;
  readonly pos: THREE.Vector3;
  readonly dir: THREE.Vector3;
  private travelled = 0;
  private light: THREE.PointLight;

  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, dir: THREE.Vector3, readonly o: { damage?: number; radius?: number; speed?: number } = {}) {
    this.pos = from.clone();
    this.dir = dir.clone().normalize();
    this.light = new THREE.PointLight('#FFE27A', 10, 9, 1.6);
    this.light.position.copy(this.pos);
    g.engine.gr.scene.add(this.light);
  }

  reject(at: THREE.Vector3, radius: number, by: Fighter): boolean {
    if (this.done || by.team === this.owner.team || this.pos.distanceTo(at) > radius) return false;
    this.done = true;
    return true;
  }

  update(dt: number, g: Game): void {
    const step = (this.o.speed ?? 48) * dt;
    const wall = raycastVoxels(g.engine.world, this.pos.x, this.pos.y, this.pos.z, this.dir.x, this.dir.y, this.dir.z, step + 0.2);
    if (wall || hits(g, this.owner, this.pos, 0.6)) {
      if (wall) this.pos.addScaledVector(this.dir, wall.dist);
      return this.burst(g);
    }
    this.pos.addScaledVector(this.dir, step);
    this.travelled += step;
    for (let i = 0; i < 3; i++)
      g.engine.glow.spawn({ x: this.pos.x + (Math.random() - 0.5) * 0.5, y: this.pos.y + (Math.random() - 0.5) * 0.5, z: this.pos.z + (Math.random() - 0.5) * 0.5, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, vz: (Math.random() - 0.5) * 6, size: 0.3, sizeEnd: 0.04, life: 0.12, r: 2.2, g: 1.9, b: 0.8, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2.5 });
    g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, size: 1.1, sizeEnd: 0.8, life: 0.06, r: 2.2, g: 2.0, b: 1.0, alpha: 1, alphaEnd: 0.5, tex: TEX_GLOW });
    if (this.travelled > 50) this.burst(g);
  }

  private burst(g: Game): void {
    if (this.done) return;
    this.done = true;
    const p = this.pos;
    const R = this.o.radius ?? 3;
    g.engine.destruction.carve(new SphereShape(p.clone(), R * 0.8, 0.7), { mode: 'explode', power: 600, impulse: 16 });
    for (const f of g.enemiesOf(this.owner)) {
      const d = f.center(_w).distanceTo(p);
      if (d > R + f.def.radius) continue;
      g.damage(f, (this.o.damage ?? 40) * (1 - (d / (R + 1)) * 0.5), this.owner, _v.subVectors(f.pos, p).setY(0).normalize().clone(), { knock: 18, launch: 6, heavy: true, energy: true, hitstop: 0.1, shake: 0.45 });
    }
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 2, sizeEnd: R * 3, life: 0.35, r: 2.4, g: 2.0, b: 0.8, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * Math.PI * 2, b = (Math.random() - 0.3) * Math.PI;
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * Math.cos(b) * 14, vy: Math.sin(b) * 14, vz: Math.sin(a) * Math.cos(b) * 14, size: 0.4, sizeEnd: 0.05, life: 0.25, r: 2.2, g: 1.9, b: 0.8, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
    }
    g.addRing(p.clone(), R * 1.4, '#FFE27A', 0.4);
    g.sfx.play('explode', p, 0.9);
    if (g.player && g.player.pos.distanceTo(p) < 20) g.shake(0.4);
  }

  render(): void {
    this.light.position.copy(this.pos);
  }

  dispose(): void {
    this.light.removeFromParent();
    this.light.dispose();
  }
}

// ------------------------------------------------------------------ Minazuki, the creature

/**
 * The Shikai: the manta under her feet. It follows its rider (the saddle stays under her), easing round
 * after her heading, banking into turns, pitching as she climbs or dives; the wings beat faster the faster
 * it flies and the tail sways. It grows out of nothing when called and shrinks away when dismissed.
 */
export class MantaRide implements Projectile {
  done = false;
  readonly v: CharacterVisual;
  readonly pos = new THREE.Vector3();
  yaw: number;
  private t = 0;
  private endT = -1;
  private bank = 0;
  private pitch = 0;
  private flap = 0;
  private bones: Record<string, number> = {};

  constructor(private g: Game, readonly owner: Fighter) {
    const a = mantaAsset();
    this.v = new CharacterVisual(a.model, [], []);
    for (const n of ['root', 'body', 'jaw', 'wing.L', 'wing.R', 'tail1', 'tail2']) this.bones[n] = this.v.rig.index(n);
    this.v.forEachMaterial((m) => m.userData.uniforms.uRim.value.set(0.6, 1, 0.7, 0.35));
    this.yaw = owner.yaw;
    g.engine.gr.scene.add(this.v.object);
    g.sfx.play('flare', owner.pos, 0.8);
  }

  get alive(): boolean {
    return this.endT < 0;
  }

  get scale(): number {
    const rise = this.endT >= 0 ? 1 - Math.min(1, this.endT / 0.7) : Math.min(1, this.t / 0.7);
    return 0.15 + 0.85 * (1 - (1 - rise) ** 3);
  }

  dismiss(): void {
    if (this.endT < 0) this.endT = 0;
  }

  update(dt: number): void {
    this.t += dt;
    if (this.endT >= 0) {
      this.endT += dt;
      if (this.endT > 0.75) this.done = true;
      return;
    }
    if (this.owner.dead) this.dismiss();
  }

  render(dt: number): void {
    const f = this.owner;
    const o = this.v.object;
    let dy = f.yaw - this.yaw;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    this.yaw += dy * Math.min(1, dt * 5);
    this.bank += (Math.max(-0.5, Math.min(0.5, -dy * 1.4)) - this.bank) * Math.min(1, dt * 4);
    this.pitch += (Math.max(-0.35, Math.min(0.35, -f.body.vel.y * 0.05)) - this.pitch) * Math.min(1, dt * 3);
    const k = this.scale;
    o.scale.setScalar(k);
    o.rotation.set(this.pitch, this.yaw, this.bank, 'YXZ');
    // the saddle under the rider's feet
    const p = f.renderPos ?? f.pos;
    _v.set(MANTA_SADDLE[0], MANTA_SADDLE[1], MANTA_SADDLE[2]).multiplyScalar(k).applyEuler(o.rotation);
    this.pos.set(p.x - _v.x, p.y - _v.y, p.z - _v.z);
    o.position.copy(this.pos);
    const sp = Math.hypot(f.body.vel.x, f.body.vel.z);
    this.flap += dt * (1.5 + sp * 0.16);
    const set = (n: string, x: number, y: number, z: number) => {
      const i = this.bones[n];
      if (i === undefined || i < 0) return;
      this.v.rig.bones[i].quaternion.setFromEuler(_e.set(x, y, z));
    };
    const w = Math.sin(this.flap) * (0.22 + Math.min(0.2, sp * 0.012));
    set('wing.L', 0, 0, w + 0.04);
    set('wing.R', 0, 0, -w - 0.04);
    set('tail1', Math.sin(this.t * 2.1) * 0.08, Math.sin(this.t * 1.3) * 0.22 - dy * 0.6, 0);
    set('tail2', Math.sin(this.t * 2.1 - 0.8) * 0.12, Math.sin(this.t * 1.3 - 0.9) * 0.3, 0);
    set('body', Math.sin(this.flap) * 0.03, 0, 0);
    this.v.forEachMaterial((m) => {
      m.userData.uniforms.uDissolve.value = 1 - Math.min(1, k * 1.2);
    });
    o.updateMatrixWorld(true);
  }

  dispose(): void {
    this.v.object.removeFromParent();
  }
}

// ------------------------------------------------------------------ the disarm

/** The weapon knocked out of an enemy's hand: it spins away and sticks in the ground until it is taken back. */
export class FlungWeapon implements Projectile {
  done = false;
  private mesh: THREE.Mesh;
  private pos: THREE.Vector3;
  private vel: THREE.Vector3;
  private spin = new THREE.Vector3();
  private landed = false;
  private t = 0;

  constructor(private g: Game, readonly victim: Fighter, from: Fighter) {
    const w = victim.visual.props.get(victim.def.blade?.prop ?? 'sword');
    this.mesh = new THREE.Mesh(w ? w.geometry : new THREE.BoxGeometry(0.05, 0.05, 0.9), w ? w.material : new THREE.MeshStandardMaterial({ color: '#C9CED4' }));
    if (w) w.getWorldPosition(_v);
    else victim.center(_v);
    this.pos = _v.clone();
    if (w) w.getWorldQuaternion(this.mesh.quaternion);
    const away = _w.subVectors(victim.pos, from.pos).setY(0).normalize();
    const side = new THREE.Vector3(-away.z, 0, away.x).multiplyScalar(Math.random() < 0.5 ? -1 : 1);
    this.vel = away.multiplyScalar(4).addScaledVector(side, 2.5).setY(9).clone();
    this.spin.set(10 + Math.random() * 6, Math.random() * 3, Math.random() * 3);
    this.mesh.position.copy(this.pos);
    g.engine.gr.scene.add(this.mesh);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (!this.landed) {
      this.vel.y -= 26 * dt;
      this.pos.addScaledVector(this.vel, dt);
      _e.set(this.spin.x * dt, this.spin.y * dt, this.spin.z * dt);
      this.mesh.quaternion.multiply(_q.setFromEuler(_e));
      const gy = groundAt(g, this.pos.x, this.pos.y + 0.5, this.pos.z, 3);
      if (this.vel.y < 0 && gy !== null && this.pos.y < gy + 0.35) {
        // point down, stuck at a slant
        this.landed = true;
        this.pos.y = gy + 0.3;
        this.mesh.quaternion.setFromUnitVectors(Z, _v.set(this.vel.x * 0.1, -1, this.vel.z * 0.1).normalize());
        g.sfx.play('ting', this.pos, 0.6);
        g.engine.dust.spawn({ x: this.pos.x, y: gy + 0.1, z: this.pos.z, vx: 0, vy: 0.6, vz: 0, size: 0.4, sizeEnd: 1.2, life: 0.6, r: 0.5, g: 0.47, b: 0.45, alpha: 0.4, alphaEnd: 0, tex: TEX_PUFF });
      }
    }
    if (this.victim.disarmT <= 0 || this.victim.dead || this.t > 12) this.done = true;
  }

  render(): void {
    this.mesh.position.copy(this.pos);
  }

  dispose(): void {
    this.mesh.removeFromParent();
  }
}

// ------------------------------------------------------------------ the Bankai

/** The blood pouring down from above at the release: dark red streams falling all round her. */
export class BloodFall implements Projectile {
  done = false;
  private t = 0;
  constructor(private g: Game, readonly center: THREE.Vector3, readonly R: number, readonly dur = 1.8) {
    g.sfx.play('torrent', center, 1);
  }
  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.t > this.dur) {
      this.done = true;
      return;
    }
    const n = Math.round(14 * (1 - this.t / this.dur) + 4);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * this.R;
      const x = this.center.x + Math.cos(a) * r, z = this.center.z + Math.sin(a) * r;
      g.engine.dust.spawn({ x, y: this.center.y + 14 + Math.random() * 8, z, vx: 0, vy: -26, vz: 0, size: 0.18, sizeEnd: 0.14, life: 0.8, r: 0.42, g: 0.02, b: 0.05, alpha: 0.95, alphaEnd: 0.8, tex: TEX_STREAK, stretch: 6 });
    }
  }
  dispose(): void {}
}

/** One of the Bankai's liquid slashes: a crescent of the dark fluid thrown off the swing. */
export class LiquidSlash extends GetsugaProjectile {
  constructor(g: Game, owner: Fighter, from: THREE.Vector3, dir: THREE.Vector3, side: THREE.Vector3, o: { damage?: number; radius?: number; cut?: number; range?: number } = {}) {
    super(g, owner, from, dir, side, { radius: o.radius ?? 1.8, halfAngle: 0.85, speed: 46, range: o.range ?? 34, damage: o.damage ?? 16, cut: o.cut ?? 420, colors: BLOOD, dark: true, band: (o.radius ?? 1.8) * 0.28 });
  }
}

let shardGeo: THREE.BufferGeometry | null = null;
function shardGeometry(): THREE.BufferGeometry {
  if (shardGeo) return shardGeo;
  const g = new THREE.OctahedronGeometry(1, 0);
  g.scale(0.05, 0.03, 0.32);
  shardGeo = g;
  return g;
}
function bloodMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: '#7A0E18', roughness: 0.12, metalness: 0.35, emissive: '#2A0006', transparent: true });
}

/**
 * The sphere of blades: rapid slashes in every direction leave a loose sphere of small liquid blades round
 * her. Whoever comes inside is cut again and again and thrown back out; the blades nick the walls they cross.
 */
export class BladeSphere implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.InstancedMesh;
  private mat: THREE.MeshStandardMaterial;
  private orbits: { axis: THREE.Vector3; phase: number; r: number; w: number }[] = [];
  private tick = 0;
  private cutT = 0;

  constructor(private g: Game, readonly owner: Fighter, readonly o: { dur?: number; radius?: number; dps?: number } = {}) {
    const n = 60;
    this.mat = bloodMaterial();
    this.mesh = new THREE.InstancedMesh(shardGeometry(), this.mat, n);
    this.mesh.frustumCulled = false;
    for (let i = 0; i < n; i++) {
      const axis = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      this.orbits.push({ axis, phase: Math.random() * Math.PI * 2, r: (o.radius ?? 2.6) * (0.75 + Math.random() * 0.35), w: (2.5 + Math.random() * 2.5) * (Math.random() < 0.5 ? -1 : 1) });
    }
    g.engine.gr.scene.add(this.mesh);
  }

  get radius(): number {
    return this.o.radius ?? 2.6;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const dur = this.o.dur ?? 5;
    if (this.t > dur + 0.4 || this.owner.dead) {
      this.done = true;
      return;
    }
    if (this.t > dur) return;
    const c = this.owner.center(_v);
    this.tick += dt;
    if (this.tick >= 0.25) {
      this.tick = 0;
      for (const f of g.enemiesOf(this.owner)) {
        const d = f.center(_w).distanceTo(c);
        if (d > this.radius + f.def.radius + 0.3) continue;
        const out = _w.subVectors(f.pos, this.owner.pos).setY(0).normalize().clone();
        const o: DamageOpts = { knock: 7, hitstop: 0.02, shake: 0.08 };
        g.damage(f, (this.o.dps ?? 36) * 0.25, this.owner, out, o);
        g.sparks(f.center(), out, '#A8121C', 6);
      }
    }
    // the blades nick whatever they pass through
    this.cutT += dt;
    if (this.cutT > 0.2) {
      this.cutT = 0;
      const a = Math.random() * Math.PI * 2, b = (Math.random() - 0.3) * 1.2;
      const p = c.clone().add(_w.set(Math.cos(a) * Math.cos(b), Math.sin(b), Math.sin(a) * Math.cos(b)).multiplyScalar(this.radius));
      g.engine.destruction.carve(new SphereShape(p, 0.6), { mode: 'cut', power: 360, sparks: [0.7, 0.1, 0.12] });
    }
  }

  render(): void {
    const c = this.owner.center(_v);
    const dur = this.o.dur ?? 5;
    const grow = Math.min(1, this.t / 0.25) * (this.t > dur ? Math.max(0, 1 - (this.t - dur) / 0.4) : 1);
    const m = new THREE.Matrix4();
    const s = new THREE.Vector3(grow, grow, grow);
    const p = new THREE.Vector3();
    const tangent = new THREE.Vector3();
    this.orbits.forEach((ob, i) => {
      // a point going round a great circle about the blade's own axis
      const ang = ob.phase + this.t * ob.w;
      const u = _w.set(1, 0, 0);
      if (Math.abs(ob.axis.x) > 0.9) u.set(0, 1, 0);
      const e1 = u.cross(ob.axis).normalize();
      const e2 = new THREE.Vector3().crossVectors(ob.axis, e1);
      p.copy(e1).multiplyScalar(Math.cos(ang) * ob.r).addScaledVector(e2, Math.sin(ang) * ob.r).add(c);
      tangent.copy(e1).multiplyScalar(-Math.sin(ang)).addScaledVector(e2, Math.cos(ang)).multiplyScalar(Math.sign(ob.w));
      _q.setFromUnitVectors(Z, tangent);
      m.compose(p, _q, s);
      this.mesh.setMatrixAt(i, m);
    });
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mat.dispose();
  }
}

/** Blades drawn up out of the pool round the target: they rise, turn on it and strike all together. */
export class PoolBlades implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.InstancedMesh;
  private mat: THREE.MeshStandardMaterial;
  private blades: { p: THREE.Vector3; base: THREE.Vector3; v: THREE.Vector3; hit: boolean }[] = [];

  constructor(private g: Game, readonly owner: Fighter, private target: Fighter, readonly o: { n?: number; damage?: number } = {}) {
    const n = o.n ?? 8;
    this.mat = bloodMaterial();
    this.mesh = new THREE.InstancedMesh(shardGeometry(), this.mat, n);
    this.mesh.frustumCulled = false;
    const c = target.pos;
    const gy = groundAt(g, c.x, c.y + 1, c.z, 6) ?? c.y;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.3;
      const r = 2.6 + Math.random() * 1.2;
      const base = new THREE.Vector3(c.x + Math.cos(a) * r, gy - 0.3, c.z + Math.sin(a) * r);
      this.blades.push({ p: base.clone(), base, v: new THREE.Vector3(), hit: false });
    }
    g.engine.gr.scene.add(this.mesh);
    g.sfx.play('splash', c, 0.8);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const tgt = this.target;
    for (const b of this.blades) {
      if (b.hit) continue;
      if (this.t < 0.45) {
        // rising out of the pool
        b.p.copy(b.base).setY(b.base.y + (this.t / 0.45) * 1.6);
        if (Math.random() < 0.3) g.engine.dust.spawn({ x: b.base.x, y: b.base.y + 0.3, z: b.base.z, vx: 0, vy: 1.2, vz: 0, size: 0.12, sizeEnd: 0.05, life: 0.4, r: 0.45, g: 0.03, b: 0.06, alpha: 0.9, alphaEnd: 0, tex: TEX_PUFF, gravity: -6 });
        continue;
      }
      // then they fly at the target
      if (!tgt.dead) b.v.subVectors(tgt.center(_w), b.p).normalize().multiplyScalar(36);
      b.p.addScaledVector(b.v, dt);
      if (!tgt.dead && b.p.distanceTo(tgt.center(_w)) < tgt.def.radius + 0.4) {
        b.hit = true;
        g.damage(tgt, this.o.damage ?? 9, this.owner, b.v.clone().normalize(), { knock: 3, hitstop: 0.02, shake: 0.1 });
        g.sparks(b.p.clone(), b.v.clone().negate().normalize(), '#A8121C', 5);
      }
    }
    if (this.t > 1.6 || this.blades.every((b) => b.hit)) this.done = true;
  }

  render(): void {
    const m = new THREE.Matrix4();
    const s = new THREE.Vector3(1.4, 1.4, 1.4);
    this.blades.forEach((b, i) => {
      const dir = this.t < 0.45 ? _v.set(0, 1, 0) : _v.copy(b.v).normalize();
      _q.setFromUnitVectors(Z, dir.lengthSq() > 0 ? dir : _v.set(0, 1, 0));
      m.compose(b.p, _q, b.hit ? s.set(0.001, 0.001, 0.001) : s.set(1.4, 1.4, 1.4));
      this.mesh.setMatrixAt(i, m);
    });
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mat.dispose();
  }
}
