// Suì-Fēng's kit (docs/roster/B1-captains-1.md §3, Kit proposal). Sealed: the fastest Shunpo in the
// roster and a string of reverse-grip punch-slashes and snapped kicks; RMB Kazaguruma (the windmill kick
// that sends the target flying); Q the speed clones (a flash round the target leaving copies that draw
// its eye, the last step behind it); E Takigoi (catch the next blow and answer it); R a binding Kidō;
// G Shunkō (the haori off, wind over the back and arms, every blow bursting). F: "Jinteki Shakusetsu,
// Suzumebachi" — the gauntlet and the stinger: each sting leaves the Hōmonka where it lands, and a second
// sting on a crest is Nigeki Kessatsu, death in two strikes (Q flashes to a crest and stings it; E stings
// three places at once). F again: Bankai, Jakuhō Raikōben — the launcher closes round the right arm, she
// can barely move; RMB / Q fire the missile (homing; the recoil throws her back unless E has tied her to
// the ground with the Ginjōtan); two missiles and it is over.
import * as THREE from 'three';
import { FighterAction, type Fighter, type FighterDef } from '../fighter';
import type { Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { MUZZLE, STINGER_TIP_Z, SWORD_TIP_Z, suifengAsset, suifengProp, type SuifengForm } from '../../chars/suifeng';
import { RAIKOBEN_STANCE, SHIKAI_STANCE, STING_CHAIN, SUIFENG_CHAIN, SUIFENG_CLIPS, SUIFENG_STANCE } from '../../chars/suifengClips';
import { Homonka, RaikobenMissile, crestDeath, windBurst, windShunko, type CrestRegion } from '../../vfx/suzumebachi';
import { Rikujokoro } from '../../vfx/rukiaArts';
import { MirrorDecoy } from '../../vfx/mirror';
import { ConeShape, SphereShape } from '../../destruction/shapes';
import { TEX_GLOW, TEX_PUFF } from '../../vfx/sprites';
import type { AuraStyle } from '../../vfx/aura';

export const AURA_SUIFENG: AuraStyle = { core: '#FFF4C8', body: '#F2C94C', rim: '#8A6A12' };
const AURA_SHUNKO: AuraStyle = { core: '#F4FAFF', body: '#A9CFEA', rim: '#4E7EA6' };

type BladeDef = NonNullable<FighterDef['blade']>;
const BLADE_SWORD: BladeDef = { prop: 'sword', base: [0, 0, 0.07], tip: [0, 0, SWORD_TIP_Z], color: '#F2C94C', core: '#FFF4C8' };
const BLADE_STING: BladeDef = { prop: 'sword', base: [0, 0, 0.08], tip: [0, 0, STINGER_TIP_Z], color: '#F2C94C', core: '#FFF4C8' };

const SPEED = { run: 11, sprint: 34, jump: 14, dash: 34, dashTime: 0.09 };
const BANKAI_TIME = 25;
const CREST_LIFE = 20;

export const SUIFENG_DEF: FighterDef = {
  id: 'suifeng',
  name: 'Suì-Fēng',
  title: 'Captain, 2nd Division',
  build: () => ({
    asset: suifengAsset('captain'),
    props: [{ key: 'sword', model: suifengProp('sword'), socket: 'grip.R' }, { key: 'sheath', model: suifengProp('sheath'), socket: 'waist.back' }],
  }),
  stance: SUIFENG_STANCE,
  clips: SUIFENG_CLIPS,
  aura: AURA_SUIFENG,
  blade: BLADE_SWORD,
  hp: 850,
  rei: 130,
  speed: { ...SPEED },
  radius: 0.34,
  height: 1.5,
};

type Form = 'sealed' | 'shikai' | 'bankai';

const _v = new THREE.Vector3();

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

interface Move {
  lunge: number;
  /** a blade window (reverse-grip slashes) */
  window?: [number, number];
  /** a strike at a point (kicks, stings): reach ahead, height (0..1 of the target) */
  strike?: { damage: number; knock: number; launch?: number; reach: number; at: string; region?: CrestRegion };
}

const MOVES: Record<string, Move> = {
  sf_strike: { lunge: 6, window: [0.07, 0.17] },
  sf_back: { lunge: 6, window: [0.07, 0.17] },
  sf_strike2: { lunge: 7, window: [0.07, 0.18] },
  sf_round: { lunge: 6, strike: { damage: 20, knock: 12, reach: 1.2, at: 'toe.R' } },
  sf_front: { lunge: 7, strike: { damage: 22, knock: 16, launch: 3, reach: 1.1, at: 'toe.L' } },
  sf_sting: { lunge: 7, strike: { damage: 14, knock: 3, reach: 1.15, at: 'knuckle.R', region: 'mid' } },
  sf_sting2: { lunge: 7, strike: { damage: 14, knock: 3, reach: 1.15, at: 'knuckle.R', region: 'high' } },
};

// ------------------------------------------------------------------ the strings

class StringAction extends FighterAction {
  readonly name: string;
  private info: Move;
  private dur = 0;
  private comboAt = 0;
  private hitAt = 0;
  private struck = false;
  queued = false;
  constructor(readonly kit: SuifengKit, readonly clip: string, readonly index: number) {
    super();
    this.name = clip;
    this.info = MOVES[clip] ?? { lunge: 5 };
    this.mobility = 0.2;
    this.airGravity = 0.15;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    this.hitAt = c.events.hit ?? this.dur * 0.3;
    f.bladeHits.clear();
    f.bladeSpec = this.info.window ? { damage: 15, knock: 6, launch: this.index === 1 ? 3 : 0, hitstop: 0.04, shake: 0.12, cut: 170 } : null;
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n !== 'step') return;
        const tgt = f.faceTarget;
        const extra = tgt ? Math.min(5, Math.max(0, f.pos.distanceTo(tgt) - 1.4)) : 0;
        f.push.addScaledVector(f.forward(), this.info.lunge + extra * 2.6);
        g.sfx.play('swing', f.center(), 0.7);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t, w = this.info.window;
    if (w) {
      f.bladeActive = t >= w[0] && t <= w[1];
      if (f.trail) f.trail.emitting = t >= w[0] - 0.02 && t <= w[1] + 0.05;
    }
    if (!this.struck && t >= this.hitAt) {
      this.struck = true;
      const s = this.info.strike;
      if (s) this.kit.strikeAt(s.at, s.reach, s.damage, s.knock, s.launch ?? 0, s.region);
      else if (this.kit.shunko) this.kit.gust(sock(f, 'knuckle.R'), 0.8);
    }
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

abstract class SkillAction extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: SuifengKit) {
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
    return next.name === 'dash' && this.t > this.dur * 0.6;
  }
}

/** RMB (sealed): Kazaguruma — the windmill kick. */
class KazagurumaAction extends SkillAction {
  readonly name = 'kazaguruma';
  constructor(kit: SuifengKit) {
    super(kit);
    this.mobility = 0.2;
    this.airGravity = 0.4;
    this.armor = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'sf_kazaguruma', (n) => {
      if (n === 'step') {
        f.push.addScaledVector(f.forward(), 7);
        if (f.grounded) f.push.y = 9;
        g.sfx.play('swingHeavy', f.center(), 1);
      }
      if (n === 'hit') {
        this.kit.strikeAt('toe.R', 1.3, 46, 34, 8);
        g.callout('風車', 'KAZAGURUMA', '#f2c94c');
      }
    });
  }
}

/** RMB (Shikai): the stinger lunge — a guaranteed crest. */
class LungeAction extends SkillAction {
  readonly name = 'lunge';
  constructor(kit: SuifengKit) {
    super(kit);
    this.mobility = 0.1;
    this.armor = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'sf_lunge', (n) => {
      if (n === 'step') f.push.addScaledVector(f.forward(), 18);
      if (n === 'hit') this.kit.strikeAt('knuckle.R', 1.6, 22, 6, 0, 'mid');
    });
  }
}

/** Q (sealed) / R (Shikai): the speed clones — a flash round the target, a copy left at every step. */
class ClonesAction extends FighterAction {
  readonly name = 'clones';
  private step = -1;
  private next = 0.18;
  private readonly n = 5;
  constructor(readonly kit: SuifengKit, readonly target: Fighter) {
    super();
    this.mobility = 0;
    this.airGravity = 0;
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('sf_clones', {});
    g.callout('', 'SPEED CLONES', '#f2c94c');
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const o = this.target;
    if (o.dead) {
      this.done = true;
      return;
    }
    if (this.t < this.next) return;
    this.step++;
    if (this.step > this.n) {
      this.done = true;
      return;
    }
    const last = this.step === this.n;
    const base = Math.atan2(f.pos.x - o.pos.x, f.pos.z - o.pos.z);
    // the last step: right behind the target
    const a = last ? o.yaw + Math.PI : base + (this.step % 2 ? 1 : -1) * (0.9 + this.step * 0.35);
    const r = last ? 1.3 : 3.2;
    if (!last) {
      const copy = new MirrorDecoy(g, f, 2.4, 'shell');
      g.addProjectile(copy);
      this.kit.lure(copy);
    }
    f.ghosts.spawn(1, 0.25);
    g.sfx.play('shunpo', f.center(), 0.6);
    f.body.pos.set(o.pos.x + Math.sin(a) * r, o.pos.y, o.pos.z + Math.cos(a) * r);
    f.body.prev.copy(f.body.pos);
    f.body.vel.set(0, 0, 0);
    f.yaw = Math.atan2(o.pos.x - f.body.pos.x, o.pos.z - f.body.pos.z);
    if (last) {
      // and the real one strikes
      this.invulnerable = false;
      f.anim.play(this.kit.form === 'shikai' ? 'sf_sting' : 'sf_strike2', {});
      this.kit.strikeAt('knuckle.R', 1.6, this.kit.form === 'shikai' ? 18 : 36, 10, 4, this.kit.form === 'shikai' ? 'mid' : undefined);
      this.next = this.t + 0.4;
    } else {
      f.anim.play(this.step % 2 ? 'sf_round' : 'sf_strike', { speed: 2 });
      this.next = this.t + 0.1;
    }
  }
}

/** E (sealed): Takigoi — catch the next blow and answer it. */
class TakigoiAction extends SkillAction {
  readonly name = 'takigoi';
  private caught: Fighter | null = null;
  constructor(kit: SuifengKit) {
    super(kit);
    this.mobility = 0;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'sf_takigoi', () => {});
    f.parry = (amount, from) => this.catchBlow(f, g, amount, from);
  }
  private catchBlow(f: Fighter, g: Game, _amount: number, from: Fighter | null): boolean {
    if (this.caught || this.t > 0.7 || !from || from.team === f.team || from.pos.distanceTo(f.pos) > 4.5) return false;
    this.caught = from;
    g.sfx.play('ting', f.center(), 1);
    g.callout('滝鯉', 'TAKIGOI', '#f2c94c');
    // the answer: inside the attacker's guard and a blow to the face
    const o = from;
    const toward = new THREE.Vector3().subVectors(o.pos, f.pos).setY(0).normalize();
    f.yaw = Math.atan2(toward.x, toward.z);
    f.anim.play('sf_strike2', {});
    g.damage(o, 52, f, toward.clone(), { knock: 18, launch: 6, heavy: true, hitstop: 0.14, shake: 0.5 });
    o.stopAction();
    if (this.kit.shunko) this.kit.gust(o.center(), 1.2);
    this.dur = this.t + 0.5;
    return true;
  }
  override end(f: Fighter): void {
    super.end(f);
    f.parry = null;
  }
}

/** R (sealed): a binding Kidō. */
class BindAction extends SkillAction {
  readonly name = 'bind';
  constructor(kit: SuifengKit, readonly target: Fighter) {
    super(kit);
    this.mobility = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'sf_bind', (n) => {
      if (n !== 'cast' || this.target.dead) return;
      g.addProjectile(new Rikujokoro(g, f, this.target, 2.2));
      g.callout('縛道', 'BAKUDŌ', '#fff2a6');
    });
  }
}

/** G: Shunkō — the wind bursts out (the haori goes), or settles again. */
class ShunkoAction extends SkillAction {
  readonly name = 'shunko';
  constructor(kit: SuifengKit) {
    super(kit);
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'sf_shunko', (n) => {
      if (n === 'burst') this.kit.setShunko(!this.kit.shunko);
    });
  }
}

/** F: "Jinteki Shakusetsu, Suzumebachi" — the blade glows and closes round the hand. */
class ReleaseAction extends SkillAction {
  readonly name = 'release';
  constructor(kit: SuifengKit) {
    super(kit);
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    g.callout('尽敵螫殺', 'JINTEKI SHAKUSETSU', '#f2c94c');
    this.playClip(f, 'sf_release', (n) => {
      if (n === 'glow') {
        const p = sock(f, 'grip.R');
        g.engine.glow.spawn({ x: p.x, y: p.y + 0.2, z: p.z, size: 1.2, sizeEnd: 0.2, life: 0.4, r: 1, g: 1, b: 0.95, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
      }
      if (n === 'form') this.kit.becomeShikai();
    });
  }
}

/** Q (Shikai): Nigeki Kessatsu — a flash to the target's crest and the second sting. */
class KessatsuAction extends SkillAction {
  readonly name = 'kessatsu';
  private struck = false;
  constructor(kit: SuifengKit, readonly target: Fighter, readonly region: CrestRegion) {
    super(kit);
    this.mobility = 0;
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    const o = this.target;
    // straight in front of the crest
    const fw = o.forward(_v);
    f.ghosts.spawn(1, 0.3);
    g.sfx.play('shunpo', f.center(), 0.9);
    f.body.pos.set(o.pos.x + fw.x * 1.3, o.pos.y, o.pos.z + fw.z * 1.3);
    f.body.prev.copy(f.body.pos);
    f.body.vel.set(0, 0, 0);
    f.yaw = Math.atan2(o.pos.x - f.body.pos.x, o.pos.z - f.body.pos.z);
    this.playClip(f, this.region === 'high' ? 'sf_sting2' : 'sf_sting', (n) => {
      if (n !== 'hit' || this.struck) return;
      this.struck = true;
      this.invulnerable = false;
      this.kit.sting(o, this.region, 18);
    }, 0.8);
  }
}

/** E (Shikai): three stings, three places, before the target can turn. */
class FlurryAction extends SkillAction {
  readonly name = 'flurry';
  private hits = 0;
  private readonly regions: CrestRegion[] = ['high', 'mid', 'low'];
  constructor(kit: SuifengKit, readonly target: Fighter) {
    super(kit);
    this.mobility = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    this.dur = 0.75;
    f.anim.play('sf_sting', { speed: 2.2 });
    g.sfx.play('swing', f.center(), 0.8);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const o = this.target;
    if (this.hits < 3 && this.t > 0.08 + this.hits * 0.18 && !o.dead) {
      if (o.pos.distanceTo(f.pos) < 2.6 + o.def.radius) this.kit.sting(o, this.regions[this.hits], 10);
      this.hits++;
      if (this.hits < 3) f.anim.play(this.hits % 2 ? 'sf_sting2' : 'sf_sting', { speed: 2.2 });
    }
  }
}

/** F again: Bankai — the pillar, and the launcher closes round the arm. */
class BankaiAction extends SkillAction {
  readonly name = 'release';
  constructor(kit: SuifengKit) {
    super(kit);
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    g.callout('卍解', 'BANKAI', '#ffe48a');
    this.playClip(f, 'sf_bankai', (n) => {
      if (n === 'pillar') {
        f.aura.pillarBurst(2);
        g.sfx.play('bankai', f.center(), 0.9);
      }
      if (n === 'form') this.kit.becomeBankai();
    });
  }
}

/** Bankai RMB / Q: the missile. */
class FireAction extends SkillAction {
  readonly name = 'fire';
  constructor(kit: SuifengKit, readonly target: Fighter | null) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'sf_fire', (n) => {
      if (n === 'fins') g.sfx.play('charge', f.center(), 0.8);
      if (n === 'fire') this.kit.launch(this.target);
    });
  }
}

/** Bankai LMB: a bash with the launcher. */
class BashAction extends SkillAction {
  readonly name = 'bash';
  constructor(kit: SuifengKit) {
    super(kit);
    this.mobility = 0.05;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'sf_bash', (n) => {
      if (n === 'step') f.push.addScaledVector(f.forward(), 4);
      if (n === 'hit') this.kit.strikeAt('grip.R', 1.6, 40, 16, 4);
    });
  }
}

// ------------------------------------------------------------------ the kit

export class SuifengKit implements Kit {
  form: Form = 'sealed';
  shunko = false;
  flare = false;
  comboIndex = 0;
  bankaiT = 0;
  missiles = 0;
  /** tied to the ground with the Ginjōtan: no recoil */
  anchored = false;
  private lastEnd = 0;
  private lureT = 0;
  private windAcc = 0;
  private crests = new Map<number, Homonka[]>();
  private anchorLine: THREE.Line | null = null;
  private anchorAt = new THREE.Vector3();
  readonly cd = { heavy: 0, clones: 0, takigoi: 0, bind: 0, shunko: 0, kessatsu: 0, flurry: 0, fire: 0, anchor: 0 };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
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
    if (this.lureT > 0) {
      this.lureT -= dt;
      if (this.lureT <= 0) f.lure = null;
    }
    if (this.shunko && !f.dead) {
      this.windAcc += dt;
      if (this.windAcc > 0.05) {
        this.windAcc = 0;
        windShunko(g, f, this.flare ? 1.6 : 1);
      }
    }
    // crests fade after a while; a bloomed one plays out
    for (const [id, list] of this.crests) {
      const kept = list.filter((c) => {
        const alive = c.update(dt);
        if (alive && g.time - c.born > CREST_LIFE) {
          c.dispose();
          return false;
        }
        return alive;
      });
      if (kept.length) this.crests.set(id, kept);
      else this.crests.delete(id);
    }
    if (this.form === 'bankai' && !f.dead) {
      this.bankaiT -= dt;
      if (this.anchorLine) this.updateAnchor();
      if ((this.bankaiT <= 0 || this.missiles <= 0) && !f.busy) this.endBankai();
    }
  }

  lure(copy: MirrorDecoy): void {
    this.f.lure = copy.pos;
    this.lureT = 1.6;
  }

  target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 80, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 80);
  }

  private near(range: number): Fighter | null {
    const t = this.target();
    return t && t.pos.distanceTo(this.f.pos) <= range ? t : null;
  }

  // ---------------------------------------------------------------- hits

  /** a point strike from a socket (a kick, a sting, a bash): whoever stands there is hit */
  strikeAt(at: string, reach: number, damage: number, knock: number, launch: number, region?: CrestRegion): void {
    const { f, g } = this;
    const fw = f.forward(_v).clone();
    const p = sock(f, at).addScaledVector(fw, 0.3);
    const ahead = f.pos.clone().addScaledVector(fw, reach * 0.8);
    for (const o of g.enemiesOf(f)) {
      const c = o.center();
      if (Math.min(c.distanceTo(p), Math.hypot(o.pos.x - ahead.x, o.pos.z - ahead.z)) > reach * 0.7 + o.def.radius) continue;
      if (Math.abs(c.y - p.y) > o.def.height * 0.7 + 0.4) continue;
      if (region && this.form === 'shikai') this.sting(o, region, damage);
      else {
        g.damage(o, damage * (this.shunko ? 1.3 : 1), f, fw.clone(), { knock: knock * (this.shunko ? 1.4 : 1), launch, heavy: launch > 3, hitstop: 0.05, shake: 0.18 });
        g.sparks(c, fw, '#f2c94c', 8);
      }
    }
    if (this.shunko) this.gust(p, launch > 3 ? 1.4 : 0.9);
  }

  /** a wind burst off a blow in Shunkō: it tears the wall ahead and shoves whoever is in it */
  gust(p: THREE.Vector3, k: number): void {
    const { f, g } = this;
    const fw = f.forward(_v).clone();
    windBurst(g, p, fw, k);
    g.engine.destruction.carve(new ConeShape(p.clone(), fw, 0.7 * k, 3.4 * k), { mode: 'smash', power: 160 * k, impulse: 12, dust: 0.5 });
    for (const o of g.enemiesOf(f)) {
      const d = o.center().distanceTo(p);
      if (d > 3 * k || _v.subVectors(o.pos, f.pos).dot(fw) < 0) continue;
      g.damage(o, 8 * k, f, fw.clone(), { knock: 10 * k, quiet: true });
    }
  }

  /** a sting lands on `o` in `region`: a crest, or — on an existing crest — Nigeki Kessatsu */
  sting(o: Fighter, region: CrestRegion, damage: number): void {
    const { f, g } = this;
    const list = this.crests.get(o.id) ?? [];
    const crest = list.find((c) => c.region === region);
    const dir = new THREE.Vector3().subVectors(o.pos, f.pos).setY(0).normalize();
    if (crest) {
      // death in two strikes: the crest blooms and the body comes apart round it
      crest.bloom();
      const p = o.center();
      g.callout('弐撃決殺', 'NIGEKI KESSATSU', '#b48cff');
      crestDeath(g, p);
      const amount = o.def.boss ? 320 : o.maxHp * 0.32 + 90;
      g.damage(o, amount, f, dir, { knock: 6, launch: 3, heavy: true, hitstop: 0.2, shake: 0.7, color: '#141418' });
      g.slowMo(0.3, 0.35);
      return;
    }
    g.damage(o, damage * (this.shunko ? 1.2 : 1), f, dir, { knock: 3, hitstop: 0.05, shake: 0.15, color: '#141418' });
    if (o.dead) return;
    if (list.length >= 3) list.shift()?.dispose();
    list.push(new Homonka(o, region, g.time));
    this.crests.set(o.id, list);
    g.sfx.play('hit', o.center(), 0.6);
  }

  crestsOn(o: Fighter): CrestRegion[] {
    return (this.crests.get(o.id) ?? []).map((c) => c.region);
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
      if (!f.busy) this.special(new BashAction(this), 0, 'heavy', 0.4);
      return;
    }
    const cur = f.action;
    if (cur instanceof StringAction) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastEnd > 0.7) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const list = this.form === 'shikai' ? STING_CHAIN : SUIFENG_CHAIN;
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    this.lastEnd = this.g.time + 0.7;
    this.f.act(new StringAction(this, list[idx], idx), true);
  }

  /** RMB: Kazaguruma / the stinger lunge / the missile. */
  heavy(): void {
    if (this.form === 'bankai') this.fireMissile();
    else if (this.form === 'shikai') this.special(new LungeAction(this), 8, 'heavy', 2);
    else this.special(new KazagurumaAction(this), 8, 'heavy', 2.4);
  }

  /** Q: the speed clones / Nigeki Kessatsu / the missile. */
  skill1(): void {
    if (this.form === 'bankai') {
      this.fireMissile();
      return;
    }
    const t = this.near(20);
    if (!t) return;
    if (this.form === 'shikai') {
      const r = this.crestsOn(t);
      if (r.length) this.special(new KessatsuAction(this, t, r[0]), 20, 'kessatsu', 3);
      else if (this.f === this.g.player) this.g.hud?.showBanner('No crest on the target yet');
    } else this.special(new ClonesAction(this, t), 18, 'clones', 7);
  }

  /** E: Takigoi / the crest flurry / the anchor. */
  skill2(): void {
    if (this.form === 'bankai') {
      this.special(new AnchorAction(this), 0, 'anchor', 1);
      return;
    }
    if (this.form === 'shikai') {
      const t = this.near(3.2);
      if (t) this.special(new FlurryAction(this, t), 16, 'flurry', 5);
    } else this.special(new TakigoiAction(this), 6, 'takigoi', 3);
  }

  /** R: the binding Kidō / the speed clones. */
  skill3(): void {
    if (this.form === 'bankai') return;
    const t = this.near(this.form === 'shikai' ? 20 : 22);
    if (!t) return;
    if (this.form === 'shikai') this.special(new ClonesAction(this, t), 18, 'clones', 7);
    else this.special(new BindAction(this, t), 16, 'bind', 9);
  }

  /** G: Shunkō. */
  toggle(): void {
    if (this.form === 'bankai') return;
    this.special(new ShunkoAction(this), this.shunko ? 0 : 20, 'shunko', 2);
  }

  release(): void {
    const f = this.f;
    if (this.form === 'bankai' || f.busy) return;
    if (!f.spendRei(this.form === 'sealed' ? 20 : 60)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(this.form === 'sealed' ? new ReleaseAction(this) : new BankaiAction(this), true);
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

  private fireMissile(): void {
    if (this.missiles <= 0) return;
    const t = this.target();
    if (this.special(new FireAction(this, t), 0, 'fire', 1.6)) this.missiles--;
  }

  // ---------------------------------------------------------------- forms

  private body(form: SuifengForm, props: { key: string; model: ReturnType<typeof suifengProp>; socket: string }[], aura: AuraStyle, blade: BladeDef): void {
    const f = this.f;
    f.setForm({ asset: suifengAsset(form), props }, aura, blade);
    this.hands();
  }

  private props(): { key: string; model: ReturnType<typeof suifengProp>; socket: string }[] {
    if (this.form === 'bankai') return [{ key: 'sword', model: suifengProp('launcher'), socket: 'arm.R' }, { key: 'guard', model: suifengProp('guard'), socket: 'face' }];
    if (this.form === 'shikai') return [{ key: 'sword', model: suifengProp('gauntlet'), socket: 'arm.R' }];
    return [{ key: 'sword', model: suifengProp('sword'), socket: 'grip.R' }, { key: 'sheath', model: suifengProp('sheath'), socket: 'waist.back' }];
  }

  private blade(): BladeDef {
    return this.form === 'shikai' ? BLADE_STING : BLADE_SWORD;
  }

  setShunko(on: boolean): void {
    const { f, g } = this;
    this.shunko = on;
    this.body(on || this.form === 'bankai' ? 'keisen' : 'captain', this.props(), on ? AURA_SHUNKO : AURA_SUIFENG, this.blade());
    if (on) {
      const c = f.center();
      // the haori torn away on the wind
      for (let i = 0; i < 24; i++) g.engine.dust.spawn({ x: c.x, y: c.y + 0.3, z: c.z, vx: (Math.random() - 0.5) * 9, vy: 1 + Math.random() * 4, vz: (Math.random() - 0.5) * 9, size: 0.2, sizeEnd: 0.1, life: 1.2, r: 0.95, g: 0.95, b: 0.93, alpha: 0.9, alphaEnd: 0, tex: TEX_PUFF, gravity: -6, drag: 1 });
      windBurst(g, c, f.forward(_v).clone(), 2);
      g.addRing(f.pos.clone().setY(f.pos.y + 0.05), 9, '#a9cfea', 0.4);
      g.callout('瞬閧', 'SHUNKŌ', '#a9cfea');
      g.sfx.play('flare', c, 1);
      g.shake(f === g.player ? 0.4 : 0.15);
    }
    this.applyStats();
  }

  becomeShikai(): void {
    const { f, g } = this;
    if (this.form !== 'sealed') return;
    this.form = 'shikai';
    f.def = { ...f.def, stance: SHIKAI_STANCE, blade: BLADE_STING };
    f.anim.loco.stance = SHIKAI_STANCE;
    f.visual.attach('sword', suifengProp('gauntlet'), 'arm.R');
    f.visual.detach('sheath');
    f.trail?.setColor(BLADE_STING.color, BLADE_STING.core);
    f.bladeValid = false;
    f.aura.flare(1.6, 0.5);
    g.callout('雀蜂', 'SUZUMEBACHI', '#f2c94c');
    g.sfx.play('flare', f.center(), 0.8);
    this.applyStats();
  }

  becomeBankai(): void {
    const { f, g } = this;
    if (this.form !== 'shikai') return;
    this.form = 'bankai';
    this.bankaiT = BANKAI_TIME;
    this.missiles = 2;
    f.def = { ...f.def, stance: RAIKOBEN_STANCE };
    this.body('keisen', this.props(), AURA_SUIFENG, BLADE_SWORD);
    f.anim.loco.stance = RAIKOBEN_STANCE;
    g.callout('雀蜂雷公鞭', 'JAKUHŌ RAIKŌBEN', '#ffe48a');
    g.shake(f === g.player ? 0.5 : 0.2);
    g.addRing(f.pos.clone().setY(f.pos.y + 0.05), 12, '#ffe48a', 0.5);
    this.applyStats();
  }

  private endBankai(): void {
    const { f } = this;
    this.form = 'shikai';
    this.missiles = 0;
    this.dropAnchor();
    f.def = { ...f.def, stance: SHIKAI_STANCE, blade: BLADE_STING };
    this.body(this.shunko ? 'keisen' : 'captain', this.props(), this.shunko ? AURA_SHUNKO : AURA_SUIFENG, BLADE_STING);
    f.anim.loco.stance = SHIKAI_STANCE;
    if (f === this.g.player) this.g.hud?.showBanner('The launcher dissolves');
    this.applyStats();
  }

  /** the missile leaves the muzzle; the recoil throws her back unless she is tied down */
  launch(target: Fighter | null): void {
    const { f, g } = this;
    const s = f.visual.props.get('sword');
    const fw = f.forward(_v).clone();
    const from = f.center().addScaledVector(fw, 1.8);
    from.y += 0.3;
    if (s) {
      // out of the muzzle
      s.updateWorldMatrix(true, false);
      from.set(MUZZLE[0], MUZZLE[1], MUZZLE[2] + 0.3).applyMatrix4(s.matrixWorld);
    }
    const dir = target ? new THREE.Vector3().subVectors(target.center(), from).normalize() : fw.clone();
    dir.y = Math.max(dir.y, 0.05);
    g.addProjectile(new RaikobenMissile(g, f, suifengProp('missile'), from, dir.normalize(), target, { damage: 280, radius: 8, power: 1300 }));
    g.sfx.play('explode', from, 0.8);
    g.shake(f === g.player ? 0.7 : 0.25);
    // the back-blast
    for (let i = 0; i < 20; i++) g.engine.dust.spawn({ x: from.x - fw.x * 3, y: from.y, z: from.z - fw.z * 3, vx: -fw.x * 8 + (Math.random() - 0.5) * 4, vy: Math.random() * 2, vz: -fw.z * 8 + (Math.random() - 0.5) * 4, size: 0.8, sizeEnd: 2.6, life: 1.2, r: 0.62, g: 0.6, b: 0.58, alpha: 0.6, alphaEnd: 0, tex: TEX_PUFF, drag: 1.5 });
    if (!this.anchored) {
      f.push.addScaledVector(fw, -26);
      f.push.y = 5;
      f.hp = Math.max(1, f.hp - f.maxHp * 0.05);
    } else if (this.anchorLine && Math.random() < 0.3) {
      // it held — barely
      g.sfx.play('crack', f.center(), 0.8);
    }
  }

  /** E (Bankai): the Ginjōtan — the steel sash tied from her waist to the ground behind her */
  anchor(): void {
    const { f, g } = this;
    this.dropAnchor();
    const back = f.forward(_v).clone().multiplyScalar(-4);
    this.anchorAt.set(f.pos.x + back.x, f.pos.y, f.pos.z + back.z);
    const geo = new THREE.BufferGeometry().setFromPoints([f.center(), this.anchorAt]);
    this.anchorLine = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#BFC4CB' }));
    this.anchorLine.frustumCulled = false;
    g.engine.gr.scene.add(this.anchorLine);
    this.anchored = true;
    g.engine.destruction.carve(new SphereShape(this.anchorAt.clone(), 0.5), { mode: 'smash', power: 60, impulse: 2 });
    g.callout('銀条反', 'GINJŌTAN', '#bfc4cb');
    g.sfx.play('ting', this.anchorAt, 1);
  }

  private updateAnchor(): void {
    const line = this.anchorLine!;
    const pos = line.geometry.getAttribute('position') as THREE.BufferAttribute;
    const c = this.f.center();
    pos.setXYZ(0, c.x, c.y - 0.2, c.z);
    pos.needsUpdate = true;
    // walk too far and it snaps
    if (this.f.pos.distanceTo(this.anchorAt) > 7) this.dropAnchor();
  }

  private dropAnchor(): void {
    if (this.anchorLine) {
      this.anchorLine.removeFromParent();
      this.anchorLine.geometry.dispose();
      (this.anchorLine.material as THREE.Material).dispose();
      this.anchorLine = null;
    }
    this.anchored = false;
  }

  private applyStats(): void {
    const f = this.f;
    const fm = this.form;
    const slow = fm === 'bankai' ? 0.35 : 1;
    const sh = this.shunko ? 1.15 : 1;
    f.def = { ...f.def, speed: { run: SPEED.run * slow * sh, sprint: SPEED.sprint * slow * sh, jump: SPEED.jump * (fm === 'bankai' ? 0.6 : 1), dash: SPEED.dash * (fm === 'bankai' ? 0.4 : sh), dashTime: SPEED.dashTime } };
    f.power = (fm === 'bankai' ? 1.2 : fm === 'shikai' ? 1.15 : 1) * (this.shunko ? 1.25 : 1) * (this.flare ? 1.25 : 1);
    f.damageTaken = this.shunko ? 0.85 : 1;
    f.aura.target = this.flare ? 1 : this.shunko ? 0.55 : fm === 'bankai' ? 0.3 : 0.12;
  }

  formName(): string {
    const sh = this.shunko ? ' · Shunkō' : '';
    if (this.form === 'bankai') return `Bankai — Jakuhō Raikōben · ${this.missiles} missile${this.missiles === 1 ? '' : 's'}${this.anchored ? ' · anchored' : ''}`;
    if (this.form === 'shikai') return `Shikai — Suzumebachi${sh}`;
    return `Onmitsukidō${sh}`;
  }

  ai(): KitAI {
    const sealed = () => this.form === 'sealed', shikai = () => this.form === 'shikai', bankai = () => this.form === 'bankai';
    const crested = () => {
      const t = this.target();
      return !!t && this.crestsOn(t).length > 0;
    };
    return {
      reach: 1.5,
      chain: 5,
      releaseAt: [0.85, 0.3],
      toggleAt: 0.6,
      toggleOn: () => this.shunko,
      ranged: () => this.form === 'bankai',
      moves: [
        { name: 'kazaguruma', use: () => this.heavy(), min: 0, max: 2.8, weight: 1.2, cd: 3, when: sealed },
        { name: 'clones', use: () => this.skill1(), min: 2, max: 14, weight: 1.2, cd: 8, when: sealed },
        { name: 'takigoi', use: () => this.skill2(), min: 0, max: 3, weight: 0.8, cd: 5, when: sealed },
        { name: 'bind', use: () => this.skill3(), min: 3, max: 18, weight: 0.9, cd: 10, when: sealed },
        { name: 'lunge', use: () => this.heavy(), min: 2, max: 8, weight: 1.3, cd: 2.5, when: shikai },
        { name: 'kessatsu', use: () => this.skill1(), min: 0, max: 18, weight: 3, cd: 3, when: () => shikai() && crested() },
        { name: 'flurry', use: () => this.skill2(), min: 0, max: 3, weight: 1.4, cd: 5, when: shikai },
        { name: 'clones2', use: () => this.skill3(), min: 2, max: 14, weight: 0.8, cd: 8, when: shikai },
        { name: 'anchor', use: () => this.skill2(), min: 0, max: 200, weight: 2, cd: 4, when: () => bankai() && !this.anchored },
        { name: 'missile', use: () => this.heavy(), min: 8, max: 120, weight: 2.5, cd: 3, when: () => bankai() && this.anchored },
        { name: 'bash', use: () => this.attack(), min: 0, max: 2.2, weight: 1, cd: 1, when: bankai },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const fm = this.form, cd = this.cd;
    const list: AbilityInfo[] = [];
    if (fm === 'sealed') {
      list.push(
        { key: 'LMB', name: 'Onmitsukidō', kanji: '隠密' },
        { key: 'RMB', name: 'Kazaguruma', kanji: '風車', cost: 8, cd: cd.heavy, cdMax: 2.4 },
        { key: 'Q', name: 'Speed clones', kanji: '分身', cost: 18, cd: cd.clones, cdMax: 7 },
        { key: 'E', name: 'Takigoi', kanji: '滝鯉', cost: 6, cd: cd.takigoi, cdMax: 3 },
        { key: 'R', name: 'Bakudō', kanji: '縛道', cost: 16, cd: cd.bind, cdMax: 9 },
      );
    } else if (fm === 'shikai') {
      list.push(
        { key: 'LMB', name: 'Suzumebachi', kanji: '雀蜂' },
        { key: 'RMB', name: 'Stinger lunge', kanji: '螫', cost: 8, cd: cd.heavy, cdMax: 2 },
        { key: 'Q', name: 'Nigeki Kessatsu', kanji: '弐撃決殺', cost: 20, cd: cd.kessatsu, cdMax: 3, tint: '#b48cff' },
        { key: 'E', name: 'Crest flurry', kanji: '蜂紋華', cost: 16, cd: cd.flurry, cdMax: 5 },
        { key: 'R', name: 'Speed clones', kanji: '分身', cost: 18, cd: cd.clones, cdMax: 7 },
      );
    } else {
      list.push(
        { key: 'LMB', name: 'Launcher bash', kanji: '打' },
        { key: 'RMB', name: `Missile ×${this.missiles}`, kanji: '雷公鞭', cd: cd.fire, cdMax: 1.6, active: this.missiles > 0, tint: '#ffe48a' },
        { key: 'Q', name: `Missile ×${this.missiles}`, kanji: '雷公鞭', cd: cd.fire, cdMax: 1.6, active: this.missiles > 0, tint: '#ffe48a' },
        { key: 'E', name: this.anchored ? 'Anchored' : 'Ginjōtan', kanji: '銀条反', active: this.anchored },
      );
    }
    if (fm !== 'bankai') list.push({ key: 'G', name: 'Shunkō', kanji: '瞬閧', cost: this.shunko ? 0 : 20, active: this.shunko, tint: '#a9cfea' });
    list.push(
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 3 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      fm === 'bankai'
        ? { key: 'F', name: 'Jakuhō Raikōben', kanji: '卍解', active: true, timer: this.bankaiT / BANKAI_TIME, tint: '#ffe48a' }
        : { key: 'F', name: fm === 'sealed' ? 'Suzumebachi' : 'Bankai', kanji: fm === 'sealed' ? '尽敵螫殺' : '卍解', cost: fm === 'sealed' ? 20 : 60, tint: '#f2c94c' },
    );
    return list;
  }
}

/** E (Bankai): tie the Ginjōtan. */
class AnchorAction extends FighterAction {
  readonly name = 'anchor';
  constructor(readonly kit: SuifengKit) {
    super();
    this.mobility = 0;
  }
  override start(_f: Fighter, _g: Game): void {
    this.kit.anchor();
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t > 0.3) this.done = true;
  }
}

