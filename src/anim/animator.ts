// Animator: procedural locomotion as the base layer, keyframed clips crossfaded on top (with named
// events for gameplay), weapon IK from blended grip targets, head look-at, additive flinch springs
// and spring bones. Clip time advances in sim steps (hitstop freezes it); the pose is built and
// applied once per rendered frame.
import * as THREE from 'three';
import { Clip, type ClipDef } from './clip';
import { Pose } from './pose';
import type { Rig } from './rig';
import { Locomotion, type GripTarget, type LocoInput, type StanceDef } from './locomotion';
import { armChain, legChain, lookAt, plantLeg, solveArm, swordQuat, type ArmChain, type LegChain } from './ik';
import type { SpringSystem } from './springs';

export interface PlayOpts {
  fadeIn?: number;
  fadeOut?: number;
  speed?: number;
  /** keep the last frame until stopped (casting holds, charge poses) */
  hold?: boolean;
  onEvent?: (name: string) => void;
  onEnd?: () => void;
}

export class ClipInstance {
  time = 0;
  weight = 0;
  ending = false;
  done = false;
  constructor(readonly clip: Clip, public speed: number, public fadeIn: number, public fadeOut: number, public hold: boolean, public onEvent?: (n: string) => void, public onEnd?: () => void) {}
  get progress(): number {
    return this.time / this.clip.dur;
  }
}

const _g = new THREE.Vector3();
const _d = new THREE.Vector3();
const _e = new THREE.Vector3();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _cq = new THREE.Quaternion();
const _gl = new THREE.Vector3();
const _c3 = [0, 0, 0];

export class Animator {
  readonly loco: Locomotion;
  readonly pose: Pose;
  private tmp: Pose;
  private clips = new Map<string, Clip>();
  readonly active: ClipInstance[] = [];
  readonly grip: GripTarget = { p: new THREE.Vector3(), dir: new THREE.Vector3(0, 0, 1), edge: new THREE.Vector3(0, -1, 0), pole: new THREE.Vector3(-1, -0.4, -0.4), w: 0, twoHand: 0 };
  /**
   * Weapon grips only clips drive: the left hand ('@ikL', '@gripL', '@dirL', '@edgeL', '@poleL') and a second pair
   * of arms where the rig has one ('@ikR2' … on upperarm2.R, '@ikL2' … on upperarm2.L).
   */
  readonly extraGrips: { key: string; chain: ArmChain | null; g: GripTarget }[];
  private chainR: ArmChain | null;
  private chainL: ArmChain | null;
  private legs: LegChain[];
  /** foot planting strength (set from grounded state) */
  plant = 1;
  /** world-space look target (enemy, camera aim) */
  lookTarget: THREE.Vector3 | null = null;
  lookWeight = 1;
  private flinchA = new THREE.Vector2();
  private flinchV = new THREE.Vector2();
  private chest: number;
  private rArm: number;
  private neckHead: number[];
  /** extra per-frame overrides (e.g. root spin for spinning attacks, set by clip channel '@spin') */
  spin = 0;

  constructor(readonly rig: Rig, stance: StanceDef, readonly springs: SpringSystem | null = null) {
    this.loco = new Locomotion(rig, stance);
    this.pose = new Pose(rig.count);
    this.tmp = new Pose(rig.count);
    this.chainR = armChain(rig, 'R', 'grip.R');
    this.chainL = armChain(rig, 'L', 'grip.L');
    const mk = (pole: [number, number, number]): GripTarget => ({ p: new THREE.Vector3(), dir: new THREE.Vector3(0, 0, 1), edge: new THREE.Vector3(0, -1, 0), pole: new THREE.Vector3(...pole), w: 0, twoHand: 0 });
    this.extraGrips = [
      { key: 'L', chain: this.chainL, g: mk([1, -0.4, -0.4]) },
      { key: 'R2', chain: armChain(rig, 'R', 'grip2.R', '2'), g: mk([-1, -0.4, -0.4]) },
      { key: 'L2', chain: armChain(rig, 'L', 'grip2.L', '2'), g: mk([1, -0.4, -0.4]) },
    ].filter((x) => x.chain !== null);
    this.legs = [legChain(rig, 'L'), legChain(rig, 'R')].filter((l): l is LegChain => l !== null);
    this.chest = rig.index('chest');
    this.rArm = rig.index('upperarm.R');
    this.neckHead = [rig.index('neck'), rig.index('head')].filter((i) => i >= 0);
  }

  register(defs: ClipDef[]): void {
    for (const d of defs) this.clips.set(d.name, new Clip(d, this.rig));
  }

  has(name: string): boolean {
    return this.clips.has(name);
  }

  clip(name: string): Clip | undefined {
    return this.clips.get(name);
  }

  play(name: string, o: PlayOpts = {}): ClipInstance | null {
    const c = this.clips.get(name);
    if (!c) {
      console.warn('missing clip', name);
      return null;
    }
    // fade out whatever is playing (crossfade)
    const fi = o.fadeIn ?? c.fadeIn;
    for (const a of this.active) if (!a.ending) {
      a.ending = true;
      a.fadeOut = Math.min(a.fadeOut, Math.max(0.05, fi));
    }
    const inst = new ClipInstance(c, o.speed ?? 1, fi, o.fadeOut ?? c.fadeOut, !!o.hold, o.onEvent, o.onEnd);
    if (fi <= 0) inst.weight = 1;
    this.active.push(inst);
    return inst;
  }

  /** Fade out every clip (back to locomotion). */
  stopAll(fade = 0.2): void {
    for (const a of this.active) {
      a.ending = true;
      a.fadeOut = fade;
    }
  }

  get current(): ClipInstance | null {
    for (let i = this.active.length - 1; i >= 0; i--) if (!this.active[i].ending) return this.active[i];
    return null;
  }

  isPlaying(name?: string): boolean {
    return this.active.some((a) => !a.ending && (!name || a.clip.name === name));
  }

  flinch(pitch: number, roll: number): void {
    this.flinchV.x += pitch;
    this.flinchV.y += roll;
  }

  /** Advance clip clocks, fades and events (sim step). */
  update(dt: number, inp: LocoInput): void {
    this.loco.update(dt, inp);
    for (const a of this.active) {
      const prev = a.time;
      a.time += dt * a.speed;
      // events crossed this step
      if (a.onEvent) for (const [n, t] of Object.entries(a.clip.events)) if (prev < t && a.time >= t) a.onEvent(n);
      if (a.clip.loop) {
        if (a.time >= a.clip.dur) a.time -= a.clip.dur;
      } else if (a.time >= a.clip.dur) {
        a.time = a.clip.dur;
        if (!a.hold && !a.ending) {
          a.ending = true;
          a.onEnd?.();
        }
      }
      // start fading out before the end so the clip's tail blends into locomotion
      if (!a.clip.loop && !a.hold && !a.ending && a.time >= a.clip.dur - a.fadeOut * 0.5) {
        a.ending = true;
        a.onEnd?.();
      }
      if (a.ending) {
        a.weight -= dt / Math.max(0.01, a.fadeOut);
        if (a.weight <= 0) a.done = true;
      } else a.weight = Math.min(1, a.weight + dt / Math.max(0.01, a.fadeIn));
    }
    for (let i = this.active.length - 1; i >= 0; i--) if (this.active[i].done) this.active.splice(i, 1);
    // flinch spring (critically-ish damped)
    const k = 160, c = 18;
    this.flinchV.x += (-k * this.flinchA.x - c * this.flinchV.x) * dt;
    this.flinchV.y += (-k * this.flinchA.y - c * this.flinchV.y) * dt;
    this.flinchA.addScaledVector(this.flinchV, dt);
  }

  /** Build the final pose and apply it to the rig (render frame). */
  apply(dt: number): void {
    const pose = this.pose;
    this.loco.write(pose);
    const G = this.grip;
    this.loco.grip(G);
    for (const x of this.extraGrips) x.g.w = 0;
    this.spin = 0;
    let lookW = this.lookWeight;
    for (const a of this.active) {
      const w = a.weight * a.weight * (3 - 2 * a.weight); // smoothstep fade
      if (w <= 0) continue;
      this.tmp.copy(pose);
      a.clip.sample(a.time, this.tmp);
      pose.blendTo(this.tmp, w, null, a.clip.hasHips ? 1 : 0);
      const c = a.clip;
      if (c.channel('@ikR', a.time, _c3)) {
        const iw = _c3[0] * w;
        if (c.channel('@gripR', a.time, _c3)) G.p.lerp(_p.set(_c3[0], _c3[1], _c3[2]), iw);
        if (c.channel('@dirR', a.time, _c3)) G.dir.lerp(_d.set(_c3[0], _c3[1], _c3[2]).normalize(), iw).normalize();
        if (c.channel('@edgeR', a.time, _c3)) G.edge.lerp(_e.set(_c3[0], _c3[1], _c3[2]).normalize(), iw).normalize();
        if (c.channel('@poleR', a.time, _c3)) G.pole.lerp(_p.set(_c3[0], _c3[1], _c3[2]).normalize(), iw).normalize();
        G.w = Math.max(G.w, iw);
      }
      else if (this.rArm >= 0 && c.weights[this.rArm] > 0) G.w *= 1 - w;
      for (const x of this.extraGrips) {
        const k0 = x.key, X = x.g;
        if (!c.channel(`@ik${k0}`, a.time, _c3)) continue;
        const iw = _c3[0] * w;
        if (iw <= 0) continue;
        // the first clip to drive this hand sets it, later ones blend over it
        const k = X.w <= 1e-4 ? 1 : iw;
        if (c.channel(`@grip${k0}`, a.time, _c3)) X.p.lerp(_p.set(_c3[0], _c3[1], _c3[2]), k);
        if (c.channel(`@dir${k0}`, a.time, _c3)) X.dir.lerp(_d.set(_c3[0], _c3[1], _c3[2]).normalize(), k).normalize();
        if (c.channel(`@edge${k0}`, a.time, _c3)) X.edge.lerp(_e.set(_c3[0], _c3[1], _c3[2]).normalize(), k).normalize();
        if (c.channel(`@pole${k0}`, a.time, _c3)) X.pole.lerp(_p.set(_c3[0], _c3[1], _c3[2]).normalize(), k).normalize();
        X.w = Math.max(X.w, iw);
      }
      if (c.channel('@twoHand', a.time, _c3)) G.twoHand = G.twoHand * (1 - w) + _c3[0] * w;
      if (c.channel('@look', a.time, _c3)) lookW = lookW * (1 - w) + _c3[0] * w;
      if (c.channel('@spin', a.time, _c3)) this.spin += _c3[0] * w;
    }
    // additive flinch
    if (this.chest >= 0) pose.addEuler(this.chest, this.flinchA.x * 0.6, 0, this.flinchA.y * 0.6);
    const spine = this.rig.index('spine');
    if (spine >= 0) pose.addEuler(spine, this.flinchA.x * 0.4, 0, this.flinchA.y * 0.4);
    if (this.spin !== 0) {
      const root = this.rig.index('root');
      if (root >= 0) pose.addEuler(root, 0, this.spin, 0);
    }
    this.rig.applyPose(pose);
    this.rig.object.updateMatrixWorld(true);
    // feet: never through the ground; planted when grounded and close to it
    const plant = this.plant * (1 - this.loco.w.air);
    for (const l of this.legs) plantLeg(this.rig, l, plant);
    // weapon IK (chest space → world)
    if (this.chainR && G.w > 0.001 && this.chest >= 0) {
      const chest = this.rig.bones[this.chest];
      chest.getWorldQuaternion(_cq);
      _g.copy(G.p).applyMatrix4(chest.matrixWorld);
      _d.copy(G.dir).applyQuaternion(_cq);
      _e.copy(G.edge).applyQuaternion(_cq);
      _p.copy(G.pole).applyQuaternion(_cq);
      swordQuat(_d, _e, _q);
      solveArm(this.rig, this.chainR, _g, _q, _p, Math.min(1, G.w));
      if (this.chainL && G.twoHand > 0.01) {
        _gl.copy(_g).addScaledVector(_d, -0.115);
        _p.set(1, -0.6, -0.2).applyQuaternion(_cq);
        solveArm(this.rig, this.chainL, _gl, _q, _p, Math.min(1, G.twoHand));
      }
    }
    // the other hands' own weapons (an ambidextrous fighter switching hands, a second pair of arms)
    for (const x of this.extraGrips) {
      const X = x.g;
      if (!x.chain || X.w <= 0.001 || this.chest < 0) continue;
      const chest = this.rig.bones[this.chest];
      chest.updateWorldMatrix(true, false);
      chest.getWorldQuaternion(_cq);
      _g.copy(X.p).applyMatrix4(chest.matrixWorld);
      _d.copy(X.dir).applyQuaternion(_cq);
      _e.copy(X.edge).applyQuaternion(_cq);
      _p.copy(X.pole).applyQuaternion(_cq);
      swordQuat(_d, _e, _q);
      solveArm(this.rig, x.chain, _g, _q, _p, Math.min(1, X.w));
    }
    if (this.lookTarget && this.neckHead.length) lookAt(this.rig, this.neckHead, [0.35, 0.65], this.lookTarget, 1.0, 0.6, Math.max(0, Math.min(1, lookW)));
    this.springs?.update(dt);
  }
}
