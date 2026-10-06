// Garra de la Pantera: a dark-green crystal dart fired from Pantera's elbow blades. It flies fast with
// a slight homing pull, trails glints, and detonates on the first solid voxel or fighter it touches —
// one dart takes the top off a building.
import * as THREE from 'three';
import type { Game, Projectile } from '../game';
import type { Fighter } from '../fighter';
import { SphereShape } from '../../destruction/shapes';
import { raycastVoxels } from '../../voxel/raycast';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from '../../vfx/sprites';

export interface DartOpts {
  speed: number;
  damage: number;
  blast: number;
  power: number;
  range: number;
  /** turn rate toward the target (rad/s) */
  homing: number;
}

const _v = new THREE.Vector3();

let dartGeo: THREE.BufferGeometry | null = null;

export class GarraDart implements Projectile {
  done = false;
  readonly pos: THREE.Vector3;
  readonly dir: THREE.Vector3;
  private mesh: THREE.Mesh;
  private light: THREE.PointLight;
  private travelled = 0;
  private t = 0;
  private spin = Math.random() * 6;

  constructor(private g: Game, private owner: Fighter, origin: THREE.Vector3, dir: THREE.Vector3, private target: Fighter | null, readonly o: DartOpts) {
    this.pos = origin.clone();
    this.dir = dir.clone().normalize();
    dartGeo ??= (() => {
      // an uneven elongated octahedron: a cut crystal
      const geo = new THREE.OctahedronGeometry(1, 0);
      geo.scale(0.22, 0.22, 0.75);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * (0.8 + ((i * 37) % 7) / 14), p.getY(i), p.getZ(i));
      geo.computeVertexNormals();
      return geo;
    })();
    const mat = new THREE.MeshStandardMaterial({ color: '#1D5A43', emissive: '#2E8C67', emissiveIntensity: 1.6, roughness: 0.15, metalness: 0.3, flatShading: true });
    this.mesh = new THREE.Mesh(dartGeo, mat);
    this.light = new THREE.PointLight('#7FD8AE', 6, 7, 1.6);
    this.mesh.add(this.light);
    g.engine.gr.scene.add(this.mesh);
    this.place();
  }

  private place(): void {
    this.mesh.position.copy(this.pos);
    this.mesh.lookAt(_v.copy(this.pos).add(this.dir));
    this.mesh.rotateZ(this.spin);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    this.spin += dt * 18;
    // slight homing toward the target's chest
    if (this.target && !this.target.dead && this.t > 0.05) {
      _v.subVectors(this.target.center(), this.pos).normalize();
      const ang = this.dir.angleTo(_v);
      if (ang > 1e-4 && ang < 1.2) this.dir.lerp(_v, Math.min(1, (this.o.homing * dt) / ang)).normalize();
    }
    const step = this.o.speed * dt;
    // world hit along this step
    const hit = raycastVoxels(g.engine.world, this.pos.x, this.pos.y, this.pos.z, this.dir.x, this.dir.y, this.dir.z, step + 0.2);
    if (hit) {
      this.pos.addScaledVector(this.dir, hit.dist);
      this.explode(g);
      return;
    }
    // fighters
    for (const f of g.enemiesOf(this.owner)) {
      const c = f.center();
      const cy = Math.max(f.pos.y + 0.2, Math.min(f.pos.y + f.def.height - 0.2, this.pos.y));
      if (Math.hypot(c.x - this.pos.x, cy - this.pos.y, c.z - this.pos.z) < f.def.radius + 0.45) {
        this.explode(g);
        return;
      }
    }
    this.pos.addScaledVector(this.dir, step);
    this.travelled += step;
    // glints and a green streak behind
    const glow = g.engine.glow;
    glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, vx: -this.dir.x * 4, vy: -this.dir.y * 4, vz: -this.dir.z * 4, size: 0.35, sizeEnd: 0.05, life: 0.25, r: 0.5, g: 0.85, b: 0.68, alpha: 0.8, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
    if (Math.random() < 0.5) glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, vz: (Math.random() - 0.5) * 2, size: 0.1, sizeEnd: 0.02, life: 0.4, r: 0.75, g: 1, b: 0.9, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    if (this.travelled > this.o.range) this.explode(g);
  }

  private explode(g: Game): void {
    if (this.done) return;
    this.done = true;
    const p = this.pos.clone();
    const r = this.o.blast;
    g.engine.destruction.carve(new SphereShape(p, r, 0.85), { mode: 'explode', power: this.o.power, impulse: 16 });
    g.sfx.play('explode', p, 1.2);
    g.addRing(p.clone(), r * 3.2, '#5BE0A4', 0.45);
    for (const f of g.enemiesOf(this.owner)) {
      const d = f.center().distanceTo(p);
      if (d < r + 1.2 + f.def.radius) {
        const k = 1 - Math.min(1, d / (r + 1.2 + f.def.radius));
        g.damage(f, this.o.damage * (0.4 + 0.6 * k), this.owner, f.pos.clone().sub(p).setY(0.25).normalize(), { knock: 14 * k + 4, launch: 6 * k + 2, heavy: true, hitstop: 0.06, shake: 0.5 });
      }
    }
    const glow = g.engine.glow, dust = g.engine.dust;
    glow.spawn({ x: p.x, y: p.y, z: p.z, size: r * 1.2, sizeEnd: r * 3.4, life: 0.35, r: 0.55, g: 1, b: 0.78, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2, e = Math.random() * 2 - 1, q = Math.sqrt(1 - e * e), s = 8 + Math.random() * 14;
      glow.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * q * s, vy: e * s, vz: Math.sin(a) * q * s, size: 0.25, sizeEnd: 0.03, life: 0.4 + Math.random() * 0.3, r: 0.6, g: 1, b: 0.8, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 2.5 });
    }
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      dust.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * 6, vy: Math.random() * 4, vz: Math.sin(a) * 6, size: 1, sizeEnd: 3.2, life: 1.1, r: 0.5, g: 0.5, b: 0.47, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 1.8 });
    }
    if (g.player && g.player.pos.distanceTo(p) < 50) g.shake(0.35);
  }

  render(): void {
    if (!this.done) this.place();
  }

  dispose(): void {
    this.mesh.removeFromParent();
    (this.mesh.material as THREE.Material).dispose();
  }
}
