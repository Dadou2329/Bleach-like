// Retsu Unohana's kit (docs/roster/B1-captains-1.md §5, Kit proposal): two women in one. Retsu, the serene
// healer of the 4th Division: an elegant nodachi string (LMB), the long iai sweep (RMB), Q Kaidō (her wounds
// close and her reiatsu comes back, even on the move), E three hidden daggers, R Bakudō #62 Hyapporankan (a rod
// of light that splits into many and pins the target). F calls Minazuki: the great green manta rises under her
// feet and she rides it — fast, high, healing as she goes; LMB Hadō #4 Byakurai and RMB #63 Raikōhō from its
// back, F again to land. G undoes the braid.
// Yachiru, the first Kenpachi: faster, crueller, "eight thousand styles" (the strings alternate between kendō
// and a flowing one-handed style), RMB the flick that knocks the weapon out of the enemy's hand, Q the throat
// thrust (far worse on a staggered or disarmed enemy), E a dagger from behind, R the back-of-the-hand guard
// that turns a blow and counters, G an emergency Kaidō. F: Bankai — Minazuki. The clenched hand drawn along the
// blade, blood pouring down from the sky until the ground is a pool; every cut throws a liquid slash, RMB the
// bisecting cut, Q a volley, E the sphere of blades, R blades drawn up out of the pool, G regeneration (it
// mends her anyway while she stands in it); F seals it. A killing blow in the Bankai empties the flood at once.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { NODACHI_BASE_Z, NODACHI_TIP_Z, unohanaAsset, unohanaProp, type UnohanaProp } from '../../chars/unohana';
import { UNOHANA_CHAIN, UNOHANA_CLIPS, UNOHANA_STANCE, YACHIRU_CHAINS, YACHIRU_STANCE } from '../../chars/unohanaClips';
import { BladeSphere, BloodFall, FlungWeapon, Hyapporankan, LiquidSlash, MantaRide, PoolBlades, Raikoho, ThrownDagger, byakurai, kaidoMotes } from '../../vfx/minazuki';
import { Flood } from '../../vfx/water';
import { groundAt } from '../../vfx/iceArts';
import { TEX_GLOW } from '../../vfx/sprites';
import type { AuraStyle } from '../../vfx/aura';

/** Retsu: a soft green-white (not stated in canon) */
export const AURA_RETSU: AuraStyle = { core: '#F2FFF6', body: '#9FE8B8', rim: '#3E7A56' };
/** Yachiru: deep crimson */
export const AURA_YACHIRU: AuraStyle = { core: '#FFD0D0', body: '#B01E2C', rim: '#3A0408' };

type BladeDef = NonNullable<FighterDef['blade']>;
const BLADE: BladeDef = { prop: 'sword', base: [0, 0, NODACHI_BASE_Z], tip: [0, 0, NODACHI_TIP_Z], color: '#E8ECF2', core: '#FFFFFF' };
const BLADE_BANKAI: BladeDef = { prop: 'sword', base: [0, 0, NODACHI_BASE_Z], tip: [0, 0, NODACHI_TIP_Z], color: '#A8121C', core: '#FF8A8A' };

const SPEED = { run: 9.2, sprint: 25, jump: 13, dash: 25, dashTime: 0.09 };
const YSPEED = { run: 10.4, sprint: 28, jump: 14, dash: 28, dashTime: 0.085 };
const RIDE_SPEED = { run: 15, sprint: 31, jump: 13, dash: 30, dashTime: 0.09 };
const GREEN = '#7DE0A0';
const CRIMSON = '#C0283A';

function props(kind: UnohanaProp): { key: string; model: ReturnType<typeof unohanaProp>; socket: string }[] {
  return [
    { key: 'sword', model: unohanaProp(kind), socket: 'grip.R' },
    { key: 'sheath', model: unohanaProp('sheath-empty'), socket: 'hip.L' },
  ];
}

export const UNOHANA_DEF: FighterDef = {
  id: 'unohana',
  name: 'Retsu Unohana',
  title: 'Captain, 4th Division',
  build: () => ({ asset: unohanaAsset('retsu'), props: props('nodachi') }),
  stance: UNOHANA_STANCE,
  clips: UNOHANA_CLIPS,
  aura: AURA_RETSU,
  blade: BLADE,
  hp: 980,
  rei: 260,
  speed: { ...SPEED },
  radius: 0.34,
  height: 1.59,
};

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

/** the blade's direction right now, square to the facing (the plane a liquid slash is thrown in) */
function bladeSide(f: Fighter, out = new THREE.Vector3()): THREE.Vector3 {
  const b = f.blade;
  out.subVectors(b.tip, b.base);
  const fw = f.forward(_w);
  out.addScaledVector(fw, -out.dot(fw));
  if (out.lengthSq() < 1e-4) out.set(-fw.z, 0, fw.x);
  return out.normalize();
}

// ---------------------------------------------------------------------------------------------- actions

interface CutOpts {
  /** the deep variants: RMB iai / disarm / throat / bisect */
  kind?: 'iai' | 'disarm' | 'throat' | 'bisect' | 'counter';
  speed?: number;
}

class CutAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private hitAt = -1;
  private stopAt = 0;
  private slashed = false;
  queued = false;
  constructor(readonly kit: UnohanaKit, readonly clip: string, readonly index: number, readonly o: CutOpts = {}) {
    super();
    this.name = o.kind ?? clip;
    this.mobility = 0.18;
    this.airGravity = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    const sp = this.o.speed ?? 1;
    const c = f.anim.clip(this.clip)!;
    this.dur = (c.dur - c.fadeOut * 0.5) / sp;
    this.comboAt = (c.events.combo ?? c.dur * 0.62) / sp;
    this.hitAt = (c.events.hit ?? -1) / sp;
    f.bladeHits.clear();
    const kit = this.kit;
    const yachiru = kit.form !== 'retsu';
    const last = this.index === 3;
    const k = this.o.kind;
    let spec: BladeSpec;
    if (k === 'iai') spec = { damage: 34, knock: 10, launch: 2, heavy: true, hitstop: 0.09, shake: 0.3, cut: 560, reach: 0.3 };
    else if (k === 'bisect') spec = { damage: 52, knock: 14, launch: 4, heavy: true, hitstop: 0.12, shake: 0.5, cut: 900, reach: 0.3 };
    else if (k === 'disarm') spec = { damage: 16, knock: 4, launch: 0, heavy: false, hitstop: 0.07, shake: 0.2, cut: 420, reach: 0.26, onHit: (o) => kit.disarm(o) };
    else if (k === 'throat') {
      // an execution: far worse on a staggered or disarmed enemy
      const t = kit.target();
      const open = t !== null && (t.hitstun > 0.2 || t.disarmT > 0 || t.slowT > 0.5);
      spec = { damage: open ? 58 : 34, knock: 9, launch: 1, heavy: true, hitstop: open ? 0.14 : 0.08, shake: open ? 0.45 : 0.25, cut: 520, reach: 0.26 };
      if (open) g.callout('', 'OPENING', CRIMSON);
    } else if (k === 'counter') spec = { damage: 34, knock: 10, launch: 2, heavy: true, hitstop: 0.12, shake: 0.35, cut: 520, reach: 0.28 };
    else spec = last
      ? { damage: yachiru ? 26 : 24, knock: 8, launch: 2, heavy: true, hitstop: 0.08, shake: 0.25, cut: 500, reach: 0.26 }
      : { damage: yachiru ? 19 : 17, knock: 5, launch: 0, heavy: false, hitstop: 0.05, shake: 0.14, cut: 420, reach: 0.24 };
    f.bladeSpec = spec;
    f.anim.play(this.clip, {
      speed: sp,
      onEvent: (n) => {
        if (n !== 'step') return;
        // the long blade reaches: close the gap so the cut lands where the target stands, stopping at reach
        const tgt = f.faceTarget;
        let push = 5;
        if (tgt) {
          const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
          this.stopAt = k === 'throat' ? 1.25 : k === 'counter' ? 1.1 : 1.5;
          const tau = Math.max(0.05, this.hitAt - (c.events.step ?? 0) / sp);
          const per = (1 - Math.exp(-f.pushDrag * tau)) / f.pushDrag;
          push = Math.min(k === 'throat' ? 34 : 26, Math.max(k === 'counter' ? 8 : 5, Math.max(0, d - this.stopAt) / per));
        }
        f.push.addScaledVector(f.forward(), push);
        g.sfx.play(last || k ? 'swingHeavy' : 'swing', f.center(), 0.8);
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
    const open = this.hitAt >= 0 && t >= this.hitAt - 0.07 && t <= this.hitAt + 0.13;
    f.bladeActive = open;
    if (f.trail) f.trail.emitting = open;
    // in the Bankai every swing throws the fluid
    if (!this.slashed && this.kit.form === 'bankai' && this.hitAt >= 0 && t >= this.hitAt) {
      this.slashed = true;
      this.kit.slash(this.o.kind === 'bisect');
    }
    if (!this.o.kind && this.queued && t >= this.comboAt) {
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
    if (next.name === 'dash' || next instanceof SkillAction) return this.t >= this.hitAt + 0.05;
    return false;
  }
}

abstract class SkillAction extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: UnohanaKit) {
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

/** a skill: plays a clip and calls the kit on its events */
class Skill extends SkillAction {
  constructor(kit: UnohanaKit, readonly name: string, readonly clip: string, readonly on: (n: string) => void, mobility = 0.2, readonly call?: [string, string, string], readonly speed = 1) {
    super(kit);
    this.mobility = mobility;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, this.clip, this.on, this.speed);
    if (this.call) g.callout(this.call[0], this.call[1], this.call[2]);
  }
  override canCancel(next: FighterAction): boolean {
    return this.t > this.dur * 0.6 && (next.name === 'dash' || next instanceof SkillAction);
  }
}

/** Yachiru's guard: the back of the left hand raised; a blow that lands on it is turned and answered */
class GuardAction extends SkillAction {
  readonly name = 'guard';
  private turned: Fighter | null = null;
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'yc_guard', () => {});
    f.parry = (_amount, from, o) => {
      if (!from || o.energy || this.done || this.t > 0.82) return false;
      if (from.pos.distanceTo(f.pos) > 4.2) return false;
      // turned aside with the back of the hand
      this.turned = from;
      const c = f.center();
      g.sparks(_v.copy(c).addScaledVector(f.forward(_w), 0.4), f.forward(new THREE.Vector3()), '#F3F3F0', 14);
      g.sfx.play('ting', c, 1);
      g.hitstop(0.08);
      from.hitstun = Math.max(from.hitstun, 0.45);
      from.stopAction();
      return true;
    };
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.turned && !this.done) {
      const o = this.turned;
      this.done = true;
      f.faceTarget = o.center();
      this.kit.counter();
    }
  }
  override end(f: Fighter): void {
    f.parry = null;
  }
}

/** E (Yachiru): a flash step behind the target and a dagger driven in */
class AmbushAction extends SkillAction {
  readonly name = 'ambush';
  private struck = false;
  override start(f: Fighter, g: Game): void {
    const t = this.kit.target();
    if (t && t.pos.distanceTo(f.pos) < 16) {
      // behind it, facing its back
      const back = t.forward(_v).multiplyScalar(-1.15);
      f.ghosts.spawn(0.5, 1);
      f.body.pos.set(t.pos.x + back.x, t.pos.y, t.pos.z + back.z);
      f.body.prev.copy(f.body.pos);
      f.yaw = Math.atan2(t.pos.x - f.body.pos.x, t.pos.z - f.body.pos.z);
      f.faceTarget = t.center();
      g.sfx.play('shunpo', f.pos, 1);
    }
    f.visual.attach('dagger', unohanaProp('dagger'), 'grip.L');
    this.playClip(f, 'yc_dagger', (n) => {
      if (n !== 'hit' || this.struck) return;
      this.struck = true;
      const fw = f.forward(new THREE.Vector3());
      for (const o of g.enemiesOf(f)) {
        _v.subVectors(o.pos, f.pos).setY(0);
        if (_v.length() > 2.2 + o.def.radius || _v.normalize().dot(fw) < 0.3) continue;
        g.damage(o, 26, f, fw.clone(), { knock: 6, heavy: true, hitstop: 0.1, shake: 0.3 });
        o.hitstun = Math.max(o.hitstun, 0.6);
      }
    });
  }
  override end(f: Fighter): void {
    f.visual.detach('dagger');
  }
}

// ---------------------------------------------------------------------------------------------- the kit

export type UnohanaForm = 'retsu' | 'yachiru' | 'bankai';

export class UnohanaKit implements Kit {
  form: UnohanaForm = 'retsu';
  comboIndex = 0;
  flare = false;
  readonly cd = { iai: 0, kaido: 0, daggers: 0, bakudo: 0, ride: 0, bolt: 0, raikoho: 0, disarm: 0, throat: 0, ambush: 0, guard: 0, ekaido: 0, release: 0, bisect: 0, volley: 0, sphere: 0, draw: 0, regen: 0 };
  /** Minazuki under her feet (the Shikai) */
  ride: MantaRide | null = null;
  private rideT = 0;
  private rideAlt = 3.2;
  /** the Bankai's pool */
  flood: Flood | null = null;
  /** Kaidō: seconds of healing left */
  healT = 0;
  /** which of the eight thousand styles the current string uses */
  style = 0;
  private lastEnd = 0;

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.def = { ...f.def, speed: { ...SPEED } };
    this.hands();
    f.onLethal = () => this.onLethal();
    this.applyStats();
  }

  /** the sword hand closed on the hilt, the left open */
  hands(): void {
    const rig = this.f.visual.rig;
    rig.setBoneVisible('fist.R', true);
    rig.setBoneVisible('palm.R', false);
    rig.setBoneVisible('fist.L', false);
    rig.setBoneVisible('palm.L', true);
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    // Kaidō: the reiatsu first, then the body
    if (this.healT > 0) {
      this.healT -= dt;
      if (f.rei < f.maxRei * 0.6) f.rei = Math.min(f.maxRei, f.rei + 16 * dt);
      f.hp = Math.min(f.maxHp, f.hp + f.maxHp * (this.form === 'retsu' ? 0.07 : 0.05) * dt);
      if (Math.random() < 0.6) kaidoMotes(g, sock(f, 'chest.front'));
    }
    if (this.ride) this.updateRide(dt);
    if (this.form === 'bankai') {
      f.rei -= dt * 3;
      // the pool mends her while she stands in it
      if (this.flood && !this.flood.done && this.flood.contains(f.pos)) {
        f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.012 * dt);
        if (Math.random() < 0.15) kaidoMotes(g, f.center(), 1, '#E04050');
      }
      if (f.rei <= 0 || f.dead) this.seal();
    }
    this.applyStats();
  }

  target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 90, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 90);
  }

  aim(out = new THREE.Vector3()): THREE.Vector3 {
    const { f, g } = this;
    if (f === g.player && !f.faceTarget) return g.aimPoint(f, out);
    const t = this.target();
    if (t && !t.dead) return t.center(out);
    if (f.faceTarget) return out.copy(f.faceTarget);
    return f.center(out).addScaledVector(f.forward(_w), 20);
  }

  // ---------------------------------------------------------------- Retsu

  kaido(): void {
    this.healT = 3.2;
    const c = this.f.center();
    this.g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: 1.2, sizeEnd: 2.4, life: 0.5, r: 0.5, g: 1.4, b: 0.7, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
    this.g.sfx.play('heal', c, 0.8);
  }

  daggers(): void {
    const { f, g } = this;
    const from = sock(f, 'palm.L');
    const dir = _v.subVectors(this.aim(), from).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    for (const a of [-0.1, 0, 0.1]) g.addProjectile(new ThrownDagger(g, f, from.clone(), dir.clone().applyAxisAngle(up, a), { damage: 10 }));
  }

  bakudo(): void {
    const { f, g } = this;
    g.addProjectile(new Hyapporankan(g, f, sock(f, 'palm.L'), this.target(), this.aim(), { hold: 2.4, damage: 12 }));
  }

  // ---------------------------------------------------------------- the Shikai: riding Minazuki

  private mount(): void {
    const { f, g } = this;
    if (this.ride) return;
    this.ride = new MantaRide(g, f);
    g.addProjectile(this.ride);
    this.rideT = 14;
    this.rideAlt = 3.2;
    f.mounted = true;
    f.def = { ...f.def, speed: { ...RIDE_SPEED } };
    // the sword is the creature now
    const w = f.visual.props.get('sword');
    if (w) w.visible = false;
    f.aura.flare(1.2, 0.5);
    f.body.vel.y = 6;
    g.callout('肉雫唼', 'MINAZUKI', GREEN);
  }

  dismount(): void {
    const { f } = this;
    if (!this.ride) return;
    this.ride.dismiss();
    this.ride = null;
    f.mounted = false;
    f.mountVy = 0;
    f.def = { ...f.def, speed: { ...SPEED } };
    const w = f.visual.props.get('sword');
    if (w) w.visible = true;
    f.anim.stopAll(0.2);
    this.cd.ride = 18;
  }

  private updateRide(dt: number): void {
    const { f, g } = this;
    const r = this.ride!;
    this.rideT -= dt;
    if (!r.alive || this.rideT <= 0 || f.dead) return this.dismount();
    // jump climbs, descend dives; it keeps a few metres off the ground
    if (f.wishHover) this.rideAlt = Math.min(14, this.rideAlt + dt * 6);
    if (f.wishDescend) this.rideAlt = Math.max(1.6, this.rideAlt - dt * 8);
    const gy = groundAt(g, f.pos.x, f.pos.y + 1, f.pos.z, 40) ?? f.pos.y - this.rideAlt;
    f.mountVy = Math.max(-12, Math.min(12, (gy + this.rideAlt - f.pos.y) * 3.5));
    // resting on it, her wounds close
    f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.02 * dt);
    if (Math.random() < 0.08) kaidoMotes(g, f.center());
    // standing on its back when nothing else is playing
    if (!f.action && !f.anim.current) f.anim.play('un_ride', { fadeIn: 0.2 });
  }

  // ---------------------------------------------------------------- Yachiru

  private unbraid(): void {
    const { f, g } = this;
    if (this.form !== 'retsu') return;
    this.form = 'yachiru';
    f.def = { ...f.def, stance: YACHIRU_STANCE, speed: { ...YSPEED } };
    f.setForm({ asset: unohanaAsset('yachiru'), props: props('nodachi') }, AURA_YACHIRU, BLADE);
    this.hands();
    f.aura.flare(1.4, 0.5);
    g.sfx.play('flare', f.center(), 0.9);
    g.callout('八千流', 'YACHIRU', CRIMSON);
    if (f === g.player) g.shake(0.25);
  }

  /** the weapon flicked out of the enemy's hand */
  disarm(o: Fighter): void {
    const { f, g } = this;
    if (o.disarmT > 0 || o.def.boss) return;
    o.disarmT = 3.2;
    o.stopAction();
    g.addProjectile(new FlungWeapon(g, o, f));
    if (o === g.player) g.hud?.showBanner('Disarmed');
  }

  counter(): void {
    const { f } = this;
    f.act(new CutAction(this, 'yc_counter', 0, { kind: 'counter' }), true);
  }

  // ---------------------------------------------------------------- the Bankai

  private bankai(): void {
    const { f, g } = this;
    this.form = 'bankai';
    f.setForm({ asset: unohanaAsset('yachiru'), props: props('bankai') }, { ...AURA_YACHIRU, body: '#8E1420' }, BLADE_BANKAI);
    this.hands();
    const at = f.pos.clone();
    g.addProjectile(new BloodFall(g, at, 22, 1.8));
    this.flood = new Flood(g, f, at, 26, 600, 0.3, { deep: '#2A0206', light: '#8E1420', foam: '#C2303B', soak: false, slow: 0.3 });
    g.addProjectile(this.flood);
    g.sfx.play('bankai', f.center(), 1);
    if (f === g.player) g.shake(0.5);
  }

  /** the Bankai is sealed: the blade hardens back to steel, the pool drains */
  seal(): void {
    const { f, g } = this;
    if (this.form !== 'bankai') return;
    this.form = 'yachiru';
    this.flood?.drain();
    this.flood = null;
    this.cd.release = 25;
    if (!f.dead) {
      f.setForm({ asset: unohanaAsset('yachiru'), props: props('nodachi') }, AURA_YACHIRU, BLADE);
      this.hands();
    }
    if (f === g.player) g.hud?.showBanner('The Bankai is sealed');
  }

  /** a liquid slash thrown off the swing (bigger for the bisecting cut) */
  slash(big = false): void {
    const { f, g } = this;
    const fw = f.forward(new THREE.Vector3());
    const aim = this.aim();
    const from = f.center().addScaledVector(fw, 0.6);
    const dir = aim.sub(from).normalize();
    if (Math.abs(dir.y) > 0.5) dir.setY(Math.sign(dir.y) * 0.5).normalize();
    const side = big ? new THREE.Vector3(0, 1, 0) : bladeSide(f);
    g.addProjectile(new LiquidSlash(g, f, from, dir, side, big ? { damage: 40, radius: 3.2, cut: 900, range: 48 } : { damage: 14, radius: 1.7, cut: 380 }));
  }

  volley(n: number): void {
    const { f, g } = this;
    const from = f.center().addScaledVector(f.forward(_w), 0.6);
    const dir = this.aim().sub(from).normalize();
    const side = new THREE.Vector3(-dir.z, 0, dir.x).applyAxisAngle(dir, (n - 1) * 0.7);
    g.addProjectile(new LiquidSlash(g, f, from, dir, side, { damage: 22, radius: 2.2, cut: 520 }));
  }

  regen(): void {
    const { f, g } = this;
    f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.18);
    const c = f.center();
    for (let i = 0; i < 16; i++) kaidoMotes(g, c, 1, '#E04050');
    g.sfx.play('heal', c, 0.9);
  }

  private onLethal(): boolean {
    // the moment she takes a fatal wound the fluid vanishes
    if (this.form === 'bankai') {
      this.flood?.drain();
      this.flood = null;
    }
    if (this.ride) this.dismount();
    return false;
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
    this.cd[cdKey] = cd;
    f.act(a, true);
    return true;
  }

  private skill(name: string, clip: string, ev: string, fn: () => void, mobility = 0.2, call?: [string, string, string], speed = 1): Skill {
    return new Skill(this, name, clip, (n) => { if (n === ev) fn(); }, mobility, call, speed);
  }

  /** a quick instant cast from the creature's back (no clip of its own: she stays standing) */
  private cast(cdKey: keyof typeof this.cd, cd: number, cost: number, fn: () => void): void {
    const f = this.f;
    if (this.cd[cdKey] > 0 || f.dead || f.hitstun > 0) return;
    if (!f.spendRei(cost)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    this.cd[cdKey] = cd;
    fn();
  }

  attack(): void {
    const f = this.f;
    if (this.ride) {
      this.cast('bolt', 0.32, 2, () => byakurai(this.g, f, sock(f, 'palm.L'), this.aim().sub(sock(f, 'palm.L')), { damage: 14 }));
      return;
    }
    const cur = f.action;
    if (cur instanceof CutAction && !cur.o.kind) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastEnd > 0.7) {
      // a new string: Yachiru never fights the same way twice running
      if (this.comboIndex !== 0) this.style = (this.style + 1) % YACHIRU_CHAINS.length;
      this.comboIndex = 0;
    }
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const chain = this.form === 'retsu' ? UNOHANA_CHAIN : YACHIRU_CHAINS[this.style];
    const idx = i % chain.length;
    this.comboIndex = idx + 1;
    this.lastEnd = this.g.time + 0.7;
    this.f.act(new CutAction(this, chain[idx], idx, { speed: this.form === 'retsu' ? 1 : 1.08 }), true);
  }

  heavy(): void {
    const f = this.f;
    if (this.ride) {
      this.cast('raikoho', 4, 16, () => {
        const from = sock(f, 'palm.L');
        this.g.addProjectile(new Raikoho(this.g, f, from, this.aim().sub(from), { damage: 40 }));
        this.g.callout('破道の六十三 雷吼炮', 'HADŌ #63 RAIKŌHŌ', '#FFE27A');
      });
      return;
    }
    if (this.form === 'retsu') this.special(new CutAction(this, 'un_iai', 0, { kind: 'iai' }), 10, 'iai', 3);
    else if (this.form === 'yachiru') this.special(new CutAction(this, 'yc_disarm', 0, { kind: 'disarm' }), 10, 'disarm', 6);
    else this.special(new CutAction(this, 'bk_bisect', 0, { kind: 'bisect' }), 20, 'bisect', 5);
  }

  skill1(): void {
    if (this.form === 'retsu') this.special(this.skill('kaido', 'un_kaido', 'heal', () => this.kaido(), 0.5, ['回道', 'KAIDŌ', GREEN]), 0, 'kaido', 16);
    else if (this.form === 'yachiru') this.special(new CutAction(this, 'yc_throat', 0, { kind: 'throat' }), 14, 'throat', 4);
    else this.special(new Skill(this, 'volley', 'bk_volley', (n) => {
      if (n === 's1') this.volley(1);
      else if (n === 's2') this.volley(2);
      else if (n === 's3') this.volley(3);
    }, 0.15), 24, 'volley', 6);
  }

  skill2(): void {
    if (this.form === 'retsu') this.special(this.skill('daggers', 'un_daggers', 'throw', () => this.daggers(), 0.4), 8, 'daggers', 2.5);
    else if (this.form === 'yachiru') this.special(new AmbushAction(this), 16, 'ambush', 6);
    else this.special(this.skill('sphere', 'bk_sphere', 'sphere', () => this.g.addProjectile(new BladeSphere(this.g, this.f, { dur: 5, radius: 2.6, dps: 36 })), 0.1), 30, 'sphere', 12);
  }

  skill3(): void {
    if (this.form === 'retsu') this.special(this.skill('bakudo', 'un_bakudo', 'throw', () => this.bakudo(), 0.15, ['縛道の六十二 百歩欄干', 'BAKUDŌ #62 HYAPPORANKAN', '#FFF2A8']), 24, 'bakudo', 9);
    else if (this.form === 'yachiru') this.special(new GuardAction(this), 6, 'guard', 7);
    else this.special(this.skill('draw', 'bk_draw', 'fire', () => {
      const t = this.target();
      if (t) this.g.addProjectile(new PoolBlades(this.g, this.f, t, { n: 8, damage: 9 }));
    }, 0.1), 22, 'draw', 7);
  }

  toggle(): void {
    if (this.form === 'retsu') {
      if (this.ride || this.f.busy) return;
      this.f.act(this.skill('unbraid', 'un_unbraid', 'undo', () => this.unbraid(), 0.1), true);
    } else if (this.form === 'yachiru') this.special(this.skill('kaido', 'yc_kaido', 'heal', () => this.kaido(), 0.4, ['回道', 'KAIDŌ', GREEN]), 20, 'ekaido', 18);
    else this.special(this.skill('regen', 'yc_kaido', 'heal', () => this.regen(), 0.4), 30, 'regen', 20);
  }

  release(): void {
    const { f, g } = this;
    if (this.form === 'retsu') {
      if (this.ride) return this.dismount();
      // the duel AI unbraids instead of flying off (it uses the creature through its moves)
      if (f !== g.player && !this.ride) return this.toggle();
      if (this.cd.ride > 0 || f.busy) return;
      if (!f.spendRei(30)) return this.broke();
      f.act(this.skill('shikai', 'un_shikai', 'summon', () => this.mount(), 0.1), true);
      return;
    }
    if (this.form === 'bankai') return this.seal();
    if (this.cd.release > 0 || f.busy) return;
    if (!f.spendRei(50)) return this.broke();
    this.cd.release = 4;
    f.act(this.skill('bankai', 'yc_bankai', 'flood', () => this.bankai(), 0, ['卍解 皆尽', 'BANKAI — MINAZUKI', CRIMSON]), true);
    g.sfx.play('charge', f.center(), 0.8);
  }

  /** the AI's way onto the creature */
  rideAI(): void {
    const f = this.f;
    if (this.form !== 'retsu' || this.ride || this.cd.ride > 0 || f.busy) return;
    if (!f.spendRei(30)) return;
    f.act(this.skill('shikai', 'un_shikai', 'summon', () => this.mount(), 0.1), true);
  }

  private broke(): void {
    if (this.f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
  }

  toggleFlare(): void {
    this.flare = !this.flare;
    this.applyStats();
    if (this.flare) {
      this.f.aura.flare(1.4, 0.4);
      this.g.sfx.play('flare', this.f.center());
    }
  }

  private applyStats(): void {
    const f = this.f;
    f.power = (this.flare ? 1.2 : 1) * (this.form === 'retsu' ? 1 : this.form === 'yachiru' ? 1.15 : 1.25);
    f.aura.target = this.flare ? 1 : this.form === 'bankai' ? 0.6 : this.form === 'yachiru' ? 0.25 : this.healT > 0 ? 0.3 : 0.05;
  }

  formName(): string {
    if (this.ride) return 'Shikai — Minazuki';
    return this.form === 'bankai' ? 'Bankai — Minazuki' : this.form === 'yachiru' ? 'Yachiru — the first Kenpachi' : 'Captain, 4th Division';
  }

  ai(): KitAI {
    const kit = this;
    const retsu = () => kit.form === 'retsu' && !kit.ride, riding = () => kit.ride !== null, yachiru = () => kit.form === 'yachiru', bankai = () => kit.form === 'bankai';
    return {
      get reach() {
        return 2.2;
      },
      chain: 4,
      releaseAt: [0.4],
      toggleAt: 0.66,
      toggleOn: () => kit.form !== 'retsu',
      ranged: () => kit.form === 'retsu',
      moves: [
        { name: 'iai', use: () => this.heavy(), min: 0, max: 3.2, weight: 1, cd: 3, when: retsu },
        { name: 'kaido', use: () => this.skill1(), min: 3, max: 200, weight: 1.3, cd: 14, when: () => retsu() && this.f.hp < this.f.maxHp * 0.8 },
        { name: 'daggers', use: () => this.skill2(), min: 4, max: 20, weight: 1.2, cd: 2.5, when: retsu },
        { name: 'bakudo', use: () => this.skill3(), min: 4, max: 24, weight: 1, cd: 9, when: retsu },
        { name: 'ride', use: () => this.rideAI(), min: 6, max: 200, weight: 0.5, cd: 30, when: () => retsu() && this.f.hp < this.f.maxHp * 0.85 },
        { name: 'byakurai', use: () => this.attack(), min: 2, max: 34, weight: 1.6, cd: 0.4, when: riding },
        { name: 'raikoho', use: () => this.heavy(), min: 3, max: 34, weight: 1, cd: 4, when: riding },
        { name: 'disarm', use: () => this.heavy(), min: 0, max: 2.8, weight: 1.1, cd: 6, when: yachiru },
        { name: 'throat', use: () => this.skill1(), min: 1, max: 4.5, weight: 1, cd: 4, when: yachiru },
        { name: 'ambush', use: () => this.skill2(), min: 3, max: 14, weight: 0.9, cd: 6, when: yachiru },
        { name: 'guard', use: () => this.skill3(), min: 0, max: 3, weight: 0.6, cd: 7, when: yachiru },
        { name: 'ekaido', use: () => this.toggle(), min: 0, max: 200, weight: 1.2, cd: 18, when: () => yachiru() && this.f.hp < this.f.maxHp * 0.35 },
        { name: 'bisect', use: () => this.heavy(), min: 0, max: 9, weight: 1, cd: 5, when: bankai },
        { name: 'volley', use: () => this.skill1(), min: 4, max: 30, weight: 1.2, cd: 6, when: bankai },
        { name: 'sphere', use: () => this.skill2(), min: 0, max: 4, weight: 0.9, cd: 12, when: bankai },
        { name: 'draw', use: () => this.skill3(), min: 4, max: 26, weight: 1, cd: 7, when: bankai },
        { name: 'regen', use: () => this.toggle(), min: 0, max: 200, weight: 1, cd: 20, when: () => bankai() && this.f.hp < this.f.maxHp * 0.5 },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    const flare = { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare };
    if (this.ride)
      return [
        { key: 'LMB', name: 'Byakurai', kanji: '白雷', cd: cd.bolt, cdMax: 0.32 },
        { key: 'RMB', name: 'Raikōhō', kanji: '雷吼炮', cost: 16, cd: cd.raikoho, cdMax: 4 },
        { key: 'Q', name: 'Kaidō', kanji: '回道', cd: cd.kaido, cdMax: 16, active: this.healT > 0 },
        { key: 'E', name: 'Hidden daggers', kanji: '暗器', cost: 8, cd: cd.daggers, cdMax: 2.5 },
        { key: 'R', name: 'Hyapporankan', kanji: '百歩欄干', cost: 24, cd: cd.bakudo, cdMax: 9 },
        { key: 'Space', name: 'Climb', kanji: '昇' },
        flare,
        { key: 'F', name: 'Land', kanji: '降', active: true },
      ];
    if (this.form === 'bankai')
      return [
        { key: 'LMB', name: 'Liquid slashes', kanji: '皆尽' },
        { key: 'RMB', name: 'Bisect', kanji: '両断', cost: 20, cd: cd.bisect, cdMax: 5 },
        { key: 'Q', name: 'Volley', kanji: '連刃', cost: 24, cd: cd.volley, cdMax: 6 },
        { key: 'E', name: 'Blade sphere', kanji: '刃球', cost: 30, cd: cd.sphere, cdMax: 12 },
        { key: 'R', name: 'Pool blades', kanji: '血刃', cost: 22, cd: cd.draw, cdMax: 7 },
        { key: 'Shift', name: 'Shunpo', kanji: '瞬歩' },
        { key: 'G', name: 'Regeneration', kanji: '再生', cost: 30, cd: cd.regen, cdMax: 20 },
        flare,
        { key: 'F', name: 'Seal', kanji: '封', active: true },
      ];
    if (this.form === 'yachiru')
      return [
        { key: 'LMB', name: 'Eight thousand styles', kanji: '八千流' },
        { key: 'RMB', name: 'Disarm', kanji: '武装解除', cost: 10, cd: cd.disarm, cdMax: 6 },
        { key: 'Q', name: 'Throat thrust', kanji: '喉突き', cost: 14, cd: cd.throat, cdMax: 4 },
        { key: 'E', name: 'Dagger ambush', kanji: '暗剣', cost: 16, cd: cd.ambush, cdMax: 6 },
        { key: 'R', name: 'Guard', kanji: '受け', cost: 6, cd: cd.guard, cdMax: 7 },
        { key: 'Shift', name: 'Shunpo', kanji: '瞬歩' },
        { key: 'G', name: 'Kaidō', kanji: '回道', cost: 20, cd: cd.ekaido, cdMax: 18, active: this.healT > 0 },
        flare,
        { key: 'F', name: 'Bankai', kanji: '卍解', cost: 50, cd: cd.release, cdMax: 25 },
      ];
    return [
      { key: 'LMB', name: 'Minazuki', kanji: '肉雫唼' },
      { key: 'RMB', name: 'Iai', kanji: '居合', cost: 10, cd: cd.iai, cdMax: 3 },
      { key: 'Q', name: 'Kaidō', kanji: '回道', cd: cd.kaido, cdMax: 16, active: this.healT > 0 },
      { key: 'E', name: 'Hidden daggers', kanji: '暗器', cost: 8, cd: cd.daggers, cdMax: 2.5 },
      { key: 'R', name: 'Hyapporankan', kanji: '百歩欄干', cost: 24, cd: cd.bakudo, cdMax: 9 },
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩' },
      { key: 'G', name: 'Unbraid', kanji: '八千流' },
      flare,
      { key: 'F', name: 'Minazuki', kanji: '肉雫唼', cost: 30, cd: cd.ride, cdMax: 18 },
    ];
  }
}
