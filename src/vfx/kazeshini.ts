// Hisagi's effects (docs/kits/hisagi.md): Tsuzuri Raiden's current (jagged arcs along a blade or a chain),
// Bakudō #62 Hyapporankan (a rod of light that flies to the target and splits into a rain of rods that pin them),
// the explosive band (a black band flung in an arc: a white flash and a pall of smoke that blinds), Bakudō #63
// Sajō Sabaku (a glowing yellow rope binding the upper body), the chain wrap (coils round a target, the chain run
// back to his hand), and the novel Bankai's orb of tangled chains floating over him with the noose from his own
// neck, the nooses it drops on others, and the chains it rains down.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import type { VoxelModel } from '../models/builder';
import { PropMesh } from '../game/characterFactory';
import { SphereShape } from '../destruction/shapes';
import { ChainLine } from './shiro';
import { groundAt } from './iceArts';
import { TEX_GLOW, TEX_PUFF, TEX_RING, TEX_STREAK } from './sprites';

export const HISAGI_GREEN = { core: '#D3F8DD', body: '#3CC45A', rim: '#1E7A33' };
export const CHAIN_GREY = '#8A8F96';
const RAIDEN = new THREE.Color('#CFE8FF');
const RAIDEN_FRINGE = new THREE.Color('#8A7CFF');
const ROD = new THREE.Color('#D6ECFF');
const ROD_GLOW = new THREE.Color('#7FC0FF');
const ROPE = new THREE.Color('#F2D04A');
const SMOKE = new THREE.Color('#9A9A9E');

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const _s = new THREE.Vector3();
const Z = new THREE.Vector3(0, 0, 1);

/** a jagged arc of current from a to b (Tsuzuri Raiden): short-lived streaks along a broken line, violet at the fringe */
export function raidenArc(g: Game, a: THREE.Vector3, b: THREE.Vector3, jag = 0.18): void {
  const glow = g.engine.glow;
  const d = _v.subVectors(b, a);
  const len = d.length();
  if (len < 1e-3) return;
  const n = Math.max(3, Math.min(14, Math.round(len / 0.25)));
  let px = a.x, py = a.y, pz = a.z;
  for (let i = 1; i <= n; i++) {
    const u = i / n;
    const j = i === n ? 0 : jag;
    const x = a.x + d.x * u + (Math.random() - 0.5) * 2 * j, y = a.y + d.y * u + (Math.random() - 0.5) * 2 * j, z = a.z + d.z * u + (Math.random() - 0.5) * 2 * j;
    const mx = (px + x) / 2, my = (py + y) / 2, mz = (pz + z) / 2;
    // a streak the length of the segment (the sprite stretches by 1 + stretch·|v|·0.05; v is kept tiny so it stays put)
    const len = Math.hypot(x - px, y - py, z - pz);
    glow.spawn({ x: mx, y: my, z: mz, vx: (x - px) * 0.01, vy: (y - py) * 0.01, vz: (z - pz) * 0.01, size: 0.09, sizeEnd: 0.05, life: 0.09 + Math.random() * 0.05, r: RAIDEN.r * 2, g: RAIDEN.g * 2, b: RAIDEN.b * 2, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: streakStretch(len * 1.15, 0.09, len * 0.01) });
    if (Math.random() < 0.25) glow.spawn({ x: mx, y: my, z: mz, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3, vz: (Math.random() - 0.5) * 3, size: 0.05, sizeEnd: 0.01, life: 0.2, r: RAIDEN_FRINGE.r * 1.6, g: RAIDEN_FRINGE.g * 1.6, b: RAIDEN_FRINGE.b * 1.6, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, drag: 2 });
    px = x; py = y; pz = z;
  }
}

/** a charged blade (Tsuzuri Raiden held on it): an arc along the edge and a pale sheath of light round it */
export function raidenBlade(g: Game, base: THREE.Vector3, tip: THREE.Vector3): void {
  raidenArc(g, base, tip, 0.07);
  // the sheath: one long soft streak along the blade
  const d = _w.subVectors(tip, base);
  const len = d.length();
  const m = _a.copy(base).addScaledVector(d, 0.5);
  g.engine.glow.spawn({ x: m.x, y: m.y, z: m.z, vx: d.x * 0.01, vy: d.y * 0.01, vz: d.z * 0.01, size: 0.22, sizeEnd: 0.2, life: 0.12, r: RAIDEN.r * 0.9, g: RAIDEN.g * 0.9, b: RAIDEN.b * 1.2, alpha: 0.55, alphaEnd: 0, tex: TEX_STREAK, stretch: streakStretch(len * 1.1, 0.22, len * 0.01) });
}

/** the `stretch` that makes a streak sprite of `size` moving at `speed` about `length` long */
function streakStretch(length: number, size: number, speed: number): number {
  return Math.max(0, length / size - 1) / Math.max(1e-6, speed * 0.05);
}

/** a paralysing jolt on a fighter: arcs crawling over the body */
export function raidenJolt(g: Game, o: Fighter): void {
  const c = o.center(_a);
  for (let i = 0; i < 4; i++) {
    const p = _b.set(c.x + (Math.random() - 0.5) * 0.8, o.pos.y + Math.random() * o.def.height, c.z + (Math.random() - 0.5) * 0.8);
    raidenArc(g, c.clone(), p.clone(), 0.12);
  }
  g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: 0.5, sizeEnd: 1.6, life: 0.2, r: RAIDEN.r * 1.4, g: RAIDEN.g * 1.4, b: RAIDEN.b * 1.6, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
}

// ------------------------------------------------------------------ Hyapporankan

interface FallingRod {
  from: THREE.Vector3;
  to: THREE.Vector3;
  t0: number;
}

/**
 * Bakudō #62 Hyapporankan: a rod of light thrown at the target; near them it splits into a rain of rods that drive
 * into the ground round them like a railing and pin them (`onPin`). The rods hold `hold` seconds, then fade.
 */
export class Hyapporankan implements Projectile {
  done = false;
  private t = 0;
  private phase: 'fly' | 'rain' | 'fade' = 'fly';
  private pos: THREE.Vector3;
  private dir = new THREE.Vector3();
  private lead: THREE.Mesh;
  private rods: THREE.InstancedMesh;
  private falling: FallingRod[] = [];
  private rainT = 0;
  private out = 0;
  private pinned = false;
  private readonly N = 40;

  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, readonly target: Fighter | null, private at: THREE.Vector3, readonly hold: number, private onPin: (o: Fighter) => void, private onFree: (o: Fighter) => void) {
    this.pos = from.clone();
    this.dir.subVectors(at, from).normalize();
    const mat = new THREE.MeshBasicMaterial({ color: ROD.clone().multiplyScalar(1.8) });
    this.lead = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 1.0), mat);
    this.lead.quaternion.setFromUnitVectors(Z, this.dir);
    this.lead.position.copy(this.pos);
    g.engine.gr.scene.add(this.lead);
    this.rods = new THREE.InstancedMesh(new THREE.BoxGeometry(0.04, 0.04, 0.9), mat, this.N);
    this.rods.count = 0;
    this.rods.frustumCulled = false;
    g.engine.gr.scene.add(this.rods);
    g.sfx.play('swing', from, 0.6);
  }

  private aimPoint(out: THREE.Vector3): THREE.Vector3 {
    return this.target && !this.target.dead ? this.target.center(out) : out.copy(this.at);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.phase === 'fly') {
      const tgt = this.aimPoint(_a);
      this.dir.subVectors(tgt, this.pos);
      const d = this.dir.length();
      const step = 36 * dt;
      this.dir.divideScalar(d || 1);
      this.pos.addScaledVector(this.dir, Math.min(step, d));
      this.out += step;
      this.lead.position.copy(this.pos);
      this.lead.quaternion.setFromUnitVectors(Z, this.dir);
      g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, size: 0.3, sizeEnd: 0.05, life: 0.18, r: ROD_GLOW.r, g: ROD_GLOW.g, b: ROD_GLOW.b, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
      if (d < 1.2 || this.out > 40) this.split(g);
      return;
    }
    if (this.phase === 'rain') {
      this.rainT += dt;
      this.layRods();
      if (!this.pinned && this.rainT > 0.12 && this.target && !this.target.dead && this.target.pos.distanceTo(this.at) < 2.4) {
        this.pinned = true;
        this.onPin(this.target);
        g.sfx.play('impact', this.target.center(), 0.7);
      }
      if (this.rainT >= this.hold) {
        this.phase = 'fade';
        this.t = 0;
        if (this.pinned && this.target) this.onFree(this.target);
      }
      return;
    }
    // fade: the rods shrink away into motes
    this.layRods(Math.max(0, 1 - this.t / 0.35));
    if (this.t >= 0.35) this.done = true;
  }

  private split(g: Game): void {
    this.phase = 'rain';
    this.lead.visible = false;
    const c = this.aimPoint(_a).clone();
    const gy = groundAt(g, c.x, c.y + 0.5, c.z, 6) ?? c.y - 1;
    this.at.set(c.x, gy, c.z);
    for (let i = 0; i < this.N; i++) {
      const a = (i / this.N) * Math.PI * 2 + Math.random() * 0.3;
      const r = 0.55 + (i % 3) * 0.35 + Math.random() * 0.15;
      const to = new THREE.Vector3(c.x + Math.cos(a) * r, gy + 0.35, c.z + Math.sin(a) * r);
      // they come down slanting in toward the target
      const from = to.clone().add(new THREE.Vector3(Math.cos(a) * 1.4, 5 + Math.random() * 2, Math.sin(a) * 1.4));
      this.falling.push({ from, to, t0: (i / this.N) * 0.35 });
    }
    this.rods.count = this.N;
    for (let i = 0; i < 18; i++) g.engine.glow.spawn({ x: c.x, y: c.y + 2.5, z: c.z, vx: (Math.random() - 0.5) * 8, vy: Math.random() * 3, vz: (Math.random() - 0.5) * 8, size: 0.12, sizeEnd: 0.02, life: 0.4, r: ROD_GLOW.r * 1.5, g: ROD_GLOW.g * 1.5, b: ROD_GLOW.b * 1.5, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2 });
    g.sfx.play('ting', c, 0.8);
  }

  private layRods(scale = 1): void {
    for (let i = 0; i < this.falling.length; i++) {
      const r = this.falling[i];
      const k = Math.max(0, Math.min(1, (this.rainT - r.t0) / 0.12));
      const p = _v.lerpVectors(r.from, r.to, k * k);
      const d = _w.subVectors(r.to, r.from).normalize();
      _q.setFromUnitVectors(Z, d);
      const sc = k > 0 ? scale : 0;
      _m.compose(p, _q, _s.set(sc, sc, sc));
      this.rods.setMatrixAt(i, _m);
      if (k > 0 && k < 1 && Math.random() < 0.3) this.g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.14, sizeEnd: 0.03, life: 0.15, r: ROD_GLOW.r, g: ROD_GLOW.g, b: ROD_GLOW.b, alpha: 0.7, alphaEnd: 0, tex: TEX_GLOW });
    }
    this.rods.instanceMatrix.needsUpdate = true;
  }

  /** "I reject": the rods are undone (the pin with them) */
  reject(at: THREE.Vector3, radius: number, by: Fighter): boolean {
    if (this.done || by.team === this.owner.team) return false;
    const p = this.phase === 'fly' ? this.pos : this.at;
    if (p.distanceTo(at) > radius + 1.2) return false;
    if (this.pinned && this.target) this.onFree(this.target);
    this.pinned = false;
    this.done = true;
    return true;
  }

  dispose(): void {
    if (this.pinned && this.target && this.phase !== 'fade') this.onFree(this.target);
    this.lead.removeFromParent();
    this.lead.geometry.dispose();
    this.rods.removeFromParent();
    this.rods.geometry.dispose();
    (this.rods.material as THREE.Material).dispose();
  }
}

// ------------------------------------------------------------------ the explosive band

/**
 * One of his black bands flung in an arc: it goes off on what it meets (or in the air after a moment) in a white
 * flash and a pall of grey smoke. `onBlast` deals the damage and the blinding.
 */
export class BandBomb implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.Mesh;
  private vel: THREE.Vector3;
  private pos: THREE.Vector3;
  private smokeT = -1;
  private at = new THREE.Vector3();

  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, vel: THREE.Vector3, private onBlast: (p: THREE.Vector3) => void) {
    this.pos = from.clone();
    this.vel = vel.clone();
    this.mesh = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.022, 6, 12), new THREE.MeshStandardMaterial({ color: '#1C1C20', roughness: 0.5 }));
    this.mesh.position.copy(from);
    g.engine.gr.scene.add(this.mesh);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.smokeT >= 0) {
      // the smoke hangs a while, rolling outward
      this.smokeT += dt;
      if (this.smokeT < 3.5 && Math.random() < 0.6) {
        const a = Math.random() * Math.PI * 2, r = Math.random() * 2.6;
        g.engine.dust.spawn({ x: this.at.x + Math.cos(a) * r, y: this.at.y + 0.3 + Math.random() * 2.2, z: this.at.z + Math.sin(a) * r, vx: Math.cos(a) * 0.4, vy: 0.15, vz: Math.sin(a) * 0.4, size: 1.6, sizeEnd: 2.8, life: 1.8, r: SMOKE.r, g: SMOKE.g, b: SMOKE.b, alpha: 0.4, alphaEnd: 0, tex: TEX_PUFF, drag: 0.8, spin: (Math.random() - 0.5) * 0.4 });
      }
      if (this.smokeT >= 3.6) this.done = true;
      return;
    }
    this.vel.y -= 20 * dt;
    this.pos.addScaledVector(this.vel, dt);
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.x += dt * 14;
    this.mesh.rotation.y += dt * 9;
    let boom = this.t > 0.9 || g.engine.world.isSolidAtPos(this.pos.x, this.pos.y, this.pos.z);
    if (!boom) for (const o of g.enemiesOf(this.owner)) if (!o.dead && o.center(_v).distanceTo(this.pos) < o.def.radius + 0.6) boom = true;
    if (boom) this.blast(g);
  }

  private blast(g: Game): void {
    const p = this.pos.clone();
    this.at.copy(p);
    this.mesh.visible = false;
    this.smokeT = 0;
    const glow = g.engine.glow;
    glow.spawn({ x: p.x, y: p.y, z: p.z, size: 1.2, sizeEnd: 7, life: 0.3, r: 2.2, g: 2.2, b: 2.1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.6, sizeEnd: 8, life: 0.35, r: 1, g: 1, b: 1, alpha: 0.8, alphaEnd: 0, tex: TEX_RING });
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2, e = Math.random() * 2 - 1, q = Math.sqrt(1 - e * e), s = 8 + Math.random() * 10;
      glow.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * q * s, vy: e * s, vz: Math.sin(a) * q * s, size: 0.12, sizeEnd: 0.02, life: 0.35, r: 1.6, g: 1.4, b: 1.1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 2.5 });
    }
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 5;
      g.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * s, vy: Math.random() * 2, vz: Math.sin(a) * s, size: 1.0, sizeEnd: 3.0, life: 1.6 + Math.random(), r: SMOKE.r, g: SMOKE.g, b: SMOKE.b, alpha: 0.55, alphaEnd: 0, tex: TEX_PUFF, drag: 2.2 });
    }
    g.engine.destruction.carve(new SphereShape(p, 1.0), { mode: 'explode', power: 120, impulse: 9 });
    g.sfx.play('explode', p, 0.8);
    this.onBlast(p);
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

// ------------------------------------------------------------------ binds

/**
 * Bakudō #63 Sajō Sabaku: a glowing yellow rope round the target's upper body — three coils that follow them for
 * `dur` seconds (`onEnd` lifts the bind), crackling.
 */
export class SajoRope implements Projectile {
  done = false;
  private t = 0;
  private coils: THREE.Mesh[] = [];
  constructor(private g: Game, readonly owner: Fighter, readonly o: Fighter, readonly dur: number, private onEnd: () => void) {
    const mat = new THREE.MeshBasicMaterial({ color: ROPE.clone().multiplyScalar(1.7) });
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(new THREE.TorusGeometry(o.def.radius + 0.14, 0.035, 6, 24), mat);
      g.engine.gr.scene.add(m);
      this.coils.push(m);
    }
    g.sfx.play('ting', o.center(), 0.7);
  }
  update(dt: number, g: Game): void {
    this.t += dt;
    const o = this.o;
    if (o.dead) this.t = this.dur;
    // the coils pull tight in the first instant, then hold
    const k = Math.min(1, this.t / 0.15);
    this.coils.forEach((m, i) => {
      const y = o.pos.y + o.def.height * (0.5 + i * 0.12);
      m.position.set(o.pos.x, y, o.pos.z);
      m.rotation.set(Math.PI / 2 + Math.sin(i * 2.1) * 0.25, 0, Math.cos(i * 1.7) * 0.2);
      const s = 1 + (1 - k) * 1.5;
      m.scale.set(s, s, s);
    });
    if (Math.random() < 0.25) {
      const c = o.center(_a);
      g.engine.glow.spawn({ x: c.x + (Math.random() - 0.5) * 0.8, y: c.y + Math.random() * 0.5, z: c.z + (Math.random() - 0.5) * 0.8, size: 0.08, sizeEnd: 0.02, life: 0.3, r: ROPE.r * 1.6, g: ROPE.g * 1.6, b: ROPE.b, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    }
    if (this.t >= this.dur) {
      this.done = true;
      this.onEnd();
    }
  }
  dispose(): void {
    for (const m of this.coils) {
      m.removeFromParent();
      m.geometry.dispose();
    }
    (this.coils[0]?.material as THREE.Material | undefined)?.dispose();
  }
}

/**
 * Kazeshini's chain wrapped round a target: three tilted coils of chain on them and the chain run back to his hand
 * (`hand()`), for `dur` seconds unless something breaks it (`done`). `onEnd` lifts the bind.
 */
export class ChainWrap implements Projectile {
  done = false;
  t = 0;
  /** blows the bound fighter has landed on him: two shake it off */
  shaken = 0;
  private coils: THREE.Mesh[] = [];
  private line: ChainLine;
  private ended = false;
  constructor(private g: Game, readonly owner: Fighter, readonly o: Fighter, readonly dur: number, private hand: () => THREE.Vector3, private onEnd: () => void) {
    const mat = new THREE.MeshStandardMaterial({ color: CHAIN_GREY, roughness: 0.35, metalness: 0.85 });
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(new THREE.TorusGeometry(o.def.radius + 0.08, 0.035, 5, 20), mat);
      g.engine.gr.scene.add(m);
      this.coils.push(m);
    }
    this.line = new ChainLine(g, CHAIN_GREY, 0.022);
  }
  /** the point where the chain meets the coils */
  anchor(out: THREE.Vector3): THREE.Vector3 {
    return this.o.center(out);
  }
  update(dt: number, g: Game): void {
    this.t += dt;
    const o = this.o;
    if (o.dead || this.shaken >= 2) this.t = Math.max(this.t, this.dur);
    this.coils.forEach((m, i) => {
      m.position.set(o.pos.x, o.pos.y + o.def.height * (0.35 + i * 0.18), o.pos.z);
      m.rotation.set(Math.PI / 2 + (i - 1) * 0.3, 0, (i - 1) * 0.25);
    });
    this.line.update(this.hand(), this.anchor(_b), 0.15);
    if (this.t >= this.dur) this.end();
  }
  private end(): void {
    if (this.ended) return;
    this.ended = true;
    this.done = true;
    this.onEnd();
    const c = this.o.center(_a);
    for (let i = 0; i < 10; i++) this.g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: (Math.random() - 0.5) * 6, vy: Math.random() * 4, vz: (Math.random() - 0.5) * 6, size: 0.06, sizeEnd: 0.02, life: 0.4, r: 0.8, g: 0.85, b: 0.9, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2, gravity: -8 });
  }
  dispose(): void {
    this.end();
    for (const m of this.coils) {
      m.removeFromParent();
      m.geometry.dispose();
    }
    (this.coils[0]?.material as THREE.Material | undefined)?.dispose();
    this.line.dispose();
  }
}

// ------------------------------------------------------------------ the novel Bankai

interface Noose {
  o: Fighter;
  line: ChainLine;
  /** 0 → 1 as the chain drops over them */
  k: number;
}

interface Strike {
  at: THREE.Vector3;
  t: number;
  hit: boolean;
  line: ChainLine;
}

/**
 * Fushi no Kōjō: the orb of tangled chains floating over him, the noose from his own neck up into it, nooses it
 * drops over others (`noose`), and chains it rains down (`rain`). The kit does the rules (the life-link).
 */
export class FushiOrb implements Projectile {
  done = false;
  private t = 0;
  private mesh: PropMesh;
  private self: ChainLine;
  readonly nooses: Noose[] = [];
  private strikes: Strike[] = [];
  readonly pos = new THREE.Vector3();
  private fading = -1;
  /** a chain strike lands (the kit deals its damage) */
  onStrike: ((p: THREE.Vector3) => void) | null = null;

  constructor(private g: Game, readonly owner: Fighter, model: VoxelModel, private neck: () => THREE.Vector3) {
    this.mesh = new PropMesh(model);
    this.mesh.frustumCulled = false;
    g.engine.gr.scene.add(this.mesh);
    this.self = new ChainLine(g, '#2A2D33', 0.03);
    this.place(0);
  }

  private place(dt: number): void {
    const f = this.owner;
    const rise = Math.min(1, this.t / 0.6);
    const target = _a.set(f.pos.x, f.pos.y + 1.8 + 1.3 * rise + Math.sin(this.t * 1.3) * 0.12, f.pos.z);
    if (dt <= 0) this.pos.copy(target);
    else this.pos.lerp(target, 1 - Math.exp(-6 * dt));
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.y += dt * 0.6;
    this.mesh.rotation.x = Math.sin(this.t * 0.7) * 0.2;
    const s = this.fading >= 0 ? Math.max(0.01, 1 - this.fading / 0.5) : 0.4 + 0.6 * rise;
    this.mesh.scale.setScalar(s);
  }

  /** the bottom of the orb, where the chains hang from */
  bottom(out: THREE.Vector3): THREE.Vector3 {
    return out.copy(this.pos).setY(this.pos.y - 1.0 * this.mesh.scale.y);
  }

  noose(o: Fighter): void {
    if (this.nooses.some((n) => n.o === o)) return;
    this.nooses.push({ o, line: new ChainLine(this.g, '#2A2D33', 0.026), k: 0 });
    this.g.sfx.play('swingHeavy', o.center(), 0.8);
  }

  unnoose(o: Fighter): void {
    const i = this.nooses.findIndex((n) => n.o === o);
    if (i < 0) return;
    this.nooses[i].line.dispose();
    this.nooses.splice(i, 1);
  }

  /** n chains rain down round a point over `spread` seconds */
  rain(at: THREE.Vector3, n: number, spread: number): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 2.4;
      const p = new THREE.Vector3(at.x + Math.cos(a) * r, at.y, at.z + Math.sin(a) * r);
      const gy = groundAt(this.g, p.x, p.y + 2, p.z, 8);
      if (gy !== null) p.y = gy;
      this.strikes.push({ at: p, t: -(i / n) * spread, hit: false, line: new ChainLine(this.g, '#2A2D33', 0.026) });
    }
  }

  dissolve(): void {
    if (this.fading < 0) this.fading = 0;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.owner.dead && this.fading < 0) this.fading = 0;
    if (this.fading >= 0) {
      this.fading += dt;
      if (this.fading >= 0.5) this.done = true;
    }
    this.place(dt);
    const b = this.bottom(_b).clone();
    // his own noose: from his neck up into the orb
    this.self.update(this.neck(), b, 0.05);
    for (const n of this.nooses) {
      n.k = Math.min(1, n.k + dt * 4);
      const neck = n.o.center(_v).setY(n.o.pos.y + n.o.def.height * 0.86);
      _w.lerpVectors(b, neck, n.k);
      n.line.update(b, _w, 0.1);
      if (n.o.dead) n.k = 0;
    }
    for (const s of this.strikes) {
      s.t += dt;
      if (s.t < 0) continue;
      const k = Math.min(1, s.t / 0.12);
      const top = _w.copy(s.at).setY(s.at.y + 7);
      _v.lerpVectors(top, s.at, k);
      s.line.update(top, _v, 0);
      if (k >= 1 && !s.hit) {
        s.hit = true;
        this.onStrike?.(s.at.clone());
        g.engine.dust.spawn({ x: s.at.x, y: s.at.y + 0.2, z: s.at.z, vy: 1, size: 0.8, sizeEnd: 2, life: 0.6, r: 0.55, g: 0.52, b: 0.48, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
      }
      if (s.t > 0.5) s.line.hide();
    }
    for (let i = this.strikes.length - 1; i >= 0; i--) if (this.strikes[i].t > 0.55) {
      this.strikes[i].line.dispose();
      this.strikes.splice(i, 1);
    }
    // glints in the tangle
    if (Math.random() < 0.2) g.engine.glow.spawn({ x: this.pos.x + (Math.random() - 0.5) * 2, y: this.pos.y + (Math.random() - 0.5) * 2, z: this.pos.z + (Math.random() - 0.5) * 2, size: 0.1, sizeEnd: 0.02, life: 0.4, r: 0.5, g: 0.6, b: 0.55, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.self.dispose();
    for (const n of this.nooses) n.line.dispose();
    for (const s of this.strikes) s.line.dispose();
    this.nooses.length = 0;
    this.strikes.length = 0;
  }
}
