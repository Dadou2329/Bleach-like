// Nnoitra Gilga's kit (docs/roster/E1-espada-1.md, Kit proposal). Sealed, the Quinto Espada: Santa Teresa's
// huge reach — one-handed sweeps, a front kick and a two-handed overhead slam that cracks the ground; RMB the
// Crescent Smash (a hop and an overhead that comes down like a falling building); Q the chain throw (the
// weapon flung on its chain cuts what it passes and bites the first fighter it meets; Q again — or when it
// stops — hauls it back, dragging them in); E the whirl (spun over his head on the chain: a wind that
// batters whoever is close, then thrown); R the tongue Cero (gold, off the tip of his tongue with the 5 on
// it); G the eyepatch torn off (the hole shown, and after that G is Indice Radar: a finger in the ground, a
// line of light to the target — he reads it and his next blows land harder). F "Inore, Santa Teresa": the
// weapon raised overhead in both hands, and he comes out of the light with four arms, each with a mantis
// scythe; his wounds close. Santa Teresa: LMB the four scythes a pair at a time, a chop, a full turn with
// all four; RMB the Mantis Cross (all four flung wide and snapped shut); Q a scythe thrown (another grows out
// of his wrist); E the tongue Cero; R High-Speed Regeneration; G Indice Radar; F Seis Guadañas (a lunge into
// the target, the whirl and the cross). Hierro: the hardest skin of any Espada — light cuts and blows grind
// off it harmlessly, until the one hitting him gets used to it (every hit wears the threshold down).
import * as THREE from 'three';
import { FighterAction, type Fighter, type FighterDef } from '../fighter';
import type { DamageOpts, Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { SCYTHE_ROOT, SCYTHE_TIP, TERESA_HEAD_Z, TERESA_RING, nnoitraAsset, nnoitraProp, type NnoitraForm } from '../../chars/nnoitra';
import { NNOITRA_CHAIN, NNOITRA_CLIPS, NNOITRA_STANCE, SANTA_BLADES, SANTA_CHAIN, SANTA_STANCE } from '../../chars/nnoitraClips';
import { FlyingScythe, NNOITRA_GOLD, RadarTrail, TeresaChain, ThrownTeresa, Whirl } from '../../vfx/teresa';
import { CeroBeam } from '../projectiles/cero';
import { SwordTrail } from '../../vfx/trail';
import { groundAt } from '../../vfx/iceArts';
import { TEX_GLOW } from '../../vfx/sprites';
import type { AuraStyle } from '../../vfx/aura';
import type { BladeSpec } from '../fighter';

export const AURA_NNOITRA: AuraStyle = { core: '#FFF4C2', body: '#F5D33B', rim: '#B8861C' };

type BladeDef = NonNullable<FighterDef['blade']>;
const BLADE_TERESA: BladeDef = { prop: 'sword', base: [0, 0, 0.5], tip: [0, 0, TERESA_HEAD_Z + 0.42], color: '#F5D33B', core: '#FFF4C2' };
const BLADE_SCYTHE: BladeDef = { prop: 'sword', base: [...SCYTHE_ROOT], tip: [...SCYTHE_TIP], color: '#F5D33B', core: '#FFF4C2' };

const SPEED = { run: 10.5, sprint: 30, jump: 14, dash: 26, dashTime: 0.1 };

function sealedProps(): { key: string; model: ReturnType<typeof nnoitraProp>; socket: string }[] {
  return [
    { key: 'sword', model: nnoitraProp('teresa'), socket: 'grip.R' },
    { key: 'tongue', model: nnoitraProp('tongue'), socket: 'mouth' },
  ];
}

function santaProps(): { key: string; model: ReturnType<typeof nnoitraProp>; socket: string }[] {
  return [
    { key: 'sword', model: nnoitraProp('scythe'), socket: 'grip.R' },
    { key: 'scythe2', model: nnoitraProp('scythe'), socket: 'grip.L' },
    { key: 'scythe3', model: nnoitraProp('scythe'), socket: 'grip2.R' },
    { key: 'scythe4', model: nnoitraProp('scythe'), socket: 'grip2.L' },
    { key: 'tongue', model: nnoitraProp('tongue'), socket: 'mouth' },
  ];
}

export const NNOITRA_DEF: FighterDef = {
  id: 'nnoitra',
  name: 'Nnoitra Gilga',
  title: 'Quinto Espada',
  build: () => ({ asset: nnoitraAsset('sealed'), props: sealedProps() }),
  stance: NNOITRA_STANCE,
  clips: NNOITRA_CLIPS,
  aura: AURA_NNOITRA,
  blade: BLADE_TERESA,
  hp: 1250,
  rei: 200,
  speed: { ...SPEED },
  radius: 0.42,
  height: 2.15,
};

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

/** one extra blade the kit sweeps itself (Santa Teresa's other scythes) */
interface Extra {
  key: string;
  trail: SwordTrail;
  base: THREE.Vector3;
  tip: THREE.Vector3;
  pb: THREE.Vector3;
  pt: THREE.Vector3;
  valid: boolean;
  active: boolean;
  hits: Set<number>;
}

// ---------------------------------------------------------------------------------------------- actions

/** Light cuts (both forms): 'hit' opens the window, 'combo' chains; the kick hits with the foot, the slam cracks the ground. */
class CutAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private hitAt = -1;
  private kicked = new Set<number>();
  queued = false;
  constructor(readonly kit: NnoitraKit, readonly clip: string, readonly index: number, readonly last: boolean) {
    super();
    this.name = clip;
    this.mobility = 0.2;
    this.airGravity = 0.15;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.62;
    this.hitAt = c.events.hit ?? -1;
    const santa = this.kit.form === 'santa';
    const slam = this.clip === 'nn_cut3', spin = this.clip === 'sa_cut4';
    f.bladeHits.clear();
    this.kit.extraHits();
    const spec: BladeSpec = slam
      ? { damage: 34, knock: 12, launch: 6, heavy: true, hitstop: 0.1, shake: 0.4, cut: 600, reach: 0.55 }
      : santa
        ? { damage: spin ? 18 : 16, knock: 7, launch: this.last ? 4 : 0, hitstop: 0.04, shake: 0.12, cut: 320, reach: 0.4 }
        : { damage: 22, knock: 10, launch: 0, hitstop: 0.05, shake: 0.16, cut: 420, reach: 0.55 };
    f.bladeSpec = spec;
    this.kit.extraSpec = spec;
    this.kit.setExtras(santa ? (SANTA_BLADES[this.clip] ?? []).filter((k) => k !== 'sword') : []);
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n === 'slam') this.kit.slam(f.pos.clone().addScaledVector(f.forward(), 2.6), 1.8, 30);
        if (n !== 'step') return;
        // step into the cut; the scythes are shorter than Santa Teresa, so he closes in further once released
        const tgt = f.faceTarget;
        const extra = tgt ? Math.min(5, Math.max(0, f.pos.distanceTo(tgt) - (santa ? 1.5 : 2.4))) : 0;
        f.push.addScaledVector(f.forward(), 6 + extra * 3.4);
        g.sfx.play(slam || spin ? 'swingHeavy' : 'swing', f.center(), 0.8);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    const kick = this.clip === 'nn_kick', spin = this.clip === 'sa_cut4';
    const open = this.hitAt >= 0 && t >= this.hitAt - 0.05 && t <= this.hitAt + (spin ? 0.4 : 0.1);
    const blade = this.kit.form !== 'santa' || (SANTA_BLADES[this.clip] ?? ['sword']).includes('sword');
    f.bladeActive = open && !kick && blade;
    this.kit.extraActive(open && !kick);
    if (f.trail) f.trail.emitting = f.bladeActive;
    // the kick: the long leg's reach in front of him
    if (kick && open) {
      const fw = f.forward(_w);
      for (const o of g.enemiesOf(f)) {
        if (o.dead || this.kicked.has(o.id)) continue;
        _v.subVectors(o.pos, f.pos).setY(0);
        if (_v.length() > 2.3 + o.def.radius || _v.normalize().dot(fw) < 0.4) continue;
        this.kicked.add(o.id);
        g.damage(o, 20, f, fw.clone(), { knock: 18, launch: 3, heavy: true, hitstop: 0.08, shake: 0.25 });
      }
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
    this.kit.extraActive(false);
    if (f.trail) f.trail.emitting = false;
  }
  override canCancel(next: FighterAction): boolean {
    if (next.name === 'dash' || next instanceof SkillAction) return this.t >= this.hitAt + 0.03;
    return false;
  }
}

abstract class SkillAction extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: NnoitraKit) {
    super();
  }
  protected playClip(f: Fighter, clip: string, onEvent: (n: string) => void, opts: { speed?: number; hold?: boolean; loop?: boolean } = {}): void {
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
    this.kit.extraActive(false);
    if (f.trail) f.trail.emitting = false;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t > this.dur * 0.5;
  }
}

/** RMB: the Crescent Smash (sealed) / the Mantis Cross (Santa Teresa). */
class HeavyAction extends SkillAction {
  readonly name = 'heavy';
  private hit = 0.3;
  constructor(kit: NnoitraKit) {
    super(kit);
    this.mobility = 0.1;
    this.armor = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    const santa = this.kit.form === 'santa';
    const clip = santa ? 'sa_heavy' : 'nn_heavy';
    this.hit = f.anim.clip(clip)?.events.hit ?? 0.3;
    f.bladeHits.clear();
    this.kit.extraHits();
    const spec: BladeSpec = santa
      ? { damage: 30, knock: 20, launch: 4, heavy: true, hitstop: 0.12, shake: 0.4, cut: 520, reach: 0.45 }
      : { damage: 52, knock: 14, launch: 8, heavy: true, hitstop: 0.14, shake: 0.5, cut: 900, reach: 0.6 };
    f.bladeSpec = spec;
    this.kit.extraSpec = spec;
    this.kit.setExtras(santa ? ['scythe2', 'scythe3', 'scythe4'] : []);
    this.playClip(f, clip, (n) => {
      if (n === 'step') {
        const tgt = f.faceTarget;
        const extra = tgt ? Math.min(6, Math.max(0, f.pos.distanceTo(tgt) - 2.4)) : 0;
        f.push.addScaledVector(f.forward(), 7 + extra * 3);
        g.sfx.play('swingHeavy', f.center(), 1.1);
      }
      if (n === 'slam') this.kit.slam(f.pos.clone().addScaledVector(f.forward(), 2.8), 3.2, 46);
    });
    if (santa) g.callout('螳螂十字', 'MANTIS CROSS', '#F5D33B');
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const open = this.t >= this.hit - 0.08 && this.t <= this.hit + 0.14;
    f.bladeActive = open;
    this.kit.extraActive(open);
    if (f.trail) f.trail.emitting = open;
  }
}

/** Q (sealed): the chain throw — out, a wait while it flies, and the yank. Also the end of the whirl. */
class ThrowAction extends SkillAction {
  readonly name = 'throw';
  private thrown: ThrownTeresa | null = null;
  private caught = false;
  private yanking = false;
  constructor(kit: NnoitraKit, private from: THREE.Vector3 | null = null) {
    super(kit);
    this.mobility = 0.15;
  }
  override start(f: Fighter, g: Game): void {
    if (this.from) {
      const inst = f.anim.play('nn_throw', { fadeIn: 0.05 });
      if (inst) inst.time = 0.3;
      this.launch(f, g, this.from);
    } else {
      this.playClip(f, 'nn_throw', (n) => n === 'throw' && this.launch(f, g, sock(f, 'grip.R')), { hold: true });
    }
    this.dur = 9;
  }
  private launch(f: Fighter, g: Game, from: THREE.Vector3): void {
    const dir = this.kit.aim().sub(from).normalize();
    this.thrown = new ThrownTeresa(g, f, from, dir, () => sock(f, 'grip.R'), 26, 40 * f.power);
    g.addProjectile(this.thrown);
    this.kit.weaponOut(this.thrown);
    g.sfx.play('swingHeavy', from, 1.2);
  }
  /** Q again: haul it back */
  yank(): void {
    if (this.thrown && !this.yanking) {
      this.yanking = true;
      this.thrown.yank();
      this.kit.f.anim.play('nn_yank', { fadeIn: 0.05 });
    }
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const th = this.thrown;
    if (!th) return;
    if (th.returning && !this.yanking) {
      this.yanking = true;
      f.anim.play('nn_yank', { fadeIn: 0.05 });
    }
    if (th.done && !this.caught) {
      this.caught = true;
      this.kit.weaponBack();
      g.sfx.play('impact', f.center(), 0.5);
      this.dur = this.t + 0.3;
    }
  }
  override end(f: Fighter): void {
    super.end(f);
    if (this.thrown && !this.thrown.done) {
      this.thrown.done = true;
      this.kit.weaponBack();
    }
    f.anim.stopAll(0.2);
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.caught;
  }
}

/** E (sealed): the whirl — spun over his head on the chain for a while, then thrown. */
class WhirlAction extends SkillAction {
  readonly name = 'whirl';
  private whirl: Whirl | null = null;
  constructor(kit: NnoitraKit) {
    super(kit);
    this.mobility = 0.45;
    this.armor = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('nn_whirl', { fadeIn: 0.1 });
    this.dur = 1.7;
    this.whirl = new Whirl(g, f);
    g.addProjectile(this.whirl);
    this.kit.weaponOut(this.whirl);
    g.sfx.play('swingHeavy', f.center(), 0.9);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    this.t += dt;
    if (this.t % 0.25 < dt) g.sfx.play('swing', f.center(), 0.6);
    if (this.t >= this.dur && this.whirl) {
      // let it fly from where it is in the circle
      const from = this.whirl.head();
      this.whirl.end();
      this.whirl = null;
      this.done = true;
      this.kit.weaponBack();
      f.act(new ThrowAction(this.kit, from), true);
    }
  }
  override end(f: Fighter): void {
    super.end(f);
    if (this.whirl) {
      this.whirl.end();
      this.whirl = null;
      this.kit.weaponBack();
    }
  }
}

/** R: the tongue Cero — leaning in, the tongue with the 5 out, the gold gathering on its tip. */
class CeroAction extends SkillAction {
  readonly name = 'cero';
  constructor(kit: NnoitraKit) {
    super(kit);
    this.mobility = 0.15;
  }
  override start(f: Fighter, g: Game): void {
    this.kit.tongue(true);
    this.playClip(f, this.kit.form === 'santa' ? 'sa_cero' : 'nn_cero', (n) => {
      if (n === 'charge') this.kit.fireCero();
    });
    g.callout('虚閃', 'CERO', '#FFC930');
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.tongue(false);
  }
}

/** G (sealed): the eyepatch torn off. */
class PatchAction extends SkillAction {
  readonly name = 'patch';
  constructor(kit: NnoitraKit) {
    super(kit);
    this.mobility = 0.2;
  }
  override start(f: Fighter): void {
    this.playClip(f, 'nn_patch', (n) => n === 'off' && this.kit.patchOff());
  }
}

/** G: Indice Radar — a finger jabbed into the ground; the light runs to the target. */
class RadarAction extends SkillAction {
  readonly name = 'radar';
  constructor(kit: NnoitraKit) {
    super(kit);
    this.mobility = 0;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'nn_radar', (n) => n === 'touch' && this.kit.radar());
    g.callout('捜指法', 'INDICE RADAR', '#FFE45A');
  }
}

/** F (sealed): "Inore, Santa Teresa". */
class ReleaseAction extends SkillAction {
  readonly name = 'release';
  constructor(kit: NnoitraKit) {
    super(kit);
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'nn_release', (n) => {
      if (n === 'pray') {
        g.callout('祈れ「聖哭螳螂」', 'INORE — SANTA TERESA', '#F5D33B');
        f.aura.flare(1.6, 0.8);
        f.aura.pillarBurst(3);
        g.sfx.play('bankai', f.center(), 0.9);
      }
      if (n === 'form') this.kit.becomeSanta();
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    // the reiatsu pouring out of the gap between the crescents
    if (this.t > 0.3 && this.t < 1.0 && this.kit.form !== 'santa') {
      const p = this.kit.bladePoint(1);
      for (let i = 0; i < 4; i++) g.engine.glow.spawn({ x: p.x + (Math.random() - 0.5) * 0.6, y: p.y, z: p.z + (Math.random() - 0.5) * 0.6, vx: (Math.random() - 0.5) * 2, vy: 4 + Math.random() * 5, vz: (Math.random() - 0.5) * 2, size: 0.35, sizeEnd: 0.05, life: 0.6, r: 1, g: 0.86, b: 0.3, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    }
  }
}

/** Q (Santa Teresa): a scythe thrown overhand; another grows out of his wrist. */
class VolleyAction extends SkillAction {
  readonly name = 'volley';
  constructor(kit: NnoitraKit) {
    super(kit);
    this.mobility = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'sa_throw', (n) => {
      if (n === 'throw') this.kit.throwScythe();
      if (n === 'regrow') this.kit.regrowScythe();
    });
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.regrowScythe();
  }
}

/** R (Santa Teresa): High-Speed Regeneration. */
class RegenAction extends SkillAction {
  readonly name = 'regen';
  constructor(kit: NnoitraKit) {
    super(kit);
    this.mobility = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    this.dur = 0.5;
    f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.16);
    this.kit.regenT = 4;
    f.aura.flare(1.3, 0.4);
    g.sfx.play('flare', f.center(), 0.6);
    g.callout('超速再生', 'HIGH-SPEED REGENERATION', '#F5D33B');
  }
}

/** F (Santa Teresa): Seis Guadañas — straight into the target, every blade round, then the cross. */
class SeisAction extends SkillAction {
  readonly name = 'seis';
  private stage = 0;
  constructor(kit: NnoitraKit, readonly target: Fighter | null) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    this.dur = 2.2;
    g.callout('六鎌', 'SEIS GUADAÑAS', '#F5D33B');
    f.aura.flare(1.5, 0.5);
    if (this.target) this.kit.lunge(this.target);
    this.next(f);
  }
  private next(f: Fighter): void {
    const g = this.kit.g;
    this.stage++;
    f.bladeHits.clear();
    this.kit.extraHits();
    const spec: BladeSpec = { damage: this.stage === 1 ? 26 : 40, knock: this.stage === 1 ? 6 : 24, launch: this.stage === 1 ? 2 : 6, heavy: true, hitstop: 0.08, shake: 0.35, cut: 640, reach: 0.4 };
    f.bladeSpec = spec;
    this.kit.extraSpec = spec;
    this.kit.setExtras(['scythe2', 'scythe3', 'scythe4']);
    f.anim.play(this.stage === 1 ? 'sa_cut4' : 'sa_heavy', { fadeIn: 0.04 });
    g.sfx.play('swingHeavy', f.center(), 1);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const local = this.stage === 1 ? this.t : this.t - 0.62;
    const open = this.stage === 1 ? local > 0.06 && local < 0.5 : local > 0.24 && local < 0.42;
    f.bladeActive = open;
    this.kit.extraActive(open);
    if (f.trail) f.trail.emitting = open;
    if (this.stage === 1 && this.t > 0.62) this.next(f);
    if (this.stage === 2 && local > 0.85) this.done = true;
  }
}

// ---------------------------------------------------------------------------------------------- the kit

type Form = NnoitraForm;

export class NnoitraKit implements Kit {
  form: Form = 'sealed';
  flare = false;
  comboIndex = 0;
  readonly cd = { heavy: 0, throw: 0, whirl: 0, cero: 0, radar: 0, volley: 0, regen: 0, seis: 0 };
  /** Hierro: how used each attacker has got to his skin (hits taken from them) */
  private adapt = new Map<number, number>();
  /** Indice Radar: the target read (s left) */
  markT = 0;
  private marked: Fighter | null = null;
  regenT = 0;
  private lastEnd = 0;
  private links: TeresaChain | null = null;
  /** the weapon off his hand (thrown or whirled): the chain runs to it */
  private away: { ring(out?: THREE.Vector3): THREE.Vector3 } | null = null;
  private tip: THREE.Object3D | null = null;
  // the other three scythes (Santa Teresa)
  private extras: Extra[] = [];
  extraSpec: BladeSpec | null = null;
  private extraOn = new Set<string>();

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.def = { ...f.def, speed: { ...SPEED } };
    f.parry = (amount, from, o) => this.hierro(amount, from, o);
    this.hands();
    this.tongue(false);
    this.makeChain();
    this.applyStats();
  }

  private hands(): void {
    const rig = this.f.visual.rig;
    const santa = this.form === 'santa';
    rig.setBoneVisible('fist.R', true);
    rig.setBoneVisible('palm.R', false);
    rig.setBoneVisible('fist.L', santa);
    rig.setBoneVisible('palm.L', !santa);
    if (santa) for (const h of ['fist2.R', 'fist2.L']) rig.setBoneVisible(h, true);
    if (santa) for (const h of ['palm2.R', 'palm2.L']) rig.setBoneVisible(h, false);
  }

  private makeChain(): void {
    this.links?.end();
    this.links = null;
    if (this.form === 'santa') return;
    this.links = new TeresaChain(this.g, this.f, () => this.chainEnds());
    this.g.addProjectile(this.links);
  }

  /** the chain: from the butt ring (in his hand, or wherever the weapon is) to his waist */
  private chainEnds(): [THREE.Vector3, THREE.Vector3] | null {
    const f = this.f;
    const waist = sock(f, 'chain');
    if (this.away) return [this.away.ring(), waist];
    const prop = f.visual.props.get('sword');
    if (!prop || !prop.visible) return null;
    prop.updateWorldMatrix(true, false);
    return [new THREE.Vector3(...TERESA_RING).applyMatrix4(prop.matrixWorld), waist];
  }

  weaponOut(w: { ring(out?: THREE.Vector3): THREE.Vector3 }): void {
    this.away = w;
    const prop = this.f.visual.props.get('sword');
    if (prop) prop.visible = false;
  }

  weaponBack(): void {
    this.away = null;
    const prop = this.f.visual.props.get('sword');
    if (prop) prop.visible = true;
    this.f.bladeValid = false;
  }

  tongue(on: boolean): void {
    const t = this.f.visual.props.get('tongue');
    if (t) t.visible = on;
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    if (this.markT > 0 && (this.markT -= dt) <= 0) this.marked = null;
    // Santa Teresa regenerates; faster after the regeneration burst
    if (this.form === 'santa' && !f.dead) f.hp = Math.min(f.maxHp, f.hp + f.maxHp * (this.regenT > 0 ? 0.035 : 0.006) * dt);
    if (this.regenT > 0) this.regenT -= dt;
    // Hierro slowly hardens again against those who stopped hitting him
    for (const [id, n] of this.adapt) this.adapt.set(id, Math.max(0, n - dt * 0.25));
    this.sampleExtras(dt);
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
    return f.center(out).addScaledVector(f.forward(_w), 40);
  }

  bladePoint(k: number, out = new THREE.Vector3()): THREE.Vector3 {
    const f = this.f;
    const prop = f.visual.props.get('sword');
    const b = f.def.blade;
    if (!prop || !b) return f.center(out);
    prop.updateWorldMatrix(true, false);
    out.set(b.base[0] + (b.tip[0] - b.base[0]) * k, b.base[1] + (b.tip[1] - b.base[1]) * k, b.base[2] + (b.tip[2] - b.base[2]) * k);
    return out.applyMatrix4(prop.matrixWorld);
  }

  // ---------------------------------------------------------------- the other scythes

  private ensureExtras(): void {
    if (this.form !== 'santa' || this.extras.length) return;
    for (const key of ['scythe2', 'scythe3', 'scythe4']) {
      const trail = new SwordTrail(26, AURA_NNOITRA.body, AURA_NNOITRA.core);
      this.g.engine.gr.scene.add(trail.mesh);
      this.extras.push({ key, trail, base: new THREE.Vector3(), tip: new THREE.Vector3(), pb: new THREE.Vector3(), pt: new THREE.Vector3(), valid: false, active: false, hits: new Set() });
    }
  }

  setExtras(keys: string[]): void {
    this.extraOn = new Set(keys);
  }

  extraHits(): void {
    for (const x of this.extras) x.hits.clear();
  }

  extraActive(on: boolean): void {
    for (const x of this.extras) x.active = on && this.extraOn.has(x.key);
  }

  /** the other scythes: trails and sweeps, each with its own hit list */
  private sampleExtras(dt: number): void {
    const { f, g } = this;
    for (const x of this.extras) {
      const prop = f.visual.props.get(x.key);
      if (!prop || !prop.visible) {
        x.valid = false;
        x.trail.emitting = false;
        continue;
      }
      prop.updateWorldMatrix(true, false);
      x.pb.copy(x.base);
      x.pt.copy(x.tip);
      x.base.set(...SCYTHE_ROOT).applyMatrix4(prop.matrixWorld);
      x.tip.set(...SCYTHE_TIP).applyMatrix4(prop.matrixWorld);
      if (!x.valid) {
        x.pb.copy(x.base);
        x.pt.copy(x.tip);
        x.valid = true;
      }
      x.trail.emitting = x.active;
      x.trail.update(dt, x.base, x.tip);
      if (x.active && this.extraSpec) {
        const keep = [...f.bladeHits];
        f.bladeHits.clear();
        for (const id of x.hits) f.bladeHits.add(id);
        g.bladeSweep(f, x.pb, x.pt, x.base, x.tip, this.extraSpec);
        x.hits.clear();
        for (const id of f.bladeHits) x.hits.add(id);
        f.bladeHits.clear();
        for (const id of keep) f.bladeHits.add(id);
      }
    }
  }

  // ---------------------------------------------------------------- Hierro

  /**
   * Before a hit lands: light blows grind off his skin (sparks, a ting, nothing) — but every hit from the same
   * attacker wears the threshold down: they get used to him. Reishi (Ceros, Getsuga, Kidō) gets through.
   */
  private hierro(amount: number, from: Fighter | null, o: DamageOpts): boolean {
    const { f, g } = this;
    if (!from || f.dead || o.energy || o.quiet) return false;
    const used = this.adapt.get(from.id) ?? 0;
    this.adapt.set(from.id, used + 1);
    const thr = Math.max(0, (this.form === 'santa' ? 28 : 24) - used * 3);
    if (amount * from.power >= thr) return false;
    _v.subVectors(from.center(), f.center()).normalize();
    g.sparks(f.center().addScaledVector(_v, f.def.radius), _v, '#F3F3F0', 8);
    g.sfx.play('ting', f.center(), 0.6);
    if (f === g.player || from === g.player) g.hud?.damageNumber(f.center().setY(f.pos.y + f.def.height), 0, '#BFC4CA', false);
    return true;
  }

  // ---------------------------------------------------------------- techniques

  /** the slam: the crescents bite into the ground */
  slam(at: THREE.Vector3, r: number, damage: number): void {
    const { f, g } = this;
    const gy = groundAt(g, at.x, at.y + 1, at.z, 4);
    if (gy === null) return;
    const p = new THREE.Vector3(at.x, gy, at.z);
    g.groundImpact(p, r, 300 + r * 80, '#F5D33B', f);
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      _v.subVectors(o.pos, p).setY(0);
      if (_v.length() > r * 1.6 + o.def.radius) continue;
      g.damage(o, damage, f, _v.normalize().clone(), { knock: 10, launch: 7, heavy: true, hitstop: 0.08, shake: 0.4 });
    }
    if (f === g.player) g.shake(0.25 + r * 0.05);
  }

  fireCero(): void {
    const { f, g } = this;
    const t = f.visual.props.get('tongue');
    if (!t) return;
    if (!this.tip || this.tip.parent !== t) {
      this.tip = new THREE.Object3D();
      this.tip.position.set(0, 0.01, 9 / 48);
      t.add(this.tip);
    }
    const santa = this.form === 'santa';
    g.addProjectile(new CeroBeam(g, f, this.tip, () => this.aim(), { charge: 0.36, fire: 0.42, radius: santa ? 0.5 : 0.4, damage: santa ? 110 : 84, power: santa ? 360 : 300, core: NNOITRA_GOLD.core, body: NNOITRA_GOLD.body, rim: NNOITRA_GOLD.rim, range: 100, track: 1.2, gain: 1.2 }));
    g.sfx.play('charge', f.center(), 0.8);
  }

  radar(): void {
    const { f, g } = this;
    const t = this.target();
    if (!t) return;
    const from = sock(f, 'palm.L');
    const gy = groundAt(g, from.x, from.y + 0.5, from.z, 3) ?? f.pos.y;
    g.addProjectile(new RadarTrail(g, new THREE.Vector3(from.x, gy, from.z), t, () => {
      this.marked = t;
      this.markT = 8;
      if (f === g.player) g.hud?.showBanner(`${t.name}: ${Math.round(t.hp)} / ${t.maxHp} — read`);
      g.sfx.play('ting', t.center(), 0.7);
    }));
  }

  patchOff(): void {
    if (this.form !== 'sealed') return;
    this.form = 'patch';
    this.rebuild();
    this.f.aura.flare(1.3, 0.4);
    this.g.sfx.play('flare', this.f.center(), 0.6);
  }

  private rebuild(): void {
    const f = this.f;
    const thrown = this.away !== null;
    f.setForm({ asset: nnoitraAsset(this.form), props: this.form === 'santa' ? santaProps() : sealedProps() }, AURA_NNOITRA, this.form === 'santa' ? BLADE_SCYTHE : BLADE_TERESA);
    this.tip = null;
    this.hands();
    this.tongue(false);
    if (thrown) {
      const prop = f.visual.props.get('sword');
      if (prop) prop.visible = false;
    }
  }

  becomeSanta(): void {
    const { f, g } = this;
    if (this.form === 'santa') return;
    this.form = 'santa';
    this.away = null;
    f.def = { ...f.def, stance: SANTA_STANCE, blade: BLADE_SCYTHE };
    this.rebuild();
    this.makeChain();
    this.ensureExtras();
    f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.3);
    f.aura.flare(1.8, 0.6);
    g.shake(f === g.player ? 0.45 : 0.15);
    const c = f.center();
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: Math.cos(a) * 6, vy: (Math.random() - 0.2) * 5, vz: Math.sin(a) * 6, size: 0.3, sizeEnd: 0.05, life: 0.5, r: 1, g: 0.86, b: 0.3, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, drag: 2 });
    }
    this.applyStats();
  }

  throwScythe(): void {
    const { f, g } = this;
    const p = sock(f, 'grip.R');
    const dir = this.aim().sub(p).normalize();
    g.addProjectile(new FlyingScythe(g, f, p, dir, 34 * f.power));
    const prop = f.visual.props.get('sword');
    if (prop) prop.visible = false;
    g.sfx.play('swingHeavy', p, 0.9);
  }

  regrowScythe(): void {
    const { f, g } = this;
    const prop = f.visual.props.get('sword');
    if (!prop || prop.visible) return;
    prop.visible = true;
    f.bladeValid = false;
    const p = sock(f, 'grip.R');
    for (let i = 0; i < 10; i++) g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5) * 3, vy: Math.random() * 2, vz: (Math.random() - 0.5) * 3, size: 0.16, sizeEnd: 0.03, life: 0.35, r: 1, g: 0.9, b: 0.5, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  }

  /** Sonído straight into the target's face */
  lunge(t: Fighter): void {
    const { f, g } = this;
    const from = f.pos.clone();
    _v.subVectors(t.pos, from).setY(0);
    const d = _v.length();
    if (d < 2.5) return;
    _v.normalize();
    // the nearest free spot in front of the target (a wall or a tree may stand in the first)
    let to: THREE.Vector3 | null = null;
    for (const back of [1.8, 2.4, 3.2]) {
      const p = t.pos.clone().addScaledVector(_v, -back);
      const gy = groundAt(g, p.x, p.y + 1, p.z, 6);
      if (gy !== null) p.y = gy;
      if (!f.body.overlaps(p.x, p.y + 0.05, p.z)) {
        to = p;
        break;
      }
    }
    if (!to) return;
    f.ghosts.spawn(1.2, 1);
    f.body.pos.copy(to);
    f.body.prev.copy(to);
    f.renderPos.copy(to);
    f.yaw = Math.atan2(t.pos.x - to.x, t.pos.z - to.z);
    g.onDash(f);
    g.sfx.play('shunpo', f.center(), 1);
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
    if (f.busy || this.away) return;
    if (this.g.time - this.lastEnd > 0.7) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const list = this.form === 'santa' ? SANTA_CHAIN : NNOITRA_CHAIN;
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    this.lastEnd = this.g.time + 0.7;
    this.f.act(new CutAction(this, list[idx], idx, idx === list.length - 1), true);
  }

  heavy(): void {
    if (this.away) return;
    this.special(new HeavyAction(this), 14, 'heavy', this.form === 'santa' ? 3 : 3.4);
  }

  /** Q: the chain throw (again: the yank) / a scythe thrown. */
  skill1(): void {
    const cur = this.f.action;
    if (cur instanceof ThrowAction) {
      cur.yank();
      return;
    }
    if (this.form === 'santa') this.special(new VolleyAction(this), 14, 'volley', 2.2);
    else this.special(new ThrowAction(this), 16, 'throw', 3);
  }

  /** E: the whirl / the tongue Cero. */
  skill2(): void {
    if (this.form === 'santa') this.special(new CeroAction(this), 30, 'cero', 6);
    else if (!this.away) this.special(new WhirlAction(this), 24, 'whirl', 7);
  }

  /** R: the tongue Cero / regeneration. */
  skill3(): void {
    if (this.form === 'santa') this.special(new RegenAction(this), 30, 'regen', 18);
    else if (!this.away) this.special(new CeroAction(this), 30, 'cero', 6);
  }

  /** G: the eyepatch off / Indice Radar. */
  toggle(): void {
    const f = this.f;
    if (this.form === 'sealed') {
      if (f.busy || this.away) return;
      f.act(new PatchAction(this), true);
      return;
    }
    if (!this.away) this.special(new RadarAction(this), 10, 'radar', 10);
  }

  release(): void {
    const { f, g } = this;
    if (this.form === 'santa') {
      this.special(new SeisAction(this, this.target()), 60, 'seis', 16);
      return;
    }
    if (f.busy || this.away) return;
    if (!f.spendRei(40)) {
      if (f === g.player) g.hud?.showBanner('Not enough reiatsu');
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

  private applyStats(): void {
    const f = this.f;
    const santa = this.form === 'santa', patch = this.form === 'patch';
    const read = this.markT > 0 && this.marked !== null && !this.marked.dead;
    f.power = (santa ? 1.2 : patch ? 1.06 : 1) * (read ? 1.2 : 1) * (this.flare ? 1.25 : 1);
    f.damageTaken = santa ? 0.9 : 1;
    f.aura.target = this.flare ? 1 : santa ? 0.24 : patch ? 0.12 : 0.06;
  }

  formName(): string {
    const read = this.markT > 0 && this.marked ? ` · ${this.marked.name} read` : '';
    if (this.form === 'santa') return `Resurrección — Santa Teresa${read}`;
    return `Quinto Espada${this.form === 'patch' ? ' · the eyepatch off' : ''}${read}`;
  }

  ai(): KitAI {
    const sealed = () => this.form !== 'santa', santa = () => this.form === 'santa';
    const kit = this;
    return {
      // the scythes are shorter than Santa Teresa on its haft: he closes in further once released
      get reach() {
        return kit.form === 'santa' ? 2 : 2.6;
      },
      chain: 4,
      releaseAt: [0.5],
      toggleAt: 0.8,
      toggleOn: () => this.form !== 'sealed',
      moves: [
        { name: 'smash', use: () => this.heavy(), min: 0, max: 4, weight: 1.1, cd: 3, when: sealed },
        { name: 'throw', use: () => this.skill1(), min: 6, max: 24, weight: 1.3, cd: 4, when: sealed },
        { name: 'whirl', use: () => this.skill2(), min: 0, max: 5, weight: 0.8, cd: 8, when: sealed },
        { name: 'cero', use: () => (santa() ? this.skill2() : this.skill3()), min: 7, max: 45, weight: 1, cd: 7 },
        { name: 'radar', use: () => this.toggle(), min: 8, max: 60, weight: 0.5, cd: 14, when: () => this.form !== 'sealed' && this.markT <= 0 },
        { name: 'cross', use: () => this.heavy(), min: 0, max: 3.4, weight: 1.3, cd: 3, when: santa },
        { name: 'volley', use: () => this.skill1(), min: 6, max: 30, weight: 1.1, cd: 3, when: santa },
        { name: 'regen', use: () => this.skill3(), min: 0, max: 80, weight: 3, cd: 18, when: () => santa() && this.f.hp < this.f.maxHp * 0.45 },
        { name: 'seis', use: () => this.release(), min: 3, max: 16, weight: 1.2, cd: 16, when: () => santa() && this.f.rei >= 60 },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd, list: AbilityInfo[] = [];
    if (this.form === 'santa') {
      list.push(
        { key: 'LMB', name: 'Four scythes', kanji: '螳' },
        { key: 'RMB', name: 'Mantis Cross', kanji: '十字', cost: 14, cd: cd.heavy, cdMax: 3 },
        { key: 'Q', name: 'Scythe throw', kanji: '鎌', cost: 14, cd: cd.volley, cdMax: 2.2 },
        { key: 'E', name: 'Cero', kanji: '虚閃', cost: 30, cd: cd.cero, cdMax: 6 },
        { key: 'R', name: 'Regeneration', kanji: '再生', cost: 30, cd: cd.regen, cdMax: 18, active: this.regenT > 0 },
        { key: 'Shift', name: 'Sonído', kanji: '響転' },
        { key: 'G', name: 'Indice Radar', kanji: '捜指法', cost: 10, cd: cd.radar, cdMax: 10, active: this.markT > 0 },
        { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
        { key: 'F', name: 'Seis Guadañas', kanji: '六鎌', cost: 60, cd: cd.seis, cdMax: 16 },
      );
      return list;
    }
    list.push(
      { key: 'LMB', name: 'Santa Teresa', kanji: '聖' },
      { key: 'RMB', name: 'Crescent Smash', kanji: '砕', cost: 14, cd: cd.heavy, cdMax: 3.4 },
      { key: 'Q', name: this.away ? 'Yank' : 'Chain throw', kanji: '鎖', cost: 16, cd: cd.throw, cdMax: 3, active: this.away !== null },
      { key: 'E', name: 'Whirl', kanji: '旋', cost: 24, cd: cd.whirl, cdMax: 7 },
      { key: 'R', name: 'Cero', kanji: '虚閃', cost: 30, cd: cd.cero, cdMax: 6 },
      { key: 'Shift', name: 'Sonído', kanji: '響転' },
      this.form === 'sealed' ? { key: 'G', name: 'Eyepatch', kanji: '眼帯' } : { key: 'G', name: 'Indice Radar', kanji: '捜指法', cost: 10, cd: cd.radar, cdMax: 10, active: this.markT > 0 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      { key: 'F', name: 'Santa Teresa', kanji: '聖哭螳螂', cost: 40 },
    );
    return list;
  }
}
