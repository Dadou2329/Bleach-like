// Procedural locomotion: idle (stance + breathing), walk, run, sprint and airborne poses, blended
// continuously by speed with a shared gait phase. Produces an FK pose plus a weapon-grip IK target.
//
// Conventions (rest pose = arms and legs hanging straight): for limbs, −X swings forward, +X back;
// shin +X bends the knee; forearm −X bends the elbow; spine/chest/head +X bend forward; +Y turns
// toward the character's left; left arm +Z raises it sideways (right arm −Z).
import * as THREE from 'three';
import type { Euler3 } from './clip';
import type { Pose } from './pose';
import type { Rig } from './rig';
import { damp } from '../core/math';

export interface GripTarget {
  p: THREE.Vector3; // grip position, chest space (m)
  dir: THREE.Vector3; // blade direction, chest space
  edge: THREE.Vector3; // edge facing, chest space
  pole: THREE.Vector3; // elbow hint, chest space
  w: number;
  twoHand: number;
}

export interface GripDef {
  p: Euler3;
  dir: Euler3;
  edge: Euler3;
  pole: Euler3;
}

export interface StanceDef {
  idle: Record<string, Euler3>;
  /** FK overrides blended in while running / sprinting / airborne */
  run?: Record<string, Euler3>;
  sprint?: Record<string, Euler3>;
  /** crouch of the idle stance (m, negative = lower) */
  idleHips?: number;
  /** free-arm swing multipliers */
  swingL?: number;
  swingR?: number;
  grip?: { idle: GripDef; walk?: GripDef; run?: GripDef; sprint?: GripDef; air?: GripDef };
  /** gait frequency multiplier (giants step slowly: ~1/sqrt(scale)) */
  freqScale?: number;
  /** speed scale for gait selection (giants walk at "high" speeds): speeds are divided by this */
  speedScale?: number;
}

export interface LocoInput {
  /** velocity in character space (x = left, z = forward), m/s */
  vx: number;
  vz: number;
  vy: number;
  grounded: boolean;
  /** yaw rate (rad/s) for banking */
  turn: number;
  /** forward acceleration (m/s²) for lean */
  accel: number;
}

interface Gait {
  thigh: number;
  knee: number;
  kneeSt: number;
  bob: number; // + = high at mid-stance (walk), − = low at mid-stance (run)
  hipYaw: number;
  chestYaw: number;
  lean: number;
  arm: number;
  elbow: number;
  freq: number; // cycles per second
}

const WALK: Gait = { thigh: 26, knee: 48, kneeSt: 8, bob: 0.012, hipYaw: 7, chestYaw: 6, lean: 3, arm: 22, elbow: 14, freq: 0.95 };
const RUN: Gait = { thigh: 48, knee: 95, kneeSt: 22, bob: -0.03, hipYaw: 12, chestYaw: 10, lean: 19, arm: 45, elbow: 85, freq: 1.45 };
const SPRINT: Gait = { thigh: 58, knee: 112, kneeSt: 26, bob: -0.035, hipYaw: 10, chestYaw: 8, lean: 34, arm: 55, elbow: 95, freq: 1.75 };

const AIR_UP: Record<string, Euler3> = {
  'thigh.L': [-55, 0, 6], 'shin.L': [80, 0, 0], 'foot.L': [20, 0, 0],
  'thigh.R': [-25, 0, -6], 'shin.R': [55, 0, 0], 'foot.R': [25, 0, 0],
  spine: [8, 0, 0], chest: [4, 0, 0], 'upperarm.L': [-20, 0, 35], 'forearm.L': [-35, 0, 0],
};
const AIR_DOWN: Record<string, Euler3> = {
  'thigh.L': [-22, 0, 8], 'shin.L': [35, 0, 0], 'foot.L': [12, 0, 0],
  'thigh.R': [8, 0, -8], 'shin.R': [28, 0, 0], 'foot.R': [18, 0, 0],
  spine: [-4, 0, 0], chest: [-3, 0, 0], 'upperarm.L': [-10, 0, 55], 'forearm.L': [-25, 0, 0],
};

const TAU = Math.PI * 2;

export class Locomotion {
  phase = 0;
  time = 0;
  readonly w = { idle: 1, walk: 0, run: 0, sprint: 0, air: 0, rise: 0 };
  private lean = 0;
  private bank = 0;
  private speed = 0;
  private strafe = 0;
  private idx: Record<string, number> = {};
  private E = new Map<number, [number, number, number]>();

  constructor(private rig: Rig, public stance: StanceDef) {
    for (const n of rig.names) this.idx[n] = rig.index(n);
  }

  update(dt: number, inp: LocoInput): void {
    this.time += dt;
    const sp = Math.hypot(inp.vx, inp.vz) / (this.stance.speedScale ?? 1);
    this.speed = damp(this.speed, sp, 10, dt);
    const s = this.speed;
    const tent = (x: number, a: number, b: number, c: number) => (x <= a || x >= c ? 0 : x < b ? (x - a) / (b - a) : (c - x) / (c - b));
    const air = inp.grounded ? 0 : 1;
    let tw = s < 0.35 ? 1 : 0, ww = 0, rw = 0, sw = 0;
    if (s >= 0.35) {
      ww = s < 1.8 ? 1 : tent(s, 0.35, 1.8, 5);
      rw = s < 5 ? Math.max(0, (s - 1.8) / 3.2) : tent(s, 1.8, 5, 13);
      sw = s >= 13 ? 1 : Math.max(0, (s - 5) / 8);
      tw = s < 0.8 ? 1 - (s - 0.35) / 0.45 : 0;
      const sum = tw + ww + rw + sw || 1;
      tw /= sum; ww /= sum; rw /= sum; sw /= sum;
    }
    const k = 9;
    this.w.idle = damp(this.w.idle, tw, k, dt);
    this.w.walk = damp(this.w.walk, ww, k, dt);
    this.w.run = damp(this.w.run, rw, k, dt);
    this.w.sprint = damp(this.w.sprint, sw, k, dt);
    this.w.air = damp(this.w.air, air, 12, dt);
    this.w.rise = damp(this.w.rise, inp.vy > 1 ? 1 : 0, 6, dt);
    const freq = this.w.idle * 0.9 + this.w.walk * WALK.freq + this.w.run * RUN.freq + this.w.sprint * SPRINT.freq;
    // phase speed follows real speed so feet roughly keep pace (stylised strides)
    this.phase = (this.phase + dt * freq * (this.stance.freqScale ?? 1) * (0.55 + Math.min(1.6, s / 7) * 0.45) * (air ? 0.4 : 1)) % 1;
    this.lean = damp(this.lean, Math.max(-12, Math.min(16, inp.accel * 0.6)), 6, dt);
    this.bank = damp(this.bank, Math.max(-22, Math.min(22, -inp.turn * s * 2.2)), 6, dt);
    this.strafe = damp(this.strafe, s > 0.5 ? Math.atan2(inp.vx, Math.max(0.1, Math.abs(inp.vz))) : 0, 8, dt);
  }

  private add(name: string, x: number, y: number, z: number, w = 1): void {
    const i = this.idx[name];
    if (i === undefined || i < 0) return;
    let e = this.E.get(i);
    if (!e) this.E.set(i, (e = [0, 0, 0]));
    e[0] += x * w; e[1] += y * w; e[2] += z * w;
  }

  private addDict(d: Record<string, Euler3> | undefined, w: number): void {
    if (!d || w <= 0.001) return;
    for (const [n, v] of Object.entries(d)) this.add(n, v[0], v[1], v[2], w);
  }

  write(pose: Pose): void {
    this.E.clear();
    const W = this.w;
    const move = W.walk + W.run + W.sprint;
    const g = (key: keyof Gait) => W.walk * WALK[key] + W.run * RUN[key] + W.sprint * SPRINT[key];
    const p = this.phase;
    const sL = Math.sin(TAU * p), cL = Math.cos(TAU * p);
    const st = this.stance;

    // ---- idle stance + breathing (weighted by the non-moving share)
    const idleW = W.idle * (1 - W.air);
    this.addDict(st.idle, idleW);
    const br = Math.sin((this.time * TAU) / 3.4);
    this.add('chest', 1.4 * br, 0, 0, idleW);
    this.add('spine', -0.6 * br, 0, 0, idleW);
    this.add('upperarm.L', 0, 0, 0.8 * br, idleW);
    this.add('upperarm.R', 0, 0, -0.8 * br, idleW);
    this.add('head', -0.8 * br, Math.sin(this.time * 0.37) * 3, 0, idleW);

    // ---- gait
    const thigh = g('thigh'), knee = g('knee'), kneeSt = g('kneeSt');
    const air = W.air;
    const ground = 1 - air;
    for (const side of ['L', 'R'] as const) {
      const s = side === 'L' ? sL : -sL;
      const c = side === 'L' ? cL : -cL;
      const sg = side === 'L' ? 1 : -1;
      const swing = Math.max(0, c);
      const tx = -thigh * s;
      const kx = knee * Math.pow(swing, 1.35) + kneeSt * Math.max(0, -c) * 0.6 + kneeSt * 0.35 * move;
      this.add(`thigh.${side}`, tx, 0, sg * 2.5 * move, ground);
      this.add(`shin.${side}`, kx, 0, 0, ground);
      this.add(`foot.${side}`, -0.55 * (tx + kx) + (s < -0.6 ? 12 * move : 0), 0, 0, ground);
    }
    // strafing: twist legs toward the movement direction, torso stays on target
    const strafeDeg = (this.strafe * 180) / Math.PI * move;
    this.add('hips', 0, strafeDeg * 0.6, 0);
    this.add('spine', 0, -strafeDeg * 0.35, 0);
    this.add('chest', 0, -strafeDeg * 0.25, 0);

    const hipYaw = g('hipYaw'), chestYaw = g('chestYaw');
    this.add('hips', 0, -hipYaw * sL, this.bank * 0.6, ground);
    this.add('spine', 0, hipYaw * 0.5 * sL, 0, ground);
    this.add('chest', 0, (hipYaw * 0.5 + chestYaw) * sL, 0, ground);
    const lean = g('lean') + this.lean;
    this.add('spine', lean * 0.55, 0, -this.bank * 0.25);
    this.add('chest', lean * 0.45, 0, -this.bank * 0.15);
    this.add('head', -lean * 0.75, -(hipYaw * 0.5 + chestYaw) * sL * 0.6, this.bank * 0.2);
    this.add('neck', -lean * 0.15, 0, 0);
    // arms: free arm swings against its leg; the weapon arm is IK'd (swing as fallback)
    const arm = g('arm'), elbow = g('elbow');
    this.add('upperarm.L', arm * sL * (st.swingL ?? 1), 0, 6 * move, ground);
    this.add('forearm.L', -elbow - arm * 0.35 * Math.max(0, sL), 0, 0, ground);
    this.add('upperarm.R', -arm * sL * (st.swingR ?? 1), 0, -6 * move, ground);
    this.add('forearm.R', -elbow - arm * 0.35 * Math.max(0, -sL), 0, 0, ground);
    this.addDict(st.run, W.run * ground);
    this.addDict(st.sprint, W.sprint * ground);

    // ---- air: blend toward tuck (rising) / extended (falling)
    if (air > 0.001) {
      const up = W.rise;
      for (const [n, v] of Object.entries(AIR_UP)) this.add(n, v[0], v[1], v[2], air * up);
      for (const [n, v] of Object.entries(AIR_DOWN)) this.add(n, v[0], v[1], v[2], air * (1 - up));
      this.add('chest', 0, 0, 0);
    }

    pose.identity();
    for (const [i, e] of this.E) pose.setEuler(i, e[0], e[1], e[2]);
    const bob = W.walk * WALK.bob * Math.cos(2 * TAU * p) + (W.run * RUN.bob + W.sprint * SPRINT.bob) * Math.cos(2 * TAU * p);
    pose.hips.set(0, (st.idleHips ?? 0) * idleW + bob * ground - 0.05 * move * ground - 0.02 * air, 0);
  }

  /** Weapon grip target for the current blend (chest space). */
  grip(out: GripTarget): void {
    const gd = this.stance.grip;
    if (!gd) {
      out.w = 0;
      return;
    }
    const W = this.w;
    const parts: [GripDef, number][] = [
      [gd.idle, W.idle * (1 - W.air)],
      [gd.walk ?? gd.idle, W.walk * (1 - W.air)],
      [gd.run ?? gd.walk ?? gd.idle, W.run * (1 - W.air)],
      [gd.sprint ?? gd.run ?? gd.idle, W.sprint * (1 - W.air)],
      [gd.air ?? gd.run ?? gd.idle, W.air],
    ];
    out.p.set(0, 0, 0); out.dir.set(0, 0, 0); out.edge.set(0, 0, 0); out.pole.set(0, 0, 0);
    let tot = 0;
    for (const [d, w] of parts) {
      if (w <= 1e-4) continue;
      tot += w;
      out.p.x += d.p[0] * w; out.p.y += d.p[1] * w; out.p.z += d.p[2] * w;
      out.dir.x += d.dir[0] * w; out.dir.y += d.dir[1] * w; out.dir.z += d.dir[2] * w;
      out.edge.x += d.edge[0] * w; out.edge.y += d.edge[1] * w; out.edge.z += d.edge[2] * w;
      out.pole.x += d.pole[0] * w; out.pole.y += d.pole[1] * w; out.pole.z += d.pole[2] * w;
    }
    if (tot > 0) out.p.divideScalar(tot);
    // running bob of the sword hand
    const s = Math.sin(TAU * this.phase);
    out.p.y += 0.025 * s * (W.run + W.sprint);
    out.p.z += 0.04 * s * (W.walk + W.run) * 0.5;
    out.dir.normalize();
    out.edge.normalize();
    out.pole.normalize();
    out.w = 1;
    out.twoHand = 0;
  }
}
