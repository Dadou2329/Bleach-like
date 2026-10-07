// Shun Shun Rikka: the six fairies that fly out of Orihime's hairpins and the shapes they make. Santen
// Kesshun — Hinagiku, Lily and Baigon hold up a golden triangle that turns blows aside; Sōten Kisshun — Ayame
// and Shun'ō spread a half-oval dome in which what happened is undone; Koten Zanshun — Tsubaki, a streak of
// light with a cutting edge that splits what it passes through; Shiten Kōshun — Tsubaki at the heart of a
// triangle that fires the blow it catches back down its own path; and in Rokuten Shishun all six circling her,
// trailing crimson. The right pin holds Tsubaki, Ayame and Shun'ō, the left Hinagiku, Lily and Baigon.
import * as THREE from 'three';
import type { Fighter } from '../game/fighter';
import type { Game, Projectile } from '../game/game';
import { PropMesh } from '../game/characterFactory';
import { FAIRY_CENTER, rikkaFairy, type FairyName } from '../chars/orihime';
import { BoxShape, CapsuleShape, SphereShape } from '../destruction/shapes';
import { TEX_GLOW, TEX_RING, TEX_STREAK } from './sprites';

export const RIKKA_GOLD = new THREE.Color('#FFC94A');
export const RIKKA_FACE = new THREE.Color('#FAFDE4');
export const RIKKA_ORANGE = new THREE.Color('#F0A040');
export const SOTEN_GOLD = new THREE.Color('#F8F0BA');
export const ROKUTEN_RED = new THREE.Color('#E73D60');

/** the fairies are drawn a little larger than life so they read at fighting distance */
const FAIRY_SCALE = 1.45;
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _m = new THREE.Matrix4();
const UP = new THREE.Vector3(0, 1, 0);

/** which hairpin a fairy lives in */
export function pinOf(name: FairyName): 'pin.R' | 'pin.L' {
  return name === 'tsubaki' || name === 'ayame' || name === 'shuno' ? 'pin.R' : 'pin.L';
}

/** a fighter's socket in the world (falls back to head height) */
export function socketPos(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return out.copy(f.pos).setY(f.pos.y + f.def.height * 0.9);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

/** a glow puff (linear rgb from a colour) */
function glow(g: Game, p: THREE.Vector3, c: THREE.Color, size: number, life: number, alpha = 0.9, v?: THREE.Vector3, sizeEnd = 0.02): void {
  g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: v?.x ?? 0, vy: v?.y ?? 0, vz: v?.z ?? 0, size, sizeEnd, life, r: c.r, g: c.g, b: c.b, alpha, alphaEnd: 0, tex: TEX_GLOW });
}

/** a burst of golden sparks */
export function rikkaSparks(g: Game, p: THREE.Vector3, c: THREE.Color, n: number, speed = 5): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.3) * 2;
    const s = speed * (0.4 + Math.random() * 0.8);
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * s, vy: e * s * 0.6, vz: Math.sin(a) * s, size: 0.07 + Math.random() * 0.06, sizeEnd: 0.01, life: 0.25 + Math.random() * 0.3, r: c.r * 1.6, g: c.g * 1.6, b: c.b * 1.6, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 1.8, drag: 2, gravity: -3 });
  }
}

/**
 * Restoration: golden motes fly in from around each point and settle into it (the voxels returning to where
 * they were).
 */
export function restoreMotes(g: Game, pts: THREE.Vector3[], c: THREE.Color = SOTEN_GOLD): void {
  for (const p of pts) {
    const life = 0.3 + Math.random() * 0.25;
    const d = 0.5 + Math.random() * 1.1;
    const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.4) * 1.6;
    const ox = Math.cos(a) * d, oy = e * d * 0.6, oz = Math.sin(a) * d;
    g.engine.glow.spawn({ x: p.x + ox, y: p.y + oy, z: p.z + oz, vx: -ox / life, vy: -oy / life, vz: -oz / life, size: 0.13, sizeEnd: 0.05, life, r: c.r * 1.4, g: c.g * 1.4, b: c.b * 1.4, alpha: 0.2, alphaEnd: 0.95, tex: TEX_GLOW });
  }
}

// ------------------------------------------------------------------ a fairy

/**
 * One fairy in flight: the little voxel figure with a golden rim and a soft glow, a short trail behind it.
 * It leaves from its hairpin, flies to where it is sent, holds there, and flies home.
 */
export class Fairy {
  readonly mesh: PropMesh;
  readonly pos = new THREE.Vector3();
  readonly face = new THREE.Vector3(0, 0, 1);
  readonly color: THREE.Color;
  private trailT = 0;
  private bobT = Math.random() * 10;
  /** flown home and gone */
  home = false;
  constructor(private g: Game, readonly name: FairyName, readonly owner: Fighter, color: THREE.Color = RIKKA_GOLD, start?: THREE.Vector3) {
    this.mesh = new PropMesh(rikkaFairy(name));
    this.mesh.castShadow = false;
    this.mesh.scale.setScalar(FAIRY_SCALE);
    this.color = color.clone();
    this.mesh.material.userData.uniforms.uRim.value.set(color.r, color.g, color.b, 1.3);
    this.pos.copy(start ?? socketPos(owner, pinOf(name)));
    this.mesh.position.copy(this.pos);
    g.engine.gr.scene.add(this.mesh);
    glow(g, this.pos, color, 0.5, 0.25, 0.9);
  }

  setColor(c: THREE.Color): void {
    this.color.copy(c);
    this.mesh.material.userData.uniforms.uRim.value.set(c.r, c.g, c.b, 1.3);
  }

  /** ease toward a point (k: how quickly), leaving a short trail when moving fast */
  fly(target: THREE.Vector3, dt: number, k = 16): void {
    const a = 1 - Math.exp(-k * dt);
    _v.subVectors(target, this.pos);
    const d = _v.length();
    this.pos.addScaledVector(_v, a);
    this.trailT -= dt;
    if (d * a / Math.max(dt, 1e-4) > 2 && this.trailT <= 0) {
      this.trailT = 0.02;
      glow(this.g, this.pos, this.color, 0.16, 0.22, 0.7);
    }
  }

  /** fly back into the hairpin; true once home */
  flyHome(dt: number): boolean {
    if (this.home) return true;
    const pin = socketPos(this.owner, pinOf(this.name), _w);
    this.fly(pin, dt, 14);
    if (this.pos.distanceTo(pin) < 0.12) {
      this.home = true;
      this.mesh.visible = false;
      glow(this.g, pin, this.color, 0.35, 0.18, 0.8);
    }
    return this.home;
  }

  /** draw: the figure stands at its centre point, turned to face its facing direction, bobbing a little */
  render(dt: number, flash = 0): void {
    this.bobT += dt;
    const m = this.mesh;
    m.position.copy(this.pos);
    m.position.y += Math.sin(this.bobT * 6) * 0.012 - FAIRY_CENTER * FAIRY_SCALE;
    if (Math.abs(this.face.x) + Math.abs(this.face.z) > 1e-3) m.rotation.set(0, Math.atan2(this.face.x, this.face.z), 0);
    m.material.userData.uniforms.uFlash.value.set(this.color.r, this.color.g, this.color.b, Math.min(1, flash));
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.material.dispose();
  }
}

// ------------------------------------------------------------------ Santen Kesshun

const TRI_VERT = /* glsl */ `
  attribute vec3 bary;
  varying vec3 vB;
  varying vec3 vW;
  void main() {
    vB = bary;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;
const TRI_FRAG = /* glsl */ `
  uniform vec3 uFace;
  uniform vec3 uRim;
  uniform float uA;
  uniform float uHit;
  uniform float uTime;
  varying vec3 vB;
  varying vec3 vW;
  void main() {
    float e = min(min(vB.x, vB.y), vB.z);
    float rim = smoothstep(0.06, 0.0, e);
    float halo = smoothstep(0.2, 0.0, e) * 0.5;
    // a faint sheen sweeping across the face
    float sheen = pow(max(0.0, sin((vB.x - vB.y) * 9.0 - uTime * 4.0)), 8.0) * 0.25;
    vec3 col = mix(uFace * (0.45 + sheen + uHit * 1.2), uRim * 2.4, max(rim, halo * 0.6));
    float a = uA * (0.2 + sheen + halo + rim * 0.8 + uHit * 0.5);
    gl_FragColor = vec4(col, a);
  }`;

/** the golden triangle: three corners at radius 1 in the XY plane, facing +Z, with barycentric weights */
function triangleGeometry(): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  const c = [[0, 1, 0], [-0.866, -0.5, 0], [0.866, -0.5, 0]];
  g.setAttribute('position', new THREE.Float32BufferAttribute(c.flat(), 3));
  g.setAttribute('bary', new THREE.Float32BufferAttribute([1, 0, 0, 0, 1, 0, 0, 0, 1], 3));
  return g;
}

export interface SantenOpts {
  /** seconds it stands */
  dur: number;
  /** damage it takes before it breaks */
  hp: number;
  /** centre-to-corner distance (m) */
  size: number;
  /** how far before her (m) and how high its centre stands above her feet */
  ahead: number;
  height: number;
  color?: THREE.Color;
  /** stays where it was raised instead of moving with her */
  fixed?: boolean;
}

/**
 * Santen Kesshun: Hinagiku, Lily and Baigon at the corners of a golden triangle standing before her. It turns
 * aside whatever strikes its face until it has taken `hp`, then shatters.
 */
export class SantenKesshun implements Projectile {
  done = false;
  t = 0;
  hp: number;
  readonly center = new THREE.Vector3();
  readonly normal = new THREE.Vector3(0, 0, 1);
  readonly fairies: Fairy[];
  private mesh: THREE.Mesh;
  private mat: THREE.ShaderMaterial;
  private hitT = 0;
  private closeT = -1;
  broken = false;
  private size: number;

  constructor(private g: Game, readonly owner: Fighter, readonly o: SantenOpts, names: FairyName[] = ['hinagiku', 'lily', 'baigon']) {
    this.hp = o.hp;
    this.size = o.size;
    const col = o.color ?? RIKKA_GOLD;
    this.fairies = names.map((n) => new Fairy(g, n, owner, col));
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uFace: { value: RIKKA_FACE.clone() }, uRim: { value: col.clone() }, uA: { value: 0 }, uHit: { value: 0 }, uTime: { value: 0 } },
      vertexShader: TRI_VERT, fragmentShader: TRI_FRAG,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(triangleGeometry(), this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 7;
    g.engine.gr.scene.add(this.mesh);
    this.anchor();
    g.sfx.play('ting', this.center, 0.9);
  }

  /** stand before her (unless fixed and already placed) */
  private anchor(): void {
    if (this.o.fixed && this.t > 0) return;
    const f = this.owner;
    const fw = f.forward(_v);
    this.normal.copy(fw);
    this.center.copy(f.pos).addScaledVector(fw, this.o.ahead);
    this.center.y += this.o.height;
  }

  /** does a blow travelling along `dir` (attacker → her) strike the face of the triangle? */
  covers(dir: THREE.Vector3): boolean {
    if (this.closeT >= 0) return false;
    _v.copy(dir).setY(0);
    if (_v.lengthSq() < 1e-6) return true;
    return _v.normalize().dot(this.normal) < -0.2;
  }

  /** is a point (a projectile) touching the triangle? */
  touches(p: THREE.Vector3, r = 0.3): boolean {
    if (this.closeT >= 0) return false;
    _v.subVectors(p, this.center);
    const d = _v.dot(this.normal);
    if (Math.abs(d) > r + 0.15) return false;
    _v.addScaledVector(this.normal, -d);
    return _v.length() < this.size * 0.75 + r;
  }

  /** take a blow; true if it held (the blow that breaks it is still turned aside) */
  absorb(amount: number): boolean {
    if (this.closeT >= 0) return false;
    this.hp -= amount;
    this.hitT = 0.2;
    for (const fy of this.fairies) rikkaSparks(this.g, fy.pos, this.mat.uniforms.uRim.value, 3, 3);
    rikkaSparks(this.g, this.center, this.mat.uniforms.uRim.value, 8, 4);
    this.g.sfx.play('ting', this.center, 0.7);
    if (this.hp <= 0) this.shatter();
    return true;
  }

  private shatter(): void {
    this.broken = true;
    this.close();
    const c = this.mat.uniforms.uRim.value as THREE.Color;
    for (let i = 0; i < 26; i++) {
      const k = Math.random();
      const a = Math.floor(Math.random() * 3);
      const p0 = this.corner(a, _v), p1 = this.corner((a + 1) % 3, _w);
      const p = p0.lerp(p1, k);
      const out = p.clone().sub(this.center).normalize().multiplyScalar(2 + Math.random() * 3).addScaledVector(this.normal, -1.5);
      this.g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: out.x, vy: out.y + 1, vz: out.z, size: 0.12, sizeEnd: 0.02, life: 0.5 + Math.random() * 0.3, r: c.r * 1.5, g: c.g * 1.5, b: c.b * 1.5, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 1.5, gravity: -6, drag: 1 });
    }
    this.g.sfx.play('shatter', this.center, 0.8);
  }

  /** the corner a fairy holds, in the world */
  corner(i: number, out = new THREE.Vector3()): THREE.Vector3 {
    const right = _m.makeRotationAxis(UP, -Math.PI / 2);
    const r = out.copy(this.normal).applyMatrix4(right).setY(0).normalize();
    const cx = [0, -0.866, 0.866][i], cy = [1, -0.5, -0.5][i];
    const rx = r.x, rz = r.z;
    return out.set(this.center.x + rx * cx * this.size, this.center.y + cy * this.size, this.center.z + rz * cx * this.size);
  }

  /** stop: the fairies fly home, the triangle fades */
  close(): void {
    if (this.closeT < 0) this.closeT = 0;
  }

  get closing(): boolean {
    return this.closeT >= 0;
  }

  update(dt: number): void {
    this.t += dt;
    this.hitT = Math.max(0, this.hitT - dt);
    if (this.closeT < 0 && (this.t > this.o.dur || this.owner.dead)) this.close();
    if (this.closeT >= 0) {
      this.closeT += dt;
      let home = true;
      for (const fy of this.fairies) home = fy.flyHome(dt) && home;
      if (home || this.closeT > 0.5) this.done = true;
      return;
    }
    this.anchor();
    const grow = Math.min(1, this.t / 0.14);
    this.size = this.o.size * (0.35 + 0.65 * grow);
    this.fairies.forEach((fy, i) => {
      fy.fly(this.corner(i, _w).addScaledVector(this.normal, 0.06), dt, 22);
      fy.face.copy(this.normal);
    });
  }

  render(dt: number, time: number): void {
    const grow = Math.min(1, this.t / 0.14);
    const fade = this.closeT >= 0 ? Math.max(0, 1 - this.closeT / 0.2) : 1;
    // basis: X = her right in the plane, Y = up, Z = the face normal
    const n = this.normal;
    const xr = _v.set(n.z, 0, -n.x).normalize().negate();
    _m.makeBasis(xr, UP, n);
    this.mesh.quaternion.setFromRotationMatrix(_m);
    this.mesh.position.copy(this.center);
    this.mesh.scale.setScalar(this.size);
    const u = this.mat.uniforms;
    u.uA.value = grow * fade;
    u.uHit.value = this.hitT / 0.2;
    u.uTime.value = time;
    for (const fy of this.fairies) fy.render(dt, this.hitT * 3);
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mat.dispose();
    for (const fy of this.fairies) fy.dispose();
  }
}

// ------------------------------------------------------------------ Sōten Kisshun

const DOME_VERT = /* glsl */ `
  varying vec3 vN;
  varying vec3 vW;
  varying vec3 vL;
  void main() {
    vL = position;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;
const DOME_FRAG = /* glsl */ `
  uniform vec3 uCol;
  uniform vec3 uRim;
  uniform float uA;
  uniform float uPulse;
  uniform float uTime;
  varying vec3 vN;
  varying vec3 vW;
  varying vec3 vL;
  void main() {
    vec3 v = normalize(cameraPosition - vW);
    float f = 1.0 - abs(dot(normalize(vN), v));
    float rim = pow(f, 2.2);
    // soft bands rising up the dome, a bright seam along the ground
    float band = pow(max(0.0, sin(vL.y * 18.0 - uTime * 2.6)), 6.0) * 0.18;
    float base = smoothstep(0.08, 0.0, vL.y) * 0.8;
    vec3 col = mix(uCol, uRim, rim) * (0.9 + uPulse * 0.8);
    float a = uA * (0.06 + rim * 0.75 + band + base + uPulse * 0.12);
    gl_FragColor = vec4(col * 1.5, a);
  }`;

/**
 * Sōten Kisshun: Ayame and Shun'ō at either end of a golden half-oval dome. Inside it the kit undoes what
 * happened — wounds, broken things, the ground torn up — while the dome stands.
 */
export class SotenKisshun implements Projectile {
  done = false;
  t = 0;
  readonly center: THREE.Vector3;
  readonly fairies: Fairy[];
  private mesh: THREE.Mesh;
  private mat: THREE.ShaderMaterial;
  private closeT = -1;
  private pulseT = 0;
  private side = new THREE.Vector3(1, 0, 0);

  constructor(private g: Game, readonly owner: Fighter, center: THREE.Vector3, readonly radius: number, readonly height: number, readonly dur: number, readonly color: THREE.Color = SOTEN_GOLD) {
    this.center = center.clone();
    this.fairies = (['ayame', 'shuno'] as FairyName[]).map((n) => new Fairy(g, n, owner, RIKKA_GOLD));
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uCol: { value: color.clone() }, uRim: { value: RIKKA_GOLD.clone() }, uA: { value: 0 }, uPulse: { value: 0 }, uTime: { value: 0 } },
      vertexShader: DOME_VERT, fragmentShader: DOME_FRAG,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 6;
    g.engine.gr.scene.add(this.mesh);
    const fw = owner.forward(_v);
    this.side.set(fw.z, 0, -fw.x).normalize();
    g.sfx.play('heal', this.center, 1);
  }

  /** a healing tick: the dome brightens */
  pulse(): void {
    this.pulseT = 0.25;
  }

  close(): void {
    if (this.closeT < 0) this.closeT = 0;
  }

  get closing(): boolean {
    return this.closeT >= 0;
  }

  /** is a point inside the dome? */
  inside(p: THREE.Vector3): boolean {
    const dx = (p.x - this.center.x) / this.radius, dz = (p.z - this.center.z) / (this.radius * 0.8), dy = (p.y - this.center.y) / this.height;
    return dy > -0.2 && dx * dx + dz * dz + Math.max(0, dy) * Math.max(0, dy) < 1;
  }

  update(dt: number): void {
    this.t += dt;
    this.pulseT = Math.max(0, this.pulseT - dt);
    if (this.closeT < 0 && (this.t > this.dur || this.owner.dead)) this.close();
    if (this.closeT >= 0) {
      this.closeT += dt;
      let home = true;
      for (const fy of this.fairies) home = fy.flyHome(dt) && home;
      if ((home && this.closeT > 0.3) || this.closeT > 0.7) this.done = true;
      return;
    }
    const s = this.side;
    this.fairies.forEach((fy, i) => {
      const k = i === 0 ? 1 : -1;
      _w.copy(this.center).addScaledVector(s, k * this.radius * 0.98);
      _w.y += 0.25 + Math.sin(this.t * 2 + i) * 0.05;
      fy.fly(_w, dt, 10);
      fy.face.copy(s).multiplyScalar(-k);
    });
    // motes drifting up inside
    if (Math.random() < dt * 30) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * this.radius * 0.9;
      _v.set(this.center.x + Math.cos(a) * r, this.center.y + 0.1, this.center.z + Math.sin(a) * r * 0.8);
      glow(this.g, _v, this.color, 0.16, 1.1, 0.7, _w.set(0, 0.9 + Math.random() * 0.6, 0), 0.04);
    }
  }

  render(dt: number, time: number): void {
    const grow = Math.min(1, this.t / 0.3);
    const fade = this.closeT >= 0 ? Math.max(0, 1 - this.closeT / 0.3) : 1;
    const e = 1 - (1 - grow) ** 3;
    this.mesh.position.copy(this.center);
    this.mesh.scale.set(this.radius * e, this.height * e, this.radius * 0.8 * e);
    this.mesh.rotation.set(0, Math.atan2(this.side.x, this.side.z) - Math.PI / 2, 0);
    const u = this.mat.uniforms;
    u.uA.value = fade * (0.6 + 0.4 * grow);
    u.uPulse.value = this.pulseT / 0.25;
    u.uTime.value = time;
    for (const fy of this.fairies) fy.render(dt, this.pulseT * 2);
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mat.dispose();
    for (const fy of this.fairies) fy.dispose();
  }
}

// ------------------------------------------------------------------ Koten Zanshun

const EDGE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const EDGE_FRAG = /* glsl */ `
  uniform vec3 uCol;
  uniform vec3 uCore;
  uniform float uA;
  varying vec2 vUv;
  void main() {
    // a blade of light: bright along its leading edge, fading back to the tail
    float lead = vUv.x;
    float across = abs(vUv.y - 0.5) * 2.0;
    float w = 1.0 - smoothstep(lead * 0.9, lead * 0.9 + 0.12, across);
    float core = smoothstep(0.35, 0.0, across) * lead;
    vec3 col = mix(uCol, uCore, core) * (0.6 + lead * 1.8);
    gl_FragColor = vec4(col, uA * w * (0.25 + lead * 0.75));
  }`;

export interface KotenOpts {
  speed: number;
  /** the cut's power against the world (Tsubaki's edge splits what he passes through) */
  cut: number;
  color?: THREE.Color;
  /** he struck someone: return false if he was swatted aside instead of cutting through */
  onHit: (o: Fighter, at: THREE.Vector3, dir: THREE.Vector3) => boolean;
  /** he was swatted and smashed */
  onBroken?: () => void;
}

/**
 * Koten Zanshun: Tsubaki flies at the enemy as a streak of golden light with a cutting edge, passes through
 * whoever he reaches and splits what lies along his path, then flies home. Swatted, he tumbles and breaks.
 */
export class KotenZanshun implements Projectile {
  done = false;
  t = 0;
  readonly fairy: Fairy;
  readonly pos = new THREE.Vector3();
  readonly vel = new THREE.Vector3();
  private prev = new THREE.Vector3();
  private state: 'fly' | 'through' | 'home' | 'fall' = 'fly';
  private stateT = 0;
  private struck = new Set<number>();
  private edge: THREE.Mesh;
  private edgeMat: THREE.ShaderMaterial;
  private color: THREE.Color;

  constructor(private g: Game, readonly owner: Fighter, readonly target: Fighter | null, aim: THREE.Vector3, readonly o: KotenOpts) {
    this.color = (o.color ?? RIKKA_GOLD).clone();
    this.fairy = new Fairy(g, 'tsubaki', owner, this.color);
    this.pos.copy(this.fairy.pos);
    this.prev.copy(this.pos);
    this.vel.subVectors(aim, this.pos).normalize().multiplyScalar(o.speed);
    this.edgeMat = new THREE.ShaderMaterial({
      uniforms: { uCol: { value: this.color.clone().multiplyScalar(1.6) }, uCore: { value: new THREE.Color(3, 2.8, 2.2) }, uA: { value: 1 } },
      vertexShader: EDGE_VERT, fragmentShader: EDGE_FRAG,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    // a long flat blade of light lying along his flight, the leading edge at +X
    const geo = new THREE.PlaneGeometry(1.6, 0.5);
    geo.translate(-0.55, 0, 0);
    this.edge = new THREE.Mesh(geo, this.edgeMat);
    this.edge.frustumCulled = false;
    this.edge.renderOrder = 8;
    g.engine.gr.scene.add(this.edge);
    g.sfx.play('swingHeavy', this.pos, 0.8);
  }

  get broken(): boolean {
    return this.state === 'fall';
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    this.stateT += dt;
    this.prev.copy(this.pos);
    const fy = this.fairy;
    if (this.state === 'fall') {
      this.vel.y -= 14 * dt;
      this.vel.multiplyScalar(Math.exp(-1.2 * dt));
      this.pos.addScaledVector(this.vel, dt);
      fy.pos.copy(this.pos);
      if (Math.random() < 0.5) glow(g, this.pos, this.color, 0.1, 0.3, 0.5);
      if (this.stateT > 1.1) {
        rikkaSparks(g, this.pos, this.color, 10, 2);
        this.done = true;
      }
      return;
    }
    if (this.state === 'home') {
      if (fy.flyHome(dt)) this.done = true;
      this.pos.copy(fy.pos);
      return;
    }
    // home in on the target while flying at it
    const tg = this.target;
    if (this.state === 'fly' && tg && !tg.dead) {
      const want = tg.center(_v).sub(this.pos);
      const sp = this.vel.length();
      want.normalize().multiplyScalar(sp);
      this.vel.lerp(want, 1 - Math.exp(-7 * dt)).normalize().multiplyScalar(sp);
    }
    this.pos.addScaledVector(this.vel, dt);
    fy.pos.copy(this.pos);
    fy.face.copy(this.vel).setY(0).normalize();
    // the edge splits what lies on his path: a thin upright plane along the flight
    const seg = _v.subVectors(this.pos, this.prev);
    const len = seg.length();
    if (len > 0.02 && this.o.cut > 0) {
      const dir = seg.clone().divideScalar(len);
      const flat = dir.clone().setY(0);
      if (flat.lengthSq() < 1e-4) flat.set(1, 0, 0);
      flat.normalize();
      const side = new THREE.Vector3(flat.z, 0, -flat.x);
      _m.makeBasis(side, UP, flat);
      const q = new THREE.Quaternion().setFromRotationMatrix(_m);
      const c = new THREE.Vector3().addVectors(this.pos, this.prev).multiplyScalar(0.5);
      g.engine.destruction.carve(new BoxShape(c, new THREE.Vector3(0.07, 0.75, len * 0.5 + 0.06), q), { mode: 'cut', power: this.o.cut, dir: flat, sparks: [1.6, 1.2, 0.5], dust: 0.4 });
    }
    // strikes: anyone his path crosses (the target first)
    for (const o of g.enemiesOf(this.owner)) {
      if (this.struck.has(o.id)) continue;
      const cy = Math.max(o.pos.y + 0.2, Math.min(o.pos.y + o.def.height - 0.2, this.pos.y));
      if (Math.hypot(this.pos.x - o.pos.x, this.pos.y - cy, this.pos.z - o.pos.z) > o.def.radius + 0.35) continue;
      this.struck.add(o.id);
      const at = new THREE.Vector3(o.pos.x, cy, o.pos.z);
      const through = this.o.onHit(o, at, this.vel.clone().normalize());
      if (!through) {
        // swatted: he spins away and breaks
        this.state = 'fall';
        this.stateT = 0;
        this.vel.set(-this.vel.x * 0.25 + (Math.random() - 0.5) * 4, 5, -this.vel.z * 0.25 + (Math.random() - 0.5) * 4);
        rikkaSparks(g, this.pos, this.color, 14, 6);
        this.o.onBroken?.();
        return;
      }
      if (this.state === 'fly') {
        this.state = 'through';
        this.stateT = 0;
      }
    }
    if (this.state === 'through' && this.stateT > 0.22) this.state = 'home';
    if (this.state === 'fly' && this.t > 1.4) this.state = 'home';
  }

  render(dt: number): void {
    const fy = this.fairy;
    fy.render(dt, this.state === 'fly' || this.state === 'through' ? 0.4 : 0);
    const on = this.state === 'fly' || this.state === 'through';
    this.edge.visible = on;
    if (on) {
      this.edge.position.copy(this.pos);
      const d = _v.copy(this.vel).normalize();
      // lie in the vertical plane of the flight, the leading edge forward
      const side = _w.set(d.z, 0, -d.x);
      if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
      side.normalize();
      const up = new THREE.Vector3().crossVectors(side, d).normalize();
      _m.makeBasis(d, up, side);
      this.edge.quaternion.setFromRotationMatrix(_m);
      glow(this.g, this.pos, this.color, 0.3, 0.16, 0.8);
    }
  }

  dispose(): void {
    this.edge.removeFromParent();
    this.edge.geometry.dispose();
    this.edgeMat.dispose();
    this.fairy.dispose();
  }
}

// ------------------------------------------------------------------ Shiten Kōshun

/**
 * Shiten Kōshun: Tsubaki sits at the heart of a Santen triangle. The instant a blow lands on it, the force is
 * gathered and fired back down the path it came along as a blast at whoever sent it.
 */
export class ShitenKoshun implements Projectile {
  done = false;
  t = 0;
  readonly tri: SantenKesshun;
  readonly tsubaki: Fairy;
  fired = false;
  private beam: THREE.Mesh | null = null;
  private beamMat: THREE.MeshBasicMaterial | null = null;
  private beamT = 0;

  constructor(private g: Game, readonly owner: Fighter, dur: number, size: number) {
    this.tri = new SantenKesshun(g, owner, { dur, hp: 1e9, size, ahead: 0.95, height: 1.05 });
    this.tsubaki = new Fairy(g, 'tsubaki', owner, RIKKA_ORANGE);
  }

  covers(dir: THREE.Vector3): boolean {
    return !this.fired && this.tri.covers(dir);
  }

  /** the blow lands: fire it back at `to` (whoever struck); `onBlast` deals the damage and the destruction */
  fire(to: THREE.Vector3, onBlast: (from: THREE.Vector3, to: THREE.Vector3) => void): void {
    if (this.fired) return;
    this.fired = true;
    const from = this.tri.center.clone();
    const len = from.distanceTo(to);
    this.beamMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(RIKKA_GOLD).multiplyScalar(2.6), transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
    const geo = new THREE.CylinderGeometry(0.28, 0.5, len, 12, 1, true);
    geo.rotateX(Math.PI / 2);
    this.beam = new THREE.Mesh(geo, this.beamMat);
    this.beam.position.addVectors(from, to).multiplyScalar(0.5);
    this.beam.lookAt(to);
    this.beam.frustumCulled = false;
    this.beam.renderOrder = 8;
    this.g.engine.gr.scene.add(this.beam);
    // the gathered force along the path
    const dir = _v.subVectors(to, from).normalize();
    for (let i = 0; i < 40; i++) {
      const k = Math.random();
      const p = _w.copy(from).lerp(to, k);
      this.g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: dir.x * 18 + (Math.random() - 0.5) * 3, vy: dir.y * 18 + (Math.random() - 0.5) * 3, vz: dir.z * 18 + (Math.random() - 0.5) * 3, size: 0.18, sizeEnd: 0.03, life: 0.25 + Math.random() * 0.2, r: 2.4, g: 1.6, b: 0.5, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2 });
    }
    this.g.engine.glow.spawn({ x: from.x, y: from.y, z: from.z, size: 2.6, sizeEnd: 0.5, life: 0.3, r: 2.6, g: 2.0, b: 0.9, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    this.g.engine.glow.spawn({ x: to.x, y: to.y, z: to.z, size: 3.4, sizeEnd: 1, life: 0.45, r: 2.6, g: 1.4, b: 0.4, alpha: 1, alphaEnd: 0, tex: TEX_RING });
    onBlast(from, to);
    this.tri.close();
  }

  update(dt: number): void {
    this.t += dt;
    this.tri.update(dt);
    if (this.beam) {
      this.beamT += dt;
      if (this.beamMat) this.beamMat.opacity = Math.max(0, 1 - this.beamT / 0.35);
    }
    if (this.tri.closing) this.tsubaki.flyHome(dt);
    else {
      this.tsubaki.fly(_w.copy(this.tri.center).addScaledVector(this.tri.normal, 0.1), dt, 20);
      this.tsubaki.face.copy(this.tri.normal);
    }
    if (this.tri.done && (!this.beam || this.beamT > 0.4)) this.done = true;
  }

  render(dt: number, time: number): void {
    this.tri.render(dt, time);
    this.tsubaki.render(dt, this.fired ? 0 : 0.3 + Math.sin(time * 12) * 0.2);
  }

  dispose(): void {
    this.tri.dispose();
    this.tsubaki.dispose();
    if (this.beam) {
      this.beam.removeFromParent();
      this.beam.geometry.dispose();
      this.beamMat?.dispose();
    }
  }
}

// ------------------------------------------------------------------ Rokuten Shishun

const ALL_SIX: FairyName[] = ['tsubaki', 'ayame', 'shuno', 'hinagiku', 'lily', 'baigon'];

/**
 * Rokuten Shishun: all six Rikka circle her trailing blood-red streaks, turning aside whatever is fired at her.
 */
export class RokutenOrbit implements Projectile {
  done = false;
  t = 0;
  readonly fairies: Fairy[];
  private ending = false;
  private flash = new Float32Array(6);

  constructor(private g: Game, readonly owner: Fighter) {
    this.fairies = ALL_SIX.map((n) => new Fairy(g, n, owner, ROKUTEN_RED));
  }

  /** a fairy darts to meet a blow coming along `dir` */
  deflect(dir: THREE.Vector3): void {
    let best = 0, bd = -2;
    const c = this.owner.center(_v);
    this.fairies.forEach((fy, i) => {
      const d = _w.subVectors(fy.pos, c).setY(0).normalize().dot(dir) * -1;
      if (d > bd) { bd = d; best = i; }
    });
    this.flash[best] = 0.3;
    rikkaSparks(this.g, this.fairies[best].pos, ROKUTEN_RED, 12, 6);
    this.g.sfx.play('ting', this.fairies[best].pos, 0.8);
  }

  end(): void {
    this.ending = true;
  }

  update(dt: number): void {
    this.t += dt;
    const f = this.owner;
    if (this.ending || f.dead) {
      let home = true;
      for (const fy of this.fairies) home = fy.flyHome(dt) && home;
      if (home || this.t > 60) this.done = true;
      return;
    }
    const c = f.center(_v);
    this.fairies.forEach((fy, i) => {
      this.flash[i] = Math.max(0, this.flash[i] - dt);
      const a = this.t * 2.6 + (i / 6) * Math.PI * 2;
      const r = 0.95 + Math.sin(this.t * 1.7 + i) * 0.12;
      _w.set(c.x + Math.cos(a) * r, c.y + 0.1 + Math.sin(this.t * 2.2 + i * 1.3) * 0.45, c.z + Math.sin(a) * r);
      fy.fly(_w, dt, 18);
      fy.face.set(-Math.sin(a), 0, Math.cos(a));
      // the crimson streaks
      if (Math.random() < 0.8) glow(this.g, fy.pos, ROKUTEN_RED, 0.2, 0.45, 0.65, undefined, 0.04);
    });
  }

  render(dt: number): void {
    this.fairies.forEach((fy, i) => fy.render(dt, this.flash[i] * 3));
  }

  dispose(): void {
    for (const fy of this.fairies) fy.dispose();
  }
}

// ------------------------------------------------------------------ the rejection

/** "I reject": a ring of golden light rushing out from her, sweeping away what it touches. */
export function rejectPulse(g: Game, at: THREE.Vector3, radius: number, c: THREE.Color = RIKKA_GOLD): void {
  g.addRing(at.clone().setY(at.y + 0.1), radius, c, 0.5);
  g.engine.glow.spawn({ x: at.x, y: at.y + 1, z: at.z, size: radius * 0.8, sizeEnd: radius * 1.6, life: 0.4, r: c.r * 1.4, g: c.g * 1.4, b: c.b * 1.4, alpha: 0.6, alphaEnd: 0, tex: TEX_RING });
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2;
    g.engine.glow.spawn({ x: at.x, y: at.y + 0.6 + Math.random() * 0.8, z: at.z, vx: Math.cos(a) * radius * 2.2, vy: Math.random() * 1.5, vz: Math.sin(a) * radius * 2.2, size: 0.18, sizeEnd: 0.03, life: 0.45, r: c.r * 1.6, g: c.g * 1.6, b: c.b * 1.6, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2, drag: 2.5 });
  }
}

/** Rokuten Shishun's rejection: a crimson flash where her palm lands, the power stripped out of the target. */
export function crimsonRejection(g: Game, at: THREE.Vector3): void {
  g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, size: 1.2, sizeEnd: 4.5, life: 0.5, r: 2.4, g: 0.5, b: 0.8, alpha: 1, alphaEnd: 0, tex: TEX_RING });
  g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, size: 2.6, sizeEnd: 0.4, life: 0.35, r: 3, g: 1.6, b: 2, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  rikkaSparks(g, at, ROKUTEN_RED, 30, 9);
  g.engine.destruction.carve(new SphereShape(at.clone(), 1.2), { mode: 'erase', power: 300, noCollapse: false });
}

export { CapsuleShape };
