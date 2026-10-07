// Ichigo's fuller moveset: the ground Getsuga (a wall of reiatsu tearing a trench along the ground toward
// the target), Zangetsu thrown on its cloth (Deadly Darts: the cleaver spins out, cuts what it meets and
// is hauled back on the cloth), and the reiatsu wrapping the blade in Getsuga Matoi.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import type { VoxelModel } from '../models/builder';
import { PropMesh } from '../game/characterFactory';
import { CapsuleShape, SphereShape } from '../destruction/shapes';
import { groundAt } from './iceArts';
import type { EnergyColors } from './energy';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _c = new THREE.Color();

// ------------------------------------------------------------------ the ground Getsuga

export interface GroundGetsugaOpts {
  speed: number;
  range: number;
  /** half-width of the torn strip (m) */
  width: number;
  damage: number;
  power: number;
}

/** A Getsuga driven along the ground: it hugs the surface, tears a trench and throws up whoever stands on it. */
export class GroundGetsuga implements Projectile {
  done = false;
  readonly pos: THREE.Vector3;
  private dir: THREE.Vector3;
  private dist = 0;
  private acc = 0;
  private hit = new Set<number>();
  private body = new THREE.Color();
  private core = new THREE.Color();

  constructor(private g: Game, private owner: Fighter, from: THREE.Vector3, dir: THREE.Vector3, private colors: EnergyColors, readonly o: GroundGetsugaOpts) {
    this.pos = from.clone();
    this.dir = dir.clone().setY(0).normalize();
    this.body.set(colors.body);
    this.core.set(colors.core);
  }

  update(dt: number, g: Game): void {
    const step = this.o.speed * dt;
    this.dist += step;
    this.pos.addScaledVector(this.dir, step);
    // hug the ground; off an edge it dies out
    const gy = groundAt(g, this.pos.x, this.pos.y + 1.6, this.pos.z, 5);
    if (gy === null) {
      this.done = true;
      return;
    }
    this.pos.y += (gy - this.pos.y) * Math.min(1, dt * 20);
    this.acc += step;
    if (this.acc > 0.8) {
      this.acc = 0;
      g.engine.destruction.carve(new SphereShape(this.pos.clone(), this.o.width, 0.7), { mode: 'explode', power: this.o.power, impulse: 12, dust: 0.7 });
    }
    // the wall of reiatsu: tongues rising off the line, dark ones for the black Getsuga
    const glow = g.engine.glow;
    const side = _w.set(-this.dir.z, 0, this.dir.x);
    for (let i = 0; i < 9; i++) {
      const s = (Math.random() - 0.5) * this.o.width * 1.6;
      const k = Math.random();
      const c = k < 0.35 ? this.core : this.body;
      glow.spawn({
        x: this.pos.x + side.x * s, y: this.pos.y + Math.random() * 0.5, z: this.pos.z + side.z * s,
        vx: this.dir.x * this.o.speed * 0.2, vy: 6 + Math.random() * 9, vz: this.dir.z * this.o.speed * 0.2,
        size: 0.5 + Math.random() * 0.45, sizeEnd: 0.1, life: 0.4 + Math.random() * 0.3, r: c.r, g: c.g, b: c.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 4, drag: 2,
      });
    }
    // the leading edge: a hot point where the wave tears into the ground
    glow.spawn({ x: this.pos.x, y: this.pos.y + 0.6, z: this.pos.z, size: 2.2, sizeEnd: 0.6, life: 0.12, r: this.core.r, g: this.core.g, b: this.core.b, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    if (this.colors.dark) {
      _c.set(this.colors.dark);
      g.engine.dust.spawn({ x: this.pos.x, y: this.pos.y + 0.6, z: this.pos.z, vx: 0, vy: 2.5, vz: 0, size: 0.6, sizeEnd: 1.6, life: 0.5, r: _c.r, g: _c.g, b: _c.b, alpha: 0.6, alphaEnd: 0, tex: TEX_PUFF, drag: 1 });
    }
    // whoever stands on the line is thrown up
    for (const o of g.enemiesOf(this.owner)) {
      if (this.hit.has(o.id)) continue;
      if (Math.hypot(o.pos.x - this.pos.x, o.pos.z - this.pos.z) > this.o.width + o.def.radius + 0.3) continue;
      if (o.pos.y - this.pos.y > 2.4 || this.pos.y - o.pos.y > 1.5) continue;
      this.hit.add(o.id);
      g.damage(o, this.o.damage, this.owner, this.dir.clone(), { energy: true, knock: 6, launch: 11, heavy: true, hitstop: 0.1, shake: 0.4 });
    }
    if (this.dist >= this.o.range) this.done = true;
  }

  dispose(): void {}
}

// ------------------------------------------------------------------ Deadly Darts

const BLADE_MID = 0.78;

/**
 * Zangetsu thrown on its cloth: the cleaver spins out along the throw, cutting what it passes, stops at
 * the end of the cloth (or in a wall) and is hauled back to the hand. A white cloth runs from the hand to
 * the hilt the whole time.
 */
export class ThrownBlade implements Projectile {
  done = false;
  returning = false;
  /** set when it is back in the hand */
  caught = false;
  readonly pos = new THREE.Vector3();
  private pivot = new THREE.Group();
  private mesh: PropMesh;
  private dir = new THREE.Vector3();
  private out = 0;
  private spin = 0;
  private hits = new Set<number>();
  private prev = new THREE.Vector3();
  private cloth: THREE.Mesh;
  private clothPos: Float32Array;
  private readonly N = 18;
  private t = 0;

  constructor(private g: Game, private owner: Fighter, model: VoxelModel, from: THREE.Vector3, target: THREE.Vector3, private hand: () => THREE.Vector3, readonly o: { speed: number; range: number; damage: number; cut: number }) {
    this.pos.copy(from);
    this.prev.copy(from);
    this.dir.subVectors(target, from).normalize();
    this.mesh = new PropMesh(model);
    // spin about the middle of the blade, not the grip
    this.mesh.position.set(0, 0, -BLADE_MID);
    this.pivot.add(this.mesh);
    this.pivot.position.copy(from);
    g.engine.gr.scene.add(this.pivot);
    // the cloth: a flat strip, rebuilt every step
    this.clothPos = new Float32Array(this.N * 2 * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.clothPos, 3));
    const idx: number[] = [];
    for (let i = 0; i < this.N - 1; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    geo.setIndex(idx);
    this.cloth = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#E9E5DD', roughness: 0.95, side: THREE.DoubleSide }));
    this.cloth.frustumCulled = false;
    this.cloth.castShadow = true;
    g.engine.gr.scene.add(this.cloth);
  }

  /** haul it back now */
  reel(): void {
    if (this.returning) return;
    this.returning = true;
    this.hits.clear();
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    this.prev.copy(this.pos);
    const h = this.hand();
    if (!this.returning) {
      const step = this.o.speed * dt;
      this.pos.addScaledVector(this.dir, step);
      this.out += step;
      if (this.out >= this.o.range) this.reel();
      // buried in something solid: stop there and come back
      const w = g.engine.world, vs = w.vs;
      if (w.isSolid(Math.floor(this.pos.x / vs), Math.floor(this.pos.y / vs), Math.floor(this.pos.z / vs)) && this.out > 2) {
        g.engine.destruction.carve(new SphereShape(this.pos.clone(), 1.3, 0.8), { mode: 'cut', power: this.o.cut, impulse: 8, dust: 0.5 });
        g.sfx.play('impact', this.pos, 0.8);
        this.reel();
      }
    } else {
      _v.subVectors(h, this.pos);
      const d = _v.length();
      const step = this.o.speed * 1.25 * dt;
      if (d <= step + 0.4) {
        this.caught = true;
        this.done = true;
        return;
      }
      this.pos.addScaledVector(_v.divideScalar(d), step);
    }
    // spin end over end, slanted
    this.spin += dt * 24;
    this.pivot.position.copy(this.pos);
    const yaw = Math.atan2(this.dir.x, this.dir.z);
    this.pivot.rotation.set(0, 0, 0);
    this.pivot.rotateY(yaw);
    this.pivot.rotateZ(0.5);
    this.pivot.rotateX(this.spin);
    // what it passes through is cut
    if (this.pos.distanceToSquared(this.prev) > 1e-4) g.engine.destruction.carve(new CapsuleShape(this.prev.clone(), this.pos.clone(), 0.85), { mode: 'cut', power: this.o.cut, dir: this.dir.clone(), sparks: [0.7, 0.85, 1], dust: 0.4 });
    for (const o of g.enemiesOf(this.owner)) {
      if (this.hits.has(o.id)) continue;
      const cy = Math.max(o.pos.y + 0.2, Math.min(o.pos.y + o.def.height - 0.2, this.pos.y));
      if (Math.hypot(o.pos.x - this.pos.x, cy - this.pos.y, o.pos.z - this.pos.z) > 0.95 + o.def.radius) continue;
      this.hits.add(o.id);
      const k = this.returning ? _w.subVectors(h, this.pos).normalize().clone() : this.dir.clone();
      g.damage(o, this.o.damage, this.owner, k, { energy: true, knock: this.returning ? -6 : 12, launch: 3, heavy: !this.returning, hitstop: 0.08, shake: 0.3 });
      g.sparks(o.center(), k, '#bfefff', 12);
    }
    if (Math.random() < 0.5) g.sfx.play('swing', this.pos, 0.35);
    this.updateCloth(h);
  }

  private updateCloth(h: THREE.Vector3): void {
    // the hilt end of the blade (the grip), in the world
    this.mesh.updateWorldMatrix(true, false);
    const grip = _w.set(0, 0, -0.55).applyMatrix4(this.mesh.matrixWorld);
    const span = h.distanceTo(grip);
    const sag = Math.min(1.6, span * 0.08) * (this.returning ? 1.4 : 0.6);
    const across = _v.subVectors(grip, h).cross(THREE.Object3D.DEFAULT_UP).normalize();
    if (!Number.isFinite(across.x)) across.set(1, 0, 0);
    const wid = 0.07;
    for (let i = 0; i < this.N; i++) {
      const u = i / (this.N - 1);
      const flutter = Math.sin(this.t * 14 + u * 9) * 0.08 * Math.sin(u * Math.PI);
      const x = h.x + (grip.x - h.x) * u + across.x * flutter;
      const y = h.y + (grip.y - h.y) * u - sag * 4 * u * (1 - u);
      const z = h.z + (grip.z - h.z) * u + across.z * flutter;
      const tw = Math.sin(u * 6 + this.t * 5) * wid;
      const k = i * 6;
      this.clothPos[k] = x - across.x * wid;
      this.clothPos[k + 1] = y + tw;
      this.clothPos[k + 2] = z - across.z * wid;
      this.clothPos[k + 3] = x + across.x * wid;
      this.clothPos[k + 4] = y - tw;
      this.clothPos[k + 5] = z + across.z * wid;
    }
    const attr = this.cloth.geometry.getAttribute('position') as THREE.BufferAttribute;
    attr.needsUpdate = true;
    this.cloth.geometry.computeVertexNormals();
  }

  dispose(): void {
    this.pivot.removeFromParent();
    this.cloth.removeFromParent();
    this.cloth.geometry.dispose();
    (this.cloth.material as THREE.Material).dispose();
  }
}

// ------------------------------------------------------------------ Getsuga Matoi

/** Black-crimson reiatsu licking up off the blade (called every step while Matoi holds). */
export function matoiFlames(g: Game, base: THREE.Vector3, tip: THREE.Vector3, colors: EnergyColors, n = 4): void {
  const glow = g.engine.glow;
  const body = _c.set(colors.body);
  const br = body.r, bg = body.g, bb = body.b;
  for (let i = 0; i < n; i++) {
    const u = Math.random();
    const x = base.x + (tip.x - base.x) * u, y = base.y + (tip.y - base.y) * u, z = base.z + (tip.z - base.z) * u;
    const dark = Math.random() < 0.55 && colors.dark;
    if (dark) {
      _c.set(colors.dark as THREE.ColorRepresentation);
      glow.spawn({ x, y, z, vx: (Math.random() - 0.5) * 0.6, vy: 1.6 + Math.random() * 1.4, vz: (Math.random() - 0.5) * 0.6, size: 0.14, sizeEnd: 0.03, life: 0.3, r: 0.25, g: 0.02, b: 0.05, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2.4, drag: 2 });
    } else {
      glow.spawn({ x, y, z, vx: (Math.random() - 0.5) * 0.5, vy: 1.4 + Math.random() * 1.6, vz: (Math.random() - 0.5) * 0.5, size: 0.1, sizeEnd: 0.02, life: 0.26, r: br, g: bg, b: bb, alpha: 0.95, alphaEnd: 0, tex: TEX_GLOW, drag: 2 });
    }
  }
}
