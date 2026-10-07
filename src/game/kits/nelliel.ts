// Nelliel Tu Odelschwanck's kit (docs/roster/E2-espada-2.md §7). The armband era: G switches between the
// adult and Nel Tu at will; F releases Gamuza ("Utae, Gamuza") and, released, throws the burst again.
// Adult: an economical swordswoman who kicks between cuts — forehand, backhand, a kick to the neck, a spinning
// heel kick (LMB); the precise cut that goes through guards and Hierro (RMB); the pink Cero from her mouth (Q);
// Cero Doble (E) — the left palm stops a reishi attack in front of her, she swallows it and fires it back fused
// with her own Cero; Sonído (R), gone and beside him with a cut. Nel Tu: slaps, a headbutt, a whirl (LMB); Nel
// Tamapunch (RMB: a stun, and it hurts the men far more); her Cero Doble (Q: gulp an attack and spit it back
// harder, then she is spent); Nel Shower (E: heal); Chōkasoku (R: the mask's eyes light and she rockets in
// head first). Gamuza, a centaur: the double-ended lance — thrust, the rear point swept round, the reverse
// thrust, a rearing strike of the front hooves (LMB); the plunge, a stomp that cracks the ground and the
// lance driven down (RMB); Lanzador Verde, the lance hurled spinning to drill straight through everything (Q;
// it re-forms in her hand); Cero Doble (E); Galope, a blue flash and a couched charge (R).
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { DamageOpts, Game } from '../game';
import { GAMUZA_BASE_Z, GAMUZA_TIP_Z, LANCE_CONE_Z, LANCE_TIP_Z, nelAsset, nelProp, type NelForm } from '../../chars/nelliel';
import { GAMUZA_CHAIN, GAMUZA_CLIPS, GAMUZA_STANCE, NEL_CHAIN, NEL_CHILD_CHAIN, NEL_CHILD_CLIPS, NEL_CHILD_STANCE, NEL_CLIPS, NEL_STANCE } from '../../chars/nellielClips';
import type { AuraStyle } from '../../vfx/aura';
import { CeroBeam } from '../projectiles/cero';
import { EMERALD, GALOPE_BLUE, LanzadorShot, NEL_PINK, galopeFlash, maskEyes, nelPuff, releaseBurst, showerSpray } from '../../vfx/gamuza';
import { energyCatch } from '../../vfx/sogyo';
import { TEX_GLOW } from '../../vfx/sprites';
import type { AbilityInfo } from '../../ui/hud';
import type { Kit, KitAI } from './kit';
import { aimPoint } from './vasto';

type BladeDef = NonNullable<FighterDef['blade']>;
type Form = NelForm;

/** pink reiatsu (the dossier's proposal, as her Cero); Gamuza keeps it, rimmed in emerald */
const AURA_NEL: AuraStyle = { core: '#FFE3F0', body: '#FF7AB8', rim: '#C2367A' };
const AURA_GAMUZA: AuraStyle = { core: '#FFE3F0', body: '#FF6FAE', rim: '#2E9A62' };
const BLADE: BladeDef = { prop: 'sword', base: [0, 0, GAMUZA_BASE_Z], tip: [0, 0, GAMUZA_TIP_Z], color: '#FF9CCB', core: '#FFF0F7' };
const LANCE_FRONT: BladeDef = { prop: 'sword', base: [0, 0, LANCE_CONE_Z], tip: [0, 0, LANCE_TIP_Z], color: '#7CF0B4', core: '#E8FFF2' };
const LANCE_REAR: BladeDef = { prop: 'sword', base: [0, 0, -LANCE_CONE_Z], tip: [0, 0, -LANCE_TIP_Z], color: '#7CF0B4', core: '#E8FFF2' };
const FORM_SPEED: Record<Form, FighterDef['speed']> = {
  adult: { run: 11.5, sprint: 26, jump: 13, dash: 15, dashTime: 0.1 },
  child: { run: 8.5, sprint: 17, jump: 10, dash: 12, dashTime: 0.1 },
  gamuza: { run: 14, sprint: 34, jump: 13, dash: 19, dashTime: 0.12 },
};
const FORM_BODY: Record<Form, { height: number; radius: number }> = {
  adult: { height: 1.8, radius: 0.4 },
  child: { height: 1.0, radius: 0.3 },
  gamuza: { height: 2.3, radius: 0.62 },
};
/** the cast's women: to them the Tamapunch is only a punch */
const WOMEN = new Set(['rukia', 'orihime', 'yoruichi', 'suifeng', 'harribel', 'unohana', 'nelliel', 'lilynette']);
/** the most a palm (or a mouth) can hold */
const STORE_CAP = 280;

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

export const NELLIEL_DEF: FighterDef = {
  id: 'nelliel',
  name: 'Nelliel Tu Odelschwanck',
  title: 'Former Tres Espada',
  build: () => ({ asset: nelAsset('adult'), props: [{ key: 'sword', model: nelProp('gamuza'), socket: 'grip.R' }] }),
  stance: NEL_STANCE,
  clips: NEL_CLIPS,
  aura: AURA_NEL,
  blade: BLADE,
  hp: 1000,
  rei: 170,
  speed: { ...FORM_SPEED.adult },
  radius: FORM_BODY.adult.radius,
  height: FORM_BODY.adult.height,
};

// ------------------------------------------------------------------ the string (all three bodies)

interface Blow {
  damage: number;
  knock: number;
  launch?: number;
  heavy?: boolean;
  /** how far in front the blow lands (m) and how high; radial = all round her */
  reach: number;
  y: number;
  r: number;
  radial?: boolean;
}

interface Move {
  /** a blade (sword or lance) live over this window of the clip … */
  window?: [number, number];
  spec?: BladeSpec;
  /** … or a blow at the clip's 'hit' (and 'hit2') events */
  blow?: Blow;
  /** the lance strikes with its rear point */
  rear?: boolean;
  /** a hoof stomp at 'stomp' */
  stomp?: number;
}

const MOVES: Record<string, Move> = {
  nl_cut1: { window: [0.12, 0.25], spec: { damage: 20, knock: 6, launch: 0, hitstop: 0.05, shake: 0.15, cut: 340 } },
  nl_cut2: { window: [0.11, 0.24], spec: { damage: 21, knock: 7, launch: 1, hitstop: 0.05, shake: 0.16, cut: 340 } },
  nl_kick: { blow: { damage: 26, knock: 13, launch: 5, reach: 0.9, y: 1.5, r: 0.85 } },
  nl_spin: { blow: { damage: 36, knock: 20, launch: 3, heavy: true, reach: 1.0, y: 1.1, r: 1.1 } },
  nc_slap: { blow: { damage: 6, knock: 2, reach: 0.55, y: 0.7, r: 0.6 } },
  nc_butt: { blow: { damage: 12, knock: 8, launch: 2, reach: 0.6, y: 0.75, r: 0.65 } },
  nc_whirl: { blow: { damage: 9, knock: 9, reach: 0, y: 0.6, r: 1.0, radial: true } },
  gz_thrust: { window: [0.13, 0.27], spec: { damage: 30, knock: 12, launch: 1, hitstop: 0.06, shake: 0.2, cut: 520, reach: 0.25 } },
  gz_sweep: { window: [0.1, 0.24], spec: { damage: 28, knock: 14, launch: 2, hitstop: 0.06, shake: 0.2, cut: 480, reach: 0.25 }, rear: true },
  gz_reverse: { window: [0.11, 0.25], spec: { damage: 32, knock: 14, launch: 1, hitstop: 0.06, shake: 0.22, cut: 520, reach: 0.25 }, rear: true },
  gz_hooves: { blow: { damage: 40, knock: 18, launch: 6, heavy: true, reach: 1.5, y: 0.8, r: 1.4 }, stomp: 1.6 },
};

/** push toward the target so the blow lands at `stop` metres, timed to arrive by `at` seconds */
function lungeTo(f: Fighter, stop: number, at: number, max = 28): number {
  const tgt = f.faceTarget;
  if (!tgt) return 0;
  const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
  if (d <= stop + 0.25 || d > 9) return 0;
  const per = (1 - Math.exp(-f.pushDrag * Math.max(0.06, at - 0.05))) / f.pushDrag;
  f.push.addScaledVector(f.forward(_v), Math.min(max, (d - stop) / per));
  return stop;
}

/** stop the lunge once the target is reached */
function lungeStop(f: Fighter, stop: number): number {
  const tgt = f.faceTarget;
  if (stop > 0 && tgt && Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z) <= stop) {
    f.push.x = 0;
    f.push.z = 0;
    return 0;
  }
  return stop;
}

/** One move of the light string: a cut, a kick, a slap, a lance stroke or the hooves. */
class MoveAction extends FighterAction {
  readonly name: string;
  private info: Move;
  private dur = 0;
  private comboAt = 0;
  private stopAt = 0;
  private swished = false;
  queued = false;
  constructor(readonly kit: NelKit, readonly clip: string, readonly index: number) {
    super();
    this.name = clip;
    this.info = MOVES[clip];
    this.mobility = 0.12;
    this.airGravity = 0.12;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    f.bladeHits.clear();
    if (this.info.spec) {
      f.bladeSpec = { ...this.info.spec };
      this.kit.lancePoint(this.info.rear === true);
    }
    const at = this.info.window ? this.info.window[0] : c.events.hit ?? 0.2;
    this.stopAt = lungeTo(f, this.kit.stopDistance(), at);
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if ((n === 'hit' || n === 'hit2') && this.info.blow) this.kit.blow(this.info.blow);
        if (n === 'stomp' && this.info.stomp) this.kit.stomp(this.info.stomp, 1.5);
        if (n === 'step') g.sfx.play('step', f.pos, 0.5);
      },
    });
    if (this.kit.form === 'child') maskEyes(g, f, 0.6);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    this.stopAt = lungeStop(f, this.stopAt);
    const w = this.info.window;
    if (w) {
      if (!this.swished && t >= w[0] - 0.03) {
        this.swished = true;
        g.sfx.play(this.kit.form === 'gamuza' ? 'swingHeavy' : 'swing', f.center());
      }
      f.bladeActive = t >= w[0] && t <= w[1];
      if (f.trail) f.trail.emitting = t >= w[0] - 0.02 && t <= w[1] + 0.06;
    }
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
    if (this.info.rear) this.kit.lancePoint(false);
  }
  override canCancel(next: FighterAction): boolean {
    const w = this.info.window ? this.info.window[1] : 0.3;
    if (next.name === 'dash') return this.t >= w;
    return next instanceof SkillAction && this.t >= w + 0.04;
  }
}

/** Marker for the skills a string can cancel into. */
abstract class SkillAction extends FighterAction {}

// ------------------------------------------------------------------ adult

/** RMB: the precise cut — a gliding lunge and one diagonal that goes through guards and Hierro. */
class PreciseAction extends SkillAction {
  readonly name = 'precise';
  private stopAt = 0;
  constructor(readonly kit: NelKit) {
    super();
    this.mobility = 0.1;
    this.armor = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    // past the armour: what the blade lands is followed by a true cut that no guard softens
    f.bladeSpec = { damage: 30, knock: 10, launch: 2, heavy: true, hitstop: 0.12, shake: 0.4, cut: 700, onHit: (o) => g.drain(o, 22, f) };
    this.stopAt = lungeTo(f, 1.2, 0.2, 34);
    f.anim.play('nl_precise', { onEvent: (n) => n === 'step' && g.sfx.play('shunpo', f.center(), 0.6) });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    this.stopAt = lungeStop(f, this.stopAt);
    if (this.t >= 0.19 && this.t < 0.21) g.sfx.play('swingHeavy', f.center());
    f.bladeActive = this.t >= 0.2 && this.t <= 0.34;
    if (f.trail) f.trail.emitting = this.t >= 0.19 && this.t <= 0.4;
    if (this.t >= 0.62) this.done = true;
  }
  override end(f: Fighter): void {
    f.bladeActive = false;
    if (f.trail) f.trail.emitting = false;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t > 0.45;
  }
}

/** Q: the Cero, pink, from her mouth. */
class CeroAction extends SkillAction {
  readonly name = 'cero';
  private beam: CeroBeam | null = null;
  constructor(readonly kit: NelKit) {
    super();
    this.mobility = 0.05;
    this.armor = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('nl_cero', {
      onEvent: (n) => {
        if (n !== 'charge' || this.beam) return;
        const mouth = f.visual.rig.sockets.get('mouth');
        if (!mouth) return;
        this.beam = new CeroBeam(g, f, mouth, () => aimPoint(f, g, new THREE.Vector3()), { charge: 0.34, fire: 0.42, radius: 0.38, damage: 74, power: 320, core: NEL_PINK.core, body: NEL_PINK.body, rim: NEL_PINK.rim, range: 85, track: 1.6, gain: 1.4 });
        g.addProjectile(this.beam);
        g.sfx.play('charge', f.center(), 0.6);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 0.9) this.done = true;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t > 0.8;
  }
}

/**
 * Cero Doble, the catch: the left palm (or, for Nel Tu, the open mouth) held out. A reishi attack from the front
 * is stopped there and swallowed into the store; once something has been caught and the flow stops, she fires it
 * back (DobleAction). Nothing caught: the window closes.
 */
class CatchAction extends SkillAction {
  readonly name = 'catch';
  private window: number;
  constructor(readonly kit: NelKit) {
    super();
    this.mobility = 0.15;
    this.armor = 0.2;
    this.window = kit.form === 'child' ? 0.9 : 1.5;
  }
  override start(f: Fighter, g: Game): void {
    this.kit.catching = true;
    this.kit.caughtAt = -1;
    this.kit.stored = 0;
    const clip = this.kit.form === 'child' ? 'nc_swallow' : this.kit.form === 'gamuza' ? 'gz_catch' : 'nl_catch';
    f.anim.play(clip, { hold: true });
    g.sfx.play('ting', f.center(), 0.4);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const k = this.kit;
    if (k.form === 'child' && Math.random() < 0.7) maskEyes(g, f, 1);
    // the palm's glow while it waits
    if (Math.random() < 0.5) {
      const p = k.catchPoint(_v);
      const c = new THREE.Color(NEL_PINK.body);
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.3, sizeEnd: 0.08, life: 0.2, r: c.r, g: c.g, b: c.b, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
    }
    const caught = k.caughtAt >= 0;
    if (caught && g.time - k.caughtAt > 0.3) {
      this.done = true;
      k.fireBack();
      return;
    }
    if (this.t >= this.window && !caught) this.done = true;
  }
  override end(): void {
    this.kit.catching = false;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' || next instanceof DobleAction;
  }
}

/** Cero Doble, the return: she swallows what she caught and fires it back — fused with her own Cero (a child: harder, alone). */
class DobleAction extends SkillAction {
  readonly name = 'doble';
  private fired = false;
  private dur: number;
  constructor(readonly kit: NelKit, readonly stored: number, readonly color: THREE.Color) {
    super();
    this.mobility = 0.05;
    this.armor = 0.5;
    this.dur = kit.form === 'child' ? 0.85 : 1.0;
  }
  override start(f: Fighter, g: Game): void {
    const k = this.kit;
    const clip = k.form === 'child' ? 'nc_spit' : k.form === 'gamuza' ? 'gz_doble' : 'nl_doble';
    g.callout('重奏虚閃', 'CERO DOBLE', NEL_PINK.body);
    f.anim.play(clip, {
      onEvent: (n) => {
        if (n === 'swallow') {
          const m = k.mouthPoint(_v);
          energyCatch(g, m, k.catchPoint(_w), this.color, this.stored);
          g.sfx.play('charge', m, 0.5);
        }
        if (n === 'fire' && !this.fired) {
          this.fired = true;
          k.doble(this.stored, this.color);
        }
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.kit.form === 'child' && this.t < 0.45) maskEyes(g, f, 1.2);
    if (this.t >= this.dur) this.done = true;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.fired && this.t > 0.85;
  }
}

/** R (adult): Sonído — a dip and gone, then beside him with a cut. */
class SonidoAction extends SkillAction {
  readonly name = 'sonido';
  private moved = false;
  constructor(readonly kit: NelKit, readonly target: Fighter | null) {
    super();
    this.mobility = 0;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    f.bladeSpec = { damage: 30, knock: 12, launch: 3, heavy: true, hitstop: 0.08, shake: 0.3, cut: 380 };
    f.anim.play('nl_sonido', {
      onEvent: (n) => {
        if (n === 'vanish') {
          f.ghosts.spawn(0.5, 1);
          g.sfx.play('shunpo', f.center(), 1);
          this.invulnerable = true;
        }
        if (n === 'appear' && !this.moved) {
          this.moved = true;
          this.invulnerable = false;
          this.kit.appearBeside(this.target);
        }
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.target && !this.target.dead && this.t > 0.2) f.faceTarget = this.target.center();
    f.bladeActive = this.t >= 0.17 && this.t <= 0.3;
    if (f.trail) f.trail.emitting = this.t >= 0.16 && this.t <= 0.34;
    if (this.t >= 0.56) this.done = true;
  }
  override end(f: Fighter): void {
    f.bladeActive = false;
    this.invulnerable = false;
    if (f.trail) f.trail.emitting = false;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t > 0.4;
  }
}

/** F (adult): "Utae, Gamuza" — the sword level before her, steaming; the name; the burst; the centaur. */
class ReleaseAction extends SkillAction {
  readonly name = 'release';
  private burst = false;
  constructor(readonly kit: NelKit) {
    super();
    this.mobility = 0;
    this.armor = 0.7;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('nl_release', {
      onEvent: (n) => {
        if (n === 'raise') this.kit.glowBlade(NEL_PINK.body, 0.6);
        if (n === 'name') {
          g.callout('謳え「羚騎士」', 'UTAE, GAMUZA', NEL_PINK.body);
          f.aura.flare(1.6, 0.6);
        }
        if (n === 'burst' && !this.burst) {
          this.burst = true;
          this.kit.toGamuza();
        }
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    // the sword steams and hazes while she names it
    if (!this.burst && this.t > 0.3 && f.bladeValid && Math.random() < 0.8) {
      const b = f.blade.base, t = f.blade.tip, u = Math.random();
      g.engine.dust.spawn({ x: b.x + (t.x - b.x) * u, y: b.y + (t.y - b.y) * u, z: b.z + (t.z - b.z) * u, vx: 0, vy: 0.8 + Math.random(), vz: 0, size: 0.18, sizeEnd: 0.7, life: 0.8, r: 0.96, g: 0.92, b: 0.94, alpha: 0.4, alphaEnd: 0, tex: TEX_GLOW, drag: 1 });
    }
    if (this.t >= 1.1 && this.burst) this.done = true;
    else if (this.t >= 1.5) this.done = true;
  }
}

/** G: the armband — a puff of smoke and she is the other size. */
class SwapAction extends SkillAction {
  readonly name = 'swap';
  private swapped = false;
  constructor(readonly kit: NelKit, readonly to: Form) {
    super();
    this.mobility = 0.05;
    this.invulnerable = true;
  }
  override start(f: Fighter): void {
    const from = this.kit.form;
    f.anim.play(from === 'child' ? 'nc_grow' : from === 'gamuza' ? 'gz_seal' : 'nl_shrink', { onEvent: (n) => n === 'swap' && this.swap() });
  }
  private swap(): void {
    if (this.swapped) return;
    this.swapped = true;
    this.kit.becomeForm(this.to);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 0.32) this.swap();
    if (this.t >= 0.5) this.done = true;
  }
}

// ------------------------------------------------------------------ Nel Tu

/** RMB (child): Nel Tamapunch — low and earnest; a stun, and far worse for the men. */
class TamaAction extends SkillAction {
  readonly name = 'tama';
  private stopAt = 0;
  constructor(readonly kit: NelKit) {
    super();
    this.mobility = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    this.stopAt = lungeTo(f, 0.8, 0.24, 18);
    g.callout('ネル一打パンチ', 'NEL TAMAPUNCH!', NEL_PINK.body);
    f.anim.play('nc_tama', { onEvent: (n) => n === 'hit' && this.kit.tamapunch() });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    this.stopAt = lungeStop(f, this.stopAt);
    if (this.t >= 0.56) this.done = true;
  }
}

/** E (child): Nel Shower — a gag and a gush of green that heals her. */
class ShowerAction extends SkillAction {
  readonly name = 'shower';
  private healed = 0;
  constructor(readonly kit: NelKit) {
    super();
    this.mobility = 0.05;
  }
  override start(f: Fighter, g: Game): void {
    g.callout('', 'NEL SHOWER!', '#7DDC80');
    f.anim.play('nc_shower');
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t > 0.6 && this.t < 1.2) {
      const want = Math.min(130, (this.t - 0.6) / 0.6 * 130);
      const d = want - this.healed;
      if (d > 0) {
        this.healed = want;
        f.hp = Math.min(f.maxHp, f.hp + d);
      }
      showerSpray(g, this.kit.mouthPoint(_v), 3);
      if (Math.random() < 0.2) g.sfx.play('splash', f.center(), 0.3);
    }
    if (this.t >= 1.3) this.done = true;
  }
}

/** R (child): Chōkasoku — the mask's eyes light, a crouch, and she rockets in head first. */
class RocketAction extends SkillAction {
  readonly name = 'rocket';
  private dir = new THREE.Vector3();
  private flying = false;
  private flyT = 0;
  private struck = false;
  constructor(readonly kit: NelKit, readonly target: Fighter | null) {
    super();
    this.mobility = 0;
    this.trackTarget = true;
    this.airGravity = 0;
  }
  override start(f: Fighter, g: Game): void {
    g.callout('超加速', 'CHŌKASOKU', NEL_PINK.body);
    f.anim.play('nc_rocket', { hold: true, onEvent: (n) => n === 'launch' && this.launch(f, g) });
  }
  private launch(f: Fighter, g: Game): void {
    this.flying = true;
    const tp = this.target && !this.target.dead ? this.target.center() : f.center().addScaledVector(f.forward(_v), 10);
    this.dir.subVectors(tp, f.center()).setY(0).normalize();
    if (this.dir.lengthSq() < 0.5) f.forward(this.dir);
    f.yaw = Math.atan2(this.dir.x, this.dir.z);
    f.ghosts.spawn(0.4, 1);
    g.sfx.play('shunpo', f.center(), 1);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    maskEyes(g, f, this.flying ? 1.4 : 1);
    if (!this.flying) return;
    this.flyT += dt;
    // home a little on the way
    if (this.target && !this.target.dead) {
      _v.subVectors(this.target.pos, f.pos).setY(0);
      if (_v.lengthSq() > 0.01) this.dir.lerp(_v.normalize(), Math.min(1, dt * 4)).normalize();
    }
    f.body.vel.x = this.dir.x * 26;
    f.body.vel.z = this.dir.z * 26;
    f.push.set(0, 0, 0);
    if (Math.random() < 0.6) f.ghosts.spawn(0.25, 0.6);
    if (!this.struck) {
      for (const o of g.enemiesOf(f)) {
        if (o.dead) continue;
        const c = o.center();
        if (Math.hypot(c.x - f.pos.x, c.z - f.pos.z) > o.def.radius + 0.6 || Math.abs(c.y - (f.pos.y + 0.6)) > o.def.height * 0.6 + 0.4) continue;
        this.struck = true;
        g.damage(o, 26, f, this.dir.clone(), { knock: 18, launch: 6, heavy: true, hitstop: 0.12, shake: 0.4 });
        g.addRing(c, 2.4, NEL_PINK.body, 0.3);
        f.body.vel.x *= -0.2;
        f.body.vel.z *= -0.2;
        this.done = true;
        return;
      }
    }
    if (this.flyT > 0.55 || f.body.hitWall) this.done = true;
  }
  override end(f: Fighter): void {
    f.body.vel.x *= 0.2;
    f.body.vel.z *= 0.2;
  }
}

// ------------------------------------------------------------------ Gamuza

/** RMB (Gamuza): the plunge — rear high, a stomp that cracks the ground, the lance driven down. */
class PlungeAction extends SkillAction {
  readonly name = 'plunge';
  private stopAt = 0;
  constructor(readonly kit: NelKit) {
    super();
    this.mobility = 0.05;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    f.bladeSpec = { damage: 40, knock: 10, launch: 2, heavy: true, hitstop: 0.12, shake: 0.5, cut: 900, reach: 0.3 };
    this.stopAt = lungeTo(f, 2.0, 0.5, 20);
    f.anim.play('gz_plunge', {
      onEvent: (n) => {
        if (n === 'rear') g.sfx.play('roar', f.center(), 0.4);
        if (n === 'stomp') this.kit.stomp(3.0, 2.2);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    this.stopAt = lungeStop(f, this.stopAt);
    f.bladeActive = this.t >= 0.44 && this.t <= 0.62;
    if (f.trail) f.trail.emitting = this.t >= 0.42 && this.t <= 0.66;
    if (this.t >= 0.92) this.done = true;
  }
  override end(f: Fighter): void {
    f.bladeActive = false;
    if (f.trail) f.trail.emitting = false;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t > 0.7;
  }
}

/** Q (Gamuza): Lanzador Verde — the lance flipped, a rear back, and hurled. */
class LanzadorAction extends SkillAction {
  readonly name = 'lanzador';
  private thrown = false;
  constructor(readonly kit: NelKit) {
    super();
    this.mobility = 0;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('gz_lanzador', {
      onEvent: (n) => {
        if (n === 'flip') g.sfx.play('swing', f.center(), 0.7);
        if (n === 'gather') {
          this.kit.glowBlade(EMERALD.body, 0.8);
          g.callout('翠の射槍', 'LANZADOR VERDE', EMERALD.body);
        }
        if (n === 'throw' && !this.thrown) {
          this.thrown = true;
          this.kit.hurlLance();
        }
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    // the emerald gathering on the lance as she winds up
    if (!this.thrown && this.t > 0.3 && f.bladeValid) {
      const b = f.blade.base, t = f.blade.tip, u = Math.random();
      const c = new THREE.Color(EMERALD.body);
      g.engine.glow.spawn({ x: b.x + (t.x - b.x) * u, y: b.y + (t.y - b.y) * u, z: b.z + (t.z - b.z) * u, vx: (Math.random() - 0.5), vy: 0.6, vz: (Math.random() - 0.5), size: 0.16, sizeEnd: 0.04, life: 0.35, r: c.r, g: c.g, b: c.b, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    }
    if (this.t >= 1.15) this.done = true;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.thrown && this.t > 0.9;
  }
}

/** R (Gamuza): Galope — gone in a blue flash, back a few lengths off him already charging, the lance couched. */
class GalopeAction extends SkillAction {
  readonly name = 'galope';
  private dir = new THREE.Vector3();
  private phase: 'vanish' | 'charge' = 'vanish';
  private chargeT = 0;
  private struck = false;
  constructor(readonly kit: NelKit, readonly target: Fighter | null) {
    super();
    this.mobility = 0;
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    galopeFlash(g, f.center(), 1.2);
    g.sfx.play('shunpo', f.center(), 1.2);
    g.callout('', 'GALOPE', GALOPE_BLUE);
    f.visual.object.visible = false;
    f.anim.play('gz_charge', { hold: true });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.phase === 'vanish') {
      if (this.t < 0.14) return;
      // reappear a few lengths off him, already at full gallop
      const t = this.target && !this.target.dead ? this.target : null;
      if (t) {
        _v.subVectors(f.pos, t.pos).setY(0);
        if (_v.lengthSq() < 0.01) f.forward(_v).negate();
        _v.normalize();
        this.kit.placeAround(t, _v, [[7.5, 0], [7.5, 2.5], [7.5, -2.5], [5.5, 3.5], [5.5, -3.5], [4, 0]]);
        this.dir.subVectors(t.pos, f.pos).setY(0).normalize();
      } else f.forward(this.dir);
      f.yaw = Math.atan2(this.dir.x, this.dir.z);
      f.visual.object.visible = true;
      this.invulnerable = false;
      this.armor = 0.6;
      galopeFlash(g, f.center(), 1);
      this.phase = 'charge';
      return;
    }
    this.chargeT += dt;
    f.body.vel.x = this.dir.x * 38;
    f.body.vel.z = this.dir.z * 38;
    f.push.set(0, 0, 0);
    if (Math.random() < 0.5) f.ghosts.spawn(0.25, 0.7);
    if (Math.random() < 0.6) {
      const c = new THREE.Color(GALOPE_BLUE);
      const p = f.center();
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: -this.dir.x * 10, vy: 0, vz: -this.dir.z * 10, size: 0.8, sizeEnd: 0.2, life: 0.25, r: c.r, g: c.g, b: c.b, alpha: 0.5, alphaEnd: 0, tex: TEX_GLOW });
    }
    if (!this.struck) {
      const tip = f.bladeValid ? f.blade.tip : f.center().addScaledVector(this.dir, 2);
      for (const o of g.enemiesOf(f)) {
        if (o.dead) continue;
        const c = o.center();
        const near = Math.hypot(c.x - tip.x, c.z - tip.z) < o.def.radius + 0.9 || Math.hypot(c.x - f.pos.x, c.z - f.pos.z) < o.def.radius + 1.0;
        if (!near || Math.abs(c.y - tip.y) > o.def.height) continue;
        this.struck = true;
        g.damage(o, 70, f, this.dir.clone(), { knock: 34, launch: 7, heavy: true, hitstop: 0.18, shake: 0.8 });
        g.addRing(c, 4, GALOPE_BLUE, 0.4);
        g.sfx.play('explode', c, 1);
        this.chargeT = Math.max(this.chargeT, 0.45);
      }
    }
    if (this.chargeT > 0.6 || f.body.hitWall) this.done = true;
  }
  override end(f: Fighter): void {
    f.visual.object.visible = true;
    f.body.vel.x *= 0.25;
    f.body.vel.z *= 0.25;
    this.invulnerable = false;
  }
}

/** F (Gamuza): the release burst again — she rears and the reiatsu throws everyone back. */
class BurstAction extends SkillAction {
  readonly name = 'burst';
  private burst = false;
  constructor(readonly kit: NelKit) {
    super();
    this.mobility = 0;
    this.armor = 0.6;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('gz_burst', {
      onEvent: (n) => {
        if (n === 'rear') g.sfx.play('roarBig', f.center(), 0.5);
        if (n === 'burst' && !this.burst) {
          this.burst = true;
          this.kit.shove(7, 18);
        }
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 1.0) this.done = true;
  }
}

// ------------------------------------------------------------------ the kit

export class NelKit implements Kit {
  form: Form = 'adult';
  comboIndex = 0;
  private lastSwingEnd = 0;
  flare = false;
  readonly cd = { precise: 0, cero: 0, doble: 0, sonido: 0, swap: 0, tama: 0, gulp: 0, shower: 0, rocket: 0, plunge: 0, lanzador: 0, galope: 0, burst: 0 };
  /** the catch is open; what it holds, its colour, when the last of it came in */
  catching = false;
  stored = 0;
  caughtAt = -1;
  private storedColor = new THREE.Color(NEL_PINK.body);
  /** the lance is in flight (Lanzador Verde): it re-forms after this */
  private lanceT = 0;
  /** Nel Tu is spent after her Cero Doble */
  private spentT = 0;

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.parry = (amount, from, o) => this.tryCatch(amount, from, o);
    this.hands();
    this.applyLook();
    this.applyStats();
  }

  /** the sword hand holds a fist, the left hand open; Nel Tu's mittens are the open hands */
  private hands(): void {
    const rig = this.f.visual.rig;
    const child = this.form === 'child';
    rig.setBoneVisible('fist.R', !child);
    rig.setBoneVisible('palm.R', child);
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
    f.beamStop = this.catching;
    if (this.spentT > 0) {
      this.spentT -= dt;
      f.rei = Math.min(f.rei, f.maxRei * 0.15);
    }
    if (this.lanceT > 0) {
      this.lanceT -= dt;
      const s = f.visual.props.get('sword');
      if (this.lanceT <= 0) {
        if (s) {
          s.visible = true;
          s.userData.flash = 1;
        }
        const p = this.catchPoint(_v);
        const c = new THREE.Color(EMERALD.body);
        for (let i = 0; i < 20; i++) g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, vz: (Math.random() - 0.5) * 6, size: 0.16, sizeEnd: 0.03, life: 0.4, r: c.r, g: c.g, b: c.b, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
        this.glowBlade(null, 0);
      } else if (s) s.visible = false;
    }
    const s = f.visual.props.get('sword');
    if (s && (s.userData.flash as number | undefined)) s.userData.flash = Math.max(0, (s.userData.flash as number) - dt * 3);
  }

  // ---------------------------------------------------------------- inputs

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof MoveAction) {
      if (cur.index >= 0) cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastSwingEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const list = this.form === 'child' ? NEL_CHILD_CHAIN : this.form === 'gamuza' ? GAMUZA_CHAIN : NEL_CHAIN;
    // the lance is in flight: only the hooves
    const idx = this.form === 'gamuza' && this.lanceT > 0 ? 3 : i % list.length;
    this.comboIndex = idx + 1;
    this.lastSwingEnd = this.g.time + 0.8;
    this.f.act(new MoveAction(this, list[idx], idx), true);
  }

  /** RMB: the precise cut / the Tamapunch / the plunge */
  heavy(): void {
    if (this.form === 'child') this.special(new TamaAction(this), 4, 'tama', 3);
    else if (this.form === 'gamuza') this.special(new PlungeAction(this), 10, 'plunge', 3.5);
    else this.special(new PreciseAction(this), 8, 'precise', 2.6);
  }

  /** Q: Cero / her Cero Doble (child) / Lanzador Verde */
  skill1(): void {
    if (this.form === 'child') {
      if (this.spentT > 0) {
        if (this.f === this.g.player) this.g.hud?.showBanner('Too tired…');
        return;
      }
      this.special(new CatchAction(this), 10, 'gulp', 2);
    } else if (this.form === 'gamuza') {
      if (this.lanceT > 0) return;
      this.special(new LanzadorAction(this), 34, 'lanzador', 7);
    } else this.special(new CeroAction(this), 22, 'cero', 2.4);
  }

  /** E: Cero Doble / Nel Shower */
  skill2(): void {
    if (this.form === 'child') this.special(new ShowerAction(this), 12, 'shower', 12);
    else this.special(new CatchAction(this), 12, 'doble', 2.2);
  }

  /** R: Sonído / Chōkasoku / Galope */
  skill3(): void {
    if (this.form === 'child') this.special(new RocketAction(this, this.near(16)), 8, 'rocket', 3);
    else if (this.form === 'gamuza') this.special(new GalopeAction(this, this.target()), 20, 'galope', 5);
    else this.special(new SonidoAction(this, this.near(18)), 10, 'sonido', 2.6);
  }

  /** G: the armband — adult ↔ Nel Tu; released, back to the woman */
  toggle(): void {
    const to: Form = this.form === 'adult' ? 'child' : 'adult';
    this.special(new SwapAction(this, to), 0, 'swap', 2);
  }

  /** F: grown up (from Nel Tu) / "Utae, Gamuza" / the burst again */
  release(): void {
    const f = this.f;
    if (f.busy) return;
    if (this.form === 'child') {
      this.special(new SwapAction(this, 'adult'), 0, 'swap', 2);
      return;
    }
    if (this.form === 'gamuza') {
      this.special(new BurstAction(this), 14, 'burst', 6);
      return;
    }
    if (!f.spendRei(30)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
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

  private target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 80, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 80);
  }

  private near(range: number): Fighter | null {
    const t = this.target();
    return t && t.pos.distanceTo(this.f.pos) <= range ? t : null;
  }

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

  // ---------------------------------------------------------------- blows

  stopDistance(): number {
    return this.form === 'gamuza' ? 1.7 : this.form === 'child' ? 0.75 : 1.2;
  }

  /** an unarmed blow: in front of her, or all round her (the whirl) */
  blow(s: Blow): void {
    const { f, g } = this;
    const fw = f.forward();
    const p = f.pos.clone().addScaledVector(fw, s.reach).setY(f.pos.y + s.y);
    let hit = false;
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      const cy = Math.max(o.pos.y + 0.1, Math.min(o.pos.y + o.def.height - 0.2, p.y));
      const d = s.radial ? Math.hypot(o.pos.x - f.pos.x, o.pos.z - f.pos.z) : Math.hypot(o.pos.x - p.x, cy - p.y, o.pos.z - p.z);
      if (d > s.r + o.def.radius || (s.radial && Math.abs(cy - p.y) > 1.2)) continue;
      hit = true;
      const dir = s.radial ? _v.subVectors(o.pos, f.pos).setY(0).normalize().clone() : fw.clone();
      g.damage(o, s.damage, f, dir, { knock: s.knock, launch: s.launch, heavy: s.heavy, hitstop: s.heavy ? 0.1 : 0.05, shake: s.heavy ? 0.35 : 0.14 });
      g.sparks(new THREE.Vector3(o.pos.x, cy, o.pos.z), fw, NEL_PINK.body, s.heavy ? 14 : 6);
    }
    if (!hit) g.sfx.play('swing', p, 0.5);
  }

  /** hooves striking the ground in front of her: a crater, a quake round it */
  stomp(radius: number, reach: number): void {
    const { f, g } = this;
    const fw = f.forward();
    const p = f.pos.clone().addScaledVector(fw, reach);
    const gy = groundAt(g, p) ?? f.pos.y;
    p.y = gy;
    g.groundImpact(p.clone(), radius * 0.6, 260, '#A8A070', f);
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      const d = Math.hypot(o.pos.x - p.x, o.pos.z - p.z);
      if (d > radius + o.def.radius || o.pos.y - gy > 1.5) continue;
      g.damage(o, 22 * (1 - d / (radius * 1.6)), f, _v.subVectors(o.pos, p).setY(0).normalize().clone(), { knock: 10, launch: 6, heavy: true, hitstop: 0.08, shake: 0.4 });
    }
    g.shake(f === g.player ? 0.45 : 0.15);
  }

  /** Nel Tamapunch: a stun; the men fold up */
  tamapunch(): void {
    const { f, g } = this;
    const fw = f.forward();
    const p = f.pos.clone().addScaledVector(fw, 0.6).setY(f.pos.y + 0.55);
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      const cy = Math.max(o.pos.y + 0.1, Math.min(o.pos.y + o.def.height - 0.2, p.y));
      if (Math.hypot(o.pos.x - p.x, cy - p.y, o.pos.z - p.z) > 0.7 + o.def.radius) continue;
      const man = !WOMEN.has(o.def.id);
      g.damage(o, man ? 60 : 22, f, fw.clone(), { knock: man ? 2 : 8, heavy: true, hitstop: man ? 0.22 : 0.08, shake: man ? 0.6 : 0.2 });
      if (man && !o.def.boss) {
        o.hitstun = Math.max(o.hitstun, 1.4);
        o.slow(0.6, 1.6);
        g.callout('', '…!!', '#FFE2EE');
      }
      g.addRing(new THREE.Vector3(o.pos.x, cy, o.pos.z), 1.6, NEL_PINK.body, 0.25);
    }
  }

  /** the burst of her reiatsu: everyone near is thrown back */
  shove(radius: number, damage: number): void {
    const { f, g } = this;
    releaseBurst(g, f.pos.clone());
    g.sfx.play('bankai', f.center(), 1);
    g.shake(f === g.player ? 0.7 : 0.25);
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      _v.subVectors(o.pos, f.pos).setY(0);
      const d = _v.length();
      if (d > radius + o.def.radius) continue;
      _v.normalize();
      g.damage(o, damage * (1 - d / (radius * 1.5)), f, _v.clone(), { knock: 34 * (1 - d / (radius * 1.4)) + 8, launch: 7, heavy: true, hitstop: 0.1, shake: 0.6, energy: true });
    }
  }

  /** Sonído's end: beside him (on her side of him, off one shoulder or the other, else behind him), facing him */
  appearBeside(t: Fighter | null): void {
    const { f, g } = this;
    galopeFlash(g, f.center(), 0.5);
    if (!t || t.dead) return;
    _v.subVectors(f.pos, t.pos).setY(0);
    if (_v.lengthSq() < 0.01) f.forward(_v).negate();
    _v.normalize();
    const k = Math.random() < 0.5 ? 1 : -1;
    const spots: [number, number][] = [[1.0, 0.9 * k], [1.0, -0.9 * k], [1.2, 0], [-1.1, 0.4 * k], [-1.1, -0.4 * k]];
    if (!this.placeAround(t, _v, spots)) return;
    f.faceTarget = t.center();
    f.yaw = Math.atan2(t.pos.x - f.pos.x, t.pos.z - f.pos.z);
    f.ghosts.spawn(0.4, 1);
  }

  /**
   * Move to the first clear spot round a target: each spot is [along, across] in metres along `away` (from him
   * toward her) and across it. Returns false (and stays put) when every spot is blocked.
   */
  placeAround(t: Fighter, away: THREE.Vector3, spots: [number, number][]): boolean {
    const side = new THREE.Vector3(-away.z, 0, away.x);
    for (const [a, c] of spots) {
      const p = t.pos.clone().addScaledVector(away, a).addScaledVector(side, c);
      if (this.placeSafe(p, t.pos.y)) return true;
    }
    return false;
  }

  /** move to a spot on the ground near height refY; false (and stays put) if the spot is inside something */
  placeSafe(p: THREE.Vector3, refY: number): boolean {
    const f = this.f;
    const gy = groundAt(this.g, p.clone().setY(refY + 0.4));
    if (gy !== null) p.y = gy;
    if (Math.abs(p.y - refY) > 1.2 || f.body.overlaps(p.x, p.y, p.z)) return false;
    f.body.pos.copy(p);
    f.body.prev.copy(p);
    f.renderPos.copy(p);
    return true;
  }

  // ---------------------------------------------------------------- Cero Doble

  /** where the catch happens: the left palm (adult, Gamuza) or her mouth (Nel Tu) */
  catchPoint(out: THREE.Vector3): THREE.Vector3 {
    const f = this.f;
    const s = f.visual.rig.sockets.get(this.form === 'child' ? 'mouth' : 'palm.L');
    if (!s) return f.center(out).addScaledVector(f.forward(_w), 0.5);
    s.updateWorldMatrix(true, false);
    return s.getWorldPosition(out);
  }

  mouthPoint(out: THREE.Vector3): THREE.Vector3 {
    const f = this.f;
    const s = f.visual.rig.sockets.get('mouth');
    if (!s) return f.center(out);
    s.updateWorldMatrix(true, false);
    return s.getWorldPosition(out);
  }

  /** Before a hit lands: in the catch, a reishi attack from in front of her is stopped and stored. */
  private tryCatch(amount: number, from: Fighter | null, o: DamageOpts): boolean {
    const { f, g } = this;
    if (!this.catching || !o.energy || f.dead) return false;
    const src = from ? from.center() : null;
    if (src) {
      _v.subVectors(src, f.center()).setY(0).normalize();
      if (_v.dot(f.forward(_w)) < -0.15) return false;
    }
    const amt = amount * (from ? from.power : 1);
    const c = new THREE.Color(o.color ?? from?.def.aura.body ?? '#FFF2C9');
    this.storedColor.lerp(c, amt / Math.max(1, this.stored + amt));
    this.stored = Math.min(STORE_CAP, this.stored + amt);
    this.caughtAt = g.time;
    const at = this.catchPoint(_v);
    energyCatch(g, at, src ?? f.center().addScaledVector(f.forward(_w), 3), c, amt);
    if (!o.quiet) g.sfx.play('ting', at, 0.5);
    return true;
  }

  /** the catch closed on something: swallow it and fire it back */
  fireBack(): void {
    const s = this.stored;
    this.stored = 0;
    this.catching = false;
    if (s < 1) return;
    this.f.act(new DobleAction(this, s, this.storedColor.clone()), true);
    this.storedColor.set(NEL_PINK.body);
  }

  /** Cero Doble's beam: what she caught, braided into her own pink Cero (Nel Tu: hers alone, harder) */
  doble(stored: number, color: THREE.Color): void {
    const { f, g } = this;
    const mouth = f.visual.rig.sockets.get('mouth');
    if (!mouth) return;
    const aim = () => aimPoint(f, g, new THREE.Vector3());
    const core = color.clone().lerp(new THREE.Color('#FFFFFF'), 0.6);
    if (this.form === 'child') {
      g.addProjectile(new CeroBeam(g, f, mouth, aim, { charge: 0.02, fire: 0.45, radius: 0.32 + Math.min(0.5, stored / 500), damage: stored * 0.95 + 10, power: 260 + stored, core, body: color, rim: color.clone().multiplyScalar(0.55), range: 80, track: 1.2, gain: 1.4 }));
      this.spentT = 6;
      this.cd.gulp = 12;
      if (f === g.player) g.hud?.showBanner('Nel is all tired out…');
    } else {
      // the caught attack inside, her pink wound round it
      g.addProjectile(new CeroBeam(g, f, mouth, aim, { charge: 0.02, fire: 0.5, radius: 0.3 + Math.min(0.45, stored / 600), damage: stored * 1.0 + 30, power: 300 + stored, core, body: color, rim: color.clone().multiplyScalar(0.55), range: 95, track: 1.3, gain: 1.4 }));
      g.addProjectile(new CeroBeam(g, f, mouth, aim, { charge: 0.02, fire: 0.5, radius: 0.55 + Math.min(0.6, stored / 450), damage: 30 + stored * 0.3, power: 200, core: NEL_PINK.core, body: NEL_PINK.body, rim: NEL_PINK.rim, range: 95, track: 1.3, spiral: true, gain: 1.1 }));
    }
    g.sfx.play('beam', f.center(), Math.min(1.5, 0.7 + stored / 300));
    g.shake(f === g.player ? Math.min(0.6, 0.2 + stored / 600) : 0.15);
    f.aura.flare(1.4, 0.4);
  }

  // ---------------------------------------------------------------- the lance

  /** which point of the lance strikes (the blade def follows) */
  lancePoint(rear: boolean): void {
    const f = this.f;
    if (this.form !== 'gamuza') return;
    const want = rear ? LANCE_REAR : LANCE_FRONT;
    if (f.def.blade === want) return;
    f.def = { ...f.def, blade: want };
    f.bladeValid = false;
  }

  /** Lanzador Verde: the lance leaves her hand, spinning, and drills straight on */
  hurlLance(): void {
    const { f, g } = this;
    const from = f.bladeValid ? f.blade.base.clone().lerp(f.blade.tip, 0.3) : f.center().addScaledVector(f.forward(_v), 1);
    const dir = aimPoint(f, g, new THREE.Vector3()).sub(from).normalize();
    g.addProjectile(new LanzadorShot(g, f, from, dir, { speed: 64, range: 130, damage: 150, radius: 0.55, push: 46 }));
    this.lanceT = 2.6;
    const s = f.visual.props.get('sword');
    if (s) s.visible = false;
    g.sfx.play('getsuga', from, 1.3);
    g.shake(f === g.player ? 0.5 : 0.15);
    galopeFlash(g, from, 0.6);
  }

  /** the weapon's energy glow (a colour, or null to fade) */
  glowBlade(color: string | null, a: number): void {
    const s = this.f.visual.props.get('sword');
    const u = s?.material.userData.uniforms;
    if (!u?.uEnergy) return;
    if (color) {
      const c = new THREE.Color(color);
      u.uEnergy.value.set(c.r, c.g, c.b, a);
    } else u.uEnergy.value.w = a;
  }

  // ---------------------------------------------------------------- forms

  toGamuza(): void {
    const { f, g } = this;
    this.shove(6.5, 20);
    this.becomeForm('gamuza');
    f.aura.flare(2.2, 0.8);
    if (f === g.player) g.hud?.showBanner('Resurrección — Gamuza');
  }

  /** swap the body (the armband, the release, the seal) */
  becomeForm(to: Form): void {
    const { f, g } = this;
    const at = f.center();
    nelPuff(g, at, to === 'child' || this.form === 'child' ? 1 : 1.6);
    this.form = to;
    this.catching = false;
    this.lanceT = 0;
    f.anim.stopAll(0.05);
    const body = FORM_BODY[to];
    const stance = to === 'child' ? NEL_CHILD_STANCE : to === 'gamuza' ? GAMUZA_STANCE : NEL_STANCE;
    const clips = to === 'child' ? NEL_CHILD_CLIPS : to === 'gamuza' ? GAMUZA_CLIPS : NEL_CLIPS;
    f.def = { ...f.def, stance, clips, height: body.height, radius: body.radius, speed: { ...FORM_SPEED[to] } };
    const props = to === 'child' ? [] : [{ key: 'sword', model: nelProp(to === 'gamuza' ? 'lance' : 'gamuza'), socket: 'grip.R' }];
    f.setForm({ asset: nelAsset(to), props }, to === 'gamuza' ? AURA_GAMUZA : AURA_NEL, to === 'gamuza' ? LANCE_FRONT : BLADE);
    f.anim.twoHandGap = to === 'gamuza' ? 0.38 : 0.115;
    this.hands();
    this.applyLook();
    this.applyStats();
    g.sfx.play(to === 'gamuza' ? 'roarBig' : 'purify', at, to === 'gamuza' ? 0.6 : 0.5);
  }

  private applyLook(): void {
    const { f, g } = this;
    const style = this.form === 'gamuza' ? AURA_GAMUZA : AURA_NEL;
    f.aura.setStyle(style);
    f.ghosts.color.set(style.body);
    if (g.hud && f === g.player) g.hud.form = this.formName();
  }

  private applyStats(): void {
    const f = this.f;
    const base = this.form === 'child' ? 0.55 : this.form === 'gamuza' ? 1.5 : 1.15;
    f.power = base * (this.flare ? 1.25 : 1);
    f.damageTaken = this.form === 'child' ? 1.2 : this.form === 'gamuza' ? 0.8 : 1;
    f.aura.target = this.flare ? 1 : this.form === 'child' ? 0.05 : this.form === 'gamuza' ? 0.5 : 0.22;
  }

  formName(): string {
    return this.form === 'child' ? 'Nel Tu' : this.form === 'gamuza' ? 'Resurrección — Gamuza' : 'Nelliel (armband)';
  }

  /** an enemy shot of reishi heading at her (for the AI's Cero Doble) */
  private incoming(): boolean {
    const { f, g } = this;
    for (const p of g.projectiles as unknown as { done: boolean; owner?: Fighter; pos?: THREE.Vector3 }[]) {
      if (p.done || !p.owner || p.owner.team === f.team || !p.pos) continue;
      if (p.pos.distanceTo(f.pos) < 30) return true;
    }
    for (const o of g.enemiesOf(f)) {
      const a = o.action?.name ?? '';
      if (/cero|getsuga|beam|blast|lanza|bala|arrow|shakkaho/i.test(a)) return true;
    }
    return false;
  }

  ai(): KitAI {
    const adult = () => this.form === 'adult', child = () => this.form === 'child', gamuza = () => this.form === 'gamuza';
    return {
      reach: this.form === 'gamuza' ? 2.8 : this.form === 'child' ? 1.2 : 2.0,
      chain: this.form === 'child' ? 3 : 4,
      releaseAt: 0.62,
      moves: [
        { name: 'doble', use: () => this.skill2(), min: 0, max: 60, weight: 4, cd: 3, when: () => !child() && this.incoming() },
        { name: 'gulp', use: () => this.skill1(), min: 0, max: 60, weight: 4, cd: 6, when: () => child() && this.incoming() && this.spentT <= 0 },
        { name: 'cero', use: () => this.skill1(), min: 5, max: 40, weight: 1.4, cd: 3, when: adult },
        { name: 'precise', use: () => this.heavy(), min: 0, max: 4.5, weight: 1.4, cd: 3.5, when: adult },
        { name: 'sonido', use: () => this.skill3(), min: 3, max: 16, weight: 1.3, cd: 4, when: adult },
        { name: 'tama', use: () => this.heavy(), min: 0, max: 2, weight: 1.6, cd: 3.5, when: child },
        { name: 'rocket', use: () => this.skill3(), min: 2.5, max: 14, weight: 1.8, cd: 3.5, when: child },
        { name: 'shower', use: () => this.skill2(), min: 6, max: 60, weight: 1.5, cd: 10, when: () => child() && this.f.hp < this.f.maxHp * 0.75 },
        { name: 'grow', use: () => this.release(), min: 0, max: 60, weight: 3, cd: 4, when: child },
        { name: 'lanzador', use: () => this.skill1(), min: 7, max: 60, weight: 2, cd: 6, when: () => gamuza() && this.lanceT <= 0 },
        { name: 'galope', use: () => this.skill3(), min: 6, max: 34, weight: 1.6, cd: 5, when: gamuza },
        { name: 'plunge', use: () => this.heavy(), min: 0, max: 4.5, weight: 1.3, cd: 4, when: gamuza },
        { name: 'burst', use: () => this.release(), min: 0, max: 4, weight: 0.9, cd: 8, when: gamuza },
      ],
      opener: () => this.skill3(),
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    const flare = { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare };
    if (this.form === 'child') {
      return [
        { key: 'LMB', name: 'Slaps', kanji: '叩' },
        { key: 'RMB', name: 'Nel Tamapunch', kanji: '玉', cost: 4, cd: cd.tama, cdMax: 3 },
        { key: 'Q', name: this.spentT > 0 ? 'Cero Doble (tired)' : 'Cero Doble', kanji: '重奏', cost: 10, cd: Math.max(cd.gulp, this.spentT), cdMax: 12, active: this.catching, tint: NEL_PINK.body },
        { key: 'E', name: 'Nel Shower', kanji: '涎', cost: 12, cd: cd.shower, cdMax: 12, tint: '#7DDC80' },
        { key: 'R', name: 'Chōkasoku', kanji: '超加速', cost: 8, cd: cd.rocket, cdMax: 3 },
        { key: 'Shift', name: 'Sonído', kanji: '響転', cost: 4 },
        flare,
        { key: 'F', name: 'Grow up', kanji: '大人', tint: NEL_PINK.body },
        { key: 'G', name: 'Armband', kanji: '腕章', cd: cd.swap, cdMax: 2 },
      ];
    }
    if (this.form === 'gamuza') {
      return [
        { key: 'LMB', name: 'Lance', kanji: '槍' },
        { key: 'RMB', name: 'Plunge', kanji: '蹄', cost: 10, cd: cd.plunge, cdMax: 3.5 },
        { key: 'Q', name: this.lanceT > 0 ? 'Lanzador Verde (re-forming)' : 'Lanzador Verde', kanji: '翠槍', cost: 34, cd: Math.max(cd.lanzador, this.lanceT), cdMax: 7, tint: EMERALD.body },
        { key: 'E', name: 'Cero Doble', kanji: '重奏', cost: 12, cd: cd.doble, cdMax: 2.2, active: this.catching, tint: NEL_PINK.body },
        { key: 'R', name: 'Galope', kanji: '駆', cost: 20, cd: cd.galope, cdMax: 5, tint: GALOPE_BLUE },
        { key: 'Shift', name: 'Sonído', kanji: '響転', cost: 4 },
        flare,
        { key: 'F', name: 'Release burst', kanji: '謳', cost: 14, cd: cd.burst, cdMax: 6 },
        { key: 'G', name: 'Seal', kanji: '封', cd: cd.swap, cdMax: 2 },
      ];
    }
    return [
      { key: 'LMB', name: 'Sword & kicks', kanji: '剣' },
      { key: 'RMB', name: 'Precise cut', kanji: '斬', cost: 8, cd: cd.precise, cdMax: 2.6 },
      { key: 'Q', name: 'Cero', kanji: '虚閃', cost: 22, cd: cd.cero, cdMax: 2.4, tint: NEL_PINK.body },
      { key: 'E', name: 'Cero Doble', kanji: '重奏', cost: 12, cd: cd.doble, cdMax: 2.2, active: this.catching, tint: NEL_PINK.body },
      { key: 'R', name: 'Sonído slash', kanji: '響転', cost: 10, cd: cd.sonido, cdMax: 2.6 },
      { key: 'Shift', name: 'Sonído', kanji: '響転', cost: 4 },
      flare,
      { key: 'F', name: 'Utae, Gamuza', kanji: '羚騎士', cost: 30, tint: EMERALD.body },
      { key: 'G', name: 'Armband (Nel Tu)', kanji: '腕章', cd: cd.swap, cdMax: 2 },
    ];
  }
}

function groundAt(g: Game, p: THREE.Vector3): number | null {
  const w = g.engine.world;
  const vs = w.vs;
  const x = Math.floor(p.x / vs), z = Math.floor(p.z / vs);
  for (let y = Math.floor((p.y + 1.0) / vs); y > Math.floor((p.y - 4) / vs); y--) if (w.isSolid(x, y, z)) return (y + 1) * vs;
  return null;
}
