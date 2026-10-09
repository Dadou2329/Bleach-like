// Shinji Hirako's kit (docs/roster/D-visored.md §2, Kit proposal). Sealed: a lazy one-handed five-cut chain off
// the shoulder (the left hand stays in his pocket); RMB the two-handed draw-cut that splits what it passes; Q
// Tanma Otoshi (the palm laid over a face: lights out); E Hadō #91 Senju Kōten Taihō, chantless (ten points of
// light round him, a converging barrage, one great blast); R the force blast flicked from the fingers that
// knocks a charging attack aside; G the Hollow mask (faster and stronger; E becomes the wide crimson Cero lined
// up before the sword hand); F "Taorero, Sakanade". Shikai: the sword hangs from his finger by its ring and
// spins (the kit drives it about the ring); LMB the ring-spin chain, every spin venting the pink mist and
// putting some of it in whoever it cuts; RMB the counter stroke (far worse on someone whose world is upside
// down — they guard the wrong side); Q Sakasama no Sekai (the mist cloud: a full lungful turns the victim's
// world over: the AI goes for the mirror image behind it, the player's view rolls upside down and the aim
// assist is lost); R the drop onto the nape; F "Bankai — Sakashima Yokoshima Happōfusagari": the golden
// flower blooms and shuts round him, its mist rolls out over the field and everyone in it but him has friend
// and foe reversed (an AI with no one of its own to turn on drifts away, lost; a player's blows find only their
// own side). Rooted in the flower: LMB the petals open on a cut, RMB the ring thrust through them, Q the bloom
// pulse that pushes the mist further, R the petals clamped shut, F uproot (back to Shikai; the mist lingers).
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { SAKANADE_BASE_Z, SAKANADE_RING_Z, SAKANADE_TIP_Z, shinjiAsset, shinjiProp } from '../../chars/shinji';
import { SAKANADE_CHAIN, SAKANADE_STANCE, SHINJI_CHAIN, SHINJI_CLIPS, SHINJI_STANCE } from '../../chars/shinjiClips';
import { HappoFlower, MIST_PINK, MistCloud, SHINJI_CERO, SenjuKoten, ceroBar, invertBurst, mistPuff } from '../../vfx/sakanade';
import { GetsugaProjectile } from '../projectiles/getsuga';
import { SphereShape } from '../../destruction/shapes';
import { groundAt } from '../../vfx/iceArts';
import { TEX_GLOW, TEX_STREAK } from '../../vfx/sprites';
import type { AuraStyle } from '../../vfx/aura';

/** his reiatsu: a pale gold (ext. — canon never states it) */
export const AURA_SHINJI: AuraStyle = { core: '#FFF6D8', body: '#F3E2A0', rim: '#8A7A3A' };
/** masked: the gold with a crimson-black rim */
export const AURA_SHINJI_MASK: AuraStyle = { core: '#FFE9C8', body: '#D9B860', rim: '#6A0A18' };
const GOLD = '#E2B23A';
const CERO_RED = '#D0213A';
const KIDO_GOLD = '#FFF0B0';

type BladeDef = NonNullable<FighterDef['blade']>;
const BLADE: BladeDef = { prop: 'sword', base: [0, 0, SAKANADE_BASE_Z], tip: [0, 0, SAKANADE_TIP_Z], color: '#E8ECF2', core: '#FFFFFF' };
const BLADE_SHIKAI: BladeDef = { prop: 'sword', base: [0, 0, 8 / 48], tip: [0, 0, SAKANADE_TIP_Z], color: '#F6A3C7', core: '#FFE6F0' };
const BLADE_BANKAI: BladeDef = { ...BLADE_SHIKAI, tip: [0, 0, (38 + 4.8) / 48], color: '#F0C850', core: '#FFF4D0' };

const SPEED = { run: 9.8, sprint: 28, jump: 13, dash: 28, dashTime: 0.1 };

type Form = 'sealed' | 'shikai' | 'bankai';

function props(): { key: string; model: ReturnType<typeof shinjiProp>; socket: string }[] {
  return [{ key: 'sword', model: shinjiProp('katana'), socket: 'grip.R' }];
}

export const SHINJI_DEF: FighterDef = {
  id: 'shinji',
  name: 'Shinji Hirako',
  title: 'Leader of the Visored',
  build: () => ({ asset: shinjiAsset(), props: props() }),
  stance: SHINJI_STANCE,
  clips: SHINJI_CLIPS,
  aura: AURA_SHINJI,
  blade: BLADE,
  hp: 1000,
  rei: 240,
  speed: { ...SPEED },
  radius: 0.36,
  height: 1.76,
};

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const X = new THREE.Vector3(1, 0, 0);
const UP = new THREE.Vector3(0, 1, 0);
/** the ring on the finger: the ring's axis along the finger (palm −Y), the sword wheeling round it */
const Q_SPIN = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2);
/** the sword hanging straight out past the finger (a thrust, a drop, planted) */
const Q_HOLD = new THREE.Quaternion().setFromAxisAngle(X, Math.PI / 2);
const TAU = Math.PI * 2;

function bonePos(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const rig = f.visual.rig;
  const s = rig.sockets.get(name);
  if (s) {
    s.updateWorldMatrix(true, false);
    return s.getWorldPosition(out);
  }
  const i = rig.index(name);
  if (i < 0) return f.center(out);
  rig.bones[i].updateWorldMatrix(true, false);
  return rig.bones[i].getWorldPosition(out);
}

// ---------------------------------------------------------------------------------------------- actions

interface CutOpts {
  kind?: 'draw' | 'counter';
}

/** the light chains (sealed cuts, Shikai ring-spins) and the blade heavies */
class CutAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private hitAt = -1;
  private stopAt = 0;
  queued = false;
  constructor(readonly kit: ShinjiKit, readonly clip: string, readonly index: number, readonly last: boolean, readonly o: CutOpts = {}) {
    super();
    this.name = o.kind ?? clip;
    this.mobility = 0.2;
    this.airGravity = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.62;
    this.hitAt = c.events.hit ?? -1;
    f.bladeHits.clear();
    const kit = this.kit;
    const spin = kit.form !== 'sealed';
    const k = this.o.kind;
    let spec: BladeSpec;
    if (k === 'draw') spec = { damage: 40, knock: 16, launch: 3, heavy: true, hitstop: 0.11, shake: 0.4, cut: 760, reach: 0.28 };
    else if (k === 'counter') {
      // the stroke from the side they do not guard: an inverted enemy guards the wrong one
      const t = kit.target() ?? kit.trueTarget();
      const open = t !== null && t.invertT > 0;
      spec = { damage: open ? 60 : 32, knock: 12, launch: 2, heavy: true, hitstop: open ? 0.14 : 0.09, shake: open ? 0.45 : 0.3, cut: 520, reach: 0.3 };
      if (open) g.callout('', 'COUNTER STROKE', MIST_PINK);
    } else if (spin) {
      spec = this.last
        ? { damage: 26, knock: 9, launch: 2, heavy: true, hitstop: 0.08, shake: 0.25, cut: 480, reach: 0.3 }
        : { damage: 16, knock: 4, launch: 0, heavy: false, hitstop: 0.04, shake: 0.12, cut: 400, reach: 0.28 };
      // whoever the spinning blade cuts breathes some of the mist out of its holes
      spec.onHit = (o) => kit.scent(o, this.last ? 0.3 : 0.2);
    } else spec = this.last
      ? { damage: 30, knock: 14, launch: 3, heavy: true, hitstop: 0.09, shake: 0.3, cut: 520, reach: 0.24 }
      : { damage: 19, knock: 5, launch: 0, heavy: false, hitstop: 0.05, shake: 0.14, cut: 420, reach: 0.22 };
    f.bladeSpec = spec;
    if (spin) kit.spinFor(k === 'counter' ? 0 : 4.6, k === 'counter' ? 1 : 0);
    // close the gap so the edge (or the wheeling blade) arrives where the target stands: dash at the start of
    // the swing, timed to cover the distance by the time the edge comes round, and stop at striking distance
    const tgt = f.faceTarget;
    let dashed = false;
    if (tgt && this.hitAt > 0) {
      const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
      this.stopAt = spin ? 1.45 : k === 'draw' ? 1.35 : 1.2;
      if (d > this.stopAt + 0.25) {
        const tau = Math.max(0.06, this.hitAt - 0.07);
        const per = (1 - Math.exp(-f.pushDrag * tau)) / f.pushDrag;
        f.push.addScaledVector(f.forward(), Math.min(30, (d - this.stopAt) / per));
        dashed = true;
      }
    }
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n !== 'step') return;
        if (!dashed) f.push.addScaledVector(f.forward(), k === 'draw' ? 6 : 3);
        g.sfx.play(this.last || k ? 'swingHeavy' : 'swing', f.center(), 0.8);
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
    const spin = this.kit.form !== 'sealed';
    const open = this.hitAt >= 0 && t >= this.hitAt - (spin ? 0.1 : 0.07) && t <= this.hitAt + (spin ? 0.16 : 0.12);
    f.bladeActive = open;
    if (f.trail) f.trail.emitting = open;
    // the spinning blade vents the mist from its five holes
    if (spin && open && Math.random() < 0.7) mistPuff(g, _v.lerpVectors(f.blade.base, f.blade.tip, 0.5), 1, 0.7);
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
  constructor(readonly kit: ShinjiKit) {
    super();
  }
  protected playClip(f: Fighter, clip: string, onEvent: (n: string) => void): void {
    const c = f.anim.clip(clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.anim.play(clip, { onEvent });
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
    return next.name === 'dash' && this.t > this.dur * 0.55;
  }
}

/** Q (sealed): Tanma Otoshi — a step in, the palm over the face, a white light */
class TanmaAction extends SkillAction {
  readonly name = 'tanma';
  private stopAt = 0;
  constructor(kit: ShinjiKit) {
    super(kit);
    this.mobility = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('sh_tanma')!;
    this.playClip(f, 'sh_tanma', (n) => {
      if (n === 'step') {
        const tgt = f.faceTarget;
        let push = 6;
        if (tgt) {
          const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
          this.stopAt = 0.95;
          const tau = Math.max(0.05, (c.events.grab ?? 0.18) - (c.events.step ?? 0));
          const per = (1 - Math.exp(-f.pushDrag * tau)) / f.pushDrag;
          push = Math.min(30, Math.max(6, Math.max(0, d - this.stopAt) / per));
        }
        f.push.addScaledVector(f.forward(), push);
        g.sfx.play('shunpo', f.center(), 0.5);
      }
      if (n === 'grab') this.kit.tanma();
    });
    g.callout('タンマ落とし', 'TANMA OTOSHI', '#F3F3F0');
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const tgt = f.faceTarget;
    if (this.stopAt > 0 && tgt && Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z) <= this.stopAt) {
      f.push.x = 0;
      f.push.z = 0;
      this.stopAt = 0;
    }
  }
}

/** E: Hadō #91 Senju Kōten Taihō — the lights gather while the hand is raised, then loose on the thrust */
class Kido91Action extends SkillAction {
  readonly name = 'kido91';
  private lights: SenjuKoten | null = null;
  constructor(kit: ShinjiKit) {
    super(kit);
    this.mobility = 0.05;
    this.armor = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'sh_kido91', (n) => {
      if (n === 'gather') {
        this.lights = this.kit.senju();
        g.sfx.play('charge', f.center(), 0.9);
      }
      if (n === 'fire') this.lights?.fire();
    });
    g.callout('破道の九十一「千手皎天汰炮」', 'HADŌ #91 — SENJU KŌTEN TAIHŌ', KIDO_GOLD);
  }
  override end(f: Fighter): void {
    super.end(f);
    // cut off before the thrust: the lights go out
    if (this.lights && this.t < 0.9) this.lights.done = true;
  }
}

/** R (sealed): the force blast flicked from the left fingers */
class ForceAction extends SkillAction {
  readonly name = 'force';
  constructor(kit: ShinjiKit) {
    super(kit);
    this.mobility = 0.15;
  }
  override start(f: Fighter): void {
    this.playClip(f, 'sh_force', (n) => n === 'fire' && this.kit.force());
  }
}

/** F (sealed): "Taorero, Sakanade" */
class ShikaiAction extends SkillAction {
  readonly name = 'release';
  constructor(kit: ShinjiKit) {
    super(kit);
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'sh_release', (n) => {
      if (n === 'call') {
        g.callout('倒れろ「逆撫」', 'TAORERO, SAKANADE', MIST_PINK);
        g.sfx.play('flare', f.center(), 0.8);
      }
      if (n === 'ring') this.kit.becomeShikai();
    });
  }
}

/** G: the mask drawn down over the face (or let fall) */
class MaskAction extends SkillAction {
  readonly name = 'mask';
  constructor(kit: ShinjiKit) {
    super(kit);
    this.mobility = 0.3;
    this.invulnerable = true;
  }
  override start(f: Fighter): void {
    this.playClip(f, 'sh_mask', (n) => n === 'on' && this.kit.setMask(!this.kit.masked));
  }
}

/** E (masked): the Cero — a bar of crimson before the sword hand, then the wide fan of it */
class CeroAction extends SkillAction {
  readonly name = 'cero';
  private charging = false;
  constructor(kit: ShinjiKit) {
    super(kit);
    this.mobility = 0.05;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'sh_cero', (n) => {
      if (n === 'charge') {
        this.charging = true;
        g.sfx.play('charge', f.center(), 1);
      }
      if (n === 'fire') {
        this.charging = false;
        this.kit.cero();
      }
    });
    g.callout('虚閃', 'CERO', CERO_RED);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.charging) this.kit.ceroCharge(Math.min(1, Math.max(0, (this.t - 0.1) / 0.32)));
  }
}

/** Q (Shikai): Sakasama no Sekai — the sword spun fast overhead, the mist pouring out */
class MistAction extends SkillAction {
  readonly name = 'mist';
  constructor(kit: ShinjiKit) {
    super(kit);
    this.mobility = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    this.kit.spinFor(7, 0, 1.0);
    this.playClip(f, 'sk_mist', (n) => n === 'mist' && this.kit.mist());
    g.callout('逆様の世界へようこそ', 'SAKASAMA NO SEKAI E YŌKOSO', MIST_PINK);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t > 0.15 && this.t < 1.0 && Math.random() < 0.8) mistPuff(g, _v.lerpVectors(f.blade.base, f.blade.tip, 0.5), 2, 1.1);
  }
}

/** R (Shikai): up over the target, down onto the back of its neck */
class NapeAction extends SkillAction {
  readonly name = 'nape';
  private hitAt = 0.42;
  private struck = false;
  constructor(kit: ShinjiKit) {
    super(kit);
    this.mobility = 0;
    this.airGravity = 1;
    this.armor = 0.3;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    this.hitAt = f.anim.clip('sk_nape')?.events.hit ?? 0.42;
    this.kit.spinFor(0, 1);
    this.playClip(f, 'sk_nape', (n) => n === 'leap' && this.kit.leapOver());
    g.sfx.play('swingHeavy', f.center(), 0.9);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.struck && this.t >= this.hitAt) {
      this.struck = true;
      this.kit.napeStab();
    }
  }
}

/** F (Shikai): Bankai — the blade planted, the flower bursting up round him */
class BankaiAction extends SkillAction {
  readonly name = 'release';
  constructor(kit: ShinjiKit) {
    super(kit);
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    this.kit.spinFor(0, 1, 1.4);
    this.playClip(f, 'sk_bankai', (n) => {
      if (n === 'plant') {
        g.sfx.play('impact', f.pos, 1);
        mistPuff(g, f.pos.clone().setY(f.pos.y + 0.2), 6, 1.4);
      }
      if (n === 'bloom') this.kit.becomeBankai();
    });
    g.callout('卍解「逆様邪八宝塞」', 'BANKAI — SAKASHIMA YOKOSHIMA HAPPŌFUSAGARI', GOLD);
    f.aura.flare(1.6, 0.6);
  }
}

/** LMB (Bankai): a petal swings open and he cuts whatever stands outside it */
class PetalSlashAction extends SkillAction {
  readonly name = 'petal';
  private hit = 0.15;
  private struck = false;
  constructor(kit: ShinjiKit, readonly clip: string, readonly heavy: boolean) {
    super(kit);
    this.mobility = 0;
  }
  override start(f: Fighter, g: Game): void {
    this.hit = f.anim.clip(this.clip)?.events.hit ?? 0.15;
    this.kit.spinFor(this.heavy ? 0 : 5, this.heavy ? 1 : 0);
    this.kit.flower?.openToward(f.forward(_w), 0.55);
    this.playClip(f, this.clip, () => {});
    g.sfx.play(this.heavy ? 'swingHeavy' : 'swing', f.center(), 0.9);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.struck && this.t >= this.hit) {
      this.struck = true;
      if (this.heavy) this.kit.ringThrust();
      else this.kit.petalSlash();
    }
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' || (next instanceof PetalSlashAction && this.t > this.hit + 0.08);
  }
}

// ---------------------------------------------------------------------------------------------- the kit

export class ShinjiKit implements Kit {
  form: Form = 'sealed';
  masked = false;
  flare = false;
  comboIndex = 0;
  readonly cd = { heavy: 0, tanma: 0, kido: 0, force: 0, mask: 0, release: 0, mist: 0, nape: 0, cero: 0, petal: 0, thrust: 0, pulse: 0, clamp: 0 };
  flower: HappoFlower | null = null;
  private lastEnd = 0;
  private maskT = 0;
  private bankaiT = 0;
  /** the ring spin: the angle, the rate (rad/s), the rate wanted, how far the sword is caught out straight */
  private spinA = 0;
  private spinRate = TAU;
  private spinWant = TAU;
  private spinHoldT = 0;
  private holdK = 0;
  private holdWant = 0;
  private iffShown = false;

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.def = { ...f.def, speed: { ...SPEED } };
    this.hands();
    this.applyStats();
  }

  /** the right hand closed on the hilt when sealed, open (the sword on a finger) after; the left always open */
  hands(): void {
    const rig = this.f.visual.rig;
    const sealed = this.form === 'sealed';
    rig.setBoneVisible('fist.R', sealed);
    rig.setBoneVisible('palm.R', !sealed);
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
    // the mask holds for a while; an AI wears it in bursts
    if (this.masked) {
      this.maskT += dt;
      if (this.maskT > (f === g.player ? 60 : 22) || f.dead) this.setMask(false, true);
    }
    // the Bankai: the reiatsu it takes to keep the flower up; the AI uproots after a while
    if (this.form === 'bankai') {
      this.bankaiT += dt;
      f.rei -= dt * 2.2;
      if (f.rei <= 0 || f.dead || this.bankaiT > (f === g.player ? 40 : 15) || (this.flower && this.flower.done)) this.endBankai(true);
    }
    // the player inside someone's Happōfusagari: say so once on the way in
    const pl = g.player;
    if (pl && pl !== f && pl.iffT > 0 && this.flower?.alive) {
      if (!this.iffShown) {
        this.iffShown = true;
        g.hud?.showBanner('Happōfusagari — friend and foe reversed');
      }
    } else if (pl && pl.iffT <= 0) this.iffShown = false;
    this.driveSword(dt);
    this.applyStats();
  }

  /** the Shikai sword on its ring: wheel it round the finger, or catch it out straight */
  private driveSword(dt: number): void {
    const f = this.f;
    if (this.form === 'sealed') return;
    const prop = f.visual.props.get('sword');
    if (!prop) return;
    if (this.spinHoldT > 0) this.spinHoldT -= dt;
    else {
      // idle: a lazy twirl (faster on the run); no action holds it
      const sp = Math.hypot(f.body.vel.x, f.body.vel.z);
      this.spinWant = TAU * (1.1 + Math.min(1, sp / 12) * 0.9);
      this.holdWant = 0;
    }
    this.spinRate += (this.spinWant - this.spinRate) * Math.min(1, dt * 9);
    this.spinA = (this.spinA + this.spinRate * dt) % TAU;
    this.holdK += (this.holdWant - this.holdK) * Math.min(1, dt * 16);
    _q.copy(Q_SPIN).multiply(_q2.setFromAxisAngle(X, this.spinA));
    _q.slerp(Q_HOLD, this.holdK);
    prop.quaternion.copy(_q);
    // the ring's centre sits on the fingertip
    prop.position.set(0, 0, SAKANADE_RING_Z).applyQuaternion(_q).negate();
  }

  /** an action takes the sword: wheel at `rev` turns a second (0 = stop) or catch it straight (hold = 1) */
  spinFor(rev: number, hold: 0 | 1, time = 0.6): void {
    this.spinWant = rev * TAU;
    this.holdWant = hold;
    this.spinHoldT = time;
  }

  target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 90, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 90);
  }

  /** the nearest enemy, whatever its senses (for his own checks — he is never the inverted one) */
  trueTarget(): Fighter | null {
    let best: Fighter | null = null, bd = 90;
    for (const o of this.g.enemiesOf(this.f)) {
      const d = o.pos.distanceTo(this.f.pos);
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  }

  aim(out = new THREE.Vector3()): THREE.Vector3 {
    const { f, g } = this;
    if (f === g.player && !f.faceTarget) return g.aimPoint(f, out);
    const t = this.target();
    if (t && !t.dead) return t.center(out);
    if (f.faceTarget) return out.copy(f.faceTarget);
    return f.center(out).addScaledVector(f.forward(_w), 20);
  }

  // ---------------------------------------------------------------- the mist

  /** breathe some of the mist into `o` (a ring-spin cut); a full lungful turns its world over */
  scent(o: Fighter, k: number): void {
    if (o.inhale(k, 8)) this.inverted(o);
  }

  /** the moment someone's world turns over */
  inverted(o: Fighter): void {
    const g = this.g;
    invertBurst(g, o);
    g.sfx.play('ting', o.center(), 1.2);
    if (o === g.player) {
      // the player gets a shorter spell (it is their whole view that turns)
      o.invertT = Math.min(o.invertT, 6);
      g.hud?.showBanner('Sakasama no Sekai — up is down, left is right');
      g.engine.gr.chroma.offset.set(0.008, 0.008);
    }
  }

  /** Q (Shikai): the cloud of mist */
  mist(): void {
    const { f, g } = this;
    const R = this.masked ? 13 : 11;
    g.addProjectile(new MistCloud(g, f, f.pos, R, 9, 8, (o) => this.inverted(o)));
    g.addRing(f.pos.clone().setY(f.pos.y + 0.3), R, MIST_PINK, 0.8);
    g.sfx.play('flare', f.center(), 0.7);
  }

  // ---------------------------------------------------------------- Kidō

  /** Q (sealed): the palm laid over the face — the target drops, asleep for a moment */
  tanma(): void {
    const { f, g } = this;
    const palm = bonePos(f, 'palm.L');
    g.engine.glow.spawn({ x: palm.x, y: palm.y, z: palm.z, size: 0.9, sizeEnd: 0.2, life: 0.35, r: 1, g: 1, b: 0.96, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    const fw = f.forward(_w);
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      _v.subVectors(o.pos, f.pos).setY(0);
      const d = _v.length();
      if (d > 1.7 + o.def.radius || _v.normalize().dot(fw) < 0.25) continue;
      g.damage(o, 8, f, _v.clone(), { knock: 0.5, energy: true, quiet: true, color: '#F3F3F0' });
      o.stopAction();
      const sleep = o === g.player ? 1.6 : o.def.boss ? 1.1 : 2.6;
      o.hitstun = Math.max(o.hitstun, sleep);
      o.slow(0.5, sleep + 0.6);
      const head = o.center(_v);
      head.y = o.pos.y + o.def.height * 0.86;
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * TAU;
        g.engine.glow.spawn({ x: head.x, y: head.y, z: head.z, vx: Math.cos(a) * 3, vy: (Math.random() - 0.3) * 2, vz: Math.sin(a) * 3, size: 0.18, sizeEnd: 0.03, life: 0.5, r: 1, g: 1, b: 0.95, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2, drag: 2 });
      }
      if (o === g.player) {
        g.hud?.showBanner('Tanma Otoshi — lights out');
        g.engine.gr.chroma.offset.set(0.006, 0.006);
      }
      g.sfx.play('ting', head, 0.9);
      break;
    }
  }

  /** E: the ten points of light (they follow him until fired) */
  senju(): SenjuKoten {
    const { f, g } = this;
    const scale = this.form === 'bankai' ? 1.3 : this.masked ? 1.15 : 1;
    const s = new SenjuKoten(g, f, () => this.aim(), scale, () => {
      // the lights home on someone: the AI's target, the player's lock, or whoever stands where he aims
      if (f !== g.player) return this.target() ?? this.trueTarget();
      if (f.faceTarget) return this.target();
      const at = this.aim(_w);
      let best: Fighter | null = null, bd = 4;
      for (const o of g.enemiesOf(f)) {
        const d = o.center(_v).distanceTo(at);
        if (d < bd) { bd = d; best = o; }
      }
      return best;
    });
    g.addProjectile(s);
    return s;
  }

  /** R (sealed): a blast of force off the fingertips — it knocks an attack aside and throws them back */
  force(): void {
    const { f, g } = this;
    const from = bonePos(f, 'palm.L');
    const fw = f.forward(new THREE.Vector3());
    const R = 9;
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      _v.subVectors(o.center(), from);
      const d = _v.length();
      if (d > R + o.def.radius) continue;
      _v.y = 0;
      if (d > 1.5 && _v.normalize().dot(fw) < Math.cos(0.5)) continue;
      // it breaks off whatever they were doing
      o.stopAction();
      g.damage(o, 14 * (1 - d / (R * 1.6)), f, fw.clone(), { knock: 20, launch: 2.5, heavy: true, energy: true, hitstop: 0.07, shake: 0.25, color: '#FFF4D0' });
    }
    for (let i = 0; i < 26; i++) {
      const a = (Math.random() - 0.5) * 0.9, e = (Math.random() - 0.5) * 0.4;
      const dir = fw.clone().applyAxisAngle(UP, a);
      dir.y += e;
      g.engine.glow.spawn({ x: from.x, y: from.y, z: from.z, vx: dir.x * 30, vy: dir.y * 30, vz: dir.z * 30, size: 0.2, sizeEnd: 0.04, life: 0.3, r: 1, g: 0.95, b: 0.8, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 3 });
    }
    g.addRing(from.clone().addScaledVector(fw, 1.2), 1.6, '#FFF4D0', 0.25);
    g.sfx.play('impact', from, 0.9);
  }

  /** the crimson bar lining up before the sword hand (or above the flower's crown) */
  ceroCharge(k: number): void {
    const { f, g } = this;
    const at = this.ceroOrigin(_v);
    const side = _w.set(-Math.cos(f.yaw), 0, Math.sin(f.yaw));
    ceroBar(g, at, side, k);
  }

  private ceroOrigin(out: THREE.Vector3): THREE.Vector3 {
    const f = this.f;
    if (this.flower) return this.flower.crown(out).add(new THREE.Vector3(0, 0.6, 0));
    return bonePos(f, this.form === 'sealed' ? 'grip.R' : 'finger.R', out).addScaledVector(f.forward(_w), 0.35);
  }

  /** the wide fan of the Cero */
  cero(): void {
    const { f, g } = this;
    const from = this.ceroOrigin(new THREE.Vector3());
    const to = this.aim();
    const dir = to.clone().sub(from).normalize();
    const side = new THREE.Vector3().crossVectors(dir, UP);
    if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
    side.normalize();
    g.addProjectile(new GetsugaProjectile(g, f, from.clone().addScaledVector(dir, 0.6), dir, side, { radius: 4.6, halfAngle: 1.0, speed: 66, range: 75, damage: 100, cut: 900, colors: SHINJI_CERO, band: 1.8 }));
    for (let i = 0; i < 30; i++) {
      const d = dir.clone().addScaledVector(side, (Math.random() - 0.5) * 2).normalize();
      g.engine.glow.spawn({ x: from.x, y: from.y, z: from.z, vx: d.x * 26, vy: d.y * 26, vz: d.z * 26, size: 0.3, sizeEnd: 0.05, life: 0.35, r: 0.82, g: 0.13, b: 0.23, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 2 });
    }
    g.engine.glow.spawn({ x: from.x, y: from.y, z: from.z, size: 2.4, sizeEnd: 0.4, life: 0.25, r: 1, g: 0.5, b: 0.55, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    g.sfx.play('beam', from, 1.1);
    if (f === g.player) {
      g.shake(0.35);
      g.engine.gr.chroma.offset.set(0.005, 0.005);
    }
  }

  // ---------------------------------------------------------------- the nape drop

  /** up and over: he reappears above and behind the target, falling */
  leapOver(): void {
    const { f, g } = this;
    const t = this.target() ?? this.trueTarget();
    f.ghosts.spawn(0.5, 1);
    g.sfx.play('shunpo', f.center(), 0.9);
    if (!t || t.pos.distanceTo(f.pos) > 16) {
      f.body.vel.y = 12;
      f.body.grounded = false;
      return;
    }
    // behind it, over the back of its neck
    const back = new THREE.Vector3(-Math.sin(t.yaw), 0, -Math.cos(t.yaw)).multiplyScalar(t.def.radius + 0.35);
    const top = t.pos.y + t.def.height * (t.def.height > 3 ? 0.92 : 1) + 1.2;
    f.body.pos.set(t.pos.x + back.x, top, t.pos.z + back.z);
    f.body.prev.copy(f.body.pos);
    f.body.vel.set(0, 1.5, 0);
    f.body.grounded = false;
    f.yaw = Math.atan2(t.pos.x - f.body.pos.x, t.pos.z - f.body.pos.z);
    f.faceTarget = null;
  }

  /** down onto the nape: a heavy stab on whatever is under him, and on into the ground */
  napeStab(): void {
    const { f, g } = this;
    const tip = f.blade.tip.clone();
    f.body.vel.y = -16;
    let struck = false;
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      const dx = o.pos.x - f.pos.x, dz = o.pos.z - f.pos.z;
      if (Math.hypot(dx, dz) > o.def.radius + 1.3) continue;
      if (f.pos.y < o.pos.y - 0.5 || f.pos.y > o.pos.y + o.def.height + 2.6) continue;
      const big = o.def.height > 2.6 ? 1.6 : 1;
      const inv = o.invertT > 0 ? 1.3 : 1;
      g.damage(o, 46 * big * inv, f, new THREE.Vector3(Math.sin(f.yaw), 0, Math.cos(f.yaw)), { knock: 6, launch: -6, heavy: true, hitstop: 0.14, shake: 0.5 });
      g.sparks(o.center(), UP.clone().negate(), MIST_PINK, 20);
      struck = true;
    }
    mistPuff(g, tip, 4, 1);
    g.sfx.play(struck ? 'hitHeavy' : 'swingHeavy', f.center(), 1);
    const gy = groundAt(g, f.pos.x, f.pos.y + 0.5, f.pos.z, 8);
    if (gy !== null && f.pos.y - gy < 2.5) g.engine.destruction.carve(new SphereShape(new THREE.Vector3(tip.x, gy, tip.z), 0.9, 0.5), { mode: 'smash', power: 500, impulse: 6 });
  }

  // ---------------------------------------------------------------- forms

  setMask(on: boolean, broke = false): void {
    const { f, g } = this;
    if (on === this.masked) return;
    this.masked = on;
    this.maskT = 0;
    if (on) {
      const m = f.visual.attach('mask', shinjiProp('mask'), 'face');
      m.userData.flash = 1;
      f.aura.setStyle?.(AURA_SHINJI_MASK);
      g.callout('仮面', 'HOLLOW MASK', '#E9E6DE');
      g.sfx.play('mask', f.center(), 1);
      f.aura.flare(1.6, 0.5);
      // the burst of force as it forms: those close by are thrown back
      for (const o of g.enemiesOf(f)) {
        _v.subVectors(o.pos, f.pos).setY(0);
        const d = _v.length();
        if (d > 4.5 || o.dead) continue;
        g.damage(o, 10, f, _v.normalize().clone(), { knock: 18, launch: 3, heavy: true, energy: true, quiet: true });
      }
    } else {
      f.visual.detach('mask');
      f.aura.setStyle?.(AURA_SHINJI);
      g.sfx.play('shatter', f.center(), broke ? 1 : 0.7);
      this.cd.mask = broke ? 12 : 3;
    }
    if (f.def.blade) f.def = { ...f.def, blade: { ...f.def.blade, color: on ? '#C8323C' : this.form === 'sealed' ? BLADE.color : this.form === 'shikai' ? BLADE_SHIKAI.color : BLADE_BANKAI.color } };
    this.applyStats();
  }

  /** "Taorero": the hilt melts into the ring, the guard grows into a sleeve, the five holes open */
  becomeShikai(): void {
    const { f, g } = this;
    if (this.form !== 'sealed') return;
    this.form = 'shikai';
    f.visual.attach('sword', shinjiProp('shikai'), 'finger.R');
    f.anim.loco.stance = SAKANADE_STANCE;
    f.def = { ...f.def, stance: SAKANADE_STANCE, blade: this.masked ? { ...BLADE_SHIKAI, color: '#C8323C' } : BLADE_SHIKAI };
    f.bladeValid = false;
    this.spinA = 0;
    this.spinFor(5, 0, 0.8);
    this.hands();
    this.driveSword(0);
    f.aura.pillarBurst(1.8);
    f.aura.flare(1.8, 0.8);
    mistPuff(g, bonePos(f, 'finger.R'), 8, 1.2);
    g.sfx.play('bankai', f.center(), 0.7);
    if (f === g.player) g.shake(0.4);
  }

  /** the golden flower bursts up and shuts round him; the mist starts pouring */
  becomeBankai(): void {
    const { f, g } = this;
    if (this.form !== 'shikai') return;
    this.form = 'bankai';
    f.visual.attach('sword', shinjiProp('bankai'), 'finger.R');
    f.def = { ...f.def, blade: this.masked ? { ...BLADE_BANKAI, color: '#C8323C' } : BLADE_BANKAI };
    f.bladeValid = false;
    this.flower = new HappoFlower(g, f, f === g.player ? 26 : 22);
    g.addProjectile(this.flower);
    f.rooted = true;
    this.bankaiT = 0;
    this.driveSword(0);
    f.aura.pillarBurst(2.4);
    f.aura.flare(2, 1);
    g.sfx.play('bankai', f.center(), 1);
    g.sfx.play('roarBig', f.center(), 0.4);
    if (f === g.player || (g.player && g.player.pos.distanceTo(f.pos) < 40)) g.shake(0.6);
    g.slowMo(0.35, 0.4);
  }

  /** uproot: the flower opens wide and sinks; the mist lingers a while if `linger` */
  endBankai(linger: boolean): void {
    const { f } = this;
    if (this.form !== 'bankai') return;
    this.flower?.wither(linger ? 6 : 0);
    this.flower = null;
    f.rooted = false;
    this.form = 'shikai';
    f.visual.attach('sword', shinjiProp('shikai'), 'finger.R');
    f.def = { ...f.def, blade: this.masked ? { ...BLADE_SHIKAI, color: '#C8323C' } : BLADE_SHIKAI };
    f.bladeValid = false;
    this.driveSword(0);
    this.cd.release = 30;
  }

  // ---------------------------------------------------------------- the flower's cuts

  /** LMB (Bankai): the petals facing out open and he cuts all round that side */
  petalSlash(): void {
    const { f, g } = this;
    const fw = f.forward(new THREE.Vector3());
    const c = f.center();
    const R = 4.8;
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      _v.subVectors(o.pos, f.pos).setY(0);
      const d = _v.length();
      if (d > R + o.def.radius || Math.abs(o.pos.y - f.pos.y) > 3) continue;
      if (d > 0.8 && _v.normalize().dot(fw) < Math.cos(1.1)) continue;
      g.damage(o, 28, f, _v.clone(), { knock: 9, launch: 1.5, heavy: false, hitstop: 0.07, shake: 0.2 });
      g.sparks(o.center(), _v, GOLD, 12);
    }
    // the sweep: a golden arc out past the petals
    for (let i = 0; i < 36; i++) {
      const a = (i / 35 - 0.5) * 2.2;
      const dir = fw.clone().applyAxisAngle(UP, a);
      const r = R * (0.75 + Math.random() * 0.25);
      g.engine.glow.spawn({ x: c.x + dir.x * r, y: c.y + (Math.random() - 0.5) * 0.4, z: c.z + dir.z * r, vx: -dir.z * 6 * Math.sign(a || 1), vy: 0, vz: dir.x * 6 * Math.sign(a || 1), size: 0.3, sizeEnd: 0.05, life: 0.3, r: 1, g: 0.86, b: 0.5, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2.5, drag: 2 });
    }
    mistPuff(g, c.clone().addScaledVector(fw, 2), 3, 1.4);
  }

  /** RMB (Bankai): the ring thrust out through a gap in the petals — a long line */
  ringThrust(): void {
    const { f, g } = this;
    const fw = f.forward(new THREE.Vector3());
    const from = f.center().addScaledVector(fw, 0.6);
    const len = 9.5;
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      const cc = o.center(_v);
      const along = _w.subVectors(cc, from).dot(fw);
      if (along < 0 || along > len) continue;
      const off = _w.subVectors(cc, from).addScaledVector(fw, -along).length();
      if (off > 0.9 + o.def.radius) continue;
      g.damage(o, 44, f, fw.clone(), { knock: 16, launch: 2, heavy: true, hitstop: 0.11, shake: 0.35 });
      g.sparks(cc, fw, GOLD, 16);
    }
    for (let i = 0; i < 30; i++) {
      const k = Math.random() * len;
      const p = from.clone().addScaledVector(fw, k);
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: fw.x * 24, vy: 0, vz: fw.z * 24, size: 0.32, sizeEnd: 0.05, life: 0.22, r: 1, g: 0.88, b: 0.55, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 4 });
    }
    g.addRing(from.clone().addScaledVector(fw, len), 1.3, GOLD, 0.3);
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
    if (this.form === 'bankai') {
      if (this.cd.petal > 0) return;
      const n = this.comboIndex++ % 3;
      if (this.special(new PetalSlashAction(this, ['sk_spin1', 'sk_spin2', 'sk_spin3'][n], false), 0, 'petal', 0.42)) return;
      return;
    }
    const cur = f.action;
    if (cur instanceof CutAction && !cur.o.kind) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastEnd > 0.7) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const list = this.form === 'sealed' ? SHINJI_CHAIN : SAKANADE_CHAIN;
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    this.lastEnd = this.g.time + 0.7;
    this.f.act(new CutAction(this, list[idx], idx, idx === list.length - 1), true);
  }

  heavy(): void {
    if (this.form === 'bankai') this.special(new PetalSlashAction(this, 'sk_counter', true), 10, 'thrust', 2.2);
    else if (this.form === 'shikai') this.special(new CutAction(this, 'sk_counter', 0, true, { kind: 'counter' }), 12, 'heavy', 3);
    else this.special(new CutAction(this, 'sh_draw', 0, true, { kind: 'draw' }), 12, 'heavy', 3);
  }

  skill1(): void {
    if (this.form === 'bankai') {
      // the bloom pulse: the mist pushed further out
      if (this.cd.pulse > 0 || !this.flower || !this.f.spendRei(15)) return;
      this.cd.pulse = 7;
      this.flower.pulse(6);
      this.bankaiT = Math.max(0, this.bankaiT - 4);
      this.g.sfx.play('flare', this.f.center(), 0.8);
      return;
    }
    if (this.form === 'shikai') this.special(new MistAction(this), 32, 'mist', 15);
    else this.special(new TanmaAction(this), 18, 'tanma', 9);
  }

  skill2(): void {
    if (this.masked) this.special(new CeroAction(this), 40, 'cero', 7);
    else this.special(new Kido91Action(this), 45, 'kido', 9);
  }

  skill3(): void {
    if (this.form === 'bankai') {
      // the petals clamped shut: nothing gets in for a moment
      const f = this.f;
      if (this.cd.clamp > 0 || !this.flower || !f.spendRei(15)) return;
      this.cd.clamp = 8;
      this.flower.clamp(2.4);
      f.invuln = Math.max(f.invuln, 2.4);
      this.g.rejectNear(this.flower.centre.clone().setY(this.flower.centre.y + 2), 4, f, false);
      this.g.sfx.play('shatter', f.center(), 0.5);
      return;
    }
    if (this.form === 'shikai') this.special(new NapeAction(this), 22, 'nape', 8);
    else this.special(new ForceAction(this), 10, 'force', 4);
  }

  toggle(): void {
    if (this.cd.mask > 0 || this.f.busy) return;
    if (!this.masked && !this.f.spendRei(25)) {
      if (this.f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    this.cd.mask = 3;
    this.f.act(new MaskAction(this), true);
  }

  release(): void {
    const f = this.f;
    if (this.form === 'bankai') {
      this.endBankai(true);
      return;
    }
    if (this.form === 'shikai') {
      // the AI saves the Bankai for when it is low, or surrounded
      this.special(new BankaiAction(this), 60, 'release', 30);
      return;
    }
    if (f.busy && !(f.action instanceof CutAction)) return;
    this.special(new ShikaiAction(this), 20, 'release', 2);
  }

  toggleFlare(): void {
    this.flare = !this.flare;
    this.applyStats();
    if (this.flare) {
      this.f.aura.flare(1.5, 0.4);
      this.g.shake(0.2);
      this.g.sfx.play('flare', this.f.center());
    }
  }

  private applyStats(): void {
    const { f, g } = this;
    f.power = (this.masked ? 1.25 : 1) * (this.flare ? 1.25 : 1) * (this.form === 'shikai' ? 1.05 : 1);
    // shut in the flower, blows land on golden metal
    f.damageTaken = (this.masked ? 0.85 : 1) * (this.flower?.shut ? 0.3 : 1);
    f.knockTaken = this.form === 'bankai' ? 0 : 1;
    const sp = this.masked ? 1.15 : 1;
    f.def.speed.run = SPEED.run * sp;
    f.def.speed.sprint = SPEED.sprint * sp;
    f.def.speed.dash = SPEED.dash * sp;
    f.aura.target = this.flare ? 1 : this.masked ? 0.45 : this.form === 'bankai' ? 0.35 : this.form === 'shikai' ? 0.12 : 0.05;
    if (f === g.player) {
      // in the flower the camera rises to look out over the mist
      const cam = g.cam;
      const h = this.form === 'bankai' ? 3.4 : 1.55;
      cam.height += (h - cam.height) * 0.05;
      if (this.form === 'bankai' && cam.dist < 8) cam.dist += (8 - cam.dist) * 0.05;
    }
    if (this.masked && g.hud && f === g.player) g.hud.vignette = 0.35;
    else if (g.hud && f === g.player) g.hud.vignette = 0;
  }

  /** Sandbox: the mask holds */
  sandbox(): void {
    this.maskT = 0;
  }

  formName(): string {
    const base = this.form === 'bankai' ? 'Bankai — Sakashima Yokoshima Happōfusagari' : this.form === 'shikai' ? 'Shikai — Sakanade' : 'Visored';
    return this.masked ? `${base} · Hollow mask` : base;
  }

  ai(): KitAI {
    const kit = this;
    const tgt = () => kit.target() ?? kit.trueTarget();
    return {
      get reach() {
        return kit.form === 'bankai' ? 4.4 : kit.form === 'shikai' ? 1.9 : 1.7;
      },
      get chain() {
        return kit.form === 'sealed' ? 5 : 4;
      },
      releaseAt: [0.75, 0.3],
      toggleAt: 0.55,
      toggleOn: () => kit.masked,
      ranged: () => kit.form === 'bankai',
      moves: [
        { name: 'draw', use: () => this.heavy(), min: 0, max: 2.8, weight: 1, cd: 3, when: () => kit.form === 'sealed' },
        { name: 'tanma', use: () => this.skill1(), min: 0, max: 3.5, weight: 0.8, cd: 10, when: () => kit.form === 'sealed' },
        { name: 'force', use: () => this.skill3(), min: 1.5, max: 9, weight: 0.8, cd: 5, when: () => kit.form === 'sealed' },
        { name: 'kido91', use: () => this.skill2(), min: 6, max: 34, weight: 1.1, cd: 9, when: () => !kit.masked },
        { name: 'cero', use: () => this.skill2(), min: 5, max: 45, weight: 1.4, cd: 7, when: () => kit.masked },
        { name: 'mist', use: () => this.skill1(), min: 0, max: 8, weight: 1.6, cd: 14, when: () => { const t = tgt(); return kit.form === 'shikai' && t !== null && t.invertT <= 0 && t.invertImmuneT <= 0; } },
        { name: 'counter', use: () => this.heavy(), min: 0, max: 3, weight: 1, cd: 3, when: () => { const t = tgt(); return kit.form === 'shikai' && (t?.invertT ?? 0) <= 0; } },
        { name: 'counterOpen', use: () => this.heavy(), min: 0, max: 3.4, weight: 2.4, cd: 2.5, when: () => { const t = tgt(); return kit.form === 'shikai' && (t?.invertT ?? 0) > 0; } },
        { name: 'nape', use: () => this.skill3(), min: 3, max: 14, weight: 1, cd: 8, when: () => kit.form === 'shikai' },
        { name: 'petal', use: () => this.attack(), min: 0, max: 4.8, weight: 2.4, cd: 0.5, when: () => kit.form === 'bankai' },
        { name: 'thrust', use: () => this.heavy(), min: 2, max: 9.5, weight: 1.2, cd: 2.4, when: () => kit.form === 'bankai' },
        { name: 'pulse', use: () => this.skill1(), min: 0, max: 60, weight: 0.3, cd: 10, when: () => kit.form === 'bankai' },
        { name: 'clamp', use: () => this.skill3(), min: 0, max: 60, weight: 0.4, cd: 9, when: () => kit.form === 'bankai' && kit.f.hp < kit.f.maxHp * 0.25 },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    const e: AbilityInfo = this.masked
      ? { key: 'E', name: 'Cero', kanji: '虚閃', cost: 40, cd: cd.cero, cdMax: 7, tint: CERO_RED }
      : { key: 'E', name: 'Hadō #91', kanji: '千手', cost: 45, cd: cd.kido, cdMax: 9 };
    const g: AbilityInfo = { key: 'G', name: 'Hollow mask', kanji: '仮面', active: this.masked, cd: cd.mask, cdMax: 12 };
    const v: AbilityInfo = { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare };
    if (this.form === 'bankai')
      return [
        { key: 'LMB', name: 'Petal slash', kanji: '花弁', cd: cd.petal, cdMax: 0.42 },
        { key: 'RMB', name: 'Ring thrust', kanji: '輪突', cost: 10, cd: cd.thrust, cdMax: 2.2 },
        { key: 'Q', name: 'Bloom', kanji: '咲', cost: 15, cd: cd.pulse, cdMax: 7 },
        e,
        { key: 'R', name: 'Closed bud', kanji: '蕾', cost: 15, cd: cd.clamp, cdMax: 8 },
        g,
        v,
        { key: 'F', name: 'Uproot', kanji: '解', active: true, tint: GOLD },
      ];
    if (this.form === 'shikai')
      return [
        { key: 'LMB', name: 'Sakanade', kanji: '逆撫' },
        { key: 'RMB', name: 'Counter stroke', kanji: '逆撫', cost: 12, cd: cd.heavy, cdMax: 3 },
        { key: 'Q', name: 'Sakasama no Sekai', kanji: '逆様', cost: 32, cd: cd.mist, cdMax: 15, tint: MIST_PINK },
        e,
        { key: 'R', name: 'Nape drop', kanji: '項', cost: 22, cd: cd.nape, cdMax: 8 },
        { key: 'Shift', name: 'Shunpo', kanji: '瞬歩' },
        g,
        v,
        { key: 'F', name: 'Bankai', kanji: '卍解', cost: 60, cd: cd.release, cdMax: 30, tint: GOLD },
      ];
    return [
      { key: 'LMB', name: 'Sakanade', kanji: '逆撫' },
      { key: 'RMB', name: 'Draw-cut', kanji: '斬', cost: 12, cd: cd.heavy, cdMax: 3 },
      { key: 'Q', name: 'Tanma Otoshi', kanji: '落', cost: 18, cd: cd.tanma, cdMax: 9 },
      e,
      { key: 'R', name: 'Force blast', kanji: '衝', cost: 10, cd: cd.force, cdMax: 4 },
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩' },
      g,
      v,
      { key: 'F', name: 'Shikai', kanji: '倒れろ', cost: 20, cd: cd.release, cdMax: 2, tint: MIST_PINK },
    ];
  }
}
