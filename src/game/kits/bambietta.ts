// Bambietta Basterbine's kit (docs/kits/bambietta.md). Everything her reishi touches becomes a bomb: what her blade
// cuts, her orbs touch and her hands throw goes off a beat later. LMB the dao (three cuts, each arming what it cuts,
// and a kick that sends an orb point-blank); RMB Tag Strike (one sweep that arms the target and the ground and walls
// along its arc); Q the bomb orbs; E the kick bomb (it bounces, and cutting it does not help); R the explosive globe
// (the tantrum — her own side is not spared); G arm & throw (a boulder ripped out of the ground). Shift with a lock-on:
// behind the target with a bomb tag on its back. F: Quincy: Vollständig — Zofiel (crimson wings budding orbs, the
// star halo, flight): LMB the wing barrage, RMB carpet bombing, Q retreat fire, E the armor trap (the target becomes
// the bomb), R a bigger globe, G the bomb shell round herself, F again Flatland (a rain of orbs over the target).
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef, type PropDef } from '../fighter';
import type { Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import type { AuraStyle } from '../../vfx/aura';
import { DAO_BASE_Z, DAO_TIP_Z, bambiettaAsset, bambiettaProp } from '../../chars/bambietta';
import { BAMBIETTA_CHAIN, BAMBIETTA_CLIPS, BAMBIETTA_STANCE } from '../../chars/bambiettaClips';
import { ArmedBoulder, BombOrb, BombTag, ExplosiveGlobe, KickedOrb, ORB_GLOW, OrbRain, ZOFIEL, blast } from '../../vfx/explode';
import { LightPillar } from '../../vfx/heilig';
import { SphereShape } from '../../destruction/shapes';
import { raycastVoxels } from '../../voxel/raycast';
import { hirenkyakuPuff, hirenkyakuStreak, vollFlight, type Rgb } from './sternritter';

export const AURA_EXPLODE: AuraStyle = { core: '#FFF1F4', body: '#FF4D6D', rim: '#C0102C' };
export const AURA_ZOFIEL: AuraStyle = { core: '#FFC2CF', body: '#D11A3A', rim: '#850A20' };

type BladeDef = NonNullable<FighterDef['blade']>;
const BLADE: BladeDef = { prop: 'dao', base: [0, 0, DAO_BASE_Z], tip: [0, 0, DAO_TIP_Z], color: '#9ED8FF', core: '#F2FAFF' };

const SPEED = { run: 10, sprint: 29, jump: 13.5, dash: 31, dashTime: 0.1 };
const SPEED_ZOFIEL = { run: 12, sprint: 36, jump: 14, dash: 38, dashTime: 0.1 };
const ZOFIEL_TIME = 40;
const ZOFIEL_CD = 20;
const PINK: Rgb = [1, 0.35, 0.45];

export const BAMBIETTA_DEF: FighterDef = {
  id: 'bambietta',
  name: 'Bambietta Basterbine',
  title: 'Sternritter "E" — The Explode',
  build: () => ({ asset: bambiettaAsset('base'), props: [{ key: 'dao', model: bambiettaProp('dao'), socket: 'grip.R' }] }),
  stance: BAMBIETTA_STANCE,
  clips: BAMBIETTA_CLIPS,
  aura: AURA_EXPLODE,
  blade: BLADE,
  hp: 1000,
  rei: 240,
  speed: { ...SPEED },
  radius: 0.28,
  height: 1.56,
};

const _v = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

// ---------------------------------------------------------------------------------------------- actions

/** A cut (or the kick) of the string: the clip, an approach dash, the blade's window, its events to the kit. */
class CutAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private hitAt = -1;
  private stopAt = 0;
  queued = false;

  constructor(readonly kit: BambiettaKit, readonly clip: string, readonly index: number, readonly spec: BladeSpec | null, readonly onEvent: (n: string) => void) {
    super();
    this.name = clip;
    this.mobility = 0.18;
    this.airGravity = 0.2;
  }

  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.62;
    this.hitAt = c.events.hit ?? -1;
    if (this.spec) {
      f.bladeHits.clear();
      f.bladeSpec = this.spec;
    }
    const tgt = f.faceTarget;
    let dashed = false;
    if (tgt && this.hitAt > 0) {
      const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
      this.stopAt = 1.5;
      if (d > this.stopAt + 0.25 && d < 7) {
        const tau = Math.max(0.06, this.hitAt - 0.06);
        const per = (1 - Math.exp(-f.pushDrag * tau)) / f.pushDrag;
        f.push.addScaledVector(f.forward(), Math.min(28, (d - this.stopAt) / per));
        dashed = true;
      }
    }
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n === 'step') {
          if (!dashed) f.push.addScaledVector(f.forward(), 3);
          g.sfx.play('swing', f.center(), 0.7);
        }
        this.onEvent(n);
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
    if (this.spec) {
      const open = this.hitAt >= 0 && t >= this.hitAt - 0.08 && t <= this.hitAt + 0.12;
      f.bladeActive = open;
      if (f.trail) f.trail.emitting = open;
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
    if (next.name === 'dash' || next instanceof ClipSkill) return this.t >= this.hitAt + 0.05;
    return false;
  }
}

/** One clip, its events to a callback, done when it ends. */
class ClipSkill extends FighterAction {
  private dur = 1;
  constructor(readonly name: string, readonly clip: string, private on: (n: string) => void, o: { armor?: number; mobility?: number; invulnerable?: boolean; spec?: BladeSpec; window?: [number, number] } = {}) {
    super();
    this.armor = o.armor ?? 0;
    this.mobility = o.mobility ?? 0.1;
    this.invulnerable = !!o.invulnerable;
    this.airGravity = 0.1;
    this.spec = o.spec ?? null;
    this.window = o.window ?? null;
  }
  private spec: BladeSpec | null;
  private window: [number, number] | null;
  override start(f: Fighter): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    if (this.spec) {
      f.bladeHits.clear();
      f.bladeSpec = this.spec;
    }
    f.anim.play(this.clip, { onEvent: this.on });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.window) {
      const open = this.t >= this.window[0] && this.t <= this.window[1];
      f.bladeActive = open;
      if (f.trail) f.trail.emitting = open;
    }
    if (this.t >= this.dur) this.done = true;
  }
  override end(f: Fighter): void {
    f.bladeActive = false;
    if (f.trail) f.trail.emitting = false;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' ? this.t > this.dur * 0.55 : next instanceof ClipSkill && this.t > this.dur * 0.6;
  }
}

/** A dart (carpet bombing, retreat fire): pushed along, dropping or firing orbs as it goes. */
class DartAction extends FighterAction {
  readonly name: string;
  private next = 0;
  constructor(readonly kit: BambiettaKit, name: string, readonly dir: THREE.Vector3, readonly speed: number, readonly dur: number, readonly every: number, readonly drop: (f: Fighter) => void) {
    super();
    this.name = name;
    this.mobility = 0;
    this.airGravity = 0;
  }
  override start(f: Fighter): void {
    f.anim.play('bb_barrage', { fadeIn: 0.06 });
    f.ghosts.spawn(0.3, 0.8);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    f.push.set(this.dir.x * this.speed, 0, this.dir.z * this.speed);
    this.next -= dt;
    if (this.next <= 0) {
      this.next = this.every;
      this.drop(f);
    }
    if (this.t >= this.dur) {
      this.done = true;
      f.push.multiplyScalar(0.3);
    }
  }
}

// ---------------------------------------------------------------------------------------------- the kit

type Form = 'base' | 'zofiel';

export class BambiettaKit implements Kit {
  form: Form = 'base';
  flare = false;
  comboIndex = 0;
  private lastEnd = 0;
  zofielT = 0;
  zofielCd = 0;
  private wasDashing = false;
  readonly cd = { tag: 0, orbs: 0, kick: 0, globe: 0, hurl: 0, back: 0, carpet: 0, retreat: 0, trap: 0, shell: 0, flatland: 0 };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.data.quincy = true;
    this.hands();
    this.applyStats();
  }

  private hands(): void {
    const rig = this.f.visual.rig;
    rig.setBoneVisible('fist.R', true);
    rig.setBoneVisible('palm.R', false);
    rig.setBoneVisible('fist.L', false);
    rig.setBoneVisible('palm.L', true);
  }

  private props(): PropDef[] {
    const p: PropDef[] = [{ key: 'dao', model: bambiettaProp('dao'), socket: 'grip.R' }];
    if (this.form === 'zofiel') p.push({ key: 'halo', model: bambiettaProp('halo'), socket: 'halo' });
    return p;
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    this.zofielCd = Math.max(0, this.zofielCd - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
      // the ground round her sparkles, armed
      if (Math.random() < 0.6) {
        const a = Math.random() * Math.PI * 2, r = 1 + Math.random() * 3;
        g.engine.glow.spawn({ x: f.pos.x + Math.cos(a) * r, y: f.pos.y + 0.1, z: f.pos.z + Math.sin(a) * r, vy: 0.6, size: 0.12, sizeEnd: 0.02, life: 0.4, r: 1, g: 0.35, b: 0.45, alpha: 1, alphaEnd: 0, tex: 0 });
      }
    }
    // Hirenkyaku; with a lock-on, behind the target with a tag on its back
    const dashing = f.dashT > 0;
    if (dashing && !this.wasDashing) {
      const lock = f === g.player ? g.hud?.lockTarget ?? null : null;
      if (lock && !lock.dead && lock.pos.distanceTo(f.pos) < 25 && this.cd.back <= 0) this.behind(lock);
      else hirenkyakuPuff(g, f, PINK);
    }
    if (dashing) hirenkyakuStreak(g, f, PINK);
    this.wasDashing = dashing;
    if (this.form === 'zofiel') {
      this.zofielT -= dt;
      vollFlight(g, f, this.target(), 3);
      if (Math.random() < dt * 10) {
        const w = sock(f, 'back');
        const s = Math.random() < 0.5 ? 1 : -1;
        g.engine.glow.spawn({ x: w.x + s * (0.4 + Math.random() * 0.9), y: w.y - Math.random() * 0.6, z: w.z, vy: -0.4, size: 0.1, sizeEnd: 0.02, life: 0.6, r: 1, g: 0.4, b: 0.5, alpha: 0.9, alphaEnd: 0, tex: 0 });
      }
      if (this.zofielT <= 0) this.leaveZofiel();
    }
  }

  target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 90, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 90);
  }

  private near(range: number): Fighter | null {
    const t = this.target();
    return t && t.pos.distanceTo(this.f.pos) <= range ? t : null;
  }

  private aimAt(from: THREE.Vector3): THREE.Vector3 {
    const t = this.target();
    if (t) return t.center().sub(from).normalize();
    return this.f.forward(new THREE.Vector3());
  }

  /** a small tag on a body her blade has cut (they stack to three) */
  private arm(t: Fighter, dmg: number, fuse = 0.8): void {
    const live = this.g.projectiles.filter((p) => p instanceof BombTag && p.target === t && !p.done).length;
    if (live >= 3) return;
    const at = t.center().add(_v.set((Math.random() - 0.5) * 0.4, (Math.random() - 0.3) * 0.6, (Math.random() - 0.5) * 0.4));
    this.g.addProjectile(new BombTag(this.g, this.f, t, at, fuse, dmg, 1.3, { knock: 4, launch: 2, size: 0.25 }));
  }

  // ---------------------------------------------------------------- the string

  attack(): void {
    const { f, g } = this;
    if (this.form === 'zofiel') {
      this.barrage();
      return;
    }
    const cur = f.action;
    if (cur instanceof CutAction && BAMBIETTA_CHAIN.includes(cur.clip)) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (g.time - this.lastEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const { f, g } = this;
    const idx = i % BAMBIETTA_CHAIN.length;
    const clip = BAMBIETTA_CHAIN[idx];
    this.comboIndex = idx + 1;
    this.lastEnd = g.time + 0.65;
    if (clip === 'bb_kick') {
      f.act(new CutAction(this, clip, idx, null, (n) => {
        if (n !== 'hit') return;
        // the orb dropped at her boot, kicked point-blank
        const from = sock(f, 'toe.R').add(_v.set(0, 0.25, 0));
        g.addProjectile(new BombOrb(g, f, from, this.aimAt(from), { dmg: 20, r: 1.8, fuse: 0.35, speed: 26, size: 0.22 }));
      }), true);
      return;
    }
    const spec: BladeSpec = {
      damage: idx === 2 ? 12 : 10, knock: 4, launch: 0, hitstop: 0.05, shake: 0.12, cut: 420, reach: 0.18,
      onHit: (o) => this.arm(o, 12),
    };
    f.act(new CutAction(this, clip, idx, spec, () => {}), true);
  }

  // ---------------------------------------------------------------- the moves

  private special(a: FighterAction, cost: number, cdKey: keyof typeof this.cd, cd: number): boolean {
    const f = this.f;
    if (this.cd[cdKey] > 0) return false;
    if (f.action && !f.action.canCancel(a)) return false;
    if (f.hitstun > 0 || f.dashT > 0 || f.dead) return false;
    if (!f.spendRei(cost)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return false;
    }
    this.cd[cdKey] = cd;
    f.act(a, true);
    return true;
  }

  /** RMB: Tag Strike; Zofiel: carpet bombing */
  heavy(): void {
    const { f, g } = this;
    if (this.form === 'zofiel') {
      const dir = f.forward(new THREE.Vector3());
      const t = this.target();
      if (t) dir.subVectors(t.pos, f.pos).setY(0).normalize();
      this.special(new DartAction(this, 'carpet', dir, 24, 0.6, 0.06, (b) => {
        const at = b.pos.clone().add(_v.set(0, 0.6, 0));
        g.addProjectile(new BombOrb(g, b, at, new THREE.Vector3(0, -1, 0), { dmg: 22, r: 2.2, fuse: 0.35, speed: 6, gravity: 20, size: 0.2 }));
      }), 20, 'carpet', 5);
      return;
    }
    const spec: BladeSpec = { damage: 28, knock: 10, launch: 2, heavy: true, hitstop: 0.1, shake: 0.35, cut: 700, reach: 0.22, onHit: (o) => this.arm(o, 40, 0.7) };
    this.special(new CutAction(this, 'bb_tag', 0, spec, (n) => n === 'hit' && this.tagArc()), 14, 'tag', 3.5);
  }

  /** the arc of the Tag Strike: charges on the ground and the walls it passed, going off one after another */
  private tagArc(): void {
    const { f, g } = this;
    const c = f.center();
    const fw = f.forward();
    const right = new THREE.Vector3(-fw.z, 0, fw.x);
    let n = 0;
    for (let a = -1.2; a <= 1.21; a += 0.2) {
      // along the blade's reach and a little past it, the arc swept level
      for (const d of [1.6, 2.6, 3.6]) {
        const p = c.clone().addScaledVector(fw, Math.cos(a) * d).addScaledVector(right, Math.sin(a) * d);
        const down = raycastVoxels(g.engine.world, p.x, p.y + 0.5, p.z, 0, -1, 0, 1.8);
        const solid = g.engine.world.get(Math.floor(p.x / g.engine.world.vs), Math.floor(p.y / g.engine.world.vs), Math.floor(p.z / g.engine.world.vs)) !== 0;
        if (!down && !solid) continue;
        const at = down ? p.clone().add(_v.set(0, 0.5 - down.dist, 0)) : p;
        g.addProjectile(new BombTag(g, f, null, at, 0.6 + n * 0.05, 24, 1.4, { quiet: n % 3 !== 0, size: 0.22 }));
        n++;
        break;
      }
    }
  }

  /** Q: the bomb orbs; Zofiel: retreat fire */
  skill1(): void {
    const { f, g } = this;
    if (this.form === 'zofiel') {
      const back = f.forward(new THREE.Vector3()).negate();
      this.special(new DartAction(this, 'retreat', back, 18, 0.7, 0.055, (b) => {
        const from = sock(b, 'back').add(_v.set((Math.random() - 0.5) * 1.2, -0.2, 0));
        const dir = this.aimAt(from).add(_v.set((Math.random() - 0.5) * 0.25, (Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.25)).normalize();
        g.addProjectile(new BombOrb(g, b, from, dir, { dmg: 14, r: 1.6, fuse: 0.3, speed: 32 }));
      }), 22, 'retreat', 6);
      return;
    }
    const on = (n: string): void => {
      if (n[0] !== 'o') return;
      const from = sock(f, 'palm.L');
      const dir = this.aimAt(from).applyAxisAngle(UP, (Number(n[1]) - 1) * 0.08);
      g.addProjectile(new BombOrb(g, f, from, dir, { dmg: 20, r: 1.8, fuse: 0.5, speed: 34 }));
      g.sfx.play('arrow', from, 0.5);
    };
    this.special(new ClipSkill('orbs', 'bb_flick', on, { mobility: 0.3 }), 12, 'orbs', 2.2);
  }

  /** E: the kick bomb; Zofiel: the armor trap */
  skill2(): void {
    const { f, g } = this;
    if (this.form === 'zofiel') {
      const t = this.near(40);
      if (!t) {
        if (f === g.player) g.hud?.showBanner('No one in reach');
        return;
      }
      this.special(new ClipSkill('trap', 'bb_point', (n) => {
        if (n !== 'mark') return;
        g.addProjectile(new BombTag(g, f, t, t.center(), 2.5, 90, 2.6, { unblockable: true, power: 900, knock: 16, launch: 8, size: 0.6 }));
        g.callout('', 'YOUR ARMOR IS THE BOMB', ZOFIEL);
      }, { mobility: 0.3 }), 26, 'trap', 10);
      return;
    }
    this.special(new ClipSkill('kick', 'bb_kickbomb', (n) => {
      if (n !== 'kick') return;
      const from = sock(f, 'toe.R').add(_v.set(0, 0.3, 0));
      g.addProjectile(new KickedOrb(g, f, from, this.aimAt(from), 45, 3, 30));
      g.sfx.play('hitHeavy', from, 0.6);
    }, { mobility: 0.1 }), 16, 'kick', 4);
  }

  /** R: the explosive globe */
  skill3(): void {
    const { f, g } = this;
    const z = this.form === 'zofiel';
    if (this.special(new ClipSkill('globe', 'bb_globe', (n) => {
      if (n === 'charge') g.addProjectile(new ExplosiveGlobe(g, f, z ? 16 : 12, z ? 90 : 70, 0.5));
    }, { mobility: 0, armor: 0.6 }), 45, 'globe', 18)) g.callout('', 'THE EXPLODE', ORB_GLOW);
  }

  /** G: arm & throw; Zofiel: the bomb shell */
  toggle(): void {
    const { f, g } = this;
    if (this.form === 'zofiel') {
      this.special(new ClipSkill('shell', 'bb_shell', (n) => {
        if (n !== 'burst') return;
        // she blows herself free: binds broken, attackers thrown, shots undone
        f.rooted = false;
        f.slowT = 0;
        f.armLockT = 0;
        g.rejectNear(f.center(), 4.5, f, true);
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          blast(g, f, f.center().add(_v.set(Math.cos(a) * 2.2, 0, Math.sin(a) * 2.2)), 2.2, i === 0 ? 30 : 0, { quiet: i > 0, knock: 14, launch: 6 });
        }
      }, { mobility: 0, invulnerable: true }), 18, 'shell', 8);
      return;
    }
    let rock: ArmedBoulder | null = null;
    this.special(new ClipSkill('hurl', 'bb_hurl', (n) => {
      if (n === 'rip') {
        // the chunk out of the ground before her; a hole left behind
        const at = f.pos.clone().addScaledVector(f.forward(), 1.2);
        g.engine.destruction.carve(new SphereShape(at, 1.0, 0.5), { mode: 'smash', power: 400, impulse: 6, debris: 0.15 });
        rock = new ArmedBoulder(g, f, bambiettaProp('boulder'), () => sock(f, 'palm.L'), 60, 3.5);
        g.addProjectile(rock);
      }
      if (n === 'throw' && rock) {
        const t = this.target();
        rock.throwAt(t ? t.pos.clone() : f.pos.clone().addScaledVector(f.forward(), 18));
        g.sfx.play('swingHeavy', f.center(), 1);
      }
    }, { mobility: 0, armor: 0.3 }), 22, 'hurl', 7);
  }

  /** Shift with a lock: behind the target, a tag slapped on its back */
  behind(t: Fighter): boolean {
    const { f, g } = this;
    if (this.cd.back > 0 || f.dead || t.dead) return false;
    if (!f.spendRei(6)) return false;
    this.cd.back = 7;
    f.ghosts.spawn(0.35, 1);
    const behind = t.pos.clone().addScaledVector(t.forward(_v), -1.1);
    f.body.pos.set(behind.x, Math.max(t.pos.y, f.pos.y - 0.5), behind.z);
    f.body.prev.copy(f.body.pos);
    f.body.vel.set(0, 0, 0);
    f.dashT = 0;
    f.yaw = Math.atan2(t.pos.x - f.pos.x, t.pos.z - f.pos.z);
    f.faceTarget = t.center();
    hirenkyakuPuff(g, f, PINK);
    g.addProjectile(new BombTag(g, f, t, t.center().addScaledVector(t.forward(_v), -0.25), 1.2, 30, 1.8, { size: 0.35 }));
    return true;
  }

  // ---------------------------------------------------------------- Zofiel

  /** LMB in Zofiel: orbs sprayed from under the wings */
  private barrage(): void {
    const { f, g } = this;
    this.special(new ClipSkill('barrage', 'bb_barrage', (n) => {
      if (n !== 'fire') return;
      const back = sock(f, 'back');
      const right = new THREE.Vector3(-Math.cos(f.yaw), 0, Math.sin(f.yaw));
      for (let i = 0; i < 5; i++) {
        const s = i % 2 ? 1 : -1;
        const from = back.clone().addScaledVector(right, s * (0.8 + i * 0.2)).add(_v.set(0, -0.3, 0));
        const dir = this.aimAt(from).add(_v.set((Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.2)).normalize();
        g.addProjectile(new BombOrb(g, f, from, dir, { dmg: 14, r: 1.6, fuse: 0.25, speed: 36 }));
      }
    }, { mobility: 0.4 }), 4, 'orbs', 0.45);
  }

  /** F: Zofiel; in it, Flatland */
  release(): void {
    const { f, g } = this;
    if (f.busy) return;
    if (this.form === 'zofiel') {
      const t = this.near(60);
      if (!t) return;
      if (this.special(new ClipSkill('flatland', 'bb_rise', (n) => n === 'rain' && this.flatland(t), { mobility: 0, armor: 0.5 }), 40, 'flatland', 15)) g.callout('', 'FLATLAND', ZOFIEL);
      return;
    }
    if (this.zofielCd > 0) {
      if (f === g.player) g.hud?.showBanner('Not yet');
      return;
    }
    if (!f.spendRei(50)) {
      if (f === g.player) g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(new ClipSkill('release', 'bb_zofiel', (n) => n === 'burst' && this.becomeZofiel(), { invulnerable: true, mobility: 0 }), true);
  }

  /** a rain of orbs over a wide disc round the target */
  private flatland(t: Fighter): void {
    this.g.addProjectile(new OrbRain(this.g, this.f, t.pos.clone(), 40, 2.5, 8, 18, t));
  }

  private becomeZofiel(): void {
    const { f, g } = this;
    if (this.form === 'zofiel') return;
    this.form = 'zofiel';
    this.zofielT = ZOFIEL_TIME;
    f.rooted = false;
    f.slowT = 0;
    f.def = { ...f.def, speed: { ...SPEED_ZOFIEL } };
    f.setForm({ asset: bambiettaAsset('zofiel'), props: this.props() }, AURA_ZOFIEL);
    this.hands();
    g.addProjectile(new LightPillar(g, f.pos.clone(), 1.4, 70, ZOFIEL));
    f.aura.pillarBurst(2.2);
    f.aura.flare(2, 1);
    g.addRing(f.pos.clone(), 12, ZOFIEL, 0.6);
    g.shake(f === g.player ? 0.5 : 0.2);
    g.callout('神の炎', 'QUINCY: VOLLSTÄNDIG — ZOFIEL', ZOFIEL);
    g.sfx.play('bankai', f.center());
    this.applyStats();
  }

  private leaveZofiel(): void {
    const { f } = this;
    this.form = 'base';
    this.zofielCd = ZOFIEL_CD;
    f.mounted = false;
    f.def = { ...f.def, speed: { ...SPEED } };
    f.setForm({ asset: bambiettaAsset('base'), props: this.props() }, AURA_EXPLODE);
    this.hands();
    this.applyStats();
  }

  private applyStats(): void {
    const f = this.f;
    const z = this.form === 'zofiel';
    f.power = (z ? 1.45 : 1) * (this.flare ? 1.25 : 1);
    f.damageTaken = z ? 0.85 : 1;
    f.toughness = z ? 8 : 4;
    f.aura.target = this.flare ? 0.9 : z ? 0.5 : 0.06;
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

  formName(): string {
    return this.form === 'zofiel' ? `Zofiel · ${Math.max(0, Math.ceil(this.zofielT))} s` : 'Sternritter "E" — The Explode';
  }

  ai(): KitAI {
    const base = () => this.form === 'base';
    const zof = () => this.form === 'zofiel';
    const hpK = () => this.f.hp / this.f.maxHp;
    return {
      // she holds mid range and hates melee
      reach: 2,
      chain: 4,
      releaseAt: 0.55,
      ranged: () => true,
      moves: [
        { name: 'orbs', use: () => this.skill1(), min: 5, max: 26, weight: 2.2, cd: 2.2, when: base },
        { name: 'kick', use: () => this.skill2(), min: 4, max: 22, weight: 1.6, cd: 4, when: base },
        { name: 'tag', use: () => this.heavy(), min: 0, max: 4, weight: 2, cd: 3.5, when: base },
        { name: 'hurl', use: () => this.toggle(), min: 7, max: 26, weight: 1.2, cd: 7, when: base },
        { name: 'globe', use: () => this.skill3(), min: 0, max: 8, weight: 2.4, cd: 18, when: () => hpK() < 0.6 },
        { name: 'behind', use: () => { const t = this.target(); if (t) this.behind(t); }, min: 3, max: 16, weight: 0.8, cd: 9, when: base },
        { name: 'barrage', use: () => this.attack(), min: 3, max: 40, weight: 3, cd: 0.6, when: zof },
        { name: 'carpet', use: () => this.heavy(), min: 4, max: 18, weight: 1.4, cd: 5, when: zof },
        { name: 'retreat', use: () => this.skill1(), min: 0, max: 7, weight: 2.2, cd: 6, when: zof },
        { name: 'trap', use: () => this.skill2(), min: 3, max: 30, weight: 1.4, cd: 10, when: zof },
        { name: 'shell', use: () => this.toggle(), min: 0, max: 3, weight: 2, cd: 8, when: () => zof() && (this.f.rooted || this.f.hitstun > 0) },
        { name: 'flatland', use: () => this.release(), min: 6, max: 40, weight: 2, cd: 15, when: zof },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    if (this.form === 'zofiel') {
      return [
        { key: 'LMB', name: 'Wing barrage', kanji: '翼弾' },
        { key: 'RMB', name: 'Carpet bombing', kanji: '絨毯', cost: 20, cd: cd.carpet, cdMax: 5, tint: ZOFIEL },
        { key: 'Q', name: 'Retreat fire', kanji: '退射', cost: 22, cd: cd.retreat, cdMax: 6, tint: ZOFIEL },
        { key: 'E', name: 'Armor trap', kanji: '鎧爆', cost: 26, cd: cd.trap, cdMax: 10, tint: ZOFIEL },
        { key: 'R', name: 'Explosive globe', kanji: '爆球', cost: 45, cd: cd.globe, cdMax: 18, tint: ORB_GLOW },
        { key: 'G', name: 'Bomb shell', kanji: '殻', cost: 18, cd: cd.shell, cdMax: 8, tint: ZOFIEL },
        { key: 'F', name: 'Flatland', kanji: '平地', cost: 40, cd: cd.flatland, cdMax: 15, active: true, timer: this.zofielT / ZOFIEL_TIME, tint: ZOFIEL },
        { key: 'Shift', name: 'Hirenkyaku', kanji: '飛廉脚', cost: 4 },
        { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      ];
    }
    return [
      { key: 'LMB', name: 'Reishi dao', kanji: '刀' },
      { key: 'RMB', name: 'Tag Strike', kanji: '爆印', cost: 14, cd: cd.tag, cdMax: 3.5, tint: ORB_GLOW },
      { key: 'Q', name: 'Bomb orbs', kanji: '爆弾', cost: 12, cd: cd.orbs, cdMax: 2.2, tint: ORB_GLOW },
      { key: 'E', name: 'Kick bomb', kanji: '蹴爆', cost: 16, cd: cd.kick, cdMax: 4, tint: ORB_GLOW },
      { key: 'R', name: 'Explosive globe', kanji: '爆球', cost: 45, cd: cd.globe, cdMax: 18, tint: ORB_GLOW },
      { key: 'G', name: 'Arm & throw', kanji: '投爆', cost: 22, cd: cd.hurl, cdMax: 7, tint: ORB_GLOW },
      { key: 'F', name: 'Zofiel', kanji: '神の炎', cost: 50, cd: this.zofielCd, cdMax: ZOFIEL_CD, tint: ZOFIEL },
      { key: 'Shift', name: 'Hirenkyaku / tag', kanji: '飛廉脚', cost: 4, cd: cd.back, cdMax: 7 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
    ];
  }
}
