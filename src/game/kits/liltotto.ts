// Liltotto Lamperd's kit (docs/kits/liltotto.md). She eats the map. LMB the cleanest string of the Bambies (palm,
// knee, a low sweep, a lunging chomp that takes a bite out of whatever it reaches); RMB the Arterie haymaker (Blut
// Arterie's red veins down the arm, a punch that craters); Q The Glutton (the maw lunges out and erases everything in
// its jaws; a body caught is bitten and held, a weak one eaten whole); E Swallow (the maw held open: shots and beams
// that reach it are eaten); R the bow out of the heart case (three toothed shots that bite balls out of what they hit);
// G Feast (the maw kept open as she walks, eating a tunnel through whatever is in her way). F: Quincy: Vollständig —
// Gagael (wings of golden fangs, flight): RMB a maw big enough to take a floor out of a building, Q Spork, E Spife,
// R Golden Crunch (friend or foe), G Sklaverei, F Full Course (a house-sized maw closing over the target; a weak one is
// swallowed whole). Hunger climbs all the time: the hungrier she is, the harder she bites; eating feeds her.
import * as THREE from 'three';
import { FighterAction, type Fighter, type FighterDef, type PropDef } from '../fighter';
import type { Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import type { AuraStyle } from '../../vfx/aura';
import { MAW_LEN, liltottoAsset, liltottoProp } from '../../chars/liltotto';
import { LILTOTTO_CHAIN, LILTOTTO_CLIPS, LILTOTTO_STANCE } from '../../chars/liltottoClips';
import { BiteArrow, GOLD, GluttonMaw, GoldenCrunch, SpifeWhip, SporkTrap, arterie } from '../../vfx/glutton';
import { LightPillar, sklaverei } from '../../vfx/heilig';
import { SphereShape } from '../../destruction/shapes';
import { hirenkyakuPuff, hirenkyakuStreak, vollFlight, type Rgb } from './sternritter';

export const AURA_GLUTTON: AuraStyle = { core: '#FFF0A6', body: '#FFC83A', rim: '#B8740E' };
export const AURA_GAGAEL: AuraStyle = { core: '#FFF6D0', body: '#FFD45A', rim: '#E59A1E' };

const SPEED = { run: 10, sprint: 28, jump: 13.5, dash: 30, dashTime: 0.1 };
const SPEED_GAGAEL = { run: 12.5, sprint: 36, jump: 14, dash: 38, dashTime: 0.1 };
const GAGAEL_TIME = 36;
const GAGAEL_CD = 20;
const TINT: Rgb = [1, 0.8, 0.3];
/** how everyone tastes */
const FLAVOURS = ['Bland.', 'Tastes awful.', 'Spicy.', 'Not bad.', 'Disgusting.', 'Too chewy.', 'Needs salt.'];

export const LILTOTTO_DEF: FighterDef = {
  id: 'liltotto',
  name: 'Liltotto Lamperd',
  title: 'Sternritter "G" — The Glutton',
  build: () => ({ asset: liltottoAsset('base'), props: [{ key: 'candy', model: liltottoProp('candy'), socket: 'candy' }] }),
  stance: LILTOTTO_STANCE,
  clips: LILTOTTO_CLIPS,
  aura: AURA_GLUTTON,
  hp: 1100,
  rei: 220,
  speed: { ...SPEED },
  radius: 0.26,
  height: 1.49,
};

const _v = new THREE.Vector3();

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

// ---------------------------------------------------------------------------------------------- actions

/** A blow of the string: the clip, an approach dash, the events to the kit. */
class StrikeAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private hitAt = -1;
  private stopAt = 0;
  queued = false;

  constructor(readonly kit: LiltottoKit, readonly clip: string, readonly index: number, readonly onEvent: (n: string) => void, readonly tick?: (t: number) => void) {
    super();
    this.name = clip;
    this.mobility = 0.16;
    this.airGravity = 0.2;
  }

  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.62;
    this.hitAt = c.events.hit ?? -1;
    const tgt = f.faceTarget;
    let dashed = false;
    if (tgt && this.hitAt > 0) {
      const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
      this.stopAt = 1.2;
      if (d > this.stopAt + 0.25 && d < 8) {
        const tau = Math.max(0.06, this.hitAt - 0.06);
        const per = (1 - Math.exp(-f.pushDrag * tau)) / f.pushDrag;
        f.push.addScaledVector(f.forward(), Math.min(30, (d - this.stopAt) / per));
        dashed = true;
      }
    }
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n === 'step') {
          if (!dashed) f.push.addScaledVector(f.forward(), 3);
          g.sfx.play('swing', f.center(), 0.7);
        }
        this.onEvent(n);
      },
    });
  }

  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const tgt = f.faceTarget;
    if (this.stopAt > 0 && tgt && Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z) <= this.stopAt) {
      f.push.x = 0;
      f.push.z = 0;
      this.stopAt = 0;
    }
    this.tick?.(this.t);
    if (this.queued && this.t >= this.comboAt) {
      this.done = true;
      this.kit.chain(this.index + 1);
      return;
    }
    if (this.t >= this.dur) this.done = true;
  }

  override end(): void {
    this.kit.shutMaw();
  }

  override canCancel(next: FighterAction): boolean {
    if (next.name === 'dash' || next instanceof ClipSkill) return this.t >= this.hitAt + 0.05;
    return false;
  }
}

interface SkillOpts {
  armor?: number;
  mobility?: number;
  invulnerable?: boolean;
  tick?: (t: number, dt: number) => void;
  end?: () => void;
  dur?: number;
  /** a forward lunge on start (m/s) */
  lunge?: number;
}

/** a frame's worth of a quarter-second retraction */
const dt4 = (reach: number): number => reach / 15;

/** One clip, its events to a callback, done when it ends. */
class ClipSkill extends FighterAction {
  private dur = 1;
  constructor(readonly name: string, readonly clip: string, private on: (n: string) => void, private o: SkillOpts = {}) {
    super();
    this.armor = o.armor ?? 0;
    this.mobility = o.mobility ?? 0.1;
    this.invulnerable = !!o.invulnerable;
    this.airGravity = 0.1;
  }
  override start(f: Fighter): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = this.o.dur ?? c.dur - c.fadeOut * 0.5;
    if (this.o.lunge) f.push.addScaledVector(f.forward(), this.o.lunge);
    f.anim.play(this.clip, { onEvent: this.on });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    this.o.tick?.(this.t, dt);
    if (this.t >= this.dur) this.done = true;
  }
  override end(): void {
    this.o.end?.();
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' ? this.t > this.dur * 0.6 : next instanceof ClipSkill && this.t > this.dur * 0.7;
  }
}

/** Feast: the maw held open as she walks, eating whatever is ahead every fifth of a second. */
class FeastAction extends FighterAction {
  readonly name = 'feast';
  private next = 0;
  stop = false;
  constructor(readonly kit: LiltottoKit) {
    super();
    this.mobility = 0.4;
    this.armor = 0.2;
    this.airGravity = 0.6;
  }
  override start(f: Fighter): void {
    f.anim.play('lt_feast', { fadeIn: 0.12 });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    f.rei -= dt * 5;
    this.kit.feastTick(Math.min(1, this.t / 0.2));
    this.next -= dt;
    if (this.next <= 0 && this.t > 0.2) {
      this.next = 0.2;
      this.kit.feastBite();
    }
    if (this.stop || f.rei <= 1) this.done = true;
  }
  override end(f: Fighter): void {
    f.anim.stopAll(0.2);
    this.kit.shutMaw();
  }
  override canCancel(): boolean {
    return true;
  }
}

// ---------------------------------------------------------------------------------------------- the kit

type Form = 'base' | 'gagael';

export class LiltottoKit implements Kit {
  form: Form = 'base';
  flare = false;
  comboIndex = 0;
  private lastEnd = 0;
  hunger = 40;
  gagaelT = 0;
  gagaelCd = 0;
  sklav = false;
  readonly maw: GluttonMaw;
  private feast: FeastAction | null = null;
  private wasDashing = false;
  private lastFlavour = -99;
  private snapT = 0;
  readonly cd = { haymaker: 0, bite: 0, swallow: 0, bow: 0, spork: 0, spife: 0, crunch: 0, sklav: 0, full: 0 };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.data.quincy = true;
    this.maw = new GluttonMaw(g, f);
    g.addProjectile(this.maw);
    this.hands();
    this.applyStats();
  }

  private hands(): void {
    const rig = this.f.visual.rig;
    rig.setBoneVisible('fist.R', false);
    rig.setBoneVisible('palm.R', true);
    rig.setBoneVisible('fist.L', !!this.f.visual.props.get('bow'));
    rig.setBoneVisible('palm.L', !this.f.visual.props.get('bow'));
  }

  private props(): PropDef[] {
    if (this.form === 'gagael') return [{ key: 'halo', model: liltottoProp('halo'), socket: 'halo' }];
    return [{ key: 'candy', model: liltottoProp('candy'), socket: 'candy' }];
  }

  /** the hungrier she is, the harder she bites */
  private get biteK(): number {
    return 1 + this.hunger / 150;
  }

  /** something eaten: less hungry, a little mended */
  eat(n: number): void {
    const f = this.f;
    this.hunger = Math.max(0, this.hunger - n);
    f.hp = Math.min(f.maxHp, f.hp + n * 0.8);
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    this.gagaelCd = Math.max(0, this.gagaelCd - dt);
    this.hunger = Math.min(100, this.hunger + dt * 1.2);
    // the candy goes when the maw comes out
    const candy = f.visual.props.get('candy');
    if (candy) candy.visible = this.maw.open < 0.05;
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
      // the growl: dust and loose bits drift into her mouth
      if (Math.random() < 0.5) {
        const m = sock(f, 'mouth');
        const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 3;
        const p = _v.set(f.pos.x + Math.cos(a) * r, f.pos.y + 0.2 + Math.random() * 1.5, f.pos.z + Math.sin(a) * r);
        const life = 0.6;
        g.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, vx: (m.x - p.x) / life, vy: (m.y - p.y) / life, vz: (m.z - p.z) / life, size: 0.18, sizeEnd: 0.05, life, r: 0.55, g: 0.5, b: 0.44, alpha: 0.6, alphaEnd: 0.1, tex: 0 });
      }
    }
    const dashing = f.dashT > 0;
    if (dashing && !this.wasDashing) hirenkyakuPuff(g, f, TINT);
    if (dashing) hirenkyakuStreak(g, f, TINT);
    this.wasDashing = dashing;
    if (this.form === 'gagael') {
      this.gagaelT -= dt;
      vollFlight(g, f, this.target(), 2);
      // Sklaverei's jaw wings snap at whoever comes close
      if (this.sklav && (this.snapT -= dt) <= 0) {
        const t = this.near(2.6);
        if (t) {
          this.snapT = 0.8;
          g.damage(t, 12, f, t.pos.clone().sub(f.pos).setY(0).normalize(), { energy: true, knock: 4, color: GOLD });
          g.sfx.play('crumble', t.center(), 0.5);
        }
      }
      if (this.gagaelT <= 0) this.leaveGagael();
    }
  }

  target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 90, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 90);
  }

  private near(range: number): Fighter | null {
    const t = this.target();
    return t && t.pos.distanceTo(this.f.pos) <= range ? t : null;
  }

  private aimAt(from: THREE.Vector3): THREE.Vector3 {
    const t = this.target();
    if (t) return t.center().sub(from).normalize();
    return this.f.forward(new THREE.Vector3());
  }

  shutMaw(): void {
    this.maw.open = 0;
    this.maw.reach = 0;
    this.maw.aim = null;
  }

  /** a mouthful of someone: the taste remarked on now and then */
  private taste(e: Fighter): void {
    const g = this.g;
    if (g.time - this.lastFlavour < 6) return;
    this.lastFlavour = g.time;
    let h = 0;
    for (const ch of e.name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    g.callout('', FLAVOURS[h % FLAVOURS.length], GOLD);
  }

  /** the jaws shut on what they hold: bitten (and held), a weak one eaten whole */
  private chew(bodies: Fighter[], dmg: number, hold: number, heavy: boolean): void {
    const { f, g } = this;
    for (const e of bodies) {
      if (e.team === f.team) continue;
      if (e.maxHp <= 300 && e.hp <= 300) {
        // eaten whole
        g.kill(e, f, f.forward());
        this.eat(30);
        continue;
      }
      g.damage(e, dmg * this.biteK, f, f.forward(), { knock: heavy ? 8 : 3, heavy, hitstop: heavy ? 0.12 : 0.06, shake: heavy ? 0.4 : 0.15, color: '#C4475A' });
      if (hold > 0) {
        e.hitstun = Math.max(e.hitstun, hold);
        e.slow(0.9, hold);
      }
      this.eat(heavy ? 14 : 5);
      this.taste(e);
    }
  }

  // ---------------------------------------------------------------- the string

  /** a blow of hand, knee or foot: the nearest enemy in front within reach */
  private strike(range: number, dmg: number, o: { knock?: number; launch?: number; heavy?: boolean; trip?: boolean } = {}): Fighter | null {
    const { f, g } = this;
    const fw = f.forward();
    let best: Fighter | null = null, bd = Infinity;
    for (const e of g.enemiesOf(f)) {
      if (e.dead) continue;
      _v.subVectors(e.pos, f.pos).setY(0);
      const d = _v.length();
      if (d > range + e.def.radius || (d > 0.3 && _v.normalize().dot(fw) < 0.35) || Math.abs(e.pos.y - f.pos.y) > 1.8) continue;
      if (d < bd) { bd = d; best = e; }
    }
    if (!best) return null;
    g.damage(best, dmg, f, fw, { knock: o.knock ?? 5, launch: o.launch ?? 0, heavy: o.heavy, hitstop: o.heavy ? 0.1 : 0.05, shake: o.heavy ? 0.3 : 0.12 });
    if (o.trip) best.hitstun = Math.max(best.hitstun, 0.6);
    return best;
  }

  attack(): void {
    const { f, g } = this;
    if (this.feast) {
      this.feast.stop = true;
      return;
    }
    const cur = f.action;
    if (cur instanceof StrikeAction && LILTOTTO_CHAIN.includes(cur.clip)) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (g.time - this.lastEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const { f, g } = this;
    const idx = i % LILTOTTO_CHAIN.length;
    const clip = LILTOTTO_CHAIN[idx];
    this.comboIndex = idx + 1;
    this.lastEnd = g.time + 0.65;
    const big = this.form === 'gagael';
    if (clip === 'lt_chomp') {
      f.act(new StrikeAction(this, clip, idx, (n) => {
        if (n !== 'hit') return;
        this.maw.open = 0;
        this.chew(this.maw.bite(900), big ? 26 : 18, 0.3, false);
      }, (t) => {
        // the small maw out on the lunge, open, then snapped shut on the hit
        this.maw.size = big ? 1.2 : 0.8;
        this.maw.aim = this.near(4);
        this.maw.reach = Math.min(0.5, t * 2);
        this.maw.open = t < 0.1 ? t * 8 : t < 0.22 ? 0.85 : 0;
      }), true);
      return;
    }
    const on = (n: string): void => {
      if (n !== 'hit') return;
      if (clip === 'lt_palm') this.strike(1.7, 10, { knock: 4 });
      else if (clip === 'lt_knee') this.strike(1.5, 12, { knock: 3, launch: 3 });
      else this.strike(2.0, 12, { knock: 4, trip: true });
    };
    f.act(new StrikeAction(this, clip, idx, on), true);
  }

  // ---------------------------------------------------------------- the moves

  private special(a: FighterAction, cost: number, cdKey: keyof typeof this.cd, cd: number, hunger = 6): boolean {
    const f = this.f;
    if (this.cd[cdKey] > 0) return false;
    if (f.action && !f.action.canCancel(a)) return false;
    if (f.hitstun > 0 || f.dashT > 0 || f.dead) return false;
    if (!f.spendRei(cost)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return false;
    }
    this.cd[cdKey] = cd;
    this.hunger = Math.min(100, this.hunger + hunger);
    f.act(a, true);
    return true;
  }

  /** RMB: the Arterie haymaker; Gagael: The Glutton, the big maw */
  heavy(): void {
    const { f, g } = this;
    if (this.form === 'gagael') {
      this.glutton(3.4, 2.4, 90, 'haymaker', 6);
      return;
    }
    let lit = false;
    this.special(new ClipSkill('haymaker', 'lt_haymaker', (n) => {
      if (n === 'charge') lit = true;
      if (n !== 'hit') return;
      lit = false;
      const hit = this.strike(2.2, 40, { knock: 16, launch: 3, heavy: true });
      const at = sock(f, 'palm.R').addScaledVector(f.forward(), 0.4);
      g.engine.destruction.carve(new SphereShape(at, hit ? 1.0 : 1.4, 0.5), { mode: 'smash', power: 900, impulse: 10, dust: 0.6 });
      g.groundImpact(f.pos.clone().addScaledVector(f.forward(), 1.2), 1.6, 400, '#FF4A4A', f);
    }, { mobility: 0.15, armor: 0.3, lunge: 4, tick: () => { if (lit) arterie(g, f, 'R', 1.4); } }), 14, 'haymaker', 4, 4);
  }

  /** The Glutton: the maw thrust out on a lunge, opened, snapped shut on whatever it reaches */
  private glutton(size: number, reach: number, dmg: number, key: keyof typeof this.cd, cd: number): void {
    const { f, g } = this;
    this.special(new ClipSkill('glutton', 'lt_bite', (n) => {
      if (n !== 'hit') return;
      this.maw.open = 0;
      const bodies = this.maw.bite(size > 2.5 ? 3200 : 1800);
      this.chew(bodies, dmg, 0.8, true);
      if (g.player && g.player.pos.distanceTo(f.pos) < 20) g.shake(size > 2.5 ? 0.45 : 0.25);
    }, {
      mobility: 0.1,
      armor: 0.3,
      lunge: (this.near(3)?.pos.distanceTo(f.pos) ?? 9) < 3 ? 0 : 12,
      tick: (t) => {
        this.maw.size = size;
        const tg = this.near(size * 2.5);
        this.maw.aim = tg;
        // thrust out only as far as needed for the jaws' middle to close on the target
        const want = tg ? Math.max(0, Math.min(reach, sock(f, 'mouth').distanceTo(tg.center()) - MAW_LEN * size * 0.55)) : reach;
        if (t < 0.36) {
          this.maw.reach = Math.min(want, t * reach * 4);
          this.maw.open = Math.min(1, t * 5);
        } else if (t > 0.5) this.maw.reach = Math.max(0, this.maw.reach - dt4(reach));
      },
      end: () => this.shutMaw(),
    }), size > 2.5 ? 30 : 18, key, cd, 8);
  }

  /** Q: The Glutton; Gagael: Spork */
  skill1(): void {
    const { f, g } = this;
    if (this.form === 'gagael') {
      this.special(new ClipSkill('spork', 'lt_spork', (n) => {
        if (n !== 'fire') return;
        const from = sock(f, 'wrist.R');
        g.addProjectile(new SporkTrap(g, f, from, this.target(), this.aimAt(from), 70, () => this.eat(4)));
        g.callout('', 'SPORK', GOLD);
      }, { mobility: 0.3 }), 18, 'spork', 4);
      return;
    }
    this.glutton(1.9, 1.7, 60, 'bite', 5);
  }

  /** E: Swallow; Gagael: Spife */
  skill2(): void {
    const { f, g } = this;
    if (this.form === 'gagael') {
      this.special(new ClipSkill('spife', 'lt_spife', (n) => {
        if (n !== 'out') return;
        g.addProjectile(new SpifeWhip(g, f, () => sock(f, 'wrist.L'), 9, 46));
        g.callout('', 'SPIFE', GOLD);
      }, { mobility: 0.2 }), 16, 'spife', 4.5);
      return;
    }
    const taken = { beam: f.beamStop, energy: f.energyTaken };
    this.special(new ClipSkill('swallow', 'lt_swallow', () => {}, {
      mobility: 0.25,
      tick: (t) => {
        const open = t > 0.1 && t < 1.2;
        this.maw.size = 1.7;
        this.maw.reach = open ? 0.4 : 0;
        this.maw.open = open ? 0.9 : 0;
        f.beamStop = open;
        f.energyTaken = open ? 0.15 : taken.energy;
        if (!open) return;
        // what reaches the open maw is eaten
        const n = g.rejectNear(this.maw.center(), 2.4, f, false);
        if (n > 0) {
          this.eat(6 * n);
          g.sfx.play('crumble', this.maw.center(), 0.7);
        }
      },
      end: () => {
        this.shutMaw();
        f.beamStop = taken.beam;
        f.energyTaken = taken.energy;
      },
    }), 10, 'swallow', 5, 2);
  }

  /** R: the bow; Gagael: Golden Crunch */
  skill3(): void {
    const { f, g } = this;
    if (this.form === 'gagael') {
      const t = this.near(40);
      if (!t) {
        if (f === g.player) g.hud?.showBanner('No one in reach');
        return;
      }
      if (this.special(new ClipSkill('crunch', 'lt_crunch', (n) => {
        if (n !== 'press') return;
        g.addProjectile(new GoldenCrunch(g, f, f.pos.clone(), t.pos.clone(), 120, (o) => { if (o.team !== f.team) this.eat(8); }));
      }, { mobility: 0, armor: 0.4 }), 34, 'crunch', 12, 6)) g.callout('', 'GOLDEN CRUNCH', GOLD);
      return;
    }
    this.special(new ClipSkill('bow', 'lt_bow', (n) => {
      if (n === 'pop') {
        const h = sock(f, 'heart');
        for (let i = 0; i < 6; i++) g.engine.glow.spawn({ x: h.x, y: h.y, z: h.z, vy: 3 + Math.random() * 2, size: 0.2, sizeEnd: 0.04, life: 0.3, r: 1, g: 0.8, b: 0.3, alpha: 1, alphaEnd: 0, tex: 0 });
        g.sfx.play('ting', h, 0.7);
      }
      if (n === 'catch') {
        f.visual.attach('bow', liltottoProp('bow'), 'grip.L');
        this.hands();
      }
      if (n[0] === 'a') {
        const bow = f.visual.props.get('bow');
        const from = bow ? bow.getWorldPosition(new THREE.Vector3()) : sock(f, 'grip.L');
        const dir = this.aimAt(from).applyAxisAngle(new THREE.Vector3(0, 1, 0), (Number(n[1]) - 1) * 0.05);
        g.addProjectile(new BiteArrow(g, f, from.addScaledVector(dir, 0.4), dir, 16));
      }
    }, {
      mobility: 0.2,
      end: () => {
        f.visual.detach('bow');
        this.hands();
      },
    }), 14, 'bow', 3.5, 3);
  }

  /** G: Feast (on until pressed again); Gagael: Sklaverei */
  toggle(): void {
    const { f, g } = this;
    if (this.form === 'gagael') {
      let acc = 0, drank = 0;
      this.special(new ClipSkill('sklaverei', 'lt_sklav', (n) => {
        if (n === 'start') g.callout('聖隷', 'SKLAVEREI', GOLD);
      }, {
        mobility: 0,
        armor: 0.3,
        dur: 2.0,
        tick: (t, dt) => {
          if (t < 0.2) return;
          f.rooted = true;
          acc += dt;
          while (acc >= 0.1) {
            acc -= 0.1;
            const bites = sklaverei(g, f, 3, 6);
            drank += bites;
            this.gagaelT = Math.min(GAGAEL_TIME, this.gagaelT + bites * 0.3);
            this.eat(bites * 0.5);
          }
        },
        end: () => {
          f.rooted = false;
          if (drank > 0 && !this.sklav && this.form === 'gagael') {
            this.sklav = true;
            this.rebody();
          }
        },
      }), 0, 'sklav', 14, 0);
      return;
    }
    if (this.feast && f.action === this.feast) {
      this.feast.stop = true;
      return;
    }
    if (f.busy || f.rei < 6) return;
    this.feast = new FeastAction(this);
    f.act(this.feast, true);
  }

  /** each step of Feast: the maw held open before her */
  feastTick(k: number): void {
    this.maw.size = 2.3;
    this.maw.reach = 0.3;
    this.maw.open = 0.8 * k;
    if (this.f.action !== this.feast) this.feast = null;
  }

  /** a mouthful while Feasting: what is ahead is erased; bodies in it are bitten */
  feastBite(): void {
    const bodies = this.maw.bite(1600);
    this.eat(1);
    this.chew(bodies, 10, 0.25, false);
  }

  // ---------------------------------------------------------------- Gagael

  /** F: Gagael; in it, Full Course */
  release(): void {
    const { f, g } = this;
    if (this.form === 'gagael') {
      const t = this.near(45);
      if (!t) {
        if (f === g.player) g.hud?.showBanner('No one in reach');
        return;
      }
      let big: GluttonMaw | null = null;
      this.special(new ClipSkill('full', 'lt_full', (n) => {
        if (n === 'rise') {
          big = new GluttonMaw(g, f);
          big.size = 5;
          const d = t.pos.clone().sub(f.pos).setY(0).normalize();
          // the hinge behind the target's near side, so the jaws close over it
          big.at = t.pos.clone().addScaledVector(d, -MAW_LEN * 5 * 0.55).setY(t.pos.y - 1.2);
          big.dir.copy(d);
          big.pitch = 0.35;
          g.addProjectile(big);
          g.callout('', 'FULL COURSE', GOLD);
          g.sfx.play('roarBig', t.center(), 1);
        }
        if (n === 'bite' && big) {
          big.open = 0;
          const bodies = big.bite(4000);
          for (const e of bodies) {
            if (e.team === f.team) continue;
            if (e.hp <= e.maxHp * 0.25) {
              // swallowed whole
              g.kill(e, f, f.forward());
              this.eat(40);
              g.callout('', 'Gulp.', GOLD);
            } else this.chew([e], 200, 1.2, true);
          }
          g.shake(f === g.player ? 0.7 : 0.3);
        }
      }, {
        mobility: 0,
        armor: 0.6,
        tick: (tt) => {
          if (!big) return;
          // the giant jaws open as they rise
          big.open = tt < 1.05 ? Math.min(1, (tt - 0.3) / 0.4) : 0;
        },
        end: () => { if (big) big.done = true; },
      }), 60, 'full', 22, 10);
      return;
    }
    if (this.gagaelCd > 0) {
      if (f === g.player) g.hud?.showBanner('Not yet');
      return;
    }
    if (f.busy) return;
    if (!f.spendRei(50)) {
      if (f === g.player) g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(new ClipSkill('release', 'lt_release', (n) => n === 'burst' && this.becomeGagael(), { invulnerable: true, mobility: 0 }), true);
  }

  private rebody(): void {
    const { f } = this;
    const z = this.form === 'gagael';
    f.setForm({ asset: liltottoAsset(z ? (this.sklav ? 'sklaverei' : 'gagael') : 'base'), props: this.props() }, z ? AURA_GAGAEL : AURA_GLUTTON);
    this.hands();
  }

  private becomeGagael(): void {
    const { f, g } = this;
    if (this.form === 'gagael') return;
    this.form = 'gagael';
    this.gagaelT = GAGAEL_TIME;
    this.sklav = false;
    f.rooted = false;
    f.slowT = 0;
    f.def = { ...f.def, speed: { ...SPEED_GAGAEL } };
    this.rebody();
    // the burst as the wings come out: everyone close thrown back
    const c = f.center();
    for (const e of g.enemiesOf(f)) {
      if (e.dead || e.center().distanceTo(c) > 6 + e.def.radius) continue;
      g.damage(e, 30, f, e.pos.clone().sub(f.pos).setY(0).normalize(), { energy: true, knock: 16, launch: 5, heavy: true, color: GOLD });
    }
    g.addProjectile(new LightPillar(g, f.pos.clone(), 1.4, 70, GOLD));
    f.aura.pillarBurst(2.2);
    f.aura.flare(2, 1);
    g.addRing(f.pos.clone(), 10, GOLD, 0.5);
    g.shake(f === g.player ? 0.5 : 0.2);
    g.callout('神の飢え', 'QUINCY: VOLLSTÄNDIG — GAGAEL', GOLD);
    g.sfx.play('bankai', f.center());
    this.applyStats();
  }

  private leaveGagael(): void {
    const { f } = this;
    this.form = 'base';
    this.gagaelCd = GAGAEL_CD;
    this.sklav = false;
    f.mounted = false;
    f.rooted = false;
    f.def = { ...f.def, speed: { ...SPEED } };
    this.rebody();
    this.applyStats();
  }

  private applyStats(): void {
    const f = this.f;
    const z = this.form === 'gagael';
    f.power = (z ? 1.45 : 1) * (this.flare ? 1.25 : 1);
    // the best Blut of the Bambies
    f.damageTaken = z ? 0.75 : 0.85;
    f.toughness = z ? 10 : 7;
    f.aura.target = this.flare ? 0.9 : z ? 0.5 : 0.06;
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

  formName(): string {
    const h = `hunger ${Math.round(this.hunger)}`;
    if (this.form === 'gagael') return `Gagael${this.sklav ? ' (Sklaverei)' : ''} · ${Math.max(0, Math.ceil(this.gagaelT))} s · ${h}`;
    return `Sternritter "G" — The Glutton · ${h}`;
  }

  ai(): KitAI {
    const base = () => this.form === 'base';
    const gag = () => this.form === 'gagael';
    const hpK = () => this.f.hp / this.f.maxHp;
    const shots = () => this.g.projectiles.some((p) => {
      const q = p as unknown as { owner?: Fighter; pos?: THREE.Vector3 };
      return !!q.owner && q.owner.team !== this.f.team && !!q.pos && q.pos.distanceTo(this.f.center()) < 6;
    });
    return {
      reach: 1.5,
      chain: 4,
      releaseAt: 0.55,
      ranged: () => false,
      moves: [
        { name: 'bow', use: () => this.skill3(), min: 7, max: 32, weight: 1.8, cd: 3.5, when: base },
        { name: 'bite', use: () => this.skill1(), min: 1.5, max: 5, weight: 2.6, cd: 5, when: base },
        { name: 'haymaker', use: () => this.heavy(), min: 0, max: 2.4, weight: 2, cd: 4, when: base },
        { name: 'swallow', use: () => this.skill2(), min: 0, max: 40, weight: 4, cd: 5, when: () => base() && shots() },
        { name: 'feast', use: () => this.toggle(), min: 0, max: 3, weight: 0.6, cd: 12, when: () => base() && this.hunger > 60 },
        { name: 'glutton', use: () => this.heavy(), min: 1.5, max: 6, weight: 2.4, cd: 6, when: gag },
        { name: 'spork', use: () => this.skill1(), min: 5, max: 34, weight: 2, cd: 4, when: gag },
        { name: 'spife', use: () => this.skill2(), min: 2, max: 9, weight: 2, cd: 4.5, when: gag },
        { name: 'crunch', use: () => this.skill3(), min: 4, max: 26, weight: 1.6, cd: 12, when: gag },
        { name: 'sklav', use: () => this.toggle(), min: 8, max: 60, weight: 1, cd: 14, when: () => gag() && this.gagaelT < 16 },
        { name: 'full', use: () => this.release(), min: 3, max: 30, weight: 2.4, cd: 22, when: () => gag() && hpK() > 0.2 },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    if (this.form === 'gagael') {
      return [
        { key: 'LMB', name: 'Brawl', kanji: '拳' },
        { key: 'RMB', name: 'The Glutton', kanji: '大食', cost: 30, cd: cd.haymaker, cdMax: 6, tint: GOLD },
        { key: 'Q', name: 'Spork', kanji: '罠', cost: 18, cd: cd.spork, cdMax: 4, tint: GOLD },
        { key: 'E', name: 'Spife', kanji: '鞭', cost: 16, cd: cd.spife, cdMax: 4.5, tint: GOLD },
        { key: 'R', name: 'Golden Crunch', kanji: '金顎', cost: 34, cd: cd.crunch, cdMax: 12, tint: GOLD },
        { key: 'G', name: 'Sklaverei', kanji: '聖隷', cd: cd.sklav, cdMax: 14, tint: GOLD },
        { key: 'F', name: 'Full Course', kanji: '満漢', cost: 60, cd: cd.full, cdMax: 22, active: true, timer: this.gagaelT / GAGAEL_TIME, tint: GOLD },
        { key: 'Shift', name: 'Hirenkyaku', kanji: '飛廉脚', cost: 4 },
        { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      ];
    }
    return [
      { key: 'LMB', name: 'Brawl / chomp', kanji: '拳' },
      { key: 'RMB', name: 'Arterie haymaker', kanji: '動血装', cost: 14, cd: cd.haymaker, cdMax: 4, tint: '#FF4A4A' },
      { key: 'Q', name: 'The Glutton', kanji: '食', cost: 18, cd: cd.bite, cdMax: 5, tint: GOLD },
      { key: 'E', name: 'Swallow', kanji: '呑', cost: 10, cd: cd.swallow, cdMax: 5, tint: GOLD },
      { key: 'R', name: 'Heilig Bogen', kanji: '神聖弓', cost: 14, cd: cd.bow, cdMax: 3.5, tint: GOLD },
      { key: 'G', name: 'Feast', kanji: '饗宴', active: !!this.feast },
      { key: 'F', name: 'Gagael', kanji: '神の飢え', cost: 50, cd: this.gagaelCd, cdMax: GAGAEL_CD, tint: GOLD },
      { key: 'Shift', name: 'Hirenkyaku', kanji: '飛廉脚', cost: 4 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
    ];
  }
}

