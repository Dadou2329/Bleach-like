// Tier Harribel's kit (docs/roster/E1-espada-1.md, Kit proposal). Sealed, the Tres Espada: an economical
// chain that changes hands every second cut (the sword passes between her hands at her chest) and ends with
// both hands; RMB the power swing that blasts the target back; Q Ola Azul (the hollow window fills with
// yellow light and the sword is flung — the light flies on as a blade); E the arc Cero (charged along the
// blade, swept across: a very wide yellow arc); R the read (she waits — an attack that comes is answered
// from behind the attacker, or sidestepped from afar); G the unzip (the mask shown: stronger and quicker
// for the rest of the fight). F "Ute, Tiburón": the water rises round her into a spinning cocoon that she
// cuts open from inside, her wounds closed. Tiburón: the pata over her right hand. LMB cuts trailing water
// with a spinning finisher; RMB La Gota; Q Trident (three high-pressure cuts); E Cascada (a river out of
// the blade: it carries everything off and floods the street); R Hirviendo (held: reishi, water and ice
// that come at her from the front boil away; whoever stands close is scalded); G the arc Cero; F Cascada
// Real (the river dropped from the sky, then a volley of La Gota). Standing in water she is quicker and
// hits harder; soaked enemies take more from her water.
import * as THREE from 'three';
import { FighterAction, type Fighter, type FighterDef } from '../fighter';
import type { DamageOpts, Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { PATA_BASE, PATA_TIP, TIBURON_TIP_Z, TIBURON_WINDOW, harribelAsset, harribelProp, type HarribelForm } from '../../chars/harribel';
import { HARRIBEL_CHAIN, HARRIBEL_CLIPS, HARRIBEL_STANCE, LEFT_CUTS, TIBURON_CHAIN, TIBURON_STANCE } from '../../chars/harribelClips';
import { BladeGlow, Boil, Cocoon, Flood, HARRIBEL_CERO, LaGota, OLA_AZUL, Torrent, WaterBlade, WaterSpray, Waterfall, drip, splash } from '../../vfx/water';
import { GetsugaProjectile } from '../projectiles/getsuga';
import { Rain, SKY_RAIN, SkyTint } from '../../vfx/fire';
import { groundAt } from '../../vfx/iceArts';
import { TEX_GLOW } from '../../vfx/sprites';
import type { AuraStyle } from '../../vfx/aura';

export const AURA_HARRIBEL: AuraStyle = { core: '#FFF4C8', body: '#F2C230', rim: '#B8862A' };

type BladeDef = NonNullable<FighterDef['blade']>;
const BLADE_TIBURON: BladeDef = { prop: 'sword', base: [0, 0, 0.14], tip: [0, -0.02, TIBURON_TIP_Z], color: '#F2C230', core: '#FFF4C8' };
const BLADE_PATA: BladeDef = { prop: 'sword', base: [...PATA_BASE], tip: [...PATA_TIP], color: '#7CC8F5', core: '#E6F7FF' };

/** a master of Sonído: quick on her feet, quicker to recover */
const SPEED = { run: 10.5, sprint: 34, jump: 14, dash: 30, dashTime: 0.08 };

function sealedProps(): { key: string; model: ReturnType<typeof harribelProp>; socket: string }[] {
  return [
    { key: 'sword', model: harribelProp('tiburon'), socket: 'grip.R' },
    { key: 'sheath', model: harribelProp('sheath-empty'), socket: 'back' },
  ];
}

export const HARRIBEL_DEF: FighterDef = {
  id: 'harribel',
  name: 'Tier Harribel',
  title: 'Tres Espada',
  build: () => ({ asset: harribelAsset('sealed'), props: sealedProps() }),
  stance: HARRIBEL_STANCE,
  clips: HARRIBEL_CLIPS,
  aura: AURA_HARRIBEL,
  blade: BLADE_TIBURON,
  hp: 1150,
  rei: 220,
  speed: { ...SPEED },
  radius: 0.37,
  height: 1.75,
};

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

// ---------------------------------------------------------------------------------------------- actions

/** Light cuts (both forms): the window at 'hit', 'combo' to chain; 'swap' passes the sword between hands. */
class CutAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private hitAt = -1;
  queued = false;
  constructor(readonly kit: HarribelKit, readonly clip: string, readonly index: number, readonly last: boolean) {
    super();
    this.name = clip;
    this.mobility = 0.22;
    this.airGravity = 0.15;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.62;
    this.hitAt = c.events.hit ?? -1;
    const rel = this.kit.form === 'tiburon';
    const spin = this.clip === 'tb_cut4', fin = this.clip === 'hb_cut5';
    f.bladeHits.clear();
    f.bladeSpec = spin
      ? { damage: 30, knock: 16, launch: 4, heavy: true, hitstop: 0.08, shake: 0.3, cut: 520 }
      : fin
        ? { damage: 34, knock: 18, launch: 4, heavy: true, hitstop: 0.1, shake: 0.35, cut: 480 }
        : { damage: rel ? 21 : 17, knock: rel ? 8 : 6, launch: this.last ? 4 : 0, hitstop: 0.045, shake: 0.12, cut: rel ? 300 : 240 };
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n === 'swap') this.kit.swapHand(LEFT_CUTS.has(this.clip) ? 'L' : 'R');
        if (n !== 'step') return;
        const tgt = f.faceTarget;
        const extra = tgt ? Math.min(5, Math.max(0, f.pos.distanceTo(tgt) - 1.6)) : 0;
        f.push.addScaledVector(f.forward(), (fin ? 9 : 7) + extra * 3.2);
        g.sfx.play(fin || spin ? 'swingHeavy' : 'swing', f.center(), 0.7);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    const spin = this.clip === 'tb_cut4';
    const open = this.hitAt >= 0 && t >= this.hitAt - 0.05 && t <= this.hitAt + (spin ? 0.38 : 0.1);
    f.bladeActive = open;
    if (f.trail) f.trail.emitting = this.hitAt >= 0 && t >= this.hitAt - 0.08 && t <= this.hitAt + (spin ? 0.4 : 0.12);
    // the pata sheds water as it cuts
    if (open && this.kit.form === 'tiburon') this.kit.sprayBlade(spin ? 5 : 3);
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
    if (next.name === 'dash' || next instanceof SkillAction) return this.t >= this.hitAt + 0.03;
    return false;
  }
}

abstract class SkillAction extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: HarribelKit) {
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
    if (f.trail) f.trail.emitting = false;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t > this.dur * 0.5;
  }
}

/** Back to the right hand when the chain stops with the sword in her left. */
class RegripAction extends SkillAction {
  readonly name = 'regrip';
  constructor(kit: HarribelKit) {
    super(kit);
    this.mobility = 0.6;
    this.trackTarget = false;
  }
  override start(f: Fighter): void {
    this.playClip(f, 'hb_regrip', (n) => n === 'swap' && this.kit.swapHand('R'));
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.swapHand('R');
  }
  override canCancel(): boolean {
    return true;
  }
}

/** RMB (sealed): the power swing — wound round to her right and swept flat with both hands. */
class HeavyAction extends SkillAction {
  readonly name = 'heavy';
  private hit = 0.32;
  constructor(kit: HarribelKit) {
    super(kit);
    this.mobility = 0.1;
    this.armor = 0.25;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    f.bladeSpec = { damage: 46, knock: 32, launch: 4, heavy: true, hitstop: 0.12, shake: 0.45, cut: 560 };
    this.playClip(f, 'hb_heavy', (n) => {
      if (n !== 'step') return;
      const tgt = f.faceTarget;
      const extra = tgt ? Math.min(6, Math.max(0, f.pos.distanceTo(tgt) - 1.5)) : 0;
      f.push.addScaledVector(f.forward(), 8 + extra * 3.4);
      g.sfx.play('swingHeavy', f.center(), 1);
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    f.bladeActive = this.t >= this.hit - 0.08 && this.t <= this.hit + 0.14;
    if (f.trail) f.trail.emitting = this.t >= this.hit - 0.1 && this.t <= this.hit + 0.14;
  }
}

/** Q (sealed): Ola Azul — the sword drawn back while yellow light fills its window, then flung across. */
class OlaAction extends SkillAction {
  readonly name = 'ola';
  constructor(kit: HarribelKit) {
    super(kit);
    this.mobility = 0.15;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'hb_ola', (n) => {
      if (n === 'charge') g.sfx.play('charge', f.center(), 0.6);
      if (n === 'fire') {
        this.kit.glowLevel = 0;
        this.kit.fireOla();
      }
    });
    g.callout('波蒼砲', 'OLA AZUL', '#F2C230');
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t > 0.08 && this.t < 0.5) {
      this.kit.glowLevel = Math.min(1, (this.t - 0.08) / 0.32);
      if (Math.random() < 0.6) {
        const p = this.kit.bladePoint(0.5);
        g.engine.glow.spawn({ x: p.x + (Math.random() - 0.5) * 0.4, y: p.y + (Math.random() - 0.5) * 0.4, z: p.z + (Math.random() - 0.5) * 0.4, vx: 0, vy: 0.5, vz: 0, size: 0.14, sizeEnd: 0.02, life: 0.35, r: 1, g: 0.82, b: 0.3, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
      }
    }
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.glowLevel = 0;
  }
}

/** E (sealed) / G (Tiburón): the arc Cero — held out to her right while it charges along the blade, swept across. */
class CeroAction extends SkillAction {
  readonly name = 'cero';
  private clip: string;
  private fireAt = 0.62;
  constructor(kit: HarribelKit) {
    super(kit);
    this.mobility = 0.1;
    this.armor = 0.2;
    this.clip = kit.form === 'tiburon' ? 'tb_cero' : 'hb_cero';
  }
  override start(f: Fighter, g: Game): void {
    this.fireAt = f.anim.clip(this.clip)?.events.fire ?? 0.62;
    this.playClip(f, this.clip, (n) => {
      if (n === 'charge') {
        g.sfx.play('charge', f.center(), 0.9);
        if (f.trail) f.trail.setColor(HARRIBEL_CERO.body, HARRIBEL_CERO.core);
      }
      if (n === 'fire') this.kit.fireCero();
    });
    g.callout('虚閃', 'CERO', '#FFD84A');
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    // the charge running along the blade
    if (this.t > 0.1 && this.t < this.fireAt) {
      const k = (this.t - 0.1) / (this.fireAt - 0.1);
      for (let i = 0; i < 3; i++) {
        const p = this.kit.bladePoint(Math.random());
        g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5) * 0.6, vy: 0.4, vz: (Math.random() - 0.5) * 0.6, size: 0.12 + k * 0.22, sizeEnd: 0.02, life: 0.25, r: 1, g: 0.85, b: 0.3, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
      }
    }
    if (f.trail) f.trail.emitting = this.t >= this.fireAt - 0.08 && this.t <= this.fireAt + 0.14;
  }
  override end(f: Fighter): void {
    super.end(f);
    const b = f.def.blade;
    if (f.trail && b) f.trail.setColor(b.color, b.core);
  }
}

/** R (sealed): the read — she waits, the blade raised; an attack that comes is answered from behind. */
class ReadAction extends SkillAction {
  readonly name = 'read';
  constructor(kit: HarribelKit) {
    super(kit);
    this.mobility = 0.15;
  }
  override start(f: Fighter): void {
    this.playClip(f, 'hb_read', () => {});
    this.dur = 0.9;
    this.kit.reading = true;
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.reading = false;
  }
}

/** the answer to a read: one flat cut from behind the attacker */
class CounterAction extends SkillAction {
  readonly name = 'counter';
  constructor(kit: HarribelKit, readonly target: Fighter) {
    super(kit);
    this.mobility = 0;
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'hb_counter', (n) => {
      if (n !== 'hit') return;
      const t = this.target;
      if (t.dead) return;
      _v.subVectors(t.pos, f.pos).setY(0).normalize();
      g.damage(t, 44, f, _v.clone(), { knock: 18, launch: 3, heavy: true, hitstop: 0.12, shake: 0.4 });
      g.sparks(t.center(), _v, '#F2C230', 18);
      g.sfx.play('swingHeavy', f.center(), 1);
    });
    if (f.trail) f.trail.emitting = true;
  }
}

/** G (sealed): the unzip — the zipper drawn down; the mask is shown. */
class UnzipAction extends SkillAction {
  readonly name = 'unzip';
  constructor(kit: HarribelKit) {
    super(kit);
    this.mobility = 0.1;
  }
  override start(f: Fighter): void {
    this.playClip(f, 'hb_unzip', (n) => n === 'open' && this.kit.unzip());
  }
}

/** F (sealed): "Ute, Tiburón" — the water rises round her into a cocoon; she cuts it open from inside. */
class ReleaseAction extends SkillAction {
  readonly name = 'release';
  private cocoon: Cocoon | null = null;
  private changed = false;
  private cut = false;
  constructor(kit: HarribelKit) {
    super(kit);
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'hb_release', (n) => {
      if (n === 'call') {
        g.callout('討て「皇鮫后」', 'UTE — TIBURÓN', '#7CC8F5');
        f.aura.flare(1.2, 0.4);
      }
      if (n === 'surge') {
        this.cocoon = new Cocoon(g, f);
        g.addProjectile(this.cocoon);
      }
    }, { hold: true });
    this.dur = 2.5;
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    // inside the closed cocoon the change happens out of sight; then the cut that opens it
    if (!this.changed && this.t > 1.35) {
      this.changed = true;
      this.kit.becomeTiburon();
      f.anim.play('tb_burst', { fadeIn: 0, onEvent: (n) => n === 'cut' && this.open(f, g) });
    }
    if (this.changed && !this.cut && this.t > 2.0) this.open(f, g);
  }
  private open(f: Fighter, g: Game): void {
    if (this.cut) return;
    this.cut = true;
    this.cocoon?.burst();
    this.kit.burstOut();
  }
  override end(f: Fighter): void {
    super.end(f);
    if (!this.changed) this.kit.becomeTiburon();
    if (!this.cut) this.open(f, this.kit.g);
  }
}

/** RMB (Tiburón): La Gota — thrust out, the water gathers on the blade, then the drop is loosed. */
class GotaAction extends SkillAction {
  readonly name = 'gota';
  constructor(kit: HarribelKit) {
    super(kit);
    this.mobility = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'tb_gota', (n) => n === 'fire' && this.kit.fireGota(1));
    g.callout('戦雫', 'LA GOTA', '#7CC8F5');
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    // the water gathering on the blade
    if (this.t > 0.04 && this.t < 0.3) {
      const tip = this.kit.bladePoint(0.9);
      const sp = WaterSpray.of(g);
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2, r = 0.6 + Math.random() * 0.5;
        const px = tip.x + Math.cos(a) * r, py = tip.y + (Math.random() - 0.5) * 0.8, pz = tip.z + Math.sin(a) * r;
        sp.spawn(px, py, pz, (tip.x - px) * 5, (tip.y - py) * 5 + 2, (tip.z - pz) * 5, 0.05, 0.22, 0.6);
      }
    }
  }
}

/** Q (Tiburón): Trident — a beat of stillness, then three high-pressure cuts thrown one after another. */
class TridentAction extends SkillAction {
  readonly name = 'trident';
  constructor(kit: HarribelKit) {
    super(kit);
    this.mobility = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'tb_trident', (n) => {
      if (n === 'glow') g.sfx.play('charge', f.center(), 0.5);
      if (n === 'fire1') this.kit.fireTrident(0);
      if (n === 'fire2') this.kit.fireTrident(1);
      if (n === 'fire3') this.kit.fireTrident(2);
    });
    g.callout('トライデント', 'TRIDENT', '#7CC8F5');
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (f.trail) f.trail.emitting = this.t > 0.2 && this.t < 0.72;
  }
}

/** E (Tiburón): Cascada — the blade swept down and held out while a river pours from it. */
class CascadaAction extends SkillAction {
  readonly name = 'cascada';
  constructor(kit: HarribelKit) {
    super(kit);
    this.mobility = 0.05;
    this.armor = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'tb_cascada', (n) => n === 'surge' && this.kit.pour());
    g.callout('断瀑', 'CASCADA', '#3FA9F5');
  }
}

/** R (Tiburón): Hirviendo — held: the blade out, the water round it boiling. */
class HirviendoAction extends SkillAction {
  readonly name = 'hirviendo';
  private acc = 0;
  constructor(kit: HarribelKit) {
    super(kit);
    this.mobility = 0.25;
    this.armor = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'tb_hirviendo', () => {}, { hold: true });
    this.dur = 2.6;
    this.kit.boilOn();
    g.callout('灼海流', 'HIRVIENDO', '#BFE6FF');
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    this.acc += dt;
    if (this.acc < 0.25) return;
    this.acc = 0;
    // scalding: whoever stands close in front
    const fw = f.forward(_w);
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      _v.subVectors(o.pos, f.pos).setY(0);
      const d = _v.length();
      if (d > 3 + o.def.radius || _v.normalize().dot(fw) < 0.2) continue;
      g.damage(o, 6, f, _v.clone(), { knock: 3, quiet: true, color: '#BFE6FF' });
      this.kit.boil?.puff(o.center(), 3);
    }
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.boilOff();
    f.anim.stopAll(0.2);
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' || next instanceof GotaAction || next instanceof CutAction;
  }
}

/** F (Tiburón): Cascada Real — the blade raised to the sky, held, brought down: the river falls. */
class RealAction extends SkillAction {
  readonly name = 'real';
  constructor(kit: HarribelKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'tb_real', (n) => {
      if (n === 'call') this.kit.callRiver();
      if (n === 'drop') this.kit.dropRiver();
    });
    g.callout('断瀑・真', 'CASCADA REAL', '#3FA9F5');
  }
}

// ---------------------------------------------------------------------------------------------- the kit

type Form = HarribelForm;

export class HarribelKit implements Kit {
  form: Form = 'sealed';
  flare = false;
  comboIndex = 0;
  /** which hand has the sword (sealed) */
  hand: 'R' | 'L' = 'R';
  reading = false;
  boil: Boil | null = null;
  /** Ola Azul's light in the window (0..1) */
  glowLevel = 0;
  readonly cd = { heavy: 0, ola: 0, cero: 0, read: 0, gota: 0, trident: 0, cascada: 0, boil: 0, real: 0 };
  private lastEnd = 0;
  private glow: BladeGlow | null = null;
  private sky: SkyTint | null = null;
  private skyT = 0;
  /** La Gota shots still to come after Cascada Real */
  private volley = 0;
  private volleyT = 0;
  private volleyAt: THREE.Vector3 | null = null;

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    // her own speeds (the water and the mask change them)
    f.def = { ...f.def, speed: { ...SPEED } };
    f.parry = (amount, from, o) => this.tryParry(amount, from, o);
    this.hands();
    this.applyStats();
  }

  private hands(): void {
    const rig = this.f.visual.rig;
    const L = this.form !== 'tiburon' && this.hand === 'L';
    rig.setBoneVisible('fist.R', !L);
    rig.setBoneVisible('palm.R', L);
    rig.setBoneVisible('fist.L', L);
    rig.setBoneVisible('palm.L', !L);
  }

  /** pass the sword to the other hand (sealed) */
  swapHand(to: 'R' | 'L'): void {
    if (this.form === 'tiburon' || this.hand === to) return;
    this.hand = to;
    this.f.visual.moveProp('sword', to === 'L' ? 'grip.L' : 'grip.R');
    this.hands();
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    // the sword goes back to her right hand when she is left holding it in her left
    if (this.hand === 'L' && !f.busy) f.act(new RegripAction(this), true);
    // Ola Azul's window
    if (this.form !== 'tiburon') {
      const prop = f.visual.props.get('sword');
      if (prop && (!this.glow || this.glow.mesh.parent !== prop)) {
        this.glow?.dispose();
        this.glow = new BladeGlow(prop, TIBURON_WINDOW.c, TIBURON_WINDOW.w, TIBURON_WINDOW.h, OLA_AZUL.body);
      }
      if (this.glow) {
        this.glow.level = this.glowLevel;
        this.glow.update(g.time);
      }
    }
    // soaked enemies drip
    for (const o of g.enemiesOf(f)) if (o.wetT > 0 && !o.dead) drip(g, o);
    // the sky clears again after Cascada Real
    if (this.sky && (this.skyT -= dt) <= 0) {
      this.sky.target = 0;
      this.sky = null;
    }
    // the La Gota volley after the waterfall
    if (this.volley > 0 && (this.volleyT -= dt) <= 0) {
      this.volley--;
      this.volleyT = 0.22;
      this.fireGota(0.8, this.volleyAt);
    }
    this.applyStats();
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

  /** a point along the blade (0 = base, 1 = tip), world */
  bladePoint(k: number, out = new THREE.Vector3()): THREE.Vector3 {
    const f = this.f;
    const prop = f.visual.props.get('sword');
    const b = f.def.blade;
    if (!prop || !b) return f.center(out);
    prop.updateWorldMatrix(true, false);
    out.set(b.base[0] + (b.tip[0] - b.base[0]) * k, b.base[1] + (b.tip[1] - b.base[1]) * k, b.base[2] + (b.tip[2] - b.base[2]) * k);
    return out.applyMatrix4(prop.matrixWorld);
  }

  /** water shed off the pata as it cuts */
  sprayBlade(n: number): void {
    const sp = WaterSpray.of(this.g);
    const b = this.bladePoint(0.2), t = this.bladePoint(1);
    for (let i = 0; i < n; i++) {
      const k = Math.random();
      const x = b.x + (t.x - b.x) * k, y = b.y + (t.y - b.y) * k, z = b.z + (t.z - b.z) * k;
      sp.spawn(x, y, z, (Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3, 0.05 + Math.random() * 0.05, 0.6, 0.6);
    }
  }

  // ---------------------------------------------------------------- the read

  /** Before a hit lands: the read answers it; Hirviendo boils away reishi and water from the front. */
  private tryParry(amount: number, from: Fighter | null, o: DamageOpts): boolean {
    const { f, g } = this;
    if (f.dead) return false;
    if (this.reading && f.hitstun <= 0) {
      this.reading = false;
      if (from && !from.dead && from.pos.distanceTo(f.pos) < 10) this.counter(from);
      else this.sidestep(from);
      return true;
    }
    if (this.boil && (o.energy || o.color === '#7CC8F5')) {
      const src = from ? from.center() : null;
      if (src) {
        _v.subVectors(src, f.center()).setY(0).normalize();
        if (_v.dot(f.forward(_w)) < 0.1) return false;
      }
      const at = this.bladePoint(1);
      this.boil.puff(at, 14);
      if (!o.quiet) g.sfx.play('splash', at, 0.4);
      return true;
    }
    return amount < 0;
  }

  /** Sonído to the attacker's back and one cut */
  private counter(t: Fighter): void {
    const { f, g } = this;
    const from = f.pos.clone();
    const back = _v.subVectors(t.pos, from).setY(0).normalize();
    const to = t.pos.clone().addScaledVector(back, 1.4);
    const gy = groundAt(g, to.x, to.y + 1, to.z, 6);
    if (gy !== null) to.y = gy;
    if (f.body.overlaps(to.x, to.y + 0.05, to.z)) to.copy(from);
    f.ghosts.spawn(1.2, 1);
    f.body.pos.copy(to);
    f.body.prev.copy(to);
    f.body.vel.set(0, 0, 0);
    f.renderPos.copy(to);
    f.yaw = Math.atan2(t.pos.x - to.x, t.pos.z - to.z);
    g.onDash(f);
    g.sfx.play('shunpo', f.center(), 1);
    f.act(new CounterAction(this, t), true);
  }

  /** a ranged attack read from afar: a step aside */
  private sidestep(from: Fighter | null): void {
    const { f, g } = this;
    const fw = f.forward(_w);
    const side = new THREE.Vector3(fw.z, 0, -fw.x).multiplyScalar(Math.random() < 0.5 ? 1 : -1);
    const to = f.pos.clone().addScaledVector(side, 3);
    if (f.body.overlaps(to.x, to.y + 0.05, to.z)) to.addScaledVector(side, -6);
    if (f.body.overlaps(to.x, to.y + 0.05, to.z)) return;
    f.ghosts.spawn(1.1, 1);
    f.body.pos.copy(to);
    f.body.prev.copy(to);
    f.renderPos.copy(to);
    if (from) f.yaw = Math.atan2(from.pos.x - to.x, from.pos.z - to.z);
    g.onDash(f);
    g.sfx.play('shunpo', f.center(), 0.8);
    f.stopAction();
  }

  // ---------------------------------------------------------------- techniques

  fireOla(): void {
    const { f, g } = this;
    const p = this.bladePoint(0.5);
    const dir = this.aim().sub(p).normalize();
    const side = new THREE.Vector3(dir.z, 0, -dir.x).normalize();
    g.addProjectile(new GetsugaProjectile(g, f, p, dir, side, { radius: 2.2, halfAngle: 0.72, speed: 54, range: 72, damage: 52, cut: 520, colors: OLA_AZUL, band: 0.7 }));
    g.sfx.play('getsuga', p, 0.8);
  }

  fireCero(): void {
    const { f, g } = this;
    const p = f.center().addScaledVector(f.forward(_w), 0.6);
    const dir = this.aim().sub(p);
    dir.y = Math.max(-0.25 * Math.hypot(dir.x, dir.z), Math.min(0.15 * Math.hypot(dir.x, dir.z), dir.y));
    dir.normalize();
    const side = new THREE.Vector3(dir.z, 0, -dir.x).normalize();
    g.addProjectile(new GetsugaProjectile(g, f, p, dir, side, { radius: 5.6, halfAngle: 1.3, speed: 66, range: 92, damage: 96, cut: 780, colors: HARRIBEL_CERO, band: 2.4 }));
    g.sfx.play('beam', p, 1.1);
    g.shake(f === g.player ? 0.3 : 0.1);
    f.aura.flare(1.2, 0.3);
  }

  fireGota(size: number, at: THREE.Vector3 | null = null): void {
    const { f, g } = this;
    const p = this.bladePoint(0.95);
    const goal = at ? at.clone().add(new THREE.Vector3((Math.random() - 0.5) * 3, 1 + Math.random() * 1.5, (Math.random() - 0.5) * 3)) : this.aim();
    const dir = goal.sub(p).normalize();
    g.addProjectile(new LaGota(g, f, p, dir, { size, damage: 56 * size, power: 520 * size, blast: 2.4 * size }));
    g.sfx.play('splash', p, 0.5);
    f.push.addScaledVector(dir, -3);
  }

  fireTrident(i: number): void {
    const { f, g } = this;
    const p = this.bladePoint(0.6);
    const dir = this.aim().sub(p).normalize();
    const flat = new THREE.Vector3(dir.z, 0, -dir.x).normalize();
    // flat, then tilted one way, then the other
    const tilt = [0, 0.5, -0.5][i];
    const up = new THREE.Vector3().crossVectors(dir, flat).normalize();
    const side = flat.multiplyScalar(Math.cos(tilt)).addScaledVector(up, Math.sin(tilt));
    g.addProjectile(new WaterBlade(g, f, p, dir, side, 38, 2.5));
    g.sfx.play('getsuga', p, 0.7);
  }

  /** Cascada: the river out of the blade toward the target */
  pour(): void {
    const { f, g } = this;
    const from = this.bladePoint(0.9);
    const dir = this.aim().sub(from);
    const h = Math.hypot(dir.x, dir.z);
    dir.y = Math.max(-0.35 * h, Math.min(0.08 * h, dir.y));
    dir.normalize();
    g.addProjectile(new Torrent(g, f, () => this.bladePoint(0.9), dir, { len: 32, dur: 1.5, dps: 100, power: 180 }));
    g.shake(f === g.player ? 0.25 : 0.08);
    f.aura.flare(1.1, 0.3);
  }

  boilOn(): void {
    this.boil?.end();
    this.boil = new Boil(this.g, this.f, () => this.bladePoint(0.85));
    this.g.addProjectile(this.boil);
  }

  boilOff(): void {
    this.boil?.end();
    this.boil = null;
  }

  callRiver(): void {
    const { f, g } = this;
    this.sky = new SkyTint(g, SKY_RAIN, 2.4);
    g.addProjectile(this.sky);
    this.skyT = 5;
    g.addProjectile(new Rain(g, 5));
    f.aura.flare(1.6, 0.6);
    g.sfx.play('flare', f.center(), 0.9);
  }

  dropRiver(): void {
    const { f, g } = this;
    const t = this.target();
    const at = t && !t.dead && t.pos.distanceTo(f.pos) < 60 ? t.pos.clone() : f.pos.clone().addScaledVector(f.forward(_w), 12);
    g.addProjectile(new Waterfall(g, f, at, 4.6, 2.4, 170));
    this.volleyAt = at;
    this.volley = 4;
    this.volleyT = 0.9;
    g.shake(f === g.player ? 0.35 : 0.12);
  }

  // ---------------------------------------------------------------- forms

  unzip(): void {
    const { f, g } = this;
    if (this.form !== 'sealed') return;
    this.form = 'unzipped';
    this.rebuild();
    f.aura.flare(1.5, 0.5);
    g.sfx.play('flare', f.center(), 0.7);
    g.shake(f === g.player ? 0.2 : 0.06);
    if (f === g.player) g.hud?.showBanner('"I have not yet shown you my full strength."');
  }

  /** the sealed model again (the jacket opened), the sword where it was */
  private rebuild(): void {
    const f = this.f;
    const props = sealedProps();
    if (this.hand === 'L') props[0].socket = 'grip.L';
    f.setForm({ asset: harribelAsset(this.form), props }, AURA_HARRIBEL, BLADE_TIBURON);
    this.glow?.dispose();
    this.glow = null;
    this.hands();
  }

  becomeTiburon(): void {
    const { f } = this;
    if (this.form === 'tiburon') return;
    this.glow?.dispose();
    this.glow = null;
    this.hand = 'R';
    this.form = 'tiburon';
    f.def = { ...f.def, stance: TIBURON_STANCE, blade: BLADE_PATA };
    f.setForm({ asset: harribelAsset('tiburon'), props: [{ key: 'sword', model: harribelProp('pata'), socket: 'grip.R' }] }, AURA_HARRIBEL, BLADE_PATA);
    this.hands();
    this.applyStats();
  }

  /** the cut out of the cocoon: the water flies out flat, her wounds closed */
  burstOut(): void {
    const { f, g } = this;
    f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.25);
    f.aura.flare(1.8, 0.6);
    g.sfx.play('splash', f.center(), 1.4);
    g.shake(f === g.player ? 0.4 : 0.12);
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      _v.subVectors(o.pos, f.pos).setY(0);
      const d = _v.length();
      if (d > 4.5 + o.def.radius) continue;
      g.damage(o, 40, f, _v.normalize().clone(), { knock: 24, launch: 4, heavy: true, hitstop: 0.1, shake: 0.4, color: '#7CC8F5' });
      o.wetT = Math.max(o.wetT, 6);
    }
    g.addProjectile(new Flood(g, f, f.pos.clone(), 6, 10));
  }

  // ---------------------------------------------------------------- input

  private special(a: FighterAction, cost: number, cdKey: keyof typeof this.cd, cd: number): boolean {
    const f = this.f;
    if (this.cd[cdKey] > 0 || f.dead) return false;
    if (f.action && !f.action.canCancel(a) && !(f.action instanceof RegripAction)) return false;
    if (f.hitstun > 0 || f.dashT > 0) return false;
    if (!f.spendRei(cost)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return false;
    }
    this.cd[cdKey] = cd;
    this.swapHand('R');
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
    if (f.busy && !(cur instanceof RegripAction)) return;
    if (this.g.time - this.lastEnd > 0.7) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const list = this.form === 'tiburon' ? TIBURON_CHAIN : HARRIBEL_CHAIN;
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    this.lastEnd = this.g.time + 0.7;
    const clip = list[idx];
    // a left-hand cut needs the sword in her left hand: the first one takes it over at the start
    if (!LEFT_CUTS.has(clip) && clip !== 'hb_cut5') this.swapHand('R');
    this.f.act(new CutAction(this, clip, idx, idx === list.length - 1), true);
  }

  /** RMB: the power swing / La Gota. */
  heavy(): void {
    if (this.form === 'tiburon') this.special(new GotaAction(this), 10, 'gota', 1.3);
    else this.special(new HeavyAction(this), 12, 'heavy', 2.8);
  }

  /** Q: Ola Azul / Trident. */
  skill1(): void {
    if (this.form === 'tiburon') this.special(new TridentAction(this), 30, 'trident', 6);
    else this.special(new OlaAction(this), 18, 'ola', 4);
  }

  /** E: the arc Cero / Cascada. */
  skill2(): void {
    if (this.form === 'tiburon') this.special(new CascadaAction(this), 45, 'cascada', 12);
    else this.special(new CeroAction(this), 32, 'cero', 8);
  }

  /** R: the read / Hirviendo. */
  skill3(): void {
    if (this.form === 'tiburon') {
      if (this.f.action instanceof HirviendoAction) return;
      this.special(new HirviendoAction(this), 25, 'boil', 9);
    } else this.special(new ReadAction(this), 10, 'read', 7);
  }

  /** G: the unzip / the arc Cero. */
  toggle(): void {
    const { f, g } = this;
    if (this.form === 'tiburon') {
      this.special(new CeroAction(this), 32, 'cero', 8);
      return;
    }
    if (this.form === 'unzipped') {
      if (f === g.player) g.hud?.showBanner('The mask is already shown');
      return;
    }
    if (f.busy && !(f.action instanceof RegripAction)) return;
    this.swapHand('R');
    f.act(new UnzipAction(this), true);
  }

  release(): void {
    const { f, g } = this;
    if (this.form === 'tiburon') {
      this.special(new RealAction(this), 80, 'real', 30);
      return;
    }
    if (f.busy && !(f.action instanceof RegripAction)) return;
    if (!f.spendRei(30)) {
      if (f === g.player) g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    this.swapHand('R');
    f.act(new ReleaseAction(this), true);
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
    const rel = this.form === 'tiburon', open = this.form === 'unzipped';
    const wading = rel && Flood.at(this.g, f.pos) !== null;
    f.power = (rel ? 1.18 : open ? 1.12 : 1) * (wading ? 1.1 : 1) * (this.flare ? 1.25 : 1);
    f.damageTaken = rel ? 0.9 : 1;
    const k = (open ? 1.06 : 1) * (wading ? 1.1 : 1) * (rel ? 1.08 : 1);
    f.def.speed.run = SPEED.run * k;
    f.def.speed.sprint = SPEED.sprint * k;
    f.aura.target = this.flare ? 1 : rel ? 0.22 : open ? 0.14 : 0.06;
  }

  formName(): string {
    if (this.form === 'tiburon') return `Resurrección — Tiburón${Flood.at(this.g, this.f.pos) ? ' · in the water' : ''}`;
    return this.form === 'unzipped' ? 'Tres Espada · the mask shown' : 'Tres Espada';
  }

  ai(): KitAI {
    const sealed = () => this.form !== 'tiburon', rel = () => this.form === 'tiburon';
    return {
      reach: 2.0,
      chain: 5,
      releaseAt: [0.6],
      toggleAt: 0.85,
      toggleOn: () => this.form !== 'sealed',
      moves: [
        { name: 'heavy', use: () => this.heavy(), min: 0, max: 3, weight: 1.1, cd: 3, when: sealed },
        { name: 'ola', use: () => this.skill1(), min: 4, max: 32, weight: 1.3, cd: 5, when: sealed },
        { name: 'cero', use: () => this.skill2(), min: 6, max: 45, weight: 1, cd: 8, when: sealed },
        { name: 'read', use: () => this.skill3(), min: 0, max: 6, weight: 0.6, cd: 9, when: sealed },
        { name: 'gota', use: () => this.heavy(), min: 4, max: 60, weight: 1.6, cd: 2, when: rel },
        { name: 'trident', use: () => this.skill1(), min: 3, max: 34, weight: 1.2, cd: 6, when: rel },
        { name: 'cascada', use: () => this.skill2(), min: 5, max: 30, weight: 1.1, cd: 12, when: rel },
        { name: 'hirviendo', use: () => this.skill3(), min: 6, max: 40, weight: 0.6, cd: 10, when: rel },
        { name: 'tcero', use: () => this.toggle(), min: 6, max: 45, weight: 0.9, cd: 9, when: rel },
        { name: 'real', use: () => this.release(), min: 6, max: 50, weight: 1, cd: 30, when: () => rel() && this.f.rei >= 80 },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd, list: AbilityInfo[] = [];
    if (this.form === 'tiburon') {
      list.push(
        { key: 'LMB', name: 'Pata', kanji: '牙' },
        { key: 'RMB', name: 'La Gota', kanji: '戦雫', cost: 10, cd: cd.gota, cdMax: 1.3 },
        { key: 'Q', name: 'Trident', kanji: '三叉', cost: 30, cd: cd.trident, cdMax: 6 },
        { key: 'E', name: 'Cascada', kanji: '断瀑', cost: 45, cd: cd.cascada, cdMax: 12 },
        { key: 'R', name: 'Hirviendo', kanji: '灼海流', cost: 25, cd: cd.boil, cdMax: 9, active: this.boil !== null },
        { key: 'Shift', name: 'Sonído', kanji: '響転' },
        { key: 'G', name: 'Cero', kanji: '虚閃', cost: 32, cd: cd.cero, cdMax: 8 },
        { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
        { key: 'F', name: 'Cascada Real', kanji: '瀑', cost: 80, cd: cd.real, cdMax: 30 },
      );
      return list;
    }
    list.push(
      { key: 'LMB', name: 'Tiburón', kanji: '鮫' },
      { key: 'RMB', name: 'Power swing', kanji: '斬', cost: 12, cd: cd.heavy, cdMax: 2.8 },
      { key: 'Q', name: 'Ola Azul', kanji: '波蒼砲', cost: 18, cd: cd.ola, cdMax: 4 },
      { key: 'E', name: 'Cero', kanji: '虚閃', cost: 32, cd: cd.cero, cdMax: 8 },
      { key: 'R', name: 'Read', kanji: '読', cost: 10, cd: cd.read, cdMax: 7, active: this.reading },
      { key: 'Shift', name: 'Sonído', kanji: '響転' },
      { key: 'G', name: 'Unzip', kanji: '解', active: this.form === 'unzipped' },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      { key: 'F', name: 'Tiburón', kanji: '皇鮫后', cost: 30 },
    );
    return list;
  }
}
