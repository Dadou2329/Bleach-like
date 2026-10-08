// Coyote Starrk's effects (docs/roster/E1-espada-1.md). His Cero is blue and needs no wind-up; out of the
// Los Lobos pistols it comes as shots — the right gun heavy, the left one quick and light — or as a
// stream: Cero Metralleta blooms a ring of charge points around the right barrel that keep firing until
// the shots fuse into one beam he can steer; the left gun sprays a fan of small Ceros. The wolf pack
// (Camarada) is the guns' soul split again: ghostly blue wolves pour out of the bandoleers on his back,
// hunt along the ground (some burrow and erupt under the target), stretch to lunge, bite and explode.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { SphereShape } from '../destruction/shapes';
import { raycastVoxels } from '../voxel/raycast';
import { TEX_GLOW, TEX_PUFF, TEX_RING, TEX_STREAK } from './sprites';
import { buildCached } from '../game/characterFactory';
import { createCharMaterial, type CharMaterial } from '../render/charMaterial';
import { starrkProp } from '../chars/starrk';
import { groundAt } from './iceArts';

/** Starrk's Cero colours */
export const STARRK_CERO = { core: '#E6F4FF', body: '#6DB6FF', rim: '#2F7DEB' };
const CORE = new THREE.Color(STARRK_CERO.core);
const BODY = new THREE.Color(STARRK_CERO.body);
const RIM = new THREE.Color(STARRK_CERO.rim);

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

let ballGeo: THREE.BufferGeometry | null = null;
const ball = () => (ballGeo ??= new THREE.IcosahedronGeometry(1, 2));

/** distance from p to a fighter's body axis (a vertical capsule) */
function capsuleDist(f: Fighter, p: THREE.Vector3): number {
  const cy = Math.max(f.pos.y + 0.2, Math.min(f.pos.y + f.def.height - 0.2, p.y));
  return Math.hypot(f.pos.x - p.x, cy - p.y, f.pos.z - p.z);
}

function flash(g: Game, p: THREE.Vector3, size: number, c: THREE.Color = BODY): void {
  g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size, sizeEnd: size * 0.3, life: 0.08, r: CORE.r, g: CORE.g, b: CORE.b, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: size * 0.6, sizeEnd: size * 1.6, life: 0.14, r: c.r, g: c.g, b: c.b, alpha: 0.8, alphaEnd: 0, tex: TEX_RING });
}

// ------------------------------------------------------------------ a single Cero shot

export interface ShotOpts {
  speed: number;
  /** core radius (m) */
  size: number;
  damage: number;
  /** blast radius carved on impact (m) */
  blast: number;
  power: number;
  knock?: number;
  launch?: number;
  heavy?: boolean;
  /** colours (default: Starrk's blue) */
  core?: THREE.ColorRepresentation;
  body?: THREE.ColorRepresentation;
  /** steer toward this fighter… */
  home?: Fighter | null;
  /** …at this rate (rad/s) */
  homeRate?: number;
  range?: number;
  /** whose own power this is, turned back (Sōgyo no Kotowari's return) */
  reflected?: Fighter | null;
}

/** One Cero bullet out of a pistol: a white-hot core in a blue halo, a streak behind it, a blast where it lands. */
export class CeroShot implements Projectile {
  done = false;
  readonly pos: THREE.Vector3;
  readonly dir: THREE.Vector3;
  private core: THREE.Mesh;
  private halo: THREE.Mesh;
  private travelled = 0;
  private t = 0;
  private cCore: THREE.Color;
  private cBody: THREE.Color;
  private cRim: THREE.Color;

  constructor(private g: Game, private owner: Fighter, origin: THREE.Vector3, dir: THREE.Vector3, readonly o: ShotOpts) {
    this.pos = origin.clone();
    this.dir = dir.clone().normalize();
    this.cCore = o.core ? new THREE.Color(o.core) : CORE;
    this.cBody = o.body ? new THREE.Color(o.body) : BODY;
    this.cRim = o.body ? this.cBody.clone().multiplyScalar(0.6) : RIM;
    this.core = new THREE.Mesh(ball(), new THREE.MeshBasicMaterial({ color: this.cCore.clone().multiplyScalar(2.2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.halo = new THREE.Mesh(ball(), new THREE.MeshBasicMaterial({ color: this.cBody.clone().multiplyScalar(1.5), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.core.frustumCulled = this.halo.frustumCulled = false;
    this.core.renderOrder = this.halo.renderOrder = 7;
    g.engine.gr.scene.add(this.core, this.halo);
    flash(g, origin, o.size * 6, this.cBody);
    this.render();
  }

  update(dt: number, g: Game): void {
    const o = this.o;
    this.t += dt;
    if (o.home && !o.home.dead) {
      // bend toward the target, never sharply
      _v.subVectors(o.home.center(), this.pos).normalize();
      const ang = this.dir.angleTo(_v);
      if (ang > 1e-3 && ang < 1.2) this.dir.lerp(_v, Math.min(1, ((o.homeRate ?? 2) * dt) / ang)).normalize();
    }
    const step = o.speed * dt;
    const hit = raycastVoxels(g.engine.world, this.pos.x, this.pos.y, this.pos.z, this.dir.x, this.dir.y, this.dir.z, step + 0.1);
    // fighters along this step
    for (const f of g.enemiesOf(this.owner)) {
      for (let k = 0; k <= 2; k++) {
        _w.copy(this.pos).addScaledVector(this.dir, (step * k) / 2);
        if (capsuleDist(f, _w) < f.def.radius + o.size + 0.15) {
          this.pos.copy(_w);
          this.pop(g, f);
          return;
        }
      }
    }
    if (hit) {
      this.pos.addScaledVector(this.dir, hit.dist);
      this.pop(g, null);
      return;
    }
    this.pos.addScaledVector(this.dir, step);
    this.travelled += step;
    const glow = g.engine.glow;
    glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, vx: -this.dir.x * 8, vy: -this.dir.y * 8, vz: -this.dir.z * 8, size: o.size * 2.4, sizeEnd: o.size * 0.4, life: 0.12, r: this.cBody.r, g: this.cBody.g, b: this.cBody.b, alpha: 0.85, alphaEnd: 0, tex: TEX_STREAK, stretch: 4 });
    if (Math.random() < 0.5) glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, vz: (Math.random() - 0.5) * 2, size: o.size * 1.6, sizeEnd: 0.02, life: 0.22, r: this.cRim.r, g: this.cRim.g, b: this.cRim.b, alpha: 0.6, alphaEnd: 0, tex: TEX_GLOW });
    if (this.travelled > (o.range ?? 90)) this.pop(g, null);
  }

  private pop(g: Game, f: Fighter | null): void {
    if (this.done) return;
    this.done = true;
    const o = this.o;
    const p = this.pos;
    if (f) g.damage(f, o.damage, this.owner, this.dir.clone().setY(0.15).normalize(), { energy: true, reflected: o.reflected, knock: o.knock ?? 8, launch: o.launch ?? 1.5, heavy: o.heavy, hitstop: o.heavy ? 0.07 : 0.03, shake: o.heavy ? 0.3 : 0.12 });
    // the blast also catches whoever stands close
    if (o.blast > 0.8) for (const e of g.enemiesOf(this.owner)) {
      if (e === f) continue;
      const d = capsuleDist(e, p);
      if (d < o.blast + e.def.radius) g.damage(e, o.damage * 0.5, this.owner, _v.subVectors(e.pos, p).setY(0.3).normalize().clone(), { energy: true, reflected: o.reflected, knock: 10, launch: 3, hitstop: 0.03 });
    }
    g.engine.destruction.carve(new SphereShape(p.clone(), o.blast, 0.8), { mode: 'explode', power: o.power, impulse: 6 + o.blast * 6, sparks: [this.cBody.r, this.cBody.g, this.cBody.b], dust: 0.5 });
    const glow = g.engine.glow;
    glow.spawn({ x: p.x, y: p.y, z: p.z, size: o.blast * 1.6, sizeEnd: o.blast * 3.4, life: 0.22, r: this.cBody.r, g: this.cBody.g, b: this.cBody.b, alpha: 0.95, alphaEnd: 0, tex: TEX_GLOW });
    glow.spawn({ x: p.x, y: p.y, z: p.z, size: o.blast, sizeEnd: o.blast * 1.4, life: 0.1, r: this.cCore.r, g: this.cCore.g, b: this.cCore.b, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2, e = Math.random() * 2 - 0.5;
      glow.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * 9, vy: e * 6, vz: Math.sin(a) * 9, size: 0.16, sizeEnd: 0.02, life: 0.3, r: this.cBody.r, g: this.cBody.g, b: this.cBody.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 3 });
    }
    if (o.blast > 1) g.addRing(p.clone(), o.blast * 3, this.cBody, 0.35);
    g.sfx.play(o.blast > 1 ? 'explode' : 'impact', p, o.blast > 1 ? 0.9 : 0.5);
  }

  render(): void {
    const s = this.o.size * (1 + Math.sin(this.t * 60) * 0.08);
    this.core.position.copy(this.pos);
    this.halo.position.copy(this.pos);
    // stretched along the flight
    _q.setFromUnitVectors(_v.set(0, 0, 1), this.dir);
    this.core.quaternion.copy(_q);
    this.halo.quaternion.copy(_q);
    this.core.scale.set(s, s, s * 1.5);
    this.halo.scale.set(s * 1.9, s * 1.9, s * 3.2);
  }

  dispose(): void {
    this.core.removeFromParent();
    this.halo.removeFromParent();
    (this.core.material as THREE.Material).dispose();
    (this.halo.material as THREE.Material).dispose();
  }
}

// ------------------------------------------------------------------ a stream of small Ceros

interface Pellet {
  p: THREE.Vector3;
  v: THREE.Vector3;
  life: number;
  size: number;
  dmg: number;
}

export interface VolleyOpts {
  /** blast carved where the stream lands (m), at most every `carveEvery` s */
  blast: number;
  power: number;
  carveEvery?: number;
  knock?: number;
  max?: number;
}

/**
 * Many small Ceros at once (the left gun's spray, the shots round Cero Metralleta): instanced cores and
 * halos, each pellet raycast every step; where the stream lands the world is blasted (throttled), and
 * the damage it does is summed into one number every few tenths of a second.
 */
export class CeroVolley implements Projectile {
  done = false;
  /** no more emits: done once the last pellet is gone */
  closed = false;
  private list: Pellet[] = [];
  private cores: THREE.InstancedMesh;
  private halos: THREE.InstancedMesh;
  private carveT = 0;
  private impact: THREE.Vector3 | null = null;
  private owed = new Map<Fighter, number>();
  private owedT = 0;
  private hitT = new Map<number, number>();
  private t = 0;
  private max: number;

  constructor(private g: Game, private owner: Fighter, readonly o: VolleyOpts) {
    this.max = o.max ?? 400;
    this.cores = new THREE.InstancedMesh(ball(), new THREE.MeshBasicMaterial({ color: CORE.clone().multiplyScalar(2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), this.max);
    this.halos = new THREE.InstancedMesh(ball(), new THREE.MeshBasicMaterial({ color: BODY.clone().multiplyScalar(1.4), transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }), this.max);
    for (const m of [this.cores, this.halos]) {
      m.count = 0;
      m.frustumCulled = false;
      m.renderOrder = 7;
      g.engine.gr.scene.add(m);
    }
  }

  get count(): number {
    return this.list.length;
  }

  emit(p: THREE.Vector3, dir: THREE.Vector3, speed: number, size: number, dmg: number): void {
    if (this.list.length >= this.max) return;
    this.list.push({ p: p.clone(), v: dir.clone().normalize().multiplyScalar(speed), life: 1.6, size, dmg });
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const glow = g.engine.glow;
    const enemies = g.enemiesOf(this.owner);
    for (let i = this.list.length - 1; i >= 0; i--) {
      const q = this.list[i];
      q.life -= dt;
      const sp = q.v.length();
      const step = sp * dt;
      _v.copy(q.v).divideScalar(sp);
      let gone = q.life <= 0;
      if (!gone) for (const f of enemies) {
        _w.copy(q.p).addScaledVector(_v, step * 0.5);
        if (capsuleDist(f, _w) < f.def.radius + q.size + 0.1) {
          this.hurt(g, f, q.dmg, _v);
          flash(g, _w, q.size * 5);
          gone = true;
          break;
        }
      }
      if (!gone) {
        const hit = raycastVoxels(g.engine.world, q.p.x, q.p.y, q.p.z, _v.x, _v.y, _v.z, step + 0.05);
        if (hit) {
          q.p.addScaledVector(_v, hit.dist);
          this.impact = (this.impact ?? new THREE.Vector3()).copy(q.p);
          glow.spawn({ x: q.p.x, y: q.p.y, z: q.p.z, size: q.size * 6, sizeEnd: q.size * 10, life: 0.14, r: BODY.r, g: BODY.g, b: BODY.b, alpha: 0.85, alphaEnd: 0, tex: TEX_GLOW });
          if (Math.random() < 0.25) g.engine.dust.spawn({ x: q.p.x, y: q.p.y, z: q.p.z, vx: (Math.random() - 0.5) * 6 - _v.x * 3, vy: Math.random() * 4, vz: (Math.random() - 0.5) * 6 - _v.z * 3, size: 0.5, sizeEnd: 1.8, life: 0.8, r: 0.55, g: 0.53, b: 0.52, alpha: 0.45, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
          gone = true;
        }
      }
      if (gone) {
        this.list.splice(i, 1);
        continue;
      }
      q.p.addScaledVector(q.v, dt);
      if (Math.random() < 0.6) glow.spawn({ x: q.p.x, y: q.p.y, z: q.p.z, vx: -_v.x * 5, vy: -_v.y * 5, vz: -_v.z * 5, size: q.size * 2.2, sizeEnd: q.size * 0.3, life: 0.1, r: BODY.r, g: BODY.g, b: BODY.b, alpha: 0.75, alphaEnd: 0, tex: TEX_STREAK, stretch: 3.5 });
    }
    // the ground where the stream lands is blasted, a little at a time
    this.carveT -= dt;
    if (this.impact && this.carveT <= 0) {
      this.carveT = this.o.carveEvery ?? 0.06;
      g.engine.destruction.carve(new SphereShape(this.impact.clone(), this.o.blast, 0.8), { mode: 'explode', power: this.o.power, impulse: 8, sparks: [BODY.r, BODY.g, BODY.b], dust: 0.4 });
      if (Math.random() < 0.3) g.sfx.play('impact', this.impact, 0.4);
      this.impact = null;
    }
    // the summed damage shows as one number now and then
    this.owedT -= dt;
    if (this.owedT <= 0 && this.owed.size) {
      this.owedT = 0.3;
      for (const [f, n] of this.owed) if (g.hud && !f.dead && n > 0.5) g.hud.damageNumber(f.center(), n, f === g.player ? '#ff6b6b' : '#ffffff', this.owner === g.player);
      this.owed.clear();
    }
    if (this.closed && this.list.length === 0 && this.t > 0.1) this.done = true;
  }

  private hurt(g: Game, f: Fighter, dmg: number, dir: THREE.Vector3): void {
    const before = f.hp;
    // every pellet counts, but the stagger and the knock come in ticks
    const last = this.hitT.get(f.id) ?? -1;
    const tick = this.t - last > 0.12;
    if (tick) this.hitT.set(f.id, this.t);
    g.damage(f, dmg, this.owner, _s.copy(dir).setY(0.1).normalize(), { energy: true, knock: tick ? (this.o.knock ?? 3) : 0, quiet: true });
    this.owed.set(f, (this.owed.get(f) ?? 0) + Math.max(0, before - f.hp));
  }

  render(): void {
    const n = this.list.length;
    for (let i = 0; i < n; i++) {
      const q = this.list[i];
      _v.copy(q.v).normalize();
      _q.setFromUnitVectors(_w.set(0, 0, 1), _v);
      _s.set(q.size, q.size, q.size * 1.6);
      _m.compose(q.p, _q, _s);
      this.cores.setMatrixAt(i, _m);
      _s.set(q.size * 2, q.size * 2, q.size * 3.6);
      _m.compose(q.p, _q, _s);
      this.halos.setMatrixAt(i, _m);
    }
    this.cores.count = this.halos.count = n;
    this.cores.instanceMatrix.needsUpdate = this.halos.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    for (const m of [this.cores, this.halos]) {
      m.removeFromParent();
      (m.material as THREE.Material).dispose();
      m.dispose();
    }
  }
}

// ------------------------------------------------------------------ Cero Metralleta's ring of muzzles

/**
 * The charge points of Cero Metralleta: a ring of small blue suns blooming around the barrel just ahead
 * of the muzzle, slowly turning; they swell in, flicker as they fire, and fade when he stops.
 */
export class MetralletaRing implements Projectile {
  done = false;
  private t = 0;
  private ending = false;
  private endT = 0;
  private suns: THREE.Mesh[] = [];
  private halo: THREE.Mesh;
  private light: THREE.PointLight;
  readonly center = new THREE.Vector3();
  readonly axis = new THREE.Vector3(0, 0, 1);

  constructor(private g: Game, private emitter: THREE.Object3D, private aim: () => THREE.Vector3, readonly n = 8, readonly radius = 0.26) {
    const mat = new THREE.MeshBasicMaterial({ color: CORE.clone().multiplyScalar(2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(ball(), mat);
      m.frustumCulled = false;
      m.renderOrder = 7;
      this.suns.push(m);
      g.engine.gr.scene.add(m);
    }
    this.halo = new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 8, 40), new THREE.MeshBasicMaterial({ color: BODY.clone().multiplyScalar(1.6), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.halo.frustumCulled = false;
    this.halo.renderOrder = 7;
    this.light = new THREE.PointLight(BODY, 0, 18, 1.6);
    g.engine.gr.scene.add(this.halo, this.light);
    this.place();
  }

  end(): void {
    this.ending = true;
  }

  /** world positions of the charge points */
  point(i: number, out = new THREE.Vector3()): THREE.Vector3 {
    const a = (i / this.n) * Math.PI * 2 + this.t * 1.6;
    const u = _v.crossVectors(this.axis, Math.abs(this.axis.y) > 0.9 ? _w.set(1, 0, 0) : UP).normalize();
    const w = _w.crossVectors(this.axis, u).normalize();
    const r = this.radius * this.grow();
    return out.copy(this.center).addScaledVector(u, Math.cos(a) * r).addScaledVector(w, Math.sin(a) * r);
  }

  private grow(): number {
    return Math.min(1, this.t / 0.22) * (this.ending ? Math.max(0, 1 - this.endT / 0.3) : 1);
  }

  private place(): void {
    this.emitter.updateWorldMatrix(true, false);
    this.emitter.getWorldPosition(this.center);
    this.axis.subVectors(this.aim(), this.center).normalize();
    this.center.addScaledVector(this.axis, 0.14);
  }

  update(dt: number): void {
    this.t += dt;
    if (this.ending && (this.endT += dt) > 0.32) this.done = true;
  }

  render(_dt: number, time: number): void {
    this.place();
    const k = this.grow();
    for (let i = 0; i < this.n; i++) {
      const m = this.suns[i];
      this.point(i, m.position);
      m.scale.setScalar(0.06 * k * (1 + Math.sin(time * 40 + i * 2.3) * 0.25));
    }
    this.halo.position.copy(this.center);
    this.halo.quaternion.setFromUnitVectors(_v.set(0, 0, 1), this.axis);
    this.halo.scale.setScalar(this.radius * k * (1 + Math.sin(time * 18) * 0.05));
    (this.halo.material as THREE.MeshBasicMaterial).opacity = 0.5 * k;
    this.light.position.copy(this.center);
    this.light.intensity = 40 * k;
    if (Math.random() < 0.5 * k) {
      const p = this.point(Math.floor(Math.random() * this.n), _s);
      this.g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.22, sizeEnd: 0.05, life: 0.12, r: BODY.r, g: BODY.g, b: BODY.b, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
  }

  dispose(): void {
    for (const m of this.suns) m.removeFromParent();
    (this.suns[0]?.material as THREE.Material | undefined)?.dispose();
    this.halo.removeFromParent();
    this.halo.geometry.dispose();
    (this.halo.material as THREE.Material).dispose();
    this.light.removeFromParent();
  }
}

// ------------------------------------------------------------------ the wolf pack

type WolfState = 'pour' | 'hunt' | 'lunge' | 'bite' | 'under' | 'gone';

interface Wolf {
  mesh: THREE.Mesh;
  mat: CharMaterial;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  yaw: number;
  state: WolfState;
  t: number;
  /** gait phase and weave */
  phase: number;
  side: number;
  speed: number;
  burrow: boolean;
  bite: THREE.Vector3;
  fade: number;
}

export interface PackOpts {
  damage: number;
  blast: number;
  power: number;
  /** seconds a wolf hunts before it gives up and bursts where it is */
  life?: number;
}

/**
 * Camarada: the wolves. Each is the 24-vox/m wolf drawn as glowing reiatsu (the energy mode of the
 * character material, additive), trailing pale blue flame. They arc out of his back, land running,
 * weave toward the target, stretch long for the lunge, hang on with their teeth for a moment, and burst
 * with more force than a Cero. Every third one dives into the ground and erupts under the target.
 */
export class WolfPack implements Projectile {
  done = false;
  private wolves: Wolf[] = [];
  private t = 0;

  constructor(private g: Game, private owner: Fighter, from: THREE.Vector3, ahead: THREE.Vector3, n: number, private target: Fighter | null, readonly o: PackOpts) {
    const model = starrkProp('wolf');
    const b = buildCached(model, false);
    const side = new THREE.Vector3(ahead.z, 0, -ahead.x).normalize();
    for (let i = 0; i < n; i++) {
      const mat = createCharMaterial(b.palette, b.params, model.res, { transparent: true });
      mat.blending = THREE.AdditiveBlending;
      mat.depthWrite = false;
      mat.userData.uniforms.uEnergy.value.set(0.42, 0.7, 1.0, 0.85);
      const mesh = new THREE.Mesh(b.geometry, mat);
      mesh.frustumCulled = false;
      mesh.renderOrder = 6;
      g.engine.gr.scene.add(mesh);
      // out of the bandoleers: up over his shoulders and away, fanned
      const k = n > 1 ? i / (n - 1) - 0.5 : 0;
      const vel = new THREE.Vector3().addScaledVector(ahead, 3 + Math.random() * 3).addScaledVector(side, k * 16 + (Math.random() - 0.5) * 3);
      vel.y = 7 + Math.random() * 4;
      if (target) vel.addScaledVector(_v.subVectors(target.pos, from).setY(0).normalize(), 6);
      this.wolves.push({
        mesh, mat, pos: from.clone().addScaledVector(side, k * 0.6), vel, yaw: Math.atan2(vel.x, vel.z), state: 'pour', t: -i * 0.05,
        phase: Math.random(), side: Math.random() < 0.5 ? -1 : 1, speed: 15 + Math.random() * 5, burrow: i % 3 === 2, bite: new THREE.Vector3(), fade: 0,
      });
    }
    g.sfx.play('howl', from, 1);
  }

  /** wolves still in play */
  get alive(): number {
    return this.wolves.filter((w) => w.state !== 'gone').length;
  }

  private pick(): Fighter | null {
    if (this.target && !this.target.dead && this.g.fighters.includes(this.target)) return this.target;
    this.target = this.g.nearestEnemy(this.owner, 60);
    return this.target;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const tgt = this.pick();
    const life = this.o.life ?? 6;
    for (const w of this.wolves) {
      if (w.state === 'gone') continue;
      w.t += dt;
      if (w.t < 0) {
        // still inside him: rides at the bandoleers until its turn
        continue;
      }
      if (w.state === 'pour') {
        w.vel.y -= 26 * dt;
        w.pos.addScaledVector(w.vel, dt);
        const gy = groundAt(g, w.pos.x, w.pos.y + 0.5, w.pos.z, 3);
        if (gy !== null && w.pos.y <= gy && w.vel.y < 0) {
          w.pos.y = gy;
          w.state = w.burrow ? 'under' : 'hunt';
          w.t = 0;
          if (w.burrow) this.dust(w.pos, 10);
        }
        if (w.t > 2.5) w.state = 'hunt';
        continue;
      }
      if (!tgt) {
        if (w.t > 1) this.burst(g, w, null);
        continue;
      }
      const c = tgt.center();
      _v.subVectors(c, w.pos);
      const flat = Math.hypot(_v.x, _v.z);
      if (w.state === 'hunt' || w.state === 'under') {
        // weave toward the target along the ground
        const dir = _w.set(_v.x / Math.max(1e-3, flat), 0, _v.z / Math.max(1e-3, flat));
        const weave = Math.sin(this.t * 3 + w.phase * 6) * (flat > 6 ? 0.45 : 0.1) * w.side;
        dir.set(dir.x + dir.z * weave, 0, dir.z - dir.x * weave).normalize();
        const sp = w.speed * (w.state === 'under' ? 1.15 : 1);
        w.vel.set(dir.x * sp, 0, dir.z * sp);
        w.pos.addScaledVector(w.vel, dt);
        const gy = groundAt(g, w.pos.x, w.pos.y + 0.8, w.pos.z, 6);
        if (gy !== null) w.pos.y += (gy - w.pos.y) * Math.min(1, dt * 14);
        else w.pos.y -= 10 * dt;
        w.yaw = Math.atan2(w.vel.x, w.vel.z);
        if (w.state === 'under') {
          // a ridge of dust racing over the ground
          if (Math.random() < 0.7) this.dust(w.pos, 1);
          if (flat < 1.6) this.erupt(g, w, tgt);
        } else if (flat < 4.2 && Math.abs(_v.y) < 3) {
          w.state = 'lunge';
          w.t = 0;
          w.vel.copy(_v).normalize().multiplyScalar(30);
          w.vel.y += 3;
        }
        if (w.t > life) this.burst(g, w, null);
        continue;
      }
      if (w.state === 'lunge') {
        w.vel.y -= 14 * dt;
        w.pos.addScaledVector(w.vel, dt);
        w.yaw = Math.atan2(w.vel.x, w.vel.z);
        if (capsuleDist(tgt, w.pos) < tgt.def.radius + 0.45) {
          w.state = 'bite';
          w.t = 0;
          w.bite.subVectors(w.pos, tgt.pos);
          g.damage(tgt, this.o.damage * 0.2, this.owner, _s.copy(w.vel).setY(0).normalize(), { energy: true, knock: 2, hitstop: 0.02, quiet: true });
        } else if (w.t > 0.5) {
          w.state = 'hunt';
          w.t = life * 0.5;
        }
        continue;
      }
      if (w.state === 'bite') {
        // hangs on, worrying at it, then goes off
        w.pos.copy(tgt.pos).add(w.bite);
        w.pos.x += (Math.random() - 0.5) * 0.08;
        w.pos.z += (Math.random() - 0.5) * 0.08;
        if (w.t > 0.32 + w.phase * 0.25) this.burst(g, w, tgt);
      }
    }
    if (this.wolves.every((w) => w.state === 'gone' && w.fade <= 0) || this.t > 14) this.done = true;
  }

  private dust(p: THREE.Vector3, n: number): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      this.g.engine.dust.spawn({ x: p.x, y: p.y + 0.1, z: p.z, vx: Math.cos(a) * 2.5, vy: 1 + Math.random() * 2, vz: Math.sin(a) * 2.5, size: 0.5, sizeEnd: 1.4, life: 0.6, r: 0.6, g: 0.57, b: 0.53, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 2.5 });
    }
  }

  /** a burrowed wolf comes up under the target through the ground */
  private erupt(g: Game, w: Wolf, tgt: Fighter): void {
    const p = tgt.pos.clone();
    g.engine.destruction.carve(new SphereShape(p.clone().setY(p.y - 0.4), 1.5, 0.6), { mode: 'smash', power: 160, impulse: 14, dust: 0.8 });
    tgt.body.vel.y = Math.max(tgt.body.vel.y, 9);
    tgt.hovering = false;
    w.pos.copy(p);
    w.vel.set(0, 18, 0);
    w.state = 'lunge';
    w.t = 0;
    this.dust(p, 14);
    g.sfx.play('crumble', p, 1);
  }

  private burst(g: Game, w: Wolf, hit: Fighter | null): void {
    w.state = 'gone';
    w.fade = 0.12;
    const p = w.pos.clone();
    p.y += 0.4;
    const o = this.o;
    for (const e of g.enemiesOf(this.owner)) {
      const d = capsuleDist(e, p);
      if (d < o.blast + e.def.radius || e === hit) g.damage(e, o.damage * (e === hit ? 1 : 0.6), this.owner, _v.subVectors(e.pos, p).setY(0.4).normalize().clone(), { energy: true, knock: 14, launch: 4, heavy: e === hit, hitstop: 0.05, shake: 0.35 });
    }
    g.engine.destruction.carve(new SphereShape(p.clone(), o.blast, 0.75), { mode: 'explode', power: o.power, impulse: 16, sparks: [BODY.r, BODY.g, BODY.b], dust: 0.7 });
    g.addRing(p.clone(), o.blast * 3.5, STARRK_CERO.body, 0.4);
    const glow = g.engine.glow;
    glow.spawn({ x: p.x, y: p.y, z: p.z, size: o.blast * 2, sizeEnd: o.blast * 4, life: 0.3, r: BODY.r, g: BODY.g, b: BODY.b, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    glow.spawn({ x: p.x, y: p.y, z: p.z, size: o.blast, sizeEnd: o.blast * 2.2, life: 0.12, r: CORE.r, g: CORE.g, b: CORE.b, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2, e = Math.random() * 1.6 - 0.3;
      glow.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * 12, vy: e * 8, vz: Math.sin(a) * 12, size: 0.25, sizeEnd: 0.03, life: 0.4, r: BODY.r, g: BODY.g, b: BODY.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 3 });
    }
    g.sfx.play('explode', p, 0.9);
    if (g.player && g.player.pos.distanceTo(p) < 40) g.shake(0.3);
  }

  render(dt: number, time: number): void {
    const glow = this.g.engine.glow;
    const back = this.owner.center();
    for (const w of this.wolves) {
      const m = w.mesh;
      if (w.state === 'gone') {
        w.fade -= dt;
        m.visible = w.fade > 0;
        if (m.visible) m.scale.setScalar(1 + (0.12 - w.fade) * 6);
        continue;
      }
      if (w.t < 0) {
        m.visible = false;
        w.pos.copy(back);
        continue;
      }
      const under = w.state === 'under';
      m.visible = !under;
      if (under) continue;
      m.position.copy(w.pos);
      // a bounding run: the body bobs and pitches with the stride
      const run = w.state === 'hunt' ? 1 : 0;
      const ph = time * 9 + w.phase * 10;
      m.position.y += run * Math.abs(Math.sin(ph)) * 0.18;
      const pitch = w.state === 'pour' || w.state === 'lunge' ? Math.atan2(-w.vel.y, Math.hypot(w.vel.x, w.vel.z)) * 0.8 : run * Math.sin(ph) * 0.12;
      m.rotation.set(pitch, w.yaw, 0, 'YXZ');
      // the lunge stretches it long and thin
      const stretch = w.state === 'lunge' ? 1.7 : w.state === 'bite' ? 1.2 : 1 + run * Math.sin(ph * 2) * 0.05;
      m.scale.set(1 / Math.sqrt(stretch), 1 / Math.sqrt(stretch), stretch);
      const u = w.mat.userData.uniforms;
      u.uTime.value = time;
      u.uAlpha.value = w.state === 'bite' ? 0.9 + Math.sin(time * 50) * 0.1 : 0.85;
      // pale blue flame off its back and tail
      if (Math.random() < 0.8) {
        const fw = _v.set(Math.sin(w.yaw), 0, Math.cos(w.yaw));
        const x = w.pos.x - fw.x * (0.4 + Math.random() * 0.7), z = w.pos.z - fw.z * (0.4 + Math.random() * 0.7);
        glow.spawn({ x, y: w.pos.y + 0.45 + Math.random() * 0.3, z, vx: -fw.x * 3, vy: 1.5 + Math.random(), vz: -fw.z * 3, size: 0.35, sizeEnd: 0.05, life: 0.35, r: BODY.r, g: BODY.g, b: BODY.b, alpha: 0.7, alphaEnd: 0, tex: TEX_GLOW });
      }
    }
  }

  dispose(): void {
    for (const w of this.wolves) {
      w.mesh.removeFromParent();
      w.mat.dispose();
    }
  }
}
