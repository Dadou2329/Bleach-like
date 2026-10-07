// Ice for Hyōrinmaru. A shared crystal look (cold fresnel, deep blue core, bright facet glints) on
// hexagonal spikes; IcePrison freezes a fighter solid inside a cluster of crystals and shatters it;
// frost and spikes are written into the world as real `ice` voxels, so the battlefield stays frozen and
// every crystal can be broken again.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { GlassShards } from './mirror';
import { TEX_GLOW, TEX_PUFF } from './sprites';

export const ICE_TINT = '#8FD4F2';

const CRYSTAL_VERT = /* glsl */ `
varying vec3 vN; varying vec3 vW;
void main() {
  mat4 m = modelMatrix;
  #ifdef USE_INSTANCING
  m = m * instanceMatrix;
  #endif
  vec4 w = m * vec4(position, 1.0);
  vW = w.xyz;
  vN = normalize(mat3(m) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const CRYSTAL_FRAG = /* glsl */ `
uniform float uA; uniform float uGlow;
varying vec3 vN; varying vec3 vW;
void main() {
  vec3 v = normalize(cameraPosition - vW);
  vec3 n = normalize(vN);
  if (dot(n, v) < 0.0) n = -n;
  float f = 1.0 - clamp(abs(dot(n, v)), 0.0, 1.0);
  vec3 deep = vec3(0.12, 0.36, 0.56), mid = vec3(0.46, 0.78, 0.93), rim = vec3(0.92, 0.98, 1.0);
  vec3 col = mix(deep, mid, 0.3 + 0.7 * smoothstep(-0.3, 0.9, n.y)) + rim * pow(f, 2.2) * 0.9;
  vec3 r = reflect(-v, n);
  col += vec3(pow(max(0.0, dot(r, normalize(vec3(0.3, 0.9, 0.2)))), 28.0)) * 1.5;
  col *= uGlow;
  gl_FragColor = vec4(col, uA * (0.62 + f * 0.36));
}`;

/** A crystal material (each user owns its uniforms). */
export function crystalMaterial(alpha = 1, glow = 1): THREE.ShaderMaterial & { uniforms: { uA: THREE.IUniform; uGlow: THREE.IUniform } } {
  return new THREE.ShaderMaterial({
    uniforms: { uA: { value: alpha }, uGlow: { value: glow } },
    vertexShader: CRYSTAL_VERT,
    fragmentShader: CRYSTAL_FRAG,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  }) as THREE.ShaderMaterial & { uniforms: { uA: THREE.IUniform; uGlow: THREE.IUniform } };
}

let spikeGeo: THREE.BufferGeometry | null = null;
/** A hexagonal crystal: a short prism capped by a long point, base at the origin, pointing +Y, 1 unit long. */
export function crystalGeometry(): THREE.BufferGeometry {
  if (spikeGeo) return spikeGeo;
  const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(0.28, 0.02), new THREE.Vector2(0.3, 0.45), new THREE.Vector2(0, 1)];
  const g = new THREE.LatheGeometry(pts, 6);
  g.computeVertexNormals();
  return (spikeGeo = g);
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _v = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

/** Prison shape: a block of crystals round the body, a tall obelisk, or a great cross (Ryūsenka). */
export type PrisonShape = 'block' | 'obelisk' | 'cross';

/**
 * Frozen solid: crystals grow out round the fighter in a few frames and hold it; when the time is up (or
 * `shatter()` is called) the prison bursts into ice and deals its damage.
 */
export class IcePrison implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.InstancedMesh;
  private mat = crystalMaterial(0.95);
  private items: { p: THREE.Vector3; q: THREE.Quaternion; s: THREE.Vector3; delay: number }[] = [];
  private broken = -1;
  private hold = new THREE.Vector3();

  constructor(private g: Game, private owner: Fighter, private target: Fighter, readonly dur = 1.4, readonly damage = 60, readonly shape: PrisonShape = 'block', readonly scale = 1) {
    const h = target.def.height;
    this.hold.copy(target.pos);
    const c = target.pos.clone();
    const add = (p: THREE.Vector3, dir: THREE.Vector3, len: number, w: number, delay: number) => {
      const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize());
      this.items.push({ p, q, s: new THREE.Vector3(w, len, w), delay });
    };
    const rnd = (a: number) => (Math.random() * 2 - 1) * a;
    if (shape === 'cross') {
      // a cross of ice round the body: the long beam vertical, the arms out to the sides, crystals bristling
      const fw = owner.forward(new THREE.Vector3());
      const side = new THREE.Vector3(-fw.z, 0, fw.x);
      const mid = c.clone().add(new THREE.Vector3(0, h * 0.6, 0));
      for (let i = 0; i < 26; i++) {
        const u = i / 25;
        const p = c.clone().add(new THREE.Vector3(rnd(0.3), -0.8 + u * (h + 3.2) * scale, rnd(0.3)));
        add(p, new THREE.Vector3(rnd(0.6), 1, rnd(0.6)), (0.9 + Math.random()) * scale, (0.45 + Math.random() * 0.3) * scale, u * 0.12);
      }
      for (let i = 0; i < 22; i++) {
        const k = i % 2 === 0 ? 1 : -1, u = Math.floor(i / 2) / 10;
        const p = mid.clone().addScaledVector(side, k * u * 2.6 * scale).add(new THREE.Vector3(0, rnd(0.25), rnd(0.25)));
        add(p, side.clone().multiplyScalar(k).add(new THREE.Vector3(0, rnd(0.4), rnd(0.4))), (0.8 + Math.random() * 0.8) * scale, (0.4 + Math.random() * 0.25) * scale, 0.05 + u * 0.12);
      }
    } else {
      const tall = shape === 'obelisk' ? 2.4 : 1.25;
      const n = shape === 'obelisk' ? 40 : 30;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, y = Math.random() * h * tall;
        const r = 0.15 + Math.random() * 0.25;
        const p = c.clone().add(new THREE.Vector3(Math.cos(a) * r, y - 0.1, Math.sin(a) * r));
        const out = new THREE.Vector3(Math.cos(a), 0.35 + Math.random() * (shape === 'obelisk' ? 2.2 : 0.9), Math.sin(a));
        add(p, out, (0.5 + Math.random() * 0.8) * scale * (shape === 'obelisk' ? 1.4 : 1), (0.35 + Math.random() * 0.3) * scale, (y / (h * tall)) * 0.12);
      }
    }
    this.mesh = new THREE.InstancedMesh(crystalGeometry(), this.mat, this.items.length);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 5;
    g.engine.gr.scene.add(this.mesh);
    g.sfx.play('crack', c, 1.1);
    // a white puff of frost as it seizes
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.dust.spawn({ x: c.x, y: c.y + Math.random() * h, z: c.z, vx: Math.cos(a) * 3, vy: Math.random() * 1.5, vz: Math.sin(a) * 3, size: 0.4, sizeEnd: 1.4, life: 0.8, r: 0.9, g: 0.96, b: 1, alpha: 0.55, alphaEnd: 0, tex: TEX_PUFF, drag: 2.5 });
    }
  }

  get broken_(): boolean {
    return this.broken >= 0;
  }

  shatter(): void {
    if (this.broken >= 0) return;
    this.broken = this.t;
    const g = this.g, tgt = this.target;
    const c = tgt.center();
    const h = tgt.def.height * (this.shape === 'obelisk' ? 2.2 : this.shape === 'cross' ? 2 : 1.1);
    g.addProjectile(new GlassShards(g, c, new THREE.Vector3(0.6 * this.scale, h * 0.5, 0.6 * this.scale), this.shape === 'block' ? 50 : 90, 6, 1.7, tgt.pos.y, ICE_TINT, 1.3 * this.scale));
    if (!tgt.dead) g.damage(tgt, this.damage, this.owner, new THREE.Vector3(0, 1, 0), { knock: 4, launch: 6, heavy: true, hitstop: 0.12, shake: 0.5 });
    g.sfx.play('shatter', c, 1.3);
    g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: 1, sizeEnd: 3.5, life: 0.3, r: 0.8, g: 0.94, b: 1, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
  }

  update(dt: number): void {
    this.t += dt;
    const tgt = this.target;
    if (this.broken < 0) {
      if (!tgt.dead) {
        tgt.body.pos.copy(this.hold);
        tgt.body.vel.set(0, 0, 0);
        tgt.push.set(0, 0, 0);
        tgt.hitstun = Math.max(tgt.hitstun, 0.2);
        tgt.hovering = false;
      }
      if (this.t >= this.dur || tgt.dead) this.shatter();
    } else if (this.t - this.broken > 0.25) this.done = true;
  }

  render(): void {
    const grow = (d: number) => Math.min(1, Math.max(0, (this.t - d) / 0.14));
    const fade = this.broken >= 0 ? Math.max(0, 1 - (this.t - this.broken) / 0.2) : 1;
    this.items.forEach((it, i) => {
      const k = grow(it.delay) * fade;
      _s.copy(it.s).multiplyScalar(k === 0 ? 1e-4 : k);
      _m.compose(it.p, it.q, _s);
      this.mesh.setMatrixAt(i, _m);
    });
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mat.uniforms.uA.value = fade;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mat.dispose();
  }
}

/** True if a world voxel cell overlaps any living fighter (never freeze ice into someone's body). */
function inFighter(g: Game, x: number, y: number, z: number, vs: number): boolean {
  const px = (x + 0.5) * vs, py = (y + 0.5) * vs, pz = (z + 0.5) * vs;
  for (const f of g.fighters) {
    if (f.dead) continue;
    const r = f.def.radius + 0.15;
    if (Math.abs(px - f.pos.x) < r && Math.abs(pz - f.pos.z) < r && py > f.pos.y - 0.1 && py < f.pos.y + f.def.height + 0.1) return true;
  }
  return false;
}

/**
 * Frost: a crust of ice voxels over every surface inside the sphere (air cells touching something
 * solid), thicker near the centre. Returns the number of voxels frozen.
 */
export function frostWorld(g: Game, center: THREE.Vector3, radius: number, max = 2500): number {
  const w = g.engine.world;
  const vs = w.vs;
  const ice = w.mats.id('ice');
  const r = Math.ceil(radius / vs);
  const cx = Math.floor(center.x / vs), cy = Math.floor(center.y / vs), cz = Math.floor(center.z / vs);
  let n = 0;
  for (let dy = -r; dy <= r && n < max; dy++)
    for (let dz = -r; dz <= r && n < max; dz++)
      for (let dx = -r; dx <= r && n < max; dx++) {
        const d = Math.hypot(dx, dy, dz) / r;
        if (d > 1 || Math.random() > 1.15 - d) continue;
        const x = cx + dx, y = cy + dy, z = cz + dz;
        if (w.get(x, y, z) !== 0) continue;
        const touching = w.isSolid(x, y - 1, z) || w.isSolid(x + 1, y, z) || w.isSolid(x - 1, y, z) || w.isSolid(x, y, z + 1) || w.isSolid(x, y, z - 1);
        if (!touching || inFighter(g, x, y, z, vs)) continue;
        w.set(x, y, z, ice);
        n++;
      }
  return n;
}

/**
 * A spike of ice voxels: a cone from `base` along `dir`, `len` metres long and `r` metres wide at the
 * base (hexagon-ish by quantisation). Only fills air. Returns the number of voxels placed.
 */
export function iceSpike(g: Game, base: THREE.Vector3, dir: THREE.Vector3, len: number, r: number, max = 4000): number {
  const w = g.engine.world;
  const vs = w.vs;
  const ice = w.mats.id('ice');
  const d = _v.copy(dir).normalize();
  const ext = len + r;
  const x0 = Math.floor((Math.min(base.x, base.x + d.x * len) - r) / vs), x1 = Math.ceil((Math.max(base.x, base.x + d.x * len) + r) / vs);
  const y0 = Math.floor((Math.min(base.y, base.y + d.y * len) - r) / vs), y1 = Math.ceil((Math.max(base.y, base.y + d.y * len) + r) / vs);
  const z0 = Math.floor((Math.min(base.z, base.z + d.z * len) - r) / vs), z1 = Math.ceil((Math.max(base.z, base.z + d.z * len) + r) / vs);
  if ((x1 - x0) * (y1 - y0) * (z1 - z0) > 400000 || ext <= 0) return 0;
  let n = 0;
  for (let y = y0; y <= y1; y++)
    for (let z = z0; z <= z1; z++)
      for (let x = x0; x <= x1; x++) {
        const px = (x + 0.5) * vs - base.x, py = (y + 0.5) * vs - base.y, pz = (z + 0.5) * vs - base.z;
        const t = px * d.x + py * d.y + pz * d.z;
        if (t < 0 || t > len) continue;
        const rr = r * (1 - t / len);
        const qx = px - d.x * t, qy = py - d.y * t, qz = pz - d.z * t;
        // hexagonal cross-section: max of three projected axes
        const h = Math.max(Math.abs(qx), Math.abs(qz) * 0.866 + Math.abs(qx) * 0.5, Math.abs(qy) * (Math.abs(d.y) < 0.9 ? 1 : 0));
        if (Math.hypot(qx, qy, qz) > rr || h > rr) continue;
        if (w.get(x, y, z) !== 0 || inFighter(g, x, y, z, vs)) continue;
        w.set(x, y, z, ice);
        if (++n >= max) return n;
      }
  return n;
}
