// Hyōrinmaru's techniques beyond the dragon. The ice wave (spikes of real ice erupting along the
// ground), Gunchō Tsurara (an icicle flock formed in the air, then loosed), Hyōryū Senbi (a crescent of ice
// thrown off a straight cut), Sennen Hyōrō (pillars that rise round the target, circle it and slam
// together into a tomb that stays in the world), Hyōten Hyakkasō (a hole in the clouds, snow that blooms
// into ice flowers on whatever it touches), and the storm his release draws over the sky.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { BoxShape, SphereShape } from '../destruction/shapes';
import { IcePrison, crystalGeometry, crystalMaterial, frostWorld, iceSpike, ICE_TINT } from './ice';
import { GlassShards } from './mirror';
import { TEX_GLOW, TEX_PUFF } from './sprites';

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

/** Height of the ground under (x, z), searching down from y (metres); null if none within `depth`. */
export function groundAt(g: Game, x: number, y: number, z: number, depth = 8): number | null {
  const w = g.engine.world, vs = w.vs;
  const ix = Math.floor(x / vs), iz = Math.floor(z / vs);
  let iy = Math.floor(y / vs);
  // if we start inside something, climb out first
  for (let k = 0; k < 24 && w.isSolid(ix, iy, iz); k++) iy++;
  for (let k = 0; k < depth / vs; k++, iy--) if (w.isSolid(ix, iy - 1, iz)) return iy * vs;
  return null;
}

// ------------------------------------------------------------------ the ice wave

/** A line of ice spikes racing along the ground toward the target; whatever stands on it freezes. */
export class IceWave implements Projectile {
  done = false;
  private d = 0;
  private next = 0;
  private hit = new Set<number>();
  private dir: THREE.Vector3;
  private side: THREE.Vector3;

  constructor(private g: Game, private owner: Fighter, private origin: THREE.Vector3, dir: THREE.Vector3, readonly length = 18, readonly damage = 34, readonly speed = 26) {
    this.dir = dir.clone().setY(0).normalize();
    this.side = new THREE.Vector3(-this.dir.z, 0, this.dir.x);
    g.sfx.play('crack', origin, 1.2);
  }

  update(dt: number, g: Game): void {
    this.d += this.speed * dt;
    while (this.next <= Math.min(this.d, this.length)) {
      const s = this.next;
      this.next += 0.7;
      const p = this.origin.clone().addScaledVector(this.dir, s).addScaledVector(this.side, Math.sin(s * 1.7) * 0.35);
      const gy = groundAt(g, p.x, p.y + 1.5, p.z, 6);
      if (gy === null) continue;
      p.y = gy;
      // a cluster of two or three spikes leaning forward, bigger as the wave runs on
      const k = 0.7 + Math.min(1, s / this.length) * 0.8;
      for (let i = 0; i < 3; i++) {
        const lean = new THREE.Vector3().copy(this.dir).multiplyScalar(0.35 + Math.random() * 0.3).add(new THREE.Vector3(0, 1, 0)).addScaledVector(this.side, (Math.random() - 0.5) * 0.9);
        iceSpike(g, p.clone().addScaledVector(this.side, (i - 1) * 0.45).setY(gy - 0.2), lean, (0.9 + Math.random() * 1.1) * k, (0.3 + Math.random() * 0.15) * k, 900);
      }
      for (let i = 0; i < 4; i++) g.engine.dust.spawn({ x: p.x, y: p.y + 0.3, z: p.z, vx: (Math.random() - 0.5) * 3, vy: Math.random() * 2, vz: (Math.random() - 0.5) * 3, size: 0.5, sizeEnd: 1.5, life: 0.7, r: 0.88, g: 0.95, b: 1, alpha: 0.45, alphaEnd: 0, tex: TEX_PUFF, drag: 2.5 });
      for (const f of g.enemiesOf(this.owner)) {
        if (this.hit.has(f.id) || Math.hypot(f.pos.x - p.x, f.pos.z - p.z) > 1.5 + f.def.radius || Math.abs(f.pos.y - p.y) > 2.2) continue;
        this.hit.add(f.id);
        g.damage(f, this.damage * 0.4, this.owner, this.dir.clone().add(UP).normalize(), { knock: 3, launch: 5, hitstop: 0.06 });
        if (!f.dead) g.addProjectile(new IcePrison(g, this.owner, f, 0.9, this.damage * 0.6, 'block', 0.9));
      }
      if (Math.random() < 0.35) g.sfx.play('crack', p, 0.6);
    }
    if (this.d >= this.length) this.done = true;
  }

  dispose(): void {}
}

// ------------------------------------------------------------------ Gunchō Tsurara

interface Icicle {
  p: THREE.Vector3;
  v: THREE.Vector3;
  home: THREE.Vector3;
  delay: number;
  live: boolean;
}

/** The icicle flock: a fan of icicles hangs in the air round him, then the swing looses them all. */
export class IcicleFlock implements Projectile {
  done = false;
  private t = 0;
  private launched = -1;
  private ice: Icicle[] = [];
  private mesh: THREE.InstancedMesh;
  private mat = crystalMaterial(0.95, 1.15);

  constructor(private g: Game, private owner: Fighter, private target: () => THREE.Vector3, readonly n = 14, readonly damage = 14) {
    const fw = owner.forward(new THREE.Vector3());
    const side = new THREE.Vector3(-fw.z, 0, fw.x);
    const c = owner.center();
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1) - 0.5;
      const home = c.clone().addScaledVector(side, u * 5).add(new THREE.Vector3(0, 1.4 + Math.cos(u * Math.PI) * 1.4 + (i % 2) * 0.5, 0)).addScaledVector(fw, -0.6 + Math.abs(u) * 1.2);
      this.ice.push({ p: home.clone(), v: new THREE.Vector3(), home, delay: Math.abs(u) * 0.12 + Math.random() * 0.05, live: true });
    }
    this.mesh = new THREE.InstancedMesh(crystalGeometry(), this.mat, n);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 5;
    g.engine.gr.scene.add(this.mesh);
    g.sfx.play('crack', c, 0.9);
  }

  launch(): void {
    if (this.launched >= 0) return;
    this.launched = this.t;
    const tgt = this.target();
    this.ice.forEach((ic) => {
      const aim = _v.copy(tgt).add(new THREE.Vector3((Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.2));
      ic.v.subVectors(aim, ic.p).normalize().multiplyScalar(46 + Math.random() * 8);
    });
    this.g.sfx.play('swingHeavy', this.owner.center(), 1.1);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.launched < 0) {
      // hang in formation, following him; loose themselves if he never swings
      for (const ic of this.ice) ic.p.lerp(ic.home.clone().add(new THREE.Vector3(0, Math.sin(this.t * 3 + ic.delay * 20) * 0.08, 0)), Math.min(1, dt * 8));
      if (this.t > 2.5) this.launch();
      return;
    }
    const lt = this.t - this.launched;
    let alive = 0;
    const w = g.engine.world, vs = w.vs;
    for (const ic of this.ice) {
      if (!ic.live || lt < ic.delay) {
        if (ic.live) alive++;
        continue;
      }
      alive++;
      ic.p.addScaledVector(ic.v, dt);
      if (Math.random() < 0.5) g.engine.glow.spawn({ x: ic.p.x, y: ic.p.y, z: ic.p.z, vx: 0, vy: 0, vz: 0, size: 0.12, sizeEnd: 0.02, life: 0.25, r: 0.8, g: 0.95, b: 1, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
      let stop = false;
      for (const f of g.enemiesOf(this.owner)) {
        if (f.center().distanceTo(ic.p) < f.def.radius + 0.45) {
          g.damage(f, this.damage, this.owner, ic.v.clone().normalize(), { knock: 3, hitstop: 0.03 });
          g.sparks(ic.p.clone(), ic.v.clone().normalize().negate(), ICE_TINT, 8);
          stop = true;
          break;
        }
      }
      if (!stop && w.isSolid(Math.floor(ic.p.x / vs), Math.floor(ic.p.y / vs), Math.floor(ic.p.z / vs))) {
        g.engine.destruction.carve(new SphereShape(ic.p.clone(), 0.35), { mode: 'bore', power: 60, impulse: 4, dust: 0.2 });
        frostWorld(g, ic.p, 0.7, 120);
        stop = true;
      }
      if (stop || lt > 2) {
        ic.live = false;
        g.addProjectile(new GlassShards(g, ic.p.clone(), new THREE.Vector3(0.15, 0.15, 0.15), 6, 3, 0.9, ic.p.y - 2, ICE_TINT, 0.6));
      }
    }
    if (alive === 0) this.done = true;
  }

  render(): void {
    const grow = (d: number) => Math.min(1, Math.max(0, (this.t - d * 0.6) / 0.25));
    const tgt = this.target();
    this.ice.forEach((ic, i) => {
      if (!ic.live) {
        _m.makeScale(0, 0, 0);
        this.mesh.setMatrixAt(i, _m);
        return;
      }
      const dir = this.launched >= 0 && ic.v.lengthSq() > 0 ? _v.copy(ic.v).normalize() : _v.subVectors(tgt, ic.p).normalize();
      _q.setFromUnitVectors(UP, dir);
      const k = grow(ic.delay);
      _s.set(0.22 * k, 1.1 * k, 0.22 * k);
      // the crystal's base sits at its position: shift so the point leads
      _m.compose(_w.copy(ic.p).addScaledVector(dir, -0.55 * k), _q, _s);
      this.mesh.setMatrixAt(i, _m);
    });
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mat.dispose();
  }
}

// ------------------------------------------------------------------ Hyōryū Senbi

/** A crescent of ice flying off a straight cut: it cuts and freezes whatever it passes. */
export class IceCrescent implements Projectile {
  done = false;
  private t = 0;
  private pos: THREE.Vector3;
  private dir: THREE.Vector3;
  private side: THREE.Vector3;
  private mesh: THREE.InstancedMesh;
  private mat = crystalMaterial(0.92, 1.2);
  private hit = new Set<number>();
  private lastFrost = 0;
  private shape: { o: THREE.Vector3; d: THREE.Vector3; s: number }[] = [];

  constructor(private g: Game, private owner: Fighter, origin: THREE.Vector3, dir: THREE.Vector3, readonly damage = 70, readonly scale = 1, readonly range = 45, readonly speed = 34) {
    this.pos = origin.clone();
    this.dir = dir.clone().normalize();
    this.side = new THREE.Vector3().crossVectors(this.dir, UP);
    if (this.side.lengthSq() < 1e-4) this.side.set(1, 0, 0);
    this.side.normalize();
    // the crescent: crystals along an arc in the side/up plane, bowed forward in the middle
    const n = 22;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1) * 2 - 1;
      const ang = u * 1.15;
      const o = new THREE.Vector3().addScaledVector(this.side, Math.sin(ang) * 2.0 * scale).add(new THREE.Vector3(0, (1 - Math.cos(ang)) * 0.6 * scale, 0)).addScaledVector(this.dir, Math.cos(ang) * 0.9 * scale);
      const d = new THREE.Vector3().addScaledVector(this.dir, -1).addScaledVector(this.side, -Math.sin(ang) * 0.6).normalize();
      this.shape.push({ o, d, s: (1 - Math.abs(u) * 0.65) * scale });
    }
    this.mesh = new THREE.InstancedMesh(crystalGeometry(), this.mat, n);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 5;
    g.engine.gr.scene.add(this.mesh);
    g.sfx.play('getsuga', origin, 0.8);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const step = this.speed * dt;
    const prev = this.pos.clone();
    this.pos.addScaledVector(this.dir, step);
    // cut a thin slab through the world along the arc's chord
    _m.makeBasis(this.side, UP, this.dir);
    _q.setFromRotationMatrix(_m);
    const mid = prev.clone().lerp(this.pos, 0.5);
    g.engine.destruction.carve(new BoxShape(mid, new THREE.Vector3(2.1 * this.scale, 0.12, step * 0.5 + 0.1), _q.clone()), { mode: 'cut', power: 420, dir: this.dir.clone(), sparks: [0.75, 0.93, 1], dust: 0.3 });
    if (this.t - this.lastFrost > 0.08) {
      this.lastFrost = this.t;
      frostWorld(g, this.pos, 1.1 * this.scale, 220);
    }
    for (const f of g.enemiesOf(this.owner)) {
      if (this.hit.has(f.id)) continue;
      _v.subVectors(f.center(), this.pos);
      if (Math.abs(_v.dot(this.side)) < 2.1 * this.scale && Math.abs(_v.dot(this.dir)) < 1.1 && Math.abs(_v.y) < 1.3 * this.scale) {
        this.hit.add(f.id);
        g.damage(f, this.damage * 0.5, this.owner, this.dir.clone(), { knock: 10, launch: 3, heavy: true, hitstop: 0.08, shake: 0.35 });
        if (!f.dead) g.addProjectile(new IcePrison(g, this.owner, f, 1.0, this.damage * 0.5, 'block', 1));
      }
    }
    for (let i = 0; i < 3; i++) {
      const sh = this.shape[Math.floor(Math.random() * this.shape.length)];
      const p = _v.copy(this.pos).add(sh.o);
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: -this.dir.x * 2, vy: -1, vz: -this.dir.z * 2, size: 0.12, sizeEnd: 0.02, life: 0.4, r: 0.8, g: 0.95, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    }
    if (this.t * this.speed > this.range) {
      this.done = true;
      g.addProjectile(new GlassShards(g, this.pos.clone(), new THREE.Vector3(1.6 * this.scale, 0.5, 0.5), 30, 4, 1.2, this.pos.y - 3, ICE_TINT, 0.9));
    }
  }

  render(): void {
    const grow = Math.min(1, this.t / 0.08);
    this.shape.forEach((sh, i) => {
      _q.setFromUnitVectors(UP, sh.d);
      const s = sh.s * grow;
      _s.set(0.55 * s, 1.5 * s, 0.55 * s);
      _m.compose(_v.copy(this.pos).add(sh.o), _q, _s);
      this.mesh.setMatrixAt(i, _m);
    });
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mat.dispose();
  }
}

// ------------------------------------------------------------------ Sennen Hyōrō

/**
 * The thousand-year ice prison: pillars burst up out of the ground in a ring round the target and circle
 * it; when he turns his sword they slam together on it. The tomb they make is written into the world.
 */
export class SennenHyoro implements Projectile {
  done = false;
  private t = 0;
  private closeAt = -1;
  private sealed = false;
  private mesh: THREE.InstancedMesh;
  private mat = crystalMaterial(0.96, 1.05);
  private pillars: { a: number; r: number; h: number; w: number; y0: number }[] = [];
  private center = new THREE.Vector3();

  constructor(private g: Game, private owner: Fighter, private target: Fighter, readonly n = 10, readonly damage = 150) {
    this.center.copy(target.pos);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const gy = groundAt(g, this.center.x + Math.cos(a) * 6.5, this.center.y + 3, this.center.z + Math.sin(a) * 6.5, 10) ?? this.center.y;
      this.pillars.push({ a, r: 6.5, h: 6.5 + Math.random() * 2.5, w: 1.1 + Math.random() * 0.4, y0: gy });
    }
    this.mesh = new THREE.InstancedMesh(crystalGeometry(), this.mat, n);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 5;
    g.engine.gr.scene.add(this.mesh);
    // they tear up out of the ground
    for (const p of this.pillars) {
      const x = this.center.x + Math.cos(p.a) * p.r, z = this.center.z + Math.sin(p.a) * p.r;
      g.engine.destruction.carve(new SphereShape(new THREE.Vector3(x, p.y0, z), 1.3), { mode: 'explode', power: 160, impulse: 12, dust: 0.6 });
    }
    g.sfx.play('crumble', this.center, 1.6);
    g.shake(0.4);
  }

  /** The sword turns: the pillars close. */
  close(): void {
    if (this.closeAt < 0) this.closeAt = this.t;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const tgt = this.target;
    // they follow the target while circling
    if (!tgt.dead && !this.sealed) this.center.lerp(tgt.pos, Math.min(1, dt * 1.5));
    if (this.closeAt < 0 && this.t > 2.6) this.close();
    if (this.closeAt >= 0 && !this.sealed) {
      const k = Math.min(1, (this.t - this.closeAt) / 0.32);
      for (const p of this.pillars) p.r = 6.5 * (1 - k * k) + 0.6 * k * k;
      if (k >= 1) this.seal(g);
    } else if (!this.sealed) for (const p of this.pillars) p.a += dt * 0.6;
    if (this.sealed && this.t - this.closeAt > 0.6) this.done = true;
  }

  private seal(g: Game): void {
    this.sealed = true;
    const tgt = this.target, c = this.center.clone();
    if (!tgt.dead && tgt.pos.distanceTo(c) < 3.5) g.addProjectile(new IcePrison(g, this.owner, tgt, 1.6, this.damage, 'obelisk', 1.2));
    // the pillars freeze into the world as a leaning tomb
    for (const p of this.pillars) {
      const base = new THREE.Vector3(c.x + Math.cos(p.a) * 1.3, Math.min(p.y0, c.y) - 0.4, c.z + Math.sin(p.a) * 1.3);
      const lean = new THREE.Vector3(-Math.cos(p.a) * 0.25, 1, -Math.sin(p.a) * 0.25);
      iceSpike(g, base, lean, p.h * 0.85, p.w * 0.55, 3000);
    }
    g.sfx.play('impact', c, 1.6);
    g.sfx.play('shatter', c, 1.2);
    g.shake(0.7);
    g.hitstop(0.1);
    g.addRing(c.clone().setY(c.y + 0.3), 10, '#BFEFFF', 0.5);
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.dust.spawn({ x: c.x, y: c.y + 0.5, z: c.z, vx: Math.cos(a) * 10, vy: Math.random() * 3, vz: Math.sin(a) * 10, size: 0.9, sizeEnd: 3, life: 1.1, r: 0.88, g: 0.95, b: 1, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
    }
  }

  render(): void {
    const rise = Math.min(1, this.t / 0.7);
    const e = 1 - (1 - rise) ** 3;
    const fade = this.sealed ? Math.max(0, 1 - (this.t - this.closeAt - 0.32) / 0.25) : 1;
    this.pillars.forEach((p, i) => {
      const x = this.center.x + Math.cos(p.a) * p.r, z = this.center.z + Math.sin(p.a) * p.r;
      // lean inward as they close
      const lean = this.closeAt >= 0 ? Math.min(1, (this.t - this.closeAt) / 0.32) * 0.25 : 0;
      _v.set(-Math.cos(p.a) * lean, 1, -Math.sin(p.a) * lean).normalize();
      _q.setFromUnitVectors(UP, _v);
      _s.set(p.w * 2.2, p.h, p.w * 2.2).multiplyScalar(fade === 0 ? 1e-4 : 1);
      _m.compose(_w.set(x, p.y0 - 1 - (1 - e) * p.h, z), _q, _s);
      this.mesh.setMatrixAt(i, _m);
    });
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mat.uniforms.uA.value = fade;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mat.dispose();
  }
}

// ------------------------------------------------------------------ Hyōten Hyakkasō

/**
 * A great hole opens in the clouds above the target and snow falls through it. Every flake that touches
 * the target blooms into an ice flower on it; when the snow stops the flowers seal it in an obelisk.
 */
export class Hyakkaso implements Projectile {
  done = false;
  private t = 0;
  private flowers: THREE.Vector3[] = [];
  private flowerMesh: THREE.InstancedMesh;
  private mat = crystalMaterial(0.95, 1.3);
  private hole: THREE.Mesh;
  private shaft: THREE.Mesh;
  private sealed = false;
  private center = new THREE.Vector3();
  private bloomAcc = 0;

  constructor(private g: Game, private owner: Fighter, private target: Fighter, readonly dur = 3.6, readonly perFlower = 5, readonly maxFlowers = 30) {
    this.center.copy(target.pos);
    this.flowerMesh = new THREE.InstancedMesh(crystalGeometry(), this.mat, maxFlowers * 4);
    this.flowerMesh.frustumCulled = false;
    this.flowerMesh.renderOrder = 5;
    // the hole in the clouds: a bright ring high above, and a soft shaft of light down to the target
    this.hole = new THREE.Mesh(new THREE.RingGeometry(5, 9, 48), new THREE.MeshBasicMaterial({ color: '#E8F4FF', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    this.hole.rotation.x = -Math.PI / 2;
    this.shaft = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 40, 32, 1, true), new THREE.MeshBasicMaterial({ color: '#CFE8FF', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    for (const m of [this.hole, this.shaft]) {
      m.frustumCulled = false;
      m.renderOrder = 3;
    }
    g.engine.gr.scene.add(this.flowerMesh, this.hole, this.shaft);
    g.sfx.play('charge', target.center(), 0.6);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const tgt = this.target;
    if (!this.sealed) {
      this.center.lerp(tgt.pos, Math.min(1, dt * 0.8));
      // snow falling through the shaft
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 6;
        g.engine.glow.spawn({ x: this.center.x + Math.cos(a) * r, y: this.center.y + 12 + Math.random() * 6, z: this.center.z + Math.sin(a) * r, vx: (Math.random() - 0.5) * 0.6, vy: -4.5, vz: (Math.random() - 0.5) * 0.6, size: 0.09, sizeEnd: 0.07, life: 3.2, r: 0.96, g: 0.98, b: 1, alpha: 0.95, alphaEnd: 0.4, tex: TEX_GLOW });
      }
      // flakes reaching the target bloom into flowers on it
      if (this.t > 0.8 && !tgt.dead && Math.hypot(tgt.pos.x - this.center.x, tgt.pos.z - this.center.z) < 6) {
        this.bloomAcc += dt * 9;
        while (this.bloomAcc >= 1 && this.flowers.length < this.maxFlowers) {
          this.bloomAcc -= 1;
          const a = Math.random() * Math.PI * 2;
          this.flowers.push(new THREE.Vector3(Math.cos(a) * (tgt.def.radius + 0.05), Math.random() * tgt.def.height, Math.sin(a) * (tgt.def.radius + 0.05)));
          g.damage(tgt, this.perFlower * 0.3, this.owner, new THREE.Vector3(0, -1, 0), { quiet: true });
          tgt.hitstun = Math.max(tgt.hitstun, 0.12);
          if (Math.random() < 0.3) g.sfx.play('crack', tgt.center(), 0.4);
        }
      }
      if (this.t >= this.dur || (tgt.dead && this.t > 0.8)) {
        this.sealed = true;
        if (!tgt.dead && this.flowers.length > 0) g.addProjectile(new IcePrison(g, this.owner, tgt, 1.2, this.perFlower * this.flowers.length * 0.7, 'obelisk', 1.1));
      }
    } else if (this.t > this.dur + 1.2) this.done = true;
  }

  render(): void {
    const tgt = this.target;
    const k = Math.min(1, this.t / 0.8) * (this.sealed ? Math.max(0, 1 - (this.t - this.dur) / 1.2) : 1);
    (this.hole.material as THREE.MeshBasicMaterial).opacity = 0.55 * k;
    (this.shaft.material as THREE.MeshBasicMaterial).opacity = 0.07 * k;
    this.hole.position.set(this.center.x, this.center.y + 32, this.center.z);
    this.shaft.position.set(this.center.x, this.center.y + 14, this.center.z);
    let c = 0;
    for (const f of this.flowers) {
      // four petals round each bloom point, pointing outward
      const out = _w.set(f.x, 0, f.z).normalize();
      for (let p = 0; p < 4; p++) {
        const a = (p / 4) * Math.PI * 2;
        _v.set(Math.cos(a), Math.sin(a), 0);
        // petals in the plane facing out from the body
        const right = new THREE.Vector3(-out.z, 0, out.x);
        const dir = new THREE.Vector3().addScaledVector(right, _v.x).add(new THREE.Vector3(0, _v.y, 0)).addScaledVector(out, 0.4).normalize();
        _q.setFromUnitVectors(UP, dir);
        _s.set(0.09, 0.22, 0.09).multiplyScalar(this.sealed && this.t > this.dur + 0.05 ? 0 : 1);
        _m.compose(new THREE.Vector3(tgt.pos.x + f.x, tgt.pos.y + f.y, tgt.pos.z + f.z), _q, _s);
        this.flowerMesh.setMatrixAt(c++, _m);
      }
    }
    for (; c < this.flowerMesh.count; c++) {
      _m.makeScale(0, 0, 0);
      this.flowerMesh.setMatrixAt(c, _m);
    }
    this.flowerMesh.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.flowerMesh.removeFromParent();
    this.mat.dispose();
    for (const m of [this.hole, this.shaft]) {
      m.removeFromParent();
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    }
  }
}

// ------------------------------------------------------------------ the storm

/**
 * His release draws storm clouds over the sky: the light dims and cools, the clouds thicken and darken,
 * snow drifts down round him. `level` eases toward `target` (0 clear, 1 storm).
 */
export class Storm implements Projectile {
  done = false;
  level = 0;
  target = 1;
  private base: { zen: THREE.Color; hor: THREE.Color; cloud: THREE.Color; cover: number; sunGlow: number; sun: number; hemi: number; fog: THREE.Color } | null = null;

  constructor(private g: Game, private center: () => THREE.Vector3) {}

  update(dt: number, g: Game): void {
    const gr = g.engine.gr;
    if (!this.base) {
      const u = gr.sky.uniforms;
      this.base = { zen: (u.uZenith.value as THREE.Color).clone(), hor: (u.uHorizon.value as THREE.Color).clone(), cloud: (u.uCloudColor.value as THREE.Color).clone(), cover: u.uCloudCover.value as number, sunGlow: u.uSunGlow.value as number, sun: gr.sun.intensity, hemi: gr.hemi.intensity, fog: (gr.scene.fog as THREE.Fog).color.clone() };
    }
    this.level += (this.target - this.level) * (1 - Math.exp(-dt * (this.target > this.level ? 1.2 : 0.6)));
    const k = this.level, b = this.base;
    const u = gr.sky.uniforms;
    (u.uZenith.value as THREE.Color).copy(b.zen).lerp(new THREE.Color('#3B4656'), k);
    (u.uHorizon.value as THREE.Color).copy(b.hor).lerp(new THREE.Color('#8A95A3'), k);
    (u.uCloudColor.value as THREE.Color).copy(b.cloud).lerp(new THREE.Color('#5D6A78'), k);
    u.uCloudCover.value = b.cover + (0.95 - b.cover) * k;
    u.uSunGlow.value = b.sunGlow * (1 - 0.85 * k);
    gr.sun.intensity = b.sun * (1 - 0.55 * k);
    gr.hemi.intensity = b.hemi * (1 - 0.2 * k);
    (gr.scene.fog as THREE.Fog).color.copy(b.fog).lerp(new THREE.Color('#9AA6B4'), k);
    // snow round him
    if (k > 0.2) {
      const c = this.center();
      const n = Math.floor(k * 4);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 22;
        g.engine.glow.spawn({ x: c.x + Math.cos(a) * r, y: c.y + 8 + Math.random() * 8, z: c.z + Math.sin(a) * r, vx: 0.6 + (Math.random() - 0.5), vy: -2.2, vz: (Math.random() - 0.5), size: 0.06, sizeEnd: 0.05, life: 5, r: 0.96, g: 0.98, b: 1, alpha: 0.9, alphaEnd: 0.5, tex: TEX_GLOW });
      }
    }
    if (this.target === 0 && this.level < 0.01) {
      this.restore();
      this.done = true;
    }
  }

  private restore(): void {
    const gr = this.g.engine.gr, b = this.base;
    if (!b) return;
    const u = gr.sky.uniforms;
    (u.uZenith.value as THREE.Color).copy(b.zen);
    (u.uHorizon.value as THREE.Color).copy(b.hor);
    (u.uCloudColor.value as THREE.Color).copy(b.cloud);
    u.uCloudCover.value = b.cover;
    u.uSunGlow.value = b.sunGlow;
    gr.sun.intensity = b.sun;
    gr.hemi.intensity = b.hemi;
    (gr.scene.fog as THREE.Fog).color.copy(b.fog);
  }

  dispose(): void {
    this.restore();
  }
}

