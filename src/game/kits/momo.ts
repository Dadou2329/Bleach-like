// Momo Hinamori's kit (docs/kits/momo.md). The Kidō trap-layer: fragile up close, frightening once she has had time.
// Sealed: the thrust, two cuts, the rising cut (LMB); Hadō #31 Shakkahō (RMB); Hadō #12 Fushibi — a web of fine
// threads strung round the target's ground, nearly invisible to anyone but her (Q); Bakudō #37 Tsuriboshi under her
// feet with a fireball beneath it, a launch pad (E); Bakudō #26 Kyokkō — the light bent round her, the enemy left
// fighting where she was, the next blow from hiding harder (R); "Hajike, Tobiume" (F); Hakufuku (G).
// Shikai Tobiume: the same string, the last cut flicking a fireball off the prongs (LMB); the fireball (RMB); Fushibi
// (Q); the volley, split across two targets (E); the ignition — a fireball to every web she has laid (R); the seal
// (F); Kaidō (G).
// Rules: all her Kidō is instant; any of her fire bursting by a Fushibi thread sets the whole web off, one strand after
// another; Tsuriboshi catches her when she is knocked flying; a fragile body; grief when one she loves falls.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { Game } from '../game';
import { KATANA_BASE_Z, KATANA_TIP_Z, TOBIUME_BASE_Z, TOBIUME_TIP_Z, momoAsset, momoProp } from '../../chars/momo';
import { MOMO_CHAIN, MOMO_STANCE, TOBIUME_CLIPS } from '../../chars/momoClips';
import { registerReactions } from '../../chars/reactionClips';
import { FushibiNet, KyokkoVeil, MOMO_RED, StarNet, TOBIUME_FIRE, hakufukuBloom, snareFlash } from '../../vfx/tobiume';
import { TsuriboshiNet, kaidoGlow } from '../../vfx/wabisuke';
import { TEX_GLOW, TEX_STREAK } from '../../vfx/sprites';
import { Shakkaho, type ShakkahoOpts } from '../projectiles/shakkaho';
import type { AbilityInfo } from '../../ui/hud';
import type { Kit, KitAI } from './kit';

type BladeDef = NonNullable<FighterDef['blade']>;
type Form = 'sealed' | 'shikai';

const KATANA: BladeDef = { prop: 'sword', base: [0, 0, KATANA_BASE_Z], tip: [0, 0, KATANA_TIP_Z], color: '#F2A2A0', core: '#FFF1EE' };
const TOBIUME: BladeDef = { prop: 'sword', base: [0, 0, TOBIUME_BASE_Z], tip: [0, 0, TOBIUME_TIP_Z], color: '#FFB33E', core: '#FFF3B0' };
const SPEED: FighterDef['speed'] = { run: 10.4, sprint: 23, jump: 12, dash: 16, dashTime: 0.12 };
/** those whose fall breaks her (her captain, her childhood friend) */
const DEAR = ['aizen', 'hitsugaya', 'shinji'];
const UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

const sealedProps = () => [
  { key: 'sword', model: momoProp('katana'), socket: 'grip.R' },
  { key: 'saya', model: momoProp('saya'), socket: 'hip.L' },
];

export const MOMO_DEF: FighterDef = {
  id: 'momo',
  name: 'Momo Hinamori',
  title: 'Lieutenant, 5th Division',
  build: () => ({ asset: momoAsset(), props: sealedProps() }),
  stance: MOMO_STANCE,
  clips: TOBIUME_CLIPS,
  aura: MOMO_RED,
  blade: KATANA,
  hp: 950,
  rei: 190,
  speed: { ...SPEED },
  radius: 0.33,
  height: 1.51,
};

// ------------------------------------------------------------------ helpers

function lungeTo(f: Fighter, stop: number, at: number, max = 24): number {
  const tgt = f.faceTarget;
  if (!tgt) return 0;
  const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
  if (d <= stop + 0.25 || d > 7) return 0;
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

/** blade windows of each cut (clip time) */
const MOVES: Record<string, { at: [number, number][]; spec: BladeSpec }> = {
  mo_s1: { at: [[0.11, 0.2]], spec: spec(15, 6, 300, { reach: 0.14 }) },
  mo_s2: { at: [[0.1, 0.21]], spec: spec(15, 7, 320, { reach: 0.1 }) },
  mo_s3: { at: [[0.1, 0.21]], spec: spec(15, 7, 320, { reach: 0.1 }) },
  mo_s4: { at: [[0.1, 0.22]], spec: spec(19, 3, 360, { launch: 9, reach: 0.1, hitstop: 0.07, shake: 0.2 }) },
};

/** Marker for the skills a string can cancel into. */
abstract class SkillAction extends FighterAction {}

/** One cut of the string: its blade window, the step in; released, the last one flicks a fireball off the prongs. */
class MoveAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private stopAt = 0;
  private opened = false;
  queued = false;
  constructor(readonly kit: MomoKit, readonly clip: string, readonly index: number) {
    super();
    this.name = clip;
    this.mobility = 0.12;
    this.airGravity = 0.12;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    f.bladeHits.clear();
    this.stopAt = lungeTo(f, 1.2, MOVES[this.clip].at[0][0]);
    f.anim.play(this.clip, { onEvent: (n) => n === 'step' && g.sfx.play('step', f.pos, 0.45) });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    this.stopAt = lungeStop(f, this.stopAt);
    const [a, b] = MOVES[this.clip].at[0];
    if (!this.opened && t >= a - 0.03) {
      this.opened = true;
      f.bladeHits.clear();
      f.bladeSpec = MOVES[this.clip].spec;
      g.sfx.play('swing', f.center(), 0.9);
      if (this.index === 3 && this.kit.form === 'shikai') this.kit.flick();
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
    const w = MOVES[this.clip].at[0][1];
    if (next.name === 'dash') return this.t >= w;
    return next instanceof SkillAction && this.t >= w + 0.03;
  }
}

/** A skill: plays its clip, runs its events, ends with the clip (or at `endAt`). */
class Skill extends SkillAction {
  private fired = new Set<string>();
  private cancelAt: number;
  private hold: boolean;
  constructor(readonly kit: MomoKit, readonly name: string, readonly clip: string, readonly endAt: number, readonly events: Record<string, [number, () => void]>, opts: { armor?: number; mobility?: number; cancelAt?: number; hold?: boolean } = {}) {
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

/** G (Shikai): Kaidō — the hands over the wound; it heals while she holds still, a blow ends it */
class KaidoAction extends SkillAction {
  readonly name = 'kaido';
  private fx = 0;
  constructor(readonly kit: MomoKit) {
    super();
    this.mobility = 0;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('mo_kaido', { hold: true });
    g.callout('回道', 'KAIDŌ', '#6BE08A');
    g.sfx.play('heal', f.center(), 0.5);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    f.rei -= dt * 8;
    f.hp = Math.min(f.maxHp, f.hp + dt * 20);
    this.fx -= dt;
    if (this.fx <= 0) {
      this.fx = 0.05;
      kaidoGlow(g, f.center(_v).add(f.forward(_w).multiplyScalar(0.22)).setY(f.pos.y + 0.95), 0.9);
    }
    if (f.rei <= 0 || f.hp >= f.maxHp) this.done = true;
  }
  override end(f: Fighter): void {
    f.anim.stopAll(0.25);
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' || next instanceof SkillAction;
  }
}

// ------------------------------------------------------------------ the kit

interface Sleeper {
  o: Fighter;
  until: number;
  since: number;
}

export class MomoKit implements Kit {
  form: Form = 'sealed';
  comboIndex = 0;
  private lastSwingEnd = 0;
  flare = false;
  /** her Fushibi webs (two at most) */
  readonly nets: FushibiNet[] = [];
  /** Kyokkō: hidden (s left) */
  hiddenT = 0;
  private veil: KyokkoVeil | null = null;
  /** the first blow out of hiding hits harder (s left, or until it lands) */
  ambushT = 0;
  private ambushDealt = 0;
  /** grief: one she loves has fallen (s left) */
  griefT = 0;
  private mourned = new Set<number>();
  private sleepers = new Map<number, Sleeper>();
  private timers: { t: number; fn: () => void }[] = [];
  private hudT = 0;
  readonly cd = { shakka: 0, fire: 0, net: 0, launch: 0, kyokko: 0, haku: 0, volley: 0, ignite: 0, kaido: 0, catch: 0 };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.onHurt = () => {
      // a blow ends Kaidō and tears the bent light away
      if (f.action instanceof KaidoAction) f.stopAction();
      if (this.hiddenT > 0) this.reveal(false);
      this.tsuriboshi();
    };
    // a small, light body: knocked further
    f.knockTaken = 1.2;
    this.applyStats();
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    for (let i = this.timers.length - 1; i >= 0; i--) {
      const tm = this.timers[i];
      tm.t -= dt;
      if (tm.t > 0) continue;
      this.timers.splice(i, 1);
      tm.fn();
    }
    for (let i = this.nets.length - 1; i >= 0; i--) if (this.nets[i].done) this.nets.splice(i, 1);
    if (this.hiddenT > 0 && ((this.hiddenT -= dt) <= 0 || f.dead)) this.reveal(false);
    if (this.ambushT > 0 && ((this.ambushT -= dt) <= 0 || f.stats.damageDealt > this.ambushDealt + 0.01)) {
      this.ambushT = 0;
      this.applyStats();
    }
    this.wake();
    this.grieve(dt);
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
    if (cur instanceof MoveAction) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastSwingEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const idx = i % MOMO_CHAIN.length;
    this.comboIndex = idx + 1;
    this.lastSwingEnd = this.g.time + 0.8;
    if (this.f.act(new MoveAction(this, MOMO_CHAIN[idx], idx), true)) this.outOfHiding();
  }

  /** RMB: Shakkahō / the fireball */
  heavy(): void {
    if (this.form === 'sealed') this.special(new Skill(this, 'shakka', 'mo_palm', 0.46, { cast: [0.13, () => this.shakkaho()] }), 12, 'shakka', 2.2);
    else this.special(new Skill(this, 'fire', 'mo_fire', 0.5, { fire: [0.16, () => this.fireball()] }, { mobility: 0.25 }), 10, 'fire', 1.6);
  }

  /** Q: Fushibi (quiet: it does not lift Kyokkō) */
  skill1(): void {
    this.special(new Skill(this, 'fushibi', 'mo_web', 0.7, { cast: [0.36, () => this.fushibi()] }, { mobility: 0.15 }), 16, 'net', 6, true);
  }

  /** E: the Tsuriboshi launch / the volley */
  skill2(): void {
    if (this.form === 'sealed') {
      this.special(new Skill(this, 'launch', 'mo_launch', 0.6, { net: [0.1, () => this.starNet()], blast: [0.22, () => this.launchBlast()] }, { mobility: 0.3, armor: 0.3 }), 14, 'launch', 7);
      return;
    }
    this.special(new Skill(this, 'volley', 'mo_volley', 0.62, { fire: [0.16, () => this.volley()] }, { mobility: 0.2 }), 20, 'volley', 5);
  }

  /** R: Kyokkō / the ignition */
  skill3(): void {
    if (this.form === 'sealed') {
      if (this.hiddenT > 0) return;
      this.special(new Skill(this, 'kyokko', 'mo_veil', 0.5, { cast: [0.18, () => this.kyokko()] }, { mobility: 0.2 }), 14, 'kyokko', 12, true);
      return;
    }
    if (!this.nets.some((n) => !n.alight)) {
      if (this.f === this.g.player) this.g.hud?.showBanner('No web laid', 1);
      return;
    }
    this.special(new Skill(this, 'ignite', 'mo_fire', 0.5, { fire: [0.16, () => this.igniteAll()] }, { mobility: 0.25 }), 8, 'ignite', 2.5);
  }

  /** F: "Hajike, Tobiume" / the seal */
  release(): void {
    const { f, g } = this;
    if (f.busy || f.sealT > 0) return;
    if (this.form === 'sealed') {
      if (!f.spendRei(18)) return this.noRei();
      f.act(new Skill(this, 'release', 'mo_release', 0.86, {
        name: [0.2, () => g.callout('弾け「飛梅」', 'HAJIKE, TOBIUME', '#FFB33E')],
        snap: [0.44, () => this.toShikai()],
      }, { armor: 0.5, mobility: 0.1 }), true);
      this.outOfHiding();
      return;
    }
    f.act(new Skill(this, 'seal', 'mo_veil', 0.5, { cast: [0.18, () => this.toSealed()] }), true);
  }

  /** G: Hakufuku / Kaidō */
  toggle(): void {
    if (this.form === 'sealed') {
      this.special(new Skill(this, 'hakufuku', 'mo_palm', 0.46, { cast: [0.13, () => this.hakufuku()] }), 16, 'haku', 12);
      return;
    }
    if (this.f.action instanceof KaidoAction) {
      this.f.stopAction();
      return;
    }
    this.special(new KaidoAction(this), 4, 'kaido', 1);
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

  /** up to n targets, nearest first (Kidō mastery: the volley splits across two) */
  private targets(range: number, n: number): Fighter[] {
    const { f, g } = this;
    const first = this.target(range);
    if (!first) return [];
    const rest = g.enemiesOf(f).filter((o) => o !== first && !o.dead && o.pos.distanceTo(f.pos) <= range).sort((a, b) => a.pos.distanceTo(f.pos) - b.pos.distanceTo(f.pos));
    return [first, ...rest].slice(0, n);
  }

  private special(a: FighterAction, cost: number, cdKey: keyof typeof this.cd, cd: number, quiet = false): boolean {
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
    if (!quiet) this.outOfHiding();
    return true;
  }

  // ---------------------------------------------------------------- forms

  private setBlade(model: 'katana' | 'tobiume', blade: BladeDef): void {
    const f = this.f;
    f.visual.attach('sword', momoProp(model), 'grip.R');
    f.def = { ...f.def, blade };
    f.bladeValid = false;
    f.trail?.reset();
    f.trail?.setColor(blade.color, blade.core);
    // a new prop is visible: keep it hidden under Kyokkō
    if (this.hiddenT > 0) this.hide(true);
  }

  private toShikai(): void {
    const { f, g } = this;
    if (this.form === 'shikai') return;
    this.form = 'shikai';
    this.setBlade('tobiume', TOBIUME);
    this.applyStats();
    f.aura.flare(1.5, 0.5);
    // the blade straightens, the prongs spring out in sparks
    const p = f.visual.props.get('sword');
    if (p) {
      p.updateMatrixWorld(true);
      for (let i = 0; i <= 8; i++) {
        const at = _v.set(0, 0, TOBIUME_BASE_Z + (TOBIUME_TIP_Z - TOBIUME_BASE_Z) * (i / 8)).applyMatrix4(p.matrixWorld);
        for (let k = 0; k < 3; k++)
          g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, vx: (Math.random() - 0.5) * 5, vy: Math.random() * 4, vz: (Math.random() - 0.5) * 5, size: 0.09, sizeEnd: 0.02, life: 0.5 + Math.random() * 0.3, r: 2, g: 1.4, b: 0.5, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2.5, gravity: -8 });
      }
    }
    g.sfx.play('cry', f.center(), 0.8);
    g.sfx.play('flare', f.center(), 0.6);
  }

  private toSealed(): void {
    if (this.form === 'sealed') return;
    this.form = 'sealed';
    this.setBlade('katana', KATANA);
    this.applyStats();
    this.g.sfx.play('ting', this.f.center(), 0.6);
  }

  private applyStats(): void {
    const f = this.f;
    const form = this.form === 'sealed' ? 1 : 1.4;
    f.power = form * (this.flare ? 1.25 : 1) * (this.ambushT > 0 ? 1.6 : 1) * (this.griefT > 0 ? 1.3 : 1);
    // grief: she stops guarding herself
    f.damageTaken = this.griefT > 0 ? 1.15 : 1;
    f.aura.target = this.flare ? 1 : this.griefT > 0 ? 0.6 : this.form === 'shikai' ? 0.2 : 0.08;
  }

  formName(): string {
    const nets = this.nets.length ? ` · ${this.nets.length} web${this.nets.length > 1 ? 's' : ''}` : '';
    const hid = this.hiddenT > 0 ? ' · hidden' : '';
    return (this.form === 'sealed' ? 'Tobiume (sealed)' : 'Tobiume') + hid + nets + (this.griefT > 0 ? ' · grief' : '');
  }

  private palmPoint(out: THREE.Vector3): THREE.Vector3 {
    const s = this.f.visual.rig.sockets.get('palm.L');
    if (!s) return this.f.center(out).addScaledVector(this.f.forward(_w), 0.5);
    s.updateWorldMatrix(true, false);
    return s.getWorldPosition(out);
  }

  /** the blade's point (released, a little short of it: the fire leaves from between the prongs) */
  private tipPoint(out: THREE.Vector3): THREE.Vector3 {
    const p = this.f.visual.props.get('sword');
    if (!p || this.f.disarmT > 0) return this.palmPoint(out);
    p.updateMatrixWorld(true);
    return out.set(0, 0, this.form === 'shikai' ? TOBIUME_TIP_Z * 0.92 : KATANA_TIP_Z).applyMatrix4(p.matrixWorld);
  }

  /** where to send fire at a fighter: its head (the weak point) or its chest */
  private aimAt(o: Fighter, head: boolean): THREE.Vector3 {
    return head ? o.center().setY(o.pos.y + o.def.height * 0.82) : o.center();
  }

  // ---------------------------------------------------------------- Kyokkō

  private hide(on: boolean): void {
    const f = this.f;
    f.visual.object.visible = !on;
    f.aura.group.visible = !on;
    // Shunpo leaves no afterimage while the light bends round her
    f.ghosts.group.visible = !on;
    if (f.trail) f.trail.mesh.visible = !on;
  }

  /** R (sealed): bent light — she fades from sight; whoever fights her keeps fighting where she was */
  private kyokko(): void {
    const { f, g } = this;
    this.hiddenT = 6;
    f.lure = f.pos.clone();
    this.hide(true);
    this.veil?.lift();
    this.veil = new KyokkoVeil(g, f);
    g.addProjectile(this.veil);
    g.addRing(f.center(), 1.4, '#BCD4FF', 0.35);
    g.callout('縛道の二十六「曲光」', 'BAKUDŌ #26 — KYOKKŌ', '#BCD4FF');
  }

  /** the light unbends: an attack out of hiding hits harder until it lands */
  private reveal(attack: boolean): void {
    const f = this.f;
    this.hiddenT = 0;
    this.hide(false);
    f.lure = null;
    this.veil?.lift();
    this.veil = null;
    if (attack) {
      this.ambushT = 1.2;
      this.ambushDealt = f.stats.damageDealt;
      this.applyStats();
      this.g.addRing(f.center(), 1.2, '#BCD4FF', 0.25);
    }
  }

  private outOfHiding(): void {
    if (this.hiddenT > 0) this.reveal(true);
  }

  // ---------------------------------------------------------------- fire

  /** her fire: Tobiume's colours once released; every burst sets off a Fushibi thread it touches */
  private fireOpts(o: ShakkahoOpts, tobiume = this.form === 'shikai'): ShakkahoOpts {
    return { ...o, palette: tobiume ? TOBIUME_FIRE : o.palette, onBurst: (at) => this.igniteAt(at) };
  }

  igniteAt(at: THREE.Vector3): void {
    for (const n of this.nets) n.ignite(at);
  }

  /** RMB (sealed): Hadō #31 Shakkahō from the palm */
  private shakkaho(): void {
    const { f, g } = this;
    const from = this.palmPoint(new THREE.Vector3());
    const t = this.target(30);
    const dir = t ? this.aimAt(t, false).sub(from) : f.forward();
    g.addProjectile(new Shakkaho(f, g, from, dir, this.fireOpts({ damage: 36, speed: 28, size: 0.3, blast: 1.2, range: 30 }, false)));
    g.callout('破道の三十一「赤火砲」', 'HADŌ #31 — SHAKKAHŌ', '#D3242C');
  }

  /** RMB (Shikai): the fireball off the blade, aimed at the head, with the seagull's cry */
  private fireball(): void {
    const { f, g } = this;
    const from = this.tipPoint(new THREE.Vector3());
    const t = this.target(40);
    const dir = t ? this.aimAt(t, true).sub(from) : f.forward().setY(0.02);
    g.addProjectile(new Shakkaho(f, g, from, dir, this.fireOpts({ damage: 48, speed: 26, size: 0.42, blast: 1.6, range: 40 })));
    g.sfx.play('cry', from, 1);
  }

  /** the last cut of the released string flicks a small fireball off the prongs */
  flick(): void {
    const { f, g } = this;
    const from = this.tipPoint(new THREE.Vector3());
    const t = this.target(16);
    const dir = t ? this.aimAt(t, false).sub(from) : f.forward().setY(0.15);
    g.addProjectile(new Shakkaho(f, g, from, dir, this.fireOpts({ damage: 18, speed: 26, size: 0.22, blast: 0.9, range: 16 })));
  }

  /**
   * E (Shikai): five fireballs. At a target they fan out round it and burst as they reach it, so the blasts land
   * all round it; with a second enemy near, two go for that one; with nobody in sight they fan 40° ahead.
   */
  private volley(): void {
    const { f, g } = this;
    const from = this.tipPoint(new THREE.Vector3());
    const ts = this.targets(30, 2);
    const shots: { dir: THREE.Vector3; range: number }[] = [];
    if (!ts[0]) {
      const fw = f.forward().setY(0.05).normalize();
      for (let i = 0; i < 5; i++) shots.push({ dir: fw.clone().applyAxisAngle(UP, THREE.MathUtils.degToRad((i - 2) * 10)), range: 34 });
    } else {
      for (let i = 0; i < 5; i++) {
        const o = ts[1] && i % 2 === 1 ? ts[1] : ts[0];
        const at = this.aimAt(o, false);
        const side = _v.subVectors(at, from).setY(0).normalize();
        side.set(side.z, 0, -side.x);
        const k = ts[1] ? (i === 1 ? -0.5 : i === 3 ? 0.5 : (i / 2 - 1) * 0.7) : (i - 2) * 0.7;
        at.addScaledVector(side, k).setY(at.y + (i % 2) * 0.3);
        shots.push({ dir: at.clone().sub(from), range: at.distanceTo(from) + 0.3 });
      }
    }
    shots.forEach((sh, i) => this.after(i * 0.035, () => g.addProjectile(new Shakkaho(f, g, from.clone(), sh.dir, this.fireOpts({ damage: 24, speed: 26, size: 0.3, blast: 1.1, range: sh.range })))));
    g.sfx.play('cry', from, 1.1);
  }

  /** R (Shikai): a fireball to every web she has laid, each to the nearest thread-post in the air */
  private igniteAll(): void {
    const { f, g } = this;
    const from = this.tipPoint(new THREE.Vector3());
    let sent = 0;
    for (const n of this.nets) {
      if (n.alight || n.done) continue;
      const to = n.aimPoint(from);
      g.addProjectile(new Shakkaho(f, g, from.clone(), to.clone().sub(from), this.fireOpts({ damage: 24, speed: 30, size: 0.28, blast: 1, range: Math.max(0.5, to.distanceTo(from) - 0.2) })));
      sent++;
    }
    if (sent) g.sfx.play('cry', from, 0.9);
  }

  // ---------------------------------------------------------------- Fushibi

  /** Q: the web strung round the target's ground (≤ 18 m ahead) — or round her when it is already on top of her */
  private fushibi(): void {
    const { f, g } = this;
    const t = this.target(18);
    const close = !!t && t.pos.distanceTo(f.pos) < 3.5;
    const center = t && !close ? t.pos.clone() : f.pos.clone().addScaledVector(f.forward(_v), close ? 0.8 : 1.5);
    // two webs at most: the oldest one comes apart
    while (this.nets.length >= 2) {
      const old = this.nets.shift()!;
      if (!old.alight) old.done = true;
    }
    const net = new FushibiNet(g, f, center, 2.4, 20, (o) => this.snared(o), f === g.player);
    g.addProjectile(net);
    this.nets.push(net);
    g.callout('破道の十二「伏火」', 'HADŌ #12 — FUSHIBI', '#FF8A50');
  }

  /** a thread caught someone: rooted a moment, slowed after */
  private snared(o: Fighter): void {
    const { g } = this;
    snareFlash(g, o);
    o.slow(0.55, 2.2);
    if (!o.def.boss) {
      o.stopAction();
      o.rooted = true;
      this.after(1, () => {
        o.rooted = false;
      });
    }
    g.sfx.play('ting', o.center(), 0.6);
    g.hud?.floatText(o.center().setY(o.pos.y + o.def.height + 0.3), 'SNARED', '#FF8A50', 16);
  }

  /** someone stands in one of her webs (for the AI's ignition) */
  targetInNet(): boolean {
    const t = this.g.nearestEnemy(this.f, 45);
    if (!t) return false;
    const c = t.center(_v);
    return this.nets.some((n) => !n.alight && !n.done && n.nearest(c).d < 1.4);
  }

  // ---------------------------------------------------------------- Tsuriboshi

  /** E (sealed): the star net laid flat under her */
  private starNet(): void {
    const { f, g } = this;
    g.addProjectile(new StarNet(g, f.pos.clone()));
    g.sfx.play('ting', f.pos, 1);
    g.callout('縛道の三十七「吊星」', 'BAKUDŌ #37 — TSURIBOSHI', '#4FA8FF');
  }

  /** ... and a fireball beneath it: the blast round where she stood, she flung high off the net */
  private launchBlast(): void {
    const { f, g } = this;
    const at = f.pos.clone().setY(f.pos.y + 0.35);
    g.addProjectile(new Shakkaho(f, g, at, new THREE.Vector3(0, -1, 0), this.fireOpts({ damage: 40, speed: 30, size: 0.4, blast: 2.4, range: 6 })));
    f.body.vel.y = 19;
    f.body.grounded = false;
    f.hovering = false;
    f.invuln = Math.max(f.invuln, 0.3);
    f.push.multiplyScalar(0.3);
  }

  /** passive: Bakudō #37 Tsuriboshi catches her when she is knocked flying (12 s) */
  private tsuriboshi(): void {
    const { f, g } = this;
    if (this.cd.catch > 0 || f.dead) return;
    const flung = Math.hypot(f.push.x, f.push.z) > 10 || f.body.vel.y > 7;
    if (!flung) return;
    this.cd.catch = 12;
    g.addProjectile(new TsuriboshiNet(g, f, _v.set(-f.push.x, 0, -f.push.z)));
    f.push.set(0, 0, 0);
    f.body.vel.y = Math.min(f.body.vel.y, 1.5);
    f.hitstun = Math.min(f.hitstun, 0.15);
    g.callout('縛道の三十七「吊星」', 'BAKUDŌ #37 — TSURIBOSHI', '#4FA8FF');
  }

  // ---------------------------------------------------------------- Hakufuku

  /** G (sealed): purple blossoms in the face (3 m ahead): the senses blur, then sleep */
  private hakufuku(): void {
    const { f, g } = this;
    const from = this.palmPoint(new THREE.Vector3());
    const fw = f.forward();
    hakufukuBloom(g, from, fw);
    g.callout('白伏', 'HAKUFUKU', '#9B6BD0');
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      const d = _v.subVectors(o.pos, f.pos).setY(0);
      const dist = d.length();
      if (dist > 3 + o.def.radius) continue;
      if (dist > 0.6 && d.normalize().dot(fw) < 0.35) continue;
      this.dull(o);
    }
  }

  private dull(o: Fighter): void {
    const g = this.g;
    const blind = o.def.boss ? 0.8 : 2;
    o.blindT = Math.max(o.blindT, blind);
    o.slow(0.4, blind);
    g.hud?.floatText(o.center().setY(o.pos.y + o.def.height + 0.3), 'SENSES BLURRED', '#9B6BD0', 16);
    this.after(blind, () => this.sleep(o, o.def.boss ? 0.6 : 1.5));
  }

  private sleep(o: Fighter, s: number): void {
    const g = this.g;
    if (o.dead) return;
    o.stopAction();
    o.hitstun = Math.max(o.hitstun, s);
    o.blindT = Math.max(o.blindT, s);
    if (!o.def.stance.quad) {
      registerReactions(o.anim);
      o.anim.play('slumber', { hold: true });
    }
    this.sleepers.set(o.id, { o, until: g.time + s, since: g.time });
    const head = o.center().setY(o.pos.y + o.def.height * 0.9);
    for (let i = 0; i < 8; i++)
      g.engine.glow.spawn({ x: head.x, y: head.y, z: head.z, vx: (Math.random() - 0.5) * 1.2, vy: 0.4 + Math.random() * 0.6, vz: (Math.random() - 0.5) * 1.2, size: 0.12, sizeEnd: 0.3, life: 1, r: 1, g: 0.7, b: 1.4, alpha: 0.6, alphaEnd: 0, tex: TEX_GLOW, drag: 1.5 });
    g.hud?.floatText(head.setY(head.y + 0.5), 'ASLEEP', '#9B6BD0', 18);
  }

  /** a sleeper wakes when its time is up, or at the first blow */
  private wake(): void {
    const g = this.g;
    for (const [id, s] of this.sleepers) {
      const o = s.o;
      const hit = o.lastHurt.at > s.since + 0.02;
      if (!o.dead && g.time < s.until && !hit) continue;
      this.sleepers.delete(id);
      if (o.dead) continue;
      if (hit) {
        o.hitstun = Math.min(o.hitstun, 0.3);
        o.blindT = 0;
      }
      if (o.anim.isPlaying('slumber')) o.anim.stopAll(0.35);
    }
  }

  // ---------------------------------------------------------------- grief

  /** one she loves falls on her side: she stops holding back (and stops guarding) */
  private grieve(dt: number): void {
    const { f, g } = this;
    if (this.griefT > 0 && (this.griefT -= dt) <= 0) this.applyStats();
    if (f.dead) return;
    for (const o of g.fighters) {
      if (!o.dead || o === f || o.team !== f.team || this.mourned.has(o.id) || !DEAR.includes(o.def.id ?? '')) continue;
      this.mourned.add(o.id);
      this.griefT = 14;
      this.applyStats();
      f.aura.flare(1.8, 0.6);
      g.hud?.floatText(f.center().setY(f.pos.y + f.def.height + 0.3), o.def.id === 'hitsugaya' ? 'SHIRO-CHAN!' : 'CAPTAIN!', '#E53935', 20);
    }
  }

  // ---------------------------------------------------------------- AI & HUD

  ai(): KitAI {
    const { f, g } = this;
    const sealed = () => this.form === 'sealed', shikai = () => this.form === 'shikai';
    const hidden = () => this.hiddenT > 0;
    const rushed = () => {
      const t = g.nearestEnemy(f, 6);
      return !!t && t.pos.distanceTo(f.pos) < 3.2 && t.action !== null && t.action.name !== 'dash';
    };
    return {
      reach: 2.0,
      chain: 4,
      releaseAt: [0.9],
      // she keeps her distance — unless grief has her
      ranged: () => this.griefT <= 0,
      opener: () => this.skill1(),
      moves: [
        { name: 'fushibi', use: () => this.skill1(), min: 3, max: 18, weight: 1.2, cd: 9, when: () => !this.targetInNet() && this.nets.filter((n) => !n.alight).length < 2 },
        // rushed: the web round herself, the rusher caught in it
        { name: 'fushibi guard', use: () => this.skill1(), min: 0, max: 3.5, weight: 2.2, cd: 8, when: () => rushed() && this.nets.filter((n) => !n.alight).length < 2 },
        { name: 'kyokko', use: () => this.skill3(), min: 5, max: 30, weight: 0.9, cd: 14, when: () => sealed() && !hidden() },
        { name: 'shakka', use: () => this.heavy(), min: 3, max: 26, weight: 1.2, cd: 2.2, when: () => sealed() && !hidden() },
        // out of hiding once she has had a moment to move
        { name: 'ambush', use: () => this.heavy(), min: 0, max: 26, weight: 5, cd: 1, when: () => hidden() && this.hiddenT < 4.6 },
        { name: 'ignite sealed', use: () => this.heavy(), min: 0, max: 28, weight: 6, cd: 1.5, when: () => sealed() && this.targetInNet() },
        { name: 'launch', use: () => this.skill2(), min: 0, max: 3, weight: 1.4, cd: 8, when: () => sealed() && rushed() },
        { name: 'hakufuku', use: () => this.toggle(), min: 0, max: 2.8, weight: 1.3, cd: 12, when: sealed },
        { name: 'fire', use: () => this.heavy(), min: 3, max: 30, weight: 1.5, cd: 1.8, when: shikai },
        { name: 'volley', use: () => this.skill2(), min: 4, max: 24, weight: 1.1, cd: 5, when: shikai },
        { name: 'grief volley', use: () => this.skill2(), min: 2, max: 24, weight: 4, cd: 2.5, when: () => shikai() && this.griefT > 0 },
        { name: 'ignite', use: () => this.skill3(), min: 0, max: 40, weight: 6, cd: 2, when: () => shikai() && this.targetInNet() },
        { name: 'kaido', use: () => this.toggle(), min: 8, max: 60, weight: 1, cd: 14, when: () => shikai() && f.hp < f.maxHp * 0.6 && f.rei > 40 && this.griefT <= 0 },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    const flare = { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare };
    const live = this.nets.filter((n) => !n.alight).length;
    const fushibi = { key: 'Q', name: `Fushibi${live ? ` (${live}/2)` : ''}`, kanji: '伏火', cost: 16, cd: cd.net, cdMax: 6, active: live > 0, tint: '#FF8A50' };
    if (this.form === 'sealed') {
      return [
        { key: 'LMB', name: 'Kenjutsu', kanji: '剣' },
        { key: 'RMB', name: 'Shakkahō', kanji: '赤火砲', cost: 12, cd: cd.shakka, cdMax: 2.2, tint: '#D3242C' },
        fushibi,
        { key: 'E', name: 'Tsuriboshi launch', kanji: '吊星', cost: 14, cd: cd.launch, cdMax: 7, tint: '#4FA8FF' },
        { key: 'R', name: this.hiddenT > 0 ? 'Kyokkō · hidden' : 'Kyokkō', kanji: '曲光', cost: 14, cd: cd.kyokko, cdMax: 12, active: this.hiddenT > 0, timer: this.hiddenT > 0 ? this.hiddenT / 6 : undefined, tint: '#BCD4FF' },
        { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
        flare,
        { key: 'F', name: 'Hajike, Tobiume', kanji: '飛梅', cost: 18, tint: '#FFB33E' },
        { key: 'G', name: 'Hakufuku', kanji: '白伏', cost: 16, cd: cd.haku, cdMax: 12, tint: '#9B6BD0' },
      ];
    }
    return [
      { key: 'LMB', name: 'Tobiume', kanji: '飛梅' },
      { key: 'RMB', name: 'Fireball', kanji: '火球', cost: 10, cd: cd.fire, cdMax: 1.6, tint: '#FFB33E' },
      fushibi,
      { key: 'E', name: 'Volley', kanji: '連弾', cost: 20, cd: cd.volley, cdMax: 5, tint: '#FF5A1F' },
      { key: 'R', name: 'Ignite', kanji: '起爆', cost: 8, cd: cd.ignite, cdMax: 2.5, active: live > 0, tint: '#FF8A50' },
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
      flare,
      { key: 'F', name: 'Seal', kanji: '封' },
      { key: 'G', name: 'Kaidō', kanji: '回道', cost: 4, cd: cd.kaido, cdMax: 1, active: this.f.action instanceof KaidoAction, tint: '#6BE08A' },
    ];
  }
}
