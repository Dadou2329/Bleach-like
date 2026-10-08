// Hollowfied Ichigo's kit (docs/kits/ichigo.md §4 Hollowfied; dossier A1 §1 K8b and "Lizard body (Visored
// training)"): the body the Hollow took while Ichigo fought it inside, a beast that fights the Visored in relays.
// LMB claw rakes and the tail: rake, rake, the tail lash (a whirl that brings the tail round through the front), the
// two-handed maul. RMB the low 360° tail sweep. Q the two-finger Cero (crimson). E High-Speed Regeneration: white
// matter wells into every wound — a quarter of its life back. R the arm-maw: the left arm drops off, a worm with a
// studded tongue lunges 7 m out of the stump and drags back what it bites, then a new arm grows. Shift lunges. G the
// roar: it tears off whatever binds it (the Kidō pillars crumble when it stands) and throws back all that is near.
// Passive: instant regeneration — the wounds close by themselves whenever nothing has hit it for a moment. F: the husk
// cracks from the shoulders and bursts — Ichigo is back in his Bankai with the eleven-second mask, and from there it is
// the Hueco Mundo kit.
import * as THREE from 'three';
import { FighterAction, type Fighter, type FighterDef } from '../fighter';
import type { Game } from '../game';
import type { AbilityInfo } from '../../ui/hud';
import type { Kit, KitAI } from './kit';
import { IchigoKit } from './ichigo';
import { CeroBeam } from '../projectiles/cero';
import { lizardAsset, lizardMask } from '../../chars/ichigoLizard';
import { LIZARD_CHAIN, LIZARD_CLIPS, LIZARD_STANCE } from '../../chars/ichigoLizardClips';
import { ICHIGO_CLIPS, ICHIGO_STANCE } from '../../chars/ichigoClips';
import type { AuraStyle } from '../../vfx/aura';
import { WormMaw, huskCrack, whiteMatter } from '../../vfx/lizard';
import { SphereShape } from '../../destruction/shapes';
import { TEX_PUFF, TEX_STREAK } from '../../vfx/sprites';

type Form = 'lizard' | 'bankai';

/** white, bleeding crimson at the rim (the Hollow's reiatsu: black-crimson) */
const AURA_LIZARD: AuraStyle = { core: '#FFE8EA', body: '#C81E2C', rim: '#6E0A12', dark: '#120406' };
const CERO_LIZARD = { core: '#FFF0F2', body: '#E0162A', rim: '#6E0A12' };

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

export const LIZARD_DEF: FighterDef = {
  id: 'ichigo-lizard',
  name: 'Kurosaki Ichigo',
  title: 'Hollowfied',
  build: () => ({ asset: lizardAsset(), props: [{ key: 'mask', model: lizardMask(), socket: 'face' }] }),
  stance: LIZARD_STANCE,
  clips: LIZARD_CLIPS,
  aura: AURA_LIZARD,
  hp: 1400,
  rei: 150,
  speed: { run: 10.5, sprint: 21, jump: 12, dash: 13, dashTime: 0.16 },
  radius: 0.45,
  height: 1.74,
};

/** a claw or tail blow at the clip's 'hit' beat: a sphere ahead, or (ring) everything round it */
interface Blow {
  damage: number;
  knock: number;
  launch?: number;
  heavy?: boolean;
  reach: number;
  height: number;
  radius: number;
  lunge: number;
  ring?: boolean;
  smash?: boolean;
}
const BLOWS: Record<string, Blow> = {
  lz_rake: { damage: 30, knock: 8, reach: 1.35, height: 1.15, radius: 1.0, lunge: 8 },
  lz_rake2: { damage: 32, knock: 8, launch: 3, reach: 1.35, height: 1.15, radius: 1.0, lunge: 8 },
  lz_lash: { damage: 38, knock: 16, launch: 3, reach: 0, height: 0.8, radius: 3.2, lunge: 3, ring: true },
  lz_maul: { damage: 52, knock: 10, launch: 8, heavy: true, reach: 1.5, height: 0.9, radius: 1.3, lunge: 7, smash: true },
};

function aimAt(f: Fighter, g: Game, out = new THREE.Vector3()): THREE.Vector3 {
  if (f.faceTarget) return out.copy(f.faceTarget);
  if (f === g.player) return g.aimPoint(f, out);
  return f.center(out).addScaledVector(f.forward(), 30);
}

// ------------------------------------------------------------------------------------------------ actions

/** The LMB string: a claw rake, a rake from the other side, the tail lash, the maul. */
class BeastAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private hitAt = 0;
  private struck = false;
  queued = false;
  constructor(readonly kit: LizardKit, readonly clip: string, readonly index: number, readonly b: Blow) {
    super();
    this.name = clip;
    this.mobility = 0.15;
    this.airGravity = 0.15;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.65;
    this.hitAt = c.events.hit ?? this.dur * 0.4;
    f.anim.play(this.clip, {
      fadeIn: 0.03,
      onEvent: (n) => {
        if (n === 'step') {
          const t = f.faceTarget;
          const extra = t ? Math.min(4, Math.max(0, Math.hypot(t.x - f.pos.x, t.z - f.pos.z) - 1.4)) : 0;
          f.push.addScaledVector(f.forward(), this.b.lunge + extra * 2.4);
          g.sfx.play(this.b.ring ? 'swingHeavy' : 'swing', f.center(), 0.7);
        }
        if (n === 'fx' && this.b.smash) {
          const p = f.pos.clone().addScaledVector(f.forward(), 1.5);
          g.groundImpact(p, 2.4, 160, AURA_LIZARD.body, f);
          g.shake(f === g.player ? 0.5 : 0.2);
        }
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.struck && this.t >= this.hitAt) {
      this.struck = true;
      this.kit.strike(this.b);
    }
    if (this.queued && this.t >= this.comboAt) {
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

abstract class SkillAction extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: LizardKit) {
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
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t > this.dur * 0.7;
  }
}

/** RMB: the tail sweep — dropped low, the tail laid flat and swung once all the way round. */
class SweepAction extends SkillAction {
  readonly name = 'tailsweep';
  private hits = new Set<number>();
  private sweeping = false;
  private carveT = 0;
  constructor(kit: LizardKit) {
    super(kit);
    this.mobility = 0.05;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'lz_sweep', (n) => {
      if (n === 'fx') {
        this.sweeping = true;
        g.sfx.play('swingHeavy', f.center(), 1);
      }
      if (n === 'end') this.sweeping = false;
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.sweeping) return;
    const tip = this.kit.sock('tailTip', _v);
    // the tail scythes through everything round it at shin height
    for (const o of g.enemiesOf(f)) {
      if (this.hits.has(o.id) || o.dead) continue;
      const d = Math.hypot(o.pos.x - f.pos.x, o.pos.z - f.pos.z);
      if (d > 3.9 + o.def.radius || o.pos.y > f.pos.y + 1.6) continue;
      this.hits.add(o.id);
      g.damage(o, 46, f, _w.subVectors(o.pos, f.pos).setY(0).normalize().clone(), { knock: 18, launch: 6, heavy: true, hitstop: 0.1, shake: 0.4 });
    }
    this.carveT -= dt;
    if (this.carveT <= 0) {
      this.carveT = 0.035;
      g.engine.destruction.carve(new SphereShape(tip.clone(), 0.5, 0.35), { mode: 'cut', power: 360, dust: 0.6 });
      g.engine.dust.spawn({ x: tip.x, y: f.pos.y + 0.1, z: tip.z, vx: 0, vy: 0.8, vz: 0, size: 0.5, sizeEnd: 1.4, life: 0.5, r: 0.55, g: 0.5, b: 0.45, alpha: 0.45, alphaEnd: 0, tex: TEX_PUFF });
    }
  }
}

/** Q: the two-finger Cero — the right arm out straight, the crimson gathering at the fingertips. */
class CeroAction extends SkillAction {
  readonly name = 'cero';
  constructor(kit: LizardKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.5;
    this.trackTarget = true;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'lz_cero', (n) => {
      if (n !== 'charge') return;
      const emitter = f.visual.rig.sockets.get('fingers.R') ?? f.visual.object;
      g.addProjectile(new CeroBeam(g, f, emitter, () => aimAt(f, g, new THREE.Vector3()), { charge: 0.52, fire: 0.55, radius: 0.85, damage: 150, power: 760, core: CERO_LIZARD.core, body: CERO_LIZARD.body, rim: CERO_LIZARD.rim, range: 120, track: 0.8, gain: 1.5 }));
      g.callout('虚閃', 'CERO', '#ff4a5a');
      g.sfx.play('charge', f.center(), 1);
    });
  }
}

/** E: High-Speed Regeneration — the back arched, white matter welling into every wound. */
class RegenAction extends SkillAction {
  readonly name = 'regen';
  constructor(kit: LizardKit) {
    super(kit);
    this.mobility = 0;
  }
  override start(f: Fighter, g: Game): void {
    whiteMatter(g, f, 16);
    this.playClip(f, 'lz_regen', (n) => {
      if (n !== 'heal') return;
      const before = f.hp;
      f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.25);
      whiteMatter(g, f, 40, 1.4);
      g.sfx.play('heal', f.center(), 0.8);
      if (f === g.player && f.hp > before) g.hud?.showBanner('High-Speed Regeneration');
    });
  }
}

/** R: the arm-maw — the left arm falls, a worm lunges 7 m out of the stump and bites, then a new arm grows. */
class MawAction extends SkillAction {
  readonly name = 'maw';
  constructor(kit: LizardKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.5;
    this.trackTarget = true;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'lz_maw', (n) => {
      if (n === 'drop') this.kit.dropArm();
      if (n === 'lunge') {
        const root = f.visual.rig.sockets.get('shoulder.L') ?? f.visual.object;
        const t = this.kit.target();
        const at = t && t.pos.distanceTo(f.pos) < 9 ? t.center(new THREE.Vector3()) : aimAt(f, g, new THREE.Vector3());
        g.addProjectile(new WormMaw(g, f, root, at, { reach: 7, damage: 70 }));
      }
      if (n === 'regrow') this.kit.regrowArm();
    });
  }
  override end(f: Fighter, g: Game): void {
    super.end(f, g);
    this.kit.regrowArm();
  }
}

/** G: the roar — whatever binds it torn off, everything near thrown back. */
class RoarAction extends SkillAction {
  readonly name = 'roar';
  constructor(kit: LizardKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.9;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'lz_roar', (n) => {
      if (n === 'roar') this.kit.roarBurst();
    });
  }
}

/** F: the shed — the husk cracks from the shoulders, three times, then bursts: Ichigo in his Bankai, masked. */
class ShedAction extends SkillAction {
  readonly name = 'shed';
  constructor(kit: LizardKit) {
    super(kit);
    this.mobility = 0;
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    g.callout('', 'THE HUSK CRACKS', '#f3eee6');
    this.playClip(f, 'lz_shed', (n) => {
      if (n === 'crack' || n === 'crack2' || n === 'crack3') {
        huskCrack(g, f);
        f.flashT = Math.max(f.flashT, 0.1);
        g.shake(f === g.player ? 0.25 : 0.1);
      }
      if (n === 'burst') {
        this.kit.shed();
        this.done = true;
      }
    });
  }
}

// ------------------------------------------------------------------------------------------------ kit

export class LizardKit implements Kit {
  form: Form = 'lizard';
  private combo = 0;
  private lastEnd = 0;
  readonly cd = { sweep: 0, cero: 0, regen: 0, maw: 0, roar: 0 };
  flare = false;
  /** the left arm is off (the maw is out) */
  armless = false;
  private wasDashing = false;
  /** after the shed: the Hueco Mundo kit, in Bankai with the mask */
  inner: IchigoKit | null = null;

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    this.hands();
    this.applyStats();
  }

  private hands(): void {
    const rig = this.f.visual.rig;
    rig.setBoneVisible('fist.L', false);
    rig.setBoneVisible('fist.R', false);
    rig.setBoneVisible('palm.L', true);
    rig.setBoneVisible('palm.R', true);
    // the forehead locks would poke through the mask
    rig.setBoneVisible('bangs', false);
  }

  update(dt: number): void {
    const { f, g } = this;
    if (this.inner) {
      this.inner.update(dt);
      return;
    }
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    // instant regeneration: the wounds close by themselves whenever nothing has struck it for a moment
    if (!f.dead && f.hp < f.maxHp && g.time - f.lastHurt.at > 1.6) {
      f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.012 * dt);
      if (Math.random() < 0.12) whiteMatter(g, f, 2, 0.6);
    }
    // the lunge: claws scraping the ground at the start of it
    const dashing = f.dashT > 0;
    if (dashing && !this.wasDashing) {
      const p = f.pos;
      for (let i = 0; i < 6; i++) g.engine.dust.spawn({ x: p.x + (Math.random() - 0.5) * 0.6, y: p.y + 0.1, z: p.z + (Math.random() - 0.5) * 0.6, vx: -f.dashDir.x * 2, vy: 0.6, vz: -f.dashDir.z * 2, size: 0.4, sizeEnd: 1.1, life: 0.45, r: 0.5, g: 0.46, b: 0.42, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF });
      g.sfx.play('shunpo', f.center(), 0.6);
    }
    this.wasDashing = dashing;
  }

  // -------------------------------------------------------------------------------------------- inputs

  attack(): void {
    const f = this.f;
    if (this.inner) return this.inner.attack();
    if (f.action instanceof BeastAction) {
      f.action.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastEnd > 0.8) this.combo = 0;
    this.chain(this.combo);
  }

  chain(i: number): void {
    const idx = i % LIZARD_CHAIN.length;
    this.combo = idx + 1;
    this.lastEnd = this.g.time + 0.8;
    const clip = LIZARD_CHAIN[idx];
    this.f.act(new BeastAction(this, clip, idx, BLOWS[clip]), true);
  }

  heavy(): void {
    if (this.inner) return this.inner.heavy();
    this.special(new SweepAction(this), 0, 'sweep', 2.4);
  }

  skill1(): void {
    if (this.inner) return this.inner.skill1();
    this.special(new CeroAction(this), 24, 'cero', 4.5);
  }

  skill2(): void {
    if (this.inner) return this.inner.skill2?.();
    if (this.f.hp >= this.f.maxHp) return;
    this.special(new RegenAction(this), 18, 'regen', 14);
  }

  skill3(): void {
    if (this.inner) return this.inner.skill3?.();
    this.special(new MawAction(this), 20, 'maw', 8);
  }

  /** F: the husk cracks and bursts — back to Bankai, masked */
  release(): void {
    const f = this.f;
    if (this.inner) return this.inner.release();
    if (f.dead || (f.busy && !(f.action instanceof BeastAction))) return;
    f.stopAction();
    f.act(new ShedAction(this), true);
  }

  toggle(): void {
    if (this.inner) return this.inner.toggle();
    this.special(new RoarAction(this), 10, 'roar', 8);
  }

  toggleFlare(): void {
    if (this.inner) return this.inner.toggleFlare();
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

  sock(name: string, out = new THREE.Vector3()): THREE.Vector3 {
    const s = this.f.visual.rig.sockets.get(name);
    if (!s) return this.f.center(out);
    s.updateWorldMatrix(true, false);
    return s.getWorldPosition(out);
  }

  /** a claw (a sphere ahead) or the tail (everything round it) */
  strike(b: Blow): void {
    const { f, g } = this;
    const fw = f.forward(_w).clone();
    const c = f.pos.clone().addScaledVector(fw, b.reach);
    c.y += b.height;
    const k = this.armless ? 0.7 : 1;
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      const cy = Math.max(o.pos.y + 0.15, Math.min(o.pos.y + o.def.height - 0.15, c.y));
      const d = b.ring ? Math.hypot(o.pos.x - f.pos.x, o.pos.z - f.pos.z) : Math.hypot(o.pos.x - c.x, cy - c.y, o.pos.z - c.z);
      if (d > b.radius + o.def.radius || (b.ring && Math.abs(o.pos.y - f.pos.y) > 1.8)) continue;
      const dir = _v.subVectors(o.pos, f.pos).setY(0);
      if (dir.lengthSq() < 1e-4) dir.copy(fw);
      dir.normalize();
      g.damage(o, b.damage * k, f, dir.clone(), { knock: b.knock, launch: b.launch, heavy: b.heavy, hitstop: b.heavy ? 0.1 : 0.06, shake: b.heavy ? 0.35 : 0.15 });
      g.sparks(new THREE.Vector3(o.pos.x, cy, o.pos.z), dir, b.ring ? '#f3eef0' : AURA_LIZARD.body, 8);
    }
    // the claws and the tail gouge what they cross
    if (!b.ring) g.engine.destruction.carve(new SphereShape(c, b.radius * 0.7, 0.35), { mode: 'cut', power: 220, dir: fw, dust: 0.4 });
  }

  /** the left arm drops off at the shoulder */
  dropArm(): void {
    const { f, g } = this;
    if (this.armless) return;
    this.armless = true;
    const p = this.sock('shoulder.L', new THREE.Vector3());
    f.visual.rig.setBoneVisible('upperarm.L', false);
    for (let i = 0; i < 16; i++) g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5) * 3, vy: Math.random() * 2, vz: (Math.random() - 0.5) * 3, size: 0.08, sizeEnd: 0.03, life: 0.5, r: 0.55, g: 0.08, b: 0.12, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2, gravity: -9 });
    g.sfx.play('hitHeavy', p, 0.7);
  }

  /** a new arm grows out of the stump, spikes and talons and all */
  regrowArm(): void {
    const { f, g } = this;
    if (!this.armless) return;
    this.armless = false;
    f.visual.rig.setBoneVisible('upperarm.L', true);
    f.flashT = Math.max(f.flashT, 0.12);
    whiteMatter(g, f, 18, 0.8);
  }

  /** the roar: binds torn off, the barriers round it broken, everything near thrown back */
  roarBurst(): void {
    const { f, g } = this;
    const c = f.center();
    f.rooted = false;
    f.armLockT = 0;
    f.slowT = 0;
    f.slowK = 0;
    f.scrambleT = 0;
    f.heavyB = 0;
    f.heavyW = 0;
    f.hitstun = 0;
    const broken = g.rejectNear(c, 6, f, true);
    f.aura.flare(2.2, 0.5);
    g.addRing(f.pos.clone().setY(f.pos.y + 0.05), 9, AURA_LIZARD.body, 0.5);
    g.addRing(c.clone(), 4, '#ffffff', 0.25);
    g.sfx.play('roarBig', c, 1);
    g.shake(f === g.player ? 0.8 : 0.3);
    if (broken > 0) g.callout('', 'THE BINDS BREAK', '#ff6e86');
    for (const o of g.enemiesOf(f)) {
      const d = o.pos.distanceTo(f.pos);
      if (d < 8) g.damage(o, 22 * (1 - d / 8), f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 18 * (1 - d / 8), launch: 4, heavy: d < 4, quiet: true });
    }
  }

  /** The husk bursts: Ichigo stands in his Bankai, masked; the Hueco Mundo kit takes over. */
  shed(): void {
    const { f, g } = this;
    if (this.inner) return;
    huskCrack(g, f, true);
    this.form = 'bankai';
    this.armless = false;
    this.flare = false;
    f.def = { ...f.def, stance: ICHIGO_STANCE, clips: ICHIGO_CLIPS, speed: { run: 9, sprint: 25, jump: 12, dash: 15, dashTime: 0.12 } };
    f.anim.stopAll(0.05);
    const inner = (this.inner = new IchigoKit(f, g));
    inner.onBankai(f, g);
    inner.formMask();
    f.flashT = Math.max(f.flashT, 0.15);
    g.addRing(f.pos.clone().setY(f.pos.y + 0.05), 14, AURA_LIZARD.body, 0.6);
    g.rejectNear(f.center(), 8, f, true);
    g.callout('卍解', 'TENSA ZANGETSU', '#ff3b52');
  }

  // -------------------------------------------------------------------------------------------- look & stats

  private applyStats(): void {
    const f = this.f;
    f.power = 1.4 * (this.flare ? 1.2 : 1);
    f.damageTaken = 0.9;
    f.aura.target = this.flare ? 1 : 0.35;
    f.ghosts.enabled = false;
    if (this.g.hud && f === this.g.player) this.g.hud.form = this.formName();
  }

  formName(): string {
    if (this.inner) return this.inner.formName();
    return 'Hollowfied' + (this.armless ? ' · the maw' : '');
  }

  abilities(): AbilityInfo[] {
    if (this.inner) return this.inner.abilities();
    const cd = this.cd;
    return [
      { key: 'LMB', name: 'Claws & tail', kanji: '爪' },
      { key: 'RMB', name: 'Tail sweep', kanji: '尾', cd: cd.sweep, cdMax: 2.4 },
      { key: 'Q', name: 'Two-finger Cero', kanji: '虚閃', cost: 24, cd: cd.cero, cdMax: 4.5, tint: '#ff4a5a' },
      { key: 'E', name: 'High-Speed Regeneration', kanji: '超速再生', cost: 18, cd: cd.regen, cdMax: 14 },
      { key: 'R', name: 'Arm-maw', kanji: '顎', cost: 20, cd: cd.maw, cdMax: 8 },
      { key: 'F', name: 'Shed the husk', kanji: '卍解', tint: '#ff3b52' },
      { key: 'G', name: 'Roar', kanji: '咆', cost: 10, cd: cd.roar, cdMax: 8 },
      { key: 'Shift', name: 'Lunge', kanji: '跳', cost: 4 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
    ];
  }

  ai(): KitAI {
    const beast = () => this.inner === null;
    const masked = () => this.inner !== null;
    const bound = () => this.f.rooted || this.f.armLockT > 0 || this.f.slowT > 0;
    return {
      reach: 1.8,
      chain: 4,
      // the husk breaks when Ichigo wins inside: a third of its life gone
      releaseAt: 0.4,
      moves: [
        { name: 'sweep', use: () => this.heavy(), min: 0, max: 3.6, weight: 1.6, cd: 3, when: beast },
        { name: 'cero', use: () => this.skill1(), min: 5, max: 60, weight: 2, cd: 5, when: beast },
        { name: 'regen', use: () => this.skill2(), min: 4, max: 99, weight: 2.4, cd: 14, when: () => beast() && this.f.hp < this.f.maxHp * 0.65 },
        { name: 'maw', use: () => this.skill3(), min: 2.5, max: 7.5, weight: 1.8, cd: 8, when: beast },
        { name: 'roar', use: () => this.toggle(), min: 0, max: 7, weight: 1, cd: 9, when: () => beast() && (bound() || this.g.enemiesOf(this.f).filter((o) => o.pos.distanceTo(this.f.pos) < 4).length > 1) },
        { name: 'getsuga', use: () => this.skill1(), min: 6, max: 60, weight: 2.2, cd: 2.4, when: masked },
        { name: 'skill2', use: () => this.skill2(), min: 4, max: 26, weight: 1.2, cd: 5, when: masked },
        { name: 'skill3', use: () => this.skill3(), min: 4, max: 20, weight: 1, cd: 6, when: masked },
      ],
    };
  }
}
