// TYBW Kenpachi (docs/kits/kenpachi.md, Thousand-Year Blood War loadout): the Soul Society kit after Unohana. Sealed:
// real Shunpo; V hides his reiatsu (veiled; the first blow out of hiding is an ambush); R Bait & Grab — the chest bared,
// the first blow taken at half and its owner seized, head-butted and slammed. F: "Nome, Nozarashi" — the cleaver shreds
// the shots it passes; Q Space Cut tears a rift of outer space along the swing (shots and fields undone, whatever holds
// him cut away, the near pulled in); E Deflect dumps beams and shots into the ground; R the Giant Grapple (a chokeslam,
// or a giant's leg torn out from under it); V Skyfall Cleave. F again: Bankai — Nozarashi, shaped like Yachiru, pours it
// into his hand: Shift the oni's pounce, Q Bite & Rip, E the launching uppercut, R Shield Breaker (unblockable), G the
// roar (allies too), V The Perfect Crimson; the overload fills until the right arm tears apart at the elbow — fists and
// kicks and a one-armed trip until it is bound back. Every form: adaptation (the third time a technique lands, he has
// its measure).
import * as THREE from 'three';
import type { Fighter, FighterDef } from '../fighter';
import type { DamageOpts, Game } from '../game';
import type { KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import {
  AURA_KENPACHI, BLADE_CLEAVER, GOLD, KENPACHI_DEF, KenpachiKit, SkillAction, slabQuat, strike,
} from './kenpachi';
import { kenpachiAsset, kenpachiProp } from '../../chars/kenpachi';
import { KENPACHI_CLIPS, KENPACHI_SHIKAI_STANCE, KENPACHI_STANCE } from '../../chars/kenpachiClips';
import { KENPACHI_TYBW_CLIPS } from '../../chars/kenpachiTybwClips';
import { CrimsonBlade, SpaceRift, YachiruSpirit } from '../../vfx/nozarashi';
import { BoxShape, CapsuleShape, SphereShape } from '../../destruction/shapes';
import { TEX_GLOW, TEX_PUFF, TEX_RING, TEX_STREAK } from '../../vfx/sprites';

const RIFT = '#B9A2FF';
const CRIMSON = '#FF5A2A';
const PINK = '#FFB3CF';
const SPEED_TYBW = { run: 9.5, sprint: 21, jump: 11.5, dash: 15, dashTime: 0.12 };

export const KENPACHI_TYBW_DEF: FighterDef = {
  ...KENPACHI_DEF,
  id: 'kenpachi-tybw',
  build: () => ({
    asset: kenpachiAsset('tybw'),
    props: [
      { key: 'sword', model: kenpachiProp('nozarashi'), socket: 'grip.R' },
      { key: 'saya', model: kenpachiProp('saya'), socket: 'hip.L' },
      { key: 'patch', model: kenpachiProp('eyepatch-tybw'), socket: 'patch' },
    ],
  }),
  clips: [...KENPACHI_CLIPS, ...KENPACHI_TYBW_CLIPS],
  hp: 1350,
  rei: 150,
  speed: { ...SPEED_TYBW },
};

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

const isGiant = (o: Fighter): boolean => o.giant || o.def.height >= 3.5;

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

interface MoveOpts {
  armor?: number;
  mobility?: number;
  invulnerable?: boolean;
  gravity?: number;
  dur?: number;
  tick?: (a: Move, dt: number) => void;
  end?: (a: Move) => void;
}

/** A technique: a clip, its events, an optional per-step hook. */
class Move extends SkillAction {
  readonly name: string;
  /** whoever the move holds */
  held: Fighter | null = null;
  flag = false;
  constructor(kit: KenpachiTybwKit, name: string, readonly clip: string, readonly on: (n: string, a: Move) => void, readonly o: MoveOpts = {}) {
    super(kit);
    this.name = name;
    this.armor = o.armor ?? 0;
    this.mobility = o.mobility ?? 0;
    this.invulnerable = o.invulnerable ?? false;
    this.airGravity = o.gravity ?? 1;
  }
  override start(f: Fighter): void {
    this.playClip(f, this.clip, (n) => this.on(n, this));
    if (this.o.dur) this.dur = this.o.dur;
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    this.o.tick?.(this, dt);
  }
  override end(f: Fighter): void {
    super.end(f);
    this.o.end?.(this);
  }
}

export class KenpachiTybwKit extends KenpachiKit {
  readonly cd2 = { space: 0, deflect: 0, grapple: 0, sky: 0, bait: 0, bite: 0, upper: 0, rush: 0, roar: 0, hide: 0 };
  /** V in the sealed state: his reiatsu hidden */
  hidden = false;
  /** Bankai overload (0-100): at 100 the right arm tears apart */
  overload = 0;
  /** the torn arm's time left */
  tornT = 0;
  /** Bankai refused until this runs out (after a reseal or the torn arm) */
  bankaiLock = 0;
  private adapt = new Map<string, { n: number; t: number }>();
  private baseTaken = 0.85;
  private lastRead = -99;
  private wasDashing = false;
  private rift: SpaceRift | null = null;
  private riftT = 0;
  private baitCatch: Fighter | null = null;
  private lastDeflect = -99;
  private crimson: CrimsonBlade | null = null;

  constructor(f: Fighter, g: Game) {
    super(f, g);
    this.patchProp = 'eyepatch-tybw';
    this.bankaiForm = 'tybw-bankai';
    f.parry = (amount, from, o) => this.parry(amount, from, o);
    f.onHurt = (_dmg, heavy) => {
      if (heavy && this.hidden) this.reveal();
    };
    this.applyStats();
  }

  // ---------------------------------------------------------------- bits

  private line(kanji: string, text: string, color = GOLD, every = 4): void {
    if (this.g.time - this.lastRead < every) return;
    this.lastRead = this.g.time;
    this.g.callout(kanji, text, color);
  }

  private face(t: Fighter | null): void {
    if (!t) return;
    const f = this.f;
    f.faceTarget = t.center();
    f.yaw = Math.atan2(t.pos.x - f.pos.x, t.pos.z - f.pos.z);
  }

  /** start a technique: cooldown, reiatsu, the hidden reiatsu given away */
  private use(a: Move, cost: number, key: keyof typeof this.cd2, cd: number): boolean {
    const f = this.f;
    if (this.cd2[key] > 0) return false;
    if (f.action && !f.action.canCancel(a)) return false;
    if (f.hitstun > 0 || f.dashT > 0 || f.dead) return false;
    if (!f.spendRei(cost)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return false;
    }
    this.cd2[key] = cd;
    this.reveal();
    f.act(a, true);
    if (this.form === 'bankai') this.overload = Math.min(100, this.overload + (key === 'roar' ? 8 : key === 'bite' ? 14 : 12));
    return true;
  }

  private banner(text: string): void {
    if (this.f === this.g.player) this.g.hud?.showBanner(text);
  }

  // ---------------------------------------------------------------- passives

  /** adaptation, Deflect, Bait & Grab */
  private parry(_amount: number, from: Fighter | null, o: DamageOpts): boolean {
    const { f, g } = this;
    f.damageTaken = this.baseTaken;
    const a = f.action;
    const front = !from || _v.subVectors(from.pos, f.pos).setY(0).normalize().dot(f.forward(_w)) > 0.17;
    // Deflect: the flat of the cleaver takes it
    if (a instanceof Move && a.name === 'deflect' && a.t >= 0.04 && a.t <= 1.0 && front) {
      const near = from !== null && from.pos.distanceTo(f.pos) < 4.5 && !o.energy;
      if (near && from) {
        // a blade beaten down, and answered
        from.hitstun = Math.max(from.hitstun, 0.6);
        g.damage(from, 70 * this.growthMul(), f, from.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 14, launch: 2, heavy: true, hitstop: 0.1, shake: 0.4 });
        g.sfx.play('ting', f.center(), 1.3);
      } else this.dumpShot();
      a.flag = true;
      return true;
    }
    // Bait & Grab: the blow lands (at half, the stance's armour) and its owner is seized; a shot is caught and tossed
    if (a instanceof Move && a.name === 'bait' && a.t < 1.25 && !this.baitCatch) {
      if (from && from.pos.distanceTo(f.pos) < 5 && !o.energy) {
        this.baitCatch = from;
        return false;
      }
      g.rejectNear(f.center().addScaledVector(f.forward(_w), 1), 2.5, f, false);
      g.sparks(f.center(), f.forward(_w), GOLD, 14);
      g.sfx.play('ting', f.center(), 1);
      this.line('掴', 'CAUGHT', GOLD, 2);
      a.done = true;
      return true;
    }
    if (!from || from === f || o.reflected) return false;
    // adaptation: the same technique from the same foe a third time — he has its measure
    const key = `${from.id}:${o.energy ? 'e' : 'b'}:${from.action?.name ?? 'shot'}`;
    const ad = this.adapt.get(key) ?? { n: 0, t: 0 };
    if (g.time - ad.t > 20) ad.n = 0;
    ad.n++;
    ad.t = g.time;
    this.adapt.set(key, ad);
    if (ad.n >= 3) {
      f.damageTaken = this.baseTaken * (ad.n >= 5 ? 0.6 : 0.75);
      if (ad.n === 3) {
        g.hud?.floatText(f.center().setY(f.pos.y + f.def.height + 0.3), '見切った', GOLD, 20);
        this.line('見切', 'READ IT', GOLD, 6);
      }
    }
    return false;
  }

  /** a beam or a shot caught on the flat and dumped into the ground beside him: a glowing furrow, a crater */
  private dumpShot(): void {
    const { f, g } = this;
    g.rejectNear(f.center().addScaledVector(f.forward(_w), 1.6), 2.5, f, false);
    if (g.time - this.lastDeflect < 0.15) return;
    this.lastDeflect = g.time;
    const fw = f.forward(new THREE.Vector3());
    const right = new THREE.Vector3(-fw.z, 0, fw.x);
    const c = f.center().addScaledVector(fw, 1);
    g.sparks(c, fw.clone().negate(), GOLD, 22);
    g.sfx.play('ting', c, 1.4);
    g.sfx.play('impact', c, 1);
    for (let i = 0; i < 18; i++) {
      const k = i / 17;
      const p = f.pos.clone().addScaledVector(fw, 1 + k * 1.5).addScaledVector(right, 0.8 + k * 6);
      g.engine.glow.spawn({ x: p.x, y: p.y + 0.15, z: p.z, vx: right.x * 3, vy: 1 + Math.random() * 2, vz: right.z * 3, size: 0.3, sizeEnd: 0.05, life: 0.4 + k * 0.3, r: 1, g: 0.86, b: 0.45, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2.5, drag: 2 });
    }
    const end = f.pos.clone().addScaledVector(fw, 2.5).addScaledVector(right, 6.8);
    g.engine.destruction.carve(new CapsuleShape(f.pos.clone().addScaledVector(right, 1).setY(f.pos.y - 0.3), end.clone().setY(f.pos.y - 0.3), 0.5), { mode: 'smash', power: 200, impulse: 6, dust: 0.5 });
    g.groundImpact(end, 1.4, 220, GOLD, f);
    g.shake(f === g.player ? 0.25 : 0.1);
  }

  override update(dt: number): void {
    super.update(dt);
    const { f, g } = this;
    for (const k of Object.keys(this.cd2) as (keyof typeof this.cd2)[]) this.cd2[k] = Math.max(0, this.cd2[k] - dt);
    if (this.bankaiLock > 0) this.bankaiLock = Math.max(0, this.bankaiLock - dt);
    if (f.dead) return;
    // the hidden reiatsu
    if (this.hidden) {
      f.veiled = true;
      f.aura.target = 0;
      this.skull.target = 0;
      f.rei = Math.min(f.maxRei, f.rei + dt * 2);
    }
    // the Bankai eats his body
    if (this.form === 'bankai') {
      this.overload = Math.min(100, this.overload + dt * 4);
      if (this.overload >= 100 && !(f.action instanceof Move && f.action.name === 'crimson')) this.shatter();
    } else if (this.overload > 0) this.overload = Math.max(0, this.overload - dt * 6);
    // the torn arm
    if (this.tornT > 0) {
      this.tornT -= dt;
      if (this.tornT <= 0) this.restoreArm();
    }
    // the rift sucks at whatever is near
    if (this.rift && !this.rift.done && this.riftT > 0) {
      this.riftT -= dt;
      for (const o of g.enemiesOf(f)) {
        const d = this.rift.dist(o.center());
        if (d > 7 || d < 0.3) continue;
        _v.subVectors(this.rift.at, o.center()).setY(0);
        if (_v.lengthSq() > 1e-4) o.push.addScaledVector(_v.normalize(), 26 * dt * (1 - d / 7));
      }
    }
    // Shift in the Bankai: the oni's pounce
    const dashing = f.dashT > 0;
    if (dashing && !this.wasDashing && this.form === 'bankai') this.pounce();
    this.wasDashing = dashing;
    // the Bait & Grab caught someone
    const a = f.action;
    if (this.baitCatch && a instanceof Move && a.name === 'bait') this.seize(this.baitCatch);
    if (!(a instanceof Move && a.name === 'bait')) this.baitCatch = null;
  }

  protected override applyStats(): void {
    super.applyStats();
    const f = this.f;
    if (this.tornT > 0) f.power *= 0.8;
    if (this.hidden) {
      // the first blow out of hiding
      f.power *= 1.5;
      f.aura.target = 0;
      this.skull.target = 0;
    }
    this.baseTaken = f.damageTaken;
  }

  /** the string: fists and kicks while the arm is torn (or the sword knocked away) */
  protected override pick(): string {
    if (this.tornT > 0 || this.f.disarmT > 0) return this.lastClip === 'kp_punch' ? 'kp_kick' : 'kp_punch';
    return super.pick();
  }

  bareHands(): boolean {
    return true;
  }

  /** the first blow landed from hiding: an ambush */
  override landed(n: number): void {
    super.landed(n);
    if (this.hidden) {
      this.line('奇襲', 'AMBUSH', GOLD, 1);
      this.g.hitstop(0.08);
      for (const o of this.g.enemiesOf(this.f)) if (o.pos.distanceTo(this.f.pos) < 4) o.hitstun = Math.max(o.hitstun, 0.7);
      this.reveal();
    }
  }

  /** the cleaver shreds the shots it passes through */
  override bladeTick(): void {
    if (this.form !== 'shikai') return;
    const b = this.f.blade;
    _v.addVectors(b.base, b.tip).multiplyScalar(0.5);
    this.g.rejectNear(_v, 1.8, this.f, false);
  }

  override meteorCrash(): void {
    super.meteorCrash();
    // whatever was falling on him is gone with it
    this.g.rejectNear(this.f.center(), 8, this.f, false);
  }

  // ---------------------------------------------------------------- the hidden reiatsu

  private hide(): void {
    const { f, g } = this;
    if (this.hidden || this.form !== 'sealed' || this.cd2.hide > 0) return;
    this.hidden = true;
    this.cd2.hide = 2;
    f.veiled = true;
    g.hud?.floatText(f.center().setY(f.pos.y + f.def.height + 0.3), '…', '#9AA0A8', 22);
    for (let i = 0; i < 20; i++) {
      const c = f.center();
      g.engine.glow.spawn({ x: c.x + (Math.random() - 0.5) * 1.2, y: c.y + (Math.random() - 0.4) * 1.6, z: c.z + (Math.random() - 0.5) * 1.2, vx: 0, vy: -0.6, vz: 0, size: 0.2, sizeEnd: 0.02, life: 0.6, r: 1, g: 0.85, b: 0.3, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW, drag: 1 });
    }
    this.applyStats();
  }

  private reveal(): void {
    if (!this.hidden) return;
    this.hidden = false;
    this.f.veiled = false;
    this.cd2.hide = 3;
    this.f.aura.flare(1.2, 0.3);
    this.applyStats();
  }

  // ---------------------------------------------------------------- inputs

  override attack(): void {
    if (this.form === 'bankai' || this.tornT > 0 || this.form === 'shikai') this.reveal();
    super.attack();
  }

  override heavy(): void {
    if (this.tornT > 0 || (this.f.disarmT > 0 && this.form !== 'bankai')) {
      this.grapple();
      return;
    }
    this.reveal();
    super.heavy();
  }

  override skill1(): void {
    if (this.tornT > 0) {
      this.reveal();
      super.skill2();
      return;
    }
    if (this.form === 'shikai') this.spaceCut();
    else if (this.form === 'bankai') this.biteRip();
    else {
      this.reveal();
      super.skill1();
    }
  }

  override skill2(): void {
    if (this.tornT > 0) {
      this.bait();
      return;
    }
    if (this.form === 'shikai') this.deflect();
    else if (this.form === 'bankai') this.uppercut();
    else {
      this.reveal();
      super.skill2();
    }
  }

  override skill3(): void {
    if (this.tornT > 0 || this.form === 'shikai') this.grapple();
    else if (this.form === 'bankai') this.shieldBreaker();
    else this.bait();
  }

  override toggle(): void {
    if (this.form === 'bankai') this.roar();
    else super.toggle();
  }

  override toggleFlare(): void {
    if (this.tornT > 0) {
      this.banner('Not with one arm');
      return;
    }
    if (this.form === 'sealed') {
      if (this.hidden) this.reveal();
      else this.hide();
    } else if (this.form === 'shikai') this.skyfall();
    else this.perfectCrimson();
  }

  override release(): void {
    const { f, g } = this;
    if (f.busy) return;
    if (this.form === 'bankai') {
      this.reseal();
      return;
    }
    if (this.tornT > 0 || this.bankaiLock > 0) {
      this.banner(this.tornT > 0 ? 'The arm first' : `Nozarashi is silent (${Math.ceil(this.bankaiLock)} s)`);
      return;
    }
    this.reveal();
    if (this.form === 'sealed') {
      super.release();
      return;
    }
    if (!f.spendRei(45)) {
      this.banner('Not enough reiatsu');
      return;
    }
    // Bankai: Nozarashi, shaped like Yachiru, rises and pours it into his hand
    f.act(new Move(this, 'bankai', 'kp_bankai', (n) => {
      if (n === 'charge') {
        g.addProjectile(new YachiruSpirit(g, f, kenpachiProp('yachiru'), 0.95));
        f.aura.flare(0.9, 0.6);
        g.sfx.play('charge', f.center(), 1.2);
        g.shake(0.3);
      }
      if (n === 'burst') {
        this.overload = 0;
        this.becomeBankai();
        // the ground under him melts
        for (let i = 0; i < 40; i++) {
          const a = Math.random() * Math.PI * 2, r = 1 + Math.random() * 3.5;
          g.engine.glow.spawn({ x: f.pos.x + Math.cos(a) * r, y: f.pos.y + 0.1, z: f.pos.z + Math.sin(a) * r, vx: 0, vy: 0.5 + Math.random(), vz: 0, size: 0.6, sizeEnd: 0.1, life: 1.6 + Math.random(), r: 1, g: 0.35, b: 0.05, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
        }
      }
    }, { invulnerable: true }), true);
  }

  // ---------------------------------------------------------------- sealed: Bait & Grab

  private bait(): void {
    this.use(new Move(this, 'bait', 'kp_taunt', () => {}, { armor: 0.5, dur: 1.25 }), 10, 'bait', 7);
  }

  /** the attacker seized: the free hand on the collar, a head-butt, lifted, slammed */
  private seize(o: Fighter): void {
    const { f, g } = this;
    this.baitCatch = null;
    if (o.dead) return;
    this.face(o);
    this.line('捕', 'GOT YOU', GOLD, 2);
    const m = new Move(this, 'seize', 'kt_seize', (n, a) => {
      if (n === 'grab' && o.pos.distanceTo(f.pos) < 5.5 && !o.dead) a.held = o;
      if (n === 'butt' && a.held) g.damage(a.held, 30 * this.growthMul(), f, f.forward(new THREE.Vector3()), { knock: 0, hitstop: 0.08, shake: 0.3 });
      if (n === 'lift') a.flag = true;
      if (n === 'slam' && a.held) {
        const h = a.held;
        a.held = null;
        const p = f.pos.clone().addScaledVector(f.forward(_w), 1.4);
        h.body.pos.set(p.x, f.pos.y + 0.2, p.z);
        h.body.prev.copy(h.body.pos);
        g.damage(h, 90 * this.growthMul(), f, f.forward(new THREE.Vector3()), { knock: 4, launch: 2, heavy: true, hitstop: 0.14, shake: 0.6 });
        h.hitstun = Math.max(h.hitstun, 1);
        g.groundImpact(p, 2, 260, GOLD, f);
        this.landed(1);
      }
    }, {
      armor: 0.6,
      tick: (a) => {
        const h = a.held;
        if (!h || h.dead) return;
        const p = sock(f, 'palm.L', _v);
        h.body.pos.set(p.x, p.y - (a.flag ? h.def.height * 0.3 : h.def.height * 0.82), p.z);
        h.body.prev.copy(h.body.pos);
        h.body.vel.set(0, 0, 0);
        h.hitstun = Math.max(h.hitstun, 0.3);
      },
      end: (a) => {
        a.held = null;
      },
    });
    f.act(m, true);
  }

  // ---------------------------------------------------------------- Shikai

  /** Q: Space Cut — the rift of outer space along a two-handed diagonal cleave */
  private spaceCut(): void {
    const { f, g } = this;
    this.use(new Move(this, 'space', 'kt_space', (n) => {
      if (n === 'charge') {
        f.aura.flare(1.4, 0.7);
        this.skull.flare(1, 0.8);
        g.sfx.play('charge', f.center(), 1);
      }
      if (n === 'step') {
        f.push.addScaledVector(f.forward(_w), 5);
        g.sfx.play('swingHeavy', f.center(), 1.3);
      }
      if (n === 'hit') this.tearSpace();
    }, {
      armor: 0.4,
      tick: (a) => {
        f.bladeActive = a.t >= 0.38 && a.t <= 0.5;
        if (f.trail) f.trail.emitting = a.t >= 0.36 && a.t <= 0.58;
      },
    }), 30, 'space', 9);
    if (f.action instanceof Move && f.action.name === 'space') {
      f.bladeHits.clear();
      f.bladeSpec = { damage: 50 * this.growthMul(), knock: 12, launch: 3, heavy: true, hitstop: 0.1, shake: 0.4, cut: 900 };
    }
  }

  private tearSpace(): void {
    const { f, g } = this;
    const fw = f.forward(new THREE.Vector3());
    const mul = this.growthMul();
    const { across } = slabQuat(fw, 55);
    this.slab(26, 6, 55, 1600, 85 * mul, 1.6, { from: 0.8, flash: RIFT, skip: f.bladeHits });
    const at = f.center().addScaledVector(fw, 2.6);
    at.y += 0.3;
    this.rift = new SpaceRift(g, at, across, fw, 8, 1.4, 1.5);
    this.riftT = 0.8;
    g.addProjectile(this.rift);
    // shots and fields along the cut are undone
    for (let s = -3; s <= 3; s++) g.rejectNear(at.clone().addScaledVector(across, s * 1.2), 3, f, true);
    for (let d = 2; d <= 26; d += 4) g.rejectNear(f.center().addScaledVector(fw, d), 3, f, true);
    // and whatever held him is cut away with space itself
    f.rooted = false;
    f.blindT = 0;
    f.invertT = 0;
    f.scrambleT = 0;
    f.armLockT = 0;
    f.slowT = 0;
    f.slowK = 0;
    f.dilateT = 0;
    f.dilateK = 0;
    g.callout('空間斬り', 'SPACE CUT', RIFT);
    g.sfx.play('explode', at, 1.2);
    g.sfx.play('crack', at, 1.4);
    g.shake(0.6);
    g.hitstop(0.08);
    g.slowMo(0.2, 0.4);
    g.engine.gr.chroma.offset.set(0.007, 0.007);
    this.skull.flare(1.3, 1);
  }

  /** E: Deflect — the flat of the cleaver held up; beams and shots dumped into the ground, blades beaten down */
  private deflect(): void {
    const { f, g } = this;
    this.use(new Move(this, 'deflect', 'kt_deflect', (n, a) => {
      if (n === 'guard') g.sfx.play('ting', f.center(), 0.6);
      if (n === 'dump' && a.flag) {
        const fw = f.forward(_w);
        const p = f.pos.clone().addScaledVector(fw, 1.8).addScaledVector(new THREE.Vector3(-fw.z, 0, fw.x), 1.4);
        g.groundImpact(p, 1.6, 260, GOLD, f);
      }
    }, {
      tick: (a) => {
        // whatever flies at the flat is dumped before it lands
        if (a.t >= 0.04 && a.t <= 1.0 && g.rejectNear(f.center().addScaledVector(f.forward(_w), 1.6), 2.2, f, false) > 0) {
          a.flag = true;
          this.dumpShot();
        }
      },
    }), 14, 'deflect', 7);
  }

  /** R (and the torn arm's RMB): seize with the free hand — a chokeslam, or a giant's leg torn out from under it */
  private grapple(): void {
    const { f, g } = this;
    const t = this.target();
    const giant = !!t && isGiant(t);
    const reach = giant ? 6 + t!.def.radius : 3.6 + (t?.def.radius ?? 0);
    const inReach = !!t && !t.dead && Math.hypot(t.pos.x - f.pos.x, t.pos.z - f.pos.z) <= reach;
    if (inReach) this.face(t);
    const m = new Move(this, 'grapple', giant ? 'kt_trip' : 'kt_grapple', (n, a) => {
      if (n === 'step') f.push.addScaledVector(f.forward(_w), 4);
      if (n === 'grab' && t && !t.dead && Math.hypot(t.pos.x - f.pos.x, t.pos.z - f.pos.z) <= reach + 0.6) {
        a.held = t;
        g.sfx.play('hit', t.center(), 0.8);
      }
      if (giant) {
        if (n === 'heave' && a.held) {
          const h = a.held;
          a.held = null;
          g.damage(h, 110 * this.growthMul(), f, _v.subVectors(h.pos, f.pos).setY(0).normalize().clone(), { knock: 6, launch: 3, heavy: true, hitstop: 0.16, shake: 0.9 });
          h.hitstun = Math.max(h.hitstun, 1.6);
          g.groundImpact(h.pos.clone(), 3.5, 420, GOLD, f);
          g.addRing(h.pos.clone(), 9, GOLD, 0.6);
          g.callout('転', 'DOWN YOU GO', GOLD);
          this.landed(1);
        }
        return;
      }
      if (n === 'lift') a.flag = true;
      if (n === 'slam' && a.held) {
        const h = a.held;
        a.held = null;
        const p = f.pos.clone().addScaledVector(f.forward(_w), 1.5);
        h.body.pos.set(p.x, f.pos.y + 0.2, p.z);
        h.body.prev.copy(h.body.pos);
        g.damage(h, 75 * this.growthMul(), f, f.forward(new THREE.Vector3()), { knock: 4, launch: 2, heavy: true, hitstop: 0.14, shake: 0.6 });
        h.hitstun = Math.max(h.hitstun, 1);
        g.groundImpact(p, 2.4, 300, GOLD, f);
        this.landed(1);
      }
    }, {
      armor: 0.5,
      tick: (a) => {
        const h = a.held;
        if (!h || h.dead || giant) return;
        const p = sock(f, 'palm.L', _v);
        h.body.pos.set(p.x, p.y - (a.flag ? h.def.height * 0.3 : h.def.height * 0.82), p.z);
        h.body.prev.copy(h.body.pos);
        h.body.vel.set(0, 0, 0);
        h.hitstun = Math.max(h.hitstun, 0.3);
      },
      end: (a) => {
        a.held = null;
      },
    });
    this.use(m, 18, 'grapple', 8);
  }

  /** V in the Shikai: Skyfall Cleave — into the sky, everything above erased, one cut straight down */
  private skyfall(): void {
    const { f, g } = this;
    const t = this.target();
    this.face(t);
    let crashed = false;
    const skyDir = new THREE.Vector3();
    let skySpeed = 0;
    this.use(new Move(this, 'skyfall', 'kt_skyfall', (n) => {
      if (n === 'leap') {
        const d = t ? Math.min(16, Math.max(2, Math.hypot(t.pos.x - f.pos.x, t.pos.z - f.pos.z) - 2)) : 6;
        f.forward(skyDir);
        skySpeed = d / 0.5;
        f.body.vel.y = 24;
        f.body.grounded = false;
        g.groundImpact(f.pos.clone(), 1.4, 160, GOLD, f);
        g.sfx.play('shunpo', f.center(), 1.2);
      }
      if (n === 'apex') {
        const c = f.center();
        const n2 = g.rejectNear(c, 20, f, true);
        g.addRing(c.clone(), 20, GOLD, 0.7);
        for (let i = 0; i < 36; i++) {
          const a2 = (i / 36) * Math.PI * 2;
          g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: Math.cos(a2) * 26, vy: (Math.random() - 0.5) * 4, vz: Math.sin(a2) * 26, size: 0.5, sizeEnd: 0.05, life: 0.5, r: 1, g: 0.88, b: 0.4, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 1.5 });
        }
        g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: 2, sizeEnd: 30, life: 0.4, r: 1, g: 0.9, b: 0.5, alpha: 0.8, alphaEnd: 0, tex: TEX_RING });
        g.sfx.play(n2 > 0 ? 'explode' : 'swingHeavy', c, 1.3);
        this.face(this.target());
      }
      if (n === 'dive') f.body.vel.y = -40;
    }, {
      armor: 0.6,
      tick: (a) => {
        // the leap carries him over the target
        if (a.t >= 0.2 && a.t < 0.7) f.push.copy(skyDir).multiplyScalar(skySpeed);
        f.bladeActive = a.t >= 0.9 && a.t <= 1.05;
        if (f.trail) f.trail.emitting = a.t >= 0.85 && a.t <= 1.15;
        if (!crashed && ((a.t > 0.72 && f.grounded) || a.t >= 1.05)) {
          crashed = true;
          this.skyfallCrash();
        }
      },
    }), 50, 'sky', 20);
  }

  private skyfallCrash(): void {
    const { f, g } = this;
    const fw = f.forward(new THREE.Vector3());
    const mul = this.growthMul();
    this.slab(60, 10, 90, 2400, 160 * mul, 5, { from: 0.5 });
    const p = f.pos.clone().addScaledVector(fw, 1.6);
    g.groundImpact(p, 5, 600, GOLD, f);
    for (const o of g.enemiesOf(f)) if (o.pos.distanceTo(p) < 5 + o.def.radius) g.damage(o, 110 * mul, f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 18, launch: 9, heavy: true, hitstop: 0.12, shake: 0.8 });
    g.callout('天落', 'SKYFALL', GOLD);
    g.shake(1);
    g.hitstop(0.12);
    g.slowMo(0.3, 0.35);
    g.engine.gr.chroma.offset.set(0.008, 0.008);
    this.skull.flare(1.5, 1.2);
  }

  // ---------------------------------------------------------------- Bankai

  /** Shift in the Bankai: the dash becomes a bound that lands like a meteor */
  private pounce(): void {
    const { f, g } = this;
    const t = this.target();
    f.dashT = 0;
    this.face(t && t.pos.distanceTo(f.pos) < 24 ? t : null);
    let landed = false;
    let leapt = false;
    const dir = new THREE.Vector3();
    let speed = 0;
    const m = new Move(this, 'pounce', 'kb_pounce', (n) => {
      if (n === 'leap') {
        const d = t && t.pos.distanceTo(f.pos) < 24 ? Math.max(2, Math.hypot(t.pos.x - f.pos.x, t.pos.z - f.pos.z) - 1.5) : 14;
        f.forward(dir);
        speed = d / 0.75;
        leapt = true;
        f.body.vel.y = 10;
        f.body.grounded = false;
        g.groundImpact(f.pos.clone(), 1, 120, '#FF6A1A', f);
      }
    }, {
      armor: 0.5,
      tick: (a) => {
        // the bound carries him the whole way
        if (leapt && !landed) f.push.copy(dir).multiplyScalar(speed);
        if (!landed && a.t > 0.3 && f.grounded) {
          f.push.multiplyScalar(0.2);
          landed = true;
          g.groundImpact(f.pos.clone(), 1.6, 220, '#FF6A1A', f);
          for (const o of g.enemiesOf(f)) if (o.pos.distanceTo(f.pos) < 3 + o.def.radius) g.damage(o, 30 * this.growthMul(), f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 12, launch: 4, heavy: true });
          a.t = Math.max(a.t, 0.62);
        }
      },
    });
    f.act(m, true);
  }

  /** Q: Bite & Rip */
  private biteRip(): void {
    const { f, g } = this;
    const t = this.target();
    if (t && t.pos.distanceTo(f.pos) < 8) this.face(t);
    const blood = (p: THREE.Vector3, n: number) => {
      for (let i = 0; i < n; i++)
        g.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5) * 5, vy: Math.random() * 4, vz: (Math.random() - 0.5) * 5, size: 0.2, sizeEnd: 0.5, life: 0.6, r: 0.5, g: 0.04, b: 0.05, alpha: 0.8, alphaEnd: 0, tex: TEX_PUFF, gravity: -9 });
    };
    this.use(new Move(this, 'bite', 'kb_bite', (n, a) => {
      if (n === 'step' && t) {
        const d = Math.hypot(t.pos.x - f.pos.x, t.pos.z - f.pos.z);
        f.push.addScaledVector(f.forward(_w), Math.min(6, Math.max(0, d - 1.4)) * 3);
      }
      if (n === 'grab' && t && !t.dead && Math.hypot(t.pos.x - f.pos.x, t.pos.z - f.pos.z) <= (isGiant(t) ? 4.5 : 2.8) + t.def.radius) a.held = t;
      const h = a.held;
      if (!h) return;
      const k = isGiant(h) ? 1.6 : 1;
      if (n === 'bite') {
        g.damage(h, 30 * k * this.growthMul(), f, f.forward(new THREE.Vector3()), { knock: 0, hitstop: 0.1, shake: 0.4 });
        blood(sock(f, 'face', new THREE.Vector3()), 12);
        g.sfx.play('hitHeavy', h.center(), 1.2);
      }
      if (n === 'shake1' || n === 'shake2') {
        g.damage(h, 18 * k * this.growthMul(), f, f.forward(new THREE.Vector3()), { knock: 0, hitstop: 0.05, shake: 0.25 });
        blood(sock(f, 'face', new THREE.Vector3()), 8);
      }
      if (n === 'rip') {
        a.held = null;
        const dir = f.forward(new THREE.Vector3()).addScaledVector(new THREE.Vector3(f.forward(_w).z, 0, -f.forward(_w).x), 0.6).normalize();
        g.damage(h, 72 * k * this.growthMul(), f, dir, { knock: 22, launch: 4, heavy: true, hitstop: 0.16, shake: 0.8 });
        h.disarmT = Math.max(h.disarmT, 4);
        blood(h.center(), 30);
        g.callout('噛み千切り', 'BITE & RIP', CRIMSON);
        this.landed(2);
      }
    }, {
      armor: 0.5,
      tick: (a) => {
        const h = a.held;
        if (!h || h.dead || isGiant(h)) return;
        const p = sock(f, 'palm.L', _v);
        h.body.pos.set(p.x, p.y - h.def.height * 0.7, p.z);
        h.body.prev.copy(h.body.pos);
        h.body.vel.set(0, 0, 0);
        h.hitstun = Math.max(h.hitstun, 0.3);
      },
      end: (a) => {
        a.held = null;
      },
    }), 20, 'bite', 9);
  }

  /** E: the launching uppercut, a pillar of crimson force rising after it */
  private uppercut(): void {
    const { f, g } = this;
    const hits = new Set<number>();
    this.use(new Move(this, 'upper', 'kb_upper', (n) => {
      if (n === 'step') f.push.addScaledVector(f.forward(_w), 6);
      if (n === 'hit') {
        const r = strike(f, g, { damage: 85, knock: 2, launch: 26, heavy: true, reach: 1.3, height: 1.4, radius: 1.5, hitstop: 0.14, shake: 0.7, smash: [1, 200] }, hits, this.growthMul());
        if (r.landed) this.landed(r.landed);
        const base = r.p.clone().setY(f.pos.y);
        g.engine.destruction.carve(new CapsuleShape(base, base.clone().setY(base.y + 30), 1.6), { mode: 'smash', power: 900, impulse: 14, dust: 0.7 });
        for (let i = 0; i < 40; i++) {
          const y = Math.random() * 30;
          g.engine.glow.spawn({ x: base.x + (Math.random() - 0.5) * 1.6, y: base.y + y, z: base.z + (Math.random() - 0.5) * 1.6, vx: 0, vy: 12 + Math.random() * 10, vz: 0, size: 0.6, sizeEnd: 0.1, life: 0.5, r: 1, g: 0.35 + Math.random() * 0.3, b: 0.1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
        }
        g.addRing(base.clone(), 6, CRIMSON, 0.5);
        g.sfx.play('explode', base, 1.2);
        f.body.vel.y = 8;
        f.body.grounded = false;
        g.callout('昇', 'LAUNCH', CRIMSON);
      }
    }, { armor: 0.5 }), 18, 'upper', 8);
  }

  /** R: Shield Breaker — the rush, then the rip upward that no guard stops */
  private shieldBreaker(): void {
    const { f, g } = this;
    const t = this.target();
    if (t && t.pos.distanceTo(f.pos) < 20) this.face(t);
    const dir = f.forward(new THREE.Vector3());
    let carveT = 0;
    this.use(new Move(this, 'rush', 'kb_rush', (n) => {
      if (n === 'hit') {
        const fw = f.forward(new THREE.Vector3());
        const mul = this.growthMul();
        for (const o of g.enemiesOf(f)) {
          _v.subVectors(o.pos, f.pos).setY(0);
          if (_v.length() > 3.4 + o.def.radius || _v.normalize().dot(fw) < 0.2) continue;
          g.damage(o, 100 * mul, f, fw.clone(), { knock: 14, launch: 8, heavy: true, hitstop: 0.14, shake: 0.7, unblockable: true });
          g.sparks(o.center(), fw, CRIMSON, 20);
          this.landed(1);
        }
        g.rejectNear(f.center().addScaledVector(fw, 2), 4, f, true);
        this.slab(18, 4, 90, 1500, 0, 2, { from: 0.5, flash: CRIMSON });
        g.callout('盾断ち', 'SHIELD BREAKER', CRIMSON);
        g.shake(0.6);
      }
    }, {
      armor: 0.6,
      tick: (a, dt) => {
        if (a.t >= 0.15 && a.t <= 0.55) {
          f.push.copy(dir).multiplyScalar(30);
          carveT -= dt;
          if (carveT <= 0) {
            carveT = 0.05;
            const c = f.center().addScaledVector(dir, 0.5);
            g.engine.destruction.carve(new CapsuleShape(c, c.clone().addScaledVector(dir, 1.6), 1.1), { mode: 'smash', power: 500, impulse: 14, dust: 0.6 });
            g.rejectNear(c.clone().addScaledVector(dir, 1.5), 2.5, f, true);
            f.ghosts.spawn(0.3, 0.7);
          }
        } else if (a.t > 0.55 && a.t < 0.6) f.push.multiplyScalar(0.3);
      },
    }), 20, 'rush', 7);
  }

  /** G in the Bankai: the roar — everyone near, allies too, driven back and frozen in fear */
  private roar(): void {
    const { f, g } = this;
    this.use(new Move(this, 'roar', 'kb_roar', (n) => {
      if (n !== 'roar') return;
      const c = f.center();
      for (const o of g.fighters) {
        if (o === f || o.dead) continue;
        const d = o.pos.distanceTo(f.pos);
        if (d > 16) continue;
        const k = 1 - d / 16;
        g.damage(o, 10 * k, f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 10 * k + 4, launch: 2, quiet: true });
        o.hitstun = Math.max(o.hitstun, 0.9);
        o.slow(0.5, 2.5);
      }
      g.rejectNear(c, 10, f, false);
      g.addRing(f.pos.clone(), 16, CRIMSON, 0.6);
      g.addRing(f.pos.clone().setY(f.pos.y + 1.4), 11, '#FFE2B0', 0.45);
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * Math.PI * 2;
        g.engine.dust.spawn({ x: f.pos.x, y: f.pos.y + 0.3, z: f.pos.z, vx: Math.cos(a) * (14 + Math.random() * 6), vy: Math.random() * 2, vz: Math.sin(a) * (14 + Math.random() * 6), size: 0.8, sizeEnd: 2.8, life: 1, r: 0.72, g: 0.62, b: 0.55, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 2.2 });
      }
      g.callout('咆哮', 'ROAR', CRIMSON);
      g.sfx.play('roarBig', c, 1.5);
      g.shake(0.8);
      g.engine.gr.chroma.offset.set(0.006, 0.006);
      this.skull.flare(1.4, 1);
    }, { armor: 0.8 }), 10, 'roar', 10);
  }

  /** V in the Bankai: The Perfect Crimson — one vertical cut that splits the arena; then the arm gives out */
  private perfectCrimson(): void {
    const { f, g } = this;
    const f2 = f;
    if (f.busy || f.hitstun > 0) return;
    if (!f.spendRei(60)) {
      this.banner('Not enough reiatsu');
      return;
    }
    const t = this.target();
    this.face(t);
    let cutAt = -1;
    const m = new Move(this, 'crimson', 'kb_crimson', (n) => {
      if (n === 'charge') {
        this.crimson?.dispose();
        this.crimson = new CrimsonBlade(g, f2, 30, 3.2);
        g.addProjectile(this.crimson);
        f.aura.flare(2, 1.2);
        this.skull.flare(1.6, 1.6);
        g.sfx.play('charge', f.center(), 1.5);
        g.shake(0.4);
      }
      if (n === 'hit') {
        cutAt = m.t;
        this.crimsonCut();
      }
    }, {
      armor: 0.8,
      tick: (a) => {
        if (this.crimson) this.crimson.grow = cutAt < 0 ? Math.min(1, a.t / 0.85) : Math.max(0, 1 - (a.t - cutAt) / 0.4);
        if (t && cutAt < 0) this.face(t);
        f.bladeActive = a.t >= 0.95 && a.t <= 1.1;
        if (cutAt >= 0 && a.t - cutAt > 0.8) this.overload = 100;
      },
      end: () => {
        if (this.crimson) this.crimson.done = true;
        this.crimson = null;
        if (cutAt >= 0 && this.form === 'bankai') this.overload = 100;
      },
    });
    this.reveal();
    f.act(m, true);
  }

  private crimsonCut(): void {
    const { f, g } = this;
    const fw = f.forward(new THREE.Vector3());
    const mul = this.growthMul();
    this.slab(140, 40, 90, 4000, 190 * mul, 20, { from: 0.5, flash: CRIMSON });
    // the molten seam along the ground
    const len = 60;
    const { q } = slabQuat(fw, 0);
    g.engine.destruction.carve(new BoxShape(f.pos.clone().addScaledVector(fw, 1 + len / 2).setY(f.pos.y - 0.6), new THREE.Vector3(len / 2, 1.6, 0.7), q), { mode: 'smash', power: 900, impulse: 16, dust: 0.9 });
    for (let i = 0; i < 70; i++) {
      const d = 1 + Math.random() * len;
      const p = f.pos.clone().addScaledVector(fw, d);
      g.engine.glow.spawn({ x: p.x + (Math.random() - 0.5) * 0.8, y: p.y + 0.1, z: p.z + (Math.random() - 0.5) * 0.8, vx: 0, vy: 1 + Math.random() * 4, vz: 0, size: 0.5, sizeEnd: 0.08, life: 1.2 + Math.random(), r: 1, g: 0.35 + Math.random() * 0.25, b: 0.05, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, gravity: -3 });
    }
    g.callout('真紅の両断', 'THE PERFECT CRIMSON', CRIMSON);
    g.sfx.play('explode', f.center(), 2);
    g.sfx.play('roarBig', f.center(), 1.2);
    g.shake(1.2);
    g.hitstop(0.16);
    g.slowMo(0.5, 0.3);
    g.engine.gr.chroma.offset.set(0.012, 0.012);
    this.skull.flare(2, 1.6);
  }

  /** F in the Bankai: back to the Shikai before the arm gives out */
  private reseal(): void {
    const { f, g } = this;
    this.form = 'shikai';
    f.def = { ...f.def, stance: KENPACHI_SHIKAI_STANCE, speed: { ...SPEED_TYBW } };
    f.setForm({ asset: kenpachiAsset('tybw'), props: [{ key: 'sword', model: kenpachiProp('cleaver'), socket: 'grip.R' }, { key: 'saya', model: kenpachiProp('saya'), socket: 'hip.L' }] }, AURA_KENPACHI, BLADE_CLEAVER);
    this.skull.setColor(GOLD, '#FFF2B3');
    this.bankaiLock = 12;
    f.aura.flare(1.2, 0.6);
    g.sfx.play('flare', f.center(), 0.8);
    this.applyStats();
  }

  /** the overload: the right arm tears apart at the elbow; the Bankai is gone */
  private shatter(): void {
    const { f, g } = this;
    if (this.form !== 'bankai') return;
    const elbow = sock(f, 'elbow.R', new THREE.Vector3());
    this.form = 'shikai';
    this.overload = 0;
    this.tornT = 22;
    this.bankaiLock = 52;
    f.def = { ...f.def, stance: KENPACHI_STANCE, speed: { ...SPEED_TYBW } };
    f.setForm({ asset: kenpachiAsset('tybw'), props: [{ key: 'sword', model: kenpachiProp('cleaver'), socket: 'grip.R' }, { key: 'saya', model: kenpachiProp('saya'), socket: 'hip.L' }] }, AURA_KENPACHI, BLADE_CLEAVER);
    f.visual.rig.setBoneVisible('forearm.R', false);
    f.visual.attach('stump', kenpachiProp('stump'), 'elbow.R');
    this.skull.setColor(GOLD, '#FFF2B3');
    f.hp = Math.max(1, f.hp - f.maxHp * 0.12);
    f.stopAction();
    f.hitstun = Math.max(f.hitstun, 0.6);
    f.anim.play('hit_heavy', { fadeIn: 0.03 });
    for (let i = 0; i < 40; i++)
      g.engine.dust.spawn({ x: elbow.x, y: elbow.y, z: elbow.z, vx: (Math.random() - 0.5) * 7, vy: Math.random() * 6, vz: (Math.random() - 0.5) * 7, size: 0.22, sizeEnd: 0.5, life: 0.8, r: 0.5, g: 0.04, b: 0.05, alpha: 0.85, alphaEnd: 0, tex: TEX_PUFF, gravity: -10 });
    for (let i = 0; i < 24; i++)
      g.engine.glow.spawn({ x: elbow.x, y: elbow.y, z: elbow.z, vx: (Math.random() - 0.5) * 10, vy: Math.random() * 8, vz: (Math.random() - 0.5) * 10, size: 0.3, sizeEnd: 0.05, life: 0.5, r: 1, g: 0.4, b: 0.1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2, gravity: -8 });
    g.engine.destruction.carve(new SphereShape(elbow.clone().setY(f.pos.y), 0.8), { mode: 'smash', power: 60, impulse: 3, dust: 0.3 });
    g.callout('ゴメンね、剣ちゃん', 'SORRY, KEN-CHAN', PINK);
    g.sfx.play('crack', elbow, 1.6);
    g.sfx.play('hitHeavy', elbow, 1.4);
    g.shake(f === g.player ? 0.8 : 0.3);
    g.hitstop(0.12);
    this.applyStats();
  }

  /** the torn arm bound back: the cleaver in his hand again */
  private restoreArm(): void {
    const { f, g } = this;
    this.tornT = 0;
    f.visual.rig.setBoneVisible('forearm.R', true);
    f.visual.detach('stump');
    if (this.form === 'shikai') {
      f.anim.loco.stance = KENPACHI_SHIKAI_STANCE;
      f.def = { ...f.def, stance: KENPACHI_SHIKAI_STANCE };
    }
    const e = sock(f, 'elbow.R', new THREE.Vector3());
    for (let i = 0; i < 24; i++)
      g.engine.glow.spawn({ x: e.x, y: e.y, z: e.z, vx: (Math.random() - 0.5) * 3, vy: Math.random() * 2, vz: (Math.random() - 0.5) * 3, size: 0.2, sizeEnd: 0.03, life: 0.6, r: 1, g: 0.85, b: 0.35, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, drag: 1 });
    f.aura.flare(1.4, 0.6);
    g.sfx.play('flare', f.center(), 0.7);
    this.applyStats();
  }

  // ---------------------------------------------------------------- HUD and AI

  /** Sandbox: the Bankai never tears the arm off */
  sandbox(): void {
    this.overload = 0;
    this.bankaiLock = 0;
  }

  override formName(): string {
    if (this.tornT > 0) return `Torn arm · ${Math.ceil(this.tornT)} s`;
    if (this.form === 'bankai') return `Bankai · overload ${Math.round(this.overload)} %`;
    if (this.form === 'shikai') return 'Shikai — Nozarashi';
    const base = this.patchOff ? 'Captain, 11th Division — unbound' : 'Captain, 11th Division';
    return this.hidden ? `${base} · hidden` : base;
  }

  override abilities(): AbilityInfo[] {
    const fm = this.form;
    const c = this.cd2;
    if (this.tornT > 0)
      return [
        { key: 'LMB', name: 'Fists & kicks', kanji: '拳' },
        { key: 'RMB', name: 'One-arm trip', kanji: '転', cost: 18, cd: c.grapple, cdMax: 8 },
        { key: 'Q', name: 'Shock wave', kanji: '衝', cost: 22, cd: this.cd.shock, cdMax: 6 },
        { key: 'E', name: 'Bait & grab', kanji: '餌', cost: 10, cd: c.bait, cdMax: 7 },
        { key: 'R', name: 'One-arm trip', kanji: '転', cost: 18, cd: c.grapple, cdMax: 8 },
        { key: 'Shift', name: 'Shunpo', kanji: '瞬', cost: 4 },
        { key: 'G', name: 'Eyepatch', kanji: '眼帯', active: this.patchOff, tint: GOLD },
        { key: 'V', name: '—', kanji: '腕' },
        { key: 'F', name: 'Torn arm', kanji: '腕', timer: this.tornT / 22, active: true, tint: '#B33A3A' },
      ];
    if (fm === 'bankai')
      return [
        { key: 'LMB', name: 'Oni hacks', kanji: '鬼' },
        { key: 'RMB', name: 'Bisection', kanji: '断', cost: 22, cd: this.cd.heavy, cdMax: 4.5 },
        { key: 'Q', name: 'Bite & rip', kanji: '噛', cost: 20, cd: c.bite, cdMax: 9 },
        { key: 'E', name: 'Launch uppercut', kanji: '昇', cost: 18, cd: c.upper, cdMax: 8 },
        { key: 'R', name: 'Shield breaker', kanji: '盾', cost: 20, cd: c.rush, cdMax: 7 },
        { key: 'Shift', name: 'Oni pounce', kanji: '跳', cost: 4 },
        { key: 'G', name: 'Roar', kanji: '咆', cost: 10, cd: c.roar, cdMax: 10 },
        { key: 'V', name: 'Perfect Crimson', kanji: '紅', cost: 60 },
        { key: 'F', name: 'Overload · reseal', kanji: '卍解', active: true, timer: this.overload / 100, tint: CRIMSON },
      ];
    if (fm === 'shikai')
      return [
        { key: 'LMB', name: 'Cleaver', kanji: '斬' },
        { key: 'RMB', name: 'Meteor cleaver', kanji: '隕', cost: 16, cd: this.cd.heavy, cdMax: 3.5 },
        { key: 'Q', name: 'Space cut', kanji: '空', cost: 30, cd: c.space, cdMax: 9 },
        { key: 'E', name: 'Deflect', kanji: '弾', cost: 14, cd: c.deflect, cdMax: 7 },
        { key: 'R', name: 'Giant grapple', kanji: '投', cost: 18, cd: c.grapple, cdMax: 8 },
        { key: 'Shift', name: 'Shunpo', kanji: '瞬', cost: 4 },
        { key: 'G', name: 'Eyepatch', kanji: '眼帯', active: this.patchOff, tint: GOLD },
        { key: 'V', name: 'Skyfall cleave', kanji: '天', cost: 50, cd: c.sky, cdMax: 20 },
        { key: 'F', name: this.bankaiLock > 0 ? `Bankai · ${Math.ceil(this.bankaiLock)} s` : 'Bankai', kanji: '卍解', cost: 45, tint: CRIMSON },
      ];
    return [
      { key: 'LMB', name: 'No pattern', kanji: '斬' },
      { key: 'RMB', name: 'Building cutter', kanji: '断', cost: 10, cd: this.cd.heavy, cdMax: 2.6 },
      { key: 'Q', name: 'Ryōdan', kanji: '両断', cost: 28, cd: this.cd.ryodan, cdMax: 7 },
      { key: 'E', name: 'Shock wave', kanji: '衝', cost: 22, cd: this.cd.shock, cdMax: 6 },
      { key: 'R', name: 'Bait & grab', kanji: '餌', cost: 10, cd: c.bait, cdMax: 7 },
      { key: 'Shift', name: 'Shunpo', kanji: '瞬', cost: 4 },
      { key: 'G', name: 'Eyepatch', kanji: '眼帯', active: this.patchOff, tint: GOLD },
      { key: 'V', name: 'Hidden reiatsu', kanji: '隠', active: this.hidden },
      { key: 'F', name: 'Shikai', kanji: '始解', cost: 25, tint: GOLD },
    ];
  }

  override ai(): KitAI {
    const kit = this;
    const t = () => kit.target();
    const sealed = () => kit.form === 'sealed' && kit.tornT <= 0;
    const shikai = () => kit.form === 'shikai' && kit.tornT <= 0;
    const bankai = () => kit.form === 'bankai';
    const bound = () => kit.f.rooted || kit.f.blindT > 0 || kit.f.invertT > 0 || kit.f.scrambleT > 0 || kit.f.armLockT > 0;
    return {
      get reach() {
        return kit.form === 'shikai' ? 2.6 : kit.form === 'bankai' ? 2.2 : 1.9;
      },
      chain: 4,
      releaseAt: [0.5, 0.25],
      toggleAt: 0.62,
      toggleOn: () => kit.patchOff || kit.form === 'bankai',
      opener: () => kit.hide(),
      moves: [
        // sealed
        { name: 'hide', use: () => kit.hide(), min: 9, max: 80, weight: 3, cd: 14, when: () => sealed() && !kit.hidden },
        { name: 'flick', use: () => kit.heavy(), min: 2.5, get max() { return kit.patchOff ? 26 : 15; }, weight: 1.4, cd: 4, when: () => sealed() && !kit.hidden },
        { name: 'ryodan', use: () => kit.skill1(), min: 0, max: 4, weight: 1.2, cd: 7, when: sealed },
        { name: 'shock', use: () => kit.skill2(), min: 0, max: 5.5, weight: 0.8, cd: 8, when: sealed },
        { name: 'bait', use: () => kit.skill3(), min: 0, max: 3.5, weight: 0.9, cd: 9, when: () => sealed() && !kit.hidden },
        // Shikai
        { name: 'meteor', use: () => kit.heavy(), min: 3, max: 13, weight: 1.4, cd: 5, when: shikai },
        { name: 'space', use: () => kit.skill1(), min: 2, max: 22, weight: 1.4, cd: 9, when: shikai },
        { name: 'cut-free', use: () => kit.skill1(), min: 0, max: 99, weight: 8, cd: 3, when: () => shikai() && bound() },
        { name: 'deflect', use: () => kit.skill2(), min: 7, max: 40, weight: 1, cd: 8, when: shikai },
        { name: 'grapple', use: () => kit.skill3(), min: 0, get max() { const o = t(); return o && isGiant(o) ? 6 + o.def.radius : 3.4; }, weight: 1.6, cd: 8, when: () => shikai() || kit.tornT > 0 },
        { name: 'skyfall', use: () => kit.toggleFlare(), min: 3, max: 30, weight: 1.6, cd: 20, when: () => shikai() && kit.f.rei > 55 && (!!t() && (isGiant(t()!) || t()!.pos.y > kit.f.pos.y + 2 || Math.random() < 0.4)) },
        // Bankai
        { name: 'bisect', use: () => kit.heavy(), min: 4, max: 50, weight: 1.6, cd: 6, when: bankai },
        { name: 'bite', use: () => kit.skill1(), min: 0, max: 5, weight: 2, cd: 9, when: bankai },
        { name: 'upper', use: () => kit.skill2(), min: 0, max: 3, weight: 1.8, cd: 8, when: bankai },
        { name: 'rush', use: () => kit.skill3(), min: 3, max: 16, weight: 1.8, cd: 7, when: bankai },
        { name: 'roar', use: () => kit.toggle(), min: 0, max: 9, weight: 1, cd: 12, when: bankai },
        { name: 'crimson', use: () => kit.toggleFlare(), min: 3, max: 120, weight: 5, cd: 30, when: () => bankai() && kit.f.rei > 62 && (kit.overload > 80 || (!!t() && t()!.hp < t()!.maxHp * 0.35)) },
        { name: 'reseal', use: () => kit.release(), min: 0, max: 99, weight: 6, cd: 10, when: () => bankai() && kit.overload > 90 && kit.f.rei < 62 },
      ],
    };
  }
}
