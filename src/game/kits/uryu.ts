// Uryū's kit (docs/roster/A2-karakura-allies.md §4, loadout U2 — Hueco Mundo, Ginrei Kojaku). A kiting
// archer: LMB looses Heilig Pfeil from the web bow (two single shots, then three in a blur); RMB is the long
// draw, a charged arrow that bores through walls and whoever stands behind them; Q Licht Regen (the charge
// crawls up the bow arm past the shoulder, then a rain of arrows on one target); E Seele Schneider drawn
// from the coat and loosed as a super-arrow; R Sprenger (five Seele Schneider thrown round the target, its
// legs bound, the Gintō poured, the pentagon goes up); G a Gintō flicked at the target, Gritz, the
// pentagonal cross that holds it fast (Gritz then Sprenger is the combination). Shift is Hirenkyaku. F:
// Quincy: Letzt Stil — the wing on the right shoulder drinks the reishi out of the walls round him, every
// arrow bursts, the charged shot goes through everything; when it is over his powers seal themselves.
import * as THREE from 'three';
import { FighterAction, type Fighter, type FighterDef, type PropDef } from '../fighter';
import type { Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { uryuAsset, uryuProp } from '../../chars/uryu';
import { URYU_CHAIN, URYU_CLIPS, URYU_STANCE } from '../../chars/uryuClips';
import { GinreiBow, GintoToss, Gritz, ReishiArrow, SeeleShot, Sprenger, hirenkyakuPuff } from '../../vfx/quincy';
import { raycastVoxels } from '../../voxel/raycast';
import { SphereShape } from '../../destruction/shapes';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from '../../vfx/sprites';
import type { AuraStyle } from '../../vfx/aura';

export const AURA_URYU: AuraStyle = { core: '#E6F8FF', body: '#8FD0FF', rim: '#2B78D0' };
export const AURA_LETZT: AuraStyle = { core: '#EAF5FF', body: '#84B0D4', rim: '#2B78D0' };

const LETZT_TIME = 25;
const SEAL_TIME = 12;

const props = (): PropDef[] => [
  { key: 'glasses', model: uryuProp('glasses'), socket: 'glasses' },
  { key: 'cross', model: uryuProp('cross'), socket: 'wrist.R' },
];

export const URYU_DEF: FighterDef = {
  id: 'uryu',
  name: 'Uryū Ishida',
  title: 'Quincy',
  build: () => ({ asset: uryuAsset('quincy'), props: props() }),
  stance: URYU_STANCE,
  clips: URYU_CLIPS,
  aura: AURA_URYU,
  hp: 900,
  rei: 160,
  speed: { run: 10, sprint: 26, jump: 13, dash: 19, dashTime: 0.1 },
  radius: 0.3,
  height: 1.71,
};

const SPEED_LETZT = { run: 12, sprint: 32, jump: 15, dash: 26, dashTime: 0.09 };

type Form = 'quincy' | 'letzt' | 'sealed';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

function boneAt(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const b = f.visual.rig.bone(name);
  b.updateWorldMatrix(true, false);
  return b.getWorldPosition(out);
}

function aim(f: Fighter, g: Game, out = new THREE.Vector3()): THREE.Vector3 {
  if (f.faceTarget) return out.copy(f.faceTarget);
  if (f === g.player) return g.aimPoint(f, out);
  return f.center(out).addScaledVector(f.forward(_v), 30);
}

// ------------------------------------------------------------------ Heilig Pfeil

class ShotAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  queued = false;

  constructor(readonly kit: UryuKit, readonly clip: string, readonly index: number) {
    super();
    this.name = clip;
    // he walks while he shoots
    this.mobility = 0.45;
    this.airGravity = 0.12;
  }

  override start(f: Fighter): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    const rapid = this.clip === 'uy_rapid';
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n.startsWith('fire')) this.kit.loose(rapid ? 7 : 9, rapid ? 0.025 : 0.008);
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
  /** the web bow is up for this one */
  readonly bow: boolean = false;
  constructor(readonly kit: UryuKit) {
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

/** RMB: the long draw — the string past the ear, the arrow swelling; it bores through walls (Letzt Stil: everything). */
class ChargeAction extends SkillAction {
  readonly name = 'charge';
  override readonly bow = true;
  private drawing = false;
  constructor(kit: UryuKit) {
    super(kit);
    this.mobility = 0.08;
    this.airGravity = 0.08;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'uy_charge', (n) => {
      if (n === 'draw') {
        this.drawing = true;
        g.sfx.play('charge', f.center(), 0.6);
      }
      if (n === 'fire') {
        this.drawing = false;
        this.kit.looseCharged();
      }
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.drawing) this.kit.nock(Math.min(1, (this.t - 0.12) / 0.6), this.kit.form === 'letzt' ? 2 : 1.2);
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash';
  }
}

/** Q: Licht Regen — the charge crawls up the raised bow arm past the shoulder, then the rain of arrows. */
class LichtAction extends SkillAction {
  readonly name = 'licht';
  override readonly bow = true;
  private charging = false;
  private firing = false;
  private acc = 0;
  private n = 0;
  constructor(kit: UryuKit, readonly target: Fighter | null) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.2;
    this.airGravity = 0.04;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'uy_licht', (n) => {
      if (n === 'charge') {
        this.charging = true;
        g.sfx.play('charge', f.center(), 1.1);
      }
      if (n === 'fire') {
        this.charging = false;
        this.firing = true;
        g.callout('光の雨', 'LICHT REGEN', '#8fd0ff');
        f.aura.flare(1.3, 0.4);
      }
      if (n === 'stop') this.firing = false;
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.charging) this.kit.armCharge(Math.min(1, (this.t - 0.15) / 0.75));
    if (!this.firing) return;
    this.acc += dt * (this.kit.form === 'letzt' ? 150 : 115);
    while (this.acc >= 1) {
      this.acc -= 1;
      this.kit.rainArrow(this.target, this.n++);
    }
    if (this.n % 4 === 0) g.sfx.play('arrow', f.center(), 0.6);
  }
}

/** E: Seele Schneider drawn from the coat, nocked on the bow, loosed — the blade itself flies, boring through. */
class SeeleAction extends SkillAction {
  readonly name = 'seele';
  override readonly bow = true;
  private held = false;
  private fired = false;
  constructor(kit: UryuKit) {
    super(kit);
    this.mobility = 0.05;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'uy_seele', (n) => {
      if (n === 'draw') {
        f.visual.attach('seele', uryuProp('seele'), 'grip.R');
        this.held = true;
        g.sfx.play('ting', f.center(), 0.5);
      }
      if (n === 'fire') this.fire(f, g);
    });
  }
  private fire(f: Fighter, g: Game): void {
    if (this.fired) return;
    this.fired = true;
    if (this.held) f.visual.detach('seele');
    this.held = false;
    const from = sock(f, 'bow');
    const dir = aim(f, g).sub(from).normalize();
    g.addProjectile(new SeeleShot(f, g, from.addScaledVector(dir, 0.4), dir, this.kit.form === 'letzt' ? 110 : 70));
    g.callout('魂を切り裂くもの', 'SEELE SCHNEIDER', '#9fe6ff');
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.held && this.t > 0.42) this.kit.nock(Math.min(1, (this.t - 0.42) / 0.24), 1);
  }
  override end(f: Fighter): void {
    if (this.held) f.visual.detach('seele');
    this.held = false;
  }
}

/** R: Sprenger — five Seele Schneider flung round the target one after another, then the Gintō poured. */
class SprengerAction extends SkillAction {
  readonly name = 'sprenger';
  private spr: Sprenger;
  private poured = false;
  constructor(kit: UryuKit, target: Fighter) {
    super(kit);
    this.mobility = 0.1;
    this.armor = 0.15;
    this.spr = new Sprenger(kit.g, kit.f, target, 3.2, kit.form === 'letzt' ? 210 : 150);
  }
  override start(f: Fighter, g: Game): void {
    g.addProjectile(this.spr);
    this.playClip(f, 'uy_sprenger', (n) => {
      if (n.startsWith('throw')) this.spr.throwNext(sock(f, 'draw'));
      if (n === 'pour') {
        this.poured = true;
        this.spr.pour();
        g.callout('破芒陣', 'SPRENGER', '#f2edb1');
      }
    });
  }
  override end(): void {
    if (!this.poured) this.spr.fizzle();
  }
}

/** G: a Gintō flicked at the target — Gritz, the man-sized pentagonal cross that wraps it. */
class GintoAction extends SkillAction {
  readonly name = 'ginto';
  constructor(kit: UryuKit, readonly target: Fighter) {
    super(kit);
    this.mobility = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'uy_ginto', (n) => {
      if (n !== 'throw') return;
      const tgt = this.target;
      g.sfx.play('swing', f.center(), 0.5);
      g.addProjectile(new GintoToss(sock(f, 'draw'), tgt, () => {
        // a Hirenkyaku / Shunpo out of the way at the last instant beats it
        if (tgt.invuln > 0 || tgt.action?.invulnerable) {
          g.sparks(tgt.center(), new THREE.Vector3(0, 1, 0), '#8FE3FF', 8);
          return;
        }
        const gr = new Gritz(g, f, tgt, this.kit.form === 'letzt' ? 2.4 : 1.8);
        this.kit.gritz = gr;
        g.addProjectile(gr);
        g.callout('五架縛', 'GINTŌ — GRITZ', '#8fe3ff');
      }));
    });
  }
}

/** F: Quincy: Letzt Stil — the glove torn away, the reishi floods in past his limit. */
class LetztAction extends SkillAction {
  readonly name = 'release';
  constructor(kit: UryuKit) {
    super(kit);
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'uy_letzt', (n) => {
      if (n === 'tear') {
        // the glove dissolves off the right hand in white threads
        const p = sock(f, 'draw');
        for (let i = 0; i < 24; i++) {
          const a = Math.random() * Math.PI * 2;
          g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * 3, vy: 1 + Math.random() * 3, vz: Math.sin(a) * 3, size: 0.06, sizeEnd: 0.01, life: 0.5, r: 0.95, g: 0.97, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2, drag: 2 });
        }
        g.sfx.play('crack', p, 0.6);
      }
      if (n === 'burst') this.kit.becomeLetzt();
    });
    g.sfx.play('charge', f.center(), 1);
    f.aura.flare(1.2, 0.8);
  }
}

// ------------------------------------------------------------------ the kit

export class UryuKit implements Kit {
  form: Form = 'quincy';
  flare = false;
  comboIndex = 0;
  letztT = 0;
  sealT = 0;
  /** the Gritz currently holding someone (Sprenger's partner) */
  gritz: Gritz | null = null;
  readonly bow: GinreiBow;
  private lastEnd = 0;
  private bowUp = 0;
  private wasDashing = false;
  private drinkT = 0;
  private cd = { heavy: 0, licht: 0, seele: 0, sprenger: 0, ginto: 0 };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    this.setHands();
    this.bow = new GinreiBow(g, f, () => sock(f, 'bow'));
    g.addProjectile(this.bow);
    this.applyStats();
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    if (this.gritz?.done) this.gritz = null;
    // the web bow: up while he shoots, gone a beat after
    const a = f.action;
    if (a instanceof ShotAction || (a instanceof SkillAction && a.bow)) this.bowUp = 0.45;
    this.bowUp -= dt;
    const want = this.bowUp > 0 && !f.dead ? 1 : 0;
    this.bow.level += (want - this.bow.level) * Math.min(1, dt * (want ? 16 : 6));
    // Hirenkyaku: he rides a stream of reishi
    const dashing = f.dashT > 0;
    if (dashing) {
      if (!this.wasDashing) hirenkyakuPuff(g, f.pos);
      for (let i = 0; i < 2; i++) g.engine.glow.spawn({ x: f.pos.x + (Math.random() - 0.5) * 0.4, y: f.pos.y + 0.05, z: f.pos.z + (Math.random() - 0.5) * 0.4, vx: -f.dashDir.x * 3, vy: 0.5, vz: -f.dashDir.z * 3, size: 0.16, sizeEnd: 0.03, life: 0.3, r: 0.56, g: 0.82, b: 1, alpha: 0.8, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
    }
    this.wasDashing = dashing;
    if (this.form === 'letzt') {
      this.letztT -= dt;
      this.wingFlame();
      this.drinkT -= dt;
      if (this.drinkT <= 0) {
        this.drinkT = 0.14;
        this.drink(1, 0.45);
      }
      if (this.letztT <= 0) this.endLetzt();
    } else if (this.form === 'sealed') {
      this.sealT -= dt;
      if (this.sealT <= 0) this.unseal();
    }
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

  // ---------------------------------------------------------------- the arrows

  /** One Heilig Pfeil from the bow at the aim point. */
  loose(damage: number, spread = 0): void {
    const { f, g } = this;
    const from = sock(f, 'bow');
    const dir = aim(f, g).sub(from).normalize();
    if (spread) dir.add(new THREE.Vector3((Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread)).normalize();
    const letzt = this.form === 'letzt';
    g.addProjectile(new ReishiArrow(f, g, from.addScaledVector(dir, 0.25), dir, { damage: letzt ? damage * 1.6 : damage, burst: letzt ? 1.3 : 0, size: letzt ? 1.6 : 1, color: letzt ? '#8FD0FF' : '#59B7EE' }));
    g.sfx.play('arrow', from, letzt ? 1.1 : 0.7);
    g.engine.glow.spawn({ x: from.x, y: from.y, z: from.z, size: 0.25, sizeEnd: 0.6, life: 0.08, r: 0.7, g: 0.92, b: 1, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
  }

  /** The charged arrow. */
  looseCharged(): void {
    const { f, g } = this;
    const from = sock(f, 'bow');
    const dir = aim(f, g).sub(from).normalize();
    const letzt = this.form === 'letzt';
    g.addProjectile(new ReishiArrow(f, g, from.addScaledVector(dir, 0.3), dir, letzt
      ? { damage: 150, pierce: 0.9, size: 4, speed: 140, range: 170, color: '#8FD0FF' }
      : { damage: 44, pierce: 0.32, size: 2.2, speed: 130, range: 120 }));
    g.sfx.play(letzt ? 'beam' : 'getsuga', from, letzt ? 1.2 : 0.7);
    f.push.addScaledVector(f.forward(_w), letzt ? -7 : -3);
    g.engine.glow.spawn({ x: from.x, y: from.y, z: from.z, size: letzt ? 1.2 : 0.5, sizeEnd: letzt ? 3 : 1.4, life: 0.14, r: 0.75, g: 0.94, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    if (letzt) {
      g.shake(f === g.player ? 0.4 : 0.15);
      g.hitstop(0.05);
    }
  }

  /** One arrow of the Licht Regen: at the target, scattered round it. */
  rainArrow(target: Fighter | null, i: number): void {
    const { f, g } = this;
    const from = sock(f, 'bow').add(new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4));
    let to: THREE.Vector3;
    if (target && !target.dead) {
      const c = target.center();
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 2.6;
      to = new THREE.Vector3(c.x + Math.cos(a) * r, c.y + (Math.random() - 0.6) * 1.8, c.z + Math.sin(a) * r);
    } else {
      to = aim(f, g).add(new THREE.Vector3((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 5));
    }
    const dir = to.sub(from).normalize();
    const letzt = this.form === 'letzt';
    const big = i % (letzt ? 2 : 4) === 0;
    g.addProjectile(new ReishiArrow(f, g, from, dir, { damage: 6, burst: big ? (letzt ? 1.3 : 0.7) : 0, quiet: i % 4 !== 0, speed: 95 + Math.random() * 30, size: letzt ? 1.4 : 1, color: letzt ? '#8FD0FF' : '#59B7EE' }));
  }

  /** The arrow of light drawn between the string hand and the bow, swelling with k. */
  nock(k: number, scale = 1): void {
    const { f, g } = this;
    const b = sock(f, 'bow'), d = sock(f, 'draw', _w);
    for (let i = 0; i < 3; i++) {
      const p = _v.lerpVectors(d, b, Math.random());
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: (0.04 + 0.05 * k) * scale, sizeEnd: 0.01, life: 0.08, r: 0.6, g: 0.88, b: 1, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
    g.engine.glow.spawn({ x: b.x, y: b.y, z: b.z, size: (0.12 + 0.3 * k) * scale, sizeEnd: 0.04, life: 0.07, r: 0.7, g: 0.92, b: 1, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
  }

  /** Licht Regen's charge: blue light crawling up the bow arm and past the shoulder like a flame. */
  armCharge(k: number): void {
    const { f, g } = this;
    const b = sock(f, 'bow');
    const sh = boneAt(f, 'upperarm.L');
    const top = sh.clone().add(new THREE.Vector3(0, 0.45 + k * 0.7, 0)).addScaledVector(f.forward(_w), -0.15);
    const p = new THREE.Vector3();
    for (let i = 0; i < 6; i++) {
      const u = Math.random() * k * 2;
      if (u < 1) p.lerpVectors(b, sh, u);
      else p.lerpVectors(sh, top, u - 1);
      p.x += (Math.random() - 0.5) * 0.14;
      p.y += (Math.random() - 0.5) * 0.14;
      p.z += (Math.random() - 0.5) * 0.14;
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vy: 1.2, size: 0.1 + 0.08 * k, sizeEnd: 0.02, life: 0.22, r: 0.55, g: 0.82, b: 1, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
    if (k > 0.5) g.engine.glow.spawn({ x: top.x + (Math.random() - 0.5) * 0.3, y: top.y, z: top.z + (Math.random() - 0.5) * 0.3, vx: (Math.random() - 0.5), vy: 3 + Math.random() * 3, vz: (Math.random() - 0.5), size: 0.2, sizeEnd: 0.05, life: 0.3, r: 0.6, g: 0.86, b: 1, alpha: 0.8, alphaEnd: 0, tex: TEX_STREAK, stretch: 2.5 });
  }

  // ---------------------------------------------------------------- Letzt Stil

  /** The wing burns: blue tongues licking up off the right shoulder. */
  private wingFlame(): void {
    const { f, g } = this;
    const w = sock(f, 'wing');
    for (let i = 0; i < 2; i++) g.engine.glow.spawn({ x: w.x + (Math.random() - 0.5) * 0.25, y: w.y + Math.random() * 0.5, z: w.z + (Math.random() - 0.5) * 0.25, vx: (Math.random() - 0.5) * 0.6, vy: 1.6 + Math.random() * 2, vz: (Math.random() - 0.5) * 0.6, size: 0.22, sizeEnd: 0.04, life: 0.45, r: 0.62, g: 0.84, b: 1, alpha: 0.6, alphaEnd: 0, tex: TEX_PUFF });
  }

  /**
   * Total reishi dominance: the walls round him come apart into reishi that streams into the wing. n rays
   * out from him; whatever they meet within 16 m is eaten (no rubble — it is dissolved).
   */
  drink(n: number, r: number): void {
    const { f, g } = this;
    const w = sock(f, 'wing');
    const o = f.center();
    for (let i = 0; i < n; i++) {
      const az = Math.random() * Math.PI * 2, el = 0.03 + Math.random() * 0.6;
      const d = new THREE.Vector3(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el));
      const hit = raycastVoxels(g.engine.world, o.x, o.y, o.z, d.x, d.y, d.z, 16);
      if (!hit || hit.dist < 3) continue;
      const p = o.clone().addScaledVector(d, hit.dist + 0.1);
      g.engine.destruction.carve(new SphereShape(p, r, 0.8), { mode: 'erase', power: 500, dust: 0 });
      for (let k = 0; k < 7; k++) {
        const q = p.clone().add(new THREE.Vector3((Math.random() - 0.5) * r, (Math.random() - 0.5) * r, (Math.random() - 0.5) * r));
        const life = 0.4 + Math.random() * 0.25;
        g.engine.glow.spawn({ x: q.x, y: q.y, z: q.z, vx: (w.x - q.x) / life, vy: (w.y - q.y) / life, vz: (w.z - q.z) / life, size: 0.14, sizeEnd: 0.05, life, r: 0.6, g: 0.86, b: 1, alpha: 0.95, alphaEnd: 0.2, tex: TEX_STREAK, stretch: 2 });
      }
    }
  }

  becomeLetzt(): void {
    const { f, g } = this;
    if (this.form !== 'quincy') return;
    this.form = 'letzt';
    this.letztT = LETZT_TIME;
    f.setForm({ asset: uryuAsset('letzt'), props: props() }, AURA_LETZT);
    this.setHands();
    this.bow.radius = 0.95;
    f.aura.pillarBurst(2.2);
    f.aura.flare(2, 1);
    g.addRing(f.pos.clone(), 14, '#8FD0FF', 0.6);
    g.sfx.play('bankai', f.center());
    g.shake(f === g.player ? 0.5 : 0.2);
    g.slowMo(0.35, 0.4);
    g.engine.gr.chroma.offset.set(0.004, 0.004);
    this.drink(28, 0.7);
    g.callout('滅却師最終形態', 'QUINCY: LETZT STIL', '#eaf5ff');
    this.applyStats();
  }

  /** It is over: back in the uniform, and every Quincy power sealed for a while. */
  private endLetzt(): void {
    const { f, g } = this;
    this.form = 'sealed';
    this.sealT = SEAL_TIME;
    this.letztT = 0;
    f.setForm({ asset: uryuAsset('quincy'), props: props() }, AURA_URYU);
    this.setHands();
    this.bow.radius = 0.62;
    // the wing comes apart
    const w = sock(f, 'wing');
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.glow.spawn({ x: w.x, y: w.y + Math.random() * 0.6, z: w.z, vx: Math.cos(a) * 2, vy: 1 + Math.random() * 3, vz: Math.sin(a) * 2, size: 0.16, sizeEnd: 0.02, life: 0.9, r: 0.6, g: 0.84, b: 1, alpha: 0.8, alphaEnd: 0, tex: TEX_PUFF, drag: 1.5 });
    }
    g.sfx.play('shatter', w, 0.7);
    g.callout('封印', 'QUINCY POWERS SEALED', '#9fb0c8');
    this.applyStats();
  }

  private unseal(): void {
    const { f, g } = this;
    this.form = 'quincy';
    this.sealT = 0;
    f.aura.flare(1, 0.4);
    g.sfx.play('flare', f.center(), 0.6);
    if (f === g.player) g.hud?.showBanner('Quincy powers restored');
    this.applyStats();
  }

  private applyStats(): void {
    const f = this.f;
    const letzt = this.form === 'letzt', sealed = this.form === 'sealed';
    f.power = (letzt ? 1.5 : sealed ? 0.45 : 1) * (this.flare ? 1.25 : 1);
    // slight of build: he takes hits badly
    f.damageTaken = letzt ? 0.85 : 1.05;
    f.toughness = letzt ? 6 : 0;
    f.def = { ...f.def, speed: letzt ? { ...SPEED_LETZT } : { ...URYU_DEF.speed } };
    f.aura.target = this.flare ? 0.9 : letzt ? 0.6 : sealed ? 0 : 0.07;
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
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const idx = i % URYU_CHAIN.length;
    this.comboIndex = idx + 1;
    this.lastEnd = this.g.time + 0.6;
    this.f.act(new ShotAction(this, URYU_CHAIN[idx], idx), true);
  }

  private sealed(): boolean {
    if (this.form !== 'sealed') return false;
    if (this.f === this.g.player) this.g.hud?.showBanner('Quincy powers sealed');
    return true;
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

  /** RMB: the charged arrow. */
  heavy(): void {
    const f = this.f;
    if (f.busy && !(f.action instanceof ShotAction)) return;
    if (this.sealed()) return;
    this.special(new ChargeAction(this), this.form === 'letzt' ? 14 : 8, 'heavy', this.form === 'letzt' ? 2.4 : 1.6);
  }

  /** Q: Licht Regen. */
  skill1(): void {
    if (this.sealed()) return;
    this.special(new LichtAction(this, this.near(70)), 30, 'licht', 9);
  }

  /** E: Seele Schneider, loosed from the bow. */
  skill2(): void {
    if (this.sealed()) return;
    this.special(new SeeleAction(this), 18, 'seele', 6);
  }

  /** R: Sprenger round the target. */
  skill3(): void {
    if (this.sealed()) return;
    const t = this.near(28);
    if (!t) {
      if (this.f === this.g.player) this.g.hud?.showBanner('No one in reach for Sprenger');
      return;
    }
    this.special(new SprengerAction(this, t), 34, 'sprenger', 13);
  }

  /** G: Gintō — Gritz. Gintō hold their own reiryoku: it works even with his powers sealed. */
  toggle(): void {
    const t = this.near(22);
    if (!t) {
      if (this.f === this.g.player) this.g.hud?.showBanner('No one in reach for the Gintō');
      return;
    }
    this.special(new GintoAction(this, t), 12, 'ginto', 9);
  }

  /** F: Quincy: Letzt Stil. */
  release(): void {
    const f = this.f;
    if (this.form !== 'quincy' || f.busy) {
      if (this.form === 'sealed') this.sealed();
      return;
    }
    if (!f.spendRei(50)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(new LetztAction(this), true);
  }

  toggleFlare(): void {
    if (!this.flare && this.sealed()) return;
    this.flare = !this.flare;
    this.applyStats();
    if (this.flare) {
      this.f.aura.flare(1.6, 0.4);
      this.g.shake(0.2);
      this.g.sfx.play('flare', this.f.center());
    }
  }

  /** Hirenkyaku away from whoever is on top of him. */
  private hop(): void {
    const { f } = this;
    const t = this.target();
    if (!t) return;
    const d = new THREE.Vector3(f.pos.x - t.pos.x, 0, f.pos.z - t.pos.z);
    if (d.lengthSq() < 1e-4) d.set(Math.random() - 0.5, 0, Math.random() - 0.5);
    d.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), (Math.random() - 0.5) * 1.6);
    f.dash(d);
  }

  private holding(): boolean {
    return !!this.gritz && !this.gritz.done;
  }

  formName(): string {
    if (this.form === 'letzt') return `Quincy: Letzt Stil · ${Math.max(0, Math.ceil(this.letztT))} s`;
    if (this.form === 'sealed') return `Powers sealed · ${Math.max(0, Math.ceil(this.sealT))} s`;
    return 'Quincy — Ginrei Kojaku';
  }

  ai(): KitAI {
    const armed = () => this.form !== 'sealed';
    return {
      // a sniper: his "chain" is the arrow string, fired from well out of a sword's reach
      reach: 14,
      chain: 3,
      ranged: true,
      releaseAt: [0.5],
      moves: [
        { name: 'hop', use: () => this.hop(), min: 0, max: 3.5, weight: 3, cd: 2.4 },
        { name: 'charge', use: () => this.heavy(), min: 5, max: 60, weight: 1.6, cd: 3, when: armed },
        { name: 'licht', use: () => this.skill1(), min: 5, max: 45, weight: 1.3, cd: 9, when: armed },
        { name: 'seele', use: () => this.skill2(), min: 4, max: 60, weight: 1.2, cd: 7, when: armed },
        { name: 'gritz', use: () => this.toggle(), min: 3, max: 18, weight: 1.5, cd: 8, when: () => !this.holding() },
        { name: 'sprenger', use: () => this.skill3(), min: 3, max: 26, weight: 12, cd: 1, when: () => armed() && this.holding() },
        { name: 'sprenger2', use: () => this.skill3(), min: 4, max: 20, weight: 0.3, cd: 12, when: armed },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const fm = this.form, cd = this.cd;
    const off = fm === 'sealed';
    const list: AbilityInfo[] = [
      { key: 'LMB', name: 'Heilig Pfeil', kanji: '神聖滅矢' },
      { key: 'RMB', name: fm === 'letzt' ? 'Letzt Stil arrow' : 'Charged arrow', kanji: '溜', cost: fm === 'letzt' ? 14 : 8, cd: off ? this.sealT : cd.heavy, cdMax: off ? SEAL_TIME : fm === 'letzt' ? 2.4 : 1.6 },
      { key: 'Q', name: 'Licht Regen', kanji: '光の雨', cost: 30, cd: off ? this.sealT : cd.licht, cdMax: off ? SEAL_TIME : 9 },
      { key: 'E', name: 'Seele Schneider', kanji: '魂裂', cost: 18, cd: off ? this.sealT : cd.seele, cdMax: off ? SEAL_TIME : 6 },
      { key: 'R', name: 'Sprenger', kanji: '破芒陣', cost: 34, cd: off ? this.sealT : cd.sprenger, cdMax: off ? SEAL_TIME : 13 },
      { key: 'G', name: 'Gintō · Gritz', kanji: '五架縛', cost: 12, cd: cd.ginto, cdMax: 9, active: this.holding(), tint: '#8fe3ff' },
      { key: 'Shift', name: 'Hirenkyaku', kanji: '飛廉脚', cost: 4 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
    ];
    if (fm === 'letzt') list.push({ key: 'F', name: 'Letzt Stil', kanji: '最終', active: true, timer: this.letztT / LETZT_TIME, tint: '#8fd0ff' });
    else if (off) list.push({ key: 'F', name: 'Sealed', kanji: '封印', cd: this.sealT, cdMax: SEAL_TIME });
    else list.push({ key: 'F', name: 'Letzt Stil', kanji: '最終', cost: 50, tint: '#8fd0ff' });
    return list;
  }
}
