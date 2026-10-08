// Kaien Shiba's kit (docs/kits/kaien.md). Sealed: an honest fencer — the kendō string, the blink double cut (a Shunpo
// to the target's side and two cuts at two limbs), Shakkahō and three at once without a chant, the grab and the rip
// with his bare hands, the mentor's guard that turns a blow ("Again!"). "Suiten sakamake, Nejibana": the trident and
// the water — the spear dance shedding arcs (the butt drills on the spin, the 4th raises a wave all round), the crushing
// tide, the rising wave and its undertow, the spiral thrust, the tidal sweep, the spinning guard and the Surge. Disarmed
// he fights on with his fists. Possessed (a roster entry of its own): Metastacia in his body — claws and a bite, the
// tentacle grab (Spirit Body Fusion), a volley, the pounce, and the touch that shatters a blade.
import * as THREE from 'three';
import { FighterAction, type Fighter, type FighterDef } from '../fighter';
import type { DamageOpts, Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import type { AuraStyle } from '../../vfx/aura';
import { kaienAsset, KATANA_BASE_Z, KATANA_TIP_Z, NEJIBANA_BASE_Z, NEJIBANA_TIP_Z, nejibanaProp } from '../../chars/kaien';
import { NEJIBANA_BUTT_Z } from '../../chars/nejibana';
import { FIST_CHAIN, KAIEN_CHAIN, KAIEN_SEALED_CLIPS, KAIEN_SHIKAI_CLIPS, KAIEN_STANCE, NEJIBANA_CHAIN, NEJIBANA_STANCE, POSSESSED_CHAIN, POSSESSED_CLIPS, POSSESSED_STANCE } from '../../chars/kaienClips';
import { CutAction, NejibanaReleaseAction, ShakkahoAction, SkillAction, SpiralAction, spec, TideAction, WaveAction, WATER, type NejibanaHost } from './nejibanaMoves';
import { SoulHooks } from './soulHooks';
import { bladeShatter, FusionTendril, WaveWall } from '../../vfx/glotoneria';
import { Flood, splash, WaterBlade, WaterSpray } from '../../vfx/water';
import { CapsuleShape } from '../../destruction/shapes';
import { TEX_GLOW } from '../../vfx/sprites';

export const AURA_KAIEN: AuraStyle = { core: '#E6FBFF', body: '#5EC4D6', rim: '#1E5E78' };
const AURA_POSSESSED: AuraStyle = { core: '#FFD9A8', body: '#8FA08A', rim: '#2E3A2A' };

type Blade = NonNullable<FighterDef['blade']>;
const KATANA: Blade = { prop: 'sword', base: [0, 0, KATANA_BASE_Z], tip: [0, 0, KATANA_TIP_Z], color: '#7FD0FF', core: '#F2FBFF' };
const TRIDENT: Blade = { prop: 'spear', base: [0, 0, NEJIBANA_BASE_Z - 0.12], tip: [0, 0, NEJIBANA_TIP_Z], color: '#3AA6E6', core: '#E9F8FF' };

/** an expert's Shunpo */
const SPEED = { run: 9.5, sprint: 23, jump: 12.5, dash: 15.5, dashTime: 0.1 };
/** Metastacia's lunges */
const SPEED_POSSESSED = { run: 9, sprint: 20, jump: 13, dash: 13, dashTime: 0.14 };

const sealedProps = () => [
  { key: 'sword', model: nejibanaProp('katana'), socket: 'grip.R' },
  { key: 'saya', model: nejibanaProp('sheath-empty'), socket: 'hip.L' },
];

export const KAIEN_DEF: FighterDef = {
  id: 'kaien',
  name: 'Kaien Shiba',
  title: 'Lieutenant, 13th Division',
  build: () => ({ asset: kaienAsset('lieutenant'), props: sealedProps() }),
  stance: KAIEN_STANCE,
  clips: KAIEN_SEALED_CLIPS,
  aura: AURA_KAIEN,
  blade: KATANA,
  hp: 1000,
  rei: 220,
  speed: { ...SPEED },
  radius: 0.4,
  height: 1.83,
};

export const KAIEN_POSSESSED_DEF: FighterDef = {
  id: 'kaien-possessed',
  name: 'Kaien Shiba',
  title: 'Possessed by Metastacia',
  build: () => ({ asset: kaienAsset('possessed'), props: [] }),
  stance: POSSESSED_STANCE,
  clips: POSSESSED_CLIPS,
  aura: AURA_POSSESSED,
  hp: 1300,
  rei: 200,
  speed: { ...SPEED_POSSESSED },
  radius: 0.42,
  height: 1.7,
};

type Form = 'sealed' | 'shikai' | 'possessed';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _u = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

/** distance from p to the surface of o's hurt capsule */
function capsuleGap(o: Fighter, p: THREE.Vector3): number {
  const cy = Math.max(o.pos.y + 0.2, Math.min(o.pos.y + o.def.height - 0.2, p.y));
  return Math.hypot(o.pos.x - p.x, cy - p.y, o.pos.z - p.z) - o.def.radius;
}

/** hit whoever is within r of p (once each); returns who was hit */
function strike(f: Fighter, g: Game, p: THREE.Vector3, r: number, dmg: number, o: DamageOpts, hits: Set<number>): Fighter[] {
  const out: Fighter[] = [];
  for (const e of g.enemiesOf(f)) {
    if (hits.has(e.id) || capsuleGap(e, p) > r) continue;
    hits.add(e.id);
    const dir = _w.subVectors(e.pos, f.pos).setY(0);
    if (dir.lengthSq() < 1e-4) f.forward(dir);
    g.damage(e, dmg, f, dir.normalize().clone(), o);
    g.sparks(e.center(), dir, f.def.aura.body, 10);
    out.push(e);
  }
  return out;
}

// ------------------------------------------------------------------------------------------------ sealed

/** The blink double cut: a Shunpo to the target's side, a cut at one limb, the blade brought back for the second. */
class BlinkCutAction extends SkillAction {
  readonly name = 'blink';
  private phase = 0;
  constructor(readonly kit: KaienKit, readonly target: Fighter | null) {
    super();
    this.mobility = 0.05;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('kn_blink')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    const t = this.target;
    if (t) {
      // to the target's flank, just off its shoulder, stepping in as the blade comes round
      const side = new THREE.Vector3(-(t.pos.z - f.pos.z), 0, t.pos.x - f.pos.x).normalize().multiplyScalar(Math.random() < 0.5 ? 1 : -1);
      const p = t.pos.clone().addScaledVector(side, 1.3);
      f.ghosts.spawn(0.35, 0.8);
      f.body.pos.set(p.x, Math.max(p.y, f.pos.y - 0.5), p.z);
      f.body.prev.copy(f.body.pos);
      f.yaw = Math.atan2(t.pos.x - p.x, t.pos.z - p.z);
      f.push.addScaledVector(f.forward(_v), 0.6 * f.pushDrag);
      g.onDash(f);
    }
    f.anim.play('kn_blink');
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    // two blade windows, each a fresh set of hits (two limbs)
    // (each cut is eased out hard: most of its arc is covered in the first frames after its key)
    const w1 = t >= 0.075 && t <= 0.2, w2 = t >= 0.235 && t <= 0.38;
    if ((w1 && this.phase === 0) || (w2 && this.phase === 1)) {
      this.phase++;
      f.bladeHits.clear();
      f.bladeSpec = spec(24, 6, 320, { reach: 0.18, hitstop: 0.06 });
      g.sfx.play('swing', f.center(), 0.9);
    }
    f.bladeActive = w1 || w2;
    if (f.trail) f.trail.emitting = f.bladeActive;
  }
  override end(f: Fighter): void {
    f.bladeActive = false;
    if (f.trail) f.trail.emitting = false;
  }
}

/** The grab and the rip: the left hand seizes what is in front, holds it, and tears (its weapon arm numb a while). */
class GrabRipAction extends SkillAction {
  readonly name = 'grab';
  private victim: Fighter | null = null;
  private grabbed = false;
  private ripped = false;
  constructor(readonly kit: KaienKit) {
    super();
    this.mobility = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('kn_grab')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.anim.play('kn_grab');
    f.push.addScaledVector(f.forward(_v), 6);
    g.sfx.play('swing', f.center(), 0.7);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.grabbed && this.t >= 0.2) {
      this.grabbed = true;
      const hand = f.pos.clone().addScaledVector(f.forward(_v), 1.1).setY(f.pos.y + 1.2);
      let best: Fighter | null = null, bd = 1.2;
      for (const o of g.enemiesOf(f)) {
        const d = capsuleGap(o, hand);
        if (d < bd) { bd = d; best = o; }
      }
      if (best && !best.invuln && !best.action?.invulnerable) {
        this.victim = best;
        best.stopAction();
        g.sfx.play('hit', best.center(), 0.7);
      }
    }
    const o = this.victim;
    if (o && !this.ripped) {
      if (o.dead || !g.fighters.includes(o)) {
        this.victim = null;
        return;
      }
      // held at arm's length
      const hold = f.pos.clone().addScaledVector(f.forward(_v), f.def.radius + o.def.radius + 0.35);
      o.body.pos.set(hold.x, o.pos.y, hold.z);
      o.body.prev.copy(o.body.pos);
      o.body.vel.x = o.body.vel.z = 0;
      o.hitstun = Math.max(o.hitstun, 0.2);
      if (this.t >= 0.62) {
        this.ripped = true;
        const dir = f.forward(_v).clone();
        g.damage(o, 40, f, dir, { heavy: true, unblockable: true, knock: 12, hitstop: 0.1, shake: 0.3 });
        o.armLockT = Math.max(o.armLockT, 3);
        g.sparks(o.center(), dir, '#B3142C', 18);
        if (o === g.player) g.hud?.showBanner('Your arm is torn — it will not answer', 1.4);
      }
    }
  }
}

/** The mentor's guard: for a beat a blow on him is turned aside and answered with a rising cut. */
class CounterAction extends SkillAction {
  readonly name = 'counter';
  triggered = false;
  constructor(readonly kit: KaienKit) {
    super();
    this.mobility = 0.05;
    this.dur = 0.75;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('kn_counter', { hold: true });
    g.sfx.play('ting', f.center(), 0.5);
  }
  override end(f: Fighter): void {
    if (!this.triggered) f.anim.stopAll(0.2);
  }
}

/** Bare hands: a jab, a hook, an uppercut. */
class FistAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private hitAt = 0;
  private struck = false;
  private hits = new Set<number>();
  queued = false;
  constructor(readonly kit: KaienKit, readonly clip: string, readonly index: number) {
    super();
    this.name = clip;
    this.mobility = 0.15;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    this.hitAt = c.events.hit ?? 0.12;
    f.anim.play(this.clip);
    const tgt = f.faceTarget;
    const gap = tgt ? Math.max(0, Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z) - 1.2) : 0;
    f.push.addScaledVector(f.forward(_v), Math.min(5 + gap * 3, 12));
    g.sfx.play('swing', f.center(), 0.6);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.struck && this.t >= this.hitAt) {
      this.struck = true;
      const up = this.index === 2;
      const p = f.pos.clone().addScaledVector(f.forward(_v), 0.95).setY(f.pos.y + (up ? 1.5 : 1.3));
      strike(f, g, p, 0.6, [14, 16, 22][this.index], { knock: up ? 3 : 6, launch: up ? 9 : 0, heavy: up, hitstop: 0.05 }, this.hits);
    }
    if (this.queued && this.t >= this.comboAt) {
      this.done = true;
      this.kit.chain(this.index + 1);
      return;
    }
    if (this.t >= this.dur) this.done = true;
  }
  override canCancel(next: FighterAction): boolean {
    return (next.name === 'dash' || next instanceof SkillAction) && this.t >= this.hitAt + 0.04;
  }
}

// ------------------------------------------------------------------------------------------------ Nejibana

/** The spinning guard: the trident turned like a wheel before him; shots in front are swept away (held). */
class GuardSpinAction extends SkillAction {
  readonly name = 'guard';
  constructor(readonly kit: KaienKit) {
    super();
    this.mobility = 0.25;
    this.armor = 0.7;
    this.dur = 3;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('nj_guard', { hold: true });
    g.sfx.play('torrent', f.center(), 0.5);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const fw = f.forward(_v);
    g.rejectNear(_w.copy(f.center()).addScaledVector(fw, 2.5), 3.5, f, false);
    // a disc of spray where the trident turns
    const sp = WaterSpray.of(g);
    const c = f.center().addScaledVector(fw, 0.6);
    const side = _u.set(fw.z, 0, -fw.x);
    for (let i = 0; i < 4; i++) {
      const a = Math.random() * Math.PI * 2;
      const x = c.x + side.x * Math.cos(a) * 1.1, y = c.y + Math.sin(a) * 1.1, z = c.z + side.z * Math.cos(a) * 1.1;
      sp.spawn(x, y, z, fw.x * 2 + side.x * Math.cos(a + 1.6) * 4, Math.sin(a + 1.6) * 4, fw.z * 2 + side.z * Math.cos(a + 1.6) * 4, 0.05 + Math.random() * 0.04, 0.6, 0.6);
    }
  }
  override end(f: Fighter): void {
    f.anim.stopAll(0.2);
  }
}

/** The tidal sweep: the spin, and a fan of water blades thrown out across the front. */
class SweepAction extends SkillAction {
  readonly name = 'sweep';
  private thrown = false;
  constructor(readonly kit: KaienKit) {
    super();
    this.mobility = 0.08;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('nj_s2')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.anim.play('nj_s2');
    g.sfx.play('torrent', f.center(), 0.9);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.thrown || this.t < 0.34) return;
    this.thrown = true;
    const from = f.center();
    const aim = this.kit.aim(from).sub(from).setY(0).normalize();
    const side = new THREE.Vector3(aim.z, 0, -aim.x);
    for (let i = 0; i < 5; i++) {
      const a = (i - 2) * 0.3;
      const dir = aim.clone().applyAxisAngle(UP, a);
      g.addProjectile(new WaterBlade(g, f, from.clone().addScaledVector(dir, 1), dir, side.clone().applyAxisAngle(UP, a), 30, 2, 18, 320));
    }
    splash(g, from.clone().addScaledVector(aim, 1.5), 1.6, aim);
  }
}

/** The Surge: the ground floods, a great wave carries him in, and at its crest the crushing thrust. */
class SurgeAction extends SkillAction {
  readonly name = 'surge';
  private flooded = false;
  private rode = false;
  private thrust = false;
  private dir = new THREE.Vector3();
  private hits = new Set<number>();
  constructor(readonly kit: KaienKit) {
    super();
    this.mobility = 0;
    this.trackTarget = false;
    this.invulnerable = false;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('nj_surge')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.anim.play('nj_surge');
    const t = this.kit.target(30);
    this.dir.copy(t ? _v.subVectors(t.pos, f.pos) : f.forward(_v)).setY(0).normalize();
    f.yaw = Math.atan2(this.dir.x, this.dir.z);
    g.callout('捩花', 'NEJIBANA — SURGE', '#7fd0ff');
    g.sfx.play('torrent', f.center(), 1.2);
    this.armor = 0.5;
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    if (!this.flooded && t >= 0.3) {
      this.flooded = true;
      g.addProjectile(new Flood(g, f, f.pos.clone(), 10, 8));
      splash(g, f.center(), 2.2);
    }
    if (!this.rode && t >= 0.55) {
      this.rode = true;
      // the wave rises behind him and rolls toward the target; he rides its crest
      const from = f.pos.clone().addScaledVector(this.dir, -1.5);
      g.addProjectile(new WaveWall(g, f, from, this.dir.clone(), 14, 5, 0.95, 60, 14));
      g.shake(0.4);
    }
    if (this.rode && t < 1.35) {
      f.yaw = Math.atan2(this.dir.x, this.dir.z);
      f.push.addScaledVector(this.dir, 32 * dt * f.pushDrag);
      f.body.vel.y = Math.max(f.body.vel.y, t < 0.9 ? 3 : -2);
      f.hovering = false;
    }
    if (!this.thrust && t >= 1.35) {
      this.thrust = true;
      const tip = f.blade.tip.clone();
      const p = tip.addScaledVector(this.dir, 0.5);
      strike(f, g, p, 1.6, 90, { heavy: true, knock: 22, launch: 7, hitstop: 0.14, shake: 0.6 }, this.hits);
      splash(g, p, 2.6, this.dir);
      g.addRing(f.pos.clone().setY(f.pos.y + 0.2), 8, WATER, 0.6);
    }
  }
}

// ------------------------------------------------------------------------------------------------ possessed

/** Claw, claw, bite: lunging blows, the bite heals him. */
class FeralAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private hitAt = 0;
  private struck = false;
  private hits = new Set<number>();
  queued = false;
  constructor(readonly kit: KaienKit, readonly clip: string, readonly index: number) {
    super();
    this.name = clip;
    this.mobility = 0.12;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.7;
    this.hitAt = c.events.hit ?? 0.15;
    f.anim.play(this.clip);
    const tgt = f.faceTarget;
    const gap = tgt ? Math.max(0, Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z) - 1.2) : 0;
    f.push.addScaledVector(f.forward(_v), Math.min(7 + gap * 3.5, 16));
    g.sfx.play('swing', f.center(), 0.7);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.struck && this.t >= this.hitAt) {
      this.struck = true;
      const bite = this.index === 2;
      const p = f.pos.clone().addScaledVector(f.forward(_v), 1).setY(f.pos.y + (bite ? 1.3 : 1.1));
      const hit = strike(f, g, p, 0.75, bite ? 34 : 24, { knock: bite ? 10 : 6, heavy: bite, hitstop: bite ? 0.08 : 0.05 }, this.hits);
      if (bite && hit.length) {
        f.hp = Math.min(f.maxHp, f.hp + 20);
        g.sfx.play('hitHeavy', p, 0.6);
      }
    }
    if (this.queued && this.t >= this.comboAt) {
      this.done = true;
      this.kit.chain(this.index + 1);
      return;
    }
    if (this.t >= this.dur) this.done = true;
  }
  override canCancel(next: FighterAction): boolean {
    return (next.name === 'dash' || next instanceof SkillAction) && this.t >= this.hitAt + 0.05;
  }
}

/** The tentacles flung out: one homing on the target (the grab), or five fanned out (the volley). Whatever they reach is hooked. */
class LashAction extends SkillAction {
  readonly name: string;
  private shot = false;
  constructor(readonly kit: KaienKit, readonly volley: boolean) {
    super();
    this.name = volley ? 'volley' : 'tgrab';
    this.mobility = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('kp_lash')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.anim.play('kp_lash');
    if (this.volley) g.callout('霊体融合', 'SPIRIT BODY FUSION', '#9fd08a');
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.shot || this.t < 0.22) return;
    this.shot = true;
    const from = sock(f, 'back');
    const fw = f.forward(_v).clone();
    const tgt = this.kit.target(this.volley ? 13 : 10);
    const n = this.volley ? 5 : 1;
    const range = this.volley ? 12 : 9;
    const taken = new Set<number>();
    for (let i = 0; i < n; i++) {
      const dir = fw.clone().applyAxisAngle(UP, (i - (n - 1) / 2) * 0.24);
      if (tgt && (!this.volley || (i >= 1 && i <= 3))) dir.lerp(_w.subVectors(tgt.center(), from).normalize(), i === 2 || !this.volley ? 1 : 0.85).normalize();
      let hit: Fighter | null = null, hd = range;
      for (const o of g.enemiesOf(f)) {
        if (taken.has(o.id)) continue;
        const c = o.center(_u);
        const along = _w.subVectors(c, from).dot(dir);
        if (along < 0 || along > hd) continue;
        if (_w.subVectors(c, from).addScaledVector(dir, -along).length() > o.def.radius + 0.6) continue;
        hit = o;
        hd = along;
      }
      const end = hit ? null : from.clone().addScaledVector(dir, range);
      const v = hit;
      if (v) {
        taken.add(v.id);
        this.kit.fusion.hook(v, this.volley ? 3 : 3.5);
      }
      g.addProjectile(new FusionTendril(g, () => sock(f, 'back'), v ? () => v.center() : () => end!, v ? () => this.kit.fusion.has(v) : () => false, this.volley ? 0.06 : 0.09, { color: '#68765F', emissive: '#1C2418' }));
    }
    g.sfx.play('swing', from, 0.8);
  }
}

/** The pounce: down into a crouch and a leap onto the target. */
class PounceAction extends SkillAction {
  readonly name = 'pounce';
  private leapt = false;
  private landed = false;
  private hits = new Set<number>();
  constructor(readonly kit: KaienKit) {
    super();
    this.mobility = 0;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('kp_pounce')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.anim.play('kp_pounce');
    void g;
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.leapt && this.t >= 0.2) {
      this.leapt = true;
      const t = this.kit.target(12);
      const d = t ? Math.min(10, Math.hypot(t.pos.x - f.pos.x, t.pos.z - f.pos.z) - 0.8) : 6;
      f.push.addScaledVector(f.forward(_v), d * f.pushDrag);
      f.body.vel.y = 7;
      f.body.grounded = false;
      g.sfx.play('shunpo', f.center(), 0.7);
    }
    if (this.leapt && !this.landed && this.t >= 0.5) {
      this.landed = true;
      const p = f.pos.clone().addScaledVector(f.forward(_v), 0.9).setY(f.pos.y + 0.9);
      strike(f, g, p, 1.6, 40, { heavy: true, knock: 10, hitstop: 0.09, shake: 0.3 }, this.hits);
    }
  }
}

/** Metastacia's touch: for six seconds the next blade on him shatters. Once per fight. */
class TouchAction extends SkillAction {
  readonly name = 'touch';
  private armed = false;
  constructor(readonly kit: KaienKit) {
    super();
    this.mobility = 0;
  }
  override start(f: Fighter): void {
    const c = f.anim.clip('kp_touch')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.anim.play('kp_touch');
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.armed && this.t >= 0.3) {
      this.armed = true;
      this.kit.touchT = 6;
      g.callout('斬魄刀破壊', 'ZANPAKUTŌ DESTRUCTION', '#9fd08a');
      g.sfx.play('charge', f.center(), 0.6);
    }
  }
}

// ------------------------------------------------------------------------------------------------ the kit

export class KaienKit implements Kit, NejibanaHost {
  form: Form;
  comboIndex = 0;
  flare = false;
  readonly fusion: SoulHooks;
  /** Metastacia's touch armed (s left) and spent */
  touchT = 0;
  touchUsed = false;
  private lastSwingEnd = 0;
  private timers: { t: number; fn: () => void }[] = [];
  private butt = new THREE.Vector3();
  private buttPrev = new THREE.Vector3();
  private buttHits = new Set<number>();
  private buttLive = false;
  private heartGiven = false;
  private greeted = false;
  private cd = { blink: 0, shakkaho: 0, rapid: 0, grab: 0, counter: 0, tide: 0, wave: 0, spiral: 0, sweep: 0, surge: 0, guard: 0, tgrab: 0, volley: 0, pounce: 0, touch: 0, release: 0 };

  constructor(readonly f: Fighter, readonly g: Game, possessed = false) {
    this.form = possessed ? 'possessed' : 'sealed';
    this.fusion = new SoulHooks(f, g, 12, [0.56, 0.7, 0.5]);
    f.data.kit = this;
    f.toughness = possessed ? 10 : 6;
    f.parry = (amount, from, o) => this.parry(amount, from, o);
    f.onHurt = (_amount, heavy) => {
      if (heavy && this.fusion.list.length) this.fusion.clear();
    };
  }

  // ---------------------------------------------------------------------------------------------- per step

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    for (let i = this.timers.length - 1; i >= 0; i--) {
      const tm = this.timers[i];
      if ((tm.t -= dt) <= 0) {
        this.timers.splice(i, 1);
        tm.fn();
      }
    }
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    if (this.touchT > 0) {
      this.touchT -= dt;
      if (Math.random() < dt * 16) {
        const b = sock(f, 'back');
        g.engine.glow.spawn({ x: b.x + (Math.random() - 0.5) * 0.5, y: b.y + Math.random() * 0.8, z: b.z + (Math.random() - 0.5) * 0.5, vx: 0, vy: 0.6, vz: 0, size: 0.16, sizeEnd: 0.04, life: 0.5, r: 0.6, g: 0.85, b: 0.5, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
      }
    }
    this.fusion.update(dt);
    this.drillButt();
    if (f.dead && !this.heartGiven) this.passHeart();
  }

  after(s: number, fn: () => void): void {
    this.timers.push({ t: s, fn });
  }

  /** the spin of the spear dance brings the corkscrew butt round: it bores what it passes */
  private drillButt(): void {
    const { f, g } = this;
    const a = f.action;
    const live = this.form === 'shikai' && a instanceof CutAction && a.name === 'nj_s2' && a.t >= 0.1 && a.t <= 0.42;
    const prop = f.visual.props.get('spear');
    if (!live || !prop) {
      this.buttLive = false;
      return;
    }
    prop.updateMatrixWorld(true);
    this.buttPrev.copy(this.butt);
    this.butt.set(0, 0, NEJIBANA_BUTT_Z).applyMatrix4(prop.matrixWorld);
    if (!this.buttLive) {
      this.buttLive = true;
      this.buttHits.clear();
      return;
    }
    if (this.butt.distanceTo(this.buttPrev) > 0.02) g.engine.destruction.carve(new CapsuleShape(this.buttPrev.clone(), this.butt.clone(), 0.22), { mode: 'bore', power: 200, dust: 0.3 });
    strike(f, g, this.butt, 0.35, 14, { knock: 4, hitstop: 0.03 }, this.buttHits);
  }

  /** his heart goes on: the nearest ally gains his strength */
  private passHeart(): void {
    const { f, g } = this;
    this.heartGiven = true;
    this.fusion.clear();
    if (this.form === 'possessed') return;
    let best: Fighter | null = null, bd = Infinity;
    for (const o of g.fighters) {
      if (o === f || o.dead || o.team !== f.team) continue;
      const d = o.pos.distanceTo(f.pos);
      if (d < bd) { bd = d; best = o; }
    }
    if (!best) return;
    best.power *= 1.15;
    best.aura.flare(1.4, 0.6);
    g.hud?.showBanner(`"${best === g.player ? 'You' : best.def.name.split(' ')[0]} — take my heart with you."`, 2.4);
  }

  // ---------------------------------------------------------------------------------------------- forms

  /** "Suiten sakamake, Nejibana": the trident */
  onNejibana(): void {
    const { f, g } = this;
    this.form = 'shikai';
    const lv = f.aura.level;
    f.def = { ...f.def, stance: NEJIBANA_STANCE, clips: KAIEN_SHIKAI_CLIPS };
    f.anim.stopAll(0.05);
    f.setForm({ asset: kaienAsset('lieutenant'), props: [{ key: 'spear', model: nejibanaProp('trident'), socket: 'grip.R' }, { key: 'saya', model: nejibanaProp('sheath-empty'), socket: 'hip.L' }] }, AURA_KAIEN, TRIDENT);
    f.aura.level = lv;
    f.aura.target = this.flare ? 1 : 0.3;
    f.power = 1.3 * (this.flare ? 1.25 : 1);
    void g;
  }

  // ---------------------------------------------------------------------------------------------- the parry hook

  private parry(amount: number, from: Fighter | null, o: DamageOpts): boolean {
    const { f, g } = this;
    void amount;
    // the mentor's guard turns a blow and answers it
    const a = f.action;
    if (a instanceof CounterAction && !a.triggered && from && !o.energy) {
      a.triggered = true;
      g.sparks(f.center().addScaledVector(f.forward(_v), 0.5), f.forward(_v), '#E6FBFF', 14);
      g.sfx.play('ting', f.center(), 1);
      g.hud?.showBanner('"Again!"', 1);
      f.faceTarget = from.center();
      f.act(new CutAction(this, 'kn_s3', 2), true);
      return true;
    }
    // Metastacia's touch: the blade that strikes his tentacles shatters
    if (this.touchT > 0 && !this.touchUsed && from && from.bladeActive && from.def.blade && !o.energy && from.disarmT <= 0) {
      this.touchT = 0;
      this.touchUsed = true;
      from.disarmT = Math.max(from.disarmT, from.def.boss ? 3 : 10);
      bladeShatter(g, from.blade.tip.clone().lerp(from.blade.base, 0.4));
      g.shake(0.3);
      if (from === g.player) g.hud?.showBanner('Your Zanpakutō shatters', 2);
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------------------------------------- helpers

  aim(from: THREE.Vector3, out = new THREE.Vector3()): THREE.Vector3 {
    const { f, g } = this;
    const t = f.faceTarget;
    if (!t && f === g.player) return g.aimPoint(f, out);
    if (t) return out.copy(t);
    return out.copy(from).addScaledVector(f.forward(_u), 30);
  }

  target(range = 40): Fighter | null {
    const { f, g } = this;
    return g.nearestEnemy(f, range, f.forward(), 50) ?? g.nearestEnemy(f, range);
  }

  private special(a: FighterAction, cost: number, cdKey: keyof KaienKit['cd'], cd: number): boolean {
    const { f, g } = this;
    if (this.cd[cdKey] > 0) return false;
    if (f.action && !f.action.canCancel(a)) return false;
    if (f.hitstun > 0 || f.dashT > 0 || f.dead) return false;
    if (!f.spendRei(cost)) {
      if (f === g.player) g.hud?.showBanner('Not enough reiatsu');
      return false;
    }
    this.cd[cdKey] = cd;
    f.act(a, true);
    return true;
  }

  private disarmed(): boolean {
    return this.f.disarmT > 0 && this.form !== 'possessed';
  }

  bareHands(): boolean {
    return this.form !== 'possessed';
  }

  // ---------------------------------------------------------------------------------------------- inputs

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof CutAction || cur instanceof FistAction || cur instanceof FeralAction) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastSwingEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const f = this.f;
    this.lastSwingEnd = this.g.time + 0.8;
    if (this.form === 'possessed') {
      const idx = i % POSSESSED_CHAIN.length;
      this.comboIndex = idx + 1;
      f.act(new FeralAction(this, POSSESSED_CHAIN[idx], idx), true);
      return;
    }
    if (this.disarmed()) {
      const idx = i % FIST_CHAIN.length;
      this.comboIndex = idx + 1;
      f.act(new FistAction(this, FIST_CHAIN[idx], idx), true);
      return;
    }
    const list = this.form === 'shikai' ? NEJIBANA_CHAIN : KAIEN_CHAIN;
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    f.act(new CutAction(this, list[idx], idx), true);
  }

  /** RMB: the blink cut · the crushing tide · the tentacle grab; disarmed: the grab and the rip */
  heavy(): void {
    if (this.form === 'possessed') {
      this.special(new LashAction(this, false), 14, 'tgrab', 4);
      return;
    }
    if (this.disarmed()) {
      this.special(new GrabRipAction(this), 8, 'grab', 2.5);
      return;
    }
    if (this.form === 'shikai') this.special(new TideAction(this), 16, 'tide', 4);
    else this.special(new BlinkCutAction(this, this.target(14)), 12, 'blink', 3);
  }

  /** Q: Shakkahō · the rising wave and its undertow · the tentacle volley */
  skill1(): void {
    if (this.form === 'possessed') {
      this.special(new LashAction(this, true), 22, 'volley', 7);
      return;
    }
    if (this.form === 'sealed' || this.disarmed()) {
      this.special(new ShakkahoAction(this, 1), 10, 'shakkaho', 1.4);
      return;
    }
    if (this.special(new WaveAction(this), 18, 'wave', 4)) this.after(1.25, () => this.undertow());
  }

  /** E: the grab and the rip · the spiral thrust · the pounce */
  skill2(): void {
    if (this.form === 'possessed') {
      this.special(new PounceAction(this), 12, 'pounce', 3.5);
      return;
    }
    if (this.form === 'sealed' || this.disarmed()) {
      this.special(new GrabRipAction(this), 8, 'grab', 2.5);
      return;
    }
    this.special(new SpiralAction(this), 24, 'spiral', 6);
  }

  /** R: three Shakkahō · the tidal sweep · Metastacia's touch */
  skill3(): void {
    const { f, g } = this;
    if (this.form === 'possessed') {
      if (this.touchUsed) {
        if (f === g.player) g.hud?.showBanner('Spent for tonight');
        return;
      }
      this.special(new TouchAction(this), 20, 'touch', 9);
      return;
    }
    if (this.form === 'sealed' || this.disarmed()) {
      this.special(new ShakkahoAction(this, 3), 22, 'rapid', 5);
      return;
    }
    this.special(new SweepAction(this), 20, 'sweep', 5);
  }

  /** F: "Suiten sakamake, Nejibana" · the Surge */
  release(): void {
    if (this.form === 'possessed') return;
    if (this.disarmed()) {
      if (this.f === this.g.player) this.g.hud?.showBanner(this.form === 'sealed' ? 'No sword to release' : 'Nejibana is out of his hands');
      return;
    }
    if (this.form === 'sealed') {
      this.special(new NejibanaReleaseAction(this), 30, 'release', 2);
      return;
    }
    this.special(new SurgeAction(this), 60, 'surge', 20);
  }

  /** G: the mentor's guard · the spinning guard (G again ends it) */
  toggle(): void {
    const f = this.f;
    if (f.action instanceof GuardSpinAction) {
      f.stopAction();
      return;
    }
    if (this.form === 'possessed') return;
    if (this.form === 'shikai' && !this.disarmed()) this.special(new GuardSpinAction(this), 10, 'guard', 4);
    else this.special(new CounterAction(this), 4, 'counter', 2.2);
  }

  /** the undertow: as the wave falls back, the water drags those near it toward him */
  private undertow(): void {
    const { f, g } = this;
    if (f.dead) return;
    for (const o of g.enemiesOf(f)) {
      _v.subVectors(f.pos, o.pos).setY(0);
      const d = _v.length();
      if (d > 9 || d < 1.6) continue;
      // about three metres of drag (a push travels push / pushDrag)
      o.push.addScaledVector(_v.divideScalar(d), Math.min(3, d - 1.6) * o.pushDrag);
      o.wetT = Math.max(o.wetT, 6);
      o.slow(0.3, 1);
    }
    splash(g, f.pos.clone().addScaledVector(f.forward(_v), 3).setY(f.pos.y + 0.3), 1.6);
  }

  toggleFlare(): void {
    const { f, g } = this;
    this.flare = !this.flare;
    f.power = (this.form === 'shikai' ? 1.3 : this.form === 'possessed' ? 1.2 : 1) * (this.flare ? 1.25 : 1);
    f.aura.target = this.flare ? 1 : this.form === 'shikai' ? 0.3 : 0.15;
    if (this.flare) {
      f.aura.flare(1.6, 0.4);
      g.shake(0.2);
      g.sfx.play('flare', f.center());
    }
  }

  formName(): string {
    if (this.form === 'possessed') return 'Possessed — Metastacia';
    const base = this.form === 'shikai' ? 'Shikai — Nejibana' : 'Lieutenant, 13th Division';
    return this.disarmed() ? `${base} (disarmed)` : base;
  }

  ai(): KitAI {
    const is = (fm: Form) => () => this.form === fm && !this.disarmed();
    const sword = () => {
      const t = this.target(40);
      return !!t && !!t.def.blade && t.disarmT <= 0;
    };
    if (this.form === 'possessed')
      return {
        reach: 1.6,
        chain: 3,
        opener: () => this.g.hud?.showBanner('"...Ru...kia..."', 2),
        moves: [
          { name: 'tgrab', use: () => this.heavy(), min: 2, max: 9, weight: 2.6, cd: 4 },
          { name: 'volley', use: () => this.skill1(), min: 3, max: 12, weight: 2.2, cd: 7 },
          { name: 'pounce', use: () => this.skill2(), min: 4, max: 11, weight: 2.4, cd: 3.5 },
          { name: 'touch', use: () => this.skill3(), min: 0, max: 8, weight: 3, cd: 12, when: () => !this.touchUsed && sword() },
        ],
      };
    return {
      reach: 1.8,
      chain: 4,
      releaseAt: 0.7,
      opener: () => {
        if (this.greeted) return;
        this.greeted = true;
        this.g.hud?.showBanner('"Leave this one to me."', 2);
      },
      moves: [
        { name: 'blink', use: () => this.heavy(), min: 2, max: 12, weight: 2.4, cd: 3, when: is('sealed') },
        { name: 'shakkaho', use: () => this.skill1(), min: 5, max: 30, weight: 1.8, cd: 2.5, when: () => this.form === 'sealed' || this.disarmed() },
        { name: 'rapid', use: () => this.skill3(), min: 6, max: 30, weight: 1.6, cd: 6, when: () => this.form === 'sealed' || this.disarmed() },
        { name: 'grab', use: () => this.skill2(), min: 0, max: 2.5, weight: 2, cd: 4, when: () => this.form === 'sealed' || this.disarmed() },
        { name: 'counter', use: () => this.toggle(), min: 0, max: 2.6, weight: 1.4, cd: 4, when: () => this.form === 'sealed' && !!this.target(3)?.action },
        { name: 'tide', use: () => this.heavy(), min: 1, max: 4.5, weight: 2.6, cd: 4, when: is('shikai') },
        { name: 'wave', use: () => this.skill1(), min: 2.5, max: 10, weight: 2.4, cd: 5, when: is('shikai') },
        { name: 'spiral', use: () => this.skill2(), min: 4, max: 20, weight: 2.2, cd: 6, when: is('shikai') },
        { name: 'sweep', use: () => this.skill3(), min: 3, max: 16, weight: 2, cd: 5, when: is('shikai') },
        { name: 'surge', use: () => this.release(), min: 3, max: 18, weight: 3, cd: 20, when: () => is('shikai')() && (this.target(20)?.hp ?? 1) / (this.target(20)?.maxHp ?? 1) < 0.6 },
        { name: 'spin', use: () => this.toggle(), min: 4, max: 30, weight: 3, cd: 6, when: () => is('shikai')() && this.g.projectiles.length > 0 },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const f = this.f;
    if (this.form === 'possessed')
      return [
        { key: 'LMB', name: 'Claws', kanji: '爪' },
        { key: 'RMB', name: 'Tentacle Grab', kanji: '触', cost: 14, cd: this.cd.tgrab, cdMax: 4 },
        { key: 'Q', name: 'Fusion', kanji: '霊融', cost: 22, cd: this.cd.volley, cdMax: 7 },
        { key: 'E', name: 'Pounce', kanji: '跳', cost: 12, cd: this.cd.pounce, cdMax: 3.5 },
        { key: 'R', name: 'Touch', kanji: '破壊', cost: 20, cd: this.cd.touch, cdMax: 9, active: this.touchT > 0, timer: this.touchT > 0 ? this.touchT / 6 : undefined, tint: '#9fd08a' },
        { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      ];
    if (this.disarmed())
      return [
        { key: 'LMB', name: 'Fists', kanji: '拳' },
        { key: 'RMB', name: 'Grab & Rip', kanji: '裂', cost: 8, cd: this.cd.grab, cdMax: 2.5 },
        { key: 'Q', name: 'Shakkahō', kanji: '赤火砲', cost: 10, cd: this.cd.shakkaho, cdMax: 1.4 },
        { key: 'E', name: 'Grab & Rip', kanji: '裂', cost: 8, cd: this.cd.grab, cdMax: 2.5 },
        { key: 'R', name: 'Rapid Kidō', kanji: '連', cost: 22, cd: this.cd.rapid, cdMax: 5 },
        { key: 'G', name: 'Guard', kanji: '構', cost: 4, cd: this.cd.counter, cdMax: 2.2 },
        { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      ];
    if (this.form === 'sealed')
      return [
        { key: 'LMB', name: 'Sword', kanji: '剣' },
        { key: 'RMB', name: 'Blink Cut', kanji: '瞬', cost: 12, cd: this.cd.blink, cdMax: 3 },
        { key: 'Q', name: 'Shakkahō', kanji: '赤火砲', cost: 10, cd: this.cd.shakkaho, cdMax: 1.4 },
        { key: 'E', name: 'Grab & Rip', kanji: '裂', cost: 8, cd: this.cd.grab, cdMax: 2.5 },
        { key: 'R', name: 'Rapid Kidō', kanji: '連', cost: 22, cd: this.cd.rapid, cdMax: 5 },
        { key: 'G', name: 'Guard', kanji: '構', cost: 4, active: f.action instanceof CounterAction, cd: this.cd.counter, cdMax: 2.2 },
        { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
        { key: 'F', name: 'Nejibana', kanji: '捩花', cost: 30, tint: '#7fd0ff' },
      ];
    return [
      { key: 'LMB', name: 'Spear Dance', kanji: '捩花' },
      { key: 'RMB', name: 'Crushing Tide', kanji: '潮', cost: 16, cd: this.cd.tide, cdMax: 4 },
      { key: 'Q', name: 'Rising Wave', kanji: '波', cost: 18, cd: this.cd.wave, cdMax: 4 },
      { key: 'E', name: 'Spiral', kanji: '螺旋', cost: 24, cd: this.cd.spiral, cdMax: 6 },
      { key: 'R', name: 'Tidal Sweep', kanji: '薙', cost: 20, cd: this.cd.sweep, cdMax: 5 },
      { key: 'G', name: 'Spin Guard', kanji: '旋', cost: 10, active: f.action instanceof GuardSpinAction, cd: this.cd.guard, cdMax: 4 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      { key: 'F', name: 'Surge', kanji: '逆巻', cost: 60, cd: this.cd.surge, cdMax: 20, tint: '#7fd0ff' },
    ];
  }
}
