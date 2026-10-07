// Katen Kyōkotsu's games and Karamatsu Shinjū's acts as effects: the colour coverage Irooni reads off a
// body, the garments Kyōraku throws off, Bushōgoma's wind top and the tornado it becomes, Kageoni's
// shadow pools, Hadō #78 Zangerin's ring, the Bankai's black pine shadows over the ground, the Acts'
// shared wounds, the dark spots, the abyss of water, and the Final Act's thread round the throat.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import type { VoxelModel } from '../models/builder';
import { CharacterVisual } from '../game/characterFactory';
import { Pose } from '../anim/pose';
import { katenAsset } from '../chars/katen';
import { CrescentShape, SphereShape } from '../destruction/shapes';
import { groundAt } from './iceArts';
import type { SkyLook } from './fire';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _c = new THREE.Color();

// ------------------------------------------------------------------ Irooni: colours

export type Colour = 'kuro' | 'shiro' | 'haiiro' | 'aka' | 'momo' | 'daidai' | 'hada' | 'ki' | 'midori' | 'ao' | 'murasaki' | 'cha';

export const COLOURS: Record<Colour, { kanji: string; name: string; hex: string }> = {
  kuro: { kanji: '黒', name: 'black', hex: '#2a2a30' },
  shiro: { kanji: '白', name: 'white', hex: '#f3f3f0' },
  haiiro: { kanji: '灰', name: 'grey', hex: '#9aa0a8' },
  aka: { kanji: '赤', name: 'red', hex: '#d8323f' },
  momo: { kanji: '桃', name: 'pink', hex: '#e98fb5' },
  daidai: { kanji: '橙', name: 'orange', hex: '#f0a050' },
  hada: { kanji: '肌', name: 'skin', hex: '#eac6a3' },
  ki: { kanji: '黄', name: 'yellow', hex: '#f2c94c' },
  midori: { kanji: '緑', name: 'green', hex: '#5aa86a' },
  ao: { kanji: '青', name: 'blue', hex: '#4a7ad8' },
  murasaki: { kanji: '紫', name: 'purple', hex: '#8a5ac8' },
  cha: { kanji: '茶', name: 'brown', hex: '#7a5032' },
};

const _hsl = { h: 0, s: 0, l: 0 };

/** the colour family a palette entry belongs to */
export function colourOf(hex: string): Colour {
  _c.set(hex).getHSL(_hsl, THREE.SRGBColorSpace);
  const { h, s, l } = _hsl;
  if (l < 0.17) return 'kuro';
  if (s < 0.14 || (s < 0.22 && l > 0.8)) return l > 0.76 ? 'shiro' : l < 0.3 ? 'kuro' : 'haiiro';
  const deg = h * 360;
  if (deg >= 12 && deg < 45 && l > 0.55 && s < 0.78) return 'hada';
  if (deg < 12 || deg >= 345) return l > 0.64 ? 'momo' : 'aka';
  if (deg < 40) return l < 0.45 || s < 0.42 ? 'cha' : 'daidai';
  if (deg < 68) return l < 0.36 ? 'cha' : 'ki';
  if (deg < 165) return 'midori';
  if (deg < 255) return 'ao';
  if (deg < 300) return 'murasaki';
  return l > 0.55 ? 'momo' : 'aka';
}

const coverCache = new WeakMap<VoxelModel, Map<Colour, number>>();

/** Share of a body's visible surface in each colour family (0..1), counted over the outer voxels. */
export function coverage(model: VoxelModel): Map<Colour, number> {
  let m = coverCache.get(model);
  if (m) return m;
  const fam = model.palette.map((p) => colourOf(p.color));
  const counts = new Map<Colour, number>();
  let total = 0;
  for (const g of model.grids)
    g.forEach((x, y, z, v) => {
      const idx = v & 0xff;
      if (!idx) return;
      if (g.get(x + 1, y, z) && g.get(x - 1, y, z) && g.get(x, y + 1, z) && g.get(x, y - 1, z) && g.get(x, y, z + 1) && g.get(x, y, z - 1)) return;
      const f = fam[idx] ?? 'haiiro';
      counts.set(f, (counts.get(f) ?? 0) + 1);
      total++;
    });
  m = new Map([...counts].map(([k, n]) => [k, n / Math.max(1, total)] as [Colour, number]));
  coverCache.set(model, m);
  return m;
}

/** Irooni's rule: a hit on the called colour scales with how much of it the caller wears. */
export function irooniScale(callerCover: number): number {
  return 0.1 + 3 * callerCover;
}

// ------------------------------------------------------------------ the garments

function garmentTexture(kind: 'kimono' | 'haori'): THREE.CanvasTexture {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d')!;
  if (kind === 'kimono') {
    x.fillStyle = '#e98fb5';
    x.fillRect(0, 0, S, S);
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 26; i++) {
      const cx = rnd() * S, cy = rnd() * S, r = 5 + rnd() * 4;
      x.fillStyle = rnd() < 0.5 ? '#f7e4ec' : '#c65a86';
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        x.beginPath();
        x.arc(cx + Math.cos(a) * r * 0.6, cy + Math.sin(a) * r * 0.6, r * 0.5, 0, Math.PI * 2);
        x.fill();
      }
      x.fillStyle = '#f2c14e';
      x.beginPath();
      x.arc(cx, cy, r * 0.25, 0, Math.PI * 2);
      x.fill();
    }
    x.fillStyle = '#c4658e';
    x.fillRect(0, 0, S, 6);
  } else {
    x.fillStyle = '#f4f3ef';
    x.fillRect(0, 0, S, S);
    x.fillStyle = '#b3446c';
    x.fillRect(0, 0, S, 5);
    x.fillRect(0, 0, 5, S);
    x.fillRect(S - 5, 0, 5, S);
    x.fillStyle = '#141418';
    x.font = 'bold 54px serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText('八', S / 2, S / 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * A garment flung off at the target: it flies open, billowing, wraps over whoever it reaches (they lose
 * sight of him a moment), then slides off and lies crumpled on the ground until it fades.
 */
export class ThrownGarment implements Projectile {
  done = false;
  readonly pos = new THREE.Vector3();
  private mesh: THREE.Mesh;
  private geo: THREE.PlaneGeometry;
  private base: Float32Array;
  private vel = new THREE.Vector3();
  private t = 0;
  private wrapped: Fighter | null = null;
  private wrapT = 0;
  private landed = false;
  private spin = Math.random() * 6;

  constructor(private g: Game, private owner: Fighter, kind: 'kimono' | 'haori', from: THREE.Vector3, private target: Fighter | null) {
    this.geo = new THREE.PlaneGeometry(1.7, 1.5, 8, 8);
    this.base = (this.geo.getAttribute('position').array as Float32Array).slice();
    this.mesh = new THREE.Mesh(this.geo, new THREE.MeshStandardMaterial({ map: garmentTexture(kind), side: THREE.DoubleSide, roughness: 0.9, metalness: 0 }));
    this.mesh.castShadow = true;
    this.mesh.frustumCulled = false;
    this.pos.copy(from);
    this.mesh.position.copy(from);
    const to = target ? _v.subVectors(target.center(), from) : owner.forward(_v).multiplyScalar(6);
    const d = to.length();
    this.vel.copy(to).normalize().multiplyScalar(Math.min(16, 6 + d * 1.6));
    this.vel.y += 3.5;
    g.engine.gr.scene.add(this.mesh);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.wrapped) {
      const o = this.wrapped;
      this.wrapT += dt;
      this.pos.copy(o.center()).y += 0.35;
      if (this.wrapT > 1.1 || o.dead) {
        this.wrapped = null;
        this.vel.set((Math.random() - 0.5) * 2, 1, (Math.random() - 0.5) * 2);
      }
      return;
    }
    if (!this.landed) {
      this.vel.y -= 9 * dt;
      this.vel.multiplyScalar(1 - Math.min(0.5, dt * 0.9));
      this.pos.addScaledVector(this.vel, dt);
      const tg = this.target;
      if (tg && !tg.dead && this.t < 1.6 && this.pos.distanceTo(tg.center()) < 1.0) {
        this.wrapped = tg;
        this.target = null;
        tg.hitstun = Math.max(tg.hitstun, 0.4);
        g.sfx.play('swing', this.pos, 0.6);
        return;
      }
      const gy = groundAt(g, this.pos.x, this.pos.y + 0.5, this.pos.z, 3);
      if (gy !== null && this.pos.y < gy + 0.06 && this.vel.y < 0) {
        this.landed = true;
        this.pos.y = gy + 0.06;
      }
    }
    if (this.t > 9) this.done = true;
  }

  render(_dt: number, time: number): void {
    const m = this.mesh;
    m.position.copy(this.pos);
    const pos = this.geo.getAttribute('position') as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const fade = Math.min(1, Math.max(0, 9 - this.t));
    (m.material as THREE.MeshStandardMaterial).opacity = fade;
    (m.material as THREE.MeshStandardMaterial).transparent = fade < 1;
    if (this.landed) {
      // lying crumpled on the ground
      m.rotation.set(-Math.PI / 2, 0, this.spin);
      for (let i = 0; i < arr.length; i += 3) arr[i + 2] = Math.sin(this.base[i] * 4 + this.base[i + 1] * 3) * 0.06 + 0.04;
    } else if (this.wrapped) {
      // draped over the head and shoulders, the hem flapping
      m.rotation.set(0, Math.atan2(this.owner.pos.x - this.pos.x, this.owner.pos.z - this.pos.z), 0);
      for (let i = 0; i < arr.length; i += 3) {
        const x = this.base[i], y = this.base[i + 1];
        arr[i + 2] = -Math.cos(x * 1.6) * 0.45 + Math.sin(time * 9 + y * 4) * 0.05 * (0.75 - y);
      }
    } else {
      // flying open, rippling, turning over slowly
      this.spin += 0.02;
      m.rotation.set(-0.6 + Math.sin(this.spin) * 0.3, Math.atan2(this.vel.x, this.vel.z), Math.sin(this.spin * 0.7) * 0.4);
      for (let i = 0; i < arr.length; i += 3) {
        const x = this.base[i], y = this.base[i + 1];
        arr[i + 2] = Math.sin(time * 10 + x * 3 + y * 2) * 0.16 + Math.cos(y * 2.2) * 0.12;
      }
    }
    pos.needsUpdate = true;
    this.geo.computeVertexNormals();
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.geo.dispose();
    const mat = this.mesh.material as THREE.MeshStandardMaterial;
    mat.map?.dispose();
    mat.dispose();
  }
}

// ------------------------------------------------------------------ Bushōgoma

export interface WindTopOpts {
  speed: number;
  range: number;
  /** damage per cut inside the tornado */
  cut: number;
  /** how long the tornado holds (s) */
  hold: number;
}

/**
 * Bushōgoma: the wind blades flung off his spin merge into a spinning ring that skates toward the target;
 * where it meets someone it rises into a tornado round them — held, turned about, cut again and again —
 * and throws them out at the end.
 */
export class WindTop implements Projectile {
  done = false;
  readonly pos = new THREE.Vector3();
  private dir = new THREE.Vector3();
  private dist = 0;
  private storm: Fighter | null = null;
  private stormT = -1;
  private cutAcc = 0;
  private carveAcc = 0;
  private ang = 0;

  constructor(private g: Game, private owner: Fighter, from: THREE.Vector3, dir: THREE.Vector3, private target: Fighter | null, readonly o: WindTopOpts) {
    this.pos.copy(from);
    this.dir.copy(dir).setY(0).normalize();
  }

  update(dt: number, g: Game): void {
    this.ang += dt * 16;
    if (this.stormT < 0) {
      // skating out, bending toward the target
      const tg = this.target;
      if (tg && !tg.dead) {
        _v.subVectors(tg.pos, this.pos).setY(0).normalize();
        this.dir.lerp(_v, Math.min(1, dt * 2.2)).normalize();
      }
      const step = this.o.speed * dt;
      this.pos.addScaledVector(this.dir, step);
      this.dist += step;
      const gy = groundAt(g, this.pos.x, this.pos.y + 1.5, this.pos.z, 4);
      if (gy !== null) this.pos.y += (gy + 0.9 - this.pos.y) * Math.min(1, dt * 10);
      this.ring(g, 1.3, 14, 0.7);
      for (const o of g.enemiesOf(this.owner)) {
        if (o.center().distanceTo(this.pos) < 1.6 + o.def.radius) {
          this.rise(g, o);
          break;
        }
      }
      if (this.stormT < 0 && this.dist > this.o.range) this.rise(g, null);
      return;
    }
    this.stormT += dt;
    const o = this.storm;
    if (o && !o.dead) {
      // held in the eye, lifted a little, turned about
      this.pos.x += (o.pos.x - this.pos.x) * Math.min(1, dt * 6);
      this.pos.z += (o.pos.z - this.pos.z) * Math.min(1, dt * 6);
      o.hitstun = Math.max(o.hitstun, 0.25);
      o.push.set(0, 0, 0);
      o.body.vel.x = (this.pos.x - o.pos.x) * 6;
      o.body.vel.z = (this.pos.z - o.pos.z) * 6;
      o.body.vel.y = Math.max(o.body.vel.y, this.stormT < 0.8 ? 3.2 : 0.4);
      o.yaw += dt * 9;
      this.cutAcc += dt;
      if (this.cutAcc > 0.22) {
        this.cutAcc = 0;
        _w.set(Math.sin(this.ang), 0, Math.cos(this.ang));
        g.damage(o, this.o.cut, this.owner, _w.clone(), { knock: 0, quiet: true, color: '#e8f4f0' });
        g.sparks(o.center(), _w, '#e8f4f0', 4);
      }
    }
    // the funnel: blades of wind spiralling up, dust drawn in at the foot
    for (let k = 0; k < 4; k++) this.ring(g, 1.2 + k * 0.45, 7, 0.4 + k * 1.1);
    this.carveAcc += dt;
    if (this.carveAcc > 0.35) {
      this.carveAcc = 0;
      g.engine.destruction.carve(new SphereShape(this.pos.clone().setY(this.pos.y - 0.6), 1.5, 0.6), { mode: 'smash', power: 90, impulse: 6, dust: 0.5 });
    }
    if (this.stormT > this.o.hold) {
      if (o && !o.dead) {
        _w.subVectors(o.pos, this.owner.pos).setY(0).normalize();
        g.damage(o, this.o.cut * 3, this.owner, _w.clone(), { knock: 16, launch: 9, heavy: true, hitstop: 0.1, shake: 0.4 });
      }
      this.done = true;
    }
  }

  private rise(g: Game, o: Fighter | null): void {
    this.storm = o;
    this.stormT = 0;
    g.sfx.play('flare', this.pos, 0.7);
  }

  /** a ring of wind blades at height h above the centre */
  private ring(g: Game, r: number, n: number, h: number): void {
    const glow = g.engine.glow;
    for (let i = 0; i < n; i++) {
      if (Math.random() < 0.5) continue;
      const a = this.ang + (i / n) * Math.PI * 2;
      const x = this.pos.x + Math.sin(a) * r, z = this.pos.z + Math.cos(a) * r;
      const tx = Math.cos(a), tz = -Math.sin(a);
      glow.spawn({
        x, y: this.pos.y - 0.6 + h, z, vx: tx * 11, vy: 1.5 + h * 0.6, vz: tz * 11,
        size: 0.42, sizeEnd: 0.12, life: 0.22, r: 0.85, g: 0.95, b: 0.9, alpha: 0.65, alphaEnd: 0, tex: TEX_STREAK, stretch: 4,
      });
    }
    if (Math.random() < 0.4) g.engine.dust.spawn({ x: this.pos.x + (Math.random() - 0.5) * 3, y: this.pos.y - 0.7, z: this.pos.z + (Math.random() - 0.5) * 3, vx: 0, vy: 2.4, vz: 0, size: 0.6, sizeEnd: 1.6, life: 0.6, r: 0.72, g: 0.68, b: 0.6, alpha: 0.45, alphaEnd: 0, tex: TEX_PUFF, drag: 1.2 });
  }

  dispose(): void {}
}

// ------------------------------------------------------------------ Kageoni: shadow pools

let shadowTex: THREE.CanvasTexture | null = null;
function shadowTexture(): THREE.CanvasTexture {
  if (shadowTex) return shadowTex;
  const S = 128;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d')!;
  const gr = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, 'rgba(0,0,0,1)');
  gr.addColorStop(0.55, 'rgba(0,0,0,0.95)');
  gr.addColorStop(0.8, 'rgba(0,0,0,0.5)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = gr;
  x.fillRect(0, 0, S, S);
  shadowTex = new THREE.CanvasTexture(c);
  return shadowTex;
}

/** A pool of shadow flat on the ground that opens, holds and closes (he sinks into one and rises from another). */
export class ShadowPool implements Projectile {
  done = false;
  private mesh: THREE.Mesh;
  private t = 0;

  constructor(g: Game, readonly at: THREE.Vector3, private radius: number, private life: number, private follow: Fighter | null = null) {
    const geo = new THREE.CircleGeometry(1, 40);
    geo.rotateX(-Math.PI / 2);
    this.mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, color: '#050505' }));
    this.mesh.renderOrder = 3;
    this.mesh.position.copy(at);
    this.mesh.position.y += 0.04;
    this.mesh.scale.setScalar(0.01);
    g.engine.gr.scene.add(this.mesh);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.follow && !this.follow.dead) {
      this.at.x = this.follow.pos.x;
      this.at.z = this.follow.pos.z;
      const gy = groundAt(g, this.at.x, this.follow.pos.y + 0.5, this.at.z, 6);
      if (gy !== null) this.at.y = gy;
    }
    // inky wisps curling up off the rim
    if (Math.random() < 0.6) {
      const a = Math.random() * Math.PI * 2;
      const r = this.radius * (0.6 + Math.random() * 0.4) * this.open();
      g.engine.dust.spawn({ x: this.at.x + Math.sin(a) * r, y: this.at.y + 0.05, z: this.at.z + Math.cos(a) * r, vx: 0, vy: 1.2, vz: 0, size: 0.3, sizeEnd: 0.8, life: 0.7, r: 0.02, g: 0.02, b: 0.03, alpha: 0.7, alphaEnd: 0, tex: TEX_PUFF, drag: 1 });
    }
    if (this.t > this.life) this.done = true;
  }

  private open(): number {
    const a = Math.min(1, this.t / 0.18), b = Math.min(1, Math.max(0, (this.life - this.t) / 0.25));
    return Math.min(a, b);
  }

  render(): void {
    this.mesh.position.set(this.at.x, this.at.y + 0.04, this.at.z);
    this.mesh.scale.setScalar(Math.max(0.01, this.radius * this.open()));
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

// ------------------------------------------------------------------ Hadō #78 Zangerin

/**
 * Zangerin: the reiatsu gathered in the blade bursts out as a flat ring of golden light at waist height,
 * racing outward — it cuts clean through the walls it passes and whoever stands in its way.
 */
export class ZangerinRing implements Projectile {
  done = false;
  private mesh: THREE.Mesh;
  private r = 0.6;
  private t = 0;
  private nextCut = 1.5;
  private hits = new Set<number>();
  private u: Record<string, THREE.IUniform>;

  constructor(private g: Game, private owner: Fighter, private center: THREE.Vector3, private maxR: number, private damage: number) {
    this.u = { uT: { value: 0 } };
    const geo = new THREE.CylinderGeometry(1, 1, 1, 96, 1, true);
    this.mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      uniforms: this.u,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float uT; varying vec2 vUv;
        void main() {
          float band = 1.0 - abs(vUv.y - 0.5) * 2.0;
          band = band * band;
          float a = band * (1.0 - uT);
          vec3 c = mix(vec3(1.0, 0.72, 0.22), vec3(1.0, 0.95, 0.75), band);
          gl_FragColor = vec4(c * 1.6, a);
        }`,
    }));
    this.mesh.position.copy(center);
    this.mesh.renderOrder = 6;
    this.mesh.frustumCulled = false;
    g.engine.gr.scene.add(this.mesh);
    g.callout('斬華輪', 'HADŌ #78 — ZANGERIN', '#f2c744');
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const speed = 30;
    this.r += speed * dt;
    this.u.uT.value = Math.min(1, this.r / this.maxR);
    // cut the world as it passes: three overlapping arcs make the circle
    while (this.r > this.nextCut && this.nextCut < this.maxR) {
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2;
        const fwd = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
        const side = new THREE.Vector3(Math.cos(a), 0, -Math.sin(a));
        g.engine.destruction.carve(new CrescentShape(this.center.clone(), fwd, side, this.nextCut, 1.25, 0.32, 0.22), { mode: 'cut', power: 600, impulse: 3 });
      }
      this.nextCut += 2;
    }
    for (const o of g.enemiesOf(this.owner)) {
      if (this.hits.has(o.id)) continue;
      const d = Math.hypot(o.pos.x - this.center.x, o.pos.z - this.center.z);
      if (Math.abs(d - this.r) > 0.9 + o.def.radius) continue;
      if (this.center.y < o.pos.y - 0.4 || this.center.y > o.pos.y + o.def.height + 0.4) continue;
      this.hits.add(o.id);
      _v.set(o.pos.x - this.center.x, 0, o.pos.z - this.center.z).normalize();
      g.damage(o, this.damage, this.owner, _v.clone(), { knock: 18, launch: 4, heavy: true, hitstop: 0.1, shake: 0.4, color: '#f2c744' });
    }
    if (this.r >= this.maxR) this.done = true;
  }

  render(): void {
    this.mesh.scale.set(this.r, 0.55, this.r);
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

// ------------------------------------------------------------------ Karamatsu Shinjū

/** the Bankai's sky: gloomy and drained, a dull gold glow low down like a painted theatre backdrop */
export const SKY_GLOOM: SkyLook = { zen: '#26221C', hor: '#8A7440', cloud: '#3A3228', cover: 0.92, glow: 0.35, sun: 0.4, hemi: 0.55, fog: '#5A4E3A' };
/** the third Act: the deep */
export const SKY_ABYSS: SkyLook = { zen: '#0A2230', hor: '#18495F', cloud: '#123446', cover: 0.95, glow: 0.2, sun: 0.35, hemi: 0.6, fog: '#18495F' };

interface Branch {
  a: THREE.Vector3;
  b: THREE.Vector3;
  w: number;
  /** distance from the root where it starts growing */
  born: number;
}

/**
 * The black shadows of an old pine spreading over the ground from where he stands: crooked limbs forking
 * as they go, tufts of needles at the ends. They grow out over a second or so and stay while the play lasts.
 */
export class PineShadows implements Projectile {
  done = false;
  private mesh: THREE.InstancedMesh;
  private branches: Branch[] = [];
  private grow = 0;
  private fade = 1;
  private ending = false;
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private s = new THREE.Vector3();
  private p = new THREE.Vector3();

  constructor(private g: Game, readonly center: THREE.Vector3, reach = 22) {
    let seed = 1234;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const y0 = center.y + 0.03;
    const limb = (from: THREE.Vector3, ang: number, len: number, w: number, born: number, depth: number) => {
      let p = from.clone(), a = ang, d = born;
      const n = Math.ceil(len / 1.1);
      for (let i = 0; i < n; i++) {
        a += (rnd() - 0.5) * 0.7;
        const seg = 0.8 + rnd() * 0.6;
        const q = p.clone().add(new THREE.Vector3(Math.sin(a) * seg, 0, Math.cos(a) * seg));
        const gy = groundAt(g, q.x, center.y + 2, q.z, 6);
        q.y = (gy ?? center.y) + 0.03;
        const ww = w * (1 - (i / n) * 0.7);
        this.branches.push({ a: p, b: q, w: ww, born: d });
        d += seg;
        p = q;
        if (depth > 0 && i % 2 === 1 && rnd() < 0.75) limb(p, a + (rnd() < 0.5 ? -1 : 1) * (0.6 + rnd() * 0.5), len * 0.5, ww * 0.7, d, depth - 1);
      }
      // a tuft of needles at the tip
      for (let k = 0; k < 6; k++) {
        const na = a + (k - 2.5) * 0.35;
        const q = p.clone().add(new THREE.Vector3(Math.sin(na) * 0.6, 0, Math.cos(na) * 0.6));
        this.branches.push({ a: p, b: q, w: 0.05, born: d });
      }
    };
    const n = 7;
    for (let i = 0; i < n; i++) limb(new THREE.Vector3(center.x, y0, center.z), (i / n) * Math.PI * 2 + rnd() * 0.5, reach * (0.6 + rnd() * 0.4), 0.34, 0, 2);
    const geo = new THREE.BoxGeometry(1, 0.03, 1);
    this.mesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: '#070707', transparent: true, opacity: 0.92, depthWrite: false }), this.branches.length);
    this.mesh.renderOrder = 3;
    this.mesh.frustumCulled = false;
    g.engine.gr.scene.add(this.mesh);
  }

  /** the play is over: the shadows draw back */
  end(): void {
    this.ending = true;
  }

  update(dt: number): void {
    if (this.ending) {
      this.fade -= dt * 0.8;
      if (this.fade <= 0) this.done = true;
    } else this.grow += dt * 16;
  }

  render(): void {
    const up = _w.set(0, 1, 0);
    let i = 0;
    for (const br of this.branches) {
      const k = Math.max(0, Math.min(1, (this.grow - br.born) / 1.2)) * this.fade;
      this.p.subVectors(br.b, br.a);
      const len = this.p.length() * k;
      this.q.setFromAxisAngle(up, Math.atan2(this.p.x, this.p.z));
      this.s.set(br.w * Math.max(0.01, k), 1, Math.max(0.001, len));
      this.p.normalize().multiplyScalar(len / 2).add(br.a);
      this.m.compose(this.p, this.q, this.s);
      this.mesh.setMatrixAt(i++, this.m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    (this.mesh.material as THREE.MeshBasicMaterial).opacity = 0.92 * this.fade;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

/** Act 1: the wounds he took from his partner open again on the partner — red cuts across the body */
export function sharedWounds(g: Game, o: Fighter, n: number): void {
  const c = o.center();
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const y = c.y + (Math.random() - 0.4) * o.def.height * 0.6;
    g.engine.glow.spawn({ x: c.x + Math.sin(a) * 0.3, y, z: c.z + Math.cos(a) * 0.3, vx: Math.cos(a) * 3, vy: (Math.random() - 0.5) * 2, vz: -Math.sin(a) * 3, size: 0.5, sizeEnd: 0.1, life: 0.5, r: 0.85, g: 0.08, b: 0.1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
    g.engine.dust.spawn({ x: c.x, y, z: c.z, vx: (Math.random() - 0.5) * 4, vy: Math.random() * 2, vz: (Math.random() - 0.5) * 4, size: 0.12, sizeEnd: 0.05, life: 0.8, r: 0.55, g: 0.04, b: 0.06, alpha: 0.9, alphaEnd: 0, tex: TEX_PUFF, gravity: 9 });
  }
}

/** Act 2: dark spots spread over the partner and blood seeps from them while it lasts */
export class DarkSpots implements Projectile {
  done = false;
  private t = 0;
  private acc = 0;
  private spots: { y: number; a: number; r: number; at: number }[] = [];

  constructor(private g: Game, private o: Fighter, private life: number) {
    for (let i = 0; i < 14; i++) this.spots.push({ y: 0.15 + Math.random() * 0.75, a: Math.random() * Math.PI * 2, r: 0.12 + Math.random() * 0.1, at: Math.random() * 1.5 });
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    this.acc += dt;
    const o = this.o;
    if (o.dead || this.t > this.life) {
      this.done = true;
      return;
    }
    if (this.acc < 0.08) return;
    this.acc = 0;
    for (const s of this.spots) {
      if (this.t < s.at) continue;
      const grow = Math.min(1, (this.t - s.at) / 1.5);
      const rr = o.def.radius * 0.95;
      const x = o.pos.x + Math.sin(s.a + o.yaw) * rr, z = o.pos.z + Math.cos(s.a + o.yaw) * rr, y = o.pos.y + s.y * o.def.height;
      g.engine.dust.spawn({ x, y, z, vx: 0, vy: 0, vz: 0, size: s.r * grow * 2.2, sizeEnd: s.r * grow * 2.2, life: 0.12, r: 0.06, g: 0.03, b: 0.03, alpha: 0.95, alphaEnd: 0.8, tex: TEX_PUFF });
      if (Math.random() < 0.08) g.engine.dust.spawn({ x, y, z, vx: 0, vy: -0.5, vz: 0, size: 0.06, sizeEnd: 0.04, life: 0.7, r: 0.5, g: 0.03, b: 0.05, alpha: 0.9, alphaEnd: 0, tex: TEX_PUFF, gravity: 6 });
    }
  }

  dispose(): void {}
}

/**
 * Act 3: the water — a sea rises over the field and closes over both players. Inside it the light is
 * green-blue and dim, bubbles drift up, and the surface shimmers far above.
 */
export class Abyss implements Projectile {
  done = false;
  private box: THREE.Mesh;
  private surf: THREE.Mesh;
  private level = 0;
  private t = 0;
  private draining = false;
  private u: Record<string, THREE.IUniform>;

  constructor(private g: Game, readonly center: THREE.Vector3, private size = 60, private depth = 14) {
    this.u = { uTime: { value: 0 } };
    this.box = new THREE.Mesh(new THREE.BoxGeometry(size, 1, size), new THREE.MeshBasicMaterial({ color: '#18495F', transparent: true, opacity: 0.38, side: THREE.BackSide, depthWrite: false }));
    this.box.renderOrder = 8;
    this.box.frustumCulled = false;
    const sg = new THREE.PlaneGeometry(size, size, 1, 1);
    sg.rotateX(-Math.PI / 2);
    this.surf = new THREE.Mesh(sg, new THREE.ShaderMaterial({
      uniforms: this.u,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      vertexShader: `varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `uniform float uTime; varying vec3 vW;
        void main() {
          float c = sin(vW.x * 1.3 + uTime * 1.7) * sin(vW.z * 1.1 - uTime * 1.3) + sin((vW.x + vW.z) * 0.7 + uTime);
          c = max(0.0, c) * 0.5;
          gl_FragColor = vec4(mix(vec3(0.1, 0.29, 0.37), vec3(0.37, 0.65, 0.75), c), 0.55);
        }`,
    }));
    this.surf.renderOrder = 8;
    this.surf.frustumCulled = false;
    g.engine.gr.scene.add(this.box, this.surf);
  }

  /** the water's surface (world y) */
  get top(): number {
    return this.center.y + this.level;
  }

  /** inside the sea */
  holds(p: THREE.Vector3): boolean {
    return Math.abs(p.x - this.center.x) < this.size / 2 && Math.abs(p.z - this.center.z) < this.size / 2 && p.y < this.top;
  }

  drain(): void {
    this.draining = true;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    this.level = this.draining ? Math.max(0, this.level - dt * 10) : Math.min(this.depth, this.level + dt * 9);
    if (this.draining && this.level <= 0) this.done = true;
    // bubbles
    for (let i = 0; i < 3; i++) {
      const x = this.center.x + (Math.random() - 0.5) * 24, z = this.center.z + (Math.random() - 0.5) * 24;
      g.engine.glow.spawn({ x, y: this.center.y + Math.random() * this.level, z, vx: 0, vy: 1.6, vz: 0, size: 0.1, sizeEnd: 0.14, life: 1.2, r: 0.6, g: 0.85, b: 0.95, alpha: 0.5, alphaEnd: 0, tex: TEX_GLOW });
    }
  }

  render(): void {
    this.u.uTime.value = this.t;
    const h = Math.max(0.01, this.level);
    this.box.scale.set(1, h, 1);
    this.box.position.set(this.center.x, this.center.y + h / 2, this.center.z);
    this.surf.position.set(this.center.x, this.center.y + h, this.center.z);
    this.surf.visible = this.level > 0.05;
  }

  dispose(): void {
    this.box.removeFromParent();
    this.surf.removeFromParent();
    this.box.geometry.dispose();
    this.surf.geometry.dispose();
    (this.box.material as THREE.Material).dispose();
    (this.surf.material as THREE.Material).dispose();
  }
}

/**
 * The Final Act: a white thread runs from his fingertips and winds three times round the partner's
 * throat; it tightens, and the cut it leaves glows gold and bursts.
 */
export class ThroatThread implements Projectile {
  done = false;
  private line: THREE.Line;
  private loops: THREE.Line;
  private pts: Float32Array;
  private t = 0;
  tight = 0;
  private burst = false;
  private burstT = 0;

  constructor(private g: Game, private from: () => THREE.Vector3, private o: Fighter) {
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    this.line = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.95 }));
    this.pts = new Float32Array(3 * 64);
    const cg = new THREE.BufferGeometry();
    cg.setAttribute('position', new THREE.BufferAttribute(this.pts, 3));
    this.loops = new THREE.Line(cg, new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.95 }));
    this.line.frustumCulled = this.loops.frustumCulled = false;
    g.engine.gr.scene.add(this.line, this.loops);
  }

  /** the throat (world), just under the chin */
  throat(out = new THREE.Vector3()): THREE.Vector3 {
    return out.set(this.o.pos.x, this.o.pos.y + this.o.def.height * 0.84, this.o.pos.z);
  }

  /** the cut glows and bursts */
  cut(): void {
    if (this.burst) return;
    this.burst = true;
    const g = this.g;
    const p = this.throat();
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.3) * 1.4;
      const sp = 3 + Math.random() * 9;
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * Math.cos(e) * sp, vy: Math.sin(e) * sp + 2, vz: Math.sin(a) * Math.cos(e) * sp, size: 0.4, sizeEnd: 0.05, life: 0.7, r: 1, g: 0.83, b: 0.35, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 1.5 });
    }
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 3.4, sizeEnd: 0.4, life: 0.5, r: 1, g: 0.85, b: 0.4, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    g.addRing(p, 4, '#ffd45a', 0.5);
  }

  update(dt: number): void {
    this.t += dt;
    if (this.burst && (this.burstT += dt) > 0.8) this.done = true;
  }

  render(_dt: number, time: number): void {
    const a = this.from(), b = this.throat(_v);
    const lp = this.line.geometry.getAttribute('position') as THREE.BufferAttribute;
    lp.setXYZ(0, a.x, a.y, a.z);
    lp.setXYZ(1, b.x, b.y, b.z);
    lp.needsUpdate = true;
    // three turns round the neck, closing as it tightens
    const r = 0.13 * (1 - this.tight * 0.6);
    for (let i = 0; i < 64; i++) {
      const u = i / 63, ang = u * Math.PI * 6 + time * 0.5;
      this.pts[i * 3] = b.x + Math.cos(ang) * r;
      this.pts[i * 3 + 1] = b.y + (u - 0.5) * 0.08;
      this.pts[i * 3 + 2] = b.z + Math.sin(ang) * r;
    }
    (this.loops.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    const glowing = this.burst ? 1 : this.tight;
    (this.loops.material as THREE.LineBasicMaterial).color.setRGB(1, 1 - glowing * 0.17, 1 - glowing * 0.65);
    this.line.visible = !this.burst;
    this.loops.visible = !this.burst || this.burstT < 0.2;
  }

  dispose(): void {
    for (const l of [this.line, this.loops]) {
      l.removeFromParent();
      l.geometry.dispose();
      (l.material as THREE.Material).dispose();
    }
  }
}

/**
 * Katen herself, leaning over his shoulder while the play runs: she fades in behind him as the Bankai opens
 * and keeps her place there, a little above him, gently swaying, until the curtain falls.
 */
export class KatenSpirit implements Projectile {
  done = false;
  private v: CharacterVisual;
  private pose: Pose;
  private t = 0;
  private ending = false;
  private endT = 0;

  constructor(g: Game, private owner: Fighter) {
    const a = katenAsset();
    this.v = new CharacterVisual(a.model, a.springs, a.colliders);
    this.pose = new Pose(this.v.rig.count);
    const r = this.v.rig;
    const set = (n: string, x: number, y: number, z: number) => {
      const i = r.index(n);
      if (i >= 0) this.pose.setEuler(i, x, y, z);
    };
    // bent over him, one arm draped forward over his shoulder, the other loose at her side
    set('spine', 14, 0, 0);
    set('chest', 12, -12, 0);
    set('neck', 8, 0, 0);
    set('head', 12, -16, 10);
    set('upperarm.L', -50, 0, 14);
    set('forearm.L', -56, 0, 0);
    set('upperarm.R', -84, 0, -14);
    set('forearm.R', -24, 0, 0);
    set('thigh.L', -8, 0, 2);
    set('thigh.R', 6, 0, -2);
    set('shin.L', 12, 0, 0);
    r.applyPose(this.pose);
    this.dissolve(1);
    g.engine.gr.scene.add(this.v.object);
  }

  end(): void {
    this.ending = true;
  }

  private dissolve(k: number): void {
    (this.v.material.userData.uniforms as { uDissolve: { value: number } }).uDissolve.value = k;
  }

  update(dt: number): void {
    this.t += dt;
    if (this.ending && (this.endT += dt) > 1.1) this.done = true;
  }

  render(_dt: number, time: number): void {
    const f = this.owner;
    const fw = f.forward(_v);
    const o = this.v.object;
    // behind him and to his left, her head over his shoulder
    o.position.copy(f.renderPos).addScaledVector(fw, -0.8);
    o.position.x += fw.z * 0.35;
    o.position.z -= fw.x * 0.35;
    o.position.y += 0.45 + Math.sin(time * 1.3) * 0.06;
    o.rotation.y = f.yaw + Math.sin(time * 0.7) * 0.04;
    const k = this.ending ? Math.max(0, 1 - this.endT / 1.1) : Math.min(1, this.t / 0.9);
    this.dissolve(1 - k);
    this.v.rig.applyPose(this.pose);
    o.updateMatrixWorld(true);
  }

  dispose(): void {
    this.v.object.removeFromParent();
  }
}
