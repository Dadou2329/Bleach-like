// Bazz-B's kit (docs/kits/bazzb.md). "One finger is enough": a loud street-brawler with a burning hand who escalates
// one finger at a time — the finger count is the move. LMB: close, the string (a burning hook, a cross, the melting
// palm, the Burning Stomp, whose ring of fire is the counter-flame that undoes shots and fields round him); at range,
// the Heilig Bogen crossbow, bolts that hole walls cleanly; with the sword out, its three huge cuts. RMB Burner Finger
// 1 (the index's instant beam through everything on the line). Q Burner Finger 2 (two burning fingers drag two flame
// slashes, each ending in a tall pillar of fire). E Burner Finger 3 (the floor turned to lava round the point he
// aims at). R Burner Finger 4 (the great flame sword grows from four fingers; R again throws it spinning). G Burning
// Full Fingers (all five, a spiralling cone of flame). Shift with a lock-on: the collar grab — he is behind the
// target holding its collar; LMB then fires a point-blank Burner Finger 1, otherwise he slams it into the floor. F:
// Quincy: Vollständig (the spiky red Zeichen halo and the rod wings: flight, speed, RMB rapid Burner Finger 1; F again:
// the Glory Thief, beams through cover at every enemy in view, once).
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef, type PropDef } from '../fighter';
import type { Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import type { AuraStyle } from '../../vfx/aura';
import { BZ_SWORD_BASE_Z, BZ_SWORD_TIP_Z, FINGER_HANDS, bazzbAsset, bazzbProp } from '../../chars/bazzb';
import { BAZZB_BOW_CHAIN, BAZZB_CHAIN, BAZZB_CLIPS, BAZZB_STANCE, BAZZB_SWORD_CHAIN } from '../../chars/bazzbClips';
import { BurnerBeam, FIRE_BODY, FireRing, FullFingers, LavaField, ThrownFlameSword, TwinFlame, VOLL_RED, fireBurst, flameLick, gloryMark } from '../../vfx/heat';
import { LightPillar } from '../../vfx/heilig';
import { ReishiArrow } from '../../vfx/quincy';
import { SphereShape } from '../../destruction/shapes';
import { TEX_GLOW } from '../../vfx/sprites';
import { hirenkyakuPuff, hirenkyakuStreak, vollFlight, type Rgb } from './sternritter';

export const AURA_HEAT: AuraStyle = { core: '#FFF6C8', body: '#FF7A1A', rim: '#D9361C' };
export const AURA_VOLL: AuraStyle = { core: '#FFD9A0', body: '#E3262F', rim: '#8E1218' };

type BladeDef = NonNullable<FighterDef['blade']>;
const BLADE: BladeDef = { prop: 'flame', base: [0, 0, BZ_SWORD_BASE_Z], tip: [0, 0, BZ_SWORD_TIP_Z], color: '#FF7A1A', core: '#FFF6C8' };

const SPEED = { run: 10.2, sprint: 30, jump: 13.5, dash: 32, dashTime: 0.1 };
const SPEED_VOLL = { run: 12.8, sprint: 38, jump: 14, dash: 40, dashTime: 0.1 };
const VOLL_TIME = 40;
const VOLL_CD = 20;
const SWORD_TIME = 12;
/** past this, LMB is the crossbow */
const BOW_RANGE = 6.5;

export const BAZZB_DEF: FighterDef = {
  id: 'bazzb',
  name: 'Bazz-B',
  title: 'Sternritter "H" — The Heat',
  build: () => ({ asset: bazzbAsset('base'), props: [] }),
  stance: BAZZB_STANCE,
  clips: BAZZB_CLIPS,
  aura: AURA_HEAT,
  blade: BLADE,
  hp: 1150,
  rei: 220,
  speed: { ...SPEED },
  radius: 0.33,
  height: 1.79,
};

const _v = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
/** the heat shimmering over the ribbon */
const HEAT: Rgb = [1, 0.55, 0.2];

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

type Hand = 'fist' | 'palm' | 1 | 2 | 3 | 4 | 5;

// ---------------------------------------------------------------------------------------------- actions

/** A blow of the string (or a cut with the sword): the clip, an approach dash, the events to the kit. */
class StrikeAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private hitAt = -1;
  private stopAt = 0;
  queued = false;

  constructor(readonly kit: BazzbKit, readonly clip: string, readonly index: number, readonly kind: 'fist' | 'sword' | 'bow', readonly onEvent: (n: string) => void, readonly spec?: BladeSpec) {
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
    if (tgt && this.hitAt > 0 && this.kind !== 'bow') {
      const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
      this.stopAt = this.kind === 'sword' ? 2.4 : 1.3;
      if (d > this.stopAt + 0.25 && d < 8) {
        const tau = Math.max(0.06, this.hitAt - 0.06);
        const per = (1 - Math.exp(-f.pushDrag * tau)) / f.pushDrag;
        f.push.addScaledVector(f.forward(), Math.min(30, (d - this.stopAt) / per));
        dashed = true;
      }
    }
    if (this.kind === 'fist') this.kit.setHand(this.clip === 'bz_palm' ? 'palm' : 'fist');
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n === 'step') {
          if (!dashed) f.push.addScaledVector(f.forward(), 3);
          g.sfx.play(this.kind === 'sword' ? 'swingHeavy' : 'swing', f.center(), 0.8);
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
    if (this.spec) {
      const open = this.hitAt >= 0 && t >= this.hitAt - 0.1 && t <= this.hitAt + 0.14;
      f.bladeActive = open;
      if (f.trail) f.trail.emitting = open;
    }
    if (this.queued && t >= this.comboAt) {
      this.done = true;
      this.kit.chain(this.index + 1, this.kind);
      return;
    }
    if (t >= this.dur) this.done = true;
  }

  override end(f: Fighter): void {
    f.bladeActive = false;
    if (f.trail) f.trail.emitting = false;
    if (this.kind === 'fist') this.kit.setHand('fist');
  }

  override canCancel(next: FighterAction): boolean {
    if (next.name === 'dash' || next instanceof ClipSkill) return this.t >= this.hitAt + 0.05;
    return false;
  }
}

/** One clip, its events to a callback, the right hand set for it, done when it ends. */
class ClipSkill extends FighterAction {
  private dur = 1;
  constructor(readonly kit: BazzbKit, readonly name: string, readonly clip: string, readonly hand: Hand, private on: (n: string) => void, o: { armor?: number; mobility?: number; invulnerable?: boolean; channel?: number } = {}) {
    super();
    this.armor = o.armor ?? 0;
    this.mobility = o.mobility ?? 0.1;
    this.invulnerable = !!o.invulnerable;
    this.airGravity = 0.1;
  }
  override start(f: Fighter): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.kit.setHand(this.hand);
    f.anim.play(this.clip, { onEvent: this.on });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= this.dur) this.done = true;
  }
  override end(): void {
    this.kit.setHand(this.kit.restHand());
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' ? this.t > this.dur * 0.55 : next instanceof ClipSkill && this.t > this.dur * 0.6;
  }
}

/** The collar grab: the target held before him by the collar; LMB fires point-blank, or he slams it down. */
class GrabAction extends FighterAction {
  readonly name = 'grab';
  pressed = false;
  private decided = false;
  constructor(readonly kit: BazzbKit, readonly target: Fighter) {
    super();
    this.mobility = 0;
    this.armor = 0.3;
  }
  override start(f: Fighter): void {
    this.kit.setHand('fist');
    f.anim.play('bz_grab', { fadeIn: 0.03 });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.target;
    if (t.dead || f.hitstun > 0) {
      this.done = true;
      return;
    }
    // held at arm's length, facing away
    const fw = f.forward();
    t.body.pos.set(f.pos.x + fw.x * 0.95, Math.max(t.pos.y, f.pos.y), f.pos.z + fw.z * 0.95);
    t.body.prev.copy(t.body.pos);
    t.body.vel.set(0, 0, 0);
    t.push.set(0, 0, 0);
    t.hitstun = Math.max(t.hitstun, 0.25);
    // an AI makes up its mind once: the finger, or the floor
    if (f !== g.player && !this.decided && this.t > 0.3) {
      this.decided = true;
      this.pressed = Math.random() < 0.6;
    }
    if (this.pressed && this.t > 0.12) {
      this.done = true;
      this.kit.pointBlank(t);
      return;
    }
    if (this.t >= 0.9) {
      this.done = true;
      this.kit.slam(t);
    }
  }
}

// ---------------------------------------------------------------------------------------------- the kit

type Form = 'base' | 'voll';

export class BazzbKit implements Kit {
  form: Form = 'base';
  flare = false;
  comboIndex = 0;
  private lastEnd = 0;
  private lastKind: 'fist' | 'sword' | 'bow' = 'fist';
  /** Burner Finger 4's sword: its time left */
  swordT = 0;
  /** the crossbow stays in his hand a beat after a shot */
  private bowT = 0;
  hand: Hand = 'fist';
  vollT = 0;
  vollCd = 0;
  gloryUsed = false;
  private wasDashing = false;
  private grab: GrabAction | null = null;
  /** burns from the melting palm: drain over time */
  private burns: { f: Fighter; t: number; dps: number }[] = [];
  readonly lava: LavaField[] = [];
  readonly cd = { bf1: 0, bf2: 0, bf3: 0, bf4: 0, throw: 0, bff: 0, grab: 0 };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.data.quincy = true;
    this.setHand('fist');
    this.applyStats();
  }

  // ---------------------------------------------------------------- hands and props

  /** the right hand's variant (the left stays a fist) */
  setHand(h: Hand): void {
    this.hand = h;
    const rig = this.f.visual.rig;
    FINGER_HANDS.forEach((n, i) => rig.setBoneVisible(n, h === i + 1));
    rig.setBoneVisible('fist.R', h === 'fist');
    rig.setBoneVisible('palm.R', h === 'palm');
    rig.setBoneVisible('fist.L', true);
    rig.setBoneVisible('palm.L', false);
    // the flame sword grows from the four fingers: another count puts it out of sight for the move
    const fl = this.f.visual.props.get('flame');
    if (fl) fl.visible = h === 4 && this.f.disarmT <= 0;
  }

  /** what the right hand goes back to: the sword's four fingers while it burns, else a fist */
  restHand(): Hand {
    return this.swordT > 0 ? 4 : 'fist';
  }

  private props(): PropDef[] {
    const p: PropDef[] = [];
    if (this.form === 'voll') p.push({ key: 'halo', model: bazzbProp('halo'), socket: 'halo' });
    if (this.swordT > 0) p.push({ key: 'flame', model: bazzbProp('flame'), socket: 'bf4' });
    return p;
  }

  private bow(on: boolean): void {
    const v = this.f.visual;
    if (on && !v.props.has('bow')) v.attach('bow', bazzbProp('crossbow'), 'grip.R');
    else if (!on && v.props.has('bow')) v.detach('bow');
  }

  // ---------------------------------------------------------------- update

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    this.vollCd = Math.max(0, this.vollCd - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    // the sword burns out
    if (this.swordT > 0) {
      this.swordT -= dt;
      if (Math.random() < 0.7) {
        const p = f.visual.props.get('flame');
        if (p) {
          p.updateMatrixWorld();
          flameLick(g, _v.set(0, (Math.random() - 0.5) * 0.2, BZ_SWORD_BASE_Z + Math.random() * (BZ_SWORD_TIP_Z - BZ_SWORD_BASE_Z)).applyMatrix4(p.matrixWorld), 1.6, 1);
        }
      }
      if (this.swordT <= 0) this.sheathe();
    }
    // the crossbow: in the hand while he shoots
    this.bowT -= dt;
    if (this.bowT <= 0 && f.visual.props.has('bow')) {
      this.bow(false);
      if (this.hand === 'fist') this.setHand('fist');
    }
    // the lit fingers flicker
    if (typeof this.hand === 'number' && f.action && !f.dead) {
      const s = this.hand === 1 ? 'finger1' : this.hand === 2 ? 'finger2' : this.hand === 3 ? 'finger3' : this.hand === 5 ? 'finger5' : 'bf4';
      if (s !== 'bf4') flameLick(g, sock(f, s), 0.8, 1);
    }
    // the melting palm's burns
    for (let i = this.burns.length - 1; i >= 0; i--) {
      const b = this.burns[i];
      b.t -= dt;
      if (b.f.dead || b.t <= 0) {
        this.burns.splice(i, 1);
        continue;
      }
      g.drain(b.f, b.dps * dt, f);
      if (Math.random() < 0.3) flameLick(g, b.f.center(), 1.4, 1);
    }
    for (let i = this.lava.length - 1; i >= 0; i--) if (this.lava[i].done) this.lava.splice(i, 1);
    // Hirenkyaku; with a lock-on, the collar grab
    const dashing = f.dashT > 0;
    if (dashing && !this.wasDashing) {
      const lock = f === g.player ? g.hud?.lockTarget ?? null : null;
      if (lock && !lock.dead && lock.pos.distanceTo(f.pos) < 25 && this.cd.grab <= 0) this.collarGrab(lock);
      else this.puff();
    }
    if (dashing) hirenkyakuStreak(g, f, HEAT);
    this.wasDashing = dashing;
    if (this.form === 'voll') this.updateVoll(dt);
  }

  /** Hirenkyaku: a blue-white ribbon under the soles, the heat shimmering over it */
  private puff(): void {
    hirenkyakuPuff(this.g, this.f, HEAT);
  }

  /** Vollständig: the timer, flight */
  private updateVoll(dt: number): void {
    const { f, g } = this;
    this.vollT -= dt;
    vollFlight(g, f, this.target());
    if (Math.random() < dt * 8) {
      const w = sock(f, 'back');
      g.engine.glow.spawn({ x: w.x + (Math.random() - 0.5) * 1.6, y: w.y + Math.random() * 1.2, z: w.z + (Math.random() - 0.5) * 1.6, vy: 0.5, size: 0.08, sizeEnd: 0.02, life: 0.6, r: 1, g: 0.35, b: 0.2, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
    if (this.vollT <= 0) this.leaveVoll();
  }

  target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 90, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 90);
  }

  private near(range: number): Fighter | null {
    const t = this.target();
    return t && t.pos.distanceTo(this.f.pos) <= range ? t : null;
  }

  /** where a shot aims: the target's chest (or straight ahead) */
  private aimAt(from: THREE.Vector3): THREE.Vector3 {
    const t = this.target();
    if (t) return t.center().sub(from).normalize();
    const f = this.f;
    return f.forward(_v).clone();
  }

  // ---------------------------------------------------------------- the string

  /** a blow from the fist: the nearest enemy in front within reach */
  private strike(range: number, dmg: number, o: { knock?: number; launch?: number; heavy?: boolean; hand?: string } = {}): Fighter | null {
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
    const at = sock(f, o.hand ?? 'grip.R');
    if (!best) {
      fireBurst(g, at, fw, 0.4);
      return null;
    }
    g.damage(best, dmg, f, fw, { knock: o.knock ?? 5, launch: o.launch ?? 0, heavy: o.heavy, hitstop: o.heavy ? 0.09 : 0.05, shake: o.heavy ? 0.25 : 0.12, color: FIRE_BODY });
    fireBurst(g, best.center().lerp(at, 0.4), fw, o.heavy ? 1.2 : 0.8);
    return best;
  }

  attack(): void {
    const { f, g } = this;
    if (this.grab && f.action === this.grab) {
      this.grab.pressed = true;
      return;
    }
    const cur = f.action;
    if (cur instanceof StrikeAction && (BAZZB_CHAIN.includes(cur.clip) || BAZZB_SWORD_CHAIN.includes(cur.clip) || BAZZB_BOW_CHAIN.includes(cur.clip))) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    const kind = this.swordT > 0 ? 'sword' : this.form === 'base' && (this.target()?.pos.distanceTo(f.pos) ?? 0) > BOW_RANGE ? 'bow' : 'fist';
    if (g.time - this.lastEnd > 0.8 || kind !== this.lastKind) this.comboIndex = 0;
    this.chain(this.comboIndex, kind);
  }

  chain(i: number, kind: 'fist' | 'sword' | 'bow'): void {
    const { f, g } = this;
    // the voll fights at range with paired beams instead of bolts
    if (kind === 'bow' && this.form === 'voll') kind = 'fist';
    const list = kind === 'sword' ? BAZZB_SWORD_CHAIN : kind === 'bow' ? BAZZB_BOW_CHAIN : BAZZB_CHAIN;
    const idx = i % list.length;
    const clip = list[idx];
    this.comboIndex = idx + 1;
    this.lastKind = kind;
    this.lastEnd = g.time + 0.65;
    if (kind === 'sword') {
      const last = idx === 2;
      const spec: BladeSpec = { damage: last ? 60 : 40, knock: last ? 16 : 9, launch: last ? 3 : 1, heavy: true, hitstop: last ? 0.12 : 0.08, shake: last ? 0.45 : 0.25, cut: 1600, reach: 0.3, thick: 0.18 };
      f.act(new StrikeAction(this, clip, idx, 'sword', (n) => n === 'hit' && this.swordBlast(last), spec), true);
      return;
    }
    if (kind === 'bow') {
      this.bowT = 0.6;
      this.setHand('fist');
      this.bow(true);
      f.act(new StrikeAction(this, clip, idx, 'bow', (n) => n === 'fire' && this.bolt()), true);
      return;
    }
    const on = (n: string): void => {
      if (n !== 'hit') return;
      if (clip === 'bz_hook') this.strike(1.8, 16, { knock: 5 });
      else if (clip === 'bz_cross') this.strike(1.8, 14, { knock: 6, hand: 'grip.L' });
      else if (clip === 'bz_palm') this.meltingPalm();
      else this.stomp();
    };
    f.act(new StrikeAction(this, clip, idx, 'fist', on), true);
  }

  /** the melting palm: what it touches melts; a body it reaches burns on */
  private meltingPalm(): void {
    const { f, g } = this;
    const hit = this.strike(2.1, 24, { knock: 9, launch: 1, heavy: true, hand: 'palm.R' });
    const at = f.center().addScaledVector(f.forward(), 1.1);
    g.engine.destruction.carve(new SphereShape(at, 0.95, 0.6), { mode: 'melt', power: 700 });
    for (let i = 0; i < 10; i++) flameLick(g, at, 2.2, 1);
    if (hit) this.burns.push({ f: hit, t: 1.5, dps: 8 });
  }

  /** the Burning Stomp: the counter-flame rolling out from his boot */
  private stomp(): void {
    const { f, g } = this;
    g.addProjectile(new FireRing(g, f, f.pos.clone(), this.form === 'voll' ? 6.5 : 5, 30));
    g.groundImpact(f.pos.clone(), 1.6, 300, FIRE_BODY, f);
    g.callout('', 'BURNING STOMP', FIRE_BODY);
  }

  /** one crossbow bolt: fletched, it holes walls clean through */
  private bolt(): void {
    const { f, g } = this;
    const p = f.visual.props.get('bow');
    const from = p ? (p.updateMatrixWorld(), _v.set(0, -36 / 48, 7.6 / 48).applyMatrix4(p.matrixWorld).clone()) : sock(f, 'grip.R');
    const dir = this.aimAt(from);
    g.addProjectile(new ReishiArrow(f, g, from.addScaledVector(dir, 0.2), dir, { damage: 18, size: 1.2, speed: 120, color: '#9AD8F4', pierce: 0.32 }));
    g.sfx.play('arrow', from, 0.8);
  }

  // ---------------------------------------------------------------- the fingers

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

  /** one Burner Finger 1 from the index fingertip */
  beam(dmg: number, width = 1): void {
    const { f, g } = this;
    const from = sock(f, 'finger1');
    const dir = this.aimAt(from);
    g.addProjectile(new BurnerBeam(g, f, from.clone(), dir, { damage: dmg, width, range: 60 }));
    g.sfx.play('arrow', from, 1);
  }

  /** RMB: Burner Finger 1; Vollständig: six in half a second */
  heavy(): void {
    const { g } = this;
    if (this.form === 'voll') {
      const fire = (n: string): void => {
        if (n.length === 2 && n[0] === 'f') this.beam(18, 1.4);
      };
      this.special(new ClipSkill(this, 'rapid', 'bz_rapid', 1, fire, { mobility: 0.35 }), 16, 'bf1', 1.6);
      return;
    }
    if (this.special(new ClipSkill(this, 'bf1', 'bz_bf1', 1, (n) => n === 'fire' && this.beam(30), { mobility: 0.3 }), 8, 'bf1', 0.9)) g.callout('', 'BURNER FINGER 1', FIRE_BODY);
  }

  /** Q: Burner Finger 2 */
  skill1(): void {
    const { f, g } = this;
    const on = (n: string): void => {
      if (n === 'ignite') {
        const p = sock(f, 'finger2');
        for (let i = 0; i < 12; i++) flameLick(g, p, 1.6, 1);
        g.sfx.play('flare', p, 0.5);
      }
      if (n === 'fire') {
        const from = f.center().addScaledVector(f.forward(), 1.1);
        g.addProjectile(new TwinFlame(g, f, from, this.aimAt(from), { damage: 22, pillar: 30, scale: this.form === 'voll' ? 1.4 : 1 }));
        g.sfx.play('getsuga', from, 0.8);
      }
    };
    if (this.special(new ClipSkill(this, 'bf2', 'bz_bf2', 2, on, { mobility: 0.15 }), 16, 'bf2', 4)) g.callout('', 'BURNER FINGER 2', FIRE_BODY);
  }

  /** E: Burner Finger 3 — the floor turned to lava round where he points */
  skill2(): void {
    const { f, g } = this;
    const on = (n: string): void => {
      if (n !== 'point') return;
      const t = this.target();
      const d = t ? Math.min(14, Math.max(3, t.pos.distanceTo(f.pos))) : 6;
      const at = f.pos.clone().addScaledVector(f.forward(), d);
      if (t && t.pos.distanceTo(f.pos) < 15) at.set(t.pos.x, at.y, t.pos.z);
      const field = new LavaField(g, f, at, this.form === 'voll' ? 11 : 7, 8, 18);
      g.addProjectile(field);
      this.lava.push(field);
      // only two fields at a time
      if (this.lava.length > 2) this.lava.shift()!.cool();
      g.sfx.play('explode', at, 0.6);
    };
    if (this.special(new ClipSkill(this, 'bf3', 'bz_bf3', 3, on, { mobility: 0 }), 24, 'bf3', 10)) g.callout('', 'BURNER FINGER 3', FIRE_BODY);
  }

  /** R: Burner Finger 4 — the sword; with it out, it is thrown */
  skill3(): void {
    const { f, g } = this;
    if (this.swordT > 0) {
      this.special(new ClipSkill(this, 'throw', 'bz_throw', 4, (n) => n === 'throw' && this.throwSword(), { mobility: 0.1 }), 0, 'throw', 1);
      return;
    }
    const on = (n: string): void => {
      if (n !== 'form') return;
      this.swordT = SWORD_TIME;
      f.visual.attach('flame', bazzbProp('flame'), 'bf4');
      const p = sock(f, 'bf4');
      for (let i = 0; i < 30; i++) flameLick(g, p.clone().add(_v.set(0, Math.random() * 2.4, 0)), 2.4, 1);
      g.sfx.play('flare', p, 0.9);
      g.shake(f === g.player ? 0.3 : 0.1);
    };
    if (this.special(new ClipSkill(this, 'bf4', 'bz_bf4', 4, on, { mobility: 0, armor: 0.3 }), 30, 'bf4', 14)) g.callout('', 'BURNER FINGER 4', FIRE_BODY);
  }

  /** the flame sword gone (thrown or burnt out) */
  private sheathe(): void {
    this.swordT = 0;
    this.f.visual.detach('flame');
    this.f.bladeActive = false;
    if (!this.f.action || this.hand === 4) this.setHand('fist');
  }

  /** every slash detonates where the blade ends */
  private swordBlast(big: boolean): void {
    const { f, g } = this;
    const tip = f.blade.tip.clone();
    g.engine.destruction.carve(new SphereShape(tip, big ? 2.4 : 1.6, 0.7), { mode: 'explode', power: 900, impulse: 14 });
    fireBurst(g, tip, f.forward(), big ? 2.4 : 1.6);
    g.addRing(tip.clone(), big ? 6 : 4, FIRE_BODY, 0.4);
    for (const e of g.enemiesOf(f)) {
      const d = e.center().distanceTo(tip);
      if (d < (big ? 2.6 : 1.8) + e.def.radius) g.damage(e, big ? 24 : 16, f, e.pos.clone().sub(tip).setY(0).normalize(), { energy: true, knock: 10, launch: 4, heavy: true, hitstop: 0.06, quiet: false, color: FIRE_BODY });
    }
    if (g.player && g.player.pos.distanceTo(tip) < 40) g.shake(big ? 0.45 : 0.25);
  }

  private throwSword(): void {
    const { f, g } = this;
    const from = sock(f, 'bf4').add(_v.set(0, 0.4, 0));
    const dir = this.aimAt(from);
    dir.y = Math.max(-0.2, Math.min(0.2, dir.y));
    g.addProjectile(new ThrownFlameSword(g, f, from, dir.normalize(), 50 * (this.form === 'voll' ? 1.2 : 1)));
    this.sheathe();
    g.sfx.play('swingHeavy', from, 1);
  }

  /** G: Burning Full Fingers */
  toggle(): void {
    const { f, g } = this;
    const v = this.form === 'voll';
    const on = (n: string): void => {
      if (n !== 'fire') return;
      g.addProjectile(new FullFingers(g, f, () => sock(f, 'finger5'), () => {
        const from = sock(f, 'finger5');
        const t = this.target();
        const d = t ? t.center().sub(from).normalize() : f.forward(new THREE.Vector3());
        // he sweeps it along the line he faces: keep it level-ish
        d.y = Math.max(-0.35, Math.min(0.35, d.y));
        return d.normalize();
      }, { dur: 1.5, range: v ? 14 : 10, half: 0.3, dps: v ? 75 : 60 }));
      g.sfx.play('charge', f.center(), 0.9);
    };
    if (this.special(new ClipSkill(this, 'bff', 'bz_bff', 5, on, { mobility: 0.05, armor: 0.3 }), 30, 'bff', 9)) g.callout('', 'BURNING FULL FINGERS', FIRE_BODY);
  }

  // ---------------------------------------------------------------- the collar

  /** behind the target, a hand on its collar */
  collarGrab(t: Fighter): boolean {
    const { f, g } = this;
    if (this.cd.grab > 0 || f.dead || t.dead || f.hitstun > 0) return false;
    if (f.action && !(f.action.name === 'dash') && !f.action.canCancel(new ClipSkill(this, 'grab', 'bz_grab', 'fist', () => {}))) return false;
    if (!f.spendRei(6)) return false;
    this.cd.grab = 6;
    f.ghosts.spawn(0.35, 1);
    const behind = t.pos.clone().addScaledVector(t.forward(_v), -0.95);
    f.body.pos.set(behind.x, Math.max(t.pos.y, f.pos.y - 0.5), behind.z);
    f.body.prev.copy(f.body.pos);
    f.body.vel.set(0, 0, 0);
    f.push.set(0, 0, 0);
    f.dashT = 0;
    f.yaw = Math.atan2(t.pos.x - f.pos.x, t.pos.z - f.pos.z);
    f.faceTarget = t.center();
    t.stopAction();
    this.grab = new GrabAction(this, t);
    f.act(this.grab, true);
    this.puff();
    g.sfx.play('hit', t.center(), 0.6);
    return true;
  }

  /** LMB from the grab: Burner Finger 1 point-blank */
  pointBlank(t: Fighter): void {
    const { f, g } = this;
    this.grab = null;
    f.act(new ClipSkill(this, 'pointblank', 'bz_pointblank', 1, (n) => {
      if (n !== 'fire') return;
      const from = sock(f, 'finger1');
      const dir = t.center().add(_v.set(0, 0.35, 0)).sub(from).normalize();
      g.addProjectile(new BurnerBeam(g, f, from.clone(), dir, { damage: 55, width: 1.3, range: 40 }));
      g.callout('', 'BURNER FINGER 1', FIRE_BODY);
    }, { mobility: 0 }), true);
  }

  /** no LMB: the head driven into the floor */
  slam(t: Fighter): void {
    const { f, g } = this;
    this.grab = null;
    f.act(new ClipSkill(this, 'slam', 'bz_slam', 'fist', (n) => {
      if (n !== 'hit' || t.dead) return;
      g.damage(t, 35, f, f.forward(), { knock: 2, launch: 0, heavy: true, hitstop: 0.12, shake: 0.45, color: FIRE_BODY });
      t.body.vel.y = Math.min(t.body.vel.y, -12);
      g.groundImpact(t.pos.clone(), 1.6, 400, '#8a7a6a', f);
      fireBurst(g, t.pos.clone().add(_v.set(0, 0.3, 0)), UP, 1.4);
    }, { mobility: 0 }), true);
  }

  // ---------------------------------------------------------------- Vollständig

  /** F: Vollständig; inside it, the Glory Thief */
  release(): void {
    const { f, g } = this;
    if (f.busy) return;
    if (this.form === 'voll') {
      if (this.gloryUsed) {
        if (f === g.player) g.hud?.showBanner('Already stolen');
        return;
      }
      if (!f.spendRei(40)) {
        if (f === g.player) g.hud?.showBanner('Not enough reiatsu');
        return;
      }
      this.gloryUsed = true;
      f.act(new ClipSkill(this, 'glory', 'bz_glory', 1, (n) => this.glory(n), { mobility: 0, armor: 0.5 }), true);
      return;
    }
    if (this.vollCd > 0) {
      if (f === g.player) g.hud?.showBanner('Not yet');
      return;
    }
    if (!f.spendRei(50)) {
      if (f === g.player) g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(new ClipSkill(this, 'release', 'bz_voll', 'fist', (n) => n === 'burst' && this.becomeVoll(), { invulnerable: true, mobility: 0 }), true);
  }

  private glory(n: string): void {
    const { f, g } = this;
    const marks = g.enemiesOf(f).filter((e) => !e.dead && e.pos.distanceTo(f.pos) < 70).sort((a, b) => a.pos.distanceTo(f.pos) - b.pos.distanceTo(f.pos)).slice(0, 6);
    if (n === 'mark') {
      for (const e of marks) gloryMark(g, e);
      g.callout('', 'GLORY THIEF', VOLL_RED);
    }
    if (n === 'fire') {
      const from = sock(f, 'finger1');
      for (const e of marks) g.addProjectile(new BurnerBeam(g, f, from.clone(), e.center().sub(from).normalize(), { damage: 45, width: 1.5, range: 80, walls: 10 }));
      g.shake(f === g.player ? 0.4 : 0.15);
    }
  }

  private becomeVoll(): void {
    const { f, g } = this;
    if (this.form === 'voll') return;
    this.form = 'voll';
    this.vollT = VOLL_TIME;
    this.gloryUsed = false;
    // the pillar breaks whatever holds him
    f.rooted = false;
    f.slowT = 0;
    f.def = { ...f.def, speed: { ...SPEED_VOLL } };
    f.setForm({ asset: bazzbAsset('voll'), props: this.props() }, AURA_VOLL);
    this.setHand(this.restHand());
    g.addProjectile(new LightPillar(g, f.pos.clone(), 1.4, 70, VOLL_RED));
    f.aura.pillarBurst(2.2);
    f.aura.flare(2, 1);
    g.addRing(f.pos.clone(), 12, VOLL_RED, 0.6);
    g.shake(f === g.player ? 0.5 : 0.2);
    g.callout('滅却師完聖体', 'QUINCY: VOLLSTÄNDIG', VOLL_RED);
    g.sfx.play('bankai', f.center());
    this.applyStats();
  }

  private leaveVoll(): void {
    const { f } = this;
    this.form = 'base';
    this.vollCd = VOLL_CD;
    f.mounted = false;
    f.def = { ...f.def, speed: { ...SPEED } };
    f.setForm({ asset: bazzbAsset('base'), props: this.props() }, AURA_HEAT);
    this.setHand(this.restHand());
    this.applyStats();
  }

  private applyStats(): void {
    const f = this.f;
    const v = this.form === 'voll';
    f.power = (v ? 1.45 : 1) * (this.flare ? 1.25 : 1);
    f.toughness = v ? 12 : 8;
    f.damageTaken = v ? 0.75 : 0.9;
    f.aura.target = this.flare ? 0.9 : v ? 0.55 : 0.08;
  }

  toggleFlare(): void {
    this.flare = !this.flare;
    this.applyStats();
    if (this.flare) {
      const { f, g } = this;
      f.aura.flare(1.6, 0.4);
      g.shake(0.2);
      g.sfx.play('flare', f.center());
      // the heat: ice and water round him flash to steam
      g.rejectNear(f.center(), 4, f, true);
      for (let i = 0; i < 16; i++) flameLick(g, f.center().add(_v.set((Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.2)), 2, 1);
    }
  }

  formName(): string {
    if (this.form === 'voll') return `Quincy: Vollständig · ${Math.max(0, Math.ceil(this.vollT))} s`;
    return this.swordT > 0 ? `The Heat — Burner Finger 4 · ${Math.ceil(this.swordT)} s` : 'Sternritter "H" — The Heat';
  }

  ai(): KitAI {
    const hpK = () => this.f.hp / this.f.maxHp;
    const base = () => this.form === 'base';
    const voll = () => this.form === 'voll';
    return {
      // he never backs off; he adds a finger as it gets serious
      reach: 2.2,
      chain: 4,
      releaseAt: 0.5,
      moves: [
        { name: 'bf1', use: () => this.heavy(), min: 4, max: 55, weight: 2.4, cd: 1.2 },
        { name: 'bf2', use: () => this.skill1(), min: 3, max: 22, weight: 1.6, cd: 4, when: () => hpK() < 0.85 },
        { name: 'bf3', use: () => this.skill2(), min: 3, max: 14, weight: 1.2, cd: 10, when: () => hpK() < 0.7 },
        { name: 'bf4', use: () => this.skill3(), min: 0, max: 7, weight: 1.5, cd: 14, when: () => hpK() < 0.55 && this.swordT <= 0 },
        { name: 'throw', use: () => this.skill3(), min: 7, max: 30, weight: 1.4, cd: 4, when: () => this.swordT > 0 && this.swordT < 5 },
        { name: 'bff', use: () => this.toggle(), min: 2, max: 9, weight: 1.6, cd: 9, when: () => hpK() < 0.4 },
        { name: 'grab', use: () => { const t = this.target(); if (t) this.collarGrab(t); }, min: 2, max: 14, weight: 1.3, cd: 7, when: base },
        { name: 'bow', use: () => this.attack(), min: BOW_RANGE + 0.5, max: 40, weight: 1, cd: 1.5, when: () => base() && this.swordT <= 0 },
        { name: 'glory', use: () => this.release(), min: 0, max: 60, weight: 5, cd: 8, when: () => voll() && !this.gloryUsed && this.vollT < 30 },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    const v = this.form === 'voll';
    const sword = this.swordT > 0;
    return [
      { key: 'LMB', name: sword ? 'Flame sword' : v ? 'The Heat' : 'Brawl / crossbow', kanji: sword ? '炎剣' : '灼熱' },
      { key: 'RMB', name: v ? 'Burner Finger 1 — rapid' : 'Burner Finger 1', kanji: '一', cost: v ? 16 : 8, cd: cd.bf1, cdMax: v ? 1.6 : 0.9, tint: FIRE_BODY },
      { key: 'Q', name: 'Burner Finger 2', kanji: '二', cost: 16, cd: cd.bf2, cdMax: 4, tint: FIRE_BODY },
      { key: 'E', name: 'Burner Finger 3', kanji: '三', cost: 24, cd: cd.bf3, cdMax: 10, tint: FIRE_BODY },
      sword
        ? { key: 'R', name: 'Throw the sword', kanji: '投', active: true, timer: this.swordT / SWORD_TIME, tint: FIRE_BODY }
        : { key: 'R', name: 'Burner Finger 4', kanji: '四', cost: 30, cd: cd.bf4, cdMax: 14, tint: FIRE_BODY },
      { key: 'G', name: 'Burning Full Fingers', kanji: '五', cost: 30, cd: cd.bff, cdMax: 9, tint: FIRE_BODY },
      v
        ? { key: 'F', name: 'Glory Thief', kanji: '狙撃', cost: 40, active: !this.gloryUsed, timer: this.vollT / VOLL_TIME, tint: VOLL_RED }
        : { key: 'F', name: 'Vollständig', kanji: '完聖体', cost: 50, cd: this.vollCd, cdMax: VOLL_CD, tint: VOLL_RED },
      { key: 'Shift', name: 'Hirenkyaku / collar grab', kanji: '飛廉脚', cost: 4, cd: cd.grab, cdMax: 6 },
      { key: 'V', name: 'Heat flare', kanji: '霊圧', active: this.flare },
    ];
  }
}
