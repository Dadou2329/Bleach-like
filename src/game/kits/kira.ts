// Izuru Kira's kit (docs/kits/kira.md). The wretched one: Kidō at range until they come close, then every cut
// doubles what it touches until they kneel with their heads bowed.
// Sealed: the thrust, a diagonal cut, the rising cut that launches, the flat cut (LMB); Bakudō #39 Enkōsen — a
// spinning disc before his palm that turns blows and shots from the front (RMB; in the air Hadō #31 Shakkahō);
// Hadō #58 Tenran — the sword spun like a fan, a widening tornado (Q); Bakudō #63 Sajō Sabaku, and Gaten on a bound
// or stunned target close by — the drop that puts them to sleep (E); Bakudō #73 Tōzanshō — the inverted pyramid
// closed round a target at range, or round himself up close (R); "Omote o agero, Wabisuke" (F); Kaidō (G).
// Shikai Wabisuke: every cut that lands doubles the body (or the weapon of a target caught swinging, or that
// parried it): ×8 no jumps, ×64 kneel, ×256 pinned and sinking; a weapon at ×128 falls from the hand. LMB the hook
// thrust, the backhand cut, the rising hook, the downward chop; RMB the hook pull; Q on a kneeling target the
// reverse guillotine ("Omote o agero"; pinned: Penance, ten strikes first), otherwise the weighted parry; E Heavy
// Step (his own foot ×128: a crater stomp; in the air the meteor drop); R Debris Rain [novel]; F seals (all the
// weight vanishes); G Kaidō. Passives: Bakudō #37 Tsuriboshi catches him when he is knocked flying; in Shikai the
// shots his swinging blade touches turn heavy and drop.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { DamageOpts, Game } from '../game';
import { KATANA_BASE_Z, KATANA_TIP_Z, WABISUKE_BASE_Z, WABISUKE_HOOK_Y, WABISUKE_TOP_Z, kiraAsset, kiraProp } from '../../chars/kira';
import { KIRA_CHAIN, KIRA_CLIPS, KIRA_STANCE, WABISUKE_CHAIN, WABISUKE_CLIPS, WABISUKE_STANCE } from '../../chars/kiraClips';
import { registerReactions } from '../../chars/reactionClips';
import type { AuraStyle } from '../../vfx/aura';
import { SajoRope } from '../../vfx/kazeshini';
import { DebrisChunk, EnkosenDisc, KIRA_BLUE, TenranWind, Tozansho, TsuriboshiNet, gatenDrop, heavyStomp, kaidoGlow, weighDown, weightHex, weightRing } from '../../vfx/wabisuke';
import { groundAt } from '../../vfx/iceArts';
import { SphereShape } from '../../destruction/shapes';
import { TEX_GLOW, TEX_STREAK } from '../../vfx/sprites';
import { Shakkaho } from '../projectiles/shakkaho';
import type { AbilityInfo } from '../../ui/hud';
import type { Kit, KitAI } from './kit';

type BladeDef = NonNullable<FighterDef['blade']>;
type Form = 'sealed' | 'shikai';

const AURA: AuraStyle = { core: KIRA_BLUE.core, body: KIRA_BLUE.body, rim: KIRA_BLUE.rim };
const TRAIL = { color: '#A9C8F0', core: '#F2F7FF' };
const KATANA: BladeDef = { prop: 'sword', base: [0, 0, KATANA_BASE_Z], tip: [0, 0, KATANA_TIP_Z], ...TRAIL };
/** the Shikai: the straight blade out to the far corner of the hook */
const HOOK: BladeDef = { prop: 'sword', base: [0, 0, WABISUKE_BASE_Z], tip: [0, WABISUKE_HOOK_Y * 0.6, WABISUKE_TOP_Z], color: '#B9CCF2', core: '#F2F6FF' };
const SPEED: FighterDef['speed'] = { run: 10.2, sprint: 22, jump: 11.5, dash: 15, dashTime: 0.12 };
/** the most doublings a part can carry (×1024) */
const MAX_DOUBLINGS = 10;
const KNEEL_AT = 6;
const PIN_AT = 8;
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

/** both forms' clips (the release runs on through the swap) */
const CLIPS = [...KIRA_CLIPS, ...WABISUKE_CLIPS.filter((c) => !KIRA_CLIPS.some((k) => k.name === c.name))];

const sealedProps = () => [
  { key: 'sword', model: kiraProp('katana'), socket: 'grip.R' },
  { key: 'saya', model: kiraProp('saya'), socket: 'hip.L' },
];

export const KIRA_DEF: FighterDef = {
  id: 'kira',
  name: 'Izuru Kira',
  title: 'Lieutenant, 3rd Division',
  build: () => ({ asset: kiraAsset(), props: sealedProps() }),
  stance: KIRA_STANCE,
  clips: CLIPS,
  aura: AURA,
  blade: KATANA,
  hp: 950,
  rei: 170,
  speed: { ...SPEED },
  radius: 0.38,
  height: 1.73,
};

// ------------------------------------------------------------------ helpers

function lungeTo(f: Fighter, stop: number, at: number, max = 26): number {
  const tgt = f.faceTarget;
  if (!tgt) return 0;
  const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
  if (d <= stop + 0.25 || d > 8) return 0;
  const per = (1 - Math.exp(-f.pushDrag * Math.max(0.06, at - 0.05))) / f.pushDrag;
  f.push.addScaledVector(f.forward(_v), Math.min(max, (d - stop) / per));
  return stop;
}

function lungeStop(f: Fighter, stop: number): number {
  const tgt = f.faceTarget;
  if (stop > 0 && tgt && Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z) <= stop) {
    f.push.x = 0;
    f.push.z = 0;
    return 0;
  }
  return stop;
}

const spec = (damage: number, knock: number, cut: number, extra: Partial<BladeSpec> = {}): BladeSpec => ({ damage, knock, launch: 0, hitstop: 0.05, shake: 0.14, cut, ...extra });

/** blade windows of each string move (the clip's time) */
const MOVES: Record<string, { at: [number, number]; spec: BladeSpec }> = {
  kr_s1: { at: [0.12, 0.22], spec: spec(18, 7, 340, { reach: 0.14 }) },
  kr_s2: { at: [0.1, 0.22], spec: spec(18, 8, 360, { reach: 0.1 }) },
  kr_s3: { at: [0.1, 0.24], spec: spec(18, 3, 360, { launch: 9, reach: 0.1 }) },
  kr_s4: { at: [0.12, 0.28], spec: spec(24, 12, 420, { heavy: true, hitstop: 0.08, shake: 0.25, reach: 0.12 }) },
  kw_s1: { at: [0.12, 0.22], spec: spec(15, 4, 320, { reach: 0.16 }) },
  kw_s2: { at: [0.1, 0.23], spec: spec(15, 5, 320, { reach: 0.14 }) },
  kw_s3: { at: [0.1, 0.24], spec: spec(15, 2, 320, { launch: 7, reach: 0.14 }) },
  kw_s4: { at: [0.14, 0.3], spec: spec(22, 6, 380, { heavy: true, hitstop: 0.08, shake: 0.25, reach: 0.16 }) },
};

/** Marker for the skills a string can cancel into. */
abstract class SkillAction extends FighterAction {}

/** One move of a string. */
class MoveAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private stopAt = 0;
  private armed = false;
  queued = false;
  constructor(readonly kit: KiraKit, readonly clip: string, readonly index: number) {
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
    this.stopAt = lungeTo(f, 1.25, MOVES[this.clip].at[0]);
    f.anim.play(this.clip, { onEvent: (n) => n === 'step' && g.sfx.play('step', f.pos, 0.5) });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    this.stopAt = lungeStop(f, this.stopAt);
    const m = MOVES[this.clip];
    if (!this.armed && t >= m.at[0] - 0.04) {
      this.armed = true;
      f.bladeHits.clear();
      f.bladeSpec = this.kit.bladeSpec(m.spec);
      g.sfx.play(m.spec.heavy ? 'swingHeavy' : 'swing', f.center());
    }
    const on = t >= m.at[0] && t <= m.at[1];
    f.bladeActive = on;
    if (f.trail) f.trail.emitting = this.armed && t <= m.at[1] + 0.04;
    if (on) this.kit.deflect();
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
    const w = MOVES[this.clip].at[1];
    if (next.name === 'dash') return this.t >= w;
    return next instanceof SkillAction && this.t >= w + 0.04;
  }
}

/** A skill: plays its clip, runs its events, ends with the clip (or at `endAt`). */
class Skill extends SkillAction {
  private fired = new Set<string>();
  private cancelAt: number;
  constructor(readonly kit: KiraKit, readonly name: string, readonly clip: string, readonly endAt: number, readonly events: Record<string, [number, () => void]>, opts: { armor?: number; mobility?: number; cancelAt?: number; hold?: boolean } = {}) {
    super();
    this.mobility = opts.mobility ?? 0.2;
    this.armor = opts.armor ?? 0;
    this.cancelAt = opts.cancelAt ?? endAt * 0.8;
    this.hold = !!opts.hold;
  }
  private hold: boolean;
  override start(f: Fighter): void {
    f.anim.play(this.clip, { onEvent: (n) => this.fire(n), hold: this.hold });
  }
  private fire(n: string): void {
    const e = this.events[n];
    if (!e || this.fired.has(n)) return;
    this.fired.add(n);
    e[1]();
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    for (const [n, [at]] of Object.entries(this.events)) if (this.t >= at + 0.03) this.fire(n);
    if (this.t >= this.endAt) this.done = true;
  }
  override end(f: Fighter): void {
    for (const n of Object.keys(this.events)) this.fire(n);
    if (this.hold) f.anim.stopAll(0.2);
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t >= this.cancelAt;
  }
}

/** G: Kaidō — the hands over his wound, healing while it holds (rooted; a blow ends it). */
class KaidoAction extends SkillAction {
  readonly name = 'kaido';
  private fx = 0;
  constructor(readonly kit: KiraKit) {
    super();
    this.mobility = 0;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('kr_kaido', { hold: true });
    g.callout('回道', 'KAIDŌ', '#6BE08A');
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const inside = this.kit.shieldUp();
    f.rei -= dt * 8;
    f.hp = Math.min(f.maxHp, f.hp + dt * 22 * (inside ? 2 : 1));
    this.fx -= dt;
    if (this.fx <= 0) {
      this.fx = 0.05;
      kaidoGlow(g, f.center(_v).add(f.forward(_w).multiplyScalar(0.25)).setY(f.pos.y + 1.05), 1);
    }
    if (f.rei <= 0 || f.hp >= f.maxHp) this.done = true;
  }
  override end(f: Fighter): void {
    f.anim.stopAll(0.25);
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' || next instanceof SkillAction;
  }
}

/** E (Shikai, airborne): the meteor drop — his foot ×128, straight down, a crater where he lands. */
class DropAction extends SkillAction {
  readonly name = 'drop';
  private crushed = false;
  constructor(readonly kit: KiraKit) {
    super();
    this.mobility = 0.2;
    this.airGravity = 1;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('kw_drop', { hold: true });
    f.hovering = false;
    f.body.vel.y = Math.min(f.body.vel.y, -30);
    g.sfx.play('swingHeavy', f.center(), 1);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    f.body.vel.y = Math.min(f.body.vel.y, -40);
    weightRing(g, f.pos.clone().setY(f.pos.y + 0.1), 9, 0.5);
    // a fighter right under his foot (the Jigoku no Gaki)
    if (!this.crushed)
      for (const o of g.enemiesOf(f)) {
        if (o.dead || Math.hypot(o.pos.x - f.pos.x, o.pos.z - f.pos.z) > o.def.radius + 0.7) continue;
        const top = o.pos.y + o.def.height;
        if (f.pos.y < top - 0.6 || f.pos.y > top + 1.2) continue;
        this.crushed = true;
        g.damage(o, 140, f, _v.set(0, -1, 0).clone(), { knock: 1, heavy: true, hitstop: 0.14, shake: 0.5 });
        this.kit.double(o, 'body', 2);
        if (!o.def.boss) o.body.vel.y = -24;
      }
    if ((f.grounded && this.t > 0.03) || this.t > 1.6) {
      this.done = true;
      this.kit.stompAt(f.pos.clone(), 2.8, 1200, 4, 90);
    }
  }
  override end(f: Fighter): void {
    f.anim.stopAll(0.2);
  }
}

/** Q (Shikai): the reverse guillotine on a kneeling target (pinned: Penance's ten strikes first). */
class GuillotineAction extends SkillAction {
  readonly name = 'guillotine';
  private penance: boolean;
  private strikes = 0;
  private stage = 0;
  private lifted = false;
  private t0 = 0;
  constructor(readonly kit: KiraKit, readonly v: Fighter) {
    super();
    this.mobility = 0;
    this.armor = 0.6;
    this.penance = v.heavyB >= PIN_AT;
  }
  override start(f: Fighter, g: Game): void {
    const v = this.v;
    // Shunpo to them, in front, looking down at the bowed head
    const away = _v.subVectors(f.pos, v.pos).setY(0);
    if (away.lengthSq() < 1e-3) f.forward(away).negate();
    away.normalize();
    const d = Math.hypot(f.pos.x - v.pos.x, f.pos.z - v.pos.z);
    if (d > 1.3) {
      f.ghosts.spawn(0.5, 1);
      f.body.pos.set(v.pos.x + away.x * 1.05, v.pos.y, v.pos.z + away.z * 1.05);
      f.body.prev.copy(f.body.pos);
      f.body.vel.set(0, 0, 0);
      g.onDash(f);
    }
    f.faceTarget = v.center();
    f.yaw = Math.atan2(v.pos.x - f.pos.x, v.pos.z - f.pos.z);
    this.kit.holdKneel(v, this.penance ? 2.6 : 1.4);
    if (this.penance) {
      f.anim.play('kw_penance');
      g.callout('懺悔', 'PENANCE', '#9FC2FF');
    } else this.startLift(f, g);
  }
  private startLift(f: Fighter, g: Game): void {
    this.stage = 1;
    this.t0 = this.t;
    f.anim.play('kw_guillotine');
    g.callout('面を上げろ', 'OMOTE O AGERO', '#9FC2FF');
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const v = this.v;
    if (v.dead) {
      this.done = true;
      return;
    }
    f.faceTarget = v.center();
    if (this.stage === 0) {
      // ten strikes, each one more doubling, the ground giving way under them
      const want = Math.min(10, Math.floor((this.t - 0.08) / 0.085) + 1);
      while (this.strikes < want && this.t >= 0.08) {
        this.strikes++;
        const last = this.strikes === 10;
        g.damage(v, 12, f, f.forward(_v).clone(), { knock: 0, quiet: !last && this.strikes !== 1, unblockable: true, hitstop: last ? 0.08 : 0.02 });
        this.kit.double(v, 'body', 1, !last);
        g.sparks(v.center(), f.forward(_v), '#9FC2FF', 5);
      }
      if (this.t >= 1.0) this.startLift(f, g);
      return;
    }
    const lt = this.t - this.t0;
    if (!this.lifted && lt >= 0.5) {
      this.lifted = true;
      const boss = !!v.def.boss;
      const dmg = this.penance ? (boss ? 140 + v.maxHp * 0.12 : 240 + v.maxHp * 0.3) : boss ? 100 + v.maxHp * 0.08 : 160 + v.maxHp * 0.2;
      this.kit.releaseKneel(v);
      g.damage(v, dmg, f, _v.set(0, 1, 0).add(f.forward(_w).multiplyScalar(0.3)).normalize().clone(), { knock: 3, launch: 4, heavy: true, unblockable: true, hitstop: 0.2, shake: 0.55 });
      g.slowMo(0.35, 0.3);
      const neck = v.center(_v).setY(v.pos.y + v.def.height * 0.62);
      g.sparks(neck, _w.set(0, 1, 0), '#E3262E', 22);
      for (let i = 0; i < 18; i++) {
        const a = -0.6 + (i / 17) * 1.2;
        g.engine.glow.spawn({ x: neck.x + Math.sin(a) * 0.5, y: neck.y + Math.cos(a) * 0.5 - 0.3, z: neck.z, vy: 3, size: 0.16, sizeEnd: 0.03, life: 0.35, r: 2, g: 2.1, b: 2.4, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
      }
    }
    if (lt >= 1.0) this.done = true;
  }
  override end(f: Fighter): void {
    if (!this.lifted) this.kit.releaseKneel(this.v);
    f.anim.stopAll(0.2);
  }
}

/** Q (Shikai, nobody kneeling): the weighted parry — the first blow is turned and the attacker's weapon doubles twice. */
class ParryAction extends SkillAction {
  readonly name = 'wparry';
  constructor(readonly kit: KiraKit) {
    super();
    this.mobility = 0.15;
  }
  override start(f: Fighter): void {
    f.anim.play('kw_parry', { hold: true });
    this.kit.parryUntil = this.kit.g.time + 0.6;
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 0.6) this.done = true;
  }
  override end(f: Fighter): void {
    this.kit.parryUntil = 0;
    f.anim.stopAll(0.15);
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t > 0.2;
  }
}

// ------------------------------------------------------------------ the weight

interface Weighed {
  o: Fighter;
  /** game time of the last doubling */
  last: number;
  shedT: number;
  kneelT: number;
  pinned: boolean;
  sinkT: number;
  /** the kit holds it down (an execution in progress) */
  held: number;
  /** where its feet were when it was pinned (it sinks a metre at most) */
  sinkFrom: number;
}

export class KiraKit implements Kit {
  form: Form = 'sealed';
  comboIndex = 0;
  private lastSwingEnd = 0;
  flare = false;
  parryUntil = 0;
  private disc: EnkosenDisc | null = null;
  private shield: Tozansho | null = null;
  private cage: Tozansho | null = null;
  private bound: { o: Fighter; until: number } | null = null;
  private chunks: DebrisChunk[] = [];
  readonly weighed = new Map<number, Weighed>();
  private hudT = 0;
  /** things to do later, on the simulation's clock (hitstop and slow motion stretch them too) */
  private timers: { t: number; fn: () => void }[] = [];
  readonly cd = { enkosen: 0, shakka: 0, tenran: 0, sajo: 0, gaten: 0, tozan: 0, kaido: 0, pull: 0, exec: 0, parry: 0, stomp: 0, debris: 0, net: 0 };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.parry = (amount, from, o) => this.parry(amount, from, o);
    f.onHurt = (_dmg) => {
      // a blow ends Kaidō
      if (f.action instanceof KaidoAction) f.stopAction();
      this.tsuriboshi();
    };
    // a frail body
    f.knockTaken = 1.1;
    this.applyStats();
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    if (this.disc?.done) this.disc = null;
    if (this.cage?.done) this.endCage();
    if (this.shield?.done) this.endShield();
    if (this.shield) f.rooted = true;
    if (this.bound && (this.bound.o.dead || g.time > this.bound.until)) this.bound = null;
    this.chunks = this.chunks.filter((c) => !c.done);
    for (let i = this.timers.length - 1; i >= 0; i--) {
      const tm = this.timers[i];
      tm.t -= dt;
      if (tm.t > 0) continue;
      this.timers.splice(i, 1);
      tm.fn();
    }
    // his death takes the weight with it
    if (f.dead) {
      if (this.weighed.size) this.clearWeight();
    } else this.updateWeight(dt);
    this.hudT -= dt;
    if (this.hudT <= 0 && g.hud && f === g.player) {
      this.hudT = 0.25;
      g.hud.form = this.formName();
    }
  }

  // ---------------------------------------------------------------- inputs

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof MoveAction) {
      if (cur.index >= 0) cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastSwingEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const list = this.form === 'sealed' ? KIRA_CHAIN : WABISUKE_CHAIN;
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    this.lastSwingEnd = this.g.time + 0.8;
    this.f.act(new MoveAction(this, list[idx], idx), true);
  }

  /** RMB: Enkōsen (Shakkahō in the air) / the hook pull */
  heavy(): void {
    const { f } = this;
    if (this.form === 'shikai') {
      this.special(new Skill(this, 'pull', 'kw_pull', 0.56, { catch: [0.17, () => this.hookPull()] }, { armor: 0.2 }), 10, 'pull', 2.6);
    } else if (!f.grounded) {
      this.special(new Skill(this, 'shakka', 'kr_palm', 0.4, { cast: [0.12, () => this.shakkaho()] }), 12, 'shakka', 2.5);
    } else {
      this.special(new Skill(this, 'enkosen', 'kr_palm', 0.9, { cast: [0.06, () => this.enkosen()] }, { mobility: 0.1, cancelAt: 0.3 }), 8, 'enkosen', 3.5);
    }
  }

  /** Q: Tenran / the reverse guillotine on a kneeling target, else the weighted parry */
  skill1(): void {
    if (this.form === 'sealed') {
      this.special(new Skill(this, 'tenran', 'kr_tenran', 0.58, { wind: [0.4, () => this.tenran()] }, { mobility: 0.1 }), 14, 'tenran', 6);
      return;
    }
    const v = this.kneeling(6);
    if (v) this.special(new GuillotineAction(this, v), 10, 'exec', 1.5);
    else this.special(new ParryAction(this), 6, 'parry', 2.5);
  }

  /** E: Sajō Sabaku (Gaten on a bound or stunned target close by) / Heavy Step (the meteor drop in the air) */
  skill2(): void {
    const { f } = this;
    if (this.form === 'sealed') {
      const sleeper = this.gatenTarget();
      if (sleeper) this.special(new Skill(this, 'gaten', 'kr_gaten', 0.46, { drop: [0.2, () => this.gaten(sleeper)] }, { mobility: 0.3 }), 10, 'gaten', 6);
      else this.special(new Skill(this, 'sajo', 'kr_sajo', 0.6, { bind: [0.32, () => this.sajo()] }), 12, 'sajo', 8);
      return;
    }
    if (!f.grounded) this.special(new DropAction(this), 16, 'stomp', 6);
    else this.special(new Skill(this, 'stomp', 'kw_stomp', 0.66, { lift: [0.06, () => this.footRings()], stomp: [0.32, () => this.stomp()] }, { armor: 0.4, mobility: 0.05 }), 16, 'stomp', 6);
  }

  /** R: Tōzanshō / Debris Rain */
  skill3(): void {
    if (this.form === 'sealed') {
      this.special(new Skill(this, 'tozan', 'kr_tozan', 0.6, { cast: [0.2, () => this.tozansho()] }, { mobility: 0 }), 18, 'tozan', 10);
      return;
    }
    this.special(new Skill(this, 'debris', 'kw_debris', 1.16, { lift: [0.36, () => this.liftDebris()], strike: [0.5, () => this.strikeDebris()], fall: [0.9, () => this.dropDebris()] }, { mobility: 0.05, armor: 0.2 }), 22, 'debris', 9);
  }

  /** F: "Omote o agero, Wabisuke" / the seal */
  release(): void {
    const { f, g } = this;
    if (f.busy || f.sealT > 0) return;
    if (this.form === 'sealed') {
      if (!f.spendRei(16)) return this.noRei();
      f.act(new Skill(this, 'release', 'kr_release', 0.86, {
        name: [0.22, () => g.callout('面を上げろ「侘助」', 'OMOTE O AGERO, WABISUKE', '#9FC2FF')],
        fold: [0.42, () => this.toShikai()],
      }, { armor: 0.5, mobility: 0.1 }), true);
      return;
    }
    f.act(new Skill(this, 'seal', 'kw_seal', 0.56, { fold: [0.3, () => this.toSealed()] }, { mobility: 0.2 }), true);
  }

  /** G: Kaidō (toggled) */
  toggle(): void {
    const f = this.f;
    if (f.action instanceof KaidoAction) {
      f.stopAction();
      return;
    }
    if (f.hp >= f.maxHp) {
      if (f === this.g.player) this.g.hud?.showBanner('Not wounded', 1);
      return;
    }
    this.special(new KaidoAction(this), 6, 'kaido', 1);
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

  /** run fn after s seconds of simulation time */
  private after(s: number, fn: () => void): void {
    this.timers.push({ t: s, fn });
  }

  private noRei(): void {
    if (this.f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
  }

  target(range: number): Fighter | null {
    return this.g.nearestEnemy(this.f, range, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, range);
  }

  private special(a: FighterAction, cost: number, cdKey: keyof typeof this.cd, cd: number): boolean {
    const f = this.f;
    if (this.cd[cdKey] > 0 || f.dead) return false;
    if (f.action && !f.action.canCancel(a)) return false;
    if (f.hitstun > 0 || f.dashT > 0) return false;
    if (!f.spendRei(cost)) {
      this.noRei();
      return false;
    }
    this.cd[cdKey] = cd;
    f.act(a, true);
    return true;
  }

  // ---------------------------------------------------------------- forms

  private toShikai(): void {
    const { f, g } = this;
    if (this.form === 'shikai') return;
    this.form = 'shikai';
    f.visual.attach('sword', kiraProp('wabisuke'), 'grip.R');
    f.anim.loco.stance = WABISUKE_STANCE;
    f.def = { ...f.def, stance: WABISUKE_STANCE, blade: HOOK };
    f.bladeValid = false;
    f.trail?.reset();
    f.trail?.setColor(HOOK.color, HOOK.core);
    f.aura.flare(1.4, 0.5);
    this.applyStats();
    // the blade straightens and folds: a pale flash along it
    const tip = f.blade.tip.clone(), base = f.blade.base.clone();
    for (let i = 0; i < 12; i++) {
      const p = _v.lerpVectors(base, tip, i / 11);
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.3, sizeEnd: 0.05, life: 0.35, r: 1.6, g: 1.8, b: 2.2, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
    g.sfx.play('ting', f.center(), 1);
  }

  private toSealed(): void {
    const { f, g } = this;
    if (this.form === 'sealed') return;
    this.form = 'sealed';
    f.visual.attach('sword', kiraProp('katana'), 'grip.R');
    f.anim.loco.stance = KIRA_STANCE;
    f.def = { ...f.def, stance: KIRA_STANCE, blade: KATANA };
    f.bladeValid = false;
    f.trail?.reset();
    f.trail?.setColor(KATANA.color, KATANA.core);
    this.applyStats();
    // resealed: every doubling Wabisuke laid on anything is gone
    this.clearWeight();
    g.sfx.play('ting', f.center(), 0.7);
  }

  private applyStats(): void {
    const f = this.f;
    f.power = (this.form === 'shikai' ? 1.3 : 1) * (this.flare ? 1.25 : 1);
    f.aura.target = this.flare ? 1 : this.form === 'sealed' ? 0.08 : 0.16;
  }

  formName(): string {
    if (this.form === 'sealed') return 'Wabisuke (sealed)';
    let most = 0;
    for (const w of this.weighed.values()) most = Math.max(most, w.o.heavyB, w.o.heavyW);
    return 'Shikai — Wabisuke' + (most > 0 ? ` · ×${2 ** most}` : '');
  }

  // ---------------------------------------------------------------- the weight

  /** the blade's spec: in Shikai every cut doubles what it cut */
  bladeSpec(s: BladeSpec): BladeSpec {
    if (this.form !== 'shikai') return s;
    return { ...s, onHit: (o) => this.onCut(o) };
  }

  /** a Shikai cut reached them: the body doubles (the weapon, if it was swinging or turned the cut) */
  private onCut(o: Fighter): void {
    const g = this.g;
    if (o.dead) return;
    const landed = o.lastHurt.at === g.time;
    if (landed) {
      // it must actually cut: skin that shrugged it off gains nothing
      if (o.lastHurt.shrug) return;
      this.double(o, o.bladeActive ? 'weapon' : 'body', 1);
      return;
    }
    // no damage: dodged through (nothing) or parried (the blade that turned it doubles)
    if (o.invuln > 0 || o.action?.invulnerable) return;
    this.double(o, 'weapon', 1);
  }

  /** n more doublings on a fighter's body or weapon (`quiet`: no tag, a flurry tags only its last) */
  double(o: Fighter, part: 'body' | 'weapon', n: number, quiet = false): void {
    const g = this.g;
    if (o.dead || n <= 0) return;
    // a weapon that is not a blade (ash, petals, fists) cannot be weighted: the body takes it
    if (part === 'weapon' && !o.def.blade) part = 'body';
    let w = this.weighed.get(o.id);
    if (!w) {
      w = { o, last: g.time, shedT: 5, kneelT: 0, pinned: false, sinkT: 0, held: 0, sinkFrom: o.pos.y };
      this.weighed.set(o.id, w);
    }
    w.last = g.time;
    w.shedT = 5;
    const was = part === 'body' ? o.heavyB : o.heavyW;
    const now = Math.min(MAX_DOUBLINGS, was + n);
    if (part === 'body') o.heavyB = now;
    else o.heavyW = now;
    const at = part === 'weapon' && o.bladeValid ? o.blade.tip.clone() : o.center(_v).setY(o.pos.y + o.def.height * 0.55);
    weightRing(g, at, now, part === 'body' ? 0.9 : 0.5);
    if (!quiet && now !== was) g.hud?.floatText(at.clone().setY(at.y + 0.5), `×${2 ** now}${part === 'weapon' ? ' ⚔' : ''}`, weightHex(now), 15 + now * 1.2);
    g.sfx.play('ting', at, 0.35 + now * 0.04);
    if (now >= 3) o.hovering = false;
    if (part === 'weapon' && now >= 7) {
      // too heavy to hold: it falls from the hand (and comes back at ×16)
      o.disarmT = Math.max(o.disarmT, 3);
      o.heavyW = 4;
      o.stopAction();
      g.hud?.floatText(o.center(), 'DROPPED', '#9FC2FF', 18);
      if (o.bladeValid) g.engine.destruction.carve(new SphereShape(o.blade.tip.clone(), 0.45, 0.5), { mode: 'smash', power: 300, impulse: 3 });
    }
    if (part === 'body' && now >= KNEEL_AT) this.kneel(w);
  }

  /** borne down onto its knees (pinned flat from ×256) */
  private kneel(w: Weighed): void {
    const { g } = this;
    const o = w.o;
    const pinned = o.heavyB >= PIN_AT;
    const dur = o.def.boss ? 0.8 : pinned ? 3.2 : 2.4;
    const fresh = w.kneelT <= 0 || pinned !== w.pinned;
    if (pinned && !w.pinned) w.sinkFrom = o.pos.y;
    w.kneelT = Math.max(w.kneelT, dur);
    w.pinned = pinned;
    o.stopAction();
    o.hitstun = Math.max(o.hitstun, w.kneelT);
    o.rooted = true;
    o.hovering = false;
    if (fresh && !o.def.stance.quad) {
      registerReactions(o.anim);
      o.anim.play(pinned ? 'weighed_pin' : 'weighed_kneel', { hold: true });
    }
    if (fresh) {
      g.sfx.play('impact', o.pos, 0.8);
      g.engine.destruction.carve(new SphereShape(o.pos.clone(), 1.1, 0.3), { mode: 'smash', power: 200, impulse: 2, dust: 0.3 });
      g.hud?.floatText(o.center(_v).setY(o.pos.y + o.def.height + 0.3), pinned ? 'PINNED' : 'KNEEL', weightHex(o.heavyB), 20);
    }
  }

  /** an execution keeps them down until it is done */
  holdKneel(o: Fighter, s: number): void {
    const w = this.weighed.get(o.id);
    if (!w) return;
    w.held = s;
    w.kneelT = Math.max(w.kneelT, s);
    o.hitstun = Math.max(o.hitstun, s);
    o.rooted = true;
  }

  releaseKneel(o: Fighter): void {
    const w = this.weighed.get(o.id);
    if (!w) return;
    w.held = 0;
    w.kneelT = 0;
    this.stand(w);
  }

  private stand(w: Weighed): void {
    const o = w.o;
    o.rooted = false;
    w.pinned = false;
    if (!o.dead && (o.anim.isPlaying('weighed_kneel') || o.anim.isPlaying('weighed_pin'))) o.anim.stopAll(0.3);
  }

  /** the nearest enemy kneeling under the weight within range */
  kneeling(range: number): Fighter | null {
    let best: Fighter | null = null, bd = range;
    for (const w of this.weighed.values()) {
      if (w.kneelT <= 0 || w.o.dead) continue;
      const d = w.o.pos.distanceTo(this.f.pos);
      if (d <= bd) {
        bd = d;
        best = w.o;
      }
    }
    return best;
  }

  private updateWeight(dt: number): void {
    const g = this.g;
    for (const [id, w] of this.weighed) {
      const o = w.o;
      if (o.dead || !g.fighters.includes(o)) {
        o.heavyB = 0;
        o.heavyW = 0;
        if (w.kneelT > 0) o.rooted = false;
        this.weighed.delete(id);
        continue;
      }
      if (w.kneelT > 0) {
        w.kneelT -= dt;
        if (w.held > 0) w.held -= dt;
        o.hitstun = Math.max(o.hitstun, 0.1);
        o.rooted = true;
        if (w.pinned) {
          // the ground gives way under them
          w.sinkT -= dt;
          // a broad, shallow crater rather than a shaft: they stay in sight as they go down
          if (w.sinkT <= 0 && o.pos.y > w.sinkFrom - 0.5) {
            w.sinkT = 0.5;
            g.engine.destruction.carve(new SphereShape(o.pos.clone().setY(o.pos.y - 0.1), 1.2 + o.heavyB * 0.04, 0.32), { mode: 'smash', power: 160 + o.heavyB * 40, impulse: 1.5, dust: 0.15 });
          }
        }
        if (w.kneelT <= 0) this.stand(w);
      }
      weighDown(g, o, dt);
      // the weight holds while the Shikai does; long without a new cut it sheds a doubling at a time (game)
      if (g.time - w.last > 6) {
        w.shedT -= dt;
        if (w.shedT <= 0) {
          w.shedT = 5;
          if (o.heavyB > 0) o.heavyB--;
          else if (o.heavyW > 0) o.heavyW--;
        }
      }
      if (o.heavyB === 0 && o.heavyW === 0 && w.kneelT <= 0) this.weighed.delete(id);
    }
  }

  /** resealed (or dead): every doubling vanishes at once */
  clearWeight(): void {
    for (const w of this.weighed.values()) {
      const o = w.o;
      o.heavyB = 0;
      o.heavyW = 0;
      if (w.kneelT > 0) this.stand(w);
      if (!o.dead) weightRing(this.g, o.center(), 0, 1.2);
    }
    this.weighed.clear();
  }

  /** heavy deflection [novel]: shots the swinging Shikai blade touches turn heavy and drop short */
  deflect(): void {
    if (this.form !== 'shikai' || !this.f.bladeValid) return;
    const tip = this.f.blade.tip;
    if (this.g.rejectNear(tip, 1.3, this.f, false) > 0) weightRing(this.g, tip.clone(), 4, 0.6);
  }

  // ---------------------------------------------------------------- guards and passives

  /** before a blow lands: Tōzanshō round him, Enkōsen's disc, the weighted parry */
  private parry(_amount: number, from: Fighter | null, o: DamageOpts): boolean {
    const { f, g } = this;
    if (f.dead) return false;
    if (this.shield && !this.shield.done) {
      if (!o.quiet) g.sparks(f.center(), _v.set(0, 1, 0), '#BFE0FF', 6);
      return true;
    }
    if (!from) return false;
    const front = _v.subVectors(from.pos, f.pos).setY(0).normalize().dot(f.forward(_w)) > 0.3;
    if (this.disc && !this.disc.done && front) {
      this.disc.absorb(!!o.heavy);
      return true;
    }
    if (this.parryUntil > g.time && front) {
      this.parryUntil = 0;
      this.double(from, 'weapon', 2);
      g.sparks(f.blade.tip.clone(), f.forward(_v), '#9FC2FF', 14);
      g.sfx.play('crack', f.center(), 1);
      g.hitstop(0.08);
      // and the counter cut
      f.stopAction();
      this.comboIndex = 1;
      this.chain(1);
      return true;
    }
    return false;
  }

  /** Bakudō #37 Tsuriboshi: knocked flying, a net of light catches him */
  private tsuriboshi(): void {
    const { f, g } = this;
    if (this.cd.net > 0 || f.dead) return;
    const flung = Math.hypot(f.push.x, f.push.z) > 10 || f.body.vel.y > 7;
    if (!flung) return;
    this.cd.net = 12;
    g.addProjectile(new TsuriboshiNet(g, f, _v.set(-f.push.x, 0, -f.push.z)));
    f.push.set(0, 0, 0);
    f.body.vel.y = Math.min(f.body.vel.y, 1.5);
    f.hitstun = Math.min(f.hitstun, 0.15);
    g.callout('縛道の三十七「吊星」', 'BAKUDŌ #37 — TSURIBOSHI', '#5AA8FF');
  }

  /** Tōzanshō is closed round him */
  shieldUp(): boolean {
    return !!this.shield && !this.shield.done;
  }

  // ---------------------------------------------------------------- sealed Kidō

  private enkosen(): void {
    const { f, g } = this;
    this.disc?.shatter();
    this.disc = new EnkosenDisc(g, f, 0.95);
    g.addProjectile(this.disc);
    g.callout('縛道の三十九「円閘扇」', 'BAKUDŌ #39 — ENKŌSEN', '#C9B14A');
  }

  private palmPoint(out: THREE.Vector3): THREE.Vector3 {
    const s = this.f.visual.rig.sockets.get('palm.L');
    if (!s) return this.f.center(out).addScaledVector(this.f.forward(_w), 0.5);
    s.updateWorldMatrix(true, false);
    return s.getWorldPosition(out);
  }

  private aimDir(from: THREE.Vector3, range: number): THREE.Vector3 {
    const t = this.target(range);
    return t ? t.center().sub(from).normalize() : this.f.forward();
  }

  private shakkaho(): void {
    const { f, g } = this;
    const from = this.palmPoint(new THREE.Vector3());
    g.addProjectile(new Shakkaho(f, g, from, this.aimDir(from, 30), { damage: 40, speed: 30, size: 0.32, blast: 1.3, range: 30 }));
    g.callout('破道の三十一「赤火砲」', 'HADŌ #31 — SHAKKAHŌ', '#E3262E');
  }

  private tenran(): void {
    const { f, g } = this;
    const from = f.pos.clone().addScaledVector(f.forward(), 1.1);
    const t = this.target(18);
    const dir = t ? _v.subVectors(t.pos, f.pos).setY(0).normalize().clone() : f.forward();
    g.addProjectile(new TenranWind(g, f, from, dir, { speed: 9, range: 16, damage: 6 }));
    g.callout('破道の五十八「闐嵐」', 'HADŌ #58 — TENRAN', '#D9F2FF');
  }

  private sajo(): void {
    const { f, g } = this;
    const t = this.target(14);
    g.callout('縛道の六十三「鎖条鎖縛」', 'BAKUDŌ #63 — SAJŌ SABAKU', '#F2D04A');
    if (!t) return;
    const dur = t.def.boss ? 1 : 2.5;
    t.disarmT = Math.max(t.disarmT, dur);
    t.slow(0.6, dur);
    if (!t.def.boss) {
      t.stopAction();
      t.hitstun = Math.max(t.hitstun, 0.35);
    }
    this.bound = { o: t, until: g.time + dur };
    g.addProjectile(new SajoRope(g, f, t, dur, () => {}));
  }

  /** a bound, stunned or kneeling enemy within reach of his fingers */
  private gatenTarget(): Fighter | null {
    const { f, g } = this;
    for (const o of g.enemiesOf(f)) {
      if (o.dead || o.pos.distanceTo(f.pos) > 2.6) continue;
      const bound = this.bound?.o === o || o.hitstun > 0.3 || o.rooted;
      if (bound) return o;
    }
    return null;
  }

  private gaten(o: Fighter): void {
    const { f, g } = this;
    if (o.dead || o.pos.distanceTo(f.pos) > 3) return;
    // one drop: it sleeps (weak reiatsu longer; strong reiatsu shakes it off sooner)
    const s = o.def.boss ? 1 : o.maxRei >= 200 ? 1.5 : 3.5;
    o.stopAction();
    o.hitstun = Math.max(o.hitstun, s);
    if (!o.def.stance.quad) {
      registerReactions(o.anim);
      o.anim.play('weighed_kneel', { hold: true });
      this.after(s, () => {
        if (!o.dead && o.anim.isPlaying('weighed_kneel') && !this.weighed.get(o.id)?.kneelT) o.anim.stopAll(0.4);
      });
    }
    const neck = o.center(_v).setY(o.pos.y + o.def.height * 0.82);
    gatenDrop(g, neck);
    g.callout('穿点', 'GATEN', '#5ED16A');
    g.hud?.floatText(neck.clone().setY(neck.y + 0.5), 'ASLEEP', '#5ED16A', 18);
  }

  private tozansho(): void {
    const { f, g } = this;
    g.callout('縛道の七十三「倒山晶」', 'BAKUDŌ #73 — TŌZANSHŌ', '#3F86FF');
    const t = this.g.nearestEnemy(f, 12, f.forward(), 60);
    const d = t ? Math.hypot(t.pos.x - f.pos.x, t.pos.z - f.pos.z) : 0;
    if (t && d > 2.6) {
      // caged at range
      this.endCage();
      const dur = t.def.boss ? 1.2 : 3;
      this.cage = new Tozansho(g, f, t, dur);
      g.addProjectile(this.cage);
      t.rooted = true;
      t.stopAction();
      t.hitstun = Math.max(t.hitstun, 0.4);
      t.body.vel.set(0, Math.min(0, t.body.vel.y), 0);
      return;
    }
    // up close: round himself
    this.endShield();
    this.shield = new Tozansho(g, f, f, 2.5);
    g.addProjectile(this.shield);
    f.rooted = true;
  }

  private endCage(): void {
    if (!this.cage) return;
    const o = this.cage.inside;
    if (!this.weighed.get(o.id)?.kneelT) o.rooted = false;
    this.cage.end();
    this.cage = null;
  }

  private endShield(): void {
    if (!this.shield) return;
    this.f.rooted = false;
    this.shield.end();
    this.shield = null;
  }

  // ---------------------------------------------------------------- Shikai moves

  /** RMB: the hook catches the neck in front of him and drags them down to his feet */
  private hookPull(): void {
    const { f, g } = this;
    const fw = f.forward();
    let best: Fighter | null = null, bd = 2.9;
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      const to = _v.subVectors(o.pos, f.pos).setY(0);
      const d = to.length();
      if (d > bd || (d > 0.4 && to.normalize().dot(fw) < Math.cos((40 * Math.PI) / 180))) continue;
      if (o.pos.y > f.pos.y + 2.4 || o.pos.y + o.def.height < f.pos.y) continue;
      bd = d;
      best = o;
    }
    g.sfx.play('swing', f.center(), 0.7);
    if (!best) return;
    const o = best;
    g.damage(o, 18, f, fw.clone().negate(), { knock: 0, hitstop: 0.07, shake: 0.2 });
    if (o.lastHurt.at === g.time && !o.lastHurt.shrug) this.double(o, 'body', 1);
    if (!o.def.boss) {
      // hauled in and down: a step in front of him, off its feet
      const d = Math.hypot(o.pos.x - f.pos.x, o.pos.z - f.pos.z);
      if (d > 1.1) o.push.addScaledVector(fw, -Math.min(14, (d - 1.0) * 9));
      if (!o.grounded) o.body.vel.y = Math.min(o.body.vel.y, -12);
      o.stopAction();
      o.hitstun = Math.max(o.hitstun, 0.5);
    }
    g.sparks(o.center(_v).setY(o.pos.y + o.def.height * 0.8), fw, '#9FC2FF', 8);
  }

  /** the foot doubling before the stomp: rings climbing ×2 → ×128 */
  private footRings(): void {
    const { f, g } = this;
    for (let i = 1; i <= 7; i++) {
      this.after(i * 0.03, () => {
        if (f.dead || this.form !== 'shikai') return;
        const p = this.footPoint(new THREE.Vector3());
        weightRing(g, p, i + 2, 0.35 + i * 0.05);
        if (i === 7) g.hud?.floatText(p.clone().setY(p.y + 0.4), '×128', weightHex(9), 18);
      });
    }
  }

  private footPoint(out: THREE.Vector3): THREE.Vector3 {
    const s = this.f.visual.rig.sockets.get('foot.R');
    if (!s) return out.copy(this.f.pos);
    s.updateWorldMatrix(true, false);
    return s.getWorldPosition(out);
  }

  /** E: the stomp of a foot ×128 */
  private stomp(): void {
    const { f } = this;
    const p = this.footPoint(new THREE.Vector3());
    const gy = groundAt(this.g, p.x, p.y + 0.5, p.z, 2);
    p.y = gy ?? f.pos.y;
    this.stompAt(p, 2.2, 900, 3.5, 60);
  }

  /** a crater and the shock round it: everyone in it doubled and knocked down */
  stompAt(at: THREE.Vector3, radius: number, power: number, reach: number, damage: number): void {
    const { f, g } = this;
    heavyStomp(g, at, radius, power);
    g.shake(0.45);
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      const d = Math.hypot(o.pos.x - at.x, o.pos.z - at.z);
      if (d > reach + o.def.radius || o.pos.y > at.y + 1.6 || o.pos.y < at.y - 1.5) continue;
      g.damage(o, damage, f, _v.subVectors(o.pos, at).setY(0).normalize().clone(), { knock: 5, heavy: true, hitstop: 0.1, shake: 0.4 });
      if (o.lastHurt.at === g.time && !o.lastHurt.shrug) this.double(o, 'body', 1);
      if (!o.def.boss && !o.grounded) o.body.vel.y = Math.min(o.body.vel.y, -14);
    }
  }

  /** R: the whirlwind tears six chunks of ground up between him and the target */
  private liftDebris(): void {
    const { f, g } = this;
    for (const c of this.chunks) c.drop(c.pos.clone().setY(c.pos.y - 8));
    this.chunks = [];
    const t = this.target(14);
    const fw = t ? _v.subVectors(t.pos, f.pos).setY(0).normalize().clone() : f.forward();
    const side = new THREE.Vector3(fw.z, 0, -fw.x);
    const reach = t ? Math.max(3, Math.min(10, Math.hypot(t.pos.x - f.pos.x, t.pos.z - f.pos.z) - 0.5)) : 7;
    for (let i = 0; i < 6; i++) {
      const along = 1.6 + (reach - 1.6) * (i / 5);
      const x = f.pos.x + fw.x * along + side.x * (i % 2 ? 1.1 : -1.1);
      const z = f.pos.z + fw.z * along + side.z * (i % 2 ? 1.1 : -1.1);
      const gy = groundAt(g, x, f.pos.y + 2, z, 5) ?? f.pos.y;
      const ground = new THREE.Vector3(x, gy - 0.1, z);
      const hover = new THREE.Vector3(x, gy + 2.6 + (i % 3) * 0.5, z);
      const c = new DebrisChunk(g, f, ground, hover, { rise: 0.25, damage: 35, onHit: (o) => this.double(o, 'body', 1) });
      g.addProjectile(c);
      this.chunks.push(c);
    }
    g.addProjectile(new TenranWind(g, f, f.pos.clone().addScaledVector(fw, 1), fw, { speed: 7, range: 6, damage: 3 }));
    g.callout('破道の五十八「闐嵐」', 'HADŌ #58 — TENRAN', '#D9F2FF');
  }

  /** ... he strikes each chunk four times (×16) */
  private strikeDebris(): void {
    for (let r = 0; r < 4; r++)
      this.chunks.forEach((c, i) => this.after(r * 0.09 + i * 0.012, () => !c.done && c.strike(r === 3)));
  }

  /** ... and they fall on the target one after another */
  private dropDebris(): void {
    const { f } = this;
    const t = this.target(18);
    this.chunks.forEach((c, i) => this.after(i * 0.08, () => {
      if (c.done) return;
      const at = t && !t.dead ? t.center() : f.pos.clone().addScaledVector(f.forward(), 8);
      at.x += (Math.random() - 0.5) * 1.2;
      at.z += (Math.random() - 0.5) * 1.2;
      c.drop(at);
    }));
    this.chunks = [];
  }

  // ---------------------------------------------------------------- AI & HUD

  ai(): KitAI {
    const { f, g } = this;
    const sealed = () => this.form === 'sealed', shikai = () => this.form === 'shikai';
    const tgt = () => g.nearestEnemy(f, 40);
    const swinging = () => {
      const t = tgt();
      return !!t && t.action !== null && t.action.name !== 'dash' && t.pos.distanceTo(f.pos) < 3.4;
    };
    const low = () => f.hp < f.maxHp * 0.35;
    const safe = () => {
      const t = tgt();
      return this.shieldUp() || !t || t.pos.distanceTo(f.pos) > 7 || t.hitstun > 1;
    };
    return {
      reach: 2.0,
      chain: 4,
      releaseAt: [0.85],
      ranged: sealed,
      moves: [
        { name: 'tenran', use: () => this.skill1(), min: 3, max: 14, weight: 1.1, cd: 6, when: sealed },
        { name: 'enkosen', use: () => this.heavy(), min: 0, max: 3.4, weight: 1.2, cd: 4, when: () => sealed() && f.grounded && swinging() },
        { name: 'shakkaho', use: () => this.heavy(), min: 3, max: 24, weight: 2, cd: 3, when: () => sealed() && !f.grounded },
        { name: 'sajo', use: () => this.skill2(), min: 3, max: 13, weight: 0.9, cd: 8, when: () => sealed() && !this.gatenTarget() },
        { name: 'gaten', use: () => this.skill2(), min: 0, max: 2.6, weight: 4, cd: 4, when: () => sealed() && !!this.gatenTarget() },
        { name: 'cage', use: () => this.skill3(), min: 3, max: 11, weight: 0.7, cd: 12, when: sealed },
        { name: 'shield', use: () => this.skill3(), min: 0, max: 2.5, weight: 2.5, cd: 12, when: () => sealed() && low() },
        { name: 'kaido', use: () => this.toggle(), min: 0, max: 40, weight: 3, cd: 8, when: () => low() && f.rei > 40 && safe() },
        { name: 'guillotine', use: () => this.skill1(), min: 0, max: 6, weight: 12, cd: 0.5, when: () => shikai() && !!this.kneeling(6) },
        { name: 'wparry', use: () => this.skill1(), min: 0, max: 3, weight: 1, cd: 4, when: () => shikai() && !this.kneeling(6) && swinging() },
        { name: 'pull', use: () => this.heavy(), min: 1.4, max: 2.8, weight: 1.1, cd: 3, when: shikai },
        { name: 'stomp', use: () => this.skill2(), min: 0, max: 3, weight: 0.9, cd: 6, when: () => shikai() && f.grounded },
        { name: 'meteor', use: () => this.skill2(), min: 0, max: 2.5, weight: 3, cd: 6, when: () => shikai() && !f.grounded },
        { name: 'debris', use: () => this.skill3(), min: 5, max: 12, weight: 1, cd: 9, when: shikai },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    const flare = { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare };
    const kaido = { key: 'G', name: 'Kaidō', kanji: '回道', cost: 6, cd: cd.kaido, cdMax: 1, active: this.f.action instanceof KaidoAction, tint: '#6BE08A' };
    if (this.form === 'sealed') {
      const sleeper = this.gatenTarget();
      return [
        { key: 'LMB', name: 'Kenjutsu', kanji: '剣' },
        { key: 'RMB', name: this.f.grounded ? 'Enkōsen' : 'Shakkahō', kanji: this.f.grounded ? '円閘扇' : '赤火砲', cost: this.f.grounded ? 8 : 12, cd: this.f.grounded ? cd.enkosen : cd.shakka, cdMax: this.f.grounded ? 3.5 : 2.5, active: !!this.disc, tint: '#C9B14A' },
        { key: 'Q', name: 'Tenran', kanji: '闐嵐', cost: 14, cd: cd.tenran, cdMax: 6, tint: '#D9F2FF' },
        { key: 'E', name: sleeper ? 'Gaten' : 'Sajō Sabaku', kanji: sleeper ? '穿点' : '鎖条鎖縛', cost: sleeper ? 10 : 12, cd: sleeper ? cd.gaten : cd.sajo, cdMax: sleeper ? 6 : 8, tint: sleeper ? '#5ED16A' : '#F2D04A' },
        { key: 'R', name: 'Tōzanshō', kanji: '倒山晶', cost: 18, cd: cd.tozan, cdMax: 10, active: this.shieldUp() || !!this.cage, tint: '#3F86FF' },
        { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
        flare,
        { key: 'F', name: 'Omote o agero', kanji: '侘助', cost: 16, tint: '#9FC2FF' },
        kaido,
      ];
    }
    const v = this.kneeling(6);
    let most = 0;
    for (const w of this.weighed.values()) most = Math.max(most, w.o.heavyB);
    return [
      { key: 'LMB', name: `Wabisuke · ×${2 ** most}`, kanji: '侘', timer: most / MAX_DOUBLINGS, tint: weightHex(most) },
      { key: 'RMB', name: 'Hook pull', kanji: '鉤', cost: 10, cd: cd.pull, cdMax: 2.6 },
      { key: 'Q', name: v ? (v.heavyB >= PIN_AT ? 'Penance' : 'Omote o agero') : 'Weighted parry', kanji: v ? '断' : '受', cost: v ? 10 : 6, cd: v ? cd.exec : cd.parry, cdMax: v ? 1.5 : 2.5, active: !!v, tint: '#9FC2FF' },
      { key: 'E', name: this.f.grounded ? 'Heavy Step' : 'Meteor drop', kanji: '重', cost: 16, cd: cd.stomp, cdMax: 6, tint: '#7F8CFF' },
      { key: 'R', name: 'Debris Rain', kanji: '礫', cost: 22, cd: cd.debris, cdMax: 9 },
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
      flare,
      { key: 'F', name: 'Seal', kanji: '封' },
      kaido,
    ];
  }
}
