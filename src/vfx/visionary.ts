// Gremmy's Visionary (docs/kits/gremmy.md): whatever he imagines is real. Every creation arrives with the dream ripple
// (a prismatic ring, then the thing is simply there, in its own real material). StoneSpike, SteelBar, FallingBlock,
// PillarRam (a column shooting out level, carving), StoneHand (the giant palm), FirearmRing (rifles round him firing
// on full auto), MissileSalvo, WaterCube (a cube of water round a body: held, drowning; `crevice()` drops it into the
// ground and seals it), Meteor, OuterSpace (a pocket of vacuum), BladedDome, MetalBarBlock; raiseFort() lifts the
// ground round him into a fortress on pillars and crumbleFort() takes the pillars out from under it.
import * as THREE from 'three';
import type { Fighter } from '../game/fighter';
import type { Game, Projectile } from '../game/game';
import { PropMesh } from '../game/characterFactory';
import { COLUMN_LEN, DOME_R, METEOR_R, RIFLE_MUZZLE, SPIKE_H, gremmyProp, type GremmyProp } from '../chars/gremmy';
import { BoxShape, SphereShape } from '../destruction/shapes';
import { raycastVoxels } from '../voxel/raycast';
import { groundAt } from './iceArts';
import { waterMaterial, type WaterMaterial } from './water';
import { TEX_GLOW, TEX_PUFF, TEX_RING, TEX_STREAK } from './sprites';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const ZP = new THREE.Vector3(0, 0, 1);
const UP = new THREE.Vector3(0, 1, 0);
const HUES: [number, number, number][] = [[1, 0.5, 0.5], [1, 0.85, 0.45], [0.55, 1, 0.6], [0.5, 0.78, 1], [0.82, 0.55, 1]];

/** the dream ripple: a prismatic ring and a white flash — then the imagined thing is real */
export function dreamRipple(g: Game, at: THREE.Vector3, size = 1): void {
  HUES.forEach(([r, gg, b], i) => {
    g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, size: size * 0.4, sizeEnd: size * (1.7 + i * 0.14), life: 0.22 + i * 0.02, r, g: gg, b, alpha: 0.75, alphaEnd: 0, tex: TEX_RING });
  });
  g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, size: size * 0.3, sizeEnd: size * 1.1, life: 0.14, r: 1, g: 1, b: 1, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
}

function prop(g: Game, kind: GremmyProp, scale = 1): PropMesh {
  const m = new PropMesh(gremmyProp(kind));
  m.scale.setScalar(scale);
  g.engine.gr.scene.add(m);
  return m;
}

function drop(m: THREE.Mesh): void {
  m.removeFromParent();
  (m.material as THREE.Material).dispose();
}

/**
 * Fill an inclusive voxel box with `mat`: `world.fillBox` is end-exclusive and skips the edit hook, so the physics
 * colliders already built there are refreshed by hand.
 */
function fillVox(g: Game, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, mat: number): void {
  g.engine.world.fillBox(x0, y0, z0, x1 + 1, y1 + 1, z1 + 1, mat);
  g.engine.physics.invalidateBox(x0, y0, z0, x1, y1, z1);
}

/** the ground under a point (or the point itself) */
export function floorAt(g: Game, p: THREE.Vector3): number {
  return groundAt(g, p.x, p.y + 1.5, p.z, 12) ?? p.y;
}

function stoneDust(g: Game, at: THREE.Vector3, n: number, spread: number): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    g.engine.dust.spawn({ x: at.x + Math.cos(a) * spread * Math.random(), y: at.y + 0.2, z: at.z + Math.sin(a) * spread * Math.random(), vx: Math.cos(a) * 2, vy: 1 + Math.random() * 2, vz: Math.sin(a) * 2, size: 0.6, sizeEnd: 1.8, life: 0.9, r: 0.62, g: 0.58, b: 0.52, alpha: 0.55, alphaEnd: 0, tex: TEX_PUFF, drag: 1.5 });
  }
}

// ---------------------------------------------------------------------------------------------- the string

/** a stone spike thrust out of the ground under the target */
export class StoneSpike implements Projectile {
  done = false;
  private t = 0;
  private hit = false;
  private mesh: PropMesh;

  constructor(private g: Game, readonly owner: Fighter, readonly at: THREE.Vector3, readonly dmg: number, readonly scale = 1) {
    this.mesh = prop(g, 'spike', scale);
    this.mesh.position.set(at.x, at.y - SPIKE_H * scale, at.z);
    dreamRipple(g, at.clone().setY(at.y + 0.3), 1.2 * scale);
    g.sfx.play('crumble', at, 0.6);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const rise = Math.min(1, this.t / 0.1);
    const sink = Math.max(0, this.t - 1.2) * 5;
    this.mesh.position.y = this.at.y - SPIKE_H * this.scale * (1 - rise) - sink;
    if (!this.hit && this.t >= 0.07) {
      this.hit = true;
      g.engine.destruction.carve(new SphereShape(this.at.clone(), 0.9 * this.scale, 0.6), { mode: 'smash', power: 320, impulse: 6, dust: 0.4 });
      stoneDust(g, this.at, 8, 1.2);
      for (const e of g.enemiesOf(this.owner)) {
        if (e.dead || Math.hypot(e.pos.x - this.at.x, e.pos.z - this.at.z) > 1.3 * this.scale + e.def.radius || Math.abs(e.pos.y - this.at.y) > 2.5) continue;
        g.damage(e, this.dmg, this.owner, UP.clone(), { knock: 3, launch: 9, hitstop: 0.05 });
      }
    }
    if (this.t > 1.7) this.done = true;
  }

  dispose(): void {
    drop(this.mesh);
  }
}

/** a heavy steel bar appearing beside the target and swinging through it */
export class SteelBar implements Projectile {
  done = false;
  private t = 0;
  private hit = false;
  private mesh: PropMesh;
  private center = new THREE.Vector3();
  private a0: number;

  constructor(private g: Game, readonly owner: Fighter, readonly target: Fighter, readonly dmg: number, readonly scale = 1) {
    this.mesh = prop(g, 'bar', scale);
    const d = _v.subVectors(target.pos, owner.pos).setY(0).normalize();
    const side = _w.set(-d.z, 0, d.x);
    this.center.copy(target.center()).addScaledVector(side, 1.1 * scale);
    this.a0 = Math.atan2(side.x, side.z);
    dreamRipple(g, this.center, 1.4 * scale);
    g.sfx.play('swingHeavy', this.center, 0.6);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const k = Math.min(1, Math.max(0, (this.t - 0.1) / 0.24));
    const e = k * k * (3 - 2 * k);
    // the bar sweeps half a turn about its middle, its end passing through the target
    this.mesh.position.copy(this.center);
    this.mesh.rotation.set(0, this.a0 + Math.PI / 2 - e * Math.PI, 0);
    if (!this.hit && k >= 0.5) {
      this.hit = true;
      for (const f of g.enemiesOf(this.owner)) {
        if (f.dead || f.center().distanceTo(this.center) > 1.7 * this.scale + f.def.radius) continue;
        const dir = _v.subVectors(f.pos, this.center).setY(0).normalize().clone();
        g.damage(f, this.dmg, this.owner, dir, { knock: 12, hitstop: 0.06 });
      }
    }
    if (this.t > 0.9) this.done = true;
  }

  render(): void {
    if (this.t > 0.65) this.mesh.scale.setScalar(this.scale * Math.max(0.01, 1 - (this.t - 0.65) / 0.25));
  }

  dispose(): void {
    drop(this.mesh);
  }
}

/** a stone block appearing over the target and dropping on it */
export class FallingBlock implements Projectile {
  done = false;
  private t = 0;
  private vy = 0;
  private landed = -1;
  private mesh: PropMesh;
  private pos: THREE.Vector3;

  constructor(private g: Game, readonly owner: Fighter, readonly target: Fighter, readonly dmg: number, readonly scale = 1) {
    this.mesh = prop(g, 'block', scale);
    this.pos = target.pos.clone().add(_v.set(0, 6.5, 0));
    dreamRipple(g, this.pos, 1.8 * scale);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.landed >= 0) {
      if (this.t - this.landed > 0.8) this.done = true;
      return;
    }
    if (this.t > 0.12) {
      this.vy -= 34 * dt;
      this.pos.y += this.vy * dt;
    }
    const half = 0.75 * this.scale;
    const gy = floorAt(g, this.pos);
    let hitBody = false;
    for (const e of g.enemiesOf(this.owner)) if (!e.dead && e.center().distanceTo(this.pos) < half + e.def.radius + 0.4) hitBody = true;
    if (this.pos.y - half <= gy || hitBody) {
      this.landed = this.t;
      const at = new THREE.Vector3(this.pos.x, Math.max(gy, this.pos.y - half), this.pos.z);
      for (const e of g.enemiesOf(this.owner)) {
        if (e.dead || e.center().distanceTo(this.pos) > 1.6 * this.scale + e.def.radius) continue;
        g.damage(e, this.dmg, this.owner, _v.subVectors(e.pos, this.pos).setY(0).normalize().clone(), { knock: 6, heavy: true, hitstop: 0.08 });
      }
      g.engine.destruction.carve(new SphereShape(at, 1.2 * this.scale, 0.5), { mode: 'smash', power: 500, impulse: 8, dust: 0.6 });
      g.groundImpact(at, 1.4 * this.scale, 400, '#9A9182', this.owner);
      if (!hitBody) this.pos.y = gy + half;
    }
  }

  render(): void {
    this.mesh.position.copy(this.pos);
    if (this.landed >= 0) this.mesh.scale.setScalar(this.scale * Math.max(0.01, 1 - Math.max(0, this.t - this.landed - 0.5) / 0.3));
  }

  dispose(): void {
    drop(this.mesh);
  }
}

/** a stone column shooting out level (out of the ground or a wall), ploughing through what is in its way */
export class PillarRam implements Projectile {
  done = false;
  private t = 0;
  private ext = 0;
  private hit = new Set<Fighter>();
  private mesh: PropMesh;
  private carveT = 0;

  constructor(private g: Game, readonly owner: Fighter, readonly from: THREE.Vector3, readonly dir: THREE.Vector3, readonly dmg: number, readonly delay = 0, readonly len = COLUMN_LEN, readonly scale = 1) {
    this.dir = dir.clone().normalize();
    this.mesh = prop(g, 'column', scale);
    this.mesh.quaternion.setFromUnitVectors(ZP, this.dir);
    this.mesh.visible = false;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const t = this.t - this.delay;
    if (t < 0) return;
    if (!this.mesh.visible) {
      this.mesh.visible = true;
      dreamRipple(g, this.from, 1.4 * this.scale);
      g.sfx.play('crumble', this.from, 0.7);
    }
    const prev = this.ext;
    this.ext = Math.min(this.len, t * 45);
    if (this.ext > prev && (this.carveT -= dt) <= 0) {
      this.carveT = 0.03;
      const tip = this.from.clone().addScaledVector(this.dir, this.ext);
      g.engine.destruction.carve(new SphereShape(tip, 0.75 * this.scale, 0.6), { mode: 'smash', power: 600, impulse: 10, dir: this.dir.clone(), dust: 0.5 });
    }
    for (const e of g.enemiesOf(this.owner)) {
      if (e.dead || this.hit.has(e)) continue;
      const c = e.center();
      const along = _v.subVectors(c, this.from).dot(this.dir);
      if (along < -0.3 || along > this.ext + 0.4) continue;
      if (_w.copy(this.from).addScaledVector(this.dir, along).distanceTo(c) > 0.7 * this.scale + e.def.radius + 0.2) continue;
      this.hit.add(e);
      g.damage(e, this.dmg, this.owner, this.dir.clone(), { knock: 18, launch: 3, heavy: true, hitstop: 0.08 });
    }
    if (t > this.len / 45 + 0.7) this.done = true;
  }

  render(): void {
    // it emerges like a piston: what has not come out yet is still inside the ground or the wall
    const t = this.t - this.delay;
    const back = t > this.len / 45 + 0.4 ? (t - this.len / 45 - 0.4) * 20 : 0;
    this.mesh.position.copy(this.from).addScaledVector(this.dir, this.ext - this.len - back);
  }

  dispose(): void {
    drop(this.mesh);
  }
}

// ---------------------------------------------------------------------------------------------- the stone hand

/** the giant stone hand: it forms over the target, then slams down flat */
export class StoneHand implements Projectile {
  done = false;
  private t = 0;
  private y = 0;
  private landed = -1;
  private mesh: PropMesh;
  private fwd = new THREE.Vector3();
  private at = new THREE.Vector3();

  constructor(private g: Game, readonly owner: Fighter, readonly target: Fighter, readonly dmg: number, readonly scale = 1) {
    this.mesh = prop(g, 'hand', scale);
    this.fwd.subVectors(target.pos, owner.pos).setY(0).normalize();
    this.at.copy(target.pos);
    this.y = target.pos.y + 13;
    dreamRipple(g, this.at.clone().setY(this.y), 6 * scale);
    g.sfx.play('charge', this.at, 0.6);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.landed >= 0) {
      if (this.t - this.landed > 1.2) this.done = true;
      return;
    }
    // it follows the target while it forms, then comes down
    if (this.t < 0.5 && !this.target.dead) this.at.lerp(this.target.pos, Math.min(1, dt * 6));
    const gy = floorAt(g, this.at);
    if (this.t > 0.55) this.y -= 55 * dt;
    if (this.y <= gy + 0.6) {
      this.landed = this.t;
      this.y = gy + 0.6;
      const r = 3 * this.scale;
      for (const e of g.enemiesOf(this.owner)) {
        if (e.dead || Math.hypot(e.pos.x - this.at.x, e.pos.z - this.at.z) > r + e.def.radius || e.pos.y > gy + 4) continue;
        g.damage(e, this.dmg, this.owner, this.fwd.clone(), { knock: 4, heavy: true, hitstop: 0.14, shake: 0.6 });
        e.body.vel.y = Math.min(e.body.vel.y, -6);
      }
      g.engine.destruction.carve(new SphereShape(new THREE.Vector3(this.at.x, gy, this.at.z), r, 0.5), { mode: 'smash', power: 1600, impulse: 12, dust: 0.9 });
      g.groundImpact(new THREE.Vector3(this.at.x, gy, this.at.z), r + 0.5, 1200, '#9A9182', this.owner);
      if (g.player && g.player.pos.distanceTo(this.at) < 30) g.shake(0.6);
    }
  }

  render(): void {
    const s = this.scale;
    // the palm (2.6 m along the fingers from the wrist) centred on the spot
    this.mesh.position.copy(this.at).addScaledVector(this.fwd, -2.6 * s).setY(this.y);
    this.mesh.quaternion.setFromUnitVectors(ZP, this.fwd);
    if (this.landed >= 0) this.mesh.scale.setScalar(s * Math.max(0.01, 1 - Math.max(0, this.t - this.landed - 0.8) / 0.4));
  }

  dispose(): void {
    drop(this.mesh);
  }
}

// ---------------------------------------------------------------------------------------------- the arsenal

/** a ring of rifles round him, every one aimed at the target, firing on full auto */
export class FirearmRing implements Projectile {
  done = false;
  private t = 0;
  private fireT = 0;
  private rifles: PropMesh[] = [];

  constructor(private g: Game, readonly owner: Fighter, private aim: () => Fighter | null, readonly dur = 1.6, readonly dmg = 4, readonly n = 12) {
    for (let i = 0; i < n; i++) {
      const m = prop(g, 'rifle', 1);
      this.rifles.push(m);
    }
    this.place();
    for (const m of this.rifles) dreamRipple(g, m.position, 0.6);
    g.sfx.play('charge', owner.center(), 0.5);
  }

  private place(): void {
    const c = this.owner.center();
    const t = this.aim();
    this.rifles.forEach((m, i) => {
      const a = (i / this.n) * Math.PI * 2 + this.t * 0.4;
      m.position.set(c.x + Math.cos(a) * 1.9, c.y + 0.4 + Math.sin(a * 2 + this.t) * 0.25, c.z + Math.sin(a) * 1.9);
      const to = t ? t.center() : _v.copy(m.position).addScaledVector(this.owner.forward(), 5);
      m.quaternion.setFromUnitVectors(ZP, _w.subVectors(to, m.position).normalize());
    });
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    this.place();
    const t = this.aim();
    if (this.t > 0.2 && this.t < this.dur && t && !t.dead) {
      this.fireT -= dt;
      while (this.fireT <= 0) {
        this.fireT += 0.032;
        const m = this.rifles[Math.floor(Math.random() * this.rifles.length)];
        const from = _v.set(0, 0, RIFLE_MUZZLE).applyQuaternion(m.quaternion).add(m.position).clone();
        const aimAt = t.center().add(_w.set((Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.9));
        const d = aimAt.clone().sub(from);
        const len = d.length();
        d.divideScalar(len);
        const hit = raycastVoxels(g.engine.world, from.x, from.y, from.z, d.x, d.y, d.z, len);
        const end = hit ? from.clone().addScaledVector(d, hit.dist) : aimAt;
        // the tracer
        g.engine.glow.spawn({ x: (from.x + end.x) / 2, y: (from.y + end.y) / 2, z: (from.z + end.z) / 2, vx: d.x * 0.01, vy: d.y * 0.01, vz: d.z * 0.01, size: 0.06, sizeEnd: 0.04, life: 0.05, r: 1, g: 0.85, b: 0.5, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: Math.min(400, end.distanceTo(from) * 60) });
        g.engine.glow.spawn({ x: from.x, y: from.y, z: from.z, size: 0.18, sizeEnd: 0.04, life: 0.05, r: 1, g: 0.8, b: 0.4, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
        if (hit) g.engine.destruction.carve(new SphereShape(end, 0.16, 0.8), { mode: 'smash', power: 120, dust: 0.15 });
        else if (aimAt.distanceTo(t.center()) < t.def.radius + 0.35) g.damage(t, this.dmg, this.owner, d, { knock: 0.6, quiet: true, hitstop: 0 });
        if (Math.random() < 0.15) g.sfx.play('gunshot', from, 0.25);
      }
    }
    if (this.t > this.dur + 0.3) this.done = true;
  }

  render(): void {
    if (this.t > this.dur) for (const m of this.rifles) m.scale.setScalar(Math.max(0.01, 1 - (this.t - this.dur) / 0.3));
  }

  dispose(): void {
    for (const m of this.rifles) drop(m);
  }
}

interface Missile { pos: THREE.Vector3; vel: THREE.Vector3; mesh: PropMesh; t: number; delay: number; live: boolean }

/** a volley of missiles: up out of the air round him, then turning onto the target */
export class MissileSalvo implements Projectile {
  done = false;
  private t = 0;
  private ms: Missile[] = [];

  constructor(private g: Game, readonly owner: Fighter, readonly target: Fighter, readonly n = 8, readonly dmg = 22) {
    const c = owner.center();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const pos = c.clone().add(_v.set(Math.cos(a) * 1.6, 0.8 + (i % 2) * 0.5, Math.sin(a) * 1.6));
      const mesh = prop(g, 'missile', 1);
      mesh.visible = false;
      this.ms.push({ pos, vel: new THREE.Vector3(Math.cos(a) * 3, 14, Math.sin(a) * 3), mesh, t: 0, delay: i * 0.07, live: true });
    }
  }

  private explode(m: Missile, g: Game): void {
    m.live = false;
    m.mesh.visible = false;
    for (const e of g.enemiesOf(this.owner)) {
      if (e.dead || e.center().distanceTo(m.pos) > 2 + e.def.radius) continue;
      g.damage(e, this.dmg, this.owner, _v.subVectors(e.pos, m.pos).setY(0).normalize().clone(), { knock: 8, launch: 3, heavy: true, hitstop: 0.05 });
    }
    g.engine.destruction.carve(new SphereShape(m.pos.clone(), 1.5, 0.8), { mode: 'explode', power: 700, impulse: 10, dust: 0.7 });
    g.groundImpact(m.pos.clone(), 1.8, 500, '#E0703A', this.owner);
    for (let i = 0; i < 10; i++) g.engine.glow.spawn({ x: m.pos.x, y: m.pos.y, z: m.pos.z, vx: (Math.random() - 0.5) * 8, vy: Math.random() * 6, vz: (Math.random() - 0.5) * 8, size: 0.7, sizeEnd: 0.1, life: 0.35, r: 1, g: 0.6, b: 0.2, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, drag: 2 });
    g.sfx.play('explode', m.pos, 0.6);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    let live = 0;
    for (const m of this.ms) {
      if (!m.live) continue;
      live++;
      if (this.t < m.delay) continue;
      if (!m.mesh.visible) {
        m.mesh.visible = true;
        dreamRipple(g, m.pos, 0.7);
      }
      m.t += dt;
      // a climb, then the turn onto the target
      if (m.t > 0.35 && !this.target.dead) {
        const want = _v.subVectors(this.target.center(), m.pos).normalize().multiplyScalar(30);
        m.vel.lerp(want, Math.min(1, dt * 4));
      }
      const sp = m.vel.length();
      const d = _w.copy(m.vel).normalize();
      const hit = raycastVoxels(g.engine.world, m.pos.x, m.pos.y, m.pos.z, d.x, d.y, d.z, sp * dt + 0.3);
      m.pos.addScaledVector(m.vel, dt);
      if (Math.random() < 0.6) g.engine.dust.spawn({ x: m.pos.x, y: m.pos.y, z: m.pos.z, vx: 0, vy: 0.3, vz: 0, size: 0.25, sizeEnd: 0.9, life: 0.7, r: 0.8, g: 0.8, b: 0.78, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF });
      if (hit || (!this.target.dead && m.pos.distanceTo(this.target.center()) < 0.9) || m.t > 3) this.explode(m, g);
    }
    if (live === 0 && this.t > 0.5) this.done = true;
  }

  render(): void {
    for (const m of this.ms) {
      if (!m.live) continue;
      m.mesh.position.copy(m.pos);
      m.mesh.quaternion.setFromUnitVectors(ZP, _v.copy(m.vel).normalize());
    }
  }

  reject(p: THREE.Vector3, radius: number): boolean {
    let any = false;
    for (const m of this.ms) if (m.live && m.pos.distanceTo(p) < radius) { m.live = false; m.mesh.visible = false; any = true; }
    return any;
  }

  dispose(): void {
    for (const m of this.ms) drop(m.mesh);
  }
}

// ---------------------------------------------------------------------------------------------- water and the crevice

/**
 * A cube of water round a body, up in the air: it is held in the middle (no walking out, no jumping), it drowns.
 * `crevice()`: the ground splits under it, the cube drops in, the crack seals over — buried, until it breaks out.
 */
export class WaterCube implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.Mesh;
  private mat: WaterMaterial;
  readonly center = new THREE.Vector3();
  state: 'held' | 'sinking' | 'buried' = 'held';
  private stateT = 0;
  private sealY = 0;
  private sealBox: [number, number, number, number, number, number] | null = null;
  private wasRooted: boolean;

  constructor(private g: Game, readonly owner: Fighter, readonly target: Fighter, readonly dur = 5, readonly dps = 8, readonly buryFor = 4) {
    this.center.copy(target.center()).add(_v.set(0, 1.2, 0));
    this.mat = waterMaterial({ alpha: 0.72, flow: 0.8, foam: 0.4 });
    this.mesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 2.4), this.mat);
    this.mesh.renderOrder = 2;
    g.engine.gr.scene.add(this.mesh);
    this.wasRooted = target.rooted;
    dreamRipple(g, this.center, 2.4);
    g.sfx.play('splash', this.center, 0.8);
  }

  /** the crevice: true when it took */
  crevice(): boolean {
    if (this.state !== 'held' || this.target.dead) return false;
    const g = this.g;
    this.state = 'sinking';
    this.stateT = 0;
    const gy = floorAt(g, this.center);
    // the split: a slot opened in the ground under the cube
    const slot = new THREE.Vector3(this.center.x, gy - 2.6, this.center.z);
    g.engine.destruction.carve(new BoxShape(slot, new THREE.Vector3(1.7, 2.8, 1.7)), { mode: 'smash', power: 3000, impulse: 6, dust: 0.8 });
    this.sealY = gy;
    const w = g.engine.world, vs = w.vs;
    this.sealBox = [Math.floor((this.center.x - 1.9) / vs), Math.floor((gy - 0.7) / vs), Math.floor((this.center.z - 1.9) / vs), Math.floor((this.center.x + 1.9) / vs), Math.floor((gy - 0.05) / vs), Math.floor((this.center.z + 1.9) / vs)];
    stoneDust(g, new THREE.Vector3(this.center.x, gy, this.center.z), 18, 2.5);
    g.sfx.play('crumble', slot, 1);
    return true;
  }

  private hold(): void {
    const e = this.target;
    e.body.pos.set(this.center.x, this.center.y - e.def.height * 0.5, this.center.z);
    e.body.vel.set(0, 0, 0);
    e.push.set(0, 0, 0);
    e.rooted = true;
    e.wetT = Math.max(e.wetT, 2);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    this.stateT += dt;
    const e = this.target;
    if (e.dead || this.owner.dead) {
      this.finish(false);
      return;
    }
    if (this.state === 'held') {
      this.hold();
      g.drain(e, this.dps * dt, this.owner);
      if (Math.random() < dt * 10) g.engine.glow.spawn({ x: this.center.x + (Math.random() - 0.5) * 2, y: this.center.y - 1, z: this.center.z + (Math.random() - 0.5) * 2, vx: 0, vy: 1.5, vz: 0, size: 0.08, sizeEnd: 0.14, life: 0.6, r: 0.8, g: 0.95, b: 1, alpha: 0.8, alphaEnd: 0, tex: TEX_RING });
      if (this.t > this.dur) this.finish(false);
      return;
    }
    if (this.state === 'sinking') {
      this.center.y += (this.sealY - 2.4 - this.center.y) * Math.min(1, dt * 7);
      this.hold();
      if (this.stateT > 0.6) {
        // sealed over: stone filled back across the top of the crack
        if (this.sealBox) {
          const [x0, y0, z0, x1, y1, z1] = this.sealBox;
          fillVox(g, x0, y0, z0, x1, y1, z1, g.engine.world.mats.id('stone'));
        }
        this.state = 'buried';
        this.stateT = 0;
        g.sfx.play('crumble', this.center, 0.8);
      }
      return;
    }
    // buried: it digs its way out (it struggles: a hit lands while it is under, it comes out sooner)
    this.hold();
    e.hitstun = Math.max(e.hitstun, 0.2);
    g.drain(e, (this.dps + 2) * dt, this.owner);
    if (this.stateT > this.buryFor) this.finish(true);
  }

  private finish(breakOut: boolean): void {
    if (this.done) return;
    this.done = true;
    const e = this.target;
    e.rooted = this.wasRooted;
    if (breakOut && !e.dead) {
      // it bursts out through the seal and lands beside the crack
      const g = this.g;
      g.engine.destruction.carve(new BoxShape(new THREE.Vector3(this.center.x, this.sealY - 0.3, this.center.z), new THREE.Vector3(1.4, 2.4, 1.4)), { mode: 'smash', power: 3000, impulse: 10, dust: 0.8 });
      const a = Math.random() * Math.PI * 2;
      e.body.pos.set(this.center.x + Math.cos(a) * 2.6, this.sealY + 0.3, this.center.z + Math.sin(a) * 2.6);
      e.body.prev.copy(e.body.pos);
      e.body.vel.set(0, 8, 0);
      stoneDust(g, new THREE.Vector3(this.center.x, this.sealY, this.center.z), 16, 2);
    }
  }

  render(): void {
    this.mat.uniforms.uTime.value = this.t;
    this.mesh.position.copy(this.center);
    this.mesh.visible = this.state !== 'buried';
    this.mat.uniforms.uAlpha.value = Math.min(1, this.t / 0.2) * (this.state === 'held' ? 1 : 0.8);
  }

  reject(p: THREE.Vector3, radius: number, _by: Fighter, fields: boolean): boolean {
    if (!fields || p.distanceTo(this.center) > radius + 1.4 || this.state !== 'held') return false;
    this.finish(false);
    return true;
  }

  dispose(): void {
    if (!this.done) this.finish(false);
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}

// ---------------------------------------------------------------------------------------------- cosmic

/** a meteor out of the sky onto a point: its shadow grows, it lands, it craters everything */
export class Meteor implements Projectile {
  done = false;
  private t = 0;
  private landed = -1;
  private mesh: PropMesh;
  private shadow: THREE.Mesh;
  private from: THREE.Vector3;
  private pos = new THREE.Vector3();

  constructor(private g: Game, readonly owner: Fighter, readonly at: THREE.Vector3, readonly dmg = 180, readonly fall = 3) {
    this.mesh = prop(g, 'meteor', 1);
    const side = _v.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
    this.from = at.clone().addScaledVector(side, 60).add(_w.set(0, 170, 0));
    this.pos.copy(this.from);
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(METEOR_R * 1.4, 40), new THREE.MeshBasicMaterial({ color: '#141418', transparent: true, opacity: 0, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.set(at.x, at.y + 0.06, at.z);
    this.shadow.renderOrder = 2;
    g.engine.gr.scene.add(this.shadow);
    dreamRipple(g, this.from, 20);
    g.sfx.play('roarBig', at, 0.6);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.landed >= 0) {
      if (this.t - this.landed > 2) this.done = true;
      return;
    }
    const k = Math.min(1, this.t / this.fall);
    const e = k * k;
    this.pos.lerpVectors(this.from, this.at, e);
    // fire and smoke streaming off it
    for (let i = 0; i < 3; i++) {
      g.engine.glow.spawn({ x: this.pos.x + (Math.random() - 0.5) * 8, y: this.pos.y + (Math.random() - 0.5) * 8, z: this.pos.z + (Math.random() - 0.5) * 8, vx: 0, vy: 8, vz: 0, size: 4, sizeEnd: 1, life: 0.5, r: 1, g: 0.55, b: 0.15, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
      g.engine.dust.spawn({ x: this.pos.x + (Math.random() - 0.5) * 10, y: this.pos.y + 4, z: this.pos.z + (Math.random() - 0.5) * 10, vx: 0, vy: 4, vz: 0, size: 6, sizeEnd: 14, life: 2.5, r: 0.35, g: 0.32, b: 0.3, alpha: 0.45, alphaEnd: 0, tex: TEX_PUFF });
    }
    if (k >= 1) {
      this.landed = this.t;
      const R = 12;
      for (const f of g.fighters) {
        if (f.dead || f === this.owner || f.team === this.owner.team) continue;
        const d = f.pos.distanceTo(this.at);
        if (d > R + f.def.radius) continue;
        g.damage(f, this.dmg * Math.max(0.2, 1 - d / R), this.owner, _v.subVectors(f.pos, this.at).setY(0).normalize().clone(), { knock: 22, launch: 12, heavy: true, hitstop: 0.18, shake: 1 });
      }
      g.engine.destruction.carve(new SphereShape(this.at.clone(), 9, 0.6), { mode: 'explode', power: 4000, impulse: 20, dust: 1 });
      g.groundImpact(this.at.clone(), 10, 3000, '#B0A898', this.owner);
      if (g.player) g.shake(1.2);
      g.sfx.play('explode', this.at, 1.6);
      for (let i = 0; i < 40; i++) {
        const a = Math.random() * Math.PI * 2;
        g.engine.dust.spawn({ x: this.at.x, y: this.at.y + 1, z: this.at.z, vx: Math.cos(a) * 18, vy: 2 + Math.random() * 10, vz: Math.sin(a) * 18, size: 3, sizeEnd: 9, life: 2.4, r: 0.55, g: 0.5, b: 0.45, alpha: 0.6, alphaEnd: 0, tex: TEX_PUFF, drag: 1.4 });
      }
    }
  }

  render(): void {
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.set(this.t * 0.6, this.t * 0.3, 0);
    const k = Math.min(1, this.t / this.fall);
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = this.landed >= 0 ? 0 : 0.15 + 0.45 * k;
    this.shadow.scale.setScalar(0.4 + 0.6 * k);
    if (this.landed >= 0) this.mesh.scale.setScalar(Math.max(0.01, 1 - Math.max(0, this.t - this.landed - 1.2) / 0.8));
  }

  dispose(): void {
    drop(this.mesh);
    this.shadow.removeFromParent();
    this.shadow.geometry.dispose();
    (this.shadow.material as THREE.Material).dispose();
  }
}

const SPACE_VS = /* glsl */ `
varying vec3 vN;
varying vec3 vView;
varying vec3 vP;
void main() {
  vP = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vView = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const SPACE_FS = /* glsl */ `
uniform float uTime;
uniform float uAlpha;
varying vec3 vN;
varying vec3 vView;
varying vec3 vP;
float h(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
void main() {
  vec3 q = floor(vP * 26.0);
  float s = h(q);
  float star = step(0.985, s) * (0.6 + 0.4 * sin(uTime * 3.0 + s * 40.0));
  float fr = pow(1.0 - abs(dot(normalize(vN), vView)), 2.0);
  vec3 col = mix(vec3(0.02, 0.02, 0.06), vec3(0.08, 0.05, 0.2), fr) + vec3(star);
  col += vec3(0.5, 0.35, 0.9) * fr * 0.6;
  gl_FragColor = vec4(col, uAlpha * (0.82 + fr * 0.18));
}`;

/** a pocket of outer space round a point: inside, the blood boils (a steady drain), the body floats slow */
export class OuterSpace implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.Mesh;
  private mat: THREE.ShaderMaterial;

  constructor(private g: Game, readonly owner: Fighter, readonly center: THREE.Vector3, readonly r = 4, readonly dur = 6, readonly dps = 20) {
    this.mat = new THREE.ShaderMaterial({ vertexShader: SPACE_VS, fragmentShader: SPACE_FS, uniforms: { uTime: { value: 0 }, uAlpha: { value: 0 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), this.mat);
    this.mesh.position.copy(center);
    this.mesh.scale.setScalar(r);
    this.mesh.renderOrder = 3;
    g.engine.gr.scene.add(this.mesh);
    dreamRipple(g, center, r * 2);
    g.sfx.play('beam', center, 0.6);
  }

  inside(p: THREE.Vector3): boolean {
    return p.distanceTo(this.center) < this.r;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    for (const e of g.enemiesOf(this.owner)) {
      if (e.dead || !this.inside(e.center())) continue;
      g.drain(e, this.dps * dt, this.owner);
      e.slow(0.55, 0.3);
      // weightless: the fall slows to a drift
      if (e.body.vel.y < -1) e.body.vel.y *= Math.exp(-6 * dt);
      if (Math.random() < dt * 8) {
        const c = e.center();
        g.engine.glow.spawn({ x: c.x + (Math.random() - 0.5) * 0.6, y: c.y + (Math.random() - 0.5) * 0.8, z: c.z + (Math.random() - 0.5) * 0.6, vx: 0, vy: 0.8, vz: 0, size: 0.1, sizeEnd: 0.02, life: 0.6, r: 0.8, g: 0.1, b: 0.12, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
      }
    }
    if (this.t > this.dur || this.owner.dead) this.done = true;
  }

  render(): void {
    this.mat.uniforms.uTime.value = this.t;
    this.mat.uniforms.uAlpha.value = Math.min(1, this.t / 0.4) * Math.min(1, (this.dur - this.t) / 0.6);
  }

  reject(p: THREE.Vector3, radius: number, _by: Fighter, fields: boolean): boolean {
    if (!fields || p.distanceTo(this.center) > radius + this.r) return false;
    this.done = true;
    return true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}

// ---------------------------------------------------------------------------------------------- defences

/** the bladed dome over him: plates and blades; whoever is right against it is cut */
export class BladedDome implements Projectile {
  done = false;
  private t = 0;
  private tick = 0;
  private mesh: PropMesh;

  constructor(private g: Game, readonly owner: Fighter, readonly dur = 3, readonly dmg = 10) {
    this.mesh = prop(g, 'dome', 1);
    dreamRipple(g, owner.center(), 3);
    g.sfx.play('ting', owner.center(), 0.8);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if ((this.tick -= dt) <= 0) {
      this.tick = 0.3;
      for (const e of g.enemiesOf(this.owner)) {
        if (e.dead || e.pos.distanceTo(this.owner.pos) > DOME_R + e.def.radius + 0.5) continue;
        g.damage(e, this.dmg, this.owner, _v.subVectors(e.pos, this.owner.pos).setY(0).normalize().clone(), { knock: 6, hitstop: 0.03 });
      }
    }
    if (this.t > this.dur || this.owner.dead) this.done = true;
  }

  render(): void {
    this.mesh.position.copy(this.owner.pos);
    const k = Math.min(1, this.t / 0.15) * Math.max(0.01, Math.min(1, (this.dur - this.t) / 0.25));
    this.mesh.scale.set(k, k, k);
  }

  dispose(): void {
    drop(this.mesh);
  }
}

/** a steel bar standing up between him and a blow, for a moment */
export class MetalBarBlock implements Projectile {
  done = false;
  private t = 0;
  private mesh: PropMesh;

  constructor(private g: Game, readonly at: THREE.Vector3, readonly dir: THREE.Vector3) {
    this.mesh = prop(g, 'bar', 0.8);
    this.mesh.position.copy(at);
    // upright, across the blow
    this.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), UP).premultiply(new THREE.Quaternion().setFromAxisAngle(UP, Math.atan2(dir.x, dir.z)));
    dreamRipple(g, at, 1.2);
    for (let i = 0; i < 8; i++) g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, vx: (Math.random() - 0.5) * 6, vy: Math.random() * 4, vz: (Math.random() - 0.5) * 6, size: 0.1, sizeEnd: 0.02, life: 0.25, r: 1, g: 0.85, b: 0.5, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
    g.sfx.play('ting', at, 1);
  }

  update(dt: number): void {
    this.t += dt;
    if (this.t > 0.5) this.done = true;
  }

  render(): void {
    this.mesh.scale.setScalar(0.8 * Math.max(0.01, Math.min(1, (0.5 - this.t) / 0.15)));
  }

  dispose(): void {
    drop(this.mesh);
  }
}

// ---------------------------------------------------------------------------------------------- the fort

export interface Fort {
  center: THREE.Vector3;
  top: number;
  /** the pillars' voxel boxes (inclusive) */
  pillars: [number, number, number, number, number, number][];
  /** the platform's own voxels (packed x + sx·(y + sy·z)), only where there was air before */
  slab: Float64Array;
}

/**
 * The Stone Fort: the ground round him lifted on pillars. A stone platform `r` across the radius, `h` up, a low parapet
 * round its edge, pillars under it down to the ground; everyone standing on that ground is lifted onto it.
 */
export function raiseFort(g: Game, center: THREE.Vector3, r = 11, h = 6): Fort {
  const w = g.engine.world, vs = w.vs;
  const stone = w.mats.id('stone');
  const gy = floorAt(g, center);
  const top = gy + h;
  const cx = Math.floor(center.x / vs), cz = Math.floor(center.z / vs);
  const R = Math.round(r / vs);
  const y0 = Math.floor((top - 1) / vs), y1 = Math.floor(top / vs) - 1;
  const rim = Math.round(1.1 / vs);
  const slab: number[] = [];
  const claim = (x: number, ya: number, yb: number, z: number) => {
    for (let y = ya; y <= yb; y++) if (w.inBounds(x, y, z) && w.get(x, y, z) === 0) slab.push(x + w.sx * (y + w.sy * z));
    w.fillBox(x, ya, z, x + 1, yb + 1, z + 1, stone);
  };
  for (let dz = -R; dz <= R; dz++)
    for (let dx = -R; dx <= R; dx++) {
      const d = Math.hypot(dx, dz);
      if (d > R) continue;
      claim(cx + dx, y0, y1, cz + dz);
      // the parapet round the rim, with gaps
      if (d > R - 2.5 && Math.sin(Math.atan2(dz, dx) * 10) > -0.4) claim(cx + dx, y1 + 1, y1 + rim, cz + dz);
    }
  // the pillars: a ring and a cross under it
  const pillars: Fort['pillars'] = [];
  const pw = Math.round(0.6 / vs);
  const gyv = Math.floor(gy / vs);
  const spots: [number, number][] = [[0, 0]];
  for (let i = 0; i < 10; i++) spots.push([Math.cos((i / 10) * Math.PI * 2) * (r - 1.6), Math.sin((i / 10) * Math.PI * 2) * (r - 1.6)]);
  for (let i = 0; i < 4; i++) spots.push([Math.cos((i / 4) * Math.PI * 2 + 0.4) * r * 0.5, Math.sin((i / 4) * Math.PI * 2 + 0.4) * r * 0.5]);
  for (const [px, pz] of spots) {
    const x = cx + Math.round(px / vs), z = cz + Math.round(pz / vs);
    const box: [number, number, number, number, number, number] = [x - pw, gyv, z - pw, x + pw, y0 - 1, z + pw];
    fillVox(g, ...box, stone);
    pillars.push(box);
  }
  g.engine.physics.invalidateBox(cx - R, y0, cz - R, cx + R, y1 + rim, cz + R);
  // everyone on that ground goes up with it
  for (const f of g.fighters) {
    // (anyone between the ground and the new floor would be left inside the stone)
    if (f.dead || Math.hypot(f.pos.x - center.x, f.pos.z - center.z) > r - 0.5 || f.pos.y < gy - 1 || f.pos.y > top + 0.3) continue;
    f.body.pos.y = top + 0.05;
    f.body.prev.copy(f.body.pos);
    f.body.vel.y = 0;
  }
  dreamRipple(g, new THREE.Vector3(center.x, top, center.z), r * 1.6);
  stoneDust(g, new THREE.Vector3(center.x, gy, center.z), 40, r);
  g.sfx.play('crumble', center, 1.6);
  return { center: new THREE.Vector3(center.x, gy, center.z), top, pillars, slab: new Float64Array(slab) };
}

/**
 * The fort's pillars go and it comes down. Its platform falls as pieces even where it fused with a building (the
 * integrity search would rightly call that held): what he imagined goes, what was there before stays.
 */
export function crumbleFort(g: Game, fort: Fort): void {
  const w = g.engine.world, vs = w.vs;
  for (const [x0, y0, z0, x1, y1, z1] of fort.pillars) {
    const c = new THREE.Vector3(((x0 + x1 + 1) / 2) * vs, ((y0 + y1 + 1) / 2) * vs, ((z0 + z1 + 1) / 2) * vs);
    g.engine.destruction.carve(new BoxShape(c, new THREE.Vector3(((x1 - x0 + 1) / 2) * vs + 0.05, ((y1 - y0 + 1) / 2) * vs + 0.05, ((z1 - z0 + 1) / 2) * vs + 0.05)), { mode: 'smash', power: 5000, impulse: 4, dust: 0.6, noCollapse: true });
  }
  const stone = w.mats.id('stone');
  const sx = w.sx, sy = w.sy, sxy = sx * sy;
  const keep: number[] = [];
  let minX = sx, minY = sy, minZ = w.sz, maxX = -1, maxY = -1, maxZ = -1;
  for (let i = 0; i < fort.slab.length; i++) {
    const key = fort.slab[i];
    const x = key % sx, y = Math.floor(key / sx) % sy, z = Math.floor(key / sxy);
    if (w.get(x, y, z) !== stone) continue;
    keep.push(key);
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  }
  if (keep.length > 0) g.engine.fragments.spawn({ voxels: new Float64Array(keep), minX, minY, minZ, maxX, maxY, maxZ }, { vel: new THREE.Vector3(0, -1, 0), angVel: new THREE.Vector3((Math.random() - 0.5) * 0.4, 0, (Math.random() - 0.5) * 0.4) });
}
