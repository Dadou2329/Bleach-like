// The Full Hollow's moves, shared by Ichigo (his Vasto Lorde body, docs/roster/A1-ichigo.md §0 row 7) and Hollow
// Ichigo (the same body in black and white, §2): the feral claw-and-blade string, the overhead that shatters the
// ground, the horn Cero, Sonído behind the target and the roar. The owning kit chains the string and owns the roar.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter } from '../fighter';
import type { Game } from '../game';
import { CeroBeam } from '../projectiles/cero';
import { SphereShape } from '../../destruction/shapes';
import { TEX_PUFF } from '../../vfx/sprites';

/** What the Full Hollow's actions need from the kit that owns them. */
export interface VastoHost {
  /** the next step of the claw-and-blade string */
  vastoChain(i: number): void;
  /** the roar's shock wave (k scales it) */
  roarBurst(k: number): void;
}

/** the horn Cero (dossier palette): white core, red body */
export const CERO_VASTO = { core: '#FFF3F4', body: '#F81E1A', rim: '#7A0C12' };

/** Where a skill aims: the lock target, the camera ray for the player, else straight ahead. */
export function aimPoint(f: Fighter, g: Game, out = new THREE.Vector3()): THREE.Vector3 {
  if (f.faceTarget) return out.copy(f.faceTarget);
  if (f === g.player) return g.aimPoint(f, out);
  return f.center(out).addScaledVector(f.forward(), 30);
}

/** Base for the one-shot Full Hollow skills: plays a clip, ends with it. */
export abstract class VastoSkill extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: VastoHost) {
    super();
  }
  protected playClip(f: Fighter, clip: string, onEvent: (n: string) => void, speed = 1): void {
    const c = f.anim.clip(clip);
    if (!c) {
      this.done = true;
      return;
    }
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
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t > this.dur * 0.7;
  }
}

interface VastoMove {
  window?: [number, number];
  spec?: BladeSpec;
  /** a strike with the clawed left hand */
  claw?: { damage: number; knock: number; launch?: number; reach: number };
  lunge: number;
}
const VASTO_MOVES: Record<string, VastoMove> = {
  vl_claw: { lunge: 9, claw: { damage: 34, knock: 10, reach: 1.3 } },
  vl_claw2: { lunge: 9, claw: { damage: 38, knock: 6, launch: 7, reach: 1.3 } },
  vl_cut: { lunge: 9, window: [0.12, 0.24], spec: { damage: 40, knock: 14, launch: 1, hitstop: 0.08, shake: 0.3, cut: 700 } },
  vl_cut2: { lunge: 9, window: [0.12, 0.24], spec: { damage: 46, knock: 10, launch: 8, heavy: true, hitstop: 0.09, shake: 0.35, cut: 760 } },
};

/** The feral string: claw, cut, claw, cut. */
export class VastoStringAction extends FighterAction {
  readonly name: string;
  private info: VastoMove;
  private dur = 0;
  private comboAt = 0;
  private hitAt = 0;
  private struck = false;
  queued = false;
  constructor(readonly kit: VastoHost, readonly clip: string, readonly index: number) {
    super();
    this.name = clip;
    this.info = VASTO_MOVES[clip];
    this.mobility = 0.15;
    this.airGravity = 0.15;
    this.armor = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    this.hitAt = c.events.hit ?? this.dur * 0.3;
    f.bladeHits.clear();
    f.bladeSpec = this.info.spec ?? null;
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n !== 'step') return;
        const tgt = f.faceTarget;
        const extra = tgt ? Math.min(6, Math.max(0, f.pos.distanceTo(tgt) - 1.8)) : 0;
        f.push.addScaledVector(f.forward(), this.info.lunge + extra * 2.4);
        g.sfx.play(this.info.claw ? 'swing' : 'swingHeavy', f.center(), 0.9);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t, w = this.info.window;
    if (w) {
      f.bladeActive = t >= w[0] && t <= w[1];
      if (f.trail) f.trail.emitting = t >= w[0] - 0.03 && t <= w[1] + 0.06;
    }
    const c = this.info.claw;
    if (c && !this.struck && t >= this.hitAt) {
      this.struck = true;
      const fw = f.forward();
      const p = f.pos.clone().addScaledVector(fw, c.reach).setY(f.pos.y + 1.1);
      for (const o of g.enemiesOf(f)) {
        const cy = Math.max(o.pos.y + 0.1, Math.min(o.pos.y + o.def.height - 0.2, p.y));
        if (Math.hypot(o.pos.x - p.x, cy - p.y, o.pos.z - p.z) > 1.1 + o.def.radius) continue;
        g.damage(o, c.damage, f, fw.clone(), { knock: c.knock, launch: c.launch, heavy: (c.launch ?? 0) > 0, hitstop: 0.07, shake: 0.28 });
        g.sparks(new THREE.Vector3(o.pos.x, cy, o.pos.z), fw, '#ff3b52', 14);
      }
      // the rake tears the wall in front
      g.engine.destruction.carve(new SphereShape(p.clone().addScaledVector(fw, 0.6), 1.1, 0.8), { mode: 'cut', power: 420, impulse: 8, dust: 0.4 });
    }
    if (this.queued && t >= this.comboAt) {
      this.done = true;
      this.kit.vastoChain(this.index + 1);
      return;
    }
    if (t >= this.dur) this.done = true;
  }
  override end(f: Fighter): void {
    f.bladeActive = false;
    if (f.trail) f.trail.emitting = false;
  }
  override canCancel(next: FighterAction): boolean {
    if (next.name === 'dash' || next instanceof VastoSkill) return this.t >= this.hitAt + 0.04;
    return false;
  }
}

/** RMB (Full Hollow): the overhead that shatters the ground. */
export class SmashAction extends VastoSkill {
  readonly name = 'smash';
  constructor(kit: VastoHost) {
    super(kit);
    this.mobility = 0.1;
    this.armor = 0.6;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    f.bladeSpec = { damage: 60, knock: 10, launch: 9, heavy: true, hitstop: 0.12, shake: 0.6, cut: 900 };
    this.playClip(f, 'vl_smash', (n) => {
      if (n === 'step') {
        f.push.addScaledVector(f.forward(), 8);
        if (f.grounded) f.push.y = 7;
      }
      if (n !== 'fx') return;
      const p = f.pos.clone().addScaledVector(f.forward(), 1.8);
      g.groundImpact(p, 4.2, 320, f.def.aura.body, f);
      g.engine.destruction.carve(new SphereShape(p.clone().setY(p.y - 0.6), 3.6, 0.6), { mode: 'explode', power: 420, impulse: 18, dust: 1 });
      for (const o of g.enemiesOf(f)) {
        const d = o.pos.distanceTo(p);
        if (d < 6) g.damage(o, 50 * (1 - d / 6), f, o.pos.clone().sub(p).setY(0).normalize(), { knock: 14, launch: 10, heavy: true });
      }
      g.shake(f === g.player ? 0.9 : 0.3);
      g.hitstop(0.1);
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    f.bladeActive = this.t > 0.33 && this.t < 0.45;
    if (f.trail) f.trail.emitting = this.t > 0.28 && this.t < 0.5;
  }
}

/** Q (Full Hollow): the horn Cero — gathered between the horn tips, fired from the head. */
export class HornCeroAction extends VastoSkill {
  readonly name = 'cero';
  constructor(kit: VastoHost) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.6;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'vl_cero', (n) => {
      if (n !== 'charge') return;
      const emitter = f.visual.rig.sockets.get('horns') ?? f.visual.object;
      const tgt = () => aimPoint(f, g, new THREE.Vector3());
      g.addProjectile(new CeroBeam(g, f, emitter, tgt, { charge: 0.72, fire: 0.8, radius: 1.05, damage: 170, power: 900, core: CERO_VASTO.core, body: CERO_VASTO.body, rim: CERO_VASTO.rim, range: 140, track: 0.8, gain: 1.5 }));
      g.callout('虚閃', 'CERO', '#ff4a4a');
      g.sfx.play('charge', f.center(), 1);
    });
  }
}

/** E (Full Hollow): Sonído behind the target and a cut before it can turn. */
export class SonidoAction extends VastoSkill {
  readonly name = 'sonido';
  private struck = false;
  constructor(kit: VastoHost, readonly target: Fighter) {
    super(kit);
    this.mobility = 0;
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    const o = this.target;
    const from = f.center();
    f.ghosts.spawn(1, 0.4);
    const back = new THREE.Vector3(Math.sin(o.yaw), 0, Math.cos(o.yaw)).multiplyScalar(-1.6);
    f.body.pos.set(o.pos.x + back.x, o.pos.y + 0.2, o.pos.z + back.z);
    f.body.prev.copy(f.body.pos);
    f.body.vel.set(0, 0, 0);
    f.yaw = Math.atan2(o.pos.x - f.body.pos.x, o.pos.z - f.body.pos.z);
    g.sfx.play('shunpo', from, 1.2);
    g.engine.dust.spawn({ x: from.x, y: from.y, z: from.z, size: 0.6, sizeEnd: 2.2, life: 0.4, r: 0.1, g: 0.02, b: 0.04, alpha: 0.6, alphaEnd: 0, tex: TEX_PUFF });
    f.bladeHits.clear();
    f.bladeSpec = { damage: 70, knock: 16, launch: 6, heavy: true, hitstop: 0.12, shake: 0.45, cut: 800 };
    this.playClip(f, 'vl_cut2', () => {}, 1.3);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    f.bladeActive = this.t > 0.08 && this.t < 0.2;
    if (f.trail) f.trail.emitting = this.t > 0.05 && this.t < 0.24;
    if (!this.struck && this.t > 0.1) {
      this.struck = true;
      this.invulnerable = false;
    }
  }
}

/** R (Full Hollow): the roar — a shock wave that flattens everything near. */
export class RoarAction extends VastoSkill {
  readonly name = 'roar';
  constructor(kit: VastoHost) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.9;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'vl_roar', (n) => {
      if (n === 'roar') this.kit.roarBurst(1);
    });
  }
}
