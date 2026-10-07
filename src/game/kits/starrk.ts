// Coyote Starrk's kit (docs/roster/E1-espada-1.md, Kit proposal). Sealed, the Primera Espada: lazy,
// economical katana cuts; RMB a Cero with no wind-up out of the open left hand; Q the same out of his chest
// (the hole), point-blank and much bigger; E Sonído — gone with no shimmer, afterimages left standing to
// draw the attack, and there behind the target; R sends Lilynette in (kick, horn, scimitar, or her green
// Cero from further off); G the left glove comes off: the "1", and he stops pretending. F: "Kechirase,
// Los Lobos" — his hand on Lilynette's head, she comes apart into the pistols and his eyepiece, and his
// wounds close. LMB gun-kata (right gun heavy, left gun quick, the pistol-whip); RMB the charged right-hand
// Cero; Q Cero Metralleta (a ring of charge points round the barrel firing until the shots fuse into one
// beam he steers); E the left gun sprayed in a fan of small Ceros; R the wolves pour out of the
// bandoleers; G Colmillo, the reishi sword drawn out of the bandoleer on his arm (and back to the gun);
// F Lilynette: for a while the guns fire on their own.
import * as THREE from 'three';
import { FighterAction, type Fighter, type FighterDef } from '../fighter';
import type { Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { KATANA_TIP_Z, MUZZLE_L, MUZZLE_R, starrkAsset, starrkProp, type StarrkForm } from '../../chars/starrk';
import { COLMILLO_STANCE, LOBOS_CHAIN, LOBOS_STANCE, STARRK_CHAIN, STARRK_CLIPS, STARRK_STANCE } from '../../chars/starrkClips';
import { CeroBeam } from '../projectiles/cero';
import { CeroShot, CeroVolley, MetralletaRing, STARRK_CERO, WolfPack } from '../../vfx/lobos';
import { Lilynette } from './lilynette';
import { groundAt } from '../../vfx/iceArts';
import { TEX_GLOW } from '../../vfx/sprites';
import type { AuraStyle } from '../../vfx/aura';

export const AURA_STARRK: AuraStyle = { core: '#E6F4FF', body: '#6DB6FF', rim: '#2F7DEB' };

type BladeDef = NonNullable<FighterDef['blade']>;
const BLADE_KATANA: BladeDef = { prop: 'sword', base: [0, 0, 0.13], tip: [0, 0.03, KATANA_TIP_Z], color: '#9FD0FF', core: '#E6F4FF' };
/** the pistol-whip: the right barrel is the "blade" */
const BLADE_GUN: BladeDef = { prop: 'gunR', base: [0, -0.1, 0.075], tip: [0, -0.38, 0.075], color: '#9FD0FF', core: '#E6F4FF' };

const SPEED = { run: 10, sprint: 33, jump: 14, dash: 30, dashTime: 0.09 };
const CERO = { core: STARRK_CERO.core, body: STARRK_CERO.body, rim: STARRK_CERO.rim };

function sealedProps(): { key: string; model: ReturnType<typeof starrkProp>; socket: string }[] {
  return [
    { key: 'sword', model: starrkProp('katana'), socket: 'grip.R' },
    { key: 'sheath', model: starrkProp('sheath-empty'), socket: 'hip.L' },
  ];
}

export const STARRK_DEF: FighterDef = {
  id: 'starrk',
  name: 'Coyote Starrk',
  title: 'Primera Espada',
  build: () => ({ asset: starrkAsset('sealed'), props: sealedProps() }),
  stance: STARRK_STANCE,
  clips: STARRK_CLIPS,
  aura: AURA_STARRK,
  blade: BLADE_KATANA,
  hp: 1200,
  rei: 200,
  speed: { ...SPEED },
  radius: 0.4,
  height: 1.87,
};

type Form = 'sealed' | 'lobos';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

/** Light cuts (the katana, or Colmillo): the window at 'hit', 'combo' to chain. */
class CutAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private hitAt = -1;
  queued = false;
  constructor(readonly kit: StarrkKit, readonly clip: string, readonly index: number, readonly last: boolean) {
    super();
    this.name = clip;
    this.mobility = 0.2;
    this.airGravity = 0.15;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    this.hitAt = c.events.hit ?? -1;
    const heavy = this.clip === 'st_heavy';
    f.bladeHits.clear();
    const col = this.kit.colmillo;
    f.bladeSpec = { damage: (heavy ? 36 : 16) * (col ? 1.15 : 1), knock: heavy ? 16 : 6, launch: this.last ? 4 : 0, heavy, hitstop: heavy ? 0.1 : 0.04, shake: heavy ? 0.35 : 0.12, cut: heavy ? 460 : 230 };
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n !== 'step') return;
        const tgt = f.faceTarget;
        const extra = tgt ? Math.min(5, Math.max(0, f.pos.distanceTo(tgt) - 1.5)) : 0;
        f.push.addScaledVector(f.forward(), (heavy ? 9 : 7) + extra * 3.4);
        g.sfx.play(heavy ? 'swingHeavy' : 'swing', f.center(), 0.7);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    f.bladeActive = this.hitAt >= 0 && t >= this.hitAt - 0.05 && t <= this.hitAt + 0.1;
    if (f.trail) f.trail.emitting = this.hitAt >= 0 && t >= this.hitAt - 0.08 && t <= this.hitAt + 0.1;
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
    if (next.name === 'dash' || next instanceof SkillAction) return this.t >= this.hitAt + 0.03;
    return false;
  }
}

/** Gun-kata: shots out of either pistol at their events, the pistol-whip at 'hit'. */
class GunAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private hitAt = -1;
  queued = false;
  constructor(readonly kit: StarrkKit, readonly clip: string, readonly index: number, readonly last: boolean) {
    super();
    this.name = clip;
    this.mobility = 0.35;
    this.airGravity = 0.15;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    this.hitAt = c.events.hit ?? -1;
    f.bladeHits.clear();
    f.bladeSpec = { damage: 18, knock: 12, launch: this.last ? 4 : 1, hitstop: 0.06, shake: 0.2, cut: 120 };
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n === 'fireR') this.kit.shoot('R', this.last);
        if (n === 'fireL') this.kit.shoot('L', this.last);
        if (n === 'step') {
          f.push.addScaledVector(f.forward(), 8);
          g.sfx.play('swing', f.center(), 0.7);
        }
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    f.bladeActive = this.hitAt >= 0 && t >= this.hitAt - 0.05 && t <= this.hitAt + 0.08;
    if (this.queued && t >= this.comboAt) {
      this.done = true;
      this.kit.chain(this.index + 1);
      return;
    }
    if (t >= this.dur) this.done = true;
  }
  override end(f: Fighter): void {
    f.bladeActive = false;
  }
  override canCancel(next: FighterAction): boolean {
    if (next.name === 'dash' || next instanceof SkillAction) return this.t >= Math.min(this.comboAt, 0.14);
    return false;
  }
}

abstract class SkillAction extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: StarrkKit) {
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
  override end(f: Fighter): void {
    f.bladeActive = false;
    if (f.trail) f.trail.emitting = false;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t > this.dur * 0.5;
  }
}

/** RMB (sealed): Cero, no pose, no charge — out of the open left hand. */
class CeroHandAction extends SkillAction {
  readonly name = 'cero';
  constructor(kit: StarrkKit) {
    super(kit);
    this.mobility = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'st_cero', (n) => {
      if (n !== 'fire') return;
      const emitter = f.visual.rig.sockets.get('palm.L')!;
      g.addProjectile(new CeroBeam(g, f, emitter, () => this.kit.aim(), { charge: 0.03, fire: 0.36, radius: 0.42, damage: 80 * this.kit.serious(), power: 320, ...CERO, range: 90, track: 1.6, gain: 1.2 }));
      g.sfx.play('beam', f.center(), 0.8);
    });
  }
}

/** Q (sealed): the same Cero out of his chest, bigger, with nothing but a breath. */
class CeroChestAction extends SkillAction {
  readonly name = 'cero-chest';
  constructor(kit: StarrkKit) {
    super(kit);
    this.mobility = 0.1;
    this.armor = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'st_cero_chest', (n) => {
      if (n !== 'fire') return;
      const emitter = f.visual.rig.sockets.get('hole')!;
      g.addProjectile(new CeroBeam(g, f, emitter, () => this.kit.aim(), { charge: 0.05, fire: 0.55, radius: 0.85, damage: 112 * this.kit.serious(), power: 640, ...CERO, range: 110, track: 0.9, gain: 1.15 }));
      g.callout('虚閃', 'CERO', '#9fd0ff');
      g.sfx.play('beam', f.center(), 1.2);
      f.aura.flare(1.3, 0.3);
    });
  }
}

/** E (sealed): Sonído — he is simply somewhere else, and what stands where he was is an afterimage. */
class FeintAction extends SkillAction {
  readonly name = 'feint';
  constructor(kit: StarrkKit, readonly target: Fighter | null) {
    super(kit);
    this.mobility = 0;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'st_feint', (n) => {
      if (n === 'go') this.kit.sonido(this.target);
    });
    f.invuln = Math.max(f.invuln, 0.3);
    g.sfx.play('shunpo', f.center(), 1);
  }
}

/** G (sealed): the left glove off — the 1 — and no more pretending. */
class GloveAction extends SkillAction {
  readonly name = 'glove';
  constructor(kit: StarrkKit) {
    super(kit);
    this.mobility = 0.2;
  }
  override start(f: Fighter): void {
    this.playClip(f, 'st_glove', (n) => n === 'off' && this.kit.gloveOff());
  }
}

/** F (sealed): "Kechirase, Los Lobos" — his hand on Lilynette's head. */
class ReleaseAction extends SkillAction {
  readonly name = 'release';
  constructor(kit: StarrkKit) {
    super(kit);
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    this.kit.lily?.summon();
    this.playClip(f, 'st_release', (n) => {
      if (n === 'touch') {
        this.kit.lily?.dissolveOut();
        g.callout('蹴散らせ「群狼」', 'KECHIRASE — LOS LOBOS', '#9fd0ff');
        f.aura.flare(1.4, 0.5);
      }
      if (n === 'form') this.kit.becomeLobos();
    });
  }
}

/** RMB (Los Lobos): the right gun held out and charged, the big Cero. */
class ChargedAction extends SkillAction {
  readonly name = 'charged';
  constructor(kit: StarrkKit) {
    super(kit);
    this.mobility = 0.15;
    this.armor = 0.25;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'st_charged', (n) => {
      if (n === 'charge') {
        const emitter = this.kit.muzzle('R');
        if (!emitter) return;
        g.addProjectile(new CeroBeam(g, f, emitter, () => this.kit.aim(), { charge: 0.43, fire: 0.5, radius: 0.72, damage: 150, power: 560, ...CERO, range: 120, track: 1.2, gain: 1.15 }));
        g.sfx.play('charge', f.center(), 0.6);
      }
      if (n === 'fireR') {
        g.sfx.play('beam', f.center(), 1.1);
        g.shake(f === g.player ? 0.3 : 0.12);
      }
    });
  }
}

/** Q (Los Lobos): Cero Metralleta — the ring of muzzles, the stream fused into a beam he steers. */
class MetralletaAction extends SkillAction {
  readonly name = 'metralleta';
  private ring: MetralletaRing | null = null;
  private volley: CeroVolley | null = null;
  private firing = false;
  private k = 0;
  constructor(kit: StarrkKit) {
    super(kit);
    this.mobility = 0.12;
    this.armor = 0.35;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'st_metralleta', (n) => {
      if (n === 'start') {
        const emitter = this.kit.muzzle('R');
        if (!emitter) return;
        const aim = () => this.kit.aim();
        this.ring = new MetralletaRing(g, emitter, aim);
        g.addProjectile(this.ring);
        g.addProjectile(new CeroBeam(g, f, emitter, aim, { charge: 0.12, fire: 2.6, radius: 0.6, damage: 45, power: 440, ...CERO, range: 120, track: 1.5, gain: 1.15 }));
        this.volley = new CeroVolley(g, f, { blast: 0.9, power: 160, carveEvery: 0.08, knock: 2, max: 360 });
        g.addProjectile(this.volley);
        this.firing = true;
        g.callout('無限装弾虚閃', 'CERO METRALLETA', '#9fd0ff');
        g.sfx.play('beam', f.center(), 1.4);
        f.aura.flare(1.5, 0.6);
      }
      if (n === 'end') this.stop();
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.firing || !this.ring || !this.volley) return;
    // every charge point keeps firing toward where the beam is going
    const aim = this.kit.aim();
    for (let i = 0; i < 3; i++) {
      const p = this.ring.point(this.k++ % this.ring.n, new THREE.Vector3());
      _v.subVectors(aim, p).normalize();
      _v.x += (Math.random() - 0.5) * 0.04;
      _v.y += (Math.random() - 0.5) * 0.04;
      _v.z += (Math.random() - 0.5) * 0.04;
      this.volley.emit(p, _v, 70 + Math.random() * 10, 0.11, 0.25);
    }
    if (Math.random() < 0.25) g.sfx.play('gunshot', f.center(), 0.5);
    if (f === g.player && Math.random() < 0.5) g.shake(0.04);
  }
  private stop(): void {
    this.firing = false;
    this.ring?.end();
    this.ring = null;
    if (this.volley) this.volley.closed = true;
    this.volley = null;
  }
  override end(f: Fighter): void {
    super.end(f);
    this.stop();
  }
}

/** E (Los Lobos): the left gun sprayed across in a fan of small Ceros. */
class SprayAction extends SkillAction {
  readonly name = 'spray';
  private volley: CeroVolley | null = null;
  constructor(kit: StarrkKit) {
    super(kit);
    this.mobility = 0.25;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    // square up to the target first: the sweep runs across it
    const t = this.kit.target();
    if (t) f.yaw = Math.atan2(t.pos.x - f.pos.x, t.pos.z - f.pos.z);
    this.playClip(f, 'st_spray', (n) => {
      if (n === 'start') {
        this.volley = new CeroVolley(g, f, { blast: 0.7, power: 110, carveEvery: 0.07, knock: 3, max: 240 });
        g.addProjectile(this.volley);
      }
      if (n === 'end') this.stop();
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const v = this.volley;
    const gun = this.kit.muzzle('L');
    if (!v || !gun) return;
    gun.updateWorldMatrix(true, false);
    const p = gun.getWorldPosition(new THREE.Vector3());
    // along the barrel, levelled at the target's height
    const dir = new THREE.Vector3(0, -1, 0).transformDirection(gun.parent!.matrixWorld);
    const t = this.kit.target();
    const flat = Math.hypot(dir.x, dir.z) || 1;
    const range = t ? Math.max(2, Math.hypot(t.pos.x - p.x, t.pos.z - p.z)) : 20;
    const dy = t ? t.center().y - p.y : 0;
    dir.set(dir.x / flat, dy / range, dir.z / flat).normalize();
    // the fan follows the barrel, pulled a little toward the target
    const toT = t ? t.center().sub(p).normalize() : dir;
    for (let i = 0; i < 2; i++) {
      _v.copy(dir).lerp(toT, 0.35).normalize();
      _v.x += (Math.random() - 0.5) * 0.08;
      _v.y += (Math.random() - 0.5) * 0.05;
      _v.z += (Math.random() - 0.5) * 0.08;
      v.emit(p, _v, 85 + Math.random() * 15, 0.1, 2);
    }
    if (Math.random() < 0.4) g.sfx.play('gunshot', p, 0.45);
  }
  private stop(): void {
    if (this.volley) this.volley.closed = true;
    this.volley = null;
  }
  override end(f: Fighter): void {
    super.end(f);
    this.stop();
  }
}

/** R (Los Lobos): the wolves pour out of the bandoleers. */
class WolvesAction extends SkillAction {
  readonly name = 'wolves';
  constructor(kit: StarrkKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'st_wolves', (n) => {
      if (n === 'pour') this.kit.pourWolves();
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    // the guns come back together once the pack is out
    if (this.t > 1.15) this.kit.showGuns(true);
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.showGuns(true);
  }
}

/** G (Los Lobos): Colmillo out of the bandoleer on his arm (or back to the gun). */
class ColmilloAction extends SkillAction {
  readonly name = 'colmillo';
  constructor(kit: StarrkKit) {
    super(kit);
    this.mobility = 0.3;
  }
  override start(f: Fighter): void {
    this.playClip(f, 'st_colmillo', (n) => n === 'draw' && this.kit.swapColmillo());
  }
}

export class StarrkKit implements Kit {
  form: Form = 'sealed';
  glove = false;
  colmillo = false;
  flare = false;
  comboIndex = 0;
  /** seconds left of Lilynette firing the guns on her own */
  autoT = 0;
  lily: Lilynette | null = null;
  readonly cd = { cero: 0, chest: 0, feint: 0, lily: 0, glove: 0, charged: 0, metralleta: 0, spray: 0, wolves: 0, colmillo: 0, auto: 0 };
  private lastEnd = 0;
  private lureT = 0;
  private autoShotT = 0;
  private muzzles: { R: THREE.Object3D | null; L: THREE.Object3D | null } = { R: null, L: null };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    this.lily = new Lilynette(g, f);
    g.addProjectile(this.lily);
    f.onHurt = (_a, heavy) => {
      if (heavy && this.form === 'sealed' && Math.random() < 0.5) this.lily?.yell();
    };
    this.hands();
    this.applyStats();
  }

  private hands(): void {
    const rig = this.f.visual.rig;
    const lobos = this.form === 'lobos';
    rig.setBoneVisible('fist.R', true);
    rig.setBoneVisible('palm.R', false);
    rig.setBoneVisible('fist.L', lobos);
    rig.setBoneVisible('palm.L', !lobos);
  }

  update(dt: number): void {
    const f = this.f;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    if (this.lureT > 0 && (this.lureT -= dt) <= 0) f.lure = null;
    if (this.autoT > 0) this.autoFire(dt);
    this.applyStats();
  }

  target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 90, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 90);
  }

  private near(range: number): Fighter | null {
    const t = this.target();
    return t && t.pos.distanceTo(this.f.pos) <= range ? t : null;
  }

  /** where his shots go: the target, the camera's aim for the player, or straight ahead */
  aim(out = new THREE.Vector3()): THREE.Vector3 {
    const { f, g } = this;
    if (f === g.player && !f.faceTarget) return g.aimPoint(f, out);
    const t = this.target();
    if (t && !t.dead) return t.center(out);
    return f.center(out).addScaledVector(f.forward(_w), 40);
  }

  /** muzzle objects ride on the pistols (re-made whenever the props are) */
  muzzle(side: 'R' | 'L'): THREE.Object3D | null {
    const gun = this.f.visual.props.get(side === 'R' ? 'gunR' : 'gunL');
    if (!gun) return null;
    let m = this.muzzles[side];
    if (!m || m.parent !== gun) {
      m = new THREE.Object3D();
      m.position.set(...(side === 'R' ? MUZZLE_R : MUZZLE_L));
      gun.add(m);
      this.muzzles[side] = m;
    }
    return m;
  }

  /** the multiplier serious mode puts on his Ceros */
  serious(): number {
    return this.glove ? 1.2 : 1;
  }

  // ---------------------------------------------------------------- moves

  /** one pistol shot: the right gun heavy, the left one quick and homing a little */
  shoot(side: 'R' | 'L', last: boolean): void {
    const { f, g } = this;
    const m = this.muzzle(side);
    if (!m) return;
    m.updateWorldMatrix(true, false);
    const p = m.getWorldPosition(new THREE.Vector3());
    const dir = this.aim().sub(p).normalize();
    const heavy = side === 'R';
    g.addProjectile(new CeroShot(g, f, p, dir, heavy
      ? { speed: 85, size: 0.2, damage: last ? 26 : 22, blast: 0.95, power: 170, knock: last ? 14 : 9, launch: last ? 5 : 1.5, heavy: last }
      : { speed: 110, size: 0.13, damage: 11, blast: 0.55, power: 90, knock: 4, home: this.target(), homeRate: 1.6 }));
    g.sfx.play('gunshot', p, heavy ? 1 : 0.7);
  }

  /** Sonído: afterimages where he stood and on the way, him behind (or beside) the target */
  sonido(t: Fighter | null): void {
    const { f, g } = this;
    const from = f.pos.clone();
    const fw = f.forward(new THREE.Vector3());
    let to: THREE.Vector3;
    if (t) {
      const away = _v.subVectors(t.pos, from).setY(0).normalize();
      const side = new THREE.Vector3(away.z, 0, -away.x).multiplyScalar(Math.random() < 0.5 ? 1 : -1);
      to = t.pos.clone().addScaledVector(away, 1.7).addScaledVector(side, 0.8);
    } else to = from.clone().addScaledVector(fw, 9);
    const gy = groundAt(g, to.x, to.y + 1, to.z, 6);
    if (gy !== null) to.y = gy;
    // he never appears inside a wall: fall back to where he was going
    if (f.body.overlaps(to.x, to.y + 0.05, to.z)) to = from.clone().addScaledVector(fw, 3);
    // afterimages: where he stood, and two along the way
    const obj = f.visual.object;
    const keep = obj.position.clone();
    const side = new THREE.Vector3(fw.z, 0, -fw.x);
    for (const [k, s] of [[0, 0], [0.33, 1], [0.66, -1]] as [number, number][]) {
      obj.position.lerpVectors(from, to, k).addScaledVector(side, s * 0.9);
      f.ghosts.spawn(k === 0 ? 1.3 : 0.8, k === 0 ? 1 : 0.7);
    }
    obj.position.copy(keep);
    f.lure = from.clone();
    this.lureT = 1.1;
    f.body.pos.copy(to);
    f.body.prev.copy(to);
    f.body.vel.set(0, 0, 0);
    f.renderPos.copy(to);
    if (t) f.yaw = Math.atan2(t.pos.x - to.x, t.pos.z - to.z);
    g.onDash(f);
  }

  gloveOff(): void {
    const { f, g } = this;
    if (this.glove) return;
    this.glove = true;
    this.rebuild();
    f.aura.flare(1.6, 0.6);
    g.shake(f === g.player ? 0.3 : 0.1);
    g.sfx.play('flare', f.center(), 0.7);
    g.callout('壱', 'PRIMERA', '#9fd0ff');
    if (f === g.player) g.hud?.showBanner('The glove comes off: the 1 — no more pretending');
    this.applyStats();
  }

  becomeLobos(): void {
    const { f, g } = this;
    if (this.form === 'lobos') return;
    this.form = 'lobos';
    f.def = { ...f.def, stance: LOBOS_STANCE, blade: BLADE_GUN };
    this.rebuild();
    // the release heals him
    f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.25);
    f.aura.flare(2, 0.8);
    g.addRing(f.pos.clone().setY(f.pos.y + 0.05), 7, STARRK_CERO.body, 0.6);
    g.callout('群狼', 'LOS LOBOS', '#9fd0ff');
    g.sfx.play('bankai', f.center(), 0.8);
    g.shake(f === g.player ? 0.45 : 0.15);
    const c = f.center();
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: Math.cos(a) * 8, vy: (Math.random() - 0.3) * 6, vz: Math.sin(a) * 8, size: 0.3, sizeEnd: 0.05, life: 0.5, r: 0.43, g: 0.71, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, drag: 2 });
    }
    this.applyStats();
  }

  private props(): { key: string; model: ReturnType<typeof starrkProp>; socket: string }[] {
    if (this.form === 'sealed') return sealedProps();
    return [
      this.colmillo ? { key: 'sword', model: starrkProp('colmillo'), socket: 'grip.R' } : { key: 'gunR', model: starrkProp('gunR'), socket: 'grip.R' },
      { key: 'gunL', model: starrkProp('gunL'), socket: 'grip.L' },
    ];
  }

  private rebuild(): void {
    const f = this.f;
    const asset: StarrkForm = this.form === 'lobos' ? 'lobos' : this.glove ? 'glove' : 'sealed';
    f.setForm({ asset: starrkAsset(asset), props: this.props() }, AURA_STARRK, f.def.blade);
    this.muzzles = { R: null, L: null };
    this.hands();
  }

  /** G (Los Lobos): the right gun becomes Colmillo, or Colmillo goes back to being the gun */
  swapColmillo(): void {
    const { f, g } = this;
    this.colmillo = !this.colmillo;
    const blade = this.colmillo ? { ...BLADE_KATANA } : BLADE_GUN;
    const stance = this.colmillo ? COLMILLO_STANCE : LOBOS_STANCE;
    f.def = { ...f.def, stance, blade };
    f.anim.loco.stance = stance;
    f.visual.detach(this.colmillo ? 'gunR' : 'sword');
    f.visual.attach(this.colmillo ? 'sword' : 'gunR', starrkProp(this.colmillo ? 'colmillo' : 'gunR'), 'grip.R');
    this.muzzles.R = null;
    f.bladeValid = false;
    const p = sock(f, 'grip.R');
    for (let i = 0; i < 16; i++)
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, vz: (Math.random() - 0.5) * 4, size: 0.18, sizeEnd: 0.03, life: 0.35, r: 0.62, g: 0.82, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, drag: 3 });
    if (this.colmillo) g.callout('牙', 'COLMILLO', '#cfe9ff');
    g.sfx.play('swing', p, 0.8);
  }

  pourWolves(): void {
    const { f, g } = this;
    const back = sock(f, 'back');
    this.showGuns(false);
    const t = this.target();
    g.addProjectile(new WolfPack(g, f, back, f.forward(new THREE.Vector3()), this.glove ? 10 : 8, t, { damage: 16, blast: 1.3, power: 300 }));
    g.callout('魂の同胞', 'LOS LOBOS — CAMARADA', '#9fd0ff');
    g.shake(f === g.player ? 0.3 : 0.1);
  }

  /** the guns are spent on the pack for a moment */
  showGuns(on: boolean): void {
    for (const k of ['gunR', 'gunL', 'sword']) {
      const p = this.f.visual.props.get(k);
      if (!p || p.visible === on) continue;
      p.visible = on;
      if (on) {
        p.getWorldPosition(_v);
        this.g.engine.glow.spawn({ x: _v.x, y: _v.y, z: _v.z, size: 0.6, sizeEnd: 0.1, life: 0.25, r: 0.62, g: 0.82, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
      }
    }
  }

  /** F (Los Lobos): Lilynette fires the left gun on her own while he does as he likes */
  private autoFire(dt: number): void {
    const { f } = this;
    this.autoT -= dt;
    this.autoShotT -= dt;
    if (this.autoShotT > 0 || f.dead) return;
    const t = this.near(45);
    if (!t) return;
    this.autoShotT = 0.4;
    const m = this.muzzle('L');
    if (!m) return;
    m.updateWorldMatrix(true, false);
    const p = m.getWorldPosition(new THREE.Vector3());
    const dir = t.center().sub(p).normalize();
    this.g.addProjectile(new CeroShot(this.g, f, p, dir, { speed: 100, size: 0.12, damage: 6, blast: 0.5, power: 80, knock: 3, home: t, homeRate: 2.4 }));
    this.g.sfx.play('gunshot', p, 0.6);
  }

  // ---------------------------------------------------------------- input

  private special(a: FighterAction, cost: number, cdKey: keyof typeof this.cd, cd: number): boolean {
    const f = this.f;
    if (this.cd[cdKey] > 0 || f.dead) return false;
    if (f.action && !f.action.canCancel(a)) return false;
    if (f.hitstun > 0 || f.dashT > 0) return false;
    if (!f.spendRei(cost)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return false;
    }
    // serious, he does it all quicker
    this.cd[cdKey] = cd * (this.glove ? 0.65 : 1);
    f.act(a, true);
    return true;
  }

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof CutAction || cur instanceof GunAction) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastEnd > 0.7) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const guns = this.form === 'lobos' && !this.colmillo;
    const list = guns ? LOBOS_CHAIN : STARRK_CHAIN;
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    this.lastEnd = this.g.time + 0.7;
    const last = idx === list.length - 1;
    this.f.act(guns ? new GunAction(this, list[idx], idx, last) : new CutAction(this, list[idx], idx, last), true);
  }

  /** RMB: the no-pose Cero / the charged shot. */
  heavy(): void {
    if (this.form === 'sealed') this.special(new CeroHandAction(this), 12, 'cero', 1.6);
    else if (this.colmillo) this.special(new CutAction(this, 'st_heavy', 3, true), 8, 'charged', 1.2);
    else this.special(new ChargedAction(this), 20, 'charged', 3);
  }

  /** Q: the chest Cero / Cero Metralleta. */
  skill1(): void {
    if (this.form === 'sealed') this.special(new CeroChestAction(this), 30, 'chest', 7);
    else if (!this.colmillo) this.special(new MetralletaAction(this), 45, 'metralleta', 11);
    else if (this.f === this.g.player) this.g.hud?.showBanner('Colmillo is out — G for the gun');
  }

  /** E: Sonído feint / the spray. */
  skill2(): void {
    if (this.form === 'sealed') this.special(new FeintAction(this, this.near(30)), 15, 'feint', 4);
    else this.special(new SprayAction(this), 25, 'spray', 6);
  }

  /** R: Lilynette / the wolves. */
  skill3(): void {
    const { f, g } = this;
    if (this.form === 'lobos') {
      this.special(new WolvesAction(this), 50, 'wolves', 14);
      return;
    }
    if (this.cd.lily > 0 || !this.lily?.present) return;
    const t = this.near(40);
    if (!t) {
      if (f === g.player) g.hud?.showBanner('Nobody for Lilynette to pick a fight with');
      return;
    }
    if (this.lily.command(t)) this.cd.lily = this.glove ? 3.5 : 5;
  }

  /** G: the glove / Colmillo. */
  toggle(): void {
    if (this.form === 'sealed') {
      if (this.glove) {
        if (this.f === this.g.player) this.g.hud?.showBanner('The glove is already off');
        return;
      }
      this.special(new GloveAction(this), 0, 'glove', 0.5);
      return;
    }
    this.special(new ColmilloAction(this), 10, 'colmillo', 1);
  }

  release(): void {
    const { f, g } = this;
    if (f.busy) return;
    if (this.form === 'sealed') {
      if (!this.lily?.present) return;
      if (!f.spendRei(30)) {
        if (f === g.player) g.hud?.showBanner('Not enough reiatsu');
        return;
      }
      f.act(new ReleaseAction(this), true);
      return;
    }
    // Los Lobos: Lilynette fires the guns on her own for a while
    if (this.cd.auto > 0 || this.colmillo) return;
    if (!f.spendRei(30)) {
      if (f === g.player) g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    this.cd.auto = 16;
    this.autoT = 8;
    g.callout('リリネット', 'LILYNETTE', '#a8ff8a');
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

  private applyStats(): void {
    const f = this.f;
    const lobos = this.form === 'lobos';
    const quick = this.glove ? 1.06 : 1;
    f.def = { ...f.def, speed: { run: SPEED.run * quick, sprint: SPEED.sprint * quick, jump: SPEED.jump, dash: SPEED.dash * quick, dashTime: SPEED.dashTime } };
    f.power = (lobos ? 1.15 : 1) * (this.glove ? 1.12 : 1) * (this.flare ? 1.25 : 1);
    // Los Lobos' Hierro
    f.damageTaken = lobos ? 0.88 : 1;
    f.aura.target = this.flare ? 1 : lobos ? 0.22 : this.glove ? 0.14 : 0.06;
  }

  formName(): string {
    if (this.form === 'lobos') return `Resurrección — Los Lobos${this.colmillo ? ' · Colmillo' : ''}${this.autoT > 0 ? ' · Lilynette firing' : ''}`;
    return `Primera Espada${this.glove ? ' · glove off' : ''}`;
  }

  ai(): KitAI {
    const sealed = () => this.form === 'sealed', lobos = () => this.form === 'lobos';
    const guns = () => lobos() && !this.colmillo;
    return {
      reach: 1.9,
      chain: 4,
      releaseAt: 0.7,
      toggleAt: 0.9,
      toggleOn: () => this.glove || lobos(),
      ranged: () => guns(),
      moves: [
        { name: 'cero', use: () => this.heavy(), min: 3, max: 30, weight: 1.2, cd: 2.5, when: sealed },
        { name: 'cero-chest', use: () => this.skill1(), min: 0, max: 8, weight: 1, cd: 7, when: sealed },
        { name: 'feint', use: () => this.skill2(), min: 2, max: 16, weight: 0.9, cd: 5, when: sealed },
        { name: 'lily', use: () => this.skill3(), min: 0, max: 25, weight: 1, cd: 6, when: () => sealed() && !!this.lily?.present },
        { name: 'charged', use: () => this.heavy(), min: 5, max: 40, weight: 1.1, cd: 3, when: guns },
        { name: 'metralleta', use: () => this.skill1(), min: 8, max: 45, weight: 1.2, cd: 11, when: guns },
        { name: 'spray', use: () => this.skill2(), min: 4, max: 24, weight: 1, cd: 6, when: guns },
        { name: 'wolves', use: () => this.skill3(), min: 6, max: 40, weight: 1.3, cd: 14, when: guns },
        { name: 'lilynette', use: () => this.release(), min: 0, max: 40, weight: 0.8, cd: 16, when: () => guns() && this.cd.auto <= 0 },
        { name: 'colmillo', use: () => this.toggle(), min: 0, max: 3, weight: 0.6, cd: 8, when: guns },
        { name: 'guns', use: () => this.toggle(), min: 7, max: 60, weight: 2, cd: 4, when: () => lobos() && this.colmillo },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd, list: AbilityInfo[] = [];
    if (this.form === 'sealed') {
      list.push(
        { key: 'LMB', name: 'Katana', kanji: '刀' },
        { key: 'RMB', name: 'Cero', kanji: '虚閃', cost: 12, cd: cd.cero, cdMax: 1.6 },
        { key: 'Q', name: 'Chest Cero', kanji: '胸', cost: 30, cd: cd.chest, cdMax: 7 },
        { key: 'E', name: 'Sonído', kanji: '響転', cost: 15, cd: cd.feint, cdMax: 4 },
        { key: 'R', name: 'Lilynette', kanji: 'リリ', cd: cd.lily, cdMax: 5, active: !!this.lily?.busy },
        { key: 'Shift', name: 'Sonído', kanji: '響転' },
        { key: 'G', name: this.glove ? 'Glove off' : 'Glove', kanji: '壱', active: this.glove },
        { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
        { key: 'F', name: 'Los Lobos', kanji: '群狼', cost: 30 },
      );
      return list;
    }
    list.push(
      this.colmillo ? { key: 'LMB', name: 'Colmillo', kanji: '牙' } : { key: 'LMB', name: 'Gun-kata', kanji: '銃' },
      this.colmillo ? { key: 'RMB', name: 'Cleave', kanji: '斬', cost: 8, cd: cd.charged, cdMax: 1.2 } : { key: 'RMB', name: 'Charged Cero', kanji: '虚閃', cost: 20, cd: cd.charged, cdMax: 3 },
      { key: 'Q', name: 'Metralleta', kanji: '無限', cost: 45, cd: cd.metralleta, cdMax: 11 },
      { key: 'E', name: 'Mil Ceros', kanji: '千', cost: 25, cd: cd.spray, cdMax: 6 },
      { key: 'R', name: 'Wolves', kanji: '狼', cost: 50, cd: cd.wolves, cdMax: 14 },
      { key: 'Shift', name: 'Sonído', kanji: '響転' },
      { key: 'G', name: this.colmillo ? 'Guns' : 'Colmillo', kanji: '牙', cost: 10, active: this.colmillo },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      { key: 'F', name: 'Lilynette', kanji: 'リリ', cost: 30, cd: cd.auto, cdMax: 16, active: this.autoT > 0, timer: this.autoT > 0 ? this.autoT / 8 : undefined, tint: '#a8ff8a' },
    );
    return list;
  }
}
