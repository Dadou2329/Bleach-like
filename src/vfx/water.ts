// Tier Harribel's water. WaterSpray: the shared pool of voxel droplets (small glossy cubes that fall and
// burst on the ground) that every water effect throws. waterMaterial: moving water (fresnel, flow streaks,
// foam, a sun glint) for the drop, the torrent, the waterfall and the cocoon. splash(): a burst of
// droplets and foam with a ring. Flood: a sheet of standing water that spreads over the ground (draped
// down over edges), slows and soaks whoever wades through it, then drains away. LaGota: the pressurised
// shark-tooth drop — fast, flat, through walls. Torrent: Cascada, a river poured out of the blade that
// shoves everything in its path and floods where it lands. Waterfall: Cascada Real, the river dropped out
// of the sky. Cocoon: the release — the water rises round her in two streams like a heart and closes into a
// spinning sphere that she cuts open from inside. Boil: Hirviendo's boiling field. BladeGlow: light
// filling the window of the sealed blade (Ola Azul). WaterBlade: one of Trident's high-pressure cuts.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { SphereShape } from '../destruction/shapes';
import { GetsugaProjectile } from '../game/projectiles/getsuga';
import { ShockRing, type EnergyColors } from './energy';
import { groundAt } from './iceArts';
import { TEX_GLOW, TEX_PUFF } from './sprites';

export const WATER_BLADE: EnergyColors = { core: '#F2FBFF', body: '#7CC8F5', rim: '#1E6FB8' };
export const OLA_AZUL: EnergyColors = { core: '#FFF8D6', body: '#F2C230', rim: '#B88A1C' };
export const HARRIBEL_CERO: EnergyColors = { core: '#FFF6CF', body: '#FFD84A', rim: '#C9971E' };

const DEEP = new THREE.Color('#1E6FB8');
const LIGHT = new THREE.Color('#3FA9F5');
const FOAM = new THREE.Color('#E6F7FF');
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _q = new THREE.Quaternion();
const UP = new THREE.Vector3(0, 1, 0);

// ------------------------------------------------------------------ droplets

const MAXD = 1800;

/** Voxel droplets: glossy little cubes thrown by every water effect; they fall and burst on the ground. */
export class WaterSpray implements Projectile {
  done = false;
  private mesh: THREE.InstancedMesh;
  private p = new Float32Array(MAXD * 3);
  private v = new Float32Array(MAXD * 3);
  private life = new Float32Array(MAXD);
  private age = new Float32Array(MAXD);
  private size = new Float32Array(MAXD);
  private tint = new Float32Array(MAXD);
  private next = 0;
  private live = 0;
  private m = new THREE.Matrix4();
  private c = new THREE.Color();

  constructor(private g: Game) {
    const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.1, metalness: 0, transparent: true, opacity: 0.86, emissive: new THREE.Color('#1B5A96'), emissiveIntensity: 0.45, depthWrite: false });
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, MAXD);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAXD * 3), 3);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 4;
    g.engine.gr.scene.add(this.mesh);
  }

  /** the shared pool (created on first use) */
  static of(g: Game): WaterSpray {
    const d = g as unknown as { waterSpray?: WaterSpray };
    if (!d.waterSpray || d.waterSpray.done) {
      d.waterSpray = new WaterSpray(g);
      g.addProjectile(d.waterSpray);
    }
    return d.waterSpray;
  }

  /** one droplet; tint 0 = deep blue … 1 = white foam */
  spawn(x: number, y: number, z: number, vx: number, vy: number, vz: number, size = 0.07, life = 1.2, tint = 0.4): void {
    const i = this.next;
    this.next = (this.next + 1) % MAXD;
    this.live = Math.min(MAXD, this.live + 1);
    this.p[i * 3] = x; this.p[i * 3 + 1] = y; this.p[i * 3 + 2] = z;
    this.v[i * 3] = vx; this.v[i * 3 + 1] = vy; this.v[i * 3 + 2] = vz;
    this.life[i] = life;
    this.age[i] = 0;
    this.size[i] = size;
    this.tint[i] = tint;
  }

  update(dt: number): void {
    const w = this.g.engine.world;
    const drag = Math.exp(-0.6 * dt);
    for (let i = 0; i < MAXD; i++) {
      if (this.age[i] >= this.life[i]) continue;
      this.age[i] += dt;
      const o = i * 3;
      this.v[o] *= drag;
      this.v[o + 2] *= drag;
      this.v[o + 1] -= 15 * dt;
      this.p[o] += this.v[o] * dt;
      this.p[o + 1] += this.v[o + 1] * dt;
      this.p[o + 2] += this.v[o + 2] * dt;
      // a droplet that lands bursts: a last tiny bounce of foam, then gone
      if (this.v[o + 1] < 0 && w.isSolidAtPos(this.p[o], this.p[o + 1], this.p[o + 2])) {
        if (this.size[i] > 0.08 && Math.random() < 0.25) {
          this.g.engine.dust.spawn({ x: this.p[o], y: this.p[o + 1] + 0.08, z: this.p[o + 2], vy: 0.4, size: this.size[i] * 3, sizeEnd: this.size[i] * 6, life: 0.4, r: 0.86, g: 0.95, b: 1, alpha: 0.35, alphaEnd: 0, tex: TEX_PUFF });
        }
        this.age[i] = this.life[i];
      }
    }
  }

  render(): void {
    let n = 0;
    for (let i = 0; i < MAXD; i++) {
      if (this.age[i] >= this.life[i]) continue;
      const k = this.age[i] / this.life[i];
      const s = this.size[i] * (k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1);
      if (s <= 0.004) continue;
      const o = i * 3;
      this.m.makeScale(s, s, s).setPosition(this.p[o], this.p[o + 1], this.p[o + 2]);
      this.mesh.setMatrixAt(n, this.m);
      this.c.copy(DEEP).lerp(LIGHT, Math.min(1, this.tint[i] * 2)).lerp(FOAM, Math.max(0, this.tint[i] * 2 - 1));
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

// ------------------------------------------------------------------ the water shader

const NOISE = /* glsl */ `
float wHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float wNoise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(wHash(i), wHash(i + vec3(1,0,0)), f.x), mix(wHash(i + vec3(0,1,0)), wHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(wHash(i + vec3(0,0,1)), wHash(i + vec3(1,0,1)), f.x), mix(wHash(i + vec3(0,1,1)), wHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}`;

const WATER_VERT = /* glsl */ `
uniform float uTube;
uniform float uLen;
uniform float uR0;
uniform float uR1;
varying vec3 vN;
varying vec3 vW;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = position;
  // a tube built of unit radius / unit length: radius grows from uR0 at the root to uR1 at the far end
  if (uTube > 0.5) { p.xz *= mix(uR0, uR1, uv.y); p.y *= uLen; }
  vec4 w = modelMatrix * vec4(p, 1.0);
  vW = w.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const WATER_FRAG = /* glsl */ `
uniform float uTime;
uniform float uFlow;
uniform float uAlpha;
uniform float uFoam;
uniform float uScale;
uniform vec3 uDeep;
uniform vec3 uLight;
uniform vec3 uFoamC;
varying vec3 vN;
varying vec3 vW;
varying vec2 vUv;
${NOISE}
void main() {
  vec3 V = normalize(cameraPosition - vW);
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  float fres = pow(clamp(1.0 - abs(dot(N, V)), 0.0, 1.0), 2.5);
  float t = uTime * uFlow;
  // streaks running along the flow (uv.y), shivering across it
  float n1 = wNoise(vec3(vUv.x * 9.0 * uScale, vUv.y * 3.0 * uScale - t, t * 0.15));
  float n2 = wNoise(vec3(vUv.x * 23.0 * uScale + 3.1, vUv.y * 7.0 * uScale - t * 1.7, 1.7 + t * 0.1));
  float streak = smoothstep(0.5, 0.9, n1 * 0.65 + n2 * 0.45);
  float foam = smoothstep(0.6, 0.85, n2 * 0.8 + n1 * 0.3 + fres * 0.35) * uFoam;
  vec3 L = normalize(vec3(0.35, 0.85, 0.4));
  float spec = pow(max(0.0, dot(reflect(-L, N), V)), 36.0);
  vec3 col = mix(uDeep, uLight, clamp(0.3 + 0.5 * fres + streak * 0.35, 0.0, 1.0));
  col = mix(col, uFoamC, foam);
  col += spec * 0.55;
  float a = clamp((0.5 + 0.38 * fres + streak * 0.12 + foam * 0.35) * uAlpha, 0.0, 1.0);
  if (a < 0.01) discard;
  gl_FragColor = vec4(col, a);
}`;

export type WaterMaterial = THREE.ShaderMaterial & { uniforms: Record<'uTime' | 'uFlow' | 'uAlpha' | 'uFoam' | 'uScale' | 'uTube' | 'uLen' | 'uR0' | 'uR1', THREE.IUniform> };

/** Moving water. `tube`: a unit cylinder shaped by uLen / uR0 / uR1 (torrents, waterfalls). */
export function waterMaterial(o: { flow?: number; alpha?: number; foam?: number; scale?: number; tube?: boolean; boil?: boolean } = {}): WaterMaterial {
  const m = new THREE.ShaderMaterial({
    vertexShader: WATER_VERT,
    fragmentShader: WATER_FRAG,
    uniforms: {
      uTime: { value: 0 },
      uFlow: { value: o.flow ?? 1.6 },
      uAlpha: { value: o.alpha ?? 1 },
      uFoam: { value: o.foam ?? 0.6 },
      uScale: { value: o.scale ?? 1 },
      uTube: { value: o.tube ? 1 : 0 },
      uLen: { value: 1 },
      uR0: { value: 1 },
      uR1: { value: 1 },
      uDeep: { value: (o.boil ? new THREE.Color('#5E9CC8') : DEEP).clone() },
      uLight: { value: (o.boil ? new THREE.Color('#BFE6FF') : LIGHT).clone() },
      uFoamC: { value: FOAM.clone().multiplyScalar(0.86) },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  return m as WaterMaterial;
}

// ------------------------------------------------------------------ splashes

/** Water hitting something: droplets thrown up and out (biased along dir), foam, a ring on the ground. */
export function splash(g: Game, p: THREE.Vector3, power = 1, dir?: THREE.Vector3, sound = true): void {
  const sp = WaterSpray.of(g);
  const n = Math.round(20 + 55 * power);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const up = 0.3 + Math.random() * 0.9;
    const s = (3 + Math.random() * 6) * Math.sqrt(power);
    let vx = Math.cos(a) * s, vz = Math.sin(a) * s;
    if (dir) {
      vx += dir.x * s * 0.6;
      vz += dir.z * s * 0.6;
    }
    sp.spawn(p.x + (Math.random() - 0.5) * 0.4 * power, p.y + Math.random() * 0.3, p.z + (Math.random() - 0.5) * 0.4 * power, vx, up * s * 1.2, vz, (0.05 + Math.random() * 0.08) * (0.8 + power * 0.3), 0.8 + Math.random() * 0.8, Math.random());
  }
  for (let i = 0; i < 4 + power * 9; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * power;
    g.engine.dust.spawn({ x: p.x + Math.cos(a) * r, y: p.y + Math.random() * 0.6, z: p.z + Math.sin(a) * r, vx: Math.cos(a) * 1.5, vy: 0.6 + Math.random() * 1.5, vz: Math.sin(a) * 1.5, size: 0.5 + power * 0.5, sizeEnd: 1.4 + power * 1.4, life: 0.9 + Math.random() * 0.6, r: 0.84, g: 0.94, b: 1, alpha: 0.42, alphaEnd: 0, drag: 1.5, tex: TEX_PUFF });
  }
  const gy = groundAt(g, p.x, p.y + 0.5, p.z, 4);
  if (gy !== null) g.addRing(new THREE.Vector3(p.x, gy, p.z), 1.2 + power * 2.2, '#BFE6FF', 0.5);
  if (sound) g.sfx.play('splash', p, Math.min(1.5, 0.5 + power * 0.5));
}

/** Drips off a soaked fighter. */
export function drip(g: Game, f: Fighter): void {
  if (Math.random() > 0.35) return;
  const sp = WaterSpray.of(g);
  const a = Math.random() * Math.PI * 2;
  sp.spawn(f.pos.x + Math.cos(a) * f.def.radius * 0.8, f.pos.y + f.def.height * (0.3 + Math.random() * 0.6), f.pos.z + Math.sin(a) * f.def.radius * 0.8, 0, -0.5, 0, 0.04, 0.6, 0.5);
}

// ------------------------------------------------------------------ the flood

const FLOOD_VERT = /* glsl */ `
varying vec3 vW;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const FLOOD_FRAG = /* glsl */ `
uniform float uTime;
uniform float uR;
uniform float uLevel;
uniform vec3 uC;
uniform vec3 uDeep;
uniform vec3 uLight;
uniform vec3 uFoamC;
varying vec3 vW;
${NOISE}
void main() {
  vec2 d = vW.xz - uC.xz;
  float r = length(d);
  // a ragged edge spreading out from the centre
  float edgeN = wNoise(vec3(normalize(d + 1e-4) * 3.0, uTime * 0.3)) * 0.9;
  float R = uR - edgeN;
  float inside = 1.0 - smoothstep(R - 0.5, R, r);
  if (inside < 0.01) discard;
  vec3 V = normalize(cameraPosition - vW);
  // ripples: a perturbed normal from two drifting noise layers
  vec2 q = vW.xz * 1.3;
  float h0 = wNoise(vec3(q, uTime * 0.9)) + 0.5 * wNoise(vec3(q * 2.3 + 7.0, uTime * 1.4));
  float hx = wNoise(vec3(q + vec2(0.15, 0.0), uTime * 0.9)) + 0.5 * wNoise(vec3((q + vec2(0.15, 0.0)) * 2.3 + 7.0, uTime * 1.4));
  float hz = wNoise(vec3(q + vec2(0.0, 0.15), uTime * 0.9)) + 0.5 * wNoise(vec3((q + vec2(0.0, 0.15)) * 2.3 + 7.0, uTime * 1.4));
  vec3 N = normalize(vec3((h0 - hx) * 1.6, 1.0, (h0 - hz) * 1.6));
  float fres = pow(clamp(1.0 - dot(N, V), 0.0, 1.0), 3.0);
  vec3 L = normalize(vec3(0.35, 0.85, 0.4));
  float spec = pow(max(0.0, dot(reflect(-L, N), V)), 60.0);
  float foam = smoothstep(R - 1.4, R - 0.4, r) * (0.55 + 0.45 * wNoise(vec3(vW.xz * 4.0, uTime)));
  foam += smoothstep(0.78, 0.95, h0 * 0.7) * 0.4;
  vec3 col = mix(uDeep, uLight, 0.25 + 0.6 * fres);
  col = mix(col, uFoamC, clamp(foam, 0.0, 1.0));
  col += spec * 0.7;
  float a = (0.62 + 0.25 * fres + foam * 0.25) * inside * uLevel;
  gl_FragColor = vec4(col, clamp(a, 0.0, 0.92));
}`;

/** How a flood looks and what wading in it does (default: clear water that soaks and slows). */
export interface FloodLook {
  deep?: THREE.ColorRepresentation;
  light?: THREE.ColorRepresentation;
  foam?: THREE.ColorRepresentation;
  /** soak whoever wades in it (wet fighters drip water) */
  soak?: boolean;
  /** slow taken by everyone but the owner */
  slow?: number;
}

/** Standing water spread over the ground: it slows and soaks whoever wades in it, then drains. */
export class Flood implements Projectile {
  done = false;
  readonly center: THREE.Vector3;
  private mesh: THREE.Mesh;
  private mat: THREE.ShaderMaterial;
  private t = 0;
  private r = 0;
  private acc = 0;
  readonly surface: number;

  constructor(private g: Game, readonly owner: Fighter | null, at: THREE.Vector3, readonly R: number, readonly life = 12, readonly depth = 0.3, readonly look: FloodLook = {}) {
    const gy = groundAt(g, at.x, at.y + 1, at.z, 8) ?? at.y;
    this.center = new THREE.Vector3(at.x, gy, at.z);
    this.surface = gy + depth;
    // a grid over the disc, each vertex laid on the ground under it (draped down over edges, never above
    // the surface)
    const n = Math.max(12, Math.min(40, Math.round(R * 2.4)));
    const geo = new THREE.PlaneGeometry(R * 2.2, R * 2.2, n, n);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = at.x + pos.getX(i), z = at.z + pos.getZ(i);
      const gyv = groundAt(g, x, this.surface + 1.5, z, 14);
      const y = gyv === null ? this.surface : Math.min(this.surface, gyv + depth);
      pos.setY(i, y - this.surface);
    }
    geo.computeVertexNormals();
    this.mat = new THREE.ShaderMaterial({
      vertexShader: FLOOD_VERT,
      fragmentShader: FLOOD_FRAG,
      uniforms: {
        uTime: { value: 0 }, uR: { value: 0 }, uLevel: { value: 1 }, uC: { value: this.center.clone() },
        uDeep: { value: look.deep !== undefined ? new THREE.Color(look.deep) : DEEP.clone() },
        uLight: { value: look.light !== undefined ? new THREE.Color(look.light) : LIGHT.clone() },
        uFoamC: { value: look.foam !== undefined ? new THREE.Color(look.foam) : FOAM.clone().multiplyScalar(0.86) },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.position.set(at.x, this.surface, at.z);
    this.mesh.renderOrder = 3;
    this.mesh.frustumCulled = false;
    g.engine.gr.scene.add(this.mesh);
    const list = Flood.list(g);
    list.push(this);
    // too many sheets: the oldest drains early
    if (list.length > 6) list[0].drain();
  }

  static list(g: Game): Flood[] {
    const d = g as unknown as { floods?: Flood[] };
    return (d.floods ??= []);
  }

  /** whether p stands in some flood (and how deep its surface is above p) */
  static at(g: Game, p: THREE.Vector3): Flood | null {
    for (const f of Flood.list(g)) if (!f.done && f.contains(p)) return f;
    return null;
  }

  contains(p: THREE.Vector3): boolean {
    const dx = p.x - this.center.x, dz = p.z - this.center.z;
    return dx * dx + dz * dz < (this.r - 0.4) * (this.r - 0.4) && p.y < this.surface + 0.4 && p.y > this.center.y - 3;
  }

  drain(): void {
    this.t = Math.max(this.t, this.life);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const grow = Math.min(1, this.t / 1.1);
    this.r = this.R * (1 - Math.pow(1 - grow, 3));
    const draining = this.t > this.life;
    if (this.t > this.life + 3) {
      this.done = true;
      return;
    }
    if (draining) return;
    this.acc += dt;
    if (this.acc < 0.1) return;
    this.acc = 0;
    // wading: slowed and soaked; splashes kicked up by anyone moving through it
    const sp = WaterSpray.of(g);
    const soak = this.look.soak ?? true;
    for (const f of g.fighters) {
      if (f.dead || !this.contains(f.pos)) continue;
      if (soak) f.wetT = Math.max(f.wetT, 5);
      if (f !== this.owner) f.slow(this.look.slow ?? 0.35, 0.25);
      const v = Math.hypot(f.body.vel.x, f.body.vel.z);
      if (v > 1.5 && soak)
        for (let i = 0; i < Math.min(8, v); i++) sp.spawn(f.pos.x + (Math.random() - 0.5) * 0.5, this.surface, f.pos.z + (Math.random() - 0.5) * 0.5, f.body.vel.x * 0.2 + (Math.random() - 0.5) * 2, 1.5 + Math.random() * 2.5, f.body.vel.z * 0.2 + (Math.random() - 0.5) * 2, 0.05, 0.6, 0.6);
    }
  }

  render(_dt: number, time: number): void {
    const u = this.mat.uniforms;
    u.uTime.value = time;
    u.uR.value = this.r;
    const k = this.t > this.life ? 1 - (this.t - this.life) / 3 : 1;
    u.uLevel.value = Math.max(0, k);
    this.mesh.position.y = this.surface - (1 - k) * this.depth * 0.8;
  }

  dispose(): void {
    const list = Flood.list(this.g);
    const i = list.indexOf(this);
    if (i >= 0) list.splice(i, 1);
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}

// ------------------------------------------------------------------ La Gota

export interface GotaOpts {
  speed?: number;
  size?: number;
  damage?: number;
  /** carve power and radius of the burst */
  power?: number;
  blast?: number;
  range?: number;
}

let toothGeo: THREE.BufferGeometry | null = null;
/** an elongated drop, flattened like a tooth, its point along +Z (unit size ≈ 1 m long) */
function tooth(): THREE.BufferGeometry {
  if (toothGeo) return toothGeo;
  const prof = [[0, -0.42], [0.13, -0.36], [0.2, -0.2], [0.21, -0.02], [0.16, 0.18], [0.08, 0.36], [0, 0.56]].map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.LatheGeometry(prof, 18);
  g.rotateX(Math.PI / 2);
  g.scale(0.7, 1, 1);
  toothGeo = g;
  return g;
}

/** La Gota: a pressurised drop shaped like a shark's tooth, fired flat and fast; it bursts through walls. */
export class LaGota implements Projectile {
  done = false;
  private group = new THREE.Group();
  private mat: WaterMaterial;
  private coreMat: THREE.MeshBasicMaterial;
  private pos: THREE.Vector3;
  private dir: THREE.Vector3;
  private travelled = 0;
  private t = 0;
  private o: Required<GotaOpts>;

  constructor(private g: Game, readonly owner: Fighter, origin: THREE.Vector3, dir: THREE.Vector3, o: GotaOpts = {}) {
    this.o = { speed: o.speed ?? 72, size: o.size ?? 1, damage: o.damage ?? 56, power: o.power ?? 520, blast: o.blast ?? 2.4, range: o.range ?? 110 };
    this.pos = origin.clone();
    this.dir = dir.clone().normalize();
    this.mat = waterMaterial({ flow: 6, foam: 0.8, scale: 0.6 });
    this.coreMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#D8F1FF').multiplyScalar(0.92), transparent: true, opacity: 0.85, depthWrite: false });
    const s = 0.75 * this.o.size;
    const shell = new THREE.Mesh(tooth(), this.mat);
    shell.scale.setScalar(s);
    const core = new THREE.Mesh(tooth(), this.coreMat);
    core.scale.setScalar(s * 0.55);
    this.group.add(shell, core);
    this.group.traverse((c) => (c.frustumCulled = false));
    this.group.renderOrder = 5;
    g.engine.gr.scene.add(this.group);
    this.place();
  }

  private place(): void {
    this.group.position.copy(this.pos);
    _q.setFromUnitVectors(_v.set(0, 0, 1), this.dir);
    this.group.quaternion.copy(_q);
    this.group.rotateZ(this.t * 9);
  }

  update(dt: number, g: Game): void {
    if (this.done) return;
    this.t += dt;
    const step = this.o.speed * dt;
    const n = Math.max(1, Math.ceil(step / 0.3));
    const w = g.engine.world;
    for (let k = 0; k < n; k++) {
      this.pos.addScaledVector(this.dir, step / n);
      this.travelled += step / n;
      for (const f of g.enemiesOf(this.owner)) {
        if (f.dead) continue;
        const c = f.center(_w);
        const top = f.pos.y + f.def.height, bot = f.pos.y;
        const cy = Math.max(bot, Math.min(top, this.pos.y));
        if (Math.hypot(this.pos.x - c.x, this.pos.y - cy, this.pos.z - c.z) < f.def.radius + 0.35 * this.o.size) {
          this.burst(g, f);
          return;
        }
      }
      if (w.isSolidAtPos(this.pos.x, this.pos.y, this.pos.z) || this.travelled > this.o.range) {
        this.burst(g, null);
        return;
      }
    }
    this.place();
    // spray off its tail and a thin mist behind it
    const sp = WaterSpray.of(g);
    for (let i = 0; i < 4; i++) sp.spawn(this.pos.x - this.dir.x * 0.4, this.pos.y - this.dir.y * 0.4, this.pos.z - this.dir.z * 0.4, -this.dir.x * 6 + (Math.random() - 0.5) * 4, (Math.random() - 0.2) * 3, -this.dir.z * 6 + (Math.random() - 0.5) * 4, 0.05 + Math.random() * 0.05, 0.5, 0.7);
    if (Math.random() < 0.6) g.engine.dust.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, vx: -this.dir.x * 2, vy: 0.3, vz: -this.dir.z * 2, size: 0.3 * this.o.size, sizeEnd: 0.9 * this.o.size, life: 0.5, r: 0.86, g: 0.95, b: 1, alpha: 0.3, alphaEnd: 0, tex: TEX_PUFF });
  }

  private burst(g: Game, hit: Fighter | null): void {
    this.done = true;
    const at = this.pos.clone();
    const o = this.o;
    g.engine.destruction.carve(new SphereShape(at, o.blast, 0.5), { mode: 'explode', power: o.power, dir: this.dir.clone(), impulse: 16, dust: 0.6 });
    for (const f of g.enemiesOf(this.owner)) {
      if (f.dead) continue;
      const d = f.center(_w).distanceTo(at);
      if (f !== hit && d > o.blast + f.def.radius) continue;
      const k = f === hit ? 1 : 0.5;
      const wet = f.wetT > 0 ? 1.15 : 1;
      _v.subVectors(f.pos, at).setY(0);
      if (_v.lengthSq() < 1e-4) _v.copy(this.dir);
      _v.normalize().lerp(this.dir, 0.5).normalize();
      g.damage(f, o.damage * k * wet, this.owner, _v.clone(), { knock: 20 * k, launch: 5 * k, heavy: true, hitstop: 0.09, shake: 0.35, color: '#7CC8F5' });
      f.wetT = Math.max(f.wetT, 5);
    }
    splash(g, at, 1.4 * o.size, this.dir);
    const gy = groundAt(g, at.x, at.y + 0.5, at.z, 3);
    if (gy !== null) g.addProjectile(new Flood(g, this.owner, new THREE.Vector3(at.x, gy, at.z), 2.6 * o.size, 7));
    if (g.player && at.distanceTo(g.player.pos) < 40) g.shake(0.15);
  }

  render(_dt: number, time: number): void {
    this.mat.uniforms.uTime.value = time;
  }

  dispose(): void {
    this.group.removeFromParent();
    this.mat.dispose();
    this.coreMat.dispose();
  }
}

// ------------------------------------------------------------------ Cascada

export interface TorrentOpts {
  len?: number;
  r0?: number;
  r1?: number;
  dur?: number;
  /** damage per second to whatever stands in it */
  dps?: number;
  power?: number;
  speed?: number;
}

/** Cascada: a river poured out of the blade; it shoves everything in its path and floods where it lands. */
export class Torrent implements Projectile {
  done = false;
  private tube: THREE.Mesh;
  private head: THREE.Mesh;
  private mat: WaterMaterial;
  private headMat: WaterMaterial;
  private t = 0;
  private L = 0;
  private blocked = false;
  private acc = 0;
  private carveAcc = 0;
  private flooded = 0;
  private o: Required<TorrentOpts>;
  readonly from = new THREE.Vector3();
  readonly dir: THREE.Vector3;

  constructor(private g: Game, readonly owner: Fighter, private src: () => THREE.Vector3, dir: THREE.Vector3, o: TorrentOpts = {}) {
    this.o = { len: o.len ?? 30, r0: o.r0 ?? 0.45, r1: o.r1 ?? 2.6, dur: o.dur ?? 1.5, dps: o.dps ?? 95, power: o.power ?? 170, speed: o.speed ?? 42 };
    this.dir = dir.clone().normalize();
    this.mat = waterMaterial({ flow: 5, foam: 0.7, tube: true, scale: 1.2 });
    const geo = new THREE.CylinderGeometry(1, 1, 1, 28, 10, true);
    geo.translate(0, 0.5, 0);
    this.tube = new THREE.Mesh(geo, this.mat);
    this.headMat = waterMaterial({ flow: 3, foam: 1, scale: 0.8 });
    this.head = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), this.headMat);
    for (const m of [this.tube, this.head]) {
      m.frustumCulled = false;
      m.renderOrder = 5;
      g.engine.gr.scene.add(m);
    }
    this.from.copy(src());
    g.sfx.play('torrent', this.from, 1.2);
  }

  private radiusAt(k: number): number {
    const grow = Math.min(1, this.L / this.o.len);
    return this.o.r0 + (this.o.r1 * (0.4 + 0.6 * grow) - this.o.r0) * k;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const o = this.o;
    if (this.t > o.dur + 0.45) {
      this.done = true;
      return;
    }
    this.from.copy(this.src());
    const pouring = this.t < o.dur;
    if (pouring && !this.blocked) this.L = Math.min(o.len, this.L + o.speed * dt);
    const headP = _w.copy(this.from).addScaledVector(this.dir, this.L);
    // the head breaks through what it can and stops on what it cannot
    if (pouring) {
      this.carveAcc += dt;
      if (this.carveAcc > 0.08) {
        this.carveAcc = 0;
        const rh = this.radiusAt(1);
        g.engine.destruction.carve(new SphereShape(headP.clone(), rh * 0.85, 0.5), { mode: 'smash', power: o.power, dir: this.dir.clone(), impulse: 12, dust: 0.25 });
        if (g.engine.world.isSolidAtPos(headP.x, headP.y, headP.z)) this.blocked = true;
      }
    }
    // spray and foam at the head
    const sp = WaterSpray.of(g);
    const rh = this.radiusAt(1);
    for (let i = 0; i < (pouring ? 16 : 4); i++) {
      const a = Math.random() * Math.PI * 2;
      sp.spawn(headP.x + Math.cos(a) * rh * 0.8, headP.y + (Math.random() - 0.3) * rh, headP.z + Math.sin(a) * rh * 0.8, this.dir.x * 10 + Math.cos(a) * 5, 2 + Math.random() * 6, this.dir.z * 10 + Math.sin(a) * 5, 0.07 + Math.random() * 0.1, 0.9, Math.random());
    }
    if (pouring && Math.random() < 0.7) g.engine.dust.spawn({ x: headP.x, y: headP.y, z: headP.z, vx: this.dir.x * 4, vy: 1.5, vz: this.dir.z * 4, size: rh, sizeEnd: rh * 2.4, life: 1.1, r: 0.86, g: 0.95, b: 1, alpha: 0.4, alphaEnd: 0, drag: 1.2, tex: TEX_PUFF });
    // the flood where it comes down
    if (pouring && (this.blocked || this.L >= o.len * 0.6) && this.flooded < 2 && this.t > 0.25 + this.flooded * 0.6) {
      this.flooded++;
      g.addProjectile(new Flood(g, this.owner, headP.clone(), 6 + this.flooded * 2.5, 12));
      splash(g, headP, 2.2, this.dir);
    }
    if (!pouring) return;
    // whatever stands in it is battered and carried along
    this.acc += dt;
    if (this.acc < 0.12) return;
    this.acc = 0;
    for (const f of g.enemiesOf(this.owner)) {
      if (f.dead) continue;
      const c = f.center(_v);
      const along = Math.max(0, Math.min(this.L, _v.subVectors(c, this.from).dot(this.dir)));
      const p = this.from.clone().addScaledVector(this.dir, along);
      if (p.distanceTo(f.center()) > this.radiusAt(along / Math.max(1e-3, this.L)) + f.def.radius) continue;
      const wet = f.wetT > 0 ? 1.15 : 1;
      g.damage(f, o.dps * 0.12 * wet, this.owner, this.dir.clone(), { knock: 9, launch: 1, hitstop: 0.02, shake: 0.12, quiet: true, color: '#7CC8F5' });
      f.push.addScaledVector(this.dir, 6);
      f.wetT = Math.max(f.wetT, 6);
      f.slow(0.4, 0.4);
    }
  }

  render(_dt: number, time: number): void {
    const fade = this.t > this.o.dur ? Math.max(0, 1 - (this.t - this.o.dur) / 0.45) : Math.min(1, this.t / 0.1);
    for (const m of [this.mat, this.headMat]) {
      m.uniforms.uTime.value = time;
      m.uniforms.uAlpha.value = fade;
    }
    const u = this.mat.uniforms;
    u.uLen.value = Math.max(0.01, this.L);
    u.uR0.value = this.o.r0 * (0.6 + 0.4 * fade);
    u.uR1.value = this.radiusAt(1) * (0.5 + 0.5 * fade);
    this.tube.position.copy(this.from);
    this.tube.quaternion.setFromUnitVectors(UP, this.dir);
    this.head.position.copy(this.from).addScaledVector(this.dir, this.L);
    this.head.scale.setScalar(this.radiusAt(1) * 1.15 * (0.4 + 0.6 * fade));
    this.head.rotation.y = time * 3;
  }

  dispose(): void {
    for (const m of [this.tube, this.head]) {
      m.removeFromParent();
      m.geometry.dispose();
    }
    this.mat.dispose();
    this.headMat.dispose();
  }
}

// ------------------------------------------------------------------ Cascada Real

/** Cascada Real: the river dropped out of the sky onto the target — a crushing column, then a lake. */
export class Waterfall implements Projectile {
  done = false;
  private col: THREE.Mesh;
  private mat: WaterMaterial;
  private t = 0;
  private landed = false;
  private acc = 0;
  readonly base: THREE.Vector3;
  private readonly H = 46;

  constructor(private g: Game, readonly owner: Fighter, at: THREE.Vector3, readonly r = 4.6, readonly dur = 2.4, readonly damage = 170) {
    const gy = groundAt(g, at.x, at.y + 2, at.z, 12) ?? at.y;
    this.base = new THREE.Vector3(at.x, gy, at.z);
    this.mat = waterMaterial({ flow: -7, foam: 0.75, tube: true, scale: 1.4 });
    const geo = new THREE.CylinderGeometry(1, 1, 1, 36, 12, true);
    geo.translate(0, 0.5, 0);
    this.col = new THREE.Mesh(geo, this.mat);
    this.col.frustumCulled = false;
    this.col.renderOrder = 5;
    g.engine.gr.scene.add(this.col);
    g.sfx.play('torrent', this.base, 1.6);
  }

  /** the falling front's height above the base */
  private front(): number {
    return Math.max(0, this.H * (1 - this.t / 0.4));
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.t > this.dur + 0.6) {
      this.done = true;
      return;
    }
    const b = this.base;
    if (!this.landed && this.front() <= 0) {
      this.landed = true;
      // the impact: a crater, a ring of spray, the lake
      g.engine.destruction.carve(new SphereShape(b.clone(), this.r * 0.9, 0.5), { mode: 'smash', power: 300, impulse: 18, dust: 0.5 });
      splash(g, b.clone().setY(b.y + 0.3), 4);
      g.addRing(b.clone(), this.r * 3.2, '#BFE6FF', 0.7);
      g.addProjectile(new Flood(g, this.owner, b.clone(), this.r * 3, 14, 0.45));
      for (const f of g.enemiesOf(this.owner)) {
        if (f.dead) continue;
        _v.subVectors(f.pos, b).setY(0);
        const d = _v.length();
        if (d > this.r * 1.5 + f.def.radius || Math.abs(f.pos.y - b.y) > this.H) continue;
        _v.normalize();
        g.damage(f, this.damage * (d < this.r ? 1 : 0.55), this.owner, _v.clone(), { knock: 26, heavy: true, hitstop: 0.14, shake: 0.6, color: '#7CC8F5' });
        f.wetT = Math.max(f.wetT, 8);
      }
      if (g.player && b.distanceTo(g.player.pos) < 60) g.shake(0.5);
    }
    if (!this.landed || this.t > this.dur) return;
    // the column keeps pounding: spray off its foot, anyone under it beaten down and shoved out
    const sp = WaterSpray.of(g);
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 6 + Math.random() * 8;
      sp.spawn(b.x + Math.cos(a) * this.r, b.y + 0.3, b.z + Math.sin(a) * this.r, Math.cos(a) * s, 3 + Math.random() * 7, Math.sin(a) * s, 0.08 + Math.random() * 0.12, 1.1, Math.random());
    }
    if (Math.random() < 0.8) {
      const a = Math.random() * Math.PI * 2;
      g.engine.dust.spawn({ x: b.x + Math.cos(a) * this.r, y: b.y + 0.5, z: b.z + Math.sin(a) * this.r, vx: Math.cos(a) * 3, vy: 2, vz: Math.sin(a) * 3, size: 2, sizeEnd: 5, life: 1.6, r: 0.86, g: 0.95, b: 1, alpha: 0.45, alphaEnd: 0, drag: 1, tex: TEX_PUFF });
    }
    this.acc += dt;
    if (this.acc < 0.15) return;
    this.acc = 0;
    for (const f of g.enemiesOf(this.owner)) {
      if (f.dead) continue;
      _v.subVectors(f.pos, b).setY(0);
      if (_v.length() > this.r + f.def.radius) continue;
      _v.normalize();
      g.damage(f, 9, this.owner, _v.clone(), { knock: 8, hitstop: 0.02, quiet: true, color: '#7CC8F5' });
      f.push.addScaledVector(_v, 5);
      f.slow(0.5, 0.4);
    }
  }

  render(_dt: number, time: number): void {
    const fade = this.t > this.dur ? Math.max(0, 1 - (this.t - this.dur) / 0.6) : 1;
    const u = this.mat.uniforms;
    u.uTime.value = time;
    u.uAlpha.value = fade;
    const front = this.front();
    const len = this.H - front;
    u.uLen.value = Math.max(0.01, len);
    // narrow at the top, spreading as it falls; it thins as it ends
    u.uR0.value = this.r * (1.05 - 0.15 * (1 - fade));
    u.uR1.value = this.r * 0.55 * fade + 0.05;
    this.col.position.set(this.base.x, this.base.y + front, this.base.z);
  }

  dispose(): void {
    this.col.removeFromParent();
    this.col.geometry.dispose();
    this.mat.dispose();
  }
}

// ------------------------------------------------------------------ the cocoon

/**
 * The release: water surges up round her in two streams that meet like a heart, then closes into a
 * spinning sphere. burst() — she cuts it open from inside: the water flies out flat in every direction.
 */
export class Cocoon implements Projectile {
  done = false;
  private mesh: THREE.Mesh;
  private mat: WaterMaterial;
  private t = 0;
  private bursting = -1;
  private ring: ShockRing | null = null;

  constructor(private g: Game, readonly owner: Fighter, readonly r = 1.35) {
    this.mat = waterMaterial({ flow: 2.4, foam: 0.85, scale: 1.3 });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 22), this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 5;
    this.mesh.scale.setScalar(0.01);
    g.engine.gr.scene.add(this.mesh);
    g.sfx.play('torrent', owner.center(), 0.7);
  }

  /** closed round her (she is hidden and safe inside) */
  get closed(): boolean {
    return this.bursting < 0 && this.t > 0.75;
  }

  burst(): void {
    if (this.bursting >= 0) return;
    this.bursting = 0;
    const c = this.owner.center();
    const sp = WaterSpray.of(this.g);
    for (let i = 0; i < 280; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 8 + Math.random() * 12;
      sp.spawn(c.x + Math.cos(a) * this.r, c.y + (Math.random() - 0.5) * this.r * 1.4, c.z + Math.sin(a) * this.r, Math.cos(a) * s, (Math.random() - 0.2) * 5, Math.sin(a) * s, 0.06 + Math.random() * 0.12, 1.2, Math.random());
    }
    splash(this.g, this.owner.pos.clone(), 2.6);
    this.ring = new ShockRing(this.owner.pos.clone().setY(this.owner.pos.y + 0.6), 7, '#BFE6FF', 0.5, 0.8);
    this.g.engine.gr.scene.add(this.ring.mesh);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const f = this.owner;
    const c = f.center();
    if (this.bursting >= 0) {
      this.bursting += dt;
      this.ring?.update(dt);
      if (this.bursting > 0.6) this.done = true;
      return;
    }
    const sp = WaterSpray.of(g);
    if (this.t < 0.7) {
      // two streams rising round her, curving in to meet over her head — a heart from the front
      const k = Math.min(1, this.t / 0.6);
      for (const side of [-1, 1]) {
        for (let i = 0; i < 5; i++) {
          const u = Math.random() * k;
          const fw = f.forward(_v);
          const rt = _w.set(fw.z, 0, -fw.x);
          // heart lobe: out to the side at mid height, back in at the top and the bottom point
          const lobe = Math.sin(u * Math.PI) * 1.2 + 0.25;
          const h = -0.9 + u * 2.4;
          const px = c.x + rt.x * side * lobe + fw.x * 0.5 * Math.cos(u * 6);
          const pz = c.z + rt.z * side * lobe + fw.z * 0.5 * Math.cos(u * 6);
          sp.spawn(px, c.y + h, pz, (Math.random() - 0.5), 2 + Math.random() * 2, (Math.random() - 0.5), 0.08 + Math.random() * 0.08, 0.5, 0.3 + Math.random() * 0.6);
        }
      }
      if (Math.random() < 0.5) g.engine.dust.spawn({ x: c.x, y: f.pos.y + 0.2, z: c.z, vx: (Math.random() - 0.5) * 3, vy: 1, vz: (Math.random() - 0.5) * 3, size: 1, sizeEnd: 2.6, life: 1, r: 0.86, g: 0.95, b: 1, alpha: 0.35, alphaEnd: 0, tex: TEX_PUFF });
    } else {
      // the shell spins; water sheets off it
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2;
        sp.spawn(c.x + Math.cos(a) * this.r, c.y + (Math.random() - 0.5) * this.r, c.z + Math.sin(a) * this.r, -Math.sin(a) * 3, Math.random() * 1.5, Math.cos(a) * 3, 0.06, 0.5, 0.6);
      }
    }
  }

  render(_dt: number, time: number): void {
    const u = this.mat.uniforms;
    u.uTime.value = time;
    const c = this.owner.center();
    this.mesh.position.copy(c);
    this.mesh.rotation.y = time * 5;
    if (this.bursting >= 0) {
      // split open: it flies apart and thins out in a breath
      const k = this.bursting / 0.25;
      this.mesh.scale.set(this.r * (1 + k * 2.5), this.r * Math.max(0.05, 1 - k), this.r * (1 + k * 2.5));
      u.uAlpha.value = Math.max(0, 1 - k);
      return;
    }
    const grow = Math.max(0, Math.min(1, (this.t - 0.4) / 0.35));
    const e = 1 - Math.pow(1 - grow, 3);
    this.mesh.scale.set(this.r * e, this.r * 1.18 * e, this.r * e);
    u.uAlpha.value = 0.4 + 0.6 * e;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mat.dispose();
    this.ring?.mesh.removeFromParent();
  }
}

// ------------------------------------------------------------------ Hirviendo

/** Hirviendo: the water round the blade boiling — bubbles, steam, a shimmering shell. */
export class Boil implements Projectile {
  done = false;
  private mesh: THREE.Mesh;
  private mat: WaterMaterial;
  private t = 0;
  private ending = -1;

  constructor(private g: Game, readonly owner: Fighter, private at: () => THREE.Vector3, readonly r = 1.5) {
    this.mat = waterMaterial({ flow: 9, foam: 1, scale: 2.4, boil: true, alpha: 0.4 });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 5;
    g.engine.gr.scene.add(this.mesh);
  }

  /** a burst of steam where something was boiled away */
  puff(p: THREE.Vector3, n = 10): void {
    for (let i = 0; i < n; i++)
      this.g.engine.dust.spawn({ x: p.x + (Math.random() - 0.5) * 0.6, y: p.y + (Math.random() - 0.5) * 0.6, z: p.z + (Math.random() - 0.5) * 0.6, vx: (Math.random() - 0.5) * 3, vy: 1.5 + Math.random() * 2, vz: (Math.random() - 0.5) * 3, size: 0.6, sizeEnd: 2.2, life: 1.2, r: 0.95, g: 0.96, b: 0.97, alpha: 0.55, alphaEnd: 0, drag: 1.4, tex: TEX_PUFF });
  }

  end(): void {
    if (this.ending < 0) this.ending = 0;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.ending >= 0) {
      this.ending += dt;
      if (this.ending > 0.35) this.done = true;
    }
    const p = this.at();
    // bubbles rising through it, steam curling off the top
    for (let i = 0; i < 4; i++) {
      const a = Math.random() * Math.PI * 2, rr = Math.random() * this.r;
      g.engine.glow.spawn({ x: p.x + Math.cos(a) * rr, y: p.y + (Math.random() - 0.5) * this.r, z: p.z + Math.sin(a) * rr, vy: 1.5 + Math.random() * 2, size: 0.06 + Math.random() * 0.06, sizeEnd: 0.02, life: 0.5, r: 0.8, g: 0.92, b: 1, alpha: 0.7, alphaEnd: 0, tex: TEX_GLOW });
    }
    if (Math.random() < 0.6) g.engine.dust.spawn({ x: p.x + (Math.random() - 0.5) * this.r, y: p.y + this.r * 0.6, z: p.z + (Math.random() - 0.5) * this.r, vx: (Math.random() - 0.5), vy: 1.2, vz: (Math.random() - 0.5), size: 0.5, sizeEnd: 1.8, life: 1.3, r: 0.95, g: 0.96, b: 0.97, alpha: 0.4, alphaEnd: 0, tex: TEX_PUFF });
  }

  render(_dt: number, time: number): void {
    const u = this.mat.uniforms;
    u.uTime.value = time;
    const grow = Math.min(1, this.t / 0.2) * (this.ending >= 0 ? Math.max(0, 1 - this.ending / 0.35) : 1);
    const wob = 1 + Math.sin(time * 31) * 0.03 + Math.sin(time * 17) * 0.02;
    this.mesh.position.copy(this.at());
    this.mesh.scale.setScalar(this.r * grow * wob);
    u.uAlpha.value = 0.45 * grow;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}

// ------------------------------------------------------------------ the blade's window

const GLOW_FRAG = /* glsl */ `
uniform float uTime;
uniform float uLevel;
uniform vec3 uCol;
varying vec2 vUv;
${NOISE}
void main() {
  vec2 d = abs(vUv - 0.5) * 2.0;
  float edge = 1.0 - smoothstep(0.75, 1.0, max(d.x, d.y));
  float n = wNoise(vec3(vUv * vec2(3.0, 9.0), uTime * 4.0));
  float a = edge * (0.55 + 0.45 * n) * uLevel;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uCol * (1.4 + 1.6 * n * uLevel), a);
}`;

/** Light filling the hollow window of the sealed blade (Ola Azul charging in it). */
export class BladeGlow {
  readonly mesh: THREE.Mesh;
  private mat: THREE.ShaderMaterial;
  level = 0;

  constructor(prop: THREE.Object3D, center: readonly [number, number, number], w: number, h: number, color: THREE.ColorRepresentation) {
    // a plane in the blade's flat: across (prop Y) by along (prop Z)
    const geo = new THREE.PlaneGeometry(h, w);
    geo.rotateY(Math.PI / 2);
    this.mat = new THREE.ShaderMaterial({
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: GLOW_FRAG,
      uniforms: { uTime: { value: 0 }, uLevel: { value: 0 }, uCol: { value: new THREE.Color(color) } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.position.set(center[0], center[1], center[2]);
    this.mesh.renderOrder = 6;
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    prop.add(this.mesh);
  }

  update(time: number): void {
    this.mat.uniforms.uTime.value = time;
    this.mat.uniforms.uLevel.value = this.level;
    this.mesh.visible = this.level > 0.01;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}

// ------------------------------------------------------------------ Trident

/** One of Trident's cuts: a crescent of high-pressure water that sheds spray as it flies. */
export class WaterBlade extends GetsugaProjectile {
  private wg: Game;
  constructor(g: Game, owner: Fighter, from: THREE.Vector3, dir: THREE.Vector3, side: THREE.Vector3, damage = 36, radius = 2.4) {
    super(g, owner, from, dir, side, { radius, halfAngle: 0.9, speed: 58, range: 70, damage, cut: 640, colors: WATER_BLADE, band: radius * 0.3 });
    this.wg = g;
  }
  override update(dt: number, g: Game): void {
    super.update(dt, g);
    if (this.done) return;
    const sp = WaterSpray.of(this.wg);
    for (let i = 0; i < 5; i++) {
      const a = (Math.random() * 2 - 1) * 0.9;
      const c = _v.copy(this.pos).addScaledVector(this.dir, -this.o.radius);
      const px = c.x + (this.dir.x * Math.cos(a) + this.side.x * Math.sin(a)) * this.o.radius;
      const py = c.y + (this.dir.y * Math.cos(a) + this.side.y * Math.sin(a)) * this.o.radius;
      const pz = c.z + (this.dir.z * Math.cos(a) + this.side.z * Math.sin(a)) * this.o.radius;
      sp.spawn(px, py, pz, -this.dir.x * 4 + (Math.random() - 0.5) * 2, Math.random() * 2, -this.dir.z * 4 + (Math.random() - 0.5) * 2, 0.05 + Math.random() * 0.05, 0.6, 0.6);
    }
  }
}
