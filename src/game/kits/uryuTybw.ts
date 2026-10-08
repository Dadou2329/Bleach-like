// Uryū's Blood War kit (docs/kits/uryu.md, loadout U3 — Sternritter "A", the card's default — and Quincy: Vollständig).
// Cold precision: he stays out of reach and the arrows do the talking. Sternritter: LMB the Heilig Pfeil string from the
// Heilig Bogen (two shots, then three in a blur), point-blank a front kick and a palm thrust that loose arrows into the
// target; RMB the power shot that holes bodies and walls; Q the instant Licht Regen; E Antithesis (the wounds of the last
// six seconds reversed between him and the target, his statuses handed over); R the Standspitze once a match (the
// target's power sealed), then Leiden Scherben chips (≤ 5, they loose arrows at an enemy that passes; R near the target
// or with all five down sets them off); G Blut Vene; Shift is Hirenkyaku, and with a lock it is the Schatten: he sinks
// into his shadow and steps out of the target's. F: Quincy: Vollständig (45 s; flight, the flechettes orbiting him):
// LMB flechette volleys, the fourth the composite Heilig Pfeil; RMB Sternenstaub (formed behind a far target); Q the
// Reishi Cage; E Antithesis enhanced (the positions too); R Federzwinger; F Sklaverei; G the Icosahedron Barrier, G again
// its beams. Passive: Auswählen does not touch him.
import * as THREE from 'three';
import { FighterAction, type Fighter, type FighterDef, type PropDef } from '../fighter';
import type { Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import type { AuraStyle } from '../../vfx/aura';
import { uryuProp } from '../../chars/uryu';
import { uryuTybwAsset, uryuTybwProp } from '../../chars/uryuTybw';
import { URYU_TYBW_CHAIN, URYU_TYBW_CLIPS, URYU_TYBW_CLOSE, URYU_TYBW_STANCE, URYU_VOLL_CHAIN, URYU_VOLL_STANCE } from '../../chars/uryuTybwClips';
import { ReishiArrow, hirenkyakuPuff } from '../../vfx/quincy';
import { ANTI_RED, AntithesisLink, CRYSTAL, Federzwinger, FlechetteShot, FlechetteSwarm, HeiligBogen, IcosahedronBarrier, LightPillar, PFEIL_CYAN, PFEIL_LIGHT, ReishiCage, ScherbenChip, ShadowPool, STILL_SILVER, StandspitzeShot, Sternenstaub, VENE_BLUE, eyeCrackle, sklaverei, veneFlash } from '../../vfx/heilig';
import { raycastVoxels } from '../../voxel/raycast';
import { TEX_GLOW, TEX_STREAK } from '../../vfx/sprites';

export const AURA_URYU_TYBW: AuraStyle = { core: '#E6FBFF', body: '#47E2F8', rim: '#14C1F3' };
export const AURA_VOLL: AuraStyle = { core: '#EAFDFF', body: '#8FE9F8', rim: '#1E8FD0' };

const VOLL_TIME = 45;
const VOLL_CD = 20;
/** Antithesis reverses what happened in the last LEDGER_T seconds, up to ANTI_MAX */
const LEDGER_T = 6;
const ANTI_MAX = 260;
const MAX_CHIPS = 5;

const props = (): PropDef[] => [{ key: 'glasses', model: uryuProp('glasses'), socket: 'glasses' }];

export const URYU_TYBW_DEF: FighterDef = {
  id: 'uryu-tybw',
  name: 'Uryū Ishida',
  title: 'Sternritter "A"',
  build: () => ({ asset: uryuTybwAsset('sternritter'), props: props() }),
  stance: URYU_TYBW_STANCE,
  clips: URYU_TYBW_CLIPS,
  aura: AURA_URYU_TYBW,
  hp: 1000,
  rei: 200,
  speed: { run: 10.5, sprint: 28, jump: 13.5, dash: 21, dashTime: 0.1 },
  radius: 0.3,
  height: 1.77,
};

const SPEED_VOLL = { run: 12, sprint: 34, jump: 15, dash: 26, dashTime: 0.09 };

type Form = 'sternritter' | 'voll';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

function aim(f: Fighter, g: Game, out = new THREE.Vector3()): THREE.Vector3 {
  if (f.faceTarget) return out.copy(f.faceTarget);
  if (f === g.player) return g.aimPoint(f, out);
  return f.center(out).addScaledVector(f.forward(_v), 30);
}

// ------------------------------------------------------------------ the strings

type ShotKind = 'bow' | 'close' | 'flech';

class ShotAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  queued = false;

  constructor(readonly kit: UryuTybwKit, readonly clip: string, readonly index: number, readonly kind: ShotKind) {
    super();
    this.name = clip;
    this.mobility = kind === 'close' ? 0.2 : 0.45;
    this.airGravity = 0.12;
  }

  get bow(): boolean {
    return this.kind === 'bow';
  }

  override start(f: Fighter): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    const rapid = this.clip === 'ut_rapid';
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (this.kind === 'bow' && n.startsWith('fire')) this.kit.loose(rapid ? 8 : 11, rapid ? 0.02 : 0.006);
        else if (this.kind === 'close' && n === 'fire') this.kit.pointBlank(this.clip === 'ut_kick' ? 'toe.R' : 'palm.R');
        else if (this.kind === 'flech') {
          if (n === 'merge') this.kit.gather();
          if (n === 'fire') {
            if (this.clip === 'ut_composite') this.kit.composite();
            else this.kit.flechettes(4, this.clip === 'ut_point2' ? 'palm.L' : 'palm.R');
          }
        }
      },
    });
  }

  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.queued && this.t >= this.comboAt) {
      this.done = true;
      this.kit.chain(this.index + 1);
      return;
    }
    if (this.t >= this.dur) this.done = true;
  }

  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' || next instanceof SkillAction ? this.t >= 0.08 : false;
  }
}

abstract class SkillAction extends FighterAction {
  protected dur = 1;
  /** the Heilig Bogen is up for this one */
  readonly bow: boolean = false;
  constructor(readonly kit: UryuTybwKit) {
    super();
  }
  protected playClip(f: Fighter, clip: string, onEvent: (n: string) => void, speed = 1): void {
    const c = f.anim.clip(clip)!;
    this.dur = (c.dur - c.fadeOut * 0.5) / speed;
    f.anim.play(clip, { onEvent, speed });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= this.dur) this.done = true;
  }
}

/** A one-clip skill: the clip plays, its events go to `on`. */
class ClipSkill extends SkillAction {
  override readonly bow: boolean;
  constructor(kit: UryuTybwKit, readonly name: string, readonly clip: string, private on: (n: string) => void, o: { bow?: boolean; armor?: number; mobility?: number; invulnerable?: boolean } = {}) {
    super(kit);
    this.bow = !!o.bow;
    this.armor = o.armor ?? 0;
    this.mobility = o.mobility ?? 0.1;
    this.invulnerable = !!o.invulnerable;
    this.airGravity = 0.06;
  }
  override start(f: Fighter): void {
    this.playClip(f, this.clip, this.on);
  }
  /** another skill may cut in once this one has done its work */
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' ? this.t > this.dur * 0.6 : next instanceof SkillAction && this.t > this.dur * 0.5;
  }
}

/** RMB: the power shot — a long draw, then an arrow that holes whoever and whatever it meets. */
class ChargeAction extends SkillAction {
  readonly name = 'charge';
  override readonly bow = true;
  private drawing = false;
  constructor(kit: UryuTybwKit) {
    super(kit);
    this.mobility = 0.08;
    this.airGravity = 0.08;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ut_charge', (n) => {
      if (n === 'draw') {
        this.drawing = true;
        g.sfx.play('charge', f.center(), 0.6);
      }
      if (n === 'fire') {
        this.drawing = false;
        this.kit.powerShot();
      }
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.drawing) this.kit.nock(Math.min(1, (this.t - 0.12) / 0.5));
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash';
  }
}

/** Q (Sternritter): the instant Licht Regen — no charge, the barrage at once. */
class LichtAction extends SkillAction {
  readonly name = 'licht';
  override readonly bow = true;
  private firing = false;
  private acc = 0;
  private n = 0;
  constructor(kit: UryuTybwKit, readonly target: Fighter | null) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.2;
    this.airGravity = 0.04;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ut_licht', (n) => {
      if (n === 'fire') {
        this.firing = true;
        this.kit.snap();
        g.callout('光の雨', 'LICHT REGEN', PFEIL_LIGHT);
        f.aura.flare(1.3, 0.35);
        g.sfx.play('beam', f.center(), 0.6);
      }
      if (n === 'stop') this.firing = false;
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.firing) return;
    this.acc += dt * 110;
    while (this.acc >= 1) {
      this.acc -= 1;
      this.kit.rainArrow(this.target, this.n++);
    }
    if (this.n % 5 === 0) g.sfx.play('arrow', f.center(), 0.6);
  }
}

/** F (Vollständig): Sklaverei — two seconds drinking the reishi of everything round him. */
class SklavereiAction extends SkillAction {
  readonly name = 'sklaverei';
  private on = false;
  private acc = 0;
  /** time since the world last gave anything up */
  private hungry = 1;
  constructor(kit: UryuTybwKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ut_sklaverei', (n) => {
      if (n !== 'start') return;
      this.on = true;
      g.callout('聖隷', 'SKLAVEREI', CRYSTAL);
      g.sfx.play('charge', f.center(), 1.1);
      f.aura.flare(1.5, 1.5);
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.on || this.t > 2.2) return;
    this.acc += dt;
    this.hungry += dt;
    while (this.acc >= 0.1) {
      this.acc -= 0.1;
      if (sklaverei(g, f, 3, 6) > 0) this.hungry = 0;
    }
    // what he takes heals him; out in the open air there is less to take
    this.kit.drink(dt, this.hungry < 0.35 ? 1 : 0);
  }
}

// ------------------------------------------------------------------ the kit

export class UryuTybwKit implements Kit {
  form: Form = 'sternritter';
  flare = false;
  blut = false;
  vollT = 0;
  vollCd = 0;
  standUsed = false;
  readonly chips: ScherbenChip[] = [];
  readonly bow: HeiligBogen;
  swarm: FlechetteSwarm | null = null;
  barrier: IcosahedronBarrier | null = null;
  /** HP lost lately, for Antithesis */
  readonly ledger: { t: number; amt: number }[] = [];
  comboIndex = 0;
  private chainKind: ShotKind = 'bow';
  private lastEnd = 0;
  private prevHp: number;
  private bowUp = 0;
  private drawHold = 0;
  private wasDashing = false;
  private beating = false;
  private barrierCd = 0;
  readonly cd = { heavy: 0, licht: 0, anti: 0, stand: 0, chip: 0, shadow: 0, stern: 0, cage: 0, feder: 0, sklav: 0, barrier: 0, beams: 0 };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    this.prevHp = f.hp;
    this.setHands();
    this.bow = new HeiligBogen(g, f, () => sock(f, 'bow'), () => sock(f, 'draw'), () => aim(f, g));
    g.addProjectile(this.bow);
    f.onHurt = () => {
      if (this.blut && !f.dead) veneFlash(g, f.center(), 8);
    };
    this.applyStats();
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    this.barrierCd = Math.max(0, this.barrierCd - dt);
    this.vollCd = Math.max(0, this.vollCd - dt);
    // the wound ledger: what he has lost, and when
    if (f.hp < this.prevHp) this.ledger.push({ t: g.time, amt: this.prevHp - f.hp });
    this.prevHp = f.hp;
    while (this.ledger.length && g.time - this.ledger[0].t > LEDGER_T) this.ledger.shift();
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    if (this.blut) {
      f.rei -= dt * 0.8;
      if (f.rei <= 0) this.setBlut(false);
    }
    // the bow: up while he shoots, gone a beat after; the string drawn to the hand, snapped slack on a release
    const a = f.action;
    const bowAct = (a instanceof ShotAction && a.bow) || (a instanceof SkillAction && a.bow);
    if (bowAct) this.bowUp = 0.45;
    this.bowUp -= dt;
    this.drawHold -= dt;
    const want = this.bowUp > 0 && !f.dead && this.form === 'sternritter' ? 1 : 0;
    this.bow.level += (want - this.bow.level) * Math.min(1, dt * (want ? 16 : 6));
    const drawWant = bowAct && this.drawHold <= 0 ? 1 : 0;
    this.bow.draw += (drawWant - this.bow.draw) * Math.min(1, dt * 18);
    // Hirenkyaku: he rides a stream of reishi; with a lock it is the Schatten instead
    const dashing = f.dashT > 0;
    if (dashing && !this.wasDashing) {
      const lock = f === g.player ? g.hud?.lockTarget ?? null : null;
      if (lock && !lock.dead && this.form === 'sternritter' && lock.pos.distanceTo(f.pos) < 45 && this.cd.shadow <= 0) this.shadow(lock);
      else hirenkyakuPuff(g, f.pos);
    }
    if (f.dashT > 0) {
      for (let i = 0; i < 2; i++) g.engine.glow.spawn({ x: f.pos.x + (Math.random() - 0.5) * 0.4, y: f.pos.y + 0.05, z: f.pos.z + (Math.random() - 0.5) * 0.4, vx: -f.dashDir.x * 3, vy: 0.5, vz: -f.dashDir.z * 3, size: 0.16, sizeEnd: 0.03, life: 0.3, r: 0.35, g: 0.85, b: 0.97, alpha: 0.8, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
    }
    this.wasDashing = f.dashT > 0;
    for (let i = this.chips.length - 1; i >= 0; i--) if (this.chips[i].done) this.chips.splice(i, 1);
    if (this.barrier?.done) {
      this.barrier = null;
      this.barrierCd = 8;
    }
    if (this.form === 'voll') this.updateVoll(dt);
    this.applyDefense();
  }

  /** Vollständig: the timer, flight on the wings, their beat */
  private updateVoll(dt: number): void {
    const { f, g } = this;
    this.vollT -= dt;
    f.mounted = !f.dead;
    const t = this.target();
    f.mountVy = f.wishHover ? 8 : f.wishDescend ? -8 : f === g.player ? 0 : t ? Math.max(-4, Math.min(4, (t.pos.y + 2.5 - f.pos.y) * 1.5)) : 0;
    const airborne = !f.grounded;
    if (airborne && !this.beating) {
      this.beating = true;
      f.anim.play('ut_beat', { fadeIn: 0.25 });
    } else if (!airborne && this.beating) {
      this.beating = false;
      for (const a of f.anim.active) if (a.clip.name === 'ut_beat') a.ending = true;
    }
    if (Math.random() < dt * 6) {
      const w = sock(f, 'back');
      g.engine.glow.spawn({ x: w.x + (Math.random() - 0.5) * 2.4, y: w.y + Math.random() * 1.4, z: w.z + (Math.random() - 0.5) * 2.4, vy: 0.4, size: 0.08, sizeEnd: 0.02, life: 0.7, r: 0.75, g: 0.95, b: 1, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
    if (this.vollT <= 0) this.leaveVoll();
  }

  target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 90, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 90);
  }

  private near(range: number): Fighter | null {
    const t = this.target();
    return t && t.pos.distanceTo(this.f.pos) <= range ? t : null;
  }

  private setHands(): void {
    const rig = this.f.visual.rig;
    rig.setBoneVisible('fist.R', true);
    rig.setBoneVisible('fist.L', true);
    rig.setBoneVisible('palm.R', false);
    rig.setBoneVisible('palm.L', false);
  }

  /** what he has lost in the last few seconds */
  woundsLately(): number {
    let s = 0;
    for (const e of this.ledger) if (this.g.time - e.t <= LEDGER_T) s += e.amt;
    return s;
  }

  // ---------------------------------------------------------------- the arrows

  /** the string snaps slack for a moment (a release) */
  snap(): void {
    this.bow.draw = 0;
    this.drawHold = 0.07;
  }

  /** One Heilig Pfeil from the bow at the aim point. */
  loose(damage: number, spread = 0): void {
    const { f, g } = this;
    const from = sock(f, 'bow');
    const dir = aim(f, g).sub(from).normalize();
    if (spread) dir.add(new THREE.Vector3((Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread)).normalize();
    g.addProjectile(new ReishiArrow(f, g, from.addScaledVector(dir, 0.3), dir, { damage, size: 1.15, speed: 120, zeichen: true, color: PFEIL_CYAN }));
    this.snap();
    g.sfx.play('arrow', from, 0.75);
    g.engine.glow.spawn({ x: from.x, y: from.y, z: from.z, size: 0.25, sizeEnd: 0.6, life: 0.08, r: 0.55, g: 0.95, b: 0.98, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
  }

  /** Point-blank: an arrow loosed straight out of the kicking foot or the palm into the target. */
  pointBlank(socket: string): void {
    const { f, g } = this;
    const from = sock(f, socket);
    const t = this.near(4);
    const to = t ? t.center() : aim(f, g);
    const dir = to.sub(from).normalize();
    g.addProjectile(new ReishiArrow(f, g, from.addScaledVector(dir, -0.15), dir, { damage: 18, size: 1.4, burst: 0.6, speed: 110, zeichen: true, color: PFEIL_LIGHT }));
    g.sfx.play('arrow', from, 1);
    g.engine.glow.spawn({ x: from.x, y: from.y, z: from.z, size: 0.5, sizeEnd: 1.1, life: 0.1, r: 0.6, g: 0.95, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  }

  /** RMB: the power shot. */
  powerShot(): void {
    const { f, g } = this;
    const from = sock(f, 'bow');
    const dir = aim(f, g).sub(from).normalize();
    g.addProjectile(new ReishiArrow(f, g, from.addScaledVector(dir, 0.3), dir, { damage: 52, pierce: 0.36, size: 2.4, speed: 140, range: 130, zeichen: true, color: PFEIL_LIGHT }));
    this.snap();
    g.sfx.play('getsuga', from, 0.7);
    f.push.addScaledVector(f.forward(_w), -3);
    g.engine.glow.spawn({ x: from.x, y: from.y, z: from.z, size: 0.6, sizeEnd: 1.5, life: 0.14, r: 0.6, g: 0.95, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  }

  /** the arrow of light swelling between the string hand and the bow */
  nock(k: number): void {
    const { f, g } = this;
    const b = sock(f, 'bow'), d = sock(f, 'draw', _w);
    for (let i = 0; i < 3; i++) {
      const p = _v.lerpVectors(d, b, Math.random());
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.05 + 0.06 * k, sizeEnd: 0.01, life: 0.08, r: 0.55, g: 0.95, b: 0.98, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
  }

  /** One arrow of the instant Licht Regen. */
  rainArrow(target: Fighter | null, i: number): void {
    const { f, g } = this;
    const from = sock(f, 'bow').add(new THREE.Vector3((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5));
    let to: THREE.Vector3;
    if (target && !target.dead) {
      const c = target.center();
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 2.4;
      to = new THREE.Vector3(c.x + Math.cos(a) * r, c.y + (Math.random() - 0.6) * 1.8, c.z + Math.sin(a) * r);
    } else to = aim(f, g).add(new THREE.Vector3((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 5));
    const dir = to.sub(from).normalize();
    const big = i % 4 === 0;
    g.addProjectile(new ReishiArrow(f, g, from, dir, { damage: 6, burst: big ? 0.8 : 0, quiet: i % 4 !== 0, speed: 100 + Math.random() * 30, zeichen: true, color: PFEIL_CYAN }));
  }

  // ---------------------------------------------------------------- Antithesis, the Standspitze, the chips, the shadow

  /** The reversal: the wounds of the last seconds go back to the target, his statuses with them; enhanced, their places too. */
  antithesis(t: Fighter): void {
    const { f, g } = this;
    const lost = Math.min(ANTI_MAX, this.woundsLately());
    if (lost > 1) {
      f.hp = Math.min(f.maxHp, f.hp + lost);
      const away = t.pos.clone().sub(f.pos).setY(0);
      if (away.lengthSq() < 1e-4) away.set(0, 0, 1);
      // the same wound, exactly (his own strength does not scale a reversal), dealt by him
      const k = Math.max(0.05, f.power * (f === g.player ? g.playerPower : 1) * (1 - f.sealK));
      g.damage(t, lost / k, f, away.normalize(), { unblockable: true, heavy: lost > 60, knock: 4, hitstop: 0.12, shake: 0.4, color: ANTI_RED });
    }
    this.ledger.length = 0;
    this.prevHp = f.hp;
    this.handOver(t);
    if (this.form === 'voll' && !t.dead) {
      const a = f.pos.clone(), b = t.pos.clone();
      f.body.pos.copy(b);
      f.body.prev.copy(b);
      t.body.pos.copy(a);
      t.body.prev.copy(a);
      f.body.vel.set(0, 0, 0);
      t.body.vel.set(0, 0, 0);
      f.yaw = Math.atan2(t.pos.x - f.pos.x, t.pos.z - f.pos.z);
    }
    eyeCrackle(g, f);
  }

  /** his statuses handed over to the target */
  private handOver(t: Fighter): void {
    const f = this.f;
    if (f.slowT > 0) [t.slowT, t.slowK, f.slowT, f.slowK] = [Math.max(t.slowT, f.slowT), Math.max(t.slowK, f.slowK), 0, 0];
    if (f.sealT > 0) [t.sealT, t.sealK, f.sealT, f.sealK] = [Math.max(t.sealT, f.sealT), Math.max(t.sealK, f.sealK), 0, 0];
    if (f.agedT > 0) [t.agedT, t.agedK, f.agedT, f.agedK] = [Math.max(t.agedT, f.agedT), Math.max(t.agedK, f.agedK), 0, 0];
    if (f.blindT > 0) [t.blindT, f.blindT] = [Math.max(t.blindT, f.blindT), 0];
    if (f.disarmT > 0) [t.disarmT, f.disarmT] = [Math.max(t.disarmT, f.disarmT), 0];
    if (f.armLockT > 0) [t.armLockT, f.armLockT] = [Math.max(t.armLockT, f.armLockT), 0];
    if (f.scrambleT > 0) [t.scrambleT, t.scrambleA, f.scrambleT] = [Math.max(t.scrambleT, f.scrambleT), f.scrambleA, 0];
    if (f.invertT > 0) [t.invertT, f.invertT] = [Math.max(t.invertT, f.invertT), 0];
    if (f.iffT > 0) [t.iffT, t.iffFrom, f.iffT] = [Math.max(t.iffT, f.iffT), f.iffFrom, 0];
    if (f.wetT > 0) [t.wetT, f.wetT] = [Math.max(t.wetT, f.wetT), 0];
    if (f.heavyB > 0) [t.heavyB, f.heavyB] = [t.heavyB + f.heavyB, 0];
  }

  /** The Still Silver in its body: its power sealed. */
  seal(t: Fighter): void {
    const g = this.g;
    t.sealT = Math.max(t.sealT, 10);
    t.sealK = Math.max(t.sealK, 0.5);
    const c = t.center();
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: Math.cos(a) * 3, vy: (Math.random() - 0.3) * 3, vz: Math.sin(a) * 3, size: 0.09, sizeEnd: 0.02, life: 0.6, r: 0.85, g: 0.87, b: 0.9, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2, drag: 2 });
    }
    g.addRing(t.pos.clone(), 2, STILL_SILVER, 0.4);
    g.callout('銀の鏃', 'STANDSPITZE — POWER SEALED', STILL_SILVER);
    if (t === g.player) g.hud?.showBanner('Your power is sealed');
  }

  /** A Leiden Scherben chip where he aims (a surface within 30 m, or the ground). */
  plantChip(): void {
    const { f, g } = this;
    const o = f.center();
    const to = aim(f, g);
    const d = to.clone().sub(o);
    const len = Math.min(30, d.length());
    d.normalize();
    const hit = raycastVoxels(g.engine.world, o.x, o.y, o.z, d.x, d.y, d.z, len);
    let p: THREE.Vector3, n: THREE.Vector3;
    if (hit) {
      p = o.clone().addScaledVector(d, Math.max(0, hit.dist - 0.03));
      n = new THREE.Vector3(hit.nx, hit.ny, hit.nz);
      if (n.lengthSq() < 0.5) n.set(0, 1, 0);
    } else {
      const q = o.clone().addScaledVector(d, len);
      const down = raycastVoxels(g.engine.world, q.x, q.y, q.z, 0, -1, 0, 30);
      p = down ? q.setY(q.y - down.dist + 0.02) : q;
      n = new THREE.Vector3(0, 1, 0);
    }
    const chip = new ScherbenChip(g, f, p, n);
    this.chips.push(chip);
    g.addProjectile(chip);
    // the chip flies there
    const from = sock(f, 'draw');
    for (let i = 0; i < 6; i++) {
      const k = i / 6, q = _v.lerpVectors(from, p, k);
      g.engine.glow.spawn({ x: q.x, y: q.y, z: q.z, size: 0.08, sizeEnd: 0.02, life: 0.2, r: 0.55, g: 0.95, b: 0.98, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
    }
    if (this.chips.length === 1) g.callout('散霊刻片', 'LEIDEN SCHERBEN', PFEIL_LIGHT);
    g.sfx.play('ting', p, 0.5);
  }

  detonateChips(): void {
    for (const c of this.chips) c.detonate();
    this.chips.length = 0;
  }

  /** Schatten: down into his own shadow, up out of the one behind the target. */
  shadow(t: Fighter): void {
    const { f, g } = this;
    if (!f.spendRei(8)) return;
    this.cd.shadow = 1.2;
    const back = t.forward(_v).multiplyScalar(-2.2);
    const to = t.pos.clone().add(back);
    const gy = raycastVoxels(g.engine.world, to.x, t.pos.y + 1.5, to.z, 0, -1, 0, 6);
    if (gy) to.y = t.pos.y + 1.5 - gy.dist;
    g.addProjectile(new ShadowPool(g, f.pos.clone()));
    g.addProjectile(new ShadowPool(g, to.clone()));
    f.body.pos.copy(to);
    f.body.prev.copy(to);
    f.body.vel.set(0, 0, 0);
    f.dashT = 0;
    f.invuln = Math.max(f.invuln, 0.25);
    f.yaw = Math.atan2(t.pos.x - f.pos.x, t.pos.z - f.pos.z);
    g.sfx.play('shunpo', f.center(), 0.6);
  }

  // ---------------------------------------------------------------- Vollständig

  /** flechettes loosed at the target out of the orbit (a fallback arrow from the palm when the orbit is empty) */
  flechettes(n: number, socket: string): void {
    const { f, g } = this;
    const t = this.target();
    const to = t && t.pos.distanceTo(f.pos) < 80 ? t.center() : aim(f, g);
    const from = this.swarm?.take(n) ?? [];
    if (!from.length) {
      const p = sock(f, socket);
      g.addProjectile(new ReishiArrow(f, g, p, to.clone().sub(p).normalize(), { damage: 10, speed: 120, zeichen: true, color: CRYSTAL }));
    }
    from.forEach((p, i) => g.addProjectile(new FlechetteShot(f, g, p, t, to.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6)), 10, i * 0.035, i > 0)));
    g.sfx.play('arrow', f.center(), 0.9);
  }

  /** the flechettes stream to the space before his hands */
  gather(): void {
    const { f, g } = this;
    const p = f.center().addScaledVector(f.forward(_v), 1.2);
    for (let i = 0; i < 16; i++) {
      const d = _w.set(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).normalize();
      const r = 1.2 + Math.random() * 1.2, life = 0.3;
      const q = p.clone().addScaledVector(d, r);
      g.engine.glow.spawn({ x: q.x, y: q.y, z: q.z, vx: -d.x * r / life, vy: -d.y * r / life, vz: -d.z * r / life, size: 0.12, sizeEnd: 0.05, life, r: 0.56, g: 0.91, b: 0.97, alpha: 0.9, alphaEnd: 0.3, tex: TEX_STREAK, stretch: 3 });
    }
  }

  /** the composite Heilig Pfeil: the flechettes merged into one great arrow that bores clean through buildings */
  composite(): void {
    const { f, g } = this;
    const took = this.swarm?.take(6).length ?? 0;
    const from = f.center().addScaledVector(f.forward(_v), 1.0);
    const t = this.target();
    const to = t && t.pos.distanceTo(f.pos) < 120 ? t.center() : aim(f, g);
    const dir = to.sub(from).normalize();
    const full = took >= 4;
    g.addProjectile(new ReishiArrow(f, g, from, dir, { damage: full ? 72 : 40, pierce: full ? 0.95 : 0.5, size: full ? 3.4 : 2.2, speed: 150, range: 160, zeichen: true, color: CRYSTAL }));
    g.sfx.play('beam', from, 1.1);
    g.shake(f === g.player ? 0.3 : 0.12);
    f.push.addScaledVector(f.forward(_w), -5);
    g.engine.glow.spawn({ x: from.x, y: from.y, z: from.z, size: 1.2, sizeEnd: 2.6, life: 0.16, r: 0.7, g: 0.95, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  }

  /** Sternenstaub: at his palm, or gathered far behind a distant target */
  sternenstaub(): void {
    const { f, g } = this;
    const t = this.target();
    let at: THREE.Vector3, to: THREE.Vector3;
    if (t && t.pos.distanceTo(f.pos) > 20) {
      const away = t.pos.clone().sub(f.pos).setY(0).normalize();
      at = t.center().addScaledVector(away, 12).setY(t.center().y + 2.5);
      to = t.center();
      g.callout('星くず', 'STERNENSTAUB — FROM BEHIND', CRYSTAL);
    } else {
      at = sock(f, 'palm.R').addScaledVector(f.forward(_v), 1.6).setY(f.center().y + 0.6);
      to = t ? t.center() : aim(f, g);
      g.callout('星くず', 'STERNENSTAUB', CRYSTAL);
    }
    g.addProjectile(new Sternenstaub(g, f, at, t, to));
  }

  /** Sklaverei's draught: heal and refill (less when there is little round him to take) */
  drink(dt: number, bites: number): void {
    const f = this.f;
    const k = bites > 0 ? 1 : 0.5;
    f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.18 * k * dt);
    f.rei = Math.min(f.maxRei, f.rei + 40 * k * dt);
    this.prevHp = f.hp;
  }

  becomeVoll(): void {
    const { f, g } = this;
    if (this.form === 'voll') return;
    this.form = 'voll';
    this.vollT = VOLL_TIME;
    this.setBlut(false);
    f.def = { ...f.def, stance: URYU_VOLL_STANCE };
    f.setForm({ asset: uryuTybwAsset('vollstandig'), props: props() }, AURA_VOLL);
    this.setHands();
    this.swarm = new FlechetteSwarm(g, f, () => f.center().add(_w.set(0, 0.15, 0)));
    g.addProjectile(this.swarm);
    f.aura.pillarBurst(2.4);
    f.aura.flare(2, 1);
    g.addRing(f.pos.clone(), 16, CRYSTAL, 0.6);
    g.sfx.play('bankai', f.center());
    g.shake(f === g.player ? 0.5 : 0.2);
    g.slowMo(0.35, 0.4);
    g.callout('滅却師完聖体', 'QUINCY: VOLLSTÄNDIG', CRYSTAL);
    this.applyStats();
  }

  private leaveVoll(): void {
    const { f, g } = this;
    this.form = 'sternritter';
    this.vollT = 0;
    this.vollCd = VOLL_CD;
    if (this.swarm) this.swarm.done = true;
    this.swarm = null;
    if (this.barrier) this.barrier.done = true;
    this.barrier = null;
    f.mounted = false;
    this.beating = false;
    // the wings come apart into light
    const w = sock(f, 'back');
    for (let i = 0; i < 50; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.glow.spawn({ x: w.x + Math.cos(a) * Math.random() * 1.8, y: w.y + Math.random() * 1.6, z: w.z + Math.sin(a) * Math.random() * 1.8, vx: Math.cos(a) * 1.5, vy: 1 + Math.random() * 2, vz: Math.sin(a) * 1.5, size: 0.12, sizeEnd: 0.02, life: 0.9, r: 0.56, g: 0.91, b: 0.97, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW, drag: 1.5 });
    }
    f.def = { ...f.def, stance: URYU_TYBW_STANCE };
    f.setForm({ asset: uryuTybwAsset('sternritter'), props: props() }, AURA_URYU_TYBW);
    this.setHands();
    g.sfx.play('shatter', w, 0.6);
    if (f === g.player) g.hud?.showBanner('The Vollständig fades');
    this.applyStats();
  }

  private setBlut(on: boolean): void {
    const { f, g } = this;
    if (this.blut === on) return;
    this.blut = on;
    if (on) {
      veneFlash(g, f.center(), 26);
      g.callout('静血装', 'BLUT VENE', VENE_BLUE);
      g.sfx.play('flare', f.center(), 0.5);
    }
    this.applyStats();
  }

  /** what reaches him: Blut Vene, the barrier */
  private applyDefense(): void {
    const f = this.f;
    f.damageTaken = (this.blut ? 0.45 : 1) * (this.barrier?.up ? 0.4 : 1);
  }

  private applyStats(): void {
    const f = this.f;
    const voll = this.form === 'voll';
    f.power = (voll ? 2 : 1.2) * (this.flare ? 1.25 : 1);
    f.def = { ...f.def, speed: voll ? { ...SPEED_VOLL } : { ...URYU_TYBW_DEF.speed } };
    f.aura.target = this.flare ? 0.9 : voll ? 0.35 : this.blut ? 0.12 : 0.06;
    this.applyDefense();
  }

  // ---------------------------------------------------------------- input

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof ShotAction) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastEnd > 0.8) this.comboIndex = 0;
    const kind: ShotKind = this.form === 'voll' ? 'flech' : this.near(2.5) ? 'close' : 'bow';
    if (kind !== this.chainKind) this.comboIndex = 0;
    this.chainKind = kind;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const list = this.chainKind === 'flech' ? URYU_VOLL_CHAIN : this.chainKind === 'close' ? URYU_TYBW_CLOSE : URYU_TYBW_CHAIN;
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    this.lastEnd = this.g.time + 0.6;
    this.f.act(new ShotAction(this, list[idx], idx, this.chainKind), true);
  }

  private special(a: SkillAction, cost: number, cdKey: keyof typeof this.cd, cd: number): boolean {
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

  private needTarget(range: number, what: string): Fighter | null {
    const t = this.near(range);
    if (!t && this.f === this.g.player) this.g.hud?.showBanner(`No one in reach for ${what}`);
    return t;
  }

  /** RMB: the power shot; Vollständig: Sternenstaub */
  heavy(): void {
    const f = this.f;
    if (this.form === 'voll') {
      this.special(new ClipSkill(this, 'stern', 'ut_stern', (n) => n === 'form' && this.sternenstaub(), { armor: 0.3, mobility: 0.05 }), 30, 'stern', 7);
      return;
    }
    if (f.busy && !(f.action instanceof ShotAction)) return;
    this.special(new ChargeAction(this), 8, 'heavy', 1.5);
  }

  /** Q: the instant Licht Regen; Vollständig: the Reishi Cage */
  skill1(): void {
    const g = this.g;
    if (this.form === 'voll') {
      const t = this.needTarget(32, 'the Reishi Cage');
      if (!t) return;
      this.special(new ClipSkill(this, 'cage', 'ut_cage', (n) => {
        if (n !== 'cage') return;
        g.addProjectile(new ReishiCage(g, this.f, t));
        g.callout('', 'REISHI CAGE', CRYSTAL);
      }, { mobility: 0.1 }), 30, 'cage', 9);
      return;
    }
    this.special(new LichtAction(this, this.near(70)), 22, 'licht', 8);
  }

  /** E: Antithesis (Vollständig: the positions too) */
  skill2(): void {
    const { f, g } = this;
    const t = this.needTarget(42, 'Antithesis');
    if (!t) return;
    const voll = this.form === 'voll';
    this.special(new ClipSkill(this, 'antithesis', 'ut_antithesis', (n) => {
      if (n !== 'mark') return;
      eyeCrackle(g, f);
      g.addProjectile(new AntithesisLink(g, f, t, () => this.antithesis(t)));
      g.callout('完全反立', voll ? 'ANTITHESIS — POSITIONS' : 'ANTITHESIS', ANTI_RED);
    }, { armor: 0.3, mobility: 0 }), 24, 'anti', voll ? 9 : 12);
  }

  /** R: the Standspitze (once), then Leiden Scherben; Vollständig: Federzwinger */
  skill3(): void {
    const { f, g } = this;
    if (this.form === 'voll') {
      const t = this.needTarget(32, 'Federzwinger');
      if (!t) return;
      this.special(new ClipSkill(this, 'feder', 'ut_feder', (n) => {
        if (n !== 'rain') return;
        g.addProjectile(new Federzwinger(g, f, t));
        g.callout('', 'FEDERZWINGER', CRYSTAL);
      }, { mobility: 0.1 }), 36, 'feder', 14);
      return;
    }
    if (!this.standUsed) {
      this.special(new ClipSkill(this, 'standspitze', 'ut_standspitze', (n) => {
        if (n === 'nock') f.visual.attach('stand', uryuTybwProp('standspitze'), 'draw');
        if (n === 'fire') {
          f.visual.detach('stand');
          this.standUsed = true;
          const from = sock(f, 'bow');
          const dir = aim(f, g).sub(from).normalize();
          g.addProjectile(new StandspitzeShot(f, g, from.addScaledVector(dir, 0.3), dir, (t) => this.seal(t)));
          this.snap();
          g.sfx.play('getsuga', from, 0.6);
        }
      }, { bow: true, mobility: 0.05 }), 12, 'stand', 2);
      return;
    }
    // the chips: set them off when the target is among them (or all five are down), otherwise plant another
    const t = this.target();
    const among = !!t && this.chips.some((c) => c.pos.distanceTo(t.pos) < 4.5);
    if (this.chips.length && (among || this.chips.length >= MAX_CHIPS)) {
      this.special(new ClipSkill(this, 'detonate', 'ut_detonate', (n) => n === 'snap' && this.detonateChips(), { mobility: 0.3 }), 10, 'chip', 0.6);
      return;
    }
    this.special(new ClipSkill(this, 'chip', 'ut_chip', (n) => n === 'throw' && this.plantChip(), { mobility: 0.4 }), 6, 'chip', 0.5);
  }

  /** F: Quincy: Vollständig; inside it, Sklaverei */
  release(): void {
    const { f, g } = this;
    if (this.form === 'voll') {
      this.special(new SklavereiAction(this), 0, 'sklav', 16);
      return;
    }
    if (f.busy) return;
    if (this.vollCd > 0) {
      if (f === g.player) g.hud?.showBanner('Not yet');
      return;
    }
    if (!f.spendRei(60)) {
      if (f === g.player) g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(new ClipSkill(this, 'release', 'ut_release', (n) => {
      if (n === 'pillar') {
        g.addProjectile(new LightPillar(g, f.pos.clone()));
        g.sfx.play('charge', f.center(), 1.2);
        f.aura.flare(1.6, 0.8);
      }
      if (n === 'burst') this.becomeVoll();
    }, { invulnerable: true, mobility: 0 }), true);
  }

  /** G: Blut Vene; Vollständig: the Icosahedron Barrier, and again for its beams */
  toggle(): void {
    const { f, g } = this;
    if (this.form !== 'voll') {
      this.setBlut(!this.blut);
      return;
    }
    if (this.barrier?.up) {
      const t = this.target();
      const bar = this.barrier;
      this.special(new ClipSkill(this, 'beams', 'ut_beams', (n) => n === 'fire' && bar.unfold(t), { mobility: 0 }), 18, 'beams', 1);
      return;
    }
    if (this.barrierCd > 0 || this.barrier) return;
    this.special(new ClipSkill(this, 'barrier', 'ut_barrier', (n) => {
      if (n !== 'raise') return;
      // as the shell gives, its panels open on whoever is in reach
      this.barrier = new IcosahedronBarrier(g, f, 6, 24, 8, () => this.near(40));
      g.addProjectile(this.barrier);
      g.callout('', 'ICOSAHEDRON BARRIER', CRYSTAL);
      g.sfx.play('ting', f.center(), 1);
    }, { mobility: 0.2 }), 24, 'barrier', 0.6);
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

  /** Hirenkyaku away from whoever is on top of him */
  private hop(): void {
    const { f } = this;
    const t = this.target();
    if (!t) return;
    const d = new THREE.Vector3(f.pos.x - t.pos.x, 0, f.pos.z - t.pos.z);
    if (d.lengthSq() < 1e-4) d.set(Math.random() - 0.5, 0, Math.random() - 0.5);
    d.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), (Math.random() - 0.5) * 1.6);
    f.dash(d);
  }

  formName(): string {
    if (this.form === 'voll') return `Quincy: Vollständig · ${Math.max(0, Math.ceil(this.vollT))} s`;
    return this.blut ? 'Sternritter "A" — Blut Vene' : 'Sternritter "A" — The Antithesis';
  }

  ai(): KitAI {
    const voll = () => this.form === 'voll';
    const stern = () => this.form === 'sternritter';
    const f = this.f;
    // reverse it when he has lost a lot lately, or carries something worth handing over
    const reversible = () => this.woundsLately() > 80 || f.sealT > 0 || f.slowT > 0 || f.disarmT > 0 || f.blindT > 0;
    const released = () => {
      const t = this.target();
      return !!t && t.sealT <= 0 && t.power > 1.3;
    };
    return {
      // a kiting sniper: his "chain" is the arrow string, from well out of a sword's reach (and a move from farther)
      reach: 12,
      chain: 3,
      ranged: true,
      releaseAt: [0.6],
      toggleAt: 0.7,
      toggleOn: () => this.blut || !!this.barrier,
      moves: [
        { name: 'hop', use: () => this.hop(), min: 0, max: 3.5, weight: 3, cd: 2.2, when: stern },
        { name: 'kick', use: () => this.attack(), min: 0, max: 2.4, weight: 2, cd: 0.8, when: stern },
        { name: 'shadow', use: () => { const t = this.target(); if (t && this.cd.shadow <= 0) this.shadow(t); }, min: 8, max: 40, weight: 0.5, cd: 9, when: stern },
        { name: 'string', use: () => this.attack(), min: 12, max: 45, weight: 1.4, cd: 0.7 },
        { name: 'charge', use: () => this.heavy(), min: 5, max: 60, weight: 1.5, cd: 3, when: stern },
        { name: 'licht', use: () => this.skill1(), min: 3, max: 45, weight: 2, cd: 8, when: stern },
        { name: 'anti', use: () => this.skill2(), min: 2, max: 40, weight: 9, cd: 4, when: reversible },
        { name: 'stand', use: () => this.skill3(), min: 4, max: 45, weight: 6, cd: 6, when: () => stern() && !this.standUsed && released() },
        { name: 'stand2', use: () => this.skill3(), min: 4, max: 45, weight: 2, cd: 8, when: () => stern() && !this.standUsed },
        { name: 'chip', use: () => this.skill3(), min: 3, max: 25, weight: 0.8, cd: 4, when: () => stern() && this.standUsed },
        { name: 'stern', use: () => this.heavy(), min: 6, max: 80, weight: 1.6, cd: 7, when: voll },
        { name: 'cage', use: () => this.skill1(), min: 3, max: 30, weight: 1.3, cd: 9, when: voll },
        { name: 'feder', use: () => this.skill3(), min: 3, max: 30, weight: 2, cd: 12, when: () => voll() && released() },
        { name: 'feder2', use: () => this.skill3(), min: 3, max: 30, weight: 0.5, cd: 14, when: voll },
        { name: 'sklav', use: () => this.release(), min: 6, max: 90, weight: 4, cd: 16, when: () => voll() && this.f.hp < this.f.maxHp * 0.5 },
        { name: 'beams', use: () => this.toggle(), min: 3, max: 40, weight: 8, cd: 1, when: () => voll() && !!this.barrier?.up && this.barrier.age > 1.5 },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    if (this.form === 'voll')
      return [
        { key: 'LMB', name: 'Flechettes', kanji: '聖羽' },
        { key: 'RMB', name: 'Sternenstaub', kanji: '星くず', cost: 30, cd: cd.stern, cdMax: 7, tint: CRYSTAL },
        { key: 'Q', name: 'Reishi Cage', kanji: '籠', cost: 30, cd: cd.cage, cdMax: 9 },
        { key: 'E', name: 'Antithesis', kanji: '完全反立', cost: 24, cd: cd.anti, cdMax: 9, tint: ANTI_RED },
        { key: 'R', name: 'Federzwinger', kanji: '羽檻', cost: 36, cd: cd.feder, cdMax: 14 },
        { key: 'F', name: 'Sklaverei', kanji: '聖隷', cd: cd.sklav, cdMax: 16, timer: this.vollT / VOLL_TIME, tint: CRYSTAL },
        { key: 'G', name: this.barrier?.up ? 'Barrier beams' : 'Icosahedron', kanji: '二十面', cost: this.barrier?.up ? 18 : 24, cd: this.barrierCd, cdMax: 8, active: !!this.barrier?.up, tint: CRYSTAL },
        { key: 'Shift', name: 'Flight', kanji: '飛翔', cost: 4 },
        { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      ];
    return [
      { key: 'LMB', name: 'Heilig Pfeil', kanji: '神聖滅矢' },
      { key: 'RMB', name: 'Power shot', kanji: '溜', cost: 8, cd: cd.heavy, cdMax: 1.5 },
      { key: 'Q', name: 'Licht Regen', kanji: '光の雨', cost: 22, cd: cd.licht, cdMax: 8 },
      { key: 'E', name: 'Antithesis', kanji: '完全反立', cost: 24, cd: cd.anti, cdMax: 12, tint: ANTI_RED },
      this.standUsed
        ? { key: 'R', name: `Leiden Scherben ${this.chips.length}/${MAX_CHIPS}`, kanji: '散霊刻片', cost: 6, cd: cd.chip, cdMax: 0.6, active: this.chips.length > 0, tint: PFEIL_LIGHT }
        : { key: 'R', name: 'Standspitze', kanji: '銀の鏃', cost: 12, cd: cd.stand, cdMax: 2, tint: STILL_SILVER },
      { key: 'F', name: 'Vollständig', kanji: '完聖体', cost: 60, cd: this.vollCd, cdMax: VOLL_CD, tint: CRYSTAL },
      { key: 'G', name: 'Blut Vene', kanji: '静血装', active: this.blut, tint: VENE_BLUE },
      { key: 'Shift', name: 'Hirenkyaku · Schatten', kanji: '飛廉脚', cost: 4 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
    ];
  }
}

