// Pernida Parnkgjas's effects (docs/kits/pernida.md): the nerves — dark sinew tubes with pale threads, rebuilt along a
// moving path each frame (`NerveLine`, a `VineMesh` in the nerve look) — strung from the fingers into a victim, laid
// in a lance or thrown out in every direction (`NerveLance`, `NerveStorm`); the nerve-tethered arrows that steer and
// circle back (`NerveArrow`); stone left hands raised out of the ground or a wall (`StoneHands`, `WallHand`); the iron
// chains between the giant hand's fingertips (`FingerChains`); the cloak torn to rags (`shredBurst`); flesh spatter
// (`fleshBurst`); a severed finger falling and swelling into a clone (`FingerSeed`).
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { CapsuleShape, SphereShape } from '../destruction/shapes';
import { raycastVoxels } from '../voxel/raycast';
import { PropMesh } from '../game/characterFactory';
import { pernidaProp } from '../chars/pernida';
import { VineMesh, type VineLook } from './kujaku';
import { groundAt } from './iceArts';
import { TEX_GLOW, TEX_PUFF, TEX_RING, TEX_STREAK } from './sprites';

/** dark sinew, a pale thread every few rings; reddening while it holds someone */
export const NERVE_LOOK: VineLook = {
  a: new THREE.Color('#3E3039'),
  b: new THREE.Color('#2E252C'),
  ring: new THREE.Color('#E8D0C8'),
  emissive: '#120A10',
  hold: new THREE.Color('#5E2230'),
  holdRing: new THREE.Color('#F2C84B'),
  wither: new THREE.Color('#1E181C'),
};

const UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _d = new THREE.Vector3();
const _s = new THREE.Vector3();
const _n = new THREE.Vector3();

/** distance from p to the segment ab */
export function segDist(p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3): number {
  _d.subVectors(b, a);
  const l2 = _d.lengthSq();
  const t = l2 < 1e-9 ? 0 : Math.max(0, Math.min(1, _w.subVectors(p, a).dot(_d) / l2));
  return _v.copy(a).addScaledVector(_d, t).distanceTo(p);
}

/** does the segment ab pass within r of the fighter's body (its upright capsule)? */
export function segHits(f: Fighter, a: THREE.Vector3, b: THREE.Vector3, r: number): boolean {
  const lo = f.pos.y + Math.min(0.3, f.def.height * 0.2), hi = f.pos.y + f.def.height - Math.min(0.3, f.def.height * 0.2);
  for (let k = 0; k <= 4; k++) {
    const p = _s.set(f.pos.x, lo + ((hi - lo) * k) / 4, f.pos.z);
    if (segDist(p, a, b) <= r + f.def.radius) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------------------------- one nerve

/** A nerve laid from a to b (out to a fraction `ext` of the way), sagging and writhing. */
export class NerveLine {
  readonly vine: VineMesh;
  private pts: THREE.Vector3[];
  private seed = Math.random() * 10;
  constructor(scene: THREE.Object3D, r0 = 0.06, r1 = 0.025, segs = 14) {
    this.vine = new VineMesh(scene, segs, 5, r0, r1, NERVE_LOOK);
    this.pts = Array.from({ length: segs + 1 }, () => new THREE.Vector3());
  }
  lay(a: THREE.Vector3, b: THREE.Vector3, ext: number, time: number, o: { sag?: number; wiggle?: number; freq?: number } = {}): void {
    const n = this.pts.length - 1;
    const d = _d.subVectors(b, a);
    const len = d.length();
    const side = _s.crossVectors(d, UP);
    if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
    side.normalize();
    const up = _n.crossVectors(side, d).normalize();
    const sag = o.sag ?? 0.05 * len, wig = o.wiggle ?? 0.1, fq = o.freq ?? 2.5;
    const e = Math.max(0.001, Math.min(1, ext));
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * e;
      const env = 4 * t * (1 - t);
      const s = Math.sin(t * fq * Math.PI * 2 + time * 7 + this.seed) * wig * env;
      const c = Math.cos(t * fq * 5.3 + time * 5 + this.seed * 1.3) * wig * env;
      this.pts[i].copy(a).addScaledVector(d, t).addScaledVector(side, s).addScaledVector(up, c - sag * env);
    }
    this.vine.setPath(this.pts);
    this.vine.visible = ext > 0.001;
  }
  /** lay it along given points (resampled) */
  along(path: THREE.Vector3[]): void {
    const n = this.pts.length - 1;
    for (let i = 0; i <= n; i++) {
      const u = (i / n) * (path.length - 1);
      const k = Math.min(path.length - 2, Math.floor(u));
      this.pts[i].lerpVectors(path[k], path[k + 1], u - k);
    }
    this.vine.setPath(this.pts);
    this.vine.visible = true;
  }
  set tint(v: number) {
    this.vine.tint = v;
  }
  dispose(): void {
    this.vine.dispose();
  }
}

// ---------------------------------------------------------------------------------------------- the lance and the storm

interface NerveOpts {
  damage: number;
  /** the nerve's reach for hitting a body (m) */
  r: number;
  /** what one nerve does to the ground and walls where it ends (bore radius, m; 0 = nothing) */
  bore: number;
  /** called once per body a nerve hits */
  onHit?: (e: Fighter) => void;
}

/** A bundle of nerves driven straight ahead through whatever is in the way: out in 0.25 s, held, drawn back. */
export class NerveLance implements Projectile {
  done = false;
  private lines: NerveLine[] = [];
  private offs: THREE.Vector3[] = [];
  private t = 0;
  private struck = false;
  private end = new THREE.Vector3();
  constructor(private g: Game, readonly owner: Fighter, private from: () => THREE.Vector3, readonly dir: THREE.Vector3, readonly range: number, readonly o: NerveOpts, n = 5, scale = 1) {
    this.dir.normalize();
    for (let i = 0; i < n; i++) {
      this.lines.push(new NerveLine(g.engine.gr.scene, 0.07 * scale, 0.03 * scale, 18));
      const a = (i / n) * Math.PI * 2;
      this.offs.push(new THREE.Vector3(Math.cos(a), Math.sin(a), 0).multiplyScalar(0.18 * scale));
    }
    g.sfx.play('swing', from(), 1.3);
  }
  update(dt: number, g: Game): void {
    this.t += dt;
    const ext = this.t < 0.25 ? this.t / 0.25 : this.t < 0.5 ? 1 : Math.max(0, 1 - (this.t - 0.5) / 0.3);
    const a = this.from();
    this.end.copy(a).addScaledVector(this.dir, this.range);
    // the bundle twists round itself on the way out
    const side = _s.crossVectors(this.dir, UP);
    if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
    side.normalize();
    const up = _n.crossVectors(side, this.dir).normalize();
    this.lines.forEach((l, i) => {
      const o = this.offs[i];
      const b = _w.copy(this.end).addScaledVector(side, o.x * 2.4).addScaledVector(up, o.y * 2.4);
      l.lay(a.clone().addScaledVector(side, o.x).addScaledVector(up, o.y), b, ext, g.time, { sag: 0.15, wiggle: 0.14, freq: 3 });
    });
    if (!this.struck && this.t >= 0.25) {
      this.struck = true;
      const b = this.end.clone();
      if (this.o.bore > 0) g.engine.destruction.carve(new CapsuleShape(a.clone().addScaledVector(this.dir, 1), b, this.o.bore), { mode: 'bore', power: 1600, impulse: 4, dust: 0.4 });
      for (const e of g.enemiesOf(this.owner)) {
        if (e.dead || !segHits(e, a, b, this.o.r)) continue;
        g.damage(e, this.o.damage, this.owner, this.dir.clone().setY(0).normalize(), { energy: true, knock: 9, launch: 2, heavy: true, hitstop: 0.08, shake: 0.3, color: '#E8D0C8' });
        this.o.onHit?.(e);
      }
    }
    if (this.t > 0.8) this.done = true;
  }
  dispose(): void {
    for (const l of this.lines) l.dispose();
  }
}

/** Thick nerves fired in every direction: they rip furrows in the ground and punch through walls, then draw back. */
export class NerveStorm implements Projectile {
  done = false;
  private lines: { l: NerveLine; end: THREE.Vector3; ground: boolean }[] = [];
  private t = 0;
  private struck = false;
  constructor(private g: Game, readonly owner: Fighter, private from: () => THREE.Vector3, n: number, readonly range: number, readonly o: NerveOpts, scale = 1) {
    const a = from();
    const w = g.engine.world;
    // from high up (a palm 10 m in the air) they have to come down to reach anyone
    const h = Math.max(0.5, a.y - (groundAt(g, a.x, a.y, a.z, 40) ?? a.y - 1.5));
    const elLow = -Math.atan(h / (range * 0.22)), elHigh = 0.25;
    for (let i = 0; i < n; i++) {
      const az = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const el = elLow + Math.random() * (elHigh - elLow) * (i % 3 === 0 ? 1 : 0.45);
      const d = new THREE.Vector3(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el));
      const hit = raycastVoxels(w, a.x, a.y, a.z, d.x, d.y, d.z, range);
      const len = hit ? hit.dist + 0.6 : range * (0.75 + Math.random() * 0.25);
      this.lines.push({ l: new NerveLine(g.engine.gr.scene, 0.1 * scale, 0.04 * scale, 16), end: a.clone().addScaledVector(d, len), ground: !!hit && hit.ny > 0.5 });
    }
    g.sfx.play('swingHeavy', a, 1.4);
  }
  update(dt: number, g: Game): void {
    this.t += dt;
    const ext = this.t < 0.3 ? this.t / 0.3 : this.t < 0.75 ? 1 : Math.max(0, 1 - (this.t - 0.75) / 0.4);
    const a = this.from();
    for (const s of this.lines) s.l.lay(a, s.end, ext, g.time, { sag: 0.3, wiggle: 0.22, freq: 2 });
    if (!this.struck && this.t >= 0.3) {
      this.struck = true;
      const hits = new Map<number, number>();
      for (const s of this.lines) {
        if (this.o.bore > 0) {
          // where it ends: a hole punched in a wall, or a furrow torn along the ground
          if (s.ground) {
            const back = a.clone().lerp(s.end, 0.72);
            g.engine.destruction.carve(new CapsuleShape(back, s.end.clone(), this.o.bore), { mode: 'smash', power: 900, impulse: 6, dust: 0.6 });
          } else g.engine.destruction.carve(new SphereShape(s.end.clone(), this.o.bore * 1.4), { mode: 'bore', power: 1400, impulse: 5, dust: 0.4 });
        }
        for (const e of g.enemiesOf(this.owner)) {
          if (e.dead || (hits.get(e.id) ?? 0) >= 3 || !segHits(e, a, s.end, this.o.r)) continue;
          hits.set(e.id, (hits.get(e.id) ?? 0) + 1);
          g.damage(e, this.o.damage, this.owner, _v.subVectors(e.pos, a).setY(0).normalize().clone(), { energy: true, knock: 8, launch: 2, heavy: (hits.get(e.id) ?? 0) >= 2, hitstop: 0.05, shake: 0.25, color: '#E8D0C8' });
          this.o.onHit?.(e);
        }
      }
      g.engine.glow.spawn({ x: a.x, y: a.y, z: a.z, size: 1, sizeEnd: this.range * 0.5, life: 0.3, r: 1, g: 0.86, b: 0.6, alpha: 0.5, alphaEnd: 0, tex: TEX_RING });
      if (g.player && g.player.pos.distanceTo(a) < this.range * 1.5) g.shake(0.4);
    }
    if (this.t > 1.2) this.done = true;
  }
  dispose(): void {
    for (const s of this.lines) s.l.dispose();
  }
}

// ---------------------------------------------------------------------------------------------- the arrows

let arrowGeo: THREE.BufferGeometry | null = null;
function arrowGeometry(): THREE.BufferGeometry {
  if (arrowGeo) return arrowGeo;
  const shaft = new THREE.CylinderGeometry(0.035, 0.03, 1.5, 6, 1, true);
  shaft.translate(0, -0.75, 0);
  const head = new THREE.ConeGeometry(0.11, 0.42, 4);
  head.translate(0, 0.21, 0);
  const fin = new THREE.ConeGeometry(0.1, 0.4, 3);
  fin.translate(0, -1.3, 0);
  const pos: number[] = [];
  for (const gg of [shaft.toNonIndexed(), head.toNonIndexed(), fin.toNonIndexed()]) pos.push(...(gg.attributes.position.array as Float32Array));
  arrowGeo = new THREE.BufferGeometry();
  arrowGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  arrowGeo.rotateX(Math.PI / 2);
  return arrowGeo;
}

export interface ArrowOpts {
  damage: number;
  /** visual scale */
  size: number;
  /** bore radius through the world (m) */
  bore: number;
  speed?: number;
  /** homing turn rate (rad/s) */
  turn?: number;
  range?: number;
  onHit?: (e: Fighter) => void;
}

/**
 * Heilig Pfeil on a nerve: a long arrow of pale gold light trailing a nerve from its fletching. It steers after its
 * target; one that overshoots is turned back round once by the nerves laid through the ground. It tunnels through
 * walls (a big one takes a tower down) and goes on through the bodies it strikes.
 */
export class NerveArrow implements Projectile {
  done = false;
  readonly pos: THREE.Vector3;
  readonly dir: THREE.Vector3;
  private mesh: THREE.Mesh;
  private tail: NerveLine;
  private hist: THREE.Vector3[] = [];
  private travelled = 0;
  private turnT = 0;
  private turned = false;
  private carveAcc = 0;
  private hit = new Set<number>();
  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, dir: THREE.Vector3, private target: Fighter | null, readonly o: ArrowOpts) {
    this.pos = from.clone();
    this.dir = dir.clone().normalize();
    this.mesh = new THREE.Mesh(arrowGeometry(), new THREE.MeshBasicMaterial({ color: new THREE.Color('#F3E7B0').multiplyScalar(2.2), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.mesh.scale.setScalar(o.size);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 7;
    g.engine.gr.scene.add(this.mesh);
    this.tail = new NerveLine(g.engine.gr.scene, 0.05 * o.size, 0.015 * o.size, 12);
    for (let i = 0; i < 10; i++) this.hist.push(this.pos.clone());
    g.sfx.play('arrow', from, 1 + o.size * 0.15);
  }
  update(dt: number, g: Game): void {
    const o = this.o;
    const t = this.target;
    // steering: toward the target at the turn rate; overshot, the ground's nerves turn it round once
    if (t && !t.dead) {
      const want = _v.subVectors(t.center(), this.pos);
      const dist = want.length();
      want.normalize();
      const cos = want.dot(this.dir);
      if (!this.turned && cos < -0.1 && dist > 4) {
        this.turned = true;
        this.turnT = 1.1;
      }
      const rate = (o.turn ?? 1.6) * (this.turnT > 0 ? 3.2 : 1) * dt;
      const ang = Math.acos(Math.max(-1, Math.min(1, cos)));
      if (ang > 1e-4) this.dir.lerp(want, Math.min(1, rate / ang)).normalize();
    }
    this.turnT = Math.max(0, this.turnT - dt);
    const step = (o.speed ?? 70) * dt;
    const from = this.pos.clone();
    this.pos.addScaledVector(this.dir, step);
    this.travelled += step;
    this.mesh.position.copy(this.pos);
    this.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), this.dir);
    // the tunnel behind it
    this.carveAcc += step;
    if (o.bore > 0 && this.carveAcc > o.bore * 1.2) {
      this.carveAcc = 0;
      g.engine.destruction.carve(new CapsuleShape(from.clone().addScaledVector(this.dir, -o.bore), this.pos.clone(), o.bore), { mode: 'bore', power: 900 + 1400 * o.bore, impulse: 5, dust: 0.3 });
    }
    for (const e of g.enemiesOf(this.owner)) {
      if (e.dead || this.hit.has(e.id) || !segHits(e, from, this.pos, 0.25 * o.size + o.bore * 0.4)) continue;
      this.hit.add(e.id);
      g.damage(e, o.damage, this.owner, this.dir.clone().setY(0).normalize(), { energy: true, knock: 12, launch: 3, heavy: true, hitstop: 0.09, shake: 0.35, color: '#F3E7B0' });
      o.onHit?.(e);
      g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, size: 0.6 * o.size, sizeEnd: 2.2 * o.size, life: 0.3, r: 1, g: 0.92, b: 0.7, alpha: 0.9, alphaEnd: 0, tex: TEX_RING });
    }
    // the nerve trailing from the fletching
    this.hist.pop();
    this.hist.unshift(this.pos.clone().addScaledVector(this.dir, -1.4 * o.size));
    this.tail.along(this.hist);
    if (Math.random() < 0.6) g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, vx: -this.dir.x * 4, vy: -this.dir.y * 4, vz: -this.dir.z * 4, size: 0.35 * o.size, sizeEnd: 0.05, life: 0.25, r: 1, g: 0.9, b: 0.62, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
    if (this.travelled > (o.range ?? 90)) this.done = true;
  }
  dispose(): void {
    this.mesh.removeFromParent();
    (this.mesh.material as THREE.Material).dispose();
    this.tail.dispose();
  }
}

// ---------------------------------------------------------------------------------------------- stone hands

/**
 * Two stone left hands rise out of the ground on either side of a point, palms in, and clap shut on whatever stands
 * between them; then they crumble. `scale` 1 = 4 m hands.
 */
export class StoneHands implements Projectile {
  done = false;
  private hands: { mesh: PropMesh; base: THREE.Vector3; yaw: number; tilt: number }[] = [];
  private t = 0;
  private clapped = false;
  private gy: number;
  constructor(private g: Game, readonly owner: Fighter, readonly center: THREE.Vector3, axis: THREE.Vector3, readonly scale: number, readonly damage: number, readonly gap: number, readonly onHit?: (e: Fighter) => void) {
    this.gy = groundAt(g, center.x, center.y + 2, center.z, 10) ?? center.y;
    const ax = axis.clone().setY(0);
    if (ax.lengthSq() < 1e-6) ax.set(0, 0, 1);
    ax.normalize();
    const side = new THREE.Vector3(-ax.z, 0, ax.x);
    for (const s of [1, -1]) {
      const base = new THREE.Vector3(center.x + side.x * gap * s, this.gy, center.z + side.z * gap * s);
      const mesh = new PropMesh(pernidaProp('stone-hand'));
      mesh.scale.setScalar(scale);
      // the palm (+Z) toward the middle
      const yaw = Math.atan2(-side.x * s, -side.z * s);
      mesh.rotation.set(0, yaw, 0);
      g.engine.gr.scene.add(mesh);
      this.hands.push({ mesh, base, yaw, tilt: 0 });
      g.engine.destruction.carve(new SphereShape(base.clone(), 1.3 * scale, 0.6), { mode: 'smash', power: 700, impulse: 7, dust: 0.8 });
    }
    g.sfx.play('crumble', center, 1.3);
  }
  update(dt: number, g: Game): void {
    this.t += dt;
    const H = 4 * this.scale;
    const rise = Math.min(1, this.t / 0.5);
    const lift = 1 - Math.pow(1 - rise, 3);
    const clapK = this.t < 0.72 ? 0 : Math.min(1, (this.t - 0.72) / 0.13);
    for (const h of this.hands) {
      h.mesh.position.set(h.base.x, this.gy - H * (1 - lift) - 0.4 * this.scale, h.base.z);
      // the clap: each hand pitches in about its wrist
      h.mesh.rotation.set(0, h.yaw, 0);
      h.mesh.rotateX(-0.62 * clapK * clapK);
      if (this.t < 0.5 && Math.random() < 0.5) g.engine.dust.spawn({ x: h.base.x + (Math.random() - 0.5) * 2 * this.scale, y: this.gy + 0.2, z: h.base.z + (Math.random() - 0.5) * 2 * this.scale, vx: 0, vy: 2, vz: 0, size: 0.8 * this.scale, sizeEnd: 2 * this.scale, life: 0.8, r: 0.6, g: 0.57, b: 0.52, alpha: 0.6, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
    }
    if (!this.clapped && this.t >= 0.85) {
      this.clapped = true;
      const c = new THREE.Vector3(this.center.x, this.gy + H * 0.45, this.center.z);
      g.sfx.play('impact', c, 1.6);
      if (g.player && g.player.pos.distanceTo(c) < 40) g.shake(0.6);
      for (let i = 0; i < 18; i++) {
        const a = Math.random() * Math.PI * 2;
        g.engine.dust.spawn({ x: c.x, y: c.y, z: c.z, vx: Math.cos(a) * 6, vy: (Math.random() - 0.3) * 4, vz: Math.sin(a) * 6, size: 0.8 * this.scale, sizeEnd: 2.4 * this.scale, life: 0.9, r: 0.62, g: 0.58, b: 0.53, alpha: 0.65, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
      }
      for (const e of g.enemiesOf(this.owner)) {
        if (e.dead) continue;
        const d = Math.hypot(e.pos.x - this.center.x, e.pos.z - this.center.z);
        if (d > this.gap * 0.85 + e.def.radius || e.pos.y > this.gy + H) continue;
        g.damage(e, this.damage, this.owner, UP.clone(), { knock: 2, launch: 7, heavy: true, hitstop: 0.14, shake: 0.6, color: '#A9A39A' });
        e.hitstun = Math.max(e.hitstun, 0.7);
        this.onHit?.(e);
      }
    }
    // crumbling away
    if (this.t > 1.55) {
      const k = Math.min(1, (this.t - 1.55) / 0.45);
      for (const h of this.hands) {
        h.mesh.material.userData.uniforms.uDissolve.value = k;
        if (Math.random() < 0.6) g.engine.dust.spawn({ x: h.mesh.position.x + (Math.random() - 0.5) * 2 * this.scale, y: this.gy + Math.random() * H * 0.7, z: h.mesh.position.z + (Math.random() - 0.5) * 2 * this.scale, vx: 0, vy: -1, vz: 0, size: 0.6 * this.scale, sizeEnd: 1.4 * this.scale, life: 0.7, r: 0.58, g: 0.55, b: 0.5, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF });
      }
    }
    if (this.t > 2.0) this.done = true;
  }
  dispose(): void {
    for (const h of this.hands) {
      h.mesh.removeFromParent();
      h.mesh.material.dispose();
    }
  }
}

/**
 * A stone hand climbing out of a building's wall at a target: the wall bursts where the wrist comes through, the hand
 * reaches along the wall's normal, then slams down on the spot.
 */
export class WallHand implements Projectile {
  done = false;
  private mesh: PropMesh;
  private t = 0;
  private struck = false;
  private quat = new THREE.Quaternion();
  constructor(private g: Game, readonly owner: Fighter, readonly at: THREE.Vector3, readonly normal: THREE.Vector3, readonly aim: THREE.Vector3, readonly scale: number, readonly damage: number, readonly onHit?: (e: Fighter) => void) {
    this.mesh = new PropMesh(pernidaProp('stone-hand'));
    this.mesh.scale.setScalar(scale);
    g.engine.gr.scene.add(this.mesh);
    // the hand's up (+Y, wrist → fingers) along the reach; its palm (+Z) toward the ground
    const y = aim.clone().sub(at).normalize();
    const z = new THREE.Vector3(0, -1, 0).addScaledVector(y, y.y).normalize();
    const x = new THREE.Vector3().crossVectors(y, z).normalize();
    z.crossVectors(x, y).normalize();
    this.quat.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
    g.engine.destruction.carve(new SphereShape(at.clone(), 1.5 * scale, 1), { mode: 'smash', power: 900, impulse: 9, dust: 0.9 });
    g.sfx.play('crumble', at, 1.4);
  }
  update(dt: number, g: Game): void {
    this.t += dt;
    const reach = Math.min(1, this.t / 0.45);
    const out = (1 - Math.pow(1 - reach, 3)) * Math.min(this.aim.distanceTo(this.at) * 0.55, 4 * this.scale);
    const dir = _v.subVectors(this.aim, this.at).normalize();
    this.mesh.position.copy(this.at).addScaledVector(dir, out - 3.2 * this.scale);
    this.mesh.quaternion.copy(this.quat);
    // the slam: the hand pitches down onto the spot
    const slam = this.t < 0.55 ? 0 : Math.min(1, (this.t - 0.55) / 0.14);
    this.mesh.rotateX(0.9 * slam * slam);
    if (!this.struck && this.t >= 0.69) {
      this.struck = true;
      const p = this.aim.clone();
      g.groundImpact(p, 2.2 * this.scale, 600, '#A9A39A', this.owner);
      for (const e of g.enemiesOf(this.owner)) {
        if (e.dead || Math.hypot(e.pos.x - p.x, e.pos.z - p.z) > 2.6 * this.scale + e.def.radius || Math.abs(e.pos.y - p.y) > 4 * this.scale) continue;
        g.damage(e, this.damage, this.owner, _w.subVectors(e.pos, this.at).setY(0).normalize().clone(), { knock: 14, launch: 4, heavy: true, hitstop: 0.12, shake: 0.5, color: '#A9A39A' });
        this.onHit?.(e);
      }
    }
    if (this.t > 1.3) this.mesh.material.userData.uniforms.uDissolve.value = Math.min(1, (this.t - 1.3) / 0.4);
    if (this.t > 1.75) this.done = true;
  }
  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.material.dispose();
  }
}

// ---------------------------------------------------------------------------------------------- the chains

const SPANS: [string, string][] = [['band.thumb', 'band.index'], ['band.index', 'band.middle'], ['band.middle', 'band.ring'], ['band.ring', 'band.pinky']];

/** The iron chains strung between the giant hand's fingertip bands, a link at a time along a sagging curve. */
export class FingerChains {
  private mesh: THREE.InstancedMesh;
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private sc = new THREE.Vector3();
  private readonly per = 7;
  constructor(scene: THREE.Object3D, private f: Fighter, private size = 1) {
    const geo = new THREE.TorusGeometry(0.09, 0.028, 4, 8);
    const mat = new THREE.MeshStandardMaterial({ color: '#55555C', roughness: 0.45, metalness: 0.8 });
    this.mesh = new THREE.InstancedMesh(geo, mat, SPANS.length * this.per);
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = true;
    scene.add(this.mesh);
  }
  private sock(name: string, out: THREE.Vector3): THREE.Vector3 | null {
    const s = this.f.visual.rig.sockets.get(name);
    if (!s) return null;
    s.updateWorldMatrix(true, false);
    return s.getWorldPosition(out);
  }
  update(): void {
    let i = 0;
    const a = new THREE.Vector3(), b = new THREE.Vector3(), p = new THREE.Vector3(), d = new THREE.Vector3();
    for (const [na, nb] of SPANS) {
      if (!this.sock(na, a) || !this.sock(nb, b)) {
        for (let k = 0; k < this.per; k++) this.mesh.setMatrixAt(i++, this.m.makeScale(0, 0, 0));
        continue;
      }
      const len = a.distanceTo(b);
      const sag = Math.max(0.1, len * 0.35) * this.size;
      d.subVectors(b, a).normalize();
      for (let k = 0; k < this.per; k++) {
        const t = (k + 0.5) / this.per;
        p.lerpVectors(a, b, t);
        p.y -= sag * 4 * t * (1 - t);
        // links alternate a quarter turn about the chain's line
        this.q.setFromUnitVectors(new THREE.Vector3(1, 0, 0), d);
        if (k % 2) this.q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2));
        const s = this.size * Math.min(1.4, Math.max(0.6, len / (this.per * 0.16)));
        this.mesh.setMatrixAt(i++, this.m.compose(p, this.q, this.sc.set(s, this.size, this.size)));
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
  set visible(v: boolean) {
    this.mesh.visible = v;
  }
  /** the chains snap: iron sparks and links flung off every span */
  snap(g: Game): void {
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    for (const [na, nb] of SPANS) {
      if (!this.sock(na, a) || !this.sock(nb, b)) continue;
      const c = a.lerp(b, 0.5);
      g.sparks(c, UP, '#FFE9B0', 14);
      for (let k = 0; k < 6; k++) g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: (Math.random() - 0.5) * 10, vy: 3 + Math.random() * 6, vz: (Math.random() - 0.5) * 10, size: 0.12, sizeEnd: 0.04, life: 0.6, r: 0.5, g: 0.5, b: 0.55, alpha: 1, alphaEnd: 0.2, gravity: -16, tex: TEX_GLOW });
    }
    g.sfx.play('shatter', this.f.center(), 1.2);
  }
  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

// ---------------------------------------------------------------------------------------------- bursts

/** The cloak torn to rags from inside: white scraps whirling out and settling, a puff of dust. */
export function shredBurst(g: Game, at: THREE.Vector3, h = 1.5): void {
  for (let i = 0; i < 46; i++) {
    const a = Math.random() * Math.PI * 2, s = 3 + Math.random() * 7;
    const y = at.y + Math.random() * h;
    g.engine.dust.spawn({ x: at.x, y, z: at.z, vx: Math.cos(a) * s, vy: 1 + Math.random() * 5, vz: Math.sin(a) * s, size: 0.18 + Math.random() * 0.22, sizeEnd: 0.1, life: 1.2 + Math.random() * 0.6, r: 0.94, g: 0.93, b: 0.91, alpha: 1, alphaEnd: 0, rot: Math.random() * 6, spin: (Math.random() - 0.5) * 12, gravity: -5, drag: 1.4, tex: TEX_PUFF });
  }
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * Math.PI * 2;
    g.engine.dust.spawn({ x: at.x, y: at.y + 0.3, z: at.z, vx: Math.cos(a) * 3, vy: 0.6, vz: Math.sin(a) * 3, size: 1, sizeEnd: 3, life: 1, r: 0.66, g: 0.64, b: 0.62, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
  }
  g.engine.glow.spawn({ x: at.x, y: at.y + h * 0.6, z: at.z, size: 1, sizeEnd: 5, life: 0.4, r: 1, g: 0.86, b: 0.5, alpha: 0.8, alphaEnd: 0, tex: TEX_RING });
}

/** Flesh and blood spattered from a torn limb or a split body. */
export function fleshBurst(g: Game, at: THREE.Vector3, k = 1): void {
  for (let i = 0; i < 18 * k; i++) {
    const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 4;
    g.engine.dust.spawn({ x: at.x, y: at.y, z: at.z, vx: Math.cos(a) * s, vy: 1 + Math.random() * 4, vz: Math.sin(a) * s, size: 0.12 * k + Math.random() * 0.1, sizeEnd: 0.05, life: 0.7, r: 0.42, g: 0.05, b: 0.07, alpha: 0.95, alphaEnd: 0, gravity: -14, tex: TEX_PUFF });
  }
  g.engine.dust.spawn({ x: at.x, y: at.y, z: at.z, vx: 0, vy: 0.5, vz: 0, size: 0.5 * k, sizeEnd: 1.2 * k, life: 0.5, r: 0.5, g: 0.08, b: 0.1, alpha: 0.7, alphaEnd: 0, tex: TEX_PUFF });
}

/** A gold flare at a point — the eyes before a Compulsory, the palm's eye, the nerve's bite. */
export function flare(g: Game, at: THREE.Vector3, size = 0.3, col: [number, number, number] = [1, 0.85, 0.35]): void {
  g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, size, sizeEnd: size * 2.6, life: 0.3, r: col[0], g: col[1], b: col[2], alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, size: size * 3, sizeEnd: size * 0.6, life: 0.22, r: col[0], g: col[1], b: col[2], alpha: 0.6, alphaEnd: 0, stretch: 1, tex: TEX_STREAK });
}

/**
 * A finger torn off: it falls, lands, and swells — fingers and eyes sprouting — until `hatch` makes the clone there.
 */
export class FingerSeed implements Projectile {
  done = false;
  private mesh: PropMesh;
  private vel: THREE.Vector3;
  private t = 0;
  private landed = -1;
  readonly pos: THREE.Vector3;
  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, vel: THREE.Vector3, readonly scale: number, private hatch: (at: THREE.Vector3) => void) {
    this.pos = from.clone();
    this.vel = vel.clone();
    this.mesh = new PropMesh(pernidaProp('finger'));
    this.mesh.scale.setScalar(scale);
    g.engine.gr.scene.add(this.mesh);
    fleshBurst(g, from, scale * 1.5);
  }
  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.landed < 0) {
      this.vel.y -= 22 * dt;
      this.pos.addScaledVector(this.vel, dt);
      const gy = groundAt(g, this.pos.x, this.pos.y + 0.5, this.pos.z, 4);
      if (gy !== null && this.pos.y <= gy + 0.2) {
        this.pos.y = gy + 0.2;
        this.landed = this.t;
        g.sfx.play('impact', this.pos, 0.6);
      }
      this.mesh.rotation.x += dt * 9;
      this.mesh.rotation.z += dt * 5;
    } else {
      // it writhes and swells
      const k = this.t - this.landed;
      this.mesh.rotation.set(0, this.mesh.rotation.y + dt * 2, Math.sin(k * 14) * 0.2);
      this.mesh.scale.setScalar(this.scale * (1 + k * 1.6));
      if (Math.random() < 0.5) fleshBurst(g, this.pos, 0.4);
      if (k > 0.9) {
        this.done = true;
        this.hatch(this.pos.clone());
      }
    }
    this.mesh.position.copy(this.pos);
    if (this.t > 6) this.done = true;
  }
  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.material.dispose();
  }
}
