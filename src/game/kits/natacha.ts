// Natacha's kit (docs/kits/natacha.md). The Star Reader of the Royal Guard, an original character and a tribute: the
// strongest fighter in the game on purpose, every form stronger than the last.
// Sealed Myōjō: the iai string (LMB); Ryūsei, a flash through the target that cuts everything on the way (RMB); star
// pebbles (Q); Tenmaku, the dome nothing gets into (E); Hoshiyomi, the foresight that steps behind every blow (R);
// Bakudō #61 (G); "Kagayake, Myōjō" (F).
// Shikai: the string sets star marks (LMB); Seiza-giri joins them into a constellation that cuts (RMB); the star rain
// (Q); Myōjō-kō, the gold beam (E); Hoshi-utsuri, behind the target in a blink (R); Kasei, the calamity star (G); the
// Bankai (F).
// Bankai "Ginga Myōjō: Hoshifuru Yoru": night over the whole field, she heals in it; star crescents (LMB); the meteor
// shower (RMB); the constellations — Orion's sword through the city, Sagittarius' arrows, Scorpius' sting (Q);
// Amanogawa, the river of heaven (E); Kuro-boshi, the black star (R); Hoshiyomi: Tenmon (G); "Kōrin" (F).
// Final "Myōjō Kōrin": she flies, heals fast, nothing holds her (statuses), almost nothing hurts her; crescents of
// light (LMB); the supernova (RMB); Seigun Ranbu, eight stars cutting from eight sides (Q); the galaxy cannon (E);
// Hoshi no Toki, time stopped for every enemy (R); Akatsuki, the dawn swept across the whole field (G); the seal (F).
// Always: Myōjō no Kago — the first death is refused once.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef, type PropDef } from '../fighter';
import type { Game } from '../game';
import { BANKAI_TIP_Z, FINAL_TIP_Z, KATANA_BASE_Z, KATANA_TIP_Z, SHIKAI_TIP_Z, natachaAsset, natachaProp, type NatachaForm } from '../../chars/natacha';
import { NATACHA_CHAIN, NATACHA_CLIPS, NATACHA_FINAL_CHAIN, NATACHA_FINAL_STANCE, NATACHA_STANCE } from '../../chars/natachaClips';
import {
  AURA_NATACHA, AURA_NATACHA_BANKAI, AURA_NATACHA_FINAL, BlackStar, CalamityStar, Constellation, DAWN_COLORS, DawnWall, FallingStar, GiantSword, LightPillar,
  NIGHT_COLORS, NightSky, SKY_DAWN, STAR_COLORS, STAR_GOLD, StarDome, StarLines, StarMarks, StarShot, Supernova, TimeHalt, passingSky, starBurst, starMotes, starSlash,
  type ConstellationKind,
} from '../../vfx/myojo';
import type { SkyLook } from '../../vfx/fire';
import { PlanarSlash } from '../../vfx/tybw';
import { Rikujokoro } from '../../vfx/rukiaArts';
import { TEX_GLOW, TEX_STREAK } from '../../vfx/sprites';
import { CeroBeam } from '../projectiles/cero';
import { GetsugaProjectile, type GetsugaOpts } from '../projectiles/getsuga';
import { vollFlight } from './sternritter';
import type { AbilityInfo } from '../../ui/hud';
import type { Kit, KitAI } from './kit';

type BladeDef = NonNullable<FighterDef['blade']>;
type Form = NatachaForm;

const BLADES: Record<Form, BladeDef> = {
  sealed: { prop: 'sword', base: [0, 0, KATANA_BASE_Z], tip: [0, 0, KATANA_TIP_Z], color: '#FFE6A8', core: '#FFFBEA' },
  shikai: { prop: 'sword', base: [0, 0, KATANA_BASE_Z], tip: [0, 0, SHIKAI_TIP_Z], color: '#FFD27A', core: '#FFF6DE' },
  bankai: { prop: 'sword', base: [0, 0, KATANA_BASE_Z], tip: [0, 0, BANKAI_TIP_Z], color: '#AFC4FF', core: '#F4F7FF' },
  final: { prop: 'sword', base: [0, 0, KATANA_BASE_Z], tip: [0, 0, FINAL_TIP_Z], color: '#FFE3A0', core: '#FFFDF2' },
};
const TIP: Record<Form, number> = { sealed: KATANA_TIP_Z, shikai: SHIKAI_TIP_Z, bankai: BANKAI_TIP_Z, final: FINAL_TIP_Z };
const SPEEDS: Record<Form, FighterDef['speed']> = {
  sealed: { run: 11, sprint: 30, jump: 14, dash: 26, dashTime: 0.1 },
  shikai: { run: 11.5, sprint: 32, jump: 14, dash: 28, dashTime: 0.1 },
  bankai: { run: 12, sprint: 34, jump: 15, dash: 34, dashTime: 0.1 },
  final: { run: 14, sprint: 40, jump: 16, dash: 40, dashTime: 0.1 },
};
const AURAS = { sealed: AURA_NATACHA, shikai: AURA_NATACHA, bankai: AURA_NATACHA_BANKAI, final: AURA_NATACHA_FINAL };
/** power, damage taken, regeneration (fraction of HP and rei per second) */
const STATS: Record<Form, { power: number; taken: number; hpRegen: number; reiRegen: number }> = {
  sealed: { power: 1.6, taken: 0.8, hpRegen: 0, reiRegen: 0 },
  shikai: { power: 2.4, taken: 0.65, hpRegen: 0, reiRegen: 2 },
  bankai: { power: 3.4, taken: 0.5, hpRegen: 0.015, reiRegen: 8 },
  final: { power: 5, taken: 0.2, hpRegen: 0.03, reiRegen: 20 },
};
/** the pre-dawn the final form brings to the night: indigo above, the horizon catching fire */
const SKY_PREDAWN: SkyLook = { zen: '#262E66', hor: '#E89A6E', cloud: '#5A4A7A', cover: 0.3, glow: 1.3, sun: 0.75, hemi: 0.85, fog: '#6E5E86' };
const UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _u = new THREE.Vector3();

function props(form: Form): PropDef[] {
  const p: PropDef[] = [{ key: 'sword', model: natachaProp(form === 'sealed' ? 'katana' : form), socket: 'grip.R' }];
  if (form === 'sealed' || form === 'shikai') p.push({ key: 'saya', model: natachaProp('saya'), socket: 'hip.L' });
  if (form === 'final') p.push({ key: 'halo', model: natachaProp('halo'), socket: 'halo' });
  return p;
}

export const NATACHA_DEF: FighterDef = {
  id: 'natacha',
  name: 'Natacha',
  title: 'Star Reader of the Royal Guard',
  build: () => ({ asset: natachaAsset('sealed'), props: props('sealed') }),
  stance: NATACHA_STANCE,
  clips: NATACHA_CLIPS,
  aura: AURA_NATACHA,
  blade: BLADES.sealed,
  hp: 2600,
  rei: 400,
  speed: { ...SPEEDS.sealed },
  radius: 0.32,
  height: 1.65,
};

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

const spec = (damage: number, knock: number, cut: number, extra: Partial<BladeSpec> = {}): BladeSpec => ({ damage, knock, launch: 0, hitstop: 0.05, shake: 0.14, cut, ...extra });

/** blade windows of each cut (clip time) and its base spec (the form scales the cut power and the reach) */
const MOVES: Record<string, { at: [number, number]; spec: BladeSpec }> = {
  nt_s1: { at: [0.1, 0.2], spec: spec(26, 6, 600, { reach: 0.2 }) },
  nt_s2: { at: [0.1, 0.21], spec: spec(26, 7, 600) },
  nt_s3: { at: [0.1, 0.21], spec: spec(26, 7, 600) },
  nt_s4: { at: [0.11, 0.25], spec: spec(30, 9, 650) },
  nt_s5: { at: [0.1, 0.22], spec: spec(34, 3, 700, { launch: 10, hitstop: 0.07, shake: 0.22 }) },
  nf_s1: { at: [0.08, 0.18], spec: spec(30, 7, 1600) },
  nf_s2: { at: [0.08, 0.18], spec: spec(30, 7, 1600) },
  nf_s3: { at: [0.09, 0.21], spec: spec(32, 9, 1600) },
  nf_s4: { at: [0.09, 0.21], spec: spec(32, 9, 1600) },
  nf_s5: { at: [0.08, 0.19], spec: spec(36, 3, 1700, { launch: 12, hitstop: 0.07, shake: 0.22 }) },
  nf_s6: { at: [0.13, 0.27], spec: spec(44, 16, 1900, { heavy: true, hitstop: 0.1, shake: 0.4 }) },
};
const CUT_K: Record<Form, number> = { sealed: 1, shikai: 1.4, bankai: 2, final: 1 };

/** Marker for the skills a string can cancel into. */
abstract class SkillAction extends FighterAction {}

/** One cut of the string: the blade window, the step in; the form adds its crescent or its mark. */
class MoveAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private stopAt = 0;
  private opened = false;
  queued = false;
  constructor(readonly kit: NatachaKit, readonly clip: string, readonly index: number, readonly over?: Partial<BladeSpec>, track = true) {
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
  constructor(readonly kit: NatachaKit, readonly name: string, readonly clip: string, readonly endAt: number, readonly events: Record<string, [number, () => void]>, opts: { armor?: number; mobility?: number; cancelAt?: number; hold?: boolean; invulnerable?: boolean } = {}) {
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

/** Seigun Ranbu: eight stars cutting through the target from eight sides, then she stands before it. */
class RanbuAction extends SkillAction {
  readonly name = 'ranbu';
  private i = 0;
  constructor(readonly kit: NatachaKit, readonly target: Fighter) {
    super();
    this.mobility = 0;
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    g.callout('星群乱舞', 'SEIGUN RANBU', '#FFE7A0');
    f.anim.play('nf_s3', {});
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const tg = this.target;
    while (this.i < 8 && this.t >= this.i * 0.11) {
      if (!tg.dead) {
        const a = (this.i / 8) * Math.PI * 2 + (this.i % 2 ? Math.PI : 0) * 0.5;
        const d = _v.set(Math.cos(a), 0, Math.sin(a));
        f.ghosts.spawn(0.5, 1);
        const p = tg.pos.clone().addScaledVector(d, tg.def.radius + 1.3);
        if (clearAt(g, p, f.def.height)) {
          f.body.pos.copy(p);
          f.body.prev.copy(p);
        }
        f.yaw = Math.atan2(-d.x, -d.z);
        const cut = d.clone().negate().applyAxisAngle(UP, (this.i % 2 ? 1 : -1) * 0.4).setY(this.i % 3 === 0 ? 0.6 : -0.3).normalize();
        starSlash(g, tg.center(), cut, 4.2, '#FFE7A0');
        g.damage(tg, 90, f, cut.clone().setY(0).normalize(), { knock: 0.5, hitstop: this.i === 7 ? 0.16 : 0.03, shake: 0.3, unblockable: true, heavy: this.i === 7, color: '#FFE7A0' });
        g.sfx.play('swing', tg.center(), 1);
        if (this.i % 2 === 0) f.anim.play(this.i % 4 === 0 ? 'nf_s1' : 'nf_s2', { fadeIn: 0.02 });
      }
      this.i++;
    }
    if (this.t >= 1.0) this.done = true;
  }
}

// ------------------------------------------------------------------ the kit

export class NatachaKit implements Kit {
  form: Form = 'sealed';
  comboIndex = 0;
  private lastSwingEnd = 0;
  flare = false;
  /** Hoshiyomi: time left and the counter's strength */
  readT = 0;
  private readMult = 1;
  private counterCd = 0;
  /** Tenmaku */
  private dome: StarDome | null = null;
  /** the Shikai's star marks */
  private marks: StarMarks | null = null;
  /** the Bankai's night */
  night: NightSky | null = null;
  /** Hoshi no Toki (s left) */
  timeT = 0;
  /** Myōjō no Kago is spent */
  revived = false;
  private constellation = 0;
  private muzzle = new THREE.Object3D();
  private riverT = 0;
  private river: CeroBeam | null = null;
  private timers: { t: number; fn: () => void }[] = [];
  private hudT = 0;
  private moteT = 0;
  readonly cd = { ryusei: 0, pebbles: 0, dome: 0, read: 0, bind: 0, seiza: 0, rain: 0, beam: 0, shift: 0, kasei: 0, meteors: 0, summon: 0, river: 0, black: 0, tenmon: 0, nova: 0, ranbu: 0, galaxy: 0, toki: 0, dawn: 0, release: 0 };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.parry = (amount, from, o) => this.parry(amount, from, o);
    f.onLethal = () => this.kago();
    this.hands();
    this.attachMuzzle();
    this.applyStats();
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
    this.counterCd = Math.max(0, this.counterCd - dt);
    if (this.readT > 0 && (this.readT -= dt) <= 0) this.readT = 0;
    if (this.timeT > 0) this.timeT = Math.max(0, this.timeT - dt);
    if (this.dome && this.dome.holds()) f.invuln = Math.max(f.invuln, 0.05);
    if (this.dome?.done) this.dome = null;
    if (this.riverT > 0) this.riverStream(dt);
    const st = STATS[this.form];
    if (!f.dead) {
      if (st.hpRegen > 0) f.hp = Math.min(f.maxHp, f.hp + f.maxHp * st.hpRegen * dt);
      if (st.reiRegen > 0) f.rei = Math.min(f.maxRei, f.rei + st.reiRegen * dt);
      // the night heals her: starlight rising off her
      if (this.form === 'bankai' || this.form === 'final') {
        this.moteT -= dt;
        if (this.moteT <= 0) {
          this.moteT = 0.12;
          starMotes(g, f, 1, this.form === 'final' ? '#FFE7A0' : '#C6D8FF', 0.5);
        }
      }
    }
    if (this.form === 'final' && !f.dead) {
      // nothing holds her: every status shrugged off, and she flies
      f.slowT = 0; f.slowK = 0; f.dilateT = 0; f.dilateK = 0; f.blindT = 0; f.sealT = 0; f.sealK = 0;
      f.disarmT = Math.min(f.disarmT, 0.01); f.armLockT = 0; f.scrambleT = 0; f.invertT = 0; f.iffT = 0; f.puppetT = 0;
      f.heavyB = 0; f.heavyW = 0; f.agedT = 0; f.agedK = 0; f.wetT = 0; f.rooted = false;
      vollFlight(g, f, g.nearestEnemy(f, 80), 1);
      if (!f.action && f.dashT <= 0 && f.hitstun <= 0 && !f.anim.isPlaying()) f.anim.play('nt_float', { fadeIn: 0.3 });
    }
    if (this.marks?.done) this.marks = null;
    this.hudT -= dt;
    if (this.hudT <= 0 && g.hud && f === g.player) {
      this.hudT = 0.25;
      g.hud.form = this.formName();
    }
  }

  private after(s: number, fn: () => void): void {
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
    const list = this.form === 'final' ? NATACHA_FINAL_CHAIN : NATACHA_CHAIN;
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    this.lastSwingEnd = this.g.time + 0.8;
    this.f.act(new MoveAction(this, list[idx], idx), true);
  }

  /** the blade spec of a cut in this form */
  cutSpec(clip: string, over?: Partial<BladeSpec>): BladeSpec {
    const base = MOVES[clip].spec;
    const k = CUT_K[this.form];
    const s: BladeSpec = { ...base, cut: base.cut * k, reach: (base.reach ?? 0) + (this.form === 'bankai' ? 0.3 : this.form === 'final' ? 0.5 : 0.1), ...over };
    if (this.form === 'shikai') s.onHit = (o) => this.mark(o);
    return s;
  }

  /** a cut's window opened: the form's addition */
  onCut(index: number): void {
    const { f, g } = this;
    if (this.form === 'shikai' && index === 4) this.crescent({ radius: 2.0, halfAngle: 0.95, speed: 48, range: 30, damage: 40, cut: 900, colors: STAR_COLORS });
    else if (this.form === 'bankai') this.crescent({ radius: 1.7, halfAngle: 1.0, speed: 50, range: 16, damage: 22, cut: 800, colors: NIGHT_COLORS, band: 0.5 });
    else if (this.form === 'final') this.crescent({ radius: 3, halfAngle: 1.05, speed: 62, range: 42, damage: 60, cut: 1600, colors: DAWN_COLORS });
    if (this.form !== 'sealed') starMotes(g, f, 2, BLADES[this.form].color, 0.4);
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

  /** RMB */
  heavy(): void {
    switch (this.form) {
      case 'sealed':
        this.special(new Skill(this, 'ryusei', 'nt_iai', 0.62, { go: [0.16, () => this.ryusei()] }, { armor: 0.6, mobility: 0 }), 14, 'ryusei', 2.6);
        return;
      case 'shikai':
        this.special(new Skill(this, 'seiza', 'nt_trace', 0.7, { cast: [0.5, () => this.seiza()] }, { mobility: 0.15 }), 16, 'seiza', 2.4);
        return;
      case 'bankai':
        this.special(new Skill(this, 'meteors', 'nt_sky', 0.8, { raise: [0.2, () => this.g.callout('流星群', 'RYŪSEIGUN', '#FFE3A0')], call: [0.5, () => this.meteors(12)] }, { mobility: 0.15, armor: 0.4 }), 28, 'meteors', 4.5);
        return;
      case 'final':
        this.special(new Skill(this, 'nova', 'nf_nova', 0.9, { charge: [0.12, () => this.g.sfx.play('charge', this.f.center(), 1)], fire: [0.5, () => this.supernova()] }, { mobility: 0.2, armor: 0.8 }), 30, 'nova', 3.5);
    }
  }

  /** Q */
  skill1(): void {
    switch (this.form) {
      case 'sealed':
        this.special(new Skill(this, 'pebbles', 'nt_palm', 0.46, { cast: [0.13, () => this.pebbles()] }), 10, 'pebbles', 1.6);
        return;
      case 'shikai':
        this.special(new Skill(this, 'rain', 'nt_sky', 0.8, { raise: [0.2, () => this.g.callout('星の雨', 'HOSHI NO AME', STAR_GOLD)], call: [0.5, () => this.starRain(24, 6)] }, { mobility: 0.15 }), 22, 'rain', 5.5);
        return;
      case 'bankai':
        this.special(new Skill(this, 'summon', 'nt_summon', 1.1, { call: [0.3, () => this.summon()] }, { mobility: 0.1, armor: 0.6 }), 34, 'summon', 6.5);
        return;
      case 'final': {
        const t = this.target(40);
        if (!t) {
          if (this.f === this.g.player) this.g.hud?.showBanner('No one in reach', 1);
          return;
        }
        this.special(new RanbuAction(this, t), 30, 'ranbu', 5);
      }
    }
  }

  /** E */
  skill2(): void {
    switch (this.form) {
      case 'sealed':
        this.special(new Skill(this, 'tenmaku', 'nt_curtain', 0.55, { cast: [0.14, () => this.curtain(3.2)] }, { mobility: 0.25 }), 18, 'dome', 8);
        return;
      case 'shikai':
        this.special(new Skill(this, 'beam', 'nt_aim', 1.25, { fire: [0.2, () => this.beam()] }, { hold: true, mobility: 0.08, armor: 0.5 }), 24, 'beam', 5);
        return;
      case 'bankai':
        this.special(new Skill(this, 'river', 'nt_aim', 2.1, { fire: [0.2, () => this.amanogawa()] }, { hold: true, mobility: 0.05, armor: 0.7 }), 40, 'river', 7.5);
        return;
      case 'final':
        this.special(new Skill(this, 'galaxy', 'nf_aim', 2.5, { fire: [0.2, () => this.galaxyCannon()] }, { hold: true, mobility: 0.05, armor: 1 }), 50, 'galaxy', 7);
    }
  }

  /** R */
  skill3(): void {
    switch (this.form) {
      case 'sealed':
        this.special(new Skill(this, 'hoshiyomi', 'nt_read', 0.6, { cast: [0.22, () => this.foresee(6, 1)] }, { mobility: 0.3 }), 16, 'read', 11);
        return;
      case 'shikai':
        this.special(new Skill(this, 'shift', 'nt_read', 0.12, { go: [0.0, () => this.shift()] }, { mobility: 0 }), 8, 'shift', 1.2);
        return;
      case 'bankai':
        this.special(new Skill(this, 'blackstar', 'nt_crush', 0.8, { open: [0.14, () => this.blackStar()] }, { mobility: 0.15, armor: 0.5 }), 36, 'black', 11);
        return;
      case 'final':
        this.special(new Skill(this, 'toki', 'nf_halt', 0.7, { stop: [0.24, () => this.haltTime(5)] }, { mobility: 0.2, invulnerable: true }), 40, 'toki', 16);
    }
  }

  /** F: up the ladder; from the final form, everything sealed */
  release(): void {
    const { f, g } = this;
    if (f.busy || f.sealT > 0 || this.cd.release > 0) return;
    if (this.form === 'sealed') {
      if (!f.spendRei(20)) return this.noRei();
      f.act(new Skill(this, 'release', 'nt_release', 0.9, {
        name: [0.22, () => g.callout('輝け「明星」', 'KAGAYAKE, MYŌJŌ', STAR_GOLD)],
        shine: [0.48, () => this.toShikai()],
      }, { armor: 0.8, mobility: 0.1 }), true);
      return;
    }
    if (this.form === 'shikai') {
      if (!f.spendRei(40)) return this.noRei();
      f.act(new Skill(this, 'bankai', 'nt_bankai', 1.5, {
        name: [0.3, () => g.callout('卍解「銀河明星・星降る夜」', 'BANKAI — GINGA MYŌJŌ: HOSHIFURU YORU', '#C6D8FF')],
        night: [0.85, () => this.toBankai()],
      }, { invulnerable: true, mobility: 0 }), true);
      g.sfx.play('bankai', f.center(), 1);
      return;
    }
    if (this.form === 'bankai') {
      if (!f.spendRei(60)) return this.noRei();
      f.act(new Skill(this, 'korin', 'nt_korin', 1.6, {
        name: [0.3, () => g.callout('降臨「明けの明星」', 'KŌRIN — AKE NO MYŌJŌ', '#FFE7A0')],
        rise: [0.7, () => this.toFinal()],
      }, { invulnerable: true, mobility: 0 }), true);
      g.sfx.play('bankai', f.center(), 1.2);
      return;
    }
    f.act(new Skill(this, 'seal', 'nt_seal', 0.5, { cast: [0.2, () => this.toSealed()] }), true);
  }

  /** G */
  toggle(): void {
    switch (this.form) {
      case 'sealed':
        this.special(new Skill(this, 'bind', 'nt_point', 0.5, { cast: [0.16, () => this.bind()] }), 14, 'bind', 7);
        return;
      case 'shikai':
        this.special(new Skill(this, 'kasei', 'nt_heave', 0.9, { lift: [0.3, () => this.g.callout('禍星', 'KASEI', '#FFB86A')], throw: [0.62, () => this.kasei()] }, { mobility: 0.15, armor: 0.5 }), 30, 'kasei', 9);
        return;
      case 'bankai':
        this.special(new Skill(this, 'tenmon', 'nt_read', 0.6, { cast: [0.22, () => this.foresee(8, 3)] }, { mobility: 0.3 }), 24, 'tenmon', 13);
        return;
      case 'final':
        this.special(new Skill(this, 'dawn', 'nf_dawn', 1.6, { raise: [0.3, () => this.dawnGather()], cut: [1.05, () => this.akatsuki()] }, { invulnerable: true, mobility: 0 }), 80, 'dawn', 40);
    }
  }

  toggleFlare(): void {
    this.flare = !this.flare;
    this.applyStats();
    if (this.flare) {
      this.f.aura.flare(1.8, 0.45);
      this.g.shake(0.25);
      this.g.sfx.play('flare', this.f.center());
      starBurst(this.g, this.f.center(), 1.6, BLADES[this.form].color);
    }
  }

  private noRei(): void {
    if (this.f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
  }

  target(range: number): Fighter | null {
    return this.g.nearestEnemy(this.f, range, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, range);
  }

  /** where she aims: the target, or the camera's aim for the player */
  aim(out = new THREE.Vector3()): THREE.Vector3 {
    const { f, g } = this;
    const t = this.target(120);
    if (t) return t.center(out);
    if (f === g.player && !f.faceTarget) return g.aimPoint(f, out);
    if (f.faceTarget) return out.copy(f.faceTarget);
    return f.center(out).addScaledVector(f.forward(_w), 30);
  }

  /** a point on the target's ground, or `ahead` metres in front of her */
  private groundAt(ahead: number, range = 60): THREE.Vector3 {
    const { f } = this;
    const t = this.target(range);
    if (t) return t.pos.clone();
    return f.pos.clone().addScaledVector(f.forward(_w), ahead);
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

  private palmPoint(out: THREE.Vector3): THREE.Vector3 {
    const s = this.f.visual.rig.sockets.get('palm.L');
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
    f.def = { ...f.def, stance: form === 'final' ? NATACHA_FINAL_STANCE : NATACHA_STANCE, speed: { ...SPEEDS[form] } };
    f.setForm({ asset: natachaAsset(form), props: props(form) }, AURAS[form], BLADES[form]);
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
    starBurst(g, this.tipPoint(new THREE.Vector3()), 1.1, STAR_GOLD);
    starMotes(g, f, 30, STAR_GOLD, 0.6);
    g.sfx.play('flare', f.center(), 0.8);
    g.sfx.play('ting', f.center(), 1.2);
  }

  private toBankai(): void {
    const { f, g } = this;
    if (this.form !== 'shikai') return;
    this.setForm('bankai');
    this.marks?.clear();
    // the Bankai mends her: she rises out of it whole
    f.hp = f.maxHp;
    f.aura.flare(1.7, 0.6);
    f.aura.pillarBurst(2.4);
    g.addProjectile(new LightPillar(g, f, '#C6D8FF', 1.8, 1.4));
    if (!this.night || this.night.ending) {
      this.night = new NightSky(g, f);
      g.addProjectile(this.night);
    }
    for (let i = 0; i < 3; i++) g.addRing(f.pos.clone().setY(f.pos.y + 0.2), 10 + i * 8, i === 1 ? '#FFE3A0' : '#AFC4FF', 0.8 + i * 0.3);
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
    g.addProjectile(new LightPillar(g, f, '#FFE7A0', 2.2, 1.6));
    // the night lightens toward the dawn
    if (!this.night || this.night.ending) {
      this.night = new NightSky(g, f, SKY_PREDAWN);
      g.addProjectile(this.night);
    } else this.night.sky.look = SKY_PREDAWN;
    for (let i = 0; i < 4; i++) g.addRing(f.pos.clone().setY(f.pos.y + 0.2), 12 + i * 10, i % 2 ? '#FF9E4A' : '#FFF2C8', 0.9 + i * 0.3);
    starBurst(g, f.center(), 2.5, '#FFE7A0');
    g.shake(1.2);
    g.slowMo(0.7, 0.35);
  }

  private toSealed(): void {
    const { f, g } = this;
    if (this.form === 'sealed') return;
    f.mounted = false;
    this.night?.end();
    this.night = null;
    this.marks?.clear();
    this.setForm('sealed');
    this.cd.release = 4;
    g.sfx.play('ting', f.center(), 0.8);
    starMotes(g, f, 20, STAR_GOLD);
  }

  private applyStats(): void {
    const f = this.f;
    const st = STATS[this.form];
    f.power = st.power * (this.flare ? 1.25 : 1);
    f.damageTaken = st.taken;
    f.knockTaken = this.form === 'final' ? 0 : this.form === 'bankai' ? 0.4 : 0.8;
    f.energyTaken = this.form === 'final' ? 0.6 : 1;
    f.aura.target = this.flare ? 1 : this.form === 'final' ? 0.34 : this.form === 'bankai' ? 0.28 : this.form === 'shikai' ? 0.16 : 0.06;
  }

  formName(): string {
    const name = this.form === 'sealed' ? 'Myōjō (sealed)' : this.form === 'shikai' ? 'Myōjō' : this.form === 'bankai' ? 'Ginga Myōjō' : 'Myōjō Kōrin';
    const n = this.form === 'shikai' ? (this.marks?.total() ?? 0) : 0;
    const marks = n ? ` · ${n} mark${n > 1 ? 's' : ''}` : '';
    const read = this.readT > 0 ? ' · Hoshiyomi' : '';
    const time = this.timeT > 0 ? ' · time stopped' : '';
    return name + marks + read + time;
  }

  // ---------------------------------------------------------------- passives

  /** Myōjō no Kago: the first death refused — the morning star rises behind her */
  private kago(): boolean {
    const { f, g } = this;
    if (this.revived) return false;
    this.revived = true;
    f.hp = f.maxHp * 0.6;
    f.invuln = Math.max(f.invuln, 2);
    f.stopAction();
    f.hitstun = 0;
    const c = f.center();
    starBurst(g, c, 3, '#FFE7A0');
    g.addProjectile(new LightPillar(g, f, '#FFE7A0', 2, 1.5));
    for (const o of g.enemiesOf(f)) {
      const d = _v.subVectors(o.pos, f.pos).setY(0);
      if (d.length() > 14) continue;
      if (d.lengthSq() < 1e-4) d.set(1, 0, 0);
      g.damage(o, 80, f, d.normalize(), { energy: true, knock: 30, launch: 10, heavy: true, unblockable: true, hitstop: 0.12 });
    }
    g.callout('明星の加護', 'MYŌJŌ NO KAGO', '#FFE7A0');
    g.sfx.play('bankai', c, 0.8);
    g.slowMo(0.6, 0.35);
    return true;
  }

  /** Hoshiyomi: every blow foreseen — she is already behind the one who struck */
  private parry(_amount: number, from: Fighter | null, o: { quiet?: boolean }): boolean {
    const { f, g } = this;
    if (this.readT <= 0 || !from || from === f || from.dead) return false;
    if (this.counterCd > 0 || o.quiet) return true;
    this.counterCd = 0.35;
    const back = from.forward(new THREE.Vector3()).negate();
    const p = from.pos.clone().addScaledVector(back, from.def.radius + 1.2);
    f.ghosts.spawn(0.5, 1);
    starBurst(g, f.center(), 0.8, STAR_GOLD);
    if (clearAt(g, p, f.def.height)) {
      f.body.pos.copy(p);
      f.body.prev.copy(p);
    }
    f.yaw = Math.atan2(from.pos.x - f.pos.x, from.pos.z - f.pos.z);
    const dir = _v.subVectors(from.pos, f.pos).setY(0).normalize();
    f.act(new MoveAction(this, this.form === 'final' ? 'nf_s3' : 'nt_s4', 3, { damage: 0 }, false), true);
    g.damage(from, 70 * this.readMult, f, dir.clone(), { knock: 14, launch: 4, heavy: true, hitstop: 0.12, shake: 0.4, unblockable: true, color: STAR_GOLD });
    starSlash(g, from.center(), dir.clone().applyAxisAngle(UP, Math.PI / 2), 3, STAR_GOLD);
    if (f === g.player || from === g.player) g.hud?.floatText(f.center().setY(f.pos.y + f.def.height + 0.3), 'FORESEEN', '#FFE3A0', 18);
    return true;
  }

  private foresee(s: number, mult: number): void {
    const { f, g } = this;
    this.readT = s;
    this.readMult = mult;
    g.callout(mult > 1 ? '星読み・天文' : '星読み', mult > 1 ? 'HOSHIYOMI: TENMON' : 'HOSHIYOMI', '#FFE3A0');
    g.addRing(f.center(), 2.4, '#FFE3A0', 0.4);
    starMotes(g, f, 14, '#FFE3A0');
  }

  // ---------------------------------------------------------------- sealed

  /** Ryūsei: the iai flash — through the target and on, everything on the line cut level at her waist */
  private ryusei(): void {
    const { f, g } = this;
    const t = this.target(30);
    const start = f.pos.clone();
    const dir = t ? _v.subVectors(t.pos, f.pos).setY(0).normalize().clone() : f.forward(new THREE.Vector3());
    if (dir.lengthSq() < 1e-4) f.forward(dir);
    const dist = t ? Math.min(26, t.pos.distanceTo(f.pos) + 4) : 18;
    // the far end, pulled back until there is room for her
    let end = start.clone().addScaledVector(dir, dist);
    let back = 0;
    while (!clearAt(g, end, f.def.height) && back < dist) {
      back += 0.5;
      end = start.clone().addScaledVector(dir, dist - back);
    }
    f.ghosts.spawn(0.6, 1);
    // whoever stands on the line is cut
    for (const o of g.enemiesOf(f)) {
      const rel = _w.subVectors(o.pos, start);
      const along = rel.dot(dir);
      if (along < -0.5 || along > dist - back + 0.8) continue;
      const lateral = rel.clone().addScaledVector(dir, -along).setY(0).length();
      if (lateral > o.def.radius + 1.6 || Math.abs(o.pos.y - start.y) > 3) continue;
      g.damage(o, 110, f, dir.clone(), { knock: 16, launch: 5, heavy: true, hitstop: 0.14, shake: 0.6, unblockable: true, color: STAR_GOLD });
      g.sparks(o.center(), dir, STAR_GOLD, 24);
    }
    f.body.pos.copy(end);
    f.body.prev.copy(end);
    f.yaw = Math.atan2(dir.x, dir.z);
    f.push.set(0, 0, 0);
    // the light left on the line, and the line cut through the world
    const a = start.clone().setY(start.y + 1.0), b = end.clone().setY(end.y + 1.0);
    g.addProjectile(new StarLines(g, [{ a: () => a, b: () => b }], { width: 0.5, color: STAR_GOLD, life: 0.6, drawIn: 0.05 }));
    const side = new THREE.Vector3(-dir.z, 0, dir.x);
    g.addProjectile(new PlanarSlash(g, f, a.clone().addScaledVector(dir, -1), dir.clone(), side, { length: dist + 6, width: 5, grow: 0.12, damage: 30, cut: 1400, color: STAR_GOLD, core: '#FFF6DE' }));
    for (let i = 0; i < 16; i++) {
      const p = a.clone().lerp(b, i / 15);
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: dir.x * 6, vy: 0.5, vz: dir.z * 6, size: 0.3, sizeEnd: 0.05, life: 0.4, r: 1, g: 0.85, b: 0.5, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
    }
    g.callout('流星', 'RYŪSEI', STAR_GOLD);
    g.sfx.play('swing', f.center(), 1.2);
    g.sfx.play('swingHeavy', f.center(), 1);
  }

  /** Hoshi-tsubute: five stars off the left palm, homing */
  private pebbles(): void {
    const { f, g } = this;
    const from = this.palmPoint(new THREE.Vector3());
    const t = this.target(50);
    const fw = f.forward(new THREE.Vector3());
    for (let i = 0; i < 5; i++) {
      const dir = fw.clone().applyAxisAngle(UP, ((i - 2) * 18 * Math.PI) / 180).setY(0.25 + (i % 2) * 0.15).normalize();
      this.after(i * 0.04, () => g.addProjectile(new StarShot(g, f, from.clone(), dir, t, { damage: 22, speed: 34, turn: 7, blast: 0.9, power: 300, size: 0.28, color: STAR_GOLD, hang: 0.12, range: 60 })));
    }
    g.callout('星礫', 'HOSHI-TSUBUTE', STAR_GOLD);
    g.sfx.play('ting', from, 1);
  }

  /** Tenmaku: the dome of starlight */
  private curtain(s: number): void {
    const { f, g } = this;
    this.dome = new StarDome(g, f, 2.9, s);
    g.addProjectile(this.dome);
    g.callout('天幕', 'TENMAKU', '#FFE6A8');
    g.sfx.play('ting', f.center(), 1.4);
  }

  /** Bakudō #61 */
  private bind(): void {
    const { g } = this;
    const t = this.target(32);
    if (!t) return;
    g.addProjectile(new Rikujokoro(g, this.f, t, 3));
    g.callout('縛道の六十一「六杖光牢」', 'BAKUDŌ #61 — RIKUJŌKŌRŌ', '#FFF2A6');
  }

  // ---------------------------------------------------------------- Shikai

  /** a Shikai cut landed: a star mark set on the target */
  private mark(o: Fighter): void {
    if (!this.marks) {
      this.marks = new StarMarks(this.g, this.f);
      this.g.addProjectile(this.marks);
    }
    this.marks.add(o);
  }

  /** Seiza-giri: the marks joined by lines of light that cut; every mark bursts. With no mark: a gold crescent. */
  private seiza(): void {
    const { f, g } = this;
    const marked = this.marks ? [...this.marks.counts.values()].filter((e) => !e.f.dead) : [];
    if (!marked.length) {
      this.crescent({ radius: 2.6, halfAngle: 1.0, speed: 52, range: 50, damage: 70, cut: 1100, colors: STAR_COLORS });
      return;
    }
    g.callout('星座斬り', 'SEIZA-GIRI', STAR_GOLD);
    const tip = this.tipPoint(new THREE.Vector3());
    const segs: { a: () => THREE.Vector3; b: () => THREE.Vector3; delay?: number }[] = [];
    let prev = () => tip;
    marked.forEach((e, k) => {
      const o = e.f, n = e.n;
      // the target's own constellation: its marks as stars round it, joined in a star polygon
      const pts = Array.from({ length: Math.max(3, n) }, (_, i) => {
        const a = (i / Math.max(3, n)) * Math.PI * 2;
        return () => o.center(new THREE.Vector3()).add(new THREE.Vector3(Math.cos(a) * 1.6, Math.sin(a) * 1.6 + 0.2, Math.sin(a * 2) * 0.4).applyAxisAngle(UP, f.yaw));
      });
      const first = pts[0];
      const p0 = prev;
      segs.push({ a: p0, b: first, delay: k * 0.08 });
      const step = pts.length >= 5 ? 2 : 1;
      for (let i = 0; i < pts.length; i++) segs.push({ a: pts[(i * step) % pts.length], b: pts[((i + 1) * step) % pts.length], delay: 0.1 + k * 0.08 + i * 0.03 });
      prev = () => o.center(new THREE.Vector3());
    });
    g.addProjectile(new StarLines(g, segs, { width: 0.3, color: STAR_GOLD, life: 1.0, drawIn: 0.12, gain: 2.6 }));
    this.after(0.32, () => {
      let from = tip.clone();
      for (const e of marked) {
        const o = e.f;
        const n = this.marks?.take(o) ?? e.n;
        if (o.dead) continue;
        const c = o.center();
        g.damage(o, 60 * n, f, _v.subVectors(o.pos, f.pos).setY(0).normalize().clone(), { energy: true, knock: 10 + n * 2, launch: 6, heavy: true, hitstop: 0.16, shake: 0.7, unblockable: true, color: STAR_GOLD });
        starBurst(g, c, 1 + n * 0.35, STAR_GOLD);
        // the line from the last star to this one cuts whatever stands between
        const len = from.distanceTo(c);
        if (len > 1) {
          const dir = _w.subVectors(c, from).normalize().clone();
          const side = new THREE.Vector3().crossVectors(dir, UP);
          if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
          g.addProjectile(new PlanarSlash(g, f, from.clone(), dir, side.normalize(), { length: len, width: 1.2, grow: 0.06, damage: 0, cut: 900, color: STAR_GOLD, core: '#FFF6DE' }));
        }
        from = c;
      }
      g.sfx.play('explode', from, 1.2);
    });
  }

  /** Hoshi no Ame: stars rain on the target's ground, a third of them falling on the target itself */
  private starRain(n: number, R: number): void {
    const { f, g } = this;
    const t = this.target(60);
    const at = this.groundAt(14);
    for (let i = 0; i < n; i++) {
      this.after(i * 0.05, () => {
        const aimed = i % 3 === 0 && t && !t.dead;
        const c = aimed ? t.pos.clone() : at;
        const a = Math.random() * Math.PI * 2, r = aimed ? 0 : Math.sqrt(Math.random()) * R;
        const to = c.clone().add(new THREE.Vector3(Math.cos(a) * r, aimed ? 1 : 0.3, Math.sin(a) * r));
        const from = to.clone().add(new THREE.Vector3((Math.random() - 0.5) * 6, 26 + Math.random() * 6, (Math.random() - 0.5) * 6));
        g.addProjectile(new StarShot(g, f, from, _v.subVectors(to, from), aimed ? t : null, { damage: 26, speed: 60, turn: aimed ? 5 : 0, blast: 1.1, power: 500, size: 0.32, color: i % 3 === 0 ? '#FFF2C8' : STAR_GOLD, range: 50 }));
      });
    }
  }

  /** Myōjō-kō: the gold beam off the point */
  private beam(): void {
    const { f, g } = this;
    g.addProjectile(new CeroBeam(g, f, this.muzzle, () => this.aim(new THREE.Vector3()), { charge: 0.12, fire: 0.85, radius: 0.8, damage: 170, power: 900, core: '#FFFBEA', body: '#FFD27A', rim: '#C6923D', range: 90, track: 1.2, gain: 1.5 }));
    g.callout('明星光', 'MYŌJŌ-KŌ', STAR_GOLD);
  }

  /** Hoshi-utsuri: behind the target (or the marked enemy furthest away) in a blink, and the cut lands */
  private shift(): void {
    const { f, g } = this;
    let t = this.target(45);
    if (this.marks) {
      let best = -1;
      for (const e of this.marks.counts.values()) {
        const d = e.f.pos.distanceTo(f.pos);
        if (!e.f.dead && d < 60 && d > best) {
          best = d;
          t = e.f;
        }
      }
    }
    if (!t) return;
    const tg = t;
    const back = tg.forward(new THREE.Vector3()).negate();
    let p = tg.pos.clone().addScaledVector(back, tg.def.radius + 1.2);
    if (!clearAt(g, p, f.def.height)) p = tg.pos.clone().addScaledVector(back, -(tg.def.radius + 1.2));
    starBurst(g, f.center(), 1, STAR_GOLD);
    f.ghosts.spawn(0.6, 1);
    if (clearAt(g, p, f.def.height)) {
      f.body.pos.copy(p);
      f.body.prev.copy(p);
    }
    f.yaw = Math.atan2(tg.pos.x - f.pos.x, tg.pos.z - f.pos.z);
    starBurst(g, f.center(), 1, STAR_GOLD);
    g.callout('星移り', 'HOSHI-UTSURI', STAR_GOLD);
    this.after(0.01, () => f.act(new MoveAction(this, 'nt_s4', 3, { damage: 0 }, false), true));
    // the cut lands as she turns: it does not wait on the swing to find the target
    this.after(0.14, () => {
      if (tg.dead || f.dead) return;
      const dir = _v.subVectors(tg.pos, f.pos).setY(0).normalize().clone();
      g.damage(tg, 80, f, dir, { knock: 12, launch: 3, heavy: true, hitstop: 0.1, shake: 0.4, unblockable: true, color: STAR_GOLD });
      starSlash(g, tg.center(), dir.clone().applyAxisAngle(UP, Math.PI / 2), 3, STAR_GOLD);
      this.mark(tg);
    });
  }

  /** Kasei: the calamity star over the target */
  private kasei(): void {
    const { f, g } = this;
    const t = this.target(50);
    const at = t ? t.center().setY(t.pos.y + 4.5) : f.center().addScaledVector(f.forward(_w), 14).setY(f.pos.y + 4.5);
    g.addProjectile(new CalamityStar(g, f, at, { damage: 240, radius: 4, pull: 16, reach: 18, grow: 0.4, hold: 1.6 }));
  }

  // ---------------------------------------------------------------- Bankai

  /** Ryūseigun: twelve stars falling out of the night on the target's ground */
  private meteors(n: number): void {
    const { f, g } = this;
    const t = this.target(90);
    const at = t ? t.pos.clone() : f.pos.clone().addScaledVector(f.forward(_w), 22);
    for (let i = 0; i < n; i++) {
      this.after(i * 0.17, () => {
        // the first ones go straight at the target where it stands now
        const c = t && !t.dead && i < 4 ? t.pos.clone() : at;
        const a = Math.random() * Math.PI * 2, r = i < 4 ? 0 : 2 + Math.random() * 7;
        const p = c.clone().add(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
        g.addProjectile(new FallingStar(g, f, p, { damage: 70, radius: 2.2, power: 1800, fall: 0.9 + Math.random() * 0.3, track: i % 2 === 0 && t ? t : undefined }));
      });
    }
  }

  /** Seiza Shōkan: the next constellation drawn up behind the target; it strikes */
  private summon(): void {
    const { f, g } = this;
    const kinds: ConstellationKind[] = ['orion', 'sagittarius', 'scorpius'];
    const kind = kinds[this.constellation++ % kinds.length];
    const t = this.target(90);
    const at = t ? t.pos.clone() : f.pos.clone().addScaledVector(f.forward(_w), 26);
    const facing = _v.subVectors(at, f.pos).setY(0);
    if (facing.lengthSq() < 1e-4) f.forward(facing);
    facing.normalize();
    const center = at.clone().addScaledVector(facing, 9).setY(at.y + 10);
    const fig = new Constellation(g, kind, center, facing.clone(), 1.5, 3.0);
    g.addProjectile(fig);
    const names: Record<ConstellationKind, string> = { orion: 'ORION', sagittarius: 'SAGITTARIUS', scorpius: 'SCORPIUS' };
    g.callout('星座召喚', `SEIZA SHŌKAN — ${names[kind]}`, '#DDE6FF');
    g.sfx.play('ting', center, 1.6);
    const target = () => (t && !t.dead ? t.pos.clone() : at.clone());
    if (kind === 'orion') {
      this.after(1.0, () => {
        const to = target();
        g.addProjectile(new GiantSword(g, fig.hand(), to.clone().setY(to.y + 1), { swing: 0.32, life: 0.8, onCut: () => this.orionCut(t, to, facing.clone()) }));
      });
    } else if (kind === 'sagittarius') {
      for (let i = 0; i < 9; i++)
        this.after(1.0 + i * 0.07, () => {
          const from = fig.hand();
          const to = target().add(new THREE.Vector3((Math.random() - 0.5) * 3, 1 + Math.random(), (Math.random() - 0.5) * 3));
          g.addProjectile(new StarShot(g, f, from, _w.subVectors(to, from), t, { damage: 60, speed: 72, turn: 2.5, blast: 1.6, power: 1500, size: 0.5, color: '#DDE6FF', arrow: true, range: 120 }));
        });
    } else {
      this.after(1.0, () => {
        const from = fig.hand();
        g.addProjectile(new StarShot(g, f, from, _w.subVectors(target().setY(target().y + 1), from), t, { damage: 260, speed: 55, turn: 8, blast: 3, power: 2500, size: 1.1, color: '#FF9E8A', unblockable: true, range: 140, onHit: (o) => this.paralyze(o, 2.5) }));
      });
    }
  }

  /** Orion's sword comes down: the target cut, and the city behind it split down a vertical plane */
  private orionCut(t: Fighter | null, at: THREE.Vector3, facing: THREE.Vector3): void {
    const { f, g } = this;
    if (t && !t.dead) {
      g.damage(t, 380, f, facing.clone(), { knock: 20, launch: 8, heavy: true, hitstop: 0.2, shake: 1.2, unblockable: true, color: '#FFF2C8' });
      g.sparks(t.center(), facing, '#FFF2C8', 30);
    }
    const origin = at.clone().addScaledVector(facing, -10).setY(at.y + 12);
    g.addProjectile(new PlanarSlash(g, f, origin, facing.clone(), UP.clone(), { length: 75, width: 30, grow: 0.3, damage: 120, cut: 5000, color: '#FFF2C8', core: '#FFFFFF' }));
    g.groundImpact(at.clone(), 2.5, 2000, '#FFF2C8', f);
    starBurst(g, at.clone().setY(at.y + 1), 4, '#FFF2C8');
    g.shake(1.2);
    g.slowMo(0.3, 0.35);
  }

  /** Scorpius' venom: the body seized (rooted, staggered) */
  private paralyze(o: Fighter, s: number): void {
    const { g } = this;
    const k = o.def.boss ? 0.4 : 1;
    o.stopAction();
    o.hitstun = Math.max(o.hitstun, s * k);
    o.rooted = true;
    this.after(s * k, () => {
      o.rooted = false;
    });
    g.hud?.floatText(o.center().setY(o.pos.y + o.def.height + 0.3), 'PARALYSED', '#FF9E8A', 18);
  }

  /** Amanogawa: the river of heaven poured out of the blade */
  private amanogawa(): void {
    const { f, g } = this;
    this.river = new CeroBeam(g, f, this.muzzle, () => this.aim(new THREE.Vector3()), { charge: 0.3, fire: 1.55, radius: 2.4, damage: 300, power: 3000, core: '#F4F7FF', body: '#AFC4FF', rim: '#4A3AA8', range: 120, track: 0.9, gain: 1.4 });
    g.addProjectile(this.river);
    this.riverT = 1.9;
    g.callout('天の川', 'AMANOGAWA', '#C6D8FF');
  }

  /** stars streaming down the river while it pours */
  private riverStream(dt: number): void {
    const { g } = this;
    this.riverT -= dt;
    const r = this.river;
    if (!r || r.done || this.riverT <= 0) {
      this.riverT = 0;
      this.river = null;
      return;
    }
    const m = this.tipPoint(_u);
    for (let i = 0; i < 8; i++) {
      const d = Math.random() * 60;
      const off = new THREE.Vector3((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
      const p = m.clone().addScaledVector(r.dir, d).add(off);
      const c = Math.random() < 0.3 ? [1, 0.92, 0.75] : [0.8, 0.88, 1];
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: r.dir.x * 40, vy: r.dir.y * 40, vz: r.dir.z * 40, size: 0.2, sizeEnd: 0.05, life: 0.3, r: c[0] * 1.5, g: c[1] * 1.5, b: c[2] * 1.5, alpha: 1, alphaEnd: 0, tex: i % 2 ? TEX_GLOW : TEX_STREAK, stretch: 2 });
    }
  }

  /** Kuro-boshi: the black star over the target */
  private blackStar(): void {
    const { f, g } = this;
    const t = this.target(60);
    const at = t ? t.center().setY(t.pos.y + 1.6) : f.center().addScaledVector(f.forward(_w), 16).setY(f.pos.y + 1.6);
    g.addProjectile(new BlackStar(g, f, at, { life: 4.5, reach: 22, pull: 15, drain: 45, damage: 320, radius: 6.5 }));
    g.callout('黒星', 'KURO-BOSHI', '#FF9E4A');
  }

  // ---------------------------------------------------------------- final

  /** Chōshinsei: a star detonated at the target */
  private supernova(): void {
    const { f, g } = this;
    const t = this.target(90);
    const at = t ? t.center() : f.center().addScaledVector(f.forward(_w), 22);
    g.addProjectile(new Supernova(g, f, at, { damage: 600, radius: 9, delay: 0.28, power: 6000 }));
    g.callout('超新星', 'CHŌSHINSEI', '#FFE3A0');
  }

  /** Ginga Ryūsei-hō: the galaxy cannon */
  private galaxyCannon(): void {
    const { f, g } = this;
    this.river = new CeroBeam(g, f, this.muzzle, () => this.aim(new THREE.Vector3()), { charge: 0.4, fire: 2.0, radius: 4, damage: 700, power: 8000, core: '#FFFDF2', body: '#FFE3A0', rim: '#7A5AE0', range: 150, track: 0.9, gain: 1.3, spiral: true });
    g.addProjectile(this.river);
    this.riverT = 2.4;
    g.callout('銀河流星砲', 'GINGA RYŪSEI-HŌ', '#FFE3A0');
  }

  /** Hoshi no Toki: time stopped for every enemy */
  private haltTime(s: number): void {
    const { f, g } = this;
    this.timeT = s;
    let mine = f === g.player;
    for (const o of g.enemiesOf(f)) {
      o.dilate(0.97, s);
      o.stopAction();
      if (o === g.player) mine = true;
    }
    g.addProjectile(new TimeHalt(g, f, s, mine));
    g.callout('星の刻', 'HOSHI NO TOKI', '#FFE3A0');
    g.addRing(f.center(), 60, '#FFE3A0', 1);
    g.sfx.play('ting', f.center(), 1.8);
  }

  private dawnGather(): void {
    const { f, g } = this;
    g.callout('暁', 'AKATSUKI', '#FFB08A');
    f.aura.flare(2.4, 1);
    starMotes(g, f, 40, '#FFE3A0', 1.2);
    g.sfx.play('charge', f.center(), 1.6);
  }

  /** Akatsuki: the dawn breaks — a wall of light across the whole field ahead; the night lifts */
  private akatsuki(): void {
    const { f, g } = this;
    const aim = this.aim(new THREE.Vector3());
    const fwd = aim.sub(f.pos).setY(0);
    if (fwd.lengthSq() < 1e-4) f.forward(fwd);
    fwd.normalize();
    g.addProjectile(new DawnWall(g, f, f.pos.clone().addScaledVector(fwd, -2).setY(f.pos.y - 1), fwd, { width: 140, height: 70, speed: 60, range: 170, damage: 1500 }));
    this.night?.end();
    this.night = null;
    passingSky(g, SKY_DAWN, 3.5, 1.2);
    starBurst(g, this.tipPoint(new THREE.Vector3()), 4, '#FFE3A0');
    g.shake(1.4);
    g.slowMo(0.6, 0.35);
    g.sfx.play('roarBig', f.center(), 0.6);
    g.sfx.play('explode', f.center(), 1.2);
  }

  // ---------------------------------------------------------------- AI & HUD

  ai(): KitAI {
    const { f, g } = this;
    const is = (fm: Form) => () => this.form === fm;
    const rushed = () => {
      const t = g.nearestEnemy(f, 6);
      return !!t && t.pos.distanceTo(f.pos) < 3.5 && t.action !== null && t.action.name !== 'dash';
    };
    const marked = () => (this.marks?.total() ?? 0) >= 3;
    return {
      reach: this.form === 'bankai' ? 2.6 : 2.2,
      chain: this.form === 'final' ? 6 : 5,
      releaseAt: [0.98, 0.85, 0.6],
      ranged: () => this.form === 'bankai' || this.form === 'final',
      opener: () => this.skill3(),
      moves: [
        // sealed
        { name: 'ryusei', use: () => this.heavy(), min: 4, max: 24, weight: 1.6, cd: 3, when: is('sealed') },
        { name: 'pebbles', use: () => this.skill1(), min: 3, max: 40, weight: 1.2, cd: 2, when: is('sealed') },
        { name: 'tenmaku', use: () => this.skill2(), min: 0, max: 40, weight: 1.4, cd: 9, when: () => this.form === 'sealed' && (rushed() || f.hp < f.maxHp * 0.5) },
        { name: 'hoshiyomi', use: () => this.skill3(), min: 0, max: 12, weight: 1.6, cd: 12, when: () => this.form === 'sealed' && this.readT <= 0 },
        { name: 'bind', use: () => this.toggle(), min: 2, max: 28, weight: 1.1, cd: 8, when: is('sealed') },
        // Shikai
        { name: 'seiza', use: () => this.heavy(), min: 0, max: 40, weight: 4, cd: 2.5, when: () => this.form === 'shikai' && marked() },
        { name: 'rain', use: () => this.skill1(), min: 6, max: 45, weight: 1.3, cd: 6, when: is('shikai') },
        { name: 'beam', use: () => this.skill2(), min: 6, max: 70, weight: 1.3, cd: 5, when: is('shikai') },
        { name: 'shift', use: () => this.skill3(), min: 5, max: 40, weight: 1.2, cd: 2.5, when: is('shikai') },
        { name: 'kasei', use: () => this.toggle(), min: 3, max: 40, weight: 1.1, cd: 10, when: is('shikai') },
        // Bankai
        { name: 'meteors', use: () => this.heavy(), min: 4, max: 80, weight: 1.6, cd: 5, when: is('bankai') },
        { name: 'summon', use: () => this.skill1(), min: 6, max: 80, weight: 1.5, cd: 7, when: is('bankai') },
        { name: 'river', use: () => this.skill2(), min: 6, max: 100, weight: 1.3, cd: 8, when: is('bankai') },
        { name: 'blackstar', use: () => this.skill3(), min: 4, max: 50, weight: 1.2, cd: 12, when: is('bankai') },
        { name: 'tenmon', use: () => this.toggle(), min: 0, max: 14, weight: 1.6, cd: 14, when: () => this.form === 'bankai' && this.readT <= 0 && rushed() },
        // final
        { name: 'nova', use: () => this.heavy(), min: 4, max: 80, weight: 1.6, cd: 4, when: is('final') },
        { name: 'ranbu', use: () => this.skill1(), min: 0, max: 35, weight: 1.5, cd: 6, when: is('final') },
        { name: 'galaxy', use: () => this.skill2(), min: 8, max: 120, weight: 1.2, cd: 8, when: is('final') },
        { name: 'toki', use: () => this.skill3(), min: 0, max: 60, weight: 1.4, cd: 18, when: is('final') },
        { name: 'dawn', use: () => this.toggle(), min: 6, max: 120, weight: 2.2, cd: 30, when: () => this.form === 'final' && (this.target(120)?.hp ?? 1) < (this.target(120)?.maxHp ?? 1) * 0.7 },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    const flare = { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare };
    const shunpo = { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 };
    switch (this.form) {
      case 'sealed':
        return [
          { key: 'LMB', name: 'Iai', kanji: '居合' },
          { key: 'RMB', name: 'Ryūsei', kanji: '流星', cost: 14, cd: cd.ryusei, cdMax: 2.6, tint: STAR_GOLD },
          { key: 'Q', name: 'Hoshi-tsubute', kanji: '星礫', cost: 10, cd: cd.pebbles, cdMax: 1.6, tint: STAR_GOLD },
          { key: 'E', name: 'Tenmaku', kanji: '天幕', cost: 18, cd: cd.dome, cdMax: 8, active: !!this.dome?.holds(), tint: '#FFE6A8' },
          { key: 'R', name: 'Hoshiyomi', kanji: '星読み', cost: 16, cd: cd.read, cdMax: 11, active: this.readT > 0, timer: this.readT > 0 ? this.readT / 6 : undefined, tint: '#FFE3A0' },
          shunpo,
          flare,
          { key: 'F', name: 'Kagayake, Myōjō', kanji: '明星', cost: 20, tint: STAR_GOLD },
          { key: 'G', name: 'Rikujōkōrō', kanji: '六杖光牢', cost: 14, cd: cd.bind, cdMax: 7, tint: '#FFF2A6' },
        ];
      case 'shikai': {
        const marks = this.marks?.total() ?? 0;
        return [
          { key: 'LMB', name: `Myōjō${marks ? ` (${marks} mark${marks > 1 ? 's' : ''})` : ''}`, kanji: '明星', active: marks > 0, tint: STAR_GOLD },
          { key: 'RMB', name: 'Seiza-giri', kanji: '星座斬り', cost: 16, cd: cd.seiza, cdMax: 2.4, active: marks > 0, tint: STAR_GOLD },
          { key: 'Q', name: 'Hoshi no Ame', kanji: '星の雨', cost: 22, cd: cd.rain, cdMax: 5.5, tint: STAR_GOLD },
          { key: 'E', name: 'Myōjō-kō', kanji: '明星光', cost: 24, cd: cd.beam, cdMax: 5, tint: '#FFD27A' },
          { key: 'R', name: 'Hoshi-utsuri', kanji: '星移り', cost: 8, cd: cd.shift, cdMax: 1.2, tint: STAR_GOLD },
          shunpo,
          flare,
          { key: 'F', name: 'Bankai', kanji: '卍解', cost: 40, tint: '#C6D8FF' },
          { key: 'G', name: 'Kasei', kanji: '禍星', cost: 30, cd: cd.kasei, cdMax: 9, tint: '#FFB86A' },
        ];
      }
      case 'bankai':
        return [
          { key: 'LMB', name: 'Star crescents', kanji: '銀河' },
          { key: 'RMB', name: 'Ryūseigun', kanji: '流星群', cost: 28, cd: cd.meteors, cdMax: 4.5, tint: '#FFE3A0' },
          { key: 'Q', name: `Seiza Shōkan · ${['Orion', 'Sagittarius', 'Scorpius'][this.constellation % 3]}`, kanji: '星座召喚', cost: 34, cd: cd.summon, cdMax: 6.5, tint: '#DDE6FF' },
          { key: 'E', name: 'Amanogawa', kanji: '天の川', cost: 40, cd: cd.river, cdMax: 7.5, tint: '#C6D8FF' },
          { key: 'R', name: 'Kuro-boshi', kanji: '黒星', cost: 36, cd: cd.black, cdMax: 11, tint: '#FF9E4A' },
          shunpo,
          flare,
          { key: 'F', name: 'Myōjō Kōrin', kanji: '降臨', cost: 60, tint: '#FFE7A0' },
          { key: 'G', name: 'Hoshiyomi: Tenmon', kanji: '天文', cost: 24, cd: cd.tenmon, cdMax: 13, active: this.readT > 0, timer: this.readT > 0 ? this.readT / 8 : undefined, tint: '#FFE3A0' },
        ];
      default:
        return [
          { key: 'LMB', name: 'Light', kanji: '光' },
          { key: 'RMB', name: 'Chōshinsei', kanji: '超新星', cost: 30, cd: cd.nova, cdMax: 3.5, tint: '#FFE3A0' },
          { key: 'Q', name: 'Seigun Ranbu', kanji: '星群乱舞', cost: 30, cd: cd.ranbu, cdMax: 5, tint: '#FFE7A0' },
          { key: 'E', name: 'Ginga Ryūsei-hō', kanji: '銀河流星砲', cost: 50, cd: cd.galaxy, cdMax: 7, tint: '#FFE3A0' },
          { key: 'R', name: 'Hoshi no Toki', kanji: '星の刻', cost: 40, cd: cd.toki, cdMax: 16, active: this.timeT > 0, timer: this.timeT > 0 ? this.timeT / 5 : undefined, tint: '#FFE3A0' },
          shunpo,
          flare,
          { key: 'F', name: 'Seal', kanji: '封' },
          { key: 'G', name: 'Akatsuki', kanji: '暁', cost: 80, cd: cd.dawn, cdMax: 40, tint: '#FFB08A' },
        ];
    }
  }
}
