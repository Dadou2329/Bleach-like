// Hitsugaya's kit (docs/roster/B3-captains-3.md §Hitsugaya, Kit proposal). Sealed: the nodachi drawn from
// his back (the sheath dissolves into frost), a three-cut string, a point thrust, cold-reiatsu frost and a
// short ice wave. F: "Sōten ni zase, Hyōrinmaru" — storm clouds swallow the sky, the chain and crescent
// hang from the pommel; the ice dragon, the chain-sickle that hooks and hauls, the ice wave. F again:
// Bankai, Daiguren Hyōrinmaru — wings and flight, dragon-arm cuts, claw and tail; Ryūsenka, Gunchō
// Tsurara, Hyōryū Senbi, Sennen Hyōrō, Hyōten Hyakkasō. Twelve petals behind his back fall one by one
// (and with every great technique); when the last one falls the Bankai breaks.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { hitsugayaAsset, hitsugayaProp } from '../../chars/hitsugaya';
import { DAIGUREN_CHAIN, DAIGUREN_STANCE, HITSUGAYA_CHAIN, HITSUGAYA_CLIPS, HITSUGAYA_SHEATHED_STANCE, HITSUGAYA_STANCE } from '../../chars/hitsugayaClips';
import { IceDragon } from '../../vfx/iceDragon';
import { SickleChain } from '../../vfx/chain';
import { IcePrison, frostWorld, ICE_TINT } from '../../vfx/ice';
import { Hyakkaso, IceCrescent, IceWave, IcicleFlock, SennenHyoro, Storm } from '../../vfx/iceArts';
import { GlassShards } from '../../vfx/mirror';
import { SphereShape } from '../../destruction/shapes';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from '../../vfx/sprites';
import type { AuraStyle } from '../../vfx/aura';

export const AURA_HITSUGAYA: AuraStyle = { core: '#F2FBFF', body: '#9FDDF5', rim: '#4EA8D9' };
export const AURA_DAIGUREN: AuraStyle = { core: '#F2FBFF', body: '#8FD4F2', rim: '#7E70CF' };

type BladeDef = NonNullable<FighterDef['blade']>;
const BLADE: BladeDef = { prop: 'sword', base: [0, 0, 0.15], tip: [0, 0, 1.16], color: '#BFEFFF', core: '#F2FBFF' };
/** the pommel ring the Shikai chain hangs from (sword prop frame, m) */
const POMMEL = new THREE.Vector3(0, 0, -0.24);

export const HITSUGAYA_DEF: FighterDef = {
  id: 'hitsugaya',
  name: 'Tōshirō Hitsugaya',
  title: 'Captain, 10th Division',
  build: () => ({ asset: hitsugayaAsset('captain'), props: [{ key: 'sheath', model: hitsugayaProp('sheathed'), socket: 'back' }] }),
  stance: HITSUGAYA_SHEATHED_STANCE,
  clips: HITSUGAYA_CLIPS,
  aura: AURA_HITSUGAYA,
  blade: BLADE,
  hp: 1000,
  rei: 140,
  speed: { run: 10, sprint: 25, jump: 12.5, dash: 15, dashTime: 0.1 },
  radius: 0.32,
  height: 1.33,
};

const SPEED_BANKAI = { run: 11.5, sprint: 29, jump: 14, dash: 18, dashTime: 0.09 };

/** 'adult': the Complete Bankai (TYBW kit only) */
export type HitsugayaKitForm = 'sealed' | 'shikai' | 'bankai' | 'adult';
type Form = HitsugayaKitForm;

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

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
}

interface MoveInfo {
  lunge: number;
  window?: [number, number];
  trail?: [number, number];
  spec?: BladeSpec;
  strike?: StrikeSpec;
  /** frost bursts where the move lands */
  frost?: boolean;
}

const MOVES: Record<string, MoveInfo> = {
  hg_cut1: { lunge: 7, window: [0.08, 0.21], trail: [0.06, 0.26], spec: { damage: 20, knock: 7, launch: 0, hitstop: 0.04, shake: 0.1, cut: 300 } },
  hg_cut2: { lunge: 7, window: [0.08, 0.22], trail: [0.06, 0.27], spec: { damage: 22, knock: 7, launch: 4, hitstop: 0.045, shake: 0.12, cut: 300 } },
  hg_cut3: { lunge: 6, window: [0.2, 0.3], trail: [0.16, 0.36], frost: true, spec: { damage: 30, knock: 10, launch: 2, heavy: true, hitstop: 0.08, shake: 0.3, cut: 380 } },
  hg_b1: { lunge: 9, window: [0.08, 0.21], trail: [0.06, 0.26], frost: true, spec: { damage: 30, knock: 9, launch: 1, hitstop: 0.05, shake: 0.16, cut: 520 } },
  hg_b2: { lunge: 9, window: [0.08, 0.22], trail: [0.06, 0.27], frost: true, spec: { damage: 32, knock: 9, launch: 4, hitstop: 0.05, shake: 0.16, cut: 520 } },
  hg_claw: { lunge: 9, frost: true, strike: { damage: 30, knock: 9, launch: 2, reach: 1.0, height: 0.85, radius: 1.0, hitstop: 0.05, shake: 0.16 } },
  hg_tail: { lunge: 3, frost: true, strike: { damage: 40, knock: 22, launch: 6, heavy: true, reach: 0, height: 0.7, radius: 2.7, hitstop: 0.09, shake: 0.4 } },
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

function bladeTip(f: Fighter): THREE.Vector3 {
  if (f.bladeValid && f.visual.props.has('sword')) return f.blade.tip.clone();
  return f.center().addScaledVector(f.forward(), 0.9);
}

function strike(f: Fighter, g: Game, s: StrikeSpec, hit: Set<number>): THREE.Vector3 {
  const fw = f.forward(_w);
  const p = new THREE.Vector3().copy(f.pos).addScaledVector(fw, s.reach);
  p.y += s.height;
  for (const o of g.enemiesOf(f)) {
    if (hit.has(o.id)) continue;
    const cy = Math.max(o.pos.y + 0.2, Math.min(o.pos.y + o.def.height - 0.2, p.y));
    if (Math.hypot(o.pos.x - p.x, cy - p.y, o.pos.z - p.z) > s.radius + o.def.radius) continue;
    hit.add(o.id);
    const dir = _v.subVectors(o.pos, f.pos).setY(0);
    if (dir.lengthSq() < 1e-4) dir.copy(fw);
    dir.normalize();
    g.damage(o, s.damage, f, dir.clone(), { knock: s.knock, launch: s.launch, heavy: s.heavy, hitstop: s.hitstop, shake: s.shake });
    g.sparks(new THREE.Vector3(o.pos.x, cy, o.pos.z), dir, ICE_TINT, 14);
  }
  return p;
}

/** A small burst of frost at p: mist, glitter and a crust of ice on whatever is there. */
function frostBurst(g: Game, p: THREE.Vector3, r = 1.1): void {
  frostWorld(g, p, r, 300);
  for (let i = 0; i < 8; i++) {
    const a = Math.random() * Math.PI * 2;
    g.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * 2, vy: Math.random() * 1.2, vz: Math.sin(a) * 2, size: 0.3, sizeEnd: 1.1, life: 0.7, r: 0.9, g: 0.96, b: 1, alpha: 0.45, alphaEnd: 0, tex: TEX_PUFF, drag: 2.5 });
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * 3, vy: Math.random() * 3, vz: Math.sin(a) * 3, size: 0.07, sizeEnd: 0.02, life: 0.5, r: 0.85, g: 0.97, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
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
  private frosted = false;
  private hits = new Set<number>();
  queued = false;

  constructor(readonly kit: HitsugayaKit, readonly clip: string, readonly index: number) {
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
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n !== 'step') return;
        const tgt = f.faceTarget;
        const extra = tgt ? Math.min(5, Math.max(0, f.pos.distanceTo(tgt) - 1.6)) : 0;
        f.push.addScaledVector(f.forward(), this.info.lunge + extra * 2.2);
        g.sfx.play(this.info.spec?.heavy || this.info.strike?.heavy ? 'swingHeavy' : 'swing', f.center(), 0.75);
      },
    });
  }

  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t, info = this.info;
    if (info.window) {
      f.bladeActive = t >= info.window[0] && t <= info.window[1];
      if (f.trail && info.trail) f.trail.emitting = t >= info.trail[0] && t <= info.trail[1];
    }
    if (info.strike && !this.struck && t >= this.hitAt) {
      this.struck = true;
      const p = strike(f, g, info.strike, this.hits);
      if (info.frost) frostBurst(g, p.setY(f.pos.y + 0.2), info.strike.radius);
    }
    if (info.frost && info.window && !this.frosted && t >= info.window[1]) {
      this.frosted = true;
      // the cut leaves frost where the blade passed
      frostBurst(g, bladeTip(f), 0.9);
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
    if (next.name === 'dash' || next instanceof SkillAction) return this.t >= (this.info.window?.[0] ?? this.hitAt) + 0.04;
    return false;
  }
}

abstract class SkillAction extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: HitsugayaKit) {
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

/** The draw: the hand over the shoulder, the blade round to the front; the sheath dissolves into frost. */
class DrawAction extends SkillAction {
  readonly name = 'draw';
  constructor(kit: HitsugayaKit) {
    super(kit);
    this.mobility = 0.5;
  }
  override start(f: Fighter): void {
    this.playClip(f, 'hg_draw', (n) => {
      if (n === 'draw') this.kit.drawSword();
    });
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.drawSword();
  }
}

/** RMB: the thrust — frost at the point (sealed), a point-blank dragon (Shikai), Ryūsenka (Bankai). */
class ThrustAction extends SkillAction {
  readonly name: string;
  private fired = false;
  private bloomed = false;
  constructor(kit: HitsugayaKit) {
    super(kit);
    this.name = kit.form === 'bankai' ? 'ryusenka' : 'thrust';
    this.mobility = 0.1;
    this.airGravity = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    const bankai = this.kit.form === 'bankai';
    f.bladeSpec = { damage: bankai ? 34 : 26, knock: bankai ? 4 : 10, launch: 0, heavy: !bankai, hitstop: 0.07, shake: 0.25, cut: 420 };
    this.playClip(f, 'hg_thrust', (n) => {
      if (n === 'step') {
        f.push.addScaledVector(f.forward(), 11);
        g.sfx.play('swingHeavy', f.center(), 0.9);
      }
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    f.bladeActive = t >= 0.12 && t <= 0.26;
    if (f.trail) f.trail.emitting = t >= 0.1 && t <= 0.3;
    const form = this.kit.form;
    if (!this.fired && t >= 0.2) {
      this.fired = true;
      const tip = bladeTip(f);
      if (form === 'shikai') {
        const tgt = this.kit.target();
        g.addProjectile(new IceDragon(g, f, tip, f.forward(), () => tgt, { speed: 30, damage: 50, scale: 0.7, life: 0.8, turn: 2 }));
      } else if (form === 'sealed') frostBurst(g, tip, 1.2);
    }
    // Ryūsenka: where the point went in, a great cross of ice blooms round the target
    if (form === 'bankai' && !this.bloomed && t >= 0.27) {
      this.bloomed = true;
      const hit = g.enemiesOf(f).find((o) => f.bladeHits.has(o.id) && !o.dead);
      if (hit) {
        const cr = this.kit.crest();
        g.addProjectile(new IcePrison(g, f, hit, 1.3, 130 * cr.k, 'cross', 1.3 * cr.k));
        g.callout(cr.kanji, cr.name, '#bfefff');
        this.kit.losePetal();
      }
    }
  }
}

/** Sealed Q: his cold reiatsu bursts out — the ground frosts over and anyone close is frozen to the spot. */
class FrostAction extends SkillAction {
  readonly name = 'frost';
  private burst = false;
  constructor(kit: HitsugayaKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.3;
  }
  override start(f: Fighter): void {
    this.dur = 0.55;
    f.aura.flare(1.4, 0.5);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.burst && this.t >= 0.18) {
      this.burst = true;
      frostWorld(g, f.pos.clone().setY(f.pos.y + 0.3), 4, 2200);
      g.addRing(f.pos.clone().setY(f.pos.y + 0.2), 9, '#BFEFFF', 0.45);
      for (const o of g.enemiesOf(f)) {
        if (o.pos.distanceTo(f.pos) > 3.8) continue;
        g.damage(o, 12, f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 2, hitstop: 0.04 });
        if (!o.dead) g.addProjectile(new IcePrison(g, f, o, 0.8, 18, 'block', 0.8));
      }
      g.sfx.play('crack', f.center(), 1.2);
      for (let i = 0; i < 30; i++) {
        const a = Math.random() * Math.PI * 2;
        g.engine.dust.spawn({ x: f.pos.x, y: f.pos.y + 0.2, z: f.pos.z, vx: Math.cos(a) * 9, vy: Math.random() * 1.5, vz: Math.sin(a) * 9, size: 0.5, sizeEnd: 1.8, life: 0.8, r: 0.9, g: 0.96, b: 1, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 2.5 });
      }
    }
  }
}

/** The ice wave (sealed: short; Shikai: long). */
class WaveAction extends SkillAction {
  readonly name = 'wave';
  constructor(kit: HitsugayaKit, readonly length: number) {
    super(kit);
    this.mobility = 0.05;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'hg_wave', (n) => {
      if (n === 'step') f.push.addScaledVector(f.forward(), 4);
      if (n !== 'wave') return;
      const dir = aim(f, g).sub(f.pos).setY(0);
      if (dir.lengthSq() < 0.01) f.forward(dir);
      g.addProjectile(new IceWave(g, f, f.pos.clone().addScaledVector(dir.normalize(), 1.2), dir, this.length, this.length > 12 ? 40 : 26));
      g.sfx.play('swingHeavy', f.center(), 1);
    });
  }
}

/** Shikai Q: the ice dragon, from a full swing. */
class DragonAction extends SkillAction {
  readonly name = 'dragon';
  constructor(kit: HitsugayaKit) {
    super(kit);
    this.mobility = 0.08;
    this.airGravity = 0.05;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'hg_dragon', (n) => {
      if (n === 'step') f.push.addScaledVector(f.forward(), 5);
      if (n !== 'cast') return;
      const tgt = this.kit.target();
      const tip = bladeTip(f);
      const dir = aim(f, g).sub(tip).normalize();
      g.addProjectile(new IceDragon(g, f, tip, dir, () => tgt, { speed: 27, damage: 80, scale: 1, life: 2.6, turn: 3.2, freeze: 1.4 }));
      f.aura.flare(1.2, 0.5);
    });
  }
}

/** Shikai E: the crescent flung out on its chain; it hooks, freezes the limb it bites, and hauls back. */
class ChainAction extends SkillAction {
  readonly name = 'chain';
  private phase: 'wind' | 'out' | 'hooked' | 'back' = 'wind';
  private tipPos = new THREE.Vector3();
  private dir = new THREE.Vector3();
  private dist = 0;
  private hooked: Fighter | null = null;
  constructor(kit: HitsugayaKit, readonly target: Fighter | null) {
    super(kit);
    this.mobility = 0.05;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'hg_chain', (n) => {
      const ch = this.kit.sickle;
      if (!ch) return;
      if (n === 'throw') {
        this.phase = 'out';
        this.tipPos.copy(ch.tip);
        const at = this.target && !this.target.dead ? this.target.center() : aim(f, g);
        this.dir.subVectors(at, this.tipPos).normalize();
        ch.end = this.tipPos;
        g.sfx.play('swing', this.tipPos, 1);
      }
      if (n === 'pull') this.pull(f, g);
    });
  }
  private pull(f: Fighter, g: Game): void {
    if (this.phase === 'back') return;
    this.phase = 'back';
    const o = this.hooked;
    if (o && !o.dead) {
      const d = _v.subVectors(f.pos, o.pos).setY(0);
      const len = d.length();
      d.normalize();
      o.push.addScaledVector(d, Math.min(26, 6 + len * 1.6));
      o.body.vel.y = Math.max(o.body.vel.y, 4);
      o.hitstun = Math.max(o.hitstun, 0.5);
      g.sfx.play('swingHeavy', o.center(), 1);
    }
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const ch = this.kit.sickle;
    if (!ch) return;
    if (this.phase === 'out') {
      const step = 42 * dt;
      this.tipPos.addScaledVector(this.dir, step);
      this.dist += step;
      ch.setLength(f.center().distanceTo(this.tipPos) + 0.4);
      for (const o of g.enemiesOf(f)) {
        if (o.center().distanceTo(this.tipPos) < o.def.radius + 0.6) {
          this.hooked = o;
          this.phase = 'hooked';
          g.damage(o, 24, f, this.dir.clone(), { knock: 1, hitstop: 0.07, shake: 0.2 });
          frostBurst(g, o.center(), 0.6);
          o.hitstun = Math.max(o.hitstun, 0.8);
          g.sfx.play('crack', o.center(), 1);
          break;
        }
      }
      const w = g.engine.world, vs = w.vs;
      if (this.phase === 'out' && (this.dist > 17 || w.isSolid(Math.floor(this.tipPos.x / vs), Math.floor(this.tipPos.y / vs), Math.floor(this.tipPos.z / vs)))) {
        if (this.dist <= 17) {
          g.engine.destruction.carve(new SphereShape(this.tipPos.clone(), 0.45), { mode: 'cut', power: 200, dir: this.dir.clone(), sparks: [0.8, 0.95, 1], dust: 0.3 });
          frostBurst(g, this.tipPos, 0.9);
        }
        this.phase = 'hooked';
      }
    }
    if (this.phase === 'hooked' && this.hooked && !this.hooked.dead) this.tipPos.copy(this.hooked.center());
    if (this.phase === 'back') {
      const home = ch.anchorPos();
      const o = this.hooked;
      if (o && !o.dead && o.center().distanceTo(home) > 1.2) this.tipPos.copy(o.center());
      else this.tipPos.lerp(home, Math.min(1, dt * 10));
      ch.setLength(Math.max(0.62, f.center().distanceTo(this.tipPos) + 0.2));
      if (this.tipPos.distanceTo(home) < 0.8) this.release();
    }
    if (this.t > this.dur - 0.05 && this.phase !== 'back') this.pull(f, g);
  }
  private release(): void {
    const ch = this.kit.sickle;
    if (!ch) return;
    ch.end = null;
    ch.setLength(null);
  }
  override end(f: Fighter): void {
    super.end(f);
    this.release();
  }
}

/** Bankai Q: Gunchō Tsurara. */
class TsuraraAction extends SkillAction {
  readonly name = 'tsurara';
  private flock: IcicleFlock | null = null;
  constructor(kit: HitsugayaKit) {
    super(kit);
    this.mobility = 0.1;
    this.airGravity = 0.02;
  }
  override start(f: Fighter, g: Game): void {
    const tgt = this.kit.target();
    this.playClip(f, 'hg_tsurara', (n) => {
      if (n === 'form') {
        this.flock = new IcicleFlock(g, f, () => (tgt && !tgt.dead ? tgt.center() : aim(f, g)), 14, 15);
        g.addProjectile(this.flock);
        g.callout('群鳥氷柱', 'GUNCHŌ TSURARA', '#bfefff');
      }
      if (n === 'launch') this.flock?.launch();
    });
  }
  override end(f: Fighter): void {
    super.end(f);
    this.flock?.launch();
  }
}

/** Bankai E: Hyōryū Senbi. */
class SenbiAction extends SkillAction {
  readonly name = 'senbi';
  constructor(kit: HitsugayaKit) {
    super(kit);
    this.mobility = 0.08;
    this.airGravity = 0.03;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    f.bladeSpec = { damage: 30, knock: 10, launch: 2, heavy: true, hitstop: 0.07, shake: 0.3, cut: 520 };
    this.playClip(f, 'hg_senbi', (n) => {
      if (n === 'step') f.push.addScaledVector(f.forward(), 5);
      if (n !== 'cast') return;
      const c = f.center().addScaledVector(f.forward(), 1.2);
      const dir = aim(f, g).sub(c).normalize();
      g.addProjectile(new IceCrescent(g, f, c, dir, 75, 1.2));
      g.callout('氷竜旋尾', 'HYŌRYŪ SENBI', '#bfefff');
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    f.bladeActive = this.t >= 0.2 && this.t <= 0.3;
    if (f.trail) f.trail.emitting = this.t >= 0.16 && this.t <= 0.36;
  }
}

/** Bankai R: Sennen Hyōrō — the pillars rise, then the sword turns and they close. */
class HyoroAction extends SkillAction {
  readonly name = 'hyoro';
  private prison: SennenHyoro | null = null;
  constructor(kit: HitsugayaKit, readonly target: Fighter | null) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'hg_hyoro', (n) => {
      const t = this.target && !this.target.dead ? this.target : null;
      if (n === 'rise' && t) {
        this.prison = new SennenHyoro(g, f, t, 10, 150);
        g.addProjectile(this.prison);
        g.callout('千年氷牢', 'SENNEN HYŌRŌ', '#bfefff');
      }
      if (n === 'turn') this.prison?.close();
    });
  }
  override end(f: Fighter): void {
    super.end(f);
    this.prison?.close();
  }
}

/** G (Bankai): Hyōten Hyakkasō — the blade raised, the clouds open over the target. */
class HyakkasoAction extends SkillAction {
  readonly name = 'hyakkaso';
  constructor(kit: HitsugayaKit, readonly target: Fighter | null) {
    super(kit);
    this.mobility = 0.1;
    this.armor = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'hg_hyakkaso', (n) => {
      const t = this.target && !this.target.dead ? this.target : null;
      if (n === 'sky') {
        f.aura.flare(1.6, 1);
        this.kit.storm?.flash();
      }
      if (n === 'snow' && t) {
        g.addProjectile(new Hyakkaso(g, f, t, 3.6, 5, 30));
        g.callout('氷天百華葬', 'HYŌTEN HYAKKASŌ', '#bfefff');
      }
    });
  }
}

/** F: "Sōten ni zase, Hyōrinmaru" / "Bankai — Daiguren Hyōrinmaru". */
class ReleaseAction extends SkillAction {
  readonly name = 'release';
  constructor(kit: HitsugayaKit, readonly bankai: boolean) {
    super(kit);
    this.invulnerable = true;
    this.trackTarget = !bankai;
  }
  override start(f: Fighter, g: Game): void {
    this.kit.drawSword();
    this.playClip(f, this.bankai ? 'hg_bankai' : 'hg_shikai', (n) => {
      if (n === 'sky' || n === 'charge') {
        f.aura.flare(1.6, 1);
        g.sfx.play('charge', f.center(), 1);
        this.kit.raiseStorm();
      }
      if (n === 'burst') {
        if (this.bankai) this.kit.becomeBankai();
        else this.kit.becomeShikai();
      }
    });
  }
}

// ------------------------------------------------------------------ the kit

export class HitsugayaKit implements Kit {
  form: Form = 'sealed';
  drawn = false;
  flare = false;
  comboIndex = 0;
  petals = 12;
  sickle: (SickleChain & { anchorPos: () => THREE.Vector3 }) | null = null;
  storm: (Storm & { flash: () => void }) | null = null;
  protected lastEnd = 0;
  protected petalT = 0;
  protected flapping = false;
  protected cd = { heavy: 0, frost: 0, wave: 0, dragon: 0, chain: 0, tsurara: 0, senbi: 0, hyoro: 0, hyakkaso: 0, bankai: 0 };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    this.setHands();
    this.applyStats();
  }

  update(dt: number): void {
    const { f } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    if (f.dead && this.storm) this.storm.target = 0;
    if (this.form === 'bankai') {
      // the petals fall one by one
      this.petalT += dt;
      if (this.petalT > 7) {
        this.petalT = 0;
        this.losePetal();
      }
      // the wings beat whenever he is off the ground; he can hang in the air as long as he likes
      const airborne = !f.grounded || f.hovering;
      if (airborne && !this.flapping) {
        this.flapping = true;
        f.anim.play('hg_flap', { fadeIn: 0.2 });
      } else if (!airborne && this.flapping) {
        this.flapping = false;
        for (const a of f.anim.active) if (a.clip.name === 'hg_flap') a.ending = true;
      }
      if (!f.grounded && f.wishHover && f.body.vel.y < 1) f.hovering = true;
    }
  }

  target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 80, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 80);
  }

  /** the bodies the kit swaps between (the TYBW kit wears its own) */
  protected captainAsset() {
    return hitsugayaAsset('captain');
  }
  protected bankaiAsset() {
    return hitsugayaAsset('bankai');
  }

  /** Ryūsenka's cross of ice: its size and name (the Hollowfied Bankai blooms Hyōrinmaru's crest) */
  crest(): { k: number; kanji: string; name: string } {
    return { k: 1, kanji: '竜霰架', name: 'RYŪSENKA' };
  }

  protected setHands(): void {
    const rig = this.f.visual.rig;
    rig.setBoneVisible('fist.R', this.drawn);
    rig.setBoneVisible('palm.R', !this.drawn);
    rig.setBoneVisible('fist.L', false);
    rig.setBoneVisible('palm.L', true);
  }

  /** The sword drawn: the sheath on his back dissolves into frost. */
  drawSword(): void {
    const { f, g } = this;
    if (this.drawn) return;
    this.drawn = true;
    const sheath = f.visual.props.get('sheath');
    if (sheath) {
      sheath.updateMatrixWorld(true);
      const p = sheath.getWorldPosition(new THREE.Vector3());
      g.addProjectile(new GlassShards(g, p, new THREE.Vector3(0.25, 0.4, 0.25), 18, 2, 1.1, f.pos.y, ICE_TINT, 0.6));
      for (let i = 0; i < 12; i++) g.engine.dust.spawn({ x: p.x + (Math.random() - 0.5) * 0.4, y: p.y + (Math.random() - 0.5) * 0.8, z: p.z + (Math.random() - 0.5) * 0.4, vx: (Math.random() - 0.5), vy: 0.5, vz: (Math.random() - 0.5), size: 0.25, sizeEnd: 0.9, life: 0.9, r: 0.9, g: 0.96, b: 1, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
      f.visual.detach('sheath');
    }
    f.visual.attach('sword', hitsugayaProp(this.form === 'bankai' ? 'bankai-sword' : 'sword'), 'grip.R');
    f.bladeValid = false;
    const stance = this.form === 'bankai' ? DAIGUREN_STANCE : HITSUGAYA_STANCE;
    f.anim.loco.stance = stance;
    f.def = { ...f.def, stance };
    this.setHands();
  }

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof StringAction) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (!this.drawn) {
      f.act(new DrawAction(this), true);
      return;
    }
    if (this.g.time - this.lastEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const list = this.form === 'bankai' ? DAIGUREN_CHAIN : HITSUGAYA_CHAIN;
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    this.lastEnd = this.g.time + 0.8;
    this.f.act(new StringAction(this, list[idx], idx), true);
  }

  protected special(a: FighterAction, cost: number, cdKey: keyof typeof this.cd, cd: number): boolean {
    const f = this.f;
    if (this.cd[cdKey] > 0) return false;
    if (f.action && !f.action.canCancel(a)) return false;
    if (f.hitstun > 0 || f.dashT > 0 || f.dead) return false;
    if (!f.spendRei(cost)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return false;
    }
    this.cd[cdKey] = cd;
    if (!this.drawn) this.drawSword();
    f.act(a, true);
    return true;
  }

  heavy(): void {
    const f = this.f;
    if (f.busy && !(f.action instanceof StringAction)) return;
    this.special(new ThrustAction(this), this.form === 'sealed' ? 6 : 12, 'heavy', this.form === 'bankai' ? 3.5 : 2);
  }

  /** Q: frost (sealed) / the ice dragon (Shikai) / Gunchō Tsurara (Bankai). */
  skill1(): void {
    if (this.form === 'sealed') this.special(new FrostAction(this), 14, 'frost', 5);
    else if (this.form === 'shikai') this.special(new DragonAction(this), 20, 'dragon', 2.6);
    else if (this.special(new TsuraraAction(this), 22, 'tsurara', 5)) this.losePetal();
  }

  /** E: a short ice wave (sealed) / the chain-sickle (Shikai) / Hyōryū Senbi (Bankai). */
  skill2(): void {
    if (this.form === 'sealed') this.special(new WaveAction(this, 9), 12, 'wave', 3.5);
    else if (this.form === 'shikai') this.special(new ChainAction(this, this.target()), 14, 'chain', 3.5);
    else if (this.special(new SenbiAction(this), 18, 'senbi', 4)) this.losePetal();
  }

  /** R: the ice wave (Shikai) / Sennen Hyōrō (Bankai). */
  skill3(): void {
    if (this.form === 'shikai') this.special(new WaveAction(this, 18), 16, 'wave', 4);
    else if (this.form === 'bankai') {
      const t = this.target();
      if (!t || t.pos.distanceTo(this.f.pos) > 30) return;
      if (this.special(new HyoroAction(this, t), 34, 'hyoro', 12)) {
        this.losePetal();
        this.losePetal();
      }
    }
  }

  /** G: Hyōten Hyakkasō (Bankai). */
  toggle(): void {
    if (this.form !== 'bankai') return;
    const t = this.target();
    if (!t || t.pos.distanceTo(this.f.pos) > 45) return;
    if (this.special(new HyakkasoAction(this, t), 45, 'hyakkaso', 18)) {
      this.losePetal();
      this.losePetal();
    }
  }

  release(): void {
    const f = this.f;
    if (this.form === 'bankai' || f.busy) return;
    if (this.form === 'shikai' && this.cd.bankai > 0) {
      if (f === this.g.player) this.g.hud?.showBanner('Bankai not ready');
      return;
    }
    if (!f.spendRei(this.form === 'sealed' ? 30 : 50)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(new ReleaseAction(this, this.form === 'shikai'), true);
  }

  toggleFlare(): void {
    this.flare = !this.flare;
    this.applyStats();
    if (this.flare) {
      this.f.aura.flare(1.6, 0.4);
      this.g.shake(0.2);
      this.g.sfx.play('flare', this.f.center());
      frostWorld(this.g, this.f.pos.clone().setY(this.f.pos.y + 0.3), 2.5, 900);
    }
  }

  /** The storm his release draws over the sky. */
  raiseStorm(): void {
    if (this.storm && !this.storm.done) {
      this.storm.target = 1;
      return;
    }
    const s = new Storm(this.g, () => this.f.pos) as Storm & { flash: () => void };
    s.flash = () => {
      s.level = Math.max(0, s.level - 0.4);
    };
    this.storm = s;
    this.g.addProjectile(s);
  }

  becomeShikai(): void {
    const { f, g } = this;
    if (this.form !== 'sealed') return;
    this.form = 'shikai';
    this.makeChain();
    this.burst(0.8);
    g.callout('霜天に坐せ「氷輪丸」', 'SŌTEN NI ZASE, HYŌRINMARU', '#bfefff');
    // the release itself looses a dragon
    const tgt = this.target();
    if (tgt && tgt.pos.distanceTo(f.pos) < 40) g.addProjectile(new IceDragon(g, f, bladeTip(f), f.forward(), () => tgt, { speed: 28, damage: 60, scale: 1, life: 2.2 }));
    this.applyStats();
  }

  becomeBankai(): void {
    const { f, g } = this;
    if (this.form !== 'shikai') return;
    this.form = 'bankai';
    this.petals = 12;
    this.petalT = 0;
    this.dropChain();
    f.def = { ...f.def, stance: DAIGUREN_STANCE, speed: { ...SPEED_BANKAI } };
    f.setForm({ asset: this.bankaiAsset(), props: [] }, AURA_DAIGUREN, BLADE);
    f.visual.attach('sword', hitsugayaProp('bankai-sword'), 'grip.R');
    f.bladeValid = false;
    this.setHands();
    f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.25);
    this.burst(1.2);
    frostWorld(g, f.pos.clone().setY(f.pos.y + 0.4), 6, 4000);
    g.callout('卍解「大紅蓮氷輪丸」', 'BANKAI — DAIGUREN HYŌRINMARU', '#bfefff');
    this.applyStats();
  }

  /** The last petal has fallen: the ice breaks away and he is back in Shikai. */
  endBankai(): void {
    const { f, g } = this;
    if (this.form !== 'bankai') return;
    this.form = 'shikai';
    this.cd.bankai = 25;
    this.flapping = false;
    f.hovering = false;
    const c = f.center();
    g.addProjectile(new GlassShards(g, c, new THREE.Vector3(1.6, 0.9, 0.8), 80, 5, 1.8, f.pos.y, ICE_TINT, 1.2));
    g.sfx.play('shatter', c, 1.4);
    f.def = { ...f.def, stance: HITSUGAYA_STANCE, speed: { ...HITSUGAYA_DEF.speed } };
    f.setForm({ asset: this.captainAsset(), props: [] }, AURA_HITSUGAYA, BLADE);
    f.visual.attach('sword', hitsugayaProp('sword'), 'grip.R');
    f.bladeValid = false;
    this.setHands();
    this.makeChain();
    g.callout('卍解解除', 'THE LAST PETAL FALLS', '#a89be3');
    this.applyStats();
  }

  /** A petal of the ice flowers crumbles away. */
  losePetal(): void {
    const { f, g } = this;
    if (this.form !== 'bankai' || this.petals <= 0) return;
    this.petals--;
    const idx = this.petals;
    const rig = f.visual.rig;
    const bi = rig.index(`petal.${idx}`);
    if (bi >= 0) {
      const p = rig.bones[bi].getWorldPosition(new THREE.Vector3());
      rig.setBoneVisible(`petal.${idx}`, false);
      g.addProjectile(new GlassShards(g, p, new THREE.Vector3(0.12, 0.12, 0.05), 8, 1.5, 1.2, f.pos.y, '#A89BE3', 0.5));
    }
    if (this.petals === 0) this.endBankai();
  }

  protected makeChain(): void {
    const { f, g } = this;
    this.dropChain();
    const anchor = () => {
      const s = f.visual.props.get('sword');
      if (!s) return f.center();
      s.updateMatrixWorld(true);
      return POMMEL.clone().applyMatrix4(s.matrixWorld);
    };
    const ch = new SickleChain(g, anchor) as SickleChain & { anchorPos: () => THREE.Vector3 };
    ch.anchorPos = anchor;
    this.sickle = ch;
    g.addProjectile(ch);
  }

  protected dropChain(): void {
    if (this.sickle) this.sickle.done = true;
    this.sickle = null;
  }

  protected burst(k: number): void {
    const { f, g } = this;
    f.aura.pillarBurst(2.2 * k);
    f.aura.flare(2 * k, 1);
    g.sfx.play('bankai', f.center());
    g.shake(0.7 * k);
    g.hitstop(0.06);
    g.slowMo(0.35 * k, 0.35);
    g.engine.gr.chroma.offset.set(0.005, 0.005);
    g.addRing(f.pos.clone(), 18 * k, '#BFEFFF', 0.8);
    for (const o of g.enemiesOf(f)) {
      const d = o.pos.distanceTo(f.pos);
      if (d < 10) g.damage(o, 20 * (1 - d / 10), f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 18 * (1 - d / 10), launch: 5, heavy: true });
    }
    const c = f.center();
    for (let i = 0; i < 50; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: Math.cos(a) * (5 + Math.random() * 8), vy: 2 + Math.random() * 8, vz: Math.sin(a) * (5 + Math.random() * 8), size: 0.3, sizeEnd: 0.05, life: 0.9, r: 0.85, g: 0.96, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 1.2 });
      g.engine.dust.spawn({ x: f.pos.x, y: f.pos.y + 0.3, z: f.pos.z, vx: Math.cos(a) * 11, vy: Math.random() * 2, vz: Math.sin(a) * 11, size: 0.8, sizeEnd: 2.6, life: 1.1, r: 0.9, g: 0.96, b: 1, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
    }
  }

  protected applyStats(): void {
    const f = this.f;
    f.power = (this.form === 'bankai' ? 1.5 : this.form === 'shikai' ? 1.2 : 1) * (this.flare ? 1.25 : 1);
    f.damageTaken = this.form === 'bankai' ? 0.8 : 0.95;
    f.toughness = this.form === 'bankai' ? 12 : 0;
    f.aura.target = this.flare ? 0.9 : this.form === 'bankai' ? 0.4 : this.form === 'shikai' ? 0.2 : 0.06;
  }

  formName(): string {
    return this.form === 'bankai' ? `Bankai — Daiguren Hyōrinmaru · ${this.petals} petals` : this.form === 'shikai' ? 'Shikai — Hyōrinmaru' : 'Captain, 10th Division';
  }

  ai(): KitAI {
    return {
      reach: 1.6,
      chain: 3,
      releaseAt: [0.85, 0.5],
      ranged: () => this.form === 'shikai',
      opener: () => {
        if (!this.drawn && !this.f.busy) this.f.act(new DrawAction(this), true);
      },
      moves: [
        { name: 'frost', use: () => this.skill1(), min: 0, max: 3.5, weight: 1.5, cd: 5, when: () => this.form === 'sealed' },
        { name: 'wave', use: () => this.skill2(), min: 3, max: 9, weight: 1.6, cd: 4, when: () => this.form === 'sealed' },
        { name: 'dragon', use: () => this.skill1(), min: 4, max: 45, weight: 2.4, cd: 2.8, when: () => this.form === 'shikai' },
        { name: 'chain', use: () => this.skill2(), min: 3, max: 16, weight: 1.6, cd: 4, when: () => this.form === 'shikai' },
        { name: 'wave2', use: () => this.skill3(), min: 3, max: 18, weight: 1.6, cd: 4, when: () => this.form === 'shikai' },
        { name: 'thrust', use: () => this.heavy(), min: 0, max: 3, weight: 1.2, cd: 3, when: () => this.form !== 'bankai' },
        { name: 'tsurara', use: () => this.skill1(), min: 5, max: 40, weight: 2, cd: 5, when: () => this.form === 'bankai' },
        { name: 'senbi', use: () => this.skill2(), min: 3, max: 35, weight: 2, cd: 4, when: () => this.form === 'bankai' },
        { name: 'hyoro', use: () => this.skill3(), min: 3, max: 25, weight: 1.4, cd: 12, when: () => this.form === 'bankai' },
        { name: 'hyakkaso', use: () => this.toggle(), min: 5, max: 40, weight: 1, cd: 20, when: () => this.form === 'bankai' },
        { name: 'ryusenka', use: () => this.heavy(), min: 0, max: 2.6, weight: 1.6, cd: 4, when: () => this.form === 'bankai' },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const fm = this.form;
    const list: AbilityInfo[] = [
      { key: 'LMB', name: fm === 'bankai' ? 'Dragon arm' : this.drawn ? 'Nodachi' : 'Draw', kanji: fm === 'bankai' ? '氷' : '斬' },
      fm === 'bankai' ? { key: 'RMB', name: 'Ryūsenka', kanji: '竜霰', cost: 12, cd: this.cd.heavy, cdMax: 3.5 } : { key: 'RMB', name: fm === 'shikai' ? 'Dragon burst' : 'Thrust', kanji: fm === 'shikai' ? '龍' : '突', cost: fm === 'shikai' ? 12 : 6, cd: this.cd.heavy, cdMax: 2 },
      fm === 'sealed' ? { key: 'Q', name: 'Frost', kanji: '霜', cost: 14, cd: this.cd.frost, cdMax: 5 } : fm === 'shikai' ? { key: 'Q', name: 'Ice dragon', kanji: '氷竜', cost: 20, cd: this.cd.dragon, cdMax: 2.6 } : { key: 'Q', name: 'Gunchō Tsurara', kanji: '群鳥', cost: 22, cd: this.cd.tsurara, cdMax: 5 },
      fm === 'sealed' ? { key: 'E', name: 'Ice wave', kanji: '氷波', cost: 12, cd: this.cd.wave, cdMax: 3.5 } : fm === 'shikai' ? { key: 'E', name: 'Chain sickle', kanji: '鎖', cost: 14, cd: this.cd.chain, cdMax: 3.5 } : { key: 'E', name: 'Hyōryū Senbi', kanji: '旋尾', cost: 18, cd: this.cd.senbi, cdMax: 4 },
    ];
    if (fm === 'shikai') list.push({ key: 'R', name: 'Ice wave', kanji: '氷波', cost: 16, cd: this.cd.wave, cdMax: 4 });
    if (fm === 'bankai') list.push({ key: 'R', name: 'Sennen Hyōrō', kanji: '氷牢', cost: 34, cd: this.cd.hyoro, cdMax: 12 }, { key: 'G', name: 'Hyakkasō', kanji: '百華', cost: 45, cd: this.cd.hyakkaso, cdMax: 18 });
    list.push(
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      fm === 'bankai' ? { key: 'F', name: `${this.petals} petals`, kanji: '華', active: true, tint: '#a89be3' } : { key: 'F', name: fm === 'sealed' ? 'Shikai' : 'Bankai', kanji: fm === 'sealed' ? '霜天' : '卍解', cost: fm === 'sealed' ? 30 : 50, cd: fm === 'shikai' ? this.cd.bankai : 0, cdMax: 25, tint: '#bfefff' },
    );
    return list;
  }
}
