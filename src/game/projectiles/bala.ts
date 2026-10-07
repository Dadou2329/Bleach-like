// Bala: a compressed bullet of reiatsu flicked from the knuckles — red, fast, concussive. Twenty times
// quicker than a Cero and much weaker; it pops on the first wall or fighter it meets.
import * as THREE from 'three';
import type { Game, Projectile } from '../game';
import type { Fighter } from '../fighter';
import { SphereShape } from '../../destruction/shapes';
import { raycastVoxels } from '../../voxel/raycast';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from '../../vfx/sprites';

let geo: THREE.BufferGeometry | null = null;

export class BalaShot implements Projectile {
  done = false;
  readonly pos: THREE.Vector3;
  readonly dir: THREE.Vector3;
  private mesh: THREE.Mesh;
  private travelled = 0;

  constructor(private owner: Fighter, g: Game, origin: THREE.Vector3, dir: THREE.Vector3, readonly damage = 16, readonly speed = 70, readonly range = 60, readonly color = '#E0302A') {
    this.pos = origin.clone();
    this.dir = dir.clone().normalize();
    geo ??= new THREE.IcosahedronGeometry(0.22, 1);
    this.mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2.4), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.mesh.position.copy(this.pos);
    this.mesh.frustumCulled = false;
    g.engine.gr.scene.add(this.mesh);
  }

  update(dt: number, g: Game): void {
    const step = this.speed * dt;
    const hit = raycastVoxels(g.engine.world, this.pos.x, this.pos.y, this.pos.z, this.dir.x, this.dir.y, this.dir.z, step + 0.1);
    if (hit) {
      this.pos.addScaledVector(this.dir, hit.dist);
      this.pop(g, null);
      return;
    }
    for (const f of g.enemiesOf(this.owner)) {
      const cy = Math.max(f.pos.y + 0.2, Math.min(f.pos.y + f.def.height - 0.2, this.pos.y));
      if (Math.hypot(f.pos.x - this.pos.x, cy - this.pos.y, f.pos.z - this.pos.z) < f.def.radius + 0.35) {
        this.pop(g, f);
        return;
      }
    }
    this.pos.addScaledVector(this.dir, step);
    this.travelled += step;
    const c = new THREE.Color(this.color);
    g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, vx: -this.dir.x * 6, vy: -this.dir.y * 6, vz: -this.dir.z * 6, size: 0.4, sizeEnd: 0.05, life: 0.14, r: c.r, g: c.g, b: c.b, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
    if (this.travelled > this.range) this.pop(g, null);
  }

  private pop(g: Game, f: Fighter | null): void {
    if (this.done) return;
    this.done = true;
    const p = this.pos;
    if (f) g.damage(f, this.damage, this.owner, this.dir.clone(), { knock: 9, launch: 2, hitstop: 0.03, shake: 0.15 });
    g.engine.destruction.carve(new SphereShape(p.clone(), 0.75, 0.8), { mode: 'explode', power: 90, impulse: 10 });
    const c = new THREE.Color(this.color);
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.6, sizeEnd: 2.2, life: 0.2, r: c.r, g: c.g, b: c.b, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * 3, vy: Math.random() * 2, vz: Math.sin(a) * 3, size: 0.4, sizeEnd: 1.2, life: 0.6, r: 0.5, g: 0.47, b: 0.45, alpha: 0.45, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
    }
    g.sfx.play('impact', p, 0.6);
  }

  render(): void {
    this.mesh.position.copy(this.pos);
  }

  dispose(): void {
    this.mesh.removeFromParent();
    (this.mesh.material as THREE.Material).dispose();
  }
}
