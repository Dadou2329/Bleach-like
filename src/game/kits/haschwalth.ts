// Jugram Haschwalth's kit (docs/kits/haschwalth.md). The scales never lose: every wound he takes, someone else pays
// for, and the blade finishes it. Day (The Balance): LMB the knightly string (a rising cut, a level cut, the pommel
// into the face, the execution); RMB Judgment (one vertical stroke that splits what stands before him and cuts a
// blade it meets in half); Q the sword blast (three stars of four curved points); E Tip the Scales (the misfortune
// stored in the shield repaid to whoever landed it) or, with nothing stored, the Key (the Hagal rune, the pillar of
// light); R Fortune Inversion (the target's guard fails, its constructs split); G the Freund Schild raised. Passive
// The Balance: while the shield is whole he takes half of every wound, the half he takes is reflected onto whoever
// dealt it, the half the shield drinks is stored; strain shatters it, G brings it back. F: Night (The Almighty: a
// foresight pulse every three seconds, the next blow in it misses; the black: Q the black slash, E the torrent, R the
// thorns, G the mend, RMB the foreseen verdict) — F again: hAschwAlth [anime] for 25 s. The night ends at dawn.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef, type PropDef } from '../fighter';
import type { Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import type { AuraStyle } from '../../vfx/aura';
import type { EnergyColors } from '../../vfx/energy';
import { HW_SWORD_BASE_Z, HW_SWORD_TIP_Z, haschwalthAsset, haschwalthProp, type HaschwalthForm } from '../../chars/haschwalth';
import { HASCHWALTH_CHAIN, HASCHWALTH_CLIPS, HASCHWALTH_STANCE } from '../../chars/haschwalthClips';
import { BalanceScales, BlackTorrent, InversionMark, KEY_WHITE, NIGHT_RED, SCALES_GOLD, SHIELD_GOLD, StarBlast, TheKey, blackMend, shieldFlash } from '../../vfx/balance';
import { BlackWave, ShadowSpikes } from '../../vfx/almighty';
import { GetsugaProjectile } from '../projectiles/getsuga';
import { BoxShape } from '../../destruction/shapes';
import { TEX_GLOW, TEX_STREAK } from '../../vfx/sprites';

/** day: a calm gold-white; night: the black, edged in crimson */
export const AURA_DAY: AuraStyle = { core: '#F8F1D8', body: '#E8C55A', rim: '#9C7C2A' };
export const AURA_NIGHT: AuraStyle = { core: '#7A2030', body: '#2A1A22', rim: '#C0182A', dark: '#050507' };
const BLACK: EnergyColors = { core: '#6A2030', body: '#24121C', rim: '#C0182A', dark: '#050507' };

type BladeDef = NonNullable<FighterDef['blade']>;
const BLADE: BladeDef = { prop: 'sword', base: [0, 0, HW_SWORD_BASE_Z], tip: [0, 0, HW_SWORD_TIP_Z], color: '#CFE6FF', core: '#F3F8FF' };
const BLADE_NIGHT: BladeDef = { ...BLADE, color: '#2A1A22', core: '#C0182A' };

const NIGHT_TIME = 40;
const NIGHT_CD = 15;
const VESSEL_TIME = 25;
const VESSEL_CD = 20;
const STORE_MAX = 400;
const STRAIN_MAX = 450;
const SHIELD_BACK = 10;

const SPEED = { run: 9.6, sprint: 28, jump: 13, dash: 30, dashTime: 0.1 };

const props = (): PropDef[] => [
  { key: 'sword', model: haschwalthProp('sword'), socket: 'grip.R' },
  { key: 'shield', model: haschwalthProp('shield'), socket: 'shield' },
];

export const HASCHWALTH_DEF: FighterDef = {
  id: 'haschwalth',
  name: 'Jugram Haschwalth',
  title: 'Sternritter Grandmaster "B"',
  build: () => ({ asset: haschwalthAsset('day'), props: props() }),
  stance: HASCHWALTH_STANCE,
  clips: HASCHWALTH_CLIPS,
  aura: AURA_DAY,
  blade: BLADE,
  hp: 1250,
  rei: 240,
  speed: { ...SPEED },
  radius: 0.32,
  height: 1.89,
};

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const UP = new THREE.Vector3(0, 1, 0);

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

/** the strength his own blows carry (a reflected wound must land at its true size, so it is divided out) */
function powerOf(g: Game, f: Fighter): number {
  return Math.max(0.05, f.power * (f === g.player ? g.playerPower : 1) * (1 - f.sealK));
}

// ---------------------------------------------------------------------------------------------- actions

interface SwingOpts {
  spec: BladeSpec;
  /** cut the world in the plane of a vertical stroke, this far ahead (m) */
  slice?: number;
  /** lead the target: strike where it will be (s ahead) */
  lead?: number;
  onEvent?: (n: string) => void;
  noBlade?: boolean;
}

/** A sword stroke: the clip, an approach dash so the edge arrives where the target stands, the blade's window. */
class SwingAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private hitAt = -1;
  private stopAt = 0;
  private sliced = false;
  queued = false;

  constructor(readonly kit: HaschwalthKit, readonly clip: string, readonly index: number, readonly o: SwingOpts) {
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
    f.bladeHits.clear();
    f.bladeSpec = this.o.spec;
    const t = this.kit.target();
    if (t && this.o.lead) {
      const p = t.center().addScaledVector(t.body.vel, this.o.lead);
      f.faceTarget = p;
      f.yaw = Math.atan2(p.x - f.pos.x, p.z - f.pos.z);
    }
    const tgt = f.faceTarget;
    let dashed = false;
    if (tgt && this.hitAt > 0) {
      const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
      this.stopAt = 1.6;
      if (d > this.stopAt + 0.25 && d < 9) {
        const tau = Math.max(0.06, this.hitAt - 0.07);
        const per = (1 - Math.exp(-f.pushDrag * tau)) / f.pushDrag;
        f.push.addScaledVector(f.forward(), Math.min(30, (d - this.stopAt) / per));
        dashed = true;
      }
    }
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n === 'step') {
          if (!dashed) f.push.addScaledVector(f.forward(), 3);
          g.sfx.play(this.o.spec.heavy ? 'swingHeavy' : 'swing', f.center(), 0.8);
        }
        this.o.onEvent?.(n);
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
    const open = this.hitAt >= 0 && t >= this.hitAt - 0.08 && t <= this.hitAt + 0.13;
    f.bladeActive = open && !this.o.noBlade;
    if (f.trail) f.trail.emitting = open && !this.o.noBlade;
    if (this.o.slice && !this.sliced && t >= this.hitAt) {
      this.sliced = true;
      this.kit.slice(this.o.slice);
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
    if (next.name === 'dash' || next instanceof ClipSkill) return this.t >= this.hitAt + 0.05;
    return false;
  }
}

/** One clip, its events to a callback, done when it ends. */
class ClipSkill extends FighterAction {
  private dur = 1;
  constructor(readonly kit: HaschwalthKit, readonly name: string, readonly clip: string, private on: (n: string) => void, o: { armor?: number; mobility?: number; invulnerable?: boolean } = {}) {
    super();
    this.armor = o.armor ?? 0;
    this.mobility = o.mobility ?? 0.1;
    this.invulnerable = !!o.invulnerable;
    this.airGravity = 0.1;
  }
  override start(f: Fighter): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.anim.play(this.clip, { onEvent: this.on });
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
    return next.name === 'dash' ? this.t > this.dur * 0.55 : next instanceof ClipSkill && this.t > this.dur * 0.5;
  }
}

// ---------------------------------------------------------------------------------------------- the kit

type Form = HaschwalthForm;

interface Owed { to: Fighter; amt: number; at: number }

export class HaschwalthKit implements Kit {
  form: Form = 'day';
  flare = false;
  comboIndex = 0;
  /** the shield: whole, raised, its strain, how long until it can be called back */
  shieldWhole = true;
  shieldUp = false;
  strain = 0;
  shieldBack = 0;
  /** misfortune the shield has drunk, by whoever dealt it */
  readonly store = new Map<number, { f: Fighter; amt: number }>();
  /** reflections on their way (the half he took, back onto whoever dealt it) */
  readonly owed: Owed[] = [];
  /** Fortune Inversion */
  marked: { f: Fighter; until: number } | null = null;
  /** the night: its time left, the cooldown after dawn; the vessel's */
  nightT = 0;
  nightCd = 0;
  vesselT = 0;
  vesselCd = 0;
  /** foresight: a pulse is live while pulseT runs; the next comes when pulseCd runs out */
  pulseT = 0;
  pulseCd = 0;
  mendT = 0;
  private thorned: { f: Fighter; until: number } | null = null;
  private lastEnd = 0;
  private guarding = false;
  readonly cd = { heavy: 0, blast: 0, scales: 0, invert: 0, bslash: 0, torrent: 0, thorns: 0, mend: 0, verdict: 0 };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.data.quincy = true;
    f.parry = (amount, from, o) => this.parry(amount, from, o);
    f.onHurt = (amount) => this.onHurt(amount);
    this.applyStats();
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    this.nightCd = Math.max(0, this.nightCd - dt);
    this.vesselCd = Math.max(0, this.vesselCd - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    // the reflections land
    for (let i = this.owed.length - 1; i >= 0; i--) {
      const o = this.owed[i];
      if (g.time < o.at) continue;
      this.owed.splice(i, 1);
      if (!o.to.dead) this.wound(o.to, o.amt, false);
    }
    // the shield: knocked away with the weapon (Kirinji), called back after a while
    if (this.shieldWhole && f.disarmT > 0) this.shatter(true);
    if (!this.shieldWhole) this.shieldBack = Math.max(0, this.shieldBack - dt);
    if (this.form === 'day' && this.shieldUp && this.shieldWhole) {
      // shots that reach the raised shield sink harmless into the ground before him
      const at = sock(f, 'shield');
      if (g.rejectNear(at, 1.7, f, false) > 0) shieldFlash(g, at);
      f.rei = Math.max(0, f.rei - dt * 3);
      if (f.rei <= 0) this.raise(false);
    }
    this.layerGuard();
    if (this.marked && (g.time > this.marked.until || this.marked.f.dead)) this.marked = null;
    if (this.thorned) {
      if (g.time > this.thorned.until || this.thorned.f.dead) {
        this.thorned.f.rooted = false;
        this.thorned = null;
      } else this.thorned.f.rooted = true;
    }
    // power amplification: Quincy allies near him draw strength from him
    for (const a of g.fighters) if (a !== f && a.team === f.team && !a.dead && a.data.quincy === true && a.pos.distanceTo(f.pos) < 12) a.rei = Math.min(a.maxRei, a.rei + dt * 3);
    if (this.form !== 'day') this.updateNight(dt);
  }

  /** the night: dawn, the vessel's time, foresight, the mend */
  private updateNight(dt: number): void {
    const { f, g } = this;
    if (this.form === 'vessel') {
      this.vesselT -= dt;
      if (Math.random() < dt * 10) {
        const c = f.center();
        g.engine.dust.spawn({ x: c.x + (Math.random() - 0.5) * 0.8, y: c.y + (Math.random() - 0.5) * 1.6, z: c.z + (Math.random() - 0.5) * 0.8, vy: 0.6, size: 0.4, sizeEnd: 0.9, life: 0.6, r: 0.03, g: 0.025, b: 0.04, alpha: 0.7, alphaEnd: 0, tex: 0 });
      }
      if (this.vesselT <= 0) this.leaveVessel();
    } else {
      this.nightT -= dt;
      if (this.nightT <= 0) this.dawn();
    }
    // foresight: a look every three seconds
    if (this.pulseT > 0) {
      this.pulseT -= dt;
      if (this.pulseT <= 0) this.pulseCd = 3;
    } else {
      this.pulseCd -= dt;
      if (this.pulseCd <= 0) {
        this.pulseT = 1;
        this.eyes(0.8);
      }
    }
    if (this.mendT > 0) {
      this.mendT -= dt;
      f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.06 * dt);
      if (Math.random() < 0.5) blackMend(g, f);
    }
  }

  target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 80, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 80);
  }

  private near(range: number): Fighter | null {
    const t = this.target();
    return t && t.pos.distanceTo(this.f.pos) <= range ? t : null;
  }

  isMarked(t: Fighter): boolean {
    return !!this.marked && this.marked.f === t && this.g.time <= this.marked.until;
  }

  /** the misfortune stored in the shield */
  stored(): number {
    let s = 0;
    for (const v of this.store.values()) s += v.amt;
    return s;
  }

  // ---------------------------------------------------------------- The Balance

  private parry(amount: number, from: Fighter | null, o: { energy?: boolean; quiet?: boolean }): boolean {
    const { f, g } = this;
    if (!from || from === f) return false;
    // the night: what he has already seen does not touch him
    if (this.form !== 'day' && this.pulseT > 0 && !o.quiet) {
      this.pulseT = 0;
      this.pulseCd = 3;
      const away = f.pos.clone().sub(from.pos).setY(0);
      if (away.lengthSq() < 1e-4) away.set(1, 0, 0);
      away.normalize();
      const side = new THREE.Vector3(-away.z, 0, away.x).multiplyScalar(Math.random() < 0.5 ? 1 : -1);
      f.push.addScaledVector(side, 9).addScaledVector(away, 3);
      f.ghosts.spawn(0.4, 1);
      this.eyes(1);
      if (f === g.player) g.hud?.showBanner('Foreseen');
      return true;
    }
    // the shield raised: blows from the front and every shot go into the shield
    if (this.form === 'day' && this.shieldUp && this.shieldWhole) {
      const to = _v.subVectors(from.pos, f.pos).setY(0).normalize();
      const front = to.dot(f.forward(_w)) > 0.25;
      if (o.energy || front) {
        this.absorb(from, amount * powerOf(g, from));
        shieldFlash(g, sock(f, 'shield'), true);
        g.sfx.play('ting', f.center(), 0.9);
        return true;
      }
    }
    return false;
  }

  /** the half he took is reflected onto whoever dealt it; the shield's half is stored */
  private onHurt(amount: number): void {
    const { f, g } = this;
    if (this.form !== 'day' || !this.shieldWhole || f.dead) return;
    const from = f.lastHurt.from;
    if (!from || from === f || from.dead) return;
    this.owed.push({ to: from, amt: amount, at: g.time + 0.4 });
    this.absorb(from, amount);
    const c = f.center();
    g.engine.glow.spawn({ x: c.x, y: c.y + 0.6, z: c.z, size: 0.9, sizeEnd: 0.3, life: 0.3, r: 0.91, g: 0.77, b: 0.35, alpha: 0.7, alphaEnd: 0, tex: TEX_GLOW });
  }

  /** misfortune into the shield (capped), and the strain on it */
  private absorb(from: Fighter, amt: number): void {
    const e = this.store.get(from.id);
    const room = Math.max(0, STORE_MAX - this.stored());
    if (e) e.amt += Math.min(room, amt);
    else this.store.set(from.id, { f: from, amt: Math.min(room, amt) });
    this.strain += amt;
    if (this.strain >= STRAIN_MAX) this.shatter(false);
  }

  /** a wound of exactly `amt` on `t`, from him, through any guard */
  private wound(t: Fighter, amt: number, big: boolean): void {
    const { f, g } = this;
    const dir = t.pos.clone().sub(f.pos).setY(0);
    if (dir.lengthSq() < 1e-4) dir.set(0, 0, 1);
    // (their own misfortune turned back on them: it lands even on a body that blows pass through)
    g.damage(t, amt / powerOf(g, f), f, dir.normalize(), { unblockable: true, reflected: t, heavy: big || amt > 60, knock: big ? 8 : 3, hitstop: big ? 0.1 : 0.04, shake: big ? 0.3 : 0.1, color: SCALES_GOLD });
    const c = t.center();
    for (let i = 0; i < (big ? 18 : 8); i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: Math.cos(a) * 3, vy: (Math.random() - 0.3) * 3, vz: Math.sin(a) * 3, size: 0.07, sizeEnd: 0.02, life: 0.35, r: 0.95, g: 0.8, b: 0.4, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2, drag: 3 });
    }
  }

  /** the shield cracks apart under the strain (or is wrenched away) */
  private shatter(knocked: boolean): void {
    const { f, g } = this;
    if (!this.shieldWhole) return;
    this.shieldWhole = false;
    this.shieldUp = false;
    this.shieldBack = SHIELD_BACK;
    this.strain = 0;
    const at = sock(f, 'shield');
    f.visual.detach('shield');
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, vx: Math.cos(a) * 4, vy: Math.random() * 4, vz: Math.sin(a) * 4, size: 0.12, sizeEnd: 0.03, life: 0.6, r: 0.88, g: 0.71, b: 0.29, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2, gravity: -6 });
    }
    g.sfx.play('shatter', at, 0.8);
    if (f === g.player) g.hud?.showBanner(knocked ? 'The shield is knocked away' : 'Freund Schild shattered');
    this.applyStats();
  }

  private resummon(): void {
    const { f, g } = this;
    this.shieldWhole = true;
    f.visual.attach('shield', haschwalthProp('shield'), 'shield');
    shieldFlash(g, sock(f, 'shield'), true);
    g.callout('身代わりの盾', 'FREUND SCHILD', SHIELD_GOLD);
    this.applyStats();
  }

  /** the raised shield's arm (a layer over whatever else he does) */
  private layerGuard(): void {
    const f = this.f;
    const want = this.form === 'day' && this.shieldUp && this.shieldWhole && !f.dead;
    if (want && !this.guarding) {
      this.guarding = true;
      f.anim.play('hw_guard', { fadeIn: 0.12 });
    } else if (!want && this.guarding) {
      this.guarding = false;
      for (const a of f.anim.active) if (a.clip.name === 'hw_guard') a.ending = true;
    }
  }

  private raise(on: boolean): void {
    if (this.shieldUp === on) return;
    this.shieldUp = on;
    this.applyStats();
  }

  /** the eyes flash: red at a foresight pulse */
  private eyes(k: number): void {
    const { f, g } = this;
    for (const n of ['eye.L', 'eye.R']) {
      const p = sock(f, n);
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.14 * k, sizeEnd: 0.04, life: 0.3, r: 0.75, g: 0.09, b: 0.16, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    }
  }

  // ---------------------------------------------------------------- moves

  /** the pommel into the face: a short, hard stagger */
  pommel(): void {
    const { f, g } = this;
    const t = this.near(2.2);
    if (!t) return;
    const fw = f.forward();
    _v.subVectors(t.pos, f.pos).setY(0);
    if (_v.dot(fw) < 0) return;
    g.damage(t, 16, f, fw, { knock: 9, heavy: true, hitstop: 0.08, shake: 0.2, unblockable: this.isMarked(t), color: SCALES_GOLD });
    g.sparks(t.center().add(new THREE.Vector3(0, 0.4, 0)), fw.clone().negate(), '#F3E3B0', 8);
  }

  /** Judgment's split: a thin cut through the world in the plane of the stroke, straight ahead */
  slice(len: number): void {
    const { f, g } = this;
    const fw = f.forward();
    const c = f.center().addScaledVector(fw, 1 + len / 2);
    const right = new THREE.Vector3(-fw.z, 0, fw.x);
    _m.makeBasis(right, UP, fw);
    _q.setFromRotationMatrix(_m);
    g.engine.destruction.carve(new BoxShape(c, new THREE.Vector3(0.06, 3.2, len / 2), _q.clone()), { mode: 'cut', power: 1400, dir: right, sparks: [0.95, 0.95, 1], dust: 0.4 });
    for (let i = 0; i < 20; i++) {
      const p = f.center().addScaledVector(fw, 1 + (i / 20) * len);
      g.engine.glow.spawn({ x: p.x, y: p.y + (Math.random() - 0.5) * 3, z: p.z, size: 0.22, sizeEnd: 0.02, life: 0.3, r: 1, g: 1, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2 });
    }
  }

  /** Q (day): three stars thrown off the blade in a fan */
  blast(): void {
    const { f, g } = this;
    const from = f.center().addScaledVector(f.forward(_v), 0.9);
    const t = this.target();
    const aim = (t ? t.center() : from.clone().addScaledVector(f.forward(_w), 30)).sub(from).normalize();
    for (const a of [-0.16, 0, 0.16]) {
      const d = aim.clone().applyAxisAngle(UP, a);
      g.addProjectile(new StarBlast(f, g, from.clone().addScaledVector(d, 0.3), d, 18));
    }
    g.sfx.play('getsuga', from, 0.7);
  }

  /** E with misfortune stored: the scales tip — each recent attacker takes back what the shield drank */
  tip(): void {
    const { f, g } = this;
    let paid = 0;
    for (const { f: o, amt } of this.store.values()) {
      if (o.dead || amt < 1) continue;
      this.wound(o, amt, true);
      paid += amt;
    }
    this.store.clear();
    this.strain = Math.max(0, this.strain - paid * 0.5);
    g.callout('世界調和', 'THE BALANCE — THE SCALES TIP', SCALES_GOLD);
    g.sfx.play('bankai', f.center(), 0.6);
    g.shake(f === g.player ? 0.35 : 0.15);
  }

  /** R (day): Fortune Inversion — the target's guard fails, its constructs split */
  invert(t: Fighter): void {
    const { f, g } = this;
    this.marked = { f: t, until: g.time + 6 };
    g.addProjectile(new InversionMark(g, t, 6));
    g.rejectNear(t.center(), 4, f, true);
    if (t.action && /guard|parry|block|catch|shield|stance|read/i.test(t.action.name)) t.stopAction();
    g.callout('', 'FORTUNE INVERSION', SCALES_GOLD);
    g.sfx.play('ting', t.center(), 0.8);
  }

  /** Q (night): the black slash */
  blackSlash(): void {
    const { f, g } = this;
    const fw = f.forward();
    const t = this.target();
    const dir = t ? t.center().sub(f.center()).normalize() : fw.clone();
    const side = new THREE.Vector3(-dir.z, 0.6, dir.x).normalize();
    const v = this.form === 'vessel';
    g.addProjectile(new GetsugaProjectile(g, f, f.center().addScaledVector(dir, 1.2), dir, side, { radius: v ? 6 : 3.6, halfAngle: 0.95, speed: 46, range: 70, damage: v ? 56 : 40, cut: v ? 1800 : 1200, colors: BLACK, dark: true }));
    g.sfx.play('getsuga', f.center(), 0.9);
  }

  /** R (night): black thorns under the target; it is held */
  thorns(t: Fighter): void {
    const { f, g } = this;
    const v = this.form === 'vessel';
    const pts: { p: THREE.Vector3; delay: number; h?: number }[] = [{ p: t.pos.clone(), delay: 0.05, h: v ? 3.6 : 2.6 }];
    for (let i = 0; i < (v ? 8 : 4); i++) {
      const a = (i / (v ? 8 : 4)) * Math.PI * 2;
      pts.push({ p: t.pos.clone().add(new THREE.Vector3(Math.cos(a) * 1.3, 0, Math.sin(a) * 1.3)), delay: 0.1 + i * 0.03, h: v ? 2.8 : 2 });
    }
    g.addProjectile(new ShadowSpikes(g, f, pts, v ? 20 : 14, 1.6));
    if (this.thorned) this.thorned.f.rooted = false;
    this.thorned = { f: t, until: g.time + 2 };
  }

  // ---------------------------------------------------------------- forms

  private becomeNight(): void {
    const { f, g } = this;
    if (this.form !== 'day') return;
    this.form = 'night';
    this.nightT = NIGHT_TIME;
    this.pulseCd = 0.5;
    this.pulseT = 0;
    this.shieldUp = false;
    this.store.clear();
    f.setForm({ asset: haschwalthAsset('night'), props: this.shieldWhole ? props() : props().slice(0, 1) }, AURA_NIGHT, BLADE_NIGHT);
    f.aura.flare(1.6, 0.8);
    g.callout('全知全能', 'THE ALMIGHTY', NIGHT_RED);
    g.sfx.play('bankai', f.center(), 0.8);
    this.applyStats();
  }

  private becomeVessel(): void {
    const { f, g } = this;
    if (this.form !== 'night') return;
    this.form = 'vessel';
    this.vesselT = VESSEL_TIME;
    f.setForm({ asset: haschwalthAsset('vessel'), props: this.shieldWhole ? props() : props().slice(0, 1) }, AURA_NIGHT, BLADE_NIGHT);
    f.aura.pillarBurst(2.2);
    f.aura.flare(2, 1);
    g.addRing(f.pos.clone(), 14, '#2A1A22', 0.6);
    g.shake(f === g.player ? 0.5 : 0.2);
    g.slowMo(0.3, 0.4);
    g.callout('', 'hAschwAlth', NIGHT_RED);
    g.sfx.play('bankai', f.center());
    this.applyStats();
  }

  private leaveVessel(): void {
    const { f } = this;
    this.form = 'night';
    this.vesselCd = VESSEL_CD;
    f.setForm({ asset: haschwalthAsset('night'), props: this.shieldWhole ? props() : props().slice(0, 1) }, AURA_NIGHT, BLADE_NIGHT);
    this.applyStats();
  }

  /** dawn: The Almighty goes back to its owner, The Balance comes back to him */
  private dawn(): void {
    const { f, g } = this;
    this.form = 'day';
    this.nightCd = NIGHT_CD;
    this.mendT = 0;
    f.setForm({ asset: haschwalthAsset('day'), props: this.shieldWhole ? props() : props().slice(0, 1) }, AURA_DAY, BLADE);
    g.callout('', 'DAWN — THE BALANCE', SCALES_GOLD);
    this.applyStats();
  }

  private applyStats(): void {
    const f = this.f;
    const night = this.form === 'night', vessel = this.form === 'vessel';
    f.power = (vessel ? 1.8 : night ? 1.35 : 1.15) * (this.flare ? 1.25 : 1);
    f.damageTaken = vessel ? 0.7 : night ? 1 : this.shieldWhole ? 0.5 : 1;
    f.toughness = vessel ? 10 : 6;
    const slow = this.form === 'day' && this.shieldUp ? 0.55 : 1;
    f.def = { ...f.def, speed: { ...SPEED, run: SPEED.run * slow, sprint: SPEED.sprint * slow } };
    f.aura.target = this.flare ? 0.9 : vessel ? 0.6 : night ? 0.3 : 0.05;
  }

  // ---------------------------------------------------------------- input

  /** the sword arm and the shield arm cannot both be committed: an attack lowers the raised shield */
  private lower(): void {
    if (this.shieldUp) this.raise(false);
  }

  attack(): void {
    const f = this.f;
    this.lower();
    const cur = f.action;
    if (cur instanceof SwingAction && HASCHWALTH_CHAIN.includes(cur.clip)) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const idx = i % HASCHWALTH_CHAIN.length;
    const clip = HASCHWALTH_CHAIN[idx];
    this.comboIndex = idx + 1;
    this.lastEnd = this.g.time + 0.65;
    const t = this.target();
    const marked = !!t && this.isMarked(t);
    const night = this.form !== 'day', vessel = this.form === 'vessel';
    const exec = clip === 'hw_exec', pom = clip === 'hw_pommel';
    const spec: BladeSpec = {
      damage: (exec ? 34 : 22) * (marked ? 1.3 : 1), knock: exec ? 14 : 6, launch: exec ? 2 : 0, heavy: exec, hitstop: exec ? 0.1 : 0.06, shake: exec ? 0.35 : 0.15,
      cut: exec ? 900 : 520, reach: vessel ? 0.7 : night ? 0.42 : 0.24, thick: vessel ? 0.12 : undefined, unblockable: marked,
    };
    this.f.act(new SwingAction(this, clip, idx, { spec, noBlade: pom, onEvent: (n) => pom && n === 'hit' && this.pommel() }), true);
  }

  private special(a: FighterAction, cost: number, cdKey: keyof typeof this.cd, cd: number): boolean {
    const f = this.f;
    if (this.cd[cdKey] > 0) return false;
    if (f.action && !f.action.canCancel(a)) return false;
    if (f.hitstun > 0 || f.dashT > 0 || f.dead) return false;
    if (!f.spendRei(cost)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return false;
    }
    this.cd[cdKey] = cd;
    f.act(a, true);
    return true;
  }

  private needTarget(range: number, what: string): Fighter | null {
    const t = this.near(range);
    if (!t && this.f === this.g.player) this.g.hud?.showBanner(`No one in reach for ${what}`);
    return t;
  }

  /** RMB: Judgment; night: the foreseen verdict; the vessel: a black wave, then the stroke from behind */
  heavy(): void {
    const { f, g } = this;
    this.lower();
    if (this.form === 'day') {
      const t = this.target();
      const marked = !!t && this.isMarked(t);
      const spec: BladeSpec = { damage: 46 * (marked ? 1.3 : 1), knock: 16, launch: 2, heavy: true, hitstop: 0.14, shake: 0.45, cut: 1400, reach: 0.4, unblockable: marked, onHit: (o) => { o.disarmT = Math.max(o.disarmT, 3); g.sfx.play('shatter', o.center(), 0.5); } };
      this.special(new SwingAction(this, 'hw_judgment', 0, { spec, slice: 6, onEvent: (n) => n === 'raise' && g.callout('', 'JUDGMENT', BLADE.color) }), 10, 'heavy', 2.6);
      return;
    }
    if (this.form === 'night') {
      const live = this.pulseT > 0;
      const spec: BladeSpec = { damage: 40, knock: 12, launch: 1, heavy: true, hitstop: 0.12, shake: 0.35, cut: 900, reach: 0.5, unblockable: live };
      if (this.special(new SwingAction(this, 'hw_verdict', 0, { spec, lead: 0.35 }), 10, 'verdict', 2.4) && live) {
        this.pulseT = 0;
        this.pulseCd = 3;
        this.eyes(1);
      }
      return;
    }
    // the vessel: the black rolls at them, and he is already behind them
    const t = this.needTarget(30, "the vessel's verdict");
    if (!t) return;
    const spec: BladeSpec = { damage: 52, knock: 16, launch: 3, heavy: true, hitstop: 0.14, shake: 0.5, cut: 1600, reach: 0.8, thick: 0.12, unblockable: true };
    const a = new SwingAction(this, 'hw_exec', 0, { spec });
    if (this.cd.verdict > 0 || f.rei < 16 || f.hitstun > 0 || f.dashT > 0 || (f.action && !f.action.canCancel(a))) return;
    const dir = t.pos.clone().sub(f.pos).setY(0).normalize();
    g.addProjectile(new BlackWave(g, f, dir, 30, 20, 6));
    f.ghosts.spawn(0.5, 1);
    const behind = t.pos.clone().addScaledVector(t.forward(_v), -1.6);
    f.body.pos.set(behind.x, Math.max(t.pos.y, f.pos.y - 0.5), behind.z);
    f.body.prev.copy(f.body.pos);
    f.body.vel.set(0, 0, 0);
    f.yaw = Math.atan2(t.pos.x - f.pos.x, t.pos.z - f.pos.z);
    f.faceTarget = t.center();
    this.special(a, 16, 'verdict', 3);
  }

  /** Q: the sword blast; night: the black slash */
  skill1(): void {
    this.lower();
    if (this.form === 'day') {
      this.special(new SwingAction(this, 'hw_blast', 0, { spec: { damage: 14, knock: 4, launch: 0, hitstop: 0.05, shake: 0.12, cut: 400, reach: 0.2 }, onEvent: (n) => n === 'fire' && this.blast() }), 14, 'blast', 3);
      return;
    }
    this.special(new SwingAction(this, 'hw_bslash', 0, { spec: { damage: 24, knock: 8, launch: 1, heavy: true, hitstop: 0.08, shake: 0.25, cut: 900, reach: 0.4 }, onEvent: (n) => n === 'fire' && this.blackSlash() }), 18, 'bslash', 4);
  }

  /** E: Tip the Scales (or the Key); night: the torrent */
  skill2(): void {
    const { f, g } = this;
    this.lower();
    if (this.form === 'day') {
      if (this.stored() >= 40) {
        this.special(new ClipSkill(this, 'scales', 'hw_scales', (n) => {
          if (n === 'raise') g.addProjectile(new BalanceScales(g, f, 0.32, 1.5, 1));
          if (n === 'tip') this.tip();
        }, { armor: 0.4, mobility: 0 }), 16, 'scales', 6);
        return;
      }
      this.special(new ClipSkill(this, 'key', 'hw_key', (n) => {
        if (n === 'rune') {
          g.addProjectile(new TheKey(g, f, 0.32, 60, 4));
          g.callout('鍵を', 'THE KEY', KEY_WHITE);
        }
      }, { armor: 0.5, mobility: 0 }), 34, 'scales', 12);
      return;
    }
    const v = this.form === 'vessel';
    this.special(new ClipSkill(this, 'torrent', 'hw_torrent', (n) => {
      if (n !== 'pour') return;
      g.addProjectile(new BlackTorrent(g, f, f.center().addScaledVector(f.forward(_v), 1.4), this.target(), v ? 14 : 10, 3, v ? 2.6 : 1.6));
      g.sfx.play('charge', f.center(), 0.8);
    }, { mobility: 0.1 }), 22, 'torrent', 7);
  }

  /** R: Fortune Inversion; night: the thorns */
  skill3(): void {
    this.lower();
    if (this.form === 'day') {
      const t = this.needTarget(30, 'Fortune Inversion');
      if (!t) return;
      this.special(new ClipSkill(this, 'invert', 'hw_invert', (n) => n === 'mark' && this.invert(t), { mobility: 0.1 }), 18, 'invert', 10);
      return;
    }
    const t = this.needTarget(30, 'the thorns');
    if (!t) return;
    this.special(new ClipSkill(this, 'thorns', 'hw_thorns', (n) => n === 'thorns' && this.thorns(t), { mobility: 0.2 }), 18, 'thorns', 6);
  }

  /** F: night; at night, hAschwAlth */
  release(): void {
    const { f, g } = this;
    if (f.busy) return;
    if (this.form === 'day') {
      if (this.nightCd > 0) {
        if (f === g.player) g.hud?.showBanner('The sun is still up');
        return;
      }
      f.act(new ClipSkill(this, 'release', 'hw_night', (n) => n === 'open' && this.becomeNight(), { invulnerable: true, mobility: 0 }), true);
      return;
    }
    if (this.form === 'night') {
      if (this.vesselCd > 0) {
        if (f === g.player) g.hud?.showBanner('Not yet');
        return;
      }
      if (!f.spendRei(60)) {
        if (f === g.player) g.hud?.showBanner('Not enough reiatsu');
        return;
      }
      f.act(new ClipSkill(this, 'release', 'hw_vessel', (n) => n === 'burst' && this.becomeVessel(), { invulnerable: true, mobility: 0 }), true);
    }
  }

  /** G: the Freund Schild raised (or called back); night: the black mend */
  toggle(): void {
    const { f, g } = this;
    if (this.form === 'day') {
      if (!this.shieldWhole) {
        if (this.shieldBack > 0) {
          if (f === g.player) g.hud?.showBanner('The shield is not back yet');
          return;
        }
        if (!f.spendRei(20)) return;
        this.resummon();
        return;
      }
      this.raise(!this.shieldUp);
      if (this.shieldUp) g.sfx.play('ting', f.center(), 0.6);
      return;
    }
    this.special(new ClipSkill(this, 'mend', 'hw_mend', (n) => {
      if (n !== 'mend') return;
      this.mendT = 4;
      g.callout('', 'THE BLACK MENDS HIM', NIGHT_RED);
    }, { mobility: 0.2 }), 24, 'mend', 14);
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
    if (this.form === 'vessel') return `hAschwAlth · ${Math.max(0, Math.ceil(this.vesselT))} s`;
    if (this.form === 'night') return `The Almighty · night ${Math.max(0, Math.ceil(this.nightT))} s`;
    return this.shieldWhole ? 'Grandmaster — The Balance' : 'Grandmaster — the shield broken';
  }

  ai(): KitAI {
    const day = () => this.form === 'day';
    const night = () => this.form !== 'day';
    return {
      // a counter-fighter: he holds his ground and lets them come into the sword's reach
      reach: 2.8,
      chain: 4,
      releaseAt: [0.55, 0.3],
      toggleAt: 1,
      toggleOn: () => this.form !== 'day' || this.shieldUp || !this.shieldWhole && this.shieldBack > 0,
      moves: [
        { name: 'judgment', use: () => this.heavy(), min: 0, max: 5, weight: 1.6, cd: 3, when: day },
        { name: 'blast', use: () => this.skill1(), min: 5, max: 40, weight: 1.6, cd: 3 },
        { name: 'tip', use: () => this.skill2(), min: 0, max: 60, weight: 9, cd: 2, when: () => day() && this.stored() >= 150 },
        { name: 'key', use: () => this.skill2(), min: 0, max: 5, weight: 1.4, cd: 12, when: () => day() && this.stored() < 40 },
        { name: 'invert', use: () => this.skill3(), min: 2, max: 20, weight: 1.2, cd: 10, when: day },
        { name: 'shieldoff', use: () => this.raise(false), min: 0, max: 4, weight: 2, cd: 4, when: () => day() && this.shieldUp },
        { name: 'shieldon', use: () => this.toggle(), min: 8, max: 60, weight: 1.2, cd: 5, when: () => day() && this.shieldWhole && !this.shieldUp },
        { name: 'resummon', use: () => this.toggle(), min: 0, max: 99, weight: 5, cd: 2, when: () => day() && !this.shieldWhole && this.shieldBack <= 0 },
        { name: 'verdict', use: () => this.heavy(), min: 2, max: 9, weight: 2, cd: 2.4, when: () => night() && (this.pulseT > 0 || this.form === 'vessel') },
        { name: 'bslash', use: () => this.skill1(), min: 4, max: 40, weight: 1.4, cd: 4, when: night },
        { name: 'torrent', use: () => this.skill2(), min: 4, max: 30, weight: 1.2, cd: 7, when: night },
        { name: 'thorns', use: () => this.skill3(), min: 2, max: 25, weight: 1.2, cd: 6, when: night },
        { name: 'mend', use: () => this.toggle(), min: 6, max: 99, weight: 3, cd: 14, when: () => night() && this.f.hp < this.f.maxHp * 0.6 },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    if (this.form !== 'day') {
      const v = this.form === 'vessel';
      return [
        { key: 'LMB', name: 'Black blade', kanji: '処断' },
        { key: 'RMB', name: v ? "Vessel's verdict" : 'Foreseen verdict', kanji: '予見', cost: v ? 16 : 10, cd: cd.verdict, cdMax: v ? 3 : 2.4, active: this.pulseT > 0, tint: NIGHT_RED },
        { key: 'Q', name: 'Black slash', kanji: '黒斬', cost: 18, cd: cd.bslash, cdMax: 4 },
        { key: 'E', name: 'Black torrent', kanji: '黒流', cost: 22, cd: cd.torrent, cdMax: 7 },
        { key: 'R', name: 'Black thorns', kanji: '黒棘', cost: 18, cd: cd.thorns, cdMax: 6 },
        { key: 'F', name: v ? 'hAschwAlth' : 'hAschwAlth', kanji: '器', cost: 60, cd: v ? 0 : this.vesselCd, cdMax: VESSEL_CD, active: v, timer: v ? this.vesselT / VESSEL_TIME : this.nightT / NIGHT_TIME, tint: NIGHT_RED },
        { key: 'G', name: 'Black mend', kanji: '黒癒', cost: 24, cd: cd.mend, cdMax: 14, active: this.mendT > 0 },
        { key: 'Shift', name: 'Unseen step', kanji: '歩', cost: 4 },
        { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      ];
    }
    const st = this.stored();
    return [
      { key: 'LMB', name: 'Blade of Judgment', kanji: '処断の刃' },
      { key: 'RMB', name: 'Judgment', kanji: '処断', cost: 10, cd: cd.heavy, cdMax: 2.6 },
      { key: 'Q', name: 'Sword blast', kanji: '剣光', cost: 14, cd: cd.blast, cdMax: 3 },
      st >= 40
        ? { key: 'E', name: `Tip the Scales ${Math.round(st)}`, kanji: '世界調和', cost: 16, cd: cd.scales, cdMax: 6, active: true, tint: SCALES_GOLD }
        : { key: 'E', name: 'The Key', kanji: '鍵を', cost: 34, cd: cd.scales, cdMax: 12, tint: KEY_WHITE },
      { key: 'R', name: 'Fortune Inversion', kanji: '反転', cost: 18, cd: cd.invert, cdMax: 10 },
      { key: 'F', name: 'The Almighty', kanji: '全知全能', cd: this.nightCd, cdMax: NIGHT_CD, tint: NIGHT_RED },
      this.shieldWhole
        ? { key: 'G', name: 'Freund Schild', kanji: '身代わりの盾', active: this.shieldUp, tint: SHIELD_GOLD }
        : { key: 'G', name: 'Re-summon shield', kanji: '盾', cost: 20, cd: this.shieldBack, cdMax: SHIELD_BACK, tint: SHIELD_GOLD },
      { key: 'Shift', name: 'Unseen step', kanji: '歩', cost: 4 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
    ];
  }
}
