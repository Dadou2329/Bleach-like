// Orihime Inoue's kit (docs/roster/A2-karakura-allies.md §2, Kit proposal): the healer and defender of
// Ichigo's group, with the karate Tatsuki taught her and the six fairies of Shun Shun Rikka.
// LMB: a jab, a palm thrust, a front kick, and both palms driven out behind a small triangle that shoves.
// RMB Koten Zanshun — Tsubaki streaks at the enemy and splits what lies on his path; an enemy caught mid-swing
// may swat him and smash him (her doubt weakens him), and he stays broken until Sōten Kisshun mends him.
// Q Santen Kesshun — the golden triangle before her turns aside whatever strikes its face, shots die on it,
// until it has taken too much. E Sōten Kisshun — a dome over her in which what happened is undone: her
// wounds close, Tsubaki is mended, and the ground and the buildings round her are put back the way they
// were, voxel by voxel (the falling pieces vanish as their voxels return); reiatsu refills slowly, and an
// enemy close by (thick foreign reiatsu) halves it. R Shiten Kōshun — Tsubaki at the heart of a triangle:
// the first blow on it is fired back down its own path. G Resolve — "I reject": a golden pulse undoes enemy
// shots and fields round her; while it holds, the shields are stronger, Sōten heals faster and wider, and
// Tsubaki cuts deep and cannot be swatted (reiatsu drains). V the reiatsu flare.
// F Rokuten Shishun [TYBW anime only]: the six circle her trailing crimson and turn aside what is fired at
// her, the red energy wraps her and her blows grow strong; F again is the Rejection — she rushes in and lays
// her palm on the enemy: heavy damage, and its power is rejected (no releases or states, its strength cut)
// for a while. When the crimson fades she is spent: she sinks to her knees with no reiatsu left.
import * as THREE from 'three';
import { FighterAction, type Fighter, type FighterDef } from '../fighter';
import type { DamageOpts, Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { orihimeAsset } from '../../chars/orihime';
import { ORIHIME_CHAIN, ORIHIME_CLIPS, ORIHIME_STANCE } from '../../chars/orihimeClips';
import { KotenZanshun, RIKKA_GOLD, ROKUTEN_RED, RokutenOrbit, SantenKesshun, ShitenKoshun, SotenKisshun, crimsonRejection, rejectPulse, restoreMotes, rikkaSparks, socketPos } from '../../vfx/rikka';
import { CapsuleShape, SphereShape } from '../../destruction/shapes';
import { groundAt } from '../../vfx/iceArts';
import { TEX_GLOW } from '../../vfx/sprites';
import type { AuraStyle } from '../../vfx/aura';

export const AURA_ORIHIME: AuraStyle = { core: '#FFF4D8', body: '#FFD98A', rim: '#B07A2A' };
/** Rokuten Shishun: crimson, a pink glow */
export const AURA_ROKUTEN: AuraStyle = { core: '#FBCFF3', body: '#E73D60', rim: '#8C1521' };

const SPEED = { run: 8.8, sprint: 22, jump: 12, dash: 22, dashTime: 0.1 };
const GOLD = '#FFC94A';
/** Rokuten Shishun lasts this long, then she is spent */
const ROKUTEN_TIME = 18;

export const ORIHIME_DEF: FighterDef = {
  id: 'orihime',
  name: 'Orihime Inoue',
  title: 'Shun Shun Rikka',
  build: () => ({ asset: orihimeAsset('hueco'), props: [] }),
  stance: ORIHIME_STANCE,
  clips: ORIHIME_CLIPS,
  aura: AURA_ORIHIME,
  hp: 920,
  rei: 260,
  speed: { ...SPEED },
  radius: 0.36,
  height: 1.57,
};

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

function bonePos(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const rig = f.visual.rig;
  const s = rig.sockets.get(name);
  if (s) {
    s.updateWorldMatrix(true, false);
    return s.getWorldPosition(out);
  }
  const i = rig.index(name);
  if (i < 0) return f.center(out);
  rig.bones[i].updateWorldMatrix(true, false);
  return rig.bones[i].getWorldPosition(out);
}

// ---------------------------------------------------------------------------------------------- the string

interface StrikeSpec {
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

const STRIKES: Record<string, StrikeSpec> = {
  or_jab: { damage: 9, knock: 4, reach: 0.85, height: 1.25, radius: 0.62, lunge: 5, limb: 'fist.L' },
  or_palm: { damage: 12, knock: 9, reach: 0.9, height: 1.2, radius: 0.66, lunge: 5.5, limb: 'palm.R' },
  or_kick: { damage: 14, knock: 8, launch: 2, reach: 0.95, height: 0.9, radius: 0.72, lunge: 5, limb: 'foot.R' },
  or_bash: { damage: 22, knock: 18, launch: 3, heavy: true, reach: 1.25, height: 1.1, radius: 1.0, lunge: 4, limb: 'palm.R' },
};

class StrikeAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private hitAt = 0;
  private struck = false;
  private hits = new Set<number>();
  queued = false;

  constructor(readonly kit: OrihimeKit, readonly clip: string, readonly index: number) {
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
    const s = STRIKES[this.clip];
    if (this.clip === 'or_jab') this.kit.hands(true);
    f.anim.play(this.clip, {
      fadeIn: 0.03,
      onEvent: (n) => {
        if (n === 'step') {
          const tgt = f.faceTarget;
          const extra = tgt ? Math.min(4, Math.max(0, f.pos.distanceTo(tgt) - 1.3)) : 0;
          f.push.addScaledVector(f.forward(), s.lunge + extra * 4);
          g.sfx.play('swing', f.center(), 0.6);
        }
        // the finisher: a small triangle bursts from her palms
        if (n === 'fx') this.kit.palmTriangle();
      },
    });
  }

  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const s = STRIKES[this.clip];
    if (!this.struck && this.t >= this.hitAt) {
      this.struck = true;
      this.kit.strike(s, this.hits);
    }
    if (this.queued && this.t >= this.comboAt && this.index < ORIHIME_CHAIN.length - 1) {
      this.done = true;
      this.kit.chain(this.index + 1);
      return;
    }
    if (this.t >= this.dur) this.done = true;
  }

  override end(): void {
    if (this.clip === 'or_jab') this.kit.hands(false);
  }

  override canCancel(next: FighterAction): boolean {
    if (next.name === 'dash' || next instanceof SkillAction) return this.t >= this.hitAt + 0.02;
    return false;
  }
}

abstract class SkillAction extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: OrihimeKit) {
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

/** RMB: Koten Zanshun — the right hand to its pin, then flung at the enemy */
class KotenAction extends SkillAction {
  readonly name = 'koten';
  constructor(kit: OrihimeKit) {
    super(kit);
    this.mobility = 0.25;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'or_koten', (n) => {
      if (n === 'fx') this.kit.launchTsubaki();
    });
    g.callout('孤天斬盾', 'KOTEN ZANSHUN', GOLD);
  }
  override canCancel(next: FighterAction): boolean {
    return this.t > 0.28 && (next.name === 'dash' || next instanceof SkillAction);
  }
}

/** Q: Santen Kesshun — fingers to the pins, both palms out */
class SantenAction extends SkillAction {
  readonly name = 'santen';
  constructor(kit: OrihimeKit) {
    super(kit);
    this.mobility = 0.35;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'or_santen', (n) => {
      if (n === 'fx') this.kit.raiseSanten();
    });
    g.callout('三天結盾', 'SANTEN KESSHUN', GOLD);
  }
  override canCancel(next: FighterAction): boolean {
    return this.t > 0.22;
  }
}

/** E: Sōten Kisshun — the dome over her; held until it ends, she moves, or a heavy blow breaks it off */
class SotenAction extends SkillAction {
  readonly name = 'soten';
  private tick = 0;
  constructor(kit: OrihimeKit) {
    super(kit);
    this.mobility = 0;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'or_soten', (n) => {
      if (n === 'fx') this.kit.raiseSoten();
    });
    g.callout('双天帰盾', 'SŌTEN KISSHUN', GOLD);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const dome = this.kit.dome;
    if (!dome) return;
    if (dome.closing) {
      this.done = true;
      return;
    }
    // the rejection of what happened: her wounds close, Tsubaki is put back together
    const near = g.enemiesOf(f).some((o) => !o.dead && o.pos.distanceTo(f.pos) < 4.5);
    const rate = (this.kit.resolve ? 54 : 36) * (near ? 0.5 : 1);
    f.hp = Math.min(f.maxHp, f.hp + rate * dt);
    f.rei = Math.min(f.maxRei, f.rei + 4 * dt);
    this.tick += dt;
    if (this.tick > 0.5) {
      this.tick = 0;
      dome.pulse();
      if (this.kit.tsubakiBroken && dome.t > 0.8) this.kit.mendTsubaki();
      // allies under the dome are healed as well
      for (const o of g.fighters) if (o !== f && !o.dead && o.team === f.team && dome.inside(o.center(_v))) o.hp = Math.min(o.maxHp, o.hp + rate * 0.5);
    }
  }
  override end(): void {
    this.kit.dome?.close();
  }
  override canCancel(next: FighterAction): boolean {
    return this.t > 0.45 && next.name !== 'soten';
  }
}

/** R: Shiten Kōshun */
class ShitenAction extends SkillAction {
  readonly name = 'shiten';
  constructor(kit: OrihimeKit) {
    super(kit);
    this.mobility = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'or_shiten', (n) => {
      if (n === 'fx') this.kit.raiseShiten();
    });
    g.callout('四天抗盾', 'SHITEN KŌSHUN', '#FFB347');
  }
  override canCancel(next: FighterAction): boolean {
    return this.t > 0.26;
  }
}

/** G: Resolve */
class ResolveAction extends SkillAction {
  readonly name = 'resolve';
  constructor(kit: OrihimeKit, readonly on: boolean) {
    super(kit);
    this.mobility = 0.3;
  }
  override start(f: Fighter): void {
    this.playClip(f, 'or_resolve', (n) => {
      if (n === 'fx') this.kit.setResolve(this.on);
    }, this.on ? 1 : 1.6);
  }
  override canCancel(): boolean {
    return this.t > 0.55;
  }
}

/** F: Rokuten Shishun */
class RokutenAction extends SkillAction {
  readonly name = 'rokuten';
  constructor(kit: OrihimeKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.6;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'or_rokuten', (n) => {
      if (n === 'gather') {
        f.aura.flare(1.6, 1);
        g.sfx.play('charge', f.center(), 0.9);
      }
      if (n === 'burst') this.kit.enterRokuten();
    });
    g.callout('六天死盾', 'ROKUTEN SHISHUN', '#E73D60');
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    // blood-red motes drawn in to her before the burst
    if (this.t < 0.85) {
      const c = f.center(_v);
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2, r = 1.5 + Math.random() * 2;
        const life = 0.4;
        g.engine.glow.spawn({ x: c.x + Math.cos(a) * r, y: c.y + (Math.random() - 0.3) * 2, z: c.z + Math.sin(a) * r, vx: -Math.cos(a) * r / life, vy: 0, vz: -Math.sin(a) * r / life, size: 0.14, sizeEnd: 0.05, life, r: 1.8, g: 0.3, b: 0.5, alpha: 0.3, alphaEnd: 1, tex: TEX_GLOW });
      }
    }
  }
}

/** F in Rokuten Shishun: the Rejection — a rush, one palm laid on the enemy */
class RejectAction extends SkillAction {
  readonly name = 'reject';
  private touched = false;
  constructor(kit: OrihimeKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.8;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'or_reject', (n) => {
      if (n === 'step') {
        const t = this.kit.target();
        if (t) {
          const d = Math.max(0, t.pos.distanceTo(f.pos) - 1.0);
          f.push.addScaledVector(_v.subVectors(t.pos, f.pos).setY(0).normalize(), Math.min(40, 6 + d * 7));
        }
        g.sfx.play('shunpo', f.center(), 0.8);
      }
      if (n === 'hit' && !this.touched) {
        this.touched = true;
        this.kit.touchReject();
      }
    });
    g.callout('拒絶', 'I REJECT', '#E73D60');
  }
  override end(): void {
    if (this.touched) this.kit.endRokuten();
  }
}

/** the crimson gone: spent, she sinks down and cannot act */
class SpentAction extends SkillAction {
  readonly name = 'spent';
  constructor(kit: OrihimeKit) {
    super(kit);
    this.mobility = 0;
  }
  override start(f: Fighter): void {
    this.playClip(f, 'or_spent', () => {});
  }
}

// ---------------------------------------------------------------------------------------------- the kit

export class OrihimeKit implements Kit {
  comboIndex = 0;
  flare = false;
  /** G: her resolve — conviction makes every technique stronger */
  resolve = false;
  readonly cd = { heavy: 0, santen: 0, soten: 0, shiten: 0, resolve: 0, rokuten: 0, reject: 0 };
  santen: SantenKesshun | null = null;
  shiten: ShitenKoshun | null = null;
  dome: SotenKisshun | null = null;
  tsubaki: KotenZanshun | null = null;
  /** Tsubaki was smashed: no Koten Zanshun or Shiten Kōshun until Sōten Kisshun mends him */
  tsubakiBroken = false;
  orbit: RokutenOrbit | null = null;
  /** Rokuten Shishun: the time left */
  rokutenT = 0;
  private lastEnd = 0;
  /** a restoration under way: the log entries (nearest first), how far it has reached */
  private restore: { list: number[]; dist: Float32Array; i: number; radius: number; t: number; dur: number } | null = null;

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.def = { ...f.def, speed: { ...SPEED } };
    this.hands(false);
    f.parry = (amount, from, o) => this.guard(amount, from, o);
    // a heavy blow breaks off the healing
    f.onHurt = (_amount, heavy) => {
      if (heavy && f.action?.name === 'soten') f.stopAction();
    };
    this.applyStats();
  }

  /** open hands, a fist for the jab */
  hands(jab: boolean): void {
    const rig = this.f.visual.rig;
    rig.setBoneVisible('fist.R', false);
    rig.setBoneVisible('palm.R', true);
    rig.setBoneVisible('fist.L', jab);
    rig.setBoneVisible('palm.L', !jab);
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    if (this.resolve) {
      f.rei -= dt * 4.5;
      if (f.rei <= 0) this.setResolve(false);
    }
    if (this.santen?.done) this.santen = null;
    if (this.shiten?.done) this.shiten = null;
    if (this.dome?.done) this.dome = null;
    if (this.tsubaki?.done) this.tsubaki = null;
    if (this.orbit?.done) this.orbit = null;
    // shots die on the face of the triangle
    if (this.santen && !this.santen.closing) {
      const n = g.rejectNear(this.santen.center, this.santen.o.size * 0.85, f, false);
      if (n > 0) this.santen.absorb(18 * n);
    }
    this.stepRestore(dt);
    if (this.rokutenT > 0) {
      this.rokutenT -= dt;
      if (this.rokutenT <= 0 && !f.dead) this.endRokuten();
    }
    this.applyStats();
  }

  target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 90, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 90);
  }

  aim(out = new THREE.Vector3()): THREE.Vector3 {
    const { f, g } = this;
    if (f === g.player && !f.faceTarget) return g.aimPoint(f, out);
    const t = this.target();
    if (t && !t.dead) return t.center(out);
    if (f.faceTarget) return out.copy(f.faceTarget);
    return f.center(out).addScaledVector(f.forward(_w), 20);
  }

  // ---------------------------------------------------------------- the karate

  /** one blow: whoever is in the sphere before her is struck */
  strike(s: StrikeSpec, hits: Set<number>): void {
    const { f, g } = this;
    const fw = f.forward(_w);
    const c = new THREE.Vector3().copy(f.pos).addScaledVector(fw, s.reach);
    c.y += s.height;
    for (const o of g.enemiesOf(f)) {
      if (hits.has(o.id)) continue;
      const cy = Math.max(o.pos.y + 0.15, Math.min(o.pos.y + o.def.height - 0.15, c.y));
      if (Math.hypot(o.pos.x - c.x, cy - c.y, o.pos.z - c.z) > s.radius + o.def.radius) continue;
      hits.add(o.id);
      const dir = _v.subVectors(o.pos, f.pos).setY(0);
      if (dir.lengthSq() < 1e-4) dir.copy(fw);
      dir.normalize();
      g.damage(o, s.damage, f, dir.clone(), { knock: s.knock, launch: s.launch, heavy: s.heavy, hitstop: s.heavy ? 0.08 : 0.04, shake: s.heavy ? 0.25 : 0.1 });
      g.sparks(new THREE.Vector3(o.pos.x, cy, o.pos.z), dir, this.rokutenT > 0 ? '#E73D60' : '#FFE7A8', s.heavy ? 14 : 8);
    }
  }

  /** the finisher's small triangle, flashing out of her palms */
  palmTriangle(): void {
    const { f, g } = this;
    g.addProjectile(new SantenKesshun(g, f, { dur: 0.32, hp: 1e9, size: 0.55, ahead: 0.95, height: 1.1, color: this.rokutenT > 0 ? ROKUTEN_RED : RIKKA_GOLD }));
    g.sfx.play('ting', f.center(), 0.6);
  }

  // ---------------------------------------------------------------- Shun Shun Rikka

  raiseSanten(): void {
    const { f, g } = this;
    this.santen?.close();
    const s = new SantenKesshun(g, f, { dur: 4.5, hp: this.resolve ? 300 : 180, size: this.resolve ? 1.3 : 1.05, ahead: 0.9, height: 1.0, color: this.rokutenT > 0 ? ROKUTEN_RED : RIKKA_GOLD });
    g.addProjectile(s);
    this.santen = s;
  }

  raiseShiten(): void {
    const { f, g } = this;
    this.shiten?.tri.close();
    const s = new ShitenKoshun(g, f, 3.2, this.resolve ? 1.25 : 1.05);
    g.addProjectile(s);
    this.shiten = s;
  }

  raiseSoten(): void {
    const { f, g } = this;
    const at = f.pos.clone();
    const gy = groundAt(g, at.x, at.y + 1, at.z, 4);
    if (gy !== null) at.y = gy;
    const radius = this.resolve ? 12 : 8.5;
    this.dome?.close();
    // the dome itself covers her; what it restores reaches out much further (the ground and the
    // buildings torn up round her)
    const dome = new SotenKisshun(g, f, at, 1.5, 2.1, 3.0);
    g.addProjectile(dome);
    this.dome = dome;
    this.startRestore(at, radius, 2.2);
  }

  /** Sōten Kisshun's rejection of what happened round her: collect the destruction, nearest first */
  private startRestore(center: THREE.Vector3, radius: number, dur: number): void {
    const { g } = this;
    const vs = g.engine.world.vs;
    const log = g.engine.editLog;
    const cx = center.x / vs, cy = center.y / vs, cz = center.z / vs;
    const list = log.collect(cx, cy, cz, radius / vs, 0.001);
    const d = new Float32Array(list.length);
    for (let k = 0; k < list.length; k++) {
      const e = log.entry(list[k]);
      d[k] = Math.hypot(e.x + 0.5 - cx, e.y + 0.5 - cy, e.z + 0.5 - cz) * vs;
    }
    // nearest first; the sort is stable, so each voxel's own edits stay newest-first
    const order = Array.from(list.keys()).sort((a, b) => d[a] - d[b]);
    this.restore = { list: order.map((k) => list[k]), dist: Float32Array.from(order.map((k) => d[k])), i: 0, radius, t: 0, dur };
    // the falling pieces vanish: their voxels are going back where they were
    const gone = g.engine.fragments.dissolveNear(center, radius);
    for (const p of gone) {
      rikkaSparks(g, p, RIKKA_GOLD, 6, 2);
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 1.2, sizeEnd: 0.1, life: 0.4, r: 1.6, g: 1.4, b: 0.8, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
    }
  }

  /** put the voxels back, the front of the restoration sweeping outward from her */
  private stepRestore(dt: number): void {
    const r = this.restore;
    if (!r) return;
    if (!this.dome || this.dome.closing) {
      this.restore = null;
      return;
    }
    const { g } = this;
    const log = g.engine.editLog;
    const vs = g.engine.world.vs;
    r.t += dt;
    const reach = r.radius * Math.min(1, r.t / r.dur);
    const motes: THREE.Vector3[] = [];
    let budget = 9000;
    while (r.i < r.list.length && r.dist[r.i] <= reach && budget-- > 0) {
      const idx = r.list[r.i++];
      const e = log.entry(idx);
      // never shut anyone inside the stone
      if (e.was !== 0 && this.occupied((e.x + 0.5) * vs, (e.y + 0.5) * vs, (e.z + 0.5) * vs)) continue;
      const m = log.revert(idx);
      if (m > 0 && motes.length < 60 && Math.random() < 0.035) motes.push(new THREE.Vector3((e.x + 0.5) * vs, (e.y + 0.5) * vs, (e.z + 0.5) * vs));
    }
    if (motes.length) restoreMotes(g, motes);
    if (r.i >= r.list.length) this.restore = null;
  }

  private occupied(x: number, y: number, z: number): boolean {
    for (const o of this.g.fighters) {
      if (o.dead) continue;
      if (y < o.pos.y - 0.1 || y > o.pos.y + o.def.height + 0.1) continue;
      if (Math.hypot(x - o.pos.x, z - o.pos.z) < o.def.radius + 0.2) return true;
    }
    return false;
  }

  launchTsubaki(): void {
    const { f, g } = this;
    if (this.tsubakiBroken || this.tsubaki) return;
    const red = this.rokutenT > 0;
    const k = new KotenZanshun(g, f, this.target(), this.aim(), {
      speed: red ? 38 : 30,
      cut: red ? 1800 : this.resolve ? 1400 : 650,
      color: red ? ROKUTEN_RED : RIKKA_GOLD,
      onHit: (o, at, dir) => {
        // caught mid-swing, he is swatted aside — unless she means it
        const busy = o.bladeActive || (o.action !== null && o.action.armor >= 0.3) || o.def.boss === true;
        if (!this.resolve && !red && busy && Math.random() < 0.55) {
          g.sparks(at, dir.clone().negate(), '#FFE7A8', 10);
          return false;
        }
        const dmg = (this.resolve ? 64 : 42) * (red ? 1.5 : 1);
        g.damage(o, dmg, f, dir, { knock: 10, launch: 3, heavy: this.resolve || red, hitstop: 0.08, shake: 0.28 });
        g.sparks(at, dir, red ? '#E73D60' : GOLD, 16);
        return true;
      },
      onBroken: () => {
        this.tsubakiBroken = true;
        if (f === g.player) g.hud?.showBanner('Tsubaki is broken — mend him with Sōten Kisshun');
      },
    });
    g.addProjectile(k);
    this.tsubaki = k;
  }

  mendTsubaki(): void {
    if (!this.tsubakiBroken) return;
    this.tsubakiBroken = false;
    const p = socketPos(this.f, 'pin.R');
    rikkaSparks(this.g, p, RIKKA_GOLD, 10, 2);
    if (this.f === this.g.player) this.g.hud?.showBanner('Tsubaki is mended');
  }

  /** the shields: what strikes their face is turned aside (Shiten Kōshun fires it back) */
  private guard(amount: number, from: Fighter | null, o: DamageOpts): boolean {
    const f = this.f;
    let dir: THREE.Vector3 | null = null;
    if (from) {
      dir = _v.subVectors(f.pos, from.pos).setY(0);
      if (dir.lengthSq() < 1e-6) dir = null;
      else dir.normalize();
    }
    if (this.shiten && from && dir && this.shiten.covers(dir)) {
      const back = from.center();
      this.shiten.fire(back, (a, b) => this.blastBack(a, b, from, amount));
      return true;
    }
    if (this.santen && !this.santen.closing && dir && this.santen.covers(dir)) {
      this.santen.absorb(amount * (this.resolve ? 0.65 : 1));
      return true;
    }
    if (this.orbit && from && (o.energy === true || Math.random() < 0.3)) {
      this.orbit.deflect(dir ?? f.forward(_w).negate());
      return true;
    }
    return false;
  }

  /** Shiten Kōshun: the caught blow fired back down its path at whoever sent it */
  private blastBack(from: THREE.Vector3, to: THREE.Vector3, target: Fighter, amount: number): void {
    const { f, g } = this;
    const dir = _w.subVectors(to, from).setY(0).normalize();
    g.damage(target, amount * 1.6 + 30, f, dir.clone(), { knock: 22, launch: 5, heavy: true, energy: true, hitstop: 0.14, shake: 0.5 });
    g.engine.destruction.carve(new CapsuleShape(from.clone(), to.clone(), 0.55), { mode: 'bore', power: 520, sparks: [2.4, 1.6, 0.5] });
    g.engine.destruction.carve(new SphereShape(to.clone(), 1.8), { mode: 'explode', power: 320, impulse: 12 });
    g.sfx.play('explode', to, 1.1);
    g.addRing(to.clone(), 3.5, '#FFB347', 0.4);
    if (f === g.player || target === g.player) g.shake(0.45);
  }

  // ---------------------------------------------------------------- Resolve, Rokuten Shishun

  setResolve(on: boolean): void {
    const { f, g } = this;
    if (this.resolve === on) return;
    this.resolve = on;
    if (on) {
      rejectPulse(g, f.pos, 7);
      const n = g.rejectNear(f.center(), 7, f, true);
      f.aura.flare(1.3, 0.5);
      g.callout('拒絶', 'I REJECT', GOLD);
      g.sfx.play('flare', f.center(), 0.8);
      if (n > 0 && f === g.player) g.hud?.showBanner('Rejected');
    }
  }

  enterRokuten(): void {
    const { f, g } = this;
    this.rokutenT = ROKUTEN_TIME;
    f.setForm({ asset: orihimeAsset('rokuten'), props: [] }, AURA_ROKUTEN);
    this.hands(false);
    this.orbit = new RokutenOrbit(g, f);
    g.addProjectile(this.orbit);
    rejectPulse(g, f.pos, 6, ROKUTEN_RED);
    g.sfx.play('bankai', f.center(), 1);
    f.aura.pillarBurst(1.8);
    if (f === g.player) g.shake(0.5);
    this.applyStats();
  }

  /** the Rejection lands: heavy damage, and the target's power rejected */
  touchReject(): void {
    const { f, g } = this;
    const t = this.target();
    const palm = bonePos(f, 'palm.R');
    crimsonRejection(g, palm);
    if (!t || t.pos.distanceTo(f.pos) > 2.4) return;
    const dir = _v.subVectors(t.pos, f.pos).setY(0).normalize();
    g.damage(t, 85, f, dir.clone(), { knock: 26, launch: 6, heavy: true, energy: true, hitstop: 0.2, shake: 0.7 });
    t.sealT = 14;
    t.sealK = 0.4;
    t.aura.target = 0.05;
    if (t === g.player) g.hud?.showBanner('Your power is rejected');
    if (f === g.player) g.hud?.showBanner('Rejected');
  }

  /** the crimson fades: the state ends and she is spent */
  endRokuten(): void {
    const { f, g } = this;
    if (this.rokutenT <= 0 && !this.orbit) return;
    this.rokutenT = 0;
    this.orbit?.end();
    this.orbit = null;
    this.cd.rokuten = 45;
    if (f.dead) return;
    f.setForm({ asset: orihimeAsset('hueco'), props: [] }, AURA_ORIHIME);
    this.hands(false);
    f.rei = 0;
    this.setResolve(false);
    f.stopAction();
    f.act(new SpentAction(this), true);
    if (f === g.player) g.hud?.showBanner('Spent');
    this.applyStats();
  }

  // ---------------------------------------------------------------- input

  private special(a: FighterAction, cost: number, cdKey: keyof typeof this.cd, cd: number): boolean {
    const f = this.f;
    if (this.cd[cdKey] > 0 || f.dead) return false;
    if (f.action && !f.action.canCancel(a)) return false;
    if (f.hitstun > 0 || f.dashT > 0) return false;
    if (!f.spendRei(cost)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return false;
    }
    this.cd[cdKey] = cd;
    f.act(a, true);
    return true;
  }

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof StrikeAction) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastEnd > 0.7) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const idx = i % ORIHIME_CHAIN.length;
    this.comboIndex = idx + 1;
    this.lastEnd = this.g.time + 0.7;
    this.f.act(new StrikeAction(this, ORIHIME_CHAIN[idx], idx), true);
  }

  heavy(): void {
    if (this.tsubakiBroken) {
      if (this.f === this.g.player) this.g.hud?.showBanner('Tsubaki is broken');
      return;
    }
    if (this.tsubaki) return;
    this.special(new KotenAction(this), this.rokutenT > 0 ? 8 : 18, 'heavy', this.rokutenT > 0 ? 1.6 : 3.2);
  }

  skill1(): void {
    this.special(new SantenAction(this), 16, 'santen', this.resolve ? 3.5 : 5);
  }

  skill2(): void {
    if (this.f.action?.name === 'soten') {
      this.f.stopAction();
      return;
    }
    this.special(new SotenAction(this), 28, 'soten', 11);
  }

  skill3(): void {
    if (this.tsubakiBroken) {
      if (this.f === this.g.player) this.g.hud?.showBanner('Tsubaki is broken');
      return;
    }
    this.special(new ShitenAction(this), 22, 'shiten', 7);
  }

  toggle(): void {
    const f = this.f;
    if (this.cd.resolve > 0 || f.busy || this.rokutenT > 0) return;
    if (!this.resolve && f.rei < 25) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    this.cd.resolve = 1.5;
    f.act(new ResolveAction(this, !this.resolve), true);
  }

  release(): void {
    const f = this.f;
    if (this.rokutenT > 0) {
      this.special(new RejectAction(this), 0, 'reject', 3);
      return;
    }
    if (this.cd.rokuten > 0 || f.busy) return;
    if (!f.spendRei(110)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(new RokutenAction(this), true);
  }

  toggleFlare(): void {
    this.flare = !this.flare;
    this.applyStats();
    if (this.flare) {
      this.f.aura.flare(1.4, 0.4);
      this.g.sfx.play('flare', this.f.center());
    }
  }

  private applyStats(): void {
    const f = this.f;
    const red = this.rokutenT > 0;
    f.power = (red ? 1.8 : 1) * (this.flare ? 1.2 : 1) * (this.resolve ? 1.1 : 1);
    f.damageTaken = red ? 0.8 : 1;
    const sp = red ? 1.25 : 1;
    f.def.speed.run = SPEED.run * sp;
    f.def.speed.sprint = SPEED.sprint * sp;
    f.def.speed.dash = SPEED.dash * sp;
    f.aura.target = this.flare ? 1 : red ? 0.75 : this.resolve ? 0.35 : 0.05;
  }

  formName(): string {
    if (this.rokutenT > 0) return 'Rokuten Shishun';
    return this.resolve ? 'Shun Shun Rikka · Resolve' : 'Shun Shun Rikka';
  }

  ai(): KitAI {
    const kit = this;
    const f = this.f;
    return {
      get reach() {
        return kit.rokutenT > 0 ? 1.6 : 1.3;
      },
      chain: 4,
      releaseAt: 0.38,
      toggleAt: 0.7,
      toggleOn: () => kit.resolve || kit.rokutenT > 0,
      ranged: () => kit.rokutenT <= 0,
      moves: [
        { name: 'koten', use: () => this.heavy(), min: 2.5, max: 20, weight: 1.3, cd: 2.5, when: () => !kit.tsubakiBroken && !kit.tsubaki },
        { name: 'santen', use: () => this.skill1(), min: 0, max: 14, weight: 1, cd: 5, when: () => !kit.santen && kit.rokutenT <= 0 },
        { name: 'soten', use: () => this.skill2(), min: 6, max: 60, weight: 1.6, cd: 9, when: () => kit.rokutenT <= 0 && (f.hp < f.maxHp * 0.7 || kit.tsubakiBroken) },
        { name: 'shiten', use: () => this.skill3(), min: 1.5, max: 9, weight: 0.9, cd: 7, when: () => !kit.tsubakiBroken && !kit.shiten && kit.rokutenT <= 0 },
        { name: 'reject', use: () => this.release(), min: 0, max: 9, weight: 2.2, cd: 3, when: () => kit.rokutenT > 0 && kit.rokutenT < ROKUTEN_TIME - 4 },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    const red = this.rokutenT > 0;
    return [
      { key: 'LMB', name: 'Karate', kanji: '空手' },
      this.tsubakiBroken
        ? { key: 'RMB', name: 'Tsubaki — broken', kanji: '椿' }
        : { key: 'RMB', name: 'Koten Zanshun', kanji: '孤天斬盾', cost: red ? 8 : 18, cd: cd.heavy, cdMax: red ? 1.6 : 3.2 },
      { key: 'Q', name: 'Santen Kesshun', kanji: '三天結盾', cost: 16, cd: cd.santen, cdMax: this.resolve ? 3.5 : 5, active: this.santen !== null },
      { key: 'E', name: 'Sōten Kisshun', kanji: '双天帰盾', cost: 28, cd: cd.soten, cdMax: 11, active: this.dome !== null },
      { key: 'R', name: 'Shiten Kōshun', kanji: '四天抗盾', cost: 22, cd: cd.shiten, cdMax: 7, active: this.shiten !== null },
      { key: 'Shift', name: 'Rikka pull', kanji: '舜' },
      { key: 'G', name: 'Resolve', kanji: '決意', active: this.resolve },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      red
        ? { key: 'F', name: 'Rejection', kanji: '拒絶', cd: cd.reject, cdMax: 3 }
        : { key: 'F', name: 'Rokuten Shishun', kanji: '六天死盾', cost: 110, cd: cd.rokuten, cdMax: 45 },
    ];
  }
}
