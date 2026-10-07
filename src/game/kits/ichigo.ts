// Ichigo's kit (Hueco Mundo era; docs/roster/A1-ichigo.md K2/K3/K8c). Shikai Zangetsu: the 5-hit cleaver
// string, the ground-cracking chop, Getsuga Tenshō (Q), the ground Getsuga torn along the earth (E), and
// Zangetsu thrown on its cloth and hauled back (R). Bankai Tensa Zangetsu: the same string far faster, the
// black Getsuga, the Getsuga thrust that tunnels (E) and Getsuga Matoi, the blade wrapped in reiatsu so every
// swing throws a crescent (R). G is the Hollow mask; masked, R becomes the barrage: flash steps round the
// target, a black Getsuga from every side, the last point-blank. Killed in Bankai, he does not stay down:
// the Hollow rises in his body, the Full Hollow — Sonído, claw and sword, the horn Cero, the roar — until
// a horn snaps, the Cero dies in it, the hole closes and he comes back to himself.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { Game } from '../game';
import type { VoxelModel } from '../../models/builder';
import { ICHIGO_CLIPS, ICHIGO_COMBO, ICHIGO_STANCE } from '../../chars/ichigoClips';
import { hollowMask, hollowMaskShatter, ichigoAsset, ichigoSword } from '../../chars/ichigo';
import { ichigoHollowAsset } from '../../chars/ichigoHollow';
import { VASTO_CHAIN, VASTO_CLIPS, VASTO_STANCE } from '../../chars/ichigoHollowClips';
import { AURA_ICHIGO_BANKAI, AURA_ICHIGO_HOLLOW, AURA_ICHIGO_SHIKAI } from '../../vfx/aura';
import { GetsugaProjectile } from '../projectiles/getsuga';
import { CeroBeam } from '../projectiles/cero';
import { GETSUGA_BLACK, GETSUGA_BLUE } from '../../vfx/energy';
import { GroundGetsuga, ThrownBlade, matoiFlames } from '../../vfx/ichigoArts';
import { ShardBurst } from '../../vfx/shards';
import { SphereShape } from '../../destruction/shapes';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from '../../vfx/sprites';
import type { AbilityInfo } from '../../ui/hud';
import type { Kit, KitAI } from './kit';

type BladeDef = NonNullable<FighterDef['blade']>;
const BLADE_SHIKAI: BladeDef = { prop: 'sword', base: [0, 0, 0.16], tip: [0, 0, 1.56], color: '#7DDFFD', core: '#F9FFFF' };
const BLADE_BANKAI: BladeDef = { prop: 'sword', base: [0, 0, 0.17], tip: [0, 0, 0.92], color: '#C2304F', core: '#FF9AAE' };
/** masked sword trail */
const TRAIL_HOLLOW = { color: '#D0142F', core: '#FFB3BF' };
/** base movement per form; the mask multiplies it */
const FORM_SPEED = {
  shikai: { run: 9, sprint: 19, jump: 11.5, dash: 10, dashTime: 0.12 },
  bankai: { run: 12, sprint: 26, jump: 12.5, dash: 14, dashTime: 0.12 },
};
/** canon: 11 seconds after a month of Visored training (enough to wreck Grimmjow, then it lapsed) */
export const MASK_TIME = 11;
export const MASK_CD = 15;
const MASK_COST = 20;
/** Getsuga Matoi: how long the blade stays wrapped */
const MATOI_TIME = 8;
/** the Full Hollow lasts this long before a horn gives out */
export const VASTO_TIME = 32;
const VASTO_SPEED = { run: 15, sprint: 34, jump: 14.5, dash: 24, dashTime: 0.1 };
/** the horn Cero (dossier palette): white core, red body */
const CERO_VASTO = { core: '#FFF3F4', body: '#F81E1A', rim: '#7A0C12' };

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

export const ICHIGO_DEF: FighterDef = {
  id: 'ichigo',
  name: 'Kurosaki Ichigo',
  build: () => {
    const asset = ichigoAsset('shikai');
    return { asset, props: [{ key: 'sword', model: ichigoSword('shikai'), socket: 'grip.R' }] };
  },
  stance: ICHIGO_STANCE,
  clips: ICHIGO_CLIPS,
  aura: AURA_ICHIGO_SHIKAI,
  blade: BLADE_SHIKAI,
  hp: 1000,
  rei: 100,
  speed: { ...FORM_SPEED.shikai },
  radius: 0.4,
  height: 1.75,
};

interface SwingInfo {
  window: [number, number];
  trail: [number, number];
  spec: BladeSpec;
  /** forward / up impulse at the 'step' event */
  lunge?: [number, number];
  /** ground impact at the 'fx' event */
  impact?: { radius: number; power: number };
  /** second hit window (spin) resets hit memory at this time */
  rehit?: number;
}

const SWINGS: Record<string, SwingInfo> = {
  slash1: { window: [0.1, 0.24], trail: [0.08, 0.33], spec: { damage: 16, knock: 6, launch: 0, hitstop: 0.05, shake: 0.12, cut: 170 }, lunge: [7, 0] },
  slash2: { window: [0.09, 0.22], trail: [0.07, 0.32], spec: { damage: 16, knock: 6, launch: 3, hitstop: 0.05, shake: 0.12, cut: 170 }, lunge: [6, 0] },
  slash3: { window: [0.21, 0.31], trail: [0.17, 0.42], spec: { damage: 28, knock: 5, launch: 7, hitstop: 0.08, shake: 0.32, cut: 280 }, lunge: [6.5, 0], impact: { radius: 1.25, power: 70 } },
  slash4: { window: [0.08, 0.47], trail: [0.06, 0.5], spec: { damage: 13, knock: 9, launch: 2, hitstop: 0.04, shake: 0.15, cut: 200 }, lunge: [4, 0], rehit: 0.28 },
  slash5: { window: [0.34, 0.47], trail: [0.3, 0.6], spec: { damage: 45, knock: 18, launch: 6, heavy: true, hitstop: 0.13, shake: 0.6, cut: 420 }, lunge: [7, 8.5], impact: { radius: 2.1, power: 120 } },
};

/** One Zangetsu swing (combo step or heavy). */
export class SwingAction extends FighterAction {
  readonly name: string;
  private info: SwingInfo;
  private dur = 0;
  private comboAt = 0;
  private impacted = false;
  private rehitDone = false;
  queued = false;

  constructor(readonly kit: IchigoKit, readonly clip: string, readonly index: number) {
    super();
    this.name = clip;
    this.info = SWINGS[clip];
    this.mobility = 0.12;
    this.airGravity = 0.12;
  }

  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    f.bladeHits.clear();
    f.bladeSpec = this.info.spec;
    // out of reach: dash in at once, so the arc arrives as the hit window opens (the push decays with
    // pushDrag); the lunge stops at striking distance instead of running through the target
    let dashed = false;
    const tgt0 = f.faceTarget;
    if (this.info.lunge && tgt0) {
      const d = Math.hypot(tgt0.x - f.pos.x, tgt0.z - f.pos.z);
      this.stopAt = 1.3;
      if (d > this.stopAt + 0.25) {
        const per = (1 - Math.exp(-f.pushDrag * Math.max(0.06, this.info.window[0]))) / f.pushDrag;
        f.push.addScaledVector(f.forward(), Math.min(26, (d - this.stopAt) / per));
        dashed = true;
      }
    }
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n === 'step' && this.info.lunge) {
          if (!dashed) {
            // no target known at the start (or already close): the plain lunge, stretched if the target is far
            const tgt = f.faceTarget;
            let push = this.info.lunge[0];
            if (tgt) {
              this.stopAt = 1.3;
              const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
              const per = (1 - Math.exp(-f.pushDrag * 0.08)) / f.pushDrag;
              push = Math.min(24, Math.max(push, Math.max(0, d - this.stopAt) / per));
            }
            f.push.addScaledVector(f.forward(), push);
          }
          if (this.info.lunge[1] > 0 && f.grounded) f.push.y = this.info.lunge[1];
        }
        if (n === 'fx' && this.info.impact && !this.impacted) {
          this.impacted = true;
          const tip = f.blade.tip.clone();
          const ground = this.groundUnder(g, tip);
          if (ground !== null && tip.y - ground < 1.2) {
            tip.y = ground;
            g.groundImpact(tip, this.info.impact.radius, this.info.impact.power, f.def.aura.body, f);
            g.shake(this.info.spec.shake);
          }
        }
      },
    });
  }

  private groundUnder(g: Game, p: THREE.Vector3): number | null {
    const w = g.engine.world;
    const vs = w.vs;
    const x = Math.floor(p.x / vs), z = Math.floor(p.z / vs);
    for (let y = Math.floor((p.y + 0.6) / vs); y > Math.floor((p.y - 2.5) / vs); y--) if (w.isSolid(x, y, z)) return (y + 1) * vs;
    return null;
  }

  private swished = false;
  private matoiFired = false;
  private stopAt = 0;

  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    // the lunge stops at striking distance instead of running through the target
    const tgt = f.faceTarget;
    if (this.stopAt > 0 && tgt && Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z) <= this.stopAt) {
      f.push.x = 0;
      f.push.z = 0;
      this.stopAt = 0;
    }
    if (!this.swished && t >= this.info.window[0] - 0.03) {
      this.swished = true;
      g.sfx.play(this.info.spec.damage >= 28 ? 'swingHeavy' : 'swing', f.center());
    }
    f.bladeActive = t >= this.info.window[0] && t <= this.info.window[1];
    if (f.trail) f.trail.emitting = t >= this.info.trail[0] && t <= this.info.trail[1];
    // Getsuga Matoi: each cut throws a crescent of its own
    if (this.kit.matoiT > 0 && !this.matoiFired && t >= this.info.window[0] + 0.02) {
      this.matoiFired = true;
      this.kit.matoiShot();
    }
    if (this.info.rehit && !this.rehitDone && t >= this.info.rehit) {
      this.rehitDone = true;
      f.bladeHits.clear();
    }
    // chain into the next swing
    if (this.queued && t >= this.comboAt) {
      this.done = true;
      this.kit.chain(f, this.index + 1);
      return;
    }
    if (t >= this.dur) this.done = true;
  }

  override end(f: Fighter): void {
    f.bladeActive = false;
    if (f.trail) f.trail.emitting = false;
  }

  override canCancel(next: FighterAction): boolean {
    // dash / specials cancel once the hit is out
    if (next.name === 'dash' || next instanceof GetsugaAction) return this.t >= this.info.window[0] + 0.06;
    return false;
  }
}

export class GetsugaAction extends FighterAction {
  readonly name = 'getsuga';
  private fired = false;
  constructor(readonly kit: IchigoKit) {
    super();
    this.mobility = 0.05;
    this.airGravity = 0.05;
    this.armor = 0.5;
  }

  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    f.bladeSpec = { damage: 20, knock: 8, launch: 3, hitstop: 0.06, shake: 0.2, cut: 300 };
    f.anim.play('getsuga', {
      onEvent: (n) => {
        if (n === 'charge') {
          f.aura.flare(1.4, 0.55);
          this.glowBlade(f, 1);
          g.callout('月牙天衝', 'GETSUGA TENSHŌ', f.data.bankai || this.kit.masked ? '#ff6e86' : '#9fe6ff');
          g.sfx.play('flare', f.center(), 0.6);
        }
        if (n === 'fx' && !this.fired) this.fire(f, g);
      },
    });
  }

  private glowBlade(f: Fighter, a: number): void {
    const s = f.visual.props.get('sword');
    if (!s) return;
    const u = s.material.userData.uniforms;
    const c = new THREE.Color(f.def.aura.body);
    u.uEnergy.value.set(c.r, c.g, c.b, a * 0.8);
  }

  private fire(f: Fighter, g: Game): void {
    this.fired = true;
    // aim: lock target or camera direction (pitch allowed)
    const dir = new THREE.Vector3();
    if (f.faceTarget) dir.subVectors(f.faceTarget, f.center());
    else if (f === g.player) dir.subVectors(g.aimPoint(f), f.center());
    else f.forward(dir);
    const flat = Math.hypot(dir.x, dir.z) || 1;
    // keep it level unless locked on: a Getsuga skims the ground rather than diving into it
    dir.y = Math.max(f.faceTarget ? -0.5 : -0.06, Math.min(0.6, dir.y / flat)) * flat;
    dir.normalize();
    // the crescent follows the diagonal swing: tilted ~40° from vertical
    const right = new THREE.Vector3(dir.z, 0, -dir.x).normalize().multiplyScalar(-1);
    const side = new THREE.Vector3(0, 1, 0).multiplyScalar(Math.cos(0.7)).addScaledVector(right, Math.sin(0.7));
    const origin = f.center().addScaledVector(dir, 1.2);
    origin.y += 0.35;
    const bankai = f.data.bankai === true;
    // the masked Getsuga: his "ultimate attack" — black, far bigger and faster
    const m = this.kit.masked;
    g.addProjectile(new GetsugaProjectile(g, f, origin, dir, side, {
      radius: (bankai ? 3.4 : 2.6) * (m ? 1.3 : 1),
      halfAngle: 1.15,
      speed: (bankai ? 52 : 40) * (m ? 1.25 : 1),
      range: (bankai ? 110 : 70) * (m ? 1.3 : 1),
      damage: (bankai ? 140 : 80) * (m ? 1.6 : 1),
      cut: (bankai ? 900 : 520) * (m ? 1.6 : 1),
      colors: (f.data.getsugaColors as typeof GETSUGA_BLUE) ?? GETSUGA_BLUE,
      dark: bankai || m,
    }));
    g.shake(m ? 0.6 : 0.45);
    g.hitstop(0.06);
    g.sfx.play(bankai || m ? 'getsugaBlack' : 'getsuga', origin);
    f.aura.flare(1.8, 0.4);
    g.engine.gr.chroma.offset.set(0.004, 0.004);
    if (f === g.player) g.cam.punchFov(6);
    // recoil
    f.push.addScaledVector(dir, -3);
  }

  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const c = f.anim.clip('getsuga')!;
    if (f.trail) f.trail.emitting = this.t > 0.42 && this.t < 0.62;
    f.bladeActive = this.t > 0.45 && this.t < 0.56;
    if (this.t > 0.6) this.glowBlade(f, Math.max(0, 1 - (this.t - 0.6) * 3));
    if (this.t >= c.dur - c.fadeOut * 0.5) this.done = true;
  }

  override end(f: Fighter): void {
    this.glowBlade(f, 0);
    f.bladeActive = false;
    if (f.trail) f.trail.emitting = false;
  }

  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.fired && this.t > 0.6;
  }
}

/** Bankai release: pillar of reiatsu, callout, (form swap when the Bankai model is ready). */
export class ReleaseAction extends FighterAction {
  readonly name = 'release';
  constructor(readonly kit: IchigoKit) {
    super();
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('release', {
      onEvent: (n) => {
        if (n === 'fx') {
          f.aura.flare(2.2, 1.6);
          g.callout('卍解', 'BANKAI', '#ffffff');
          g.shake(0.5);
        }
        if (n === 'burst') {
          g.sfx.play('bankai', f.center());
          f.aura.pillarBurst(2.4);
          g.groundImpact(f.pos.clone(), 3.2, 90, f.def.aura.body, f);
          g.shake(0.9);
          g.hitstop(0.12);
          g.slowMo(0.5, 0.35);
          g.engine.gr.chroma.offset.set(0.006, 0.006);
          this.kit.onBankai(f, g);
          // the shockwave pushes enemies away
          for (const o of g.enemiesOf(f)) {
            const d = o.pos.distanceTo(f.pos);
            if (d < 14) g.damage(o, 30 * (1 - d / 14), f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 22 * (1 - d / 14), launch: 6, heavy: true });
          }
        }
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 1.5) this.done = true;
  }
}

/** Hollow mask: the left hand claws down over the face and the mask forms behind it. */
export class MaskAction extends FighterAction {
  readonly name = 'mask';
  private formed = false;
  private dur = 0.68;
  constructor(readonly kit: IchigoKit) {
    super();
    this.mobility = 0.2;
    this.airGravity = 0.1;
    this.armor = 0.8;
    this.trackTarget = false;
  }

  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('mask_on')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.aura.flare(1.4, 0.35);
    g.sfx.play('flare', f.center(), 0.7);
    f.anim.play('mask_on', {
      onEvent: (n) => {
        if (n === 'fx' && !this.formed) {
          this.formed = true;
          this.kit.formMask();
        }
      },
    });
  }

  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.formed) {
      // black reiatsu and bone-white motes stream into the face
      const p = this.kit.faceWorld(_v);
      for (let i = 0; i < 5; i++) {
        const a = Math.random() * Math.PI * 2, e = Math.random() * 2 - 1, r = 0.5 + Math.random() * 0.9;
        const q = Math.sqrt(1 - e * e);
        const x = p.x + Math.cos(a) * q * r, y = p.y + e * r, z = p.z + Math.sin(a) * q * r;
        const white = Math.random() < 0.45;
        g.engine.glow.spawn({
          x, y, z, vx: (p.x - x) * 4, vy: (p.y - y) * 4, vz: (p.z - z) * 4,
          size: white ? 0.06 : 0.09, sizeEnd: 0.02, life: 0.22, r: white ? 1 : 0.8, g: white ? 0.97 : 0.05, b: white ? 0.92 : 0.12,
          alpha: 1, alphaEnd: 0.3, tex: TEX_STREAK, stretch: 2.5, drag: 0,
        });
      }
    }
    if (this.t >= this.dur) this.done = true;
  }

  override canCancel(next: FighterAction): boolean {
    return this.formed && this.t > 0.45 && (next.name === 'dash' || next instanceof GetsugaAction || next instanceof SwingAction);
  }
}

// ------------------------------------------------------------------ the fuller moveset

/** Base for the one-shot skills: plays a clip, ends with it. */
abstract class SkillAction extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: IchigoKit) {
    super();
  }
  protected playClip(f: Fighter, clip: string, onEvent: (n: string) => void, speed = 1, hold = false): void {
    const c = f.anim.clip(clip);
    if (!c) {
      this.done = true;
      return;
    }
    this.dur = (c.dur - c.fadeOut * 0.5) / speed;
    f.anim.play(clip, { onEvent, speed, hold });
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

/** Where a skill aims: the lock target, the camera ray for the player, else straight ahead. */
function aimAt(f: Fighter, g: Game, out = new THREE.Vector3()): THREE.Vector3 {
  if (f.faceTarget) return out.copy(f.faceTarget);
  if (f === g.player) return g.aimPoint(f, out);
  return f.center(out).addScaledVector(f.forward(), 30);
}

/** E (Shikai): the ground Getsuga — the blade torn up out of the earth, the wave runs along the ground. */
class PlowAction extends SkillAction {
  readonly name = 'plow';
  constructor(kit: IchigoKit) {
    super(kit);
    this.mobility = 0.05;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    f.bladeSpec = { damage: 22, knock: 6, launch: 6, hitstop: 0.06, shake: 0.2, cut: 320 };
    this.playClip(f, 'ig_plow', (n) => {
      if (n === 'step') {
        f.push.addScaledVector(f.forward(), 5);
        g.sfx.play('swingHeavy', f.center(), 1);
      }
      if (n !== 'fx') return;
      const dir = aimAt(f, g).sub(f.pos).setY(0).normalize();
      const from = f.pos.clone().addScaledVector(dir, 1.4);
      const masked = this.kit.masked;
      g.addProjectile(new GroundGetsuga(g, f, from, dir, (f.data.getsugaColors as typeof GETSUGA_BLUE) ?? GETSUGA_BLUE, { speed: 30, range: masked ? 46 : 36, width: masked ? 2.2 : 1.7, damage: masked ? 110 : 75, power: masked ? 520 : 380 }));
      g.groundImpact(from.clone(), 1.6, 90, f.def.aura.body, f);
      g.callout('月牙天衝', 'GETSUGA TENSHŌ — GROUND', f.data.bankai || masked ? '#ff6e86' : '#9fe6ff');
      g.sfx.play(this.kit.bankai || masked ? 'getsugaBlack' : 'getsuga', from, 0.9);
      g.shake(f === g.player ? 0.4 : 0.15);
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    f.bladeActive = this.t > 0.28 && this.t < 0.4;
    if (f.trail) f.trail.emitting = this.t > 0.24 && this.t < 0.46;
  }
}

/** R (Shikai): Deadly Darts — Zangetsu thrown on its cloth; R again hauls it back early. */
class DartsAction extends SkillAction {
  readonly name = 'darts';
  private blade: ThrownBlade | null = null;
  private thrown = false;
  private catching = -1;
  constructor(kit: IchigoKit) {
    super(kit);
    this.mobility = 0.35;
    this.armor = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    this.dur = 99;
    this.playClip(f, 'ig_throw', (n) => {
      if (n === 'step') g.sfx.play('swingHeavy', f.center(), 1.1);
      if (n !== 'throw' || this.thrown) return;
      this.thrown = true;
      const hand = () => this.kit.handWorld(new THREE.Vector3());
      const from = hand();
      const tgt = aimAt(f, g);
      if (f.faceTarget) tgt.y = f.faceTarget.y;
      this.blade = new ThrownBlade(g, f, ichigoSword('shikai'), from, tgt, hand, { speed: 34, range: 24, damage: this.kit.masked ? 85 : 55, cut: 480 });
      g.addProjectile(this.blade);
      this.kit.dart = this.blade;
      this.kit.swordVisible(false);
    }, 1, true);
    this.dur = 99;
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const b = this.blade;
    if (this.catching < 0 && b && b.done) {
      // back in the hand: the yank and the catch
      this.catching = this.t;
      this.kit.dart = null;
      this.kit.swordVisible(true);
      f.anim.play('ig_catch', {});
      g.sfx.play('hit', f.center(), 0.6);
    }
    if (this.catching >= 0 && this.t - this.catching > 0.4) this.done = true;
    // safety: never hold the pose forever
    if (this.t > 4) {
      b?.reel();
      if (this.t > 6) this.done = true;
    }
  }
  override end(f: Fighter): void {
    super.end(f);
    if (this.blade && !this.blade.done) this.blade.done = true;
    this.kit.dart = null;
    this.kit.swordVisible(true);
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.catching >= 0;
  }
}

/** E (Bankai): the Getsuga thrust — a narrow black bolt off the point that tunnels through what it meets. */
class ThrustAction extends SkillAction {
  readonly name = 'thrust';
  constructor(kit: IchigoKit) {
    super(kit);
    this.mobility = 0.05;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    f.bladeSpec = { damage: 26, knock: 10, launch: 1, hitstop: 0.07, shake: 0.25, cut: 400 };
    this.playClip(f, 'ig_thrust', (n) => {
      if (n === 'step') f.push.addScaledVector(f.forward(), 9);
      if (n !== 'fx') return;
      const from = f.center().addScaledVector(f.forward(), 1.4);
      const dir = aimAt(f, g).sub(from).normalize();
      const side = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
      const m = this.kit.masked;
      g.addProjectile(new GetsugaProjectile(g, f, from, dir, side, {
        radius: m ? 1.6 : 1.25, halfAngle: 0.6, speed: m ? 96 : 84, range: m ? 120 : 100, damage: m ? 120 : 80, cut: m ? 1500 : 1150,
        colors: (f.data.getsugaColors as typeof GETSUGA_BLUE) ?? GETSUGA_BLACK, dark: true, band: 0.5,
      }));
      g.sfx.play('getsugaBlack', from, 1.1);
      g.shake(f === g.player ? 0.4 : 0.15);
      f.aura.flare(1.5, 0.3);
      if (f === g.player) g.cam.punchFov(5);
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    f.bladeActive = this.t > 0.25 && this.t < 0.36;
    if (f.trail) f.trail.emitting = this.t > 0.22 && this.t < 0.4;
  }
}

/** R (Bankai): Getsuga Matoi — the blade raised and wrapped in reiatsu. */
class MatoiAction extends SkillAction {
  readonly name = 'matoi';
  constructor(kit: IchigoKit) {
    super(kit);
    this.mobility = 0.1;
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ig_matoi', (n) => {
      if (n !== 'fx') return;
      this.kit.matoiT = MATOI_TIME;
      f.aura.flare(1.8, 0.6);
      g.addRing(f.pos.clone().setY(f.pos.y + 0.05), 7, f.def.aura.body, 0.4);
      g.callout('月牙纏', 'GETSUGA MATOI', '#ff6e86');
      g.sfx.play('flare', f.center(), 0.9);
    });
  }
}

/** R (masked): flash steps round the target, a black Getsuga from each side, the last one point-blank. */
class BarrageAction extends FighterAction {
  readonly name = 'barrage';
  private step = -1;
  private next = 0;
  private readonly angles = [1.25, -1.25, 3.1, 0];
  constructor(readonly kit: IchigoKit, readonly target: Fighter) {
    super();
    this.mobility = 0;
    this.airGravity = 0;
    this.invulnerable = true;
    this.trackTarget = true;
  }
  override start(f: Fighter, g: Game): void {
    g.callout('月牙天衝', 'GETSUGA TENSHŌ — BARRAGE', '#ff3b52');
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const o = this.target;
    if (o.dead) {
      this.done = true;
      return;
    }
    if (this.t < this.next) return;
    this.step++;
    if (this.step >= this.angles.length) {
      if (this.t > this.next + 0.35) this.done = true;
      return;
    }
    // blink to the next side of the target, at Getsuga range (the last one point-blank)
    const last = this.step === this.angles.length - 1;
    const base = Math.atan2(f.pos.x - o.pos.x, f.pos.z - o.pos.z);
    const a = last ? base : base + this.angles[this.step];
    const r = last ? 2.4 : 9;
    const from = f.center();
    f.ghosts.spawn(1, 0.35);
    f.body.pos.set(o.pos.x + Math.sin(a) * r, Math.max(o.pos.y, f.pos.y) + (last ? 0 : 1.5), o.pos.z + Math.cos(a) * r);
    f.body.prev.copy(f.body.pos);
    f.body.vel.set(0, 0, 0);
    f.yaw = Math.atan2(o.pos.x - f.body.pos.x, o.pos.z - f.body.pos.z);
    g.sfx.play('shunpo', from, 0.8);
    f.anim.play('getsuga', { speed: 2.4 });
    // fire as the blade comes down
    const dir = new THREE.Vector3().subVectors(o.center(), f.center()).normalize();
    const side = new THREE.Vector3(0, 1, 0).multiplyScalar(Math.cos(0.7 + this.step)).addScaledVector(new THREE.Vector3(dir.z, 0, -dir.x).normalize(), Math.sin(0.7 + this.step));
    const origin = f.center().addScaledVector(dir, 1);
    g.addProjectile(new GetsugaProjectile(g, f, origin, dir, side, {
      radius: last ? 4.2 : 3.2, halfAngle: 1.15, speed: last ? 70 : 60, range: last ? 90 : 60, damage: last ? 120 : 70, cut: last ? 1600 : 1100,
      colors: GETSUGA_BLACK, dark: true,
    }));
    g.sfx.play('getsugaBlack', origin, last ? 1.3 : 0.9);
    g.shake(f === g.player ? (last ? 0.7 : 0.35) : 0.2);
    this.next = this.t + (last ? 0.5 : 0.3);
  }
}

// ------------------------------------------------------------------ the Full Hollow

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
class VastoStringAction extends FighterAction {
  readonly name: string;
  private info: VastoMove;
  private dur = 0;
  private comboAt = 0;
  private hitAt = 0;
  private struck = false;
  queued = false;
  constructor(readonly kit: IchigoKit, readonly clip: string, readonly index: number) {
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
    if (next.name === 'dash' || next instanceof SkillAction) return this.t >= this.hitAt + 0.04;
    return false;
  }
}

/** RMB (Full Hollow): the overhead that shatters the ground. */
class SmashAction extends SkillAction {
  readonly name = 'smash';
  constructor(kit: IchigoKit) {
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
      g.groundImpact(p, 4.2, 320, AURA_ICHIGO_HOLLOW.body, f);
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
class HornCeroAction extends SkillAction {
  readonly name = 'cero';
  constructor(kit: IchigoKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.6;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'vl_cero', (n) => {
      if (n !== 'charge') return;
      const emitter = f.visual.rig.sockets.get('horns') ?? f.visual.object;
      const tgt = () => aimAt(f, g, new THREE.Vector3());
      g.addProjectile(new CeroBeam(g, f, emitter, tgt, { charge: 0.72, fire: 0.8, radius: 1.05, damage: 170, power: 900, core: CERO_VASTO.core, body: CERO_VASTO.body, rim: CERO_VASTO.rim, range: 140, track: 0.8, gain: 1.5 }));
      g.callout('虚閃', 'CERO', '#ff4a4a');
      g.sfx.play('charge', f.center(), 1);
    });
  }
}

/** E (Full Hollow): Sonído behind the target and a cut before it can turn. */
class SonidoAction extends SkillAction {
  readonly name = 'sonido';
  private struck = false;
  constructor(kit: IchigoKit, readonly target: Fighter) {
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
class RoarAction extends SkillAction {
  readonly name = 'roar';
  constructor(kit: IchigoKit) {
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

/** Killed in Bankai: the body twitches, the Hollow takes it and rises. */
class RiseAction extends FighterAction {
  readonly name = 'rise';
  constructor(readonly kit: IchigoKit) {
    super();
    this.mobility = 0;
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    this.kit.becomeVasto();
    f.anim.play('vl_rise', {
      fadeIn: 0.02,
      onEvent: (n) => {
        if (n === 'twitch') {
          g.sfx.play('crack', f.center(), 1.2);
          f.aura.flare(1.2, 0.3);
        }
        if (n === 'rise') {
          f.hp = f.maxHp * 0.7;
          f.aura.flare(2, 0.8);
          g.sfx.play('mask', f.center(), 1.2);
        }
        if (n === 'roar') {
          this.kit.roarBurst(1.3);
          g.callout('完全虚化', 'FULL HOLLOWFICATION', '#ff3b52');
        }
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    // black reiatsu boiling off the body while it rises
    if (this.t < 1.9) {
      const c = f.center();
      for (let i = 0; i < 3; i++) g.engine.dust.spawn({ x: c.x + (Math.random() - 0.5) * 0.8, y: f.pos.y + Math.random() * 1.6, z: c.z + (Math.random() - 0.5) * 0.8, vx: (Math.random() - 0.5) * 0.6, vy: 1.4, vz: (Math.random() - 0.5) * 0.6, size: 0.3, sizeEnd: 0.9, life: 0.8, r: 0.05, g: 0.01, b: 0.02, alpha: 0.7, alphaEnd: 0, tex: TEX_PUFF, drag: 1 });
    }
    if (this.t >= 2.3) this.done = true;
  }
}

/** A horn snaps: the Cero dies in it, the mask breaks, he goes down on one knee and the hole closes. */
class HornBreakAction extends FighterAction {
  readonly name = 'hornbreak';
  constructor(readonly kit: IchigoKit, readonly hpFrac: number) {
    super();
    this.mobility = 0;
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('vl_break', {
      fadeIn: 0.02,
      onEvent: (n) => {
        if (n !== 'crack') return;
        const p = this.kit.faceWorld(new THREE.Vector3());
        g.sfx.play('shatter', p, 1.3);
        g.callout('', 'THE HORN BREAKS', '#f3f3f0');
        for (let i = 0; i < 40; i++) g.engine.glow.spawn({ x: p.x, y: p.y + 0.15, z: p.z, vx: (Math.random() - 0.5) * 6, vy: Math.random() * 5, vz: (Math.random() - 0.5) * 6, size: 0.06, sizeEnd: 0.03, life: 0.9, r: 0.95, g: 0.93, b: 0.9, alpha: 1, alphaEnd: 0.5, tex: TEX_GLOW, drag: 1, gravity: -9 });
        // the Cero that was gathering bursts in the broken horn
        g.addRing(p.clone(), 4, '#ff3b52', 0.3);
        g.shake(f === g.player ? 0.6 : 0.2);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 1.7) {
      this.kit.endVasto(this.hpFrac);
      this.done = true;
    }
  }
}

/** Kit state + input entry points (shared by player and AI controllers). */
export class IchigoKit implements Kit {
  comboIndex = 0;
  private lastSwingEnd = 0;
  getsugaCd = 0;
  flare = false;
  /** Hollow mask state */
  masked = false;
  maskT = 0;
  maskCd = 0;
  private crackLevel = -1;
  private maskFormT = -1;
  /** Getsuga Matoi: seconds left with the blade wrapped */
  matoiT = 0;
  /** Zangetsu out on its cloth */
  dart: ThrownBlade | null = null;
  /** the Full Hollow */
  vasto = false;
  vastoT = 0;
  /** the Hollow rises only once a fight */
  hollowUsed = false;
  private vastoIndex = 0;
  private vastoLast = 0;
  readonly cd = { plow: 0, darts: 0, thrust: 0, matoi: 0, barrage: 0, cero: 0, sonido: 0, roar: 0, smash: 0 };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.onHurt = (dmg, heavy) => this.onHurt(dmg, heavy);
    f.onLethal = () => this.onLethal();
    this.hands();
  }

  /** the sword hand closed on the hilt, the left hand open */
  private hands(): void {
    const rig = this.f.visual.rig;
    rig.setBoneVisible('fist.R', true);
    rig.setBoneVisible('palm.R', false);
    rig.setBoneVisible('fist.L', false);
    rig.setBoneVisible('palm.L', true);
  }

  get bankai(): boolean {
    return this.f.data.bankai === true;
  }

  update(dt: number): void {
    const f = this.f;
    this.getsugaCd = Math.max(0, this.getsugaCd - dt);
    this.maskCd = Math.max(0, this.maskCd - dt);
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.matoiT > 0) {
      this.matoiT = Math.max(0, this.matoiT - dt);
      if (f.bladeValid && !f.dead) matoiFlames(this.g, f.blade.base, f.blade.tip, GETSUGA_BLACK, 3);
    }
    if (this.vasto && !f.dead) {
      this.vastoT -= dt;
      if (this.vastoT <= 0 && !(f.action instanceof HornBreakAction) && !(f.action instanceof RiseAction) && f.hitstun <= 0) this.breakHorn(0.35);
      // black reiatsu streaming off the body
      if (Math.random() < 0.4) {
        const c = f.center();
        this.g.engine.dust.spawn({ x: c.x + (Math.random() - 0.5) * 0.6, y: f.pos.y + 0.2 + Math.random() * 1.4, z: c.z + (Math.random() - 0.5) * 0.6, vx: 0, vy: 1.2, vz: 0, size: 0.2, sizeEnd: 0.7, life: 0.6, r: 0.06, g: 0.01, b: 0.02, alpha: 0.45, alphaEnd: 0, tex: TEX_PUFF, drag: 1 });
      }
    }
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    if (this.masked && !f.dead) {
      this.maskT -= dt;
      // cracks spread over the last seconds, then it breaks
      const lvl = this.maskT < 1.3 ? 1 : this.maskT < 3.2 ? 0 : -1;
      if (lvl > this.crackLevel) this.crackMask(lvl);
      if (this.maskT <= 0) this.shatterMask();
      else this.maskFx(dt);
    }
  }

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (this.vasto) {
      if (cur instanceof VastoStringAction) {
        cur.queued = true;
        return;
      }
      if (f.busy) return;
      if (this.g.time - this.vastoLast > 0.8) this.vastoIndex = 0;
      this.vastoChain(this.vastoIndex);
      return;
    }
    if (cur instanceof SwingAction) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastSwingEnd > 0.8) this.comboIndex = 0;
    this.chain(f, this.comboIndex);
  }

  chain(f: Fighter, i: number): void {
    const idx = i % ICHIGO_COMBO.length;
    this.comboIndex = idx + 1;
    this.lastSwingEnd = this.g.time + 0.8;
    f.act(new SwingAction(this, ICHIGO_COMBO[idx], idx), true);
  }

  vastoChain(i: number): void {
    const idx = i % VASTO_CHAIN.length;
    this.vastoIndex = idx + 1;
    this.vastoLast = this.g.time + 0.8;
    this.f.act(new VastoStringAction(this, VASTO_CHAIN[idx], idx), true);
  }

  heavy(): void {
    const f = this.f;
    if (this.vasto) {
      this.special(new SmashAction(this), 0, 'smash', 2.4);
      return;
    }
    if (f.busy && !(f.action instanceof SwingAction)) return;
    if (f.action instanceof SwingAction && f.action.t < 0.25) return;
    this.comboIndex = 0;
    f.act(new SwingAction(this, f.grounded ? 'slash3' : 'slash5', 2), true);
  }

  getsuga(): void {
    const f = this.f;
    if (this.getsugaCd > 0) return;
    const a = new GetsugaAction(this);
    if (f.action && !f.action.canCancel(a)) return;
    if (!f.spendRei(this.getsugaCost())) return;
    this.getsugaCd = this.getsugaCdMax();
    f.act(a, true);
  }

  private getsugaCost(): number {
    return (this.bankai ? 18 : 25) * (this.masked ? 0.5 : 1);
  }

  private getsugaCdMax(): number {
    return this.masked ? 0.35 : this.bankai ? 0.6 : 1;
  }

  release(): void {
    const f = this.f;
    if (this.bankai || this.vasto || f.busy) return;
    if (!f.spendRei(40)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(new ReleaseAction(this), true);
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

  skill1(): void {
    if (this.vasto) this.special(new HornCeroAction(this), 22, 'cero', 4);
    else this.getsuga();
  }

  /** E: the ground Getsuga / the Getsuga thrust / Sonído. */
  skill2(): void {
    if (this.vasto) {
      const t = this.near(24);
      if (t) this.special(new SonidoAction(this, t), 8, 'sonido', 2.2);
    } else if (this.bankai) this.special(new ThrustAction(this), this.masked ? 10 : 16, 'thrust', this.masked ? 1.2 : 2.2);
    else this.special(new PlowAction(this), this.masked ? 12 : 20, 'plow', 3);
  }

  /** R: Deadly Darts / Getsuga Matoi / the masked barrage / the roar. */
  skill3(): void {
    if (this.vasto) {
      this.special(new RoarAction(this), 10, 'roar', 7);
      return;
    }
    if (this.dart) {
      this.dart.reel();
      return;
    }
    if (this.bankai && this.masked) {
      const t = this.near(40);
      if (t) this.special(new BarrageAction(this, t), 30, 'barrage', 9);
    } else if (this.bankai) this.special(new MatoiAction(this), 24, 'matoi', 14);
    else this.special(new DartsAction(this), 14, 'darts', 4);
  }

  toggle(): void {
    if (!this.vasto) this.mask();
  }

  private target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 80, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 80);
  }

  private near(range: number): Fighter | null {
    const t = this.target();
    return t && t.pos.distanceTo(this.f.pos) <= range ? t : null;
  }

  private special(a: FighterAction, cost: number, cdKey: keyof typeof this.cd, cd: number): boolean {
    const f = this.f;
    if (this.cd[cdKey] > 0 || f.dead) return false;
    if (f.action && !f.action.canCancel(a)) return false;
    if (f.hitstun > 0 || f.dashT > 0) return false;
    if (!f.spendRei(cost)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return false;
    }
    this.cd[cdKey] = cd;
    f.act(a, true);
    return true;
  }

  /** Getsuga Matoi: the crescent each cut throws while the blade is wrapped. */
  matoiShot(): void {
    const { f, g } = this;
    if (!f.bladeValid) return;
    const dir = aimAt(f, g).sub(f.center()).normalize();
    const tip = f.blade.tip, base = f.blade.base;
    const side = new THREE.Vector3().subVectors(tip, base).normalize();
    side.addScaledVector(dir, -side.dot(dir));
    if (side.lengthSq() < 1e-4) side.set(0, 1, 0);
    side.normalize();
    const origin = new THREE.Vector3().addVectors(tip, base).multiplyScalar(0.5).addScaledVector(dir, 0.6);
    g.addProjectile(new GetsugaProjectile(g, f, origin, dir, side, { radius: 1.7, halfAngle: 1.05, speed: 52, range: 34, damage: 34, cut: 520, colors: GETSUGA_BLACK, dark: true }));
    g.sfx.play('getsugaBlack', origin, 0.5);
  }

  /** World position of the right hand (where the cloth is held). */
  handWorld(out: THREE.Vector3): THREE.Vector3 {
    const s = this.f.visual.rig.sockets.get('grip.R');
    if (!s) return this.f.center(out);
    s.updateWorldMatrix(true, false);
    return s.getWorldPosition(out);
  }

  /** Hide the sword in the hand while it is out on its cloth. */
  swordVisible(on: boolean): void {
    const s = this.f.visual.props.get('sword');
    if (s) s.visible = on;
  }

  /** The killing blow: the Hollow rises once (in Bankai); in the Full Hollow a horn breaks instead. */
  private onLethal(): boolean {
    const f = this.f;
    if (this.vasto) {
      if (!(f.action instanceof HornBreakAction)) this.breakHorn(0.15);
      f.hp = Math.max(1, f.hp);
      return true;
    }
    if (this.hollowUsed || !this.bankai) return false;
    this.hollowUsed = true;
    f.hp = 1;
    if (this.masked) this.shatterMask();
    this.dart = null;
    this.matoiT = 0;
    f.stopAction();
    f.act(new RiseAction(this), true);
    return true;
  }

  /** The Hollow's body: the helmet and horns, the long hair, the hole — swapped in under the black reiatsu. */
  becomeVasto(): void {
    const { f, g } = this;
    this.vasto = true;
    this.vastoT = VASTO_TIME;
    this.vastoIndex = 0;
    f.def = { ...f.def, stance: VASTO_STANCE, clips: VASTO_CLIPS, blade: BLADE_BANKAI };
    f.setForm({ asset: ichigoHollowAsset(), props: [{ key: 'sword', model: ichigoSword('bankai'), socket: 'grip.R' }] }, AURA_ICHIGO_HOLLOW, BLADE_BANKAI);
    this.hands();
    const c = f.center();
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.dust.spawn({ x: c.x, y: c.y, z: c.z, vx: Math.cos(a) * (2 + Math.random() * 5), vy: Math.random() * 3, vz: Math.sin(a) * (2 + Math.random() * 5), size: 0.5, sizeEnd: 1.8, life: 0.9 + Math.random() * 0.5, r: 0.04, g: 0.01, b: 0.02, alpha: 0.8, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
    }
    g.slowMo(0.5, 0.3);
    g.shake(f === g.player ? 0.5 : 0.2);
    this.applyLook();
    this.applyStats();
  }

  /** A horn snaps: the Full Hollow ends. */
  breakHorn(hpFrac: number): void {
    const f = this.f;
    f.stopAction();
    f.act(new HornBreakAction(this, hpFrac), true);
  }

  /** Back to himself: the Bankai body, the hole closed, some of his strength back. */
  endVasto(hpFrac: number): void {
    const { f, g } = this;
    this.vasto = false;
    this.vastoT = 0;
    f.def = { ...f.def, stance: ICHIGO_STANCE, clips: ICHIGO_CLIPS, blade: BLADE_BANKAI };
    f.setForm({ asset: ichigoAsset('bankai'), props: [{ key: 'sword', model: ichigoSword('bankai'), socket: 'grip.R' }] }, AURA_ICHIGO_BANKAI, BLADE_BANKAI);
    this.hands();
    f.hp = Math.max(f.hp, f.maxHp * hpFrac);
    // the hole closes: the reiatsu swirls back into the chest
    const c = f.center();
    for (let i = 0; i < 50; i++) {
      const a = Math.random() * Math.PI * 2, r = 1 + Math.random() * 1.5;
      const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r, y = c.y + (Math.random() - 0.5) * 1.4;
      g.engine.glow.spawn({ x, y, z, vx: (c.x - x) * 2.2, vy: (c.y - y) * 2.2, vz: (c.z - z) * 2.2, size: 0.12, sizeEnd: 0.03, life: 0.45, r: 0.9, g: 0.1, b: 0.2, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: 2 });
    }
    this.maskCd = MASK_CD;
    this.applyLook();
    this.applyStats();
  }

  /** The roar: a shock wave that knocks everything near flat. */
  roarBurst(k: number): void {
    const { f, g } = this;
    const c = f.center();
    g.sfx.play('roarBig', c, 1.4 * k);
    g.addRing(f.pos.clone().setY(f.pos.y + 0.1), 16 * k, '#ff3b52', 0.5);
    g.addRing(c.clone(), 7 * k, '#141418', 0.35);
    g.shake(f === g.player ? 0.8 : 0.35);
    g.engine.gr.chroma.offset.set(0.008, 0.008);
    for (const o of g.enemiesOf(f)) {
      const d = o.pos.distanceTo(f.pos);
      if (d > 14 * k) continue;
      const fall = 1 - d / (14 * k);
      g.damage(o, 30 * fall * k, f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 24 * fall, launch: 6 * fall, heavy: true, hitstop: 0.08 });
    }
    if (f.grounded) g.engine.destruction.carve(new SphereShape(f.pos.clone(), 2.6 * k, 0.4), { mode: 'smash', power: 160, impulse: 14, dust: 1 });
  }

  formName(): string {
    if (this.vasto) return `Full Hollow · ${Math.max(0, Math.ceil(this.vastoT))} s`;
    return (this.bankai ? 'Bankai — Tensa Zangetsu' : 'Shikai') + (this.masked ? ' · Hollow mask' : '') + (this.matoiT > 0 ? ' · Matoi' : '');
  }

  ai(): KitAI {
    return {
      reach: 2.6,
      chain: 5,
      releaseAt: 0.75,
      toggleAt: 0.5,
      toggleOn: () => this.masked || this.maskCd > 0 || this.vasto,
      moves: [
        { name: 'getsuga', use: () => this.getsuga(), min: 6, max: 45, weight: 3, cd: 2.2, when: () => !this.vasto },
        { name: 'heavy', use: () => this.heavy(), min: 0, max: 3.2, weight: 1, cd: 3 },
        { name: 'plow', use: () => this.skill2(), min: 4, max: 26, weight: 1.4, cd: 5, when: () => !this.bankai && !this.vasto },
        { name: 'darts', use: () => this.skill3(), min: 6, max: 20, weight: 1.2, cd: 6, when: () => !this.bankai && !this.vasto },
        { name: 'thrust', use: () => this.skill2(), min: 4, max: 50, weight: 1.6, cd: 3.5, when: () => this.bankai && !this.vasto },
        { name: 'matoi', use: () => this.skill3(), min: 0, max: 8, weight: 1, cd: 16, when: () => this.bankai && !this.masked && !this.vasto && this.matoiT <= 0 },
        { name: 'barrage', use: () => this.skill3(), min: 5, max: 26, weight: 2.2, cd: 10, when: () => this.masked },
        { name: 'cero', use: () => this.skill1(), min: 5, max: 70, weight: 2.4, cd: 4.5, when: () => this.vasto },
        { name: 'sonido', use: () => this.skill2(), min: 3, max: 22, weight: 1.6, cd: 3, when: () => this.vasto },
        { name: 'roar', use: () => this.skill3(), min: 0, max: 7, weight: 1.2, cd: 8, when: () => this.vasto },
      ],
    };
  }

  /** G: put the Hollow mask on (or tear it off early). */
  mask(): void {
    const f = this.f;
    if (f.dead || this.vasto) return;
    if (this.masked) {
      if (!(f.action instanceof MaskAction)) this.shatterMask();
      return;
    }
    if (this.maskCd > 0 || f.hitstun > 0 || f.dashT > 0) return;
    if (f.action && !(f.action instanceof SwingAction)) return;
    if (!f.spendRei(MASK_COST)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(new MaskAction(this), true);
  }

  /** World position of the face socket (where the mask sits). */
  faceWorld(out: THREE.Vector3): THREE.Vector3 {
    const s = this.f.visual.rig.sockets.get('face');
    if (!s) return this.f.center(out);
    s.updateWorldMatrix(true, false);
    return s.getWorldPosition(out);
  }

  /** The mask forms (end of the claw gesture): burst, boost, new look. */
  formMask(): void {
    const { f, g } = this;
    this.masked = true;
    this.maskT = MASK_TIME;
    this.crackLevel = -1;
    this.maskFormT = 0;
    this.attachMask();
    this.applyLook();
    this.applyStats();
    const c = f.center();
    const col = AURA_ICHIGO_HOLLOW.body;
    f.aura.flare(1.9, 0.6);
    g.addRing(f.pos.clone().setY(f.pos.y + 0.05), 11, col, 0.6);
    g.addRing(c.clone(), 5, '#ffffff', 0.25);
    if (f.grounded) g.groundImpact(f.pos.clone(), 2.2, 70, col, f);
    g.callout('虚化', 'HOLLOWFICATION', '#ff3b52');
    g.sfx.play('mask', c);
    g.shake(0.7);
    g.hitstop(0.08);
    g.slowMo(0.35, 0.35);
    g.engine.gr.chroma.offset.set(0.009, 0.009);
    if (f === g.player) g.cam.punchFov(8);
    // the reiatsu wave knocks everything back
    for (const o of g.enemiesOf(f)) {
      const d = o.pos.distanceTo(f.pos);
      if (d < 12) g.damage(o, 30 * (1 - d / 12), f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 20 * (1 - d / 12), launch: 5, heavy: d < 6 });
    }
    // black and crimson reiatsu bursting outward
    for (let i = 0; i < 70; i++) {
      const a = Math.random() * Math.PI * 2, up = Math.random();
      const sp = 6 + Math.random() * 14;
      const dark = Math.random() < 0.5;
      g.engine.glow.spawn({
        x: c.x, y: c.y, z: c.z, vx: Math.cos(a) * sp * (1 - up * 0.5), vy: up * sp * 0.8, vz: Math.sin(a) * sp * (1 - up * 0.5),
        size: dark ? 0.35 : 0.22, sizeEnd: 0.05, life: 0.45 + Math.random() * 0.4,
        r: dark ? 0.12 : 0.95, g: dark ? 0.0 : 0.08, b: dark ? 0.02 : 0.18, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 3,
      });
    }
  }

  /** The current mask model (clean or cracked). */
  private maskModel(): VoxelModel {
    return this.crackLevel < 0 ? hollowMask() : hollowMaskShatter().cracked[this.crackLevel];
  }

  private attachMask(): void {
    const v = this.f.visual;
    const old = v.props.get('mask');
    const m = v.attach('mask', this.maskModel(), 'face');
    if (old) Object.assign(m.userData, { flash: old.userData.flash, dissolve: old.userData.dissolve });
    // the forehead locks would poke through the mask
    v.rig.setBoneVisible('bangs', false);
  }

  private crackMask(lvl: number): void {
    this.crackLevel = lvl;
    this.attachMask();
    const p = this.faceWorld(_v);
    this.g.sfx.play('crack', p, lvl > 0 ? 1.4 : 1);
    this.chips(p, lvl > 0 ? 10 : 5);
  }

  private chips(p: THREE.Vector3, n: number): void {
    const fw = this.f.forward(_w);
    for (let i = 0; i < n; i++) {
      this.g.engine.glow.spawn({
        x: p.x + fw.x * 0.06, y: p.y, z: p.z + fw.z * 0.06,
        vx: fw.x * 1.5 + (Math.random() - 0.5) * 2.5, vy: Math.random() * 2, vz: fw.z * 1.5 + (Math.random() - 0.5) * 2.5,
        size: 0.035, sizeEnd: 0.02, life: 0.5, r: 1, g: 0.97, b: 0.92, alpha: 1, alphaEnd: 0.6, tex: TEX_GLOW, drag: 1, gravity: -9,
      });
    }
  }

  /** Time is up (or torn off / broken): the mask breaks into its voxel shards. */
  shatterMask(): void {
    const { f, g } = this;
    if (!this.masked) return;
    this.masked = false;
    this.maskCd = MASK_CD;
    this.crackLevel = -1;
    this.maskFormT = -1;
    const m = f.visual.props.get('mask');
    if (m && !f.dead) {
      m.updateWorldMatrix(true, false);
      const origin = this.faceWorld(new THREE.Vector3());
      const fw = f.forward();
      origin.addScaledVector(fw, -0.08);
      g.addProjectile(new ShardBurst(g, hollowMaskShatter().shards, m.matrixWorld, { origin, dir: fw, speed: 4.5, life: 2.6 }));
      g.sfx.play('shatter', origin);
      g.shake(0.3);
    }
    f.visual.detach('mask');
    f.visual.rig.setBoneVisible('bangs', true);
    this.applyLook();
    this.applyStats();
  }

  /** Big hits chip the mask: time off the clock. */
  private onHurt(dmg: number, heavy: boolean): void {
    if (!this.masked || this.f.dead || (!heavy && dmg < 40)) return;
    this.maskT -= heavy ? 1.2 : 0.5;
    const p = this.faceWorld(_v);
    this.chips(p, 6);
    this.g.sfx.play('crack', p, 0.8);
  }

  /** Per sim step while masked: the mask materialises, the eyes leave streaks, it flickers at the end. */
  private maskFx(dt: number): void {
    const m = this.f.visual.props.get('mask');
    if (!m) return;
    if (this.maskFormT >= 0) {
      this.maskFormT += dt;
      const k = this.maskFormT;
      m.userData.dissolve = Math.max(0, 1 - k / 0.14);
      m.userData.flash = Math.max(0, 1 - k / 0.45);
      if (k > 0.45) this.maskFormT = -1;
    } else m.userData.flash = this.maskT < 1 && Math.sin(this.maskT * 38) > 0.5 ? 0.45 : 0;
    // gold irises streak behind fast moves
    m.updateWorldMatrix(true, false);
    for (const sx of [1, -1]) {
      _v.set((sx > 0 ? 2.5 : -2.5) / 48, 0.5 / 48, 2.2 / 48).applyMatrix4(m.matrixWorld);
      this.g.engine.glow.spawn({ x: _v.x, y: _v.y, z: _v.z, size: 0.05, sizeEnd: 0.01, life: 0.16, r: 1, g: 0.85, b: 0.3, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
    // black reiatsu smoking off the mask
    if (Math.random() < 0.35) {
      const p = this.faceWorld(_v);
      this.g.engine.dust.spawn({ x: p.x, y: p.y + 0.1, z: p.z, vx: (Math.random() - 0.5) * 0.4, vy: 1.2, vz: (Math.random() - 0.5) * 0.4, size: 0.12, sizeEnd: 0.5, life: 0.7, r: 0.04, g: 0.02, b: 0.03, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 1 });
    }
  }

  /** Aura, trail, afterimages, rim light and HUD follow the form and the mask. */
  private applyLook(): void {
    const { f, g } = this;
    const style = this.masked || this.vasto ? AURA_ICHIGO_HOLLOW : this.bankai ? AURA_ICHIGO_BANKAI : AURA_ICHIGO_SHIKAI;
    const blade = this.bankai ? BLADE_BANKAI : BLADE_SHIKAI;
    f.aura.setStyle(style);
    f.ghosts.color.set(style.body);
    f.def = { ...f.def, aura: style, blade };
    const tc = this.masked || this.vasto ? TRAIL_HOLLOW : blade;
    f.trail?.setColor(tc.color, tc.core);
    f.data.getsugaColors = this.masked || this.bankai ? GETSUGA_BLACK : GETSUGA_BLUE;
    if (g.hud && f === g.player) {
      g.hud.form = this.formName();
      g.hud.vignette = this.masked || this.vasto ? 1 : 0;
    }
  }

  /** Speed, damage, toughness and aura level from form × flare × mask. */
  private applyStats(): void {
    const f = this.f;
    if (this.vasto) {
      f.def = { ...f.def, speed: { ...VASTO_SPEED } };
      f.damageTaken = 0.5;
      f.power = 2 * (this.flare ? 1.2 : 1);
      f.aura.target = this.flare ? 1 : 0.5;
      return;
    }
    const base = this.bankai ? FORM_SPEED.bankai : FORM_SPEED.shikai;
    const m = this.masked;
    f.def = {
      ...f.def,
      speed: { run: base.run * (m ? 1.22 : 1), sprint: base.sprint * (m ? 1.25 : 1), jump: base.jump * (m ? 1.12 : 1), dash: base.dash * (m ? 1.35 : 1), dashTime: base.dashTime },
    };
    f.damageTaken = m ? 0.55 : 1;
    f.power = (this.bankai ? 1.3 : 1) * (this.flare ? (this.bankai ? 1.23 : 1.35) : 1) * (m ? 1.75 : 1);
    f.aura.target = this.flare ? 1 : m ? 0.34 : this.bankai ? 0.45 : 0.25;
  }

  /** Called at the release burst. */
  onBankai(f: Fighter, _g: Game): void {
    f.data.bankai = true;
    f.setForm(
      { asset: ichigoAsset('bankai'), props: [{ key: 'sword', model: ichigoSword('bankai'), socket: 'grip.R' }] },
      AURA_ICHIGO_BANKAI,
      BLADE_BANKAI,
    );
    this.hands();
    if (this.masked) this.attachMask();
    this.applyLook();
    this.applyStats();
    (f.data.onBankai as ((f: Fighter) => void) | undefined)?.(f);
  }

  abilities(): AbilityInfo[] {
    const b = this.bankai, m = this.masked, cd = this.cd;
    if (this.vasto) {
      return [
        { key: 'LMB', name: 'Claw & blade', kanji: '爪' },
        { key: 'RMB', name: 'Shatter', kanji: '砕', cd: cd.smash, cdMax: 2.4 },
        { key: 'Q', name: 'Horn Cero', kanji: '虚閃', cost: 22, cd: cd.cero, cdMax: 4, tint: '#ff3b52' },
        { key: 'E', name: 'Sonído', kanji: '響転', cost: 8, cd: cd.sonido, cdMax: 2.2 },
        { key: 'R', name: 'Roar', kanji: '咆', cost: 10, cd: cd.roar, cdMax: 7 },
        { key: 'Shift', name: 'Sonído', kanji: '響転', cost: 4 },
        { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
        { key: 'F', name: `Full Hollow ${Math.max(0, Math.ceil(this.vastoT))}s`, kanji: '虚', active: true, timer: this.vastoT / VASTO_TIME, tint: '#ff3b52' },
      ];
    }
    return [
      { key: 'LMB', name: this.matoiT > 0 ? 'Zangetsu · Matoi' : 'Zangetsu', kanji: '斬', active: this.matoiT > 0 },
      { key: 'RMB', name: 'Heavy', kanji: '断' },
      { key: 'Q', name: 'Getsuga', kanji: '月牙', cost: this.getsugaCost(), cd: this.getsugaCd, cdMax: this.getsugaCdMax(), tint: m ? '#ff3b52' : undefined },
      b
        ? { key: 'E', name: 'Getsuga thrust', kanji: '突', cost: m ? 10 : 16, cd: cd.thrust, cdMax: m ? 1.2 : 2.2 }
        : { key: 'E', name: 'Ground Getsuga', kanji: '地牙', cost: m ? 12 : 20, cd: cd.plow, cdMax: 3 },
      b && m
        ? { key: 'R', name: 'Getsuga barrage', kanji: '乱月', cost: 30, cd: cd.barrage, cdMax: 9, tint: '#ff3b52' }
        : b
          ? { key: 'R', name: 'Getsuga Matoi', kanji: '纏', cost: 24, cd: cd.matoi, cdMax: 14, active: this.matoiT > 0, timer: this.matoiT / MATOI_TIME }
          : { key: 'R', name: this.dart ? 'Reel in' : 'Deadly Darts', kanji: '投', cost: 14, cd: cd.darts, cdMax: 4, active: this.dart !== null },
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      { key: 'F', name: 'Bankai', kanji: '卍解', cost: 40, active: b, tint: '#ff6e86' },
      {
        key: 'G', name: m ? `Mask ${Math.ceil(this.maskT)}s` : 'Mask', kanji: '虚', cost: MASK_COST,
        cd: m ? 0 : this.maskCd, cdMax: MASK_CD, active: m, timer: m ? this.maskT / MASK_TIME : 0, tint: '#ff3b52',
      },
    ];
  }
}
