// Askin Nakk Le Vaar's kit (docs/kits/askin.md). The Deathdealing: he sets the lethal dose of anything he has taken in.
// Every enemy carries a poison load (it drains life; at 1 the body gives out for a moment — "chimei-teki da ze"); he
// soaks up the reiatsu of whoever fights him and, after about a minute of it (sooner the harder they hit), becomes
// immune to it: their blows fizzle and the wounds they gave him close. LMB lazy blows and a finger-gun; RMB the Heilig
// Bogen out of his bracers; Q Gift Ball (a mine; Hybrid on the already poisoned); E Gift Bad (the pool that slashes
// tolerance); R Taste (licks their blood off his hand: their own blood turns lethal; or poisons the water in a soaked
// body; or a sip of café au lait); G Analyse (immune now); Shift's Lethal Step (a feigned death); a lethal blow only
// staggers him once in a while. F: Quincy: Vollständig — Hasshein (flight, the staff): Mass Gift Balls, Gift Ring
// (organ by organ), Gift Ball Deluxe (the dome; raise the concentration), Gift Bereich (no way out), the giant ball.
import * as THREE from 'three';
import { FighterAction, type Fighter, type FighterDef, type PropDef } from '../fighter';
import type { Game } from '../game';
import type { DamageOpts } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import type { AuraStyle } from '../../vfx/aura';
import { askinAsset, askinProp, STAFF_BALLS } from '../../chars/askin';
import { ASKIN_CHAIN, ASKIN_CLIPS, ASKIN_STANCE, HASSHEIN_CHAIN, HASSHEIN_CLIPS, HASSHEIN_STANCE } from '../../chars/askinClips';
import { registerReactions } from '../../chars/reactionClips';
import { GiantGiftBall, GiftBad, GiftBall, GiftBereich, GiftDeluxe, GiftRing, HASSHEIN, MIASMA, PfeilShot, VISOR, circleTrail, miasma, poisonTint } from '../../vfx/deathdealing';
import { LightPillar, veneFlash } from '../../vfx/heilig';
import { groundAt } from '../../vfx/iceArts';
import { TEX_GLOW } from '../../vfx/sprites';
import { hirenkyakuPuff, hirenkyakuStreak, vollFlight, type Rgb } from './sternritter';

export const AURA_ASKIN: AuraStyle = { core: '#F0E2FF', body: '#B88AF5', rim: '#5A2A8C' };
export const AURA_HASSHEIN: AuraStyle = { core: '#F4ECFF', body: '#9C5CEB', rim: '#4A1E88' };

const SPEED = { run: 9.6, sprint: 28, jump: 13, dash: 31, dashTime: 0.1 };
const SPEED_H = { run: 12, sprint: 36, jump: 14, dash: 40, dashTime: 0.1 };
const HASSHEIN_TIME = 40;
const HASSHEIN_CD = 25;
const TINT: Rgb = [0.75, 0.55, 1];
const PURPLE = MIASMA;

export const ASKIN_DEF: FighterDef = {
  id: 'askin',
  name: 'Askin Nakk Le Vaar',
  title: 'Sternritter "D" — The Deathdealing',
  build: () => ({ asset: askinAsset('base'), props: [] }),
  stance: ASKIN_STANCE,
  clips: ASKIN_CLIPS,
  aura: AURA_ASKIN,
  hp: 1200,
  rei: 230,
  speed: { ...SPEED },
  radius: 0.3,
  height: 1.87,
};

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

/** a stable number for an aura style: a fighter's reiatsu as he tastes it */
const styleIds = new WeakMap<object, number>();
let nextStyle = 1;
function styleId(f: Fighter): number {
  const s = f.aura.style as object;
  let id = styleIds.get(s);
  if (!id) styleIds.set(s, (id = nextStyle++));
  return id;
}

/** a Hollow's reiatsu (a released Arrancar, a mask on, a Hollowfied body): the one change Hasshein cannot follow */
function hollowBase(f: Fighter): boolean {
  const kit = f.data.kit as Kit | undefined;
  const name = kit?.formName?.() ?? '';
  return /hollow|mask|resurrec|pantera|vasto|segunda|murci|\bira\b|arrogante|tibur|santa teresa|brujer|glotoner|fornicar|gamuza|lobos|lizard/i.test(name);
}

// ---------------------------------------------------------------------------------------------- actions

/** A blow of the string: the clip, an approach dash, the events to the kit. */
class StrikeAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private hitAt = -1;
  private stopAt = 0;
  queued = false;

  constructor(readonly kit: AskinKit, readonly clip: string, readonly index: number, readonly onEvent: (n: string) => void, readonly stop = 1.3) {
    super();
    this.name = clip;
    this.mobility = 0.15;
    this.airGravity = 0.2;
  }

  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.62;
    this.hitAt = c.events.hit ?? -1;
    const tgt = f.faceTarget;
    let dashed = false;
    if (tgt && this.hitAt > 0 && this.clip !== 'as_finger') {
      const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
      this.stopAt = this.stop;
      if (d > this.stopAt + 0.25 && d < 6) {
        const tau = Math.max(0.06, this.hitAt - 0.06);
        const per = (1 - Math.exp(-f.pushDrag * tau)) / f.pushDrag;
        f.push.addScaledVector(f.forward(), Math.min(26, (d - this.stopAt) / per));
        dashed = true;
      }
    }
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n === 'step') {
          if (!dashed) f.push.addScaledVector(f.forward(), 2);
          g.sfx.play('swing', f.center(), 0.5);
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
}

/** One clip, its events to a callback, done when it ends. */
class ClipSkill extends FighterAction {
  private dur = 1;
  constructor(readonly name: string, readonly clip: string, private on: (n: string) => void, private o: SkillOpts = {}) {
    super();
    this.armor = o.armor ?? 0;
    this.mobility = o.mobility ?? 0.15;
    this.invulnerable = !!o.invulnerable;
    this.airGravity = 0.1;
  }
  override start(f: Fighter): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = this.o.dur ?? c.dur - c.fadeOut * 0.5;
    f.anim.play(this.clip, { onEvent: this.on });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    this.o.tick?.(this.t, dt);
    if (this.t >= this.dur) this.done = true;
  }
  override end(): void {
    this.o.end?.();
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' ? this.t > this.dur * 0.6 : next instanceof ClipSkill && this.t > this.dur * 0.7;
  }
}

// ---------------------------------------------------------------------------------------------- the kit

type Form = 'base' | 'hasshein';

interface Dose {
  /** the poison in the body (0 … 1.5): it drains life; at 1 the body gives out */
  load: number;
  collapseAt: number;
  /** Lethal Dose: its own blood turned against it */
  lethalT: number;
  hpWas: number;
  /** in the Gift Bad until this time: tolerance slashed, every dose doubled */
  badUntil: number;
  tinted: boolean;
}

interface Expo {
  /** how far his body has taken in this reiatsu (1 = immune) */
  k: number;
  immune: boolean;
  style: number;
  hollow: boolean;
  /** what it has done to him, and what is still to close once he is immune */
  wounds: number;
  heal: number;
}

export class AskinKit implements Kit {
  form: Form = 'base';
  flare = false;
  comboIndex = 0;
  private lastEnd = 0;
  hassheinT = 0;
  hassheinCd = 0;
  readonly cd = { bow: 0, ball: 0, bad: 0, taste: 0, analyse: 0, step: 0, swarm: 0, ring: 0, deluxe: 0, bereich: 0, giant: 0 };
  readonly poison = new Map<Fighter, Dose>();
  readonly expo = new Map<Fighter, Expo>();
  readonly balls: GiftBall[] = [];
  bad: GiftBad | null = null;
  dome: GiftDeluxe | null = null;
  bereich: GiftBereich | null = null;
  private ringStage = new Map<Fighter, number>();
  private rootT = new Map<Fighter, number>();
  /** bodies the poison has put on their knees, and until when */
  private kneel = new Map<Fighter, number>();
  private gunT = 0;
  private enduranceCd = 0;
  private wasDashing = false;
  private prevPos = new THREE.Vector3();
  private flareTick = 0;
  private lastLine = -99;
  private visor: THREE.Mesh | null = null;
  private saidGoodbye = false;
  /** when an immunity of his last broke (the brief panic that sends him to Hasshein) */
  private brokeAt = -99;
  private bornAt = 0;

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.data.quincy = true;
    f.parry = (amount, from, o) => this.parry(amount, from, o);
    f.onHurt = (dmg) => this.hurt(dmg);
    f.onLethal = () => this.endure();
    this.bornAt = g.time;
    this.hands();
    this.applyStats();
  }

  private hands(): void {
    const rig = this.f.visual.rig;
    const p = this.f.visual.props;
    const gun = this.gunT > 0;
    const r = p.has('staff');
    rig.setBoneVisible('point.R', gun);
    rig.setBoneVisible('fist.R', !gun && r);
    rig.setBoneVisible('palm.R', !gun && !r);
    const l = p.has('thermos');
    rig.setBoneVisible('fist.L', l);
    rig.setBoneVisible('palm.L', !l);
  }

  private props(): PropDef[] {
    if (this.form !== 'hasshein') return [];
    return [
      { key: 'halo', model: askinProp('halo'), socket: 'halo' },
      { key: 'staff', model: askinProp('staff'), socket: 'grip.R' },
    ];
  }

  private line(text: string, every = 4): void {
    if (this.g.time - this.lastLine < every) return;
    this.lastLine = this.g.time;
    this.g.callout('', text, PURPLE);
  }

  // ---------------------------------------------------------------- the poison

  /** a dose of poison in a body: strong souls take less of it, and the Gift Bad doubles it */
  dose(e: Fighter, amount: number): void {
    if (e.dead || e === this.f) return;
    let d = this.poison.get(e);
    if (!d) this.poison.set(e, (d = { load: 0, collapseAt: 0, lethalT: 0, hpWas: e.hp, badUntil: 0, tinted: false }));
    const k = Math.max(0.4, Math.min(1.2, 600 / e.maxHp)) * (d.badUntil > this.g.time ? 2 : 1);
    d.load = Math.min(1.5, d.load + amount * k);
  }

  load(e: Fighter): number {
    return this.poison.get(e)?.load ?? 0;
  }

  private tickPoison(dt: number): void {
    const { f, g } = this;
    for (const [e, until] of this.kneel) {
      if (g.time < until && !e.dead) continue;
      if (!e.dead && e.anim.isPlaying('weighed_kneel')) e.anim.stopAll(0.3);
      this.kneel.delete(e);
    }
    for (const [e, d] of this.poison) {
      if (e.dead || !g.fighters.includes(e)) {
        if (d.tinted && !e.dead) poisonTint(e, 0);
        this.poison.delete(e);
        continue;
      }
      // a heal on the victim dilutes the lethal dose out of its blood
      if (d.lethalT > 0 && e.hp > d.hpWas + 0.5) {
        d.lethalT = 0;
        g.callout('', '…Diluted it, huh.', PURPLE);
      }
      if (d.load > 0) g.drain(e, 18 * d.load * dt, f);
      if (d.lethalT > 0) {
        d.lethalT -= dt;
        g.drain(e, (4 + 14 * (1 - Math.max(0, d.lethalT) / 8)) * dt, f);
        e.slow(0.3, 0.2);
        if (Math.random() < dt * 6) miasma(g, e.center(), 0.3, 1);
      }
      d.load = Math.max(0, d.load - 0.05 * dt);
      // the body gives out
      if (d.load >= 1 && g.time > d.collapseAt) {
        d.collapseAt = g.time + 8;
        registerReactions(e.anim);
        e.stopAction();
        e.hitstun = Math.max(e.hitstun, 1.2);
        e.anim.play('weighed_kneel', { fadeIn: 0.1, hold: true });
        this.kneel.set(e, g.time + 1.2);
        g.callout('致死量', 'Chimei-teki da ze.', PURPLE);
        miasma(g, e.center(), 0.8, 8);
      }
      const tint = Math.min(1, d.load + (d.lethalT > 0 ? 0.4 : 0));
      if (tint > 0.02 || d.tinted) {
        poisonTint(e, tint);
        d.tinted = tint > 0.02;
      }
      d.hpWas = e.hp;
      if (d.load <= 0 && d.lethalT <= 0 && !d.tinted) this.poison.delete(e);
    }
  }

  // ---------------------------------------------------------------- the immunity

  private expoOf(e: Fighter): Expo {
    let x = this.expo.get(e);
    if (!x) this.expo.set(e, (x = { k: 0, immune: false, style: styleId(e), hollow: hollowBase(e), wounds: 0, heal: 0 }));
    return x;
  }

  /** immune to this fighter's reiatsu as it is now */
  immuneTo(e: Fighter | null): boolean {
    if (!e) return false;
    const x = this.expo.get(e);
    return !!x && x.immune && !this.changed(e, x);
  }

  /** its reiatsu is not the one he analysed: any change in his base form, a change of base (Hollow) in Hasshein */
  private changed(e: Fighter, x: Expo): boolean {
    return this.form === 'hasshein' ? x.hollow !== hollowBase(e) : x.style !== styleId(e);
  }

  private becomeImmune(e: Fighter): void {
    const x = this.expoOf(e);
    if (x.immune) return;
    x.immune = true;
    x.k = 1;
    x.heal = Math.min(x.wounds * 0.8, this.f.maxHp * 0.3);
    x.wounds = 0;
    this.g.callout('', `Got it. Your reiatsu won't work on me anymore, ${e.def.name.split(' ')[0]}.`, PURPLE);
    veneFlash(this.g, this.f.center(), 12);
  }

  private tickImmunity(dt: number): void {
    const { f, g } = this;
    for (const e of g.enemiesOf(f)) {
      if (e.dead) continue;
      const x = this.expoOf(e);
      if (this.changed(e, x)) {
        if (x.immune) {
          g.callout('', '…! That reiatsu — it changed?', PURPLE);
          this.brokeAt = g.time;
        }
        x.immune = false;
        x.k = 0;
        x.style = styleId(e);
        x.hollow = hollowBase(e);
      }
      if (!x.immune && e.pos.distanceTo(f.pos) < 25) {
        x.k += dt / 60;
        if (x.k >= 1) this.becomeImmune(e);
      }
    }
    // the wounds from a reiatsu he is immune to close in seconds
    for (const [, x] of this.expo) {
      if (x.heal <= 0) continue;
      const h = Math.min(x.heal, dt * Math.max(25, x.heal * 0.6));
      x.heal -= h;
      f.hp = Math.min(f.maxHp, f.hp + h);
    }
  }

  private hurt(dmg: number): void {
    const from = this.f.lastHurt.from;
    if (!from || from === this.f) return;
    const x = this.expoOf(from);
    if (x.immune) return;
    const c = Math.min(dmg, 150);
    x.wounds += c;
    // the harder they hit, the more of their reiatsu he takes in
    x.k += c / 250;
    if (x.k >= 1) this.becomeImmune(from);
  }

  /** blows from a reiatsu he is immune to fizzle; a swing he backsteps out of only scratches (Lethal Step) */
  private parry(_amount: number, from: Fighter | null, o: DamageOpts): boolean {
    const { f, g } = this;
    if (from && this.immuneTo(from)) {
      const c = f.center();
      for (let i = 0; i < 5; i++) g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: (Math.random() - 0.5) * 3, vy: Math.random() * 2, vz: (Math.random() - 0.5) * 3, size: 0.2, sizeEnd: 0.05, life: 0.3, r: 0.75, g: 0.55, b: 1, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
      if (Math.random() < 0.25) this.line("Didn't I tell you? It's no use.", 6);
      return true;
    }
    if (from && f.dashT > 0 && !o.energy && this.cd.step <= 0) {
      const away = _v.subVectors(f.pos, from.pos).setY(0).normalize().dot(f.dashDir);
      if (away > 0.3) {
        this.lethalStep();
        return true;
      }
    }
    return false;
  }

  /** Lethal Step: he leaps back at exactly the swing's speed; it looks fatal; he lies there; he gets up */
  private lethalStep(): void {
    const { f, g } = this;
    this.cd.step = 4;
    f.hp = Math.max(1, f.hp - 2);
    f.dashT = 0;
    const c = f.center();
    for (let i = 0; i < 10; i++) g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: (Math.random() - 0.5) * 4, vy: Math.random() * 3, vz: (Math.random() - 0.5) * 4, size: 0.08, sizeEnd: 0.02, life: 0.4, r: 0.75, g: 0.08, b: 0.12, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, gravity: 8 });
    f.act(new ClipSkill('feint', 'as_crumple', (n) => {
      if (n === 'up') this.line('Just kidding.', 0);
    }, { invulnerable: true, mobility: 0 }), true);
  }

  /** "can't die" endurance: a lethal blow leaves him standing once in a while */
  private endure(): boolean {
    const { f, g } = this;
    if (this.enduranceCd > 0) {
      this.goodbye();
      return false;
    }
    this.enduranceCd = 90;
    f.hp = 1;
    f.invuln = Math.max(f.invuln, 1.0);
    veneFlash(g, f.center(), 16);
    g.callout('', '…Now that one was fatal. Almost.', PURPLE);
    return true;
  }

  private goodbye(): void {
    if (this.saidGoodbye) return;
    this.saidGoodbye = true;
    if (this.dome && !this.dome.done) {
      this.dome.runWild();
      this.g.callout('', "Sorry… I can't hold it back anymore. Just this once, I won't call it fatal.", PURPLE);
    }
  }

  // ---------------------------------------------------------------- the frame

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    this.hassheinCd = Math.max(0, this.hassheinCd - dt);
    this.enduranceCd = Math.max(0, this.enduranceCd - dt);
    if (this.gunT > 0 && (this.gunT -= dt) <= 0) this.hands();
    if (f.dead) {
      this.goodbye();
      return;
    }
    this.tickPoison(dt);
    this.tickImmunity(dt);
    for (const [e, t] of this.rootT) {
      const left = t - dt;
      if (left <= 0 || e.dead) {
        e.rooted = false;
        this.rootT.delete(e);
      } else this.rootT.set(e, left);
    }
    for (let i = this.balls.length - 1; i >= 0; i--) if (this.balls[i].done) this.balls.splice(i, 1);
    if (this.bad?.done) this.bad = null;
    if (this.dome?.done) this.dome = null;
    if (this.bereich?.done) this.bereich = null;
    // the miasma flare
    if (this.flare) {
      f.rei -= dt * 6;
      if ((this.flareTick -= dt) <= 0) {
        this.flareTick = 0.25;
        miasma(g, f.pos, 4.5, 4);
        for (const e of g.enemiesOf(f)) if (!e.dead && e.pos.distanceTo(f.pos) < 5) this.dose(e, 0.05);
      }
      if (f.rei <= 0) this.toggleFlare();
    }
    // Hirenkyaku (Hasshein: zig-zags, linked circles left hanging)
    const dashing = f.dashT > 0;
    if (dashing && !this.wasDashing) hirenkyakuPuff(g, f, TINT);
    if (dashing) {
      if (this.form === 'hasshein') circleTrail(g, this.prevPos, f.pos);
      else hirenkyakuStreak(g, f, TINT);
    }
    this.wasDashing = dashing;
    this.prevPos.copy(f.pos);
    if (this.form === 'hasshein') {
      this.hassheinT -= dt;
      vollFlight(g, f, this.target(), 2.5);
      if (this.hassheinT <= 0) this.leaveHasshein();
    }
  }

  target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 90, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 90);
  }

  private near(range: number): Fighter | null {
    const t = this.target();
    return t && t.pos.distanceTo(this.f.pos) <= range ? t : null;
  }

  // ---------------------------------------------------------------- the blows

  /** a blow: the nearest enemy in front within reach */
  private strike(range: number, dmg: number, o: { knock?: number; launch?: number; heavy?: boolean; around?: boolean } = {}): Fighter | null {
    const { f, g } = this;
    const fw = f.forward();
    let best: Fighter | null = null, bd = Infinity;
    for (const e of g.enemiesOf(f)) {
      if (e.dead) continue;
      _v.subVectors(e.pos, f.pos).setY(0);
      const d = _v.length();
      if (d > range + e.def.radius || (!o.around && d > 0.3 && _v.normalize().dot(fw) < 0.3) || Math.abs(e.pos.y - f.pos.y) > 2.5) continue;
      if (d < bd) { bd = d; best = e; }
    }
    if (!best) return null;
    const dir = o.around ? _w.subVectors(best.pos, f.pos).setY(0).normalize().clone() : fw;
    g.damage(best, dmg, f, dir, { knock: o.knock ?? 4, launch: o.launch ?? 0, heavy: o.heavy, hitstop: o.heavy ? 0.1 : 0.045, shake: o.heavy ? 0.3 : 0.1 });
    return best;
  }

  attack(): void {
    const { f, g } = this;
    const cur = f.action;
    if (cur instanceof StrikeAction && (ASKIN_CHAIN.includes(cur.clip) || HASSHEIN_CHAIN.includes(cur.clip))) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (g.time - this.lastEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const { f, g } = this;
    const hs = this.form === 'hasshein';
    const list = hs ? HASSHEIN_CHAIN : ASKIN_CHAIN;
    const idx = i % list.length;
    const clip = list[idx];
    this.comboIndex = idx + 1;
    this.lastEnd = g.time + 0.65;
    const on = (n: string): void => {
      if (n === 'point') {
        this.gunT = 0.5;
        this.hands();
        return;
      }
      if (n !== 'hit' && n !== 'hit2') return;
      if (hs) {
        if (clip === 'hs_s1') this.strike(2.8, 12, { knock: 6 });
        else if (clip === 'hs_s2') this.strike(3.4, 14, { knock: 8 });
        else if (clip === 'hs_s3') this.strike(3.0, 10, { knock: 5, around: true });
        else {
          // the slam: the balls fly off the staff's end and hang where they land
          this.strike(3.0, 28, { knock: 14, launch: 3, heavy: true });
          const fw = f.forward();
          for (let k = -1; k <= 1; k++) {
            const dir = fw.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), k * 0.4).setY(0.15);
            this.ball(sock(f, 'grip.R').addScaledVector(fw, 1.2), dir, { speed: 9, range: 5, life: 10 });
          }
        }
        return;
      }
      if (clip === 'as_jab') this.strike(1.8, 10, { knock: 4 });
      else if (clip === 'as_kick') this.strike(2.0, 12, { knock: 7 });
      else if (clip === 'as_finger') {
        const from = sock(f, 'finger');
        const t = this.target();
        const dir = t ? t.center().sub(from).normalize() : f.forward();
        g.addProjectile(new PfeilShot(g, f, from.addScaledVector(dir, 0.2), dir, 9, 46, 0.6));
      } else this.strike(1.9, 20, { knock: 10, launch: 2, heavy: true });
    };
    f.act(new StrikeAction(this, clip, idx, on, hs ? 2.0 : 1.3), true);
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

  /** a Gift Ball, kept to six at once (the oldest bursts) */
  private ball(from: THREE.Vector3, dir: THREE.Vector3, o: { hybrid?: boolean; speed?: number; range?: number; life?: number; home?: Fighter | null; homing?: number; dose?: number }): void {
    const { f, g } = this;
    const hybrid = !!o.hybrid;
    const b = new GiftBall(g, f, from, dir, {
      hybrid, speed: o.speed, range: o.range, life: o.life, home: o.home, homing: o.homing,
      onTouch: (e) => {
        this.dose(e, o.dose ?? (hybrid ? 1.0 : 0.7));
        if (hybrid) {
          // oxygen, nitrogen: the legs go, the reiatsu drains
          e.slow(0.45, 2.5);
          e.rei = Math.max(0, e.rei - 25);
        }
      },
    });
    g.addProjectile(b);
    this.balls.push(b);
    const mines = this.balls.filter((x) => !x.done);
    if (mines.length > 6) mines[0].burst();
  }

  /** RMB: the Heilig Bogen out of the bracers — three arrows; Hasshein: Mass Gift Balls */
  heavy(): void {
    const { f, g } = this;
    if (this.form === 'hasshein') {
      this.swarm();
      return;
    }
    this.special(new ClipSkill('bow', 'as_bow', (n) => {
      if (n === 'pop') {
        f.visual.attach('bow', askinProp('bow'), 'bracer');
        g.sfx.play('ting', f.center(), 0.5);
      }
      if (n[0] === 'a' && n.length === 2) {
        const bow = f.visual.props.get('bow');
        const from = bow ? bow.getWorldPosition(new THREE.Vector3()) : sock(f, 'bracer');
        const t = this.target();
        const dir = t ? t.center().sub(from).normalize() : f.forward();
        dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), (Number(n[1]) - 1) * 0.03);
        g.addProjectile(new PfeilShot(g, f, from.addScaledVector(dir, 0.6), dir, 14, 55, 1));
      }
    }, {
      mobility: 0.2,
      end: () => f.visual.detach('bow'),
    }), 10, 'bow', 3.5);
  }

  /** Q: a Gift Ball (Hybrid on a target already poisoned); Hasshein: Gift Ring */
  skill1(): void {
    const { f, g } = this;
    if (this.form === 'hasshein') {
      this.ring();
      return;
    }
    const t = this.target();
    const hybrid = !!t && this.load(t) >= 0.25;
    this.special(new ClipSkill('ball', 'as_toss', (n) => {
      if (n !== 'throw') return;
      const from = sock(f, 'palm.R');
      const tg = this.target();
      const dist = tg ? tg.pos.distanceTo(f.pos) : 10;
      const dir = tg ? tg.center().sub(from).normalize() : f.forward();
      g.callout('', hybrid ? 'Haiburiddo Gifuto Bāru.' : 'Gifuto Bāru.', PURPLE);
      this.ball(from, dir, { hybrid, range: Math.min(15, dist + 1.5) });
    }, { mobility: 0.5 }), 12, 'ball', 2.5);
  }

  /** E: the Gift Bad under the target; Hasshein: the Gift Ball Deluxe (again: the concentration raised) */
  skill2(): void {
    const { f, g } = this;
    if (this.form === 'hasshein') {
      this.deluxe();
      return;
    }
    this.special(new ClipSkill('bad', 'as_pool', (n) => {
      if (n !== 'pool') return;
      const t = this.near(16);
      const at = t ? t.pos.clone() : f.pos.clone().addScaledVector(f.forward(), 4);
      const gy = groundAt(g, at.x, at.y + 1, at.z, 8);
      if (gy !== null) at.y = gy;
      this.bad?.done === false && (this.bad.done = true);
      this.bad = new GiftBad(g, f, at, 4.2, 14, (e, dt) => {
        const d = this.poison.get(e);
        this.dose(e, 0.15 * dt);
        const dd = d ?? this.poison.get(e);
        if (dd) dd.badUntil = g.time + 0.3;
        e.rei = Math.max(0, e.rei - 8 * dt);
        e.slow(0.3, 0.25);
      });
      g.addProjectile(this.bad);
      g.callout('', 'Gifuto Bāto.', PURPLE);
    }, { mobility: 0 }), 20, 'bad', 10);
  }

  /** R: Taste — their own blood turned lethal; the water in a soaked body poisoned; or the café au lait */
  skill3(): void {
    const { f, g } = this;
    if (this.form === 'hasshein') {
      this.bereichNow();
      return;
    }
    if (this.cd.taste > 0) return;
    const sample = this.sample();
    const wet = this.target();
    if (sample) {
      this.special(new ClipSkill('taste', 'as_taste', (n) => {
        if (n !== 'lick' || sample.dead) return;
        let d = this.poison.get(sample);
        if (!d) this.poison.set(sample, (d = { load: 0, collapseAt: 0, lethalT: 0, hpWas: sample.hp, badUntil: 0, tinted: false }));
        d.lethalT = 8;
        d.hpWas = sample.hp;
        // the lecture: its weight, its blood, the dose
        const kg = Math.round(62 * Math.pow(sample.def.height / 1.6, 2) * (sample.def.boss ? 3 : 1));
        const litres = (kg * 0.065).toFixed(1);
        const lethal = (kg * 0.065 * 0.4).toFixed(1);
        g.callout('致死量', `About ${kg} kg… ${litres} L of blood. ${lethal} L of your own blood is a lethal dose now.`, PURPLE);
      }, { mobility: 0.3 }), 14, 'taste', 7);
      return;
    }
    if (wet && wet.wetT > 0 && wet.pos.distanceTo(f.pos) < 20) {
      this.special(new ClipSkill('taste', 'as_taste', (n) => {
        if (n !== 'lick' || wet.dead) return;
        this.dose(wet, 0.7);
        g.callout('', 'That water in you? Poison now.', PURPLE);
      }, { mobility: 0.3 }), 14, 'taste', 7);
      return;
    }
    // nothing to taste: a sip of café au lait
    this.special(new ClipSkill('sip', 'as_sip', (n) => {
      if (n === 'out') {
        f.visual.attach('thermos', askinProp('thermos'), 'grip.L');
        this.hands();
      }
      if (n === 'sip') {
        f.hp = Math.min(f.maxHp, f.hp + 40);
        f.rei = Math.min(f.maxRei, f.rei + 20);
        this.line('Café au lait. Want some?', 0);
      }
    }, {
      mobility: 0.1,
      end: () => {
        f.visual.detach('thermos');
        this.hands();
      },
    }), 0, 'taste', 12);
  }

  /** the last enemy he drew blood from (the last 6 s) */
  sample(): Fighter | null {
    const { f, g } = this;
    let best: Fighter | null = null;
    for (const e of g.enemiesOf(f)) if (!e.dead && e.lastHurt.from === f && g.time - e.lastHurt.at < 6 && !e.lastHurt.shrug && (!best || e.lastHurt.at > best.lastHurt.at)) best = e;
    return best;
  }

  /** G: Analyse — immune at once to whoever hurt him last */
  toggle(): void {
    const { f, g } = this;
    const from = f.lastHurt.from;
    if (!from || from.dead || g.time - f.lastHurt.at > 10 || this.immuneTo(from)) {
      if (f === g.player) g.hud?.showBanner('Nothing to analyse');
      return;
    }
    this.special(new ClipSkill('analyse', 'as_analyse', (n) => {
      if (n === 'snap' && !from.dead) this.becomeImmune(from);
    }, { mobility: 0.4 }), 18, 'analyse', 45);
  }

  // ---------------------------------------------------------------- Hasshein

  /** RMB in Hasshein: every ball on the staff splits five ways — fifteen slow balls fanned out after the target */
  private swarm(): void {
    const { f, g } = this;
    this.special(new ClipSkill('swarm', 'hs_swarm', (n) => {
      if (n !== 'split') return;
      g.callout('', 'Gifuto Bāru.', PURPLE);
      const staff = f.visual.props.get('staff');
      const t = this.target();
      const fw = f.forward();
      const pts = STAFF_BALLS.slice(0, 3).map((z) => staff ? staff.localToWorld(new THREE.Vector3(0, 0, z)) : f.center().addScaledVector(fw, 1));
      let i = 0;
      for (const p of pts) for (let k = 0; k < 5; k++, i++) {
        const a = ((i / 14) - 0.5) * 0.9;
        const dir = (t ? t.center().sub(p).normalize() : fw.clone()).applyAxisAngle(new THREE.Vector3(0, 1, 0), a).add(_w.set(0, (Math.random() - 0.3) * 0.4, 0)).normalize();
        this.ball(p, dir, { speed: 6.5, range: 30, life: 1, home: t, homing: 1.6, dose: 0.35 });
      }
    }, { mobility: 0.3 }), 22, 'swarm', 6);
  }

  /** Q in Hasshein: Gift Ring — organ by organ: the eyes, the weapon arm, the legs, the heart */
  private ring(): void {
    const { f, g } = this;
    const t = this.near(40);
    if (!t) {
      if (f === g.player) g.hud?.showBanner('No one in reach');
      return;
    }
    this.special(new ClipSkill('ring', 'hs_ring', (n) => {
      if (n === 'spin') g.callout('', 'Gifuto Ringu.', PURPLE);
      if (n !== 'throw' || t.dead) return;
      g.addProjectile(new GiftRing(g, f, sock(f, 'grip.L'), t, (e) => this.ringHit(e)));
    }, { mobility: 0.3 }), 24, 'ring', 7);
  }

  private ringHit(e: Fighter): void {
    const { f, g } = this;
    const stage = this.ringStage.get(e) ?? 0;
    this.ringStage.set(e, (stage + 1) % 4);
    const dir = _v.subVectors(e.pos, f.pos).setY(0).normalize().clone();
    if (stage === 0) {
      e.blindT = Math.max(e.blindT, 6);
      g.damage(e, 12, f, dir, { energy: true, knock: 1, unblockable: true });
      g.callout('', 'Your eyes first.', PURPLE);
    } else if (stage === 1) {
      e.disarmT = Math.max(e.disarmT, 5);
      g.damage(e, 12, f, dir, { energy: true, knock: 1, unblockable: true });
      g.callout('', 'Then that arm.', PURPLE);
    } else if (stage === 2) {
      e.rooted = true;
      this.rootT.set(e, 3);
      g.damage(e, 12, f, dir, { energy: true, knock: 0, unblockable: true });
      g.callout('', 'Your legs.', PURPLE);
    } else {
      g.callout('', 'And your heart.', PURPLE);
      if (e.maxHp <= 300) g.damage(e, 9999, f, dir, { energy: true, unblockable: true, heavy: true });
      else g.damage(e, 100, f, dir, { energy: true, knock: 4, heavy: true, unblockable: true, hitstop: 0.12 });
    }
  }

  /** E in Hasshein: the Gift Ball Deluxe round him; again: the concentration raised */
  private deluxe(): void {
    const { f, g } = this;
    if (this.dome && !this.dome.done) {
      if (this.dome.conc >= 3 || this.cd.deluxe > 0) return;
      this.cd.deluxe = 3;
      this.dome.raise();
      g.callout('', this.dome.conc >= 3 ? 'Concentration: maximum.' : "Let's raise the concentration.", PURPLE);
      return;
    }
    this.special(new ClipSkill('deluxe', 'hs_deluxe', (n) => {
      if (n !== 'dome') return;
      const c = f.pos.clone();
      const gy = groundAt(g, c.x, c.y + 0.5, c.z, 20);
      if (gy !== null) c.y = gy;
      this.dome = new GiftDeluxe(g, f, c, 24, 30, (e, dt, conc) => this.dose(e, 0.12 * Math.pow(conc, 1.5) * dt));
      g.addProjectile(this.dome);
      g.callout('毒入りボール', 'Gifuto Bāru Derakkusu.', PURPLE);
    }, { mobility: 0, armor: 0.3 }), 50, 'deluxe', 3);
  }

  /** R in Hasshein: the Gift Bereich on the dome's edge (or a smaller one round him) */
  private bereichNow(): void {
    const { f, g } = this;
    this.special(new ClipSkill('bereich', 'hs_bereich', (n) => {
      if (n !== 'nodes') return;
      this.bereich?.done === false && (this.bereich.done = true);
      if (this.dome && !this.dome.done) this.bereich = new GiftBereich(g, f, this.dome.center.clone(), this.dome.R, 15);
      else {
        const c = f.pos.clone();
        const gy = groundAt(g, c.x, c.y + 0.5, c.z, 20);
        if (gy !== null) c.y = gy;
        this.bereich = new GiftBereich(g, f, c, 12, 15);
      }
      g.addProjectile(this.bereich);
      g.callout('猛毒領域', 'Gifuto Beraihi. No one leaves.', PURPLE);
    }, { mobility: 0.2 }), 30, 'bereich', 20);
  }

  /** F: Hasshein; in it, the giant Gift Ball */
  release(): void {
    const { f, g } = this;
    if (this.form === 'hasshein') {
      this.giant();
      return;
    }
    if (this.hassheinCd > 0) {
      if (f === g.player) g.hud?.showBanner('Not yet');
      return;
    }
    if (f.busy) return;
    if (!f.spendRei(50)) {
      if (f === g.player) g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    let burst = false, at = 0;
    const go = () => {
      if (burst) return;
      burst = true;
      this.becomeHasshein();
    };
    f.act(new ClipSkill('release', 'as_release', () => {}, {
      invulnerable: true,
      mobility: 0,
      tick: (t) => {
        at = t;
        if (t >= 0.58) go();
      },
      end: () => { if (at >= 0.45 && !f.dead) go(); },
    }), true);
  }

  private giant(): void {
    const { f, g } = this;
    let ball: GiantGiftBall | null = null;
    this.special(new ClipSkill('giant', 'hs_giant', (n) => {
      if (n === 'grow') g.callout('', 'This one is a bit big.', PURPLE);
      if (n !== 'push') return;
      const t = this.target();
      const fw = f.forward();
      const dir = t ? t.pos.clone().sub(f.pos).setY(0).normalize() : fw;
      const from = f.pos.clone().addScaledVector(dir, 3.2);
      const gy = groundAt(g, from.x, from.y + 2, from.z, 30);
      from.y = (gy ?? f.pos.y) + 2.4 * 0.85;
      ball = new GiantGiftBall(g, f, from, dir, (e) => {
        this.dose(e, 1.0);
        g.damage(e, 30, f, dir, { knock: 12, launch: 4, heavy: true, energy: true });
      });
      g.addProjectile(ball);
    }, { mobility: 0, armor: 0.4 }), 60, 'giant', 14);
    void ball;
  }

  private rebody(): void {
    const { f } = this;
    const hs = this.form === 'hasshein';
    f.def = { ...f.def, stance: hs ? HASSHEIN_STANCE : ASKIN_STANCE, clips: hs ? HASSHEIN_CLIPS : ASKIN_CLIPS };
    f.setForm({ asset: askinAsset(hs ? 'hasshein' : 'base'), props: this.props() }, hs ? AURA_HASSHEIN : AURA_ASKIN);
    this.hands();
    this.visor?.removeFromParent();
    this.visor = null;
    if (hs) {
      // the orange see-through visor across the eyes
      const face = f.visual.rig.sockets.get('face');
      if (face) {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.055, 20, 1, true, -Math.PI * 0.42, Math.PI * 0.84), new THREE.MeshBasicMaterial({ color: VISOR, transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false }));
        m.position.set(0, 0.0, -0.1);
        face.add(m);
        this.visor = m;
      }
    }
  }

  private becomeHasshein(): void {
    const { f, g } = this;
    if (this.form === 'hasshein') return;
    this.form = 'hasshein';
    this.hassheinT = HASSHEIN_TIME;
    f.rooted = false;
    f.def = { ...f.def, speed: { ...SPEED_H } };
    this.rebody();
    const c = f.center();
    for (const e of g.enemiesOf(f)) {
      if (e.dead || e.center().distanceTo(c) > 6 + e.def.radius) continue;
      g.damage(e, 40, f, e.pos.clone().sub(f.pos).setY(0).normalize(), { energy: true, knock: 16, launch: 5, heavy: true, color: HASSHEIN });
      this.dose(e, 0.3);
    }
    g.addProjectile(new LightPillar(g, f.pos.clone(), 1.4, 70, HASSHEIN));
    f.aura.pillarBurst(2.2);
    f.aura.flare(2, 1);
    g.addRing(f.pos.clone(), 10, HASSHEIN, 0.5);
    miasma(g, f.pos, 6, 20);
    g.shake(f === g.player ? 0.5 : 0.2);
    g.callout('神の毒見', 'QUINCY: VOLLSTÄNDIG — HASSHEIN', HASSHEIN);
    g.sfx.play('bankai', f.center());
    this.applyStats();
  }

  private leaveHasshein(): void {
    const { f } = this;
    this.form = 'base';
    this.hassheinCd = HASSHEIN_CD;
    f.mounted = false;
    f.def = { ...f.def, speed: { ...SPEED } };
    this.rebody();
    this.applyStats();
  }

  private applyStats(): void {
    const f = this.f;
    const hs = this.form === 'hasshein';
    f.power = (hs ? 1.35 : 1) * (this.flare ? 1.15 : 1);
    f.damageTaken = hs ? 0.85 : 0.9;
    f.toughness = hs ? 9 : 7;
    f.aura.target = this.flare ? 0.8 : hs ? 0.45 : 0.04;
  }

  toggleFlare(): void {
    this.flare = !this.flare;
    this.applyStats();
    if (this.flare) {
      this.f.aura.flare(1.4, 0.4);
      miasma(this.g, this.f.pos, 4, 16);
      this.g.sfx.play('flare', this.f.center());
    }
  }

  formName(): string {
    const t = this.target();
    const imm = t && this.immuneTo(t) ? ' · immune' : '';
    if (this.form === 'hasshein') return `Hasshein · ${Math.max(0, Math.ceil(this.hassheinT))} s${imm}`;
    return `Sternritter "D" — The Deathdealing${imm}`;
  }

  ai(): KitAI {
    const base = () => this.form === 'base';
    const hs = () => this.form === 'hasshein';
    const hpK = () => this.f.hp / this.f.maxHp;
    const tgt = () => this.target();
    return {
      reach: 1.6,
      chain: 4,
      releaseAt: 0.5,
      // he keeps his distance until his body has their reiatsu down (and from anyone out of reach overhead)
      ranged: () => { const t = tgt(); return !this.immuneTo(t) || (!!t && t.pos.y - this.f.pos.y > 2.5 && this.form === 'base'); },
      // feint and flight: up close and not yet immune, he runs — into his pool
      goal: () => {
        const t = tgt();
        if (!t || !base() || this.immuneTo(t) || t.pos.distanceTo(this.f.pos) > 6) return null;
        const away = _v.subVectors(this.f.pos, t.pos).setY(0).normalize();
        const to = this.bad && !this.bad.done ? this.bad.at : this.f.pos.clone().addScaledVector(away, 12);
        return { x: to.x, z: to.z };
      },
      moves: [
        { name: 'bad', use: () => this.skill2(), min: 3, max: 16, weight: 3, cd: 12, when: () => base() && !this.bad },
        { name: 'ball', use: () => this.skill1(), min: 0, max: 15, weight: 2.6, cd: 3, when: base },
        { name: 'bow', use: () => this.heavy(), min: 6, max: 32, weight: 2.4, cd: 4, when: base },
        { name: 'taste', use: () => this.skill3(), min: 0, max: 30, weight: 4, cd: 6, when: () => base() && !!this.sample() },
        { name: 'sip', use: () => this.skill3(), min: 8, max: 60, weight: 0.6, cd: 20, when: () => base() && !this.sample() && hpK() < 0.7 },
        { name: 'analyse', use: () => this.toggle(), min: 0, max: 40, weight: 5, cd: 10, when: () => { const a = this.f.lastHurt.from; return !!a && !this.immuneTo(a) && (this.expo.get(a)?.k ?? 0) > 0.35; } },
        // Hasshein: when hurt, when an immunity has just broken, or when the fight drags on
        { name: 'hasshein', use: () => this.release(), min: 0, max: 60, weight: 3, cd: 8, when: () => base() && this.hassheinCd <= 0 && (hpK() < 0.5 || this.g.time - this.brokeAt < 10 || this.g.time - this.bornAt > 45) },
        { name: 'swarm', use: () => this.heavy(), min: 3, max: 18, weight: 2.6, cd: 6, when: hs },
        { name: 'ring', use: () => this.skill1(), min: 4, max: 30, weight: 2.4, cd: 7, when: () => hs() && (tgt()?.maxHp ?? 0) >= 900 },
        { name: 'deluxe', use: () => this.skill2(), min: 0, max: 40, weight: 5, cd: 4, when: () => hs() && (!this.dome || this.dome.conc < 3) },
        { name: 'bereich', use: () => this.skill3(), min: 0, max: 30, weight: 4, cd: 16, when: () => hs() && !!this.dome && !this.bereich },
        { name: 'giant', use: () => this.release(), min: 5, max: 25, weight: 2, cd: 12, when: hs },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    if (this.form === 'hasshein') {
      return [
        { key: 'LMB', name: 'Reishi Staff', kanji: '杖' },
        { key: 'RMB', name: 'Mass Gift Balls', kanji: '毒球', cost: 22, cd: cd.swarm, cdMax: 6, tint: PURPLE },
        { key: 'Q', name: 'Gift Ring', kanji: '指輪', cost: 24, cd: cd.ring, cdMax: 7, tint: PURPLE },
        { key: 'E', name: this.dome ? 'Raise Concentration' : 'Gift Ball Deluxe', kanji: '極上', cost: this.dome ? 0 : 50, cd: cd.deluxe, cdMax: 3, active: !!this.dome, tint: PURPLE },
        { key: 'R', name: 'Gift Bereich', kanji: '領域', cost: 30, cd: cd.bereich, cdMax: 20, active: !!this.bereich, tint: PURPLE },
        { key: 'G', name: 'Analyse', kanji: '解析', cost: 18, cd: cd.analyse, cdMax: 45, tint: PURPLE },
        { key: 'F', name: 'Giant Gift Ball', kanji: '巨毒', cost: 60, cd: cd.giant, cdMax: 14, active: true, timer: this.hassheinT / HASSHEIN_TIME, tint: PURPLE },
        { key: 'Shift', name: 'Hirenkyaku', kanji: '飛廉脚', cost: 4 },
        { key: 'V', name: 'Miasma', kanji: '毒霧', active: this.flare },
      ];
    }
    const t = this.target();
    return [
      { key: 'LMB', name: 'Lazy Blows', kanji: '拳' },
      { key: 'RMB', name: 'Heilig Bogen', kanji: '神聖弓', cost: 10, cd: cd.bow, cdMax: 3.5, tint: PURPLE },
      { key: 'Q', name: t && this.load(t) >= 0.25 ? 'Hybrid Gift Ball' : 'Gift Ball', kanji: '毒球', cost: 12, cd: cd.ball, cdMax: 2.5, tint: PURPLE },
      { key: 'E', name: 'Gift Bad', kanji: '毒池', cost: 20, cd: cd.bad, cdMax: 10, active: !!this.bad, tint: PURPLE },
      { key: 'R', name: this.sample() ? 'Taste' : 'Café au Lait', kanji: '致死量', cost: this.sample() ? 14 : 0, cd: cd.taste, cdMax: 7, tint: PURPLE },
      { key: 'G', name: 'Analyse', kanji: '解析', cost: 18, cd: cd.analyse, cdMax: 45, tint: PURPLE },
      { key: 'F', name: 'Hasshein', kanji: '神の毒見', cost: 50, cd: this.hassheinCd, cdMax: HASSHEIN_CD, tint: PURPLE },
      { key: 'Shift', name: 'Lethal Step', kanji: '飛廉脚', cost: 4, cd: cd.step, cdMax: 4 },
      { key: 'V', name: 'Miasma', kanji: '毒霧', active: this.flare },
    ];
  }
}
