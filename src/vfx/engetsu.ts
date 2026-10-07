// Isshin Kurosaki's effects (docs/roster/A1-ichigo.md §3). Engetsu's fire: flames licking up the blade, the pommel
// tassel streaming ribbons of flame (bladeFlames, tasselFlames). FlamePillarShot: the blood-flame blast, a
// horizontal pillar of fire that bursts on the first thing it meets. KoteiField: Kaikyō Kotei, four corded rods
// thrown into the ground round him, reiatsu running between them; whoever is inside is held to a crawl. Plow: a
// fighter flicked away by Oni Dekopin, smashing through whatever stands in the way.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { SphereShape } from '../destruction/shapes';
import { FlamePool, burnAt } from './fire';
import type { EnergyColors } from './energy';
import { groundAt } from './iceArts';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

/** Engetsu's flames (dossier palette): a pale yellow core, orange, a deep red-orange edge */
export const ENGETSU_FIRE: EnergyColors = { core: '#FFFBE0', body: '#F7A23A', rim: '#C35718' };
/** the sealed Getsuga (old anime): light blue */
export const GETSUGA_ISSHIN: EnergyColors = { core: '#F4FBFF', body: '#9FD8FF', rim: '#3E8ED0' };

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

/** Flames licking up off the blade from base to tip (call each step while it burns). */
export function bladeFlames(g: Game, base: THREE.Vector3, tip: THREE.Vector3, n = 3, k = 1): void {
  const pool = FlamePool.of(g);
  for (let i = 0; i < n; i++) {
    const u = Math.random();
    pool.spawn(base.x + (tip.x - base.x) * u, base.y + (tip.y - base.y) * u - 0.05, base.z + (tip.z - base.z) * u, (0.16 + Math.random() * 0.12) * k, (0.32 + Math.random() * 0.3) * k, 0.22 + Math.random() * 0.12, 1.1, 1.2);
  }
  if (Math.random() < 0.5) {
    const u = Math.random();
    g.engine.glow.spawn({ x: base.x + (tip.x - base.x) * u, y: base.y + (tip.y - base.y) * u, z: base.z + (tip.z - base.z) * u, vx: (Math.random() - 0.5) * 0.8, vy: 1.5 + Math.random() * 2, vz: (Math.random() - 0.5) * 0.8, size: 0.05, sizeEnd: 0.015, life: 0.6, r: 1, g: 0.6, b: 0.2, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, gravity: 1 });
  }
}

/** The tassel alight: long ribbons of flame streaming off the pommel, trailing the swing. */
export function tasselFlames(g: Game, p: THREE.Vector3, vel: THREE.Vector3): void {
  const pool = FlamePool.of(g);
  pool.spawn(p.x, p.y - 0.1, p.z, 0.14, 0.42, 0.3, 1.2, 1.6);
  for (let i = 0; i < 2; i++) {
    g.engine.glow.spawn({
      x: p.x, y: p.y, z: p.z, vx: -vel.x * 0.25 + (Math.random() - 0.5) * 0.6, vy: 0.8 + Math.random(), vz: -vel.z * 0.25 + (Math.random() - 0.5) * 0.6,
      size: 0.12, sizeEnd: 0.03, life: 0.38, r: 1, g: 0.55 + Math.random() * 0.25, b: 0.15, alpha: 0.95, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 1.5,
    });
  }
}

// ------------------------------------------------------------------ the blood-flame blast

/** A horizontal pillar of fire driven straight out: it bursts on the first fighter, wall or ground it meets. */
export class FlamePillarShot implements Projectile {
  done = false;
  readonly pos: THREE.Vector3;
  private dir: THREE.Vector3;
  private dist = 0;
  private burst = false;
  private t = 0;
  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, dir: THREE.Vector3, readonly o: { speed: number; range: number; damage: number; radius: number }) {
    this.pos = from.clone();
    this.dir = dir.clone().normalize();
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.burst) {
      if (this.t > 0.6) this.done = true;
      return;
    }
    const step = this.o.speed * dt;
    const pool = FlamePool.of(g);
    // the pillar: a column of fire from where it left the blade to its head, the head fattest
    const n = 8;
    for (let i = 0; i < n; i++) {
      const back = Math.random() * Math.min(this.dist + step, 6);
      const r = 0.25 + (1 - back / 6) * 0.7;
      const a = Math.random() * Math.PI * 2;
      const x = this.pos.x - this.dir.x * back + Math.cos(a) * r * 0.6, y = this.pos.y - this.dir.y * back + Math.sin(a) * r * 0.6 - 0.3, z = this.pos.z - this.dir.z * back + Math.cos(a + 1.3) * r * 0.6;
      pool.spawn(x, y, z, 0.5 + r * 0.5, 0.8 + r, 0.25, 1.3, 2);
    }
    g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, size: 2.2, sizeEnd: 0.8, life: 0.1, r: 1, g: 0.75, b: 0.35, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    this.pos.addScaledVector(this.dir, step);
    this.dist += step;
    // it bursts on whatever it meets (clear of the blade first: a cut that ends low must not burst at his feet)
    let hit = this.dist >= this.o.range || (this.dist > 1.5 && g.engine.world.isSolidAtPos(this.pos.x, this.pos.y, this.pos.z));
    for (const f of g.enemiesOf(this.owner)) {
      if (f.dead) continue;
      const c = f.center(_v);
      if (c.distanceTo(this.pos) < this.o.radius + f.def.radius) hit = true;
    }
    if (hit) this.explode(g);
  }

  private explode(g: Game): void {
    this.burst = true;
    this.t = 0;
    const p = this.pos.clone();
    const R = 4.2;
    g.engine.destruction.carve(new SphereShape(p.clone(), R * 0.8, 0.5), { mode: 'explode', power: 520, impulse: 16, dust: 0.9 });
    g.groundImpact(p.clone(), R, 220, ENGETSU_FIRE.body, this.owner);
    for (let i = 0; i < 5; i++) burnAt(g, p.clone().add(_w.set((Math.random() - 0.5) * R * 1.4, 0, (Math.random() - 0.5) * R * 1.4)), 1.4, 1, 3);
    const pool = FlamePool.of(g);
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2, e = Math.random() * 2 - 1, r = Math.random() * R;
      const q = Math.sqrt(1 - e * e);
      pool.spawn(p.x + Math.cos(a) * q * r, p.y + e * r * 0.6, p.z + Math.sin(a) * q * r, 0.9 + Math.random(), 1.6 + Math.random() * 1.6, 0.5 + Math.random() * 0.4, 1.4, 3);
    }
    for (const f of g.enemiesOf(this.owner)) {
      const d = f.center(_v).distanceTo(p);
      if (d > R + f.def.radius) continue;
      const k = 1 - Math.min(1, d / (R + 0.5));
      g.damage(f, this.o.damage * (0.5 + 0.5 * k), this.owner, _w.subVectors(f.pos, p).setY(0).normalize().clone(), { energy: true, knock: 16 * k + 4, launch: 7, heavy: true, hitstop: 0.12, shake: 0.6 });
    }
    g.sfx.play('explode', p, 1.3);
    g.shake(0.6);
    g.engine.gr.chroma.offset.set(0.007, 0.007);
  }

  dispose(): void {}
}

// ------------------------------------------------------------------ Kaikyō Kotei

/** Four corded rods thrown into the ground round him; reiatsu runs between them and holds whoever is inside. */
export class KoteiField implements Projectile {
  done = false;
  private t = 0;
  private rods: THREE.Mesh[] = [];
  private lines: THREE.LineSegments;
  private corners: THREE.Vector3[] = [];
  private center: THREE.Vector3;
  constructor(private g: Game, readonly owner: Fighter, center: THREE.Vector3, yaw: number, readonly R = 6.5, readonly dur = 7) {
    this.center = center.clone();
    const rodGeo = new THREE.CylinderGeometry(0.035, 0.05, 0.9, 6);
    rodGeo.translate(0, 0.25, 0);
    const prong = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 5);
    for (let i = 0; i < 4; i++) {
      const a = yaw + Math.PI / 4 + (i * Math.PI) / 2;
      const x = center.x + Math.sin(a) * R, z = center.z + Math.cos(a) * R;
      const gy = groundAt(g, x, center.y + 2, z, 6) ?? center.y;
      const p = new THREE.Vector3(x, gy, z);
      this.corners.push(p);
      const rod = new THREE.Mesh(rodGeo, new THREE.MeshStandardMaterial({ color: '#B8BCC4', metalness: 0.85, roughness: 0.3 }));
      rod.position.copy(p);
      rod.rotation.set((Math.random() - 0.5) * 0.3, 0, (Math.random() - 0.5) * 0.3);
      // the fork at the top
      for (const k of [-1, 1]) {
        const pr = new THREE.Mesh(prong, rod.material);
        pr.position.set(k * 0.04, 0.78, 0);
        pr.rotation.z = -k * 0.35;
        rod.add(pr);
      }
      g.engine.gr.scene.add(rod);
      this.rods.push(rod);
      g.engine.destruction.carve(new SphereShape(p.clone(), 0.35, 0.5), { mode: 'smash', power: 80, dust: 0.4 });
    }
    // reiatsu cords between the rods, and from each rod in to his hands
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(16 * 3), 3));
    this.lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: new THREE.Color('#F1D47B').multiplyScalar(2.2), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.lines.frustumCulled = false;
    g.engine.gr.scene.add(this.lines);
    g.sfx.play('charge', center, 0.8);
  }

  /** inside the square of rods (on the ground plane) */
  private inside(p: THREE.Vector3): boolean {
    let sign = 0;
    for (let i = 0; i < 4; i++) {
      const a = this.corners[i], b = this.corners[(i + 1) % 4];
      const c = (b.x - a.x) * (p.z - a.z) - (b.z - a.z) * (p.x - a.x);
      const s = Math.sign(c);
      if (s === 0) continue;
      if (sign === 0) sign = s;
      else if (s !== sign) return false;
    }
    return true;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.t >= this.dur || this.owner.dead) {
      this.done = true;
      return;
    }
    const fade = Math.min(1, (this.dur - this.t) / 0.5);
    for (const o of g.enemiesOf(this.owner)) {
      if (o.dead || !this.inside(o.pos) || Math.abs(o.pos.y - this.center.y) > 6) continue;
      o.slow(0.6, 0.25);
      o.dilate(0.35, 0.25);
      if (Math.random() < 0.25) g.engine.glow.spawn({ x: o.pos.x + (Math.random() - 0.5) * 0.6, y: o.pos.y + Math.random() * 1.6, z: o.pos.z + (Math.random() - 0.5) * 0.6, vx: 0, vy: 0.3, vz: 0, size: 0.08, sizeEnd: 0.02, life: 0.5, r: 1, g: 0.85, b: 0.45, alpha: 0.9 * fade, alphaEnd: 0, tex: TEX_GLOW });
    }
    // pulses running along the cords
    if (Math.random() < 0.6) {
      const i = Math.floor(Math.random() * 4);
      const a = this.corners[i], b = this.corners[(i + 1) % 4];
      const u = Math.random();
      g.engine.glow.spawn({ x: a.x + (b.x - a.x) * u, y: a.y + 0.65, z: a.z + (b.z - a.z) * u, size: 0.18, sizeEnd: 0.05, life: 0.35, r: 1, g: 0.83, b: 0.48, alpha: 0.9 * fade, alphaEnd: 0, tex: TEX_GLOW });
    }
  }

  render(): void {
    const pos = this.lines.geometry.getAttribute('position') as THREE.BufferAttribute;
    const h = this.owner.center(_v);
    for (let i = 0; i < 4; i++) {
      const a = this.corners[i], b = this.corners[(i + 1) % 4];
      pos.setXYZ(i * 2, a.x, a.y + 0.65, a.z);
      pos.setXYZ(i * 2 + 1, b.x, b.y + 0.65, b.z);
      pos.setXYZ(8 + i * 2, a.x, a.y + 0.65, a.z);
      pos.setXYZ(8 + i * 2 + 1, h.x, h.y, h.z);
    }
    pos.needsUpdate = true;
    (this.lines.material as THREE.LineBasicMaterial).opacity = 0.85 * Math.min(1, (this.dur - this.t) / 0.5);
  }

  dispose(): void {
    for (const r of this.rods) r.removeFromParent();
    this.rods[0]?.geometry.dispose();
    (this.rods[0]?.material as THREE.Material | undefined)?.dispose();
    this.lines.removeFromParent();
    this.lines.geometry.dispose();
    (this.lines.material as THREE.Material).dispose();
  }
}

// ------------------------------------------------------------------ Oni Dekopin

/** A fighter flicked away: it flies far and smashes through whatever stands in its path. */
export class Plow implements Projectile {
  done = false;
  private t = 0;
  private drag: number;
  constructor(readonly victim: Fighter, readonly dur = 0.8) {
    this.drag = victim.pushDrag;
    victim.pushDrag = 1.6;
  }
  update(dt: number, g: Game): void {
    this.t += dt;
    const v = this.victim;
    if (this.t >= this.dur || v.dead) {
      this.done = true;
      return;
    }
    const sp = Math.hypot(v.push.x, v.push.z);
    if (sp > 6) {
      g.engine.destruction.carve(new SphereShape(v.center(_v).clone(), 1.05, 0.5), { mode: 'smash', power: 320, impulse: sp * 0.6, dust: 0.6 });
      if (Math.random() < 0.5) g.engine.dust.spawn({ x: v.pos.x, y: v.pos.y + 0.8, z: v.pos.z, vx: 0, vy: 0.5, vz: 0, size: 0.8, sizeEnd: 2.2, life: 0.7, r: 0.6, g: 0.57, b: 0.52, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 1.5 });
    }
  }
  dispose(): void {
    this.victim.pushDrag = this.drag;
  }
}
