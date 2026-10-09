// Pernida Parnkgjas's kit (docs/kits/pernida.md). The Left Arm of the Soul King: a small hooded thing whose nerves do
// the work. Every blow of the flick string plants a nerve; the Compulsory (RMB) fires nerves into a body and its own
// weapon arm wrings into a spiral (seized, bleeding) until, with three nerves in it or held long enough, the whole
// body folds the wrong way — in the Hand and the Arm it is crushed into a ball and flung. A twisted victim that dashes
// tears its own arm free (the canon counter); electric and acid kits shake the nerves out. Stone left hands rise out
// of the ground (or a building's walls) and clap; Heilig Bogen's arrows trail nerves and steer; the Hand and the Arm
// storm nerves in every direction, loose five fingertip bows, tear off their own fingers to grow clones, and the Arm
// devours. It learns: a technique that keeps hitting it hits for less (ADAPTED), and every nerve it plants feeds the
// Progress meter that takes it straight to the Arm (V), then the Gargantuan Arm. The anime's Vollständig (G in the
// cloak): a Zeichen halo, two great hands for wings, flight.
import * as THREE from 'three';
import { FighterAction, type Fighter, type FighterDef } from '../fighter';
import type { DamageOpts, Game, Projectile } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import type { AuraStyle } from '../../vfx/aura';
import { pernidaAsset, pernidaProp } from '../../chars/pernida';
import { ARM_CHAIN, ARM_CLIPS, ARM_STANCE, CLOAK_STANCE, HAND_CHAIN, HAND_CLIPS, HAND_STANCE, PERNIDA_CHAIN, PERNIDA_CLIPS, VOLL_CHAIN } from '../../chars/pernidaClips';
import { registerReactions } from '../../chars/reactionClips';
import { FingerChains, FingerSeed, NerveArrow, NerveLance, NerveLine, NerveStorm, StoneHands, WallHand, flare, fleshBurst, segHits, shredBurst } from '../../vfx/compulsory';
import { LightPillar } from '../../vfx/heilig';
import { CapsuleShape, SphereShape } from '../../destruction/shapes';
import { raycastVoxels } from '../../voxel/raycast';
import { TEX_GLOW, TEX_PUFF, TEX_RING } from '../../vfx/sprites';
import { DuelistAI } from '../ai/duelist';
import { hirenkyakuPuff, vollFlight, type Rgb } from './sternritter';

export const AURA_PERNIDA: AuraStyle = { core: '#FFF4D0', body: '#F2C84B', rim: '#8A6A1C' };
export const AURA_VOLL: AuraStyle = { core: '#FFF6DA', body: '#F7DD84', rim: '#B8861A' };
const GOLD = '#F2C84B';
const PALE = '#E8D0C8';
const BLOOD = '#C1121F';
const TINT: Rgb = [1, 0.84, 0.36];

const CLOAK = { h: 1.55, r: 0.36 };
const HANDF = { h: 4.47, r: 1.2 };
const ARMF = { h: 11.7, r: 1.5 };
const SPEED_CLOAK = { run: 8.6, sprint: 26, jump: 13, dash: 34, dashTime: 0.11 };
const SPEED_HAND = { run: 8, sprint: 18, jump: 9, dash: 36, dashTime: 0.45 };
const SPEED_ARM = { run: 9, sprint: 16, jump: 0, dash: 24, dashTime: 0.6 };
/** acid and chemicals: its exposed nerves burn (Mayuri's acid, Askin's doses, Szayelaporro's compounds) */
const ACID = /^(mayuri|askin|szayel)$/;
/** strong electric shocks drive its nerves out */
const SHOCK = /^(candice|yoruichi)$/;
const CLONE_SCALE = 0.6;
const MAX_CLONES = 4;

export const PERNIDA_DEF: FighterDef = {
  id: 'pernida',
  name: 'Pernida Parnkgjas',
  title: 'Sternritter "C" — The Compulsory',
  build: () => ({ asset: pernidaAsset('cloak'), props: [] }),
  stance: CLOAK_STANCE,
  clips: PERNIDA_CLIPS,
  aura: AURA_PERNIDA,
  hp: 1000,
  rei: 230,
  speed: { ...SPEED_CLOAK },
  radius: CLOAK.r,
  height: CLOAK.h,
};

/** a clone grown from a severed finger: a hand of its own, one pupil, no rune */
export function pernidaCloneDef(): FighterDef {
  return {
    id: 'pernida-clone',
    name: 'Pernida (clone)',
    build: () => ({ asset: pernidaAsset('clone'), props: [] }),
    stance: HAND_STANCE,
    clips: HAND_CLIPS,
    aura: AURA_PERNIDA,
    hp: 260,
    rei: 120,
    speed: { ...SPEED_HAND, run: 9, dash: 30, dashTime: 0.35 },
    radius: HANDF.r * CLONE_SCALE,
    height: HANDF.h * CLONE_SCALE,
  };
}

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

function boneAt(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  if (f.visual.rig.index(name) < 0) return f.center(out);
  const b = f.visual.rig.bone(name);
  b.updateWorldMatrix(true, false);
  return b.getWorldPosition(out);
}

/** where nerves go into a body: the weapon arm if it has one */
function limbOf(o: Fighter, out = new THREE.Vector3()): THREE.Vector3 {
  return o.visual.rig.index('forearm.R') >= 0 ? boneAt(o, 'forearm.R', out) : o.center(out);
}

/** a clear line between two points (no solid voxels in the way) */
function clearLine(g: Game, a: THREE.Vector3, b: THREE.Vector3): boolean {
  const d = _v.subVectors(b, a);
  const len = d.length();
  if (len < 0.5) return true;
  return !raycastVoxels(g.engine.world, a.x, a.y, a.z, d.x, d.y, d.z, len - 0.4);
}

// ---------------------------------------------------------------------------------------------- actions

interface SkillOpts {
  armor?: number;
  mobility?: number;
  invulnerable?: boolean;
  tick?: (t: number, dt: number) => void;
  end?: () => void;
  dur?: number;
}

class ClipSkill extends FighterAction {
  private dur = 1;
  constructor(readonly name: string, readonly clip: string, private on: (n: string) => void, private o: SkillOpts = {}) {
    super();
    this.armor = o.armor ?? 0.2;
    this.mobility = o.mobility ?? 0.1;
    this.invulnerable = !!o.invulnerable;
    this.airGravity = 0.6;
  }
  override start(f: Fighter): void {
    const c = f.anim.clip(this.clip);
    this.dur = this.o.dur ?? (c ? c.dur - c.fadeOut * 0.5 : 0.6);
    f.anim.play(this.clip, { onEvent: this.on, hold: this.o.dur !== undefined && !!c && this.o.dur > c.dur });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    this.o.tick?.(this.t, dt);
    if (this.t >= this.dur) this.done = true;
  }
  override end(): void {
    this.o.end?.();
  }
  /** cut short (the grip's hold ends early when its last victim is gone) */
  finish(): void {
    this.dur = Math.min(this.dur, this.t);
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' ? this.t > this.dur * 0.6 : next instanceof ClipSkill && this.t > this.dur * 0.75;
  }
}

/** one blow of a string; a press queued runs on at the combo point; `sweep` runs every frame of its window */
class StringAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  queued = false;
  constructor(readonly clip: string, readonly next: () => void, readonly onEvent: (n: string) => void, readonly armorK = 0.15, readonly sweep?: { from: number; to: number; tick: () => void }) {
    super();
    this.name = clip;
    this.mobility = 0.16;
    this.armor = armorK;
    this.airGravity = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip);
    this.dur = c ? c.dur - c.fadeOut * 0.5 : 0.4;
    this.comboAt = c ? c.events.combo ?? this.dur * 0.62 : 0.3;
    f.anim.play(this.clip, { onEvent: (n) => this.onEvent(n) });
    g.sfx.play('swing', f.center(), 1.1);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.sweep && this.t >= this.sweep.from && this.t <= this.sweep.to) this.sweep.tick();
    if (this.queued && this.t >= this.comboAt) {
      this.done = true;
      this.next();
      return;
    }
    if (this.t >= this.dur) this.done = true;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' || next instanceof ClipSkill ? this.t >= this.comboAt * 0.85 : false;
  }
}

/** a nerve lashed out of a sleeve to a point and drawn back (the flick string's look) */
class NerveLash implements Projectile {
  done = false;
  private line: NerveLine;
  private t = 0;
  constructor(g: Game, readonly owner: Fighter, private from: () => THREE.Vector3, private to: THREE.Vector3, readonly dur = 0.24, r = 0.04) {
    this.line = new NerveLine(g.engine.gr.scene, r, r * 0.4, 12);
  }
  update(dt: number, g: Game): void {
    this.t += dt;
    const u = this.t / this.dur;
    const ext = u < 0.4 ? u / 0.4 : Math.max(0, 1 - (u - 0.4) / 0.6);
    this.line.lay(this.from(), this.to, ext, g.time, { sag: 0.12, wiggle: 0.18, freq: 2 });
    if (this.t >= this.dur) this.done = true;
  }
  dispose(): void {
    this.line.dispose();
  }
}

// ---------------------------------------------------------------------------------------------- the grip

interface Grip {
  o: Fighter;
  /** who holds the nerves (Pernida, or one of its clones) */
  by: Fighter;
  t: number;
  lines: NerveLine[];
  from: string[];
  /** what the hold ends in */
  final: 'fold' | 'ball' | 'none';
  finalAt: number;
  /** freed for nothing at this time (electric bodies, a re-stitched arm) */
  escapeAt: number;
  ended: boolean;
  heldT: number;
  wasDash: boolean;
  scale: THREE.Vector3 | null;
  posed: boolean;
}

type Form = 'cloak' | 'voll' | 'hand' | 'arm';

const SPEECH: [number, string][] = [[20, '…ッ…ゥ…'], [40, '…Pe…ru…'], [60, 'Perunida… Parunkajasu.'], [80, 'Kuinshī da.'], [100, 'I have always been a Quincy.']];

export class PernidaKit implements Kit {
  form: Form = 'cloak';
  /** Progress: what its nerves have learned, 0..100 */
  meter = 0;
  readonly cd = { compel: 0, lance: 0, stone: 0, bow: 0, voll: 0, release: 0, flare: 0, storm: 0, volley: 0, tear: 0, devour: 0, wing: 0, cut: 0 };
  comboIndex = 0;
  private lastEnd = -9;
  /** nerves planted in each body (by fighter id) */
  readonly nerves = new Map<number, { n: number; t: number }>();
  readonly grips: Grip[] = [];
  /** what it has learned to shrug off: technique key → times it landed */
  private adapt = new Map<string, { n: number; t: number }>();
  private adaptT = 0;
  readonly clones: Fighter[] = [];
  private reconstituted = false;
  private gargT = 0;
  size = 1;
  private chains: FingerChains | null = null;
  private hoodT = 0;
  private said = new Set<number>();
  private wasDashing = false;
  private lastLine = -99;
  private baseTaken = 1;
  private bows: string[] = [];
  private devoured: { o: Fighter; bites: number } | null = null;
  private wingGrab: { o: Fighter; t: number } | null = null;
  private gallopHit = new Set<number>();
  private flung = false;

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.data.quincy = true;
    // a part of the Soul King: The Almighty does not see it
    f.data.unforeseen = true;
    f.parry = (amount, from, o) => this.parry(amount, from, o);
    f.onHurt = (dmg, heavy) => this.hurt(dmg, heavy);
    f.onLethal = () => this.lethal();
    this.applyStats();
  }

  // ---------------------------------------------------------------- bits

  get giant(): boolean {
    return this.form === 'arm';
  }

  get hand(): boolean {
    return this.form === 'hand' || this.form === 'arm';
  }

  target(): Fighter | null {
    const { f, g } = this;
    const lock = f === g.player ? g.hud?.lockTarget ?? null : null;
    if (lock && !lock.dead) return lock;
    return g.nearestEnemy(f, 160, f.forward(), 80) ?? g.nearestEnemy(f, 160);
  }

  private face(t: Fighter | null): void {
    if (!t) return;
    const f = this.f;
    f.faceTarget = t.center();
    f.yaw = Math.atan2(t.pos.x - f.pos.x, t.pos.z - f.pos.z);
  }

  private line(text: string, every = 6, kanji = '', color: string = GOLD): void {
    if (this.g.time - this.lastLine < every) return;
    this.lastLine = this.g.time;
    this.g.callout(kanji, text, color);
  }

  private special(a: FighterAction, cost: number, cdKey: keyof typeof this.cd, cd: number): boolean {
    const f = this.f;
    if (this.cd[cdKey] > 0) return false;
    if (f.action && !f.action.canCancel(a)) return false;
    if (f.hitstun > 0 || f.dead || this.devoured) return false;
    if (!f.spendRei(cost)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return false;
    }
    this.cd[cdKey] = cd;
    f.act(a, true);
    return true;
  }

  private applyStats(): void {
    const f = this.f;
    const base = this.form === 'cloak' ? 1 : this.form === 'voll' ? 1.3 : this.form === 'hand' ? 1.4 : 1.8 * this.size;
    f.power = base;
    this.baseTaken = this.form === 'cloak' ? 1 : this.form === 'voll' ? 0.9 : this.form === 'hand' ? 0.85 : 0.8;
    f.damageTaken = this.baseTaken;
    f.toughness = this.form === 'hand' ? 6 : this.form === 'arm' ? 12 : 0;
    f.knockTaken = this.form === 'hand' ? 0.5 : this.form === 'arm' ? 0.15 : 1;
    f.giant = this.form === 'arm';
    f.ghosts.enabled = !this.hand;
  }

  /** plant nerves in a body (they feed the Progress meter) */
  plant(o: Fighter, k: number): void {
    if (o.dead || o === this.f) return;
    const e = this.nerves.get(o.id) ?? { n: 0, t: 0 };
    e.n = Math.min(5, e.n + k);
    e.t = this.g.time;
    this.nerves.set(o.id, e);
    this.feed(4 * k);
    const c = o.center();
    this.g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: 0.25, sizeEnd: 0.7, life: 0.25, r: 0.9, g: 0.75, b: 0.7, alpha: 0.7, alphaEnd: 0, tex: TEX_RING });
  }

  nervesIn(o: Fighter): number {
    const e = this.nerves.get(o.id);
    return e && this.g.time - e.t < 6 ? e.n : 0;
  }

  private feed(k: number): void {
    this.meter = Math.min(100, this.meter + k);
    for (const [at, text] of SPEECH) {
      if (this.meter < at || this.said.has(at)) continue;
      this.said.add(at);
      this.g.callout('', text, at >= 100 ? '#E8C866' : PALE);
    }
  }

  // ---------------------------------------------------------------- what reaches it

  /**
   * Progress: a technique that keeps landing lands for less (12 % a time, to 40 %; doubled after Progress); acid and
   * shocks reach its nerves (×1.3, the grips break, an acid blow tears the cloak open).
   */
  private parry(_amount: number, from: Fighter | null, o: DamageOpts): boolean {
    const { f, g } = this;
    if (!from || from === f || o.reflected) {
      f.damageTaken = this.baseTaken;
      return false;
    }
    const key = `${from.id}:${o.energy ? 'e' : 'b'}:${from.action?.name ?? 'shot'}`;
    const a = this.adapt.get(key) ?? { n: 0, t: 0 };
    if (g.time - a.t > 20) a.n = 0;
    let k = Math.max(0.4, 1 - 0.12 * a.n * (this.adaptT > 0 ? 2 : 1));
    a.n++;
    a.t = g.time;
    this.adapt.set(key, a);
    if (a.n === 3) {
      this.feed(6);
      g.hud?.floatText(f.center().setY(f.pos.y + f.def.height + 0.3), 'ADAPTED', GOLD, 18);
      this.line('Kekeke…', 8, '適応', PALE);
    }
    if (ACID.test(from.def.id)) {
      k *= 1.3;
      this.burned(from);
    } else if (SHOCK.test(from.def.id)) {
      k *= 1.3;
      for (const gr of this.grips) if (gr.o === from) this.free(gr, 'shock');
    }
    f.damageTaken = this.baseTaken * k;
    return false;
  }

  /** acid on the nerves: it lets go of everything and flinches back; the first burns the cloak off */
  private burned(_from: Fighter): void {
    const f = this.f;
    for (const gr of [...this.grips]) if (gr.by === f) this.free(gr, 'acid');
    if (!f.action?.invulnerable) {
      f.stopAction();
      f.hitstun = Math.max(f.hitstun, 0.35);
    }
    if (this.form === 'cloak' && this.cd.release <= 0) this.becomeHand(false);
  }

  private hurt(dmg: number, heavy: boolean): void {
    const { f, g } = this;
    this.feed(2);
    // the head under the hood swells and ripples where it was struck
    if (!this.hand && heavy) this.hoodT = 0.7;
    // a blow big enough to blow it apart (a fist through the palm): it staggers, and a finger torn off grows a clone
    if (this.hand && dmg >= f.maxHp * 0.12 && this.cd.cut <= 0) {
      this.cd.cut = 6;
      const from = f.lastHurt.from;
      if (from && _v.subVectors(from.pos, f.pos).setY(0).normalize().dot(f.forward()) > 0.3) {
        f.stopAction();
        f.hitstun = Math.max(f.hitstun, 0.8);
        fleshBurst(g, sock(f, 'palm.eye'), this.giant ? 3 : 1.6);
        this.line('…ギッ', 4, '', PALE);
      }
      this.dropFinger(['band.pinky', 'band.ring', 'band.index'][Math.floor(Math.random() * 3)]);
    }
  }

  /**
   * Killed in the cloak, the cloak tears and the hand is under it; the hand or the arm killed the first time pulls
   * itself back together out of its shreds (35 %).
   */
  private lethal(): boolean {
    const f = this.f;
    if (!this.hand) {
      f.hp = f.maxHp * 0.4;
      this.becomeHand(true);
      return true;
    }
    if (!this.reconstituted) {
      this.reconstituted = true;
      f.hp = f.maxHp * 0.35;
      shredBurst(this.g, f.pos.clone(), f.def.height * 0.6);
      fleshBurst(this.g, f.center(), 3);
      this.line('…', 4, '', PALE);
      if (this.form === 'arm') this.becomeHand(true);
      else f.act(new ClipSkill('rise', 'ph_rise', () => {}, { invulnerable: true, mobility: 0 }), true);
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- the frame

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    this.adaptT = Math.max(0, this.adaptT - dt);
    f.damageTaken = this.baseTaken;
    for (const [id, e] of this.nerves) if (g.time - e.t > 6) this.nerves.delete(id);
    this.updateGrips(dt);
    this.updateWingGrab(dt);
    this.updateDevour();
    for (let i = this.clones.length - 1; i >= 0; i--) if (this.clones[i].dead) this.clones.splice(i, 1);
    if (f.dead) {
      this.chains?.dispose();
      this.chains = null;
      return;
    }
    // regeneration (held back for 2 s after each blow that reaches it)
    if (g.time - f.lastHurt.at > 2) f.hp = Math.min(f.maxHp, f.hp + f.maxHp * (this.hand ? 0.004 : 0.002) * dt);
    // the Vollständig flies and drains; binds hold it a third as long (it burst Hikifune's wood)
    if (this.form === 'voll') {
      vollFlight(g, f, this.target(), 1.6);
      if (!f.spendRei(4 * dt)) this.endVoll();
      f.rooted = false;
      f.slowT = Math.max(0, f.slowT - 2 * dt);
      f.armLockT = Math.max(0, f.armLockT - 2 * dt);
    } else f.mounted = false;
    // the Hand and the Arm shed what poisons and binds them twice as fast (layer on layer of skin)
    if (this.hand) {
      f.slowT = Math.max(0, f.slowT - dt);
      f.armLockT = Math.max(0, f.armLockT - dt);
      f.sealT = Math.max(0, f.sealT - dt);
      f.wetT = Math.max(0, f.wetT - dt);
    }
    this.updateSize(dt);
    // the hood's swell
    if (this.hoodT > 0) {
      this.hoodT = Math.max(0, this.hoodT - dt);
      const head = f.visual.rig.index('head') >= 0 ? f.visual.rig.bone('head') : null;
      if (head) head.scale.setScalar(1 + 0.22 * Math.sin((0.7 - this.hoodT) * 18) * (this.hoodT / 0.7));
    }
    // Shift
    const dashing = f.dashT > 0;
    if (dashing && !this.wasDashing) this.dashStart();
    if (dashing && this.form === 'hand') this.gallop();
    if (!dashing && this.wasDashing && this.form === 'arm') this.flingLand();
    this.wasDashing = dashing;
    this.chains?.update();
    f.aura.target = this.form === 'voll' ? 0.4 : this.gargT > 0 ? 0.35 : this.meter >= 60 ? 0.18 : 0.03;
  }

  /** the Gargantuan Arm grows and, its time up, shrinks back */
  private updateSize(dt: number): void {
    const f = this.f;
    if (this.form !== 'arm') {
      this.size = 1;
      return;
    }
    if (this.gargT > 0 && (this.gargT -= dt) <= 0) {
      this.gargT = 0;
      this.line('…', 4, '', PALE);
    }
    const goal = this.gargT > 0 ? 2.4 : 1;
    const before = this.size;
    this.size += (goal - this.size) * (1 - Math.exp(-1.8 * dt));
    if (Math.abs(goal - this.size) < 0.003) this.size = goal;
    if (this.size !== before || f.visual.object.scale.x !== this.size) {
      f.visual.object.scale.setScalar(this.size);
      f.def.height = ARMF.h * this.size;
      f.def.radius = ARMF.r * this.size;
      const s = Math.sqrt(this.size);
      f.def.speed.run = SPEED_ARM.run * s;
      f.def.speed.sprint = SPEED_ARM.sprint * s;
      f.def.speed.dash = SPEED_ARM.dash * s;
      f.body.stepUp = 2.4 * this.size;
      f.power = 1.8 * this.size;
    }
  }

  // ---------------------------------------------------------------- forms

  /** the body for a form: its asset, stance, clips, size and speeds */
  private rebody(form: Form): void {
    const f = this.f;
    for (const k of this.bows) f.visual.detach(k);
    this.bows = [];
    this.form = form;
    f.anim.stopAll(0.05);
    if (form === 'cloak' || form === 'voll') {
      f.def = { ...f.def, stance: CLOAK_STANCE, clips: PERNIDA_CLIPS, height: CLOAK.h, radius: CLOAK.r, speed: { ...SPEED_CLOAK } };
      f.setForm({ asset: pernidaAsset(form), props: [] }, form === 'voll' ? AURA_VOLL : AURA_PERNIDA);
      if (form === 'voll') f.visual.attach('halo', pernidaProp('halo'), 'halo');
      f.body.stepUp = 0.6;
      f.visual.object.scale.setScalar(1);
    } else {
      const arm = form === 'arm';
      f.def = { ...f.def, stance: arm ? ARM_STANCE : HAND_STANCE, clips: arm ? ARM_CLIPS : HAND_CLIPS, height: arm ? ARMF.h : HANDF.h, radius: arm ? ARMF.r : HANDF.r, speed: { ...(arm ? SPEED_ARM : SPEED_HAND) } };
      f.setForm({ asset: pernidaAsset(arm ? 'arm' : 'hand'), props: [] }, AURA_PERNIDA);
      f.body.stepUp = arm ? 2.4 : 1.1;
      this.size = 1;
      f.visual.object.scale.setScalar(1);
      f.mounted = false;
    }
    // the chains only bind the hand
    this.chains?.dispose();
    this.chains = form === 'hand' ? new FingerChains(this.g.engine.gr.scene, f, 1.6) : null;
    this.applyStats();
  }

  /** Unveil: the cloak heaves and tears, and the hand rises out of it */
  becomeHand(forced: boolean): void {
    const { f, g } = this;
    if (this.form === 'hand') return;
    this.cd.release = 4;
    const fromArm = this.form === 'arm';
    const grow = () => {
      shredBurst(g, f.pos.clone(), 1.6);
      this.rebody('hand');
      f.act(new ClipSkill('rise', 'ph_rise', () => {}, { invulnerable: true, mobility: 0 }), true);
      g.callout('左手', fromArm ? '…' : 'PERNIDA PARNKGJAS', PALE);
      if (g.player && g.player.pos.distanceTo(f.pos) < 30) g.shake(0.5);
    };
    if (fromArm || forced) {
      grow();
      return;
    }
    f.stopAction();
    f.act(new ClipSkill('unveil', 'pn_unveil', (n) => n === 'tear' && grow(), { invulnerable: true, mobility: 0 }), true);
    this.hoodT = 1.2;
  }

  /** the chains between the fingertips strain and snap, and the rest of the arm grows out of the wrist */
  becomeArm(fast: boolean): void {
    const { f, g } = this;
    if (this.form === 'arm') return;
    this.cd.release = 4;
    const grow = () => {
      this.chains?.snap(g);
      if (this.form !== 'hand') shredBurst(g, f.pos.clone(), 1.6);
      this.rebody('arm');
      f.visual.object.scale.setScalar(0.4);
      this.size = 0.4;
      fleshBurst(g, f.pos.clone().setY(f.pos.y + 1), 3);
      g.addProjectile(new LightPillar(g, f.pos.clone(), 1.6, 40, '#F7DD84'));
      f.act(new ClipSkill('grow', 'pa_grow', () => {}, { invulnerable: true, mobility: 0 }), true);
      g.callout('左腕', 'THE LEFT ARM', GOLD);
      if (g.player && g.player.pos.distanceTo(f.pos) < 60) g.shake(0.8);
    };
    if (fast || this.form !== 'hand') {
      grow();
      return;
    }
    f.stopAction();
    f.act(new ClipSkill('chains', 'ph_chains', (n) => n === 'snap' && grow(), { invulnerable: true, mobility: 0 }), true);
  }

  private endVoll(): void {
    if (this.form !== 'voll') return;
    this.rebody('cloak');
    this.cd.voll = 8;
  }

  // ---------------------------------------------------------------- Shift

  private dashStart(): void {
    const { f, g } = this;
    const t = this.target();
    if (this.form === 'cloak' && t && t.pos.distanceTo(f.pos) < 18) {
      // Phantom Step: it is simply behind them
      hirenkyakuPuff(g, f, TINT);
      const back = t.forward().multiplyScalar(-(1.6 + t.def.radius));
      const p = t.pos.clone().add(back);
      p.y = Math.max(p.y, t.pos.y);
      f.body.pos.copy(p);
      f.body.prev.copy(p);
      f.body.vel.set(0, 0, 0);
      f.dashT = 0;
      this.face(t);
      f.invuln = Math.max(f.invuln, 0.2);
      f.anim.play('pn_step', { fadeIn: 0.02 });
      hirenkyakuPuff(g, f, TINT);
      return;
    }
    if (this.form === 'hand') {
      this.gallopHit.clear();
      f.anim.play('ph_gallop', { fadeIn: 0.04 });
      g.sfx.play('step', f.pos, 1.6);
    }
    if (this.form === 'arm') {
      // Root Fling: the roots catapult it
      f.body.vel.y = 9;
      this.flung = true;
      g.groundImpact(f.pos.clone(), 2.5 * this.size, 400, '#8E8676', f);
    }
  }

  /** Finger Gallop: what it skitters over is struck aside */
  private gallop(): void {
    const { f, g } = this;
    for (const e of g.enemiesOf(f)) {
      if (e.dead || this.gallopHit.has(e.id) || e.pos.distanceTo(f.pos) > f.def.radius + e.def.radius + 0.6) continue;
      this.gallopHit.add(e.id);
      g.damage(e, 40, f, f.dashDir.clone(), { knock: 18, launch: 5, heavy: true, hitstop: 0.08, shake: 0.4 });
    }
  }

  private flingLand(): void {
    const { f, g } = this;
    if (!this.flung) return;
    this.flung = false;
    g.groundImpact(f.pos.clone(), 3 * this.size, 900, '#8E8676', f);
    for (const e of g.enemiesOf(f)) {
      if (e.dead || Math.hypot(e.pos.x - f.pos.x, e.pos.z - f.pos.z) > 4 * this.size + e.def.radius) continue;
      g.damage(e, 70, f, _v.subVectors(e.pos, f.pos).setY(0).normalize().clone(), { knock: 18, launch: 6, heavy: true, hitstop: 0.1, shake: 0.6 });
    }
  }

  // ---------------------------------------------------------------- LMB

  attack(): void {
    const { f, g } = this;
    const cur = f.action;
    if (cur instanceof StringAction) {
      cur.queued = true;
      return;
    }
    if (f.busy || this.devoured || this.wingGrab) return;
    if (g.time - this.lastEnd > 0.9) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const { f, g } = this;
    const t = this.target();
    this.lastEnd = g.time + 0.7;
    this.comboIndex = i + 1;
    if (t) this.face(t);
    const list = this.form === 'cloak' ? PERNIDA_CHAIN : this.form === 'voll' ? VOLL_CHAIN : this.form === 'hand' ? HAND_CHAIN : ARM_CHAIN;
    const clip = list[i % list.length];
    const n = i % list.length;
    if (this.form === 'cloak') {
      f.act(new StringAction(clip, () => this.chain(i + 1), (ev) => ev === 'hit' && this.flick(n)), true);
      return;
    }
    if (this.form === 'voll') {
      f.act(new StringAction(clip, () => this.chain(i + 1), (ev) => ev === 'hit' && this.wingSlap(n)), true);
      return;
    }
    if (this.form === 'hand') {
      f.act(new StringAction(clip, () => this.chain(i + 1), (ev) => ev === 'hit' && this.handBlow(clip), 0.5), true);
      return;
    }
    // the Arm: the sweep and the backhand drag the whole arm through what stands there
    const hits = new Set<number>();
    const sweep = clip === 'pa_slam' ? undefined : { from: 0.36, to: 0.58, tick: () => this.armSweep(hits, clip === 'pa_sweep' ? 70 : 80) };
    f.act(new StringAction(clip, () => this.chain(i + 1), (ev) => ev === 'hit' && clip === 'pa_slam' && this.armSlam(), 0.6, sweep), true);
  }

  /** a nerve flick: out of the sleeve to whoever is in reach in front, a nerve left in them */
  private flick(n: number): void {
    const { f, g } = this;
    const reach = n === 3 ? 6 : 4.2;
    const sleeve = n === 1 ? 'sleeve.R' : 'sleeve.L';
    const t = this.target();
    const fw = f.forward();
    const to = t && t.pos.distanceTo(f.pos) < reach + t.def.radius ? t.center() : f.center().addScaledVector(fw, reach);
    g.addProjectile(new NerveLash(g, f, () => sock(f, sleeve), to.clone(), 0.24, n === 3 ? 0.06 : 0.045));
    const a = sock(f, sleeve);
    for (const e of g.enemiesOf(f)) {
      if (e.dead || !segHits(e, a, to, 0.35)) continue;
      const dmg = [14, 14, 18, 26][n];
      g.damage(e, dmg, f, fw.clone(), { knock: n === 3 ? 10 : 3, launch: n === 2 ? 7 : 0, heavy: n >= 2, hitstop: n >= 2 ? 0.08 : 0.05, shake: n >= 2 ? 0.25 : 0.12, color: PALE });
      this.plant(e, 1);
    }
  }

  private wingSlap(n: number): void {
    const { f, g } = this;
    const fw = f.forward();
    const c = f.center().addScaledVector(fw, 2.2);
    for (const e of g.enemiesOf(f)) {
      if (e.dead || e.center().distanceTo(c) > 2.8 + e.def.radius) continue;
      g.damage(e, [22, 22, 30, 40][n], f, fw.clone(), { knock: n >= 2 ? 16 : 8, launch: n === 3 ? 6 : 1, heavy: n >= 2, hitstop: 0.08, shake: 0.3, color: GOLD });
      this.plant(e, 1);
    }
    g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: 1, sizeEnd: 3, life: 0.25, r: 1, g: 0.9, b: 0.55, alpha: 0.6, alphaEnd: 0, tex: TEX_RING });
  }

  /** the hand's blows: the rake, the palm slam (a crater), the backhand */
  private handBlow(clip: string): void {
    const { f, g } = this;
    const fw = f.forward();
    const palm = sock(f, 'palm.c');
    if (clip === 'ph_slam') {
      const p = palm.clone();
      p.y = f.pos.y;
      g.groundImpact(p, 2.6, 800, '#8E8676', f);
      for (const e of g.enemiesOf(f)) {
        if (e.dead || Math.hypot(e.pos.x - p.x, e.pos.z - p.z) > 2.8 + e.def.radius || e.pos.y > p.y + 2.5) continue;
        g.damage(e, 70, f, _v.subVectors(e.pos, p).setY(0.2).normalize().clone(), { knock: 10, launch: 5, heavy: true, hitstop: 0.12, shake: 0.5 });
      }
      return;
    }
    const c = palm.addScaledVector(fw, 1.2);
    g.engine.destruction.carve(new SphereShape(c.clone(), 1.6, 0.8), { mode: 'smash', power: 600, impulse: 6, dust: 0.5 });
    for (const e of g.enemiesOf(f)) {
      if (e.dead || e.center().distanceTo(c) > 2.6 + e.def.radius) continue;
      const back = clip === 'ph_backhand';
      g.damage(e, back ? 55 : 40, f, back ? new THREE.Vector3(-fw.z, 0, fw.x) : fw.clone(), { knock: back ? 18 : 9, launch: 2, heavy: back, hitstop: 0.09, shake: 0.35 });
      this.plant(e, 1);
    }
  }

  /** the arm dragged through: whatever its forearm and hand pass through is smashed and struck */
  private armSweep(hits: Set<number>, dmg: number): void {
    const { f, g } = this;
    const a = boneAt(f, 'chest');
    const b = sock(f, 'tip.middle');
    const r = 1.4 * this.size;
    g.engine.destruction.carve(new CapsuleShape(a.clone(), b.clone(), r), { mode: 'smash', power: 1600, impulse: 9, dust: 0.6 });
    for (const e of g.enemiesOf(f)) {
      if (e.dead || hits.has(e.id) || !segHits(e, a, b, r)) continue;
      hits.add(e.id);
      g.damage(e, dmg, f, _v.subVectors(e.pos, f.pos).setY(0).normalize().clone(), { knock: 24, launch: 6, heavy: true, hitstop: 0.12, shake: 0.6 });
      this.plant(e, 1);
    }
  }

  /** the palm brought down: a crater and a wave of broken ground ahead */
  private armSlam(): void {
    const { f, g } = this;
    const p = sock(f, 'palm.c');
    p.y = f.pos.y;
    const k = this.size;
    g.groundImpact(p, 3.6 * k, 1400, '#8E8676', f);
    const fw = f.forward();
    g.engine.destruction.carve(new CapsuleShape(p.clone(), p.clone().addScaledVector(fw, 10 * k), 1.2 * k), { mode: 'smash', power: 1200, impulse: 8, dust: 0.8 });
    for (const e of g.enemiesOf(f)) {
      if (e.dead || e.pos.y > p.y + 4 * k) continue;
      const d = Math.hypot(e.pos.x - p.x, e.pos.z - p.z);
      const along = _v.subVectors(e.pos, p).setY(0).dot(fw);
      const inWave = along > 0 && along < 10 * k && segHits(e, p, p.clone().addScaledVector(fw, 10 * k), 1.6 * k);
      if (d > 3.8 * k + e.def.radius && !inWave) continue;
      g.damage(e, d < 3.8 * k ? 110 : 60, f, _v.subVectors(e.pos, p).setY(0.3).normalize().clone(), { knock: 16, launch: 8, heavy: true, hitstop: 0.14, shake: 0.8 });
    }
    if (g.player && g.player.pos.distanceTo(p) < 50) g.shake(0.7);
  }

  // ---------------------------------------------------------------- RMB: the Compulsory

  heavy(): void {
    const { f, g } = this;
    if (f.busy || this.devoured || this.wingGrab) return;
    const t = this.target();
    if (t) this.face(t);
    const clip = this.hand ? (this.giant ? 'pa_compel' : 'ph_compel') : 'pn_compel';
    const range = this.giant ? 22 * this.size : this.hand ? 14 : 10;
    const hold = 3.4;
    let skill: ClipSkill | null = null;
    skill = new ClipSkill('compel', clip, (n) => {
      if (n !== 'fire') return;
      const targets = g.enemiesOf(f).filter((e) => !e.dead && e.pos.distanceTo(f.pos) < range + e.def.radius && !this.grips.some((gr) => gr.o === e))
        .sort((a, b) => a.pos.distanceTo(f.pos) - b.pos.distanceTo(f.pos)).slice(0, this.giant ? 2 : 1);
      let any = false;
      for (const e of targets) {
        const from = this.gripSockets();
        if (!clearLine(g, sock(f, from[0]), e.center())) continue;
        this.grip(f, e, from, this.hand ? 'ball' : 'fold');
        any = true;
      }
      if (!any) {
        // the nerves fly out at nothing and fall back
        const to = f.center().addScaledVector(f.forward(), range);
        for (const s of this.gripSockets()) g.addProjectile(new NerveLash(g, f, () => sock(f, s), to.clone().add(new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2)), 0.5, this.hand ? 0.08 : 0.04));
        skill?.finish();
      }
    }, {
      dur: hold, armor: 0.3, mobility: 0.05,
      // the eyes flare (the tell) while it raises its hand; the hold lasts while a grip of its own still runs
      tick: (tt) => {
        if (tt < 0.3 && Math.random() < 0.4) for (const s of this.eyeSockets()) flare(g, sock(f, s), this.hand ? 0.5 : 0.12);
        if (tt > 0.4 && !this.grips.some((gr) => gr.by === f && (!gr.ended || gr.heldT > 0.6))) skill?.finish();
      },
      end: () => {
        for (const gr of [...this.grips]) if (gr.by === f && !gr.ended) this.free(gr, 'cut');
      },
    });
    this.special(skill, 18, 'compel', 7);
  }

  private gripSockets(): string[] {
    if (this.hand) return ['tip.thumb', 'tip.index', 'tip.middle', 'tip.ring', 'tip.pinky'];
    return ['tip.L', 'palm.L', 'sleeve.L', 'sleeve.R'];
  }

  private eyeSockets(): string[] {
    return this.hand ? ['palm.eye'] : ['eye.L', 'eye.R'];
  }

  /** nerves into a body from `by`'s sockets: the twist, then (with nerves in it, or held) the fold or the ball */
  grip(by: Fighter, o: Fighter, from: string[], final: 'fold' | 'ball' | 'none'): void {
    const { g } = this;
    if (this.grips.some((gr) => gr.o === o)) return;
    const big = by.def.height > 3;
    const lines = from.map(() => new NerveLine(g.engine.gr.scene, big ? 0.09 : 0.035, big ? 0.03 : 0.015, 16));
    const stacked = this.nervesIn(o) >= 3;
    const finalAt = final === 'none' ? 99 : stacked ? 0.55 : final === 'ball' ? 1.3 : 1.6;
    const escapeAt = SHOCK.test(o.def.id) ? 0.5 : o.def.id === 'mayuri' ? 0.6 : 99;
    this.grips.push({ o, by, t: 0, lines, from, final, finalAt, escapeAt, ended: false, heldT: 0, wasDash: o.dashT > 0, scale: null, posed: false });
    this.plant(o, 1);
    flare(g, limbOf(o), 0.4, [1, 0.6, 0.5]);
    if (by === this.f) this.line('Za Konparusorī', 9, '強制執行', GOLD);
  }

  private updateGrips(dt: number): void {
    const { g } = this;
    for (let i = this.grips.length - 1; i >= 0; i--) {
      const gr = this.grips[i];
      const o = gr.o, by = gr.by;
      gr.t += dt;
      if (o.dead || by.dead || (!gr.ended && by.hitstun > 0.4)) {
        this.free(gr, 'cut');
        continue;
      }
      // the nerves: from its fingers into the limb, writhing, flushed while they hold
      const to = limbOf(o);
      const ext = Math.min(1, gr.t / 0.12);
      gr.lines.forEach((l, k) => {
        l.lay(sock(by, gr.from[k]), _w.copy(to).add(_v.set(Math.sin(k * 2.1) * 0.08, Math.cos(k * 1.7) * 0.08, 0)), ext, g.time + k, { sag: 0.25, wiggle: 0.12, freq: 2.5 });
        l.tint = 0.5 + 0.5 * Math.sin(g.time * 9 + k);
      });
      if (!gr.ended) {
        // the twist: the weapon arm seized and wrung, the blood running
        o.armLockT = Math.max(o.armLockT, 0.25);
        o.slowT = Math.max(o.slowT, 0.2);
        o.slowK = Math.max(o.slowK, 0.35);
        g.drain(o, o.maxHp * 0.04 * dt, by);
        if (!gr.posed && !o.def.stance.quad) {
          gr.posed = true;
          registerReactions(o.anim);
          o.anim.play('compel_twist', { hold: true });
          g.sfx.play('crack', o.center(), 0.9);
        }
        if (Math.random() < dt * 6) fleshBurst(g, to, 0.3);
        // the canon counter: a dash tears the arm off and away from the nerves
        const dashing = o.dashT > 0;
        if (dashing && !gr.wasDash) {
          this.amputate(gr);
          continue;
        }
        gr.wasDash = dashing;
        if (o !== g.player && gr.t > 0.5 && Math.random() < dt * 0.55) {
          this.amputate(gr);
          continue;
        }
        if (gr.t >= gr.escapeAt) {
          this.free(gr, SHOCK.test(o.def.id) ? 'shock' : 'free');
          continue;
        }
        if (gr.t >= gr.finalAt) this.finale(gr);
        else if (gr.final === 'none' && gr.t > 2.2) {
          this.free(gr, 'cut');
          continue;
        }
      } else {
        gr.heldT -= dt;
        o.hitstun = Math.max(o.hitstun, 0.1);
        if (gr.heldT <= 0) this.finishGrip(gr);
      }
    }
  }

  /** the fold (the cloak) or the ball (the hand and the arm: giants too) */
  private finale(gr: Grip): void {
    const { g } = this;
    const o = gr.o, by = gr.by;
    gr.ended = true;
    const ball = gr.final === 'ball';
    const dir = _v.subVectors(o.pos, by.pos).setY(0).normalize().clone();
    g.damage(o, ball ? 220 : 150, by, dir, { heavy: true, knock: 1, launch: 0, hitstop: 0.18, shake: 0.7, unblockable: true, color: BLOOD });
    if (o.dead) return;
    if (!o.def.stance.quad) {
      registerReactions(o.anim);
      o.anim.play(ball ? 'compel_ball' : 'compel_fold', { hold: true });
    }
    o.stopAction();
    o.hitstun = Math.max(o.hitstun, ball ? 1.3 : 1.5);
    gr.heldT = ball ? 1.2 : 1.4;
    if (ball && !o.giant) {
      gr.scale = o.visual.object.scale.clone();
      o.visual.object.scale.set(gr.scale.x * 0.9, gr.scale.y * 0.62, gr.scale.z * 0.9);
    }
    fleshBurst(g, o.center(), ball ? 2 : 1.4);
    g.sfx.play('crack', o.center(), 1.4);
    if (by === this.f) {
      this.f.anim.play(this.hand ? (this.giant ? 'pa_ball' : 'ph_ball') : 'pn_fold', { fadeIn: 0.04 });
      this.feed(10);
    }
  }

  private finishGrip(gr: Grip): void {
    const o = gr.o;
    if (gr.scale) o.visual.object.scale.copy(gr.scale);
    gr.scale = null;
    if (!o.dead) {
      o.anim.stopAll(0.25);
      if (gr.final === 'ball') {
        // flung away like a crumpled thing
        const dir = _v.subVectors(o.pos, gr.by.pos).setY(0).normalize();
        o.push.addScaledVector(dir, 24);
        o.body.vel.y = Math.max(o.body.vel.y, 9);
        o.hovering = false;
      }
    }
    this.dropGrip(gr);
  }

  /** let go (cut, acid, a shock, a re-stitched arm) */
  free(gr: Grip, why: 'cut' | 'acid' | 'shock' | 'free'): void {
    const { g } = this;
    if (gr.scale) gr.o.visual.object.scale.copy(gr.scale);
    gr.scale = null;
    if (!gr.o.dead) gr.o.anim.stopAll(0.2);
    if (why === 'shock') g.sparks(limbOf(gr.o), UP, '#CFE8FF', 18);
    this.dropGrip(gr);
  }

  /** the twisted limb torn off and away from the nerves: it costs a piece of them and the weapon arm for a while */
  private amputate(gr: Grip): void {
    const { g } = this;
    const o = gr.o;
    g.drain(o, o.maxHp * 0.08, null);
    o.disarmT = Math.max(o.disarmT, 3);
    const at = limbOf(o);
    fleshBurst(g, at, 2);
    g.sfx.play('crack', at, 1.2);
    g.hud?.floatText(at.clone().setY(o.pos.y + o.def.height + 0.2), 'TORN FREE', BLOOD, 18);
    this.free(gr, 'cut');
  }

  private dropGrip(gr: Grip): void {
    const i = this.grips.indexOf(gr);
    if (i >= 0) this.grips.splice(i, 1);
    for (const l of gr.lines) l.dispose();
    gr.lines.length = 0;
  }

  // ---------------------------------------------------------------- Q

  skill1(): void {
    const { f, g } = this;
    const t = this.target();
    if (t) this.face(t);
    if (this.form === 'cloak') {
      const dir = () => (t ? _v.subVectors(t.center(), f.center()).normalize().clone() : f.forward());
      this.special(new ClipSkill('lance', 'pn_lance', (n) => {
        if (n !== 'fire') return;
        g.addProjectile(new NerveLance(g, f, () => sock(f, 'sleeve.L').lerp(sock(f, 'sleeve.R'), 0.5), dir(), 24, { damage: 60, r: 0.45, bore: 0.5, onHit: (e) => this.plant(e, 2) }, 5, 1));
      }), 16, 'lance', 5);
      return;
    }
    if (this.form === 'voll') {
      this.special(new ClipSkill('wing', 'pv_grab', (n) => {
        if (n !== 'reach') return;
        const fw = f.forward();
        let best: Fighter | null = null, bd = 12;
        for (const e of g.enemiesOf(f)) {
          if (e.dead) continue;
          const d = _v.subVectors(e.pos, f.pos);
          const dist = d.length();
          if (dist < bd && d.setY(0).normalize().dot(fw) > 0.6) { bd = dist; best = e; }
        }
        if (best) {
          this.wingGrab = { o: best, t: 0 };
          this.plant(best, 1);
        }
      }, { dur: 1.9, mobility: 0.05 }), 18, 'wing', 7);
      return;
    }
    // the nerve storm
    const arm = this.giant;
    const k = this.size;
    this.special(new ClipSkill('storm', arm ? 'pa_storm' : 'ph_storm', (n) => {
      if (n !== 'fire') return;
      g.addProjectile(new NerveStorm(g, f, () => sock(f, 'palm.c'), arm ? 24 : 16, (arm ? 30 : 18) * k, { damage: arm ? 55 : 45, r: arm ? 0.6 * k : 0.45, bore: arm ? 1.0 * k : 0.6, onHit: (e) => this.plant(e, 1) }, arm ? 2.4 * k : 1.4));
      this.line('…', 99);
    }, { armor: 0.5, mobility: 0 }), arm ? 34 : 28, 'storm', arm ? 9 : 8);
  }

  /** the wing hand carries what it caught: drawn in, crushed, hurled */
  private updateWingGrab(dt: number): void {
    const wg = this.wingGrab;
    if (!wg) return;
    const { f, g } = this;
    const o = wg.o;
    wg.t += dt;
    if (o.dead || f.dead || this.form !== 'voll') {
      this.wingGrab = null;
      return;
    }
    const hold = f.visual.rig.index('wing.L') >= 0 ? boneAt(f, 'wing.L').addScaledVector(f.forward(), 1.4).setY(f.pos.y + 1.6) : f.center().addScaledVector(f.forward(), 1.6);
    const k = Math.min(1, wg.t / 0.3);
    o.body.pos.lerp(_v.copy(hold).setY(hold.y - o.def.height * 0.5), k * 0.5);
    o.body.vel.set(0, 0, 0);
    o.hitstun = Math.max(o.hitstun, 0.2);
    if (wg.t > 0.3 && wg.t < 1.3) g.drain(o, 30 * dt, f);
    if (wg.t >= 1.3) {
      const fw = f.forward();
      g.damage(o, 60, f, fw.clone(), { knock: 30, launch: 8, heavy: true, hitstop: 0.14, shake: 0.6, color: GOLD });
      this.wingGrab = null;
    }
  }

  // ---------------------------------------------------------------- E: stone hands

  skill2(): void {
    const { f } = this;
    const t = this.target();
    if (t) this.face(t);
    if (this.form === 'cloak' || this.form === 'voll') {
      this.special(new ClipSkill('stone', 'pn_stone', (n) => n === 'press' && this.stoneHands(1, 110), { mobility: 0 }), 22, 'stone', 7);
      return;
    }
    if (this.form === 'hand') {
      this.special(new ClipSkill('stone', 'ph_stone', (n) => {
        if (n !== 'press') return;
        if (!this.wallHands(1.2, 120, 1)) this.stoneHands(1.4, 150);
        else this.stoneHands(1.3, 130);
      }, { mobility: 0, armor: 0.5 }), 26, 'stone', 8);
      return;
    }
    this.special(new ClipSkill('walls', 'pa_walls', (n) => {
      if (n !== 'rise') return;
      const k = this.size;
      if (!this.wallHands(1.8 * k, 160, this.gargT > 0 ? 8 : 4)) this.stoneHands(1.9 * k, 190);
    }, { mobility: 0, armor: 0.6 }), 32, 'stone', 9);
    void f;
  }

  private stoneHands(scale: number, dmg: number): void {
    const { f, g } = this;
    const t = this.target();
    const center = t ? t.pos.clone().addScaledVector(t.body.vel, 0.4).setY(t.pos.y) : f.pos.clone().addScaledVector(f.forward(), 6);
    g.addProjectile(new StoneHands(g, f, center, _v.subVectors(center, f.pos).clone(), scale, dmg, 2.3 * scale, (e) => this.plant(e, 1)));
  }

  /** hands out of every wall near the target (up to n); false when there are none */
  private wallHands(scale: number, dmg: number, n: number): boolean {
    const { f, g } = this;
    const t = this.target();
    if (!t) return false;
    const found: { at: THREE.Vector3; normal: THREE.Vector3; d: number }[] = [];
    const w = g.engine.world;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const d = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      const o = t.pos.clone().setY(t.pos.y + 1.4 + (i % 3) * 0.8);
      const hit = raycastVoxels(w, o.x, o.y, o.z, d.x, d.y, d.z, 16);
      if (!hit || hit.ny !== 0) continue;
      const at = new THREE.Vector3((hit.x + 0.5) * w.vs, (hit.y + 0.5) * w.vs, (hit.z + 0.5) * w.vs);
      if (found.some((h) => h.at.distanceTo(at) < 3)) continue;
      found.push({ at, normal: new THREE.Vector3(hit.nx, hit.ny, hit.nz), d: hit.dist });
    }
    found.sort((a, b) => a.d - b.d);
    for (const h of found.slice(0, n)) g.addProjectile(new WallHand(g, f, h.at, h.normal, t.pos.clone().setY(t.pos.y + 0.6), scale, dmg, (e) => this.plant(e, 1)));
    return found.length > 0;
  }

  // ---------------------------------------------------------------- R: Heilig Bogen

  skill3(): void {
    const { f, g } = this;
    const t = this.target();
    if (t) this.face(t);
    if (!this.hand) {
      this.special(new ClipSkill('bow', 'pn_bow', (n) => {
        if (n === 'draw') {
          f.visual.attach('bow', pernidaProp('bow'), 'grip.L');
          f.visual.rig.setBoneVisible('palm.L', false);
          f.visual.rig.setBoneVisible('fist.L', true);
          this.bows = ['bow'];
          this.line('Hairihhi Bōgen', 10, '神聖弓', '#F3E7B0');
        }
        if (n === 'loose') {
          const from = sock(f, 'grip.L').addScaledVector(f.forward(), 0.5);
          const dir = t ? _v.subVectors(t.center(), from).normalize().clone() : f.forward();
          g.addProjectile(new NerveArrow(g, f, from, dir, t, { damage: 120, size: 1.6, bore: 0.9, speed: 80, turn: 1.6, range: 110, onHit: (e) => this.plant(e, 2) }));
        }
      }, { end: () => this.dropBows(), mobility: 0.05 }), 24, 'bow', 7);
      return;
    }
    const arm = this.giant;
    const k = this.size;
    const tips = ['thumb', 'index', 'middle', 'ring', 'pinky'];
    this.special(new ClipSkill('volley', arm ? 'pa_volley' : 'ph_volley', (n) => {
      if (n === 'draw') {
        for (const tip of tips) {
          f.visual.attach(`bow.${tip}`, pernidaProp('bow-tip'), `tip.${tip}`);
          this.bows.push(`bow.${tip}`);
        }
        this.line('Hairihhi Bōgen', 10, '神聖弓', '#F3E7B0');
      }
      if (n === 'loose') {
        tips.forEach((tip, i) => {
          const from = sock(f, `tip.${tip}`);
          const aim = t ? _v.subVectors(t.center(), from).normalize() : f.forward(_v);
          // fanned out a little: the nerves steer them back in
          const side = new THREE.Vector3(-aim.z, 0, aim.x).multiplyScalar((i - 2) * 0.18);
          const dir = aim.clone().add(side).setY(aim.y + 0.12).normalize();
          g.addProjectile(new NerveArrow(g, f, from, dir, t, { damage: arm ? 34 : 30, size: arm ? 3 * k : 1.8, bore: arm ? 1.4 * k : 0.6, speed: arm ? 90 : 75, turn: 1.9, range: arm ? 150 : 100, onHit: (e) => this.plant(e, 2) }));
        });
      }
    }, { end: () => this.dropBows(), mobility: 0.04, armor: 0.5 }), arm ? 34 : 30, 'volley', 9);
  }

  private dropBows(): void {
    const f = this.f;
    for (const k of this.bows) f.visual.detach(k);
    if (this.bows.includes('bow')) {
      f.visual.rig.setBoneVisible('palm.L', true);
      f.visual.rig.setBoneVisible('fist.L', false);
    }
    this.bows = [];
  }

  // ---------------------------------------------------------------- G

  toggle(): void {
    const { f, g } = this;
    if (this.form === 'voll') {
      this.endVoll();
      return;
    }
    if (this.form === 'cloak') {
      if (this.cd.voll > 0 || f.busy) return;
      if (!f.spendRei(40)) {
        if (f === g.player) g.hud?.showBanner('Not enough reiatsu');
        return;
      }
      this.cd.voll = 2;
      f.act(new ClipSkill('voll', 'pn_voll', (n) => {
        if (n !== 'burst') return;
        this.rebody('voll');
        g.addProjectile(new LightPillar(g, f.pos.clone(), 1.4, 60, '#F7DD84'));
        g.callout('滅却師完聖体', 'QUINCY: VOLLSTÄNDIG', GOLD);
      }, { invulnerable: true, mobility: 0 }), true);
      return;
    }
    // Self-Replication: two fingers bent back and torn off; clones grow from them
    if (this.clones.length >= MAX_CLONES) {
      if (f === g.player) g.hud?.showBanner('Too many of it already');
      return;
    }
    this.special(new ClipSkill('tear', this.giant ? 'pa_tear' : 'ph_tear', (n) => {
      if (n !== 'tear') return;
      this.dropFinger('band.ring');
      this.dropFinger('band.pinky');
      this.line('…ククッ', 6, '', PALE);
    }, { mobility: 0, armor: 0.4 }), 30, 'tear', 14);
  }

  /** a finger torn off at a band: it falls and grows into a clone */
  private dropFinger(band: string): void {
    const { f, g } = this;
    if (this.clones.length + g.projectiles.filter((p) => p instanceof FingerSeed && p.owner === f).length >= MAX_CLONES) return;
    const at = sock(f, band);
    const out = _v.subVectors(at, f.center()).setY(0).normalize().multiplyScalar(5 + Math.random() * 3);
    g.addProjectile(new FingerSeed(g, f, at, new THREE.Vector3(out.x, 5, out.z), this.giant ? 1.6 * this.size : 1, (p) => this.spawnClone(p)));
  }

  spawnClone(at: THREE.Vector3): void {
    const { f, g } = this;
    if (f.dead || this.clones.length >= MAX_CLONES) return;
    const c = g.spawn(pernidaCloneDef(), at.clone().setY(at.y + 0.3), f.team);
    c.yaw = f.yaw;
    const kit = new PernidaCloneKit(c, g, this);
    g.controllers.push(new DuelistAI(g, c, kit, { aggression: 0.8, intro: 0.2 }));
    this.clones.push(c);
    fleshBurst(g, at, 2);
    g.sfx.play('crack', at, 1);
  }

  // ---------------------------------------------------------------- F

  release(): void {
    const { f } = this;
    if (f.busy && !(f.action instanceof StringAction)) return;
    if (this.form === 'cloak' || this.form === 'voll') {
      if (this.cd.release > 0) return;
      if (this.form === 'voll') this.rebody('cloak');
      this.becomeHand(false);
      return;
    }
    if (this.form === 'hand') {
      if (this.cd.release > 0) return;
      this.becomeArm(false);
      return;
    }
    this.devour();
  }

  /** the Arm's hand comes down on a body (folded, balled or down for preference), lifts it to the palm and eats */
  private devour(): void {
    const { f, g } = this;
    const reach = 10 * this.size;
    const hand = sock(f, 'palm.c');
    let best: Fighter | null = null, bs = -Infinity;
    for (const e of g.enemiesOf(f)) {
      if (e.dead || e.giant) continue;
      const d = Math.hypot(e.pos.x - f.pos.x, e.pos.z - f.pos.z);
      if (d > reach) continue;
      const s = (e.hitstun > 0.4 ? 10 : 0) - d;
      if (s > bs) { bs = s; best = e; }
    }
    void hand;
    const target = best;
    if (target) this.face(target);
    this.special(new ClipSkill('devour', 'pa_devour', (n) => {
      if (n === 'grab') {
        if (target && !target.dead && Math.hypot(target.pos.x - f.pos.x, target.pos.z - f.pos.z) < reach) {
          this.devoured = { o: target, bites: 0 };
          target.stopAction();
          g.sfx.play('impact', target.center(), 1);
        }
      }
      if (n === 'open' && this.devoured) {
        f.visual.attach('mouth', pernidaProp('mouth'), 'palm.mouth');
        this.line('…', 99);
      }
      if (n.startsWith('bite') && this.devoured) this.bite();
      if (n === 'drop') this.dropMeal();
    }, { mobility: 0, armor: 0.6, end: () => this.dropMeal() }), 20, 'devour', 10);
  }

  private updateDevour(): void {
    const d = this.devoured;
    if (!d) return;
    const f = this.f;
    if (d.o.dead || f.dead) {
      this.dropMeal();
      return;
    }
    // held in the closed hand, at the palm
    const at = sock(f, 'palm.c');
    d.o.body.pos.set(at.x, at.y - d.o.def.height * 0.5, at.z);
    d.o.body.prev.copy(d.o.body.pos);
    d.o.body.vel.set(0, 0, 0);
    d.o.hitstun = Math.max(d.o.hitstun, 0.2);
    d.o.hovering = false;
  }

  private bite(): void {
    const { f, g } = this;
    const d = this.devoured!;
    d.bites++;
    const o = d.o;
    const before = o.hp;
    g.damage(o, 60, f, UP.clone(), { unblockable: true, heavy: true, knock: 0, hitstop: 0.12, shake: 0.4, color: BLOOD });
    const took = Math.max(0, before - o.hp);
    fleshBurst(g, sock(f, 'palm.mouth'), 2);
    // poisoned flesh: it swells and bursts from inside
    if (ACID.test(o.def.id)) {
      g.drain(f, f.maxHp * 0.04, null);
      fleshBurst(g, f.center(), 3);
      if (d.bites === 1) this.line('…ギ…ッ!?', 4, '', '#9FD08A');
      return;
    }
    f.hp = Math.min(f.maxHp, f.hp + took * 0.3);
    this.feed(5);
  }

  private dropMeal(): void {
    const f = this.f;
    f.visual.detach('mouth');
    const d = this.devoured;
    this.devoured = null;
    if (!d || d.o.dead) return;
    d.o.push.addScaledVector(f.forward(), 12);
    d.o.body.vel.y = 4;
  }

  // ---------------------------------------------------------------- V

  toggleFlare(): void {
    const { f, g } = this;
    if (this.cd.flare > 0 || f.busy) return;
    if (this.meter >= 60) {
      this.cd.flare = 10;
      this.meter -= 60;
      if (this.form === 'arm') {
        // the Gargantuan Arm: it grows over the rooftops
        this.gargT = 20;
        f.act(new ClipSkill('grow', 'pa_grow', () => {}, { invulnerable: true, mobility: 0 }), true);
        g.addProjectile(new LightPillar(g, f.pos.clone(), 2, 120, '#F7DD84'));
        g.callout('前進', 'PROGRESS', GOLD);
        return;
      }
      // Progress: straight to the arm, healed, everything it has learned held twice as hard
      f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.25);
      this.adaptT = 20;
      if (this.form === 'voll') this.rebody('cloak');
      this.becomeArm(true);
      g.callout('前進', 'PROGRESS', GOLD);
      return;
    }
    // silent pressure: the hood ripples, those near flinch, and it learns from them
    this.cd.flare = 8;
    const clip = this.hand ? (this.giant ? 'pa_grow' : 'ph_storm') : 'pn_pressure';
    f.act(new ClipSkill('pressure', clip, () => {}, { mobility: 0, dur: 0.9 }), true);
    this.hoodT = 0.9;
    const c = f.center();
    g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: 1, sizeEnd: 16, life: 0.6, r: 1, g: 0.86, b: 0.4, alpha: 0.5, alphaEnd: 0, tex: TEX_RING });
    for (const e of g.enemiesOf(f)) {
      if (e.dead || e.pos.distanceTo(f.pos) > 8 + f.def.radius) continue;
      e.hitstun = Math.max(e.hitstun, 0.4);
      e.push.addScaledVector(_v.subVectors(e.pos, f.pos).setY(0).normalize(), 6);
      this.feed(8);
    }
  }

  // ---------------------------------------------------------------- HUD and AI

  formName(): string {
    const p = ` · progress ${Math.round(this.meter)}`;
    const cl = this.clones.length ? ` · clones ${this.clones.length}` : '';
    if (this.form === 'voll') return `Vollständig${p}`;
    if (this.form === 'hand') return `The Left Hand${p}${cl}`;
    if (this.form === 'arm') return `${this.gargT > 0 ? `Gargantuan Arm · ${Math.ceil(this.gargT)} s` : 'The Left Arm'}${p}${cl}`;
    return `Sternritter "C" — The Compulsory${p}`;
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    const m = this.meter;
    const V: AbilityInfo = { key: 'V', name: m >= 60 ? (this.form === 'arm' ? 'Gargantuan Arm' : 'Progress') : 'Silent Pressure', kanji: '進', cost: 0, cd: cd.flare, cdMax: 10, active: m >= 60, tint: GOLD };
    const compel: AbilityInfo = { key: 'RMB', name: 'Compulsory', kanji: '強', cost: 18, cd: cd.compel, cdMax: 7, active: this.grips.length > 0, tint: GOLD };
    if (this.form === 'cloak' || this.form === 'voll') {
      const voll = this.form === 'voll';
      return [
        { key: 'LMB', name: voll ? 'Wing Slaps' : 'Nerve Flicks', kanji: voll ? '翼' : '神', cost: 0, cd: 0, cdMax: 0, tint: GOLD },
        compel,
        voll ? { key: 'Q', name: 'Wing Grab', kanji: '掴', cost: 18, cd: cd.wing, cdMax: 7, tint: GOLD } : { key: 'Q', name: 'Nerve Lance', kanji: '槍', cost: 16, cd: cd.lance, cdMax: 5, tint: GOLD },
        { key: 'E', name: 'Stone Hands', kanji: '石', cost: 22, cd: cd.stone, cdMax: 7, tint: GOLD },
        { key: 'R', name: 'Heilig Bogen', kanji: '弓', cost: 24, cd: cd.bow, cdMax: 7, tint: '#F3E7B0' },
        { key: 'G', name: 'Vollständig', kanji: '完', cost: 40, cd: cd.voll, cdMax: 8, active: voll, tint: GOLD },
        { key: 'F', name: 'Unveil', kanji: '手', cost: 0, cd: cd.release, cdMax: 4, tint: GOLD },
        V,
        { key: 'Shift', name: 'Phantom Step', kanji: '歩', cost: 0, cd: 0, cdMax: 0, tint: GOLD },
      ];
    }
    const arm = this.giant;
    return [
      { key: 'LMB', name: arm ? 'Sweep / Slam / Backhand' : 'Rake / Slam / Backhand', kanji: '掌', cost: 0, cd: 0, cdMax: 0, tint: GOLD },
      compel,
      { key: 'Q', name: 'Nerve Storm', kanji: '嵐', cost: arm ? 34 : 28, cd: cd.storm, cdMax: arm ? 9 : 8, tint: GOLD },
      { key: 'E', name: arm ? 'Wall Hands' : 'Twin Stone Hands', kanji: '石', cost: arm ? 32 : 26, cd: cd.stone, cdMax: arm ? 9 : 8, tint: GOLD },
      { key: 'R', name: 'Five-Bow Volley', kanji: '弓', cost: arm ? 34 : 30, cd: cd.volley, cdMax: 9, tint: '#F3E7B0' },
      { key: 'G', name: 'Self-Replication', kanji: '分', cost: 30, cd: cd.tear, cdMax: 14, active: this.clones.length > 0, tint: GOLD },
      arm ? { key: 'F', name: 'Devour', kanji: '喰', cost: 20, cd: cd.devour, cdMax: 10, tint: BLOOD } : { key: 'F', name: 'Break the Chains', kanji: '腕', cost: 0, cd: cd.release, cdMax: 4, tint: GOLD },
      V,
      { key: 'Shift', name: arm ? 'Root Fling' : 'Finger Gallop', kanji: '走', cost: 0, cd: 0, cdMax: 0, tint: GOLD },
    ];
  }

  ai(): KitAI {
    const kit = this;
    const f = this.f;
    const cloak = () => kit.form === 'cloak';
    const handish = () => kit.hand;
    const t = () => kit.target();
    return {
      get reach() {
        // the giant arm reaches everything round its roots: with a technique ready it holds the swats back for it
        if (kit.form === 'arm') return (kit.cd.storm <= 0 || kit.cd.compel <= 0 || kit.cd.volley <= 0 ? 2.5 : 7.5) * kit.size;
        return kit.form === 'hand' ? 4.2 : kit.form === 'voll' ? 4 : 3.6;
      },
      chain: 4,
      moves: [
        { name: 'compel', use: () => this.heavy(), min: 2, max: 10, weight: 3, cd: 3.5, when: () => !handish() && this.cd.compel <= 0 },
        { name: 'compel-hand', use: () => this.heavy(), get min() { return kit.form === 'arm' ? 0 : 3; }, get max() { return 18 * kit.size; }, weight: 3, cd: 3.5, when: () => handish() && this.cd.compel <= 0 },
        { name: 'lance', use: () => this.skill1(), min: 5, max: 22, weight: 2, cd: 3, when: () => cloak() && this.cd.lance <= 0 },
        { name: 'wing', use: () => this.skill1(), min: 2, max: 11, weight: 2.5, cd: 4, when: () => kit.form === 'voll' && this.cd.wing <= 0 },
        { name: 'storm', use: () => this.skill1(), get min() { return kit.form === 'arm' ? 0 : 3; }, max: 26, weight: 2.5, cd: 4, when: () => handish() && this.cd.storm <= 0 },
        { name: 'stone', use: () => this.skill2(), min: 3, max: 18, weight: 2, cd: 4, when: () => this.cd.stone <= 0 && !!t() && t()!.grounded },
        { name: 'bow', use: () => this.skill3(), min: 10, max: 60, weight: 2, cd: 4, when: () => (this.cd.bow <= 0 && !handish()) || (handish() && this.cd.volley <= 0) },
        { name: 'voll', use: () => this.toggle(), min: 0, max: 80, weight: 4, cd: 12, when: () => cloak() && this.cd.voll <= 0 && f.rei > 70 && !!t() && t()!.pos.y > f.pos.y + 3 },
        { name: 'tear', use: () => this.toggle(), min: 0, max: 60, weight: 3, cd: 10, when: () => handish() && this.cd.tear <= 0 && this.clones.length < 2 && (this.g.enemiesOf(f).length > 1 || f.hp < f.maxHp * 0.6) },
        { name: 'devour', use: () => this.release(), min: 0, max: 9, weight: 5, cd: 6, when: () => kit.form === 'arm' && this.cd.devour <= 0 && this.g.enemiesOf(f).some((e) => !e.dead && e.hitstun > 0.4 && e.pos.distanceTo(f.pos) < 9 * kit.size) },
        { name: 'progress', use: () => this.toggleFlare(), min: 0, max: 99, weight: 6, cd: 6, when: () => this.meter >= 60 && this.cd.flare <= 0 },
        { name: 'pressure', use: () => this.toggleFlare(), min: 0, max: 7, weight: 0.6, cd: 10, when: () => this.meter < 60 && this.cd.flare <= 0 },
      ],
      releaseAt: [0.6, 0.35],
      ranged: () => cloak(),
    };
  }
}

// ---------------------------------------------------------------------------------------------- the clones

/**
 * A clone: a hand grown from a severed finger, with the powers of the one it came from — the rake and the slam, the
 * Compulsory (the twist only; it holds the nerves through the original's bookkeeping), a little nerve storm, one arrow.
 */
export class PernidaCloneKit implements Kit {
  private cdC = { compel: 0, storm: 0, bow: 0 };
  private grow = 0;
  private comboIndex = 0;
  private lastEnd = -9;
  constructor(readonly f: Fighter, readonly g: Game, readonly master: PernidaKit) {
    f.data.kit = this;
    f.data.quincy = true;
    f.data.unforeseen = true;
    f.power = 0.6;
    f.toughness = 3;
    f.knockTaken = 0.7;
    f.ghosts.enabled = false;
    f.visual.object.scale.setScalar(0.05);
  }
  private target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 80);
  }
  update(dt: number): void {
    const f = this.f;
    for (const k of Object.keys(this.cdC) as (keyof typeof this.cdC)[]) this.cdC[k] = Math.max(0, this.cdC[k] - dt);
    if (this.grow < 1) {
      this.grow = Math.min(1, this.grow + dt / 1.1);
      f.visual.object.scale.setScalar(CLONE_SCALE * (0.1 + 0.9 * this.grow));
    }
    if (!f.dead) f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.01 * dt);
  }
  attack(): void {
    const { f, g } = this;
    if (f.busy) return;
    if (g.time - this.lastEnd > 0.9) this.comboIndex = 0;
    const i = this.comboIndex++;
    this.lastEnd = g.time + 0.7;
    const t = this.target();
    if (t) f.yaw = Math.atan2(t.pos.x - f.pos.x, t.pos.z - f.pos.z);
    const clip = HAND_CHAIN[i % HAND_CHAIN.length];
    f.act(new ClipSkill(clip, clip, (n) => {
      if (n !== 'hit') return;
      const c = sock(f, 'palm.c').addScaledVector(f.forward(), 0.8);
      for (const e of g.enemiesOf(f)) {
        if (e.dead || e.center().distanceTo(c) > 1.8 + e.def.radius) continue;
        g.damage(e, clip === 'ph_slam' ? 34 : 24, f, f.forward(), { knock: 9, launch: 2, heavy: clip !== 'ph_rake', hitstop: 0.07, shake: 0.25 });
        this.master.plant(e, 1);
      }
    }, { mobility: 0.15 }), true);
  }
  heavy(): void {
    const { f, g } = this;
    if (f.busy || this.cdC.compel > 0) return;
    const t = this.target();
    if (!t || t.pos.distanceTo(f.pos) > 10) return;
    this.cdC.compel = 8;
    f.yaw = Math.atan2(t.pos.x - f.pos.x, t.pos.z - f.pos.z);
    f.act(new ClipSkill('compel', 'ph_compel', (n) => {
      if (n === 'fire' && !t.dead && clearLine(g, sock(f, 'tip.middle'), t.center())) this.master.grip(f, t, ['tip.index', 'tip.middle', 'tip.ring'], 'none');
    }, { dur: 2.4, mobility: 0.05 }), true);
  }
  skill1(): void {
    const { f, g } = this;
    if (f.busy || this.cdC.storm > 0) return;
    this.cdC.storm = 9;
    f.act(new ClipSkill('storm', 'ph_storm', (n) => {
      if (n === 'fire') g.addProjectile(new NerveStorm(g, f, () => sock(f, 'palm.c'), 8, 10, { damage: 26, r: 0.35, bore: 0.35, onHit: (e) => this.master.plant(e, 1) }, 0.9));
    }, { mobility: 0 }), true);
  }
  skill3(): void {
    const { f, g } = this;
    if (f.busy || this.cdC.bow > 0) return;
    this.cdC.bow = 7;
    const t = this.target();
    f.act(new ClipSkill('volley', 'ph_volley', (n) => {
      if (n !== 'loose') return;
      const from = sock(f, 'tip.middle');
      const dir = t ? _v.subVectors(t.center(), from).normalize().clone() : f.forward();
      g.addProjectile(new NerveArrow(g, f, from, dir, t, { damage: 40, size: 1.1, bore: 0.35, speed: 70, turn: 1.6, range: 70, onHit: (e) => this.master.plant(e, 1) }));
    }, { mobility: 0.05 }), true);
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
      reach: 3.2,
      chain: 3,
      moves: [
        { name: 'compel', use: () => this.heavy(), min: 2, max: 10, weight: 2, cd: 4 },
        { name: 'storm', use: () => this.skill1(), min: 2, max: 10, weight: 1.5, cd: 4 },
        { name: 'bow', use: () => this.skill3(), min: 8, max: 30, weight: 1.5, cd: 4 },
      ],
    };
  }
}

void TEX_GLOW;
void TEX_PUFF;
