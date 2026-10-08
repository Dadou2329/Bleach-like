// Bazz-B's fire (docs/kits/bazzb.md): flames licking off the lit fingers, the burst of a burning fist, Burner Finger
// 1's beam (an instant thin line through everything on it), Burner Finger 2's twin slashes and the tall thin pillar
// each ends in, Burner Finger 3's lava (the floor's surface turned molten in a disc rolling out from where he points,
// burning and slowing whoever stands in it, cooling to a dark crust), Burner Finger 4's sword thrown spinning,
// Burning Full Fingers' spiralling cone, the Burning Stomp's ring of fire (the counter-flame: shots and fields round
// him are undone), the Glory Thief's marks.
import * as THREE from 'three';
import type { Fighter } from '../game/fighter';
import type { Game, Projectile } from '../game/game';
import type { EnergyColors } from './energy';
import { BoxShape, CapsuleShape, SphereShape } from '../destruction/shapes';
import { raycastVoxels } from '../voxel/raycast';
import { F_FOLIAGE, F_INDESTRUCTIBLE, F_LIQUID, F_SOLID } from '../voxel/materials';
import { PropMesh } from '../game/characterFactory';
import { bazzbProp, BZ_SWORD_TIP_Z } from '../chars/bazzb';
import { GetsugaProjectile } from '../game/projectiles/getsuga';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

export const FIRE_CORE = '#FFF6C8';
export const FIRE_HOT = '#FFC23A';
export const FIRE_BODY = '#FF7A1A';
export const FIRE_RIM = '#D9361C';
export const EMBER = '#FFB25C';
export const BF1_CORE = '#FFFBEA';
export const BF1_SHEATH = '#FF8A1E';
export const VOLL_RED = '#E3262F';
export const FIRE: EnergyColors = { core: FIRE_CORE, body: FIRE_BODY, rim: FIRE_RIM };

const UP = new THREE.Vector3(0, 1, 0);
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _q = new THREE.Quaternion();
const C_HOT = new THREE.Color(FIRE_HOT), C_BODY = new THREE.Color(FIRE_BODY), C_CORE = new THREE.Color(FIRE_CORE), C_RIM = new THREE.Color(FIRE_RIM);

/** a fire colour between the hot core and the red rim (k 0 → 1) */
function fireColor(k: number, out = new THREE.Color()): THREE.Color {
  return k < 0.5 ? out.copy(C_CORE).lerp(C_HOT, k * 2) : out.copy(C_HOT).lerp(k < 0.8 ? C_BODY : C_RIM, (k - 0.5) * 2);
}
const _c = new THREE.Color();

/** the ground under a point (the first solid voxel below it, within 6 m) */
function groundAt(g: Game, p: THREE.Vector3): number {
  const hit = raycastVoxels(g.engine.world, p.x, p.y + 0.5, p.z, 0, -1, 0, 6.5);
  return hit ? p.y + 0.5 - hit.dist : p.y - 6;
}

/** Flames licking off a point (lit fingertips, a burning fist, the sword's edge). */
export function flameLick(g: Game, at: THREE.Vector3, k = 1, n = 2): void {
  for (let i = 0; i < n; i++) {
    fireColor(Math.random() * 0.9, _c);
    g.engine.glow.spawn({ x: at.x + (Math.random() - 0.5) * 0.06 * k, y: at.y, z: at.z + (Math.random() - 0.5) * 0.06 * k, vx: (Math.random() - 0.5) * 0.4, vy: 1 + Math.random() * 1.4, vz: (Math.random() - 0.5) * 0.4, size: 0.12 * k, sizeEnd: 0.02, life: 0.3 + Math.random() * 0.2, r: _c.r, g: _c.g, b: _c.b, alpha: 0.95, alphaEnd: 0, tex: TEX_GLOW, drag: 1 });
  }
}

/** A burst of fire where a burning blow lands. */
export function fireBurst(g: Game, at: THREE.Vector3, dir: THREE.Vector3, k = 1): void {
  g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, size: 0.7 * k, sizeEnd: 1.4 * k, life: 0.16, r: 1, g: 0.8, b: 0.45, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
  for (let i = 0; i < 12 * k; i++) {
    fireColor(Math.random(), _c);
    const a = Math.random() * Math.PI * 2;
    g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, vx: dir.x * 4 + Math.cos(a) * 3, vy: Math.random() * 3.5, vz: dir.z * 4 + Math.sin(a) * 3, size: 0.18 * k, sizeEnd: 0.04, life: 0.3 + Math.random() * 0.25, r: _c.r, g: _c.g, b: _c.b, alpha: 1, alphaEnd: 0, tex: Math.random() < 0.5 ? TEX_STREAK : TEX_GLOW, stretch: 1.5, drag: 2.5 });
  }
  for (let i = 0; i < 3; i++) g.engine.dust.spawn({ x: at.x, y: at.y, z: at.z, vx: (Math.random() - 0.5) * 1.5, vy: 1 + Math.random(), vz: (Math.random() - 0.5) * 1.5, size: 0.4 * k, sizeEnd: 1.2 * k, life: 0.9, r: 0.23, g: 0.17, b: 0.15, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 1.5 });
}

/** a fighter's nearest point on its axis to a line, and whether the line passes within r of it */
function lineHits(f: Fighter, from: THREE.Vector3, dir: THREE.Vector3, len: number, r: number, out: THREE.Vector3): boolean {
  const c = f.center();
  const along = _a.subVectors(c, from).dot(dir);
  if (along < -0.3 || along > len + 0.3) return false;
  out.copy(from).addScaledVector(dir, Math.max(0, Math.min(len, along)));
  const cy = Math.max(f.pos.y + 0.15, Math.min(f.pos.y + f.def.height - 0.15, out.y));
  return Math.hypot(f.pos.x - out.x, cy - out.y, f.pos.z - out.z) <= f.def.radius + r;
}

// ------------------------------------------------------------------ Burner Finger 1

export interface BeamOpts {
  damage: number;
  range?: number;
  /** thickness (1 = a finger's width; more for the Vollständig's) */
  width?: number;
  power?: number;
  /** walls it holes before it stops boring (it still flies on through) */
  walls?: number;
  /** a hit on a fighter (statuses) */
  onHit?: (f: Fighter) => void;
}

/**
 * Burner Finger 1: an instant thin beam from the fingertip — through every fighter on the line, a straight round hole
 * through every wall it meets — a white core in an orange sheath, gone in a quarter of a second.
 */
export class BurnerBeam implements Projectile {
  done = false;
  private t = 0;
  private core: THREE.Mesh;
  private sheath: THREE.Mesh;
  private coreMat: THREE.MeshBasicMaterial;
  private sheathMat: THREE.MeshBasicMaterial;
  private width: number;
  readonly len: number;

  constructor(private g: Game, readonly owner: Fighter, readonly from: THREE.Vector3, readonly dir: THREE.Vector3, readonly o: BeamOpts) {
    dir.normalize();
    const range = (this.len = o.range ?? 60);
    const w = (this.width = o.width ?? 1);
    // through the world: a straight round hole through each wall on the line
    const world = g.engine.world;
    let at = 0;
    for (let walls = 0; walls < (o.walls ?? 6) && at < range; walls++) {
      const p = _b.copy(from).addScaledVector(dir, at);
      const hit = raycastVoxels(world, p.x, p.y, p.z, dir.x, dir.y, dir.z, range - at);
      if (!hit) break;
      const d0 = at + hit.dist;
      const a = from.clone().addScaledVector(dir, d0 - 0.15), b = from.clone().addScaledVector(dir, d0 + 2.6);
      g.engine.destruction.carve(new CapsuleShape(a, b, 0.16 * w + 0.04), { mode: 'bore', power: o.power ?? 900, sparks: [1, 0.62, 0.25], dust: 0.4, impulse: 6, debris: 0.08 });
      fireBurst(g, a, dir.clone().negate(), 0.6);
      at = d0 + 2.6;
    }
    // through every fighter on the line
    const near = new THREE.Vector3();
    for (const e of g.enemiesOf(owner)) {
      if (e.dead || !lineHits(e, from, dir, range, 0.12 * w + 0.12, near)) continue;
      g.damage(e, o.damage, owner, dir, { energy: true, knock: 5, hitstop: 0.05, shake: 0.2, color: BF1_SHEATH });
      fireBurst(g, near, dir, 0.7);
      o.onHit?.(e);
    }
    g.engine.glow.spawn({ x: from.x, y: from.y, z: from.z, size: 0.35 * w, sizeEnd: 0.8 * w, life: 0.1, r: 1, g: 0.95, b: 0.8, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    // the beam: two open cylinders along +Z, scaled to the range
    const geo = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true);
    geo.translate(0, 0.5, 0);
    geo.rotateX(Math.PI / 2);
    this.coreMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(BF1_CORE).multiplyScalar(3), transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
    this.sheathMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(BF1_SHEATH).multiplyScalar(1.6), transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.core = new THREE.Mesh(geo, this.coreMat);
    this.sheath = new THREE.Mesh(geo, this.sheathMat);
    for (const m of [this.core, this.sheath]) {
      m.position.copy(from);
      m.lookAt(_a.copy(from).add(dir));
      m.frustumCulled = false;
      m.renderOrder = 7;
      g.engine.gr.scene.add(m);
    }
    this.render();
  }

  update(dt: number): void {
    this.t += dt;
    if (this.t >= 0.28) this.done = true;
  }

  render(): void {
    const k = Math.max(0, 1 - this.t / 0.28);
    const w = this.width;
    this.core.scale.set(0.035 * w * (0.4 + 0.6 * k), 0.035 * w * (0.4 + 0.6 * k), this.len);
    this.sheath.scale.set(0.1 * w * (0.6 + 0.6 * k), 0.1 * w * (0.6 + 0.6 * k), this.len);
    this.coreMat.opacity = k;
    this.sheathMat.opacity = 0.7 * k * k;
  }

  dispose(): void {
    this.core.removeFromParent();
    this.sheath.removeFromParent();
    this.core.geometry.dispose();
    this.coreMat.dispose();
    this.sheathMat.dispose();
  }
}

// ------------------------------------------------------------------ Burner Finger 2

/** A tall thin column of fire bursting up from the ground (where Burner Finger 2's slashes end). */
export class FlamePillar implements Projectile {
  done = false;
  private t = 0;
  private hit = false;
  private base: THREE.Vector3;
  private col: THREE.Mesh;
  private core: THREE.Mesh;
  private colMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(FIRE_BODY).multiplyScalar(1.5), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  private coreMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(FIRE_CORE).multiplyScalar(2.2), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });

  constructor(private g: Game, readonly owner: Fighter, at: THREE.Vector3, readonly damage: number, readonly radius = 1.5, readonly height = 9) {
    this.base = at.clone();
    this.base.y = Math.min(at.y, groundAt(g, at) + 0.05);
    // the column: an open cylinder of flame round a hot core, tapering to the top
    const geo = new THREE.CylinderGeometry(0.35, 1, 1, 14, 1, true);
    geo.translate(0, 0.5, 0);
    this.col = new THREE.Mesh(geo, this.colMat);
    this.core = new THREE.Mesh(geo, this.coreMat);
    for (const m of [this.col, this.core]) {
      m.position.copy(this.base);
      m.frustumCulled = false;
      m.renderOrder = 6;
      g.engine.gr.scene.add(m);
    }
  }

  render(): void {
    const k = this.t / 0.8;
    const up = Math.min(1, this.t / 0.12);
    const r = this.radius * (0.55 + 0.45 * Math.min(1, this.t / 0.1)) * (1 - k * 0.5);
    this.col.scale.set(r, this.height * up, r);
    this.core.scale.set(r * 0.4, this.height * up * 0.92, r * 0.4);
    this.colMat.opacity = 0.75 * Math.max(0, 1 - k * k);
    this.coreMat.opacity = 0.9 * Math.max(0, 1 - k * 1.3);
  }

  update(dt: number): void {
    const { g, base } = this;
    this.t += dt;
    if (!this.hit) {
      this.hit = true;
      g.engine.destruction.carve(new SphereShape(base.clone().add(_a.set(0, 0.3, 0)), this.radius, 0.7), { mode: 'explode', power: 700, impulse: 12 });
      g.addRing(base.clone(), this.radius * 2.6, FIRE_BODY, 0.5);
      g.sfx.play('explode', base, 0.9);
      for (const e of g.enemiesOf(this.owner)) {
        const d = Math.hypot(e.pos.x - base.x, e.pos.z - base.z);
        if (e.dead || d > this.radius + e.def.radius || e.pos.y > base.y + this.height || e.pos.y + e.def.height < base.y - 0.5) continue;
        g.damage(e, this.damage, this.owner, _a.set(e.pos.x - base.x, 0, e.pos.z - base.z).normalize(), { energy: true, knock: 4, launch: 9, heavy: true, hitstop: 0.08, shake: 0.4, color: FIRE_BODY });
      }
      if (g.player && g.player.pos.distanceTo(base) < 40) g.shake(0.3);
    }
    // the column: flames streaming up fast, thinning with height
    const k = Math.max(0, 1 - this.t / 0.7);
    for (let i = 0; i < 14 * k; i++) {
      const h = Math.random();
      const r = this.radius * 0.55 * (1 - h * 0.6) * Math.sqrt(Math.random());
      const a = Math.random() * Math.PI * 2;
      fireColor(h * 0.9 + Math.random() * 0.1, _c);
      g.engine.glow.spawn({ x: base.x + Math.cos(a) * r, y: base.y + h * this.height * 0.85, z: base.z + Math.sin(a) * r, vx: 0, vy: 9 + Math.random() * 6, vz: 0, size: 0.6 * (1 - h * 0.5), sizeEnd: 0.1, life: 0.3 + Math.random() * 0.2, r: _c.r, g: _c.g, b: _c.b, alpha: 0.95, alphaEnd: 0, tex: Math.random() < 0.3 ? TEX_STREAK : TEX_GLOW, stretch: 1.2, drag: 1 });
    }
    if (this.t >= 0.8) this.done = true;
  }

  dispose(): void {
    this.col.removeFromParent();
    this.core.removeFromParent();
    this.col.geometry.dispose();
    this.colMat.dispose();
    this.coreMat.dispose();
  }
}

/**
 * Burner Finger 2: two fingers' flame dragged into two diagonal slashes that fly on (crescents of fire cutting
 * through what they pass); each ends in a FlamePillar on the first fighter it cuts, or where it runs out.
 */
export class TwinFlame implements Projectile {
  done = false;
  private slashes: GetsugaProjectile[] = [];
  private ended = [false, false];
  private hitAt: (THREE.Vector3 | null)[] = [null, null];
  private pillar: number;
  private scale: number;

  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, dir: THREE.Vector3, o: { damage: number; pillar: number; scale?: number; range?: number }) {
    const k = o.scale ?? 1;
    const flat = dir.clone().setY(0).normalize();
    const right = _a.crossVectors(flat, UP).normalize().clone();
    [-1, 1].forEach((s, i) => {
      // the slashes lean the way the fingers were dragged: down and across
      const side = right.clone().multiplyScalar(0.8).addScaledVector(UP, 0.6 * s).normalize();
      const start = from.clone().addScaledVector(right, 0.35 * s).addScaledVector(UP, 0.15 * s);
      const sl = new GetsugaProjectile(g, owner, start, dir.clone(), side, {
        radius: 1.6 * k, halfAngle: 0.8, speed: 40, range: o.range ?? 24, damage: o.damage, cut: 900, colors: FIRE, band: 0.5 * k,
        onHit: (f) => { if (!this.hitAt[i]) this.hitAt[i] = f.pos.clone(); },
      });
      this.slashes.push(sl);
      g.addProjectile(sl);
    });
    this.pillar = o.pillar;
    this.scale = k;
  }

  update(): void {
    for (let i = 0; i < 2; i++) {
      if (this.ended[i]) continue;
      const sl = this.slashes[i];
      const at = this.hitAt[i] ?? (sl.done ? sl.pos : null);
      if (!at) continue;
      this.ended[i] = true;
      if (this.hitAt[i]) sl.done = true;
      this.g.addProjectile(new FlamePillar(this.g, this.owner, at, this.pillar, 1.5 * this.scale, 9 * this.scale));
    }
    if (this.ended[0] && this.ended[1]) this.done = true;
  }

  dispose(): void {}
}

// ------------------------------------------------------------------ Burner Finger 3

interface LavaCell { x: number; y: number; z: number; m: number; d: number; tuft: number }

/**
 * Burner Finger 3: the floor's surface turns to lava in a disc rolling out from where he points (0.6 s), glowing,
 * bubbling and smoking; whoever stands in it burns and wades slowly; at the end it cools to a dark crust.
 */
export class LavaField implements Projectile {
  done = false;
  private t = 0;
  private tick = 0;
  private lit = 0;
  private cells: LavaCell[] = [];
  private molten: number;
  private crust: number;
  readonly center: THREE.Vector3;

  constructor(private g: Game, readonly owner: Fighter, at: THREE.Vector3, readonly radius = 7, readonly life = 8, readonly dps = 18) {
    const w = g.engine.world, vs = w.vs;
    this.molten = w.mats.has('magma') ? w.mats.id('magma') : w.mats.id('molten');
    this.crust = w.mats.has('scorched') ? w.mats.id('scorched') : w.mats.id('stone_dark');
    this.center = at.clone();
    this.center.y = groundAt(g, at);
    const R = Math.ceil(radius / vs);
    const cx = Math.floor(at.x / vs), cz = Math.floor(at.z / vs);
    const yTop = Math.floor((this.center.y + 2.5) / vs), yBot = Math.floor((this.center.y - 3) / vs);
    for (let dx = -R; dx <= R; dx++)
      for (let dz = -R; dz <= R; dz++) {
        // a ragged edge: the disc's rim wobbles
        const d = Math.hypot(dx, dz) * vs;
        const a = Math.atan2(dz, dx);
        if (d > radius * (0.9 + 0.1 * Math.sin(a * 5 + at.x))) continue;
        const x = cx + dx, z = cz + dz;
        let tuft = -1;
        for (let y = yTop; y >= yBot; y--) {
          if (!w.inBounds(x, y, z)) continue;
          const m = w.get(x, y, z);
          if (m === 0) continue;
          const f = w.mats.flags[m];
          // grass tufts burn away; the ground under them melts
          if (f & F_FOLIAGE) {
            tuft = y;
            continue;
          }
          // the top solid voxel; not the indestructible floor, not water
          if ((f & F_SOLID) && !(f & (F_LIQUID | F_INDESTRUCTIBLE)) && m !== this.molten) this.cells.push({ x, y, z, m, d, tuft });
          break;
        }
      }
    this.cells.sort((p, q) => p.d - q.d);
  }

  /** cool it now (a newer field replaces it) */
  cool(): void {
    this.t = Math.max(this.t, this.life);
  }

  /** is this fighter standing in the lava? */
  inside(f: Fighter): boolean {
    const reach = this.radius * Math.min(1, this.t / 0.6);
    return f.grounded && Math.hypot(f.pos.x - this.center.x, f.pos.z - this.center.z) < reach && Math.abs(f.pos.y - this.center.y) < 1.6;
  }

  update(dt: number): void {
    const { g } = this;
    const w = g.engine.world;
    this.t += dt;
    if (this.t < this.life) {
      // rolling out from the centre
      const reach = this.radius * Math.min(1, this.t / 0.6);
      while (this.lit < this.cells.length && this.cells[this.lit].d <= reach) {
        const c = this.cells[this.lit++];
        if (c.tuft >= 0 && w.mats.flags[w.get(c.x, c.tuft, c.z)] & F_FOLIAGE) w.set(c.x, c.tuft, c.z, 0);
        if (w.get(c.x, c.y, c.z) === c.m) w.set(c.x, c.y, c.z, this.molten);
      }
      // it burns whoever stands in it
      this.tick -= dt;
      if (this.tick <= 0) {
        this.tick = 0.25;
        for (const e of g.enemiesOf(this.owner)) {
          if (e.dead || !this.inside(e)) continue;
          g.drain(e, this.dps * 0.25, this.owner);
          e.slow(0.45, 0.4);
          flameLick(g, e.pos.clone().add(_a.set(0, 0.2, 0)), 2.4, 4);
        }
      }
      // bubbles, spurts and smoke over the surface
      const n = this.lit;
      if (n > 0) {
        const vs = w.vs;
        for (let i = 0; i < 6; i++) {
          const c = this.cells[Math.floor(Math.random() * n)];
          const x = (c.x + 0.5) * vs, y = (c.y + 1) * vs, z = (c.z + 0.5) * vs;
          fireColor(0.3 + Math.random() * 0.6, _c);
          g.engine.glow.spawn({ x, y, z, vx: (Math.random() - 0.5) * 0.6, vy: 0.6 + Math.random() * 2.2, vz: (Math.random() - 0.5) * 0.6, size: 0.14, sizeEnd: 0.03, life: 0.5 + Math.random() * 0.5, r: _c.r, g: _c.g, b: _c.b, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, gravity: -4 });
        }
        if (Math.random() < 0.35) {
          const c = this.cells[Math.floor(Math.random() * n)];
          g.engine.dust.spawn({ x: (c.x + 0.5) * w.vs, y: (c.y + 1) * w.vs + 0.2, z: (c.z + 0.5) * w.vs, vx: 0, vy: 0.8, vz: 0, size: 0.8, sizeEnd: 2.6, life: 1.8, r: 0.23, g: 0.17, b: 0.15, alpha: 0.35, alphaEnd: 0, tex: TEX_PUFF, drag: 0.5 });
        }
      }
      return;
    }
    // it cools to a crust
    for (let i = 0; i < this.lit; i++) {
      const c = this.cells[i];
      if (w.get(c.x, c.y, c.z) === this.molten) w.set(c.x, c.y, c.z, this.crust);
    }
    this.done = true;
  }

  dispose(): void {}
}

// ------------------------------------------------------------------ Burner Finger 4

/** Burner Finger 4's sword hurled: it flies on spinning flat, cutting through everything in its disc. */
export class ThrownFlameSword implements Projectile {
  done = false;
  private t = 0;
  private travelled = 0;
  private spin = 0;
  private hit = new Set<number>();
  private mesh: PropMesh;
  readonly pos: THREE.Vector3;

  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, readonly dir: THREE.Vector3, readonly damage = 50, readonly speed = 30, readonly range = 42) {
    this.pos = from.clone();
    this.dir.normalize();
    this.mesh = new PropMesh(bazzbProp('flame'));
    this.mesh.castShadow = false;
    g.engine.gr.scene.add(this.mesh);
  }

  update(dt: number): void {
    const { g } = this;
    this.t += dt;
    const step = this.speed * dt;
    this.pos.addScaledVector(this.dir, step);
    this.travelled += step;
    this.spin += dt * 16;
    const half = BZ_SWORD_TIP_Z / 2;
    // the disc it sweeps: a flat slab round the spinning centre
    _q.setFromAxisAngle(UP, this.spin);
    const r = g.engine.destruction.carve(new BoxShape(this.pos.clone(), new THREE.Vector3(half, 0.12, half), _q.clone()), { mode: 'cut', power: 1800, dir: this.dir.clone(), sparks: [1, 0.6, 0.2], dust: 0.4 });
    if (r.removed > 200 && g.player && this.pos.distanceTo(g.player.pos) < 40) g.shake(0.06);
    for (const e of g.enemiesOf(this.owner)) {
      if (this.hit.has(e.id) || e.dead) continue;
      if (Math.hypot(e.pos.x - this.pos.x, e.pos.z - this.pos.z) > half + e.def.radius) continue;
      if (this.pos.y < e.pos.y - 0.3 || this.pos.y > e.pos.y + e.def.height + 0.3) continue;
      this.hit.add(e.id);
      g.damage(e, this.damage, this.owner, this.dir, { energy: true, knock: 14, launch: 3, heavy: true, hitstop: 0.1, shake: 0.4, color: FIRE_BODY });
      fireBurst(g, e.center(), this.dir, 1.2);
    }
    for (let i = 0; i < 4; i++) {
      const a = this.spin + (i / 4) * Math.PI * 2;
      flameLick(g, _a.copy(this.pos).add(_b.set(Math.cos(a) * half, 0, Math.sin(a) * half)), 2.2, 1);
    }
    if (this.travelled >= this.range) {
      fireBurst(g, this.pos, this.dir, 2);
      this.done = true;
    }
  }

  render(): void {
    // the sword's middle on the centre, the blade level, turning
    this.mesh.quaternion.setFromAxisAngle(UP, this.spin);
    this.mesh.position.copy(this.pos).addScaledVector(_a.set(0, 0, 1).applyQuaternion(this.mesh.quaternion), -BZ_SWORD_TIP_Z / 2);
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.material.dispose();
  }
}

// ------------------------------------------------------------------ Burning Full Fingers

/**
 * Burning Full Fingers: fire on all five fingertips, five streams spiralling round each other into one cone of
 * flame; it burns what it touches (flammables char, the rest scorches) and hurts every enemy in it.
 */
export class FullFingers implements Projectile {
  done = false;
  private t = 0;
  private tick = 0;
  private carveT = 0;

  constructor(private g: Game, readonly owner: Fighter, private origin: () => THREE.Vector3, private aim: () => THREE.Vector3, readonly o: { dur?: number; range?: number; half?: number; dps?: number } = {}) {}

  get dur(): number {
    return this.o.dur ?? 1.6;
  }

  update(dt: number): void {
    const { g } = this;
    this.t += dt;
    if (this.owner.dead || this.owner.hitstun > 0.3) {
      this.done = true;
      return;
    }
    const range = this.o.range ?? 10, half = this.o.half ?? 0.3;
    const from = this.origin();
    const dir = this.aim();
    const right = _a.crossVectors(dir, UP);
    if (right.lengthSq() < 1e-4) right.set(1, 0, 0);
    right.normalize();
    const up = _b.crossVectors(right, dir).normalize();
    // five streams spiralling out of the fingertips into the cone
    for (let s = 0; s < 5; s++)
      for (let i = 0; i < 6; i++) {
        const u = Math.pow(Math.random(), 0.8);
        const th = this.t * 14 + (s / 5) * Math.PI * 2 + u * 5;
        const rr = Math.tan(half) * range * u * (0.5 + 0.5 * Math.random());
        const px = from.x + dir.x * range * u + (right.x * Math.cos(th) + up.x * Math.sin(th)) * rr;
        const py = from.y + dir.y * range * u + (right.y * Math.cos(th) + up.y * Math.sin(th)) * rr;
        const pz = from.z + dir.z * range * u + (right.z * Math.cos(th) + up.z * Math.sin(th)) * rr;
        // white-hot at the fingers, orange, then red and smoky at the far end
        fireColor(Math.min(1, u * 1.1 + Math.random() * 0.15), _c);
        g.engine.glow.spawn({ x: px, y: py, z: pz, vx: dir.x * 14 + (Math.random() - 0.5) * 2, vy: dir.y * 14 + 1.5, vz: dir.z * 14 + (Math.random() - 0.5) * 2, size: 0.35 + u * 1.6, sizeEnd: 0.15 + u * 0.6, life: 0.16 + Math.random() * 0.12, r: _c.r * 0.9, g: _c.g * 0.8, b: _c.b * 0.7, alpha: 0.8, alphaEnd: 0, tex: Math.random() < 0.5 ? TEX_PUFF : TEX_GLOW, drag: 2 });
      }
    if (Math.random() < 0.4) g.engine.dust.spawn({ x: from.x + dir.x * range, y: from.y + dir.y * range + 0.5, z: from.z + dir.z * range, vx: 0, vy: 1.4, vz: 0, size: 1.2, sizeEnd: 3.4, life: 1.4, r: 0.22, g: 0.16, b: 0.14, alpha: 0.4, alphaEnd: 0, tex: TEX_PUFF, drag: 0.6 });
    // it burns the world in the cone
    this.carveT -= dt;
    if (this.carveT <= 0) {
      this.carveT = 0.06;
      const u = 0.35 + Math.random() * 0.65;
      const p = from.clone().addScaledVector(dir, range * u);
      g.engine.destruction.carve(new SphereShape(p, 0.5 + Math.tan(half) * range * u * 0.6, 0.7), { mode: 'burn', power: 400 });
      if (Math.random() < 0.3) g.engine.destruction.carve(new SphereShape(p, 0.6, 0.6), { mode: 'explode', power: 260, impulse: 6, dust: 0.3 });
    }
    // and whoever stands in it
    this.tick -= dt;
    if (this.tick <= 0) {
      this.tick = 0.1;
      for (const e of g.enemiesOf(this.owner)) {
        if (e.dead) continue;
        const to = e.center().sub(from);
        const along = to.dot(dir);
        if (along < 0 || along > range + e.def.radius) continue;
        const off = to.addScaledVector(dir, -along).length();
        if (off > Math.tan(half) * along + e.def.radius + 0.4) continue;
        g.damage(e, (this.o.dps ?? 60) * 0.1, this.owner, dir, { energy: true, quiet: this.t > 0.15, knock: 2.5, hitstop: 0.02, color: FIRE_BODY });
      }
    }
    if (this.t >= this.dur) this.done = true;
  }

  dispose(): void {}
}

// ------------------------------------------------------------------ the Burning Stomp

/**
 * The Burning Stomp: a torrent of fire and heat rolling out from his boot in a ring — it blows the fields, fog and
 * shots round him away (the counter-flame), throws everyone near off their feet and scorches the ground.
 */
export class FireRing implements Projectile {
  done = false;
  private t = 0;
  private hit = new Set<number>();

  constructor(private g: Game, readonly owner: Fighter, readonly at: THREE.Vector3, readonly radius = 5, readonly damage = 30) {
    g.rejectNear(owner.center(), radius, owner, true);
    g.addRing(at.clone(), radius * 1.6, FIRE_BODY, 0.6);
    g.sfx.play('explode', at, 0.7);
    if (g.player && g.player.pos.distanceTo(at) < 30) g.shake(0.35);
  }

  update(dt: number): void {
    const { g, at } = this;
    this.t += dt;
    const r = this.radius * Math.min(1, this.t / 0.35);
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2;
      fireColor(0.2 + Math.random() * 0.7, _c);
      g.engine.glow.spawn({ x: at.x + Math.cos(a) * r, y: at.y + 0.2 + Math.random() * 0.4, z: at.z + Math.sin(a) * r, vx: Math.cos(a) * 4, vy: 2 + Math.random() * 3, vz: Math.sin(a) * 4, size: 0.5, sizeEnd: 0.1, life: 0.35, r: _c.r, g: _c.g, b: _c.b, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW, drag: 2 });
    }
    for (const e of g.enemiesOf(this.owner)) {
      if (this.hit.has(e.id) || e.dead) continue;
      const d = Math.hypot(e.pos.x - at.x, e.pos.z - at.z);
      if (d > r + e.def.radius || Math.abs(e.pos.y - at.y) > 2) continue;
      this.hit.add(e.id);
      g.damage(e, this.damage, this.owner, _a.set(e.pos.x - at.x, 0, e.pos.z - at.z).normalize(), { energy: true, knock: 10, launch: 6, heavy: true, hitstop: 0.08, shake: 0.3, color: FIRE_BODY });
    }
    if (this.t < 0.36) g.engine.destruction.carve(new SphereShape(at.clone(), r, 0.4), { mode: 'burn', power: 300 });
    if (this.t >= 0.45) this.done = true;
  }

  dispose(): void {}
}

/** The Glory Thief's mark over a target: a red Zeichen ring flaring over its head. */
export function gloryMark(g: Game, t: Fighter): void {
  const p = t.pos.clone().add(_a.set(0, t.def.height + 0.6, 0));
  g.addRing(p, 1.4, VOLL_RED, 0.5);
  g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.9, sizeEnd: 0.3, life: 0.6, r: 0.89, g: 0.15, b: 0.18, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
}
