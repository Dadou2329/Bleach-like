// Shinji Hirako's effects (docs/roster/D-visored.md §2): Sakanade's pink mist — whoever breathes enough of it
// falls into the Inverted World (Fighter.inhale) — the ten points of light of Hadō #91 Senju Kōten Taihō that
// converge on the target in a barrage and one great blast, the horizontal bar his Cero lines up in before the
// sword hand, and the Bankai: the golden flower that blooms under him and shuts round him while the mist of
// Happōfusagari rolls out of its crown over the field, turning everyone in it against their own side.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { CharacterVisual } from '../game/characterFactory';
import { SphereShape } from '../destruction/shapes';
import { raycastVoxels } from '../voxel/raycast';
import { FLOWER_CROWN_Y, FLOWER_PETALS, flowerAsset, petalAzimuth } from '../chars/shinjiFlower';
import { groundAt } from './iceArts';
import type { EnergyColors } from './energy';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

/** the mist (dossier: pink `#F6A3C7`, sparkle `#FFD7EA`) */
export const MIST_PINK = '#F6A3C7';
const MIST = new THREE.Color(MIST_PINK);
const SPARKLE = new THREE.Color('#FFD7EA');
/** Hadō #91: white-gold points of light */
const KIDO91 = { core: new THREE.Color('#FFFFFF'), body: new THREE.Color('#FFF0B0'), rim: new THREE.Color('#FFB84A') };
/** the classic crimson Cero (the Karakura-era look) */
export const SHINJI_CERO: EnergyColors = { core: '#FFE4E8', body: '#D0213A', rim: '#5A0610' };

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

/** a few pink puffs of mist round a point (each ring-spin vents some out of the five holes) */
export function mistPuff(g: Game, p: THREE.Vector3, n = 3, size = 1.2): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = Math.random() * 1.6;
    g.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * s, vy: 0.2 + Math.random() * 0.5, vz: Math.sin(a) * s, size: size * (0.7 + Math.random() * 0.5), sizeEnd: size * 2.4, life: 1.4 + Math.random() * 0.8, r: MIST.r, g: MIST.g, b: MIST.b, alpha: 0.32, alphaEnd: 0, tex: TEX_PUFF, drag: 1.2, spin: (Math.random() - 0.5) * 0.6 });
  }
  if (Math.random() < 0.6) g.engine.glow.spawn({ x: p.x + (Math.random() - 0.5) * 0.6, y: p.y + (Math.random() - 0.5) * 0.6, z: p.z + (Math.random() - 0.5) * 0.6, vy: 0.4, size: 0.12, sizeEnd: 0.02, life: 0.8, r: SPARKLE.r, g: SPARKLE.g, b: SPARKLE.b, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
}

/** the moment the world turns over for someone: a twist of pink round their head */
export function invertBurst(g: Game, f: Fighter): void {
  const c = f.center(_v);
  c.y += f.def.height * 0.3;
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    g.engine.glow.spawn({ x: c.x + Math.cos(a) * 0.5, y: c.y, z: c.z + Math.sin(a) * 0.5, vx: -Math.sin(a) * 2.4, vy: (i % 2 ? 1 : -1) * 1.2, vz: Math.cos(a) * 2.4, size: 0.14, sizeEnd: 0.03, life: 0.6, r: SPARKLE.r, g: SPARKLE.g, b: SPARKLE.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2, drag: 1.5 });
  }
  mistPuff(g, c, 4, 0.8);
}

// ------------------------------------------------------------------ Sakasama no Sekai

/**
 * A cloud of Sakanade's mist. Enemies inside breathe it (more in the dense core); a full lungful turns their
 * world over for `dur` seconds (see Fighter.inhale). It spreads in the first second and lingers, thinning.
 */
export class MistCloud implements Projectile {
  done = false;
  private t = 0;
  private emit = 0;
  readonly centre: THREE.Vector3;

  constructor(private g: Game, readonly owner: Fighter, at: THREE.Vector3, readonly radius: number, readonly life: number, readonly dur: number, readonly onInvert?: (f: Fighter) => void) {
    this.centre = at.clone();
    const gy = groundAt(g, at.x, at.y + 1.5, at.z, 6);
    if (gy !== null) this.centre.y = gy;
  }

  /** the cloud's reach now: it billows out over the first second, holds, and shrinks a little as it thins */
  get reach(): number {
    const grow = 1 - (1 - Math.min(1, this.t / 0.9)) ** 2;
    const thin = this.t > this.life - 1.5 ? Math.max(0.6, (this.life - this.t) / 1.5) : 1;
    return this.radius * grow * thin;
  }

  update(dt: number): void {
    const g = this.g;
    this.t += dt;
    if (this.t >= this.life) {
      this.done = true;
      return;
    }
    const R = this.reach;
    for (const o of g.enemiesOf(this.owner)) {
      if (o.dead) continue;
      const d = Math.hypot(o.pos.x - this.centre.x, o.pos.z - this.centre.z);
      if (d > R + o.def.radius || o.pos.y > this.centre.y + 7 || o.pos.y < this.centre.y - 3) continue;
      const k = d < R * 0.5 ? 0.85 : 0.4;
      if (o.inhale(k * dt, this.dur)) this.onInvert?.(o);
    }
    // the mist itself: soft pink banks low over the ground, thicker in the middle, a few glints
    this.emit += dt * (10 + R * 1.6) * (this.t > this.life - 1.5 ? 0.4 : 1);
    while (this.emit >= 1) {
      this.emit -= 1;
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * R;
      const x = this.centre.x + Math.cos(a) * r, z = this.centre.z + Math.sin(a) * r;
      const y = this.centre.y + 0.3 + Math.random() * Math.random() * 3.2;
      const s = 2.2 + Math.random() * 2.4;
      g.engine.dust.spawn({ x, y, z, vx: Math.cos(a) * 0.5, vy: 0.08, vz: Math.sin(a) * 0.5, size: s, sizeEnd: s * 1.5, life: 2.2 + Math.random() * 1.4, r: MIST.r, g: MIST.g, b: MIST.b, alpha: 0.18 + (1 - r / Math.max(1, R)) * 0.1, alphaEnd: 0, tex: TEX_PUFF, drag: 0.6, spin: (Math.random() - 0.5) * 0.3 });
      if (Math.random() < 0.15) g.engine.glow.spawn({ x, y: y + Math.random(), z, vy: 0.3, size: 0.1, sizeEnd: 0.02, life: 1.2, r: SPARKLE.r, g: SPARKLE.g, b: SPARKLE.b, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
  }

  dispose(): void {}
}

// ------------------------------------------------------------------ Hadō #91

interface Light { p: THREE.Vector3; from: THREE.Vector3; ctrl: THREE.Vector3; delay: number; flight: number; t: number; state: 'wait' | 'fly' | 'gone'; off: THREE.Vector3 }

/**
 * Hadō #91 Senju Kōten Taihō, chantless: ten points of light come up round him one after the other, then fire
 * on the target in a converging barrage — each a small blast — and the last one sets off the great explosion.
 */
export class SenjuKoten implements Projectile {
  done = false;
  private lights: Light[] = [];
  private t = 0;
  private firing = false;
  private target = new THREE.Vector3();
  private arrived = 0;
  private boomT = -1;
  private light: THREE.PointLight;
  /** who the lights were loosed at (they home on it); null = a fixed point */
  private victim: Fighter | null = null;

  constructor(private g: Game, readonly owner: Fighter, readonly aim: () => THREE.Vector3, readonly scale = 1, readonly pick?: () => Fighter | null) {
    for (let i = 0; i < 10; i++) {
      // a crown of points round and above him, the back half higher (seen over his shoulders)
      const a = (i / 10) * Math.PI * 2 + 0.31;
      const r = 1.5 + (i % 2) * 0.45;
      const off = new THREE.Vector3(Math.sin(a) * r, 1.4 + (i % 3) * 0.55 + Math.max(0, -Math.cos(a)) * 0.6, Math.cos(a) * r);
      this.lights.push({ p: new THREE.Vector3(), from: new THREE.Vector3(), ctrl: new THREE.Vector3(), delay: i * 0.05, flight: 0.3, t: 0, state: 'wait', off });
    }
    this.light = new THREE.PointLight(KIDO91.body, 0, 14, 1.6);
    g.engine.gr.scene.add(this.light);
  }

  /** the points loose on the target */
  fire(): void {
    if (this.firing) return;
    this.firing = true;
    this.victim = this.pick?.() ?? null;
    this.target.copy(this.victim ? this.victim.center(_v) : this.aim());
    const c = this.owner.center(_v);
    this.lights.forEach((l, i) => {
      l.state = 'fly';
      l.t = -i * 0.045;
      l.from.copy(l.p);
      // each swings out on its own curve and comes in from a slightly different side
      const mid = _w.lerpVectors(l.from, this.target, 0.5);
      const side = new THREE.Vector3().subVectors(l.from, c).setY(0).normalize();
      l.ctrl.copy(mid).addScaledVector(side, 2.2 + (i % 3)).addScaledVector(UP, 1.6 + (i % 2) * 1.2);
      l.flight = Math.max(0.26, l.from.distanceTo(this.target) / 46);
    });
    this.g.sfx.play('beam', c, 0.9);
  }

  update(dt: number): void {
    const g = this.g, f = this.owner;
    this.t += dt;
    if (f.dead && !this.firing) {
      this.done = true;
      return;
    }
    // home in a little on where the target has gone
    if (this.firing && this.victim && !this.victim.dead) this.target.lerp(this.victim.center(_v), Math.min(1, dt * 3));
    const yaw = f.yaw;
    const cos = Math.cos(yaw), sin = Math.sin(yaw);
    for (const l of this.lights) {
      if (l.state === 'wait') {
        // follow him round, in his frame
        l.p.set(f.pos.x + l.off.x * cos + l.off.z * sin, f.pos.y + l.off.y, f.pos.z - l.off.x * sin + l.off.z * cos);
        const k = Math.max(0, Math.min(1, (this.t - l.delay) / 0.18));
        if (k > 0) g.engine.glow.spawn({ x: l.p.x, y: l.p.y, z: l.p.z, size: (0.25 + 0.3 * k) * this.scale, sizeEnd: 0.1, life: 0.06, r: KIDO91.body.r, g: KIDO91.body.g, b: KIDO91.body.b, alpha: k, alphaEnd: 0.5, tex: TEX_GLOW });
        continue;
      }
      if (l.state !== 'fly') continue;
      l.t += dt;
      if (l.t < 0) {
        g.engine.glow.spawn({ x: l.p.x, y: l.p.y, z: l.p.z, size: 0.55 * this.scale, sizeEnd: 0.1, life: 0.06, r: 1, g: 0.95, b: 0.75, alpha: 1, alphaEnd: 0.5, tex: TEX_GLOW });
        continue;
      }
      const u = Math.min(1, l.t / l.flight);
      // a quadratic curve from where it hung to the (moving) target
      const a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u;
      const px = l.from.x * a + l.ctrl.x * b + this.target.x * c;
      const py = l.from.y * a + l.ctrl.y * b + this.target.y * c;
      const pz = l.from.z * a + l.ctrl.z * b + this.target.z * c;
      const vx = (px - l.p.x) / Math.max(1e-3, dt), vy = (py - l.p.y) / Math.max(1e-3, dt), vz = (pz - l.p.z) / Math.max(1e-3, dt);
      l.p.set(px, py, pz);
      g.engine.glow.spawn({ x: px, y: py, z: pz, vx: vx * 0.05, vy: vy * 0.05, vz: vz * 0.05, size: 0.5 * this.scale, sizeEnd: 0.15, life: 0.18, r: KIDO91.body.r, g: KIDO91.body.g, b: KIDO91.body.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
      // it strikes whatever it meets on the way, or arrives
      const wall = raycastVoxels(g.engine.world, px, py, pz, vx, vy, vz, 0.0001 + Math.hypot(vx, vy, vz) * dt);
      if (u >= 1 || wall) {
        l.state = 'gone';
        this.burst(l.p, 1);
        this.arrived++;
        if (this.arrived === this.lights.length) this.boomT = 0.06;
      }
    }
    if (this.boomT >= 0) {
      this.boomT -= dt;
      if (this.boomT < 0) {
        this.burst(this.target, 3.2);
        this.done = true;
      }
    }
    this.light.position.copy(this.firing ? this.target : f.center(_v));
    this.light.intensity = this.firing ? 0 : Math.min(1, this.t / 0.5) * 8;
    if (this.t > 6) this.done = true;
  }

  /** one blast: a small one per light, the great one at the end (k = size) */
  private burst(p: THREE.Vector3, k: number): void {
    const g = this.g, f = this.owner;
    const big = k > 2;
    const R = (big ? 3 : 1.1) * this.scale;
    g.engine.destruction.carve(new SphereShape(p.clone(), R, 0.5), { mode: 'smash', power: big ? 950 : 420, impulse: big ? 16 : 6, dust: big ? 1.4 : 0.4 });
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      const c = o.center(_v);
      const d = c.distanceTo(p);
      if (d > R + 1.2 + o.def.radius) continue;
      const fall = 1 - Math.min(1, d / (R + 1.6));
      g.damage(o, (big ? 52 : 7.5) * (0.5 + 0.5 * fall) * this.scale, f, _w.subVectors(c, p).setY(0).normalize().clone(), { knock: big ? 22 : 3, launch: big ? 8 : 0.5, heavy: big, energy: true, hitstop: big ? 0.12 : 0.02, shake: big ? 0.55 : 0.08, color: '#FFF0B0', quiet: !big });
    }
    const n = big ? 60 : 12;
    for (let i = 0; i < n; i++) {
      const d = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).normalize();
      const s = (big ? 16 : 7) * (0.5 + Math.random() * 0.6);
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: d.x * s, vy: d.y * s, vz: d.z * s, size: big ? 0.45 : 0.22, sizeEnd: 0.04, life: big ? 0.7 : 0.35, r: KIDO91.body.r, g: KIDO91.body.g, b: KIDO91.body.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2.5, drag: 2.2 });
    }
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: R * 2.4, sizeEnd: R * 0.8, life: big ? 0.4 : 0.18, r: 1, g: 0.95, b: 0.8, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    if (big) {
      g.addRing(p.clone(), R * 3.4, '#FFE7A0', 0.55);
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2;
        g.engine.dust.spawn({ x: p.x + Math.cos(a) * R * 0.6, y: p.y, z: p.z + Math.sin(a) * R * 0.6, vx: Math.cos(a) * 7, vy: 1 + Math.random() * 2, vz: Math.sin(a) * 7, size: 1.2, sizeEnd: 3.4, life: 1.1, r: 0.66, g: 0.6, b: 0.52, alpha: 0.55, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
      }
      g.sfx.play('explode', p, 1.4);
      if (g.player && g.player.pos.distanceTo(p) < 30) g.shake(0.5);
    } else g.sfx.play('impact', p, 0.5);
  }

  dispose(): void {
    this.light.removeFromParent();
    this.light.dispose();
  }
}

/** the Cero lining up as a horizontal bar of crimson light before the hand (k: 0..1 of the charge) */
export function ceroBar(g: Game, at: THREE.Vector3, side: THREE.Vector3, k: number): void {
  const len = 0.3 + k * 2.6;
  const n = 3 + Math.floor(k * 8);
  const body = new THREE.Color(SHINJI_CERO.body), core = new THREE.Color(SHINJI_CERO.core);
  for (let i = 0; i < n; i++) {
    const u = (Math.random() - 0.5) * len;
    const c = Math.random() < 0.35 ? core : body;
    g.engine.glow.spawn({ x: at.x + side.x * u, y: at.y + side.y * u + (Math.random() - 0.5) * 0.06, z: at.z + side.z * u, vx: side.x * (Math.random() - 0.5) * 2, vy: 0, vz: side.z * (Math.random() - 0.5) * 2, size: 0.2 + k * 0.25, sizeEnd: 0.05, life: 0.1, r: c.r, g: c.g, b: c.b, alpha: 1, alphaEnd: 0.3, tex: TEX_GLOW });
  }
  g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, size: 0.4 + k * 1.2, sizeEnd: 0.2, life: 0.08, r: body.r, g: body.g, b: body.b, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
}

// ------------------------------------------------------------------ the Bankai

const DOME_VS = /* glsl */ `
  varying vec3 vN; varying vec3 vW; varying float vY;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vW = wp.xyz; vY = position.y;
    vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;
const DOME_FS = /* glsl */ `
  uniform vec3 uColor; uniform float uA; uniform float uTime;
  varying vec3 vN; varying vec3 vW; varying float vY;
  void main() {
    vec3 v = normalize(cameraPosition - vW);
    float f = 1.0 - abs(dot(normalize(vN), v));
    // slow swirls in the haze so the field reads as moving mist, thinning toward the top
    float s = 0.5 + 0.5 * sin(vW.x * 0.35 + uTime * 0.6) * sin(vW.z * 0.31 - uTime * 0.45);
    float a = uA * (0.06 + 0.22 * f * f + 0.05 * s) * (1.0 - smoothstep(0.55, 1.0, vY));
    gl_FragColor = vec4(uColor * (1.1 + 0.4 * f), a);
  }`;

/**
 * Sakashima Yokoshima Happōfusagari: the golden flower round Shinji and the field of mist it pours out. While
 * the flower stands, everyone but him inside the mist has friend and foe reversed (Fighter.iffT). The petals
 * stay shut round him (a shell), open toward a cut, clamp tight on demand; the mist widens to `maxR` and can be
 * pushed further (pulse). wither() opens the petals wide and sinks the flower back into the ground.
 */
export class HappoFlower implements Projectile {
  done = false;
  readonly v: CharacterVisual;
  readonly centre: THREE.Vector3;
  radius = 0;
  maxR: number;
  private t = 0;
  private endT = -1;
  /** after the flower goes, the mist stays this long */
  private linger = 0;
  private open: number[] = new Array(FLOWER_PETALS).fill(0);
  private want: number[] = new Array(FLOWER_PETALS).fill(0.1);
  private cutT: number[] = new Array(FLOWER_PETALS).fill(0);
  private clampT = 0;
  private emit = 0;
  private bones: number[] = [];
  private axes: THREE.Vector3[] = [];
  private dome: THREE.Mesh;
  private domeMat: THREE.ShaderMaterial;
  private light: THREE.PointLight;

  constructor(private g: Game, readonly owner: Fighter, maxR = 24) {
    this.maxR = maxR;
    this.centre = owner.pos.clone();
    const gy = groundAt(g, this.centre.x, this.centre.y + 1, this.centre.z, 6);
    if (gy !== null) this.centre.y = gy;
    this.v = new CharacterVisual(flowerAsset().model, [], []);
    this.v.forEachMaterial((m) => m.userData.uniforms.uRim.value.set(1, 0.85, 0.5, 0.3));
    for (let i = 0; i < FLOWER_PETALS; i++) {
      this.bones.push(this.v.rig.index(`petal${i}`));
      const a = petalAzimuth(i);
      this.axes.push(new THREE.Vector3(Math.cos(a), 0, -Math.sin(a)));
    }
    this.v.object.position.copy(this.centre);
    g.engine.gr.scene.add(this.v.object);
    this.domeMat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: MIST.clone() }, uA: { value: 0 }, uTime: { value: 0 } },
      vertexShader: DOME_VS, fragmentShader: DOME_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    });
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), this.domeMat);
    this.dome.frustumCulled = false;
    this.dome.renderOrder = 4;
    this.dome.position.copy(this.centre);
    g.engine.gr.scene.add(this.dome);
    this.light = new THREE.PointLight('#FFD27A', 0, 12, 1.6);
    this.light.position.set(this.centre.x, this.centre.y + 3, this.centre.z);
    g.engine.gr.scene.add(this.light);
  }

  get alive(): boolean {
    return this.endT < 0;
  }

  /** the petals are (mostly) shut round him: blows on him land on metal */
  get shut(): boolean {
    let s = 0;
    for (const o of this.open) s += o;
    return this.t > 1 && s / FLOWER_PETALS < 0.35 && this.endT < 0;
  }

  /** where the mist pours from */
  crown(out = new THREE.Vector3()): THREE.Vector3 {
    return out.set(this.centre.x, this.centre.y + FLOWER_CROWN_Y * this.rise * 0.98, this.centre.z);
  }

  private get rise(): number {
    const k = Math.min(1, this.t / 0.55);
    const end = this.endT >= 0 ? Math.max(0, 1 - this.endT / 1.2) : 1;
    return (1 - (1 - k) ** 3) * end;
  }

  inside(p: THREE.Vector3): boolean {
    return Math.hypot(p.x - this.centre.x, p.z - this.centre.z) < this.radius && p.y < this.centre.y + this.radius * 0.8 && p.y > this.centre.y - 4;
  }

  /** the petals facing `dir` swing open for a cut */
  openToward(dir: THREE.Vector3, time = 0.5): void {
    const a = Math.atan2(dir.x, dir.z);
    for (let i = 0; i < FLOWER_PETALS; i++) {
      const d = Math.abs(Math.atan2(Math.sin(petalAzimuth(i) - a), Math.cos(petalAzimuth(i) - a)));
      if (d < 1.0) this.cutT[i] = Math.max(this.cutT[i], time * (1 - d * 0.5));
    }
  }

  /** every petal clamped shut */
  clamp(time: number): void {
    this.clampT = Math.max(this.clampT, time);
  }

  /** the mist pushed further out */
  pulse(extra: number): void {
    this.maxR += extra;
    this.g.addRing(this.centre.clone().setY(this.centre.y + 0.4), this.radius + extra * 0.5, MIST_PINK, 0.8);
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2;
      const p = this.crown(_v);
      this.g.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * 9, vy: 2, vz: Math.sin(a) * 9, size: 2, sizeEnd: 6, life: 2, r: MIST.r, g: MIST.g, b: MIST.b, alpha: 0.35, alphaEnd: 0, tex: TEX_PUFF, drag: 0.8 });
    }
  }

  /** the petals open wide and the flower sinks back into the ground; the mist stays `linger` seconds more */
  wither(linger = 0): void {
    if (this.endT >= 0) return;
    this.endT = 0;
    this.linger = linger;
    for (let i = 0; i < FLOWER_PETALS; i++) this.want[i] = 1;
    this.g.sfx.play('shatter', this.centre, 0.6);
  }

  update(dt: number): void {
    const g = this.g;
    this.t += dt;
    if (this.endT >= 0) {
      this.endT += dt;
      if (this.endT > this.linger) this.radius = Math.max(0, this.radius - dt * this.maxR * 0.5);
      if (this.endT > this.linger + 1.6) this.done = true;
    } else {
      if (this.owner.dead) this.wither();
      // the mist rolls out over the field once the flower has shut
      if (this.t > 0.9) this.radius += (this.maxR - this.radius) * Math.min(1, dt * 0.55) + dt * 0.6;
      this.radius = Math.min(this.radius, this.maxR);
    }
    // friend and foe reversed for everyone in the mist but him (while it lasts)
    if (this.endT < this.linger && this.radius > 1) {
      for (const o of g.fighters) {
        if (o === this.owner || o.dead) continue;
        if (!this.inside(o.center(_v))) continue;
        o.iffT = Math.max(o.iffT, 1.6);
        o.iffFrom = this.centre;
      }
    }
    // the petals: bloom wide as it bursts up, then shut; cuts open those facing out; a clamp shuts them all
    this.clampT = Math.max(0, this.clampT - dt);
    for (let i = 0; i < FLOWER_PETALS; i++) {
      this.cutT[i] = Math.max(0, this.cutT[i] - dt);
      let w = this.endT >= 0 ? 1 : this.t < 0.75 ? 1 : this.want[i];
      if (this.cutT[i] > 0 && this.clampT <= 0) w = Math.max(w, 0.85);
      if (this.clampT > 0 && this.endT < 0) w = 0;
      this.open[i] += (w - this.open[i]) * Math.min(1, dt * (w > this.open[i] ? 14 : 6));
    }
    // the mist: jets from the crown, rolls out low over the ground, and hangs at the edge of the field
    if (this.t > 0.7 && this.endT < this.linger) {
      this.emit += dt * (26 + this.radius * 1.2);
      const crown = this.crown(_w);
      while (this.emit >= 1) {
        this.emit -= 1;
        const r = Math.random();
        if (r < 0.25) {
          const a = Math.random() * Math.PI * 2;
          g.engine.dust.spawn({ x: crown.x, y: crown.y, z: crown.z, vx: Math.cos(a) * 3, vy: 3.5 + Math.random() * 2, vz: Math.sin(a) * 3, size: 1.2, sizeEnd: 4.5, life: 1.8, r: MIST.r, g: MIST.g, b: MIST.b, alpha: 0.4, alphaEnd: 0, tex: TEX_PUFF, drag: 1.1, gravity: -0.6 });
        } else {
          const a = Math.random() * Math.PI * 2;
          const rr = r < 0.6 ? Math.sqrt(Math.random()) * this.radius : this.radius * (0.82 + Math.random() * 0.2);
          const s = 3.5 + Math.random() * 4;
          g.engine.dust.spawn({ x: this.centre.x + Math.cos(a) * rr, y: this.centre.y + 0.4 + Math.random() * Math.random() * 5, z: this.centre.z + Math.sin(a) * rr, vx: Math.cos(a) * 0.6, vy: 0.1, vz: Math.sin(a) * 0.6, size: s, sizeEnd: s * 1.4, life: 2.6 + Math.random() * 1.6, r: MIST.r, g: MIST.g, b: MIST.b, alpha: 0.16, alphaEnd: 0, tex: TEX_PUFF, drag: 0.5, spin: (Math.random() - 0.5) * 0.2 });
        }
      }
      if (Math.random() < dt * 14) {
        const a = Math.random() * Math.PI * 2, rr = Math.random() * this.radius;
        g.engine.glow.spawn({ x: this.centre.x + Math.cos(a) * rr, y: this.centre.y + 0.5 + Math.random() * 3, z: this.centre.z + Math.sin(a) * rr, vy: 0.3, size: 0.12, sizeEnd: 0.02, life: 1.4, r: SPARKLE.r, g: SPARKLE.g, b: SPARKLE.b, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
      }
    }
  }

  render(_dt: number, time: number): void {
    const k = this.rise;
    const o = this.v.object;
    o.position.set(this.centre.x, this.centre.y - (1 - k) * 2.2, this.centre.z);
    o.scale.setScalar(0.35 + 0.65 * k);
    for (let i = 0; i < FLOWER_PETALS; i++) {
      const bi = this.bones[i];
      if (bi < 0) continue;
      // a little shiver in the petals as the mist pours
      const sway = Math.sin(time * 1.7 + i * 1.3) * 0.015;
      this.v.rig.bones[bi].quaternion.setFromAxisAngle(this.axes[i], this.open[i] * 1.25 + sway);
    }
    this.v.forEachMaterial((m) => {
      m.userData.uniforms.uDissolve.value = this.endT >= 0 ? Math.min(1, this.endT / 1.5) : 0;
    });
    o.updateMatrixWorld(true);
    const R = Math.max(0.01, this.radius);
    this.dome.scale.set(R, R * 0.55, R);
    this.domeMat.uniforms.uA.value = Math.min(1, this.radius / 6) * (this.endT > this.linger ? Math.max(0, 1 - (this.endT - this.linger) / 1.2) : 1);
    this.domeMat.uniforms.uTime.value = time;
    this.light.intensity = k * (this.endT >= 0 ? 0 : 6);
  }

  dispose(): void {
    this.v.object.removeFromParent();
    this.dome.removeFromParent();
    this.dome.geometry.dispose();
    this.domeMat.dispose();
    this.light.removeFromParent();
    this.light.dispose();
  }
}
