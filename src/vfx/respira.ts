// Baraggan's rot (docs/roster/E1-espada-1.md): Respira, the breath of death — a black-purple miasma that
// ages and rots whatever it touches (stone crumbles to dust, flesh withers, Kidō dies); Respira Total, the
// enraged surge that rots every building round him at once; Gran Caída thrown, rotting what it passes; and
// Senescencia, the sealed king's field in which everything round him moves as if through syrup.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { PropMesh } from '../game/characterFactory';
import { BoxShape, ConeShape, SphereShape } from '../destruction/shapes';
import { baragganProp, CAIDA_HEAD_Z } from '../chars/baraggan';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';
import type { EnergyColors } from './energy';

/** the crescent of the Respira slash: black at the heart, a violet rim */
export const RESPIRA: EnergyColors = { core: '#B07ADF', body: '#5B2A7A', rim: '#2A1238' };
/** his reiatsu: dark red */
export const BARAGGAN_RED = '#8B0E16';

const MIASMA = new THREE.Color('#1B0E24');
const MIASMA_HI = new THREE.Color('#4A2160');
const SPARK = new THREE.Color('#9B5BD1');
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

/** one puff of the miasma: dark smoke swelling as it drifts, now and then a violet spark */
export function miasmaPuff(g: Game, x: number, y: number, z: number, vx: number, vy: number, vz: number, size = 1, life = 1.3): void {
  const c = Math.random() < 0.35 ? MIASMA_HI : MIASMA;
  g.engine.dust.spawn({ x, y, z, vx, vy, vz, size: 0.5 * size, sizeEnd: (2 + Math.random()) * size, life: life * (0.7 + Math.random() * 0.6), r: c.r, g: c.g, b: c.b, alpha: 0.78, alphaEnd: 0, drag: 1.4, spin: (Math.random() - 0.5) * 1.2, tex: TEX_PUFF });
  if (Math.random() < 0.16)
    g.engine.glow.spawn({ x, y, z, vx: vx * 0.6 + (Math.random() - 0.5) * 2, vy: vy * 0.6 + Math.random(), vz: vz * 0.6 + (Math.random() - 0.5) * 2, size: 0.12, sizeEnd: 0.02, life: 0.5, r: SPARK.r, g: SPARK.g, b: SPARK.b, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: 1.5, drag: 1.5 });
}

/** whatever the rot touches: a target, how strongly (0..1 of the full dose) */
export type RotTouch = (f: Fighter, k: number) => void;

/**
 * Respira (held): the miasma poured out of his open hand in a widening cone that creeps further out the
 * longer he breathes. It rots the world it rolls over and everyone inside it.
 */
export class RespiraBreath implements Projectile {
  done = false;
  private t = 0;
  private carveAcc = 0;
  private touchAcc = 0;
  /** stop pouring (the breath already out keeps rolling a moment) */
  stopping = false;
  private stopT = 0;

  constructor(
    private g: Game,
    readonly owner: Fighter,
    private from: () => THREE.Vector3,
    private aim: () => THREE.Vector3,
    readonly o: { dur: number; range: number; halfAngle: number; speed: number; power: number; touch: RotTouch },
  ) {}

  /** how far the front has crept */
  get reach(): number {
    return Math.min(this.o.range, 1.5 + this.t * this.o.speed);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.stopping || this.t > this.o.dur) {
      this.stopT += dt;
      if (this.stopT > 0.5) this.done = true;
    }
    const from = this.from();
    const dir = _w.copy(this.aim()).sub(from);
    if (dir.lengthSq() < 1e-6) dir.copy(this.owner.forward());
    dir.normalize();
    const reach = this.reach;
    const pouring = this.stopT === 0;
    // the smoke: rolling out along the cone
    if (pouring) {
      for (let i = 0; i < 9; i++) {
        const a = Math.random() * Math.PI * 2, s = Math.random() * this.o.halfAngle;
        const side = _v.set(-dir.z, 0, dir.x).normalize();
        const up = new THREE.Vector3().crossVectors(side, dir);
        const d = dir.clone().multiplyScalar(Math.cos(s)).addScaledVector(side, Math.sin(s) * Math.cos(a)).addScaledVector(up, Math.sin(s) * Math.sin(a));
        const sp = this.o.speed * (0.7 + Math.random() * 0.6);
        miasmaPuff(g, from.x, from.y, from.z, d.x * sp, d.y * sp + 0.3, d.z * sp, 0.9 + Math.random() * 0.6, Math.max(0.4, reach / sp) * 1.1);
      }
    }
    // the world rots where the cloud rolls
    this.carveAcc += dt;
    if (pouring && this.carveAcc > 0.1) {
      this.carveAcc = 0;
      const u = 0.25 + Math.random() * 0.75;
      const c = from.clone().addScaledVector(dir, reach * u);
      c.x += (Math.random() - 0.5) * reach * u * this.o.halfAngle;
      c.y += (Math.random() - 0.6) * reach * u * this.o.halfAngle;
      c.z += (Math.random() - 0.5) * reach * u * this.o.halfAngle;
      g.engine.destruction.carve(new SphereShape(c, 1.2 + u * 1.4), { mode: 'rot', power: this.o.power, edge: 0.35, dust: 0.5 });
      g.engine.destruction.carve(new ConeShape(from.clone(), dir.clone(), this.o.halfAngle * 0.8, reach), { mode: 'rot', power: this.o.power * 0.25, rotOnly: true, noCollapse: true, dust: 0 });
    }
    // and so do the people in it
    this.touchAcc += dt;
    if (this.touchAcc > 0.1) {
      this.touchAcc = 0;
      for (const f of g.enemiesOf(this.owner)) {
        if (f.dead) continue;
        _v.subVectors(f.center(), from);
        const d = _v.length();
        if (d > reach + f.def.radius || d < 0.01) continue;
        const ang = Math.acos(Math.max(-1, Math.min(1, _v.dot(dir) / d)));
        if (ang > this.o.halfAngle + Math.atan2(f.def.radius, d)) continue;
        this.o.touch(f, 1 - (d / Math.max(1, reach)) * 0.5);
      }
    }
  }

  dispose(): void {}
}

/**
 * Respira Total: the enraged king lets it all out — a dome of miasma swelling round him to a great radius;
 * buildings it passes rot through and come down, everyone it reaches withers.
 */
export class RespiraTotal implements Projectile {
  done = false;
  private t = 0;
  private hit = new Set<number>();
  private carveAcc = 0;

  constructor(private g: Game, readonly owner: Fighter, private at: THREE.Vector3, readonly o: { radius: number; dur: number; power: number; touch: RotTouch }) {}

  get r(): number {
    const u = Math.min(1, this.t / this.o.dur);
    return this.o.radius * (1 - (1 - u) ** 2);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const r = this.r;
    const c = this.at;
    // the shell of smoke
    const n = Math.min(40, Math.ceil(r * 2.2));
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const y = Math.random() * Math.min(r, 9);
      const rr = Math.sqrt(Math.max(0, r * r - y * y * 0.5));
      miasmaPuff(g, c.x + Math.cos(a) * rr, c.y + y, c.z + Math.sin(a) * rr, Math.cos(a) * 3, 0.6, Math.sin(a) * 3, 1.4, 1.2);
    }
    // the buildings it reaches rot through: carves on the swelling shell, near the ground and up the walls
    this.carveAcc += dt;
    if (this.carveAcc > 0.05 && this.t < this.o.dur) {
      this.carveAcc = 0;
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        const p = new THREE.Vector3(c.x + Math.cos(a) * r, c.y + Math.random() * 6, c.z + Math.sin(a) * r);
        g.engine.destruction.carve(new SphereShape(p, 2.4), { mode: 'rot', power: this.o.power, edge: 0.4, dust: 0.6 });
      }
      // the ground round him decays as the wave passes
      const a = Math.random() * Math.PI * 2;
      g.engine.destruction.carve(new BoxShape(new THREE.Vector3(c.x + Math.cos(a) * r * 0.8, c.y - 0.4, c.z + Math.sin(a) * r * 0.8), new THREE.Vector3(2.5, 0.6, 2.5)), { mode: 'rot', power: this.o.power * 0.2, rotOnly: true, noCollapse: true, dust: 0 });
    }
    for (const f of g.enemiesOf(this.owner)) {
      if (f.dead || this.hit.has(f.id)) continue;
      if (f.pos.distanceTo(c) > r + f.def.radius) continue;
      this.hit.add(f.id);
      this.o.touch(f, 1);
    }
    if (this.t > this.o.dur + 0.8) this.done = true;
  }

  dispose(): void {}
}

/**
 * Gran Caída thrown: it spins out end over end, rotting what it passes; the gold chains haul it back to his
 * hand after it has flown its course (or bitten into someone).
 */
export class ThrownCaida implements Projectile {
  done = false;
  private mesh: PropMesh;
  readonly pos: THREE.Vector3;
  private vel: THREE.Vector3;
  private spin = 0;
  private out = 0;
  private back = false;
  private hit = new Set<number>();
  private carveAcc = 0;

  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, dir: THREE.Vector3, private hand: () => THREE.Vector3, readonly o: { damage: number; range: number; touch: RotTouch }) {
    this.mesh = new PropMesh(baragganProp('granCaida'));
    this.mesh.frustumCulled = false;
    g.engine.gr.scene.add(this.mesh);
    this.pos = from.clone();
    this.vel = dir.clone().normalize().multiplyScalar(30);
  }

  get returning(): boolean {
    return this.back;
  }

  update(dt: number, g: Game): void {
    this.spin += dt * 20;
    if (!this.back) {
      this.pos.addScaledVector(this.vel, dt);
      this.out += this.vel.length() * dt;
      if (this.out > this.o.range) this.back = true;
    } else {
      const h = this.hand();
      _v.subVectors(h, this.pos);
      const d = _v.length();
      if (d < 1.2) {
        this.done = true;
        return;
      }
      this.vel.copy(_v.multiplyScalar(Math.min(36, 10 + d * 4) / d));
      this.pos.addScaledVector(this.vel, dt);
    }
    this.carveAcc += dt;
    if (this.carveAcc > 0.05) {
      this.carveAcc = 0;
      const r = g.engine.destruction.carve(new SphereShape(this.pos.clone(), 1.1, 0.6), { mode: 'rot', power: 220, edge: 0.4, dust: 0.4 });
      if (r.removed > 260 && !this.back) this.back = true;
    }
    miasmaPuff(g, this.pos.x, this.pos.y, this.pos.z, -this.vel.x * 0.1, 0.4, -this.vel.z * 0.1, 0.7, 0.7);
    for (const f of g.enemiesOf(this.owner)) {
      if (f.dead || this.hit.has(f.id) || f.center(_w).distanceTo(this.pos) > 1.3 + f.def.radius) continue;
      this.hit.add(f.id);
      _v.copy(this.vel).setY(0).normalize();
      g.damage(f, this.o.damage, this.owner, _v.clone(), { knock: 12, launch: 3, heavy: true, hitstop: 0.08, shake: 0.3 });
      g.sparks(f.center(), _v, '#9B5BD1', 14);
      this.o.touch(f, 0.6);
      this.back = true;
    }
  }

  render(): void {
    this.mesh.position.copy(this.pos);
    const fw = _v.copy(this.vel).setY(0);
    if (fw.lengthSq() > 1e-6) fw.normalize();
    this.mesh.rotation.set(0, Math.atan2(fw.x, fw.z), 0);
    this.mesh.rotateX(this.spin);
    this.mesh.translateZ(-CAIDA_HEAD_Z * 0.5);
  }

  dispose(): void {
    this.mesh.removeFromParent();
  }
}

const FIELD_FRAG = /* glsl */ `
uniform float uTime;
uniform float uA;
varying vec3 vN;
varying vec3 vW;
void main() {
  vec3 V = normalize(cameraPosition - vW);
  float rim = pow(clamp(1.0 - abs(dot(normalize(vN), V)), 0.0, 1.0), 2.2);
  // slow ripples of time running down the dome
  float wave = 0.5 + 0.5 * sin(vW.y * 3.0 - uTime * 1.4 + sin(vW.x * 0.7 + vW.z * 0.6) * 2.0);
  vec3 col = mix(vec3(0.32, 0.03, 0.05), vec3(0.85, 0.2, 0.18), rim * 0.6 + wave * 0.2);
  float a = (rim * 0.55 + wave * 0.05) * uA;
  if (a < 0.004) discard;
  gl_FragColor = vec4(col, a);
}`;

/**
 * Senescencia (sealed): a dome of slowed time round him — whoever is inside moves at a crawl. A faint dark
 * red rim marks its edge.
 */
export class SenescenciaField implements Projectile {
  done = false;
  private mesh: THREE.Mesh;
  private mat: THREE.ShaderMaterial;
  private t = 0;
  private a = 0;
  ending = false;

  constructor(private g: Game, readonly owner: Fighter, readonly radius: number, readonly k = 0.6) {
    this.mat = new THREE.ShaderMaterial({
      vertexShader: `varying vec3 vN; varying vec3 vW; void main() { vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: FIELD_FRAG,
      uniforms: { uTime: { value: 0 }, uA: { value: 0 } },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.55), this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 4;
    g.engine.gr.scene.add(this.mesh);
  }

  /** is this point inside the dome? */
  contains(p: THREE.Vector3): boolean {
    return p.distanceTo(this.owner.pos) < this.radius;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    this.a = this.ending ? Math.max(0, this.a - dt * 2.5) : Math.min(1, this.a + dt * 3);
    if (this.ending && this.a <= 0) {
      this.done = true;
      return;
    }
    if (this.ending) return;
    for (const f of g.enemiesOf(this.owner)) {
      if (f.dead || !this.contains(f.pos)) continue;
      f.dilate(this.k, 0.2);
      if (Math.random() < dt * 6) {
        const c = f.center();
        g.engine.glow.spawn({ x: c.x + (Math.random() - 0.5) * 0.6, y: c.y + (Math.random() - 0.5) * 1.2, z: c.z + (Math.random() - 0.5) * 0.6, vy: 0.2, size: 0.3, sizeEnd: 0.05, life: 1.2, r: 0.7, g: 0.12, b: 0.12, alpha: 0.5, alphaEnd: 0, tex: TEX_GLOW });
      }
    }
  }

  render(_dt: number, time: number): void {
    this.mesh.position.copy(this.owner.renderPos);
    this.mesh.scale.setScalar(this.radius * (0.92 + 0.08 * this.a));
    this.mat.uniforms.uTime.value = time;
    this.mat.uniforms.uA.value = this.a;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}
