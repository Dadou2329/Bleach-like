// Tenken's phantom limbs and Kokujō Tengen Myō'ō. Both are rigs on Komamura's skeleton (the giant is built
// on his proportions at the giant's density) that copy his bone rotations every rendered frame, after his
// animator has posed him, so whatever he does they do at their scale.
// - TenkenLimb (Shikai): only an armoured arm (with the giant sword or a bare fist) or a leg, ~×7, hung in
//   the air with its shoulder or hip a little above and behind his; it materialises for one move and
//   dissolves into red reishi.
// - TengenGiant (Bankai): the whole armoured giant, ~30 m, rising out of the ground behind him and to his
//   left, following him with a little lag; its legs only shuffle while he walks (they copy his fully while
//   he attacks), it glares, and it dissolves in a wave of reishi when dismissed.
// Hits are the kit's business: it opens `active` with a BladeSpec (sweeps run through Game.bladeSweep with
// the mirror's own hit list) and asks for socket / bone positions (fists, feet) on its events.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { BladeSpec, Fighter } from '../game/fighter';
import { CharacterVisual, PropMesh } from '../game/characterFactory';
import type { Rig } from '../anim/rig';
import { GIANT_SWORD_BASE, GIANT_SWORD_TIP, giantAsset, komamuraProp } from '../chars/komamura';
import { TEX_GLOW, TEX_PUFF } from './sprites';
import { groundAt } from './iceArts';
import { BoxShape } from '../destruction/shapes';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _q = new THREE.Quaternion();
const IDQ = new THREE.Quaternion();
const X_AXIS = new THREE.Vector3(1, 0, 0);

/** Komamura's reiatsu, the colour the phantoms dissolve into */
export const TENGEN_RED: [number, number, number] = [1, 0.22, 0.14];

const LEG_BONES = new Set(['thigh.L', 'shin.L', 'foot.L', 'thigh.R', 'shin.R', 'foot.R']);

/** A rig that copies another rig's pose by bone name. */
abstract class Mirror implements Projectile {
  done = false;
  readonly v: CharacterVisual;
  protected sword: PropMesh | null = null;
  protected map: Int16Array = new Int16Array(0);
  private mapFor: Rig | null = null;
  private isLeg: boolean[];
  private isHand: boolean[];
  /** world placement of the root, its yaw and a forward pitch about the root */
  readonly pos = new THREE.Vector3();
  yaw = 0;
  pitch = 0;
  scale: number;
  /** 0 = fully there, 1 = gone */
  dissolve = 1;
  /** blade sampling (world) */
  readonly base = new THREE.Vector3();
  readonly tip = new THREE.Vector3();
  readonly prevBase = new THREE.Vector3();
  readonly prevTip = new THREE.Vector3();
  private bladeValid = false;
  /** set by the kit: the sword cuts and hits while active */
  active = false;
  spec: BladeSpec | null = null;
  readonly hits = new Set<number>();
  /** how much of his leg motion the legs copy (1 = all) */
  legK = 1;

  constructor(protected g: Game, readonly owner: Fighter, part: 'whole' | 'limbs', scale: number, withSword: boolean) {
    const a = giantAsset(part);
    this.v = new CharacterVisual(a.model, [], []);
    if (withSword) this.sword = this.v.attach('sword', komamuraProp('giantSword'), 'grip.R');
    this.scale = scale;
    this.isLeg = this.v.rig.names.map((n) => LEG_BONES.has(n));
    this.isHand = this.v.rig.names.map((n) => n.startsWith('fist.') || n.startsWith('palm.'));
    this.setDissolve(1);
    g.engine.gr.scene.add(this.v.object);
  }

  protected setDissolve(k: number): void {
    this.dissolve = k;
    this.v.forEachMaterial((m) => (m.userData.uniforms.uDissolve.value = k));
  }

  /** red rim / flash on every material */
  protected tint(rim: number, flash = 0): void {
    this.v.forEachMaterial((m) => {
      const u = m.userData.uniforms;
      u.uRim.value.set(TENGEN_RED[0], TENGEN_RED[1] * 1.4, TENGEN_RED[2], rim);
      u.uFlash.value.set(1, 0.5, 0.4, flash);
    });
  }

  /** copy his bone rotations (and the hip offset) onto ours */
  protected copyPose(): void {
    const src = this.owner.visual.rig, dst = this.v.rig;
    if (this.mapFor !== src) {
      this.map = new Int16Array(dst.count);
      for (let i = 0; i < dst.count; i++) this.map[i] = src.index(dst.names[i]);
      this.mapFor = src;
    }
    for (let i = 0; i < dst.count; i++) {
      const si = this.map[i];
      if (si < 0) continue;
      const sb = src.bones[si], db = dst.bones[i];
      if (this.isLeg[i] && this.legK < 1) db.quaternion.copy(IDQ).slerp(sb.quaternion, this.legK);
      else db.quaternion.copy(sb.quaternion);
      if (this.isHand[i]) db.scale.copy(sb.scale);
    }
    if (src.hips >= 0 && dst.hips >= 0) {
      _v.copy(src.bones[src.hips].position).sub(src.restPos[src.hips]);
      dst.bones[dst.hips].position.copy(dst.restPos[dst.hips]).addScaledVector(_v, this.legK);
    }
  }

  /** what he is fighting: where he aims, or the nearest enemy ahead of him */
  protected targetPoint(): THREE.Vector3 | null {
    const f = this.owner;
    if (f.faceTarget) return f.faceTarget.clone();
    const t = this.g.nearestEnemy(f, 70, f.forward(_w), 75);
    return t ? t.center() : null;
  }

  /** bend the copied pose forward at the spine and chest by `deg` (the head keeps looking ahead) */
  protected bend(deg: number): void {
    if (Math.abs(deg) < 0.5) return;
    const rig = this.v.rig;
    const add = (name: string, d: number) => {
      const i = rig.index(name);
      if (i < 0) return;
      _q.setFromAxisAngle(X_AXIS, (d * Math.PI) / 180);
      rig.bones[i].quaternion.premultiply(_q);
    };
    add('spine', deg * 0.6);
    add('chest', deg * 0.4);
    add('neck', -deg * 0.25);
    add('head', -deg * 0.35);
  }

  protected applyTransform(): void {
    const o = this.v.object;
    o.position.copy(this.pos);
    o.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    o.scale.setScalar(this.scale);
    o.updateMatrixWorld(true);
  }

  /** sample the sword and sweep it when active */
  protected sweep(): void {
    if (!this.sword) return;
    this.sword.updateMatrixWorld(true);
    this.prevBase.copy(this.base);
    this.prevTip.copy(this.tip);
    this.base.set(...GIANT_SWORD_BASE).applyMatrix4(this.sword.matrixWorld);
    this.tip.set(...GIANT_SWORD_TIP).applyMatrix4(this.sword.matrixWorld);
    if (!this.bladeValid) {
      this.prevBase.copy(this.base);
      this.prevTip.copy(this.tip);
      this.bladeValid = true;
    }
    if (this.active && this.spec && this.dissolve < 0.5) {
      this.g.bladeSweep(this.owner, this.prevBase, this.prevTip, this.base, this.tip, this.spec, this.hits);
      if (this.pressure > 0) this.pressureHits(this.spec);
    }
  }

  /** how far below the blade a giant's swing still strikes (its wind and weight), m; 0 = only the blade */
  pressure = 0;

  /**
   * A giant's blade passing over someone: anyone whose column lies under the swept blade, within `pressure`
   * metres below it, is struck as if the edge had found them.
   */
  private pressureHits(spec: BladeSpec): void {
    const g = this.g, f = this.owner;
    const d0 = _v.subVectors(this.prevTip, this.prevBase), d1 = _w.subVectors(this.tip, this.base);
    const l0 = d0.length(), l1 = d1.length();
    if (l0 < 1e-3 || l1 < 1e-3) return;
    d0.divideScalar(l0);
    d1.divideScalar(l1);
    const qa = new THREE.Quaternion().setFromUnitVectors(d0, d1);
    const qb = new THREE.Quaternion();
    const turn = Math.acos(Math.max(-1, Math.min(1, d0.dot(d1))));
    const steps = Math.min(16, Math.max(3, Math.ceil(turn / 0.12)));
    const dir = new THREE.Vector3(), p = new THREE.Vector3();
    for (const o of g.enemiesOf(f)) {
      if (o.dead || this.hits.has(o.id)) continue;
      let hit = false;
      for (let si = 0; si <= steps && !hit; si++) {
        const k = si / steps;
        qb.identity().slerp(qa, k);
        dir.copy(d0).applyQuaternion(qb);
        const len = l0 + (l1 - l0) * k;
        const bx = this.prevBase.x + (this.base.x - this.prevBase.x) * k, by = this.prevBase.y + (this.base.y - this.prevBase.y) * k, bz = this.prevBase.z + (this.base.z - this.prevBase.z) * k;
        for (let bi = 2; bi <= 12 && !hit; bi++) {
          const u = (bi / 12) * len;
          p.set(bx + dir.x * u, by + dir.y * u, bz + dir.z * u);
          if (Math.hypot(p.x - o.pos.x, p.z - o.pos.z) > o.def.radius + (spec.reach ?? 0.2)) continue;
          if (p.y > o.pos.y - 1.5 && p.y < o.pos.y + o.def.height + this.pressure) hit = true;
        }
      }
      if (!hit) continue;
      this.hits.add(o.id);
      const away = new THREE.Vector3().subVectors(o.pos, f.pos).setY(0).normalize();
      g.damage(o, spec.damage, f, away, { knock: spec.knock, launch: spec.launch, heavy: spec.heavy, hitstop: spec.hitstop, shake: spec.shake });
      g.sparks(o.center(), away, f.def.aura.body);
    }
  }

  /** world position of a socket or bone of the mirror */
  point(name: string, out = new THREE.Vector3()): THREE.Vector3 {
    const s = this.v.rig.sockets.get(name);
    if (s) return s.getWorldPosition(out);
    const i = this.v.rig.index(name);
    if (i >= 0) return this.v.rig.bones[i].getWorldPosition(out);
    return out.copy(this.pos);
  }

  /** a point along the sword (0 = base, 1 = tip) */
  bladePoint(k: number, out = new THREE.Vector3()): THREE.Vector3 {
    return out.lerpVectors(this.base, this.tip, k);
  }

  /** red reishi shed off the surface while it forms or dissolves */
  protected shed(n: number, around: THREE.Vector3, spread: number, up: number): void {
    const g = this.g;
    for (let i = 0; i < n; i++) {
      const x = around.x + (Math.random() - 0.5) * spread, y = around.y + (Math.random() - 0.3) * spread, z = around.z + (Math.random() - 0.5) * spread;
      g.engine.glow.spawn({ x, y, z, vx: (Math.random() - 0.5) * 2, vy: up * (0.5 + Math.random()), vz: (Math.random() - 0.5) * 2, size: 0.5 + Math.random() * 0.6, sizeEnd: 0.05, life: 0.6 + Math.random() * 0.5, r: TENGEN_RED[0], g: TENGEN_RED[1], b: TENGEN_RED[2], alpha: 0.85, alphaEnd: 0, tex: TEX_GLOW, drag: 1 });
    }
  }

  update(_dt: number): void {}

  dispose(): void {
    this.v.object.removeFromParent();
  }
}

export type LimbKind = 'arm.R' | 'arm.L' | 'leg.R';

/**
 * One of Tenken's phantom limbs for a single move: `life` seconds, then it dissolves. The limb's shoulder
 * (or hip) hangs at his + `offset` (his frame: x to his left, y up, z forward).
 */
export class TenkenLimb extends Mirror {
  private t = 0;
  private fadeT = -1;
  private anchorBone: string;
  private anchorSrc: string;

  constructor(g: Game, owner: Fighter, readonly kind: LimbKind, readonly life: number, readonly offset: THREE.Vector3, scale = 7) {
    super(g, owner, 'limbs', scale, kind === 'arm.R');
    this.yaw = owner.yaw;
    const rig = this.v.rig;
    for (const n of ['upperarm.L', 'upperarm.R', 'thigh.L', 'thigh.R']) rig.setBoneVisible(n, false);
    this.anchorBone = kind === 'arm.R' ? 'upperarm.R' : kind === 'arm.L' ? 'upperarm.L' : 'thigh.R';
    this.anchorSrc = this.anchorBone;
    rig.setBoneVisible(this.anchorBone, true);
  }

  override update(dt: number): void {
    this.t += dt;
    if (this.fadeT < 0 && this.t >= this.life) this.fadeT = 0;
    if (this.fadeT >= 0) {
      this.fadeT += dt;
      this.active = false;
      if (this.fadeT > 0.45) this.done = true;
    }
  }

  /** dissolve now (the move was cancelled) */
  end(): void {
    if (this.fadeT < 0) this.fadeT = 0;
  }

  render(dt: number): void {
    const f = this.owner;
    this.copyPose();
    // (the hiding of the other limbs survives the pose copy: it only copies the hands' scale)
    // the anchor joint (shoulder or hip) hangs at his joint + offset
    const src = f.visual.rig;
    const sb = src.bones[src.index(this.anchorSrc)];
    sb.getWorldPosition(_v);
    const fw = _w.set(Math.sin(f.yaw), 0, Math.cos(f.yaw));
    const left = new THREE.Vector3(fw.z, 0, -fw.x);
    const want = _v.clone().addScaledVector(left, this.offset.x).addScaledVector(fw, this.offset.z);
    want.y += this.offset.y;
    // turn the phantom body to face what he fights, and pitch it down toward it so the strike, made at
    // a giant's height, comes down on a man-sized target (his own aim is only right at his own size)
    const tgt = this.targetPoint();
    if (this.yaw === 0 && this.t < 0.02) this.yaw = f.yaw;
    const anchor = this.v.rig.bones[this.v.rig.index(this.anchorBone)];
    for (let it = 0; it < 2; it++) {
      this.pos.set(0, 0, 0);
      this.applyTransform();
      anchor.getWorldPosition(_v);
      this.pos.copy(want).sub(_v);
      if (tgt) {
        this.yaw = Math.atan2(tgt.x - this.pos.x, tgt.z - this.pos.z);
        const d = Math.max(1, Math.hypot(tgt.x - want.x, tgt.z - want.z));
        const drop = (Math.atan2(want.y - tgt.y, d) * 180) / Math.PI;
        this.pitch = (Math.max(0, Math.min(this.kind === 'leg.R' ? 0 : 48, drop - (this.kind === 'arm.R' ? 4 : 0))) * Math.PI) / 180;
      } else {
        this.yaw = f.yaw;
        this.pitch = this.kind === 'leg.R' ? 0 : 0.25;
      }
    }
    this.pos.set(0, 0, 0);
    this.applyTransform();
    anchor.getWorldPosition(_v);
    this.pos.copy(want).sub(_v);
    this.applyTransform();
    // materialise fast, dissolve slow
    const k = this.fadeT >= 0 ? Math.min(1, this.fadeT / 0.4) : Math.max(0, 1 - this.t / 0.1);
    this.setDissolve(k);
    this.tint(0.9, this.t < 0.12 ? 0.6 * (1 - this.t / 0.12) : 0);
    this.sweep();
    if (this.fadeT >= 0 && this.fadeT < 0.4 && Math.random() < dt * 60) this.shed(3, this.limbCentre(), 4, 2);
    if (this.t < 0.1) this.shed(2, this.limbCentre(), 4, 1);
  }

  /** the middle of the visible limb */
  limbCentre(out = new THREE.Vector3()): THREE.Vector3 {
    const a = this.kind === 'arm.R' ? 'forearm.R' : this.kind === 'arm.L' ? 'forearm.L' : 'shin.R';
    return this.point(a, out);
  }
}

/**
 * Kokujō Tengen Myō'ō: rises out of the ground behind him and to his left over `riseT` seconds, then follows
 * him and copies him until `dismiss()`.
 */
export class TengenGiant extends Mirror {
  private t = 0;
  private endT = -1;
  /** extra legK while one of his actions runs */
  acting = false;
  private flashT = 0;
  /** how far behind and to his left it stands (m) */
  back = 4;
  side = 5.5;
  private readonly rise: number;
  private stepAcc = 0;
  /** degrees of forward bend added to his pose */
  private lean = 0;
  /** bend toward the target while he acts (sword swings); off for moves that already reach the ground */
  leanOn = true;
  /** set in the constructor: the giant's blade strikes what it passes over */

  constructor(g: Game, owner: Fighter, scale: number, riseT = 1.6) {
    super(g, owner, 'whole', scale, true);
    this.rise = riseT;
    this.yaw = owner.yaw;
    this.pressure = 6;
    this.place(1);
    this.setDissolve(0);
  }

  get rising(): boolean {
    return this.t < this.rise;
  }

  get ending(): boolean {
    return this.endT >= 0;
  }

  /** a hit on Komamura shows on the giant too */
  flash(): void {
    this.flashT = 0.15;
  }

  dismiss(): void {
    if (this.endT < 0) this.endT = 0;
    this.active = false;
  }

  override update(dt: number): void {
    this.t += dt;
    this.flashT = Math.max(0, this.flashT - dt);
    if (this.endT >= 0) {
      this.endT += dt;
      if (this.endT > 1.4) this.done = true;
    }
  }

  /** where it wants to stand: behind him and to his left, turned toward what he faces */
  private place(lerp: number): void {
    const f = this.owner;
    const fw = _w.set(Math.sin(f.yaw), 0, Math.cos(f.yaw));
    const left = _v.set(fw.z, 0, -fw.x);
    const want = new THREE.Vector3().copy(f.renderPos).addScaledVector(fw, -this.back).addScaledVector(left, this.side);
    const gy = groundAt(this.g, want.x, f.renderPos.y + 4, want.z, 14);
    want.y = gy ?? f.renderPos.y;
    if (lerp >= 1) this.pos.copy(want);
    else {
      this.pos.x += (want.x - this.pos.x) * lerp;
      this.pos.z += (want.z - this.pos.z) * lerp;
      this.pos.y += (want.y - this.pos.y) * Math.min(1, lerp * 0.6);
    }
    // face what he fights (or the point 16 m ahead of him)
    const aim = this.targetPoint() ?? new THREE.Vector3().copy(f.renderPos).addScaledVector(fw, 16);
    const want2 = Math.atan2(aim.x - this.pos.x, aim.z - this.pos.z);
    let d = want2 - this.yaw;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    this.yaw += d * Math.min(1, lerp * 1.5);
  }

  render(dt: number): void {
    const f = this.owner;
    this.legK += ((this.acting ? 1 : 0.3) - this.legK) * Math.min(1, dt * 6);
    this.copyPose();
    // while he swings it bends toward the target, so cuts made at a giant's height come down on it
    const tgt = this.acting && this.leanOn ? this.targetPoint() : null;
    let want = 0;
    if (tgt) {
      const shoulder = this.pos.y + this.scale * 2.2;
      const d = Math.max(2, Math.hypot(tgt.x - this.pos.x, tgt.z - this.pos.z) - this.scale * 0.3);
      want = Math.max(12, Math.min(52, (Math.atan2(shoulder - tgt.y, d) * 180) / Math.PI - 18));
    }
    this.lean += (want - this.lean) * Math.min(1, dt * 5);
    this.bend(this.lean);
    if (this.rising) {
      // up out of the ground, the earth splitting round its feet
      const u = this.t / this.rise;
      const e = 1 - (1 - u) * (1 - u) * (1 - u);
      this.place(Math.min(1, dt * 3));
      const gy = this.pos.y;
      this.pos.y = gy - this.scale * 2.9 * (1 - e);
      this.applyTransform();
      this.pos.y = gy;
      if (Math.random() < dt * 30) {
        const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 8;
        this.g.engine.dust.spawn({ x: this.pos.x + Math.cos(a) * r, y: gy + 0.3, z: this.pos.z + Math.sin(a) * r, vx: Math.cos(a) * 3, vy: 2 + Math.random() * 4, vz: Math.sin(a) * 3, size: 1.6, sizeEnd: 4, life: 1.6, r: 0.5, g: 0.45, b: 0.4, alpha: 0.7, alphaEnd: 0, drag: 1.2, tex: TEX_PUFF });
      }
    } else {
      this.place(Math.min(1, dt * 2.2));
      this.applyTransform();
    }
    // dismissed: it comes apart from the feet up into reishi
    if (this.endT >= 0) {
      const k = Math.min(1, this.endT / 1.2);
      this.setDissolve(k);
      if (Math.random() < dt * 40) {
        _v.copy(this.pos);
        _v.y += Math.random() * this.scale * 2.9;
        this.shed(4, _v, this.scale * 0.6, 6);
      }
    } else this.setDissolve(0);
    this.tint(0.25 + Math.min(1, f.aura.level) * 0.6, this.flashT > 0 ? 0.8 : 0);
    this.sweep();
    // the ground shakes under its feet while it walks with him
    const moving = Math.hypot(f.body.vel.x, f.body.vel.z);
    this.stepAcc += dt * moving * 0.25;
    if (this.stepAcc > 1 && !this.rising && this.endT < 0) {
      this.stepAcc = 0;
      if (f === this.g.player) this.g.shake(0.06);
      this.g.sfx.play('impact', this.pos, 0.5);
    }
  }
}

/**
 * The ground split open along a line: it runs out from `from` along `dir` at `speed`, carving a trench
 * (`width` × `depth`) step by step, throwing up rock and dust and launching whoever stands on it. `slab`
 * (m, optional) also cuts a thin wall that high along the line: buildings in its path are halved.
 */
export class Fissure implements Projectile {
  done = false;
  private d = 0;
  private carved = 0;
  private readonly hit = new Set<number>();
  private readonly side: THREE.Vector3;

  constructor(
    private g: Game,
    readonly owner: Fighter,
    readonly from: THREE.Vector3,
    readonly dir: THREE.Vector3,
    readonly o: { len: number; width: number; depth: number; damage: number; speed: number; slab?: number; color?: string },
  ) {
    this.dir = dir.clone().setY(0).normalize();
    this.side = new THREE.Vector3(this.dir.z, 0, -this.dir.x);
  }

  update(dt: number): void {
    const { g, o } = this;
    this.d = Math.min(o.len, this.d + o.speed * dt);
    const step = Math.max(0.8, o.width * 0.9);
    while (this.carved + step <= this.d) {
      this.carved += step;
      const p = this.from.clone().addScaledVector(this.dir, this.carved);
      const gy = groundAt(g, p.x, p.y + 3, p.z, 8);
      if (gy !== null) p.y = gy;
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(this.dir.x, this.dir.z));
      // the trench: jagged, a little wider in the middle of its run
      const u = this.carved / o.len;
      const w = o.width * (0.7 + Math.sin(u * Math.PI) * 0.5) * (0.85 + Math.random() * 0.3);
      g.engine.destruction.carve(new BoxShape(new THREE.Vector3(p.x, p.y - o.depth * 0.45, p.z).addScaledVector(this.side, (Math.random() - 0.5) * w * 0.4), new THREE.Vector3(w * 0.5, o.depth * 0.6, step * 0.7), q), { mode: 'smash', power: 900, impulse: 12 + o.depth * 3, debris: 0.4, dust: 1.4, dir: new THREE.Vector3(0, 1, 0) });
      if (o.slab) g.engine.destruction.carve(new BoxShape(new THREE.Vector3(p.x, p.y + o.slab * 0.5, p.z), new THREE.Vector3(0.3, o.slab * 0.5, step * 0.55), q), { mode: 'cut', power: 2600, dir: this.side.clone(), sparks: [1, 0.4, 0.3], dust: 0.5 });
      for (let i = 0; i < 4; i++) {
        const s = (Math.random() - 0.5) * w * 2;
        g.engine.dust.spawn({ x: p.x + this.side.x * s, y: p.y + 0.3, z: p.z + this.side.z * s, vx: this.side.x * s * 2, vy: 3 + Math.random() * 5, vz: this.side.z * s * 2, size: 0.8 + w * 0.3, sizeEnd: 2 + w, life: 1 + Math.random() * 0.6, r: 0.55, g: 0.5, b: 0.45, alpha: 0.6, alphaEnd: 0, drag: 1.5, tex: TEX_PUFF });
      }
      g.engine.glow.spawn({ x: p.x, y: p.y + 0.2, z: p.z, vy: 4, size: w * 1.4, sizeEnd: 0.2, life: 0.4, r: TENGEN_RED[0], g: TENGEN_RED[1], b: TENGEN_RED[2], alpha: 0.7, alphaEnd: 0, tex: TEX_GLOW });
      for (const f of g.enemiesOf(this.owner)) {
        if (f.dead || this.hit.has(f.id)) continue;
        _v.subVectors(f.pos, p);
        if (Math.abs(_v.dot(this.dir)) > step || Math.abs(_v.dot(this.side)) > w * 0.5 + 1 + f.def.radius || Math.abs(_v.y) > 3) continue;
        this.hit.add(f.id);
        g.damage(f, o.damage, this.owner, new THREE.Vector3(0, 0, 0).addScaledVector(this.dir, 0.4).addScaledVector(this.side, Math.sign(_v.dot(this.side)) || 1), { knock: 8, launch: 9 + o.depth, heavy: true, hitstop: 0.08, shake: 0.4 });
      }
      if (this.carved > o.len - step) break;
    }
    if (Math.random() < dt * 8) g.sfx.play('crumble', this.from.clone().addScaledVector(this.dir, this.d), 0.6);
    if (this.d >= o.len) this.done = true;
  }

  dispose(): void {}
}
