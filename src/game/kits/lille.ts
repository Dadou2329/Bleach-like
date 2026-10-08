// Lille Barro's kit (docs/kits/lille.md). The X-Axis: the sniper who puts a perfectly round hole through you and every
// wall between — no guard stops it, nothing behind you is touched. LMB Heilig Pfeil bullets (the stock up close); RMB
// the Scoped Shot (a bullet that takes a building apart, a fast blade can still cut it); Q the X-Axis; E Bullet Hail;
// R Long Snipe (one shot through everyone on a line, on through every building); G opens the left eye (intangible
// 4 s; the third time it stays open and Jilliel comes); F Jilliel; V the beacon. Shift is Hirenkyaku (a long backstep
// when it leaves the target); Reflexes leap clear of a blow from behind; a lost rifle is re-formed in reishi.
// Jilliel (intangible: what passes through him wears the green halo down): wing shots, the Six-Hole Blast, the
// barrage, Divine Pressure, the Teleport-Snipe, Descent, Judgement of God, the spiral teleport. Killed in Jilliel he
// rises as the True Form (the owl god: half damage and regeneration while the gold halo holds; sparks off his light
// body): long-arm slashes and finger beams, Sabaki no Kōmyō, the golden volley, the light ball, Grow Arms, Owl Eyes,
// Trompete. Killed in it, he bursts into golden rain and the remnant birds. His own power turned back on him
// (`DamageOpts.reflected`) lands in full whatever the form.
import * as THREE from 'three';
import { FighterAction, type Fighter, type FighterDef, type PropDef } from '../fighter';
import type { DamageOpts, Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import type { AuraStyle } from '../../vfx/aura';
import { DIAGRAMM_MUZZLE, DIAGRAMM_MUZZLE_R, lilleAsset, lilleProp } from '../../chars/lille';
import { JILLIEL_CLIPS, JILLIEL_STANCE, LILLE_CLIPS, LILLE_STANCE, REMNANT_CLIPS, REMNANT_STANCE, TRUE_CHAIN, TRUE_CLIPS, TRUE_STANCE } from '../../chars/lilleClips';
import { jillielAsset, lilleGodProp, remnantAsset, trueFormAsset } from '../../chars/lilleGod';
import { ExplosionTrail, GOLD, GOLD_LIGHT, JILLIEL_GREEN, JudgementColumn, PfeilBullet, Reticle, Trompete, WingBarrage, X_GREEN, XTrace, divinePressure, goldenRain, haloShatter, holeRing, lightBall, spiralTeleport, xAxis, xAxisLine } from '../../vfx/xaxis';
import { PlanarSlash } from '../../vfx/tybw';
import { CeroBeam } from '../projectiles/cero';
import { LightPillar } from '../../vfx/heilig';
import { DuelistAI } from '../ai/duelist';
import { raycastVoxels } from '../../voxel/raycast';
import { SphereShape } from '../../destruction/shapes';
import { TEX_GLOW, TEX_RING, TEX_STREAK } from '../../vfx/sprites';
import { hirenkyakuPuff, hirenkyakuStreak, vollFlight, type Rgb } from './sternritter';

export const AURA_LILLE: AuraStyle = { core: '#EAFFF1', body: '#6BE89A', rim: '#1E7A44' };
export const AURA_JILLIEL: AuraStyle = { core: '#F0FFF5', body: '#4FE38A', rim: '#16773E' };
export const AURA_TRUE: AuraStyle = { core: '#FFF6D0', body: '#F2C74E', rim: '#9A6E18' };
export const AURA_REMNANT: AuraStyle = { core: '#FFF6D0', body: '#F4E6C0', rim: '#B88A2C' };

const SPEED = { run: 9.4, sprint: 28, jump: 13, dash: 30, dashTime: 0.1 };
const SPEED_J = { run: 8.5, sprint: 24, jump: 10, dash: 30, dashTime: 0.08 };
const SPEED_T = { run: 10, sprint: 28, jump: 8, dash: 30, dashTime: 0.08 };
const TINT: Rgb = [0.48, 0.94, 0.66];
const HALO_J = 320;
const HALO_T = 420;
const EYE_TIME = 4;
const EYE_CD = 10;

export const LILLE_DEF: FighterDef = {
  id: 'lille',
  name: 'Lille Barro',
  title: 'Sternritter "X" — The X-Axis',
  build: () => ({ asset: lilleAsset('base'), props: [{ key: 'rifle', model: lilleProp('diagramm'), socket: 'grip.R' }] }),
  stance: LILLE_STANCE,
  clips: LILLE_CLIPS,
  aura: AURA_LILLE,
  hp: 1150,
  rei: 260,
  speed: { ...SPEED },
  radius: 0.3,
  height: 1.82,
};

const REMNANT_DEF: FighterDef = {
  id: 'lille-remnant',
  name: 'Remnant of Lille',
  title: 'what is left of the X-Axis',
  build: () => ({ asset: remnantAsset(), props: [] }),
  stance: REMNANT_STANCE,
  clips: REMNANT_CLIPS,
  aura: AURA_REMNANT,
  hp: 60,
  rei: 40,
  speed: { run: 8, sprint: 18, jump: 10, dash: 22, dashTime: 0.1 },
  radius: 0.28,
  height: 1.5,
};

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

// ---------------------------------------------------------------------------------------------- actions

interface SkillOpts {
  armor?: number;
  mobility?: number;
  invulnerable?: boolean;
  tick?: (t: number, dt: number) => void;
  end?: () => void;
  dur?: number;
}

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
    return next.name === 'dash' ? this.t > this.dur * 0.5 : next instanceof ClipSkill && this.t > this.dur * 0.7;
  }
}

/** one shot or blow of a string: the clip and its events; a press queued during it runs on at the combo point */
class StringAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  queued = false;
  constructor(readonly clip: string, readonly onEvent: (n: string) => void, readonly next: () => void, mobility = 0.35) {
    super();
    this.name = clip;
    this.mobility = mobility;
    this.airGravity = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    f.anim.play(this.clip, { onEvent: (n) => { if (n === 'hit') g.sfx.play('swingHeavy', f.center(), 0.5); this.onEvent(n); } });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.queued && this.t >= this.comboAt) {
      this.done = true;
      this.next();
      return;
    }
    if (this.t >= this.dur) this.done = true;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' || next instanceof ClipSkill ? this.t >= this.comboAt * 0.8 : false;
  }
}

// ---------------------------------------------------------------------------------------------- the remnants

/** A remnant bird: pecks, a blast gathered in front of the beak (hit while charging, it goes off on the bird), the spin. */
export class RemnantKit implements Kit {
  private charging = false;
  private lifeT = 30;
  readonly cd = { blast: 0, spin: 0 };
  constructor(readonly f: Fighter, readonly g: Game, readonly mind = false) {
    f.data.kit = this;
    f.data.quincy = true;
    f.ghosts.enabled = false;
    f.onHurt = () => {
      if (!this.charging || f.dead) return;
      // hit while it gathers: the blast goes off on itself
      this.charging = false;
      f.stopAction();
      const at = sock(f, 'mouth');
      g.damage(f, 80, null, f.forward().negate(), { energy: true, knock: 6 });
      this.burst(at, 2.2, 14);
    };
  }
  private target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 50);
  }
  private burst(at: THREE.Vector3, r: number, dmg: number): void {
    const { f, g } = this;
    for (const e of g.enemiesOf(f)) {
      if (e.dead || e.center().distanceTo(at) > r + e.def.radius) continue;
      g.damage(e, dmg, f, _v.subVectors(e.pos, at).setY(0.3).normalize().clone(), { energy: true, knock: 8, launch: 3, hitstop: 0.04 });
    }
    g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, size: r * 0.6, sizeEnd: r * 1.8, life: 0.3, r: 1, g: 0.86, b: 0.45, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    g.sfx.play('explode', at, 0.6);
  }
  private shoot(dir: THREE.Vector3): void {
    const { f, g } = this;
    g.addProjectile(new PfeilBullet(g, f, sock(f, 'mouth'), dir, { speed: 60, damage: 14, blast: 1.2, power: 300, size: 0.12, color: GOLD_LIGHT, splash: 0.5, range: 50 }));
  }
  update(dt: number): void {
    const { f } = this;
    this.cd.blast = Math.max(0, this.cd.blast - dt);
    this.cd.spin = Math.max(0, this.cd.spin - dt);
    if (f.dead) return;
    if ((this.lifeT -= dt) <= 0) {
      // the remnant fades
      goldenRain(this.g, f.center(), 1.5, 30);
      f.hp = 0;
      f.dead = true;
      this.g.remove(f);
    }
  }
  attack(): void {
    const { f, g } = this;
    const t = this.target();
    if (f.busy || !t) return;
    f.act(new StringAction('rm_peck', (n) => {
      if (n !== 'hit' || t.dead || t.pos.distanceTo(f.pos) > 2.2) return;
      g.damage(t, 9, f, _v.subVectors(t.pos, f.pos).setY(0).normalize().clone(), { knock: 4 });
    }, () => {}), true);
  }
  heavy(): void {
    const { f, g } = this;
    const t = this.target();
    if (f.busy || !t || this.cd.blast > 0) return;
    this.cd.blast = 3;
    this.charging = true;
    f.act(new ClipSkill('rcharge', 'rm_charge', (n) => {
      if (n === 'charge') g.sfx.play('charge', f.center(), 0.4);
      if (n !== 'fire' || !this.charging) return;
      this.charging = false;
      if (!t.dead) this.shoot(_v.subVectors(t.center(), sock(f, 'mouth')).normalize().clone());
    }, { end: () => { this.charging = false; }, tick: () => {
      if (!this.charging) return;
      const m = sock(f, 'mouth');
      g.engine.glow.spawn({ x: m.x, y: m.y, z: m.z, size: 0.25, sizeEnd: 0.1, life: 0.06, r: 1, g: 0.9, b: 0.55, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    } }), true);
  }
  skill1(): void {
    const { f, g } = this;
    if (f.busy || this.cd.spin > 0) return;
    this.cd.spin = 6;
    f.act(new ClipSkill('rspin', 'rm_spin', (n) => {
      if (n !== 'a' && n !== 'b' && n !== 'c') return;
      const a = f.yaw + (n === 'a' ? 2.1 : n === 'b' ? 4.2 : 0);
      this.shoot(new THREE.Vector3(Math.sin(a), -0.05, Math.cos(a)));
      g.sfx.play('beam', f.center(), 0.3);
    }), true);
  }
  release(): void {}
  toggleFlare(): void {}
  formName(): string {
    return this.mind ? 'Remnant (his mind)' : 'Remnant';
  }
  abilities(): AbilityInfo[] {
    return [];
  }
  ai(): KitAI {
    return {
      reach: 1.6,
      chain: 1,
      moves: [
        { name: 'blast', use: () => this.heavy(), min: 3, max: 30, weight: 3, cd: 2.5 },
        { name: 'spin', use: () => this.skill1(), min: 2, max: 20, weight: 1.5, cd: 5 },
      ],
    };
  }
}

// ---------------------------------------------------------------------------------------------- the kit

type Form = 'base' | 'jilliel' | 'true';

export class LilleKit implements Kit {
  form: Form = 'base';
  readonly cd = {
    xaxis: 0, scope: 0, hail: 0, snipe: 0, eye: 0, flare: 0, release: 0,
    six: 0, barrage: 0, pressure: 0, tsnipe: 0, descent: 0, judge: 0, port: 0,
    sabaki: 0, volley: 0, ball: 0, arms: 0, owl: 0, trompete: 0,
  };
  /** the left eye: how many times it has opened, how long it stays open */
  eyeOpens = 0;
  eyeT = 0;
  /** the halo of the god forms (it takes what passes through him) */
  halo = 0;
  haloMax = 0;
  haloBroken = false;
  reformed = false;
  private reformT = 0;
  private reflexCd = 0;
  comboIndex = 0;
  private lastEnd = 0;
  private wasDashing = false;
  /** True Form: wounds growing back, no regeneration while a shadow lies on him */
  private heals: { amount: number; at: number }[] = [];
  shadowT = 0;
  armsT = 0;
  owlT = 0;
  private sparkCd = 0;
  private rose = false;
  private burst = false;
  private remnants: Fighter[] = [];
  private lastLine = -99;
  /** the third opening: Jilliel comes a beat later (game time) */
  private jillielAt = 0;
  /** emitters left in the scene for a beam that outlives its pose */
  private temps: { o: THREE.Object3D; until: number }[] = [];
  private stunT = 0;
  private flick = 0;

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.data.quincy = true;
    f.parry = (amount, from, o) => this.parry(amount, from, o);
    f.onPhase = (amount, from, o) => this.phase(amount, from, o);
    f.onHurt = (dmg) => this.hurt(dmg);
    f.onLethal = () => this.lethal();
    f.anim.twoHandGap = -0.44;
    this.applyStats();
  }

  // ---------------------------------------------------------------- bits

  target(): Fighter | null {
    const { f, g } = this;
    const lock = f === g.player ? g.hud?.lockTarget ?? null : null;
    if (lock && !lock.dead) return lock;
    return g.nearestEnemy(f, 90, f.forward(), 80) ?? g.nearestEnemy(f, 90);
  }

  /** where they will be when a bullet of this speed gets there (perfect aim) */
  private lead(t: Fighter, from: THREE.Vector3, speed: number): THREE.Vector3 {
    const c = t.center();
    const tt = c.distanceTo(from) / speed;
    return c.addScaledVector(t.body.vel, Math.min(0.8, tt));
  }

  private muzzle(out = new THREE.Vector3()): THREE.Vector3 {
    const prop = this.f.visual.props.get('rifle');
    if (!prop || !prop.visible) return sock(this.f, 'chest.front', out);
    prop.updateWorldMatrix(true, false);
    return out.set(0, 0.6 / 48, this.reformed ? DIAGRAMM_MUZZLE_R : DIAGRAMM_MUZZLE).applyMatrix4(prop.matrixWorld);
  }

  private barrel(i: number): THREE.Vector3 {
    return sock(this.f, `barrel.${((i % 24) + 24) % 24}`);
  }

  private line(text: string, every = 6, kanji = '', color: string = X_GREEN): void {
    if (this.g.time - this.lastLine < every) return;
    this.lastLine = this.g.time;
    this.g.callout(kanji, text, color);
  }

  private special(a: FighterAction, cost: number, cdKey: keyof typeof this.cd, cd: number): boolean {
    const f = this.f;
    if (this.cd[cdKey] > 0) return false;
    if (f.action && !f.action.canCancel(a)) return false;
    if (f.hitstun > 0 || f.dead || this.stunT > 0) return false;
    if (!f.spendRei(cost)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return false;
    }
    this.cd[cdKey] = cd;
    f.act(a, true);
    return true;
  }

  private face(t: Fighter | null): void {
    if (!t) return;
    const f = this.f;
    f.faceTarget = t.center();
    f.yaw = Math.atan2(t.pos.x - f.pos.x, t.pos.z - f.pos.z);
  }

  // ---------------------------------------------------------------- what reaches him

  /** Reflexes: a blow from behind him is leapt clear (once every 10 s); in the True Form's Owl Eyes, always */
  private parry(amount: number, from: Fighter | null, o: DamageOpts): boolean {
    const { f, g } = this;
    if (!from || from === f || o.energy || amount < 6) return false;
    const d = _v.subVectors(from.pos, f.pos).setY(0);
    if (d.length() > 4) return false;
    const behind = d.normalize().dot(f.forward()) < -0.25;
    if (this.form === 'true' && this.owlT > 0) {
      g.sparks(f.center(), d.clone().negate(), GOLD, 14);
      return true;
    }
    if (!behind || this.reflexCd > 0 || this.form !== 'base' || f.busy) return false;
    this.reflexCd = 10;
    f.body.vel.y = 13;
    f.push.addScaledVector(d, -6);
    f.act(new ClipSkill('reflex', 'll_leap', () => {}, { invulnerable: true, mobility: 0.4, dur: 0.4 }), true);
    g.sfx.play('shunpo', f.center(), 0.5);
    hirenkyakuPuff(g, f, TINT);
    return true;
  }

  /** a blow passing through him: in Jilliel the halo takes the strain */
  private phase(amount: number, from: Fighter | null, o: DamageOpts): void {
    const { f, g } = this;
    const at = from ? _v.copy(from.center()).lerp(f.center(), 0.7) : f.center(_v);
    if (!o.quiet || Math.random() < 0.2) {
      g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, size: 0.4, sizeEnd: 1.4, life: 0.25, r: 0.5, g: 1, b: 0.7, alpha: 0.6, alphaEnd: 0, tex: TEX_RING });
      if (!o.quiet) g.sfx.play('ting', at, 0.25);
    }
    if (this.form === 'jilliel' && !this.haloBroken) {
      this.halo -= amount * (from ? from.power : 1) * 0.8;
      if (this.halo <= 0) this.breakHalo();
    }
  }

  private hurt(dmg: number): void {
    const { f, g } = this;
    const from = f.lastHurt.from;
    const reflected = !!f.lastHurt.reflected;
    if (reflected) {
      // his own power, turned back: nothing he has stops it (in the True Form it lands at full strength)
      if (this.form === 'true' && !this.haloBroken) g.drain(f, dmg, null);
      this.unsettled('My own…?');
      return;
    }
    if (this.form !== 'true') return;
    if (!this.haloBroken) {
      this.halo -= dmg * 0.8;
      if (this.halo <= 0) this.breakHalo();
    }
    // the light body: those who touch it are cut by the sparks
    if (from && from !== f && from.pos.distanceTo(f.pos) < 4.5 && this.sparkCd <= 0) {
      this.sparkCd = 0.4;
      g.damage(from, 8, f, _v.subVectors(from.pos, f.pos).setY(0).normalize().clone(), { energy: true, unblockable: true, knock: 4, quiet: true });
      from.slow(0.6, 1.5);
      g.sparks(from.center(), _v.subVectors(from.pos, f.pos).normalize(), GOLD, 18);
    }
    // the wound grows back
    if (!this.haloBroken) this.heals.push({ amount: dmg * 0.7, at: g.time + 2 });
  }

  /** killed in Jilliel he rises in the True Form; in the True Form he bursts */
  private lethal(): boolean {
    const { f } = this;
    if (this.form === 'jilliel' && !this.rose) {
      this.rose = true;
      f.hp = f.maxHp * 0.55;
      this.becomeTrue();
      return true;
    }
    return false;
  }

  /** the unexplained: he freezes a beat */
  private unsettled(text: string): void {
    this.stunT = 0.6;
    this.f.stopAction();
    this.line(text, 3);
  }

  private breakHalo(): void {
    const { f, g } = this;
    if (this.haloBroken) return;
    this.haloBroken = true;
    this.halo = 0;
    const p = f.visual.props.get('halo');
    const at = p ? p.getWorldPosition(new THREE.Vector3()) : f.center().add(_v.set(0, 2, 0));
    haloShatter(g, at, this.form === 'true' ? GOLD : JILLIEL_GREEN, this.form === 'true' ? 0.5 : 0.8);
    f.visual.detach('halo');
    this.applyStats();
    g.callout('', this.form === 'true' ? 'The light… it is leaving me…' : 'My halo—!', this.form === 'true' ? GOLD : JILLIEL_GREEN);
    this.unsettled('');
  }

  // ---------------------------------------------------------------- the frame

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    this.reflexCd = Math.max(0, this.reflexCd - dt);
    this.sparkCd = Math.max(0, this.sparkCd - dt);
    this.shadowT = Math.max(0, this.shadowT - dt);
    this.owlT = Math.max(0, this.owlT - dt);
    if (this.stunT > 0) {
      this.stunT -= dt;
      f.hitstun = Math.max(f.hitstun, 0.05);
    }
    if (f.dead) {
      if (this.form === 'true' && !this.burst) this.die();
      this.setPhase(false);
      return;
    }
    for (let i = this.temps.length - 1; i >= 0; i--) {
      if (g.time < this.temps[i].until) continue;
      this.temps[i].o.removeFromParent();
      this.temps.splice(i, 1);
    }
    if (this.jillielAt > 0 && g.time >= this.jillielAt) {
      this.jillielAt = 0;
      if (this.form === 'base') this.goJilliel(true);
    }
    // the left eye
    if (this.eyeT > 0 && (this.eyeT -= dt) <= 0 && this.form === 'base') this.closeEye();
    // intangible: the eye open, or Jilliel's halo whole
    const ghost = (this.form === 'base' && this.eyeT > 0) || (this.form === 'jilliel' && !this.haloBroken);
    this.setPhase(ghost);
    // Diagramm Reform: knocked out of his hand or cut, the rifle is rebuilt in green reishi
    if (this.form === 'base') {
      const rifle = f.visual.props.get('rifle');
      if (f.disarmT > 0) {
        if (rifle) rifle.visible = false;
        if ((this.reformT += dt) > 1) this.reform();
      } else this.reformT = 0;
    }
    // Hirenkyaku; in the god forms the spiral teleport
    const dashing = f.dashT > 0;
    if (dashing && !this.wasDashing) this.dashStart();
    if (dashing && this.form === 'base') hirenkyakuStreak(g, f, TINT);
    this.wasDashing = dashing;
    // the god forms float a hand's breadth off the ground on their stilt points (an AI stays within its rival's reach)
    if (this.form !== 'base') vollFlight(g, f, this.target(), this.form === 'true' ? 0 : 0.3);
    // holding the body half out of this world wears the halo down
    if (this.form === 'jilliel' && !this.haloBroken && (this.halo -= dt * 3) <= 0) this.breakHalo();
    // the True Form: wounds growing back (not under a shadow), the extra arms
    if (this.form === 'true') {
      for (let i = this.heals.length - 1; i >= 0; i--) {
        const h = this.heals[i];
        if (g.time < h.at) continue;
        this.heals.splice(i, 1);
        if (this.shadowT > 0 || this.haloBroken) continue;
        f.hp = Math.min(f.maxHp, f.hp + h.amount);
        const c = f.center();
        g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: 1.4, sizeEnd: 3, life: 0.35, r: 1, g: 0.92, b: 0.65, alpha: 0.6, alphaEnd: 0, tex: TEX_RING });
      }
      if (this.armsT > 0 && (this.armsT -= dt) <= 0) this.showArms(false);
      this.camera(dt);
    }
    if (this.form === 'jilliel') this.camera(dt);
    f.aura.target = this.form === 'true' ? 0.4 : this.form === 'jilliel' ? 0.35 : this.eyeT > 0 ? 0.3 : 0.05;
    for (let i = this.remnants.length - 1; i >= 0; i--) if (this.remnants[i].dead || !g.fighters.includes(this.remnants[i])) this.remnants.splice(i, 1);
  }

  /** the intangible shimmer: the body half-there, green light through it */
  private setPhase(on: boolean): void {
    const f = this.f;
    f.intangible = on;
    this.flick += 0.1;
    const amt = on ? 0.18 + Math.sin(this.flick * 2.3) * 0.06 : 0;
    const dis = on ? 0.07 + Math.max(0, Math.sin(this.flick * 3.1)) * 0.08 : 0;
    const set = (u: { uEnergy: { value: THREE.Vector4 }; uDissolve: { value: number } }) => {
      u.uEnergy.value.set(0.45, 1, 0.68, amt);
      if (!f.dead) u.uDissolve.value = dis;
    };
    set(f.visual.material.userData.uniforms);
    for (const p of f.visual.props.values()) {
      p.material.userData.uniforms.uEnergy.value.set(0.45, 1, 0.68, amt);
      p.userData.dissolve = dis;
    }
  }

  /** the god forms are big: the player's camera pulls back */
  private camera(dt: number): void {
    const { f, g } = this;
    if (f !== g.player) return;
    const H = f.def.height;
    const k = 1 - Math.exp(-3 * dt);
    g.cam.height += (H * 0.62 - g.cam.height) * k;
    g.cam.maxDist = Math.max(14, H * 3.2);
  }

  private dashStart(): void {
    const { f, g } = this;
    const t = this.target();
    if (this.form === 'base') {
      // a dash away from the target: a long backstep, landing to face them again
      if (t) {
        const away = _v.subVectors(f.pos, t.pos).setY(0).normalize();
        if (f.dashDir.dot(away) > 0.4) f.dashT += 0.06;
      }
      hirenkyakuPuff(g, f, TINT);
      return;
    }
    // Jilliel / the True Form: the spiral teleport — behind them when heading their way, 8 m along the dash otherwise
    const d = f.dashDir.clone().setY(0);
    if (d.lengthSq() < 0.01) d.copy(f.forward());
    d.normalize();
    const from = f.pos.clone();
    let to: THREE.Vector3;
    if (t && t.pos.distanceTo(f.pos) < 40 && d.dot(_v.subVectors(t.pos, f.pos).setY(0).normalize()) > 0.5) {
      to = t.pos.clone().addScaledVector(t.forward(), -(2.5 + f.def.radius));
      to.y = Math.max(t.pos.y, f.pos.y - 3);
    } else {
      const c = f.center();
      const hit = raycastVoxels(g.engine.world, c.x, c.y, c.z, d.x, 0, d.z, 8.5);
      to = f.pos.clone().addScaledVector(d, hit ? Math.max(0, hit.dist - f.def.radius - 0.4) : 8);
    }
    f.dashT = 0;
    f.body.pos.copy(to);
    f.body.prev.copy(to);
    f.body.vel.set(0, 0, 0);
    f.push.set(0, 0, 0);
    f.invuln = Math.max(f.invuln, 0.12);
    if (t) this.face(t);
    spiralTeleport(g, from, to, this.form === 'true' ? GOLD : JILLIEL_GREEN, this.form === 'true' ? 3 : 2);
  }

  // ---------------------------------------------------------------- LMB

  attack(): void {
    const { f, g } = this;
    if (this.stunT > 0) return;
    const cur = f.action;
    if (cur instanceof StringAction && (cur.clip.startsWith('ll_') || cur.clip.startsWith('tf_') || cur.clip === 'jl_wing')) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (g.time - this.lastEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const { f, g } = this;
    const t = this.target();
    this.lastEnd = g.time + 0.6;
    this.comboIndex = i + 1;
    if (t) this.face(t);
    const near = !!t && t.pos.distanceTo(f.pos) < (this.form === 'true' ? 5 : 2.6);
    if (this.form === 'base') {
      if (near && f.visual.props.get('rifle')?.visible !== false) {
        // the stock string
        const clips = ['ll_butt', 'll_hip', 'll_fin'];
        const k = i % 3;
        f.act(new StringAction(clips[k], (n) => {
          const tg = this.target();
          if (!tg || tg.dead) return;
          if (n === 'hit' && tg.pos.distanceTo(f.pos) < 2.9 + tg.def.radius) {
            g.damage(tg, k === 0 ? 10 : 18, f, _v.subVectors(tg.pos, f.pos).setY(0).normalize().clone(), { knock: k === 0 ? 4 : 12, launch: k === 2 ? 3 : 0, heavy: k === 2, hitstop: k === 2 ? 0.09 : 0.05 });
          }
          if (n === 'fire') {
            // the hip shot: point-blank
            const m = this.muzzle();
            g.addProjectile(new PfeilBullet(g, f, m, _v.subVectors(tg.center(), m).normalize().clone(), { speed: 160, damage: 14, blast: 0.4, power: 300, knock: 6, size: 0.1 }));
          }
        }, () => this.chain(i + 1), 0.3), true);
        return;
      }
      // a Heilig Pfeil bullet
      f.act(new StringAction('ll_shot', (n) => {
        if (n !== 'fire') return;
        const tg = this.target();
        const m = this.muzzle();
        const aim = tg && !tg.dead ? this.lead(tg, m, 140) : m.clone().addScaledVector(f.forward(), 30);
        g.addProjectile(new PfeilBullet(g, f, m, aim.sub(m).normalize(), { speed: 140, damage: 9, blast: 0.35, power: 260, size: 0.08 }));
        f.push.addScaledVector(f.forward(), -0.6);
      }, () => this.chain(i + 1), 0.45), true);
      return;
    }
    if (this.form === 'jilliel') {
      // wing shots: three holes fire at once
      f.act(new StringAction('jl_wing', (n) => {
        if (n !== 'fire') return;
        const tg = this.target();
        if (!tg || tg.dead) return;
        for (let k = 0; k < 2; k++) xAxis(g, f, this.barrel(Math.floor(Math.random() * 24)), tg, { damage: 4, radius: 0.18, color: JILLIEL_GREEN });
      }, () => this.chain(i + 1), 0.4), true);
      return;
    }
    // the True Form: long arms up close, golden beams off the fingers at range
    if (near) {
      const clip = TRUE_CHAIN[i % TRUE_CHAIN.length];
      f.act(new StringAction(clip, (n) => {
        if (n !== 'hit') return;
        const fw = f.forward();
        for (const e of g.enemiesOf(f)) {
          if (e.dead) continue;
          _v.subVectors(e.pos, f.pos).setY(0);
          const d = _v.length();
          if (d > 5 + e.def.radius || (d > 1 && _v.normalize().dot(fw) < 0.1)) continue;
          g.damage(e, 22, f, fw.clone(), { knock: 14, launch: 3, heavy: true, hitstop: 0.08, shake: 0.35 });
        }
      }, () => this.chain(i + 1), 0.3), true);
      return;
    }
    f.act(new StringAction('tf_beam', (n) => {
      if (n !== 'fire') return;
      const tg = this.target();
      if (!tg || tg.dead) return;
      const src = this.armsT > 0 ? 4 : 2;
      for (let k = 0; k < src; k++) xAxis(g, f, this.finger(k), tg, { damage: 7, radius: 0.2, color: GOLD });
    }, () => this.chain(i + 1), 0.4), true);
  }

  /** a fingertip (the extra arms' too while they last) */
  private finger(k: number): THREE.Vector3 {
    const f = this.f;
    if (this.armsT > 0 && k % 4 >= 2) {
      const p = f.visual.props.get(k % 2 === 0 ? 'arm2L' : 'arm2R');
      if (p) {
        p.updateWorldMatrix(true, false);
        return new THREE.Vector3(0, -2.4 / 16, 46 / 16).applyMatrix4(p.matrixWorld);
      }
    }
    return sock(f, k % 2 === 0 ? 'finger.R' : 'finger.L').add(_v.set((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4));
  }

  // ---------------------------------------------------------------- RMB

  heavy(): void {
    const { f, g } = this;
    if (this.stunT > 0) return;
    const t = this.target();
    if (this.form === 'base') {
      if (f.visual.props.get('rifle')?.visible === false) return;
      // the Scoped Shot: the dial, the reticle, a hyper-condensed bullet
      this.special(new ClipSkill('scope', 'll_scope', (n) => {
        const tg = this.target();
        if (n === 'dial') {
          g.sfx.play('ting', f.center(), 0.3);
          if (tg) g.addProjectile(new Reticle(g, tg, 0.45));
        }
        if (n !== 'fire') return;
        const m = this.muzzle();
        const aim = tg && !tg.dead ? this.lead(tg, m, 180) : m.clone().addScaledVector(f.forward(), 40);
        g.addProjectile(new PfeilBullet(g, f, m, aim.sub(m).normalize(), { speed: 180, damage: 55, blast: 3.2, power: 1600, size: 0.2, knock: 16, heavy: true, splash: 0.6, range: 160 }));
        f.push.addScaledVector(f.forward(), -3);
        this.line('Diaguramu.', 10, '', X_GREEN);
      }, { mobility: 0.1, tick: () => { if (t) this.face(t); } }), 20, 'scope', 6);
      return;
    }
    if (this.form === 'jilliel') {
      // the Six-Hole Blast
      const em = new THREE.Object3D();
      this.special(new ClipSkill('six', 'jl_six', (n) => {
        const tg = this.target();
        if (n === 'charge') g.sfx.play('charge', f.center(), 0.8);
        if (n !== 'fire') return;
        const c = sock(f, 'chest.front');
        em.position.copy(c);
        g.engine.gr.scene.add(em);
        const aim = tg ? tg.center() : c.clone().addScaledVector(f.forward(), 40);
        g.addProjectile(new CeroBeam(g, f, em, () => (tg && !tg.dead ? tg.center() : aim), { charge: 0.05, fire: 0.5, radius: 1.6, damage: 110, power: 1800, core: '#F0FFF5', body: JILLIEL_GREEN, rim: '#16773E', range: 70, track: 0.6, gain: 1.4 }));
        for (let k = 0; k < 6; k++) holeRing(g, this.barrel(k * 4), 0.6, JILLIEL_GREEN);
      }, { mobility: 0, armor: 0.3, tick: () => {
        const tg = this.target();
        if (tg) this.face(tg);
        if (Math.random() < 0.5) for (let k = 0; k < 6; k++) {
          const b = this.barrel(k * 4);
          g.engine.glow.spawn({ x: b.x, y: b.y, z: b.z, size: 0.4, sizeEnd: 0.1, life: 0.12, r: 0.6, g: 1, b: 0.75, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
        }
      }, end: () => this.temps.push({ o: em, until: g.time + 1.5 }) }), 40, 'six', 6);
      return;
    }
    // Sabaki no Kōmyō: the arm raised and chopped down — expanding waves of thin gold light
    this.special(new ClipSkill('sabaki', 'tf_sabaki', (n) => {
      if (n === 'raise') g.callout('裁きの光明', 'SABAKI NO KŌMYŌ', GOLD);
      if (n !== 'chop') return;
      const tg = this.target();
      const fw = tg ? _v.subVectors(tg.pos, f.pos).setY(0).normalize().clone() : f.forward();
      const origin = f.pos.clone().add(new THREE.Vector3(0, 1.2, 0)).addScaledVector(fw, 2);
      for (const a of [-0.45, 0, 0.45]) {
        const along = fw.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), a);
        const across = new THREE.Vector3(0, 1, 0).cross(along).normalize();
        g.addProjectile(new PlanarSlash(g, f, origin.clone(), along, across, { length: 70, width: 1.6, grow: 0.7, damage: 70, cut: 2600, color: GOLD, core: GOLD_LIGHT }));
        g.addProjectile(new ExplosionTrail(g, f, origin.clone(), along, 70, 100, 18));
      }
      g.sfx.play('getsuga', f.center(), 1.3);
      if (f === g.player) g.shake(0.6);
    }, { mobility: 0, armor: 0.5 }), 40, 'sabaki', 7);
  }

  // ---------------------------------------------------------------- Q

  skill1(): void {
    const { f, g } = this;
    if (this.stunT > 0) return;
    const t = this.target();
    if (this.form === 'base') {
      if (!t || f.visual.props.get('rifle')?.visible === false) return;
      // the X-Axis
      this.special(new ClipSkill('xaxis', 'll_xaxis', (n) => {
        if (n !== 'fire' || t.dead) return;
        xAxis(g, f, this.muzzle(), t, { damage: 40, radius: 0.3, knock: 5, heavy: true });
        this.line('Ji Ikusakushisu.', 9, '万物貫通');
      }, { mobility: 0.1, tick: () => this.face(t) }), 25, 'xaxis', 4.5);
      return;
    }
    if (this.form === 'jilliel') {
      if (!t) return;
      this.special(new ClipSkill('barrage', 'jl_barrage', (n) => {
        if (n === 'fire' && !t.dead) g.addProjectile(new WingBarrage(g, f, (i) => this.barrel(i), t, 24, 1.1, 8, 5));
      }, { mobility: 0.1, armor: 0.3 }), 35, 'barrage', 7);
      return;
    }
    if (!t) return;
    // the golden volley: every finger at once
    this.special(new ClipSkill('volley', 'tf_volley', (n) => {
      if (n !== 'fire' || t.dead) return;
      const n0 = this.armsT > 0 ? 20 : 10;
      for (let k = 0; k < n0; k++) {
        const from = this.finger(k);
        if (Math.random() < 0.6) xAxis(g, f, from, t, { damage: 6, radius: 0.2, color: GOLD });
        else {
          // the rest rake the ground round them
          const spot = t.pos.clone().add(_v.set((Math.random() - 0.5) * 6, 0.2, (Math.random() - 0.5) * 6));
          g.addProjectile(new XTrace(g, from, spot, GOLD, 0.04, 0.2));
          g.engine.destruction.carve(new SphereShape(spot, 0.7), { mode: 'explode', power: 420, impulse: 5, dust: 0.4 });
          holeRing(g, spot, 0.6, GOLD);
        }
      }
    }, { mobility: 0.1, tick: () => this.face(t) }), 35, 'volley', 6);
  }

  // ---------------------------------------------------------------- E

  skill2(): void {
    const { f, g } = this;
    if (this.stunT > 0) return;
    const t = this.target();
    if (this.form === 'base') {
      if (f.visual.props.get('rifle')?.visible === false) return;
      // Bullet Hail: a fan of bullets swept across them
      let shots = 0, at = 0;
      this.special(new ClipSkill('hail', 'll_hail', () => {}, { mobility: 0.1, tick: (tt) => {
        at = tt;
        if (tt < 0.12 || tt > 0.5) return;
        const want = Math.min(12, Math.floor(((tt - 0.12) / 0.38) * 12) + 1);
        while (shots < want) {
          const k = shots++;
          const m = this.muzzle();
          const fw = t && !t.dead ? _v.subVectors(t.center(), m).setY(0).normalize().clone() : f.forward();
          const dir = fw.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), (k / 11 - 0.5) * 0.5);
          if (t && !t.dead) dir.y = (t.center().y - m.y) / Math.max(1, t.center().distanceTo(m));
          g.addProjectile(new PfeilBullet(g, f, m, dir.normalize(), { speed: 130, damage: 8, blast: 0.4, power: 280, size: 0.08 }));
        }
      } }), 25, 'hail', 6);
      void at;
      return;
    }
    if (this.form === 'jilliel') {
      this.special(new ClipSkill('pressure', 'jl_pressure', (n) => {
        if (n !== 'burst') return;
        divinePressure(g, f, 14, 1.2);
        this.line('Kneel, sinners.', 6, '', JILLIEL_GREEN);
      }, { mobility: 0, invulnerable: true }), 30, 'pressure', 12);
      return;
    }
    // the light ball: every shadow burnt away (decoys, the veiled, the hidden found) — and a shadow falls on him
    this.special(new ClipSkill('ball', 'tf_ball', (n) => {
      if (n !== 'ball') return;
      const at = sock(f, 'finger.R').add(_v.set(0, 1.5, 0));
      lightBall(g, at, 14);
      for (const e of g.enemiesOf(f)) {
        if (e.dead || e.center().distanceTo(at) > 30) continue;
        e.lure = null;
        e.veiled = false;
        if (e.center().distanceTo(at) < 8 + e.def.radius) g.damage(e, 40, f, _v.subVectors(e.pos, at).setY(0.3).normalize().clone(), { energy: true, knock: 10, launch: 3, heavy: true });
      }
      this.shadowT = 3;
      this.line('There is nowhere left to hide.', 6, '', GOLD);
    }, { mobility: 0.1 }), 30, 'ball', 14);
  }

  // ---------------------------------------------------------------- R

  skill3(): void {
    const { f, g } = this;
    if (this.stunT > 0) return;
    const t = this.target();
    if (this.form === 'base') {
      if (!t || f.visual.props.get('rifle')?.visible === false) return;
      // Long Snipe: a knee, the scope, then one X-Axis through them and on through everything on the line
      this.special(new ClipSkill('snipe', 'll_kneel', (n) => {
        if (n === 'dial') {
          g.sfx.play('ting', f.center(), 0.4);
          g.addProjectile(new Reticle(g, t, 0.65));
          this.line('Line up, so I can kill you all with one shot.', 12);
        }
        if (n !== 'fire' || t.dead) return;
        const m = this.muzzle();
        const dir = _v.subVectors(t.center(), m).normalize().clone();
        xAxisLine(g, f, m, dir, 80, 0.9, { damage: 60, radius: 0.36, knock: 8, heavy: true, width: 0.06 });
      }, { mobility: 0, tick: () => this.face(t) }), 40, 'snipe', 14);
      return;
    }
    if (this.form === 'jilliel') {
      if (!t) return;
      // Teleport-Snipe: behind them, point-blank
      this.special(new ClipSkill('tsnipe', 'jl_snipe', (n) => {
        if (n !== 'fire' || t.dead) return;
        xAxis(g, f, this.barrel(Math.floor(Math.random() * 24)), t, { damage: 50, radius: 0.32, color: JILLIEL_GREEN, knock: 10, heavy: true });
      }, { mobility: 0, invulnerable: true }), 30, 'tsnipe', 9);
      if (f.action?.name === 'tsnipe') {
        const from = f.pos.clone();
        const to = t.pos.clone().addScaledVector(t.forward(), -(2.4 + f.def.radius));
        to.y = Math.max(t.pos.y, to.y);
        f.body.pos.copy(to);
        f.body.prev.copy(to);
        this.face(t);
        spiralTeleport(g, from, to, JILLIEL_GREEN, 2);
      }
      return;
    }
    // Grow Arms
    this.special(new ClipSkill('arms', 'tf_arms', (n) => {
      if (n !== 'grow') return;
      this.armsT = 15;
      this.showArms(true);
      g.sfx.play('roar', f.center(), 0.6);
    }, { mobility: 0 }), 30, 'arms', 25);
  }

  private showArms(on: boolean): void {
    const f = this.f;
    if (on) {
      f.visual.attach('arm2L', lilleGodProp('arm'), 'arm2.L');
      f.visual.attach('arm2R', lilleGodProp('arm'), 'arm2.R');
      const c = f.center();
      this.g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: 2, sizeEnd: 6, life: 0.4, r: 1, g: 0.9, b: 0.6, alpha: 0.7, alphaEnd: 0, tex: TEX_RING });
    } else {
      f.visual.detach('arm2L');
      f.visual.detach('arm2R');
    }
  }

  // ---------------------------------------------------------------- G

  toggle(): void {
    const { f, g } = this;
    if (this.stunT > 0) return;
    if (this.form === 'base') {
      if (this.cd.eye > 0 || this.eyeT > 0) return;
      // the left eye opens
      this.special(new ClipSkill('eye', 'll_eye', (n) => {
        if (n !== 'open') return;
        this.eyeOpens++;
        this.eyeT = EYE_TIME;
        this.rebody();
        const e = sock(f, 'eye.L');
        g.engine.glow.spawn({ x: e.x, y: e.y, z: e.z, size: 0.2, sizeEnd: 0.9, life: 0.4, r: 0.5, g: 1, b: 0.7, alpha: 1, alphaEnd: 0, tex: TEX_RING });
        g.sfx.play('ting', e, 0.7);
        if (this.eyeOpens >= 3) {
          g.callout('', 'The third time.', X_GREEN);
          this.jillielAt = g.time + 0.2;
        } else if (f === g.player) g.hud?.showBanner(`The left eye — ${this.eyeOpens}/3`);
      }, { mobility: 0.3 }), 10, 'eye', EYE_CD);
      return;
    }
    if (this.form === 'jilliel') {
      // Descent: up, and down onto the stilt points
      this.special(new ClipSkill('descent', 'jl_descent', (n) => {
        if (n !== 'land') return;
        const at = f.pos.clone();
        for (const e of g.enemiesOf(f)) {
          if (e.dead || Math.hypot(e.pos.x - at.x, e.pos.z - at.z) > 3.4 + e.def.radius || Math.abs(e.pos.y - at.y) > 3) continue;
          g.damage(e, 30, f, _v.subVectors(e.pos, at).setY(0).normalize().clone(), { knock: 4, heavy: true, hitstop: 0.12 });
          e.slow(0.1, 1.5);
          e.hitstun = Math.max(e.hitstun, 1.2);
        }
        g.groundImpact(at, 3.4, 900, JILLIEL_GREEN, f);
        f.body.vel.y = -20;
      }, { mobility: 0.2, armor: 0.5 }), 20, 'descent', 8);
      return;
    }
    // Owl Eyes: the head flattened, the eyes slid round it — nothing surprises him for 6 s
    this.special(new ClipSkill('owl', 'tf_owl', (n) => {
      if (n !== 'look') return;
      this.owlT = 6;
      f.blindT = 0;
      for (const e of g.enemiesOf(f)) e.lure = null;
      this.line('I see every one of you.', 6, '', GOLD);
    }, { mobility: 0.3 }), 15, 'owl', 18);
  }

  // ---------------------------------------------------------------- F

  release(): void {
    const { f, g } = this;
    if (this.stunT > 0) return;
    const t = this.target();
    if (this.form === 'base') {
      if (this.eyeOpens < 3 && f.hp > f.maxHp * 0.5) {
        if (f === g.player) g.hud?.showBanner('Jilliel: open the eye a third time, or below half health');
        return;
      }
      this.goJilliel(false);
      return;
    }
    if (this.form === 'jilliel') {
      if (!t) return;
      // Judgement of God
      this.special(new ClipSkill('judge', 'jl_judge', (n) => {
        if (n !== 'aim' || t.dead) return;
        g.addProjectile(new JudgementColumn(g, f, (i) => this.barrel(i), t, 1.8, 160, 3));
        g.callout('神の裁き', 'Judgement of God.', JILLIEL_GREEN);
      }, { mobility: 0, armor: 0.4 }), 70, 'judge', 28);
      return;
    }
    if (!t) return;
    // Trompete
    let tr: Trompete | null = null;
    this.special(new ClipSkill('trompete', 'tf_trompete', (n) => {
      if (n !== 'draw') return;
      g.callout('神の喇叭', 'TORONPĒTE', GOLD);
      tr = new Trompete(g, f, () => (t.dead ? f.pos.clone().addScaledVector(f.forward(), 12) : t.center()), 1.6, 200, 14);
      g.addProjectile(tr);
    }, { mobility: 0, armor: 0.6, end: () => { if (tr && !tr.done && f.action?.name !== 'trompete') { /* the blow goes on without the pose */ } } }), 90, 'trompete', 40);
  }

  // ---------------------------------------------------------------- V

  toggleFlare(): void {
    const { f, g } = this;
    if (this.cd.flare > 0 || f.busy) return;
    this.cd.flare = 8;
    const r = this.form === 'base' ? 9 : 14;
    f.act(new ClipSkill('flare', this.form === 'base' ? 'll_flare' : this.form === 'jilliel' ? 'jl_pressure' : 'tf_arms', (n) => {
      if (n !== 'burst' && n !== 'grow') return;
      f.aura.flare(1.6, 0.6);
      const c = f.center();
      for (const e of g.enemiesOf(f)) {
        if (e.dead || e.center().distanceTo(c) > r + e.def.radius) continue;
        e.lure = null;
        e.veiled = false;
        e.hitstun = Math.max(e.hitstun, 0.45);
        e.push.addScaledVector(_v.subVectors(e.pos, f.pos).setY(0).normalize(), 6);
      }
      g.addRing(f.pos.clone(), r, this.form === 'true' ? GOLD : X_GREEN, 0.45);
      g.sfx.play('flare', c, 0.7);
    }, { mobility: 0.2 }), true);
  }

  // ---------------------------------------------------------------- the forms

  private goJilliel(auto: boolean): void {
    const { f, g } = this;
    if (this.form !== 'base') return;
    if (f.busy && !auto) return;
    if (!auto && !f.spendRei(50)) {
      if (f === g.player) g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      this.becomeJilliel();
    };
    f.act(new ClipSkill('release', 'll_release', (n) => {
      if (n === 'zeichen') {
        // the Zeichen forms in the air, centred on his left eye
        const e = sock(f, 'eye.L');
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          g.engine.glow.spawn({ x: e.x + Math.cos(a) * 0.3, y: e.y + Math.sin(a) * 0.3, z: e.z, size: 0.25, sizeEnd: 0.5, life: 0.5, r: 0.5, g: 1, b: 0.7, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
        }
        g.engine.glow.spawn({ x: e.x, y: e.y, z: e.z, size: 0.3, sizeEnd: 2.4, life: 0.5, r: 0.5, g: 1, b: 0.7, alpha: 1, alphaEnd: 0, tex: TEX_RING });
      }
      if (n === 'burst') go();
    }, { invulnerable: true, mobility: 0, end: () => { if (!f.dead) go(); } }), true);
  }

  private becomeJilliel(): void {
    const { f, g } = this;
    this.form = 'jilliel';
    this.eyeT = 0;
    this.halo = this.haloMax = HALO_J;
    this.haloBroken = false;
    this.rebody();
    g.addProjectile(new LightPillar(g, f.pos.clone(), 1.4, 70, JILLIEL_GREEN));
    f.aura.pillarBurst(2.2);
    f.aura.flare(2, 1);
    divinePressure(g, f, 14, 1.0);
    g.callout('神の裁き', 'QUINCY: VOLLSTÄNDIG — JIRIERU', JILLIEL_GREEN);
    g.sfx.play('bankai', f.center());
    g.shake(f === g.player ? 0.6 : 0.25);
  }

  private becomeTrue(): void {
    const { f, g } = this;
    this.form = 'true';
    this.halo = this.haloMax = HALO_T;
    this.haloBroken = false;
    this.heals.length = 0;
    this.setPhase(false);
    f.stopAction();
    // the head goes in a burst of light; out of the stump an owl's head rises on a long neck
    const c = f.center();
    g.engine.glow.spawn({ x: c.x, y: c.y + 1.4, z: c.z, size: 2, sizeEnd: 7, life: 0.5, r: 1, g: 0.95, b: 0.75, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    this.rebody();
    f.act(new ClipSkill('rise', 'tf_rise', () => {}, { invulnerable: true, mobility: 0 }), true);
    g.addProjectile(new LightPillar(g, f.pos.clone(), 1.6, 80, GOLD));
    f.aura.pillarBurst(2.4);
    f.aura.flare(2.2, 1.2);
    g.callout('', "I am God's messenger. You cannot kill me.", GOLD);
    g.sfx.play('roarBig', f.center(), 0.9);
    g.shake(f === g.player ? 0.8 : 0.3);
  }

  /** the end: golden rain, and the remnants rise out of it */
  private die(): void {
    const { f, g } = this;
    this.burst = true;
    const c = f.center();
    goldenRain(g, c, 14, 220);
    g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: 3, sizeEnd: 12, life: 0.6, r: 1, g: 0.9, b: 0.6, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    g.sfx.play('explode', c, 1.4);
    f.visual.object.visible = false;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const at = f.pos.clone().add(new THREE.Vector3(Math.cos(a) * 3, 0.5, Math.sin(a) * 3));
      const r = g.spawn({ ...REMNANT_DEF }, at, f.team);
      r.yaw = a;
      const kit = new RemnantKit(r, g, i === 0);
      g.controllers.push(new DuelistAI(g, r, kit, { aggression: 0.7, intro: 0.1 }));
      this.remnants.push(r);
    }
    g.callout('', 'Tsumibukai…', GOLD);
  }

  /** the body, stance, clips and props for the form */
  private rebody(): void {
    const { f } = this;
    const base = this.form === 'base';
    if (base) {
      f.def = { ...f.def, stance: LILLE_STANCE, clips: LILLE_CLIPS, speed: { ...SPEED }, height: 1.82, radius: 0.3 };
      f.setForm({ asset: lilleAsset(this.eyeT > 0 ? 'open' : 'base'), props: this.props() }, AURA_LILLE);
      f.body.hw = 0.27;
      f.body.h = 1.7;
      f.visual.rig.setBoneVisible('palm.R', false);
      f.visual.rig.setBoneVisible('fist.R', true);
    } else if (this.form === 'jilliel') {
      f.def = { ...f.def, stance: JILLIEL_STANCE, clips: JILLIEL_CLIPS, speed: { ...SPEED_J }, height: 3.3, radius: 0.85 };
      f.setForm({ asset: jillielAsset(), props: this.props() }, AURA_JILLIEL);
      f.body.hw = 0.45;
      f.body.h = 2.6;
      f.ghosts.enabled = false;
    } else {
      f.def = { ...f.def, stance: TRUE_STANCE, clips: TRUE_CLIPS, speed: { ...SPEED_T }, height: 6.2, radius: 1.0 };
      f.setForm({ asset: trueFormAsset(), props: this.props() }, AURA_TRUE);
      f.body.hw = 0.6;
      f.body.h = 3;
      f.ghosts.enabled = false;
      f.visual.rig.setBoneVisible('fist.R', false);
      f.visual.rig.setBoneVisible('fist.L', false);
    }
    f.anim.twoHandGap = -0.44;
    this.applyStats();
  }

  private props(): PropDef[] {
    if (this.form === 'base') return [{ key: 'rifle', model: lilleProp(this.reformed ? 'diagramm-r' : 'diagramm'), socket: 'grip.R' }];
    if (this.form === 'jilliel') return [{ key: 'head', model: lilleGodProp('head-god'), socket: 'headProp' }, ...(this.haloBroken ? [] : [{ key: 'halo', model: lilleGodProp('halo-green'), socket: 'halo' }])];
    return [{ key: 'head', model: lilleGodProp('head-owl'), socket: 'headProp' }, ...(this.haloBroken ? [] : [{ key: 'halo', model: lilleGodProp('halo-gold'), socket: 'halo' }])];
  }

  private closeEye(): void {
    this.eyeT = 0;
    this.rebody();
  }

  /** Diagramm re-formed in green reishi: shorter, the fur gone, holes along the stock */
  private reform(): void {
    const { f, g } = this;
    this.reformT = 0;
    f.disarmT = 0;
    this.reformed = true;
    f.visual.detach('rifle');
    const p = f.visual.attach('rifle', lilleProp('diagramm-r'), 'grip.R');
    p.visible = true;
    const c = this.muzzle();
    for (let i = 0; i < 16; i++) g.engine.glow.spawn({ x: c.x + (Math.random() - 0.5), y: c.y + (Math.random() - 0.5) * 0.4, z: c.z + (Math.random() - 0.5), vx: 0, vy: 0.5, vz: 0, size: 0.18, sizeEnd: 0.04, life: 0.5, r: 0.5, g: 1, b: 0.7, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    g.sfx.play('ting', c, 0.6);
    this.line('Diagramm will not break.', 6);
  }

  private applyStats(): void {
    const f = this.f;
    if (this.form === 'base') {
      f.power = 1;
      f.damageTaken = 0.9;
      f.toughness = 0;
    } else if (this.form === 'jilliel') {
      f.power = 1.35;
      f.damageTaken = this.haloBroken ? 0.85 : 0.9;
      f.toughness = 0;
    } else {
      f.power = 1.5;
      f.damageTaken = this.haloBroken ? 1 : 0.5;
      f.toughness = this.haloBroken ? 0 : 10;
    }
  }

  formName(): string {
    if (this.form === 'base') return `Sternritter "X" — The X-Axis${this.eyeT > 0 ? ' · the eye open' : ''} · ${this.eyeOpens}/3${this.reformed ? ' · re-formed' : ''}`;
    if (this.form === 'jilliel') return `Quincy: Vollständig — Jilliel · halo ${this.haloBroken ? 'broken' : `${Math.max(0, Math.round(this.halo))}/${this.haloMax}`}`;
    return `Jilliel — True Form · halo ${this.haloBroken ? 'broken' : `${Math.max(0, Math.round(this.halo))}/${this.haloMax}`}${this.armsT > 0 ? ' · four arms' : ''}`;
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    if (this.form === 'base') return [
      { key: 'LMB', name: 'Heilig Pfeil', kanji: '弾', cost: 0, cd: 0, cdMax: 0, tint: X_GREEN },
      { key: 'RMB', name: 'Scoped Shot', kanji: '照', cost: 20, cd: cd.scope, cdMax: 6, tint: X_GREEN },
      { key: 'Q', name: 'The X-Axis', kanji: '貫', cost: 25, cd: cd.xaxis, cdMax: 4.5, tint: X_GREEN },
      { key: 'E', name: 'Bullet Hail', kanji: '雨', cost: 25, cd: cd.hail, cdMax: 6, tint: X_GREEN },
      { key: 'R', name: 'Long Snipe', kanji: '列', cost: 40, cd: cd.snipe, cdMax: 14, tint: X_GREEN },
      { key: 'G', name: `The Left Eye ${this.eyeOpens}/3`, kanji: '眼', cost: 10, cd: cd.eye, cdMax: EYE_CD, active: this.eyeT > 0, tint: X_GREEN },
      { key: 'F', name: 'Jilliel', kanji: '神', cost: 50, cd: 0, cdMax: 0, tint: JILLIEL_GREEN, active: this.eyeOpens >= 3 || this.f.hp < this.f.maxHp * 0.5 },
      { key: 'V', name: 'Beacon', kanji: '標', cost: 0, cd: cd.flare, cdMax: 8, tint: X_GREEN },
    ];
    if (this.form === 'jilliel') return [
      { key: 'LMB', name: 'Wing Shots', kanji: '翼', cost: 0, cd: 0, cdMax: 0, tint: JILLIEL_GREEN },
      { key: 'RMB', name: 'Six-Hole Blast', kanji: '六', cost: 40, cd: cd.six, cdMax: 6, tint: JILLIEL_GREEN },
      { key: 'Q', name: '24-Barrel Barrage', kanji: '砲', cost: 35, cd: cd.barrage, cdMax: 7, tint: JILLIEL_GREEN },
      { key: 'E', name: 'Divine Pressure', kanji: '圧', cost: 30, cd: cd.pressure, cdMax: 12, tint: JILLIEL_GREEN },
      { key: 'R', name: 'Teleport-Snipe', kanji: '転', cost: 30, cd: cd.tsnipe, cdMax: 9, tint: JILLIEL_GREEN },
      { key: 'G', name: 'Descent', kanji: '降', cost: 20, cd: cd.descent, cdMax: 8, tint: JILLIEL_GREEN },
      { key: 'F', name: 'Judgement of God', kanji: '裁', cost: 70, cd: cd.judge, cdMax: 28, tint: JILLIEL_GREEN },
      { key: 'Shift', name: 'Spiral Teleport', kanji: '螺', cost: 0, cd: 0, cdMax: 0, tint: JILLIEL_GREEN },
    ];
    return [
      { key: 'LMB', name: 'Long Arms / Beams', kanji: '腕', cost: 0, cd: 0, cdMax: 0, tint: GOLD },
      { key: 'RMB', name: 'Sabaki no Kōmyō', kanji: '光', cost: 40, cd: cd.sabaki, cdMax: 7, tint: GOLD },
      { key: 'Q', name: 'Golden Volley', kanji: '指', cost: 35, cd: cd.volley, cdMax: 6, tint: GOLD },
      { key: 'E', name: 'Light Ball', kanji: '球', cost: 30, cd: cd.ball, cdMax: 14, tint: GOLD },
      { key: 'R', name: 'Grow Arms', kanji: '生', cost: 30, cd: cd.arms, cdMax: 25, active: this.armsT > 0, tint: GOLD },
      { key: 'G', name: 'Owl Eyes', kanji: '梟', cost: 15, cd: cd.owl, cdMax: 18, active: this.owlT > 0, tint: GOLD },
      { key: 'F', name: 'Trompete', kanji: '喇', cost: 90, cd: cd.trompete, cdMax: 40, tint: GOLD },
      { key: 'Shift', name: 'Spiral Teleport', kanji: '螺', cost: 0, cd: 0, cdMax: 0, tint: GOLD },
    ];
  }

  ai(): KitAI {
    const f = this.f;
    const hpK = () => f.hp / f.maxHp;
    const base = () => this.form === 'base';
    const jil = () => this.form === 'jilliel';
    const god = () => this.form === 'true';
    const hurtRecently = () => this.g.time - f.lastHurt.at < 1.5;
    const tgt = () => this.target();
    const still = () => { const t = tgt(); return !!t && Math.hypot(t.body.vel.x, t.body.vel.z) < 3; };
    return {
      reach: 2.4,
      chain: 3,
      ranged: true,
      moves: [
        // the sniper: the X-Axis and bullets from far off, the stock only when someone gets in
        { name: 'shoot', use: () => this.attack(), min: 2.8, max: 60, weight: 3, cd: 0.35, when: base },
        { name: 'xaxis', use: () => this.skill1(), min: 4, max: 80, weight: 3.4, cd: 4, when: base },
        { name: 'scope', use: () => this.heavy(), min: 10, max: 80, weight: 2.2, cd: 6, when: () => base() && !hurtRecently() },
        { name: 'hail', use: () => this.skill2(), min: 4, max: 30, weight: 2, cd: 6, when: base },
        { name: 'snipe', use: () => this.skill3(), min: 14, max: 80, weight: 2.6, cd: 12, when: () => base() && !hurtRecently() },
        { name: 'eye', use: () => this.toggle(), min: 0, max: 8, weight: 6, cd: 3, when: () => base() && this.eyeT <= 0 && this.cd.eye <= 0 && hurtRecently() && hpK() < 0.9 },
        { name: 'jilliel', use: () => this.release(), min: 0, max: 80, weight: 9, cd: 4, when: () => base() && (this.eyeOpens >= 3 || hpK() < 0.5) },
        { name: 'beacon', use: () => this.toggleFlare(), min: 0, max: 5, weight: 1.5, cd: 9, when: () => base() && hurtRecently() },
        // Jilliel
        { name: 'wings', use: () => this.attack(), min: 0, max: 60, weight: 3, cd: 0.4, when: jil },
        { name: 'six', use: () => this.heavy(), min: 6, max: 60, weight: 2.4, cd: 6, when: jil },
        { name: 'barrage', use: () => this.skill1(), min: 3, max: 40, weight: 2.4, cd: 7, when: jil },
        { name: 'pressure', use: () => this.skill2(), min: 0, max: 11, weight: 3, cd: 11, when: jil },
        { name: 'tsnipe', use: () => this.skill3(), min: 6, max: 40, weight: 2, cd: 9, when: jil },
        { name: 'descent', use: () => this.toggle(), min: 0, max: 4, weight: 2.5, cd: 8, when: jil },
        { name: 'judge', use: () => this.release(), min: 5, max: 50, weight: 3, cd: 20, when: () => jil() && (still() || hpK() < 0.6) },
        // the True Form
        { name: 'arms', use: () => this.attack(), min: 0, max: 50, weight: 3, cd: 0.4, when: god },
        { name: 'sabaki', use: () => this.heavy(), min: 5, max: 70, weight: 3.2, cd: 6, when: god },
        { name: 'volley', use: () => this.skill1(), min: 3, max: 50, weight: 2.4, cd: 6, when: god },
        { name: 'ball', use: () => this.skill2(), min: 0, max: 30, weight: 2.4, cd: 12, when: () => god() && this.g.enemiesOf(f).some((e) => !!e.lure || e.veiled || e.center().distanceTo(f.center()) < 8) },
        { name: 'grow', use: () => this.skill3(), min: 0, max: 60, weight: 2, cd: 25, when: () => god() && this.armsT <= 0 },
        { name: 'owl', use: () => this.toggle(), min: 0, max: 8, weight: 2, cd: 18, when: () => god() && hurtRecently() },
        { name: 'trompete', use: () => this.release(), min: 6, max: 60, weight: 4, cd: 30, when: () => god() && hpK() < 0.7 },
      ],
    };
  }
}

