// Szayelaporro Granz's kit (docs/kits/szayelaporro.md). The scientist who never fights fair.
// Sealed: one-handed fencing (LMB); Rokureichū — a needle thrust that plants a recording bug (RMB); Lumina and Verona
// called out to fight beside him (Q); the trap panel — the floor drops away under the target (E); the power-control
// device — a field where whoever he has bugged cannot release, hits weaker, and sees the techniques he has analysed
// fizzle (R); "Susure, Fornicarás" (F); a Fracción eaten (G).
// Fornicarás: wing-branch lashes (LMB); the burrowing branch (RMB); Carbon-Copy — a black rain that sprouts a copy of
// whoever it wets, on his side; again, the snap that pops them (Q); Teatro de Titere — a wing swallows the nearest
// enemy and spits them out, and a strand bursts into a doll of them in his hand (E); Telon Balon (R); Gabriel — an
// egg laid in the target: if he dies he climbs back out of them (F); a Fracción eaten (G).
// The doll in hand: LMB the flick · RMB the stomach · Q the Achilles tendon · R the arm tendon · E the Gran Final ·
// G let it go. Passives: investigative immunization (a bugged enemy's technique seen three times does nothing to
// him), Hierro, vanity (a heavy blow makes him furious), Sonído leaves a hologram inside his field.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { Controller, DamageOpts, Game } from '../game';
import { CharacterVisual, PropMesh } from '../characterFactory';
import { DuelistAI } from '../ai/duelist';
import { rosterById } from '../registry';
import { BALON_R, KATANA_BASE_Z, KATANA_TIP_Z, szayelAsset, szayelProp } from '../../chars/szayel';
import { FORNICARAS_CHAIN, FORNICARAS_CLIPS, FORNICARAS_STANCE, SZAYEL_CHAIN, SZAYEL_CLIPS, SZAYEL_STANCE } from '../../chars/szayelClips';
import { FRACCION_CLIPS, FRACCION_STANCE, fraccionAsset, type FraccionKind } from '../../chars/szayelFraccion';
import { registerReactions } from '../../chars/reactionClips';
import type { AuraStyle } from '../../vfx/aura';
import { PeacockVines } from '../../vfx/kujaku';
import { BRANCH_LOOK, BugTag, BurrowRidge, CopyFountain, LabDome, SZAYEL_PINK, analysedFlash, eggPulse, inkBurst, strandBurst } from '../../vfx/fornicaras';
import { TEX_GLOW, TEX_PUFF } from '../../vfx/sprites';
import { CapsuleShape } from '../../destruction/shapes';
import type { AbilityInfo } from '../../ui/hud';
import type { Kit, KitAI } from './kit';

type BladeDef = NonNullable<FighterDef['blade']>;
type Form = 'sealed' | 'fornicaras';

const AURA: AuraStyle = SZAYEL_PINK;
const KATANA: BladeDef = { prop: 'sword', base: [0, 0, KATANA_BASE_Z], tip: [0, 0, KATANA_TIP_Z], color: '#F7B6D6', core: '#FFF0F7' };
const SPEED: FighterDef['speed'] = { run: 10.8, sprint: 24, jump: 12, dash: 16.5, dashTime: 0.12 };
const SPEED_R: FighterDef['speed'] = { run: 10.2, sprint: 22, jump: 12, dash: 16, dashTime: 0.12 };
const CLIPS = [...SZAYEL_CLIPS, ...FORNICARAS_CLIPS].filter((c, i, a) => a.findIndex((d) => d.name === c.name) === i);
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

const sealedProps = () => [
  { key: 'sword', model: szayelProp('katana'), socket: 'grip.R' },
  { key: 'saya', model: szayelProp('sheath-empty'), socket: 'hip.L' },
];

export const SZAYEL_DEF: FighterDef = {
  id: 'szayel',
  name: 'Szayelaporro Granz',
  title: 'Octava Espada',
  build: () => ({ asset: szayelAsset('sealed'), props: sealedProps() }),
  stance: SZAYEL_STANCE,
  clips: CLIPS,
  aura: AURA,
  blade: KATANA,
  hp: 1150,
  rei: 220,
  speed: { ...SPEED },
  radius: 0.36,
  height: 1.85,
};

// ------------------------------------------------------------------ Lumina and Verona

const FRACCION_AURA: AuraStyle = { core: '#FFE0F0', body: '#E07AB0', rim: '#8E3A66' };

function fraccionDef(kind: FraccionKind): FighterDef {
  return {
    id: `fraccion-${kind}`,
    name: kind === 'lumina' ? 'Lumina' : 'Verona',
    title: 'Fracción',
    build: () => ({ asset: fraccionAsset(kind), props: [] }),
    stance: FRACCION_STANCE,
    clips: FRACCION_CLIPS,
    aura: FRACCION_AURA,
    hp: 160,
    rei: 40,
    speed: { run: 7.5, sprint: 12, jump: 9, dash: 9, dashTime: 0.12 },
    radius: 0.42,
    height: 1.0,
  };
}

/** A Fracción's blow: a slap or a belly-bump at whoever is in front. */
class FraccionMove extends FighterAction {
  private hit = false;
  constructor(readonly name: string, readonly clip: string, readonly at: number, readonly dmg: number, readonly knock: number) {
    super();
    this.mobility = 0.2;
  }
  override start(f: Fighter): void {
    f.anim.play(this.clip);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.hit && this.t >= this.at) {
      this.hit = true;
      const fw = f.forward(_v);
      for (const o of g.enemiesOf(f)) {
        if (o.dead) continue;
        const d = _w.subVectors(o.pos, f.pos).setY(0);
        if (d.length() > 1.4 + o.def.radius || d.normalize().dot(fw) < 0.3) continue;
        g.damage(o, this.dmg, f, fw.clone(), { knock: this.knock, hitstop: 0.04 });
        g.sfx.play('hit', o.center(), 0.6);
      }
    }
    if (this.t >= 0.5) this.done = true;
  }
}

/** Lumina and Verona: they slap, bump with their bellies and cheer for him. */
class FraccionKit implements Kit {
  private cd = 0;
  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.knockTaken = 1.4;
  }
  update(dt: number): void {
    this.cd = Math.max(0, this.cd - dt);
  }
  attack(): void {
    if (!this.f.busy) this.f.act(new FraccionMove('slap', 'lv_slap', 0.18, 10, 4));
  }
  heavy(): void {
    if (!this.f.busy && this.cd <= 0) {
      this.cd = 2.5;
      this.f.act(new FraccionMove('bump', 'lv_bump', 0.24, 16, 10));
    }
  }
  skill1(): void {
    if (!this.f.busy) this.f.anim.play('lv_cheer');
  }
  release(): void {}
  toggleFlare(): void {}
  abilities(): AbilityInfo[] {
    return [];
  }
  formName(): string {
    return 'Fracción';
  }
  ai(): KitAI {
    return { reach: 1.3, chain: 2, moves: [{ name: 'bump', use: () => this.heavy(), min: 0, max: 1.8, weight: 1, cd: 3 }] };
  }
}

// ------------------------------------------------------------------ helpers

function lungeTo(f: Fighter, stop: number, at: number, max = 24): number {
  const tgt = f.faceTarget;
  if (!tgt) return 0;
  const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
  if (d <= stop + 0.25 || d > 7) return 0;
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

const spec = (damage: number, knock: number, cut: number, extra: Partial<BladeSpec> = {}): BladeSpec => ({ damage, knock, launch: 0, hitstop: 0.05, shake: 0.12, cut, ...extra });

/** blade windows of each sealed move (clip time) */
const MOVES: Record<string, { at: [number, number]; spec: BladeSpec }> = {
  sz_s1: { at: [0.1, 0.2], spec: spec(14, 6, 300, { reach: 0.16 }) },
  sz_s2: { at: [0.09, 0.2], spec: spec(14, 7, 320, { reach: 0.1 }) },
  sz_s3: { at: [0.09, 0.21], spec: spec(15, 3, 320, { launch: 9, reach: 0.1 }) },
  sz_s4: { at: [0.14, 0.29], spec: spec(20, 10, 380, { heavy: true, hitstop: 0.08, shake: 0.22, reach: 0.12 }) },
  sz_needle: { at: [0.08, 0.17], spec: spec(8, 2, 200, { reach: 0.2 }) },
};

/** Marker for the skills a string can cancel into. */
abstract class SkillAction extends FighterAction {}

/** One cut of the sealed string (or the needle): its blade window, the step in. */
class MoveAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private stopAt = 0;
  private opened = false;
  queued = false;
  constructor(readonly kit: SzayelKit, readonly clip: string, readonly index: number, private onHit?: (o: Fighter) => void) {
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
    this.stopAt = lungeTo(f, 1.3, MOVES[this.clip].at[0]);
    f.anim.play(this.clip, { onEvent: (n) => n === 'step' && g.sfx.play('step', f.pos, 0.4) });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    this.stopAt = lungeStop(f, this.stopAt);
    const [a, b] = MOVES[this.clip].at;
    if (!this.opened && t >= a - 0.03) {
      this.opened = true;
      f.bladeHits.clear();
      f.bladeSpec = this.onHit ? { ...MOVES[this.clip].spec, onHit: this.onHit } : MOVES[this.clip].spec;
      g.sfx.play(this.index === 3 ? 'swingHeavy' : 'swing', f.center(), 0.8);
    }
    f.bladeActive = t >= a && t <= b;
    if (f.trail) f.trail.emitting = t >= a - 0.03 && t <= b + 0.02;
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
    return next instanceof SkillAction && this.t >= w + 0.03;
  }
}

/** LMB (Fornicarás): the branches lash out after the hand, the reach growing along the string. */
class LashAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private lashed = false;
  queued = false;
  constructor(readonly kit: SzayelKit, readonly clip: string, readonly index: number) {
    super();
    this.name = clip;
    this.mobility = 0.3;
  }
  override start(f: Fighter): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    f.anim.play(this.clip);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.lashed && this.t >= 0.12) {
      this.lashed = true;
      const reach = [3.5, 5, 6.5, 8][this.index];
      this.kit.lash(reach, [18, 18, 20, 26][this.index], this.index === 3, this.index === 2 ? 2 : this.index === 3 ? 3 : 1);
    }
    if (this.queued && this.t >= this.comboAt) {
      this.done = true;
      this.kit.chain(this.index + 1);
      return;
    }
    if (this.t >= this.dur) this.done = true;
  }
  override canCancel(next: FighterAction): boolean {
    if (next.name === 'dash') return this.t >= 0.2;
    return next instanceof SkillAction && this.t >= 0.16;
  }
}

/** A skill: plays its clip, runs its events, ends with the clip (or at `endAt`). */
class Skill extends SkillAction {
  private fired = new Set<string>();
  private cancelAt: number;
  private hold: boolean;
  constructor(readonly kit: SzayelKit, readonly name: string, readonly clip: string, readonly endAt: number, readonly events: Record<string, [number, () => void]>, opts: { armor?: number; mobility?: number; cancelAt?: number; hold?: boolean } = {}) {
    super();
    this.mobility = opts.mobility ?? 0.2;
    this.armor = opts.armor ?? 0;
    this.cancelAt = opts.cancelAt ?? endAt * 0.8;
    this.hold = !!opts.hold;
  }
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

/**
 * G: a Fracción eaten — it hurries over when he calls (its own legs, its own mind set aside), is hauled up to his hand
 * kicking, and swallowed whole. A heavy blow to him lets it drop.
 */
class EatAction extends SkillAction {
  readonly name = 'eat';
  private eaten = false;
  private grabbed = -1;
  private ctl: Controller | null = null;
  constructor(readonly kit: SzayelKit, readonly meal: Fighter) {
    super();
    this.mobility = 0;
  }
  override start(f: Fighter, g: Game): void {
    const i = g.controllers.findIndex((c) => c.f === this.meal);
    if (i >= 0) this.ctl = g.controllers.splice(i, 1)[0];
    this.meal.stopAction();
    this.meal.faceTarget = null;
    void f;
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const m = this.meal;
    if (m.dead) {
      this.done = true;
      return;
    }
    if (this.grabbed < 0) {
      // it runs to him (two seconds at most)
      const d = _v.subVectors(f.pos, m.pos).setY(0);
      if (d.length() < 2.2) {
        this.grabbed = this.t;
        m.wish.set(0, 0, 0);
        f.anim.play(this.kit.form === 'sealed' ? 'sz_eat' : 'sf_eat');
        m.anim.play('lv_struggle', { hold: true });
      } else {
        m.wish.copy(d.normalize());
        m.wishSprint = true;
        if (this.t > 2) this.done = true;
      }
      return;
    }
    const lt = this.t - this.grabbed;
    if (!this.eaten) {
      // hauled up to his hand, over his mouth
      const hand = this.kit.palmPoint(_v);
      const k = Math.min(1, lt / 0.4);
      const goal = _w.copy(hand).setY(hand.y - m.def.height * 0.5);
      m.body.pos.lerp(goal, k);
      m.body.vel.set(0, 0, 0);
      m.hitstun = Math.max(m.hitstun, 0.3);
      m.hovering = true;
      m.visual.object.scale.setScalar(lt > 0.42 ? Math.max(0.05, 1 - (lt - 0.42) / 0.1) : 1);
      if (lt >= 0.5) {
        this.eaten = true;
        this.kit.swallow(m);
      }
    }
    if (lt >= 0.95) this.done = true;
  }
  override end(_f: Fighter, g: Game): void {
    const m = this.meal;
    if (this.eaten || m.dead) return;
    // let go: it gets its own mind back
    m.visual.object.scale.setScalar(1);
    m.hovering = false;
    m.wish.set(0, 0, 0);
    m.wishSprint = false;
    m.anim.stopAll(0.2);
    if (this.ctl && !g.controllers.includes(this.ctl)) g.controllers.push(this.ctl);
  }
}

/** R (Fornicarás): Telon Balon — the wings closed into a ball round him, floating; R again (or 4 s) opens it. */
class BalonAction extends SkillAction {
  readonly name = 'balon';
  constructor(readonly kit: SzayelKit) {
    super();
    this.mobility = 0.15;
    this.airGravity = 0;
    this.armor = 0.88;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('sf_balon', { hold: true });
    this.kit.showBalon(true);
    g.callout('球体幕', 'TELON BALON', '#C9A6E3');
    g.sfx.play('crumble', f.center(), 0.6);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    f.knockTaken = 0;
    // it floats: a slow rise up to a couple of metres
    f.body.vel.y = f.body.airTime < 1.6 ? 1.2 : 0;
    f.hovering = true;
    if (this.t >= 4) this.done = true;
  }
  override end(f: Fighter): void {
    this.kit.showBalon(false);
    f.knockTaken = 1;
    f.hovering = false;
    f.anim.stopAll(0.25);
  }
  override canCancel(next: FighterAction): boolean {
    return this.t > 0.3 && (next.name === 'dash' || next instanceof SkillAction);
  }
}

// ------------------------------------------------------------------ the kit

interface Data {
  o: Fighter;
  bug: BugTag;
  /** sightings per technique (an action started for ≥ 6 reiatsu) */
  techs: Map<string, number>;
  last: { name: string; at: number } | null;
  prevAction: FighterAction | null;
  prevRei: number;
}

interface Copy {
  f: Fighter;
  gen: number;
}

interface Doll {
  o: Fighter;
  v: CharacterVisual;
  t: number;
  used: Set<string>;
}

export class SzayelKit implements Kit {
  form: Form = 'sealed';
  comboIndex = 0;
  private lastSwingEnd = 0;
  flare = false;
  readonly data = new Map<number, Data>();
  dome: LabDome | null = null;
  readonly fraccion: Fighter[] = [];
  readonly clones: Copy[] = [];
  doll: Doll | null = null;
  egg: { host: Fighter; t: number } | null = null;
  reborn = false;
  private rebirth: { host: Fighter; t: number } | null = null;
  /** vanity: furious after a heavy blow (s left) */
  vanityT = 0;
  private branches: PeacockVines | null = null;
  private balon: PropMesh | null = null;
  private holoT = 0;
  private dashing = false;
  private timers: { t: number; fn: () => void }[] = [];
  private hudT = 0;
  private noteT = 0;
  readonly cd = { needle: 0, fraccion: 0, trap: 0, device: 0, eat: 0, burrow: 0, copy: 0, teatro: 0, balon: 0, gabriel: 0, flick: 0, doll: 0 };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.parry = (amount, from, o) => this.immunize(amount, from, o);
    f.onHurt = (_dmg, heavy) => {
      if (heavy) {
        // his hair, his clothes: he takes it badly — and lets go of whatever he was holding
        this.vanityT = 8;
        this.applyStats();
        if (this.doll) this.dropDoll();
        if (f.action instanceof EatAction) f.stopAction();
      }
    };
    f.onLethal = () => this.gabrielSaves();
    // Hierro
    f.toughness = 12;
    this.applyStats();
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    for (let i = this.timers.length - 1; i >= 0; i--) {
      const tm = this.timers[i];
      tm.t -= dt;
      if (tm.t > 0) continue;
      this.timers.splice(i, 1);
      tm.fn();
    }
    if (this.vanityT > 0 && (this.vanityT -= dt) <= 0) this.applyStats();
    this.watchData();
    if (this.dome?.done) this.dome = null;
    this.deviceField();
    this.hologram(dt);
    // his Fracción and his copies
    for (let i = this.fraccion.length - 1; i >= 0; i--) if (this.fraccion[i].dead || !g.fighters.includes(this.fraccion[i])) this.fraccion.splice(i, 1);
    this.tendCopies();
    if (this.doll) {
      this.doll.t -= dt;
      if (this.doll.t <= 0 || this.doll.o.dead || this.form !== 'fornicaras') this.dropDoll();
    }
    if (this.egg) {
      this.egg.t += dt;
      if (this.egg.host.dead) this.egg = null;
      else eggPulse(g, this.egg.host, this.egg.t);
    }
    this.updateRebirth(dt);
    if (f.dead) this.cleanup();
    this.hudT -= dt;
    if (this.hudT <= 0 && g.hud && f === g.player) {
      this.hudT = 0.25;
      g.hud.form = this.formName();
    }
  }

  private after(s: number, fn: () => void): void {
    this.timers.push({ t: s, fn });
  }

  // ---------------------------------------------------------------- inputs

  attack(): void {
    const f = this.f;
    if (this.doll) return this.dollOp('flick');
    const cur = f.action;
    if (cur instanceof MoveAction || cur instanceof LashAction) {
      if (cur.index >= 0) cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastSwingEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const list = this.form === 'sealed' ? SZAYEL_CHAIN : FORNICARAS_CHAIN;
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    this.lastSwingEnd = this.g.time + 0.8;
    this.f.act(this.form === 'sealed' ? new MoveAction(this, list[idx], idx) : new LashAction(this, list[idx], idx), true);
  }

  /** RMB: Rokureichū / the burrowing branch / (doll) the stomach */
  heavy(): void {
    if (this.doll) return this.dollOp('stomach');
    if (this.form === 'sealed') {
      this.special(new MoveAction(this, 'sz_needle', -1, (o) => this.tag(o)), 8, 'needle', 2.5);
      return;
    }
    this.special(new Skill(this, 'burrow', 'sf_burrow', 0.7, { dive: [0.2, () => this.burrow()] }, { mobility: 0.15 }), 16, 'burrow', 4);
  }

  /** Q: the Fracción / Carbon-Copy, or the snap / (doll) the Achilles tendon */
  skill1(): void {
    if (this.doll) return this.dollOp('achilles');
    if (this.form === 'sealed') {
      this.special(new Skill(this, 'fraccion', 'sz_snap', 0.56, { snap: [0.22, () => this.callFraccion()] }), 10, 'fraccion', 18);
      return;
    }
    if (this.clones.length) {
      this.special(new Skill(this, 'snap', 'sf_snap', 0.5, { snap: [0.2, () => this.snapCopies()] }), 0, 'doll', 0.5);
      return;
    }
    this.special(new Skill(this, 'copy', 'sf_copy', 1.1, { fountain: [0.35, () => this.carbonCopy()] }, { mobility: 0.05, armor: 0.4 }), 40, 'copy', 25);
  }

  /** E: the trap panel / Teatro de Titere, or (doll) the Gran Final */
  skill2(): void {
    if (this.doll) return this.dollOp('final');
    if (this.form === 'sealed') {
      this.special(new Skill(this, 'trap', 'sz_remote', 0.6, { press: [0.24, () => this.trap()] }), 14, 'trap', 8);
      return;
    }
    this.special(new Skill(this, 'teatro', 'sf_teatro', 1.3, { engulf: [0.16, () => this.engulf()], spit: [0.7, () => this.spit()], doll: [1.0, () => this.makeDoll()] }, { mobility: 0.05, armor: 0.3 }), 24, 'teatro', 10);
  }

  /** R: the power-control device / Telon Balon (again: open it), or (doll) the arm tendon */
  skill3(): void {
    if (this.doll) return this.dollOp('arm');
    if (this.form === 'sealed') {
      this.special(new Skill(this, 'device', 'sz_remote', 0.6, { press: [0.24, () => this.device()] }), 24, 'device', 22);
      return;
    }
    if (this.f.action instanceof BalonAction) {
      this.f.stopAction();
      return;
    }
    this.special(new BalonAction(this), 12, 'balon', 10);
  }

  /** F: "Susure, Fornicarás" / Gabriel */
  release(): void {
    const { f, g } = this;
    if (f.busy || f.sealT > 0) return;
    if (this.form === 'sealed') {
      if (!f.spendRei(30)) return this.noRei();
      f.act(new Skill(this, 'release', 'sz_release', 1.45, {
        name: [0.2, () => g.callout('啜れ「邪淫妃」', 'SUSURE, FORNICARÁS', '#FF79B8')],
        swallow: [0.7, () => this.swallowSword()],
        swell: [0.9, () => this.swell()],
        form: [1.3, () => this.toFornicaras()],
      }, { armor: 0.6, mobility: 0 }), true);
      return;
    }
    if (this.egg || this.reborn) {
      if (f === g.player) g.hud?.showBanner(this.reborn ? 'Gabriel is spent' : 'An egg is already laid', 1);
      return;
    }
    this.special(new Skill(this, 'gabriel', 'sf_gabriel', 0.7, { pierce: [0.22, () => this.gabriel()] }), 20, 'gabriel', 4);
  }

  /** G: eat a Fracción (with a doll in hand: let the doll go) */
  toggle(): void {
    const { f, g } = this;
    if (this.doll) {
      this.dropDoll();
      return;
    }
    if (this.cd.eat > 0 || f.busy) return;
    let meal: Fighter | null = null, bd = 30;
    for (const fr of this.fraccion) {
      const d = fr.pos.distanceTo(f.pos);
      if (!fr.dead && d < bd) {
        bd = d;
        meal = fr;
      }
    }
    if (!meal) {
      if (f === g.player) g.hud?.showBanner('No Fracción to eat', 1);
      return;
    }
    this.cd.eat = 16;
    f.act(new EatAction(this, meal), true);
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

  private noRei(): void {
    if (this.f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
  }

  target(range: number): Fighter | null {
    return this.g.nearestEnemy(this.f, range, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, range);
  }

  private special(a: FighterAction, cost: number, cdKey: keyof typeof this.cd, cd: number): boolean {
    const f = this.f;
    if (this.cd[cdKey] > 0 || f.dead || this.rebirth) return false;
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

  private applyStats(): void {
    const f = this.f;
    const form = this.form === 'sealed' ? 1 : 1.5;
    f.power = form * (this.flare ? 1.25 : 1) * (this.vanityT > 0 ? 1.2 : 1);
    f.damageTaken = this.vanityT > 0 ? 1.1 : 1;
    f.aura.target = this.flare ? 1 : this.vanityT > 0 ? 0.5 : this.form === 'fornicaras' ? 0.25 : 0.08;
  }

  formName(): string {
    const extra: string[] = [];
    if (this.doll) extra.push(`doll of ${this.doll.o.name}`);
    if (this.clones.length) extra.push(`${this.clones.length} cop${this.clones.length > 1 ? 'ies' : 'y'}`);
    if (this.egg) extra.push('egg laid');
    if (this.dome) extra.push('device on');
    const complete = [...this.data.values()].reduce((n, d) => n + [...d.techs.values()].filter((c) => c >= 3).length, 0);
    if (complete) extra.push(`${complete} analysed`);
    return (this.form === 'sealed' ? 'Fornicarás (sealed)' : 'Fornicarás') + (extra.length ? ' · ' + extra.join(' · ') : '');
  }

  /** the sword lowered into his mouth: gone */
  private swallowSword(): void {
    const { f, g } = this;
    f.visual.detach('sword');
    g.sfx.play('crumble', f.center(), 0.5);
    const m = f.visual.rig.sockets.get('mouth');
    if (m) {
      m.getWorldPosition(_v);
      for (let i = 0; i < 12; i++) g.engine.glow.spawn({ x: _v.x, y: _v.y, z: _v.z, vx: (Math.random() - 0.5) * 2, vy: Math.random() * 2, vz: (Math.random() - 0.5) * 2, size: 0.12, sizeEnd: 0.3, life: 0.5, r: 2, g: 0.9, b: 1.4, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
    }
  }

  /** the body swells like a balloon, fluid and a fine mist bursting out of it */
  private swell(): void {
    const { f, g } = this;
    for (let i = 1; i <= 8; i++) this.after(i * 0.05, () => f.visual.object.scale.setScalar(1 + i * 0.05));
    const c = f.center();
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2, e = Math.random() * 2 - 0.5;
      g.engine.dust.spawn({ x: c.x, y: c.y, z: c.z, vx: Math.cos(a) * 4, vy: e * 3, vz: Math.sin(a) * 4, size: 0.4, sizeEnd: 1.6, life: 1.4, r: 0.97, g: 0.89, b: 0.93, alpha: 0.6, alphaEnd: 0, tex: TEX_PUFF, drag: 1.6 });
    }
    g.sfx.play('bankai', c, 0.7);
  }

  private toFornicaras(): void {
    const { f, g } = this;
    if (this.form === 'fornicaras') return;
    this.form = 'fornicaras';
    f.visual.object.scale.setScalar(1);
    f.def = { ...f.def, stance: FORNICARAS_STANCE, speed: { ...SPEED_R } };
    f.setForm({ asset: szayelAsset('fornicaras'), props: [] }, AURA);
    // the release heals him
    f.hp = f.maxHp;
    f.aura.flare(2, 0.8);
    this.branches = new PeacockVines(g, f, (out) => this.wingRoot(out), BRANCH_LOOK, 0.03);
    g.addProjectile(this.branches);
    // the mist clears off the anemone of tentacles
    const c = f.center();
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.dust.spawn({ x: c.x, y: f.pos.y + 0.3, z: c.z, vx: Math.cos(a) * 5, vy: 0.5 + Math.random(), vz: Math.sin(a) * 5, size: 0.5, sizeEnd: 2, life: 1.6, r: 0.97, g: 0.89, b: 0.93, alpha: 0.55, alphaEnd: 0, tex: TEX_PUFF, drag: 1.4 });
    }
    this.applyStats();
  }

  /** where the branches leave his back */
  wingRoot(out: THREE.Vector3): THREE.Vector3 {
    const s = this.f.visual.rig.sockets.get('back');
    if (!s) return this.f.center(out);
    s.updateWorldMatrix(true, false);
    return s.getWorldPosition(out);
  }

  palmPoint(out: THREE.Vector3): THREE.Vector3 {
    const s = this.f.visual.rig.sockets.get('palm.L');
    if (!s) return this.f.center(out).addScaledVector(this.f.forward(_w), 0.4);
    s.updateWorldMatrix(true, false);
    return s.getWorldPosition(out);
  }

  // ---------------------------------------------------------------- the lab: data

  /** Rokureichū: the bug planted on whoever the needle touched */
  private tag(o: Fighter): void {
    const { g } = this;
    if (o.dead || this.data.has(o.id) || o === this.f) return;
    const bug = new BugTag(g, o);
    g.addProjectile(bug);
    this.data.set(o.id, { o, bug, techs: new Map(), last: null, prevAction: o.action, prevRei: o.rei });
    g.callout('録霊蟲', 'ROKUREICHŪ', '#FF79B8');
    g.hud?.floatText(o.center().setY(o.pos.y + o.def.height + 0.3), 'RECORDING', '#FF8CC6', 16);
  }

  /** every technique a bugged enemy starts is one more sighting; three and it is analysed */
  private watchData(): void {
    const { g } = this;
    for (const [id, d] of this.data) {
      const o = d.o;
      if (o.dead || !g.fighters.includes(o)) {
        d.bug.done = true;
        this.data.delete(id);
        continue;
      }
      const a = o.action;
      if (a && a !== d.prevAction && d.prevRei - o.rei >= 6) {
        const n = (d.techs.get(a.name) ?? 0) + 1;
        d.techs.set(a.name, n);
        d.last = { name: a.name, at: g.time };
        if (n === 3) g.hud?.floatText(o.center().setY(o.pos.y + o.def.height + 0.4), 'DATA COMPLETE', '#FF8CC6', 18);
        // inside his field, what he has analysed fizzles as it starts
        if (n > 3 && this.dome?.inside(o.pos)) {
          o.stopAction();
          o.hitstun = Math.max(o.hitstun, 0.25);
          analysedFlash(g, o.center());
          g.hud?.floatText(o.center().setY(o.pos.y + o.def.height + 0.3), 'FIZZLED', '#FF8CC6', 16);
        }
      } else if (a && a !== d.prevAction && (d.techs.get(a.name) ?? 0) >= 3) d.last = { name: a.name, at: g.time };
      d.prevAction = a;
      d.prevRei = o.rei;
    }
  }

  /** passive: a blow from a technique he has analysed does nothing to him */
  private immunize(_amount: number, from: Fighter | null, o: DamageOpts): boolean {
    const { f, g } = this;
    if (!from || this.rebirth) return false;
    const d = this.data.get(from.id);
    if (!d) return false;
    const act = from.action?.name ?? '';
    const done = (n: string) => (d.techs.get(n) ?? 0) >= 3;
    const hit = (act && done(act)) || (o.energy && d.last && g.time - d.last.at < 3 && done(d.last.name));
    if (!hit) return false;
    analysedFlash(g, f.center());
    if (g.time > this.noteT) {
      this.noteT = g.time + 0.8;
      g.hud?.floatText(f.center().setY(f.pos.y + f.def.height + 0.3), 'ANALYSED', '#FF8CC6', 16);
    }
    return true;
  }

  anyComplete(): boolean {
    for (const d of this.data.values()) for (const n of d.techs.values()) if (n >= 3) return true;
    return false;
  }

  tagged(o: Fighter | null): boolean {
    return !!o && this.data.has(o.id);
  }

  // ---------------------------------------------------------------- the lab: device, trap, hologram

  /** R (sealed): the power-control device */
  private device(): void {
    const { f, g } = this;
    this.dome?.update(99);
    this.dome = new LabDome(g, f.pos.clone(), 12, 14);
    g.addProjectile(this.dome);
    g.callout('', 'POWER-CONTROL DEVICE', '#FF8CC6');
    g.sfx.play('ting', f.center(), 0.8);
  }

  /** inside the field, those he has bugged cannot release and hit weaker */
  private deviceField(): void {
    if (!this.dome) return;
    for (const d of this.data.values()) {
      const o = d.o;
      if (o.dead || !this.dome.inside(o.pos)) continue;
      o.sealT = Math.max(o.sealT, 0.25);
      o.sealK = Math.max(o.sealK, 0.25);
    }
  }

  /** inside his field his Sonído leaves a hologram where he was; the enemy keeps fighting it */
  private hologram(dt: number): void {
    const f = this.f;
    if (this.holoT > 0 && (this.holoT -= dt) <= 0) f.lure = null;
    if (f.dashT > 0 && !this.dashing && this.dome?.inside(f.pos)) {
      f.lure = f.pos.clone();
      this.holoT = 2.2;
      f.ghosts.spawn(2.2, 0.55);
    }
    this.dashing = f.dashT > 0;
  }

  /** E (sealed): the trap panel — a ring glows round the target's feet, then the floor drops away */
  private trap(): void {
    const { f, g } = this;
    const t = this.target(20);
    g.callout('', 'TRAP PANEL', '#FF8CC6');
    if (!t) return;
    const at = t.pos.clone();
    g.addRing(at.clone().setY(at.y + 0.05), 1.6, '#FF8CC6', 0.4);
    this.after(0.35, () => {
      const c = t.dead ? at : t.pos.clone();
      g.engine.destruction.carve(new CapsuleShape(c.clone().setY(c.y - 3.6), c.clone().setY(c.y + 0.3), 1.45), { mode: 'erase', power: 900 });
      g.sfx.play('crumble', c, 1);
      t.stopAction();
      t.hitstun = Math.max(t.hitstun, 0.4);
      const y0 = t.pos.y;
      this.after(0.6, () => {
        if (!t.dead && t.pos.y < y0 - 1.5) g.damage(t, 25, f, _v.set(0, -1, 0).clone(), { knock: 0, hitstop: 0.05 });
      });
    });
  }

  // ---------------------------------------------------------------- Fracción

  /** Q (sealed): Lumina and Verona drop out of a hatch of light beside him */
  private callFraccion(): void {
    const { f, g } = this;
    if (this.fraccion.length >= 2) {
      for (const fr of this.fraccion) fr.data.kit && (fr.data.kit as FraccionKit).skill1();
      return;
    }
    const side = _v.set(Math.cos(f.yaw), 0, -Math.sin(f.yaw));
    for (const kind of ['lumina', 'verona'] as FraccionKind[]) {
      if (this.fraccion.some((fr) => fr.def.id === `fraccion-${kind}`)) continue;
      const k = kind === 'lumina' ? 1 : -1;
      const p = f.pos.clone().addScaledVector(side, k * 1.6).addScaledVector(f.forward(_w), 0.6);
      p.y += 0.2;
      const fr = g.spawn(fraccionDef(kind), p, f.team);
      fr.yaw = f.yaw;
      const kit = new FraccionKit(fr, g);
      g.controllers.push(new DuelistAI(g, fr, kit, { aggression: 0.5, intro: 0.4 }));
      this.fraccion.push(fr);
      g.addRing(p.clone(), 1.2, '#FF8CC6', 0.35);
      g.engine.glow.spawn({ x: p.x, y: p.y + 2, z: p.z, size: 1, sizeEnd: 0.2, life: 0.4, r: 1.6, g: 1, b: 1.4, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
    }
    g.callout('', 'FRACCIÓN', '#FF8CC6');
  }

  /** swallowed whole: he heals */
  swallow(m: Fighter): void {
    const { f, g } = this;
    const heal = f.maxHp * 0.35;
    f.hp = Math.min(f.maxHp, f.hp + heal);
    m.hp = 0;
    m.dead = true;
    g.remove(m);
    const i = this.fraccion.indexOf(m);
    if (i >= 0) this.fraccion.splice(i, 1);
    g.sfx.play('crumble', f.center(), 0.5);
    g.hud?.floatText(f.center().setY(f.pos.y + f.def.height + 0.3), `+${Math.round(heal)}`, '#9FE3B0', 18);
  }

  // ---------------------------------------------------------------- Fornicarás: the branches

  /** a branch lashed out to `reach` m: whoever it passes through is struck (n: how many branches) */
  lash(reach: number, damage: number, heavy: boolean, n: number): void {
    const { f, g } = this;
    if (!this.branches) return;
    const t = this.target(reach + 1.5);
    const from = this.wingRoot(new THREE.Vector3());
    // several branches may go for it, but it is struck once
    const struck = new Set<number>();
    for (let i = 0; i < n; i++) {
      const to = t ? t.center() : from.clone().addScaledVector(f.forward(), reach);
      to.add(_v.set((Math.random() - 0.5) * 0.6 * i, (Math.random() - 0.5) * 0.4 * i, (Math.random() - 0.5) * 0.6 * i));
      if (to.distanceTo(from) > reach) to.sub(from).setLength(reach).add(from);
      this.branches.lash(to, 0.42, (tip) => this.branchHit(from, tip, damage, heavy, struck));
    }
    g.sfx.play(heavy ? 'swingHeavy' : 'swing', f.center(), 0.8);
  }

  private branchHit(a: THREE.Vector3, b: THREE.Vector3, damage: number, heavy: boolean, struck: Set<number>): void {
    const { f, g } = this;
    const ab = _v.subVectors(b, a);
    const len2 = Math.max(1e-4, ab.lengthSq());
    for (const o of g.enemiesOf(f)) {
      if (o.dead || struck.has(o.id)) continue;
      const c = o.center(_w);
      const k = Math.max(0, Math.min(1, ((c.x - a.x) * ab.x + (c.y - a.y) * ab.y + (c.z - a.z) * ab.z) / len2));
      const px = a.x + ab.x * k, py = a.y + ab.y * k, pz = a.z + ab.z * k;
      const cy = Math.max(o.pos.y, Math.min(o.pos.y + o.def.height, py));
      if (Math.hypot(o.pos.x - px, cy - py, o.pos.z - pz) > o.def.radius + 0.4) continue;
      struck.add(o.id);
      g.damage(o, damage, f, ab.clone().setY(0).normalize(), { knock: heavy ? 10 : 4, launch: heavy ? 3 : 0, heavy, hitstop: heavy ? 0.08 : 0.05 });
      g.sparks(new THREE.Vector3(px, cy, pz), ab.clone().normalize(), '#C3122F', 6);
    }
  }

  /** RMB (Fornicarás): a branch into the ground, out under the target, a grab that lifts it */
  private burrow(): void {
    const { f, g } = this;
    const t = this.target(24);
    const tp = t;
    g.addProjectile(new BurrowRidge(g, f.pos.clone().addScaledVector(f.forward(_v), 0.6), () => (tp && !tp.dead ? tp.pos : null), 30, 26, (at) => this.erupt(at)));
    g.sfx.play('crumble', f.pos, 0.8);
  }

  private erupt(at: THREE.Vector3): void {
    const { f, g } = this;
    g.engine.destruction.carve(new CapsuleShape(at.clone().setY(at.y - 0.4), at.clone().setY(at.y + 0.3), 0.9), { mode: 'smash', power: 160, impulse: 6 });
    g.sfx.play('impact', at, 0.9);
    let caught: Fighter | null = null;
    for (const o of g.enemiesOf(f)) if (!o.dead && Math.hypot(o.pos.x - at.x, o.pos.z - at.z) < 1.6 + o.def.radius && Math.abs(o.pos.y - at.y) < 2) caught = o;
    const ground = new PeacockVines(g, f, (out) => out.copy(at), BRANCH_LOOK, 0.03);
    g.addProjectile(ground);
    if (!caught) {
      ground.lash(at.clone().setY(at.y + 2.4), 0.5);
      this.after(1, () => (ground.done = true));
      return;
    }
    const o = caught;
    ground.ensnare(o);
    const hold = o.def.boss ? 0.6 : 1.2;
    g.damage(o, 30, f, _v.subVectors(o.pos, f.pos).setY(0).normalize().clone(), { knock: 0, launch: 6, heavy: true, hitstop: 0.08 });
    o.hitstun = Math.max(o.hitstun, hold);
    this.after(hold, () => {
      ground.letGo();
      this.after(1, () => (ground.done = true));
    });
  }

  // ---------------------------------------------------------------- Carbon-Copy

  /** Q (Fornicarás): the black fountain; whoever the rain wets sprouts a copy of itself, on his side */
  private carbonCopy(): void {
    const { f, g } = this;
    g.addProjectile(new CopyFountain(g, f, 12));
    g.callout('', 'CARBON-COPY', '#2C2440');
    g.sfx.play('torrent', f.center(), 0.6);
    this.after(0.9, () => {
      if (f.dead) return;
      for (const o of g.enemiesOf(f)) {
        if (o.dead || o.pos.distanceTo(f.pos) > 12.5) continue;
        for (let i = 0; i < 2 && this.clones.length < 4; i++) {
          const a = Math.random() * Math.PI * 2;
          const at = o.pos.clone().add(_v.set(Math.cos(a) * 2, 0.3, Math.sin(a) * 2));
          this.copyOf(o, at, 0.4, 1);
        }
      }
    });
  }

  private copyOf(src: Fighter, at: THREE.Vector3, hpK: number, gen: number): Fighter | null {
    const { f, g } = this;
    const entry = rosterById(src.def.id);
    if (!entry || src.def.id === 'szayel') return null;
    const def = entry.def();
    const c = g.spawn({ ...def, name: `${def.name} (copy)`, hp: Math.max(40, Math.round(src.maxHp * hpK)) }, at, f.team);
    c.yaw = Math.atan2(src.pos.x - at.x, src.pos.z - at.z);
    const kit = entry.kit(c, g);
    g.controllers.push(new DuelistAI(g, c, kit, { aggression: 0.75, intro: 0.15 }));
    // black-blooded, blank-eyed: a darker cast over the whole body
    c.visual.forEachMaterial((m) => m.userData.uniforms.uTint.value.setRGB(0.5, 0.45, 0.55));
    c.data.copyOf = src;
    this.clones.push({ f: c, gen });
    inkBurst(g, at.clone().setY(at.y + 1), 0.6);
    return c;
  }

  /** copies that fall split once into two at half their life; the second generation just bursts */
  private tendCopies(): void {
    const g = this.g;
    for (let i = this.clones.length - 1; i >= 0; i--) {
      const c = this.clones[i];
      if (!g.fighters.includes(c.f)) {
        this.clones.splice(i, 1);
        continue;
      }
      if (!c.f.dead) continue;
      this.clones.splice(i, 1);
      const at = c.f.pos.clone();
      const src = (c.f.data.copyOf as Fighter | undefined) ?? null;
      this.pop(c.f);
      if (c.gen === 1 && src && !this.f.dead)
        for (const k of [-1, 1]) this.copyOf(src, at.clone().add(_v.set(k * 1.2, 0.3, 0)), 0.2, 2);
    }
  }

  private pop(c: Fighter): void {
    const g = this.g;
    inkBurst(g, c.center());
    c.hp = 0;
    c.dead = true;
    c.stopAction();
    g.remove(c);
  }

  /** the finger snap: every copy bursts like a balloon */
  private snapCopies(): void {
    const g = this.g;
    g.sfx.play('crack', this.f.center(), 0.8);
    for (const c of [...this.clones]) this.pop(c.f);
    this.clones.length = 0;
    this.cd.copy = Math.min(this.cd.copy, 8);
  }

  // ---------------------------------------------------------------- Teatro de Titere

  private engulfed: Fighter | null = null;
  private cocoon: PropMesh | null = null;

  /** a wing reaches the nearest enemy and swallows it */
  private engulf(): void {
    const { f, g } = this;
    const t = g.nearestEnemy(f, 4.5 + 0.5);
    if (!t || t.def.boss) return;
    this.engulfed = t;
    t.stopAction();
    t.hitstun = Math.max(t.hitstun, 1.2);
    t.invuln = Math.max(t.invuln, 0.6);
    t.visual.object.visible = false;
    this.cocoon = new PropMesh(szayelProp('balon'));
    this.cocoon.scale.setScalar(0.85);
    this.cocoon.position.copy(t.pos).setY(t.pos.y + t.def.height * 0.5);
    g.engine.gr.scene.add(this.cocoon);
    g.callout('人形芝居', 'TEATRO DE TITERE', '#8E3FC0');
    g.sfx.play('crumble', t.center(), 0.8);
  }

  /** ... and spits it back out ("thanks for the meal") */
  private spit(): void {
    const { f, g } = this;
    this.cocoon?.removeFromParent();
    this.cocoon = null;
    const t = this.engulfed;
    if (!t) return;
    t.visual.object.visible = true;
    if (!t.dead) g.damage(t, 20, f, _v.subVectors(t.pos, f.pos).setY(0).normalize().clone(), { knock: 9, launch: 3, heavy: true, unblockable: true, hitstop: 0.06 });
  }

  /** a strand swells purple at his palm and bursts: the doll */
  private makeDoll(): void {
    const { f, g } = this;
    const t = this.engulfed;
    this.engulfed = null;
    if (!t || t.dead) return;
    const v = new CharacterVisual(t.visual.model);
    v.object.scale.setScalar(0.14);
    const s = f.visual.rig.sockets.get('palm.L');
    if (!s) return;
    s.add(v.object);
    v.object.position.set(0, 0.03, 0.06);
    this.doll = { o: t, v, t: 25, used: new Set() };
    strandBurst(g, this.palmPoint(new THREE.Vector3()));
    g.hud?.floatText(f.center().setY(f.pos.y + f.def.height + 0.3), `A DOLL OF ${t.name.toUpperCase()}`, '#C9A6E3', 16);
  }

  dropDoll(): void {
    const d = this.doll;
    if (!d) return;
    this.doll = null;
    d.v.object.removeFromParent();
    d.v.material.dispose();
    this.cd.teatro = Math.max(this.cd.teatro, 6);
  }

  /** the doll worked: what is done to it is done to them */
  private dollOp(op: 'flick' | 'stomach' | 'achilles' | 'arm' | 'final'): void {
    const { f, g } = this;
    const d = this.doll;
    if (!d || f.busy || this.cd.doll > 0) return;
    if (op !== 'flick' && op !== 'final' && d.used.has(op)) {
      if (f === g.player) g.hud?.showBanner('That piece is gone', 0.8);
      return;
    }
    const clip = op === 'flick' ? 'sf_flick' : op === 'stomach' ? 'sf_press' : op === 'final' ? 'sf_crush' : 'sf_pinch';
    this.cd.doll = op === 'flick' ? 0.35 : 0.6;
    f.act(new Skill(this, `doll-${op}`, clip, op === 'final' ? 1.0 : 0.6, { act: [op === 'final' ? 0.5 : op === 'flick' ? 0.2 : 0.28, () => this.workDoll(op)] }, { mobility: 0.3 }), true);
  }

  private workDoll(op: 'flick' | 'stomach' | 'achilles' | 'arm' | 'final'): void {
    const { f, g } = this;
    const d = this.doll;
    if (!d || d.o.dead) return;
    const o = d.o;
    const dir = _v.subVectors(o.pos, f.pos).setY(0).normalize().clone();
    const head = o.center().setY(o.pos.y + o.def.height * 0.9);
    // Mayuri swapped his organs for dummies
    const dummy = o.def.id === 'mayuri' && op !== 'flick';
    if (op !== 'flick') d.used.add(op);
    if (dummy) {
      g.hud?.floatText(head.setY(head.y + 0.3), 'DUMMY ORGANS', '#C9A6E3', 18);
      if (op === 'final') this.dropDoll();
      return;
    }
    if (op === 'flick') {
      g.damage(o, 18, f, dir, { knock: 2, unblockable: true, hitstop: 0.04 });
      g.sparks(head, dir, '#C3122F', 8);
    } else if (op === 'stomach') {
      g.damage(o, 90, f, dir, { knock: 3, heavy: true, unblockable: true, hitstop: 0.1, shake: 0.35 });
      o.hitstun = Math.max(o.hitstun, o.def.boss ? 0.3 : 0.8);
      this.bloodCough(o);
      g.hud?.floatText(head.setY(head.y + 0.3), 'ESTÓMAGO', '#C3122F', 18);
    } else if (op === 'achilles') {
      g.damage(o, 30, f, dir, { knock: 0, unblockable: true, hitstop: 0.06 });
      o.stopAction();
      o.hitstun = Math.max(o.hitstun, o.def.boss ? 0.5 : 1.4);
      o.slow(0.5, 6);
      if (!o.def.stance.quad) {
        registerReactions(o.anim);
        o.anim.play('weighed_kneel', { hold: true });
        this.after(o.def.boss ? 0.5 : 1.4, () => {
          if (!o.dead && o.anim.isPlaying('weighed_kneel')) o.anim.stopAll(0.3);
        });
      }
      g.hud?.floatText(head.setY(head.y + 0.3), 'TENDÓN DE AQUILES', '#C3122F', 16);
    } else if (op === 'arm') {
      g.damage(o, 25, f, dir, { knock: 0, unblockable: true, hitstop: 0.05 });
      o.disarmT = Math.max(o.disarmT, o.def.boss ? 1.5 : 5);
      g.hud?.floatText(head.setY(head.y + 0.3), 'TENDÓN DEL BRAZO', '#C3122F', 16);
    } else {
      g.damage(o, 200, f, dir, { knock: 8, heavy: true, unblockable: true, hitstop: 0.16, shake: 0.6 });
      this.bloodCough(o);
      g.callout('', 'GRAN FINAL', '#C3122F');
      strandBurst(g, this.palmPoint(new THREE.Vector3()));
      this.dropDoll();
    }
  }

  private bloodCough(o: Fighter): void {
    const p = o.center().setY(o.pos.y + o.def.height * 0.82).addScaledVector(o.forward(), o.def.radius);
    for (let i = 0; i < 14; i++)
      this.g.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, vx: o.forward().x * 2 + (Math.random() - 0.5) * 2, vy: Math.random() * 1.5, vz: o.forward().z * 2 + (Math.random() - 0.5) * 2, size: 0.08, sizeEnd: 0.05, life: 0.6, r: 0.55, g: 0.04, b: 0.08, alpha: 1, alphaEnd: 0, tex: TEX_PUFF, gravity: -9 });
  }

  // ---------------------------------------------------------------- Telon Balon

  showBalon(on: boolean): void {
    const f = this.f;
    if (on && !this.balon) {
      this.balon = new PropMesh(szayelProp('balon'));
      this.balon.position.set(0, f.def.height * 0.48, 0);
      this.balon.scale.setScalar(1 / f.visual.object.scale.x);
      f.visual.object.add(this.balon);
      void BALON_R;
    } else if (!on && this.balon) {
      this.balon.removeFromParent();
      this.balon = null;
    }
  }

  // ---------------------------------------------------------------- Gabriel

  /** F (Fornicarás): a branch to the target's navel lays the egg */
  private gabriel(): void {
    const { f, g } = this;
    const t = this.target(6.5);
    if (!t || !this.branches) return;
    const navel = t.center().setY(t.pos.y + t.def.height * 0.48);
    this.branches.lash(navel, 0.36, () => {
      if (t.dead || t.pos.distanceTo(f.pos) > 8) return;
      this.egg = { host: t, t: 0 };
      g.damage(t, 12, f, _v.subVectors(t.pos, f.pos).setY(0).normalize().clone(), { knock: 1, unblockable: true, hitstop: 0.05 });
      g.callout('受胎告知', 'GABRIEL', '#8E3FC0');
      g.hud?.floatText(t.center().setY(t.pos.y + t.def.height + 0.3), 'AN EGG', '#C9A6E3', 16);
    });
  }

  /** a killing blow with the egg laid: he is not dead, he is waiting in the host */
  private gabrielSaves(): boolean {
    const { f, g } = this;
    if (!this.egg || this.reborn || this.egg.host.dead || this.rebirth) return false;
    this.rebirth = { host: this.egg.host, t: 0 };
    this.egg = null;
    this.reborn = true;
    f.hp = 1;
    f.stopAction();
    f.invuln = 3;
    f.hitstun = 2.4;
    f.visual.object.visible = false;
    f.aura.group.visible = false;
    if (this.doll) this.dropDoll();
    inkBurst(g, f.center(), 0.6);
    return true;
  }

  private updateRebirth(dt: number): void {
    const { f, g } = this;
    const r = this.rebirth;
    if (!r) return;
    r.t += dt;
    f.invuln = Math.max(f.invuln, 0.2);
    f.hitstun = Math.max(f.hitstun, 0.1);
    const host = r.host;
    if (!host.dead) eggPulse(g, host, r.t * 3);
    if (r.t < 2) return;
    this.rebirth = null;
    // out of the host's mouth: it is drained and doubled over; he stands beside it
    const at = host.dead ? f.pos.clone() : host.pos.clone().addScaledVector(host.forward(), 1.3);
    f.body.pos.copy(at);
    f.body.prev.copy(at);
    f.visual.object.visible = true;
    f.aura.group.visible = true;
    f.hp = f.maxHp * 0.5;
    f.invuln = 0.6;
    f.hitstun = 0;
    if (!host.dead) {
      g.drain(host, host.maxHp * 0.35, f);
      host.stopAction();
      host.hitstun = Math.max(host.hitstun, 1.5);
      strandBurst(g, host.center());
      // what the host carried comes with him: Mayuri's Superhuman Drug
      if (host.def.id === 'mayuri') {
        f.dilate(0.85, 8);
        g.hud?.floatText(f.center().setY(f.pos.y + f.def.height + 0.3), 'SUPERHUMAN DRUG', '#5ED16A', 18);
      }
    }
    g.callout('受胎告知', 'GABRIEL', '#8E3FC0');
    g.sfx.play('bankai', f.center(), 0.6);
  }

  // ---------------------------------------------------------------- death

  private cleanup(): void {
    if (this.rebirth) return;
    for (const c of [...this.clones]) this.pop(c.f);
    this.clones.length = 0;
    for (const fr of this.fraccion) {
      fr.hp = 0;
      fr.dead = true;
      this.g.remove(fr);
    }
    this.fraccion.length = 0;
    this.dropDoll();
    for (const d of this.data.values()) d.bug.done = true;
    this.data.clear();
    this.showBalon(false);
  }

  // ---------------------------------------------------------------- AI & HUD

  ai(): KitAI {
    const { f, g } = this;
    const sealed = () => this.form === 'sealed', released = () => this.form === 'fornicaras';
    const tgt = () => g.nearestEnemy(f, 40);
    const rushed = () => {
      const t = g.nearestEnemy(f, 6);
      return !!t && t.pos.distanceTo(f.pos) < 3.4 && t.action !== null && t.action.name !== 'dash';
    };
    const doll = () => !!this.doll;
    const used = (k: string) => !!this.doll && this.doll.used.has(k);
    return {
      reach: 2.2,
      chain: 4,
      releaseAt: [0.55],
      // he keeps his distance — unless he has someone's body in his hand
      ranged: () => !this.doll,
      opener: () => this.skill1(),
      moves: [
        { name: 'tag', use: () => this.heavy(), min: 0, max: 2.6, weight: 2.2, cd: 4, when: () => sealed() && !this.tagged(tgt()) },
        { name: 'fraccion', use: () => this.skill1(), min: 0, max: 40, weight: 1, cd: 18, when: () => sealed() && this.fraccion.length === 0 },
        { name: 'trap', use: () => this.skill2(), min: 3, max: 20, weight: 1.2, cd: 8, when: sealed },
        { name: 'device', use: () => this.skill3(), min: 0, max: 12, weight: 1.6, cd: 20, when: () => sealed() && !this.dome && this.anyComplete() },
        { name: 'eat', use: () => this.toggle(), min: 3, max: 40, weight: 4, cd: 10, when: () => f.hp < f.maxHp * 0.45 && this.fraccion.length > 0 && !doll() },
        { name: 'copy', use: () => this.skill1(), min: 0, max: 12, weight: 2.5, cd: 25, when: () => released() && !doll() && this.clones.length === 0 },
        { name: 'burrow', use: () => this.heavy(), min: 3.5, max: 22, weight: 1.4, cd: 4, when: () => released() && !doll() },
        { name: 'teatro', use: () => this.skill2(), min: 0, max: 4.4, weight: 3, cd: 8, when: () => released() && !doll() },
        { name: 'balon', use: () => this.skill3(), min: 0, max: 6, weight: 1.2, cd: 10, when: () => released() && !doll() && (rushed() || f.hp < f.maxHp * 0.3) },
        { name: 'gabriel', use: () => this.release(), min: 0, max: 6, weight: 3, cd: 6, when: () => released() && !doll() && !this.egg && !this.reborn },
        // a doll in hand: he plays with it, then the Gran Final
        { name: 'flick', use: () => this.attack(), min: 0, max: 80, weight: 1.5, cd: 1, when: doll },
        { name: 'stomach', use: () => this.heavy(), min: 0, max: 80, weight: 3, cd: 1.2, when: () => doll() && !used('stomach') },
        { name: 'achilles', use: () => this.skill1(), min: 0, max: 80, weight: 2.5, cd: 1.2, when: () => doll() && !used('achilles') },
        { name: 'arm', use: () => this.skill3(), min: 0, max: 80, weight: 2, cd: 1.2, when: () => doll() && !used('arm') },
        { name: 'final', use: () => this.skill2(), min: 0, max: 80, weight: 3, cd: 2, when: () => doll() && this.doll!.used.size >= 3 },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    const flare = { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare };
    const eat = { key: 'G', name: `Eat a Fracción${this.fraccion.length ? '' : ' (none)'}`, kanji: '喰', cd: cd.eat, cdMax: 16, active: this.fraccion.length > 0, tint: '#E07AB0' };
    if (this.doll) {
      const u = this.doll.used;
      return [
        { key: 'LMB', name: 'Flick', kanji: '弾', tint: '#C3122F' },
        { key: 'RMB', name: u.has('stomach') ? 'Stomach (gone)' : 'Estómago', kanji: '胃', active: !u.has('stomach'), tint: '#C3122F' },
        { key: 'Q', name: u.has('achilles') ? 'Achilles (gone)' : 'Tendón de Aquiles', kanji: '腱', active: !u.has('achilles'), tint: '#C3122F' },
        { key: 'E', name: 'Gran Final', kanji: '終幕', tint: '#C3122F' },
        { key: 'R', name: u.has('arm') ? 'Arm tendon (gone)' : 'Tendón del brazo', kanji: '腕', active: !u.has('arm'), tint: '#C3122F' },
        { key: 'Shift', name: 'Sonído', kanji: '響転', cost: 4 },
        flare,
        { key: 'F', name: 'Gabriel', kanji: '受胎告知', cost: 20, cd: cd.gabriel, cdMax: 4, tint: '#8E3FC0' },
        { key: 'G', name: 'Let the doll go', kanji: '離' },
      ];
    }
    if (this.form === 'sealed') {
      return [
        { key: 'LMB', name: 'Esgrima', kanji: '剣' },
        { key: 'RMB', name: 'Rokureichū', kanji: '録霊蟲', cost: 8, cd: cd.needle, cdMax: 2.5, tint: '#FF79B8' },
        { key: 'Q', name: 'Fracción', kanji: '従属官', cost: 10, cd: cd.fraccion, cdMax: 18, active: this.fraccion.length > 0, tint: '#E07AB0' },
        { key: 'E', name: 'Trap panel', kanji: '罠', cost: 14, cd: cd.trap, cdMax: 8, tint: '#FF8CC6' },
        { key: 'R', name: 'Power-control device', kanji: '制御', cost: 24, cd: cd.device, cdMax: 22, active: !!this.dome, tint: '#FF8CC6' },
        { key: 'Shift', name: 'Sonído', kanji: '響転', cost: 4 },
        flare,
        { key: 'F', name: 'Susure, Fornicarás', kanji: '邪淫妃', cost: 30, tint: '#FF79B8' },
        eat,
      ];
    }
    return [
      { key: 'LMB', name: 'Branches', kanji: '枝' },
      { key: 'RMB', name: 'Burrowing branch', kanji: '潜', cost: 16, cd: cd.burrow, cdMax: 4, tint: '#8F8E97' },
      { key: 'Q', name: this.clones.length ? `Snap (${this.clones.length})` : 'Carbon-Copy', kanji: '複製', cost: this.clones.length ? 0 : 40, cd: cd.copy, cdMax: 25, active: this.clones.length > 0, tint: '#2C2440' },
      { key: 'E', name: 'Teatro de Titere', kanji: '人形芝居', cost: 24, cd: cd.teatro, cdMax: 10, tint: '#8E3FC0' },
      { key: 'R', name: 'Telon Balon', kanji: '球体幕', cost: 12, cd: cd.balon, cdMax: 10, active: this.f.action instanceof BalonAction, tint: '#C9A6E3' },
      { key: 'Shift', name: 'Sonído', kanji: '響転', cost: 4 },
      flare,
      { key: 'F', name: this.reborn ? 'Gabriel (spent)' : this.egg ? 'Gabriel (laid)' : 'Gabriel', kanji: '受胎告知', cost: 20, cd: cd.gabriel, cdMax: 4, active: !!this.egg, tint: '#8E3FC0' },
      eat,
    ];
  }
}
