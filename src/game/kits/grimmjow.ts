// Grimmjow's kit (docs/roster/E2-espada-2.md §2 kit proposal). Sealed Sexta: jab → hook → spinning
// back-kick → rising knee → axe-kick stomp, lunging nukite, red palm Cero, Gran Rey Cero (palm cut on
// the blade, spinning blue beam), Sonído behind the target into a stomp. F: "Kishire, Pantera" —
// heals and swaps the body. Pantera: claw rakes that carve five grooves, heel kick, tail lash, pounce,
// Garra de la Pantera dart-bombs, the Sonic roar and Desgarrón (ten talons, ten trenches).
import * as THREE from 'three';
import { FighterAction, type Fighter, type FighterDef } from '../fighter';
import type { Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { grimmjowAsset, grimmjowProp } from '../../chars/grimmjow';
import { GRIMMJOW_CHAIN, GRIMMJOW_CLIPS, GRIMMJOW_STANCE, PANTERA_CHAIN, PANTERA_CLIPS, PANTERA_STANCE } from '../../chars/grimmjowClips';
import { CeroBeam } from '../projectiles/cero';
import { GetsugaProjectile } from '../projectiles/getsuga';
import { GarraDart } from '../projectiles/garra';
import { BoxShape, CapsuleShape, SphereShape } from '../../destruction/shapes';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from '../../vfx/sprites';
import type { AuraStyle } from '../../vfx/aura';

export const AURA_GRIMMJOW: AuraStyle = { core: '#E6FAFF', body: '#5CC8FF', rim: '#2A7FD0' };
export const AURA_PANTERA: AuraStyle = { core: '#F2FDFF', body: '#86E2FF', rim: '#1F6F9A' };
const TALON = { core: '#F4FEFF', body: '#A8F0FF', rim: '#44C8FF' };

export const GRIMMJOW_DEF: FighterDef = {
  id: 'grimmjow',
  name: 'Grimmjow Jaegerjaquez',
  title: 'Sexta Espada',
  build: () => ({ asset: grimmjowAsset('sealed'), props: [{ key: 'sheath', model: grimmjowProp('sheath'), socket: 'hip.L' }] }),
  stance: GRIMMJOW_STANCE,
  clips: GRIMMJOW_CLIPS,
  aura: AURA_GRIMMJOW,
  hp: 1100,
  rei: 100,
  speed: { run: 9.5, sprint: 20, jump: 12, dash: 11, dashTime: 0.11 },
  radius: 0.42,
  height: 1.86,
};

const SPEED_PANTERA = { run: 12.5, sprint: 28, jump: 15, dash: 15, dashTime: 0.1 };

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();

interface StrikeSpec {
  damage: number;
  knock: number;
  launch?: number;
  heavy?: boolean;
  hitstop?: number;
  shake?: number;
  /** strike sphere: distance in front, height above the feet, radius (m) */
  reach: number;
  height: number;
  radius: number;
  /** world damage at the strike point: [radius, power] */
  smash?: [number, number];
}

interface MoveSpec {
  s: StrikeSpec;
  lunge: number;
  /** fists for punches, open hands for spear-hands and Cero */
  hands?: 'fist' | 'palm';
  /** crater under the strike point: [radius, power] */
  ground?: [number, number];
  /** spear-hand: bores a tunnel through what is in front */
  bore?: boolean;
  /** claw rake: five grooves, side 1 = left hand (down-right), -1 = right hand (down-left) */
  claws?: 1 | -1;
}

const MOVES: Record<string, MoveSpec> = {
  gj_jab: { lunge: 6, hands: 'fist', s: { damage: 14, knock: 4, reach: 1.15, height: 1.45, radius: 0.85, hitstop: 0.04, shake: 0.1, smash: [0.55, 24] } },
  gj_hook: { lunge: 5, hands: 'fist', s: { damage: 18, knock: 8, launch: 1, reach: 1.1, height: 1.5, radius: 0.95, hitstop: 0.05, shake: 0.16, smash: [0.7, 34] } },
  gj_spinkick: { lunge: 4, hands: 'fist', s: { damage: 28, knock: 15, launch: 3, heavy: true, reach: 1.5, height: 1.1, radius: 1.05, hitstop: 0.08, shake: 0.35, smash: [1.05, 80] } },
  gj_knee: { lunge: 5, hands: 'fist', s: { damage: 22, knock: 3, launch: 10, reach: 0.9, height: 1.05, radius: 0.9, hitstop: 0.07, shake: 0.25 } },
  gj_stomp: { lunge: 3, hands: 'fist', s: { damage: 42, knock: 9, launch: 2, heavy: true, reach: 1.0, height: 0.3, radius: 1.35, hitstop: 0.1, shake: 0.5 }, ground: [1.8, 100] },
  gj_nukite: { lunge: 10, hands: 'palm', bore: true, s: { damage: 48, knock: 12, heavy: true, reach: 1.45, height: 1.4, radius: 0.85, hitstop: 0.11, shake: 0.45 } },
  pt_rake1: { lunge: 7, claws: 1, s: { damage: 24, knock: 6, launch: 1, reach: 1.35, height: 1.15, radius: 1.15, hitstop: 0.05, shake: 0.16 } },
  pt_rake2: { lunge: 7, claws: -1, s: { damage: 24, knock: 6, launch: 1, reach: 1.35, height: 1.15, radius: 1.15, hitstop: 0.05, shake: 0.16 } },
  pt_heelkick: { lunge: 5, s: { damage: 34, knock: 17, launch: 4, heavy: true, reach: 1.45, height: 1.3, radius: 1.15, hitstop: 0.08, shake: 0.38, smash: [1.15, 95] } },
  pt_tail: { lunge: 2, s: { damage: 30, knock: 19, launch: 5, heavy: true, reach: 0, height: 0.7, radius: 2.5, hitstop: 0.09, shake: 0.42, smash: [1.3, 70] } },
  pt_pounce: { lunge: 0, s: { damage: 58, knock: 12, launch: 3, heavy: true, reach: 1.1, height: 0.6, radius: 1.9, hitstop: 0.12, shake: 0.6 }, ground: [1.6, 90] },
};

/** Hit everything inside the strike sphere once; optional world smash at the same point. */
function strike(f: Fighter, g: Game, s: StrikeSpec, hit: Set<number>, color: THREE.ColorRepresentation): THREE.Vector3 {
  const fw = f.forward(_w);
  const p = new THREE.Vector3().copy(f.pos).addScaledVector(fw, s.reach);
  p.y += s.height;
  for (const o of g.enemiesOf(f)) {
    if (hit.has(o.id)) continue;
    const cy = Math.max(o.pos.y + 0.2, Math.min(o.pos.y + o.def.height - 0.2, p.y));
    const d = Math.hypot(o.pos.x - p.x, cy - p.y, o.pos.z - p.z);
    if (d > s.radius + o.def.radius) continue;
    hit.add(o.id);
    const dir = _v.subVectors(o.pos, f.pos).setY(0);
    if (dir.lengthSq() < 1e-4) dir.copy(fw);
    dir.normalize().multiplyScalar(0.7).addScaledVector(fw, 0.3).normalize();
    const weak = o.def.weakAbove !== undefined && p.y > o.pos.y + o.def.height * o.def.weakAbove ? 3 : 1;
    g.damage(o, s.damage * weak, f, dir.clone(), { knock: s.knock, launch: s.launch, heavy: s.heavy || weak > 1, hitstop: s.hitstop, shake: s.shake });
    g.sparks(new THREE.Vector3(o.pos.x, cy, o.pos.z), dir, color, 14);
  }
  if (s.smash) g.engine.destruction.carve(new SphereShape(p, s.smash[0]), { mode: 'smash', power: s.smash[1], impulse: 6 + s.smash[1] * 0.06, dust: 0.5 });
  return p;
}

/** Five parallel claw grooves cut into whatever is in front, along the rake diagonal. */
function clawGrooves(f: Fighter, g: Game, side: 1 | -1, reach: number, power: number): void {
  const fw = f.forward(new THREE.Vector3());
  const left = new THREE.Vector3(fw.z, 0, -fw.x);
  const up = new THREE.Vector3(0, 1, 0);
  const axis = left.clone().multiplyScalar(side).add(up).normalize();
  const perp = new THREE.Vector3().crossVectors(fw, axis).normalize();
  const c = f.pos.clone().addScaledVector(fw, reach);
  c.y += 1.15;
  _m.makeBasis(axis, perp, fw);
  _q.setFromRotationMatrix(_m);
  for (let i = -2; i <= 2; i++) {
    const p = c.clone().addScaledVector(perp, i * 0.21);
    g.engine.destruction.carve(new BoxShape(p, new THREE.Vector3(1.35, 0.055, 0.75), _q.clone()), { mode: 'cut', power, dir: fw.clone(), sparks: [0.7, 0.95, 1], dust: 0.5 });
  }
}

function setHands(f: Fighter, pose: 'fist' | 'palm', side: 'L' | 'R' | 'both' = 'both'): void {
  const rig = f.visual.rig;
  for (const s of side === 'both' ? ['L', 'R'] : [side]) {
    rig.setBoneVisible(`fist.${s}`, pose === 'fist');
    rig.setBoneVisible(`palm.${s}`, pose === 'palm');
  }
}

function socketPos(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

/** One step of the light chain (or a heavy): lunge, strike at the 'hit' event, chain on input. */
class BrawlAction extends FighterAction {
  readonly name: string;
  private spec: MoveSpec;
  private hits = new Set<number>();
  private dur = 0;
  private comboAt = 0;
  private struck = false;
  private hitAt = 0;
  queued = false;

  constructor(readonly kit: GrimmjowKit, readonly clip: string, readonly index: number, readonly heavy = false) {
    super();
    this.name = clip;
    this.spec = MOVES[clip];
    this.mobility = 0.12;
    this.airGravity = 0.12;
  }

  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    this.hitAt = c.events.hit ?? this.dur * 0.4;
    if (this.spec.hands) setHands(f, this.spec.hands);
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n === 'step') {
          const fw = f.forward();
          const tgt = f.faceTarget;
          const extra = tgt ? Math.min(5, Math.max(0, f.pos.distanceTo(tgt) - 1.8)) : 0;
          f.push.addScaledVector(fw, this.spec.lunge + extra * 2);
          g.sfx.play(this.spec.s.damage >= 28 ? 'swingHeavy' : 'swing', f.center(), 0.8);
        }
      },
    });
  }

  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.struck && this.t >= this.hitAt) {
      this.struck = true;
      const p = strike(f, g, this.spec.s, this.hits, f.def.aura.body);
      if (this.spec.claws) {
        clawGrooves(f, g, this.spec.claws, this.spec.s.reach + 0.2, 280);
        this.kit.clawFlash(f, this.spec.claws);
      }
      if (this.spec.ground && f.grounded) {
        const gp = p.clone();
        gp.y = f.pos.y;
        g.groundImpact(gp, this.spec.ground[0], this.spec.ground[1], f.def.aura.body, f);
      }
      if (this.spec.bore) {
        const fw = f.forward();
        const a = f.center().addScaledVector(fw, 0.6);
        const b = a.clone().addScaledVector(fw, 3.2);
        g.engine.destruction.carve(new CapsuleShape(a, b, 0.45), { mode: 'bore', power: 160, sparks: [0.7, 0.9, 1], dust: 0.6, impulse: 8 });
      }
    }
    if (this.queued && this.t >= this.comboAt) {
      this.done = true;
      this.kit.chain(this.index + 1);
      return;
    }
    if (this.t >= this.dur) this.done = true;
  }

  override end(f: Fighter): void {
    if (!this.kit.pantera) setHands(f, 'palm');
  }

  override canCancel(next: FighterAction): boolean {
    if (next.name === 'dash' || next instanceof SkillAction) return this.t >= this.hitAt + 0.05;
    return false;
  }
}

/** Base for specials (so chains can cancel into them). */
abstract class SkillAction extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: GrimmjowKit) {
    super();
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= this.dur) this.done = true;
  }
}

class CeroAction extends SkillAction {
  readonly name = 'cero';
  private beam: CeroBeam | null = null;
  constructor(kit: GrimmjowKit) {
    super(kit);
    this.mobility = 0.08;
    this.airGravity = 0.05;
    this.armor = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('gj_cero')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    setHands(f, 'palm', 'R');
    f.anim.play('gj_cero', {
      onEvent: (n) => {
        if (n !== 'charge' || this.beam) return;
        const emitter = f.visual.rig.sockets.get('palm.R')!;
        const tgt = () => (f.faceTarget ? f.faceTarget.clone() : f === g.player ? g.aimPoint(f) : f.center().addScaledVector(f.forward(), 40));
        this.beam = new CeroBeam(g, f, emitter, tgt, { charge: 0.3, fire: 0.45, radius: 0.42, damage: 70, power: 280, core: '#FFD2D6', body: '#E31B2E', rim: '#8C0C18', range: 80, track: 1.6 });
        g.addProjectile(this.beam);
        g.sfx.play('charge', f.center(), 0.6);
      },
    });
  }
  override end(f: Fighter): void {
    if (!this.kit.pantera) setHands(f, 'palm');
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t > 0.75;
  }
}

class GranReyAction extends SkillAction {
  readonly name = 'granrey';
  constructor(kit: GrimmjowKit) {
    super(kit);
    this.mobility = 0;
    this.airGravity = 0.02;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('gj_granrey')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.anim.play('gj_granrey', {
      onEvent: (n) => {
        if (n === 'draw') this.kit.drawSword(true);
        if (n === 'cut') {
          // the palm dragged along the edge: blood for the Gran Rey Cero (costs a little HP)
          f.hp = Math.max(1, f.hp - f.maxHp * 0.04);
          const p = socketPos(f, 'palm.L');
          for (let i = 0; i < 16; i++)
            g.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5) * 1.5, vy: Math.random() * 1.2, vz: (Math.random() - 0.5) * 1.5, size: 0.05, sizeEnd: 0.03, life: 0.7, r: 0.55, g: 0.02, b: 0.04, alpha: 1, alphaEnd: 0.6, tex: TEX_GLOW, gravity: -9 });
          g.sfx.play('swing', p, 0.5);
        }
        if (n === 'charge') {
          setHands(f, 'palm', 'L');
          const emitter = f.visual.rig.sockets.get('palm.L')!;
          const tgt = () => (f.faceTarget ? f.faceTarget.clone() : f === g.player ? g.aimPoint(f) : f.center().addScaledVector(f.forward(), 60));
          g.addProjectile(new CeroBeam(g, f, emitter, tgt, { charge: 0.45, fire: 1.0, radius: 1.5, damage: 230, power: 760, core: '#DDEBFF', body: '#2C6BFF', rim: '#2A1E5C', range: 150, track: 0.6, spiral: true }));
          g.callout('王虚の閃光', 'GRAN REY CERO', '#7fa8ff');
          g.sfx.play('charge', f.center(), 1);
          f.aura.flare(1.8, 0.8);
          g.engine.gr.chroma.offset.set(0.006, 0.006);
        }
        if (n === 'fire') g.sfx.play('beam', f.center(), 1.4);
        if (n === 'sheathe') this.kit.drawSword(false);
      },
    });
  }
  override end(f: Fighter): void {
    this.kit.drawSword(false);
    setHands(f, 'palm');
  }
}

/** Sonído behind the target, then the axe-kick stomp where it stands. */
class SonidoSmashAction extends SkillAction {
  readonly name = 'sonido';
  private hits = new Set<number>();
  private struck = false;
  constructor(kit: GrimmjowKit, readonly target: Fighter | null) {
    super(kit);
    this.mobility = 0;
    this.airGravity = 0.1;
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    const t = this.target;
    f.ghosts.spawn(0.5, 1);
    g.onDash(f);
    if (t) {
      const back = t.forward().multiplyScalar(-1.5);
      f.body.pos.set(t.pos.x + back.x, Math.max(t.pos.y, f.pos.y - 0.5), t.pos.z + back.z);
      f.body.prev.copy(f.body.pos);
      f.yaw = Math.atan2(t.pos.x - f.pos.x, t.pos.z - f.pos.z);
    }
    f.ghosts.spawn(0.5, 1);
    setHands(f, 'fist');
    const inst = f.anim.play('gj_stomp', { fadeIn: 0.02 });
    if (inst) inst.time = 0.14;
    this.dur = 0.62;
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t > 0.12) this.invulnerable = false;
    if (!this.struck && this.t >= 0.24) {
      this.struck = true;
      const p = strike(f, g, { damage: 46, knock: 10, launch: 3, heavy: true, reach: 1.0, height: 0.3, radius: 1.5, hitstop: 0.1, shake: 0.5 }, this.hits, f.def.aura.body);
      p.y = f.pos.y;
      if (f.grounded) g.groundImpact(p, 1.9, 110, f.def.aura.body, f);
    }
  }
  override end(f: Fighter): void {
    if (!this.kit.pantera) setHands(f, 'palm');
  }
}

class ReleaseAction extends SkillAction {
  readonly name = 'release';
  constructor(kit: GrimmjowKit) {
    super(kit);
    this.invulnerable = true;
    this.trackTarget = false;
    this.dur = 2.2;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('gj_release', {
      onEvent: (n) => {
        if (n === 'draw') this.kit.drawSword(true);
        if (n === 'rake') {
          g.callout('軋れ「豹王」', 'KISHIRE, PANTERA', '#9fe6ff');
          f.aura.flare(2, 0.9);
          g.sfx.play('flare', f.center());
          const p = socketPos(f, 'grip.R');
          for (let i = 0; i < 30; i++)
            g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5) * 5, vy: Math.random() * 4, vz: (Math.random() - 0.5) * 5, size: 0.2, sizeEnd: 0.03, life: 0.6, r: 0.62, g: 0.88, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2.5, drag: 2 });
        }
        if (n === 'burst') this.kit.becomePantera();
      },
    });
  }
}

class PounceAction extends SkillAction {
  readonly name = 'pounce';
  private hits = new Set<number>();
  private struck = false;
  constructor(kit: GrimmjowKit) {
    super(kit);
    this.mobility = 0;
    this.airGravity = 1;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('pt_pounce')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.anim.play('pt_pounce', {
      onEvent: (n) => {
        if (n === 'leap') {
          const tgt = f.faceTarget;
          const dist = tgt ? Math.min(16, Math.max(3, Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z) - 1.2)) : 9;
          f.push.addScaledVector(f.forward(), dist * 2.4);
          f.body.vel.y = 7.5;
          f.body.grounded = false;
          f.ghosts.spawn(0.4, 0.8);
          g.sfx.play('shunpo', f.center(), 0.8);
        }
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.struck && this.t >= 0.55) {
      this.struck = true;
      const spec = MOVES.pt_pounce;
      const p = strike(f, g, spec.s, this.hits, f.def.aura.body);
      p.y = f.pos.y;
      if (f.grounded && spec.ground) g.groundImpact(p, spec.ground[0], spec.ground[1], f.def.aura.body, f);
      clawGrooves(f, g, 1, 0.9, 260);
      clawGrooves(f, g, -1, 0.9, 260);
    }
  }
}

class GarraAction extends SkillAction {
  readonly name = 'garra';
  private fired = 0;
  private fireAt = 0.36;
  constructor(kit: GrimmjowKit) {
    super(kit);
    this.mobility = 0.1;
    this.airGravity = 0.05;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('pt_garra')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.fireAt = c.events.fire ?? 0.36;
    f.anim.play('pt_garra');
    g.callout('豹鉤', 'GARRA DE LA PANTERA', '#7fd8ae');
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    // five darts, alternating elbows, a beat apart
    while (this.fired < 5 && this.t >= this.fireAt + this.fired * 0.07) {
      const side = this.fired % 2 === 0 ? 'elbow.L' : 'elbow.R';
      const o = socketPos(f, side);
      const tgtF = this.kit.target();
      const aim = f.faceTarget ? f.faceTarget.clone() : f === g.player ? g.aimPoint(f) : f.center().addScaledVector(f.forward(), 40);
      const dir = aim.sub(o).normalize();
      // fan the volley a little
      const spread = (this.fired - 2) * 0.06;
      dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), spread).normalize();
      g.addProjectile(new GarraDart(g, f, o, dir, tgtF, { speed: 46, damage: 46, blast: 2.4, power: 320, range: 90, homing: 1.4 }));
      g.sfx.play('shunpo', o, 0.7);
      this.fired++;
    }
  }
}

class RoarAction extends SkillAction {
  readonly name = 'roar';
  private roared = false;
  constructor(kit: GrimmjowKit, readonly damage = true) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.6;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('pt_roar')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.anim.play('pt_roar', { onEvent: (n) => { if (n === 'roar') this.roar(f, g); } });
  }
  private roar(f: Fighter, g: Game): void {
    if (this.roared) return;
    this.roared = true;
    const c = f.center();
    g.sfx.play('roarBig', c, 1.2);
    for (let i = 0; i < 4; i++) setTimeout(() => g.addRing(f.center(), 7 + i * 4.5, '#cfefff', 0.5 + i * 0.1), i * 110);
    g.shake(0.5);
    g.engine.gr.chroma.offset.set(0.007, 0.007);
    if (!this.damage) return;
    for (const o of g.enemiesOf(f)) {
      const d = o.pos.distanceTo(f.pos);
      if (d > 15) continue;
      const k = 1 - d / 15;
      g.damage(o, 26 * k + 6, f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 22 * k + 4, launch: 4 * k, heavy: d < 8, hitstop: 0.05, shake: 0.4 });
    }
    // the sound wave shatters thin walls close by
    const fw = f.forward();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const p = f.center().add(new THREE.Vector3(Math.cos(a) * 3.5 + fw.x, 0.4, Math.sin(a) * 3.5 + fw.z));
      g.engine.destruction.carve(new SphereShape(p, 1.6), { mode: 'smash', power: 40, impulse: 12, dust: 0.4 });
    }
  }
}

/** Desgarrón: five talons over each hand; the left set is brought down like a cleaver, the right hurled. */
class DesgarronAction extends SkillAction {
  readonly name = 'desgarron';
  private glowT = 0;
  constructor(kit: GrimmjowKit) {
    super(kit);
    this.mobility = 0;
    this.airGravity = 0.03;
    this.armor = 0.7;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('pt_desgarron')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.anim.play('pt_desgarron', {
      onEvent: (n) => {
        if (n === 'charge') {
          g.callout('豹王の爪', 'DESGARRÓN', '#a8f0ff');
          f.aura.flare(2.2, 1.2);
          g.sfx.play('flare', f.center(), 0.9);
        }
        if (n === 'left') this.throwSet(f, g, 1);
        if (n === 'right') this.throwSet(f, g, -1);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    // claws glow, talons forming over the hands
    this.glowT += dt;
    if (this.t > 0.2 && this.t < 1.55) {
      for (const s of ['L', 'R']) {
        const p = socketPos(f, `palm.${s}`);
        for (let i = 0; i < 2; i++)
          g.engine.glow.spawn({ x: p.x + (Math.random() - 0.5) * 0.4, y: p.y + (Math.random() - 0.5) * 0.4, z: p.z + (Math.random() - 0.5) * 0.4, vx: 0, vy: 1.5, vz: 0, size: 0.18, sizeEnd: 0.02, life: 0.3, r: 0.66, g: 0.94, b: 1, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: 2 });
      }
    }
  }
  private throwSet(f: Fighter, g: Game, side: 1 | -1): void {
    const fw = f.forward();
    let dir = fw.clone();
    if (f.faceTarget) dir = f.faceTarget.clone().sub(f.center()).normalize();
    else if (f === g.player) dir = g.aimPoint(f).sub(f.center()).normalize();
    dir.y = Math.max(-0.15, Math.min(0.5, dir.y));
    dir.normalize();
    const left = new THREE.Vector3(dir.z, 0, -dir.x).normalize();
    // talons lie along the swipe: the left set cuts down to the right, the right set down to the left
    const up = new THREE.Vector3(0, 1, 0);
    const blade = left.clone().multiplyScalar(-side * 0.55).add(up).normalize();
    const across = new THREE.Vector3().crossVectors(dir, blade).normalize();
    const base = f.center().addScaledVector(dir, 1.4);
    for (let i = -2; i <= 2; i++) {
      const o = base.clone().addScaledVector(across, i * 0.75);
      g.addProjectile(new GetsugaProjectile(g, f, o, dir.clone(), blade.clone(), { radius: 7, halfAngle: 0.36, speed: 58, range: 110, damage: 70, cut: 820, colors: TALON }));
    }
    g.sfx.play('getsuga', f.center(), 1.3);
    g.shake(0.6);
    g.hitstop(0.05);
    f.push.addScaledVector(dir, -3);
    if (f === g.player) g.cam.punchFov(7);
  }
}

export class GrimmjowKit implements Kit {
  comboIndex = 0;
  private lastSwingEnd = 0;
  pantera = false;
  flare = false;
  private cd = { cero: 0, granrey: 0, sonido: 0, garra: 0, roar: 0, desgarron: 0, pounce: 0 };
  private swordOut = false;

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.damageTaken = 0.85; // Hierro
    setHands(f, 'palm');
  }

  update(dt: number): void {
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      this.f.rei -= dt * 6;
      if (this.f.rei <= 0) this.toggleFlare();
    }
  }

  target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 80, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 80);
  }

  private chainList(): string[] {
    return this.pantera ? PANTERA_CHAIN : GRIMMJOW_CHAIN;
  }

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof BrawlAction && !cur.heavy) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastSwingEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const list = this.chainList();
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    this.lastSwingEnd = this.g.time + 0.8;
    this.f.act(new BrawlAction(this, list[idx], idx), true);
  }

  heavy(): void {
    const f = this.f;
    if (f.busy && !(f.action instanceof BrawlAction)) return;
    if (f.action instanceof BrawlAction && f.action.t < 0.2) return;
    this.comboIndex = 0;
    if (this.pantera) {
      if (this.cd.pounce > 0) return;
      this.cd.pounce = 1.2;
      f.act(new PounceAction(this), true);
    } else f.act(new BrawlAction(this, 'gj_nukite', 0, true), true);
  }

  private special(a: SkillAction, cost: number, cdKey: keyof typeof this.cd, cd: number): void {
    const f = this.f;
    if (this.cd[cdKey] > 0) return;
    if (f.action && !f.action.canCancel(a)) return;
    if (f.hitstun > 0 || f.dashT > 0 || f.dead) return;
    if (!f.spendRei(cost)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    this.cd[cdKey] = cd;
    f.act(a, true);
  }

  /** Q: Cero (sealed) / Garra de la Pantera (released). */
  skill1(): void {
    if (this.pantera) this.special(new GarraAction(this), 22, 'garra', 2.6);
    else this.special(new CeroAction(this), 14, 'cero', 1.1);
  }

  /** E: Gran Rey Cero (sealed) / Sonic roar (released). */
  skill2(): void {
    if (this.pantera) this.special(new RoarAction(this), 10, 'roar', 5);
    else this.special(new GranReyAction(this), 35, 'granrey', 9);
  }

  /** R: Sonído smash (sealed) / Desgarrón (released). */
  skill3(): void {
    if (this.pantera) this.special(new DesgarronAction(this), 45, 'desgarron', 12);
    else this.special(new SonidoSmashAction(this, this.target()), 10, 'sonido', 3.5);
  }

  release(): void {
    const f = this.f;
    if (this.pantera || f.busy) return;
    if (!f.spendRei(40)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(new ReleaseAction(this), true);
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

  /** Pantera in hand (sealed form only): sheath swaps to its empty variant. */
  drawSword(on: boolean): void {
    if (this.pantera || on === this.swordOut) return;
    const v = this.f.visual;
    this.swordOut = on;
    if (on) {
      setHands(this.f, 'fist', 'R');
      v.attach('sword', grimmjowProp('katana'), 'grip.R');
      v.attach('sheath', grimmjowProp('sheath-empty'), 'hip.L');
    } else {
      v.detach('sword');
      v.attach('sheath', grimmjowProp('sheath'), 'hip.L');
    }
  }

  /** The release burst: torrent of reiatsu, gale, wounds heal, Pantera's body. */
  becomePantera(): void {
    const { f, g } = this;
    if (this.pantera) return;
    this.swordOut = false;
    this.pantera = true;
    f.def = { ...f.def, stance: PANTERA_STANCE, clips: PANTERA_CLIPS, speed: { ...SPEED_PANTERA } };
    f.setForm({ asset: grimmjowAsset('pantera'), props: [] }, AURA_PANTERA);
    setHands(f, 'palm');
    f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.35);
    f.damageTaken = 0.7;
    this.applyStats();
    f.aura.pillarBurst(2.4);
    f.aura.flare(2.4, 1.4);
    g.sfx.play('bankai', f.center());
    g.groundImpact(f.pos.clone(), 3, 90, AURA_PANTERA.body, f);
    g.shake(0.9);
    g.hitstop(0.1);
    g.slowMo(0.45, 0.35);
    g.engine.gr.chroma.offset.set(0.007, 0.007);
    // gale: everything nearby is thrown back
    for (const o of g.enemiesOf(f)) {
      const d = o.pos.distanceTo(f.pos);
      if (d < 14) g.damage(o, 25 * (1 - d / 14), f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 24 * (1 - d / 14), launch: 6, heavy: true });
    }
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.dust.spawn({ x: f.pos.x, y: f.pos.y + 0.3, z: f.pos.z, vx: Math.cos(a) * (10 + Math.random() * 8), vy: Math.random() * 2, vz: Math.sin(a) * (10 + Math.random() * 8), size: 0.8, sizeEnd: 2.8, life: 1.2, r: 0.75, g: 0.86, b: 0.95, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
    }
    // the new body announces itself with a roar
    f.act(new RoarAction(this, false), true);
  }

  /** Cyan claw flash along a rake. */
  clawFlash(f: Fighter, side: 1 | -1): void {
    const fw = f.forward();
    const left = new THREE.Vector3(fw.z, 0, -fw.x);
    const c = f.center().addScaledVector(fw, 1.2);
    for (let i = 0; i < 18; i++) {
      const u = Math.random() * 2 - 1;
      const p = c.clone().addScaledVector(left, side * u * 0.9).add(new THREE.Vector3(0, u * 0.9, 0));
      this.g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: -left.x * side * 6, vy: -6, vz: -left.z * side * 6, size: 0.14, sizeEnd: 0.02, life: 0.18, r: 0.66, g: 0.94, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
    }
  }

  private applyStats(): void {
    const f = this.f;
    f.power = (this.pantera ? 1.35 : 1) * (this.flare ? 1.3 : 1);
    f.aura.target = this.flare ? 1 : this.pantera ? 0.35 : 0.2;
  }

  formName(): string {
    return this.pantera ? 'Resurrección — Pantera' : 'Sexta Espada';
  }

  ai(): KitAI {
    return {
      reach: 1.5,
      chain: 5,
      releaseAt: 0.55,
      moves: [
        { name: 'cero', use: () => this.skill1(), min: 5, max: 38, weight: 3, cd: 2.5, when: () => !this.pantera },
        { name: 'granrey', use: () => this.skill2(), min: 10, max: 60, weight: 1.3, cd: 12, when: () => !this.pantera },
        { name: 'sonido', use: () => this.skill3(), min: 3.5, max: 26, weight: 2, cd: 5, when: () => !this.pantera },
        { name: 'nukite', use: () => this.heavy(), min: 0, max: 2.6, weight: 1, cd: 3, when: () => !this.pantera },
        { name: 'garra', use: () => this.skill1(), min: 7, max: 45, weight: 2.6, cd: 4, when: () => this.pantera },
        { name: 'roar', use: () => this.skill2(), min: 0, max: 7, weight: 1.4, cd: 7, when: () => this.pantera },
        { name: 'desgarron', use: () => this.skill3(), min: 6, max: 40, weight: 1.4, cd: 14, when: () => this.pantera },
        { name: 'pounce', use: () => this.heavy(), min: 4, max: 15, weight: 2, cd: 3, when: () => this.pantera },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const p = this.pantera;
    return [
      { key: 'LMB', name: p ? 'Claws' : 'Brawl', kanji: p ? '爪' : '拳' },
      { key: 'RMB', name: p ? 'Pounce' : 'Nukite', kanji: p ? '跳' : '貫' },
      p ? { key: 'Q', name: 'Garra', kanji: '豹鉤', cost: 22, cd: this.cd.garra, cdMax: 2.6 } : { key: 'Q', name: 'Cero', kanji: '虚閃', cost: 14, cd: this.cd.cero, cdMax: 1.1 },
      p ? { key: 'E', name: 'Roar', kanji: '咆', cost: 10, cd: this.cd.roar, cdMax: 5 } : { key: 'E', name: 'Gran Rey', kanji: '王虚', cost: 35, cd: this.cd.granrey, cdMax: 9 },
      p ? { key: 'R', name: 'Desgarrón', kanji: '豹王', cost: 45, cd: this.cd.desgarron, cdMax: 12 } : { key: 'R', name: 'Sonído', kanji: '響転', cost: 10, cd: this.cd.sonido, cdMax: 3.5 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      { key: 'F', name: 'Pantera', kanji: '豹王', cost: 40, active: p, tint: '#86e2ff' },
    ];
  }
}
