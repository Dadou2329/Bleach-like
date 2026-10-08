// Renji's kit (docs/roster/C1-lieutenants-1.md §Renji, Kit proposal). Sealed: rough 11th-Division cuts
// with the katana, an overhead cleave, Hadō #31 Shakkahō (fired again too soon it may blow up in his hand)
// and the fully chanted Shakkahō. F: "Hoero, Zabimaru" — the blade becomes six segments on a thread:
// lashes that cut along their whole length, the full-reach lash, the blind-angle lash, the constriction,
// the whirlwind and Higa Zekkō. F again: Bankai, Hihiō Zabimaru — a thirty-metre bone snake: lunges and
// sweeps, the skull smash, Hikotsu Taihō from its jaws, bite-and-carry, the enhanced Higa Zekkō and the
// segments that burrow and burst up under the enemy.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { renjiAsset, renjiProp } from '../../chars/renji';
import { HIHIO_STANCE, RENJI_CHAIN, RENJI_CLIPS, RENJI_STANCE, ZABIMARU_CHAIN } from '../../chars/renjiClips';
import { SegmentedWhip } from '../../vfx/whip';
import { BoneSnake, SKULL_MID, SNAKE_SEGS } from '../../vfx/boneSnake';
import { groundAt } from '../../vfx/iceArts';
import { Shakkaho } from '../projectiles/shakkaho';
import { CeroBeam } from '../projectiles/cero';
import { SphereShape } from '../../destruction/shapes';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from '../../vfx/sprites';
import type { AuraStyle } from '../../vfx/aura';

export const AURA_RENJI: AuraStyle = { core: '#FFD1D1', body: '#FF6B6B', rim: '#B5232E' };
export const AURA_HIHIO: AuraStyle = { core: '#FFD0C8', body: '#FF4A4A', rim: '#8E1420' };
const RED = '#FF6B6B';

type BladeDef = NonNullable<FighterDef['blade']>;
const BLADE_SEALED: BladeDef = { prop: 'sword', base: [0, 0, 0.15], tip: [0, 0.02, 0.82], color: '#FF8A8A', core: '#FFE2E2' };
const BLADE_SHIKAI: BladeDef = { prop: 'sword', base: [0, 0, 0.16], tip: [0, 0, 1.24], color: RED, core: '#FFD1D1' };
const BLADE_HANDLE: BladeDef = { prop: 'sword', base: [0, 0, 0.1], tip: [0, 0, 0.5], color: '#FF4A4A', core: '#FFD0C8' };
/** the end of the bone handle, where the snake's tail joins (handle prop frame, m) */
const HANDLE_END = new THREE.Vector3(0, 0, 0.42);

export const RENJI_DEF: FighterDef = {
  id: 'renji',
  name: 'Renji Abarai',
  title: 'Lieutenant, 6th Division',
  build: () => ({
    asset: renjiAsset('lieutenant'),
    props: [
      { key: 'sword', model: renjiProp('katana'), socket: 'grip.R' },
      { key: 'sheath', model: renjiProp('sheath-empty'), socket: 'hip.L' },
    ],
  }),
  stance: RENJI_STANCE,
  clips: RENJI_CLIPS,
  aura: AURA_RENJI,
  blade: BLADE_SEALED,
  hp: 1050,
  rei: 130,
  speed: { run: 10, sprint: 26, jump: 12.5, dash: 17, dashTime: 0.1 },
  radius: 0.36,
  height: 1.88,
};

const SPEED_BANKAI = { run: 9, sprint: 23, jump: 12, dash: 14, dashTime: 0.1 };

type Form = 'sealed' | 'shikai' | 'bankai';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
const D2R = Math.PI / 180;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const easeOut = (x: number) => 1 - (1 - clamp01(x)) ** 2;
const easeInOut = (x: number) => {
  const k = clamp01(x);
  return k * k * (3 - 2 * k);
};

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

function aim(f: Fighter, g: Game, out = new THREE.Vector3()): THREE.Vector3 {
  if (f.faceTarget) return out.copy(f.faceTarget);
  if (f === g.player) return g.aimPoint(f, out);
  return f.center(out).addScaledVector(f.forward(_v), 30);
}

/** a unit direction from yaw and pitch (radians; yaw 0 = +Z, + = turning left) */
function dirFrom(yaw: number, pitch: number, out = new THREE.Vector3()): THREE.Vector3 {
  const c = Math.cos(pitch);
  return out.set(Math.sin(yaw) * c, Math.sin(pitch), Math.cos(yaw) * c);
}

/** his left, flat */
function leftOf(f: Fighter, out = new THREE.Vector3()): THREE.Vector3 {
  const fw = f.forward(_w);
  return out.set(fw.z, 0, -fw.x);
}

/** the ground under p (or p's own height when there is none close) */
function groundUnder(g: Game, p: THREE.Vector3): number {
  return groundAt(g, p.x, p.y + 1.5, p.z, 30) ?? p.y;
}

// ------------------------------------------------------------------ sealed: the katana

interface CutInfo {
  window: [number, number];
  trail: [number, number];
  spec: BladeSpec;
  lunge: number;
  /** the blade comes down hard enough to crack the ground (radius) */
  impact?: number;
}

const CUTS: Record<string, CutInfo> = {
  slash1: { window: [0.1, 0.24], trail: [0.08, 0.33], lunge: 7, spec: { damage: 18, knock: 7, launch: 0, hitstop: 0.05, shake: 0.14, cut: 200 } },
  slash2: { window: [0.09, 0.22], trail: [0.07, 0.32], lunge: 6, spec: { damage: 18, knock: 7, launch: 3, hitstop: 0.05, shake: 0.14, cut: 200 } },
  slash3: { window: [0.21, 0.31], trail: [0.17, 0.42], lunge: 6.5, impact: 1.2, spec: { damage: 30, knock: 8, launch: 7, heavy: true, hitstop: 0.08, shake: 0.32, cut: 300 } },
  cleave: { window: [0.2, 0.3], trail: [0.16, 0.4], lunge: 6, impact: 1.6, spec: { damage: 38, knock: 12, launch: 2, heavy: true, hitstop: 0.1, shake: 0.42, cut: 360 } },
};

class CutAction extends FighterAction {
  readonly name: string;
  private info: CutInfo;
  private dur = 0;
  private comboAt = 0;
  private impacted = false;
  queued = false;

  constructor(readonly kit: RenjiKit, readonly clip: string, key: string, readonly index: number) {
    super();
    this.name = key;
    this.info = CUTS[key];
    this.mobility = 0.12;
    this.airGravity = 0.1;
  }

  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    f.bladeHits.clear();
    f.bladeSpec = this.info.spec;
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n !== 'step') return;
        const tgt = f.faceTarget;
        const extra = tgt ? Math.min(5, Math.max(0, f.pos.distanceTo(tgt) - 1.7)) : 0;
        f.push.addScaledVector(f.forward(), this.info.lunge + extra * 2.2);
        g.sfx.play(this.info.spec.heavy ? 'swingHeavy' : 'swing', f.center(), 0.8);
      },
    });
  }

  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t, info = this.info;
    f.bladeActive = t >= info.window[0] && t <= info.window[1];
    if (f.trail) f.trail.emitting = t >= info.trail[0] && t <= info.trail[1];
    if (info.impact && !this.impacted && t >= info.window[1] - 0.02) {
      this.impacted = true;
      const tip = f.blade.tip.clone();
      const gy = groundUnder(g, tip);
      if (tip.y - gy < 0.7) g.groundImpact(new THREE.Vector3(tip.x, gy, tip.z), info.impact, 180, RED, f);
    }
    if (this.queued && t >= this.comboAt) {
      this.done = true;
      this.kit.chain(this.index + 1);
      return;
    }
    if (t >= this.dur) this.done = true;
  }

  override end(f: Fighter): void {
    f.bladeActive = false;
    if (f.trail) f.trail.emitting = false;
  }

  override canCancel(next: FighterAction): boolean {
    if (next.name === 'dash' || next instanceof SkillAction) return this.t >= this.info.window[0] + 0.04;
    return false;
  }
}

abstract class SkillAction extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: RenjiKit) {
    super();
  }
  protected playClip(f: Fighter, clip: string, onEvent: (n: string) => void, speed = 1): void {
    const c = f.anim.clip(clip)!;
    this.dur = (c.dur - c.fadeOut * 0.5) / speed;
    f.anim.play(clip, { onEvent, speed });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= this.dur) this.done = true;
  }
  override end(f: Fighter): void {
    f.bladeActive = false;
    if (f.trail) f.trail.emitting = false;
  }
}

/** Q / E (sealed): Hadō #31 Shakkahō — flung from the palm, or fully chanted (bigger, slower, and close up it burns him too). */
class ShakkahoAction extends SkillAction {
  readonly name: string;
  private castAt: number;
  constructor(kit: RenjiKit, readonly chant: boolean) {
    super(kit);
    this.name = chant ? 'chant' : 'shakkaho';
    this.mobility = chant ? 0.05 : 0.3;
    this.airGravity = 0.1;
    this.armor = chant ? 0.25 : 0;
    this.castAt = chant ? 1.15 : 0.24;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, this.chant ? 'rj_chant' : 'rj_cast', (n) => {
      if (n === 'gather') {
        g.callout('破道の三十一「赤火砲」', 'HADŌ #31 — SHAKKAHŌ', '#ff8a6a');
        g.sfx.play('charge', f.center(), 0.7);
      }
      if (n === 'cast') this.kit.fireShakkaho(this.chant);
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    // the fire gathers in the open palm
    if (this.t < this.castAt && this.t > (this.chant ? 0.2 : 0.06)) {
      const p = sock(f, 'palm.L');
      const k = this.chant ? clamp01((this.t - 0.2) / 0.9) : 0.5;
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.25 + k * 0.6, sizeEnd: 0.1, life: 0.12, r: 1, g: 0.45, b: 0.25, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
      if (this.chant && Math.random() < 0.6) {
        const a = Math.random() * Math.PI * 2, r = 1 + Math.random() * 0.6;
        g.engine.glow.spawn({ x: p.x + Math.cos(a) * r, y: p.y + (Math.random() - 0.5) * r, z: p.z + Math.sin(a) * r, vx: -Math.cos(a) * r * 3.2, vy: 0, vz: -Math.sin(a) * r * 3.2, size: 0.1, sizeEnd: 0.03, life: 0.3, r: 1, g: 0.5, b: 0.3, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2 });
      }
    }
  }
}

// ------------------------------------------------------------------ Shikai: the whip

interface LashInfo {
  /** how far the whip reaches (m) */
  len: number;
  /** the far end's sweep, from → to: yaw (deg, + = his left) and pitch (deg, + = up), around the aim */
  yaw: [number, number];
  pitch: [number, number];
  /** time for the segments to fly out (s) */
  out: number;
  bend?: number;
  wave?: number;
  spec: BladeSpec;
  /** the far end comes down on the ground: a gouge and a burst of rubble (radius) */
  slam?: number;
  lunge: number;
}

const LASHES: Record<string, LashInfo> = {
  rj_lash1: { len: 8, yaw: [-55, 60], pitch: [6, 0], out: 0.1, wave: 0.12, lunge: 4, spec: { damage: 22, knock: 8, launch: 1, hitstop: 0.05, shake: 0.16, cut: 260 } },
  rj_lash2: { len: 8, yaw: [50, -55], pitch: [-10, 18], out: 0.1, wave: 0.12, lunge: 4, spec: { damage: 22, knock: 7, launch: 7, hitstop: 0.05, shake: 0.16, cut: 260 } },
  rj_lash3: { len: 9.5, yaw: [0, 0], pitch: [60, -40], out: 0.12, slam: 1.4, lunge: 3, spec: { damage: 34, knock: 10, launch: 3, heavy: true, hitstop: 0.09, shake: 0.4, cut: 340 } },
  rj_reach: { len: 25, yaw: [3, -3], pitch: [62, -16], out: 0.16, slam: 2.2, wave: 0.3, lunge: 2, spec: { damage: 50, knock: 14, launch: 4, heavy: true, hitstop: 0.1, shake: 0.5, cut: 420 } },
  rj_shikai: { len: 9, yaw: [-40, 45], pitch: [4, 0], out: 0.1, wave: 0.2, lunge: 0, spec: { damage: 20, knock: 8, launch: 2, hitstop: 0.05, shake: 0.2, cut: 260 } },
};

/** Flies the whip out along a lash: the far end sweeps across the aim, the segments slice what they pass. */
class LashDriver {
  private started = false;
  private slammed = false;
  private yaw0 = 0;
  private pitch0 = 0;
  constructor(readonly kit: RenjiKit, readonly info: LashInfo, readonly lashT: number, readonly backT: number) {}

  update(f: Fighter, g: Game, t: number): void {
    const w = this.kit.whip;
    if (!w || t < this.lashT) return;
    const info = this.info;
    if (!this.started) {
      this.started = true;
      f.bladeHits.clear();
      const a = aim(f, g).sub(f.center());
      this.yaw0 = Math.atan2(a.x, a.z);
      this.pitch0 = Math.atan2(a.y, Math.hypot(a.x, a.z)) * 0.6;
      g.sfx.play(info.spec.heavy ? 'swingHeavy' : 'swing', f.center(), 1);
    }
    const k = easeOut((t - this.lashT) / (this.backT - this.lashT));
    const yaw = this.yaw0 + THREE.MathUtils.lerp(info.yaw[0], info.yaw[1], k) * D2R;
    const pitch = this.pitch0 + THREE.MathUtils.lerp(info.pitch[0], info.pitch[1], k) * D2R;
    const T = f.center().addScaledVector(dirFrom(yaw, pitch, _v), info.len);
    // the far end comes down on the ground, not through it
    const floor = f.pos.y - 0.3;
    if (T.y < floor) T.y = floor;
    w.target.copy(T);
    w.bend = info.bend ?? 0;
    w.wave = info.wave ?? 0;
    w.ext = t < this.backT ? easeOut((t - this.lashT) / info.out) : Math.max(0, 1 - (t - this.backT) / 0.2);
    w.sweep = t < this.backT + 0.04 && w.ext > 0.25 ? info.spec : null;
    if (info.slam && !this.slammed && k > 0.86 && t < this.backT) {
      this.slammed = true;
      const gy = groundAt(g, w.tip.x, w.tip.y + 2, w.tip.z, 6);
      if (gy !== null) {
        g.groundImpact(new THREE.Vector3(w.tip.x, gy, w.tip.z), info.slam, 120 + info.slam * 80, RED, f);
        if (f === g.player) g.shake(0.15 + info.slam * 0.1);
      }
    }
  }
}

/** LMB / RMB (Shikai): the lashes and the full-reach lash. */
class LashAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private drive: LashDriver;
  private lashT: number;
  queued = false;

  constructor(readonly kit: RenjiKit, readonly clip: string, readonly index: number, f: Fighter) {
    super();
    this.name = clip;
    this.mobility = 0.15;
    this.airGravity = 0.1;
    const c = f.anim.clip(clip)!;
    this.lashT = c.events.lash ?? 0.15;
    this.drive = new LashDriver(kit, LASHES[clip], this.lashT, c.events.back ?? this.lashT + 0.25);
  }

  override start(f: Fighter): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.7;
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n === 'step') f.push.addScaledVector(f.forward(), LASHES[this.clip].lunge);
      },
    });
  }

  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    this.drive.update(f, g, this.t);
    if (this.queued && this.t >= this.comboAt) {
      this.done = true;
      this.kit.chain(this.index + 1);
      return;
    }
    if (this.t >= this.dur) this.done = true;
  }

  override end(): void {
    if (this.kit.whip) this.kit.whip.sweep = null;
  }

  override canCancel(next: FighterAction): boolean {
    if (next.name === 'dash' || next instanceof SkillAction) return this.t >= this.lashT + 0.05;
    return false;
  }
}

/** Q (Shikai): the blind-angle lash — the whip curls wide round the target and takes it from behind. */
class CurveAction extends SkillAction {
  readonly name = 'curve';
  private lashT = 0.16;
  private backT = 0.5;
  private started = false;
  private side: number;
  private spec: BladeSpec = { damage: 32, knock: 7, launch: 2, heavy: true, hitstop: 0.08, shake: 0.3, cut: 300 };
  constructor(kit: RenjiKit, readonly target: Fighter | null) {
    super(kit);
    this.mobility = 0.12;
    this.airGravity = 0.1;
    this.side = kit.nextCurveSide();
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'rj_curve', (n) => {
      if (n === 'step') f.push.addScaledVector(f.forward(), 3);
      if (n === 'lash') g.sfx.play('swingHeavy', f.center(), 1);
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const w = this.kit.whip;
    const t = this.t;
    if (!w || t < this.lashT) return;
    if (!this.started) {
      this.started = true;
      f.bladeHits.clear();
    }
    const o = this.target && !this.target.dead ? this.target : null;
    const tc = o ? o.center() : f.center().addScaledVector(f.forward(), 8);
    const fwd = _w.subVectors(tc, f.center()).setY(0);
    if (fwd.lengthSq() < 1e-4) f.forward(fwd);
    fwd.normalize();
    const left = new THREE.Vector3(fwd.z, 0, -fwd.x);
    const k = easeOut((t - this.lashT) / (this.backT - this.lashT));
    // the far end goes out round behind the target, then hooks back through it
    w.target.copy(tc).addScaledVector(fwd, 1.8 - 3 * k).addScaledVector(left, this.side * 1.6 * (1 - k));
    w.bend = 1.25 * this.side;
    w.wave = 0.08;
    w.ext = t < this.backT ? easeOut((t - this.lashT) / 0.12) : Math.max(0, 1 - (t - this.backT) / 0.22);
    w.sweep = t < this.backT + 0.04 && w.ext > 0.3 ? this.spec : null;
  }
  override end(f: Fighter): void {
    super.end(f);
    if (this.kit.whip) this.kit.whip.sweep = null;
  }
}

/** E (Shikai): the constriction — the whip coils round the target, then a hard pull crushes and hauls it in. */
class WrapAction extends SkillAction {
  readonly name = 'wrap';
  private lashT = 0.15;
  private pullT = 0.62;
  private caught = false;
  private pulled = false;
  private wrapK = 0;
  constructor(kit: RenjiKit, readonly target: Fighter | null) {
    super(kit);
    this.mobility = 0.05;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'rj_wrap', (n) => {
      if (n === 'step') f.push.addScaledVector(f.forward(), 3);
      if (n === 'lash') g.sfx.play('swing', f.center(), 1);
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const w = this.kit.whip;
    const t = this.t;
    if (!w || t < this.lashT) return;
    const o = this.target && !this.target.dead ? this.target : null;
    const reach = 14;
    const tc = o ? o.center() : f.center().addScaledVector(f.forward(), reach);
    const far = !o || o.pos.distanceTo(f.pos) > reach;
    if (far) tc.copy(f.center()).addScaledVector(_v.subVectors(tc, f.center()).normalize(), reach);
    w.target.copy(tc);
    w.bend = 0;
    w.wave = 0.1;
    w.sweep = null;
    if (!this.pulled) w.ext = easeOut((t - this.lashT) / 0.12);
    // the coil closes round the target
    if (!this.caught && o && !far && w.ext > 0.95) {
      this.caught = true;
      g.damage(o, 10, f, _v.subVectors(o.pos, f.pos).setY(0).normalize(), { knock: 0, hitstop: 0.05, shake: 0.15 });
      g.sfx.play('crack', o.center(), 0.8);
    }
    if (this.caught && o && !this.pulled) {
      this.wrapK = Math.min(1, this.wrapK + dt / 0.14);
      w.wrap = easeOut(this.wrapK);
      w.wrapAt.copy(o.center()).y -= 0.15;
      w.wrapR = o.def.radius + 0.3;
      // held fast
      o.hitstun = Math.max(o.hitstun, 0.3);
      o.push.set(0, 0, 0);
      o.body.vel.set(0, Math.min(0, o.body.vel.y) * 0.3, 0);
    }
    if (!this.pulled && t >= this.pullT) {
      this.pulled = true;
      if (this.caught && o && !o.dead) {
        // squeeze, then haul him in
        const toMe = new THREE.Vector3().subVectors(f.pos, o.pos).setY(0);
        const d = toMe.length();
        toMe.normalize();
        g.damage(o, 44, f, toMe.clone(), { knock: Math.min(24, 6 + d * 1.6), launch: 5, heavy: true, hitstop: 0.12, shake: 0.5 });
        for (const p of w.segPos) g.sparks(p, toMe, RED, 5);
        g.sfx.play('swingHeavy', o.center(), 1.2);
      }
    }
    if (this.pulled) {
      const k = (t - this.pullT) / 0.28;
      w.wrapR = Math.max(0.12, w.wrapR - dt * 6);
      w.wrap = this.caught ? Math.max(0, 1 - k) : 0;
      w.ext = Math.max(0, 1 - k);
    }
  }
}

/** R (Shikai): the whirlwind — the blade whirled overhead on its thread; a gale that throws everything back. */
class SpinAction extends SkillAction {
  readonly name = 'whirlwind';
  private spinT = 0.12;
  private stopT = 1.25;
  private ang = 0;
  private lastQuarter = 0;
  private gust = 0;
  private blown = false;
  private spec: BladeSpec = { damage: 9, knock: 10, launch: 3, hitstop: 0.02, shake: 0.08, cut: 230 };
  constructor(kit: RenjiKit) {
    super(kit);
    this.mobility = 0.35;
    this.armor = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    this.ang = f.yaw;
    this.playClip(f, 'rj_spin', (n) => {
      if (n === 'spin') g.sfx.play('swingHeavy', f.center(), 1);
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const w = this.kit.whip;
    const t = this.t;
    if (!w || t < this.spinT) return;
    if (t < this.stopT) {
      this.ang += 16.7 * dt;
      const q = Math.floor((this.ang - f.yaw) / (Math.PI / 2));
      if (q !== this.lastQuarter) {
        this.lastQuarter = q;
        f.bladeHits.clear();
        if (q % 2 === 0) g.sfx.play('swing', f.center(), 0.7);
      }
      const hand = sock(f, 'grip.R');
      w.target.set(hand.x + Math.sin(this.ang) * 4.6, hand.y + 0.5, hand.z + Math.cos(this.ang) * 4.6);
      w.bend = 0.3;
      w.wave = 0.1;
      w.ext = easeOut((t - this.spinT) / 0.15);
      w.sweep = w.ext > 0.4 ? this.spec : null;
      // the gale
      this.gust += dt;
      if (this.gust > 0.08) {
        this.gust = 0;
        for (const o of g.enemiesOf(f)) {
          const d = _v.subVectors(o.pos, f.pos).setY(0);
          const len = d.length();
          if (len > 8 || len < 1e-3) continue;
          o.push.addScaledVector(d.normalize(), 1.6 * (1 - len / 8));
        }
        for (let i = 0; i < 4; i++) {
          const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 5;
          g.engine.dust.spawn({ x: f.pos.x + Math.cos(a) * r, y: f.pos.y + 0.2 + Math.random() * 2, z: f.pos.z + Math.sin(a) * r, vx: -Math.sin(a) * 9 + Math.cos(a) * 3, vy: 1 + Math.random() * 2, vz: Math.cos(a) * 9 + Math.sin(a) * 3, size: 0.6, sizeEnd: 1.8, life: 0.7, r: 0.75, g: 0.7, b: 0.62, alpha: 0.35, alphaEnd: 0, tex: TEX_PUFF, drag: 1.2 });
        }
      }
    } else {
      w.sweep = null;
      w.ext = Math.max(0, 1 - (t - this.stopT) / 0.2);
      if (!this.blown) {
        this.blown = true;
        g.addRing(f.pos.clone().setY(f.pos.y + 0.3), 16, '#FFD1D1', 0.45);
        for (const o of g.enemiesOf(f)) {
          const d = _v.subVectors(o.pos, f.pos).setY(0);
          const len = d.length();
          if (len > 8.5) continue;
          g.damage(o, 16, f, d.normalize().clone(), { knock: 20 * (1 - len / 10), launch: 5, heavy: true, hitstop: 0.06, shake: 0.3 });
        }
      }
    }
  }
  override end(f: Fighter): void {
    super.end(f);
    if (this.kit.whip) this.kit.whip.sweep = null;
  }
}

/** G (Shikai): Higa Zekkō — the segments torn off the thread, levelled at the target from all round, and fired. */
class HigaAction extends SkillAction {
  readonly name = 'higa';
  private struck = false;
  private ring: THREE.Vector3[] = [];
  constructor(kit: RenjiKit, readonly target: Fighter) {
    super(kit);
    this.mobility = 0.05;
    this.armor = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'rj_cast', () => {});
    this.dur = 1.6;
    g.callout('狒牙絶咬', 'HIGA ZEKKŌ', '#ff8a8a');
    g.sfx.play('charge', f.center(), 0.8);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      this.ring.push(new THREE.Vector3(Math.cos(a), (i % 2 ? 0.5 : -0.4), Math.sin(a)));
    }
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const w = this.kit.whip;
    if (!w) return;
    const t = this.t;
    const o = this.target.dead ? null : this.target;
    const tc = o ? o.center() : f.center().addScaledVector(f.forward(), 8);
    const c = f.center().addScaledVector(UP, 0.8);
    w.ext = 0;
    w.sweep = null;
    w.glow = Math.min(1, t / 0.4);
    for (let i = 0; i < 6; i++) {
      const r = this.ring[i];
      const spin = t * 2.2;
      const ca = Math.cos(spin), sa = Math.sin(spin);
      const rx = r.x * ca - r.z * sa, rz = r.x * sa + r.z * ca;
      const nearMe = _v.set(c.x + rx * 1.6, c.y + r.y * 0.6, c.z + rz * 1.6);
      const round = _w.set(tc.x + rx * 3.4, tc.y + r.y * 1.4, tc.z + rz * 3.4);
      const p = w.freePos[i];
      if (t < 0.45) p.copy(nearMe);
      else if (t < 0.75) p.lerpVectors(nearMe, round, easeInOut((t - 0.45) / 0.3));
      else if (t < 0.9) p.lerpVectors(round, tc, easeOut((t - 0.75 - i * 0.012) / 0.12));
      else p.lerpVectors(tc, nearMe, easeInOut((t - 0.9) / 0.4));
      const look = t < 0.45 ? _w.subVectors(p, c) : _w.subVectors(tc, p);
      if (look.lengthSq() > 1e-4) w.freeDir[i].copy(look.normalize());
      w.freeW[i] = t < 1.2 ? easeOut(t / 0.3) : Math.max(0, 1 - (t - 1.2) / 0.3);
    }
    if (!this.struck && t >= 0.86) {
      this.struck = true;
      if (o && o.center().distanceTo(tc) < 1.5) {
        g.damage(o, 70, f, _v.subVectors(o.pos, f.pos).setY(0).normalize().clone(), { knock: 8, launch: 6, heavy: true, hitstop: 0.14, shake: 0.55 });
        for (let i = 0; i < 6; i++) g.sparks(o.center(), _v.subVectors(o.center(), w.freePos[i]).normalize().clone(), RED, 6);
      }
      g.engine.destruction.carve(new SphereShape(tc.clone(), 1.3, 0.9), { mode: 'smash', power: 160, impulse: 8 });
      g.addRing(tc.clone(), 6, RED, 0.35);
      g.sfx.play('impact', tc, 1.1);
    }
  }
  override end(f: Fighter): void {
    super.end(f);
    const w = this.kit.whip;
    if (w) w.freeW.fill(0);
  }
}

// ------------------------------------------------------------------ Bankai: the bone snake

/** where the skull rests: above his right shoulder, a little ahead, watching the enemy */
function idleHead(f: Fighter, t: number, out = new THREE.Vector3()): THREE.Vector3 {
  const fw = f.forward(_w);
  const left = leftOf(f, _v);
  return out.copy(f.pos).addScaledVector(fw, 1.6).addScaledVector(left, -3.2 + Math.sin(t * 0.7) * 0.5).add(new THREE.Vector3(0, 6.6 + Math.sin(t * 1.1) * 0.4, 0));
}

abstract class SnakeAction extends SkillAction {
  readonly drivesSnake = true;
  override end(f: Fighter): void {
    super.end(f);
    const s = this.kit.snake;
    if (s) {
      s.dmg = 0;
      s.smash = false;
    }
  }
}

/** LMB (Bankai): the snake sent in — a lunging bite, a sweep across, a rising strike that launches. */
class SnakeStrikeAction extends SnakeAction {
  readonly name: string;
  private strikeT = 0.2;
  private comboAt = 0.4;
  private begun = false;
  private from = new THREE.Vector3();
  private aimAt = new THREE.Vector3();
  queued = false;
  constructor(kit: RenjiKit, readonly index: number, readonly target: Fighter | null) {
    super(kit);
    this.name = `snake${index}`;
    this.mobility = 0.25;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'rj_command', (n) => {
      if (n === 'step') f.push.addScaledVector(f.forward(), 2);
      if (n === 'strike') g.sfx.play('swingHeavy', f.center(), 1.3);
    });
    this.dur = 0.85;
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const s = this.kit.snake;
    if (!s) return;
    const t = this.t;
    const o = this.target && !this.target.dead ? this.target : null;
    const tc = o ? o.center() : aim(f, g);
    // never further than the snake can reach
    const reach = 24;
    if (tc.distanceTo(f.pos) > reach) tc.copy(f.pos).addScaledVector(_v.subVectors(tc, f.pos).normalize(), reach);
    s.lookAt = tc;
    if (t < this.strikeT) {
      // drawn back, coiled to strike
      s.follow = 5;
      s.headWant.copy(idleHead(f, g.time)).addScaledVector(f.forward(_v), -1.5).y += 1;
      return;
    }
    if (!this.begun) {
      this.begun = true;
      this.from.copy(s.head);
      this.aimAt.copy(tc);
      const v = this.index % 3;
      s.swing(v === 2 ? 34 : 30, v === 1 ? 18 : 12, v === 2 ? 13 : 4);
      s.smash = true;
    }
    const k = clamp01((t - this.strikeT) / 0.4);
    if (k < 1) {
      s.follow = 10;
      const v = this.index % 3;
      const fw = _w.subVectors(this.aimAt, f.pos).setY(0).normalize();
      const left = new THREE.Vector3(fw.z, 0, -fw.x);
      if (v === 0) {
        // the lunge: straight through, jaws first
        s.headWant.copy(s.biteAt(this.aimAt)).addScaledVector(fw, 2.5);
      } else if (v === 1) {
        // the sweep: across the target at chest height, from his right to his left
        const p = new THREE.Vector3().copy(this.aimAt).addScaledVector(left, THREE.MathUtils.lerp(-8, 8, easeInOut(k)));
        s.headWant.copy(p).addScaledVector(s.facing, -SKULL_MID);
      } else {
        // the rise: up from the ground under the target, carrying it into the air
        const gy = groundUnder(g, this.aimAt);
        const p = new THREE.Vector3(this.aimAt.x, THREE.MathUtils.lerp(gy - 1.5, this.aimAt.y + 7, easeOut(k)), this.aimAt.z).addScaledVector(fw, -1.2);
        s.headWant.copy(p).addScaledVector(s.facing, -SKULL_MID);
      }
    } else {
      s.dmg = 0;
      s.smash = false;
    }
    if (this.queued && t >= this.comboAt + 0.15) {
      this.done = true;
      this.kit.chain(this.index + 1);
    }
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' || (next instanceof SkillAction && this.t > this.strikeT + 0.1);
  }
}

/** RMB (Bankai): raised high, the skull is brought down on the target — a crater. */
class SkullSmashAction extends SnakeAction {
  readonly name = 'smash';
  private raiseT = 0.18;
  private slamT = 0.48;
  private hitGround = false;
  private spot = new THREE.Vector3();
  private gy = 0;
  constructor(kit: RenjiKit, readonly target: Fighter | null) {
    super(kit);
    this.mobility = 0.1;
    this.armor = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'rj_slam', (n) => {
      if (n === 'slam') g.sfx.play('swingHeavy', f.center(), 1.4);
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const s = this.kit.snake;
    if (!s) return;
    const t = this.t;
    const o = this.target && !this.target.dead ? this.target : null;
    if (t < this.slamT) {
      const tc = o ? o.center() : aim(f, g);
      if (tc.distanceTo(f.pos) > 26) tc.copy(f.pos).addScaledVector(_v.subVectors(tc, f.pos).normalize(), 26);
      this.spot.copy(tc);
      this.gy = groundUnder(g, tc);
      if (t >= this.raiseT) {
        // reared up over the target, looking down at it
        s.follow = 4.5;
        const back = _w.subVectors(f.pos, tc).setY(0).normalize();
        s.headWant.copy(tc).addScaledVector(back, 4).y = this.gy + 13;
        s.lookAt = tc;
      }
      return;
    }
    if (!this.hitGround) {
      if (t - this.slamT < dt * 1.5) {
        s.swing(62, 8, 10);
        s.smash = true;
      }
      s.follow = 13;
      s.lookAt = null;
      s.headWant.copy(this.spot).setY(this.gy + 0.8).addScaledVector(s.facing, -SKULL_MID);
      const c = s.skullCenter(_v);
      if (c.y < this.gy + 1.8 || t > this.slamT + 0.32) {
        this.hitGround = true;
        const p = new THREE.Vector3(c.x, this.gy, c.z);
        g.groundImpact(p, 3.2, 320, RED, f);
        s.dust(p, 30, 12);
        g.shake(f === g.player ? 0.7 : 0.35);
      }
    } else {
      s.dmg = 0;
      s.smash = false;
    }
  }
}

/** Q (Bankai): Hikotsu Taihō — the skull levels its jaws and a red beam pours out; the recoil scatters the snake. */
class TaihoAction extends SnakeAction {
  readonly name = 'taiho';
  private beam: CeroBeam | null = null;
  private scattered = false;
  constructor(kit: RenjiKit, readonly target: Fighter | null) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.35;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'rj_roar', (n) => {
      const s = this.kit.snake;
      if (n !== 'charge' || !s) return;
      const o = this.target;
      this.beam = new CeroBeam(g, f, s.mouth, () => (o && !o.dead ? o.center() : aim(f, g)), { charge: 0.45, fire: 0.75, radius: 0.85, damage: 150, power: 650, core: '#FFD0C8', body: '#FF2E2E', rim: '#8E1420', range: 150, track: 0.9, gain: 1.5 });
      g.addProjectile(this.beam);
      g.callout('狒骨大砲', 'HIKOTSU TAIHŌ', '#ff6b6b');
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const s = this.kit.snake;
    if (!s) return;
    const t = this.t;
    const o = this.target && !this.target.dead ? this.target : null;
    const tc = o ? o.center() : aim(f, g);
    // the skull comes down beside him and levels its jaws
    const fw = _w.subVectors(tc, f.pos).setY(0).normalize();
    const left = new THREE.Vector3(fw.z, 0, -fw.x);
    const recoil = t > 0.6 && t < 1.3 ? Math.sin(t * 60) * 0.12 - 0.6 : 0;
    s.follow = 5;
    s.headWant.copy(f.pos).addScaledVector(fw, 0.6 + recoil).addScaledVector(left, -2.6).y += 3.6;
    s.lookAt = tc;
    s.glow = Math.min(1, t / 0.6);
    if (!this.scattered && t > 1.3) {
      this.scattered = true;
      s.scatter = 1;
      s.dust(s.skullCenter(), 12, 5);
    }
  }
}

/** E (Bankai): bite and carry — the jaws close on the target, lift it, and smash it into the ground. */
class BiteAction extends SnakeAction {
  readonly name = 'bite';
  private phase: 'lunge' | 'carry' | 'back' = 'lunge';
  private carryT = 0;
  private lift = new THREE.Vector3();
  private slamAt = new THREE.Vector3();
  constructor(kit: RenjiKit, readonly target: Fighter) {
    super(kit);
    this.mobility = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'rj_command', (n) => {
      if (n === 'strike') g.sfx.play('swingHeavy', f.center(), 1.3);
    });
    this.dur = 2.4;
    const s = this.kit.snake;
    if (s) {
      s.swing(0);
      s.smash = true;
    }
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const s = this.kit.snake;
    if (!s) return;
    const o = this.target.dead ? null : this.target;
    const t = this.t;
    if (this.phase === 'lunge') {
      if (!o || t > 0.85) {
        this.phase = 'back';
        this.dur = Math.min(this.dur, t + 0.4);
        return;
      }
      if (t > 0.16) {
        s.follow = 9;
        s.headWant.copy(s.biteAt(o.center()));
        s.lookAt = o.center();
      }
      const mouth = s.mouth.getWorldPosition(_v);
      if (t > 0.16 && mouth.distanceTo(o.center()) < 2.1) {
        this.phase = 'carry';
        g.damage(o, 22, f, _w.subVectors(o.pos, f.pos).setY(0).normalize().clone(), { knock: 0, heavy: true, hitstop: 0.12, shake: 0.4 });
        g.sfx.play('crack', mouth, 1.2);
        this.lift.copy(s.head).y += 9;
        const fw = f.forward(_w);
        this.slamAt.copy(f.pos).addScaledVector(fw, 9).addScaledVector(leftOf(f), (Math.random() - 0.5) * 8);
        this.slamAt.y = groundUnder(g, this.slamAt);
        f.anim.play('rj_slam');
      }
      return;
    }
    if (this.phase === 'carry' && o) {
      this.carryT += dt;
      const k = this.carryT;
      if (k < 0.55) {
        s.follow = 7;
        s.headWant.copy(this.lift);
        s.lookAt = null;
      } else {
        s.follow = 13;
        s.headWant.copy(this.slamAt).addScaledVector(s.facing, -SKULL_MID).y += 0.6;
      }
      // held in the jaws
      const mouth = s.mouth.getWorldPosition(_v);
      o.body.pos.set(mouth.x, mouth.y - o.def.height * 0.5, mouth.z);
      o.body.vel.set(0, 0, 0);
      o.push.set(0, 0, 0);
      o.hitstun = Math.max(o.hitstun, 0.3);
      if ((k > 0.55 && mouth.y < this.slamAt.y + 1.4) || k > 1.25) {
        this.phase = 'back';
        this.dur = Math.min(this.dur, t + 0.5);
        const p = new THREE.Vector3(mouth.x, this.slamAt.y, mouth.z);
        g.groundImpact(p, 2.6, 300, RED, f);
        g.damage(o, 58, f, _w.subVectors(o.pos, f.pos).setY(0).normalize().clone(), { knock: 10, launch: 6, heavy: true, hitstop: 0.14, shake: 0.6 });
        s.dust(p, 26, 11);
        s.smash = false;
      }
    } else if (this.phase === 'carry') {
      this.phase = 'back';
    }
  }
}

/** R (Bankai): the enhanced Higa Zekkō — every vertebra glows, rings the target and strikes from all sides. */
class HigaSnakeAction extends SnakeAction {
  readonly name = 'higa2';
  private dirs: THREE.Vector3[] = [];
  private ticked = new Set<number>();
  private struck = false;
  constructor(kit: RenjiKit, readonly target: Fighter) {
    super(kit);
    this.mobility = 0.05;
    this.armor = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'rj_cast', () => {});
    this.dur = 2.3;
    g.callout('狒牙絶咬', 'HIGA ZEKKŌ', '#ff8a8a');
    g.sfx.play('charge', f.center(), 1);
    // a sphere of directions round the target (fibonacci, the lower half flattened)
    for (let i = 0; i < SNAKE_SEGS; i++) {
      const y = 1 - (i + 0.5) / SNAKE_SEGS * 1.6;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const a = i * 2.39996;
      this.dirs.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r).normalize());
    }
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const s = this.kit.snake;
    if (!s) return;
    const t = this.t;
    const o = this.target.dead ? null : this.target;
    const tc = o ? o.center() : aim(f, g);
    s.glow = Math.min(1, t / 0.5);
    s.lookAt = tc;
    const spin = t * 0.9;
    const ca = Math.cos(spin), sa = Math.sin(spin);
    for (let i = 0; i < SNAKE_SEGS; i++) {
      const d = this.dirs[i];
      const R = t < 1.05 ? THREE.MathUtils.lerp(8, 6, clamp01((t - 0.5) / 0.55)) : THREE.MathUtils.lerp(6, 0.6, easeOut((t - 1.05 - i * 0.006) / 0.2));
      const p = s.freePos[i].set(tc.x + (d.x * ca - d.z * sa) * R, tc.y + d.y * R, tc.z + (d.x * sa + d.z * ca) * R);
      s.freeDir[i].subVectors(tc, p);
      if (s.freeDir[i].lengthSq() < 1e-4) s.freeDir[i].copy(UP);
      s.freeDir[i].normalize();
      s.freeW[i] = t < 1.4 ? easeOut((t - i * 0.015) / 0.5) : Math.max(0, 1 - (t - 1.4 - i * 0.02) / 0.45);
      // each vertebra that arrives bites in
      if (o && t > 1.05 && R < 1.4 && !this.ticked.has(i)) {
        this.ticked.add(i);
        g.damage(o, 3.5, f, _w.subVectors(o.pos, p).setY(0).normalize().clone(), { knock: 0.5, quiet: true });
      }
    }
    if (!this.struck && t > 1.28) {
      this.struck = true;
      if (o && o.center().distanceTo(tc) < 2) {
        g.damage(o, 42, f, _w.subVectors(o.pos, f.pos).setY(0).normalize().clone(), { knock: 6, launch: 8, heavy: true, hitstop: 0.16, shake: 0.6 });
        g.sparks(o.center(), UP, RED, 30);
      }
      g.engine.destruction.carve(new SphereShape(tc.clone(), 2.2, 0.9), { mode: 'smash', power: 220, impulse: 10 });
      g.addRing(tc.clone(), 10, RED, 0.45);
      g.sfx.play('impact', tc, 1.5);
    }
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.snake?.freeW.fill(0);
  }
}

/** G (Bankai): the burrow — part of the body dives into the ground and bursts up under the target. */
class BurrowAction extends SnakeAction {
  readonly name = 'burrow';
  private first = 5;
  private count = 10;
  private entry = new THREE.Vector3();
  private exit = new THREE.Vector3();
  private dived = false;
  private erupted = false;
  private rumble = 0;
  constructor(kit: RenjiKit, readonly target: Fighter) {
    super(kit);
    this.mobility = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'rj_slam', () => {});
    this.dur = 2.2;
    const fw = f.forward(_w);
    this.entry.copy(f.pos).addScaledVector(fw, 3.5);
    this.entry.y = groundUnder(g, this.entry);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const s = this.kit.snake;
    if (!s) return;
    const t = this.t;
    const o = this.target.dead ? null : this.target;
    if (t < 1.2 && o) {
      this.exit.copy(o.pos);
      this.exit.y = groundUnder(g, o.pos);
    }
    for (let j = 0; j < this.count; j++) {
      const i = this.first + j;
      const p = s.freePos[i];
      const lag = j * 0.025;
      if (t < 0.85) {
        // diving in, one after another
        const k = easeInOut((t - 0.4 - lag) / 0.4);
        p.copy(this.entry).y -= 0.5 + k * 2.5;
        s.freeDir[i].set(0, -1, 0).addScaledVector(_v.subVectors(this.exit, this.entry).setY(0).normalize(), 0.4).normalize();
        s.freeW[i] = easeOut((t - 0.35 - lag) / 0.3);
      } else if (t < 1.25) {
        // underground, racing toward the target
        const k = easeInOut((t - 0.85 - lag) / 0.4);
        p.lerpVectors(this.entry, this.exit, k).y -= 3;
        s.freeDir[i].subVectors(this.exit, this.entry).setY(0).normalize();
        s.freeW[i] = 1;
      } else {
        // bursting up in a ring under the target
        const a = (j / this.count) * Math.PI * 2;
        const k = easeOut((t - 1.25 - lag * 0.4) / 0.25);
        p.set(this.exit.x + Math.cos(a) * 1.3, this.exit.y - 2.5 + k * 6.5, this.exit.z + Math.sin(a) * 1.3);
        s.freeDir[i].set(Math.cos(a) * 0.3, 1, Math.sin(a) * 0.3).normalize();
        s.freeW[i] = t < 1.65 ? 1 : Math.max(0, 1 - (t - 1.65 - lag) / 0.4);
      }
    }
    if (!this.dived && t > 0.45) {
      this.dived = true;
      g.engine.destruction.carve(new SphereShape(this.entry.clone(), 1.6, 0.8), { mode: 'smash', power: 220, impulse: 8 });
      s.dust(this.entry, 18, 7);
      g.sfx.play('crumble', this.entry, 1.2);
    }
    // a rumble races along the ground over them
    if (t > 0.85 && t < 1.25) {
      this.rumble += dt;
      if (this.rumble > 0.04) {
        this.rumble = 0;
        const p = _v.lerpVectors(this.entry, this.exit, easeInOut((t - 0.85) / 0.4));
        g.engine.dust.spawn({ x: p.x, y: p.y + 0.2, z: p.z, vx: (Math.random() - 0.5) * 3, vy: 1 + Math.random() * 2, vz: (Math.random() - 0.5) * 3, size: 0.6, sizeEnd: 1.8, life: 0.8, r: 0.66, g: 0.6, b: 0.52, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
        if (f === g.player) g.shake(0.05);
      }
    }
    if (!this.erupted && t > 1.28) {
      this.erupted = true;
      g.engine.destruction.carve(new SphereShape(this.exit.clone(), 2.4, 0.7), { mode: 'smash', power: 280, impulse: 14 });
      g.addRing(this.exit.clone(), 9, RED, 0.45);
      s.dust(this.exit, 26, 10);
      g.sfx.play('explode', this.exit, 1.3);
      for (const e of g.enemiesOf(f)) {
        const d = Math.hypot(e.pos.x - this.exit.x, e.pos.z - this.exit.z);
        if (d > 3 || Math.abs(e.pos.y - this.exit.y) > 3) continue;
        g.damage(e, 56, f, _v.subVectors(e.pos, f.pos).setY(0).normalize().clone(), { knock: 4, launch: 14, heavy: true, hitstop: 0.12, shake: 0.5 });
      }
    }
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.snake?.freeW.fill(0);
  }
}

// ------------------------------------------------------------------ releases

/** F: "Hoero, Zabimaru" (and the first lash) / "Bankai — Hihiō Zabimaru". */
class ReleaseAction extends SkillAction {
  readonly name = 'release';
  private drive: LashDriver | null = null;
  private storm = 0;
  constructor(kit: RenjiKit, readonly bankai: boolean) {
    super(kit);
    this.invulnerable = true;
    this.trackTarget = !bankai;
  }
  override start(f: Fighter, g: Game): void {
    if (!this.bankai) this.drive = new LashDriver(this.kit, LASHES.rj_shikai, 0.64, 0.95);
    this.playClip(f, this.bankai ? 'rj_bankai' : 'rj_shikai', (n) => {
      if (n === 'howl') {
        g.callout('咆えろ「蛇尾丸」', 'HOERO, ZABIMARU', '#ff8a8a');
        f.aura.flare(1.3, 0.6);
        g.sfx.play('flare', f.center(), 1);
      }
      if (n === 'charge') {
        f.aura.flare(1.8, 1.2);
        g.sfx.play('charge', f.center(), 1.2);
      }
      if (n === 'burst') {
        if (this.bankai) this.kit.becomeBankai();
        else this.kit.becomeShikai();
      }
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    this.drive?.update(f, g, this.t);
    // Bankai: a torrent of reiatsu and a storm of dust whirls up round him
    if (this.bankai && this.t > 0.1 && this.t < 1.2) {
      this.storm += dt;
      if (this.storm > 0.03) {
        this.storm = 0;
        for (let i = 0; i < 3; i++) {
          const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 6;
          g.engine.dust.spawn({ x: f.pos.x + Math.cos(a) * r, y: f.pos.y + 0.3 + Math.random() * 3, z: f.pos.z + Math.sin(a) * r, vx: -Math.sin(a) * 10, vy: 2 + Math.random() * 3, vz: Math.cos(a) * 10, size: 1, sizeEnd: 3, life: 1.1, r: 0.72, g: 0.64, b: 0.56, alpha: 0.45, alphaEnd: 0, tex: TEX_PUFF, drag: 1 });
        }
        const c = f.center();
        g.engine.glow.spawn({ x: c.x + (Math.random() - 0.5) * 1.2, y: f.pos.y + Math.random() * 0.5, z: c.z + (Math.random() - 0.5) * 1.2, vx: 0, vy: 10 + Math.random() * 8, vz: 0, size: 0.3, sizeEnd: 0.05, life: 0.6, r: 1, g: 0.35, b: 0.32, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 4 });
      }
    }
  }
  override end(f: Fighter): void {
    super.end(f);
    if (this.kit.whip) this.kit.whip.sweep = null;
  }
}

// ------------------------------------------------------------------ the kit

export class RenjiKit implements Kit {
  form: Form = 'sealed';
  flare = false;
  comboIndex = 0;
  whip: SegmentedWhip | null = null;
  snake: BoneSnake | null = null;
  protected lastEnd = 0;
  private lastKido = -10;
  private curveSide = 1;
  protected cd = { heavy: 0, shakkaho: 0, chant: 0, curve: 0, wrap: 0, whirl: 0, higa: 0, taiho: 0, bite: 0, higa2: 0, burrow: 0 };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    this.setHands();
    this.applyStats();
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    // whatever no action is driving relaxes back to rest
    const w = this.whip;
    if (w) {
      w.ext = Math.max(0, w.ext - dt * 5);
      w.sweep = null;
      w.wrap = Math.max(0, w.wrap - dt * 4);
      w.bend *= Math.exp(-dt * 6);
      w.wave *= Math.exp(-dt * 6);
      w.glow = Math.max(0, w.glow - dt * 1.5);
      for (let i = 0; i < w.freeW.length; i++) w.freeW[i] = Math.max(0, w.freeW[i] - dt * 2.5);
    }
    const s = this.snake;
    if (s) {
      if (f.dead) {
        s.visible = false;
        return;
      }
      if (!(f.action as { drivesSnake?: boolean } | null)?.drivesSnake) {
        s.follow = 2.6;
        idleHead(f, g.time, s.headWant);
        const t = this.target();
        s.lookAt = t ? t.center() : f.center().addScaledVector(f.forward(_v), 20);
        s.dmg = 0;
        s.smash = false;
        for (let i = 0; i < s.freeW.length; i++) s.freeW[i] = Math.max(0, s.freeW[i] - dt * 2.5);
      }
      s.glow = Math.max(0, s.glow - dt * 0.8);
    }
  }

  target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 90, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 90);
  }

  nextCurveSide(): number {
    this.curveSide = -this.curveSide;
    return this.curveSide;
  }

  protected setHands(): void {
    const rig = this.f.visual.rig;
    rig.setBoneVisible('fist.R', true);
    rig.setBoneVisible('palm.R', false);
    rig.setBoneVisible('fist.L', false);
    rig.setBoneVisible('palm.L', true);
  }

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof CutAction || cur instanceof LashAction || cur instanceof SnakeStrikeAction) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const f = this.f;
    this.lastEnd = this.g.time + 0.9;
    if (this.form === 'bankai') {
      const idx = i % 3;
      this.comboIndex = idx + 1;
      f.act(new SnakeStrikeAction(this, idx, this.target()), true);
      return;
    }
    const list = this.form === 'shikai' ? ZABIMARU_CHAIN : RENJI_CHAIN;
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    f.act(this.form === 'shikai' ? new LashAction(this, list[idx], idx, f) : new CutAction(this, list[idx], list[idx], idx), true);
  }

  protected special(a: FighterAction, cost: number, cdKey: keyof typeof this.cd, cd: number): boolean {
    const f = this.f;
    if (this.cd[cdKey] > 0) return false;
    if (f.action && !f.action.canCancel(a)) return false;
    if (f.hitstun > 0 || f.dashT > 0 || f.dead) return false;
    if (!f.spendRei(cost)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return false;
    }
    this.cd[cdKey] = cd;
    f.act(a, true);
    return true;
  }

  /** a target close enough for a technique that needs one */
  protected near(range: number): Fighter | null {
    const t = this.target();
    return t && t.pos.distanceTo(this.f.pos) <= range ? t : null;
  }

  /** RMB: the cleave / the full-reach lash / the skull smash. */
  heavy(): void {
    const f = this.f;
    if (f.busy && !(f.action instanceof CutAction || f.action instanceof LashAction || f.action instanceof SnakeStrikeAction)) return;
    if (this.form === 'sealed') this.special(new CutAction(this, 'rj_lash3', 'cleave', 3), 6, 'heavy', 1.6);
    else if (this.form === 'shikai') this.special(new LashAction(this, 'rj_reach', 3, f), 12, 'heavy', 2.6);
    else this.special(new SkullSmashAction(this, this.target()), 14, 'heavy', 3.2);
  }

  /** Q: Shakkahō / the blind-angle lash / Hikotsu Taihō. */
  skill1(): void {
    if (this.form === 'sealed') this.special(new ShakkahoAction(this, false), 8, 'shakkaho', 0.55);
    else if (this.form === 'shikai') this.special(new CurveAction(this, this.target()), 10, 'curve', 2.2);
    else this.special(new TaihoAction(this, this.target()), 32, 'taiho', 9);
  }

  /** E: the full chant / the constriction / bite and carry. */
  skill2(): void {
    if (this.form === 'sealed') this.special(new ShakkahoAction(this, true), 22, 'chant', 7);
    else if (this.form === 'shikai') this.special(new WrapAction(this, this.near(14)), 14, 'wrap', 5);
    else {
      const t = this.near(24);
      if (t) this.special(new BiteAction(this, t), 18, 'bite', 6);
    }
  }

  /** R: the whirlwind / the enhanced Higa Zekkō. */
  skill3(): void {
    if (this.form === 'shikai') this.special(new SpinAction(this), 16, 'whirl', 6);
    else if (this.form === 'bankai') {
      const t = this.near(30);
      if (t) this.special(new HigaSnakeAction(this, t), 36, 'higa2', 14);
    }
  }

  /** G: Higa Zekkō (Shikai) / the burrow (Bankai). */
  toggle(): void {
    if (this.form === 'shikai') {
      const t = this.near(20);
      if (t) this.special(new HigaAction(this, t), 26, 'higa', 14);
    } else if (this.form === 'bankai') {
      const t = this.near(28);
      if (t) this.special(new BurrowAction(this, t), 24, 'burrow', 9);
    }
  }

  release(): void {
    const f = this.f;
    if (this.form === 'bankai' || f.busy) return;
    if (!f.spendRei(this.form === 'sealed' ? 20 : 50)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(new ReleaseAction(this, this.form === 'shikai'), true);
  }

  toggleFlare(): void {
    this.flare = !this.flare;
    this.applyStats();
    if (this.flare) {
      this.f.aura.flare(1.6, 0.4);
      this.g.shake(0.2);
      this.g.sfx.play('flare', this.f.center());
    }
  }

  /** Hadō #31 from the left palm. Cast again too soon, it may go off in his hand. */
  fireShakkaho(chant: boolean): void {
    const { f, g } = this;
    const hand = sock(f, 'palm.L');
    const dir = aim(f, g).sub(hand);
    if (dir.lengthSq() < 1e-4) f.forward(dir);
    dir.normalize();
    const hurried = !chant && g.time - this.lastKido < 1.6;
    this.lastKido = g.time;
    if (hurried && Math.random() < 0.4) {
      g.addProjectile(new Shakkaho(f, g, hand, dir, { damage: 34, speed: 0, size: 0.4, blast: 1.6, backfire: true }));
      g.callout('暴発', 'MISFIRE', '#ff8a6a');
      return;
    }
    const origin = hand.clone().addScaledVector(dir, chant ? 0.9 : 0.35);
    g.addProjectile(new Shakkaho(f, g, origin, dir, chant ? { damage: 95, speed: 24, size: 1.1, blast: 3.6, range: 90, scorch: true } : { damage: 34, speed: 36, size: 0.42, blast: 1.6 }));
    g.sfx.play('swingHeavy', hand, 0.7);
    if (chant) g.shake(f === g.player ? 0.3 : 0.12);
  }

  becomeShikai(): void {
    const { f, g } = this;
    if (this.form !== 'sealed') return;
    this.form = 'shikai';
    f.visual.attach('sword', renjiProp('hilt'), 'grip.R');
    f.def = { ...f.def, blade: BLADE_SHIKAI };
    f.trail?.setColor(BLADE_SHIKAI.color, BLADE_SHIKAI.core);
    f.bladeValid = false;
    this.whip = new SegmentedWhip(g, f, () => f.visual.props.get('sword') ?? null);
    g.addProjectile(this.whip);
    f.aura.flare(1.4, 0.6);
    g.addRing(f.pos.clone(), 10, RED, 0.5);
    g.shake(f === g.player ? 0.3 : 0.12);
    this.applyStats();
  }

  becomeBankai(): void {
    const { f, g } = this;
    if (this.form !== 'shikai') return;
    this.form = 'bankai';
    if (this.whip) this.whip.done = true;
    this.whip = null;
    f.def = { ...f.def, stance: HIHIO_STANCE, speed: { ...SPEED_BANKAI } };
    f.setForm({ asset: renjiAsset('bankai'), props: [{ key: 'sheath', model: renjiProp('sheath-empty'), socket: 'hip.L' }] }, AURA_HIHIO, BLADE_HANDLE);
    f.visual.attach('sword', renjiProp('handle'), 'grip.R');
    f.bladeValid = false;
    this.setHands();
    const anchor = () => {
      const p = f.visual.props.get('sword');
      if (!p) return f.center();
      p.updateMatrixWorld(true);
      return HANDLE_END.clone().applyMatrix4(p.matrixWorld);
    };
    // the snake rises out of the dust in front of him
    const start = f.pos.clone().addScaledVector(f.forward(_v), 4);
    start.y = groundUnder(g, start) - 2;
    const s = new BoneSnake(g, f, anchor, start);
    s.follow = 1.8;
    idleHead(f, g.time, s.headWant);
    this.snake = s;
    g.addProjectile(s);
    s.dust(start.clone().setY(start.y + 2), 40, 14);
    f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.2);
    f.aura.pillarBurst(2.6);
    f.aura.flare(2.2, 1.2);
    g.sfx.play('bankai', f.center());
    g.shake(0.8);
    g.hitstop(0.06);
    g.slowMo(0.4, 0.35);
    g.engine.gr.chroma.offset.set(0.005, 0.005);
    g.addRing(f.pos.clone(), 22, RED, 0.8);
    for (const o of g.enemiesOf(f)) {
      const d = o.pos.distanceTo(f.pos);
      if (d < 10) g.damage(o, 20 * (1 - d / 10), f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 18 * (1 - d / 10), launch: 5, heavy: true });
    }
    g.callout('卍解「狒狒王蛇尾丸」', 'BANKAI — HIHIŌ ZABIMARU', '#ff6b6b');
    if (f === g.player) g.cam.dist = Math.max(g.cam.dist, 7.5);
    this.applyStats();
  }

  protected applyStats(): void {
    const f = this.f;
    f.power = (this.form === 'bankai' ? 1.4 : this.form === 'shikai' ? 1.15 : 1) * (this.flare ? 1.25 : 1);
    f.damageTaken = this.form === 'bankai' ? 0.85 : 0.95;
    f.toughness = this.form === 'bankai' ? 8 : 0;
    f.aura.target = this.flare ? 0.9 : this.form === 'bankai' ? 0.45 : this.form === 'shikai' ? 0.2 : 0.06;
  }

  formName(): string {
    return this.form === 'bankai' ? 'Bankai — Hihiō Zabimaru' : this.form === 'shikai' ? 'Shikai — Zabimaru' : 'Lieutenant, 6th Division';
  }

  ai(): KitAI {
    const kit = this;
    return {
      get reach() {
        return kit.form === 'bankai' ? 13 : kit.form === 'shikai' ? 6.5 : 1.7;
      },
      chain: 3,
      releaseAt: [1, 0.55],
      ranged: () => this.form === 'bankai',
      moves: [
        { name: 'shakkaho', use: () => this.skill1(), min: 4, max: 30, weight: 2, cd: 2.2, when: () => this.form === 'sealed' },
        { name: 'chant', use: () => this.skill2(), min: 7, max: 35, weight: 0.8, cd: 9, when: () => this.form === 'sealed' },
        { name: 'cleave', use: () => this.heavy(), min: 0, max: 2.6, weight: 1.2, cd: 3, when: () => this.form === 'sealed' },
        { name: 'reach', use: () => this.heavy(), min: 7, max: 24, weight: 1.6, cd: 3.5, when: () => this.form === 'shikai' },
        { name: 'curve', use: () => this.skill1(), min: 3, max: 10, weight: 1.6, cd: 3, when: () => this.form === 'shikai' },
        { name: 'wrap', use: () => this.skill2(), min: 3, max: 13, weight: 1.4, cd: 6, when: () => this.form === 'shikai' },
        { name: 'whirl', use: () => this.skill3(), min: 0, max: 5, weight: 1.1, cd: 7, when: () => this.form === 'shikai' },
        { name: 'higa', use: () => this.toggle(), min: 3, max: 18, weight: 0.8, cd: 16, when: () => this.form === 'shikai' },
        { name: 'smash', use: () => this.heavy(), min: 3, max: 26, weight: 1.8, cd: 4, when: () => this.form === 'bankai' },
        { name: 'taiho', use: () => this.skill1(), min: 8, max: 60, weight: 1.4, cd: 9, when: () => this.form === 'bankai' },
        { name: 'bite', use: () => this.skill2(), min: 4, max: 22, weight: 1.4, cd: 7, when: () => this.form === 'bankai' },
        { name: 'higa2', use: () => this.skill3(), min: 4, max: 26, weight: 0.9, cd: 14, when: () => this.form === 'bankai' },
        { name: 'burrow', use: () => this.toggle(), min: 5, max: 26, weight: 1, cd: 10, when: () => this.form === 'bankai' },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const fm = this.form, cd = this.cd;
    const list: AbilityInfo[] = [];
    if (fm === 'sealed') {
      list.push(
        { key: 'LMB', name: 'Zabimaru', kanji: '斬' },
        { key: 'RMB', name: 'Cleave', kanji: '断', cost: 6, cd: cd.heavy, cdMax: 1.6 },
        { key: 'Q', name: 'Shakkahō', kanji: '赤火', cost: 8, cd: cd.shakkaho, cdMax: 0.55 },
        { key: 'E', name: 'Full chant', kanji: '詠唱', cost: 22, cd: cd.chant, cdMax: 7 },
      );
    } else if (fm === 'shikai') {
      list.push(
        { key: 'LMB', name: 'Lash', kanji: '蛇尾' },
        { key: 'RMB', name: 'Full reach', kanji: '伸', cost: 12, cd: cd.heavy, cdMax: 2.6 },
        { key: 'Q', name: 'Blind angle', kanji: '死角', cost: 10, cd: cd.curve, cdMax: 2.2 },
        { key: 'E', name: 'Constrict', kanji: '絞', cost: 14, cd: cd.wrap, cdMax: 5 },
        { key: 'R', name: 'Whirlwind', kanji: '旋風', cost: 16, cd: cd.whirl, cdMax: 6 },
        { key: 'G', name: 'Higa Zekkō', kanji: '狒牙', cost: 26, cd: cd.higa, cdMax: 14 },
      );
    } else {
      list.push(
        { key: 'LMB', name: 'Snake', kanji: '蛇' },
        { key: 'RMB', name: 'Skull smash', kanji: '砕', cost: 14, cd: cd.heavy, cdMax: 3.2 },
        { key: 'Q', name: 'Hikotsu Taihō', kanji: '大砲', cost: 32, cd: cd.taiho, cdMax: 9 },
        { key: 'E', name: 'Bite', kanji: '咬', cost: 18, cd: cd.bite, cdMax: 6 },
        { key: 'R', name: 'Higa Zekkō', kanji: '狒牙', cost: 36, cd: cd.higa2, cdMax: 14 },
        { key: 'G', name: 'Burrow', kanji: '潜', cost: 24, cd: cd.burrow, cdMax: 9 },
      );
    }
    list.push(
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      fm === 'bankai' ? { key: 'F', name: 'Hihiō Zabimaru', kanji: '狒狒王', active: true, tint: RED } : { key: 'F', name: fm === 'sealed' ? 'Shikai' : 'Bankai', kanji: fm === 'sealed' ? '咆' : '卍解', cost: fm === 'sealed' ? 20 : 50, tint: RED },
    );
    return list;
  }
}
