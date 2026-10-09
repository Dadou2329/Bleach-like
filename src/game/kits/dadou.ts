// Dadou's kit (docs/kits/dadou.md). The Emperor of Hell — an original character, the game's author — far stronger than
// the canon roster on purpose, every form stronger than the last. "Everything kneels."
// Sealed: the Teiken string (LMB); Hadō #54 Haien (RMB); Hadō #31 Shakkahō: Gorenpatsu (Q); Ōi, his majesty forcing
// everyone near to kneel (E); Bakudō #75 Gochūtekkan (R); Gyokuza, the throne (G); "Hirefuse, Hajun" (F).
// Shikai Hajun: Gokuen-giri, a crescent of black fire off every cut (LMB); Kokuen, the black flame (RMB); Onibi, nine
// wisps (Q); Kensaku, the rope of fire (E); Gōka, three pillars of hellfire (R); Hyakki Yakō, the demon parade (G);
// the Bankai (F).
// Bankai Tenma Hajun: a colossus of black fire in his shape rises behind him and repeats every cut (LMB); Jigoku no Mon
// (RMB); Gokusotsu no Kusari, the wardens' chains (Q); Tenma no Te, the colossus's hand (E); Hachinetsu Jigoku, the
// burning hells (R); Daitenma-giri, the great cut (G); "Tenka Fubu — Dairokuten Maō" (F).
// Final Dairokuten Maō (flying, four arms, the wheel of fire): Rokudō (LMB); Gokuen-hō, the hellfire cannon (RMB);
// Kaen-rin, the wheel (Q); Muken (E); Tenma Kōrin, the colossus's descent (R); Tenka Fubu, the rain of fire (G); the
// seal (F).
// Always: Gokuen (his fire clings: burning targets cannot heal, black fire burns hotter and slows) and Jigoku-gaeri (the
// first death sends him into Hell, and he walks back out of its Gates one form higher).
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef, type PropDef } from '../fighter';
import type { Game } from '../game';
import { FINAL_TIP_Z, HAJUN_BASE_Z, KATANA_TIP_Z, NODACHI_TIP_Z, SHIKAI_TIP_Z, dadouAsset, dadouProp, type DadouForm } from '../../chars/dadou';
import { DADOU_BANKAI_CHAIN, DADOU_BANKAI_STANCE, DADOU_CHAIN, DADOU_CLIPS, DADOU_FINAL_CHAIN, DADOU_FINAL_STANCE, DADOU_STANCE } from '../../chars/dadouClips';
import {
  AURA_DADOU, AURA_DADOU_HELL, BurningHells, DemonParade, FireRope, FlameWheel, GOKUEN, GatesOfHell, HELL_CRIMSON, HELL_GOLD, HELL_VIOLET, HellMeteor, HellOrb, HellPillar,
  HellfirePool, IronPillars, MAO, MukenSphere, SKY_HELL, SKY_INFERNO, TenmaGiant, Throne, bodyFire, fireRing, hellEmbers, hellFlash, hellfireAt, mixSky, warmHajun,
} from '../../vfx/hajun';
import { SkyTint, type SkyLook } from '../../vfx/fire';
import { ChainBind, PlanarSlash } from '../../vfx/tybw';
import { groundAt } from '../../vfx/iceArts';
import { blackSmoke } from '../../vfx/dangai';
import { registerReactions } from '../../chars/reactionClips';
import { ConeShape, SphereShape } from '../../destruction/shapes';
import { CeroBeam } from '../projectiles/cero';
import { GetsugaProjectile, type GetsugaOpts } from '../projectiles/getsuga';
import { vollFlight } from './sternritter';
import type { AbilityInfo } from '../../ui/hud';
import type { Kit, KitAI } from './kit';

type BladeDef = NonNullable<FighterDef['blade']>;
type Form = DadouForm;

const BLADES: Record<Form, BladeDef> = {
  sealed: { prop: 'sword', base: [0, 0, HAJUN_BASE_Z], tip: [0, 0, KATANA_TIP_Z], color: '#FF5A6A', core: '#FFE8EC' },
  shikai: { prop: 'sword', base: [0, 0, HAJUN_BASE_Z], tip: [0, 0, SHIKAI_TIP_Z], color: '#B23CFF', core: '#F6D8FF' },
  bankai: { prop: 'sword', base: [0, 0, HAJUN_BASE_Z], tip: [0, 0, NODACHI_TIP_Z], color: '#FF2A48', core: '#FFD6E0' },
  final: { prop: 'sword', base: [0, 0, HAJUN_BASE_Z], tip: [0, 0, FINAL_TIP_Z], color: '#C040FF', core: '#FFD0F0' },
};
const TIP: Record<Form, number> = { sealed: KATANA_TIP_Z, shikai: SHIKAI_TIP_Z, bankai: NODACHI_TIP_Z, final: FINAL_TIP_Z };
const SPEEDS: Record<Form, FighterDef['speed']> = {
  sealed: { run: 11, sprint: 30, jump: 14, dash: 27, dashTime: 0.1 },
  shikai: { run: 11.5, sprint: 31, jump: 14, dash: 29, dashTime: 0.1 },
  bankai: { run: 12, sprint: 33, jump: 15, dash: 34, dashTime: 0.1 },
  final: { run: 14, sprint: 42, jump: 16, dash: 42, dashTime: 0.07 },
};
const AURAS = { sealed: AURA_DADOU, shikai: AURA_DADOU, bankai: AURA_DADOU_HELL, final: AURA_DADOU_HELL };
/** power, damage taken, regeneration (fraction of HP and rei per second) */
const STATS: Record<Form, { power: number; taken: number; hpRegen: number; reiRegen: number }> = {
  sealed: { power: 1.8, taken: 0.75, hpRegen: 0, reiRegen: 0 },
  shikai: { power: 2.8, taken: 0.55, hpRegen: 0, reiRegen: 4 },
  bankai: { power: 4.2, taken: 0.4, hpRegen: 0.015, reiRegen: 10 },
  final: { power: 6.5, taken: 0.1, hpRegen: 0.03, reiRegen: 25 },
};
const LADDER: Form[] = ['sealed', 'shikai', 'bankai', 'final'];
const UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

function props(form: Form): PropDef[] {
  const p: PropDef[] = [{ key: 'sword', model: dadouProp(form === 'sealed' ? 'katana' : form), socket: 'grip.R' }];
  if (form === 'sealed' || form === 'shikai') p.push({ key: 'saya', model: dadouProp('saya'), socket: 'hip.L' });
  if (form === 'bankai') p.push({ key: 'halo', model: dadouProp('halo'), socket: 'halo' });
  if (form === 'final') {
    p.push({ key: 'halo', model: dadouProp('wheel'), socket: 'halo' });
    p.push({ key: 'sword2.R', model: dadouProp('final'), socket: 'grip2.R' });
    p.push({ key: 'sword2.L', model: dadouProp('final'), socket: 'grip2.L' });
  }
  return p;
}

export const DADOU_DEF: FighterDef = {
  id: 'dadou',
  name: 'Dadou',
  title: 'Emperor of Hell',
  build: () => {
    warmHajun();
    return { asset: dadouAsset('sealed'), props: props('sealed') };
  },
  stance: DADOU_STANCE,
  clips: DADOU_CLIPS,
  aura: AURA_DADOU,
  blade: BLADES.sealed,
  hp: 3000,
  rei: 500,
  speed: { ...SPEEDS.sealed },
  radius: 0.34,
  height: 1.84,
};

// ------------------------------------------------------------------ helpers

function lungeTo(f: Fighter, stop: number, at: number, max = 26): number {
  const tgt = f.faceTarget;
  if (!tgt) return 0;
  const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
  if (d <= stop + 0.25 || d > 7.5) return 0;
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

/** room for a body at p (feet to head clear of the world) */
function clearAt(g: Game, p: THREE.Vector3, h: number): boolean {
  const w = g.engine.world, vs = w.vs;
  for (let y = p.y + 0.15; y < p.y + h; y += 0.25) if (w.isSolid(Math.floor(p.x / vs), Math.floor(y / vs), Math.floor(p.z / vs))) return false;
  return true;
}

/** the blade's direction right now, square to the facing (the plane a crescent is thrown in) */
function bladeSide(f: Fighter, out = new THREE.Vector3()): THREE.Vector3 {
  const b = f.blade;
  out.subVectors(b.tip, b.base);
  const fw = f.forward(_w);
  out.addScaledVector(fw, -out.dot(fw));
  if (out.lengthSq() < 1e-4) out.set(-fw.z, 0, fw.x);
  return out.normalize();
}

const spec = (damage: number, knock: number, cut: number, extra: Partial<BladeSpec> = {}): BladeSpec => ({ damage, knock, launch: 0, hitstop: 0.05, shake: 0.14, cut, ...extra });

/** blade windows of each cut (clip time) and its base spec */
const MOVES: Record<string, { at: [number, number]; spec: BladeSpec }> = {
  dd_s1: { at: [0.1, 0.2], spec: spec(28, 6, 650, { reach: 0.2 }) },
  dd_s2: { at: [0.1, 0.2], spec: spec(28, 7, 650) },
  dd_s3: { at: [0.1, 0.24], spec: spec(30, 8, 650) },
  dd_s4: { at: [0.09, 0.2], spec: spec(32, 10, 700, { reach: 0.3 }) },
  dd_s5: { at: [0.1, 0.21], spec: spec(36, 3, 750, { launch: 10, hitstop: 0.07, shake: 0.22 }) },
  db_s1: { at: [0.14, 0.27], spec: spec(40, 9, 1800, { reach: 0.35 }) },
  db_s2: { at: [0.14, 0.27], spec: spec(40, 9, 1800, { reach: 0.35 }) },
  db_s3: { at: [0.14, 0.3], spec: spec(45, 11, 1900, { reach: 0.35 }) },
  db_s4: { at: [0.16, 0.32], spec: spec(50, 14, 2000, { reach: 0.4, heavy: true, hitstop: 0.09, shake: 0.35 }) },
  db_s5: { at: [0.14, 0.28], spec: spec(55, 3, 2000, { launch: 13, hitstop: 0.08, shake: 0.3, reach: 0.35 }) },
  df_s1: { at: [0.08, 0.17], spec: spec(40, 8, 1800, { reach: 0.3 }) },
  df_s2: { at: [0.08, 0.17], spec: spec(40, 8, 1800, { reach: 0.3 }) },
  df_s3: { at: [0.08, 0.2], spec: spec(44, 9, 1800, { reach: 0.3 }) },
  df_s4: { at: [0.08, 0.2], spec: spec(44, 9, 1800, { reach: 0.3 }) },
  df_s5: { at: [0.08, 0.18], spec: spec(46, 3, 1900, { launch: 12, hitstop: 0.07, shake: 0.22, reach: 0.3 }) },
  df_s6: { at: [0.12, 0.26], spec: spec(50, 16, 2000, { heavy: true, hitstop: 0.1, shake: 0.4, reach: 0.35 }) },
};
const CUT_K: Record<Form, number> = { sealed: 1, shikai: 2.1, bankai: 1.3, final: 1 };

/** Marker for the skills a string can cancel into. */
abstract class SkillAction extends FighterAction {}

/** One cut of the string: the blade window and the step in; the form adds its fire, its colossus or its crescents. */
class MoveAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private stopAt = 0;
  private opened = false;
  queued = false;
  constructor(readonly kit: DadouKit, readonly clip: string, readonly index: number) {
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
    this.stopAt = lungeTo(f, this.kit.form === 'bankai' ? 1.6 : 1.2, MOVES[this.clip].at[0]);
    f.anim.play(this.clip, { onEvent: (n) => n === 'step' && g.sfx.play('step', f.pos, 0.45) });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    this.stopAt = lungeStop(f, this.stopAt);
    const [a, b] = MOVES[this.clip].at;
    if (!this.opened && t >= a - 0.03) {
      this.opened = true;
      f.bladeHits.clear();
      f.bladeSpec = this.kit.cutSpec(this.clip);
      g.sfx.play(this.kit.form === 'bankai' ? 'swingHeavy' : 'swing', f.center(), 0.9);
      this.kit.onCut(this.index);
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

/** A skill: plays its clip, runs its events (and a per-step tick), ends with the clip (or at `endAt`). */
class Skill extends SkillAction {
  private fired = new Set<string>();
  private cancelAt: number;
  constructor(readonly kit: DadouKit, readonly name: string, readonly clip: string, readonly endAt: number, readonly events: Record<string, [number, () => void]>, opts: { armor?: number; mobility?: number; cancelAt?: number; invulnerable?: boolean; tick?: (t: number) => void; onEnd?: () => void } = {}) {
    super();
    this.mobility = opts.mobility ?? 0.2;
    this.armor = opts.armor ?? 0;
    this.cancelAt = opts.cancelAt ?? endAt * 0.8;
    this.invulnerable = !!opts.invulnerable;
    this.tick = opts.tick;
    this.onEnd = opts.onEnd;
  }
  private tick?: (t: number) => void;
  private onEnd?: () => void;
  override start(f: Fighter): void {
    f.anim.play(this.clip, { onEvent: (n) => this.fire(n) });
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
    this.tick?.(this.t);
    if (this.t >= this.endAt) this.done = true;
  }
  override end(): void {
    for (const n of Object.keys(this.events)) this.fire(n);
    this.onEnd?.();
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t >= this.cancelAt;
  }
}

// ------------------------------------------------------------------ the kit

export class DadouKit implements Kit {
  form: Form = 'sealed';
  comboIndex = 0;
  private lastSwingEnd = 0;
  flare = false;
  /** the Bankai's colossus (it stays with him in the final form) */
  giant: TenmaGiant | null = null;
  private sky: SkyTint | null = null;
  private skyLook: SkyLook = { ...SKY_HELL };
  /** Tenka Fubu's ceiling of fire: 0 → the Bankai's red sky, 1 → the inferno */
  private infernoK = 0;
  private infernoT = 0;
  private hells: BurningHells | null = null;
  /** Gokuen: whoever burns, how long, black or not, and the HP it may not climb back above */
  private burns = new Map<Fighter, { t: number; black: boolean; hp: number; fx: number }>();
  private kneels: { o: Fighter; until: number }[] = [];
  private chained: { o: Fighter; t: number }[] = [];
  /** Jigoku-gaeri is spent / he is in Hell right now */
  revived = false;
  private reviving = false;
  private wheelOut = false;
  private muzzle = new THREE.Object3D();
  private chestMuzzle = new THREE.Object3D();
  private timers: { t: number; fn: () => void }[] = [];
  private hudT = 0;
  private fxT = 0;
  private passiveT = 0;
  readonly cd = { haien: 0, shakka: 0, oi: 0, gochu: 0, throne: 0, kokuen: 0, onibi: 0, kensaku: 0, goka: 0, hyakki: 0, gates: 0, chains: 0, grab: 0, hells: 0, daitenma: 0, cannon: 0, wheel: 0, muken: 0, korin: 0, tenka: 0, release: 0 };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.onLethal = () => this.jigokuGaeri();
    f.onHurt = () => this.giant?.flash();
    warmHajun();
    this.hands();
    this.attachMuzzles();
    this.applyStats();
  }

  say(kanji: string, romaji: string, color: string): void {
    this.g.callout(kanji, romaji, color);
  }

  // ---------------------------------------------------------------- per step

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    for (let i = this.timers.length - 1; i >= 0; i--) {
      const tm = this.timers[i];
      tm.t -= dt;
      if (tm.t > 0) continue;
      this.timers.splice(i, 1);
      tm.fn();
    }
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    this.tendBurns(dt);
    this.tendKneels();
    this.tendChains(dt);
    if (this.hells?.done) this.hells = null;
    const st = STATS[this.form];
    if (!f.dead) {
      if (st.hpRegen > 0) f.hp = Math.min(f.maxHp, f.hp + f.maxHp * st.hpRegen * dt);
      if (st.reiRegen > 0) f.rei = Math.min(f.maxRei, f.rei + st.reiRegen * dt);
      this.passives(dt);
      this.robeFire(dt);
    }
    if (this.reviving) {
      f.rooted = true;
      f.hitstun = 0;
    }
    if (this.form === 'final' && !f.dead) {
      // nothing holds the demon king: every status shrugged off, and he flies
      f.slowT = 0; f.slowK = 0; f.dilateT = 0; f.dilateK = 0; f.sealT = 0; f.sealK = 0;
      f.disarmT = Math.min(f.disarmT, 0.01); f.armLockT = 0; f.puppetT = 0; f.blindT = 0; f.invertT = 0; f.iffT = 0; f.scrambleT = 0;
      f.heavyB = 0; f.heavyW = 0; f.agedT = 0; f.agedK = 0; f.wetT = 0;
      if (!this.reviving) f.rooted = false;
      vollFlight(g, f, g.nearestEnemy(f, 80), 1.5);
      if (!f.action && f.dashT <= 0 && f.hitstun <= 0 && !f.anim.isPlaying()) f.anim.play('df_float', { fadeIn: 0.3 });
    }
    const giant = this.giant;
    if (giant) {
      if (giant.done) this.giant = null;
      else {
        giant.acting = !!f.action;
        giant.active = f.bladeActive && f.action instanceof MoveAction;
        if (f.dead) this.dismissGiant();
      }
    }
    // the sky: the red of the Bankai, or Tenka Fubu's ceiling of fire for a while
    if (this.infernoT > 0) this.infernoT = Math.max(0, this.infernoT - dt);
    const want = this.infernoT > 0 ? 1 : 0;
    this.infernoK += (want - this.infernoK) * Math.min(1, dt * 1.6);
    if (this.sky) mixSky(SKY_HELL, SKY_INFERNO, this.infernoK, this.skyLook);
    if (f.dead && this.sky) {
      this.sky.target = 0;
      this.sky = null;
    }
    this.hudT -= dt;
    if (this.hudT <= 0 && g.hud && f === g.player) {
      this.hudT = 0.25;
      g.hud.form = this.formName();
    }
  }

  after(s: number, fn: () => void): void {
    this.timers.push({ t: s, fn });
  }

  /** the right hand on the hilt, the left open (behind his back); the final form's second pair on their blades */
  private hands(): void {
    const rig = this.f.visual.rig;
    rig.setBoneVisible('fist.R', true);
    rig.setBoneVisible('palm.R', false);
    rig.setBoneVisible('fist.L', false);
    rig.setBoneVisible('palm.L', true);
    if (rig.index('fist2.R') >= 0)
      for (const s of ['R', 'L']) {
        rig.setBoneVisible(`fist2.${s}`, true);
        rig.setBoneVisible(`palm2.${s}`, false);
      }
  }

  /** empty objects at the blade's point and before his chest: the beams leave from them */
  private attachMuzzles(): void {
    const p = this.f.visual.props.get('sword');
    if (p) {
      p.add(this.muzzle);
      this.muzzle.position.set(0, 0, TIP[this.form] * 0.96);
    }
    const s = this.f.visual.rig.sockets.get('chest.front');
    if (s) {
      s.add(this.chestMuzzle);
      this.chestMuzzle.position.set(0, 0, 0.55);
    }
  }

  // ---------------------------------------------------------------- passives

  /** Gokuen: whoever burns loses health every moment and cannot be healed; black fire burns twice as hot and slows */
  ignite(o: Fighter, secs: number, black = false): void {
    if (o.dead || o === this.f) return;
    const b = this.burns.get(o);
    if (b) {
      b.t = Math.max(b.t, secs);
      b.black ||= black;
      return;
    }
    this.burns.set(o, { t: secs, black, hp: o.hp, fx: 0 });
  }

  /** is it burning (and black-burning)? */
  burning(o: Fighter): { black: boolean } | null {
    const b = this.burns.get(o);
    return b ? { black: b.black } : null;
  }

  private tendBurns(dt: number): void {
    const { f, g } = this;
    for (const [o, b] of this.burns) {
      if (o.dead || !g.fighters.includes(o)) {
        this.burns.delete(o);
        continue;
      }
      // no healing while it burns
      if (o.hp > b.hp) o.hp = b.hp;
      b.t -= dt;
      g.drain(o, (b.black ? 16 : 8) * dt, f);
      if (b.black) o.slow(0.3, 0.2);
      b.fx -= dt;
      if (b.fx <= 0) {
        b.fx = 0.12;
        bodyFire(g, o, 2, b.black);
      }
      b.hp = o.hp;
      if (b.t <= 0) this.burns.delete(o);
    }
  }

  /** forced to its knees for `secs` (a boss only for a moment) */
  kneel(o: Fighter, secs: number): void {
    const { g } = this;
    if (o.dead) return;
    const s = o.def.boss ? secs * 0.35 : secs;
    registerReactions(o.anim);
    o.stopAction();
    o.hitstun = Math.max(o.hitstun, s);
    o.anim.play('weighed_kneel', { fadeIn: 0.1, hold: true });
    const k = this.kneels.find((x) => x.o === o);
    if (k) k.until = Math.max(k.until, g.time + s);
    else this.kneels.push({ o, until: g.time + s });
  }

  private tendKneels(): void {
    const g = this.g;
    for (let i = this.kneels.length - 1; i >= 0; i--) {
      const k = this.kneels[i];
      if (k.o.dead || !g.fighters.includes(k.o)) {
        this.kneels.splice(i, 1);
        continue;
      }
      if (g.time < k.until) {
        k.o.hitstun = Math.max(k.o.hitstun, 0.1);
        continue;
      }
      if (k.o.anim.isPlaying('weighed_kneel')) k.o.anim.stopAll(0.3);
      this.kneels.splice(i, 1);
    }
  }

  /** the wardens' chains: whoever they hold burns */
  private tendChains(dt: number): void {
    const { f, g } = this;
    for (let i = this.chained.length - 1; i >= 0; i--) {
      const c = this.chained[i];
      c.t -= dt;
      if (c.t <= 0 || c.o.dead) {
        this.chained.splice(i, 1);
        continue;
      }
      g.drain(c.o, 30 * dt, f);
    }
  }

  /** Tenma's heat (Bankai) and Maō no Iatsu (final): the air round him burns */
  private passives(dt: number): void {
    const { f, g } = this;
    this.passiveT -= dt;
    if (this.passiveT > 0) return;
    this.passiveT = 0.5;
    if (this.form === 'bankai') {
      for (const o of g.enemiesOf(f)) if (o.pos.distanceTo(f.pos) < 6) this.ignite(o, 1.5);
    } else if (this.form === 'final') {
      for (const o of g.enemiesOf(f)) {
        if (o.pos.distanceTo(f.pos) > 16) continue;
        o.slow(0.35, 0.6);
        this.ignite(o, 1.2, true);
      }
    }
  }

  /** the fire that lives on him: his burning hem (Shikai), the halo and black smoke (Bankai), the arms and wheel (final) */
  private robeFire(dt: number): void {
    const { f, g } = this;
    if (this.form === 'sealed' || this.reviving) return;
    this.fxT -= dt;
    if (this.fxT > 0) return;
    this.fxT = this.form === 'shikai' ? 0.09 : 0.07;
    const pool = HellfirePool.of(g);
    const a = Math.random() * Math.PI * 2;
    if (this.form === 'shikai') {
      pool.spawn(Math.random() < 0.5 ? 'crimson' : 'violet', f.pos.x + Math.cos(a) * 0.45, f.pos.y + 0.05, f.pos.z + Math.sin(a) * 0.45, 0.3, 0.55, 0.45, 1, 0.6);
    } else {
      const c = this.sock('halo', new THREE.Vector3());
      const r = this.form === 'final' ? 0.95 : 0.6;
      pool.spawn(Math.random() < 0.5 ? 'black' : this.form === 'final' ? 'violet' : 'crimson', c.x + Math.cos(a) * r, c.y + Math.sin(a) * r - 0.3, c.z, 0.3, 0.6, 0.4, 1, 0.8);
      if (Math.random() < 0.3) blackSmoke(g, f.pos.clone().setY(f.pos.y + 0.2), 1, 0.3, 0.8);
    }
  }

  // ---------------------------------------------------------------- inputs

  attack(): void {
    const f = this.f;
    if (this.reviving) return;
    const cur = f.action;
    if (cur instanceof MoveAction) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastSwingEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const list = this.form === 'final' ? DADOU_FINAL_CHAIN : this.form === 'bankai' ? DADOU_BANKAI_CHAIN : DADOU_CHAIN;
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    this.lastSwingEnd = this.g.time + 0.8;
    this.f.act(new MoveAction(this, list[idx], idx), true);
  }

  cutSpec(clip: string): BladeSpec {
    const base = MOVES[clip].spec;
    const burn = (o: Fighter) => this.ignite(o, this.form === 'sealed' ? 1.5 : 2.5, this.form === 'final');
    return { ...base, cut: base.cut * CUT_K[this.form], reach: (base.reach ?? 0) + (this.form === 'bankai' ? 0.35 : this.form === 'final' ? 0.45 : 0.1), onHit: burn };
  }

  /** a cut's window opened: the form's addition */
  onCut(index: number): void {
    const { f, g } = this;
    if (this.form === 'sealed') {
      hellEmbers(g, this.tipPoint(new THREE.Vector3()), 4, 3);
    } else if (this.form === 'shikai') {
      const last = index === DADOU_CHAIN.length - 1;
      this.crescent(last
        ? { radius: 2.6, halfAngle: 1.0, speed: 46, range: 26, damage: 80, cut: 1400, colors: GOKUEN, dark: true, onHit: (o) => this.ignite(o, 4, true) }
        : { radius: 1.6, halfAngle: 0.9, speed: 46, range: 14, damage: 50, cut: 1100, colors: GOKUEN, dark: true, band: 0.5, onHit: (o) => this.ignite(o, 2.5, true) });
    } else if (this.form === 'bankai') {
      const giant = this.giant;
      if (giant) {
        giant.hits.clear();
        giant.spec = { damage: 70, knock: 14, launch: index === DADOU_BANKAI_CHAIN.length - 1 ? 12 : 3, hitstop: 0.08, shake: 0.35, cut: 2600, reach: 0.6, thick: 0.2, onHit: (o) => this.ignite(o, 3, true) };
      }
    } else {
      // Rokudō: both pairs of hands throw black fire, and the colossus cuts with him
      const fw = f.forward(new THREE.Vector3());
      const left = new THREE.Vector3(fw.z, 0, -fw.x);
      for (const k of [-1, 1]) {
        const from = f.center().addScaledVector(fw, 0.7).addScaledVector(left, k * 0.6).add(_v.set(0, 0.35, 0));
        const dir = this.aim(new THREE.Vector3()).sub(from).normalize();
        if (Math.abs(dir.y) > 0.5) dir.setY(Math.sign(dir.y) * 0.5).normalize();
        const side = bladeSide(f).applyAxisAngle(fw, k * 0.5);
        g.addProjectile(new GetsugaProjectile(g, f, from, dir, side, { radius: 2.4, halfAngle: 1.0, speed: 60, range: 40, damage: 55, cut: 1800, colors: MAO, dark: true, onHit: (o) => this.ignite(o, 3, true) }));
      }
      const giant = this.giant;
      if (giant) {
        giant.hits.clear();
        giant.spec = { damage: 70, knock: 14, launch: 4, hitstop: 0.08, shake: 0.35, cut: 2600, reach: 0.6, thick: 0.2, onHit: (o) => this.ignite(o, 3, true) };
      }
    }
  }

  /** a crescent thrown off the swing, in the blade's plane */
  private crescent(o: GetsugaOpts): void {
    const { f, g } = this;
    const fw = f.forward(new THREE.Vector3());
    const from = f.center().addScaledVector(fw, 0.7);
    const dir = this.aim(new THREE.Vector3()).sub(from).normalize();
    if (Math.abs(dir.y) > 0.5) dir.setY(Math.sign(dir.y) * 0.5).normalize();
    g.addProjectile(new GetsugaProjectile(g, f, from, dir, bladeSide(f), o));
  }

  /** RMB */
  heavy(): void {
    if (this.reviving) return;
    switch (this.form) {
      case 'sealed':
        this.special(new Skill(this, 'haien', 'dd_haien', 0.6, { fire: [0.25, () => this.haien()] }, { mobility: 0.1 }), 14, 'haien', 2.4);
        return;
      case 'shikai':
        this.special(new Skill(this, 'kokuen', 'dd_kokuen', 0.7, { fire: [0.3, () => this.kokuen()] }, { armor: 0.5, mobility: 0.05 }), 22, 'kokuen', 3);
        return;
      case 'bankai': {
        const t = this.target(45);
        if (!t) return this.nobody();
        this.special(new Skill(this, 'gates', 'db_gates', 1.3, { rise: [0.3, () => this.gates(t)] }, { armor: 0.8, mobility: 0.05 }), 40, 'gates', 12);
        return;
      }
      case 'final':
        this.special(new Skill(this, 'cannon', 'df_cannon', 2.1, { charge: [0.2, () => this.g.sfx.play('charge', this.f.center(), 1.4)], fire: [0.5, () => this.cannon()] }, { armor: 1, mobility: 0.1, cancelAt: 2 }), 50, 'cannon', 6);
    }
  }

  /** Q */
  skill1(): void {
    if (this.reviving) return;
    switch (this.form) {
      case 'sealed':
        this.special(new Skill(this, 'shakka', 'dd_shakka', 0.65, { fire: [0.3, () => this.shakka()] }, { mobility: 0.1 }), 18, 'shakka', 3.5);
        return;
      case 'shikai':
        this.special(new Skill(this, 'onibi', 'dd_onibi', 0.75, { raise: [0.15, () => this.onibi()] }, { mobility: 0.15 }), 26, 'onibi', 6);
        return;
      case 'bankai':
        this.special(new Skill(this, 'chains', 'db_chains', 0.95, { cast: [0.5, () => this.chains()] }, { mobility: 0.05, armor: 0.6 }), 34, 'chains', 10);
        return;
      case 'final':
        if (this.wheelOut) return;
        this.special(new Skill(this, 'wheel', 'df_wheel', 0.9, { throw: [0.4, () => this.wheel()] }, { mobility: 0.15 }), 36, 'wheel', 7);
    }
  }

  /** E */
  skill2(): void {
    if (this.reviving) return;
    switch (this.form) {
      case 'sealed':
        this.special(new Skill(this, 'oi', 'dd_oi', 0.6, { press: [0.2, () => this.oi()] }, { mobility: 0.05, armor: 0.5 }), 16, 'oi', 6);
        return;
      case 'shikai': {
        const t = this.target(30);
        if (!t) return this.nobody();
        this.special(new Skill(this, 'kensaku', 'dd_kensaku', 0.85, { throw: [0.25, () => this.kensaku(t)] }, { mobility: 0.1 }), 18, 'kensaku', 5);
        return;
      }
      case 'bankai': {
        const t = this.target(40);
        if (!t) return this.nobody();
        this.tenmaNoTe(t);
        return;
      }
      case 'final': {
        const t = this.target(50);
        if (!t) return this.nobody();
        this.special(new Skill(this, 'muken', 'df_muken', 0.8, { cast: [0.3, () => this.muken(t)] }, { mobility: 0.1 }), 44, 'muken', 10);
      }
    }
  }

  /** R */
  skill3(): void {
    if (this.reviving) return;
    switch (this.form) {
      case 'sealed': {
        const t = this.target(40);
        if (!t) return this.nobody();
        this.special(new Skill(this, 'gochu', 'dd_gochu', 0.75, { cast: [0.35, () => this.gochu(t)] }, { mobility: 0.1 }), 22, 'gochu', 8);
        return;
      }
      case 'shikai': {
        const t = this.target(50);
        if (!t) return this.nobody();
        this.special(new Skill(this, 'goka', 'dd_goka', 0.85, { mark: [0.2, () => this.goka(t)] }, { mobility: 0.1 }), 28, 'goka', 7);
        return;
      }
      case 'bankai':
        this.special(new Skill(this, 'hells', 'db_hells', 1.0, { cast: [0.4, () => this.burningHells()] }, { mobility: 0.05, armor: 0.8 }), 50, 'hells', 18);
        return;
      case 'final': {
        const t = this.target(70);
        if (!t) return this.nobody();
        this.special(new Skill(this, 'korin', 'df_descent', 1.4, { raise: [0.4, () => this.korinRaise(t)], stab: [1.0, () => this.korinStab(t)] }, { armor: 1, mobility: 0 }), 60, 'korin', 14);
      }
    }
  }

  /** G */
  toggle(): void {
    if (this.reviving) return;
    switch (this.form) {
      case 'sealed':
        if (this.special(new Skill(this, 'throne', 'dd_throne', 3.6, { sit: [0.5, () => this.sit()], erupt1: [1.2, () => this.erupt()], erupt2: [2.4, () => this.erupt()] }, { invulnerable: true, mobility: 0, cancelAt: 3.4 }), 40, 'throne', 14))
          this.g.addProjectile(new Throne(this.g, this.f, 3.3));
        return;
      case 'shikai':
        this.special(new Skill(this, 'hyakki', 'dd_hyakki', 0.9, { call: [0.45, () => this.hyakki()] }, { mobility: 0.05, armor: 0.6 }), 40, 'hyakki', 12);
        return;
      case 'bankai':
        this.special(new Skill(this, 'daitenma', 'db_daitenma', 1.6, { raise: [0.3, () => this.say('大天魔斬り', 'DAITENMA-GIRI', HELL_CRIMSON)], cut: [1.1, () => this.daitenma()] }, { armor: 1, mobility: 0 }), 60, 'daitenma', 16);
        return;
      case 'final':
        this.special(new Skill(this, 'tenka', 'df_tenka', 1.6, { call: [0.8, () => this.tenkaCall()], rain: [1.2, () => this.tenkaRain()] }, { invulnerable: true, mobility: 0 }), 80, 'tenka', 24);
    }
  }

  /** F: up the ladder; from the final form, everything sealed */
  release(): void {
    const { f, g } = this;
    if (this.reviving || f.busy || f.sealT > 0 || this.cd.release > 0) return;
    if (this.form === 'sealed') {
      if (!f.spendRei(20)) return this.noRei();
      f.act(new Skill(this, 'release', 'dd_release', 1.0, {
        name: [0.25, () => this.say('平伏せ「波旬」', 'HIREFUSE, HAJUN', HELL_VIOLET)],
        burn: [0.6, () => this.toShikai()],
      }, { armor: 0.8, mobility: 0.1 }), true);
      return;
    }
    if (this.form === 'shikai') {
      if (!f.spendRei(40)) return this.noRei();
      f.act(new Skill(this, 'bankai', 'dd_bankai', 1.5, {
        name: [0.3, () => this.say('卍解「天魔波旬」', 'BANKAI — TENMA HAJUN', HELL_CRIMSON)],
        rise: [0.85, () => this.toBankai()],
      }, { invulnerable: true, mobility: 0 }), true);
      g.sfx.play('bankai', f.center(), 1);
      return;
    }
    if (this.form === 'bankai') {
      if (!f.spendRei(60)) return this.noRei();
      f.act(new Skill(this, 'tenkaFubu', 'db_tenka', 1.6, {
        name: [0.3, () => this.say('天下布武「第六天魔王」', 'TENKA FUBU — DAIROKUTEN MAŌ', HELL_VIOLET)],
        rise: [0.8, () => this.toFinal()],
      }, { invulnerable: true, mobility: 0 }), true);
      g.sfx.play('bankai', f.center(), 1.3);
      return;
    }
    f.act(new Skill(this, 'seal', 'df_seal', 0.5, { cast: [0.2, () => this.toSealed()] }), true);
  }

  toggleFlare(): void {
    this.flare = !this.flare;
    this.applyStats();
    if (this.flare) {
      this.f.aura.flare(1.8, 0.45);
      this.g.shake(0.25);
      this.g.sfx.play('flare', this.f.center());
      hellFlash(this.g, this.f.center(), 1.4);
    }
  }

  private noRei(): void {
    if (this.f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
  }

  private nobody(): void {
    if (this.f === this.g.player) this.g.hud?.showBanner('No one in reach', 1);
  }

  target(range: number): Fighter | null {
    return this.g.nearestEnemy(this.f, range, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, range);
  }

  /** where he aims: the target, or the camera's aim for the player */
  aim(out = new THREE.Vector3()): THREE.Vector3 {
    const { f, g } = this;
    const t = this.target(120);
    if (t) return t.center(out);
    if (f === g.player && !f.faceTarget) return g.aimPoint(f, out);
    if (f.faceTarget) return out.copy(f.faceTarget);
    return f.center(out).addScaledVector(f.forward(_w), 30);
  }

  /** the horizontal direction he aims along */
  private flatAim(): THREE.Vector3 {
    const { f } = this;
    const d = this.aim(new THREE.Vector3()).sub(f.pos).setY(0);
    if (d.lengthSq() < 1e-4) f.forward(d);
    return d.normalize();
  }

  private special(a: FighterAction, cost: number, cdKey: keyof typeof this.cd, cd: number): boolean {
    const f = this.f;
    if (this.cd[cdKey] > 0 || f.dead) return false;
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

  private sock(name: string, out: THREE.Vector3): THREE.Vector3 {
    const s = this.f.visual.rig.sockets.get(name);
    if (!s) return this.f.center(out).addScaledVector(this.f.forward(_w), 0.5);
    s.updateWorldMatrix(true, false);
    return s.getWorldPosition(out);
  }

  tipPoint(out: THREE.Vector3): THREE.Vector3 {
    this.muzzle.updateWorldMatrix(true, false);
    return this.muzzle.getWorldPosition(out);
  }

  // ---------------------------------------------------------------- forms

  private setForm(form: Form): void {
    const { f } = this;
    this.form = form;
    const stance = form === 'final' ? DADOU_FINAL_STANCE : form === 'bankai' ? DADOU_BANKAI_STANCE : DADOU_STANCE;
    f.def = { ...f.def, stance, speed: { ...SPEEDS[form] } };
    f.setForm({ asset: dadouAsset(form), props: props(form) }, AURAS[form], BLADES[form]);
    f.trail?.reset();
    this.wheelOut = false;
    if (form !== 'final') f.mounted = false;
    this.hands();
    this.attachMuzzles();
    this.applyStats();
  }

  private toShikai(): void {
    const { f, g } = this;
    if (this.form !== 'sealed') return;
    this.setForm('shikai');
    f.aura.flare(1.4, 0.4);
    // "Bow down": everyone near him bows
    for (const o of g.enemiesOf(f)) if (o.pos.distanceTo(f.pos) < 10) this.kneel(o, 1);
    hellFlash(g, this.tipPoint(new THREE.Vector3()), 1.4);
    fireRing(g, f.pos.clone(), 4);
    g.sfx.play('flare', f.center(), 0.9);
  }

  private toBankai(): void {
    const { f, g } = this;
    if (this.form !== 'shikai') return;
    this.setForm('bankai');
    // the Bankai mends him: he rises out of it whole
    f.hp = f.maxHp;
    f.aura.flare(1.8, 0.6);
    f.aura.pillarBurst(2.6);
    this.raiseGiant();
    if (!this.sky) {
      this.skyLook = { ...SKY_HELL };
      this.sky = new SkyTint(g, this.skyLook, 1.0);
      g.addProjectile(this.sky);
    }
    hellfireAt(g, f.pos, 6, 1.6, 1.8);
    fireRing(g, f.pos.clone(), 9);
    for (let i = 0; i < 3; i++) g.addRing(f.pos.clone().setY(f.pos.y + 0.2), 12 + i * 10, i === 1 ? HELL_VIOLET : HELL_CRIMSON, 0.8 + i * 0.3);
    g.shake(0.9);
    g.slowMo(0.5, 0.4);
  }

  private toFinal(): void {
    const { f, g } = this;
    if (this.form !== 'bankai') return;
    this.setForm('final');
    f.hp = f.maxHp;
    f.rei = f.maxRei;
    f.body.vel.y = 9;
    f.body.grounded = false;
    f.aura.flare(2, 0.8);
    f.aura.pillarBurst(3.2);
    if (!this.giant) this.raiseGiant();
    hellFlash(g, f.center(), 3);
    fireRing(g, f.pos.clone(), 12);
    for (let i = 0; i < 4; i++) g.addRing(f.pos.clone().setY(f.pos.y + 0.2), 14 + i * 10, i % 2 ? HELL_VIOLET : HELL_CRIMSON, 0.9 + i * 0.3);
    g.shake(1.2);
    g.slowMo(0.7, 0.35);
  }

  private toSealed(): void {
    const { f, g } = this;
    if (this.form === 'sealed') return;
    this.dismissGiant();
    // the burning hells go out with him
    if (this.hells && !this.hells.done) this.hells.o.life = 0;
    if (this.sky) this.sky.target = 0;
    this.sky = null;
    this.infernoT = 0;
    this.setForm('sealed');
    this.cd.release = 4;
    hellEmbers(g, f.center(), 20, 4);
    g.sfx.play('ting', f.center(), 0.8);
  }

  private raiseGiant(): void {
    const { f, g } = this;
    if (this.giant && !this.giant.ending) return;
    this.giant = new TenmaGiant(g, f, 11, 1.4);
    g.addProjectile(this.giant);
    g.sfx.play('roarBig', f.center(), 1.2);
  }

  private dismissGiant(): void {
    if (!this.giant) return;
    this.giant.dismiss();
    this.giant = null;
  }

  private applyStats(): void {
    const f = this.f;
    const st = STATS[this.form];
    f.power = st.power * (this.flare ? 1.25 : 1);
    f.damageTaken = st.taken;
    f.knockTaken = this.form === 'final' ? 0 : this.form === 'bankai' ? 0.4 : 0.8;
    f.energyTaken = this.form === 'final' ? 0.6 : 1;
    f.aura.target = this.flare ? 1 : this.form === 'final' ? 0.26 : this.form === 'bankai' ? 0.22 : this.form === 'shikai' ? 0.14 : 0.06;
  }

  formName(): string {
    const name = this.form === 'sealed' ? 'Hajun (sealed)' : this.form === 'shikai' ? 'Hajun' : this.form === 'bankai' ? 'Tenma Hajun' : 'Dairokuten Maō';
    return name + (this.revived ? '' : ' · Jigoku-gaeri ready');
  }

  // ---------------------------------------------------------------- Jigoku-gaeri

  /** the first death: he falls into Hell — and the Gates open behind him and he walks back out, one form higher */
  private jigokuGaeri(): boolean {
    const { f, g } = this;
    if (this.revived) return false;
    this.revived = true;
    this.reviving = true;
    f.hp = 1;
    f.invuln = Math.max(f.invuln, 3);
    f.stopAction();
    f.hitstun = 0;
    f.visual.object.visible = false;
    f.aura.target = 0;
    this.dismissGiant();
    hellFlash(g, f.center(), 2.2);
    hellfireAt(g, f.pos, 3, 1.5, 1.6, false);
    const face = f.forward(new THREE.Vector3());
    g.addProjectile(new GatesOfHell(g, f, f.pos.clone().addScaledVector(face, -1.2), face, { mode: 'revive', onEmerge: () => this.emerge(face) }));
    this.say('地獄帰り', 'JIGOKU-GAERI', HELL_CRIMSON);
    g.slowMo(0.6, 0.35);
    return true;
  }

  private emerge(face: THREE.Vector3): void {
    const { f, g } = this;
    this.reviving = false;
    f.rooted = false;
    f.visual.object.visible = true;
    const p = f.pos.clone().addScaledVector(face, 0.6);
    if (clearAt(g, p, f.def.height)) {
      f.body.pos.copy(p);
      f.body.prev.copy(p);
    }
    const next = LADDER[Math.min(LADDER.length - 1, LADDER.indexOf(this.form) + 1)];
    if (next !== this.form) {
      // straight up the ladder (each step's own arrival: the bow, the colossus and the red sky, the flight)
      if (this.form === 'sealed') this.toShikai();
      else if (this.form === 'shikai') this.toBankai();
      else this.toFinal();
    } else if (this.form === 'bankai' || this.form === 'final') this.raiseGiant();
    f.hp = f.maxHp;
    f.rei = f.maxRei;
    f.invuln = Math.max(f.invuln, 1);
    this.applyStats();
    f.aura.flare(2, 0.8);
    hellFlash(g, f.center(), 2.6);
    g.shake(0.8);
  }

  // ---------------------------------------------------------------- sealed

  /** Hadō #54 Haien: a violet orb that engulfs the target in fire */
  private haien(): void {
    const { f, g } = this;
    const from = this.sock('palm.L', new THREE.Vector3());
    const t = this.target(60);
    const dir = this.aim(new THREE.Vector3()).sub(from).normalize();
    g.addProjectile(new HellOrb(g, f, from, dir, t, { kind: 'violet', radius: 0.55, speed: 32, homing: 2.2, damage: 120, blast: 2.2, power: 900, black: true, range: 70, onHit: (o) => this.ignite(o, 4, true) }));
    this.say('破道の五十四「廃炎」', 'HADŌ #54 — HAIEN', HELL_VIOLET);
    g.sfx.play('getsuga', from, 0.9);
  }

  /** Hadō #31 Shakkahō: five red cannons fanned out */
  private shakka(): void {
    const { f, g } = this;
    const from = this.sock('finger.L', new THREE.Vector3());
    const t = this.target(60);
    const aim = this.aim(new THREE.Vector3()).sub(from).normalize();
    for (let i = 0; i < 5; i++) {
      const dir = aim.clone().applyAxisAngle(UP, (i - 2) * 0.13);
      g.addProjectile(new HellOrb(g, f, from.clone(), dir, t, { kind: 'crimson', radius: 0.38, speed: 38, homing: 0.9, damage: 55, blast: 1.4, power: 700, range: 70, onHit: (o) => this.ignite(o, 2) }));
    }
    this.say('破道の三十一「赤火砲・五連発」', 'HADŌ #31 — SHAKKAHŌ: GORENPATSU', HELL_CRIMSON);
    g.sfx.play('getsuga', from, 1.1);
  }

  /** Ōi: his majesty falls like a weight — everyone within 12 m kneels */
  private oi(): void {
    const { f, g } = this;
    const c = f.pos.clone();
    for (const o of g.enemiesOf(f)) {
      if (o.pos.distanceTo(c) > 12) continue;
      g.damage(o, 60, f, _v.subVectors(o.pos, c).setY(0).normalize().clone(), { knock: 0, quiet: false, hitstop: 0.06, color: HELL_CRIMSON });
      this.kneel(o, 1.6);
      g.engine.destruction.carve(new SphereShape(o.pos.clone(), 1.1, 0.35), { mode: 'smash', power: 400, impulse: 3 });
    }
    // the ground cracks in a ring round him
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const p = new THREE.Vector3(c.x + Math.cos(a) * 6, c.y, c.z + Math.sin(a) * 6);
      p.y = groundAt(g, p.x, c.y + 1, p.z, 4) ?? c.y;
      g.engine.destruction.carve(new SphereShape(p, 0.8, 0.4), { mode: 'smash', power: 300, impulse: 2 });
    }
    g.addRing(c.clone().setY(c.y + 0.1), 24, HELL_CRIMSON, 0.5);
    g.addRing(c.clone().setY(c.y + 0.1), 14, HELL_GOLD, 0.35);
    hellEmbers(g, f.center(), 14, 5);
    this.say('王威', 'ŌI', HELL_GOLD);
    g.sfx.play('impact', c, 1.6);
    g.shake(0.45);
  }

  /** Bakudō #75 Gochūtekkan: five iron pillars fall and pin the target */
  private gochu(t: Fighter): void {
    const { f, g } = this;
    if (t.dead) return;
    g.addProjectile(new IronPillars(g, f, t, { dur: 3, damage: 80, onPin: (o) => this.kneel(o, 3) }));
    this.say('縛道の七十五「五柱鉄貫」', 'BAKUDŌ #75 — GOCHŪTEKKAN', '#C9C4D0');
  }

  /** Gyokuza: he sits; every enemy within 22 m kneels */
  private sit(): void {
    const { f, g } = this;
    for (const o of g.enemiesOf(f)) if (o.pos.distanceTo(f.pos) < 22) this.kneel(o, 3);
    g.addRing(f.pos.clone().setY(f.pos.y + 0.1), 44, HELL_GOLD, 0.6);
    this.say('玉座', 'GYOKUZA', HELL_GOLD);
    g.sfx.play('impact', f.pos, 1.2);
    g.shake(0.4);
  }

  /** …and fire erupts under them */
  private erupt(): void {
    const { f, g } = this;
    for (const o of g.enemiesOf(f)) {
      if (o.pos.distanceTo(f.pos) > 22) continue;
      g.damage(o, 110, f, UP.clone(), { energy: true, knock: 0, hitstop: 0.06, color: HELL_VIOLET });
      this.ignite(o, 2);
      hellfireAt(g, o.pos, 1.8, 1.5, 1.2);
      hellFlash(g, o.center(), 1);
    }
    g.sfx.play('explode', f.pos, 1);
  }

  // ---------------------------------------------------------------- Shikai

  /** Kokuen: a lunge, and a cone of black fire 14 m long that eats what it touches */
  private kokuen(): void {
    const { f, g } = this;
    const fw = this.flatAim();
    const apex = this.tipPoint(new THREE.Vector3());
    const dir = this.aim(new THREE.Vector3()).sub(apex).normalize();
    if (Math.abs(dir.y) > 0.4) dir.setY(Math.sign(dir.y) * 0.4).normalize();
    const len = 14;
    g.engine.destruction.carve(new ConeShape(apex.clone(), dir.clone(), 0.36, len), { mode: 'rot', power: 1500, dust: 0.4 });
    for (const o of g.enemiesOf(f)) {
      _v.subVectors(o.center(), apex);
      const along = _v.dot(dir);
      if (along < -0.5 || along > len + o.def.radius) continue;
      if (_v.addScaledVector(dir, -along).length() > 1 + Math.max(0, along) * 0.38 + o.def.radius) continue;
      g.damage(o, 200, f, fw.clone(), { energy: true, knock: 12, launch: 3, heavy: true, hitstop: 0.12, shake: 0.5, color: HELL_VIOLET });
      this.ignite(o, 4, true);
    }
    const pool = HellfirePool.of(g);
    for (let i = 0; i < 70; i++) {
      const s = Math.random() * len;
      const spread = s * 0.38 * Math.sqrt(Math.random());
      const a = Math.random() * Math.PI * 2;
      const side = _w.set(dir.z, 0, -dir.x).normalize();
      const p = apex.clone().addScaledVector(dir, s).addScaledVector(side, Math.cos(a) * spread).add(_v.set(0, Math.sin(a) * spread * 0.6 - 0.6, 0));
      pool.spawn(Math.random() < 0.6 ? 'black' : 'violet', p.x, p.y, p.z, 0.6 + s * 0.06, 1 + s * 0.08, 0.5 + Math.random() * 0.5, 1.3, 1.5);
    }
    blackSmoke(g, apex.clone().addScaledVector(dir, len * 0.5), 10, 2, 2.4);
    this.say('黒炎', 'KOKUEN', HELL_VIOLET);
    g.sfx.play('beam', apex, 1.2);
    g.shake(0.35);
  }

  /** Onibi: nine wisps circle him, then hunt the target one after another */
  private onibi(): void {
    const { f, g } = this;
    const t = this.target(70);
    for (let i = 0; i < 9; i++) {
      const c = f.center();
      g.addProjectile(new HellOrb(g, f, c, f.forward(new THREE.Vector3()), t, { kind: 'violet', radius: 0.3, speed: 30, homing: 3.5, damage: 45, blast: 1, power: 500, range: 80, orbit: { t: 0.38 + i * 0.12, a: (i / 9) * Math.PI * 2 }, onHit: (o) => this.ignite(o, 2) }));
    }
    this.say('鬼火', 'ONIBI', HELL_VIOLET);
    g.sfx.play('charge', f.center(), 1.2);
  }

  /** Kensaku: the rope of fire lassoes the target and drags it to his feet */
  private kensaku(t: Fighter): void {
    const { f, g } = this;
    if (t.dead) return;
    g.addProjectile(new FireRope(g, f, () => this.sock('palm.L', new THREE.Vector3()), t, {
      fly: 0.15, pullAt: 0.3, pull: 0.35, bind: 1,
      onCatch: (o) => {
        g.damage(o, 60, f, _v.subVectors(f.pos, o.pos).setY(0).normalize().clone(), { energy: true, knock: 0, hitstop: 0.06, unblockable: true, color: HELL_CRIMSON });
        this.ignite(o, 3);
      },
    }));
    this.say('羂索', 'KENSAKU', HELL_CRIMSON);
  }

  /** Gōka: the ground under the target glows; a pillar of hellfire erupts there, then two more chase it */
  private goka(t: Fighter): void {
    const { f, g } = this;
    const pillar = () => {
      if (t.dead || f.dead) return;
      g.addProjectile(new HellPillar(g, f, t.pos.clone(), { delay: 0.4, radius: 1.6, height: 14, damage: 160, onHit: (o) => this.ignite(o, 3, true) }));
    };
    pillar();
    this.after(0.6, pillar);
    this.after(1.2, pillar);
    this.say('業火', 'GŌKA', HELL_VIOLET);
  }

  /** Hyakki Yakō: the night parade of a hundred demons charges 45 m ahead */
  private hyakki(): void {
    const { f, g } = this;
    const fw = this.flatAim();
    const origin = f.pos.clone().addScaledVector(fw, 1.5);
    g.addProjectile(new DemonParade(g, f, origin, fw, { count: 21, width: 10, length: 45, speed: 26, damage: 35, maxHits: 6, onHit: (o) => this.ignite(o, 2) }));
    this.say('百鬼夜行', 'HYAKKI YAKŌ', HELL_CRIMSON);
    g.shake(0.4);
  }

  // ---------------------------------------------------------------- Bankai

  /** Jigoku no Mon: the Gates rise behind the target, a blade from Hell impales it, chains drag it in */
  private gates(t: Fighter): void {
    const { f, g } = this;
    if (t.dead) return;
    const d = _v.subVectors(t.pos, f.pos).setY(0);
    if (d.lengthSq() < 1e-4) f.forward(d);
    d.normalize();
    const at = t.pos.clone().addScaledVector(d, 2.6);
    g.addProjectile(new GatesOfHell(g, f, at, d.clone().negate(), {
      mode: 'judge', victim: t,
      onImpale: (v) => {
        g.damage(v, 600, f, d.clone(), { knock: 0, heavy: true, hitstop: 0.2, shake: 1, unblockable: true, color: HELL_CRIMSON });
        this.ignite(v, 5, true);
      },
      onSpit: (v) => {
        g.damage(v, 100, f, d.clone().negate(), { energy: true, knock: 6, launch: 6, heavy: true, hitstop: 0.1, unblockable: true, color: HELL_VIOLET });
        this.ignite(v, 5, true);
      },
    }));
    this.say('地獄の門', 'JIGOKU NO MON', HELL_CRIMSON);
  }

  /** Gokusotsu no Kusari: the wardens' chains burst from the ground under every enemy within 25 m */
  private chains(): void {
    const { f, g } = this;
    for (const o of g.enemiesOf(f)) {
      if (o.pos.distanceTo(f.pos) > 25) continue;
      g.addProjectile(new ChainBind(g, f, o, 3));
      this.chained.push({ o, t: 3 });
      hellfireAt(g, o.pos, 1.4, 1.2, 1.4, false);
      g.damage(o, 40, f, UP.clone(), { knock: 0, hitstop: 0.05, unblockable: true, color: HELL_CRIMSON });
    }
    g.addRing(f.pos.clone().setY(f.pos.y + 0.1), 50, HELL_CRIMSON, 0.6);
    this.say('獄卒の鎖', 'GOKUSOTSU NO KUSARI', HELL_CRIMSON);
    g.sfx.play('crack', f.center(), 1.2);
  }

  /** Tenma no Te: the colossus reaches down, closes its fist on the target, lifts it and smashes it into the ground */
  private tenmaNoTe(t: Fighter): void {
    const { f, g } = this;
    const giant = this.giant;
    let held = false;
    const dir = _v.subVectors(t.pos, f.pos).setY(0);
    if (dir.lengthSq() < 1e-4) f.forward(dir);
    dir.normalize();
    const d = dir.clone();
    const ok = this.special(new Skill(this, 'grab', 'db_grab', 1.4, {
      grab: [0.35, () => {
        if (t.dead) return;
        held = true;
        t.stopAction();
        g.sfx.play('impact', t.center(), 1);
        this.say('天魔の手', 'TENMA NO TE', HELL_CRIMSON);
      }],
      slam: [0.95, () => {
        if (!held || t.dead) return;
        held = false;
        t.rooted = false;
        const p = t.pos.clone();
        p.y = groundAt(g, p.x, p.y + 1, p.z, 40) ?? p.y;
        t.body.pos.copy(p);
        t.body.vel.set(0, -10, 0);
        g.damage(t, 380, f, d.clone(), { knock: 2, heavy: true, hitstop: 0.18, shake: 1, unblockable: true, color: HELL_CRIMSON });
        this.ignite(t, 4, true);
        g.groundImpact(p, 4, 1500, HELL_CRIMSON, f);
        hellfireAt(g, p, 3, 1.4, 1.4);
        g.slowMo(0.25, 0.35);
      }],
    }, {
      armor: 0.8, mobility: 0,
      tick: () => {
        if (!held || t.dead) return;
        // carried in the colossus's hand
        const hand = giant && !giant.ending ? giant.point('palm.L', new THREE.Vector3()) : f.center().addScaledVector(d, 2).add(_w.set(0, 3, 0));
        t.body.pos.set(hand.x, hand.y - t.def.height * 0.5, hand.z);
        t.body.vel.set(0, 0, 0);
        t.push.set(0, 0, 0);
        t.hitstun = Math.max(t.hitstun, 0.3);
        t.rooted = true;
      },
      onEnd: () => {
        if (held) t.rooted = false;
        giant?.moveTo(null, null);
      },
    }), 34, 'grab', 9);
    if (!ok || !giant) return;
    // the colossus steps in so its left hand reaches the target
    const left = new THREE.Vector3(d.z, 0, -d.x);
    const reach = giant.scale * 0.62;
    const anchor = t.pos.clone().addScaledVector(d, -reach).addScaledVector(left, -giant.scale * 0.2);
    anchor.y = groundAt(g, anchor.x, t.pos.y + 4, anchor.z, 30) ?? t.pos.y;
    giant.moveTo(anchor, t.center());
  }

  /** Hachinetsu Jigoku: the ground for 26 m round him becomes Hell */
  private burningHells(): void {
    const { f, g } = this;
    this.hells = new BurningHells(g, f, f.pos.clone(), { radius: 26, life: 10, dps: 40, slow: 0.6, onTick: (o) => this.ignite(o, 0.6) });
    g.addProjectile(this.hells);
    fireRing(g, f.pos.clone(), 26);
    this.say('八熱地獄', 'HACHINETSU JIGOKU', HELL_CRIMSON);
    g.shake(0.6);
  }

  /** Daitenma-giri: the colossus brings its blade down in one cut 70 m long through everything ahead */
  private daitenma(): void {
    const { f, g } = this;
    const fw = this.flatAim();
    const right = new THREE.Vector3(fw.z, 0, -fw.x);
    const origin = f.pos.clone().addScaledVector(fw, 1).setY(f.pos.y + 18);
    g.addProjectile(new PlanarSlash(g, f, origin, fw.clone(), UP.clone(), { length: 70, width: 40, grow: 0.16, damage: 0, cut: 5000, color: '#FF2A48', core: '#FFD6E0' }));
    for (const o of g.enemiesOf(f)) {
      _v.subVectors(o.center(), origin);
      const a = _v.dot(fw);
      if (a < -1 || a > 70) continue;
      if (Math.abs(_v.dot(right)) > 1.6 + o.def.radius) continue;
      if (_v.y < -20 || _v.y > 20) continue;
      g.damage(o, 800, f, right.clone().multiplyScalar(Math.sign(_v.dot(right)) || 1), { knock: 18, launch: 8, heavy: true, hitstop: 0.2, shake: 1.2, unblockable: true, color: HELL_CRIMSON });
      this.ignite(o, 5, true);
    }
    for (let s = 2; s < 70; s += 3) hellfireAt(g, f.pos.clone().addScaledVector(fw, s), 1.2, 1.2, 1.6, false);
    g.sfx.play('swingHeavy', f.center(), 1.6);
    g.sfx.play('explode', f.center(), 1);
    g.shake(1.1);
    g.slowMo(0.35, 0.35);
  }

  // ---------------------------------------------------------------- final

  /** Gokuen-hō: four hands together — a beam of black-cored hellfire, 120 m */
  private cannon(): void {
    const { f, g } = this;
    g.addProjectile(new CeroBeam(g, f, this.chestMuzzle, () => this.aim(new THREE.Vector3()), { charge: 0.05, fire: 1.4, radius: 1.6, damage: 1200, power: 2400, core: '#FFD6E0', body: '#FF2A48', rim: '#7A0E3A', dark: '#120A12', range: 120, track: 1.2, gain: 1.9 }));
    this.say('獄炎砲', 'GOKUEN-HŌ', HELL_CRIMSON);
    hellFlash(g, this.chestMuzzle.getWorldPosition(new THREE.Vector3()), 1.4);
  }

  /** Kaen-rin: the wheel off his back as a buzzsaw of fire */
  private wheel(): void {
    const { f, g } = this;
    const halo = f.visual.props.get('halo');
    if (!halo) return;
    const t = this.target(70);
    const from = this.sock('halo', new THREE.Vector3());
    halo.visible = false;
    this.wheelOut = true;
    const visual = f.visual;
    g.addProjectile(new FlameWheel(g, f, from, t, this.aim(new THREE.Vector3()), {
      radius: 6, speed: 30, range: 60, damage: 90, maxHits: 4, onHit: (o) => this.ignite(o, 2, true),
      onReturn: () => {
        // (a form change since has built a new visual)
        if (f.visual === visual) halo.visible = true;
        this.wheelOut = false;
      },
    }));
    this.say('火炎輪', 'KAEN-RIN', HELL_CRIMSON);
  }

  /** Muken: the target swallowed by a sphere of black fire */
  private muken(t: Fighter): void {
    const { f, g } = this;
    if (t.dead) return;
    g.addProjectile(new MukenSphere(g, f, t, { radius: 2.6, life: 3, ticks: 12, tickDmg: 60, implode: 300, power: 2600, onHit: (o) => this.ignite(o, 1, true) }));
    this.say('無間', 'MUKEN', HELL_VIOLET);
  }

  /** Tenma Kōrin: the colossus appears over the target … */
  private korinRaise(t: Fighter): void {
    const { f, g } = this;
    if (!this.giant) this.raiseGiant();
    const giant = this.giant!;
    if (t.dead) return;
    const d = _v.subVectors(t.pos, f.pos).setY(0);
    if (d.lengthSq() < 1e-4) f.forward(d);
    d.normalize();
    giant.scale = 14;
    giant.leanOn = false;
    const anchor = t.pos.clone().addScaledVector(d, -giant.scale * 0.5);
    anchor.y = groundAt(g, anchor.x, t.pos.y + 4, anchor.z, 30) ?? t.pos.y;
    giant.moveTo(anchor, t.center());
    this.say('天魔降臨', 'TENMA KŌRIN', HELL_VIOLET);
    g.sfx.play('roarBig', anchor, 1.4);
  }

  /** … and drives its blade down through it */
  private korinStab(t: Fighter): void {
    const { f, g } = this;
    const at = t.pos.clone();
    at.y = groundAt(g, at.x, at.y + 1, at.z, 20) ?? at.y;
    if (!t.dead) {
      g.damage(t, 900, f, UP.clone().negate(), { knock: 0, heavy: true, hitstop: 0.22, shake: 1.4, unblockable: true, color: HELL_VIOLET });
      this.ignite(t, 5, true);
      this.kneel(t, 1.2);
    }
    g.engine.destruction.carve(new SphereShape(at.clone(), 6, 0.7), { mode: 'smash', power: 3000, impulse: 20 });
    hellfireAt(g, at, 5, 1.6, 2);
    hellFlash(g, at.clone().setY(at.y + 1.5), 3);
    g.addRing(at.clone().setY(at.y + 0.2), 30, HELL_VIOLET, 0.6);
    g.sfx.play('explode', at, 2.4);
    g.shake(1.2);
    g.slowMo(0.4, 0.3);
    this.after(0.7, () => {
      const giant = this.giant;
      if (!giant) return;
      giant.scale = 11;
      giant.leanOn = true;
      giant.moveTo(null, null);
    });
  }

  /** Tenka Fubu: the sky becomes a ceiling of hellfire; everyone kneels … */
  private tenkaCall(): void {
    const { f, g } = this;
    if (!this.sky) {
      this.skyLook = { ...SKY_HELL };
      this.sky = new SkyTint(g, this.skyLook, 1.0);
      g.addProjectile(this.sky);
    }
    this.infernoT = 6.5;
    for (const o of g.enemiesOf(f)) if (o.pos.distanceTo(f.pos) < 60) this.kneel(o, 1.5);
    this.say('天下布武', 'TENKA FUBU', HELL_CRIMSON);
    g.sfx.play('roarBig', f.center(), 1.6);
    g.shake(0.7);
  }

  /** … and burning meteors rain on everything within 60 m for four seconds */
  private tenkaRain(): void {
    const { f, g } = this;
    const foes = g.enemiesOf(f).filter((o) => o.pos.distanceTo(f.pos) < 60);
    for (let i = 0; i < 48; i++) {
      const at = new THREE.Vector3();
      const foe = foes.length && i % 2 === 0 ? foes[(i / 2) % foes.length] : null;
      if (foe) at.copy(foe.pos).add(_v.set((Math.random() - 0.5) * 8, 0, (Math.random() - 0.5) * 8));
      else {
        const a = Math.random() * Math.PI * 2, r = 6 + Math.sqrt(Math.random()) * 54;
        at.set(f.pos.x + Math.cos(a) * r, f.pos.y, f.pos.z + Math.sin(a) * r);
      }
      g.addProjectile(new HellMeteor(g, f, at, { delay: (i / 48) * 4, fall: 0.9, radius: 4, damage: 160, power: 1600, onHit: (o) => { this.ignite(o, 2, true); this.kneel(o, 1.5); } }));
    }
  }

  // ---------------------------------------------------------------- AI & HUD

  ai(): KitAI {
    const { f, g } = this;
    const is = (fm: Form) => () => this.form === fm;
    const hurt = () => {
      const t = this.target(60);
      return !!t && t.hp < t.maxHp * 0.75;
    };
    void g;
    return {
      reach: this.form === 'bankai' ? 2.9 : 2.3,
      chain: this.form === 'final' ? 6 : 5,
      releaseAt: [0.9, 0.7, 0.5],
      opener: () => this.skill2(),
      moves: [
        // sealed: the emperor's Kidō
        { name: 'haien', use: () => this.heavy(), min: 4, max: 45, weight: 1.4, cd: 3, when: is('sealed') },
        { name: 'shakka', use: () => this.skill1(), min: 3, max: 32, weight: 1.3, cd: 4, when: is('sealed') },
        { name: 'oi', use: () => this.skill2(), min: 0, max: 10, weight: 1.6, cd: 7, when: is('sealed') },
        { name: 'gochu', use: () => this.skill3(), min: 2, max: 35, weight: 1.5, cd: 8, when: is('sealed') },
        { name: 'throne', use: () => this.toggle(), min: 0, max: 18, weight: 1.1, cd: 16, when: is('sealed') },
        // Shikai
        { name: 'kokuen', use: () => this.heavy(), min: 2, max: 14, weight: 1.6, cd: 3.5, when: is('shikai') },
        { name: 'onibi', use: () => this.skill1(), min: 5, max: 45, weight: 1.3, cd: 7, when: is('shikai') },
        { name: 'kensaku', use: () => this.skill2(), min: 5, max: 30, weight: 1.4, cd: 6, when: is('shikai') },
        { name: 'goka', use: () => this.skill3(), min: 4, max: 45, weight: 1.4, cd: 8, when: is('shikai') },
        { name: 'hyakki', use: () => this.toggle(), min: 4, max: 40, weight: 1.3, cd: 13, when: is('shikai') },
        // Bankai
        { name: 'gates', use: () => this.heavy(), min: 3, max: 40, weight: 1.8, cd: 13, when: () => this.form === 'bankai' && hurt() },
        { name: 'chains', use: () => this.skill1(), min: 0, max: 24, weight: 1.4, cd: 11, when: is('bankai') },
        { name: 'grab', use: () => this.skill2(), min: 3, max: 35, weight: 1.4, cd: 10, when: is('bankai') },
        { name: 'hells', use: () => this.skill3(), min: 0, max: 20, weight: 2.2, cd: 19, when: () => this.form === 'bankai' && !this.hells },
        { name: 'daitenma', use: () => this.toggle(), min: 6, max: 65, weight: 1.4, cd: 17, when: is('bankai') },
        // final
        { name: 'cannon', use: () => this.heavy(), min: 6, max: 100, weight: 1.5, cd: 7, when: is('final') },
        { name: 'wheel', use: () => this.skill1(), min: 4, max: 50, weight: 1.3, cd: 8, when: () => this.form === 'final' && !this.wheelOut },
        { name: 'muken', use: () => this.skill2(), min: 2, max: 45, weight: 1.4, cd: 11, when: is('final') },
        { name: 'korin', use: () => this.skill3(), min: 3, max: 60, weight: 1.4, cd: 15, when: is('final') },
        { name: 'tenka', use: () => this.toggle(), min: 0, max: 60, weight: 2.4, cd: 25, when: is('final') },
      ],
      ranged: false,
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    const flare = { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare };
    const shunpo = { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 };
    switch (this.form) {
      case 'sealed':
        return [
          { key: 'LMB', name: 'Teiken', kanji: '帝剣' },
          { key: 'RMB', name: 'Haien', kanji: '廃炎', cost: 14, cd: cd.haien, cdMax: 2.4, tint: HELL_VIOLET },
          { key: 'Q', name: 'Shakkahō: Gorenpatsu', kanji: '赤火砲', cost: 18, cd: cd.shakka, cdMax: 3.5, tint: HELL_CRIMSON },
          { key: 'E', name: 'Ōi', kanji: '王威', cost: 16, cd: cd.oi, cdMax: 6, tint: HELL_GOLD },
          { key: 'R', name: 'Gochūtekkan', kanji: '五柱鉄貫', cost: 22, cd: cd.gochu, cdMax: 8, tint: '#C9C4D0' },
          shunpo,
          flare,
          { key: 'F', name: 'Hirefuse, Hajun', kanji: '波旬', cost: 20, tint: HELL_VIOLET },
          { key: 'G', name: 'Gyokuza', kanji: '玉座', cost: 40, cd: cd.throne, cdMax: 14, tint: HELL_GOLD },
        ];
      case 'shikai':
        return [
          { key: 'LMB', name: 'Gokuen-giri', kanji: '獄炎斬り', tint: HELL_VIOLET },
          { key: 'RMB', name: 'Kokuen', kanji: '黒炎', cost: 22, cd: cd.kokuen, cdMax: 3, tint: HELL_VIOLET },
          { key: 'Q', name: 'Onibi', kanji: '鬼火', cost: 26, cd: cd.onibi, cdMax: 6, tint: HELL_VIOLET },
          { key: 'E', name: 'Kensaku', kanji: '羂索', cost: 18, cd: cd.kensaku, cdMax: 5, tint: HELL_CRIMSON },
          { key: 'R', name: 'Gōka', kanji: '業火', cost: 28, cd: cd.goka, cdMax: 7, tint: HELL_VIOLET },
          shunpo,
          flare,
          { key: 'F', name: 'Bankai', kanji: '卍解', cost: 40, tint: HELL_CRIMSON },
          { key: 'G', name: 'Hyakki Yakō', kanji: '百鬼夜行', cost: 40, cd: cd.hyakki, cdMax: 12, tint: HELL_CRIMSON },
        ];
      case 'bankai':
        return [
          { key: 'LMB', name: 'Tenma-giri', kanji: '天魔斬り', tint: HELL_CRIMSON },
          { key: 'RMB', name: 'Jigoku no Mon', kanji: '地獄の門', cost: 40, cd: cd.gates, cdMax: 12, tint: HELL_CRIMSON },
          { key: 'Q', name: 'Gokusotsu no Kusari', kanji: '獄卒の鎖', cost: 34, cd: cd.chains, cdMax: 10, tint: HELL_CRIMSON },
          { key: 'E', name: 'Tenma no Te', kanji: '天魔の手', cost: 34, cd: cd.grab, cdMax: 9, tint: HELL_CRIMSON },
          { key: 'R', name: 'Hachinetsu Jigoku', kanji: '八熱地獄', cost: 50, cd: cd.hells, cdMax: 18, active: !!this.hells, tint: HELL_CRIMSON },
          shunpo,
          flare,
          { key: 'F', name: 'Tenka Fubu', kanji: '第六天魔王', cost: 60, tint: HELL_VIOLET },
          { key: 'G', name: 'Daitenma-giri', kanji: '大天魔斬り', cost: 60, cd: cd.daitenma, cdMax: 16, tint: HELL_CRIMSON },
        ];
      default:
        return [
          { key: 'LMB', name: 'Rokudō', kanji: '六道', tint: HELL_VIOLET },
          { key: 'RMB', name: 'Gokuen-hō', kanji: '獄炎砲', cost: 50, cd: cd.cannon, cdMax: 6, tint: HELL_CRIMSON },
          { key: 'Q', name: 'Kaen-rin', kanji: '火炎輪', cost: 36, cd: cd.wheel, cdMax: 7, active: this.wheelOut, tint: HELL_CRIMSON },
          { key: 'E', name: 'Muken', kanji: '無間', cost: 44, cd: cd.muken, cdMax: 10, tint: HELL_VIOLET },
          { key: 'R', name: 'Tenma Kōrin', kanji: '天魔降臨', cost: 60, cd: cd.korin, cdMax: 14, tint: HELL_VIOLET },
          { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
          flare,
          { key: 'F', name: 'Seal', kanji: '封' },
          { key: 'G', name: 'Tenka Fubu', kanji: '天下布武', cost: 80, cd: cd.tenka, cdMax: 24, tint: HELL_CRIMSON },
        ];
    }
  }
}
