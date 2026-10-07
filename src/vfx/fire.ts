// Ryūjin Jakka's fire. FlamePool: world-space flame tongues (instanced cards turning toward the camera),
// spawned anywhere with a size, a life and an intensity — every fire below is made of them. FireWave: the
// fire thrown off a swing, a burning crescent that sets the ground alight. Inferno: Taimatsu, a cone of fire
// that burns everything inside to ash. FireDome: Jōkaku Enjō, a ring of fire walls that closes into a dome
// round the target and holds it. FirePillars: Ennetsu Jigoku, pillars of fire rising in a ring round the
// area and merging into one inferno. IttoKaso: Hadō #96, a short shock wave, then a pillar of red fire
// shaped like a sword tip erupting under the target. The Bankai: Erasure (East — whatever the edge touches
// stops existing: an erased trench, no rubble), SkeletonHorde (South — the charred dead rising from the
// ground to swarm the target), HeatHaze (West — heat that melts the ground under him) and Rain (when the
// Bankai ends, the evaporated water comes back).
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { BoxShape, CapsuleShape, SphereShape } from '../destruction/shapes';
import { GetsugaProjectile } from '../game/projectiles/getsuga';
import type { EnergyColors } from './energy';
import { groundAt } from './iceArts';
import { PropMesh } from '../game/characterFactory';
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { capsule, ellipsoid, sphere } from '../models/sdf';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

export const FIRE: EnergyColors = { core: '#FFF4C2', body: '#FF8A2A', rim: '#C4260B' };
export const FIRE_DARK: EnergyColors = { core: '#FFF1C9', body: '#FF5A1A', rim: '#5A1808', dark: '#231C19' };

const _v = new THREE.Vector3();

const NOISE = /* glsl */ `
float fHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float fNoise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(fHash(i), fHash(i + vec3(1,0,0)), f.x), mix(fHash(i + vec3(0,1,0)), fHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(fHash(i + vec3(0,0,1)), fHash(i + vec3(1,0,1)), f.x), mix(fHash(i + vec3(0,1,1)), fHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}`;

const POOL_VERT = /* glsl */ `
attribute vec3 aPos;
attribute vec4 aParam; // width, height, phase, intensity
varying vec2 vUv;
varying float vPhase;
varying float vInt;
void main() {
  vUv = uv;
  vPhase = aParam.z;
  vInt = aParam.w;
  vec3 toCam = cameraPosition - aPos;
  toCam.y = 0.0;
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), normalize(toCam + vec3(1e-4, 0.0, 0.0))));
  vec3 wp = aPos + right * (uv.x - 0.5) * aParam.x + vec3(0.0, 1.0, 0.0) * uv.y * aParam.y;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}`;

const POOL_FRAG = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
varying float vPhase;
varying float vInt;
${NOISE}
void main() {
  float v = vUv.y;
  float t = uTime * 2.6 + vPhase * 17.0;
  float sway = (fNoise(vec3(v * 2.6 - t, vPhase * 9.0, 0.0)) - 0.5) * 0.5 * v;
  float x = vUv.x - 0.5 - sway;
  float w = 0.5 * pow(clamp(1.0 - v, 0.0, 1.0), 0.7) * smoothstep(0.0, 0.12, v);
  float n = fNoise(vec3(x * 5.0, v * 3.5 - t * 1.4, vPhase * 5.0));
  float body = 1.0 - smoothstep(w * 0.5, w, abs(x) + (n - 0.5) * 0.22);
  float fade = smoothstep(1.0, 0.4, v) * smoothstep(0.0, 0.06, v);
  float a = body * fade * clamp(vInt, 0.0, 1.0);
  if (a < 0.01) discard;
  float hot = 1.0 - smoothstep(0.0, w * 0.7, abs(x));
  vec3 rim = vec3(0.77, 0.15, 0.04), mid = vec3(1.0, 0.42, 0.07), core = vec3(1.0, 0.92, 0.66);
  vec3 col = mix(rim, mid, body);
  col = mix(col, core, hot * (1.0 - v * 0.8));
  gl_FragColor = vec4(col * (1.2 + max(0.0, vInt - 1.0) * 0.5), a * 0.85);
}`;

interface Flame { x: number; y: number; z: number; w: number; h: number; life: number; age: number; int: number; ph: number; vy: number }

/** World-space flames. One pool per game, shared by every fire technique. */
export class FlamePool implements Projectile {
  done = false;
  private mesh: THREE.Mesh;
  private pos: Float32Array;
  private prm: Float32Array;
  private flames: Flame[] = [];
  private uniforms = { uTime: { value: 0 } };

  constructor(g: Game, readonly max = 900) {
    const base = new THREE.PlaneGeometry(1, 1, 1, 4);
    base.translate(0, 0.5, 0);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index;
    geo.setAttribute('position', base.attributes.position);
    geo.setAttribute('uv', base.attributes.uv);
    this.pos = new Float32Array(max * 3);
    this.prm = new Float32Array(max * 4);
    geo.setAttribute('aPos', new THREE.InstancedBufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aParam', new THREE.InstancedBufferAttribute(this.prm, 4).setUsage(THREE.DynamicDrawUsage));
    geo.instanceCount = 0;
    this.mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ vertexShader: POOL_VERT, fragmentShader: POOL_FRAG, uniforms: this.uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 6;
    g.engine.gr.scene.add(this.mesh);
  }

  /** the shared pool (created on first use) */
  static of(g: Game): FlamePool {
    const d = g as unknown as { flamePool?: FlamePool };
    if (!d.flamePool || d.flamePool.done) {
      d.flamePool = new FlamePool(g);
      g.addProjectile(d.flamePool);
    }
    return d.flamePool;
  }

  spawn(x: number, y: number, z: number, w: number, h: number, life: number, int = 1, vy = 0): void {
    if (this.flames.length >= this.max) this.flames.shift();
    this.flames.push({ x, y, z, w, h, life, age: 0, int, ph: Math.random(), vy });
  }

  get count(): number {
    return this.flames.length;
  }

  update(dt: number): void {
    for (const f of this.flames) {
      f.age += dt;
      f.y += f.vy * dt;
    }
    this.flames = this.flames.filter((f) => f.age < f.life);
  }

  render(_dt: number, time: number): void {
    this.uniforms.uTime.value = time;
    let i = 0;
    for (const f of this.flames) {
      const k = f.age / f.life;
      // grows in fast, burns, gutters out
      const s = Math.min(1, f.age / 0.12) * (k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1);
      this.pos[i * 3] = f.x; this.pos[i * 3 + 1] = f.y; this.pos[i * 3 + 2] = f.z;
      this.prm[i * 4] = f.w * (0.6 + 0.4 * s); this.prm[i * 4 + 1] = f.h * s; this.prm[i * 4 + 2] = f.ph; this.prm[i * 4 + 3] = f.int * s;
      i++;
    }
    const geo = this.mesh.geometry as THREE.InstancedBufferGeometry;
    geo.instanceCount = i;
    (geo.attributes.aPos as THREE.InstancedBufferAttribute).needsUpdate = true;
    (geo.attributes.aParam as THREE.InstancedBufferAttribute).needsUpdate = true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

/** Fire on the ground at p: flames, embers and smoke, and the world there burns. */
export function burnAt(g: Game, p: THREE.Vector3, r: number, int = 1, life = 1.4): void {
  const pool = FlamePool.of(g);
  const gy = groundAt(g, p.x, p.y + 1, p.z, 4) ?? p.y;
  const n = Math.max(1, Math.round(r * r * 1.4 * int));
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * r;
    pool.spawn(p.x + Math.cos(a) * rr, gy, p.z + Math.sin(a) * rr, 0.5 + Math.random() * 0.6 * int, 0.9 + Math.random() * 1.4 * int, life * (0.6 + Math.random() * 0.6), int);
  }
  g.engine.destruction.carve(new SphereShape(new THREE.Vector3(p.x, gy, p.z), r, 0.5), { mode: 'burn', power: 260 * int, dust: 0.15 });
  if (Math.random() < 0.6) g.engine.dust.spawn({ x: p.x, y: gy + 1, z: p.z, vy: 2, size: 0.8, sizeEnd: 2.8, life: 1.6, r: 0.23, g: 0.2, b: 0.19, alpha: 0.35, alphaEnd: 0, tex: TEX_PUFF, drag: 0.8 });
  for (let i = 0; i < 3; i++) g.engine.glow.spawn({ x: p.x + (Math.random() - 0.5) * r, y: gy + 0.3, z: p.z + (Math.random() - 0.5) * r, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 4, vz: (Math.random() - 0.5) * 2, size: 0.06, sizeEnd: 0.02, life: 0.9, r: 1, g: 0.48, b: 0.12, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, gravity: 1 });
}

// ------------------------------------------------------------------ the fire wave

/** A burning crescent thrown off a swing; it cuts, and the ground it passes over catches fire. */
export class FireWave extends GetsugaProjectile {
  private acc = 0;
  constructor(private gg: Game, owner: Fighter, from: THREE.Vector3, dir: THREE.Vector3, side: THREE.Vector3, big: boolean, colors: EnergyColors = FIRE) {
    super(gg, owner, from, dir, side, { radius: big ? 5 : 2.8, halfAngle: 1.1, speed: big ? 38 : 46, range: big ? 90 : 60, damage: big ? 140 : 60, cut: big ? 900 : 420, colors, dark: !!colors.dark });
  }
  override update(dt: number, g: Game): void {
    super.update(dt, g);
    this.acc += dt;
    if (this.acc < 0.05) return;
    this.acc = 0;
    // it scorches a band of ground behind it
    const p = this.pos.clone().addScaledVector(this.dir, -1.5);
    burnAt(this.gg, p, 1.2, 0.8, 1.6);
  }
}

// ------------------------------------------------------------------ Taimatsu

/** Taimatsu: one wave of the sword, and the cone in front of him becomes an inferno. */
export class Inferno implements Projectile {
  done = false;
  private t = 0;
  private acc = 0;
  private tick = 0;

  constructor(private g: Game, readonly owner: Fighter, readonly origin: THREE.Vector3, readonly dir: THREE.Vector3, readonly len = 16, readonly half = 0.55, readonly dur = 1.4, readonly dps = 80) {
    this.dir = dir.clone().setY(0).normalize();
    g.sfx.play('explode', origin, 1.2);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const grow = Math.min(1, this.t / 0.35);
    this.acc += dt;
    if (this.acc > 0.05 && this.t < this.dur) {
      this.acc = 0;
      for (let i = 0; i < 4; i++) {
        const s = 1.5 + Math.random() * this.len * grow;
        const a = (Math.random() * 2 - 1) * this.half;
        const d = this.dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), a);
        const p = this.origin.clone().addScaledVector(d, s);
        burnAt(g, p, 0.9 + s * 0.08, 1.4, 1.2);
      }
    }
    this.tick -= dt;
    if (this.tick <= 0 && this.t < this.dur) {
      this.tick = 0.15;
      for (const o of g.enemiesOf(this.owner)) {
        const to = _v.subVectors(o.pos, this.origin).setY(0);
        const d = to.length();
        if (d > this.len * grow + o.def.radius || d < 0.3) continue;
        if (Math.acos(Math.max(-1, Math.min(1, to.normalize().dot(this.dir)))) > this.half + 0.1) continue;
        g.damage(o, this.dps * 0.15, this.owner, to.clone(), { energy: true, knock: 1.5, quiet: true, color: '#FF8A2A' });
      }
    }
    if (this.t > this.dur + 0.3) this.done = true;
  }

  dispose(): void {}
}

// ------------------------------------------------------------------ Jōkaku Enjō

/** Jōkaku Enjō: a ring of fire walls rises round the target and closes over into a dome that holds it. */
export class FireDome implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.Mesh;
  private mat: THREE.ShaderMaterial;
  private acc = 0;
  private tick = 0;
  readonly center: THREE.Vector3;

  constructor(private g: Game, readonly owner: Fighter, readonly target: Fighter, readonly radius = 6, readonly dur = 5, readonly dps = 22) {
    this.center = target.pos.clone();
    this.center.y = groundAt(g, this.center.x, this.center.y + 2, this.center.z, 6) ?? this.center.y;
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uA: { value: 0 }, uClose: { value: 0 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: /* glsl */ `varying vec2 vUv; varying vec3 vN; varying vec3 vW;
        void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */ `uniform float uTime; uniform float uA; uniform float uClose; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
        ${NOISE}
        void main() {
          // the dome closes from the ground up: vUv.y = 0 at the top of the sphere, 1 at the ground (three.js sphere uv)
          float h = 1.0 - vUv.y;
          if (h > uClose + 0.02) discard;
          vec3 v = normalize(cameraPosition - vW);
          float f = abs(dot(vN, v));
          float n = fNoise(vec3(vUv.x * 40.0, h * 12.0 - uTime * 3.0, 0.0)) * 0.6 + fNoise(vec3(vUv.x * 90.0, h * 30.0 - uTime * 6.0, 1.0)) * 0.4;
          float tongues = smoothstep(0.25, 0.85, n);
          vec3 col = mix(vec3(0.77, 0.15, 0.04), vec3(1.0, 0.5, 0.1), tongues);
          col = mix(col, vec3(1.0, 0.92, 0.66), pow(tongues, 3.0) * 0.6);
          float edge = smoothstep(uClose + 0.02, uClose - 0.06, h);
          float a = uA * (0.25 + (1.0 - f) * 0.6) * (0.5 + tongues * 0.7) * edge;
          gl_FragColor = vec4(col * 1.6, a);
        }`,
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), this.mat);
    this.mesh.position.copy(this.center);
    this.mesh.scale.set(radius, radius * 0.85, radius);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 6;
    g.engine.gr.scene.add(this.mesh);
    g.sfx.play('explode', this.center, 1.4);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const c = this.center;
    const close = Math.min(1, this.t / 1.0);
    this.acc += dt;
    // the wall of fire round the rim
    if (this.acc > 0.06 && this.t < this.dur) {
      this.acc = 0;
      const pool = FlamePool.of(g);
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2;
        pool.spawn(c.x + Math.cos(a) * this.radius, c.y, c.z + Math.sin(a) * this.radius, 1.6 + Math.random(), 3 + Math.random() * 3 * (1 - close * 0.4), 1.0, 1.3);
      }
    }
    // whoever is inside is held there and burns
    const tg = this.target;
    if (!tg.dead && this.t < this.dur) {
      const d = _v.subVectors(tg.pos, c).setY(0);
      const r = this.radius - tg.def.radius - 0.4;
      if (d.length() > r) {
        d.setLength(r);
        tg.body.pos.x = c.x + d.x;
        tg.body.pos.z = c.z + d.z;
        tg.body.vel.x = 0;
        tg.body.vel.z = 0;
      }
      if (tg.pos.y > c.y + this.radius * 0.8 * close) tg.body.pos.y = c.y + this.radius * 0.8 * close;
    }
    this.tick -= dt;
    if (this.tick <= 0 && this.t < this.dur) {
      this.tick = 0.25;
      for (const o of g.enemiesOf(this.owner)) {
        if (Math.hypot(o.pos.x - c.x, o.pos.z - c.z) > this.radius) continue;
        g.damage(o, this.dps * 0.25, this.owner, new THREE.Vector3(), { energy: true, knock: 0, quiet: true, color: '#FF8A2A' });
      }
    }
    if (this.t > this.dur + 0.6) this.done = true;
  }

  render(_dt: number, time: number): void {
    this.mat.uniforms.uTime.value = time;
    this.mat.uniforms.uClose.value = Math.min(1, this.t / 1.0);
    const k = Math.min(1, this.t / 0.2) * (this.t > this.dur ? Math.max(0, 1 - (this.t - this.dur) / 0.6) : 1);
    this.mat.uniforms.uA.value = k;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}

// ------------------------------------------------------------------ Ennetsu Jigoku

/** Ennetsu Jigoku: liquid fire runs out from the blade in circling lines, pillars rise round the area and merge into one inferno. */
export class FirePillars implements Projectile {
  done = false;
  private t = 0;
  private acc = 0;
  private tick = 0;
  private pillars: THREE.Vector3[] = [];
  readonly center: THREE.Vector3;
  private bursted = false;

  constructor(private g: Game, readonly owner: Fighter, center: THREE.Vector3, readonly radius = 14, readonly n = 8, readonly dur = 4.5, readonly damage = 220) {
    this.center = center.clone();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.2;
      const p = new THREE.Vector3(center.x + Math.cos(a) * radius, center.y, center.z + Math.sin(a) * radius);
      p.y = groundAt(g, p.x, p.y + 4, p.z, 10) ?? center.y;
      this.pillars.push(p);
    }
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const c = this.center;
    const pool = FlamePool.of(g);
    // 0..0.9: the fire runs out along the ground in circling lines to where the pillars will stand
    if (this.t < 0.9) {
      this.acc += dt;
      if (this.acc > 0.04) {
        this.acc = 0;
        const k = this.t / 0.9;
        for (const p of this.pillars) {
          const a0 = Math.atan2(p.z - c.z, p.x - c.x);
          const r = this.radius * k;
          const a = a0 + Math.sin(k * Math.PI) * 0.6;
          const q = new THREE.Vector3(c.x + Math.cos(a) * r, c.y, c.z + Math.sin(a) * r);
          q.y = groundAt(g, q.x, q.y + 3, q.z, 6) ?? c.y;
          pool.spawn(q.x, q.y, q.z, 0.5, 0.8, 0.9, 1.2);
          g.engine.destruction.carve(new SphereShape(q, 0.5, 0.4), { mode: 'burn', power: 300, dust: 0 });
        }
      }
    } else if (this.t < this.dur) {
      // the pillars, growing taller, then the whole ring merges into one inferno
      const merge = Math.max(0, (this.t - 2.2) / 1.2);
      this.acc += dt;
      if (this.acc > 0.05) {
        this.acc = 0;
        for (const p of this.pillars) {
          const h = Math.min(1, (this.t - 0.9) / 0.5);
          for (let i = 0; i < 3; i++) pool.spawn(p.x + (Math.random() - 0.5) * 2, p.y, p.z + (Math.random() - 0.5) * 2, 2.4 + Math.random(), (6 + Math.random() * 10) * h, 0.9, 1.4, 4 * h);
        }
        if (merge > 0)
          for (let i = 0; i < 8; i++) {
            const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * this.radius * Math.min(1, merge);
            burnAt(g, new THREE.Vector3(c.x + Math.cos(a) * rr, c.y, c.z + Math.sin(a) * rr), 1.4, 1.6, 1.4);
          }
      }
      if (!this.bursted && this.t >= 0.9) {
        this.bursted = true;
        g.sfx.play('explode', c, 2.4);
        g.shake(0.6);
        for (const p of this.pillars) g.engine.destruction.carve(new CapsuleShape(p.clone(), p.clone().setY(p.y + 8), 1.6), { mode: 'burn', power: 600, dust: 0.3 });
      }
      this.tick -= dt;
      if (this.tick <= 0) {
        this.tick = 0.2;
        for (const o of g.enemiesOf(this.owner)) {
          const d = Math.hypot(o.pos.x - c.x, o.pos.z - c.z);
          const near = this.pillars.some((p) => Math.hypot(o.pos.x - p.x, o.pos.z - p.z) < 2.6);
          if (!near && !(merge > 0 && d < this.radius * Math.min(1, merge))) continue;
          g.damage(o, (this.damage / ((this.dur - 0.9) / 0.2)) * (near ? 1.4 : 1), this.owner, o.pos.clone().sub(c).setY(0).normalize(), { energy: true, knock: 1, launch: near ? 2 : 0, quiet: true, color: '#FF8A2A' });
        }
      }
    }
    if (this.t > this.dur + 0.5) this.done = true;
  }

  dispose(): void {}
}

// ------------------------------------------------------------------ Ittō Kasō

/** Hadō #96 Ittō Kasō: a shock wave, then a gigantic pillar of red fire shaped like a sword's tip under the target. */
export class IttoKaso implements Projectile {
  done = false;
  private t = 0;
  private blade: THREE.Mesh;
  private mat: THREE.ShaderMaterial;
  private struck = false;
  readonly base: THREE.Vector3;

  constructor(private g: Game, readonly owner: Fighter, at: THREE.Vector3, readonly damage = 260) {
    this.base = at.clone();
    this.base.y = groundAt(g, at.x, at.y + 2, at.z, 6) ?? at.y;
    // the pillar: a tall flat blade tip of fire, edge toward the camera's side
    const shape = new THREE.Shape();
    shape.moveTo(-3, 0);
    shape.lineTo(3, 0);
    shape.lineTo(3, 34);
    shape.lineTo(0, 46);
    shape.lineTo(-3, 30);
    shape.lineTo(-3, 0);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 2.4, bevelEnabled: false });
    geo.translate(0, 0, -1.2);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uA: { value: 0 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: /* glsl */ `varying vec3 vP; void main() { vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `uniform float uTime; uniform float uA; varying vec3 vP;
        ${NOISE}
        void main() {
          float n = fNoise(vec3(vP.x * 0.6, vP.y * 0.25 - uTime * 6.0, vP.z)) ;
          vec3 col = mix(vec3(0.89, 0.15, 0.06), vec3(1.0, 0.83, 0.6), smoothstep(0.55, 1.0, n));
          float a = uA * (0.55 + n * 0.5) * smoothstep(46.0, 30.0, vP.y + n * 6.0);
          gl_FragColor = vec4(col * 1.8, a);
        }`,
    });
    this.blade = new THREE.Mesh(geo, this.mat);
    this.blade.position.copy(this.base);
    this.blade.scale.set(1, 0.01, 1);
    this.blade.frustumCulled = false;
    this.blade.renderOrder = 7;
    const cam = g.engine.gr.camera.position;
    this.blade.rotation.y = Math.atan2(cam.x - this.base.x, cam.z - this.base.z);
    g.engine.gr.scene.add(this.blade);
    g.addRing(this.base.clone().setY(this.base.y + 0.2), 10, '#E3260F', 0.3);
    g.sfx.play('charge', this.base, 1.4);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (!this.struck && this.t >= 0.35) {
      this.struck = true;
      const b = this.base;
      for (const o of g.enemiesOf(this.owner)) {
        if (Math.hypot(o.pos.x - b.x, o.pos.z - b.z) > 4.5 + o.def.radius) continue;
        g.damage(o, this.damage, this.owner, new THREE.Vector3(0, 1, 0), { energy: true, knock: 6, launch: 14, heavy: true, hitstop: 0.2, shake: 1, color: '#E3260F' });
      }
      g.engine.destruction.carve(new CapsuleShape(b.clone().setY(b.y - 2), b.clone().setY(b.y + 30), 3.6), { mode: 'explode', power: 1200, impulse: 20, dust: 0.8 });
      g.engine.destruction.carve(new SphereShape(b.clone(), 9, 0.3), { mode: 'burn', power: 800, dust: 0.3 });
      burnAt(g, b, 6, 2, 2.4);
      g.sfx.play('explode', b, 2.5);
      g.shake(1);
      g.slowMo(0.3, 0.35);
      g.engine.gr.chroma.offset.set(0.008, 0.008);
    }
    if (this.t > 2.2) this.done = true;
  }

  render(_dt: number, time: number): void {
    const t = this.t;
    const rise = t < 0.35 ? 0.01 : Math.min(1, (t - 0.35) / 0.18);
    this.blade.scale.set(1 + (1 - rise) * 0.5, Math.max(0.01, rise), 1);
    this.mat.uniforms.uTime.value = time;
    this.mat.uniforms.uA.value = t < 0.35 ? 0 : t > 1.6 ? Math.max(0, 1 - (t - 1.6) / 0.6) : 1;
  }

  dispose(): void {
    this.blade.removeFromParent();
    this.blade.geometry.dispose();
    this.mat.dispose();
  }
}

// ------------------------------------------------------------------ Zanka no Tachi

/** East, Kyokujitsujin: a straight line of ground in front of him simply stops existing — no rubble, a glowing rim. */
export function eraseTrench(g: Game, owner: Fighter, from: THREE.Vector3, dir: THREE.Vector3, len: number, width: number, depth: number, damage: number): void {
  const d = dir.clone().setY(0).normalize();
  const mid = from.clone().addScaledVector(d, len / 2);
  mid.y -= depth / 2 - 0.4;
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), d);
  g.engine.destruction.carve(new BoxShape(mid, new THREE.Vector3(width / 2, depth / 2 + 0.6, len / 2), quat), { mode: 'erase', power: 1e6, dust: 0 });
  for (const o of g.enemiesOf(owner)) {
    const to = _v.subVectors(o.pos, from).setY(0);
    const along = to.dot(d);
    if (along < 0 || along > len) continue;
    if (to.addScaledVector(d, -along).length() > width / 2 + o.def.radius) continue;
    g.damage(o, damage, owner, d.clone(), { energy: true, knock: 4, launch: 6, heavy: true, hitstop: 0.14, shake: 0.6, color: '#FFF1C9' });
  }
  // the rim glows where it was cut away, then cools
  for (let s = 0; s < len; s += 0.8) {
    for (const k of [-1, 1]) {
      const p = from.clone().addScaledVector(d, s).add(new THREE.Vector3(-d.z * k * width / 2, 0, d.x * k * width / 2));
      g.engine.glow.spawn({ x: p.x, y: p.y + 0.05, z: p.z, size: 0.4, sizeEnd: 0.1, life: 1.2 + Math.random() * 0.6, r: 1, g: 0.55, b: 0.2, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
  }
  g.sfx.play('beam', from, 1.2);
}

let skeletonModel: VoxelModel | null = null;

/** a charred skeleton at 24 vox/m, hunched and reaching (origin at the feet) */
function skeleton(): VoxelModel {
  if (skeletonModel) return skeletonModel;
  const b = new ModelBuilder('ash-skeleton', 24);
  b.mat('bone', ['#5C524C', '#46403B', '#2E2724', '#1E1A18'], { base: 1, rough: 0.9, shadeK: 0.8 });
  b.mat('ember', ['#FF8A2A', '#FF6A1E'], { glow: 1.2 });
  b.mat('eye', ['#FFB040'], { glow: 1.6 });
  b.bone('root', null, [0, 0, 0]);
  // legs, pelvis, a hunched spine of vertebrae, a ribcage, arms reaching forward, the skull
  for (const k of [-1, 1]) {
    b.add('root', capsule([k * 2, 0.6, 0], [k * 2, 10, 0.8], 0.8), 'bone');
    b.add('root', capsule([k * 2, 10, 0.8], [k * 2.2, 19, 0], 0.9), 'bone');
    b.add('root', capsule([k * 5.2, 31, 2.4], [k * 4.6, 25, 7], 0.7), 'bone');
    b.add('root', capsule([k * 4.6, 25, 7], [k * 3.6, 26, 13], 0.65), 'bone');
    for (let i = 0; i < 3; i++) b.add('root', capsule([k * 3.6, 26, 13], [k * (3 + i * 0.6), 25 - i * 0.6, 16], 0.3), 'bone', { thr: 0.2 });
  }
  b.add('root', ellipsoid([0, 20, 0], [3.6, 1.6, 2]), 'bone');
  for (let i = 0; i < 6; i++) b.add('root', sphere([0, 21.5 + i * 2, -0.4 + i * 0.6], 0.9), 'bone');
  for (let i = 0; i < 4; i++) {
    const y = 26 + i * 1.6;
    b.add('root', capsule([-3.6 + i * 0.2, y, 2.4 + i * 0.3], [3.6 - i * 0.2, y, 2.4 + i * 0.3], 0.4), 'bone', { thr: 0.2 });
  }
  b.add('root', ellipsoid([0, 35, 4], [2.6, 2.8, 3]), 'bone');
  b.add('root', ellipsoid([0, 33.2, 5.6], [1.8, 1.2, 1.8]), 'bone');
  for (const k of [-1, 1]) b.voxel('root', k, 35, 7, 'eye', 0);
  b.paint('root', ellipsoid([0, 26, 1], [3, 6, 2]), 'ember', { where: (v) => Math.random() < 0.08 && b.isMat('bone')(v) });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return (skeletonModel = b.build());
}

/** South, Kaka Jūman'okushi Daisōjin: the charred dead rise from a rupture in the ground and swarm the target. */
export class SkeletonHorde implements Projectile {
  done = false;
  private t = 0;
  private dead: { m: PropMesh; p: THREE.Vector3; v: THREE.Vector3; rise: number; hit: boolean; latch: number }[] = [];
  private tick = 0;

  constructor(private g: Game, readonly owner: Fighter, readonly target: Fighter, readonly n = 26, readonly dur = 5, readonly damage = 9) {
    const c = owner.pos.clone();
    const fw = owner.forward(new THREE.Vector3());
    for (let i = 0; i < n; i++) {
      const a = (Math.random() - 0.5) * 2.4, r = 2 + Math.random() * 8;
      const d = fw.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), a);
      const p = c.clone().addScaledVector(d, r);
      p.y = (groundAt(g, p.x, p.y + 3, p.z, 6) ?? c.y) - 1.6;
      const m = new PropMesh(skeleton());
      m.position.copy(p);
      g.engine.gr.scene.add(m);
      this.dead.push({ m, p, v: new THREE.Vector3(), rise: 0.1 + Math.random() * 0.8, hit: false, latch: 0 });
    }
    // the rupture
    g.engine.destruction.carve(new SphereShape(c.clone().addScaledVector(fw, 5), 4, 0.3), { mode: 'explode', power: 300, impulse: 10 });
    g.sfx.play('explode', c, 1.4);
    g.shake(0.5);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const tg = this.target;
    const tp = tg.pos;
    for (const s of this.dead) {
      if (this.t < s.rise) continue;
      const age = this.t - s.rise;
      if (age < 0.5) {
        // clawing up out of the ground
        s.p.y += dt * 3.4;
        continue;
      }
      if (s.latch > 0) {
        // clinging to the target, burning it down
        s.latch -= dt;
        s.p.lerp(new THREE.Vector3(tp.x + Math.sin(this.t * 3 + s.rise * 9) * 0.5, tp.y, tp.z + Math.cos(this.t * 3 + s.rise * 9) * 0.5), Math.min(1, dt * 8));
        continue;
      }
      const to = _v.subVectors(tp, s.p).setY(0);
      const d = to.length();
      if (d < 0.9 && !tg.dead && this.t < this.dur) {
        s.latch = 1.2;
        if (!s.hit) {
          s.hit = true;
          g.damage(tg, this.damage, this.owner, to.normalize().clone(), { energy: true, knock: 1, hitstop: 0.02, quiet: Math.random() < 0.6, color: '#FF6A1E' });
        }
        continue;
      }
      s.v.copy(to.normalize()).multiplyScalar(7 + (s.rise % 0.3) * 6);
      s.p.addScaledVector(s.v, dt);
      s.p.y = (groundAt(g, s.p.x, s.p.y + 2, s.p.z, 4) ?? s.p.y);
    }
    // the swarm holds the target and burns it while they cling
    const clinging = this.dead.filter((s) => s.latch > 0).length;
    this.tick -= dt;
    if (clinging > 0 && !tg.dead && this.tick <= 0) {
      this.tick = 0.2;
      g.damage(tg, clinging * 1.4, this.owner, new THREE.Vector3(), { energy: true, knock: 0, quiet: true, color: '#FF6A1E' });
      tg.hitstun = Math.max(tg.hitstun, 0.25);
      tg.body.vel.x *= 0.3;
      tg.body.vel.z *= 0.3;
    }
    if (this.t > this.dur) {
      // they crumble to ash
      for (const s of this.dead) {
        if (!s.m.visible) continue;
        s.m.visible = false;
        for (let i = 0; i < 4; i++) g.engine.dust.spawn({ x: s.p.x, y: s.p.y + 0.8, z: s.p.z, vx: (Math.random() - 0.5) * 2, vy: Math.random() * 2, vz: (Math.random() - 0.5) * 2, size: 0.4, sizeEnd: 1.4, life: 1.2, r: 0.55, g: 0.52, b: 0.5, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 1.5 });
      }
      if (this.t > this.dur + 0.3) this.done = true;
    }
  }

  render(): void {
    for (const s of this.dead) {
      if (this.t < s.rise) {
        s.m.visible = false;
        continue;
      }
      s.m.visible = this.t <= this.dur;
      s.m.position.copy(s.p);
      const tp = this.target.pos;
      s.m.rotation.set(0.2 + Math.sin(this.t * 9 + s.rise * 20) * 0.08, Math.atan2(tp.x - s.p.x, tp.z - s.p.z), Math.sin(this.t * 7 + s.rise * 13) * 0.1);
      if (Math.random() < 0.08) this.g.engine.glow.spawn({ x: s.p.x, y: s.p.y + 1.2, z: s.p.z, vy: 1.5, size: 0.08, sizeEnd: 0.02, life: 0.6, r: 1, g: 0.42, b: 0.12, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    }
  }

  dispose(): void {
    for (const s of this.dead) {
      s.m.removeFromParent();
      s.m.material.dispose();
    }
  }
}

/** West, Zanjitsu Gokui: the heat round him — a haze, and the ground melting under his feet. */
export function heatHaze(g: Game, f: Fighter, visible: boolean): void {
  const p = f.pos;
  if (Math.random() < 0.3) g.engine.destruction.carve(new SphereShape(new THREE.Vector3(p.x, p.y - 0.2, p.z), 0.9, 0.35), { mode: 'burn', power: 400, dust: 0 });
  for (let i = 0; i < (visible ? 4 : 1); i++) {
    const a = Math.random() * Math.PI * 2, r = 0.3 + Math.random() * 0.6;
    g.engine.glow.spawn({ x: p.x + Math.cos(a) * r, y: p.y + Math.random() * f.def.height, z: p.z + Math.sin(a) * r, vy: 1.5, size: visible ? 0.4 : 0.25, sizeEnd: 0.05, life: 0.5, r: 1, g: visible ? 0.8 : 0.6, b: visible ? 0.5 : 0.3, alpha: visible ? 0.6 : 0.15, alphaEnd: 0, tex: visible ? TEX_GLOW : TEX_PUFF });
  }
}

/** The rain that comes back when the Bankai ends: streaks falling round the camera for a while. */
export class Rain implements Projectile {
  done = false;
  private t = 0;
  constructor(private g: Game, readonly dur = 8) {}
  update(dt: number): void {
    this.t += dt;
    const cam = this.g.engine.gr.camera.position;
    const k = Math.min(1, this.t / 1.5) * Math.min(1, (this.dur - this.t) / 1.5);
    const n = Math.round(30 * k);
    for (let i = 0; i < n; i++) {
      const x = cam.x + (Math.random() - 0.5) * 40, z = cam.z + (Math.random() - 0.5) * 40;
      this.g.engine.glow.spawn({ x, y: cam.y + 12, z, vx: 1, vy: -28, vz: 0.5, size: 0.06, sizeEnd: 0.06, life: 0.8, r: 0.7, g: 0.78, b: 0.9, alpha: 0.35, alphaEnd: 0.2, tex: TEX_STREAK, stretch: 6 });
    }
    if (this.t > this.dur) this.done = true;
  }
  dispose(): void {}
}

// ------------------------------------------------------------------ the sky

export interface SkyLook {
  zen: THREE.ColorRepresentation;
  hor: THREE.ColorRepresentation;
  cloud: THREE.ColorRepresentation;
  cover: number;
  /** multipliers on the base sun glow, sun and hemisphere intensities */
  glow: number;
  sun: number;
  hemi: number;
  fog: THREE.ColorRepresentation;
}

/** the sky on fire (the Shikai's release) */
export const SKY_FIRE: SkyLook = { zen: '#4A1E10', hor: '#E07A30', cloud: '#9A4220', cover: 0.5, glow: 1.6, sun: 0.85, hemi: 0.95, fog: '#C8774A' };
/** every cloud burnt away, a white-hot clear sky (the Bankai) */
export const SKY_SCORCHED: SkyLook = { zen: '#3E7AC8', hor: '#F2E2B8', cloud: '#F2E2B8', cover: 0, glow: 2.2, sun: 1.25, hemi: 1.1, fog: '#E8D6B0' };
/** the rain that comes back after it */
export const SKY_RAIN: SkyLook = { zen: '#465060', hor: '#98A2AE', cloud: '#5A6674', cover: 0.95, glow: 0.2, sun: 0.5, hemi: 0.85, fog: '#9AA4B0' };

/** Blends the sky toward a look while `target` is 1, back to how it was when it goes to 0 (then done). */
export class SkyTint implements Projectile {
  done = false;
  level = 0;
  target = 1;
  private base: { zen: THREE.Color; hor: THREE.Color; cloud: THREE.Color; cover: number; sunGlow: number; sun: number; hemi: number; fog: THREE.Color } | null = null;

  constructor(private g: Game, public look: SkyLook, readonly rate = 1.2) {}

  update(dt: number, g: Game): void {
    const gr = g.engine.gr;
    const u = gr.sky.uniforms;
    if (!this.base) this.base = { zen: (u.uZenith.value as THREE.Color).clone(), hor: (u.uHorizon.value as THREE.Color).clone(), cloud: (u.uCloudColor.value as THREE.Color).clone(), cover: u.uCloudCover.value as number, sunGlow: u.uSunGlow.value as number, sun: gr.sun.intensity, hemi: gr.hemi.intensity, fog: (gr.scene.fog as THREE.Fog).color.clone() };
    this.level += (this.target - this.level) * (1 - Math.exp(-dt * this.rate));
    const k = this.level, b = this.base, L = this.look;
    (u.uZenith.value as THREE.Color).copy(b.zen).lerp(new THREE.Color(L.zen), k);
    (u.uHorizon.value as THREE.Color).copy(b.hor).lerp(new THREE.Color(L.hor), k);
    (u.uCloudColor.value as THREE.Color).copy(b.cloud).lerp(new THREE.Color(L.cloud), k);
    u.uCloudCover.value = b.cover + (L.cover - b.cover) * k;
    u.uSunGlow.value = b.sunGlow * (1 + (L.glow - 1) * k);
    gr.sun.intensity = b.sun * (1 + (L.sun - 1) * k);
    gr.hemi.intensity = b.hemi * (1 + (L.hemi - 1) * k);
    (gr.scene.fog as THREE.Fog).color.copy(b.fog).lerp(new THREE.Color(L.fog), k);
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
