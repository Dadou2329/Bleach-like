// Candice Catnipp's kit (docs/kits/candice.md). Lightning wherever she points. LMB the brawler string (palm, palm, a
// heeled high kick, the electrified swat), every hit leaving a charge on the target (five and it is paralysed); RMB
// Lightning Engulf (a lunge, lightning clapped round the target between her hands); Q the Thunderbolt (three forked
// bolts from her pointing hand, each leaping on to one more body); E Sky Strike (three bolts out of the sky where the
// target stands, a beat apart); R Galvano Blast (the bow out of the heart case, a 5-gigajoule bolt that bores through
// everything and burns the target's protection away); G Rage Discharge (lightning out of her whole body: binds broken,
// everyone round her thrown). Shift: Hirenkyaku — when something is about to hit her, or with a lock-on, a Lightning
// Jump instead (a bolt through the target to its back). F: Quincy: Vollständig — Barbarriel (six lightning wings, the
// star halo, flight, a lightning sword in each hand, 24 s and then Exhausted): LMB the swords, RMB "I've got six!",
// Q Galvano Javelin (a wing thrown; the wings regrow), E The Thunderbolt, R the Thunderbolt stream, G Sklaverei, F
// Electrocution. "My hair!": a heavy blow sets her off (Rage: harder hits, a small discharge, Galvano Blast sooner).
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef, type PropDef } from '../fighter';
import type { Game, Projectile } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import type { AuraStyle } from '../../vfx/aura';
import { BOW_TIP_Y, BOW_TIP_Z, SWORD_BASE_Z, SWORD_TIP_Z, candiceAsset, candiceProp } from '../../chars/candice';
import { BARBARRIEL_CHAIN, BARBARRIEL_CLIPS, BARBARRIEL_STANCE, CANDICE_CHAIN, CANDICE_CLIPS, CANDICE_STANCE } from '../../chars/candiceClips';
import { BOLT_BLUE, BOLT_GALVANO, BOLT_GREEN, Crackle, ElectroBlast, ElectroPillar, GalvanoBolt, SixWheel, SkyBolt, StreamBolt, ThickBolts, WingJavelin, Zap, lightningBurst, type BoltColors } from '../../vfx/thunder';
import { LightPillar, sklaverei } from '../../vfx/heilig';
import { SphereShape } from '../../destruction/shapes';
import { raycastVoxels } from '../../voxel/raycast';
import { OffBlade } from '../offBlade';
import { hirenkyakuPuff, hirenkyakuStreak, vollFlight, type Rgb } from './sternritter';
import { TEX_GLOW } from '../../vfx/sprites';

export const AURA_THUNDER: AuraStyle = { core: '#EAFBFF', body: '#3FB8FF', rim: '#1F6FC0' };
export const AURA_BARBARRIEL: AuraStyle = { core: '#F2FFEC', body: '#5CFF5C', rim: '#1A9C4A' };
const GREEN = '#5CFF5C';
const BLUE = '#3FB8FF';

type BladeDef = NonNullable<FighterDef['blade']>;
const BLADE: BladeDef = { prop: 'sword', base: [0, 0, SWORD_BASE_Z], tip: [0, 0, SWORD_TIP_Z], color: GREEN, core: '#F2FFEC' };

const SPEED = { run: 10.5, sprint: 30, jump: 14, dash: 32, dashTime: 0.1 };
const SPEED_BARB = { run: 13, sprint: 40, jump: 15, dash: 42, dashTime: 0.1 };
const BARB_TIME = 24;
const BARB_CD = 22;
const EXHAUST = 6;
const WING_REGROW = 8;
const TINT_BLUE: Rgb = [0.35, 0.75, 1];
const TINT_GREEN: Rgb = [0.4, 1, 0.45];

export const CANDICE_DEF: FighterDef = {
  id: 'candice',
  name: 'Candice Catnipp',
  title: 'Sternritter "T" — The Thunderbolt',
  build: () => ({ asset: candiceAsset('base'), props: [] }),
  stance: CANDICE_STANCE,
  clips: CANDICE_CLIPS,
  aura: AURA_THUNDER,
  blade: BLADE,
  hp: 1050,
  rei: 230,
  speed: { ...SPEED },
  radius: 0.28,
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

/** a few steps in order, then done: the Projectile timeline used for moves that unfold over time */
class Later implements Projectile {
  done = false;
  private t = 0;
  constructor(private steps: [number, () => void][]) {
    this.steps.sort((a, b) => a[0] - b[0]);
  }
  update(dt: number): void {
    this.t += dt;
    while (this.steps.length && this.steps[0][0] <= this.t) this.steps.shift()![1]();
    if (!this.steps.length) this.done = true;
  }
  dispose(): void {}
}

// ---------------------------------------------------------------------------------------------- actions

/** A blow of the string or a cut of the swords: the clip, an approach dash, the events to the kit. */
class StrikeAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private hitAt = -1;
  private stopAt = 0;
  queued = false;

  constructor(readonly kit: CandiceKit, readonly clip: string, readonly index: number, readonly sword: boolean, readonly onEvent: (n: string) => void, readonly spec: BladeSpec | null = null, readonly left: BladeSpec | null = null) {
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
    if (this.spec) {
      f.bladeHits.clear();
      f.bladeSpec = this.spec;
    }
    const tgt = f.faceTarget;
    let dashed = false;
    if (tgt && this.hitAt > 0) {
      const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
      this.stopAt = this.sword ? 1.5 : 1.3;
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
          g.sfx.play(this.sword ? 'swingHeavy' : 'swing', f.center(), 0.8);
        }
        this.onEvent(n);
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
    const open = this.hitAt >= 0 && t >= this.hitAt - 0.1 && t <= this.hitAt + 0.13;
    if (this.spec) {
      f.bladeActive = open;
      if (f.trail) f.trail.emitting = open;
    }
    const off = this.kit.off;
    if (this.left && off) {
      if (open && !off.active) off.open(this.left);
      else if (!open && off.active) off.close();
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
    this.kit.off?.close();
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
  /** every step while it runs */
  tick?: (t: number, dt: number) => void;
  /** when it ends, however it ends */
  end?: () => void;
  /** the clip's own duration overridden (a held channel) */
  dur?: number;
}

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

// ---------------------------------------------------------------------------------------------- the kit

type Form = 'base' | 'barbarriel';

interface Charge {
  n: number;
  /** seconds until a stack fades */
  t: number;
  /** after a paralysis: no new stacks for a while */
  immune: number;
  crackle: Crackle;
}

export class CandiceKit implements Kit {
  form: Form = 'base';
  flare = false;
  comboIndex = 0;
  private lastEnd = 0;
  barbT = 0;
  barbCd = 0;
  exhaustT = 0;
  /** Sklaverei drunk in this Barbarriel: the marks, a full-size Electrocution */
  sklav = false;
  rageT = 0;
  private rageCd = 0;
  /** wings on her back (Barbarriel), and when each spent one grows back */
  wings = 6;
  private regrow: number[] = [];
  private flareFullT = 0;
  private wasDashing = false;
  readonly charges = new Map<number, Charge>();
  off: OffBlade | null = null;
  private self: Crackle;
  readonly cd = { engulf: 0, bolt: 0, sky: 0, galvano: 0, rage: 0, jump: 0, six: 0, javelin: 0, thunder: 0, stream: 0, sklav: 0, electro: 0 };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.data.quincy = true;
    this.self = new Crackle(g, f, BOLT_BLUE);
    g.addProjectile(this.self);
    f.onHurt = (amount, heavy) => this.hurt(amount, heavy);
    this.hands();
    this.applyStats();
  }

  private get colors(): BoltColors {
    return this.form === 'barbarriel' ? BOLT_GREEN : BOLT_BLUE;
  }

  private hands(): void {
    this.f.autoHands();
  }

  private props(): PropDef[] {
    if (this.form !== 'barbarriel') return [];
    return [
      { key: 'sword', model: candiceProp('sword'), socket: 'grip.R' },
      { key: 'sword2', model: candiceProp('sword'), socket: 'grip.L' },
      { key: 'halo', model: candiceProp('halo'), socket: 'halo' },
    ];
  }

  /** the back's wings shown by the count left (the top pair goes last) */
  private showWings(): void {
    const rig = this.f.visual.rig;
    if (this.form !== 'barbarriel') return;
    const order = ['wing3.L', 'wing3.R', 'wing2.L', 'wing2.R', 'wing1.L', 'wing1.R'];
    const gone = 6 - this.wings;
    for (const [i, name] of order.entries()) if (rig.index(name) >= 0) rig.setBoneVisible(name, i >= gone);
  }

  private spendWings(n: number): number {
    const k = Math.min(n, this.wings);
    this.wings -= k;
    for (let i = 0; i < k; i++) this.regrow.push(WING_REGROW + i * 0.6);
    this.showWings();
    return k;
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    this.barbCd = Math.max(0, this.barbCd - dt);
    this.rageCd = Math.max(0, this.rageCd - dt);
    if (this.rageT > 0 && (this.rageT -= dt) <= 0) this.applyStats();
    // the charges fade a stack at a time
    for (const [id, c] of this.charges) {
      c.immune = Math.max(0, c.immune - dt);
      c.t -= dt;
      if (c.t <= 0 && c.n > 0) {
        c.n--;
        c.t = 1;
      }
      c.crackle.level = c.immune > 2 ? 1 : c.n / 5;
      if (c.n <= 0 && c.immune <= 0) {
        c.crackle.done = true;
        this.charges.delete(id);
      }
    }
    if (this.exhaustT > 0) {
      this.exhaustT -= dt;
      // spent: no reiatsu for Hirenkyaku or a technique
      f.rei = Math.min(f.rei, 3);
    }
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
      // reishi-dense air: held at full reiatsu, the wings burst out by themselves
      if (this.form === 'base' && this.flare && f.rei >= f.maxRei * 0.97 && this.barbCd <= 0 && this.exhaustT <= 0) {
        this.flareFullT += dt;
        if (this.flareFullT > 4 && !f.busy) {
          this.flareFullT = 0;
          if (f === g.player) g.hud?.showBanner('The wings burst out by themselves!');
          f.act(new ClipSkill('release', 'cc_release', (n) => n === 'burst' && this.becomeBarbarriel(), { invulnerable: true, mobility: 0 }), true);
        }
      } else this.flareFullT = 0;
    } else this.flareFullT = 0;
    this.self.level = this.flare ? 0.7 : this.rageT > 0 ? 0.5 : 0;
    // Hirenkyaku; with a lock-on or something about to hit her, a Lightning Jump
    const dashing = f.dashT > 0;
    if (dashing && !this.wasDashing) {
      const lock = f === g.player ? g.hud?.lockTarget ?? null : null;
      if (this.cd.jump <= 0 && (lock || this.threatened())) this.lightningJump(lock && !lock.dead ? lock : null);
      else hirenkyakuPuff(g, f, this.form === 'barbarriel' ? TINT_GREEN : TINT_BLUE);
    }
    if (dashing) hirenkyakuStreak(g, f, this.form === 'barbarriel' ? TINT_GREEN : TINT_BLUE);
    this.wasDashing = dashing;
    this.off?.update(dt);
    if (this.form === 'barbarriel') {
      this.barbT -= dt;
      vollFlight(g, f, this.target(), 2.5);
      for (let i = this.regrow.length - 1; i >= 0; i--)
        if ((this.regrow[i] -= dt) <= 0) {
          this.regrow.splice(i, 1);
          this.wings = Math.min(6, this.wings + 1);
          this.showWings();
        }
      // fewer wings, slower flight
      const k = 0.6 + 0.4 * (this.wings / 6);
      f.def.speed.run = SPEED_BARB.run * k;
      f.def.speed.sprint = SPEED_BARB.sprint * k;
      if (this.barbT <= 0 && !(f.action instanceof ClipSkill && f.action.name === 'electro')) this.leaveBarbarriel(true);
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

  /** an enemy blade swinging close, or an enemy shot about to arrive */
  private threatened(): boolean {
    const { f, g } = this;
    for (const e of g.enemiesOf(f)) if (!e.dead && e.pos.distanceTo(f.pos) < 4 && (e.bladeActive || (e.action && !e.action.done && e.action.t < 0.4))) return true;
    for (const p of g.projectiles) {
      const q = p as unknown as { owner?: Fighter; pos?: THREE.Vector3 };
      if (q.owner && q.owner !== f && q.owner.team !== f.team && q.pos && q.pos.distanceTo(f.center()) < 4) return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- charges and paralysis

  /** a charge left on a body her lightning touched; five and it is paralysed */
  charge(o: Fighter, n = 1): void {
    const { g } = this;
    if (o.dead || o === this.f) return;
    let c = this.charges.get(o.id);
    if (!c) {
      c = { n: 0, t: 3, immune: 0, crackle: new Crackle(g, o, this.colors) };
      g.addProjectile(c.crackle);
      this.charges.set(o.id, c);
    }
    if (c.immune > 0) return;
    c.n += n;
    c.t = 3;
    if (c.n >= 5) {
      c.n = 0;
      c.immune = 3.2;
      this.paralyse(o, 1.0);
    }
  }

  paralyse(o: Fighter, t: number): void {
    const { g } = this;
    o.stopAction();
    o.hitstun = Math.max(o.hitstun, t);
    o.slow(0.95, t);
    lightningBurst(g, o.center(), this.colors, 5, 1.2, 0.06, 0.3);
    if (o === g.player) g.hud?.showBanner('Paralysed');
  }

  /** "My hair!": a heavy blow sets her off */
  private hurt(amount: number, heavy: boolean): void {
    const { f, g } = this;
    if (f.dead || this.rageCd > 0) return;
    // a blow from someone (a fall or a drain does not count)
    const from = f.lastHurt.from;
    if (!from || from === f) return;
    if (!heavy && amount < f.maxHp * 0.08) return;
    this.rageT = 8;
    this.rageCd = 25;
    this.applyStats();
    g.callout('', 'MY HAIR!!', this.form === 'barbarriel' ? GREEN : BLUE);
    this.discharge(4, 20, false);
  }

  // ---------------------------------------------------------------- the string

  /** a blow from a hand or a boot: the nearest enemy in front within reach, a charge left on it */
  private strike(range: number, dmg: number, o: { knock?: number; launch?: number; heavy?: boolean; hand?: string; charges?: number } = {}): Fighter | null {
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
    const at = sock(f, o.hand ?? 'palm.R');
    if (!best) {
      lightningBurst(g, at, this.colors, 2, 0.6, 0.05, 0.15);
      return null;
    }
    g.damage(best, dmg, f, fw, { energy: true, knock: o.knock ?? 5, launch: o.launch ?? 0, heavy: o.heavy, hitstop: o.heavy ? 0.09 : 0.05, shake: o.heavy ? 0.25 : 0.12, color: this.form === 'barbarriel' ? GREEN : BLUE });
    g.addProjectile(new Zap(g, at.clone(), best.center(), { colors: this.colors, width: 0.12, life: 0.14, branches: 2 }));
    this.charge(best, o.charges ?? 1);
    return best;
  }

  attack(): void {
    const { f, g } = this;
    const cur = f.action;
    if (cur instanceof StrikeAction && (CANDICE_CHAIN.includes(cur.clip) || BARBARRIEL_CHAIN.includes(cur.clip))) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (g.time - this.lastEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const { f, g } = this;
    const barb = this.form === 'barbarriel';
    const list = barb ? BARBARRIEL_CHAIN : CANDICE_CHAIN;
    const idx = i % list.length;
    const clip = list[idx];
    this.comboIndex = idx + 1;
    this.lastEnd = g.time + 0.65;
    if (barb) {
      const last = idx === 3;
      const spec = (dmg: number): BladeSpec => ({
        damage: dmg, knock: last ? 16 : 7, launch: last ? 3 : 0, heavy: last, hitstop: last ? 0.12 : 0.06, shake: last ? 0.45 : 0.15, cut: last ? 2200 : 900, reach: 0.25, thick: last ? 0.16 : 0.1,
        onHit: (o) => {
          this.charge(o, last ? 2 : 1);
          g.addProjectile(new Zap(g, f.blade.tip.clone(), o.center(), { colors: BOLT_GREEN, width: 0.1, life: 0.14 }));
        },
      });
      const right = idx === 1 ? null : spec(last ? 34 : idx === 2 ? 18 : 16);
      const left = idx === 1 || last ? spec(last ? 34 : 16) : null;
      f.act(new StrikeAction(this, clip, idx, true, (n) => {
        if (n === 'hit' && last) lightningBurst(g, f.center().addScaledVector(f.forward(), 1.6), BOLT_GREEN, 6, 2.6, 0.12);
      }, right, left), true);
      return;
    }
    const on = (n: string): void => {
      if (n !== 'hit') return;
      if (clip === 'cc_palm1') this.strike(1.8, 10, { hand: 'palm.R' });
      else if (clip === 'cc_palm2') this.strike(1.8, 10, { hand: 'palm.L' });
      else if (clip === 'cc_kick') this.strike(2.0, 12, { hand: 'toe.R', knock: 6, launch: 1 });
      else {
        // the electrified swat: a backhand that bats them away, a fan of sparks off it
        this.strike(2.1, 16, { knock: 14, launch: 2, heavy: true, hand: 'palm.R', charges: 2 });
        const at = sock(f, 'palm.R');
        for (let k = -1; k <= 1; k++) {
          const d = f.forward(new THREE.Vector3()).applyAxisAngle(new THREE.Vector3(0, 1, 0), k * 0.35);
          g.addProjectile(new Zap(g, at.clone(), at.clone().addScaledVector(d, 2.6), { colors: this.colors, width: 0.1, life: 0.16, branches: 1 }));
        }
      }
    };
    f.act(new StrikeAction(this, clip, idx, false, on), true);
  }

  // ---------------------------------------------------------------- the moves

  private special(a: FighterAction, cost: number, cdKey: keyof typeof this.cd, cd: number): boolean {
    const f = this.f;
    if (this.cd[cdKey] > 0) return false;
    if (f.action && !f.action.canCancel(a)) return false;
    if (f.hitstun > 0 || f.dashT > 0 || f.dead) return false;
    if (!f.spendRei(cost)) {
      if (f === this.g.player) this.g.hud?.showBanner(this.exhaustT > 0 ? 'Exhausted' : 'Not enough reiatsu');
      return false;
    }
    this.cd[cdKey] = cd;
    f.act(a, true);
    return true;
  }

  /** RMB: Lightning Engulf; Barbarriel: "I've got six!" */
  heavy(): void {
    const { f, g } = this;
    if (this.form === 'barbarriel') {
      if (this.wings < 2) {
        if (f === g.player) g.hud?.showBanner('Not enough wings');
        return;
      }
      let wheel: SixWheel | null = null;
      this.special(new ClipSkill('six', 'cc_six', (n) => {
        if (n === 'spin') {
          const k = this.spendWings(this.wings);
          wheel = new SixWheel(g, f, candiceProp('sword'), k, { dmg: 8, radius: 2.3, life: 3, colors: BOLT_GREEN, onHit: (o) => this.charge(o) });
          g.addProjectile(wheel);
          g.callout('', "I'VE GOT SIX!", GREEN);
        }
        if (n[0] === 'f' && wheel) wheel.fling(this.target(), { dmg: 26, r: 2.2, onHit: (o) => this.charge(o, 2) });
      }, { mobility: 0.2, armor: 0.3, end: () => { while (wheel && wheel.fling(this.target(), { dmg: 26, r: 2.2, onHit: (o) => this.charge(o, 2) })); } }), 30, 'six', 10);
      return;
    }
    let held: Fighter | null = null;
    let tick = 0;
    const a = new ClipSkill('engulf', 'cc_engulf', (n) => {
      if (n === 'step') f.push.addScaledVector(f.forward(), 6);
      if (n !== 'clap') return;
      held = this.near(2.8);
      const at = f.center().addScaledVector(f.forward(), 1.1);
      if (!held || Math.abs(held.pos.y - f.pos.y) > 2) {
        held = null;
        lightningBurst(g, at, this.colors, 6, 1.6, 0.1, 0.25);
        g.sfx.play('crack', at, 0.8);
        return;
      }
      this.paralyse(held, 1.3);
      g.sfx.play('crack', at, 1.2);
    }, {
      mobility: 0.15,
      tick: (t, dt) => {
        if (!held || held.dead || t < 0.22 || t > 1.0) return;
        tick -= dt;
        if (tick > 0) return;
        tick = 0.1;
        const last = t > 0.9;
        g.damage(held, last ? 16 : 7, f, f.forward(), { energy: true, knock: last ? 10 : 0.5, launch: last ? 3 : 0, heavy: last, quiet: !last, color: BLUE });
        held.hitstun = Math.max(held.hitstun, 0.3);
        // the lightning surging between her hands, through the body held there
        const L = sock(f, 'palm.L'), R = sock(f, 'palm.R'), c = held.center();
        g.addProjectile(new Zap(g, L.clone(), c, { colors: this.colors, width: 0.16, life: 0.12, branches: 2 }));
        g.addProjectile(new Zap(g, R.clone(), c, { colors: this.colors, width: 0.16, life: 0.12, branches: 2 }));
        if (Math.random() < 0.5) lightningBurst(g, c, this.colors, 2, 1.0, 0.06, 0.12);
      },
    });
    this.special(a, 16, 'engulf', 6);
  }

  /** a forked bolt from her fingertips at the target: it stops at a wall, leaps from the target to the nearest other body */
  private bolt(dmg: number, chain: boolean): void {
    const { f, g } = this;
    const from = sock(f, 'tip.R');
    const t = this.target();
    const d = t ? t.center().sub(from).normalize() : f.forward(new THREE.Vector3());
    const range = Math.min(30, t ? t.center().distanceTo(from) + 0.5 : 18);
    const hit = raycastVoxels(g.engine.world, from.x, from.y, from.z, d.x, d.y, d.z, range);
    if (hit || !t || t.center().distanceTo(from) > 30) {
      const end = from.clone().addScaledVector(d, hit ? hit.dist : range);
      g.addProjectile(new Zap(g, from.clone(), end, { colors: this.colors, width: 0.18, life: 0.18, branches: 2 }));
      if (hit) g.engine.destruction.carve(new SphereShape(end.clone(), 0.6, 0.6), { mode: 'explode', power: 380, impulse: 5, dust: 0.3 });
      return;
    }
    g.addProjectile(new Zap(g, from.clone(), () => t.center(), { colors: this.colors, width: 0.2, life: 0.18, branches: 3 }));
    g.damage(t, dmg, f, d, { energy: true, knock: 3, hitstop: 0.04, color: BLUE });
    this.charge(t);
    g.sfx.play('crack', from, 0.7);
    if (!chain) return;
    const next = g.enemiesOf(f).filter((x) => x !== t && !x.dead && x.pos.distanceTo(t.pos) < 6).sort((a, b) => a.pos.distanceTo(t.pos) - b.pos.distanceTo(t.pos))[0];
    if (next) {
      g.addProjectile(new Zap(g, t.center(), next.center(), { colors: this.colors, width: 0.14, life: 0.16 }));
      g.damage(next, dmg * 0.7, f, d, { energy: true, knock: 2, color: BLUE });
      this.charge(next);
    }
  }

  /** Q: the Thunderbolt; Barbarriel: Galvano Javelin */
  skill1(): void {
    const { f, g } = this;
    if (this.form === 'barbarriel') {
      if (this.wings < 1) {
        if (f === g.player) g.hud?.showBanner('No wings left');
        return;
      }
      this.special(new ClipSkill('javelin', 'cc_javelin', (n) => {
        if (n !== 'throw') return;
        this.spendWings(1);
        const from = sock(f, 'grip.R');
        const t = this.target();
        g.addProjectile(new WingJavelin(g, f, candiceProp('sword'), from, t, this.aimAt(from), { dmg: 48, r: 2.4, onHit: (o) => this.charge(o, 2) }));
        g.callout('', 'GALVANO JAVELIN', GREEN);
      }, { mobility: 0.3 }), 12, 'javelin', 1.6);
      return;
    }
    this.special(new ClipSkill('bolt', 'cc_point', (n) => n[0] === 'b' && this.bolt(17, true), { mobility: 0.3 }), 10, 'bolt', 2.6);
  }

  /** E: Sky Strike; Barbarriel: The Thunderbolt */
  skill2(): void {
    const { f, g } = this;
    if (this.form === 'barbarriel') {
      const t = this.near(60);
      if (!t) {
        if (f === g.player) g.hud?.showBanner('No one in reach');
        return;
      }
      if (this.special(new ClipSkill('thunder', 'cc_thunder', (n) => {
        if (n === 'call') {
          const steps: [number, () => void][] = [];
          for (let i = 0; i < 12; i++) steps.push([i * 0.11, () => {
            // the first few close round the target, the rest over a wide circle
            const a = Math.random() * Math.PI * 2, r = i < 4 ? Math.random() * 2.5 : 2 + Math.random() * 8;
            const p = t.pos.clone().add(_v.set(Math.cos(a) * r, 0, Math.sin(a) * r));
            g.addProjectile(new SkyBolt(g, f, p, { delay: 0.35, dmg: 24, r: 2.0, colors: BOLT_GREEN, onHit: (o) => this.charge(o) }));
          }]);
          g.addProjectile(new Later(steps));
        }
        if (n === 'strike') g.addProjectile(new SkyBolt(g, f, t.pos.clone(), { delay: 0.3, dmg: 110, r: 3.0, colors: BOLT_GREEN, width: 0.9, power: 1600, heavy: true, onHit: (o) => this.charge(o, 3) }));
      }, { mobility: 0, armor: 0.5 }), 45, 'thunder', 16)) g.callout('', 'THE THUNDERBOLT', GREEN);
      return;
    }
    const t = this.near(45);
    this.special(new ClipSkill('sky', 'cc_sky', (n) => {
      if (n !== 'call') return;
      const fall = (): void => {
        const at = t && !t.dead ? t.pos.clone() : f.pos.clone().addScaledVector(f.forward(), 10);
        g.addProjectile(new SkyBolt(g, f, at, { delay: 0.45, dmg: 40, r: 1.9, colors: BOLT_BLUE, onHit: (o) => this.charge(o, 2) }));
      };
      g.addProjectile(new Later([[0, fall], [0.3, fall], [0.6, fall]]));
    }, { mobility: 0.3 }), 20, 'sky', 6);
  }

  /** R: Galvano Blast; Barbarriel: the Thunderbolt stream */
  skill3(): void {
    const { f, g } = this;
    if (this.form === 'barbarriel') {
      const t = this.near(34);
      if (!t) {
        if (f === g.player) g.hud?.showBanner('No one in reach');
        return;
      }
      let n = 0;
      this.special(new ClipSkill('stream', 'cc_stream', (ev) => {
        if (ev !== 'start') return;
        const tip = () => {
          const b = f.blade;
          return f.visual.props.has('sword') ? b.tip.clone() : sock(f, 'grip.R');
        };
        g.addProjectile(new StreamBolt(g, f, tip, t, { dur: 1.0, dmg: 12, chain: 2, colors: BOLT_GREEN, onHit: (o) => { if (++n % 2 === 0) this.charge(o); } }));
      }, { mobility: 0.2 }), 26, 'stream', 7);
      return;
    }
    let string: ThickBolts | null = null;
    const a = new ClipSkill('galvano', 'cc_galvano', (n) => {
      if (n === 'click') {
        // the heart case clicked: the bow springs up out of it
        const h = sock(f, 'heart');
        g.addProjectile(new Zap(g, h.clone(), h.clone().add(_v.set(0, 2.4, 0)), { colors: BOLT_GALVANO, width: 0.1, life: 0.16 }));
        g.sfx.play('ting', h, 0.8);
      }
      if (n === 'catch') {
        f.visual.attach('bow', candiceProp('bow'), 'grip.L');
        f.autoHands();
        string = new ThickBolts(g, 8, BOLT_GALVANO);
      }
      if (n === 'fire') {
        const bow = f.visual.props.get('bow');
        const from = bow ? bow.getWorldPosition(new THREE.Vector3()) : sock(f, 'grip.L');
        const t = this.target();
        const dir = t ? t.center().sub(from).normalize() : f.forward(new THREE.Vector3());
        g.addProjectile(new GalvanoBolt(g, f, from.addScaledVector(dir, 0.4), dir, {
          dmg: 130, width: 1.1, onHit: (o) => {
            // the protection burnt away: it takes more for a while
            o.agedK = Math.max(o.agedK, 0.3);
            o.agedT = Math.max(o.agedT, 8);
            if (o === g.player) g.hud?.showBanner('Protection burnt away');
            this.charge(o, 2);
          },
        }));
        g.callout('', 'GALVANO BLAST', '#9AE6FF');
        string?.dispose();
        string = null;
      }
    }, {
      mobility: 0,
      armor: 0.3,
      tick: (t) => {
        // the reishi string from the limb tips to her drawing hand
        const bow = f.visual.props.get('bow');
        if (!string || !bow) return;
        bow.updateWorldMatrix(true, false);
        const top = new THREE.Vector3(0, BOW_TIP_Y, BOW_TIP_Z).applyMatrix4(bow.matrixWorld);
        const bot = new THREE.Vector3(0, BOW_TIP_Y, -BOW_TIP_Z).applyMatrix4(bow.matrixWorld);
        const hand = t > 0.5 ? sock(f, 'palm.R') : top.clone().lerp(bot, 0.5);
        string.begin();
        string.bolt(top, hand, 0.02, 2, 0.05);
        string.bolt(hand, bot, 0.02, 2, 0.05);
        string.end();
        if (t > 0.6 && Math.random() < 0.5) {
          const c = new THREE.Color(BOLT_GALVANO.edge);
          const p = bow.getWorldPosition(_w);
          g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.3 + (t - 0.6), sizeEnd: 0.1, life: 0.1, r: c.r, g: c.g, b: c.b, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
        }
      },
      end: () => {
        string?.dispose();
        string = null;
        f.visual.detach('bow');
        f.autoHands();
      },
    });
    this.special(a, 40, 'galvano', this.rageT > 0 ? 7 : 12);
  }

  /** lightning out of her whole body: binds broken, shots undone, whoever stands round her thrown */
  private discharge(r: number, dmg: number, big: boolean): void {
    const { f, g } = this;
    f.rooted = false;
    f.slowT = 0;
    f.armLockT = 0;
    f.scrambleT = 0;
    g.rejectNear(f.center(), Math.min(4, r), f, true);
    const c = f.center();
    for (const e of g.enemiesOf(f)) {
      if (e.dead || e.center().distanceTo(c) > r + e.def.radius) continue;
      const d = e.pos.clone().sub(f.pos).setY(0);
      if (d.lengthSq() < 1e-4) d.copy(f.forward());
      g.damage(e, dmg, f, d.normalize(), { energy: true, knock: big ? 18 : 12, launch: big ? 7 : 4, heavy: true, hitstop: 0.1, shake: 0.4, color: this.form === 'barbarriel' ? GREEN : BLUE, unblockable: true });
      this.charge(e, 2);
    }
    lightningBurst(g, c, this.colors, big ? 16 : 9, r, big ? 0.2 : 0.14, 0.3);
    g.addRing(f.pos.clone(), r, this.form === 'barbarriel' ? GREEN : BLUE, 0.4);
    g.engine.destruction.carve(new SphereShape(f.pos.clone(), r * 0.5, 0.25), { mode: 'burn', power: 260, dust: 0.2 });
    g.sfx.play('crack', c, 1.3);
    g.sfx.play('explode', c, 0.7);
    if (f === g.player) g.shake(big ? 0.5 : 0.3);
  }

  /** G: Rage Discharge; Barbarriel: Sklaverei */
  toggle(): void {
    const { f, g } = this;
    if (this.form === 'barbarriel') {
      let acc = 0;
      let drank = 0;
      this.special(new ClipSkill('sklaverei', 'cc_sklav', (n) => {
        if (n === 'start') g.callout('聖隷', 'SKLAVEREI', GREEN);
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
            // what she drinks keeps the wings burning a little longer, and mends her a little
            this.barbT = Math.min(BARB_TIME, this.barbT + bites * 0.25);
            f.hp = Math.min(f.maxHp, f.hp + bites * 1.5);
          }
        },
        end: () => {
          f.rooted = false;
          if (drank > 0 && !this.sklav && this.form === 'barbarriel') {
            this.sklav = true;
            this.rebody();
          }
        },
      }), 0, 'sklav', 14);
      return;
    }
    if (this.special(new ClipSkill('rage', 'cc_rage', (n) => n === 'burst' && this.discharge(this.rageT > 0 ? 7 : 5, this.rageT > 0 ? 45 : 30, this.rageT > 0), { mobility: 0, invulnerable: true }), 18, 'rage', 8)) {
      if (f.rooted) f.rooted = false;
    }
  }

  /** Shift with a lock or under threat: a bolt through the target to its back (or a short bolt on), invulnerable while it lasts */
  lightningJump(t: Fighter | null): boolean {
    const { f, g } = this;
    if (this.cd.jump > 0 || f.dead || this.exhaustT > 0) return false;
    const barb = this.form === 'barbarriel';
    const range = barb ? 14 : 7;
    const from = f.pos.clone();
    let dir: THREE.Vector3;
    let len: number;
    if (t && t.pos.distanceTo(f.pos) + 1.6 <= range + 0.5) {
      dir = t.pos.clone().sub(f.pos).setY(0);
      len = dir.length() + 1.6;
      dir.normalize();
    } else {
      dir = (f.dashDir.lengthSq() > 0.01 ? f.dashDir.clone() : f.forward(new THREE.Vector3())).setY(0).normalize();
      len = range;
    }
    // not through walls: stop short of the first one
    const hit = raycastVoxels(g.engine.world, from.x, from.y + 0.9, from.z, dir.x, 0, dir.z, len);
    if (hit) len = Math.max(0, hit.dist - 0.5);
    if (len < 1) return false;
    this.cd.jump = barb ? 3 : 6;
    f.ghosts.spawn(0.3, 1);
    const a = f.center();
    const to = from.clone().addScaledVector(dir, len);
    f.body.pos.set(to.x, to.y, to.z);
    f.body.prev.copy(f.body.pos);
    f.body.vel.set(0, 0, 0);
    f.dashT = 0;
    f.invuln = Math.max(f.invuln, 0.3);
    const b = f.center();
    g.addProjectile(new Zap(g, a, b, { colors: this.colors, width: 0.45, life: 0.28, branches: 3 }));
    lightningBurst(g, b, this.colors, 4, 1.2, 0.1, 0.2);
    g.sfx.play('crack', b, 1);
    // what the bolt passed through is shocked
    for (const e of g.enemiesOf(f)) {
      if (e.dead) continue;
      _v.subVectors(b, a);
      const l2 = _v.lengthSq();
      const k = l2 > 0 ? Math.max(0, Math.min(1, _w.subVectors(e.center(), a).dot(_v) / l2)) : 0;
      if (a.clone().addScaledVector(_v, k).distanceTo(e.center()) > e.def.radius + 0.8) continue;
      g.damage(e, barb ? 22 : 14, f, dir, { energy: true, knock: 3, hitstop: 0.05, color: barb ? GREEN : BLUE });
      this.charge(e);
    }
    if (t) {
      f.yaw = Math.atan2(t.pos.x - f.pos.x, t.pos.z - f.pos.z);
      f.faceTarget = t.center();
      // Barbarriel: it ends in a cut
      if (barb && t.pos.distanceTo(f.pos) < 3 && !f.busy) this.chain(3);
    }
    return true;
  }

  // ---------------------------------------------------------------- Barbarriel

  /** F: Barbarriel; in it, Electrocution */
  release(): void {
    const { f, g } = this;
    if (this.form === 'barbarriel') {
      const t = this.near(60);
      let pillar: ElectroPillar | null = null;
      this.special(new ClipSkill('electro', 'cc_electro', (n) => {
        if (n === 'pillar') {
          pillar = new ElectroPillar(g, f, { dur: 1.5, radius: 2.6, dmg: 7, colors: BOLT_GREEN, arm: 'hand.L' });
          g.addProjectile(pillar);
          const s2 = f.visual.props.get('sword2');
          if (s2) s2.visible = false;
        }
        if (n === 'throw') {
          const from = sock(f, 'palm.L');
          const tt = t && !t.dead ? t : this.target();
          const dir = tt ? tt.center().sub(from).normalize() : f.forward(new THREE.Vector3());
          g.addProjectile(new ElectroBlast(g, f, from.addScaledVector(dir, 0.5), dir, { dmg: this.sklav ? 180 : 130, tickDmg: this.sklav ? 10 : 7, width: this.sklav ? 2.3 : 1.7, range: 60, colors: BOLT_GREEN, onHit: (o) => this.charge(o, 5) }));
          g.callout('電滅刑', 'ELECTROCUTION', GREEN);
        }
      }, {
        mobility: 0,
        armor: 0.7,
        tick: (tt) => {
          if (pillar) pillar.squeeze = Math.max(0, Math.min(1, (tt - 1.2) / 0.4));
        },
        end: () => {
          const s2 = f.visual.props.get('sword2');
          if (s2) s2.visible = true;
        },
      }), 60, 'electro', 20);
      return;
    }
    if (this.exhaustT > 0) {
      if (f === g.player) g.hud?.showBanner('Exhausted');
      return;
    }
    if (this.barbCd > 0) {
      if (f === g.player) g.hud?.showBanner('Not yet');
      return;
    }
    if (f.busy) return;
    if (!f.spendRei(50)) {
      if (f === g.player) g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(new ClipSkill('release', 'cc_release', (n) => n === 'burst' && this.becomeBarbarriel(), { invulnerable: true, mobility: 0 }), true);
  }

  /** the body for the form (Barbarriel's wings, Sklaverei's marks), the props, the hands */
  private rebody(): void {
    const { f } = this;
    const barb = this.form === 'barbarriel';
    f.def = { ...f.def, stance: barb ? BARBARRIEL_STANCE : CANDICE_STANCE, clips: barb ? BARBARRIEL_CLIPS : CANDICE_CLIPS };
    f.setForm({ asset: candiceAsset(barb ? (this.sklav ? 'sklaverei' : 'barbarriel') : 'base'), props: this.props() }, barb ? AURA_BARBARRIEL : AURA_THUNDER, BLADE);
    this.hands();
    this.showWings();
    this.self.done = true;
    this.self = new Crackle(this.g, f, this.colors);
    this.self.coil = barb;
    this.g.addProjectile(this.self);
    this.off?.dispose();
    this.off = barb ? new OffBlade(this.g, f, 'sword2', SWORD_BASE_Z, SWORD_TIP_Z, GREEN, '#F2FFEC') : null;
    for (const c of this.charges.values()) c.crackle.setColors(this.colors);
  }

  private becomeBarbarriel(): void {
    const { f, g } = this;
    if (this.form === 'barbarriel') return;
    this.form = 'barbarriel';
    this.barbT = BARB_TIME;
    this.sklav = false;
    this.wings = 6;
    this.regrow = [];
    f.rooted = false;
    f.slowT = 0;
    f.def = { ...f.def, speed: { ...SPEED_BARB } };
    this.rebody();
    // the lightning bursts out in every direction as the wings form (it breaks what held her)
    this.discharge(7, 40, true);
    g.addProjectile(new LightPillar(g, f.pos.clone(), 1.4, 70, GREEN));
    f.aura.pillarBurst(2.2);
    f.aura.flare(2, 1);
    g.shake(f === g.player ? 0.5 : 0.2);
    g.callout('神の雷霆', 'QUINCY: VOLLSTÄNDIG — BARBARRIEL', GREEN);
    g.sfx.play('bankai', f.center());
    this.applyStats();
  }

  /** the wings gone out: back to her base body; spent (Exhausted) when they burnt out by themselves */
  private leaveBarbarriel(spent: boolean): void {
    const { f, g } = this;
    this.form = 'base';
    this.barbCd = BARB_CD;
    this.sklav = false;
    f.mounted = false;
    f.rooted = false;
    f.def = { ...f.def, speed: { ...SPEED } };
    this.rebody();
    if (spent) {
      this.exhaustT = EXHAUST;
      f.rei = 0;
      f.slow(0.45, EXHAUST);
      if (f === g.player) g.hud?.showBanner('Exhausted — the wings burnt out');
      lightningBurst(g, f.center(), BOLT_GREEN, 5, 1.4, 0.06, 0.4);
    }
    this.applyStats();
  }

  private applyStats(): void {
    const f = this.f;
    const z = this.form === 'barbarriel';
    f.power = (z ? 1.5 : 1) * (this.flare ? 1.25 : 1) * (this.rageT > 0 ? 1.2 : 1);
    f.damageTaken = z ? 0.9 : 1;
    f.toughness = z ? 8 : 5;
    f.aura.target = this.flare ? 0.9 : z ? 0.5 : this.rageT > 0 ? 0.4 : 0.06;
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
    if (this.form === 'barbarriel') return `Barbarriel${this.sklav ? ' (Sklaverei)' : ''} · ${Math.max(0, Math.ceil(this.barbT))} s · wings ${this.wings}`;
    if (this.exhaustT > 0) return 'Exhausted';
    return this.rageT > 0 ? 'Sternritter "T" — RAGE' : 'Sternritter "T" — The Thunderbolt';
  }

  ai(): KitAI {
    const base = () => this.form === 'base';
    const barb = () => this.form === 'barbarriel';
    const rage = () => this.rageT > 0;
    const threat = () => this.threatened();
    return {
      reach: 1.8,
      chain: 4,
      releaseAt: 0.6,
      ranged: () => this.form === 'base' && this.f.hp / this.f.maxHp > 0.4,
      moves: [
        { name: 'bolt', use: () => this.skill1(), min: 4, max: 28, weight: 2.4, cd: 2.6, when: base },
        { name: 'sky', use: () => this.skill2(), min: 5, max: 40, weight: 2.4, cd: 6, when: base },
        { name: 'engulf', use: () => this.heavy(), min: 0, max: 2.6, weight: 2.2, cd: 6, when: base },
        { name: 'galvano', use: () => this.skill3(), min: 6, max: 50, weight: 1.2, cd: 12, when: () => base() && !rage() },
        { name: 'galvanoRage', use: () => this.skill3(), min: 3, max: 50, weight: 4, cd: 7, when: () => base() && rage() },
        { name: 'rage', use: () => this.toggle(), min: 0, max: 4, weight: 2, cd: 8, when: () => base() && (this.f.rooted || this.f.hitstun > 0 || this.f.slowT > 0) },
        { name: 'jump', use: () => { const t = this.target(); if (t) this.lightningJump(t); }, min: 1, max: 6, weight: 2.6, cd: 6, when: threat },
        { name: 'early', use: () => this.release(), min: 0, max: 30, weight: 3, cd: 20, when: () => base() && rage() && this.barbCd <= 0 && this.exhaustT <= 0 },
        { name: 'javelin', use: () => this.skill1(), min: 5, max: 40, weight: 2.4, cd: 1.6, when: () => barb() && this.wings > 0 },
        { name: 'six', use: () => this.heavy(), min: 0, max: 6, weight: 1.6, cd: 10, when: () => barb() && this.wings >= 4 },
        { name: 'thunder', use: () => this.skill2(), min: 6, max: 45, weight: 1.6, cd: 16, when: barb },
        { name: 'stream', use: () => this.skill3(), min: 3, max: 26, weight: 1.8, cd: 7, when: barb },
        { name: 'sklav', use: () => this.toggle(), min: 8, max: 60, weight: 1.2, cd: 14, when: () => barb() && this.barbT < 12 },
        { name: 'electro', use: () => this.release(), min: 6, max: 40, weight: 2.2, cd: 20, when: barb },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    if (this.form === 'barbarriel') {
      return [
        { key: 'LMB', name: 'Lightning swords', kanji: '雷剣' },
        { key: 'RMB', name: "I've got six!", kanji: '六翼', cost: 30, cd: cd.six, cdMax: 10, tint: GREEN },
        { key: 'Q', name: `Galvano Javelin (${this.wings})`, kanji: '雷槍', cost: 12, cd: cd.javelin, cdMax: 1.6, tint: GREEN },
        { key: 'E', name: 'The Thunderbolt', kanji: '雷霆', cost: 45, cd: cd.thunder, cdMax: 16, tint: GREEN },
        { key: 'R', name: 'Thunderbolt stream', kanji: '雷流', cost: 26, cd: cd.stream, cdMax: 7, tint: GREEN },
        { key: 'G', name: 'Sklaverei', kanji: '聖隷', cd: cd.sklav, cdMax: 14, tint: GREEN },
        { key: 'F', name: 'Electrocution', kanji: '電滅刑', cost: 60, cd: cd.electro, cdMax: 20, active: true, timer: this.barbT / BARB_TIME, tint: GREEN },
        { key: 'Shift', name: 'Lightning Jump', kanji: '雷跳', cost: 4, cd: cd.jump, cdMax: 3 },
        { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      ];
    }
    return [
      { key: 'LMB', name: 'Electric brawl', kanji: '雷拳' },
      { key: 'RMB', name: 'Lightning Engulf', kanji: '雷包', cost: 16, cd: cd.engulf, cdMax: 6, tint: BLUE },
      { key: 'Q', name: 'Thunderbolt', kanji: '雷撃', cost: 10, cd: cd.bolt, cdMax: 2.6, tint: BLUE },
      { key: 'E', name: 'Sky Strike', kanji: '落雷', cost: 20, cd: cd.sky, cdMax: 6, tint: BLUE },
      { key: 'R', name: 'Galvano Blast', kanji: '雷弓', cost: 40, cd: cd.galvano, cdMax: 12, tint: '#9AE6FF' },
      { key: 'G', name: 'Rage Discharge', kanji: '放電', cost: 18, cd: cd.rage, cdMax: 8, tint: BLUE },
      { key: 'F', name: 'Barbarriel', kanji: '神の雷霆', cost: 50, cd: this.exhaustT > 0 ? this.exhaustT : this.barbCd, cdMax: this.exhaustT > 0 ? EXHAUST : BARB_CD, tint: GREEN },
      { key: 'Shift', name: 'Hirenkyaku / Lightning Jump', kanji: '飛廉脚', cost: 4, cd: cd.jump, cdMax: 6 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
    ];
  }
}

