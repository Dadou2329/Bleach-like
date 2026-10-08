// Post-Dangai Ichigo's kit (docs/kits/ichigo.md §4 Fake Karakura; dossier A1 §1 looks #8-#9, abilities 79-83 and
// 104-106). Bankai v2 — three months in the Dangai, one hour outside: the Tensa Zangetsu string, every blow throwing an
// area shockwave; the mountain-leveller (RMB), one level swing whose cut runs on across the land; the Black Getsuga,
// larger (Q); the seize (E) — the foe's face in his hand, a single Shunpo carrying them 40 m away, the slam into the
// ground; the bare-hand catch (R) — a blade caught in the fingers (the deflected force wrecks the ground), shots and
// Kidō crushed in the fist; his reiatsu on a higher plane (G): beyond 8 m no enemy can sense or lock onto him. F:
// Saigo no Getsuga Tenshō — he becomes the Getsuga: twenty seconds of black hair, red eyes and bandages, super armour,
// flicker-steps no eye can follow, smoky strikes of the wound arm and the black-blade thrust; then Mugetsu (F, or by
// itself at zero): a curtain of black across the horizon, the sky put out. After it he is spent: a human in his
// school uniform, his karate all that is left.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { Game } from '../game';
import type { AbilityInfo } from '../../ui/hud';
import type { Kit, KitAI } from './kit';
import { DANGAI_BASE_Z, DANGAI_TIP_Z, MUGETSU_BASE_Z, MUGETSU_TIP_Z, dangaiAsset, dangaiSword, mugetsuBlade } from '../../chars/ichigoDangai';
import { humanAsset } from '../../chars/ichigoHuman';
import { DANGAI_CHAIN, DANGAI_CLIPS, DANGAI_STANCE, FINAL_CHAIN, FINAL_CLIPS, FINAL_STANCE, HUMAN_CHAIN, HUMAN_CLIPS, HUMAN_STANCE } from '../../chars/ichigoDangaiClips';
import type { AuraStyle } from '../../vfx/aura';
import { GetsugaProjectile } from '../projectiles/getsuga';
import { GETSUGA_BLACK } from '../../vfx/energy';
import { CapsuleShape, SphereShape } from '../../destruction/shapes';
import { TEX_GLOW, TEX_STREAK } from '../../vfx/sprites';
import { SkyTint } from '../../vfx/fire';
import { PlanarSlash } from '../../vfx/tybw';
import { DANGAI_CRIMSON, DANGAI_ROSE, MugetsuCurtain, SKY_FINAL, SKY_MUGETSU, armSmoke, blackSmoke, dangaiWave, embers } from '../../vfx/dangai';

type Form = 'bankai' | 'final' | 'spent';
type BladeDef = NonNullable<FighterDef['blade']>;

/** Bankai v2: black reiatsu edged in crimson */
export const AURA_DANGAI: AuraStyle = { core: '#FF9AAE', body: '#C2304F', rim: '#5A0A1E', dark: '#050203' };
/** the Final Getsuga form: black, the faintest red at its edge */
export const AURA_FINAL: AuraStyle = { core: '#8A1A2A', body: '#3A0A14', rim: '#7A0E18', dark: '#020203' };
/** spent: nothing left (a faint grey the aura never shows) */
const AURA_SPENT: AuraStyle = { core: '#D8D8D8', body: '#9A9A9A', rim: '#5A5A5A' };

const BLADE_V2: BladeDef = { prop: 'sword', base: [0, 0, DANGAI_BASE_Z], tip: [0, 0, DANGAI_TIP_Z], color: '#C2304F', core: '#FF9AAE' };
const BLADE_MUGETSU: BladeDef = { prop: 'blade', base: [0, 0, MUGETSU_BASE_Z], tip: [0, 0, MUGETSU_TIP_Z], color: '#7A0E18', core: '#C2304F' };

const SPEED: Record<Form, FighterDef['speed']> = {
  bankai: { run: 13.5, sprint: 32, jump: 13.5, dash: 30, dashTime: 0.08 },
  final: { run: 11, sprint: 24, jump: 13, dash: 13, dashTime: 0.05 },
  spent: { run: 6.8, sprint: 9.2, jump: 7.5, dash: 3.6, dashTime: 0.24 },
};
const POWER: Record<Form, number> = { bankai: 1.6, final: 2.4, spent: 0.4 };
const TAKEN: Record<Form, number> = { bankai: 0.78, final: 0.5, spent: 1.35 };

/** Saigo no Getsuga Tenshō lasts this long; then Mugetsu fires by itself */
export const FINAL_TIME = 20;
/** the higher plane drains this much reiatsu a second */
const VEIL_DRAIN = 3;

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

export const DANGAI_DEF: FighterDef = {
  id: 'ichigo-dangai',
  name: 'Kurosaki Ichigo',
  title: 'Substitute Shinigami · Fake Karakura',
  build: () => ({ asset: dangaiAsset('bankai'), props: [{ key: 'sword', model: dangaiSword(), socket: 'grip.R' }] }),
  stance: DANGAI_STANCE,
  clips: DANGAI_CLIPS,
  aura: AURA_DANGAI,
  blade: BLADE_V2,
  hp: 1250,
  rei: 200,
  speed: { ...SPEED.bankai },
  radius: 0.4,
  height: 1.81,
};

const spec = (damage: number, knock: number, cut: number, extra: Partial<BladeSpec> = {}): BladeSpec => ({ damage, knock, launch: 0, hitstop: 0.05, shake: 0.12, cut, ...extra });

interface Cut {
  window: [number, number];
  spec: BladeSpec;
  lunge?: [number, number];
  impact?: { radius: number; power: number };
  /** the shockwave every blow throws (radius m) */
  wave: number;
}

const CUTS: Record<string, Cut> = {
  slash1: { window: [0.1, 0.24], spec: spec(30, 8, 700), lunge: [9, 0], wave: 3.5 },
  slash2: { window: [0.09, 0.22], spec: spec(30, 8, 700, { launch: 4 }), lunge: [8, 0], wave: 3.5 },
  slash3: { window: [0.21, 0.31], spec: spec(44, 8, 900, { launch: 7, hitstop: 0.09, shake: 0.4 }), lunge: [8, 0], impact: { radius: 2.2, power: 220 }, wave: 4.5 },
  slash4: { window: [0.08, 0.47], spec: spec(22, 10, 650, { launch: 2 }), lunge: [5, 0], wave: 4 },
  slash5: { window: [0.34, 0.47], spec: spec(64, 22, 1100, { launch: 6, heavy: true, hitstop: 0.14, shake: 0.7 }), lunge: [8, 9], impact: { radius: 3, power: 300 }, wave: 6 },
};

interface Strike {
  damage: number;
  knock: number;
  launch?: number;
  heavy?: boolean;
  /** sphere ahead of him: distance, height, radius (m) */
  reach: number;
  height: number;
  radius: number;
  lunge: number;
  /** the striking limb's socket */
  limb: string;
  /** smash power where the blow lands (walls in the way) */
  smash?: number;
}

/** the Final Getsuga form: the wound arm */
const FINAL_STRIKES: Record<string, Strike> = {
  fg_s1: { damage: 46, knock: 10, reach: 1.3, height: 1.25, radius: 1.35, lunge: 7, limb: 'knuckle.R', smash: 700 },
  fg_s2: { damage: 50, knock: 6, launch: 3, reach: 1.25, height: 1.0, radius: 1.35, lunge: 6, limb: 'knuckle.R', smash: 800 },
  fg_s3: { damage: 70, knock: 22, launch: 5, heavy: true, reach: 1.45, height: 1.2, radius: 1.45, lunge: 9, limb: 'palm.R', smash: 1000 },
};

/** the spent human: karate */
const HUMAN_STRIKES: Record<string, Strike> = {
  hm_jab: { damage: 9, knock: 4, reach: 0.95, height: 1.4, radius: 0.7, lunge: 4, limb: 'knuckle.L' },
  hm_cross: { damage: 12, knock: 6, reach: 1.0, height: 1.35, radius: 0.72, lunge: 5, limb: 'knuckle.R' },
  hm_front: { damage: 13, knock: 8, reach: 1.05, height: 1.05, radius: 0.75, lunge: 4, limb: 'toe.R' },
  hm_round: { damage: 16, knock: 11, launch: 2, reach: 1.0, height: 1.45, radius: 0.85, lunge: 4, limb: 'toe.R' },
  hm_crack: { damage: 22, knock: 3, heavy: true, reach: 1.0, height: 0.8, radius: 0.95, lunge: 3, limb: 'heel.R' },
};

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

/** Where a skill aims: the lock target, the camera ray for the player, else straight ahead. */
function aimAt(f: Fighter, g: Game, out = new THREE.Vector3()): THREE.Vector3 {
  if (f.faceTarget) return out.copy(f.faceTarget);
  if (f === g.player) return g.aimPoint(f, out);
  return f.center(out).addScaledVector(f.forward(), 30);
}

function groundBelow(g: Game, p: THREE.Vector3, depth = 40): number | null {
  const w = g.engine.world, vs = w.vs;
  const x = Math.floor(p.x / vs), z = Math.floor(p.z / vs);
  for (let y = Math.floor((p.y + 0.3) / vs); y > Math.floor((p.y - depth) / vs); y--) if (w.isSolid(x, y, z)) return (y + 1) * vs;
  return null;
}

/** Put a fighter at `p` and keep it there this step (carried, pinned). */
function pin(o: Fighter, p: THREE.Vector3): void {
  o.body.pos.copy(p);
  o.body.prev.copy(p);
  o.body.vel.set(0, 0, 0);
  o.push.set(0, 0, 0);
}

// ------------------------------------------------------------------------------------------------ Bankai v2

/** One cut of the Bankai v2 string — and the shockwave it throws. */
class CutAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private impacted = false;
  private swished = false;
  private waved = false;
  private stopAt = 0;
  private dashed = false;
  queued = false;

  constructor(readonly kit: DangaiKit, readonly clip: string, readonly index: number, readonly info: Cut) {
    super();
    this.name = clip;
    this.mobility = 0.12;
    this.airGravity = 0.12;
  }

  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    // a touch quicker than the Bankai he went into the Dangai with
    this.dur = (c.dur - c.fadeOut * 0.5) / 1.1;
    this.comboAt = (c.events.combo ?? this.dur * 0.6) / 1.1;
    f.bladeHits.clear();
    f.bladeSpec = this.info.spec;
    const tgt = f.faceTarget;
    if (this.info.lunge && tgt) {
      const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
      this.stopAt = 1.3;
      if (d > this.stopAt + 0.25) {
        const per = (1 - Math.exp(-f.pushDrag * Math.max(0.06, this.info.window[0] / 1.1))) / f.pushDrag;
        f.push.addScaledVector(f.forward(), Math.min(28, (d - this.stopAt) / per));
        this.dashed = true;
      }
    }
    f.anim.play(this.clip, {
      speed: 1.1,
      onEvent: (n) => {
        if (n === 'step' && this.info.lunge) {
          if (!this.dashed) f.push.addScaledVector(f.forward(), this.info.lunge[0]);
          if (this.info.lunge[1] > 0 && f.grounded) f.push.y = this.info.lunge[1];
        }
        if (n === 'fx' && this.info.impact && !this.impacted) {
          this.impacted = true;
          const tip = f.blade.tip.clone();
          const gy = groundBelow(g, tip, 2.5);
          if (gy !== null && tip.y - gy < 1.4) {
            tip.y = gy;
            g.groundImpact(tip, this.info.impact.radius, this.info.impact.power, DANGAI_CRIMSON, f);
            g.shake(this.info.spec.shake);
          }
        }
      },
    });
  }

  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t * 1.1;
    const tgt = f.faceTarget;
    if (this.stopAt > 0 && tgt && Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z) <= this.stopAt) {
      f.push.x = 0;
      f.push.z = 0;
      this.stopAt = 0;
    }
    const [w0, w1] = this.info.window;
    if (!this.swished && t >= w0 - 0.03) {
      this.swished = true;
      g.sfx.play(this.info.spec.damage >= 40 ? 'swingHeavy' : 'swing', f.center());
    }
    f.bladeActive = t >= w0 && t <= w1;
    if (f.trail) f.trail.emitting = t >= w0 - 0.02 && t <= w1 + 0.06;
    // the blow's shockwave, thrown out from the blade
    if (!this.waved && t >= w0 + 0.03) {
      this.waved = true;
      this.kit.wave(this.info.wave, this.info.spec.damage * 0.45);
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
    if (next.name === 'dash' || next instanceof SkillAction) return this.t * 1.1 >= this.info.window[0] + 0.06;
    return false;
  }
}

/** Base for the one-shot skills: plays a clip, ends with it. */
abstract class SkillAction extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: DangaiKit) {
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

/** RMB — the mountain-leveller: one level sweep; its cut runs on far across the land in a plane. */
class LevelAction extends SkillAction {
  readonly name = 'level';
  constructor(kit: DangaiKit) {
    super(kit);
    this.mobility = 0.05;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    f.bladeSpec = spec(60, 16, 1400, { heavy: true, hitstop: 0.12, shake: 0.5 });
    this.playClip(f, 'dg_level', (n) => {
      if (n === 'step') f.aura.flare(1.5, 0.4);
      if (n !== 'fx') return;
      const fw = f.forward(_v).setY(0).normalize().clone();
      const right = new THREE.Vector3(-fw.z, 0, fw.x);
      const origin = f.pos.clone().addScaledVector(fw, 1.2);
      origin.y += 1.15;
      g.addProjectile(new PlanarSlash(g, f, origin, fw, right, { length: 100, width: 48, grow: 0.45, damage: 150, cut: 2600, color: DANGAI_CRIMSON, core: DANGAI_ROSE }));
      g.sfx.play('getsugaBlack', origin, 1.2);
      g.shake(f === g.player ? 0.8 : 0.35);
      g.hitstop(0.08);
      g.engine.gr.chroma.offset.set(0.006, 0.006);
      if (f === g.player) g.cam.punchFov(8);
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    f.bladeActive = this.t > 0.37 && this.t < 0.56;
    if (f.trail) f.trail.emitting = this.t > 0.35 && this.t < 0.62;
  }
}

/** Q — the Black Getsuga, grown: black edged in crimson, bigger and faster than it ever was. */
class GetsugaAction extends SkillAction {
  readonly name = 'getsuga';
  private fired = false;
  constructor(kit: DangaiKit) {
    super(kit);
    this.mobility = 0.05;
    this.airGravity = 0.05;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    f.bladeSpec = spec(26, 8, 400, { launch: 3 });
    this.playClip(f, 'getsuga', (n) => {
      if (n === 'charge') {
        f.aura.flare(1.6, 0.55);
        this.kit.glowBlade(1);
        g.callout('月牙天衝', 'GETSUGA TENSHŌ', '#ff6e86');
        g.sfx.play('flare', f.center(), 0.6);
      }
      if (n === 'fx' && !this.fired) this.fire(f, g);
    });
  }
  private fire(f: Fighter, g: Game): void {
    this.fired = true;
    const dir = aimAt(f, g).sub(f.center());
    const flat = Math.hypot(dir.x, dir.z) || 1;
    dir.y = Math.max(f.faceTarget ? -0.5 : -0.06, Math.min(0.6, dir.y / flat)) * flat;
    dir.normalize();
    const right = new THREE.Vector3(dir.z, 0, -dir.x).normalize().multiplyScalar(-1);
    const side = new THREE.Vector3(0, 1, 0).multiplyScalar(Math.cos(0.7)).addScaledVector(right, Math.sin(0.7));
    const origin = f.center().addScaledVector(dir, 1.3);
    origin.y += 0.35;
    g.addProjectile(new GetsugaProjectile(g, f, origin, dir, side, { radius: 4.8, halfAngle: 1.15, speed: 60, range: 140, damage: 170, cut: 1600, colors: GETSUGA_BLACK, dark: true }));
    g.shake(f === g.player ? 0.55 : 0.25);
    g.hitstop(0.06);
    g.sfx.play('getsugaBlack', origin);
    f.aura.flare(1.9, 0.4);
    g.engine.gr.chroma.offset.set(0.004, 0.004);
    if (f === g.player) g.cam.punchFov(6);
    f.push.addScaledVector(dir, -3);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (f.trail) f.trail.emitting = this.t > 0.42 && this.t < 0.62;
    f.bladeActive = this.t > 0.45 && this.t < 0.56;
    if (this.t > 0.6) this.kit.glowBlade(Math.max(0, 1 - (this.t - 0.6) * 3));
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.glowBlade(0);
  }
}

/**
 * E — the seize: a step no one sees, the foe's face in his left hand; one Shunpo carries them both 40 m away (through
 * whatever stands in the way), and the slam drives them into the ground there.
 */
class SeizeAction extends SkillAction {
  readonly name = 'seize';
  private held: Fighter | null = null;
  private phase: 'grab' | 'carry' | 'slam' = 'grab';
  private carryT = 0;
  private from = new THREE.Vector3();
  private to = new THREE.Vector3();
  private dir = new THREE.Vector3();
  private smashT = 0;
  private slammed = false;
  private slamAt = 0;
  constructor(kit: DangaiKit, readonly target: Fighter) {
    super(kit);
    this.invulnerable = true;
    this.mobility = 0;
    this.airGravity = 0;
  }
  override start(f: Fighter, g: Game): void {
    const t = this.target;
    // the step: he is simply in front of them
    const d = _v.subVectors(t.pos, f.pos).setY(0);
    const dist = d.length();
    if (dist > 1.6) {
      d.divideScalar(dist);
      blackSmoke(g, f.center(), 6, 0.4, 0.8);
      f.ghosts.spawn(0.3, 0.8);
      const p = t.pos.clone().addScaledVector(d, -1.15);
      p.y = Math.max(p.y, t.pos.y);
      pin(f, p);
      f.yaw = Math.atan2(d.x, d.z);
      g.sfx.play('shunpo', f.center(), 0.8);
    }
    this.playClip(f, 'dg_seize', (n) => {
      if (n !== 'grab') return;
      if (t.dead || t.pos.distanceTo(f.pos) > 2.4 + t.def.radius) return;
      this.held = t;
      t.stopAction();
      t.hitstun = Math.max(t.hitstun, 0.6);
      g.damage(t, 10, f, f.forward(), { knock: 0, hitstop: 0.08, unblockable: true });
      g.sfx.play('hit', t.center(), 1);
    }, 1, true);
  }
  private beginCarry(f: Fighter, g: Game): void {
    const t = this.held!;
    this.phase = 'carry';
    this.carryT = 0;
    // a boss is too big to carry off: the slam lands where it stands
    if (t.def.boss) {
      this.beginSlam(f);
      return;
    }
    this.dir.copy(f.forward(_v).setY(0).normalize());
    const W = g.engine.world.sx * g.engine.world.vs, D = g.engine.world.sz * g.engine.world.vs;
    // 40 m on, kept inside the world (turned back toward the middle if the edge is near)
    let len = 40;
    const end = f.pos.clone().addScaledVector(this.dir, len);
    if (end.x < 6 || end.x > W - 6 || end.z < 6 || end.z > D - 6) {
      this.dir.set(W / 2 - f.pos.x, 0, D / 2 - f.pos.z).normalize();
      len = Math.min(40, Math.hypot(W / 2 - f.pos.x, D / 2 - f.pos.z) + 10);
    }
    this.from.copy(f.pos);
    this.to.copy(f.pos).addScaledVector(this.dir, len);
    const gy = groundBelow(g, this.to.clone().setY(this.to.y + 30), 80);
    this.to.y = Math.max(f.pos.y, gy ?? f.pos.y) + 3;
    f.yaw = Math.atan2(this.dir.x, this.dir.z);
    g.sfx.play('shunpo', f.center(), 1.2);
    blackSmoke(g, f.center(), 8, 0.5, 1);
    if (f === g.player) g.cam.punchFov(10);
  }
  private beginSlam(f: Fighter): void {
    this.phase = 'slam';
    this.slamAt = this.t;
    f.anim.play('dg_slam', { onEvent: (n) => n === 'slam' && this.slam(f, this.kit.g) });
    this.dur = this.t + 0.78 - 0.12;
  }
  private slam(f: Fighter, g: Game): void {
    if (this.slammed) return;
    this.slammed = true;
    const t = this.held;
    if (!t || t.dead) return;
    const hand = sock(f, 'palm.L', _v);
    const p = new THREE.Vector3(hand.x, hand.y, hand.z);
    const gy = groundBelow(g, p, 12);
    p.y = gy ?? Math.min(p.y, f.pos.y);
    pin(t, p);
    g.damage(t, 140, f, f.forward(_w).clone(), { knock: 2, heavy: true, hitstop: 0.16, shake: 0.9, unblockable: true });
    t.hitstun = Math.max(t.hitstun, 1.0);
    g.groundImpact(p.clone(), 3.6, 320, DANGAI_CRIMSON, f);
    g.addRing(p.clone().setY(p.y + 0.1), 9, DANGAI_CRIMSON, 0.45);
    blackSmoke(g, p.clone().setY(p.y + 0.4), 12, 1.2, 1.4);
    g.shake(f === g.player || t === g.player ? 1 : 0.4);
    this.held = null;
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.held;
    if (this.phase === 'grab') {
      if (this.t >= 0.4) {
        if (!t) {
          this.done = true;
          return;
        }
        this.beginCarry(f, g);
      }
    } else if (this.phase === 'carry') {
      this.carryT += dt;
      const k = Math.min(1, this.carryT / 0.55);
      const e = 1 - Math.pow(1 - k, 2);
      const p = _v.lerpVectors(this.from, this.to, e);
      p.y += Math.sin(Math.PI * k) * 2;
      pin(f, p);
      f.body.vel.copy(this.dir).multiplyScalar(70 * (1 - k));
      f.ghosts.spawn(0.25, 0.7);
      // through whatever stands in the way
      this.smashT -= dt;
      if (this.smashT <= 0) {
        this.smashT = 0.04;
        const ahead = f.pos.clone().addScaledVector(this.dir, 1.6);
        ahead.y += 1.2;
        g.engine.destruction.carve(new SphereShape(ahead, 1.9), { mode: 'smash', power: 600, impulse: 14, dust: 0.6, dir: this.dir.clone() });
      }
      if (k >= 1) this.beginSlam(f);
    }
    // the held foe hangs from his hand
    if (t && !this.slammed && !t.dead) {
      const hand = sock(f, 'palm.L', _w);
      pin(t, new THREE.Vector3(hand.x, hand.y - t.def.height * 0.82, hand.z).addScaledVector(f.forward(_v), 0.2));
      t.hitstun = Math.max(t.hitstun, 0.5);
    }
  }
  override end(f: Fighter): void {
    super.end(f);
    if (this.held && !this.slammed) this.slam(f, this.kit.g);
    // the held reach is let go if no slam took over from it
    if (f.anim.isPlaying('dg_seize')) f.anim.stopAll(0.15);
  }
  override canCancel(): boolean {
    return false;
  }
}

/** R — the bare-hand catch: the open left hand up; a blade that meets it is caught, a shot or a Kidō crushed. */
class CatchAction extends SkillAction {
  readonly name = 'catch';
  constructor(kit: DangaiKit) {
    super(kit);
    this.mobility = 0;
  }
  override start(f: Fighter, g: Game): void {
    this.kit.openHand(true);
    this.playClip(f, 'dg_catch', (n) => {
      if (n === 'up') this.kit.catching = true;
    });
    g.sfx.play('flare', f.center(), 0.4);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.kit.catching) {
      if (this.t > 0.8) this.kit.catching = false;
      // anything thrown at him is crushed in the hand as it arrives
      const p = sock(f, 'palm.L', _v);
      const n = g.rejectNear(p.clone().addScaledVector(f.forward(_w), 0.6), 2.4, f, true);
      if (n > 0) this.kit.crushFx(p, false);
    }
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.catching = false;
    this.kit.openHand(false);
  }
}

/** R (caught): the hand closes on what it caught; the force goes down through him into the ground. */
class CaughtAction extends SkillAction {
  readonly name = 'caught';
  constructor(kit: DangaiKit, readonly from: Fighter | null) {
    super(kit);
    this.mobility = 0;
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    this.kit.openHand(false);
    this.playClip(f, 'dg_caught', (n) => {
      if (n !== 'crush') return;
      const o = this.from;
      if (o && !o.dead) {
        const dir = _v.subVectors(o.pos, f.pos).setY(0).normalize().clone();
        g.damage(o, 30, f, dir, { knock: 16, launch: 3, heavy: true, hitstop: 0.12, unblockable: true });
      }
      // the deflected force wrecks the ground round him
      const p = f.pos.clone().addScaledVector(f.forward(_v), -1.2);
      g.groundImpact(p, 3.2, 300, DANGAI_CRIMSON, f);
      g.addRing(f.pos.clone().setY(f.pos.y + 0.08), 7, DANGAI_CRIMSON, 0.4);
    });
  }
}

/** F — "Saigo no Getsuga Tenshō": the black reiatsu swallows him and tears open on the Final Getsuga form. */
class FinalAction extends SkillAction {
  readonly name = 'final';
  private burst = false;
  constructor(kit: DangaiKit) {
    super(kit);
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'dg_final', (n) => {
      if (n === 'call') g.callout('最後の月牙天衝', 'SAIGO NO GETSUGA TENSHŌ', '#ff6e86');
      if (n === 'fx') {
        this.kit.darken(SKY_FINAL);
        f.aura.pillarBurst(2.6);
        g.sfx.play('roarBig', f.center(), 0.7);
        g.shake(f === g.player ? 0.6 : 0.25);
      }
      if (n === 'burst' && !this.burst) {
        this.burst = true;
        this.kit.becomeFinal();
      }
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    // the black reiatsu coils up round him before it bursts
    if (!this.burst && this.t > 0.55) {
      const c = f.center();
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2, r = 0.6 + Math.random() * 1.6;
        g.engine.dust.spawn({ x: c.x + Math.cos(a) * r, y: f.pos.y + Math.random() * 2.4, z: c.z + Math.sin(a) * r, vx: -Math.sin(a) * 6, vy: 3 + Math.random() * 4, vz: Math.cos(a) * 6, size: 0.6, sizeEnd: 1.6, life: 0.7, r: 0.03, g: 0.02, b: 0.03, alpha: 0.85, alphaEnd: 0, tex: TEX_GLOW, drag: 1.5 });
      }
    }
    if (this.burst) this.done = true;
  }
}

// ------------------------------------------------------------------------------------------------ the Final Getsuga form

/** One blow of the arm (Final Getsuga form) or of the karate (spent): everyone in the sphere ahead is struck. */
class StrikeAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private hitAt = 0;
  private struck = false;
  private hits = new Set<number>();
  queued = false;

  constructor(readonly kit: DangaiKit, readonly clip: string, readonly index: number, readonly s: Strike, readonly chained = true) {
    super();
    this.name = clip;
    this.mobility = 0.12;
    this.airGravity = 0.1;
  }

  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.65;
    this.hitAt = c.events.hit ?? this.dur * 0.4;
    // the Final Getsuga form does not travel to a foe a few steps off: it is simply there
    const tgt = f.faceTarget;
    if (this.kit.form === 'final' && tgt) {
      const d = _v.set(tgt.x - f.pos.x, 0, tgt.z - f.pos.z);
      const dist = d.length();
      if (dist > 2.2 && dist < 11) {
        d.divideScalar(dist);
        this.kit.flickerTo(f.pos.clone().addScaledVector(d, dist - 1.5));
      }
    }
    f.anim.play(this.clip, {
      fadeIn: 0.03,
      onEvent: (n) => {
        if (n !== 'step') return;
        const t = f.faceTarget;
        const extra = t ? Math.min(4, Math.max(0, Math.hypot(t.x - f.pos.x, t.z - f.pos.z) - 1.3)) : 0;
        f.push.addScaledVector(f.forward(), this.s.lunge * (this.kit.form === 'spent' ? 0.8 : 1) + extra * 2.2);
        g.sfx.play(this.kit.form === 'final' ? 'swingHeavy' : 'swing', f.center(), 0.7);
      },
    });
  }

  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const limb = sock(f, this.s.limb, _w);
    if (this.kit.form === 'final' && this.t > this.hitAt - 0.12 && this.t < this.hitAt + 0.08) armSmoke(g, limb);
    if (!this.struck && this.t >= this.hitAt) {
      this.struck = true;
      this.kit.strike(this.s, this.hits);
    }
    if (this.chained && this.queued && this.t >= this.comboAt) {
      this.done = true;
      this.kit.chain(this.index + 1);
      return;
    }
    if (this.t >= this.dur) this.done = true;
  }

  override canCancel(next: FighterAction): boolean {
    if (next.name === 'dash' || next instanceof SkillAction) return this.t >= this.hitAt + 0.02;
    return false;
  }
}

/** RMB (Final Getsuga form) — the black blade forms in the hand and is driven straight through. */
class ThrustAction extends SkillAction {
  readonly name = 'thrust';
  private struck = false;
  constructor(kit: DangaiKit) {
    super(kit);
    this.mobility = 0.05;
  }
  override start(f: Fighter, g: Game): void {
    const tgt = f.faceTarget;
    if (tgt) {
      const d = _v.set(tgt.x - f.pos.x, 0, tgt.z - f.pos.z);
      const dist = d.length();
      if (dist > 6 && dist < 14) this.kit.flickerTo(f.pos.clone().addScaledVector(d.divideScalar(dist), dist - 5));
    }
    this.playClip(f, 'fg_thrust', (n) => {
      if (n === 'form') this.kit.showBlade(true);
      if (n === 'step') f.push.addScaledVector(f.forward(), 8);
      if (n === 'hit' && !this.struck) this.stab(f, g);
    });
  }
  private stab(f: Fighter, g: Game): void {
    this.struck = true;
    const fw = aimAt(f, g, _v).sub(f.center()).setY(0).normalize().clone();
    const from = f.center().addScaledVector(fw, 0.6);
    const to = from.clone().addScaledVector(fw, 7.5);
    for (const o of g.enemiesOf(f)) {
      const c = o.center(_w);
      const ab = to.clone().sub(from);
      const k = Math.max(0, Math.min(1, c.clone().sub(from).dot(ab) / ab.lengthSq()));
      if (c.distanceTo(from.clone().addScaledVector(ab, k)) > 0.9 + o.def.radius) continue;
      g.damage(o, 150, f, fw, { knock: 22, launch: 4, heavy: true, hitstop: 0.16, shake: 0.7 });
      g.sparks(c, fw, DANGAI_CRIMSON, 18);
    }
    g.engine.destruction.carve(new CapsuleShape(from, to, 0.75), { mode: 'bore', power: 1600, dust: 0.7, dir: fw.clone(), sparks: [0.6, 0.05, 0.1] });
    for (let i = 0; i < 18; i++) {
      const p = from.clone().lerp(to, i / 17);
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: fw.x * 20, vy: 0, vz: fw.z * 20, size: 0.4, sizeEnd: 0.05, life: 0.22, r: i % 3 ? 0.04 : 0.76, g: i % 3 ? 0.02 : 0.06, b: i % 3 ? 0.03 : 0.12, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 3 });
    }
    blackSmoke(g, to, 8, 0.6, 1.2);
    g.sfx.play('getsugaBlack', from, 0.8);
    g.shake(f === g.player ? 0.5 : 0.2);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (f.trail) f.trail.emitting = this.t > 0.33 && this.t < 0.5;
    if (this.t > 0.1 && this.t < 0.6) armSmoke(g, sock(f, 'grip.R', _v));
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.showBlade(false);
  }
}

/** F (in the form) — Mugetsu. */
class MugetsuAction extends SkillAction {
  readonly name = 'mugetsu';
  private fired = false;
  constructor(kit: DangaiKit) {
    super(kit);
    this.invulnerable = true;
    this.mobility = 0;
    this.airGravity = 0;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'fg_mugetsu', (n) => {
      if (n === 'form') {
        this.kit.showBlade(true);
        g.callout('無月', 'MUGETSU', '#f3f3f0');
      }
      if (n === 'dark') {
        this.kit.darken(SKY_MUGETSU);
        g.sfx.play('roarBig', f.center(), 0.5);
      }
      if (n === 'fire' && !this.fired) this.fire(f, g);
    });
  }
  private fire(f: Fighter, g: Game): void {
    this.fired = true;
    const fw = aimAt(f, g, _v).sub(f.pos).setY(0).normalize().clone();
    const origin = f.pos.clone().addScaledVector(fw, 2);
    g.addProjectile(new MugetsuCurtain(g, f, origin, fw, { width: 150, height: 90, speed: 75, range: 170, damage: 500, seal: 12 }));
    g.sfx.play('getsugaBlack', f.center(), 1.6);
    g.sfx.play('explode', origin, 1.2);
    g.shake(1);
    g.hitstop(0.2);
    g.slowMo(0.8, 0.3);
    g.engine.gr.chroma.offset.set(0.012, 0.012);
    if (f === g.player) g.cam.punchFov(14);
    blackSmoke(g, f.center(), 24, 1.6, 2);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (f.trail) f.trail.emitting = this.t > 1.38 && this.t < 1.62;
    if (this.t > 0.25 && this.t < 1.5) armSmoke(g, sock(f, 'grip.R', _v).add(new THREE.Vector3(0, 0.4, 0)));
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.showBlade(false);
    if (this.fired && this.kit.form === 'final') this.kit.becomeSpent();
  }
  override canCancel(): boolean {
    return false;
  }
}

// ------------------------------------------------------------------------------------------------ the kit

export class DangaiKit implements Kit {
  form: Form = 'bankai';
  private combo = 0;
  private lastEnd = 0;
  readonly cd = { getsuga: 0, level: 0, seize: 0, catch: 0, thrust: 0, veil: 0 };
  flare = false;
  /** G: reiatsu on a higher plane */
  veil = false;
  /** R: the open hand is up */
  catching = false;
  /** the Final Getsuga form's time left */
  finalT = 0;
  private sky: SkyTint | null = null;
  private wasDashing = false;
  private dashFrom = new THREE.Vector3();
  private smokeT = 0;

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.parry = (amount, from, o) => this.parry(amount, from, o);
    this.applyStats();
  }

  // -------------------------------------------------------------------------------------------- per step

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0 || this.form === 'spent') this.toggleFlare();
    }
    if (this.veil) {
      f.rei -= dt * VEIL_DRAIN;
      if (f.rei <= 0 || this.form !== 'bankai') this.setVeil(false);
    }
    if (this.form === 'final') this.tendFinal(dt);
    if (this.form === 'spent') {
      // nothing left: a human's breath for a dash, no more
      f.rei = Math.min(f.rei, f.maxRei);
    }
  }

  /** The Final Getsuga form: the clock, the smoke, the flicker-steps. */
  private tendFinal(dt: number): void {
    const { f, g } = this;
    if (!(f.action instanceof MugetsuAction)) {
      this.finalT -= dt;
      if (this.finalT <= 0 && !f.dead) {
        // time: Mugetsu fires by itself
        this.finalT = 0;
        f.stopAction();
        f.act(new MugetsuAction(this), true);
      }
    }
    this.smokeT -= dt;
    if (this.smokeT <= 0) {
      this.smokeT = 0.08;
      const c = f.center();
      blackSmoke(g, new THREE.Vector3(c.x, f.pos.y + 0.3 + Math.random() * 1.6, c.z), 1, 0.35, 0.8);
      armSmoke(g, sock(f, 'forearm.R', _v));
    }
    // flicker-steps: no travel to see — gone here, there
    const dashing = f.dashT > 0;
    if (dashing && !this.wasDashing) {
      this.dashFrom.copy(f.center());
      f.visual.object.visible = false;
      blackSmoke(g, this.dashFrom, 6, 0.4, 0.9);
    } else if (!dashing && this.wasDashing) {
      f.visual.object.visible = true;
      blackSmoke(g, f.center(), 6, 0.4, 0.9);
    }
    this.wasDashing = dashing;
    if (g.hud && f === g.player) g.hud.form = this.formName();
  }

  // -------------------------------------------------------------------------------------------- inputs

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof CutAction || cur instanceof StrikeAction) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastEnd > 0.8) this.combo = 0;
    this.chain(this.combo);
  }

  chain(i: number): void {
    const f = this.f;
    const list = this.form === 'bankai' ? DANGAI_CHAIN : this.form === 'final' ? FINAL_CHAIN : HUMAN_CHAIN;
    const idx = i % list.length;
    this.combo = idx + 1;
    this.lastEnd = this.g.time + 0.8;
    const clip = list[idx];
    if (this.form === 'bankai') f.act(new CutAction(this, clip, idx, CUTS[clip]), true);
    else f.act(new StrikeAction(this, clip, idx, (this.form === 'final' ? FINAL_STRIKES : HUMAN_STRIKES)[clip]), true);
  }

  heavy(): void {
    const f = this.f;
    if (this.form === 'bankai') this.special(new LevelAction(this), 30, 'level', 6);
    else if (this.form === 'final') this.special(new ThrustAction(this), 0, 'thrust', 1.4);
    else {
      if (f.busy && !(f.action instanceof StrikeAction && f.action.canCancel(new StrikeAction(this, 'hm_crack', 0, HUMAN_STRIKES.hm_crack, false)))) return;
      f.act(new StrikeAction(this, 'hm_crack', 0, HUMAN_STRIKES.hm_crack, false), true);
    }
  }

  /** Q */
  skill1(): void {
    if (this.form === 'bankai') this.special(new GetsugaAction(this), 24, 'getsuga', 2.2);
    else this.spentNote();
  }

  /** E */
  skill2(): void {
    if (this.form !== 'bankai') return this.spentNote();
    const t = this.near(14);
    if (!t) return;
    this.special(new SeizeAction(this, t), 30, 'seize', 9);
  }

  /** R */
  skill3(): void {
    if (this.form !== 'bankai') return this.spentNote();
    this.special(new CatchAction(this), 14, 'catch', 3);
  }

  /** F: Saigo no Getsuga Tenshō · in the form, Mugetsu */
  release(): void {
    const { f } = this;
    if (this.form === 'bankai') {
      if (f.busy && !(f.action instanceof CutAction)) return;
      if (!f.spendRei(60)) return this.noRei();
      this.setVeil(false);
      f.stopAction();
      f.act(new FinalAction(this), true);
    } else if (this.form === 'final') {
      if (f.action instanceof MugetsuAction) return;
      if (f.busy && !(f.action instanceof StrikeAction)) return;
      f.stopAction();
      f.act(new MugetsuAction(this), true);
    } else this.spentNote();
  }

  /** G: reiatsu on a higher plane */
  toggle(): void {
    if (this.form !== 'bankai') return this.spentNote();
    if (this.veil) {
      this.setVeil(false);
      return;
    }
    if (this.cd.veil > 0) return;
    if (this.f.rei < 10) return this.noRei();
    this.setVeil(true);
  }

  /** V: the black-crimson flare — the pressure weighs down everything round him */
  toggleFlare(): void {
    const { f, g } = this;
    if (!this.flare && this.form === 'spent') return this.spentNote();
    this.flare = !this.flare;
    this.applyStats();
    if (!this.flare) return;
    f.aura.flare(1.8, 0.5);
    g.shake(f === g.player ? 0.3 : 0.1);
    g.sfx.play('flare', f.center());
    g.addRing(f.pos.clone().setY(f.pos.y + 0.06), 14, DANGAI_CRIMSON, 0.5);
    for (const o of g.enemiesOf(f)) {
      if (o.pos.distanceTo(f.pos) > 14) continue;
      o.slowT = Math.max(o.slowT, 2.5);
      o.slowK = Math.max(o.slowK, 0.45);
      if (o.maxHp < f.maxHp * 0.6) o.hitstun = Math.max(o.hitstun, 0.6);
    }
  }

  private noRei(): void {
    if (this.f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
  }

  private spentNote(): void {
    if (this.form === 'spent' && this.f === this.g.player) this.g.hud?.showBanner('No reiatsu left — only your fists');
  }

  target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 90, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 90);
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
    if (cost > 0 && !f.spendRei(cost)) {
      this.noRei();
      return false;
    }
    this.cd[cdKey] = cd;
    f.act(a, true);
    return true;
  }

  // -------------------------------------------------------------------------------------------- effects

  /** The shockwave a Bankai v2 blow throws out from the blade. */
  wave(radius: number, damage: number): void {
    const { f, g } = this;
    const at = f.blade.tip.clone().lerp(f.blade.base, 0.3);
    const gy = groundBelow(g, at, 3);
    dangaiWave(g, f, at, radius, damage, gy !== null && at.y - gy < 2.2 ? gy : null);
  }

  /** The Final Getsuga form's or the spent human's blow: the sphere ahead, the limb's wake. */
  strike(s: Strike, hits: Set<number>): void {
    const { f, g } = this;
    const fw = f.forward(_w).clone();
    const c = f.pos.clone().addScaledVector(fw, s.reach);
    c.y += s.height;
    let any = false;
    for (const o of g.enemiesOf(f)) {
      if (hits.has(o.id)) continue;
      const cy = Math.max(o.pos.y + 0.15, Math.min(o.pos.y + o.def.height - 0.15, c.y));
      if (Math.hypot(o.pos.x - c.x, cy - c.y, o.pos.z - c.z) > s.radius + o.def.radius) continue;
      hits.add(o.id);
      any = true;
      const dir = _v.subVectors(o.pos, f.pos).setY(0);
      if (dir.lengthSq() < 1e-4) dir.copy(fw);
      dir.normalize();
      g.damage(o, s.damage, f, dir.clone(), { knock: s.knock, launch: s.launch, heavy: s.heavy, hitstop: this.form === 'final' ? 0.08 : 0.045, shake: this.form === 'final' ? 0.3 : 0.1 });
      const at = new THREE.Vector3(o.pos.x, cy, o.pos.z);
      if (this.form === 'final') {
        blackSmoke(g, at, 6, 0.4, 1);
        embers(g, at, 6, 4);
      } else g.sparks(at, dir, '#F3E9D8', 6);
    }
    // the Final Getsuga form's blows go through walls as if they were paper
    if (s.smash) g.engine.destruction.carve(new SphereShape(c, s.radius * 0.9), { mode: 'smash', power: s.smash, impulse: 12, dust: 0.6, dir: fw });
    if (s.heavy && this.form === 'spent') {
      const h = sock(f, s.limb, _v);
      const gy = groundBelow(g, h.clone().setY(h.y + 0.5), 3);
      // the concrete-cracker: a human's kick that still splits the pavement
      if (gy !== null) g.groundImpact(new THREE.Vector3(h.x, gy, h.z), 1, 90, '#D8D2C4', f);
    }
    if (any && this.form === 'final') g.engine.gr.chroma.offset.set(0.003, 0.003);
  }

  /** The Final Getsuga form simply is somewhere else (no travel seen). */
  flickerTo(p: THREE.Vector3): void {
    const { f, g } = this;
    blackSmoke(g, f.center(), 6, 0.4, 0.9);
    const gy = groundBelow(g, p.clone().setY(p.y + 2), 6);
    if (gy !== null && Math.abs(gy - p.y) < 2.5) p.y = gy;
    pin(f, p);
    blackSmoke(g, f.center(), 6, 0.4, 0.9);
    g.sfx.play('shunpo', f.center(), 0.5);
  }

  glowBlade(a: number): void {
    const s = this.f.visual.props.get('sword');
    if (!s) return;
    const c = new THREE.Color(DANGAI_CRIMSON);
    s.material.userData.uniforms.uEnergy.value.set(c.r, c.g, c.b, a * 0.8);
  }

  /** The black blade of Mugetsu (and of the thrust): grown in the wound hand, gone again in smoke. */
  showBlade(on: boolean): void {
    const { f, g } = this;
    if (on) {
      if (!f.visual.props.get('blade')) f.visual.attach('blade', mugetsuBlade(), 'grip.R');
      f.visual.rig.setBoneVisible('fist.R', true);
      blackSmoke(g, sock(f, 'grip.R', _v), 8, 0.3, 0.8);
    } else if (f.visual.props.get('blade')) {
      blackSmoke(g, sock(f, 'grip.R', _v), 8, 0.6, 1);
      f.visual.detach('blade');
    }
  }

  /** The open hand for the catch, the fist again after. */
  openHand(open: boolean): void {
    this.f.visual.rig.setBoneVisible('fist.L', !open);
    this.f.visual.rig.setBoneVisible('palm.L', open);
  }

  /** A shot crushed in the hand (or a blade caught in it). */
  crushFx(p: THREE.Vector3, blade: boolean): void {
    const g = this.g;
    embers(g, p, blade ? 14 : 10, 5);
    blackSmoke(g, p, 5, 0.3, 0.7);
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.9, sizeEnd: 0.1, life: 0.2, r: 1, g: 0.55, b: 0.62, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    g.sfx.play(blade ? 'ting' : 'hit', p, 0.9);
  }

  /** The sky goes to `look` (the Final Getsuga form's grey, Mugetsu's black). */
  darken(look: typeof SKY_FINAL): void {
    if (this.sky && !this.sky.done) {
      this.sky.look = look;
      this.sky.target = 1;
      return;
    }
    this.sky = new SkyTint(this.g, look, look === SKY_MUGETSU ? 2.4 : 1.2);
    this.g.addProjectile(this.sky);
  }

  private lighten(): void {
    if (this.sky) this.sky.target = 0;
    this.sky = null;
  }

  // -------------------------------------------------------------------------------------------- forms

  private setForm(form: Form): void {
    const f = this.f;
    this.form = form;
    const aura = form === 'final' ? AURA_FINAL : form === 'spent' ? AURA_SPENT : AURA_DANGAI;
    const stance = form === 'final' ? FINAL_STANCE : form === 'spent' ? HUMAN_STANCE : DANGAI_STANCE;
    const clips = form === 'final' ? FINAL_CLIPS : form === 'spent' ? HUMAN_CLIPS : DANGAI_CLIPS;
    const blade = form === 'bankai' ? BLADE_V2 : BLADE_MUGETSU;
    f.def = { ...f.def, stance, clips, blade };
    f.anim.stopAll(0.05);
    const build = form === 'bankai'
      ? { asset: dangaiAsset('bankai'), props: [{ key: 'sword', model: dangaiSword(), socket: 'grip.R' }] }
      : { asset: form === 'final' ? dangaiAsset('final') : humanAsset('school'), props: [] };
    f.setForm(build, aura, blade);
    this.combo = 0;
    this.applyStats();
  }

  /** The black reiatsu tears open: the Final Getsuga form. */
  becomeFinal(): void {
    const { f, g } = this;
    this.setForm('final');
    this.finalT = FINAL_TIME;
    f.anim.play('fg_reveal', {});
    const c = f.center();
    f.aura.pillarBurst(3);
    g.groundImpact(f.pos.clone(), 4, 260, DANGAI_CRIMSON, f);
    g.addRing(f.pos.clone().setY(f.pos.y + 0.06), 18, DANGAI_CRIMSON, 0.7);
    g.sfx.play('bankai', c, 1.2);
    g.shake(f === g.player ? 1 : 0.4);
    g.hitstop(0.16);
    g.slowMo(0.7, 0.35);
    g.engine.gr.chroma.offset.set(0.01, 0.01);
    if (f === g.player) g.cam.punchFov(12);
    blackSmoke(g, c, 40, 2.2, 2.4);
    embers(g, c, 30, 10);
    for (const o of g.enemiesOf(f)) {
      const d = o.pos.distanceTo(f.pos);
      if (d < 16) g.damage(o, 50 * (1 - d / 16), f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 26 * (1 - d / 16), launch: 6, heavy: true });
    }
    if (g.hud && f === g.player) g.hud.vignette = 1;
  }

  /** After Mugetsu: a human, spent. */
  becomeSpent(): void {
    const { f, g } = this;
    if (this.form === 'spent') return;
    f.visual.object.visible = true;
    this.setForm('spent');
    this.finalT = 0;
    f.maxRei = 20;
    f.rei = Math.min(f.rei, 4);
    f.anim.play('sp_spent', {});
    f.hitstun = Math.max(f.hitstun, 1.6);
    blackSmoke(g, f.center(), 30, 1.2, 1.6);
    g.callout('', 'POWERS SPENT', '#d8d8d8');
    setTimeout(() => this.lighten(), 2500);
    if (g.hud && f === g.player) g.hud.vignette = 0;
  }

  setVeil(on: boolean): void {
    const { f, g } = this;
    if (this.veil === on) return;
    this.veil = on;
    f.veiled = on;
    if (!on) this.cd.veil = 2;
    this.applyStats();
    if (on) {
      // the reiatsu does not vanish: it rises out of reach — a last ripple, then nothing to sense
      g.addRing(f.pos.clone().setY(f.pos.y + 1), 4, '#E8E4E8', 0.35);
      g.sfx.play('flare', f.center(), 0.4);
    }
  }

  // -------------------------------------------------------------------------------------------- damage hooks

  private parry(amount: number, from: Fighter | null, o: { energy?: boolean; quiet?: boolean }): boolean {
    const { f, g } = this;
    if (!this.catching || f.dead) return false;
    const p = sock(f, 'palm.L', _v).clone();
    if (o.energy) {
      // a shot that got through to the hand: crushed
      this.crushFx(p, false);
      return true;
    }
    // a blade (or a fist) caught in the fingers
    this.catching = false;
    this.crushFx(p, true);
    g.callout('', 'CAUGHT', '#ff9aae');
    if (from && !from.dead) {
      from.stopAction();
      from.hitstun = Math.max(from.hitstun, 0.9);
    }
    g.hitstop(Math.min(0.2, 0.06 + amount / 600));
    f.stopAction();
    f.act(new CaughtAction(this, from), true);
    return true;
  }

  // -------------------------------------------------------------------------------------------- look & stats

  private applyStats(): void {
    const f = this.f;
    f.def = { ...f.def, speed: { ...SPEED[this.form] } };
    f.damageTaken = TAKEN[this.form];
    f.power = POWER[this.form] * (this.flare ? 1.15 : 1);
    // the Final Getsuga form: nothing staggers it, a quarter of every blow gets through
    f.toughness = this.form === 'final' ? 1e9 : 0;
    f.knockTaken = this.form === 'final' ? 0.1 : 1;
    // the higher plane: nothing shows; the form: black pours off him; spent: nothing at all
    f.aura.target = this.form === 'spent' || this.veil ? 0 : this.flare ? 1 : this.form === 'final' ? 0.7 : 0.35;
    f.ghosts.enabled = this.form === 'bankai';
    f.ghosts.color.set(this.form === 'bankai' ? '#C2304F' : '#2A0A10');
    if (this.g.hud && f === this.g.player) this.g.hud.form = this.formName();
  }

  formName(): string {
    if (this.form === 'final') return `Saigo no Getsuga Tenshō · ${Math.ceil(this.finalT)}s`;
    if (this.form === 'spent') return 'Spent — no reiatsu';
    return 'Bankai — Tensa Zangetsu' + (this.veil ? ' · higher plane' : '');
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    if (this.form === 'final') return [
      { key: 'LMB', name: 'Wound arm', kanji: '黒' },
      { key: 'RMB', name: 'Black blade', kanji: '刃', cd: cd.thrust, cdMax: 1.4 },
      { key: 'F', name: `Mugetsu ${Math.ceil(this.finalT)}s`, kanji: '無月', timer: this.finalT / FINAL_TIME, active: true, tint: '#f3f3f0' },
      { key: 'Shift', name: 'Flicker-step', kanji: '瞬', cost: 4 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
    ];
    if (this.form === 'spent') return [
      { key: 'LMB', name: 'Karate', kanji: '空手' },
      { key: 'RMB', name: 'Concrete-cracker', kanji: '蹴' },
      { key: 'Shift', name: 'Dash', kanji: '走', cost: 4 },
    ];
    return [
      { key: 'LMB', name: 'Tensa Zangetsu · shockwaves', kanji: '斬' },
      { key: 'RMB', name: 'Mountain-leveller', kanji: '断', cost: 30, cd: cd.level, cdMax: 6 },
      { key: 'Q', name: 'Black Getsuga', kanji: '月牙', cost: 24, cd: cd.getsuga, cdMax: 2.2, tint: '#ff6e86' },
      { key: 'E', name: 'Seize & relocate', kanji: '掴', cost: 30, cd: cd.seize, cdMax: 9 },
      { key: 'R', name: 'Bare-hand catch', kanji: '受', cost: 14, cd: cd.catch, cdMax: 3, active: this.catching },
      { key: 'F', name: 'Saigo no Getsuga Tenshō', kanji: '最後', cost: 60, tint: '#ff6e86' },
      { key: 'G', name: this.veil ? 'Higher plane (on)' : 'Higher plane', kanji: '次元', active: this.veil, cd: cd.veil, cdMax: 2, tint: '#e8e4e8' },
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
    ];
  }

  ai(): KitAI {
    const bankai = () => this.form === 'bankai', final = () => this.form === 'final', spent = () => this.form === 'spent';
    const foeSwinging = () => {
      const t = this.target();
      return t !== null && t.action !== null && t.pos.distanceTo(this.f.pos) < 4.5 && t.action.t < 0.25;
    };
    const far = () => {
      const t = this.target();
      return t !== null && t.pos.distanceTo(this.f.pos) > 24;
    };
    return {
      reach: this.form === 'final' ? 2 : this.form === 'spent' ? 1.25 : 2.4,
      chain: this.form === 'bankai' ? 5 : this.form === 'final' ? 3 : 4,
      releaseAt: [0.35],
      toggleAt: 0.8,
      toggleOn: () => this.veil || this.form !== 'bankai' || this.cd.veil > 0,
      moves: [
        { name: 'getsuga', use: () => this.skill1(), min: 6, max: 70, weight: 2, cd: 2.6, when: bankai },
        { name: 'level', use: () => this.heavy(), min: 4, max: 45, weight: 1.3, cd: 6.5, when: bankai },
        { name: 'seize', use: () => this.skill2(), min: 0, max: 12, weight: 1.1, cd: 9, when: bankai },
        { name: 'catch', use: () => this.skill3(), min: 0, max: 4.5, weight: 2.5, cd: 3.5, when: () => bankai() && foeSwinging() },
        { name: 'thrust', use: () => this.heavy(), min: 2, max: 12, weight: 2, cd: 2, when: final },
        // the clock runs down anyway; a foe that keeps its distance gets the curtain early
        { name: 'mugetsu', use: () => this.release(), min: 0, max: 160, weight: 3, cd: 2, when: () => final() && (this.finalT < 4 || (far() && this.finalT < FINAL_TIME - 6)) },
        { name: 'crack', use: () => this.heavy(), min: 0, max: 2, weight: 1, cd: 2.4, when: spent },
      ],
    };
  }
}
