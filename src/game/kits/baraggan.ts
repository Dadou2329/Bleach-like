// Baraggan Louisenbairn's kit (docs/roster/E1-espada-1.md, Kit proposal). Sealed, the Segunda Espada: slow,
// enormous one-handed sweeps of Arrogante and a two-handed chop that cracks the ground; RMB the Casual
// Swing (one lazy cleave whose cut runs on far past the blades and halves what stands in its path); Q the
// aging touch (a Sonído to the target's side, two fingers on a shoulder: the bones go brittle — slower, and
// every blow lands harder); E the royal throw (a hand on the throat, lifted and flung); R the royal flare
// (dark red reiatsu bursting off him); G Senescencia (a dome of slowed time round him, drains reiatsu); F
// "Kuchiro, Arrogante". Arrogante (the crowned skeleton): his body rots whatever is near — the ground
// decays under his feet, Ceros and Kidō age before they reach him, those beside him wither; LMB Gran Caída
// chops that leave the rot in the wound; RMB the Guillotine (an overhead that rots a slab of the world in
// front of him); Q Respira (held: the miasma poured out of his open hand); E the Respira slash (a crescent of
// rot); R Gran Caída thrown (the chains bring it back); G enraged (the breath faster and further, it costs
// him his own flesh); F Respira Total (everything round him rots at once).
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { ARROGANTE_HEAD_Z, ARROGANTE_REACH, CAIDA_HEAD_Z, baragganAsset, baragganProp, type BaragganForm } from '../../chars/baraggan';
import { ARROGANTE_CHAIN, ARROGANTE_STANCE, BARAGGAN_CHAIN, BARAGGAN_CLIPS, BARAGGAN_STANCE } from '../../chars/baragganClips';
import { BARAGGAN_RED, RESPIRA, RespiraBreath, RespiraTotal, SenescenciaField, ThrownCaida, miasmaPuff } from '../../vfx/respira';
import { GetsugaProjectile } from '../projectiles/getsuga';
import { BoxShape, SphereShape } from '../../destruction/shapes';
import { groundAt } from '../../vfx/iceArts';
import { TEX_GLOW, TEX_STREAK } from '../../vfx/sprites';
import type { AuraStyle } from '../../vfx/aura';

export const AURA_BARAGGAN: AuraStyle = { core: '#F2A08A', body: '#8B0E16', rim: '#3A0508' };
export const AURA_ARROGANTE: AuraStyle = { core: '#B07ADF', body: '#5B2A7A', rim: '#1B0E24' };

type BladeDef = NonNullable<FighterDef['blade']>;
const BLADE_ARROGANTE: BladeDef = { prop: 'sword', base: [0, 0, ARROGANTE_HEAD_Z - 0.3], tip: [0, 0, ARROGANTE_HEAD_Z + 0.12], color: '#C9CDD2', core: '#F3F1EA' };
const BLADE_CAIDA: BladeDef = { prop: 'sword', base: [0, 0, CAIDA_HEAD_Z - 0.3], tip: [0, 0, CAIDA_HEAD_Z + 0.18], color: '#9B5BD1', core: '#E8D8F8' };

const SPEED = { run: 8.6, sprint: 24, jump: 12, dash: 22, dashTime: 0.1 };

function props(form: BaragganForm): { key: string; model: ReturnType<typeof baragganProp>; socket: string }[] {
  return [{ key: 'sword', model: baragganProp(form === 'arrogante' ? 'granCaida' : 'arrogante'), socket: 'grip.R' }];
}

export const BARAGGAN_DEF: FighterDef = {
  id: 'baraggan',
  name: 'Baraggan Louisenbairn',
  title: 'Segunda Espada',
  build: () => ({ asset: baragganAsset('sealed'), props: props('sealed') }),
  stance: BARAGGAN_STANCE,
  clips: BARAGGAN_CLIPS,
  aura: AURA_BARAGGAN,
  blade: BLADE_ARROGANTE,
  hp: 1300,
  rei: 220,
  speed: { ...SPEED },
  radius: 0.48,
  height: 1.66,
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

/** the light chain (both forms): 'hit' opens the window, 'combo' chains, the chop's 'slam' cracks the ground */
class CutAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private hitAt = -1;
  queued = false;
  constructor(readonly kit: BaragganKit, readonly clip: string, readonly index: number, readonly last: boolean) {
    super();
    this.name = clip;
    this.mobility = 0.15;
    this.airGravity = 0.2;
    this.armor = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.62;
    this.hitAt = c.events.hit ?? -1;
    const rel = this.kit.form === 'arrogante';
    f.bladeHits.clear();
    const spec: BladeSpec = this.last
      ? { damage: rel ? 34 : 38, knock: 14, launch: 7, heavy: true, hitstop: 0.12, shake: 0.45, cut: rel ? 520 : 760, reach: 0.6 }
      : { damage: rel ? 24 : 26, knock: 12, launch: 0, heavy: !rel, hitstop: 0.07, shake: 0.2, cut: rel ? 420 : 640, reach: 0.6 };
    f.bladeSpec = spec;
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n === 'slam') this.kit.chopGround(f.pos.clone().addScaledVector(f.forward(), 2.2), rel ? 2 : 2.4, rel ? 26 : 32);
        if (n !== 'step') return;
        const tgt = f.faceTarget;
        const extra = tgt ? Math.min(4, Math.max(0, f.pos.distanceTo(tgt) - 2.2)) : 0;
        f.push.addScaledVector(f.forward(), 5 + extra * 3);
        g.sfx.play(this.last ? 'swingHeavy' : 'swing', f.center(), 0.9);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    const open = this.hitAt >= 0 && t >= this.hitAt - 0.06 && t <= this.hitAt + 0.12;
    f.bladeActive = open;
    if (f.trail) f.trail.emitting = open;
    if (open && this.kit.form === 'arrogante') this.kit.bladeMiasma();
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
    if (next.name === 'dash' || next instanceof SkillAction) return this.t >= this.hitAt + 0.05;
    return false;
  }
}

abstract class SkillAction extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: BaragganKit) {
    super();
  }
  protected playClip(f: Fighter, clip: string, onEvent: (n: string) => void, opts: { speed?: number; hold?: boolean } = {}): void {
    const c = f.anim.clip(clip)!;
    const speed = opts.speed ?? 1;
    this.dur = (c.dur - c.fadeOut * 0.5) / speed;
    f.anim.play(clip, { onEvent, speed, hold: opts.hold });
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
    return next.name === 'dash' && this.t > this.dur * 0.6;
  }
}

/** RMB (sealed): the Casual Swing — one lazy cleave; the cut runs on far past the blades */
class CasualSwingAction extends SkillAction {
  readonly name = 'heavy';
  private hit = 0.46;
  constructor(kit: BaragganKit) {
    super(kit);
    this.mobility = 0.1;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    this.hit = f.anim.clip('bg_heavy')?.events.hit ?? 0.46;
    f.bladeHits.clear();
    f.bladeSpec = { damage: 44, knock: 18, launch: 4, heavy: true, hitstop: 0.12, shake: 0.5, cut: 900, reach: 0.7 };
    this.playClip(f, 'bg_heavy', (n) => {
      if (n === 'step') g.sfx.play('swingHeavy', f.center(), 1.2);
      if (n === 'cleave') this.kit.cleave();
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const open = this.t >= this.hit - 0.08 && this.t <= this.hit + 0.14;
    f.bladeActive = open;
    if (f.trail) f.trail.emitting = open;
  }
}

/** RMB (Arrogante): the Guillotine — both hands, overhead; a slab of the world in front of him rots away */
class GuillotineAction extends SkillAction {
  readonly name = 'heavy';
  private hit = 0.42;
  constructor(kit: BaragganKit) {
    super(kit);
    this.mobility = 0.08;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    this.hit = f.anim.clip('ar_heavy')?.events.hit ?? 0.42;
    f.bladeHits.clear();
    f.bladeSpec = { damage: 50, knock: 10, launch: 9, heavy: true, hitstop: 0.14, shake: 0.55, cut: 700, reach: 0.6 };
    this.playClip(f, 'ar_heavy', (n) => {
      if (n === 'step') g.sfx.play('swingHeavy', f.center(), 1.2);
      if (n === 'slam') this.kit.guillotine();
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const open = this.t >= this.hit - 0.08 && this.t <= this.hit + 0.12;
    f.bladeActive = open;
    if (f.trail) f.trail.emitting = open;
    if (open) this.kit.bladeMiasma();
  }
}

/** Q (sealed): the aging touch — a Sonído to the target's side, two fingers on a shoulder */
class TouchAction extends SkillAction {
  readonly name = 'touch';
  constructor(kit: BaragganKit, readonly target: Fighter | null) {
    super(kit);
    this.mobility = 0;
  }
  override start(f: Fighter, g: Game): void {
    if (this.target) this.kit.sonidoBeside(this.target);
    this.playClip(f, 'bg_touch', (n) => {
      if (n === 'touch') this.kit.age(this.target);
    });
    g.callout('老衰', 'SENESCENCIA', '#D12A2A');
  }
}

/** E (sealed): the royal throw — a hand on the throat, lifted off the ground and flung */
class GrabAction extends SkillAction {
  readonly name = 'grab';
  private held: Fighter | null = null;
  constructor(kit: BaragganKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'bg_grab', (n) => {
      if (n === 'grab') this.held = this.kit.seize();
      if (n === 'throw' && this.held) {
        this.kit.fling(this.held);
        this.held = null;
      }
    });
    g.sfx.play('swing', f.center(), 0.6);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const h = this.held;
    if (!h || h.dead) return;
    // held up by the throat in his left hand
    const p = sock(f, 'grip.L', _v);
    h.body.pos.set(p.x, p.y - h.def.height * 0.82, p.z);
    h.body.prev.copy(h.body.pos);
    h.body.vel.set(0, 0, 0);
    h.hitstun = Math.max(h.hitstun, 0.3);
  }
  override end(f: Fighter): void {
    super.end(f);
    if (this.held) this.kit.fling(this.held);
    this.held = null;
  }
}

/** R (sealed): the royal flare — the reiatsu bursts off him, a dark red shockwave */
class FlareAction extends SkillAction {
  readonly name = 'royalFlare';
  constructor(kit: BaragganKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.6;
  }
  override start(f: Fighter): void {
    this.playClip(f, 'bg_flare', (n) => n === 'burst' && this.kit.royalBurst());
  }
}

/** G (sealed): Senescencia raised */
class FieldAction extends SkillAction {
  readonly name = 'field';
  constructor(kit: BaragganKit) {
    super(kit);
    this.mobility = 0.4;
  }
  override start(f: Fighter): void {
    this.playClip(f, 'bg_field', (n) => n === 'field' && this.kit.raiseField());
  }
}

/** F (sealed): "Kuchiro, Arrogante" */
class ReleaseAction extends SkillAction {
  readonly name = 'release';
  constructor(kit: BaragganKit) {
    super(kit);
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'bg_release', (n) => {
      if (n === 'word') {
        g.callout('朽ちろ「髑髏大帝」', 'KUCHIRO — ARROGANTE', '#B07ADF');
        f.aura.flare(1.6, 0.8);
        g.sfx.play('bankai', f.center(), 0.9);
      }
      if (n === 'form') this.kit.becomeArrogante();
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    // black and purple flames out of the axe's eye, climbing him
    if (this.t > 0.45 && this.t < 1.3 && this.kit.form === 'sealed') {
      const eye = this.kit.bladePoint(1);
      const c = f.center();
      for (let i = 0; i < 4; i++) {
        const k = Math.random();
        const x = eye.x + (c.x - eye.x) * k + (Math.random() - 0.5) * 0.6, z = eye.z + (c.z - eye.z) * k + (Math.random() - 0.5) * 0.6;
        const y = f.pos.y + Math.random() * f.def.height;
        miasmaPuff(g, x, y, z, (Math.random() - 0.5) * 1.2, 2 + Math.random() * 2, (Math.random() - 0.5) * 1.2, 0.7, 0.8);
      }
      g.engine.glow.spawn({ x: c.x, y: f.pos.y + Math.random() * f.def.height, z: c.z, vx: (Math.random() - 0.5) * 2, vy: 3, vz: (Math.random() - 0.5) * 2, size: 0.5, sizeEnd: 0.1, life: 0.5, r: 0.42, g: 0.12, b: 0.6, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
  }
}

/** Q (Arrogante): Respira — held while Q is down (or for its full length) */
class RespiraAction extends SkillAction {
  readonly name = 'respira';
  private breath: RespiraBreath | null = null;
  constructor(kit: BaragganKit) {
    super(kit);
    this.mobility = 0.25;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('ar_respira', { fadeIn: 0.12, hold: true });
    const enraged = this.kit.enraged;
    this.dur = enraged ? 2.8 : 2.4;
    this.breath = new RespiraBreath(g, f, () => sock(f, 'palm.L'), () => this.kit.aim(), {
      dur: this.dur, range: enraged ? 17 : 12, halfAngle: enraged ? 0.5 : 0.4, speed: enraged ? 14 : 7, power: enraged ? 70 : 48,
      touch: (o, k) => this.kit.rot(o, 9 * k, 3.5, true),
    });
    g.addProjectile(this.breath);
    g.callout('死の息吹', 'RESPIRA', '#B07ADF');
    g.sfx.play('torrent', f.center(), 0.6);
  }
  /** Q released */
  stop(): void {
    if (this.breath) this.breath.stopping = true;
    this.done = true;
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (Math.random() < dt * 3) g.sfx.play('crumble', f.center(), 0.35);
  }
  override end(f: Fighter): void {
    super.end(f);
    if (this.breath) this.breath.stopping = true;
    this.breath = null;
    f.anim.stopAll(0.25);
  }
}

/** E (Arrogante): the Respira slash — a crescent of rot thrown off the axe */
class RotSlashAction extends SkillAction {
  readonly name = 'slash';
  constructor(kit: BaragganKit) {
    super(kit);
    this.mobility = 0.15;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ar_slash', (n) => n === 'fire' && this.kit.fireSlash());
    g.sfx.play('swingHeavy', f.center(), 1);
  }
}

/** R (Arrogante): Gran Caída thrown — the action ends once it is back in his hand */
class ThrowAction extends SkillAction {
  readonly name = 'throw';
  private axe: ThrownCaida | null = null;
  constructor(kit: BaragganKit) {
    super(kit);
    this.mobility = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ar_throw', (n) => {
      if (n !== 'throw') return;
      const from = sock(f, 'grip.R');
      this.axe = new ThrownCaida(g, f, from, this.kit.aim().sub(from).normalize(), () => sock(f, 'grip.R'), { damage: 46, range: 28, touch: (o, k) => this.kit.rot(o, 8 * k, 4, true) });
      g.addProjectile(this.axe);
      this.kit.weaponAway(true);
      g.sfx.play('swingHeavy', from, 1.1);
    });
    this.dur = 6;
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.axe?.done) {
      this.axe = null;
      this.kit.weaponAway(false);
      g.sfx.play('impact', f.center(), 0.4);
      this.dur = Math.min(this.dur, this.t + 0.2);
    }
  }
  override end(f: Fighter): void {
    super.end(f);
    if (this.axe && !this.axe.done) this.axe.done = true;
    this.axe = null;
    this.kit.weaponAway(false);
  }
}

/** F (Arrogante): Respira Total */
class TotalAction extends SkillAction {
  readonly name = 'total';
  constructor(kit: BaragganKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.7;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ar_total', (n) => {
      if (n === 'gather') g.callout('死の息吹・全', 'RESPIRA TOTAL', '#B07ADF');
      if (n === 'burst') this.kit.respiraTotal();
    });
  }
}

/** G (Arrogante): enraged — a roar; the breath runs faster and further */
class RageAction extends SkillAction {
  readonly name = 'rage';
  constructor(kit: BaragganKit) {
    super(kit);
    this.mobility = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    this.dur = 0.6;
    this.kit.enraged = !this.kit.enraged;
    if (this.kit.enraged) {
      g.sfx.play('roar', f.center(), 1);
      f.aura.flare(1.5, 0.5);
      g.shake(f === g.player ? 0.3 : 0.1);
    }
  }
}

// ---------------------------------------------------------------------------------------------- the kit

/** a target rotting: damage per second for t more seconds */
interface Rot { f: Fighter; dps: number; t: number }

export class BaragganKit implements Kit {
  form: BaragganForm = 'sealed';
  flare = false;
  enraged = false;
  comboIndex = 0;
  readonly cd = { heavy: 0, touch: 0, grab: 0, royal: 0, respira: 0, slash: 0, throw: 0, total: 0 };
  private lastEnd = 0;
  private field: SenescenciaField | null = null;
  private rots = new Map<number, Rot>();
  private auraAcc = 0;
  private wallAcc = 0;
  private away = false;

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.def = { ...f.def, speed: { ...SPEED } };
    this.hands();
    this.applyStats();
  }

  private hands(): void {
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
    // Senescencia drains his reiatsu while it is up
    if (this.field) {
      f.rei -= dt * 7;
      if (f.rei <= 0 || f.dead || this.form !== 'sealed') this.dropField();
    }
    // enraged, the rot eats him too
    if (this.enraged && f.hp > f.maxHp * 0.15) f.hp -= f.maxHp * 0.006 * dt;
    this.updateRots(dt);
    if (this.form === 'arrogante' && !f.dead) this.rotAura(dt);
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
    return f.center(out).addScaledVector(f.forward(_w), 40);
  }

  bladePoint(k: number, out = new THREE.Vector3()): THREE.Vector3 {
    const f = this.f;
    const prop = f.visual.props.get('sword');
    const b = f.def.blade;
    if (!prop || !b) return f.center(out);
    prop.updateWorldMatrix(true, false);
    out.set(b.base[0] + (b.tip[0] - b.base[0]) * k, b.base[1] + (b.tip[1] - b.base[1]) * k, b.base[2] + (b.tip[2] - b.base[2]) * k);
    return out.applyMatrix4(prop.matrixWorld);
  }

  // ---------------------------------------------------------------- the rot

  /** rot a fighter: damage over time (refreshed, the stronger dose wins); `burst` adds a little at once */
  rot(o: Fighter, dps: number, t: number, quietHit = false): void {
    if (o.dead) return;
    const cur = this.rots.get(o.id);
    if (cur) {
      cur.dps = Math.max(cur.dps, dps);
      cur.t = Math.max(cur.t, t);
    } else this.rots.set(o.id, { f: o, dps, t });
    if (quietHit) o.slow(0.25, 0.4);
  }

  private updateRots(dt: number): void {
    const g = this.g;
    for (const [id, r] of this.rots) {
      r.t -= dt;
      if (r.t <= 0 || r.f.dead) {
        this.rots.delete(id);
        continue;
      }
      g.drain(r.f, r.dps * dt, this.f);
      if (Math.random() < dt * 8) {
        const c = r.f.center();
        miasmaPuff(g, c.x + (Math.random() - 0.5) * 0.5, r.f.pos.y + Math.random() * r.f.def.height, c.z + (Math.random() - 0.5) * 0.5, 0, 0.8, 0, 0.45, 0.8);
      }
    }
  }

  /** Arrogante: the ground rots under his feet, walls beside him decay, those close wither, reishi ages */
  private rotAura(dt: number): void {
    const { f, g } = this;
    this.auraAcc += dt;
    if (this.auraAcc > 0.22) {
      this.auraAcc = 0;
      const gy = f.body.grounded ? f.pos.y : groundAt(g, f.pos.x, f.pos.y + 0.5, f.pos.z, 3);
      if (gy !== null) g.engine.destruction.carve(new BoxShape(new THREE.Vector3(f.pos.x, gy - 0.3, f.pos.z), new THREE.Vector3(1.6, 0.45, 1.6)), { mode: 'rot', power: 60, rotOnly: true, noCollapse: true, dust: 0 });
      for (const o of g.enemiesOf(f)) if (!o.dead && o.pos.distanceTo(f.pos) < (this.enraged ? 4.5 : 3.5)) this.rot(o, this.enraged ? 7 : 4, 1.2);
    }
    this.wallAcc += dt;
    if (this.wallAcc > 0.7) {
      this.wallAcc = 0;
      g.engine.destruction.carve(new SphereShape(f.center(), this.enraged ? 3.4 : 2.6), { mode: 'rot', power: 60, rotOnly: true, noCollapse: true, dust: 0 });
    }
    // a low haze round his feet
    if (Math.random() < dt * 14) {
      const a = Math.random() * Math.PI * 2, r = 0.4 + Math.random() * 1.2;
      miasmaPuff(g, f.pos.x + Math.cos(a) * r, f.pos.y + 0.15, f.pos.z + Math.sin(a) * r, Math.cos(a) * 0.6, 0.15, Math.sin(a) * 0.6, 0.6, 1.1);
    }
  }

  /** while Gran Caída is in a cut: a trail of miasma off the head */
  bladeMiasma(): void {
    const p = this.bladePoint(0.8, _w);
    miasmaPuff(this.g, p.x, p.y, p.z, 0, 0.3, 0, 0.55, 0.6);
  }

  // ---------------------------------------------------------------- techniques

  /** the chop: the blades bite into the ground */
  chopGround(at: THREE.Vector3, r: number, damage: number): void {
    const { f, g } = this;
    const gy = groundAt(g, at.x, at.y + 1, at.z, 4);
    if (gy === null) return;
    const p = new THREE.Vector3(at.x, gy, at.z);
    g.groundImpact(p, r, 340 + r * 80, this.form === 'arrogante' ? '#5B2A7A' : BARAGGAN_RED, f);
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      _v.subVectors(o.pos, p).setY(0);
      if (_v.length() > r * 1.5 + o.def.radius) continue;
      g.damage(o, damage, f, _v.normalize().clone(), { knock: 10, launch: 6, heavy: true, hitstop: 0.08, shake: 0.4 });
      if (this.form === 'arrogante') this.rot(o, 8, 4);
    }
    if (this.form === 'arrogante') for (let i = 0; i < 14; i++) miasmaPuff(g, p.x + (Math.random() - 0.5) * r, p.y + 0.2, p.z + (Math.random() - 0.5) * r, (Math.random() - 0.5) * 3, 1, (Math.random() - 0.5) * 3, 1, 1);
  }

  /** the Casual Swing's cut: a flat plane running far out in front of him at chest height */
  cleave(): void {
    const { f, g } = this;
    const fw = f.forward(new THREE.Vector3()).setY(0).normalize();
    const len = 22, y = f.pos.y + 1.1;
    const c = f.pos.clone().addScaledVector(fw, len / 2 + 1);
    c.y = y;
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(fw.x, fw.z));
    // the cut fans out as it runs: a thin slab, wider far from him
    g.engine.destruction.carve(new BoxShape(c, new THREE.Vector3(5, 0.18, len / 2), q), { mode: 'cut', power: 1100, dir: fw.clone(), sparks: [1, 0.55, 0.5], dust: 0.6 });
    const side = new THREE.Vector3(fw.z, 0, -fw.x);
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      _v.subVectors(o.pos, f.pos);
      const along = _v.dot(fw), across = Math.abs(_v.dot(side));
      if (along < 1.5 || along > len + 1 || across > 2 + along * 0.18 + o.def.radius) continue;
      if (Math.abs(y - (o.pos.y + o.def.height * 0.5)) > o.def.height * 0.5 + 0.8) continue;
      g.damage(o, 46, f, fw.clone(), { knock: 16, launch: 3, heavy: true, hitstop: 0.12, shake: 0.45 });
      g.sparks(o.center(), fw, '#F2A08A', 18);
    }
    // the line of the cut glinting as it runs out
    for (let i = 0; i < 26; i++) {
      const d = 1.5 + Math.random() * len;
      const s = (Math.random() - 0.5) * (2 + d * 0.3);
      g.engine.glow.spawn({ x: f.pos.x + fw.x * d + side.x * s, y, z: f.pos.z + fw.z * d + side.z * s, vx: fw.x * 30, vz: fw.z * 30, size: 0.3, sizeEnd: 0.05, life: 0.25, r: 1, g: 0.6, b: 0.55, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 4 });
    }
    if (f === g.player) g.shake(0.3);
  }

  /** the Guillotine: a slab of the world in front of him rots through */
  guillotine(): void {
    const { f, g } = this;
    const fw = f.forward(new THREE.Vector3()).setY(0).normalize();
    const len = 14;
    const c = f.pos.clone().addScaledVector(fw, len / 2 + 1.2);
    c.y += 3;
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(fw.x, fw.z));
    g.engine.destruction.carve(new BoxShape(c, new THREE.Vector3(0.7, 5, len / 2), q), { mode: 'rot', power: 320, edge: 0.6, dir: fw.clone(), dust: 1 });
    const side = new THREE.Vector3(fw.z, 0, -fw.x);
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      _v.subVectors(o.pos, f.pos);
      const along = _v.dot(fw), across = Math.abs(_v.dot(side));
      if (along < 0.5 || along > len + 1.5 || across > 1.2 + o.def.radius) continue;
      g.damage(o, 40, f, fw.clone(), { knock: 6, launch: 6, heavy: true, hitstop: 0.1, shake: 0.4 });
      this.rot(o, 12, 5);
    }
    for (let i = 0; i < 40; i++) {
      const d = 1 + Math.random() * len;
      miasmaPuff(g, f.pos.x + fw.x * d, f.pos.y + Math.random() * 3, f.pos.z + fw.z * d, (Math.random() - 0.5), 1.5, (Math.random() - 0.5), 1.2, 1.2);
    }
    this.chopGround(f.pos.clone().addScaledVector(fw, 2.2), 1.6, 0);
  }

  /** the aging touch lands (if the target is still within reach) */
  age(o: Fighter | null): void {
    const { f, g } = this;
    if (!o || o.dead || o.pos.distanceTo(f.pos) > 2.6) {
      g.sfx.play('swing', f.center(), 0.4);
      return;
    }
    _v.subVectors(o.pos, f.pos).setY(0).normalize();
    g.damage(o, 14, f, _v.clone(), { knock: 2, hitstop: 0.14, shake: 0.2 });
    o.agedK = 0.35;
    o.agedT = 7;
    o.slow(0.35, 7);
    const c = o.center();
    for (let i = 0; i < 18; i++) g.engine.dust.spawn({ x: c.x + (Math.random() - 0.5) * 0.6, y: c.y + Math.random() * 0.6, z: c.z + (Math.random() - 0.5) * 0.6, vx: (Math.random() - 0.5) * 1.5, vy: -0.2 + Math.random() * 0.6, vz: (Math.random() - 0.5) * 1.5, size: 0.3, sizeEnd: 1.2, life: 1.4, r: 0.48, g: 0.44, b: 0.37, alpha: 0.6, alphaEnd: 0, drag: 1.2 });
    g.sfx.play('crack', c, 0.8);
    if (o === g.player || f === g.player) g.hud?.showBanner(`${o.name}: aged — brittle bones`);
  }

  /** a Sonído to the target's side, just out of the way of its sword arm */
  sonidoBeside(t: Fighter): void {
    const { f, g } = this;
    const d = f.pos.distanceTo(t.pos);
    if (d < 2 || d > 14) return;
    const tf = t.forward(new THREE.Vector3());
    const side = new THREE.Vector3(tf.z, 0, -tf.x);
    const to = t.pos.clone().addScaledVector(side, 1.3).addScaledVector(tf, 0.3);
    const gy = groundAt(g, to.x, to.y + 1, to.z, 6);
    if (gy !== null) to.y = gy;
    if (f.body.overlaps(to.x, to.y + 0.05, to.z)) return;
    f.ghosts.spawn(0.8, 1);
    f.body.pos.copy(to);
    f.body.prev.copy(to);
    f.renderPos.copy(to);
    f.yaw = Math.atan2(t.pos.x - to.x, t.pos.z - to.z);
    g.onDash(f);
  }

  /** the royal throw: whoever is right in front of him, by the throat */
  seize(): Fighter | null {
    const { f, g } = this;
    const fw = f.forward(new THREE.Vector3());
    let best: Fighter | null = null, bd = 2.8;
    for (const o of g.enemiesOf(f)) {
      if (o.dead || o.def.boss) continue;
      _v.subVectors(o.pos, f.pos).setY(0);
      const d = _v.length();
      if (d < bd && _v.normalize().dot(fw) > 0.3) {
        best = o;
        bd = d;
      }
    }
    if (!best) return null;
    best.stopAction();
    best.hitstun = 0.6;
    g.damage(best, 10, f, fw, { knock: 0, hitstop: 0.1, shake: 0.2 });
    return best;
  }

  fling(o: Fighter): void {
    const { f, g } = this;
    const fw = f.forward(new THREE.Vector3());
    const side = new THREE.Vector3(fw.z, 0, -fw.x);
    const dir = side.multiplyScalar(-0.75).addScaledVector(fw, 0.66).normalize();
    o.body.pos.addScaledVector(dir, 0.6);
    o.body.prev.copy(o.body.pos);
    g.damage(o, 30, f, dir, { knock: 34, launch: 7, heavy: true, hitstop: 0.12, shake: 0.5 });
    g.sfx.play('swingHeavy', o.center(), 1);
  }

  /** the royal flare: the shockwave off him */
  royalBurst(): void {
    const { f, g } = this;
    const c = f.center();
    g.addRing(f.pos.clone().setY(f.pos.y + 0.3), 8, BARAGGAN_RED, 0.6);
    g.addRing(f.pos.clone().setY(f.pos.y + 1.2), 5, '#D12A2A', 0.4);
    f.aura.flare(1.8, 0.5);
    f.aura.pillarBurst(2.4);
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      _v.subVectors(o.pos, f.pos).setY(0);
      const d = _v.length();
      if (d > 7.5 + o.def.radius) continue;
      g.damage(o, 22 * (1 - d / 10), f, _v.normalize().clone(), { knock: 22, launch: 4, heavy: true, hitstop: 0.06, shake: 0.4, energy: true });
    }
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: Math.cos(a) * 14, vy: (Math.random() - 0.3) * 4, vz: Math.sin(a) * 14, size: 0.4, sizeEnd: 0.05, life: 0.5, r: 0.7, g: 0.08, b: 0.1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 2 });
    }
    g.sfx.play('flare', c, 1);
    if (f === g.player) g.shake(0.4);
  }

  raiseField(): void {
    const { f, g } = this;
    if (this.field) return;
    this.field = new SenescenciaField(g, f, 7, 0.6);
    g.addProjectile(this.field);
    g.sfx.play('charge', f.center(), 0.5);
  }

  private dropField(): void {
    if (!this.field) return;
    this.field.ending = true;
    this.field = null;
  }

  becomeArrogante(): void {
    const { f, g } = this;
    if (this.form === 'arrogante') return;
    this.dropField();
    this.form = 'arrogante';
    f.def = { ...f.def, stance: ARROGANTE_STANCE, blade: BLADE_CAIDA };
    f.setForm({ asset: baragganAsset('arrogante'), props: props('arrogante') }, AURA_ARROGANTE, BLADE_CAIDA);
    this.hands();
    f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.35);
    f.aura.flare(1.8, 0.6);
    g.shake(f === g.player ? 0.45 : 0.15);
    const c = f.center();
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2;
      miasmaPuff(g, c.x, f.pos.y + Math.random() * 2, c.z, Math.cos(a) * 5, Math.random() * 2, Math.sin(a) * 5, 1.2, 1.4);
    }
    this.applyStats();
  }

  weaponAway(away: boolean): void {
    this.away = away;
    const prop = this.f.visual.props.get('sword');
    if (prop) prop.visible = !away;
    this.f.bladeValid = false;
  }

  fireSlash(): void {
    const { f, g } = this;
    const from = this.bladePoint(0.6);
    const dir = this.aim().sub(from).normalize();
    const side = new THREE.Vector3(dir.z, 0.6, -dir.x).normalize();
    g.addProjectile(new GetsugaProjectile(g, f, from, dir, side, {
      radius: this.enraged ? 3.4 : 2.7, halfAngle: 1.0, speed: 34, range: 46, damage: 58, cut: 460, colors: RESPIRA, dark: true, mode: 'rot',
      onHit: (o) => this.rot(o, 10, 5),
    }));
    g.sfx.play('getsugaBlack', from, 0.9);
  }

  respiraTotal(): void {
    const { f, g } = this;
    g.addProjectile(new RespiraTotal(g, f, f.pos.clone(), {
      radius: this.enraged ? 20 : 16, dur: 1.7, power: 260,
      touch: (o) => {
        _v.subVectors(o.pos, f.pos).setY(0).normalize();
        g.damage(o, 64, f, _v.clone(), { knock: 14, launch: 4, heavy: true, hitstop: 0.1, shake: 0.5, energy: true });
        this.rot(o, 14, 6);
      },
    }));
    f.aura.flare(2, 0.8);
    g.sfx.play('roarBig', f.center(), 0.9);
    g.sfx.play('crumble', f.center(), 1);
    if (f === g.player) g.shake(0.5);
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

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof CutAction) {
      cur.queued = true;
      return;
    }
    if (f.busy || this.away) return;
    if (this.g.time - this.lastEnd > 0.7) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const list = this.form === 'arrogante' ? ARROGANTE_CHAIN : BARAGGAN_CHAIN;
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    this.lastEnd = this.g.time + 0.8;
    this.f.act(new CutAction(this, list[idx], idx, idx === list.length - 1), true);
  }

  heavy(): void {
    if (this.away) return;
    if (this.form === 'arrogante') this.special(new GuillotineAction(this), 16, 'heavy', 3.6);
    else this.special(new CasualSwingAction(this), 16, 'heavy', 4);
  }

  /** Q: the aging touch / Respira (again: stop pouring) */
  skill1(): void {
    const cur = this.f.action;
    if (cur instanceof RespiraAction) {
      cur.stop();
      return;
    }
    if (this.form === 'arrogante') this.special(new RespiraAction(this), 30, 'respira', 5);
    else this.special(new TouchAction(this, this.target()), 18, 'touch', 6);
  }

  /** E: the royal throw / the Respira slash */
  skill2(): void {
    if (this.form === 'arrogante') this.special(new RotSlashAction(this), 24, 'slash', 3.2);
    else this.special(new GrabAction(this), 14, 'grab', 5);
  }

  /** R: the royal flare / Gran Caída thrown */
  skill3(): void {
    if (this.form === 'arrogante') {
      if (!this.away) this.special(new ThrowAction(this), 20, 'throw', 4);
    } else this.special(new FlareAction(this), 26, 'royal', 7);
  }

  /** G: Senescencia / enraged */
  toggle(): void {
    const f = this.f;
    if (this.form === 'arrogante') {
      if (!f.busy) f.act(new RageAction(this), true);
      return;
    }
    if (this.field) {
      this.dropField();
      return;
    }
    if (f.busy || f.rei < 20) return;
    f.act(new FieldAction(this), true);
  }

  release(): void {
    const { f, g } = this;
    if (this.form === 'arrogante') {
      this.special(new TotalAction(this), 60, 'total', 20);
      return;
    }
    if (f.busy) return;
    if (!f.spendRei(40)) {
      if (f === g.player) g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(new ReleaseAction(this), true);
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
    const rel = this.form === 'arrogante';
    f.power = (rel ? 1.2 : 1) * (this.enraged ? 1.15 : 1) * (this.flare ? 1.25 : 1);
    // enhanced Hierro; released, reishi ages to nothing before it reaches him
    f.damageTaken = rel ? 0.85 : 0.92;
    f.energyTaken = rel ? 0.55 : 1;
    f.aura.target = this.flare ? 1 : this.field ? 0.3 : rel ? (this.enraged ? 0.5 : 0.25) : 0.08;
  }

  formName(): string {
    if (this.form === 'arrogante') return `Resurrección — Arrogante${this.enraged ? ' · enraged' : ''}`;
    return `Segunda Espada${this.field ? ' · Senescencia' : ''}`;
  }

  ai(): KitAI {
    const sealed = () => this.form === 'sealed', rel = () => this.form === 'arrogante';
    const kit = this;
    return {
      reach: 2.6,
      chain: 3,
      releaseAt: [0.55],
      toggleAt: 0.85,
      toggleOn: () => (kit.form === 'arrogante' ? kit.enraged : kit.field !== null),
      moves: [
        { name: 'casual', use: () => this.heavy(), min: 3, max: 16, weight: 1.2, cd: 4, when: sealed },
        { name: 'touch', use: () => this.skill1(), min: 3, max: 12, weight: 1, cd: 7, when: sealed },
        { name: 'grab', use: () => this.skill2(), min: 0, max: 2.6, weight: 0.8, cd: 6, when: sealed },
        { name: 'royal', use: () => this.skill3(), min: 0, max: 6, weight: 0.7, cd: 8, when: sealed },
        { name: 'respira', use: () => this.skill1(), min: 2, max: 11, weight: 1.4, cd: 6, when: rel },
        { name: 'slash', use: () => this.skill2(), min: 6, max: 40, weight: 1, cd: 4, when: rel },
        { name: 'throw', use: () => this.skill3(), min: 8, max: 26, weight: 0.9, cd: 5, when: rel },
        { name: 'guillotine', use: () => this.heavy(), min: 0, max: 5, weight: 1.1, cd: 4, when: rel },
        { name: 'total', use: () => this.release(), min: 0, max: 14, weight: 1.3, cd: 18, when: () => rel() && this.f.rei >= 60 },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd, list: AbilityInfo[] = [];
    if (this.form === 'arrogante') {
      list.push(
        { key: 'LMB', name: 'Gran Caída', kanji: '滅' },
        { key: 'RMB', name: 'Guillotine', kanji: '断頭', cost: 16, cd: cd.heavy, cdMax: 3.6 },
        { key: 'Q', name: 'Respira', kanji: '死息', cost: 30, cd: cd.respira, cdMax: 5 },
        { key: 'E', name: 'Respira slash', kanji: '朽刃', cost: 24, cd: cd.slash, cdMax: 3.2 },
        { key: 'R', name: 'Axe throw', kanji: '斧', cost: 20, cd: cd.throw, cdMax: 4, active: this.away },
        { key: 'Shift', name: 'Sonído', kanji: '響転' },
        { key: 'G', name: 'Enraged', kanji: '激昂', active: this.enraged },
        { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
        { key: 'F', name: 'Respira Total', kanji: '全', cost: 60, cd: cd.total, cdMax: 20 },
      );
      return list;
    }
    list.push(
      { key: 'LMB', name: 'Arrogante', kanji: '王' },
      { key: 'RMB', name: 'Casual swing', kanji: '一閃', cost: 16, cd: cd.heavy, cdMax: 4 },
      { key: 'Q', name: 'Aging touch', kanji: '老衰', cost: 18, cd: cd.touch, cdMax: 6 },
      { key: 'E', name: 'Royal throw', kanji: '投', cost: 14, cd: cd.grab, cdMax: 5 },
      { key: 'R', name: 'Royal flare', kanji: '王圧', cost: 26, cd: cd.royal, cdMax: 7 },
      { key: 'Shift', name: 'Sonído', kanji: '響転' },
      { key: 'G', name: 'Senescencia', kanji: '時', active: this.field !== null },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      { key: 'F', name: 'Arrogante', kanji: '髑髏大帝', cost: 40 },
    );
    return list;
  }
}

void ARROGANTE_REACH;
