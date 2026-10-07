// Shunsui Kyōraku's kit (docs/roster/B2-captains-2.md, Kit proposal). Sealed, Captain of the 8th: lazy
// one-sword cuts with the tachi; RMB the daishō's two tempos (the wakizashi drawn across first, the tachi
// down behind it); Q Tsukiyubi (two fingers and a push of reishi that throws the target metres back); E
// Hadō #78 Zangerin (a ring of light that cuts through what it passes); R "Nomō!" — a sip of sake (a slow
// heal, and Katen warms to it). G sheds a layer — the kimono, then the haori — flung over the target as a
// blind; what he wears decides what Irooni lets him cut. F: "Hana kaze midarete, kashin naki; tenpū
// midarete, tenma warau — Katen Kyōkotsu": children's games made real. LMB the two-blade string at two
// tempos; RMB Bushōgoma (the wind top and its tornado); Q Takaoni (whoever is higher wins: he is suddenly
// high over the target, and comes down); E Kageoni (into his own shadow, up out of the target's); R Irooni
// (a colour called: his cuts count by how much of it he wears, then the call passes to the other side).
// F again, once Katen is in the mood: Bankai — Katen Kyōkotsu: Karamatsu Shinjū. The play's Acts, in
// order, on Q / E / R / F: the shared wounds, the bed of shame, the abyss, and the thread at the throat.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { KATEN_TIP_Z, KYOKOTSU_TIP_Z, TACHI_TIP_Z, WAKI_TIP_Z, kyorakuAsset, kyorakuProp, type KyorakuForm } from '../../chars/kyoraku';
import { KATEN_CHAIN, KATEN_STANCE, KYORAKU_CHAIN, KYORAKU_CLIPS, KYORAKU_STANCE } from '../../chars/kyorakuClips';
import { Abyss, COLOURS, DarkSpots, KatenSpirit, PineShadows, SKY_ABYSS, SKY_GLOOM, ShadowPool, ThroatThread, ThrownGarment, WindTop, ZangerinRing, coverage, irooniScale, sharedWounds, type Colour } from '../../vfx/katen';
import { SkyTint } from '../../vfx/fire';
import { SwordTrail } from '../../vfx/trail';
import { ConeShape } from '../../destruction/shapes';
import { TEX_GLOW, TEX_PUFF } from '../../vfx/sprites';
import type { AuraStyle } from '../../vfx/aura';

export const AURA_KYORAKU: AuraStyle = { core: '#FFF4C8', body: '#F2C744', rim: '#7A5A10' };
const AURA_BANKAI: AuraStyle = { core: '#E8D8A8', body: '#B89A4A', rim: '#2A2418' };

type BladeDef = NonNullable<FighterDef['blade']>;
const BLADE_TACHI: BladeDef = { prop: 'sword', base: [0, 0, 0.13], tip: [0, 0, TACHI_TIP_Z], color: '#F2C744', core: '#FFF6D8' };
const BLADE_KATEN: BladeDef = { prop: 'sword', base: [0, 0.02, 0.13], tip: [0, 0.07, KATEN_TIP_Z], color: '#F2C744', core: '#FFF6D8' };

const SPEED = { run: 10, sprint: 31, jump: 14, dash: 26, dashTime: 0.1 };
const BANKAI_TIME = 45;
const ACTS = [
  { kanji: '一段目 躊躇疵分合', romaji: 'ICHIDANME — TAMERAIKIZU NO WAKACHIAI' },
  { kanji: '二段目 慚愧の褥', romaji: 'NIDANME — ZANKI NO SHITONE' },
  { kanji: '三段目 断魚淵', romaji: 'SANDANME — DANGYO NO FUCHI' },
  { kanji: '〆の段 糸切鋏血染喉', romaji: 'SHIME NO DAN — ITOKIRIBASAMI CHIZOME NO NODOBUE' },
];

function sealedProps(): { key: string; model: ReturnType<typeof kyorakuProp>; socket: string }[] {
  return [
    { key: 'sword', model: kyorakuProp('tachi'), socket: 'grip.R' },
    { key: 'saya', model: kyorakuProp('sayaT'), socket: 'hip.L' },
    { key: 'saya2', model: kyorakuProp('sayaW'), socket: 'hip.L2' },
  ];
}

export const KYORAKU_DEF: FighterDef = {
  id: 'kyoraku',
  name: 'Shunsui Kyōraku',
  title: 'Captain, 8th Division',
  build: () => ({ asset: kyorakuAsset('captain'), props: sealedProps() }),
  stance: KYORAKU_STANCE,
  clips: KYORAKU_CLIPS,
  aura: AURA_KYORAKU,
  blade: BLADE_TACHI,
  hp: 1150,
  rei: 180,
  speed: { ...SPEED },
  radius: 0.42,
  height: 1.92,
};

type Form = 'sealed' | 'shikai' | 'bankai';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
/** the wakizashi sits in its scabbard: its blade starts at the scabbard's mouth */
const WAKI_SHEATHED = new THREE.Vector3(0, 0, -6.3 / 48);

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

/** Light cuts: the right blade's window at 'hit', the left one's at 'hitL', 'combo' to chain. */
class StringAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private hitAt = -1;
  private hitLAt = -1;
  queued = false;
  constructor(readonly kit: KyorakuKit, readonly clip: string, readonly index: number, readonly last: boolean) {
    super();
    this.name = clip;
    this.mobility = 0.2;
    this.airGravity = 0.15;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    this.hitAt = c.events.hit ?? -1;
    this.hitLAt = c.events.hitL ?? -1;
    const heavy = this.clip === 'ky_cleave';
    f.bladeHits.clear();
    this.kit.leftHits.clear();
    const dmg = this.kit.form === 'sealed' ? (heavy ? 36 : 17) : 15;
    f.bladeSpec = { damage: dmg, knock: heavy ? 16 : 6, launch: this.last ? 4 : 0, heavy, hitstop: heavy ? 0.1 : 0.04, shake: heavy ? 0.35 : 0.12, cut: heavy ? 420 : 220 };
    this.kit.leftSpec = { damage: 14, knock: 6, launch: this.last ? 4 : 0, hitstop: 0.04, shake: 0.12, cut: 200 };
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n !== 'step') return;
        const tgt = f.faceTarget;
        const extra = tgt ? Math.min(5, Math.max(0, f.pos.distanceTo(tgt) - 1.5)) : 0;
        f.push.addScaledVector(f.forward(), (heavy ? 9 : 7) + extra * 3.4);
        g.sfx.play(heavy ? 'swingHeavy' : 'swing', f.center(), 0.75);
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
  constructor(readonly kit: KyorakuKit) {
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
  override end(f: Fighter): void {
    f.bladeActive = false;
    this.kit.leftActive = false;
    if (f.trail) f.trail.emitting = false;
    this.kit.leftTrail.emitting = false;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t > this.dur * 0.6;
  }
}

/** RMB (sealed): the daishō — the wakizashi drawn and across, the tachi down behind it, at two tempos. */
class DaishoAction extends SkillAction {
  readonly name = 'daisho';
  private hitL = 0.2;
  private hit = 0.4;
  constructor(kit: KyorakuKit) {
    super(kit);
    this.mobility = 0.15;
    this.armor = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    this.kit.leftHits.clear();
    f.bladeSpec = { damage: 34, knock: 14, launch: 3, heavy: true, hitstop: 0.09, shake: 0.35, cut: 420 };
    this.kit.leftSpec = { damage: 20, knock: 3, launch: 0, hitstop: 0.05, shake: 0.15, cut: 260 };
    this.playClip(f, 'ky_daisho', (n) => {
      if (n === 'draw') this.kit.drawWaki(true);
      if (n === 'step') {
        f.push.addScaledVector(f.forward(), 9);
        g.sfx.play('swing', f.center(), 0.8);
      }
      if (n === 'sheathe') this.kit.drawWaki(false);
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    this.kit.leftActive = t >= this.hitL - 0.06 && t <= this.hitL + 0.06;
    f.bladeActive = t >= this.hit - 0.06 && t <= this.hit + 0.06;
    this.kit.leftTrail.emitting = t >= this.hitL - 0.08 && t <= this.hitL + 0.1;
    if (f.trail) f.trail.emitting = t >= this.hit - 0.08 && t <= this.hit + 0.1;
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.drawWaki(false);
  }
}

/** Q (sealed): Tsukiyubi — two fingers set on the target and a push of reishi. */
class FingerAction extends SkillAction {
  readonly name = 'tsukiyubi';
  constructor(kit: KyorakuKit) {
    super(kit);
    this.mobility = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ky_finger', (n) => {
      if (n === 'step') f.push.addScaledVector(f.forward(), 9);
      if (n === 'hit') this.kit.fingerPush();
    });
    g.callout('撞指', 'TSUKIYUBI', '#f2c744');
  }
}

/** E (sealed): Hadō #78 Zangerin — the ring of light. */
class ZangerinAction extends SkillAction {
  readonly name = 'zangerin';
  constructor(kit: KyorakuKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ky_zangerin', (n) => {
      if (n === 'charge') {
        const p = f.center();
        for (let i = 0; i < 24; i++) {
          const a = Math.random() * Math.PI * 2, r = 1.6 + Math.random();
          g.engine.glow.spawn({ x: p.x + Math.sin(a) * r, y: p.y + (Math.random() - 0.5), z: p.z + Math.cos(a) * r, vx: -Math.sin(a) * 4, vy: 0, vz: -Math.cos(a) * 4, size: 0.25, sizeEnd: 0.05, life: 0.35, r: 1, g: 0.82, b: 0.35, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
        }
      }
      if (n === 'fire') {
        const c = f.pos.clone();
        c.y += 1.0;
        g.addProjectile(new ZangerinRing(g, f, c, 18, 72));
        g.addRing(f.pos.clone().setY(f.pos.y + 0.05), 6, '#f2c744', 0.4);
        g.shake(f === g.player ? 0.45 : 0.18);
        g.sfx.play('flare', c, 1);
      }
    });
  }
}

/** R (sealed): "Nomō!" — a sip of sake from the dish. */
class SakeAction extends SkillAction {
  readonly name = 'sake';
  constructor(kit: KyorakuKit) {
    super(kit);
    this.mobility = 0.25;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ky_sake', (n) => {
      if (n === 'sip') {
        this.kit.sip();
        g.callout('飲もう', 'NOMŌ!', '#f2c744');
      }
    });
  }
}

/** G: a layer shed and flung at the target. */
class ShedAction extends SkillAction {
  readonly name = 'shed';
  constructor(kit: KyorakuKit, readonly clip: string) {
    super(kit);
    this.mobility = 0.3;
  }
  override start(f: Fighter): void {
    this.playClip(f, this.clip, (n) => {
      if (n === 'throw') this.kit.shed();
    });
  }
}

/** F (sealed): the crossing of the blades and the release. */
class ReleaseAction extends SkillAction {
  readonly name = 'release';
  constructor(kit: KyorakuKit) {
    super(kit);
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ky_release', (n) => {
      if (n === 'draw') this.kit.drawWaki(true);
      if (n === 'cross') {
        g.callout('花風紊れて 花神啼き', 'HANA KAZE MIDARETE, KASHIN NAKI…', '#f2c744');
        f.aura.flare(1.2, 0.4);
      }
      if (n === 'form') this.kit.becomeShikai();
    });
  }
}

/** RMB (Shikai): Bushōgoma — the spin, the wind top flung off at the target. */
class TopAction extends SkillAction {
  readonly name = 'bushogoma';
  constructor(kit: KyorakuKit, readonly target: Fighter | null) {
    super(kit);
    this.mobility = 0.1;
    this.armor = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ky_spin', (n) => {
      if (n === 'spin') {
        g.callout('不精独楽', 'BUSHŌGOMA', '#e8f4f0');
        g.sfx.play('swingHeavy', f.center(), 1);
      }
      if (n === 'fire') {
        const fw = this.target ? _v.subVectors(this.target.pos, f.pos).setY(0).normalize().clone() : f.forward(_v).clone();
        const from = f.center().addScaledVector(fw, 1.2);
        g.addProjectile(new WindTop(g, f, from, fw, this.target, { speed: 22, range: 32, cut: 9, hold: 2.6 }));
        g.sfx.play('flare', from, 0.8);
      }
    });
  }
}

/** Q (Shikai): Takaoni — whoever is higher wins. He is suddenly high over the target, and comes down. */
class TakaoniAction extends FighterAction {
  readonly name = 'takaoni';
  private phase: 'crouch' | 'dive' = 'crouch';
  private diveT = 0;
  private landed = false;
  constructor(readonly kit: KyorakuKit, readonly target: Fighter) {
    super();
    this.mobility = 0;
    this.airGravity = 0;
    this.trackTarget = true;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('ky_takaoni', {
      onEvent: (n) => {
        if (n !== 'vanish' || this.target.dead) return;
        const o = this.target;
        const toward = _v.subVectors(o.pos, f.pos).setY(0);
        if (toward.lengthSq() < 0.01) f.forward(toward);
        toward.normalize();
        f.ghosts.spawn(1, 0.3);
        f.body.pos.set(o.pos.x - toward.x * 1.1, o.pos.y + 11, o.pos.z - toward.z * 1.1);
        f.body.prev.copy(f.body.pos);
        f.body.vel.set(0, 0, 0);
        f.body.grounded = false;
        f.hovering = false;
        f.yaw = Math.atan2(toward.x, toward.z);
        g.callout('嶄鬼', 'TAKAONI', '#f2c744');
        g.sfx.play('shunpo', f.center(), 0.9);
        this.kit.takaoniT = 8;
        this.phase = 'dive';
        // and down he comes (the action no longer holds him in the air)
        this.airGravity = 1.4;
        f.anim.play('ky_dive', {});
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.phase === 'crouch') {
      if (this.t > 0.6) this.done = true;
      return;
    }
    this.diveT += dt;
    if (!this.landed) {
      f.body.vel.y = Math.min(f.body.vel.y, -30);
      // he comes down on the target wherever it has gone
      const o = this.target;
      if (!o.dead) {
        _w.set(o.pos.x - f.pos.x, 0, o.pos.z - f.pos.z);
        const d = _w.length();
        const v = Math.min(24, d * 8);
        if (d > 0.05) f.body.vel.set((_w.x / d) * v, f.body.vel.y, (_w.z / d) * v);
      }
      if (f.grounded || this.diveT > 0.85) {
        this.landed = true;
        this.kit.diveImpact(this.target);
      }
    } else if (this.diveT > 1.3) this.done = true;
  }
}

/** E (Shikai): Kageoni — into his own shadow, up out of the target's. */
class KageoniAction extends FighterAction {
  readonly name = 'kageoni';
  private phase: 'sink' | 'under' | 'rise' = 'sink';
  private phaseT = 0;
  private struck = false;
  constructor(readonly kit: KyorakuKit, readonly target: Fighter) {
    super();
    this.mobility = 0;
    this.airGravity = 1;
  }
  override start(f: Fighter, g: Game): void {
    g.addProjectile(new ShadowPool(g, f.pos.clone(), 1.5, 0.9));
    g.callout('影鬼', 'KAGEONI', '#7a6a9a');
    f.anim.play('ky_sink', {
      onEvent: (n) => {
        if (n !== 'sink') return;
        this.kit.hide(true);
        this.invulnerable = true;
        this.phase = 'under';
        this.phaseT = 0;
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    this.phaseT += dt;
    const o = this.target;
    if (this.phase === 'sink') {
      if (this.t > 1) this.done = true;
      return;
    }
    if (this.phase === 'under') {
      if (this.phaseT < 0.3) return;
      // up out of the shadow the target stands on
      const toward = _v.subVectors(o.pos, f.pos).setY(0);
      if (toward.lengthSq() < 0.01) f.forward(toward);
      toward.normalize();
      f.body.pos.set(o.pos.x - toward.x * 0.7, o.pos.y, o.pos.z - toward.z * 0.7);
      f.body.prev.copy(f.body.pos);
      f.body.vel.set(0, 0, 0);
      f.yaw = Math.atan2(toward.x, toward.z);
      g.addProjectile(new ShadowPool(g, o.pos.clone(), 1.6, 0.8, o));
      this.kit.hide(false);
      this.invulnerable = false;
      this.phase = 'rise';
      this.phaseT = 0;
      f.anim.play('ky_rise', {});
      g.sfx.play('shunpo', f.center(), 0.8);
      return;
    }
    if (!this.struck && this.phaseT >= 0.14) {
      this.struck = true;
      if (!o.dead && Math.hypot(o.pos.x - f.pos.x, o.pos.z - f.pos.z) < 2.6) {
        _w.subVectors(o.pos, f.pos).setY(0).normalize();
        g.damage(o, 82, f, _w.clone(), { knock: 4, launch: 12, heavy: true, hitstop: 0.14, shake: 0.5, color: '#141418' });
        g.sparks(o.center(), _w, '#7a6a9a', 14);
      }
    }
    if (this.phaseT > 0.7) this.done = true;
  }
  override end(): void {
    this.kit.hide(false);
  }
}

/** R (Shikai): Irooni — the colour called. */
class IrooniAction extends SkillAction {
  readonly name = 'irooni';
  constructor(kit: KyorakuKit, readonly target: Fighter) {
    super(kit);
    this.mobility = 0.4;
  }
  override start(f: Fighter): void {
    this.playClip(f, 'ky_call', (n) => {
      if (n === 'call') this.kit.callColour(this.target);
    });
  }
}

/** F (Shikai): Bankai — the blades out before him, points down; the pine's shadows spread. */
class BankaiAction extends SkillAction {
  readonly name = 'bankai';
  constructor(kit: KyorakuKit, readonly partner: Fighter) {
    super(kit);
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    g.callout('卍解', 'BANKAI', '#b89a4a');
    this.playClip(f, 'ky_bankai', (n) => {
      if (n === 'pine') this.kit.openPlay();
      if (n === 'form') this.kit.becomeBankai(this.partner);
    });
  }
}

/** Bankai Q / E / R: an Act — the narration, and the curse falls on the partner. */
class ActAction extends SkillAction {
  readonly name = 'act';
  constructor(kit: KyorakuKit, readonly n: number) {
    super(kit);
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    const a = ACTS[this.n];
    g.callout(a.kanji, a.romaji, '#d8c48a');
    this.playClip(f, 'ky_act', (e) => {
      if (e === 'act') this.kit.performAct(this.n);
    });
  }
}

/** Bankai F: the Final Act — both swords sheathed, the thread round the throat, the cut. */
class FinalAction extends FighterAction {
  readonly name = 'final';
  private phase: 'sheathe' | 'thread' = 'sheathe';
  private thread: ThroatThread | null = null;
  private pullT = -1;
  private cut = false;
  constructor(readonly kit: KyorakuKit, readonly partner: Fighter) {
    super();
    this.mobility = 0;
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    const a = ACTS[3];
    g.callout(a.kanji, a.romaji, '#ffd45a');
    f.anim.play('ky_sheathe', {
      onEvent: (n) => {
        if (n !== 'sheathe') return;
        this.kit.sheatheAll(true);
        g.sfx.play('ting', f.center(), 0.8);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const o = this.partner;
    if (!o.dead) {
      // the partner cannot leave the stage now
      o.hitstun = Math.max(o.hitstun, 0.25);
      o.push.set(0, 0, 0);
      o.body.vel.x = 0;
      o.body.vel.z = 0;
    }
    if (this.phase === 'sheathe') {
      if (this.t < 0.85) return;
      this.phase = 'thread';
      f.anim.play('ky_thread', {
        onEvent: (n) => {
          if (n === 'thread' && !o.dead) {
            this.thread = new ThroatThread(g, () => sock(f, 'finger.R'), o);
            g.addProjectile(this.thread);
            g.sfx.play('ting', o.center(), 0.6);
          }
          if (n === 'pull') this.pullT = 0;
          if (n === 'cut' && !this.cut) {
            this.cut = true;
            this.thread?.cut();
            this.kit.finale(o);
          }
        },
      });
      return;
    }
    if (this.thread && this.pullT >= 0) {
      this.pullT += dt;
      this.thread.tight = Math.min(1, this.pullT / 0.35);
    }
    if (this.t > 0.85 + 2.2) this.done = true;
  }
  override end(): void {
    if (this.thread && !this.cut) this.thread.done = true;
    this.kit.sheatheAll(false);
    this.kit.endBankai();
  }
}

// ------------------------------------------------------------------ the kit

interface Call {
  colour: Colour;
  /** multiplier while the call holds */
  scale: number;
  t: number;
  /** his call (his cuts scale) or theirs (their cuts on him scale) */
  mine: boolean;
  by: Fighter;
}

export class KyorakuKit implements Kit {
  form: Form = 'sealed';
  outfit: KyorakuForm = 'captain';
  flare = false;
  comboIndex = 0;
  /** Katen's mood: the Bankai waits until she is in it */
  mood = 0;
  takaoniT = 0;
  bankaiT = 0;
  /** the next Act to perform (0..3) */
  act = 0;
  partner: Fighter | null = null;
  call: Call | null = null;
  readonly cd = { heavy: 0, finger: 0, zangerin: 0, sake: 0, shed: 0, top: 0, takaoni: 0, kageoni: 0, irooni: 0, act: 0 };
  // the left blade (the wakizashi drawn, or Kyōkotsu): sampled here, the right one by the fighter
  readonly leftTrail: SwordTrail;
  readonly leftHits = new Set<number>();
  leftActive = false;
  leftSpec: BladeSpec | null = null;
  private leftBase = new THREE.Vector3();
  private leftTip = new THREE.Vector3();
  private prevLB = new THREE.Vector3();
  private prevLT = new THREE.Vector3();
  private leftValid = false;
  private wakiDrawn = false;
  private sheathed = false;
  private lastEnd = 0;
  private lureT = 0;
  private sakeT = 0;
  private lastHitBy: Fighter | null = null;
  /** wounds taken from each fighter (Act 1 hands them back) */
  private taken = new Map<number, number>();
  private pines: PineShadows | null = null;
  private katen: KatenSpirit | null = null;
  private sky: SkyTint | null = null;
  private abyss: Abyss | null = null;
  private abyssSky: SkyTint | null = null;
  private abyssT = 0;
  private spotsT = 0;
  private mirror = false;

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    this.leftTrail = new SwordTrail(30, AURA_KYORAKU.body, AURA_KYORAKU.core);
    g.engine.gr.scene.add(this.leftTrail.mesh);
    // who hit him, and how hard: the play keeps the books
    f.parry = (_a, from) => {
      this.lastHitBy = from;
      return false;
    };
    f.onHurt = (amount) => this.hurt(amount);
    // the wakizashi rides in its scabbard until it is wanted
    f.visual.attach('waki', kyorakuProp('waki'), 'hip.L2', WAKI_SHEATHED.clone());
    this.hands();
    this.applyStats();
  }

  private hands(): void {
    const rig = this.f.visual.rig;
    const leftFist = this.form !== 'sealed' ? !this.sheathed : this.wakiDrawn;
    rig.setBoneVisible('fist.R', !this.sheathed);
    rig.setBoneVisible('palm.R', this.sheathed);
    rig.setBoneVisible('fist.L', leftFist);
    rig.setBoneVisible('palm.L', !leftFist);
  }

  private hurt(amount: number): void {
    const from = this.lastHitBy;
    this.lastHitBy = null;
    this.mood = Math.min(100, this.mood + 6 + amount * 0.04);
    if (!from) return;
    this.taken.set(from.id, (this.taken.get(from.id) ?? 0) + amount);
    // Act 1 holds: what the partner does to him, the partner suffers too (it cannot kill)
    if (this.mirror && from === this.partner && !from.dead) {
      from.hp = Math.max(1, from.hp - amount * 0.6);
      sharedWounds(this.g, from, 4);
    }
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    if (this.lureT > 0 && (this.lureT -= dt) <= 0) f.lure = null;
    // Katen warms up while there is a fight on
    const foe = this.target();
    if (foe && foe.pos.distanceTo(f.pos) < 30 && !f.dead) this.mood = Math.min(100, this.mood + dt * (foe.def.boss ? 4 : 2));
    if (this.sakeT > 0) {
      this.sakeT -= dt;
      f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.03 * dt);
    }
    if (this.takaoniT > 0) this.takaoniT -= dt;
    if (this.call) {
      this.call.t -= dt;
      if (this.call.t <= 0) this.passCall();
    }
    this.sampleLeft(dt);
    if (this.form === 'bankai') this.updatePlay(dt);
    this.applyStats();
  }

  /** the left blade: trail and sweep hits, with its own hit list */
  private sampleLeft(dt: number): void {
    const { f, g } = this;
    const key = this.form !== 'sealed' ? (this.sheathed ? null : 'sword2') : this.wakiDrawn ? 'waki' : null;
    const prop = key ? f.visual.props.get(key) : null;
    if (!prop) {
      this.leftValid = false;
      this.leftTrail.emitting = false;
      return;
    }
    prop.updateWorldMatrix(true, false);
    this.prevLB.copy(this.leftBase);
    this.prevLT.copy(this.leftTip);
    this.leftBase.set(0, 0.02, 0.12).applyMatrix4(prop.matrixWorld);
    this.leftTip.set(0, key === 'waki' ? 0.02 : 0.06, key === 'waki' ? WAKI_TIP_Z : KYOKOTSU_TIP_Z).applyMatrix4(prop.matrixWorld);
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

  // ---------------------------------------------------------------- moves

  /** the wakizashi out of its scabbard into the left hand, or back */
  drawWaki(on: boolean): void {
    const f = this.f;
    if (this.form !== 'sealed' || on === this.wakiDrawn) return;
    this.wakiDrawn = on;
    if (on) {
      if (!f.visual.props.has('waki')) f.visual.attach('waki', kyorakuProp('waki'), 'grip.L');
      else f.visual.moveProp('waki', 'grip.L', new THREE.Vector3(0, 0, 0));
    } else f.visual.moveProp('waki', 'hip.L2', WAKI_SHEATHED.clone());
    this.leftValid = false;
    this.hands();
  }

  /** the Final Act: both swords home (hidden), the hands open; or drawn again */
  sheatheAll(on: boolean): void {
    if (this.sheathed === on) return;
    this.sheathed = on;
    const f = this.f;
    for (const k of ['sword', 'sword2']) {
      const p = f.visual.props.get(k);
      if (p) p.visible = !on;
    }
    if (f.trail) f.trail.emitting = false;
    this.hands();
  }

  hide(on: boolean): void {
    this.f.visual.object.visible = !on;
    this.f.aura.group.visible = !on;
  }

  fingerPush(): void {
    const { f, g } = this;
    const fw = f.forward(_v).clone();
    const p = sock(f, 'finger.L');
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 1.4, sizeEnd: 0.2, life: 0.25, r: 1, g: 0.95, b: 0.8, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    g.engine.destruction.carve(new ConeShape(p.clone(), fw.clone(), 0.5, 3.2), { mode: 'smash', power: 220, impulse: 18, dust: 0.6 });
    for (const o of g.enemiesOf(f)) {
      const c = o.center();
      _w.subVectors(o.pos, f.pos).setY(0);
      const d = _w.length();
      if (d > 2.4 + o.def.radius || _w.normalize().dot(fw) < 0.4 || Math.abs(c.y - p.y) > o.def.height * 0.7) continue;
      g.damage(o, 44, f, fw.clone(), { knock: 46, launch: 5, heavy: true, hitstop: 0.12, shake: 0.5 });
      for (let i = 0; i < 16; i++) g.engine.dust.spawn({ x: c.x, y: c.y, z: c.z, vx: fw.x * 10 + (Math.random() - 0.5) * 4, vy: Math.random() * 3, vz: fw.z * 10 + (Math.random() - 0.5) * 4, size: 0.4, sizeEnd: 1.2, life: 0.5, r: 0.95, g: 0.93, b: 0.85, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
    }
  }

  sip(): void {
    this.sakeT = 6;
    this.mood = Math.min(100, this.mood + 15);
  }

  /** G: off comes the kimono (then the haori), flung over the target */
  shed(): void {
    const { f, g } = this;
    if (this.outfit === 'shed') return;
    const kind = this.outfit === 'captain' ? 'kimono' : 'haori';
    const t = this.target();
    const from = sock(f, 'back').add(new THREE.Vector3(0, 0.2, 0));
    const garment = new ThrownGarment(g, f, kind, from, t && t.pos.distanceTo(f.pos) < 14 ? t : null);
    g.addProjectile(garment);
    // eyes follow the cloth for a moment
    f.lure = garment.pos;
    this.lureT = 1.4;
    this.outfit = this.outfit === 'captain' ? 'haori' : 'shed';
    this.rebuild();
    g.sfx.play('swing', from, 0.9);
    if (f === g.player) {
      const cov = coverage(kyorakuAsset(this.outfit).model);
      g.hud?.showBanner(`${kind === 'kimono' ? 'The kimono' : 'The haori'} comes off — black: ${Math.round((cov.get('kuro') ?? 0) * 100)}% of him`);
    }
  }

  /** Takaoni's dive lands */
  diveImpact(o: Fighter): void {
    const { f, g } = this;
    g.groundImpact(f.pos.clone(), 3.2, 280, AURA_KYORAKU.body, f);
    if (!o.dead && Math.hypot(o.pos.x - f.pos.x, o.pos.z - f.pos.z) < 3 + o.def.radius && Math.abs(o.pos.y - f.pos.y) < 3) {
      _w.subVectors(o.pos, f.pos).setY(0).normalize();
      g.damage(o, 96, f, _w.clone(), { knock: 10, launch: 6, heavy: true, hitstop: 0.14, shake: 0.6 });
    }
    g.shake(f === g.player ? 0.6 : 0.25);
  }

  /** Irooni: he calls the colour he wears most that the target also wears */
  callColour(o: Fighter): void {
    const { f, g } = this;
    const mine = coverage(f.visual.model);
    const theirs = coverage(o.visual.model);
    let best: Colour = 'kuro', bestCov = -1;
    for (const [c, k] of mine) {
      if ((theirs.get(c) ?? 0) < 0.03) continue;
      if (k > bestCov) {
        best = c;
        bestCov = k;
      }
    }
    if (bestCov < 0) bestCov = mine.get('kuro') ?? 0;
    const scale = irooniScale(bestCov);
    this.call = { colour: best, scale, t: 6, mine: true, by: f };
    const C = COLOURS[best];
    g.callout(`艶鬼 — ${C.kanji}`, `IROONI — ${best.toUpperCase()}`, C.hex);
    if (f === g.player) g.hud?.showBanner(`Only ${C.name} can be cut — you wear ${Math.round(bestCov * 100)}%: ×${scale.toFixed(2)}`);
    g.addRing(o.pos.clone().setY(o.pos.y + 0.05), 3, C.hex, 0.5);
  }

  /** the call passes to the other side: their cuts on him count by what they wear */
  private passCall(): void {
    const { f, g } = this;
    const c = this.call!;
    if (!c.mine) {
      this.call = null;
      return;
    }
    const o = this.target();
    if (!o) {
      this.call = null;
      return;
    }
    const mine = coverage(f.visual.model);
    const theirs = coverage(o.visual.model);
    let best: Colour = 'kuro', bestCov = -1;
    for (const [col, k] of theirs) {
      if ((mine.get(col) ?? 0) < 0.03) continue;
      if (k > bestCov) {
        best = col;
        bestCov = k;
      }
    }
    if (bestCov < 0) {
      this.call = null;
      return;
    }
    this.call = { colour: best, scale: irooniScale(bestCov), t: 5, mine: false, by: o };
    const C = COLOURS[best];
    g.callout(C.kanji, `${o.name.split(' ')[0].toUpperCase()} CALLS ${C.name.toUpperCase()}`, C.hex);
  }

  // ---------------------------------------------------------------- forms

  private props(): { key: string; model: ReturnType<typeof kyorakuProp>; socket: string }[] {
    if (this.form === 'sealed') return sealedProps();
    return [
      { key: 'sword', model: kyorakuProp('katen'), socket: 'grip.R' },
      { key: 'sword2', model: kyorakuProp('kyokotsu'), socket: 'grip.L' },
      { key: 'saya', model: kyorakuProp('sayaT'), socket: 'hip.L' },
      { key: 'saya2', model: kyorakuProp('sayaW'), socket: 'hip.L2' },
    ];
  }

  private rebuild(): void {
    const f = this.f;
    const aura = this.form === 'bankai' ? AURA_BANKAI : AURA_KYORAKU;
    f.setForm({ asset: kyorakuAsset(this.outfit), props: this.props() }, aura, this.form === 'sealed' ? BLADE_TACHI : BLADE_KATEN);
    if (this.form === 'sealed') {
      if (this.wakiDrawn) f.visual.attach('waki', kyorakuProp('waki'), 'grip.L');
      else f.visual.attach('waki', kyorakuProp('waki'), 'hip.L2', WAKI_SHEATHED.clone());
    }
    if (this.sheathed) for (const k of ['sword', 'sword2']) {
      const p = f.visual.props.get(k);
      if (p) p.visible = false;
    }
    this.leftValid = false;
    this.hands();
  }

  becomeShikai(): void {
    const { f, g } = this;
    if (this.form !== 'sealed') return;
    this.form = 'shikai';
    this.wakiDrawn = false;
    f.visual.detach('waki');
    f.def = { ...f.def, stance: KATEN_STANCE, blade: BLADE_KATEN };
    this.rebuild();
    f.aura.flare(1.8, 0.6);
    g.callout('花天狂骨', 'KATEN KYŌKOTSU', '#f2c744');
    g.sfx.play('flare', f.center(), 0.9);
    g.shake(f === g.player ? 0.35 : 0.12);
    this.applyStats();
  }

  /** the curtain goes up: the gloom, and the pine's shadows over the ground */
  openPlay(): void {
    const { f, g } = this;
    this.pines?.end();
    this.pines = new PineShadows(g, f.pos.clone(), 26);
    g.addProjectile(this.pines);
    // Katen comes out to watch over the play
    this.katen?.end();
    this.katen = new KatenSpirit(g, f);
    g.addProjectile(this.katen);
    if (!this.sky) {
      this.sky = new SkyTint(g, SKY_GLOOM, 1.6);
      g.addProjectile(this.sky);
    } else this.sky.target = 1;
    g.callout('花天狂骨枯松心中', 'KATEN KYŌKOTSU: KARAMATSU SHINJŪ', '#b89a4a');
    g.sfx.play('flare', f.center(), 1);
    g.shake(f === g.player ? 0.5 : 0.2);
  }

  becomeBankai(partner: Fighter): void {
    const f = this.f;
    this.form = 'bankai';
    this.partner = partner;
    this.act = 0;
    this.bankaiT = BANKAI_TIME;
    this.mood = 0;
    this.rebuild();
    f.aura.flare(1.4, 0.8);
    this.applyStats();
  }

  /** an Act's curse falls on the partner */
  performAct(n: number): void {
    const { f, g } = this;
    const o = this.partner;
    if (!o || o.dead) return;
    this.act = n + 1;
    if (n === 0) {
      // the wounds he took from the partner open again on the partner — they can't kill
      const owed = Math.min(this.taken.get(o.id) ?? 0, o.maxHp * 0.4);
      o.hp = Math.max(1, o.hp - owed);
      if (g.hud) g.hud.damageNumber(o.center(), owed, f === g.player ? '#ffe066' : '#ff6b6b', f === g.player);
      sharedWounds(g, o, 22);
      o.anim.flinch(-120, 40);
      this.mirror = true;
    } else if (n === 1) {
      g.addProjectile(new DarkSpots(g, o, 12));
      this.spotsT = 12;
    } else if (n === 2) {
      const mid = new THREE.Vector3().addVectors(f.pos, o.pos).multiplyScalar(0.5);
      mid.y = Math.min(f.pos.y, o.pos.y) - 0.5;
      this.abyss = new Abyss(g, mid);
      g.addProjectile(this.abyss);
      this.abyssSky = new SkyTint(g, SKY_ABYSS, 2);
      g.addProjectile(this.abyssSky);
      this.abyssT = 9;
    }
    g.shake(f === g.player ? 0.3 : 0.1);
  }

  /** the Final Act's cut: the throat, and the head bursts */
  finale(o: Fighter): void {
    const { f, g } = this;
    if (o.dead) return;
    // only something that lives without its head lives through it
    const amount = o.def.boss ? o.maxHp * 0.35 : o.hp + o.maxHp * 0.1;
    g.slowMo(0.5, 0.3);
    g.damage(o, amount / Math.max(0.2, f.power), f, _v.subVectors(o.pos, f.pos).setY(0).normalize().clone(), { knock: 2, heavy: true, hitstop: 0.25, shake: 0.9, color: '#ffd45a' });
  }

  private updatePlay(dt: number): void {
    const { f, g } = this;
    const o = this.partner;
    this.bankaiT -= dt;
    if (this.spotsT > 0 && o && !o.dead) {
      // the bed of shame: blood from every opening; nothing heals it
      this.spotsT -= dt;
      o.hp = Math.max(1, o.hp - o.maxHp * 0.022 * dt);
    }
    if (this.abyss) {
      this.abyssT -= dt;
      if (o && !o.dead && this.abyss.holds(o.center())) {
        // swimming up takes you deeper; the reiatsu runs out, then the air
        o.body.vel.x *= 1 - Math.min(1, dt * 3);
        o.body.vel.z *= 1 - Math.min(1, dt * 3);
        if (o.body.vel.y > 0) o.body.vel.y = -o.body.vel.y * 0.5;
        o.body.vel.y -= 6 * dt;
        o.hovering = false;
        o.rei = Math.max(0, o.rei - 11 * dt);
        if (o.rei <= 0) o.hp -= o.maxHp * 0.03 * dt;
        if (o.hp <= 0) g.kill(o, f, _v.set(0, 0, 1));
      }
      if (this.abyss.holds(f.center())) {
        f.body.vel.x *= 1 - Math.min(1, dt * 1.2);
        f.body.vel.z *= 1 - Math.min(1, dt * 1.2);
      }
      if (this.abyssT <= 0) this.drainAbyss();
    }
    const finale = f.action instanceof FinalAction;
    if (!finale && ((o && o.dead) || !o || this.bankaiT <= 0) && !f.busy) this.endBankai();
  }

  private drainAbyss(): void {
    this.abyss?.drain();
    this.abyss = null;
    if (this.abyssSky) this.abyssSky.target = 0;
    this.abyssSky = null;
  }

  endBankai(): void {
    const { f, g } = this;
    if (this.form !== 'bankai') return;
    this.form = 'shikai';
    this.partner = null;
    this.mirror = false;
    this.spotsT = 0;
    this.drainAbyss();
    this.pines?.end();
    this.pines = null;
    this.katen?.end();
    this.katen = null;
    if (this.sky) this.sky.target = 0;
    this.sky = null;
    this.sheathed = false;
    this.rebuild();
    if (f === g.player) g.hud?.showBanner('The curtain falls');
    this.applyStats();
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
    if (cur instanceof StringAction) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastEnd > 0.7) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const list = this.form === 'sealed' ? KYORAKU_CHAIN : KATEN_CHAIN;
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    this.lastEnd = this.g.time + 0.7;
    this.f.act(new StringAction(this, list[idx], idx, idx === list.length - 1), true);
  }

  /** RMB: the daishō / Bushōgoma. */
  heavy(): void {
    if (this.form === 'sealed') this.special(new DaishoAction(this), 12, 'heavy', 2.4);
    else this.special(new TopAction(this, this.target()), 20, 'top', 5);
  }

  /** Q: Tsukiyubi / Takaoni / Act 1. */
  skill1(): void {
    if (this.form === 'bankai') return this.nextAct(0);
    if (this.form === 'sealed') {
      this.special(new FingerAction(this), 10, 'finger', 4);
      return;
    }
    const t = this.near(30);
    if (t) this.special(new TakaoniAction(this, t), 25, 'takaoni', 8);
  }

  /** E: Zangerin / Kageoni / Act 2. */
  skill2(): void {
    if (this.form === 'bankai') return this.nextAct(1);
    if (this.form === 'sealed') {
      this.special(new ZangerinAction(this), 30, 'zangerin', 9);
      return;
    }
    const t = this.near(24);
    if (t) this.special(new KageoniAction(this, t), 25, 'kageoni', 7);
  }

  /** R: sake / Irooni / Act 3. */
  skill3(): void {
    if (this.form === 'bankai') return this.nextAct(2);
    if (this.form === 'sealed') {
      this.special(new SakeAction(this), 0, 'sake', 20);
      return;
    }
    const t = this.near(30);
    if (t) this.special(new IrooniAction(this, t), 15, 'irooni', 12);
  }

  /** G: shed a layer. */
  toggle(): void {
    if (this.outfit === 'shed') {
      if (this.f === this.g.player) this.g.hud?.showBanner('Nothing left to throw off');
      return;
    }
    this.special(new ShedAction(this, this.form === 'sealed' ? 'ky_shed' : 'ky_shedS'), 0, 'shed', 3);
  }

  /** the Acts go in order: one only plays when its turn has come */
  private nextAct(n: number): void {
    const o = this.partner;
    if (!o || o.dead) return;
    if (n !== this.act) {
      if (this.f === this.g.player) this.g.hud?.showBanner(this.act < 4 ? `The play goes in order — Act ${this.act + 1} is next` : 'The play is over');
      return;
    }
    this.special(new ActAction(this, n), 10, 'act', 1.5);
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
    if (this.form === 'bankai') {
      // F in the play: the Final Act, once the three before it are done
      const o = this.partner;
      if (!o || o.dead) return;
      if (this.act !== 3) {
        if (f === g.player) g.hud?.showBanner(`The play goes in order — Act ${this.act + 1} is next`);
        return;
      }
      if (f.spendRei(20)) f.act(new FinalAction(this, o), true);
      return;
    }
    const t = this.near(40);
    if (!t) return;
    if (this.mood < 100) {
      if (f === g.player) g.hud?.showBanner(`Katen isn't in the mood yet (${Math.floor(this.mood)}%)`);
      return;
    }
    if (!f.spendRei(60)) {
      if (f === g.player) g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(new BankaiAction(this, t), true);
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
    const fm = this.form;
    // the lighter he is dressed, the lighter on his feet
    const light = this.outfit === 'shed' ? 1.08 : this.outfit === 'haori' ? 1.04 : 1;
    f.def = { ...f.def, speed: { run: SPEED.run * light, sprint: SPEED.sprint * light, jump: SPEED.jump, dash: SPEED.dash * light, dashTime: SPEED.dashTime } };
    let power = (fm === 'bankai' ? 1.2 : fm === 'shikai' ? 1.15 : 1) * (this.flare ? 1.25 : 1);
    let taken = 1;
    // Takaoni: whoever is higher wins
    const o = this.target();
    if (this.takaoniT > 0 && o) {
      const up = f.pos.y - o.pos.y;
      if (up > 0.5) power *= 1.6;
      else if (up < -0.5) {
        power *= 0.6;
        taken *= 1.5;
      }
    }
    // Irooni: the call in force
    if (this.call) {
      if (this.call.mine) power *= this.call.scale;
      else taken *= this.call.scale;
    }
    f.power = power;
    f.damageTaken = taken;
    f.aura.target = this.flare ? 1 : fm === 'bankai' ? 0.45 : fm === 'shikai' ? 0.2 : 0.08;
  }

  formName(): string {
    const dress = this.outfit === 'captain' ? '' : this.outfit === 'haori' ? ' · kimono off' : ' · haori off';
    const call = this.call ? ` · Irooni: ${COLOURS[this.call.colour].name}${this.call.mine ? ` ×${this.call.scale.toFixed(1)}` : ' (theirs)'}` : '';
    if (this.form === 'bankai') return `Bankai — Karamatsu Shinjū · ${this.act < 4 ? `Act ${this.act + 1} next` : 'curtain'}`;
    if (this.form === 'shikai') return `Shikai — Katen Kyōkotsu · Katen's mood ${Math.floor(this.mood)}%${dress}${call}`;
    return `Captain, 8th Division${dress}`;
  }

  ai(): KitAI {
    const sealed = () => this.form === 'sealed', shikai = () => this.form === 'shikai', bankai = () => this.form === 'bankai';
    return {
      reach: 1.9,
      chain: 4,
      releaseAt: 0.85,
      moves: [
        { name: 'daisho', use: () => this.heavy(), min: 0, max: 3, weight: 1.2, cd: 3, when: sealed },
        { name: 'tsukiyubi', use: () => this.skill1(), min: 0, max: 2.2, weight: 1.1, cd: 5, when: sealed },
        { name: 'zangerin', use: () => this.skill2(), min: 0, max: 12, weight: 0.8, cd: 10, when: sealed },
        { name: 'sake', use: () => this.skill3(), min: 8, max: 200, weight: 0.8, cd: 20, when: () => sealed() && this.f.hp < this.f.maxHp * 0.7 },
        { name: 'shed', use: () => this.toggle(), min: 3, max: 16, weight: 0.6, cd: 12, when: () => shikai() && this.outfit !== 'shed' },
        { name: 'bushogoma', use: () => this.heavy(), min: 3, max: 22, weight: 1.2, cd: 5, when: () => !sealed() },
        { name: 'takaoni', use: () => this.skill1(), min: 2, max: 26, weight: 1, cd: 9, when: shikai },
        { name: 'kageoni', use: () => this.skill2(), min: 3, max: 20, weight: 1.1, cd: 8, when: shikai },
        { name: 'irooni', use: () => this.skill3(), min: 0, max: 20, weight: 1.3, cd: 14, when: () => shikai() && !this.call },
        { name: 'bankai', use: () => this.release(), min: 3, max: 30, weight: 6, cd: 4, when: () => shikai() && this.mood >= 100 && this.f.rei >= 60 },
        { name: 'act', use: () => (this.act === 3 ? this.release() : this.act === 0 ? this.skill1() : this.act === 1 ? this.skill2() : this.skill3()), min: 0, max: 40, weight: 6, cd: 3, when: () => bankai() && this.act < 4 },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const fm = this.form, cd = this.cd;
    const list: AbilityInfo[] = [];
    const shed = this.outfit === 'captain' ? 'Kimono off' : this.outfit === 'haori' ? 'Haori off' : 'Shed';
    if (fm === 'sealed') {
      list.push(
        { key: 'LMB', name: 'Katen Kyōkotsu', kanji: '花天' },
        { key: 'RMB', name: 'Daishō', kanji: '大小', cost: 12, cd: cd.heavy, cdMax: 2.4 },
        { key: 'Q', name: 'Tsukiyubi', kanji: '撞指', cost: 10, cd: cd.finger, cdMax: 4 },
        { key: 'E', name: 'Zangerin', kanji: '斬華輪', cost: 30, cd: cd.zangerin, cdMax: 9 },
        { key: 'R', name: 'Sake', kanji: '酒', cd: cd.sake, cdMax: 20 },
      );
    } else if (fm === 'shikai') {
      list.push(
        { key: 'LMB', name: 'Two blades', kanji: '双' },
        { key: 'RMB', name: 'Bushōgoma', kanji: '不精独楽', cost: 20, cd: cd.top, cdMax: 5 },
        { key: 'Q', name: 'Takaoni', kanji: '嶄鬼', cost: 25, cd: cd.takaoni, cdMax: 8, active: this.takaoniT > 0 },
        { key: 'E', name: 'Kageoni', kanji: '影鬼', cost: 25, cd: cd.kageoni, cdMax: 7 },
        { key: 'R', name: 'Irooni', kanji: '艶鬼', cost: 15, cd: cd.irooni, cdMax: 12, active: this.call !== null },
      );
    } else {
      list.push(
        { key: 'LMB', name: 'Two blades', kanji: '双' },
        { key: 'RMB', name: 'Bushōgoma', kanji: '不精独楽', cost: 20, cd: cd.top, cdMax: 5 },
        { key: 'Q', name: 'Act 1', kanji: '一段目', cost: 10, active: this.act === 0, tint: '#d8c48a' },
        { key: 'E', name: 'Act 2', kanji: '二段目', cost: 10, active: this.act === 1, tint: '#d8c48a' },
        { key: 'R', name: 'Act 3', kanji: '三段目', cost: 10, active: this.act === 2, tint: '#d8c48a' },
      );
    }
    list.push(
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩' },
      { key: 'G', name: shed, kanji: '脱', cd: cd.shed, cdMax: 3, active: this.outfit !== 'shed' },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      fm === 'sealed' ? { key: 'F', name: 'Shikai', kanji: '始解', cost: 30 }
        : fm === 'shikai' ? { key: 'F', name: this.mood >= 100 ? 'Bankai' : `Katen ${Math.floor(this.mood)}%`, kanji: '卍解', cost: 60, active: this.mood >= 100 }
          : { key: 'F', name: 'Final Act', kanji: '〆の段', cost: 20, active: this.act === 3, tint: '#ffd45a' },
    );
    return list;
  }
}
