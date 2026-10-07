// Hollow Ichigo's kit (docs/roster/A1-ichigo.md §2: the inner Hollow, Zangetsu's true face). Ichigo's body with the
// colours inverted, and a different fighter. Shikai: the white Zangetsu used as a flail on its black cloth — the
// LMB string mixes close cuts with the blade flung out and yanked back, swung up over him in a launcher and
// whirled round him; E throws it far (Deadly Darts), E again tugs it onto a new line, then reels it in; R is the
// flail whirlwind that drags everything into the blade; Q a white Getsuga with a red lip. Bankai: the white Tensa
// Zangetsu — faster cuts, a red Getsuga, the blade spun round his hand by its chain and hurled point first to
// impale, the victim hauled in on the chain (E), and the pincer: red Getsuga from both sides, then from above (R).
// G is the bare hand: a blade caught in his fist turns white and crumbles (the attacker disarmed, then cut down),
// a Getsuga or a Cero is swatted aside. Low on life in Bankai, F lets the Full Hollow out — the black horned mask
// with white lines, regenerating, claw and blade, the horn Cero, Sonído, the roar — until the time runs out or a
// horn breaks. Passive, "the king and the horse": the longer his opponent hesitates, the harder he hits.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { Game } from '../game';
import { ichigoAsset, ichigoSword } from '../../chars/ichigo';
import { ichigoHollowAsset } from '../../chars/ichigoHollow';
import { VASTO_CHAIN, VASTO_CLIPS, VASTO_STANCE } from '../../chars/ichigoHollowClips';
import { HOLLOW_ICHIGO_CLIPS, HOLLOW_ICHIGO_EXTRA_VASTO, HOLLOW_ICHIGO_STANCE } from '../../chars/hollowIchigoClips';
import { AURA_WHITE_BANKAI, AURA_WHITE_HOLLOW, AURA_WHITE_SHIKAI } from '../../vfx/aura';
import { GetsugaProjectile } from '../projectiles/getsuga';
import { Corrosion, GETSUGA_RED, GETSUGA_WHITE, TetherBlade, type TetherHit, type TetherStyle } from '../../vfx/shiro';
import { SphereShape } from '../../destruction/shapes';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from '../../vfx/sprites';
import type { AbilityInfo } from '../../ui/hud';
import type { Kit, KitAI } from './kit';
import { HornCeroAction, RoarAction, SmashAction, SonidoAction, VastoStringAction, aimPoint } from './vasto';

type BladeDef = NonNullable<FighterDef['blade']>;
type Form = 'shikai' | 'bankai' | 'hollow';

/** sword trails: white streaks with a red lip (Shikai), red (Bankai) */
const BLADE_SHIKAI: BladeDef = { prop: 'sword', base: [0, 0, 0.16], tip: [0, 0, 1.56], color: '#E01B34', core: '#FFFFFF' };
const BLADE_BANKAI: BladeDef = { prop: 'sword', base: [0, 0, 0.17], tip: [0, 0, 0.92], color: '#FF2340', core: '#FFE1E6' };
const FORM_SPEED: Record<Form, FighterDef['speed']> = {
  shikai: { run: 9.5, sprint: 20, jump: 12, dash: 11, dashTime: 0.12 },
  bankai: { run: 12.5, sprint: 27, jump: 13, dash: 15.5, dashTime: 0.11 },
  hollow: { run: 15, sprint: 34, jump: 14.5, dash: 24, dashTime: 0.1 },
};
/** the Full Hollow holds this long before it lets him go */
export const FULL_HOLLOW_TIME = 30;
/** it may only be let out below this fraction of his life */
export const FULL_HOLLOW_AT = 0.4;
/** high-speed regeneration in the Full Hollow (HP/s) */
const REGEN = 9;
/** the white Zangetsu on its black cloth, the white Tensa Zangetsu on its chain */
const CLOTH: TetherStyle = { kind: 'cloth', color: '#24232B', length: 1.57, butt: -0.17, cutR: 0.6, glow: '#FFE3E7' };
const CHAIN: TetherStyle = { kind: 'chain', color: '#D9DCE1', length: 0.93, butt: -0.33, cutR: 0.32, glow: '#FF5A6E' };
const UP = new THREE.Vector3(0, 1, 0);

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

export const HOLLOW_ICHIGO_DEF: FighterDef = {
  id: 'hollowichigo',
  name: 'Hollow Ichigo',
  title: 'Zangetsu',
  build: () => ({ asset: ichigoAsset('shikai', 'white'), props: [{ key: 'sword', model: ichigoSword('shikai', 'white'), socket: 'grip.R' }] }),
  stance: HOLLOW_ICHIGO_STANCE,
  clips: HOLLOW_ICHIGO_CLIPS,
  aura: AURA_WHITE_SHIKAI,
  blade: BLADE_SHIKAI,
  hp: 1000,
  rei: 180,
  speed: { ...FORM_SPEED.shikai },
  radius: 0.4,
  height: 1.75,
};

// ------------------------------------------------------------------ cuts

interface CutInfo {
  window: [number, number];
  trail: [number, number];
  spec: BladeSpec;
  /** forward impulse at 'step' (stretched to reach the target) */
  lunge?: number;
  /** jump at 'step' */
  jump?: number;
  /** second hit window (the spin) */
  rehit?: number;
  /** ground impact at 'fx' */
  impact?: { radius: number; power: number };
}

const CUTS: Record<string, CutInfo> = {
  slash1: { window: [0.1, 0.24], trail: [0.08, 0.33], spec: { damage: 17, knock: 6, launch: 0, hitstop: 0.05, shake: 0.12, cut: 180 }, lunge: 7 },
  slash2: { window: [0.09, 0.22], trail: [0.07, 0.32], spec: { damage: 17, knock: 6, launch: 3, hitstop: 0.05, shake: 0.12, cut: 180 }, lunge: 6 },
  slash3: { window: [0.21, 0.31], trail: [0.17, 0.42], spec: { damage: 44, knock: 9, launch: 7, heavy: true, hitstop: 0.11, shake: 0.45, cut: 400 }, lunge: 6.5, impact: { radius: 1.7, power: 120 } },
  slash4: { window: [0.08, 0.47], trail: [0.06, 0.5], spec: { damage: 14, knock: 9, launch: 2, hitstop: 0.04, shake: 0.15, cut: 210 }, lunge: 4, rehit: 0.28 },
  slash5: { window: [0.34, 0.47], trail: [0.3, 0.6], spec: { damage: 48, knock: 18, launch: 6, heavy: true, hitstop: 0.13, shake: 0.6, cut: 440 }, lunge: 7, jump: 8.5, impact: { radius: 2.1, power: 120 } },
};

/** One close cut (Ichigo's clips; faster in Bankai). */
class CutAction extends FighterAction {
  readonly name: string;
  private info: CutInfo;
  private dur = 0;
  private comboAt = 0;
  private impacted = false;
  private rehitDone = false;
  private swished = false;
  private stopAt = 0;
  queued = false;

  constructor(readonly kit: HollowIchigoKit, readonly clip: string, readonly index: number, readonly sp = 1, readonly scale = 1) {
    super();
    this.name = clip;
    this.info = CUTS[clip];
    this.mobility = 0.12;
    this.airGravity = 0.12;
  }

  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = (c.dur - c.fadeOut * 0.5) / this.sp;
    this.comboAt = (c.events.combo ?? c.dur * 0.6) / this.sp;
    f.bladeHits.clear();
    f.bladeSpec = { ...this.info.spec, damage: this.info.spec.damage * this.scale };
    // out of reach: dash in at the start so the arc arrives as the window opens; stop at striking distance
    let dashed = false;
    const tgt = f.faceTarget;
    if (this.info.lunge && tgt) {
      const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
      this.stopAt = 1.3;
      if (d > this.stopAt + 0.25 && d < 9) {
        const per = (1 - Math.exp(-f.pushDrag * Math.max(0.06, this.info.window[0] / this.sp - 0.03))) / f.pushDrag;
        f.push.addScaledVector(f.forward(), Math.min(28, (d - this.stopAt) / per));
        dashed = true;
      }
    }
    f.anim.play(this.clip, {
      speed: this.sp,
      onEvent: (n) => {
        if (n === 'step' && this.info.lunge) {
          if (!dashed) f.push.addScaledVector(f.forward(), this.info.lunge);
          if (this.info.jump && f.grounded) f.push.y = this.info.jump;
        }
        if (n === 'fx' && this.info.impact && !this.impacted) {
          this.impacted = true;
          const tip = f.blade.tip.clone();
          const gy = groundBelow(g, tip);
          if (gy !== null && tip.y - gy < 1.2) {
            tip.y = gy;
            g.groundImpact(tip, this.info.impact.radius, this.info.impact.power, f.def.aura.body, f);
            g.shake(this.info.spec.shake);
          }
        }
      },
    });
  }

  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t * this.sp;
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
    if (this.info.rehit && !this.rehitDone && t >= this.info.rehit) {
      this.rehitDone = true;
      f.bladeHits.clear();
    }
    if (this.queued && this.t >= this.comboAt) {
      this.done = true;
      this.kit.chain(this.index + 1);
      return;
    }
    if (this.t >= this.dur) this.done = true;
  }

  override end(f: Fighter): void {
    f.bladeActive = false;
    if (f.trail) f.trail.emitting = false;
  }

  override canCancel(next: FighterAction): boolean {
    if (next.name === 'dash' || next instanceof GetsugaAction || next instanceof CatchAction) return this.t * this.sp >= this.info.window[0] + 0.06;
    return false;
  }
}

function groundBelow(g: Game, p: THREE.Vector3): number | null {
  const w = g.engine.world;
  const vs = w.vs;
  const x = Math.floor(p.x / vs), z = Math.floor(p.z / vs);
  for (let y = Math.floor((p.y + 0.6) / vs); y > Math.floor((p.y - 2.5) / vs); y--) if (w.isSolid(x, y, z)) return (y + 1) * vs;
  return null;
}

// ------------------------------------------------------------------ the tether moves

/** Base for the moves that take the blade off the hand: cleans up the tether and puts the sword back. */
abstract class TetherAction extends FighterAction {
  protected blade: TetherBlade | null = null;
  protected caughtAt = -1;
  queued = false;
  constructor(readonly kit: HollowIchigoKit, readonly index: number) {
    super();
  }
  /** the blade is back in the hand: show the sword, play the catch */
  protected checkCatch(f: Fighter, g: Game, clip = 'hi_yank'): boolean {
    const b = this.blade;
    if (this.caughtAt < 0 && b && b.done) {
      this.caughtAt = this.t;
      this.kit.swordVisible(true);
      f.anim.play(clip, { speed: this.kit.form === 'bankai' ? 1.3 : 1 });
      g.sfx.play('hit', f.center(), 0.45);
      return true;
    }
    return false;
  }
  /** after the catch: chain on (queued), or end */
  protected afterCatch(hold = 0.34): void {
    if (this.caughtAt < 0) return;
    if (this.queued && this.t - this.caughtAt > 0.06) {
      this.done = true;
      this.kit.chain(this.index + 1);
      return;
    }
    if (this.t - this.caughtAt > hold) this.done = true;
  }
  private ended = false;
  override end(f: Fighter): void {
    // a chained move ends this one before it starts, then the fighter ends it again: only the first counts
    // (a second call would show the sword in the hand while the next move has it out on the tether)
    if (this.ended) return;
    this.ended = true;
    if (this.blade && !this.blade.done) this.blade.done = true;
    this.kit.swordVisible(true);
    f.bladeActive = false;
    if (f.trail) f.trail.emitting = false;
  }
  override canCancel(next: FighterAction): boolean {
    return (next.name === 'dash' || next instanceof CatchAction) && (this.caughtAt >= 0 || this.t > 0.3);
  }
}

/** The blade flung straight out on its tether and yanked back (LMB step 3; on the chain in Bankai). */
class FlingAction extends TetherAction {
  readonly name = 'fling';
  private thrown = false;
  constructor(kit: HollowIchigoKit, index: number) {
    super(kit, index);
    this.mobility = 0.25;
    this.airGravity = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    const bk = this.kit.form === 'bankai';
    f.anim.play('hi_fling', {
      speed: bk ? 1.3 : 1,
      hold: true,
      onEvent: (n) => {
        if (n === 'step') g.sfx.play('swingHeavy', f.center(), 0.9);
        if (n !== 'throw' || this.thrown) return;
        this.thrown = true;
        const tgt = f.faceTarget ? f.faceTarget.clone() : aimPoint(f, g, new THREE.Vector3());
        this.blade = this.kit.tether();
        this.blade.throwAt(tgt, bk
          ? { speed: 62, range: 11, spin: false, pierce: true, hit: { damage: 24, knock: 7, cut: 300 } }
          : { speed: 46, range: 9.5, spin: true, pierce: true, hit: { damage: 22, knock: 8, launch: 1, cut: 280 } });
        this.kit.swordVisible(false);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    this.checkCatch(f, g);
    this.afterCatch();
    if (this.t > 2.5) {
      this.blade?.reel();
      if (this.t > 3.5) this.done = true;
    }
  }
}

/** The cleaver swung on its cloth from low behind, up through a great arc in front: a launcher (LMB step 4). */
class UpswingAction extends TetherAction {
  readonly name = 'upswing';
  private swung = false;
  constructor(kit: HollowIchigoKit, index: number) {
    super(kit, index);
    this.mobility = 0.15;
  }
  override start(f: Fighter, g: Game): void {
    const tgt = f.faceTarget;
    if (tgt) {
      // close the gap so the arc comes up through him
      const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
      if (d > 2.8 && d < 9) f.push.addScaledVector(f.forward(), Math.min(22, (d - 2.3) * 4.5));
    }
    f.anim.play('hi_upswing', {
      onEvent: (n) => {
        if (n === 'step') g.sfx.play('swingHeavy', f.center(), 1);
        if (n !== 'swing' || this.swung) return;
        this.swung = true;
        const fw = f.forward().clone();
        this.blade = this.kit.tether();
        this.blade.orbit({
          // the arc's centre over his shoulder, a little ahead: low behind, scraping the ground below, up in front
          center: () => new THREE.Vector3(f.pos.x + fw.x * 0.3, f.pos.y + 2.1, f.pos.z + fw.z * 0.3),
          u: fw, v: UP.clone(), radius: 0.55, a0: -2.3, a1: 1.25, dur: 0.24, ease: (k) => 1 - (1 - k) * (1 - k),
          hit: { damage: 24, knock: 3, launch: 11, cut: 320 },
        });
        this.kit.swordVisible(false);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    this.checkCatch(f, g);
    this.afterCatch(0.3);
    if (this.t > 2) this.done = true;
  }
}

/** The finisher: the cleaver whirled twice round him on its cloth, then hauled in (LMB step 5). */
class WhirlAction extends TetherAction {
  readonly name: string = 'whirl';
  constructor(kit: HollowIchigoKit, index: number, readonly turns = 2, readonly dur = 0.75, readonly reach = 1.5, readonly hit: TetherHit = { damage: 16, knock: 10, cut: 300 }) {
    super(kit, index);
    this.mobility = 0.3;
    this.armor = 0.3;
  }
  /** height of the circle over his feet: it dips (the cloth droops) toward a target below him */
  private cy = 1.2;
  private dipTo(f: Fighter): number {
    const t = f.faceTarget;
    return t ? Math.max(-1.7, Math.min(1.4, t.y - f.def.height * 0.55 * 0.97 + 1.05 - f.pos.y)) : 1.2;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('hi_whirl', {});
    const fw = f.forward().clone();
    const right = new THREE.Vector3(-fw.z, 0, fw.x);
    this.cy = this.dipTo(f);
    this.blade = this.kit.tether();
    this.blade.orbit({
      center: () => new THREE.Vector3(f.pos.x, f.pos.y + this.cy, f.pos.z),
      u: fw, v: right, radius: this.reach, a0: Math.PI * 0.5, a1: Math.PI * 0.5 + Math.PI * 2 * this.turns, dur: this.dur,
      hit: this.hit,
    });
    this.kit.swordVisible(false);
    g.sfx.play('swingHeavy', f.center(), 1.1);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    this.cy += (this.dipTo(f) - this.cy) * Math.min(1, dt * 6);
    this.checkCatch(f, g);
    this.afterCatch(0.32);
    if (this.t > this.dur + 1.5) this.done = true;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.caughtAt >= 0;
  }
}

/** R (Shikai): the flail whirlwind — the cleaver round him on its cloth for turn after turn, dragging all in. */
class WhirlwindAction extends WhirlAction {
  override readonly name: string = 'whirlwind';
  constructor(kit: HollowIchigoKit) {
    super(kit, -1, 5, 2.4, 1.6, { damage: 14, knock: 6, launch: 2, cut: 340 });
    this.mobility = 0.45;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    super.start(f, g);
    g.callout('ぶん回し', 'BUNMAWASHI — FLAIL WHIRLWIND', '#f3f3f0');
    f.aura.flare(1.4, 0.4);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.caughtAt >= 0 || !this.blade) return;
    // the wind it makes drags everyone near into the blade's circle
    for (const o of g.enemiesOf(f)) {
      const dx = f.pos.x - o.pos.x, dz = f.pos.z - o.pos.z;
      const d = Math.hypot(dx, dz);
      if (d > 12 || d < 2.6) continue;
      const k = 13 * (1 - d / 12) * dt;
      o.push.x += (dx / d) * k * 4;
      o.push.z += (dz / d) * k * 4;
    }
    // dust whirled up round him
    if (Math.random() < 0.6) {
      const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 2.5;
      g.engine.dust.spawn({ x: f.pos.x + Math.cos(a) * r, y: f.pos.y + 0.2, z: f.pos.z + Math.sin(a) * r, vx: -Math.sin(a) * 6, vy: 1.5 + Math.random() * 2, vz: Math.cos(a) * 6, size: 0.6, sizeEnd: 1.8, life: 0.8, r: 0.62, g: 0.6, b: 0.56, alpha: 0.4, alphaEnd: 0, tex: TEX_PUFF, drag: 1.5 });
    }
  }
}

/** E (Shikai): Deadly Darts — thrown far on its cloth; E again tugs it onto a new line; then it is reeled in. */
class DartsAction extends TetherAction {
  readonly name = 'darts';
  private thrown = false;
  tugged = false;
  constructor(kit: HollowIchigoKit) {
    super(kit, -1);
    this.mobility = 0.35;
    this.armor = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('hi_fling', {
      hold: true,
      onEvent: (n) => {
        if (n === 'step') g.sfx.play('swingHeavy', f.center(), 1.1);
        if (n !== 'throw' || this.thrown) return;
        this.thrown = true;
        const tgt = f.faceTarget ? f.faceTarget.clone() : aimPoint(f, g, new THREE.Vector3());
        this.blade = this.kit.tether();
        this.blade.throwAt(tgt, { speed: 40, range: 26, spin: true, pierce: true, hit: { damage: 44, knock: 12, launch: 3, heavy: true, cut: 480 } });
        this.kit.dart = this;
        this.kit.swordVisible(false);
      },
    });
  }
  /** the tug: the blade swung onto the target again, from wherever it is */
  tug(f: Fighter, g: Game): boolean {
    const b = this.blade;
    if (!b || this.tugged || b.done) return false;
    const tgt = f.faceTarget ? f.faceTarget.clone() : aimPoint(f, g, new THREE.Vector3());
    if (!b.redirect(tgt, 14)) return false;
    this.tugged = true;
    f.anim.play('hi_fling', { speed: 1.6, hold: true });
    return true;
  }
  reel(): void {
    this.blade?.reel();
  }
  /** where the blade is (the AI tugs when it has gone wide of the target) */
  bladeAt(out: THREE.Vector3): THREE.Vector3 | null {
    return this.blade && !this.blade.done && this.blade.mode === 'throw' ? this.blade.mid(out) : null;
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.checkCatch(f, g)) this.kit.dart = null;
    this.afterCatch(0.36);
    if (this.t > 5) {
      this.blade?.reel();
      if (this.t > 6.5) this.done = true;
    }
  }
  override end(f: Fighter): void {
    super.end(f);
    if (this.kit.dart === this) this.kit.dart = null;
  }
}

/** E (Bankai): the chain-spin — Tensa Zangetsu whirled round his hand on its chain, hurled point first to impale,
 *  the victim hauled in on the chain. */
class ChainTossAction extends TetherAction {
  readonly name = 'chaintoss';
  private thrown = false;
  private reeling = false;
  private spinT = 0.7;
  constructor(kit: HollowIchigoKit) {
    super(kit, -1);
    this.mobility = 0.3;
    this.armor = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('hi_twirl', {});
    const fw = f.forward().clone();
    this.blade = this.kit.tether();
    // it keeps turning through the wind-up of the throw (the throw takes it over)
    this.blade.orbit({
      center: () => this.kit.handWorld(new THREE.Vector3()),
      u: fw, v: UP.clone(), radius: 0.22, a0: 0, a1: Math.PI * 2 * 7, dur: this.spinT + 0.28,
      hit: { damage: 8, knock: 4, cut: 120 },
    });
    this.blade.onHit = (o, impaled) => {
      if (!impaled) return;
      g.callout('', 'IMPALED', '#ff3b52');
      this.kit.instinctHit(0.15);
      o.slow(0.4, 1.2);
    };
    this.kit.swordVisible(false);
    g.sfx.play('swingHeavy', f.center(), 0.8);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const b = this.blade;
    if (!this.thrown && this.t >= this.spinT) {
      this.thrown = true;
      this.mobility = 0;
      f.anim.play('hi_toss', {
        hold: true,
        onEvent: (n) => {
          if (n !== 'throw' || !b || b.done) return;
          const tgt = f.faceTarget ? f.faceTarget.clone() : aimPoint(f, g, new THREE.Vector3());
          b.throwAt(tgt, { speed: 64, range: 32, spin: false, impale: true, hit: { damage: 70, knock: 0, heavy: true, cut: 650, hitstop: 0.12 } });
          g.sfx.play('swingHeavy', f.center(), 1.3);
          f.aura.flare(1.3, 0.3);
        },
      });
    }
    // the haul on the chain: when it bites (the drag starts) or comes back empty
    if (b && !b.done && !this.reeling && this.thrown && (b.mode === 'drag' || b.mode === 'return' || b.mode === 'stuck')) {
      this.reeling = true;
      f.anim.play('hi_reel', { hold: true });
      g.sfx.play('swingHeavy', f.center(), 0.8);
    }
    this.checkCatch(f, g);
    this.afterCatch(0.3);
    if (this.t > 5) this.done = true;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.caughtAt >= 0;
  }
}

// ------------------------------------------------------------------ Getsuga

/** Q: Getsuga Tenshō — white with a red lip in Shikai, bright red in Bankai. */
class GetsugaAction extends FighterAction {
  readonly name = 'getsuga';
  private fired = false;
  constructor(readonly kit: HollowIchigoKit) {
    super();
    this.mobility = 0.05;
    this.airGravity = 0.05;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    f.bladeSpec = { damage: 20, knock: 8, launch: 3, hitstop: 0.06, shake: 0.2, cut: 300 };
    const bk = this.kit.form === 'bankai';
    f.anim.play('getsuga', {
      speed: bk ? 1.15 : 1,
      onEvent: (n) => {
        if (n === 'charge') {
          f.aura.flare(1.4, 0.55);
          g.callout('月牙天衝', 'GETSUGA TENSHŌ', bk ? '#ff2340' : '#f3f3f0');
          g.sfx.play('flare', f.center(), 0.6);
        }
        if (n === 'fx' && !this.fired) this.fire(f, g);
      },
    });
  }
  private fire(f: Fighter, g: Game): void {
    this.fired = true;
    const dir = new THREE.Vector3();
    if (f.faceTarget) dir.subVectors(f.faceTarget, f.center());
    else if (f === g.player) dir.subVectors(g.aimPoint(f), f.center());
    else f.forward(dir);
    const flat = Math.hypot(dir.x, dir.z) || 1;
    dir.y = Math.max(f.faceTarget ? -0.5 : -0.06, Math.min(0.6, dir.y / flat)) * flat;
    dir.normalize();
    const right = new THREE.Vector3(dir.z, 0, -dir.x).normalize().multiplyScalar(-1);
    const side = new THREE.Vector3(0, 1, 0).multiplyScalar(Math.cos(0.7)).addScaledVector(right, Math.sin(0.7));
    const origin = f.center().addScaledVector(dir, 1.2);
    origin.y += 0.35;
    const bk = this.kit.form === 'bankai';
    g.addProjectile(new GetsugaProjectile(g, f, origin, dir, side, {
      radius: bk ? 3.5 : 2.7, halfAngle: 1.15, speed: bk ? 56 : 42, range: bk ? 115 : 75, damage: bk ? 145 : 85, cut: bk ? 950 : 560,
      colors: bk ? GETSUGA_RED : GETSUGA_WHITE,
    }));
    g.shake(0.45);
    g.hitstop(0.06);
    g.sfx.play(bk ? 'getsugaBlack' : 'getsuga', origin);
    f.aura.flare(1.8, 0.4);
    g.engine.gr.chroma.offset.set(0.004, 0.004);
    if (f === g.player) g.cam.punchFov(6);
    f.push.addScaledVector(dir, -3);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const sp = this.kit.form === 'bankai' ? 1.15 : 1;
    const c = f.anim.clip('getsuga')!;
    const t = this.t * sp;
    if (f.trail) f.trail.emitting = t > 0.42 && t < 0.62;
    f.bladeActive = t > 0.45 && t < 0.56;
    if (t >= c.dur - c.fadeOut * 0.5) this.done = true;
  }
  override end(f: Fighter): void {
    f.bladeActive = false;
    if (f.trail) f.trail.emitting = false;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.fired && this.t > 0.6;
  }
}

/** R (Bankai): the pincer — a red Getsuga from one side, the other side, then from above. */
class PincerAction extends FighterAction {
  readonly name = 'pincer';
  private step = -1;
  private next = 0;
  constructor(readonly kit: HollowIchigoKit, readonly target: Fighter) {
    super();
    this.mobility = 0;
    this.airGravity = 0;
    this.invulnerable = true;
    this.trackTarget = true;
  }
  override start(_f: Fighter, g: Game): void {
    g.callout('月牙天衝', 'GETSUGA TENSHŌ — PINCER', '#ff2340');
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
    if (this.step >= 3) {
      if (this.t > this.next + 0.3) this.done = true;
      return;
    }
    const base = Math.atan2(f.pos.x - o.pos.x, f.pos.z - o.pos.z);
    const from = f.center();
    f.ghosts.spawn(1, 0.35);
    if (this.step < 2) {
      // a flank, at Getsuga range
      const a = base + (this.step === 0 ? 1.35 : -2.7);
      f.body.pos.set(o.pos.x + Math.sin(a) * 8.5, Math.max(o.pos.y, f.pos.y) + 0.8, o.pos.z + Math.cos(a) * 8.5);
    } else {
      // above and a little behind: the last one comes straight down
      f.body.pos.set(o.pos.x + Math.sin(base) * 3, o.pos.y + 8, o.pos.z + Math.cos(base) * 3);
    }
    f.body.prev.copy(f.body.pos);
    f.body.vel.set(0, 0, 0);
    f.yaw = Math.atan2(o.pos.x - f.body.pos.x, o.pos.z - f.body.pos.z);
    g.sfx.play('shunpo', from, 0.8);
    f.anim.play('getsuga', { speed: 2.4 });
    const dir = new THREE.Vector3().subVectors(o.center(), f.center()).normalize();
    const side = new THREE.Vector3(0, 1, 0).multiplyScalar(Math.cos(0.7 + this.step * 1.2)).addScaledVector(new THREE.Vector3(dir.z, 0, -dir.x).normalize(), Math.sin(0.7 + this.step * 1.2));
    if (Math.abs(dir.y) > 0.8) side.set(dir.z, 0, -dir.x).normalize();
    const origin = f.center().addScaledVector(dir, 1);
    const last = this.step === 2;
    g.addProjectile(new GetsugaProjectile(g, f, origin, dir, side, {
      radius: last ? 3.8 : 3, halfAngle: 1.15, speed: last ? 66 : 60, range: last ? 40 : 50, damage: last ? 70 : 55, cut: last ? 1300 : 1000,
      colors: GETSUGA_RED,
    }));
    g.sfx.play('getsugaBlack', origin, last ? 1.2 : 0.9);
    g.shake(f === g.player ? 0.4 : 0.2);
    this.next = this.t + (last ? 0.45 : 0.32);
  }
}

// ------------------------------------------------------------------ the bare hand

/** G: the bare-hand catch. A blade caught corrodes and crumbles (the attacker disarmed, then cut down); a
 *  Getsuga or a Cero is swatted aside. */
class CatchAction extends FighterAction {
  readonly name = 'catch';
  open = false;
  private caught: Fighter | null = null;
  private caughtAt = -1;
  private countered = false;
  private energy = false;
  constructor(readonly kit: HollowIchigoKit) {
    super();
    this.mobility = 0.1;
    this.armor = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('hi_catch', {});
    g.sfx.play('flare', f.center(), 0.35);
  }
  /** the parry: something reached the open hand */
  take(f: Fighter, g: Game, from: Fighter | null, energy: boolean): void {
    if (this.caughtAt >= 0) return;
    this.caughtAt = this.t;
    this.open = false;
    this.energy = energy;
    const hand = this.kit.palmWorld(new THREE.Vector3());
    // white sparks off the palm
    for (let i = 0; i < 16; i++) g.engine.glow.spawn({ x: hand.x, y: hand.y, z: hand.z, vx: (Math.random() - 0.5) * 6, vy: Math.random() * 4, vz: (Math.random() - 0.5) * 6, size: 0.07, sizeEnd: 0.02, life: 0.35, r: 1, g: 0.95, b: 0.95, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2, drag: 2 });
    g.hitstop(0.08);
    if (energy) {
      // swatted aside: whatever else is in the air near him is undone too
      g.rejectNear(hand, 3, f, false);
      g.callout('', 'SWATTED ASIDE', '#f3f3f0');
      g.sfx.play('impact', hand, 1);
      f.anim.play('slash2', { speed: 1.4 });
      this.kit.instinctHit(0.1);
      return;
    }
    g.sfx.play('hitHeavy', hand, 0.8);
    f.anim.play('hi_grab', {});
    if (from && !from.dead) {
      this.caught = from;
      // corrosion grip: the blade turns white from his fist and crumbles
      if (from.def.blade) {
        from.disarmT = Math.max(from.disarmT, 5);
        g.addProjectile(new Corrosion(from, 0.55));
        g.callout('', 'CORRODED', '#f3f3f0');
      } else g.callout('', 'CAUGHT', '#f3f3f0');
      from.stopAction();
      from.hitstun = Math.max(from.hitstun, 0.7);
      from.push.set(0, 0, 0);
    }
    this.kit.instinctHit(0.2);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.caughtAt < 0) {
      this.open = this.t >= 0.04 && this.t <= 0.55;
      if (this.t >= 0.72) this.done = true;
      return;
    }
    const since = this.t - this.caughtAt;
    // held a moment in the fist, then the counter-cut
    const o = this.caught;
    if (o && !this.countered && since >= 0.36) {
      this.countered = true;
      if (!o.dead) {
        o.hitstun = Math.max(o.hitstun, 0.3);
        f.yaw = Math.atan2(o.pos.x - f.pos.x, o.pos.z - f.pos.z);
      }
      this.done = true;
      this.kit.counter();
      return;
    }
    if (this.energy && since > 0.45) this.done = true;
    if (!o && since > 0.5) this.done = true;
  }
  override end(): void {
    this.open = false;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.caughtAt >= 0;
  }
}

/** The opener / taunt: the head thrown back, laughing. */
class LaughAction extends FighterAction {
  readonly name = 'laugh';
  constructor() {
    super();
    this.mobility = 0;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('hi_laugh', { onEvent: (n) => n === 'laugh' && g.callout('', 'HAHAHA!', '#f3f3f0') });
    f.aura.flare(1.2, 0.5);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 1.45) this.done = true;
  }
  override canCancel(): boolean {
    return true;
  }
}

// ------------------------------------------------------------------ the forms

/** F (Shikai): Bankai — the pillar, the white coat, the white Tensa Zangetsu. */
class ReleaseAction extends FighterAction {
  readonly name = 'release';
  constructor(readonly kit: HollowIchigoKit) {
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
          g.groundImpact(f.pos.clone(), 3.2, 90, AURA_WHITE_BANKAI.body, f);
          g.shake(0.9);
          g.hitstop(0.12);
          g.slowMo(0.5, 0.35);
          g.engine.gr.chroma.offset.set(0.006, 0.006);
          this.kit.toBankai();
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

/** F (Bankai, low on life): the Full Hollow — doubled over clawing at his face, then the body changes and he roars. */
class FullHollowAction extends FighterAction {
  readonly name = 'fullhollow';
  private changed = false;
  constructor(readonly kit: HollowIchigoKit) {
    super();
    this.mobility = 0;
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    this.kit.swordVisible(false);
    f.anim.play('hi_rise', {
      onEvent: (n) => {
        if (n === 'claw') {
          g.sfx.play('crack', f.center(), 1.1);
          f.aura.flare(1.4, 0.4);
        }
        if (n === 'burst' && !this.changed) {
          this.changed = true;
          this.kit.becomeHollow();
          f.anim.play('vl_roar', { fadeIn: 0.05, onEvent: (m) => m === 'roar' && this.kit.roarBurst(1.25) });
        }
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.changed) {
      // black and white reiatsu boiling up off him
      const c = f.center();
      for (let i = 0; i < 3; i++) {
        const white = Math.random() < 0.35;
        g.engine.dust.spawn({ x: c.x + (Math.random() - 0.5) * 0.8, y: f.pos.y + Math.random() * 1.6, z: c.z + (Math.random() - 0.5) * 0.8, vx: (Math.random() - 0.5) * 0.6, vy: 1.6, vz: (Math.random() - 0.5) * 0.6, size: 0.3, sizeEnd: 0.9, life: 0.8, r: white ? 0.9 : 0.04, g: white ? 0.9 : 0.03, b: white ? 0.88 : 0.05, alpha: 0.65, alphaEnd: 0, tex: TEX_PUFF, drag: 1 });
      }
    }
    if (this.t >= 2.3) this.done = true;
  }
}

/** A horn breaks in the Full Hollow: the mask cracks, he drops to a knee and the Bankai body comes back. */
class HornBreakAction extends FighterAction {
  readonly name = 'hornbreak';
  constructor(readonly kit: HollowIchigoKit, readonly hpFrac: number) {
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
        const p = f.center().setY(f.pos.y + 1.65);
        g.sfx.play('shatter', p, 1.3);
        g.callout('', 'THE HORN BREAKS', '#f3f3f0');
        for (let i = 0; i < 40; i++) g.engine.glow.spawn({ x: p.x, y: p.y + 0.15, z: p.z, vx: (Math.random() - 0.5) * 6, vy: Math.random() * 5, vz: (Math.random() - 0.5) * 6, size: 0.06, sizeEnd: 0.03, life: 0.9, r: 0.12, g: 0.12, b: 0.14, alpha: 1, alphaEnd: 0.5, tex: TEX_GLOW, drag: 1, gravity: -9 });
        g.addRing(p.clone(), 4, '#ff3b52', 0.3);
        g.shake(f === g.player ? 0.6 : 0.2);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 1.7) {
      this.kit.endHollow(this.hpFrac);
      this.done = true;
    }
  }
}

// ------------------------------------------------------------------ the kit

export class HollowIchigoKit implements Kit {
  form: Form = 'shikai';
  comboIndex = 0;
  private lastSwingEnd = 0;
  getsugaCd = 0;
  flare = false;
  /** Deadly Darts out on its cloth */
  dart: DartsAction | null = null;
  /** the Full Hollow's clock */
  hollowT = 0;
  private hollowUsed = false;
  private vastoIndex = 0;
  private vastoLast = 0;
  /** "the king and the horse": 0 → 1 as the opponent hesitates (more damage) */
  instinct = 0;
  private basePower = 1;
  readonly cd = { darts: 0, whirlwind: 0, toss: 0, pincer: 0, catch: 0, cero: 0, sonido: 0, roar: 0, smash: 0 };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.parry = (_amount, from, o) => this.tryCatch(from, o.energy === true, o.quiet === true);
    f.onHurt = (dmg, heavy) => this.onHurt(dmg, heavy);
    f.onLethal = () => this.onLethal();
    this.hands();
    this.applyLook();
    this.applyStats();
  }

  get bankai(): boolean {
    return this.form === 'bankai';
  }

  /** the sword hand closed, the left hand open */
  private hands(): void {
    const rig = this.f.visual.rig;
    rig.setBoneVisible('fist.R', true);
    rig.setBoneVisible('palm.R', false);
    rig.setBoneVisible('fist.L', false);
    rig.setBoneVisible('palm.L', true);
  }

  update(dt: number): void {
    const f = this.f;
    this.getsugaCd = Math.max(0, this.getsugaCd - dt);
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    if (this.form === 'hollow' && !f.dead) {
      this.hollowT -= dt;
      // high-speed regeneration
      if (!(f.action instanceof HornBreakAction)) f.hp = Math.min(f.maxHp, f.hp + REGEN * dt);
      if (this.hollowT <= 0 && !(f.action instanceof HornBreakAction) && !(f.action instanceof FullHollowAction) && f.hitstun <= 0) this.breakHorn(0.3);
      if (Math.random() < 0.4) {
        const c = f.center();
        const white = Math.random() < 0.3;
        this.g.engine.dust.spawn({ x: c.x + (Math.random() - 0.5) * 0.6, y: f.pos.y + 0.2 + Math.random() * 1.4, z: c.z + (Math.random() - 0.5) * 0.6, vx: 0, vy: 1.2, vz: 0, size: 0.2, sizeEnd: 0.7, life: 0.6, r: white ? 0.85 : 0.04, g: white ? 0.85 : 0.03, b: white ? 0.83 : 0.05, alpha: 0.45, alphaEnd: 0, tex: TEX_PUFF, drag: 1 });
      }
    }
    // the king and the horse: hesitation feeds him, attacks that land on him tame him
    const o = this.g.nearestEnemy(f, 16);
    if (o && !f.dead) {
      const pressing = (o.action !== null && o.action.name !== 'dash' && o.action.name !== 'laugh') || o.dashT > 0;
      this.instinct = Math.max(0, Math.min(1, this.instinct + (pressing ? -0.03 : o.hitstun > 0 ? 0.02 : 0.07) * dt));
    } else this.instinct = Math.max(0, this.instinct - 0.05 * dt);
    f.power = this.basePower * (1 + 0.45 * this.instinct);
  }

  /** a landed blow (a catch, an impaling) feeds the instinct */
  instinctHit(k: number): void {
    this.instinct = Math.min(1, this.instinct + k);
  }

  private onHurt(dmg: number, heavy: boolean): void {
    if (this.f.dead) return;
    this.instinct = Math.max(0, this.instinct - (heavy ? 0.3 : Math.min(0.15, dmg / 300)));
  }

  // ---------------------------------------------------------------- inputs

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (this.form === 'hollow') {
      if (cur instanceof VastoStringAction) {
        cur.queued = true;
        return;
      }
      if (f.busy) return;
      if (this.g.time - this.vastoLast > 0.8) this.vastoIndex = 0;
      this.vastoChain(this.vastoIndex);
      return;
    }
    if (cur instanceof CutAction || cur instanceof TetherAction) {
      if (cur.index >= 0) cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastSwingEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  /** the LMB string: Shikai — cut, cut, fling, upswing, whirl; Bankai — cut, cut, chain fling, spin, leap */
  chain(i: number): void {
    const f = this.f;
    const idx = i % 5;
    this.comboIndex = idx + 1;
    this.lastSwingEnd = this.g.time + 0.8;
    const bk = this.form === 'bankai';
    let a: FighterAction;
    if (idx === 2) a = new FlingAction(this, idx);
    else if (!bk && idx === 3) a = new UpswingAction(this, idx);
    else if (!bk && idx === 4) a = new WhirlAction(this, idx);
    else a = new CutAction(this, ['slash1', 'slash2', '', 'slash4', 'slash5'][idx], idx, bk ? 1.3 : 1, bk ? 1.25 : 1);
    f.act(a, true);
  }

  vastoChain(i: number): void {
    const idx = i % VASTO_CHAIN.length;
    this.vastoIndex = idx + 1;
    this.vastoLast = this.g.time + 0.8;
    this.f.act(new VastoStringAction(this, VASTO_CHAIN[idx], idx), true);
  }

  heavy(): void {
    const f = this.f;
    if (this.form === 'hollow') {
      this.special(new SmashAction(this), 0, 'smash', 2.4);
      return;
    }
    if (f.busy && !(f.action instanceof CutAction)) return;
    if (f.action instanceof CutAction && f.action.t < 0.25) return;
    this.comboIndex = 0;
    const bk = this.form === 'bankai';
    f.act(new CutAction(this, f.grounded ? 'slash3' : 'slash5', -1, bk ? 1.2 : 1, bk ? 1.25 : 1), true);
  }

  /** Q: Getsuga Tenshō / the horn Cero */
  skill1(): void {
    if (this.form === 'hollow') {
      this.special(new HornCeroAction(this), 22, 'cero', 4);
      return;
    }
    const f = this.f;
    if (this.getsugaCd > 0) return;
    const a = new GetsugaAction(this);
    if (f.action && !f.action.canCancel(a)) return;
    if (f.hitstun > 0) return;
    if (!f.spendRei(this.getsugaCost())) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    this.getsugaCd = this.bankai ? 0.6 : 1;
    f.act(a, true);
  }

  private getsugaCost(): number {
    return this.bankai ? 18 : 25;
  }

  /** E: Deadly Darts (again: tug, then reel) / the chain-spin toss / Sonído */
  skill2(): void {
    if (this.form === 'hollow') {
      const t = this.near(24);
      if (t) this.special(new SonidoAction(this, t), 8, 'sonido', 2.2);
      return;
    }
    if (this.dart) {
      if (!this.dart.tugged && this.dart.tug(this.f, this.g)) return;
      this.dart.reel();
      return;
    }
    if (this.bankai) this.special(new ChainTossAction(this), 22, 'toss', 4.5);
    else this.special(new DartsAction(this), 14, 'darts', 4);
  }

  /** R: the flail whirlwind / the Getsuga pincer / the roar */
  skill3(): void {
    if (this.form === 'hollow') {
      this.special(new RoarAction(this), 10, 'roar', 7);
      return;
    }
    if (this.bankai) {
      const t = this.near(40);
      if (t) this.special(new PincerAction(this, t), 34, 'pincer', 10);
    } else this.special(new WhirlwindAction(this), 24, 'whirlwind', 8);
  }

  /** G: the bare-hand catch */
  toggle(): void {
    const f = this.f;
    if (this.cd.catch > 0 || f.dead || f.hitstun > 0 || f.dashT > 0) return;
    const a = new CatchAction(this);
    if (f.action && !f.action.canCancel(a)) return;
    if (!f.spendRei(10)) return;
    this.cd.catch = 3.5;
    f.act(a, true);
  }

  /** F: Bankai; in Bankai, low on life, the Full Hollow */
  release(): void {
    const f = this.f;
    if (f.busy || this.form === 'hollow') return;
    if (this.form === 'bankai') {
      if (this.hollowUsed) return;
      if (f.hp > f.maxHp * FULL_HOLLOW_AT) {
        if (f === this.g.player) this.g.hud?.showBanner('The Hollow waits — below 40% life');
        return;
      }
      this.hollowUsed = true;
      f.act(new FullHollowAction(this), true);
      return;
    }
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

  /** the AI's opener */
  laugh(): void {
    if (!this.f.busy) this.f.act(new LaughAction());
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

  // ---------------------------------------------------------------- the blade off the hand

  /** a new tether blade for the current form (registered with the game) */
  tether(): TetherBlade {
    const bk = this.form !== 'shikai';
    const b = new TetherBlade(this.g, this.f, ichigoSword(bk ? 'bankai' : 'shikai', 'white'), () => this.handWorld(new THREE.Vector3()), bk ? CHAIN : CLOTH);
    this.g.addProjectile(b);
    return b;
  }

  handWorld(out: THREE.Vector3): THREE.Vector3 {
    const s = this.f.visual.rig.sockets.get('grip.R');
    if (!s) return this.f.center(out);
    s.updateWorldMatrix(true, false);
    return s.getWorldPosition(out);
  }

  /** the open left hand (catches) */
  palmWorld(out: THREE.Vector3): THREE.Vector3 {
    const s = this.f.visual.rig.sockets.get('grip.L');
    if (!s) return this.f.center(out);
    s.updateWorldMatrix(true, false);
    return s.getWorldPosition(out);
  }

  swordVisible(on: boolean): void {
    const s = this.f.visual.props.get('sword');
    if (s) s.visible = on && this.f.disarmT <= 0;
  }

  // ---------------------------------------------------------------- the catch

  private tryCatch(from: Fighter | null, energy: boolean, quiet: boolean): boolean {
    const f = this.f;
    const a = f.action;
    if (!(a instanceof CatchAction) || !a.open) return false;
    if (quiet) return true;
    if (from && from !== f) {
      // only what comes at him from the front
      _v.subVectors(from.pos, f.pos).setY(0);
      if (_v.lengthSq() > 1e-4 && _v.normalize().dot(f.forward(_w)) < -0.15) return false;
      if (!energy && from.pos.distanceTo(f.pos) > 5) energy = true;
    }
    a.take(f, this.g, from, energy);
    this.cd.catch = energy ? 2.5 : 3;
    return true;
  }

  /** the counter after a caught blade: a heavy cut through the disarmed attacker */
  counter(): void {
    const f = this.f;
    f.act(new CutAction(this, 'slash1', -1, 1.25, 2.2), true);
  }

  // ---------------------------------------------------------------- forms

  /** at the Bankai burst */
  toBankai(): void {
    const f = this.f;
    this.form = 'bankai';
    f.data.bankai = true;
    f.setForm({ asset: ichigoAsset('bankai', 'white'), props: [{ key: 'sword', model: ichigoSword('bankai', 'white'), socket: 'grip.R' }] }, AURA_WHITE_BANKAI, BLADE_BANKAI);
    this.hands();
    this.applyLook();
    this.applyStats();
  }

  /** the Full Hollow's body swapped in under the black reiatsu */
  becomeHollow(): void {
    const { f, g } = this;
    this.form = 'hollow';
    this.hollowT = FULL_HOLLOW_TIME;
    this.vastoIndex = 0;
    this.dart = null;
    f.anim.stopAll(0.05);
    f.def = { ...f.def, stance: VASTO_STANCE, clips: [...VASTO_CLIPS, ...HOLLOW_ICHIGO_EXTRA_VASTO], blade: BLADE_BANKAI };
    f.setForm({ asset: ichigoHollowAsset(true), props: [{ key: 'sword', model: ichigoSword('bankai', 'white'), socket: 'grip.R' }] }, AURA_WHITE_HOLLOW, BLADE_BANKAI);
    this.hands();
    this.swordVisible(true);
    const c = f.center();
    for (let i = 0; i < 70; i++) {
      const a = Math.random() * Math.PI * 2, up = Math.random();
      const sp = 6 + Math.random() * 14;
      const white = Math.random() < 0.4;
      g.engine.glow.spawn({
        x: c.x, y: c.y, z: c.z, vx: Math.cos(a) * sp * (1 - up * 0.5), vy: up * sp * 0.8, vz: Math.sin(a) * sp * (1 - up * 0.5),
        size: white ? 0.22 : 0.35, sizeEnd: 0.05, life: 0.45 + Math.random() * 0.4,
        r: white ? 0.95 : 0.06, g: white ? 0.95 : 0.04, b: white ? 0.93 : 0.06, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 3,
      });
    }
    g.addRing(f.pos.clone().setY(f.pos.y + 0.05), 12, '#f3f3f0', 0.5);
    g.callout('完全虚化', 'FULL HOLLOWFICATION', '#f3f3f0');
    g.slowMo(0.5, 0.3);
    g.shake(f === g.player ? 0.6 : 0.25);
    g.engine.gr.chroma.offset.set(0.009, 0.009);
    this.applyLook();
    this.applyStats();
  }

  private breakHorn(hpFrac: number): void {
    const f = this.f;
    f.stopAction();
    f.act(new HornBreakAction(this, hpFrac), true);
  }

  /** back to the Bankai body */
  endHollow(hpFrac: number): void {
    const f = this.f;
    this.form = 'bankai';
    this.hollowT = 0;
    f.def = { ...f.def, stance: HOLLOW_ICHIGO_STANCE, clips: HOLLOW_ICHIGO_CLIPS, blade: BLADE_BANKAI };
    f.anim.stopAll(0.05);
    f.setForm({ asset: ichigoAsset('bankai', 'white'), props: [{ key: 'sword', model: ichigoSword('bankai', 'white'), socket: 'grip.R' }] }, AURA_WHITE_BANKAI, BLADE_BANKAI);
    this.hands();
    f.hp = Math.max(f.hp, f.maxHp * hpFrac);
    this.applyLook();
    this.applyStats();
  }

  private onLethal(): boolean {
    const f = this.f;
    if (this.form !== 'hollow') return false;
    if (!(f.action instanceof HornBreakAction)) this.breakHorn(0.2);
    f.hp = Math.max(1, f.hp);
    return true;
  }

  /** the roar's shock wave */
  roarBurst(k: number): void {
    const { f, g } = this;
    const c = f.center();
    g.sfx.play('roarBig', c, 1.4 * k);
    g.addRing(f.pos.clone().setY(f.pos.y + 0.1), 16 * k, '#f3f3f0', 0.5);
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

  // ---------------------------------------------------------------- look & stats

  private applyLook(): void {
    const { f, g } = this;
    const style = this.form === 'hollow' ? AURA_WHITE_HOLLOW : this.form === 'bankai' ? AURA_WHITE_BANKAI : AURA_WHITE_SHIKAI;
    const blade = this.form === 'shikai' ? BLADE_SHIKAI : BLADE_BANKAI;
    f.aura.setStyle(style);
    f.ghosts.color.set(this.form === 'shikai' ? '#E9E6EE' : style.body);
    f.def = { ...f.def, aura: style, blade };
    f.trail?.setColor(blade.color, blade.core);
    if (g.hud && f === g.player) {
      g.hud.form = this.formName();
      g.hud.vignette = this.form === 'hollow' ? 1 : 0;
    }
  }

  private applyStats(): void {
    const f = this.f;
    f.def = { ...f.def, speed: { ...FORM_SPEED[this.form] } };
    if (this.form === 'hollow') {
      f.damageTaken = 0.65;
      this.basePower = 1.9 * (this.flare ? 1.2 : 1);
      f.aura.target = this.flare ? 1 : 0.55;
      return;
    }
    f.damageTaken = 1;
    this.basePower = (this.bankai ? 1.3 : 1) * (this.flare ? (this.bankai ? 1.23 : 1.35) : 1);
    f.aura.target = this.flare ? 1 : this.bankai ? 0.45 : 0.28;
  }

  formName(): string {
    const king = this.instinct > 0.05 ? ` · King ×${(1 + 0.45 * this.instinct).toFixed(2)}` : '';
    if (this.form === 'hollow') return `Full Hollow · ${Math.max(0, Math.ceil(this.hollowT))} s${king}`;
    return (this.bankai ? 'Bankai — Tensa Zangetsu' : 'Shikai — Zangetsu') + king;
  }

  // ---------------------------------------------------------------- AI & HUD

  /** an enemy close by is swinging at him (the AI's cue to catch) */
  private enemyAttacking(): boolean {
    const o = this.g.nearestEnemy(this.f, 4);
    return !!o && o.action !== null && o.action.name !== 'dash' && (o.bladeActive || o.action.t < 0.25);
  }

  /** the dart has gone wide of the target (the AI's cue to tug) */
  private dartWide(): boolean {
    const d = this.dart;
    if (!d || d.tugged) return false;
    const p = d.bladeAt(_v);
    const o = this.target();
    if (!p || !o) return false;
    return p.distanceTo(o.center(_w)) > 4 && p.distanceTo(this.f.pos) > 6;
  }

  ai(): KitAI {
    return {
      reach: 2.6,
      chain: 5,
      releaseAt: [0.82, FULL_HOLLOW_AT - 0.03],
      moves: [
        { name: 'getsuga', use: () => this.skill1(), min: 6, max: 50, weight: 2.6, cd: 2.4, when: () => this.form !== 'hollow' },
        { name: 'heavy', use: () => this.heavy(), min: 0, max: 3.4, weight: 1, cd: 3 },
        { name: 'darts', use: () => this.skill2(), min: 7, max: 24, weight: 1.6, cd: 5, when: () => this.form === 'shikai' && !this.dart },
        { name: 'tug', use: () => this.skill2(), min: 0, max: 60, weight: 8, cd: 0.6, when: () => this.dartWide() },
        { name: 'whirlwind', use: () => this.skill3(), min: 0, max: 7, weight: 1.5, cd: 7, when: () => this.form === 'shikai' },
        { name: 'toss', use: () => this.skill2(), min: 5, max: 30, weight: 2.4, cd: 5, when: () => this.form === 'bankai' },
        { name: 'pincer', use: () => this.skill3(), min: 6, max: 28, weight: 1.8, cd: 10, when: () => this.form === 'bankai' },
        { name: 'catch', use: () => this.toggle(), min: 0, max: 4, weight: 5, cd: 2.5, when: () => this.enemyAttacking() },
        { name: 'cero', use: () => this.skill1(), min: 5, max: 70, weight: 2.4, cd: 4.5, when: () => this.form === 'hollow' },
        { name: 'sonido', use: () => this.skill2(), min: 3, max: 22, weight: 1.6, cd: 3, when: () => this.form === 'hollow' },
        { name: 'roar', use: () => this.skill3(), min: 0, max: 7, weight: 1.2, cd: 8, when: () => this.form === 'hollow' },
      ],
      opener: () => this.laugh(),
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    const king = { key: 'V', name: this.instinct > 0.05 ? `Flare · King ×${(1 + 0.45 * this.instinct).toFixed(1)}` : 'Flare', kanji: '霊圧', active: this.flare };
    const hand = { key: 'G', name: 'Bare hand', kanji: '掴', cost: 10, cd: cd.catch, cdMax: 3.5 };
    if (this.form === 'hollow') {
      return [
        { key: 'LMB', name: 'Claw & blade', kanji: '爪' },
        { key: 'RMB', name: 'Shatter', kanji: '砕', cd: cd.smash, cdMax: 2.4 },
        { key: 'Q', name: 'Horn Cero', kanji: '虚閃', cost: 22, cd: cd.cero, cdMax: 4, tint: '#ff3b52' },
        { key: 'E', name: 'Sonído', kanji: '響転', cost: 8, cd: cd.sonido, cdMax: 2.2 },
        { key: 'R', name: 'Roar', kanji: '咆', cost: 10, cd: cd.roar, cdMax: 7 },
        { key: 'Shift', name: 'Sonído', kanji: '響転', cost: 4 },
        king,
        { key: 'F', name: `Full Hollow ${Math.max(0, Math.ceil(this.hollowT))}s`, kanji: '虚', active: true, timer: this.hollowT / FULL_HOLLOW_TIME, tint: '#f3f3f0' },
        hand,
      ];
    }
    const bk = this.bankai;
    return [
      { key: 'LMB', name: bk ? 'Tensa Zangetsu' : 'Flail', kanji: bk ? '斬' : '鎖' },
      { key: 'RMB', name: 'Cleave', kanji: '断' },
      { key: 'Q', name: 'Getsuga', kanji: '月牙', cost: this.getsugaCost(), cd: this.getsugaCd, cdMax: bk ? 0.6 : 1, tint: bk ? '#ff2340' : undefined },
      bk
        ? { key: 'E', name: 'Chain toss', kanji: '鎖投', cost: 22, cd: cd.toss, cdMax: 4.5 }
        : { key: 'E', name: this.dart ? (this.dart.tugged ? 'Reel in' : 'Tug') : 'Deadly Darts', kanji: '投', cost: 14, cd: cd.darts, cdMax: 4, active: this.dart !== null },
      bk
        ? { key: 'R', name: 'Pincer', kanji: '挟', cost: 34, cd: cd.pincer, cdMax: 10, tint: '#ff2340' }
        : { key: 'R', name: 'Whirlwind', kanji: '旋', cost: 24, cd: cd.whirlwind, cdMax: 8 },
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
      king,
      bk
        ? { key: 'F', name: this.hollowUsed ? 'Full Hollow (spent)' : 'Full Hollow', kanji: '虚', active: false, tint: '#f3f3f0' }
        : { key: 'F', name: 'Bankai', kanji: '卍解', cost: 40, tint: '#ff2340' },
      hand,
    ];
  }
}
