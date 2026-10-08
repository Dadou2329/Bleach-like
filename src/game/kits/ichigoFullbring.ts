// Lost Agent Ichigo's kit (docs/kits/ichigo.md §4 Lost Agent; dossier A1 §1 K5/K6, abilities I and E). Fullbring:
// the badge's stored reiatsu. FB1 — the manji guard in his fist: karate and guard bashes, the guard ram (RMB), the
// manji blast (Q: six blades at most, one fewer for every shot in a row, under three it breaks on anything; three
// shots in a row leave him wide open), the charged six-bar manji (E), the focused-leg kick (R), the guard braced to
// take a big hit (G); Bringer Light under every dash, springy jumps. F: clad (FB2) — the ragged black robe, the blade
// over his forearm: arm cuts and kicks, the berserk sweep (RMB), the berserk surge (G: half again the damage, the HP
// bleeding away, no guard). F: complete (FB3) — the armour and the machete: cuts mixed with kicks, the energy-held
// swing (RMB), the manji barrage (Q: a fan, no decay), the Fullbring Getsuga (E: small, very fast), the first-strike
// cut (R: from behind, a limb taken — the arm numb six seconds), the catch (G: a giant blow stopped one-handed, then
// the counter), and a blink behind the target on every dash. F: Rukia's sword through his chest — the Shinigami
// restored (Shikai v2: the Hueco Mundo kit's Shikai with a Getsuga that lops the top off a mansion; G the cloth's wrap,
// healing). F: Bankai v3 — the longer, curved daitō: the string reaches further, the swing throws a shockwave (RMB),
// the black Getsuga with a blue rim (Q), an energy blast caught and crushed (E), the sword-breaker cut (R: disarmed
// eight seconds), the rage aura (G); F again: the re-release, whose shock wave shatters domes and fields.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { Game } from '../game';
import type { AbilityInfo } from '../../ui/hud';
import type { Kit, KitAI } from './kit';
import { IchigoKit } from './ichigo';
import { humanAsset } from '../../chars/ichigoHuman';
import { ARM_BLADE_BASE, ARM_BLADE_TIP, FB_SHEATH_ON_BACK, MACHETE_BASE_Z, MACHETE_TIP_Z, V3_BASE_Z, V3_TIP_Z, fbArmBlade, fbGuard, fbMachete, fbSheath, fullbringAsset, tensaV3, zangetsuV2 } from '../../chars/ichigoFullbring';
import { FB1_CHAIN, FB1_CLIPS, FB1_STANCE, FB2_CHAIN, FB2_CLIPS, FB2_STANCE, FB3_CHAIN, FB3_CLIPS, FB3_STANCE } from '../../chars/ichigoFullbringClips';
import { ICHIGO_CLIPS, ICHIGO_STANCE } from '../../chars/ichigoClips';
import { DANGAI_CLIPS } from '../../chars/ichigoDangaiClips';
import type { AuraStyle } from '../../vfx/aura';
import { GetsugaProjectile } from '../projectiles/getsuga';
import type { EnergyColors } from '../../vfx/energy';
import { GroundGetsuga } from '../../vfx/ichigoArts';
import { BRINGER_GREEN, FB_CRIMSON, ManjiBlast, bringerLight } from '../../vfx/fullbring';
import { dangaiWave } from '../../vfx/dangai';
import { TEX_GLOW, TEX_STREAK } from '../../vfx/sprites';

type Form = 'fb1' | 'fb2' | 'fb3' | 'shikai2' | 'bankai3';
type BladeDef = NonNullable<FighterDef['blade']>;

/** Fullbring: black reiatsu outlined in crimson */
export const AURA_FB: AuraStyle = { core: '#FF8A9A', body: '#8C1A2A', rim: '#D02A3A', dark: '#120709' };
/** restored: the Shikai's pale gold */
const AURA_RESTORED: AuraStyle = { core: '#FDFFD9', body: '#F4D761', rim: '#C6923D' };
/** Bankai v3: black outlined in blue (red-black and crackling when enraged) */
const AURA_V3: AuraStyle = { core: '#CFE2FF', body: '#3A7BFF', rim: '#1B3F99', dark: '#050508' };
const AURA_RAGE: AuraStyle = { core: '#FFB0B0', body: '#FF3B3B', rim: '#8A0A12', dark: '#050203' };
const GETSUGA_V3: EnergyColors = { core: '#E8F4FF', body: '#3A7BFF', rim: '#1B3F99', dark: '#050508' };
const GETSUGA_FB: EnergyColors = { core: '#FF8A9A', body: '#D02A3A', rim: '#8C1A2A', dark: '#120709' };

const BLADE_ARM: BladeDef = { prop: 'blade', base: [...ARM_BLADE_BASE], tip: [...ARM_BLADE_TIP], color: '#D02A3A', core: '#FF8A9A' };
const BLADE_MACHETE: BladeDef = { prop: 'sword', base: [0, 0, MACHETE_BASE_Z], tip: [0, 0, MACHETE_TIP_Z], color: '#D02A3A', core: '#FF8A9A' };
const BLADE_V2: BladeDef = { prop: 'sword', base: [0, 0, 0.16], tip: [0, 0, 1.56], color: '#F4D761', core: '#FDFFD9' };
const BLADE_V3: BladeDef = { prop: 'sword', base: [0, 0, V3_BASE_Z], tip: [0, 0, V3_TIP_Z], color: '#3A7BFF', core: '#CFE2FF' };

const SPEED: Record<Form, FighterDef['speed']> = {
  fb1: { run: 10, sprint: 20, jump: 12.5, dash: 11, dashTime: 0.12 },
  fb2: { run: 11, sprint: 23, jump: 13, dash: 13, dashTime: 0.11 },
  fb3: { run: 12, sprint: 26, jump: 13.5, dash: 15, dashTime: 0.1 },
  shikai2: { run: 11.5, sprint: 24, jump: 12.5, dash: 14, dashTime: 0.12 },
  bankai3: { run: 13, sprint: 30, jump: 13.5, dash: 20, dashTime: 0.1 },
};
const POWER: Record<Form, number> = { fb1: 0.8, fb2: 0.95, fb3: 1.1, shikai2: 1.3, bankai3: 1.6 };
const TAKEN: Record<Form, number> = { fb1: 1, fb2: 0.95, fb3: 0.85, shikai2: 0.85, bankai3: 0.75 };

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

export const FULLBRING_DEF: FighterDef = {
  id: 'ichigo-fullbring',
  name: 'Kurosaki Ichigo',
  title: 'Substitute Shinigami · Lost Agent',
  build: () => ({ asset: humanAsset('casual'), props: [{ key: 'guard', model: fbGuard(), socket: 'grip.R' }] }),
  stance: FB1_STANCE,
  clips: FB1_CLIPS,
  aura: AURA_FB,
  blade: BLADE_ARM,
  hp: 1100,
  rei: 160,
  speed: { ...SPEED.fb1 },
  radius: 0.4,
  height: 1.81,
};

const spec = (damage: number, knock: number, cut: number, extra: Partial<BladeSpec> = {}): BladeSpec => ({ damage, knock, launch: 0, hitstop: 0.05, shake: 0.12, cut, ...extra });

interface Strike {
  damage: number;
  knock: number;
  launch?: number;
  heavy?: boolean;
  reach: number;
  height: number;
  radius: number;
  lunge: number;
}

/** sphere blows: karate, guard bashes, kicks */
const BLOWS: Record<string, Strike> = {
  hm_jab: { damage: 10, knock: 4, reach: 0.95, height: 1.4, radius: 0.7, lunge: 4 },
  fb_bash: { damage: 17, knock: 10, reach: 1.25, height: 1.35, radius: 0.95, lunge: 6 },
  hm_round: { damage: 16, knock: 10, launch: 2, reach: 1.0, height: 1.45, radius: 0.85, lunge: 4 },
  fb_upper: { damage: 19, knock: 4, launch: 9, reach: 1.1, height: 1.3, radius: 0.95, lunge: 5 },
  hm_front: { damage: 16, knock: 11, reach: 1.05, height: 1.05, radius: 0.8, lunge: 6 },
  hm_spinback: { damage: 20, knock: 14, reach: 1.05, height: 1.25, radius: 0.9, lunge: 5 },
  fb_ram: { damage: 24, knock: 20, launch: 3, heavy: true, reach: 1.3, height: 1.25, radius: 1.1, lunge: 0 },
  fb_legkick: { damage: 30, knock: 24, launch: 4, heavy: true, reach: 1.2, height: 1.1, radius: 1, lunge: 0 },
};

interface Cut {
  window: [number, number];
  spec: BladeSpec;
  lunge: number;
}

/** blade cuts: the FB2 arm blade, the FB3 machete */
const CUTS: Record<string, Cut> = {
  fb2_s1: { window: [0.1, 0.22], spec: spec(22, 7, 260), lunge: 7 },
  fb2_s3: { window: [0.12, 0.24], spec: spec(22, 7, 260, { launch: 4 }), lunge: 6 },
  slash1: { window: [0.1, 0.24], spec: spec(26, 7, 340), lunge: 8 },
  slash2: { window: [0.09, 0.22], spec: spec(26, 7, 340, { launch: 4 }), lunge: 7 },
  slash3: { window: [0.21, 0.31], spec: spec(40, 9, 420, { launch: 6, heavy: true, hitstop: 0.09, shake: 0.35 }), lunge: 7 },
};

/** Bankai v3's string: the long daitō, every cut a step further */
const V3_CUTS: Record<string, Cut> = {
  slash1: { window: [0.1, 0.24], spec: spec(30, 8, 900), lunge: 9 },
  slash2: { window: [0.09, 0.22], spec: spec(30, 8, 900, { launch: 4 }), lunge: 8 },
  slash3: { window: [0.21, 0.31], spec: spec(44, 9, 1100, { launch: 7, hitstop: 0.09, shake: 0.4 }), lunge: 8 },
  slash4: { window: [0.08, 0.47], spec: spec(22, 10, 800, { launch: 2 }), lunge: 5 },
  slash5: { window: [0.34, 0.47], spec: spec(64, 20, 1300, { launch: 6, heavy: true, hitstop: 0.14, shake: 0.7 }), lunge: 8 },
};

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

function aimAt(f: Fighter, g: Game, out = new THREE.Vector3()): THREE.Vector3 {
  if (f.faceTarget) return out.copy(f.faceTarget);
  if (f === g.player) return g.aimPoint(f, out);
  return f.center(out).addScaledVector(f.forward(), 30);
}

function groundBelow(g: Game, p: THREE.Vector3, depth = 6): number | null {
  const w = g.engine.world, vs = w.vs;
  const x = Math.floor(p.x / vs), z = Math.floor(p.z / vs);
  for (let y = Math.floor((p.y + 0.3) / vs); y > Math.floor((p.y - depth) / vs); y--) if (w.isSolid(x, y, z)) return (y + 1) * vs;
  return null;
}

function pin(o: Fighter, p: THREE.Vector3): void {
  o.body.pos.copy(p);
  o.body.prev.copy(p);
  o.body.vel.set(0, 0, 0);
  o.push.set(0, 0, 0);
}

// ------------------------------------------------------------------------------------------------ actions

/** A sphere blow (fist, guard, foot) at the clip's 'hit' beat. */
class BlowAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private hitAt = 0;
  private struck = false;
  private hits = new Set<number>();
  queued = false;
  constructor(readonly kit: FullbringKit, readonly clip: string, readonly index: number, readonly s: Strike, readonly chained = true, readonly push = 0) {
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
    f.anim.play(this.clip, {
      fadeIn: 0.03,
      onEvent: (n) => {
        if (n !== 'step') return;
        const t = f.faceTarget;
        const extra = t ? Math.min(4, Math.max(0, Math.hypot(t.x - f.pos.x, t.z - f.pos.z) - 1.2)) : 0;
        f.push.addScaledVector(f.forward(), this.s.lunge + this.push + extra * 2.2);
        g.sfx.play('swing', f.center(), 0.6);
        if (this.push > 0) bringerLight(g, f.pos, 8);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
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

/** A blade cut (the arm blade, the machete, the v3 daitō): the fighter's own blade sampler sweeps it. */
class CutAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private swished = false;
  private waved = false;
  queued = false;
  constructor(readonly kit: FullbringKit, readonly clip: string, readonly index: number, readonly info: Cut, readonly wave = 0) {
    super();
    this.name = clip;
    this.mobility = 0.12;
    this.airGravity = 0.12;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    f.bladeHits.clear();
    f.bladeSpec = this.kit.rageSpec(this.info.spec);
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n !== 'step') return;
        const t = f.faceTarget;
        const extra = t ? Math.min(4, Math.max(0, Math.hypot(t.x - f.pos.x, t.z - f.pos.z) - 1.5)) : 0;
        f.push.addScaledVector(f.forward(), this.info.lunge + extra * 2.4);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const [w0, w1] = this.info.window;
    if (!this.swished && this.t >= w0 - 0.03) {
      this.swished = true;
      g.sfx.play(this.info.spec.damage >= 40 ? 'swingHeavy' : 'swing', f.center());
    }
    f.bladeActive = this.t >= w0 && this.t <= w1;
    if (f.trail) f.trail.emitting = this.t >= w0 - 0.02 && this.t <= w1 + 0.06;
    // Bankai v3: every swing throws its shockwave
    if (this.wave > 0 && !this.waved && this.t >= w0 + 0.03) {
      this.waved = true;
      const at = f.blade.tip.clone().lerp(f.blade.base, 0.3);
      const gy = groundBelow(g, at, 3);
      dangaiWave(g, f, at, this.wave, this.info.spec.damage * 0.35, gy !== null && at.y - gy < 2.2 ? gy : null);
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
    if (next.name === 'dash' || next instanceof SkillAction) return this.t >= this.info.window[0] + 0.06;
    return false;
  }
}

abstract class SkillAction extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: FullbringKit) {
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

/** Q / E (FB1, FB2): the manji blast, punched off the fist (E: charged first into the big six-bar). */
class BlastAction extends SkillAction {
  readonly name = 'blast';
  private fired = false;
  constructor(kit: FullbringKit, readonly charged: boolean) {
    super(kit);
    this.mobility = this.charged ? 0 : 0.1;
  }
  override start(f: Fighter, g: Game): void {
    const speed = this.charged ? 0.55 : 1;
    this.playClip(f, 'fb_blast', (n) => {
      if (n === 'charge' && this.charged) g.sfx.play('charge', f.center(), 0.7);
      if (n === 'fire' && !this.fired) {
        this.fired = true;
        this.kit.fireManji(this.charged);
      }
    }, speed);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    // the charge: the guard swells into six bars, crimson pouring off it
    if (this.charged && !this.fired) {
      const p = sock(f, 'grip.R', _v);
      const c = new THREE.Color(FB_CRIMSON);
      g.engine.glow.spawn({ x: p.x + (Math.random() - 0.5) * 0.6, y: p.y + (Math.random() - 0.5) * 0.6, z: p.z + (Math.random() - 0.5) * 0.6, vx: 0, vy: 0, vz: 0, size: 0.14, sizeEnd: 0.02, life: 0.25, r: c.r, g: c.g, b: c.b, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
  }
  override canCancel(next: FighterAction): boolean {
    // shot after shot: once a plain manji is away the fist can punch the next one out
    if (next instanceof BlastAction && !this.charged && this.fired) return true;
    return super.canCancel(next);
  }
}

/** RMB (FB2): the berserk sweep — the arm blade whirled round at full stretch. */
class SweepAction extends SkillAction {
  readonly name = 'sweep';
  private rehit = false;
  constructor(kit: FullbringKit) {
    super(kit);
    this.mobility = 0.05;
    this.armor = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    f.bladeSpec = this.kit.rageSpec(spec(30, 14, 300, { launch: 3, heavy: true, hitstop: 0.08, shake: 0.35 }));
    this.playClip(f, 'fb2_sweep', (n) => {
      if (n === 'step') f.push.addScaledVector(f.forward(), 5);
    });
    g.sfx.play('swingHeavy', f.center(), 1);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    f.bladeActive = this.t > 0.14 && this.t < 0.52;
    if (f.trail) f.trail.emitting = f.bladeActive;
    if (!this.rehit && this.t > 0.33) {
      this.rehit = true;
      f.bladeHits.clear();
    }
  }
}

/** RMB (FB3): the energy-held swing — the machete's blade thick with Fullbring, the cut running on along the ground. */
class HeldSwingAction extends SkillAction {
  readonly name = 'heldswing';
  private fired = false;
  constructor(kit: FullbringKit) {
    super(kit);
    this.mobility = 0.05;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    f.bladeSpec = this.kit.rageSpec(spec(50, 18, 700, { launch: 6, heavy: true, hitstop: 0.12, shake: 0.5 }));
    this.kit.glowBlade(1);
    this.playClip(f, 'slash5', (n) => {
      if (n === 'step') f.push.addScaledVector(f.forward(), 6);
      if (n !== 'fx' || this.fired) return;
      this.fired = true;
      const tip = f.blade.tip.clone();
      const gy = groundBelow(g, tip, 3);
      if (gy !== null) tip.y = gy;
      const dir = f.forward(_v).setY(0).normalize().clone();
      g.addProjectile(new GroundGetsuga(g, f, tip, dir, GETSUGA_FB, { speed: 32, range: 22, width: 1.6, damage: 60, power: 380 }));
      g.shake(f === g.player ? 0.5 : 0.2);
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    f.bladeActive = this.t > 0.34 && this.t < 0.47;
    if (f.trail) f.trail.emitting = this.t > 0.3 && this.t < 0.6;
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.glowBlade(0);
  }
}

/** Q (FB3): the manji barrage — one swing of the machete sprays a fan of full-strength manji. */
class BarrageAction extends SkillAction {
  readonly name = 'barrage';
  private fired = false;
  constructor(kit: FullbringKit) {
    super(kit);
    this.mobility = 0.05;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'slash1', (n) => {
      if (n !== 'hit' || this.fired) return;
      this.fired = true;
      const dir = aimAt(f, g, _v).sub(f.center()).setY(0).normalize().clone();
      const origin = f.center().addScaledVector(dir, 0.9);
      for (let i = -2; i <= 2; i++) {
        const d = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), i * 0.16);
        g.addProjectile(new ManjiBlast(g, f, origin.clone(), d, { blades: 6, damage: 26, speed: 34, range: 40, scale: 1.8 }));
      }
      g.sfx.play('getsugaBlack', origin, 0.7);
    }, 1.15);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (f.trail) f.trail.emitting = this.t > 0.08 && this.t < 0.26;
  }
}

/** E (FB3) / Q (Bankai v3): a Getsuga — the Fullbring one small and very fast; v3's black with a blue rim. */
class GetsugaAction extends SkillAction {
  readonly name = 'getsuga';
  private fired = false;
  constructor(kit: FullbringKit, readonly o: { radius: number; speed: number; range: number; damage: number; cut: number; colors: EnergyColors; callout?: boolean }) {
    super(kit);
    this.mobility = 0.05;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'getsuga', (n) => {
      if (n === 'charge') {
        this.kit.glowBlade(1);
        if (this.o.callout) g.callout('月牙天衝', 'GETSUGA TENSHŌ', '#9fc2ff');
      }
      if (n === 'fx' && !this.fired) this.fire(f, g);
    }, this.o.speed > 70 ? 1.4 : 1);
  }
  private fire(f: Fighter, g: Game): void {
    this.fired = true;
    const dir = aimAt(f, g, _v).sub(f.center());
    const flat = Math.hypot(dir.x, dir.z) || 1;
    dir.y = Math.max(f.faceTarget ? -0.5 : -0.06, Math.min(0.6, dir.y / flat)) * flat;
    dir.normalize();
    const right = new THREE.Vector3(dir.z, 0, -dir.x).normalize().multiplyScalar(-1);
    const side = new THREE.Vector3(0, 1, 0).multiplyScalar(Math.cos(0.7)).addScaledVector(right, Math.sin(0.7));
    const origin = f.center().addScaledVector(dir, 1.2);
    origin.y += 0.3;
    g.addProjectile(new GetsugaProjectile(g, f, origin, dir.clone(), side, { radius: this.o.radius, halfAngle: 1.1, speed: this.o.speed, range: this.o.range, damage: this.o.damage, cut: this.o.cut, colors: this.o.colors, dark: true }));
    g.sfx.play('getsugaBlack', origin, 0.9);
    g.shake(f === g.player ? 0.4 : 0.15);
    f.push.addScaledVector(dir, -2.5);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    f.bladeActive = this.t > 0.32 && this.t < 0.42;
    if (f.trail) f.trail.emitting = this.t > 0.3 && this.t < 0.5;
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.glowBlade(0);
  }
}

/** R (FB3): the first-strike cut — a blink to the foe's back, one quick draw; the arm it takes goes numb. */
class FirstStrikeAction extends SkillAction {
  readonly name = 'firststrike';
  private hits = new Set<number>();
  constructor(kit: FullbringKit, readonly target: Fighter) {
    super(kit);
    this.mobility = 0;
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    const t = this.target;
    const back = t.forward(_v).clone().negate();
    const p = t.pos.clone().addScaledVector(back, 1.3);
    bringerLight(g, f.pos, 10);
    f.ghosts.spawn(0.35, 0.9);
    pin(f, p);
    f.yaw = Math.atan2(t.pos.x - p.x, t.pos.z - p.z);
    bringerLight(g, f.pos, 10);
    g.sfx.play('shunpo', f.center(), 0.8);
    f.bladeHits.clear();
    f.bladeSpec = this.kit.rageSpec({
      ...spec(40, 6, 500, { hitstop: 0.12, shake: 0.35, unblockable: true }),
      onHit: (o) => {
        // a limb taken: the arm will not answer for a while
        o.armLockT = Math.max(o.armLockT, 6);
        g.callout('', 'A LIMB TAKEN', '#ff8a9a');
      },
    });
    this.playClip(f, 'fb3_draw', () => {});
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    f.bladeActive = this.t > 0.05 && this.t < 0.2;
    if (f.trail) f.trail.emitting = this.t > 0.04 && this.t < 0.26;
  }
}

/**
 * G (FB3) / E (Bankai v3): the catch — the hand up; FB3 stops a giant blow one-handed and counters, v3 catches an
 * energy blast and crushes it.
 */
class CatchAction extends SkillAction {
  readonly name = 'catch';
  constructor(kit: FullbringKit, readonly energy: boolean) {
    super(kit);
    this.mobility = 0;
  }
  override start(f: Fighter, g: Game): void {
    this.kit.catching = this.energy ? 'energy' : 'blow';
    f.visual.rig.setBoneVisible('fist.L', false);
    f.visual.rig.setBoneVisible('palm.L', true);
    // an energy blast takes a while to cross the field: the hand stays up longer (the clip at a crawl)
    this.playClip(f, 'dg_catch', () => {}, this.energy ? 0.62 : 1);
    g.sfx.play('flare', f.center(), 0.4);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t > (this.energy ? 1.25 : 0.8)) this.kit.catching = null;
    if (this.kit.catching === 'energy') {
      const p = sock(f, 'palm.L', _v);
      const n = g.rejectNear(p.clone().addScaledVector(f.forward(_w), 0.8), 3.4, f, false);
      if (n > 0) this.kit.crushFx(p);
    }
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.catching = null;
    f.visual.rig.setBoneVisible('fist.L', true);
    f.visual.rig.setBoneVisible('palm.L', false);
  }
}

/** The counter after a caught blow: the hand closes and wrenches, then the blade. */
class CounterAction extends SkillAction {
  readonly name = 'counter';
  constructor(kit: FullbringKit, readonly from: Fighter | null) {
    super(kit);
    this.mobility = 0;
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'dg_caught', (n) => {
      if (n !== 'crush') return;
      const o = this.from;
      if (o && !o.dead) g.damage(o, 40, f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 18, launch: 4, heavy: true, hitstop: 0.12, unblockable: true });
      g.addRing(f.pos.clone().setY(f.pos.y + 0.08), 5, this.kit.auraBody(), 0.35);
    });
  }
}

/** R (Bankai v3): the sword-breaker — one heavy cut that breaks the guard and knocks the weapon away for eight seconds. */
class BreakerAction extends SkillAction {
  readonly name = 'breaker';
  constructor(kit: FullbringKit) {
    super(kit);
    this.mobility = 0.08;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    f.bladeSpec = this.kit.rageSpec({
      ...spec(52, 12, 1200, { launch: 4, heavy: true, hitstop: 0.14, shake: 0.5, unblockable: true }),
      onHit: (o) => {
        o.disarmT = Math.max(o.disarmT, 8);
        g.callout('', 'BLADE BROKEN', '#cfe2ff');
        g.sfx.play('shatter', o.center(), 1);
      },
    });
    // a Shunpo straight into reach (within 12 m), then the cut from a standstill
    const t = this.kit.target();
    const d = t ? Math.hypot(t.pos.x - f.pos.x, t.pos.z - f.pos.z) : 0;
    if (t && d > 2 && d < 12) {
      const dir = _v.subVectors(t.pos, f.pos).setY(0).normalize();
      f.ghosts.spawn(0.35, 0.8);
      g.sfx.play('shunpo', f.center(), 0.8);
      pin(f, f.pos.clone().addScaledVector(dir, d - 1.6));
      f.yaw = Math.atan2(dir.x, dir.z);
    }
    this.playClip(f, 'slash3', () => {});
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    f.bladeActive = this.t > 0.21 && this.t < 0.32;
    if (f.trail) f.trail.emitting = this.t > 0.18 && this.t < 0.4;
  }
}

/** RMB (Bankai v3): the big swing — the cleave and the shockwave it throws across the ground. */
class ShockSwingAction extends SkillAction {
  readonly name = 'shockswing';
  private fired = false;
  constructor(kit: FullbringKit) {
    super(kit);
    this.mobility = 0.05;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    f.bladeSpec = this.kit.rageSpec(spec(60, 20, 1400, { launch: 6, heavy: true, hitstop: 0.14, shake: 0.6 }));
    this.playClip(f, 'slash5', (n) => {
      if (n === 'step') f.push.addScaledVector(f.forward(), 7);
      if (n !== 'fx' || this.fired) return;
      this.fired = true;
      const tip = f.blade.tip.clone();
      const gy = groundBelow(g, tip, 3);
      dangaiWave(g, f, tip, 8, 60, gy);
      if (gy !== null) g.groundImpact(new THREE.Vector3(tip.x, gy, tip.z), 3, 280, AURA_V3.body, f);
      g.shake(f === g.player ? 0.7 : 0.3);
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    f.bladeActive = this.t > 0.34 && this.t < 0.47;
    if (f.trail) f.trail.emitting = this.t > 0.3 && this.t < 0.6;
  }
}

/** G (FB1): the manji guard braced — the next big blow is taken on it. */
class GuardAction extends SkillAction {
  readonly name = 'fbguard';
  constructor(kit: FullbringKit) {
    super(kit);
    this.mobility = 0.15;
  }
  override start(f: Fighter, g: Game): void {
    this.kit.guarding = true;
    this.playClip(f, 'fb_guard', () => {});
    g.sfx.play('ting', f.center(), 0.5);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t > 0.9) this.done = true;
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.guarding = false;
  }
}

/** F: a step up the ladder — the clip, its burst, the new form. */
class AscendAction extends SkillAction {
  readonly name = 'ascend';
  private burst = false;
  constructor(kit: FullbringKit, readonly clip: string, readonly to: Form) {
    super(kit);
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, this.clip, (n) => {
      if (n === 'fx') {
        f.aura.flare(2, 0.6);
        g.sfx.play('flare', f.center(), 0.8);
      }
      if (n === 'stab') this.kit.stabFx();
      if (n === 'call') g.callout('卍解', 'BANKAI', '#cfe2ff');
      if ((n === 'burst' || n === 'fx' && this.clip === 'release' && false) && !this.burst) {
        this.burst = true;
        this.kit.ascend(this.to);
      }
    });
    if (this.clip === 'release') g.callout('卍解', 'BANKAI', '#cfe2ff');
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.burst) this.done = true;
  }
}

// ------------------------------------------------------------------------------------------------ the kit

export class FullbringKit implements Kit {
  form: Form = 'fb1';
  private combo = 0;
  private lastEnd = 0;
  readonly cd = { blast: 0, charged: 0, ram: 0, leg: 0, guard: 0, surge: 0, sweep: 0, held: 0, barrage: 0, fgetsuga: 0, first: 0, catch: 0, wrap: 0, v3getsuga: 0, v3catch: 0, breaker: 0, shock: 0, rerelease: 0, rage: 0 };
  flare = false;
  /** the manji: shots in a row (each loses a blade), and when the last one went */
  private chainShots = 0;
  private lastShot = -9;
  /** FB1's guard braced */
  guarding = false;
  /** FB2's berserk surge */
  surgeT = 0;
  /** FB3 / v3: the hand up to catch */
  catching: 'blow' | 'energy' | null = null;
  /** Shikai v2: the cloth's wrap */
  wrapT = 0;
  /** Bankai v3: the rage aura */
  rage = false;
  private wasDashing = false;
  /** Shikai v2 runs on the Hueco Mundo kit */
  inner: IchigoKit | null = null;

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.parry = (amount, from, o) => this.parry(amount, from, o);
    this.applyStats();
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.inner) this.inner.update(dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    if (this.surgeT > 0) {
      this.surgeT -= dt;
      // the berserk surge eats at him
      f.hp = Math.max(1, f.hp - f.maxHp * 0.015 * dt);
      if (Math.random() < 0.4) {
        const p = sock(f, 'forearm.R', _v);
        const c = new THREE.Color(FB_CRIMSON);
        g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5) * 3, vy: 1 + Math.random() * 2, vz: (Math.random() - 0.5) * 3, size: 0.12, sizeEnd: 0.02, life: 0.35, r: c.r, g: c.g, b: c.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2 });
      }
      if (this.surgeT <= 0) {
        this.surgeT = 0;
        this.applyStats();
      }
    }
    if (this.form === 'fb2' && Math.random() < 0.5) {
      // the crimson streaks whipping round the right arm
      const p = sock(f, 'forearm.R', _v);
      const a = g.time * 14 + Math.random() * 0.6;
      const c = new THREE.Color(FB_CRIMSON);
      g.engine.glow.spawn({ x: p.x + Math.cos(a) * 0.17, y: p.y + (Math.random() - 0.5) * 0.3, z: p.z + Math.sin(a) * 0.17, vx: -Math.sin(a) * 2.4, vy: 0.8, vz: Math.cos(a) * 2.4, size: 0.07, sizeEnd: 0.02, life: 0.28, r: c.r, g: c.g, b: c.b, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
    }
    if (this.wrapT > 0) {
      this.wrapT -= dt;
      f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.03 * dt);
    }
    if (this.rage && Math.random() < 0.35) {
      // red-black lightning crackling over him
      const c = f.center();
      const a = Math.random() * Math.PI * 2;
      g.engine.glow.spawn({ x: c.x + Math.cos(a) * 0.5, y: f.pos.y + Math.random() * 1.9, z: c.z + Math.sin(a) * 0.5, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, vz: (Math.random() - 0.5) * 6, size: 0.1, sizeEnd: 0.02, life: 0.12, r: 1, g: 0.25, b: 0.25, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 4 });
    }
    // Bringer Light under every dash; FB3 blinks behind the target
    const dashing = f.dashT > 0;
    if (dashing && !this.wasDashing && this.fbForm()) {
      bringerLight(g, f.pos, 12);
      if (this.form === 'fb3') {
        const t = this.near(12);
        const toward = t && f.dashDir.dot(_v.subVectors(t.pos, f.pos).setY(0).normalize()) > 0.5;
        if (t && toward) {
          const p = t.pos.clone().addScaledVector(t.forward(_w), -1.4);
          f.dashT = 0;
          pin(f, p);
          f.yaw = Math.atan2(t.pos.x - p.x, t.pos.z - p.z);
          bringerLight(g, f.pos, 12);
        }
      }
    }
    this.wasDashing = dashing;
  }

  private fbForm(): boolean {
    return this.form === 'fb1' || this.form === 'fb2' || this.form === 'fb3';
  }

  // -------------------------------------------------------------------------------------------- inputs

  attack(): void {
    const f = this.f;
    if (this.inner) return this.inner.attack();
    const cur = f.action;
    if (cur instanceof BlowAction || cur instanceof CutAction) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastEnd > 0.8) this.combo = 0;
    this.chain(this.combo);
  }

  chain(i: number): void {
    const f = this.f;
    const list = this.form === 'fb1' ? FB1_CHAIN : this.form === 'fb2' ? FB2_CHAIN : this.form === 'fb3' ? FB3_CHAIN : ['slash1', 'slash2', 'slash3', 'slash4', 'slash5'];
    const idx = i % list.length;
    this.combo = idx + 1;
    this.lastEnd = this.g.time + 0.8;
    const clip = list[idx];
    if (this.form === 'bankai3') f.act(new CutAction(this, clip, idx, V3_CUTS[clip], 3.5), true);
    else if (CUTS[clip]) f.act(new CutAction(this, clip, idx, CUTS[clip]), true);
    else f.act(new BlowAction(this, clip, idx, BLOWS[clip]), true);
  }

  heavy(): void {
    if (this.inner) return this.inner.heavy();
    if (this.form === 'fb1') this.special(new BlowAction(this, 'fb_ram', 0, BLOWS.fb_ram, false, 14), 0, 'ram', 1.8);
    else if (this.form === 'fb2') this.special(new SweepAction(this), 0, 'sweep', 2);
    else if (this.form === 'fb3') this.special(new HeldSwingAction(this), 12, 'held', 2.4);
    else this.special(new ShockSwingAction(this), 16, 'shock', 2.6);
  }

  /** Q */
  skill1(): void {
    if (this.inner) return this.inner.skill1();
    if (this.form === 'fb1' || this.form === 'fb2') this.special(new BlastAction(this, false), 6, 'blast', 0.5);
    else if (this.form === 'fb3') this.special(new BarrageAction(this), 16, 'barrage', 3);
    else this.special(new GetsugaAction(this, { radius: 4.2, speed: 56, range: 120, damage: 150, cut: 1300, colors: GETSUGA_V3, callout: true }), 20, 'v3getsuga', 1.8);
  }

  /** E */
  skill2(): void {
    if (this.inner) return this.inner.skill2();
    if (this.form === 'fb1' || this.form === 'fb2') this.special(new BlastAction(this, true), 14, 'charged', 3);
    else if (this.form === 'fb3') this.special(new GetsugaAction(this, { radius: 1.8, speed: 90, range: 70, damage: 70, cut: 600, colors: GETSUGA_FB }), 12, 'fgetsuga', 1.6);
    else this.special(new CatchAction(this, true), 10, 'v3catch', 2.5);
  }

  /** R */
  skill3(): void {
    if (this.inner) return this.inner.skill3();
    if (this.form === 'fb1' || this.form === 'fb2') this.special(new BlowAction(this, 'fb_legkick', 0, BLOWS.fb_legkick, false, 16), 8, 'leg', 2.5);
    else if (this.form === 'fb3') {
      const t = this.near(14);
      if (t) this.special(new FirstStrikeAction(this, t), 18, 'first', 6);
    } else this.special(new BreakerAction(this), 20, 'breaker', 8);
  }

  /** F: up the ladder — clad, complete, restored, Bankai; in Bankai v3 the re-release */
  release(): void {
    const { f, g } = this;
    if (f.busy && !(f.action instanceof BlowAction || f.action instanceof CutAction)) return;
    const next: Record<Form, [string, Form] | null> = { fb1: ['fb_clad', 'fb2'], fb2: ['fb_complete', 'fb3'], fb3: ['fb_restore', 'shikai2'], shikai2: ['release', 'bankai3'], bankai3: null };
    const n = next[this.form];
    if (!n) {
      // the re-release: the shock wave shatters domes and fields round him
      if (this.cd.rerelease > 0 || !f.spendRei(30)) return;
      this.cd.rerelease = 12;
      this.reRelease();
      return;
    }
    if (!f.spendRei(this.form === 'shikai2' ? 40 : 20)) {
      if (f === g.player) g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.stopAction();
    f.act(new AscendAction(this, n[0], n[1]), true);
  }

  /** G: the guard · the berserk surge · the catch · the cloth's wrap · the rage aura */
  toggle(): void {
    const { f, g } = this;
    if (f.dead) return;
    if (this.form === 'fb1') this.special(new GuardAction(this), 0, 'guard', 3);
    else if (this.form === 'fb2') {
      if (this.surgeT > 0 || this.cd.surge > 0) return;
      this.surgeT = 8;
      this.cd.surge = 16;
      this.applyStats();
      f.aura.flare(2, 0.5);
      g.callout('', 'BERSERK', '#ff6e86');
      g.sfx.play('roar', f.center(), 0.6);
    } else if (this.form === 'fb3') this.special(new CatchAction(this, false), 0, 'catch', 3);
    else if (this.form === 'shikai2') {
      if (this.cd.wrap > 0 || !f.spendRei(20)) return;
      this.cd.wrap = 15;
      this.wrapT = 5;
      g.sfx.play('heal', f.center(), 0.6);
      g.callout('', 'THE CLOTH WRAPS THE WOUNDS', '#f3eee6');
    } else {
      if (this.cd.rage > 0 && !this.rage) return;
      this.rage = !this.rage;
      if (!this.rage) this.cd.rage = 3;
      this.applyStats();
      if (this.rage) {
        f.aura.flare(2, 0.5);
        g.sfx.play('roarBig', f.center(), 0.5);
      }
    }
  }

  toggleFlare(): void {
    this.flare = !this.flare;
    this.applyStats();
    if (this.flare) {
      this.f.aura.flare(1.6, 0.4);
      this.g.sfx.play('flare', this.f.center());
    }
  }

  target(): Fighter | null {
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
    if (cost > 0 && !f.spendRei(cost)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return false;
    }
    this.cd[cdKey] = cd;
    f.act(a, true);
    return true;
  }

  // -------------------------------------------------------------------------------------------- effects

  /** A sphere blow ahead. */
  strike(s: Strike, hits: Set<number>): void {
    const { f, g } = this;
    const fw = f.forward(_w).clone();
    const c = f.pos.clone().addScaledVector(fw, s.reach);
    c.y += s.height;
    const mult = this.surgeT > 0 ? 1.5 : 1;
    for (const o of g.enemiesOf(f)) {
      if (hits.has(o.id)) continue;
      const cy = Math.max(o.pos.y + 0.15, Math.min(o.pos.y + o.def.height - 0.15, c.y));
      if (Math.hypot(o.pos.x - c.x, cy - c.y, o.pos.z - c.z) > s.radius + o.def.radius) continue;
      hits.add(o.id);
      const dir = _v.subVectors(o.pos, f.pos).setY(0);
      if (dir.lengthSq() < 1e-4) dir.copy(fw);
      dir.normalize();
      g.damage(o, s.damage * mult, f, dir.clone(), { knock: s.knock, launch: s.launch, heavy: s.heavy, hitstop: s.heavy ? 0.1 : 0.05, shake: s.heavy ? 0.3 : 0.12 });
      g.sparks(new THREE.Vector3(o.pos.x, cy, o.pos.z), dir, FB_CRIMSON, 8);
    }
  }

  /** The manji: as many blades as the run of shots allows; the charged one always has six and is bigger. */
  fireManji(charged: boolean): void {
    const { f, g } = this;
    const now = g.time;
    if (now - this.lastShot > 1.4) this.chainShots = 0;
    this.lastShot = now;
    const blades = charged ? 6 : Math.max(1, 6 - this.chainShots);
    if (!charged) this.chainShots++;
    const k = this.form === 'fb2' ? 1.4 : 1;
    const dir = aimAt(f, g, _v).sub(f.center()).normalize().clone();
    const origin = sock(f, 'grip.R', _w).clone().addScaledVector(dir, 0.6);
    g.addProjectile(new ManjiBlast(g, f, origin, dir, { blades, damage: (charged ? 22 : 12) * blades * k / 3, speed: charged ? 30 : 38, range: charged ? 50 : 36, scale: charged ? 3.2 : 2.2 }));
    g.sfx.play(charged ? 'getsugaBlack' : 'getsuga', origin, charged ? 1 : 0.6);
    f.push.addScaledVector(dir, charged ? -4 : -1.5);
    if (f === g.player && !charged) g.hud?.showBanner(`Manji — ${blades} blade${blades > 1 ? 's' : ''}`);
    // three in a row: wide open
    if (!charged && this.chainShots >= 3) {
      this.chainShots = 0;
      f.hitstun = Math.max(f.hitstun, 1);
      if (f === g.player) g.hud?.showBanner('Spent — wide open');
    }
  }

  glowBlade(a: number): void {
    const s = this.f.visual.props.get('sword');
    if (!s) return;
    const c = new THREE.Color(this.f.def.aura.body);
    s.material.userData.uniforms.uEnergy.value.set(c.r, c.g, c.b, a * 0.8);
  }

  auraBody(): THREE.ColorRepresentation {
    return this.f.def.aura.body;
  }

  /** An energy blast crushed in the hand. */
  crushFx(p: THREE.Vector3): void {
    const g = this.g;
    for (let i = 0; i < 12; i++) g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5) * 6, vy: Math.random() * 4, vz: (Math.random() - 0.5) * 6, size: 0.12, sizeEnd: 0.02, life: 0.3, r: 0.6, g: 0.75, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2 });
    g.sfx.play('hit', p, 0.9);
    g.callout('', 'CRUSHED', '#cfe2ff');
  }

  /** Rukia's sword through him from behind: a blade of light out of his chest. */
  stabFx(): void {
    const { f, g } = this;
    const c = f.center();
    const fw = f.forward(_v);
    for (let i = 0; i < 16; i++) {
      const p = c.clone().addScaledVector(fw, -0.8 + i * 0.12);
      g.engine.glow.spawn({ x: p.x, y: p.y + 0.2, z: p.z, size: 0.18, sizeEnd: 0.05, life: 0.6, r: 0.85, g: 0.95, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    }
    g.sfx.play('hitHeavy', c, 0.8);
    g.callout('', 'THE GOTEI’S REIATSU', '#e9f6ff');
  }

  /** Bankai v3's re-release: a shock wave that shatters every dome and field round him. */
  private reRelease(): void {
    const { f, g } = this;
    const n = g.rejectNear(f.center(), 30, f, true);
    f.aura.pillarBurst(2.4);
    g.addRing(f.pos.clone().setY(f.pos.y + 0.05), 20, AURA_V3.body, 0.6);
    g.sfx.play('bankai', f.center(), 1);
    g.shake(f === g.player ? 0.8 : 0.3);
    g.callout('卍解', n > 0 ? 'THE BARRIER SHATTERS' : 'BANKAI', '#cfe2ff');
    for (const o of g.enemiesOf(f)) {
      const d = o.pos.distanceTo(f.pos);
      if (d < 12) g.damage(o, 40 * (1 - d / 12), f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 22 * (1 - d / 12), launch: 6, heavy: true });
    }
  }

  // -------------------------------------------------------------------------------------------- forms

  ascend(to: Form): void {
    const { f, g } = this;
    this.setForm(to);
    const c = f.center();
    f.aura.pillarBurst(to === 'bankai3' ? 3 : 2.2);
    g.addRing(f.pos.clone().setY(f.pos.y + 0.05), to === 'bankai3' ? 16 : 11, f.def.aura.body, 0.5);
    g.sfx.play(to === 'bankai3' || to === 'shikai2' ? 'bankai' : 'mask', c, 1);
    g.shake(f === g.player ? 0.7 : 0.25);
    g.hitstop(0.1);
    g.slowMo(0.4, 0.35);
    const callouts: Record<Form, [string, string, string]> = {
      fb1: ['', '', ''],
      fb2: ['完現術', 'FULLBRING', '#ff8a9a'],
      fb3: ['完現術', 'FULLBRING — COMPLETE', '#ff8a9a'],
      shikai2: ['斬月', 'ZANGETSU', '#ffe27a'],
      bankai3: ['天鎖斬月', 'TENSA ZANGETSU', '#cfe2ff'],
    };
    g.callout(...callouts[to]);
    // the completion's explosion; the restoration's flood of reiatsu; the Bankai's release shattering what encloses him
    const blast = to === 'fb3' ? 40 : to === 'bankai3' ? 50 : 25;
    for (const o of g.enemiesOf(f)) {
      const d = o.pos.distanceTo(f.pos);
      if (d < 12) g.damage(o, blast * (1 - d / 12), f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 20 * (1 - d / 12), launch: 5, heavy: true });
    }
    if (to === 'shikai2') f.rei = f.maxRei;
    if (to === 'bankai3') g.rejectNear(c, 20, f, true);
  }

  private setForm(form: Form): void {
    const f = this.f;
    this.form = form;
    this.combo = 0;
    this.surgeT = 0;
    this.catching = null;
    this.guarding = false;
    this.inner = null;
    const props: { key: string; model: ReturnType<typeof fbGuard>; socket: string }[] = [];
    let asset = humanAsset('casual');
    let stance = FB1_STANCE, clips = FB1_CLIPS, blade = BLADE_ARM, aura = AURA_FB;
    if (form === 'fb1') props.push({ key: 'guard', model: fbGuard(), socket: 'grip.R' });
    else if (form === 'fb2') {
      asset = fullbringAsset('fb2');
      stance = FB2_STANCE;
      clips = FB2_CLIPS;
      props.push({ key: 'blade', model: fbArmBlade(), socket: 'forearm.R' });
    } else if (form === 'fb3') {
      asset = fullbringAsset('fb3');
      stance = FB3_STANCE;
      clips = FB3_CLIPS;
      blade = BLADE_MACHETE;
      props.push({ key: 'sword', model: fbMachete(), socket: 'grip.R' }, { key: 'sheath', model: fbSheath(), socket: 'back' });
    } else if (form === 'shikai2') {
      asset = fullbringAsset('shikai2');
      stance = ICHIGO_STANCE;
      clips = ICHIGO_CLIPS;
      blade = BLADE_V2;
      aura = AURA_RESTORED;
      props.push({ key: 'sword', model: zangetsuV2(), socket: 'grip.R' });
    } else {
      asset = fullbringAsset('bankai3');
      stance = ICHIGO_STANCE;
      clips = [...ICHIGO_CLIPS, ...DANGAI_CLIPS.filter((c) => c.name === 'dg_catch' || c.name === 'dg_caught')];
      blade = BLADE_V3;
      aura = this.rage ? AURA_RAGE : AURA_V3;
      props.push({ key: 'sword', model: tensaV3(), socket: 'grip.R' });
    }
    f.def = { ...f.def, stance, clips, blade };
    f.anim.stopAll(0.05);
    f.setForm({ asset, props }, aura, blade);
    const sh = f.visual.props.get('sheath');
    if (sh) {
      sh.position.set(...FB_SHEATH_ON_BACK.pos);
      sh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...FB_SHEATH_ON_BACK.dir).normalize());
    }
    const rig = f.visual.rig;
    rig.setBoneVisible('fist.R', true);
    rig.setBoneVisible('palm.R', false);
    rig.setBoneVisible('fist.L', form !== 'shikai2');
    rig.setBoneVisible('palm.L', form === 'shikai2');
    if (form === 'shikai2') {
      // the restored Shikai: the Hueco Mundo kit's, its Getsuga far bigger; F and G stay this kit's
      this.inner = new IchigoKit(f, this.g, { era: 'lostagent', getsugaScale: 1.6 });
      f.parry = (amount, from, o) => this.parry(amount, from, o);
    }
    this.applyStats();
  }

  // -------------------------------------------------------------------------------------------- damage hooks

  private parry(amount: number, from: Fighter | null, o: { energy?: boolean; quiet?: boolean }): boolean {
    const { f, g } = this;
    // FB1: the braced guard takes a big blow whole
    if (this.guarding && amount >= 12 && !o.quiet) {
      this.guarding = false;
      const p = sock(f, 'grip.R', _v);
      g.sparks(p, f.forward(_w), FB_CRIMSON, 14);
      g.sfx.play('ting', p, 1);
      if (from && !from.dead) from.hitstun = Math.max(from.hitstun, 0.35);
      return true;
    }
    // FB3: a blow caught one-handed, then the counter
    if (this.catching === 'blow' && from && !o.energy) {
      this.catching = null;
      from.stopAction();
      from.hitstun = Math.max(from.hitstun, 0.8);
      g.callout('', 'CAUGHT', '#ff8a9a');
      g.sfx.play('ting', f.center(), 1);
      f.stopAction();
      f.act(new CounterAction(this, from), true);
      return true;
    }
    // Bankai v3: an energy blast caught and crushed
    if (this.catching === 'energy' && o.energy) {
      this.crushFx(sock(f, 'palm.L', _v).clone());
      return true;
    }
    return false;
  }

  /** the berserk surge and the rage aura add their bite to a blade */
  rageSpec(s: BladeSpec): BladeSpec {
    return this.surgeT > 0 ? { ...s, damage: s.damage * 1.5 } : s;
  }

  // -------------------------------------------------------------------------------------------- look & stats

  private applyStats(): void {
    const f = this.f;
    f.def = { ...f.def, speed: { ...SPEED[this.form] } };
    f.damageTaken = TAKEN[this.form] * (this.surgeT > 0 ? 1.15 : 1) * (this.rage ? 1.1 : 1);
    f.power = POWER[this.form] * (this.flare ? 1.2 : 1) * (this.rage ? 1.35 : 1);
    f.aura.target = this.flare ? 1 : this.rage || this.surgeT > 0 ? 0.7 : this.form === 'fb1' ? 0.15 : 0.35;
    if (this.form === 'bankai3') {
      const st = this.rage ? AURA_RAGE : AURA_V3;
      f.aura.setStyle(st);
      f.def = { ...f.def, aura: st };
    }
    f.ghosts.enabled = this.form !== 'fb1';
    f.ghosts.color.set(this.fbForm() ? BRINGER_GREEN : f.def.aura.body);
    if (this.g.hud && f === this.g.player) this.g.hud.form = this.formName();
  }

  formName(): string {
    if (this.form === 'fb1') return 'Fullbring — the badge';
    if (this.form === 'fb2') return 'Fullbring — clad' + (this.surgeT > 0 ? ' · berserk' : '');
    if (this.form === 'fb3') return 'Fullbring — complete';
    if (this.form === 'shikai2') return 'Shikai — Zangetsu (restored)';
    return 'Bankai — Tensa Zangetsu' + (this.rage ? ' · rage' : '');
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    const common = [
      { key: 'Shift', name: this.fbForm() ? 'Bringer Light' : 'Shunpo', kanji: this.fbForm() ? '完現光' : '瞬歩', cost: 4 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
    ];
    if (this.form === 'fb1' || this.form === 'fb2') return [
      { key: 'LMB', name: this.form === 'fb1' ? 'Karate & guard' : 'Arm blade & kicks', kanji: '拳' },
      { key: 'RMB', name: this.form === 'fb1' ? 'Guard ram' : 'Berserk sweep', kanji: '突', cd: this.form === 'fb1' ? cd.ram : cd.sweep, cdMax: 2 },
      { key: 'Q', name: `Manji blast (${Math.max(1, 6 - (this.g.time - this.lastShot > 1.4 ? 0 : this.chainShots))})`, kanji: '卍', cost: 6, cd: cd.blast, cdMax: 0.5 },
      { key: 'E', name: 'Six-bar manji', kanji: '卍', cost: 14, cd: cd.charged, cdMax: 3 },
      { key: 'R', name: 'Focused leg', kanji: '脚', cost: 8, cd: cd.leg, cdMax: 2.5 },
      { key: 'F', name: this.form === 'fb1' ? 'Clad' : 'Complete', kanji: '完現術', cost: 20, tint: '#ff8a9a' },
      this.form === 'fb1'
        ? { key: 'G', name: 'Manji guard', kanji: '盾', cd: cd.guard, cdMax: 3, active: this.guarding }
        : { key: 'G', name: this.surgeT > 0 ? `Berserk ${Math.ceil(this.surgeT)}s` : 'Berserk surge', kanji: '狂', cd: this.surgeT > 0 ? 0 : cd.surge, cdMax: 16, active: this.surgeT > 0, timer: this.surgeT / 8, tint: '#ff6e86' },
      ...common,
    ];
    if (this.form === 'fb3') return [
      { key: 'LMB', name: 'Machete & kicks', kanji: '斬' },
      { key: 'RMB', name: 'Energy-held swing', kanji: '断', cost: 12, cd: cd.held, cdMax: 2.4 },
      { key: 'Q', name: 'Manji barrage', kanji: '卍', cost: 16, cd: cd.barrage, cdMax: 3 },
      { key: 'E', name: 'Fullbring Getsuga', kanji: '月牙', cost: 12, cd: cd.fgetsuga, cdMax: 1.6 },
      { key: 'R', name: 'First-strike cut', kanji: '先', cost: 18, cd: cd.first, cdMax: 6 },
      { key: 'F', name: 'Restore (Rukia)', kanji: '死神', cost: 20, tint: '#ffe27a' },
      { key: 'G', name: 'The catch', kanji: '受', cd: cd.catch, cdMax: 3, active: this.catching === 'blow' },
      ...common,
    ];
    if (this.form === 'shikai2' && this.inner) return [
      ...this.inner.abilities().filter((a) => a.key !== 'F' && a.key !== 'G'),
      { key: 'F', name: 'Bankai', kanji: '卍解', cost: 40, tint: '#cfe2ff' },
      { key: 'G', name: this.wrapT > 0 ? 'Wrapped' : 'Cloth wrap', kanji: '包', cost: 20, cd: cd.wrap, cdMax: 15, active: this.wrapT > 0 },
    ];
    return [
      { key: 'LMB', name: 'Tensa Zangetsu', kanji: '斬' },
      { key: 'RMB', name: 'Shockwave swing', kanji: '断', cost: 16, cd: cd.shock, cdMax: 2.6 },
      { key: 'Q', name: 'Getsuga', kanji: '月牙', cost: 20, cd: cd.v3getsuga, cdMax: 1.8, tint: '#9fc2ff' },
      { key: 'E', name: 'Catch & crush', kanji: '握', cost: 10, cd: cd.v3catch, cdMax: 2.5, active: this.catching === 'energy' },
      { key: 'R', name: 'Sword-breaker', kanji: '破', cost: 20, cd: cd.breaker, cdMax: 8 },
      { key: 'F', name: 'Re-release', kanji: '卍解', cost: 30, cd: cd.rerelease, cdMax: 12, tint: '#cfe2ff' },
      { key: 'G', name: this.rage ? 'Rage (on)' : 'Rage aura', kanji: '怒', active: this.rage, cd: cd.rage, cdMax: 3, tint: '#ff3b3b' },
      ...common,
    ];
  }

  ai(): KitAI {
    const fb12 = () => this.form === 'fb1' || this.form === 'fb2', fb3 = () => this.form === 'fb3', s2 = () => this.form === 'shikai2', b3 = () => this.form === 'bankai3';
    const shotComing = () => this.g.projectiles.some((p) => {
      const o = (p as { owner?: Fighter }).owner;
      return o !== undefined && o !== this.f && o.team !== this.f.team;
    });
    const foeSwinging = () => {
      const t = this.target();
      return t !== null && t.action !== null && t.pos.distanceTo(this.f.pos) < 4 && t.action.t < 0.25;
    };
    return {
      reach: this.form === 'bankai3' ? 2.8 : this.form === 'fb1' ? 1.4 : 2.2,
      chain: 4,
      releaseAt: [0.85, 0.65, 0.45, 0.3],
      moves: [
        { name: 'blast', use: () => this.skill1(), min: 4, max: 30, weight: 2, cd: 1.2, when: () => fb12() && this.chainShots < 2 },
        { name: 'six', use: () => this.skill2(), min: 6, max: 40, weight: 1.2, cd: 4, when: fb12 },
        { name: 'leg', use: () => this.skill3(), min: 0, max: 3, weight: 1.2, cd: 3, when: fb12 },
        { name: 'ram', use: () => this.heavy(), min: 0, max: 4, weight: 1, cd: 3, when: () => this.form === 'fb1' },
        { name: 'guard', use: () => this.toggle(), min: 0, max: 4, weight: 2, cd: 4, when: () => this.form === 'fb1' && foeSwinging() },
        { name: 'sweep', use: () => this.heavy(), min: 0, max: 3, weight: 1.2, cd: 3, when: () => this.form === 'fb2' },
        { name: 'surge', use: () => this.toggle(), min: 0, max: 8, weight: 0.8, cd: 16, when: () => this.form === 'fb2' && this.f.hp > this.f.maxHp * 0.3 },
        { name: 'barrage', use: () => this.skill1(), min: 5, max: 30, weight: 1.6, cd: 3.5, when: fb3 },
        { name: 'fgetsuga', use: () => this.skill2(), min: 6, max: 50, weight: 1.8, cd: 2, when: fb3 },
        { name: 'first', use: () => this.skill3(), min: 3, max: 14, weight: 1.3, cd: 7, when: fb3 },
        { name: 'held', use: () => this.heavy(), min: 0, max: 6, weight: 1, cd: 3, when: fb3 },
        { name: 'catch', use: () => this.toggle(), min: 0, max: 4, weight: 2, cd: 4, when: () => fb3() && foeSwinging() },
        { name: 'getsuga2', use: () => this.skill1(), min: 6, max: 60, weight: 2.4, cd: 2.4, when: s2 },
        { name: 'plow2', use: () => this.skill2(), min: 4, max: 26, weight: 1.2, cd: 5, when: s2 },
        { name: 'darts2', use: () => this.skill3(), min: 6, max: 20, weight: 1, cd: 6, when: s2 },
        { name: 'wrap', use: () => this.toggle(), min: 8, max: 99, weight: 1, cd: 15, when: () => s2() && this.f.hp < this.f.maxHp * 0.6 },
        { name: 'v3getsuga', use: () => this.skill1(), min: 6, max: 70, weight: 2.2, cd: 2.2, when: b3 },
        { name: 'shock', use: () => this.heavy(), min: 0, max: 8, weight: 1.3, cd: 3, when: b3 },
        { name: 'v3catch', use: () => this.skill2(), min: 6, max: 60, weight: 2, cd: 3, when: () => b3() && shotComing() },
        { name: 'breaker', use: () => this.skill3(), min: 0, max: 4, weight: 1.2, cd: 9, when: b3 },
        { name: 'rage', use: () => this.toggle(), min: 0, max: 30, weight: 0.8, cd: 20, when: () => b3() && !this.rage && this.f.hp < this.f.maxHp * 0.25 },
      ],
    };
  }
}
