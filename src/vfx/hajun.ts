// Hajun's fire (docs/kits/dadou.md): Dadou, the Emperor of Hell. His fire comes in three layers — black flame (drawn
// alpha-blended, near-black with a burning edge), violet and crimson (additive) — with gold for the imperial pieces.
// - HellfirePool: world-space flame cards in those four looks (one shared pool per game); hellfireAt / bodyFire /
//   hellEmbers / hellFlash build every fire below out of them.
// - HellOrb: Haien's violet orb, Shakkahō's red cannons, Onibi's wisps (they circle him first, then hunt).
// - IronPillars: Bakudō #75 Gochūtekkan, five iron pillars dropped round the target, leaning in to pin it.
// - Throne: Gyokuza's throne of black lacquer and gold rising out of the ground behind him.
// - FireRope: Kensaku, a rope of red fire thrown from his left hand that lassoes the target and hauls it in.
// - HellPillar: Gōka, the ground glowing under the target, then a column of black and violet fire.
// - DemonParade: Hyakki Yakō, a stampede of burning demon heads charging across the ground.
// - TenmaGiant: the Bankai's colossus, a rig of his own Bankai body (×11) that copies his bone rotations every
//   rendered frame, darkened to black fire with a violet rim, its halo burning; its nodachi sweeps through Game.bladeSweep
//   with its own hit list while the kit holds it `active`.
// - GatesOfHell: the Gates rise out of the ground, open, a blade from inside impales the soul before them and chains
//   drag it in; they close on it and later spit it out burning (or let him walk back out of Hell: Jigoku-gaeri).
// - BurningHells: Hachinetsu Jigoku, the ground round him turned into Hell — burning cracks, fire, a ring of flame.
// - FlameWheel: Kaen-rin, the wheel on his back flung as a buzzsaw of fire that cuts a trench and comes back.
// - MukenSphere: Muken, a sphere of black fire that swallows the target, holds it, burns it and implodes.
// - HellMeteor: Tenka Fubu's burning rocks.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { BladeSpec, Fighter } from '../game/fighter';
import { CharacterVisual, PropMesh } from '../game/characterFactory';
import type { Rig } from '../anim/rig';
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, sphere, spike, subtract, torus, type V3 } from '../models/sdf';
import { BoxShape, CapsuleShape, SphereShape } from '../destruction/shapes';
import { HAJUN_BASE_Z, NODACHI_TIP_Z, chrysanthemum, dadouAsset, dadouProp } from '../chars/dadou';
import { registerReactions } from '../chars/reactionClips';
import { groundAt } from './iceArts';
import { blackSmoke } from './dangai';
import { TEX_GLOW, TEX_PUFF, TEX_RING, TEX_STREAK } from './sprites';
import type { EnergyColors } from './energy';
import type { SkyLook } from './fire';
import type { AuraStyle } from './aura';

export const HELL_CRIMSON = '#FF3346';
export const HELL_VIOLET = '#B03CFF';
export const HELL_BLACK = '#120A12';
export const HELL_GOLD = '#E8C060';

/** sealed and Shikai: a crimson aura rimmed in violet */
export const AURA_DADOU: AuraStyle = { core: '#FFD8DE', body: '#E0203A', rim: '#A63CFF' };
/** Bankai and the demon king: black flame over crimson and violet */
export const AURA_DADOU_HELL: AuraStyle = { core: '#FFC8F0', body: '#B01EE0', rim: '#FF2A48', dark: '#120A12' };

/** black fire edged in violet: the Shikai's crescents */
export const GOKUEN: EnergyColors = { core: '#F6D8FF', body: '#B23CFF', rim: '#5E10B0', dark: '#140A14' };
/** crimson fire */
export const HELL_RED: EnergyColors = { core: '#FFE2DA', body: '#FF3346', rim: '#A0102A' };
/** the demon king's: black at the heart, crimson at the edge */
export const MAO: EnergyColors = { core: '#FFD6E0', body: '#FF2A48', rim: '#7A0E3A', dark: '#120A12' };

/** the Bankai: the sky turns the red of blood and embers */
export const SKY_HELL: SkyLook = { zen: '#1C0507', hor: '#8A1C1E', cloud: '#3E0A10', cover: 0.65, glow: 0.45, sun: 0.5, hemi: 0.62, fog: '#4E1016' };
/** Tenka Fubu: a ceiling of hellfire — violet-black overhead, burning at the horizon */
export const SKY_INFERNO: SkyLook = { zen: '#10050E', hor: '#7A1440', cloud: '#2E0A26', cover: 0.92, glow: 0.3, sun: 0.35, hemi: 0.5, fog: '#2E0A22' };

/** a sky look between a and b (k = 0 → a), written into out */
export function mixSky(a: SkyLook, b: SkyLook, k: number, out: SkyLook): SkyLook {
  const c = (x: THREE.ColorRepresentation, y: THREE.ColorRepresentation) => new THREE.Color(x).lerp(new THREE.Color(y), k);
  out.zen = c(a.zen, b.zen);
  out.hor = c(a.hor, b.hor);
  out.cloud = c(a.cloud, b.cloud);
  out.fog = c(a.fog, b.fog);
  out.cover = a.cover + (b.cover - a.cover) * k;
  out.glow = a.glow + (b.glow - a.glow) * k;
  out.sun = a.sun + (b.sun - a.sun) * k;
  out.hemi = a.hemi + (b.hemi - a.hemi) * k;
  return out;
}

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const UP = new THREE.Vector3(0, 1, 0);
const X_AXIS = new THREE.Vector3(1, 0, 0);
const IDQ = new THREE.Quaternion();

/** the colours of the sprites: crimson, violet, gold */
const RGB = { crimson: [1, 0.2, 0.27], violet: [0.69, 0.24, 1], gold: [1, 0.75, 0.36] } as const;

// ------------------------------------------------------------------------------------------------ the fire itself

const NOISE = /* glsl */ `
float fHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float fNoise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(fHash(i), fHash(i + vec3(1,0,0)), f.x), mix(fHash(i + vec3(0,1,0)), fHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(fHash(i + vec3(0,0,1)), fHash(i + vec3(1,0,1)), f.x), mix(fHash(i + vec3(0,1,1)), fHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}`;

const CARD_VERT = /* glsl */ `
attribute vec3 aPos;
attribute vec4 aParam; // width, height, phase, intensity
attribute float aKind;
varying vec2 vUv;
varying float vPhase;
varying float vInt;
varying float vKind;
void main() {
  vUv = uv;
  vPhase = aParam.z;
  vInt = aParam.w;
  vKind = aKind;
  vec3 toCam = cameraPosition - aPos;
  toCam.y = 0.0;
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), normalize(toCam + vec3(1e-4, 0.0, 0.0))));
  vec3 wp = aPos + right * (uv.x - 0.5) * aParam.x + vec3(0.0, 1.0, 0.0) * uv.y * aParam.y;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}`;

/** the tongue's shape, shared by both looks */
const CARD_SHAPE = /* glsl */ `
  float v = vUv.y;
  float t = uTime * 2.8 + vPhase * 17.0;
  float sway = (fNoise(vec3(v * 2.6 - t, vPhase * 9.0, 0.0)) - 0.5) * 0.55 * v;
  float x = vUv.x - 0.5 - sway;
  float w = 0.5 * pow(clamp(1.0 - v, 0.0, 1.0), 0.75) * smoothstep(0.0, 0.12, v);
  float n = fNoise(vec3(x * 5.0, v * 3.5 - t * 1.4, vPhase * 5.0));
  float body = 1.0 - smoothstep(w * 0.5, w, abs(x) + (n - 0.5) * 0.24);
  float fade = smoothstep(1.0, 0.4, v) * smoothstep(0.0, 0.06, v);
  float a = body * fade * clamp(vInt, 0.0, 1.0);
  if (a < 0.01) discard;`;

const BRIGHT_FRAG = /* glsl */ `
uniform float uTime;
varying vec2 vUv; varying float vPhase; varying float vInt; varying float vKind;
${NOISE}
void main() {
  ${CARD_SHAPE}
  float hot = 1.0 - smoothstep(0.0, w * 0.7, abs(x));
  vec3 rim; vec3 mid; vec3 core;
  if (vKind < 0.5) { rim = vec3(0.45, 0.02, 0.08); mid = vec3(1.0, 0.13, 0.2); core = vec3(1.0, 0.72, 0.7); }
  else if (vKind < 1.5) { rim = vec3(0.24, 0.04, 0.5); mid = vec3(0.68, 0.2, 1.0); core = vec3(0.98, 0.82, 1.0); }
  else { rim = vec3(0.6, 0.28, 0.04); mid = vec3(1.0, 0.68, 0.2); core = vec3(1.0, 0.95, 0.75); }
  vec3 col = mix(rim, mid, body);
  col = mix(col, core, hot * (1.0 - v * 0.8));
  gl_FragColor = vec4(col * (1.2 + max(0.0, vInt - 1.0) * 0.5), a * 0.85);
}`;

const DARK_FRAG = /* glsl */ `
uniform float uTime;
varying vec2 vUv; varying float vPhase; varying float vInt; varying float vKind;
${NOISE}
void main() {
  ${CARD_SHAPE}
  // black at the heart, the edge burning (violet, or crimson for kind 0)
  float edge = smoothstep(w * 0.2, w * 0.95, abs(x) + (n - 0.5) * 0.24) * (1.0 - v * 0.45);
  vec3 ec = vKind < 0.5 ? vec3(1.0, 0.12, 0.2) : vec3(0.62, 0.16, 1.0);
  vec3 col = mix(vec3(0.03, 0.012, 0.035), ec * 2.2, edge * 0.75);
  gl_FragColor = vec4(col, a * 0.94);
}`;

interface Card { x: number; y: number; z: number; w: number; h: number; life: number; age: number; int: number; ph: number; vy: number; kind: number }

/** one instanced set of flame cards */
class CardSet {
  readonly mesh: THREE.Mesh;
  private pos: Float32Array;
  private prm: Float32Array;
  private knd: Float32Array;
  cards: Card[] = [];

  constructor(scene: THREE.Scene, uniforms: { uTime: { value: number } }, frag: string, dark: boolean, readonly max: number) {
    const base = new THREE.PlaneGeometry(1, 1, 1, 4);
    base.translate(0, 0.5, 0);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index;
    geo.setAttribute('position', base.attributes.position);
    geo.setAttribute('uv', base.attributes.uv);
    this.pos = new Float32Array(max * 3);
    this.prm = new Float32Array(max * 4);
    this.knd = new Float32Array(max);
    geo.setAttribute('aPos', new THREE.InstancedBufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aParam', new THREE.InstancedBufferAttribute(this.prm, 4).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aKind', new THREE.InstancedBufferAttribute(this.knd, 1).setUsage(THREE.DynamicDrawUsage));
    geo.instanceCount = 0;
    const mat = new THREE.ShaderMaterial({ vertexShader: CARD_VERT, fragmentShader: frag, uniforms, transparent: true, depthWrite: false, blending: dark ? THREE.NormalBlending : THREE.AdditiveBlending, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.frustumCulled = false;
    // the black flames draw first, the bright ones over them
    this.mesh.renderOrder = dark ? 5 : 6;
    scene.add(this.mesh);
  }

  add(c: Card): void {
    if (this.cards.length >= this.max) this.cards.shift();
    this.cards.push(c);
  }

  update(dt: number): void {
    for (const c of this.cards) {
      c.age += dt;
      c.y += c.vy * dt;
    }
    this.cards = this.cards.filter((c) => c.age < c.life);
  }

  render(): void {
    let i = 0;
    for (const c of this.cards) {
      const k = c.age / c.life;
      const s = Math.min(1, c.age / 0.1) * (k > 0.65 ? 1 - (k - 0.65) / 0.35 : 1);
      this.pos[i * 3] = c.x; this.pos[i * 3 + 1] = c.y; this.pos[i * 3 + 2] = c.z;
      this.prm[i * 4] = c.w * (0.6 + 0.4 * s); this.prm[i * 4 + 1] = c.h * s; this.prm[i * 4 + 2] = c.ph; this.prm[i * 4 + 3] = c.int * s;
      this.knd[i] = c.kind;
      i++;
    }
    const geo = this.mesh.geometry as THREE.InstancedBufferGeometry;
    geo.instanceCount = i;
    (geo.attributes.aPos as THREE.InstancedBufferAttribute).needsUpdate = true;
    (geo.attributes.aParam as THREE.InstancedBufferAttribute).needsUpdate = true;
    (geo.attributes.aKind as THREE.InstancedBufferAttribute).needsUpdate = true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

export type FlameKind = 'crimson' | 'violet' | 'gold' | 'black' | 'blackRed';

/** Hellfire: world-space flame cards. One pool per game, shared by every technique of his. */
export class HellfirePool implements Projectile {
  done = false;
  private uniforms = { uTime: { value: 0 } };
  private bright: CardSet;
  private dark: CardSet;

  constructor(g: Game) {
    this.bright = new CardSet(g.engine.gr.scene, this.uniforms, BRIGHT_FRAG, false, 1400);
    this.dark = new CardSet(g.engine.gr.scene, this.uniforms, DARK_FRAG, true, 900);
  }

  /** the shared pool (made on first use) */
  static of(g: Game): HellfirePool {
    const d = g as unknown as { hellfirePool?: HellfirePool };
    if (!d.hellfirePool || d.hellfirePool.done) {
      d.hellfirePool = new HellfirePool(g);
      g.addProjectile(d.hellfirePool);
    }
    return d.hellfirePool;
  }

  spawn(kind: FlameKind, x: number, y: number, z: number, w: number, h: number, life: number, int = 1, vy = 0): void {
    const c: Card = { x, y, z, w, h, life, age: 0, int, ph: Math.random(), vy, kind: 0 };
    if (kind === 'black' || kind === 'blackRed') {
      c.kind = kind === 'black' ? 1 : 0;
      this.dark.add(c);
    } else {
      c.kind = kind === 'crimson' ? 0 : kind === 'violet' ? 1 : 2;
      this.bright.add(c);
    }
  }

  update(dt: number): void {
    this.bright.update(dt);
    this.dark.update(dt);
  }

  render(_dt: number, time: number): void {
    this.uniforms.uTime.value = time;
    this.bright.render();
    this.dark.render();
  }

  dispose(): void {
    this.bright.dispose();
    this.dark.dispose();
  }
}

/** pick a hellfire look: mostly black at the heart (k near 0), violet and crimson toward the edge */
function pickKind(k: number): FlameKind {
  const r = Math.random();
  if (k < 0.5) return r < 0.5 ? 'black' : r < 0.78 ? 'violet' : 'crimson';
  return r < 0.25 ? 'black' : r < 0.6 ? 'violet' : 'crimson';
}

/** Hellfire on the ground at p: black flames at the heart, violet and crimson round them; the world there burns. */
export function hellfireAt(g: Game, p: THREE.Vector3, r: number, int = 1, life = 1.4, burn = true): void {
  const pool = HellfirePool.of(g);
  const gy = groundAt(g, p.x, p.y + 1, p.z, 5) ?? p.y;
  const n = Math.max(2, Math.round(r * r * 1.6 * int));
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, k = Math.sqrt(Math.random()), rr = k * r;
    pool.spawn(pickKind(k), p.x + Math.cos(a) * rr, gy, p.z + Math.sin(a) * rr, 0.5 + Math.random() * 0.7 * int, 1 + Math.random() * 1.5 * int, life * (0.6 + Math.random() * 0.6), int);
  }
  if (burn) g.engine.destruction.carve(new SphereShape(new THREE.Vector3(p.x, gy, p.z), r, 0.5), { mode: 'burn', power: 300 * int, dust: 0.1 });
  if (Math.random() < 0.5) blackSmoke(g, new THREE.Vector3(p.x, gy + 1, p.z), 2, r * 0.5, 1.4);
  hellEmbers(g, new THREE.Vector3(p.x, gy + 0.3, p.z), 3, 4);
}

/** flames licking up a burning body */
export function bodyFire(g: Game, f: Fighter, n: number, black: boolean): void {
  const pool = HellfirePool.of(g);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, r = f.def.radius * (0.4 + Math.random() * 0.7);
    const kind: FlameKind = black ? (Math.random() < 0.6 ? 'black' : 'violet') : Math.random() < 0.6 ? 'crimson' : 'violet';
    pool.spawn(kind, f.pos.x + Math.cos(a) * r, f.pos.y + Math.random() * f.def.height * 0.8, f.pos.z + Math.sin(a) * r, 0.3 + Math.random() * 0.25, 0.5 + Math.random() * 0.6, 0.45 + Math.random() * 0.3, 1, 0.8);
  }
}

/** sparks of crimson and violet thrown out of a fire */
export function hellEmbers(g: Game, at: THREE.Vector3, n: number, speed = 3): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, up = Math.random();
    const c = Math.random() < 0.55 ? RGB.crimson : RGB.violet;
    g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, vx: Math.cos(a) * speed * (1 - up * 0.5), vy: up * speed + 1, vz: Math.sin(a) * speed * (1 - up * 0.5), size: 0.08, sizeEnd: 0.02, life: 0.4 + Math.random() * 0.4, r: c[0], g: c[1], b: c[2], alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2.5, drag: 2.5, gravity: -1.5 });
  }
}

/** a burst of hellfire light: a violet-crimson flash, a ring, a puff of black smoke */
export function hellFlash(g: Game, at: THREE.Vector3, size: number): void {
  const glow = g.engine.glow;
  glow.spawn({ x: at.x, y: at.y, z: at.z, size: size * 0.6, sizeEnd: size * 2.4, life: 0.3, r: 1, g: 0.25, b: 0.4, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  glow.spawn({ x: at.x, y: at.y, z: at.z, size: size * 0.4, sizeEnd: size * 3.2, life: 0.4, r: 0.6, g: 0.2, b: 1, alpha: 0.8, alphaEnd: 0, tex: TEX_RING });
  blackSmoke(g, at, Math.round(6 * size), size * 0.6, size * 1.4);
  hellEmbers(g, at, Math.round(10 * size), 5 * size);
}

// ------------------------------------------------------------------------------------------------ orbs

const ORB_FRAG = /* glsl */ `
uniform float uTime; uniform vec3 uCore; uniform vec3 uBody; uniform vec3 uRim; uniform float uA;
varying vec3 vN; varying vec3 vW; varying vec3 vP;
${NOISE}
void main() {
  vec3 v = normalize(cameraPosition - vW);
  float f = abs(dot(normalize(vN), v));
  float n = fNoise(vP * 3.0 + vec3(0.0, -uTime * 4.0, uTime));
  vec3 col = mix(uRim, uBody, smoothstep(0.1, 0.7, f + (n - 0.5) * 0.5));
  col = mix(col, uCore, pow(f, 4.0));
  gl_FragColor = vec4(col * 2.0, uA * (0.35 + f * 0.75) * (0.7 + n * 0.5));
}`;
const ORB_VERT = /* glsl */ `varying vec3 vN; varying vec3 vW; varying vec3 vP;
void main() { vP = position; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`;

let orbGeo: THREE.IcosahedronGeometry | null = null;

export interface HellOrbOpts {
  kind: 'crimson' | 'violet';
  radius: number;
  speed: number;
  damage: number;
  /** blast radius (m) and its carve power */
  blast: number;
  power: number;
  /** turn rate toward the target (rad/s) */
  homing?: number;
  range?: number;
  /** a black core over the fire */
  black?: boolean;
  /** Onibi: circle the owner this long (s) before hunting, at this angle round him */
  orbit?: { t: number; a: number };
  onHit?: (o: Fighter) => void;
}

/** A ball of hellfire: it flies (homing a little), bursts on the first thing it meets and sets it alight. */
export class HellOrb implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.Mesh;
  private dark: THREE.Mesh | null = null;
  private u: Record<string, THREE.IUniform>;
  readonly pos: THREE.Vector3;
  readonly vel: THREE.Vector3;
  private travelled = 0;
  private trailT = 0;

  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, dir: THREE.Vector3, readonly target: Fighter | null, readonly o: HellOrbOpts) {
    this.pos = from.clone();
    this.vel = dir.clone().normalize().multiplyScalar(o.speed);
    const violet = o.kind === 'violet';
    this.u = {
      uTime: { value: 0 }, uA: { value: 1 },
      uCore: { value: new THREE.Color(violet ? '#FBE8FF' : '#FFE6DC') },
      uBody: { value: new THREE.Color(violet ? '#B23CFF' : '#FF3346') },
      uRim: { value: new THREE.Color(violet ? '#4A0C90' : '#8A0A1E') },
    };
    const mat = new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: ORB_VERT, fragmentShader: ORB_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    this.mesh = new THREE.Mesh((orbGeo ??= new THREE.IcosahedronGeometry(1, 2)), mat);
    this.mesh.scale.setScalar(o.radius);
    this.mesh.renderOrder = 7;
    this.mesh.frustumCulled = false;
    g.engine.gr.scene.add(this.mesh);
    if (o.black) {
      this.dark = new THREE.Mesh(orbGeo, new THREE.MeshBasicMaterial({ color: HELL_BLACK, transparent: true, opacity: 0.85, depthWrite: false }));
      this.dark.scale.setScalar(o.radius * 0.62);
      this.dark.renderOrder = 8;
      g.engine.gr.scene.add(this.dark);
    }
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const o = this.o;
    const tg = this.target && !this.target.dead ? this.target : null;
    if (o.orbit && this.t < o.orbit.t) {
      // circling over his shoulders, waiting for its turn
      const a = o.orbit.a + this.t * 3.2;
      const c = this.owner.center();
      this.pos.set(c.x + Math.cos(a) * 1.3, c.y + 0.9 + Math.sin(this.t * 5 + o.orbit.a) * 0.15, c.z + Math.sin(a) * 1.3);
      if (tg) this.vel.subVectors(tg.center(), this.pos).normalize().multiplyScalar(o.speed);
      return;
    }
    if (tg && o.homing) {
      const want = _v.subVectors(tg.center(), this.pos).normalize();
      const cur = _w.copy(this.vel).normalize();
      const ang = cur.angleTo(want);
      if (ang > 1e-3) {
        const k = Math.min(1, (o.homing * dt) / ang);
        cur.lerp(want, k).normalize();
        this.vel.copy(cur).multiplyScalar(o.speed);
      }
    }
    const step = this.vel.length() * dt;
    this.pos.addScaledVector(this.vel, dt);
    this.travelled += step;
    // someone in the way
    for (const e of g.enemiesOf(this.owner)) {
      const c = e.center();
      if (Math.hypot(c.x - this.pos.x, c.z - this.pos.z) < e.def.radius + o.radius && this.pos.y > e.pos.y - 0.2 && this.pos.y < e.pos.y + e.def.height + o.radius) return this.burst(g);
    }
    // the world
    const w = g.engine.world, vs = w.vs;
    if (w.isSolid(Math.floor(this.pos.x / vs), Math.floor(this.pos.y / vs), Math.floor(this.pos.z / vs))) return this.burst(g);
    if (this.travelled > (o.range ?? 70)) this.burst(g);
    this.trailT -= dt;
    if (this.trailT <= 0) {
      this.trailT = 0.03;
      const c = o.kind === 'violet' ? RGB.violet : RGB.crimson;
      g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, vx: (Math.random() - 0.5), vy: 0.6, vz: (Math.random() - 0.5), size: o.radius * 1.2, sizeEnd: 0.05, life: 0.3, r: c[0], g: c[1], b: c[2], alpha: 0.7, alphaEnd: 0, tex: TEX_GLOW });
      if (o.black) blackSmoke(g, this.pos, 1, o.radius * 0.4, o.radius);
    }
  }

  private burst(g: Game): void {
    if (this.done) return;
    this.done = true;
    const o = this.o, p = this.pos;
    g.engine.destruction.carve(new SphereShape(p.clone(), o.blast, 0.8), { mode: 'explode', power: o.power, impulse: 8 + o.blast * 2 });
    for (const e of g.enemiesOf(this.owner)) {
      const d = e.center().distanceTo(p);
      if (d > o.blast + e.def.radius + 0.4) continue;
      const dir = _v.subVectors(e.pos, p).setY(0);
      if (dir.lengthSq() < 1e-4) this.owner.forward(dir);
      g.damage(e, o.damage, this.owner, dir.normalize().clone(), { energy: true, knock: 6 + o.blast * 2, launch: 3 + o.blast, heavy: o.blast > 1.6, hitstop: 0.06, shake: 0.3, color: o.kind === 'violet' ? HELL_VIOLET : HELL_CRIMSON });
      o.onHit?.(e);
    }
    hellfireAt(g, p, Math.max(0.8, o.blast * 0.7), 1.2, 1.2);
    hellFlash(g, p, Math.max(0.6, o.blast * 0.5));
    g.sfx.play('explode', p, Math.min(1.6, 0.5 + o.blast * 0.3));
  }

  reject(at: THREE.Vector3, radius: number, by: Fighter): boolean {
    if (by.team === this.owner.team || this.pos.distanceTo(at) > radius + this.o.radius) return false;
    this.done = true;
    hellEmbers(this.g, this.pos, 8, 3);
    return true;
  }

  render(_dt: number, time: number): void {
    this.u.uTime.value = time;
    const flick = 1 + Math.sin(time * 31 + this.o.radius) * 0.06;
    this.mesh.position.copy(this.pos);
    this.mesh.scale.setScalar(this.o.radius * flick);
    if (this.dark) this.dark.position.copy(this.pos);
  }

  dispose(): void {
    this.mesh.removeFromParent();
    (this.mesh.material as THREE.Material).dispose();
    if (this.dark) {
      this.dark.removeFromParent();
      (this.dark.material as THREE.Material).dispose();
    }
  }
}

// ------------------------------------------------------------------------------------------------ the models

const models = new Map<string, VoxelModel>();
function cached(key: string, make: () => VoxelModel): VoxelModel {
  let m = models.get(key);
  if (!m) models.set(key, (m = make()));
  return m;
}

/** hexagonal section (apothem r) */
function hexD(x: number, z: number): number {
  const a = Math.atan2(z, x), k = Math.PI / 3;
  return Math.hypot(x, z) * Math.cos((((a % k) + k) % k) - k / 2);
}

/** Gochūtekkan's pillar (12 vox/m): black iron, 5.2 m, hexagonal, gold bands, a burning seal down each face */
function pillarModel(): VoxelModel {
  const b = new ModelBuilder('gochu-pillar', 12);
  b.mat('iron', ['#4A4650', '#3A3640', '#2C2932', '#211F26', '#18171C'], { base: 1, rough: 0.5, metal: 0.6, shadeK: 0.85 });
  b.mat('gold', ['#F0D27E', '#D9B256', '#B58E3A', '#8C6B26'], { base: 1, rough: 0.3, metal: 0.9 });
  b.mat('rune', ['#FF3A50'], { glow: 1.4 });
  b.bone('root', null, [0, 0, 0]);
  const r0 = 5.2;
  b.add('root', fn((x, y, z) => {
    const r = y < 56 ? r0 : r0 * Math.max(0, 1 - (y - 56) / 6.5);
    return Math.max(hexD(x, z) - r, -y, y - 62.5);
  }, [-7, -1, -7], [7, 64, 7]), 'iron');
  b.paint('root', aabb([-8, 50, -8], [8, 53, 8]), 'gold', { where: b.isMat('iron') });
  b.paint('root', aabb([-8, 3, -8], [8, 6, 8]), 'gold', { where: b.isMat('iron') });
  b.paint('root', fn((x, y, z) => {
    const a = Math.atan2(z, x), k = Math.PI / 3;
    const sec = (((a % k) + k) % k) - k / 2;
    return Math.abs(sec) < 0.1 && y > 13 && y < 47 && ((y % 6) + 6) % 6 < 4.2 ? -1 : 1;
  }, [-8, 12, -8], [8, 48, 8]), 'rune', { where: b.isMat('iron') });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * Gyokuza's throne (24 vox/m; origin on the floor under the seat's front, +Z the way it faces): black lacquer edged in
 * gold, a crimson cushion, armrests ending in gold demon heads, a tall back crowned with flame spikes and the burning
 * chrysanthemum in gold.
 */
function throneModel(): VoxelModel {
  const b = new ModelBuilder('hajun-throne', 24);
  b.mat('lacquer', ['#3E363C', '#2E282D', '#231E22', '#1A1619', '#151216'], { base: 1, rough: 0.25, metal: 0.2, shadeK: 0.85 });
  b.mat('gold', ['#F3DA8C', '#E2BE5E', '#C49C3E', '#9C772A', '#76581E'], { base: 1, rough: 0.28, metal: 0.9, shadeK: 0.8 });
  b.mat('velvet', ['#B0243A', '#8E1C2F', '#6E1524', '#521019'], { base: 1, rough: 0.9 });
  b.mat('fire', ['#FF3B50'], { glow: 1.6 });
  b.mat('fireV', ['#B444FF'], { glow: 1.8 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', box([0, 1, -5], [15, 1, 13], { round: 0.5 }), 'lacquer');
  b.paint('root', subtract(box([0, 1, -5], [15.5, 1.5, 13.5]), box([0, 1, -5], [14, 3, 12])), 'gold', { where: b.isMat('lacquer') });
  // the seat and its cushion
  b.add('root', box([0, 6, -5], [9.5, 4.5, 8], { round: 1 }), 'lacquer');
  b.add('root', box([0, 11, -5], [8.6, 1.3, 7.2], { round: 1 }), 'velvet');
  b.paint('root', box([0, 9.6, 3.2], [9.6, 0.6, 0.6]), 'gold', { where: b.isMat('lacquer') });
  // the armrests: on blocks at each side, gold demon heads at their fronts
  for (const k of [-1, 1]) {
    b.add('root', box([k * 11.2, 8, -5], [1.8, 7.5, 7.5], { round: 0.6 }), 'lacquer');
    b.add('root', box([k * 11.2, 16, -5], [2.3, 1.2, 8.4], { round: 0.6 }), 'lacquer');
    b.paint('root', box([k * 11.2, 16.6, -5], [2.6, 0.6, 8.8]), 'gold', { where: b.isMat('lacquer') });
    b.add('root', sphere([k * 11.2, 16.4, 4.2], 2.3), 'gold');
    b.add('root', spike([k * 12.2, 17.8, 4.2], [k * 0.6, 1, 0.2], 2.8, 0.8, 0.6, { tip: 0.5 }), 'gold', { thr: 0.25 });
    b.voxel('root', k * 1 + k * 10, 17, 6, 'fire', 0);
  }
  // the back: tall, edged in gold, crowned with flames
  b.add('root', box([0, 36, -14.5], [10.5, 26, 2.2], { round: 1 }), 'lacquer');
  b.paint('root', subtract(box([0, 36, -12.4], [11, 26.5, 0.8]), box([0, 36, -12.4], [9, 24.5, 2])), 'gold', { where: b.isMat('lacquer') });
  for (let i = -3; i <= 3; i++) {
    const h = 9 - Math.abs(i) * 1.6;
    const base: V3 = [i * 3, 61, -14.5];
    b.add('root', spike(base, [i * 0.08, 1, 0], h, 1.6, 1.2, { tip: 0.55 }), 'lacquer', { thr: 0.25 });
    b.paint('root', sphere([base[0] + i * 0.08 * h, base[1] + h * 0.9, base[2]], 1.8), i % 2 ? 'fireV' : 'fire', { where: b.isMat('lacquer') });
  }
  // the crest on the back's front face
  b.stamp('root', -8, 52, chrysanthemum(), { X: { mat: 'gold', proud: 1 } });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** a burning demon head of the parade (16 vox/m, ~1.6 m), facing +Z: 0 an oni, 1 a skull, 2 a hannya */
function demonHeadModel(kind: number): VoxelModel {
  const b = new ModelBuilder(`hyakki-${kind}`, 16);
  b.mat('skin', kind === 0 ? ['#7A2030', '#5E1826', '#46121C', '#330D15'] : kind === 1 ? ['#E6DED0', '#C8BEAD', '#A39885', '#7C725F'] : ['#ECE4DA', '#D4C8BA', '#B0A291', '#8A7C6B'], { base: 1, rough: 0.6, shadeK: 0.85 });
  b.mat('dark', ['#2A2026', '#1E161B', '#151216'], { base: 1, rough: 0.8 });
  b.mat('horn', ['#3E3638', '#2E282A', '#1E1A1C'], { base: 1, rough: 0.4 });
  b.mat('tooth', ['#F0ECE2', '#D8D2C4']);
  b.mat('eye', [kind === 1 ? '#B444FF' : kind === 2 ? '#FFC23A' : '#FF3B50'], { glow: 2.2 });
  b.mat('flame', [kind === 1 ? '#B444FF' : '#FF3B50'], { glow: 1.6 });
  b.bone('root', null, [0, 0, 0]);
  // the head: a broad skull, a heavy jaw
  b.add('root', blend(2, ellipsoid([0, 14, 0], [8.5, 9, 8]), ellipsoid([0, 7, 2.5], [7, 5.5, 6])), 'skin');
  // the brow ridge and the eyes
  b.add('root', box([0, 16.5, 7], [7.5, 1.4, 1.5], { rot: [10, 0, 0], round: 0.6 }), kind === 1 ? 'skin' : 'dark');
  for (const k of [-1, 1]) {
    b.carve('root', ellipsoid([k * 3.4, 13.6, 7.5], [2.2, 1.8, 2.4]));
    b.add('root', ellipsoid([k * 3.4, 13.6, 6.2], [1.5, 1.2, 1.2]), 'eye');
  }
  // the mouth: a wide dark maw with fangs
  b.carve('root', box([0, 6.5, 8], [5.5, 2, 3], { round: 0.8 }));
  b.add('root', box([0, 6.5, 6.4], [5.4, 1.9, 0.8]), 'dark');
  for (let i = -2; i <= 2; i++) {
    b.add('root', spike([i * 2.2, 8.4, 7.6], [0, -1, 0.1], i === -2 || i === 2 ? 3.4 : 2, 0.9, 0.7, { tip: 0.5 }), 'tooth', { thr: 0.25 });
    b.add('root', spike([i * 2.2 + 1, 4.6, 7.4], [0, 1, 0.1], 1.6, 0.8, 0.6, { tip: 0.5 }), 'tooth', { thr: 0.25 });
  }
  // horns (none on the skull), long for the hannya
  if (kind !== 1)
    for (const k of [-1, 1]) {
      const len = kind === 2 ? 11 : 7;
      b.add('root', spike([k * 4.6, 20, 1], [k * (kind === 2 ? 0.25 : 0.55), 1, kind === 2 ? -0.5 : -0.1], len, 2, 1.4, { tip: 0.55, bend: [0, 0, kind === 2 ? -0.3 : 0] }), 'horn', { thr: 0.25 });
    }
  // a mane of fire behind it
  for (let i = 0; i < 5; i++) {
    const a = -1 + i * 0.5;
    b.add('root', spike([Math.sin(a) * 5, 16, -5], [Math.sin(a) * 0.6, 0.7, -1], 7 + (i % 2) * 2, 2.2, 1.4, { tip: 0.6 }), 'flame', { thr: 0.25 });
  }
  b.autoShade({ up: 0.4, open: 2, front: 0.2 });
  b.lint();
  return b.build();
}

/** a burning rock from the sky (8 vox/m, ~2 m): black basalt split by glowing cracks */
function rockModel(): VoxelModel {
  const b = new ModelBuilder('hell-rock', 8);
  b.mat('rock', ['#3C3236', '#2E2629', '#221C1F', '#191517'], { base: 1, rough: 0.9, shadeK: 0.85 });
  b.mat('crack', ['#FF4438'], { glow: 2.2 });
  b.mat('crackV', ['#B444FF'], { glow: 2.2 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', blend(2.2, ellipsoid([0, 0, 0], [7, 6, 6.5]), ellipsoid([3, 2, -1], [4, 4, 4]), ellipsoid([-3, -2, 2], [4, 3.6, 4])), 'rock');
  b.paint('root', fn((x, y, z) => Math.min(Math.abs(Math.sin(x * 0.9 + y * 0.4 + Math.sin(z * 0.7) * 1.3)), Math.abs(Math.sin(y * 0.8 - z * 0.7 + Math.sin(x * 0.5)))) - 0.16, [-9, -9, -9], [9, 9, 9]), 'crack', { where: b.isMat('rock') });
  b.paint('root', sphere([0, -5, 0], 4), 'crackV', { where: b.isMat('crack') });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** the gate's frame (8 vox/m, origin on the ground at the middle of the opening, +Z its face): two pillars, a lintel
 *  with a great horned skull, horns curling up at the corners, small skulls down the pillars, gold rings */
function gateFrameModel(): VoxelModel {
  const b = new ModelBuilder('hell-gate-frame', 8);
  b.mat('stone', ['#4A3E44', '#3A3036', '#2C2429', '#211B1F', '#18141A'], { base: 1, rough: 0.8, shadeK: 0.85 });
  b.mat('bone', ['#D8D0C2', '#BBB09E', '#988C79', '#746A58'], { base: 1, rough: 0.7 });
  b.mat('gold', ['#E8C060', '#C89C3E', '#9C772A', '#76581E'], { base: 1, rough: 0.3, metal: 0.9 });
  b.mat('eye', ['#FF3048'], { glow: 2.4 });
  b.bone('root', null, [0, 0, 0]);
  const W = 28; // half the outer width (vox): 7 m wide
  for (const k of [-1, 1]) {
    b.add('root', box([k * (W - 5), 36, 0], [5, 36, 5], { round: 0.6 }), 'stone');
    b.add('root', box([k * (W - 5), 1.5, 0], [6.5, 1.5, 6.5], { round: 0.4 }), 'stone');
    for (const y of [10, 40, 66]) b.paint('root', box([k * (W - 5), y, 0], [5.6, 0.8, 5.6]), 'gold', { where: b.isMat('stone') });
    // small skulls down the pillar's face
    for (const y of [22, 52]) {
      b.add('root', ellipsoid([k * (W - 5), y, 5.4], [2.4, 2.6, 1.6]), 'bone');
      b.voxel('root', k * (W - 5) - 1, y, 6, 'eye', 0);
      b.voxel('root', k * (W - 5) + 1, y, 6, 'eye', 0);
    }
    // horns curling up from the lintel's ends
    b.add('root', spike([k * (W - 3), 78, 0], [k * 0.7, 1, 0], 13, 2.6, 1.8, { tip: 0.6, bend: [k * -0.5, 0.2, 0] }), 'bone', { thr: 0.25 });
  }
  b.add('root', box([0, 76, 0], [W + 1, 5, 6], { round: 0.8 }), 'stone');
  b.paint('root', box([0, 71.5, 0], [W + 1.5, 0.8, 6.5]), 'gold', { where: b.isMat('stone') });
  // the great skull on the lintel, horned, its eyes burning
  b.add('root', blend(1.5, ellipsoid([0, 79, 5], [7, 6.5, 4]), ellipsoid([0, 74.5, 6], [4.5, 3, 3])), 'bone');
  for (const k of [-1, 1]) {
    b.carve('root', ellipsoid([k * 2.6, 79.5, 8.5], [1.8, 1.6, 2]));
    b.add('root', ellipsoid([k * 2.6, 79.5, 7.4], [1.2, 1, 1]), 'eye');
    b.add('root', spike([k * 5, 84, 4], [k * 0.8, 1, 0.2], 9, 1.8, 1.2, { tip: 0.55, bend: [0, 0.2, 0.3] }), 'bone', { thr: 0.25 });
  }
  for (let i = -2; i <= 2; i++) b.add('root', box([i * 1.4, 73, 8.6], [0.5, 1.2, 0.5]), 'bone');
  b.autoShade({ up: 0.4, open: 2, front: 0.2 });
  b.lint();
  return b.build();
}

/** one of the gate's doors (8 vox/m): origin at its hinge, the door reaching toward +X (the right door is mirrored);
 *  iron bands with rivets, a raised border, one half of a skull relief with a burning eye, a gold ring */
function gateDoorModel(right: boolean): VoxelModel {
  const b = new ModelBuilder(right ? 'hell-gate-door-r' : 'hell-gate-door-l', 8);
  b.mat('iron', ['#3E3840', '#2F2A31', '#231F25', '#1A171C', '#141216'], { base: 1, rough: 0.55, metal: 0.5, shadeK: 0.85 });
  b.mat('bone', ['#D8D0C2', '#BBB09E', '#988C79', '#746A58'], { base: 1, rough: 0.7 });
  b.mat('gold', ['#E8C060', '#C89C3E', '#9C772A', '#76581E'], { base: 1, rough: 0.3, metal: 0.9 });
  b.mat('eye', ['#FF3048'], { glow: 2.4 });
  b.bone('root', null, [0, 0, 0]);
  const s = right ? -1 : 1;
  const Wd = 18; // door width (vox): 2.25 m … the opening is 4.5 m between the pillars
  const H = 62;
  b.add('root', aabb(right ? [-Wd, 0, -1] : [0, 0, -1], right ? [0, H, 1] : [Wd, H, 1]), 'iron');
  // the raised border and the bands
  b.add('root', subtract(aabb(right ? [-Wd, 0, 1] : [0, 0, 1], right ? [0, H, 2] : [Wd, H, 2]), aabb(right ? [-Wd + 2, 2, 0] : [2, 2, 0], right ? [-2, H - 2, 3] : [Wd - 2, H - 2, 3])), 'iron');
  for (const y of [12, 30, 48]) {
    b.add('root', aabb(right ? [-Wd, y, 1] : [0, y, 1], right ? [0, y + 2, 2] : [Wd, y + 2, 2]), 'iron');
    for (let x = 2; x < Wd; x += 4) b.add('root', aabb([s * x - 0.5, y + 0.5, 2], [s * x + 0.5, y + 1.5, 3]), 'gold');
  }
  // half of the skull: it meets the other door's half at the seam (x = ±Wd)
  const cx = s * Wd;
  b.add('root', subtract(ellipsoid([cx, 40, 2], [7, 8, 2]), aabb(right ? [cx - 10, 20, -4] : [cx, 20, -4], right ? [cx, 60, 6] : [cx + 10, 60, 6])), 'bone');
  b.carve('root', ellipsoid([cx - s * 3, 41, 3.6], [1.8, 1.6, 1.4]));
  b.add('root', ellipsoid([cx - s * 3, 41, 2.6], [1.2, 1, 0.8]), 'eye');
  b.add('root', aabb(right ? [cx - 4, 31, 2] : [cx, 31, 2], right ? [cx, 33, 4] : [cx + 4, 33, 4]), 'bone');
  // the ring
  b.add('root', torus([cx - s * 5, 22, 2.4], 2.2, 0.55), 'gold');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** the blade that comes out of the Gates (8 vox/m, origin at the hilt, +Z along it): a crude, jagged cleaver */
function hellBladeModel(): VoxelModel {
  const b = new ModelBuilder('hell-blade', 8);
  b.mat('iron', ['#4A4448', '#38333A', '#29252B', '#1C191E'], { base: 1, rough: 0.35, metal: 0.7, shadeK: 0.8 });
  b.mat('edge', ['#FF3B4E'], { glow: 1.8 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', fn((x, y, z) => {
    if (z < 0 || z > 52) return 1;
    const w = 4.2 - z * 0.03 + (Math.floor(z / 5) % 2) * 0.8;
    return Math.max(Math.abs(x) - 0.8, Math.abs(y) - w, -z, z + Math.abs(y) * 0.6 - 52);
  }, [-2, -6, -1], [2, 6, 53]), 'iron');
  b.paint('root', fn((_x, y) => -y - 3.2, [-2, -6, 0], [2, -2, 53]), 'edge', { where: b.isMat('iron') });
  b.add('root', capsule([0, 0, -10], [0, 0, 0], 1.2), 'iron');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** build every model up front (a fight should never wait on a mesh) */
export function warmHajun(): void {
  cached('pillar', pillarModel);
  cached('throne', throneModel);
  for (let k = 0; k < 3; k++) cached(`head${k}`, () => demonHeadModel(k));
  cached('rock', rockModel);
  cached('frame', gateFrameModel);
  cached('doorL', () => gateDoorModel(false));
  cached('doorR', () => gateDoorModel(true));
  cached('blade', hellBladeModel);
}

/** test hook: every model of the module, built */
export function hajunModels(): VoxelModel[] {
  warmHajun();
  return [...models.values()];
}

function mesh(g: Game, key: string, make: () => VoxelModel, scale = 1): PropMesh {
  const m = new PropMesh(cached(key, make));
  m.scale.setScalar(scale);
  g.engine.gr.scene.add(m);
  return m;
}

function dropMesh(m: PropMesh): void {
  m.removeFromParent();
  m.material.dispose();
}

// ------------------------------------------------------------------------------------------------ Gochūtekkan

/** Bakudō #75 Gochūtekkan: five iron pillars fall round the target, leaning in, and pin it to the ground. */
export class IronPillars implements Projectile {
  done = false;
  private t = 0;
  private pillars: { m: PropMesh; foot: THREE.Vector3; lean: THREE.Quaternion }[] = [];
  private landed = false;
  private readonly fall = 0.42;
  readonly center: THREE.Vector3;

  constructor(private g: Game, readonly owner: Fighter, readonly target: Fighter, readonly o: { dur: number; damage: number; onPin?: (t: Fighter) => void }) {
    const c = target.pos.clone();
    c.y = groundAt(g, c.x, c.y + 1, c.z, 8) ?? c.y;
    this.center = c;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3;
      const r = target.def.radius + 0.75;
      const foot = new THREE.Vector3(c.x + Math.cos(a) * r, c.y, c.z + Math.sin(a) * r);
      foot.y = (groundAt(g, foot.x, c.y + 1.5, foot.z, 4) ?? c.y) - 0.6;
      // leaning in over the target
      const axis = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a));
      const lean = new THREE.Quaternion().setFromAxisAngle(axis, -0.26);
      const m = mesh(g, 'pillar', pillarModel);
      m.quaternion.copy(lean);
      m.visible = false;
      this.pillars.push({ m, foot, lean });
    }
    g.sfx.play('charge', c, 0.8);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const tg = this.target;
    if (!this.landed && this.t >= this.fall) {
      this.landed = true;
      for (const p of this.pillars) {
        g.engine.destruction.carve(new SphereShape(p.foot.clone().setY(p.foot.y + 0.6), 1, 0.6), { mode: 'smash', power: 600, impulse: 8 });
        hellEmbers(g, p.foot.clone().setY(p.foot.y + 0.8), 4, 4);
      }
      g.addRing(this.center.clone().setY(this.center.y + 0.1), 6, HELL_CRIMSON, 0.4);
      g.sfx.play('impact', this.center, 1.6);
      g.shake(0.4);
      if (!tg.dead) {
        g.damage(tg, this.o.damage, this.owner, new THREE.Vector3(0, -1, 0), { knock: 0, heavy: true, hitstop: 0.12, shake: 0.5, unblockable: true, color: HELL_CRIMSON });
        this.o.onPin?.(tg);
      }
    }
    if (this.landed && this.t < this.fall + this.o.dur && !tg.dead) {
      // held fast between them
      tg.body.pos.x = this.center.x;
      tg.body.pos.z = this.center.z;
      tg.body.vel.set(0, Math.min(0, tg.body.vel.y), 0);
      tg.push.set(0, 0, 0);
      tg.hitstun = Math.max(tg.hitstun, 0.2);
      tg.rooted = true;
    }
    if (this.t >= this.fall + this.o.dur && this.t - dt < this.fall + this.o.dur) {
      tg.rooted = false;
      for (const p of this.pillars) blackSmoke(g, p.foot.clone().setY(p.foot.y + 1), 4, 0.6, 1.4);
    }
    if (this.t > this.fall + this.o.dur + 0.6) this.done = true;
  }

  render(): void {
    const t = this.t;
    for (const p of this.pillars) {
      p.m.visible = true;
      // dropped from high above, then (at the end) sinking back into the ground
      const drop = t < this.fall ? (1 - t / this.fall) ** 2 * 30 : 0;
      const sink = Math.max(0, t - (this.fall + this.o.dur)) / 0.6;
      p.m.position.copy(p.foot);
      p.m.position.y += drop - sink * 5.4;
    }
  }

  dispose(): void {
    if (this.target.rooted && this.landed) this.target.rooted = false;
    for (const p of this.pillars) dropMesh(p.m);
  }
}

// ------------------------------------------------------------------------------------------------ Gyokuza

/** Gyokuza's throne: it rises out of the ground behind him, stays while he sits, and sinks back. */
export class Throne implements Projectile {
  done = false;
  private t = 0;
  private m: PropMesh;
  private readonly at: THREE.Vector3;

  constructor(private g: Game, readonly owner: Fighter, readonly life: number) {
    const fw = owner.forward(new THREE.Vector3());
    this.at = owner.pos.clone();
    this.at.y = groundAt(g, this.at.x, this.at.y + 1, this.at.z, 6) ?? this.at.y;
    this.m = mesh(g, 'throne', throneModel);
    this.m.rotation.y = Math.atan2(fw.x, fw.z);
    this.m.position.copy(this.at).setY(this.at.y - 3);
    g.sfx.play('impact', this.at, 1);
    hellfireAt(g, this.at.clone().addScaledVector(fw, -0.4), 1.6, 1.2, 1.2, false);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (Math.random() < dt * 8) {
      const p = this.m.position;
      HellfirePool.of(g).spawn(Math.random() < 0.5 ? 'black' : 'violet', p.x + (Math.random() - 0.5) * 1.6, this.at.y, p.z + (Math.random() - 0.5) * 1.6, 0.6, 1.2, 0.8);
    }
    if (this.t > this.life + 0.6) this.done = true;
  }

  render(): void {
    const rise = Math.min(1, this.t / 0.35);
    const sink = Math.max(0, this.t - this.life) / 0.6;
    this.m.position.y = this.at.y - 3 * (1 - rise) - 3 * sink;
  }

  dispose(): void {
    dropMesh(this.m);
  }
}

// ------------------------------------------------------------------------------------------------ Kensaku

const ROPE_FRAG = /* glsl */ `
uniform float uTime; uniform float uA;
varying vec2 vUv;
${NOISE}
void main() {
  float n = fNoise(vec3(vUv.x * 40.0 - uTime * 9.0, vUv.y * 4.0, uTime));
  float e = 1.0 - abs(vUv.y - 0.5) * 2.0;
  vec3 col = mix(vec3(0.6, 0.02, 0.08), vec3(1.0, 0.25, 0.25), n);
  col = mix(col, vec3(1.0, 0.8, 0.7), pow(e, 3.0) * 0.6);
  gl_FragColor = vec4(col * 2.0, uA * (0.55 + n * 0.45));
}`;

/** Kensaku: the rope of red fire. It flies from his hand to the target, loops round it, hauls it to his feet. */
export class FireRope implements Projectile {
  done = false;
  private t = 0;
  private tube: THREE.Mesh;
  private u = { uTime: { value: 0 }, uA: { value: 1 } };
  private tip = new THREE.Vector3();
  private caught = false;
  private pulling = false;
  private pullFrom = new THREE.Vector3();
  private pullT = 0;
  private bindT = 0;

  constructor(private g: Game, readonly owner: Fighter, private hand: () => THREE.Vector3, readonly target: Fighter, readonly o: { fly: number; pullAt: number; pull: number; bind: number; onCatch?: (t: Fighter) => void; onArrive?: (t: Fighter) => void }) {
    this.tip.copy(hand());
    this.tube = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: ROPE_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    this.tube.frustumCulled = false;
    this.tube.renderOrder = 7;
    g.engine.gr.scene.add(this.tube);
  }

  /** the front of the owner, where the target is hauled to */
  private dest(out: THREE.Vector3): THREE.Vector3 {
    const f = this.owner;
    return out.copy(f.pos).addScaledVector(f.forward(_w), f.def.radius + this.target.def.radius + 0.7);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const tg = this.target;
    if (tg.dead || this.owner.dead) {
      this.end();
      return;
    }
    if (!this.caught) {
      const k = Math.min(1, this.t / this.o.fly);
      this.tip.lerpVectors(this.hand(), tg.center(), k);
      if (k >= 1) {
        this.caught = true;
        this.o.onCatch?.(tg);
        g.sfx.play('crack', tg.center(), 0.8);
      }
    } else this.tip.copy(tg.center());
    if (this.caught) {
      tg.hitstun = Math.max(tg.hitstun, 0.2);
      tg.push.set(0, 0, 0);
    }
    if (this.caught && !this.pulling && this.t >= this.o.pullAt) {
      this.pulling = true;
      this.pullFrom.copy(tg.pos);
      g.sfx.play('swingHeavy', tg.center(), 1);
    }
    if (this.pulling && this.pullT < this.o.pull) {
      this.pullT += dt;
      const k = Math.min(1, this.pullT / this.o.pull);
      const e = k * k * (3 - 2 * k);
      const to = this.dest(_v);
      const p = _w.lerpVectors(this.pullFrom, to, e);
      p.y += Math.sin(k * Math.PI) * 1.6;
      tg.body.pos.copy(p);
      tg.body.vel.set(0, 0, 0);
      if (Math.random() < 0.6) HellfirePool.of(g).spawn('crimson', p.x, p.y, p.z, 0.5, 0.9, 0.5);
      if (k >= 1) this.o.onArrive?.(tg);
    } else if (this.pulling) {
      this.bindT += dt;
      tg.rooted = true;
      if (this.bindT >= this.o.bind) this.end();
    }
  }

  private end(): void {
    if (this.done) return;
    this.done = true;
    if (this.pulling) this.target.rooted = false;
  }

  render(_dt: number, time: number): void {
    this.u.uTime.value = time;
    const a = this.hand();
    const b = this.tip;
    const pts: THREE.Vector3[] = [];
    const n = 16;
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const p = new THREE.Vector3().lerpVectors(a, b, k);
      // the throw arcs, the taut rope barely sags, and it writhes
      p.y += Math.sin(k * Math.PI) * (this.caught ? 0.15 : 1.2) + Math.sin(time * 20 + k * 12) * 0.05;
      pts.push(p);
    }
    // the noose: two coils round the target once caught
    if (this.caught) {
      const c = this.target.center();
      const r = this.target.def.radius + 0.12;
      for (let i = 1; i <= 24; i++) {
        const a2 = (i / 12) * Math.PI * 2 + time * 3;
        pts.push(new THREE.Vector3(c.x + Math.cos(a2) * r, c.y + 0.2 - i * 0.025, c.z + Math.sin(a2) * r));
      }
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    this.tube.geometry.dispose();
    this.tube.geometry = new THREE.TubeGeometry(curve, pts.length * 3, 0.07, 6, false);
  }

  dispose(): void {
    if (this.pulling && !this.done) this.target.rooted = false;
    this.tube.removeFromParent();
    this.tube.geometry.dispose();
    (this.tube.material as THREE.Material).dispose();
  }
}

// ------------------------------------------------------------------------------------------------ Gōka

const COLUMN_FRAG = /* glsl */ `
uniform float uTime; uniform float uA;
varying vec2 vUv; varying vec3 vN; varying vec3 vW;
${NOISE}
void main() {
  vec3 v = normalize(cameraPosition - vW);
  float f = abs(dot(normalize(vN), v));
  float n = fNoise(vec3(vUv.x * 12.0, vUv.y * 6.0 - uTime * 5.0, uTime)) * 0.65 + fNoise(vec3(vUv.x * 30.0, vUv.y * 14.0 - uTime * 9.0, 2.0)) * 0.35;
  vec3 col = mix(vec3(0.3, 0.04, 0.6), vec3(0.75, 0.22, 1.0), n);
  col = mix(col, vec3(1.0, 0.2, 0.3), smoothstep(0.55, 0.9, n) * (1.0 - vUv.y));
  float top = smoothstep(1.0, 0.6, vUv.y + (n - 0.5) * 0.3);
  gl_FragColor = vec4(col * 1.9, uA * (1.0 - f * 0.55) * top * (0.55 + n * 0.6));
}`;
const COLUMN_DARK = /* glsl */ `
uniform float uTime; uniform float uA;
varying vec2 vUv; varying vec3 vN; varying vec3 vW;
${NOISE}
void main() {
  vec3 v = normalize(cameraPosition - vW);
  float f = abs(dot(normalize(vN), v));
  float n = fNoise(vec3(vUv.x * 10.0, vUv.y * 5.0 - uTime * 4.0, 1.0));
  float top = smoothstep(0.95, 0.5, vUv.y + (n - 0.5) * 0.4);
  gl_FragColor = vec4(vec3(0.035, 0.012, 0.04), uA * smoothstep(0.15, 0.6, f) * top * 0.92);
}`;
const COL_VERT = /* glsl */ `varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`;

/** a column of fire (black at the heart, violet and crimson round it) from the ground up */
class FireColumn {
  readonly group = new THREE.Group();
  private u = { uTime: { value: 0 }, uA: { value: 0 } };
  constructor(scene: THREE.Scene, radius: number, height: number) {
    const geo = new THREE.CylinderGeometry(radius * 0.7, radius, height, 20, 6, true);
    geo.translate(0, height / 2, 0);
    const outer = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: COL_VERT, fragmentShader: COLUMN_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    const inner = new THREE.Mesh(geo.clone().scale(0.55, 0.92, 0.55), new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: COL_VERT, fragmentShader: COLUMN_DARK, transparent: true, depthWrite: false }));
    outer.renderOrder = 7;
    inner.renderOrder = 6;
    this.group.add(inner, outer);
    this.group.traverse((c) => (c.frustumCulled = false));
    scene.add(this.group);
  }
  set(time: number, a: number, rise: number): void {
    this.u.uTime.value = time;
    this.u.uA.value = a;
    this.group.scale.set(1, Math.max(0.01, rise), 1);
  }
  dispose(): void {
    this.group.removeFromParent();
    this.group.traverse((c) => {
      if (c instanceof THREE.Mesh) {
        c.geometry.dispose();
        (c.material as THREE.Material).dispose();
      }
    });
  }
}

/** Gōka: the ground glows under the target, then a pillar of hellfire erupts there. */
export class HellPillar implements Projectile {
  done = false;
  private t = 0;
  private col: FireColumn;
  private struck = false;
  readonly at: THREE.Vector3;

  constructor(private g: Game, readonly owner: Fighter, at: THREE.Vector3, readonly o: { delay: number; radius: number; height: number; damage: number; onHit?: (t: Fighter) => void }) {
    this.at = at.clone();
    this.at.y = groundAt(g, at.x, at.y + 2, at.z, 10) ?? at.y;
    this.col = new FireColumn(g.engine.gr.scene, o.radius, o.height);
    this.col.group.position.copy(this.at);
    this.col.set(0, 0, 0.01);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const p = this.at;
    if (this.t < this.o.delay) {
      // the mark: the ground glowing, heat and embers rising
      if (Math.random() < dt * 30) {
        const a = Math.random() * Math.PI * 2, r = Math.random() * this.o.radius;
        g.engine.glow.spawn({ x: p.x + Math.cos(a) * r, y: p.y + 0.05, z: p.z + Math.sin(a) * r, vy: 1.5, size: 0.5, sizeEnd: 0.1, life: 0.5, r: 0.7, g: 0.15, b: 1, alpha: 0.7, alphaEnd: 0, tex: TEX_GLOW });
      }
      return;
    }
    if (!this.struck) {
      this.struck = true;
      for (const e of g.enemiesOf(this.owner)) {
        if (Math.hypot(e.pos.x - p.x, e.pos.z - p.z) > this.o.radius + e.def.radius || e.pos.y > p.y + this.o.height || e.pos.y < p.y - 2) continue;
        g.damage(e, this.o.damage, this.owner, new THREE.Vector3(0, 1, 0), { energy: true, knock: 2, launch: 16, heavy: true, hitstop: 0.12, shake: 0.6, color: HELL_VIOLET });
        this.o.onHit?.(e);
      }
      g.engine.destruction.carve(new SphereShape(p.clone(), this.o.radius * 1.1, 0.6), { mode: 'explode', power: 700, impulse: 14 });
      g.engine.destruction.carve(new CapsuleShape(p.clone(), p.clone().setY(p.y + this.o.height * 0.6), this.o.radius * 0.8), { mode: 'burn', power: 700, dust: 0.2 });
      hellFlash(g, p.clone().setY(p.y + 1), 1.4);
      g.sfx.play('explode', p, 1.5);
      g.shake(0.35);
    }
    if (Math.random() < dt * 40) HellfirePool.of(g).spawn(pickKind(Math.random()), p.x + (Math.random() - 0.5) * this.o.radius * 1.6, p.y, p.z + (Math.random() - 0.5) * this.o.radius * 1.6, 1.2, 2.4 + Math.random() * 3, 0.8, 1.3, 3);
    if (this.t > this.o.delay + 1.3) this.done = true;
  }

  render(_dt: number, time: number): void {
    if (this.t < this.o.delay) {
      this.col.set(time, 0, 0.01);
      return;
    }
    const k = this.t - this.o.delay;
    const rise = Math.min(1, k / 0.16);
    const a = k > 0.9 ? Math.max(0, 1 - (k - 0.9) / 0.4) : 1;
    this.col.set(time, a, rise);
  }

  dispose(): void {
    this.col.dispose();
  }
}

// ------------------------------------------------------------------------------------------------ Hyakki Yakō

/** Hyakki Yakō: a stampede of burning demon heads across the ground ahead of him. */
export class DemonParade implements Projectile {
  done = false;
  private t = 0;
  private heads: { m: PropMesh; p: THREE.Vector3; start: number; lane: number; bob: number; gone: boolean }[] = [];
  private hits = new Map<number, number>();
  private hitT = new Map<number, number>();
  private readonly side: THREE.Vector3;

  constructor(private g: Game, readonly owner: Fighter, readonly origin: THREE.Vector3, readonly dir: THREE.Vector3, readonly o: { count: number; width: number; length: number; speed: number; damage: number; maxHits: number; onHit?: (t: Fighter) => void }) {
    this.dir = dir.clone().setY(0).normalize();
    this.side = new THREE.Vector3(this.dir.z, 0, -this.dir.x);
    for (let i = 0; i < o.count; i++) {
      const lane = ((i % 7) / 6 - 0.5) * o.width + (Math.random() - 0.5) * 1.2;
      const kind = i % 3;
      const m = mesh(g, `head${kind}`, () => demonHeadModel(kind), 0.9 + Math.random() * 0.5);
      m.visible = false;
      const p = origin.clone().addScaledVector(this.side, lane);
      this.heads.push({ m, p, start: Math.floor(i / 7) * 0.22 + Math.random() * 0.15, lane, bob: Math.random() * 6, gone: false });
    }
    g.sfx.play('roarBig', origin, 0.8);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const pool = HellfirePool.of(g);
    for (const h of this.heads) {
      if (h.gone || this.t < h.start) continue;
      h.p.addScaledVector(this.dir, this.o.speed * dt);
      const along = _v.subVectors(h.p, this.origin).dot(this.dir);
      const gy = groundAt(g, h.p.x, h.p.y + 3, h.p.z, 8);
      if (gy !== null) h.p.y += (gy + 0.4 - h.p.y) * Math.min(1, dt * 10);
      // a trail of fire, the ground torn up behind it
      if (Math.random() < 0.7) pool.spawn(Math.random() < 0.4 ? 'black' : Math.random() < 0.5 ? 'violet' : 'crimson', h.p.x - this.dir.x * 1.2, h.p.y, h.p.z - this.dir.z * 1.2, 1, 1.6, 0.6, 1.2, 2);
      if (Math.random() < dt * 6) g.engine.destruction.carve(new SphereShape(h.p.clone().setY(h.p.y - 0.4), 1, 0.6), { mode: 'smash', power: 500, impulse: 9, dir: UP.clone() });
      for (const e of g.enemiesOf(this.owner)) {
        if (e.center().distanceTo(_w.copy(h.p).setY(h.p.y + 0.8)) > e.def.radius + 1.4) continue;
        const n = this.hits.get(e.id) ?? 0;
        const last = this.hitT.get(e.id) ?? -9;
        if (n >= this.o.maxHits || this.t - last < 0.12) continue;
        this.hits.set(e.id, n + 1);
        this.hitT.set(e.id, this.t);
        g.damage(e, this.o.damage, this.owner, this.dir.clone(), { energy: true, knock: 9, launch: n === this.o.maxHits - 1 ? 12 : 4, heavy: n === this.o.maxHits - 1, hitstop: 0.04, quiet: n > 0 && n < this.o.maxHits - 1, color: HELL_CRIMSON });
        this.o.onHit?.(e);
      }
      if (along > this.o.length) {
        h.gone = true;
        hellFlash(g, h.p.clone().setY(h.p.y + 0.8), 1);
      }
    }
    if (this.heads.every((h) => h.gone)) this.done = true;
  }

  render(_dt: number, time: number): void {
    const yaw = Math.atan2(this.dir.x, this.dir.z);
    for (const h of this.heads) {
      h.m.visible = !h.gone && this.t >= h.start;
      if (!h.m.visible) continue;
      h.m.position.copy(h.p);
      h.m.position.y += Math.abs(Math.sin(time * 9 + h.bob)) * 0.5;
      h.m.rotation.set(Math.sin(time * 7 + h.bob) * 0.12, yaw + Math.sin(time * 3 + h.bob) * 0.15, Math.sin(time * 5 + h.bob) * 0.1);
    }
  }

  dispose(): void {
    for (const h of this.heads) dropMesh(h.m);
  }
}

// ------------------------------------------------------------------------------------------------ Tenma

const LEG_BONES = new Set(['thigh.L', 'shin.L', 'foot.L', 'thigh.R', 'shin.R', 'foot.R']);

/**
 * Tenma: the colossal demon of black fire in his own shape (his Bankai body, ×scale). It rises out of the ground behind
 * him and copies every move he makes; the kit holds its blade `active` with a BladeSpec through a cut. `anchor` pins it
 * somewhere else (the final form's descent), facing `faceAt`.
 */
export class TenmaGiant implements Projectile {
  done = false;
  readonly v: CharacterVisual;
  readonly sword: PropMesh;
  private map = new Int16Array(0);
  private mapFor: Rig | null = null;
  private isLeg: boolean[];
  private isHand: boolean[];
  readonly pos = new THREE.Vector3();
  yaw = 0;
  private t = 0;
  private endT = -1;
  private flashT = 0;
  /** how much of his leg motion the legs copy */
  legK = 0.3;
  /** while one of his moves runs: the legs copy fully and it leans toward the target */
  acting = false;
  leanOn = true;
  private lean = 0;
  /** blade sweeps */
  active = false;
  spec: BladeSpec | null = null;
  readonly hits = new Set<number>();
  pressure = 6;
  readonly base = new THREE.Vector3();
  readonly tip = new THREE.Vector3();
  readonly prevBase = new THREE.Vector3();
  readonly prevTip = new THREE.Vector3();
  private bladeValid = false;
  back = 6.5;
  side = 0;
  anchor: THREE.Vector3 | null = null;
  faceAt: THREE.Vector3 | null = null;
  /** a flicker of fire as it moves to a new anchor */
  private blinkT = 0;

  constructor(private g: Game, readonly owner: Fighter, public scale = 11, readonly rise = 1.4) {
    const a = dadouAsset('bankai');
    this.v = new CharacterVisual(a.model, [], []);
    this.sword = this.v.attach('sword', dadouProp('bankai'), 'grip.R');
    this.v.attach('halo', dadouProp('halo'), 'halo');
    this.isLeg = this.v.rig.names.map((n) => LEG_BONES.has(n));
    this.isHand = this.v.rig.names.map((n) => n.startsWith('fist.') || n.startsWith('palm.'));
    this.yaw = owner.yaw;
    this.tint(0);
    g.engine.gr.scene.add(this.v.object);
    this.place(1);
  }

  get rising(): boolean {
    return this.t < this.rise;
  }

  get ending(): boolean {
    return this.endT >= 0;
  }

  /** black fire with a violet rim; a hit flashes it */
  private tint(flash: number): void {
    const pulse = 1.3 + Math.sin(this.t * 4) * 0.25;
    this.v.forEachMaterial((m) => {
      const u = m.userData.uniforms;
      u.uTint.value.setRGB(0.15, 0.08, 0.15);
      u.uRim.value.set(0.72, 0.18, 1, pulse);
      u.uFlash.value.set(1, 0.3, 0.4, flash);
    });
  }

  flash(): void {
    this.flashT = 0.15;
  }

  /** move to a new anchor in a burst of fire (null: back to following him) */
  moveTo(anchor: THREE.Vector3 | null, faceAt: THREE.Vector3 | null): void {
    this.anchor = anchor ? anchor.clone() : null;
    this.faceAt = faceAt ? faceAt.clone() : null;
    this.blinkT = 0.35;
    hellFlash(this.g, this.pos.clone().setY(this.pos.y + this.scale), 2.5);
    this.place(1);
    hellfireAt(this.g, this.pos, 3, 1.4, 1.2, false);
  }

  dismiss(): void {
    if (this.endT < 0) this.endT = 0;
    this.active = false;
  }

  update(dt: number): void {
    this.t += dt;
    this.flashT = Math.max(0, this.flashT - dt);
    this.blinkT = Math.max(0, this.blinkT - dt);
    if (this.endT >= 0) {
      this.endT += dt;
      if (this.endT > 1.4) this.done = true;
    }
  }

  private copyPose(): void {
    const src = this.owner.visual.rig, dst = this.v.rig;
    if (this.mapFor !== src) {
      this.map = new Int16Array(dst.count);
      for (let i = 0; i < dst.count; i++) this.map[i] = src.index(dst.names[i]);
      this.mapFor = src;
    }
    for (let i = 0; i < dst.count; i++) {
      const si = this.map[i];
      if (si < 0) continue;
      const sb = src.bones[si], db = dst.bones[i];
      if (this.isLeg[i] && this.legK < 1) db.quaternion.copy(IDQ).slerp(sb.quaternion, this.legK);
      else db.quaternion.copy(sb.quaternion);
      if (this.isHand[i]) db.scale.copy(sb.scale);
    }
    if (src.hips >= 0 && dst.hips >= 0) {
      _v.copy(src.bones[src.hips].position).sub(src.restPos[src.hips]);
      dst.bones[dst.hips].position.copy(dst.restPos[dst.hips]).addScaledVector(_v, this.legK);
    }
  }

  private bend(deg: number): void {
    if (Math.abs(deg) < 0.5) return;
    const rig = this.v.rig;
    const add = (name: string, d: number) => {
      const i = rig.index(name);
      if (i < 0) return;
      _q.setFromAxisAngle(X_AXIS, (d * Math.PI) / 180);
      rig.bones[i].quaternion.premultiply(_q);
    };
    add('spine', deg * 0.6);
    add('chest', deg * 0.4);
    add('neck', -deg * 0.25);
    add('head', -deg * 0.35);
  }

  /** what he fights: where he aims, or the nearest enemy ahead of him */
  private targetPoint(): THREE.Vector3 | null {
    const f = this.owner;
    if (this.faceAt) return this.faceAt;
    if (f.faceTarget) return f.faceTarget.clone();
    const t = this.g.nearestEnemy(f, 90, f.forward(_w), 75);
    return t ? t.center() : null;
  }

  private place(lerp: number): void {
    const f = this.owner;
    const fw = _w.set(Math.sin(f.yaw), 0, Math.cos(f.yaw));
    const want = new THREE.Vector3();
    if (this.anchor) want.copy(this.anchor);
    else {
      const left = _v.set(fw.z, 0, -fw.x);
      want.copy(f.renderPos).addScaledVector(fw, -this.back).addScaledVector(left, this.side);
      want.y = groundAt(this.g, want.x, f.renderPos.y + 3, want.z, 30) ?? f.renderPos.y;
    }
    if (lerp >= 1) this.pos.copy(want);
    else {
      this.pos.x += (want.x - this.pos.x) * lerp;
      this.pos.z += (want.z - this.pos.z) * lerp;
      this.pos.y += (want.y - this.pos.y) * Math.min(1, lerp * 0.6);
    }
    const aim = this.targetPoint() ?? new THREE.Vector3().copy(f.renderPos).addScaledVector(fw, 20);
    const want2 = Math.atan2(aim.x - this.pos.x, aim.z - this.pos.z);
    let d = want2 - this.yaw;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    this.yaw += d * Math.min(1, lerp * 1.5);
  }

  private applyTransform(): void {
    const o = this.v.object;
    o.position.copy(this.pos);
    o.rotation.set(0, this.yaw, 0, 'YXZ');
    o.scale.setScalar(this.scale);
    o.updateMatrixWorld(true);
  }

  render(dt: number): void {
    const f = this.owner;
    this.legK += ((this.acting ? 1 : 0.3) - this.legK) * Math.min(1, dt * 6);
    this.copyPose();
    const tgt = this.acting && this.leanOn ? this.targetPoint() : null;
    let want = 0;
    if (tgt) {
      const shoulder = this.pos.y + this.scale * 1.45;
      const d = Math.max(2, Math.hypot(tgt.x - this.pos.x, tgt.z - this.pos.z) - this.scale * 0.3);
      want = Math.max(10, Math.min(48, (Math.atan2(shoulder - tgt.y, d) * 180) / Math.PI - 16));
    }
    this.lean += (want - this.lean) * Math.min(1, dt * 5);
    this.bend(this.lean);
    if (this.rising) {
      const u = this.t / this.rise;
      const e = 1 - (1 - u) ** 3;
      this.place(Math.min(1, dt * 3));
      const gy = this.pos.y;
      this.pos.y = gy - this.scale * 1.9 * (1 - e);
      this.applyTransform();
      this.pos.y = gy;
      if (Math.random() < dt * 40) {
        const a = Math.random() * Math.PI * 2, r = 1 + Math.random() * this.scale * 0.4;
        HellfirePool.of(this.g).spawn(pickKind(Math.random()), this.pos.x + Math.cos(a) * r, gy, this.pos.z + Math.sin(a) * r, 1.5, 3 + Math.random() * 4, 1, 1.4, 4);
      }
    } else {
      this.place(this.anchor ? 1 : Math.min(1, dt * 2.2));
      this.applyTransform();
    }
    const vanish = this.blinkT > 0 ? Math.min(1, this.blinkT / 0.35) * 0.8 : 0;
    if (this.endT >= 0) this.v.forEachMaterial((m) => (m.userData.uniforms.uDissolve.value = Math.min(1, this.endT / 1.2)));
    else this.v.forEachMaterial((m) => (m.userData.uniforms.uDissolve.value = vanish));
    this.tint(this.flashT > 0 ? 0.8 : 0);
    this.sweep();
    // it sheds black fire
    const pool = HellfirePool.of(this.g);
    const rig = this.v.rig;
    const n = this.endT >= 0 ? 6 : 2;
    for (let i = 0; i < n; i++) {
      const b = rig.bones[Math.floor(Math.random() * rig.count)];
      b.getWorldPosition(_v);
      const s = this.scale * 0.12;
      pool.spawn(Math.random() < 0.55 ? 'black' : 'violet', _v.x + (Math.random() - 0.5) * s, _v.y + (Math.random() - 0.5) * s, _v.z + (Math.random() - 0.5) * s, this.scale * 0.1, this.scale * 0.2, 0.7, 1, this.scale * 0.2);
    }
    void f;
  }

  /** sample the blade and sweep it while active */
  private sweep(): void {
    this.sword.updateMatrixWorld(true);
    this.prevBase.copy(this.base);
    this.prevTip.copy(this.tip);
    this.base.set(0, 0, HAJUN_BASE_Z).applyMatrix4(this.sword.matrixWorld);
    this.tip.set(0, 0, NODACHI_TIP_Z).applyMatrix4(this.sword.matrixWorld);
    if (!this.bladeValid) {
      this.prevBase.copy(this.base);
      this.prevTip.copy(this.tip);
      this.bladeValid = true;
    }
    if (this.active && this.spec && this.endT < 0) {
      this.g.bladeSweep(this.owner, this.prevBase, this.prevTip, this.base, this.tip, this.spec, this.hits);
      if (this.pressure > 0) this.pressureHits(this.spec);
    }
  }

  /** the colossal blade passing over someone: struck as if the edge had found them (its weight and its wind) */
  private pressureHits(spec: BladeSpec): void {
    const g = this.g, f = this.owner;
    const d0 = _v.subVectors(this.prevTip, this.prevBase), d1 = _w.subVectors(this.tip, this.base);
    const l0 = d0.length(), l1 = d1.length();
    if (l0 < 1e-3 || l1 < 1e-3) return;
    d0.divideScalar(l0);
    d1.divideScalar(l1);
    const qa = new THREE.Quaternion().setFromUnitVectors(d0, d1);
    const qb = new THREE.Quaternion();
    const turn = Math.acos(Math.max(-1, Math.min(1, d0.dot(d1))));
    const steps = Math.min(16, Math.max(3, Math.ceil(turn / 0.12)));
    const dir = new THREE.Vector3(), p = new THREE.Vector3();
    for (const o of g.enemiesOf(f)) {
      if (o.dead || this.hits.has(o.id)) continue;
      let hit = false;
      for (let si = 0; si <= steps && !hit; si++) {
        const k = si / steps;
        qb.identity().slerp(qa, k);
        dir.copy(d0).applyQuaternion(qb);
        const len = l0 + (l1 - l0) * k;
        const bx = this.prevBase.x + (this.base.x - this.prevBase.x) * k, by = this.prevBase.y + (this.base.y - this.prevBase.y) * k, bz = this.prevBase.z + (this.base.z - this.prevBase.z) * k;
        for (let bi = 2; bi <= 12 && !hit; bi++) {
          const u = (bi / 12) * len;
          p.set(bx + dir.x * u, by + dir.y * u, bz + dir.z * u);
          if (Math.hypot(p.x - o.pos.x, p.z - o.pos.z) > o.def.radius + (spec.reach ?? 0.4)) continue;
          if (p.y > o.pos.y - 1.5 && p.y < o.pos.y + o.def.height + this.pressure) hit = true;
        }
      }
      if (!hit) continue;
      this.hits.add(o.id);
      const away = new THREE.Vector3().subVectors(o.pos, f.pos).setY(0).normalize();
      g.damage(o, spec.damage, f, away, { knock: spec.knock, launch: spec.launch, heavy: spec.heavy, hitstop: spec.hitstop, shake: spec.shake, unblockable: spec.unblockable });
      g.sparks(o.center(), away, HELL_VIOLET);
      spec.onHit?.(o);
    }
  }

  /** world position of a socket or bone */
  point(name: string, out = new THREE.Vector3()): THREE.Vector3 {
    const s = this.v.rig.sockets.get(name);
    if (s) return s.getWorldPosition(out);
    const i = this.v.rig.index(name);
    if (i >= 0) return this.v.rig.bones[i].getWorldPosition(out);
    return out.copy(this.pos);
  }

  dispose(): void {
    this.v.object.removeFromParent();
  }
}

// ------------------------------------------------------------------------------------------------ the Gates of Hell

const VOID_FRAG = /* glsl */ `
uniform float uTime; uniform float uA;
varying vec2 vUv;
${NOISE}
void main() {
  vec2 p = vUv - 0.5;
  float r = length(p * vec2(1.0, 0.6));
  float a = atan(p.y, p.x);
  float sw = fNoise(vec3(a * 2.0 + uTime * 0.6 - r * 6.0, r * 8.0 - uTime * 1.5, uTime * 0.3));
  vec3 col = mix(vec3(0.02, 0.008, 0.025), vec3(0.35, 0.05, 0.6), smoothstep(0.55, 0.95, sw) * (1.0 - r));
  col += vec3(0.9, 0.1, 0.2) * smoothstep(0.82, 1.0, sw) * 0.6;
  gl_FragColor = vec4(col, uA);
}`;

/** link geometry and material for the chains out of Hell */
let linkGeo: THREE.TorusGeometry | null = null;

export interface GatesOpts {
  /** 'judge': a soul is impaled, dragged in, held and spat out; 'revive': he walks back out of them */
  mode: 'judge' | 'revive';
  victim?: Fighter;
  onImpale?: (v: Fighter) => void;
  onSpit?: (v: Fighter) => void;
  onEmerge?: () => void;
}

/** The Gates of Hell: they rise out of the ground, open, judge, close; then sink back. */
export class GatesOfHell implements Projectile {
  done = false;
  private t = 0;
  private frame: PropMesh;
  private doorL: PropMesh;
  private doorR: PropMesh;
  private blade: PropMesh;
  private voidPlane: THREE.Mesh;
  private voidU = { uTime: { value: 0 }, uA: { value: 0 } };
  private chains: THREE.InstancedMesh;
  private chainMat: THREE.MeshStandardMaterial;
  private readonly at: THREE.Vector3;
  private readonly face: THREE.Vector3;
  private readonly yaw: number;
  private stage = 0;
  private held = false;
  private holdFrom = new THREE.Vector3();
  /** the opening, scaled: the frame is 7 m wide and 10.5 m tall at 1×; `size` scales it */
  private readonly size: number;
  private readonly times: { rise: number; open: number; impale: number; drag: number; close: number; spit: number; shut: number; sink: number };

  constructor(private g: Game, readonly owner: Fighter, at: THREE.Vector3, face: THREE.Vector3, readonly o: GatesOpts) {
    this.at = at.clone();
    this.at.y = groundAt(g, at.x, at.y + 2, at.z, 12) ?? at.y;
    this.face = face.clone().setY(0).normalize();
    this.yaw = Math.atan2(this.face.x, this.face.z);
    this.size = 1.3;
    this.times = o.mode === 'judge'
      ? { rise: 0.6, open: 0.9, impale: 1.2, drag: 1.6, close: 2.0, spit: 3.5, shut: 4.1, sink: 5.0 }
      : { rise: 0.6, open: 1.0, impale: 99, drag: 99, close: 2.2, spit: 99, shut: 2.6, sink: 3.4 };
    const k = this.size;
    this.frame = mesh(g, 'frame', gateFrameModel, k);
    this.doorL = mesh(g, 'doorL', () => gateDoorModel(false), k);
    this.doorR = mesh(g, 'doorR', () => gateDoorModel(true), k);
    this.blade = mesh(g, 'blade', hellBladeModel, k * 0.9);
    this.blade.visible = false;
    const vg = new THREE.PlaneGeometry(4.5 * k, 7.75 * k);
    vg.translate(0, 3.875 * k, 0);
    this.voidPlane = new THREE.Mesh(vg, new THREE.ShaderMaterial({ uniforms: this.voidU, vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: VOID_FRAG, transparent: true, depthWrite: false }));
    this.voidPlane.renderOrder = 4;
    this.voidPlane.frustumCulled = false;
    g.engine.gr.scene.add(this.voidPlane);
    this.chainMat = new THREE.MeshStandardMaterial({ color: '#2A2228', emissive: new THREE.Color(HELL_VIOLET), emissiveIntensity: 0.9, roughness: 0.4, metalness: 0.6 });
    this.chains = new THREE.InstancedMesh((linkGeo ??= new THREE.TorusGeometry(0.2, 0.06, 6, 10)), this.chainMat, 220);
    this.chains.count = 0;
    this.chains.frustumCulled = false;
    g.engine.gr.scene.add(this.chains);
    this.layout(0);
    g.sfx.play('roarBig', this.at, 1.2);
    g.shake(0.4);
  }

  /** the soul held in Hell right now */
  get holding(): boolean {
    return this.held;
  }

  /** a point in the gate's frame: x across (to its right seen from the front), y up, z out of its face */
  private local(x: number, y: number, z: number, out = new THREE.Vector3()): THREE.Vector3 {
    const right = _w.set(this.face.z, 0, -this.face.x);
    return out.copy(this.at).addScaledVector(right, -x).addScaledVector(this.face, z).setY(this.at.y + y);
  }

  private layout(rise: number): void {
    const k = this.size;
    const sink = (1 - rise) * 11 * k;
    const p = this.at.clone().setY(this.at.y - sink);
    for (const m of [this.frame, this.doorL, this.doorR]) m.position.copy(p);
    this.frame.rotation.set(0, this.yaw, 0);
    // the doors hang at the inner faces of the pillars (±2.25 m)
    const t = this.t, T = this.times;
    let open = 0;
    if (t > T.rise) open = Math.min(1, (t - T.rise) / (T.open - T.rise));
    if (t > T.close - 0.4) open = Math.min(open, Math.max(0, (T.close - t) / 0.4));
    if (this.o.mode === 'judge' && t > T.spit) open = Math.min(1, (t - T.spit) / 0.15) * Math.max(0, Math.min(1, (T.shut - t) / 0.4));
    const ang = open * 1.75;
    const right = new THREE.Vector3(this.face.z, 0, -this.face.x);
    this.doorL.position.copy(p).addScaledVector(right, -2.25 * k);
    this.doorR.position.copy(p).addScaledVector(right, 2.25 * k);
    // the left door (its hinge on the gate's left seen from the front, reaching right) opens outward
    this.doorL.rotation.set(0, this.yaw + Math.PI - ang, 0);
    this.doorR.rotation.set(0, this.yaw + Math.PI + ang, 0);
    this.voidPlane.position.copy(p).addScaledVector(this.face, -0.3);
    this.voidPlane.rotation.set(0, this.yaw, 0);
    this.voidU.uA.value = Math.min(1, open * 3) * 0.96;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const t = this.t, T = this.times;
    const v = this.o.victim;
    const pool = HellfirePool.of(g);
    if (t < T.rise && Math.random() < dt * 30) {
      const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 4;
      g.engine.dust.spawn({ x: this.at.x + Math.cos(a) * r, y: this.at.y + 0.3, z: this.at.z + Math.sin(a) * r, vx: Math.cos(a) * 3, vy: 2 + Math.random() * 4, vz: Math.sin(a) * 3, size: 1.4, sizeEnd: 3.6, life: 1.4, r: 0.3, g: 0.24, b: 0.26, alpha: 0.7, alphaEnd: 0, drag: 1.2, tex: TEX_PUFF });
    }
    if (this.stage === 0 && t >= T.rise) {
      this.stage = 1;
      g.engine.destruction.carve(new BoxShape(this.at.clone().setY(this.at.y + 5), new THREE.Vector3(4.6 * this.size, 5.5 * this.size, 1.2), new THREE.Quaternion().setFromAxisAngle(UP, this.yaw)), { mode: 'smash', power: 2000, impulse: 10 });
      g.sfx.play('impact', this.at, 2);
    }
    if (this.o.mode === 'revive') {
      if (this.stage === 1 && t >= T.open + 0.2) {
        this.stage = 2;
        this.o.onEmerge?.();
        hellFlash(g, this.local(0, 2, 0.5), 2.5);
      }
    } else if (v) {
      // the blade out of the dark, through the soul before the gates
      if (this.stage === 1 && t >= T.impale) {
        this.stage = 2;
        if (!v.dead) this.o.onImpale?.(v);
        this.blade.visible = true;
        hellFlash(g, v.center(), 1.6);
        g.sfx.play('swingHeavy', v.center(), 1.4);
        g.slowMo(0.3, 0.35);
        this.holdFrom.copy(v.pos);
      }
      // the chains drag it in
      if (this.stage === 2 && t < T.drag && !v.dead) {
        const k = (t - T.impale) / (T.drag - T.impale);
        const inside = this.local(0, 0.2, -0.8);
        v.body.pos.lerpVectors(this.holdFrom, inside, k * k);
        v.body.vel.set(0, 0, 0);
        v.hitstun = Math.max(v.hitstun, 0.3);
        v.rooted = true;
      }
      if (this.stage === 2 && t >= T.drag) {
        this.stage = 3;
        this.blade.visible = false;
        if (!v.dead) {
          this.held = true;
          v.visual.object.visible = false;
        }
      }
      if (this.held && !v.dead) {
        v.body.pos.copy(this.local(0, 0.2, -0.8));
        v.body.vel.set(0, 0, 0);
        v.push.set(0, 0, 0);
        v.hitstun = Math.max(v.hitstun, 0.3);
        v.rooted = true;
        if (t > T.close && Math.random() < dt * 20) pool.spawn('black', this.local((Math.random() - 0.5) * 0.4, Math.random() * 8 * this.size, 0.3).x, this.at.y + Math.random() * 6, this.local(0, 0, 0.3).z, 0.6, 1.4, 0.6);
      }
      if (this.stage === 3 && t >= T.spit) {
        this.stage = 4;
        this.release(true);
      }
    }
    if (t >= T.sink + 0.2) this.done = true;
  }

  /** let the soul out: thrown out burning (spit) or simply let go (the gates went away) */
  private release(spit: boolean): void {
    const v = this.o.victim;
    if (!v || !this.held) return;
    this.held = false;
    v.visual.object.visible = true;
    v.rooted = false;
    if (spit && !v.dead) {
      v.body.pos.copy(this.local(0, 0.4, 1.4));
      v.push.addScaledVector(this.face, 22);
      v.body.vel.y = 8;
      this.o.onSpit?.(v);
      hellFlash(this.g, v.center(), 2);
      this.g.sfx.play('explode', v.center(), 1.4);
    }
  }

  render(_dt: number, time: number): void {
    const t = this.t, T = this.times;
    const rise = t < T.rise ? 1 - (1 - t / T.rise) ** 3 : t > T.shut ? Math.max(0, 1 - (t - T.shut) / (T.sink - T.shut)) : 1;
    this.layout(rise);
    this.voidU.uTime.value = time;
    // the blade: out of the dark, through the victim
    const v = this.o.victim;
    if (this.blade.visible && v) {
      const c = v.center();
      const from = this.local(0, c.y - this.at.y, -1);
      const dir = _v.subVectors(c, from).normalize();
      const k = Math.min(1, (t - T.impale) / 0.12);
      this.blade.position.copy(from).addScaledVector(dir, -6 * this.size * (1 - k));
      this.blade.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    }
    // the chains: from the dark to the soul
    let i = 0;
    if (v && (this.stage === 2 || (this.held && t < T.close))) {
      const c = v.center();
      for (const [x, y] of [[-1.6, 6], [1.6, 6], [-1.2, 1.5], [1.2, 1.5]] as [number, number][]) i = layLinks(this.chains, i, this.local(x * this.size, y * this.size, -0.4), c);
    }
    this.chains.count = i;
    this.chains.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.release(false);
    if (this.o.victim && this.stage >= 2) this.o.victim.rooted = false;
    for (const m of [this.frame, this.doorL, this.doorR, this.blade]) dropMesh(m);
    this.voidPlane.removeFromParent();
    this.voidPlane.geometry.dispose();
    (this.voidPlane.material as THREE.Material).dispose();
    this.chains.removeFromParent();
    this.chains.dispose();
    this.chainMat.dispose();
  }
}

/** interlocking links from a to b, starting at index i0; returns the next index */
function layLinks(mesh: THREE.InstancedMesh, i0: number, a: THREE.Vector3, b: THREE.Vector3): number {
  const d = _v.subVectors(b, a);
  const len = d.length();
  const n = Math.max(2, Math.floor(len / 0.32));
  const dir = d.clone().normalize();
  let i = i0;
  const cap = (mesh.instanceMatrix.array.length / 16) | 0;
  for (let k = 0; k < n && i < cap; k++, i++) {
    const p = a.clone().addScaledVector(d, (k + 0.5) / n);
    const q = new THREE.Quaternion().setFromUnitVectors(X_AXIS, dir);
    q.multiply(new THREE.Quaternion().setFromAxisAngle(X_AXIS, k % 2 ? Math.PI / 2 : 0));
    _m.compose(p, q, new THREE.Vector3(1, 1, 1));
    mesh.setMatrixAt(i, _m);
  }
  return i;
}

// ------------------------------------------------------------------------------------------------ Hachinetsu Jigoku

const HELLS_FRAG = /* glsl */ `
uniform float uTime; uniform float uA; uniform float uR;
varying vec2 vUv;
${NOISE}
float cells(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float d1 = 9.0, d2 = 9.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 o = vec2(fHash(vec3(i + g, 1.0)), fHash(vec3(i + g, 7.0)));
    float d = length(g + o - f);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
  }
  return d2 - d1;
}
void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  float r = length(p);
  if (r > 1.0) discard;
  vec2 w = p * uR * 0.35;
  float c = cells(w + vec2(fNoise(vec3(w * 0.5, uTime * 0.2)) * 0.6));
  float crack = 1.0 - smoothstep(0.02, 0.12, c);
  float pulse = 0.65 + 0.35 * sin(uTime * 3.0 + r * 9.0);
  float n = fNoise(vec3(w * 0.8, uTime * 0.5));
  vec3 col = vec3(0.03, 0.01, 0.025);
  col = mix(col, vec3(0.5, 0.06, 0.9) * 1.6, smoothstep(0.6, 0.9, n) * 0.35);
  col = mix(col, vec3(1.0, 0.16, 0.22) * 2.6 * pulse, crack);
  float edge = smoothstep(0.86, 1.0, r);
  col = mix(col, vec3(1.0, 0.25, 0.3) * 2.2, edge * (0.6 + 0.4 * n));
  gl_FragColor = vec4(col, uA * (0.9 - edge * 0.4));
}`;

/** Hachinetsu Jigoku: the ground round him becomes Hell for a while — burning, slowing, no healing on it. */
export class BurningHells implements Projectile {
  done = false;
  private t = 0;
  private disc: THREE.Mesh;
  private u = { uTime: { value: 0 }, uA: { value: 0 }, uR: { value: 26 } };
  private acc = 0;
  private tick = 0;
  readonly center: THREE.Vector3;

  constructor(private g: Game, readonly owner: Fighter, center: THREE.Vector3, readonly o: { radius: number; life: number; dps: number; slow: number; onTick?: (t: Fighter) => void }) {
    this.center = center.clone();
    this.center.y = groundAt(g, center.x, center.y + 1, center.z, 6) ?? center.y;
    this.u.uR.value = o.radius;
    const geo = new THREE.PlaneGeometry(o.radius * 2, o.radius * 2);
    geo.rotateX(-Math.PI / 2);
    this.disc = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: HELLS_FRAG, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    this.disc.position.copy(this.center).setY(this.center.y + 0.04);
    this.disc.renderOrder = 3;
    this.disc.frustumCulled = false;
    g.engine.gr.scene.add(this.disc);
    // the ground scorched
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2, r = o.radius * (0.3 + Math.random() * 0.6);
      g.engine.destruction.carve(new SphereShape(new THREE.Vector3(this.center.x + Math.cos(a) * r, this.center.y, this.center.z + Math.sin(a) * r), 2.4, 0.4), { mode: 'burn', power: 500, dust: 0.1 });
    }
    g.sfx.play('explode', this.center, 2);
  }

  inside(p: THREE.Vector3): boolean {
    return Math.hypot(p.x - this.center.x, p.z - this.center.z) < this.o.radius && Math.abs(p.y - this.center.y) < 5;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const c = this.center, R = this.o.radius;
    const live = this.t < this.o.life;
    this.acc += dt;
    if (this.acc > 0.05 && live) {
      this.acc = 0;
      const pool = HellfirePool.of(g);
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2, k = Math.sqrt(Math.random()), r = k * R;
        const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
        const gy = groundAt(g, x, c.y + 3, z, 8) ?? c.y;
        pool.spawn(pickKind(k), x, gy, z, 0.9 + Math.random(), 1.6 + Math.random() * 2.6, 0.9, 1.2, 1);
      }
      // the ring of flame at the edge
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2;
        pool.spawn(Math.random() < 0.5 ? 'crimson' : 'black', c.x + Math.cos(a) * R, c.y, c.z + Math.sin(a) * R, 1.6, 3 + Math.random() * 3, 0.9, 1.3, 2);
      }
    }
    this.tick -= dt;
    if (this.tick <= 0 && live) {
      this.tick = 0.25;
      for (const e of g.enemiesOf(this.owner)) {
        if (!this.inside(e.pos)) continue;
        g.drain(e, this.o.dps * 0.25, this.owner);
        e.slow(this.o.slow, 0.35);
        this.o.onTick?.(e);
      }
    }
    if (this.t > this.o.life + 0.8) this.done = true;
  }

  render(_dt: number, time: number): void {
    this.u.uTime.value = time;
    const grow = Math.min(1, this.t / 0.6);
    const fade = this.t > this.o.life ? Math.max(0, 1 - (this.t - this.o.life) / 0.8) : 1;
    this.u.uA.value = grow * fade;
    this.disc.scale.set(Math.max(0.01, grow), 1, Math.max(0.01, grow));
  }

  dispose(): void {
    this.disc.removeFromParent();
    this.disc.geometry.dispose();
    (this.disc.material as THREE.Material).dispose();
  }
}

// ------------------------------------------------------------------------------------------------ Kaen-rin

/** Kaen-rin: the wheel flung off his back as a buzzsaw of fire; it cuts a trench to the target and comes back. */
export class FlameWheel implements Projectile {
  done = false;
  private t = 0;
  private m: PropMesh;
  readonly pos: THREE.Vector3;
  private vel = new THREE.Vector3();
  private back = false;
  private spin = 0;
  private hits = new Map<number, number>();
  private hitT = new Map<number, number>();
  private carveAcc = 0;
  private travelled = 0;

  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, readonly target: Fighter | null, aim: THREE.Vector3, readonly o: { radius: number; speed: number; range: number; damage: number; maxHits: number; onHit?: (t: Fighter) => void; onReturn?: () => void }) {
    this.pos = from.clone();
    this.vel.subVectors(aim, from).setY(0).normalize().multiplyScalar(o.speed);
    // the wheel prop is 0.625 m to the rim at 1×
    this.m = new PropMesh(dadouProp('wheel'));
    this.m.scale.setScalar(o.radius / 0.625);
    g.engine.gr.scene.add(this.m);
    g.sfx.play('swingHeavy', from, 1.4);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const o = this.o;
    const tg = this.target && !this.target.dead ? this.target : null;
    // out along the ground toward the target, then back to his back
    const want = this.back ? this.owner.center().add(_v.set(0, 0.5, 0)) : tg ? tg.pos.clone() : this.pos.clone().add(this.vel);
    const to = _w.subVectors(want, this.pos);
    if (!this.back) to.setY(0);
    const dist = to.length();
    if (dist > 1e-3) {
      const cur = this.vel.clone().normalize();
      cur.lerp(to.normalize(), Math.min(1, dt * (this.back ? 6 : 2.2))).normalize();
      this.vel.copy(cur).multiplyScalar(o.speed * (this.back ? 1.3 : 1));
    }
    this.pos.addScaledVector(this.vel, dt);
    this.travelled += o.speed * dt;
    if (!this.back) {
      // its hub rides just above the ground; the lower rim cuts into it
      const gy = groundAt(g, this.pos.x, this.pos.y + 3, this.pos.z, 10);
      if (gy !== null) this.pos.y += (gy + o.radius * 0.55 - this.pos.y) * Math.min(1, dt * 8);
      this.carveAcc += o.speed * dt;
      if (this.carveAcc > 1.4) {
        this.carveAcc = 0;
        const low = this.pos.clone().setY(this.pos.y - o.radius * 0.55);
        g.engine.destruction.carve(new CapsuleShape(low.clone().addScaledVector(this.vel.clone().normalize(), -1.4), low, 2), { mode: 'cut', power: 2400, dir: UP.clone(), sparks: [1, 0.3, 0.4], dust: 0.6 });
        hellfireAt(g, low, 1.6, 1.1, 1.6, false);
      }
      if ((tg && dist < 1.5) || this.travelled > o.range || this.t > 2.4) this.back = true;
    } else if (dist < 1.2 || this.t > 5) {
      this.done = true;
      this.o.onReturn?.();
      return;
    }
    // whatever the wheel passes through
    const axis = _v.set(this.vel.z, 0, -this.vel.x).normalize();
    for (const e of g.enemiesOf(this.owner)) {
      const rel = _w.subVectors(e.center(), this.pos);
      if (Math.abs(rel.dot(axis)) > 1.4 + e.def.radius || rel.length() > o.radius + e.def.radius) continue;
      const n = this.hits.get(e.id) ?? 0;
      if (n >= o.maxHits || this.t - (this.hitT.get(e.id) ?? -9) < 0.22) continue;
      this.hits.set(e.id, n + 1);
      this.hitT.set(e.id, this.t);
      g.damage(e, o.damage, this.owner, this.vel.clone().normalize(), { energy: true, knock: 6, launch: 5, heavy: n === o.maxHits - 1, hitstop: 0.06, shake: 0.35, unblockable: true, color: HELL_CRIMSON });
      g.sparks(e.center(), UP, HELL_CRIMSON, 18);
      o.onHit?.(e);
    }
    const pool = HellfirePool.of(g);
    if (Math.random() < 0.8) {
      const a = Math.random() * Math.PI * 2;
      pool.spawn(Math.random() < 0.5 ? 'crimson' : 'violet', this.pos.x + Math.cos(a) * o.radius * 0.8, this.pos.y + Math.sin(a) * o.radius * 0.8, this.pos.z, 1.2, 2, 0.4, 1.2);
    }
  }

  render(dt: number): void {
    this.spin += dt * 22;
    this.m.position.copy(this.pos);
    // upright, rolling along its path
    const yaw = Math.atan2(this.vel.x, this.vel.z) + Math.PI / 2;
    this.m.rotation.set(0, yaw, 0, 'YXZ');
    this.m.rotateZ(this.spin);
  }

  dispose(): void {
    dropMesh(this.m);
  }
}

// ------------------------------------------------------------------------------------------------ Muken

const MUKEN_FRAG = /* glsl */ `
uniform float uTime; uniform float uA;
varying vec3 vN; varying vec3 vW; varying vec3 vP;
${NOISE}
void main() {
  vec3 v = normalize(cameraPosition - vW);
  float f = abs(dot(normalize(vN), v));
  float n = fNoise(vP * 2.4 + vec3(0.0, -uTime * 3.0, uTime * 0.7));
  float edge = pow(1.0 - f, 2.0);
  vec3 col = mix(vec3(0.03, 0.01, 0.035), vec3(0.62, 0.16, 1.0) * 2.4, edge * (0.6 + n * 0.6));
  col = mix(col, vec3(1.0, 0.15, 0.25) * 2.0, smoothstep(0.75, 0.95, n) * edge);
  gl_FragColor = vec4(col, uA * (0.82 + edge * 0.18));
}`;

/** Muken: the target swallowed by a sphere of black fire, held and burned, then the hell implodes. */
export class MukenSphere implements Projectile {
  done = false;
  private t = 0;
  private sphere: THREE.Mesh;
  private u = { uTime: { value: 0 }, uA: { value: 0 } };
  private ticks = 0;
  private imploded = false;
  private readonly c: THREE.Vector3;

  constructor(private g: Game, readonly owner: Fighter, readonly victim: Fighter, readonly o: { radius: number; life: number; ticks: number; tickDmg: number; implode: number; power: number; onHit?: (t: Fighter) => void }) {
    this.c = victim.center();
    this.sphere = new THREE.Mesh((orbGeo ??= new THREE.IcosahedronGeometry(1, 2)), new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: ORB_VERT, fragmentShader: MUKEN_FRAG, transparent: true, depthWrite: false }));
    this.sphere.renderOrder = 8;
    this.sphere.frustumCulled = false;
    this.sphere.position.copy(this.c);
    g.engine.gr.scene.add(this.sphere);
    g.sfx.play('charge', this.c, 1.4);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const v = this.victim, o = this.o;
    if (!this.imploded && !v.dead) {
      v.body.pos.set(this.c.x, this.c.y - v.def.height * 0.55, this.c.z);
      v.body.vel.set(0, 0, 0);
      v.push.set(0, 0, 0);
      v.hitstun = Math.max(v.hitstun, 0.3);
      v.rooted = true;
    }
    const due = Math.floor((Math.min(this.t, o.life) / o.life) * o.ticks);
    while (this.ticks < due && !v.dead) {
      this.ticks++;
      g.damage(v, o.tickDmg, this.owner, new THREE.Vector3(), { energy: true, knock: 0, quiet: this.ticks % 4 !== 1, hitstop: 0.02, unblockable: true, color: HELL_VIOLET });
      o.onHit?.(v);
    }
    if (Math.random() < dt * 30) {
      const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI;
      const p = _v.set(Math.sin(b) * Math.cos(a), Math.cos(b), Math.sin(b) * Math.sin(a)).multiplyScalar(o.radius).add(this.c);
      HellfirePool.of(g).spawn(Math.random() < 0.5 ? 'black' : 'violet', p.x, p.y - 0.6, p.z, 0.9, 1.6, 0.6);
    }
    if (!this.imploded && this.t >= o.life + 0.25) {
      this.imploded = true;
      v.rooted = false;
      if (!v.dead) {
        g.damage(v, o.implode, this.owner, new THREE.Vector3(0, 1, 0), { energy: true, knock: 4, launch: 12, heavy: true, hitstop: 0.18, shake: 0.9, unblockable: true, color: HELL_VIOLET });
        o.onHit?.(v);
      }
      g.engine.destruction.carve(new SphereShape(this.c.clone(), o.radius * 1.8, 0.8), { mode: 'explode', power: o.power, impulse: 18 });
      hellFlash(g, this.c, 3);
      hellfireAt(g, this.c, o.radius * 1.4, 1.4, 1.8);
      g.addRing(this.c.clone(), o.radius * 6, HELL_VIOLET, 0.5);
      g.sfx.play('explode', this.c, 2.2);
      g.shake(0.8);
      g.slowMo(0.25, 0.35);
    }
    if (this.t > o.life + 0.6) this.done = true;
  }

  render(_dt: number, time: number): void {
    this.u.uTime.value = time;
    const o = this.o, t = this.t;
    const grow = Math.min(1, t / 0.2);
    // it closes, holds, then (after life) crushes down to nothing
    const crush = t > o.life ? Math.max(0, 1 - (t - o.life) / 0.25) : 1;
    this.sphere.scale.setScalar(Math.max(0.01, o.radius * grow * crush * (1 + Math.sin(time * 9) * 0.03)));
    this.u.uA.value = t > o.life + 0.25 ? 0 : 1;
  }

  dispose(): void {
    if (!this.imploded) this.victim.rooted = false;
    this.sphere.removeFromParent();
    (this.sphere.material as THREE.Material).dispose();
  }
}

// ------------------------------------------------------------------------------------------------ Tenka Fubu

/** a burning rock out of the ceiling of fire */
export class HellMeteor implements Projectile {
  done = false;
  private t = 0;
  private m: PropMesh;
  private from: THREE.Vector3;
  private landed = false;
  readonly at: THREE.Vector3;
  private spin = new THREE.Vector3(Math.random() * 4, Math.random() * 4, Math.random() * 4);

  constructor(private g: Game, readonly owner: Fighter, at: THREE.Vector3, readonly o: { delay: number; fall: number; radius: number; damage: number; power: number; onHit?: (t: Fighter) => void }) {
    this.at = at.clone();
    this.at.y = groundAt(g, at.x, at.y + 30, at.z, 60) ?? at.y;
    const side = _v.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
    this.from = this.at.clone().addScaledVector(side, 26).add(_w.set(0, 80, 0));
    this.m = mesh(g, 'rock', rockModel, 0.8 + Math.random() * 0.6);
    this.m.visible = false;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const o = this.o;
    const k = (this.t - o.delay) / o.fall;
    if (k < 0) return;
    if (!this.landed && k < 1) {
      const p = _v.lerpVectors(this.from, this.at, k * k);
      if (Math.random() < 0.8) HellfirePool.of(g).spawn(Math.random() < 0.4 ? 'black' : Math.random() < 0.5 ? 'crimson' : 'violet', p.x, p.y - 0.6, p.z, 2.2, 3.4, 0.35, 1.3, 6);
      if (Math.random() < 0.5) blackSmoke(g, p, 1, 0.8, 2.4);
    }
    if (!this.landed && k >= 1) {
      this.landed = true;
      const p = this.at;
      g.engine.destruction.carve(new SphereShape(p.clone(), o.radius * 0.75, 0.7), { mode: 'explode', power: o.power, impulse: 16 });
      for (const e of g.enemiesOf(this.owner)) {
        const d = Math.hypot(e.pos.x - p.x, e.pos.z - p.z);
        if (d > o.radius + e.def.radius || e.pos.y > p.y + o.radius * 1.6 || e.pos.y < p.y - 3) continue;
        const dir = _w.subVectors(e.pos, p).setY(0);
        if (dir.lengthSq() < 1e-4) dir.set(1, 0, 0);
        g.damage(e, o.damage, this.owner, dir.normalize().clone(), { energy: true, knock: 10, launch: 6, heavy: true, hitstop: 0.06, shake: 0.3, color: HELL_CRIMSON });
        o.onHit?.(e);
      }
      hellfireAt(g, p, o.radius * 0.6, 1.3, 1.6, false);
      hellFlash(g, p.clone().setY(p.y + 1), 1.6);
      g.addRing(p.clone().setY(p.y + 0.2), o.radius * 2.4, HELL_CRIMSON, 0.4);
      g.sfx.play('explode', p, 1.3);
      if (this.g.player && this.g.player.pos.distanceTo(p) < 30) g.shake(0.25);
    }
    if (this.landed && this.t > o.delay + o.fall + 0.2) this.done = true;
  }

  render(dt: number): void {
    const k = (this.t - this.o.delay) / this.o.fall;
    this.m.visible = k >= 0 && k < 1;
    if (!this.m.visible) return;
    this.m.position.lerpVectors(this.from, this.at, k * k);
    this.m.rotation.x += this.spin.x * dt;
    this.m.rotation.y += this.spin.y * dt;
    this.m.rotation.z += this.spin.z * dt;
  }

  dispose(): void {
    dropMesh(this.m);
  }
}

/** the trench and the rim of a torus of fire round a point (the final release's burst) */
export function fireRing(g: Game, at: THREE.Vector3, r: number): void {
  const pool = HellfirePool.of(g);
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    pool.spawn(i % 3 === 0 ? 'black' : i % 3 === 1 ? 'violet' : 'crimson', at.x + Math.cos(a) * r, at.y, at.z + Math.sin(a) * r, 1.4, 3 + Math.random() * 3, 1.1, 1.4, 2);
  }
  g.addRing(at.clone().setY(at.y + 0.2), r * 2, HELL_VIOLET, 0.6);
}

void cylinder;
void torus;
void TEX_STREAK;
