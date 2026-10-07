// Ulquiorra's kit (docs/roster/E1-espada-1.md §Ulquiorra kit proposal). Sealed: hands in his pockets —
// backhand, palm, knee, the big side kick; the hand-spear through the chest; the green finger Cero;
// red Bala; Sonído behind the target into the kick; G draws Murciélago (precise thrusts, a strike that
// splits the floor). F: "Tozase, Murciélago" — black bat wings, flight, green rain; Luz de la Luna
// swung and thrown, Cero Oscuras, the wing slap, a cleaving slash that halves towers. F again:
// Segunda Etapa — claws and tail, the head-grab rush, Lanza del Relámpago. Passive: high-speed
// regeneration (heals while reiatsu lasts).
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { ulquiorraAsset, ulquiorraProp } from '../../chars/ulquiorra';
import {
  MURCIELAGO_CHAIN, MURCIELAGO_STANCE, SEGUNDA_CHAIN, SEGUNDA_STANCE, ULQUIORRA_CHAIN, ULQUIORRA_CLIPS, ULQUIORRA_STANCE, ULQUIORRA_SWORD_CHAIN, ULQUIORRA_SWORD_STANCE,
} from '../../chars/ulquiorraClips';
import { CeroBeam } from '../projectiles/cero';
import { BalaShot } from '../projectiles/bala';
import { Javelin } from '../projectiles/lanza';
import { BoxShape, CapsuleShape, SphereShape } from '../../destruction/shapes';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from '../../vfx/sprites';
import type { AuraStyle } from '../../vfx/aura';

export const AURA_ULQUIORRA: AuraStyle = { core: '#E8FFE8', body: '#38D46A', rim: '#1FA34A' };
export const AURA_SEGUNDA: AuraStyle = { core: '#9CFFB8', body: '#2EE06A', rim: '#0E3B1E', dark: '#050806' };

type BladeDef = NonNullable<FighterDef['blade']>;
const BLADE_SWORD: BladeDef = { prop: 'sword', base: [0, 0, 0.14], tip: [0, 0, 0.92], color: '#7DFFA0', core: '#E8FFE8' };
const BLADE_SPEAR: BladeDef = { prop: 'sword', base: [0, 0, 0.3], tip: [0, 0, 1.14], color: '#5CFF8A', core: '#D9FFE4' };

export const ULQUIORRA_DEF: FighterDef = {
  id: 'ulquiorra',
  name: 'Ulquiorra Cifer',
  title: 'Cuarta Espada',
  build: () => ({ asset: ulquiorraAsset('sealed'), props: [{ key: 'sheath', model: ulquiorraProp('sheath'), socket: 'hip.L' }] }),
  stance: ULQUIORRA_STANCE,
  clips: ULQUIORRA_CLIPS,
  aura: AURA_ULQUIORRA,
  blade: BLADE_SWORD,
  hp: 1100,
  rei: 130,
  speed: { run: 9.5, sprint: 23, jump: 12, dash: 14, dashTime: 0.1 },
  radius: 0.4,
  height: 1.69,
};

const SPEED_R1 = { run: 11, sprint: 27, jump: 14, dash: 16, dashTime: 0.1 };
const SPEED_R2 = { run: 12.5, sprint: 30, jump: 15, dash: 18, dashTime: 0.09 };

type Form = 'sealed' | 'murcielago' | 'segunda';

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
  reach: number;
  height: number;
  radius: number;
  smash?: [number, number];
}

interface MoveInfo {
  lunge: number;
  strike?: StrikeSpec;
  window?: [number, number];
  trail?: [number, number];
  spec?: BladeSpec;
  rehit?: number;
  /** hand pose for fists / open hands while the move plays */
  bore?: boolean;
  /** the floor splits ahead along the cut */
  split?: boolean;
}

const MOVES: Record<string, MoveInfo> = {
  ul_backhand: { lunge: 6, strike: { damage: 15, knock: 7, launch: 1, reach: 1.1, height: 1.35, radius: 0.85, hitstop: 0.04, shake: 0.1, smash: [0.55, 26] } },
  ul_palm: { lunge: 6, strike: { damage: 18, knock: 11, launch: 1, reach: 1.15, height: 1.3, radius: 0.85, hitstop: 0.05, shake: 0.14, smash: [0.65, 34] } },
  ul_knee: { lunge: 5, strike: { damage: 20, knock: 3, launch: 9, reach: 0.85, height: 0.95, radius: 0.85, hitstop: 0.06, shake: 0.2 } },
  ul_kick: { lunge: 4, strike: { damage: 32, knock: 26, launch: 4, heavy: true, reach: 1.35, height: 1.15, radius: 1.0, hitstop: 0.09, shake: 0.4, smash: [1.0, 90] } },
  ul_nukite: { lunge: 11, bore: true, strike: { damage: 58, knock: 10, heavy: true, reach: 1.35, height: 1.3, radius: 0.8, hitstop: 0.13, shake: 0.5 } },
  ul_thrust1: { lunge: 9, window: [0.1, 0.22], trail: [0.08, 0.26], spec: { damage: 20, knock: 7, launch: 0, hitstop: 0.04, shake: 0.1, cut: 250 } },
  ul_thrust2: { lunge: 9, window: [0.1, 0.22], trail: [0.08, 0.26], spec: { damage: 20, knock: 7, launch: 1, hitstop: 0.04, shake: 0.1, cut: 250 } },
  ul_split: { lunge: 6, window: [0.21, 0.32], trail: [0.18, 0.4], split: true, spec: { damage: 42, knock: 10, launch: 3, heavy: true, hitstop: 0.1, shake: 0.4, cut: 500 } },
  ul_spear1: { lunge: 10, window: [0.1, 0.24], trail: [0.08, 0.28], spec: { damage: 34, knock: 10, launch: 1, hitstop: 0.06, shake: 0.18, cut: 420 } },
  ul_spear2: { lunge: 7, window: [0.11, 0.27], trail: [0.09, 0.32], spec: { damage: 36, knock: 12, launch: 3, hitstop: 0.06, shake: 0.2, cut: 420 } },
  ul_claw1: { lunge: 9, strike: { damage: 34, knock: 9, launch: 2, reach: 1.3, height: 1.2, radius: 1.1, hitstop: 0.05, shake: 0.18, smash: [0.9, 90] } },
  ul_claw2: { lunge: 9, strike: { damage: 34, knock: 9, launch: 2, reach: 1.3, height: 1.2, radius: 1.1, hitstop: 0.05, shake: 0.18, smash: [0.9, 90] } },
  ul_tail: { lunge: 3, strike: { damage: 44, knock: 24, launch: 6, heavy: true, reach: 0, height: 0.9, radius: 3.0, hitstop: 0.09, shake: 0.42, smash: [1.4, 120] } },
};

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
    g.damage(o, s.damage, f, dir.clone(), { knock: s.knock, launch: s.launch, heavy: s.heavy, hitstop: s.hitstop, shake: s.shake });
    g.sparks(new THREE.Vector3(o.pos.x, cy, o.pos.z), dir, color, 14);
  }
  if (s.smash) g.engine.destruction.carve(new SphereShape(p, s.smash[0]), { mode: 'smash', power: s.smash[1], impulse: 6 + s.smash[1] * 0.06, dust: 0.5 });
  return p;
}

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

function aim(f: Fighter, g: Game, out = new THREE.Vector3()): THREE.Vector3 {
  if (f.faceTarget) return out.copy(f.faceTarget);
  if (f === g.player) return g.aimPoint(f, out);
  return f.center(out).addScaledVector(f.forward(_v), 30);
}

function setHands(f: Fighter, pose: 'fist' | 'palm', side: 'L' | 'R' | 'both' = 'both'): void {
  for (const s of side === 'both' ? ['L', 'R'] : [side]) {
    f.visual.rig.setBoneVisible(`fist.${s}`, pose === 'fist');
    f.visual.rig.setBoneVisible(`palm.${s}`, pose === 'palm');
  }
}

// ------------------------------------------------------------------ the strings

class StringAction extends FighterAction {
  readonly name: string;
  private info: MoveInfo;
  private dur = 0;
  private comboAt = 0;
  private hitAt = 0;
  private struck = false;
  private split = false;
  private rehitDone = false;
  private hits = new Set<number>();
  queued = false;

  constructor(readonly kit: UlquiorraKit, readonly clip: string, readonly index: number, readonly heavy = false) {
    super();
    this.name = clip;
    this.info = MOVES[clip];
    this.mobility = 0.12;
    this.airGravity = 0.1;
  }

  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    this.hitAt = c.events.hit ?? this.dur * 0.4;
    f.bladeHits.clear();
    f.bladeSpec = this.info.spec ?? null;
    if (this.info.bore) setHands(f, 'palm', 'R');
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n !== 'step') return;
        const tgt = f.faceTarget;
        const extra = tgt ? Math.min(5, Math.max(0, f.pos.distanceTo(tgt) - 1.7)) : 0;
        f.push.addScaledVector(f.forward(), this.info.lunge + extra * 2.2);
        g.sfx.play(this.info.strike?.heavy || this.info.spec?.heavy ? 'swingHeavy' : 'swing', f.center(), 0.8);
      },
    });
  }

  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t, info = this.info;
    if (info.window) {
      f.bladeActive = t >= info.window[0] && t <= info.window[1];
      if (f.trail && info.trail) f.trail.emitting = t >= info.trail[0] && t <= info.trail[1];
      if (info.rehit && !this.rehitDone && t >= info.rehit) {
        this.rehitDone = true;
        f.bladeHits.clear();
      }
    }
    if (info.strike && !this.struck && t >= this.hitAt) {
      this.struck = true;
      strike(f, g, info.strike, this.hits, f.def.aura.body);
      if (info.bore) {
        const fw = f.forward();
        const a = f.center().addScaledVector(fw, 0.5);
        g.engine.destruction.carve(new CapsuleShape(a, a.clone().addScaledVector(fw, 3.4), 0.42), { mode: 'bore', power: 200, sparks: [0.5, 1, 0.6], dust: 0.6, impulse: 9 });
      }
    }
    if (info.split && !this.split && t >= this.hitAt + 0.01) {
      this.split = true;
      this.kit.splitFloor();
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
    if (this.info.bore) setHands(f, 'fist', 'R');
  }

  override canCancel(next: FighterAction): boolean {
    if (next.name === 'dash' || next instanceof SkillAction) return this.t >= (this.info.window?.[0] ?? this.hitAt) + 0.04;
    return false;
  }
}

abstract class SkillAction extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: UlquiorraKit) {
    super();
  }
  protected playClip(f: Fighter, clip: string, onEvent: (n: string) => void): void {
    const c = f.anim.clip(clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.anim.play(clip, { onEvent });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= this.dur) this.done = true;
  }
  override end(f: Fighter): void {
    f.bladeActive = false;
    if (f.trail) f.trail.emitting = false;
  }
}

/** Green finger Cero (sealed) / Cero Oscuras (released). */
class CeroAction extends SkillAction {
  readonly name: string;
  constructor(kit: UlquiorraKit, readonly oscuras: boolean) {
    super(kit);
    this.name = oscuras ? 'oscuras' : 'cero';
    this.mobility = 0.06;
    this.airGravity = 0.03;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    const clip = this.oscuras ? 'ul_oscuras' : 'ul_cero';
    setHands(f, 'palm', 'R');
    this.playClip(f, clip, (n) => {
      if (n !== 'charge') return;
      const emitter = f.visual.rig.sockets.get('finger.R')!;
      const tgt = () => aim(f, g, new THREE.Vector3());
      if (this.oscuras) {
        g.addProjectile(new CeroBeam(g, f, emitter, tgt, { charge: 0.58, fire: 0.75, radius: 1.15, damage: 190, power: 820, core: '#9CFFB8', body: '#2EE06A', rim: '#0E3B1E', range: 150, track: 0.7, gain: 1.25, dark: '#050806' }));
        g.callout('黒虚閃', 'CERO OSCURAS', '#7dffa0');
        f.aura.flare(1.8, 1);
        g.engine.gr.chroma.offset.set(0.006, 0.006);
      } else {
        g.addProjectile(new CeroBeam(g, f, emitter, tgt, { charge: 0.26, fire: 0.42, radius: 0.42, damage: 72, power: 300, core: '#E8FFE8', body: '#46F07A', rim: '#1FA34A', range: 90, track: 1.6, gain: 1.6 }));
      }
      g.sfx.play('charge', f.center(), this.oscuras ? 1 : 0.6);
    });
  }
  override end(f: Fighter): void {
    super.end(f);
    setHands(f, 'fist', 'R');
  }
}

/** Bala: three red bullets, left-right-left. */
class BalaAction extends SkillAction {
  readonly name = 'bala';
  constructor(kit: UlquiorraKit) {
    super(kit);
    this.mobility = 0.4;
    this.airGravity = 0.05;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ul_bala', (n) => {
      if (n !== 'b1' && n !== 'b2' && n !== 'b3') return;
      const hand = sock(f, n === 'b2' ? 'grip.R' : 'grip.L');
      const dir = aim(f, g).sub(hand).normalize();
      g.addProjectile(new BalaShot(f, g, hand.addScaledVector(dir, 0.3), dir, 16, 72, 70));
      g.sfx.play('swing', hand, 0.5);
    });
  }
}

/** Sonído behind the target, straight into the big kick. */
class SonidoAction extends SkillAction {
  readonly name = 'sonido';
  private hits = new Set<number>();
  private struck = false;
  constructor(kit: UlquiorraKit, readonly target: Fighter | null) {
    super(kit);
    this.mobility = 0;
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    const t = this.target;
    f.ghosts.spawn(0.5, 1);
    g.onDash(f);
    if (t) {
      const back = t.forward().multiplyScalar(-1.4);
      f.body.pos.set(t.pos.x + back.x, Math.max(t.pos.y, f.pos.y - 0.5), t.pos.z + back.z);
      f.body.prev.copy(f.body.pos);
      f.yaw = Math.atan2(t.pos.x - f.pos.x, t.pos.z - f.pos.z);
    }
    f.ghosts.spawn(0.5, 1);
    const inst = f.anim.play('ul_kick', { fadeIn: 0.02 });
    if (inst) inst.time = 0.12;
    this.dur = 0.55;
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t > 0.1) this.invulnerable = false;
    if (!this.struck && this.t >= 0.16) {
      this.struck = true;
      strike(f, g, { damage: 40, knock: 30, launch: 5, heavy: true, reach: 1.3, height: 1.15, radius: 1.1, hitstop: 0.1, shake: 0.45, smash: [1, 90] }, this.hits, f.def.aura.body);
    }
  }
}

/** G: Murciélago drawn (or sheathed). */
class DrawAction extends SkillAction {
  readonly name = 'draw';
  constructor(kit: UlquiorraKit, readonly on: boolean) {
    super(kit);
    this.mobility = 0.5;
  }
  override start(f: Fighter): void {
    if (!this.on) {
      this.kit.drawSword(false);
      this.dur = 0.2;
      return;
    }
    this.playClip(f, 'ul_draw', (n) => {
      if (n === 'draw') this.kit.drawSword(true);
    });
  }
}

/** Luz de la Luna thrown (R1, R2) or Lanza del Relámpago (R2). */
class ThrowAction extends SkillAction {
  readonly name: string;
  constructor(kit: UlquiorraKit, readonly lanza: boolean) {
    super(kit);
    this.name = lanza ? 'lanza' : 'luz';
    this.mobility = 0.1;
    this.airGravity = 0.03;
    this.armor = lanza ? 0.5 : 0.2;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, this.lanza ? 'ul_lanza' : 'ul_throw', (n) => {
      if (n === 'summon') {
        this.kit.holdSpear(this.lanza ? 'lanza' : 'luz');
        if (this.lanza) {
          g.callout('雷霆の槍', 'LANZA DEL RELÁMPAGO', '#d8ff7a');
          f.aura.flare(1.8, 1);
        }
        g.sfx.play('charge', f.center(), this.lanza ? 1.2 : 0.5);
      }
      if (n === 'release') {
        const hand = sock(f, 'grip.R');
        const dir = aim(f, g).sub(hand).normalize();
        g.addProjectile(new Javelin(g, f, ulquiorraProp(this.lanza ? 'lanza' : 'luz'), hand, dir, this.lanza ? { speed: 46, damage: 260, range: 140, lanza: true, blast: 6.5 } : { speed: 62, damage: 62, range: 90, lanza: false }));
        this.kit.holdSpear(this.kit.form === 'murcielago' ? 'luz' : null);
        g.sfx.play('swingHeavy', hand, 1.2);
      }
    });
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.holdSpear(this.kit.form === 'murcielago' ? 'luz' : null);
  }
}

/** R1 heavy: a great sweep of Luz de la Luna — the cut runs on and halves a tower. */
class CleaveAction extends SkillAction {
  readonly name = 'cleave';
  private cut = false;
  constructor(kit: UlquiorraKit) {
    super(kit);
    this.mobility = 0.1;
    this.airGravity = 0.05;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    f.bladeSpec = { damage: 48, knock: 16, launch: 3, heavy: true, hitstop: 0.09, shake: 0.4, cut: 650 };
    this.playClip(f, 'ul_spear2', (n) => {
      if (n === 'step') g.sfx.play('swingHeavy', f.center(), 1);
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    f.bladeActive = this.t >= 0.11 && this.t <= 0.27;
    if (f.trail) f.trail.emitting = this.t >= 0.09 && this.t <= 0.32;
    if (!this.cut && this.t >= 0.18) {
      this.cut = true;
      this.kit.towerCleave();
    }
  }
}

/** R1: wing slap — both wings swept round, everything in front thrown away. */
class WingSlapAction extends SkillAction {
  readonly name = 'wingslap';
  private hits = new Set<number>();
  private struck = false;
  constructor(kit: UlquiorraKit) {
    super(kit);
    this.mobility = 0.2;
    this.airGravity = 0.05;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ul_wingslap', (n) => {
      if (n === 'step') g.sfx.play('swingHeavy', f.center(), 1);
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.struck && this.t >= 0.24) {
      this.struck = true;
      strike(f, g, { damage: 46, knock: 34, launch: 6, heavy: true, reach: 1.2, height: 1.2, radius: 2.4, hitstop: 0.1, shake: 0.5, smash: [1.8, 140] }, this.hits, f.def.aura.body);
      const c = f.center();
      for (let i = 0; i < 30; i++) {
        const a = (Math.random() - 0.5) * 2.6 + f.yaw;
        g.engine.dust.spawn({ x: c.x, y: c.y, z: c.z, vx: Math.sin(a) * 14, vy: Math.random() * 3, vz: Math.cos(a) * 14, size: 0.7, sizeEnd: 2.4, life: 0.8, r: 0.66, g: 0.64, b: 0.6, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
      }
    }
  }
}

/** R2 heavy: the head-grab rush — seize, drive through whatever is behind, slam. */
class GrabAction extends SkillAction {
  readonly name = 'grab';
  private held: Fighter | null = null;
  private slammed = false;
  private dir = new THREE.Vector3();
  constructor(kit: UlquiorraKit) {
    super(kit);
    this.mobility = 0;
    this.airGravity = 0.1;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    f.forward(this.dir);
    this.playClip(f, 'ul_grab', (n) => {
      if (n === 'step') {
        f.push.addScaledVector(this.dir, 14);
        g.sfx.play('shunpo', f.center(), 0.9);
      }
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    if (!this.held && t >= 0.2 && t < 0.4) {
      const hand = f.center().addScaledVector(this.dir, 1.2);
      for (const o of g.enemiesOf(f)) {
        if (o.pos.distanceTo(hand) < 1.6 + o.def.radius) {
          this.held = o;
          g.damage(o, 22, f, this.dir.clone(), { knock: 0, heavy: true, hitstop: 0.06 });
          break;
        }
      }
    }
    if (this.held && t >= 0.24 && t < 0.62 && !this.held.dead) {
      // rush on, carrying the target through anything behind it
      f.push.copy(this.dir).multiplyScalar(26);
      const o = this.held;
      const ahead = f.pos.clone().addScaledVector(this.dir, 1.3);
      o.body.pos.set(ahead.x, f.pos.y + 0.2, ahead.z);
      o.body.vel.set(0, 0, 0);
      o.hitstun = Math.max(o.hitstun, 0.3);
      const a = o.center(), b = a.clone().addScaledVector(this.dir, 1.8);
      g.engine.destruction.carve(new CapsuleShape(a, b, 1.0), { mode: 'smash', power: 260, impulse: 14, dust: 0.6 });
    }
    if (this.held && !this.slammed && t >= 0.62) {
      this.slammed = true;
      f.push.multiplyScalar(0.2);
      const o = this.held;
      g.damage(o, 70, f, this.dir.clone(), { knock: 26, launch: 6, heavy: true, hitstop: 0.14, shake: 0.8 });
      g.groundImpact(o.pos.clone(), 2, 160, f.def.aura.body, f);
    }
  }
}

/** F: "Tozase, Murciélago" / Segunda Etapa. */
class ReleaseAction extends SkillAction {
  readonly name = 'release';
  constructor(kit: UlquiorraKit, readonly second: boolean) {
    super(kit);
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, this.second ? 'ul_segunda' : 'ul_release', (n) => {
      if (n === 'draw') this.kit.drawSword(true);
      if (n === 'charge') {
        f.aura.flare(1.6, 0.8);
        g.sfx.play('charge', f.center(), 1);
      }
      if (n === 'burst') {
        if (this.second) this.kit.becomeSegunda();
        else this.kit.becomeMurcielago();
      }
    });
  }
}

// ------------------------------------------------------------------ green rain

/** Reiatsu rain: green drops falling round him for a few seconds after the release. */
class GreenRain {
  t = 0;
  constructor(readonly f: Fighter, readonly dur = 4) {}
  update(dt: number, g: Game): boolean {
    this.t += dt;
    const p = this.f.pos;
    const n = Math.floor(60 * dt * Math.max(0, 1 - this.t / this.dur) * 4) + 1;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 16;
      g.engine.glow.spawn({ x: p.x + Math.cos(a) * r, y: p.y + 9 + Math.random() * 5, z: p.z + Math.sin(a) * r, vx: 0, vy: -16, vz: 0, size: 0.09, sizeEnd: 0.05, life: 0.7, r: 0.4, g: 1, b: 0.55, alpha: 0.9, alphaEnd: 0.3, tex: TEX_STREAK, stretch: 5 });
    }
    return this.t < this.dur;
  }
}

// ------------------------------------------------------------------ the kit

export class UlquiorraKit implements Kit {
  form: Form = 'sealed';
  swordOut = false;
  flare = false;
  comboIndex = 0;
  private lastEnd = 0;
  private cd = { cero: 0, bala: 0, sonido: 0, heavy: 0, oscuras: 0, luz: 0, slap: 0, lanza: 0 };
  private rain: GreenRain | null = null;
  private flapping = false;
  private hurtT = 0;

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    setHands(f, 'fist');
    f.onHurt = () => {
      this.hurtT = 0;
    };
    this.applyStats();
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    // high-speed regeneration: wounds close while there is reiatsu to spend
    this.hurtT += dt;
    if (!f.dead && this.hurtT > 2 && f.hp < f.maxHp && f.rei > 8) {
      const heal = f.maxHp * (this.form === 'segunda' ? 0.014 : 0.009) * dt;
      f.hp = Math.min(f.maxHp, f.hp + heal);
      f.rei -= dt * 2.5;
      if (Math.random() < dt * 8) {
        const c = f.center();
        g.engine.glow.spawn({ x: c.x + (Math.random() - 0.5) * 0.5, y: c.y + (Math.random() - 0.5) * 0.9, z: c.z + (Math.random() - 0.5) * 0.5, vx: 0, vy: 0.6, vz: 0, size: 0.12, sizeEnd: 0.02, life: 0.6, r: 0.6, g: 1, b: 0.7, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
      }
    }
    if (this.rain && !this.rain.update(dt, g)) this.rain = null;
    // wings beat whenever he is off the ground
    if (this.form !== 'sealed') {
      const airborne = !f.grounded || f.hovering;
      if (airborne && !this.flapping) {
        this.flapping = true;
        f.anim.play('ul_flap', { fadeIn: 0.2 });
      } else if (!airborne && this.flapping) {
        this.flapping = false;
        for (const a of f.anim.active) if (a.clip.name === 'ul_flap') a.ending = true;
      }
      // flight: released, he can hang in the air as long as he likes
      if (!f.grounded && f.wishHover && f.body.vel.y < 1) f.hovering = true;
    }
  }

  target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 80, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 80);
  }

  private chainList(): string[] {
    return this.form === 'segunda' ? SEGUNDA_CHAIN : this.form === 'murcielago' ? MURCIELAGO_CHAIN : this.swordOut ? ULQUIORRA_SWORD_CHAIN : ULQUIORRA_CHAIN;
  }

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof StringAction && !cur.heavy) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const list = this.chainList();
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    this.lastEnd = this.g.time + 0.8;
    this.f.act(new StringAction(this, list[idx], idx), true);
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

  heavy(): void {
    const f = this.f;
    if (f.busy && !(f.action instanceof StringAction)) return;
    if (this.form === 'segunda') this.special(new GrabAction(this), 14, 'heavy', 3);
    else if (this.form === 'murcielago') this.special(new CleaveAction(this), 14, 'heavy', 2.6);
    else {
      if (this.cd.heavy > 0) return;
      this.cd.heavy = 1.6;
      this.comboIndex = 0;
      f.act(new StringAction(this, 'ul_nukite', 0, true), true);
    }
  }

  /** Q: Cero (sealed) / Luz de la Luna throw (released). */
  skill1(): void {
    if (this.form === 'sealed') this.special(new CeroAction(this, false), 14, 'cero', 1.2);
    else this.special(new ThrowAction(this, false), 12, 'luz', 1.4);
  }

  /** E: Bala (sealed) / Cero Oscuras (released). */
  skill2(): void {
    if (this.form === 'sealed') this.special(new BalaAction(this), 8, 'bala', 1.2);
    else this.special(new CeroAction(this, true), 34, 'oscuras', 8);
  }

  /** R: Sonído kick (sealed) / wing slap (Murciélago) / Lanza del Relámpago (Segunda). */
  skill3(): void {
    if (this.form === 'sealed') this.special(new SonidoAction(this, this.target()), 10, 'sonido', 3.5);
    else if (this.form === 'murcielago') this.special(new WingSlapAction(this), 12, 'slap', 3);
    else this.special(new ThrowAction(this, true), 45, 'lanza', 10);
  }

  /** G: draw or sheathe Murciélago (sealed only). */
  toggle(): void {
    const f = this.f;
    if (this.form !== 'sealed' || f.busy) return;
    f.act(new DrawAction(this, !this.swordOut), true);
  }

  release(): void {
    const f = this.f;
    if (this.form === 'segunda' || f.busy) return;
    if (!f.spendRei(this.form === 'sealed' ? 35 : 45)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(new ReleaseAction(this, this.form === 'murcielago'), true);
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

  drawSword(on: boolean): void {
    const f = this.f;
    if (on === this.swordOut) return;
    this.swordOut = on;
    if (on) {
      setHands(f, 'fist', 'R');
      f.visual.attach('sword', ulquiorraProp('katana'), 'grip.R');
      if (this.form === 'sealed') f.visual.attach('sheath', ulquiorraProp('sheath-empty'), 'hip.L');
      f.anim.loco.stance = ULQUIORRA_SWORD_STANCE;
      f.def = { ...f.def, stance: ULQUIORRA_SWORD_STANCE };
    } else {
      f.visual.detach('sword');
      f.visual.attach('sheath', ulquiorraProp('sheath'), 'hip.L');
      f.anim.loco.stance = ULQUIORRA_STANCE;
      f.def = { ...f.def, stance: ULQUIORRA_STANCE };
    }
    f.bladeValid = false;
    this.comboIndex = 0;
  }

  /** The spear in his hand: Luz de la Luna, the flame-ended Lanza, or nothing. */
  holdSpear(kind: 'luz' | 'lanza' | null): void {
    const f = this.f;
    if (!kind) {
      f.visual.detach('sword');
      return;
    }
    f.visual.attach('sword', ulquiorraProp(kind), 'grip.R');
    f.bladeValid = false;
  }

  /** The downward strike splits the floor ahead into a jagged trench. */
  splitFloor(): void {
    const { f, g } = this;
    const fw = f.forward();
    const right = new THREE.Vector3(-fw.z, 0, fw.x);
    for (let i = 0; i < 7; i++) {
      const p = f.pos.clone().addScaledVector(fw, 1.4 + i * 1.1).addScaledVector(right, Math.sin(i * 2.1) * 0.3);
      p.y -= 0.2;
      g.engine.destruction.carve(new SphereShape(p, 0.75 - i * 0.05), { mode: 'smash', power: 160, impulse: 12 + i, dust: 0.7 });
    }
    g.sfx.play('impact', f.pos, 1);
    g.shake(f === g.player ? 0.35 : 0.1);
  }

  /** R1 heavy: the slash runs on through anything in front and halves it. */
  towerCleave(): void {
    const { f, g } = this;
    const fw = f.forward();
    const right = new THREE.Vector3(-fw.z, 0, fw.x);
    const c = f.center().addScaledVector(fw, 9);
    _m.makeBasis(fw, new THREE.Vector3(0, 1, 0).applyAxisAngle(fw, 0.08), right.clone().applyAxisAngle(fw, 0.08));
    _q.setFromRotationMatrix(_m);
    g.engine.destruction.carve(new BoxShape(c, new THREE.Vector3(8, 0.08, 4.5), _q.clone()), { mode: 'cut', power: 900, dir: right, sparks: [0.45, 1, 0.6], dust: 0.5 });
    for (const o of g.enemiesOf(f)) {
      _v.subVectors(o.center(), c);
      if (Math.abs(_v.dot(fw)) < 8.5 && Math.abs(_v.dot(right)) < 4.5 && Math.abs(_v.y) < 1.4) g.damage(o, 40, f, fw.clone(), { knock: 12, launch: 3, heavy: true, hitstop: 0.06 });
    }
    const glow = g.engine.glow;
    for (let i = 0; i < 26; i++) {
      const p = f.center().addScaledVector(fw, 1 + i * 0.65).addScaledVector(right, (Math.random() - 0.5) * 8);
      glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.25, sizeEnd: 0.03, life: 0.3, r: 0.5, g: 1, b: 0.6, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2 });
    }
    g.sfx.play('swingHeavy', c, 1.2);
  }

  /** "Tozase, Murciélago": the black-and-green burst, the wings, the rain. */
  becomeMurcielago(): void {
    const { f, g } = this;
    if (this.form !== 'sealed') return;
    this.form = 'murcielago';
    this.swordOut = false;
    f.def = { ...f.def, stance: MURCIELAGO_STANCE, speed: { ...SPEED_R1 } };
    f.setForm({ asset: ulquiorraAsset('murcielago'), props: [] }, AURA_ULQUIORRA, BLADE_SPEAR);
    this.holdSpear('luz');
    f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.25);
    this.burst(AURA_ULQUIORRA.body as string);
    g.callout('鎖せ「黒翼大魔」', 'TOZASE, MURCIÉLAGO', '#7dffa0');
    this.rain = new GreenRain(f, 5);
    this.applyStats();
  }

  becomeSegunda(): void {
    const { f, g } = this;
    if (this.form !== 'murcielago') return;
    this.form = 'segunda';
    f.def = { ...f.def, stance: SEGUNDA_STANCE, speed: { ...SPEED_R2 } };
    f.setForm({ asset: ulquiorraAsset('segunda'), props: [] }, AURA_SEGUNDA, BLADE_SPEAR);
    setHands(f, 'palm');
    f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.3);
    this.burst('#2EE06A');
    g.callout('刀剣解放第二階層', 'RESURRECCIÓN: SEGUNDA ETAPA', '#7dffa0');
    // despair: the density of his reiatsu staggers everyone near
    for (const o of g.enemiesOf(f)) if (o.pos.distanceTo(f.pos) < 18) o.hitstun = Math.max(o.hitstun, 0.9);
    this.applyStats();
  }

  private burst(color: string): void {
    const { f, g } = this;
    this.flapping = false;
    f.aura.pillarBurst(2.6);
    f.aura.flare(2.4, 1.2);
    g.sfx.play('bankai', f.center());
    g.shake(0.9);
    g.hitstop(0.08);
    g.slowMo(0.45, 0.3);
    g.engine.gr.chroma.offset.set(0.007, 0.007);
    g.addRing(f.pos.clone(), 20, color, 0.9);
    for (const o of g.enemiesOf(f)) {
      const d = o.pos.distanceTo(f.pos);
      if (d < 14) g.damage(o, 25 * (1 - d / 14), f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 22 * (1 - d / 14), launch: 6, heavy: true });
    }
    // black-and-green torrent
    const c = new THREE.Color(color);
    for (let i = 0; i < 50; i++) {
      const a = Math.random() * Math.PI * 2;
      const dark = i % 2 === 0;
      g.engine.glow.spawn({ x: f.pos.x, y: f.pos.y + 1, z: f.pos.z, vx: Math.cos(a) * (6 + Math.random() * 8), vy: 4 + Math.random() * 10, vz: Math.sin(a) * (6 + Math.random() * 8), size: 0.4, sizeEnd: 0.06, life: 0.9, r: dark ? 0.05 : c.r, g: dark ? 0.2 : c.g, b: dark ? 0.08 : c.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 1.2 });
      g.engine.dust.spawn({ x: f.pos.x, y: f.pos.y + 0.3, z: f.pos.z, vx: Math.cos(a) * 12, vy: Math.random() * 2, vz: Math.sin(a) * 12, size: 0.8, sizeEnd: 2.6, life: 1.1, r: 0.2, g: 0.28, b: 0.22, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
    }
  }

  private applyStats(): void {
    const f = this.f;
    f.power = (this.form === 'segunda' ? 1.7 : this.form === 'murcielago' ? 1.35 : 1) * (this.flare ? 1.3 : 1) * (this.swordOut && this.form === 'sealed' ? 1.1 : 1);
    // Hierro: a skin blades barely scratch
    f.damageTaken = this.form === 'segunda' ? 0.7 : this.form === 'murcielago' ? 0.8 : 0.85;
    f.toughness = this.form === 'sealed' ? 10 : 16;
    f.aura.target = this.flare ? 0.9 : this.form === 'segunda' ? 0.45 : this.form === 'murcielago' ? 0.3 : 0.12;
  }

  formName(): string {
    return this.form === 'segunda' ? 'Resurrección: Segunda Etapa' : this.form === 'murcielago' ? 'Resurrección — Murciélago' : 'Cuarta Espada';
  }

  ai(): KitAI {
    return {
      reach: 1.4,
      chain: 4,
      releaseAt: [0.6, 0.3],
      toggleAt: 0.85,
      toggleOn: () => this.swordOut || this.form !== 'sealed',
      ranged: () => this.form === 'murcielago',
      moves: [
        { name: 'cero', use: () => this.skill1(), min: 5, max: 45, weight: 2.4, cd: 2.5, when: () => this.form === 'sealed' },
        { name: 'bala', use: () => this.skill2(), min: 3, max: 30, weight: 2, cd: 2, when: () => this.form === 'sealed' },
        { name: 'sonido', use: () => this.skill3(), min: 4, max: 22, weight: 1.8, cd: 4, when: () => this.form === 'sealed' },
        { name: 'nukite', use: () => this.heavy(), min: 0, max: 2.4, weight: 1.2, cd: 3, when: () => this.form === 'sealed' },
        { name: 'luz', use: () => this.skill1(), min: 5, max: 55, weight: 2.4, cd: 2.2, when: () => this.form !== 'sealed' },
        { name: 'oscuras', use: () => this.skill2(), min: 8, max: 70, weight: 1.4, cd: 9, when: () => this.form !== 'sealed' },
        { name: 'slap', use: () => this.skill3(), min: 0, max: 3.5, weight: 1.6, cd: 4, when: () => this.form === 'murcielago' },
        { name: 'cleave', use: () => this.heavy(), min: 2, max: 14, weight: 1.4, cd: 4, when: () => this.form === 'murcielago' },
        { name: 'lanza', use: () => this.skill3(), min: 14, max: 90, weight: 1.6, cd: 12, when: () => this.form === 'segunda' },
        { name: 'grab', use: () => this.heavy(), min: 1.5, max: 10, weight: 1.8, cd: 4, when: () => this.form === 'segunda' },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const fm = this.form;
    const list: AbilityInfo[] = [
      { key: 'LMB', name: fm === 'segunda' ? 'Claws' : fm === 'murcielago' ? 'Luz de la Luna' : this.swordOut ? 'Thrusts' : 'Strikes', kanji: fm === 'sealed' ? '撃' : '槍' },
      fm === 'sealed' ? { key: 'RMB', name: 'Hand-spear', kanji: '貫', cd: this.cd.heavy, cdMax: 1.6 } : fm === 'murcielago' ? { key: 'RMB', name: 'Cleave', kanji: '断', cost: 14, cd: this.cd.heavy, cdMax: 2.6 } : { key: 'RMB', name: 'Head grab', kanji: '掴', cost: 14, cd: this.cd.heavy, cdMax: 3 },
      fm === 'sealed' ? { key: 'Q', name: 'Cero', kanji: '虚閃', cost: 14, cd: this.cd.cero, cdMax: 1.2 } : { key: 'Q', name: 'Luz throw', kanji: '月光', cost: 12, cd: this.cd.luz, cdMax: 1.4 },
      fm === 'sealed' ? { key: 'E', name: 'Bala', kanji: '虚弾', cost: 8, cd: this.cd.bala, cdMax: 1.2 } : { key: 'E', name: 'Cero Oscuras', kanji: '黒虚閃', cost: 34, cd: this.cd.oscuras, cdMax: 8 },
      fm === 'sealed' ? { key: 'R', name: 'Sonído', kanji: '響転', cost: 10, cd: this.cd.sonido, cdMax: 3.5 } : fm === 'murcielago' ? { key: 'R', name: 'Wing slap', kanji: '翼', cost: 12, cd: this.cd.slap, cdMax: 3 } : { key: 'R', name: 'Lanza', kanji: '雷霆', cost: 45, cd: this.cd.lanza, cdMax: 10 },
      { key: 'Shift', name: 'Sonído', kanji: '響転', cost: 4 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      { key: 'F', name: fm === 'sealed' ? 'Murciélago' : 'Segunda', kanji: fm === 'sealed' ? '黒翼' : '第二', cost: fm === 'sealed' ? 35 : 45, active: fm === 'segunda', tint: '#7dffa0' },
    ];
    if (fm === 'sealed') list.push({ key: 'G', name: this.swordOut ? 'Sheathe' : 'Draw', kanji: '刀', active: this.swordOut, tint: '#7dffa0' });
    return list;
  }
}
