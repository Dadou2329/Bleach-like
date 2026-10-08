// Meninas McAllon's kit (docs/kits/meninas.md). The Power: everything she does is too heavy to stop. LMB heavy punches —
// a jab, a straight, a hook, a hammer fist that craters and sends them through walls; RMB The Power (the right arm swells
// and the punch puts them through every building behind; at range the small heart bow); Q Diamond Push (a diamond of
// force that bores a tunnel and carries them along it); E Lift & Throw (a real chunk of the world ripped out and hurled;
// in Muscle Up the Building Drop); R Head-Grab Drive (on them before they react, run through a row of buildings, slammed
// down); G Muscle Up (both arms swollen: harder, armoured, the Building Drop). A target with its back to her takes half
// again. F: Quincy: Vollständig — Pornipora (heart wings, flight, dumbbells): LMB Dumbbell Duster, RMB Diamond Push,
// Q Baton Beat, E Halteres, R the head-grab, G Sklaverei, F the Building Drop from the sky.
import * as THREE from 'three';
import { FighterAction, type Fighter, type FighterDef, type PropDef } from '../fighter';
import type { Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import type { AuraStyle } from '../../vfx/aura';
import { meninasAsset, meninasProp } from '../../chars/meninas';
import { MENINAS_CHAIN, MENINAS_CLIPS, MENINAS_STANCE, PORNIPORA_CHAIN, PORNIPORA_CLIPS, PORNIPORA_STANCE } from '../../chars/meninasClips';
import { DiamondPush, HeartArrow, LiftedChunk, PINK, chunkKeys, flexCracks } from '../../vfx/power';
import { Plow } from '../../vfx/engetsu';
import { LightPillar, sklaverei } from '../../vfx/heilig';
import { BoxShape, SphereShape } from '../../destruction/shapes';
import { raycastVoxels } from '../../voxel/raycast';
import { groundAt } from '../../vfx/iceArts';
import { TEX_PUFF, TEX_STREAK } from '../../vfx/sprites';
import { hirenkyakuPuff, hirenkyakuStreak, vollFlight, type Rgb } from './sternritter';

export const AURA_POWER: AuraStyle = { core: '#FFE6F2', body: '#FF9ECB', rim: '#A8306A' };
export const AURA_PORNIPORA: AuraStyle = { core: '#FFF2F8', body: '#FF7EB8', rim: '#E0408A' };

const SPEED = { run: 9.8, sprint: 27, jump: 13, dash: 30, dashTime: 0.1 };
const SPEED_PORNI = { run: 12, sprint: 34, jump: 14, dash: 36, dashTime: 0.1 };
const PORNI_TIME = 30;
const PORNI_CD = 20;
const MUSCLE_TIME = 10;
const TINT: Rgb = [1, 0.5, 0.75];

export const MENINAS_DEF: FighterDef = {
  id: 'meninas',
  name: 'Meninas McAllon',
  title: 'Sternritter "P" — The Power',
  build: () => ({ asset: meninasAsset('base'), props: [] }),
  stance: MENINAS_STANCE,
  clips: MENINAS_CLIPS,
  aura: AURA_POWER,
  hp: 1150,
  rei: 210,
  speed: { ...SPEED },
  radius: 0.3,
  height: 1.91,
};

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

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

  constructor(readonly kit: MeninasKit, readonly clip: string, readonly index: number, readonly onEvent: (n: string) => void, readonly stop = 1.3) {
    super();
    this.name = clip;
    this.mobility = 0.14;
    this.airGravity = 0.2;
  }

  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.62;
    this.hitAt = c.events.hit ?? -1;
    // swollen arms: her blows plough on through what hits her
    this.armor = this.kit.muscleT > 0 ? 0.35 : 0;
    const tgt = f.faceTarget;
    let dashed = false;
    if (tgt && this.hitAt > 0) {
      const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
      this.stopAt = this.stop;
      if (d > this.stopAt + 0.25 && d < 7) {
        const tau = Math.max(0.06, this.hitAt - 0.06);
        const per = (1 - Math.exp(-f.pushDrag * tau)) / f.pushDrag;
        f.push.addScaledVector(f.forward(), Math.min(28, (d - this.stopAt) / per));
        dashed = true;
      }
    }
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n === 'step') {
          if (!dashed) f.push.addScaledVector(f.forward(), 2.5);
          g.sfx.play('swingHeavy', f.center(), 0.6);
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
    if (this.queued && this.t >= this.comboAt) {
      this.done = true;
      this.kit.chain(this.index + 1);
      return;
    }
    if (this.t >= this.dur) this.done = true;
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
  lunge?: number;
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

/**
 * Head-Grab Drive: she closes on the target in a blink, takes its head in one hand and runs it through everything in
 * front of her for a second, then lifts and slams it into the ground.
 */
class HeadGrabAction extends FighterAction {
  readonly name = 'headgrab';
  private phase: 'dash' | 'drive' | 'slam' = 'dash';
  private pt = 0;
  private tick = 0;
  private dir = new THREE.Vector3();
  private slammed = false;
  victim: Fighter | null = null;

  constructor(readonly kit: MeninasKit, readonly target: Fighter) {
    super();
    this.mobility = 0;
    this.armor = 0.5;
    this.airGravity = 0.3;
    this.trackTarget = false;
  }

  override start(f: Fighter, g: Game): void {
    f.anim.play('mn_grab');
    this.dir.subVectors(this.target.pos, f.pos).setY(0).normalize();
    f.yaw = Math.atan2(this.dir.x, this.dir.z);
    hirenkyakuPuff(g, f, TINT);
  }

  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    this.pt += dt;
    const t = this.target;
    if (this.phase === 'dash') {
      // a blink across the gap
      const to = _v.subVectors(t.pos, f.pos).setY(0);
      const d = to.length();
      if (d < 1.3 || this.pt > 0.4) {
        if (d > 2.4 || t.dead) {
          this.done = true;
          return;
        }
        this.victim = t;
        t.stopAction();
        this.phase = 'drive';
        this.pt = 0;
        this.dir.copy(f.forward());
        f.anim.play('mn_drive', { fadeIn: 0.06 });
        g.callout('', 'Excuse me…', PINK);
        g.sfx.play('hitHeavy', t.center(), 0.8);
        return;
      }
      f.body.pos.addScaledVector(to.normalize(), Math.min(d - 1.0, 34 * dt));
      hirenkyakuStreak(g, f, TINT);
      return;
    }
    const v = this.victim!;
    if (this.phase === 'drive') {
      // run it through everything ahead
      f.yaw = Math.atan2(this.dir.x, this.dir.z);
      f.push.set(0, 0, 0);
      f.body.pos.addScaledVector(this.dir, 17 * dt);
      const hold = _v.copy(f.pos).addScaledVector(this.dir, 1.1);
      v.body.pos.set(hold.x, f.pos.y + 0.15, hold.z);
      v.body.vel.set(0, 0, 0);
      v.hitstun = Math.max(v.hitstun, 0.4);
      g.engine.destruction.carve(new SphereShape(v.center().addScaledVector(this.dir, 0.6), 1.35, 0.5), { mode: 'smash', power: 1000, impulse: 12, dir: this.dir.clone(), dust: 0.7 });
      if ((this.tick -= dt) <= 0) {
        this.tick = 0.12;
        g.damage(v, 5, f, this.dir.clone(), { knock: 0, quiet: true });
      }
      if (Math.random() < 0.6) g.engine.dust.spawn({ x: v.pos.x, y: v.pos.y + 1, z: v.pos.z, vx: -this.dir.x * 3, vy: 1, vz: -this.dir.z * 3, size: 0.8, sizeEnd: 2.2, life: 0.6, r: 0.6, g: 0.57, b: 0.52, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 1.5 });
      if (this.pt >= 1.0 || v.dead) {
        this.phase = 'slam';
        this.pt = 0;
        f.anim.play('mn_slam', { fadeIn: 0.05 });
      }
      return;
    }
    // the slam
    if (!this.slammed && this.pt < 0.32) {
      const hold = _v.copy(f.pos).addScaledVector(this.dir, 0.9);
      v.body.pos.set(hold.x, f.pos.y + 0.6 + Math.sin(Math.min(1, this.pt / 0.18) * Math.PI) * 1.2, hold.z);
      v.body.vel.set(0, 0, 0);
      v.hitstun = Math.max(v.hitstun, 0.4);
    }
    if (!this.slammed && this.pt >= 0.32) {
      this.slammed = true;
      const at = v.pos.clone();
      g.damage(v, 50, f, this.dir.clone(), { knock: 6, heavy: true, hitstop: 0.14, shake: 0.6 });
      v.hitstun = Math.max(v.hitstun, 0.9);
      g.groundImpact(at, 2.2, 800, '#C0B8A8', f);
    }
    if (this.pt >= 0.75) this.done = true;
  }

  override end(f: Fighter): void {
    if (this.victim && !this.victim.dead) this.victim.body.vel.set(0, 0, 0);
    f.anim.stopAll(0.15);
  }
}

// ---------------------------------------------------------------------------------------------- the kit

type Form = 'base' | 'pornipora';
type Side = 'L' | 'R';

export class MeninasKit implements Kit {
  form: Form = 'base';
  flare = false;
  comboIndex = 0;
  private lastEnd = 0;
  porniT = 0;
  porniCd = 0;
  sklav = false;
  muscleT = 0;
  private swellNow: Record<Side, number> = { L: 0, R: 0 };
  private swellWant: Record<Side, number> = { L: 0, R: 0 };
  private powerArm = 0;
  private wasDashing = false;
  private dashCarve = 0;
  private backT = -99;
  private diveT = 0;
  private riseT = 0;
  readonly cd = { power: 0, bow: 0, diamond: 0, lift: 0, grab: 0, flex: 0, baton: 0, halteres: 0, sklav: 0, drop: 0 };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.data.quincy = true;
    this.hands();
    this.applyStats();
  }

  private hands(): void {
    const rig = this.f.visual.rig;
    const p = this.f.visual.props;
    const r = p.has('dumbbell') || p.has('baton') || p.has('halteres') || p.has('muscle.fore.R');
    const l = p.has('dumbbell2') || p.has('baton2') || p.has('bow') || p.has('muscle.fore.L');
    rig.setBoneVisible('fist.R', r);
    rig.setBoneVisible('palm.R', !r);
    rig.setBoneVisible('fist.L', l);
    rig.setBoneVisible('palm.L', !l);
  }

  private props(): PropDef[] {
    if (this.form !== 'pornipora') return [];
    return [
      { key: 'halo', model: meninasProp('halo'), socket: 'halo' },
      { key: 'dumbbell', model: meninasProp('dumbbell'), socket: 'grip.R' },
      { key: 'dumbbell2', model: meninasProp('dumbbell'), socket: 'grip.L' },
    ];
  }

  /** the swollen muscles on an arm, grown by k (0 … 1) */
  private showSwell(side: Side, k: number): void {
    const f = this.f;
    const up = `muscle.upper.${side}`, fore = `muscle.fore.${side}`;
    if (k <= 0.02) {
      if (f.visual.props.has(up)) {
        f.visual.detach(up);
        f.visual.detach(fore);
        this.hands();
      }
      return;
    }
    if (!f.visual.props.has(up)) {
      f.visual.attach(up, meninasProp('muscle.upper'), `bicep.${side}`);
      f.visual.attach(fore, meninasProp('muscle.fore'), `fore.${side}`);
      this.hands();
    }
    const s = 0.45 + 0.55 * k;
    f.visual.props.get(up)?.scale.setScalar(s);
    f.visual.props.get(fore)?.scale.setScalar(s);
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    this.porniCd = Math.max(0, this.porniCd - dt);
    if (this.muscleT > 0 && (this.muscleT -= dt) <= 0) {
      this.muscleT = 0;
      this.applyStats();
    }
    this.powerArm = Math.max(0, this.powerArm - dt);
    // the arms swell toward what is wanted of them
    for (const side of ['L', 'R'] as Side[]) {
      const want = this.muscleT > 0 || (side === 'R' && this.powerArm > 0) ? 1 : 0;
      this.swellWant[side] = want;
      const now = this.swellNow[side];
      const next = now + Math.max(-dt * 2.5, Math.min(dt * 4, want - now));
      if (Math.abs(next - now) > 1e-4 || (next > 0.02) !== f.visual.props.has(`muscle.upper.${side}`)) this.showSwell(side, next);
      this.swellNow[side] = next;
    }
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    // Hirenkyaku: a dash into a wall goes through it, shoulder first
    const dashing = f.dashT > 0;
    if (dashing && !this.wasDashing) hirenkyakuPuff(g, f, TINT);
    if (dashing) {
      hirenkyakuStreak(g, f, TINT);
      if ((this.dashCarve -= dt) <= 0) {
        this.dashCarve = 0.04;
        g.engine.destruction.carve(new SphereShape(f.center().addScaledVector(f.dashDir, 0.7), 1.05, 0.5), { mode: 'smash', power: 700, impulse: 8, dust: 0.5 });
      }
    }
    this.wasDashing = dashing;
    if (this.form === 'pornipora') {
      this.porniT -= dt;
      vollFlight(g, f, this.target(), 1.5);
      const tg = this.target();
      // Halteres: up with the blade, then down onto them
      if (this.riseT > 0) {
        this.riseT -= dt;
        f.mountVy = 12;
      } else if (this.diveT > 0 && (this.diveT -= dt) > 0 && tg) f.mountVy = Math.max(-30, Math.min(4, (tg.pos.y - f.pos.y) * 8));
      if (this.porniT <= 0) this.leavePornipora();
    }
  }

  target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 90, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 90);
  }

  private near(range: number): Fighter | null {
    const t = this.target();
    return t && t.pos.distanceTo(this.f.pos) <= range ? t : null;
  }

  // ---------------------------------------------------------------- the blows

  /**
   * a blow: the nearest enemy in front within reach; half again on a turned back (Rukia); `plow` sends it through the
   * walls behind it
   */
  private strike(range: number, dmg: number, o: { knock?: number; launch?: number; heavy?: boolean; plow?: number } = {}): Fighter | null {
    const { f, g } = this;
    const fw = f.forward();
    let best: Fighter | null = null, bd = Infinity;
    for (const e of g.enemiesOf(f)) {
      if (e.dead) continue;
      _v.subVectors(e.pos, f.pos).setY(0);
      const d = _v.length();
      if (d > range + e.def.radius || (d > 0.3 && _v.normalize().dot(fw) < 0.35) || Math.abs(e.pos.y - f.pos.y) > (this.form === 'pornipora' ? 3 : 2)) continue;
      if (d < bd) { bd = d; best = e; }
    }
    if (!best) return null;
    // its back to her: she punishes it
    const back = best.forward().dot(_w.subVectors(best.pos, f.pos).setY(0).normalize()) > 0.3;
    if (back && g.time - this.backT > 8) {
      this.backT = g.time;
      g.callout('', 'Turning your back on me…', PINK);
    }
    g.damage(best, dmg * (back ? 1.5 : 1), f, fw, { knock: o.knock ?? 5, launch: o.launch ?? 0, heavy: o.heavy, hitstop: o.heavy ? 0.11 : 0.05, shake: o.heavy ? 0.35 : 0.12 });
    if (o.plow) g.addProjectile(new Plow(best, o.plow));
    return best;
  }

  attack(): void {
    const { f, g } = this;
    const cur = f.action;
    if (cur instanceof StrikeAction && (MENINAS_CHAIN.includes(cur.clip) || PORNIPORA_CHAIN.includes(cur.clip))) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (g.time - this.lastEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const { f, g } = this;
    const pp = this.form === 'pornipora';
    const list = pp ? PORNIPORA_CHAIN : MENINAS_CHAIN;
    const idx = i % list.length;
    const clip = list[idx];
    this.comboIndex = idx + 1;
    this.lastEnd = g.time + 0.65;
    const on = (n: string): void => {
      if (n !== 'hit') return;
      if (pp) {
        if (clip === 'mn_db1' && idx === 0) g.callout('', 'DANBERU DASUTĀ!', PINK);
        if (clip === 'mn_db5') {
          const hit = this.strike(2.4, 40, { knock: 22, launch: 4, heavy: true, plow: 0.8 });
          g.groundImpact(f.pos.clone().addScaledVector(f.forward(), hit ? Math.min(2.4, hit.pos.distanceTo(f.pos)) : 2).setY(hit ? hit.pos.y : f.pos.y), 1.6, 700, PINK, f);
        } else this.strike(2.2, 14, { knock: 5 });
        return;
      }
      if (clip === 'mn_jab') this.strike(1.8, 10, { knock: 4 });
      else if (clip === 'mn_straight') this.strike(1.9, 12, { knock: 6 });
      else if (clip === 'mn_hook') this.strike(1.9, 14, { knock: 8 });
      else {
        // the hammer fist: the ground cratered under it, the target sent through walls
        const hit = this.strike(2.2, 34, { knock: 22, launch: 3, heavy: true, plow: 0.8 });
        const at = f.pos.clone().addScaledVector(f.forward(), hit ? Math.min(2.2, hit.pos.distanceTo(f.pos)) : 1.8);
        g.groundImpact(at, 1.6, 650, '#C0B8A8', f);
      }
    };
    f.act(new StrikeAction(this, clip, idx, on, pp ? 1.6 : 1.3), true);
  }

  // ---------------------------------------------------------------- the moves

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

  /** RMB: The Power (a swollen-arm punch through every wall behind them); at range the heart bow. Pornipora: Diamond Push */
  heavy(): void {
    const { f, g } = this;
    if (this.form === 'pornipora') {
      this.diamond(16, 3.2, 80, 'diamond', 6);
      return;
    }
    const t = this.target();
    if (t && t.pos.distanceTo(f.pos) > 9) {
      this.bow();
      return;
    }
    this.special(new ClipSkill('power', 'mn_power', (n) => {
      if (n === 'swell') {
        this.powerArm = 1.1;
        g.sfx.play('charge', f.center(), 0.6);
      }
      if (n !== 'hit') return;
      const hit = this.strike(2.8, 60, { knock: 34, launch: 3, heavy: true, plow: 1.1 });
      const at = sock(f, 'grip.R').addScaledVector(f.forward(), 0.6);
      g.engine.destruction.carve(new SphereShape(at, hit ? 1.4 : 2.0, 0.5), { mode: 'smash', power: 1300, impulse: 14, dir: f.forward(), dust: 0.8 });
      g.addRing(at.clone(), 6, '#E8E0D0', 0.35);
      if (g.player && g.player.pos.distanceTo(f.pos) < 25) g.shake(0.5);
    }, {
      mobility: 0.1,
      armor: 0.4,
      lunge: t && t.pos.distanceTo(f.pos) > 3 ? 10 : 0,
    }), 16, 'power', 5);
  }

  /** the small heart bow out of the case at her left hip: three heart arrows */
  private bow(): void {
    const { f, g } = this;
    this.special(new ClipSkill('bow', 'mn_bow', (n) => {
      if (n === 'catch') {
        f.visual.attach('bow', meninasProp('bow'), 'grip.L');
        this.hands();
      }
      if (n[0] === 'a') {
        const bow = f.visual.props.get('bow');
        const from = bow ? bow.getWorldPosition(new THREE.Vector3()) : sock(f, 'grip.L');
        const t = this.target();
        const dir = t ? t.center().sub(from).normalize() : f.forward();
        dir.applyAxisAngle(UP, (Number(n[1]) - 1) * 0.05);
        g.addProjectile(new HeartArrow(g, f, from.addScaledVector(dir, 0.4), dir, 12));
      }
    }, {
      mobility: 0.2,
      end: () => {
        f.visual.detach('bow');
        this.hands();
      },
    }), 10, 'bow', 3.5);
  }

  /** Q: Diamond Push (and RMB in Pornipora) */
  private diamond(range: number, w: number, dmg: number, cdKey: keyof typeof this.cd, cd: number): void {
    const { f, g } = this;
    this.special(new ClipSkill('diamond', 'mn_diamond', (n) => {
      if (n === 'frame') g.callout('', 'DAIYAMONDO PUSSHU!', PINK);
      if (n !== 'push') return;
      const from = sock(f, 'chest.front').addScaledVector(f.forward(), 0.5);
      const t = this.target();
      const dir = t ? t.center().sub(from).setY(0).normalize() : f.forward();
      g.addProjectile(new DiamondPush(g, f, from, dir, range, w, dmg, 36));
    }, { mobility: 0, armor: 0.3 }), 22, cdKey, cd);
  }

  skill1(): void {
    if (this.form === 'pornipora') {
      this.baton();
      return;
    }
    this.diamond(12, 2.4, 50, 'diamond', 7);
  }

  /** E: Lift & Throw (in Muscle Up, the Building Drop); Pornipora: Halteres */
  skill2(): void {
    const { f, g } = this;
    if (this.form === 'pornipora') {
      this.halteres();
      return;
    }
    const big = this.muscleT > 0;
    let chunk: LiftedChunk | null = null;
    let thrown = false;
    let wall = false;
    const fw = f.forward();
    const hold = (): THREE.Vector3 => f.pos.clone().add(_v.set(0, big ? 4.4 : 3.0, 0)).addScaledVector(f.forward(), 0.2);
    this.special(new ClipSkill('lift', big ? 'mn_drop' : 'mn_lift', (n) => {
      if (n === 'grab') {
        const rip = this.ripKeys(fw, big);
        wall = rip.wall;
        chunk = new LiftedChunk(g, f, rip.keys, hold, big ? 120 : 55, big ? 3.5 : 2.2);
        g.addProjectile(chunk);
        if (g.player && g.player.pos.distanceTo(f.pos) < 25) g.shake(big ? 0.45 : 0.25);
      }
      if (n === 'throw' && chunk && !thrown) {
        thrown = true;
        const t = this.target();
        if (big) chunk.dropOn(t ? t.pos.clone() : f.pos.clone().addScaledVector(f.forward(), 10), 9);
        else chunk.throwAt(t ? t.center() : f.pos.clone().addScaledVector(f.forward(), 14), wall);
        if (big) g.callout('', 'Here you go…', PINK);
      }
    }, {
      mobility: 0,
      armor: 0.4,
      // cut off before the throw: it falls off her hands where she stands
      end: () => {
        if (chunk && !thrown) {
          thrown = true;
          chunk.throwAt(f.pos.clone().addScaledVector(f.forward(), 2.5));
        }
      },
    }), big ? 40 : 20, 'lift', big ? 14 : 6);
  }

  /**
   * the voxels to rip out: a section of the wall or building right in front of her if there is one, else a slab of
   * the ground at her feet (big: a whole building section, or a great slab)
   */
  private ripKeys(fw: THREE.Vector3, big: boolean): { keys: Float64Array; wall: boolean } {
    const { f, g } = this;
    const c = f.center();
    const reach = big ? 6 : 3.5;
    const hit = raycastVoxels(g.engine.world, c.x, c.y, c.z, fw.x, 0, fw.z, reach);
    const gy = groundAt(g, f.pos.x, f.pos.y + 1, f.pos.z, 6) ?? f.pos.y;
    if (hit) {
      const p = c.clone().addScaledVector(fw, hit.dist + (big ? 2.4 : 1.1));
      const half = big ? new THREE.Vector3(2.4, 3.4, 2.4) : new THREE.Vector3(1.1, 1.1, 1.1);
      // a building section stands on the ground (not floating above it)
      p.y = Math.max(gy + half.y + 0.05, p.y);
      return { keys: chunkKeys(g, p.clone().sub(half), p.clone().add(half)), wall: true };
    }
    const at = f.pos.clone().addScaledVector(fw, big ? 3.2 : 2.2);
    const half = big ? new THREE.Vector3(2.2, 1.0, 2.2) : new THREE.Vector3(1.1, 0.75, 1.1);
    at.y = gy - half.y + 0.1;
    return { keys: chunkKeys(g, at.clone().sub(half), at.clone().add(half)), wall: false };
  }

  /** R: Head-Grab Drive */
  skill3(): void {
    const { f, g } = this;
    const t = this.near(14);
    if (!t) {
      if (f === g.player) g.hud?.showBanner('No one in reach');
      return;
    }
    this.special(new HeadGrabAction(this, t), 24, 'grab', 9);
  }

  /** G: Muscle Up; Pornipora: Sklaverei */
  toggle(): void {
    const { f, g } = this;
    if (this.form === 'pornipora') {
      this.sklaverei();
      return;
    }
    if (this.muscleT > 0) return;
    this.special(new ClipSkill('flex', 'mn_flex', (n) => {
      if (n !== 'swell') return;
      this.muscleT = MUSCLE_TIME;
      this.applyStats();
      flexCracks(g, f.pos.clone(), 3.4);
      f.aura.flare(1.4, 0.4);
      g.sfx.play('roar', f.center(), 0.5);
      g.callout('', 'THE POWER', PINK);
      if (g.player && g.player.pos.distanceTo(f.pos) < 20) g.shake(0.3);
    }, { mobility: 0, armor: 0.5 }), 20, 'flex', 28);
  }

  // ---------------------------------------------------------------- Pornipora

  /** Q in Pornipora: Baton Beat — the dumbbells stretched into batons, two spins hitting everything round her */
  private baton(): void {
    const { f, g } = this;
    let next = 0.12;
    const hitT = new Map<Fighter, number>();
    this.special(new ClipSkill('baton', 'mn_baton', (n) => {
      if (n !== 'spin') return;
      g.callout('', 'BATON BĪTO!', PINK);
      f.visual.detach('dumbbell');
      f.visual.detach('dumbbell2');
      f.visual.attach('baton', meninasProp('baton'), 'grip.R');
      f.visual.attach('baton2', meninasProp('baton'), 'grip.L');
      this.hands();
    }, {
      mobility: 0.4,
      armor: 0.3,
      tick: (t) => {
        if (t < next || t > 1.15) return;
        next += 0.15;
        g.sfx.play('swing', f.center(), 0.6);
        for (const e of g.enemiesOf(f)) {
          if (e.dead || e.center().distanceTo(f.center()) > 4 + e.def.radius) continue;
          if ((hitT.get(e) ?? -1) > t - 0.14) continue;
          hitT.set(e, t);
          g.damage(e, 12, f, e.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 4, hitstop: 0.03, color: PINK });
        }
        for (let i = 0; i < 6; i++) {
          const a = Math.random() * Math.PI * 2;
          g.engine.glow.spawn({ x: f.pos.x + Math.cos(a) * 3.2, y: f.pos.y + 1.2, z: f.pos.z + Math.sin(a) * 3.2, vx: -Math.sin(a) * 6, vy: 0, vz: Math.cos(a) * 6, size: 0.24, sizeEnd: 0.04, life: 0.2, r: 1, g: 0.5, b: 0.72, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
        }
      },
      end: () => {
        f.visual.detach('baton');
        f.visual.detach('baton2');
        if (this.form === 'pornipora') {
          f.visual.attach('dumbbell', meninasProp('dumbbell'), 'grip.R');
          f.visual.attach('dumbbell2', meninasProp('dumbbell'), 'grip.L');
        }
        this.hands();
      },
    }), 18, 'baton', 7);
  }

  /** E in Pornipora: Halteres — a dumbbell turned into a huge blade, raised, and the dive onto the target */
  private halteres(): void {
    const { f, g } = this;
    this.special(new ClipSkill('halteres', 'mn_halteres', (n) => {
      if (n === 'up') {
        g.callout('', 'HARUTERESU!', PINK);
        f.visual.detach('dumbbell');
        f.visual.attach('halteres', meninasProp('halteres'), 'grip.R');
        this.hands();
        this.riseT = 0.36;
      }
      if (n === 'dive') {
        // the dive covers the gap by the time the blade lands (0.28 s on)
        const t = this.target();
        if (t) {
          const d = _v.subVectors(t.pos, f.pos).setY(0);
          const gap = Math.max(0, d.length() - 1.4);
          const per = (1 - Math.exp(-f.pushDrag * 0.28)) / f.pushDrag;
          f.push.addScaledVector(d.normalize(), Math.min(140, gap / per));
        }
        this.diveT = 0.35;
      }
      if (n !== 'hit') return;
      const fw = f.forward();
      const at = f.pos.clone().addScaledVector(fw, 1.4);
      // the blade comes down: a cut through what stands under it, a crater where it lands
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), fw);
      g.engine.destruction.carve(new BoxShape(at.clone().add(_v.set(0, 1.4, 0)), new THREE.Vector3(0.08, 2.6, 2.4), q), { mode: 'cut', power: 1600, dir: UP.clone().negate(), dust: 0.6 });
      for (const e of g.enemiesOf(f)) {
        if (e.dead || e.pos.distanceTo(at) > 3 + e.def.radius) continue;
        g.damage(e, 110, f, e.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 14, launch: 5, heavy: true, hitstop: 0.14, shake: 0.6, color: PINK });
      }
      g.groundImpact(at, 2.6, 900, PINK, f);
    }, {
      mobility: 0.1,
      armor: 0.4,
      end: () => {
        f.visual.detach('halteres');
        if (this.form === 'pornipora' && !f.visual.props.has('dumbbell')) f.visual.attach('dumbbell', meninasProp('dumbbell'), 'grip.R');
        this.hands();
      },
    }), 26, 'halteres', 8);
  }

  /** G in Pornipora: Sklaverei — two seconds drinking the world's reishi; the heart armour forms */
  private sklaverei(): void {
    const { f, g } = this;
    let acc = 0, drank = 0;
    this.special(new ClipSkill('sklaverei', 'mn_sklav', (n) => {
      if (n === 'start') g.callout('聖隷', 'SKLAVEREI', PINK);
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
          this.porniT = Math.min(PORNI_TIME, this.porniT + bites * 0.3);
          f.hp = Math.min(f.maxHp, f.hp + bites * 1.5);
        }
      },
      end: () => {
        f.rooted = false;
        if (drank > 0 && !this.sklav && this.form === 'pornipora') {
          this.sklav = true;
          this.rebody();
          this.applyStats();
        }
      },
    }), 0, 'sklav', 14);
  }

  /** F: Pornipora; in it, the Building Drop from the sky */
  release(): void {
    const { f, g } = this;
    if (this.form === 'pornipora') {
      this.skyDrop();
      return;
    }
    if (this.porniCd > 0) {
      if (f === g.player) g.hud?.showBanner('Not yet');
      return;
    }
    if (f.busy) return;
    if (!f.spendRei(50)) {
      if (f === g.player) g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    let burst = false, at = 0;
    const go = () => {
      if (burst) return;
      burst = true;
      this.becomePornipora();
    };
    f.act(new ClipSkill('release', 'mn_release', () => {}, {
      invulnerable: true,
      mobility: 0,
      tick: (t) => {
        at = t;
        if (t >= 0.6) go();
      },
      end: () => { if (at >= 0.45 && !f.dead) go(); },
    }), true);
  }

  /** the Building Drop from the sky: the biggest structure in reach (or a great slab of ground) lifted high and dropped */
  private skyDrop(): void {
    const { f, g } = this;
    const t = this.near(45);
    if (!t) {
      if (f === g.player) g.hud?.showBanner('No one in reach');
      return;
    }
    let chunk: LiftedChunk | null = null;
    let thrown = false;
    const hold = (): THREE.Vector3 => f.pos.clone().add(_v.set(0, 6.5, 0));
    this.special(new ClipSkill('skydrop', 'mn_skydrop', (n) => {
      if (n === 'grab') {
        chunk = new LiftedChunk(g, f, this.ripKeys(f.forward(), true).keys, hold, 160, 4);
        g.addProjectile(chunk);
        g.callout('', 'BUILDING DROP', PINK);
        if (g.player && g.player.pos.distanceTo(f.pos) < 30) g.shake(0.5);
      }
      if (n === 'throw' && chunk && !thrown) {
        thrown = true;
        chunk.dropOn(t.pos.clone(), 12);
      }
    }, {
      mobility: 0,
      armor: 0.6,
      end: () => {
        if (chunk && !thrown) {
          thrown = true;
          chunk.dropOn(t.pos.clone(), 12);
        }
      },
    }), 60, 'drop', 24);
  }

  private rebody(): void {
    const { f } = this;
    const z = this.form === 'pornipora';
    f.def = { ...f.def, stance: z ? PORNIPORA_STANCE : MENINAS_STANCE, clips: z ? PORNIPORA_CLIPS : MENINAS_CLIPS };
    for (const s of ['L', 'R'] as Side[]) this.swellNow[s] = 0;
    f.setForm({ asset: meninasAsset(z ? (this.sklav ? 'sklaverei' : 'pornipora') : 'base'), props: this.props() }, z ? AURA_PORNIPORA : AURA_POWER);
    this.hands();
  }

  private becomePornipora(): void {
    const { f, g } = this;
    if (this.form === 'pornipora') return;
    this.form = 'pornipora';
    this.porniT = PORNI_TIME;
    this.sklav = false;
    f.rooted = false;
    f.slowT = 0;
    f.def = { ...f.def, speed: { ...SPEED_PORNI } };
    this.rebody();
    const c = f.center();
    for (const e of g.enemiesOf(f)) {
      if (e.dead || e.center().distanceTo(c) > 6 + e.def.radius) continue;
      g.damage(e, 40, f, e.pos.clone().sub(f.pos).setY(0).normalize(), { energy: true, knock: 16, launch: 5, heavy: true, color: PINK });
    }
    g.addProjectile(new LightPillar(g, f.pos.clone(), 1.4, 70, PINK));
    f.aura.pillarBurst(2.2);
    f.aura.flare(2, 1);
    g.addRing(f.pos.clone(), 10, PINK, 0.5);
    g.shake(f === g.player ? 0.5 : 0.2);
    g.callout('神の力', 'QUINCY: VOLLSTÄNDIG — PORNIPORA', PINK);
    g.sfx.play('bankai', f.center());
    this.applyStats();
  }

  private leavePornipora(): void {
    const { f } = this;
    this.form = 'base';
    this.porniCd = PORNI_CD;
    this.sklav = false;
    f.mounted = false;
    f.rooted = false;
    f.def = { ...f.def, speed: { ...SPEED } };
    this.rebody();
    this.applyStats();
  }

  private applyStats(): void {
    const f = this.f;
    const z = this.form === 'pornipora';
    f.power = (z ? 1.4 : 1) * (this.muscleT > 0 ? 1.35 : 1) * (this.flare ? 1.2 : 1) * (this.sklav ? 1.1 : 1);
    // the third-best Blut of the Bambies; a body built to take it
    f.damageTaken = z ? 0.85 : 0.9;
    f.toughness = z ? 9 : 6;
    f.knockTaken = this.muscleT > 0 ? 0.5 : 0.8;
    f.aura.target = this.flare ? 0.85 : z ? 0.45 : this.muscleT > 0 ? 0.3 : 0.05;
  }

  toggleFlare(): void {
    this.flare = !this.flare;
    this.applyStats();
    if (this.flare) {
      this.f.aura.flare(1.6, 0.4);
      flexCracks(this.g, this.f.pos.clone(), 2.6);
      this.g.shake(0.2);
      this.g.sfx.play('flare', this.f.center());
    }
  }

  formName(): string {
    const m = this.muscleT > 0 ? ` · Muscle Up ${Math.ceil(this.muscleT)} s` : '';
    if (this.form === 'pornipora') return `Pornipora${this.sklav ? ' (Sklaverei)' : ''} · ${Math.max(0, Math.ceil(this.porniT))} s${m}`;
    return `Sternritter "P" — The Power${m}`;
  }

  ai(): KitAI {
    const base = () => this.form === 'base';
    const pp = () => this.form === 'pornipora';
    const hpK = () => this.f.hp / this.f.maxHp;
    return {
      reach: 1.6,
      chain: 4,
      releaseAt: 0.55,
      ranged: () => false,
      moves: [
        { name: 'power', use: () => this.heavy(), min: 0, max: 3.2, weight: 3, cd: 4, when: base },
        { name: 'bow', use: () => this.heavy(), min: 10, max: 34, weight: 1, cd: 4, when: base },
        { name: 'diamond', use: () => this.skill1(), min: 2, max: 11, weight: 2.6, cd: 6, when: base },
        { name: 'lift', use: () => this.skill2(), min: 6, max: 30, weight: 2.4, cd: 6, when: base },
        { name: 'grab', use: () => this.skill3(), min: 3, max: 13, weight: 2.2, cd: 8 },
        { name: 'flex', use: () => this.toggle(), min: 0, max: 30, weight: 4, cd: 20, when: () => base() && hpK() < 0.75 && this.muscleT <= 0 },
        { name: 'pdiamond', use: () => this.heavy(), min: 2, max: 14, weight: 2.4, cd: 6, when: pp },
        { name: 'baton', use: () => this.skill1(), min: 0, max: 4, weight: 2.4, cd: 7, when: pp },
        { name: 'halteres', use: () => this.skill2(), min: 3, max: 18, weight: 2.4, cd: 8, when: pp },
        { name: 'sklav', use: () => this.toggle(), min: 8, max: 60, weight: 1, cd: 14, when: () => pp() && this.porniT < 14 },
        { name: 'skydrop', use: () => this.release(), min: 4, max: 40, weight: 2.4, cd: 24, when: pp },
        // Pornipora again once it has come back
        { name: 'porni', use: () => this.release(), min: 0, max: 60, weight: 3, cd: 8, when: () => base() && this.porniCd <= 0 && hpK() < 0.55 },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    const far = (this.target()?.pos.distanceTo(this.f.pos) ?? 0) > 9;
    if (this.form === 'pornipora') {
      return [
        { key: 'LMB', name: 'Dumbbell Duster', kanji: '鉄亜鈴' },
        { key: 'RMB', name: 'Diamond Push', kanji: '金剛', cost: 22, cd: cd.diamond, cdMax: 6, tint: PINK },
        { key: 'Q', name: 'Baton Beat', kanji: '棍', cost: 18, cd: cd.baton, cdMax: 7, tint: PINK },
        { key: 'E', name: 'Halteres', kanji: '刃', cost: 26, cd: cd.halteres, cdMax: 8, tint: PINK },
        { key: 'R', name: 'Head-Grab Drive', kanji: '掴', cost: 24, cd: cd.grab, cdMax: 9, tint: PINK },
        { key: 'G', name: 'Sklaverei', kanji: '聖隷', cd: cd.sklav, cdMax: 14, tint: PINK },
        { key: 'F', name: 'Building Drop', kanji: '落', cost: 60, cd: cd.drop, cdMax: 24, active: true, timer: this.porniT / PORNI_TIME, tint: PINK },
        { key: 'Shift', name: 'Hirenkyaku', kanji: '飛廉脚', cost: 4 },
        { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      ];
    }
    return [
      { key: 'LMB', name: 'Punches', kanji: '拳' },
      { key: 'RMB', name: far ? 'Heilig Bogen' : 'The Power', kanji: far ? '神聖弓' : '力', cost: far ? 10 : 16, cd: far ? cd.bow : cd.power, cdMax: far ? 3.5 : 5, tint: PINK },
      { key: 'Q', name: 'Diamond Push', kanji: '金剛', cost: 22, cd: cd.diamond, cdMax: 7, tint: PINK },
      { key: 'E', name: this.muscleT > 0 ? 'Building Drop' : 'Lift & Throw', kanji: '投', cost: this.muscleT > 0 ? 40 : 20, cd: cd.lift, cdMax: 6, tint: PINK },
      { key: 'R', name: 'Head-Grab Drive', kanji: '掴', cost: 24, cd: cd.grab, cdMax: 9, tint: PINK },
      { key: 'G', name: 'Muscle Up', kanji: '筋', cost: 20, cd: cd.flex, cdMax: 28, active: this.muscleT > 0, timer: this.muscleT / MUSCLE_TIME, tint: PINK },
      { key: 'F', name: 'Pornipora', kanji: '神の力', cost: 50, cd: this.porniCd, cdMax: PORNI_CD, tint: PINK },
      { key: 'Shift', name: 'Hirenkyaku', kanji: '飛廉脚', cost: 4 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
    ];
  }
}

