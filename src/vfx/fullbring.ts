// Lost Agent Ichigo's effects (docs/kits/ichigo.md §4 Lost Agent): the manji blast — Tensa Zangetsu's guard punched
// off the badge as a spinning disc of black reiatsu outlined in crimson, as strong as it has blades (six at most; each
// shot in a row loses one; under three it breaks on the first thing it touches) — and Bringer Light's green flicker at
// the feet.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { PropMesh } from '../game/characterFactory';
import { SphereShape } from '../destruction/shapes';
import { fbGuard } from '../chars/ichigoFullbring';
import { TEX_GLOW, TEX_STREAK } from './sprites';

const _v = new THREE.Vector3();
const _m = new THREE.Matrix4();

export const FB_CRIMSON = '#D02A3A';
export const BRINGER_GREEN = '#7CFF6B';

/** Bringer Light: the green flicker at the feet that comes before every burst of speed. */
export function bringerLight(g: Game, at: THREE.Vector3, n = 10): void {
  const c = new THREE.Color(BRINGER_GREEN);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, r = 0.2 + Math.random() * 0.5;
    g.engine.glow.spawn({ x: at.x + Math.cos(a) * r, y: at.y + 0.05, z: at.z + Math.sin(a) * r, vx: Math.cos(a) * 1.5, vy: 0.6 + Math.random() * 1.2, vz: Math.sin(a) * 1.5, size: 0.12, sizeEnd: 0.03, life: 0.3, r: c.r, g: c.g, b: c.b, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, drag: 2 });
  }
}

/**
 * The manji blast: the black manji spinning out flat toward the target. `blades` (1-6) sets its size and bite; under
 * three blades it shatters on the first thing it touches. It cuts what it crosses.
 */
export class ManjiBlast implements Projectile {
  done = false;
  readonly owner: Fighter;
  private mesh: PropMesh;
  private pos: THREE.Vector3;
  private t = 0;
  private dist = 0;
  private spin = 0;
  private hits = new Set<number>();
  private carveT = 0;
  private radius: number;

  constructor(private g: Game, owner: Fighter, from: THREE.Vector3, readonly dir: THREE.Vector3, readonly o: { blades: number; damage: number; speed: number; range: number; scale: number }) {
    this.owner = owner;
    this.pos = from.clone();
    this.mesh = new PropMesh(fbGuard());
    this.radius = 0.32 * o.scale * (0.6 + o.blades / 10);
    this.mesh.scale.setScalar(o.scale * (0.6 + o.blades / 10));
    g.engine.gr.scene.add(this.mesh);
    this.place();
  }

  private place(): void {
    // the disc faces where it flies, spinning about that axis
    _m.lookAt(new THREE.Vector3(0, 0, 0), this.dir, new THREE.Vector3(0, 1, 0));
    this.mesh.quaternion.setFromRotationMatrix(_m);
    this.mesh.rotateZ(this.spin);
    this.mesh.rotateY(Math.PI);
    this.mesh.position.copy(this.pos);
  }

  update(dt: number, g: Game): void {
    if (this.done) return;
    this.t += dt;
    const step = this.o.speed * dt;
    this.pos.addScaledVector(this.dir, step);
    this.dist += step;
    this.spin += dt * 26;
    this.place();
    // the crimson edge flaring off it
    const c = new THREE.Color(FB_CRIMSON);
    for (let i = 0; i < 2; i++) {
      const a = this.spin + Math.random() * Math.PI * 2;
      const r = this.radius * 1.4;
      g.engine.glow.spawn({ x: this.pos.x + Math.cos(a) * r * Math.abs(this.dir.z), y: this.pos.y + Math.sin(a) * r, z: this.pos.z + Math.cos(a) * r * Math.abs(this.dir.x), vx: -this.dir.x * 3, vy: 0, vz: -this.dir.z * 3, size: 0.14, sizeEnd: 0.03, life: 0.25, r: c.r, g: c.g, b: c.b, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: 2 });
    }
    // it cuts what it crosses
    this.carveT -= dt;
    if (this.carveT <= 0) {
      this.carveT = 0.04;
      const r = g.engine.destruction.carve(new SphereShape(this.pos.clone(), this.radius * 1.3, 0.35), { mode: 'cut', power: 120 + this.o.blades * 40, dir: this.dir.clone(), dust: 0.4, sparks: [0.8, 0.15, 0.2] });
      if (r.removed > 0 && this.o.blades < 3) return this.burst(g);
    }
    for (const f of g.enemiesOf(this.owner)) {
      if (this.hits.has(f.id) || f.dead) continue;
      const c2 = f.center(_v);
      if (c2.distanceTo(this.pos) > this.radius * 1.6 + f.def.radius) continue;
      this.hits.add(f.id);
      g.damage(f, this.o.damage, this.owner, this.dir.clone(), { knock: 6 + this.o.blades * 2, launch: 2, heavy: this.o.blades >= 5, hitstop: 0.06, energy: true });
      g.sparks(c2, this.dir, FB_CRIMSON, 10);
      // a weak manji (under three blades) breaks on the first thing it hits
      if (this.o.blades < 3) return this.burst(g);
    }
    if (this.dist >= this.o.range) this.burst(g);
  }

  private burst(g: Game): void {
    if (this.done) return;
    this.done = true;
    const c = new THREE.Color(FB_CRIMSON);
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.5) * 2;
      const dark = i % 2 === 0;
      g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, vx: Math.cos(a) * 5, vy: e * 4, vz: Math.sin(a) * 5, size: dark ? 0.2 : 0.12, sizeEnd: 0.03, life: 0.3, r: dark ? 0.06 : c.r, g: dark ? 0.03 : c.g, b: dark ? 0.04 : c.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2, drag: 3 });
    }
    g.sfx.play('shatter', this.pos, 0.5);
  }

  /** an enemy rejection field undoes it */
  reject(at: THREE.Vector3, radius: number, by: Fighter): boolean {
    if (by === this.owner || this.pos.distanceTo(at) > radius) return false;
    this.burst(this.g);
    return true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
  }
}
