// Giselle Gewelle's kit (docs/kits/giselle.md). Her blood is the weapon: every drop that lands on someone fills an
// infection meter (the body reddens as it fills; strong souls take more blood, a living Quincy none) and past half it
// spreads through the body by itself. LMB a floppy string (her blood flicked on every hit while she bleeds); RMB Bait
// (she pleads with her guard down: whoever cuts her is drenched, she takes half and grows it back); Q Finger Bite (a fan
// of blood flung; the puddles dose whoever stands in them); E Command ("Die!" — the fully infected turn their own
// weapons on themselves and fodder dies; "Kneel!" — the half infected drop; her zombies "Attack!"); R Raise (the fully
// infected become her puppets for 5 s, else a fresh corpse rises as her zombie, else a stored one climbs out of her
// shadow — Bambietta, Hitsugaya, Rangiku, Candice — each with its whole kit under a duel AI, reddened); G Drink from a
// zombie at hand (else the bone bow's skull arrows). Undying: a lethal blow leaves her sprawled at 1 HP, and she gets
// back up (once in 75 s). F: Quincy: Vollständig — Azhalbiora (bone wings, a skeletal tail, flight): LMB the tail
// string, RMB Munchy Munchy Babies, Q Dancing Dead Boys Club, G Sklaverei, F Dead March.
import * as THREE from 'three';
import { FighterAction, type Fighter, type FighterDef, type PropDef } from '../fighter';
import type { Controller, Game, Projectile } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import type { AuraStyle } from '../../vfx/aura';
import { giselleAsset, giselleProp, skeletonAsset } from '../../chars/giselle';
import { AZHALBIORA_CHAIN, AZHALBIORA_CLIPS, AZHALBIORA_STANCE, GISELLE_CHAIN, GISELLE_CLIPS, GISELLE_STANCE, SKELETON_CLIPS, SKELETON_STANCE } from '../../chars/giselleClips';
import { registerReactions } from '../../chars/reactionClips';
import { AZHAL, AZHAL_LIGHT, BLOOD_FRESH, BloodDrops, BloodPools, BloodSpray, BonePin, BoneRattle, ShadowGate, SkullArrow, bloodBurst, infectionTint } from '../../vfx/zombie';
import { LightPillar, sklaverei } from '../../vfx/heilig';
import { TEX_GLOW, TEX_STREAK } from '../../vfx/sprites';
import { hirenkyakuPuff, hirenkyakuStreak, vollFlight, type Rgb } from './sternritter';
import { DuelistAI } from '../ai/duelist';
import { HollowAI } from '../ai/hollow';
import { rosterById } from '../registry';

export const AURA_ZOMBIE: AuraStyle = { core: '#F4E8FF', body: '#B08AE8', rim: '#4A2A86' };
export const AURA_AZHAL: AuraStyle = { core: '#F2E6FF', body: '#9A5CF2', rim: '#5A22A8' };

const SPEED = { run: 9.6, sprint: 27, jump: 13, dash: 30, dashTime: 0.1 };
const SPEED_AZHAL = { run: 12, sprint: 34, jump: 14, dash: 36, dashTime: 0.1 };
const AZHAL_TIME = 30;
const AZHAL_CD = 22;
const UNDYING_CD = 75;
const TINT: Rgb = [0.72, 0.5, 1];
/** the dead she keeps and calls out of her shadow, in turn */
export const STORE = ['bambietta', 'hitsugaya-tybw', 'rangiku', 'candice'];
/** what each of them mumbles as it climbs out */
const MUMBLE: Record<string, string> = { bambietta: 'Gigi… blood… give me blood…', rangiku: '…', candice: 'Ugh… my hair…', 'hitsugaya-tybw': '' };

export const GISELLE_DEF: FighterDef = {
  id: 'giselle',
  name: 'Giselle Gewelle',
  title: 'Sternritter "Z" — The Zombie',
  build: () => ({ asset: giselleAsset('base'), props: [] }),
  stance: GISELLE_STANCE,
  clips: GISELLE_CLIPS,
  aura: AURA_ZOMBIE,
  hp: 950,
  rei: 220,
  speed: { ...SPEED },
  radius: 0.26,
  height: 1.6,
};

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

/** a fighter not in the roster is a Hollow (or some other spawn): hard to zombify */
const rostered = (o: Fighter): boolean => !!rosterById(o.def.id);

/** Steps on a timeline (s from now). */
class Later implements Projectile {
  done = false;
  private t = 0;
  constructor(private steps: [number, () => void][]) {
    this.steps.sort((a, b) => a[0] - b[0]);
  }
  update(dt: number): void {
    this.t += dt;
    while (this.steps.length && this.steps[0][0] <= this.t) this.steps.shift()![1]();
    if (!this.steps.length) this.done = true;
  }
  dispose(): void {}
}

// ---------------------------------------------------------------------------------------------- the dead

/**
 * One of her dead: its own controller (the full kit under a duel AI, or a Hollow's), the dead red cast kept on it, and
 * the strings cut when she falls (or when a Hollow, hard to keep, runs out of time).
 */
class ZombieAI implements Controller {
  private tintT = 0;
  constructor(readonly g: Game, readonly f: Fighter, private inner: Controller, readonly mistress: Fighter, private life = Infinity) {}
  update(dt: number): void {
    const { f, g } = this;
    if (!f.dead && (this.mistress.dead || !g.fighters.includes(this.mistress) || (this.life -= dt) <= 0)) {
      f.data.expired = true;
      bloodBurst(g, f.center(), null, 18, 3);
      g.kill(f, null, _v.set(0, 0, 0));
    }
    this.inner.update(dt);
    if ((this.tintT -= dt) <= 0) {
      this.tintT = 0.3;
      if (!f.dead) infectionTint(f, 1);
    }
  }
  render(dt: number): void {
    this.inner.render?.(dt);
  }
}

// ---------------------------------------------------------------------------------------------- the skeletons

const SKELETON_DEF: FighterDef = {
  id: 'gigi-skeleton',
  name: 'Dead Boy',
  title: 'Dancing Dead Boys Club',
  build: () => ({ asset: skeletonAsset(), props: [] }),
  stance: SKELETON_STANCE,
  clips: SKELETON_CLIPS,
  aura: AURA_AZHAL,
  hp: 60,
  rei: 20,
  speed: { run: 6.5, sprint: 11, jump: 9, dash: 10, dashTime: 0.12 },
  radius: 0.3,
  height: 1.2,
};

/** a skeleton's two-handed slap */
class SkeletonSlap extends FighterAction {
  readonly name = 'sk_slap';
  private hit = false;
  constructor() {
    super();
    this.mobility = 0.3;
  }
  override start(f: Fighter): void {
    f.anim.play('sk_slap');
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.hit && this.t >= 0.18) {
      this.hit = true;
      const fw = f.forward(_v);
      for (const o of g.enemiesOf(f)) {
        if (o.dead) continue;
        const d = _w.subVectors(o.pos, f.pos).setY(0);
        if (d.length() > 1.3 + o.def.radius || d.normalize().dot(fw) < 0.3) continue;
        g.damage(o, 12, f, fw.clone(), { knock: 4, hitstop: 0.04, color: AZHAL_LIGHT });
        g.sfx.play('hit', o.center(), 0.5);
      }
    }
    if (this.t >= 0.48) this.done = true;
  }
}

/** The Dancing Dead Boys: they dance at the target and slap it. */
class SkeletonKit implements Kit {
  private cd = 0;
  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.knockTaken = 1.6;
  }
  update(dt: number): void {
    this.cd = Math.max(0, this.cd - dt);
  }
  attack(): void {
    if (!this.f.busy) this.f.act(new SkeletonSlap());
  }
  heavy(): void {
    this.attack();
  }
  skill1(): void {}
  release(): void {}
  toggleFlare(): void {}
  abilities(): AbilityInfo[] {
    return [];
  }
  formName(): string {
    return 'Dancing Dead Boys Club';
  }
  ai(): KitAI {
    return { reach: 1.2, chain: 2, moves: [] };
  }
}

// ---------------------------------------------------------------------------------------------- actions

/** A blow of the string (or of the tail): the clip, an approach dash, the events to the kit. */
class StrikeAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private hitAt = -1;
  private stopAt = 0;
  queued = false;

  constructor(readonly kit: GiselleKit, readonly clip: string, readonly index: number, readonly onEvent: (n: string) => void, readonly stop = 1.1) {
    super();
    this.name = clip;
    this.mobility = 0.16;
    this.airGravity = 0.2;
  }

  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.62;
    this.hitAt = c.events.hit ?? -1;
    const tgt = f.faceTarget;
    let dashed = false;
    if (tgt && this.hitAt > 0) {
      const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
      this.stopAt = this.stop;
      if (d > this.stopAt + 0.25 && d < 7) {
        const tau = Math.max(0.06, this.hitAt - 0.06);
        const per = (1 - Math.exp(-f.pushDrag * tau)) / f.pushDrag;
        f.push.addScaledVector(f.forward(), Math.min(26, (d - this.stopAt) / per));
        dashed = true;
      }
    }
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n === 'step') {
          if (!dashed) f.push.addScaledVector(f.forward(), 2.5);
          g.sfx.play('swing', f.center(), 0.6);
        }
        this.onEvent(n);
      },
    });
  }

  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const tgt = f.faceTarget;
    if (this.stopAt > 0 && tgt && Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z) <= this.stopAt) {
      f.push.x = 0;
      f.push.z = 0;
      this.stopAt = 0;
    }
    if (this.queued && this.t >= this.comboAt) {
      this.done = true;
      this.kit.chain(this.index + 1);
      return;
    }
    if (this.t >= this.dur) this.done = true;
  }

  override canCancel(next: FighterAction): boolean {
    if (next.name === 'dash' || next instanceof ClipSkill) return this.t >= this.hitAt + 0.05;
    return false;
  }
}

interface SkillOpts {
  armor?: number;
  mobility?: number;
  invulnerable?: boolean;
  tick?: (t: number, dt: number) => void;
  end?: () => void;
  dur?: number;
  /** a forward lunge on start (m/s) */
  lunge?: number;
  hold?: boolean;
}

/** One clip, its events to a callback, done when it ends. */
class ClipSkill extends FighterAction {
  private dur = 1;
  constructor(readonly name: string, readonly clip: string, private on: (n: string) => void, private o: SkillOpts = {}) {
    super();
    this.armor = o.armor ?? 0;
    this.mobility = o.mobility ?? 0.1;
    this.invulnerable = !!o.invulnerable;
    this.airGravity = 0.1;
  }
  override start(f: Fighter): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = this.o.dur ?? c.dur - c.fadeOut * 0.5;
    if (this.o.lunge) f.push.addScaledVector(f.forward(), this.o.lunge);
    f.anim.play(this.clip, { onEvent: this.on, hold: this.o.hold });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    this.o.tick?.(this.t, dt);
    if (this.t >= this.dur) this.done = true;
  }
  override end(f: Fighter): void {
    if (this.o.hold) f.anim.stopAll(0.2);
    this.o.end?.();
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' ? this.t > this.dur * 0.6 : next instanceof ClipSkill && this.t > this.dur * 0.7;
  }
}

/**
 * Bait: she shrinks, pleads, guard down — armour 0.5, so a blow lands at half and does not stagger her. A blow from
 * close by in the window drenches its owner (the kit's onHurt) and she straightens up grinning.
 */
class BaitAction extends FighterAction {
  readonly name = 'bait';
  sprung = false;
  private grinAt = -1;
  constructor(readonly kit: GiselleKit) {
    super();
    this.armor = 0.5;
    this.mobility = 0;
  }
  override start(f: Fighter): void {
    f.anim.play('gg_bait', { hold: true });
  }
  spring(f: Fighter): void {
    if (this.sprung) return;
    this.sprung = true;
    this.grinAt = this.t;
    f.anim.play('gg_grin');
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.sprung ? this.t - this.grinAt >= 0.6 : this.t >= 1.3) this.done = true;
  }
  override end(f: Fighter): void {
    if (!this.sprung) f.anim.stopAll(0.2);
    this.kit.baitOver(this.sprung);
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' || (this.sprung && next instanceof ClipSkill);
  }
}

/** Undying: sprawled where the blow dropped her, untouchable, then back up. */
class SprawlAction extends FighterAction {
  readonly name = 'undying';
  constructor(readonly kit: GiselleKit) {
    super();
    this.invulnerable = true;
    this.mobility = 0;
    this.trackTarget = false;
  }
  override start(f: Fighter): void {
    registerReactions(f.anim);
    f.anim.play('slumber', { hold: true });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 1.6) this.done = true;
  }
  override end(f: Fighter): void {
    f.anim.stopAll(0.2);
    f.anim.play('gg_grin');
    this.kit.getUp();
  }
}

// ---------------------------------------------------------------------------------------------- the kit

type Form = 'base' | 'azhalbiora';
interface Corpse { id: string; def: FighterDef; pos: THREE.Vector3; t: number; rostered: boolean }
interface Zombie { f: Fighter; id: string }

export class GiselleKit implements Kit {
  form: Form = 'base';
  flare = false;
  comboIndex = 0;
  private lastEnd = 0;
  azhT = 0;
  azhCd = 0;
  sklav = false;
  bleedT = 0;
  baitT = 0;
  undyingCd = 0;
  private diveT = 0;
  private regen = 0;
  private regenRate = 0;
  private bait: BaitAction | null = null;
  private wasDashing = false;
  /** how far her blood has got into each of them (0 … 1) */
  readonly inf = new Map<Fighter, number>();
  private told = new WeakSet<Fighter>();
  readonly zombies: Zombie[] = [];
  readonly skeletons: Fighter[] = [];
  private storeCd: Record<string, number> = {};
  private storeNext = 0;
  readonly corpses: Corpse[] = [];
  private seen = new WeakSet<Fighter>();
  private puppetClock = new Map<Fighter, number>();
  private pools: BloodPools | null = null;
  private quincyToldT = -99;
  readonly cd = { bait: 0, bite: 0, command: 0, raise: 0, drink: 0, bow: 0, munchy: 0, dance: 0, sklav: 0, march: 0 };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.data.quincy = true;
    f.onHurt = (amount) => this.hurt(amount);
    f.onLethal = () => this.lethal();
    this.hands();
    this.applyStats();
  }

  private hands(): void {
    const rig = this.f.visual.rig;
    const p = this.f.visual.props;
    const fistR = p.has('skull.R');
    const fistL = p.has('skull.L') || p.has('bow');
    rig.setBoneVisible('fist.R', fistR);
    rig.setBoneVisible('palm.R', !fistR);
    rig.setBoneVisible('fist.L', fistL);
    rig.setBoneVisible('palm.L', !fistL);
  }

  private props(): PropDef[] {
    return this.form === 'azhalbiora' ? [{ key: 'halo', model: giselleProp('halo'), socket: 'halo' }] : [];
  }

  private pool(): BloodPools {
    if (!this.pools || this.pools.done) {
      this.pools = new BloodPools(this.g, this.f, (o, dt) => this.dose(o, 0.2 * dt));
      this.g.addProjectile(this.pools);
    }
    return this.pools;
  }

  // ---------------------------------------------------------------- the blood

  /** how far her blood has got into o */
  infection(o: Fighter): number {
    return this.inf.get(o) ?? 0;
  }

  /**
   * Her blood on someone: the dose scaled by how strong a soul it is (one drop is enough for the weak), nothing on a
   * living Quincy, half on a Hollow.
   */
  dose(o: Fighter, raw: number): void {
    const { f, g } = this;
    if (o === f || o.dead || o.team === f.team || o.data.zombieOf) return;
    if (o.data.quincy) {
      if (g.time - this.quincyToldT > 12 && f === g.player) {
        this.quincyToldT = g.time;
        g.callout('', 'Quincy blood… boring~', AZHAL);
      }
      return;
    }
    const was = this.infection(o);
    const weak = o.maxHp <= 300 && !o.def.boss;
    const k = weak ? 99 : Math.max(0.25, Math.min(1, 450 / o.maxHp)) * (rostered(o) ? 1 : 0.5);
    const now = Math.min(1, was + raw * k);
    this.inf.set(o, now);
    if (now >= 1 && was < 1 && !this.told.has(o)) {
      this.told.add(o);
      if (f === g.player || o === g.player) g.callout('', 'Hehe~ you\'re mine now.', BLOOD_FRESH);
    }
  }

  /** hurt: she bleeds; a melee attacker is splashed — drenched, if she was baiting */
  private hurt(amount: number): void {
    const { f, g } = this;
    this.bleedT = Math.max(this.bleedT, 3);
    const by = f.lastHurt.from;
    if (!by || by === f || by.team === f.team || by.dead || by.pos.distanceTo(f.pos) > 3.6) return;
    const dir = by.center().sub(f.center()).normalize();
    if (this.bait && f.action === this.bait && !this.bait.sprung) {
      // the bait taken: a fountain over whoever cut her
      this.dose(by, 1.0);
      for (const o of g.enemiesOf(f)) if (o !== by && !o.dead && o.pos.distanceTo(f.pos) < 2.5) this.dose(o, 0.4);
      bloodBurst(g, f.center(), dir, 46, 7);
      for (let i = 0; i < 2; i++) this.pool().add(by.pos.clone().add(_v.set((Math.random() - 0.5) * 1.4, 0, (Math.random() - 0.5) * 1.4)), 0.4 + Math.random() * 0.2);
      // what it cost her grows back
      this.regen += amount;
      this.regenRate = this.regen / 4;
      this.bleedT = Math.max(this.bleedT, 6);
      this.bait.spring(f);
      g.callout('ザ・ゾンビ', 'ZA ZONBI', AZHAL);
      g.sfx.play('hitHeavy', f.center(), 0.8);
      return;
    }
    this.dose(by, Math.min(0.35, (amount / 100) * 0.25));
    bloodBurst(g, f.center(), dir, 10, 4);
  }

  private lethal(): boolean {
    const { f, g } = this;
    if (this.undyingCd > 0) return false;
    this.undyingCd = UNDYING_CD;
    f.hp = 1;
    f.act(new SprawlAction(this), true);
    bloodBurst(g, f.center(), null, 30, 4);
    return true;
  }

  /** after Undying: up again, mended (more if a zombie is there to drink) */
  getUp(): void {
    const { f, g } = this;
    let heal = f.maxHp * 0.15;
    const z = this.zombieNear(6);
    if (z) {
      const take = Math.min(z.hp - 1, f.maxHp * 0.25);
      z.hp -= take;
      heal += take;
      bloodBurst(g, z.center(), null, 14, 3);
    }
    f.hp = Math.min(f.maxHp, f.hp + heal);
    g.callout('', 'Ehehe~ did you think I\'d die?', AZHAL);
  }

  baitOver(sprung: boolean): void {
    this.bait = null;
    this.cd.bait = sprung ? 5 : 3;
  }

  // ---------------------------------------------------------------- update

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    for (const k of Object.keys(this.storeCd)) this.storeCd[k] = Math.max(0, this.storeCd[k] - dt);
    this.azhCd = Math.max(0, this.azhCd - dt);
    this.undyingCd = Math.max(0, this.undyingCd - dt);
    if (this.regen > 0 && !f.dead) {
      const h = Math.min(this.regen, this.regenRate * dt);
      this.regen -= h;
      f.hp = Math.min(f.maxHp, f.hp + h);
    }
    // bleeding: drops off the wound and the fingertips
    if (this.bleedT > 0) {
      this.bleedT -= dt;
      if (Math.random() < dt * 14) {
        const p = Math.random() < 0.5 ? sock(f, 'palm.R') : f.center();
        BloodSpray.of(g).spawn(p.x + (Math.random() - 0.5) * 0.2, p.y, p.z + (Math.random() - 0.5) * 0.2, 0, -0.5, 0, 0.045, 0.8, 0.7);
      }
    }
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
      // the giggle: the dead nearby twitch (dark motes off the corpses she keeps)
      for (const c of this.corpses) if (c.pos.distanceTo(f.pos) < 20 && Math.random() < dt * 6) g.engine.glow.spawn({ x: c.pos.x + (Math.random() - 0.5), y: c.pos.y + 0.2, z: c.pos.z + (Math.random() - 0.5), vy: 1.6, size: 0.18, sizeEnd: 0.04, life: 0.7, r: 0.6, g: 0.36, b: 0.95, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
    const dashing = f.dashT > 0;
    if (dashing && !this.wasDashing) hirenkyakuPuff(g, f, TINT);
    if (dashing) hirenkyakuStreak(g, f, TINT);
    this.wasDashing = dashing;
    this.spread(dt);
    this.gather();
    this.tend(dt);
    this.pull(dt);
    if (this.form === 'azhalbiora') {
      this.azhT -= dt;
      vollFlight(g, f, this.target(), 2);
      const tg = this.target();
      if (this.diveT > 0 && (this.diveT -= dt) > 0 && tg) f.mountVy = Math.max(-14, Math.min(4, (tg.pos.y + 0.2 - f.pos.y) * 7));
      if (this.azhT <= 0) this.leaveAzhalbiora();
    }
  }

  /** the blood spreading (or ebbing) in everyone it is in, and the colour of it in their skin */
  private spread(dt: number): void {
    for (const [o, v] of this.inf) {
      if (o.dead || !this.g.fighters.includes(o)) {
        this.inf.delete(o);
        continue;
      }
      const n = v >= 0.5 ? Math.min(1, v + 0.035 * dt) : v - 0.01 * dt;
      if (n <= 0) {
        this.inf.delete(o);
        infectionTint(o, 0);
        continue;
      }
      this.inf.set(o, n);
      infectionTint(o, n * 0.85);
      // full: the blood beads on the skin
      if (n >= 1 && Math.random() < dt * 3) {
        const c = o.center();
        BloodSpray.of(this.g).spawn(c.x + (Math.random() - 0.5) * 0.4, c.y + (Math.random() - 0.3) * 0.6, c.z + (Math.random() - 0.5) * 0.4, 0, -0.3, 0, 0.04, 0.6, 0.9);
      }
    }
  }

  /** the dead she keeps: whoever falls near her (not her own) */
  private gather(): void {
    const { f, g } = this;
    for (const o of g.fighters) {
      if (!o.dead || o === f || this.seen.has(o)) continue;
      this.seen.add(o);
      if (o.data.zombieOf === f || o.def.id === SKELETON_DEF.id || o.pos.distanceTo(f.pos) > 40) continue;
      this.corpses.push({ id: o.def.id, def: o.def, pos: o.pos.clone(), t: g.time, rostered: rostered(o) });
      if (this.corpses.length > 6) this.corpses.shift();
    }
    for (let i = this.corpses.length - 1; i >= 0; i--) if (g.time - this.corpses[i].t > 90) this.corpses.splice(i, 1);
  }

  /** her zombies: the fallen let go (and kept from her for a while), the near ones mended with flesh from the dead */
  private tend(dt: number): void {
    const { f, g } = this;
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];
      if (z.f.dead || !g.fighters.includes(z.f)) {
        // smashed: it cannot be called again for a while
        if (STORE.includes(z.id)) this.storeCd[z.id] = 30;
        this.zombies.splice(i, 1);
        continue;
      }
      if (z.f.pos.distanceTo(f.pos) < 6) z.f.hp = Math.min(z.f.maxHp, z.f.hp + z.f.maxHp * 0.02 * dt);
    }
    // the Dead Boys: smashed ones throw their bones back at whoever broke them
    for (let i = this.skeletons.length - 1; i >= 0; i--) {
      const s = this.skeletons[i];
      if (!s.dead && g.fighters.includes(s)) continue;
      this.skeletons.splice(i, 1);
      if (s.data.expired) continue;
      const by = s.lastHurt.from;
      if (by && !by.dead && by.team !== f.team && by.pos.distanceTo(s.pos) < 12) g.addProjectile(new BonePin(g, f, s.center(), by, 0.35, 1.6));
    }
  }

  /** the puppets: turned on their own side, or made to hurt themselves */
  private pull(dt: number): void {
    const { f, g } = this;
    for (const o of g.fighters) {
      if (o.puppetBy !== f || o.puppetT <= 0 || o.dead) {
        this.puppetClock.delete(o);
        continue;
      }
      o.iffT = Math.max(o.iffT, 0.3);
      o.iffFrom = f.pos;
      let prey: Fighter | null = null, pd = 30;
      for (const x of g.fighters) {
        if (x === o || x.dead || x.team !== o.team || x.puppetBy === f) continue;
        const d = x.pos.distanceTo(o.pos);
        if (d < pd) { pd = d; prey = x; }
      }
      let clock = (this.puppetClock.get(o) ?? 0.5) - dt;
      if (prey) {
        // its own friends, now its enemies
        o.faceTarget = prey.center();
        _v.subVectors(prey.pos, o.pos).setY(0);
        if (_v.length() > 2) o.wish.copy(_v.normalize());
        else {
          o.wish.set(0, 0, 0);
          if (clock <= 0) {
            clock = 0.6;
            (o.data.kit as Kit | undefined)?.attack();
          }
        }
      } else {
        // no one of its own to turn on: it turns its weapon on itself
        o.wish.set(0, 0, 0);
        o.faceTarget = f.center();
        if (clock <= 0) {
          clock = 1.2;
          this.selfBlow(o, 0.04, 24, 0.7);
        }
      }
      this.puppetClock.set(o, clock);
    }
  }

  /** a body made to drive its own weapon into its chest: k of its life (at least min) */
  private selfBlow(o: Fighter, k: number, min: number, hold: number): void {
    const { f, g } = this;
    registerReactions(o.anim);
    o.stopAction();
    o.hitstun = Math.max(o.hitstun, hold);
    o.anim.play('puppet_stab', { hold: true });
    g.addProjectile(new Later([
      [0.25, () => {
        if (o.dead) return;
        const c = o.center();
        g.damage(o, Math.max(min, o.maxHp * k), f, o.forward().negate(), { knock: 0, unblockable: true, hitstop: 0.06, color: BLOOD_FRESH });
        bloodBurst(g, c, o.forward(), 16, 4);
      }],
      [hold, () => { if (!o.dead && o.anim.isPlaying('puppet_stab')) o.anim.stopAll(0.3); }],
    ]));
  }

  target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 90, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 90);
  }

  private near(range: number): Fighter | null {
    const t = this.target();
    return t && t.pos.distanceTo(this.f.pos) <= range ? t : null;
  }

  private aimAt(from: THREE.Vector3): THREE.Vector3 {
    const t = this.target();
    if (t) return t.center().sub(from).normalize();
    return this.f.forward(new THREE.Vector3());
  }

  private zombieNear(range: number): Fighter | null {
    let best: Fighter | null = null, bd = range;
    for (const z of this.zombies) {
      const d = z.f.pos.distanceTo(this.f.pos);
      if (!z.f.dead && d < bd) { bd = d; best = z.f; }
    }
    return best;
  }

  private get cap(): number {
    return this.form === 'azhalbiora' ? 3 : 2;
  }

  // ---------------------------------------------------------------- the string

  /** a slap, a kick, a tail: the nearest enemy in front within reach; her blood on it if she bleeds */
  private strike(range: number, dmg: number, o: { knock?: number; launch?: number; heavy?: boolean; arc?: number } = {}): Fighter | null {
    const { f, g } = this;
    const fw = f.forward();
    let best: Fighter | null = null, bd = Infinity;
    for (const e of g.enemiesOf(f)) {
      if (e.dead) continue;
      _v.subVectors(e.pos, f.pos).setY(0);
      const d = _v.length();
      // flying (Azhalbiora) she hangs above whoever she fights: the tail and the wings reach down
      if (d > range + e.def.radius || (d > 0.3 && _v.normalize().dot(fw) < (o.arc ?? 0.35)) || Math.abs(e.pos.y - f.pos.y) > (this.form === 'azhalbiora' ? 3.4 : 2)) continue;
      if (d < bd) { bd = d; best = e; }
    }
    if (!best) return null;
    g.damage(best, dmg, f, fw, { knock: o.knock ?? 4, launch: o.launch ?? 0, heavy: o.heavy, hitstop: o.heavy ? 0.1 : 0.05, shake: o.heavy ? 0.3 : 0.12 });
    if (this.bleedT > 0) {
      this.dose(best, 0.04);
      bloodBurst(g, best.center(), fw, 6, 3);
    }
    return best;
  }

  /** a sweep of bone light round her at hip height (the tail and the wings) */
  private boneArc(from: number, to: number, r: number, y = 0.8): void {
    const { f, g } = this;
    const c = new THREE.Color(AZHAL_LIGHT);
    for (let i = 0; i <= 14; i++) {
      const a = f.yaw + from + (to - from) * (i / 14);
      const x = f.pos.x + Math.sin(a) * r, z = f.pos.z + Math.cos(a) * r;
      g.engine.glow.spawn({ x, y: f.pos.y + y, z, vx: Math.cos(a) * 2 * Math.sign(to - from), vy: 0, vz: -Math.sin(a) * 2 * Math.sign(to - from), size: 0.2, sizeEnd: 0.04, life: 0.22, r: c.r, g: c.g, b: c.b, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: 2 });
    }
  }

  attack(): void {
    const { f, g } = this;
    const cur = f.action;
    if (cur instanceof StrikeAction && (GISELLE_CHAIN.includes(cur.clip) || AZHALBIORA_CHAIN.includes(cur.clip))) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (g.time - this.lastEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const { f, g } = this;
    const azh = this.form === 'azhalbiora';
    const list = azh ? AZHALBIORA_CHAIN : GISELLE_CHAIN;
    const idx = i % list.length;
    const clip = list[idx];
    this.comboIndex = idx + 1;
    this.lastEnd = g.time + 0.65;
    const on = (n: string): void => {
      if (n !== 'hit') return;
      if (!azh) {
        if (clip === 'gg_slap') this.strike(1.6, 7, { knock: 3 });
        else if (clip === 'gg_back') this.strike(1.6, 7, { knock: 3 });
        else if (clip === 'gg_kick') this.strike(1.8, 9, { knock: 4, launch: 2 });
        else this.strike(1.8, 12, { knock: 10, heavy: true });
        return;
      }
      if (clip === 'gz_tail1') {
        this.boneArc(1.4, -1.4, 2.4);
        this.strike(2.8, 14, { knock: 5, arc: -0.2 });
      } else if (clip === 'gz_wing') {
        this.boneArc(-0.9, 0.9, 2.2, 1.3);
        this.strike(2.6, 14, { knock: 5 });
      } else if (clip === 'gz_tail2') {
        this.boneArc(-1.4, 1.4, 2.4);
        this.strike(2.8, 16, { knock: 6, arc: -0.2 });
      } else {
        // the tail brought down overhead: the ground cracks under it
        const hit = this.strike(3.0, 28, { knock: 16, launch: 4, heavy: true });
        g.groundImpact(f.pos.clone().addScaledVector(f.forward(), hit ? hit.pos.distanceTo(f.pos) : 2.6), 1.6, 500, AZHAL, f);
      }
    };
    f.act(new StrikeAction(this, clip, idx, on, azh ? 1.8 : 1.1), true);
  }

  // ---------------------------------------------------------------- the moves

  private special(a: FighterAction, cost: number, cdKey: keyof typeof this.cd, cd: number): boolean {
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

  /** RMB: Bait; Azhalbiora: Munchy Munchy Babies */
  heavy(): void {
    const { f, g } = this;
    if (this.form === 'azhalbiora') {
      this.munchy();
      return;
    }
    if (this.cd.bait > 0 || (f.action && !(f.action instanceof StrikeAction)) || f.hitstun > 0 || f.dead) return;
    this.bait = new BaitAction(this);
    if (!f.act(this.bait, true)) this.bait = null;
    else if (f === g.player || Math.random() < 0.5) g.callout('', ['P-please don\'t hurt me…', 'I didn\'t do anything!', 'Help… I\'m scared…'][Math.floor(Math.random() * 3)], '#E8D8FF');
  }

  /** Q: Finger Bite — the thumb bitten, a fan of blood flung; Azhalbiora: Dancing Dead Boys Club */
  skill1(): void {
    const { f, g } = this;
    if (this.form === 'azhalbiora') {
      this.dance();
      return;
    }
    this.special(new ClipSkill('bite', 'gg_bite', (n) => {
      if (n === 'bite') {
        this.bleedT = Math.max(this.bleedT, 6);
        bloodBurst(g, sock(f, 'thumb.R'), null, 8, 1.5);
        g.sfx.play('hit', f.center(), 0.4);
      }
      if (n !== 'fling') return;
      const from = sock(f, 'palm.R');
      const t = this.target();
      const flat = t ? _v.subVectors(t.pos, f.pos).setY(0) : f.forward(_v);
      const dist = t ? Math.min(9, Math.max(2, flat.length())) : 6;
      flat.normalize();
      const side = new THREE.Vector3(-flat.z, 0, flat.x);
      const vels: THREE.Vector3[] = [];
      for (let i = 0; i < 12; i++) {
        const spread = (i / 11 - 0.5) * 0.9 + (Math.random() - 0.5) * 0.12;
        const s = 9 + Math.random() * 5;
        // aimed to land about where the target stands
        const up = Math.max(1.5, Math.min(6, (15 * dist) / (2 * s) - 0.8)) + (Math.random() - 0.5) * 1.2;
        vels.push(flat.clone().addScaledVector(side, spread).normalize().multiplyScalar(s).setY(up));
      }
      g.addProjectile(new BloodDrops(g, f, from, vels, 4, (o) => this.dose(o, 0.07), this.pool()));
      g.sfx.play('swing', from, 0.7);
    }, { mobility: 0.2 }), 10, 'bite', 4);
  }

  /** E: Command — "Die!" to the fully infected, "Kneel!" to the half, "Attack!" to her dead */
  skill2(): void {
    const { f, g } = this;
    this.special(new ClipSkill('command', 'gg_command', (n) => {
      if (n !== 'order') return;
      let died = 0, knelt = 0;
      for (const o of g.enemiesOf(f)) {
        if (o.dead || o.pos.distanceTo(f.pos) > 40) continue;
        const v = this.infection(o);
        if (v >= 1) {
          died++;
          this.inf.set(o, 0.6);
          if (o.maxHp <= 300 && !o.def.boss) {
            this.selfBlow(o, 1, 9999, 0.6);
            continue;
          }
          this.selfBlow(o, 0.2, 60, 1.2);
        } else if (v >= 0.5) {
          knelt++;
          this.inf.set(o, v - 0.15);
          registerReactions(o.anim);
          o.stopAction();
          o.hitstun = Math.max(o.hitstun, 1.0);
          o.anim.play('weighed_kneel', { hold: true });
          g.addProjectile(new Later([[1.0, () => { if (!o.dead && o.anim.isPlaying('weighed_kneel')) o.anim.stopAll(0.3); }]]));
        }
      }
      // her dead go for the throat
      const t = this.target();
      let sent = 0;
      for (const z of this.zombies) {
        if (z.f.dead || !t) continue;
        sent++;
        z.f.faceTarget = t.center();
        z.f.push.addScaledVector(_v.subVectors(t.pos, z.f.pos).setY(0).normalize(), 14);
        (z.f.data.kit as Kit | undefined)?.attack();
      }
      g.callout('', died ? 'DIE!' : knelt ? 'KNEEL!' : sent ? 'ATTACK!' : 'Hmm~? No one\'s listening…', died || knelt ? BLOOD_FRESH : AZHAL);
      if (died) g.sfx.play('roar', f.center(), 0.5);
    }, { mobility: 0.1 }), 14, 'command', 8);
  }

  /** R: Raise — the fully infected made puppets, else a corpse raised, else one of the stored dead called up */
  skill3(): void {
    const { f, g } = this;
    if (this.cd.raise > 0 || f.busy) return;
    const puppets = g.enemiesOf(f).filter((o) => !o.dead && this.infection(o) >= 1 && o.pos.distanceTo(f.pos) < 25);
    const corpse = this.corpses.filter((c) => c.pos.distanceTo(f.pos) < 25).sort((a, b) => a.pos.distanceTo(f.pos) - b.pos.distanceTo(f.pos))[0] ?? null;
    const stored = this.nextStored();
    const room = this.zombies.length < this.cap;
    if (!puppets.length && !(room && (corpse || stored))) {
      if (f === g.player) g.hud?.showBanner(room ? 'No one to raise' : 'Too many already');
      return;
    }
    this.special(new ClipSkill('raise', 'gg_raise', (n) => {
      if (n === 'down') g.addProjectile(new ShadowGate(g, f.pos.clone(), 1.4, 0.7));
      if (n !== 'rise') return;
      if (puppets.length) {
        for (const o of puppets) this.puppet(o, 5);
        g.callout('', 'Dance for me~', BLOOD_FRESH);
        return;
      }
      if (corpse) {
        this.corpses.splice(this.corpses.indexOf(corpse), 1);
        this.raiseCorpse(corpse);
        return;
      }
      if (stored) this.callStored(stored);
    }, { mobility: 0 }), 20, 'raise', 12);
  }

  /** someone fully infected made a puppet for dur seconds */
  private puppet(o: Fighter, dur: number): void {
    const { f, g } = this;
    o.stopAction();
    o.puppetT = Math.max(o.puppetT, dur);
    o.puppetBy = f;
    this.inf.set(o, Math.min(this.infection(o), 0.6));
    this.puppetClock.set(o, 0.5);
    bloodBurst(g, o.center(), null, 14, 2.5);
    if (o === g.player) g.hud?.showBanner('Your body won\'t listen — mash G!', 2.2);
  }

  private nextStored(): string | null {
    for (let k = 0; k < STORE.length; k++) {
      const id = STORE[(this.storeNext + k) % STORE.length];
      if ((this.storeCd[id] ?? 0) > 0 || this.zombies.some((z) => z.id === id)) continue;
      if (!rosterById(id)) continue;
      return id;
    }
    return null;
  }

  /** a spot beside her (on the ground) for a zombie to climb out at */
  private spot(k: number): THREE.Vector3 {
    const f = this.f;
    const a = f.yaw + Math.PI / 2 + k * 0.9;
    return f.pos.clone().add(_v.set(Math.sin(a) * 2.6, 0.2, Math.cos(a) * 2.6));
  }

  /** one of the stored dead climbs out of her shadow */
  private callStored(id: string): Fighter | null {
    const z = this.raise(id, this.spot(this.zombies.length), 0.5);
    if (z) this.storeNext = (STORE.indexOf(id) + 1) % STORE.length;
    return z;
  }

  private raiseCorpse(c: Corpse): Fighter | null {
    const { f, g } = this;
    if (c.rostered) return this.raise(c.id, c.pos.clone().setY(c.pos.y + 0.2), 0.55);
    // a Hollow: hard to keep — it crumbles after a while
    const h = g.spawn({ ...c.def, name: `${c.def.name} (zombie)`, hp: Math.round(c.def.hp * 0.6) }, c.pos.clone().setY(c.pos.y + 0.2), f.team);
    h.data.zombieOf = f;
    g.controllers.push(new ZombieAI(g, h, new HollowAI(g, h), f, 25));
    infectionTint(h, 1);
    this.zombies.push({ f: h, id: c.id });
    g.addProjectile(new ShadowGate(g, h.pos.clone(), 1.6, 1.0));
    return h;
  }

  /** a roster character raised on her side: its whole kit under a duel AI, reddened */
  private raise(id: string, at: THREE.Vector3, hpK: number): Fighter | null {
    const { f, g } = this;
    const entry = rosterById(id);
    if (!entry) return null;
    const def = entry.def();
    const z = g.spawn({ ...def, name: `${def.name} (zombie)`, hp: Math.max(60, Math.round(def.hp * hpK)) }, at, f.team);
    z.yaw = f.yaw;
    z.data.zombieOf = f;
    const kit = entry.kit(z, g);
    // raised before death (Hitsugaya): no will of its own, flawless reflexes
    const ai = new DuelistAI(g, z, kit, { aggression: id === 'hitsugaya-tybw' ? 1 : 0.8, intro: 0.3 });
    g.controllers.push(new ZombieAI(g, z, ai, f));
    infectionTint(z, 1);
    this.zombies.push({ f: z, id });
    g.addProjectile(new ShadowGate(g, at, 1.3, 1.1));
    bloodBurst(g, at.clone().setY(at.y + 0.6), null, 20, 3);
    const m = MUMBLE[id];
    g.callout('', m ? `${def.name}: “${m}”` : `${def.name.toUpperCase()} — RISE`, BLOOD_FRESH);
    g.sfx.play('crumble', at, 0.8);
    return z;
  }

  /** G: Drink from a zombie at hand (she is hurt); else the bone bow. Azhalbiora: Sklaverei */
  toggle(): void {
    const { f, g } = this;
    if (this.form === 'azhalbiora') {
      this.sklaverei();
      return;
    }
    const z = this.zombieNear(3);
    if (z && f.hp < f.maxHp * 0.9 && this.cd.drink <= 0) {
      let drunk = 0;
      this.special(new ClipSkill('drink', 'gg_drink', (n) => {
        if (n === 'sip') g.callout('', `${z.name.replace(' (zombie)', '')}: “Gigi… it hurts…”`, BLOOD_FRESH);
      }, {
        mobility: 0,
        tick: (t, dt) => {
          if (t < 0.25 || z.dead) return;
          const take = Math.min(z.hp - 1, f.maxHp * 0.22 * (dt / 0.6));
          if (take <= 0 || drunk >= f.maxHp * 0.22) return;
          z.hp -= take;
          f.hp = Math.min(f.maxHp, f.hp + take);
          drunk += take;
          f.faceTarget = z.center();
          if (Math.random() < 0.5) {
            const c = z.center();
            BloodSpray.of(g).spawn(c.x, c.y + 0.3, c.z, (f.pos.x - c.x) * 2, 1.5, (f.pos.z - c.z) * 2, 0.05, 0.4, 1);
          }
        },
      }), 0, 'drink', 10);
      return;
    }
    this.bow();
  }

  /** the bone bow out of the heart case: three skull arrows that bite (and dose) */
  private bow(): void {
    const { f, g } = this;
    this.special(new ClipSkill('bow', 'gg_bow', (n) => {
      if (n === 'pop') {
        const h = sock(f, 'heart');
        for (let i = 0; i < 6; i++) g.engine.glow.spawn({ x: h.x, y: h.y, z: h.z, vy: 3 + Math.random() * 2, size: 0.2, sizeEnd: 0.04, life: 0.3, r: 0.4, g: 0.6, b: 1, alpha: 1, alphaEnd: 0, tex: 0 });
        g.sfx.play('ting', h, 0.7);
      }
      if (n === 'catch') {
        f.visual.attach('bow', giselleProp('bow'), 'grip.L');
        this.hands();
      }
      if (n[0] === 'a') {
        const bow = f.visual.props.get('bow');
        const from = bow ? bow.getWorldPosition(new THREE.Vector3()) : sock(f, 'grip.L');
        const dir = this.aimAt(from).applyAxisAngle(new THREE.Vector3(0, 1, 0), (Number(n[1]) - 1) * 0.05);
        g.addProjectile(new SkullArrow(g, f, from.addScaledVector(dir, 0.4), dir, 16, (o) => this.dose(o, 0.12)));
      }
    }, {
      mobility: 0.2,
      end: () => {
        f.visual.detach('bow');
        this.hands();
      },
    }), 12, 'bow', 4);
  }

  // ---------------------------------------------------------------- Azhalbiora

  /** RMB: Munchy Munchy Babies — skulls bloom over her fists and she charges; they bite */
  private munchy(): void {
    const { f, g } = this;
    const scale = this.sklav ? 2.6 : 2.0;
    let bit = 0;
    this.special(new ClipSkill('munchy', 'gz_munchy', (n) => {
      if (n === 'bloom') {
        for (const k of ['L', 'R']) f.visual.attach(`skull.${k}`, giselleProp('skull'), `knuckle.${k}`).scale.setScalar(scale);
        this.hands();
        g.callout('', 'MANCHI MANCHI BEBĪSU!', AZHAL);
        g.sfx.play('charge', f.center(), 0.6);
      }
      if (n === 'go') {
        // the charge, diving onto the target if she hangs above it
        f.push.addScaledVector(f.forward(), 18);
        this.diveT = 0.45;
      }
    }, {
      mobility: 0.15,
      armor: 0.3,
      tick: (t) => {
        // the skulls snap at whoever the charge reaches, twice
        if (t < 0.36 || bit >= 2) return;
        const hit = this.strike(this.sklav ? 2.0 : 1.7, 30, { knock: bit ? 10 : 2, heavy: bit === 1 });
        if (!hit) return;
        bit++;
        this.dose(hit, 0.25);
        bloodBurst(g, hit.center(), f.forward(), 10, 3);
        g.sfx.play('crumble', hit.center(), 0.6);
        if (bit === 1) {
          f.push.x = 0;
          f.push.z = 0;
        }
      },
      end: () => {
        f.visual.detach('skull.L');
        f.visual.detach('skull.R');
        this.hands();
      },
    }), 16, 'munchy', 5);
  }

  /** Q: Dancing Dead Boys Club — bones shaken out of the wings, four cartoon skeletons that dance at the target */
  private dance(): void {
    const { f, g } = this;
    this.special(new ClipSkill('dance', 'gz_dance', (n) => {
      if (n === 'shake') {
        g.addProjectile(new BoneRattle(g, f.center().add(_v.set(0, 0.6, 0)), 12, 1.4));
        g.sfx.play('crumble', f.center(), 0.5);
      }
      if (n !== 'spawn') return;
      g.callout('', 'DANSHINGU DEDDO BOISU KURABU!', AZHAL);
      for (const s of this.skeletons) if (!s.dead) {
        s.data.expired = true;
        g.kill(s, null, _v.set(0, 0, 0));
      }
      const t = this.target();
      for (let i = 0; i < 4; i++) {
        const a = f.yaw + (i - 1.5) * 0.7;
        const at = f.pos.clone().add(_v.set(Math.sin(a) * 2.2, 0.3, Math.cos(a) * 2.2));
        if (f.pos.y > 1 && !f.grounded) at.y = f.pos.y;
        const s = g.spawn({ ...SKELETON_DEF, speed: { ...SKELETON_DEF.speed } }, at, f.team);
        s.yaw = f.yaw;
        s.data.zombieOf = f;
        const kit = new SkeletonKit(s, g);
        g.controllers.push(new ZombieAI(g, s, new DuelistAI(g, s, kit, { aggression: 1, intro: 0 }), f, 8));
        if (t) s.faceTarget = t.center();
        this.skeletons.push(s);
        g.engine.glow.spawn({ x: at.x, y: at.y + 0.6, z: at.z, size: 0.8, sizeEnd: 1.6, life: 0.3, r: 0.6, g: 0.36, b: 0.95, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
      }
    }, { mobility: 0.1 }), 24, 'dance', 12);
  }

  /** G in Azhalbiora: Sklaverei — two seconds drinking the reishi round her; the bones rain off her wings */
  private sklaverei(): void {
    const { f, g } = this;
    let acc = 0, drank = 0;
    this.special(new ClipSkill('sklaverei', 'gz_sklav', (n) => {
      if (n === 'start') g.callout('聖隷', 'SKLAVEREI', AZHAL);
    }, {
      mobility: 0,
      armor: 0.3,
      dur: 2.0,
      tick: (t, dt) => {
        if (t < 0.2) return;
        f.rooted = true;
        acc += dt;
        while (acc >= 0.1) {
          acc -= 0.1;
          const bites = sklaverei(g, f, 3, 6);
          drank += bites;
          this.azhT = Math.min(AZHAL_TIME, this.azhT + bites * 0.3);
          f.hp = Math.min(f.maxHp, f.hp + bites * 1.5);
        }
        if (Math.random() < dt * 3) g.addProjectile(new BoneRattle(g, f.center().add(_v.set(0, 1, 0)), 2, 1.2));
      },
      end: () => {
        f.rooted = false;
        if (drank > 0 && !this.sklav && this.form === 'azhalbiora') {
          this.sklav = true;
          this.rebody();
        }
      },
    }), 0, 'sklav', 14);
  }

  /** F in Azhalbiora: Dead March — every stored dead called up at once, the half infected all taken */
  private march(): void {
    const { f, g } = this;
    this.special(new ClipSkill('march', 'gz_march', (n) => {
      if (n !== 'rise') return;
      g.callout('死者の行進', 'DEAD MARCH', BLOOD_FRESH);
      g.shake(f === g.player ? 0.5 : 0.2);
      g.addProjectile(new ShadowGate(g, f.pos.clone(), 6, 1.6));
      // the half infected become puppets
      for (const o of g.enemiesOf(f)) if (!o.dead && this.infection(o) >= 0.5 && o.pos.distanceTo(f.pos) < 40) this.puppet(o, 6);
      // the dead rise: the fresh corpses first, then the stored, four in all
      let k = 0;
      while (this.zombies.length < 4 && this.corpses.length) {
        const c = this.corpses.shift()!;
        if (c.pos.distanceTo(f.pos) < 40) this.raiseCorpse(c);
      }
      for (let guard = 0; guard < STORE.length && this.zombies.length < 4; guard++) {
        const id = this.nextStored();
        if (!id) break;
        const z = this.raise(id, this.spot(k++), 0.5);
        if (!z) break;
        this.storeNext = (STORE.indexOf(id) + 1) % STORE.length;
      }
    }, { mobility: 0, armor: 0.5 }), 50, 'march', 30);
  }

  /** F: Azhalbiora; in it, Dead March */
  release(): void {
    const { f, g } = this;
    if (this.form === 'azhalbiora') {
      this.march();
      return;
    }
    if (this.azhCd > 0) {
      if (f === g.player) g.hud?.showBanner('Not yet');
      return;
    }
    if (f.busy) return;
    if (!f.spendRei(50)) {
      if (f === g.player) g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    // the burst on the action's own clock (and still, if something cuts the release off late)
    let burst = false, at = 0;
    const go = () => {
      if (burst) return;
      burst = true;
      this.becomeAzhalbiora();
    };
    f.act(new ClipSkill('release', 'gg_release', () => {}, {
      invulnerable: true,
      mobility: 0,
      tick: (t) => {
        at = t;
        if (t >= 0.6) go();
      },
      end: () => { if (at >= 0.45 && !f.dead) go(); },
    }), true);
  }

  private rebody(): void {
    const { f } = this;
    const z = this.form === 'azhalbiora';
    f.def = { ...f.def, stance: z ? AZHALBIORA_STANCE : GISELLE_STANCE, clips: z ? AZHALBIORA_CLIPS : GISELLE_CLIPS };
    f.setForm({ asset: giselleAsset(z ? (this.sklav ? 'sklaverei' : 'azhalbiora') : 'base'), props: this.props() }, z ? AURA_AZHAL : AURA_ZOMBIE);
    this.hands();
  }

  private becomeAzhalbiora(): void {
    const { f, g } = this;
    if (this.form === 'azhalbiora') return;
    this.form = 'azhalbiora';
    this.azhT = AZHAL_TIME;
    this.sklav = false;
    f.rooted = false;
    f.slowT = 0;
    f.def = { ...f.def, speed: { ...SPEED_AZHAL } };
    this.rebody();
    const c = f.center();
    for (const e of g.enemiesOf(f)) {
      if (e.dead || e.center().distanceTo(c) > 6 + e.def.radius) continue;
      g.damage(e, 40, f, e.pos.clone().sub(f.pos).setY(0).normalize(), { energy: true, knock: 14, launch: 5, heavy: true, color: AZHAL });
    }
    g.addProjectile(new LightPillar(g, f.pos.clone(), 1.4, 70, AZHAL));
    g.addProjectile(new BoneRattle(g, c.clone().add(_v.set(0, 1.2, 0)), 14, 2.2));
    f.aura.pillarBurst(2.2);
    f.aura.flare(2, 1);
    g.addRing(f.pos.clone(), 10, AZHAL, 0.5);
    g.shake(f === g.player ? 0.5 : 0.2);
    g.callout('神の死', 'QUINCY: VOLLSTÄNDIG — AZHALBIORA', AZHAL);
    g.sfx.play('bankai', f.center());
    this.applyStats();
  }

  private leaveAzhalbiora(): void {
    const { f } = this;
    this.form = 'base';
    this.azhCd = AZHAL_CD;
    this.sklav = false;
    f.mounted = false;
    f.rooted = false;
    f.def = { ...f.def, speed: { ...SPEED } };
    this.rebody();
    this.applyStats();
    // she hates how tiring it is
    if (f === this.g.player) this.g.callout('', 'Haah… so tiring…', AZHAL);
  }

  private applyStats(): void {
    const f = this.f;
    const z = this.form === 'azhalbiora';
    f.power = (z ? 1.3 : 1) * (this.flare ? 1.2 : 1);
    // the second-best Blut of the Bambies
    f.damageTaken = z ? 0.85 : 0.9;
    f.toughness = z ? 6 : 4;
    f.aura.target = this.flare ? 0.85 : z ? 0.45 : 0.05;
  }

  toggleFlare(): void {
    this.flare = !this.flare;
    this.applyStats();
    if (this.flare) {
      this.f.aura.flare(1.6, 0.4);
      this.g.shake(0.2);
      this.g.sfx.play('flare', this.f.center());
      this.g.callout('', 'Ehehehe~', AZHAL);
    }
  }

  formName(): string {
    const t = this.target();
    const inf = t ? ` · ${t.name.split(' ')[0]} ${Math.round(this.infection(t) * 100)}%` : '';
    const dead = this.zombies.length ? ` · dead ${this.zombies.length}` : '';
    if (this.form === 'azhalbiora') return `Azhalbiora${this.sklav ? ' (Sklaverei)' : ''} · ${Math.max(0, Math.ceil(this.azhT))} s${inf}${dead}`;
    return `Sternritter "Z" — The Zombie${inf}${dead}`;
  }

  ai(): KitAI {
    const base = () => this.form === 'base';
    const azh = () => this.form === 'azhalbiora';
    const hpK = () => this.f.hp / this.f.maxHp;
    const t = () => this.target();
    const full = () => this.g.enemiesOf(this.f).some((o) => !o.dead && this.infection(o) >= 1);
    const half = () => this.g.enemiesOf(this.f).some((o) => !o.dead && this.infection(o) >= 0.5);
    const canRaise = () => full() || (this.zombies.length < this.cap && (this.corpses.length > 0 || this.nextStored() !== null));
    return {
      reach: 1.5,
      chain: 4,
      releaseAt: 0.55,
      // she keeps behind her dead
      ranged: () => this.zombies.length > 0 || hpK() < 0.4,
      opener: () => this.heavy(),
      // below a quarter she runs and lets the dead fight
      goal: () => {
        const tg = t();
        if (!tg || hpK() > 0.25) return null;
        _w.subVectors(this.f.pos, tg.pos).setY(0).normalize().multiplyScalar(12).add(this.f.pos);
        return { x: _w.x, z: _w.z };
      },
      moves: [
        { name: 'raise', use: () => this.skill3(), min: 0, max: 60, weight: 6, cd: 4, when: canRaise },
        { name: 'command', use: () => this.skill2(), min: 0, max: 40, weight: 8, cd: 2, when: () => full() || (half() && Math.random() < 0.3) },
        { name: 'bait', use: () => this.heavy(), min: 0, max: 2.4, weight: 3, cd: 4, when: base },
        { name: 'bite', use: () => this.skill1(), min: 2, max: 8, weight: 3, cd: 4, when: base },
        { name: 'drink', use: () => this.toggle(), min: 0, max: 40, weight: 6, cd: 6, when: () => base() && hpK() < 0.7 && !!this.zombieNear(3) },
        { name: 'bow', use: () => this.toggle(), min: 6, max: 34, weight: 1.6, cd: 4, when: () => base() && !this.zombieNear(3) },
        { name: 'munchy', use: () => this.heavy(), min: 1.5, max: 7, weight: 2.6, cd: 5, when: azh },
        { name: 'dance', use: () => this.skill1(), min: 2, max: 20, weight: 2, cd: 10, when: azh },
        { name: 'sklav', use: () => this.toggle(), min: 8, max: 60, weight: 1, cd: 14, when: () => azh() && this.azhT < 14 },
        { name: 'march', use: () => this.release(), min: 0, max: 60, weight: 3, cd: 20, when: () => azh() && (half() || this.corpses.length > 0 || this.zombies.length < 2) },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    const z = this.zombieNear(3) && this.f.hp < this.f.maxHp * 0.9;
    if (this.form === 'azhalbiora') {
      return [
        { key: 'LMB', name: 'Bones', kanji: '骨' },
        { key: 'RMB', name: 'Munchy Munchy Babies', kanji: '髑髏', cost: 16, cd: cd.munchy, cdMax: 5, tint: AZHAL },
        { key: 'Q', name: 'Dancing Dead Boys Club', kanji: '骸踊', cost: 24, cd: cd.dance, cdMax: 12, tint: AZHAL },
        { key: 'E', name: 'Command', kanji: '命', cost: 14, cd: cd.command, cdMax: 8, tint: BLOOD_FRESH },
        { key: 'R', name: 'Raise', kanji: '蘇', cost: 20, cd: cd.raise, cdMax: 12, tint: BLOOD_FRESH },
        { key: 'G', name: 'Sklaverei', kanji: '聖隷', cd: cd.sklav, cdMax: 14, tint: AZHAL },
        { key: 'F', name: 'Dead March', kanji: '行進', cost: 50, cd: cd.march, cdMax: 30, active: true, timer: this.azhT / AZHAL_TIME, tint: AZHAL },
        { key: 'Shift', name: 'Hirenkyaku', kanji: '飛廉脚', cost: 4 },
        { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      ];
    }
    return [
      { key: 'LMB', name: 'Slaps', kanji: '拳' },
      { key: 'RMB', name: 'Bait', kanji: '餌', cd: cd.bait, cdMax: 5, active: !!this.bait, tint: BLOOD_FRESH },
      { key: 'Q', name: 'Finger Bite', kanji: '血', cost: 10, cd: cd.bite, cdMax: 4, tint: BLOOD_FRESH },
      { key: 'E', name: 'Command', kanji: '命', cost: 14, cd: cd.command, cdMax: 8, tint: BLOOD_FRESH },
      { key: 'R', name: 'Raise', kanji: '蘇', cost: 20, cd: cd.raise, cdMax: 12, tint: BLOOD_FRESH },
      { key: 'G', name: z ? 'Drink' : 'Heilig Bogen', kanji: z ? '飲' : '神聖弓', cost: z ? 0 : 12, cd: z ? cd.drink : cd.bow, cdMax: z ? 10 : 4, tint: AZHAL },
      { key: 'F', name: 'Azhalbiora', kanji: '神の死', cost: 50, cd: this.azhCd, cdMax: AZHAL_CD, tint: AZHAL },
      { key: 'Shift', name: 'Hirenkyaku', kanji: '飛廉脚', cost: 4 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
    ];
  }
}
