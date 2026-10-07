// Chad's blows. FistBlast: the spirit energy fired from the armoured fist — a white-cyan orb that bursts on
// whatever it meets. SkullShape / laMuerte: La Muerte's mark — when the Diablo fist lands, a huge skull is
// gouged into the ground and walls behind the target (sockets, nose and the gaps between the teeth cut
// deeper), and a skull of bone-white light rises out of it for a moment.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { SphereShape, type DamageShape, type VoxelVisitor } from '../destruction/shapes';
import { raycastVoxels } from '../voxel/raycast';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

const _p = new THREE.Vector3();

// ------------------------------------------------------------------ the fist blast

let orbGeo: THREE.BufferGeometry | null = null;

export class FistBlast implements Projectile {
  done = false;
  readonly pos: THREE.Vector3;
  readonly dir: THREE.Vector3;
  private group = new THREE.Group();
  private core: THREE.Mesh;
  private shell: THREE.Mesh;
  private t = 0;
  private travelled = 0;

  constructor(private owner: Fighter, g: Game, origin: THREE.Vector3, dir: THREE.Vector3, readonly size = 0.55, readonly damage = 40, readonly speed = 46, readonly blast = 2) {
    this.pos = origin.clone();
    this.dir = dir.clone().normalize();
    orbGeo ??= new THREE.IcosahedronGeometry(1, 2);
    const mat = (c: string, gain: number, op: number) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(gain), transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false });
    this.core = new THREE.Mesh(orbGeo, mat('#F8FDFC', 2.2, 0.95));
    this.shell = new THREE.Mesh(orbGeo, mat('#9CC0D0', 1.4, 0.5));
    this.group.add(this.core, this.shell);
    this.group.traverse((o) => (o.frustumCulled = false));
    this.core.renderOrder = this.shell.renderOrder = 7;
    g.engine.gr.scene.add(this.group);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const step = this.speed * dt;
    const hit = raycastVoxels(g.engine.world, this.pos.x, this.pos.y, this.pos.z, this.dir.x, this.dir.y, this.dir.z, step + this.size * 0.5);
    if (hit) {
      this.pos.addScaledVector(this.dir, hit.dist);
      this.burst(g, null);
      return;
    }
    for (const f of g.enemiesOf(this.owner)) {
      const cy = Math.max(f.pos.y + 0.2, Math.min(f.pos.y + f.def.height - 0.2, this.pos.y));
      if (Math.hypot(f.pos.x - this.pos.x, cy - this.pos.y, f.pos.z - this.pos.z) < f.def.radius + this.size) {
        this.burst(g, f);
        return;
      }
    }
    this.pos.addScaledVector(this.dir, step);
    this.travelled += step;
    for (let i = 0; i < 2; i++) g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, vx: -this.dir.x * 8 + (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, vz: -this.dir.z * 8 + (Math.random() - 0.5) * 2, size: this.size * 1.2, sizeEnd: 0.05, life: 0.22, r: 0.86, g: 0.96, b: 0.97, alpha: 0.7, alphaEnd: 0, tex: TEX_PUFF });
    if (this.travelled > 70) this.burst(g, null);
  }

  render(): void {
    this.group.position.copy(this.pos);
    const k = 1 + Math.sin(this.t * 38) * 0.07;
    this.core.scale.setScalar(this.size * 0.6 * k);
    this.shell.scale.setScalar(this.size * (1.05 + Math.sin(this.t * 21) * 0.08));
  }

  private burst(g: Game, direct: Fighter | null): void {
    if (this.done) return;
    this.done = true;
    const p = this.pos;
    for (const f of g.enemiesOf(this.owner)) {
      const d = f === direct ? 0 : f.center().distanceTo(p);
      if (d > this.blast + f.def.radius) continue;
      const k = 1 - Math.min(1, d / (this.blast + f.def.radius)) * 0.5;
      g.damage(f, this.damage * k, this.owner, new THREE.Vector3(this.dir.x, 0, this.dir.z).normalize(), { knock: 14 * k, launch: 4 * k, heavy: true, hitstop: 0.08, shake: 0.35 });
    }
    g.engine.destruction.carve(new SphereShape(p.clone(), this.blast * 0.8, 0.9), { mode: 'explode', power: 90 + this.blast * 60, impulse: 10 + this.blast * 3 });
    g.addRing(p.clone(), this.blast * 3, '#DDF6F5', 0.4);
    g.sfx.play('explode', p, Math.min(1.8, 0.6 + this.blast * 0.3));
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: this.blast, sizeEnd: this.blast * 2.6, life: 0.24, r: 0.92, g: 0.99, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * 10, vy: 2 + Math.random() * 7, vz: Math.sin(a) * 10, size: 0.14, sizeEnd: 0.03, life: 0.5, r: 0.9, g: 0.97, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, gravity: -6 });
      g.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * 5, vy: Math.random() * 3, vz: Math.sin(a) * 5, size: this.blast * 0.5, sizeEnd: this.blast * 1.5, life: 0.9, r: 0.6, g: 0.58, b: 0.55, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
    }
    this.group.visible = false;
  }

  dispose(): void {
    this.group.removeFromParent();
    (this.core.material as THREE.Material).dispose();
    (this.shell.material as THREE.Material).dispose();
  }
}

// ------------------------------------------------------------------ La Muerte

/** Distance (negative inside) to a skull outline drawn in the (u, v) plane, about 1 unit tall (v up from the jaw). */
function skull2D(u: number, v: number): { d: number; deep: boolean } {
  const cranium = Math.hypot(u / 0.42, (v - 0.62) / 0.36) - 1;
  const face = Math.max(Math.abs(u) - 0.3 + (0.42 - v) * 0.25, v - 0.6, 0.12 - v);
  const jaw = Math.max(Math.abs(u) - 0.22, v - 0.2, -v);
  const d = Math.min(cranium * 0.36, face, jaw);
  // the features are carved deeper: sockets, the nasal cavity, the gaps between the teeth
  const eye = Math.min(Math.hypot((u - 0.15) / 0.11, (v - 0.48) / 0.09), Math.hypot((u + 0.15) / 0.11, (v - 0.48) / 0.09)) - 1;
  const nose = Math.max(Math.abs(u) - 0.05 + (v - 0.3) * 0.3, v - 0.4, 0.27 - v);
  const teeth = v > 0.04 && v < 0.2 && Math.abs(u) < 0.2 && (Math.abs(((u + 1) * 22) % 2 - 1) < 0.28 || Math.abs(v - 0.12) < 0.02);
  return { d, deep: eye < 0 || nose < 0 || teeth };
}

/**
 * The skull, gouged into a surface: its outline carved `depth` metres deep along `into`, its features
 * twice as deep. `base` is the middle of the jaw on the surface, `up` points from the jaw to the crown,
 * and the skull is `size` metres tall.
 */
export class SkullShape implements DamageShape {
  readonly kind = 'skull';
  readonly center: THREE.Vector3;
  private side: THREE.Vector3;
  readonly into: THREE.Vector3;
  readonly up: THREE.Vector3;

  constructor(readonly base: THREE.Vector3, into: THREE.Vector3, up: THREE.Vector3, readonly size: number, readonly depth: number) {
    this.into = into.clone().normalize();
    this.up = up.clone().addScaledVector(this.into, -up.dot(this.into)).normalize();
    this.side = new THREE.Vector3().crossVectors(this.up, this.into).normalize();
    this.center = base.clone().addScaledVector(this.up, size * 0.5).addScaledVector(this.into, depth * 0.5);
  }

  aabb(out: THREE.Box3): THREE.Box3 {
    const w = this.size * 0.5, d = this.depth * 2.2;
    out.makeEmpty();
    for (const sx of [-1, 1])
      for (const sz of [-0.3, 1])
        for (const sy of [0, 1.02]) out.expandByPoint(_p.copy(this.base).addScaledVector(this.side, sx * w).addScaledVector(this.into, sz * d).addScaledVector(this.up, sy * this.size));
    return out;
  }

  sdf(p: THREE.Vector3): number {
    const q = _p.subVectors(p, this.base);
    const along = q.dot(this.into);
    const u = q.dot(this.side) / this.size, v = q.dot(this.up) / this.size;
    const s = skull2D(u, v);
    const deep = s.deep ? this.depth * 2 : this.depth;
    return Math.max(s.d * this.size, along - deep, -this.depth * 0.3 - along);
  }

  forEachVoxel(vs: number, visit: VoxelVisitor): void {
    const box = this.aabb(new THREE.Box3());
    const x0 = Math.floor(box.min.x / vs), y0 = Math.floor(box.min.y / vs), z0 = Math.floor(box.min.z / vs);
    const x1 = Math.ceil(box.max.x / vs), y1 = Math.ceil(box.max.y / vs), z1 = Math.ceil(box.max.z / vs);
    const pt = new THREE.Vector3();
    for (let z = z0; z <= z1; z++)
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          pt.set((x + 0.5) * vs, (y + 0.5) * vs, (z + 0.5) * vs);
          const d = this.sdf(pt);
          if (d <= 0) visit(x, y, z, Math.min(1, -d / (this.depth * 0.6)));
        }
  }
}

let skullTex: THREE.CanvasTexture | null = null;

/** A bone-white skull drawn on a canvas (cranium, sockets, nose, teeth). */
function skullTexture(): THREE.Texture {
  if (skullTex) return skullTex;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(128, 110, 20, 128, 120, 130);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(1, 'rgba(255,255,255,0.55)');
  g.fillStyle = grd;
  g.beginPath();
  g.ellipse(128, 96, 86, 82, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.moveTo(54, 120); g.lineTo(202, 120); g.lineTo(188, 176); g.lineTo(164, 200); g.lineTo(92, 200); g.lineTo(68, 176);
  g.closePath();
  g.fill();
  g.fillRect(84, 196, 88, 34);
  g.globalCompositeOperation = 'destination-out';
  for (const x of [92, 164]) {
    g.beginPath();
    g.ellipse(x, 118, 26, 22, x < 128 ? 0.25 : -0.25, 0, Math.PI * 2);
    g.fill();
  }
  g.beginPath();
  g.moveTo(128, 140); g.lineTo(116, 168); g.lineTo(140, 168);
  g.closePath();
  g.fill();
  for (let i = 0; i < 8; i++) g.fillRect(88 + i * 11, 198, 3, 30);
  g.fillRect(84, 212, 88, 3);
  skullTex = new THREE.CanvasTexture(c);
  return skullTex;
}

/** The skull of light that rises from the mark and fades. */
class SkullApparition implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.Mesh;

  constructor(g: Game, readonly at: THREE.Vector3, into: THREE.Vector3, up: THREE.Vector3, readonly size: number) {
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(size * 0.95, size), new THREE.MeshBasicMaterial({ map: skullTexture(), color: new THREE.Color('#E8E4DC').multiplyScalar(1.6), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    // standing up out of the mark, facing the one who struck
    this.mesh.position.copy(at).add(new THREE.Vector3(0, size * 0.5, 0)).addScaledVector(into, -0.4);
    const face = new THREE.Vector3(into.x, 0, into.z);
    if (face.lengthSq() < 1e-4) face.copy(up).setY(0);
    this.mesh.lookAt(this.mesh.position.clone().sub(face.normalize()));
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 6;
    g.engine.gr.scene.add(this.mesh);
  }

  update(dt: number): void {
    this.t += dt;
    if (this.t > 1.6) this.done = true;
  }

  render(): void {
    const t = this.t;
    (this.mesh.material as THREE.MeshBasicMaterial).opacity = t < 0.12 ? t / 0.12 : Math.max(0, 1 - (t - 0.12) / 1.4);
    this.mesh.scale.setScalar(1 + t * 0.12);
    this.mesh.position.y += 0.01;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

/**
 * La Muerte's mark: a skull `size` metres tall gouged into whatever stands behind the target — a wall if
 * there is one within reach, else the ground itself, the skull lying with its crown away from the striker —
 * and a skull of light rising out of it.
 */
export function laMuerte(g: Game, at: THREE.Vector3, dir: THREE.Vector3, size = 9, back = 2.5): void {
  const d = dir.clone().setY(0).normalize();
  const from = at.clone().add(new THREE.Vector3(0, 1.2, 0));
  const wall = raycastVoxels(g.engine.world, from.x, from.y, from.z, d.x, 0, d.z, back + 7);
  let base: THREE.Vector3, into: THREE.Vector3, up: THREE.Vector3;
  if (wall) {
    base = from.clone().addScaledVector(d, wall.dist - 0.2);
    base.y = at.y - size * 0.06;
    into = d;
    up = new THREE.Vector3(0, 1, 0);
  } else {
    base = at.clone().addScaledVector(d, 0.8);
    base.y = at.y + 0.1;
    into = new THREE.Vector3(0, -1, 0);
    up = d;
  }
  g.engine.destruction.carve(new SkullShape(base, into, up, size, wall ? 1.8 : 1.1), { mode: 'smash', power: 900, impulse: 14, dust: 0.6 });
  const mark = wall ? base.clone().addScaledVector(d, -0.6) : at.clone().addScaledVector(d, back);
  g.addProjectile(new SkullApparition(g, mark, d, new THREE.Vector3(0, 1, 0), size));
  g.addRing(at.clone(), size * 1.6, '#EFF9F9', 0.6);
  g.sfx.play('explode', at, 2);
  const c = wall ? base.clone().addScaledVector(up, size * 0.4) : base.clone().addScaledVector(up, size * 0.4);
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * Math.PI * 2;
    g.engine.dust.spawn({ x: c.x, y: c.y + Math.random() * 2, z: c.z, vx: Math.cos(a) * 9 + d.x * 6, vy: Math.random() * 5, vz: Math.sin(a) * 9 + d.z * 6, size: 1.2, sizeEnd: 3.6, life: 1.4, r: 0.66, g: 0.62, b: 0.58, alpha: 0.55, alphaEnd: 0, tex: TEX_PUFF, drag: 1.8 });
  }
}
