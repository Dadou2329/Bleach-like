// Rangiku Matsumoto's kit (docs/kits/rangiku.md). Lazy grace with a knife in it.
// Sealed (the limiter on: weaker until G): a cut, a roundhouse, a backhand cut, a flying kick (LMB); the wide cut
// (RMB); Hadō #31 Shakkahō from the left palm (Q); the provoke — the target is rattled and takes more damage, and in
// a crowd they turn on each other (E); play dead — down in her own blood, and whoever walks up (or hits her) finds
// her behind them with the blade at their throat, then the cut (R); "Unare, Haineko" (F); Gentei Kaijo, the seal
// on her chest dissolving in a column of reiatsu, once — then Bakudō #77 Tenteikūra, the reiatsu net (G).
// Passive: a melee blow from behind while she idles is answered with a back kick.
// Shikai: the blade is a cloud of ash with a density her moves draw on and energy blasts thin. LMB: ribbons of ash
// flicked right and left, the ash spear, the geyser; RMB: the tide that sandblasts through walls; Q: the veil —
// the ash pours over the target and settles on them and round them; E: the flick-cut — every grain that settled
// cuts at once; R: Neko Rinbu, the tornado that traps and cuts (an energy blast from inside breaks it); F: the
// shield (F again lowers it); G: "Hausu!" — a layered wall, then the ash goes home to the blade. She is only a
// hilt while the ash is out: she takes more damage. Slows run off her twice as fast (a blade with no weight).
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { DamageOpts, Game } from '../game';
import { HAINEKO_BASE_Z, HAINEKO_TIP_Z, rangikuAsset, rangikuProp } from '../../chars/rangiku';
import { HAINEKO_CHAIN, HAINEKO_CLIPS, HAINEKO_STANCE, RANGIKU_CHAIN, RANGIKU_CLIPS, RANGIKU_STANCE } from '../../chars/rangikuClips';
import type { AuraStyle } from '../../vfx/aura';
import { ASH, DAFFODIL, RANGIKU_AURA, ashPuff, limiterBurst, tenteiWeb } from '../../vfx/haineko';
import { HainekoAsh, type Rinbu } from '../projectiles/haineko';
import { Shakkaho } from '../projectiles/shakkaho';
import type { AbilityInfo } from '../../ui/hud';
import type { Kit, KitAI } from './kit';
import { aimPoint } from './vasto';

type BladeDef = NonNullable<FighterDef['blade']>;
type Form = 'sealed' | 'shikai';

const AURA: AuraStyle = { core: RANGIKU_AURA.core, body: RANGIKU_AURA.body, rim: RANGIKU_AURA.rim };
const PINK = '#FFB7CE';
const TRAIL = { color: '#F6D2DE', core: '#FFFFFF' };
const KATANA: BladeDef = { prop: 'sword', base: [0, 0, HAINEKO_BASE_Z], tip: [0, 0, HAINEKO_TIP_Z], ...TRAIL };
const SPEED: FighterDef['speed'] = { run: 10.5, sprint: 22, jump: 12, dash: 13.5, dashTime: 0.11 };
/** the limiter holds back most of her power; released, she is herself */
const LIMITED = 0.85;
const UNLIMITED = 1.2;
const DEAD_MAX = 4;
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

/** both forms' clips (Unare and Hausu run on through the swap) */
const CLIPS = [...RANGIKU_CLIPS, ...HAINEKO_CLIPS.filter((c) => !RANGIKU_CLIPS.some((r) => r.name === c.name))];

const sealedProps = () => [
  { key: 'sword', model: rangikuProp('katana'), socket: 'grip.R' },
  { key: 'saya', model: rangikuProp('saya'), socket: 'obi.back' },
  { key: 'seal', model: rangikuProp('seal'), socket: 'chest.front' },
];

export const RANGIKU_DEF: FighterDef = {
  id: 'rangiku',
  name: 'Rangiku Matsumoto',
  title: 'Lieutenant, 10th Division',
  build: () => ({ asset: rangikuAsset(), props: sealedProps() }),
  stance: RANGIKU_STANCE,
  clips: CLIPS,
  aura: AURA,
  blade: KATANA,
  hp: 980,
  rei: 160,
  speed: { ...SPEED },
  radius: 0.38,
  height: 1.74,
};

// ------------------------------------------------------------------ helpers

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

function lungeStop(f: Fighter, stop: number): number {
  const tgt = f.faceTarget;
  if (stop > 0 && tgt && Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z) <= stop) {
    f.push.x = 0;
    f.push.z = 0;
    return 0;
  }
  return stop;
}

interface Blow {
  damage: number;
  knock: number;
  launch?: number;
  heavy?: boolean;
  reach: number;
  y: number;
  r: number;
  unblockable?: boolean;
}

interface Move {
  /** blade windows (cuts) */
  windows?: { at: [number, number]; spec: BladeSpec }[];
  /** a kick at the clip's 'hit' event */
  blow?: Blow;
  /** a hop (the flying kick) */
  hop?: number;
}

const spec = (damage: number, knock: number, cut: number, extra: Partial<BladeSpec> = {}): BladeSpec => ({ damage, knock, launch: 0, hitstop: 0.05, shake: 0.14, cut, ...extra });

const MOVES: Record<string, Move> = {
  rk_s1: { windows: [{ at: [0.1, 0.26], spec: spec(19, 8, 360, { reach: 0.1 }) }] },
  rk_s2: { blow: { damage: 17, knock: 12, launch: 1.5, reach: 1.0, y: 1.0, r: 0.85 } },
  rk_s3: { windows: [{ at: [0.1, 0.26], spec: spec(19, 10, 360, { reach: 0.1 }) }] },
  rk_s4: { blow: { damage: 24, knock: 16, launch: 3, heavy: true, reach: 1.1, y: 1.15, r: 0.85 }, hop: 4.5 },
  rk_wide: { windows: [{ at: [0.2, 0.42], spec: spec(36, 16, 640, { launch: 2, heavy: true, hitstop: 0.09, shake: 0.32, reach: 0.25 }) }] },
};

/** Marker for the skills a string can cancel into. */
abstract class SkillAction extends FighterAction {}

// ------------------------------------------------------------------ sealed

/** One move of the sealed string (or the wide cut): a cut, a kick. */
class MoveAction extends FighterAction {
  readonly name: string;
  private info: Move;
  private dur = 0;
  private comboAt = 0;
  private stopAt = 0;
  private win = -1;
  queued = false;
  constructor(readonly kit: RangikuKit, readonly clip: string, readonly index: number, private boost = 1) {
    super();
    this.name = clip;
    this.info = MOVES[clip];
    this.mobility = 0.12;
    this.airGravity = this.info.hop ? 1 : 0.12;
    if (clip === 'rk_wide') this.armor = 0.25;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    f.bladeHits.clear();
    const w0 = this.info.windows?.[0];
    const at = w0 ? w0.at[0] : c.events.hit ?? 0.2;
    this.stopAt = lungeTo(f, this.info.blow ? 0.95 : 1.3, at);
    if (this.info.hop && f.grounded) {
      f.body.vel.y = this.info.hop;
      f.body.grounded = false;
    }
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n === 'hit' && this.info.blow) this.kit.blow({ ...this.info.blow, damage: this.info.blow.damage * this.boost });
        if (n === 'step') g.sfx.play('step', f.pos, 0.5);
      },
    });
    if (this.info.blow) g.sfx.play('swing', f.center(), 0.6);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    this.stopAt = lungeStop(f, this.stopAt);
    const ws = this.info.windows;
    if (ws) {
      let pre = -1, cur = -1;
      for (let i = 0; i < ws.length; i++) {
        if (t >= ws[i].at[0] - 0.04 && t <= ws[i].at[1]) pre = i;
        if (t >= ws[i].at[0] && t <= ws[i].at[1]) cur = i;
      }
      if (pre >= 0 && pre !== this.win) {
        this.win = pre;
        f.bladeHits.clear();
        const s = ws[pre].spec;
        f.bladeSpec = { ...s, damage: s.damage * this.boost };
        g.sfx.play(s.heavy ? 'swingHeavy' : 'swing', f.center());
      }
      f.bladeActive = cur >= 0;
      if (f.trail) f.trail.emitting = pre >= 0;
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
  }
  override canCancel(next: FighterAction): boolean {
    const ws = this.info.windows;
    const w = ws ? ws[ws.length - 1].at[1] : 0.3;
    if (next.name === 'dash') return this.t >= w;
    return next instanceof SkillAction && this.t >= w + 0.04;
  }
}

/** Q (sealed): Hadō #31 Shakkahō from the left palm. */
class ShakkaAction extends SkillAction {
  readonly name = 'shakka';
  private fired = false;
  constructor(readonly kit: RangikuKit) {
    super();
    this.mobility = 0.25;
  }
  override start(f: Fighter, g: Game): void {
    g.callout('破道の三十一「赤火砲」', 'HADŌ #31 — SHAKKAHŌ', '#FF7A5A');
    f.anim.play('rk_shakka', { onEvent: (n) => n === 'cast' && this.fire(f, g) });
  }
  private fire(f: Fighter, g: Game): void {
    if (this.fired) return;
    this.fired = true;
    const p = this.kit.socketPoint('palm.L', new THREE.Vector3());
    const dir = aimPoint(f, g).sub(p).normalize();
    g.addProjectile(new Shakkaho(f, g, p, dir, { damage: 40, speed: 34, size: 0.48, blast: 1.8, range: 80 }));
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 0.26 && !this.fired) this.fire(f, g);
    if (this.t >= 0.5) this.done = true;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t > 0.3;
  }
}

/** E (sealed): the provoke — the target is rattled; in a crowd they turn on each other. */
class ProvokeAction extends SkillAction {
  readonly name = 'provoke';
  private teased = false;
  constructor(readonly kit: RangikuKit) {
    super();
    this.mobility = 0.15;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('rk_provoke', { onEvent: (n) => n === 'tease' && this.tease(f, g) });
  }
  private tease(f: Fighter, g: Game): void {
    if (this.teased) return;
    this.teased = true;
    const t = this.kit.target(25);
    g.callout('', 'COME ON, THEN~', PINK);
    g.sfx.play('ting', f.center(), 0.4);
    if (!t) return;
    // rattled: careless, they take more from every blow for a while
    t.agedK = Math.max(t.agedK, 0.25);
    t.agedT = Math.max(t.agedT, 6);
    g.addRing(t.center(), 1.6, PINK, 0.35);
    // a crowd turns on itself
    const crowd = g.enemiesOf(f).filter((o) => !o.dead && !o.def.boss && o.pos.distanceTo(t.pos) < 14);
    if (crowd.length >= 2) {
      for (const o of crowd) {
        o.iffT = Math.max(o.iffT, 3.5);
        o.iffFrom = f.pos.clone();
      }
      if (f === g.player) g.hud?.showBanner('They turn on each other', 1.6);
    }
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 0.42 && !this.teased) this.tease(f, g);
    if (this.t >= 0.95) this.done = true;
  }
  override canCancel(next: FighterAction): boolean {
    return this.t > 0.45;
  }
}

/** R (sealed): play dead — down in her own blood, damage halved; whoever walks up or hits her gets the counter. */
class DeadAction extends SkillAction {
  readonly name = 'dead';
  trigger: Fighter | null = null;
  constructor(readonly kit: RangikuKit) {
    super();
    this.mobility = 0;
    this.armor = 0.5;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('rk_dead', { hold: true });
    this.kit.bleed(f.pos);
    g.sfx.play('hitHeavy', f.center(), 0.6);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t > 0.5 && !this.trigger) {
      for (const o of g.enemiesOf(f)) {
        if (!o.dead && o.pos.distanceTo(f.pos) < 2.5) {
          this.trigger = o;
          break;
        }
      }
    }
    if (this.trigger && this.t > 0.3) {
      const o = this.trigger;
      this.done = true;
      if (!o.dead) this.kit.counter(o);
      return;
    }
    if (this.t >= DEAD_MAX) this.done = true;
  }
  override end(f: Fighter): void {
    f.anim.stopAll(0.25);
  }
  override canCancel(next: FighterAction): boolean {
    return next instanceof ThroatAction || (next.name === 'dash' && this.t > 0.6);
  }
}

/** the counter: Shunpo behind them, the blade at the throat, then the cut (×2, unblockable) */
class ThroatAction extends SkillAction {
  readonly name = 'throat';
  private cut = false;
  constructor(readonly kit: RangikuKit, readonly o: Fighter) {
    super();
    this.mobility = 0;
    this.trackTarget = false;
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    const o = this.o;
    const back = o.forward(_v).multiplyScalar(-0.55);
    f.ghosts.spawn(0.25, 0.5);
    g.onDash(f);
    f.body.pos.set(o.pos.x + back.x, o.pos.y, o.pos.z + back.z);
    f.body.vel.set(0, 0, 0);
    f.push.set(0, 0, 0);
    f.yaw = o.yaw;
    f.faceTarget = null;
    o.stopAction();
    o.hitstun = Math.max(o.hitstun, 0.8);
    g.callout('', 'BEHIND YOU', PINK);
    f.anim.play('rk_throat', { onEvent: (n) => n === 'cut' && this.slash(f, g) });
  }
  private slash(f: Fighter, g: Game): void {
    if (this.cut) return;
    this.cut = true;
    const o = this.o;
    if (o.dead) return;
    const dir = f.forward(new THREE.Vector3());
    g.damage(o, 64, f, dir, { knock: 10, launch: 3, heavy: true, hitstop: 0.16, shake: 0.6, unblockable: true });
    g.sparks(o.center().setY(o.pos.y + o.def.height * 0.85), dir, PINK, 18);
    g.sfx.play('swingHeavy', f.center(), 1);
    g.slowMo(0.25, 0.4);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const o = this.o;
    // the blade at the throat: they do not move
    if (this.t < 0.72 && !o.dead) {
      o.hitstun = Math.max(o.hitstun, 0.2);
      o.push.set(0, 0, 0);
      const back = o.forward(_v).multiplyScalar(-0.55);
      f.body.pos.x = o.pos.x + back.x;
      f.body.pos.z = o.pos.z + back.z;
      f.yaw = o.yaw;
    }
    if (this.t >= 0.74 && !this.cut) this.slash(f, g);
    if (this.t >= 1.0) this.done = true;
  }
}

/** G (sealed, once): Gentei Kaijo — the seal on her chest dissolves in a column of reiatsu. */
class GenteiAction extends SkillAction {
  readonly name = 'gentei';
  private burst = false;
  constructor(readonly kit: RangikuKit) {
    super();
    this.mobility = 0;
    this.armor = 0.8;
  }
  override start(f: Fighter, g: Game): void {
    g.callout('限定解除', 'GENTEI KAIJO', DAFFODIL);
    f.anim.play('rk_gentei', { onEvent: (n) => n === 'burst' && this.go() });
  }
  private go(): void {
    if (this.burst) return;
    this.burst = true;
    this.kit.unlimit();
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 0.44) this.go();
    if (this.t >= 0.82) this.done = true;
  }
}

/** G (sealed, after the limiter): Bakudō #77 Tenteikūra — the reiatsu net. */
class TenteiAction extends SkillAction {
  readonly name = 'tentei';
  private linked = false;
  constructor(readonly kit: RangikuKit) {
    super();
    this.mobility = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    g.callout('縛道の七十七「天挺空羅」', 'BAKUDŌ #77 — TENTEIKŪRA', '#FFD9E6');
    f.anim.play('rk_tentei', { onEvent: (n) => n === 'link' && this.link() });
  }
  private link(): void {
    if (this.linked) return;
    this.linked = true;
    this.kit.net();
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 0.38) this.link();
    if (this.t >= 0.75) this.done = true;
  }
}

/** F (sealed): "Unare, Haineko" — the blade crumbles to ash and the cloud is flicked out round her. */
class UnareAction extends SkillAction {
  readonly name = 'unare';
  private named = false;
  private ashed = false;
  constructor(readonly kit: RangikuKit) {
    super();
    this.mobility = 0.1;
    this.armor = 0.6;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('rk_unare', {
      onEvent: (n) => {
        if (n === 'name') this.name_();
        if (n === 'ash') this.ash();
        if (n === 'flick') g.sfx.play('swing', f.center(), 0.8);
      },
    });
  }
  private name_(): void {
    if (this.named) return;
    this.named = true;
    this.kit.g.callout('唸れ「灰猫」', 'UNARE, HAINEKO', '#E6E2DC');
  }
  private ash(): void {
    if (this.ashed) return;
    this.ashed = true;
    this.kit.toShikai();
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 0.22) this.name_();
    if (this.t >= 0.38) this.ash();
    if (this.t >= 0.86) this.done = true;
  }
  override end(): void {
    this.name_();
    this.ash();
  }
}

// ------------------------------------------------------------------ Shikai

/** One flick of the hilt (the Shikai string): the ash does the cutting at mid range. */
class FlickAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private flicked = false;
  queued = false;
  constructor(readonly kit: RangikuKit, readonly clip: string, readonly index: number) {
    super();
    this.name = clip;
    this.mobility = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    f.anim.play(this.clip, { onEvent: (n) => n === 'flick' && this.flick() });
  }
  private flick(): void {
    if (this.flicked) return;
    this.flicked = true;
    this.kit.flickMove(this.clip);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 0.18) this.flick();
    if (this.queued && this.t >= this.comboAt) {
      this.done = true;
      this.kit.chain(this.index + 1);
      return;
    }
    if (this.t >= this.dur) this.done = true;
  }
  override canCancel(next: FighterAction): boolean {
    if (next.name === 'dash') return this.flicked;
    return next instanceof SkillAction && this.t >= 0.16;
  }
}

/** A Shikai skill: plays its clip, does its thing at its event, ends with the clip. */
class AshSkill extends SkillAction {
  private fired = false;
  constructor(readonly kit: RangikuKit, readonly name: string, readonly clip: string, readonly event: string, readonly at: number, readonly endAt: number, readonly go: () => void, armor = 0) {
    super();
    this.mobility = 0.2;
    this.armor = armor;
  }
  override start(f: Fighter): void {
    f.anim.play(this.clip, { onEvent: (n) => n === this.event && this.fire() });
  }
  private fire(): void {
    if (this.fired) return;
    this.fired = true;
    this.go();
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= this.at + 0.03) this.fire();
    if (this.t >= this.endAt) this.done = true;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.fired && this.t > this.at + 0.12;
  }
}

/** G (Shikai): "Hausu!" — the layered wall, then the ash goes home and the blade grows back. */
class HouseAction extends SkillAction {
  readonly name = 'house';
  private called = false;
  constructor(readonly kit: RangikuKit) {
    super();
    this.mobility = 0.1;
  }
  override start(f: Fighter): void {
    f.anim.play('rk_house', { onEvent: (n) => n === 'house' && this.call() });
  }
  private call(): void {
    if (this.called) return;
    this.called = true;
    this.kit.ash?.house();
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 0.28) this.call();
    // done when the ash is home and the blade whole again (the kit swaps it back then)
    if ((this.kit.form === 'sealed' && this.t >= 0.9) || this.t >= 1.5) this.done = true;
  }
  override end(): void {
    this.call();
    if (this.kit.form === 'shikai') this.kit.toSealed();
  }
}

// ------------------------------------------------------------------ the kit

export class RangikuKit implements Kit {
  form: Form = 'sealed';
  comboIndex = 0;
  private lastSwingEnd = 0;
  flare = false;
  /** the Gentei Reiin has been released */
  unlimited = false;
  /** Tenteikūra's net (s left) */
  netT = 0;
  /** played dead once already (the AI's trick) */
  playedDead = false;
  ash: HainekoAsh | null = null;
  private rinbu: Rinbu | null = null;
  private reflexCd = 0;
  private dashFrom: THREE.Vector3 | null = null;
  private crumble: { t: number } | null = null;
  private hudT = 0;
  readonly cd = { wide: 0, shakka: 0, provoke: 0, dead: 0, gentei: 0, tentei: 0, tide: 0, veil: 0, flick: 0, rinbu: 0, shield: 0, house: 0 };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.parry = (amount, from, o) => this.parry(amount, from, o);
    f.onHurt = () => {
      const a = f.action;
      if (a instanceof DeadAction && !a.trigger) a.trigger = this.lastHitter;
    };
    this.hands();
    this.applyLook();
    this.applyStats();
  }

  private lastHitter: Fighter | null = null;

  /** the sword in her right fist, the left hand open */
  private hands(): void {
    const rig = this.f.visual.rig;
    rig.setBoneVisible('fist.R', true);
    rig.setBoneVisible('palm.R', false);
    rig.setBoneVisible('fist.L', false);
    rig.setBoneVisible('palm.L', true);
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    this.reflexCd = Math.max(0, this.reflexCd - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    // the net: no one on her side can be blinded or turned round while it holds
    if (this.netT > 0) {
      this.netT -= dt;
      for (const o of g.fighters) {
        if (o.dead || o.team !== f.team) continue;
        o.blindT = 0;
        o.invertT = 0;
        o.iffT = 0;
      }
    }
    // the release's crumbling blade
    if (this.crumble) {
      this.crumble.t += dt;
      const p = f.visual.props.get('ashblade');
      if (p) p.userData.dissolve = Math.min(1, this.crumble.t / 0.3);
      if (this.crumble.t >= 0.32) {
        f.visual.detach('ashblade');
        this.crumble = null;
      }
    }
    if (this.form === 'shikai') {
      // a blade with no weight: slows wear off twice as fast
      if (f.slowT > 0) f.slowT = Math.max(0, f.slowT - dt);
      // Shunpo leaves a wisp of ash along the way
      if (f.dashT > 0 && !this.dashFrom) this.dashFrom = f.pos.clone();
      if (f.dashT <= 0 && this.dashFrom) {
        this.ash?.wisp(this.dashFrom, f.pos);
        this.dashFrom = null;
      }
      if (this.ash?.done) this.ash = null;
      if (this.rinbu?.done) this.rinbu = null;
      this.hudT -= dt;
      if (this.hudT <= 0 && g.hud && f === g.player) {
        this.hudT = 0.25;
        g.hud.form = this.formName();
      }
    }
  }

  // ---------------------------------------------------------------- inputs

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof MoveAction || cur instanceof FlickAction) {
      if (cur.index >= 0) cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastSwingEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const list = this.form === 'shikai' ? HAINEKO_CHAIN : RANGIKU_CHAIN;
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    this.lastSwingEnd = this.g.time + 0.8;
    this.f.act(this.form === 'shikai' ? new FlickAction(this, list[idx], idx) : new MoveAction(this, list[idx], idx), true);
  }

  /** RMB: the wide cut / the ash tide */
  heavy(): void {
    if (this.form === 'sealed') this.special(new MoveAction(this, 'rk_wide', -1), 6, 'wide', 2.4);
    else if (this.needAsh(0.2)) {
      this.special(new AshSkill(this, 'tide', 'rk_tide', 'wave', 0.26, 0.66, () => this.ash?.tide({ damage: 46, knock: 16, launch: 4, cut: 230, coat: 0.3 }), 0.3), 14, 'tide', 4);
    }
  }

  /** Q: Shakkahō / the ash veil */
  skill1(): void {
    if (this.form === 'sealed') this.special(new ShakkaAction(this), 10, 'shakka', 3);
    else if (this.needAsh(0.15)) {
      this.special(new AshSkill(this, 'veil', 'rk_veil', 'pour', 0.34, 0.7, () => {
        const t = this.target(30);
        const at = t ? t.center() : aimPoint(this.f, this.g);
        this.ash?.veil(t, at);
      }), 10, 'veil', 3.2);
    }
  }

  /** E: the provoke / the flick-cut */
  skill2(): void {
    if (this.form === 'sealed') {
      this.special(new ProvokeAction(this), 4, 'provoke', 8);
      return;
    }
    if (!this.ash) return;
    this.special(new AshSkill(this, 'flick', 'rk_flick', 'cut', 0.12, 0.4, () => {
      const n = this.ash?.flickCut(1) ?? 0;
      if (!n && this.f === this.g.player) this.g.hud?.showBanner('No ash has settled', 1.2);
    }), 8, 'flick', 2.2);
  }

  /** R: play dead / Neko Rinbu */
  skill3(): void {
    if (this.form === 'sealed') {
      if (!this.f.grounded) return;
      if (this.special(new DeadAction(this), 0, 'dead', 14)) this.playedDead = true;
      return;
    }
    if (this.rinbu && !this.rinbu.done) return;
    if (!this.needAsh(0.3)) return;
    this.special(new AshSkill(this, 'rinbu', 'rk_rinbu', 'rinbu', 0.42, 0.8, () => {
      const t = this.target(18);
      const at = t ? t.pos.clone() : this.f.pos.clone().addScaledVector(this.f.forward(), 6);
      this.g.callout('猫輪舞', 'NEKO RINBU', '#E6E2DC');
      this.rinbu = this.ash?.rinbu(t, at, () => {
        if (this.f === this.g.player) this.g.hud?.showBanner('A blast from inside broke the tornado', 1.6);
      }) ?? null;
    }), 24, 'rinbu', 9);
  }

  /** F: "Unare, Haineko" / the ash shield (F again lowers it) */
  release(): void {
    const f = this.f;
    if (this.form === 'shikai') {
      const sh = this.ash?.shield;
      if (sh && !sh.done) {
        sh.lower();
        return;
      }
      if (!this.needAsh(0.2)) return;
      this.special(new AshSkill(this, 'shield', 'rk_shield', 'wall', 0.14, 0.5, () => this.ash?.raiseShield(4)), 12, 'shield', 1);
      return;
    }
    if (f.busy || f.sealT > 0) return;
    if (!f.spendRei(20)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(new UnareAction(this), true);
  }

  /** G: Gentei Kaijo (once), then Tenteikūra / "Hausu!" */
  toggle(): void {
    if (this.form === 'shikai') {
      if (this.ash && !this.ash.recalling) this.special(new HouseAction(this), 0, 'house', 3);
      return;
    }
    if (!this.unlimited) {
      if (this.f.sealT > 0) return;
      this.special(new GenteiAction(this), 0, 'gentei', 1);
    } else this.special(new TenteiAction(this), 18, 'tentei', 16);
  }

  toggleFlare(): void {
    this.flare = !this.flare;
    this.applyStats();
    if (this.flare) {
      this.f.aura.flare(1.6, 0.4);
      this.g.shake(0.2);
      this.g.sfx.play('flare', this.f.center());
      if (this.form === 'shikai') this.ash?.blast();
    }
  }

  /** a move that needs the cloud dense enough */
  private needAsh(k: number): boolean {
    if (!this.ash || this.ash.recalling) return false;
    if (this.ash.density >= k) return true;
    if (this.f === this.g.player) this.g.hud?.showBanner('The ash is too thin', 1.2);
    return false;
  }

  target(range: number): Fighter | null {
    return this.g.nearestEnemy(this.f, range, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, range);
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

  /** a kick in front of her */
  blow(s: Blow): void {
    const { f, g } = this;
    const fw = f.forward();
    const p = f.pos.clone().addScaledVector(fw, s.reach).setY(f.pos.y + s.y);
    let hit = false;
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      const cy = Math.max(o.pos.y + 0.1, Math.min(o.pos.y + o.def.height - 0.2, p.y));
      if (Math.hypot(o.pos.x - p.x, cy - p.y, o.pos.z - p.z) > s.r + o.def.radius) continue;
      hit = true;
      g.damage(o, s.damage, f, fw.clone(), { knock: s.knock, launch: s.launch, heavy: s.heavy, hitstop: s.heavy ? 0.1 : 0.06, shake: s.heavy ? 0.3 : 0.15, unblockable: s.unblockable });
      g.sparks(new THREE.Vector3(o.pos.x, cy, o.pos.z), fw, PINK, s.heavy ? 12 : 6);
    }
    g.sfx.play(hit ? 'impact' : 'swing', p, hit ? 0.9 : 0.4);
  }

  /** the Shikai string: the move each flick sends out */
  flickMove(clip: string): void {
    const { f, g } = this;
    const ash = this.ash;
    if (!ash) return;
    const t = this.target(12);
    if (clip === 'rk_k1') ash.ribbon(-0.95, 0.85, 6.5, { damage: 20, knock: 7, cut: 260, coat: 0.08 });
    else if (clip === 'rk_k2') ash.ribbon(0.95, -0.85, 6.5, { damage: 20, knock: 7, cut: 260, coat: 0.08 });
    else if (clip === 'rk_k3') ash.spear(t ? t.center() : aimPoint(f, g), { damage: 28, knock: 14, cut: 300, coat: 0.12 });
    else if (clip === 'rk_k4') {
      const at = t && t.pos.distanceTo(f.pos) < 11 ? t.pos.clone() : f.pos.clone().addScaledVector(f.forward(), 5);
      ash.geyser(at, { damage: 30, launch: 13, cut: 170, coat: 0.15 });
    }
  }

  /** a pool of her own blood where she lies (play dead) */
  bleed(at: THREE.Vector3): void {
    const dust = this.g.engine.dust;
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * 0.7;
      dust.spawn({ x: at.x + Math.cos(a) * r, y: at.y + 0.04, z: at.z + Math.sin(a) * r, size: 0.5, sizeEnd: 0.9, life: DEAD_MAX, r: 0.38, g: 0.03, b: 0.04, alpha: 0.7, alphaEnd: 0.4, tex: 0, drag: 10 });
    }
  }

  /** the play-dead counter */
  counter(o: Fighter): void {
    this.f.act(new ThroatAction(this, o), true);
  }

  /** Gentei Kaijo: the seal is gone, her strength comes back */
  unlimit(): void {
    const { f, g } = this;
    this.unlimited = true;
    const chest = this.socketPoint('chest.front', new THREE.Vector3());
    f.visual.detach('seal');
    limiterBurst(g, f, chest);
    f.aura.pillarBurst(2);
    f.aura.flare(1.8, 0.6);
    g.sfx.play('bankai', f.center(), 0.7);
    g.shake(f === g.player ? 0.5 : 0.2);
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      _v.subVectors(o.pos, f.pos).setY(0);
      const d = _v.length();
      if (d > 5 + o.def.radius) continue;
      g.damage(o, 10 * (1 - d / 6), f, _v.normalize().clone(), { knock: 18 * (1 - d / 6) + 4, launch: 3, energy: true, quiet: true });
    }
    this.applyStats();
    if (f === g.player) g.hud?.showBanner('The limiter is off', 1.6);
  }

  /** Tenteikūra: for 12 s nothing on her side can be blinded or turned round, and every enemy is laid bare */
  net(): void {
    const { f, g } = this;
    this.netT = 12;
    const all = g.fighters.filter((o) => !o.dead && o !== f && o.pos.distanceTo(f.pos) < 80);
    tenteiWeb(g, f, all);
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      o.agedK = Math.max(o.agedK, 0.12);
      o.agedT = Math.max(o.agedT, 12);
    }
    g.sfx.play('ting', f.center(), 0.6);
    if (f === g.player) g.hud?.showBanner('Tenteikūra — every enemy is laid bare', 1.8);
  }

  socketPoint(socket: string, out: THREE.Vector3): THREE.Vector3 {
    const s = this.f.visual.rig.sockets.get(socket);
    if (!s) return this.f.center(out);
    s.updateWorldMatrix(true, false);
    return s.getWorldPosition(out);
  }

  /** the line where the blade is (or was): from the guard to the tip */
  bladeLine(base: THREE.Vector3, tip: THREE.Vector3): void {
    const s = this.f.visual.props.get('sword');
    if (!s) {
      this.f.center(base);
      tip.copy(base).addScaledVector(this.f.forward(_w), 0.8);
      return;
    }
    s.updateWorldMatrix(true, false);
    base.set(0, 0, HAINEKO_BASE_Z).applyMatrix4(s.matrixWorld);
    tip.set(0, 0, HAINEKO_TIP_Z).applyMatrix4(s.matrixWorld);
  }

  /** before a hit lands: the reflex kick, energy thinning the cloud, the shield swallowing a blast */
  private parry(amount: number, from: Fighter | null, o: DamageOpts): boolean {
    const { f, g } = this;
    this.lastHitter = from;
    if (f.dead || o.quiet) return false;
    if (this.form === 'shikai' && this.ash && o.energy) {
      const sh = this.ash.shield;
      if (sh && !sh.done) {
        // the dome takes it: the ash is blown thin instead of her
        this.ash.thin(amount / 260);
        ashPuff(g, f.center().addScaledVector(from ? _v.subVectors(from.pos, f.pos).setY(0).normalize() : f.forward(_v), 2), 6, 1.4, 4);
        return true;
      }
      // a blast through the cloud scatters it
      this.ash.thin(amount / 320);
    }
    // the reflexes: a blow from behind while she lounges is answered with a back kick
    if (!o.energy && from && !f.busy && this.reflexCd <= 0 && !o.unblockable) {
      _v.subVectors(from.pos, f.pos).setY(0).normalize();
      if (_v.dot(f.forward(_w)) < -0.3 && from.pos.distanceTo(f.pos) < 3) {
        this.reflexCd = 7;
        f.yaw = Math.atan2(_v.x, _v.z);
        f.faceTarget = from.center();
        g.callout('', 'TOO SLOW', PINK);
        if (this.form === 'sealed') f.act(new MoveAction(this, 'rk_s2', -1, 1.3), true);
        else this.ash?.blast();
        return true;
      }
    }
    return false;
  }

  // ---------------------------------------------------------------- forms

  /** the blade goes to ash: the cloud pours out along it, the hilt stays in her hand */
  toShikai(): void {
    const { f, g } = this;
    if (this.form === 'shikai') return;
    this.form = 'shikai';
    // the ash pours out along the blade as it crumbles
    this.ash = new HainekoAsh(g, f, (b, t) => this.bladeLine(b, t), true);
    this.ash.onHome = () => this.toSealed();
    g.addProjectile(this.ash);
    f.visual.attach('sword', rangikuProp('hilt'), 'grip.R');
    f.visual.attach('ashblade', rangikuProp('blade'), 'grip.R');
    this.crumble = { t: 0 };
    f.anim.loco.stance = HAINEKO_STANCE;
    f.def = { ...f.def, stance: HAINEKO_STANCE };
    f.bladeValid = false;
    f.trail?.reset();
    // a blade with no weight: whatever slowed her is shrugged off
    f.slowT = 0;
    f.slowK = 0;
    g.sfx.play('flare', f.center(), 0.7);
    this.applyLook();
    this.applyStats();
  }

  /** the ash is home: the blade is whole again */
  toSealed(): void {
    const { f } = this;
    if (this.form === 'sealed') return;
    this.form = 'sealed';
    if (this.ash && !this.ash.done) {
      this.ash.recall(true);
      this.ash.done = true;
    }
    this.ash = null;
    this.rinbu = null;
    f.visual.attach('sword', rangikuProp('katana'), 'grip.R');
    f.visual.detach('ashblade');
    this.crumble = null;
    f.anim.loco.stance = RANGIKU_STANCE;
    f.def = { ...f.def, stance: RANGIKU_STANCE };
    f.bladeValid = false;
    f.trail?.reset();
    this.g.sfx.play('ting', f.center(), 0.6);
    this.applyLook();
    this.applyStats();
  }

  private applyLook(): void {
    const { f, g } = this;
    f.aura.setStyle(AURA);
    f.ghosts.color.set(this.form === 'shikai' ? ASH : AURA.body);
    f.trail?.setColor(TRAIL.color, TRAIL.core);
    if (g.hud && f === g.player) g.hud.form = this.formName();
  }

  private applyStats(): void {
    const f = this.f;
    const limiter = this.unlimited ? UNLIMITED : LIMITED;
    const form = this.form === 'shikai' ? 1.25 : 1;
    f.power = limiter * form * (this.flare ? 1.25 : 1);
    // only a hilt in her hand while the ash is out
    f.damageTaken = this.form === 'shikai' ? 1.15 : 1;
    f.aura.target = this.flare ? 1 : this.form === 'shikai' ? 0.25 : this.unlimited ? 0.2 : 0.1;
  }

  formName(): string {
    if (this.form === 'sealed') return 'Haineko (sealed)' + (this.unlimited ? '' : ' · limited');
    return `Shikai — Haineko · ash ${Math.round((this.ash?.density ?? 0) * 100)}%`;
  }

  ai(): KitAI {
    const sealed = () => this.form === 'sealed', shikai = () => this.form === 'shikai';
    const tgt = () => this.g.nearestEnemy(this.f, 60);
    const coated = () => {
      const t = tgt();
      return !!t && !!this.ash && (this.ash.coatOf(t) > 0.35 || this.ash.tags.length >= 3);
    };
    return {
      reach: this.form === 'shikai' ? 5.6 : 2.0,
      chain: 4,
      // the limiter at the first sign of trouble, the Shikai early; after "Hausu!" and playing dead, again
      releaseAt: [0.9, 0.15],
      toggleAt: 0.97,
      toggleOn: () => this.form !== 'sealed' || this.unlimited,
      ranged: () => this.form === 'shikai',
      moves: [
        { name: 'wide', use: () => this.heavy(), min: 0, max: 2.6, weight: 1.1, cd: 3, when: sealed },
        { name: 'shakka', use: () => this.skill1(), min: 5, max: 26, weight: 1.2, cd: 4, when: sealed },
        { name: 'provoke', use: () => this.skill2(), min: 2, max: 14, weight: 0.5, cd: 12, when: sealed },
        { name: 'dead', use: () => this.skill3(), min: 2.5, max: 12, weight: 3, cd: 10, when: () => sealed() && !this.playedDead && this.f.hp < this.f.maxHp * 0.3 },
        { name: 'tentei', use: () => this.toggle(), min: 0, max: 40, weight: 0.6, cd: 20, when: () => sealed() && this.unlimited && this.netT <= 0 && (this.f.blindT > 0 || this.f.invertT > 0 || this.f.iffT > 0 || Math.random() < 0.3) },
        { name: 'veil', use: () => this.skill1(), min: 3, max: 15, weight: 1.6, cd: 4, when: () => shikai() && !coated() },
        { name: 'flick', use: () => this.skill2(), min: 0, max: 30, weight: 3, cd: 2.5, when: () => shikai() && coated() },
        { name: 'rinbu', use: () => this.skill3(), min: 0, max: 9, weight: 1.5, cd: 9, when: () => shikai() && (this.ash?.density ?? 0) > 0.45 },
        { name: 'tide', use: () => this.heavy(), min: 4, max: 16, weight: 1.3, cd: 4.5, when: shikai },
        { name: 'shield', use: () => this.release(), min: 9, max: 40, weight: 0.7, cd: 7, when: () => shikai() && !this.ash?.shield },
        // low, she calls the ash home to set up the play-dead trap; pressed hard at point blank, now and then
        { name: 'house', use: () => this.toggle(), min: 0, max: 40, weight: 4, cd: 25, when: () => shikai() && !this.playedDead && this.f.hp < this.f.maxHp * 0.3 },
        { name: 'house close', use: () => this.toggle(), min: 0, max: 2.2, weight: 0.4, cd: 25, when: () => shikai() && this.f.hp < this.f.maxHp * 0.5 },
      ],
      // a smile and a beckoning hand before anything else
      opener: () => this.skill2(),
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    const flare = { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare };
    if (this.form === 'sealed') {
      return [
        { key: 'LMB', name: 'Cuts & kicks', kanji: '剣' },
        { key: 'RMB', name: 'Wide cut', kanji: '薙', cost: 6, cd: cd.wide, cdMax: 2.4 },
        { key: 'Q', name: 'Shakkahō', kanji: '赤火砲', cost: 10, cd: cd.shakka, cdMax: 3, tint: '#FF7A5A' },
        { key: 'E', name: 'Provoke', kanji: '挑', cost: 4, cd: cd.provoke, cdMax: 8, tint: PINK },
        { key: 'R', name: 'Play dead', kanji: '死', cd: cd.dead, cdMax: 14 },
        { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
        flare,
        { key: 'F', name: 'Unare, Haineko', kanji: '唸', cost: 20, tint: '#E6E2DC' },
        this.unlimited
          ? { key: 'G', name: 'Tenteikūra', kanji: '天挺空羅', cost: 18, cd: cd.tentei, cdMax: 16, active: this.netT > 0, timer: this.netT > 0 ? this.netT / 12 : undefined, tint: '#FFD9E6' }
          : { key: 'G', name: 'Gentei Kaijo', kanji: '限定解除', tint: DAFFODIL },
      ];
    }
    const k = this.ash?.density ?? 0;
    const shield = this.ash?.shield;
    return [
      { key: 'LMB', name: `Ash · ${Math.round(k * 100)}%`, kanji: '灰', timer: k, tint: ASH },
      { key: 'RMB', name: 'Ash tide', kanji: '灰波', cost: 14, cd: cd.tide, cdMax: 4 },
      { key: 'Q', name: 'Ash veil', kanji: '覆', cost: 10, cd: cd.veil, cdMax: 3.2 },
      { key: 'E', name: 'Flick-cut', kanji: '斬', cost: 8, cd: cd.flick, cdMax: 2.2 },
      { key: 'R', name: 'Neko Rinbu', kanji: '猫輪舞', cost: 24, cd: cd.rinbu, cdMax: 9, active: !!this.rinbu && !this.rinbu.done },
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
      flare,
      { key: 'F', name: shield ? 'Ash shield (up)' : 'Ash shield', kanji: '盾', cost: 12, cd: cd.shield, cdMax: 1, active: !!shield },
      { key: 'G', name: 'Hausu!', kanji: '帰', cd: cd.house, cdMax: 3 },
    ];
  }
}
