// Liltotto's Glutton (docs/kits/liltotto.md). GluttonMaw: her mouth pushed out into two jaws of her own flesh with
// jagged teeth, opened, lunged and snapped shut — what the jaws close on is erased (no rubble, a few crumbs), the bodies
// in them are returned to the kit. BiteArrow: the bow's toothed ball, biting a ball out of what it hits. SporkTrap: a
// fang cuff fired, unfolding into a bear trap in flight and snapping on what it meets. SpifeWhip: a cuff unrolled into a
// whip of fang links, swung up and cracked down along the ground. GoldenCrunch: a wave of gold along the ground to the
// target, a giant bear trap rising there and snapping shut on everyone inside — friend or foe. FullCourse: a house-sized
// maw rising round the target and closing over it. arterie(): Blut Arterie's red veins lighting down an arm.
import * as THREE from 'three';
import type { Fighter } from '../game/fighter';
import type { Game, Projectile } from '../game/game';
import { SphereShape } from '../destruction/shapes';
import { raycastVoxels } from '../voxel/raycast';
import { PropMesh } from '../game/characterFactory';
import { LINK_LEN, MAW_HALF, MAW_LEN, TRAP_R, liltottoProp } from '../chars/liltotto';
import { groundAt } from './iceArts';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

export const GOLD = '#FFC83A';
export const GOLD_EDGE = '#FFF0A6';
export const GOLD_DEEP = '#E59A1E';
export const ARTERIE = '#FF4A4A';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

const _e = new THREE.Euler();
const UP = new THREE.Vector3(0, 1, 0);
const C_GOLD = new THREE.Color(GOLD);
const C_EDGE = new THREE.Color(GOLD_EDGE);

function sockAt(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

/** crumbs: a few bits of what was eaten, falling */
function crumbs(g: Game, p: THREE.Vector3, r: number, n = 10): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    g.engine.dust.spawn({ x: p.x + Math.cos(a) * r * Math.random(), y: p.y + (Math.random() - 0.5) * r, z: p.z + Math.sin(a) * r * Math.random(), vx: Math.cos(a) * 1.5, vy: 1 + Math.random() * 2, vz: Math.sin(a) * 1.5, size: 0.12, sizeEnd: 0.05, life: 0.6, r: 0.55, g: 0.48, b: 0.42, alpha: 0.8, alphaEnd: 0, tex: TEX_PUFF, gravity: -9 });
  }
}

// ------------------------------------------------------------------ the maw

/**
 * The Glutton's maw. Held on a fighter (at the 'mouth' socket, facing where she faces) or set down in the world.
 * The kit drives `open` (0 shut … 1 gaping), `size` (×1 her own face's jaws … ×5 a house) and `reach` (how far the jaws
 * are thrust out ahead of her, m). bite() erases the jaws' volume and returns the bodies in it.
 */
export class GluttonMaw implements Projectile {
  done = false;
  open = 0;
  size = 1;
  reach = 0;
  /** a world anchor and direction (when not on a fighter) */
  at: THREE.Vector3 | null = null;
  dir = new THREE.Vector3(0, 0, 1);
  /** tipped up (radians): a maw rising out of the ground points at the sky */
  pitch = 0;
  /** on a fighter: the jaws point at this one (up or down to it) instead of level ahead */
  aim: Fighter | null = null;
  private upper: PropMesh;
  private lower: PropMesh;
  private group = new THREE.Group();
  private shown = 0;

  constructor(private g: Game, readonly owner: Fighter | null) {
    this.upper = new PropMesh(liltottoProp('maw.upper'));
    this.lower = new PropMesh(liltottoProp('maw.lower'));
    this.group.add(this.upper, this.lower);
    g.engine.gr.scene.add(this.group);
    this.group.visible = false;
  }

  /** the hinge in the world and the way the jaws point */
  frame(hinge: THREE.Vector3, fwd: THREE.Vector3): void {
    if (this.at) {
      hinge.copy(this.at);
      fwd.copy(this.dir).normalize();
      return;
    }
    const f = this.owner!;
    sockAt(f, 'mouth', hinge);
    fwd.set(Math.sin(f.yaw), 0, Math.cos(f.yaw));
    const a = this.aim;
    if (a && !a.dead) {
      // pitched up or down at the target, never more than 60°
      const to = a.center().sub(hinge);
      const flat = Math.hypot(to.x, to.z);
      const pitch = Math.max(-1.05, Math.min(1.05, Math.atan2(to.y, Math.max(0.5, flat))));
      fwd.multiplyScalar(Math.cos(pitch)).setY(Math.sin(pitch));
    }
    hinge.addScaledVector(fwd, this.reach);
  }

  /** the middle of the jaws' volume */
  center(out = new THREE.Vector3()): THREE.Vector3 {
    const fwd = new THREE.Vector3();
    this.frame(out, fwd);
    return out.addScaledVector(fwd, MAW_LEN * this.size * 0.55);
  }

  /** the jaws close: everything in their volume is erased; the bodies in it come back */
  bite(power = 2000): Fighter[] {
    const g = this.g;
    const c = this.center();
    const r = MAW_HALF * this.size * 1.05;
    g.engine.destruction.carve(new SphereShape(c.clone(), r, 0.7), { mode: 'erase', power, dust: 0 });
    crumbs(g, c, r, 6 + Math.round(this.size * 4));
    const out: Fighter[] = [];
    for (const e of g.fighters) {
      if (e === this.owner || e.dead) continue;
      if (e.center().distanceTo(c) <= r + e.def.radius + 0.25) out.push(e);
    }
    g.sfx.play('crumble', c, 0.8 + this.size * 0.2);
    g.sfx.play('hitHeavy', c, 0.6);
    return out;
  }

  update(): void {
    if (this.owner?.dead) this.done = true;
  }

  render(dt: number): void {
    const vis = this.open > 0.02 || this.shown > 0;
    this.shown = this.open > 0.02 ? 0.12 : Math.max(0, this.shown - dt);
    this.group.visible = vis;
    if (!vis) return;
    const hinge = _v, fwd = _w;
    this.frame(hinge, fwd);
    this.group.position.copy(hinge);
    _e.set(-this.pitch - Math.asin(Math.max(-1, Math.min(1, fwd.y))), Math.atan2(fwd.x, fwd.z), 0, 'YXZ');
    this.group.quaternion.setFromEuler(_e);
    this.group.scale.setScalar(this.size);
    this.upper.rotation.x = -this.open * 0.95;
    this.lower.rotation.x = this.open * 0.55;
  }

  dispose(): void {
    this.group.removeFromParent();
    this.upper.material.dispose();
    this.lower.material.dispose();
  }
}

// ------------------------------------------------------------------ the bow

/** The bow's toothed ball: it flies straight and bites a ball out of whatever it hits. */
export class BiteArrow implements Projectile {
  done = false;
  private pos: THREE.Vector3;
  private vel: THREE.Vector3;
  private t = 0;

  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, dir: THREE.Vector3, readonly dmg = 16, readonly onHit?: (f: Fighter) => void) {
    this.pos = from.clone();
    this.vel = dir.clone().normalize().multiplyScalar(52);
    g.sfx.play('arrow', from, 0.6);
  }

  private bite(p: THREE.Vector3): void {
    const g = this.g;
    this.done = true;
    g.engine.destruction.carve(new SphereShape(p.clone(), 0.85, 0.7), { mode: 'erase', power: 700, dust: 0 });
    crumbs(g, p, 0.8, 8);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * 4, vy: Math.sin(a) * 4, vz: 0, size: 0.14, sizeEnd: 0.03, life: 0.2, r: C_GOLD.r, g: C_GOLD.g, b: C_GOLD.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2 });
    }
    g.sfx.play('crumble', p, 0.6);
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
      g.damage(e, this.dmg, this.owner, d.clone(), { energy: true, knock: 3, hitstop: 0.04, color: GOLD });
      this.onHit?.(e);
      this.bite(c);
      return;
    }
    const hit = raycastVoxels(g.engine.world, this.pos.x, this.pos.y, this.pos.z, d.x, d.y, d.z, step);
    if (hit) {
      this.bite(this.pos.clone().addScaledVector(d, hit.dist));
      return;
    }
    this.pos.addScaledVector(this.vel, dt);
    g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, size: 0.32, sizeEnd: 0.12, life: 0.06, r: C_GOLD.r, g: C_GOLD.g, b: C_GOLD.b, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, vx: -this.vel.x * 0.1, vy: -this.vel.y * 0.1, vz: -this.vel.z * 0.1, size: 0.12, sizeEnd: 0.02, life: 0.12, r: C_EDGE.r, g: C_EDGE.g, b: C_EDGE.b, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
    if (this.t > 1.6) this.done = true;
  }

  reject(p: THREE.Vector3, radius: number): boolean {
    if (this.pos.distanceTo(p) > radius) return false;
    this.done = true;
    return true;
  }

  dispose(): void {}
}

// ------------------------------------------------------------------ the bear traps

/** a bear trap's meshes: the base ring and two jaws hinged on its bar */
class TrapMesh {
  readonly group = new THREE.Group();
  private base: PropMesh;
  private jawA: PropMesh;
  private jawB: PropMesh;

  constructor(g: Game) {
    this.base = new PropMesh(liltottoProp('trap.base'));
    this.jawA = new PropMesh(liltottoProp('trap.jaw'));
    this.jawB = new PropMesh(liltottoProp('trap.jaw'));
    this.jawB.rotation.y = Math.PI;
    const holderB = new THREE.Group();
    holderB.add(this.jawB);
    this.group.add(this.base, this.jawA, holderB);
    for (const m of [this.base, this.jawA, this.jawB]) m.castShadow = false;
    g.engine.gr.scene.add(this.group);
  }

  /** shut 0 (flat open) … 1 (the jaws up and met) */
  set(shut: number): void {
    const a = (Math.PI / 2) * shut;
    this.jawA.rotation.x = -a;
    (this.jawB.parent as THREE.Group).rotation.x = a;
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const m of [this.base, this.jawA, this.jawB]) m.material.dispose();
  }
}

/** Spork: a fang cuff fired that unfolds into a bear trap in flight and snaps on the first thing it meets. */
export class SporkTrap implements Projectile {
  done = false;
  private t = 0;
  private trap: TrapMesh;
  private pos: THREE.Vector3;
  private vel: THREE.Vector3;
  private caught: Fighter | null = null;
  private snapT = -1;
  private shut = 0;

  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, readonly target: Fighter | null, dir: THREE.Vector3, readonly dmg = 70, readonly onHit?: (f: Fighter) => void) {
    this.pos = from.clone();
    this.vel = dir.clone().normalize().multiplyScalar(40);
    this.trap = new TrapMesh(g);
    g.sfx.play('ting', from, 0.8);
  }

  private snap(): void {
    const g = this.g;
    this.snapT = 0;
    g.sfx.play('shatter', this.pos, 1);
    g.engine.destruction.carve(new SphereShape(this.pos.clone(), 1.5, 0.6), { mode: 'explode', power: 1000, impulse: 10, dust: 0.5 });
    for (const e of g.enemiesOf(this.owner)) {
      if (e.dead || e.center().distanceTo(this.pos) > 1.6 + e.def.radius) continue;
      g.damage(e, this.dmg, this.owner, _v.copy(this.vel).setY(0).normalize(), { energy: true, knock: 2, heavy: true, hitstop: 0.12, shake: 0.4, color: GOLD });
      e.hitstun = Math.max(e.hitstun, 1.2);
      e.slow(0.95, 1.2);
      this.caught = this.caught ?? e;
      this.onHit?.(e);
    }
    if (g.player && g.player.pos.distanceTo(this.pos) < 25) g.shake(0.3);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.snapT >= 0) {
      this.snapT += dt;
      this.shut = Math.min(1, this.snapT / 0.08);
      if (this.caught && !this.caught.dead) this.pos.copy(this.caught.center());
      if (this.snapT > 1.3) this.done = true;
      return;
    }
    const tg = this.target;
    if (tg && !tg.dead) this.vel.lerp(_v.subVectors(tg.center(), this.pos).normalize().multiplyScalar(40), Math.min(1, dt * 3));
    const step = this.vel.length() * dt;
    const d = _w.copy(this.vel).normalize();
    for (const e of g.enemiesOf(this.owner)) {
      if (!e.dead && e.center().distanceTo(this.pos) < e.def.radius + 1.0) {
        this.snap();
        return;
      }
    }
    const hit = raycastVoxels(g.engine.world, this.pos.x, this.pos.y, this.pos.z, d.x, d.y, d.z, step + 0.8);
    if (hit) {
      this.pos.addScaledVector(d, Math.max(0, hit.dist - 0.4));
      this.snap();
      return;
    }
    this.pos.addScaledVector(this.vel, dt);
    if (this.t > 2) this.snap();
  }

  render(): void {
    const unfold = Math.min(1, this.t / 0.18);
    this.trap.group.position.copy(this.pos);
    this.trap.group.quaternion.setFromUnitVectors(UP, _v.copy(this.vel).normalize().negate());
    this.trap.group.scale.setScalar(0.4 + 1.6 * unfold);
    this.trap.set(this.snapT >= 0 ? this.shut : 0.15 * (1 - unfold));
  }

  reject(p: THREE.Vector3, radius: number): boolean {
    if (this.snapT >= 0 || this.pos.distanceTo(p) > radius) return false;
    this.done = true;
    return true;
  }

  dispose(): void {
    this.trap.dispose();
  }
}

/**
 * Golden Crunch: a ridge of gold light runs along the ground to the target; there a giant bear trap rises and, half a
 * second later, snaps shut on everyone inside it — her own side too.
 */
export class GoldenCrunch implements Projectile {
  done = false;
  private t = 0;
  private wave: THREE.Vector3;
  private trap: TrapMesh | null = null;
  private trapT = -1;
  private snapped = false;
  private caught: Fighter[] = [];
  readonly r = 2.6;

  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, readonly to: THREE.Vector3, readonly dmg = 120, readonly onHit?: (f: Fighter) => void) {
    this.wave = from.clone();
    g.sfx.play('charge', from, 1);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.trapT < 0) {
      // the wave along the ground
      const d = _v.subVectors(this.to, this.wave).setY(0);
      const left = d.length();
      const step = 14 * dt;
      if (left <= step) {
        this.wave.copy(this.to);
        this.trapT = 0;
        this.trap = new TrapMesh(g);
        const gy = groundAt(g, this.to.x, this.to.y + 1.5, this.to.z, 10);
        this.to.y = gy ?? this.to.y;
        g.sfx.play('crumble', this.to, 1.2);
      } else this.wave.addScaledVector(d.normalize(), step);
      const gy = groundAt(g, this.wave.x, this.wave.y + 1.5, this.wave.z, 8) ?? this.wave.y;
      this.wave.y = gy;
      for (let i = 0; i < 4; i++) g.engine.glow.spawn({ x: this.wave.x + (Math.random() - 0.5) * 0.8, y: gy + 0.1, z: this.wave.z + (Math.random() - 0.5) * 0.8, vy: 2 + Math.random() * 2, size: 0.24, sizeEnd: 0.05, life: 0.4, r: C_GOLD.r, g: C_GOLD.g, b: C_GOLD.b, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
      if (Math.random() < 0.4) g.engine.dust.spawn({ x: this.wave.x, y: gy + 0.2, z: this.wave.z, vy: 1.5, size: 0.5, sizeEnd: 1.2, life: 0.6, r: 0.5, g: 0.45, b: 0.38, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF });
      return;
    }
    this.trapT += dt;
    if (!this.snapped && this.trapT >= 0.55) {
      this.snapped = true;
      const p = this.to.clone().setY(this.to.y + 0.8);
      g.engine.destruction.carve(new SphereShape(this.to.clone(), this.r * 0.8, 0.5), { mode: 'smash', power: 1400, impulse: 12, dust: 0.6 });
      // friend or foe: no one inside is spared but her
      for (const e of g.fighters) {
        if (e === this.owner || e.dead) continue;
        if (Math.hypot(e.pos.x - p.x, e.pos.z - p.z) > this.r + e.def.radius || Math.abs(e.pos.y - this.to.y) > 3) continue;
        g.damage(e, this.dmg, this.owner, UP.clone(), { energy: true, knock: 0, heavy: true, hitstop: 0.16, shake: 0.6, color: GOLD, unblockable: true });
        e.hitstun = Math.max(e.hitstun, 1.5);
        e.slow(0.95, 1.5);
        this.caught.push(e);
        this.onHit?.(e);
      }
      g.sfx.play('shatter', p, 1.4);
      g.sfx.play('explode', p, 0.9);
      if (g.player && g.player.pos.distanceTo(p) < 30) g.shake(0.5);
    }
    // the caught stay in its jaws until it opens; one thrown or blinked out of them is let go
    if (this.trapT < 1.6) this.caught = this.caught.filter((e) => !e.dead && Math.hypot(e.pos.x - this.to.x, e.pos.z - this.to.z) < this.r + 1.5);
    else this.caught.length = 0;
    for (const e of this.caught) {
      e.body.pos.x += (this.to.x - e.body.pos.x) * Math.min(1, dt * 6);
      e.body.pos.z += (this.to.z - e.body.pos.z) * Math.min(1, dt * 6);
    }
    if (this.trapT > 2.0) this.done = true;
  }

  render(): void {
    if (!this.trap) return;
    const t = this.trapT;
    const rise = Math.min(1, t / 0.3);
    this.trap.group.position.copy(this.to).setY(this.to.y - 0.4 + rise * 0.5);
    this.trap.group.quaternion.setFromAxisAngle(UP, Math.atan2(this.to.x - this.owner.pos.x, this.to.z - this.owner.pos.z));
    this.trap.group.scale.setScalar(this.r / TRAP_R * (0.6 + 0.4 * rise));
    this.trap.set(this.snapped ? Math.min(1, (t - 0.55) / 0.08) : 0.05);
    if (t > 1.6) this.trap.group.scale.multiplyScalar(Math.max(0.01, 1 - (t - 1.6) / 0.4));
  }

  dispose(): void {
    this.trap?.dispose();
  }
}

// ------------------------------------------------------------------ the whip

/**
 * Spife: a cuff unrolled into a whip of fang links off the wrist; swung up over her head, then cracked down along the
 * ground ahead — it gashes the ground on its line and slams whoever is under it.
 */
export class SpifeWhip implements Projectile {
  done = false;
  private t = 0;
  private links: PropMesh[] = [];
  private cracked = false;
  private pts: THREE.Vector3[] = [];

  constructor(private g: Game, readonly owner: Fighter, readonly wrist: () => THREE.Vector3, readonly reach = 9, readonly dmg = 46, readonly onHit?: (f: Fighter) => void) {
    const n = Math.ceil(reach / LINK_LEN / 1.6);
    for (let i = 0; i < n; i++) {
      const m = new PropMesh(liltottoProp('link'));
      m.castShadow = false;
      m.scale.setScalar(1.6);
      g.engine.gr.scene.add(m);
      this.links.push(m);
    }
    for (let i = 0; i <= n; i++) this.pts.push(new THREE.Vector3());
  }

  /** the whip's line at time t: out and up behind her (0-0.2 s), then down along the ground ahead (0.2-0.3 s) */
  private shape(): void {
    const f = this.owner;
    const w = this.wrist();
    const fwd = _v.set(Math.sin(f.yaw), 0, Math.cos(f.yaw));
    const t = this.t;
    const out = Math.min(1, t / 0.14);
    const down = Math.max(0, Math.min(1, (t - 0.18) / 0.12));
    const n = this.pts.length - 1;
    const gy = f.pos.y + 0.1;
    for (let i = 0; i <= n; i++) {
      const s = (i / n) * this.reach * out;
      // up over her head and back, then laid along the ground ahead
      const upP = w.clone().add(_w.set(0, s * 0.8, 0)).addScaledVector(fwd, -s * 0.45);
      const dnP = w.clone().addScaledVector(fwd, s);
      dnP.y = Math.max(gy, w.y - (s / this.reach) * (w.y - gy) * 1.4);
      this.pts[i].copy(upP).lerp(dnP, down);
    }
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    this.shape();
    if (!this.cracked && this.t >= 0.3) {
      this.cracked = true;
      const a = this.pts[0], b = this.pts[this.pts.length - 1];
      for (let i = 2; i < this.pts.length; i += 2) g.engine.destruction.carve(new SphereShape(this.pts[i].clone(), 0.55, 0.6), { mode: 'cut', power: 1200, dust: 0.4 });
      const d = _w.subVectors(b, a);
      const l2 = d.lengthSq();
      for (const e of g.enemiesOf(this.owner)) {
        if (e.dead) continue;
        const k = l2 > 0 ? Math.max(0, Math.min(1, _v.subVectors(e.center(), a).dot(d) / l2)) : 0;
        if (a.clone().addScaledVector(d, k).distanceTo(e.center()) > e.def.radius + 0.9) continue;
        g.damage(e, this.dmg, this.owner, d.clone().setY(0).normalize(), { energy: true, knock: 6, launch: -6, heavy: true, hitstop: 0.12, shake: 0.5, color: GOLD });
        this.onHit?.(e);
      }
      g.sfx.play('crack', b, 1.2);
      g.groundImpact(b.clone(), 1.6, 300, GOLD, this.owner);
    }
    if (this.t > 0.75 || this.owner.dead) this.done = true;
  }

  render(): void {
    const n = this.links.length;
    const fade = this.t > 0.55 ? Math.max(0, 1 - (this.t - 0.55) / 0.2) : 1;
    for (let i = 0; i < n; i++) {
      const a = this.pts[i], b = this.pts[i + 1];
      const m = this.links[i];
      m.visible = fade > 0.02 && a.distanceToSquared(b) > 1e-6;
      m.position.copy(a);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), _v.subVectors(b, a).normalize());
      m.scale.setScalar(1.6 * fade);
    }
  }

  dispose(): void {
    for (const m of this.links) {
      m.removeFromParent();
      m.material.dispose();
    }
  }
}

/** Blut Arterie: red veins lighting down an arm, from the shoulder to the knuckles. */
export function arterie(g: Game, f: Fighter, side: 'L' | 'R', k = 1): void {
  const c = new THREE.Color(ARTERIE);
  const bone = f.visual.rig.bone(`upperarm.${side}`);
  bone.updateWorldMatrix(true, false);
  const a = bone.getWorldPosition(new THREE.Vector3());
  const b = sockAt(f, side === 'R' ? 'palm.R' : 'palm.L', new THREE.Vector3());
  for (let i = 0; i < Math.round(6 * k); i++) {
    const p = a.clone().lerp(b, Math.random());
    p.add(_v.set((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1));
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6, vz: (Math.random() - 0.5) * 0.6, size: 0.07, sizeEnd: 0.02, life: 0.25, r: c.r, g: c.g, b: c.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2 });
  }
}


