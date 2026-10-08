// Yammy Llargo's effects (docs/kits/yammy.md). The reiatsu shield Ira wraps round himself and blows outward, the pale
// soul wisps Gonzui draws into his mouth, the fissure his Cero tears along the ground, the black orb of Cero Oscuras
// blowing up in his face, and the burst of the rage evolution.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { BoxShape, SphereShape } from '../destruction/shapes';
import { groundAt } from './iceArts';
import { TEX_GLOW, TEX_PUFF, TEX_RING, TEX_STREAK } from './sprites';

/** released reiatsu: an orange-red body round a pale-orange core */
export const IRA_REIATSU = { core: '#FFB070', body: '#FF5A1E', rim: '#A3260E' };
/** his Cero: red round a pale-pink core */
export const YAMMY_CERO = { core: '#FFD0C8', body: '#E01A28', rim: '#7A0A12' };
/** Cero Oscuras: black with a crimson rim (the manga's colours) */
export const OSCURAS = { core: '#FF8A96', body: '#9E0F1C', rim: '#4A0610', dark: '#0B0B0E' };
export const BALA_RED = '#E43A2E';
const SOUL = new THREE.Color('#DDE8F2');
const REI = new THREE.Color(IRA_REIATSU.body);
const REI_CORE = new THREE.Color(IRA_REIATSU.core);

const _v = new THREE.Vector3();

const SHELL_VERT = `varying vec3 vN; varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`;
const SHELL_FRAG = /* glsl */ `
uniform float uTime; uniform float uA; uniform vec3 uCore; uniform vec3 uBody;
varying vec3 vN; varying vec3 vW;
float h(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float n3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h(i), h(i + vec3(1, 0, 0)), f.x), mix(h(i + vec3(0, 1, 0)), h(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h(i + vec3(0, 0, 1)), h(i + vec3(1, 0, 1)), f.x), mix(h(i + vec3(0, 1, 1)), h(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
void main() {
  vec3 v = normalize(cameraPosition - vW);
  float rim = 1.0 - abs(dot(normalize(vN), v));
  float n = n3(vW * 0.35 + vec3(0.0, -uTime * 2.2, 0.0));
  float a = uA * (0.08 + pow(rim, 2.2) * 0.85) * (0.75 + n * 0.5);
  vec3 c = mix(uBody, uCore, pow(rim, 5.0) * 0.6 + n * 0.15);
  gl_FragColor = vec4(c * 1.6, a);
}`;

/**
 * The reiatsu shield: a shell of orange-red light wrapped round him, following him, flickering where it is struck.
 * `burst()` blows it outward (the kit deals the damage); it then swells and fades.
 */
export class IraShell implements Projectile {
  done = false;
  private mesh: THREE.Mesh;
  private u: Record<string, THREE.IUniform>;
  private t = 0;
  private burstT = -1;
  private readonly center = new THREE.Vector3();

  constructor(private g: Game, private f: Fighter, private radius: () => number) {
    this.u = { uTime: { value: 0 }, uA: { value: 0 }, uCore: { value: REI_CORE.clone() }, uBody: { value: REI.clone() } };
    this.mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1, 4),
      new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: SHELL_VERT, fragmentShader: SHELL_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
    );
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 7;
    g.engine.gr.scene.add(this.mesh);
  }

  get bursting(): boolean {
    return this.burstT >= 0;
  }

  /** a blow landing on the shell: it flares */
  flash(): void {
    this.u.uA.value = Math.min(1.6, (this.u.uA.value as number) + 0.6);
  }

  burst(): void {
    if (this.burstT >= 0) return;
    this.burstT = 0;
    const c = this.f.center(this.center);
    const r = this.radius();
    const glow = this.g.engine.glow;
    for (let i = 0; i < 90; i++) {
      const a = Math.random() * Math.PI * 2, b = Math.acos(Math.random() * 2 - 1);
      const d = _v.set(Math.sin(b) * Math.cos(a), Math.cos(b), Math.sin(b) * Math.sin(a));
      const col = Math.random() < 0.3 ? REI_CORE : REI;
      glow.spawn({ x: c.x + d.x * r, y: c.y + d.y * r, z: c.z + d.z * r, vx: d.x * r * 3, vy: d.y * r * 3, vz: d.z * r * 3, size: r * 0.12, sizeEnd: r * 0.02, life: 0.5, r: col.r, g: col.g, b: col.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 2 });
    }
    this.g.addRing(new THREE.Vector3(c.x, this.f.pos.y + 0.3, c.z), r * 2.4, IRA_REIATSU.body, 0.6);
  }

  update(dt: number): void {
    this.t += dt;
    if (this.f.dead && this.burstT < 0) this.burstT = 0;
    if (this.burstT >= 0) {
      this.burstT += dt;
      if (this.burstT > 0.45) this.done = true;
    }
  }

  render(_dt: number, time: number): void {
    const r = this.radius();
    this.f.center(this.center);
    this.mesh.position.copy(this.center);
    this.u.uTime.value = time;
    if (this.burstT >= 0) {
      const k = this.burstT / 0.45;
      this.mesh.scale.setScalar(r * (1 + k * 1.6));
      this.u.uA.value = (1 - k) * 1.4;
      return;
    }
    const grow = Math.min(1, this.t / 0.25);
    this.mesh.scale.setScalar(r * (0.6 + 0.4 * grow) * (1 + Math.sin(time * 9) * 0.015));
    // relax toward the steady glow after a flash
    const a = this.u.uA.value as number;
    this.u.uA.value = a + (grow * 0.9 - a) * 0.12;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

/** Gonzui: pale soul wisps drawn from `from` into the mouth at `to` (n of them, spread over `spread` m). */
export function soulWisps(g: Game, from: THREE.Vector3, to: THREE.Vector3, n: number, spread: number): void {
  const glow = g.engine.glow;
  for (let i = 0; i < n; i++) {
    const x = from.x + (Math.random() - 0.5) * spread, y = from.y + (Math.random() - 0.5) * spread * 0.6, z = from.z + (Math.random() - 0.5) * spread;
    const dx = to.x - x, dy = to.y - y, dz = to.z - z;
    const d = Math.hypot(dx, dy, dz) || 1;
    const life = Math.min(1.2, 0.25 + d / 18);
    glow.spawn({ x, y, z, vx: dx / life, vy: dy / life, vz: dz / life, size: 0.26 + Math.random() * 0.3, sizeEnd: 0.06, life, r: SOUL.r, g: SOUL.g, b: SOUL.b, alpha: 0.9, alphaEnd: 0.15, tex: Math.random() < 0.6 ? TEX_STREAK : TEX_GLOW, stretch: 4, drag: 0 });
  }
}

/**
 * The fissure his Cero tears in the ground: from `from` along `dir` for `len` m, opening one stretch after another
 * (the kit calls `step` over time). Whoever stands on it is thrown up.
 */
export class Fissure implements Projectile {
  done = false;
  private d = 0;
  private hit = new Set<number>();
  private readonly dir: THREE.Vector3;
  private readonly q = new THREE.Quaternion();

  constructor(private g: Game, private owner: Fighter, private from: THREE.Vector3, dir: THREE.Vector3, private len: number, private power: number, private damage: number, private speed = 40, private width = 0.55) {
    this.dir = dir.clone().setY(0).normalize();
    const across = new THREE.Vector3(this.dir.z, 0, -this.dir.x);
    const m = new THREE.Matrix4().makeBasis(across, new THREE.Vector3(0, 1, 0), this.dir);
    this.q.setFromRotationMatrix(m);
  }

  update(dt: number): void {
    const { g } = this;
    const next = Math.min(this.len, this.d + this.speed * dt);
    while (this.d < next) {
      this.d = Math.min(next, this.d + 0.9);
      const p = this.from.clone().addScaledVector(this.dir, this.d);
      const gy = groundAt(g, p.x, p.y + 3, p.z, 8);
      if (gy === null) continue;
      p.y = gy - 0.3;
      const w = this.width * (0.7 + Math.sin(this.d * 1.7) * 0.3 + 0.3 * Math.min(1, this.d / 4));
      g.engine.destruction.carve(new BoxShape(p, new THREE.Vector3(w, 1.2, 0.6), this.q), { mode: 'explode', power: this.power, impulse: 9, dust: 0.6 });
      if (Math.random() < 0.5) g.engine.glow.spawn({ x: p.x, y: gy + 0.2, z: p.z, vx: 0, vy: 3, vz: 0, size: 0.6, sizeEnd: 0.1, life: 0.35, r: 0.88, g: 0.1, b: 0.16, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
      g.engine.dust.spawn({ x: p.x, y: gy + 0.2, z: p.z, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 3, vz: (Math.random() - 0.5) * 3, size: 0.6, sizeEnd: 1.8, life: 0.9, r: 0.55, g: 0.5, b: 0.45, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 1.6 });
      for (const o of g.enemiesOf(this.owner)) {
        if (this.hit.has(o.id) || Math.hypot(o.pos.x - p.x, o.pos.z - p.z) > 1.4 + o.def.radius || Math.abs(o.pos.y - gy) > 1.5) continue;
        this.hit.add(o.id);
        g.damage(o, this.damage, this.owner, this.dir.clone().setY(0.4).normalize(), { energy: true, knock: 6, launch: 9, heavy: true, hitstop: 0.06, shake: 0.35 });
      }
    }
    if (this.d >= this.len) this.done = true;
  }

  dispose(): void {}
}

/** Cero Oscuras blowing up in his face: a black-crimson burst at the mouth */
export function oscurasBackfire(g: Game, at: THREE.Vector3, size: number): void {
  const glow = g.engine.glow, dust = g.engine.dust;
  const body = new THREE.Color(OSCURAS.body), core = new THREE.Color(OSCURAS.core);
  glow.spawn({ x: at.x, y: at.y, z: at.z, size: size * 2, sizeEnd: size * 9, life: 0.45, r: body.r, g: body.g, b: body.b, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  glow.spawn({ x: at.x, y: at.y, z: at.z, size: size, sizeEnd: size * 6, life: 0.3, r: core.r, g: core.g, b: core.b, alpha: 0.9, alphaEnd: 0, tex: TEX_RING });
  for (let i = 0; i < 60; i++) {
    const a = Math.random() * Math.PI * 2, b = Math.acos(Math.random() * 2 - 1);
    const s = size * (4 + Math.random() * 6);
    const dark = Math.random() < 0.55;
    glow.spawn({ x: at.x, y: at.y, z: at.z, vx: Math.sin(b) * Math.cos(a) * s, vy: Math.cos(b) * s, vz: Math.sin(b) * Math.sin(a) * s, size: size * 0.5, sizeEnd: size * 0.08, life: 0.6, r: dark ? 0.06 : body.r, g: dark ? 0.02 : body.g, b: dark ? 0.03 : body.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2.5, drag: 1.5 });
  }
  for (let i = 0; i < 24; i++) {
    const a = Math.random() * Math.PI * 2;
    dust.spawn({ x: at.x, y: at.y, z: at.z, vx: Math.cos(a) * size * 3, vy: Math.random() * size * 2, vz: Math.sin(a) * size * 3, size: size * 1.2, sizeEnd: size * 3.5, life: 1.4, r: 0.12, g: 0.1, b: 0.1, alpha: 0.7, alphaEnd: 0, tex: TEX_PUFF, drag: 1.4 });
  }
  g.engine.destruction.carve(new SphereShape(at.clone(), size * 2.2, 0.8), { mode: 'explode', power: 420, impulse: 16 });
}

/** the rage evolution: a sphere of orange-red reiatsu exploding outward from him */
export function rageBurst(g: Game, at: THREE.Vector3, r: number): void {
  const glow = g.engine.glow;
  glow.spawn({ x: at.x, y: at.y, z: at.z, size: r * 0.4, sizeEnd: r * 2.4, life: 0.6, r: REI.r, g: REI.g, b: REI.b, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  glow.spawn({ x: at.x, y: at.y, z: at.z, size: r * 0.2, sizeEnd: r * 1.6, life: 0.4, r: REI_CORE.r, g: REI_CORE.g, b: REI_CORE.b, alpha: 1, alphaEnd: 0, tex: TEX_RING });
  for (let i = 0; i < 120; i++) {
    const a = Math.random() * Math.PI * 2, b = Math.acos(Math.random() * 2 - 1);
    const s = r * (1.5 + Math.random() * 2);
    const col = Math.random() < 0.3 ? REI_CORE : REI;
    glow.spawn({ x: at.x, y: at.y, z: at.z, vx: Math.sin(b) * Math.cos(a) * s, vy: Math.abs(Math.cos(b)) * s, vz: Math.sin(b) * Math.sin(a) * s, size: r * 0.06, sizeEnd: r * 0.01, life: 0.8, r: col.r, g: col.g, b: col.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 1.2 });
  }
  for (let i = 0; i < 3; i++) setTimeout(() => g.addRing(new THREE.Vector3(at.x, at.y - r * 0.3, at.z), r * (1.2 + i * 0.7), IRA_REIATSU.body, 0.6), i * 120);
}
