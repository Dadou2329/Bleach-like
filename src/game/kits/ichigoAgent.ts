// Agent of the Shinigami Ichigo's kit (docs/kits/ichigo.md §4 Agent; dossier A1 §1 K0/K1, abilities A-C). The human
// high-schooler: karate (jab, reverse punch, roundhouse, spinning back kick), the concrete-cracker (RMB), the catch and
// judo throw (Q), the baseball bat of the first night (E), the protective charm that turns one big blow (R), spirit
// sight (G). F: Kon's pill — his soul pops out of his body; Kon keeps the body and fights beside him with his super legs.
// The Substitute Shinigami: the first sword, a katana as tall as he is — three wide two-handed swings that bite into
// walls and can stick (LMB again wrenches them free), the street-upturning cleave (RMB), the Ichigo Homerun (Q), the
// mask-breaker (E: three times the damage on a Hollow, the lesser ones purified), the Cero block (R: the flat raised,
// energy filling an overload meter; R again or full — the repel wave; overfilled — it vents skyward and burns him), the
// reiatsu surge (G). F: "Zangetsu!" — the blade bursts into the cleaver and the first swing tears a trench: the Shikai
// (the Hueco Mundo kit's, with no Bankai yet).
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { Game } from '../game';
import type { AbilityInfo } from '../../ui/hud';
import type { Kit, KitAI } from './kit';
import { IchigoKit } from './ichigo';
import { DuelistAI } from '../ai/duelist';
import { humanAsset } from '../../chars/ichigoHuman';
import { ichigoAsset, ichigoSword } from '../../chars/ichigo';
import { BAT_BASE_Z, BAT_TIP_Z, FIRST_BASE_Z, FIRST_TIP_Z, SHEATH_ON_BACK, baseballBat, firstSheath, firstSword } from '../../chars/ichigoAgent';
import { AGENT_HUMAN_CHAIN, AGENT_HUMAN_CLIPS, AGENT_HUMAN_STANCE, KON_CLIPS, SUB_CHAIN, SUB_CLIPS, SUB_STANCE } from '../../chars/ichigoAgentClips';
import { ICHIGO_CLIPS, ICHIGO_STANCE } from '../../chars/ichigoClips';
import { AURA_ICHIGO_SHIKAI, type AuraStyle } from '../../vfx/aura';
import { GETSUGA_BLUE } from '../../vfx/energy';
import { GroundGetsuga } from '../../vfx/ichigoArts';
import { SphereShape } from '../../destruction/shapes';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from '../../vfx/sprites';

type Form = 'human' | 'substitute' | 'shikai';
type BladeDef = NonNullable<FighterDef['blade']>;

/** raw, uncontrolled reiatsu leaking off him (the old anime's pale blue) */
export const AURA_AGENT: AuraStyle = { core: '#F4FBFF', body: '#8FD8FF', rim: '#2D74D0' };
const BLADE_FIRST: BladeDef = { prop: 'sword', base: [0, 0, FIRST_BASE_Z], tip: [0, 0, FIRST_TIP_Z], color: '#8FD8FF', core: '#F4FBFF' };
const BLADE_BAT: BladeDef = { prop: 'sword', base: [0, 0, BAT_BASE_Z], tip: [0, 0, BAT_TIP_Z], color: '#E8D4A6', core: '#FFFFFF' };
const BLADE_SHIKAI: BladeDef = { prop: 'sword', base: [0, 0, 0.16], tip: [0, 0, 1.56], color: '#7DDFFD', core: '#F9FFFF' };

const SPEED: Record<Form, FighterDef['speed']> = {
  human: { run: 7.6, sprint: 10.6, jump: 8.2, dash: 4.6, dashTime: 0.22 },
  substitute: { run: 9, sprint: 18, jump: 11, dash: 9, dashTime: 0.13 },
  shikai: { run: 9, sprint: 19, jump: 11.5, dash: 10, dashTime: 0.12 },
};
const POWER: Record<Form, number> = { human: 0.6, substitute: 0.9, shikai: 1 };
const TAKEN: Record<Form, number> = { human: 1.15, substitute: 1, shikai: 1 };

/** the Cero block's overload: full at this much energy held; past OVERFILL it vents and burns him */
const OVERLOAD = 160;
const OVERFILL = 230;
/** the reiatsu surge: how long and how strong */
const SURGE_TIME = 8;
/** spirit sight */
const SIGHT_TIME = 8;

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

export const AGENT_DEF: FighterDef = {
  id: 'ichigo-agent',
  name: 'Kurosaki Ichigo',
  title: 'Substitute Shinigami · Agent',
  build: () => ({ asset: humanAsset('school'), props: [] }),
  stance: AGENT_HUMAN_STANCE,
  clips: AGENT_HUMAN_CLIPS,
  aura: AURA_AGENT,
  // the human has no blade yet: the trail and sampler wait for the first sword (or the bat)
  blade: BLADE_FIRST,
  hp: 950,
  rei: 100,
  speed: { ...SPEED.human },
  radius: 0.4,
  height: 1.74,
};

const spec = (damage: number, knock: number, cut: number, extra: Partial<BladeSpec> = {}): BladeSpec => ({ damage, knock, launch: 0, hitstop: 0.05, shake: 0.12, cut, ...extra });

interface Strike {
  damage: number;
  knock: number;
  launch?: number;
  heavy?: boolean;
  reach: number;
  height: number;
  radius: number;
  lunge: number;
  limb: string;
}

const KARATE: Record<string, Strike> = {
  hm_jab: { damage: 9, knock: 4, reach: 0.95, height: 1.4, radius: 0.7, lunge: 4, limb: 'knuckle.L' },
  hm_cross: { damage: 12, knock: 6, reach: 1.0, height: 1.35, radius: 0.72, lunge: 5, limb: 'knuckle.R' },
  hm_round: { damage: 15, knock: 10, launch: 2, reach: 1.0, height: 1.45, radius: 0.85, lunge: 4, limb: 'toe.R' },
  hm_spinback: { damage: 18, knock: 14, reach: 1.05, height: 1.25, radius: 0.85, lunge: 5, limb: 'toe.L' },
  hm_crack: { damage: 24, knock: 3, heavy: true, reach: 1.0, height: 0.8, radius: 0.95, lunge: 3, limb: 'heel.R' },
  // Kon's legs
  hm_front: { damage: 16, knock: 12, reach: 1.05, height: 1.05, radius: 0.75, lunge: 6, limb: 'toe.R' },
  kon_kick: { damage: 30, knock: 18, launch: 4, heavy: true, reach: 1.1, height: 1.0, radius: 1.0, lunge: 0, limb: 'toe.R' },
};

interface Cut {
  window: [number, number];
  spec: BladeSpec;
  lunge?: [number, number];
  impact?: { radius: number; power: number };
}

/** the first sword: crude and heavy — it bites into a wall rather than parting it */
const CUTS: Record<string, Cut> = {
  sb_s1: { window: [0.18, 0.34], spec: spec(26, 9, 35), lunge: [7, 0] },
  sb_s2: { window: [0.13, 0.28], spec: spec(26, 8, 35, { launch: 4 }), lunge: [6, 0] },
  sb_s3: { window: [0.26, 0.38], spec: spec(40, 10, 45, { launch: 5, heavy: true, hitstop: 0.09, shake: 0.4 }), lunge: [6, 0], impact: { radius: 1.6, power: 110 } },
};

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

function aimAt(f: Fighter, g: Game, out = new THREE.Vector3()): THREE.Vector3 {
  if (f.faceTarget) return out.copy(f.faceTarget);
  if (f === g.player) return g.aimPoint(f, out);
  return f.center(out).addScaledVector(f.forward(), 30);
}

function groundBelow(g: Game, p: THREE.Vector3, depth = 6): number | null {
  const w = g.engine.world, vs = w.vs;
  const x = Math.floor(p.x / vs), z = Math.floor(p.z / vs);
  for (let y = Math.floor((p.y + 0.3) / vs); y > Math.floor((p.y - depth) / vs); y--) if (w.isSolid(x, y, z)) return (y + 1) * vs;
  return null;
}

function solidAt(g: Game, p: THREE.Vector3): boolean {
  const w = g.engine.world, vs = w.vs;
  return w.isSolid(Math.floor(p.x / vs), Math.floor(p.y / vs), Math.floor(p.z / vs));
}

const isHollow = (o: Fighter) => o.def.id === 'hollow' || o.def.id === 'menos';

/** One sphere blow ahead (karate, Kon's legs). */
function strike(f: Fighter, g: Game, s: Strike, hits: Set<number>, color = '#F3E9D8'): number {
  const fw = f.forward(_w).clone();
  const c = f.pos.clone().addScaledVector(fw, s.reach);
  c.y += s.height;
  let n = 0;
  for (const o of g.enemiesOf(f)) {
    if (hits.has(o.id)) continue;
    const cy = Math.max(o.pos.y + 0.15, Math.min(o.pos.y + o.def.height - 0.15, c.y));
    if (Math.hypot(o.pos.x - c.x, cy - c.y, o.pos.z - c.z) > s.radius + o.def.radius) continue;
    hits.add(o.id);
    n++;
    const dir = _v.subVectors(o.pos, f.pos).setY(0);
    if (dir.lengthSq() < 1e-4) dir.copy(fw);
    dir.normalize();
    g.damage(o, s.damage, f, dir.clone(), { knock: s.knock, launch: s.launch, heavy: s.heavy, hitstop: 0.045, shake: 0.1 });
    g.sparks(new THREE.Vector3(o.pos.x, cy, o.pos.z), dir, color, 6);
  }
  return n;
}

// ------------------------------------------------------------------------------------------------ actions

/** A karate blow (the human) or a kick (Kon): the sphere ahead at the 'hit' beat. */
class BlowAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private hitAt = 0;
  private struck = false;
  private hits = new Set<number>();
  queued = false;
  constructor(readonly owner: { chain(i: number): void; g: Game }, readonly clip: string, readonly index: number, readonly s: Strike, readonly chained = true, readonly onStrike?: () => void, readonly onBeat?: (n: string) => void) {
    super();
    this.name = clip;
    this.mobility = 0.12;
    this.airGravity = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.65;
    this.hitAt = c.events.hit ?? this.dur * 0.4;
    f.anim.play(this.clip, {
      fadeIn: 0.03,
      onEvent: (n) => {
        this.onBeat?.(n);
        if (n !== 'step') return;
        const t = f.faceTarget;
        const extra = t ? Math.min(3, Math.max(0, Math.hypot(t.x - f.pos.x, t.z - f.pos.z) - 1.2)) : 0;
        f.push.addScaledVector(f.forward(), this.s.lunge + extra * 2);
        g.sfx.play('swing', f.center(), 0.6);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.struck && this.t >= this.hitAt) {
      this.struck = true;
      strike(f, g, this.s, this.hits);
      this.onStrike?.();
    }
    if (this.chained && this.queued && this.t >= this.comboAt) {
      this.done = true;
      this.owner.chain(this.index + 1);
      return;
    }
    if (this.t >= this.dur) this.done = true;
  }
  override canCancel(next: FighterAction): boolean {
    if (next.name === 'dash' || next instanceof SkillAction) return this.t >= this.hitAt + 0.02;
    return false;
  }
}

/** Base for one-shot skills. */
abstract class SkillAction extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: AgentKit) {
    super();
  }
  protected playClip(f: Fighter, clip: string, onEvent: (n: string) => void, speed = 1, hold = false): void {
    const c = f.anim.clip(clip);
    if (!c) {
      this.done = true;
      return;
    }
    this.dur = (c.dur - c.fadeOut * 0.5) / speed;
    f.anim.play(clip, { onEvent, speed, hold });
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
    return next.name === 'dash' && this.t > this.dur * 0.7;
  }
}

/** One cut of the first sword; at its end the blade may have bitten into a wall and stuck there. */
class SubCutAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private impacted = false;
  private swished = false;
  private checked = false;
  queued = false;
  constructor(readonly kit: AgentKit, readonly clip: string, readonly index: number, readonly info: Cut) {
    super();
    this.name = clip;
    this.mobility = 0.1;
    this.airGravity = 0.12;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    f.bladeHits.clear();
    f.bladeSpec = this.kit.surgeSpec(this.info.spec);
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n === 'step' && this.info.lunge) {
          const t = f.faceTarget;
          const extra = t ? Math.min(4, Math.max(0, Math.hypot(t.x - f.pos.x, t.z - f.pos.z) - 1.6)) : 0;
          f.push.addScaledVector(f.forward(), this.info.lunge[0] + extra * 2.4);
        }
        if (n === 'fx' && this.info.impact && !this.impacted) {
          this.impacted = true;
          const tip = f.blade.tip.clone();
          const gy = groundBelow(g, tip, 2.5);
          if (gy !== null && tip.y - gy < 1.3) {
            tip.y = gy;
            g.groundImpact(tip, this.info.impact.radius, this.info.impact.power, AURA_AGENT.body, f);
            g.shake(this.info.spec.shake);
          }
        }
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const [w0, w1] = this.info.window;
    if (!this.swished && this.t >= w0 - 0.03) {
      this.swished = true;
      g.sfx.play('swingHeavy', f.center(), 0.9);
    }
    f.bladeActive = this.t >= w0 && this.t <= w1;
    if (f.trail) f.trail.emitting = this.t >= w0 - 0.02 && this.t <= w1 + 0.06;
    // the oversized blade bites into a hard wall and stays there
    if (!this.checked && this.t >= w1) {
      this.checked = true;
      if (this.kit.bitWall()) {
        this.done = true;
        f.act(new StuckAction(this.kit), true);
        return;
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
    f.bladeActive = false;
    if (f.trail) f.trail.emitting = false;
  }
  override canCancel(next: FighterAction): boolean {
    if (next.name === 'dash' || next instanceof SkillAction) return this.t >= this.info.window[0] + 0.06;
    return false;
  }
}

/** The blade stuck in a wall: he hangs on it; LMB (or three seconds) wrenches it free. */
class StuckAction extends FighterAction {
  readonly name = 'stuck';
  constructor(readonly kit: AgentKit) {
    super();
    this.mobility = 0;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    // the pose freezes where the blade stopped
    for (const a of f.anim.active) if (!a.ending) a.speed = 0;
    g.sfx.play('impact', f.blade.tip, 0.8);
    g.sparks(f.blade.tip.clone(), f.forward(_v), '#D8D2C4', 10);
    if (f === g.player) g.hud?.showBanner('Stuck in the wall — LMB to wrench it free');
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t > 3) {
      this.done = true;
      f.act(new YankAction(this.kit), true);
    }
  }
  override end(f: Fighter): void {
    for (const a of f.anim.active) if (a.speed === 0) a.speed = 1;
  }
  override canCancel(next: FighterAction): boolean {
    return next instanceof YankAction;
  }
}

/** LMB while stuck: both hands, a lean back, the blade torn out in a burst of rubble. */
class YankAction extends SkillAction {
  readonly name = 'yank';
  constructor(kit: AgentKit) {
    super(kit);
    this.mobility = 0;
  }
  override start(f: Fighter, g: Game): void {
    const tip = f.blade.tip.clone();
    this.playClip(f, 'sb_yank', (n) => {
      if (n !== 'free') return;
      g.engine.destruction.carve(new SphereShape(tip, 0.6), { mode: 'smash', power: 120, impulse: 6, dust: 0.8 });
      g.sfx.play('crumble', tip, 0.8);
    });
  }
}

/** RMB (Substitute): the street-upturning cleave — a hop and a two-handed chop that rips up the road ahead. */
class CleaveAction extends SkillAction {
  readonly name = 'cleave';
  private fired = false;
  constructor(kit: AgentKit) {
    super(kit);
    this.mobility = 0.05;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    f.bladeSpec = this.kit.surgeSpec(spec(44, 14, 45, { launch: 6, heavy: true, hitstop: 0.12, shake: 0.5 }));
    this.playClip(f, 'sb_cleave', (n) => {
      if (n === 'step') f.push.addScaledVector(f.forward(), 5);
      if (n !== 'fx' || this.fired) return;
      this.fired = true;
      const tip = f.blade.tip.clone();
      const gy = groundBelow(g, tip, 3);
      if (gy !== null) tip.y = gy;
      const dir = f.forward(_v).setY(0).normalize().clone();
      g.groundImpact(tip.clone(), 2, 160, AURA_AGENT.body, f);
      g.addProjectile(new GroundGetsuga(g, f, tip.addScaledVector(dir, 0.6), dir, GETSUGA_BLUE, { speed: 26, range: 14 * this.kit.surgeK(), width: 1.4, damage: 50, power: 220 }));
      g.shake(f === g.player ? 0.55 : 0.2);
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    f.bladeActive = this.t > 0.42 && this.t < 0.52;
    if (f.trail) f.trail.emitting = this.t > 0.38 && this.t < 0.6;
  }
}

/** Q (Substitute): the Ichigo Homerun — the batter's swing that launches; E (human): the same swing with the bat. */
class HomerunAction extends SkillAction {
  readonly name: string;
  constructor(kit: AgentKit, readonly bat: boolean) {
    super(kit);
    this.name = bat ? 'bat' : 'homerun';
    this.mobility = 0.05;
  }
  override start(f: Fighter, g: Game): void {
    if (this.bat) this.kit.holdBat(true);
    f.bladeHits.clear();
    f.bladeSpec = this.bat ? spec(18, 16, 0, { launch: 9, hitstop: 0.09, shake: 0.3 }) : this.kit.surgeSpec(spec(34, 18, 35, { launch: 13, heavy: true, hitstop: 0.12, shake: 0.45 }));
    this.playClip(f, 'sb_homerun', (n) => {
      if (n === 'step') f.push.addScaledVector(f.forward(), 4);
      if (n === 'hit') g.sfx.play(this.bat ? 'hit' : 'swingHeavy', f.center(), 0.9);
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    f.bladeActive = this.t > 0.3 && this.t < 0.47;
    if (f.trail) f.trail.emitting = this.t > 0.28 && this.t < 0.52;
  }
  override end(f: Fighter): void {
    super.end(f);
    if (this.bat) this.kit.holdBat(false);
  }
}

/** E (Substitute): the mask-breaker — a cut across the head; Hollows take it three times over, the lesser ones purified. */
class MaskBreakAction extends SkillAction {
  readonly name = 'maskbreak';
  constructor(kit: AgentKit) {
    super(kit);
    this.mobility = 0.08;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    const base = this.kit.surgeSpec(spec(36, 10, 40, { hitstop: 0.1, shake: 0.35 }));
    f.bladeSpec = {
      ...base,
      onHit: (o) => {
        if (!isHollow(o) || o.dead) return;
        // the mask split: a lesser Hollow is purified outright, any Hollow takes the blow three times over
        const dir = o.pos.clone().sub(f.pos).setY(0).normalize();
        if (o.def.id === 'hollow' && o.maxHp <= 400) g.damage(o, o.hp + 1, f, dir, { knock: 4, heavy: true });
        else g.damage(o, base.damage * 2, f, dir, { knock: 6, heavy: true });
        g.callout('', 'MASK BROKEN', '#e9f6ff');
      },
    };
    this.playClip(f, 'sb_mask', (n) => {
      if (n === 'step') {
        const t = f.faceTarget;
        const extra = t ? Math.min(4, Math.max(0, Math.hypot(t.x - f.pos.x, t.z - f.pos.z) - 1.6)) : 0;
        f.push.addScaledVector(f.forward(), 6 + extra * 2.4);
      }
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    f.bladeActive = this.t > 0.22 && this.t < 0.34;
    if (f.trail) f.trail.emitting = this.t > 0.2 && this.t < 0.4;
  }
}

/**
 * R (Substitute): the Cero block — the flat raised; energy that reaches it is held (the overload meter fills), shots
 * near it are swallowed. R again, or the meter full: the repel wave. Held past bursting, it vents into the sky and
 * burns him.
 */
class BlockAction extends SkillAction {
  readonly name = 'block';
  constructor(kit: AgentKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    this.kit.blocking = true;
    this.playClip(f, 'sb_block', () => {}, 1, true);
    this.dur = 4;
    g.sfx.play('ting', f.center(), 0.6);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const k = this.kit;
    // shots that come at the flat are swallowed into it
    const mid = f.blade.base.clone().lerp(f.blade.tip, 0.5);
    const n = g.rejectNear(mid.addScaledVector(f.forward(_v), 0.5), 1.8, f, false);
    if (n > 0) k.absorb(30 * n);
    if (k.overload >= OVERLOAD && !this.done) {
      this.done = true;
      f.act(new RepelAction(k), true);
    }
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.blocking = false;
  }
  override canCancel(next: FighterAction): boolean {
    return next instanceof RepelAction || next.name === 'dash';
  }
}

/** The repel: the flat shoved out — what it held goes back out as a wave of his own reiatsu. */
class RepelAction extends SkillAction {
  readonly name = 'repel';
  constructor(kit: AgentKit) {
    super(kit);
    this.mobility = 0;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'sb_repel', (n) => {
      if (n !== 'fire') return;
      const k = this.kit;
      const held = k.overload;
      k.overload = 0;
      if (held > OVERFILL) {
        // too much to hold: it vents skyward and burns him
        k.vent(held);
        return;
      }
      const dir = aimAt(f, g, _v).sub(f.center()).normalize().clone();
      const origin = f.center().addScaledVector(dir, 1);
      const power = 0.5 + held / OVERLOAD;
      g.addProjectile(new GroundGetsuga(g, f, origin.clone().setY(f.pos.y), dir, GETSUGA_BLUE, { speed: 40, range: 24 + 10 * power, width: 1.6 + power, damage: 30 + held * 0.8, power: 200 + held * 2 }));
      for (const o of g.enemiesOf(f)) {
        const d = o.pos.distanceTo(f.pos);
        if (d < 6) g.damage(o, (20 + held * 0.4) * (1 - d / 6), f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 18, launch: 4, heavy: true, energy: true });
      }
      g.addRing(origin.clone(), 5, AURA_AGENT.body, 0.35);
      g.sfx.play('getsuga', origin, 0.9);
      g.shake(f === g.player ? 0.5 : 0.2);
    });
  }
}

/** Q (human): the catch and the judo throw — the arm (or the weapon) caught, the foe over his shoulder and into the ground. */
class ThrowAction extends SkillAction {
  readonly name = 'throw';
  private held: Fighter | null = null;
  private thrown = false;
  constructor(kit: AgentKit, readonly target: Fighter) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ag_throw', (n) => {
      if (n === 'grab' && !this.target.dead && this.target.pos.distanceTo(f.pos) < 2.2 + this.target.def.radius && !this.target.def.boss) {
        this.held = this.target;
        this.held.stopAction();
        g.sfx.play('hit', this.held.center(), 0.7);
      }
      if (n === 'throw') this.slam(f, g);
    });
  }
  private slam(f: Fighter, g: Game): void {
    if (this.thrown || !this.held) return;
    this.thrown = true;
    const o = this.held;
    this.held = null;
    if (o.dead) return;
    const fw = f.forward(_w);
    const p = f.pos.clone().addScaledVector(fw, 1.4);
    p.y = groundBelow(g, p.clone().setY(f.pos.y + 1), 4) ?? f.pos.y;
    o.body.pos.copy(p);
    o.body.prev.copy(p);
    g.damage(o, 22, f, fw.clone(), { knock: 3, launch: 2, heavy: true, hitstop: 0.12, shake: 0.4, unblockable: true });
    g.groundImpact(p, 1, 70, '#D8D2C4', f);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const o = this.held;
    if (!o || o.dead) return;
    // over the shoulder: up behind his head, then down in front
    const fw = f.forward(_w);
    const k = Math.max(0, Math.min(1, (this.t - 0.13) / 0.42));
    const a = Math.PI * k;
    const p = f.pos.clone().addScaledVector(fw, 0.9 * Math.cos(a) - 0.2).add(new THREE.Vector3(0, 0.3 + Math.sin(a) * 1.7, 0));
    o.body.pos.copy(p);
    o.body.vel.set(0, 0, 0);
    o.push.set(0, 0, 0);
    o.hitstun = Math.max(o.hitstun, 0.3);
  }
  override end(f: Fighter): void {
    super.end(f);
    this.slam(f, this.kit.g);
  }
}

/** R (human): the charm held up — the next big blow is turned aside once. */
class CharmAction extends SkillAction {
  readonly name = 'charm';
  constructor(kit: AgentKit) {
    super(kit);
    this.mobility = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ag_charm', (n) => {
      if (n !== 'charm') return;
      this.kit.charm = true;
      const p = sock(f, 'palm.L', _v);
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.6, sizeEnd: 0.1, life: 0.4, r: 1, g: 0.85, b: 0.6, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
      g.sfx.play('heal', p, 0.6);
    });
  }
}

/** F (human): Kon's pill — the soul knocked out of the body; Kon takes the body, Ichigo stands in his Shinigami robes. */
class PillAction extends SkillAction {
  readonly name = 'pill';
  private popped = false;
  constructor(kit: AgentKit) {
    super(kit);
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter): void {
    this.playClip(f, 'ag_pill', (n) => {
      if (n === 'pop' && !this.popped) {
        this.popped = true;
        this.kit.popSoul();
      }
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.popped) this.done = true;
  }
}

/** F (Substitute): "Zangetsu!" — the blade bursts into the cleaver; the first swing tears a trench through everything. */
class ZangetsuAction extends SkillAction {
  readonly name = 'zangetsu';
  private burst = false;
  private swung = false;
  constructor(kit: AgentKit) {
    super(kit);
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'sb_zangetsu', (n) => {
      if (n === 'call') g.callout('斬月', 'ZANGETSU!', '#9fe6ff');
      if (n === 'burst' && !this.burst) {
        this.burst = true;
        this.kit.becomeShikai();
        this.dur = this.t + 1.0;
        // the first swing: the overhead chop at a crawl, then the trench
        f.anim.play('slash3', { speed: 0.85, onEvent: (e) => e === 'fx' && this.trench(f, g) });
      }
    });
  }
  private trench(f: Fighter, g: Game): void {
    if (this.swung) return;
    this.swung = true;
    const tip = f.blade.tip.clone();
    const gy = groundBelow(g, tip, 3);
    if (gy !== null) tip.y = gy;
    const dir = f.forward(_v).setY(0).normalize().clone();
    g.addProjectile(new GroundGetsuga(g, f, tip, dir, GETSUGA_BLUE, { speed: 34, range: 40, width: 2.4, damage: 110, power: 520 }));
    g.groundImpact(tip.clone(), 2.6, 220, AURA_ICHIGO_SHIKAI.body, f);
    g.shake(f === g.player ? 0.8 : 0.3);
    g.hitstop(0.1);
  }
}

// ------------------------------------------------------------------------------------------------ Kon

/** Kon, the Mod Soul, in Ichigo's body: loud, cocky, and his legs hit like a truck. */
export class KonKit implements Kit {
  private combo = 0;
  private lastEnd = 0;
  private kickCd = 0;
  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.ghosts.enabled = false;
  }
  update(dt: number): void {
    this.kickCd = Math.max(0, this.kickCd - dt);
  }
  attack(): void {
    const f = this.f;
    if (f.action instanceof BlowAction) {
      f.action.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastEnd > 0.8) this.combo = 0;
    this.chain(this.combo);
  }
  chain(i: number): void {
    const list = ['hm_front', 'hm_round', 'hm_front'];
    const idx = i % list.length;
    this.combo = idx + 1;
    this.lastEnd = this.g.time + 0.8;
    this.f.act(new BlowAction(this, list[idx], idx, KARATE[list[idx]]), true);
  }
  /** the flying kick */
  heavy(): void {
    const { f, g } = this;
    if (f.busy || this.kickCd > 0 || !f.grounded) return;
    this.kickCd = 2.5;
    f.act(new BlowAction(this, 'kon_kick', 0, KARATE.kon_kick, false, undefined, (n) => {
      if (n !== 'jump' || f.dead) return;
      // the super legs: off the ground in one bound, straight at the foe
      const t = f.faceTarget;
      const d = t ? Math.min(9, Math.hypot(t.x - f.pos.x, t.z - f.pos.z)) : 5;
      f.body.vel.y = 8.5;
      f.body.grounded = false;
      f.push.addScaledVector(f.forward(), d * 2.6);
      g.sfx.play('step', f.pos, 1.2);
      g.groundImpact(f.pos.clone(), 0.8, 30, '#D8D2C4', f);
    }), true);
  }
  skill1(): void {}
  release(): void {}
  toggleFlare(): void {}
  abilities(): AbilityInfo[] {
    return [];
  }
  formName(): string {
    return 'Kon';
  }
  ai(): KitAI {
    return {
      reach: 1.4,
      chain: 3,
      moves: [{ name: 'flykick', use: () => this.heavy(), min: 2.5, max: 9, weight: 2, cd: 3 }],
    };
  }
}

function konDef(): FighterDef {
  return {
    id: 'kon-body',
    name: 'Kon',
    title: 'Mod Soul · in Ichigo’s body',
    build: () => ({ asset: humanAsset('school'), props: [] }),
    stance: AGENT_HUMAN_STANCE,
    clips: KON_CLIPS,
    aura: AURA_AGENT,
    hp: 280,
    rei: 40,
    speed: { run: 9.5, sprint: 13, jump: 13, dash: 5, dashTime: 0.18 },
    radius: 0.4,
    height: 1.74,
  };
}

// ------------------------------------------------------------------------------------------------ the kit

export class AgentKit implements Kit {
  form: Form = 'human';
  private combo = 0;
  private lastEnd = 0;
  readonly cd = { throw: 0, bat: 0, charm: 0, homerun: 0, mask: 0, block: 0, cleave: 0, surge: 0, sight: 0 };
  flare = false;
  /** the human's charm: one big blow turned aside */
  charm = false;
  /** the reiatsu surge */
  surgeT = 0;
  /** spirit sight */
  sightT = 0;
  /** the Cero block */
  blocking = false;
  overload = 0;
  /** Kon in the body */
  kon: Fighter | null = null;
  /** the Shikai: the Hueco Mundo kit, without Bankai or Hollow */
  inner: IchigoKit | null = null;

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.parry = (amount, from, o) => this.parry(amount, from, o);
    this.applyStats();
  }

  update(dt: number): void {
    const { f, g } = this;
    if (this.inner) {
      this.inner.update(dt);
      if (this.flare) {
        f.rei -= dt * 6;
        if (f.rei <= 0) this.toggleFlare();
      }
      return;
    }
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    if (this.surgeT > 0) {
      this.surgeT -= dt;
      // it leaks: his reiatsu pours off him
      f.rei -= dt * 3;
      if (Math.random() < 0.4) {
        const c = f.center();
        g.engine.glow.spawn({ x: c.x + (Math.random() - 0.5) * 0.8, y: f.pos.y + Math.random() * 1.8, z: c.z + (Math.random() - 0.5) * 0.8, vy: 2.5, size: 0.14, sizeEnd: 0.03, life: 0.5, r: 0.56, g: 0.85, b: 1, alpha: 0.8, alphaEnd: 0, tex: TEX_STREAK, stretch: 2 });
      }
      if (this.surgeT <= 0 || f.rei <= 0) {
        this.surgeT = 0;
        this.applyStats();
      }
    }
    if (this.sightT > 0) {
      this.sightT -= dt;
      this.ribbon();
    }
    if (this.kon && (this.kon.dead || !g.fighters.includes(this.kon))) this.kon = null;
  }

  // -------------------------------------------------------------------------------------------- inputs

  attack(): void {
    const f = this.f;
    if (this.inner) return this.inner.attack();
    const cur = f.action;
    if (cur instanceof StuckAction) {
      cur.done = true;
      f.act(new YankAction(this), true);
      return;
    }
    if (cur instanceof SubCutAction || cur instanceof BlowAction) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastEnd > 0.8) this.combo = 0;
    this.chain(this.combo);
  }

  chain(i: number): void {
    const f = this.f;
    const list = this.form === 'human' ? AGENT_HUMAN_CHAIN : SUB_CHAIN;
    const idx = i % list.length;
    this.combo = idx + 1;
    this.lastEnd = this.g.time + 0.8;
    const clip = list[idx];
    if (this.form === 'human') f.act(new BlowAction(this, clip, idx, KARATE[clip]), true);
    else f.act(new SubCutAction(this, clip, idx, CUTS[clip]), true);
  }

  heavy(): void {
    const f = this.f;
    if (this.inner) return this.inner.heavy();
    if (this.form === 'human') {
      if (f.busy && !(f.action instanceof BlowAction)) return;
      const crack = new BlowAction(this, 'hm_crack', 0, KARATE.hm_crack, false, () => {
        const h = sock(f, 'heel.R', _v);
        const gy = groundBelow(this.g, h.clone().setY(h.y + 0.5), 3);
        // the concrete-cracker: the pavement splits under a human's heel
        if (gy !== null) this.g.groundImpact(new THREE.Vector3(h.x, gy, h.z), 1, 90, '#D8D2C4', f);
      });
      if (f.action && !f.action.canCancel(crack)) return;
      f.act(crack, true);
      return;
    }
    this.special(new CleaveAction(this), 0, 'cleave', 1.6);
  }

  /** Q */
  skill1(): void {
    if (this.inner) return this.inner.skill1();
    if (this.form === 'human') {
      const t = this.near(2.4);
      if (t) this.special(new ThrowAction(this, t), 0, 'throw', 3);
      return;
    }
    this.special(new HomerunAction(this, false), 10, 'homerun', 3);
  }

  /** E */
  skill2(): void {
    if (this.inner) return this.inner.skill2();
    if (this.form === 'human') this.special(new HomerunAction(this, true), 0, 'bat', 2.5);
    else this.special(new MaskBreakAction(this), 12, 'mask', 2.5);
  }

  /** R */
  skill3(): void {
    const f = this.f;
    if (this.inner) return this.inner.skill3();
    if (this.form === 'human') {
      if (!this.charm) this.special(new CharmAction(this), 0, 'charm', 25);
      return;
    }
    // R again while blocking: the repel
    if (f.action instanceof BlockAction) {
      f.action.done = true;
      f.act(new RepelAction(this), true);
      return;
    }
    this.special(new BlockAction(this), 8, 'block', 2);
  }

  /** F: Kon's pill · "Zangetsu!" · (Shikai) no Bankai yet */
  release(): void {
    const f = this.f;
    if (this.inner) return this.inner.release();
    if (f.busy && !(f.action instanceof BlowAction || f.action instanceof SubCutAction)) return;
    f.stopAction();
    if (this.form === 'human') f.act(new PillAction(this), true);
    else f.act(new ZangetsuAction(this), true);
  }

  /** G: spirit sight · the reiatsu surge */
  toggle(): void {
    const { f, g } = this;
    if (this.inner) return;
    if (this.form === 'human') {
      if (this.cd.sight > 0) return;
      this.cd.sight = SIGHT_TIME + 4;
      this.sightT = SIGHT_TIME;
      g.sfx.play('flare', f.center(), 0.3);
      return;
    }
    if (this.surgeT > 0 || this.cd.surge > 0) return;
    if (f.rei < 10) return this.noRei();
    this.surgeT = SURGE_TIME;
    this.cd.surge = SURGE_TIME + 8;
    this.applyStats();
    f.aura.flare(1.8, 0.5);
    g.addRing(f.pos.clone().setY(f.pos.y + 0.05), 7, AURA_AGENT.body, 0.4);
    g.sfx.play('flare', f.center());
    g.shake(f === g.player ? 0.3 : 0.1);
  }

  toggleFlare(): void {
    if (this.inner) {
      this.inner.toggleFlare();
      return;
    }
    this.flare = !this.flare;
    this.applyStats();
    if (this.flare) {
      this.f.aura.flare(1.6, 0.4);
      this.g.sfx.play('flare', this.f.center());
    }
  }

  private noRei(): void {
    if (this.f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
  }

  target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 80, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 80);
  }

  private near(range: number): Fighter | null {
    const t = this.target();
    return t && t.pos.distanceTo(this.f.pos) <= range ? t : null;
  }

  private special(a: FighterAction, cost: number, cdKey: keyof typeof this.cd, cd: number): boolean {
    const f = this.f;
    if (this.cd[cdKey] > 0 || f.dead) return false;
    if (f.action && !f.action.canCancel(a)) return false;
    if (f.hitstun > 0 || f.dashT > 0) return false;
    if (cost > 0 && !f.spendRei(cost)) {
      this.noRei();
      return false;
    }
    this.cd[cdKey] = cd;
    f.act(a, true);
    return true;
  }

  // -------------------------------------------------------------------------------------------- the first sword

  /** the surge: half again as strong, every cut cutting deeper */
  surgeK(): number {
    return this.surgeT > 0 ? 1.4 : 1;
  }

  surgeSpec(s: BladeSpec): BladeSpec {
    return this.surgeT > 0 ? { ...s, cut: s.cut * 2 } : s;
  }

  /** At a cut's end: the outer half of the blade (and a hand's breadth past it) inside a wall → it bit in and stuck. */
  bitWall(): boolean {
    const { f, g } = this;
    if (!f.bladeValid) return false;
    const base = f.blade.base, tip = f.blade.tip;
    const dir = _v.subVectors(tip, base).normalize();
    let n = 0;
    for (const k of [0.6, 0.8, 1]) if (solidAt(g, _w.copy(base).lerp(tip, k).addScaledVector(dir, 0.06))) n++;
    return n >= 2;
  }

  /** The bat in his hands for the swing (E), or put away. */
  holdBat(on: boolean): void {
    const f = this.f;
    if (on) {
      f.visual.attach('sword', baseballBat(), 'grip.R');
      f.def = { ...f.def, blade: BLADE_BAT };
      f.visual.rig.setBoneVisible('fist.R', true);
    } else {
      f.visual.detach('sword');
      f.def = { ...f.def, blade: BLADE_FIRST };
    }
    f.bladeValid = false;
  }

  /** Energy held on the Cero block's flat. */
  absorb(n: number): void {
    const { f, g } = this;
    this.overload += n;
    const mid = f.blade.base.clone().lerp(f.blade.tip, 0.5);
    for (let i = 0; i < 8; i++) g.engine.glow.spawn({ x: mid.x, y: mid.y, z: mid.z, vx: (Math.random() - 0.5) * 4, vy: Math.random() * 3, vz: (Math.random() - 0.5) * 4, size: 0.12, sizeEnd: 0.03, life: 0.3, r: 0.7, g: 0.9, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2 });
    g.sfx.play('ting', mid, 0.5);
    // overfilled: it starts to come apart in his hands
    if (this.overload > OVERFILL && f.action instanceof BlockAction) {
      f.action.done = true;
      f.act(new RepelAction(this), true);
    }
  }

  /** Too much held: it vents skyward — a pillar out of the blade — and burns him. */
  vent(held: number): void {
    const { f, g } = this;
    const tip = f.blade.tip.clone();
    for (let i = 0; i < 40; i++) g.engine.glow.spawn({ x: tip.x, y: tip.y, z: tip.z, vx: (Math.random() - 0.5) * 3, vy: 18 + Math.random() * 16, vz: (Math.random() - 0.5) * 3, size: 0.5, sizeEnd: 0.1, life: 0.8, r: 0.6, g: 0.86, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 4 });
    g.sfx.play('explode', tip, 0.8);
    g.callout('', 'OVERLOAD', '#9fe6ff');
    f.hp = Math.max(1, f.hp - Math.min(f.maxHp * 0.15, held * 0.4));
    f.hitstun = Math.max(f.hitstun, 0.8);
  }

  /** Spirit sight: the red ribbon of the nearest foe (through walls), its soul marked. */
  private ribbon(): void {
    const { f, g } = this;
    let best: Fighter | null = null, bd = Infinity;
    for (const o of g.enemiesOf(f)) {
      const d = o.pos.distanceTo(f.pos);
      if (d < bd) { bd = d; best = o; }
    }
    if (!best || Math.random() > 0.6) return;
    const a = sock(f, 'palm.L', _v).clone(), b = best.center();
    const k = Math.random();
    const p = a.lerp(b, k);
    p.y += Math.sin(k * Math.PI) * 0.6;
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.06, sizeEnd: 0.02, life: 0.4, r: 0.95, g: 0.12, b: 0.16, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    if (isHollow(best) && Math.random() < 0.3) g.engine.glow.spawn({ x: b.x, y: b.y + best.def.height * 0.5, z: b.z, size: 0.4, sizeEnd: 0.6, life: 0.3, r: 1, g: 0.3, b: 0.3, alpha: 0.5, alphaEnd: 0, tex: TEX_GLOW });
  }

  // -------------------------------------------------------------------------------------------- forms

  /** Kon's pill: the soul pops out of the body — the Substitute stands up out of it, Kon gets the body. */
  popSoul(): void {
    const { f, g } = this;
    const body = f.pos.clone();
    this.setForm('substitute');
    const c = f.center();
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: Math.cos(a) * 4, vy: Math.random() * 3, vz: Math.sin(a) * 4, size: 0.2, sizeEnd: 0.04, life: 0.5, r: 0.85, g: 0.95, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, drag: 2 });
    }
    g.sfx.play('flare', c, 0.8);
    g.callout('', 'SOUL OUT', '#e9f6ff');
    // the soul stands a step forward; Kon wakes in the body left behind
    f.push.addScaledVector(f.forward(_v), 6);
    if (this.kon && !this.kon.dead) return;
    const k = g.spawn(konDef(), body.addScaledVector(f.forward(_v), -0.6), f.team);
    k.yaw = f.yaw;
    const kit = new KonKit(k, g);
    g.controllers.push(new DuelistAI(g, k, kit, { aggression: 0.95, intro: 0.6 }));
    k.data.copyOf = f;
    this.kon = k;
    for (let i = 0; i < 10; i++) g.engine.dust.spawn({ x: k.pos.x, y: k.pos.y + 0.1, z: k.pos.z, vx: (Math.random() - 0.5) * 3, vy: Math.random() * 1.5, vz: (Math.random() - 0.5) * 3, size: 0.3, sizeEnd: 0.9, life: 0.5, r: 0.7, g: 0.68, b: 0.64, alpha: 0.4, alphaEnd: 0, tex: TEX_PUFF, drag: 3 });
  }

  /** "Zangetsu!": the Shikai — from here the Hueco Mundo kit's Shikai drives (no Bankai, no Hollow yet). */
  becomeShikai(): void {
    const { f, g } = this;
    this.setForm('shikai');
    const c = f.center();
    f.aura.pillarBurst(2.2);
    g.addRing(f.pos.clone().setY(f.pos.y + 0.05), 10, AURA_ICHIGO_SHIKAI.body, 0.5);
    g.sfx.play('bankai', c, 0.8);
    g.shake(f === g.player ? 0.6 : 0.25);
    for (let i = 0; i < 50; i++) {
      const a = Math.random() * Math.PI * 2, up = Math.random();
      g.engine.glow.spawn({ x: c.x, y: c.y + 0.5, z: c.z, vx: Math.cos(a) * 8 * (1 - up * 0.5), vy: up * 9, vz: Math.sin(a) * 8 * (1 - up * 0.5), size: 0.2, sizeEnd: 0.04, life: 0.5, r: 0.6, g: 0.9, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 3 });
    }
  }

  private setForm(form: Form): void {
    const f = this.f;
    this.form = form;
    this.combo = 0;
    if (form === 'shikai') {
      f.def = { ...f.def, stance: ICHIGO_STANCE, clips: ICHIGO_CLIPS, blade: BLADE_SHIKAI, speed: { ...SPEED.shikai } };
      f.anim.stopAll(0.05);
      f.setForm({ asset: ichigoAsset('shikai'), props: [{ key: 'sword', model: ichigoSword('shikai'), socket: 'grip.R' }] }, AURA_ICHIGO_SHIKAI, BLADE_SHIKAI);
      this.surgeT = 0;
      this.inner = new IchigoKit(f, this.g, { era: 'agent' });
      f.power = POWER.shikai;
      f.damageTaken = TAKEN.shikai;
      f.aura.target = 0.25;
      f.ghosts.enabled = true;
      f.ghosts.color.set(AURA_ICHIGO_SHIKAI.body);
      if (this.g.hud && f === this.g.player) this.g.hud.form = 'Shikai — Zangetsu';
      return;
    }
    const sub = form === 'substitute';
    f.def = { ...f.def, stance: sub ? SUB_STANCE : AGENT_HUMAN_STANCE, clips: sub ? SUB_CLIPS : AGENT_HUMAN_CLIPS, blade: BLADE_FIRST };
    f.anim.stopAll(0.05);
    f.setForm(
      sub
        ? { asset: ichigoAsset('substitute'), props: [{ key: 'sword', model: firstSword(), socket: 'grip.R' }, { key: 'sheath', model: firstSheath(), socket: 'back' }] }
        : { asset: humanAsset('school'), props: [] },
      AURA_AGENT,
      BLADE_FIRST,
    );
    if (sub) {
      // the sheath slung diagonally across the back, the mouth over the right shoulder
      const sh = f.visual.props.get('sheath');
      if (sh) {
        sh.position.set(...SHEATH_ON_BACK.pos);
        sh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...SHEATH_ON_BACK.dir).normalize());
      }
      const rig = f.visual.rig;
      rig.setBoneVisible('fist.R', true);
      rig.setBoneVisible('palm.R', false);
    }
    this.applyStats();
  }

  // -------------------------------------------------------------------------------------------- damage hooks

  private parry(amount: number, from: Fighter | null, o: { energy?: boolean; quiet?: boolean }): boolean {
    const { f, g } = this;
    // the Cero block: energy that reaches the flat is held
    if (this.blocking && o.energy) {
      this.absorb(amount);
      return true;
    }
    // the charm: one big blow turned aside
    if (this.charm && amount >= 30 && !o.quiet) {
      this.charm = false;
      const c = f.center();
      g.addRing(c.clone(), 2.2, '#FFE2A0', 0.3);
      g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: 1.6, sizeEnd: 0.2, life: 0.3, r: 1, g: 0.9, b: 0.6, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
      g.sfx.play('ting', c, 1);
      g.callout('', 'THE CHARM', '#ffe2a0');
      if (from && !from.dead) from.hitstun = Math.max(from.hitstun, 0.3);
      return true;
    }
    return false;
  }

  // -------------------------------------------------------------------------------------------- look & stats

  private applyStats(): void {
    const f = this.f;
    if (this.inner) return;
    f.def = { ...f.def, speed: { ...SPEED[this.form] } };
    f.damageTaken = TAKEN[this.form];
    f.power = POWER[this.form] * (this.flare ? 1.25 : 1) * (this.surgeT > 0 ? 1.4 : 1);
    f.aura.target = this.flare ? 1 : this.surgeT > 0 ? 0.6 : this.form === 'human' ? 0 : 0.2;
    f.ghosts.enabled = this.form !== 'human';
    f.ghosts.color.set(AURA_AGENT.body);
    if (this.g.hud && f === this.g.player) this.g.hud.form = this.formName();
  }

  formName(): string {
    if (this.inner) return this.inner.formName();
    if (this.form === 'human') return 'Human' + (this.sightT > 0 ? ' · spirit sight' : '');
    return 'Substitute Shinigami' + (this.surgeT > 0 ? ' · surge' : '') + (this.overload > 0 ? ` · overload ${Math.round((100 * this.overload) / OVERLOAD)}%` : '');
  }

  bareHands(): boolean {
    return this.form === 'human';
  }

  abilities(): AbilityInfo[] {
    if (this.inner) return this.inner.abilities();
    const cd = this.cd;
    if (this.form === 'human') return [
      { key: 'LMB', name: 'Karate', kanji: '空手' },
      { key: 'RMB', name: 'Concrete-cracker', kanji: '蹴' },
      { key: 'Q', name: 'Catch & throw', kanji: '投', cd: cd.throw, cdMax: 3 },
      { key: 'E', name: 'Baseball bat', kanji: '棒', cd: cd.bat, cdMax: 2.5 },
      { key: 'R', name: this.charm ? 'Charm (ready)' : 'Charm', kanji: '守', cd: cd.charm, cdMax: 25, active: this.charm },
      { key: 'F', name: "Kon's pill", kanji: '魂', tint: '#9fe6ff' },
      { key: 'G', name: 'Spirit sight', kanji: '霊', cd: cd.sight, cdMax: SIGHT_TIME + 4, active: this.sightT > 0, timer: this.sightT / SIGHT_TIME },
      { key: 'Shift', name: 'Dash', kanji: '走', cost: 4 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
    ];
    return [
      { key: 'LMB', name: 'First sword', kanji: '斬' },
      { key: 'RMB', name: 'Street-upturner', kanji: '断', cd: cd.cleave, cdMax: 1.6 },
      { key: 'Q', name: 'Ichigo Homerun', kanji: '打', cost: 10, cd: cd.homerun, cdMax: 3 },
      { key: 'E', name: 'Mask-breaker', kanji: '破', cost: 12, cd: cd.mask, cdMax: 2.5 },
      { key: 'R', name: this.blocking ? `Repel (${Math.round((100 * this.overload) / OVERLOAD)}%)` : 'Cero block', kanji: '盾', cost: 8, cd: cd.block, cdMax: 2, active: this.blocking },
      { key: 'F', name: 'Zangetsu!', kanji: '斬月', tint: '#9fe6ff' },
      { key: 'G', name: 'Reiatsu surge', kanji: '霊', cd: this.surgeT > 0 ? 0 : cd.surge, cdMax: SURGE_TIME + 8, active: this.surgeT > 0, timer: this.surgeT / SURGE_TIME },
      { key: 'Shift', name: 'Lunge-dash', kanji: '瞬', cost: 4 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
    ];
  }

  ai(): KitAI {
    const human = () => this.form === 'human', sub = () => this.form === 'substitute', shikai = () => this.inner !== null;
    const shotComing = () => this.g.projectiles.some((p) => (p as { owner?: Fighter }).owner !== undefined && (p as { owner?: Fighter }).owner !== this.f);
    return {
      reach: 2.4,
      chain: 4,
      // the pill at once (he does not fight as a human for long), "Zangetsu!" when it gets serious
      releaseAt: [1, 0.7],
      toggleAt: 0.6,
      toggleOn: () => this.surgeT > 0 || this.sightT > 0 || this.inner !== null || this.cd.surge > 0,
      moves: [
        { name: 'throw', use: () => this.skill1(), min: 0, max: 2.2, weight: 1.4, cd: 4, when: human },
        { name: 'bat', use: () => this.skill2(), min: 0, max: 2.6, weight: 1, cd: 4, when: human },
        { name: 'charm', use: () => this.skill3(), min: 0, max: 30, weight: 0.6, cd: 20, when: () => human() && !this.charm },
        { name: 'cleave', use: () => this.heavy(), min: 2, max: 10, weight: 1.4, cd: 3, when: sub },
        { name: 'homerun', use: () => this.skill1(), min: 0, max: 3, weight: 1.2, cd: 4, when: sub },
        { name: 'mask', use: () => this.skill2(), min: 0, max: 3.5, weight: 1.2, cd: 3.5, when: sub },
        { name: 'block', use: () => this.skill3(), min: 4, max: 40, weight: 2, cd: 4, when: () => sub() && shotComing() },
        { name: 'getsuga', use: () => this.skill1(), min: 6, max: 45, weight: 3, cd: 2.2, when: shikai },
        { name: 'plow', use: () => this.skill2(), min: 4, max: 26, weight: 1.4, cd: 5, when: shikai },
        { name: 'darts', use: () => this.skill3(), min: 6, max: 20, weight: 1.2, cd: 6, when: shikai },
      ],
    };
  }
}
