// Natacha's Myōjō (docs/kits/natacha.md): the morning star and the night sky it rises in. A star sprite (an
// eight-point sparkle) is the shared piece: thrown and homing (StarShot), set on a target (StarMarks), joined into
// lines of light (StarLines), falling as meteors (FallingStar), drawn up as constellations (Constellation). The
// Shikai's starlight dome (StarDome) and calamity star (CalamityStar); the Bankai's night (NightSky: the sky tinted,
// a dome of stars and a Milky Way band round the camera, shooting stars, the morning star low on the horizon) and its
// black star (BlackStar); the final form's supernova (Supernova), its halt of time (TimeHalt) and the dawn
// (DawnWall: a wall of light swept across everything ahead). Plus the release pillar and the bursts.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import type { AuraStyle } from './aura';
import type { EnergyColors } from './energy';
import { BoxShape, SphereShape } from '../destruction/shapes';
import { raycastVoxels } from '../voxel/raycast';
import { SkyTint, type SkyLook } from './fire';
import { TEX_GLOW, TEX_PUFF, TEX_RING, TEX_STREAK } from './sprites';

export const STAR_GOLD = '#FFD27A';
export const STAR_CORE = '#FFF6DE';
export const NIGHT_BLUE = '#AFC4FF';
export const DAWN_ROSE = '#FFB08A';

export const AURA_NATACHA: AuraStyle = { core: '#FFF6D8', body: '#FFC94A', rim: '#5A3FB0' };
export const AURA_NATACHA_BANKAI: AuraStyle = { core: '#F3F6FF', body: '#9FB4FF', rim: '#3A2A8A' };
export const AURA_NATACHA_FINAL: AuraStyle = { core: '#FFFBEA', body: '#FFE7A0', rim: '#FF9E4A' };
/** the gold of the Shikai's crescents */
export const STAR_COLORS: EnergyColors = { core: '#FFF8E6', body: '#FFD27A', rim: '#B8862E' };
/** the Bankai's crescents: starlight on the night */
export const NIGHT_COLORS: EnergyColors = { core: '#F4F7FF', body: '#AFC4FF', rim: '#4A3AA8' };
/** the final form's: the dawn */
export const DAWN_COLORS: EnergyColors = { core: '#FFFDF2', body: '#FFE3A0', rim: '#FF9E4A' };

/** the Bankai's night: deep blue, a little moonlight left on the ground */
export const SKY_NIGHT: SkyLook = { zen: '#151A38', hor: '#2C2F5E', cloud: '#20244A', cover: 0.2, glow: 0.15, sun: 0.42, hemi: 0.62, fog: '#22264A' };
/** the dawn: rose and gold low on the horizon, the zenith still blue */
export const SKY_DAWN: SkyLook = { zen: '#3E5FA8', hor: '#FFB08A', cloud: '#FFC9A0', cover: 0.35, glow: 2.4, sun: 1.25, hemi: 1.05, fog: '#F2B898' };

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _u = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const UP = new THREE.Vector3(0, 1, 0);

// ------------------------------------------------------------------------------------------------ textures

let starTex: THREE.CanvasTexture | null = null;
/** an eight-point sparkle: four long rays, four short diagonal ones, a soft round core */
export function starTexture(): THREE.Texture {
  if (starTex) return starTex;
  const S = 128;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;
  const img = g.createImageData(S, S);
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const dx = (x + 0.5 - S / 2) / (S / 2), dy = (y + 0.5 - S / 2) / (S / 2);
      const r = Math.hypot(dx, dy);
      const core = Math.exp(-r * r * 40) + 0.35 * Math.exp(-r * r * 6);
      // the long rays on the axes, the short ones on the diagonals
      const ax = Math.exp(-Math.abs(dy) * 60) * Math.max(0, 1 - Math.abs(dx)) ** 2 + Math.exp(-Math.abs(dx) * 60) * Math.max(0, 1 - Math.abs(dy)) ** 2;
      const u = (dx + dy) * Math.SQRT1_2, v = (dx - dy) * Math.SQRT1_2;
      const dg = Math.exp(-Math.abs(v) * 70) * Math.max(0, 1 - Math.abs(u) * 1.8) ** 2 + Math.exp(-Math.abs(u) * 70) * Math.max(0, 1 - Math.abs(v) * 1.8) ** 2;
      const a = Math.min(1, core + ax * 0.9 + dg * 0.55);
      const i = (y * S + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = Math.round(a * 255);
    }
  g.putImageData(img, 0, 0);
  starTex = new THREE.CanvasTexture(c);
  starTex.colorSpace = THREE.SRGBColorSpace;
  return starTex;
}

let lineTex: THREE.CanvasTexture | null = null;
/** across a line of light: a bright core fading to nothing at the edges */
function lineTexture(): THREE.Texture {
  if (lineTex) return lineTex;
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.35)');
  grad.addColorStop(0.5, 'rgba(255,255,255,1)');
  grad.addColorStop(0.65, 'rgba(255,255,255,0.35)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 64);
  lineTex = new THREE.CanvasTexture(c);
  return lineTex;
}

/** a star sprite (additive, HDR colour so it blooms) */
export function starSprite(color: THREE.ColorRepresentation, size: number, gain = 2.4): THREE.Sprite {
  const m = new THREE.SpriteMaterial({ map: starTexture(), color: new THREE.Color(color).multiplyScalar(gain), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const s = new THREE.Sprite(m);
  s.scale.setScalar(size);
  s.frustumCulled = false;
  s.renderOrder = 8;
  return s;
}

function rgb(color: THREE.ColorRepresentation): THREE.Color {
  return new THREE.Color(color);
}

/** a burst of starlight: a flash, eight rays, a ring, a few motes drifting off */
export function starBurst(g: Game, p: THREE.Vector3, scale = 1, color: THREE.ColorRepresentation = STAR_GOLD): void {
  const c = rgb(color);
  const glow = g.engine.glow;
  glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.8 * scale, sizeEnd: 2.6 * scale, life: 0.22, r: 1, g: 0.97, b: 0.9, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.5 * scale, sizeEnd: 3.4 * scale, life: 0.3, r: c.r, g: c.g, b: c.b, alpha: 0.8, alphaEnd: 0, tex: TEX_RING });
  const cam = g.engine.gr.camera;
  const right = _u.setFromMatrixColumn(cam.matrixWorld, 0).clone();
  const up = _w.setFromMatrixColumn(cam.matrixWorld, 1).clone();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const long = i % 2 === 0;
    const sp = (long ? 22 : 12) * scale;
    const d = right.clone().multiplyScalar(Math.cos(a)).addScaledVector(up, Math.sin(a));
    glow.spawn({ x: p.x, y: p.y, z: p.z, vx: d.x * sp, vy: d.y * sp, vz: d.z * sp, size: 0.16 * scale, sizeEnd: 0.04, life: 0.2, r: 1, g: 0.95, b: 0.8, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 8 });
  }
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * Math.PI * 2, e = Math.random() * 2 - 0.6;
    const v = (2 + Math.random() * 4) * scale;
    glow.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * v, vy: e * v * 0.6 + 1, vz: Math.sin(a) * v, size: 0.1 * scale, sizeEnd: 0.02, life: 0.6 + Math.random() * 0.5, r: c.r, g: c.g, b: c.b, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, drag: 2 });
  }
}

/** motes of starlight drifting up from a body (releases, the night's healing) */
export function starMotes(g: Game, f: Fighter, n: number, color: THREE.ColorRepresentation = STAR_GOLD, spread = 0.6): void {
  const c = rgb(color);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * spread;
    g.engine.glow.spawn({ x: f.pos.x + Math.cos(a) * r, y: f.pos.y + Math.random() * f.def.height, z: f.pos.z + Math.sin(a) * r, vx: 0, vy: 0.8 + Math.random() * 1.4, vz: 0, size: 0.07 + Math.random() * 0.06, sizeEnd: 0.01, life: 0.9 + Math.random() * 0.8, r: c.r, g: c.g, b: c.b, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, drag: 0.6 });
  }
}

// ------------------------------------------------------------------------------------------------ star shots

export interface StarShotOpts {
  damage: number;
  speed: number;
  /** steering toward the target (rad/s); 0 = straight */
  turn: number;
  /** burst radius (m) and its carve power */
  blast: number;
  power: number;
  size: number;
  color: THREE.ColorRepresentation;
  range?: number;
  /** a float before it starts homing (s) */
  hang?: number;
  /** a long streak of light rather than a round star (the archer's arrows) */
  arrow?: boolean;
  unblockable?: boolean;
  onHit?: (f: Fighter) => void;
}

/** A star thrown from the hand or the blade: it hangs a moment, homes on its target, bursts on whatever it meets. */
export class StarShot implements Projectile {
  done = false;
  readonly pos: THREE.Vector3;
  readonly vel: THREE.Vector3;
  private sprite: THREE.Sprite;
  private light: THREE.PointLight;
  private t = 0;
  private travelled = 0;
  private c: THREE.Color;

  constructor(private g: Game, private owner: Fighter, origin: THREE.Vector3, dir: THREE.Vector3, private target: Fighter | null, readonly o: StarShotOpts) {
    this.pos = origin.clone();
    this.vel = dir.clone().normalize().multiplyScalar(o.speed);
    this.c = rgb(o.color);
    this.sprite = starSprite(o.color, o.size * (o.arrow ? 1.6 : 2.4));
    this.light = new THREE.PointLight(this.c, 3 * o.size, 6 + o.size * 6, 1.6);
    g.engine.gr.scene.add(this.sprite, this.light);
    this.sprite.position.copy(this.pos);
    this.light.position.copy(this.pos);
  }

  reject(at: THREE.Vector3, radius: number, by: Fighter): boolean {
    if (this.done || by.team === this.owner.team || this.pos.distanceTo(at) > radius) return false;
    this.done = true;
    return true;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const o = this.o;
    const hang = o.hang ?? 0;
    if (this.t < hang) {
      // drifting out, slowing, before it turns on the target
      this.pos.addScaledVector(this.vel, dt * 0.35);
      this.vel.multiplyScalar(Math.exp(-dt * 3));
      return;
    }
    const tg = this.target;
    if (o.turn > 0 && tg && !tg.dead) {
      const want = tg.seenCenter(_v).sub(this.pos).normalize().multiplyScalar(o.speed);
      this.vel.lerp(want, Math.min(1, o.turn * dt)).setLength(o.speed);
    } else if (this.vel.lengthSq() < o.speed * o.speed * 0.9) this.vel.setLength(o.speed);
    const step = this.vel.length() * dt;
    const dir = _w.copy(this.vel).normalize();
    const hit = raycastVoxels(g.engine.world, this.pos.x, this.pos.y, this.pos.z, dir.x, dir.y, dir.z, step + o.size * 0.4);
    if (hit) {
      this.pos.addScaledVector(dir, hit.dist);
      this.burst(g, null);
      return;
    }
    for (const f of g.enemiesOf(this.owner)) {
      const cy = Math.max(f.pos.y + 0.2, Math.min(f.pos.y + f.def.height - 0.2, this.pos.y));
      if (Math.hypot(f.pos.x - this.pos.x, cy - this.pos.y, f.pos.z - this.pos.z) < f.def.radius + o.size * 0.7) {
        this.burst(g, f);
        return;
      }
    }
    this.pos.addScaledVector(dir, step);
    this.travelled += step;
    // a tail of light
    g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, vx: -dir.x * (o.arrow ? 30 : 6), vy: -dir.y * (o.arrow ? 30 : 6), vz: -dir.z * (o.arrow ? 30 : 6), size: o.size * (o.arrow ? 0.7 : 0.9), sizeEnd: 0.03, life: o.arrow ? 0.12 : 0.24, r: this.c.r, g: this.c.g, b: this.c.b, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: o.arrow ? 6 : 2.5 });
    if (this.travelled > (o.range ?? 80)) this.burst(g, null);
  }

  render(): void {
    this.sprite.position.copy(this.pos);
    this.light.position.copy(this.pos);
    const k = 1 + Math.sin(this.t * 30) * 0.12;
    this.sprite.scale.setScalar(this.o.size * (this.o.arrow ? 1.6 : 2.4) * k);
    (this.sprite.material as THREE.SpriteMaterial).rotation = this.t * 3;
  }

  private burst(g: Game, direct: Fighter | null): void {
    if (this.done) return;
    this.done = true;
    const p = this.pos;
    const R = this.o.blast;
    for (const f of g.enemiesOf(this.owner)) {
      const d = f === direct ? 0 : f.center().distanceTo(p);
      if (d > R + f.def.radius) continue;
      const k = 1 - Math.min(1, d / (R + f.def.radius)) * 0.5;
      const dir = new THREE.Vector3().subVectors(f.pos, p).setY(0);
      if (dir.lengthSq() < 1e-4) dir.copy(this.vel).setY(0);
      dir.normalize();
      g.damage(f, this.o.damage * k, this.owner, dir, { energy: true, knock: 5 + R * 3, launch: 1 + R, heavy: R >= 1.5, hitstop: 0.05, shake: 0.2 + R * 0.08, unblockable: this.o.unblockable, color: this.o.color });
      this.o.onHit?.(f);
    }
    if (R > 0.4) g.engine.destruction.carve(new SphereShape(p.clone(), R * 0.85, 0.9), { mode: 'explode', power: this.o.power, impulse: 6 + R * 3, sparks: [1, 0.9, 0.6] });
    starBurst(g, p, 0.5 + R * 0.45, this.o.color);
    g.sfx.play(R > 1.5 ? 'explode' : 'ting', p, Math.min(1.6, 0.5 + R * 0.3));
    if (R > 1.2) g.addRing(p.clone(), R * 2.6, this.o.color, 0.35);
  }

  dispose(): void {
    this.sprite.removeFromParent();
    (this.sprite.material as THREE.Material).dispose();
    this.light.removeFromParent();
  }
}

// ------------------------------------------------------------------------------------------------ marks

/** Star marks set on fighters by the Shikai's cuts: small stars circling the chest, one per mark. */
export class StarMarks implements Projectile {
  done = false;
  private t = 0;
  readonly counts = new Map<number, { f: Fighter; n: number; age: number }>();
  private pool: THREE.Sprite[] = [];

  constructor(private g: Game, readonly owner: Fighter, readonly max = 7) {}

  add(f: Fighter, k = 1): number {
    const e = this.counts.get(f.id) ?? { f, n: 0, age: 0 };
    e.n = Math.min(this.max, e.n + k);
    e.age = 0;
    this.counts.set(f.id, e);
    return e.n;
  }

  count(f: Fighter): number {
    return this.counts.get(f.id)?.n ?? 0;
  }

  total(): number {
    let n = 0;
    for (const e of this.counts.values()) n += e.n;
    return n;
  }

  /** take every mark off a fighter; returns how many there were */
  take(f: Fighter): number {
    const n = this.count(f);
    this.counts.delete(f.id);
    return n;
  }

  clear(): void {
    this.counts.clear();
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (!g.fighters.includes(this.owner)) this.done = true;
    for (const [id, e] of this.counts) {
      e.age += dt;
      // marks fade after 14 s untouched, or with their bearer
      if (e.f.dead || e.age > 14) this.counts.delete(id);
    }
  }

  render(): void {
    let i = 0;
    for (const e of this.counts.values()) {
      const c = e.f.center(_v);
      for (let k = 0; k < e.n; k++) {
        let s = this.pool[i];
        if (!s) {
          s = starSprite(STAR_GOLD, 0.22, 2.2);
          this.g.engine.gr.scene.add(s);
          this.pool.push(s);
        }
        const a = this.t * 2.2 + (k / e.n) * Math.PI * 2;
        const r = e.f.def.radius + 0.35;
        s.position.set(c.x + Math.cos(a) * r, c.y + 0.25 + Math.sin(this.t * 3 + k) * 0.12, c.z + Math.sin(a) * r);
        s.scale.setScalar(0.22 + 0.05 * Math.sin(this.t * 9 + k * 2));
        s.visible = true;
        i++;
      }
    }
    for (; i < this.pool.length; i++) this.pool[i].visible = false;
  }

  dispose(): void {
    for (const s of this.pool) {
      s.removeFromParent();
      (s.material as THREE.Material).dispose();
    }
  }
}

// ------------------------------------------------------------------------------------------------ lines of light

/**
 * Lines of light between points (constellation lines, the cut joining the marks, the trail of Ryūsei): camera-facing
 * ribbons rebuilt every frame. `pts` may move (getters); each line draws in over `drawIn` seconds from its first end.
 */
export class StarLines implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.Mesh;
  private geo: THREE.BufferGeometry;
  private pos: Float32Array;
  private mat: THREE.MeshBasicMaterial;

  constructor(private g: Game, readonly segs: { a: () => THREE.Vector3; b: () => THREE.Vector3; delay?: number }[], readonly o: { width: number; color: THREE.ColorRepresentation; life: number; drawIn?: number; gain?: number }) {
    const n = segs.length;
    this.pos = new Float32Array(n * 4 * 3);
    const uv = new Float32Array(n * 4 * 2);
    const idx: number[] = [];
    for (let i = 0; i < n; i++) {
      uv.set([0, 0, 1, 0, 1, 1, 0, 1], i * 8);
      idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
    }
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    this.geo.setIndex(idx);
    this.mat = new THREE.MeshBasicMaterial({ map: lineTexture(), color: rgb(o.color).multiplyScalar(o.gain ?? 2.2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
    this.mesh = new THREE.Mesh(this.geo, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 7;
    g.engine.gr.scene.add(this.mesh);
  }

  update(dt: number): void {
    this.t += dt;
    if (this.t > this.o.life) this.done = true;
  }

  render(): void {
    const cam = this.g.engine.gr.camera;
    const drawIn = this.o.drawIn ?? 0.15;
    this.segs.forEach((s, i) => {
      const a = s.a(), b0 = s.b();
      const k = Math.max(0, Math.min(1, (this.t - (s.delay ?? 0)) / drawIn));
      const b = _v.copy(a).lerp(b0, k);
      const d = _w.subVectors(b, a);
      const view = _u.subVectors(cam.position, a);
      const side = d.clone().cross(view).normalize().multiplyScalar(k > 0 ? this.o.width / 2 : 0);
      const P = this.pos;
      const o = i * 12;
      P[o] = a.x - side.x; P[o + 1] = a.y - side.y; P[o + 2] = a.z - side.z;
      P[o + 3] = b.x - side.x; P[o + 4] = b.y - side.y; P[o + 5] = b.z - side.z;
      P[o + 6] = b.x + side.x; P[o + 7] = b.y + side.y; P[o + 8] = b.z + side.z;
      P[o + 9] = a.x + side.x; P[o + 10] = a.y + side.y; P[o + 11] = a.z + side.z;
    });
    (this.geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    const fade = this.o.life - this.t;
    this.mat.opacity = Math.max(0, Math.min(1, fade / 0.35));
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.geo.dispose();
    this.mat.dispose();
  }
}

// ------------------------------------------------------------------------------------------------ the starlight dome

const DOME_FRAG = /* glsl */ `
uniform float uT; uniform float uA; uniform vec3 uC;
varying vec3 vN; varying vec3 vW; varying vec3 vL;
float h(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
void main() {
  vec3 v = normalize(cameraPosition - vW);
  float f = 1.0 - abs(dot(normalize(vN), v));
  float rim = pow(f, 2.2);
  // stars scattered over the shell, twinkling
  vec3 q = floor(vL * 9.0);
  float s = step(0.93, h(q)) * (0.5 + 0.5 * sin(uT * 6.0 + h(q + 3.1) * 40.0));
  vec3 lq = fract(vL * 9.0) - 0.5;
  s *= smoothstep(0.32, 0.0, length(lq));
  float a = uA * (0.08 + rim * 0.75 + s * 0.9);
  gl_FragColor = vec4(uC * (1.2 + rim * 1.2 + s * 2.0), a);
}`;

/** Tenmaku: a dome of starlight round a fighter. The kit makes it hold (no damage, shots undone, enemies pushed out). */
export class StarDome implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.Mesh;
  private u = { uT: { value: 0 }, uA: { value: 0 }, uC: { value: rgb('#FFE6A8') } };

  constructor(private g: Game, private owner: Fighter, readonly radius: number, readonly life: number, color: THREE.ColorRepresentation = '#FFE6A8') {
    this.u.uC.value = rgb(color);
    const mat = new THREE.ShaderMaterial({
      uniforms: this.u,
      vertexShader: 'varying vec3 vN; varying vec3 vW; varying vec3 vL; void main() { vL = position; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: DOME_FRAG,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 4), mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 6;
    g.engine.gr.scene.add(this.mesh);
  }

  /** inside the dome */
  holds(): boolean {
    return !this.done && this.t < this.life;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const c = this.owner.center(_v);
    if (this.holds()) {
      // shots that touch it are undone; enemies inside are thrown out
      g.rejectNear(c, this.radius, this.owner, false);
      for (const f of g.enemiesOf(this.owner)) {
        const d = _w.subVectors(f.pos, this.owner.pos).setY(0);
        const dist = d.length();
        if (dist > this.radius + f.def.radius) continue;
        if (dist < 1e-3) d.set(1, 0, 0);
        d.normalize();
        f.push.addScaledVector(d, 30 * dt * 8);
      }
    }
    if (this.t > this.life + 0.4 || this.owner.dead) this.done = true;
  }

  render(): void {
    const c = this.owner.center(_v);
    this.mesh.position.set(c.x, this.owner.pos.y + this.radius * 0.35, c.z);
    const grow = Math.min(1, this.t / 0.18);
    this.mesh.scale.set(this.radius * grow, this.radius * grow * 0.92, this.radius * grow);
    this.u.uT.value = this.t;
    this.u.uA.value = this.t < this.life ? grow : Math.max(0, 1 - (this.t - this.life) / 0.4);
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

// ------------------------------------------------------------------------------------------------ orbs

const ORB_FRAG = /* glsl */ `
uniform float uT; uniform float uA; uniform vec3 uCore; uniform vec3 uRim; uniform float uDark;
varying vec3 vN; varying vec3 vW;
void main() {
  vec3 v = normalize(cameraPosition - vW);
  float f = abs(dot(normalize(vN), v));
  float rim = pow(1.0 - f, 2.0);
  vec3 col = mix(uCore * 2.4, uRim * 1.8, rim);
  // a dark star: black in the middle, a burning edge
  col = mix(col, uRim * 2.2 * rim, uDark);
  float a = uA * mix(0.55 + f * 0.45, 0.25 + rim, uDark);
  gl_FragColor = vec4(col, a);
}`;

function orbMaterial(core: THREE.ColorRepresentation, rim: THREE.ColorRepresentation, dark = 0, additive = true): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uA: { value: 1 }, uCore: { value: rgb(core) }, uRim: { value: rgb(rim) }, uDark: { value: dark } },
    vertexShader: 'varying vec3 vN; varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: ORB_FRAG,
    transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
}

/**
 * Kasei: a star forms above the target, swells, draws everyone (and the loose debris) into it, then bursts.
 */
export class CalamityStar implements Projectile {
  done = false;
  private t = 0;
  private orb: THREE.Mesh;
  private sprite: THREE.Sprite;
  private light: THREE.PointLight;
  private blown = false;

  constructor(private g: Game, private owner: Fighter, readonly at: THREE.Vector3, readonly o: { damage: number; radius: number; pull: number; reach: number; grow: number; hold: number }) {
    this.orb = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), orbMaterial('#FFF2C8', '#FF9E4A'));
    this.orb.frustumCulled = false;
    this.orb.renderOrder = 7;
    this.sprite = starSprite(STAR_GOLD, 1, 2.6);
    this.light = new THREE.PointLight('#FFC27A', 0, 40, 1.4);
    g.engine.gr.scene.add(this.orb, this.sprite, this.light);
    for (const m of [this.orb, this.sprite, this.light]) m.position.copy(at);
    g.sfx.play('charge', at, 1);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const o = this.o;
    if (this.blown) {
      if (this.t > o.grow + o.hold + 0.6) this.done = true;
      return;
    }
    if (this.t > o.grow) {
      // the pull: everyone in reach drawn toward the star
      for (const f of g.enemiesOf(this.owner)) {
        const d = _v.subVectors(this.at, f.center(_w));
        const dist = d.length();
        if (dist > o.reach || dist < 0.6) continue;
        const k = o.pull * (1 - dist / o.reach) * (f.def.boss ? 0.15 : 1);
        d.normalize();
        // lifted toward the star as well as drawn in
        if (!f.def.boss && d.y > 0) f.body.vel.y = Math.max(f.body.vel.y, d.y * k * 0.6);
        f.push.addScaledVector(d.setY(0), k * dt * 10);
        f.hovering = false;
      }
      // dust and light streaming in
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.3) * 1.2;
        const r = o.reach * (0.4 + Math.random() * 0.6);
        const p = _v.set(this.at.x + Math.cos(a) * r, this.at.y + e * r * 0.5, this.at.z + Math.sin(a) * r);
        const vel = _w.subVectors(this.at, p).multiplyScalar(1.6);
        g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: vel.x, vy: vel.y, vz: vel.z, size: 0.16, sizeEnd: 0.04, life: 0.6, r: 1, g: 0.8, b: 0.45, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
      }
    }
    if (this.t >= o.grow + o.hold) this.blow(g);
  }

  private blow(g: Game): void {
    this.blown = true;
    const p = this.at;
    const R = this.o.radius;
    for (const f of g.enemiesOf(this.owner)) {
      const d = f.center(_v).distanceTo(p);
      if (d > R * 1.6 + f.def.radius) continue;
      const k = 1 - Math.min(1, d / (R * 1.6)) * 0.5;
      const dir = new THREE.Vector3().subVectors(f.pos, p).setY(0);
      if (dir.lengthSq() < 1e-4) dir.set(1, 0, 0);
      dir.normalize();
      g.damage(f, this.o.damage * k, this.owner, dir, { energy: true, knock: 22, launch: 12, heavy: true, hitstop: 0.14, shake: 0.8, color: STAR_GOLD });
    }
    g.engine.destruction.carve(new SphereShape(p.clone(), R, 0.85), { mode: 'explode', power: 2500, impulse: 18, sparks: [1, 0.85, 0.5] });
    starBurst(g, p, 3.2, STAR_GOLD);
    g.addRing(p.clone(), R * 3.5, '#FFC27A', 0.6);
    g.sfx.play('explode', p, 2);
    g.shake(0.9);
  }

  render(): void {
    const o = this.o;
    const grow = Math.min(1, this.t / o.grow);
    const s = this.blown ? Math.max(0, 1 - (this.t - o.grow - o.hold) / 0.25) * 2.8 : 0.3 + grow * 1.5 + Math.sin(this.t * 20) * 0.08;
    this.orb.scale.setScalar(Math.max(0.01, s));
    this.sprite.scale.setScalar(Math.max(0.01, s * 4));
    (this.sprite.material as THREE.SpriteMaterial).rotation = this.t * 1.5;
    this.light.intensity = this.blown ? 0 : 10 * grow;
  }

  dispose(): void {
    this.orb.removeFromParent();
    this.orb.geometry.dispose();
    (this.orb.material as THREE.Material).dispose();
    this.sprite.removeFromParent();
    (this.sprite.material as THREE.Material).dispose();
    this.light.removeFromParent();
  }
}

/**
 * Kuro-boshi: a collapsing black star. It draws everyone in, bleeds whoever is at its edge, swallows the enemy's shots
 * and the ground round it, then bursts.
 */
export class BlackStar implements Projectile {
  done = false;
  private t = 0;
  private core: THREE.Mesh;
  private halo: THREE.Mesh;
  private disc: THREE.Mesh;
  private discMat: THREE.ShaderMaterial;
  private eatT = 0;
  private blown = false;
  /** shots swallowed */
  swallowed = 0;

  constructor(private g: Game, private owner: Fighter, readonly at: THREE.Vector3, readonly o: { life: number; reach: number; pull: number; drain: number; damage: number; radius: number }) {
    this.core = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), new THREE.MeshBasicMaterial({ color: '#08070E', fog: false }));
    this.halo = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), orbMaterial('#FFD9A0', '#FF8A3A', 1));
    this.discMat = new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uA: { value: 1 } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform float uT; uniform float uA; varying vec2 vUv;
        void main() { vec2 p = vUv - 0.5; float r = length(p) * 2.0; float a = atan(p.y, p.x);
          float band = smoothstep(0.36, 0.5, r) * smoothstep(1.0, 0.62, r);
          float swirl = 0.6 + 0.4 * sin(a * 5.0 - uT * 7.0 + r * 14.0);
          vec3 c = mix(vec3(2.6, 1.9, 1.1), vec3(1.6, 0.5, 0.15), smoothstep(0.45, 0.95, r));
          gl_FragColor = vec4(c, uA * band * swirl); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    this.disc = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.discMat);
    for (const m of [this.core, this.halo, this.disc]) {
      m.frustumCulled = false;
      m.position.copy(at);
      g.engine.gr.scene.add(m);
    }
    this.core.renderOrder = 6;
    this.halo.renderOrder = 7;
    this.disc.renderOrder = 7;
    g.sfx.play('charge', at, 1.2);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const o = this.o;
    if (this.blown) {
      if (this.t > o.life + 0.6) this.done = true;
      return;
    }
    const grow = Math.min(1, this.t / 0.5);
    // swallow the enemy's shots
    this.swallowed += g.rejectNear(this.at, 3 + 4 * grow, this.owner, false);
    for (const f of g.enemiesOf(this.owner)) {
      const d = _v.subVectors(this.at, f.center(_w));
      const dist = d.length();
      if (dist > o.reach) continue;
      const k = o.pull * (1 - dist / o.reach) * grow * (f.def.boss ? 0.15 : 1);
      d.normalize();
      f.push.addScaledVector(_u.copy(d).setY(0), k * dt * 10);
      if (!f.def.boss && d.y > 0) f.body.vel.y = Math.max(f.body.vel.y, d.y * k * 0.5);
      f.hovering = false;
      if (dist < 2.6) g.drain(f, o.drain * dt, this.owner);
    }
    // the ground round it torn away and swallowed (no debris: it goes in)
    this.eatT -= dt;
    if (this.eatT <= 0) {
      this.eatT = 0.4;
      g.engine.destruction.carve(new SphereShape(this.at.clone(), 1.4 + grow * 1.4, 1), { mode: 'erase', power: 4000, noCollapse: false });
    }
    // matter and light spiralling in
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 3 + Math.random() * 5;
      const p = _v.set(this.at.x + Math.cos(a) * r, this.at.y + (Math.random() - 0.5) * 2, this.at.z + Math.sin(a) * r);
      const tang = _w.set(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(6);
      const inward = _u.subVectors(this.at, p).multiplyScalar(1.2).add(tang);
      if (i % 2) g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: inward.x, vy: inward.y, vz: inward.z, size: 0.14, sizeEnd: 0.03, life: 0.5, r: 1, g: 0.7, b: 0.35, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: 2.5 });
      else g.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, vx: inward.x, vy: inward.y, vz: inward.z, size: 0.4, sizeEnd: 0.1, life: 0.6, r: 0.18, g: 0.15, b: 0.2, alpha: 0.6, alphaEnd: 0, tex: TEX_PUFF });
    }
    if (this.t >= o.life) this.blow(g);
  }

  private blow(g: Game): void {
    this.blown = true;
    const p = this.at;
    const R = this.o.radius;
    for (const f of g.enemiesOf(this.owner)) {
      const d = f.center(_v).distanceTo(p);
      if (d > R + f.def.radius) continue;
      const dir = new THREE.Vector3().subVectors(f.pos, p).setY(0);
      if (dir.lengthSq() < 1e-4) dir.set(1, 0, 0);
      dir.normalize();
      g.damage(f, this.o.damage * (1 - Math.min(1, d / R) * 0.5), this.owner, dir, { energy: true, knock: 26, launch: 14, heavy: true, hitstop: 0.16, shake: 0.9, color: '#FF9E4A' });
    }
    g.engine.destruction.carve(new SphereShape(p.clone(), R * 0.8, 0.9), { mode: 'explode', power: 3000, impulse: 20 });
    starBurst(g, p, 3.6, '#FFB86A');
    g.addRing(p.clone(), R * 3, '#FF9E4A', 0.6);
    g.sfx.play('explode', p, 2);
    g.shake(1);
  }

  render(): void {
    const o = this.o;
    const grow = Math.min(1, this.t / 0.5);
    const end = this.blown ? Math.max(0, 1 - (this.t - o.life) / 0.2) : 1;
    const r = (0.6 + grow * 1.0 + Math.sin(this.t * 14) * 0.04) * end;
    this.core.scale.setScalar(Math.max(0.01, r));
    this.halo.scale.setScalar(Math.max(0.01, r * 1.25));
    const cam = this.g.engine.gr.camera;
    // the disc tilted a little toward the camera so it always reads
    this.disc.quaternion.copy(cam.quaternion);
    this.disc.rotateX(-1.0);
    this.disc.scale.setScalar(Math.max(0.01, r * 6));
    this.discMat.uniforms.uT.value = this.t;
    this.discMat.uniforms.uA.value = end;
  }

  dispose(): void {
    for (const m of [this.core, this.halo, this.disc]) {
      m.removeFromParent();
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    }
  }
}

/** Chōshinsei: a star detonated at a point — a white-gold sphere swelling out, rings, a crater. */
export class Supernova implements Projectile {
  done = false;
  private t = 0;
  private orb: THREE.Mesh;
  private mat: THREE.ShaderMaterial;
  private blown = false;

  constructor(private g: Game, private owner: Fighter, readonly at: THREE.Vector3, readonly o: { damage: number; radius: number; delay: number; power: number }) {
    this.mat = orbMaterial('#FFFBEA', '#FF9E4A');
    this.orb = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 4), this.mat);
    this.orb.frustumCulled = false;
    this.orb.renderOrder = 7;
    this.orb.position.copy(at);
    g.engine.gr.scene.add(this.orb);
    g.sfx.play('charge', at, 1.4);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (!this.blown && this.t >= this.o.delay) {
      this.blown = true;
      const p = this.at, R = this.o.radius;
      for (const f of g.enemiesOf(this.owner)) {
        const d = f.center(_v).distanceTo(p);
        if (d > R * 1.2 + f.def.radius) continue;
        const dir = new THREE.Vector3().subVectors(f.pos, p).setY(0);
        if (dir.lengthSq() < 1e-4) dir.set(1, 0, 0);
        dir.normalize();
        g.damage(f, this.o.damage * (1 - Math.min(1, d / (R * 1.2)) * 0.4), this.owner, dir, { energy: true, knock: 34, launch: 18, heavy: true, hitstop: 0.2, shake: 1.4, unblockable: true, color: '#FFE3A0' });
      }
      g.engine.destruction.carve(new SphereShape(p.clone(), R, 0.8), { mode: 'explode', power: this.o.power, impulse: 26, dust: 1.4 });
      for (let i = 0; i < 3; i++) g.addRing(p.clone(), R * (2.2 + i * 1.3), i === 1 ? '#FFB86A' : '#FFF2C8', 0.5 + i * 0.25);
      starBurst(g, p, 5, '#FFE3A0');
      for (let i = 0; i < 60; i++) {
        const a = Math.random() * Math.PI * 2, e = Math.random() * 2 - 0.4;
        const v = 14 + Math.random() * 20;
        g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * v, vy: e * v * 0.5, vz: Math.sin(a) * v, size: 0.3, sizeEnd: 0.05, life: 0.8 + Math.random() * 0.6, r: 1, g: 0.85, b: 0.55, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 1.4 });
      }
      g.sfx.play('explode', p, 2.4);
      g.sfx.play('roarBig', p, 0.5);
      g.shake(1.4);
    }
    if (this.t > this.o.delay + 1.0) this.done = true;
  }

  render(): void {
    const o = this.o;
    let s: number, a: number;
    if (this.t < o.delay) {
      // the star pressed small and bright, trembling
      s = 0.4 + Math.sin(this.t * 60) * 0.06;
      a = 1;
    } else {
      const k = (this.t - o.delay) / 1.0;
      s = o.radius * (1 - Math.pow(1 - Math.min(1, k * 2.2), 3));
      a = Math.max(0, 1 - k);
    }
    this.orb.scale.setScalar(Math.max(0.01, s));
    this.mat.uniforms.uA.value = a;
  }

  dispose(): void {
    this.orb.removeFromParent();
    this.orb.geometry.dispose();
    this.mat.dispose();
  }
}

// ------------------------------------------------------------------------------------------------ the night

/**
 * Hoshifuru Yoru: the night falls over the whole field. The sky is tinted to night; a dome of stars and the Milky Way
 * ride round the camera (above the fog, behind everything); stars fall across it; the morning star burns low on the
 * horizon. `end()` lets the day back.
 */
export class NightSky implements Projectile {
  done = false;
  private t = 0;
  readonly sky: SkyTint;
  private points: THREE.Points;
  private mat: THREE.ShaderMaterial;
  private venus: THREE.Sprite;
  private fadeT = -1;
  private shootT = 0.5;
  private baseStars: number | null = null;
  level = 0;

  constructor(private g: Game, readonly owner: Fighter, look: SkyLook = SKY_NIGHT) {
    this.sky = new SkyTint(g, look, 1.6);
    g.addProjectile(this.sky);
    // the stars: an even scatter over the upper sky and a dense band along a great circle (the Milky Way)
    const N = 1600, M = 1400;
    const pos = new Float32Array((N + M) * 3), col = new Float32Array((N + M) * 3), size = new Float32Array(N + M), ph = new Float32Array(N + M);
    const tints = [[1, 1, 1], [0.8, 0.88, 1], [1, 0.9, 0.7], [0.7, 0.8, 1]];
    const band = new THREE.Vector3(0.3, 0.2, 1).normalize();
    const bx = new THREE.Vector3().crossVectors(band, UP).normalize();
    const by = new THREE.Vector3().crossVectors(bx, band).normalize();
    for (let i = 0; i < N + M; i++) {
      let d: THREE.Vector3;
      if (i < N) {
        const y = Math.random() * 1.05 - 0.05;
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        d = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
      } else {
        const a = Math.random() * Math.PI * 2;
        const off = (Math.random() + Math.random() + Math.random() - 1.5) * 0.16;
        d = bx.clone().multiplyScalar(Math.cos(a)).addScaledVector(by, Math.sin(a)).addScaledVector(band, off).normalize();
        if (d.y < -0.05) d.y = -d.y;
      }
      pos.set([d.x, d.y, d.z], i * 3);
      const tint = tints[Math.floor(Math.random() * tints.length)];
      const bright = i < N ? 0.6 + Math.random() * 1.6 : 0.35 + Math.random() * 0.7;
      col.set([tint[0] * bright, tint[1] * bright, tint[2] * bright], i * 3);
      size[i] = i < N ? (Math.random() < 0.06 ? 5 + Math.random() * 3 : 1.6 + Math.random() * 2) : 1.2 + Math.random() * 1.6;
      ph[i] = Math.random() * 100;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(size, 1));
    geo.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uA: { value: 0 }, uR: { value: 600 }, uMap: { value: starTexture() }, uPx: { value: 1 } },
      vertexShader: `attribute vec3 color; attribute float size; attribute float phase; uniform float uT; uniform float uR; uniform float uPx;
        varying vec3 vC; varying float vTw;
        void main() { vC = color; vTw = 0.65 + 0.35 * sin(uT * (1.5 + fract(phase) * 3.0) + phase);
          vec4 w = vec4(cameraPosition + position * uR, 1.0);
          gl_Position = projectionMatrix * viewMatrix * w; gl_PointSize = size * uPx * (0.8 + vTw * 0.4); }`,
      fragmentShader: `uniform float uA; uniform sampler2D uMap; varying vec3 vC; varying float vTw;
        void main() { vec4 t = texture2D(uMap, gl_PointCoord); gl_FragColor = vec4(vC * 1.6 * vTw, t.a * uA); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(geo, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = -4;
    // the morning star, low in the east
    this.venus = starSprite('#FFF4D6', 1, 3);
    this.venus.renderOrder = -3;
    g.engine.gr.scene.add(this.points, this.venus);
  }

  /** the day comes back */
  end(): void {
    if (this.fadeT < 0) this.fadeT = 0;
    this.sky.target = 0;
  }

  get ending(): boolean {
    return this.fadeT >= 0;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    // the night ends with the one who called it
    if (this.fadeT < 0 && (this.owner.dead || !g.fighters.includes(this.owner))) this.end();
    if (this.fadeT >= 0) {
      this.fadeT += dt;
      this.level = Math.max(0, 1 - this.fadeT / 1.6);
      if (this.fadeT > 1.8) this.done = true;
    } else this.level = Math.min(1, this.t / 1.6);
    // the sky's own faint stars come out with the night
    const u = g.engine.gr.sky.uniforms;
    if (this.baseStars === null) this.baseStars = u.uStars.value as number;
    u.uStars.value = this.baseStars + (1 - this.baseStars) * this.level;
    // stars falling across the sky
    this.shootT -= dt;
    if (this.shootT <= 0 && this.level > 0.5) {
      this.shootT = 0.25 + Math.random() * 0.7;
      const cam = g.engine.gr.camera.position;
      const a = Math.random() * Math.PI * 2;
      const p = _v.set(cam.x + Math.cos(a) * 140, cam.y + 70 + Math.random() * 60, cam.z + Math.sin(a) * 140);
      const dir = _w.set(-Math.sin(a + 0.6) * 0.9, -0.45, Math.cos(a + 0.6) * 0.9).normalize();
      const sp = 120 + Math.random() * 80;
      const c = Math.random() < 0.3 ? [0.75, 0.85, 1] : [1, 0.95, 0.8];
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: dir.x * sp, vy: dir.y * sp, vz: dir.z * sp, size: 1.4, sizeEnd: 0.3, life: 0.55, r: c[0] * 1.6, g: c[1] * 1.6, b: c[2] * 1.6, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2.2 });
    }
  }

  render(): void {
    const gr = this.g.engine.gr;
    this.mat.uniforms.uT.value = this.t;
    this.mat.uniforms.uA.value = this.level;
    this.mat.uniforms.uPx.value = Math.max(1, gr.renderer.getPixelRatio() * (gr.renderer.domElement.height / 900));
    this.mat.uniforms.uR.value = Math.min(800, gr.camera.far * 0.8);
    const cam = gr.camera.position;
    const d = _v.set(-0.82, 0.16, -0.55).normalize();
    this.venus.position.copy(cam).addScaledVector(d, 420);
    this.venus.scale.setScalar(26 * (0.9 + 0.1 * Math.sin(this.t * 3)));
    (this.venus.material as THREE.SpriteMaterial).opacity = this.level;
  }

  dispose(): void {
    this.points.removeFromParent();
    this.points.geometry.dispose();
    this.mat.dispose();
    this.venus.removeFromParent();
    (this.venus.material as THREE.Material).dispose();
    this.sky.target = 0;
    if (this.baseStars !== null) this.g.engine.gr.sky.uniforms.uStars.value = this.baseStars;
  }
}

/** Ryūseigun: a star falls out of the sky on a point — a burning head, a long tail, a crater. */
export class FallingStar implements Projectile {
  done = false;
  private t = 0;
  private head: THREE.Sprite;
  private from: THREE.Vector3;
  private pos = new THREE.Vector3();
  private landed = false;

  constructor(private g: Game, private owner: Fighter, readonly at: THREE.Vector3, readonly o: { damage: number; radius: number; power: number; fall: number; color?: THREE.ColorRepresentation; track?: Fighter }) {
    const side = _v.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
    this.from = at.clone().addScaledVector(side, 24 + Math.random() * 14).add(_w.set(0, 70 + Math.random() * 20, 0));
    this.pos.copy(this.from);
    this.head = starSprite(o.color ?? '#FFF0C8', 3, 3);
    g.engine.gr.scene.add(this.head);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.landed) {
      if (this.t > this.o.fall + 0.3) this.done = true;
      return;
    }
    const k = Math.min(1, this.t / this.o.fall);
    // a star that follows its mark down: the landing point slides after the target
    const tr = this.o.track;
    if (tr && !tr.dead && k < 0.85) {
      const d = Math.min(1, dt * 6);
      this.at.x += (tr.pos.x - this.at.x) * d;
      this.at.z += (tr.pos.z - this.at.z) * d;
      this.at.y += (tr.pos.y - this.at.y) * d;
    }
    const prev = _u.copy(this.pos);
    this.pos.lerpVectors(this.from, this.at, k * k);
    const vel = _w.subVectors(this.pos, prev).divideScalar(Math.max(1e-4, dt));
    // the tail
    for (let i = 0; i < 3; i++) {
      const j = Math.random();
      const p = _v.copy(prev).lerp(this.pos, j);
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: -vel.x * 0.05, vy: -vel.y * 0.05, vz: -vel.z * 0.05, size: 1.1, sizeEnd: 0.2, life: 0.35, r: 1, g: 0.75 + Math.random() * 0.2, b: 0.45, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
    g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, vx: -vel.x * 0.3, vy: -vel.y * 0.3, vz: -vel.z * 0.3, size: 1.6, sizeEnd: 0.2, life: 0.25, r: 1.4, g: 1.3, b: 1.1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 1.5 });
    if (k >= 1) this.land(g);
  }

  private land(g: Game): void {
    this.landed = true;
    this.head.visible = false;
    const p = this.at, R = this.o.radius;
    for (const f of g.enemiesOf(this.owner)) {
      const d = f.center(_v).distanceTo(p);
      if (d > R * 1.6 + f.def.radius) continue;
      const dir = new THREE.Vector3().subVectors(f.pos, p).setY(0);
      if (dir.lengthSq() < 1e-4) dir.set(1, 0, 0);
      dir.normalize();
      g.damage(f, this.o.damage * (1 - Math.min(1, d / (R * 1.6)) * 0.5), this.owner, dir, { energy: true, knock: 6, launch: 4, heavy: true, hitstop: 0.08, shake: 0.6, color: STAR_GOLD });
    }
    g.engine.destruction.carve(new SphereShape(p.clone(), R, 0.8), { mode: 'explode', power: this.o.power, impulse: 14, dust: 1 });
    starBurst(g, p.clone().setY(p.y + 0.5), 2.2, '#FFE3A0');
    g.addRing(p.clone(), R * 2.8, '#FFC27A', 0.45);
    g.sfx.play('explode', p, 1.6);
    if (g.player && g.player.pos.distanceTo(p) < 40) g.shake(0.5);
  }

  render(): void {
    this.head.position.copy(this.pos);
    (this.head.material as THREE.SpriteMaterial).rotation = this.t * 4;
  }

  dispose(): void {
    this.head.removeFromParent();
    (this.head.material as THREE.Material).dispose();
  }
}

// ------------------------------------------------------------------------------------------------ constellations

export type ConstellationKind = 'orion' | 'sagittarius' | 'scorpius';

/** the figures' stars (x right, y up; metres at scale 1) and the lines joining them */
const FIGURES: Record<ConstellationKind, { stars: [number, number][]; lines: [number, number][]; hand: number; big: number[] }> = {
  // Betelgeuse 0, Bellatrix 1, Meissa 2, the belt 3-5, Saiph 6, Rigel 7, the club 8-10, the sword 11-12
  orion: {
    stars: [[-4, 10], [4, 9.5], [0, 13], [-1.5, 3], [0, 3.4], [1.5, 3.8], [-4, -5], [4.5, -4.6], [-6, 14], [-7, 17.5], [-5.5, 20], [0.2, 0.5], [0.4, -1.8]],
    lines: [[0, 2], [1, 2], [0, 3], [1, 5], [3, 4], [4, 5], [3, 6], [5, 7], [0, 8], [8, 9], [9, 10], [4, 11], [11, 12]],
    hand: 1, big: [0, 7, 4],
  },
  // the teapot and the archer's bow
  sagittarius: {
    stars: [[-5, 0], [-2, 1.5], [1, 1], [3.5, 3], [2.5, 6], [0, 7.5], [-2.5, 5], [-5.5, 4], [5.5, 0.5], [6.5, 5], [-8, 2]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 1], [6, 7], [7, 0], [2, 8], [3, 9], [0, 10]],
    hand: 5, big: [3, 5, 2],
  },
  // the scorpion's claws, heart (Antares) and the long curled tail, the stinger last
  scorpius: {
    stars: [[-9, 12], [-7, 14], [-6, 11], [-4, 10], [-1, 8.5], [1, 6], [2, 3], [2.5, 0], [4, -2.5], [6.5, -3.5], [8.5, -2], [9.5, 0.5], [8.5, 2.5]],
    lines: [[0, 2], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12]],
    hand: 12, big: [4, 12],
  },
};

/**
 * Seiza Shōkan: a constellation drawn up in the sky over a target, facing whoever called it — its stars light one by
 * one, the lines draw between them, then it strikes (the kit does the strike from `hand()` at `strikeAt`).
 */
export class Constellation implements Projectile {
  done = false;
  private t = 0;
  private sprites: THREE.Sprite[] = [];
  private lines: StarLines;
  private origin: THREE.Vector3;
  private right: THREE.Vector3;
  readonly fig: (typeof FIGURES)[ConstellationKind];

  constructor(private g: Game, readonly kind: ConstellationKind, center: THREE.Vector3, facing: THREE.Vector3, readonly scale: number, readonly life = 2.8, color: THREE.ColorRepresentation = '#DDE6FF') {
    this.fig = FIGURES[kind];
    this.origin = center.clone();
    const f = facing.clone().setY(0).normalize();
    this.right = new THREE.Vector3(-f.z, 0, f.x);
    const n = this.fig.stars.length;
    this.fig.stars.forEach((_, i) => {
      const s = starSprite(this.fig.big.includes(i) ? '#FFF2D0' : color, 0.01, 3);
      g.engine.gr.scene.add(s);
      this.sprites.push(s);
      s.userData.delay = (i / n) * 0.6;
      s.userData.size = (this.fig.big.includes(i) ? 3.2 : 2.0) * Math.sqrt(scale);
    });
    this.lines = new StarLines(g, this.fig.lines.map(([a, b]) => ({ a: () => this.star(a), b: () => this.star(b), delay: 0.25 + (Math.max(a, b) / n) * 0.6 })), { width: 0.35 * Math.sqrt(scale), color, life, drawIn: 0.2, gain: 1.6 });
    g.addProjectile(this.lines);
  }

  star(i: number, out = new THREE.Vector3()): THREE.Vector3 {
    const [x, y] = this.fig.stars[i];
    return out.copy(this.origin).addScaledVector(this.right, x * this.scale).addScaledVector(UP, y * this.scale);
  }

  /** the star the figure strikes from (Orion's raised hand, the bow's string, the stinger) */
  hand(out = new THREE.Vector3()): THREE.Vector3 {
    return this.star(this.fig.hand, out);
  }

  update(dt: number): void {
    this.t += dt;
    if (this.t > this.life) this.done = true;
  }

  render(): void {
    const fade = Math.max(0, Math.min(1, (this.life - this.t) / 0.4));
    this.sprites.forEach((s, i) => {
      const k = Math.max(0, Math.min(1, (this.t - s.userData.delay) / 0.15));
      this.star(i, s.position);
      s.scale.setScalar(Math.max(0.01, s.userData.size * k * (0.9 + 0.1 * Math.sin(this.t * 7 + i))));
      (s.material as THREE.SpriteMaterial).opacity = fade;
    });
  }

  dispose(): void {
    for (const s of this.sprites) {
      s.removeFromParent();
      (s.material as THREE.Material).dispose();
    }
    this.lines.done = true;
  }
}

/** Orion's sword: a blade of light many metres long swung down from the figure's hand onto a point. */
export class GiantSword implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.Mesh;
  private cut = false;

  constructor(private g: Game, readonly pivot: THREE.Vector3, readonly to: THREE.Vector3, readonly o: { swing: number; life: number; onCut: () => void }) {
    const len = pivot.distanceTo(to) * 1.08;
    const geo = new THREE.BoxGeometry(0.5, 1.6, len);
    geo.translate(0, 0, len / 2);
    this.mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: rgb('#FFF2C8').multiplyScalar(2.6), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 7;
    this.mesh.position.copy(pivot);
    g.engine.gr.scene.add(this.mesh);
  }

  update(dt: number): void {
    this.t += dt;
    if (!this.cut && this.t >= this.o.swing) {
      this.cut = true;
      this.o.onCut();
    }
    if (this.t > this.o.life) this.done = true;
  }

  render(): void {
    // raised straight up, then swung down onto the point
    const down = _v.subVectors(this.to, this.pivot).normalize();
    const up = _w.copy(UP);
    const k = Math.min(1, this.t / this.o.swing);
    const e = k * k * k;
    const dir = _u.copy(up).lerp(down, e).normalize();
    _m.lookAt(new THREE.Vector3(), dir, Math.abs(dir.y) > 0.95 ? new THREE.Vector3(1, 0, 0) : UP);
    _q.setFromRotationMatrix(_m);
    this.mesh.quaternion.copy(_q);
    // lookAt points −Z at the target: turn the blade (built along +Z) round
    this.mesh.rotateY(Math.PI);
    (this.mesh.material as THREE.MeshBasicMaterial).opacity = this.t > this.o.swing ? Math.max(0, 1 - (this.t - this.o.swing) / (this.o.life - this.o.swing)) : 0.95;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

// ------------------------------------------------------------------------------------------------ time and dawn

/** Hoshi no Toki: the field held still — a blue-gold veil over the screen, motes of light hanging in the air. */
export class TimeHalt implements Projectile {
  done = false;
  private t = 0;
  private el: HTMLDivElement | null = null;

  constructor(private g: Game, private owner: Fighter, readonly life: number, overlay: boolean) {
    if (overlay && typeof document !== 'undefined') {
      const el = document.createElement('div');
      el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:5;opacity:0;transition:opacity .25s;background:radial-gradient(ellipse at center, rgba(255,240,200,0) 45%, rgba(120,150,255,.28) 80%, rgba(255,200,120,.32) 100%);mix-blend-mode:screen;';
      document.body.appendChild(el);
      requestAnimationFrame(() => (el.style.opacity = '1'));
      this.el = el;
    }
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const c = this.owner.center(_v);
    for (let i = 0; i < 3; i++) {
      const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * 14;
      g.engine.glow.spawn({ x: c.x + Math.cos(a) * r, y: c.y + (Math.random() - 0.3) * 6, z: c.z + Math.sin(a) * r, size: 0.12, sizeEnd: 0.12, life: 1.4, r: 1, g: 0.92, b: 0.7, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
    if (this.t >= this.life || this.owner.dead) {
      this.done = true;
    }
  }

  dispose(): void {
    if (this.el) {
      const el = this.el;
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 300);
    }
  }
}

const DAWN_FRAG = /* glsl */ `
uniform float uT; uniform float uA; varying vec2 vUv;
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  float x = vUv.x, y = vUv.y;
  float edge = smoothstep(0.0, 0.08, x) * smoothstep(1.0, 0.92, x);
  float top = smoothstep(1.0, 0.55, y);
  float rays = 0.6 + 0.4 * h(vec2(floor(x * 90.0), floor(uT * 12.0)));
  vec3 low = vec3(2.8, 2.4, 1.8), high = vec3(2.2, 1.2, 0.7);
  vec3 c = mix(low, high, y);
  gl_FragColor = vec4(c * rays, uA * edge * top * (0.55 + 0.45 * (1.0 - y)));
}`;

/**
 * Akatsuki: a wall of dawn light swept out across everything ahead. Whoever it passes over takes the blow — nothing
 * blocks it — and along its middle it scorches a seam into the ground.
 */
export class DawnWall implements Projectile {
  done = false;
  private t = 0;
  private front = 0;
  private lastCut = 0;
  private sheet: THREE.Mesh;
  private mat: THREE.ShaderMaterial;
  private hits = new Set<number>();
  private right: THREE.Vector3;

  constructor(private g: Game, private owner: Fighter, readonly origin: THREE.Vector3, readonly fwd: THREE.Vector3, readonly o: { width: number; height: number; speed: number; range: number; damage: number }) {
    this.right = new THREE.Vector3(-fwd.z, 0, fwd.x);
    this.mat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uA: { value: 0 } }, vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: DAWN_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    const geo = new THREE.PlaneGeometry(o.width, o.height);
    geo.translate(0, o.height / 2 - 2, 0);
    this.sheet = new THREE.Mesh(geo, this.mat);
    this.sheet.frustumCulled = false;
    this.sheet.renderOrder = 6;
    _m.makeBasis(this.right, UP, fwd);
    this.sheet.quaternion.setFromRotationMatrix(_m);
    this.sheet.position.copy(origin);
    g.engine.gr.scene.add(this.sheet);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const o = this.o;
    const moving = this.front < o.range;
    if (moving) this.front = Math.min(o.range, this.front + o.speed * dt);
    this.sheet.position.copy(this.origin).addScaledVector(this.fwd, this.front);
    this.mat.uniforms.uT.value = this.t;
    this.mat.uniforms.uA.value = moving ? Math.min(1, this.t / 0.15) : Math.max(0, 1 - (this.t - o.range / o.speed) / 1.0);
    if (moving) {
      if (this.front - this.lastCut > 4) {
        const a = this.lastCut, b = this.front;
        const mid = this.origin.clone().addScaledVector(this.fwd, (a + b) / 2);
        _m.makeBasis(this.fwd, UP, this.right);
        _q.setFromRotationMatrix(_m);
        g.engine.destruction.carve(new BoxShape(mid.clone().setY(mid.y - 1), new THREE.Vector3((b - a) / 2 + 0.3, 3, 0.6), _q.clone()), { mode: 'burn', power: 1e6 });
        g.engine.destruction.carve(new SphereShape(mid.clone(), 2.6, 0.6), { mode: 'explode', power: 6000, impulse: 12, dust: 0.8, dir: this.fwd.clone() });
        this.lastCut = b;
      }
      for (let k = 0; k < 6; k++) {
        const s = (Math.random() - 0.5) * o.width * 0.9;
        const p = _v.copy(this.origin).addScaledVector(this.fwd, this.front).addScaledVector(this.right, s);
        g.engine.glow.spawn({ x: p.x, y: p.y + Math.random() * o.height * 0.6, z: p.z, vx: this.fwd.x * 14, vy: 2 + Math.random() * 4, vz: this.fwd.z * 14, size: 0.6, sizeEnd: 0.1, life: 0.5, r: 1, g: 0.85, b: 0.55, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW, drag: 1.5 });
      }
      for (const f of g.enemiesOf(this.owner)) {
        if (this.hits.has(f.id) || f.dead) continue;
        _v.subVectors(f.pos, this.origin);
        const along = _v.dot(this.fwd);
        if (along < -1.5 || along > this.front) continue;
        if (Math.abs(_v.dot(this.right)) > o.width / 2 + f.def.radius) continue;
        if (_v.y > o.height || _v.y < -10) continue;
        this.hits.add(f.id);
        g.damage(f, o.damage, this.owner, this.fwd.clone(), { energy: true, knock: 34, launch: 12, heavy: true, hitstop: 0.22, shake: 1.2, unblockable: true, color: '#FFE3A0' });
        starBurst(g, f.center(), 2.4, '#FFE3A0');
      }
    }
    if (!moving && this.mat.uniforms.uA.value <= 0) this.done = true;
  }

  dispose(): void {
    this.sheet.removeFromParent();
    this.sheet.geometry.dispose();
    this.mat.dispose();
  }
}

/** a pillar of light poured down on a fighter (the releases): a tall glowing column that thins and fades */
export class LightPillar implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.Mesh;
  private mat: THREE.ShaderMaterial;

  constructor(private g: Game, private f: Fighter, readonly color: THREE.ColorRepresentation, readonly life = 1.6, readonly radius = 2.2, readonly height = 120) {
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uA: { value: 1 }, uC: { value: rgb(color) } },
      vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vW; void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `uniform float uT; uniform float uA; uniform vec3 uC; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
        void main() { vec3 v = normalize(cameraPosition - vW); float f = abs(dot(normalize(vN), v));
          float stream = 0.7 + 0.3 * sin(vUv.y * 60.0 - uT * 30.0 + vUv.x * 6.283 * 3.0);
          float fade = smoothstep(1.0, 0.6, vUv.y);
          gl_FragColor = vec4(uC * (1.2 + f * 1.4) * stream, uA * (0.1 + f * 0.55) * fade); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    const geo = new THREE.CylinderGeometry(1, 1, 1, 32, 1, true);
    geo.translate(0, 0.5, 0);
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 6;
    g.engine.gr.scene.add(this.mesh);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.t < this.life * 0.7) starMotes(g, this.f, 3, this.color, this.radius);
    if (this.t > this.life) this.done = true;
  }

  render(): void {
    const k = this.t / this.life;
    const r = this.radius * (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) * 0.8);
    this.mesh.position.set(this.f.pos.x, this.f.pos.y - 1, this.f.pos.z);
    this.mesh.scale.set(Math.max(0.01, r), this.height, Math.max(0.01, r));
    this.mat.uniforms.uT.value = this.t;
    this.mat.uniforms.uA.value = Math.max(0, 1 - Math.max(0, k - 0.6) / 0.4);
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}

/** a sweep of the Seigun Ranbu: a streak of light through the target from one side to the other */
export function starSlash(g: Game, at: THREE.Vector3, dir: THREE.Vector3, len = 4, color: THREE.ColorRepresentation = '#FFE7A0'): void {
  const c = rgb(color);
  for (let i = 0; i < 10; i++) {
    const k = (i / 9 - 0.5) * len;
    const p = _v.copy(at).addScaledVector(dir, k);
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: dir.x * 40, vy: dir.y * 40, vz: dir.z * 40, size: 0.25, sizeEnd: 0.05, life: 0.18, r: c.r * 1.4, g: c.g * 1.4, b: c.b * 1.4, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 4, drag: 10 });
  }
  starBurst(g, at, 0.8, color);
}

/** a sky tint that rises, holds `hold` seconds, then lets the sky go back (the dawn passing into day) */
export function passingSky(g: Game, look: SkyLook, hold: number, rate = 1.4): SkyTint {
  const sky = new SkyTint(g, look, rate);
  g.addProjectile(sky);
  let t = 0;
  g.addProjectile({ done: false, update(dt) { t += dt; if (t >= hold) { sky.target = 0; this.done = true; } }, dispose() {} });
  return sky;
}
