// Yhwach's kit (docs/roster/H1-vandenreich-leaders.md, "Yhwach", Kit proposal). Emperor: measured one-hand cuts
// with the Reishi sword and the off hand seizing a throat and driving it into the floor; RMB the broadsword
// pulled from an arrow loosed into the ground and the diagonal stroke that bisects; Q Heilig Pfeil from the
// finger, each arrow opening into a Zeichen; E Sankt Bogen (a great bow in the sky looses one arrow); R Qual
// Kreis (lightning round the target, then a ring of bows firing inward); G Blut Vene Anhaben (a shell of veins
// that undoes shots and drinks whoever touches it); F wakes The Almighty. The Almighty: he sees every blow
// coming and stands behind the attacker before it lands (Foreseen Step), a technique he has seen strike him
// twice no longer touches him, and his first death is rewritten. Q Fate Pfeil (the arrows lead perfectly), E
// the Rewrite (the target's weapon is broken in every future: disarmed and its power cut), R the Future Wound
// (a stroke that misses now and lands later, through any guard), G Traps of Fate (shadow blades where they will
// be); F absorbs the King. The Soul King: the Black over him, crimson reiatsu, the broadsword with tendrils
// lashing from his hits; RMB a forest of spikes, Q the eyes and their beams, E the swarm of one-eyed creatures,
// R the Zeichen and its violet blast, G Auswählen (pillars drain everyone near), F the crimson exertion that
// demolishes what stands round him and presses everyone flat. Blut Vene in every form: blows hurt him less.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { YH_BROAD_BASE_Z, YH_BROAD_TIP_Z, YH_SWORD_BASE_Z, YH_SWORD_TIP_Z, yhwachAsset, yhwachProp } from '../../chars/yhwach';
import { YHWACH_BLACK_CHAIN, YHWACH_BLACK_STANCE, YHWACH_CHAIN, YHWACH_CLIPS, YHWACH_STANCE } from '../../chars/yhwachClips';
import { Auswahlen, BlackWave, BlutAnhaben, CRIMSON, EyeBeams, EyeSwarm, FutureWound, PFEIL, QualKreis, SanktBogen, ShadowSpikes, ZeichenEmblem, sandBurst, zeichenBurst } from '../../vfx/almighty';
import { ReishiArrow } from '../../vfx/quincy';
import { CeroBeam } from '../projectiles/cero';
import { SphereShape } from '../../destruction/shapes';
import { groundAt } from '../../vfx/iceArts';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from '../../vfx/sprites';
import type { AuraStyle } from '../../vfx/aura';

/** his reiatsu: blue (dossier #4A78F0) */
export const AURA_YHWACH: AuraStyle = { core: '#E3F1FF', body: '#4A78F0', rim: '#1A2C66' };
/** the Soul King: crimson */
export const AURA_YHWACH_KING: AuraStyle = { core: '#FFD0D0', body: '#A80F1C', rim: '#2A0408' };

type BladeDef = NonNullable<FighterDef['blade']>;
const BLADE: BladeDef = { prop: 'sword', base: [0, 0, YH_SWORD_BASE_Z], tip: [0, 0, YH_SWORD_TIP_Z], color: '#8EC2FF', core: '#E3F1FF' };
const BLADE_BROAD: BladeDef = { prop: 'sword', base: [0, 0, YH_BROAD_BASE_Z], tip: [0, 0, YH_BROAD_TIP_Z], color: '#5DA8FF', core: '#E6F3FF' };
const BLADE_KING: BladeDef = { ...BLADE_BROAD, color: '#A80F1C', core: '#FFD0D0' };

/** Hirenkyaku: a gliding step, the fastest dash in the game */
const SPEED = { run: 9.4, sprint: 27, jump: 13, dash: 31, dashTime: 0.1 };

type Form = 'emperor' | 'almighty' | 'soulking';

function props(broad = false): { key: string; model: ReturnType<typeof yhwachProp>; socket: string }[] {
  return [{ key: 'sword', model: yhwachProp(broad ? 'broadsword' : 'sword'), socket: 'grip.R' }];
}

export const YHWACH_DEF: FighterDef = {
  id: 'yhwach',
  name: 'Yhwach',
  title: 'Emperor of the Wandenreich',
  build: () => ({ asset: yhwachAsset('emperor'), props: props() }),
  stance: YHWACH_STANCE,
  clips: YHWACH_CLIPS,
  aura: AURA_YHWACH,
  blade: BLADE,
  hp: 1300,
  rei: 280,
  speed: { ...SPEED },
  radius: 0.42,
  height: 2.0,
};

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

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

// ---------------------------------------------------------------------------------------------- actions

/** the cuts (sword chain, the Soul King's broadsword chain), and the Future Wound's stroke at nothing */
class CutAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private hitAt = -1;
  private stopAt = 0;
  private wounded = false;
  queued = false;
  constructor(readonly kit: YhwachKit, readonly clip: string, readonly index: number, readonly last: boolean, readonly kind?: 'wound') {
    super();
    this.name = kind ?? clip;
    this.mobility = 0.18;
    this.airGravity = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.62;
    this.hitAt = c.events.hit ?? -1;
    f.bladeHits.clear();
    const king = this.kit.form === 'soulking';
    let spec: BladeSpec = this.last
      ? { damage: king ? 40 : 30, knock: 14, launch: 3, heavy: true, hitstop: 0.1, shake: 0.35, cut: king ? 1200 : 640, reach: king ? 0.4 : 0.26, thick: king ? 0.1 : undefined }
      : { damage: king ? 26 : 21, knock: 6, launch: 0, heavy: false, hitstop: 0.06, shake: 0.16, cut: king ? 900 : 460, reach: king ? 0.36 : 0.24 };
    // the Black lashes out with every cut of the Soul King's
    if (king) spec = { ...spec, onHit: (o) => this.kit.tendril(o) };
    f.bladeSpec = spec;
    // dash at the start of the swing so the edge arrives where the target stands
    const tgt = f.faceTarget;
    let dashed = false;
    if (tgt && this.hitAt > 0 && !this.kind) {
      const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
      this.stopAt = king ? 1.9 : 1.45;
      if (d > this.stopAt + 0.25) {
        const tau = Math.max(0.06, this.hitAt - 0.07);
        const per = (1 - Math.exp(-f.pushDrag * tau)) / f.pushDrag;
        f.push.addScaledVector(f.forward(), Math.min(30, (d - this.stopAt) / per));
        dashed = true;
      }
    }
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n !== 'step') return;
        if (!dashed && !this.kind) f.push.addScaledVector(f.forward(), 3);
        g.sfx.play(this.last || king ? 'swingHeavy' : 'swing', f.center(), 0.8);
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
    const open = this.hitAt >= 0 && t >= this.hitAt - 0.08 && t <= this.hitAt + 0.13;
    // the Future Wound's stroke cuts nothing now: the wound lands later
    f.bladeActive = open && !this.kind;
    if (f.trail) f.trail.emitting = open;
    if (this.kind === 'wound' && !this.wounded && t >= this.hitAt) {
      this.wounded = true;
      this.kit.futureWound();
    }
    if (!this.kind && this.queued && t >= this.comboAt) {
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
  constructor(readonly kit: YhwachKit) {
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
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t > this.dur * 0.55;
  }
}

/** LMB 4 (Emperor / Almighty): the off hand seizes them by the throat, lifts, and drives them into the floor */
class GrabAction extends SkillAction {
  readonly name = 'grab';
  private victim: Fighter | null = null;
  private stopAt = 0;
  private slammed = false;
  constructor(kit: YhwachKit) {
    super(kit);
    this.mobility = 0.1;
    this.armor = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('yh_grab')!;
    const tgt = f.faceTarget;
    if (tgt) {
      const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
      this.stopAt = 1.0;
      if (d > 1.3) {
        const tau = Math.max(0.06, (c.events.grab ?? 0.16) - 0.02);
        const per = (1 - Math.exp(-f.pushDrag * tau)) / f.pushDrag;
        f.push.addScaledVector(f.forward(), Math.min(28, (d - this.stopAt) / per));
      }
    }
    this.playClip(f, 'yh_grab', (n) => {
      if (n === 'grab') this.victim = this.kit.seize();
      if (n === 'slam') {
        this.slammed = true;
        if (this.victim) this.kit.slam(this.victim);
        this.victim = null;
      }
    });
    g.sfx.play('swingHeavy', f.center(), 0.7);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const tgt = f.faceTarget;
    if (this.stopAt > 0 && tgt && Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z) <= this.stopAt) {
      f.push.x = 0;
      f.push.z = 0;
      this.stopAt = 0;
    }
    // held up by the throat in his left hand
    const v = this.victim;
    if (v && !this.slammed && !v.dead) {
      const hand = bonePos(f, 'palm.L', _v);
      v.body.pos.set(hand.x, hand.y - v.def.height * 0.86, hand.z);
      v.body.prev.copy(v.body.pos);
      v.body.vel.set(0, 0, 0);
      v.push.set(0, 0, 0);
      v.hitstun = Math.max(v.hitstun, 0.3);
    }
  }
  override end(f: Fighter): void {
    super.end(f);
    this.victim = null;
  }
}

/** RMB: the sky-slash — the arrow falls before him — he pulls out the broadsword and bisects */
class BroadAction extends SkillAction {
  readonly name = 'broad';
  private hitAt = 0.98;
  private stopAt = 0;
  private drawn = false;
  constructor(kit: YhwachKit) {
    super(kit);
    this.mobility = 0.08;
    this.armor = 0.35;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('yh_broad')!;
    this.hitAt = c.events.hit ?? 0.98;
    f.bladeHits.clear();
    f.bladeSpec = { damage: 62, knock: 18, launch: 5, heavy: true, hitstop: 0.14, shake: 0.55, cut: 1500, reach: 0.6, thick: 0.12 };
    this.playClip(f, 'yh_broad', (n) => {
      if (n === 'sky') this.kit.skyArrow();
      if (n === 'pull') {
        this.drawn = true;
        this.kit.drawBroadsword(true);
      }
      if (n === 'step') {
        const tgt = f.faceTarget;
        let push = 6;
        if (tgt) {
          const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
          this.stopAt = 2.1;
          const tau = Math.max(0.06, this.hitAt - (c.events.step ?? 0.82));
          const per = (1 - Math.exp(-f.pushDrag * tau)) / f.pushDrag;
          push = Math.min(30, Math.max(push, Math.max(0, d - this.stopAt) / per));
        }
        f.push.addScaledVector(f.forward(), push);
        g.sfx.play('swingHeavy', f.center(), 1.2);
      }
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const tgt = f.faceTarget;
    if (this.stopAt > 0 && tgt && Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z) <= this.stopAt) {
      f.push.x = 0;
      f.push.z = 0;
      this.stopAt = 0;
    }
    const open = this.t >= this.hitAt - 0.1 && this.t <= this.hitAt + 0.14;
    f.bladeActive = open;
    if (f.trail) f.trail.emitting = open;
  }
  override end(f: Fighter): void {
    super.end(f);
    if (this.drawn) this.kit.drawBroadsword(false);
  }
}

/** a gesture skill: plays the clip, calls the kit on its events */
class CastAction extends SkillAction {
  constructor(kit: YhwachKit, readonly name: string, readonly clip: string, readonly on: (n: string) => void, mobility = 0.08, armor = 0.3, readonly callout?: [string, string, string]) {
    super(kit);
    this.mobility = mobility;
    this.armor = armor;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, this.clip, this.on);
    if (this.callout) g.callout(...this.callout);
  }
}

/** Q (Emperor / Almighty): the finger levelled, the arrows loosed one after another */
class FingerAction extends SkillAction {
  readonly name = 'finger';
  private fireAt = 0.16;
  private shot = 0;
  constructor(kit: YhwachKit, readonly count: number) {
    super(kit);
    this.mobility = 0.15;
    this.armor = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    this.fireAt = f.anim.clip('yh_finger')?.events.fire ?? 0.16;
    this.playClip(f, 'yh_finger', () => {});
    if (this.kit.form === 'emperor') g.callout('神聖滅矢', 'HEILIG PFEIL', PFEIL);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    while (this.shot < this.count && this.t >= this.fireAt + this.shot * 0.09) this.kit.fingerShot(this.shot++);
  }
}

/** F: a release (The Almighty, the Soul King): untouchable while it plays */
class ReleaseAction extends CastAction {
  constructor(kit: YhwachKit, name: string, clip: string, on: (n: string) => void, callout: [string, string, string]) {
    super(kit, name, clip, on, 0, 0, callout);
    this.invulnerable = true;
    this.trackTarget = false;
  }
}

// ---------------------------------------------------------------------------------------------- the kit

export class YhwachKit implements Kit {
  form: Form = 'emperor';
  flare = false;
  comboIndex = 0;
  readonly cd = { heavy: 0, finger: 0, bogen: 0, kreis: 0, anhaben: 0, release: 0, rewrite: 0, wound: 0, traps: 0, spikes: 0, beams: 0, swarm: 0, zeichen: 0, ausw: 0, exert: 0 };
  private lastEnd = 0;
  private foreseeCd = 0;
  private seenAct = new Map<number, unknown>();
  /** "All that I see is powerless": how often each technique has struck him */
  private seen = new Map<string, number>();
  private rewritten = false;
  private absorbedT = 0;
  private emblem: ZeichenEmblem | null = null;

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.def = { ...f.def, speed: { ...SPEED } };
    this.hands();
    // The Almighty: a technique seen twice no longer touches him
    f.parry = (_amount, from, o) => {
      if (this.form === 'emperor' || !from || (!o.energy && !o.heavy)) return false;
      const key = `${from.id}:${from.action?.name ?? (o.energy ? 'shot' : 'blow')}`;
      const n = (this.seen.get(key) ?? 0) + 1;
      this.seen.set(key, n);
      if (n < 3) return false;
      sandBurst(g, f.center(), 18);
      if (this.absorbedT <= 0) {
        this.absorbedT = 2.5;
        g.callout('', 'ALREADY SEEN', '#CFE6FF');
      }
      return true;
    };
    // his first death is rewritten into another future
    f.onLethal = () => {
      if (this.form === 'emperor' || this.rewritten) return false;
      this.rewritten = true;
      f.hp = f.maxHp * 0.6;
      f.invuln = Math.max(f.invuln, 1.6);
      f.stopAction();
      const c = f.center();
      for (let i = 0; i < 40; i++) {
        const a = Math.random() * Math.PI * 2;
        g.engine.dust.spawn({ x: c.x + Math.cos(a) * 0.6, y: f.pos.y + Math.random() * 2.2, z: c.z + Math.sin(a) * 0.6, vx: -Math.sin(a) * 3, vy: 0.5 + Math.random(), vz: Math.cos(a) * 3, size: 0.8, sizeEnd: 1.6, life: 1.3, r: 0.04, g: 0.03, b: 0.05, alpha: 0.9, alphaEnd: 0, tex: TEX_PUFF, drag: 1.4 });
      }
      sandBurst(g, c, 50);
      g.callout('', 'FUTURE REWRITTEN', '#E01A2B');
      g.sfx.play('roarBig', c, 0.6);
      return true;
    };
    this.applyStats();
  }

  /** the right hand closed on the hilt, the left open (on the hip, pointing, seizing) */
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
    this.foreseeCd = Math.max(0, this.foreseeCd - dt);
    this.absorbedT = Math.max(0, this.absorbedT - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    // The Almighty: he sees the blow before it is thrown, and is standing behind the one who throws it
    if (this.form !== 'emperor' && !f.dead) {
      for (const o of g.enemiesOf(f)) {
        const a = o.action;
        if (!a) {
          this.seenAct.delete(o.id);
          continue;
        }
        if (this.seenAct.get(o.id) === a) continue;
        this.seenAct.set(o.id, a);
        if (this.foreseeCd > 0 || f.hitstun > 0 || a.name === 'dash' || (f.action?.invulnerable ?? false)) continue;
        const d = o.pos.distanceTo(f.pos);
        const toMe = _v.subVectors(f.pos, o.pos).setY(0).normalize();
        if (d < 10 && toMe.dot(o.forward(_w)) > 0.5) this.foresee(o);
      }
    }
    // the Soul King: the Black mends him
    if (this.form === 'soulking' && !f.dead) f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.005 * dt);
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

  // ---------------------------------------------------------------- The Almighty's passives

  /** Foreseen Step: a blink to behind the one who is about to strike */
  private foresee(o: Fighter): void {
    const { f, g } = this;
    this.foreseeCd = f === g.player ? 3.2 : 2.4;
    sandBurst(g, f.center());
    f.ghosts.spawn(0.5, 1);
    if (f.action && !f.action.canCancel({ name: 'dash' } as FighterAction)) f.stopAction();
    const back = o.forward(new THREE.Vector3()).multiplyScalar(-(o.def.radius + 1.3));
    const to = o.pos.clone().add(back);
    const gy = groundAt(g, to.x, to.y + 2, to.z, 6);
    if (gy !== null && Math.abs(gy - to.y) < 2) to.y = gy;
    f.body.pos.copy(to);
    f.body.prev.copy(to);
    f.body.vel.set(0, 0, 0);
    f.push.set(0, 0, 0);
    f.yaw = Math.atan2(o.pos.x - to.x, o.pos.z - to.z);
    f.invuln = Math.max(f.invuln, 0.35);
    g.sfx.play('shunpo', to, 0.9);
  }

  // ---------------------------------------------------------------- the sword

  /** LMB 4: the throat in his hand */
  seize(): Fighter | null {
    const { f, g } = this;
    const fw = f.forward(_w);
    for (const o of g.enemiesOf(f)) {
      if (o.dead || o.def.height > 3) continue;
      _v.subVectors(o.pos, f.pos).setY(0);
      const d = _v.length();
      if (d > 1.9 + o.def.radius || _v.normalize().dot(fw) < 0.3) continue;
      o.stopAction();
      o.hitstun = Math.max(o.hitstun, 1.2);
      g.damage(o, 6, f, _v.clone(), { knock: 0, quiet: true });
      return o;
    }
    return null;
  }

  /** driven into the floor: a crater where they land */
  slam(o: Fighter): void {
    const { f, g } = this;
    const gy = groundAt(g, o.pos.x, o.pos.y + 1, o.pos.z, 6) ?? o.pos.y;
    o.body.pos.y = gy + 0.05;
    o.body.prev.copy(o.body.pos);
    g.damage(o, 40, f, f.forward(new THREE.Vector3()), { knock: 2, launch: 0.5, heavy: true, hitstop: 0.16, shake: 0.6 });
    o.hitstun = Math.max(o.hitstun, 0.9);
    g.groundImpact(new THREE.Vector3(o.pos.x, gy, o.pos.z), 1.6, 600, PFEIL, f);
  }

  /** RMB's sky-slash: a bow forms above and its arrow falls into the ground before him */
  skyArrow(): void {
    const { f, g } = this;
    const fw = f.forward(new THREE.Vector3());
    const spot = f.pos.clone().addScaledVector(fw, 1.4);
    const from = spot.clone().add(new THREE.Vector3(0, 12, 0)).addScaledVector(fw, -3);
    const d = spot.clone().sub(from).normalize();
    g.addProjectile(new ReishiArrow(f, g, from, d, { damage: 0, speed: 120, burst: 0.4, size: 6, range: 20, color: PFEIL, quiet: true }));
    zeichenBurst(g, from, d, 1.2);
    g.sfx.play('arrow', from, 1);
  }

  /** the broadsword drawn (or let go after the stroke) */
  drawBroadsword(on: boolean): void {
    const { f } = this;
    if (this.form === 'soulking') return;
    f.visual.attach('sword', yhwachProp(on ? 'broadsword' : 'sword'), 'grip.R');
    f.def = { ...f.def, blade: on ? BLADE_BROAD : BLADE };
    f.trail?.setColor((on ? BLADE_BROAD : BLADE).color, (on ? BLADE_BROAD : BLADE).core);
    f.bladeValid = false;
    if (on) {
      const p = bonePos(f, 'grip.R');
      for (let i = 0; i < 24; i++) this.g.engine.glow.spawn({ x: p.x, y: p.y + Math.random() * 1.6, z: p.z, vx: (Math.random() - 0.5) * 3, vy: Math.random() * 3, vz: (Math.random() - 0.5) * 3, size: 0.12, sizeEnd: 0.02, life: 0.4, r: 0.6, g: 0.82, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    }
  }

  /** the Soul King's cuts: a tendril of the Black bursts up under whoever they strike */
  tendril(o: Fighter): void {
    this.g.addProjectile(new ShadowSpikes(this.g, this.f, [{ p: o.pos.clone(), delay: 0.05, h: 1.8 }], 8, 0.35));
  }

  // ---------------------------------------------------------------- Heilig Pfeil, Sankt Bogen, Qual Kreis, Anhaben

  /** Q: one arrow from the fingertip, opening into a Zeichen; The Almighty's lead perfectly (Fate Pfeil) */
  fingerShot(i: number): void {
    const { f, g } = this;
    const fate = this.form !== 'emperor';
    const from = bonePos(f, 'finger.L');
    const speed = 120;
    const t = this.target();
    let to = this.aim(new THREE.Vector3());
    if (fate && t) {
      // where they will be when it arrives
      const lead = from.distanceTo(t.center(_v)) / speed;
      to = t.center(new THREE.Vector3()).addScaledVector(t.body.vel, lead);
    }
    to.add(new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4));
    const d = to.sub(from).normalize();
    g.addProjectile(new ReishiArrow(f, g, from.clone().addScaledVector(d, 0.3), d, { damage: fate ? 12 : 11, speed, burst: 0.9, size: 1.6, range: 90, color: PFEIL, quiet: i > 0, onBurst: (p, dir) => zeichenBurst(g, p, dir, 0.5) }));
    g.sfx.play('arrow', from, 0.6);
  }

  /** E: the great bow */
  bogen(): void {
    const { f, g } = this;
    const t = this.target();
    const tp = () => (t && !t.dead ? t.center(new THREE.Vector3()) : this.aim(new THREE.Vector3()));
    g.addProjectile(new SanktBogen(g, f, tp, 1));
  }

  /** R: Qual Kreis on the target */
  kreis(): void {
    const { f, g } = this;
    const t = this.target();
    const at = t ? t.center(new THREE.Vector3()) : this.aim(new THREE.Vector3());
    g.addProjectile(new QualKreis(g, f, t, at, 1));
    g.sfx.play('charge', at, 0.8);
  }

  /** G: the shell of veins */
  anhaben(): void {
    this.g.addProjectile(new BlutAnhaben(this.g, this.f, 3.4, 4.2, 34));
  }

  // ---------------------------------------------------------------- The Almighty's techniques

  /** E (Almighty): the target's weapon broken in every future — disarmed, its power cut, its shots undone */
  rewrite(): void {
    const { f, g } = this;
    const t = this.target();
    if (!t || t.dead || t.pos.distanceTo(f.pos) > 32) return;
    t.stopAction();
    t.disarmT = Math.max(t.disarmT, 6);
    t.sealT = Math.max(t.sealT, 8);
    t.sealK = Math.max(t.sealK, 0.35);
    g.rejectNear(t.center(), 8, f, true);
    const c = t.center();
    sandBurst(g, c, 40);
    for (let i = 0; i < 26; i++) {
      const d = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.2, Math.random() - 0.5).normalize();
      g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: d.x * 7, vy: d.y * 7, vz: d.z * 7, size: 0.1, sizeEnd: 0.02, life: 0.5, r: 0.92, g: 0.95, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2, gravity: -8 });
    }
    g.sfx.play('shatter', c, 1);
    g.callout('', 'REWRITTEN', '#E01A2B');
    if (t === g.player) g.hud?.showBanner('Your weapon is broken in every future');
  }

  /** R (Almighty): the stroke that lands later, wherever they are */
  futureWound(): void {
    const { f, g } = this;
    const t = this.target();
    if (!t || t.dead || t.pos.distanceTo(f.pos) > 26) return;
    g.addProjectile(new FutureWound(g, f, t, 52, 0.6));
  }

  /** G (Almighty): the shadow blades waiting where they will be */
  traps(): void {
    const { f, g } = this;
    const t = this.target();
    if (!t) return;
    const v = t.body.vel.clone().setY(0);
    const pts: { p: THREE.Vector3; delay: number; h?: number }[] = [];
    for (const [k, delay] of [[0.3, 0.12], [0.65, 0.28], [1.0, 0.44]] as [number, number][]) pts.push({ p: t.pos.clone().addScaledVector(v, k), delay, h: 2.8 });
    for (let i = 0; i < 3; i++) {
      const a = Math.random() * Math.PI * 2;
      pts.push({ p: t.pos.clone().addScaledVector(v, 0.65).add(new THREE.Vector3(Math.cos(a) * 1.6, 0, Math.sin(a) * 1.6)), delay: 0.36 + i * 0.05, h: 2.2 });
    }
    g.addProjectile(new ShadowSpikes(g, f, pts, 20, 0.7));
    sandBurst(g, t.center(), 20);
  }

  // ---------------------------------------------------------------- the Soul King's techniques

  /** RMB (Soul King): a forest of spikes running at the target along the ground */
  spikes(): void {
    const { f, g } = this;
    const to = this.aim(new THREE.Vector3());
    const dir = to.clone().sub(f.pos).setY(0);
    const len = Math.min(24, Math.max(6, dir.length() + 3));
    dir.normalize();
    const side = new THREE.Vector3(-dir.z, 0, dir.x);
    const pts: { p: THREE.Vector3; delay: number; h?: number }[] = [];
    for (let i = 0; i < 9; i++) {
      const k = 2 + (i / 8) * (len - 2);
      pts.push({ p: f.pos.clone().addScaledVector(dir, k).addScaledVector(side, (Math.random() - 0.5) * 2.4), delay: i * 0.05, h: 2.4 + Math.random() * 1.4 });
    }
    g.addProjectile(new ShadowSpikes(g, f, pts, 30, 0.6));
    g.sfx.play('crumble', f.center(), 0.8);
  }

  /** Q (Soul King): the eyes and their beams */
  beams(): void {
    const { f, g } = this;
    const t = this.target();
    const tp = () => (t && !t.dead ? t.center(new THREE.Vector3()) : this.aim(new THREE.Vector3()));
    g.addProjectile(new EyeBeams(g, f, tp, 14, 3));
    g.sfx.play('beam', f.center(), 0.9);
  }

  /** E (Soul King): the torrent of one-eyed creatures */
  swarm(): void {
    const { f, g } = this;
    g.addProjectile(new EyeSwarm(g, f, this.target(), 16, 6.5, 3));
    g.sfx.play('roar', f.center(), 0.5);
  }

  /** R (Soul King): the eye-pillars form a Zeichen before him */
  zeichenForm(): void {
    const { f, g } = this;
    this.emblem = new ZeichenEmblem(g, f, 2.4);
    g.addProjectile(this.emblem);
    g.sfx.play('charge', f.center(), 1.1);
  }

  /** ...and the violet blast out of its eye */
  zeichenFire(): void {
    const { f, g } = this;
    if (!this.emblem) return;
    g.addProjectile(new CeroBeam(g, f, this.emblem.eye, () => this.aim(new THREE.Vector3()), { charge: 0.05, fire: 0.9, radius: 1.5, damage: 110, power: 850, core: '#E6D2FF', body: '#8C3CFF', rim: '#2A0A55', range: 110, track: 0.6, gain: 1.4 }));
    g.sfx.play('beam', f.center(), 1.3);
    if (f === g.player || (g.player && g.player.pos.distanceTo(f.pos) < 40)) g.shake(0.5);
    this.emblem = null;
  }

  /** G (Soul King): Auswählen — the black ring and the pillars on everyone near */
  auswahlen(): void {
    const { f, g } = this;
    // the Blood War Uryū survived it with his power whole: it does not touch him
    const victims = g.enemiesOf(f).filter((o) => !o.dead && o.pos.distanceTo(f.pos) < 34 && o.def.id !== 'uryu-tybw');
    // a Quincy loses far more: his power is taken back
    for (const o of victims) if (o.def.id === 'uryu') { o.sealT = Math.max(o.sealT, 18); o.sealK = Math.max(o.sealK, 0.5); }
    g.addProjectile(new Auswahlen(g, f, victims, true, 22, (amount) => {
      f.hp = Math.min(f.maxHp, f.hp + amount);
      f.rei = Math.min(f.maxRei, f.rei + 40);
      f.aura.flare(1.6, 0.6);
    }));
    g.callout('聖別', 'AUSWÄHLEN', '#9CC4FF');
  }

  /** F (Soul King): the crimson exertion — what stands round him comes down, those near are pressed flat */
  exert(): void {
    const { f, g } = this;
    const c = f.pos.clone();
    const R = 14;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + Math.random() * 0.4, r = 5 + Math.random() * 5;
      g.engine.destruction.carve(new SphereShape(new THREE.Vector3(c.x + Math.cos(a) * r, c.y + 1.6 + Math.random() * 5, c.z + Math.sin(a) * r), 1.8 + Math.random(), 0.5), { mode: 'smash', power: 900, impulse: 14, dust: 0.8 });
    }
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      _v.subVectors(o.pos, c).setY(0);
      const d = _v.length();
      if (d > R + o.def.radius) continue;
      const k = 1 - d / (R + 4);
      g.damage(o, 30 * k, f, _v.normalize().clone(), { knock: 10 * k, heavy: true, energy: true, hitstop: 0.1, shake: 0.5 });
      o.stopAction();
      o.hitstun = Math.max(o.hitstun, 1.3 * k + 0.3);
      o.slow(0.6, 2);
    }
    g.addRing(c.clone().setY(c.y + 0.3), R, CRIMSON, 0.7);
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      g.engine.dust.spawn({ x: c.x, y: c.y + 0.4, z: c.z, vx: Math.cos(a) * 14, vy: 1, vz: Math.sin(a) * 14, size: 1, sizeEnd: 3, life: 1, r: 0.3, g: 0.04, b: 0.06, alpha: 0.6, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
    }
    g.sfx.play('explode', c, 1.2);
    if (f === g.player || (g.player && g.player.pos.distanceTo(c) < 30)) g.shake(0.7);
  }

  // ---------------------------------------------------------------- forms

  /** F: the eyes open — every wound and hindrance from before is undone */
  becomeAlmighty(): void {
    const { f, g } = this;
    if (this.form !== 'emperor') return;
    this.form = 'almighty';
    f.setForm({ asset: yhwachAsset('almighty'), props: props() }, AURA_YHWACH, BLADE);
    this.hands();
    f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.25);
    f.slowT = 0;
    f.slowK = 0;
    f.sealT = 0;
    f.sealK = 0;
    f.disarmT = 0;
    f.blindT = 0;
    f.invertT = 0;
    f.iffT = 0;
    f.aura.flare(2, 1);
    for (const e of ['eye.L', 'eye.R']) {
      const p = bonePos(f, e);
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.6, sizeEnd: 0.1, life: 0.6, r: 1, g: 0.15, b: 0.2, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    }
    sandBurst(g, f.center(), 60);
    g.sfx.play('bankai', f.center(), 0.9);
    if (f === g.player || (g.player && g.player.pos.distanceTo(f.pos) < 40)) g.shake(0.5);
    g.slowMo(0.4, 0.4);
  }

  /** F (Almighty): the King absorbed — the Black pours over him */
  becomeSoulKing(): void {
    const { f, g } = this;
    if (this.form !== 'almighty') return;
    this.form = 'soulking';
    f.def = { ...f.def, stance: YHWACH_BLACK_STANCE };
    f.anim.loco.stance = YHWACH_BLACK_STANCE;
    f.setForm({ asset: yhwachAsset('soulking'), props: [...props(true), { key: 'mask', model: yhwachProp('mask'), socket: 'face' }] }, AURA_YHWACH_KING, BLADE_KING);
    this.hands();
    f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.3);
    f.aura.pillarBurst(2.6);
    f.aura.flare(2.2, 1.2);
    const c = f.center();
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.dust.spawn({ x: c.x, y: f.pos.y + Math.random() * 2.4, z: c.z, vx: Math.cos(a) * 8, vy: 1 + Math.random() * 3, vz: Math.sin(a) * 8, size: 1.2, sizeEnd: 3.2, life: 1.4, r: 0.04, g: 0.03, b: 0.05, alpha: 0.85, alphaEnd: 0, tex: TEX_PUFF, drag: 1.6 });
    }
    g.sfx.play('roarBig', c, 1);
    g.sfx.play('bankai', c, 1);
    if (f === g.player || (g.player && g.player.pos.distanceTo(f.pos) < 50)) g.shake(0.8);
    g.slowMo(0.5, 0.35);
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
    if (cur instanceof CutAction && !cur.kind) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastEnd > 0.7) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const king = this.form === 'soulking';
    const list = king ? YHWACH_BLACK_CHAIN : YHWACH_CHAIN;
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    this.lastEnd = this.g.time + 0.7;
    if (!king && list[idx] === 'yh_grab') this.f.act(new GrabAction(this), true);
    else this.f.act(new CutAction(this, list[idx], idx, idx === list.length - 1), true);
  }

  heavy(): void {
    if (this.form === 'soulking') this.special(new CastAction(this, 'spikes', 'yh_sweep', (n) => n === 'send' && this.spikes()), 14, 'spikes', 4.5);
    else this.special(new BroadAction(this), 18, 'heavy', 4.5);
  }

  skill1(): void {
    if (this.form === 'soulking') this.special(new CastAction(this, 'beams', 'yh_beams', (n) => n === 'open' && this.beams(), 0.05, 0.4), 30, 'beams', 6);
    else this.special(new FingerAction(this, this.form === 'emperor' ? 5 : 6), 20, 'finger', 3.5);
  }

  skill2(): void {
    if (this.form === 'soulking') this.special(new CastAction(this, 'swarm', 'yh_sweep', (n) => n === 'send' && this.swarm(), 0.05, 0.4, ['霊王の力の奔流', 'TORRENT OF THE SOUL KING', CRIMSON]), 34, 'swarm', 14);
    else if (this.form === 'almighty') this.special(new CastAction(this, 'rewrite', 'yh_rewrite', (n) => n === 'close' && this.rewrite(), 0.05, 0.3), 36, 'rewrite', 14);
    else this.special(new CastAction(this, 'bogen', 'yh_bogen', (n) => n === 'summon' && this.bogen(), 0.05, 0.3, ['大聖弓', 'SANKT BOGEN', PFEIL]), 30, 'bogen', 8);
  }

  skill3(): void {
    if (this.form === 'soulking') this.special(new CastAction(this, 'zeichen', 'yh_zeichen', (n) => {
      if (n === 'form') this.zeichenForm();
      if (n === 'fire') this.zeichenFire();
    }, 0, 0.5), 50, 'zeichen', 16);
    else if (this.form === 'almighty') this.special(new CutAction(this, 'yh_wound', 0, true, 'wound'), 24, 'wound', 6);
    else this.special(new CastAction(this, 'kreis', 'yh_kreis', (n) => n === 'crackle' && this.kreis(), 0.05, 0.3, ['苦悶の環', 'QUAL KREIS', PFEIL]), 34, 'kreis', 11);
  }

  toggle(): void {
    if (this.form === 'soulking') this.special(new CastAction(this, 'ausw', 'yh_auswahlen', (n) => n === 'ring' && this.auswahlen(), 0, 0.5), 40, 'ausw', 22);
    else if (this.form === 'almighty') this.special(new CastAction(this, 'traps', 'yh_traps', (n) => n === 'spike' && this.traps(), 0.1, 0.2), 26, 'traps', 8);
    else this.special(new CastAction(this, 'anhaben', 'yh_anhaben', (n) => n === 'shell' && this.anhaben(), 0.1, 0.5, ['外殻静血装', 'BLUT VENE ANHABEN', '#4C9BFF']), 30, 'anhaben', 14);
  }

  release(): void {
    if (this.form === 'soulking') {
      this.special(new CastAction(this, 'exert', 'yh_beams', (n) => n === 'fire' && this.exert(), 0, 0.6), 40, 'exert', 18);
      return;
    }
    if (this.form === 'almighty') {
      this.special(new ReleaseAction(this, 'release', 'yh_soulking', (n) => n === 'black' && this.becomeSoulKing(), ['霊王', 'THE SOUL KING ABSORBED', CRIMSON]), 70, 'release', 4);
      return;
    }
    this.special(new ReleaseAction(this, 'release', 'yh_awaken', (n) => n === 'open' && this.becomeAlmighty(), ['全知全能', 'THE ALMIGHTY', '#E01A2B']), 40, 'release', 4);
  }

  toggleFlare(): void {
    this.flare = !this.flare;
    this.applyStats();
    if (this.flare) {
      this.f.aura.flare(1.5, 0.4);
      this.g.shake(0.2);
      this.g.sfx.play('flare', this.f.center());
    }
  }

  private applyStats(): void {
    const f = this.f;
    const king = this.form === 'soulking';
    f.power = (king ? 1.35 : this.form === 'almighty' ? 1.15 : 1) * (this.flare ? 1.25 : 1);
    // Blut Vene: blows land on stilled blood
    f.damageTaken = king ? 0.7 : 0.85;
    f.knockTaken = king ? 0.3 : 0.7;
    f.aura.target = this.flare ? 1 : king ? 0.5 : this.form === 'almighty' ? 0.2 : 0.06;
  }

  formName(): string {
    return this.form === 'soulking' ? 'The Soul King' : this.form === 'almighty' ? 'The Almighty' : 'Emperor of the Wandenreich';
  }

  ai(): KitAI {
    const kit = this;
    const tgt = () => kit.target();
    return {
      get reach() {
        return kit.form === 'soulking' ? 2.3 : 1.9;
      },
      chain: 4,
      releaseAt: [0.72, 0.35],
      moves: [
        { name: 'broad', use: () => this.heavy(), min: 0, max: 4.5, weight: 1, cd: 4, when: () => kit.form !== 'soulking' },
        { name: 'finger', use: () => this.skill1(), min: 5, max: 34, weight: 1.2, cd: 3.5, when: () => kit.form !== 'soulking' },
        { name: 'bogen', use: () => this.skill2(), min: 8, max: 50, weight: 1, cd: 8, when: () => kit.form === 'emperor' },
        { name: 'kreis', use: () => this.skill3(), min: 4, max: 26, weight: 0.9, cd: 11, when: () => kit.form === 'emperor' },
        { name: 'anhaben', use: () => this.toggle(), min: 0, max: 7, weight: 0.6, cd: 14, when: () => kit.form === 'emperor' && kit.f.hp < kit.f.maxHp * 0.85 },
        { name: 'rewrite', use: () => this.skill2(), min: 0, max: 30, weight: 1.6, cd: 14, when: () => { const t = tgt(); return kit.form === 'almighty' && t !== null && (t.action !== null || t.rei > t.maxRei * 0.5); } },
        { name: 'wound', use: () => this.skill3(), min: 2, max: 22, weight: 1.2, cd: 6, when: () => kit.form === 'almighty' },
        { name: 'traps', use: () => this.toggle(), min: 3, max: 24, weight: 1.1, cd: 8, when: () => kit.form === 'almighty' },
        { name: 'spikes', use: () => this.heavy(), min: 2, max: 22, weight: 1.2, cd: 4.5, when: () => kit.form === 'soulking' },
        { name: 'beams', use: () => this.skill1(), min: 4, max: 45, weight: 1.3, cd: 6, when: () => kit.form === 'soulking' },
        { name: 'swarm', use: () => this.skill2(), min: 4, max: 30, weight: 0.8, cd: 14, when: () => kit.form === 'soulking' },
        { name: 'zeichen', use: () => this.skill3(), min: 8, max: 60, weight: 1, cd: 16, when: () => kit.form === 'soulking' },
        { name: 'ausw', use: () => this.toggle(), min: 0, max: 34, weight: 0.7, cd: 24, when: () => kit.form === 'soulking' && kit.f.hp < kit.f.maxHp * 0.7 },
        { name: 'exert', use: () => this.release(), min: 0, max: 12, weight: 0.8, cd: 18, when: () => kit.form === 'soulking' },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    const v: AbilityInfo = { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare };
    const shift: AbilityInfo = { key: 'Shift', name: 'Hirenkyaku', kanji: '飛廉脚' };
    if (this.form === 'soulking')
      return [
        { key: 'LMB', name: 'Broadsword', kanji: '剣' },
        { key: 'RMB', name: 'Spikes', kanji: '棘', cost: 14, cd: cd.spikes, cdMax: 4.5 },
        { key: 'Q', name: 'Eye beams', kanji: '眼', cost: 30, cd: cd.beams, cdMax: 6, tint: CRIMSON },
        { key: 'E', name: 'Torrent', kanji: '奔流', cost: 34, cd: cd.swarm, cdMax: 14 },
        { key: 'R', name: 'Zeichen blast', kanji: '紋', cost: 50, cd: cd.zeichen, cdMax: 16, tint: '#8C3CFF' },
        shift,
        { key: 'G', name: 'Auswählen', kanji: '聖別', cost: 40, cd: cd.ausw, cdMax: 22 },
        v,
        { key: 'F', name: 'Exertion', kanji: '霊王', cost: 40, cd: cd.exert, cdMax: 18, tint: CRIMSON },
      ];
    if (this.form === 'almighty')
      return [
        { key: 'LMB', name: 'Reishi sword', kanji: '剣' },
        { key: 'RMB', name: 'Broadsword', kanji: '大剣', cost: 18, cd: cd.heavy, cdMax: 4.5 },
        { key: 'Q', name: 'Fate Pfeil', kanji: '滅矢', cost: 20, cd: cd.finger, cdMax: 3.5 },
        { key: 'E', name: 'Rewrite', kanji: '改変', cost: 36, cd: cd.rewrite, cdMax: 14, tint: '#E01A2B' },
        { key: 'R', name: 'Future wound', kanji: '未来', cost: 24, cd: cd.wound, cdMax: 6 },
        shift,
        { key: 'G', name: 'Traps of fate', kanji: '罠', cost: 26, cd: cd.traps, cdMax: 8 },
        v,
        { key: 'F', name: 'Soul King', kanji: '霊王', cost: 70, cd: cd.release, cdMax: 4, tint: CRIMSON },
      ];
    return [
      { key: 'LMB', name: 'Reishi sword', kanji: '剣' },
      { key: 'RMB', name: 'Broadsword', kanji: '大剣', cost: 18, cd: cd.heavy, cdMax: 4.5 },
      { key: 'Q', name: 'Heilig Pfeil', kanji: '滅矢', cost: 20, cd: cd.finger, cdMax: 3.5 },
      { key: 'E', name: 'Sankt Bogen', kanji: '大聖弓', cost: 30, cd: cd.bogen, cdMax: 8 },
      { key: 'R', name: 'Qual Kreis', kanji: '苦悶', cost: 34, cd: cd.kreis, cdMax: 11 },
      shift,
      { key: 'G', name: 'Blut Vene Anhaben', kanji: '外殻', cost: 30, cd: cd.anhaben, cdMax: 14, tint: '#4C9BFF' },
      v,
      { key: 'F', name: 'The Almighty', kanji: '全知全能', cost: 40, cd: cd.release, cdMax: 4, tint: '#E01A2B' },
    ];
  }
}

void BlackWave;
