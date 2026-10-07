// Mayuri Kurotsuchi's kit (docs/roster/B3-captains-3.md, Kit proposal): the scientist. Adequate swordplay, a
// body full of modifications and a sleeve full of inventions; then the poison of Ashisogi Jizō and the
// creature of his Bankai. Unbalanced in the canon way: he wins through preparation, paralysis and poison.
// Sealed — LMB a sweeping slash, a backhand, a needling stab; RMB Jabarakaina (the left arm shoots out,
// seizes, hauls the enemy in); Q the explosive membrane (sticks where it lands and blows); E the sleeve net
// (sticky strands that bind); R the silent palm Kidō (a white bolt that bores through walls).
// F "Kakimushire, Ashisogi Jizō": the trident. Every stab numbs: three in a row and the limbs stop answering
// (paralysis, the pain remains). RMB the deep stab (paralysed at once); Q Kyōdo Yon (a finger in the baby's
// eye: whoever hears the scream for four seconds is paralysed through); E the poison vapour from the baby's
// mouth; R the palm Kidō.
// F "Bankai — Konjiki Ashisogi Jizō": the creature is born out of the baby's mouth and crawls after the enemy;
// his reiatsu turns red and drains. RMB it charges, Q it breathes the poison (a cloud that eats whoever is
// not of his blood), E blades from its chest, R it devours; F the self-destruct protocol (it blows itself
// apart; he is back to the Shikai).
// G the Superhuman Drug, diluted, jabbed into his own neck: for a few seconds the world crawls round him.
// Nikushibuki (once): when a blow would kill him he stabs himself and becomes a puddle, untouchable, seeping
// along the ground, and reforms later, weakened.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { SWORD_BASE_Z, SWORD_TIP_Z, TRIDENT_TIP_Z, mayuriAsset, mayuriProp } from '../../chars/mayuri';
import { MAYURI_CHAIN, MAYURI_CLIPS, MAYURI_STANCE } from '../../chars/mayuriClips';
import { Jabarakaina, KonjikiJizo, KyodoYon, Membrane, PoisonCloud, Puddle, SleeveNet, palmBolt } from '../../vfx/jizo';
import { SphereShape } from '../../destruction/shapes';
import { groundAt } from '../../vfx/iceArts';
import { TEX_GLOW, TEX_PUFF } from '../../vfx/sprites';
import type { AuraStyle } from '../../vfx/aura';

export const AURA_MAYURI: AuraStyle = { core: '#FFD8EC', body: '#F28FC0', rim: '#7A2A50' };
/** his reiatsu turns red while the Bankai is out */
export const AURA_MAYURI_BANKAI: AuraStyle = { core: '#FFC0C0', body: '#D3262A', rim: '#5A0A10' };

type BladeDef = NonNullable<FighterDef['blade']>;
const BLADE: BladeDef = { prop: 'sword', base: [0, 0, SWORD_BASE_Z], tip: [0, 0, SWORD_TIP_Z], color: '#E8ECF2', core: '#FFFFFF' };
const BLADE_SHIKAI: BladeDef = { prop: 'sword', base: [0, 0, 8.5 / 48], tip: [0, 0, TRIDENT_TIP_Z], color: '#C9A8E8', core: '#FFFFFF' };

const SPEED = { run: 9.4, sprint: 25, jump: 13, dash: 25, dashTime: 0.09 };
const PINK = '#F28FC0';
const VIOLET = '#8E5CC0';

function props(shikai: boolean): { key: string; model: ReturnType<typeof mayuriProp>; socket: string }[] {
  return [
    { key: 'sword', model: mayuriProp(shikai ? 'trident' : 'sword'), socket: 'grip.R' },
    { key: 'sheath', model: mayuriProp('sheath-empty'), socket: 'front' },
  ];
}

export const MAYURI_DEF: FighterDef = {
  id: 'mayuri',
  name: 'Mayuri Kurotsuchi',
  title: 'Captain, 12th Division',
  build: () => ({ asset: mayuriAsset(), props: props(false) }),
  stance: MAYURI_STANCE,
  clips: MAYURI_CLIPS,
  aura: AURA_MAYURI,
  blade: BLADE,
  hp: 1050,
  rei: 240,
  speed: { ...SPEED },
  radius: 0.4,
  height: 1.74,
};

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

// ---------------------------------------------------------------------------------------------- actions

class CutAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private hitAt = -1;
  private stopAt = 0;
  queued = false;
  constructor(readonly kit: MayuriKit, readonly clip: string, readonly index: number, readonly deep = false) {
    super();
    this.name = deep ? 'deepstab' : clip;
    this.mobility = 0.18;
    this.airGravity = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.62;
    this.hitAt = c.events.hit ?? -1;
    f.bladeHits.clear();
    const last = this.index === MAYURI_CHAIN.length - 1;
    const shikai = this.kit.form !== 'sealed';
    const spec: BladeSpec = last || this.deep
      ? { damage: this.deep ? 30 : 26, knock: 8, launch: 2, heavy: true, hitstop: 0.08, shake: 0.25, cut: 480, reach: 0.24 }
      : { damage: 20, knock: 6, launch: 0, heavy: false, hitstop: 0.05, shake: 0.14, cut: 400, reach: 0.22 };
    if (shikai) spec.onHit = (o) => this.kit.numb(o, this.deep);
    f.bladeSpec = spec;
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n !== 'step') return;
        // close the gap so the point arrives where the target stands; the lunge stops at striking distance
        const tgt = f.faceTarget;
        let push = 5;
        if (tgt) {
          const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
          this.stopAt = shikai ? 1.35 : 1.2;
          const tau = Math.max(0.05, this.hitAt - (c.events.step ?? 0));
          const per = (1 - Math.exp(-f.pushDrag * tau)) / f.pushDrag;
          push = Math.min(26, Math.max(5, Math.max(0, d - this.stopAt) / per));
        }
        f.push.addScaledVector(f.forward(), push);
        g.sfx.play(last ? 'swingHeavy' : 'swing', f.center(), 0.8);
      },
    });
    if (this.deep) g.callout('疋殺地蔵', 'ASHISOGI JIZŌ', VIOLET);
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
    const open = this.hitAt >= 0 && t >= this.hitAt - 0.07 && t <= this.hitAt + 0.13;
    f.bladeActive = open;
    if (f.trail) f.trail.emitting = open;
    if (!this.deep && this.queued && t >= this.comboAt) {
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
    if (next.name === 'dash' || next instanceof SkillAction) return this.t >= this.hitAt + 0.05;
    return false;
  }
}

abstract class SkillAction extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: MayuriKit) {
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

/** a skill: plays a clip and calls the kit on its events */
class Skill extends SkillAction {
  constructor(kit: MayuriKit, readonly name: string, readonly clip: string, readonly on: (n: string) => void, mobility = 0.2, readonly call?: [string, string, string]) {
    super(kit);
    this.mobility = mobility;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, this.clip, this.on);
    if (this.call) g.callout(this.call[0], this.call[1], this.call[2]);
  }
  override canCancel(next: FighterAction): boolean {
    return this.t > this.dur * 0.6 && (next.name === 'dash' || next instanceof SkillAction);
  }
}

/** the puddle: untouchable, seeping along the ground, until he reforms */
class LiquidAction extends SkillAction {
  readonly name = 'nikushibuki';
  constructor(kit: MayuriKit) {
    super(kit);
    this.mobility = 0.35;
    this.invulnerable = true;
    this.dur = 3.6;
  }
  override start(f: Fighter): void {
    f.anim.play('my_melt', {});
  }
  override update(f: Fighter, g: Game, dt: number): void {
    this.t += dt;
    f.visual.object.visible = this.t < 0.45 || this.t > this.dur - 0.25;
    if (this.t >= this.dur) this.done = true;
    void g;
  }
  override end(f: Fighter): void {
    f.visual.object.visible = true;
  }
}

// ---------------------------------------------------------------------------------------------- the kit

export type MayuriForm = 'sealed' | 'shikai' | 'bankai';

export class MayuriKit implements Kit {
  form: MayuriForm = 'sealed';
  comboIndex = 0;
  flare = false;
  readonly cd = { heavy: 0, membrane: 0, net: 0, kido: 0, kyodo: 0, vapour: 0, drug: 0, release: 0, charge: 0, breath: 0, blades: 0, devour: 0 };
  /** the Bankai creature */
  jizo: KonjikiJizo | null = null;
  /** the Superhuman Drug's few seconds */
  drugT = 0;
  /** Nikushibuki is spent once */
  liquefied = false;
  private lastEnd = 0;
  /** paralysis stacks: three numbing stabs in a short while and the limbs stop */
  private numbs = new Map<number, { n: number; t: number }>();

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.def = { ...f.def, speed: { ...SPEED } };
    this.hands();
    f.onLethal = () => this.onLethal();
    this.applyStats();
  }

  /** the sword hand closed on the hilt, the left open (long fingers) */
  hands(): void {
    const rig = this.f.visual.rig;
    rig.setBoneVisible('fist.R', true);
    rig.setBoneVisible('palm.R', false);
    rig.setBoneVisible('fist.L', false);
    rig.setBoneVisible('palm.L', true);
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    for (const [id, s] of this.numbs) if (g.time - s.t > 4) this.numbs.delete(id);
    if (this.drugT > 0) {
      this.drugT -= dt;
      for (const o of g.enemiesOf(f)) if (!o.dead && o.pos.distanceTo(f.pos) < 26) o.dilate(0.5, 0.3);
    }
    if (this.form === 'bankai') {
      f.rei -= dt * 6;
      if (this.jizo && !this.jizo.alive) this.jizo = null;
      if (f.rei <= 0 || !this.jizo || f.dead) this.endBankai(false);
      // the camera backs off to show it
      if (f === g.player) {
        const cam = g.cam;
        if (cam.dist < 9) cam.dist += (9 - cam.dist) * 0.04;
      }
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

  // ---------------------------------------------------------------- Ashisogi Jizō

  /** a stab of the Shikai numbs: slowed at once, paralysed through on the third (or a deep stab) */
  numb(o: Fighter, deep: boolean): void {
    const { g } = this;
    const s = this.numbs.get(o.id) ?? { n: 0, t: 0 };
    s.n += deep ? 3 : 1;
    s.t = g.time;
    this.numbs.set(o.id, s);
    o.slow(0.5, 1.8);
    if (s.n >= 3) {
      s.n = 0;
      this.paralyse(o, deep ? 1.6 : 1.3);
    }
  }

  paralyse(o: Fighter, t: number): void {
    const { g } = this;
    o.stopAction();
    o.hitstun = Math.max(o.hitstun, t);
    o.slow(0.95, t);
    const c = o.center();
    g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: 2, sizeEnd: 0.3, life: 0.45, r: 1.4, g: 0.6, b: 1.8, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    if (o === g.player) g.hud?.showBanner('Paralysed');
  }

  // ---------------------------------------------------------------- the sealed tricks

  jabara(): void {
    const { f, g } = this;
    const aim = this.aim();
    g.addProjectile(new Jabarakaina(g, f, aim, { range: 14, damage: 18, onCatch: (o) => { if (this.form !== 'sealed') this.numb(o, false); } }));
  }

  membrane(): void {
    const { f, g } = this;
    g.addProjectile(new Membrane(g, f, sock(f, 'palm.L'), this.aim(), { damage: 46, radius: 2.6 }));
  }

  net(): void {
    const { f, g } = this;
    const dir = _v.subVectors(this.aim(), f.center()).normalize();
    g.addProjectile(new SleeveNet(g, f, dir.clone(), { range: 8, spread: 0.42, hold: 2.2 }));
  }

  kido(): void {
    const { f, g } = this;
    const from = sock(f, 'palm.L');
    const dir = _v.subVectors(this.aim(), from).normalize();
    palmBolt(g, f, from, dir.clone(), { range: 34, damage: 38, power: 520 });
    if (f === g.player) g.shake(0.15);
  }

  drug(): void {
    const { f, g } = this;
    this.drugT = 5;
    const c = f.center();
    g.engine.glow.spawn({ x: c.x, y: c.y + 0.5, z: c.z, size: 1.4, sizeEnd: 0.2, life: 0.4, r: 0.4, g: 0.6, b: 2.4, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    g.callout('超人薬', 'SUPERHUMAN DRUG', '#2E6CF2');
    if (f === g.player) g.engine.gr.chroma.offset.set(0.006, 0.006);
  }

  // ---------------------------------------------------------------- the Shikai

  kyodo(): void {
    const { f, g } = this;
    g.addProjectile(new KyodoYon(g, f, () => sock(f, 'grip.R').add(_w.set(0, 0.3, 0)), { radius: 10, dur: 4.6, need: 3.6, paralyse: 3.2 }));
  }

  vapour(): void {
    const { f, g } = this;
    const fw = f.forward(new THREE.Vector3());
    const at = f.pos.clone().addScaledVector(fw, 3);
    g.addProjectile(new PoisonCloud(g, f, at, { radius: 5.5, grow: 1.2, dur: 6, dps: 12, dir: fw }));
  }

  // ---------------------------------------------------------------- the Bankai

  birth(): void {
    const { f, g } = this;
    const fw = f.forward(new THREE.Vector3());
    const at = f.pos.clone().addScaledVector(fw, 7);
    at.y = groundAt(g, at.x, at.y + 4, at.z, 10) ?? f.pos.y;
    this.jizo = new KonjikiJizo(g, f, at, f.yaw);
    g.addProjectile(this.jizo);
    // the ground heaves where it comes up
    g.engine.destruction.carve(new SphereShape(at.clone(), 3.6, 0.5), { mode: 'smash', power: 300, impulse: 12, dust: 1.6 });
    this.form = 'bankai';
    f.setForm({ asset: mayuriAsset(), props: props(true) }, AURA_MAYURI_BANKAI, BLADE_SHIKAI);
    this.hands();
    g.sfx.play('bankai', f.center(), 1);
    if (f === g.player) g.shake(0.6);
  }

  breath(): void {
    const { f, g } = this;
    const j = this.jizo;
    if (!j) return;
    j.command('breath', this.target());
    const fw = j.forward(new THREE.Vector3());
    const m = j.breathPoint(new THREE.Vector3());
    // the gas pours out over everything ahead of it
    for (let i = 0; i < 60; i++) {
      const d = fw.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), (Math.random() - 0.5) * 1.2);
      const sp = 6 + Math.random() * 10;
      g.engine.dust.spawn({ x: m.x, y: m.y, z: m.z, vx: d.x * sp, vy: -1 + Math.random() * 2, vz: d.z * sp, size: 1.2, sizeEnd: 5 + Math.random() * 3, life: 1.6 + Math.random(), r: 0.5, g: 0.33, b: 0.68, alpha: 0.5, alphaEnd: 0, drag: 1.4, tex: TEX_PUFF });
    }
    const at = j.pos.clone().addScaledVector(fw, 12);
    g.addProjectile(new PoisonCloud(g, f, at, { radius: 18, grow: 2.2, dur: 10, dps: 20 }));
    g.sfx.play('torrent', m, 1);
  }

  bladesOut(): void {
    this.jizo?.command('blades', this.target());
    this.g.sfx.play('swingHeavy', this.jizo?.pos ?? this.f.pos, 1.2);
  }

  charge(): void {
    this.jizo?.command('charge', this.target());
    this.g.sfx.play('roarBig', this.jizo?.pos ?? this.f.pos, 1);
  }

  devour(): void {
    this.jizo?.command('devour', this.target(), (o) => {
      if (o === this.g.player) this.g.hud?.showBanner('Devoured');
    });
  }

  /** the self-destruct protocol: it blows itself apart; he is back to the Shikai */
  selfDestruct(): void {
    const { f, g } = this;
    const j = this.jizo;
    if (!j) return;
    j.explode((at) => {
      g.engine.destruction.carve(new SphereShape(at, 7.5, 0.8), { mode: 'explode', power: 900, impulse: 22 });
      g.sfx.play('explode', at, 1.6);
      g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, size: 14, sizeEnd: 3, life: 0.6, r: 2.6, g: 1.2, b: 0.6, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
      for (const o of g.enemiesOf(f)) {
        _v.subVectors(o.center(_w), at);
        const d = _v.length();
        if (d > 11 + o.def.radius) continue;
        g.damage(o, 120 * (1 - d / 14), f, _v.setY(0).normalize().clone(), { knock: 30, launch: 10, heavy: true, hitstop: 0.16, shake: 0.8 });
      }
      if (f === g.player || g.player) g.shake(0.8);
    });
    this.endBankai(true);
  }

  /** the Bankai ends: back to the Shikai (spent: the reiatsu is gone) */
  endBankai(blown: boolean): void {
    const { f, g } = this;
    if (this.form !== 'bankai') return;
    this.jizo?.dismiss();
    this.jizo = null;
    this.form = 'shikai';
    this.cd.release = blown ? 20 : 30;
    if (!f.dead) {
      f.setForm({ asset: mayuriAsset(), props: props(true) }, AURA_MAYURI, BLADE_SHIKAI);
      this.hands();
    }
    if (f === g.player && !blown) g.hud?.showBanner('The Bankai is spent');
  }

  // ---------------------------------------------------------------- Nikushibuki

  private onLethal(): boolean {
    const { f, g } = this;
    if (this.liquefied) return false;
    this.liquefied = true;
    // he melts away and reforms weakened
    f.hp = f.maxHp * 0.25;
    if (this.form === 'bankai') this.endBankai(false);
    f.stopAction();
    f.act(new LiquidAction(this), true);
    g.addProjectile(new Puddle(g, f, 3.6));
    g.callout('肉飛沫', 'NIKUSHIBUKI', '#E9E6DE');
    return true;
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

  private skill(name: string, clip: string, ev: string, fn: () => void, mobility = 0.2, call?: [string, string, string]): Skill {
    return new Skill(this, name, clip, (n) => { if (n === ev) fn(); }, mobility, call);
  }

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof CutAction) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastEnd > 0.7) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const idx = i % MAYURI_CHAIN.length;
    this.comboIndex = idx + 1;
    this.lastEnd = this.g.time + 0.7;
    this.f.act(new CutAction(this, MAYURI_CHAIN[idx], idx), true);
  }

  heavy(): void {
    if (this.form === 'sealed') this.special(this.skill('jabara', 'my_jabara', 'fire', () => this.jabara(), 0.1, ['蛇腹腕', 'JABARAKAINA', PINK]), 14, 'heavy', 4);
    else if (this.form === 'shikai') this.special(new CutAction(this, 'my_stab', 2, true), 12, 'heavy', 3.2);
    else this.special(this.skill('charge', 'my_command', 'go', () => this.charge(), 0.4), 22, 'charge', 4.5);
  }

  skill1(): void {
    if (this.form === 'sealed') this.special(this.skill('membrane', 'my_toss', 'throw', () => this.membrane(), 0.3), 12, 'membrane', 3);
    else if (this.form === 'shikai') this.special(this.skill('kyodo', 'my_kyodo', 'scream', () => this.kyodo(), 0.1, ['疋殺地蔵 恐度四', 'KYŌDO YON', VIOLET]), 30, 'kyodo', 14);
    else this.special(this.skill('breath', 'my_command', 'go', () => this.breath(), 0.4, ['毒', 'POISON', VIOLET]), 30, 'breath', 9);
  }

  skill2(): void {
    if (this.form === 'sealed') this.special(this.skill('net', 'my_web', 'spray', () => this.net(), 0.05), 14, 'net', 6);
    else if (this.form === 'shikai') this.special(this.skill('vapour', 'my_vapour', 'gas', () => this.vapour(), 0.15), 18, 'vapour', 7);
    else this.special(this.skill('blades', 'my_command', 'go', () => this.bladesOut(), 0.4), 18, 'blades', 4);
  }

  skill3(): void {
    if (this.form === 'bankai') this.special(this.skill('devour', 'my_command', 'go', () => this.devour(), 0.4), 20, 'devour', 8);
    else this.special(this.skill('kido', 'my_kido', 'fire', () => this.kido(), 0.15), 18, 'kido', 4);
  }

  toggle(): void {
    this.special(this.skill('drug', 'my_drug', 'inject', () => this.drug(), 0.3), 30, 'drug', 22);
  }

  release(): void {
    const { f, g } = this;
    if (this.form === 'bankai') {
      this.selfDestruct();
      return;
    }
    if (this.cd.release > 0 || f.busy) return;
    if (this.form === 'sealed') {
      if (!f.spendRei(20)) return this.broke();
      this.cd.release = 2;
      f.act(this.skill('shikai', 'my_shikai', 'form', () => this.toShikai(), 0.2, ['掻き毟れ', 'KAKIMUSHIRE, ASHISOGI JIZŌ', VIOLET]), true);
      return;
    }
    if (!f.spendRei(60)) return this.broke();
    this.cd.release = 4;
    f.act(this.skill('bankai', 'my_bankai', 'birth', () => this.birth(), 0, ['金色疋殺地蔵', 'BANKAI — KONJIKI ASHISOGI JIZŌ', '#D3262A']), true);
    g.sfx.play('charge', f.center(), 0.8);
  }

  private broke(): void {
    if (this.f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
  }

  private toShikai(): void {
    const { f, g } = this;
    this.form = 'shikai';
    f.setForm({ asset: mayuriAsset(), props: props(true) }, AURA_MAYURI, BLADE_SHIKAI);
    this.hands();
    f.aura.flare(1.3, 0.5);
    g.sfx.play('flare', f.center(), 0.8);
    // the vapour seeps from the baby's mouth at intervals (a wisp now)
    const p = sock(f, 'grip.R');
    for (let i = 0; i < 10; i++) g.engine.dust.spawn({ x: p.x, y: p.y + 0.3, z: p.z, vx: (Math.random() - 0.5), vy: 0.6, vz: (Math.random() - 0.5), size: 0.3, sizeEnd: 1.2, life: 1.2, r: 0.5, g: 0.33, b: 0.68, alpha: 0.5, alphaEnd: 0, drag: 1, tex: TEX_PUFF });
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
    f.power = (this.flare ? 1.2 : 1) * (this.drugT > 0 ? 1.12 : 1);
    f.aura.target = this.flare ? 1 : this.form === 'bankai' ? 0.55 : this.drugT > 0 ? 0.35 : 0.05;
  }

  formName(): string {
    const name = this.form === 'bankai' ? 'Bankai — Konjiki Ashisogi Jizō' : this.form === 'shikai' ? 'Shikai — Ashisogi Jizō' : 'Captain, 12th Division';
    return this.drugT > 0 ? `${name} · Superhuman Drug` : name;
  }

  ai(): KitAI {
    const kit = this;
    const sealed = () => kit.form === 'sealed', shikai = () => kit.form === 'shikai', bankai = () => kit.form === 'bankai';
    return {
      get reach() {
        return kit.form === 'shikai' ? 2.0 : 1.8;
      },
      chain: 3,
      releaseAt: [0.85, 0.5],
      toggleAt: 0.7,
      toggleOn: () => kit.drugT > 0,
      ranged: () => kit.form !== 'shikai',
      moves: [
        { name: 'jabara', use: () => this.heavy(), min: 4, max: 13, weight: 1.1, cd: 4, when: sealed },
        { name: 'membrane', use: () => this.skill1(), min: 4, max: 18, weight: 1.2, cd: 3, when: sealed },
        { name: 'net', use: () => this.skill2(), min: 0, max: 6, weight: 0.9, cd: 6, when: sealed },
        { name: 'kido', use: () => this.skill3(), min: 5, max: 30, weight: 1, cd: 4, when: () => !bankai() },
        { name: 'deep', use: () => this.heavy(), min: 0, max: 2.6, weight: 1.1, cd: 3, when: shikai },
        { name: 'kyodo', use: () => this.skill1(), min: 0, max: 8, weight: 1.2, cd: 14, when: shikai },
        { name: 'vapour', use: () => this.skill2(), min: 0, max: 7, weight: 0.9, cd: 7, when: shikai },
        { name: 'charge', use: () => this.heavy(), min: 5, max: 40, weight: 1, cd: 4.5, when: bankai },
        { name: 'breath', use: () => this.skill1(), min: 4, max: 30, weight: 1.3, cd: 9, when: bankai },
        { name: 'blades', use: () => this.skill2(), min: 0, max: 14, weight: 1, cd: 4, when: bankai },
        { name: 'devour', use: () => this.skill3(), min: 0, max: 12, weight: 0.9, cd: 8, when: bankai },
        { name: 'boom', use: () => this.release(), min: 0, max: 14, weight: 0.6, cd: 20, when: () => bankai() && this.f.rei < 40 },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    const drug = { key: 'G', name: 'Superhuman Drug', kanji: '超人薬', cost: 30, cd: cd.drug, cdMax: 22, active: this.drugT > 0 };
    const flare = { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare };
    if (this.form === 'bankai')
      return [
        { key: 'LMB', name: 'Ashisogi Jizō', kanji: '疋殺' },
        { key: 'RMB', name: 'Charge', kanji: '突', cost: 22, cd: cd.charge, cdMax: 4.5 },
        { key: 'Q', name: 'Poison breath', kanji: '毒', cost: 30, cd: cd.breath, cdMax: 9 },
        { key: 'E', name: 'Chest blades', kanji: '刃', cost: 18, cd: cd.blades, cdMax: 4 },
        { key: 'R', name: 'Devour', kanji: '喰', cost: 20, cd: cd.devour, cdMax: 8 },
        { key: 'Shift', name: 'Shunpo', kanji: '瞬歩' },
        drug, flare,
        { key: 'F', name: 'Self-destruct', kanji: '自壊' },
      ];
    if (this.form === 'shikai')
      return [
        { key: 'LMB', name: 'Ashisogi Jizō', kanji: '疋殺' },
        { key: 'RMB', name: 'Deep stab', kanji: '刺', cost: 12, cd: cd.heavy, cdMax: 3.2 },
        { key: 'Q', name: 'Kyōdo Yon', kanji: '恐度四', cost: 30, cd: cd.kyodo, cdMax: 14 },
        { key: 'E', name: 'Poison vapour', kanji: '毒霧', cost: 18, cd: cd.vapour, cdMax: 7 },
        { key: 'R', name: 'Palm Kidō', kanji: '鬼道', cost: 18, cd: cd.kido, cdMax: 4 },
        { key: 'Shift', name: 'Shunpo', kanji: '瞬歩' },
        drug, flare,
        { key: 'F', name: 'Bankai', kanji: '卍解', cost: 60, cd: cd.release, cdMax: 30 },
      ];
    return [
      { key: 'LMB', name: 'Sword', kanji: '刀' },
      { key: 'RMB', name: 'Jabarakaina', kanji: '蛇腹腕', cost: 14, cd: cd.heavy, cdMax: 4 },
      { key: 'Q', name: 'Explosive membrane', kanji: '爆膜', cost: 12, cd: cd.membrane, cdMax: 3 },
      { key: 'E', name: 'Sleeve net', kanji: '網', cost: 14, cd: cd.net, cdMax: 6 },
      { key: 'R', name: 'Palm Kidō', kanji: '鬼道', cost: 18, cd: cd.kido, cdMax: 4 },
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩' },
      drug, flare,
      { key: 'F', name: 'Kakimushire', kanji: '掻き毟れ', cost: 20 },
    ];
  }
}
