// TYBW Ichigo's effects (docs/kits/ichigo.md §6-7): the large blade thrown and beckoned home on its invisible chain,
// Getsuga Jūjishō (the small blade's crescent and the large one's fused into a cross that eats shots), the planar
// slash (a cut that runs through everything in a plane: the golden cleave, the mountain-leveller), Blut Vene's veins,
// the Blood Chains [anime-only] — the wall of interlocking chains, the bind, the blood moon sliding into eclipse, the
// giant black crescent left hanging in the sky — and the shell of True Bankai shattering.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import type { VoxelModel } from '../models/builder';
import { PropMesh } from '../game/characterFactory';
import { BoxShape, CapsuleShape, CrescentShape, SphereShape } from '../destruction/shapes';
import { crescentGeometry, crescentMaterial, type EnergyColors } from './energy';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';
import { SkyTint, type SkyLook } from './fire';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();

export const GETSUGA_GOLD_TY: EnergyColors = { core: '#FFFBE6', body: '#F6C343', rim: '#C6923D' };
export const GETSUGA_WHITE_GOLD: EnergyColors = { core: '#FFFFFF', body: '#F3E6A8', rim: '#C9A04A' };
export const CRECIENTE_VIOLET: EnergyColors = { core: '#F6E6FF', body: '#9B30FF', rim: '#5A0FA0', dark: '#1A0430' };
/** Blood Chains Getsuga: black with a hard white outline */
export const GETSUGA_BLOOD: EnergyColors = { core: '#F3F3F0', body: '#E8E4E8', rim: '#B0101C', dark: '#030203' };
export const CHAIN_RED = '#E8261E';
export const BLUT_CYAN = '#9CDFF1';

// ------------------------------------------------------------------------------------------------ Chain

/**
 * The large blade hurled on its invisible chain: it flies spinning, cuts what it crosses and buries itself in the
 * first foe (pinned a moment) or in a wall. `beckon()` (a gesture of the empty hand) brings it home, cutting along
 * the way back; a line of gold motes marks the chain while it returns.
 */
export class ChainBlade implements Projectile {
  done = false;
  returning = false;
  /** buried in a foe or a wall */
  stuck: Fighter | 'wall' | null = null;
  readonly pos = new THREE.Vector3();
  private pivot = new THREE.Group();
  private mesh: PropMesh;
  private dir = new THREE.Vector3();
  private out = 0;
  private spin = 0;
  private hits = new Set<number>();
  private prev = new THREE.Vector3();
  private stuckOff = new THREE.Vector3();
  private t = 0;
  private stuckT = 0;

  constructor(private g: Game, private owner: Fighter, model: VoxelModel, from: THREE.Vector3, target: THREE.Vector3, private hand: () => THREE.Vector3,
    readonly o: { speed: number; range: number; damage: number; back: number; cut: number; mid: number; colors: EnergyColors }) {
    this.pos.copy(from);
    this.prev.copy(from);
    this.dir.subVectors(target, from).normalize();
    this.mesh = new PropMesh(model);
    this.mesh.position.set(0, 0, -o.mid);
    this.pivot.add(this.mesh);
    this.pivot.position.copy(from);
    g.engine.gr.scene.add(this.pivot);
  }

  /** the beckoning gesture: home it comes */
  beckon(): void {
    if (this.returning) return;
    if (this.stuck && this.stuck !== 'wall') this.stuck.hitstun = Math.max(this.stuck.hitstun, 0.15);
    this.returning = true;
    this.stuck = null;
    this.hits.clear();
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    this.prev.copy(this.pos);
    const h = this.hand();
    if (this.stuck) {
      this.stuckT += dt;
      if (this.stuck !== 'wall') {
        const o = this.stuck;
        if (o.dead || !g.fighters.includes(o)) this.beckon();
        else {
          this.pos.copy(o.center(_v)).add(this.stuckOff);
          // pinned while the blade is in him
          if (this.stuckT < 0.8) o.push.multiplyScalar(0.5);
        }
      }
      if (this.stuckT > 2.6) this.beckon();
    } else if (!this.returning) {
      const step = this.o.speed * dt;
      this.pos.addScaledVector(this.dir, step);
      this.out += step;
      if (this.out >= this.o.range) {
        this.stuck = 'wall';
        this.stuckT = 0;
      }
      const w = g.engine.world, vs = w.vs;
      if (this.out > 2 && w.isSolid(Math.floor(this.pos.x / vs), Math.floor(this.pos.y / vs), Math.floor(this.pos.z / vs))) {
        g.engine.destruction.carve(new SphereShape(this.pos.clone(), 1.2, 0.8), { mode: 'cut', power: this.o.cut, impulse: 6, dust: 0.6 });
        g.sfx.play('impact', this.pos, 0.9);
        this.stuck = 'wall';
        this.stuckT = 0;
      }
    } else {
      _v.subVectors(h, this.pos);
      const d = _v.length();
      const step = this.o.speed * 1.35 * dt;
      if (d <= step + 0.5) {
        this.done = true;
        return;
      }
      this.pos.addScaledVector(_v.divideScalar(d), step);
      // the chain: gold motes strung from the hand to the hilt
      const glow = g.engine.glow;
      const c = new THREE.Color(this.o.colors.body);
      for (let i = 0; i < 3; i++) {
        const u = Math.random();
        glow.spawn({ x: h.x + (this.pos.x - h.x) * u, y: h.y + (this.pos.y - h.y) * u, z: h.z + (this.pos.z - h.z) * u, size: 0.12, sizeEnd: 0.02, life: 0.2, r: c.r, g: c.g, b: c.b, alpha: 0.85, alphaEnd: 0, tex: TEX_GLOW });
      }
    }
    // the pose: spinning in flight, still when buried, point first on the way home
    if (!this.stuck) this.spin += dt * (this.returning ? 0 : 22);
    this.pivot.position.copy(this.pos);
    const fly = this.returning ? _w.subVectors(h, this.pos).normalize() : this.dir;
    const yaw = Math.atan2(fly.x, fly.z);
    this.pivot.rotation.set(0, 0, 0);
    this.pivot.rotateY(yaw);
    if (this.returning) this.pivot.rotateX(-Math.asin(Math.max(-1, Math.min(1, fly.y))) + Math.PI);
    else if (this.stuck) this.pivot.rotateX(Math.PI * 0.5 + 0.3);
    else {
      this.pivot.rotateZ(0.45);
      this.pivot.rotateX(this.spin);
    }
    if (this.stuck) return;
    // what it passes through is cut
    if (this.pos.distanceToSquared(this.prev) > 1e-4) g.engine.destruction.carve(new CapsuleShape(this.prev.clone(), this.pos.clone(), 0.9), { mode: 'cut', power: this.o.cut, dir: fly.clone(), sparks: [0.95, 0.8, 0.4], dust: 0.4 });
    for (const o of g.enemiesOf(this.owner)) {
      if (this.hits.has(o.id)) continue;
      const cy = Math.max(o.pos.y + 0.2, Math.min(o.pos.y + o.def.height - 0.2, this.pos.y));
      if (Math.hypot(o.pos.x - this.pos.x, cy - this.pos.y, o.pos.z - this.pos.z) > 1 + o.def.radius) continue;
      this.hits.add(o.id);
      const k = fly.clone();
      if (this.returning) {
        g.damage(o, this.o.back, this.owner, k, { knock: 5, launch: 2, hitstop: 0.06, shake: 0.2 });
      } else {
        g.damage(o, this.o.damage, this.owner, k, { knock: 4, launch: 1, heavy: true, hitstop: 0.1, shake: 0.35 });
        // buried in him
        this.stuck = o;
        this.stuckT = 0;
        this.stuckOff.subVectors(this.pos, o.center(_v)).multiplyScalar(0.4);
        o.hitstun = Math.max(o.hitstun, 0.6);
      }
      g.sparks(o.center(), k, this.o.colors.body, 14);
    }
    if (Math.random() < 0.5) g.sfx.play('swing', this.pos, 0.35);
  }

  dispose(): void {
    this.pivot.removeFromParent();
    this.mesh.material.dispose();
  }
}

// ------------------------------------------------------------------------------------------------ Getsuga Jūjishō

interface Arm {
  group: THREE.Group;
  mats: THREE.ShaderMaterial[];
  side: THREE.Vector3;
  normal: THREE.Vector3;
}

/**
 * Getsuga Jūjishō: the small blade's level crescent leaves first and slowly; `fuse()` (the large blade's vertical
 * cut) joins it as the other bar of a giant cross, and the cross takes off. Every enemy shot near its path is undone,
 * barriers included; what it crosses is cut by both bars.
 */
export class CrossGetsuga implements Projectile {
  done = false;
  readonly pos: THREE.Vector3;
  private arms: Arm[] = [];
  private light: THREE.PointLight;
  private speed: number;
  private travelled = 0;
  private hit = new Set<number>();
  private t = 0;
  private fade = 0;
  private fused = false;
  private body: THREE.Color;

  constructor(private g: Game, private owner: Fighter, origin: THREE.Vector3, readonly dir: THREE.Vector3, readonly o: { radius: number; speed: number; range: number; damage: number; cut: number; colors: EnergyColors }) {
    this.pos = origin.clone();
    this.dir.normalize();
    this.speed = o.speed * 0.18;
    const level = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
    this.addArm(level, 0.7);
    this.body = new THREE.Color(o.colors.body);
    this.light = new THREE.PointLight(this.body, 16, 18, 1.6);
    g.engine.gr.scene.add(this.light);
    this.place();
  }

  private addArm(side: THREE.Vector3, k: number): void {
    const side2 = side.clone().addScaledVector(this.dir, -side.dot(this.dir)).normalize();
    const normal = new THREE.Vector3().crossVectors(this.dir, side2).normalize();
    const geo = crescentGeometry(this.o.radius * k, 1.2, 0.35, this.o.radius * k * 0.4, 0.45);
    const group = new THREE.Group();
    const mats: THREE.ShaderMaterial[] = [];
    if (this.o.colors.dark) {
      const dm = crescentMaterial(this.o.colors, true);
      const dmesh = new THREE.Mesh(geo, dm);
      dmesh.renderOrder = 5;
      dmesh.scale.set(0.98, 1.6, 0.98);
      group.add(dmesh);
      mats.push(dm);
    }
    const m = crescentMaterial(this.o.colors);
    const mesh = new THREE.Mesh(geo, m);
    mesh.renderOrder = 6;
    group.add(mesh);
    mats.push(m);
    group.traverse((c) => (c.frustumCulled = false));
    this.g.engine.gr.scene.add(group);
    this.arms.push({ group, mats, side: side2, normal });
  }

  /** the large blade's bar joins: a full cross, and it takes off */
  fuse(): void {
    if (this.fused || this.done) return;
    this.fused = true;
    this.addArm(new THREE.Vector3(0, 1, 0), 1);
    this.arms[0].group.scale.setScalar(1 / 0.7);
    this.speed = this.o.speed;
    this.g.shake(0.4);
    this.g.hitstop(0.05);
    this.g.addRing(this.pos.clone(), this.o.radius * 1.4, this.o.colors.body, 0.3);
  }

  private place(): void {
    for (const a of this.arms) {
      const r = this.o.radius * (a === this.arms[0] && !this.fused ? 0.7 : 1);
      a.group.position.copy(this.pos).addScaledVector(this.dir, -r * 0.6);
      _m.makeBasis(a.side, a.normal, this.dir);
      a.group.quaternion.setFromRotationMatrix(_m);
    }
    this.light.position.copy(this.pos);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.fade > 0) {
      this.fade -= dt;
      if (this.fade <= 0) this.done = true;
      return;
    }
    // unfused for too long (the swing never came): it goes on alone
    if (!this.fused && this.t > 0.7) this.fuse();
    const step = this.speed * dt;
    this.pos.addScaledVector(this.dir, step);
    this.travelled += step;
    this.place();
    // it eats shots and barriers in its path
    g.rejectNear(this.pos, this.o.radius * (this.fused ? 1.1 : 0.7), this.owner, true);
    // both bars cut the world
    for (const a of this.arms) {
      const r = this.o.radius * (a === this.arms[0] && !this.fused ? 0.7 : 1);
      const center = this.pos.clone().addScaledVector(this.dir, -r * 0.6);
      g.engine.destruction.carve(new CrescentShape(center, this.dir.clone(), a.side.clone(), r, 1.2, 0.4, 0.3), { mode: 'cut', power: this.o.cut, dir: this.dir.clone(), sparks: [this.body.r, this.body.g, this.body.b], dust: 0.8 });
    }
    const reach = this.o.radius * (this.fused ? 1 : 0.7);
    for (const f of g.enemiesOf(this.owner)) {
      if (this.hit.has(f.id)) continue;
      const fc = f.center(_v);
      _w.subVectors(fc, this.pos);
      const along = _w.dot(this.dir);
      if (along < -1.5 - f.def.radius || along > 1.5 + f.def.radius) continue;
      _w.addScaledVector(this.dir, -along);
      if (_w.length() > reach + f.def.radius) continue;
      this.hit.add(f.id);
      g.damage(f, this.o.damage * (this.fused ? 1 : 0.4), this.owner, this.dir, { energy: true, knock: 20, launch: 5, heavy: true, hitstop: 0.14, shake: 0.5 });
      g.sparks(fc, this.dir, this.o.colors.body, 30);
    }
    const glow = g.engine.glow;
    for (let i = 0; i < 10; i++) {
      const a = this.arms[i % this.arms.length];
      const u = (Math.random() * 2 - 1) * reach;
      const c = Math.random() < 0.3 ? new THREE.Color(this.o.colors.core) : this.body;
      glow.spawn({ x: this.pos.x + a.side.x * u, y: this.pos.y + a.side.y * u, z: this.pos.z + a.side.z * u, vx: -this.dir.x * 6, vy: -this.dir.y * 6 + 1, vz: -this.dir.z * 6, size: 0.3 + Math.random() * 0.4, sizeEnd: 0.02, life: 0.35, r: c.r, g: c.g, b: c.b, alpha: 0.85, alphaEnd: 0, tex: TEX_STREAK, stretch: 2, drag: 2 });
    }
    if (this.travelled >= this.o.range) this.fade = 0.2;
  }

  render(_dt: number, time: number): void {
    const grow = Math.min(1, this.t / 0.1);
    const a = this.fade > 0 ? this.fade / 0.2 : 1;
    for (const arm of this.arms) for (const m of arm.mats) {
      m.uniforms.uTime.value = time;
      m.uniforms.uA.value = a * grow;
    }
    this.light.intensity = 16 * a * (this.fused ? 1.4 : 0.7);
  }

  dispose(): void {
    for (const a of this.arms) {
      a.group.removeFromParent();
      for (const m of a.mats) m.dispose();
    }
    this.light.removeFromParent();
  }
}

// ------------------------------------------------------------------------------------------------ planar slash

/**
 * A cut that runs out through everything in one plane (the golden cleave; a swing that flattens a mountain): the
 * slab spreads from the swing over `grow` seconds, cutting the world and the foes in the band, with a glowing sheet.
 */
export class PlanarSlash implements Projectile {
  done = false;
  private t = 0;
  private sheet: THREE.Mesh;
  private u: { uA: THREE.IUniform; uC: THREE.IUniform; uK: THREE.IUniform };
  private hits = new Set<number>();
  private lastR = 0;
  private normal: THREE.Vector3;

  /**
   * @param along the cut runs out along this direction (unit) from `origin`
   * @param across the plane's other axis (the blade's sweep)
   */
  constructor(private g: Game, private owner: Fighter, readonly origin: THREE.Vector3, readonly along: THREE.Vector3, readonly across: THREE.Vector3,
    readonly o: { length: number; width: number; grow: number; damage: number; cut: number; color: THREE.ColorRepresentation; core: THREE.ColorRepresentation }) {
    this.normal = new THREE.Vector3().crossVectors(along, across).normalize();
    this.u = { uA: { value: 1 }, uC: { value: new THREE.Color(o.color) }, uK: { value: new THREE.Color(o.core) } };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.u,
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform float uA; uniform vec3 uC; uniform vec3 uK; varying vec2 vUv;
        void main() { float e = 1.0 - abs(vUv.y - 0.5) * 2.0; float f = smoothstep(0.0, 0.18, vUv.x) * (1.0 - smoothstep(0.82, 1.0, vUv.x));
          vec3 c = mix(uC, uK * 1.6, pow(e, 6.0)); gl_FragColor = vec4(c * 1.8, uA * pow(e, 2.0) * f * 0.9); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.translate(0.5, 0, 0);
    this.sheet = new THREE.Mesh(geo, mat);
    this.sheet.frustumCulled = false;
    _m.makeBasis(along, across, this.normal);
    this.sheet.quaternion.setFromRotationMatrix(_m);
    this.sheet.position.copy(origin);
    this.sheet.scale.set(0.01, o.width, 1);
    g.engine.gr.scene.add(this.sheet);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const k = Math.min(1, this.t / this.o.grow);
    const R = this.o.length * k;
    if (R > this.lastR + 0.01) {
      // the slab between the last reach and this one
      const mid = this.origin.clone().addScaledVector(this.along, (this.lastR + R) / 2);
      _m.makeBasis(this.along, this.across, this.normal);
      _q.setFromRotationMatrix(_m);
      g.engine.destruction.carve(new BoxShape(mid, new THREE.Vector3((R - this.lastR) / 2 + 0.2, this.o.width / 2, 0.12), _q.clone()), { mode: 'cut', power: this.o.cut, dir: this.normal.clone(), sparks: [1, 0.9, 0.5], dust: 0.6 });
      for (const f of g.enemiesOf(this.owner)) {
        if (this.hits.has(f.id)) continue;
        _v.subVectors(f.center(_w), this.origin);
        const a = _v.dot(this.along);
        if (a < -1 || a > R + f.def.radius) continue;
        if (Math.abs(_v.dot(this.normal)) > 0.8 + f.def.radius) continue;
        if (Math.abs(_v.dot(this.across)) > this.o.width / 2 + f.def.height * 0.5) continue;
        this.hits.add(f.id);
        g.damage(f, this.o.damage, this.owner, this.along, { knock: 12, launch: 4, heavy: true, hitstop: 0.14, shake: 0.5 });
        g.sparks(f.center(), this.along, this.o.color, 26);
      }
      this.lastR = R;
    }
    this.sheet.scale.set(Math.max(0.01, R), this.o.width, 1);
    this.u.uA.value = this.t < this.o.grow ? 1 : Math.max(0, 1 - (this.t - this.o.grow) / 0.35);
    if (this.t > this.o.grow + 0.35) this.done = true;
  }

  dispose(): void {
    this.sheet.removeFromParent();
    (this.sheet.material as THREE.Material).dispose();
    this.sheet.geometry.dispose();
  }
}

// ------------------------------------------------------------------------------------------------ Blut Vene

/** Cyan veins flashing under the skin where he is struck (and branching off it a moment). */
export function veinFlash(g: Game, at: THREE.Vector3, n = 10): void {
  const c = new THREE.Color(BLUT_CYAN);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.5) * 1.4;
    const sp = 1.5 + Math.random() * 2.5;
    g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, vx: Math.cos(a) * sp, vy: e * sp, vz: Math.sin(a) * sp, size: 0.05, sizeEnd: 0.015, life: 0.28, r: c.r, g: c.g, b: c.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 6 });
  }
  g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, size: 0.4, sizeEnd: 0.1, life: 0.18, r: 0.9, g: 0.98, b: 1, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
}

// ------------------------------------------------------------------------------------------------ Blood Chains

let chainGeo: THREE.TorusGeometry | null = null;
function linkGeometry(): THREE.TorusGeometry {
  return (chainGeo ??= new THREE.TorusGeometry(0.16, 0.05, 6, 10));
}

function chainMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: '#5A0A10', emissive: new THREE.Color(CHAIN_RED), emissiveIntensity: 1.6, roughness: 0.4, metalness: 0.3 });
}

/** Lay a chain of interlocking links from a to b into an instanced mesh, starting at index i0; returns the next index. */
function layChain(mesh: THREE.InstancedMesh, i0: number, a: THREE.Vector3, b: THREE.Vector3, sag = 0, roll = 0): number {
  const d = _v.subVectors(b, a);
  const len = d.length();
  const n = Math.max(2, Math.floor(len / 0.24));
  const dir = d.clone().normalize();
  let i = i0;
  const up = new THREE.Vector3(0, 1, 0);
  const side = Math.abs(dir.y) > 0.95 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3().crossVectors(dir, up).normalize();
  for (let k = 0; k < n && i < mesh.count; k++, i++) {
    const u = (k + 0.5) / n;
    const p = a.clone().addScaledVector(d, u);
    p.y -= Math.sin(u * Math.PI) * sag;
    // links alternate 90° about the chain's axis
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
    q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), (k % 2 ? Math.PI / 2 : 0) + roll));
    _m.compose(p, q, new THREE.Vector3(1, 1, 1));
    mesh.setMatrixAt(i, _m);
  }
  void side;
  return i;
}

/** The chain wall: interlocking blood chains thrown up before him, undoing every shot that reaches them. */
export class ChainWall implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.InstancedMesh;
  private mat: THREE.MeshStandardMaterial;
  private right: THREE.Vector3;

  constructor(private g: Game, private owner: Fighter, readonly at: THREE.Vector3, readonly fw: THREE.Vector3, readonly o: { width: number; height: number; life: number }) {
    this.right = new THREE.Vector3(-fw.z, 0, fw.x).normalize();
    this.mat = chainMaterial();
    const rows = Math.ceil(o.height / 0.3), cols = Math.ceil(o.width / 0.4);
    this.mesh = new THREE.InstancedMesh(linkGeometry(), this.mat, (rows + cols) * 40);
    this.mesh.frustumCulled = false;
    let i = 0;
    // a lattice: diagonal chains both ways
    for (let k = -cols; k <= cols; k += 2) {
      const a = at.clone().addScaledVector(this.right, (k / cols) * o.width * 0.5).setY(at.y);
      const b1 = a.clone().addScaledVector(this.right, o.height * 0.6).setY(at.y + o.height);
      const b2 = a.clone().addScaledVector(this.right, -o.height * 0.6).setY(at.y + o.height);
      i = layChain(this.mesh, i, a, b1, 0, 0.3);
      i = layChain(this.mesh, i, a, b2, 0, -0.3);
    }
    this.mesh.count = i;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.scale.set(1, 0.01, 1);
    g.engine.gr.scene.add(this.mesh);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const rise = Math.min(1, this.t / 0.18);
    this.mesh.scale.set(1, rise, 1);
    this.mesh.position.set(0, this.at.y * (1 - rise), 0);
    this.mat.emissiveIntensity = 1.6 + Math.sin(this.t * 22) * 0.3;
    // the wall undoes shots that reach it, and shoves the foes in front back
    for (let k = -2; k <= 2; k++) {
      const p = this.at.clone().addScaledVector(this.right, (k / 2) * this.o.width * 0.45).setY(this.at.y + this.o.height * 0.5);
      if (g.rejectNear(p, 1.8, this.owner, false)) {
        g.sparks(p, this.fw, CHAIN_RED, 14);
        g.sfx.play('hit', p, 0.6);
      }
    }
    for (const o of g.enemiesOf(this.owner)) {
      _v.subVectors(o.pos, this.at);
      const fwd = _v.dot(this.fw), lat = _v.dot(this.right);
      if (fwd > -0.4 && fwd < 1.2 && Math.abs(lat) < this.o.width / 2) o.push.addScaledVector(this.fw, 20 * dt * o.pushDrag);
    }
    if (Math.random() < 0.6) {
      const p = this.at.clone().addScaledVector(this.right, (Math.random() - 0.5) * this.o.width).setY(this.at.y + Math.random() * this.o.height);
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vy: 0.8, size: 0.25, sizeEnd: 0.05, life: 0.4, r: 1, g: 0.2, b: 0.12, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
    }
    if (this.t >= this.o.life) {
      const f = 1 - Math.min(1, (this.t - this.o.life) / 0.25);
      this.mesh.scale.set(1, f, 1);
      if (f <= 0) this.done = true;
    }
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.dispose();
    this.mat.dispose();
  }
}

/**
 * The chain bind: chains from the tassel wrap the target — rings round its chest and legs, and chains down to the
 * ground (or, airborne, held where it hangs) — rooted, no actions, for `dur` seconds.
 */
export class ChainBind implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.InstancedMesh;
  private mat: THREE.MeshStandardMaterial;
  private wasRooted: boolean;
  private hang: THREE.Vector3 | null;
  private anchors: THREE.Vector3[] = [];

  constructor(private g: Game, private owner: Fighter, readonly victim: Fighter, readonly dur: number) {
    this.mat = chainMaterial();
    this.mesh = new THREE.InstancedMesh(linkGeometry(), this.mat, 260);
    this.mesh.frustumCulled = false;
    g.engine.gr.scene.add(this.mesh);
    this.wasRooted = victim.rooted;
    victim.rooted = true;
    this.hang = victim.grounded ? null : victim.pos.clone();
    const base = victim.pos;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      this.anchors.push(new THREE.Vector3(base.x + Math.cos(a) * 3.2, base.y - (this.hang ? 4 : 0), base.z + Math.sin(a) * 3.2));
    }
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const o = this.victim;
    if (o.dead || !g.fighters.includes(o) || this.t >= this.dur) {
      this.done = true;
      return;
    }
    o.hitstun = Math.max(o.hitstun, 0.2);
    o.push.multiplyScalar(0.2);
    if (this.hang) {
      // suspended where it hung
      o.body.pos.copy(this.hang);
      o.body.vel.set(0, 0, 0);
    }
    // rebuild: three rings round the body, four chains to the anchors
    const c = o.center(_v).clone();
    let i = 0;
    const rings = [c.y - o.def.height * 0.25, c.y, c.y + o.def.height * 0.18];
    for (const y of rings) {
      const R = o.def.radius + 0.12;
      const n = 14;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + this.t * 0.6;
        const p = new THREE.Vector3(c.x + Math.cos(a) * R, y + Math.sin(a * 3) * 0.04, c.z + Math.sin(a) * R);
        const tang = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a));
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), tang);
        q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), k % 2 ? Math.PI / 2 : 0));
        _m.compose(p, q, new THREE.Vector3(1, 1, 1));
        this.mesh.setMatrixAt(i++, _m);
      }
    }
    const grow = Math.min(1, this.t / 0.15);
    for (const a of this.anchors) {
      const end = a.clone().lerp(c, 1 - grow);
      i = layChain(this.mesh, i, end, c, 0.3);
    }
    this.mesh.count = i;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mat.emissiveIntensity = 1.5 + Math.sin(this.t * 18) * 0.3;
    if (Math.random() < 0.4) g.engine.glow.spawn({ x: c.x + (Math.random() - 0.5), y: c.y + (Math.random() - 0.5) * 1.4, z: c.z + (Math.random() - 0.5), vy: 0.6, size: 0.2, sizeEnd: 0.04, life: 0.4, r: 1, g: 0.15, b: 0.1, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
  }

  dispose(): void {
    this.victim.rooted = this.wasRooted;
    this.mesh.removeFromParent();
    this.mesh.dispose();
    this.mat.dispose();
  }
}

/** The blood moon over Wahrwelt: the sky darkens red and a black disc slides over a red moon (Blood Chains). */
export const SKY_BLOOD: SkyLook = { zen: '#1E0306', hor: '#5E0C12', cloud: '#2E0609', cover: 0.55, glow: 0.25, sun: 0.3, hemi: 0.55, fog: '#3E0A0E' };
/** True Bankai's release: a lunar eclipse in a gold-rimmed dark */
export const SKY_ECLIPSE: SkyLook = { zen: '#120E14', hor: '#5A4426', cloud: '#2A2218', cover: 0.4, glow: 0.3, sun: 0.4, hemi: 0.6, fog: '#3A3020' };

export class Eclipse implements Projectile {
  done = false;
  private t = 0;
  private sky: SkyTint;
  private moon: THREE.Mesh;
  private shadow: THREE.Mesh;
  private corona: THREE.Mesh;
  private fadeT = -1;

  constructor(private g: Game, look: SkyLook, moonColor: THREE.ColorRepresentation, corona: THREE.ColorRepresentation) {
    this.sky = new SkyTint(g, look, 2);
    g.addProjectile(this.sky);
    const mk = (c: THREE.ColorRepresentation, r: number, add: boolean) => {
      const m = new THREE.Mesh(new THREE.CircleGeometry(r, 48), new THREE.MeshBasicMaterial({ color: c, transparent: true, depthWrite: false, fog: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending }));
      m.frustumCulled = false;
      m.renderOrder = -5;
      return m;
    };
    this.corona = mk(corona, 1.35, true);
    this.moon = mk(moonColor, 1, false);
    this.shadow = mk('#060406', 1.02, false);
    for (const m of [this.corona, this.moon, this.shadow]) g.engine.gr.scene.add(m);
  }

  /** the eclipse ends: the moon fades and the sky comes back */
  end(): void {
    if (this.fadeT < 0) this.fadeT = 0;
    this.sky.target = 0;
  }

  update(dt: number): void {
    this.t += dt;
    if (this.fadeT >= 0) {
      this.fadeT += dt;
      if (this.fadeT > 1.2) this.done = true;
    }
  }

  render(): void {
    const cam = this.g.engine.gr.camera;
    // pinned high in the sky, opposite the sun, always facing the camera
    const dir = _v.set(-0.35, 0.62, -0.7).normalize();
    const far = 380;
    const base = _w.copy(cam.position).addScaledVector(dir, far);
    const scale = 34;
    const a = this.fadeT >= 0 ? Math.max(0, 1 - this.fadeT / 1.2) : Math.min(1, this.t / 0.8);
    // the shadow slides across the moon over two seconds
    const k = Math.min(1, this.t / 2.2);
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    for (const [m, off, s] of [[this.corona, 0, scale * (0.9 + 0.12 * k)], [this.moon, 0, scale], [this.shadow, (1 - k) * 2.2, scale]] as [THREE.Mesh, number, number][]) {
      m.position.copy(base).addScaledVector(right, off * scale);
      m.quaternion.copy(cam.quaternion);
      m.scale.setScalar(s);
      (m.material as THREE.MeshBasicMaterial).opacity = a * (m === this.corona ? 0.35 + 0.65 * k : 1);
    }
  }

  dispose(): void {
    for (const m of [this.corona, this.moon, this.shadow]) {
      m.removeFromParent();
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    }
    this.sky.target = 0;
  }
}

/**
 * The giant black crescent left hanging in the sky after the Blood Chains Getsuga [anime-only]: black with a hard white
 * outline, high over the field for `life` seconds, lighting it pale.
 */
export class SkyCrescent implements Projectile {
  done = false;
  private t = 0;
  private group = new THREE.Group();
  private mats: THREE.ShaderMaterial[] = [];
  private light: THREE.PointLight;

  constructor(private g: Game, at: THREE.Vector3, facing: THREE.Vector3, readonly life = 20) {
    const R = 26;
    const geo = crescentGeometry(R, 1.25, 0.35, R * 0.4, 1.2, 64, 8);
    const dm = crescentMaterial(GETSUGA_BLOOD, true);
    const dmesh = new THREE.Mesh(geo, dm);
    dmesh.renderOrder = 5;
    dmesh.scale.set(0.97, 1.4, 0.97);
    const m = crescentMaterial(GETSUGA_BLOOD);
    const mesh = new THREE.Mesh(geo, m);
    mesh.renderOrder = 6;
    this.group.add(dmesh, mesh);
    this.mats.push(dm, m);
    this.group.traverse((c) => (c.frustumCulled = false));
    // upright, the horns pointing up, facing the field
    const fw = facing.clone().setY(0).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const side = new THREE.Vector3().crossVectors(up, fw).normalize();
    _m.makeBasis(side, fw.clone().negate(), up);
    this.group.quaternion.setFromRotationMatrix(_m);
    this.group.position.copy(at).setY(at.y + 46);
    this.light = new THREE.PointLight('#F3F0F4', 40, 140, 1.2);
    this.light.position.copy(this.group.position);
    g.engine.gr.scene.add(this.group, this.light);
  }

  update(dt: number): void {
    this.t += dt;
    if (this.t >= this.life) this.done = true;
  }

  render(_dt: number, time: number): void {
    const a = Math.min(1, this.t / 0.6) * Math.min(1, (this.life - this.t) / 2);
    for (const m of this.mats) {
      m.uniforms.uTime.value = time;
      m.uniforms.uA.value = a;
    }
    this.light.intensity = 40 * a;
  }

  dispose(): void {
    this.group.removeFromParent();
    this.light.removeFromParent();
    for (const m of this.mats) m.dispose();
  }
}

/** Black flames left in his footprints (Blood Chains), or wet prints after the release. */
export function footprint(g: Game, at: THREE.Vector3, wet: boolean): void {
  if (wet) {
    g.engine.dust.spawn({ x: at.x, y: at.y + 0.03, z: at.z, size: 0.35, sizeEnd: 0.45, life: 1.6, r: 0.3, g: 0.36, b: 0.42, alpha: 0.45, alphaEnd: 0, tex: TEX_PUFF });
    return;
  }
  for (let i = 0; i < 3; i++) g.engine.dust.spawn({ x: at.x + (Math.random() - 0.5) * 0.2, y: at.y + 0.05, z: at.z + (Math.random() - 0.5) * 0.2, vy: 0.9 + Math.random() * 0.6, size: 0.18, sizeEnd: 0.32, life: 0.9, r: 0.06, g: 0.02, b: 0.02, alpha: 0.75, alphaEnd: 0, tex: TEX_PUFF, drag: 1 });
  g.engine.glow.spawn({ x: at.x, y: at.y + 0.08, z: at.z, vy: 0.4, size: 0.12, sizeEnd: 0.02, life: 0.6, r: 0.5, g: 0.04, b: 0.06, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
}

/** Red flames streaming off the five chain points (neck, wrists, ankles) of the Blood Chains form. */
export function chainFlames(g: Game, pts: THREE.Vector3[]): void {
  for (const p of pts) {
    if (Math.random() < 0.5) continue;
    g.engine.glow.spawn({ x: p.x + (Math.random() - 0.5) * 0.1, y: p.y, z: p.z + (Math.random() - 0.5) * 0.1, vx: (Math.random() - 0.5) * 0.6, vy: 1.2 + Math.random(), vz: (Math.random() - 0.5) * 0.6, size: 0.16, sizeEnd: 0.03, life: 0.35, r: 1, g: 0.2 + Math.random() * 0.15, b: 0.1, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: 2, drag: 1.5 });
  }
}
