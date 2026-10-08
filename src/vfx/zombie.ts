// Giselle's Zombie (docs/kits/giselle.md). BloodSpray: the shared pool of voxel blood drops (dark, glossy red cubes)
// every blood effect throws. BloodDrops: drops of her blood flung or flicked at someone — they fly on gravity, dose
// whoever they touch (the kit's onHit) and leave puddles where they land. BloodPools: those puddles, dark wet decals
// on the ground that dose an enemy standing in them. bloodBurst(): a spurt of blood out of a body (the Bait drench).
// SkullArrow: the bone bow's skull-headed arrow; the skull bites what it hits. ShadowGate: a black pool with a purple
// rim opening under a zombie as it climbs out of her shadow. BonePin: a smashed skeleton's bones flying back at the
// target and pinning its limbs. BoneRattle: bones shaken out of Azhalbiora's wings, falling. infectionTint(): a body
// reddening as her blood spreads through it (and the dead red of her zombies).
import * as THREE from 'three';
import type { Fighter } from '../game/fighter';
import type { Game, Projectile } from '../game/game';
import { SphereShape } from '../destruction/shapes';
import { raycastVoxels } from '../voxel/raycast';
import { PropMesh } from '../game/characterFactory';
import { BONE_LEN, giselleProp } from '../chars/giselle';
import { groundAt } from './iceArts';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

export const BLOOD_FRESH = '#B3122A';
export const BLOOD_DARK = '#8C0F1C';
export const AZHAL = '#9A5CF2';
export const AZHAL_LIGHT = '#D9C2FF';
export const AZHAL_GLOW = '#6A2BC7';

const C_DEEP = new THREE.Color('#4A0610');
const C_FRESH = new THREE.Color(BLOOD_FRESH);
const C_AZ = new THREE.Color(AZHAL);
const C_AZL = new THREE.Color(AZHAL_LIGHT);
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const ZP = new THREE.Vector3(0, 0, 1);

// ------------------------------------------------------------------ the drops

const MAXD = 1200;

/** Voxel blood: glossy dark-red cubes that fall and vanish where they land. */
export class BloodSpray implements Projectile {
  done = false;
  private mesh: THREE.InstancedMesh;
  private p = new Float32Array(MAXD * 3);
  private v = new Float32Array(MAXD * 3);
  private life = new Float32Array(MAXD);
  private age = new Float32Array(MAXD);
  private size = new Float32Array(MAXD);
  private tint = new Float32Array(MAXD);
  private next = 0;
  private c = new THREE.Color();

  constructor(private g: Game) {
    const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.12, metalness: 0, emissive: new THREE.Color('#2A0006'), emissiveIntensity: 0.6 });
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, MAXD);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAXD * 3), 3);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    g.engine.gr.scene.add(this.mesh);
  }

  /** the shared pool (created on first use) */
  static of(g: Game): BloodSpray {
    const d = g as unknown as { bloodSpray?: BloodSpray };
    if (!d.bloodSpray || d.bloodSpray.done) {
      d.bloodSpray = new BloodSpray(g);
      g.addProjectile(d.bloodSpray);
    }
    return d.bloodSpray;
  }

  /** one drop; tint 0 = dark … 1 = fresh */
  spawn(x: number, y: number, z: number, vx: number, vy: number, vz: number, size = 0.06, life = 1.0, tint = 0.6): void {
    const i = this.next;
    this.next = (this.next + 1) % MAXD;
    this.p[i * 3] = x; this.p[i * 3 + 1] = y; this.p[i * 3 + 2] = z;
    this.v[i * 3] = vx; this.v[i * 3 + 1] = vy; this.v[i * 3 + 2] = vz;
    this.life[i] = life;
    this.age[i] = 0;
    this.size[i] = size;
    this.tint[i] = tint;
  }

  update(dt: number): void {
    const w = this.g.engine.world;
    const drag = Math.exp(-0.8 * dt);
    for (let i = 0; i < MAXD; i++) {
      if (this.age[i] >= this.life[i]) continue;
      this.age[i] += dt;
      const o = i * 3;
      this.v[o] *= drag;
      this.v[o + 2] *= drag;
      this.v[o + 1] -= 16 * dt;
      this.p[o] += this.v[o] * dt;
      this.p[o + 1] += this.v[o + 1] * dt;
      this.p[o + 2] += this.v[o + 2] * dt;
      if (this.v[o + 1] < 0 && w.isSolidAtPos(this.p[o], this.p[o + 1], this.p[o + 2])) this.age[i] = this.life[i];
    }
  }

  render(): void {
    let n = 0;
    for (let i = 0; i < MAXD; i++) {
      if (this.age[i] >= this.life[i]) continue;
      const k = this.age[i] / this.life[i];
      const s = this.size[i] * (k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1);
      if (s <= 0.004) continue;
      const o = i * 3;
      _m.makeScale(s, s, s).setPosition(this.p[o], this.p[o + 1], this.p[o + 2]);
      this.mesh.setMatrixAt(n, _m);
      this.c.copy(C_DEEP).lerp(C_FRESH, this.tint[i]);
      this.mesh.setColorAt(n, this.c);
      n++;
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

/** a spurt of blood out of a body: drops thrown along dir (and a little everywhere), a dark puff */
export function bloodBurst(g: Game, p: THREE.Vector3, dir: THREE.Vector3 | null, n = 24, speed = 5): void {
  const sp = BloodSpray.of(g);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, u = Math.random() * 2 - 1;
    const r = Math.sqrt(1 - u * u);
    let vx = Math.cos(a) * r, vy = Math.abs(u) * 0.8 + 0.3, vz = Math.sin(a) * r;
    if (dir) {
      vx = vx * 0.45 + dir.x;
      vy = vy * 0.45 + Math.max(0.2, dir.y);
      vz = vz * 0.45 + dir.z;
    }
    const s = speed * (0.5 + Math.random() * 0.7);
    sp.spawn(p.x, p.y, p.z, vx * s, vy * s, vz * s, 0.04 + Math.random() * 0.05, 0.6 + Math.random() * 0.6, Math.random());
  }
  for (let i = 0; i < 3; i++) g.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, vx: (dir?.x ?? 0) * 2, vy: 0.4, vz: (dir?.z ?? 0) * 2, size: 0.25, sizeEnd: 0.7, life: 0.4, r: 0.42, g: 0.02, b: 0.06, alpha: 0.6, alphaEnd: 0, tex: TEX_PUFF });
}

// ------------------------------------------------------------------ the puddles

interface Pool { p: THREE.Vector3; r: number; life: number; age: number; seed: number }
const MAXP = 32;

/** Her blood on the ground: dark wet patches; an enemy standing in one is dosed (onStand) every step. */
export class BloodPools implements Projectile {
  done = false;
  private pools: Pool[] = [];
  private mesh: THREE.InstancedMesh;

  constructor(private g: Game, readonly owner: Fighter, readonly onStand: (o: Fighter, dt: number) => void) {
    const mat = new THREE.MeshStandardMaterial({ color: '#4E0812', roughness: 0.08, metalness: 0.05, transparent: true, opacity: 0.92, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const geo = new THREE.CircleGeometry(1, 14).rotateX(-Math.PI / 2);
    this.mesh = new THREE.InstancedMesh(geo, mat, MAXP * 3);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    this.mesh.receiveShadow = true;
    g.engine.gr.scene.add(this.mesh);
  }

  /** a puddle at p (merged into one close by) */
  add(p: THREE.Vector3, r = 0.55, life = 10): void {
    const gy = groundAt(this.g, p.x, p.y + 0.6, p.z, 3);
    if (gy === null) return;
    const at = new THREE.Vector3(p.x, gy + 0.02, p.z);
    for (const q of this.pools) {
      if (Math.hypot(q.p.x - at.x, q.p.z - at.z) < q.r * 0.8 && Math.abs(q.p.y - at.y) < 0.5) {
        q.r = Math.min(1.1, Math.hypot(q.r, r * 0.5));
        q.life = Math.max(q.life, q.age + life);
        return;
      }
    }
    if (this.pools.length >= MAXP) this.pools.shift();
    this.pools.push({ p: at, r, life, age: 0, seed: Math.random() * 10 });
  }

  update(dt: number, g: Game): void {
    for (const q of this.pools) q.age += dt;
    this.pools = this.pools.filter((q) => q.age < q.life);
    if (!this.pools.length) return;
    for (const o of g.enemiesOf(this.owner)) {
      if (o.dead || !o.grounded) continue;
      for (const q of this.pools) {
        if (Math.abs(o.pos.y - q.p.y) > 0.6 || Math.hypot(o.pos.x - q.p.x, o.pos.z - q.p.z) > q.r + o.def.radius * 0.5) continue;
        this.onStand(o, dt);
        break;
      }
    }
  }

  render(): void {
    let n = 0;
    for (const q of this.pools) {
      const fade = Math.min(1, q.age / 0.25) * Math.min(1, (q.life - q.age) / 1.5);
      for (let k = 0; k < 3; k++) {
        const a = q.seed + k * 2.1;
        const off = k === 0 ? 0 : q.r * 0.45;
        const r = q.r * (k === 0 ? 1 : 0.6) * fade;
        if (r < 0.02) continue;
        _m.makeScale(r, 1, r * (0.8 + 0.2 * Math.sin(a * 3))).setPosition(q.p.x + Math.cos(a) * off, q.p.y + k * 0.002, q.p.z + Math.sin(a) * off);
        this.mesh.setMatrixAt(n++, _m);
      }
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

/**
 * Drops of her blood flung at someone: they arc on gravity (drawn as short trails of drops), dose whoever they touch
 * (onHit) and leave a puddle where they land.
 */
export class BloodDrops implements Projectile {
  done = false;
  private drops: { p: THREE.Vector3; v: THREE.Vector3; alive: boolean }[] = [];
  private t = 0;

  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, vels: THREE.Vector3[], readonly dmg = 4, readonly onHit?: (o: Fighter) => void, readonly pools?: BloodPools) {
    for (const v of vels) this.drops.push({ p: from.clone(), v: v.clone(), alive: true });
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const sp = BloodSpray.of(g);
    let live = 0;
    for (const d of this.drops) {
      if (!d.alive) continue;
      d.v.y -= 15 * dt;
      const step = d.v.length() * dt;
      const dir = _v.copy(d.v).normalize();
      let hit: Fighter | null = null;
      for (const e of g.enemiesOf(this.owner)) {
        if (e.dead) continue;
        const c = e.center();
        const along = Math.max(0, Math.min(step, _w.subVectors(c, d.p).dot(dir)));
        const q = d.p.clone().addScaledVector(dir, along);
        if (Math.hypot(q.x - c.x, (q.y - c.y) * 0.55, q.z - c.z) > e.def.radius + 0.28) continue;
        hit = e;
        break;
      }
      if (hit) {
        d.alive = false;
        g.damage(hit, this.dmg, this.owner, dir.clone().setY(0).normalize(), { knock: 0.4, quiet: true, color: BLOOD_FRESH });
        this.onHit?.(hit);
        bloodBurst(g, d.p, null, 5, 2);
        continue;
      }
      d.p.addScaledVector(d.v, dt);
      if (g.engine.world.isSolidAtPos(d.p.x, d.p.y, d.p.z)) {
        d.alive = false;
        this.pools?.add(d.p, 0.45 + Math.random() * 0.25);
        bloodBurst(g, d.p.clone().setY(d.p.y + 0.1), null, 4, 1.6);
        continue;
      }
      live++;
      // the drop itself, as a short trail of cubes
      sp.spawn(d.p.x, d.p.y, d.p.z, d.v.x * 0.05, d.v.y * 0.05, d.v.z * 0.05, 0.085, 0.07, 0.8);
      if (Math.random() < 0.3) sp.spawn(d.p.x, d.p.y, d.p.z, d.v.x * 0.2, d.v.y * 0.2, d.v.z * 0.2, 0.04, 0.4, 0.4);
    }
    if (!live || this.t > 3) this.done = true;
  }

  dispose(): void {}
}

// ------------------------------------------------------------------ the bow

/** The bone bow's arrow: a skull at the head of a streak of purple light; it bites what it hits. */
export class SkullArrow implements Projectile {
  done = false;
  private pos: THREE.Vector3;
  private vel: THREE.Vector3;
  private t = 0;
  private mesh: PropMesh;

  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, dir: THREE.Vector3, readonly dmg = 16, readonly onHit?: (f: Fighter) => void) {
    this.pos = from.clone();
    this.vel = dir.clone().normalize().multiplyScalar(48);
    this.mesh = new PropMesh(giselleProp('skull'));
    this.mesh.scale.setScalar(1.3);
    this.mesh.castShadow = false;
    g.engine.gr.scene.add(this.mesh);
    g.sfx.play('arrow', from, 0.6);
  }

  private bite(p: THREE.Vector3, world: boolean): void {
    const g = this.g;
    this.done = true;
    if (world) g.engine.destruction.carve(new SphereShape(p.clone(), 0.55, 0.6), { mode: 'smash', power: 500, impulse: 4, dust: 0.4 });
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * 4, vy: Math.sin(a) * 4, vz: (Math.random() - 0.5) * 3, size: 0.14, sizeEnd: 0.03, life: 0.22, r: C_AZL.r, g: C_AZL.g, b: C_AZL.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2 });
    }
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.6, sizeEnd: 1.4, life: 0.2, r: C_AZ.r, g: C_AZ.g, b: C_AZ.b, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    g.sfx.play('crumble', p, 0.5);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const step = this.vel.length() * dt;
    const d = _v.copy(this.vel).normalize();
    for (const e of g.enemiesOf(this.owner)) {
      if (e.dead) continue;
      const c = e.center();
      const along = Math.max(0, Math.min(step, _w.subVectors(c, this.pos).dot(d)));
      if (this.pos.clone().addScaledVector(d, along).distanceTo(c) > e.def.radius + 0.35) continue;
      g.damage(e, this.dmg, this.owner, d.clone(), { energy: true, knock: 3, hitstop: 0.05, color: AZHAL });
      this.onHit?.(e);
      this.bite(c, false);
      return;
    }
    const hit = raycastVoxels(g.engine.world, this.pos.x, this.pos.y, this.pos.z, d.x, d.y, d.z, step);
    if (hit) {
      this.bite(this.pos.clone().addScaledVector(d, hit.dist), true);
      return;
    }
    this.pos.addScaledVector(this.vel, dt);
    g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, size: 0.36, sizeEnd: 0.1, life: 0.08, r: C_AZ.r, g: C_AZ.g, b: C_AZ.b, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, vx: -this.vel.x * 0.1, vy: -this.vel.y * 0.1, vz: -this.vel.z * 0.1, size: 0.12, sizeEnd: 0.02, life: 0.14, r: C_AZL.r, g: C_AZL.g, b: C_AZL.b, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
    if (this.t > 1.6) this.done = true;
  }

  render(): void {
    this.mesh.position.copy(this.pos);
    this.mesh.quaternion.setFromUnitVectors(ZP, _v.copy(this.vel).normalize());
  }

  reject(p: THREE.Vector3, radius: number): boolean {
    if (this.pos.distanceTo(p) > radius) return false;
    this.done = true;
    return true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.material.dispose();
  }
}

// ------------------------------------------------------------------ the shadow

/** A black pool with a purple rim: it opens under a zombie climbing out of her shadow, holds, and closes. */
export class ShadowGate implements Projectile {
  done = false;
  private t = 0;
  private pool: THREE.Mesh;
  private rim: THREE.Mesh;

  constructor(private g: Game, readonly at: THREE.Vector3, readonly r = 1.1, readonly dur = 1.0) {
    const gy = groundAt(g, at.x, at.y + 1, at.z, 4) ?? at.y;
    this.pool = new THREE.Mesh(new THREE.CircleGeometry(1, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#0C0A12', transparent: true, opacity: 0.95, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
    this.rim = new THREE.Mesh(new THREE.RingGeometry(0.86, 1.04, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: AZHAL, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
    this.pool.position.set(at.x, gy + 0.03, at.z);
    this.rim.position.set(at.x, gy + 0.035, at.z);
    this.pool.scale.setScalar(0.01);
    this.rim.scale.setScalar(0.01);
    g.engine.gr.scene.add(this.pool, this.rim);
    g.sfx.play('charge', at, 0.5);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.t > this.dur + 0.35) {
      this.done = true;
      return;
    }
    const p = this.pool.position;
    // dark motes and purple wisps rising out of it
    for (let i = 0; i < 3; i++) {
      const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * this.r * 0.9;
      g.engine.dust.spawn({ x: p.x + Math.cos(a) * rr, y: p.y + 0.05, z: p.z + Math.sin(a) * rr, vy: 1.4 + Math.random() * 1.6, size: 0.3, sizeEnd: 0.8, life: 0.7, r: 0.06, g: 0.04, b: 0.09, alpha: 0.7, alphaEnd: 0, tex: TEX_PUFF });
    }
    if (Math.random() < 0.6) {
      const a = Math.random() * Math.PI * 2;
      g.engine.glow.spawn({ x: p.x + Math.cos(a) * this.r, y: p.y + 0.1, z: p.z + Math.sin(a) * this.r, vy: 2.4, size: 0.16, sizeEnd: 0.04, life: 0.6, r: C_AZ.r, g: C_AZ.g, b: C_AZ.b, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
  }

  render(): void {
    const t = this.t;
    const k = t < 0.25 ? t / 0.25 : t > this.dur ? Math.max(0.01, 1 - (t - this.dur) / 0.35) : 1;
    this.pool.scale.setScalar(this.r * k);
    this.rim.scale.setScalar(this.r * k);
    (this.rim.material as THREE.MeshBasicMaterial).opacity = 0.6 + 0.3 * Math.sin(t * 14);
  }

  dispose(): void {
    for (const m of [this.pool, this.rim]) {
      m.removeFromParent();
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    }
  }
}

// ------------------------------------------------------------------ the bones

/** the limbs a pin goes for, and the angle each bone crosses its limb at */
const PIN_BONES: [string, number][] = [['shin.L', 0.6], ['shin.R', -0.6], ['thigh.L', -0.5], ['thigh.R', 0.5], ['forearm.L', 0.7], ['forearm.R', -0.7]];

/**
 * A smashed skeleton's bones flying back at the target (an arc each) and driven across its limbs: rooted while they
 * hold. A target with no such bones (a Hollow) is pinned through its centre.
 */
export class BonePin implements Projectile {
  done = false;
  private t = 0;
  private bones: { mesh: PropMesh; from: THREE.Vector3; bone: string; ang: number; lift: number }[] = [];
  private pinned = false;

  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, readonly target: Fighter, readonly fly = 0.35, readonly hold = 1.6) {
    for (const [bone, ang] of PIN_BONES) {
      const mesh = new PropMesh(giselleProp('bone'));
      mesh.scale.setScalar(1.6);
      mesh.castShadow = false;
      g.engine.gr.scene.add(mesh);
      this.bones.push({ mesh, from: from.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.8, Math.random() * 0.6, (Math.random() - 0.5) * 0.8)), bone, ang, lift: 1 + Math.random() * 1.5 });
    }
    g.sfx.play('swing', from, 0.6);
  }

  private limb(name: string, out: THREE.Vector3): THREE.Vector3 {
    const rig = this.target.visual.rig;
    if (rig.index(name) < 0) return this.target.center(out);
    const b = rig.bone(name);
    b.updateWorldMatrix(true, false);
    return b.getWorldPosition(out);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const tg = this.target;
    if (!this.pinned && this.t >= this.fly) {
      if (tg.dead) {
        this.done = true;
        return;
      }
      this.pinned = true;
      tg.rooted = true;
      tg.hitstun = Math.max(tg.hitstun, 0.45);
      tg.slow(0.6, this.hold);
      g.damage(tg, 18, this.owner, tg.pos.clone().sub(this.owner.pos).setY(0).normalize(), { knock: 0, hitstop: 0.06, color: AZHAL_LIGHT });
      g.sfx.play('impact', tg.center(), 0.7);
    }
    if (this.pinned && (this.t >= this.fly + this.hold || tg.dead)) {
      this.done = true;
      tg.rooted = false;
      const c = tg.center();
      for (let i = 0; i < 10; i++) g.engine.glow.spawn({ x: c.x, y: c.y - 0.5, z: c.z, vx: (Math.random() - 0.5) * 5, vy: Math.random() * 3, vz: (Math.random() - 0.5) * 5, size: 0.12, sizeEnd: 0.02, life: 0.4, r: C_AZL.r, g: C_AZL.g, b: C_AZL.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2 });
    }
  }

  render(): void {
    const k = Math.min(1, this.t / this.fly);
    for (const b of this.bones) {
      const to = this.limb(b.bone, _w);
      if (k < 1) {
        // the arc in, spinning
        b.mesh.position.lerpVectors(b.from, to, k);
        b.mesh.position.y += Math.sin(k * Math.PI) * b.lift;
        b.mesh.rotation.set(this.t * 17, this.t * 11, 0);
      } else {
        // driven across the limb, its middle on the bone
        b.mesh.position.copy(to);
        b.mesh.quaternion.setFromAxisAngle(_v.set(0, 1, 0), this.target.yaw + b.ang);
        _q.setFromAxisAngle(_v.set(1, 0, 0), 0.3);
        b.mesh.quaternion.multiply(_q);
        b.mesh.translateZ(-BONE_LEN * 0.8);
      }
    }
  }

  dispose(): void {
    if (this.pinned && !this.done) this.target.rooted = false;
    for (const b of this.bones) {
      b.mesh.removeFromParent();
      b.mesh.material.dispose();
    }
  }
}

/** Bones shaken out of the wings: they tumble down round her and break up in a puff of purple where they land. */
export class BoneRattle implements Projectile {
  done = false;
  private bones: { mesh: PropMesh; v: THREE.Vector3; w: THREE.Vector3; alive: boolean }[] = [];
  private t = 0;

  constructor(private g: Game, from: THREE.Vector3, n = 10, spread = 1.6) {
    for (let i = 0; i < n; i++) {
      const mesh = new PropMesh(giselleProp('bone'));
      mesh.scale.setScalar(1.2 + Math.random() * 0.6);
      mesh.castShadow = false;
      mesh.position.set(from.x + (Math.random() - 0.5) * spread * 2, from.y + Math.random() * 0.8, from.z + (Math.random() - 0.5) * spread * 2);
      g.engine.gr.scene.add(mesh);
      this.bones.push({ mesh, v: new THREE.Vector3((Math.random() - 0.5) * 3, 1 + Math.random() * 2, (Math.random() - 0.5) * 3), w: new THREE.Vector3(Math.random() * 12, Math.random() * 12, Math.random() * 12), alive: true });
    }
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    let live = 0;
    for (const b of this.bones) {
      if (!b.alive) continue;
      b.v.y -= 14 * dt;
      b.mesh.position.addScaledVector(b.v, dt);
      b.mesh.rotation.x += b.w.x * dt;
      b.mesh.rotation.y += b.w.y * dt;
      b.mesh.rotation.z += b.w.z * dt;
      const p = b.mesh.position;
      if (b.v.y < 0 && g.engine.world.isSolidAtPos(p.x, p.y, p.z)) {
        b.alive = false;
        b.mesh.visible = false;
        g.engine.glow.spawn({ x: p.x, y: p.y + 0.1, z: p.z, size: 0.4, sizeEnd: 0.9, life: 0.3, r: C_AZ.r, g: C_AZ.g, b: C_AZ.b, alpha: 0.7, alphaEnd: 0, tex: TEX_GLOW });
        continue;
      }
      live++;
    }
    if (!live || this.t > 3) this.done = true;
  }

  dispose(): void {
    for (const b of this.bones) {
      b.mesh.removeFromParent();
      b.mesh.material.dispose();
    }
  }
}

// ------------------------------------------------------------------ the tint

/** a body reddening as her blood spreads through it (k 0 … 1); 1 is how her zombies look */
export function infectionTint(f: Fighter, k: number): void {
  const r = 1 - 0.06 * k, gg = 1 - 0.36 * k, b = 1 - 0.4 * k;
  f.visual.forEachMaterial((m) => m.userData.uniforms.uTint.value.setRGB(r, gg, b));
}
