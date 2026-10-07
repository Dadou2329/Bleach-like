// Hadō #31 Shakkahō: a ball of red fire flung from the palm. It bursts on the first wall or fighter it
// meets, a blast that blows a hole in whatever is there. Renji's Kidō is poor: fired again too soon it can
// go off in his own hand (`backfire`); with the full chant it is far bigger (and at point-blank range it
// burns him too).
import * as THREE from 'three';
import type { Game, Projectile } from '../game';
import type { Fighter } from '../fighter';
import { SphereShape } from '../../destruction/shapes';
import { raycastVoxels } from '../../voxel/raycast';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from '../../vfx/sprites';

export interface ShakkahoOpts {
  damage: number;
  speed: number;
  /** fireball radius (m) */
  size: number;
  /** blast radius (m) */
  blast: number;
  range?: number;
  /** goes off at once where it was made: a misfire in the caster's hand */
  backfire?: boolean;
  /** the blast burns its caster too when he stands inside it (the full chant at point-blank range) */
  scorch?: boolean;
}

let geo: THREE.BufferGeometry | null = null;

export class Shakkaho implements Projectile {
  done = false;
  readonly pos: THREE.Vector3;
  readonly dir: THREE.Vector3;
  private group = new THREE.Group();
  private core: THREE.Mesh;
  private shell: THREE.Mesh;
  private light: THREE.PointLight;
  private travelled = 0;
  private t = 0;

  constructor(private owner: Fighter, g: Game, origin: THREE.Vector3, dir: THREE.Vector3, readonly o: ShakkahoOpts) {
    this.pos = origin.clone();
    this.dir = dir.clone().normalize();
    geo ??= new THREE.IcosahedronGeometry(1, 2);
    const mat = (c: string, gain: number, op: number) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(gain), transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false });
    this.core = new THREE.Mesh(geo, mat('#FFC9A0', 2.2, 0.95));
    this.shell = new THREE.Mesh(geo, mat('#E3262E', 1.6, 0.55));
    this.core.scale.setScalar(o.size * 0.55);
    this.shell.scale.setScalar(o.size);
    this.light = new THREE.PointLight('#FF5A2A', 6 * o.size, 10 + o.size * 8, 1.6);
    this.group.add(this.core, this.shell, this.light);
    this.group.position.copy(this.pos);
    this.group.traverse((c) => (c.frustumCulled = false));
    this.core.renderOrder = this.shell.renderOrder = 7;
    g.engine.gr.scene.add(this.group);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.o.backfire) {
      this.burst(g, null, true);
      return;
    }
    const step = this.o.speed * dt;
    const hit = raycastVoxels(g.engine.world, this.pos.x, this.pos.y, this.pos.z, this.dir.x, this.dir.y, this.dir.z, step + this.o.size * 0.5);
    if (hit) {
      this.pos.addScaledVector(this.dir, hit.dist);
      this.burst(g, null, false);
      return;
    }
    for (const f of g.enemiesOf(this.owner)) {
      const cy = Math.max(f.pos.y + 0.2, Math.min(f.pos.y + f.def.height - 0.2, this.pos.y));
      if (Math.hypot(f.pos.x - this.pos.x, cy - this.pos.y, f.pos.z - this.pos.z) < f.def.radius + this.o.size * 0.8) {
        this.burst(g, f, false);
        return;
      }
    }
    this.pos.addScaledVector(this.dir, step);
    this.travelled += step;
    // flames peel off behind it, and a thin smoke
    const s = this.o.size;
    for (let i = 0; i < 2; i++) {
      const r = () => (Math.random() - 0.5) * s;
      g.engine.glow.spawn({ x: this.pos.x + r(), y: this.pos.y + r(), z: this.pos.z + r(), vx: -this.dir.x * 4, vy: 1.5, vz: -this.dir.z * 4, size: s * 1.4, sizeEnd: s * 0.3, life: 0.28, r: 1, g: 0.32 + Math.random() * 0.25, b: 0.12, alpha: 0.8, alphaEnd: 0, tex: TEX_PUFF });
    }
    g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, vx: -this.dir.x * 8, vy: -this.dir.y * 8, vz: -this.dir.z * 8, size: s * 0.9, sizeEnd: 0.05, life: 0.16, r: 1, g: 0.55, b: 0.3, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
    if (Math.random() < 0.4) g.engine.dust.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, vx: 0, vy: 0.8, vz: 0, size: s * 0.8, sizeEnd: s * 2.2, life: 0.8, r: 0.3, g: 0.27, b: 0.25, alpha: 0.35, alphaEnd: 0, tex: TEX_PUFF, drag: 1.5 });
    if (this.travelled > (this.o.range ?? 70)) this.burst(g, null, false);
  }

  render(): void {
    this.group.position.copy(this.pos);
    const k = 1 + Math.sin(this.t * 40) * 0.08;
    this.core.scale.setScalar(this.o.size * 0.55 * k);
    this.shell.scale.setScalar(this.o.size * (1.02 + Math.sin(this.t * 23 + 1) * 0.1));
    this.shell.rotation.set(this.t * 5, this.t * 7, 0);
  }

  private burst(g: Game, direct: Fighter | null, self: boolean): void {
    if (this.done) return;
    this.done = true;
    const p = this.pos;
    const R = this.o.blast;
    // everyone in the blast (the caster too, when it goes off in his hand or he is too close)
    for (const f of g.fighters) {
      if (f.dead) continue;
      const enemy = f.team !== this.owner.team && f !== this.owner;
      if (!enemy && !((self || this.o.scorch) && f === this.owner)) continue;
      const d = f === direct ? 0 : f.center().distanceTo(p);
      if (d > R + f.def.radius) continue;
      const k = 1 - Math.min(1, d / (R + f.def.radius)) * 0.6;
      const dir = new THREE.Vector3().subVectors(f.pos, p).setY(0);
      if (dir.lengthSq() < 1e-4) dir.copy(this.dir).setY(0).negate();
      dir.normalize();
      g.damage(f, this.o.damage * k * (f === this.owner ? 0.35 : 1), f === this.owner ? null : this.owner, dir, { knock: 6 + R * 4 * k, launch: 2 + R * k, heavy: R > 2, hitstop: 0.06, shake: 0.3 + R * 0.1 });
    }
    g.engine.destruction.carve(new SphereShape(p.clone(), R * 0.85, 0.85), { mode: 'explode', power: 70 + R * 50, impulse: 8 + R * 3 });
    g.sfx.play('explode', p, Math.min(2, 0.6 + R * 0.35));
    g.addRing(p.clone(), R * 3.2, '#FF6B3A', 0.4);
    g.shake(Math.min(0.6, 0.15 + R * 0.08));
    const glow = g.engine.glow, dust = g.engine.dust;
    glow.spawn({ x: p.x, y: p.y, z: p.z, size: R * 1.2, sizeEnd: R * 3.2, life: 0.25, r: 1, g: 0.75, b: 0.5, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2, e = Math.random() * 2 - 0.4;
      const v = (3 + Math.random() * 6) * (0.6 + R * 0.25);
      glow.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * v, vy: e * v * 0.6 + 1.5, vz: Math.sin(a) * v, size: R * 0.6, sizeEnd: R * 1.4, life: 0.35 + Math.random() * 0.25, r: 1, g: 0.3 + Math.random() * 0.35, b: 0.1, alpha: 0.85, alphaEnd: 0, tex: TEX_PUFF, drag: 3 });
    }
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2;
      glow.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * 9, vy: 3 + Math.random() * 7, vz: Math.sin(a) * 9, size: 0.12, sizeEnd: 0.03, life: 0.6 + Math.random() * 0.5, r: 1, g: 0.6, b: 0.25, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2.5, gravity: -9, drag: 1 });
    }
    // a misfire leaves its caster in a cloud of black smoke
    const smoke = self ? 0.16 : 0.3;
    for (let i = 0; i < (self ? 26 : 14); i++) {
      const a = Math.random() * Math.PI * 2;
      dust.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * 3, vy: 0.6 + Math.random() * 2, vz: Math.sin(a) * 3, size: R * 0.7, sizeEnd: R * 2.4, life: 1.2 + Math.random() * 0.8, r: smoke, g: smoke * 0.92, b: smoke * 0.86, alpha: 0.55, alphaEnd: 0, tex: TEX_PUFF, drag: 1.6 });
    }
    this.group.visible = false;
  }

  dispose(): void {
    this.group.removeFromParent();
    (this.core.material as THREE.Material).dispose();
    (this.shell.material as THREE.Material).dispose();
  }
}
