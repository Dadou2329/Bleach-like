// Meninas's Power (docs/kits/meninas.md). LiftedChunk: a chunk of the world ripped out — its real voxels pulled into one
// rigid piece (`FragmentSystem.grab`) — carried overhead, then thrown on an arc or carried over the target and dropped:
// what it lands on is crushed, and the piece goes on as rubble. DiamondPush: the shove, a pink diamond of force driven
// forward that bores a diamond-shaped tunnel and sends whoever it meets through every wall behind them. HeartArrow: the
// small bow's arrow. chunkKeys(): the world voxels in a box (what can be ripped up). flexCracks(): the ground
// spider-webbing round her feet.
import * as THREE from 'three';
import type { Fighter } from '../game/fighter';
import type { Game, Projectile } from '../game/game';
import type { Fragment } from '../destruction/fragments';
import { BoxShape, SphereShape } from '../destruction/shapes';
import { raycastVoxels } from '../voxel/raycast';
import { PropMesh } from '../game/characterFactory';
import { meninasProp } from '../chars/meninas';
import { bambiettaProp } from '../chars/bambietta';
import { Plow } from './engetsu';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

export const PINK = '#FF7EB8';
export const PINK_LIGHT = '#FFD6EA';
export const PINK_DEEP = '#E0408A';

const C_PINK = new THREE.Color(PINK);
const C_LIGHT = new THREE.Color(PINK_LIGHT);
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _q = new THREE.Quaternion();
const ZP = new THREE.Vector3(0, 0, 1);
const GRAV = 18;

/** the packed keys of the breakable voxels in an axis-aligned box (world metres), and how many */
export function chunkKeys(g: Game, min: THREE.Vector3, max: THREE.Vector3, cap = 90000): Float64Array {
  const w = g.engine.world;
  const vs = w.vs;
  const sx = w.sx, sy = w.sy;
  const x0 = Math.max(0, Math.floor(min.x / vs)), y0 = Math.max(0, Math.floor(min.y / vs)), z0 = Math.max(0, Math.floor(min.z / vs));
  const x1 = Math.min(w.sx - 1, Math.floor(max.x / vs)), y1 = Math.min(w.sy - 1, Math.floor(max.y / vs)), z1 = Math.min(w.sz - 1, Math.floor(max.z / vs));
  const out: number[] = [];
  for (let z = z0; z <= z1; z++)
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const m = w.get(x, y, z);
        if (m === 0 || w.mats.hardness[m] === Infinity) continue;
        out.push(x + sx * (y + sy * z));
        if (out.length >= cap) return new Float64Array(out);
      }
  return new Float64Array(out);
}

/**
 * A chunk of the world in her hands: carried (kinematic) at `hold()`, then thrown at a point on an arc, or carried over
 * it and dropped. On landing (or on a body) it crushes everything round it; the piece itself goes on as falling rubble.
 * When there is nothing to rip up (bare bedrock), a boulder stands in for it.
 */
export class LiftedChunk implements Projectile {
  done = false;
  readonly center = new THREE.Vector3();
  private frag: Fragment | null;
  private rock: PropMesh | null = null;
  private rockVel = new THREE.Vector3();
  private half = new THREE.Vector3(0.6, 0.6, 0.6);
  private state: 'held' | 'carry' | 'flying' = 'held';
  private carryFrom = new THREE.Vector3();
  private carryTo = new THREE.Vector3();
  private carryT = 0;
  private t = 0;
  private lastSpeed = 0;
  private tumble = new THREE.Vector3();
  private flyFrom = new THREE.Vector3();
  private carveT = 0;
  private through = false;

  constructor(private g: Game, readonly owner: Fighter, keys: Float64Array, private hold: () => THREE.Vector3, readonly dmg = 55, readonly radius = 2.2) {
    this.frag = keys.length >= 10 ? g.engine.fragments.grab(keys) : null;
    if (this.frag) {
      const vs = g.engine.world.vs;
      this.half.set((this.frag.w * vs) / 2, (this.frag.h * vs) / 2, (this.frag.d * vs) / 2);
    } else {
      this.rock = new PropMesh(bambiettaProp('boulder'));
      this.rock.scale.setScalar(1.6);
      g.engine.gr.scene.add(this.rock);
      this.half.set(0.8, 0.8, 0.8);
    }
    this.center.copy(hold());
    this.place();
    g.sfx.play('crumble', this.center, 1.2);
    // the ground torn up where it came from
    for (let i = 0; i < 16; i++) g.engine.dust.spawn({ x: this.center.x + (Math.random() - 0.5) * this.half.x * 2, y: this.center.y - this.half.y, z: this.center.z + (Math.random() - 0.5) * this.half.z * 2, vx: (Math.random() - 0.5) * 2, vy: 1 + Math.random() * 2, vz: (Math.random() - 0.5) * 2, size: 0.8, sizeEnd: 2.4, life: 1.0, r: 0.6, g: 0.56, b: 0.5, alpha: 0.6, alphaEnd: 0, tex: TEX_PUFF, drag: 1.5 });
  }

  /** the biggest half-extent (m) */
  get size(): number {
    return Math.max(this.half.x, this.half.y, this.half.z);
  }

  /** set the piece so its centre sits at `center` (kinematic) */
  private place(): void {
    if (this.frag) {
      if (!this.g.engine.fragments.alive(this.frag)) return;
      const r = this.frag.body.rotation();
      _q.set(r.x, r.y, r.z, r.w);
      _v.copy(this.half).applyQuaternion(_q);
      this.frag.body.setNextKinematicTranslation({ x: this.center.x - _v.x, y: this.center.y - _v.y, z: this.center.z - _v.z });
    } else if (this.rock) this.rock.position.copy(this.center);
  }

  /**
   * off her hands on an arc that lands at `to`; `through` (torn out of the wall in front of her): it smashes on through
   * that wall instead of stopping against it
   */
  throwAt(to: THREE.Vector3, through = false): void {
    const d = _v.subVectors(to, this.center);
    const flat = Math.hypot(d.x, d.z);
    const T = Math.max(0.35, Math.min(1.2, flat / 24));
    const vel = new THREE.Vector3(d.x / T, (d.y + 0.5 * GRAV * T * T) / T, d.z / T);
    this.tumble.set((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 3);
    this.launch(vel, through ? Math.min(0.45, 4.5 / Math.max(1, flat / T)) : 0);
  }

  /** carried over `to`, high up, then let fall onto it (the Building Drop) */
  dropOn(to: THREE.Vector3, height = 10): void {
    this.state = 'carry';
    this.carryT = 0;
    this.carryFrom.copy(this.center);
    this.carryTo.copy(to).setY(to.y + height + this.half.y);
  }

  private launch(vel: THREE.Vector3, ghost = 0): void {
    this.state = 'flying';
    this.flyFrom.copy(this.center);
    this.through = ghost > 0;
    this.lastSpeed = vel.length();
    if (this.frag && this.g.engine.fragments.alive(this.frag)) this.g.engine.fragments.release(this.frag, vel, this.tumble, ghost);
    else this.rockVel.copy(vel);
    this.g.sfx.play('swingHeavy', this.center, 1.2);
  }

  /** the chunk's centre now */
  private where(): THREE.Vector3 {
    if (this.frag && this.g.engine.fragments.alive(this.frag)) {
      const t = this.frag.body.translation(), r = this.frag.body.rotation();
      _q.set(r.x, r.y, r.z, r.w);
      return this.center.copy(this.half).applyQuaternion(_q).add(_w.set(t.x, t.y, t.z));
    }
    return this.center;
  }

  /** it lands: everything round it crushed, a crater, the dust */
  private land(): void {
    const { g, owner } = this;
    const c = this.where().clone();
    const r = this.size + this.radius * 0.5;
    g.engine.destruction.carve(new SphereShape(c, r * 0.8, 0.5), { mode: 'smash', power: 1400, impulse: 14, dust: 0.8 });
    for (const e of g.enemiesOf(owner)) {
      if (e.dead || e.center().distanceTo(c) > r + e.def.radius + 0.6) continue;
      const dir = e.pos.clone().sub(c).setY(0).normalize();
      g.damage(e, this.dmg, owner, dir, { knock: 16, launch: 6, heavy: true, hitstop: 0.12, shake: 0.5 });
    }
    g.groundImpact(new THREE.Vector3(c.x, c.y - this.half.y, c.z), Math.min(4, r), 600, '#B0A898', owner);
    if (g.player && g.player.pos.distanceTo(c) < 30) g.shake(Math.min(0.8, 0.25 + this.size * 0.15));
    this.done = true;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.owner.dead && this.state !== 'flying') {
      // dropped where she fell
      this.launch(new THREE.Vector3(0, -2, 0));
    }
    if (this.state === 'held') {
      this.center.copy(this.hold());
      this.place();
      if (this.t > 6) this.launch(new THREE.Vector3(0, -2, 0));
      return;
    }
    if (this.state === 'carry') {
      this.carryT += dt;
      const k = Math.min(1, this.carryT / 0.6);
      const e = k * k * (3 - 2 * k);
      this.center.lerpVectors(this.carryFrom, this.carryTo, e);
      this.place();
      if (k >= 1) this.launch(new THREE.Vector3(0, -26, 0));
      return;
    }
    // flying: a body in the way, or the ground, ends it
    if (!this.frag || !g.engine.fragments.alive(this.frag)) {
      if (this.rock) {
        this.rockVel.y -= GRAV * dt;
        const step = this.rockVel.length() * dt;
        const d = _v.copy(this.rockVel).normalize();
        const hit = raycastVoxels(g.engine.world, this.center.x, this.center.y, this.center.z, d.x, d.y, d.z, step + this.half.y);
        this.center.addScaledVector(this.rockVel, dt);
        this.rock.position.copy(this.center);
        this.rock.rotation.x += dt * 4;
        if (hit) {
          this.land();
          return;
        }
      } else {
        // the piece is gone (shattered on something): it has landed
        this.land();
        return;
      }
    }
    const c = this.where();
    for (const e of g.enemiesOf(this.owner)) {
      if (e.dead || e.center().distanceTo(c) > this.size + e.def.radius + 0.3) continue;
      this.land();
      return;
    }
    if (this.frag && g.engine.fragments.alive(this.frag)) {
      const v = this.frag.body.linvel();
      const sp = Math.hypot(v.x, v.y, v.z);
      // too heavy to stop: the wall it was torn out of (whatever stands right in front of her) is smashed through
      if (this.through && sp > 6 && Math.hypot(c.x - this.flyFrom.x, c.z - this.flyFrom.z) < 4.5) {
        if ((this.carveT -= dt) > 0) return;
        this.carveT = 0.03;
        const ahead = _v.set(v.x, v.y, v.z).normalize().multiplyScalar(this.size * 0.6).add(c);
        g.engine.destruction.carve(new SphereShape(ahead, this.size * 1.25, 0.5), { mode: 'smash', power: 900, impulse: 8, dust: 0.4 });
        this.lastSpeed = sp;
        return;
      }
      if (this.t > 0.15 && (sp < this.lastSpeed * 0.55 || sp < 2)) {
        this.land();
        return;
      }
      this.lastSpeed = sp;
    }
    if (this.t > 8) this.done = true;
  }

  dispose(): void {
    // a piece still in her hands when she falls drops where it is
    if (this.frag && this.frag.held && this.g.engine.fragments.alive(this.frag)) this.g.engine.fragments.release(this.frag, new THREE.Vector3());
    if (this.rock) {
      this.rock.removeFromParent();
      this.rock.material.dispose();
    }
  }
}

/** a flattened octahedron: the diamond of force (unit size, its point along +Z) */
function diamondGeometry(): THREE.BufferGeometry {
  const g = new THREE.OctahedronGeometry(1, 0);
  g.scale(1, 1, 0.45);
  return g;
}

/**
 * Diamond Push: a diamond of pink force driven forward from her hands. It bores a diamond-shaped tunnel through
 * whatever it meets and sends each body it hits flying along it, smashing through every wall behind (`Plow`).
 */
export class DiamondPush implements Projectile {
  done = false;
  private d = 0;
  private hit = new Set<Fighter>();
  private mesh: THREE.Mesh;
  private rim: THREE.Mesh;
  private rot = new THREE.Quaternion();

  constructor(private g: Game, readonly owner: Fighter, readonly from: THREE.Vector3, readonly dir: THREE.Vector3, readonly range = 12, readonly w = 2.4, readonly dmg = 50, readonly knock = 36) {
    this.dir = dir.clone().setY(0).normalize();
    // the diamond stands on its point: the box turned 45° about the shove's axis
    _q.setFromUnitVectors(ZP, this.dir);
    this.rot.copy(_q).multiply(new THREE.Quaternion().setFromAxisAngle(ZP, Math.PI / 4));
    this.mesh = new THREE.Mesh(diamondGeometry(), new THREE.MeshBasicMaterial({ color: PINK, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.rim = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), new THREE.MeshBasicMaterial({ color: PINK_LIGHT, wireframe: true, transparent: true, opacity: 0.9, depthWrite: false }));
    this.mesh.quaternion.setFromUnitVectors(ZP, this.dir);
    this.rim.quaternion.copy(this.mesh.quaternion);
    g.engine.gr.scene.add(this.mesh, this.rim);
    g.sfx.play('explode', from, 0.9);
    if (g.player && g.player.pos.distanceTo(from) < 25) g.shake(0.35);
  }

  update(dt: number, g: Game): void {
    const step = 40 * dt;
    const a = this.d;
    this.d = Math.min(this.range, this.d + step);
    const mid = this.from.clone().addScaledVector(this.dir, (a + this.d) / 2);
    const half = this.w / 2 * 0.72;
    g.engine.destruction.carve(new BoxShape(mid, new THREE.Vector3(half, half, (this.d - a) / 2 + 0.2), this.rot), { mode: 'smash', power: 1100, impulse: 12, dir: this.dir.clone(), dust: 0.7 });
    for (const e of g.enemiesOf(this.owner)) {
      if (e.dead || this.hit.has(e)) continue;
      const c = e.center();
      const along = _v.subVectors(c, this.from).dot(this.dir);
      if (along < -0.5 || along > this.d + 0.5) continue;
      const off = _w.copy(this.from).addScaledVector(this.dir, along).distanceTo(c);
      if (off > this.w / 2 + e.def.radius) continue;
      this.hit.add(e);
      g.damage(e, this.dmg, this.owner, this.dir.clone(), { knock: this.knock, launch: 3, heavy: true, hitstop: 0.12, shake: 0.5, color: PINK });
      g.addProjectile(new Plow(e, 1.0));
    }
    for (let i = 0; i < 3; i++) {
      const p = mid.clone().add(_v.set((Math.random() - 0.5) * this.w, (Math.random() - 0.5) * this.w, (Math.random() - 0.5) * 2));
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: this.dir.x * 8, vy: 0, vz: this.dir.z * 8, size: 0.3, sizeEnd: 0.05, life: 0.25, r: C_PINK.r, g: C_PINK.g, b: C_PINK.b, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
    }
    if (this.d >= this.range) this.done = true;
  }

  render(): void {
    const p = this.from.clone().addScaledVector(this.dir, this.d);
    const s = this.w * 0.62;
    const fade = 1 - this.d / this.range;
    this.mesh.position.copy(p);
    this.rim.position.copy(p);
    this.mesh.scale.set(s, s, s);
    this.rim.scale.set(s * 1.04, s * 1.04, s * 0.47);
    (this.mesh.material as THREE.MeshBasicMaterial).opacity = 0.2 + 0.3 * fade;
    (this.rim.material as THREE.MeshBasicMaterial).opacity = 0.4 + 0.5 * fade;
  }

  dispose(): void {
    for (const m of [this.mesh, this.rim]) {
      m.removeFromParent();
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    }
  }
}

/** The small bow's arrow: a heart at the head of a pink streak. */
export class HeartArrow implements Projectile {
  done = false;
  private pos: THREE.Vector3;
  private vel: THREE.Vector3;
  private t = 0;
  private mesh: PropMesh;

  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, dir: THREE.Vector3, readonly dmg = 12) {
    this.pos = from.clone();
    this.vel = dir.clone().normalize().multiplyScalar(46);
    this.mesh = new PropMesh(meninasProp('heart'));
    this.mesh.scale.setScalar(1.2);
    this.mesh.castShadow = false;
    g.engine.gr.scene.add(this.mesh);
    g.sfx.play('arrow', from, 0.5);
  }

  private pop(p: THREE.Vector3): void {
    this.done = true;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      this.g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3, vz: 0, size: 0.14, sizeEnd: 0.03, life: 0.2, r: C_LIGHT.r, g: C_LIGHT.g, b: C_LIGHT.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2 });
    }
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const step = this.vel.length() * dt;
    const d = _v.copy(this.vel).normalize();
    for (const e of g.enemiesOf(this.owner)) {
      if (e.dead) continue;
      const c = e.center();
      const along = Math.max(0, Math.min(step, _w.subVectors(c, this.pos).dot(d)));
      if (this.pos.clone().addScaledVector(d, along).distanceTo(c) > e.def.radius + 0.35) continue;
      g.damage(e, this.dmg, this.owner, d.clone(), { energy: true, knock: 2, hitstop: 0.03, color: PINK });
      this.pop(c);
      return;
    }
    const hit = raycastVoxels(g.engine.world, this.pos.x, this.pos.y, this.pos.z, d.x, d.y, d.z, step);
    if (hit) {
      const p = this.pos.clone().addScaledVector(d, hit.dist);
      g.engine.destruction.carve(new SphereShape(p, 0.4, 0.6), { mode: 'smash', power: 300, dust: 0.3 });
      this.pop(p);
      return;
    }
    this.pos.addScaledVector(this.vel, dt);
    g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, size: 0.3, sizeEnd: 0.08, life: 0.08, r: C_PINK.r, g: C_PINK.g, b: C_PINK.b, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    if (this.t > 1.6) this.done = true;
  }

  render(): void {
    this.mesh.position.copy(this.pos);
    this.mesh.quaternion.setFromUnitVectors(ZP, _v.copy(this.vel).normalize());
  }

  reject(p: THREE.Vector3, radius: number): boolean {
    if (this.pos.distanceTo(p) > radius) return false;
    this.done = true;
    return true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.material.dispose();
  }
}

/** The flex: the ground spider-webs round her feet — thin cracks cut outward, a puff of dust, loose bits jumping. */
export function flexCracks(g: Game, at: THREE.Vector3, r = 3.2): void {
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
    const len = r * (0.6 + Math.random() * 0.5);
    const mid = new THREE.Vector3(at.x + Math.sin(a) * len * 0.5, at.y - 0.06, at.z + Math.cos(a) * len * 0.5);
    const rot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), a);
    g.engine.destruction.carve(new BoxShape(mid, new THREE.Vector3(0.07, 0.14, len / 2), rot), { mode: 'cut', power: 500, dust: 0.3 });
  }
  for (let i = 0; i < 12; i++) {
    const a = Math.random() * Math.PI * 2, rr = Math.random() * r;
    g.engine.dust.spawn({ x: at.x + Math.cos(a) * rr, y: at.y + 0.1, z: at.z + Math.sin(a) * rr, vx: Math.cos(a) * 1.5, vy: 1 + Math.random() * 2.5, vz: Math.sin(a) * 1.5, size: 0.25, sizeEnd: 0.6, life: 0.6, r: 0.6, g: 0.56, b: 0.5, alpha: 0.6, alphaEnd: 0, tex: TEX_PUFF, gravity: -6 });
  }
}
