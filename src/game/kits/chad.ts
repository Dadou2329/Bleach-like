// Chad's kit (docs/roster/A2-karakura-allies.md §3, Kit proposal). Human: a heavyweight's string — jab,
// cross, hook, uppercut — the haymaker, the shoulder charge through walls, Grua Tirar. F: Brazo Derecha de
// Gigante — the right arm armoured, its punches cratering; the fist blast, El Directo (the shoulder fin
// opens like an exhaust and the blow is fired as a blast), Grua Tirar. F again: the true forms — the Gigante
// shield (RMB: braced behind it, then the bash) and Brazo Izquierda del Diablo; El Directo from the shield,
// La Muerte (the five fingertips charge, the fist lands, and a skull is gouged into whatever is behind the
// target), the shield blast. He is heavy: hard to push around, and his punches never stop for a flinch.
import * as THREE from 'three';
import { FighterAction, type Fighter, type FighterDef } from '../fighter';
import type { Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { chadAsset } from '../../chars/chad';
import { CHAD_CHAIN, CHAD_CLIPS, CHAD_STANCE, CHAD_TRUE_STANCE } from '../../chars/chadClips';
import { FistBlast, laMuerte } from '../../vfx/chadArts';
import { CeroBeam } from '../projectiles/cero';
import { SphereShape, ConeShape } from '../../destruction/shapes';
import { groundAt } from '../../vfx/iceArts';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from '../../vfx/sprites';
import type { AuraStyle } from '../../vfx/aura';

export const AURA_CHAD: AuraStyle = { core: '#F8FDFC', body: '#DDF6F5', rim: '#2D353D' };
export const AURA_CHAD_TRUE: AuraStyle = { core: '#F8FDFC', body: '#DDF6F5', rim: '#A23A78', dark: '#141418' };

export const CHAD_DEF: FighterDef = {
  id: 'chad',
  name: 'Yasutora Sado',
  title: 'Fullbringer',
  build: () => ({ asset: chadAsset('human'), props: [] }),
  stance: CHAD_STANCE,
  clips: CHAD_CLIPS,
  aura: AURA_CHAD,
  hp: 1250,
  rei: 120,
  speed: { run: 9.5, sprint: 22, jump: 12, dash: 13, dashTime: 0.11 },
  radius: 0.46,
  height: 1.97,
};

type Form = 'human' | 'gigante' | 'true';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

interface PunchSpec {
  damage: number;
  knock: number;
  launch?: number;
  heavy?: boolean;
  /** reach from his position along his facing, height, hit radius (m) */
  reach: number;
  height: number;
  radius: number;
  /** which fist (for the impact flash and the armoured bonus) */
  hand: 'L' | 'R';
  lunge: number;
}

const PUNCHES: Record<string, PunchSpec> = {
  ch_jab: { damage: 12, knock: 5, reach: 1.15, height: 1.45, radius: 0.75, hand: 'L', lunge: 5 },
  ch_cross: { damage: 18, knock: 9, reach: 1.25, height: 1.45, radius: 0.8, hand: 'R', lunge: 7 },
  ch_hook: { damage: 18, knock: 10, reach: 1.0, height: 1.4, radius: 0.95, hand: 'L', lunge: 5 },
  ch_upper: { damage: 26, knock: 4, launch: 11, heavy: true, reach: 1.0, height: 1.3, radius: 0.9, hand: 'R', lunge: 5 },
};

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

/** One blow landing in front of him: everyone in the sphere is hit. Returns whom it hit. */
function punch(f: Fighter, g: Game, p: PunchSpec, mult: number, hit: Set<number>): Fighter[] {
  const fw = f.forward(_w);
  const c = new THREE.Vector3().copy(f.pos).addScaledVector(fw, p.reach);
  c.y += p.height;
  const out: Fighter[] = [];
  for (const o of g.enemiesOf(f)) {
    if (hit.has(o.id)) continue;
    const cy = Math.max(o.pos.y + 0.2, Math.min(o.pos.y + o.def.height - 0.2, c.y));
    if (Math.hypot(o.pos.x - c.x, cy - c.y, o.pos.z - c.z) > p.radius + o.def.radius) continue;
    hit.add(o.id);
    const dir = _v.subVectors(o.pos, f.pos).setY(0);
    if (dir.lengthSq() < 1e-4) dir.copy(fw);
    dir.normalize();
    g.damage(o, p.damage * mult, f, dir.clone(), { knock: p.knock * (mult > 1 ? 1.4 : 1), launch: p.launch, heavy: p.heavy || mult > 1.3, hitstop: 0.05 + (mult - 1) * 0.05, shake: 0.15 + (mult - 1) * 0.2 });
    g.sparks(new THREE.Vector3(o.pos.x, cy, o.pos.z), dir, '#DDF6F5', 12);
    out.push(o);
  }
  return out;
}

/** The air of a heavy punch: a short cone of force ahead of the fist that breaks walls. */
function shockCone(f: Fighter, g: Game, from: THREE.Vector3, len: number, power: number): void {
  const dir = f.forward(_v).clone();
  g.engine.destruction.carve(new ConeShape(from.clone(), dir, 0.35, len), { mode: 'smash', power, impulse: 10, dust: 0.5 });
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * Math.PI * 2;
    g.engine.dust.spawn({ x: from.x, y: from.y, z: from.z, vx: dir.x * 14 + Math.cos(a) * 3, vy: Math.random() * 2, vz: dir.z * 14 + Math.sin(a) * 3, size: 0.5, sizeEnd: 1.8, life: 0.5, r: 0.85, g: 0.9, b: 0.92, alpha: 0.4, alphaEnd: 0, tex: TEX_PUFF, drag: 3 });
  }
}

// ------------------------------------------------------------------ the string

class PunchAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private hitAt = 0;
  private struck = false;
  private hits = new Set<number>();
  queued = false;

  constructor(readonly kit: ChadKit, readonly clip: string, readonly index: number) {
    super();
    this.name = clip;
    this.mobility = 0.15;
    this.airGravity = 0.1;
    // too heavy to be stopped mid-punch by light blows
    this.armor = 0.25;
  }

  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    this.hitAt = c.events.hit ?? this.dur * 0.4;
    const p = PUNCHES[this.clip];
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n !== 'step') return;
        const tgt = f.faceTarget;
        const extra = tgt ? Math.min(4, Math.max(0, f.pos.distanceTo(tgt) - 1.8)) : 0;
        f.push.addScaledVector(f.forward(), p.lunge + extra * 2);
        g.sfx.play('swing', f.center(), 0.7);
      },
    });
  }

  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const p = PUNCHES[this.clip];
    if (!this.struck && this.t >= this.hitAt) {
      this.struck = true;
      const mult = this.kit.fistPower(p.hand);
      punch(f, g, p, mult, this.hits);
      const k = sock(f, p.hand === 'R' ? 'knuckle.R' : 'knuckle.L');
      g.engine.glow.spawn({ x: k.x, y: k.y, z: k.z, size: 0.3 * mult, sizeEnd: 1.2 * mult, life: 0.14, r: 0.9, g: 0.98, b: 1, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
      if (mult > 1.3) shockCone(f, g, k, 3 + mult, 120 * mult);
    }
    if (this.queued && this.t >= this.comboAt) {
      this.done = true;
      this.kit.chain(this.index + 1);
      return;
    }
    if (this.t >= this.dur) this.done = true;
  }

  override canCancel(next: FighterAction): boolean {
    if (next.name === 'dash' || next instanceof SkillAction) return this.t >= this.hitAt + 0.03;
    return false;
  }
}

abstract class SkillAction extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: ChadKit) {
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
}

/** RMB (human, Gigante): the haymaker — wound far back, the whole weight behind it; armoured, it craters. */
class HaymakerAction extends SkillAction {
  readonly name = 'haymaker';
  private hits = new Set<number>();
  constructor(kit: ChadKit) {
    super(kit);
    this.mobility = 0.05;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ch_haymaker', (n) => {
      if (n === 'step') {
        f.push.addScaledVector(f.forward(), 9);
        g.sfx.play('swingHeavy', f.center(), 1.2);
      }
      if (n !== 'hit') return;
      const mult = this.kit.fistPower('R') * 1.25;
      punch(f, g, { damage: 32, knock: 22, launch: 5, heavy: true, reach: 1.3, height: 1.4, radius: 1.1, hand: 'R', lunge: 0 }, mult, this.hits);
      const k = sock(f, 'knuckle.R');
      shockCone(f, g, k, 4 + mult * 2, 160 * mult);
      g.shake(f === g.player ? 0.3 * mult : 0.1);
      if (this.kit.form !== 'human') {
        const gy = groundAt(g, k.x, k.y, k.z, 3);
        if (gy !== null) g.groundImpact(new THREE.Vector3(k.x, gy, k.z), 1.6, 220, '#DDF6F5', f);
      }
    });
  }
}

/** Q (human): the shoulder charge — head down, straight through whatever is in the way. */
class TackleAction extends SkillAction {
  readonly name = 'tackle';
  private hits = new Set<number>();
  private acc = 0;
  constructor(kit: ChadKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.7;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ch_tackle', (n) => {
      if (n === 'go') g.sfx.play('swingHeavy', f.center(), 1);
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    if (t < 0.12 || t > 0.6) return;
    const fw = f.forward(_w);
    f.body.vel.x = fw.x * 19;
    f.body.vel.z = fw.z * 19;
    // whatever stands in the way is smashed out of it
    this.acc += dt;
    if (this.acc > 0.04) {
      this.acc = 0;
      // shoulder-high, so it smashes walls in the way without ploughing a trench in the ground
      const c = f.pos.clone().addScaledVector(fw, 0.9);
      c.y += 1.25;
      g.engine.destruction.carve(new SphereShape(c, 1.05, 1.15), { mode: 'smash', power: 260, impulse: 14, dust: 0.4 });
    }
    for (const o of g.enemiesOf(f)) {
      if (this.hits.has(o.id) || o.pos.distanceTo(f.pos) > 1.4 + o.def.radius) continue;
      this.hits.add(o.id);
      g.damage(o, 26, f, fw.clone(), { knock: 24, launch: 5, heavy: true, hitstop: 0.08, shake: 0.4 });
    }
  }
}

/** Grua Tirar: the target seized, heaved overhead and slammed down in front of him. */
class ThrowAction extends SkillAction {
  readonly name = 'throw';
  private held: Fighter | null = null;
  private slammed = false;
  constructor(kit: ChadKit, readonly target: Fighter) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ch_throw', (n) => {
      if (n === 'grab' && !this.target.dead && this.target.pos.distanceTo(f.pos) < 2.6 + this.target.def.radius) {
        this.held = this.target;
        g.damage(this.held, 8, f, f.forward(), { knock: 0, hitstop: 0.06 });
        g.sfx.play('hit', this.held.center(), 1);
      }
      if (n === 'slam') this.slam(f, g);
    });
  }
  private slam(f: Fighter, g: Game): void {
    if (this.slammed || !this.held) return;
    this.slammed = true;
    const o = this.held;
    this.held = null;
    if (o.dead) return;
    const fw = f.forward(_w);
    const p = f.pos.clone().addScaledVector(fw, 2.2);
    p.y = groundAt(g, p.x, f.pos.y + 1, p.z, 4) ?? f.pos.y;
    o.body.pos.copy(p);
    o.body.prev.copy(p);
    g.damage(o, 48 * this.kit.fistPower('R'), f, fw.clone(), { knock: 6, launch: 3, heavy: true, hitstop: 0.14, shake: 0.6 });
    g.groundImpact(p, 2.2, 260, '#DDF6F5', f);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const o = this.held;
    if (!o || o.dead) return;
    // carried: up over his head, then over the shoulder
    const t = this.t;
    const fw = f.forward(_w);
    const k = Math.min(1, (t - 0.2) / 0.3);
    const p = f.pos.clone().addScaledVector(fw, 1.1 * (1 - k) + 0.2).add(new THREE.Vector3(0, 0.6 + k * 1.9, 0));
    if (t > 0.5) p.addScaledVector(fw, (t - 0.5) * 4).y -= (t - 0.5) * 3;
    o.body.pos.copy(p);
    o.body.vel.set(0, 0, 0);
    o.push.set(0, 0, 0);
    o.hitstun = Math.max(o.hitstun, 0.3);
  }
  override end(f: Fighter, g: Game): void {
    this.slam(f, g);
  }
}

/** Q (Gigante): the fist blast — spirit energy fired from the armoured fist. */
class BlastAction extends SkillAction {
  readonly name = 'blast';
  constructor(kit: ChadKit, readonly big: boolean) {
    super(kit);
    this.mobility = 0.15;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('ch_cross', {
      onEvent: (n) => {
        if (n !== 'hit') return;
        const k = sock(f, 'knuckle.R');
        const dir = aim(f, g).sub(k).normalize();
        g.addProjectile(new FistBlast(f, g, k.addScaledVector(dir, 0.5), dir, this.big ? 0.9 : 0.55, this.big ? 60 : 36, 44, this.big ? 3 : 2));
        g.sfx.play('getsuga', k, 0.8);
      },
    });
    this.dur = 0.45;
  }
}

/** El Directo: the fin opens and charges like an exhaust; the blow is fired as a blast. */
class DirectoAction extends SkillAction {
  readonly name = 'directo';
  constructor(kit: ChadKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ch_directo', (n) => {
      if (n === 'charge') {
        g.sfx.play('charge', f.center(), 1);
        f.aura.flare(1.4, 0.7);
      }
      if (n !== 'fire') return;
      const emitter = f.visual.rig.sockets.get('knuckle.R')!;
      const shield = this.kit.form === 'true';
      g.addProjectile(new CeroBeam(g, f, emitter, () => aim(f, g), { charge: 0.03, fire: 0.42, radius: shield ? 1.3 : 1.0, damage: shield ? 120 : 95, power: 620, core: '#F8FDFC', body: '#DDF6F5', rim: '#849DAB', range: 110, track: 0.6, gain: 1.6 }));
      g.callout('巨人の一撃', 'EL DIRECTO', '#ddf6f5');
      f.push.addScaledVector(f.forward(), -6);
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    // the exhaust: white-hot flame streaming up out of the shoulder fin
    if (this.t > 0.12 && this.t < 0.72 && this.kit.form === 'gigante') {
      const p = sock(f, 'fin');
      for (let i = 0; i < 3; i++) g.engine.glow.spawn({ x: p.x + (Math.random() - 0.5) * 0.3, y: p.y, z: p.z + (Math.random() - 0.5) * 0.3, vx: (Math.random() - 0.5) * 1.5, vy: 6 + Math.random() * 6, vz: (Math.random() - 0.5) * 1.5, size: 0.35, sizeEnd: 0.05, life: 0.3, r: 0.86, g: 0.97, b: 0.97, alpha: 0.9, alphaEnd: 0, tex: TEX_PUFF });
    }
    if (this.t > 0.12 && this.t < 0.72) {
      const k = sock(f, 'knuckle.R');
      g.engine.glow.spawn({ x: k.x, y: k.y, z: k.z, size: 0.3 + this.t, sizeEnd: 0.1, life: 0.1, r: 0.9, g: 0.98, b: 1, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
  }
}

/** RMB (true form): braced behind the Gigante shield — frontal blows are stopped — then the bash. */
class ShieldAction extends SkillAction {
  readonly name = 'shield';
  private bashed = false;
  private hits = new Set<number>();
  constructor(kit: ChadKit) {
    super(kit);
    this.mobility = 0.1;
    this.armor = 0.85;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ch_guard', () => {});
    g.sfx.play('ting', f.center(), 0.6);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.bashed && this.t >= 0.62) {
      this.bashed = true;
      this.armor = 0.3;
      f.push.addScaledVector(f.forward(), 12);
      const p: PunchSpec = { damage: 30, knock: 26, launch: 4, heavy: true, reach: 1.1, height: 1.2, radius: 1.3, hand: 'R', lunge: 0 };
      punch(f, g, p, 1.2, this.hits);
      shockCone(f, g, f.center().addScaledVector(f.forward(), 0.8), 4, 200);
      g.sfx.play('impact', f.center(), 1.2);
    }
  }
}

/** E (true form): La Muerte — the five fingertips charge into discs, the Diablo fist lands, the skull is gouged out behind the target. */
class MuerteAction extends SkillAction {
  readonly name = 'muerte';
  private hits = new Set<number>();
  private landed = false;
  constructor(kit: ChadKit) {
    super(kit);
    this.mobility = 0.05;
    this.armor = 0.6;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ch_muerte', (n) => {
      if (n === 'charge') g.sfx.play('charge', f.center(), 1.1);
      if (n === 'step') {
        f.push.addScaledVector(f.forward(), 13);
        g.sfx.play('swingHeavy', f.center(), 1.4);
      }
      if (n === 'hit') this.land(f, g);
    });
  }
  private land(f: Fighter, g: Game): void {
    if (this.landed) return;
    this.landed = true;
    const fw = f.forward(_w).clone();
    const k = sock(f, 'knuckle.L');
    const hit = punch(f, g, { damage: 130, knock: 26, launch: 6, heavy: true, reach: 1.4, height: 1.4, radius: 1.4, hand: 'L', lunge: 0 }, 1, this.hits);
    g.callout('魔人の一撃', 'LA MUERTE', '#eff9f9');
    g.hitstop(0.14);
    g.slowMo(0.25, 0.35);
    g.shake(f === g.player ? 0.8 : 0.3);
    const at = hit[0] ? hit[0].pos.clone() : f.pos.clone().addScaledVector(fw, 3);
    laMuerte(g, at, fw, hit[0] ? 10 : 8, 3);
    g.engine.glow.spawn({ x: k.x, y: k.y, z: k.z, size: 1, sizeEnd: 4, life: 0.25, r: 0.94, g: 0.98, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    // five discs of crackling energy on the fingertips of the open hand
    if (this.t > 0.2 && this.t < 0.95) {
      const c = sock(f, 'knuckle.L');
      const fw = f.forward(_w);
      const side = new THREE.Vector3(-fw.z, 0, fw.x);
      for (let i = 0; i < 5; i++) {
        const p = c.clone().addScaledVector(side, (i - 2) * 0.09).add(new THREE.Vector3(0, 0.08 + Math.abs(i - 2) * -0.02, 0));
        g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.12 + this.t * 0.06, sizeEnd: 0.05, life: 0.06, r: 0.94, g: 0.98, b: 0.98, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
        if (Math.random() < 0.25) g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, vz: (Math.random() - 0.5) * 4, size: 0.05, sizeEnd: 0.01, life: 0.1, r: 0.61, g: 0.78, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2 });
      }
    }
  }
  override end(f: Fighter, g: Game): void {
    if (this.t >= 0.95) this.land(f, g);
  }
}

/** R (true form): the shield blast — energy gathered in the shield and fired as a wide wave. */
class ShieldBlastAction extends SkillAction {
  readonly name = 'shieldblast';
  constructor(kit: ChadKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ch_directo', (n) => {
      if (n !== 'fire') return;
      const k = sock(f, 'knuckle.R');
      const fw = aim(f, g).sub(k).normalize();
      const side = new THREE.Vector3(-fw.z, 0, fw.x);
      for (let i = -2; i <= 2; i++) g.addProjectile(new FistBlast(f, g, k.clone().addScaledVector(side, i * 0.6), fw.clone().addScaledVector(side, i * 0.12).normalize(), 0.7, 34, 40, 2.2));
      g.sfx.play('getsuga', k, 1.2);
    }, 1.25);
  }
}

/** F: the arm coats itself — Brazo Derecha de Gigante; then the true forms. */
class CoatAction extends SkillAction {
  readonly name = 'release';
  constructor(kit: ChadKit, readonly to: Form) {
    super(kit);
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ch_coat', (n) => {
      if (n === 'coat') this.kit.become(this.to);
    });
    g.sfx.play('charge', f.center(), 0.9);
  }
}

// ------------------------------------------------------------------ the kit

export class ChadKit implements Kit {
  form: Form = 'human';
  flare = false;
  comboIndex = 0;
  private lastEnd = 0;
  private cd = { heavy: 0, tackle: 0, throw: 0, blast: 0, directo: 0, muerte: 0, shieldblast: 0 };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    this.setHands();
    this.applyStats();
  }

  update(dt: number): void {
    const f = this.f;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
  }

  target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 80, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 80);
  }

  private setHands(): void {
    const rig = this.f.visual.rig;
    rig.setBoneVisible('fist.R', true);
    rig.setBoneVisible('fist.L', true);
    rig.setBoneVisible('palm.R', false);
    rig.setBoneVisible('palm.L', false);
  }

  /** how hard each fist hits in this form */
  fistPower(hand: 'L' | 'R'): number {
    if (this.form === 'human') return 1;
    if (this.form === 'gigante') return hand === 'R' ? 1.6 : 1.05;
    return hand === 'R' ? 1.5 : 1.7;
  }

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof PunchAction) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const idx = i % CHAD_CHAIN.length;
    this.comboIndex = idx + 1;
    this.lastEnd = this.g.time + 0.7;
    this.f.act(new PunchAction(this, CHAD_CHAIN[idx], idx), true);
  }

  private special(a: SkillAction, cost: number, cdKey: keyof typeof this.cd, cd: number): boolean {
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

  private near(range: number): Fighter | null {
    const t = this.target();
    return t && t.pos.distanceTo(this.f.pos) <= range ? t : null;
  }

  /** RMB: the haymaker / (true form) the shield. */
  heavy(): void {
    const f = this.f;
    if (f.busy && !(f.action instanceof PunchAction)) return;
    if (this.form === 'true') this.special(new ShieldAction(this), 8, 'heavy', 1.6);
    else this.special(new HaymakerAction(this), this.form === 'human' ? 4 : 8, 'heavy', 1.8);
  }

  /** Q: the shoulder charge / the fist blast / El Directo from the shield. */
  skill1(): void {
    if (this.form === 'human') this.special(new TackleAction(this), 8, 'tackle', 3);
    else if (this.form === 'gigante') this.special(new BlastAction(this, false), 10, 'blast', 1.1);
    else this.special(new DirectoAction(this), 26, 'directo', 5);
  }

  /** E: Grua Tirar / El Directo / La Muerte. */
  skill2(): void {
    if (this.form === 'human') {
      const t = this.near(2.8);
      if (t) this.special(new ThrowAction(this, t), 8, 'throw', 4);
    } else if (this.form === 'gigante') this.special(new DirectoAction(this), 24, 'directo', 5);
    else this.special(new MuerteAction(this), 40, 'muerte', 10);
  }

  /** R: Grua Tirar (Gigante) / the shield blast (true form). */
  skill3(): void {
    if (this.form === 'gigante') {
      const t = this.near(2.8);
      if (t) this.special(new ThrowAction(this, t), 8, 'throw', 4);
    } else if (this.form === 'true') this.special(new ShieldBlastAction(this), 22, 'shieldblast', 5);
  }

  release(): void {
    const f = this.f;
    if (this.form === 'true' || f.busy) return;
    if (!f.spendRei(this.form === 'human' ? 20 : 40)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(new CoatAction(this, this.form === 'human' ? 'gigante' : 'true'), true);
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

  become(to: Form): void {
    const { f, g } = this;
    if (to === this.form) return;
    this.form = to;
    const stance = to === 'true' ? CHAD_TRUE_STANCE : CHAD_STANCE;
    f.def = { ...f.def, stance };
    f.setForm({ asset: chadAsset(to), props: [] }, to === 'true' ? AURA_CHAD_TRUE : AURA_CHAD);
    this.setHands();
    // the coating: a burst of dark liquid hardening, a ring of force
    const c = f.center();
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.dust.spawn({ x: c.x, y: c.y, z: c.z, vx: Math.cos(a) * 6, vy: Math.random() * 4, vz: Math.sin(a) * 6, size: 0.4, sizeEnd: 1.4, life: 0.7, r: 0.3, g: 0.2, b: 0.3, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 3 });
    }
    f.aura.flare(1.6, 0.8);
    g.addRing(f.pos.clone(), 12, to === 'true' ? '#A23A78' : '#DDF6F5', 0.5);
    g.shake(f === g.player ? 0.4 : 0.15);
    g.sfx.play('bankai', c, 0.8);
    if (to === 'gigante') g.callout('巨人の右腕', 'BRAZO DERECHA DE GIGANTE', '#ddf6f5');
    else g.callout('悪魔の左腕', 'BRAZO IZQUIERDA DEL DIABLO', '#eff9f9');
    this.applyStats();
  }

  private applyStats(): void {
    const f = this.f;
    f.power = (this.form === 'true' ? 1.35 : this.form === 'gigante' ? 1.15 : 1) * (this.flare ? 1.25 : 1);
    f.damageTaken = this.form === 'true' ? 0.75 : this.form === 'gigante' ? 0.85 : 0.9;
    f.toughness = this.form === 'true' ? 14 : this.form === 'gigante' ? 9 : 5;
    f.aura.target = this.flare ? 0.9 : this.form === 'true' ? 0.35 : this.form === 'gigante' ? 0.2 : 0.06;
  }

  formName(): string {
    return this.form === 'true' ? 'Gigante · Diablo' : this.form === 'gigante' ? 'Brazo Derecha de Gigante' : 'Fullbringer';
  }

  ai(): KitAI {
    return {
      reach: 1.7,
      chain: 4,
      releaseAt: [0.85, 0.5],
      moves: [
        { name: 'tackle', use: () => this.skill1(), min: 3, max: 9, weight: 1.4, cd: 4, when: () => this.form === 'human' },
        { name: 'throw', use: () => (this.form === 'human' ? this.skill2() : this.skill3()), min: 0, max: 2.6, weight: 1.4, cd: 5, when: () => this.form !== 'true' },
        { name: 'haymaker', use: () => this.heavy(), min: 0, max: 2.6, weight: 1.2, cd: 3, when: () => this.form !== 'true' },
        { name: 'blast', use: () => this.skill1(), min: 5, max: 40, weight: 2, cd: 1.6, when: () => this.form === 'gigante' },
        { name: 'directo', use: () => (this.form === 'gigante' ? this.skill2() : this.skill1()), min: 7, max: 60, weight: 1.4, cd: 6, when: () => this.form !== 'human' },
        { name: 'shield', use: () => this.heavy(), min: 0, max: 3, weight: 1.6, cd: 3, when: () => this.form === 'true' },
        { name: 'muerte', use: () => this.skill2(), min: 0, max: 4, weight: 1.6, cd: 10, when: () => this.form === 'true' },
        { name: 'shieldblast', use: () => this.skill3(), min: 5, max: 30, weight: 1.4, cd: 5, when: () => this.form === 'true' },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const fm = this.form, cd = this.cd;
    const list: AbilityInfo[] = [{ key: 'LMB', name: 'Boxing', kanji: '拳' }];
    if (fm === 'human') {
      list.push(
        { key: 'RMB', name: 'Haymaker', kanji: '撃', cost: 4, cd: cd.heavy, cdMax: 1.8 },
        { key: 'Q', name: 'Shoulder charge', kanji: '突進', cost: 8, cd: cd.tackle, cdMax: 3 },
        { key: 'E', name: 'Grua Tirar', kanji: '投', cost: 8, cd: cd.throw, cdMax: 4 },
      );
    } else if (fm === 'gigante') {
      list.push(
        { key: 'RMB', name: 'Armoured haymaker', kanji: '撃', cost: 8, cd: cd.heavy, cdMax: 1.8 },
        { key: 'Q', name: 'Fist blast', kanji: '弾', cost: 10, cd: cd.blast, cdMax: 1.1 },
        { key: 'E', name: 'El Directo', kanji: '巨人', cost: 24, cd: cd.directo, cdMax: 5 },
        { key: 'R', name: 'Grua Tirar', kanji: '投', cost: 8, cd: cd.throw, cdMax: 4 },
      );
    } else {
      list.push(
        { key: 'RMB', name: 'Shield', kanji: '盾', cost: 8, cd: cd.heavy, cdMax: 1.6 },
        { key: 'Q', name: 'El Directo', kanji: '巨人', cost: 26, cd: cd.directo, cdMax: 5 },
        { key: 'E', name: 'La Muerte', kanji: '魔人', cost: 40, cd: cd.muerte, cdMax: 10 },
        { key: 'R', name: 'Shield blast', kanji: '盾弾', cost: 22, cd: cd.shieldblast, cdMax: 5 },
      );
    }
    list.push(
      { key: 'Shift', name: 'Dash', kanji: '響転', cost: 4 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      fm === 'true' ? { key: 'F', name: 'Gigante · Diablo', kanji: '悪魔', active: true, tint: '#a23a78' } : { key: 'F', name: fm === 'human' ? 'Gigante' : 'True forms', kanji: fm === 'human' ? '巨人' : '悪魔', cost: fm === 'human' ? 20 : 40, tint: '#ddf6f5' },
    );
    return list;
  }
}
