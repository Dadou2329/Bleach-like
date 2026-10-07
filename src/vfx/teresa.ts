// Nnoitra Gilga's effects. TeresaChain: the chain from Santa Teresa's butt ring to his waist — a verlet chain
// of steel links (flat boxes turned alternately) that pays out as the weapon goes further. ThrownTeresa: the
// weapon flung on its chain, turning end over end; it cuts through whatever it passes, bites the first
// fighter it meets and drags them back with it on the yank. Whirl: the weapon swung round over his head on
// the chain, a wind that hurls dust round and batters whoever comes close. RadarTrail: Indice Radar, a
// glowing yellow line streaking over the ground from his finger to the target. FlyingScythe: a mantis
// scythe thrown end over end.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { PropMesh } from '../game/characterFactory';
import { SphereShape } from '../destruction/shapes';
import { nnoitraProp, SCYTHE_TIP, TERESA_HEAD_Z, TERESA_RING } from '../chars/nnoitra';
import { groundAt } from './iceArts';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

export const NNOITRA_GOLD = { core: '#FFF4C2', body: '#FFC930', rim: '#B8861C' };

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const _s = new THREE.Vector3();
const Z = new THREE.Vector3(0, 0, 1);

// ------------------------------------------------------------------ the chain

const N = 34;

/** The chain: steel links from one end to the other; it pays out as the ends move apart. */
export class TeresaChain implements Projectile {
  done = false;
  private p: THREE.Vector3[] = [];
  private prev: THREE.Vector3[] = [];
  private mesh: THREE.InstancedMesh;
  private inited = false;
  hidden = false;

  constructor(private g: Game, private owner: Fighter, private ends: () => [THREE.Vector3, THREE.Vector3] | null, readonly slack = 1.7) {
    for (let i = 0; i < N; i++) {
      this.p.push(new THREE.Vector3());
      this.prev.push(new THREE.Vector3());
    }
    const mat = new THREE.MeshStandardMaterial({ color: '#9A9EA4', roughness: 0.3, metalness: 0.85 });
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, N - 1);
    this.mesh.castShadow = true;
    this.mesh.frustumCulled = false;
    g.engine.gr.scene.add(this.mesh);
  }

  end(): void {
    this.done = true;
  }

  update(): void {
    if (!this.g.fighters.includes(this.owner)) this.done = true;
  }

  render(dt: number): void {
    const e = this.ends();
    const vis = !!e && !this.hidden && !this.owner.dead;
    this.mesh.visible = vis;
    if (!e || !vis) {
      this.inited = false;
      return;
    }
    const [a, b] = e;
    const span = a.distanceTo(b);
    if (!this.inited) {
      for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        this.p[i].lerpVectors(a, b, t);
        this.p[i].y -= Math.sin(t * Math.PI) * 0.4;
        this.prev[i].copy(this.p[i]);
      }
      this.inited = true;
    }
    const h = Math.min(dt, 1 / 30);
    for (let i = 1; i < N - 1; i++) {
      const q = this.p[i], o = this.prev[i];
      _v.subVectors(q, o).multiplyScalar(0.95);
      o.copy(q);
      q.add(_v);
      q.y -= 9.8 * h * h;
    }
    this.p[0].copy(a);
    this.p[N - 1].copy(b);
    // the chain pays out: never shorter than its slack, a little longer than the span
    const seg = Math.max(this.slack, span * 1.04) / (N - 1);
    for (let it = 0; it < 12; it++) {
      for (let i = 0; i < N - 1; i++) {
        const q0 = this.p[i], q1 = this.p[i + 1];
        _v.subVectors(q1, q0);
        const d = _v.length() || 1e-6;
        const w0 = i === 0 ? 0 : 0.5, w1 = i + 1 === N - 1 ? 0 : 0.5;
        if (w0 + w1 === 0) continue;
        const s = (d - seg) / d / (w0 + w1);
        q0.addScaledVector(_v, s * w0);
        q1.addScaledVector(_v, -s * w1);
      }
      for (let i = 1; i < N - 1; i++) if (this.p[i].y < this.owner.pos.y + 0.04) this.p[i].y = this.owner.pos.y + 0.04;
    }
    // links: flat boxes along the chain, every other one turned a quarter
    for (let i = 0; i < N - 1; i++) {
      const q0 = this.p[i], q1 = this.p[i + 1];
      _w.subVectors(q1, q0);
      const len = Math.max(0.02, _w.length());
      _q.setFromUnitVectors(Z, _w.normalize());
      if (i % 2) _q.multiply(new THREE.Quaternion().setFromAxisAngle(Z, Math.PI / 2));
      _m.compose(_v.lerpVectors(q0, q1, 0.5), _q, _s.set(0.05, 0.02, Math.min(0.11, len * 1.15)));
      this.mesh.setMatrixAt(i, _m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

// ------------------------------------------------------------------ the throw

/** Santa Teresa thrown on its chain: out, then hauled back (dragging whatever it bit). */
export class ThrownTeresa implements Projectile {
  done = false;
  readonly mesh: PropMesh;
  readonly pos: THREE.Vector3;
  private vel: THREE.Vector3;
  private t = 0;
  private spin = 0;
  private travelled = 0;
  private state: 'out' | 'stuck' | 'back' = 'out';
  private hit = new Set<number>();
  private carveAcc = 0;
  /** the fighter it bit (dragged back on the yank) */
  hooked: Fighter | null = null;
  private stuckT = 0;

  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, dir: THREE.Vector3, private hand: () => THREE.Vector3, readonly range = 26, readonly damage = 40) {
    this.mesh = new PropMesh(nnoitraProp('teresa'));
    this.mesh.frustumCulled = false;
    g.engine.gr.scene.add(this.mesh);
    this.pos = from.clone();
    this.vel = dir.clone().normalize().multiplyScalar(36);
  }

  get returning(): boolean {
    return this.state === 'back';
  }

  /** the ring at the butt the chain hangs from (world) */
  ring(out = new THREE.Vector3()): THREE.Vector3 {
    this.mesh.updateMatrixWorld(true);
    return out.set(...TERESA_RING).applyMatrix4(this.mesh.matrixWorld);
  }

  /** haul it back */
  yank(): void {
    if (this.state !== 'back') {
      this.state = 'back';
      this.g.sfx.play('swingHeavy', this.pos, 0.8);
    }
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const o = this.owner;
    if (o.dead) {
      this.done = true;
      return;
    }
    if (this.state === 'out') {
      const step = this.vel.length() * dt;
      this.pos.addScaledVector(this.vel, dt);
      this.travelled += step;
      this.spin += dt * 16;
      // it bites into a wall and stays there until hauled back
      if (g.engine.world.isSolidAtPos(this.pos.x, this.pos.y, this.pos.z)) {
        this.state = 'stuck';
        g.engine.destruction.carve(new SphereShape(this.pos.clone(), 1.6, 0.5), { mode: 'cut', power: 520, dir: this.vel.clone().normalize(), sparks: [1, 0.85, 0.4] });
        g.sfx.play('impact', this.pos, 0.8);
      }
      if (this.travelled > this.range) this.state = 'stuck';
    } else if (this.state === 'stuck') {
      this.stuckT += dt;
      if (this.stuckT > 1.2) this.yank();
    } else {
      // hauled back to his hand, faster as it comes
      const h = this.hand();
      _v.subVectors(h, this.pos);
      const d = _v.length();
      const sp = Math.min(48, 20 + this.t * 20);
      if (d < 1.2) {
        this.done = true;
        if (this.hooked && !this.hooked.dead) {
          // whatever it dragged lands in front of him
          const f = this.hooked;
          f.hitstun = Math.max(f.hitstun, 0.5);
          f.body.vel.set(0, 0, 0);
          f.push.set(0, 0, 0);
        }
        return;
      }
      this.pos.addScaledVector(_v.normalize(), Math.min(d, sp * dt));
      this.spin += dt * 20;
      if (this.hooked && !this.hooked.dead) {
        const f = this.hooked;
        // the hooked fighter comes with it, held a step in front of the blades
        _w.copy(this.pos).addScaledVector(_v, -0.6);
        f.body.pos.x = _w.x;
        f.body.pos.z = _w.z;
        f.body.pos.y = Math.max(f.body.pos.y, (groundAt(g, _w.x, _w.y + 1, _w.z, 4) ?? f.body.pos.y));
        f.body.vel.set(0, 0, 0);
        f.hitstun = Math.max(f.hitstun, 0.2);
      }
    }
    // cut through what it passes; hit fighters once each
    if (this.state !== 'stuck') {
      this.carveAcc += dt;
      if (this.carveAcc > 0.05) {
        this.carveAcc = 0;
        g.engine.destruction.carve(new SphereShape(this.pos.clone(), 1.2, 0.5), { mode: 'cut', power: 420, dir: this.vel.clone().normalize(), sparks: [1, 0.85, 0.4], dust: 0.4 });
      }
      for (const f of g.enemiesOf(o)) {
        if (f.dead || this.hit.has(f.id)) continue;
        if (f.center(_w).distanceTo(this.pos) > 1.5 + f.def.radius) continue;
        this.hit.add(f.id);
        _v.subVectors(f.pos, o.pos).setY(0).normalize();
        g.damage(f, this.damage, o, _v.clone(), { knock: this.state === 'out' ? 10 : 2, launch: 2, heavy: true, hitstop: 0.08, shake: 0.3 });
        g.sparks(f.center(), _v, '#FFC930', 14);
        if (!this.hooked && !f.def.boss) this.hooked = f;
      }
    }
  }

  render(): void {
    this.mesh.position.copy(this.pos);
    // end over end, the crescents leading
    const fw = _v.copy(this.vel).setY(0);
    if (fw.lengthSq() < 1e-4) fw.set(0, 0, 1);
    fw.normalize();
    const yaw = Math.atan2(fw.x, fw.z);
    this.mesh.rotation.set(0, 0, 0);
    this.mesh.rotateY(yaw);
    this.mesh.rotateX(this.state === 'stuck' ? 0.3 : this.spin);
    this.mesh.translateZ(-TERESA_HEAD_Z * 0.35);
  }

  dispose(): void {
    this.mesh.removeFromParent();
  }
}

// ------------------------------------------------------------------ the whirl

/** The weapon swung round over his head on its chain: a wind that throws dust and batters whoever is close. */
export class Whirl implements Projectile {
  done = false;
  readonly mesh: PropMesh;
  private a = 0;
  private t = 0;
  private acc = 0;
  readonly radius = 2.6;

  constructor(private g: Game, readonly owner: Fighter) {
    this.mesh = new PropMesh(nnoitraProp('teresa'));
    this.mesh.frustumCulled = false;
    g.engine.gr.scene.add(this.mesh);
  }

  /** where the weapon is now (its head), and the way it is travelling */
  head(out = new THREE.Vector3()): THREE.Vector3 {
    const o = this.owner;
    return out.set(o.pos.x + Math.cos(this.a) * this.radius, o.pos.y + 2.6, o.pos.z + Math.sin(this.a) * this.radius);
  }

  ring(out = new THREE.Vector3()): THREE.Vector3 {
    this.mesh.updateMatrixWorld(true);
    return out.set(...TERESA_RING).applyMatrix4(this.mesh.matrixWorld);
  }

  end(): void {
    this.done = true;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const o = this.owner;
    if (o.dead) {
      this.done = true;
      return;
    }
    this.a += dt * Math.min(11, 4 + this.t * 10);
    const h = this.head();
    // the wind: dust thrown round in a ring, debris lifted
    for (let i = 0; i < 3; i++) {
      const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 3;
      const px = o.pos.x + Math.cos(a) * r, pz = o.pos.z + Math.sin(a) * r;
      g.engine.dust.spawn({ x: px, y: o.pos.y + 0.2 + Math.random() * 1.5, z: pz, vx: -Math.sin(a) * 6, vy: 1 + Math.random() * 2, vz: Math.cos(a) * 6, size: 0.6, sizeEnd: 1.8, life: 0.8, r: 0.78, g: 0.74, b: 0.66, alpha: 0.35, alphaEnd: 0, drag: 1.2, tex: TEX_PUFF });
    }
    g.engine.glow.spawn({ x: h.x, y: h.y, z: h.z, size: 0.5, sizeEnd: 0.1, life: 0.2, r: 1, g: 0.8, b: 0.3, alpha: 0.4, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
    this.acc += dt;
    if (this.acc < 0.2) return;
    this.acc = 0;
    for (const f of g.enemiesOf(o)) {
      if (f.dead) continue;
      _v.subVectors(f.pos, o.pos).setY(0);
      const d = _v.length();
      if (d > 4.2 + f.def.radius) continue;
      _v.normalize();
      g.damage(f, 9, o, _v.clone(), { knock: 9, launch: 1, hitstop: 0.02, shake: 0.08 });
      f.push.addScaledVector(_v, 6);
    }
    if (Math.random() < 0.5) g.engine.destruction.carve(new SphereShape(h.clone(), 1.1, 0.5), { mode: 'cut', power: 300, sparks: [1, 0.85, 0.4], dust: 0.3 });
  }

  render(): void {
    const h = this.head();
    this.mesh.position.copy(h);
    this.mesh.rotation.set(0, 0, 0);
    // the shaft points out along the radius, the crescents at the far end
    this.mesh.rotateY(Math.atan2(Math.cos(this.a), Math.sin(this.a)) + Math.PI);
    this.mesh.rotateX(-0.25);
    this.mesh.translateZ(-TERESA_HEAD_Z);
  }

  dispose(): void {
    this.mesh.removeFromParent();
  }
}

// ------------------------------------------------------------------ Indice Radar

/** A glowing yellow line streaking over the ground from his finger to the target; `arrived` when it gets there. */
export class RadarTrail implements Projectile {
  done = false;
  arrived = false;
  private head: THREE.Vector3;
  private t = 0;

  constructor(private g: Game, from: THREE.Vector3, private target: Fighter, private onArrive: () => void) {
    this.head = from.clone();
    g.addRing(from.clone(), 1.2, '#FFE45A', 0.4);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.arrived) {
      if (this.t > 0.6) this.done = true;
      return;
    }
    const to = this.target.pos;
    _v.subVectors(to, this.head).setY(0);
    const d = _v.length();
    const step = 46 * dt;
    if (d <= step || this.t > 3) {
      this.arrived = true;
      this.t = 0;
      g.addRing(to.clone(), 1.6, '#FFE45A', 0.5);
      for (let i = 0; i < 18; i++) {
        const a = Math.random() * Math.PI * 2;
        g.engine.glow.spawn({ x: to.x, y: to.y + 0.1, z: to.z, vx: Math.cos(a) * 3, vy: 2 + Math.random() * 4, vz: Math.sin(a) * 3, size: 0.18, sizeEnd: 0.03, life: 0.6, r: 1, g: 0.9, b: 0.35, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
      }
      this.onArrive();
      return;
    }
    _v.normalize();
    const n = Math.max(1, Math.ceil(step / 0.25));
    for (let i = 0; i < n; i++) {
      this.head.addScaledVector(_v, step / n);
      // jinking a little from side to side, flat on the ground
      const j = Math.sin(this.head.x * 3.1 + this.head.z * 2.3) * 0.25;
      const gy = groundAt(g, this.head.x, this.head.y + 1.5, this.head.z, 4);
      if (gy !== null) this.head.y = gy;
      g.engine.glow.spawn({ x: this.head.x - _v.z * j, y: this.head.y + 0.06, z: this.head.z + _v.x * j, size: 0.32, sizeEnd: 0.1, life: 0.9, r: 1, g: 0.89, b: 0.35, alpha: 0.95, alphaEnd: 0, tex: TEX_GLOW });
    }
  }

  dispose(): void {}
}

// ------------------------------------------------------------------ a thrown scythe

/** A mantis scythe thrown end over end; it hits once and is gone. */
export class FlyingScythe implements Projectile {
  done = false;
  private mesh: PropMesh;
  private pos: THREE.Vector3;
  private vel: THREE.Vector3;
  private spin = 0;
  private travelled = 0;
  private carveAcc = 0;

  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, dir: THREE.Vector3, readonly damage = 34) {
    this.mesh = new PropMesh(nnoitraProp('scythe'));
    this.mesh.frustumCulled = false;
    g.engine.gr.scene.add(this.mesh);
    this.pos = from.clone();
    this.vel = dir.clone().normalize().multiplyScalar(42);
  }

  update(dt: number, g: Game): void {
    this.pos.addScaledVector(this.vel, dt);
    this.travelled += this.vel.length() * dt;
    this.spin += dt * 24;
    this.carveAcc += dt;
    if (this.carveAcc > 0.05) {
      this.carveAcc = 0;
      const r = g.engine.destruction.carve(new SphereShape(this.pos.clone(), 0.8, 0.5), { mode: 'cut', power: 380, dir: this.vel.clone().normalize(), sparks: [1, 0.95, 0.8], dust: 0.3 });
      if (r.removed > 120) this.travelled += 8;
    }
    for (const f of g.enemiesOf(this.owner)) {
      if (f.dead || f.center(_w).distanceTo(this.pos) > 1 + f.def.radius) continue;
      _v.copy(this.vel).setY(0).normalize();
      g.damage(f, this.damage, this.owner, _v.clone(), { knock: 10, launch: 2, heavy: true, hitstop: 0.07, shake: 0.25 });
      g.sparks(f.center(), _v, '#ECE7DB', 12);
      this.done = true;
      return;
    }
    if (this.travelled > 45) this.done = true;
  }

  render(): void {
    this.mesh.position.copy(this.pos);
    const fw = _v.copy(this.vel).setY(0).normalize();
    this.mesh.rotation.set(0, Math.atan2(fw.x, fw.z), 0);
    this.mesh.rotateX(this.spin);
    this.mesh.translateZ(-SCYTHE_TIP[2] * 0.5);
  }

  dispose(): void {
    this.mesh.removeFromParent();
  }
}
