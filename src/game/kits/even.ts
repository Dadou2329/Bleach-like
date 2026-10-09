// Even's kit (docs/kits/even.md). The Grand Kidō Chief, an original character and a tribute: far stronger than the
// canon roster on purpose, every form stronger than the last.
// Sealed: the Seigan string (LMB); Hadō #4 Byakurai, three bolts (RMB); Hadō #73 Sōren Sōkatsui (Q); Bakudō #81 Dankū
// (E); Bakudō #79 Kuyō Shibari (R); Hadō #90 Kurohitsugi, chantless (G); "Utsuse, Meikyō" (F).
// Shikai Meikyō: crystal cuts throwing prismatic crescents (LMB); Kakudai, the cut through a giant lens (RMB); Bunkō,
// the prism's seven rays, one effect per colour (Q); Hansha, the mirror that sends everything back (E); Shōten, the sun
// focused on the target (R); Senkō, the flash (G); the Bankai (F).
// Bankai Meikyō Shisui: the mirror lake follows him, slows his enemies and heals him; his reflection repeats every cut
// (LMB); Mizukagami-tsuki, the spike out of the target's reflection (RMB); Kyōzō, three glass copies (Q); Kagami-watari,
// under and above the target through the mirror (E); Senkyō Kōrō, the mirror prison (R); Kyōha, the mirror wave (G);
// "Kaigen" (F).
// Final Kōmyō Henjō: flight, light-speed Shunpo, half of every blow returned, statuses shrugged off; light cuts from
// every side (LMB); Issen, the level cut across the field (RMB); Hyakkakyō, the kaleidoscope (Q); Tenkyō Shōten, the sun
// through the sky's mirror (E); Kyōzō Hangyaku, the target's own reflection turned against it (R); Jōhari no Kagami,
// the judgment (G); the seal (F).
// Always: Shingan (illusions do not hold), Kagami-gawari (the first death is a reflection's).
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef, type PropDef } from '../fighter';
import type { Game } from '../game';
import { BANKAI_TIP_Z, FINAL_TIP_Z, KATANA_BASE_Z, KATANA_TIP_Z, SHIKAI_TIP_Z, evenAsset, evenProp, type EvenForm } from '../../chars/even';
import { EVEN_CHAIN, EVEN_CLIPS, EVEN_FINAL_CHAIN, EVEN_FINAL_STANCE, EVEN_STANCE } from '../../chars/evenClips';
import {
  AURA_EVEN, AURA_EVEN_BANKAI, AURA_EVEN_FINAL, CrystalSpike, GiantLens, GlassShatter, Glint, JudgmentMirror, Kaleidoscope, LIGHT_COLORS, MEIKYO_CYAN, MEIKYO_VIOLET,
  MirrorLake, MirrorPane, MirrorPrison, MirrorWave, PRISM_COLORS, PrismRays, ReleaseLight, SKY_STILL, SPECTRUM, SunFocus, SunPillar, lightMotes, lightSlash, prismBurst,
} from '../../vfx/meikyo';
import { SkyTint } from '../../vfx/fire';
import { PlanarSlash } from '../../vfx/tybw';
import { BlackCoffin } from '../../vfx/kurohitsugi';
import { groundAt } from '../../vfx/iceArts';
import { TEX_GLOW, TEX_STREAK } from '../../vfx/sprites';
import { ConeShape, SphereShape } from '../../destruction/shapes';
import { CeroBeam } from '../projectiles/cero';
import { GetsugaProjectile, type GetsugaOpts } from '../projectiles/getsuga';
import { DuelistAI } from '../ai/duelist';
import { rosterById } from '../registry';
import { vollFlight } from './sternritter';
import { KuyoShibari } from './urahara';
import { DankuWall } from './aizenTybw';
import type { AbilityInfo } from '../../ui/hud';
import type { Kit, KitAI } from './kit';

type BladeDef = NonNullable<FighterDef['blade']>;
type Form = EvenForm;

const BLADES: Record<Form, BladeDef> = {
  sealed: { prop: 'sword', base: [0, 0, KATANA_BASE_Z], tip: [0, 0, KATANA_TIP_Z], color: '#DCD6FF', core: '#FBFAFF' },
  shikai: { prop: 'sword', base: [0, 0, KATANA_BASE_Z], tip: [0, 0, SHIKAI_TIP_Z], color: '#CFE0FF', core: '#FFFFFF' },
  bankai: { prop: 'sword', base: [0, 0, KATANA_BASE_Z], tip: [0, 0, BANKAI_TIP_Z], color: '#A8E8FF', core: '#F6FDFF' },
  final: { prop: 'sword', base: [0, 0, KATANA_BASE_Z], tip: [0, 0, FINAL_TIP_Z], color: '#EFE8FF', core: '#FFFFFF' },
};
const TIP: Record<Form, number> = { sealed: KATANA_TIP_Z, shikai: SHIKAI_TIP_Z, bankai: BANKAI_TIP_Z, final: FINAL_TIP_Z };
const SPEEDS: Record<Form, FighterDef['speed']> = {
  sealed: { run: 11, sprint: 30, jump: 14, dash: 26, dashTime: 0.1 },
  shikai: { run: 11.5, sprint: 32, jump: 14, dash: 28, dashTime: 0.1 },
  bankai: { run: 12, sprint: 34, jump: 15, dash: 34, dashTime: 0.1 },
  // Kōsoku: light-speed Shunpo
  final: { run: 14, sprint: 42, jump: 16, dash: 40, dashTime: 0.07 },
};
const AURAS = { sealed: AURA_EVEN, shikai: AURA_EVEN, bankai: AURA_EVEN_BANKAI, final: AURA_EVEN_FINAL };
/** power, damage taken, regeneration (fraction of HP and rei per second) */
const STATS: Record<Form, { power: number; taken: number; hpRegen: number; reiRegen: number }> = {
  sealed: { power: 1.6, taken: 0.8, hpRegen: 0, reiRegen: 0 },
  shikai: { power: 2.5, taken: 0.6, hpRegen: 0, reiRegen: 3 },
  bankai: { power: 3.6, taken: 0.45, hpRegen: 0.015, reiRegen: 8 },
  final: { power: 5.5, taken: 0.15, hpRegen: 0.03, reiRegen: 20 },
};
const UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _m = new THREE.Matrix4();

function props(form: Form): PropDef[] {
  const p: PropDef[] = [{ key: 'sword', model: evenProp(form === 'sealed' ? 'katana' : form), socket: 'grip.R' }];
  if (form === 'sealed' || form === 'shikai') p.push({ key: 'saya', model: evenProp('saya'), socket: 'hip.L' });
  p.push({ key: 'glasses', model: evenProp(form === 'final' ? 'glassesLight' : 'glasses'), socket: 'glasses' });
  if (form === 'final') p.push({ key: 'halo', model: evenProp('aureole'), socket: 'halo' });
  return p;
}

export const EVEN_DEF: FighterDef = {
  id: 'even',
  name: 'Even',
  title: 'Grand Kidō Chief',
  build: () => ({ asset: evenAsset('sealed'), props: props('sealed') }),
  stance: EVEN_STANCE,
  clips: EVEN_CLIPS,
  aura: AURA_EVEN,
  blade: BLADES.sealed,
  hp: 2600,
  rei: 400,
  speed: { ...SPEEDS.sealed },
  radius: 0.33,
  height: 1.81,
};

/** one of Kyōzō's reflections: a glass copy of him with the Shikai's blade, far less sturdy */
export function mirrorDef(): FighterDef {
  return { ...EVEN_DEF, id: 'even-mirror', name: 'Even (reflection)', title: 'Kyōzō', hp: 420, rei: 200, build: () => ({ asset: evenAsset('shikai'), props: props('shikai') }), aura: AURA_EVEN_BANKAI, blade: BLADES.shikai, speed: { ...SPEEDS.shikai } };
}

/** the glass cast laid over a reflection (and over a rebellious one) */
function glassTint(f: Fighter): void {
  f.visual.forEachMaterial((m) => m.userData.uniforms.uTint.value.setRGB(0.8, 0.94, 1.28));
  f.data.glassVisual = f.visual;
}

// ------------------------------------------------------------------ helpers

function lungeTo(f: Fighter, stop: number, at: number, max = 26): number {
  const tgt = f.faceTarget;
  if (!tgt) return 0;
  const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
  if (d <= stop + 0.25 || d > 7.5) return 0;
  const per = (1 - Math.exp(-f.pushDrag * Math.max(0.06, at - 0.05))) / f.pushDrag;
  f.push.addScaledVector(f.forward(_v), Math.min(max, (d - stop) / per));
  return stop;
}

function lungeStop(f: Fighter, stop: number): number {
  const tgt = f.faceTarget;
  if (stop > 0 && tgt && Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z) <= stop) {
    f.push.x = 0;
    f.push.z = 0;
    return 0;
  }
  return stop;
}

/** room for a body at p (feet to head clear of the world) */
function clearAt(g: Game, p: THREE.Vector3, h: number): boolean {
  const w = g.engine.world, vs = w.vs;
  for (let y = p.y + 0.15; y < p.y + h; y += 0.25) if (w.isSolid(Math.floor(p.x / vs), Math.floor(y / vs), Math.floor(p.z / vs))) return false;
  return true;
}

/** the blade's direction right now, square to the facing (the plane a crescent is thrown in) */
function bladeSide(f: Fighter, out = new THREE.Vector3()): THREE.Vector3 {
  const b = f.blade;
  out.subVectors(b.tip, b.base);
  const fw = f.forward(_w);
  out.addScaledVector(fw, -out.dot(fw));
  if (out.lengthSq() < 1e-4) out.set(-fw.z, 0, fw.x);
  return out.normalize();
}

/** move a body to p (if there is room for it there) */
function place(g: Game, f: Fighter, p: THREE.Vector3): boolean {
  if (!clearAt(g, p, f.def.height)) return false;
  f.body.pos.copy(p);
  f.body.prev.copy(p);
  return true;
}

const spec = (damage: number, knock: number, cut: number, extra: Partial<BladeSpec> = {}): BladeSpec => ({ damage, knock, launch: 0, hitstop: 0.05, shake: 0.14, cut, ...extra });

/** blade windows of each cut (clip time) and its base spec (the form scales the cut power and the reach) */
const MOVES: Record<string, { at: [number, number]; spec: BladeSpec }> = {
  ev_s1: { at: [0.1, 0.2], spec: spec(26, 6, 600, { reach: 0.2 }) },
  ev_s2: { at: [0.1, 0.21], spec: spec(26, 7, 600) },
  ev_s3: { at: [0.1, 0.21], spec: spec(26, 7, 600) },
  ev_s4: { at: [0.11, 0.25], spec: spec(30, 9, 650) },
  ev_s5: { at: [0.1, 0.22], spec: spec(34, 3, 700, { launch: 10, hitstop: 0.07, shake: 0.22 }) },
  ef_s1: { at: [0.08, 0.18], spec: spec(34, 7, 1700) },
  ef_s2: { at: [0.08, 0.18], spec: spec(34, 7, 1700) },
  ef_s3: { at: [0.09, 0.21], spec: spec(36, 9, 1700) },
  ef_s4: { at: [0.09, 0.21], spec: spec(36, 9, 1700) },
  ef_s5: { at: [0.08, 0.19], spec: spec(40, 3, 1800, { launch: 12, hitstop: 0.07, shake: 0.22 }) },
  ef_s6: { at: [0.13, 0.27], spec: spec(48, 16, 2000, { heavy: true, hitstop: 0.1, shake: 0.4 }) },
};
const CUT_K: Record<Form, number> = { sealed: 1, shikai: 1.4, bankai: 2, final: 1 };

/** Marker for the skills a string can cancel into. */
abstract class SkillAction extends FighterAction {}

/** One cut of the string: the blade window, the step in; the form adds its crescent, its reflection or its blink. */
class MoveAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private stopAt = 0;
  private opened = false;
  queued = false;
  constructor(readonly kit: EvenKit, readonly clip: string, readonly index: number, readonly over?: Partial<BladeSpec>, track = true) {
    super();
    this.name = clip;
    this.mobility = 0.12;
    this.airGravity = 0.12;
    this.trackTarget = track;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    f.bladeHits.clear();
    this.kit.beforeCut(this.index);
    this.stopAt = lungeTo(f, 1.2, MOVES[this.clip].at[0]);
    f.anim.play(this.clip, { onEvent: (n) => n === 'step' && g.sfx.play('step', f.pos, 0.45) });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    this.stopAt = lungeStop(f, this.stopAt);
    const [a, b] = MOVES[this.clip].at;
    if (!this.opened && t >= a - 0.03) {
      this.opened = true;
      f.bladeHits.clear();
      f.bladeSpec = this.kit.cutSpec(this.clip, this.over);
      g.sfx.play('swing', f.center(), 0.9);
      this.kit.onCut(this.index);
    }
    f.bladeActive = t >= a && t <= b;
    if (f.trail) f.trail.emitting = t >= a - 0.03 && t <= b + 0.02;
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
    const w = MOVES[this.clip].at[1];
    if (next.name === 'dash') return this.t >= w;
    return next instanceof SkillAction && this.t >= w + 0.03;
  }
}

/** A skill: plays its clip, runs its events, ends with the clip (or at `endAt`). */
class Skill extends SkillAction {
  private fired = new Set<string>();
  private cancelAt: number;
  private hold: boolean;
  constructor(readonly kit: EvenKit, readonly name: string, readonly clip: string, readonly endAt: number, readonly events: Record<string, [number, () => void]>, opts: { armor?: number; mobility?: number; cancelAt?: number; hold?: boolean; invulnerable?: boolean } = {}) {
    super();
    this.mobility = opts.mobility ?? 0.2;
    this.armor = opts.armor ?? 0;
    this.cancelAt = opts.cancelAt ?? endAt * 0.8;
    this.hold = !!opts.hold;
    this.invulnerable = !!opts.invulnerable;
  }
  override start(f: Fighter): void {
    f.anim.play(this.clip, { onEvent: (n) => this.fire(n), hold: this.hold });
  }
  private fire(n: string): void {
    const e = this.events[n];
    if (!e || this.fired.has(n)) return;
    this.fired.add(n);
    e[1]();
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    for (const [n, [at]] of Object.entries(this.events)) if (this.t >= at + 0.03) this.fire(n);
    if (this.t >= this.endAt) this.done = true;
  }
  override end(f: Fighter): void {
    for (const n of Object.keys(this.events)) this.fire(n);
    if (this.hold) f.anim.stopAll(0.2);
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t >= this.cancelAt;
  }
}

/**
 * Kagami-watari: he sinks into the mirror at his feet, bursts out of it under the target with a rising cut, then drops
 * on it from above and drives it down into the water.
 */
class CrossingAction extends SkillAction {
  readonly name = 'kagami-watari';
  private step = 0;
  constructor(readonly kit: EvenKit, readonly target: Fighter) {
    super();
    this.mobility = 0;
    this.invulnerable = true;
    this.trackTarget = false;
    this.airGravity = 0;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('ev_dive', {});
    f.ghosts.spawn(0.5, 1);
    this.kit.lake?.ripple(f.pos, 1.4);
    this.kit.say('鏡渡り', 'KAGAMI-WATARI', MEIKYO_CYAN);
    g.sfx.play('shunpo', f.center(), 1);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const tg = this.target, kit = this.kit;
    if (this.step === 0 && this.t >= 0.14) {
      this.step = 1;
      f.visual.object.visible = false;
    }
    if (this.step === 1 && this.t >= 0.24) {
      this.step = 2;
      f.visual.object.visible = true;
      if (tg.dead) {
        this.done = true;
        return;
      }
      // out of the target's reflection, right under it: the rising cut
      const d = _v.subVectors(tg.pos, f.pos).setY(0);
      if (d.lengthSq() < 1e-4) f.forward(d);
      d.normalize();
      place(g, f, tg.pos.clone().addScaledVector(d, -(tg.def.radius + 0.9)));
      f.yaw = Math.atan2(d.x, d.z);
      f.anim.play('ev_s5', { fadeIn: 0.02 });
      g.damage(tg, 120, f, d.clone(), { knock: 2, launch: 18, heavy: true, hitstop: 0.1, shake: 0.5, unblockable: true, color: MEIKYO_CYAN });
      kit.lake?.ripple(tg.pos, 1.6);
      prismBurst(g, tg.center(), 1.4);
      g.sfx.play('swingHeavy', f.center(), 1);
    }
    if (this.step === 2 && this.t >= 0.6) {
      this.step = 3;
      if (tg.dead) {
        this.done = true;
        return;
      }
      // over it, and down
      const p = tg.center().add(_v.set(0, 2.2, 0));
      f.ghosts.spawn(0.4, 1);
      if (clearAt(g, p, f.def.height)) {
        f.body.pos.copy(p);
        f.body.prev.copy(p);
      }
      f.anim.play('ev_stab', { fadeIn: 0.02 });
      g.damage(tg, 200, f, _v.set(0, -1, 0).clone(), { knock: 0, heavy: true, hitstop: 0.16, shake: 0.9, unblockable: true, color: MEIKYO_CYAN });
      tg.body.vel.y = -32;
      const gy = groundAt(g, tg.pos.x, tg.pos.y, tg.pos.z, 30) ?? tg.pos.y;
      kit.after(0.12, () => {
        g.groundImpact(new THREE.Vector3(tg.pos.x, gy, tg.pos.z), 2.4, 1800, MEIKYO_CYAN, f);
        kit.lake?.ripple(tg.pos, 2);
      });
    }
    if (this.t >= 0.95) this.done = true;
  }
  override end(f: Fighter): void {
    f.visual.object.visible = true;
  }
}

// ------------------------------------------------------------------ the kit

export interface EvenOpts {
  /** a reflection (Kyōzō): fixed in the Shikai, no releases, no second life */
  mirror?: boolean;
}

export class EvenKit implements Kit {
  form: Form = 'sealed';
  comboIndex = 0;
  private lastSwingEnd = 0;
  flare = false;
  readonly mirror: boolean;
  /** Dankū and Hansha */
  private danku: DankuWall | null = null;
  private pane: MirrorPane | null = null;
  private paneShotT = 0;
  /** the Bankai's lake and sky */
  lake: MirrorLake | null = null;
  private sky: SkyTint | null = null;
  /** Kyōzō's reflections and Kyōzō Hangyaku's rebels, with the time each has left */
  private copies: { f: Fighter; t: number }[] = [];
  /** Kagami-gawari is spent */
  revived = false;
  private muzzle = new THREE.Object3D();
  private timers: { t: number; fn: () => void }[] = [];
  private hudT = 0;
  private moteT = 0;
  private rippleT = 0;
  private dashFrom: THREE.Vector3 | null = null;
  private reflecting = false;
  readonly cd = { byakurai: 0, sokatsui: 0, danku: 0, kuyo: 0, kuro: 0, lens: 0, prism: 0, mirror: 0, focus: 0, flash: 0, spike: 0, copies: 0, cross: 0, prison: 0, wave: 0, issen: 0, kaleido: 0, sun: 0, rebel: 0, judge: 0, release: 0, glasses: 0 };

  constructor(readonly f: Fighter, readonly g: Game, o: EvenOpts = {}) {
    this.mirror = !!o.mirror;
    f.data.kit = this;
    f.parry = (amount, from, opts) => this.parry(amount, from, opts);
    if (!this.mirror) {
      f.onLethal = () => this.kagamiGawari();
      f.onHurt = (amount) => this.hurt(amount);
    }
    if (this.mirror) {
      this.form = 'shikai';
      f.def = { ...f.def, stance: EVEN_STANCE, speed: { ...SPEEDS.shikai } };
    }
    this.hands();
    this.attachMuzzle();
    this.applyStats();
  }

  /** a technique's name on screen (his reflections fight in silence) */
  say(kanji: string, romaji: string, color: string): void {
    if (!this.mirror) this.g.callout(kanji, romaji, color);
  }

  // ---------------------------------------------------------------- per step

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    for (let i = this.timers.length - 1; i >= 0; i--) {
      const tm = this.timers[i];
      tm.t -= dt;
      if (tm.t > 0) continue;
      this.timers.splice(i, 1);
      tm.fn();
    }
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    // Shingan: no illusion holds him
    f.blindT = 0;
    f.invertT = 0;
    f.iffT = 0;
    f.scrambleT = 0;
    f.scent = 0;
    if (this.danku?.done) this.danku = null;
    if (this.pane) this.tendPane(dt);
    // fallen: the still water drains and the sky comes back
    if (f.dead && this.sky) {
      this.sky.target = 0;
      this.sky = null;
    }
    const st = STATS[this.form];
    if (!f.dead && !this.mirror) {
      if (st.hpRegen > 0) f.hp = Math.min(f.maxHp, f.hp + f.maxHp * st.hpRegen * dt);
      if (st.reiRegen > 0) f.rei = Math.min(f.maxRei, f.rei + st.reiRegen * dt);
      if (this.form === 'bankai' || this.form === 'final') {
        this.moteT -= dt;
        if (this.moteT <= 0) {
          this.moteT = 0.14;
          lightMotes(g, f, 1, this.form === 'final' ? '#EFE8FF' : MEIKYO_CYAN, 0.5);
        }
      }
    }
    if (this.lake) this.tendLake(dt);
    if (this.form === 'final' && !f.dead && !this.mirror) {
      // nothing holds him: every status shrugged off, and he flies
      f.slowT = 0; f.slowK = 0; f.dilateT = 0; f.dilateK = 0; f.sealT = 0; f.sealK = 0;
      f.disarmT = Math.min(f.disarmT, 0.01); f.armLockT = 0; f.puppetT = 0;
      f.heavyB = 0; f.heavyW = 0; f.agedT = 0; f.agedK = 0; f.wetT = 0; f.rooted = false;
      vollFlight(g, f, g.nearestEnemy(f, 80), 1);
      if (!f.action && f.dashT <= 0 && f.hitstun <= 0 && !f.anim.isPlaying()) f.anim.play('ef_float', { fadeIn: 0.3 });
      // Kōsoku: a line of light left where he went
      if (f.dashT > 0 && !this.dashFrom) this.dashFrom = f.pos.clone();
      if (f.dashT <= 0 && this.dashFrom) {
        const a = this.dashFrom.clone().setY(this.dashFrom.y + 1.1), b = f.pos.clone().setY(f.pos.y + 1.1);
        const d = b.clone().sub(a);
        const L = d.length();
        if (L > 1) lightSlash(g, a.clone().lerp(b, 0.5), d.divideScalar(L), L, '#EFE8FF');
        this.dashFrom = null;
      }
    }
    if (this.copies.length) this.tendCopies(dt);
    this.hudT -= dt;
    if (this.hudT <= 0 && g.hud && f === g.player) {
      this.hudT = 0.25;
      g.hud.form = this.formName();
    }
  }

  after(s: number, fn: () => void): void {
    this.timers.push({ t: s, fn });
  }

  /** the right hand closed on the hilt, the left open */
  private hands(): void {
    const rig = this.f.visual.rig;
    rig.setBoneVisible('fist.R', true);
    rig.setBoneVisible('palm.R', false);
    rig.setBoneVisible('fist.L', false);
    rig.setBoneVisible('palm.L', true);
  }

  /** an empty object at the blade's point: the beams leave from it */
  private attachMuzzle(): void {
    const p = this.f.visual.props.get('sword');
    if (!p) return;
    p.add(this.muzzle);
    this.muzzle.position.set(0, 0, TIP[this.form] * 0.96);
  }

  // ---------------------------------------------------------------- inputs

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof MoveAction) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastSwingEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const list = this.form === 'final' ? EVEN_FINAL_CHAIN : EVEN_CHAIN;
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    this.lastSwingEnd = this.g.time + 0.8;
    this.f.act(new MoveAction(this, list[idx], idx), true);
  }

  /** the blade spec of a cut in this form */
  cutSpec(clip: string, over?: Partial<BladeSpec>): BladeSpec {
    const base = MOVES[clip].spec;
    const k = CUT_K[this.form];
    return { ...base, cut: base.cut * k, reach: (base.reach ?? 0) + (this.form === 'bankai' ? 0.35 : this.form === 'final' ? 0.5 : 0.1), ...over };
  }

  /** before a cut starts: the final form's light-speed blink to a new side of the target */
  beforeCut(index: number): void {
    const { f, g } = this;
    if (this.form !== 'final') return;
    const t = this.target(30);
    if (!t) return;
    const a = f.yaw + Math.PI + ((index % 2 ? 1 : -1) * (0.9 + index * 0.35));
    const d = _v.set(Math.sin(a), 0, Math.cos(a));
    const p = t.pos.clone().addScaledVector(d, t.def.radius + 1.3);
    p.y = Math.max(p.y, t.pos.y);
    const from = f.center();
    f.ghosts.spawn(0.35, 1);
    if (!place(g, f, p)) return;
    f.yaw = Math.atan2(t.pos.x - p.x, t.pos.z - p.z);
    const to = f.center();
    const dir = to.clone().sub(from);
    const L = dir.length();
    if (L > 0.5) lightSlash(g, from.clone().lerp(to, 0.5), dir.divideScalar(L), L, '#EFE8FF');
  }

  /** a cut's window opened: the form's addition */
  onCut(index: number): void {
    const { f, g } = this;
    if (this.form === 'shikai') {
      const last = index === 4;
      this.crescent(last ? { radius: 2.2, halfAngle: 0.95, speed: 50, range: 28, damage: 40, cut: 900, colors: PRISM_COLORS } : { radius: 1.3, halfAngle: 0.85, speed: 48, range: 14, damage: 18, cut: 700, colors: PRISM_COLORS, band: 0.4 });
      prismBurst(g, this.tipPoint(new THREE.Vector3()), 0.35);
    } else if (this.form === 'bankai') this.shadowCut(index);
    else if (this.form === 'final') {
      this.crescent({ radius: 3, halfAngle: 1.05, speed: 64, range: 42, damage: 60, cut: 1700, colors: LIGHT_COLORS });
      lightMotes(g, f, 2, '#EFE8FF', 0.4);
    }
  }

  /** a crescent thrown off the swing, in the blade's plane */
  private crescent(o: GetsugaOpts): void {
    const { f, g } = this;
    const fw = f.forward(new THREE.Vector3());
    const aim = this.aim();
    const from = f.center().addScaledVector(fw, 0.7);
    const dir = aim.sub(from).normalize();
    if (Math.abs(dir.y) > 0.5) dir.setY(Math.sign(dir.y) * 0.5).normalize();
    g.addProjectile(new GetsugaProjectile(g, f, from, dir, bladeSide(f), o));
  }

  /** Kyōei: his reflection rises behind the target a moment later and repeats the cut */
  private shadowCut(index: number): void {
    const { f, g } = this;
    const t = this.target(9);
    if (!t) return;
    const dmg = (MOVES[(this.form === 'final' ? EVEN_FINAL_CHAIN : EVEN_CHAIN)[index]]?.spec.damage ?? 26) * 0.6;
    this.after(0.12, () => {
      if (t.dead || f.dead) return;
      // the pose turned half round the target: the same cut from the far side
      const c = t.pos;
      _m.makeTranslation(c.x, 0, c.z).multiply(new THREE.Matrix4().makeRotationY(Math.PI)).multiply(new THREE.Matrix4().makeTranslation(-c.x, 0, -c.z));
      f.ghosts.spawn(0.35, 1.3, _m);
      const dir = _v.subVectors(t.pos, f.pos).setY(0).normalize().negate().clone();
      lightSlash(g, t.center(), dir.clone().applyAxisAngle(UP, Math.PI / 2).setY(index % 2 ? 0.5 : -0.4).normalize(), 3, MEIKYO_CYAN);
      g.damage(t, dmg, f, dir, { knock: 4, hitstop: 0.03, unblockable: true, color: MEIKYO_CYAN });
      this.lake?.ripple(t.pos, 0.8);
    });
  }

  /** RMB */
  heavy(): void {
    switch (this.form) {
      case 'sealed':
        this.special(new Skill(this, 'byakurai', 'ev_point', 0.62, { fire1: [0.14, () => this.byakurai(0)], fire2: [0.26, () => this.byakurai(1)], fire3: [0.38, () => this.byakurai(2)] }, { mobility: 0.1 }), 12, 'byakurai', 2.2);
        return;
      case 'shikai':
        this.special(new Skill(this, 'kakudai', 'ev_lens', 0.75, { lens: [0.12, () => this.lensUp()], cut: [0.32, () => this.kakudai()] }, { armor: 0.5, mobility: 0.05 }), 16, 'lens', 2.6);
        return;
      case 'bankai':
        this.special(new Skill(this, 'spike', 'ev_stab', 0.75, { stab: [0.3, () => this.mizukagami()] }, { armor: 0.5, mobility: 0.05 }), 22, 'spike', 2.8);
        return;
      case 'final':
        this.special(new Skill(this, 'issen', 'ef_issen', 0.9, { draw: [0.1, () => this.g.sfx.play('charge', this.f.center(), 1)], cut: [0.5, () => this.issen()] }, { armor: 0.8, mobility: 0.1 }), 40, 'issen', 4.5);
    }
  }

  /** Q */
  skill1(): void {
    switch (this.form) {
      case 'sealed':
        this.special(new Skill(this, 'sokatsui', 'ev_twin', 0.7, { fire: [0.3, () => this.sorenSokatsui()] }, { mobility: 0.05, armor: 0.3 }), 18, 'sokatsui', 3.5);
        return;
      case 'shikai':
        this.special(new Skill(this, 'bunko', 'ev_prism', 0.75, { cast: [0.3, () => this.bunko()] }, { mobility: 0.1, armor: 0.4 }), 26, 'prism', 5.5);
        return;
      case 'bankai':
        if (this.mirror) return;
        this.special(new Skill(this, 'kyozo', 'ev_summon', 0.9, { call: [0.5, () => this.kyozo(3)] }, { mobility: 0.1 }), 40, 'copies', 16);
        return;
      case 'final': {
        const t = this.target(50);
        if (!t) return this.nobody();
        this.special(new Skill(this, 'hyakkakyo', 'ef_frame', 0.8, { cast: [0.3, () => this.kaleidoscope(t)] }, { mobility: 0.1, invulnerable: true }), 40, 'kaleido', 9);
      }
    }
  }

  /** E */
  skill2(): void {
    switch (this.form) {
      case 'sealed':
        this.special(new Skill(this, 'danku', 'ev_wall', 0.5, { cast: [0.12, () => this.dankuUp()] }, { mobility: 0.3 }), 16, 'danku', 7);
        return;
      case 'shikai':
        this.special(new Skill(this, 'hansha', 'ev_mirror', 0.6, { cast: [0.1, () => this.hansha(2.5)] }, { mobility: 0.3 }), 18, 'mirror', 7);
        return;
      case 'bankai': {
        const t = this.target(45);
        if (!t) return this.nobody();
        this.special(new CrossingAction(this, t), 26, 'cross', 4);
        return;
      }
      case 'final':
        this.special(new Skill(this, 'tenkyo', 'ef_sun', 1.0, { open: [0.3, () => this.tenkyo()] }, { mobility: 0.05, armor: 1 }), 60, 'sun', 10);
    }
  }

  /** R */
  skill3(): void {
    switch (this.form) {
      case 'sealed': {
        const t = this.target(34);
        if (!t) return this.nobody();
        this.special(new Skill(this, 'kuyo', 'ev_bind', 0.55, { cast: [0.16, () => this.kuyo(t)] }), 18, 'kuyo', 8);
        return;
      }
      case 'shikai':
        this.special(new Skill(this, 'shoten', 'ev_focus', 0.8, { raise: [0.2, () => this.say('焦点', 'SHŌTEN', '#FFE7B0')], call: [0.45, () => this.shoten()] }, { mobility: 0.15 }), 28, 'focus', 8);
        return;
      case 'bankai': {
        const t = this.target(45);
        if (!t) return this.nobody();
        this.special(new Skill(this, 'senkyo', 'ev_prison', 0.85, { cage: [0.2, () => this.prison(t)] }, { mobility: 0.1, armor: 0.5 }), 36, 'prison', 9);
        return;
      }
      case 'final': {
        const t = this.target(60);
        if (!t) return this.nobody();
        this.special(new Skill(this, 'hangyaku', 'ef_rebel', 0.8, { cast: [0.4, () => this.rebel(t)] }, { mobility: 0.1, invulnerable: true }), 50, 'rebel', 22);
      }
    }
  }

  /** F: up the ladder; from the final form, everything sealed */
  release(): void {
    const { f, g } = this;
    if (this.mirror || f.busy || f.sealT > 0 || this.cd.release > 0) return;
    if (this.form === 'sealed') {
      if (!f.spendRei(20)) return this.noRei();
      f.act(new Skill(this, 'release', 'ev_release', 0.9, {
        name: [0.22, () => this.say('映せ「明鏡」', 'UTSUSE, MEIKYŌ', MEIKYO_VIOLET)],
        shine: [0.48, () => this.toShikai()],
      }, { armor: 0.8, mobility: 0.1 }), true);
      g.addProjectile(new Glint(g, f, 0.5));
      return;
    }
    if (this.form === 'shikai') {
      if (!f.spendRei(40)) return this.noRei();
      f.act(new Skill(this, 'bankai', 'ev_bankai', 1.5, {
        name: [0.3, () => this.say('卍解「明鏡止水」', 'BANKAI — MEIKYŌ SHISUI', MEIKYO_CYAN)],
        lake: [0.85, () => this.toBankai()],
      }, { invulnerable: true, mobility: 0 }), true);
      g.sfx.play('bankai', f.center(), 1);
      return;
    }
    if (this.form === 'bankai') {
      if (!f.spendRei(60)) return this.noRei();
      f.act(new Skill(this, 'kaigen', 'ev_kaigen', 1.6, {
        name: [0.3, () => this.say('開眼「光明遍照」', 'KAIGEN — KŌMYŌ HENJŌ', '#EFE8FF')],
        rise: [0.75, () => this.toFinal()],
      }, { invulnerable: true, mobility: 0 }), true);
      g.addProjectile(new Glint(g, f, 0.7, '#E8DCFF', 0.6));
      g.sfx.play('bankai', f.center(), 1.2);
      return;
    }
    f.act(new Skill(this, 'seal', 'ev_seal', 0.5, { cast: [0.2, () => this.toSealed()] }), true);
  }

  /** G */
  toggle(): void {
    switch (this.form) {
      case 'sealed':
        this.special(new Skill(this, 'kurohitsugi', 'ev_coffin', 1.0, { cast: [0.4, () => this.kurohitsugi()] }, { mobility: 0.05, armor: 0.5 }), 34, 'kuro', 9);
        return;
      case 'shikai':
        this.special(new Skill(this, 'senko', 'ev_flash', 0.55, { flash: [0.18, () => this.senko()] }, { mobility: 0.2 }), 20, 'flash', 9);
        return;
      case 'bankai':
        if (this.mirror) return;
        this.special(new Skill(this, 'kyoha', 'ev_wave', 1.2, { rise: [0.35, () => this.kyoha()] }, { mobility: 0, armor: 0.8 }), 50, 'wave', 14);
        return;
      case 'final': {
        const t = this.target(70);
        if (!t) return this.nobody();
        this.special(new Skill(this, 'johari', 'ef_judge', 1.6, { rise: [0.3, () => this.judgment(t)] }, { invulnerable: true, mobility: 0 }), 80, 'judge', 35);
      }
    }
  }

  toggleFlare(): void {
    this.flare = !this.flare;
    this.applyStats();
    if (this.flare) {
      this.f.aura.flare(1.8, 0.45);
      this.g.shake(0.25);
      this.g.sfx.play('flare', this.f.center());
      prismBurst(this.g, this.f.center(), 1.4);
    }
  }

  /** the opener: he pushes his glasses up and they flash */
  glasses(): void {
    const { f, g } = this;
    if (this.cd.glasses > 0 || f.busy) return;
    this.cd.glasses = 6;
    f.act(new Skill(this, 'glasses', 'ev_glasses', 0.75, { glint: [0.26, () => g.addProjectile(new Glint(g, f, 0.55))] }, { mobility: 0.3 }), true);
  }

  private noRei(): void {
    if (this.f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
  }

  private nobody(): void {
    if (this.f === this.g.player) this.g.hud?.showBanner('No one in reach', 1);
  }

  target(range: number): Fighter | null {
    return this.g.nearestEnemy(this.f, range, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, range);
  }

  /** where he aims: the target, or the camera's aim for the player */
  aim(out = new THREE.Vector3()): THREE.Vector3 {
    const { f, g } = this;
    const t = this.target(120);
    if (t) return t.center(out);
    if (f === g.player && !f.faceTarget) return g.aimPoint(f, out);
    if (f.faceTarget) return out.copy(f.faceTarget);
    return f.center(out).addScaledVector(f.forward(_w), 30);
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

  private sock(name: string, out: THREE.Vector3): THREE.Vector3 {
    const s = this.f.visual.rig.sockets.get(name);
    if (!s) return this.f.center(out).addScaledVector(this.f.forward(_w), 0.5);
    s.updateWorldMatrix(true, false);
    return s.getWorldPosition(out);
  }

  tipPoint(out: THREE.Vector3): THREE.Vector3 {
    this.muzzle.updateWorldMatrix(true, false);
    return this.muzzle.getWorldPosition(out);
  }

  // ---------------------------------------------------------------- forms

  private setForm(form: Form): void {
    const { f } = this;
    this.form = form;
    f.def = { ...f.def, stance: form === 'final' ? EVEN_FINAL_STANCE : EVEN_STANCE, speed: { ...SPEEDS[form] } };
    f.setForm({ asset: evenAsset(form), props: props(form) }, AURAS[form], BLADES[form]);
    f.trail?.reset();
    this.hands();
    this.attachMuzzle();
    this.applyStats();
  }

  private toShikai(): void {
    const { f, g } = this;
    if (this.form !== 'sealed') return;
    this.setForm('shikai');
    f.aura.flare(1.3, 0.35);
    prismBurst(g, this.tipPoint(new THREE.Vector3()), 1.4);
    lightMotes(g, f, 30, MEIKYO_VIOLET, 0.6);
    g.sfx.play('flare', f.center(), 0.8);
    g.sfx.play('ting', f.center(), 1.2);
  }

  private toBankai(): void {
    const { f, g } = this;
    if (this.form !== 'shikai') return;
    this.setForm('bankai');
    // the Bankai mends him: he rises out of it whole
    f.hp = f.maxHp;
    f.aura.flare(1.7, 0.6);
    f.aura.pillarBurst(2.4);
    g.addProjectile(new ReleaseLight(g, f, MEIKYO_CYAN, 1.8, 1.4));
    if (!this.lake || this.lake.ending) {
      this.lake = new MirrorLake(g, f, 60);
      g.addProjectile(this.lake);
    }
    if (!this.sky) {
      this.sky = new SkyTint(g, SKY_STILL, 1.0);
      g.addProjectile(this.sky);
    }
    this.lake.ripple(f.pos, 2);
    for (let i = 0; i < 3; i++) g.addRing(f.pos.clone().setY(f.pos.y + 0.2), 12 + i * 10, i === 1 ? MEIKYO_VIOLET : MEIKYO_CYAN, 0.8 + i * 0.3);
    g.shake(0.8);
    g.slowMo(0.5, 0.4);
  }

  private toFinal(): void {
    const { f, g } = this;
    if (this.form !== 'bankai') return;
    this.setForm('final');
    f.hp = f.maxHp;
    f.rei = f.maxRei;
    f.body.vel.y = 9;
    f.body.grounded = false;
    f.aura.flare(1.9, 0.8);
    f.aura.pillarBurst(3);
    g.addProjectile(new ReleaseLight(g, f, '#EFE8FF', 2.2, 1.6));
    this.lake?.ripple(f.pos, 2.5);
    for (let i = 0; i < 4; i++) g.addRing(f.pos.clone().setY(f.pos.y + 0.2), 14 + i * 10, i % 2 ? '#FF9EDB' : '#F4F0FF', 0.9 + i * 0.3);
    prismBurst(g, f.center(), 3);
    g.shake(1.2);
    g.slowMo(0.7, 0.35);
  }

  private toSealed(): void {
    const { f, g } = this;
    if (this.form === 'sealed') return;
    f.mounted = false;
    this.lake?.end();
    this.lake = null;
    if (this.sky) this.sky.target = 0;
    this.sky = null;
    this.setForm('sealed');
    this.cd.release = 4;
    g.sfx.play('ting', f.center(), 0.8);
    lightMotes(g, f, 20, MEIKYO_VIOLET);
  }

  private applyStats(): void {
    const f = this.f;
    const st = STATS[this.form];
    f.power = st.power * (this.flare ? 1.25 : 1) * (this.mirror ? 0.5 : 1);
    f.damageTaken = this.mirror ? 1 : st.taken;
    f.knockTaken = this.form === 'final' ? 0 : this.form === 'bankai' ? 0.4 : 0.8;
    f.energyTaken = this.form === 'final' ? 0.6 : 1;
    f.aura.target = this.flare ? 1 : this.form === 'final' ? 0.24 : this.form === 'bankai' ? 0.22 : this.form === 'shikai' ? 0.14 : 0.06;
  }

  formName(): string {
    if (this.mirror) return 'Kyōzō (reflection)';
    const name = this.form === 'sealed' ? 'Meikyō (sealed)' : this.form === 'shikai' ? 'Meikyō' : this.form === 'bankai' ? 'Meikyō Shisui' : 'Kōmyō Henjō';
    const n = this.copies.filter((c) => !c.f.dead).length;
    const copies = n ? ` · ${n} reflection${n > 1 ? 's' : ''}` : '';
    const mirror = this.pane?.holds() ? ' · Hansha' : this.danku && !this.danku.done ? ' · Dankū' : '';
    return name + copies + mirror;
  }

  // ---------------------------------------------------------------- passives

  /** Kagami-gawari: the first death refused — it was a reflection that was struck, and it shatters */
  private kagamiGawari(): boolean {
    const { f, g } = this;
    if (this.revived) return false;
    this.revived = true;
    f.hp = f.maxHp * 0.5;
    f.invuln = Math.max(f.invuln, 2);
    f.stopAction();
    f.hitstun = 0;
    const c = f.center();
    g.addProjectile(new GlassShatter(g, c, 50, 11, 0.4, 1.3, 3));
    prismBurst(g, c, 2.4);
    // he steps out from behind whoever struck the reflection
    const from = f.lastHurt.from;
    if (from && !from.dead && from !== f) {
      const back = from.forward(new THREE.Vector3()).negate();
      place(g, f, from.pos.clone().addScaledVector(back, from.def.radius + 1.3));
      f.yaw = Math.atan2(from.pos.x - f.pos.x, from.pos.z - f.pos.z);
    }
    this.say('鏡代わり', 'KAGAMI-GAWARI', MEIKYO_VIOLET);
    g.sfx.play('crack', c, 1.4);
    g.slowMo(0.6, 0.35);
    return true;
  }

  /** the final form's Hansha: half of every blow that reaches him goes back to the one who struck it, as light */
  private hurt(amount: number): void {
    const { f, g } = this;
    if (this.form !== 'final' || this.reflecting || f.dead) return;
    const lh = f.lastHurt;
    const from = lh.from;
    if (!from || from === f || from.dead || lh.reflected) return;
    const raw = amount / Math.max(0.05, f.damageTaken);
    this.reflecting = true;
    const dir = _v.subVectors(from.pos, f.pos).setY(0).normalize().clone();
    g.damage(from, (raw * 0.5) / Math.max(0.01, f.power), f, dir, { energy: true, unblockable: true, reflected: from, knock: 6, quiet: raw < 12, color: '#EFE8FF' });
    this.reflecting = false;
    lightSlash(g, from.center(), dir.clone().applyAxisAngle(UP, Math.PI / 2), 1.6, '#EFE8FF');
  }

  /** blows from in front stopped by Dankū or turned back by Hansha */
  private parry(amount: number, from: Fighter | null, o: { quiet?: boolean }): boolean {
    const { f, g } = this;
    if (!from || from === f) return false;
    if (this.danku && !this.danku.done && this.danku.covers(from.pos)) {
      if (!o.quiet) g.sparks(f.center().addScaledVector(f.forward(_v), 1.4), f.forward(_w), '#CFE0FF', 10);
      return true;
    }
    const pane = this.pane;
    if (pane?.holds() && pane.covers(from.pos)) {
      pane.flash();
      if (!from.dead && !o.quiet) {
        const dir = _v.subVectors(from.pos, f.pos).setY(0).normalize().clone();
        g.damage(from, (amount * 1.5) / Math.max(0.01, f.power), f, dir, { energy: true, unblockable: true, reflected: from, knock: 10, launch: 3, heavy: true, hitstop: 0.08, color: MEIKYO_VIOLET });
        lightSlash(g, from.center(), dir.clone().applyAxisAngle(UP, Math.PI / 2), 2.4, MEIKYO_VIOLET);
        if (f === g.player || from === g.player) g.hud?.floatText(f.center().setY(f.pos.y + f.def.height + 0.3), 'REFLECTED', '#DCCDFF', 18);
      }
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- sealed: Kidō

  /** Hadō #4 Byakurai: white lightning from the fingertip (three bolts) */
  private byakurai(i: number): void {
    const { f, g } = this;
    const emitter = f.visual.rig.sockets.get('finger.L');
    if (!emitter) return;
    // one tick each (0.25 of the damage): a bolt of 58
    g.addProjectile(new CeroBeam(g, f, emitter, () => this.aim(new THREE.Vector3()), { charge: 0.02, fire: 0.2, radius: 0.15, damage: 232, power: 600, core: '#FFFFFF', body: '#CFE6FF', rim: '#6A8CE0', range: 95, track: 3, gain: 1.7 }));
    if (i === 0) this.say('破道の四「白雷・三連」', 'HADŌ #4 — BYAKURAI: SANREN', '#DDEBFF');
    g.sfx.play('shunpo', f.center(), 1.3);
  }

  /** Hadō #73 Sōren Sōkatsui: blue fire from the left palm and the blade's point together */
  private sorenSokatsui(): void {
    const { f, g } = this;
    const aim = this.aim(new THREE.Vector3());
    this.say('破道の七十三「双蓮蒼火墜」', 'HADŌ #73 — SŌREN SŌKATSUI', '#7FC8FF');
    g.sfx.play('getsuga', f.center(), 1.1);
    const hit = new Set<number>();
    for (const src of [this.sock('palm.L', new THREE.Vector3()), this.tipPoint(new THREE.Vector3())]) {
      const dir = aim.clone().sub(src).normalize();
      g.engine.destruction.carve(new ConeShape(src.clone(), dir.clone(), 0.38, 15), { mode: 'explode', power: 260, impulse: 14 });
      for (const o of g.enemiesOf(f)) {
        _v.subVectors(o.center(), src);
        const along = _v.dot(dir);
        if (along < 0 || along > 16) continue;
        const off = _v.addScaledVector(dir, -along).length();
        if (off > 1.4 + along * 0.38 + o.def.radius) continue;
        g.damage(o, 70, f, dir.clone().setY(0.25).normalize(), { energy: true, knock: 15, launch: 5, heavy: !hit.has(o.id), hitstop: 0.08, shake: 0.45, color: '#7FC8FF' });
        hit.add(o.id);
      }
      const glow = g.engine.glow;
      const side = new THREE.Vector3(dir.z, 0, -dir.x).normalize();
      const up = new THREE.Vector3().crossVectors(side, dir);
      for (let i = 0; i < 70; i++) {
        const spread = 0.36 * Math.random();
        const a = Math.random() * Math.PI * 2;
        const d = dir.clone().addScaledVector(side, Math.cos(a) * spread).addScaledVector(up, Math.sin(a) * spread).normalize();
        const s = 12 + Math.random() * 18;
        const hot = Math.random() < 0.35;
        glow.spawn({ x: src.x, y: src.y, z: src.z, vx: d.x * s, vy: d.y * s + 1, vz: d.z * s, size: hot ? 0.5 : 0.85, sizeEnd: 0.1, life: 0.35 + Math.random() * 0.35, r: hot ? 0.81 : 0.25, g: hot ? 0.94 : 0.66, b: 1, alpha: 0.9, alphaEnd: 0, tex: Math.random() < 0.5 ? TEX_GLOW : TEX_STREAK, stretch: 2, drag: 1.5 });
      }
    }
    f.push.addScaledVector(f.forward(_v), -3);
  }

  /** Bakudō #81 Dankū: the wall before him */
  private dankuUp(): void {
    const { f, g } = this;
    this.danku = new DankuWall(g, f, 3);
    g.addProjectile(this.danku);
    this.say('縛道の八十一「断空」', 'BAKUDŌ #81 — DANKŪ', '#DDEBFF');
    g.sfx.play('ting', f.center(), 1.5);
  }

  /** Bakudō #79 Kuyō Shibari: nine seals, the target held */
  private kuyo(t: Fighter): void {
    const { f, g } = this;
    if (t.dead) return;
    g.addProjectile(new KuyoShibari(g, f, t, 3));
    this.say('縛道の七十九「九曜縛」', 'BAKUDŌ #79 — KUYŌ SHIBARI', '#8E4FD8');
  }

  /** Hadō #90 Kurohitsugi, chantless at full power */
  private kurohitsugi(): void {
    const { f, g } = this;
    const t = this.target(40);
    const at = t ? t.center() : f.center().addScaledVector(f.forward(_w), 12);
    g.addProjectile(new BlackCoffin(g, f, t, at, 260, 1.15, 0.45, 1.5));
    this.say('破道の九十「黒棺」', 'HADŌ #90 — KUROHITSUGI', '#8E4FD8');
  }

  // ---------------------------------------------------------------- Shikai: the glass

  private lens: GiantLens | null = null;

  private lensUp(): void {
    const { f, g } = this;
    const fw = this.flatAim();
    this.lens = new GiantLens(g, f.center().addScaledVector(fw, 1.7), fw, this.mirror ? 1.4 : 2.4, 0.75);
    g.addProjectile(this.lens);
    g.sfx.play('ting', f.center(), 1.6);
  }

  /** the horizontal direction he aims along */
  private flatAim(): THREE.Vector3 {
    const { f } = this;
    const d = this.aim(new THREE.Vector3()).sub(f.pos).setY(0);
    if (d.lengthSq() < 1e-4) f.forward(d);
    return d.normalize();
  }

  /** Kakudai: the cut through the lens comes out huge — a level cut through everything ahead */
  private kakudai(): void {
    const { f, g } = this;
    const fw = this.flatAim();
    const right = new THREE.Vector3(fw.z, 0, -fw.x);
    const c = f.center();
    const origin = c.clone().addScaledVector(fw, 1.7);
    // a reflection's lens is a small one: its cut reaches a street's width, not the whole district
    const len = this.mirror ? 14 : 42, half = this.mirror ? 2 : 4;
    this.lens?.flash();
    g.addProjectile(new PlanarSlash(g, f, origin, fw.clone(), right, { length: len, width: half * 2, grow: 0.14, damage: 0, cut: this.mirror ? 900 : 2200, color: '#CFE0FF', core: '#FFFFFF' }));
    for (const o of g.enemiesOf(f)) {
      _v.subVectors(o.center(), origin);
      const a = _v.dot(fw);
      if (a < -1.5 || a > len + o.def.radius) continue;
      if (Math.abs(_v.dot(right)) > half + o.def.radius) continue;
      if (Math.abs(_v.y) > 1.4 + o.def.height * 0.4) continue;
      g.damage(o, 140, f, fw.clone(), { knock: 16, launch: 5, heavy: true, hitstop: 0.14, shake: 0.6, unblockable: true, color: '#CFE0FF' });
      g.sparks(o.center(), fw, '#CFE0FF', 24);
    }
    this.say('拡大', 'KAKUDAI', '#CFE0FF');
    g.sfx.play('swingHeavy', c, 1.2);
    g.shake(0.4);
  }

  /** Bunkō: the prism's seven rays fanned onto the target */
  private bunko(): void {
    const { f, g } = this;
    const fw = this.flatAim();
    const at = f.center().addScaledVector(fw, 1.5).add(_v.set(0, 0.25, 0));
    const t = this.target(80);
    const aim = t ? t.center() : at.clone().addScaledVector(fw, 30);
    const right = new THREE.Vector3(fw.z, 0, -fw.x);
    const dist = Math.max(4, aim.distanceTo(at));
    // fanned a little round the aim point: red on one side, violet on the other, crossing on the target
    const rays = SPECTRUM.map((color, i) => ({ color, to: aim.clone().addScaledVector(right, ((i - 3) * dist) / 34).add(_w.set(0, (i % 2 ? 0.2 : -0.2), 0)) }));
    g.addProjectile(new PrismRays(g, f, at, () => this.tipPoint(new THREE.Vector3()), rays, { range: this.mirror ? 36 : 80, radius: 0.35, power: this.mirror ? 400 : 900, step: 0.035, onHit: (i, o, p) => this.prismHit(i, o, p) }));
    this.say('分光', 'BUNKŌ', '#FFFFFF');
  }

  /** one ray of the spectrum reaching someone: its damage and its colour's effect */
  private prismHit(i: number, o: Fighter, p: THREE.Vector3): void {
    const { f, g } = this;
    if (o.dead) return;
    const dir = _v.subVectors(o.pos, f.pos).setY(0).normalize().clone();
    g.damage(o, 45, f, dir, { energy: true, knock: 5, hitstop: 0.05, shake: 0.25, color: SPECTRUM[i] });
    const say = (s: string) => g.hud?.floatText(o.center().setY(o.pos.y + o.def.height + 0.2 + i * 0.12), s, SPECTRUM[i], 14);
    switch (i) {
      case 0: // red: it burns
        for (let k = 1; k <= 30; k++) this.after(k * 0.1, () => !o.dead && g.drain(o, 2.5, f));
        say('BURN');
        break;
      case 1: // orange: it bursts
        g.engine.destruction.carve(new SphereShape(p.clone(), 2.2, 0.8), { mode: 'explode', power: 900, impulse: 12 });
        for (const e of g.enemiesOf(f)) if (e.center().distanceTo(p) < 2.6) g.damage(e, 40, f, _w.subVectors(e.pos, p).setY(0.3).normalize().clone(), { energy: true, knock: 12, launch: 6, heavy: true, hitstop: 0.06 });
        prismBurst(g, p, 1.2);
        break;
      case 2: // yellow: it paralyses
        o.stopAction();
        o.hitstun = Math.max(o.hitstun, o.def.boss ? 0.6 : 1.6);
        say('PARALYSED');
        break;
      case 3: // green: it heals him
        f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.05);
        f.rei = Math.min(f.maxRei, f.rei + 20);
        lightMotes(g, f, 10, SPECTRUM[3], 0.5);
        break;
      case 4: // blue: it slows
        o.slow(0.5, 4);
        say('SLOWED');
        break;
      case 5: // indigo: it blinds
        o.blindT = Math.max(o.blindT, 3);
        say('BLINDED');
        break;
      case 6: // violet: it seals
        o.sealT = Math.max(o.sealT, 5);
        o.sealK = Math.max(o.sealK, 0.4);
        say('SEALED');
        break;
    }
  }

  /** Hansha: the mirror before him */
  private hansha(s: number): void {
    const { f, g } = this;
    this.pane = new MirrorPane(g, f, s);
    g.addProjectile(this.pane);
    this.say('反射', 'HANSHA', MEIKYO_VIOLET);
    g.sfx.play('ting', f.center(), 1.8);
  }

  /** the mirror up: shots that reach it are undone and fired back at whoever stands before it */
  private tendPane(dt: number): void {
    const { f, g } = this;
    const pane = this.pane!;
    if (pane.done || !pane.holds()) {
      if (pane.done) this.pane = null;
      return;
    }
    this.paneShotT = Math.max(0, this.paneShotT - dt);
    const n = g.rejectNear(pane.at, 1.9, f, false);
    if (n > 0) {
      pane.flash();
      const t = g.nearestEnemy(f, 90, f.forward(), 75);
      if (t && this.paneShotT <= 0) {
        this.paneShotT = 0.15;
        const em = new THREE.Object3D();
        em.position.copy(pane.at);
        g.addProjectile(new CeroBeam(g, f, em, () => t.center(), { charge: 0.02, fire: 0.25, radius: 0.35, damage: 60 * 4 * Math.min(3, n), power: 900, core: '#FFFFFF', body: '#DCCDFF', rim: '#7E62E0', range: 100, track: 4, gain: 1.6, reflected: t }));
      }
    }
  }

  /** Shōten: the sun focused on the target */
  private shoten(): void {
    const { f, g } = this;
    const t = this.target(60);
    const at = t ? t.center() : f.center().addScaledVector(this.flatAim(), 16);
    g.addProjectile(new SunFocus(g, f, t, at, { life: 3, dps: 70, radius: 1.2, height: 28, follow: 9 }));
    g.sfx.play('charge', at, 1);
  }

  /** Senkō: the mirror catches the sun — everyone looking at him is blinded; decoys and veils burn away */
  private senko(): void {
    const { f, g } = this;
    const c = f.center();
    g.addProjectile(new Glint(g, f, 0.6, '#FFFFFF', 0.7));
    g.engine.glow.spawn({ x: c.x, y: c.y + 0.4, z: c.z, size: 2, sizeEnd: 14, life: 0.3, r: 2.2, g: 2.2, b: 2.4, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    g.addRing(c.clone(), 28, '#FFFFFF', 0.4);
    for (const o of g.enemiesOf(f)) {
      const d = _v.subVectors(f.pos, o.pos).setY(0);
      const dist = d.length();
      if (dist > 28) continue;
      const facing = dist < 8 || d.normalize().dot(o.forward(_w)) > 0.1;
      o.lure = null;
      o.veiled = false;
      if (!facing) continue;
      o.blindT = Math.max(o.blindT, 4);
      o.stopAction();
      o.hitstun = Math.max(o.hitstun, o.def.boss ? 0.3 : 0.7);
      g.damage(o, 20, f, d.clone().negate().normalize(), { energy: true, knock: 2, quiet: true });
      if (o === g.player) g.engine.gr.chroma.offset.set(0.012, 0.012);
      g.hud?.floatText(o.center().setY(o.pos.y + o.def.height + 0.3), 'BLINDED', '#FFFFFF', 16);
    }
    this.say('閃光', 'SENKŌ', '#FFFFFF');
    g.sfx.play('ting', c, 2.2);
  }

  // ---------------------------------------------------------------- Bankai: the still water

  /** the lake: it follows him; whoever stands in it but him is stilled; it ripples under his steps */
  private tendLake(dt: number): void {
    const { f, g } = this;
    const lake = this.lake!;
    if (lake.done) {
      this.lake = null;
      return;
    }
    if (lake.ending) return;
    for (const o of g.enemiesOf(f)) if (lake.inside(o.pos)) o.dilate(0.3, 0.25);
    this.rippleT -= dt;
    if (this.rippleT <= 0 && Math.hypot(f.body.vel.x, f.body.vel.z) > 2 && lake.inside(f.pos, 1)) {
      this.rippleT = 0.32;
      lake.ripple(f.pos, 0.5);
    }
  }

  /** Mizukagami-tsuki: the blade into the water — a crystal spike out of the target's reflection under it */
  private mizukagami(): void {
    const { f, g } = this;
    const t = this.target(60);
    const at = t ? t.pos.clone() : f.pos.clone().addScaledVector(this.flatAim(), 12);
    const gy = groundAt(g, at.x, at.y + 0.6, at.z, 8) ?? at.y;
    const p = new THREE.Vector3(at.x, gy, at.z);
    this.lake?.ripple(f.pos, 1.2);
    g.addProjectile(new CrystalSpike(g, p, 4.4, 0.95, 0.9));
    g.engine.destruction.carve(new SphereShape(p.clone().setY(gy - 0.2), 1.4, 0.8), { mode: 'smash', power: 1400, impulse: 10 });
    for (const o of g.enemiesOf(f)) {
      if (Math.hypot(o.pos.x - p.x, o.pos.z - p.z) > 1.4 + o.def.radius || o.pos.y > gy + 4 || o.pos.y < gy - 2) continue;
      g.damage(o, 220, f, _v.subVectors(o.pos, f.pos).setY(0).normalize().clone(), { knock: 3, launch: 14, heavy: true, hitstop: 0.14, shake: 0.7, unblockable: true, color: MEIKYO_CYAN });
    }
    this.lake?.ripple(p, 1.8);
    this.say('水鏡突き', 'MIZUKAGAMI-TSUKI', MEIKYO_CYAN);
    g.sfx.play('crack', p, 1.4);
  }

  /** Kyōzō: reflections climb out of the water and fight beside him */
  private kyozo(n: number): void {
    const { f, g } = this;
    const fw = f.forward(new THREE.Vector3());
    const right = new THREE.Vector3(fw.z, 0, -fw.x);
    for (let i = 0; i < n; i++) {
      const off = right.clone().multiplyScalar((i - (n - 1) / 2) * 2.4).addScaledVector(fw, i === 1 ? 2.2 : 1);
      const at = f.pos.clone().add(off);
      at.y += 0.2;
      if (!clearAt(g, at, f.def.height)) at.copy(f.pos).addScaledVector(fw, 1.2);
      const c = g.spawn(mirrorDef(), at, f.team);
      c.yaw = f.yaw;
      const kit = new EvenKit(c, g, { mirror: true });
      g.controllers.push(new DuelistAI(g, c, kit, { aggression: 0.9, intro: 0.1 }));
      glassTint(c);
      c.data.mirrorOf = f;
      this.copies.push({ f: c, t: 12 });
      this.lake?.ripple(at, 1.2);
      prismBurst(g, c.center(), 1);
    }
    this.say('鏡像', 'KYŌZŌ', MEIKYO_CYAN);
    g.sfx.play('ting', f.center(), 1.4);
  }

  /** the reflections and rebels: kept glassy; when their time runs out or they fall, they shatter */
  private tendCopies(dt: number): void {
    const g = this.g;
    for (let i = this.copies.length - 1; i >= 0; i--) {
      const c = this.copies[i];
      c.t -= dt;
      if (!g.fighters.includes(c.f)) {
        this.copies.splice(i, 1);
        continue;
      }
      if (c.f.data.glassVisual !== c.f.visual) glassTint(c.f);
      if (c.t > 0 && !c.f.dead && !this.f.dead) continue;
      this.copies.splice(i, 1);
      this.shatter(c.f);
    }
  }

  private shatter(c: Fighter): void {
    const g = this.g;
    g.addProjectile(new GlassShatter(g, c.center(), 34, 9, 0.34, 1.1, 3));
    g.sfx.play('crack', c.center(), 1.2);
    c.hp = 0;
    c.dead = true;
    c.stopAction();
    g.remove(c);
  }

  /** Senkyō Kōrō: the prison of mirrors */
  private prison(t: Fighter): void {
    const { f, g } = this;
    if (t.dead) return;
    g.addProjectile(new MirrorPrison(g, f, t, { radius: 2.6, life: 1.8, hits: 30, damage: 14, burst: 160, power: 1500 }));
    this.say('千鏡光牢', 'SENKYŌ KŌRŌ', MEIKYO_CYAN);
    g.sfx.play('ting', t.center(), 2);
  }

  /** Kyōha: the still water rises into a wave of mirror-glass and runs forward */
  private kyoha(): void {
    const { f, g } = this;
    const fw = this.flatAim();
    const o = f.pos.clone().addScaledVector(fw, 3);
    o.y = (groundAt(g, o.x, f.pos.y + 1, o.z, 8) ?? f.pos.y) - 0.5;
    g.addProjectile(new MirrorWave(g, f, o, fw, { width: 36, height: 16, speed: 40, range: 90, damage: 260, rise: 0.45 }));
    this.lake?.ripple(o, 2.5);
    this.say('鏡波', 'KYŌHA', MEIKYO_CYAN);
    g.sfx.play('torrent', o, 1.2);
    g.shake(0.5);
  }

  // ---------------------------------------------------------------- final: the light

  /** Issen: one level cut across the whole field, at the target's height */
  private issen(): void {
    const { f, g } = this;
    const fw = this.flatAim();
    const right = new THREE.Vector3(fw.z, 0, -fw.x);
    const t = this.target(160);
    const y = t ? t.center().y : f.center().y;
    const origin = new THREE.Vector3(f.pos.x, y, f.pos.z).addScaledVector(fw, 0.5);
    g.addProjectile(new PlanarSlash(g, f, origin, fw.clone(), right, { length: 160, width: 160, grow: 0.12, damage: 0, cut: 6000, color: '#EFE8FF', core: '#FFFFFF' }));
    for (const o of g.enemiesOf(f)) {
      _v.subVectors(o.center(), origin);
      const a = _v.dot(fw);
      if (a < -1 || a > 160) continue;
      if (Math.abs(_v.dot(right)) > 80) continue;
      if (Math.abs(_v.y) > 1.2 + o.def.height * 0.5) continue;
      g.damage(o, 700, f, fw.clone(), { knock: 24, launch: 8, heavy: true, hitstop: 0.2, shake: 1.2, unblockable: true, color: '#EFE8FF' });
      lightSlash(g, o.center(), right, 5, '#FFFFFF');
    }
    this.say('一閃', 'ISSEN', '#EFE8FF');
    g.sfx.play('swingHeavy', f.center(), 1.4);
    g.sfx.play('explode', f.center(), 0.8);
    g.shake(1);
    g.slowMo(0.35, 0.35);
  }

  /** Hyakkakyō: the target shut in the kaleidoscope, cut from six mirrored angles again and again */
  private kaleidoscope(t: Fighter): void {
    const { f, g } = this;
    if (t.dead) return;
    const life = 3;
    g.addProjectile(new Kaleidoscope(g, t, 3.4, life));
    t.blindT = Math.max(t.blindT, life + 0.2);
    t.scrambleT = Math.max(t.scrambleT, life + 0.2);
    t.scrambleA = (Math.random() < 0.5 ? -1 : 1) * (Math.PI * 0.6 + Math.random() * Math.PI * 0.3);
    const cuts = 18;
    for (let i = 0; i < cuts; i++) {
      this.after(0.25 + (i / cuts) * (life - 0.3), () => {
        if (t.dead || f.dead) return;
        const a = (i % 6) * (Math.PI / 3) + Math.floor(i / 6) * 0.35;
        const dir = new THREE.Vector3(Math.cos(a), (i % 3 - 1) * 0.35, Math.sin(a)).normalize();
        lightSlash(g, t.center(), dir, 4, SPECTRUM[i % 7]);
        g.damage(t, 40, f, dir.clone().setY(0).normalize(), { knock: 0, quiet: i !== 0 && i !== cuts - 1, hitstop: i === cuts - 1 ? 0.14 : 0.03, unblockable: true, heavy: i === cuts - 1, color: SPECTRUM[i % 7] });
        t.hitstun = Math.max(t.hitstun, 0.2);
      });
    }
    this.say('百花鏡', 'HYAKKAKYŌ', '#FFB8F0');
    g.sfx.play('ting', t.center(), 1.6);
  }

  /** Tenkyō Shōten: the sun brought down on the target through the sky's mirror */
  private tenkyo(): void {
    const { f, g } = this;
    const t = this.target(90);
    const at = t ? t.pos.clone() : f.pos.clone().addScaledVector(this.flatAim(), 24);
    g.addProjectile(new SunPillar(g, f, t, at, { radius: 5, life: 2.6, dps: 360, follow: 5, height: 70 }));
    this.say('天鏡焦点', 'TENKYŌ SHŌTEN', '#FFE9B8');
    g.sfx.play('charge', at, 1.6);
    g.shake(0.6);
  }

  /** Kyōzō Hangyaku: the target's own reflection steps out of the mirror and fights it */
  private rebel(t: Fighter): void {
    const { f, g } = this;
    if (t.dead) return;
    const entry = t.def.id === 'even' || t.def.id === 'even-mirror' ? null : rosterById(t.def.id);
    const d = _v.subVectors(f.pos, t.pos).setY(0);
    if (d.lengthSq() < 1e-4) f.forward(d).negate();
    d.normalize();
    const at = t.pos.clone().addScaledVector(d, t.def.radius + 2.2);
    at.y += 0.2;
    if (!entry) {
      // no reflection of its own to call up: his reflections answer instead
      this.kyozo(2);
      return;
    }
    const def = entry.def();
    const c = g.spawn({ ...def, name: `${def.name} (reflection)`, hp: Math.max(200, Math.round(t.maxHp * 0.6)) }, clearAt(g, at, def.height) ? at : t.pos.clone().add(_w.set(0.8, 0.3, 0.8)), f.team);
    c.yaw = Math.atan2(t.pos.x - c.pos.x, t.pos.z - c.pos.z);
    const kit = entry.kit(c, g);
    g.controllers.push(new DuelistAI(g, c, kit, { aggression: 0.9, intro: 0.1 }));
    glassTint(c);
    c.data.mirrorOf = t;
    this.copies.push({ f: c, t: 15 });
    prismBurst(g, c.center(), 2);
    g.addProjectile(new GlassShatter(g, c.center(), 24, 6, 0.3, 0.9, 2));
    this.say('鏡像反逆', 'KYŌZŌ HANGYAKU', '#FFB8F0');
    g.sfx.play('crack', c.center(), 1);
  }

  /** Jōhari no Kagami: the King of Hell's mirror — every blow the target ever struck, returned at once */
  private judgment(t: Fighter): void {
    const { f, g } = this;
    if (t.dead) return;
    const toHim = _v.subVectors(f.pos, t.pos).setY(0);
    if (toHim.lengthSq() < 1e-4) f.forward(toHim).negate();
    toHim.normalize();
    // it rises behind the target, facing him (and whoever watches from behind him)
    const at = t.pos.clone().addScaledVector(toHim, -2.4);
    at.y = groundAt(g, at.x, t.pos.y + 1, at.z, 10) ?? t.pos.y;
    g.addProjectile(new JudgmentMirror(g, t, at, toHim.clone(), {
      judgeAt: 0.8,
      life: 1.35,
      onJudge: () => {
        if (t.dead || f.dead) return;
        const dealt = t.stats.damageDealt;
        const dir = _w.subVectors(t.pos, f.pos).setY(0).normalize().clone();
        g.damage(t, 900 + dealt / Math.max(0.01, f.power), f, dir, { energy: true, unblockable: true, reflected: t, knock: 26, launch: 12, heavy: true, hitstop: 0.22, shake: 1.4, color: '#FFFFFF' });
        g.hud?.floatText(t.center().setY(t.pos.y + t.def.height + 0.4), 'JUDGED', '#FFFFFF', 22);
        g.slowMo(0.6, 0.3);
      },
    }));
    this.say('浄玻璃鏡', 'JŌHARI NO KAGAMI', '#FFFFFF');
    g.sfx.play('bankai', at, 0.8);
  }

  // ---------------------------------------------------------------- AI & HUD

  ai(): KitAI {
    const { f, g } = this;
    const is = (fm: Form) => () => this.form === fm;
    const rushed = () => {
      const t = g.nearestEnemy(f, 6);
      return !!t && t.pos.distanceTo(f.pos) < 3.5 && t.action !== null && t.action.name !== 'dash';
    };
    if (this.mirror)
      return {
        reach: 2.3,
        chain: 5,
        moves: [
          { name: 'kakudai', use: () => this.heavy(), min: 3, max: 14, weight: 1.2, cd: 6 },
          { name: 'bunko', use: () => this.skill1(), min: 5, max: 36, weight: 1, cd: 8 },
        ],
      };
    return {
      reach: this.form === 'bankai' ? 2.7 : 2.3,
      chain: this.form === 'final' ? 6 : 5,
      releaseAt: [0.9, 0.72, 0.5],
      ranged: () => this.form !== 'shikai',
      opener: () => this.glasses(),
      moves: [
        // sealed: the caster
        { name: 'byakurai', use: () => this.heavy(), min: 4, max: 60, weight: 1.6, cd: 2.5, when: is('sealed') },
        { name: 'sokatsui', use: () => this.skill1(), min: 2, max: 14, weight: 1.3, cd: 4, when: is('sealed') },
        { name: 'danku', use: () => this.skill2(), min: 0, max: 30, weight: 1.6, cd: 8, when: () => this.form === 'sealed' && (rushed() || f.hp < f.maxHp * 0.6) },
        { name: 'kuyo', use: () => this.skill3(), min: 3, max: 30, weight: 1.3, cd: 9, when: is('sealed') },
        { name: 'kurohitsugi', use: () => this.toggle(), min: 3, max: 36, weight: 1.5, cd: 9, when: is('sealed') },
        // Shikai
        { name: 'kakudai', use: () => this.heavy(), min: 3, max: 36, weight: 1.6, cd: 3, when: is('shikai') },
        { name: 'bunko', use: () => this.skill1(), min: 6, max: 60, weight: 1.4, cd: 6, when: is('shikai') },
        { name: 'hansha', use: () => this.skill2(), min: 0, max: 40, weight: 1.4, cd: 8, when: () => this.form === 'shikai' && (rushed() || f.hp < f.maxHp * 0.6) },
        { name: 'shoten', use: () => this.skill3(), min: 5, max: 50, weight: 1.3, cd: 9, when: is('shikai') },
        { name: 'senko', use: () => this.toggle(), min: 0, max: 20, weight: 1.2, cd: 10, when: is('shikai') },
        // Bankai
        { name: 'spike', use: () => this.heavy(), min: 3, max: 50, weight: 1.6, cd: 3, when: is('bankai') },
        { name: 'kyozo', use: () => this.skill1(), min: 0, max: 50, weight: 2.2, cd: 16, when: () => this.form === 'bankai' && this.copies.length === 0 },
        { name: 'crossing', use: () => this.skill2(), min: 3, max: 40, weight: 1.4, cd: 5, when: is('bankai') },
        { name: 'prison', use: () => this.skill3(), min: 3, max: 40, weight: 1.4, cd: 10, when: is('bankai') },
        { name: 'kyoha', use: () => this.toggle(), min: 6, max: 70, weight: 1.2, cd: 15, when: is('bankai') },
        // final
        { name: 'issen', use: () => this.heavy(), min: 4, max: 120, weight: 1.6, cd: 5, when: is('final') },
        { name: 'kaleido', use: () => this.skill1(), min: 0, max: 45, weight: 1.5, cd: 10, when: is('final') },
        { name: 'tenkyo', use: () => this.skill2(), min: 6, max: 80, weight: 1.3, cd: 11, when: is('final') },
        { name: 'rebel', use: () => this.skill3(), min: 0, max: 55, weight: 1.3, cd: 24, when: () => this.form === 'final' && this.copies.length === 0 },
        { name: 'johari', use: () => this.toggle(), min: 2, max: 60, weight: 2.4, cd: 36, when: () => this.form === 'final' && (() => { const t = this.target(70); return !!t && (t.stats.damageDealt > 800 || t.hp < t.maxHp * 0.6); })() },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    const flare = { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare };
    const shunpo = this.form === 'final' ? { key: 'Shift', name: 'Kōsoku', kanji: '光速', cost: 4 } : { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 };
    const n = this.copies.filter((c) => !c.f.dead).length;
    switch (this.form) {
      case 'sealed':
        return [
          { key: 'LMB', name: 'Seigan', kanji: '正眼' },
          { key: 'RMB', name: 'Byakurai: Sanren', kanji: '白雷', cost: 12, cd: cd.byakurai, cdMax: 2.2, tint: '#DDEBFF' },
          { key: 'Q', name: 'Sōren Sōkatsui', kanji: '双蓮蒼火墜', cost: 18, cd: cd.sokatsui, cdMax: 3.5, tint: '#7FC8FF' },
          { key: 'E', name: 'Dankū', kanji: '断空', cost: 16, cd: cd.danku, cdMax: 7, active: !!this.danku && !this.danku.done, tint: '#DDEBFF' },
          { key: 'R', name: 'Kuyō Shibari', kanji: '九曜縛', cost: 18, cd: cd.kuyo, cdMax: 8, tint: '#8E4FD8' },
          shunpo,
          flare,
          { key: 'F', name: 'Utsuse, Meikyō', kanji: '明鏡', cost: 20, tint: MEIKYO_VIOLET },
          { key: 'G', name: 'Kurohitsugi', kanji: '黒棺', cost: 34, cd: cd.kuro, cdMax: 9, tint: '#8E4FD8' },
        ];
      case 'shikai':
        return [
          { key: 'LMB', name: 'Hari-giri', kanji: '玻璃斬り', tint: '#CFE0FF' },
          { key: 'RMB', name: 'Kakudai', kanji: '拡大', cost: 16, cd: cd.lens, cdMax: 2.6, tint: '#CFE0FF' },
          { key: 'Q', name: 'Bunkō', kanji: '分光', cost: 26, cd: cd.prism, cdMax: 5.5, tint: '#FFFFFF' },
          { key: 'E', name: 'Hansha', kanji: '反射', cost: 18, cd: cd.mirror, cdMax: 7, active: !!this.pane?.holds(), tint: MEIKYO_VIOLET },
          { key: 'R', name: 'Shōten', kanji: '焦点', cost: 28, cd: cd.focus, cdMax: 8, tint: '#FFE7B0' },
          shunpo,
          flare,
          { key: 'F', name: 'Bankai', kanji: '卍解', cost: 40, tint: MEIKYO_CYAN },
          { key: 'G', name: 'Senkō', kanji: '閃光', cost: 20, cd: cd.flash, cdMax: 9, tint: '#FFFFFF' },
        ];
      case 'bankai':
        return [
          { key: 'LMB', name: 'Kyōei', kanji: '鏡影', tint: MEIKYO_CYAN },
          { key: 'RMB', name: 'Mizukagami-tsuki', kanji: '水鏡突き', cost: 22, cd: cd.spike, cdMax: 2.8, tint: MEIKYO_CYAN },
          { key: 'Q', name: `Kyōzō${n ? ` (${n})` : ''}`, kanji: '鏡像', cost: 40, cd: cd.copies, cdMax: 16, active: n > 0, tint: MEIKYO_CYAN },
          { key: 'E', name: 'Kagami-watari', kanji: '鏡渡り', cost: 26, cd: cd.cross, cdMax: 4, tint: MEIKYO_CYAN },
          { key: 'R', name: 'Senkyō Kōrō', kanji: '千鏡光牢', cost: 36, cd: cd.prison, cdMax: 9, tint: MEIKYO_CYAN },
          shunpo,
          flare,
          { key: 'F', name: 'Kaigen', kanji: '開眼', cost: 60, tint: '#EFE8FF' },
          { key: 'G', name: 'Kyōha', kanji: '鏡波', cost: 50, cd: cd.wave, cdMax: 14, tint: MEIKYO_CYAN },
        ];
      default:
        return [
          { key: 'LMB', name: 'Kōjin', kanji: '光刃', tint: '#EFE8FF' },
          { key: 'RMB', name: 'Issen', kanji: '一閃', cost: 40, cd: cd.issen, cdMax: 4.5, tint: '#EFE8FF' },
          { key: 'Q', name: 'Hyakkakyō', kanji: '百花鏡', cost: 40, cd: cd.kaleido, cdMax: 9, tint: '#FFB8F0' },
          { key: 'E', name: 'Tenkyō Shōten', kanji: '天鏡焦点', cost: 60, cd: cd.sun, cdMax: 10, tint: '#FFE9B8' },
          { key: 'R', name: `Kyōzō Hangyaku${n ? ` (${n})` : ''}`, kanji: '鏡像反逆', cost: 50, cd: cd.rebel, cdMax: 22, active: n > 0, tint: '#FFB8F0' },
          shunpo,
          flare,
          { key: 'F', name: 'Seal', kanji: '封' },
          { key: 'G', name: 'Jōhari no Kagami', kanji: '浄玻璃鏡', cost: 80, cd: cd.judge, cdMax: 35, tint: '#FFFFFF' },
        ];
    }
  }
}

