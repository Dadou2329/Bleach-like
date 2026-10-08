// Yumichika Ayasegawa's kit (docs/kits/yumichika.md). Beauty with a secret.
// Sealed: the lunge, a slash, the rising flourish, the pirouette (LMB); Beautiful Swordfight, a flurry of clashing
// cuts (RMB); Hadō #57 Daichi Ten'yō — rubble lifted round him and hurled, the stones swatting shots (Q); Hadō #31
// Shakkahō (E); Bakudō #4 Hainawa (R); "Sake, Fuji Kujaku" (F); the hair fix (G).
// Fuji Kujaku (it sulks: barely stronger than sealed): hooking sweeps with the four-sickle fan (LMB); the fan spin
// (RMB); Daichi Ten'yō (Q); the blade catch — a blow caught between the sickles, the attacker disarmed (E); Beautiful
// Swordfight (R); "Sakikurue, Ruri'iro Kujaku" (F) — refused while anyone of the 11th Division is near; the hair fix.
// Ruri'iro Kujaku: vine lashes (LMB); the vine burst (RMB); the ensnare — vines coil round the target and drink its
// reiatsu and blood, buds swelling in its colour (Q); the bloom (E); a petal eaten (R); the seal (F); the thicket (G).
// Passives: his nose (blindness wears off fast); a heavy blow to him rattles him (hits and takes harder for 4 s).
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { DamageOpts, Game } from '../game';
import { FUJI_BASE_Z, FUJI_TIP_Z, KATANA_BASE_Z, KATANA_TIP_Z, RURI_ROOT_Z, yumichikaAsset, yumichikaProp } from '../../chars/yumichika';
import { FUJI_CHAIN, FUJI_CLIPS, FUJI_STANCE, RURI_CHAIN, RURI_CLIPS, RURI_STANCE, YUMICHIKA_CHAIN, YUMICHIKA_CLIPS, YUMICHIKA_STANCE } from '../../chars/yumichikaClips';
import type { AuraStyle } from '../../vfx/aura';
import { SajoRope } from '../../vfx/kazeshini';
import { DebrisChunk } from '../../vfx/wabisuke';
import { PeacockVines, featherFlutter, wisteriaFlash } from '../../vfx/kujaku';
import { groundAt } from '../../vfx/iceArts';
import { TEX_GLOW } from '../../vfx/sprites';
import { Shakkaho } from '../projectiles/shakkaho';
import type { AbilityInfo } from '../../ui/hud';
import type { Kit, KitAI } from './kit';

type BladeDef = NonNullable<FighterDef['blade']>;
type Form = 'sealed' | 'fuji' | 'ruri';

const AURA: AuraStyle = { core: '#D5F7DE', body: '#4CC46A', rim: '#22803A' };
const TRAIL = { color: '#B9E6C4', core: '#F4FFF6' };
const KATANA: BladeDef = { prop: 'sword', base: [0, 0, KATANA_BASE_Z], tip: [0, 0, KATANA_TIP_Z], ...TRAIL };
const FAN: BladeDef = { prop: 'sword', base: [0, 0, FUJI_BASE_Z], tip: [0, 0, FUJI_TIP_Z], color: '#C9C0E6', core: '#F6F2FF' };
const HILT: BladeDef = { prop: 'sword', base: [0, 0, -2 / 48], tip: [0, 0, RURI_ROOT_Z], color: '#6FD1A8', core: '#EAFFF4' };
const SPEED: FighterDef['speed'] = { run: 10.6, sprint: 23, jump: 12, dash: 15.5, dashTime: 0.12 };
/** the 11th Division: none of them may see the true Shikai */
const ELEVENTH = ['ikkaku', 'kenpachi'];
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

const CLIPS = [...YUMICHIKA_CLIPS, ...FUJI_CLIPS, ...RURI_CLIPS].filter((c, i, a) => a.findIndex((d) => d.name === c.name) === i);

const sealedProps = () => [
  { key: 'sword', model: yumichikaProp('katana'), socket: 'grip.R' },
  { key: 'saya', model: yumichikaProp('saya'), socket: 'hip.L' },
];

export const YUMICHIKA_DEF: FighterDef = {
  id: 'yumichika',
  name: 'Yumichika Ayasegawa',
  title: '5th Seat, 11th Division',
  build: () => ({ asset: yumichikaAsset(), props: sealedProps() }),
  stance: YUMICHIKA_STANCE,
  clips: CLIPS,
  aura: AURA,
  blade: KATANA,
  hp: 1000,
  rei: 150,
  speed: { ...SPEED },
  radius: 0.37,
  height: 1.69,
};

// ------------------------------------------------------------------ helpers

function lungeTo(f: Fighter, stop: number, at: number, max = 26): number {
  const tgt = f.faceTarget;
  if (!tgt) return 0;
  const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
  if (d <= stop + 0.25 || d > 8) return 0;
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

const spec = (damage: number, knock: number, cut: number, extra: Partial<BladeSpec> = {}): BladeSpec => ({ damage, knock, launch: 0, hitstop: 0.05, shake: 0.14, cut, ...extra });

/** blade windows of each move (clip time) */
const MOVES: Record<string, { at: [number, number][]; spec: BladeSpec }> = {
  ym_s1: { at: [[0.12, 0.22]], spec: spec(17, 7, 320, { reach: 0.14 }) },
  ym_s2: { at: [[0.1, 0.22]], spec: spec(17, 8, 340, { reach: 0.1 }) },
  ym_s3: { at: [[0.1, 0.24]], spec: spec(17, 3, 340, { launch: 9, reach: 0.1 }) },
  ym_s4: { at: [[0.2, 0.34]], spec: spec(22, 11, 400, { heavy: true, hitstop: 0.08, shake: 0.24, reach: 0.12 }) },
  yf_s1: { at: [[0.1, 0.24]], spec: spec(18, 8, 340, { reach: 0.2 }) },
  yf_s2: { at: [[0.1, 0.23]], spec: spec(18, 8, 340, { reach: 0.2 }) },
  yf_s3: { at: [[0.1, 0.24]], spec: spec(18, 3, 340, { launch: 8, reach: 0.2 }) },
  yf_s4: { at: [[0.14, 0.3]], spec: spec(24, 6, 400, { heavy: true, hitstop: 0.08, shake: 0.24, reach: 0.2 }) },
  ym_flurry: { at: Array.from({ length: 8 }, (_, i) => [0.1 + i * 0.1, 0.17 + i * 0.1] as [number, number]), spec: spec(9, 2, 260, { hitstop: 0.02, shake: 0.06, reach: 0.12 }) },
};

/** Marker for the skills a string can cancel into. */
abstract class SkillAction extends FighterAction {}

/** One move of a sword string (or the flurry): its blade windows, the lunge in. */
class MoveAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private stopAt = 0;
  private win = -1;
  queued = false;
  constructor(readonly kit: YumichikaKit, readonly clip: string, readonly index: number) {
    super();
    this.name = clip;
    this.mobility = 0.12;
    this.airGravity = 0.12;
    if (clip === 'ym_flurry') this.armor = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    f.bladeHits.clear();
    this.stopAt = lungeTo(f, 1.25, MOVES[this.clip].at[0][0]);
    f.anim.play(this.clip, { onEvent: (n) => n === 'step' && g.sfx.play('step', f.pos, 0.5) });
    if (this.clip === 'ym_flurry') g.callout('ビューティフルチャンバラ', 'BEAUTIFUL SWORDFIGHT', '#4CC46A');
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    this.stopAt = lungeStop(f, this.stopAt);
    const m = MOVES[this.clip];
    let pre = -1, cur = -1;
    for (let i = 0; i < m.at.length; i++) {
      if (t >= m.at[i][0] - 0.03 && t <= m.at[i][1]) pre = i;
      if (t >= m.at[i][0] && t <= m.at[i][1]) cur = i;
    }
    if (pre >= 0 && pre !== this.win) {
      this.win = pre;
      f.bladeHits.clear();
      // the flurry presses after a target its cuts push back
      if (this.clip === 'ym_flurry' && pre > 0) this.stopAt = lungeTo(f, 1.2, 0.08, 12);
      const last = pre === m.at.length - 1;
      f.bladeSpec = this.kit.bladeSpec(this.clip === 'ym_flurry' && last ? { ...m.spec, knock: 12, hitstop: 0.08, damage: 14 } : m.spec);
      g.sfx.play(m.spec.heavy ? 'swingHeavy' : 'swing', f.center(), this.clip === 'ym_flurry' ? 0.5 : 1);
    }
    f.bladeActive = cur >= 0;
    if (f.trail) f.trail.emitting = pre >= 0;
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
    const m = MOVES[this.clip];
    const w = m.at[m.at.length - 1][1];
    if (next.name === 'dash') return this.t >= w;
    return next instanceof SkillAction && this.t >= w + 0.04;
  }
}

/** A skill: plays its clip, runs its events, ends with the clip (or at `endAt`). */
class Skill extends SkillAction {
  private fired = new Set<string>();
  private cancelAt: number;
  private hold: boolean;
  constructor(readonly kit: YumichikaKit, readonly name: string, readonly clip: string, readonly endAt: number, readonly events: Record<string, [number, () => void]>, opts: { armor?: number; mobility?: number; cancelAt?: number; hold?: boolean } = {}) {
    super();
    this.mobility = opts.mobility ?? 0.2;
    this.armor = opts.armor ?? 0;
    this.cancelAt = opts.cancelAt ?? endAt * 0.8;
    this.hold = !!opts.hold;
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

/** RMB (Fuji Kujaku): the fan spin — two turns on the spot, the fan out level, swatting shots */
class FanSpinAction extends SkillAction {
  readonly name = 'fanspin';
  private pass = -1;
  constructor(readonly kit: YumichikaKit) {
    super();
    this.mobility = 0.35;
    this.armor = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('yf_spin');
    f.bladeHits.clear();
    f.bladeSpec = spec(18, 7, 340, { reach: 0.25, hitstop: 0.04 });
    g.sfx.play('swingHeavy', f.center(), 0.9);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const on = this.t >= 0.08 && this.t <= 0.9;
    f.bladeActive = on;
    if (f.trail) f.trail.emitting = on;
    // every half turn the fan may cut the same fighter again
    const pass = Math.floor((this.t - 0.08) / 0.2);
    if (on && pass !== this.pass) {
      this.pass = pass;
      f.bladeHits.clear();
      g.sfx.play('swing', f.center(), 0.5);
    }
    if (on) g.rejectNear(f.center(), 2.4, f, false);
    if (this.t >= 1.0) this.done = true;
  }
  override end(f: Fighter): void {
    f.bladeActive = false;
    if (f.trail) f.trail.emitting = false;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t > 0.5;
  }
}

/** E (Fuji Kujaku): the blade catch — the fan held out; the first blow from the front is caught */
class CatchAction extends SkillAction {
  readonly name = 'catch';
  constructor(readonly kit: YumichikaKit) {
    super();
    this.mobility = 0.15;
  }
  override start(f: Fighter): void {
    f.anim.play('yf_catch', { hold: true });
    this.kit.catchUntil = this.kit.g.time + 0.6;
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 0.6) this.done = true;
  }
  override end(f: Fighter): void {
    this.kit.catchUntil = 0;
    f.anim.stopAll(0.15);
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t > 0.2;
  }
}

/** LMB (Ruri'iro Kujaku): a vine lashed out from the hilt */
class LashAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private lashed = false;
  queued = false;
  constructor(readonly kit: YumichikaKit, readonly clip: string, readonly index: number) {
    super();
    this.name = clip;
    this.mobility = 0.3;
  }
  override start(f: Fighter): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    f.anim.play(this.clip);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.lashed && this.t >= 0.12) {
      this.lashed = true;
      this.kit.lash(5.2, this.index === 3 ? 22 : 15, this.index === 3);
    }
    if (this.queued && this.t >= this.comboAt) {
      this.done = true;
      this.kit.chain(this.index + 1);
      return;
    }
    if (this.t >= this.dur) this.done = true;
  }
  override canCancel(next: FighterAction): boolean {
    if (next.name === 'dash') return this.t >= 0.2;
    return next instanceof SkillAction && this.t >= 0.16;
  }
}

// ------------------------------------------------------------------ the kit

interface Snare {
  o: Fighter;
  fill: number;
  shaken: number;
  t: number;
}

export class YumichikaKit implements Kit {
  form: Form = 'sealed';
  comboIndex = 0;
  private lastSwingEnd = 0;
  flare = false;
  catchUntil = 0;
  /** rattled: a heavy blow to his face or hair (s left) */
  rattledT = 0;
  vines: PeacockVines | null = null;
  snare: Snare | null = null;
  /** flowers left by the last bloom (the petal heals by them) */
  petals = 0;
  private stones: DebrisChunk[] = [];
  private bound: { o: Fighter; until: number } | null = null;
  private timers: { t: number; fn: () => void }[] = [];
  private hudT = 0;
  private dashing = false;
  readonly cd = { flurry: 0, lift: 0, shakka: 0, hainawa: 0, spin: 0, catch: 0, hair: 0, burst: 0, snare: 0, bloom: 0, petal: 0, thicket: 0 };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.parry = (amount, from, o) => this.parry(amount, from, o);
    f.onHurt = (_dmg, heavy) => {
      if (heavy) this.rattledT = 4;
      this.applyStats();
    };
    // brutes overpower him
    f.knockTaken = 1.15;
    this.applyStats();
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    if (this.rattledT > 0 && (this.rattledT -= dt) <= 0) this.applyStats();
    // a graceful Shunpo: a flutter of feathers where he was
    if (f.dashT > 0 && !this.dashing) featherFlutter(g, f.center(_v).setY(f.pos.y + 1.5), 5);
    this.dashing = f.dashT > 0;
    // his nose: blindness does not keep him lost for long
    if (f.blindT > 0) f.blindT = Math.max(0, f.blindT - dt * 2);
    for (let i = this.timers.length - 1; i >= 0; i--) {
      const tm = this.timers[i];
      tm.t -= dt;
      if (tm.t > 0) continue;
      this.timers.splice(i, 1);
      tm.fn();
    }
    // the hovering stones of Daichi Ten'yō stop shots
    this.stones = this.stones.filter((s) => !s.done);
    for (const s of this.stones) g.rejectNear(s.pos, 0.8, f, false);
    if (this.bound && (this.bound.o.dead || g.time > this.bound.until)) this.bound = null;
    this.updateSnare(dt);
    if (f.dead && this.snare) this.letGo();
    this.hudT -= dt;
    if (this.hudT <= 0 && g.hud && f === g.player) {
      this.hudT = 0.25;
      g.hud.form = this.formName();
    }
  }

  private after(s: number, fn: () => void): void {
    this.timers.push({ t: s, fn });
  }

  // ---------------------------------------------------------------- inputs

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof MoveAction || cur instanceof LashAction) {
      if (cur.index >= 0) cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastSwingEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const list = this.form === 'sealed' ? YUMICHIKA_CHAIN : this.form === 'fuji' ? FUJI_CHAIN : RURI_CHAIN;
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    this.lastSwingEnd = this.g.time + 0.8;
    this.f.act(this.form === 'ruri' ? new LashAction(this, list[idx], idx) : new MoveAction(this, list[idx], idx), true);
  }

  /** RMB: Beautiful Swordfight / the fan spin / the vine burst */
  heavy(): void {
    if (this.form === 'sealed') this.special(new MoveAction(this, 'ym_flurry', -1), 12, 'flurry', 5);
    else if (this.form === 'fuji') this.special(new FanSpinAction(this), 14, 'spin', 4.5);
    else this.special(new Skill(this, 'burst', 'yr_burst', 0.56, { burst: [0.2, () => this.burst()] }, { mobility: 0.1 }), 14, 'burst', 4);
  }

  /** Q: Daichi Ten'yō / the ensnare */
  skill1(): void {
    if (this.form === 'ruri') {
      this.special(new Skill(this, 'snare', 'yr_snare', 0.66, { snare: [0.16, () => this.ensnare()] }, { mobility: 0.1 }), 18, 'snare', 6);
      return;
    }
    this.special(new Skill(this, 'lift', 'ym_lift', 0.86, { lift: [0.18, () => this.liftStones()], hurl: [0.52, () => this.hurlStones()] }, { mobility: 0.15 }), 16, 'lift', 7);
  }

  /** E: Shakkahō / the blade catch / the bloom */
  skill2(): void {
    if (this.form === 'sealed') this.special(new Skill(this, 'shakka', 'ym_palm', 0.46, { cast: [0.14, () => this.shakkaho()] }), 14, 'shakka', 3.5);
    else if (this.form === 'fuji') this.special(new CatchAction(this), 6, 'catch', 2.5);
    else {
      if (!this.snare) {
        if (this.f === this.g.player) this.g.hud?.showBanner('Nothing to bloom on', 1);
        return;
      }
      this.special(new Skill(this, 'bloom', 'yr_bloom', 0.74, { bloom: [0.3, () => this.bloom()] }, { mobility: 0.1 }), 10, 'bloom', 2);
    }
  }

  /** R: Hainawa / Beautiful Swordfight / a petal */
  skill3(): void {
    if (this.form === 'sealed') this.special(new Skill(this, 'hainawa', 'ym_palm', 0.46, { cast: [0.14, () => this.hainawa()] }), 10, 'hainawa', 7);
    else if (this.form === 'fuji') this.special(new MoveAction(this, 'ym_flurry', -1), 12, 'flurry', 5);
    else {
      if (this.petals <= 0.01) {
        if (this.f === this.g.player) this.g.hud?.showBanner('No flowers yet', 1);
        return;
      }
      this.special(new Skill(this, 'petal', 'yr_petal', 0.74, { eat: [0.45, () => this.eatPetal()] }, { mobility: 0.2 }), 0, 'petal', 3);
    }
  }

  /** F: "Sake" / "Sakikurue" (not with the 11th Division watching) / the seal */
  release(): void {
    const { f, g } = this;
    if (f.busy || f.sealT > 0) return;
    if (this.form === 'sealed') {
      if (!f.spendRei(16)) return this.noRei();
      f.act(new Skill(this, 'release', 'ym_release', 0.86, {
        name: [0.2, () => g.callout('咲け「藤孔雀」', 'SAKE, FUJI KUJAKU', '#A59ACA')],
        bloom: [0.5, () => this.toFuji()],
      }, { armor: 0.5, mobility: 0.1 }), true);
      return;
    }
    if (this.form === 'fuji') {
      if (this.watched()) {
        if (f === g.player) g.hud?.showBanner('Not with the 11th Division watching', 1.6);
        return;
      }
      if (!f.spendRei(30)) return this.noRei();
      f.act(new Skill(this, 'truth', 'yf_truth', 0.96, {
        name: [0.24, () => g.callout('裂き狂え「瑠璃色孔雀」', "SAKIKURUE, RURI'IRO KUJAKU", '#1E50A2')],
        split: [0.5, () => this.toRuri()],
      }, { armor: 0.6, mobility: 0.1 }), true);
      return;
    }
    f.act(new Skill(this, 'seal', 'yr_seal', 0.56, { fold: [0.3, () => this.toSealed()] }), true);
  }

  /** G: the hair fix / the thicket */
  toggle(): void {
    if (this.form === 'ruri') {
      this.special(new Skill(this, 'thicket', 'yr_thicket', 0.66, { spread: [0.24, () => this.thicket()] }, { mobility: 0.05 }), 16, 'thicket', 10);
      return;
    }
    this.special(new Skill(this, 'hair', 'ym_hair', 0.86, { fix: [0.4, () => this.hairFix()] }, { mobility: 0.3 }), 4, 'hair', 16);
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

  target(range: number): Fighter | null {
    return this.g.nearestEnemy(this.f, range, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, range);
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

  /** anyone of the 11th Division close enough to see */
  watched(): boolean {
    for (const o of this.g.fighters) if (o !== this.f && !o.dead && ELEVENTH.includes(o.def.id ?? '') && o.pos.distanceTo(this.f.pos) < 40) return true;
    return false;
  }

  // ---------------------------------------------------------------- forms

  private setBlade(model: 'katana' | 'fuji' | 'ruri', stance: typeof YUMICHIKA_STANCE, blade: BladeDef): void {
    const f = this.f;
    f.visual.attach('sword', yumichikaProp(model), 'grip.R');
    f.anim.loco.stance = stance;
    f.def = { ...f.def, stance, blade };
    f.bladeValid = false;
    f.trail?.reset();
    f.trail?.setColor(blade.color, blade.core);
  }

  private toFuji(): void {
    if (this.form === 'fuji') return;
    this.form = 'fuji';
    this.setBlade('fuji', FUJI_STANCE, FAN);
    this.applyStats();
    this.f.aura.flare(1.2, 0.4);
    wisteriaFlash(this.g, this.bladePoint(new THREE.Vector3()));
    this.g.sfx.play('ting', this.f.center(), 0.9);
  }

  private toRuri(): void {
    const { f, g } = this;
    if (this.form === 'ruri') return;
    this.form = 'ruri';
    this.setBlade('ruri', RURI_STANCE, HILT);
    this.applyStats();
    f.aura.flare(1.8, 0.6);
    if (!this.vines || this.vines.done) {
      this.vines = new PeacockVines(g, f, (out) => this.bladePoint(out));
      g.addProjectile(this.vines);
    }
    // the blades split into a mass of vines that writhe out and back
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const to = f.center().add(_v.set(Math.cos(a) * 2.2, 0.6 + Math.random(), Math.sin(a) * 2.2));
      this.vines.lash(to, 0.6);
    }
    g.sfx.play('bankai', f.center(), 0.6);
  }

  private toSealed(): void {
    if (this.form === 'sealed') return;
    this.letGo();
    this.form = 'sealed';
    this.setBlade('katana', YUMICHIKA_STANCE, KATANA);
    this.applyStats();
    this.g.sfx.play('ting', this.f.center(), 0.6);
  }

  private applyStats(): void {
    const f = this.f;
    const form = this.form === 'sealed' ? 1 : this.form === 'fuji' ? 1.05 : 1.2;
    f.power = form * (this.flare ? 1.25 : 1) * (this.rattledT > 0 ? 1.1 : 1);
    f.damageTaken = this.rattledT > 0 ? 1.1 : 1;
    f.aura.target = this.flare ? 1 : this.form === 'ruri' ? 0.3 : 0.1;
  }

  formName(): string {
    if (this.form === 'sealed') return 'Fuji Kujaku (sealed)';
    if (this.form === 'fuji') return 'Fuji Kujaku' + (this.watched() ? ' · watched' : '');
    return "Ruri'iro Kujaku" + (this.snare ? ` · buds ${Math.round(this.snare.fill * 100)}%` : this.petals > 0 ? ` · flowers ${Math.round(this.petals * 100)}%` : '');
  }

  /** the blade's spec (the rattled edge cuts harder) */
  bladeSpec(s: BladeSpec): BladeSpec {
    return s;
  }

  private bladePoint(out: THREE.Vector3): THREE.Vector3 {
    const p = this.f.visual.props.get('sword');
    if (!p) return this.f.center(out);
    p.updateMatrixWorld(true);
    return out.set(0, 0, RURI_ROOT_Z).applyMatrix4(p.matrixWorld);
  }

  // ---------------------------------------------------------------- guards

  private parry(_amount: number, from: Fighter | null, o: DamageOpts): boolean {
    const { f, g } = this;
    if (f.dead || !from) return false;
    // the snared victim's blows tear at the vines
    if (this.snare && from === this.snare.o && !o.quiet) {
      this.snare.shaken++;
      if (this.snare.shaken >= 2) {
        g.hud?.floatText(from.center(), 'TORN FREE', '#9FE3B0', 18);
        this.letGo();
      }
    }
    if (this.catchUntil > g.time && _v.subVectors(from.pos, f.pos).setY(0).normalize().dot(f.forward(_w)) > 0.3 && !o.energy) {
      this.catchUntil = 0;
      // caught between the sickles: the blade is wrenched away
      from.disarmT = Math.max(from.disarmT, from.def.boss ? 0.8 : 2.5);
      from.stopAction();
      from.hitstun = Math.max(from.hitstun, 0.35);
      g.sparks(this.bladePoint(new THREE.Vector3()), f.forward(_v), '#C9C0E6', 14);
      g.sfx.play('crack', f.center(), 1);
      g.hitstop(0.08);
      g.callout('', 'CAUGHT', '#A59ACA');
      f.stopAction();
      this.comboIndex = 1;
      this.chain(1);
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- sealed & Fuji Kidō

  private palmPoint(out: THREE.Vector3): THREE.Vector3 {
    const s = this.f.visual.rig.sockets.get('palm.L');
    if (!s) return this.f.center(out).addScaledVector(this.f.forward(_w), 0.5);
    s.updateWorldMatrix(true, false);
    return s.getWorldPosition(out);
  }

  private aimDir(from: THREE.Vector3, range: number): THREE.Vector3 {
    const t = this.target(range);
    return t ? t.center().sub(from).normalize() : this.f.forward();
  }

  private shakkaho(): void {
    const { f, g } = this;
    const from = this.palmPoint(new THREE.Vector3());
    g.addProjectile(new Shakkaho(f, g, from, this.aimDir(from, 30), { damage: 36, speed: 28, size: 0.3, blast: 1.2, range: 30 }));
    g.callout('破道の三十一「赤火砲」', 'HADŌ #31 — SHAKKAHŌ', '#E3262E');
  }

  private hainawa(): void {
    const { f, g } = this;
    const t = this.target(12);
    g.callout('縛道の四「這縄」', 'BAKUDŌ #4 — HAINAWA', '#F2D04A');
    if (!t) return;
    const dur = t.def.boss ? 0.6 : 1.6;
    t.disarmT = Math.max(t.disarmT, dur);
    t.slow(0.5, dur);
    this.bound = { o: t, until: g.time + dur };
    g.addProjectile(new SajoRope(g, f, t, dur, () => {}));
  }

  /** Daichi Ten'yō: four chunks of ground torn up round him to hover */
  private liftStones(): void {
    const { f, g } = this;
    for (const s of this.stones) s.drop(s.pos.clone().setY(s.pos.y - 6));
    this.stones = [];
    const fw = f.forward();
    for (let i = 0; i < 4; i++) {
      const a = Math.atan2(fw.x, fw.z) + (i - 1.5) * 0.7;
      const x = f.pos.x + Math.sin(a) * 1.6, z = f.pos.z + Math.cos(a) * 1.6;
      const gy = groundAt(g, x, f.pos.y + 1.5, z, 4) ?? f.pos.y;
      const c = new DebrisChunk(g, f, new THREE.Vector3(x, gy - 0.1, z), new THREE.Vector3(x, gy + 1.8 + (i % 2) * 0.5, z), { rise: 0.3, damage: 30 });
      g.addProjectile(c);
      this.stones.push(c);
    }
    g.callout('破道の五十七「大地転踊」', "HADŌ #57 — DAICHI TEN'YŌ", '#4CC46A');
  }

  /** ... and hurled at the target one after another */
  private hurlStones(): void {
    const t = this.target(24);
    this.stones.forEach((s, i) => this.after(i * 0.09, () => {
      if (s.done) return;
      const at = t && !t.dead ? t.center() : this.f.center().addScaledVector(this.f.forward(), 12);
      s.drop(at);
    }));
    this.stones = [];
  }

  /** the hair fix: a breath to put himself right */
  private hairFix(): void {
    const { f, g } = this;
    f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.05);
    f.slowT = 0;
    f.slowK = 0;
    f.blindT = 0;
    f.wetT = 0;
    f.agedT = 0;
    f.agedK = 0;
    f.invertT = 0;
    this.rattledT = 0;
    this.applyStats();
    featherFlutter(g, f.center(_v).setY(f.pos.y + 1.55), 8);
    if (f === g.player) g.hud?.floatText(f.center().setY(f.pos.y + 2), 'Beautiful.', '#F5C83A', 18);
    g.callout('美しい', 'UTSUKUSHII', '#F5C83A');
  }

  // ---------------------------------------------------------------- Ruri'iro Kujaku

  /** a vine lash out to `reach` m: whoever it passes through is struck */
  lash(reach: number, damage: number, heavy: boolean): void {
    const { f, g } = this;
    if (!this.vines) return;
    const t = this.target(reach + 1.5);
    const from = this.bladePoint(new THREE.Vector3());
    const to = t ? t.center() : from.clone().addScaledVector(f.forward(), reach);
    if (to.distanceTo(from) > reach) to.sub(from).setLength(reach).add(from);
    this.vines.lash(to, 0.4, (tip) => this.vineHit(from, tip, damage, heavy));
    g.sfx.play('swing', f.center(), 0.7);
  }

  /** a vine reached out from a to b: everyone near the line takes the lash */
  private vineHit(a: THREE.Vector3, b: THREE.Vector3, damage: number, heavy: boolean): void {
    const { f, g } = this;
    const ab = _v.subVectors(b, a);
    const len2 = Math.max(1e-4, ab.lengthSq());
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      const c = o.center(_w);
      const k = Math.max(0, Math.min(1, ((c.x - a.x) * ab.x + (c.y - a.y) * ab.y + (c.z - a.z) * ab.z) / len2));
      const px = a.x + ab.x * k, py = a.y + ab.y * k, pz = a.z + ab.z * k;
      const cy = Math.max(o.pos.y, Math.min(o.pos.y + o.def.height, py));
      if (Math.hypot(o.pos.x - px, cy - py, o.pos.z - pz) > o.def.radius + 0.35) continue;
      g.damage(o, damage, f, ab.clone().setY(0).normalize(), { knock: heavy ? 9 : 4, heavy, hitstop: heavy ? 0.08 : 0.05 });
      g.sparks(new THREE.Vector3(px, cy, pz), ab.clone().normalize(), '#2E8B57', 6);
    }
  }

  /** RMB: seven vines fanned out in a cone */
  private burst(): void {
    const { f, g } = this;
    if (!this.vines) return;
    const from = this.bladePoint(new THREE.Vector3());
    const t = this.target(8);
    const fw = t ? _w.subVectors(t.pos, f.pos).setY(0).normalize() : f.forward();
    const yaw = Math.atan2(fw.x, fw.z);
    for (let i = 0; i < 7; i++) {
      const a = yaw + (i - 3) * 0.2;
      const to = from.clone().add(_v.set(Math.sin(a) * 6, (Math.random() - 0.4) * 1.2, Math.cos(a) * 6));
      this.vines.lash(to, 0.5, (tip) => this.vineHit(from, tip, 14, false));
    }
    g.sfx.play('swingHeavy', f.center(), 0.9);
  }

  /** Q: the vines go for the target and coil round it */
  private ensnare(): void {
    const { f, g } = this;
    if (!this.vines) return;
    const t = this.target(12);
    if (!t) {
      this.lash(8, 10, false);
      return;
    }
    this.letGo(true);
    this.vines.ensnare(t);
    this.snare = { o: t, fill: 0, shaken: 0, t: 0 };
    t.stopAction();
    t.hitstun = Math.max(t.hitstun, 0.3);
    g.sfx.play('ting', t.center(), 0.8);
    g.hud?.floatText(t.center().setY(t.pos.y + t.def.height + 0.3), 'ENSNARED', '#1E50A2', 18);
    void f;
  }

  private updateSnare(dt: number): void {
    const { f, g } = this;
    const s = this.snare;
    if (!s) return;
    const o = s.o;
    s.t += dt;
    if (o.dead || this.form !== 'ruri' || s.t > 7) {
      this.letGo();
      return;
    }
    // held: rooted, its weapon pinned in the coils
    o.rooted = true;
    o.disarmT = Math.max(o.disarmT, 0.2);
    // it drinks: their reiatsu and blood, faster while they struggle
    const struggle = o.action !== null || o.wish.lengthSq() > 0.01 ? 2 : 1;
    const took = Math.min(o.rei, dt * 14 * struggle);
    o.rei -= took;
    g.drain(o, dt * 10 * struggle, f);
    f.rei = Math.min(f.maxRei, f.rei + took * 0.4);
    s.fill = Math.min(1, s.fill + (dt / 6) * struggle);
    if (this.vines?.snare) this.vines.snare.fill = s.fill;
  }

  /** the vines let go (quick: at once, else they wither) */
  letGo(quick = false): void {
    const s = this.snare;
    if (!s) return;
    if (!s.o.dead) s.o.rooted = false;
    this.snare = null;
    this.vines?.letGo(quick);
  }

  /** E: the buds open and turn the stolen reiatsu on the victim */
  private bloom(): void {
    const { f, g } = this;
    const s = this.snare;
    if (!s || !this.vines) return;
    const o = s.o;
    const dmg = 40 + 300 * s.fill;
    this.vines.bloom();
    this.petals = s.fill;
    s.o.rooted = false;
    this.snare = null;
    g.damage(o, dmg, f, _v.subVectors(o.pos, f.pos).setY(0).normalize().clone(), { knock: 6, heavy: true, unblockable: true, energy: true, hitstop: 0.14, shake: 0.4 });
    g.callout('', 'BLOOM', '#3F6FD1');
  }

  /** R: a bloomed petal, eaten: he heals by what it held */
  private eatPetal(): void {
    const { f, g } = this;
    const heal = 260 * this.petals;
    this.petals = 0;
    f.hp = Math.min(f.maxHp, f.hp + heal);
    const c = f.center(_v).setY(f.pos.y + 1.5);
    for (let i = 0; i < 10; i++) g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: (Math.random() - 0.5) * 2, vy: Math.random() * 1.5, vz: (Math.random() - 0.5) * 2, size: 0.12, sizeEnd: 0.03, life: 0.6, r: 1.2, g: 1.3, b: 1.6, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    if (heal > 0) g.hud?.floatText(c.clone().setY(c.y + 0.4), `+${Math.round(heal)}`, '#9FE3B0', 18);
  }

  /** G: vines over the ground round him; whoever walks in is snagged and drained */
  private thicket(): void {
    const { f, g } = this;
    if (!this.vines) return;
    this.vines.thicket(f.pos.clone(), 5, 6);
    const snagged = new Set<number>();
    for (let i = 1; i <= 30; i++)
      this.after(i * 0.2, () => {
        if (!this.vines || f.dead) return;
        for (const o of g.enemiesOf(f)) {
          if (o.dead || !o.grounded || !this.vines.inThicket(o.pos)) continue;
          g.drain(o, 4, f);
          o.rei = Math.max(0, o.rei - 3);
          if (!snagged.has(o.id)) {
            snagged.add(o.id);
            o.slow(0.6, 1.2);
            if (!o.def.boss) {
              o.stopAction();
              o.hitstun = Math.max(o.hitstun, 0.6);
            }
          }
        }
      });
    g.callout('', 'THICKET', '#2E8B57');
  }

  // ---------------------------------------------------------------- AI & HUD

  ai(): KitAI {
    const { f, g } = this;
    const sealed = () => this.form === 'sealed', fuji = () => this.form === 'fuji', ruri = () => this.form === 'ruri';
    const tgt = () => g.nearestEnemy(f, 40);
    const swinging = () => {
      const t = tgt();
      return !!t && t.action !== null && t.action.name !== 'dash' && t.pos.distanceTo(f.pos) < 3.4;
    };
    return {
      reach: this.form === 'ruri' ? 4.5 : 2.0,
      chain: 4,
      // Fuji Kujaku in the open; the true Shikai only when it is going badly and nobody is watching
      releaseAt: [0.75, 0.45],
      ranged: ruri,
      opener: () => this.toggle(),
      moves: [
        { name: 'flurry', use: () => this.heavy(), min: 0, max: 2.4, weight: 1.1, cd: 5, when: sealed },
        { name: 'flurry f', use: () => this.skill3(), min: 0, max: 2.4, weight: 1, cd: 5, when: fuji },
        { name: 'lift', use: () => this.skill1(), min: 4, max: 18, weight: 1.1, cd: 7, when: () => !ruri() },
        { name: 'shakka', use: () => this.skill2(), min: 4, max: 24, weight: 0.9, cd: 4, when: sealed },
        { name: 'hainawa', use: () => this.skill3(), min: 3, max: 11, weight: 0.8, cd: 8, when: sealed },
        { name: 'spin', use: () => this.heavy(), min: 0, max: 2.6, weight: 1.1, cd: 4.5, when: fuji },
        { name: 'catch', use: () => this.skill2(), min: 0, max: 3, weight: 1.2, cd: 3, when: () => fuji() && swinging() },
        { name: 'hair', use: () => this.toggle(), min: 5, max: 40, weight: 0.5, cd: 20, when: () => !ruri() && (f.slowT > 0 || f.blindT > 0 || this.rattledT > 0 || f.hp < f.maxHp * 0.85) },
        { name: 'snare', use: () => this.skill1(), min: 2, max: 11, weight: 3, cd: 6, when: () => ruri() && !this.snare },
        { name: 'bloom', use: () => this.skill2(), min: 0, max: 20, weight: 8, cd: 1, when: () => ruri() && !!this.snare && (this.snare.fill >= 0.7 || this.snare.shaken >= 1 || this.snare.t > 6) },
        { name: 'petal', use: () => this.skill3(), min: 0, max: 40, weight: 5, cd: 2, when: () => ruri() && this.petals > 0.2 && f.hp < f.maxHp * 0.75 },
        { name: 'burst', use: () => this.heavy(), min: 1.5, max: 6, weight: 1, cd: 4, when: () => ruri() && !this.snare },
        { name: 'thicket', use: () => this.toggle(), min: 0, max: 5, weight: 0.8, cd: 10, when: () => ruri() && !this.snare },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    const flare = { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare };
    const hairFix = { key: 'G', name: 'Hair fix', kanji: '美', cost: 4, cd: cd.hair, cdMax: 16, tint: '#F5C83A' };
    if (this.form === 'sealed') {
      return [
        { key: 'LMB', name: 'Kenjutsu', kanji: '剣' },
        { key: 'RMB', name: 'Beautiful Swordfight', kanji: '美剣', cost: 12, cd: cd.flurry, cdMax: 5 },
        { key: 'Q', name: "Daichi Ten'yō", kanji: '大地転踊', cost: 16, cd: cd.lift, cdMax: 7 },
        { key: 'E', name: 'Shakkahō', kanji: '赤火砲', cost: 14, cd: cd.shakka, cdMax: 3.5, tint: '#E3262E' },
        { key: 'R', name: 'Hainawa', kanji: '這縄', cost: 10, cd: cd.hainawa, cdMax: 7, tint: '#F2D04A' },
        { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
        flare,
        { key: 'F', name: 'Sake, Fuji Kujaku', kanji: '藤孔雀', cost: 16, tint: '#A59ACA' },
        hairFix,
      ];
    }
    if (this.form === 'fuji') {
      const watched = this.watched();
      return [
        { key: 'LMB', name: 'Fan sickles', kanji: '藤' },
        { key: 'RMB', name: 'Fan spin', kanji: '旋', cost: 14, cd: cd.spin, cdMax: 4.5 },
        { key: 'Q', name: "Daichi Ten'yō", kanji: '大地転踊', cost: 16, cd: cd.lift, cdMax: 7 },
        { key: 'E', name: 'Blade catch', kanji: '捕', cost: 6, cd: cd.catch, cdMax: 2.5 },
        { key: 'R', name: 'Beautiful Swordfight', kanji: '美剣', cost: 12, cd: cd.flurry, cdMax: 5 },
        { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
        flare,
        { key: 'F', name: watched ? 'Sakikurue (watched)' : 'Sakikurue', kanji: '瑠璃色', cost: 30, cd: watched ? 1 : 0, cdMax: 1, tint: '#1E50A2' },
        hairFix,
      ];
    }
    return [
      { key: 'LMB', name: 'Vine lash', kanji: '蔓' },
      { key: 'RMB', name: 'Vine burst', kanji: '散', cost: 14, cd: cd.burst, cdMax: 4 },
      { key: 'Q', name: this.snare ? `Drinking · ${Math.round(this.snare.fill * 100)}%` : 'Ensnare', kanji: '絡', cost: 18, cd: cd.snare, cdMax: 6, active: !!this.snare, timer: this.snare ? this.snare.fill : undefined, tint: '#1E50A2' },
      { key: 'E', name: 'Bloom', kanji: '咲', cost: 10, cd: cd.bloom, cdMax: 2, active: !!this.snare, tint: '#3F6FD1' },
      { key: 'R', name: `Petal${this.petals > 0 ? ` (${Math.round(this.petals * 100)}%)` : ''}`, kanji: '花弁', cd: cd.petal, cdMax: 3, active: this.petals > 0, tint: '#EAF0FF' },
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
      flare,
      { key: 'F', name: 'Seal', kanji: '封' },
      { key: 'G', name: 'Thicket', kanji: '茂', cost: 16, cd: cd.thicket, cdMax: 10, tint: '#2E8B57' },
    ];
  }
}
