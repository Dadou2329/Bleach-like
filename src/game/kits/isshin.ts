// Isshin Kurosaki's kit (docs/roster/A1-ichigo.md §3). Three steps on F. The doctor, in his gigai, fights like he
// wakes his son up: palm, elbow, knee and the "Isshin Flying Double Knee" (LMB; Q leaps it in from range), the
// Super Stubble Headbutt that launches (RMB), the Demon Forehead Flick that sends a man through walls (E), field
// medicine (R) and a charm that throws up a barrier the next time he is hit (G). F: out of the gigai, the
// Shinigami — a master's kendō (men, kote, dō, tsuki; every cut breaks concrete), Agitowari, the one vertical cut
// from the jaw down (RMB), his Getsuga, short and heavy, leaving a crater (Q), the flick (E), the headbutt (R)
// and Kaikyō Kotei, four corded rods round him that hold whoever stands inside (G). F again: "Moero, Engetsu" —
// the blade and the tassel catch fire, every cut burns, the Getsuga turns to fire, and R is the blood-flame blast,
// a pillar of fire paid for in his own blood. His Bankai was never revealed: F in Shikai only says so.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { Game } from '../game';
import { ENGETSU_BASE_Z, ENGETSU_TASSEL, ENGETSU_TIP_Z, isshinAsset, isshinProp } from '../../chars/isshin';
import { ISSHIN_CHAIN, ISSHIN_CLIPS, ISSHIN_DOCTOR_CHAIN, ISSHIN_DOCTOR_CLIPS, ISSHIN_DOCTOR_STANCE, ISSHIN_STANCE } from '../../chars/isshinClips';
import type { AuraStyle } from '../../vfx/aura';
import { GetsugaProjectile } from '../projectiles/getsuga';
import { FireWave, FlamePool, burnAt } from '../../vfx/fire';
import { ENGETSU_FIRE, FlamePillarShot, GETSUGA_ISSHIN, KoteiField, Plow, bladeFlames, tasselFlames } from '../../vfx/engetsu';
import { BoxShape, SphereShape } from '../../destruction/shapes';
import { TEX_GLOW, TEX_STREAK } from '../../vfx/sprites';
import type { AbilityInfo } from '../../ui/hud';
import type { Kit, KitAI } from './kit';
import { aimPoint } from './vasto';

type BladeDef = NonNullable<FighterDef['blade']>;
type Form = 'doctor' | 'shinigami' | 'shikai';

/** golden-orange reiatsu (dossier); Shikai: fire */
const AURA_ISSHIN: AuraStyle = { core: '#FFF4D2', body: '#F1D47B', rim: '#CE9C4A' };
const AURA_ENGETSU: AuraStyle = { core: '#FFFBE0', body: '#F7A23A', rim: '#C35718' };
const BLADE: BladeDef = { prop: 'sword', base: [0, 0, ENGETSU_BASE_Z], tip: [0, 0, ENGETSU_TIP_Z], color: '#9FD8FF', core: '#F4FBFF' };
const BLADE_FIRE: BladeDef = { ...BLADE, color: '#F7A23A', core: '#FFFBE0' };
const FORM_SPEED: Record<Form, FighterDef['speed']> = {
  doctor: { run: 8.5, sprint: 17, jump: 11, dash: 9, dashTime: 0.12 },
  shinigami: { run: 11, sprint: 24, jump: 12, dash: 14, dashTime: 0.11 },
  shikai: { run: 11.5, sprint: 25, jump: 12.5, dash: 15, dashTime: 0.11 },
};
/** the blood-flame blast costs this fraction of his life */
const BLOOD_COST = 0.06;

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

export const ISSHIN_DEF: FighterDef = {
  id: 'isshin',
  name: 'Isshin Kurosaki',
  title: 'Former Captain, 10th Division',
  build: () => ({ asset: isshinAsset('doctor'), props: [] }),
  stance: ISSHIN_DOCTOR_STANCE,
  clips: ISSHIN_DOCTOR_CLIPS,
  aura: AURA_ISSHIN,
  blade: BLADE,
  hp: 1050,
  rei: 160,
  speed: { ...FORM_SPEED.doctor },
  radius: 0.42,
  height: 1.86,
};

// ------------------------------------------------------------------ the doctor's hands and feet

interface Strike {
  damage: number;
  knock: number;
  launch?: number;
  heavy?: boolean;
  /** how far in front the blow lands (m) and how high */
  reach: number;
  y: number;
  r: number;
  /** stretch the step toward a target this far off */
  lunge: number;
  callout?: [string, string];
}

const STRIKES: Record<string, Strike> = {
  is_palm: { damage: 14, knock: 7, reach: 1.1, y: 1.45, r: 0.75, lunge: 5 },
  is_elbow: { damage: 15, knock: 6, reach: 0.9, y: 1.5, r: 0.8, lunge: 5 },
  is_knee: { damage: 18, knock: 4, launch: 5, reach: 0.8, y: 1.05, r: 0.8, lunge: 5 },
  is_dknee: { damage: 32, knock: 15, launch: 4, heavy: true, reach: 1.0, y: 1.3, r: 0.95, lunge: 8, callout: ['', 'ISSHIN FLYING DOUBLE KNEE!'] },
  is_d_headbutt: { damage: 30, knock: 14, launch: 14, heavy: true, reach: 0.9, y: 1.65, r: 0.8, lunge: 7, callout: ['超ヒゲ頭突き', 'CHŌHIGEZUTSUKI'] },
  is_headbutt: { damage: 34, knock: 14, launch: 15, heavy: true, reach: 0.9, y: 1.65, r: 0.8, lunge: 8, callout: ['超ヒゲ頭突き', 'CHŌHIGEZUTSUKI'] },
};

/** One unarmed blow (the doctor's string, the headbutt): a hit in front of him at the 'hit' event. */
class StrikeAction extends FighterAction {
  readonly name: string;
  private info: Strike;
  private dur = 0;
  private comboAt = 0;
  private hitAt = 0;
  private struck = false;
  queued = false;
  constructor(readonly kit: IsshinKit, readonly clip: string, readonly index: number) {
    super();
    this.name = clip;
    this.info = STRIKES[clip];
    this.mobility = 0.12;
    this.airGravity = clip === 'is_dknee' ? 0.6 : 0.15;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    this.hitAt = c.events.hit ?? this.dur * 0.3;
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n !== 'step') return;
        const tgt = f.faceTarget;
        const d = tgt ? Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z) : 0;
        const per = (1 - Math.exp(-f.pushDrag * Math.max(0.05, this.hitAt - (c.events.step ?? 0)))) / f.pushDrag;
        const want = tgt ? Math.max(0, d - (this.info.reach + 0.5)) / per : this.info.lunge;
        f.push.addScaledVector(f.forward(), Math.min(this.info.lunge * 3, Math.max(this.info.lunge * 0.4, want)));
        if (this.clip === 'is_dknee' && f.grounded) f.push.y = 7.5;
        g.sfx.play(this.info.heavy ? 'swingHeavy' : 'swing', f.center(), 0.8);
        if (this.info.callout) g.callout(this.info.callout[0], this.info.callout[1], '#F1D47B');
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.struck && this.t >= this.hitAt) {
      this.struck = true;
      this.kit.strike(this.info);
    }
    if (this.queued && this.t >= this.comboAt) {
      this.done = true;
      this.kit.chain(this.index + 1);
      return;
    }
    if (this.t >= this.dur) this.done = true;
  }
  override canCancel(next: FighterAction): boolean {
    return (next.name === 'dash' || next instanceof FlickAction || next instanceof HeadbuttAction) && this.t >= this.hitAt + 0.04;
  }
}

/** RMB (doctor) / R (Shinigami): Chōhigezutsuki — the Super Stubble Headbutt; it launches. */
class HeadbuttAction extends StrikeAction {
  constructor(kit: IsshinKit, doctor: boolean) {
    super(kit, doctor ? 'is_d_headbutt' : 'is_headbutt', -1);
    this.armor = 0.4;
  }
}

/** Q (doctor): the Flying Double Knee from range — a leap that comes down knees-first on the target. */
class KneeLeapAction extends FighterAction {
  readonly name = 'kneeleap';
  private struck = false;
  constructor(readonly kit: IsshinKit, readonly target: Fighter | null) {
    super();
    this.mobility = 0;
    this.airGravity = 1;
    this.armor = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('is_dknee', { speed: 0.85 });
    // his good-morning greeting to his son
    const son = this.target && (this.target.def.id === 'ichigo' || this.target.def.id === 'hollowichigo');
    g.callout(son ? 'おはよう' : '', son ? 'OHAYŌ, ICHIGO!' : 'ISSHIN FLYING DOUBLE KNEE!', '#F1D47B');
    g.sfx.play('swingHeavy', f.center(), 1);
    // a ballistic leap that lands on him at the strike
    const T = 0.34 / 0.85;
    const o = this.target;
    const to = o ? o.pos.clone() : f.pos.clone().addScaledVector(f.forward(), 8);
    _v.subVectors(to, f.pos).setY(0);
    const d = _v.length();
    const reach = Math.max(0, d - 0.9);
    if (d > 1e-3) _v.multiplyScalar(reach / d);
    // he comes down feet just above the target's: the knees land on its chest
    const vy = (to.y + 0.3 - f.pos.y) / T + 0.5 * 30 * T;
    this.vx = _v.x / T;
    this.vz = _v.z / T;
    f.body.vel.set(this.vx, Math.min(18, vy), this.vz);
    f.push.set(0, 0, 0);
  }
  private vx = 0;
  private vz = 0;
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    // the leap holds its line (the body would otherwise brake to his zero mobility) until the knees land
    if (!this.struck) {
      f.body.vel.x = this.vx;
      f.body.vel.z = this.vz;
    }
    if (!this.struck && this.t >= 0.34 / 0.85) {
      this.struck = true;
      this.kit.strike({ ...STRIKES.is_dknee, damage: 42, knock: 18 });
      f.body.vel.x *= 0.2;
      f.body.vel.z *= 0.2;
    }
    if (this.t >= 0.95) this.done = true;
  }
}

/** E: Oni Dekopin — one flick of a finger, and the target goes through the wall behind it. */
class FlickAction extends FighterAction {
  readonly name = 'flick';
  private dur = 0.7;
  private flicked = false;
  constructor(readonly kit: IsshinKit) {
    super();
    this.mobility = 0.1;
    this.armor = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    const clip = this.kit.form === 'doctor' ? 'is_d_flick' : 'is_flick';
    const c = f.anim.clip(clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.kit.leftHand(true);
    f.anim.play(clip, {
      onEvent: (n) => {
        if (n === 'step') {
          const tgt = f.faceTarget;
          if (tgt) {
            const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
            if (d > 1.8 && d < 8) f.push.addScaledVector(f.forward(), Math.min(20, (d - 1.4) * 5));
          }
        }
        if (n === 'flick' && !this.flicked) {
          this.flicked = true;
          this.kit.flick();
        }
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= this.dur) this.done = true;
  }
  override end(): void {
    this.kit.leftHand(false);
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.flicked;
  }
}

/** R (doctor): field medicine — down on one knee, hands over the wound; interrupted by any blow. */
class HealAction extends FighterAction {
  readonly name = 'heal';
  private healed = 0;
  constructor(readonly kit: IsshinKit) {
    super();
    this.mobility = 0;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('is_heal', {});
    g.sfx.play('heal', f.center(), 0.8);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t > 0.3 && this.t < 1.5 && this.healed < 160) {
      const k = Math.min(160 - this.healed, 135 * dt);
      this.healed += k;
      f.hp = Math.min(f.maxHp, f.hp + k);
      if (Math.random() < 0.6) {
        const c = f.center();
        g.engine.glow.spawn({ x: c.x + (Math.random() - 0.5) * 0.5, y: c.y - 0.3 + Math.random() * 0.4, z: c.z + (Math.random() - 0.5) * 0.5, vx: 0, vy: 0.6, vz: 0, size: 0.1, sizeEnd: 0.03, life: 0.6, r: 0.55, g: 1, b: 0.62, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
      }
    }
    if (this.t >= 1.65) this.done = true;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash';
  }
}

/** G (doctor): a charm — the next real blow on him bursts into a barrier instead. */
class CharmAction extends FighterAction {
  readonly name = 'charm';
  constructor(readonly kit: IsshinKit) {
    super();
    this.mobility = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('is_charm', { onEvent: (n) => n === 'charm' && this.kit.armCharm() });
    g.sfx.play('ting', f.center(), 0.8);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 0.6) this.done = true;
  }
  override canCancel(): boolean {
    return this.t > 0.3;
  }
}

// ------------------------------------------------------------------ Engetsu

interface CutInfo {
  window: [number, number];
  trail: [number, number];
  spec: BladeSpec;
  lunge: number;
  /** a crack in the ground at the tip ('fx' or the hit) */
  crack?: number;
}
const CUTS: Record<string, CutInfo> = {
  is_men: { window: [0.17, 0.27], trail: [0.14, 0.34], spec: { damage: 22, knock: 7, launch: 1, hitstop: 0.06, shake: 0.18, cut: 360 }, lunge: 7, crack: 1.1 },
  is_kote: { window: [0.09, 0.18], trail: [0.07, 0.24], spec: { damage: 17, knock: 5, launch: 0, hitstop: 0.05, shake: 0.12, cut: 300 }, lunge: 6 },
  is_do: { window: [0.11, 0.22], trail: [0.09, 0.3], spec: { damage: 20, knock: 8, launch: 2, hitstop: 0.05, shake: 0.14, cut: 320 }, lunge: 6 },
  is_tsuki: { window: [0.16, 0.26], trail: [0.14, 0.32], spec: { damage: 28, knock: 14, launch: 2, heavy: true, hitstop: 0.09, shake: 0.32, cut: 420 }, lunge: 9 },
  is_agito: { window: [0.45, 0.56], trail: [0.42, 0.62], spec: { damage: 64, knock: 6, launch: 2, heavy: true, hitstop: 0.16, shake: 0.7, cut: 950, thick: 0.1 }, lunge: 8, crack: 1.6 },
};

/** One kendō cut (the string, Agitowari). In Shikai every cut burns. */
class CutAction extends FighterAction {
  readonly name: string;
  private info: CutInfo;
  private dur = 0;
  private comboAt = 0;
  private stopAt = 0;
  private swished = false;
  private cracked = false;
  queued = false;
  constructor(readonly kit: IsshinKit, readonly clip: string, readonly index: number) {
    super();
    this.name = clip;
    this.info = CUTS[clip];
    this.mobility = 0.12;
    this.airGravity = 0.12;
    if (clip === 'is_agito') this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    f.bladeHits.clear();
    const fire = this.kit.form === 'shikai';
    f.bladeSpec = { ...this.info.spec, damage: this.info.spec.damage * (fire ? 1.15 : 1), onHit: fire ? (o) => this.kit.ignite(o) : undefined };
    const tgt = f.faceTarget;
    if (tgt) {
      const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
      this.stopAt = 1.25;
      if (d > this.stopAt + 0.25 && d < 9) {
        const per = (1 - Math.exp(-f.pushDrag * Math.max(0.06, this.info.window[0] - 0.05))) / f.pushDrag;
        f.push.addScaledVector(f.forward(), Math.min(28, (d - this.stopAt) / per));
      }
    }
    if (this.clip === 'is_agito') g.callout('顎割', 'AGITOWARI', fire ? '#F7A23A' : '#F1D47B');
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n === 'charge') f.aura.flare(1.3, 0.35);
        if (n === 'fx' && this.clip === 'is_agito') this.kit.split();
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    const tgt = f.faceTarget;
    if (this.stopAt > 0 && tgt && Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z) <= this.stopAt) {
      f.push.x = 0;
      f.push.z = 0;
      this.stopAt = 0;
    }
    if (!this.swished && t >= this.info.window[0] - 0.03) {
      this.swished = true;
      g.sfx.play(this.info.spec.heavy ? 'swingHeavy' : 'swing', f.center());
    }
    f.bladeActive = t >= this.info.window[0] && t <= this.info.window[1];
    if (f.trail) f.trail.emitting = t >= this.info.trail[0] && t <= this.info.trail[1];
    // every cut breaks concrete: the tip cracks the ground it comes down on
    if (this.info.crack && !this.cracked && t >= this.info.window[0] + 0.03) {
      this.cracked = true;
      const tip = f.blade.tip;
      const gy = groundBelow(g, tip);
      if (gy !== null && tip.y - gy < 1.0) g.groundImpact(new THREE.Vector3(tip.x, gy, tip.z), this.info.crack, 90, f.def.aura.body, f);
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
    if (next.name === 'dash' || next instanceof GetsugaAction || next instanceof FlickAction || next instanceof HeadbuttAction) return this.t >= this.info.window[0] + 0.06;
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

/** Q: Getsuga Tenshō, his way — short and heavy, the slam leaves a crater; in Shikai, a crescent of fire. */
class GetsugaAction extends FighterAction {
  readonly name = 'getsuga';
  private fired = false;
  constructor(readonly kit: IsshinKit) {
    super();
    this.mobility = 0.05;
    this.airGravity = 0.05;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    f.bladeSpec = { damage: 24, knock: 8, launch: 3, hitstop: 0.06, shake: 0.2, cut: 400 };
    const fire = this.kit.form === 'shikai';
    f.anim.play('is_getsuga', {
      onEvent: (n) => {
        if (n === 'charge') {
          f.aura.flare(1.5, 0.6);
          g.callout('月牙天衝', 'GETSUGA TENSHŌ', fire ? '#F7A23A' : '#9FD8FF');
          g.sfx.play('flare', f.center(), 0.6);
          this.kit.glowBlade(fire ? '#F7A23A' : '#9FD8FF', 0.9);
        }
        if (n === 'fx' && !this.fired) this.fire(f, g);
      },
    });
  }
  private fire(f: Fighter, g: Game): void {
    this.fired = true;
    const fire = this.kit.form === 'shikai';
    const dir = aimPoint(f, g, new THREE.Vector3()).sub(f.center());
    const flat = Math.hypot(dir.x, dir.z) || 1;
    dir.y = Math.max(-0.4, Math.min(0.4, dir.y / flat)) * flat;
    dir.normalize();
    // the slam: a crater where the blade comes down
    const at = f.pos.clone().addScaledVector(f.forward(), 2.2);
    const gy = groundBelow(g, at.setY(f.pos.y + 0.5));
    if (gy !== null) {
      at.y = gy;
      g.groundImpact(at.clone(), 3.4, 260, fire ? ENGETSU_FIRE.body : GETSUGA_ISSHIN.body, f);
      g.engine.destruction.carve(new SphereShape(at.clone(), 2.6, 0.5), { mode: 'explode', power: 420, impulse: 14, dust: 1 });
      if (fire) for (let i = 0; i < 4; i++) burnAt(g, at.clone().add(_w.set((Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 4)), 1.4, 1, 3);
    }
    const side = new THREE.Vector3(0, 1, 0);
    const origin = f.center().addScaledVector(dir, 1.3);
    if (fire) {
      g.addProjectile(new FireWave(g, f, origin, dir, side, false, ENGETSU_FIRE, { radius: 3.6, halfAngle: 1.2, speed: 46, range: 32, damage: 150, cut: 1000 }));
    } else {
      g.addProjectile(new GetsugaProjectile(g, f, origin, dir, side, { radius: 3.2, halfAngle: 1.2, speed: 44, range: 20, damage: 120, cut: 950, colors: GETSUGA_ISSHIN }));
    }
    g.shake(0.6);
    g.hitstop(0.08);
    g.sfx.play(fire ? 'explode' : 'getsuga', origin, 1.1);
    f.aura.flare(1.9, 0.4);
    g.engine.gr.chroma.offset.set(0.005, 0.005);
    if (f === g.player) g.cam.punchFov(6);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (f.trail) f.trail.emitting = this.t > 0.46 && this.t < 0.62;
    f.bladeActive = this.t > 0.48 && this.t < 0.58;
    if (this.t > 0.62) this.kit.glowBlade(null, Math.max(0, 1 - (this.t - 0.62) * 3));
    if (this.t >= 0.95) this.done = true;
  }
  override end(f: Fighter): void {
    this.kit.glowBlade(null, 0);
    f.bladeActive = false;
    if (f.trail) f.trail.emitting = false;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.fired && this.t > 0.65;
  }
}

/** G (Shinigami): Kaikyō Kotei — the corded rods thrown out round him; whoever is inside is held to a crawl. */
class KoteiAction extends FighterAction {
  readonly name = 'kotei';
  private planted = false;
  constructor(readonly kit: IsshinKit) {
    super();
    this.mobility = 0;
    this.armor = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    g.callout('界境固定', 'KAIKYŌ KOTEI', '#F1D47B');
    f.anim.play('is_kotei', {
      onEvent: (n) => {
        if ((n === 'throw1' || n === 'throw2') && !this.planted) {
          for (let i = 0; i < 2; i++) {
            const a = f.yaw + (n === 'throw1' ? 0.8 : -0.8) + (i - 0.5) * 1.4;
            g.engine.glow.spawn({ x: f.pos.x, y: f.pos.y + 1.2, z: f.pos.z, vx: Math.sin(a) * 14, vy: 3, vz: Math.cos(a) * 14, size: 0.12, sizeEnd: 0.05, life: 0.4, r: 0.85, g: 0.85, b: 0.9, alpha: 1, alphaEnd: 0.3, tex: TEX_STREAK, stretch: 3 });
          }
          g.sfx.play('swing', f.center(), 0.8);
        }
        if (n === 'hold' && !this.planted) {
          this.planted = true;
          g.addProjectile(new KoteiField(g, f, f.pos.clone(), f.yaw, 6.5, 7));
          f.aura.flare(1.4, 0.4);
        }
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 0.9) this.done = true;
  }
}

/** F (Shinigami): "Moero, Engetsu." The blade raised before his face, then swept down as it catches fire. */
class MoeroAction extends FighterAction {
  readonly name = 'moero';
  constructor(readonly kit: IsshinKit) {
    super();
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('release', {
      onEvent: (n) => {
        if (n === 'fx') {
          f.aura.flare(2, 1.2);
          g.callout('燃えろ', 'MOERO, ENGETSU', '#F7A23A');
          g.shake(0.4);
        }
        if (n === 'burst') {
          this.kit.toShikai();
          g.sfx.play('bankai', f.center(), 0.8);
          f.aura.pillarBurst(1.8);
          g.groundImpact(f.pos.clone(), 3, 120, ENGETSU_FIRE.body, f);
          for (let i = 0; i < 6; i++) burnAt(g, f.pos.clone().add(_w.set((Math.random() - 0.5) * 6, 0, (Math.random() - 0.5) * 6)), 1.3, 1, 2.2);
          g.shake(0.8);
          g.hitstop(0.1);
          g.engine.gr.chroma.offset.set(0.006, 0.006);
          for (const o of g.enemiesOf(f)) {
            const d = o.pos.distanceTo(f.pos);
            if (d < 10) g.damage(o, 26 * (1 - d / 10), f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 18 * (1 - d / 10), launch: 5, heavy: true, energy: true });
          }
        }
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 1.4) this.done = true;
  }
}

/** R (Shikai): the blood-flame blast — blood wiped along the blade, then a pillar of fire off the point. */
class BloodFlameAction extends FighterAction {
  readonly name = 'bloodflame';
  private fired = false;
  constructor(readonly kit: IsshinKit) {
    super();
    this.mobility = 0.05;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('is_blood', {
      onEvent: (n) => {
        if (n === 'wipe') {
          // his own blood on the steel
          f.hp = Math.max(1, f.hp - f.maxHp * BLOOD_COST);
          g.sfx.play('hit', f.center(), 0.6);
          if (f.bladeValid) {
            const b = f.blade.base, t = f.blade.tip;
            for (let i = 0; i < 16; i++) {
              const u = Math.random();
              g.engine.glow.spawn({ x: b.x + (t.x - b.x) * u, y: b.y + (t.y - b.y) * u, z: b.z + (t.z - b.z) * u, vx: (Math.random() - 0.5) * 0.4, vy: -0.5, vz: (Math.random() - 0.5) * 0.4, size: 0.05, sizeEnd: 0.03, life: 0.6, r: 0.7, g: 0.04, b: 0.06, alpha: 1, alphaEnd: 0.5, tex: TEX_GLOW, gravity: -6 });
            }
          }
        }
        if (n === 'fx' && !this.fired) {
          this.fired = true;
          const from = f.bladeValid ? f.blade.tip.clone() : f.center().addScaledVector(f.forward(), 1.2);
          const dir = aimPoint(f, g, new THREE.Vector3()).sub(from);
          const flat = Math.hypot(dir.x, dir.z) || 1;
          dir.y = Math.max(-0.3, Math.min(0.3, dir.y / flat)) * flat;
          g.addProjectile(new FlamePillarShot(g, f, from, dir, { speed: 40, range: 34, damage: 135, radius: 1.3 }));
          g.callout('', 'BLOOD-FLAME BLAST', '#F7A23A');
          g.sfx.play('getsuga', from, 1.2);
          g.shake(0.45);
          f.aura.flare(2, 0.5);
        }
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 1.05) this.done = true;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.fired && this.t > 0.8;
  }
}

/** F (doctor): out of the gigai — the Shinigami steps forward out of his human body. */
class StepOutAction extends FighterAction {
  readonly name = 'stepout';
  private out = false;
  constructor(readonly kit: IsshinKit) {
    super();
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('is_step', {
      onEvent: (n) => {
        if (n !== 'out' || this.out) return;
        this.out = true;
        f.ghosts.spawn(1, 0.6);
        this.kit.toShinigami();
        g.callout('', 'SHINIGAMI', '#F1D47B');
        g.sfx.play('flare', f.center(), 1);
        f.aura.flare(2, 0.8);
        g.addRing(f.pos.clone().setY(f.pos.y + 0.05), 8, AURA_ISSHIN.body, 0.5);
        g.shake(0.4);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 0.95) this.done = true;
  }
}

// ------------------------------------------------------------------ the kit

export class IsshinKit implements Kit {
  form: Form = 'doctor';
  comboIndex = 0;
  private lastSwingEnd = 0;
  getsugaCd = 0;
  flare = false;
  /** a charm on him: the next real blow bursts into a barrier */
  charm = false;
  private charmT = 0;
  readonly cd = { knee: 0, flick: 0, heal: 0, charm: 0, agito: 0, headbutt: 0, kotei: 0, blood: 0 };
  private tasselPrev = new THREE.Vector3();

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.parry = (amount, from, o) => this.charmBlock(amount, from, o.quiet === true);
    this.hands();
    this.applyLook();
    this.applyStats();
  }

  /** fists for the doctor; the sword hand closed and the left open for the Shinigami */
  private hands(): void {
    const rig = this.f.visual.rig;
    const doc = this.form === 'doctor';
    rig.setBoneVisible('fist.R', true);
    rig.setBoneVisible('palm.R', false);
    rig.setBoneVisible('fist.L', doc);
    rig.setBoneVisible('palm.L', !doc);
  }

  /** the open left hand for the flick (the doctor's fists are otherwise closed) */
  leftHand(open: boolean): void {
    if (this.form !== 'doctor') return;
    const rig = this.f.visual.rig;
    rig.setBoneVisible('fist.L', !open);
    rig.setBoneVisible('palm.L', open);
  }

  update(dt: number): void {
    const { f, g } = this;
    this.getsugaCd = Math.max(0, this.getsugaCd - dt);
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    if (this.charm) {
      this.charmT -= dt;
      if (this.charmT <= 0) this.charm = false;
      else if (Math.random() < 0.15) {
        const c = f.center();
        g.engine.glow.spawn({ x: c.x + (Math.random() - 0.5) * 0.8, y: c.y + (Math.random() - 0.5) * 1.2, z: c.z + (Math.random() - 0.5) * 0.8, size: 0.06, sizeEnd: 0.02, life: 0.5, r: 0.55, g: 0.83, b: 0.9, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
      }
    }
    // Engetsu burning: the blade and the tassel
    if (this.form === 'shikai' && !f.dead && f.bladeValid) {
      bladeFlames(g, f.blade.base, f.blade.tip, f.bladeActive ? 4 : 2, f.bladeActive ? 1.3 : 1);
      const s = f.visual.props.get('sword');
      if (s) {
        s.updateWorldMatrix(true, false);
        const p = _v.set(ENGETSU_TASSEL[0], ENGETSU_TASSEL[1], ENGETSU_TASSEL[2]).applyMatrix4(s.matrixWorld);
        const vel = _w.subVectors(p, this.tasselPrev).divideScalar(Math.max(1e-3, dt));
        if (vel.lengthSq() > 2500) vel.set(0, 0, 0);
        tasselFlames(g, p, vel);
        this.tasselPrev.copy(p);
      }
    }
  }

  // ---------------------------------------------------------------- inputs

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof CutAction || cur instanceof StrikeAction) {
      if (cur.index >= 0) cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastSwingEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const doc = this.form === 'doctor';
    const list = doc ? ISSHIN_DOCTOR_CHAIN : ISSHIN_CHAIN;
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    this.lastSwingEnd = this.g.time + 0.8;
    this.f.act(doc ? new StrikeAction(this, list[idx], idx) : new CutAction(this, list[idx], idx), true);
  }

  /** RMB: Chōhigezutsuki (doctor) / Agitowari */
  heavy(): void {
    const f = this.f;
    if (this.form === 'doctor') {
      this.special(new HeadbuttAction(this, true), 0, 'headbutt', 2.4);
      return;
    }
    if (f.busy && !(f.action instanceof CutAction)) return;
    if (f.action instanceof CutAction && f.action.t < 0.2) return;
    this.comboIndex = 0;
    this.special(new CutAction(this, 'is_agito', -1), 8, 'agito', 2.2);
  }

  /** Q: the Flying Double Knee (doctor) / Getsuga Tenshō */
  skill1(): void {
    const f = this.f;
    if (this.form === 'doctor') {
      this.special(new KneeLeapAction(this, this.near(16)), 6, 'knee', 3);
      return;
    }
    if (this.getsugaCd > 0) return;
    const a = new GetsugaAction(this);
    if (f.action && !f.action.canCancel(a)) return;
    if (f.hitstun > 0) return;
    if (!f.spendRei(this.form === 'shikai' ? 26 : 22)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    this.getsugaCd = 1.6;
    f.act(a, true);
  }

  /** E: Oni Dekopin */
  skill2(): void {
    this.special(new FlickAction(this), 8, 'flick', 3.2);
  }

  /** R: field medicine (doctor) / Chōhigezutsuki / the blood-flame blast */
  skill3(): void {
    if (this.form === 'doctor') this.special(new HealAction(this), 18, 'heal', 14);
    else if (this.form === 'shikai') {
      if (this.f.hp <= this.f.maxHp * (BLOOD_COST + 0.02)) {
        if (this.f === this.g.player) this.g.hud?.showBanner('Not enough blood left');
        return;
      }
      this.special(new BloodFlameAction(this), 20, 'blood', 6);
    } else this.special(new HeadbuttAction(this, false), 6, 'headbutt', 2.4);
  }

  /** G: the charm (doctor) / Kaikyō Kotei */
  toggle(): void {
    if (this.form === 'doctor') this.special(new CharmAction(this), 10, 'charm', 16);
    else this.special(new KoteiAction(this), 24, 'kotei', 16);
  }

  /** F: out of the gigai; then "Moero, Engetsu"; the Bankai stays locked */
  release(): void {
    const f = this.f;
    if (f.busy) return;
    if (this.form === 'shikai') {
      if (f === this.g.player) this.g.hud?.showBanner('Bankai — never revealed');
      return;
    }
    if (this.form === 'doctor') {
      f.act(new StepOutAction(this), true);
      return;
    }
    if (!f.spendRei(30)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(new MoeroAction(this), true);
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

  // ---------------------------------------------------------------- blows

  /** an unarmed blow in front of him */
  strike(s: Strike): void {
    const { f, g } = this;
    const fw = f.forward();
    const p = f.pos.clone().addScaledVector(fw, s.reach).setY(f.pos.y + s.y);
    let hit = false;
    for (const o of g.enemiesOf(f)) {
      const cy = Math.max(o.pos.y + 0.1, Math.min(o.pos.y + o.def.height - 0.2, p.y));
      if (Math.hypot(o.pos.x - p.x, cy - p.y, o.pos.z - p.z) > s.r + o.def.radius) continue;
      hit = true;
      g.damage(o, s.damage, f, fw.clone(), { knock: s.knock, launch: s.launch, heavy: s.heavy, hitstop: s.heavy ? 0.1 : 0.06, shake: s.heavy ? 0.35 : 0.15 });
      g.sparks(new THREE.Vector3(o.pos.x, cy, o.pos.z), fw, '#F1D47B', s.heavy ? 16 : 8);
    }
    if (s.heavy) g.engine.destruction.carve(new SphereShape(p.clone().addScaledVector(fw, 0.4), 0.9, 0.6), { mode: 'smash', power: 160, impulse: 8, dust: 0.4 });
    if (!hit && s.heavy) g.sfx.play('swingHeavy', p, 0.6);
  }

  /** Oni Dekopin: whoever is in front flies away and through whatever is behind them */
  flick(): void {
    const { f, g } = this;
    const fw = f.forward();
    const p = f.pos.clone().addScaledVector(fw, 1.2).setY(f.pos.y + 1.55);
    g.callout('鬼デコピン', 'ONI DEKOPIN', '#F1D47B');
    let hit = false;
    for (const o of g.enemiesOf(f)) {
      const cy = Math.max(o.pos.y + 0.1, Math.min(o.pos.y + o.def.height - 0.1, p.y));
      if (Math.hypot(o.pos.x - p.x, cy - p.y, o.pos.z - p.z) > 1.0 + o.def.radius) continue;
      hit = true;
      g.damage(o, this.form === 'doctor' ? 20 : 28, f, fw.clone(), { knock: 0, launch: 3, heavy: true, hitstop: 0.14, shake: 0.6 });
      if (!o.def.boss) {
        o.push.x += fw.x * 46;
        o.push.z += fw.z * 46;
        g.addProjectile(new Plow(o, 0.85));
      }
      g.addRing(new THREE.Vector3(o.pos.x, cy, o.pos.z), 3, '#F1D47B', 0.25);
    }
    g.sfx.play(hit ? 'impact' : 'swing', p, hit ? 1.4 : 0.6);
    if (hit) {
      g.shake(0.7);
      g.engine.gr.chroma.offset.set(0.006, 0.006);
    }
  }

  /** Agitowari's split: a thin cut straight down through whatever stands before him */
  split(): void {
    const { f, g } = this;
    const fw = f.forward();
    const c = f.pos.clone().addScaledVector(fw, 5).setY(f.pos.y + 2.5);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), fw);
    g.engine.destruction.carve(new BoxShape(c, new THREE.Vector3(0.12, 3.5, 4.5), q), { mode: 'cut', power: 900, dir: fw.clone(), sparks: [0.8, 0.85, 1], dust: 0.5 });
    if (this.form === 'shikai') for (let i = 0; i < 5; i++) burnAt(g, f.pos.clone().addScaledVector(fw, 1.5 + i * 1.6), 0.8, 1, 2);
    g.shake(f === g.player ? 0.5 : 0.2);
  }

  /** Shikai cuts set what they hit alight: a burn for a few seconds */
  ignite(o: Fighter): void {
    const { f, g } = this;
    let t = 0;
    const burn = {
      done: false,
      update: (dt: number) => {
        t += dt;
        if (t > 2.4 || o.dead) burn.done = true;
        else {
          g.drain(o, 7 * dt, f);
          if (Math.random() < 0.35) FlamePool.of(g).spawn(o.pos.x + (Math.random() - 0.5) * 0.5, o.pos.y + Math.random() * 1.2, o.pos.z + (Math.random() - 0.5) * 0.5, 0.25, 0.5, 0.35, 1.1, 1);
        }
      },
      dispose: () => {},
    };
    g.addProjectile(burn);
  }

  /** the charm's barrier: the next real blow bursts against it */
  private charmBlock(amount: number, from: Fighter | null, quiet: boolean): boolean {
    if (!this.charm || quiet || amount < 12) return false;
    const { f, g } = this;
    this.charm = false;
    const c = f.center();
    g.addRing(c.clone(), 3.2, '#8CD3E6', 0.4);
    g.addRing(f.pos.clone().setY(f.pos.y + 0.05), 5, '#E4E8F3', 0.4);
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2, e = Math.random() * 2 - 1, q = Math.sqrt(1 - e * e);
      g.engine.glow.spawn({ x: c.x + Math.cos(a) * q * 1.3, y: c.y + e * 1.3, z: c.z + Math.sin(a) * q * 1.3, vx: Math.cos(a) * q * 2, vy: e * 2, vz: Math.sin(a) * q * 2, size: 0.1, sizeEnd: 0.03, life: 0.45, r: 0.6, g: 0.86, b: 0.95, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    }
    g.callout('', 'THE CHARM', '#8CD3E6');
    g.sfx.play('purify', c, 1);
    if (from && from.pos.distanceTo(f.pos) < 5) {
      from.push.addScaledVector(_v.subVectors(from.pos, f.pos).setY(0).normalize(), 14);
      from.hitstun = Math.max(from.hitstun, 0.4);
    }
    return true;
  }

  armCharm(): void {
    this.charm = true;
    this.charmT = 20;
    const c = this.f.center();
    this.g.addRing(c, 2, '#8CD3E6', 0.3);
  }

  /** the sword's energy glow (Getsuga): a colour, or null to keep the current one, and a strength */
  glowBlade(color: string | null, a: number): void {
    const s = this.f.visual.props.get('sword');
    if (!s) return;
    const u = s.material.userData.uniforms;
    if (!u?.uEnergy) return;
    if (color) {
      const c = new THREE.Color(color);
      u.uEnergy.value.set(c.r, c.g, c.b, a * 0.8);
    } else u.uEnergy.value.w = a * 0.8 + (this.form === 'shikai' ? 0.25 : 0);
  }

  // ---------------------------------------------------------------- forms

  toShinigami(): void {
    const f = this.f;
    this.form = 'shinigami';
    f.anim.stopAll(0.05);
    f.def = { ...f.def, stance: ISSHIN_STANCE, clips: ISSHIN_CLIPS };
    f.setForm({ asset: isshinAsset('shinigami'), props: [{ key: 'sword', model: isshinProp('engetsu'), socket: 'grip.R' }, { key: 'sheath', model: isshinProp('saya'), socket: 'hip.L' }] }, AURA_ISSHIN, BLADE);
    this.hands();
    this.applyLook();
    this.applyStats();
  }

  toShikai(): void {
    this.form = 'shikai';
    this.glowBlade('#F7A23A', 0.3);
    this.applyLook();
    this.applyStats();
  }

  private applyLook(): void {
    const { f, g } = this;
    const style = this.form === 'shikai' ? AURA_ENGETSU : AURA_ISSHIN;
    const blade = this.form === 'shikai' ? BLADE_FIRE : BLADE;
    f.aura.setStyle(style);
    f.ghosts.color.set(style.body);
    f.def = { ...f.def, aura: style, blade };
    f.trail?.setColor(blade.color, blade.core);
    if (g.hud && f === g.player) g.hud.form = this.formName();
  }

  private applyStats(): void {
    const f = this.f;
    f.def = { ...f.def, speed: { ...FORM_SPEED[this.form] } };
    f.power = (this.form === 'doctor' ? 0.85 : this.form === 'shinigami' ? 1.15 : 1.35) * (this.flare ? 1.25 : 1);
    f.aura.target = this.flare ? 1 : this.form === 'doctor' ? 0.12 : this.form === 'shinigami' ? 0.3 : 0.5;
  }

  formName(): string {
    return this.form === 'doctor' ? 'Doctor (gigai)' + (this.charm ? ' · charm' : '') : this.form === 'shinigami' ? 'Shinigami — Engetsu' : 'Shikai — Moero, Engetsu';
  }

  ai(): KitAI {
    return {
      reach: 2.4,
      chain: 4,
      releaseAt: [0.9, 0.55],
      moves: [
        { name: 'dknee', use: () => this.skill1(), min: 4, max: 15, weight: 2, cd: 4, when: () => this.form === 'doctor' },
        { name: 'headbutt', use: () => this.heavy(), min: 0, max: 2.6, weight: 1.2, cd: 3, when: () => this.form === 'doctor' },
        { name: 'flick', use: () => this.skill2(), min: 0, max: 4, weight: 1.6, cd: 4 },
        { name: 'heal', use: () => this.skill3(), min: 9, max: 60, weight: 1.2, cd: 10, when: () => this.form === 'doctor' && this.f.hp < this.f.maxHp * 0.85 },
        { name: 'charm', use: () => this.toggle(), min: 0, max: 30, weight: 0.8, cd: 14, when: () => this.form === 'doctor' && !this.charm },
        { name: 'getsuga', use: () => this.skill1(), min: 3, max: 20, weight: 2.4, cd: 2.6, when: () => this.form !== 'doctor' },
        { name: 'agito', use: () => this.heavy(), min: 0, max: 3.6, weight: 1.3, cd: 3.5, when: () => this.form !== 'doctor' },
        { name: 'headbutt2', use: () => this.skill3(), min: 0, max: 2.6, weight: 1, cd: 4, when: () => this.form === 'shinigami' },
        { name: 'blood', use: () => this.skill3(), min: 4, max: 30, weight: 1.6, cd: 7, when: () => this.form === 'shikai' && this.f.hp > this.f.maxHp * 0.2 },
        { name: 'kotei', use: () => this.toggle(), min: 0, max: 6, weight: 0.9, cd: 18, when: () => this.form !== 'doctor' },
      ],
      opener: () => this.skill1(),
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    const flare = { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare };
    if (this.form === 'doctor') {
      return [
        { key: 'LMB', name: 'Family ambush', kanji: '拳' },
        { key: 'RMB', name: 'Chōhigezutsuki', kanji: '頭突', cd: cd.headbutt, cdMax: 2.4 },
        { key: 'Q', name: 'Flying Double Knee', kanji: '膝', cost: 6, cd: cd.knee, cdMax: 3 },
        { key: 'E', name: 'Oni Dekopin', kanji: '鬼', cost: 8, cd: cd.flick, cdMax: 3.2 },
        { key: 'R', name: 'Field medicine', kanji: '医', cost: 18, cd: cd.heal, cdMax: 14 },
        { key: 'Shift', name: 'Dash', kanji: '走', cost: 4 },
        flare,
        { key: 'F', name: 'Shinigami', kanji: '死神', tint: '#F1D47B' },
        { key: 'G', name: this.charm ? 'Charm (on)' : 'Charm', kanji: '護', cost: 10, cd: cd.charm, cdMax: 16, active: this.charm, tint: '#8CD3E6' },
      ];
    }
    const fire = this.form === 'shikai';
    return [
      { key: 'LMB', name: fire ? 'Kendō · fire' : 'Kendō', kanji: '剣' },
      { key: 'RMB', name: 'Agitowari', kanji: '顎割', cost: 8, cd: cd.agito, cdMax: 2.2 },
      { key: 'Q', name: 'Getsuga', kanji: '月牙', cost: fire ? 26 : 22, cd: this.getsugaCd, cdMax: 1.6, tint: fire ? '#F7A23A' : '#9FD8FF' },
      { key: 'E', name: 'Oni Dekopin', kanji: '鬼', cost: 8, cd: cd.flick, cdMax: 3.2 },
      fire
        ? { key: 'R', name: 'Blood-flame blast', kanji: '血炎', cost: 20, cd: cd.blood, cdMax: 6, tint: '#F7A23A' }
        : { key: 'R', name: 'Chōhigezutsuki', kanji: '頭突', cost: 6, cd: cd.headbutt, cdMax: 2.4 },
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
      flare,
      fire ? { key: 'F', name: 'Bankai (locked)', kanji: '卍解' } : { key: 'F', name: 'Moero, Engetsu', kanji: '燃', cost: 30, tint: '#F7A23A' },
      { key: 'G', name: 'Kaikyō Kotei', kanji: '界境', cost: 24, cd: cd.kotei, cdMax: 16 },
    ];
  }
}
