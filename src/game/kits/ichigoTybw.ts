// TYBW Ichigo's kit (docs/kits/ichigo.md §4 TYBW; dossier A1 §1 J-L). The true Shikai: the large blade (Hollow and
// Shinigami) in the right hand, the small one (the Quincy power) in the left — the six-cut twin string that ends by
// hurling the foe through buildings, the descent out of the sky, Chain (the large blade thrown and beckoned home),
// the small Getsuga flicked off the point (three charges), the large Getsuga (point-blank: impale and fire),
// Getsuga Jūjishō, and Blut Vene (G). F soaks the large blade in Quincy reiatsu: Half-Hollowfication — the horn, the
// white blade, the sword-arm lock, Gran Rey Cero off the horn (paid in blood), Cero Creciente; the horn is a weak
// point. G there wakes Blood Chains [anime-only]: the blood moon, clones from every Shunpo, echo hits, the chain wall,
// the bind, the black crescent left in the sky. F again: True Bankai — the colossal white cleaver, the golden
// Getsuga, the golden cleave, the guard, and the Shell Break: the shell falls away and the original Zangetsu cuts.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { Game } from '../game';
import type { AbilityInfo } from '../../ui/hud';
import type { Kit, KitAI } from './kit';
import { BANKAI_BASE_Z, BANKAI_TIP_Z, CHAINS_TIP_Z, TYBW_LARGE_TIP_Z, TYBW_SMALL_BASE_Z, TYBW_SMALL_TIP_Z, bankaiShell, tybwAsset, tybwBlade, type TybwBlade, type TybwForm } from '../../chars/ichigoTybw';
import { BANKAI_CHAIN, CHAINS_CHAIN, HOLLOW_CHAIN, TRUE_BANKAI_STANCE, TYBW_CHAIN, TYBW_CLIPS, TYBW_STANCE } from '../../chars/ichigoTybwClips';
import { ichigoSword } from '../../chars/ichigo';
import type { AuraStyle } from '../../vfx/aura';
import { GetsugaProjectile } from '../projectiles/getsuga';
import { CeroBeam } from '../projectiles/cero';
import { OffBlade } from '../offBlade';
import { DuelistAI } from '../ai/duelist';
import { Plow } from '../../vfx/engetsu';
import { ShardBurst } from '../../vfx/shards';
import { SphereShape } from '../../destruction/shapes';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from '../../vfx/sprites';
import {
  BLUT_CYAN, CHAIN_RED, CRECIENTE_VIOLET, ChainBind, ChainBlade, ChainWall, CrossGetsuga, Eclipse, GETSUGA_BLOOD, GETSUGA_GOLD_TY, GETSUGA_WHITE_GOLD,
  PlanarSlash, SKY_BLOOD, SKY_ECLIPSE, SkyCrescent, chainFlames, footprint, veinFlash,
} from '../../vfx/tybw';

type Form = 'shikai' | 'hollow' | 'chains' | 'bankai';
type BladeDef = NonNullable<FighterDef['blade']>;

/** gold reiatsu, solid and visible when he readies for battle */
export const AURA_TYBW: AuraStyle = { core: '#FFFBE6', body: '#F6C343', rim: '#C6923D' };
/** Half-Hollow: the violet of the Gran Rey Cero over black */
export const AURA_HALF_HOLLOW: AuraStyle = { core: '#F6E6FF', body: '#9B30FF', rim: '#5A0FA0', dark: '#0A0810' };
/** Blood Chains [anime-only] */
export const AURA_BLOOD_CHAINS: AuraStyle = { core: '#FFD0B8', body: '#E8261E', rim: '#8A0A12', dark: '#050203' };
/** True Bankai: gold and white */
export const AURA_TRUE_BANKAI: AuraStyle = { core: '#FFFFFF', body: '#FDE671', rim: '#C6923D' };

const BLADE_LARGE: BladeDef = { prop: 'sword', base: [0, 0, 0.14], tip: [0, 0, TYBW_LARGE_TIP_Z], color: '#F6C343', core: '#FFFBE6' };
const BLADE_WHITE: BladeDef = { prop: 'sword', base: [0, 0, 0.14], tip: [0, 0, TYBW_LARGE_TIP_Z], color: '#B48CFF', core: '#F6E6FF' };
const BLADE_CHAINS: BladeDef = { prop: 'sword', base: [0, 0, 0.13], tip: [0, 0, CHAINS_TIP_Z], color: '#E8261E', core: '#FFD0B8' };
const BLADE_TRUE: BladeDef = { prop: 'sword', base: [0, 0, BANKAI_BASE_Z], tip: [0, 0, BANKAI_TIP_Z], color: '#FDE671', core: '#FFFFFF' };
const BLADE_ORIGINAL: BladeDef = { prop: 'sword', base: [0, 0, 0.16], tip: [0, 0, 1.56], color: '#FDE671', core: '#FFFFFF' };

const SPEED: Record<Form, FighterDef['speed']> = {
  shikai: { run: 12.5, sprint: 28, jump: 13, dash: 16, dashTime: 0.12 },
  hollow: { run: 14, sprint: 32, jump: 14, dash: 21, dashTime: 0.1 },
  chains: { run: 15, sprint: 34, jump: 14.5, dash: 23, dashTime: 0.1 },
  bankai: { run: 13.5, sprint: 30, jump: 13.5, dash: 18, dashTime: 0.12 },
};
const POWER: Record<Form, number> = { shikai: 1.3, hollow: 1.6, chains: 1.8, bankai: 1.95 };
const TAKEN: Record<Form, number> = { shikai: 0.9, hollow: 0.78, chains: 0.72, bankai: 0.68 };

/** small Getsuga: charges and the time each takes to come back */
const FLICK_CHARGES = 3;
const FLICK_REFILL = 1.1;
/** Blut Vene: the longest it holds, and its drain per second */
const BLUT_MAX = 12;
const BLUT_DRAIN = 5;
/** heavy damage the horn takes before it snaps */
const HORN_HP = 240;
/** Blood Chains: the most clones at once */
const MAX_CLONES = 8;

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

export const TYBW_DEF: FighterDef = {
  id: 'ichigo-tybw',
  name: 'Kurosaki Ichigo',
  title: 'Substitute Shinigami · TYBW',
  build: () => ({
    asset: tybwAsset('shikai'),
    props: [
      { key: 'sword', model: tybwBlade('large'), socket: 'grip.R' },
      { key: 'sword2', model: tybwBlade('small'), socket: 'grip.L' },
    ],
  }),
  stance: TYBW_STANCE,
  clips: TYBW_CLIPS,
  aura: AURA_TYBW,
  blade: BLADE_LARGE,
  hp: 1150,
  rei: 200,
  speed: { ...SPEED.shikai },
  radius: 0.4,
  height: 1.81,
};

const spec = (damage: number, knock: number, cut: number, extra: Partial<BladeSpec> = {}): BladeSpec => ({ damage, knock, launch: 0, hitstop: 0.05, shake: 0.12, cut, ...extra });

interface Cut {
  /** which blade cuts: the large (right), the small (left) or both */
  hand: 'R' | 'L' | 'both';
  window: [number, number];
  spec: BladeSpec;
  /** forward / up impulse at 'step' */
  lunge?: [number, number];
  /** ground impact at 'fx' */
  impact?: { radius: number; power: number };
  /** Half-Hollow: the swing's shock runs on through what stands behind */
  wake?: boolean;
}

const CUTS: Record<string, Cut> = {
  ty_s1: { hand: 'R', window: [0.1, 0.24], spec: spec(30, 6, 420), lunge: [7, 0] },
  ty_s2: { hand: 'L', window: [0.06, 0.18], spec: spec(18, 4, 220, { reach: 0.24 }), lunge: [8, 0] },
  ty_s3: { hand: 'R', window: [0.09, 0.22], spec: spec(30, 6, 420, { launch: 4 }), lunge: [6, 0] },
  ty_s4: { hand: 'L', window: [0.1, 0.25], spec: spec(20, 3, 220, { launch: 6, reach: 0.3 }), lunge: [5, 0] },
  ty_s5: { hand: 'both', window: [0.14, 0.3], spec: spec(24, 8, 380, { hitstop: 0.07, shake: 0.25 }), lunge: [6, 0] },
  ty_s6: { hand: 'R', window: [0.22, 0.36], spec: spec(52, 16, 560, { launch: 6, heavy: true, hitstop: 0.12, shake: 0.5 }), lunge: [6, 6], impact: { radius: 2.2, power: 150 } },
  // the small blade alone while the large one is out on its chain
  ty_s2b: { hand: 'L', window: [0.06, 0.18], spec: spec(20, 4, 220, { reach: 0.24 }), lunge: [8, 0] },
  ty_s4b: { hand: 'L', window: [0.1, 0.25], spec: spec(22, 3, 220, { launch: 6, reach: 0.3 }), lunge: [5, 0] },
};

/** Half-Hollow: the white blade, every swing's shock running on through what stands behind */
const CUTS_HOLLOW: Record<string, Cut> = {
  slash1: { hand: 'R', window: [0.1, 0.24], spec: spec(34, 8, 600), lunge: [8, 0], wake: true },
  slash2: { hand: 'R', window: [0.09, 0.22], spec: spec(34, 8, 600, { launch: 4 }), lunge: [7, 0], wake: true },
  slash4: { hand: 'R', window: [0.08, 0.47], spec: spec(22, 10, 500, { launch: 2 }), lunge: [5, 0], wake: true },
  slash3: { hand: 'R', window: [0.21, 0.31], spec: spec(46, 8, 700, { launch: 7, hitstop: 0.09, shake: 0.4 }), lunge: [7, 0], impact: { radius: 1.8, power: 160 }, wake: true },
  slash5: { hand: 'R', window: [0.34, 0.47], spec: spec(66, 20, 900, { launch: 6, heavy: true, hitstop: 0.14, shake: 0.7 }), lunge: [8, 9], impact: { radius: 2.6, power: 220 }, wake: true },
};

/** Blood Chains: the silver cleaver; each hit schedules its echo */
const CUTS_CHAINS: Record<string, Cut> = {
  slash1: { hand: 'R', window: [0.1, 0.24], spec: spec(34, 6, 600), lunge: [9, 0] },
  slash2: { hand: 'R', window: [0.09, 0.22], spec: spec(34, 6, 600, { launch: 3 }), lunge: [8, 0] },
  slash3: { hand: 'R', window: [0.21, 0.31], spec: spec(50, 6, 700, { launch: 7, hitstop: 0.09, shake: 0.4 }), lunge: [8, 0], impact: { radius: 1.8, power: 160 } },
  slash4: { hand: 'R', window: [0.08, 0.47], spec: spec(24, 9, 500, { launch: 2 }), lunge: [5, 0] },
  slash5: { hand: 'R', window: [0.34, 0.47], spec: spec(70, 20, 900, { launch: 6, heavy: true, hitstop: 0.14, shake: 0.7 }), lunge: [8, 9], impact: { radius: 2.6, power: 220 } },
};

/** True Bankai: three colossal swings */
const CUTS_BANKAI: Record<string, Cut> = {
  bk_s1: { hand: 'R', window: [0.26, 0.44], spec: spec(70, 14, 1300, { launch: 2, heavy: true, hitstop: 0.12, shake: 0.5, reach: 0.5, thick: 0.16 }), lunge: [6, 0] },
  bk_s2: { hand: 'R', window: [0.3, 0.46], spec: spec(80, 14, 1300, { launch: 4, heavy: true, hitstop: 0.12, shake: 0.5, reach: 0.5, thick: 0.16 }), lunge: [6, 0] },
  bk_s3: { hand: 'R', window: [0.4, 0.56], spec: spec(110, 18, 1600, { launch: 6, heavy: true, hitstop: 0.16, shake: 0.8, reach: 0.5, thick: 0.18 }), lunge: [6, 4], impact: { radius: 3.2, power: 300 } },
};

/** the original Zangetsu, out of the broken shell */
const CUTS_ORIGINAL: Record<string, Cut> = {
  slash1: { hand: 'R', window: [0.1, 0.24], spec: spec(40, 8, 800), lunge: [9, 0] },
  slash2: { hand: 'R', window: [0.09, 0.22], spec: spec(40, 8, 800, { launch: 4 }), lunge: [8, 0] },
  slash3: { hand: 'R', window: [0.21, 0.31], spec: spec(58, 8, 1000, { launch: 7, hitstop: 0.1, shake: 0.4 }), lunge: [8, 0], impact: { radius: 2, power: 200 } },
  slash4: { hand: 'R', window: [0.08, 0.47], spec: spec(28, 10, 700, { launch: 2 }), lunge: [5, 0] },
  slash5: { hand: 'R', window: [0.34, 0.47], spec: spec(84, 22, 1200, { launch: 6, heavy: true, hitstop: 0.16, shake: 0.8 }), lunge: [8, 9], impact: { radius: 2.8, power: 260 } },
};

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

/** Where a skill aims: the lock target, the camera ray for the player, else straight ahead. */
function aimAt(f: Fighter, g: Game, out = new THREE.Vector3()): THREE.Vector3 {
  if (f.faceTarget) return out.copy(f.faceTarget);
  if (f === g.player) return g.aimPoint(f, out);
  return f.center(out).addScaledVector(f.forward(), 30);
}

function groundBelow(g: Game, p: THREE.Vector3, depth = 40): number | null {
  const w = g.engine.world, vs = w.vs;
  const x = Math.floor(p.x / vs), z = Math.floor(p.z / vs);
  for (let y = Math.floor((p.y + 0.3) / vs); y > Math.floor((p.y - depth) / vs); y--) if (w.isSolid(x, y, z)) return (y + 1) * vs;
  return null;
}

// ------------------------------------------------------------------------------------------------ the cuts

/** One cut of a string (any form): the large blade, the small one, or both. */
class CutAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private impacted = false;
  private swished = false;
  private woke = false;
  private stopAt = 0;
  private dashed = false;
  queued = false;

  constructor(readonly kit: TybwKit, readonly clip: string, readonly index: number, readonly info: Cut) {
    super();
    this.name = clip;
    this.mobility = 0.12;
    this.airGravity = 0.12;
  }

  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip.replace(/b$/, ''))!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    const sp = this.kit.withEcho(this.info.spec);
    f.bladeHits.clear();
    f.bladeSpec = sp;
    // out of reach: dash in so the arc arrives as the window opens
    const tgt = f.faceTarget;
    if (this.info.lunge && tgt) {
      const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
      // the colossal cleaver stops further out, the short blade closer in
      this.stopAt = this.kit.form === 'bankai' && !this.kit.shellBroken ? 2 : this.info.hand === 'L' ? 1.05 : 1.3;
      if (d > this.stopAt + 0.25) {
        const per = (1 - Math.exp(-f.pushDrag * Math.max(0.06, this.info.window[0]))) / f.pushDrag;
        f.push.addScaledVector(f.forward(), Math.min(26, (d - this.stopAt) / per));
        this.dashed = true;
      }
    }
    f.anim.play(this.clip.replace(/b$/, ''), {
      onEvent: (n) => {
        if (n === 'step' && this.info.lunge) {
          if (!this.dashed) f.push.addScaledVector(f.forward(), this.info.lunge[0]);
          if (this.info.lunge[1] > 0 && f.grounded) f.push.y = this.info.lunge[1];
        }
        if (n === 'fx' && this.info.impact && !this.impacted) {
          this.impacted = true;
          const tip = f.blade.tip.clone();
          const gy = groundBelow(g, tip, 2.5);
          if (gy !== null && tip.y - gy < 1.4) {
            tip.y = gy;
            g.groundImpact(tip, this.info.impact.radius, this.info.impact.power, f.def.aura.body, f);
            g.shake(this.info.spec.shake);
          }
        }
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
    const [w0, w1] = this.info.window;
    if (!this.swished && t >= w0 - 0.03) {
      this.swished = true;
      g.sfx.play(this.info.spec.damage >= 40 ? 'swingHeavy' : 'swing', f.center());
    }
    const open = t >= w0 && t <= w1;
    if (this.info.hand !== 'L') {
      f.bladeActive = open;
      if (f.trail) f.trail.emitting = t >= w0 - 0.02 && t <= w1 + 0.06;
    }
    if (this.info.hand !== 'R') {
      const off = this.kit.off;
      if (open && !off.active) off.open(this.kit.withEcho(this.info.spec));
      else if (!open && off.active) off.close();
    }
    // Half-Hollow: the shock of the white blade runs on past the foe
    if (this.info.wake && !this.woke && t >= w0 + 0.03) {
      this.woke = true;
      this.kit.wake(this.info.spec.damage);
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
    this.kit.off.close();
  }

  override canCancel(next: FighterAction): boolean {
    if (next.name === 'dash' || next instanceof SkillAction) return this.t >= this.info.window[0] + 0.06;
    return false;
  }
}

/** Base for the one-shot skills: plays a clip, ends with it. */
abstract class SkillAction extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: TybwKit) {
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
    this.kit.off.close();
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t > this.dur * 0.7;
  }
}

/** The 6th cut at close quarters: the left hand seizes the foe and hurls him away — through whatever stands behind. */
class HurlAction extends SkillAction {
  readonly name = 'hurl';
  private held: Fighter | null = null;
  constructor(kit: TybwKit, readonly target: Fighter) {
    super(kit);
    this.armor = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ty_hurl', (n) => {
      if (n === 'grab') {
        const o = this.target;
        if (!o.dead && o.pos.distanceTo(f.pos) < 2.6) {
          this.held = o;
          o.stopAction();
          o.hitstun = Math.max(o.hitstun, 0.6);
          g.damage(o, 12, f, f.forward(_v).clone(), { knock: 0, hitstop: 0.06 });
          g.sfx.play('hitHeavy', o.center(), 0.7);
        }
      }
      if (n === 'throw' && this.held) {
        const o = this.held;
        this.held = null;
        const fw = f.forward(_v).clone();
        g.damage(o, 48, f, fw, { knock: 0, launch: 4, heavy: true, hitstop: 0.12, shake: 0.5 });
        if (!o.def.boss && !o.dead) {
          o.push.x += fw.x * 52;
          o.push.z += fw.z * 52;
          o.push.y = Math.max(o.push.y, 4);
          g.addProjectile(new Plow(o, 0.9));
        }
        g.sfx.play('swingHeavy', f.center(), 1.2);
        g.shake(f === g.player ? 0.4 : 0.15);
      }
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    // the held foe hangs from the left fist
    const o = this.held;
    if (o) {
      const p = sock(f, 'grip.L', _v);
      o.body.pos.set(p.x, Math.max(o.body.pos.y, p.y - o.def.height * 0.75), p.z);
      o.body.vel.set(0, 0, 0);
      o.hitstun = Math.max(o.hitstun, 0.2);
    }
  }
}

/** Out of the sky from high up: both blades point down, he drops like a stone and craters the ground. */
class DescentAction extends FighterAction {
  readonly name = 'descent';
  private landed = -1;
  private floor = -Infinity;
  constructor(readonly kit: TybwKit) {
    super();
    this.mobility = 0.4;
    this.airGravity = 1;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('ty_descent', { hold: true });
    f.body.vel.y = Math.min(f.body.vel.y, -30);
    this.floor = groundBelow(g, f.pos, 80) ?? -Infinity;
    g.sfx.play('shunpo', f.center(), 1);
    f.bladeHits.clear();
    f.bladeSpec = spec(40, 6, 500, { launch: 4 });
    this.kit.off.open(spec(30, 6, 400, { launch: 4 }));
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.landed < 0) {
      f.bladeActive = true;
      if (Math.random() < 0.6) g.engine.glow.spawn({ x: f.pos.x, y: f.pos.y + 1, z: f.pos.z, vy: 8, size: 0.4, sizeEnd: 0.05, life: 0.25, r: 1, g: 0.85, b: 0.4, alpha: 0.7, alphaEnd: 0, tex: TEX_STREAK, stretch: 4 });
      if (f.grounded || f.pos.y <= this.floor + 0.08 || this.t > 3) this.land(f, g);
    } else if (this.t - this.landed > 0.55) this.done = true;
  }
  private land(f: Fighter, g: Game): void {
    this.landed = this.t;
    f.bladeActive = false;
    this.kit.off.close();
    f.anim.play('ty_land', { fadeIn: 0.02 });
    const p = f.pos.clone();
    g.groundImpact(p, 3.2, 260, f.def.aura.body, f);
    g.engine.destruction.carve(new SphereShape(p.clone(), 2.8, 0.5), { mode: 'smash', power: 300, impulse: 14, dust: 1.2 });
    g.addRing(p.clone().setY(p.y + 0.1), 9, f.def.aura.body, 0.45);
    g.sfx.play('impact', p, 1.4);
    g.shake(f === g.player ? 0.8 : 0.3);
    g.hitstop(0.1);
    for (const o of g.enemiesOf(f)) {
      const d = o.pos.distanceTo(p);
      if (d < 5) g.damage(o, 90 * (1 - d / 7), f, o.pos.clone().sub(p).setY(0).normalize(), { knock: 14, launch: 8, heavy: true, hitstop: 0.1 });
    }
  }
  override end(f: Fighter): void {
    f.bladeActive = false;
    this.kit.off.close();
  }
}

/** RMB (Shikai): Chain — the large blade hurled; it buries itself in the foe or a wall. */
class ChainThrowAction extends SkillAction {
  readonly name = 'chainthrow';
  private thrown = false;
  constructor(kit: TybwKit) {
    super(kit);
    this.mobility = 0.35;
    this.armor = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ig_throw', (n) => {
      if (n === 'step') g.sfx.play('swingHeavy', f.center(), 1.1);
      if (n !== 'throw' || this.thrown) return;
      this.thrown = true;
      const from = this.kit.handWorld(new THREE.Vector3());
      const tgt = aimAt(f, g);
      this.kit.throwChain(from, tgt);
    });
  }
  override canCancel(next: FighterAction): boolean {
    return this.thrown && (next.name === 'dash' || next instanceof CutAction || next instanceof SkillAction);
  }
}

/** RMB again: the beckoning gesture — the blade flies home, cutting what lies between. */
class BeckonAction extends SkillAction {
  readonly name = 'beckon';
  constructor(kit: TybwKit) {
    super(kit);
    this.mobility = 0.5;
  }
  override start(f: Fighter): void {
    this.playClip(f, 'ty_beckon', (n) => {
      if (n === 'call') this.kit.chainBlade?.beckon();
    });
  }
  override canCancel(): boolean {
    return true;
  }
}

/** Q (Shikai): the small blade pointed and flicked — a quick crescent. */
class FlickAction extends SkillAction {
  readonly name = 'flick';
  constructor(kit: TybwKit) {
    super(kit);
    this.mobility = 0.3;
    this.airGravity = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ty_flick', (n) => {
      if (n !== 'fx') return;
      const from = this.kit.off.tip.clone();
      const dir = aimAt(f, g).sub(from).normalize();
      const side = new THREE.Vector3(-dir.z, 0.6, dir.x).normalize();
      g.addProjectile(new GetsugaProjectile(g, f, from.addScaledVector(dir, 0.4), dir, side, { radius: 1.6, halfAngle: 1.05, speed: 70, range: 60, damage: 28, cut: 380, colors: GETSUGA_GOLD_TY }));
      g.sfx.play('getsuga', from, 0.6);
      g.callout('月牙天衝', 'GETSUGA TENSHŌ', '#ffd86a');
    });
  }
  override canCancel(next: FighterAction): boolean {
    return this.t > 0.16 && (next.name === 'dash' || next instanceof FlickAction || next instanceof CutAction);
  }
}

/** A Getsuga swung off the large blade (Q in Half-Hollow, E in Shikai) — point-blank: impale, then fire through. */
class GetsugaAction extends SkillAction {
  readonly name = 'getsuga';
  constructor(kit: TybwKit, readonly big: { radius: number; speed: number; range: number; damage: number; cut: number; colors: typeof GETSUGA_GOLD_TY; dark?: boolean; callout?: [string, string, string]; clip?: string; hold?: number }) {
    super(kit);
    this.mobility = 0.05;
    this.airGravity = 0.05;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    const b = this.big;
    this.playClip(f, b.clip ?? 'getsuga', (n) => {
      if (n === 'charge') {
        f.aura.flare(1.4, 0.55);
        this.kit.glowBlade(1, b.colors.body);
        if (b.callout) g.callout(...b.callout);
        g.sfx.play('flare', f.center(), 0.6);
      }
      if (n !== 'fx') return;
      const dir = aimAt(f, g).sub(f.center()).normalize();
      const flat = Math.hypot(dir.x, dir.z) || 1;
      dir.y = Math.max(f.faceTarget ? -0.5 : -0.06, Math.min(0.6, dir.y / flat)) * flat;
      dir.normalize();
      const right = new THREE.Vector3(dir.z, 0, -dir.x).normalize().multiplyScalar(-1);
      const side = new THREE.Vector3(0, 1, 0).multiplyScalar(Math.cos(0.7)).addScaledVector(right, Math.sin(0.7));
      const origin = f.center().addScaledVector(dir, 1.2);
      origin.y += 0.35;
      g.addProjectile(new GetsugaProjectile(g, f, origin, dir, side, { radius: b.radius, halfAngle: 1.15, speed: b.speed, range: b.range, damage: b.damage, cut: b.cut, colors: b.colors, dark: b.dark }));
      g.shake(f === g.player ? 0.5 : 0.2);
      g.hitstop(0.06);
      g.sfx.play(b.dark ? 'getsugaBlack' : 'getsuga', origin, 1.1);
      f.aura.flare(1.8, 0.4);
      g.engine.gr.chroma.offset.set(0.004, 0.004);
      if (f === g.player) g.cam.punchFov(6);
      f.push.addScaledVector(dir, -3);
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (f.trail) f.trail.emitting = this.t > 0.42 && this.t < 0.66;
    if (this.t > 0.62) this.kit.glowBlade(Math.max(0, 1 - (this.t - 0.62) * 3));
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.glowBlade(0);
  }
}

/** Point-blank: the blade driven into the foe, then a Getsuga fired from inside the wound. */
class ImpaleAction extends SkillAction {
  readonly name = 'impale';
  private stabbed = false;
  private fired = false;
  constructor(kit: TybwKit, readonly target: Fighter, readonly o: { stab: number; blast: number; colors: typeof GETSUGA_GOLD_TY; dark?: boolean }) {
    super(kit);
    this.mobility = 0.05;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ig_thrust', (n) => {
      if (n === 'step') f.push.addScaledVector(f.forward(), 9);
      if (n !== 'fx' || this.stabbed) return;
      this.stabbed = true;
      const o = this.target;
      if (!o.dead && o.pos.distanceTo(f.pos) < 3.4) {
        g.damage(o, this.o.stab, f, f.forward(_v).clone(), { knock: 0, hitstop: 0.12, shake: 0.4, heavy: true });
        o.stopAction();
        o.hitstun = Math.max(o.hitstun, 0.7);
        o.push.set(0, 0, 0);
      }
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.stabbed && !this.fired && this.t > 0.52) {
      this.fired = true;
      const o = this.target;
      const dir = f.forward(_v).clone();
      const from = o.dead ? f.center().addScaledVector(dir, 1.5) : o.center().addScaledVector(dir, -0.6);
      const side = new THREE.Vector3(0, 1, 0);
      g.addProjectile(new GetsugaProjectile(g, f, from, dir, side, { radius: 2.6, halfAngle: 1.1, speed: 70, range: 60, damage: this.o.blast, cut: 1200, colors: this.o.colors, dark: this.o.dark }));
      g.sfx.play('getsugaBlack', from, 1.3);
      g.callout('月牙天衝', 'GETSUGA TENSHŌ — POINT-BLANK', '#ffd86a');
      g.shake(f === g.player ? 0.6 : 0.25);
      g.hitstop(0.1);
    }
  }
}

/** R (Shikai): Getsuga Jūjishō — the small blade's crescent, then the large one's, fused into a cross. */
class JujishoAction extends SkillAction {
  readonly name = 'jujisho';
  private cross: CrossGetsuga | null = null;
  constructor(kit: TybwKit) {
    super(kit);
    this.mobility = 0.05;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    g.callout('月牙十字衝', 'GETSUGA JŪJISHŌ', '#ffd86a');
    this.playClip(f, 'ty_juji', (n) => {
      if (n === 'fx1') {
        const from = f.center().addScaledVector(f.forward(), 1.2);
        const dir = aimAt(f, g).sub(from).normalize();
        const flat = Math.hypot(dir.x, dir.z) || 1;
        dir.y = Math.max(-0.4, Math.min(0.5, dir.y / flat)) * flat;
        this.cross = new CrossGetsuga(g, f, from, dir.normalize(), { radius: 5, speed: 46, range: 130, damage: 190, cut: 1400, colors: GETSUGA_GOLD_TY });
        g.addProjectile(this.cross);
        g.sfx.play('getsuga', from, 0.8);
      }
      if (n === 'fx2') {
        this.cross?.fuse();
        g.sfx.play('getsugaBlack', f.center(), 1.3);
        f.aura.flare(2, 0.5);
        if (f === g.player) g.cam.punchFov(8);
        g.engine.gr.chroma.offset.set(0.006, 0.006);
      }
    });
  }
}

/** G (Shikai / True Bankai): Blut Vene — the shoulders set, the veins flare. */
class VeneAction extends SkillAction {
  readonly name = 'vene';
  constructor(kit: TybwKit) {
    super(kit);
    this.mobility = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ty_vene', (n) => {
      if (n !== 'fx') return;
      this.kit.setBlut(true);
      g.callout('静血装', 'BLUT VENE', BLUT_CYAN);
      g.sfx.play('flare', f.center(), 0.7);
      veinFlash(g, f.center(), 26);
    });
  }
  override canCancel(): boolean {
    return this.kit.blut;
  }
}

/** F (Shikai): Half-Hollowfication — the large blade soaks Quincy reiatsu, whitens, veins crawl over it; then the explosion. */
class HollowAction extends SkillAction {
  readonly name = 'halfhollow';
  constructor(kit: TybwKit) {
    super(kit);
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ty_hollow', (n) => {
      if (n === 'soak') {
        this.kit.swapLarge('large-veins');
        g.sfx.play('flare', f.center(), 0.8);
      }
      if (n === 'burst') this.kit.becomeHollow();
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    // cyan and black reiatsu pouring into the raised blade
    if (this.t < 0.62) {
      const c = f.blade.tip.clone().lerp(f.blade.base, 0.4);
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2, r = 1.2 + Math.random() * 1.6;
        const x = c.x + Math.cos(a) * r, y = c.y + (Math.random() - 0.5) * 2, z = c.z + Math.sin(a) * r;
        const cy = Math.random() < 0.6;
        g.engine.glow.spawn({ x, y, z, vx: (c.x - x) * 3.5, vy: (c.y - y) * 3.5, vz: (c.z - z) * 3.5, size: 0.1, sizeEnd: 0.02, life: 0.26, r: cy ? 0.6 : 0.1, g: cy ? 0.88 : 0.02, b: cy ? 0.95 : 0.06, alpha: 1, alphaEnd: 0.2, tex: TEX_STREAK, stretch: 2.5, drag: 0 });
      }
    }
  }
}

/** RMB (Half-Hollow): the sword-arm lock — the left hand seizes the foe's weapon arm, the white blade comes down. */
class ArmLockAction extends SkillAction {
  readonly name = 'armlock';
  private held: Fighter | null = null;
  constructor(kit: TybwKit, readonly target: Fighter) {
    super(kit);
    this.armor = 0.35;
    this.mobility = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    this.playClip(f, 'hh_grab', (n) => {
      if (n === 'grab') {
        const o = this.target;
        if (!o.dead && o.pos.distanceTo(f.pos) < 2.8) {
          this.held = o;
          o.stopAction();
          o.armLockT = Math.max(o.armLockT, 3);
          o.hitstun = Math.max(o.hitstun, 0.55);
          o.push.set(0, 0, 0);
          g.callout('', 'SWORD ARM SEIZED', '#c9a0ff');
          g.sfx.play('hitHeavy', o.center(), 0.7);
        }
      }
      if (n === 'hit' && this.held && !this.held.dead) {
        const o = this.held;
        g.damage(o, 70, f, f.forward(_v).clone(), { knock: 10, launch: 4, heavy: true, hitstop: 0.14, shake: 0.6, unblockable: true });
        g.sparks(o.center().setY(o.pos.y + o.def.height * 0.85), f.forward(_v), '#c9a0ff', 24);
        this.kit.wake(70);
        this.held = null;
      }
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.held) this.held.push.set(0, 0, 0);
    if (f.trail) f.trail.emitting = this.t > 0.34 && this.t < 0.5;
  }
}

/** E (Half-Hollow): Gran Rey Cero, charged at the horn with his own blood. */
class GranReyAction extends SkillAction {
  readonly name = 'granrey';
  constructor(kit: TybwKit) {
    super(kit);
    this.armor = 0.5;
    this.mobility = 0.05;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'hh_cero', (n) => {
      if (n !== 'charge') return;
      // paid in blood
      f.hp = Math.max(1, f.hp - f.maxHp * 0.06);
      const emitter = f.visual.rig.sockets.get('horn') ?? f.visual.object;
      const tgt = () => (f.faceTarget ? f.faceTarget.clone() : aimAt(f, g));
      g.addProjectile(new CeroBeam(g, f, emitter, tgt, { charge: 0.5, fire: 0.6, radius: 1.1, damage: 180, power: 900, core: '#F6E6FF', body: '#9B30FF', rim: '#5A0FA0', range: 110, track: 0.8, spiral: true, gain: 1.2 }));
      g.callout('王虚の閃光', 'GRAN REY CERO', '#c9a0ff');
      g.sfx.play('charge', f.center(), 1);
      f.aura.flare(1.8, 0.8);
      const c = f.center();
      for (let i = 0; i < 16; i++) g.engine.glow.spawn({ x: c.x, y: c.y + 0.3, z: c.z, vx: (Math.random() - 0.5) * 3, vy: Math.random() * 2, vz: (Math.random() - 0.5) * 3, size: 0.07, sizeEnd: 0.02, life: 0.6, r: 0.6, g: 0.02, b: 0.06, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, gravity: -6 });
    });
  }
}

/** R (Half-Hollow): Cero Creciente — a Getsuga raised on the white blade swells from gold to violet, then cut down. */
class CrecienteAction extends SkillAction {
  readonly name = 'creciente';
  private charging = false;
  constructor(kit: TybwKit) {
    super(kit);
    this.armor = 0.6;
    this.mobility = 0.03;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'hh_creciente', (n) => {
      if (n === 'charge') {
        this.charging = true;
        g.callout('月虚閃', 'CERO CRECIENTE', '#c9a0ff');
        g.sfx.play('charge', f.center(), 1.2);
      }
      if (n !== 'fx') return;
      this.charging = false;
      const dir = aimAt(f, g).sub(f.center()).normalize();
      const flat = Math.hypot(dir.x, dir.z) || 1;
      dir.y = Math.max(-0.5, Math.min(0.5, dir.y / flat)) * flat;
      dir.normalize();
      const right = new THREE.Vector3(dir.z, 0, -dir.x).normalize().multiplyScalar(-1);
      const side = new THREE.Vector3(0, 1, 0).multiplyScalar(Math.cos(0.7)).addScaledVector(right, Math.sin(0.7));
      const origin = f.center().addScaledVector(dir, 1.4);
      g.addProjectile(new GetsugaProjectile(g, f, origin, dir, side, {
        radius: 5.5, halfAngle: 1.2, speed: 40, range: 110, damage: 260, cut: 1800, colors: CRECIENTE_VIOLET, dark: true,
        onHit: (o) => {
          g.addRing(o.center(), 5, '#9B30FF', 0.4);
          g.engine.destruction.carve(new SphereShape(o.center(), 3.2, 0.5), { mode: 'explode', power: 600, impulse: 14, dust: 1 });
        },
      }));
      this.kit.glowBlade(0);
      g.sfx.play('getsugaBlack', origin, 1.5);
      g.shake(f === g.player ? 0.8 : 0.3);
      g.hitstop(0.1);
      g.slowMo(0.3, 0.4);
      g.engine.gr.chroma.offset.set(0.008, 0.008);
      if (f === g.player) g.cam.punchFov(9);
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.charging) {
      // gold swelling into violet over the charge
      const k = Math.min(1, (this.t - 0.05) / 0.7);
      const c = new THREE.Color('#F6C343').lerp(new THREE.Color('#9B30FF'), k);
      this.kit.glowBlade(0.6 + k * 0.4, c);
      const tip = f.blade.tip;
      g.engine.glow.spawn({ x: tip.x, y: tip.y, z: tip.z, size: 0.8 + k * 1.6, sizeEnd: 0.2, life: 0.12, r: c.r, g: c.g, b: c.b, alpha: 0.6, alphaEnd: 0, tex: TEX_GLOW });
    }
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.glowBlade(0);
  }
}

/** G (Half-Hollow): Blood Chains [anime-only] — the sky darkens, the blood moon slides into eclipse. */
class BloodChainsAction extends SkillAction {
  readonly name = 'bloodchains';
  constructor(kit: TybwKit) {
    super(kit);
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    this.kit.startEclipse();
    this.playClip(f, 'ty_hollow', (n) => {
      if (n === 'burst') this.kit.becomeChains();
    }, 1.3);
  }
}

/** RMB (Blood Chains): chains lash out from the tassel and wrap the target. */
class BindAction extends SkillAction {
  readonly name = 'bind';
  private cast = false;
  constructor(kit: TybwKit, readonly target: Fighter) {
    super(kit);
    this.mobility = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'slash1', () => {}, 1.3);
    g.sfx.play('swingHeavy', f.center(), 0.9);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.cast && this.t > 0.13) {
      this.cast = true;
      const o = this.target;
      if (!o.dead && o.pos.distanceTo(f.pos) < 16) {
        g.addProjectile(new ChainBind(g, f, o, 2.2));
        g.callout('血鎖', 'BLOOD CHAINS — BIND', '#ff6a5a');
        g.sfx.play('ting', o.center(), 1);
        g.damage(o, 20, f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 0, hitstop: 0.08 });
      }
    }
  }
}

/** E (Blood Chains): the cleaver driven into the ground — the chain wall bursts up before him. */
class WallAction extends SkillAction {
  readonly name = 'chainwall';
  constructor(kit: TybwKit) {
    super(kit);
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'bc_wall', (n) => {
      if (n !== 'plant') return;
      const fw = f.forward(_v).clone().setY(0).normalize();
      const at = f.pos.clone().addScaledVector(fw, 2.2);
      const gy = groundBelow(g, at.clone().setY(at.y + 1), 4);
      if (gy !== null) at.y = gy;
      g.addProjectile(new ChainWall(g, f, at, fw, { width: 7, height: 3.6, life: 2.5 }));
      g.callout('血鎖', 'BLOOD CHAINS — WALL', '#ff6a5a');
      g.sfx.play('impact', at, 1.1);
      g.engine.destruction.carve(new SphereShape(f.pos.clone().addScaledVector(fw, 1.3), 0.9, 0.5), { mode: 'smash', power: 200, impulse: 6, dust: 0.8 });
      g.shake(f === g.player ? 0.35 : 0.1);
    });
  }
}

/** Q (Blood Chains): the clone volley — every clone lunges at once. */
class VolleyAction extends SkillAction {
  readonly name = 'volley';
  constructor(kit: TybwKit) {
    super(kit);
    this.mobility = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'bc_volley', (n) => {
      if (n !== 'go') return;
      this.kit.volley();
      g.sfx.play('shunpo', f.center(), 1);
    });
  }
}

/** R (Blood Chains): the Blood Chains Getsuga — the clones drunk into the blade, the drop from above, the black crescent. */
class BloodGetsugaAction extends SkillAction {
  readonly name = 'bloodgetsuga';
  private fired = false;
  private n = 0;
  constructor(kit: TybwKit) {
    super(kit);
    this.armor = 0.6;
    this.airGravity = 0.02;
    this.mobility = 0.05;
  }
  override start(f: Fighter, g: Game): void {
    this.n = this.kit.drinkClones();
    if (f.grounded) f.push.y = 16;
    g.callout('月牙天衝', 'BLOOD CHAINS GETSUGA', '#f3f3f0');
    this.playClip(f, 'getsuga', (n) => {
      if (n === 'charge') {
        this.kit.glowBlade(1, '#F3F3F0');
        g.sfx.play('charge', f.center(), 1.2);
      }
      if (n !== 'fx' || this.fired) return;
      this.fired = true;
      const dir = aimAt(f, g).sub(f.center()).normalize();
      const side = new THREE.Vector3(0, 1, 0).addScaledVector(new THREE.Vector3(dir.z, 0, -dir.x).normalize(), 0.5).normalize();
      const origin = f.center().addScaledVector(dir, 1.5);
      const k = this.n;
      g.addProjectile(new GetsugaProjectile(g, f, origin, dir, side, { radius: 6 + k * 0.6, halfAngle: 1.25, speed: 46, range: 140, damage: 300 + k * 30, cut: 2600, colors: GETSUGA_BLOOD, dark: true }));
      g.addProjectile(new SkyCrescent(g, f.pos.clone().addScaledVector(dir.clone().setY(0).normalize(), 30), dir.clone().negate(), 20));
      this.kit.glowBlade(0);
      g.sfx.play('getsugaBlack', origin, 1.6);
      g.engine.gr.chroma.offset.set(0.012, 0.012);
      g.shake(f === g.player ? 1 : 0.4);
      g.hitstop(0.14);
      g.slowMo(0.5, 0.35);
      if (f === g.player) g.cam.punchFov(10);
      // the blinding flash before the crescent
      const c = f.center();
      g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: 14, sizeEnd: 30, life: 0.35, r: 1, g: 1, b: 1, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    });
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.glowBlade(0);
  }
}

/** F (Half-Hollow / Blood Chains): True Bankai — the two blades side by side, the pillar of fire, the lunar eclipse. */
class TrueBankaiAction extends SkillAction {
  readonly name = 'truebankai';
  constructor(kit: TybwKit) {
    super(kit);
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    this.kit.leaveHollow(false);
    this.playClip(f, 'bk_release', (n) => {
      if (n === 'fx') {
        g.callout('卍解', 'BANKAI', '#ffffff');
        f.aura.flare(2.2, 1.6);
        this.kit.startEclipse(true);
        g.sfx.play('flare', f.center(), 1);
      }
      if (n === 'burst') this.kit.becomeBankai();
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    // the surge of flame round him while the blades lie side by side
    if (this.t > 0.4 && this.t < 1.2) {
      const p = f.pos;
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2, r = 0.6 + Math.random() * 1.2;
        g.engine.glow.spawn({ x: p.x + Math.cos(a) * r, y: p.y + Math.random() * 0.5, z: p.z + Math.sin(a) * r, vx: 0, vy: 6 + Math.random() * 8, vz: 0, size: 0.5, sizeEnd: 0.1, life: 0.5, r: 1, g: 0.6 + Math.random() * 0.3, b: 0.2, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
      }
    }
  }
}

/** RMB (True Bankai): the golden cleave — one overhead swing, a planar cut 40 m long. */
class CleaveAction extends SkillAction {
  readonly name = 'cleave';
  private cut = false;
  constructor(kit: TybwKit) {
    super(kit);
    this.armor = 0.5;
    this.mobility = 0.05;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    f.bladeSpec = spec(60, 12, 1600, { heavy: true, launch: 4, hitstop: 0.12, shake: 0.5, reach: 0.5, thick: 0.18 });
    this.playClip(f, 'bk_s3', (n) => {
      if (n === 'step') f.push.addScaledVector(f.forward(), 5);
      if (n !== 'fx' || this.cut) return;
      this.cut = true;
      const fw = f.forward(_v).clone().setY(0).normalize();
      const origin = f.pos.clone().addScaledVector(fw, 1.2).setY(f.pos.y + 1.6);
      g.addProjectile(new PlanarSlash(g, f, origin, fw, new THREE.Vector3(0, 1, 0), { length: 40, width: 7, grow: 0.22, damage: 160, cut: 2600, color: '#FDE671', core: '#FFFFFF' }));
      g.callout('', 'GOLDEN CLEAVE', '#ffe27a');
      g.sfx.play('getsuga', origin, 1.4);
      g.shake(f === g.player ? 0.8 : 0.3);
      g.hitstop(0.1);
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    f.bladeActive = this.t > 0.4 && this.t < 0.56;
    if (f.trail) f.trail.emitting = this.t > 0.36 && this.t < 0.62;
  }
}

/** E (True Bankai): the guard — the cleaver raised flat before him (held); frontal blows barely land, shots are swatted away. */
class GuardAction extends FighterAction {
  readonly name = 'guard';
  constructor(readonly kit: TybwKit) {
    super();
    this.armor = 0.85;
    this.mobility = 0.15;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('bk_guard', { hold: true });
    g.sfx.play('flare', f.center(), 0.4);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const fw = f.forward(_v);
    const front = f.center().addScaledVector(fw, 1.4);
    if (g.rejectNear(front, 2.6, f, false)) {
      g.sparks(front, fw, '#FDE671', 18);
      g.sfx.play('hit', front, 0.7);
    }
    if (this.t >= 1.6) this.done = true;
  }
  override canCancel(): boolean {
    return this.t > 0.2;
  }
}

/** F (True Bankai, once): the Shell Break — the white shell cracks and falls away; the original Zangetsu cuts. */
class ShellBreakAction extends SkillAction {
  readonly name = 'shellbreak';
  private cut = false;
  constructor(kit: TybwKit) {
    super(kit);
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'bk_break', (n) => {
      if (n === 'crack') this.kit.breakShell(true);
      if (n === 'step') {
        const o = this.kit.target();
        if (o) {
          const d = Math.min(12, Math.max(0, o.pos.distanceTo(f.pos) - 1.6));
          const per = (1 - Math.exp(-f.pushDrag * 0.08)) / f.pushDrag;
          f.push.addScaledVector(f.forward(_v), Math.min(40, d / per));
          f.ghosts.spawn(0.5, 1);
        }
      }
      if (n !== 'cut' || this.cut) return;
      this.cut = true;
      const fw = f.forward(_v).clone().setY(0).normalize();
      const right = new THREE.Vector3(-fw.z, 0, fw.x);
      const origin = f.pos.clone().setY(f.pos.y + 1.1).addScaledVector(right, 0.5);
      // it cuts the foe in two — no guard, no parry
      for (const o of g.enemiesOf(f)) {
        _w.subVectors(o.pos, f.pos);
        if (_w.length() < 4 && _w.dot(fw) > -0.5) g.damage(o, 320, f, fw, { knock: 18, launch: 6, heavy: true, hitstop: 0.25, shake: 1, unblockable: true });
      }
      g.addProjectile(new PlanarSlash(g, f, origin, fw, right, { length: 30, width: 3, grow: 0.18, damage: 60, cut: 2600, color: '#FDE671', core: '#FFFFFF' }));
      g.callout('斬月', 'ZANGETSU', '#ffffff');
      g.sfx.play('getsuga', origin, 1.6);
      g.slowMo(0.6, 0.3);
      g.shake(f === g.player ? 1 : 0.4);
      g.engine.gr.chroma.offset.set(0.012, 0.012);
      if (f === g.player) g.cam.punchFov(12);
    });
  }
}

// ------------------------------------------------------------------------------------------------ the clones

/** A reiatsu clone's kit [anime-only]: the cleaver string and the lunge, nothing else; it pops under a strong hit. */
class CloneKit implements Kit {
  private combo = 0;
  private lastEnd = 0;
  constructor(readonly f: Fighter, readonly g: Game, readonly owner: TybwKit) {
    f.data.kit = this;
  }
  update(): void {}
  attack(): void {
    const f = this.f;
    if (f.action instanceof CloneCut) {
      f.action.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastEnd > 0.8) this.combo = 0;
    const clip = CHAINS_CHAIN[this.combo % 3];
    this.combo++;
    this.lastEnd = this.g.time + 0.8;
    f.act(new CloneCut(this, clip), true);
  }
  heavy(): void {}
  skill1(): void {}
  release(): void {}
  toggleFlare(): void {}
  abilities(): AbilityInfo[] {
    return [];
  }
  formName(): string {
    return 'Reiatsu clone';
  }
  ai(): KitAI {
    return { reach: 2.2, chain: 3, moves: [] };
  }
}

class CloneCut extends FighterAction {
  readonly name: string;
  queued = false;
  private dur = 0.5;
  constructor(readonly kit: CloneKit, readonly clip: string) {
    super();
    this.name = clip;
    this.mobility = 0.15;
  }
  override start(f: Fighter): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.bladeHits.clear();
    f.bladeSpec = this.kit.owner.withEcho(spec(22, 5, 400));
    f.anim.play(this.clip, {});
    if (f.faceTarget) f.push.addScaledVector(f.forward(), 8);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    f.bladeActive = this.t > 0.1 && this.t < 0.26;
    if (this.t >= this.dur) this.done = true;
  }
  override end(f: Fighter): void {
    f.bladeActive = false;
  }
}

function cloneDef(): FighterDef {
  return {
    ...TYBW_DEF,
    id: 'ichigo-clone',
    name: 'Reiatsu clone',
    build: () => ({ asset: tybwAsset('chains'), props: [{ key: 'sword', model: tybwBlade('chains'), socket: 'grip.R' }] }),
    aura: AURA_BLOOD_CHAINS,
    blade: BLADE_CHAINS,
    hp: 40,
    rei: 20,
    speed: { ...SPEED.chains },
  };
}

// ------------------------------------------------------------------------------------------------ the kit

export class TybwKit implements Kit {
  form: Form = 'shikai';
  /** the small blade in the left hand */
  readonly off: OffBlade;
  private combo = 0;
  private lastEnd = 0;
  readonly cd = { large: 0, juji: 0, chain: 0, vene: 0, grab: 0, granrey: 0, creciente: 0, hgetsuga: 0, bind: 0, wall: 0, volley: 0, bgetsuga: 0, ggetsuga: 0, cleave: 0, guard: 0, impale: 0, chainsToggle: 0 };
  flicks = FLICK_CHARGES;
  private flickT = 0;
  flare = false;
  /** Blut Vene */
  blut = false;
  blutT = 0;
  private lastCatch = -9;
  /** the large blade out on its chain */
  chainBlade: ChainBlade | null = null;
  /** Half-Hollow: heavy damage the horn has taken */
  hornDmg = 0;
  /** Blood Chains */
  readonly clones: { f: Fighter; until: number }[] = [];
  private wasDashing = false;
  private stepT = 0;
  private wetT = 0;
  private echoes: { o: Fighter; at: number; dmg: number }[] = [];
  private eclipse: Eclipse | null = null;
  /** True Bankai: the shell has fallen away (the original Zangetsu) */
  shellBroken = false;
  private shellUsed = false;
  /** passive: once a fight, a lethal blow leaves him standing */
  private willUsed = false;
  private willT = 0;
  /** passive: pattern reading (the same blow three times in a row from one foe is parried) */
  private seen = { key: '', n: 0, at: 0 };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    this.off = new OffBlade(g, f, 'sword2', TYBW_SMALL_BASE_Z, TYBW_SMALL_TIP_Z, AURA_TYBW.body, AURA_TYBW.core);
    f.onHurt = (dmg, heavy) => this.onHurt(dmg, heavy);
    f.onLethal = () => this.onLethal();
    f.parry = (amount, from, o) => this.parry(amount, from, o);
    this.applyStats();
  }

  // -------------------------------------------------------------------------------------------- per step

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flicks < FLICK_CHARGES) {
      this.flickT += dt;
      if (this.flickT >= FLICK_REFILL) {
        this.flickT = 0;
        this.flicks++;
      }
    }
    this.off.update(dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
      // TYBW: the solid gold reiatsu boils the rain into steam round him
      if (Math.random() < 0.25) g.engine.dust.spawn({ x: f.pos.x + (Math.random() - 0.5) * 1.6, y: f.pos.y + Math.random() * 1.8, z: f.pos.z + (Math.random() - 0.5) * 1.6, vy: 1.6, size: 0.3, sizeEnd: 1, life: 0.9, r: 0.92, g: 0.92, b: 0.9, alpha: 0.25, alphaEnd: 0, tex: TEX_PUFF, drag: 1 });
    }
    if (this.blut) {
      this.blutT -= dt;
      f.rei -= dt * BLUT_DRAIN;
      if (this.blutT <= 0 || f.rei <= 0) this.setBlut(false);
    }
    if (this.willT > 0 && (this.willT -= dt) <= 0) this.applyStats();
    // the chain blade back in the hand
    if (this.chainBlade && this.chainBlade.done) {
      this.chainBlade = null;
      this.swordVisible(true);
      if (!f.busy) f.anim.play('ig_catch', {});
      g.sfx.play('hit', f.center(), 0.6);
    }
    // the merged power absorbed (Auswählen) or sealed: the form is gone
    if ((this.form === 'hollow' || this.form === 'chains') && f.sealT > 0 && !f.dead) this.leaveHollow(true);
    if (this.form === 'chains') this.tendChains(dt);
    else if (this.wetT > 0) {
      this.wetT -= dt;
      this.footsteps(dt, true);
    }
    this.tendEchoes();
    // True Bankai: a blow meant to break the weapon breaks only the shell
    if (this.form === 'bankai' && !this.shellBroken && f.disarmT > 0) {
      f.disarmT = 0;
      this.breakShell(false);
      g.callout('', 'THE SHELL BREAKS', '#f3f3f0');
    }
    if (this.form === 'bankai' && f.disarmT > 0 && this.shellBroken) f.disarmT = Math.min(f.disarmT, 0.5);
  }

  /** Blood Chains: the clones, the black-flame footprints, the chain flames. */
  private tendChains(dt: number): void {
    const { f, g } = this;
    const dashing = f.dashT > 0;
    if (dashing && !this.wasDashing) this.spawnClone(f.pos.clone());
    this.wasDashing = dashing;
    this.footsteps(dt, false);
    chainFlames(g, [sock(f, 'neck', new THREE.Vector3()), sock(f, 'grip.R', new THREE.Vector3()), sock(f, 'grip.L', new THREE.Vector3()), f.pos.clone().setY(f.pos.y + 0.15)]);
    for (const c of [...this.clones]) {
      if (!g.fighters.includes(c.f)) {
        this.clones.splice(this.clones.indexOf(c), 1);
        continue;
      }
      if (c.f.dead || g.time >= c.until) this.dropClone(c.f);
    }
  }

  private footsteps(dt: number, wet: boolean): void {
    const f = this.f;
    if (!f.grounded) return;
    const sp = Math.hypot(f.body.vel.x, f.body.vel.z);
    if (sp < 1.5) return;
    this.stepT -= dt * Math.min(2, sp / 8);
    if (this.stepT > 0) return;
    this.stepT = 0.28;
    footprint(this.g, f.pos.clone(), wet);
  }

  // -------------------------------------------------------------------------------------------- inputs

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof CutAction) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    // high in the air: the descent
    if (this.form === 'shikai' && !f.grounded) {
      const gy = groundBelow(this.g, f.pos, 60);
      if (gy === null || f.pos.y - gy >= 5) {
        f.act(new DescentAction(this), true);
        return;
      }
    }
    if (this.g.time - this.lastEnd > 0.8) this.combo = 0;
    this.chain(this.combo);
  }

  /** the cuts of the current form, in order */
  private chainList(): string[] {
    if (this.form === 'shikai') return this.chainBlade ? ['ty_s2b', 'ty_s4b'] : TYBW_CHAIN;
    if (this.form === 'hollow') return HOLLOW_CHAIN;
    if (this.form === 'chains') return CHAINS_CHAIN;
    return this.shellBroken ? CHAINS_CHAIN : BANKAI_CHAIN;
  }

  private cutTable(): Record<string, Cut> {
    if (this.form === 'shikai') return CUTS;
    if (this.form === 'hollow') return CUTS_HOLLOW;
    if (this.form === 'chains') return CUTS_CHAINS;
    return this.shellBroken ? CUTS_ORIGINAL : CUTS_BANKAI;
  }

  chain(i: number): void {
    const f = this.f;
    const list = this.chainList();
    const idx = i % list.length;
    this.combo = idx + 1;
    this.lastEnd = this.g.time + 0.8;
    const clip = list[idx];
    // the 6th cut at close quarters: he seizes the foe and hurls him
    if (clip === 'ty_s6') {
      const t = this.near(1.9);
      if (t && !t.def.boss) {
        f.act(new HurlAction(this, t), true);
        return;
      }
    }
    f.act(new CutAction(this, clip, idx, this.cutTable()[clip]), true);
  }

  heavy(): void {
    const f = this.f;
    if (this.form === 'shikai') {
      if (this.chainBlade) {
        if (!this.chainBlade.returning) f.act(new BeckonAction(this), true);
        return;
      }
      this.special(new ChainThrowAction(this), 10, 'chain', 1.2);
      return;
    }
    if (this.form === 'hollow') {
      const t = this.near(3.2);
      if (t) this.special(new ArmLockAction(this, t), 12, 'grab', 3.5);
      return;
    }
    if (this.form === 'chains') {
      const t = this.near(16);
      if (t) this.special(new BindAction(this, t), 16, 'bind', 6);
      return;
    }
    this.special(new CleaveAction(this), 20, 'cleave', 3.5);
  }

  /** Q */
  skill1(): void {
    if (this.form === 'shikai') {
      if (this.flicks <= 0) return;
      if (this.special(new FlickAction(this), 6, 'chainsToggle', 0)) {
        this.flicks--;
        if (this.flicks === FLICK_CHARGES - 1) this.flickT = 0;
      }
    } else if (this.form === 'hollow') {
      this.special(new GetsugaAction(this, { radius: 4, speed: 52, range: 120, damage: 140, cut: 1200, colors: GETSUGA_WHITE_GOLD, callout: ['月牙天衝', 'GETSUGA TENSHŌ', '#f3e6a8'] }), 18, 'hgetsuga', 1.6);
    } else if (this.form === 'chains') {
      if (this.clones.length) this.special(new VolleyAction(this), 6, 'volley', 2);
    } else {
      this.special(new GetsugaAction(this, { radius: 7, speed: 60, range: 150, damage: 220, cut: 2400, colors: GETSUGA_GOLD_TY, callout: ['月牙天衝', 'GETSUGA TENSHŌ', '#ffe27a'], clip: 'bk_getsuga' }), 26, 'ggetsuga', 2.2);
    }
  }

  /** E */
  skill2(): void {
    if (this.form === 'shikai') {
      const t = this.near(3);
      if (t) this.special(new ImpaleAction(this, t, { stab: 40, blast: 140, colors: GETSUGA_GOLD_TY }), 20, 'large', 2.2);
      else this.special(new GetsugaAction(this, { radius: 3.8, speed: 52, range: 120, damage: 130, cut: 1100, colors: GETSUGA_GOLD_TY, callout: ['月牙天衝', 'GETSUGA TENSHŌ', '#ffd86a'] }), 20, 'large', 2.2);
    } else if (this.form === 'hollow') {
      this.special(new GranReyAction(this), 24, 'granrey', 6);
    } else if (this.form === 'chains') {
      this.special(new WallAction(this), 18, 'wall', 6);
    } else {
      if (this.f.action instanceof GuardAction) return;
      this.special(new GuardAction(this), 10, 'guard', 2.5);
    }
  }

  /** R */
  skill3(): void {
    if (this.form === 'shikai') this.special(new JujishoAction(this), 34, 'juji', 7);
    else if (this.form === 'hollow') this.special(new CrecienteAction(this), 40, 'creciente', 9);
    else if (this.form === 'chains') this.special(new BloodGetsugaAction(this), 50, 'bgetsuga', 14);
    else {
      const t = this.near(3.4);
      if (t) this.special(new ImpaleAction(this, t, { stab: 50, blast: 180, colors: GETSUGA_GOLD_TY }), 22, 'impale', 4);
    }
  }

  /** F: Half-Hollowfication → True Bankai → the Shell Break */
  release(): void {
    const { f, g } = this;
    if (f.busy && !(f.action instanceof CutAction)) return;
    if (this.form === 'shikai') {
      if (this.chainBlade) return;
      if (!f.spendRei(40)) return this.noRei();
      f.stopAction();
      f.act(new HollowAction(this), true);
    } else if (this.form === 'hollow' || this.form === 'chains') {
      if (!f.spendRei(50)) return this.noRei();
      f.stopAction();
      f.act(new TrueBankaiAction(this), true);
    } else if (!this.shellUsed) {
      if (!f.spendRei(60)) return this.noRei();
      this.shellUsed = true;
      f.stopAction();
      f.act(new ShellBreakAction(this), true);
    } else if (f === g.player) g.hud?.showBanner('The shell is gone');
  }

  /** G: Blut Vene · in Half-Hollow, Blood Chains [anime-only] · in Blood Chains, its release */
  toggle(): void {
    const { f } = this;
    if (f.dead || this.cd.chainsToggle > 0) return;
    if (this.form === 'hollow') {
      if (f.busy && !(f.action instanceof CutAction)) return;
      if (!f.spendRei(30)) return this.noRei();
      this.cd.chainsToggle = 2;
      f.stopAction();
      f.act(new BloodChainsAction(this), true);
      return;
    }
    if (this.form === 'chains') {
      this.cd.chainsToggle = 2;
      this.releaseChains();
      return;
    }
    if (this.blut) {
      this.setBlut(false);
      return;
    }
    if (f.rei < 10) return this.noRei();
    if (f.busy) {
      this.setBlut(true);
      return;
    }
    f.act(new VeneAction(this), true);
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

  private noRei(): void {
    if (this.f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
  }

  target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 90, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 90);
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
    if (!f.spendRei(cost)) {
      this.noRei();
      return false;
    }
    this.cd[cdKey] = cd;
    f.act(a, true);
    return true;
  }

  // -------------------------------------------------------------------------------------------- the blades

  /** World position of the right hand. */
  handWorld(out: THREE.Vector3): THREE.Vector3 {
    return sock(this.f, 'grip.R', out);
  }

  swordVisible(on: boolean): void {
    const s = this.f.visual.props.get('sword');
    if (s) s.visible = on;
    this.f.visual.rig.setBoneVisible('fist.R', on);
    this.f.visual.rig.setBoneVisible('palm.R', !on);
  }

  /** Chain: the large blade hurled at the target. */
  throwChain(from: THREE.Vector3, tgt: THREE.Vector3): void {
    const { f, g } = this;
    if (f.faceTarget) tgt.y = f.faceTarget.y;
    this.chainBlade = new ChainBlade(g, f, tybwBlade('large'), from, tgt, () => this.handWorld(new THREE.Vector3()), {
      speed: 40, range: 26, damage: 60, back: 45, cut: 700, mid: 0.7, colors: GETSUGA_GOLD_TY,
    });
    g.addProjectile(this.chainBlade);
    this.swordVisible(false);
  }

  /** The large blade's glow (Getsuga charge, Cero Creciente's gold-to-violet). */
  glowBlade(a: number, color?: THREE.ColorRepresentation): void {
    const s = this.f.visual.props.get('sword');
    if (!s) return;
    const u = s.material.userData.uniforms;
    const c = new THREE.Color(color ?? this.f.def.aura.body);
    u.uEnergy.value.set(c.r, c.g, c.b, a * 0.8);
  }

  /** Swap the large blade's model in place (white, veined). */
  swapLarge(kind: TybwBlade): void {
    this.f.visual.attach('sword', tybwBlade(kind), 'grip.R');
  }

  /** A blade spec with this form's on-hit extras (Blood Chains: the echo). */
  withEcho(s: BladeSpec): BladeSpec {
    if (this.form !== 'chains') return s;
    return { ...s, onHit: (o) => this.echo(o, s.damage * 0.6) };
  }

  /** Blood Chains: a hit lands again, seconds late. */
  echo(o: Fighter, dmg: number): void {
    if (this.echoes.length > 24) return;
    this.echoes.push({ o, at: this.g.time + 0.6 + Math.random(), dmg });
  }

  private tendEchoes(): void {
    const g = this.g;
    for (let i = this.echoes.length - 1; i >= 0; i--) {
      const e = this.echoes[i];
      if (g.time < e.at) continue;
      this.echoes.splice(i, 1);
      if (e.o.dead || !g.fighters.includes(e.o)) continue;
      const c = e.o.center();
      const dir = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
      g.damage(e.o, e.dmg, this.f, dir, { knock: 3, hitstop: 0.04 });
      // the late cut: a black slash with a white edge flickers across him
      for (let k = 0; k < 10; k++) {
        const u = (k / 9 - 0.5) * 1.6;
        g.engine.glow.spawn({ x: c.x + dir.z * u, y: c.y + u * 0.6, z: c.z - dir.x * u, size: 0.18, sizeEnd: 0.04, life: 0.2, r: k % 3 ? 0.08 : 1, g: k % 3 ? 0.02 : 1, b: k % 3 ? 0.03 : 1, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: 2 });
      }
      g.sfx.play('hit', c, 0.6);
    }
  }

  /** Half-Hollow: the shock of a white-blade swing runs on through what stands behind. */
  wake(damage: number): void {
    const { f, g } = this;
    const fw = f.forward(_v).clone().setY(0).normalize();
    const right = new THREE.Vector3(-fw.z, 0, fw.x);
    const origin = f.pos.clone().setY(f.pos.y + 1.1).addScaledVector(fw, 1.6);
    g.addProjectile(new PlanarSlash(g, f, origin, fw, right.addScaledVector(new THREE.Vector3(0, 1, 0), 0.5).normalize(), { length: 12, width: 1.6, grow: 0.14, damage: damage * 0.35, cut: 700, color: '#B48CFF', core: '#F6E6FF' }));
  }

  // -------------------------------------------------------------------------------------------- forms

  private build(form: Form): { asset: ReturnType<typeof tybwAsset>; props: { key: string; model: ReturnType<typeof tybwBlade>; socket: string }[] } {
    const body: TybwForm = form === 'hollow' ? 'hollow' : form === 'chains' ? 'chains' : 'shikai';
    const props: { key: string; model: ReturnType<typeof tybwBlade>; socket: string }[] = [];
    if (form === 'shikai') props.push({ key: 'sword', model: tybwBlade('large'), socket: 'grip.R' }, { key: 'sword2', model: tybwBlade('small'), socket: 'grip.L' });
    else if (form === 'hollow') props.push({ key: 'sword', model: tybwBlade('large-white'), socket: 'grip.R' }, { key: 'sword2', model: tybwBlade('small'), socket: 'grip.L' });
    else if (form === 'chains') props.push({ key: 'sword', model: tybwBlade('chains'), socket: 'grip.R' });
    else props.push({ key: 'sword', model: this.shellBroken ? ichigoSword('shikai') : tybwBlade('bankai'), socket: 'grip.R' });
    return { asset: tybwAsset(body), props };
  }

  private setForm(form: Form): void {
    const f = this.f;
    this.form = form;
    const aura = form === 'hollow' ? AURA_HALF_HOLLOW : form === 'chains' ? AURA_BLOOD_CHAINS : form === 'bankai' ? AURA_TRUE_BANKAI : AURA_TYBW;
    const blade = form === 'hollow' ? BLADE_WHITE : form === 'chains' ? BLADE_CHAINS : form === 'bankai' ? (this.shellBroken ? BLADE_ORIGINAL : BLADE_TRUE) : BLADE_LARGE;
    const stance = form === 'bankai' && !this.shellBroken ? TRUE_BANKAI_STANCE : TYBW_STANCE;
    f.def = { ...f.def, stance, blade, weakAbove: form === 'hollow' || form === 'chains' ? 0.88 : undefined };
    f.anim.stopAll(0.05);
    f.setForm(this.build(form), aura, blade);
    this.off.invalidate();
    this.off.trail.setColor(aura.body, aura.core);
    this.combo = 0;
    this.applyStats();
  }

  /** Half-Hollowfication's burst: the horn, the white blade, the room blown apart. */
  becomeHollow(): void {
    const { f, g } = this;
    this.hornDmg = 0;
    this.setBlut(false);
    this.setForm('hollow');
    const c = f.center();
    g.callout('半虚化', 'HALF-HOLLOWFICATION', '#c9a0ff');
    g.sfx.play('mask', c, 1.3);
    f.aura.pillarBurst(2.2);
    g.addRing(f.pos.clone().setY(f.pos.y + 0.05), 14, '#9B30FF', 0.6);
    g.addRing(c.clone(), 6, '#F6E6FF', 0.3);
    // the walls round him blown away (not the floor under him)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.engine.destruction.carve(new SphereShape(new THREE.Vector3(f.pos.x + Math.cos(a) * 5.5, f.pos.y + 1.8, f.pos.z + Math.sin(a) * 5.5), 2.6, 0.5), { mode: 'smash', power: 320, impulse: 16, dust: 1 });
    }
    g.shake(f === g.player ? 1 : 0.4);
    g.hitstop(0.12);
    g.slowMo(0.5, 0.35);
    g.engine.gr.chroma.offset.set(0.01, 0.01);
    if (f === g.player) g.cam.punchFov(10);
    for (const o of g.enemiesOf(f)) {
      const d = o.pos.distanceTo(f.pos);
      if (d < 12) g.damage(o, 60 * (1 - d / 12), f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 24 * (1 - d / 12), launch: 6, heavy: true });
    }
    for (let i = 0; i < 80; i++) {
      const a = Math.random() * Math.PI * 2, up = Math.random();
      const sp = 6 + Math.random() * 16;
      const dark = Math.random() < 0.55;
      g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: Math.cos(a) * sp * (1 - up * 0.5), vy: up * sp * 0.8, vz: Math.sin(a) * sp * (1 - up * 0.5), size: dark ? 0.4 : 0.25, sizeEnd: 0.05, life: 0.5 + Math.random() * 0.4, r: dark ? 0.08 : 0.62, g: dark ? 0.02 : 0.2, b: dark ? 0.1 : 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 3 });
    }
    if (g.hud && f === g.player) g.hud.vignette = 1;
  }

  /** Back to the true Shikai: the horn snapped or crumbled, or the merged power absorbed. */
  leaveHollow(snapped: boolean): void {
    const { f, g } = this;
    if (this.form !== 'hollow' && this.form !== 'chains') return;
    const wasChains = this.form === 'chains';
    if (wasChains) {
      this.dropAllClones();
      this.endEclipse();
    }
    const p = sock(f, 'horn', new THREE.Vector3());
    for (let i = 0; i < 30; i++) g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5) * 5, vy: Math.random() * 4, vz: (Math.random() - 0.5) * 5, size: 0.06, sizeEnd: 0.03, life: 0.8, r: 0.95, g: 0.93, b: 0.9, alpha: 1, alphaEnd: 0.4, tex: TEX_GLOW, drag: 1, gravity: -9 });
    if (!snapped) return;
    this.setForm('shikai');
    g.sfx.play('shatter', p, 1.3);
    g.callout('', 'THE HORN SNAPS', '#f3f3f0');
    f.stopAction();
    f.hitstun = Math.max(f.hitstun, 0.6);
    if (g.hud && f === g.player) g.hud.vignette = 0;
  }

  startEclipse(gold = false): void {
    this.endEclipse();
    this.eclipse = gold ? new Eclipse(this.g, SKY_ECLIPSE, '#E8C060', '#FDE671') : new Eclipse(this.g, SKY_BLOOD, '#B0101C', '#FF3B2F');
    this.g.addProjectile(this.eclipse);
  }

  private endEclipse(): void {
    this.eclipse?.end();
    this.eclipse = null;
  }

  /** Blood Chains [anime-only]: the form takes him. */
  becomeChains(): void {
    const { f, g } = this;
    this.setForm('chains');
    const c = f.center();
    g.callout('血鎖の一護', 'BLOOD CHAINS', '#ff6a5a');
    g.sfx.play('mask', c, 1.4);
    f.aura.pillarBurst(2);
    g.addRing(f.pos.clone().setY(f.pos.y + 0.05), 12, CHAIN_RED, 0.6);
    g.shake(f === g.player ? 0.8 : 0.3);
    g.slowMo(0.5, 0.35);
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.dust.spawn({ x: c.x, y: f.pos.y + Math.random() * 1.8, z: c.z, vx: Math.cos(a) * 3, vy: 0.5, vz: Math.sin(a) * 3, size: 0.5, sizeEnd: 1.6, life: 1, r: 0.05, g: 0.01, b: 0.02, alpha: 0.8, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
    }
  }

  /** G in Blood Chains: released — back to Half-Hollow, the prints turn wet. */
  private releaseChains(): void {
    const { f, g } = this;
    this.dropAllClones();
    this.endEclipse();
    this.setForm('hollow');
    this.wetT = 6;
    g.callout('', 'RELEASED', '#e8e4e8');
    g.sfx.play('flare', f.center(), 0.6);
  }

  /** True Bankai's burst. */
  becomeBankai(): void {
    const { f, g } = this;
    this.shellBroken = false;
    this.setForm('bankai');
    g.callout('天鎖斬月', 'TENSA ZANGETSU', '#ffe27a');
    g.sfx.play('bankai', f.center());
    f.aura.pillarBurst(2.8);
    g.groundImpact(f.pos.clone(), 3.6, 120, AURA_TRUE_BANKAI.body, f);
    g.shake(f === g.player ? 1 : 0.4);
    g.hitstop(0.14);
    g.slowMo(0.6, 0.35);
    g.engine.gr.chroma.offset.set(0.008, 0.008);
    for (const o of g.enemiesOf(f)) {
      const d = o.pos.distanceTo(f.pos);
      if (d < 14) g.damage(o, 40 * (1 - d / 14), f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 24 * (1 - d / 14), launch: 6, heavy: true });
    }
    // the pillar of fire
    const p = f.pos;
    for (let i = 0; i < 90; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * 1.6;
      g.engine.glow.spawn({ x: p.x + Math.cos(a) * r, y: p.y + Math.random() * 2, z: p.z + Math.sin(a) * r, vx: Math.cos(a) * 1.5, vy: 14 + Math.random() * 18, vz: Math.sin(a) * 1.5, size: 0.7, sizeEnd: 0.15, life: 0.9, r: 1, g: 0.55 + Math.random() * 0.35, b: 0.15, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 4, drag: 0.5 });
    }
    setTimeout(() => this.endEclipse(), 0);
    if (g.hud && f === g.player) g.hud.vignette = 0;
  }

  /** The white shell cracks and falls away; the original Zangetsu is left in his hand. */
  breakShell(fromStrike: boolean): void {
    const { f, g } = this;
    if (this.shellBroken) return;
    this.shellBroken = true;
    const s = f.visual.props.get('sword');
    if (s && !f.dead) {
      s.updateWorldMatrix(true, false);
      const origin = new THREE.Vector3().setFromMatrixPosition(s.matrixWorld);
      g.addProjectile(new ShardBurst(g, bankaiShell().shards, s.matrixWorld, { origin, dir: f.forward(), speed: fromStrike ? 3 : 6, life: 2.4 }));
      g.sfx.play('shatter', origin, 1.4);
    }
    f.def = { ...f.def, stance: TYBW_STANCE, blade: BLADE_ORIGINAL };
    // mid-swing (the Shell Break) the running clip carries on into the new body; otherwise settle the pose
    if (!fromStrike) f.anim.stopAll(0.05);
    f.setForm(this.build('bankai'), AURA_TRUE_BANKAI, BLADE_ORIGINAL);
    this.combo = 0;
    this.applyStats();
  }

  setBlut(on: boolean): void {
    if (this.blut === on) return;
    this.blut = on;
    this.blutT = on ? BLUT_MAX : 0;
    this.cd.vene = on ? 0 : 3;
    this.applyStats();
  }

  // -------------------------------------------------------------------------------------------- clones

  private spawnClone(p: THREE.Vector3): void {
    const { f, g } = this;
    if (this.clones.length >= MAX_CLONES) return;
    const c = g.spawn(cloneDef(), p, f.team);
    c.yaw = f.yaw;
    const kit = new CloneKit(c, g, this);
    c.toughness = 0;
    c.visual.forEachMaterial((m) => {
      m.userData.uniforms.uTint.value.setRGB(0.22, 0.16, 0.18);
      m.userData.uniforms.uRim.value.set(0.95, 0.12, 0.1, 1.4);
    });
    c.aura.target = 0.4;
    g.controllers.push(new DuelistAI(g, c, kit, { aggression: 0.95, intro: 0 }));
    c.data.copyOf = f;
    this.clones.push({ f: c, until: g.time + 10 });
    c.ghosts.spawn(0.3, 0.8);
  }

  private dropClone(c: Fighter): void {
    const g = this.g;
    const i = this.clones.findIndex((x) => x.f === c);
    if (i >= 0) this.clones.splice(i, 1);
    if (!g.fighters.includes(c)) return;
    const p = c.center();
    for (let k = 0; k < 18; k++) g.engine.dust.spawn({ x: p.x, y: p.y + (Math.random() - 0.5) * 1.4, z: p.z, vx: (Math.random() - 0.5) * 3, vy: Math.random() * 2, vz: (Math.random() - 0.5) * 3, size: 0.3, sizeEnd: 0.9, life: 0.6, r: 0.05, g: 0.01, b: 0.02, alpha: 0.7, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
    c.hp = 0;
    c.dead = true;
    c.stopAction();
    g.remove(c);
  }

  private dropAllClones(): void {
    for (const c of [...this.clones]) this.dropClone(c.f);
  }

  /** Q (Blood Chains): every clone lunges at the target. */
  volley(): void {
    const t = this.target();
    for (const c of this.clones) {
      if (c.f.dead) continue;
      if (t) {
        c.f.faceTarget = t.center();
        c.f.yaw = Math.atan2(t.pos.x - c.f.pos.x, t.pos.z - c.f.pos.z);
        const d = Math.max(0, t.pos.distanceTo(c.f.pos) - 1.4);
        c.f.push.addScaledVector(c.f.forward(_v), Math.min(30, d * c.f.pushDrag * 0.9));
      }
      (c.f.data.kit as CloneKit).attack();
    }
  }

  /** R (Blood Chains): the clones drunk into the blade; returns how many. */
  drinkClones(): number {
    const { f, g } = this;
    const n = this.clones.length;
    const tip = f.blade.tip.clone();
    for (const c of [...this.clones]) {
      const p = c.f.center();
      for (let k = 0; k < 10; k++) g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: (tip.x - p.x) * 3, vy: (tip.y - p.y) * 3, vz: (tip.z - p.z) * 3, size: 0.2, sizeEnd: 0.05, life: 0.33, r: 0.1, g: 0.02, b: 0.03, alpha: 1, alphaEnd: 0.3, tex: TEX_STREAK, stretch: 3, drag: 0 });
      this.dropClone(c.f);
    }
    return n;
  }

  // -------------------------------------------------------------------------------------------- damage hooks

  private parry(_amount: number, from: Fighter | null, o: { energy?: boolean; quiet?: boolean }): boolean {
    const { f, g } = this;
    // Blut Vene: an arrow (a shot) caught bare-handed and crushed
    if (this.blut && o.energy && !o.quiet && g.time - this.lastCatch > 2) {
      this.lastCatch = g.time;
      const p = sock(f, 'palm.R', _v);
      veinFlash(g, p, 16);
      g.callout('', 'CAUGHT', BLUT_CYAN);
      g.sfx.play('hit', p, 0.8);
      return true;
    }
    // pattern reading: the third identical blow in a row from one foe is read and turned aside
    if (from && !o.quiet) {
      const key = `${from.id}:${from.action?.name ?? '-'}`;
      if (key === this.seen.key && g.time - this.seen.at < 6) this.seen.n++;
      else this.seen = { key, n: 1, at: g.time };
      this.seen.at = g.time;
      if (this.seen.n >= 3 && !f.busy) {
        this.seen.n = 0;
        g.sparks(f.center(), f.forward(_v), '#FDE671', 14);
        g.sfx.play('ting', f.center(), 0.9);
        return true;
      }
    }
    return false;
  }

  private onHurt(dmg: number, heavy: boolean): void {
    const { f, g } = this;
    if (this.blut && !f.dead) veinFlash(g, f.center(), 8);
    if (this.form === 'hollow' && heavy && !f.dead) {
      this.hornDmg += dmg;
      if (this.hornDmg >= HORN_HP) this.leaveHollow(true);
    }
  }

  private onLethal(): boolean {
    const f = this.f;
    if (this.willUsed) return false;
    this.willUsed = true;
    f.hp = 1;
    this.willT = 6;
    this.applyStats();
    this.g.callout('', 'NOT YET', '#ffd86a');
    f.aura.flare(2, 0.6);
    return true;
  }

  // -------------------------------------------------------------------------------------------- look & stats

  private applyStats(): void {
    const f = this.f;
    const base = SPEED[this.form];
    f.def = { ...f.def, speed: { ...base } };
    f.damageTaken = TAKEN[this.form] * (this.blut ? 0.5 : 1);
    f.power = POWER[this.form] * (this.flare ? 1.2 : 1) * (this.willT > 0 ? 1.2 : 1) * (this.form === 'bankai' && this.shellBroken ? 1.1 : 1);
    f.aura.target = this.flare ? 1 : this.form === 'shikai' ? 0.3 : 0.45;
    f.ghosts.color.set(f.def.aura.body);
    if (this.g.hud && f === this.g.player) this.g.hud.form = this.formName();
  }

  formName(): string {
    const v = this.blut ? ' · Blut Vene' : '';
    if (this.form === 'shikai') return 'True Shikai — Zangetsu' + v;
    if (this.form === 'hollow') return 'Half-Hollowfication';
    if (this.form === 'chains') return `Blood Chains · ${this.clones.length} clones`;
    return (this.shellBroken ? 'True Bankai — the original Zangetsu' : 'True Bankai — Tensa Zangetsu') + v;
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    const G = this.form === 'hollow'
      ? { key: 'G', name: 'Blood Chains', kanji: '血鎖', cost: 30, cd: cd.chainsToggle, cdMax: 2, tint: '#ff6a5a' }
      : this.form === 'chains'
        ? { key: 'G', name: 'Release', kanji: '解', cd: cd.chainsToggle, cdMax: 2, active: true, tint: '#ff6a5a' }
        : { key: 'G', name: this.blut ? `Blut Vene ${Math.ceil(this.blutT)}s` : 'Blut Vene', kanji: '静血装', active: this.blut, timer: this.blut ? this.blutT / BLUT_MAX : 0, cd: cd.vene, cdMax: 3, tint: BLUT_CYAN };
    const common = [
      { key: 'Shift', name: this.form === 'chains' ? 'Shunpo · clone' : 'Shunpo', kanji: '瞬歩', cost: 4 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      G,
    ];
    if (this.form === 'shikai') return [
      { key: 'LMB', name: this.chainBlade ? 'Small blade' : 'Twin blades', kanji: '斬' },
      { key: 'RMB', name: this.chainBlade ? 'Chain — beckon' : 'Chain', kanji: '鎖', cost: 10, cd: cd.chain, cdMax: 1.2, active: this.chainBlade !== null },
      { key: 'Q', name: `Getsuga ×${this.flicks}`, kanji: '月牙', cost: 6, cd: this.flicks > 0 ? 0 : FLICK_REFILL - this.flickT, cdMax: FLICK_REFILL },
      { key: 'E', name: 'Large Getsuga', kanji: '月牙天衝', cost: 20, cd: cd.large, cdMax: 2.2 },
      { key: 'R', name: 'Getsuga Jūjishō', kanji: '十字衝', cost: 34, cd: cd.juji, cdMax: 7 },
      { key: 'F', name: 'Half-Hollow', kanji: '半虚化', cost: 40, tint: '#c9a0ff' },
      ...common,
    ];
    if (this.form === 'hollow') return [
      { key: 'LMB', name: 'White blade', kanji: '斬' },
      { key: 'RMB', name: 'Arm lock', kanji: '掴', cost: 12, cd: cd.grab, cdMax: 3.5 },
      { key: 'Q', name: 'Getsuga', kanji: '月牙', cost: 18, cd: cd.hgetsuga, cdMax: 1.6 },
      { key: 'E', name: 'Gran Rey Cero', kanji: '王虚', cost: 24, cd: cd.granrey, cdMax: 6, tint: '#c9a0ff' },
      { key: 'R', name: 'Cero Creciente', kanji: '月虚閃', cost: 40, cd: cd.creciente, cdMax: 9, tint: '#c9a0ff' },
      { key: 'F', name: 'True Bankai', kanji: '卍解', cost: 50, tint: '#ffe27a' },
      ...common,
    ];
    if (this.form === 'chains') return [
      { key: 'LMB', name: 'Cleaver · echoes', kanji: '斬' },
      { key: 'RMB', name: 'Chain bind', kanji: '縛', cost: 16, cd: cd.bind, cdMax: 6 },
      { key: 'Q', name: `Clone volley (${this.clones.length})`, kanji: '分身', cost: 6, cd: cd.volley, cdMax: 2 },
      { key: 'E', name: 'Chain wall', kanji: '鎖壁', cost: 18, cd: cd.wall, cdMax: 6 },
      { key: 'R', name: 'Blood Chains Getsuga', kanji: '月牙', cost: 50, cd: cd.bgetsuga, cdMax: 14, tint: '#f3f3f0' },
      { key: 'F', name: 'True Bankai', kanji: '卍解', cost: 50, tint: '#ffe27a' },
      ...common,
    ];
    return [
      { key: 'LMB', name: this.shellBroken ? 'Zangetsu' : 'Colossal swings', kanji: '斬' },
      { key: 'RMB', name: 'Golden cleave', kanji: '断', cost: 20, cd: cd.cleave, cdMax: 3.5 },
      { key: 'Q', name: 'Golden Getsuga', kanji: '月牙', cost: 26, cd: cd.ggetsuga, cdMax: 2.2, tint: '#ffe27a' },
      { key: 'E', name: 'Guard', kanji: '盾', cost: 10, cd: cd.guard, cdMax: 2.5 },
      { key: 'R', name: 'Impale + Getsuga', kanji: '突', cost: 22, cd: cd.impale, cdMax: 4 },
      { key: 'F', name: this.shellUsed ? 'Shell broken' : 'Shell Break', kanji: '斬月', cost: 60, active: this.shellUsed, tint: '#ffffff' },
      ...common,
    ];
  }

  ai(): KitAI {
    const shikai = () => this.form === 'shikai', hollow = () => this.form === 'hollow', chains = () => this.form === 'chains', bankai = () => this.form === 'bankai';
    const foeHp = () => {
      const t = this.target();
      return t ? t.hp / t.maxHp : 1;
    };
    return {
      reach: this.form === 'bankai' && !this.shellBroken ? 3 : 2.4,
      chain: this.form === 'shikai' ? 6 : this.form === 'bankai' && !this.shellBroken ? 3 : 5,
      releaseAt: [0.62, 0.32],
      toggleAt: 0.55,
      toggleOn: () => this.blut || this.form === 'chains' || (this.form === 'hollow' && this.cd.chainsToggle > 0),
      moves: [
        { name: 'flick', use: () => this.skill1(), min: 5, max: 45, weight: 2.6, cd: 0.7, when: () => shikai() && this.flicks > 0 },
        { name: 'large', use: () => this.skill2(), min: 0, max: 50, weight: 1.6, cd: 3, when: shikai },
        { name: 'juji', use: () => this.skill3(), min: 6, max: 60, weight: 1.4, cd: 8, when: shikai },
        { name: 'chain', use: () => this.heavy(), min: 5, max: 24, weight: 1.1, cd: 5, when: () => shikai() && !this.chainBlade },
        { name: 'beckon', use: () => this.heavy(), min: 0, max: 99, weight: 3, cd: 1, when: () => shikai() && this.chainBlade !== null && this.chainBlade.stuck !== null },
        { name: 'hgetsuga', use: () => this.skill1(), min: 5, max: 50, weight: 2, cd: 2.2, when: hollow },
        { name: 'armlock', use: () => this.heavy(), min: 0, max: 3, weight: 1.6, cd: 4, when: hollow },
        { name: 'granrey', use: () => this.skill2(), min: 6, max: 70, weight: 1.4, cd: 7, when: () => hollow() && this.f.hp > this.f.maxHp * 0.15 },
        { name: 'creciente', use: () => this.skill3(), min: 5, max: 60, weight: 1.5, cd: 10, when: hollow },
        { name: 'volley', use: () => this.skill1(), min: 0, max: 30, weight: 2, cd: 3, when: () => chains() && this.clones.length >= 2 },
        { name: 'bind', use: () => this.heavy(), min: 2, max: 14, weight: 1.3, cd: 7, when: chains },
        { name: 'wall', use: () => this.skill2(), min: 6, max: 40, weight: 0.8, cd: 8, when: chains },
        { name: 'bgetsuga', use: () => this.skill3(), min: 5, max: 60, weight: 1.6, cd: 15, when: () => chains() && this.clones.length >= 2 },
        { name: 'ggetsuga', use: () => this.skill1(), min: 5, max: 70, weight: 2.2, cd: 2.6, when: bankai },
        { name: 'cleave', use: () => this.heavy(), min: 2, max: 30, weight: 1.4, cd: 4, when: bankai },
        { name: 'impale', use: () => this.skill3(), min: 0, max: 3, weight: 1.4, cd: 5, when: bankai },
        { name: 'shellbreak', use: () => this.release(), min: 0, max: 10, weight: 3, cd: 6, when: () => bankai() && !this.shellUsed && foeHp() < 0.35 },
      ],
    };
  }
}
