// Sajin Komamura's kit (docs/roster/B2-captains-2.md, Kit proposal). Sealed, the captain of the 7th: huge,
// heavy one-handed cuts of Tenken mixed with a straight left from the gauntlet and a two-handed chop that
// cracks the ground; RMB the Earth-Splitting Draw (the ground split open along a line); Q the overhead throw
// (seized, hoisted, driven into the ground); E the haymaker; R the iron forearm (catch a blow on the
// gauntlet, then shove); G the roar (staggers those near, steadies him); F "Todoroke, Tenken".
// Shikai: every move is copied by one of Tenken's phantom limbs — a giant armoured arm with its sword for
// each cut (RMB: a chasm), a giant fist (Q), a giant foot (E). F: "Bankai — Kokujō Tengen Myō'ō": the
// armoured giant rises behind him and copies everything he does at thirty metres: sword sweeps that halve
// buildings, Heavenly Punishment (RMB), the giant fist (Q), the stomp (E), and F the One Blow. The Bankai
// burns reiatsu while it stands; when he runs dry it dissolves back into reishi.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { DamageOpts, Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { GIANT_SCALE, TENKEN_BASE, TENKEN_TIP, komamuraAsset, komamuraProp } from '../../chars/komamura';
import { KOMAMURA_CHAIN, KOMAMURA_CLIPS, KOMAMURA_STANCE } from '../../chars/komamuraClips';
import { Fissure, TENGEN_RED, TengenGiant, TenkenLimb, type LimbKind } from '../../vfx/tengen';
import { SphereShape } from '../../destruction/shapes';
import { groundAt } from '../../vfx/iceArts';
import { TEX_GLOW, TEX_STREAK } from '../../vfx/sprites';
import type { AuraStyle } from '../../vfx/aura';

export type KomamuraForm = 'sealed' | 'shikai' | 'bankai';

export const AURA_KOMAMURA: AuraStyle = { core: '#FFC09A', body: '#D8322B', rim: '#5A0C0A' };
const RED = '#D8322B';

type BladeDef = NonNullable<FighterDef['blade']>;
const BLADE_TENKEN: BladeDef = { prop: 'sword', base: [TENKEN_BASE[0], TENKEN_BASE[1], TENKEN_BASE[2]], tip: [TENKEN_TIP[0], TENKEN_TIP[1], TENKEN_TIP[2]], color: '#D4D9DF', core: '#F3F1EA' };

/** Tenken's phantom limbs are a giant's at this scale (his own size ×7) */
const PHANTOM_SCALE = 7;

const SPEED = { run: 8.4, sprint: 23, jump: 11.5, dash: 22, dashTime: 0.11 };

export const KOMAMURA_DEF: FighterDef = {
  id: 'komamura',
  name: 'Sajin Komamura',
  title: 'Captain, 7th Division',
  build: () => ({ asset: komamuraAsset(), props: [{ key: 'sword', model: komamuraProp('tenken'), socket: 'grip.R' }] }),
  stance: KOMAMURA_STANCE,
  clips: KOMAMURA_CLIPS,
  aura: AURA_KOMAMURA,
  blade: BLADE_TENKEN,
  hp: 1500,
  rei: 240,
  speed: { ...SPEED },
  radius: 0.62,
  height: 2.86,
};

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

/** the ground under a point (or the point itself) */
function ground(g: Game, p: THREE.Vector3, range = 6): THREE.Vector3 {
  const gy = groundAt(g, p.x, p.y + 2, p.z, range);
  if (gy !== null) p.y = gy;
  return p;
}

// ---------------------------------------------------------------------------------------------- actions

/** a fist's hit window: whoever is within `r` of the fist (his, the phantom's or the giant's) is struck once */
interface FistWindow { at: () => THREE.Vector3; r: number; damage: number; opts: DamageOpts; carve: number; hits: Set<number>; carved: boolean }

/**
 * The chain (every form): 'hit' opens the window for his own blade, the phantom arm's sword or the giant's;
 * the punch strikes with whichever fist is out; 'combo' chains; the chop's 'slam' strikes the ground.
 */
class CutAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private hitAt = -1;
  private limb: TenkenLimb | null = null;
  private fist: FistWindow | null = null;
  queued = false;
  constructor(readonly kit: KomamuraKit, readonly clip: string, readonly index: number, readonly last: boolean) {
    super();
    this.name = clip;
    this.mobility = 0.12;
    this.airGravity = 0.25;
    this.armor = 0.25;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.62;
    this.hitAt = c.events.hit ?? -1;
    const kit = this.kit, form = kit.form;
    const punch = this.clip === 'km_punch';
    f.bladeHits.clear();
    f.bladeSpec = this.last
      ? { damage: 40, knock: 14, launch: 8, heavy: true, hitstop: 0.12, shake: 0.45, cut: 800, reach: 0.55 }
      : { damage: 30, knock: 12, launch: 0, heavy: false, hitstop: 0.07, shake: 0.22, cut: 680, reach: 0.5 };
    if (form === 'shikai') this.limb = kit.phantom(punch ? 'arm.L' : 'arm.R', this.dur + 0.05, this.last ? kit.phantomSpec(true) : kit.phantomSpec(false));
    if (form === 'bankai') kit.arm(this.last ? kit.giantSpec(true) : kit.giantSpec(false));
    if (punch) {
      const limb = this.limb;
      this.fist = form === 'bankai'
        ? kit.fistWindow(() => kit.giant!.point('knuckle.L'), 4.6, 66, { knock: 34, launch: 7, heavy: true, hitstop: 0.12, shake: 0.5 }, 3.4)
        : form === 'shikai' && limb
          ? kit.fistWindow(() => limb.point('knuckle.L'), 2.8, 50, { knock: 30, launch: 6, heavy: true, hitstop: 0.1, shake: 0.4 }, 2.2)
          : kit.fistWindow(() => sock(f, 'knuckle.L'), 1.1, 26, { knock: 16, launch: 2, heavy: false, hitstop: 0.08, shake: 0.25 }, 0);
    }
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n === 'slam') kit.slam(this.limb);
        if (n !== 'step') return;
        kit.lunge(form === 'bankai' ? 4 : 6);
        g.sfx.play(this.last ? 'swingHeavy' : 'swing', f.center(), form === 'sealed' ? 1 : 1.4);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    const open = this.hitAt >= 0 && t >= this.hitAt - 0.07 && t <= this.hitAt + 0.13;
    const punch = this.clip === 'km_punch';
    f.bladeActive = open && !punch;
    if (f.trail) f.trail.emitting = open && !punch;
    if (this.limb) this.limb.active = open && !punch;
    if (this.kit.giant) this.kit.giant.active = open && !punch;
    if (this.fist && open) this.kit.strikeFist(this.fist);
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
    if (this.limb) this.limb.end();
    if (this.kit.giant) this.kit.giant.active = false;
  }
  override canCancel(next: FighterAction): boolean {
    if (next.name === 'dash' || next instanceof SkillAction) return this.t >= this.hitAt + 0.05;
    return false;
  }
}

abstract class SkillAction extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: KomamuraKit) {
    super();
  }
  protected playClip(f: Fighter, clip: string, onEvent: (n: string) => void, opts: { speed?: number } = {}): void {
    const c = f.anim.clip(clip)!;
    const speed = opts.speed ?? 1;
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
    if (this.kit.giant) this.kit.giant.active = false;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t > this.dur * 0.6;
  }
}

/** RMB: the Earth-Splitting Draw / Tenken's chasm / Heavenly Punishment */
class DrawAction extends SkillAction {
  readonly name = 'heavy';
  private hit = 0.71;
  private limb: TenkenLimb | null = null;
  constructor(kit: KomamuraKit) {
    super(kit);
    this.mobility = 0.05;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    const kit = this.kit;
    this.hit = f.anim.clip('km_draw')?.events.hit ?? 0.71;
    f.bladeHits.clear();
    f.bladeSpec = { damage: 46, knock: 10, launch: 9, heavy: true, hitstop: 0.12, shake: 0.5, cut: 1100, reach: 0.6 };
    if (kit.form === 'shikai') this.limb = kit.phantom('arm.R', 1.3, { damage: 70, knock: 14, launch: 10, heavy: true, hitstop: 0.14, shake: 0.6, cut: 2000, reach: 1.4, thick: 0.3 });
    if (kit.form === 'bankai') kit.arm({ damage: 96, knock: 18, launch: 12, heavy: true, hitstop: 0.16, shake: 0.7, cut: 3000, reach: 2.2, thick: 0.55 });
    this.playClip(f, 'km_draw', (n) => {
      if (n === 'charge') {
        f.aura.flare(1.3, 0.5);
        if (kit.form === 'bankai') g.callout('天譴', 'HEAVENLY PUNISHMENT', RED);
      }
      if (n === 'step') {
        kit.lunge(3);
        g.sfx.play('swingHeavy', f.center(), 1.3);
      }
      if (n === 'split') kit.split(this.limb);
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const open = this.t >= this.hit - 0.08 && this.t <= this.hit + 0.12;
    f.bladeActive = open;
    if (f.trail) f.trail.emitting = open;
    if (this.limb) this.limb.active = open;
    if (this.kit.giant) this.kit.giant.active = open;
  }
  override end(f: Fighter): void {
    super.end(f);
    if (this.limb) this.limb.end();
  }
}

/** Q (sealed): the overhead throw */
class ThrowAction extends SkillAction {
  readonly name = 'throw';
  private held: Fighter | null = null;
  private over = false;
  constructor(kit: KomamuraKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    this.kit.hands(true);
    this.playClip(f, 'km_throw', (n) => {
      if (n === 'grab') this.held = this.kit.seize(3.2);
      if (n === 'lift') this.over = true;
      if (n === 'slam' && this.held) {
        this.kit.slamDown(this.held);
        this.held = null;
      }
    });
    g.sfx.play('swing', f.center(), 0.7);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const h = this.held;
    if (!h || h.dead) return;
    const p = sock(f, 'palm.L', _v);
    h.body.pos.set(p.x, p.y - (this.over ? h.def.height * 0.35 : h.def.height * 0.8), p.z);
    h.body.prev.copy(h.body.pos);
    h.body.vel.set(0, 0, 0);
    h.hitstun = Math.max(h.hitstun, 0.3);
  }
  override end(f: Fighter): void {
    super.end(f);
    if (this.held) this.kit.slamDown(this.held);
    this.held = null;
    this.kit.hands(false);
  }
}

/** E (sealed): the haymaker */
class HaymakerAction extends SkillAction {
  readonly name = 'haymaker';
  private fist: FistWindow | null = null;
  private hit = 0.36;
  constructor(kit: KomamuraKit) {
    super(kit);
    this.mobility = 0.1;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    this.hit = f.anim.clip('km_haymaker')?.events.hit ?? 0.36;
    this.fist = this.kit.fistWindow(() => sock(f, 'knuckle.L'), 1.5, 42, { knock: 48, launch: 10, heavy: true, hitstop: 0.16, shake: 0.6 }, 1.4);
    this.playClip(f, 'km_haymaker', (n) => {
      if (n === 'step') {
        this.kit.lunge(5);
        g.sfx.play('swingHeavy', f.center(), 1.1);
      }
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.fist && this.t >= this.hit - 0.06 && this.t <= this.hit + 0.1) this.kit.strikeFist(this.fist);
  }
}

/** R: the iron forearm — a blow from the front is caught on the gauntlet, then he shoves through */
class GuardAction extends SkillAction {
  readonly name = 'guard';
  private caught: Fighter | null = null;
  private shoving = false;
  private shoveHit = new Set<number>();
  constructor(kit: KomamuraKit) {
    super(kit);
    this.mobility = 0.05;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'km_guard', () => {});
    f.parry = (_amount, from) => {
      if (this.shoving || this.t < 0.05 || this.t > 0.78) return false;
      // only what comes at him from the front
      if (from) {
        _v.subVectors(from.pos, f.pos).setY(0).normalize();
        if (_v.dot(f.forward(_w)) < -0.2) return false;
      }
      this.catchBlow(f, g, from);
      return true;
    };
  }
  private catchBlow(f: Fighter, g: Game, from: Fighter | null): void {
    const p = sock(f, 'knuckle.L', new THREE.Vector3());
    g.sparks(p, f.forward(new THREE.Vector3()), '#FFD0A0', 22);
    g.sfx.play('ting', p, 1.2);
    g.hitstop(0.08);
    this.kit.giant?.flash();
    if (from && !this.caught) {
      this.caught = from;
      this.shoving = true;
      this.t = 0;
      this.playClip(f, 'km_shove', (n) => n === 'hit' && this.shove(f, g));
    }
  }
  private shove(f: Fighter, g: Game): void {
    const o = this.caught;
    if (!o || o.dead || this.shoveHit.has(o.id)) return;
    if (o.pos.distanceTo(f.pos) > 4) return;
    this.shoveHit.add(o.id);
    _v.subVectors(o.pos, f.pos).setY(0).normalize();
    g.damage(o, 30, f, _v.clone(), { knock: 30, launch: 5, heavy: true, hitstop: 0.12, shake: 0.45 });
  }
  override end(f: Fighter): void {
    super.end(f);
    f.parry = null;
  }
}

/** G: the roar */
class RoarAction extends SkillAction {
  readonly name = 'roar';
  constructor(kit: KomamuraKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.6;
  }
  override start(f: Fighter): void {
    this.playClip(f, 'km_roar', (n) => n === 'roar' && this.kit.roar());
  }
}

/** Q (Shikai / Bankai): the giant fist */
class FistAction extends SkillAction {
  readonly name = 'fist';
  private fist: FistWindow | null = null;
  private hit = 0.3;
  constructor(kit: KomamuraKit) {
    super(kit);
    this.mobility = 0.08;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    const kit = this.kit;
    this.hit = f.anim.clip('km_fist')?.events.hit ?? 0.3;
    if (kit.form === 'bankai' && kit.giant) {
      const gi = kit.giant;
      this.fist = kit.fistWindow(() => gi.point('knuckle.L'), 5, 74, { knock: 44, launch: 9, heavy: true, hitstop: 0.14, shake: 0.6 }, 4);
    } else {
      const limb = kit.phantom('arm.L', 0.75, null);
      this.fist = kit.fistWindow(() => limb.point('knuckle.L'), 3, 56, { knock: 38, launch: 7, heavy: true, hitstop: 0.12, shake: 0.5 }, 2.6);
    }
    this.playClip(f, 'km_fist', (n) => {
      if (n === 'step') {
        kit.lunge(4);
        g.sfx.play('swingHeavy', f.center(), 1.3);
      }
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.fist && this.t >= this.hit - 0.08 && this.t <= this.hit + 0.12) this.kit.strikeFist(this.fist);
  }
}

/** E (Shikai / Bankai): the stomp */
class StompAction extends SkillAction {
  readonly name = 'stomp';
  private limb: TenkenLimb | null = null;
  constructor(kit: KomamuraKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    const kit = this.kit;
    if (kit.form === 'shikai') this.limb = kit.phantom('leg.R', 0.8, null);
    this.playClip(f, 'km_stomp', (n) => {
      if (n === 'lift') g.sfx.play('swingHeavy', f.center(), 0.8);
      if (n === 'stomp') kit.stomp(this.limb);
    });
  }
}

/** F (sealed): "Todoroke, Tenken" — the first phantom arm comes down with the sword */
class ShikaiAction extends SkillAction {
  readonly name = 'release';
  private limb: TenkenLimb | null = null;
  constructor(kit: KomamuraKit) {
    super(kit);
    this.armor = 0.7;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'km_shikai', (n) => {
      if (n === 'word') {
        g.callout('轟け「天譴」', 'TODOROKE — TENKEN', RED);
        f.aura.flare(1.4, 0.6);
        g.sfx.play('flare', f.center(), 0.9);
        this.limb = this.kit.phantom('arm.R', 0.95, { damage: 40, knock: 14, launch: 6, heavy: true, hitstop: 0.1, shake: 0.5, cut: 1600, reach: 1.2, thick: 0.25 });
        this.limb.hits.clear();
      }
      if (n === 'form') this.kit.toShikai();
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.limb) this.limb.active = this.t > 0.64 && this.t < 0.86;
  }
  override end(f: Fighter): void {
    super.end(f);
    this.limb?.end();
  }
}

/** F (Shikai): "Bankai — Kokujō Tengen Myō'ō" */
class BankaiAction extends SkillAction {
  readonly name = 'release';
  constructor(kit: KomamuraKit) {
    super(kit);
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'km_bankai', (n) => {
      if (n === 'word') {
        g.callout('卍解「黒縄天譴明王」', "BANKAI — KOKUJŌ TENGEN MYŌ'Ō", RED);
        f.aura.flare(1.8, 0.8);
        g.sfx.play('bankai', f.center(), 1);
      }
      if (n === 'rise') this.kit.summon();
      if (n === 'form') this.kit.toBankai();
    });
  }
}

/** F (Bankai): the One Blow — the giant's full-weight cut */
class OneBlowAction extends SkillAction {
  readonly name = 'oneBlow';
  private hit = 0.88;
  constructor(kit: KomamuraKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.8;
  }
  override start(f: Fighter, g: Game): void {
    const kit = this.kit;
    this.hit = f.anim.clip('km_oneblow')?.events.hit ?? 0.88;
    f.bladeHits.clear();
    f.bladeSpec = { damage: 60, knock: 20, launch: 6, heavy: true, hitstop: 0.14, shake: 0.6, cut: 1400, reach: 0.7 };
    kit.arm({ damage: 170, knock: 44, launch: 12, heavy: true, hitstop: 0.22, shake: 0.9, cut: 3600, reach: 2.6, thick: 0.6 });
    this.playClip(f, 'km_oneblow', (n) => {
      if (n === 'charge') {
        g.callout('一撃', 'ONE BLOW', RED);
        f.aura.flare(2, 0.9);
        g.sfx.play('charge', f.center(), 1);
      }
      if (n === 'step') g.sfx.play('swingHeavy', f.center(), 1.6);
      if (n === 'blow') kit.oneBlow();
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const open = this.t >= this.hit - 0.08 && this.t <= this.hit + 0.16;
    f.bladeActive = open;
    if (f.trail) f.trail.emitting = open;
    if (this.kit.giant) this.kit.giant.active = open;
  }
}

// ---------------------------------------------------------------------------------------------- the kit

export class KomamuraKit implements Kit {
  form: KomamuraForm = 'sealed';
  flare = false;
  comboIndex = 0;
  /** the roar's steadiness (s left) */
  roarT = 0;
  readonly cd = { heavy: 0, throw: 0, haymaker: 0, guard: 0, roar: 0, fist: 0, stomp: 0, blow: 0 };
  giant: TengenGiant | null = null;
  private lastEnd = 0;
  private hpSeen: number;

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.def = { ...f.def, speed: { ...SPEED } };
    this.hpSeen = f.hp;
    this.hands(false);
    this.applyStats();
  }

  /** the right hand closed on Tenken; the left a fist (open to seize) */
  hands(open: boolean): void {
    const rig = this.f.visual.rig;
    rig.setBoneVisible('fist.R', true);
    rig.setBoneVisible('palm.R', false);
    rig.setBoneVisible('fist.L', !open);
    rig.setBoneVisible('palm.L', open);
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    this.roarT = Math.max(0, this.roarT - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    // the giant costs him while it stands; dry, it dissolves
    if (this.giant) {
      if (!this.giant.ending) f.rei -= dt * 2.2;
      this.giant.acting = f.action !== null;
      if (f.hp < this.hpSeen - 0.5) this.giant.flash();
      if ((f.rei <= 0 || f.dead) && !this.giant.ending) this.dismiss();
      if (this.giant.done) this.giant = null;
    }
    this.hpSeen = f.hp;
    this.camera(dt);
    this.applyStats();
  }

  /** the player's camera: higher for his size, pulled far back while the giant stands */
  private camera(dt: number): void {
    const { f, g } = this;
    if (f !== g.player) return;
    const big = this.form === 'bankai' && this.giant !== null;
    const k = Math.min(1, dt * 2);
    g.cam.height += ((big ? 3.6 : 2.3) - g.cam.height) * k;
    g.cam.maxDist = big ? 22 : 14;
    const minD = big ? 12 : 5.6;
    if (g.cam.dist < minD) g.cam.dist += (minD - g.cam.dist) * k;
    else if (!big && g.cam.dist > 14) g.cam.dist += (14 - g.cam.dist) * k;
  }

  target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 90, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 90);
  }

  // ---------------------------------------------------------------- the giant and the limbs

  /** one of Tenken's phantom limbs for a move */
  phantom(kind: LimbKind, life: number, spec: BladeSpec | null): TenkenLimb {
    const { f, g } = this;
    const off = kind === 'arm.R' ? new THREE.Vector3(-1.2, 2.4, -1.8) : kind === 'arm.L' ? new THREE.Vector3(1.2, 1.4, -1.6) : new THREE.Vector3(-0.6, 7.1, 3);
    const l = new TenkenLimb(g, f, kind, life, off, PHANTOM_SCALE);
    l.spec = spec;
    g.addProjectile(l);
    g.sfx.play('flare', f.center(), 0.4);
    return l;
  }

  /** the giant's sword for the next swing */
  arm(spec: BladeSpec): void {
    if (!this.giant) return;
    this.giant.spec = spec;
    this.giant.hits.clear();
  }

  phantomSpec(last: boolean): BladeSpec {
    return last
      ? { damage: 58, knock: 18, launch: 9, heavy: true, hitstop: 0.12, shake: 0.5, cut: 1800, reach: 1.3, thick: 0.25 }
      : { damage: 44, knock: 16, launch: 3, heavy: true, hitstop: 0.09, shake: 0.35, cut: 1500, reach: 1.2, thick: 0.25 };
  }

  giantSpec(last: boolean): BladeSpec {
    return last
      ? { damage: 80, knock: 24, launch: 11, heavy: true, hitstop: 0.14, shake: 0.6, cut: 2800, reach: 2, thick: 0.45 }
      : { damage: 64, knock: 22, launch: 5, heavy: true, hitstop: 0.11, shake: 0.45, cut: 2400, reach: 1.8, thick: 0.4 };
  }

  fistWindow(at: () => THREE.Vector3, r: number, damage: number, opts: DamageOpts, carve: number): FistWindow {
    return { at, r, damage, opts, carve, hits: new Set(), carved: false };
  }

  /** a fist in its hit window: strike whoever it reaches (once), break what it drives into (once) */
  strikeFist(w: FistWindow): void {
    const { f, g } = this;
    const p = w.at();
    for (const o of g.enemiesOf(f)) {
      if (o.dead || w.hits.has(o.id)) continue;
      if (o.center(_v).distanceTo(p) > w.r + o.def.radius + o.def.height * 0.3) continue;
      w.hits.add(o.id);
      _w.subVectors(o.pos, f.pos).setY(0).normalize();
      g.damage(o, w.damage, f, _w.clone(), w.opts);
      g.sparks(o.center(), _w, '#FFB08A', 20);
    }
    if (w.carve > 0 && !w.carved) {
      const r = g.engine.destruction.carve(new SphereShape(p, w.carve), { mode: 'smash', power: 200 + w.carve * 90, impulse: 12 + w.carve * 3, debris: 0.4 });
      if (r.removed > 0 || w.hits.size > 0) {
        w.carved = true;
        g.sfx.play('hitHeavy', p, 1.2);
        for (let i = 0; i < 10; i++) g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.3) * 8, vz: (Math.random() - 0.5) * 12, size: 0.5, sizeEnd: 0.05, life: 0.35, r: 1, g: 0.5, b: 0.3, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 2 });
        if (f === g.player) g.shake(Math.min(0.5, 0.15 + w.carve * 0.08));
      }
    }
  }

  /** the lunge into a cut: further when the target stands off */
  lunge(base: number): void {
    const f = this.f;
    const tgt = f.faceTarget;
    const extra = tgt ? Math.min(4, Math.max(0, f.pos.distanceTo(tgt) - 2.6)) : 0;
    f.push.addScaledVector(f.forward(_v), base + extra * 3);
  }

  /** the chop strikes the ground: at his blade's tip, the phantom's or the giant's */
  slam(limb: TenkenLimb | null): void {
    const { f, g } = this;
    if (this.form === 'bankai' && this.giant) {
      const p = ground(g, this.giant.bladePoint(0.8), 16);
      this.quake(p, 6, 50, 1300);
      return;
    }
    if (this.form === 'shikai' && limb) {
      const p = ground(g, limb.bladePoint(0.85), 10);
      this.quake(p, 3.4, 40, 800);
      return;
    }
    const p = ground(g, f.blade.tip.clone());
    this.quake(p, 1.8, 30, 420);
  }

  /** an impact on the ground: a crater, a ring, those near thrown up */
  quake(p: THREE.Vector3, r: number, damage: number, power: number): void {
    const { f, g } = this;
    g.groundImpact(p, r, power, RED, f);
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      _v.subVectors(o.pos, p);
      const d = Math.hypot(_v.x, _v.z);
      if (d > r * 2 + o.def.radius || Math.abs(_v.y) > r + 2) continue;
      g.damage(o, damage * (1 - (d / (r * 2.4)) * 0.5), f, _v.setY(0).normalize().clone(), { knock: 10 + r * 2, launch: 6 + r, heavy: true, hitstop: 0.08, shake: 0.4 });
    }
    if (f === g.player || (g.player && g.player.pos.distanceTo(p) < r * 6)) g.shake(Math.min(0.8, 0.2 + r * 0.08));
  }

  /** RMB's strike: the ground split open in a line from the blade */
  split(limb: TenkenLimb | null): void {
    const { f, g } = this;
    const fw = f.forward(new THREE.Vector3()).setY(0).normalize();
    if (this.form === 'bankai' && this.giant) {
      const p = ground(g, this.giant.bladePoint(0.75), 16);
      this.quake(p, 5.5, 60, 1400);
      g.addProjectile(new Fissure(g, f, p, fw, { len: 70, width: 3.4, depth: 4.6, damage: 84, speed: 85, slab: 24 }));
      g.slowMo(0.25, 0.4);
      return;
    }
    if (this.form === 'shikai' && limb) {
      const p = ground(g, limb.bladePoint(0.85), 10);
      this.quake(p, 3, 44, 900);
      g.addProjectile(new Fissure(g, f, p, fw, { len: 42, width: 2.2, depth: 3, damage: 60, speed: 60, slab: 10 }));
      return;
    }
    const p = ground(g, f.blade.tip.clone());
    this.quake(p, 1.6, 30, 500);
    g.addProjectile(new Fissure(g, f, p, fw, { len: 20, width: 1, depth: 1.5, damage: 40, speed: 42 }));
  }

  /** E: the stomp lands — the phantom foot's or the giant's */
  stomp(limb: TenkenLimb | null): void {
    const { f, g } = this;
    if (this.form === 'bankai' && this.giant) {
      const p = ground(g, this.giant.point('foot.R'), 16);
      this.quake(p, 6.5, 54, 1400);
      g.addRing(p.clone().setY(p.y + 0.5), 30, RED, 0.8);
      return;
    }
    if (limb) {
      const p = ground(g, limb.point('foot.R'), 12);
      this.quake(p, 4, 44, 900);
      return;
    }
    this.quake(ground(g, f.pos.clone().addScaledVector(f.forward(_v), 0.8)), 1.4, 20, 300);
  }

  /** G: the roar — those near reel, he stands steadier for a while */
  roar(): void {
    const { f, g } = this;
    this.roarT = 6;
    g.sfx.play('howl', f.center(), 1.2);
    g.sfx.play('roar', f.center(), 1);
    f.aura.flare(1.6, 0.5);
    g.addRing(f.pos.clone().setY(f.pos.y + 0.3), 10, RED, 0.5);
    g.addRing(f.pos.clone().setY(f.pos.y + 1.8), 6, '#FFC09A', 0.35);
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      _v.subVectors(o.pos, f.pos).setY(0);
      const d = _v.length();
      if (d > 10 + o.def.radius) continue;
      g.damage(o, 10, f, _v.normalize().clone(), { knock: 12 * (1 - d / 12), heavy: d < 6, hitstop: 0.05, shake: 0.3 });
      o.hitstun = Math.max(o.hitstun, 0.9 * (1 - d / 12));
    }
    const c = f.center();
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.glow.spawn({ x: c.x, y: c.y + 0.6, z: c.z, vx: Math.cos(a) * 12, vy: (Math.random() - 0.3) * 3, vz: Math.sin(a) * 12, size: 0.45, sizeEnd: 0.05, life: 0.5, r: TENGEN_RED[0], g: TENGEN_RED[1] * 2, b: TENGEN_RED[2], alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 2 });
    }
    if (f === g.player) g.shake(0.4);
  }

  /** Q (sealed): whoever is right in front of him, by the collar */
  seize(range: number): Fighter | null {
    const { f, g } = this;
    const fw = f.forward(new THREE.Vector3());
    let best: Fighter | null = null, bd = range;
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
    g.damage(best, 8, f, fw, { knock: 0, hitstop: 0.1, shake: 0.2 });
    return best;
  }

  /** the throw's end: driven down into the ground in front of him */
  slamDown(o: Fighter): void {
    const { f, g } = this;
    const fw = f.forward(new THREE.Vector3());
    const p = ground(g, f.pos.clone().addScaledVector(fw, 2.4));
    if (!f.body.overlaps(p.x, p.y + 0.05, p.z)) {
      o.body.pos.copy(p);
      o.body.prev.copy(p);
    }
    g.damage(o, 50, f, fw, { knock: 6, launch: 3, heavy: true, hitstop: 0.16, shake: 0.6 });
    g.groundImpact(p, 2.2, 480, RED, f);
  }

  /** F (Shikai): the giant rises */
  summon(): void {
    const { f, g } = this;
    if (this.giant) return;
    this.giant = new TengenGiant(g, f, GIANT_SCALE, 1.5);
    g.addProjectile(this.giant);
    const p = this.giant.pos.clone();
    g.groundImpact(p, 5, 900, RED, f);
    g.addRing(p.clone().setY(p.y + 0.4), 26, RED, 1);
    g.sfx.play('crumble', p, 1.4);
    g.sfx.play('roarBig', p, 0.8);
    if (f === g.player || (g.player && g.player.pos.distanceTo(p) < 80)) g.shake(0.7);
  }

  toShikai(): void {
    const { f } = this;
    this.form = 'shikai';
    f.aura.flare(1.4, 0.5);
    this.applyStats();
  }

  toBankai(): void {
    this.form = 'bankai';
    this.applyStats();
  }

  /** the giant dissolves back into reishi: Shikai again */
  dismiss(): void {
    const { f, g } = this;
    if (!this.giant) return;
    this.giant.dismiss();
    this.form = 'shikai';
    g.sfx.play('purify', this.giant.pos, 1);
    if (f === g.player) g.hud?.showBanner('The giant dissolves — reiatsu spent');
    this.applyStats();
  }

  /** F (Bankai): the One Blow lands */
  oneBlow(): void {
    const { f, g } = this;
    g.slowMo(0.45, 0.3);
    f.aura.pillarBurst(3);
    if (this.giant) {
      const p = ground(g, this.giant.bladePoint(0.7), 16);
      this.quake(p, 7, 70, 1800);
    }
    if (f === g.player) g.shake(0.9);
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
    if (f.busy) return;
    if (this.g.time - this.lastEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const idx = i % KOMAMURA_CHAIN.length;
    this.comboIndex = idx + 1;
    this.lastEnd = this.g.time + 0.9;
    this.f.act(new CutAction(this, KOMAMURA_CHAIN[idx], idx, idx === KOMAMURA_CHAIN.length - 1), true);
  }

  heavy(): void {
    this.special(new DrawAction(this), this.form === 'bankai' ? 28 : this.form === 'shikai' ? 22 : 14, 'heavy', this.form === 'sealed' ? 4 : 5);
  }

  /** Q: the overhead throw / the giant fist */
  skill1(): void {
    if (this.form === 'sealed') this.special(new ThrowAction(this), 14, 'throw', 6);
    else this.special(new FistAction(this), this.form === 'bankai' ? 24 : 18, 'fist', this.form === 'bankai' ? 4 : 3.5);
  }

  /** E: the haymaker / the stomp */
  skill2(): void {
    if (this.form === 'sealed') this.special(new HaymakerAction(this), 16, 'haymaker', 5);
    else this.special(new StompAction(this), this.form === 'bankai' ? 26 : 20, 'stomp', this.form === 'bankai' ? 6 : 5);
  }

  /** R: the iron forearm */
  skill3(): void {
    this.special(new GuardAction(this), 8, 'guard', 2.5);
  }

  /** G: the roar */
  toggle(): void {
    this.special(new RoarAction(this), 12, 'roar', 9);
  }

  /** F: Shikai → Bankai → the One Blow */
  release(): void {
    const { f, g } = this;
    if (this.form === 'bankai') {
      this.special(new OneBlowAction(this), 70, 'blow', 20);
      return;
    }
    if (f.busy) return;
    const cost = this.form === 'sealed' ? 30 : 60;
    if (!f.spendRei(cost)) {
      if (f === g.player) g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(this.form === 'sealed' ? new ShikaiAction(this) : new BankaiAction(this), true);
  }

  toggleFlare(): void {
    this.flare = !this.flare;
    this.applyStats();
    if (this.flare) {
      this.f.aura.flare(1.6, 0.4);
      this.g.shake(0.2);
      this.g.sfx.play('flare', this.f.center());
      // the floor breaks round him
      this.g.engine.destruction.carve(new SphereShape(this.f.pos.clone(), 2.2, 0.5), { mode: 'smash', power: 120, impulse: 6, noCollapse: true });
    }
  }

  private applyStats(): void {
    const f = this.f;
    f.power = (this.form === 'bankai' ? 1.2 : this.form === 'shikai' ? 1.1 : 1) * (this.flare ? 1.25 : 1);
    f.damageTaken = this.form === 'bankai' ? 0.85 : 0.92;
    f.knockTaken = 0.55;
    f.toughness = this.roarT > 0 ? 30 : 0;
    f.aura.target = this.flare ? 1 : this.form === 'bankai' ? 0.5 : this.roarT > 0 ? 0.3 : this.form === 'shikai' ? 0.12 : 0.04;
  }

  formName(): string {
    if (this.form === 'bankai') return "Bankai — Kokujō Tengen Myō'ō";
    if (this.form === 'shikai') return 'Shikai — Tenken';
    return 'Captain, 7th Division';
  }

  ai(): KitAI {
    const sealed = () => this.form === 'sealed', shikai = () => this.form === 'shikai', bankai = () => this.form === 'bankai';
    const kit = this;
    return {
      get reach() {
        return kit.form === 'bankai' ? 6 : kit.form === 'shikai' ? 3.4 : 2.7;
      },
      chain: 4,
      releaseAt: [0.85, 0.6],
      toggleAt: 0.8,
      toggleOn: () => kit.roarT > 0,
      moves: [
        { name: 'draw', use: () => this.heavy(), min: 3, max: 16, weight: 1, cd: 5, when: sealed },
        { name: 'throw', use: () => this.skill1(), min: 0, max: 2.8, weight: 1, cd: 6, when: sealed },
        { name: 'haymaker', use: () => this.skill2(), min: 0, max: 3, weight: 0.9, cd: 6, when: sealed },
        { name: 'guard', use: () => this.skill3(), min: 0, max: 3.5, weight: 0.5, cd: 6 },
        { name: 'chasm', use: () => this.heavy(), min: 4, max: 30, weight: 1.3, cd: 5, when: shikai },
        { name: 'pfist', use: () => this.skill1(), min: 3, max: 11, weight: 1.1, cd: 4, when: shikai },
        { name: 'pstomp', use: () => this.skill2(), min: 2, max: 9, weight: 1, cd: 5, when: shikai },
        { name: 'punish', use: () => this.heavy(), min: 6, max: 55, weight: 1.3, cd: 6, when: bankai },
        { name: 'gfist', use: () => this.skill1(), min: 5, max: 18, weight: 1.1, cd: 4, when: bankai },
        { name: 'gstomp', use: () => this.skill2(), min: 0, max: 14, weight: 1, cd: 6, when: bankai },
        { name: 'blow', use: () => this.release(), min: 6, max: 24, weight: 1.4, cd: 16, when: () => bankai() && this.f.rei >= 70 },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    if (this.form === 'bankai')
      return [
        { key: 'LMB', name: 'Giant sword', kanji: '明王' },
        { key: 'RMB', name: 'Heavenly Punishment', kanji: '天譴', cost: 28, cd: cd.heavy, cdMax: 5 },
        { key: 'Q', name: 'Giant fist', kanji: '拳', cost: 24, cd: cd.fist, cdMax: 4 },
        { key: 'E', name: 'Giant stomp', kanji: '踏', cost: 26, cd: cd.stomp, cdMax: 6 },
        { key: 'R', name: 'Iron forearm', kanji: '鉄腕', cost: 8, cd: cd.guard, cdMax: 2.5 },
        { key: 'Shift', name: 'Shunpo', kanji: '瞬歩' },
        { key: 'G', name: 'Roar', kanji: '咆哮', cost: 12, cd: cd.roar, cdMax: 9, active: this.roarT > 0 },
        { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
        { key: 'F', name: 'One Blow', kanji: '一撃', cost: 70, cd: cd.blow, cdMax: 20 },
      ];
    if (this.form === 'shikai')
      return [
        { key: 'LMB', name: 'Tenken', kanji: '天譴' },
        { key: 'RMB', name: 'Chasm', kanji: '裂地', cost: 22, cd: cd.heavy, cdMax: 5 },
        { key: 'Q', name: 'Phantom fist', kanji: '拳', cost: 18, cd: cd.fist, cdMax: 3.5 },
        { key: 'E', name: 'Phantom stomp', kanji: '踏', cost: 20, cd: cd.stomp, cdMax: 5 },
        { key: 'R', name: 'Iron forearm', kanji: '鉄腕', cost: 8, cd: cd.guard, cdMax: 2.5 },
        { key: 'Shift', name: 'Shunpo', kanji: '瞬歩' },
        { key: 'G', name: 'Roar', kanji: '咆哮', cost: 12, cd: cd.roar, cdMax: 9, active: this.roarT > 0 },
        { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
        { key: 'F', name: 'Bankai', kanji: '卍解', cost: 60 },
      ];
    return [
      { key: 'LMB', name: 'Tenken', kanji: '刀' },
      { key: 'RMB', name: 'Earth-splitting draw', kanji: '裂地', cost: 14, cd: cd.heavy, cdMax: 4 },
      { key: 'Q', name: 'Overhead throw', kanji: '投', cost: 14, cd: cd.throw, cdMax: 6 },
      { key: 'E', name: 'Haymaker', kanji: '剛拳', cost: 16, cd: cd.haymaker, cdMax: 5 },
      { key: 'R', name: 'Iron forearm', kanji: '鉄腕', cost: 8, cd: cd.guard, cdMax: 2.5 },
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩' },
      { key: 'G', name: 'Roar', kanji: '咆哮', cost: 12, cd: cd.roar, cdMax: 9, active: this.roarT > 0 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      { key: 'F', name: 'Todoroke, Tenken', kanji: '轟', cost: 30 },
    ];
  }
}

void TEX_GLOW;
