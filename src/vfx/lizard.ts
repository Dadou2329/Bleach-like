// Hollowfied Ichigo's effects (docs/kits/ichigo.md §4 Hollowfied): the arm-maw — a worm that lunges out of the
// stump of the left arm, its round mouth ringed in teeth, bites what it reaches and drags it back — the white matter
// that wells into every wound (High-Speed Regeneration), and the husk cracking off in white flakes when Ichigo wins
// his body back.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { PropMesh } from '../game/characterFactory';
import { SphereShape } from '../destruction/shapes';
import { wormHead, wormSegment } from '../chars/ichigoLizard';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _Z = new THREE.Vector3(0, 0, 1);
const _UP = new THREE.Vector3(0, 1, 0);

/** White matter welling up out of the body (regeneration), or bursting off it (k > 1). */
export function whiteMatter(g: Game, f: Fighter, n = 24, k = 1): void {
  const c = f.center(_v);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, y = (Math.random() - 0.5) * 1.5;
    g.engine.glow.spawn({ x: c.x + Math.cos(a) * 0.32, y: c.y + y, z: c.z + Math.sin(a) * 0.32, vx: Math.cos(a) * 0.8 * k, vy: 0.6 + Math.random() * 1.2 * k, vz: Math.sin(a) * 0.8 * k, size: 0.12, sizeEnd: 0.04, life: 0.5 + Math.random() * 0.3, r: 1, g: 0.97, b: 0.97, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW, drag: 1.5 });
  }
  for (let i = 0; i < n / 3; i++) {
    const a = Math.random() * Math.PI * 2;
    g.engine.dust.spawn({ x: c.x + Math.cos(a) * 0.3, y: c.y + (Math.random() - 0.5) * 1.2, z: c.z + Math.sin(a) * 0.3, vx: Math.cos(a) * 0.6, vy: 0.9, vz: Math.sin(a) * 0.6, size: 0.35, sizeEnd: 0.9, life: 0.7, r: 0.95, g: 0.93, b: 0.94, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF });
  }
}

/** The husk cracking: white flakes and shards spraying off the shoulders (burst = the whole husk). */
export function huskCrack(g: Game, f: Fighter, burst = false): void {
  const c = f.center(_v);
  const n = burst ? 70 : 18;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, up = Math.random();
    const sp = (burst ? 6 : 2.5) + Math.random() * (burst ? 9 : 3);
    const dark = Math.random() < 0.18;
    g.engine.glow.spawn({
      x: c.x + Math.cos(a) * 0.25, y: c.y + 0.35 + (Math.random() - 0.5) * 0.5, z: c.z + Math.sin(a) * 0.25,
      vx: Math.cos(a) * sp * (1 - up * 0.4), vy: up * sp * 0.9, vz: Math.sin(a) * sp * (1 - up * 0.4),
      size: dark ? 0.08 : 0.06 + Math.random() * 0.06, sizeEnd: 0.03, life: 0.6 + Math.random() * 0.5,
      r: dark ? 0.5 : 0.98, g: dark ? 0.1 : 0.96, b: dark ? 0.14 : 0.95, alpha: 1, alphaEnd: 0.4, tex: TEX_GLOW, drag: 1, gravity: -9,
    });
  }
  if (burst) {
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2, up = Math.random();
      g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: Math.cos(a) * 12 * (1 - up * 0.5), vy: up * 10, vz: Math.sin(a) * 12 * (1 - up * 0.5), size: 0.3, sizeEnd: 0.05, life: 0.45, r: 0.12, g: 0, b: 0.02, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 3 });
    }
  }
  g.sfx.play(burst ? 'shatter' : 'crack', c, burst ? 1 : 0.8);
}

/**
 * The arm-maw: a worm of white flesh ringed in maroon that lunges out of the left shoulder's stump along a fixed
 * line (`reach` m at most), smashes through what is in the way, bites at the end, and drags what it bit back with it.
 */
export class WormMaw implements Projectile {
  done = false;
  readonly owner: Fighter;
  private head: PropMesh;
  private segs: PropMesh[] = [];
  private t = 0;
  private bit = false;
  private carveT = 0;
  private reach: number;
  private dir = new THREE.Vector3();
  private grabbed: Fighter | null = null;
  private static readonly OUT = 0.24;
  private static readonly HOLD = 0.14;
  private static readonly BACK = 0.36;

  constructor(private g: Game, owner: Fighter, private root: THREE.Object3D, target: THREE.Vector3, readonly o: { reach: number; damage: number }) {
    this.owner = owner;
    root.updateWorldMatrix(true, false);
    const from = root.getWorldPosition(new THREE.Vector3());
    this.dir.subVectors(target, from);
    this.reach = Math.min(o.reach, Math.max(1.5, this.dir.length() + 0.4));
    this.dir.normalize();
    this.head = new PropMesh(wormHead());
    this.head.scale.setScalar(1.7);
    g.engine.gr.scene.add(this.head);
    for (let i = 0; i < 14; i++) {
      const m = new PropMesh(wormSegment());
      m.scale.setScalar(1.35 - i * 0.012);
      g.engine.gr.scene.add(m);
      this.segs.push(m);
    }
    this.place(0);
    g.sfx.play('roar', from, 0.5);
  }

  /** current length (m) of the worm out of the stump */
  private length(): number {
    const { OUT, HOLD, BACK } = WormMaw;
    const t = this.t;
    if (t < OUT) {
      const k = t / OUT;
      return this.reach * (1 - (1 - k) * (1 - k));
    }
    if (t < OUT + HOLD) return this.reach;
    const k = Math.min(1, (t - OUT - HOLD) / BACK);
    return this.reach * (1 - k * k);
  }

  private place(len: number): void {
    this.root.updateWorldMatrix(true, false);
    const from = this.root.getWorldPosition(_v);
    const side = _w.crossVectors(this.dir, _UP);
    if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
    side.normalize();
    const n = this.segs.length;
    // the body snakes a little on its way out
    const wave = (u: number) => Math.sin(u * Math.PI * 2.2 - this.t * 18) * 0.16 * Math.sin(u * Math.PI);
    const at = (u: number, out: THREE.Vector3) => out.copy(from).addScaledVector(this.dir, len * u).addScaledVector(side, wave(u));
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = (i + 1) / n;
      at(u0, a);
      at(u1, b);
      const m = this.segs[i];
      m.visible = len > 0.15;
      m.position.copy(a).lerp(b, 0.5);
      const d = b.sub(a);
      if (d.lengthSq() > 1e-6) m.quaternion.setFromUnitVectors(_Z, d.normalize());
      // squash the rings together when it is short
      m.scale.z = Math.max(0.05, Math.min(1.35, (len / n) / 0.3));
    }
    at(1, a);
    this.head.position.copy(a);
    this.head.quaternion.setFromUnitVectors(_Z, this.dir);
    this.head.visible = len > 0.05;
  }

  update(dt: number, g: Game): void {
    if (this.done) return;
    this.t += dt;
    const len = this.length();
    this.place(len);
    const headP = this.head.position;
    // it smashes through what is in its way on the way out
    if (this.t < WormMaw.OUT) {
      this.carveT -= dt;
      if (this.carveT <= 0) {
        this.carveT = 0.03;
        g.engine.destruction.carve(new SphereShape(headP.clone(), 0.55, 0.35), { mode: 'smash', power: 260, impulse: 6, dust: 0.6 });
      }
    }
    // the bite, at full stretch
    if (!this.bit && this.t >= WormMaw.OUT * 0.85) {
      for (const o of g.enemiesOf(this.owner)) {
        if (o.dead) continue;
        const c = o.center(_v);
        if (c.distanceTo(headP) > 1.25 + o.def.radius) continue;
        this.bit = true;
        g.damage(o, this.o.damage, this.owner, this.dir.clone(), { knock: 2, hitstop: 0.12, shake: 0.4, heavy: true });
        g.sparks(c.clone(), this.dir, '#B04A5A', 14);
        g.sfx.play('hitHeavy', c, 1);
        if (!o.dead && (o.toughness ?? 0) < 1e6) this.grabbed = o;
        break;
      }
      if (this.t >= WormMaw.OUT) this.bit = true;
    }
    // what it bit comes back with it
    const o = this.grabbed;
    if (o && !o.dead) {
      o.hitstun = Math.max(o.hitstun, 0.25);
      const keep = this.owner.pos.distanceTo(o.pos) > 1.6;
      if (keep) {
        const p = headP.clone().addScaledVector(this.dir, 0.4);
        p.y = Math.max(o.pos.y, p.y - o.def.height * 0.5);
        o.body.pos.copy(p);
        o.body.prev.copy(p);
        o.body.vel.set(0, 0, 0);
      }
    }
    if (this.t >= WormMaw.OUT + WormMaw.HOLD + WormMaw.BACK) {
      this.done = true;
      if (o && !o.dead) o.hitstun = Math.max(o.hitstun, 0.45);
    }
  }

  dispose(): void {
    this.head.removeFromParent();
    for (const m of this.segs) m.removeFromParent();
  }
}
