// Nelliel Tu Odelschwanck's effects (docs/roster/E2-espada-2.md §7). LanzadorShot: Lanzador Verde — the double-
// ended lance hurled like a javelin, spinning up in an emerald spiral and drilling a straight tunnel through
// whatever stands in its way; it goes through a fighter (a huge shove along its flight) and keeps going.
// Small bursts: the blue flash of Galope, the reiatsu burst of "Utae, Gamuza", the pink smoke of growing up or
// shrinking, the green spray of Nel Shower, and the glow in the child mask's eyes.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { PropMesh } from '../game/characterFactory';
import { CapsuleShape } from '../destruction/shapes';
import { nelProp } from '../chars/nelliel';
import { segToFighter } from './shiro';
import { TEX_GLOW, TEX_PUFF, TEX_RING, TEX_STREAK } from './sprites';

export const NEL_PINK = { core: '#FFD6EA', body: '#FF5FA8', rim: '#B02A6A' };
export const EMERALD = { core: '#C9FFE2', body: '#38E08A', rim: '#1A8A50' };
export const GALOPE_BLUE = '#6FA8FF';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _qs = new THREE.Quaternion();
const Z = new THREE.Vector3(0, 0, 1);

/** Lanzador Verde: the spinning lance in flight. */
export class LanzadorShot implements Projectile {
  done = false;
  readonly pos: THREE.Vector3;
  private prev = new THREE.Vector3();
  private dir: THREE.Vector3;
  private mesh: PropMesh;
  private dist = 0;
  private spin = 0;
  private t = 0;
  private carveAcc = 0;
  private hit = new Set<number>();
  private side = new THREE.Vector3();
  private up = new THREE.Vector3();
  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, dir: THREE.Vector3, readonly o: { speed: number; range: number; damage: number; radius: number; push: number }) {
    this.pos = from.clone();
    this.prev.copy(from);
    this.dir = dir.clone().normalize();
    this.side.crossVectors(this.dir, Math.abs(this.dir.y) > 0.95 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)).normalize();
    this.up.crossVectors(this.side, this.dir).normalize();
    this.mesh = new PropMesh(nelProp('lance'));
    const u = this.mesh.material.userData.uniforms;
    if (u?.uEnergy) u.uEnergy.value.set(0.22, 0.88, 0.54, 0.55);
    g.engine.gr.scene.add(this.mesh);
    this.place();
  }

  private place(): void {
    _q.setFromUnitVectors(Z, this.dir);
    _qs.setFromAxisAngle(Z, this.spin);
    this.mesh.quaternion.copy(_q).multiply(_qs);
    this.mesh.position.copy(this.pos);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const step = this.o.speed * Math.min(dt, 1 / 30);
    this.prev.copy(this.pos);
    this.pos.addScaledVector(this.dir, step);
    this.dist += step;
    this.spin += dt * 34;
    this.place();
    // the drill: a straight bore along its path
    this.carveAcc += step;
    if (this.carveAcc > 0.6) {
      this.carveAcc = 0;
      g.engine.destruction.carve(new CapsuleShape(this.prev.clone().addScaledVector(this.dir, -0.6), this.pos.clone().addScaledVector(this.dir, 1.2), this.o.radius), { mode: 'bore', power: 1400, sparks: [0.3, 0.95, 0.6], dust: 0.5, impulse: 12 });
    }
    // the emerald spiral wound round the shaft behind the point
    const glow = g.engine.glow;
    for (let i = 0; i < 6; i++) {
      const a = this.spin * 1.3 + (i / 6) * Math.PI * 2;
      const back = Math.random() * 2.2;
      const r = 0.22 + back * 0.12;
      _v.copy(this.pos).addScaledVector(this.dir, 1.0 - back).addScaledVector(this.side, Math.cos(a) * r).addScaledVector(this.up, Math.sin(a) * r);
      const c = i % 3 === 0 ? EMERALD.core : EMERALD.body;
      const col = new THREE.Color(c);
      glow.spawn({ x: _v.x, y: _v.y, z: _v.z, vx: -this.dir.x * 4, vy: -this.dir.y * 4, vz: -this.dir.z * 4, size: 0.22, sizeEnd: 0.05, life: 0.35, r: col.r, g: col.g, b: col.b, alpha: 0.95, alphaEnd: 0, tex: TEX_GLOW });
    }
    if (Math.random() < 0.5) {
      const col = new THREE.Color(EMERALD.body);
      glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, size: 1.2, sizeEnd: 2.4, life: 0.18, r: col.r, g: col.g, b: col.b, alpha: 0.5, alphaEnd: 0, tex: TEX_RING });
    }
    // through whoever it meets
    for (const f of g.enemiesOf(this.owner)) {
      if (f.dead || this.hit.has(f.id)) continue;
      _w.copy(this.pos).addScaledVector(this.dir, 1.3);
      if (segToFighter(this.prev, _w, f) > this.o.radius + f.def.radius) continue;
      this.hit.add(f.id);
      g.damage(f, this.o.damage, this.owner, this.dir.clone().setY(0).normalize(), { energy: true, knock: this.o.push, launch: 4, heavy: true, hitstop: 0.16, shake: 0.8, color: EMERALD.body });
      g.addRing(f.center(), 4, EMERALD.body, 0.4);
      g.sfx.play('explode', f.center(), 1.1);
      for (let i = 0; i < 26; i++) {
        const col = new THREE.Color(i % 2 ? EMERALD.core : EMERALD.body);
        const c = f.center();
        glow.spawn({ x: c.x, y: c.y, z: c.z, vx: this.dir.x * 14 + (Math.random() - 0.5) * 10, vy: (Math.random() - 0.2) * 8, vz: this.dir.z * 14 + (Math.random() - 0.5) * 10, size: 0.16, sizeEnd: 0.03, life: 0.5, r: col.r, g: col.g, b: col.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
      }
    }
    if (this.dist >= this.o.range) this.done = true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
  }
}

/** a blue flash where she vanishes or reappears (Galope) */
export function galopeFlash(g: Game, at: THREE.Vector3, size = 1): void {
  const c = new THREE.Color(GALOPE_BLUE), w = new THREE.Color('#E8F1FF');
  const glow = g.engine.glow;
  glow.spawn({ x: at.x, y: at.y, z: at.z, size: 3.2 * size, sizeEnd: 0.6, life: 0.22, r: w.r, g: w.g, b: w.b, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.3) * 1.2;
    const sp = 6 + Math.random() * 8;
    glow.spawn({ x: at.x, y: at.y, z: at.z, vx: Math.cos(a) * sp, vy: e * sp * 0.5, vz: Math.sin(a) * sp, size: 0.14, sizeEnd: 0.03, life: 0.3, r: c.r, g: c.g, b: c.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 3 });
  }
  g.addRing(at.clone(), 3 * size, GALOPE_BLUE, 0.3);
}

/** "Utae, Gamuza": the reiatsu bursts out of her — a column, rings and a wall of dust that throws people back */
export function releaseBurst(g: Game, at: THREE.Vector3): void {
  const glow = g.engine.glow, dust = g.engine.dust;
  const pink = new THREE.Color(NEL_PINK.body), core = new THREE.Color(NEL_PINK.core), em = new THREE.Color(EMERALD.body);
  for (let i = 0; i < 60; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * 1.2;
    const c = i % 3 === 0 ? em : i % 3 === 1 ? pink : core;
    glow.spawn({ x: at.x + Math.cos(a) * r, y: at.y + Math.random() * 1.5, z: at.z + Math.sin(a) * r, vx: Math.cos(a) * 2, vy: 10 + Math.random() * 14, vz: Math.sin(a) * 2, size: 0.5 + Math.random() * 0.5, sizeEnd: 0.1, life: 0.9, r: c.r, g: c.g, b: c.b, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW, drag: 1 });
  }
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    dust.spawn({ x: at.x + Math.cos(a) * 1.5, y: at.y + 0.3, z: at.z + Math.sin(a) * 1.5, vx: Math.cos(a) * 18, vy: 1 + Math.random() * 2, vz: Math.sin(a) * 18, size: 1.4, sizeEnd: 4.5, life: 1.2, r: 0.7, g: 0.66, b: 0.6, alpha: 0.55, alphaEnd: 0, tex: TEX_PUFF, drag: 2.4 });
  }
  g.addRing(at.clone().setY(at.y + 0.1), 9, NEL_PINK.body, 0.6);
  g.addRing(at.clone().setY(at.y + 1.4), 6, EMERALD.body, 0.5);
}

/** a puff of pink smoke (she grows up or shrinks back inside it) */
export function nelPuff(g: Game, at: THREE.Vector3, scale = 1): void {
  const dust = g.engine.dust, glow = g.engine.glow;
  const pink = new THREE.Color('#F6B8D3');
  for (let i = 0; i < 30; i++) {
    const a = Math.random() * Math.PI * 2, e = Math.random() * 2 - 1, q = Math.sqrt(1 - e * e);
    const sp = (1.5 + Math.random() * 3) * scale;
    dust.spawn({ x: at.x, y: at.y + e * 0.4 * scale, z: at.z, vx: Math.cos(a) * q * sp, vy: e * sp * 0.6 + 1, vz: Math.sin(a) * q * sp, size: 0.6 * scale, sizeEnd: 1.8 * scale, life: 0.8 + Math.random() * 0.4, r: pink.r, g: pink.g, b: pink.b, alpha: 0.8, alphaEnd: 0, tex: TEX_PUFF, drag: 2.5 });
  }
  glow.spawn({ x: at.x, y: at.y, z: at.z, size: 2.6 * scale, sizeEnd: 0.4, life: 0.3, r: 1, g: 0.75, b: 0.88, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
}

/** Nel Shower: the green "saliva" gushing up and raining back down over her */
export function showerSpray(g: Game, mouth: THREE.Vector3, n = 10): void {
  const glow = g.engine.glow;
  const c = new THREE.Color('#9BE88C'), d = new THREE.Color('#5DC86A');
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const col = Math.random() < 0.5 ? c : d;
    glow.spawn({ x: mouth.x, y: mouth.y, z: mouth.z, vx: Math.cos(a) * (0.5 + Math.random() * 1.5), vy: 3 + Math.random() * 3, vz: Math.sin(a) * (0.5 + Math.random() * 1.5), size: 0.08 + Math.random() * 0.05, sizeEnd: 0.05, life: 0.9, r: col.r, g: col.g, b: col.b, alpha: 0.95, alphaEnd: 0.3, tex: TEX_GLOW, gravity: -12 });
  }
}

/** the child mask's eyes lit (Chōkasoku, her Cero Doble): a point of light in each socket */
export function maskEyes(g: Game, f: Fighter, strength = 1): void {
  for (const k of ['maskEye.L', 'maskEye.R']) {
    const s = f.visual.rig.sockets.get(k);
    if (!s) continue;
    s.updateWorldMatrix(true, false);
    s.getWorldPosition(_v);
    g.engine.glow.spawn({ x: _v.x, y: _v.y, z: _v.z, size: 0.16 * strength, sizeEnd: 0.05, life: 0.12, r: 1, g: 0.78, b: 0.88, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  }
}
