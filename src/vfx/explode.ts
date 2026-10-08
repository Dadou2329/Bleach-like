// Bambietta's bombs (docs/kits/bambietta.md): whatever her reishi touches becomes a bomb that goes off a beat later.
// `blast()` is the explosion itself (a white flash, an orange fireball, crimson licks, dark smoke, a crater).
// BombTag: a fuse on a fighter (riding its body) or on a point of the world, a pink mark pulsing faster as it runs
// down. BombOrb: a glowing orb that flies (or falls) and sticks to the first thing it touches, then goes off.
// KickedOrb: a big orb kicked along the ground, bouncing, that goes off on a body or at the end of its run.
// ArmedBoulder: a chunk of the ground ripped up, carried, thrown on an arc, going off where it lands. ExplosiveGlobe:
// the tantrum — a sphere of explosion out of her whole body that spares no one near her.
import * as THREE from 'three';
import type { Fighter } from '../game/fighter';
import type { Game, Projectile } from '../game/game';
import { SphereShape } from '../destruction/shapes';
import { raycastVoxels } from '../voxel/raycast';
import { PropMesh } from '../game/characterFactory';
import type { VoxelModel } from '../models/builder';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

export const ORB_CORE = '#FFF1F4';
export const ORB_GLOW = '#FF4D6D';
export const BLAST_RED = '#C0102C';
export const ZOFIEL = '#B3122E';

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const C_WHITE = new THREE.Color('#FFF4E0'), C_ORANGE = new THREE.Color('#FF8A2A'), C_RED = new THREE.Color(BLAST_RED), C_PINK = new THREE.Color(ORB_GLOW);
const _c = new THREE.Color();

export interface BlastOpts {
  /** destruction power (default 600) */
  power?: number;
  /** her own side is hit too (the tantrum) */
  allies?: boolean;
  unblockable?: boolean;
  /** a fighter the blast is centred on takes it in full, wherever its edge is */
  on?: Fighter | null;
  knock?: number;
  launch?: number;
  quiet?: boolean;
}

/** An explosion of her reishi: the crater, the fireball, everyone in reach hurt (falling off to the edge). */
export function blast(g: Game, owner: Fighter, at: THREE.Vector3, r: number, dmg: number, o: BlastOpts = {}): void {
  g.engine.destruction.carve(new SphereShape(at.clone(), Math.max(0.5, r * 0.7), 0.7), { mode: 'explode', power: o.power ?? 600, impulse: 10 + r * 2 });
  const glow = g.engine.glow;
  glow.spawn({ x: at.x, y: at.y, z: at.z, size: r * 1.2, sizeEnd: r * 2.2, life: 0.14, r: 1, g: 0.96, b: 0.88, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  const n = Math.min(60, 12 + r * 8);
  for (let i = 0; i < n; i++) {
    const u = Math.random();
    _c.copy(u < 0.3 ? C_WHITE : u < 0.7 ? C_ORANGE : u < 0.9 ? C_RED : C_PINK);
    const a = Math.random() * Math.PI * 2, e = Math.random() * Math.PI - Math.PI / 2;
    const sp = (2 + Math.random() * 5) * Math.max(1, r * 0.5);
    glow.spawn({ x: at.x, y: at.y, z: at.z, vx: Math.cos(a) * Math.cos(e) * sp, vy: Math.abs(Math.sin(e)) * sp * 0.8 + 1, vz: Math.sin(a) * Math.cos(e) * sp, size: 0.3 + Math.random() * r * 0.35, sizeEnd: 0.05, life: 0.25 + Math.random() * 0.35, r: _c.r, g: _c.g, b: _c.b, alpha: 1, alphaEnd: 0, tex: Math.random() < 0.3 ? TEX_STREAK : TEX_GLOW, stretch: 1.5, drag: 3 });
  }
  for (let i = 0; i < Math.min(14, 3 + r * 2); i++) {
    const a = Math.random() * Math.PI * 2;
    g.engine.dust.spawn({ x: at.x + Math.cos(a) * r * 0.3, y: at.y + Math.random() * r * 0.4, z: at.z + Math.sin(a) * r * 0.3, vx: Math.cos(a) * 1.5, vy: 1 + Math.random() * 1.5, vz: Math.sin(a) * 1.5, size: r * 0.5, sizeEnd: r * 1.3, life: 1.4 + Math.random(), r: 0.17, g: 0.13, b: 0.14, alpha: 0.55, alphaEnd: 0, tex: TEX_PUFF, drag: 1.2 });
  }
  if (!o.quiet) {
    g.addRing(at.clone(), r * 1.8, ORB_GLOW, 0.35);
    g.sfx.play('explode', at, Math.min(1.6, 0.5 + r * 0.15));
    if (g.player && g.player.pos.distanceTo(at) < 25 + r * 3) g.shake(Math.min(0.9, 0.1 + r * 0.06));
  }
  const victims = o.allies ? g.fighters.filter((f) => f !== owner) : g.enemiesOf(owner);
  for (const f of victims) {
    if (f.dead) continue;
    const c = f.center();
    const d = o.on === f ? 0 : Math.max(0, c.distanceTo(at) - f.def.radius);
    if (d > r) continue;
    const k = 1 - (d / r) * 0.6;
    const dir = _a.subVectors(c, at).setY(0);
    if (dir.lengthSq() < 1e-4) owner.forward(dir);
    g.damage(f, dmg * k, owner, dir.normalize().clone(), { energy: true, unblockable: o.unblockable, heavy: dmg * k > 25, knock: (o.knock ?? 8) * k, launch: (o.launch ?? 3) * k, hitstop: o.quiet ? 0 : 0.05, shake: 0.2, quiet: o.quiet, color: ORB_GLOW });
  }
}

/** the pink mark of an armed thing: a pulse, faster as the fuse runs out */
function armedPulse(g: Game, at: THREE.Vector3, k: number, size: number, t: number): void {
  const rate = 4 + k * 18;
  const on = Math.sin(t * rate * Math.PI * 2) > 0;
  g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, size: size * (on ? 1.3 : 0.8) * (1 + k * 0.6), sizeEnd: size * 0.4, life: 0.08, r: 1, g: on ? 0.45 : 0.3, b: on ? 0.55 : 0.4, alpha: on ? 1 : 0.6, alphaEnd: 0, tex: TEX_GLOW });
  if (Math.random() < 0.5) g.engine.glow.spawn({ x: at.x + (Math.random() - 0.5) * size, y: at.y + (Math.random() - 0.5) * size, z: at.z + (Math.random() - 0.5) * size, vx: 0, vy: 0.8, vz: 0, size: 0.05, sizeEnd: 0.01, life: 0.3, r: 1, g: 0.3, b: 0.43, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
}

// ------------------------------------------------------------------ tags

/** A fuse on a fighter or a point of the world: the pink mark, then the blast. */
export class BombTag implements Projectile {
  done = false;
  private t = 0;
  readonly pos = new THREE.Vector3();
  /** from the target's centre (or the world point itself) */
  private offset: THREE.Vector3;

  constructor(private g: Game, readonly owner: Fighter, readonly target: Fighter | null, at: THREE.Vector3, readonly fuse = 0.8, readonly dmg = 12, readonly r = 1.6, readonly o: BlastOpts & { size?: number } = {}) {
    this.offset = target ? at.clone().sub(target.center()) : at.clone();
    this.pos.copy(at);
  }

  update(dt: number): void {
    const { g } = this;
    this.t += dt;
    if (this.target) {
      if (this.target.dead) {
        this.done = true;
        return;
      }
      this.pos.copy(this.target.center()).add(this.offset);
    } else this.pos.copy(this.offset);
    armedPulse(g, this.pos, Math.min(1, this.t / this.fuse), this.o.size ?? 0.35, this.t);
    if (this.t >= this.fuse) {
      blast(g, this.owner, this.pos, this.r, this.dmg, { ...this.o, on: this.target });
      this.done = true;
    }
  }

  /** a rejection (Orihime) or a fuse-freeze undoes it */
  reject(at: THREE.Vector3, radius: number, by: Fighter): boolean {
    if (this.done || by.team === this.owner.team || this.pos.distanceTo(at) > radius) return false;
    this.done = true;
    return true;
  }

  dispose(): void {}
}

// ------------------------------------------------------------------ orbs

let orbGeo: THREE.SphereGeometry | null = null;

function orbMesh(g: Game, radius: number): { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial } {
  if (!orbGeo) orbGeo = new THREE.SphereGeometry(1, 12, 8);
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(ORB_CORE).multiplyScalar(1.6), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
  const mesh = new THREE.Mesh(orbGeo, mat);
  mesh.scale.setScalar(radius);
  mesh.frustumCulled = false;
  mesh.renderOrder = 7;
  g.engine.gr.scene.add(mesh);
  return { mesh, mat };
}

export interface OrbOpts {
  dmg: number;
  r?: number;
  fuse?: number;
  speed?: number;
  /** falls (carpet bombing, Flatland's rain) */
  gravity?: number;
  life?: number;
  size?: number;
}

/** A reishi orb: it flies (or falls), sticks to the first thing it touches, and goes off after its fuse. */
export class BombOrb implements Projectile {
  done = false;
  readonly pos: THREE.Vector3;
  readonly vel: THREE.Vector3;
  private t = 0;
  private stuckT = -1;
  private on: Fighter | null = null;
  private offset = new THREE.Vector3();
  private mesh: THREE.Mesh;
  private mat: THREE.MeshBasicMaterial;

  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, dir: THREE.Vector3, readonly o: OrbOpts) {
    this.pos = from.clone();
    this.vel = dir.clone().normalize().multiplyScalar(o.speed ?? 34);
    ({ mesh: this.mesh, mat: this.mat } = orbMesh(g, o.size ?? 0.17));
  }

  private stick(f: Fighter | null, at: THREE.Vector3): void {
    this.stuckT = 0;
    this.on = f;
    this.pos.copy(at);
    if (f) this.offset.copy(at).sub(f.center()).multiplyScalar(0.6);
  }

  update(dt: number): void {
    const { g, o } = this;
    this.t += dt;
    if (this.stuckT >= 0) {
      this.stuckT += dt;
      if (this.on) {
        if (this.on.dead) {
          this.done = true;
          return;
        }
        this.pos.copy(this.on.center()).add(this.offset);
      }
      armedPulse(g, this.pos, Math.min(1, this.stuckT / (o.fuse ?? 0.5)), 0.3, this.t);
      if (this.stuckT >= (o.fuse ?? 0.5)) {
        blast(g, this.owner, this.pos, o.r ?? 1.8, o.dmg, { on: this.on, knock: 6, launch: 3 });
        this.done = true;
      }
      return;
    }
    if (o.gravity) this.vel.y -= o.gravity * dt;
    const step = this.vel.length() * dt;
    const dir = _a.copy(this.vel).normalize();
    // a body it brushes
    for (const f of g.enemiesOf(this.owner)) {
      if (f.dead) continue;
      const to = _b.subVectors(f.center(), this.pos);
      const along = Math.max(0, Math.min(step, to.dot(dir)));
      const p = this.pos.clone().addScaledVector(dir, along);
      const cy = Math.max(f.pos.y + 0.2, Math.min(f.pos.y + f.def.height - 0.2, p.y));
      if (Math.hypot(f.pos.x - p.x, cy - p.y, f.pos.z - p.z) <= f.def.radius + 0.25) {
        this.stick(f, p);
        return;
      }
    }
    // the world it hits
    const hit = raycastVoxels(g.engine.world, this.pos.x, this.pos.y, this.pos.z, dir.x, dir.y, dir.z, step);
    if (hit) {
      this.stick(null, this.pos.clone().addScaledVector(dir, Math.max(0, hit.dist - 0.1)));
      return;
    }
    this.pos.addScaledVector(dir, step);
    if (Math.random() < 0.6) g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, size: (o.size ?? 0.17) * 2.4, sizeEnd: 0.02, life: 0.18, r: 1, g: 0.35, b: 0.45, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
    if (this.t >= (o.life ?? 3)) this.stick(null, this.pos.clone());
  }

  render(_dt: number, time: number): void {
    this.mesh.position.copy(this.pos);
    const k = this.stuckT >= 0 ? Math.min(1, this.stuckT / (this.o.fuse ?? 0.5)) : 0;
    this.mesh.scale.setScalar((this.o.size ?? 0.17) * (1 + k * 0.6 + Math.sin(time * 30) * 0.08));
    this.mat.color.copy(C_PINK).lerp(new THREE.Color(ORB_CORE), 0.5 + Math.sin(time * (8 + k * 30)) * 0.5).multiplyScalar(1.6);
  }

  /** a rejection or a fuse-freeze undoes it */
  reject(at: THREE.Vector3, radius: number, by: Fighter): boolean {
    if (this.done || by.team === this.owner.team || this.pos.distanceTo(at) > radius) return false;
    this.done = true;
    return true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mat.dispose();
  }
}

/**
 * The kick bomb: a big orb booted along the ground — it skims, bounces twice and goes off on the first body it meets
 * (a cut or a guard does not help) or where its run ends.
 */
export class KickedOrb implements Projectile {
  done = false;
  readonly pos: THREE.Vector3;
  private vel: THREE.Vector3;
  private t = 0;
  private bounces = 0;
  private mesh: THREE.Mesh;
  private mat: THREE.MeshBasicMaterial;

  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, dir: THREE.Vector3, readonly dmg = 45, readonly r = 3, readonly range = 30) {
    this.pos = from.clone();
    const flat = dir.clone().setY(0).normalize();
    this.vel = flat.multiplyScalar(22).add(new THREE.Vector3(0, 3, 0));
    ({ mesh: this.mesh, mat: this.mat } = orbMesh(g, 0.32));
  }

  update(dt: number): void {
    const { g } = this;
    this.t += dt;
    this.vel.y -= 18 * dt;
    const next = this.pos.clone().addScaledVector(this.vel, dt);
    // the ground: a bounce
    const down = raycastVoxels(g.engine.world, next.x, next.y + 0.4, next.z, 0, -1, 0, 0.75);
    if (down && this.vel.y < 0) {
      next.y += 0.4 - down.dist + 0.32;
      this.vel.y = this.bounces < 2 ? 5.5 - this.bounces * 1.5 : 0;
      this.bounces++;
      g.engine.dust.spawn({ x: next.x, y: next.y - 0.3, z: next.z, vx: 0, vy: 0.6, vz: 0, size: 0.6, sizeEnd: 1.4, life: 0.5, r: 0.5, g: 0.45, b: 0.42, alpha: 0.4, alphaEnd: 0, tex: TEX_PUFF });
    }
    // a wall: it goes off
    const dir = _a.copy(this.vel).setY(0).normalize();
    const wall = raycastVoxels(g.engine.world, this.pos.x, this.pos.y + 0.1, this.pos.z, dir.x, 0, dir.z, this.vel.length() * dt + 0.3);
    this.pos.copy(next);
    let boom = !!wall || this.t * 22 > this.range;
    for (const f of g.enemiesOf(this.owner)) {
      if (!f.dead && f.center().distanceTo(this.pos) < f.def.radius + 0.7) boom = true;
    }
    armedPulse(g, this.pos, Math.min(1, this.t / 1.4), 0.45, this.t);
    if (boom) {
      blast(g, this.owner, this.pos, this.r, this.dmg, { unblockable: true, knock: 12, launch: 6, power: 800 });
      this.done = true;
    }
  }

  render(_dt: number, time: number): void {
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.x += 0.4;
    this.mat.color.copy(C_PINK).lerp(new THREE.Color(ORB_CORE), 0.5 + Math.sin(time * 20) * 0.5).multiplyScalar(1.6);
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mat.dispose();
  }
}

// ------------------------------------------------------------------ the boulder

/** Arm & throw: a chunk of the ground carried in her hand, then thrown on an arc; it goes off where it lands. */
export class ArmedBoulder implements Projectile {
  done = false;
  readonly pos = new THREE.Vector3();
  private vel = new THREE.Vector3();
  private thrown = false;
  private t = 0;
  private mesh: PropMesh;

  constructor(private g: Game, readonly owner: Fighter, model: VoxelModel, private hand: () => THREE.Vector3, readonly dmg = 60, readonly r = 3.5) {
    this.mesh = new PropMesh(model);
    g.engine.gr.scene.add(this.mesh);
    this.pos.copy(hand());
  }

  /** off her hand on an arc that lands at `to` */
  throwAt(to: THREE.Vector3): void {
    this.thrown = true;
    const d = _a.subVectors(to, this.pos);
    const flat = Math.hypot(d.x, d.z);
    const T = Math.max(0.35, Math.min(1.3, flat / 24));
    this.vel.set(d.x / T, (d.y + 0.5 * 20 * T * T) / T, d.z / T);
  }

  update(dt: number): void {
    const { g } = this;
    this.t += dt;
    if (this.owner.dead) {
      this.done = true;
      return;
    }
    armedPulse(g, this.pos, this.thrown ? 0.7 : 0.2, 0.7, this.t);
    if (!this.thrown) {
      this.pos.copy(this.hand()).add(_a.set(0, 0.45, 0));
      if (this.t > 3) this.done = true;
      return;
    }
    this.vel.y -= 20 * dt;
    const step = this.vel.length() * dt;
    const dir = _b.copy(this.vel).normalize();
    let boom = !!raycastVoxels(g.engine.world, this.pos.x, this.pos.y, this.pos.z, dir.x, dir.y, dir.z, step + 0.5);
    this.pos.addScaledVector(this.vel, dt);
    for (const f of g.enemiesOf(this.owner)) if (!f.dead && f.center().distanceTo(this.pos) < f.def.radius + 0.9) boom = true;
    if (boom || this.t > 5) {
      blast(g, this.owner, this.pos, this.r, this.dmg, { power: 900, knock: 14, launch: 7 });
      this.done = true;
    }
  }

  render(): void {
    this.mesh.position.copy(this.pos);
    if (this.thrown) {
      this.mesh.rotation.x += 0.08;
      this.mesh.rotation.z += 0.05;
    }
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.material.dispose();
  }
}

// ------------------------------------------------------------------ the tantrum

/**
 * The explosive globe: a pink glow swelling round her body, then a sphere of explosion bursting out of it — the world
 * round her flattened, everyone near thrown, her own side included.
 */
export class ExplosiveGlobe implements Projectile {
  done = false;
  private t = 0;
  private fired = false;
  private mesh: THREE.Mesh;
  private mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(ORB_GLOW).multiplyScalar(1.4), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });

  constructor(private g: Game, readonly owner: Fighter, readonly radius = 12, readonly dmg = 70, readonly charge = 0.5) {
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 6;
    g.engine.gr.scene.add(this.mesh);
  }

  update(dt: number): void {
    const { g, owner } = this;
    this.t += dt;
    const c = owner.center();
    if (this.t < this.charge) {
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2, e = Math.random() * Math.PI;
        const rr = 2.5;
        const px = c.x + Math.sin(e) * Math.cos(a) * rr, py = c.y + Math.cos(e) * rr, pz = c.z + Math.sin(e) * Math.sin(a) * rr;
        g.engine.glow.spawn({ x: px, y: py, z: pz, vx: (c.x - px) * 3, vy: (c.y - py) * 3, vz: (c.z - pz) * 3, size: 0.2, sizeEnd: 0.05, life: 0.3, r: 1, g: 0.4, b: 0.5, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2 });
      }
      return;
    }
    if (!this.fired) {
      this.fired = true;
      blast(g, owner, c, this.radius, this.dmg, { allies: true, power: 1000, knock: 20, launch: 9 });
      // the shell of it: a ring of blasts round the edge flattening what stands there
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const p = c.clone().add(_a.set(Math.cos(a) * this.radius * 0.75, 0, Math.sin(a) * this.radius * 0.75));
        g.engine.destruction.carve(new SphereShape(p, this.radius * 0.3, 0.6), { mode: 'explode', power: 800, impulse: 18 });
      }
      g.slowMo(0.4, 0.25);
    }
    if (this.t >= this.charge + 0.6) this.done = true;
  }

  render(): void {
    const c = this.owner.center();
    this.mesh.position.copy(c);
    if (this.t < this.charge) {
      const k = this.t / this.charge;
      this.mesh.scale.setScalar(0.6 + k * 1.4);
      this.mat.opacity = 0.25 + k * 0.4;
    } else {
      const k = Math.min(1, (this.t - this.charge) / 0.6);
      this.mesh.scale.setScalar(2 + (this.radius - 2) * Math.pow(k, 0.5));
      this.mat.opacity = 0.7 * (1 - k);
    }
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}
