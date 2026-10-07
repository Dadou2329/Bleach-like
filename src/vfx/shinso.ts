// Gin's arts. Shinsō's extension: the blade glows white and shoots out of the point, a thin bright line
// with a pale-blue rim that can reach fifty metres (Shikai) or the far side of the town (Bankai), and pulls
// back as fast. Hakufuku: phantom purple blossoms fall round the target, its sight blurs and it drops
// asleep. Sentan Hakuja: a long white cloth whirls round the target, tightens, and with a white flash the
// target is somewhere else. Korose: what the Bankai left inside the target turns to poison, and it comes
// apart from the inside in dark violet dust.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

const _v = new THREE.Vector3();

// ------------------------------------------------------------------ the extension

const EXT_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const EXT_FRAG = /* glsl */ `
uniform vec3 uCore; uniform vec3 uRim; uniform float uA; uniform float uTime;
varying vec2 vUv;
void main() {
  // across the strip: a hot core, a soft rim; along it: a flicker running out to the point
  float x = abs(vUv.x - 0.5) * 2.0;
  float core = 1.0 - smoothstep(0.0, 0.45, x);
  float rim = 1.0 - smoothstep(0.3, 1.0, x);
  float run = 0.85 + 0.15 * sin(vUv.y * 60.0 - uTime * 40.0);
  vec3 col = mix(uRim, uCore, core);
  gl_FragColor = vec4(col * 1.6, uA * rim * run);
}`;

/**
 * The extended blade: two crossed glowing strips from the sword's point out along the blade's axis. It is
 * a child of the sword prop, so it follows every swing; `length` is set each step by the kit.
 */
export class ShinsoExtension {
  readonly group = new THREE.Group();
  length = 0;
  private mats: THREE.ShaderMaterial[] = [];
  private t = 0;

  constructor(readonly tipZ: number, core: THREE.ColorRepresentation = '#F6FBFF', rim: THREE.ColorRepresentation = '#9FD3FF', width = 0.07) {
    // the blade itself (two crossed planes) and a wider, fainter halo so it still reads across a town
    for (const [rot, w, a] of [[0, width, 1], [Math.PI / 2, width, 1], [0, width * 4.5, 0.32], [Math.PI / 2, width * 4.5, 0.32]]) {
      const geo = new THREE.PlaneGeometry(w, 1, 1, 1);
      // span z ∈ [0, 1]: the plane is built in XY, turn it to run along +Z
      geo.rotateX(Math.PI / 2);
      geo.translate(0, 0, 0.5);
      const mat = new THREE.ShaderMaterial({
        vertexShader: EXT_VERT, fragmentShader: EXT_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        uniforms: { uCore: { value: new THREE.Color(core) }, uRim: { value: new THREE.Color(rim) }, uA: { value: a }, uTime: { value: 0 } },
      });
      const m = new THREE.Mesh(geo, mat);
      m.rotation.z = rot;
      m.frustumCulled = false;
      this.mats.push(mat);
      this.group.add(m);
    }
    this.group.position.set(0, 0, tipZ);
    this.group.visible = false;
  }

  update(dt: number): void {
    this.t += dt;
    const on = this.length > 0.05;
    this.group.visible = on;
    if (!on) return;
    this.group.scale.set(1, 1, this.length);
    for (const m of this.mats) m.uniforms.uTime.value = this.t;
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const m of this.mats) m.dispose();
    for (const c of this.group.children) (c as THREE.Mesh).geometry.dispose();
  }
}

// ------------------------------------------------------------------ Hakufuku

/** Purple phantom blossoms falling round the target while its sight goes. */
export class Hakufuku implements Projectile {
  done = false;
  private t = 0;
  constructor(private g: Game, readonly target: Fighter, readonly life = 2.6) {}
  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.t > this.life || this.target.dead) {
      this.done = true;
      return;
    }
    const c = this.target.center();
    for (let i = 0; i < 4; i++) {
      const a = Math.random() * Math.PI * 2, r = 0.3 + Math.random() * 2.2;
      g.engine.glow.spawn({
        x: c.x + Math.cos(a) * r, y: c.y + 1.6 + Math.random() * 1.4, z: c.z + Math.sin(a) * r,
        vx: (Math.random() - 0.5) * 0.6, vy: -0.9 - Math.random() * 0.5, vz: (Math.random() - 0.5) * 0.6,
        size: 0.07, sizeEnd: 0.05, life: 1.6, r: 0.66, g: 0.48, b: 0.82, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW, drag: 0.6, gravity: 0.3,
      });
    }
    if (Math.random() < 0.3) g.engine.dust.spawn({ x: c.x, y: c.y + 0.4, z: c.z, vx: 0, vy: 0.3, vz: 0, size: 0.6, sizeEnd: 1.4, life: 0.9, r: 0.55, g: 0.42, b: 0.7, alpha: 0.25, alphaEnd: 0, tex: TEX_PUFF });
  }
  dispose(): void {}
}

// ------------------------------------------------------------------ Sentan Hakuja

/**
 * The thousand-coil white snake: a long white cloth unrolls round the target in a tightening coil,
 * then a white flash and the target is moved to `dest` (it lands from a height).
 */
export class SentanHakuja implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.Mesh;
  private pos: Float32Array;
  private readonly N = 90;
  private moved = false;

  constructor(private g: Game, readonly owner: Fighter, readonly target: Fighter, readonly dest: THREE.Vector3, readonly onWrap: () => void) {
    this.pos = new Float32Array(this.N * 2 * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    const idx: number[] = [];
    for (let i = 0; i < this.N - 1; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    geo.setIndex(idx);
    this.mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#F1F0EC', roughness: 0.9, side: THREE.DoubleSide, emissive: '#2A2A30' }));
    this.mesh.frustumCulled = false;
    g.engine.gr.scene.add(this.mesh);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const o = this.target;
    // unroll (0 → 0.45 s), tighten (→ 0.75 s), flash and move, then fall away
    const grow = Math.min(1, this.t / 0.45);
    const tight = Math.min(1, Math.max(0, (this.t - 0.3) / 0.45));
    const c = o.center();
    const turns = 4.5;
    for (let i = 0; i < this.N; i++) {
      const u = i / (this.N - 1);
      const vis = u <= grow;
      const a = u * turns * Math.PI * 2 + this.t * 6;
      const r = (1.9 - tight * 1.35) * (0.8 + 0.2 * Math.sin(u * 7));
      const y = o.pos.y + 0.1 + u * (o.def.height + 0.3);
      const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
      const k = i * 6;
      const h = vis ? 0.12 : 0;
      this.pos[k] = x; this.pos[k + 1] = y - h; this.pos[k + 2] = z;
      this.pos[k + 3] = x; this.pos[k + 4] = y + h; this.pos[k + 5] = z;
    }
    const attr = this.mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    attr.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();
    if (tight > 0.2) {
      o.hitstun = Math.max(o.hitstun, 0.2);
      o.body.vel.set(0, Math.min(0, o.body.vel.y), 0);
    }
    if (!this.moved && this.t >= 0.8) {
      this.moved = true;
      const p = o.center();
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 1.5, sizeEnd: 5, life: 0.25, r: 1, g: 1, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
      o.body.pos.copy(this.dest);
      o.body.prev.copy(this.dest);
      o.body.vel.set(0, -2, 0);
      g.engine.glow.spawn({ x: this.dest.x, y: this.dest.y + 1, z: this.dest.z, size: 1.2, sizeEnd: 4, life: 0.25, r: 1, g: 1, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
      g.sfx.play('shunpo', p, 1.2);
      this.onWrap();
      this.mesh.visible = false;
    }
    if (this.t > 1.0) this.done = true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

// ------------------------------------------------------------------ Korose

/** The poison takes the target apart from the inside: dark violet dust bursting out of the chest. */
export class KoroseBurst implements Projectile {
  done = false;
  private t = 0;
  constructor(private g: Game, readonly target: Fighter, readonly onBurst: () => void) {}
  update(dt: number, g: Game): void {
    const o = this.target;
    const before = this.t;
    this.t += dt;
    const c = o.center();
    // first a crawl of dark motes under the skin, then the hole opens
    if (this.t < 0.45) {
      for (let i = 0; i < 3; i++) g.engine.glow.spawn({ x: c.x + (Math.random() - 0.5) * 0.5, y: c.y + (Math.random() - 0.3) * 0.6, z: c.z + (Math.random() - 0.5) * 0.5, vx: 0, vy: 0.2, vz: 0, size: 0.08, sizeEnd: 0.02, life: 0.3, r: 0.48, g: 0.24, b: 0.35, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
    if (before < 0.45 && this.t >= 0.45) {
      this.onBurst();
      for (let i = 0; i < 80; i++) {
        _v.set(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).normalize().multiplyScalar(2 + Math.random() * 6);
        const dark = Math.random() < 0.6;
        g.engine.dust.spawn({ x: c.x, y: c.y + 0.15, z: c.z, vx: _v.x, vy: _v.y, vz: _v.z, size: dark ? 0.25 : 0.15, sizeEnd: 0.6, life: 0.9 + Math.random() * 0.6, r: dark ? 0.23 : 0.48, g: dark ? 0.14 : 0.24, b: dark ? 0.27 : 0.35, alpha: 0.85, alphaEnd: 0, tex: TEX_PUFF, drag: 2.5 });
      }
      for (let i = 0; i < 24; i++) g.engine.glow.spawn({ x: c.x, y: c.y + 0.15, z: c.z, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.3) * 8, vz: (Math.random() - 0.5) * 8, size: 0.1, sizeEnd: 0.02, life: 0.4, r: 0.78, g: 0.66, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2.5, drag: 3 });
      g.sfx.play('explode', c, 0.7);
    }
    if (this.t > 1.2) this.done = true;
  }
  dispose(): void {}
}
