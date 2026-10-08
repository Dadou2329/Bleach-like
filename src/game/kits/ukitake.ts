// Jūshirō Ukitake's kit (docs/roster/B3-captains-3.md, Kit proposal). Sealed, Captain of the 13th: quick,
// exact cuts at vital points and a thrust; RMB the step-in slash with both hands; Q Bakudō #8 Seki (a disc
// of light out of the palm that bounces whoever is close); E Hadō #31 Shakkahō; R Kaidō (a slow heal); G
// he pushes through his illness for a while — stronger, no coughing — and pays for it after. Below half
// health the illness takes him now and then: a coughing fit, doubled over. F: "Nami kotogotoku waga tate to
// nare, ikazuchi kotogotoku waga yaiba to nare — Sōgyo no Kotowari": the blade comes apart into two, tied
// by a red rope with five charms. The left blade drinks any reishi attack that comes at it from the front
// (Ceros, Getsuga, Kidō, arrows, flames — not blades or fists) up to what the charms can hold; the charms
// light as it fills; E fires it back from the right blade, faster and harder, in its own colour. LMB the
// twin dance; RMB the rope lashed across; Q the absorbing guard (wider, and beams end on the blade); F the
// charms shaken bright: the next return hits half again as hard. There is no Bankai: it was never shown.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { DamageOpts, Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { KATANA_TIP_Z, SOGYO_POMMEL, SOGYO_TIP_Z, ukitakeAsset, ukitakeProp } from '../../chars/ukitake';
import { SOGYO_CHAIN, SOGYO_STANCE, UKITAKE_CHAIN, UKITAKE_CLIPS, UKITAKE_STANCE } from '../../chars/ukitakeClips';
import { SekiDisc, SogyoRope, energyCatch } from '../../vfx/sogyo';
import { CeroShot } from '../../vfx/lobos';
import { CeroBeam } from '../projectiles/cero';
import { Shakkaho } from '../projectiles/shakkaho';
import { SwordTrail } from '../../vfx/trail';
import { TEX_GLOW, TEX_PUFF } from '../../vfx/sprites';
import type { AuraStyle } from '../../vfx/aura';

export const AURA_UKITAKE: AuraStyle = { core: '#EAF2EE', body: '#C9DDD3', rim: '#6E8A7E' };

type BladeDef = NonNullable<FighterDef['blade']>;
const BLADE_KATANA: BladeDef = { prop: 'sword', base: [0, 0, 0.13], tip: [0, 0.03, KATANA_TIP_Z], color: '#C9DDD3', core: '#F3F6F2' };
const BLADE_SOGYO: BladeDef = { prop: 'sword', base: [0, 0, 0.11], tip: [0, 0, SOGYO_TIP_Z], color: '#C9DDD3', core: '#F3F6F2' };

const SPEED = { run: 10, sprint: 32, jump: 14, dash: 28, dashTime: 0.09 };
/** what the charms can hold (damage) */
const CAPACITY = 520;

function sealedProps(): { key: string; model: ReturnType<typeof ukitakeProp>; socket: string }[] {
  return [
    { key: 'sword', model: ukitakeProp('katana'), socket: 'grip.R' },
    { key: 'sheath', model: ukitakeProp('sheath-empty'), socket: 'hip.L' },
  ];
}

export const UKITAKE_DEF: FighterDef = {
  id: 'ukitake',
  name: 'Jūshirō Ukitake',
  title: 'Captain, 13th Division',
  build: () => ({ asset: ukitakeAsset(), props: sealedProps() }),
  stance: UKITAKE_STANCE,
  clips: UKITAKE_CLIPS,
  aura: AURA_UKITAKE,
  blade: BLADE_KATANA,
  hp: 1050,
  rei: 220,
  speed: { ...SPEED },
  radius: 0.38,
  height: 1.87,
};

type Form = 'sealed' | 'shikai';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

/** Light cuts: the right blade's window at 'hit', the left one's at 'hitL', 'combo' to chain. */
class CutAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private hitAt = -1;
  private hitLAt = -1;
  queued = false;
  constructor(readonly kit: UkitakeKit, readonly clip: string, readonly index: number, readonly last: boolean) {
    super();
    this.name = clip;
    this.mobility = 0.22;
    this.airGravity = 0.15;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    this.hitAt = c.events.hit ?? -1;
    this.hitLAt = c.events.hitL ?? -1;
    const thrust = this.clip === 'uk_cut4';
    f.bladeHits.clear();
    this.kit.leftHits.clear();
    // vital points: the thrust lands hard
    f.bladeSpec = { damage: thrust ? 30 : 16, knock: thrust ? 14 : 6, launch: this.last ? 4 : 0, heavy: thrust, hitstop: thrust ? 0.09 : 0.04, shake: thrust ? 0.3 : 0.12, cut: thrust ? 300 : 220 };
    this.kit.leftSpec = { damage: 14, knock: 6, launch: this.last ? 4 : 0, hitstop: 0.04, shake: 0.12, cut: 200 };
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n !== 'step') return;
        const tgt = f.faceTarget;
        const extra = tgt ? Math.min(5, Math.max(0, f.pos.distanceTo(tgt) - 1.5)) : 0;
        f.push.addScaledVector(f.forward(), (thrust ? 10 : 7) + extra * 3.4);
        g.sfx.play('swing', f.center(), 0.7);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    f.bladeActive = this.hitAt >= 0 && t >= this.hitAt - 0.05 && t <= this.hitAt + 0.1;
    this.kit.leftActive = this.hitLAt >= 0 && t >= this.hitLAt - 0.05 && t <= this.hitLAt + 0.1;
    if (f.trail) f.trail.emitting = this.hitAt >= 0 && t >= this.hitAt - 0.08 && t <= this.hitAt + 0.1;
    this.kit.leftTrail.emitting = this.hitLAt >= 0 && t >= this.hitLAt - 0.08 && t <= this.hitLAt + 0.1;
    if (this.queued && t >= this.comboAt) {
      this.done = true;
      this.kit.chain(this.index + 1);
      return;
    }
    if (t >= this.dur) this.done = true;
  }
  override end(f: Fighter): void {
    f.bladeActive = false;
    this.kit.leftActive = false;
    if (f.trail) f.trail.emitting = false;
    this.kit.leftTrail.emitting = false;
  }
  override canCancel(next: FighterAction): boolean {
    if (next.name === 'dash' || next instanceof SkillAction) return this.t >= Math.max(this.hitAt, this.hitLAt) + 0.03;
    return false;
  }
}

abstract class SkillAction extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: UkitakeKit) {
    super();
  }
  protected playClip(f: Fighter, clip: string, onEvent: (n: string) => void, opts: { speed?: number; hold?: boolean } = {}): void {
    const c = f.anim.clip(clip)!;
    const speed = opts.speed ?? 1;
    this.dur = (c.dur - c.fadeOut * 0.5) / speed;
    f.anim.play(clip, { onEvent, speed, hold: opts.hold });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= this.dur) this.done = true;
  }
  override end(f: Fighter): void {
    f.bladeActive = false;
    this.kit.leftActive = false;
    if (f.trail) f.trail.emitting = false;
    this.kit.leftTrail.emitting = false;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t > this.dur * 0.5;
  }
}

/** RMB (sealed): the step-in slash, both hands, over the shoulder and down across. */
class IaiAction extends SkillAction {
  readonly name = 'iai';
  private hit = 0.26;
  constructor(kit: UkitakeKit) {
    super(kit);
    this.mobility = 0.1;
    this.armor = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    f.bladeSpec = { damage: 42, knock: 16, launch: 3, heavy: true, hitstop: 0.11, shake: 0.4, cut: 480 };
    this.playClip(f, 'uk_iai', (n) => {
      if (n !== 'step') return;
      const tgt = f.faceTarget;
      const extra = tgt ? Math.min(6, Math.max(0, f.pos.distanceTo(tgt) - 1.6)) : 0;
      f.push.addScaledVector(f.forward(), 8 + extra * 2.6);
      g.sfx.play('swingHeavy', f.center(), 0.9);
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    f.bladeActive = this.t >= this.hit - 0.06 && this.t <= this.hit + 0.1;
    if (f.trail) f.trail.emitting = this.t >= this.hit - 0.1 && this.t <= this.hit + 0.12;
  }
}

/** Q (sealed): Bakudō #8 Seki — a disc of light out of the palm; whoever is close is thrown back. */
class SekiAction extends SkillAction {
  readonly name = 'seki';
  constructor(kit: UkitakeKit) {
    super(kit);
    this.mobility = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'uk_seki', (n) => n === 'cast' && this.kit.seki());
    g.callout('縛道の八 斥', 'BAKUDŌ #8 — SEKI', '#cfe6ff');
  }
}

/** E (sealed): Hadō #31 Shakkahō — the red ball from the left palm. */
class ShakkahoAction extends SkillAction {
  readonly name = 'shakkaho';
  constructor(kit: UkitakeKit) {
    super(kit);
    this.mobility = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'uk_shakkaho', (n) => {
      if (n === 'charge') g.callout('破道の三十一 赤火砲', 'HADŌ #31 — SHAKKAHŌ', '#ff7a5a');
      if (n === 'fire') {
        const p = sock(f, 'palm.L');
        const dir = this.kit.aim().sub(p).normalize();
        g.addProjectile(new Shakkaho(f, g, p, dir, { damage: 44, speed: 34, size: 0.5, blast: 1.9, range: 80 }));
      }
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t > 0.1 && this.t < 0.42 && Math.random() < 0.7) {
      const p = sock(f, 'palm.L');
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5), vy: Math.random(), vz: (Math.random() - 0.5), size: 0.2 + this.t * 0.8, sizeEnd: 0.05, life: 0.18, r: 1, g: 0.35, b: 0.2, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
  }
}

/** R: Kaidō — the left hand laid on his chest, a slow green heal. */
class KaidoAction extends SkillAction {
  readonly name = 'kaido';
  constructor(kit: UkitakeKit) {
    super(kit);
    this.mobility = 0.15;
  }
  override start(f: Fighter): void {
    this.playClip(f, 'uk_kaido', (n) => n === 'heal' && this.kit.heal());
  }
}

/** The illness: a coughing fit. He can do nothing until it passes. */
class CoughAction extends SkillAction {
  readonly name = 'cough';
  constructor(kit: UkitakeKit) {
    super(kit);
    this.mobility = 0;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'uk_cough', (n) => {
      if (n === 'cough' || n === 'blood') this.kit.coughBlood(n === 'blood' ? 14 : 6);
      if (n === 'cough') g.sfx.play('hit', f.center(), 0.3);
    });
  }
  override canCancel(): boolean {
    return false;
  }
}

/** F (sealed): the command, the blade held upright in both hands — and it comes apart into two. */
class ReleaseAction extends SkillAction {
  readonly name = 'release';
  constructor(kit: UkitakeKit) {
    super(kit);
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'uk_release', (n) => {
      if (n === 'chant') {
        g.callout('波悉く我が盾となれ 雷悉く我が刃となれ', 'NAMI KOTOGOTOKU WAGA TATE TO NARE…', '#e8f4ee');
        f.aura.flare(1.2, 0.4);
      }
      if (n === 'split') this.kit.becomeShikai();
    });
  }
}

/** RMB (Shikai): the rope lashed across between the two hilts. */
class RopeAction extends SkillAction {
  readonly name = 'rope';
  private from = 0.18;
  private to = 0.44;
  private hit = new Set<number>();
  constructor(kit: UkitakeKit) {
    super(kit);
    this.mobility = 0.15;
    this.armor = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'uk_rope', (n) => {
      if (n === 'step') f.push.addScaledVector(f.forward(), 6);
      if (n === 'lash') {
        g.sfx.play('swingHeavy', f.center(), 0.8);
        this.kit.rope?.fling(f.forward(_w).clone(), 9);
      }
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t < this.from || this.t > this.to) return;
    const pts = this.kit.rope?.points;
    if (!pts) return;
    const fw = f.forward(_w);
    for (const o of g.enemiesOf(f)) {
      if (this.hit.has(o.id)) continue;
      // the rope itself, or the arc it sweeps out in front of him
      _v.subVectors(o.pos, f.pos).setY(0);
      const d = _v.length();
      let near = d < 2.4 + o.def.radius && _v.normalize().dot(fw) > 0.2 && Math.abs(o.pos.y - f.pos.y) < 1.8;
      const bottom = o.pos.y + 0.1, top = o.pos.y + o.def.height;
      for (const q of pts) {
        if (near) break;
        const cy = Math.max(bottom, Math.min(top, q.y));
        near = Math.hypot(q.x - o.pos.x, q.y - cy, q.z - o.pos.z) < o.def.radius + 0.3;
      }
      if (!near) continue;
      this.hit.add(o.id);
      _v.subVectors(o.pos, f.pos).setY(0).normalize();
      g.damage(o, 30, f, _v.clone(), { knock: 18, launch: 3, heavy: true, hitstop: 0.08, shake: 0.3 });
      g.sparks(o.center(), _v, '#B32025', 10);
    }
  }
}

/** Q (Shikai): the absorbing guard — the left blade raised at the attack; beams end on it. */
class AbsorbAction extends SkillAction {
  readonly name = 'absorb';
  constructor(kit: UkitakeKit) {
    super(kit);
    this.mobility = 0.3;
    this.armor = 0.25;
  }
  override start(f: Fighter): void {
    this.playClip(f, 'uk_absorb', () => {}, { hold: true });
    this.dur = 2.4;
    this.kit.absorbing = true;
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.absorbing = false;
    f.anim.stopAll(0.2);
  }
  override canCancel(next: FighterAction): boolean {
    // the return can follow at once
    return next instanceof ReturnAction || (next.name === 'dash' && this.t > 0.3);
  }
}

/** E (Shikai): the return — the right blade thrust out, the stored attack leaving its point. */
class ReturnAction extends SkillAction {
  readonly name = 'return';
  constructor(kit: UkitakeKit) {
    super(kit);
    this.mobility = 0.1;
  }
  override start(f: Fighter): void {
    this.playClip(f, 'uk_return', (n) => n === 'fire' && this.kit.fireReturn());
  }
}

/** F (Shikai): the charms shaken bright — the next return hits half again as hard. */
class CharmsAction extends SkillAction {
  readonly name = 'charms';
  constructor(kit: UkitakeKit) {
    super(kit);
    this.mobility = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'uk_charms', (n) => {
      if (n !== 'glow') return;
      this.kit.overdrive = true;
      if (this.kit.rope) this.kit.rope.blaze = 1;
      g.sfx.play('flare', f.center(), 0.6);
      f.aura.flare(1.2, 0.3);
    });
  }
}

export class UkitakeKit implements Kit {
  form: Form = 'sealed';
  flare = false;
  comboIndex = 0;
  /** the charms' store: damage waiting to be fired back, and its colour */
  stored = 0;
  readonly storedColor = new THREE.Color('#FFF2C9');
  /** whose attacks filled the store (the largest share is whose own power the return is) */
  private storedBy = new Map<Fighter, number>();
  overdrive = false;
  absorbing = false;
  /** pushing through the illness (s left) */
  pushT = 0;
  rope: SogyoRope | null = null;
  readonly cd = { iai: 0, seki: 0, shakkaho: 0, kaido: 0, push: 0, rope: 0, absorb: 0, ret: 0, charms: 0 };
  // the left blade (Shikai): sampled here, the right one by the fighter
  readonly leftTrail: SwordTrail;
  readonly leftHits = new Set<number>();
  leftActive = false;
  leftSpec: BladeSpec | null = null;
  private leftBase = new THREE.Vector3();
  private leftTip = new THREE.Vector3();
  private prevLB = new THREE.Vector3();
  private prevLT = new THREE.Vector3();
  private leftValid = false;
  private lastEnd = 0;
  private healT = 0;
  private coughT = 12;
  private crashed = false;
  /** sealed: an energy attack came at him (the AI releases at once) */
  wantRelease = false;
  private tip: THREE.Object3D | null = null;

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    this.leftTrail = new SwordTrail(30, AURA_UKITAKE.body, AURA_UKITAKE.core);
    g.engine.gr.scene.add(this.leftTrail.mesh);
    f.parry = (amount, from, o) => this.tryAbsorb(amount, from, o);
    this.hands();
    this.applyStats();
  }

  private hands(): void {
    const rig = this.f.visual.rig;
    const shikai = this.form === 'shikai';
    rig.setBoneVisible('fist.R', true);
    rig.setBoneVisible('palm.R', false);
    rig.setBoneVisible('fist.L', shikai);
    rig.setBoneVisible('palm.L', !shikai);
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    if (this.healT > 0) {
      this.healT -= dt;
      f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.06 * dt);
      if (Math.random() < 0.5) {
        const p = sock(f, 'chest.front');
        g.engine.glow.spawn({ x: p.x + (Math.random() - 0.5) * 0.4, y: p.y + (Math.random() - 0.5) * 0.4, z: p.z + (Math.random() - 0.5) * 0.4, vx: 0, vy: 0.6, vz: 0, size: 0.16, sizeEnd: 0.04, life: 0.6, r: 0.55, g: 1, b: 0.6, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
      }
    }
    // the illness: pushing through it holds it off, then it takes its due
    if (this.pushT > 0) {
      this.pushT -= dt;
      if (this.pushT <= 0) this.crashed = true;
    }
    if (!f.dead && !f.busy && (this.crashed || (this.pushT <= 0 && f.hp < f.maxHp * 0.45 && (this.coughT -= dt) <= 0))) {
      this.crashed = false;
      this.coughT = 14 + Math.random() * 8;
      f.act(new CoughAction(this), true);
    }
    if (this.rope) {
      this.rope.fill = this.stored / CAPACITY;
      this.rope.color.copy(this.storedColor);
      this.rope.blaze = Math.max(0, this.rope.blaze - dt * (this.overdrive ? 0.1 : 1.5));
    }
    // beams end on the left blade when it can catch them
    const a = f.action;
    f.beamStop = this.form === 'shikai' && (this.absorbing || !a || a instanceof ReturnAction);
    this.sampleLeft(dt);
    this.applyStats();
  }

  /** the left blade: trail and sweep hits, with its own hit list */
  private sampleLeft(dt: number): void {
    const { f, g } = this;
    const prop = this.form === 'shikai' ? f.visual.props.get('sword2') : null;
    if (!prop) {
      this.leftValid = false;
      this.leftTrail.emitting = false;
      return;
    }
    prop.updateWorldMatrix(true, false);
    this.prevLB.copy(this.leftBase);
    this.prevLT.copy(this.leftTip);
    this.leftBase.set(0, 0, 0.11).applyMatrix4(prop.matrixWorld);
    this.leftTip.set(0, 0, SOGYO_TIP_Z).applyMatrix4(prop.matrixWorld);
    if (!this.leftValid) {
      this.prevLB.copy(this.leftBase);
      this.prevLT.copy(this.leftTip);
      this.leftValid = true;
    }
    this.leftTrail.update(dt, this.leftBase, this.leftTip);
    if (this.leftActive && this.leftSpec) {
      const right = [...f.bladeHits];
      f.bladeHits.clear();
      for (const id of this.leftHits) f.bladeHits.add(id);
      g.bladeSweep(f, this.prevLB, this.prevLT, this.leftBase, this.leftTip, this.leftSpec);
      this.leftHits.clear();
      for (const id of f.bladeHits) this.leftHits.add(id);
      f.bladeHits.clear();
      for (const id of right) f.bladeHits.add(id);
    }
  }

  target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 90, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 90);
  }

  private near(range: number): Fighter | null {
    const t = this.target();
    return t && t.pos.distanceTo(this.f.pos) <= range ? t : null;
  }

  aim(out = new THREE.Vector3()): THREE.Vector3 {
    const { f, g } = this;
    if (f === g.player && !f.faceTarget) return g.aimPoint(f, out);
    const t = this.target();
    if (t && !t.dead) return t.center(out);
    return f.center(out).addScaledVector(f.forward(_w), 40);
  }

  // ---------------------------------------------------------------- the store

  /**
   * Before a hit lands: in Shikai the left blade drinks a reishi attack coming at it from the front (wider
   * in the absorbing guard), up to what the charms hold; past that, the rest gets through and he reels.
   */
  private tryAbsorb(amount: number, from: Fighter | null, o: DamageOpts): boolean {
    const { f, g } = this;
    if (!o.energy || f.dead) return false;
    if (this.form === 'sealed') {
      this.wantRelease = true;
      return false;
    }
    const a = f.action;
    if (a && !(a instanceof AbsorbAction) && !(a instanceof ReturnAction)) return false;
    if (f.hitstun > 0.3) return false;
    const src = from ? from.center() : null;
    if (src) {
      _v.subVectors(src, f.center()).setY(0).normalize();
      if (_v.dot(f.forward(_w)) < (this.absorbing ? -0.2 : 0.35)) return false;
    }
    const amt = amount * (from ? from.power : 1);
    const took = Math.min(Math.max(0, CAPACITY - this.stored), amt);
    if (took > 0) {
      const c = new THREE.Color(o.color ?? from?.def.aura.body ?? '#FFF2C9');
      this.storedColor.lerp(c, took / (this.stored + took));
      this.stored += took;
      if (from) this.storedBy.set(from, (this.storedBy.get(from) ?? 0) + took);
      const at = this.leftTipPoint();
      energyCatch(g, at, src ?? f.center().addScaledVector(f.forward(_w), 3), c, took);
      this.rope?.pulse(c, 1);
      if (!o.quiet) g.sfx.play('ting', at, 0.5);
    }
    const over = amt - took;
    if (over > 0.5) {
      // past the charms' limit: the rest comes through
      const dir = src ? f.center().sub(src).setY(0).normalize() : f.forward(_w).negate().clone();
      g.damage(f, over / Math.max(0.05, from ? from.power : 1), from, dir, { ...o, energy: false, heavy: true });
      if (f === g.player) g.hud?.showBanner('The charms are full — return it (E)');
    }
    return true;
  }

  private leftTipPoint(out = new THREE.Vector3()): THREE.Vector3 {
    const prop = this.f.visual.props.get('sword2');
    if (!prop) return this.f.center(out);
    prop.updateWorldMatrix(true, false);
    return out.set(0, 0, SOGYO_TIP_Z * 0.6).applyMatrix4(prop.matrixWorld);
  }

  /** E: the store fired back from the right blade's point, faster and harder, in its own colour */
  fireReturn(): void {
    const { f, g } = this;
    if (this.stored < 1) return;
    const prop = f.visual.props.get('sword');
    if (!prop) return;
    if (!this.tip || this.tip.parent !== prop) {
      this.tip = new THREE.Object3D();
      this.tip.position.set(0, 0, SOGYO_TIP_Z * 0.95);
      prop.add(this.tip);
    }
    const s = this.stored;
    const dmg = s * 1.25 * (this.overdrive ? 1.5 : 1);
    let reflected: Fighter | null = null, most = 0;
    for (const [who, amt] of this.storedBy) if (amt > most) { most = amt; reflected = who; }
    this.storedBy.clear();
    const c = this.storedColor.clone();
    const core = c.clone().lerp(new THREE.Color('#FFF2C9'), 0.6);
    if (s >= 150) {
      const radius = Math.min(1.1, 0.35 + s / 600);
      g.addProjectile(new CeroBeam(g, f, this.tip, () => this.aim(), { charge: 0.02, fire: 0.45, radius, damage: dmg * 1.1, power: 300 + s, core, body: c, rim: c.clone().multiplyScalar(0.5), range: 120, track: 1.4, gain: 1.2, reflected }));
    } else {
      this.tip.updateWorldMatrix(true, false);
      const p = this.tip.getWorldPosition(new THREE.Vector3());
      const dir = this.aim().sub(p).normalize();
      g.addProjectile(new CeroShot(g, f, p, dir, { speed: 110, size: 0.14 + Math.min(0.3, s / 400), damage: dmg, blast: 0.7 + s / 120, power: 120 + s * 2, knock: 10, launch: 2, heavy: s > 60, home: this.target(), homeRate: 1.2, core, body: c, reflected }));
    }
    this.rope?.pulse(core, 1);
    g.sfx.play('beam', f.center(), Math.min(1.4, 0.5 + s / 300));
    g.shake(f === g.player ? Math.min(0.5, 0.15 + s / 800) : 0.1);
    this.stored = 0;
    this.overdrive = false;
    if (this.rope) this.rope.blaze = 0;
  }

  // ---------------------------------------------------------------- moves

  seki(): void {
    const { f, g } = this;
    const p = sock(f, 'palm.L');
    const fw = f.forward(new THREE.Vector3());
    g.addProjectile(new SekiDisc(g, p.clone().addScaledVector(fw, 0.2), fw.clone()));
    g.sfx.play('ting', p, 0.8);
    for (const o of g.enemiesOf(f)) {
      _w.subVectors(o.pos, f.pos).setY(0);
      const d = _w.length();
      if (d > 2.8 + o.def.radius || _w.normalize().dot(fw) < 0.3 || Math.abs(o.pos.y - f.pos.y) > 2) continue;
      g.damage(o, 8, f, fw.clone(), { knock: 34, launch: 4, heavy: true, hitstop: 0.08, shake: 0.3, color: '#cfe6ff' });
    }
  }

  heal(): void {
    this.healT = 3;
  }

  coughBlood(n: number): void {
    const { f, g } = this;
    const p = sock(f, 'mouth');
    const fw = f.forward(_v);
    for (let i = 0; i < n; i++)
      g.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, vx: fw.x * 1.5 + (Math.random() - 0.5), vy: Math.random() * 0.5, vz: fw.z * 1.5 + (Math.random() - 0.5), size: 0.05, sizeEnd: 0.03, life: 0.6, r: 0.56, g: 0.06, b: 0.08, alpha: 0.9, alphaEnd: 0.4, tex: TEX_PUFF, gravity: -9 });
  }

  becomeShikai(): void {
    const { f, g } = this;
    if (this.form !== 'sealed') return;
    this.form = 'shikai';
    f.def = { ...f.def, stance: SOGYO_STANCE, blade: BLADE_SOGYO };
    f.setForm({ asset: ukitakeAsset(), props: this.props() }, AURA_UKITAKE, BLADE_SOGYO);
    this.leftValid = false;
    this.tip = null;
    this.hands();
    this.rope?.end();
    this.rope = new SogyoRope(g, f, () => this.ropeEnds());
    g.addProjectile(this.rope);
    f.aura.flare(1.6, 0.5);
    g.callout('双魚理', 'SŌGYO NO KOTOWARI', '#e8f4ee');
    g.sfx.play('flare', f.center(), 0.9);
    g.shake(f === g.player ? 0.3 : 0.1);
    const c = f.center();
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: Math.cos(a) * 5, vy: (Math.random() - 0.3) * 4, vz: Math.sin(a) * 5, size: 0.2, sizeEnd: 0.04, life: 0.45, r: 0.95, g: 0.95, b: 0.86, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, drag: 2 });
    }
    this.applyStats();
  }

  private props(): { key: string; model: ReturnType<typeof ukitakeProp>; socket: string }[] {
    if (this.form === 'sealed') return sealedProps();
    return [
      { key: 'sword', model: ukitakeProp('sogyo'), socket: 'grip.R' },
      { key: 'sword2', model: ukitakeProp('sogyo'), socket: 'grip.L' },
      { key: 'sheath', model: ukitakeProp('sheath-empty'), socket: 'hip.L' },
    ];
  }

  /** the rope's ends: the left pommel (the intake) first, then the right */
  private ropeEnds(): [THREE.Vector3, THREE.Vector3] | null {
    const r = this.f.visual.props.get('sword'), l = this.f.visual.props.get('sword2');
    if (!r || !l) return null;
    r.updateWorldMatrix(true, false);
    l.updateWorldMatrix(true, false);
    return [new THREE.Vector3(...SOGYO_POMMEL).applyMatrix4(l.matrixWorld), new THREE.Vector3(...SOGYO_POMMEL).applyMatrix4(r.matrixWorld)];
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
    if (cur instanceof CutAction) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastEnd > 0.7) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const list = this.form === 'sealed' ? UKITAKE_CHAIN : SOGYO_CHAIN;
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    this.lastEnd = this.g.time + 0.7;
    this.f.act(new CutAction(this, list[idx], idx, idx === list.length - 1), true);
  }

  /** RMB: the step-in slash / the rope. */
  heavy(): void {
    if (this.form === 'sealed') this.special(new IaiAction(this), 12, 'iai', 2.6);
    else this.special(new RopeAction(this), 12, 'rope', 2.4);
  }

  /** Q: Seki / the absorbing guard. */
  skill1(): void {
    if (this.form === 'sealed') this.special(new SekiAction(this), 12, 'seki', 4);
    else this.special(new AbsorbAction(this), 8, 'absorb', 3);
  }

  /** E: Shakkahō / the return. */
  skill2(): void {
    if (this.form === 'sealed') {
      this.special(new ShakkahoAction(this), 20, 'shakkaho', 4.5);
      return;
    }
    if (this.stored < 1) {
      if (this.f === this.g.player) this.g.hud?.showBanner('Nothing stored to return — let the left blade catch an attack');
      return;
    }
    this.special(new ReturnAction(this), 6, 'ret', 0.8);
  }

  /** R: Kaidō. */
  skill3(): void {
    this.special(new KaidoAction(this), 30, 'kaido', 20);
  }

  /** G: push through the illness. */
  toggle(): void {
    const { f, g } = this;
    if (this.pushT > 0 || this.cd.push > 0 || f.dead) return;
    if (!f.spendRei(25)) {
      if (f === g.player) g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    this.pushT = 15;
    this.cd.push = 30;
    f.aura.flare(1.4, 0.4);
    g.sfx.play('flare', f.center(), 0.6);
    if (f === g.player) g.hud?.showBanner('He pushes through it — for now');
  }

  release(): void {
    const { f, g } = this;
    if (f.busy) return;
    if (this.form === 'sealed') {
      if (!f.spendRei(30)) {
        if (f === g.player) g.hud?.showBanner('Not enough reiatsu');
        return;
      }
      f.act(new ReleaseAction(this), true);
      return;
    }
    this.special(new CharmsAction(this), 25, 'charms', 12);
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

  private applyStats(): void {
    const f = this.f;
    const shikai = this.form === 'shikai';
    f.power = (shikai ? 1.12 : 1) * (this.pushT > 0 ? 1.15 : 1) * (this.flare ? 1.25 : 1);
    f.damageTaken = 1;
    f.aura.target = this.flare ? 1 : this.pushT > 0 ? 0.35 : shikai ? 0.16 : 0.06;
  }

  formName(): string {
    const push = this.pushT > 0 ? ' · pushing through' : '';
    if (this.form === 'shikai') return `Shikai — Sōgyo no Kotowari · stored ${Math.round(this.stored)}${this.overdrive ? ' · charms ablaze' : ''}${push}`;
    return `Captain, 13th Division${push}`;
  }

  ai(): KitAI {
    const sealed = () => this.form === 'sealed', shikai = () => this.form === 'shikai';
    return {
      reach: 1.9,
      chain: 4,
      releaseAt: 0.8,
      toggleAt: 0.42,
      toggleOn: () => this.pushT > 0 || this.cd.push > 0,
      moves: [
        { name: 'iai', use: () => this.heavy(), min: 0, max: 3, weight: 1.1, cd: 3, when: sealed },
        { name: 'seki', use: () => this.skill1(), min: 0, max: 2.5, weight: 1.2, cd: 4, when: sealed },
        { name: 'shakkaho', use: () => this.skill2(), min: 5, max: 30, weight: 1, cd: 5, when: sealed },
        { name: 'kaido', use: () => this.skill3(), min: 6, max: 200, weight: 0.9, cd: 18, when: () => this.f.hp < this.f.maxHp * 0.6 },
        { name: 'release', use: () => this.release(), min: 0, max: 80, weight: 8, cd: 2, when: () => sealed() && this.wantRelease },
        { name: 'rope', use: () => this.heavy(), min: 0, max: 3.4, weight: 1.2, cd: 3, when: shikai },
        { name: 'absorb', use: () => this.skill1(), min: 5, max: 40, weight: 1.1, cd: 5, when: shikai },
        { name: 'return', use: () => this.skill2(), min: 3, max: 50, weight: 3, cd: 1.5, when: () => shikai() && this.stored > 25 },
        { name: 'charms', use: () => this.release(), min: 3, max: 50, weight: 1.5, cd: 10, when: () => shikai() && this.stored > 90 && !this.overdrive },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd, list: AbilityInfo[] = [];
    if (this.form === 'sealed') {
      list.push(
        { key: 'LMB', name: 'Katana', kanji: '刀' },
        { key: 'RMB', name: 'Step-in cut', kanji: '斬', cost: 12, cd: cd.iai, cdMax: 2.6 },
        { key: 'Q', name: 'Seki', kanji: '斥', cost: 12, cd: cd.seki, cdMax: 4 },
        { key: 'E', name: 'Shakkahō', kanji: '赤火砲', cost: 20, cd: cd.shakkaho, cdMax: 4.5 },
      );
    } else {
      list.push(
        { key: 'LMB', name: 'Twin blades', kanji: '双' },
        { key: 'RMB', name: 'Rope', kanji: '縄', cost: 12, cd: cd.rope, cdMax: 2.4 },
        { key: 'Q', name: 'Absorb', kanji: '吸', cost: 8, cd: cd.absorb, cdMax: 3, active: this.absorbing },
        { key: 'E', name: `Return ${Math.round(this.stored)}`, kanji: '返', cost: 6, cd: cd.ret, cdMax: 0.8, active: this.stored > 0, timer: this.stored > 0 ? this.stored / CAPACITY : undefined, tint: '#fff2c9' },
      );
    }
    list.push(
      { key: 'R', name: 'Kaidō', kanji: '回道', cost: 30, cd: cd.kaido, cdMax: 20, active: this.healT > 0 },
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩' },
      { key: 'G', name: 'Push through', kanji: '耐', cost: 25, cd: cd.push, cdMax: 30, active: this.pushT > 0, timer: this.pushT > 0 ? this.pushT / 15 : undefined },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      this.form === 'sealed' ? { key: 'F', name: 'Shikai', kanji: '始解', cost: 30 } : { key: 'F', name: 'Charms', kanji: '符', cost: 25, cd: cd.charms, cdMax: 12, active: this.overdrive },
    );
    return list;
  }
}
