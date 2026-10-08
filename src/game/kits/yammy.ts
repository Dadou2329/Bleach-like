// Yammy Llargo's kit (docs/kits/yammy.md). Sealed Diez: a brawler whose every blow cracks the ground, Bala strings
// from the fists, the mouth Cero that tears a fissure, Gonzui (the great breath that pulls people in and eats weak
// souls), the limb rip, the Hierro brace; asleep on his feet when left alone, banking reiatsu and rage. F:
// "Buchikirero, Ira!" — the kaiju centaur that tramples through the town and keeps growing as its rage climbs: giant
// punches with the elbow piston's second impact, the tail club, the giant Bala and the swept Cero, Cero Oscuras (shot
// while it charges, it blows up in his face), the stomp quake, the shield and its burst. A full meter: the rage
// evolution into the ape. Poor Pesquisa: his skills fly where he faces.
import * as THREE from 'three';
import { FighterAction, type Fighter, type FighterDef } from '../fighter';
import type { DamageOpts, Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import type { StanceDef } from '../../anim/locomotion';
import type { ClipDef } from '../../anim/clip';
import { yammyAsset, yammyProp, type YammyForm } from '../../chars/yammy';
import { APE_CHAIN, APE_CLIPS, APE_STANCE, IRA_CHAIN, IRA_CLIPS, IRA_STANCE, YAMMY_CHAIN, YAMMY_CLIPS, YAMMY_STANCE } from '../../chars/yammyClips';
import { CeroBeam } from '../projectiles/cero';
import { BalaShot } from '../projectiles/bala';
import { CapsuleShape, SphereShape } from '../../destruction/shapes';
import { TEX_GLOW, TEX_PUFF, TEX_RING, TEX_STREAK } from '../../vfx/sprites';
import type { AuraStyle } from '../../vfx/aura';
import { BALA_RED, Fissure, IRA_REIATSU, IraShell, OSCURAS, oscurasBackfire, rageBurst, soulWisps, YAMMY_CERO } from '../../vfx/ira';

export const AURA_YAMMY: AuraStyle = { core: '#FFC9A8', body: '#E0482A', rim: '#7E1E12' };
export const AURA_IRA: AuraStyle = IRA_REIATSU;

interface FormSpec {
  /** hurt capsule and collision box at ×1 (m), the step a stride climbs */
  height: number;
  radius: number;
  hw: number;
  h: number;
  stepUp: number;
  power: number;
  taken: number;
  /** Hierro: blows weaker than this barely scratch */
  tough: number;
  speed: FighterDef['speed'];
  stance: StanceDef;
  clips: ClipDef[];
  chain: string[];
  /** how much he grows over a full rage meter */
  grow: number;
}

const FORMS: Record<YammyForm, FormSpec> = {
  sealed: { height: 2.3, radius: 0.55, hw: 0.32, h: 2.2, stepUp: 0.7, power: 1, taken: 0.85, tough: 18, speed: { run: 8, sprint: 15, jump: 10, dash: 8.5, dashTime: 0.13 }, stance: YAMMY_STANCE, clips: YAMMY_CLIPS, chain: YAMMY_CHAIN, grow: 0 },
  ira: { height: 11, radius: 3.6, hw: 0.6, h: 2.4, stepUp: 2.6, power: 1.15, taken: 0.7, tough: 26, speed: { run: 7, sprint: 12, jump: 0, dash: 15, dashTime: 0.55 }, stance: IRA_STANCE, clips: IRA_CLIPS, chain: IRA_CHAIN, grow: 0.45 },
  ape: { height: 15, radius: 5, hw: 0.7, h: 2.6, stepUp: 3.2, power: 1.35, taken: 0.6, tough: 30, speed: { run: 8.5, sprint: 15, jump: 0, dash: 19, dashTime: 0.55 }, stance: APE_STANCE, clips: APE_CLIPS, chain: APE_CHAIN, grow: 0.3 },
};

/** the giants' clip names (the ape has its own versions of Ira's moves) */
const GIANT_CLIP: Record<'ira' | 'ape', { bala: string; cero: string; oscuras: string; stomp: string; shield: string; roar: string }> = {
  ira: { bala: 'yi_bala', cero: 'yi_cero', oscuras: 'yi_oscuras', stomp: 'yi_stomp', shield: 'yi_shield', roar: 'yi_roar' },
  ape: { bala: 'ya_bala', cero: 'ya_cero', oscuras: 'ya_oscuras', stomp: 'ya_stomp', shield: 'ya_shield', roar: 'ya_roar' },
};

export const YAMMY_DEF: FighterDef = {
  id: 'yammy',
  name: 'Yammy Llargo',
  title: 'Diez Espada',
  build: () => ({ asset: yammyAsset('sealed'), props: [{ key: 'sheath', model: yammyProp('sheath'), socket: 'hip.L' }] }),
  stance: YAMMY_STANCE,
  clips: YAMMY_CLIPS,
  aura: AURA_YAMMY,
  hp: 1400,
  rei: 160,
  speed: { ...FORMS.sealed.speed },
  radius: FORMS.sealed.radius,
  height: FORMS.sealed.height,
};

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _u = new THREE.Vector3();

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

function boneAt(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  if (f.visual.rig.index(name) < 0) return f.center(out);
  const b = f.visual.rig.bone(name);
  b.updateWorldMatrix(true, false);
  return b.getWorldPosition(out);
}

/** distance from p to the surface of o's hurt capsule */
function capsuleGap(o: Fighter, p: THREE.Vector3): number {
  const cy = Math.max(o.pos.y + 0.2, Math.min(o.pos.y + o.def.height - 0.2, p.y));
  return Math.hypot(o.pos.x - p.x, cy - p.y, o.pos.z - p.z) - o.def.radius;
}

/** distance from the segment a→b to o's hurt capsule (sampled) */
function segmentGap(o: Fighter, a: THREE.Vector3, b: THREE.Vector3): number {
  let best = Infinity;
  for (let i = 0; i <= 6; i++) best = Math.min(best, capsuleGap(o, _u.lerpVectors(a, b, i / 6)));
  return best;
}

function setFists(f: Fighter, fist: boolean): void {
  const rig = f.visual.rig;
  for (const s of ['L', 'R']) {
    if (rig.index(`fist.${s}`) < 0 || rig.index(`palm.${s}`) < 0) continue;
    rig.setBoneVisible(`fist.${s}`, fist);
    rig.setBoneVisible(`palm.${s}`, !fist);
  }
}

// ------------------------------------------------------------------------------------------------ blows

interface Blow {
  dmg: number;
  knock: number;
  launch?: number;
  heavy?: boolean;
  hitstop?: number;
  shake?: number;
  /** what lands: a fist, both, the shoulder, the tail club, the belly */
  by: 'R' | 'L' | 'both' | 'shoulder' | 'tail' | 'belly';
  /** strike radius (m at ×1) */
  r: number;
  lunge: number;
  /** sealed: the strike point in front (reach, height in m) */
  reach?: [number, number];
  /** world smash where it lands [radius, power] (×size) */
  smash?: [number, number];
  /** a crater in the ground under it [radius, power] (×size) */
  ground?: [number, number];
  /** Ira: the elbow piston's second impact [damage, radius] */
  piston?: [number, number];
}

const BLOWS: Record<string, Blow> = {
  yy_s1: { by: 'R', dmg: 34, knock: 9, launch: 1, r: 0.95, lunge: 5, reach: [1.45, 1.5], smash: [0.6, 70], hitstop: 0.06, shake: 0.2 },
  yy_s2: { by: 'L', dmg: 30, knock: 11, launch: 2, r: 0.95, lunge: 4, reach: [1.4, 1.5], smash: [0.6, 70], hitstop: 0.06, shake: 0.2 },
  yy_s3: { by: 'both', dmg: 36, knock: 4, launch: 8, heavy: true, r: 1.25, lunge: 3, reach: [1.3, 0.5], ground: [1.5, 150], hitstop: 0.09, shake: 0.45 },
  yy_s4: { by: 'shoulder', dmg: 40, knock: 26, launch: 6, heavy: true, r: 1.3, lunge: 10, reach: [1.1, 1.4], smash: [1.1, 130], hitstop: 0.1, shake: 0.5 },
  yi_s1: { by: 'R', dmg: 90, knock: 18, launch: 5, heavy: true, r: 2.6, lunge: 4, smash: [2, 380], ground: [2.2, 300], piston: [60, 3.2], hitstop: 0.1, shake: 0.6 },
  yi_s2: { by: 'L', dmg: 90, knock: 18, launch: 5, heavy: true, r: 2.6, lunge: 4, smash: [2, 380], ground: [2.2, 300], piston: [60, 3.2], hitstop: 0.1, shake: 0.6 },
  yi_s3: { by: 'both', dmg: 110, knock: 10, launch: 9, heavy: true, r: 3.2, lunge: 3, smash: [2.4, 420], ground: [3.2, 420], piston: [70, 4], hitstop: 0.12, shake: 0.8 },
  yi_s4: { by: 'tail', dmg: 110, knock: 30, launch: 7, heavy: true, r: 8, lunge: 0, smash: [2.6, 360], hitstop: 0.12, shake: 0.7 },
  // the ape's knuckles come down out to his sides: the shock of each slam spreads wide
  ya_s1: { by: 'R', dmg: 120, knock: 14, launch: 8, heavy: true, r: 5.4, lunge: 5, ground: [3.4, 460], hitstop: 0.12, shake: 0.8 },
  ya_s2: { by: 'L', dmg: 120, knock: 14, launch: 8, heavy: true, r: 5.4, lunge: 5, ground: [3.4, 460], hitstop: 0.12, shake: 0.8 },
  ya_s3: { by: 'both', dmg: 150, knock: 12, launch: 10, heavy: true, r: 6, lunge: 4, ground: [4.2, 520], hitstop: 0.14, shake: 0.9 },
  ya_s4: { by: 'belly', dmg: 170, knock: 26, launch: 9, heavy: true, r: 8, lunge: 8, ground: [6, 560], hitstop: 0.16, shake: 1 },
};

/** One blow of the light string: lunge, land at the 'hit' event (the piston at 'piston'), chain on input. */
class BlowAction extends FighterAction {
  readonly name: string;
  private spec: Blow;
  private hits = new Set<number>();
  private pistonHits = new Set<number>();
  private dur = 0;
  private comboAt = 0;
  private hitAt = 0;
  private pistonAt = -1;
  private struck = false;
  private pistoned = false;
  private landed: THREE.Vector3[] = [];
  queued = false;

  constructor(readonly kit: YammyKit, readonly clip: string, readonly index: number) {
    super();
    this.name = clip;
    this.spec = BLOWS[clip];
    this.mobility = kit.giant ? 0.05 : 0.12;
    this.airGravity = 0.3;
  }

  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    this.hitAt = c.events.hit ?? this.dur * 0.4;
    this.pistonAt = this.spec.piston ? c.events.piston ?? this.hitAt + 0.16 : -1;
    setFists(f, true);
    f.anim.play(this.clip);
    const k = this.kit.size;
    const tgt = f.faceTarget;
    const gap = tgt ? Math.max(0, Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z) - (this.kit.giant ? 6 * k : 1.6)) : 0;
    f.push.addScaledVector(f.forward(), (this.spec.lunge + Math.min(5, gap) * 1.6) * (this.kit.giant ? Math.sqrt(k) : 1));
    g.sfx.play(this.spec.dmg >= 36 ? 'swingHeavy' : 'swing', f.center(), this.kit.giant ? 1.6 : 0.9);
  }

  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.struck && this.t >= this.hitAt) {
      this.struck = true;
      this.landed = this.kit.land(this.spec, this.hits);
    }
    if (this.pistonAt >= 0 && !this.pistoned && this.t >= this.pistonAt) {
      this.pistoned = true;
      this.kit.piston(this.spec, this.landed, this.pistonHits);
    }
    if (this.queued && this.t >= this.comboAt) {
      this.done = true;
      this.kit.chain(this.index + 1);
      return;
    }
    if (this.t >= this.dur) this.done = true;
  }

  override canCancel(next: FighterAction): boolean {
    if (next.name === 'dash' || next instanceof SkillAction) return this.t >= this.hitAt + 0.05;
    return false;
  }
}

/** Base for the specials (so a string can cancel into them). */
abstract class SkillAction extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: YammyKit) {
    super();
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= this.dur) this.done = true;
  }
}

/** Bala: red bullets off alternating fists, one at each 'bN' event (sealed: six small; the giants: four the size of cars). */
class BalaAction extends SkillAction {
  readonly name = 'bala';
  private fired = 0;
  private times: number[] = [];
  constructor(kit: YammyKit, readonly clip: string, readonly n: number) {
    super(kit);
    this.mobility = kit.giant ? 0.05 : 0.25;
    this.airGravity = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    for (let i = 0; i < this.n; i++) this.times.push(c.events[`b${i}`] ?? 0.1 + i * 0.1);
    setFists(f, true);
    f.anim.play(this.clip);
    if (this.kit.giant) g.callout('虚弾', 'BALA', '#ff6a50');
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    while (this.fired < this.n && this.t >= this.times[this.fired]) {
      const k = this.kit;
      const o = sock(f, this.fired % 2 === 0 ? 'grip.R' : 'grip.L');
      const dir = k.aim(o).sub(o).normalize();
      if (k.giant) {
        o.addScaledVector(dir, 1.2 * k.size);
        g.addProjectile(new BalaShot(f, g, o, dir, 70, 52, 110, BALA_RED, { size: 5.2 * k.size }));
        g.shake(f === g.player ? 0.25 : 0.1);
      } else g.addProjectile(new BalaShot(f, g, o, dir, 14, 78, 60, BALA_RED));
      g.sfx.play(k.giant ? 'impact' : 'shunpo', o, k.giant ? 1.2 : 0.55);
      this.fired++;
    }
  }
}

/**
 * Cero: charged in front of his mouth. Sealed: a red beam that tears a fissure along the ground; the giants: a huge
 * beam swept across what is in front of him.
 */
class CeroAction extends SkillAction {
  readonly name = 'cero';
  private beam: CeroBeam | null = null;
  constructor(kit: YammyKit, readonly clip: string) {
    super(kit);
    this.mobility = 0;
    this.armor = kit.giant ? 0.4 : 0.25;
    this.trackTarget = !kit.giant;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    const fireAt = c.events.fire ?? 0.4;
    const k = this.kit;
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n === 'fire') g.sfx.play('beam', f.center(), k.giant ? 1.8 : 1);
      },
    });
    const mouth = k.muzzle(k.giant ? 1.2 : 0.45);
    g.callout('虚閃', 'CERO', '#ff4a5a');
    g.sfx.play('charge', f.center(), k.giant ? 1 : 0.6);
    if (!k.giant) {
      const aim = k.aim(sock(f, 'mouth'));
      this.beam = new CeroBeam(g, f, mouth, () => aim, { charge: fireAt, fire: 0.5, radius: 0.55, damage: 110, power: 300, ...YAMMY_CERO, range: 40, track: 0.4, gain: 1.5 });
      g.addProjectile(this.beam);
      // the fissure opens under the beam as it fires
      k.after(fireAt, () => {
        if (f.dead) return;
        const from = f.pos.clone().addScaledVector(f.forward(), 1.6);
        const to = aim.clone().setY(f.pos.y);
        const dir = to.clone().sub(from).setY(0);
        const len = Math.min(26, Math.max(6, dir.length() + 4));
        if (dir.lengthSq() < 0.01) f.forward(dir);
        g.addProjectile(new Fissure(g, f, from, dir.normalize(), len, 260, 40));
      });
      return;
    }
    // the giant Cero: swept 50° across what is in front of him over a second
    const fw = f.forward();
    const from = sock(f, 'mouth');
    const target = k.aim(from);
    const reach = Math.max(18, Math.min(70, Math.hypot(target.x - f.pos.x, target.z - f.pos.z)));
    const drop = from.y - target.y;
    const start = g.time + fireAt;
    const tgt = new THREE.Vector3();
    const aim = () => {
      const u = Math.max(0, Math.min(1, (g.time - start) / 1.0));
      const a = (-25 + 50 * u) * (Math.PI / 180);
      const d = _w.copy(fw).applyAxisAngle(_v.set(0, 1, 0), a);
      return tgt.copy(f.pos).addScaledVector(d, reach).setY(f.pos.y + from.y - f.pos.y - drop);
    };
    // a swept beam crosses a single target for a tick or two: each tick is heavy
    this.beam = new CeroBeam(g, f, mouth, aim, { charge: fireAt, fire: 1.05, radius: 2 * k.size, damage: 420, power: 620, ...YAMMY_CERO, range: 160, track: 1.4, gain: 1.4 });
    g.addProjectile(this.beam);
    f.aura.flare(1.6, fireAt + 1);
  }
}

/** Cero Oscuras: the black orb swells before his mouth (a strong shot into it blows it up in his face), then the beam. */
class OscurasAction extends SkillAction {
  readonly name = 'oscuras';
  beam: CeroBeam | null = null;
  fireAt = 1.5;
  constructor(kit: YammyKit, readonly clip: string) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.4;
    this.trackTarget = false;
  }
  get charging(): boolean {
    return this.t < this.fireAt;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.fireAt = c.events.fire ?? 1.5;
    const k = this.kit;
    f.anim.play(this.clip, { onEvent: (n) => { if (n === 'fire') g.sfx.play('beam', f.center(), 2); } });
    const mouth = k.muzzle(1.9);
    const from = sock(f, 'mouth');
    const fw = f.forward();
    const t0 = k.aim(from);
    // where he faces as he charges, at the height of what he was looking at
    const aim = () => _w.copy(f.pos).addScaledVector(f.forward(_v), Math.max(25, Math.hypot(t0.x - f.pos.x, t0.z - f.pos.z))).setY(t0.y);
    void fw;
    this.beam = new CeroBeam(g, f, mouth, aim, { charge: this.fireAt, fire: 0.9, radius: 2.2 * k.size, damage: 420, power: 900, core: OSCURAS.core, body: OSCURAS.body, rim: OSCURAS.rim, dark: OSCURAS.dark, range: 200, track: 0.3, gain: 1.2 });
    g.addProjectile(this.beam);
    g.callout('黒虚閃', 'CERO OSCURAS', '#c01828');
    g.sfx.play('charge', from, 1.4);
    f.aura.flare(2, this.fireAt + 0.8);
  }
  override end(): void {
    if (this.kit.oscuras === this) this.kit.oscuras = null;
  }
}

/** Gonzui: one huge breath in. Whoever is in front is pulled toward him; weak Hollows' souls are sucked out. */
class GonzuiAction extends SkillAction {
  readonly name = 'gonzui';
  private from = 0.25;
  private until = 1.3;
  private eaten = new Map<number, number>();
  private fed = false;
  constructor(kit: YammyKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.3;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('yy_gonzui')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.from = c.events.inhale ?? 0.25;
    f.anim.play('yy_gonzui');
    g.callout('魂吸', 'GONZUI', '#dde8f2');
    g.sfx.play('torrent', f.center(), 0.9);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t < this.from || this.t > this.until) return;
    const mouth = sock(f, 'mouth');
    const fw = f.forward(_w);
    // the air itself streams in
    soulWisps(g, mouth.clone().addScaledVector(fw, 7).setY(f.pos.y + 1.2), mouth, 5, 10);
    if (Math.random() < 0.25) g.engine.glow.spawn({ x: mouth.x, y: mouth.y, z: mouth.z, size: 1.4, sizeEnd: 0.1, life: 0.35, r: 0.86, g: 0.91, b: 0.95, alpha: 0.5, alphaEnd: 0, tex: TEX_RING });
    for (const o of g.enemiesOf(f)) {
      _v.subVectors(o.pos, f.pos).setY(0);
      const d = _v.length();
      if (d > 14 || d < 0.01 || _v.normalize().dot(fw) < 0.34) continue;
      const weak = o.def.id === 'hollow' || o.maxHp <= 400;
      if (weak) {
        // the soul is drawn out of it and swallowed
        const held = (this.eaten.get(o.id) ?? 0) + dt;
        this.eaten.set(o.id, held);
        soulWisps(g, o.center(), mouth, 2, o.def.radius * 2);
        o.push.addScaledVector(_v, -18 * dt);
        if (held > 0.45) {
          g.kill(o, f, _v.clone().negate());
          soulWisps(g, o.center(), mouth, 24, o.def.radius * 2.5);
          this.kit.feed(0.25);
        }
        continue;
      }
      // anyone with spiritual power resists it, but is dragged in all the same
      const pull = 46 * (1 - d / 16);
      o.push.addScaledVector(_v, -pull * dt);
      if (!o.grounded) o.body.vel.y = Math.min(o.body.vel.y, 1);
      g.drain(o, 10 * dt, f);
      if (Math.random() < 0.4) soulWisps(g, o.center(), mouth, 1, 0.6);
    }
    if (!this.fed && this.t > this.until - 0.05) {
      this.fed = true;
      f.rei = Math.min(f.maxRei, f.rei + 40);
      this.kit.addRage(10);
    }
  }
}

/** The grab: a lunge, his hand closing on whoever is in front; a catch becomes the tear. */
class GrabAction extends SkillAction {
  readonly name = 'grab';
  private tried = false;
  constructor(kit: YammyKit) {
    super(kit);
    this.mobility = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('yy_grab')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    setFists(f, false);
    f.anim.play('yy_grab');
    f.push.addScaledVector(f.forward(), 9);
    g.sfx.play('swing', f.center(), 0.9);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.tried || this.t < 0.18) return;
    this.tried = true;
    const fw = f.forward(_w);
    let best: Fighter | null = null, bd = 2.6;
    for (const o of g.enemiesOf(f)) {
      _v.subVectors(o.pos, f.pos);
      const dy = _v.y;
      _v.y = 0;
      const d = _v.length() - o.def.radius;
      if (d > bd || Math.abs(dy) > 1.8 || (d > 0.3 && _v.normalize().dot(fw) < 0.4) || o.invuln > 0 || o.action?.invulnerable) continue;
      bd = d;
      best = o;
    }
    if (best && !best.def.boss && best.def.height < 4) {
      this.done = true;
      f.act(new RipAction(this.kit, best), true);
    }
  }
  override end(f: Fighter): void {
    setFists(f, true);
  }
}

/** The tear: held up by the arm, then the wrench. Big damage, and their weapon arm is useless for a while. */
class RipAction extends SkillAction {
  readonly name = 'rip';
  private ripped = false;
  constructor(kit: YammyKit, readonly victim: Fighter) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.5;
    this.dur = 1.35;
  }
  override start(f: Fighter, g: Game): void {
    setFists(f, false);
    f.anim.play('yy_rip', { speed: 0.6 });
    g.sfx.play('hitHeavy', this.victim.center(), 0.8);
    g.hitstop(0.06);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const o = this.victim;
    if (!this.ripped) {
      if (o.dead) {
        this.done = true;
        return;
      }
      // dangling from his hand
      const h = sock(f, 'grip.R');
      o.body.pos.set(h.x, Math.max(f.pos.y, h.y - o.def.height * 0.8), h.z);
      o.body.vel.set(0, 0, 0);
      o.push.set(0, 0, 0);
      o.hitstun = Math.max(o.hitstun, 0.3);
      o.stopAction();
      if (this.t >= 0.7) {
        this.ripped = true;
        const boss = o.def.boss || o.maxHp >= 3000;
        const dir = f.forward().addScaledVector(_v.set(0, 1, 0), 0.3).normalize();
        g.damage(o, boss ? 60 : 120, f, dir, { knock: 16, launch: 6, heavy: true, hitstop: 0.14, shake: 0.6, unblockable: true });
        o.disarmT = Math.max(o.disarmT, boss ? 1.5 : 6);
        g.sfx.play('crack', o.center(), 1.4);
        const p = o.center();
        for (let i = 0; i < 18; i++)
          g.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5) * 5, vy: Math.random() * 4, vz: (Math.random() - 0.5) * 5, size: 0.12, sizeEnd: 0.3, life: 0.6, r: 0.5, g: 0.04, b: 0.05, alpha: 0.9, alphaEnd: 0, tex: TEX_PUFF, gravity: -9 });
        g.callout('運', '¡SUERTE!', '#ffb070');
        if (f === g.player || o === g.player) g.shake(0.5);
      }
    }
  }
  override end(f: Fighter): void {
    setFists(f, true);
  }
}

/** The Hierro brace: the forearms up, the bulk behind them — super armour while it holds (G again lets go). */
class BraceAction extends SkillAction {
  readonly name = 'brace';
  constructor(kit: YammyKit) {
    super(kit);
    this.mobility = 0.25;
    this.armor = 0.8;
    this.dur = 3;
  }
  override start(f: Fighter, g: Game): void {
    setFists(f, true);
    f.anim.play('yy_brace', { hold: true });
    f.aura.flare(1.1, 0.4);
    g.sfx.play('flare', f.center(), 0.5);
  }
  override end(f: Fighter): void {
    f.anim.stopAll(0.25);
  }
  override canCancel(next: FighterAction): boolean {
    return next.name !== 'brace';
  }
}

/** The reiatsu shield: wrapped in a shell for up to 3 s (damage ×0.2), then blown outward. */
class ShieldAction extends SkillAction {
  readonly name = 'shield';
  shell: IraShell | null = null;
  private burst = false;
  constructor(kit: YammyKit, readonly clip: string) {
    super(kit);
    this.mobility = 0.15;
    this.armor = 0.8;
    this.trackTarget = false;
    this.dur = 3;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play(this.clip, { hold: true });
    this.shell = new IraShell(g, f, () => f.def.height * 0.62);
    g.addProjectile(this.shell);
    g.sfx.play('flare', f.center(), 1.2);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= this.dur - 0.02) this.blow();
  }
  /** G again (or the time running out): the shell is blown outward */
  blow(): void {
    if (this.burst) return;
    this.burst = true;
    this.done = true;
    if (this.shell) this.kit.shieldBurst(this.shell);
  }
  override end(f: Fighter): void {
    if (!this.burst) this.blow();
    f.anim.stopAll(0.3);
  }
}

/** The stomp quake (the ape: a ground pound): rings of upheaval running out from his front legs. */
class StompAction extends SkillAction {
  readonly name = 'stomp';
  private hits = new Set<number>();
  constructor(kit: YammyKit, readonly clip: string) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.anim.play(this.clip, { onEvent: (n) => { if (n === 'stomp') this.kit.quake(this.hits); } });
  }
}

/** a roar (after the release and the evolution): invulnerable while the new body settles */
class RoarAction extends SkillAction {
  readonly name = 'roar';
  constructor(kit: YammyKit, readonly clip: string) {
    super(kit);
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n !== 'roar') return;
        g.sfx.play('roarBig', f.center(), 1.6);
        for (let i = 0; i < 3; i++) setTimeout(() => g.addRing(f.center(), f.def.height * (0.9 + i * 0.5), IRA_REIATSU.body, 0.5), i * 120);
        if (g.player && g.player.pos.distanceTo(f.pos) < 80) g.shake(0.7);
      },
    });
  }
}

/** "Buchikirero, Ira!": the reiatsu column, the sword gone, the body swelling into the kaiju. */
class ReleaseAction extends SkillAction {
  readonly name = 'release';
  constructor(kit: YammyKit) {
    super(kit);
    this.invulnerable = true;
    this.trackTarget = false;
    this.dur = 1.5;
  }
  override start(f: Fighter, g: Game): void {
    setFists(f, true);
    f.anim.play('yy_release', {
      onEvent: (n) => {
        if (n === 'name') {
          g.callout('ブチ切れろ「憤獣」', 'BUCHIKIRERO, IRA!', '#ff6a2a');
          g.sfx.play('roar', f.center(), 1.2);
          f.aura.flare(2, 1);
          f.aura.pillarBurst(2.6);
        }
        if (n === 'burst') this.kit.becomeGiant('ira');
      },
    });
  }
}

/** The rage evolution: an explosion of reiatsu, the body erupting into the ape, every wound healed. */
class EvolveAction extends SkillAction {
  readonly name = 'evolve';
  private burst = false;
  constructor(kit: YammyKit) {
    super(kit);
    this.invulnerable = true;
    this.trackTarget = false;
    this.dur = 0.8;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play(GIANT_CLIP.ira.roar);
    g.callout('憤怒', 'IRA — RAGE', '#ff5a1e');
    g.sfx.play('roarBig', f.center(), 1.8);
    f.aura.flare(2.4, 1.6);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.burst && this.t >= 0.66) {
      this.burst = true;
      this.done = true;
      this.kit.evolveBurst();
    }
  }
}

/** The AI's temper: an ally that hit him is swatted with a backhand. */
class SwatAction extends SkillAction {
  readonly name = 'swat';
  private struck = false;
  constructor(kit: YammyKit, readonly victim: Fighter) {
    super(kit);
    this.mobility = 0.1;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    const clip = this.kit.giant ? this.kit.chainList()[1] : 'yy_s2';
    const c = f.anim.clip(clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.yaw = Math.atan2(this.victim.pos.x - f.pos.x, this.victim.pos.z - f.pos.z);
    f.anim.play(clip);
    g.sfx.play('swingHeavy', f.center(), 0.9);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const o = this.victim;
    if (this.struck || this.t < 0.22 || o.dead) return;
    this.struck = true;
    if (o.pos.distanceTo(f.pos) < f.def.radius + o.def.radius + 3 * this.kit.size)
      g.damage(o, 60, f, _v.subVectors(o.pos, f.pos).setY(0.2).normalize().clone(), { knock: 22, launch: 5, heavy: true });
  }
}

// ------------------------------------------------------------------------------------------------ the kit

export class YammyKit implements Kit {
  form: YammyForm = 'sealed';
  /** current visual scale (the rage, or for the sealed body how well fed he is) */
  size = 1;
  /** 0..130: blows taken and souls eaten; it sets a giant's size, at 100 the evolution is ready, at 130 it happens */
  rage = 0;
  /** 0..1: sleep and food banked in the sealed body (it grows ×1.1 at most) */
  fed = 0;
  flare = false;
  comboIndex = 0;
  oscuras: OscurasAction | null = null;
  private lastSwingEnd = 0;
  private cd = { bala: 0, cero: 0, gonzui: 0, rip: 0, brace: 0, stomp: 0, oscuras: 0, shield: 0 };
  private timers: { t: number; fn: () => void }[] = [];
  private stance: StanceDef = { ...YAMMY_STANCE };
  private trampleT = 0;
  private trampled = new Map<number, number>();
  private charged = new Set<number>();
  private wasDashing = false;
  private dozing = false;
  private dozeT = 0;
  private annoyedBy: Fighter | null = null;
  private evolving = false;
  private lastPhase = 0;

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.def = { ...f.def, stance: this.stance, speed: { ...f.def.speed } };
    this.applyForm();
    setFists(f, true);
    f.onHurt = (amount) => {
      this.addRage(amount / 8);
      if (this.dozing) this.wake();
      this.dozeT = 0;
    };
    f.parry = (amount, from, o) => this.parry(amount, from, o);
  }

  get giant(): boolean {
    return this.form !== 'sealed';
  }

  chainList(): string[] {
    return FORMS[this.form].chain;
  }

  after(s: number, fn: () => void): void {
    this.timers.push({ t: s, fn });
  }

  /** an emitter `ahead` m (at ×1) in front of his mouth: the Cero orbs swell there, clear of his face */
  muzzle(ahead: number): THREE.Object3D {
    const s = this.f.visual.rig.sockets.get('mouth')!;
    let m = s.children.find((c) => c.userData.muzzle === ahead);
    if (!m) {
      m = new THREE.Object3D();
      m.userData.muzzle = ahead;
      m.position.set(0, 0, ahead);
      s.add(m);
    }
    return m;
  }

  // ---------------------------------------------------------------------------------------------- per step

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    for (let i = this.timers.length - 1; i >= 0; i--) {
      const tm = this.timers[i];
      tm.t -= dt;
      if (tm.t > 0) continue;
      this.timers.splice(i, 1);
      tm.fn();
    }
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    this.applySize(dt);
    this.camera(dt);
    if (f.dead) return;
    this.trample(dt);
    this.doze(dt);
    // the heavy Sonído lands with a crack
    if (this.wasDashing && f.dashT <= 0 && !this.giant && f.grounded) {
      g.engine.destruction.carve(new SphereShape(f.pos.clone(), 0.9, 0.5), { mode: 'smash', power: 70, impulse: 5, dust: 0.5 });
      g.addRing(f.pos.clone(), 2.2, AURA_YAMMY.body, 0.3);
    }
    if (f.dashT <= 0) this.charged.clear();
    this.wasDashing = f.dashT > 0;
    // a full meter overflowing: the evolution happens on its own
    if (this.form === 'ira' && this.rage >= 130 && !this.evolving && !f.action?.invulnerable) this.evolve(true);
    // the AI's temper
    if (this.annoyedBy && f !== g.player && !f.busy) {
      const o = this.annoyedBy;
      this.annoyedBy = null;
      if (!o.dead && o.pos.distanceTo(f.pos) < 6 + f.def.radius) f.act(new SwatAction(this, o), true);
    }
  }

  /** visual scale, hurt capsule, speeds and gait follow the size goal (rage for a giant, food for the sealed body) */
  private applySize(dt: number): void {
    const { f } = this;
    const F = FORMS[this.form];
    const goal = this.giant ? 1 + F.grow * Math.min(100, this.rage) / 100 : 1 + 0.1 * this.fed;
    this.size += (goal - this.size) * (1 - Math.exp(-2.4 * dt));
    const k = this.size;
    f.visual.object.scale.setScalar(k);
    f.def.height = F.height * k;
    f.def.radius = F.radius * k;
    const sp = f.def.speed;
    sp.run = F.speed.run * k;
    sp.sprint = F.speed.sprint * k;
    sp.dash = F.speed.dash * k;
    sp.jump = F.speed.jump;
    sp.dashTime = F.speed.dashTime;
    f.body.hw = F.hw;
    f.body.h = F.h;
    f.body.stepUp = F.stepUp * k;
    this.stance.speedScale = (F.stance.speedScale ?? 1) * k;
    this.stance.freqScale = (F.stance.freqScale ?? 1) / Math.sqrt(k);
    // stronger as he grows angrier
    f.power = F.power * (1 + 0.3 * Math.min(100, this.rage) / 100) * (this.flare ? 1.25 : 1);
  }

  /** a giant player: the camera pulls back and up */
  private camera(dt: number): void {
    const { f, g } = this;
    if (f !== g.player) return;
    const cam = g.cam;
    const H = f.def.height;
    const wantH = this.giant ? H * 0.62 : 2.0;
    const wantD = this.giant ? H * 1.9 : 5.2;
    const k = 1 - Math.exp(-3 * dt);
    cam.height += (wantH - cam.height) * k;
    cam.shoulder += ((this.giant ? H * 0.06 : 0.6) - cam.shoulder) * k;
    cam.maxDist = Math.max(14, wantD * 1.7);
    if (cam.dist < wantD) cam.dist += (wantD - cam.dist) * k;
  }

  /** The trample: the legs and the bulk crush what they wade through; the charge runs people down. */
  private trample(dt: number): void {
    const { f, g } = this;
    if (!this.giant) return;
    const k = this.size;
    const speed = Math.hypot(f.body.vel.x, f.body.vel.z);
    const charging = f.dashT > 0;
    // footprints where the feet come down
    const ph = f.anim.loco.phase;
    if (f.grounded && speed > 1 && ((this.lastPhase < 0.25 && ph >= 0.25) || (this.lastPhase < 0.75 && ph >= 0.75))) {
      for (const leg of ['foot.L', 'foot.R', 'ffoot.L', 'ffoot.R']) {
        const p = boneAt(f, leg, _v);
        if (p.y > f.pos.y + 1.2 * k) continue;
        p.y = f.pos.y;
        g.engine.destruction.carve(new SphereShape(p.clone(), 0.75 * k, 0.4), { mode: 'smash', power: 140, impulse: 4, dust: 0.7 });
      }
    }
    this.lastPhase = ph;
    this.trampleT -= dt;
    if (speed < 1 || this.trampleT > 0) return;
    this.trampleT = charging ? 0.08 : 0.15;
    const r = (charging ? 1.5 : 1.1) * k * (this.form === 'ape' ? 1.25 : 1);
    const power = charging ? 440 : 320;
    const floor = f.pos.y + r + 0.3;
    const pairs: [string, string][] = [['thigh.L', 'foot.L'], ['thigh.R', 'foot.R'], ['fthigh.L', 'ffoot.L'], ['fthigh.R', 'ffoot.R']];
    for (const [top, bottom] of pairs) {
      const a = boneAt(f, top, new THREE.Vector3()), b = boneAt(f, bottom, new THREE.Vector3());
      a.y = Math.max(a.y, floor);
      b.y = Math.max(b.y, floor);
      if (!this.solidNear(a, b, r)) continue;
      const res = g.engine.destruction.carve(new CapsuleShape(a, b, r), { mode: 'smash', power, impulse: 7, dust: 0.6 });
      if (res.removed > 200 && g.player && g.player.pos.distanceTo(f.pos) < 60) g.shake(0.1);
    }
    // the bulk shoulders through walls ahead of him
    const fw = f.forward(_w);
    const body = f.pos.clone().addScaledVector(fw, (this.form === 'ape' ? 3 : 2) * k);
    body.y += f.def.height * 0.5;
    const br = f.def.height * 0.3;
    if (this.solidNear(body, body, br)) g.engine.destruction.carve(new SphereShape(body, br, 0.7), { mode: 'smash', power, impulse: 8, dust: 0.5 });
    // underfoot: trampled; in the charge's path: run down
    for (const o of g.enemiesOf(f)) {
      const d = Math.hypot(o.pos.x - f.pos.x, o.pos.z - f.pos.z);
      if (o.pos.y > f.pos.y + f.def.height * 0.4) continue;
      if (charging && d < f.def.radius + o.def.radius + 1 && !this.charged.has(o.id)) {
        this.charged.add(o.id);
        g.damage(o, 50, f, _v.subVectors(o.pos, f.pos).setY(0).normalize().addScaledVector(fw, 0.6).normalize().clone(), { knock: 22, launch: 6, heavy: true, hitstop: 0.08, shake: 0.5 });
        continue;
      }
      if (d > f.def.radius * 0.9 + o.def.radius) continue;
      const last = this.trampled.get(o.id) ?? -9;
      if (g.time - last < 0.7) continue;
      this.trampled.set(o.id, g.time);
      g.damage(o, 18, f, _v.subVectors(o.pos, f.pos).setY(0).normalize().clone(), { knock: 12, launch: 3, hitstop: 0.03, shake: 0.2 });
    }
  }

  /** is anything solid inside the capsule a→b of radius r (a coarse sample, so empty air costs nothing)? */
  private solidNear(a: THREE.Vector3, b: THREE.Vector3, r: number): boolean {
    const w = this.g.engine.world, vs = w.vs;
    for (let i = 0; i <= 3; i++) {
      _u.lerpVectors(a, b, i / 3);
      for (const [dx, dy, dz] of [[0, 0, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, -1, 0], [0.7, 0.5, 0.7], [-0.7, 0.5, -0.7], [0.7, 0.5, -0.7], [-0.7, 0.5, 0.7]])
        if (w.isSolid(Math.floor((_u.x + dx * r * 0.85) / vs), Math.floor((_u.y + dy * r * 0.85) / vs), Math.floor((_u.z + dz * r * 0.85) / vs))) return true;
    }
    return false;
  }

  /** Asleep on his feet: nobody has hurt him for 10 s, he stands still, nobody is close — he banks reiatsu and rage. */
  private doze(dt: number): void {
    const { f, g } = this;
    if (this.giant) return;
    const still = !f.busy && Math.hypot(f.body.vel.x, f.body.vel.z) < 0.3 && f.grounded;
    const quiet = g.time - f.lastHurt.at > 10 && !g.nearestEnemy(f, 12);
    if (!still || !quiet) {
      if (this.dozing) this.wake();
      this.dozeT = 0;
      return;
    }
    this.dozeT += dt;
    if (!this.dozing && this.dozeT > 2.5) {
      this.dozing = true;
      f.anim.play('yy_doze');
    }
    if (!this.dozing) return;
    f.rei = Math.min(f.maxRei, f.rei + dt * 5);
    this.addRage(dt * 0.5);
    this.feed(dt * 0.02);
    if (Math.random() < dt * 0.6) {
      const p = sock(f, 'mouth');
      g.engine.glow.spawn({ x: p.x, y: p.y + 0.2, z: p.z, vx: 0.15, vy: 0.45, vz: 0.1, size: 0.06, sizeEnd: 0.14, life: 1.6, r: 0.85, g: 0.9, b: 1, alpha: 0.5, alphaEnd: 0, tex: TEX_GLOW });
    }
  }

  private wake(): void {
    this.dozing = false;
    this.dozeT = 0;
    if (!this.f.busy) this.f.anim.stopAll(0.25);
  }

  get asleep(): boolean {
    return this.dozing;
  }

  addRage(n: number): void {
    this.rage = Math.min(this.form === 'ape' ? 100 : 130, this.rage + n);
  }

  feed(n: number): void {
    this.fed = Math.min(1, this.fed + n);
  }

  /** Cero Oscuras charging: a strong shot into the orb blows it up in his face. Allies who hit him: remembered. */
  private parry(amount: number, from: Fighter | null, o: DamageOpts): boolean {
    const { f } = this;
    if (from && from !== f && from.team === f.team) this.annoyedBy = from;
    const os = this.oscuras;
    if (os && f.action === os && os.charging && o.energy && amount >= 60) {
      this.backfire(os);
      return true;
    }
    return false;
  }

  private backfire(os: OscurasAction): void {
    const { f, g } = this;
    this.oscuras = null;
    if (os.beam) os.beam.done = true;
    const at = sock(f, 'mouth');
    f.stopAction();
    oscurasBackfire(g, at, this.size * 1.4);
    g.sfx.play('explode', at, 2);
    g.callout('黒虚閃', 'BACKFIRE', '#ff7080');
    g.damage(f, 180, null, f.forward().negate(), { energy: true, heavy: true, unblockable: true, hitstop: 0.2, shake: 1 });
    f.hitstun = Math.max(f.hitstun, 1.5);
    if (g.player && g.player.pos.distanceTo(f.pos) < 120) g.shake(0.9);
    g.slowMo(0.4, 0.4);
  }

  // ---------------------------------------------------------------------------------------------- blows

  /**
   * Where his skills go (poor Pesquisa: no homing, no tracking): straight where he faces — at the height of whatever he
   * is turned toward, or the crosshair for a player with nothing locked.
   */
  aim(from: THREE.Vector3, out = new THREE.Vector3()): THREE.Vector3 {
    const { f, g } = this;
    const t = f.faceTarget;
    if (!t && f === g.player) return g.aimPoint(f, out);
    const d = t ? Math.max(4, Math.hypot(t.x - f.pos.x, t.z - f.pos.z)) : 40;
    out.copy(f.pos).addScaledVector(f.forward(_v), d);
    out.y = t ? t.y : from.y;
    return out;
  }

  /** A blow lands: hit whoever is in it, crack the world. Returns where it landed (for the piston). */
  land(s: Blow, hits: Set<number>): THREE.Vector3[] {
    const { f, g } = this;
    const k = this.giant ? this.size : 1;
    const fw = f.forward(new THREE.Vector3());
    const pts: THREE.Vector3[] = [];
    const strike = (a: THREE.Vector3, b: THREE.Vector3, r: number) => {
      for (const o of g.enemiesOf(f)) {
        if (hits.has(o.id) || segmentGap(o, a, b) > r) continue;
        hits.add(o.id);
        const dir = _v.subVectors(o.pos, f.pos).setY(0);
        if (dir.lengthSq() < 1e-4) dir.copy(fw);
        dir.normalize().multiplyScalar(0.7).addScaledVector(fw, 0.3).normalize();
        g.damage(o, s.dmg, f, dir.clone(), { knock: s.knock, launch: s.launch, heavy: s.heavy, hitstop: s.hitstop, shake: s.shake });
        g.sparks(o.center(), dir, AURA_IRA.body, 14);
      }
    };
    if (!this.giant) {
      // the sealed body: a point in front at the blow's height
      const [reach, h] = s.reach ?? [1.4, 1.4];
      const p = f.pos.clone().addScaledVector(fw, reach);
      p.y += h;
      strike(p, p, s.r);
      pts.push(p);
    } else if (s.by === 'tail') {
      // he wheels round on the spot and the club sweeps the whole circle
      const c = new THREE.Vector3(f.pos.x, f.pos.y, f.pos.z);
      for (const o of g.enemiesOf(f)) {
        if (hits.has(o.id)) continue;
        _v.subVectors(o.pos, c).setY(0);
        const d = _v.length();
        if (d > s.r * k + o.def.radius || o.pos.y > f.pos.y + f.def.height * 0.5) continue;
        if (d > 0.01) _v.normalize();
        else _v.copy(fw);
        hits.add(o.id);
        g.damage(o, s.dmg, f, _v.clone().setY(0.25).normalize(), { knock: s.knock, launch: s.launch, heavy: true, hitstop: s.hitstop, shake: s.shake });
      }
      const club = boneAt(f, 'tail2', new THREE.Vector3());
      pts.push(club);
    } else if (s.by === 'belly') {
      const c = boneAt(f, 'chest', new THREE.Vector3());
      const p = new THREE.Vector3(c.x, f.pos.y, c.z).addScaledVector(fw, 2 * k);
      strike(p, p.clone().setY(p.y + 4 * k), s.r * k);
      pts.push(p);
    } else {
      // the fists: the blow carries from the fist down to the ground under it
      const sides = s.by === 'both' ? ['R', 'L'] : s.by === 'shoulder' ? [] : [s.by];
      for (const side of sides) {
        const p = sock(f, `grip.${side}`, new THREE.Vector3());
        const low = p.clone().setY(Math.min(p.y, f.pos.y + 0.5));
        strike(p, low, s.r * k);
        pts.push(p);
      }
    }
    for (const p of pts) {
      if (s.smash) g.engine.destruction.carve(new SphereShape(p.clone(), s.smash[0] * k, 0.6), { mode: 'smash', power: s.smash[1], impulse: 6 + s.smash[1] * 0.04, dust: 0.6 });
      if (s.ground && f.grounded) {
        const gp = p.clone();
        gp.y = f.pos.y;
        if (!this.giant || p.y < f.pos.y + 4 * k) g.groundImpact(gp, s.ground[0] * k, s.ground[1], this.giant ? AURA_IRA.body : AURA_YAMMY.body, f);
      }
    }
    if (this.giant && g.player && g.player.pos.distanceTo(f.pos) < 90) g.shake(0.35);
    return pts;
  }

  /** the elbow piston fires: a second impact where the fist landed */
  piston(s: Blow, at: THREE.Vector3[], hits: Set<number>): void {
    const { f, g } = this;
    if (!s.piston) return;
    const k = this.size;
    const [dmg, r] = s.piston;
    for (const p of at) {
      for (const o of g.enemiesOf(f)) {
        if (hits.has(o.id) || capsuleGap(o, p.clone().setY(Math.min(p.y, o.pos.y + 1))) > r * k) continue;
        hits.add(o.id);
        g.damage(o, dmg, f, _v.subVectors(o.pos, p).setY(0.3).normalize().clone(), { knock: 14, launch: 4, heavy: true, hitstop: 0.06, shake: 0.4 });
      }
      g.engine.destruction.carve(new SphereShape(p.clone(), r * k * 0.6, 0.6), { mode: 'smash', power: 300, impulse: 10, dust: 0.6 });
      g.addRing(p.clone(), r * k * 1.6, AURA_IRA.core, 0.3);
      // the piston's exhaust
      for (const side of ['L', 'R']) {
        const e = boneAt(f, `forearm.${side}`, new THREE.Vector3());
        for (let i = 0; i < 6; i++)
          g.engine.dust.spawn({ x: e.x, y: e.y, z: e.z, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 2, vz: (Math.random() - 0.5) * 3, size: 0.6 * k, sizeEnd: 2 * k, life: 0.8, r: 0.85, g: 0.82, b: 0.8, alpha: 0.4, alphaEnd: 0, tex: TEX_PUFF, drag: 1.5 });
      }
    }
    g.sfx.play('impact', at[0] ?? f.center(), 1.4);
  }

  /** the stomp quake: rings of upheaval out to 12 m (×size) */
  quake(hits: Set<number>): void {
    const { f, g } = this;
    const k = this.size;
    const fw = f.forward(new THREE.Vector3());
    const c = f.pos.clone().addScaledVector(fw, 2.5 * k);
    g.groundImpact(c.clone(), 2.6 * k, 380, IRA_REIATSU.body, f);
    for (let ring = 1; ring <= 3; ring++)
      this.after(ring * 0.1, () => {
        const R = ring * 4 * k;
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2 + ring;
          const p = new THREE.Vector3(c.x + Math.cos(a) * R, c.y, c.z + Math.sin(a) * R);
          g.engine.destruction.carve(new SphereShape(p, 1.1 * Math.sqrt(k), 0.45), { mode: 'smash', power: 300, impulse: 9, dust: 0.6 });
        }
        g.addRing(c.clone(), R * 1.1, '#d9b48a', 0.4);
      });
    for (const o of g.enemiesOf(f)) {
      const d = Math.hypot(o.pos.x - c.x, o.pos.z - c.z);
      if (d > 12 * k || o.pos.y > c.y + 3 || hits.has(o.id)) continue;
      hits.add(o.id);
      g.damage(o, 60, f, _v.subVectors(o.pos, c).setY(0).normalize().clone(), { knock: 14 * (1 - d / (13 * k)), launch: 9, heavy: true, hitstop: 0.08, shake: 0.6 });
    }
    g.sfx.play('explode', c, 1.6);
    if (g.player && g.player.pos.distanceTo(f.pos) < 100) g.shake(0.9);
  }

  /** the shell blown outward: 14 m (×size) */
  shieldBurst(shell: IraShell): void {
    const { f, g } = this;
    const k = this.size;
    shell.burst();
    const c = f.center();
    for (const o of g.enemiesOf(f)) {
      const d = o.center().distanceTo(c);
      if (d > 14 * k) continue;
      g.damage(o, 120, f, _v.subVectors(o.pos, c).setY(0.2).normalize().clone(), { energy: true, knock: 26 * (1 - d / (15 * k)) + 6, launch: 8, heavy: true, hitstop: 0.1, shake: 0.7 });
    }
    // the walls round him blown away (above the ground, not under him)
    const R = f.def.height * 0.55;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const p = new THREE.Vector3(c.x + Math.cos(a) * R, f.pos.y + R * 0.75, c.z + Math.sin(a) * R);
      g.engine.destruction.carve(new SphereShape(p, R * 0.7, 0.7), { mode: 'explode', power: 340, impulse: 16 });
    }
    g.sfx.play('explode', c, 1.8);
    if (g.player && g.player.pos.distanceTo(f.pos) < 100) g.shake(0.8);
  }

  /** the evolution's explosion of reiatsu (20 m, ×size), then the ape */
  evolveBurst(): void {
    const { f, g } = this;
    const k = this.size;
    const c = f.center();
    rageBurst(g, c, 10 * k);
    for (const o of g.enemiesOf(f)) {
      const d = o.center().distanceTo(c);
      if (d > 20 * k) continue;
      g.damage(o, 150, f, _v.subVectors(o.pos, c).setY(0.3).normalize().clone(), { energy: true, knock: 30 * (1 - d / (21 * k)) + 8, launch: 10, heavy: true, hitstop: 0.14, shake: 1 });
    }
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const R = 9 * k;
      g.engine.destruction.carve(new SphereShape(new THREE.Vector3(c.x + Math.cos(a) * R, f.pos.y + R * 0.6, c.z + Math.sin(a) * R), R * 0.6, 0.7), { mode: 'explode', power: 420, impulse: 18 });
    }
    g.sfx.play('explode', c, 2);
    g.slowMo(0.6, 0.35);
    this.becomeGiant('ape');
  }

  // ---------------------------------------------------------------------------------------------- forms

  private applyForm(): void {
    const { f } = this;
    const F = FORMS[this.form];
    f.toughness = F.tough;
    f.damageTaken = F.taken;
    f.giant = this.giant;
    f.aura.target = this.flare ? 1 : this.giant ? 0.35 : 0.15;
  }

  /** the swell into the kaiju (or, from it, into the ape): a new body, every wound healed */
  becomeGiant(to: 'ira' | 'ape'): void {
    const { f, g } = this;
    const from = this.form;
    this.form = to;
    this.evolving = false;
    const F = FORMS[to];
    this.stance = { ...F.stance };
    f.def = { ...f.def, stance: this.stance, clips: F.clips, boss: true, title: 'Cero Espada', speed: { ...F.speed } };
    f.anim.stopAll(0.05);
    f.setForm({ asset: yammyAsset(to), props: [] }, AURA_IRA);
    f.ghosts.enabled = false;
    f.hovering = false;
    // it grows into the new body over a breath or two
    this.size = from === 'sealed' ? 0.22 : this.size * 0.75;
    if (to === 'ape') this.rage = 0;
    f.hp = f.maxHp;
    this.applyForm();
    this.applySize(0);
    f.aura.flare(2.4, 1.6);
    g.groundImpact(f.pos.clone(), 3, 260, IRA_REIATSU.body, f);
    g.shake(1);
    g.hitstop(0.1);
    if (from === 'sealed') {
      // the sword bursts into reiatsu, the "1" melts off the tattoo
      const p = f.center();
      for (let i = 0; i < 40; i++)
        g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5) * 8, vy: Math.random() * 7, vz: (Math.random() - 0.5) * 8, size: 0.3, sizeEnd: 0.05, life: 0.8, r: 1, g: 0.42, b: 0.16, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 1.4 });
      g.sfx.play('bankai', f.center(), 1.4);
    }
    // the ground cracks round the new feet
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = F.radius * 1.6;
      g.engine.destruction.carve(new SphereShape(new THREE.Vector3(f.pos.x + Math.cos(a) * r, f.pos.y, f.pos.z + Math.sin(a) * r), 1.2, 0.4), { mode: 'smash', power: 200, impulse: 8, dust: 0.8 });
    }
    f.act(new RoarAction(this, GIANT_CLIP[to].roar), true);
  }

  /** F in Ira at a full meter (or forced when it overflows) */
  private evolve(force = false): void {
    const { f } = this;
    if (this.form !== 'ira' || this.evolving) return;
    if (!force && (this.rage < 100 || f.busy)) {
      if (f === this.g.player && this.rage < 100) this.g.hud?.showBanner('Not angry enough yet');
      return;
    }
    this.evolving = true;
    f.act(new EvolveAction(this), true);
  }

  // ---------------------------------------------------------------------------------------------- inputs

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof BlowAction) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastSwingEnd > 0.9) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const list = this.chainList();
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    this.lastSwingEnd = this.g.time + 0.9;
    if (this.dozing) this.wake();
    this.f.act(new BlowAction(this, list[idx], idx), true);
  }

  private special(a: SkillAction, cost: number, cdKey: keyof YammyKit['cd'], cd: number): boolean {
    const { f, g } = this;
    if (this.cd[cdKey] > 0) return false;
    if (f.action && !f.action.canCancel(a)) return false;
    if (f.hitstun > 0 || f.dashT > 0 || f.dead) return false;
    if (!f.spendRei(cost)) {
      if (f === g.player) g.hud?.showBanner('Not enough reiatsu');
      return false;
    }
    if (this.dozing) this.wake();
    this.cd[cdKey] = cd;
    f.act(a, true);
    return true;
  }

  /** RMB: Bala (sealed: six red bullets; the giants: four the size of cars) */
  heavy(): void {
    if (this.giant) this.special(new BalaAction(this, GIANT_CLIP[this.form as 'ira' | 'ape'].bala, 4), 25, 'bala', 2.4);
    else this.special(new BalaAction(this, 'yy_bala', 6), 12, 'bala', 1.1);
  }

  /** Q: Cero (sealed: from the mouth, a fissure; the giants: swept across) */
  skill1(): void {
    if (this.giant) this.special(new CeroAction(this, GIANT_CLIP[this.form as 'ira' | 'ape'].cero), 45, 'cero', 7);
    else this.special(new CeroAction(this, 'yy_cero'), 20, 'cero', 3);
  }

  /** E: Gonzui (sealed) / the stomp quake (the giants) */
  skill2(): void {
    if (this.giant) this.special(new StompAction(this, GIANT_CLIP[this.form as 'ira' | 'ape'].stomp), 20, 'stomp', 5);
    else this.special(new GonzuiAction(this), 0, 'gonzui', 10);
  }

  /** R: the limb rip (sealed) / Cero Oscuras (the giants) */
  skill3(): void {
    if (this.giant) {
      const a = new OscurasAction(this, GIANT_CLIP[this.form as 'ira' | 'ape'].oscuras);
      if (this.special(a, 70, 'oscuras', 14)) this.oscuras = a;
    } else this.special(new GrabAction(this), 10, 'rip', 5);
  }

  /** F: "Buchikirero, Ira!" (sealed) / the rage evolution at a full meter (Ira) */
  release(): void {
    const { f, g } = this;
    if (this.form === 'ira') return this.evolve();
    if (this.form !== 'sealed' || f.busy) return;
    if (!f.spendRei(40)) {
      if (f === g.player) g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    if (this.dozing) this.wake();
    f.act(new ReleaseAction(this), true);
  }

  /** G: the Hierro brace (sealed) / the reiatsu shield, and on a second press its burst (the giants) */
  toggle(): void {
    const { f } = this;
    const cur = f.action;
    if (cur instanceof ShieldAction) return cur.blow();
    if (cur instanceof BraceAction) {
      f.stopAction();
      return;
    }
    if (this.giant) this.special(new ShieldAction(this, GIANT_CLIP[this.form as 'ira' | 'ape'].shield), 25, 'shield', 9);
    else this.special(new BraceAction(this), 0, 'brace', 5);
  }

  /** V: the flare (released: orange-red, it cracks the ground for blocks round him) */
  toggleFlare(): void {
    const { f, g } = this;
    this.flare = !this.flare;
    this.applyForm();
    if (!this.flare) return;
    f.aura.flare(1.6, 0.4);
    g.shake(0.2);
    g.sfx.play('flare', f.center());
    if (!this.giant) return;
    const k = this.size;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r = f.def.radius * (1.4 + Math.random() * 1.2);
      g.engine.destruction.carve(new SphereShape(new THREE.Vector3(f.pos.x + Math.cos(a) * r, f.pos.y, f.pos.z + Math.sin(a) * r), 0.8 * k, 0.4), { mode: 'smash', power: 120, impulse: 4, dust: 0.6 });
    }
  }

  formName(): string {
    return this.form === 'sealed' ? 'Diez Espada' : this.form === 'ira' ? 'Resurrección — Ira' : 'Ira — Rage';
  }

  /** melee reach for the duel AI (it grows with him) */
  reach(): number {
    return this.form === 'sealed' ? 1.8 : (this.form === 'ape' ? 6.5 : 7) * this.size;
  }

  ai(): KitAI {
    const sealed = () => this.form === 'sealed';
    const giant = () => this.giant;
    const kit = this;
    return {
      get reach() {
        return kit.reach();
      },
      chain: 4,
      releaseAt: 0.55,
      // reckless: he walks straight in and never guards
      ranged: false,
      moves: [
        { name: 'bala', use: () => this.heavy(), min: 4, max: 26, weight: 2, cd: 3, when: sealed },
        { name: 'cero', use: () => this.skill1(), min: 9, max: 38, weight: 2, cd: 5, when: sealed },
        { name: 'gonzui', use: () => this.skill2(), min: 0, max: 13, weight: 1.4, cd: 10, when: () => sealed() && (this.f.rei < this.f.maxRei * 0.5 || this.g.enemiesOf(this.f).some((o) => o.def.id === 'hollow' && o.pos.distanceTo(this.f.pos) < 14)) },
        { name: 'rip', use: () => this.skill3(), min: 0, max: 2.4, weight: 1.8, cd: 6, when: sealed },
        { name: 'gbala', use: () => this.heavy(), min: 12, max: 70, weight: 2, cd: 4, when: giant },
        { name: 'gcero', use: () => this.skill1(), min: 18, max: 90, weight: 1.8, cd: 8, when: giant },
        { name: 'oscuras', use: () => this.skill3(), min: 30, max: 140, weight: 1.4, cd: 15, when: giant },
        { name: 'stomp', use: () => this.skill2(), min: 0, max: 14, weight: 1.6, cd: 6, when: giant },
        { name: 'shield', use: () => this.toggle(), min: 0, max: 200, weight: 3, cd: 10, when: () => giant() && this.g.time - this.f.lastHurt.at < 1 && this.f.lastHurt.dmg > 30 },
        { name: 'evolve', use: () => this.release(), min: 0, max: 400, weight: 40, cd: 2, when: () => this.form === 'ira' && this.rage >= 100 },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    if (!this.giant)
      return [
        { key: 'LMB', name: 'Brawl', kanji: '拳' },
        { key: 'RMB', name: 'Bala', kanji: '虚弾', cost: 12, cd: this.cd.bala, cdMax: 1.1 },
        { key: 'Q', name: 'Cero', kanji: '虚閃', cost: 20, cd: this.cd.cero, cdMax: 3 },
        { key: 'E', name: 'Gonzui', kanji: '魂吸', cd: this.cd.gonzui, cdMax: 10 },
        { key: 'R', name: 'Limb Rip', kanji: '裂', cost: 10, cd: this.cd.rip, cdMax: 5 },
        { key: 'G', name: 'Hierro', kanji: '鋼皮', active: this.f.action instanceof BraceAction, cd: this.cd.brace, cdMax: 5 },
        { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
        { key: 'F', name: 'Ira', kanji: '憤獣', cost: 40, tint: '#ff6a2a' },
      ];
    const ira = this.form === 'ira';
    return [
      { key: 'LMB', name: ira ? 'Crush' : 'Pound', kanji: ira ? '砕' : '撃' },
      { key: 'RMB', name: 'Bala', kanji: '虚弾', cost: 25, cd: this.cd.bala, cdMax: 2.4 },
      { key: 'Q', name: 'Cero', kanji: '虚閃', cost: 45, cd: this.cd.cero, cdMax: 7 },
      { key: 'E', name: 'Quake', kanji: '震', cost: 20, cd: this.cd.stomp, cdMax: 5 },
      { key: 'R', name: 'Oscuras', kanji: '黒虚閃', cost: 70, cd: this.cd.oscuras, cdMax: 14 },
      { key: 'G', name: 'Shield', kanji: '盾', cost: 25, active: this.f.action instanceof ShieldAction, cd: this.cd.shield, cdMax: 9 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      { key: 'F', name: ira ? 'Rage' : 'Rage', kanji: '怒', active: this.rage >= 100 || !ira, timer: Math.min(1, this.rage / 100), tint: '#ff5a1e' },
    ];
  }
}
