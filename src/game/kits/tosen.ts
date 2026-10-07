// Kaname Tōsen's kit (docs/roster/B2-captains-2.md, Kit proposal). A blind master swordsman with fast, precise
// cuts and Hakuda kicks; RMB the side kick that throws much bigger men through walls; Q "Nake, Suzumushi" (the
// blade rings and those near drop, stunned); E Suzumushi Nishiki: Benihikō (hundreds of blades rain down);
// R the disintegrating Kidō from his palm; G the Hollow mask (faster, stronger, regenerating; the reiatsu
// turns black); F "Bankai — Suzumushi Tsuishiki: Enma Kōrogi": ten rings thrown round the field pin down a
// black dome in which every enemy loses sight, hearing and the sense of reiatsu — they grope and swing at
// the air, the player's screen goes dark but for the touch of a blow — while he fights on undisturbed. The
// dome tears apart after a while, or when he is struck hard. Masked, F is the Resurrección (when it exists
// in this build, see tosenGrillo).
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { DamageOpts, Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { SUZUMUSHI_BASE, SUZUMUSHI_RING, SUZUMUSHI_TIP, tosenAsset, tosenProp, type TosenForm } from '../../chars/tosen';
import { GRILLO_CHAIN, GRILLO_STANCE, TOSEN_CHAIN, TOSEN_CLIPS, TOSEN_STANCE } from '../../chars/tosenClips';
import { grilloAsset } from '../../chars/tosenGrillo';
import { BenihikoRain, EnmaKorogi, NueveRings, SoundRings, TOSEN_PINK, WingFlutter } from '../../vfx/suzumushi';
import { CeroBeam } from '../projectiles/cero';
import { CapsuleShape, ConeShape } from '../../destruction/shapes';
import { raycastVoxels } from '../../voxel/raycast';
import { groundAt } from '../../vfx/iceArts';
import { TEX_GLOW, TEX_STREAK } from '../../vfx/sprites';
import type { AuraStyle } from '../../vfx/aura';

export const AURA_TOSEN: AuraStyle = { core: '#FFD6EA', body: '#FF8CC6', rim: '#6A2A4A' };
/** masked: black reiatsu with a dark purple outline */
export const AURA_TOSEN_MASK: AuraStyle = { core: '#B07ADF', body: '#1A0E24', rim: '#3E1E63' };

type BladeDef = NonNullable<FighterDef['blade']>;
const BLADE: BladeDef = { prop: 'sword', base: [SUZUMUSHI_BASE[0], SUZUMUSHI_BASE[1], SUZUMUSHI_BASE[2]], tip: [SUZUMUSHI_TIP[0], SUZUMUSHI_TIP[1], SUZUMUSHI_TIP[2]], color: '#E8ECF2', core: '#FFFFFF' };
const BLADE_MASK: BladeDef = { ...BLADE, color: '#5B2A7A', core: '#D9B8F2' };

const SPEED = { run: 9.6, sprint: 27, jump: 13, dash: 26, dashTime: 0.09 };
/** Grillar Grillo: a big beast, a little slower on the ground but with wings */
const GRILLO_SPEED = { run: 9, sprint: 25, jump: 15, dash: 24, dashTime: 0.11 };
const LIME = '#A8FF3A';

function props(): { key: string; model: ReturnType<typeof tosenProp>; socket: string }[] {
  return [
    { key: 'sword', model: tosenProp('suzumushi'), socket: 'grip.R' },
    { key: 'sheath', model: tosenProp('sheath-empty'), socket: 'hip.L' },
  ];
}

export const TOSEN_DEF: FighterDef = {
  id: 'tosen',
  name: 'Kaname Tōsen',
  title: 'Traitor, ex-Captain of the 9th',
  build: () => ({ asset: tosenAsset('traitor'), props: props() }),
  stance: TOSEN_STANCE,
  clips: TOSEN_CLIPS,
  aura: AURA_TOSEN,
  blade: BLADE,
  hp: 1150,
  rei: 210,
  speed: { ...SPEED },
  radius: 0.42,
  height: 1.76,
};

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

function groundAtSafe(g: Game, p: THREE.Vector3): number {
  return groundAt(g, p.x, p.y + 2, p.z, 8) ?? p.y;
}

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

/** a kick's (or palm's) reach: whoever the foot comes within `r` of is struck once */
interface Strike { at: () => THREE.Vector3; r: number; damage: number; opts: DamageOpts; hits: Set<number> }

// ---------------------------------------------------------------------------------------------- actions

/** the chain: three cuts and the front kick; 'hit' opens the window */
class CutAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private hitAt = -1;
  private kick: Strike | null = null;
  /** the lunge stops when the target is this close (0 = not lunging) */
  private stopAt = 0;
  queued = false;
  constructor(readonly kit: TosenKit, readonly clip: string, readonly index: number, readonly last: boolean) {
    super();
    this.name = clip;
    this.mobility = 0.2;
    this.airGravity = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.62;
    this.hitAt = c.events.hit ?? -1;
    f.bladeHits.clear();
    f.bladeSpec = this.last
      ? { damage: 30, knock: 10, launch: 4, heavy: true, hitstop: 0.09, shake: 0.3, cut: 520, reach: 0.25 }
      : { damage: 20, knock: 6, launch: 0, heavy: false, hitstop: 0.05, shake: 0.15, cut: 420, reach: 0.22 };
    if (this.clip === 'ts_kick') this.kick = { at: () => bonePos(f, 'foot.R'), r: 0.75, damage: 22, opts: { knock: 22, launch: 3, heavy: true, hitstop: 0.08, shake: 0.3 }, hits: new Set() };
    // Grillar Grillo: the claws (the right, the left, then the lower pair)
    const claw = this.clip === 'gr_claw1' ? 'claw.R' : this.clip === 'gr_claw2' ? 'claw.L' : this.clip === 'gr_claw3' ? 'grip2.R' : null;
    if (claw) {
      const o2 = this.clip === 'gr_claw3' ? 'grip2.L' : null;
      this.kick = {
        at: () => {
          const a = bonePos(f, claw);
          if (!o2) return a;
          return a.lerp(bonePos(f, o2), 0.5);
        },
        r: this.last ? 1.8 : 1.5, damage: this.last ? 44 : 32, opts: { knock: this.last ? 26 : 14, launch: this.last ? 6 : 1, heavy: this.last, hitstop: 0.09, shake: 0.35 }, hits: new Set(),
      };
    }
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n !== 'step') return;
        // close the gap so the edge arrives where the target stands: the push it takes to cover the gap by
        // the time of the hit (the push decays with the fighter's drag); the lunge stops at striking distance
        const tgt = f.faceTarget;
        const base = this.kit.grillo ? 8 : 6;
        let push = base;
        if (tgt) {
          const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
          this.stopAt = this.kit.grillo ? 2.0 : 1.15;
          const tau = Math.max(0.05, this.hitAt - f.anim.clip(this.clip)!.events!.step!);
          const per = (1 - Math.exp(-f.pushDrag * tau)) / f.pushDrag;
          push = Math.min(28, Math.max(base, Math.max(0, d - this.stopAt) / per));
        }
        f.push.addScaledVector(f.forward(), push);
        g.sfx.play(this.kit.grillo ? 'swingHeavy' : 'swing', f.center(), 0.8);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    // the lunge ends at striking distance instead of carrying him into the target
    const tgt = f.faceTarget;
    if (this.stopAt > 0 && tgt && Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z) <= this.stopAt) {
      f.push.x = 0;
      f.push.z = 0;
      this.stopAt = 0;
    }
    const open = this.hitAt >= 0 && t >= this.hitAt - 0.07 && t <= this.hitAt + 0.12;
    f.bladeActive = open && !this.kick;
    if (f.trail) f.trail.emitting = open && !this.kick;
    if (this.kick && open) this.kit.strike(this.kick);
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
    if (next.name === 'dash' || next instanceof SkillAction) return this.t >= this.hitAt + 0.04;
    return false;
  }
}

abstract class SkillAction extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: TosenKit) {
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

/** RMB: the side kick that sends them flying */
class SideKickAction extends SkillAction {
  readonly name = 'heavy';
  private kick: Strike | null = null;
  private hit = 0.26;
  constructor(kit: TosenKit) {
    super(kit);
    this.mobility = 0.1;
    this.armor = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    this.hit = f.anim.clip('ts_heavy')?.events.hit ?? 0.26;
    this.kick = { at: () => bonePos(f, 'foot.R'), r: 0.9, damage: 36, opts: { knock: 44, launch: 6, heavy: true, hitstop: 0.13, shake: 0.5 }, hits: new Set() };
    this.playClip(f, 'ts_heavy', (n) => {
      if (n !== 'step') return;
      const tgt = f.faceTarget;
      const extra = tgt ? Math.min(4, Math.max(0, f.pos.distanceTo(tgt) - 2)) : 0;
      f.push.addScaledVector(f.forward(), 7 + extra * 3);
      g.sfx.play('swingHeavy', f.center(), 1);
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.kick && this.t >= this.hit - 0.08 && this.t <= this.hit + 0.12) this.kit.strike(this.kick);
  }
}

/** Q: "Nake, Suzumushi" */
class NakeAction extends SkillAction {
  readonly name = 'nake';
  constructor(kit: TosenKit) {
    super(kit);
    this.mobility = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ts_nake', (n) => n === 'cry' && this.kit.cry());
    g.callout('鳴け「清虫」', 'NAKE — SUZUMUSHI', TOSEN_PINK);
  }
}

/** E: Suzumushi Nishiki — Benihikō: the arc he draws is where the blades come from */
class BenihikoAction extends SkillAction {
  readonly name = 'benihiko';
  private arc: THREE.Vector3[] = [];
  private drawing = false;
  constructor(kit: TosenKit) {
    super(kit);
    this.mobility = 0.05;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ts_benihiko', (n) => {
      if (n === 'draw') {
        this.drawing = true;
        g.sfx.play('charge', f.center(), 0.6);
      }
      if (n === 'fire') {
        this.drawing = false;
        this.kit.benihiko(this.arc);
      }
    });
    g.callout('清虫弐式・紅飛蝗', 'BENIHIKŌ', '#C3284A');
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.drawing) return;
    // the afterimage of the arc: points along the blade, glowing crimson where it passed
    const tip = f.blade.tip, base = f.blade.base;
    for (const k of [0.45, 0.75, 1]) {
      const p = new THREE.Vector3().lerpVectors(base, tip, k);
      this.arc.push(p);
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.16, sizeEnd: 0.05, life: 0.5, r: 1, g: 0.25, b: 0.4, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
  }
}

/** R: the disintegrating Kidō */
class KidoAction extends SkillAction {
  readonly name = 'kido';
  constructor(kit: TosenKit) {
    super(kit);
    this.mobility = 0.1;
  }
  override start(f: Fighter): void {
    this.kit.hands(true);
    this.playClip(f, 'ts_kido', (n) => {
      if (n === 'charge') this.kit.charge();
      if (n === 'fire') this.kit.disintegrate();
    });
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.hands(false);
  }
}

/** G: the mask drawn over his face, or let fall */
class MaskAction extends SkillAction {
  readonly name = 'mask';
  constructor(kit: TosenKit) {
    super(kit);
    this.mobility = 0.3;
    this.invulnerable = true;
  }
  override start(f: Fighter): void {
    this.kit.hands(true);
    this.playClip(f, 'ts_mask', (n) => n === 'mask' && this.kit.setMask(!this.kit.masked));
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.hands(false);
  }
}

/** F: Bankai — Enma Kōrogi */
class BankaiAction extends SkillAction {
  readonly name = 'release';
  constructor(kit: TosenKit) {
    super(kit);
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    this.kit.hands(true);
    this.playClip(f, 'ts_bankai', (n) => {
      if (n === 'word') {
        g.callout('卍解「清虫終式・閻魔蟋蟀」', 'BANKAI — ENMA KŌROGI', '#FFF3C2');
        f.aura.flare(1.6, 0.6);
        g.sfx.play('bankai', f.center(), 0.9);
      }
      if (n === 'swell') this.kit.swell();
      if (n === 'fling') this.kit.dome();
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    // the ring spinning faster, swelling to his height under his palm
    if (this.t > 0.5 && this.t < 1.25) this.kit.ringGlow(Math.min(1, (this.t - 0.5) / 0.6));
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.hands(false);
  }
}

/** F (masked): "Suzumushi Hyakushiki — Grillar Grillo": the sword upside down, darkness wraps him */
class ResurreccionAction extends SkillAction {
  readonly name = 'release';
  constructor(kit: TosenKit) {
    super(kit);
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ts_grillo', (n) => {
      if (n === 'word') {
        g.callout('清虫百式「グリジャル・グリージョ」', 'SUZUMUSHI HYAKUSHIKI — GRILLAR GRILLO', LIME);
        g.sfx.play('roarBig', f.center(), 0.8);
      }
      if (n === 'form') this.kit.becomeGrillo();
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    // darkness wrapping him from the feet up
    if (this.t > 0.55 && this.t < 1.45 && !this.kit.grillo) {
      const c = f.center();
      for (let i = 0; i < 5; i++) {
        const a = Math.random() * Math.PI * 2, r = 0.4 + Math.random() * 0.9;
        g.engine.dust.spawn({ x: c.x + Math.cos(a) * r, y: f.pos.y + Math.random() * 2.4, z: c.z + Math.sin(a) * r, vx: -Math.cos(a) * 1.5, vy: 1.2, vz: -Math.sin(a) * 1.5, size: 0.8, sizeEnd: 1.6, life: 0.8, r: 0.04, g: 0.03, b: 0.06, alpha: 0.9, alphaEnd: 0, drag: 1.2 });
      }
    }
  }
}

/** Grillo RMB: both great arms slammed down */
class SlamAction extends SkillAction {
  readonly name = 'heavy';
  constructor(kit: TosenKit) {
    super(kit);
    this.mobility = 0.05;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'gr_slam', (n) => {
      if (n === 'step') g.sfx.play('swingHeavy', f.center(), 1.2);
      if (n === 'slam') this.kit.slam();
    });
  }
}

/** Grillo Q: La Mirada (full: F) */
class MiradaAction extends SkillAction {
  readonly name = 'mirada';
  constructor(kit: TosenKit, readonly full: boolean) {
    super(kit);
    this.mobility = 0.15;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'gr_mirada', (n) => {
      if (n === 'charge') g.sfx.play('charge', f.center(), 1);
      if (n === 'fire') this.kit.mirada(this.full);
    });
    g.callout(this.full ? 'ラ・ミラーダ・完全' : 'ラ・ミラーダ', this.full ? 'LA MIRADA — ALL FOUR' : 'LA MIRADA', LIME);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    // a Cero swelling before each eye, then the two drawn together
    if (this.t > 0.15 && this.t < 0.95) this.kit.eyeCharge(Math.min(1, (this.t - 0.15) / 0.6), this.t > 0.75 ? (this.t - 0.75) / 0.2 : 0, this.full);
  }
}

/** Grillo E: Los Nueve Aspectos */
class NueveAction extends SkillAction {
  readonly name = 'nueve';
  private rings: NueveRings | null = null;
  constructor(kit: TosenKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'gr_nueve', (n) => {
      if (n === 'draw') {
        this.rings = new NueveRings(g, () => ({ p: f.center().add(new THREE.Vector3(0, 0.6, 0)), fw: f.forward(new THREE.Vector3()) }));
        g.addProjectile(this.rings);
        g.sfx.play('charge', f.center(), 0.8);
      }
      if (n === 'fire') {
        this.rings?.fire();
        this.kit.nueve();
      }
    });
    g.callout('九相輪殺', 'LOS NUEVE ASPECTOS', LIME);
  }
  override end(f: Fighter): void {
    super.end(f);
    if (this.rings && !this.rings.done) this.rings.fire();
  }
}

/** Grillo R: the screech */
class ScreechAction extends SkillAction {
  readonly name = 'screech';
  constructor(kit: TosenKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.5;
  }
  override start(f: Fighter): void {
    this.playClip(f, 'gr_screech', (n) => n === 'screech' && this.kit.screech());
  }
}

// ---------------------------------------------------------------------------------------------- the kit

export class TosenKit implements Kit {
  masked = false;
  /** Resurrección: Grillar Grillo */
  grillo = false;
  private wings: WingFlutter | null = null;
  flare = false;
  comboIndex = 0;
  readonly cd = { heavy: 0, nake: 0, benihiko: 0, kido: 0, mask: 0, bankai: 0, mirada: 0, nueve: 0, screech: 0, leap: 0, full: 0 };
  /** the Bankai's dome while it stands */
  field: EnmaKorogi | null = null;
  private fieldT = 0;
  private lastEnd = 0;

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.def = { ...f.def, speed: { ...SPEED } };
    this.hands(false);
    // a heavy blow tears the dome apart
    f.onHurt = (amount) => {
      if (this.field && amount >= f.maxHp * 0.12) this.dropField();
    };
    this.applyStats();
  }

  /** the right hand closed on Suzumushi; the left open */
  hands(_casting: boolean): void {
    if (this.grillo) return;
    const rig = this.f.visual.rig;
    rig.setBoneVisible('fist.R', true);
    rig.setBoneVisible('palm.R', false);
    rig.setBoneVisible('fist.L', false);
    rig.setBoneVisible('palm.L', true);
  }

  update(dt: number): void {
    const { f } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    // the mask: high-speed regeneration
    if (this.masked && !f.dead) f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.006 * dt);
    if (this.field) {
      this.fieldT -= dt;
      if (this.field.active) for (const o of this.g.enemiesOf(f)) if (!o.dead && this.field.inside(o.center(_v))) o.blindT = Math.max(o.blindT, 0.35);
      if (this.fieldT <= 0 || f.dead || f.hp < f.maxHp * 0.3) this.dropField();
      if (this.field?.done) this.field = null;
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

  /** a kick's window: strike whoever the foot reaches */
  strike(s: Strike): void {
    const { f, g } = this;
    const p = s.at();
    for (const o of g.enemiesOf(f)) {
      if (o.dead || s.hits.has(o.id)) continue;
      const cy = Math.max(o.pos.y + 0.1, Math.min(o.pos.y + o.def.height, p.y));
      if (Math.hypot(p.x - o.pos.x, p.y - cy, p.z - o.pos.z) > s.r + o.def.radius) continue;
      s.hits.add(o.id);
      _w.subVectors(o.pos, f.pos).setY(0).normalize();
      g.damage(o, s.damage, f, _w.clone(), s.opts);
      g.sparks(o.center(), _w, this.masked ? '#B07ADF' : TOSEN_PINK, 12);
    }
  }

  // ---------------------------------------------------------------- techniques

  /** Q: the ringing — those within reach drop, stunned */
  cry(): void {
    const { f, g } = this;
    const R = this.masked ? 14 : 11;
    const blade = () => new THREE.Vector3().lerpVectors(f.blade.base, f.blade.tip, 0.5);
    g.addProjectile(new SoundRings(g, blade, R, 1.2, this.masked ? '#B07ADF' : TOSEN_PINK));
    g.addRing(f.pos.clone().setY(f.pos.y + 0.3), R, this.masked ? '#B07ADF' : TOSEN_PINK, 0.7);
    g.sfx.play('ting', f.center(), 1.4);
    g.sfx.play('charge', f.center(), 0.6);
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      const d = o.pos.distanceTo(f.pos);
      if (d > R + o.def.radius) continue;
      const k = 1 - (d / (R + 2)) * 0.5;
      g.damage(o, 6, f, _v.subVectors(o.pos, f.pos).setY(0).normalize().clone(), { knock: 1, energy: true, quiet: true });
      o.stopAction();
      o.hitstun = Math.max(o.hitstun, 1.6 * k);
      o.slow(0.6, 2.5 * k);
      if (o === g.player) {
        g.engine.gr.chroma.offset.set(0.006, 0.006);
        g.hud?.showBanner('Suzumushi — your ears ring, the world tilts');
      }
    }
  }

  /** E: the blades loosed off the arc he drew */
  benihiko(arc: THREE.Vector3[]): void {
    const { f, g } = this;
    const pts = arc.length > 4 ? arc : [f.blade.tip.clone()];
    const tgt = this.aim();
    const count = this.masked ? 140 : 100;
    g.addProjectile(new BenihikoRain(g, f, pts, tgt, { count, damage: 4.5, spread: 3.2, maxHitsEach: 22 }));
    g.sfx.play('swingHeavy', f.center(), 1.2);
    for (let i = 0; i < 12; i++) {
      const p = pts[Math.floor(Math.random() * pts.length)];
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5) * 4, vy: 3 + Math.random() * 3, vz: (Math.random() - 0.5) * 4, size: 0.12, sizeEnd: 0.02, life: 0.4, r: 1, g: 0.3, b: 0.45, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2.5 });
    }
  }

  /** R's gather: a pale glow in the palm */
  charge(): void {
    const { f, g } = this;
    const p = bonePos(f, 'palm.L');
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.5, sizeEnd: 0.2, life: 0.25, r: 1, g: 0.85, b: 0.92, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  }

  /** R: the disintegrating Kidō — a pale beam out of the palm that unmakes what it touches */
  disintegrate(): void {
    const { f, g } = this;
    const from = bonePos(f, 'palm.L');
    const to = this.aim();
    const dir = to.clone().sub(from).normalize();
    const range = 26;
    const hit = raycastVoxels(g.engine.world, from.x, from.y, from.z, dir.x, dir.y, dir.z, range);
    const len = hit ? Math.min(range, hit.dist + 2.5) : range;
    const end = from.clone().addScaledVector(dir, len);
    g.engine.destruction.carve(new CapsuleShape(from.clone().addScaledVector(dir, 0.8), end, 0.55), { mode: 'erase', power: 900, dust: 0.2 });
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      const c = o.center(_v);
      const along = Math.max(0, Math.min(len, _w.subVectors(c, from).dot(dir)));
      const p = from.clone().addScaledVector(dir, along);
      if (p.distanceTo(c) > o.def.radius + 0.8) continue;
      g.damage(o, 34, f, dir.clone().setY(0).normalize(), { knock: 8, launch: 2, heavy: true, energy: true, hitstop: 0.08, shake: 0.35, color: '#FFE0F0' });
    }
    // the beam: a pale streak and motes burning away along it
    for (let i = 0; i < 40; i++) {
      const k = Math.random() * len;
      const p = from.clone().addScaledVector(dir, k);
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: dir.x * 20, vy: dir.y * 20, vz: dir.z * 20, size: 0.35, sizeEnd: 0.05, life: 0.22, r: 1, g: 0.86, b: 0.94, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 5 });
    }
    g.engine.glow.spawn({ x: from.x, y: from.y, z: from.z, size: 1.2, sizeEnd: 0.2, life: 0.2, r: 1, g: 0.85, b: 0.92, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    g.sfx.play('beam', from, 0.8);
  }

  setMask(on: boolean): void {
    const { f, g } = this;
    if (on === this.masked) return;
    this.masked = on;
    if (on) {
      f.setForm({ asset: tosenAsset('masked'), props: props() }, AURA_TOSEN_MASK, BLADE_MASK);
      g.callout('仮面', 'HOLLOW MASK', '#B07ADF');
      g.sfx.play('mask', f.center(), 1);
      f.aura.flare(1.6, 0.5);
    } else {
      f.setForm({ asset: tosenAsset('traitor'), props: props() }, AURA_TOSEN, BLADE);
      g.sfx.play('shatter', f.center(), 0.8);
    }
    this.hands(false);
    this.applyStats();
  }

  /** the ring swelling under his palm during the Bankai's call */
  ringGlow(k: number): void {
    const { f, g } = this;
    const prop = f.visual.props.get('sword');
    if (!prop) return;
    prop.updateWorldMatrix(true, false);
    const p = _v.set(SUZUMUSHI_RING[0], SUZUMUSHI_RING[1], SUZUMUSHI_RING[2]).applyMatrix4(prop.matrixWorld);
    if (Math.random() < 0.6) g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.3 + k * 1.6, sizeEnd: 0.1, life: 0.2, r: 1, g: 0.95, b: 0.76, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
  }

  swell(): void {
    this.g.sfx.play('charge', this.f.center(), 0.8);
  }

  /** the rings thrown out and the dome raised */
  dome(): void {
    const { f, g } = this;
    if (this.field) this.field.shred();
    const prop = f.visual.props.get('sword');
    const from = prop ? _v.set(SUZUMUSHI_RING[0], SUZUMUSHI_RING[1], SUZUMUSHI_RING[2]).applyMatrix4(prop.matrixWorld).clone() : f.center();
    this.field = new EnmaKorogi(g, f, from, 18);
    this.fieldT = 16;
    g.addProjectile(this.field);
    g.sfx.play('flare', f.center(), 0.8);
    if (f === g.player || (g.player && g.player.pos.distanceTo(f.pos) < 30)) g.shake(0.3);
  }

  private dropField(): void {
    if (!this.field) return;
    this.field.shred();
    this.field = null;
    if (this.f === this.g.player) this.g.hud?.showBanner('Enma Kōrogi torn apart');
  }

  // ---------------------------------------------------------------- Grillar Grillo

  becomeGrillo(): void {
    const { f, g } = this;
    if (this.grillo) return;
    this.dropField();
    this.grillo = true;
    this.masked = true;
    f.def = { ...f.def, stance: GRILLO_STANCE, height: 3.4, radius: 0.85, speed: { ...GRILLO_SPEED } };
    f.setForm({ asset: grilloAsset(), props: [] }, AURA_TOSEN_MASK);
    f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.3);
    f.aura.flare(2, 0.8);
    f.anim.play('gr_birth', { fadeIn: 0 });
    this.wings = new WingFlutter(f);
    g.addProjectile(this.wings);
    g.sfx.play('roarBig', f.center(), 1);
    if (f === g.player) {
      g.shake(0.5);
      g.hud?.showBanner('He can see.');
    }
    this.applyStats();
  }

  /** RMB (Grillo): both claws into the ground before him */
  slam(): void {
    const { f, g } = this;
    const p = bonePos(f, 'claw.R').lerp(bonePos(f, 'claw.L'), 0.5);
    const gy = groundAtSafe(g, p);
    p.y = gy;
    g.groundImpact(p, 3.2, 700, LIME, f);
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      _v.subVectors(o.pos, p);
      const d = Math.hypot(_v.x, _v.z);
      if (d > 6 + o.def.radius || Math.abs(_v.y) > 4) continue;
      g.damage(o, 56 * (1 - d / 9), f, _v.setY(0).normalize().clone(), { knock: 18, launch: 9, heavy: true, hitstop: 0.12, shake: 0.5 });
    }
    if (f === g.player) g.shake(0.45);
  }

  /** a Cero swelling before each eye (k), the pair drawn together (m) */
  eyeCharge(k: number, m: number, full: boolean): void {
    const { f, g } = this;
    const a = bonePos(f, 'eye.L'), b = bonePos(f, 'eye.R');
    const mid = a.clone().lerp(b, 0.5);
    for (const e of [a, b]) {
      const p = e.lerp(mid, Math.min(1, m));
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.25 + k * (full ? 1.1 : 0.7), sizeEnd: 0.1, life: 0.08, r: 0.66, g: 1, b: 0.23, alpha: 1, alphaEnd: 0.6, tex: TEX_GLOW });
    }
  }

  /** La Mirada: the merged Cero off his eyes */
  mirada(full: boolean): void {
    const { f, g } = this;
    const emitter = f.visual.rig.sockets.get('mouth');
    if (!emitter) return;
    g.addProjectile(new CeroBeam(g, f, emitter, () => this.aim(), full
      ? { charge: 0.15, fire: 1.1, radius: 1.6, damage: 220, power: 900, core: '#F1FFD6', body: LIME, rim: '#2E6A10', range: 120, track: 0.8, gain: 1.3 }
      : { charge: 0.12, fire: 0.6, radius: 0.85, damage: 110, power: 560, core: '#F1FFD6', body: LIME, rim: '#2E6A10', range: 90, track: 1.4, gain: 1.4 }));
    g.sfx.play('beam', f.center(), full ? 1.3 : 1);
    if (f === g.player) g.engine.gr.chroma.offset.set(0.005, 0.005);
  }

  /** Los Nueve Aspectos: the burst of sound down the line he faces — it crushes what it hits */
  nueve(): void {
    const { f, g } = this;
    const fw = f.forward(new THREE.Vector3());
    const from = f.center().addScaledVector(fw, 1.2);
    const len = 26;
    g.engine.destruction.carve(new ConeShape(from.clone(), fw.clone(), 0.32, len), { mode: 'smash', power: 650, impulse: 20, debris: 0.3, dust: 1.2, dir: fw.clone() });
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      const c = o.center(_v);
      const along = _w.subVectors(c, from).dot(fw);
      if (along < 0 || along > len) continue;
      const off = _w.subVectors(c, from).addScaledVector(fw, -along).length();
      if (off > Math.tan(0.32) * along + 1.2 + o.def.radius) continue;
      g.damage(o, 96 * (1 - along / (len * 1.6)), f, fw.clone(), { knock: 34, launch: 7, heavy: true, energy: true, hitstop: 0.14, shake: 0.6, color: LIME });
    }
    for (let i = 0; i < 4; i++) g.addRing(from.clone().addScaledVector(fw, 3 + i * 5), 2 + i * 1.6, LIME, 0.4 + i * 0.08);
    for (let i = 0; i < 40; i++) {
      const a = (Math.random() - 0.5) * 0.6, e = (Math.random() - 0.5) * 0.5;
      const d = fw.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), a);
      d.y += e;
      g.engine.glow.spawn({ x: from.x, y: from.y, z: from.z, vx: d.x * 40, vy: d.y * 40, vz: d.z * 40, size: 0.3, sizeEnd: 0.05, life: 0.5, r: 0.66, g: 1, b: 0.23, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 4, drag: 1 });
    }
    g.sfx.play('explode', from, 1.2);
    if (f === g.player) g.shake(0.6);
  }

  /** R (Grillo): the screech — everything near reels and is thrown back */
  screech(): void {
    const { f, g } = this;
    const R = 13;
    g.addProjectile(new SoundRings(g, () => bonePos(f, 'mouth'), R, 1.2, LIME));
    g.addRing(f.pos.clone().setY(f.pos.y + 0.3), R, LIME, 0.6);
    g.sfx.play('roarBig', f.center(), 1.1);
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      _v.subVectors(o.pos, f.pos).setY(0);
      const d = _v.length();
      if (d > R + o.def.radius) continue;
      g.damage(o, 24 * (1 - d / (R + 4)), f, _v.normalize().clone(), { knock: 26 * (1 - d / (R + 4)), launch: 4, heavy: true, energy: true });
      o.hitstun = Math.max(o.hitstun, 1.1 * (1 - d / (R + 4)));
    }
    if (f === g.player) g.shake(0.4);
  }

  /** G (Grillo): a beat of the wings — a great leap up and forward */
  leap(): void {
    const { f, g } = this;
    if (this.cd.leap > 0 || f.busy) return;
    this.cd.leap = 1.6;
    const fw = f.forward(new THREE.Vector3());
    f.body.vel.y = Math.max(f.body.vel.y, 17);
    f.body.grounded = false;
    f.push.addScaledVector(fw, 12);
    if (this.wings) this.wings.beat = 1;
    g.sfx.play('airstep', f.center(), 1.2);
    const p = f.pos;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      g.engine.dust.spawn({ x: p.x, y: p.y + 0.2, z: p.z, vx: Math.cos(a) * 8, vy: 1, vz: Math.sin(a) * 8, size: 0.8, sizeEnd: 2.4, life: 0.8, r: 0.6, g: 0.58, b: 0.52, alpha: 0.5, alphaEnd: 0, drag: 2 });
    }
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
    const list = this.grillo ? GRILLO_CHAIN : TOSEN_CHAIN;
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    this.lastEnd = this.g.time + 0.7;
    this.f.act(new CutAction(this, list[idx], idx, idx === list.length - 1), true);
  }

  heavy(): void {
    if (this.grillo) this.special(new SlamAction(this), 18, 'heavy', 3.5);
    else this.special(new SideKickAction(this), 12, 'heavy', 3);
  }

  skill1(): void {
    if (this.grillo) this.special(new MiradaAction(this, false), 32, 'mirada', 5);
    else this.special(new NakeAction(this), 26, 'nake', 9);
  }

  skill2(): void {
    if (this.grillo) this.special(new NueveAction(this), 40, 'nueve', 8);
    else this.special(new BenihikoAction(this), 30, 'benihiko', 6);
  }

  skill3(): void {
    if (this.grillo) this.special(new ScreechAction(this), 24, 'screech', 7);
    else this.special(new KidoAction(this), 20, 'kido', 4);
  }

  toggle(): void {
    if (this.grillo) {
      this.leap();
      return;
    }
    if (this.cd.mask > 0 || this.f.busy) return;
    if (!this.masked && !this.f.spendRei(25)) {
      if (this.f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    this.cd.mask = 3;
    this.f.act(new MaskAction(this), true);
  }

  release(): void {
    if (this.grillo) {
      this.special(new MiradaAction(this, true), 70, 'full', 16);
      return;
    }
    if (this.masked) {
      const f = this.f;
      if (f.busy) return;
      if (!f.spendRei(60)) {
        if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
        return;
      }
      f.act(new ResurreccionAction(this), true);
      return;
    }
    if (this.field) return;
    this.special(new BankaiAction(this), 50, 'bankai', 28);
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
    const inField = this.field?.active === true;
    f.power = (this.grillo ? 1.45 : this.masked ? 1.3 : 1) * (this.flare ? 1.25 : 1) * (inField ? 1.15 : 1);
    f.damageTaken = this.grillo ? 0.75 : this.masked ? 0.85 : 1;
    f.knockTaken = this.grillo ? 0.4 : 1;
    if (!this.grillo) {
      const sp = this.masked ? 1.15 : 1;
      f.def.speed.run = SPEED.run * sp;
      f.def.speed.sprint = SPEED.sprint * sp;
      f.def.speed.dash = SPEED.dash * sp;
    }
    if (this.grillo && f === this.g.player) {
      const cam = this.g.cam;
      cam.height += (3 - cam.height) * 0.05;
      if (cam.dist < 7) cam.dist += (7 - cam.dist) * 0.05;
    }
    f.aura.target = this.flare ? 1 : this.masked ? 0.45 : inField ? 0.3 : 0.06;
  }

  formName(): string {
    if (this.grillo) return 'Resurrección — Grillar Grillo';
    const parts = [this.masked ? 'Hollow mask' : 'Traitor'];
    if (this.field) parts.push('Enma Kōrogi');
    return parts.join(' · ');
  }

  ai(): KitAI {
    const kit = this;
    return {
      get reach() {
        return kit.grillo ? 3.4 : 1.8;
      },
      chain: 4,
      releaseAt: [0.8, 0.4],
      toggleAt: 0.55,
      toggleOn: () => kit.masked,
      moves: [
        { name: 'kick', use: () => this.heavy(), min: 0, max: 2.6, weight: 1, cd: 3, when: () => !kit.grillo },
        { name: 'nake', use: () => this.skill1(), min: 0, max: 9, weight: 0.9, cd: 9, when: () => !kit.grillo },
        { name: 'benihiko', use: () => this.skill2(), min: 5, max: 24, weight: 1.2, cd: 6, when: () => !kit.grillo },
        { name: 'kido', use: () => this.skill3(), min: 5, max: 24, weight: 1, cd: 4, when: () => !kit.grillo },
        { name: 'slam', use: () => this.heavy(), min: 0, max: 4, weight: 1, cd: 4, when: () => kit.grillo },
        { name: 'mirada', use: () => this.skill1(), min: 6, max: 40, weight: 1.2, cd: 5, when: () => kit.grillo },
        { name: 'nueve', use: () => this.skill2(), min: 4, max: 20, weight: 1.1, cd: 8, when: () => kit.grillo },
        { name: 'screech', use: () => this.skill3(), min: 0, max: 10, weight: 0.8, cd: 8, when: () => kit.grillo },
        { name: 'full', use: () => this.release(), min: 8, max: 50, weight: 1.3, cd: 16, when: () => kit.grillo && this.f.rei >= 70 },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    if (this.grillo)
      return [
        { key: 'LMB', name: 'Claws', kanji: '爪' },
        { key: 'RMB', name: 'Slam', kanji: '叩' , cost: 18, cd: cd.heavy, cdMax: 3.5 },
        { key: 'Q', name: 'La Mirada', kanji: '眼閃', cost: 32, cd: cd.mirada, cdMax: 5 },
        { key: 'E', name: 'Los Nueve Aspectos', kanji: '九相輪殺', cost: 40, cd: cd.nueve, cdMax: 8 },
        { key: 'R', name: 'Screech', kanji: '鳴', cost: 24, cd: cd.screech, cdMax: 7 },
        { key: 'Shift', name: 'Sonído', kanji: '響転' },
        { key: 'G', name: 'Wing leap', kanji: '翔', cd: cd.leap, cdMax: 1.6 },
        { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
        { key: 'F', name: 'La Mirada — all four', kanji: '四閃', cost: 70, cd: cd.full, cdMax: 16 },
      ];
    return [
      { key: 'LMB', name: 'Suzumushi', kanji: '清虫' },
      { key: 'RMB', name: 'Side kick', kanji: '蹴' , cost: 12, cd: cd.heavy, cdMax: 3 },
      { key: 'Q', name: 'Nake, Suzumushi', kanji: '鳴', cost: 26, cd: cd.nake, cdMax: 9 },
      { key: 'E', name: 'Benihikō', kanji: '紅飛蝗', cost: 30, cd: cd.benihiko, cdMax: 6 },
      { key: 'R', name: 'Kidō', kanji: '鬼道', cost: 20, cd: cd.kido, cdMax: 4 },
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩' },
      { key: 'G', name: 'Hollow mask', kanji: '仮面', active: this.masked },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      this.masked
        ? { key: 'F', name: 'Grillar Grillo', kanji: '百式', cost: 60 }
        : { key: 'F', name: 'Enma Kōrogi', kanji: '閻魔蟋蟀', cost: 50, cd: cd.bankai, cdMax: 28, active: this.field !== null },
    ];
  }
}

void ({} as TosenForm);
