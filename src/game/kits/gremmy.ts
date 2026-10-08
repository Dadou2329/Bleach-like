// Gremmy Thoumeaux's kit (docs/kits/gremmy.md). The Visionary: what he imagines is real, and he never lifts a finger.
// LMB makes things at the target (a stone spike, a steel bar, a falling block, a pillar ram); RMB the giant stone hand
// (close in: Cookie Bones); Q the arsenal (rifles ↔ missiles); E the terrain (lava ↔ pillar rams); R the water cube
// (again: the crevice); G a clone (three out: the clone bombs); F the cosmic tier by clones (the Stone Fort, the meteor,
// outer space) or, near death, Imagined Strength; V Steel Body. Passives: Already Healed, the Metal Bar, the Blade Trap
// and the Bladed Dome in steel, Doubt, attention (cookie bones on anyone else reverts), and everything he made goes
// when he dies — the brain capsule drops out of the body.
import * as THREE from 'three';
import { FighterAction, type Fighter, type FighterDef } from '../fighter';
import type { DamageOpts, Game, Projectile } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import type { AuraStyle } from '../../vfx/aura';
import { gremmyAsset, gremmyProp } from '../../chars/gremmy';
import { BULK_CHAIN, BULK_CLIPS, BULK_STANCE, GREMMY_CHAIN, GREMMY_CLIPS, GREMMY_STANCE } from '../../chars/gremmyClips';
import { BladedDome, FallingBlock, FirearmRing, MetalBarBlock, Meteor, MissileSalvo, OuterSpace, PillarRam, SteelBar, StoneHand, StoneSpike, WaterCube, crumbleFort, dreamRipple, floorAt, raiseFort, type Fort } from '../../vfx/visionary';
import { LavaField } from '../../vfx/heat';
import { PropMesh } from '../characterFactory';
import { DuelistAI } from '../ai/duelist';
import { raycastVoxels } from '../../voxel/raycast';
import { SphereShape } from '../../destruction/shapes';
import { TEX_GLOW, TEX_PUFF } from '../../vfx/sprites';

export const AURA_GREMMY: AuraStyle = { core: '#FFFFFF', body: '#F0D8FF', rim: '#9A7AD8' };
export const AURA_BULK: AuraStyle = { core: '#FFC9D2', body: '#C93A55', rim: '#6A1426' };

const SPEED = { run: 9, sprint: 24, jump: 13, dash: 34, dashTime: 0.1 };
const SPEED_BULK = { run: 8, sprint: 22, jump: 12, dash: 30, dashTime: 0.1 };
const DREAM = '#C9A8FF';
const MAX_CLONES = 3;

export const GREMMY_DEF: FighterDef = {
  id: 'gremmy',
  name: 'Gremmy Thoumeaux',
  title: 'Sternritter "V" — The Visionary',
  build: () => ({ asset: gremmyAsset('base'), props: [] }),
  stance: GREMMY_STANCE,
  clips: GREMMY_CLIPS,
  aura: AURA_GREMMY,
  hp: 1050,
  rei: 320,
  speed: { ...SPEED },
  radius: 0.28,
  height: 1.55,
};

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

/** a few things later, on the sim clock */
class Timeline implements Projectile {
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

/** the glass round the brain: a capsule of clear glass with the brain prop inside, dropping out of the body */
class BrainCapsule implements Projectile {
  done = false;
  private t = 0;
  private vy = 2;
  private brain: PropMesh;
  private glass: THREE.Mesh;
  private pos: THREE.Vector3;
  constructor(private g: Game, from: THREE.Vector3) {
    this.pos = from.clone();
    this.brain = new PropMesh(gremmyProp('brain'));
    this.glass = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.2, 6, 12), new THREE.MeshPhysicalMaterial({ color: '#CFE3EA', transparent: true, opacity: 0.38, roughness: 0.05, metalness: 0.1, depthWrite: false }));
    g.engine.gr.scene.add(this.brain, this.glass);
    for (let i = 0; i < 30; i++) g.engine.glow.spawn({ x: from.x + (Math.random() - 0.5) * 0.8, y: from.y - Math.random() * 1.4, z: from.z + (Math.random() - 0.5) * 0.8, vx: (Math.random() - 0.5) * 1.5, vy: 1 + Math.random() * 2, vz: (Math.random() - 0.5) * 1.5, size: 0.12, sizeEnd: 0.02, life: 1.4, r: 0.85, g: 0.9, b: 1, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
  }
  update(dt: number, g: Game): void {
    this.t += dt;
    const gy = floorAt(g, this.pos);
    this.vy -= 18 * dt;
    this.pos.y += this.vy * dt;
    if (this.pos.y < gy + 0.14) {
      this.pos.y = gy + 0.14;
      this.vy = Math.abs(this.vy) > 2 ? -this.vy * 0.3 : 0;
    }
    if (this.t > 30) this.done = true;
  }
  render(): void {
    this.brain.position.copy(this.pos);
    this.glass.position.copy(this.pos);
    this.brain.rotation.z = Math.min(1.4, this.t * 2);
    this.glass.rotation.z = this.brain.rotation.z;
  }
  dispose(): void {
    this.brain.removeFromParent();
    this.brain.material.dispose();
    this.glass.removeFromParent();
    this.glass.geometry.dispose();
    (this.glass.material as THREE.Material).dispose();
  }
}

// ---------------------------------------------------------------------------------------------- actions

/** One creation of the string: the clip, its 'make' event; queued presses run on. No approach: he never comes in. */
class WillAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  queued = false;
  constructor(readonly kit: GremmyKit, readonly clip: string, readonly index: number, readonly onEvent: (n: string) => void, readonly next: () => void) {
    super();
    this.name = clip;
    this.mobility = 0.45;
    this.airGravity = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    f.anim.play(this.clip, { onEvent: (n) => { if (n === 'step') g.sfx.play('swingHeavy', f.center(), 0.5); this.onEvent(n); } });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.queued && this.t >= this.comboAt) {
      this.done = true;
      this.next();
      return;
    }
    if (this.t >= this.dur) this.done = true;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' || next instanceof ClipSkill ? this.t >= this.comboAt * 0.7 : false;
  }
}

interface SkillOpts {
  armor?: number;
  mobility?: number;
  tick?: (t: number, dt: number) => void;
  end?: () => void;
}

class ClipSkill extends FighterAction {
  private dur = 1;
  constructor(readonly name: string, readonly clip: string, private on: (n: string) => void, private o: SkillOpts = {}) {
    super();
    this.armor = o.armor ?? 0;
    this.mobility = o.mobility ?? 0.35;
    this.airGravity = 0.4;
  }
  override start(f: Fighter): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
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
    return next.name === 'dash' ? this.t > this.dur * 0.5 : next instanceof ClipSkill && this.t > this.dur * 0.6;
  }
}

// ---------------------------------------------------------------------------------------------- the clones

/** A clone of him: the same body, its own small imagination (spikes and blocks); hard until it forgets to harden. */
export class GremmyCloneKit implements Kit {
  comboIndex = 0;
  private lapseT = 0;
  bomb = false;
  constructor(readonly f: Fighter, readonly g: Game, readonly maker: GremmyKit) {
    f.data.kit = this;
    f.data.quincy = true;
    f.damageTaken = 0.25;
    f.toughness = 12;
  }
  /** a big action of its own: it forgets to harden for a second */
  private lapse(): void {
    this.lapseT = 1;
    this.f.damageTaken = 1;
    this.f.toughness = 0;
  }
  update(dt: number): void {
    if (this.lapseT > 0 && (this.lapseT -= dt) <= 0) {
      this.f.damageTaken = 0.25;
      this.f.toughness = 12;
    }
  }
  private target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 60);
  }
  attack(): void {
    const { f, g } = this;
    const t = this.target();
    if (f.busy || !t) return;
    f.act(new ClipSkill('cspike', 'gm_w1', (n) => {
      if (n !== 'make' || t.dead) return;
      const at = t.pos.clone();
      at.y = floorAt(g, at);
      g.addProjectile(new StoneSpike(g, f, at, 10, 0.8));
    }), true);
  }
  heavy(): void {
    const { f, g } = this;
    const t = this.target();
    if (f.busy || !t) return;
    this.lapse();
    f.act(new ClipSkill('cblock', 'gm_nod', (n) => {
      if (n === 'make' && !t.dead) g.addProjectile(new FallingBlock(g, f, t, 16, 0.8));
    }), true);
  }
  skill1(): void {
    this.heavy();
  }
  release(): void {}
  toggleFlare(): void {}
  formName(): string {
    return 'Clone';
  }
  abilities(): AbilityInfo[] {
    return [];
  }
  ai(): KitAI {
    return {
      reach: 3,
      chain: 1,
      ranged: true,
      moves: [
        { name: 'spike', use: () => this.attack(), min: 0, max: 22, weight: 2, cd: 2.2 },
        { name: 'block', use: () => this.heavy(), min: 2, max: 22, weight: 1, cd: 5 },
      ],
    };
  }
}

// ---------------------------------------------------------------------------------------------- the kit

export class GremmyKit implements Kit {
  comboIndex = 0;
  private lastEnd = 0;
  readonly cd = { hand: 0, bones: 0, arsenal: 0, terrain: 0, cube: 0, clone: 0, fort: 0, meteor: 0, space: 0, steel: 0, bombs: 0 };
  readonly clones: Fighter[] = [];
  steel = false;
  /** Imagined Strength: seconds in it (−1: not) */
  bulkT = -1;
  doubtT = 0;
  private bigHits: number[] = [];
  private meleeHits: number[] = [];
  private heals: { amount: number; at: number }[] = [];
  private metalCd = 0;
  private trapCd = 0;
  private domeCd = 0;
  arsenalNext = 0;
  terrainNext = 0;
  cube: WaterCube | null = null;
  fort: Fort | null = null;
  private made: Projectile[] = [];
  /** cookie bones: on whom, until when */
  readonly cookie = new Map<Fighter, number>();
  private focusOn: Fighter | null = null;
  private focusAt = 0;
  private wasDashing = false;
  private gone = false;
  private lastLine = -99;

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.data.quincy = true;
    f.parry = (amount, from, o) => this.parry(amount, from, o);
    f.onHurt = (dmg) => this.hurt(dmg);
    this.applyStats();
  }

  private line(text: string, every = 5, kanji = ''): void {
    if (this.g.time - this.lastLine < every) return;
    this.lastLine = this.g.time;
    this.g.callout(kanji, text, DREAM);
  }

  /** something he made, ended with him */
  private keep<T extends Projectile>(p: T): T {
    this.made.push(p);
    this.g.addProjectile(p);
    return p;
  }

  target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 60, this.f.forward(), 80) ?? this.g.nearestEnemy(this.f, 60);
  }

  // ---------------------------------------------------------------- passives

  /** the Metal Bar: a steel bar stands up between him and a blow (every 5 s) */
  private parry(amount: number, from: Fighter | null, o: DamageOpts): boolean {
    const { f, g } = this;
    if (!from || o.energy || this.metalCd > 0 || f.rei < 10 || from.pos.distanceTo(f.pos) > 4 || this.bulkT >= 0 || amount < 8) return false;
    this.metalCd = 5;
    f.rei -= 10;
    const dir = _v.subVectors(from.pos, f.pos).setY(0).normalize().clone();
    g.addProjectile(new MetalBarBlock(g, f.center().addScaledVector(dir, 0.7), dir));
    return true;
  }

  private hurt(dmg: number): void {
    const { f, g } = this;
    const from = f.lastHurt.from;
    // Doubt: low, and three big hits in a row
    if (dmg >= 30) {
      this.bigHits.push(g.time);
      this.bigHits = this.bigHits.filter((t) => g.time - t < 4);
      if (f.hp < f.maxHp * 0.35 && this.bigHits.length >= 3 && this.doubtT <= 0) {
        this.doubtT = 6;
        this.applyStats();
        g.callout('', "…Am I losing? I can't imagine that.", DREAM);
      }
    }
    // Already Healed: a big wound imagined away a moment later (a lapse when his focus runs low)
    if (dmg >= 45 && this.doubtT <= 0 && f.rei >= 20 && this.bulkT < 0) {
      f.rei -= 20;
      this.heals.push({ amount: dmg * 0.8, at: g.time + (f.rei < 60 ? 1.6 : 0.5) });
    }
    if (from && from !== f && from.pos.distanceTo(f.pos) < 4) {
      // the Blade Trap, in steel: the blade that cut him stays stuck in him
      if (this.steel && this.trapCd <= 0) {
        this.trapCd = 8;
        from.armLockT = Math.max(from.armLockT, 1.5);
        this.line('Your blade is stuck in me, you know.', 0);
      }
      // the Bladed Dome, in steel: two blows in a row raise it
      this.meleeHits.push(g.time);
      this.meleeHits = this.meleeHits.filter((t) => g.time - t < 1.5);
      if (this.steel && this.meleeHits.length >= 2 && this.domeCd <= 0) {
        this.domeCd = 10;
        this.keep(new BladedDome(g, f, 3, 10));
      }
    }
  }

  // ---------------------------------------------------------------- the frame

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    this.metalCd = Math.max(0, this.metalCd - dt);
    this.trapCd = Math.max(0, this.trapCd - dt);
    this.domeCd = Math.max(0, this.domeCd - dt);
    if (f.dead) {
      this.die();
      return;
    }
    if (this.doubtT > 0 && (this.doubtT -= dt) <= 0) {
      this.applyStats();
      this.line("No. I'll just imagine myself winning.", 0);
    }
    // Already Healed
    for (let i = this.heals.length - 1; i >= 0; i--) {
      const h = this.heals[i];
      if (g.time < h.at) continue;
      this.heals.splice(i, 1);
      if (this.doubtT > 0) continue;
      f.hp = Math.min(f.maxHp, f.hp + h.amount);
      dreamRipple(g, f.center(), 1.2);
      this.line("It's already healed. I imagined it.", 8);
    }
    // immeasurable reiryoku: his focus comes back fast while he holds nothing
    if (!f.action && this.made.length === 0 && !this.steel && this.bulkT < 0) f.rei = Math.min(f.maxRei, f.rei + dt * 12);
    // Steel Body: it costs focus to hold
    if (this.steel) {
      f.rei -= dt * 5;
      if (f.rei <= 0) this.toggleFlare();
    }
    // the clones
    for (let i = this.clones.length - 1; i >= 0; i--) {
      const c = this.clones[i];
      if (!g.fighters.includes(c) || c.dead) {
        if (g.fighters.includes(c)) this.pop(c);
        this.clones.splice(i, 1);
        this.applyStats();
      }
    }
    // attention: cookie bones on anyone he is not looking at wear off after a couple of seconds
    const t = this.target();
    if (t !== this.focusOn) {
      this.focusOn = t;
      this.focusAt = g.time;
    }
    for (const [e, until] of this.cookie) {
      const off = g.time > until || e.dead || (e !== this.focusOn && g.time - this.focusAt > 2);
      if (!off) continue;
      if (!e.dead) {
        e.disarmT = 0;
        e.slowT = 0;
      }
      this.cookie.delete(e);
    }
    // Imagined Step: the dash is a blink
    const dashing = f.dashT > 0;
    if (dashing && !this.wasDashing) this.blink();
    this.wasDashing = dashing;
    // Imagined Strength: past five seconds the body tears itself apart
    if (this.bulkT >= 0) {
      this.bulkT += dt;
      if (this.bulkT > 5) {
        g.drain(f, (f.maxHp * 0.08 * dt) / Math.max(0.1, f.damageTaken), null);
        if (Math.random() < dt * 6) {
          const c = f.center();
          g.engine.glow.spawn({ x: c.x + (Math.random() - 0.5), y: c.y + Math.random() * 0.6, z: c.z + (Math.random() - 0.5), vx: (Math.random() - 0.5) * 3, vy: 2, vz: (Math.random() - 0.5) * 3, size: 0.12, sizeEnd: 0.03, life: 0.5, r: 0.8, g: 0.1, b: 0.12, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, gravity: 6 });
        }
      }
    }
    for (let i = this.made.length - 1; i >= 0; i--) if (this.made[i].done) this.made.splice(i, 1);
    if (this.cube?.done) this.cube = null;
  }

  /** Imagined Step: a blink along the dash; it stops short of walls */
  private blink(): void {
    const { f, g } = this;
    const d = f.dashDir.clone().setY(0);
    if (d.lengthSq() < 0.01) return;
    d.normalize();
    const c = f.center();
    const hit = raycastVoxels(g.engine.world, c.x, c.y, c.z, d.x, 0, d.z, 6.5);
    const go = hit ? Math.max(0, hit.dist - 0.6) : 6;
    dreamRipple(g, c, 1.2);
    f.body.pos.addScaledVector(d, go);
    f.body.prev.copy(f.body.pos);
    f.dashT = 0;
    f.push.set(0, 0, 0);
    f.invuln = Math.max(f.invuln, 0.15);
    dreamRipple(g, f.center(), 1.2);
    g.sfx.play('shunpo', f.center(), 0.5);
  }

  /** he dies: everything he imagined goes with him, the body crumbles, the brain capsule drops out */
  private die(): void {
    if (this.gone) return;
    this.gone = true;
    const { f, g } = this;
    for (const p of this.made) {
      if (p instanceof Meteor) continue; // the meteor stays: he imagined it able to
      if (p instanceof LavaField) p.cool();
      else p.done = true;
    }
    if (this.fort) crumbleFort(g, this.fort);
    this.fort = null;
    for (const c of [...this.clones]) this.pop(c);
    this.clones.length = 0;
    const head = f.visual.rig.sockets.get('brain');
    const at = head ? head.getWorldPosition(new THREE.Vector3()) : f.center();
    g.addProjectile(new BrainCapsule(g, at));
    g.addProjectile(new Timeline([[0.4, () => { f.visual.object.visible = false; }]]));
    for (let i = 0; i < 24; i++) {
      const c = f.center();
      g.engine.dust.spawn({ x: c.x + (Math.random() - 0.5) * 0.6, y: c.y + (Math.random() - 0.5) * 1.4, z: c.z + (Math.random() - 0.5) * 0.6, vx: (Math.random() - 0.5) * 2, vy: 1 + Math.random() * 2, vz: (Math.random() - 0.5) * 2, size: 0.3, sizeEnd: 0.8, life: 1.2, r: 0.9, g: 0.92, b: 1, alpha: 0.6, alphaEnd: 0, tex: TEX_PUFF });
    }
  }

  private pop(c: Fighter): void {
    const g = this.g;
    dreamRipple(g, c.center(), 1.4);
    c.hp = 0;
    c.dead = true;
    c.stopAction();
    g.remove(c);
  }

  // ---------------------------------------------------------------- LMB: not a single finger

  attack(): void {
    const { f, g } = this;
    if (this.bulkT >= 0) {
      this.bulkAttack();
      return;
    }
    const cur = f.action;
    if (cur instanceof WillAction && GREMMY_CHAIN.includes(cur.clip)) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (g.time - this.lastEnd > 0.9) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const { f, g } = this;
    const idx = i % GREMMY_CHAIN.length;
    const clip = GREMMY_CHAIN[idx];
    this.comboIndex = idx + 1;
    this.lastEnd = g.time + 0.7;
    f.act(new WillAction(this, clip, idx, (n) => {
      if (n !== 'make') return;
      const t = this.target();
      const at = t ? t.pos.clone() : f.pos.clone().addScaledVector(f.forward(), 6);
      if (idx === 0) {
        at.y = floorAt(g, at);
        g.addProjectile(new StoneSpike(g, f, at, 14));
      } else if (idx === 1) {
        if (t) g.addProjectile(new SteelBar(g, f, t, 16));
      } else if (idx === 2) {
        if (t) g.addProjectile(new FallingBlock(g, f, t, 20));
      } else {
        // a column out of the ground beside them, shot level through them
        const d = t ? _v.subVectors(t.pos, f.pos).setY(0).normalize().clone() : f.forward();
        const side = new THREE.Vector3(-d.z, 0, d.x).multiplyScalar(Math.random() < 0.5 ? 1 : -1);
        const tc = t ? t.center() : at.setY(at.y + 1);
        g.addProjectile(new PillarRam(g, f, tc.clone().addScaledVector(side, 6.5), side.clone().negate(), 24, 0, 9));
      }
    }, () => this.chain(idx + 1)), true);
  }

  /** Imagined Strength's own blows: huge swings */
  private bulkAttack(): void {
    const { f, g } = this;
    const cur = f.action;
    if (cur instanceof WillAction && BULK_CHAIN.includes(cur.clip)) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (g.time - this.lastEnd > 0.9) this.comboIndex = 0;
    this.bulkChain(this.comboIndex);
  }

  private bulkChain(i: number): void {
    const { f, g } = this;
    const idx = i % BULK_CHAIN.length;
    this.comboIndex = idx + 1;
    this.lastEnd = g.time + 0.7;
    const clip = BULK_CHAIN[idx];
    f.act(new WillAction(this, clip, idx, (n) => {
      if (n !== 'hit') return;
      const fw = f.forward();
      for (const e of g.enemiesOf(f)) {
        if (e.dead) continue;
        _v.subVectors(e.pos, f.pos).setY(0);
        const d = _v.length();
        if (d > 3 + e.def.radius || (d > 0.4 && _v.normalize().dot(fw) < 0.2)) continue;
        g.damage(e, idx === 2 ? 60 : 30, f, fw, { knock: idx === 2 ? 26 : 14, launch: idx === 2 ? 6 : 2, heavy: true, hitstop: 0.12, shake: 0.5 });
      }
      if (idx === 2) g.groundImpact(f.pos.clone().addScaledVector(fw, 1.8), 2.4, 1200, '#9A9182', f);
    }, () => this.bulkChain(idx + 1)), true);
  }

  // ---------------------------------------------------------------- the moves

  private special(a: FighterAction, cost: number, cdKey: keyof typeof this.cd, cd: number): boolean {
    const f = this.f;
    if (this.cd[cdKey] > 0) return false;
    if (f.action && !f.action.canCancel(a)) return false;
    if (f.hitstun > 0 || f.dead) return false;
    if (!f.spendRei(cost)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough focus');
      return false;
    }
    this.cd[cdKey] = cd;
    f.act(a, true);
    return true;
  }

  /** RMB: the giant stone hand; close in, Cookie Bones */
  heavy(): void {
    const { f, g } = this;
    if (this.bulkT >= 0) {
      this.bulkAttack();
      return;
    }
    const t = this.target();
    if (t && t.pos.distanceTo(f.pos) < 3.5) {
      this.special(new ClipSkill('bones', 'gm_tilt', (n) => {
        if (n !== 'make' || t.dead) return;
        // "…cookies. No — rakugan." Their bones turn to dry sweets: the arms snap (the weapon drops), the legs buckle
        t.disarmT = Math.max(t.disarmT, 5);
        t.slow(0.5, 5);
        this.cookie.set(t, g.time + 5);
        g.damage(t, 18, f, _v.subVectors(t.pos, f.pos).setY(0).normalize().clone(), { knock: 1, unblockable: true, hitstop: 0.06 });
        g.callout('', 'Cookies… no — rakugan.', DREAM);
        const c = t.center();
        for (let i = 0; i < 14; i++) {
          const pal = [[1, 0.8, 0.85], [0.85, 1, 0.85], [1, 0.95, 0.75], [0.85, 0.85, 1]][i % 4];
          g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: (Math.random() - 0.5) * 3, vy: Math.random() * 3, vz: (Math.random() - 0.5) * 3, size: 0.12, sizeEnd: 0.08, life: 0.9, r: pal[0], g: pal[1], b: pal[2], alpha: 1, alphaEnd: 0, tex: TEX_GLOW, gravity: 6 });
        }
      }, { mobility: 0.3 }), 26, 'bones', 9);
      return;
    }
    this.special(new ClipSkill('hand', 'gm_nod', (n) => {
      const tg = this.target();
      if (n === 'make' && tg) g.addProjectile(new StoneHand(g, f, tg, 60));
    }, { mobility: 0.3 }), 30, 'hand', 6);
  }

  /** Q: the arsenal — the firearm ring, then the missile salvo */
  skill1(): void {
    const { f, g } = this;
    if (this.bulkT >= 0) return;
    const missiles = this.arsenalNext === 1;
    if (this.special(new ClipSkill('arsenal', 'gm_spread', (n) => {
      if (n !== 'make') return;
      const t = this.target();
      if (missiles) {
        if (t) g.addProjectile(new MissileSalvo(g, f, t, 8 + this.clones.length * 2, 22));
      } else g.addProjectile(new FirearmRing(g, f, () => this.target(), 1.6, 3, 12));
    }, { mobility: 0.4 }), 25, 'arsenal', 6)) this.arsenalNext = 1 - this.arsenalNext;
  }

  /** E: the terrain — the lava surge, then the pillar rams */
  skill2(): void {
    const { f, g } = this;
    if (this.bulkT >= 0) return;
    const rams = this.terrainNext === 1;
    if (this.special(new ClipSkill('terrain', 'gm_down', (n) => {
      if (n !== 'make') return;
      const t = this.target();
      if (!rams) {
        // the lava wells up round him and rolls out at them, the floor melting under it
        g.callout('', 'This lava came out of my head.', DREAM);
        const d = t ? _v.subVectors(t.pos, f.pos).setY(0).normalize().clone() : f.forward();
        const steps: [number, () => void][] = [];
        for (let i = 0; i < 5; i++) {
          const at = f.pos.clone().addScaledVector(d, 2 + i * 4);
          steps.push([i * 0.22, () => { if (!f.dead) this.keep(new LavaField(g, f, at, 3.2, 6, 14)); }]);
        }
        g.addProjectile(new Timeline(steps));
      } else if (t) {
        // columns out of the ground all round them, converging
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + Math.random() * 0.4;
          const from = t.center().add(_w.set(Math.cos(a) * 7, -0.2, Math.sin(a) * 7));
          g.addProjectile(new PillarRam(g, f, from, t.center().sub(from), 20, i * 0.08, 8.5));
        }
      }
    }, { mobility: 0.3 }), 30, 'terrain', 8)) this.terrainNext = 1 - this.terrainNext;
  }

  /** R: the water cube round them; again, while it holds them, the crevice */
  skill3(): void {
    const { f, g } = this;
    if (this.bulkT >= 0) return;
    const t = this.target();
    if (this.cube && !this.cube.done && this.cube.state === 'held') {
      if (!f.spendRei(20)) return;
      f.act(new ClipSkill('crevice', 'gm_down', (n) => {
        if (n === 'make' && this.cube?.crevice()) g.callout('', 'Buried. Dig, if you can.', DREAM);
      }), true);
      return;
    }
    if (!t || t.pos.distanceTo(f.pos) > 30) return;
    this.special(new ClipSkill('cube', 'gm_tilt', (n) => {
      if (n !== 'make' || t.dead) return;
      this.cube = this.keep(new WaterCube(g, f, t, 5, 8, 4));
      g.callout('', 'That air was underwater all along.', DREAM);
    }, { mobility: 0.3 }), 25, 'cube', 4);
  }

  /** G: a clone (each one doubles what he can imagine); with three out, the clone bombs */
  toggle(): void {
    const { f, g } = this;
    if (this.bulkT >= 0) return;
    if (this.clones.length >= MAX_CLONES) {
      this.cloneBombs();
      return;
    }
    this.special(new ClipSkill('clone', 'gm_split', (n) => {
      if (n !== 'make') return;
      const side = new THREE.Vector3(-f.forward().z, 0, f.forward().x).multiplyScalar(this.clones.length % 2 === 0 ? 1.8 : -1.8);
      const at = f.pos.clone().add(side).add(_v.set(0, 0.2, 0));
      const c = g.spawn({ ...GREMMY_DEF, id: 'gremmy-clone', name: 'Gremmy (clone)', hp: 260, rei: 60 }, at, f.team);
      c.yaw = f.yaw;
      const kit = new GremmyCloneKit(c, g, this);
      g.controllers.push(new DuelistAI(g, c, kit, { aggression: 0.5, intro: 0.2 }));
      this.clones.push(c);
      dreamRipple(g, c.center(), 1.6);
      this.applyStats();
      g.callout('', this.clones.length === 1 ? 'Bunshin. Twice the imagination.' : `Bunshin. ${this.clones.length + 1} of me.`, DREAM);
    }, { mobility: 0.3 }), 40, 'clone', 6);
  }

  /** the clone bombs: a bomb on every clone's chest; they run in, grab, and go off */
  private cloneBombs(): void {
    const { f, g } = this;
    const t = this.target();
    if (!t) return;
    this.special(new ClipSkill('bombs', 'gm_spread', (n) => {
      if (n !== 'make') return;
      g.callout('', 'Go on, all of you.', DREAM);
      for (const c of this.clones) {
        c.visual.attach('bomb', gremmyProp('bomb'), 'chest.front');
        const kit = c.data.kit as GremmyCloneKit;
        kit.bomb = true;
        c.stopAction();
        let tt = 0;
        g.addProjectile({
          done: false,
          update(dt: number, gg: Game) {
            if (this.done) return;
            tt += dt;
            if (c.dead || !gg.fighters.includes(c)) { this.done = true; return; }
            const to = _v.subVectors(t.pos, c.pos).setY(0);
            const d = to.length();
            if (d > 1.2 && tt < 2.5) {
              c.body.pos.addScaledVector(to.normalize(), Math.min(d, 16 * dt));
              c.yaw = Math.atan2(to.x, to.z);
              return;
            }
            // it grabs on and goes off
            this.done = true;
            const at = c.center();
            for (const e of gg.enemiesOf(f)) {
              if (e.dead || e.center().distanceTo(at) > 2.5 + e.def.radius) continue;
              gg.damage(e, 30, f, _w.subVectors(e.pos, at).setY(0).normalize().clone(), { knock: 18, launch: 6, heavy: true, hitstop: 0.12, shake: 0.6 });
            }
            gg.engine.destruction.carve(new SphereShape(at, 2, 0.6), { mode: 'explode', power: 900, impulse: 14, dust: 0.8 });
            gg.groundImpact(at, 2.5, 900, '#E0703A', f);
            gg.sfx.play('explode', at, 1);
            c.hp = 0;
            c.dead = true;
          },
          dispose() {},
        });
      }
    }, { mobility: 0.3 }), 30, 'bombs', 12);
  }

  /** F: the Stone Fort / the meteor / outer space, by clones; near death, Imagined Strength (F again lets go) */
  release(): void {
    const { f, g } = this;
    if (this.bulkT >= 0) {
      this.letGo();
      return;
    }
    if (f.hp < f.maxHp * 0.25 && this.cd.steel <= 0) {
      this.imagineStrength();
      return;
    }
    const t = this.target();
    const n = this.clones.length;
    if (n === 0) {
      if (this.fort) {
        if (f === g.player) g.hud?.showBanner('The fort stands');
        return;
      }
      this.special(new ClipSkill('fort', 'gm_raise', (e) => {
        if (e !== 'make') return;
        this.fort = raiseFort(g, f.pos.clone(), 11, 6);
        g.callout('', "Somewhere nicer. I'll make us a fort.", DREAM);
      }, { mobility: 0 }), 60, 'fort', 40);
    } else if (n === 1) {
      if (!t) return;
      this.special(new ClipSkill('meteor', 'gm_raise', (e) => {
        if (e !== 'make' || t.dead) return;
        const at = t.pos.clone();
        at.y = floorAt(g, at);
        this.keep(new Meteor(g, f, at, 180, 3));
        g.callout('隕石', 'Inseki.', DREAM);
      }, { mobility: 0 }), 70, 'meteor', 25);
    } else {
      if (!t) return;
      this.special(new ClipSkill('space', 'gm_raise', (e) => {
        if (e !== 'make' || t.dead) return;
        this.keep(new OuterSpace(g, f, t.center(), 4, 6, 20));
        g.callout('宇宙', 'Uchū. Try breathing.', DREAM);
      }, { mobility: 0 }), 50, 'space', 15);
    }
  }

  /** Imagined Strength: a body as strong as the strongest he has faced — more than his own body can hold */
  private imagineStrength(): void {
    const { f, g } = this;
    if (f.busy && !(f.action instanceof WillAction)) return;
    f.act(new ClipSkill('swell', 'gm_swell', (n) => {
      if (n !== 'swell') return;
      this.bulkT = 0;
      this.steel = false;
      f.def = { ...f.def, stance: BULK_STANCE, clips: BULK_CLIPS, speed: { ...SPEED_BULK } };
      f.setForm({ asset: gremmyAsset('bulk'), props: [] }, AURA_BULK);
      f.aura.flare(2, 0.8);
      g.callout('', 'I imagined myself stronger than you.', '#F2B8C0');
      g.sfx.play('roarBig', f.center(), 0.7);
      if (g.player && g.player.pos.distanceTo(f.pos) < 20) g.shake(0.5);
      this.applyStats();
    }, { armor: 0.6, mobility: 0 }), true);
  }

  private letGo(): void {
    const { f, g } = this;
    this.bulkT = -1;
    this.cd.steel = 20;
    f.def = { ...f.def, stance: GREMMY_STANCE, clips: GREMMY_CLIPS, speed: { ...SPEED } };
    f.setForm({ asset: gremmyAsset(this.steel ? 'steel' : 'base'), props: [] }, AURA_GREMMY);
    dreamRipple(g, f.center(), 1.6);
    this.applyStats();
  }

  /** V: Steel Body */
  toggleFlare(): void {
    const { f, g } = this;
    if (this.bulkT >= 0) return;
    this.steel = !this.steel;
    f.setForm({ asset: gremmyAsset(this.steel ? 'steel' : 'base'), props: [] }, AURA_GREMMY);
    if (this.steel) {
      dreamRipple(g, f.center(), 1.4);
      g.sfx.play('ting', f.center(), 0.8);
      this.line('Harder than any steel. Go ahead.', 3);
    }
    this.applyStats();
  }

  private applyStats(): void {
    const f = this.f;
    const t = this.target();
    // he cannot imagine beating His Majesty
    const yhwach = t?.def.id === 'yhwach' ? 0.5 : 1;
    f.power = (this.bulkT >= 0 ? 2.6 : 1 + 0.25 * this.clones.length) * yhwach;
    const doubt = this.doubtT > 0;
    f.damageTaken = this.steel ? (doubt ? 0.6 : 0.35) : 0.9;
    f.toughness = this.steel ? (doubt ? 15 : 30) : this.bulkT >= 0 ? 10 : 4;
    f.knockTaken = this.steel ? 0.3 : 1;
    f.aura.target = this.bulkT >= 0 ? 0.45 : this.steel ? 0.2 : 0.06;
  }

  formName(): string {
    const c = this.clones.length ? ` · ${this.clones.length} clone${this.clones.length > 1 ? 's' : ''}` : '';
    if (this.bulkT >= 0) return `Imagined Strength · ${this.bulkT.toFixed(0)} s`;
    return `Sternritter "V" — The Visionary${this.steel ? ' · Steel Body' : ''}${this.doubtT > 0 ? ' · Doubt' : ''}${c}`;
  }

  ai(): KitAI {
    const f = this.f;
    const hpK = () => f.hp / f.maxHp;
    const bulk = () => this.bulkT >= 0;
    const calm = () => this.bulkT < 0;
    return {
      reach: 2,
      chain: 4,
      // he keeps his distance and lets his imagination do it
      ranged: () => this.bulkT < 0,
      moves: [
        { name: 'fort', use: () => this.release(), min: 0, max: 14, weight: 4, cd: 30, when: () => calm() && this.clones.length === 0 && !this.fort && hpK() > 0.6 },
        { name: 'lava', use: () => this.skill2(), min: 4, max: 20, weight: 2.6, cd: 6, when: calm },
        { name: 'cube', use: () => this.skill3(), min: 2, max: 25, weight: 2.6, cd: 6, when: () => calm() && !this.cube },
        { name: 'crevice', use: () => this.skill3(), min: 0, max: 40, weight: 6, cd: 1, when: () => calm() && !!this.cube && this.cube.state === 'held' && (this.cube as WaterCube) !== null },
        { name: 'hand', use: () => this.heavy(), min: 3.6, max: 30, weight: 2.4, cd: 5, when: calm },
        { name: 'bones', use: () => this.heavy(), min: 0, max: 3.4, weight: 3, cd: 8, when: calm },
        { name: 'arsenal', use: () => this.skill1(), min: 4, max: 32, weight: 2.4, cd: 6, when: () => calm() && hpK() < 0.9 },
        { name: 'steel', use: () => this.toggleFlare(), min: 0, max: 8, weight: 3, cd: 12, when: () => calm() && !this.steel && f.rei > 80 },
        { name: 'unsteel', use: () => this.toggleFlare(), min: 6, max: 60, weight: 1, cd: 10, when: () => calm() && this.steel && f.rei < 60 },
        { name: 'clone', use: () => this.toggle(), min: 0, max: 40, weight: 3.4, cd: 7, when: () => calm() && hpK() < 0.7 && this.clones.length < MAX_CLONES },
        { name: 'bombs', use: () => this.toggle(), min: 2, max: 25, weight: 3, cd: 14, when: () => calm() && this.clones.length >= MAX_CLONES },
        { name: 'cosmic', use: () => this.release(), min: 4, max: 40, weight: 4, cd: 12, when: () => calm() && this.clones.length >= 1 && hpK() > 0.25 },
        { name: 'strength', use: () => this.release(), min: 0, max: 30, weight: 6, cd: 20, when: () => calm() && hpK() < 0.25 && this.cd.steel <= 0 },
        { name: 'letgo', use: () => this.release(), min: 0, max: 60, weight: 9, cd: 2, when: () => bulk() && this.bulkT > 4.6 },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    const t = this.target();
    const near = !!t && t.pos.distanceTo(this.f.pos) < 3.5;
    const n = this.clones.length;
    if (this.bulkT >= 0) {
      return [
        { key: 'LMB', name: 'Crushing Blows', kanji: '剛' },
        { key: 'F', name: 'Let Go', kanji: '解', active: true, timer: Math.max(0, 1 - this.bulkT / 8) },
        { key: 'Shift', name: 'Imagined Step', kanji: '夢歩' },
      ];
    }
    return [
      { key: 'LMB', name: 'Not a Finger', kanji: '想' },
      { key: 'RMB', name: near ? 'Cookie Bones' : 'Giant Stone Hand', kanji: near ? '落雁' : '石掌', cost: near ? 26 : 30, cd: near ? cd.bones : cd.hand, cdMax: near ? 9 : 6, tint: DREAM },
      { key: 'Q', name: this.arsenalNext ? 'Missile Salvo' : 'Firearm Ring', kanji: '銃', cost: 25, cd: cd.arsenal, cdMax: 6, tint: DREAM },
      { key: 'E', name: this.terrainNext ? 'Pillar Rams' : 'Lava Surge', kanji: this.terrainNext ? '石柱' : '溶岩', cost: 30, cd: cd.terrain, cdMax: 8, tint: DREAM },
      { key: 'R', name: this.cube && this.cube.state === 'held' ? 'Crevice' : 'Water Cube', kanji: '水', cost: this.cube ? 20 : 25, cd: cd.cube, cdMax: 4, tint: DREAM },
      { key: 'G', name: n >= MAX_CLONES ? 'Clone Bombs' : `Clone (${n})`, kanji: '分身', cost: n >= MAX_CLONES ? 30 : 40, cd: n >= MAX_CLONES ? cd.bombs : cd.clone, cdMax: n >= MAX_CLONES ? 12 : 6, active: n > 0, tint: DREAM },
      { key: 'F', name: this.f.hp < this.f.maxHp * 0.25 ? 'Imagined Strength' : n === 0 ? 'Stone Fort' : n === 1 ? 'Meteor' : 'Outer Space', kanji: n === 0 ? '石砦' : n === 1 ? '隕石' : '宇宙', cost: n === 0 ? 60 : n === 1 ? 70 : 50, cd: n === 0 ? cd.fort : n === 1 ? cd.meteor : cd.space, cdMax: n === 0 ? 40 : n === 1 ? 25 : 15, tint: DREAM },
      { key: 'V', name: 'Steel Body', kanji: '鋼', active: this.steel },
      { key: 'Shift', name: 'Imagined Step', kanji: '夢歩' },
    ];
  }
}
