// TYBW Hitsugaya's kit (docs/kits/hitsugaya.md; dossier B3 §Hitsugaya, TYBW). The Captain kit, grown: in Shikai, R is
// Rokui Hyōketsujin (six snowflake sigils round the target, lines of ice, a pillar) and G is Ryōjin Hyōheki, a woven
// wall of ice that stops shots — G again looses Shinkū no Kōri no Yaiba out of it, a hollow blade that impales and
// pins. In Bankai, E again while the Senbi crescent flies is Zekkū (the ice taken in hand and re-aimed), F is Hyōten
// Hyakkasō, G the Shin'eiyaku — the Hollowfied Bankai (20 s, once a match: an ice mask and horns, darker ice, harder
// blows, double against a Quincy, and Ryūsenka blooms Hyōrinmaru's crest) — and the first big blow of each opponent
// hits Zanhyō Ningyō, an ice double, while he reappears behind. When the last petal falls the Bankai completes: the
// adult. Every cut flash-freezes (the third in a row holds), RMB the Freeze-Cut, Q the flash-freeze gesture, E
// Function Stop, R Shikai Hyōketsu (the box between his last Shunpo landings), G the contact-freeze aura, F thin
// wings; the body pays for it, and after forty seconds he is a child again, spent.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { Game } from '../game';
import type { AbilityInfo } from '../../ui/hud';
import type { KitAI } from './kit';
import { AURA_DAIGUREN, AURA_HITSUGAYA, HITSUGAYA_DEF, HitsugayaKit } from './hitsugaya';
import { hitsugayaAsset, hitsugayaProp } from '../../chars/hitsugaya';
import { adultWings, hitsugayaAdultAsset } from '../../chars/hitsugayaAdult';
import { ADULT_CHAIN, ADULT_CLIPS, ADULT_STANCE } from '../../chars/hitsugayaAdultClips';
import { HITSUGAYA_SHEATHED_STANCE } from '../../chars/hitsugayaClips';
import { FreezeBox, FrostMarker, RokuiTrap, VacuumBlade, WovenWall, flashFreeze, freezeCutCarve } from '../../vfx/hitsugayaTybw';
import { IceCrescent } from '../../vfx/iceArts';
import { ICE_TINT, IcePrison, frostWorld } from '../../vfx/ice';
import { GlassShards } from '../../vfx/mirror';
import type { AuraStyle } from '../../vfx/aura';
import { TEX_GLOW, TEX_STREAK } from '../../vfx/sprites';

type BladeDef = NonNullable<FighterDef['blade']>;
const BLADE: BladeDef = { prop: 'sword', base: [0, 0, 0.15], tip: [0, 0, 1.16], color: '#BFEFFF', core: '#F2FBFF' };
/** the Hollowfied Bankai: the same ice, darker, a cold white core */
const AURA_HOLLOW: AuraStyle = { core: '#F2FBFF', body: '#6C9DBE', rim: '#2C4E6E', dark: '#0C1620' };
/** the adult: white and pale cyan, a violet rim (the petals' colour) */
const AURA_ADULT: AuraStyle = { core: '#FFFFFF', body: '#BFEFFF', rim: '#A89BE3' };

const ADULT_TIME = 40;
const HOLLOW_TIME = 20;

export const HITSUGAYA_TYBW_DEF: FighterDef = {
  ...HITSUGAYA_DEF,
  id: 'hitsugaya-tybw',
  title: 'Captain, 10th Division · TYBW',
  build: () => ({ asset: hitsugayaAsset('tybw'), props: [{ key: 'sheath', model: hitsugayaProp('sheathed'), socket: 'back' }] }),
  hp: 1150,
  rei: 170,
};

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

/** a Quincy (Hollow reiatsu is poison to them): the roster's Quincy, or a kit that says so */
function isQuincy(o: Fighter): boolean {
  return o.data.quincy === true || /uryu|yhwach|quincy/.test(o.def.id);
}

function aim(f: Fighter, g: Game, out = new THREE.Vector3()): THREE.Vector3 {
  if (f.faceTarget) return out.copy(f.faceTarget);
  if (f === g.player) return g.aimPoint(f, out);
  return f.center(out).addScaledVector(f.forward(_v), 30);
}

function pin(f: Fighter, p: THREE.Vector3): void {
  f.body.pos.copy(p);
  f.body.prev.copy(p);
  f.body.vel.set(0, 0, 0);
  f.push.set(0, 0, 0);
}

/** One clip, a callback at its events, done when it ends. */
class ClipSkill extends FighterAction {
  private dur = 1;
  constructor(readonly name: string, readonly clip: string, readonly onEvent: (n: string, f: Fighter, g: Game) => void, o: { mobility?: number; armor?: number; track?: boolean; speed?: number } = {}) {
    super();
    this.mobility = o.mobility ?? 0;
    this.armor = o.armor ?? 0;
    this.trackTarget = o.track ?? true;
    this.speed = o.speed ?? 1;
  }
  private speed: number;
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip);
    if (!c) {
      this.done = true;
      return;
    }
    this.dur = (c.dur - c.fadeOut * 0.5) / this.speed;
    f.anim.play(this.clip, { speed: this.speed, onEvent: (n) => this.onEvent(n, f, g) });
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
    // Shunpo late; another technique once this one has done its work (flash-freeze → Function Stop)
    return (next.name === 'dash' && this.t > this.dur * 0.7) || (next instanceof ClipSkill && this.t > this.dur * 0.45);
  }
}

interface AdultCut {
  window: [number, number];
  spec: BladeSpec;
  lunge: number;
}
const ADULT_CUTS: Record<string, AdultCut> = {
  slash1: { window: [0.1, 0.24], spec: { damage: 34, knock: 8, launch: 0, hitstop: 0.05, shake: 0.15, cut: 900 }, lunge: 9 },
  slash2: { window: [0.09, 0.22], spec: { damage: 34, knock: 8, launch: 4, hitstop: 0.05, shake: 0.15, cut: 900 }, lunge: 8 },
  slash3: { window: [0.21, 0.31], spec: { damage: 48, knock: 10, launch: 6, heavy: true, hitstop: 0.09, shake: 0.35, cut: 1100 }, lunge: 8 },
  slash4: { window: [0.08, 0.47], spec: { damage: 26, knock: 10, launch: 2, hitstop: 0.05, shake: 0.2, cut: 900 }, lunge: 5 },
};

/** The adult's string: long clean cuts; every one that lands leaves frost — the third in a row holds the target. */
class AdultCutAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  queued = false;
  constructor(readonly kit: HitsugayaTybwKit, readonly clip: string, readonly index: number, readonly info: AdultCut) {
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
    f.bladeSpec = { ...this.info.spec, onHit: (o) => this.kit.frostStack(o) };
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n !== 'step') return;
        const t = f.faceTarget;
        const extra = t ? Math.min(4, Math.max(0, Math.hypot(t.x - f.pos.x, t.z - f.pos.z) - 1.6)) : 0;
        f.push.addScaledVector(f.forward(), this.info.lunge + extra * 2.4);
        g.sfx.play('swing', f.center(), 0.8);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const [w0, w1] = this.info.window;
    f.bladeActive = this.t >= w0 && this.t <= w1;
    if (f.trail) f.trail.emitting = this.t >= w0 - 0.02 && this.t <= w1 + 0.06;
    if (this.queued && this.t >= this.comboAt) {
      this.done = true;
      this.kit.adultChain(this.index + 1);
      return;
    }
    if (this.t >= this.dur) this.done = true;
  }
  override end(f: Fighter): void {
    f.bladeActive = false;
    if (f.trail) f.trail.emitting = false;
  }
  override canCancel(next: FighterAction): boolean {
    if (next.name === 'dash' || next instanceof ClipSkill) return this.t >= this.info.window[0] + 0.06;
    return false;
  }
}

export class HitsugayaTybwKit extends HitsugayaKit {
  /** the Shin'eiyaku: seconds left of the Hollowfied Bankai (once a match) */
  hollowT = 0;
  private hollowUsed = false;
  /** Zanhyō Ningyō: the opponents whose big blow already hit the double */
  private dolled = new Set<number>();
  /** the adult: seconds before the body gives out; the exhaustion after it */
  adultT = 0;
  exhaustT = 0;
  /** the adult's contact-freeze aura */
  contact = false;
  /** Shikai Hyōketsu's corners: where the adult's Shunpo landed */
  markers: FrostMarker[] = [];
  /** the woven wall, while it stands */
  wall: WovenWall | null = null;
  /** the adult's thin wings: seconds of flight left */
  wingsT = 0;
  private wasDashing = false;
  private frost = new Map<number, { n: number; t: number }>();
  private adultCombo = 0;
  private adultLast = 0;
  readonly cd2 = { rokui: 0, wall: 0, blade: 0, flash: 0, stop: 0, box: 0, cut: 0, wings: 0, zekku: 0 };

  constructor(f: Fighter, g: Game) {
    super(f, g);
    f.parry = (amount, from, o) => this.parryHook(amount, from, o);
  }

  protected override captainAsset() {
    return hitsugayaAsset('tybw');
  }

  protected override bankaiAsset() {
    return hitsugayaAsset(this.hollowT > 0 ? 'tybw-hollow' : 'tybw-bankai');
  }

  override crest() {
    return this.hollowT > 0 ? { k: 2.2, kanji: '氷輪丸の紋', name: 'HYŌRINMARU’S CREST' } : super.crest();
  }

  // -------------------------------------------------------------------------------------------- clocks

  override update(dt: number): void {
    const { f, g } = this;
    super.update(dt);
    for (const k of Object.keys(this.cd2) as (keyof typeof this.cd2)[]) this.cd2[k] = Math.max(0, this.cd2[k] - dt);
    if (this.exhaustT > 0) this.exhaustT = Math.max(0, this.exhaustT - dt);
    if (this.wall?.done) this.wall = null;
    this.markers = this.markers.filter((m) => !m.done);
    for (const [id, s] of this.frost) if (g.time - s.t > 3) this.frost.delete(id);
    if (this.hollowT > 0) {
      this.hollowT -= dt;
      if (Math.random() < 0.3) {
        const c = f.center();
        g.engine.glow.spawn({ x: c.x + (Math.random() - 0.5) * 0.7, y: c.y + (Math.random() - 0.3) * 1.1, z: c.z + (Math.random() - 0.5) * 0.7, vx: 0, vy: 1.2, vz: 0, size: 0.14, sizeEnd: 0.02, life: 0.5, r: 0.42, g: 0.62, b: 0.75, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: 2 });
      }
      // Hollow reiatsu is poison to a Quincy
      this.applyStats();
      if (this.hollowT <= 0) this.endHollow();
    }
    if (this.form !== 'adult') return;
    // the body pays for the grown power
    this.adultT -= dt;
    f.hp = Math.max(1, f.hp - f.maxHp * 0.006 * dt);
    // every Shunpo landing leaves a frost marker (the last four are the corners)
    const dashing = f.dashT > 0;
    if (this.wasDashing && !dashing) this.dropMarker(f.pos);
    this.wasDashing = dashing;
    if (this.contact) {
      f.rei -= dt * 4;
      if (f.rei <= 0) this.contact = false;
      if (Math.random() < 0.4) {
        const a = Math.random() * Math.PI * 2;
        const c = f.center();
        g.engine.glow.spawn({ x: c.x + Math.cos(a) * 0.55, y: f.pos.y + Math.random() * 1.8, z: c.z + Math.sin(a) * 0.55, vx: 0, vy: 0.5, vz: 0, size: 0.1, sizeEnd: 0.02, life: 0.6, r: 0.85, g: 0.96, b: 1, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
      }
    }
    if (this.wingsT > 0) {
      this.wingsT -= dt;
      f.mounted = true;
      f.mountVy = f.wishHover ? 7 : f.wishDescend ? -7 : f === g.player ? 0 : Math.max(-2, Math.min(2, ((this.target()?.pos.y ?? f.pos.y) + 1.2 - f.pos.y) * 1.5));
      if (this.wingsT <= 0) this.foldWings();
    }
    if (this.adultT <= 0) this.exhaust();
  }

  // -------------------------------------------------------------------------------------------- inputs

  override attack(): void {
    const f = this.f;
    if (this.form !== 'adult') return super.attack();
    if (f.action instanceof AdultCutAction) {
      f.action.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.adultLast > 0.8) this.adultCombo = 0;
    this.adultChain(this.adultCombo);
  }

  adultChain(i: number): void {
    const idx = i % ADULT_CHAIN.length;
    this.adultCombo = idx + 1;
    this.adultLast = this.g.time + 0.8;
    const clip = ADULT_CHAIN[idx];
    this.f.act(new AdultCutAction(this, clip, idx, ADULT_CUTS[clip]), true);
  }

  /** RMB (adult): the Freeze-Cut — one level sweep; everything on its plane flash-freezes and splits */
  override heavy(): void {
    if (this.form !== 'adult') return super.heavy();
    this.special2(new ClipSkill('freezecut', 'dg_level', (n, f, g) => {
      if (n === 'step') f.push.addScaledVector(f.forward(), 6);
      if (n !== 'fx') return;
      const fw = f.forward(_v).setY(0).normalize().clone();
      const at = f.center().addScaledVector(fw, 0.6);
      freezeCutCarve(g, at, fw, 40);
      for (const o of g.enemiesOf(f)) {
        const d = _w.subVectors(o.pos, f.pos);
        const along = d.x * fw.x + d.z * fw.z;
        const lat = Math.abs(d.x * fw.z - d.z * fw.x);
        if (o.dead || along < 0 || along > 40 || lat > 2 + o.def.radius || Math.abs(d.y) > 2.5) continue;
        g.damage(o, 90, f, fw.clone(), { knock: 6, heavy: true, hitstop: 0.14, shake: 0.6 });
        if (!o.dead) g.addProjectile(new IcePrison(g, f, o, 1.4, 40, 'block', 1.1));
      }
      g.shake(f === g.player ? 0.6 : 0.25);
      g.callout('', 'FREEZE-CUT', '#bfefff');
    }, { mobility: 0.05, armor: 0.4 }), 18, 'cut', 3);
  }

  /** Q (adult): the flash-freeze gesture */
  override skill1(): void {
    if (this.form !== 'adult') return super.skill1();
    const t = this.target();
    if (!t || t.pos.distanceTo(this.f.pos) > 40) return;
    this.special2(new ClipSkill('flashfreeze', 'ha_gesture', (n, f, g) => {
      if (n === 'cast' && !t.dead) flashFreeze(g, f, t, 1.6, 40);
    }), 16, 'flash', 3.5);
  }

  /** E: Bankai — Zekkū while the crescent flies; adult — Function Stop */
  override skill2(): void {
    const { f, g } = this;
    if (this.form === 'bankai') {
      const c = g.projectiles.find((p): p is IceCrescent => p instanceof IceCrescent && p.owner === f && !p.done && p.age < 1.4);
      const t = this.target();
      if (c && t && this.cd2.zekku <= 0) {
        this.cd2.zekku = 1;
        c.steer(_v.subVectors(t.center(), _w.copy((c as unknown as { pos: THREE.Vector3 }).pos)));
        g.callout('氷竜旋尾・絶空', 'HYŌRYŪ SENBI — ZEKKŪ', '#bfefff');
        g.sfx.play('swing', f.center(), 0.8);
        return;
      }
      return super.skill2();
    }
    if (this.form !== 'adult') return super.skill2();
    const t = this.target();
    if (!t || t.pos.distanceTo(f.pos) > 20) return;
    this.special2(new ClipSkill('functionstop', 'ha_point', (n, f2, g2) => {
      if (n !== 'cast' || t.dead) return;
      const frozen = g2.projectiles.some((p) => p instanceof IcePrison && (p as unknown as { target: Fighter }).target === t && !p.done);
      t.sealT = Math.max(t.sealT, frozen ? 9 : 5);
      t.sealK = Math.max(t.sealK, 0.35);
      g2.rejectNear(t.center(), 6, f2, true);
      for (let i = 0; i < 20; i++) {
        const c = t.center();
        const a = Math.random() * Math.PI * 2;
        g2.engine.glow.spawn({ x: c.x + Math.cos(a) * 0.6, y: c.y + (Math.random() - 0.5) * 1.4, z: c.z + Math.sin(a) * 0.6, vx: 0, vy: -0.5, vz: 0, size: 0.14, sizeEnd: 0.02, life: 0.7, r: 0.75, g: 0.9, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
      }
      g2.callout('機能停止', 'FUNCTION STOP', '#bfefff');
      g2.sfx.play('crack', t.center(), 0.9);
    }), 22, 'stop', 9);
  }

  /** R: Shikai — Rokui Hyōketsujin; adult — Shikai Hyōketsu */
  override skill3(): void {
    const { f, g } = this;
    if (this.form === 'shikai') {
      const t = this.target();
      if (!t || t.pos.distanceTo(f.pos) > 26) return;
      // the sword swept down at the ground: the six sigils bloom round the target
      this.special2(new ClipSkill('rokui', 'hg_wave', (n, f2, g2) => {
        if (n === 'wave') g2.addProjectile(new RokuiTrap(g2, f2, t.pos.clone(), 3.6));
      }), 22, 'rokui', 9);
      return;
    }
    if (this.form !== 'adult') return super.skill3();
    const t = this.target();
    const pts = this.markers.map((m) => m.pos);
    let min: THREE.Vector3, max: THREE.Vector3;
    if (pts.length >= 3) {
      min = new THREE.Vector3(Math.min(...pts.map((p) => p.x)) - 0.5, Math.min(...pts.map((p) => p.y)) - 0.5, Math.min(...pts.map((p) => p.z)) - 0.5);
      max = new THREE.Vector3(Math.max(...pts.map((p) => p.x)) + 0.5, Math.max(...pts.map((p) => p.y)) + 6, Math.max(...pts.map((p) => p.z)) + 0.5);
    } else if (t && t.pos.distanceTo(f.pos) < 25) {
      min = t.pos.clone().add(new THREE.Vector3(-3, -0.5, -3));
      max = t.pos.clone().add(new THREE.Vector3(3, 6, 3));
    } else return;
    this.special2(new ClipSkill('hyoketsu', 'ha_box', (n, f2, g2) => {
      if (n !== 'plant') return;
      g2.addProjectile(new FreezeBox(g2, f2, min, max));
      for (const m of this.markers) m.done = true;
      this.markers = [];
    }, { armor: 0.5 }), 30, 'box', 10);
  }

  /** F: sealed/Shikai — release; Bankai — Hyōten Hyakkasō; adult — the thin wings */
  override release(): void {
    const { f, g } = this;
    if (this.form === 'bankai') return super.toggle();
    if (this.form === 'adult') {
      if (this.wingsT > 0 || this.cd2.wings > 0 || !f.spendRei(12)) return;
      this.cd2.wings = 10;
      this.wingsT = 6;
      f.visual.attach('wings', adultWings(), 'back');
      f.push.y = 9;
      f.anim.play('ha_wings', { fadeIn: 0.06 });
      frostWorld(g, f.pos.clone().setY(f.pos.y + 0.2), 1.5, 300);
      g.sfx.play('flare', f.center(), 0.6);
      return;
    }
    if (this.exhaustT > 0) {
      if (f === g.player) g.hud?.showBanner('Exhausted');
      return;
    }
    super.release();
  }

  /** G: Shikai — the woven wall / the vacuum blade out of it; Bankai — Hollowfication; adult — contact freeze */
  override toggle(): void {
    const { f, g } = this;
    if (this.form === 'shikai') {
      if (this.wall && !this.wall.done) {
        if (this.cd2.blade > 0 || !f.spendRei(18)) return;
        this.cd2.blade = 6;
        const w = this.wall;
        const from = w.center.clone().setY(w.center.y + 1.6);
        const dir = aim(f, g).sub(from).normalize();
        g.addProjectile(new VacuumBlade(g, f, from, dir));
        w.melt();
        this.wall = null;
        return;
      }
      if (this.cd2.wall > 0 || !f.spendRei(16)) return;
      this.cd2.wall = 9;
      const fw = f.forward(_v).setY(0).normalize().clone();
      this.wall = new WovenWall(g, f, f.pos.clone().addScaledVector(fw, 2.2), fw);
      g.addProjectile(this.wall);
      return;
    }
    if (this.form === 'bankai') return this.hollowfy();
    if (this.form === 'adult') {
      this.contact = !this.contact && f.rei > 5;
      if (this.contact) g.callout('', 'CONTACT FREEZE', '#bfefff');
    }
  }

  // -------------------------------------------------------------------------------------------- forms

  /** the last petal: the Bankai completes */
  override endBankai(): void {
    if (this.form === 'bankai') this.becomeAdult();
  }

  private hollowfy(): void {
    const { f, g } = this;
    if (this.hollowUsed || this.form !== 'bankai' || f.busy) {
      if (this.hollowUsed && f === g.player) g.hud?.showBanner('The Shin’eiyaku is spent');
      return;
    }
    this.hollowUsed = true;
    this.hollowT = HOLLOW_TIME;
    this.swapBankaiBody(AURA_HOLLOW);
    this.burst(1.1);
    f.data.theftProof = true;
    g.callout('虚化', 'DAIGUREN HYŌRINMARU — HOLLOWFIED', '#9fc4dc');
    g.sfx.play('mask', f.center(), 1);
  }

  private endHollow(): void {
    const { f } = this;
    this.hollowT = 0;
    f.data.theftProof = false;
    if (this.form === 'bankai') this.swapBankaiBody(AURA_DAIGUREN);
    this.applyStats();
  }

  /** the Bankai body swapped (Hollowfied or not) — the fallen petals stay fallen */
  private swapBankaiBody(aura: AuraStyle): void {
    const f = this.f;
    f.setForm({ asset: this.bankaiAsset(), props: [] }, aura, BLADE);
    f.visual.attach('sword', hitsugayaProp('bankai-sword'), 'grip.R');
    f.bladeValid = false;
    for (let i = this.petals; i < 12; i++) f.visual.rig.setBoneVisible(`petal.${i}`, false);
    this.setHands();
    this.applyStats();
  }

  private becomeAdult(): void {
    const { f, g } = this;
    this.form = 'adult';
    this.hollowT = 0;
    this.adultT = ADULT_TIME;
    this.flapping = false;
    f.hovering = false;
    f.def = { ...f.def, stance: ADULT_STANCE, clips: ADULT_CLIPS, height: 1.75, radius: 0.4, speed: { run: 11, sprint: 27, jump: 13, dash: 17, dashTime: 0.09 } };
    f.anim.stopAll(0.05);
    f.setForm({ asset: hitsugayaAdultAsset(), props: [{ key: 'sword', model: hitsugayaProp('bankai-sword'), socket: 'grip.R' }] }, AURA_ADULT, BLADE);
    f.bladeValid = false;
    const rig = f.visual.rig;
    rig.setBoneVisible('fist.R', true);
    rig.setBoneVisible('palm.R', false);
    rig.setBoneVisible('fist.L', false);
    rig.setBoneVisible('palm.L', true);
    const c = f.center();
    g.addProjectile(new GlassShards(g, c, new THREE.Vector3(1.6, 1, 0.8), 70, 5, 1.6, f.pos.y, '#A89BE3', 1.1));
    this.burst(1.4);
    frostWorld(g, f.pos.clone().setY(f.pos.y + 0.4), 7, 4000);
    g.callout('完全卍解', 'DAIGUREN HYŌRINMARU — COMPLETE', '#e6f7ff');
    this.applyStats();
  }

  /** forty seconds and the body gives out: a child again, sealed, without the reiatsu to release */
  private exhaust(): void {
    const { f, g } = this;
    if (this.form !== 'adult') return;
    this.foldWings();
    this.contact = false;
    for (const m of this.markers) m.done = true;
    this.markers = [];
    this.form = 'sealed';
    this.drawn = false;
    this.petals = 12;
    f.def = { ...f.def, stance: HITSUGAYA_SHEATHED_STANCE, clips: HITSUGAYA_TYBW_DEF.clips, height: 1.33, radius: 0.32, speed: { ...HITSUGAYA_TYBW_DEF.speed } };
    f.anim.stopAll(0.05);
    f.setForm({ asset: this.captainAsset(), props: [{ key: 'sheath', model: hitsugayaProp('sheathed'), socket: 'back' }] }, AURA_HITSUGAYA, BLADE);
    this.setHands();
    f.rei = 0;
    this.exhaustT = 20;
    this.cd.bankai = 30;
    g.addProjectile(new GlassShards(g, f.center(), new THREE.Vector3(0.9, 1, 0.6), 40, 3, 1.2, f.pos.y, ICE_TINT, 0.9));
    g.callout('', 'THE BODY GIVES OUT', '#a89be3');
    this.applyStats();
  }

  private foldWings(): void {
    const f = this.f;
    this.wingsT = 0;
    f.mounted = false;
    if (f.visual.props.get('wings')) f.visual.detach('wings');
  }

  private dropMarker(at: THREE.Vector3): void {
    const m = new FrostMarker(this.g, at);
    this.g.addProjectile(m);
    this.markers.push(m);
    while (this.markers.length > 4) this.markers.shift()!.done = true;
  }

  /** a cut that lands: frost on the target; the third in a row holds it */
  frostStack(o: Fighter): void {
    const g = this.g;
    const s = this.frost.get(o.id) ?? { n: 0, t: g.time };
    s.n++;
    s.t = g.time;
    this.frost.set(o.id, s);
    frostWorld(g, o.pos.clone().setY(o.pos.y + 0.2), 0.8, 120);
    if (s.n >= 3 && !o.dead) {
      s.n = 0;
      g.addProjectile(new IcePrison(g, this.f, o, 1.1, 30, 'block', 1));
    }
  }

  // -------------------------------------------------------------------------------------------- hooks

  private special2(a: FighterAction, cost: number, key: keyof typeof this.cd2, cd: number): boolean {
    const f = this.f;
    if (this.cd2[key] > 0 || f.dead) return false;
    if (f.action && !f.action.canCancel(a)) return false;
    if (f.hitstun > 0 || f.dashT > 0) return false;
    if (cost > 0 && !f.spendRei(cost)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return false;
    }
    this.cd2[key] = cd;
    if (!this.drawn && this.form !== 'adult') this.drawSword();
    f.act(a, true);
    return true;
  }

  private parryHook(amount: number, from: Fighter | null, o: { energy?: boolean; quiet?: boolean }): boolean {
    const { f, g } = this;
    // Zanhyō Ningyō: the first big blow of each opponent strikes an ice double; he is behind the attacker
    if (this.form === 'bankai' && from && !from.dead && !this.dolled.has(from.id) && amount >= 40 && !o.quiet) {
      this.dolled.add(from.id);
      const c = f.center();
      g.addProjectile(new GlassShards(g, c, new THREE.Vector3(0.4, 0.7, 0.4), 40, 3, 1.1, f.pos.y, ICE_TINT, 0.9));
      g.sfx.play('shatter', c, 1);
      const back = from.forward(_v).clone().negate();
      pin(f, from.pos.clone().addScaledVector(back, 1.5));
      f.yaw = Math.atan2(from.pos.x - f.pos.x, from.pos.z - f.pos.z);
      f.ghosts.spawn(0.4, 0.9);
      from.hitstun = Math.max(from.hitstun, 0.5);
      g.callout('残氷人形', 'ZANHYŌ NINGYŌ', '#bfefff');
      return true;
    }
    // contact freeze: who strikes him close freezes
    if (this.form === 'adult' && this.contact && from && !from.dead && !o.energy && from.pos.distanceTo(f.pos) < 3.2) {
      g.addProjectile(new IcePrison(g, f, from, 1.2, 20, 'block', 1));
    }
    return false;
  }

  protected override applyStats(): void {
    super.applyStats();
    const f = this.f;
    if (this.hollowT > 0) {
      const t = this.target();
      f.power *= t && isQuincy(t) ? 2.4 : 1.25;
      f.damageTaken = 0.7;
      f.aura.target = 0.6;
    }
    if (this.form === 'adult') {
      f.power = 2.2 * (this.flare ? 1.2 : 1);
      f.damageTaken = 0.7;
      f.toughness = 20;
      f.aura.target = this.flare ? 1 : 0.45;
    }
    if (this.exhaustT > 0) f.power *= 0.7;
  }

  // -------------------------------------------------------------------------------------------- UI & AI

  override formName(): string {
    if (this.form === 'adult') return `Complete Bankai — Daiguren Hyōrinmaru · ${Math.ceil(this.adultT)} s`;
    if (this.form === 'bankai' && this.hollowT > 0) return `Bankai — Hollowfied · ${Math.ceil(this.hollowT)} s · ${this.petals} petals`;
    if (this.exhaustT > 0) return `Spent · ${Math.ceil(this.exhaustT)} s`;
    return super.formName();
  }

  override abilities(): AbilityInfo[] {
    const cd = this.cd2;
    if (this.form === 'adult') {
      return [
        { key: 'LMB', name: 'Freezing cuts', kanji: '斬' },
        { key: 'RMB', name: 'Freeze-Cut', kanji: '凍断', cost: 18, cd: cd.cut, cdMax: 3 },
        { key: 'Q', name: 'Flash-freeze', kanji: '瞬凍', cost: 16, cd: cd.flash, cdMax: 3.5 },
        { key: 'E', name: 'Function Stop', kanji: '機能停止', cost: 22, cd: cd.stop, cdMax: 9 },
        { key: 'R', name: `Shikai Hyōketsu (${this.markers.length}/4)`, kanji: '四界氷結', cost: 30, cd: cd.box, cdMax: 10, tint: '#bfefff' },
        { key: 'F', name: this.wingsT > 0 ? 'Wings' : 'Thin wings', kanji: '翼', cost: 12, cd: cd.wings, cdMax: 10, active: this.wingsT > 0 },
        { key: 'G', name: 'Contact freeze', kanji: '凍', active: this.contact },
        { key: 'Shift', name: 'Shunpo (marks a corner)', kanji: '瞬歩', cost: 4 },
        { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      ];
    }
    const list = super.abilities().filter((a) => !(this.form === 'shikai' && (a.key === 'R' || a.key === 'G')) && !(this.form === 'bankai' && (a.key === 'G' || a.key === 'F')));
    if (this.form === 'shikai') {
      list.push(
        { key: 'R', name: 'Rokui Hyōketsujin', kanji: '六衣', cost: 22, cd: cd.rokui, cdMax: 9 },
        this.wall && !this.wall.done ? { key: 'G', name: 'Vacuum ice blade', kanji: '真空', cost: 18, cd: cd.blade, cdMax: 6, active: true } : { key: 'G', name: 'Ryōjin Hyōheki', kanji: '綾陣', cost: 16, cd: cd.wall, cdMax: 9 },
      );
    }
    if (this.form === 'bankai') {
      list.push(
        { key: 'F', name: `Hyōten Hyakkasō · ${this.petals} petals`, kanji: '百華', cost: 45, tint: '#a89be3' },
        { key: 'G', name: this.hollowT > 0 ? `Hollowfied ${Math.ceil(this.hollowT)}s` : this.hollowUsed ? 'Shin’eiyaku (spent)' : 'Shin’eiyaku', kanji: '虚', active: this.hollowT > 0, timer: this.hollowT / HOLLOW_TIME, tint: '#9fc4dc' },
      );
    }
    return list;
  }

  override ai(): KitAI {
    const base = super.ai();
    const sh = () => this.form === 'shikai', bk = () => this.form === 'bankai', ad = () => this.form === 'adult';
    const shotComing = () => this.g.projectiles.some((p) => {
      const o = (p as { owner?: Fighter }).owner;
      return o !== undefined && o !== this.f && o.team !== this.f.team;
    });
    const foeInState = () => {
      const t = this.target();
      return t !== null && (t.power > 1.2 || t.def.id !== (t.data.baseId ?? t.def.id));
    };
    return {
      ...base,
      reach: ad() ? 2.4 : base.reach,
      moves: [
        ...base.moves.filter((m) => !(['wave2', 'hyakkaso'].includes(m.name))),
        { name: 'rokui', use: () => this.skill3(), min: 3, max: 22, weight: 1.6, cd: 9, when: sh },
        { name: 'wall', use: () => this.toggle(), min: 6, max: 40, weight: 2.2, cd: 6, when: () => sh() && shotComing() && !this.wall },
        { name: 'vacuum', use: () => this.toggle(), min: 4, max: 40, weight: 3, cd: 2, when: () => sh() && this.wall !== null && !this.wall.done },
        { name: 'hyakkaso2', use: () => this.release(), min: 5, max: 40, weight: 1, cd: 20, when: bk },
        { name: 'hollow', use: () => this.toggle(), min: 0, max: 40, weight: 3, cd: 10, when: () => bk() && !this.hollowUsed && this.f.hp < this.f.maxHp * 0.55 },
        { name: 'zekku', use: () => this.skill2(), min: 3, max: 40, weight: 2, cd: 4, when: () => bk() && this.g.projectiles.some((p) => p instanceof IceCrescent && p.owner === this.f && !p.done) },
        { name: 'freezecut', use: () => this.heavy(), min: 0, max: 30, weight: 1.6, cd: 4, when: ad },
        { name: 'flash', use: () => this.skill1(), min: 4, max: 40, weight: 2, cd: 4, when: ad },
        { name: 'stop', use: () => this.skill2(), min: 2, max: 20, weight: 2.4, cd: 9, when: () => ad() && foeInState() },
        { name: 'box', use: () => this.skill3(), min: 0, max: 20, weight: 1.8, cd: 10, when: () => ad() && this.markers.length >= 3 },
        { name: 'boxsmall', use: () => this.skill3(), min: 2, max: 20, weight: 0.8, cd: 12, when: ad },
        { name: 'contact', use: () => this.toggle(), min: 0, max: 4, weight: 1.2, cd: 12, when: () => ad() && !this.contact },
        { name: 'wings', use: () => this.release(), min: 6, max: 40, weight: 0.6, cd: 14, when: ad },
      ],
    };
  }
}
