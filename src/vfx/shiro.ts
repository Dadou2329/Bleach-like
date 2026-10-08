// Hollow Ichigo's weapon arts (docs/roster/A1-ichigo.md §2: "Deadly Darts master", "chain-spin"). TetherBlade:
// his sword off the hand on its tether — the white Zangetsu on its black cloth (a flail: flung out and yanked back,
// swung up in a great arc, whirled round him like a lasso) or the white Tensa Zangetsu on its chain (spun round
// the hand, hurled point first to impale, the victim hauled in on the chain). Whatever the blade passes is cut,
// fighters it touches are hit once per pass. Also his Getsuga colours and the corrosion of a caught blade.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import type { VoxelModel } from '../models/builder';
import { PropMesh } from '../game/characterFactory';
import { CapsuleShape, SphereShape } from '../destruction/shapes';
import { groundAt } from './iceArts';
import type { EnergyColors } from './energy';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

/** Shikai Getsuga: white, a red lip (inner world). */
export const GETSUGA_WHITE: EnergyColors = { core: '#FFFFFF', body: '#ECE9EF', rim: '#E01B34' };
/** Bankai Getsuga: bright red (the Visored-training duel). */
export const GETSUGA_RED: EnergyColors = { core: '#FFE1E6', body: '#FF2340', rim: '#8E0A1A' };

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();
const _d = new THREE.Vector3();
const _x = new THREE.Vector3();
const _y = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _qt = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _col = new THREE.Color();
const UP = new THREE.Vector3(0, 1, 0);
const Y = new THREE.Vector3(0, 1, 0);

/** Squared distance between the segments p1–q1 and p2–q2. */
export function segSegDist2(p1: THREE.Vector3, q1: THREE.Vector3, p2: THREE.Vector3, q2: THREE.Vector3): number {
  const d1 = _a.subVectors(q1, p1), d2 = _b.subVectors(q2, p2), r = _c.subVectors(p1, p2);
  const a = d1.dot(d1), e = d2.dot(d2), f = d2.dot(r);
  let s = 0, t = 0;
  if (a <= 1e-9 && e <= 1e-9) return r.lengthSq();
  if (a <= 1e-9) t = Math.max(0, Math.min(1, f / e));
  else {
    const c = d1.dot(r);
    if (e <= 1e-9) s = Math.max(0, Math.min(1, -c / a));
    else {
      const b = d1.dot(d2);
      const den = a * e - b * b;
      s = den > 1e-9 ? Math.max(0, Math.min(1, (b * f - c * e) / den)) : 0;
      t = (b * s + f) / e;
      if (t < 0) {
        t = 0;
        s = Math.max(0, Math.min(1, -c / a));
      } else if (t > 1) {
        t = 1;
        s = Math.max(0, Math.min(1, (b - c) / a));
      }
    }
  }
  _d.copy(p1).addScaledVector(d1, s);
  return _d.sub(_x.copy(p2).addScaledVector(d2, t)).lengthSq();
}

/** Distance from a segment to a fighter's body (its upright capsule axis), minus nothing. */
export function segToFighter(p: THREE.Vector3, q: THREE.Vector3, o: Fighter): number {
  _w.set(o.pos.x, o.pos.y + 0.25, o.pos.z);
  _y.set(o.pos.x, o.pos.y + Math.max(0.3, o.def.height - 0.25), o.pos.z);
  return Math.sqrt(segSegDist2(p, q, _w, _y));
}

// ------------------------------------------------------------------ the tether

interface TetherLine {
  update(from: THREE.Vector3, to: THREE.Vector3, sag: number, t: number): void;
  dispose(): void;
}

/** The black cloth: a flat strip from the hand to the butt of the hilt, fluttering. */
class ClothLine implements TetherLine {
  private mesh: THREE.Mesh;
  private pos: Float32Array;
  private readonly N = 22;
  constructor(g: Game, color: THREE.ColorRepresentation) {
    this.pos = new Float32Array(this.N * 2 * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    const idx: number[] = [];
    for (let i = 0; i < this.N - 1; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    geo.setIndex(idx);
    this.mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.95, side: THREE.DoubleSide }));
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = true;
    g.engine.gr.scene.add(this.mesh);
  }
  update(h: THREE.Vector3, e: THREE.Vector3, sag: number, t: number): void {
    const across = _v.subVectors(e, h).cross(UP);
    if (across.lengthSq() < 1e-8) across.set(1, 0, 0);
    across.normalize();
    const wid = 0.075;
    for (let i = 0; i < this.N; i++) {
      const u = i / (this.N - 1);
      const flutter = Math.sin(t * 15 + u * 9) * 0.07 * Math.sin(u * Math.PI);
      const x = h.x + (e.x - h.x) * u + across.x * flutter;
      const y = h.y + (e.y - h.y) * u - sag * 4 * u * (1 - u);
      const z = h.z + (e.z - h.z) * u + across.z * flutter;
      const tw = Math.sin(u * 7 + t * 6) * wid;
      const k = i * 6;
      this.pos[k] = x - across.x * wid;
      this.pos[k + 1] = y + tw;
      this.pos[k + 2] = z - across.z * wid;
      this.pos[k + 3] = x + across.x * wid;
      this.pos[k + 4] = y - tw;
      this.pos[k + 5] = z + across.z * wid;
    }
    (this.mesh.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();
  }
  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

const MAX_LINKS = 420;
const LINK = 0.07;

/** The chain: oval rings along the line, every other one turned a quarter, as many as the span needs. */
export class ChainLine implements TetherLine {
  private mesh: THREE.InstancedMesh;
  private h = new THREE.Vector3();
  private e = new THREE.Vector3();
  /** link thickness (m): the default fine chain, or a heavier one */
  constructor(g: Game, color: THREE.ColorRepresentation, private thick = 0.024) {
    const geo = new THREE.TorusGeometry(1, 0.28, 5, 10);
    this.mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.85 }), MAX_LINKS);
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = true;
    this.mesh.count = 0;
    g.engine.gr.scene.add(this.mesh);
  }
  /** hide the chain (no links drawn) */
  hide(): void {
    this.mesh.count = 0;
  }
  update(from: THREE.Vector3, to: THREE.Vector3, sag: number): void {
    const h = this.h.copy(from), e = this.e.copy(to);
    const span = h.distanceTo(e);
    const link = LINK * (this.thick / 0.024);
    const n = Math.max(2, Math.min(MAX_LINKS, Math.ceil((span * 1.03) / link)));
    this.mesh.count = n;
    const P = (u: number, out: THREE.Vector3) => out.lerpVectors(h, e, u).setY(h.y + (e.y - h.y) * u - sag * 4 * u * (1 - u));
    for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = (i + 1) / n;
      P(u0, _a);
      P(u1, _b);
      _c.subVectors(_b, _a);
      const len = _c.length() || 1e-4;
      _q.setFromUnitVectors(Y, _c.divideScalar(len));
      if (i % 2) _q.multiply(_qt.setFromAxisAngle(Y, Math.PI / 2));
      _m.compose(_d.addVectors(_a, _b).multiplyScalar(0.5), _q, _s.set(this.thick, Math.max(0.02, len * 0.62), this.thick));
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

// ------------------------------------------------------------------ the blade on its tether

export interface TetherStyle {
  kind: 'cloth' | 'chain';
  color: THREE.ColorRepresentation;
  /** grip → tip (m, along the prop's +Z) */
  length: number;
  /** where the tether ties on (prop +Z, usually negative: the butt) */
  butt: number;
  /** radius of the cut swept along the blade's path (m) */
  cutR: number;
  /** streak colour off the point */
  glow: THREE.ColorRepresentation;
  /** chain link thickness (m) */
  thick?: number;
}

export interface TetherHit {
  damage: number;
  knock: number;
  launch?: number;
  heavy?: boolean;
  /** carve power along the path (0: none) */
  cut: number;
  hitstop?: number;
  /** goes round a guard: parries and catches do not stop it */
  unblockable?: boolean;
}

export interface ThrowOpts {
  speed: number;
  range: number;
  hit: TetherHit;
  /** end over end (the cleaver) or point first (the impaling throw) */
  spin: boolean;
  /** stick in the first fighter it hits and hold them on the tether */
  impale?: boolean;
  /** pass through fighters (else it comes back off the first one it hits) */
  pierce?: boolean;
}

export interface OrbitOpts {
  center: () => THREE.Vector3;
  /** the circle's plane: radial = cos θ · u + sin θ · v */
  u: THREE.Vector3;
  v: THREE.Vector3;
  /** tether length: centre → grip (m) */
  radius: number;
  a0: number;
  a1: number;
  dur: number;
  ease?: (k: number) => number;
  hit: TetherHit;
  /** stay at the end angle (another move takes it from there) instead of coming back */
  hold?: boolean;
}

type Mode = 'hold' | 'throw' | 'return' | 'orbit' | 'stuck' | 'pinned' | 'drag';

/**
 * The sword off the hand on its tether. Starts hidden in the hand ('hold'); throwAt / orbit / reel drive it.
 * `caught` turns true (and the projectile ends) when it is back in the hand.
 */
export class TetherBlade implements Projectile {
  done = false;
  caught = false;
  mode: Mode = 'hold';
  /** the fighter it is stuck in */
  victim: Fighter | null = null;
  /** fighters struck this flight (cleared per orbit turn) */
  readonly struck: Fighter[] = [];
  /** called once per fighter hit (statuses, follow-ups) */
  onHit: ((o: Fighter, impaled: boolean) => void) | null = null;
  readonly grip = new THREE.Vector3();
  readonly axis = new THREE.Vector3(0, 0, 1);
  private edge = new THREE.Vector3(0, -1, 0);
  private mesh: PropMesh;
  private line: TetherLine;
  /** throw: the moving point (the spin pivot, or the point for a point-first throw) */
  private pos = new THREE.Vector3();
  private dir = new THREE.Vector3(0, 0, 1);
  private up = new THREE.Vector3(0, 1, 0);
  private out = 0;
  private spinA = 0;
  private speed = 40;
  private hits = new Set<number>();
  private prevMid = new THREE.Vector3();
  private midInit = false;
  private thr: ThrowOpts | null = null;
  private orb: OrbitOpts | null = null;
  private orbT = 0;
  private turnFrom = 0;
  private modeT = 0;
  private t = 0;
  private whoosh = 0;
  private pinFor = 0.45;
  private hitFx: THREE.Color;
  private butt = new THREE.Vector3();

  constructor(private g: Game, readonly owner: Fighter, model: VoxelModel, private hand: () => THREE.Vector3, readonly style: TetherStyle) {
    this.mesh = new PropMesh(model);
    this.mesh.frustumCulled = false;
    this.mesh.matrixAutoUpdate = false;
    this.mesh.visible = false;
    g.engine.gr.scene.add(this.mesh);
    this.line = style.kind === 'chain' ? new ChainLine(g, style.color, style.thick) : new ClothLine(g, style.color);
    this.grip.copy(hand());
    this.hitFx = new THREE.Color(style.glow);
  }

  /** the point of the blade (world) */
  tip(out = new THREE.Vector3()): THREE.Vector3 {
    return out.copy(this.grip).addScaledVector(this.axis, this.style.length);
  }

  /** the middle of the blade (world) */
  mid(out = new THREE.Vector3()): THREE.Vector3 {
    return out.copy(this.grip).addScaledVector(this.axis, this.style.length * 0.55);
  }

  /** Throw it at a point. */
  throwAt(target: THREE.Vector3, o: ThrowOpts): void {
    this.thr = o;
    this.speed = o.speed;
    this.mode = 'throw';
    this.modeT = 0;
    this.out = 0;
    this.hits.clear();
    const h = this.hand();
    this.dir.subVectors(target, h);
    if (this.dir.lengthSq() < 1e-6) this.owner.forward(this.dir);
    this.dir.normalize();
    // the spin plane: through the throw line, slanted off the vertical
    this.up.copy(UP).addScaledVector(this.dir, -UP.dot(this.dir));
    if (this.up.lengthSq() < 1e-4) this.up.set(1, 0, 0);
    this.up.normalize().applyAxisAngle(this.dir, 0.45);
    this.pos.copy(h).addScaledVector(this.dir, o.spin ? this.style.length * 0.5 : this.style.length * 0.85);
    this.mesh.visible = true;
  }

  /** Swing it round a centre on its tether. */
  orbit(o: OrbitOpts): void {
    this.orb = o;
    this.mode = 'orbit';
    this.orbT = 0;
    this.modeT = 0;
    this.turnFrom = o.a0;
    this.hits.clear();
    this.mesh.visible = true;
  }

  /** Point it somewhere new mid-flight (the tug on the tether); false if it cannot be steered now. */
  redirect(target: THREE.Vector3, extra = 10): boolean {
    if (this.mode !== 'throw' && this.mode !== 'return' && this.mode !== 'stuck') return false;
    this.dir.subVectors(target, this.pos);
    if (this.dir.lengthSq() < 0.5) return false;
    this.dir.normalize();
    this.up.copy(UP).addScaledVector(this.dir, -UP.dot(this.dir));
    if (this.up.lengthSq() < 1e-4) this.up.set(1, 0, 0);
    this.up.normalize().applyAxisAngle(this.dir, 0.45);
    this.mode = 'throw';
    this.modeT = 0;
    this.out = Math.max(0, this.out - extra);
    this.hits.clear();
    this.g.sfx.play('swingHeavy', this.pos, 0.9);
    return true;
  }

  /** Haul it back (dragging whoever it is stuck in). */
  reel(): void {
    if (this.mode === 'pinned') {
      this.mode = 'drag';
      this.modeT = 0;
      return;
    }
    if (this.mode === 'throw' || this.mode === 'stuck' || this.mode === 'orbit' || this.mode === 'hold') this.toReturn();
  }

  private toReturn(): void {
    this.mode = 'return';
    this.modeT = 0;
    this.hits.clear();
    // the moving point: the spin pivot, or near the point for a blade flying straight
    this.pos.copy(this.grip).addScaledVector(this.axis, this.style.length * (this.thr && !this.thr.spin ? 0.85 : 0.5));
  }

  update(dt: number, g: Game): void {
    if (this.owner.dead || !g.fighters.includes(this.owner)) {
      this.done = true;
      return;
    }
    this.t += dt;
    this.modeT += dt;
    const h = this.hand();
    switch (this.mode) {
      case 'hold':
        this.grip.copy(h);
        break;
      case 'throw':
        this.stepThrow(dt, g);
        break;
      case 'return':
        this.stepReturn(dt, g, h);
        break;
      case 'orbit':
        this.stepOrbit(dt, g);
        break;
      case 'stuck':
        if (this.modeT > 0.3) this.toReturn();
        break;
      case 'pinned':
      case 'drag':
        this.stepPinned(dt, g);
        break;
    }
    if (this.done) return;
    this.place();
    // the cut along the path, the streak off the point
    const m = this.mid(_v);
    if (!this.midInit) {
      this.prevMid.copy(m);
      this.midInit = true;
    }
    const moving = this.mode === 'throw' || this.mode === 'return' || this.mode === 'orbit';
    const cut = this.mode === 'orbit' ? this.orb!.hit.cut : this.thr ? this.thr.hit.cut * (this.mode === 'return' ? 0.5 : 1) : 0;
    if (moving && cut > 0 && m.distanceToSquared(this.prevMid) > 1e-4) {
      g.engine.destruction.carve(new CapsuleShape(this.prevMid.clone(), m.clone(), this.style.cutR), { mode: 'cut', power: cut, dir: _w.subVectors(m, this.prevMid).normalize().clone(), sparks: [0.7, 0.85, 1], dust: 0.35 });
    }
    if (moving) {
      const tp = this.tip(_a);
      g.engine.glow.spawn({ x: tp.x, y: tp.y, z: tp.z, size: 0.16, sizeEnd: 0.03, life: 0.2, r: this.hitFx.r, g: this.hitFx.g, b: this.hitFx.b, alpha: 0.75, alphaEnd: 0, tex: TEX_GLOW });
      this.whoosh -= dt;
      if (this.whoosh <= 0) {
        this.whoosh = this.mode === 'orbit' ? 0.16 : 0.12;
        g.sfx.play('swing', tp, 0.45);
      }
    }
    this.prevMid.copy(m);
    // the tether: taut while it whirls, slack as it flies
    const butt = this.butt.copy(this.grip).addScaledVector(this.axis, this.style.butt);
    const span = h.distanceTo(butt);
    const sag = this.mode === 'orbit' ? 0.04 : this.mode === 'hold' ? 0 : Math.min(1.4, span * 0.06) * (this.mode === 'return' ? 1.5 : this.mode === 'stuck' || this.mode === 'pinned' ? 2 : 0.6);
    this.line.update(h, butt, sag, this.t);
  }

  private stepThrow(dt: number, g: Game): void {
    const o = this.thr!;
    const step = o.speed * dt;
    this.pos.addScaledVector(this.dir, step);
    this.out += step;
    this.orient(dt, o.spin);
    // into a wall or the ground: bite in and come back (the point-first blade sticks a moment)
    const tp = this.tip(_a);
    if (this.out > 1.2 && g.engine.world.isSolidAtPos(tp.x, tp.y, tp.z)) {
      g.engine.destruction.carve(new SphereShape(tp.clone(), 1.1, 0.6), { mode: 'cut', power: o.hit.cut, dir: this.dir.clone(), sparks: [0.8, 0.85, 1], dust: 0.5 });
      g.sfx.play('impact', tp, 0.8);
      if (o.spin) this.toReturn();
      else {
        this.mode = 'stuck';
        this.modeT = 0;
      }
      return;
    }
    const o2 = this.sweep(g, o.hit, this.dir, false);
    if (o2) {
      if (o.impale && !o2.def.boss) {
        this.victim = o2;
        this.mode = 'pinned';
        this.modeT = 0;
        this.onHit?.(o2, true);
        g.sfx.play('hitHeavy', o2.center(), 1.2);
        // blood-red sparks out of the back
        const c = o2.center();
        for (let i = 0; i < 18; i++) g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: this.dir.x * 6 + (Math.random() - 0.5) * 3, vy: Math.random() * 3, vz: this.dir.z * 6 + (Math.random() - 0.5) * 3, size: 0.07, sizeEnd: 0.02, life: 0.4, r: 0.95, g: 0.1, b: 0.16, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2, gravity: -9 });
        return;
      }
      this.onHit?.(o2, false);
      if (!o.pierce) {
        this.toReturn();
        return;
      }
    }
    if (this.out >= o.range) this.toReturn();
  }

  private stepReturn(dt: number, g: Game, h: THREE.Vector3): void {
    _v.subVectors(h, this.pos);
    const d = _v.length();
    const step = this.speed * 1.3 * dt;
    if (d <= step + 0.45) {
      this.caught = true;
      this.done = true;
      return;
    }
    this.dir.copy(_v).divideScalar(d).negate();
    this.pos.addScaledVector(_v.divideScalar(d), step);
    this.orient(dt, this.thr?.spin ?? true);
    // coming back it still cuts: half the blow, pulling toward him
    if (this.thr) {
      const back = this.dir.clone().negate();
      this.sweep(g, { ...this.thr.hit, damage: this.thr.hit.damage * 0.5, knock: -Math.abs(this.thr.hit.knock) * 0.5, launch: 0, heavy: false }, back, false);
    }
  }

  /** set grip / axis / edge for a free-flying blade around this.pos */
  private orient(dt: number, spin: boolean): void {
    if (spin) {
      this.spinA += dt * 22;
      const c = Math.cos(this.spinA), s = Math.sin(this.spinA);
      this.axis.copy(this.dir).multiplyScalar(c).addScaledVector(this.up, s);
      this.edge.copy(this.dir).multiplyScalar(-s).addScaledVector(this.up, c);
      this.grip.copy(this.pos).addScaledVector(this.axis, -this.style.length * 0.5);
    } else {
      this.axis.copy(this.dir);
      this.edge.copy(this.up).negate();
      this.grip.copy(this.pos).addScaledVector(this.axis, -this.style.length * 0.85);
    }
  }

  private stepOrbit(dt: number, g: Game): void {
    const o = this.orb!;
    this.orbT += dt;
    const k = Math.min(1, this.orbT / o.dur);
    const a = o.a0 + (o.a1 - o.a0) * (o.ease ? o.ease(k) : k);
    const c = o.center();
    const ca = Math.cos(a), sa = Math.sin(a);
    const sense = Math.sign(o.a1 - o.a0) || 1;
    _a.copy(o.u).multiplyScalar(ca).addScaledVector(o.v, sa).normalize();
    this.axis.copy(_a);
    this.edge.copy(o.u).multiplyScalar(-sa * sense).addScaledVector(o.v, ca * sense).normalize();
    this.grip.copy(c).addScaledVector(this.axis, o.radius);
    // every full turn it may hit the same fighter again
    if (Math.abs(a - this.turnFrom) >= Math.PI * 2 - 0.05) {
      this.turnFrom = a;
      this.hits.clear();
    }
    const hit = this.sweep(g, o.hit, this.edge, true);
    if (hit) this.onHit?.(hit, false);
    if (k >= 1) {
      if (o.hold) this.mode = 'hold';
      else this.toReturn();
    }
  }

  private stepPinned(dt: number, g: Game): void {
    const v = this.victim;
    if (!v || v.dead || !g.fighters.includes(v)) {
      this.victim = null;
      this.toReturn();
      return;
    }
    // through the body, the point out the back
    const c = v.center(_c);
    this.axis.copy(this.dir);
    this.edge.copy(this.up).negate();
    this.grip.copy(c).addScaledVector(this.axis, -this.style.length * 0.45);
    v.hitstun = Math.max(v.hitstun, 0.25);
    v.body.vel.x = 0;
    v.body.vel.z = 0;
    if (this.mode === 'pinned') {
      if (this.modeT >= this.pinFor) {
        this.mode = 'drag';
        this.modeT = 0;
      }
      return;
    }
    // hauled in on the chain to a step in front of him
    const o = this.owner;
    const dx = o.pos.x - v.pos.x, dz = o.pos.z - v.pos.z;
    const d = Math.hypot(dx, dz);
    if (d < 2.2 || this.modeT > 1.4) {
      // the blade tears free
      g.damage(v, 12, o, _w.set(-dx, 0, -dz).normalize().clone(), { knock: 0, hitstop: 0.06 });
      v.hitstun = Math.max(v.hitstun, 0.45);
      v.push.set(0, 0, 0);
      this.victim = null;
      this.toReturn();
      return;
    }
    const step = Math.min(d - 2, 24 * dt);
    v.body.pos.x += (dx / d) * step;
    v.body.pos.z += (dz / d) * step;
    const gy = groundAt(g, v.body.pos.x, v.body.pos.y + 1, v.body.pos.z, 4);
    if (gy !== null) v.body.pos.y = Math.max(v.body.pos.y, gy);
    // dust kicked up along the way
    if (Math.random() < 0.5) g.engine.dust.spawn({ x: v.pos.x, y: v.pos.y + 0.1, z: v.pos.z, vx: (Math.random() - 0.5) * 2, vy: 1, vz: (Math.random() - 0.5) * 2, size: 0.4, sizeEnd: 1.2, life: 0.6, r: 0.55, g: 0.5, b: 0.45, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 1.5 });
  }

  /** the blade (grip → tip) against the owner's enemies; returns the first new fighter it hit */
  private sweep(g: Game, hit: TetherHit, dir: THREE.Vector3, orbit: boolean): Fighter | null {
    const tp = this.tip(_d.clone());
    const gp = this.grip.clone();
    let first: Fighter | null = null;
    for (const o of g.enemiesOf(this.owner)) {
      if (o.dead || this.hits.has(o.id)) continue;
      if (segToFighter(gp, tp, o) > o.def.radius + (orbit ? 0.3 : 0.22)) continue;
      this.hits.add(o.id);
      this.struck.push(o);
      const k = _v.copy(dir).setY(0);
      if (k.lengthSq() < 1e-4) k.subVectors(o.pos, this.owner.pos).setY(0);
      k.normalize();
      g.damage(o, hit.damage, this.owner, k.clone(), { knock: hit.knock, launch: hit.launch, heavy: hit.heavy, hitstop: hit.hitstop ?? 0.07, shake: hit.heavy ? 0.35 : 0.2, unblockable: hit.unblockable });
      _col.copy(this.hitFx);
      g.sparks(o.center(), k, `#${_col.getHexString()}`, 12);
      if (!first) first = o;
      if (this.mode === 'throw' && this.thr?.impale) break;
    }
    return first;
  }

  /** the prop's world matrix from grip / axis / edge (+Z along the blade, the edge toward −Y) */
  private place(): void {
    const z = _a.copy(this.axis).normalize();
    const yv = _b.copy(this.edge).addScaledVector(z, -this.edge.dot(z));
    if (yv.lengthSq() < 1e-6) yv.copy(UP).addScaledVector(z, -UP.dot(z));
    if (yv.lengthSq() < 1e-6) yv.set(1, 0, 0);
    yv.normalize().negate();
    const xv = _c.crossVectors(yv, z).normalize();
    _m.makeBasis(xv, yv, z).setPosition(this.grip);
    this.mesh.matrix.copy(_m);
    this.mesh.matrixWorldNeedsUpdate = true;
    this.mesh.visible = this.mode !== 'hold';
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.line.dispose();
  }
}

/**
 * The caught blade corrodes: from the fist up the steel it turns white and crumbles (inner-world duel). White
 * motes crawl along the blade from base to tip, then the grey dust of it falls.
 */
export class Corrosion implements Projectile {
  done = false;
  private t = 0;
  constructor(private victim: Fighter, private dur = 0.6) {}
  update(dt: number, g: Game): void {
    this.t += dt;
    const v = this.victim;
    if (this.t >= this.dur || v.dead) {
      this.done = true;
      return;
    }
    const k = this.t / this.dur;
    const a = v.bladeValid ? v.blade.base : v.center(_a);
    const b = v.bladeValid ? v.blade.tip : _b.copy(a).setY(a.y + 0.6);
    for (let i = 0; i < 4; i++) {
      const u = Math.random() * k;
      const x = a.x + (b.x - a.x) * u, y = a.y + (b.y - a.y) * u, z = a.z + (b.z - a.z) * u;
      g.engine.glow.spawn({ x, y, z, vx: (Math.random() - 0.5) * 0.5, vy: 0.4, vz: (Math.random() - 0.5) * 0.5, size: 0.06, sizeEnd: 0.02, life: 0.35, r: 0.95, g: 0.95, b: 0.93, alpha: 1, alphaEnd: 0.4, tex: TEX_GLOW, drag: 1 });
      if (Math.random() < 0.4) g.engine.dust.spawn({ x, y, z, vx: (Math.random() - 0.5) * 0.6, vy: -0.5, vz: (Math.random() - 0.5) * 0.6, size: 0.08, sizeEnd: 0.03, life: 0.9, r: 0.82, g: 0.82, b: 0.8, alpha: 0.9, alphaEnd: 0, tex: TEX_PUFF, gravity: -6, drag: 0.5 });
    }
  }
  dispose(): void {}
}
