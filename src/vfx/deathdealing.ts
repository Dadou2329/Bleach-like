// Askin's Deathdealing (docs/kits/askin.md). GiftBall: a slow glossy purple ball drifting at its mark, then hanging in
// the air as a mine; a touch is a dose; water washes it away. GiftBad: the round oil-slick pool on the ground (a thin
// film shader, green ↔ purple). GiftDeluxe: Hasshein's dome of poison round him — its concentration stretches it into an
// egg narrowing to a point; when he dies it runs wild. GiftBereich: linked reishi circles scattered over a boundary, a
// one-way barrier: whoever is inside is held in, whoever is outside walks in. GiftRing: a bracelet ring hurled, shrinking
// to nothing in flight. GiantGiftBall: one huge ball rolling through the buildings. PfeilShot: his blue Heilig Pfeil
// (and the finger-gun's), piercing. poisonTint(): a body turning violet; miasma(); circleTrail(): Hasshein's
// zig-zag Hirenkyaku leaving linked circles.
import * as THREE from 'three';
import type { Fighter } from '../game/fighter';
import type { Game, Projectile } from '../game/game';
import { SphereShape } from '../destruction/shapes';
import { raycastVoxels } from '../voxel/raycast';
import { Flood } from './water';
import { groundAt } from './iceArts';
import { TEX_GLOW, TEX_PUFF, TEX_RING, TEX_STREAK } from './sprites';

export const MIASMA = '#8B3FD1';
export const MIASMA_GLOW = '#C79BFF';
export const BALL = '#9850DA';
export const BALL_HI = '#E0C4FF';
export const HASSHEIN = '#9C5CEB';
export const HASSHEIN_LIGHT = '#D3B0FF';
export const PFEIL_BLUE = '#8CC6FF';
export const VISOR = '#FF9A3C';

const C_MIASMA = new THREE.Color(MIASMA);
const C_GLOW = new THREE.Color(MIASMA_GLOW);
const C_BLUE = new THREE.Color(PFEIL_BLUE);
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const ZP = new THREE.Vector3(0, 0, 1);

/** a body turning violet with the poison in it (0 … 1) */
export function poisonTint(f: Fighter, k: number): void {
  const r = 1 - 0.16 * k, gg = 1 - 0.36 * k, b = 1 - 0.04 * k;
  f.visual.forEachMaterial((m) => m.userData.uniforms.uTint.value.setRGB(r, gg, b));
}

/** purple miasma breathed out round a point */
export function miasma(g: Game, at: THREE.Vector3, r: number, n = 10): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, rr = Math.random() * r;
    g.engine.dust.spawn({ x: at.x + Math.cos(a) * rr, y: at.y + Math.random() * 1.6, z: at.z + Math.sin(a) * rr, vx: Math.cos(a) * 0.8, vy: 0.2 + Math.random() * 0.5, vz: Math.sin(a) * 0.8, size: 0.6, sizeEnd: 1.8, life: 1.4, r: C_MIASMA.r, g: C_MIASMA.g, b: C_MIASMA.b, alpha: 0.45, alphaEnd: 0, tex: TEX_PUFF, drag: 1.2 });
  }
}

/** a purple puff where something burst */
function burstPuff(g: Game, p: THREE.Vector3, size: number, n = 14): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.3) * Math.PI;
    const s = 1 + Math.random() * 2.5;
    g.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * Math.cos(e) * s, vy: Math.sin(e) * s, vz: Math.sin(a) * Math.cos(e) * s, size: size * 0.6, sizeEnd: size * 2.2, life: 0.9, r: C_MIASMA.r, g: C_MIASMA.g, b: C_MIASMA.b, alpha: 0.6, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
  }
  g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: size * 1.5, sizeEnd: size * 3, life: 0.25, r: C_GLOW.r, g: C_GLOW.g, b: C_GLOW.b, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
}

/** is there water at p (a flood standing there) */
function inWater(g: Game, p: THREE.Vector3): boolean {
  for (const q of g.projectiles) if (q instanceof Flood && !q.done && q.contains(p)) return true;
  return false;
}

// ---------------------------------------------------------------------------------------------- Gift Ball

let ballGeo: THREE.SphereGeometry | null = null;
let ringGeo: THREE.TorusGeometry | null = null;
const ballMat = (): THREE.MeshStandardMaterial => new THREE.MeshStandardMaterial({ color: BALL, emissive: '#4A1488', emissiveIntensity: 0.55, roughness: 0.12, metalness: 0.15, transparent: true, opacity: 0.95 });

export interface GiftBallOpts {
  /** Reishi + oxygen + nitrogen: a bigger dose (drawn with bands round it) */
  hybrid?: boolean;
  /** drift speed (m/s) and how far it drifts before it hangs (m) */
  speed?: number;
  range?: number;
  /** how long it hangs as a mine (s) */
  life?: number;
  radius?: number;
  /** drifts after this fighter, turning slowly */
  home?: Fighter | null;
  homing?: number;
  onTouch: (e: Fighter, ball: GiftBall) => void;
}

/** A Gift Ball: drifts at its mark, then hangs as a mine; one touch and it bursts on whoever touched it. */
export class GiftBall implements Projectile {
  done = false;
  readonly pos: THREE.Vector3;
  private vel: THREE.Vector3;
  private t = 0;
  private travelled = 0;
  hanging = false;
  private hangY = 0;
  private mesh: THREE.Mesh;
  readonly r: number;

  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, dir: THREE.Vector3, readonly o: GiftBallOpts) {
    this.r = o.radius ?? (o.hybrid ? 0.36 : 0.28);
    this.pos = from.clone();
    this.vel = dir.clone().normalize().multiplyScalar(o.speed ?? 7);
    ballGeo ??= new THREE.SphereGeometry(1, 20, 14);
    this.mesh = new THREE.Mesh(ballGeo, ballMat());
    this.mesh.scale.setScalar(this.r);
    this.mesh.castShadow = false;
    if (o.hybrid) {
      // the layers: two bands of lighter reishi round it
      ringGeo ??= new THREE.TorusGeometry(1.08, 0.07, 6, 28);
      for (const rx of [Math.PI / 2, Math.PI / 5]) {
        const band = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: BALL_HI, transparent: true, opacity: 0.85 }));
        band.rotation.x = rx;
        this.mesh.add(band);
      }
    }
    g.engine.gr.scene.add(this.mesh);
    g.sfx.play('swing', from, 0.35);
  }

  /** it bursts: on someone (a puff of poison) or harmlessly (washed away, expired) */
  burst(): void {
    if (this.done) return;
    this.done = true;
    burstPuff(this.g, this.pos, this.r * 2.4);
    this.g.sfx.play('hit', this.pos, 0.35);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (!this.hanging) {
      const sp = this.vel.length();
      if (this.o.home && !this.o.home.dead) {
        // turns slowly after its mark
        const want = _v.subVectors(this.o.home.center(), this.pos).normalize().multiplyScalar(sp);
        this.vel.lerp(want, Math.min(1, dt * (this.o.homing ?? 0)));
        this.vel.setLength(sp);
      }
      const d = _w.copy(this.vel).normalize();
      const step = sp * dt;
      const hit = raycastVoxels(g.engine.world, this.pos.x, this.pos.y, this.pos.z, d.x, d.y, d.z, step + this.r);
      if (hit) {
        // it meets a wall: it hangs right there
        this.pos.addScaledVector(d, Math.max(0, hit.dist - this.r - 0.05));
        this.hang();
      } else {
        this.pos.addScaledVector(this.vel, dt);
        this.travelled += step;
        if (this.travelled >= (this.o.range ?? 15)) this.hang();
      }
    } else this.pos.y = this.hangY + Math.sin(this.t * 2.2) * 0.07;
    for (const e of g.enemiesOf(this.owner)) {
      if (e.dead || e.center().distanceTo(this.pos) > this.r + e.def.radius + 0.3) continue;
      this.o.onTouch(e, this);
      this.burst();
      return;
    }
    // water washes the poison away (Kirinji's springs)
    if ((this.t * 60) % 6 < 1 && inWater(g, this.pos)) {
      this.burst();
      return;
    }
    if (Math.random() < dt * 3) g.engine.dust.spawn({ x: this.pos.x, y: this.pos.y - this.r * 0.5, z: this.pos.z, vx: 0, vy: -0.3, vz: 0, size: this.r * 0.8, sizeEnd: this.r * 2, life: 0.9, r: C_MIASMA.r, g: C_MIASMA.g, b: C_MIASMA.b, alpha: 0.3, alphaEnd: 0, tex: TEX_PUFF });
    if (this.t > (this.o.life ?? 25) + (this.hanging ? 0 : 6)) this.burst();
  }

  private hang(): void {
    this.hanging = true;
    this.hangY = this.pos.y;
    this.vel.set(0, 0, 0);
  }

  render(_dt: number, time: number): void {
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.y = time * 0.8;
  }

  reject(p: THREE.Vector3, radius: number): boolean {
    if (this.pos.distanceTo(p) > radius + this.r) return false;
    this.burst();
    return true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    (this.mesh.material as THREE.Material).dispose();
    for (const c of this.mesh.children) ((c as THREE.Mesh).material as THREE.Material).dispose();
  }
}

// ---------------------------------------------------------------------------------------------- Gift Bad

const SLICK_VS = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SLICK_FS = /* glsl */ `
uniform float uTime;
uniform float uAlpha;
varying vec2 vUv;
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  float edge = 0.92 + 0.06 * n(p * 5.0 + uTime * 0.2);
  if (r > edge) discard;
  // a thin film: bands of colour sliding over the dark pool
  float film = n(p * 3.0 + vec2(uTime * 0.07, -uTime * 0.05)) * 2.0 + r * 3.0 + uTime * 0.15;
  vec3 green = vec3(0.243, 0.478, 0.235), purple = vec3(0.478, 0.247, 0.651), sheen = vec3(0.776, 0.941, 0.690);
  vec3 col = mix(green, purple, 0.5 + 0.5 * sin(film * 3.1));
  col *= 0.55;
  float band = smoothstep(0.86, 1.0, sin(film * 6.3) * 0.5 + 0.5);
  col += sheen * band * 0.35;
  float rim = smoothstep(edge - 0.08, edge, r);
  col = mix(col, purple * 0.8, rim * 0.6);
  gl_FragColor = vec4(col, uAlpha * (0.88 - rim * 0.3));
}`;

/** The Gift Bad: a round oil-slick pool on the ground; `onTick` for every enemy standing in it. */
export class GiftBad implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.Mesh;
  private mat: THREE.ShaderMaterial;

  constructor(private g: Game, readonly owner: Fighter, readonly at: THREE.Vector3, readonly r: number, readonly life: number, private onTick: (e: Fighter, dt: number) => void) {
    this.mat = new THREE.ShaderMaterial({ vertexShader: SLICK_VS, fragmentShader: SLICK_FS, uniforms: { uTime: { value: 0 }, uAlpha: { value: 0 } }, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    this.mesh = new THREE.Mesh(new THREE.CircleGeometry(r, 48), this.mat);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.set(at.x, at.y + 0.04, at.z);
    this.mesh.renderOrder = 2;
    g.engine.gr.scene.add(this.mesh);
    g.sfx.play('splash', at, 0.6);
  }

  contains(p: THREE.Vector3): boolean {
    return Math.hypot(p.x - this.at.x, p.z - this.at.z) < this.r && Math.abs(p.y - this.at.y) < 1.2;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    for (const e of g.enemiesOf(this.owner)) if (!e.dead && this.contains(e.pos)) this.onTick(e, dt);
    // bubbles
    if (Math.random() < dt * 8) {
      const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * this.r * 0.9;
      g.engine.glow.spawn({ x: this.at.x + Math.cos(a) * rr, y: this.at.y + 0.08, z: this.at.z + Math.sin(a) * rr, vx: 0, vy: 0.5, vz: 0, size: 0.08, sizeEnd: 0.16, life: 0.5, r: 0.6, g: 0.85, b: 0.55, alpha: 0.6, alphaEnd: 0, tex: TEX_RING });
    }
    if (this.t > this.life) this.done = true;
  }

  render(): void {
    this.mat.uniforms.uTime.value = this.t;
    this.mat.uniforms.uAlpha.value = Math.min(1, this.t / 0.3) * Math.min(1, (this.life - this.t) / 1.0);
  }

  reject(p: THREE.Vector3, radius: number, _by: Fighter, fields: boolean): boolean {
    if (!fields || Math.hypot(p.x - this.at.x, p.z - this.at.z) > radius + this.r) return false;
    this.done = true;
    return true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}

// ---------------------------------------------------------------------------------------------- Gift Ball Deluxe

const DOME_VS = /* glsl */ `
uniform float uStretch;
uniform float uTaper;
varying vec3 vN;
varying vec3 vView;
varying vec3 vP;
void main() {
  vec3 p = position;
  if (p.y > 0.0) {
    // the concentration raised: the dome drawn up into an egg that narrows to a point
    float k = p.y;
    p.xz *= 1.0 - uTaper * k * k;
    p.y *= uStretch;
  }
  vP = p;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vView = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const DOME_FS = /* glsl */ `
uniform float uTime;
uniform float uAlpha;
uniform float uHeat;
varying vec3 vN;
varying vec3 vView;
varying vec3 vP;
float h(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float n(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h(i), h(i + vec3(1,0,0)), f.x), mix(h(i + vec3(0,1,0)), h(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h(i + vec3(0,0,1)), h(i + vec3(1,0,1)), f.x), mix(h(i + vec3(0,1,1)), h(i + vec3(1,1,1)), f.x), f.y), f.z); }
void main() {
  float fr = pow(1.0 - abs(dot(normalize(vN), vView)), 2.2);
  float sw = n(vP * 3.0 + vec3(0.0, uTime * 0.25, uTime * 0.1));
  vec3 base = vec3(0.545, 0.247, 0.82), glow = vec3(0.78, 0.61, 1.0);
  vec3 col = mix(base * 0.5, glow, fr) + base * sw * 0.25;
  col = mix(col, vec3(0.75, 0.2, 0.9), uHeat * 0.4);
  float a = uAlpha * (0.1 + 0.45 * fr + 0.08 * sw + uHeat * 0.1);
  gl_FragColor = vec4(col, a);
}`;

/**
 * Gift Ball Deluxe: a dome of poison centred on the ground under him. Everyone inside (but those it does not touch:
 * his side, and while it runs wild, nobody is spared) gets `onTick`. `raise()` steps the concentration up (the dome
 * stretches into a narrowing egg); `runWild()` is his death: it spikes for six seconds, then fades.
 */
export class GiftDeluxe implements Projectile {
  done = false;
  private t = 0;
  conc = 1;
  wild = false;
  private stretch = 1;
  private end: number;
  private mesh: THREE.Mesh;
  private mat: THREE.ShaderMaterial;

  constructor(private g: Game, readonly owner: Fighter, readonly center: THREE.Vector3, readonly R: number, life: number, private onTick: (e: Fighter, dt: number, conc: number) => void) {
    this.end = life;
    this.mat = new THREE.ShaderMaterial({
      vertexShader: DOME_VS, fragmentShader: DOME_FS,
      uniforms: { uTime: { value: 0 }, uAlpha: { value: 0 }, uStretch: { value: 1 }, uTaper: { value: 0 }, uHeat: { value: 0 } },
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), this.mat);
    this.mesh.position.copy(center);
    this.mesh.scale.setScalar(R);
    this.mesh.renderOrder = 3;
    g.engine.gr.scene.add(this.mesh);
    g.sfx.play('bankai', center, 0.6);
  }

  /** the dome's height at the axis now (m) */
  get height(): number {
    return this.R * this.stretch;
  }

  inside(p: THREE.Vector3): boolean {
    const dx = p.x - this.center.x, dz = p.z - this.center.z, dy = p.y - this.center.y;
    if (dy < -2) return false;
    const y = Math.max(0, dy) / this.height;
    const rr = this.R * (1 - (this.stretch - 1) * 0.4 * y * y);
    return Math.hypot(dx, dz) < rr && y < 1;
  }

  raise(): void {
    this.conc = Math.min(3, this.conc + 1);
    this.g.sfx.play('charge', this.center, 0.6);
  }

  runWild(): void {
    if (this.wild) return;
    this.wild = true;
    this.conc = 4;
    this.end = this.t + 6;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const want = 1 + (this.conc - 1) * 0.55;
    this.stretch += (want - this.stretch) * Math.min(1, dt * 1.5);
    const victims = this.wild ? g.fighters : g.enemiesOf(this.owner);
    for (const e of victims) {
      if (e.dead || (this.wild && e === this.owner) || !this.inside(e.center())) continue;
      this.onTick(e, dt, this.conc);
    }
    // the mist drifting inside
    if (Math.random() < dt * 14) {
      const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * this.R * 0.9;
      g.engine.dust.spawn({ x: this.center.x + Math.cos(a) * rr, y: this.center.y + Math.random() * this.height * 0.5, z: this.center.z + Math.sin(a) * rr, vx: 0, vy: 0.3, vz: 0, size: 2.5, sizeEnd: 5, life: 3, r: C_MIASMA.r, g: C_MIASMA.g, b: C_MIASMA.b, alpha: 0.12 + this.conc * 0.04, alphaEnd: 0, tex: TEX_PUFF });
    }
    if (this.owner.dead && !this.wild && this.t < this.end) this.runWild();
    if (this.t > this.end) this.done = true;
  }

  render(): void {
    const u = this.mat.uniforms;
    u.uTime.value = this.t;
    u.uStretch.value = this.stretch;
    u.uTaper.value = (this.stretch - 1) * 0.45;
    u.uHeat.value = Math.min(1, (this.conc - 1) / 3);
    u.uAlpha.value = Math.min(1, this.t / 0.8) * Math.min(1, (this.end - this.t) / 1.2);
  }

  reject(p: THREE.Vector3, radius: number, _by: Fighter, fields: boolean): boolean {
    if (!fields || p.distanceTo(this.center) > radius + this.R) return false;
    this.done = true;
    return true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}

// ---------------------------------------------------------------------------------------------- Gift Bereich

/**
 * Gift Bereich: linked reishi circles scattered over a dome's boundary — a one-way barrier. Whoever is inside cannot get
 * out (held at the wall, their outward speed taken away); whoever is outside can come in, and then is held in too.
 */
export class GiftBereich implements Projectile {
  done = false;
  private t = 0;
  readonly inside = new Set<Fighter>();
  private group = new THREE.Group();
  private ringMat: THREE.MeshBasicMaterial;
  private lineMat: THREE.LineBasicMaterial;

  constructor(private g: Game, readonly owner: Fighter, readonly center: THREE.Vector3, readonly R: number, readonly life = 15) {
    this.ringMat = new THREE.MeshBasicMaterial({ color: HASSHEIN_LIGHT, transparent: true, opacity: 0, depthWrite: false });
    this.lineMat = new THREE.LineBasicMaterial({ color: HASSHEIN, transparent: true, opacity: 0, depthWrite: false });
    // the nodes: a Fibonacci scatter over the upper hemisphere, each a ring facing out
    const n = Math.round(Math.min(90, 18 + R * 2.4));
    const pts: THREE.Vector3[] = [];
    ringGeo ??= new THREE.TorusGeometry(1.08, 0.07, 6, 28);
    for (let i = 0; i < n; i++) {
      const y = i / (n - 1);
      const r = Math.sqrt(1 - y * y);
      const a = i * 2.39996;
      const p = new THREE.Vector3(Math.cos(a) * r, y * 0.96 + 0.02, Math.sin(a) * r).multiplyScalar(R);
      pts.push(p);
      const ring = new THREE.Mesh(ringGeo, this.ringMat);
      ring.position.copy(p);
      ring.scale.setScalar(0.55);
      ring.quaternion.setFromUnitVectors(ZP, p.clone().normalize());
      this.group.add(ring);
    }
    // each node linked to its two nearest
    const seg: number[] = [];
    pts.forEach((p, i) => {
      const near = pts.map((q, j) => ({ j, d: j === i ? Infinity : p.distanceTo(q) })).sort((a, b) => a.d - b.d).slice(0, 2);
      for (const { j } of near) if (j > i) seg.push(p.x, p.y, p.z, pts[j].x, pts[j].y, pts[j].z);
    });
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
    this.group.add(new THREE.LineSegments(lg, this.lineMat));
    this.group.position.copy(center);
    g.engine.gr.scene.add(this.group);
    g.sfx.play('charge', center, 0.7);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const wall = this.R - 0.6;
    for (const e of g.enemiesOf(this.owner)) {
      if (e.dead) continue;
      const d = _v.subVectors(e.center(), this.center);
      if (d.y < -1.5) continue;
      const dist = d.length();
      if (dist < wall - 0.3) this.inside.add(e);
      if (!this.inside.has(e) || dist <= wall) continue;
      // held at the wall: back inside, the outward speed gone
      d.divideScalar(dist);
      e.body.pos.addScaledVector(d, -(dist - wall));
      const out = e.body.vel.dot(d);
      if (out > 0) e.body.vel.addScaledVector(d, -out);
      const po = e.push.dot(d);
      if (po > 0) e.push.addScaledVector(d, -po);
      if (e.dashT > 0) e.dashT = 0;
      if (Math.random() < 0.3) {
        const c = e.center().addScaledVector(d, 0.4);
        g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: 0.5, sizeEnd: 1.2, life: 0.3, r: 0.8, g: 0.6, b: 1, alpha: 0.9, alphaEnd: 0, tex: TEX_RING });
      }
    }
    if (this.t > this.life) this.done = true;
  }

  render(): void {
    const a = Math.min(1, this.t / 0.6) * Math.min(1, (this.life - this.t) / 1.0);
    this.ringMat.opacity = 0.9 * a;
    this.lineMat.opacity = 0.55 * a;
    this.group.rotation.y = this.t * 0.03;
  }

  reject(p: THREE.Vector3, radius: number, _by: Fighter, fields: boolean): boolean {
    if (!fields || p.distanceTo(this.center) > radius + this.R) return false;
    this.done = true;
    return true;
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const c of this.group.children) if (c instanceof THREE.LineSegments) c.geometry.dispose();
    this.ringMat.dispose();
    this.lineMat.dispose();
  }
}

// ---------------------------------------------------------------------------------------------- Gift Ring

/** A bracelet ring hurled at one fighter: it shrinks to almost nothing as it flies, and kills one part of the body. */
export class GiftRing implements Projectile {
  done = false;
  private t = 0;
  private pos: THREE.Vector3;
  private mesh: THREE.Mesh;

  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, readonly target: Fighter, private onHit: (e: Fighter) => void) {
    this.pos = from.clone();
    this.mesh = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 6, 24), new THREE.MeshBasicMaterial({ color: HASSHEIN_LIGHT }));
    g.engine.gr.scene.add(this.mesh);
    g.sfx.play('swing', from, 0.6);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.target.dead || this.t > 1.4) {
      this.done = true;
      return;
    }
    const to = this.target.center();
    const d = _v.subVectors(to, this.pos);
    const step = 60 * dt;
    if (d.length() <= step + 0.3) {
      this.done = true;
      this.onHit(this.target);
      g.engine.glow.spawn({ x: to.x, y: to.y, z: to.z, size: 0.4, sizeEnd: 1.4, life: 0.25, r: 0.85, g: 0.7, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_RING });
      return;
    }
    this.pos.addScaledVector(d.normalize(), step);
    g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, size: 0.12, sizeEnd: 0.02, life: 0.12, r: 0.8, g: 0.6, b: 1, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
  }

  render(): void {
    this.mesh.position.copy(this.pos);
    this.mesh.scale.setScalar(Math.max(0.12, 1 - this.t * 3));
    this.mesh.rotation.set(this.t * 30, this.t * 17, 0);
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

// ---------------------------------------------------------------------------------------------- the giant ball

/** One huge Gift Ball rolled along the ground: it ploughs through whatever stands in its way. */
export class GiantGiftBall implements Projectile {
  done = false;
  private t = 0;
  private carveT = 0;
  readonly pos: THREE.Vector3;
  private dir: THREE.Vector3;
  private mesh: THREE.Mesh;
  private hit = new Set<Fighter>();
  private roll = new THREE.Quaternion();

  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, dir: THREE.Vector3, private onTouch: (e: Fighter) => void, readonly R = 2.4, readonly speed = 7, readonly life = 6) {
    this.pos = from.clone();
    this.dir = dir.clone().setY(0).normalize();
    ballGeo ??= new THREE.SphereGeometry(1, 20, 14);
    this.mesh = new THREE.Mesh(ballGeo, ballMat());
    this.mesh.scale.setScalar(0.1);
    g.engine.gr.scene.add(this.mesh);
    g.sfx.play('charge', from, 0.8);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const grown = Math.min(1, this.t / 0.5);
    if (this.t > 0.5) {
      this.pos.addScaledVector(this.dir, this.speed * dt);
      const gy = groundAt(g, this.pos.x, this.pos.y + this.R, this.pos.z, this.R * 3);
      if (gy !== null) this.pos.y += (gy + this.R * 0.85 - this.pos.y) * Math.min(1, dt * 4);
      if ((this.carveT -= dt) <= 0) {
        this.carveT = 0.08;
        g.engine.destruction.carve(new SphereShape(this.pos.clone().addScaledVector(this.dir, this.R * 0.3), this.R * 0.98, 0.5), { mode: 'smash', power: 800, impulse: 6, dir: this.dir.clone(), dust: 0.5 });
      }
      this.roll.premultiply(new THREE.Quaternion().setFromAxisAngle(_w.set(this.dir.z, 0, -this.dir.x), (this.speed * dt) / this.R));
    }
    for (const e of g.enemiesOf(this.owner)) {
      if (e.dead || this.hit.has(e) || e.center().distanceTo(this.pos) > this.R * grown + e.def.radius + 0.2) continue;
      this.hit.add(e);
      this.onTouch(e);
      burstPuff(g, e.center(), 0.8, 10);
    }
    if (Math.random() < dt * 10) miasma(g, this.pos.clone().setY(this.pos.y - this.R * 0.8), this.R, 1);
    if (this.t > this.life) {
      this.done = true;
      burstPuff(g, this.pos, this.R * 1.2, 26);
    }
  }

  render(): void {
    this.mesh.position.copy(this.pos);
    this.mesh.scale.setScalar(Math.max(0.1, this.R * Math.min(1, this.t / 0.5)));
    this.mesh.quaternion.copy(this.roll);
  }

  reject(p: THREE.Vector3, radius: number, _by: Fighter, fields: boolean): boolean {
    if (!fields || this.pos.distanceTo(p) > radius + this.R) return false;
    this.done = true;
    return true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    (this.mesh.material as THREE.Material).dispose();
  }
}

// ---------------------------------------------------------------------------------------------- Heilig Pfeil

let arrowGeo: THREE.BufferGeometry | null = null;

/** his blue arrow: a thin shaft with a Zeichen-cut fletching of light; it pierces — every body on its line once */
export class PfeilShot implements Projectile {
  done = false;
  private pos: THREE.Vector3;
  private vel: THREE.Vector3;
  private t = 0;
  private hit = new Set<Fighter>();
  private mesh: THREE.Mesh;

  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, dir: THREE.Vector3, readonly dmg = 14, readonly speed = 55, readonly scale = 1) {
    this.pos = from.clone();
    this.vel = dir.clone().normalize().multiplyScalar(speed);
    if (!arrowGeo) {
      const shaft = new THREE.CylinderGeometry(0.018, 0.018, 0.9, 5);
      shaft.rotateX(Math.PI / 2);
      const head = new THREE.ConeGeometry(0.05, 0.16, 6);
      head.rotateX(Math.PI / 2);
      head.translate(0, 0, 0.52);
      arrowGeo = mergeGeos([shaft, head]);
    }
    this.mesh = new THREE.Mesh(arrowGeo, new THREE.MeshBasicMaterial({ color: '#CDE8FF' }));
    this.mesh.scale.setScalar(scale);
    g.engine.gr.scene.add(this.mesh);
    g.sfx.play('arrow', from, 0.5);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const step = this.speed * dt;
    const d = _v.copy(this.vel).normalize();
    for (const e of g.enemiesOf(this.owner)) {
      if (e.dead || this.hit.has(e)) continue;
      const c = e.center();
      const along = Math.max(0, Math.min(step, _w.subVectors(c, this.pos).dot(d)));
      if (this.pos.clone().addScaledVector(d, along).distanceTo(c) > e.def.radius + 0.3) continue;
      this.hit.add(e);
      g.damage(e, this.dmg, this.owner, d.clone(), { energy: true, knock: 2.5, hitstop: 0.03, color: PFEIL_BLUE });
    }
    const hit = raycastVoxels(g.engine.world, this.pos.x, this.pos.y, this.pos.z, d.x, d.y, d.z, step);
    if (hit) {
      // it bores on through a little, then breaks
      const p = this.pos.clone().addScaledVector(d, hit.dist);
      g.engine.destruction.carve(new SphereShape(p, 0.3 * this.scale, 0.5), { mode: 'smash', power: 260, dust: 0.25 });
      for (let i = 0; i < 6; i++) g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5) * 5, vy: Math.random() * 3, vz: (Math.random() - 0.5) * 5, size: 0.1, sizeEnd: 0.02, life: 0.2, r: C_BLUE.r, g: C_BLUE.g, b: C_BLUE.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2 });
      if (this.t > 0.05 || hit.dist > 0.5) {
        this.done = true;
        return;
      }
    }
    this.pos.addScaledVector(this.vel, dt);
    g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, size: 0.22 * this.scale, sizeEnd: 0.05, life: 0.1, r: C_BLUE.r, g: C_BLUE.g, b: C_BLUE.b, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    if (this.t > 1.4) this.done = true;
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
    (this.mesh.material as THREE.Material).dispose();
  }
}

/** a minimal geometry merge (position + normal), for the arrow's shaft and head */
function mergeGeos(gs: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const pos: number[] = [], nrm: number[] = [];
  for (const g0 of gs) {
    const g = g0.index ? g0.toNonIndexed() : g0;
    pos.push(...(g.getAttribute('position').array as Float32Array));
    nrm.push(...(g.getAttribute('normal').array as Float32Array));
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  return out;
}

/** Hasshein's zig-zag Hirenkyaku: linked purple circles left hanging along the path */
export function circleTrail(g: Game, from: THREE.Vector3, to: THREE.Vector3): void {
  const d = _v.subVectors(to, from);
  const len = d.length();
  if (len < 0.2) return;
  d.divideScalar(len);
  const side = _w.set(-d.z, 0, d.x);
  const n = Math.max(1, Math.floor(len / 0.7));
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const off = (i % 2 === 0 ? 1 : -1) * 0.35;
    const x = from.x + d.x * len * k + side.x * off, y = from.y + d.y * len * k + 0.2, z = from.z + d.z * len * k + side.z * off;
    g.engine.glow.spawn({ x, y, z, size: 0.32, sizeEnd: 0.28, life: 0.9, r: 0.75, g: 0.55, b: 1, alpha: 0.85, alphaEnd: 0, tex: TEX_RING });
    if (i < n) g.engine.glow.spawn({ x, y, z, vx: (d.x * 0.7 - side.x * off * 2) * 0.01, vy: 0, vz: (d.z * 0.7 - side.z * off * 2) * 0.01, size: 0.12, sizeEnd: 0.1, life: 0.7, r: 0.65, g: 0.4, b: 0.95, alpha: 0.6, alphaEnd: 0, tex: TEX_STREAK, stretch: 40 });
  }
}
