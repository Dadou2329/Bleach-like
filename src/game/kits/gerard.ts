// Gerard Valkyrie's kit (docs/kits/gerard.md). The Miracle: every wound he takes is the people's fear given form, and
// fear makes him bigger. The Miracle meter fills with his wounds, with being outnumbered and with being near death;
// full, he grows a Godly Size step (×6 → ×10 → ×14: 13, 22, 31 m) and every wound is gone — a blow that would kill him
// is turned into size too while a step remains. Hoffnung turns a blade that meets it back on its wielder (×2.5)
// unless that blade is ice. Killed at full size his heart rebuilds him in Aschtonig; killed in Aschtonig he re-forms
// as the golden knight, whose light burns out; then the skeleton topples.
// Human: the string (overhead, shield bash, cleave, slam), RMB Road-Breaker, Q the flying slash, E the cape wall, R
// Heilig Bogen, G Blut Vene, F Aschtonig (the Zeichen drawn in his blood), V Za Mirakuru (the next step at once with
// half a meter; a Miracle Sense pulse with less). Shift: the Valkyrie Leap at a far target, the shield charge near.
// Godly Size: the backhand, the cleave through the buildings, the stomp; Branch Breaker; the tower toss; the gale
// breath; the lariat; grab and crush; the strides trample what they cross; a heavy blow at the feet of a striding
// giant topples him. Aschtonig (either size): Q the Hoffnung beam, E the slash wake, R the shield throw, G Heilig
// Bogen, wings at will (flight), immune to freezing, binding and the elements.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef, type PropDef } from '../fighter';
import type { DamageOpts, Game, Projectile } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import type { AuraStyle } from '../../vfx/aura';
import { gerardAsset, gerardProp, HOFFNUNG_BASE_Z, HOFFNUNG_TIP_Z } from '../../chars/gerard';
import { GERARD_CHAIN, GERARD_CLIPS, GERARD_STANCE, GIANT_CHAIN, KNIGHT_CHAIN, KNIGHT_CLIPS, KNIGHT_STANCE } from '../../chars/gerardClips';
import { GetsugaProjectile } from '../projectiles/getsuga';
import { CeroBeam } from '../projectiles/cero';
import { CeroShot } from '../../vfx/lobos';
import { LightPillar } from '../../vfx/heilig';
import { LiftedChunk, chunkKeys } from '../../vfx/power';
import { CapsuleShape, SphereShape } from '../../destruction/shapes';
import { PropMesh } from '../characterFactory';
import { TEX_GLOW, TEX_PUFF, TEX_RING, TEX_STREAK } from '../../vfx/sprites';
import { hirenkyakuPuff, vollFlight, type Rgb } from './sternritter';

export const AURA_GERARD: AuraStyle = { core: '#FFF4D6', body: '#F2D27A', rim: '#9A6E18' };
export const AURA_ASCH: AuraStyle = { core: '#FFF6D8', body: '#F2C74E', rim: '#A87A1C' };
export const AURA_KNIGHT: AuraStyle = { core: '#FFF8E0', body: '#FFD86A', rim: '#B88A2C' };
const GOLD = '#F2C74E';
const GOLD_LIGHT = '#FFF0C0';
const RED = '#C3232B';
const HOPE = '#E6E9EE';
const TINT: Rgb = [1, 0.86, 0.5];

/** the visual scale of each Godly Size step (0: a man) */
const STEPS = [1, 6, 10, 14];
const HEIGHT = 2.22;
const RADIUS = 0.42;
const SPEED = { run: 8.4, sprint: 24, jump: 13, dash: 26, dashTime: 0.12 };
const ICE = /^(hitsugaya|hitsugaya-tybw|rukia)$/;

const BLADE = { prop: 'sword', base: [0, 0, HOFFNUNG_BASE_Z] as [number, number, number], tip: [0, 0, HOFFNUNG_TIP_Z] as [number, number, number], color: '#5A5A66', core: '#F3F3F0' };

export const GERARD_DEF: FighterDef = {
  id: 'gerard',
  name: 'Gerard Valkyrie',
  title: 'Sternritter "M" — The Miracle',
  build: () => ({ asset: gerardAsset('helm'), props: [{ key: 'sword', model: gerardProp('hoffnung'), socket: 'grip.R' }, { key: 'shield', model: gerardProp('shield'), socket: 'shield' }] }),
  stance: GERARD_STANCE,
  clips: GERARD_CLIPS,
  aura: AURA_GERARD,
  blade: BLADE,
  hp: 1000,
  rei: 240,
  speed: { ...SPEED },
  radius: RADIUS,
  height: HEIGHT,
};

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

function boneAt(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  if (f.visual.rig.index(name) < 0) return f.center(out);
  const b = f.visual.rig.bone(name);
  b.updateWorldMatrix(true, false);
  return b.getWorldPosition(out);
}

/** the height of the ground under a point (searching down from it), or null */
function floorAt(g: Game, p: THREE.Vector3, depth = 40): number | null {
  const w = g.engine.world, vs = w.vs;
  const x = Math.floor(p.x / vs), z = Math.floor(p.z / vs);
  for (let y = Math.floor(p.y / vs); y > Math.floor((p.y - depth) / vs) && y >= 0; y--) if (w.isSolid(x, y, z)) return (y + 1) * vs;
  return null;
}

// ---------------------------------------------------------------------------------------------- actions

interface SkillOpts {
  armor?: number;
  mobility?: number;
  invulnerable?: boolean;
  tick?: (t: number, dt: number) => void;
  end?: () => void;
  dur?: number;
}

class ClipSkill extends FighterAction {
  private dur = 1;
  constructor(readonly name: string, readonly clip: string, private on: (n: string) => void, private o: SkillOpts = {}) {
    super();
    this.armor = o.armor ?? 0.2;
    this.mobility = o.mobility ?? 0.12;
    this.invulnerable = !!o.invulnerable;
    this.airGravity = 0.6;
  }
  override start(f: Fighter): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = this.o.dur ?? c.dur - c.fadeOut * 0.5;
    f.anim.play(this.clip, { onEvent: this.on, hold: this.o.dur !== undefined && this.o.dur > c.dur });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    this.o.tick?.(this.t, dt);
    if (this.t >= this.dur) this.done = true;
  }
  override end(): void {
    this.o.end?.();
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' ? this.t > this.dur * 0.6 : next instanceof ClipSkill && this.t > this.dur * 0.75;
  }
}

/** one blow of a string — a sword swing sweeps Hoffnung, a body blow calls back — a press queued runs on at the combo point */
class StringAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private hitAt = -1;
  queued = false;
  constructor(readonly kit: GerardKit, readonly clip: string, readonly next: () => void, readonly spec: BladeSpec | null, readonly onEvent: (n: string) => void = () => {}) {
    super();
    this.name = clip;
    this.mobility = 0.14;
    this.armor = kit.step > 0 ? 0.5 : 0.15;
    this.airGravity = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.62;
    this.hitAt = c.events.hit ?? -1;
    f.bladeHits.clear();
    f.bladeSpec = this.spec;
    const k = this.kit.size;
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n === 'step') {
          f.push.addScaledVector(f.forward(), 3 * Math.sqrt(k));
          g.sfx.play(k > 2 ? 'swingHeavy' : 'swing', f.center(), Math.min(1.6, 0.7 + k * 0.08));
        }
        this.onEvent(n);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const open = !!this.spec && this.hitAt >= 0 && this.t >= this.hitAt - 0.1 && this.t <= this.hitAt + 0.14;
    f.bladeActive = open;
    if (f.trail) f.trail.emitting = open;
    if (this.queued && this.t >= this.comboAt) {
      this.done = true;
      this.next();
      return;
    }
    if (this.t >= this.dur) this.done = true;
  }
  override end(f: Fighter): void {
    f.bladeActive = false;
    if (f.trail) f.trail.emitting = false;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' || next instanceof ClipSkill ? this.t >= this.comboAt * 0.85 : false;
  }
}

// ---------------------------------------------------------------------------------------------- the props in flight

/** The cape stretched into a wall: a slab of red cloth voxels across his front; it falls away when its time is up. */
class CapeWall implements Projectile {
  done = false;
  private t = 0;
  private keys: number[] = [];
  constructor(private g: Game, readonly owner: Fighter, center: THREE.Vector3, normal: THREE.Vector3, readonly dur = 8, half = 4, height = 4.2) {
    const w = g.engine.world, vs = w.vs;
    const id = w.mats.id('cape_red');
    const n = normal.clone().setY(0).normalize();
    const side = new THREE.Vector3(-n.z, 0, n.x);
    const gy = floorAt(g, center.clone().setY(center.y + 1), 6) ?? center.y;
    const ext = half + 1;
    const x0 = Math.floor((center.x - ext) / vs), x1 = Math.ceil((center.x + ext) / vs);
    const z0 = Math.floor((center.z - ext) / vs), z1 = Math.ceil((center.z + ext) / vs);
    const y0 = Math.floor(gy / vs), y1 = Math.floor((gy + height) / vs);
    for (let z = z0; z <= z1; z++)
      for (let x = x0; x <= x1; x++) {
        const px = (x + 0.5) * vs - center.x, pz = (z + 0.5) * vs - center.z;
        const across = px * n.x + pz * n.z;
        const along = px * side.x + pz * side.z;
        // a slight billow: the middle bellied out toward the enemy
        const belly = 0.35 * (1 - (along / half) ** 2);
        if (Math.abs(across - belly) > 0.13 || Math.abs(along) > half) continue;
        // the top edge ragged a little, the corners lower like a cloth held up by its middle
        const top = y1 - Math.round(Math.abs(along / half) ** 2 * 3 / vs * 0.12);
        for (let y = y0; y <= top; y++) {
          if (!w.inBounds(x, y, z) || w.get(x, y, z) !== 0) continue;
          w.set(x, y, z, id);
          this.keys.push(x + w.sx * (y + w.sy * z));
        }
      }
    g.sfx.play('swingHeavy', center, 1.1);
    for (let i = 0; i < 14; i++) {
      const a = (i / 13 - 0.5) * 2 * half;
      g.engine.dust.spawn({ x: center.x + side.x * a, y: gy + 0.3, z: center.z + side.z * a, vx: n.x * 2, vy: 1.4, vz: n.z * 2, size: 0.6, sizeEnd: 1.8, life: 0.8, r: 0.62, g: 0.58, b: 0.52, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
    }
  }
  update(dt: number): void {
    this.t += dt;
    if (this.t < this.dur) return;
    this.dispose();
    this.done = true;
  }
  dispose(): void {
    const w = this.g.engine.world, id = w.mats.id('cape_red');
    const sx = w.sx, sxy = w.sx * w.sy;
    for (const key of this.keys) {
      const x = key % sx, y = Math.floor(key / sx) % w.sy, z = Math.floor(key / sxy);
      if (w.get(x, y, z) === id) w.set(x, y, z, 0);
    }
    this.keys.length = 0;
  }
}

/**
 * Heilig Bogen's arrow: a torrent of pure power — no special property for anything to cancel: no guard, catch or
 * rejection stops it (it carries no `reject`), and it tunnels through whatever stands on its line.
 */
class TorrentArrow implements Projectile {
  done = false;
  readonly pos: THREE.Vector3;
  private mesh: THREE.Mesh;
  private travelled = 0;
  private hit = new Set<number>();
  private carveAt = 0;
  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, readonly dir: THREE.Vector3, readonly damage: number, readonly r: number, readonly range = 90, readonly speed = 110) {
    this.pos = from.clone();
    this.dir.normalize();
    const geo = new THREE.CylinderGeometry(r * 0.35, r * 0.55, r * 7, 10, 1);
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(RED).multiplyScalar(2.4), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.frustumCulled = false;
    this.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), this.dir);
    this.mesh.position.copy(this.pos);
    g.engine.gr.scene.add(this.mesh);
    g.sfx.play('arrow', from, 1.4);
  }
  update(dt: number, g: Game): void {
    const step = this.speed * dt;
    const from = this.pos.clone();
    this.pos.addScaledVector(this.dir, step);
    this.travelled += step;
    this.mesh.position.copy(this.pos);
    // the tunnel behind it
    this.carveAt += step;
    if (this.carveAt > this.r * 1.2) {
      this.carveAt = 0;
      g.engine.destruction.carve(new CapsuleShape(from.clone().addScaledVector(this.dir, -this.r), this.pos.clone(), this.r), { mode: 'bore', power: 2400, impulse: 6, dust: 0.4 });
    }
    for (const e of g.enemiesOf(this.owner)) {
      if (e.dead || this.hit.has(e.id)) continue;
      const c = e.center(_v);
      const t = Math.max(0, Math.min(step, _u.subVectors(c, from).dot(this.dir)));
      if (_w.copy(from).addScaledVector(this.dir, t).distanceTo(c) > this.r + e.def.radius + 0.3) continue;
      this.hit.add(e.id);
      g.damage(e, this.damage, this.owner, this.dir.clone(), { unblockable: true, energy: true, knock: 26, launch: 6, heavy: true, hitstop: 0.14, shake: 0.6, color: RED });
    }
    g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, vx: -this.dir.x * 6, vy: -this.dir.y * 6, vz: -this.dir.z * 6, size: this.r * 1.6, sizeEnd: this.r * 0.4, life: 0.25, r: 1, g: 0.3, b: 0.28, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
    if (this.travelled > this.range) this.done = true;
  }
  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

/** The slash wake: the arc a swing covered goes up a beat later, every point of it at once. */
class SlashWake implements Projectile {
  done = false;
  private t = 0;
  constructor(private g: Game, readonly owner: Fighter, private pts: THREE.Vector3[], readonly delay: number, readonly damage: number, readonly r: number) {
    for (const p of pts) g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: r * 0.6, sizeEnd: r * 0.2, life: delay, r: 1, g: 0.85, b: 0.45, alpha: 0.7, alphaEnd: 0.9, tex: TEX_GLOW });
  }
  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.t < this.delay) return;
    const hit = new Set<number>();
    for (const p of this.pts) {
      g.engine.destruction.carve(new SphereShape(p, this.r, 0.4), { mode: 'explode', power: 1400, impulse: 10, dust: 0.5 });
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: this.r, sizeEnd: this.r * 2.6, life: 0.45, r: 1, g: 0.8, b: 0.4, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: this.r * 0.8, sizeEnd: this.r * 3.6, life: 0.35, r: 1, g: 0.92, b: 0.66, alpha: 0.9, alphaEnd: 0, tex: TEX_RING });
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2, up = 0.3 + Math.random() * 0.7, sp = this.r * (9 + Math.random() * 7);
        g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * sp * (1 - up * 0.5), vy: up * sp, vz: Math.sin(a) * sp * (1 - up * 0.5), size: this.r * 0.22, sizeEnd: this.r * 0.08, life: 0.35, r: 1, g: 0.88, b: 0.5, alpha: 1, alphaEnd: 0, drag: 0.9, stretch: 3, tex: TEX_STREAK });
      }
      g.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, vx: 0, vy: 2, vz: 0, size: this.r * 1.2, sizeEnd: this.r * 3, life: 0.9, r: 0.62, g: 0.58, b: 0.52, alpha: 0.55, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
      for (const e of g.enemiesOf(this.owner)) {
        if (e.dead || hit.has(e.id) || e.center().distanceTo(p) > this.r + e.def.radius + 0.6) continue;
        hit.add(e.id);
        g.damage(e, this.damage, this.owner, _v.subVectors(e.pos, p).setY(0.3).normalize().clone(), { energy: true, knock: 18, launch: 6, heavy: true, hitstop: 0.1, shake: 0.5, color: GOLD });
      }
    }
    g.sfx.play('explode', this.pts[Math.floor(this.pts.length / 2)], 1.4);
    if (g.player && g.player.pos.distanceTo(this.pts[0]) < 60) g.shake(0.5);
    this.done = true;
  }
  dispose(): void {}
}

/** The shield thrown: a spinning disc out along a line and back to his arm, carving and striking whatever it meets. */
class ShieldThrow implements Projectile {
  done = false;
  readonly pos: THREE.Vector3;
  private mesh: PropMesh;
  private t = 0;
  private hit = new Set<number>();
  private carveT = 0;
  private from: THREE.Vector3;
  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, readonly dir: THREE.Vector3, readonly scale: number, readonly reach: number, readonly damage: number, private back: () => THREE.Vector3, private onHome: () => void) {
    this.pos = from.clone();
    this.from = from.clone();
    this.dir.normalize();
    this.mesh = new PropMesh(gerardProp('shield-asch'));
    this.mesh.scale.setScalar(scale);
    g.engine.gr.scene.add(this.mesh);
    g.sfx.play('swingHeavy', from, 1.3);
  }
  update(dt: number, g: Game): void {
    this.t += dt;
    const T = 1.6;
    const u = Math.min(1, this.t / T);
    // out and back: a sine of the reach along the throw, then home to the arm
    const out = Math.sin(u * Math.PI) * this.reach;
    if (u < 0.5) this.pos.copy(this.from).addScaledVector(this.dir, out);
    else this.pos.lerpVectors(this.back(), _v.copy(this.from).addScaledVector(this.dir, out), Math.min(1, out / Math.max(0.01, this.reach)));
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.set(0, Math.atan2(this.dir.x, this.dir.z), 0);
    this.mesh.rotateX(-Math.asin(Math.max(-1, Math.min(1, this.dir.y))));
    this.mesh.rotateZ(Math.PI / 2);
    this.mesh.rotateX(this.t * 24);
    const r = 0.55 * this.scale;
    this.carveT -= dt;
    if (this.carveT <= 0) {
      this.carveT = 0.05;
      g.engine.destruction.carve(new SphereShape(this.pos.clone(), r, 0.3), { mode: 'cut', power: 1800, impulse: 8, dust: 0.3 });
    }
    for (const e of g.enemiesOf(this.owner)) {
      if (e.dead || this.hit.has(e.id) || e.center().distanceTo(this.pos) > r + e.def.radius + 0.4) continue;
      this.hit.add(e.id);
      g.damage(e, this.damage, this.owner, this.dir.clone(), { knock: 20, launch: 5, heavy: true, hitstop: 0.1, shake: 0.4 });
    }
    if (u >= 1) {
      this.done = true;
      this.onHome();
    }
  }
  dispose(): void {
    this.mesh.removeFromParent();
  }
}

// ---------------------------------------------------------------------------------------------- the kit

type Form = 'human' | 'asch' | 'knight';

export class GerardKit implements Kit {
  form: Form = 'human';
  /** the Godly Size step (0 = a man) */
  step = 0;
  /** the visual scale now (it eases to the step's) */
  size = 1;
  /** The Miracle: 0..100 */
  meter = 0;
  /** limbs lost and regrown (stronger each time, the red lines on the arm) */
  regrown = 0;
  /** Hoffnung frozen (no reflection) / cut in half (no sword) */
  frozenT = 0;
  swordGoneT = 0;
  private iceHits = 0;
  veneT = 0;
  toppleT = 0;
  private toppleCd = 0;
  private revivedAsch = false;
  private knightUp = false;
  private boned = false;
  private crashT = -1;
  /** how long the skeleton has lain there: it stays whole a while before it fades */
  private bonesT = 0;
  private burnLine = 0;
  readonly cd = { road: 0, slash: 0, cape: 0, bow: 0, vene: 0, miracle: 0, breaker: 0, toss: 0, gale: 0, lariat: 0, grab: 0, beam: 0, wake: 0, sthrow: 0, roar: 0, blast: 0, asch: 0 };
  comboIndex = 0;
  private lastEnd = -9;
  private wasDashing = false;
  private leaping: { to: THREE.Vector3; t: number; vx: number; vz: number } | null = null;
  private grabbed: Fighter | null = null;
  private grabT = 0;
  private cape: CapeWall | null = null;
  private shieldOut = false;
  private lastPhase = 0;
  private trampleT = 0;
  private trampled = new Map<number, number>();
  private lastLine = -99;
  private wings = false;
  /** emitters left in the scene for a beam that outlives its pose */
  private temps: { o: THREE.Object3D; until: number }[] = [];

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.data.quincy = true;
    // the Heart of the Soul King: The Almighty never shows him
    f.data.unforeseen = true;
    f.parry = (amount, from, o) => this.parry(amount, from, o);
    f.onHurt = (dmg, heavy) => this.hurt(dmg, heavy);
    f.onLethal = () => this.lethal();
    f.anim.twoHandGap = 0.16;
    this.applyStats();
  }

  // ---------------------------------------------------------------- bits

  get giant(): boolean {
    return this.step > 0;
  }

  /** who he means: the hidden are found anyway once the Miracle runs high ("because it was impossible") */
  target(): Fighter | null {
    const { f, g } = this;
    const lock = f === g.player ? g.hud?.lockTarget ?? null : null;
    if (lock && !lock.dead) return lock;
    const near = g.nearestEnemy(f, 160, f.forward(), 80) ?? g.nearestEnemy(f, 160);
    if (near || this.meter < 50 || f.blindT > 0) return near;
    let best: Fighter | null = null, bd = Infinity;
    for (const e of g.enemiesOf(f)) {
      const d = e.pos.distanceTo(f.pos);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  private face(t: Fighter | null): void {
    if (!t) return;
    const f = this.f;
    f.faceTarget = t.center();
    f.yaw = Math.atan2(t.pos.x - f.pos.x, t.pos.z - f.pos.z);
  }

  private line(text: string, every = 6, kanji = '', color: string = GOLD): void {
    if (this.g.time - this.lastLine < every) return;
    this.lastLine = this.g.time;
    this.g.callout(kanji, text, color);
  }

  private special(a: FighterAction, cost: number, cdKey: keyof typeof this.cd, cd: number): boolean {
    const f = this.f;
    if (this.cd[cdKey] > 0) return false;
    if (f.action && !f.action.canCancel(a)) return false;
    if (f.hitstun > 0 || f.dead || this.toppleT > 0) return false;
    if (!f.spendRei(cost)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return false;
    }
    this.cd[cdKey] = cd;
    f.act(a, true);
    return true;
  }

  /** the blade's spec at this size */
  private spec(dmg: number, heavy = false): BladeSpec {
    const k = this.size;
    return {
      damage: dmg, knock: heavy ? 16 : 7, launch: heavy ? 5 : 1, hitstop: heavy ? 0.1 : 0.06, shake: heavy ? 0.4 : 0.2,
      cut: 260 * Math.max(1, k * 1.4), heavy, reach: 0.25 * k, thick: 0.07 * Math.max(1, k * 0.6),
      unblockable: false,
    } as BladeSpec;
  }

  private hasSword(): boolean {
    return this.form !== 'knight' && this.swordGoneT <= 0;
  }

  // ---------------------------------------------------------------- what reaches him

  /**
   * Hope Infusion: a blade that meets Hoffnung — from the front while he swings it — is turned back on its wielder
   * (×2.5 of its own blow); an ice blade freezes Hoffnung instead (and a second one cuts it in half).
   */
  private parry(amount: number, from: Fighter | null, o: DamageOpts): boolean {
    const { f, g } = this;
    if (!from || from === f || o.energy || o.reflected || amount < 4 || !this.hasSword()) return false;
    const swinging = f.action instanceof StringAction && !!(f.action as StringAction).spec;
    if (!swinging) return false;
    const d = _v.subVectors(from.pos, f.pos).setY(0);
    if (d.length() > 3 + f.def.radius * 1.4 || d.normalize().dot(f.forward()) < 0.2) return false;
    if (ICE.test(from.def.id)) {
      this.iceHits++;
      if (this.frozenT > 0 && this.iceHits >= 2) {
        // frozen solid, then cut through: Hoffnung in two
        this.swordGoneT = 10;
        this.frozenT = 0;
        this.iceHits = 0;
        this.showSword();
        g.sparks(sock(f, 'grip.R'), UP, '#CFF6FD', 30);
        g.sfx.play('shatter', f.center(), 1.2);
        this.line('Hoffnung…!', 4, '', '#CFF6FD');
      } else {
        this.frozenT = 6;
        g.sfx.play('crack', f.center(), 0.9);
        this.line('He froze my hope…?', 6, '', '#CFF6FD');
      }
      return false;
    }
    if (this.frozenT > 0) return false;
    // their own blow, swollen by the people's hope, turned back on them
    const back = (amount * (from.power ?? 1) * 2.5) / Math.max(0.1, f.power);
    g.damage(from, back, f, _v.subVectors(from.pos, f.pos).setY(0).normalize().clone(), { reflected: from, unblockable: true, heavy: true, knock: 10, hitstop: 0.12, shake: 0.4, color: HOPE });
    g.sparks(sock(f, 'grip.R'), _v.subVectors(from.center(), f.center()).normalize(), HOPE, 22);
    this.line('Hope cuts both ways!', 8, '希望の剣', HOPE);
    return true;
  }

  private hurt(dmg: number, heavy: boolean): void {
    const { f, g } = this;
    if (this.form === 'knight') return;
    // The Miracle: the fear he is struck with
    this.meter = Math.min(100, this.meter + (dmg / f.maxHp) * 125);
    // a wound big enough to take a limb: it grows back in a flash, stronger, the red lines on it
    if (dmg >= f.maxHp * 0.12 && this.regrown < 4) {
      this.regrown++;
      const c = boneAt(f, 'forearm.R');
      g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: 0.6 * this.size, sizeEnd: 2.2 * this.size, life: 0.4, r: 1, g: 0.95, b: 0.8, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
      if (this.regrown === 1) this.rebody();
      this.applyStats();
    }
    // a striding giant struck hard at the feet goes down
    const from = f.lastHurt.from;
    if (this.giant && heavy && from && this.toppleCd <= 0 && this.toppleT <= 0 && from.pos.y < f.pos.y + f.def.height * 0.18 && Math.hypot(f.body.vel.x, f.body.vel.z) > 2) this.topple();
    if (this.meter >= 100) this.grow(false);
  }

  /** a blow that would kill him: turned into size while a step remains; then the heart; then the golden knight */
  private lethal(): boolean {
    const { f } = this;
    if (this.form !== 'knight' && this.step < 3) {
      this.grow(true);
      return true;
    }
    if (this.form !== 'knight' && !this.revivedAsch) {
      this.revivedAsch = true;
      f.hp = f.maxHp * 0.7;
      this.becomeAsch(true);
      return true;
    }
    if (this.form === 'asch' && !this.knightUp) {
      this.knightUp = true;
      f.hp = f.maxHp * 0.5;
      this.becomeKnight();
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- the frame

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    for (let i = this.temps.length - 1; i >= 0; i--) {
      if (g.time < this.temps[i].until) continue;
      this.temps[i].o.removeFromParent();
      this.temps.splice(i, 1);
    }
    this.toppleCd = Math.max(0, this.toppleCd - dt);
    if (this.frozenT > 0 && (this.frozenT -= dt) <= 0) this.iceHits = 0;
    if (this.swordGoneT > 0 && (this.swordGoneT -= dt) <= 0) this.showSword();
    if (this.veneT > 0 && (this.veneT -= dt) <= 0) this.applyStats();
    if (f.dead) {
      this.death(dt);
      return;
    }
    // the meter: outnumbered, near death
    const near = g.enemiesOf(f).filter((e) => e.pos.distanceTo(f.pos) < 30 + f.def.radius).length;
    if (this.form !== 'knight') {
      if (near > 1) this.meter = Math.min(100, this.meter + (near - 1) * 3 * dt);
      if (f.hp < f.maxHp * 0.3) this.meter = Math.min(100, this.meter + 6 * dt);
      if (this.meter >= 100 && this.step < 3 && !f.busy) this.grow(false);
    }
    // the Miracle high (and in Aschtonig always): binding wears off fast
    if (this.meter >= 50 || this.form === 'asch') {
      const k = this.form === 'asch' ? 30 : 2;
      f.slowT = Math.max(0, f.slowT - k * dt);
      f.armLockT = Math.max(0, f.armLockT - k * dt);
      f.scrambleT = Math.max(0, f.scrambleT - k * dt);
      f.sealT = Math.max(0, f.sealT - k * dt);
      f.wetT = Math.max(0, f.wetT - k * dt);
      if (this.form === 'asch') {
        f.rooted = false;
        f.heavyB = 0;
      }
    }
    // the knight's light burns out
    if (this.form === 'knight') {
      f.hp -= f.maxHp * 0.02 * dt;
      if (f.hp <= 0) {
        f.hp = 0;
        f.onLethal = null;
        g.damage(f, 1, null, f.forward().clone().negate(), { quiet: true, unblockable: true });
      }
      if (g.time - this.burnLine > 9) {
        this.burnLine = g.time;
        const c = f.center();
        g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: 3 * this.size * 0.3, sizeEnd: 8 * this.size * 0.3, life: 0.6, r: 1, g: 0.85, b: 0.5, alpha: 0.6, alphaEnd: 0, tex: TEX_RING });
      }
    }
    // the size eases to the step's; the body, speeds and gait follow
    this.applySize(dt);
    // the topple
    if (this.toppleT > 0) {
      this.toppleT -= dt;
      f.hitstun = Math.max(f.hitstun, 0.05);
    }
    // the leap in flight, and its landing
    if (this.leaping) this.updateLeap(dt);
    const dashing = f.dashT > 0;
    if (dashing && !this.wasDashing) this.dashStart();
    this.wasDashing = dashing;
    // the grab
    if (this.grabbed) this.updateGrab(dt);
    if (this.giant) this.trample(dt);
    // Aschtonig: wings at will — in the air, or when he wants to rise
    if (this.form === 'asch') {
      const fly = f === g.player ? f.wishHover || !f.grounded : !!this.target() && this.target()!.pos.y > f.pos.y + 3;
      if (fly) vollFlight(g, f, this.target(), 1.5);
      else f.mounted = false;
      this.setWings(fly || !f.grounded);
    }
    this.camera(dt);
    f.aura.target = this.form === 'knight' ? 0.45 : this.form === 'asch' ? 0.35 : this.veneT > 0 ? 0.3 : this.meter >= 50 ? 0.2 : 0.04;
  }

  /** scale, hurt capsule, speeds and gait follow the size */
  private applySize(dt: number): void {
    const { f } = this;
    const goal = STEPS[this.step];
    this.size += (goal - this.size) * (1 - Math.exp(-2.2 * dt));
    if (Math.abs(goal - this.size) < 0.002) this.size = goal;
    const k = this.size;
    f.visual.object.scale.setScalar(k);
    f.def.height = HEIGHT * k;
    f.def.radius = RADIUS * k;
    const sp = f.def.speed;
    const s = Math.sqrt(k);
    sp.run = SPEED.run * s;
    sp.sprint = SPEED.sprint * s;
    sp.dash = SPEED.dash * s;
    sp.jump = SPEED.jump;
    sp.dashTime = SPEED.dashTime;
    f.body.stepUp = 0.6 * k;
    f.giant = this.step > 0;
    f.ghosts.enabled = this.step === 0;
    f.knockTaken = 1 / Math.max(1, k * 0.8);
  }

  /** a giant player: the camera pulls back and up */
  private camera(dt: number): void {
    const { f, g } = this;
    if (f !== g.player) return;
    const cam = g.cam;
    const H = f.def.height;
    const big = this.size > 1.2;
    const wantH = big ? H * 0.62 : 2.1;
    const wantD = big ? H * 1.9 : 5.6;
    const k = 1 - Math.exp(-3 * dt);
    cam.height += (wantH - cam.height) * k;
    cam.shoulder += ((big ? H * 0.06 : 0.6) - cam.shoulder) * k;
    cam.maxDist = Math.max(14, wantD * 1.7);
    if (cam.dist < wantD) cam.dist += (wantD - cam.dist) * k;
  }

  private applyStats(): void {
    const f = this.f;
    const base = [1, 1.3, 1.55, 1.8][this.step];
    const form = this.form === 'knight' ? 2.0 / base : this.form === 'asch' ? 1.15 : 1;
    f.power = base * form * (1 + 0.05 * this.regrown);
    f.damageTaken = (this.veneT > 0 ? 0.4 : 1) * [0.9, 0.85, 0.8, 0.75][this.step] * (this.form === 'knight' ? 0.8 : 1);
    f.energyTaken = this.giant ? 0.8 : 1;
    f.toughness = this.giant ? 8 * this.step : 0;
  }

  // ---------------------------------------------------------------- Godly Size

  /** the next step: every wound gone, the body taller, the helmet gone from the first */
  private grow(fatal: boolean): void {
    const { f, g } = this;
    if (this.step >= 3) {
      this.meter = 100;
      return;
    }
    this.step++;
    this.meter = 0;
    f.hp = f.maxHp;
    f.hitstun = 0;
    if (this.grabbed) this.letGo(new THREE.Vector3(0, 6, 0));
    this.rebody();
    this.applyStats();
    const at = f.pos.clone();
    g.addProjectile(new LightPillar(g, at, 1.8, 80, GOLD_LIGHT));
    f.aura.pillarBurst(2.4);
    f.aura.flare(2, 1);
    g.callout('神の尺度', fatal ? 'KAMI NO SAIZU — the fear of you made me bigger!' : 'KAMI NO SAIZU', GOLD);
    g.sfx.play('roarBig', f.center(), 1.2);
    g.shake(f === g.player ? 0.9 : 0.4);
    // the growth shoves everything off him and cracks the ground
    for (const e of g.enemiesOf(f)) {
      const d = e.pos.distanceTo(f.pos);
      if (d > STEPS[this.step] * RADIUS * 3 + 4) continue;
      e.push.addScaledVector(_v.subVectors(e.pos, f.pos).setY(0).normalize(), 16);
      e.body.vel.y = Math.max(e.body.vel.y, 8);
    }
    g.groundImpact(at, Math.min(6, 1 + this.step * 1.6), 900, GOLD, f);
    if (f.action) f.stopAction();
    f.act(new ClipSkill('grow', 'gv_grow', () => {}, { invulnerable: true, mobility: 0 }), true);
  }

  /** the asset, stance, clips and props for the form and state */
  private rebody(): void {
    const { f } = this;
    if (this.form === 'knight') {
      f.def = { ...f.def, stance: KNIGHT_STANCE, clips: KNIGHT_CLIPS };
      f.setForm({ asset: gerardAsset('knight'), props: [] }, AURA_KNIGHT);
      return;
    }
    f.def = { ...f.def, stance: GERARD_STANCE, clips: GERARD_CLIPS };
    const look = this.form === 'asch' ? 'asch' : this.step > 0 ? 'bare' : 'helm';
    f.setForm({ asset: gerardAsset(look, this.regrown > 0), props: this.props() }, this.form === 'asch' ? AURA_ASCH : AURA_GERARD, BLADE);
    f.anim.twoHandGap = 0.16;
    if (this.wings) f.visual.attach('wings', gerardProp('wings'), 'back');
  }

  private props(): PropDef[] {
    const asch = this.form === 'asch';
    const out: PropDef[] = [];
    if (this.swordGoneT <= 0) out.push({ key: 'sword', model: gerardProp(asch ? 'hoffnung-gold' : 'hoffnung'), socket: 'grip.R' });
    if (!this.shieldOut) out.push({ key: 'shield', model: gerardProp(asch ? 'shield-asch' : 'shield'), socket: 'shield' });
    if (asch) out.push({ key: 'helm', model: gerardProp('helm-asch'), socket: 'helm.socket' });
    return out;
  }

  private showSword(): void {
    const { f } = this;
    const p = f.visual.props.get('sword');
    if (this.swordGoneT > 0) {
      if (p) p.visible = false;
      f.visual.rig.setBoneVisible('fist.R', false);
      f.visual.rig.setBoneVisible('palm.R', true);
      return;
    }
    if (!p) f.visual.attach('sword', gerardProp(this.form === 'asch' ? 'hoffnung-gold' : 'hoffnung'), 'grip.R');
    else p.visible = true;
    f.visual.rig.setBoneVisible('fist.R', true);
    f.visual.rig.setBoneVisible('palm.R', false);
  }

  private setWings(on: boolean): void {
    if (on === this.wings) return;
    this.wings = on;
    const f = this.f;
    if (on) {
      f.visual.attach('wings', gerardProp('wings'), 'back');
      const c = sock(f, 'back');
      this.g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: this.size, sizeEnd: this.size * 4, life: 0.4, r: 1, g: 0.92, b: 0.7, alpha: 0.8, alphaEnd: 0, tex: TEX_RING });
    } else f.visual.detach('wings');
  }

  /** a giant tripped: he pitches forward onto his hands, the street shaking; he gets up 2.5 s later */
  private topple(): void {
    const { f, g } = this;
    this.toppleT = 2.5;
    this.toppleCd = 15;
    f.stopAction();
    f.act(new ClipSkill('topple', this.form === 'knight' ? 'kn_topple' : 'gv_topple', (n) => {
      if (n !== 'crash') return;
      const at = f.pos.clone().addScaledVector(f.forward(), f.def.height * 0.45);
      g.groundImpact(at, Math.min(7, this.size * 0.45), 1400, '#B0A898', f);
      g.engine.destruction.carve(new CapsuleShape(f.pos.clone().setY(f.pos.y + this.size * 0.3), at.clone().setY(at.y + this.size * 0.3), this.size * 0.42), { mode: 'smash', power: 1200, impulse: 10, dust: 0.8 });
      if (g.player && g.player.pos.distanceTo(f.pos) < 80) g.shake(0.8);
    }, { mobility: 0, armor: 0 }), true);
    this.line('Gah—!', 4);
  }

  /** the strides crush what they cross */
  private trample(dt: number): void {
    const { f, g } = this;
    const k = this.size;
    const speed = Math.hypot(f.body.vel.x, f.body.vel.z);
    const ph = f.anim.loco.phase;
    if (f.grounded && speed > 1 && ((this.lastPhase < 0.25 && ph >= 0.25) || (this.lastPhase < 0.75 && ph >= 0.75))) {
      for (const leg of ['foot.L', 'foot.R']) {
        const p = boneAt(f, leg, _v);
        if (p.y > f.pos.y + 0.6 * k) continue;
        p.y = f.pos.y;
        g.engine.destruction.carve(new SphereShape(p.clone(), 0.16 * k, 0.4), { mode: 'smash', power: 200, impulse: 4, dust: 0.7 });
      }
      if (g.player && g.player !== f && g.player.pos.distanceTo(f.pos) < 20 * k) g.shake(Math.min(0.3, 0.02 * k));
    }
    this.lastPhase = ph;
    this.trampleT -= dt;
    if (speed < 1 || this.trampleT > 0) return;
    this.trampleT = 0.15;
    const r = 0.13 * k;
    const floor = f.pos.y + r + 0.3;
    for (const [top, bottom] of [['thigh.L', 'foot.L'], ['thigh.R', 'foot.R']] as [string, string][]) {
      const a = boneAt(f, top, new THREE.Vector3()), b = boneAt(f, bottom, new THREE.Vector3());
      a.y = Math.max(a.y, floor);
      b.y = Math.max(b.y, floor);
      g.engine.destruction.carve(new CapsuleShape(a, b, r), { mode: 'smash', power: 380, impulse: 7, dust: 0.6 });
    }
    // the bulk shoulders through what stands at chest height before him
    const body = f.pos.clone().addScaledVector(f.forward(_w), 0.3 * k);
    body.y += f.def.height * 0.55;
    g.engine.destruction.carve(new SphereShape(body, f.def.height * 0.2, 0.7), { mode: 'smash', power: 380, impulse: 8, dust: 0.5 });
    // underfoot
    for (const o of g.enemiesOf(f)) {
      if (o.pos.y > f.pos.y + f.def.height * 0.3) continue;
      if (Math.hypot(o.pos.x - f.pos.x, o.pos.z - f.pos.z) > f.def.radius * 0.9 + o.def.radius) continue;
      const last = this.trampled.get(o.id) ?? -9;
      if (g.time - last < 0.7) continue;
      this.trampled.set(o.id, g.time);
      g.damage(o, 10 + 3 * this.step, f, _v.subVectors(o.pos, f.pos).setY(0).normalize().clone(), { knock: 12, launch: 3, hitstop: 0.03, shake: 0.2 });
    }
  }

  // ---------------------------------------------------------------- Aschtonig, the knight, the end

  /** Aschtonig: by the Zeichen drawn in his own blood (F), or the heart rebuilding him (a revival) */
  private becomeAsch(revive: boolean): void {
    const { f, g } = this;
    this.form = 'asch';
    if (this.grabbed) this.letGo(new THREE.Vector3(0, 4, 0));
    f.stopAction();
    this.frozenT = 0;
    this.rebody();
    this.applyStats();
    const at = f.pos.clone();
    g.addProjectile(new LightPillar(g, at, 1.8, 90, GOLD));
    f.aura.pillarBurst(2.6);
    f.aura.flare(2.4, 1.2);
    g.callout('神の権能', revive ? 'ASCHTONIG — my heart will not let me die!' : 'QUINCY: VOLLSTÄNDIG — ASCHTONIG', GOLD);
    g.sfx.play('bankai', f.center());
    g.shake(f === g.player ? 0.7 : 0.3);
    if (revive) {
      // the heart: a beat of red light at his chest pulling the halves together
      const c = sock(f, 'heart');
      for (let i = 0; i < 3; i++) g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: 0.4 * this.size, sizeEnd: 2.6 * this.size, life: 0.4 + i * 0.2, r: 1, g: 0.15, b: 0.15, alpha: 1, alphaEnd: 0, tex: TEX_RING });
    }
    f.act(new ClipSkill('aschtonig', 'gv_miracle', () => {}, { invulnerable: true, mobility: 0 }), true);
  }

  /** shattered in Aschtonig: re-formed out of golden light from the legs up — mindless, roaring, burning out */
  private becomeKnight(): void {
    const { f, g } = this;
    this.form = 'knight';
    this.meter = 0;
    if (this.grabbed) this.letGo(new THREE.Vector3(0, 4, 0));
    this.setWings(false);
    f.mounted = false;
    f.stopAction();
    this.rebody();
    this.applyStats();
    const c = f.center();
    g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: this.size, sizeEnd: this.size * 5, life: 0.8, r: 1, g: 0.9, b: 0.6, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    g.addProjectile(new LightPillar(g, f.pos.clone(), 2.2, 100, GOLD_LIGHT));
    g.callout('', 'RRRAAAAAGH!', GOLD);
    g.sfx.play('roarBig', c, 1.4);
    f.act(new ClipSkill('reform', 'kn_rise', () => {}, { invulnerable: true, mobility: 0 }), true);
  }

  /** dead: the skeleton the light leaves topples across the street */
  private death(dt: number): void {
    const { f, g } = this;
    // the skeleton topples and lies across the street a while before it fades (the dissolve and the removal wait)
    this.bonesT += dt;
    if (this.bonesT < 4.5) f.deathT = Math.min(f.deathT, 0.5);
    if (!this.boned) {
      this.boned = true;
      this.grabbed = null;
      this.cape?.dispose();
      f.def = { ...f.def, stance: GERARD_STANCE, clips: GERARD_CLIPS };
      f.setForm({ asset: gerardAsset('bones'), props: [] }, AURA_KNIGHT);
      f.anim.play('gv_topple', {});
      this.crashT = 0.86;
      goldenDust(g, f, this.size);
      g.callout('', '…', GOLD);
      return;
    }
    if (this.crashT > 0 && (this.crashT -= dt) <= 0) {
      const at = f.pos.clone().addScaledVector(f.forward(), f.def.height * 0.45);
      g.groundImpact(at, Math.min(8, this.size * 0.5 + 1), 1600, '#E8E0C8', f);
      if (g.player && g.player.pos.distanceTo(f.pos) < 100) g.shake(0.9);
    }
  }

  // ---------------------------------------------------------------- Shift

  /** far: the Valkyrie Leap — a bound to them, a crater where he lands; near: the shield charge */
  private dashStart(): void {
    const { f, g } = this;
    if (this.form === 'knight' || this.toppleT > 0) return;
    const t = this.target();
    if (this.form === 'asch' && !f.grounded) return;
    const k = this.size;
    if (t && t.pos.distanceTo(f.pos) > 8 * Math.sqrt(k) && !this.leaping) {
      f.dashT = 0;
      const to = t.pos.clone();
      const d = _v.subVectors(to, f.pos);
      const T = Math.min(1.4, 0.55 + Math.hypot(d.x, d.z) / 60);
      const grav = 30;
      f.body.vel.set(d.x / T, (d.y + 0.5 * grav * T * T) / T, d.z / T);
      f.push.set(0, 0, 0);
      this.leaping = { to, t: 0, vx: d.x / T, vz: d.z / T };
      this.face(t);
      const leap = new ClipSkill('leap', 'gv_leap', () => {}, { mobility: 0, armor: 0.4, dur: T + 0.2 });
      leap.airGravity = 1;
      f.act(leap, true);
      g.sfx.play('impact', f.pos, 0.8 + k * 0.05);
      g.engine.destruction.carve(new SphereShape(f.pos.clone(), 0.5 * k, 0.4), { mode: 'smash', power: 300, impulse: 6, dust: 0.6 });
      this.line('Come at me, all of you!', 10);
      return;
    }
    if (this.giant) return;
    // the shield charge
    hirenkyakuPuff(g, f, TINT);
    const hit = new Set<number>();
    f.act(new ClipSkill('charge', 'gv_charge', () => {}, { mobility: 1, armor: 0.6, tick: () => {
      for (const e of g.enemiesOf(f)) {
        if (e.dead || hit.has(e.id)) continue;
        const d = _v.subVectors(e.pos, f.pos).setY(0);
        if (d.length() > 1.3 + e.def.radius || d.normalize().dot(f.forward()) < 0.3) continue;
        hit.add(e.id);
        g.damage(e, 22, f, f.forward().clone(), { knock: 16, launch: 3, heavy: true, hitstop: 0.08, shake: 0.3 });
      }
    } }), true);
  }

  private updateLeap(dt: number): void {
    const { f, g } = this;
    const L = this.leaping!;
    L.t += dt;
    // the body flies its arc: nothing steers it off
    f.body.vel.x = L.vx;
    f.body.vel.z = L.vz;
    if (L.t > 0.25 && (f.grounded || L.t > 2.4)) {
      this.leaping = null;
      const k = this.size;
      const at = f.pos.clone();
      g.groundImpact(at, Math.min(7, 1.6 + k * 0.4), 900 + k * 60, '#B0A898', f);
      for (const e of g.enemiesOf(f)) {
        const d = Math.hypot(e.pos.x - at.x, e.pos.z - at.z);
        if (e.dead || d > 4 * Math.sqrt(k) + e.def.radius || Math.abs(e.pos.y - at.y) > 3 * Math.sqrt(k)) continue;
        g.damage(e, 40, f, _v.subVectors(e.pos, at).setY(0.3).normalize().clone(), { knock: 18, launch: 7, heavy: true, hitstop: 0.12, shake: 0.6 });
      }
      f.stopAction();
      f.act(new ClipSkill('land', 'gv_land', () => {}, { mobility: 0, armor: 0.5 }), true);
    }
  }

  // ---------------------------------------------------------------- LMB

  attack(): void {
    const { f, g } = this;
    if (this.toppleT > 0) return;
    const cur = f.action;
    if (cur instanceof StringAction) {
      cur.queued = true;
      return;
    }
    if (f.busy || this.grabbed) return;
    if (g.time - this.lastEnd > 0.9) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const { f, g } = this;
    const t = this.target();
    this.lastEnd = g.time + 0.7;
    this.comboIndex = i + 1;
    if (t) this.face(t);
    const k = this.size;
    if (this.form === 'knight') {
      const clip = KNIGHT_CHAIN[i % KNIGHT_CHAIN.length];
      f.act(new StringAction(this, clip, () => this.chain(i + 1), null, (n) => {
        if (n !== 'hit') return;
        this.bodyBlow(i % 2 === 0 ? 'hand.R' : 'hand.L', 0.5 * k, 60, 18);
      }), true);
      return;
    }
    if (this.giant) {
      const clip = GIANT_CHAIN[i % GIANT_CHAIN.length];
      const sword = clip === 'gv_cut1' && this.hasSword();
      f.act(new StringAction(this, clip, () => this.chain(i + 1), sword ? this.spec(55, true) : null, (n) => {
        if (n !== 'hit') return;
        if (clip === 'gv_backhand') this.bodyBlow('forearm.L', 0.3 * k, 45, 26, true);
        else if (clip === 'gv_stomp') {
          const p = boneAt(f, 'foot.R');
          p.y = f.pos.y;
          g.groundImpact(p, Math.min(6, 0.2 * k + 1), 900, '#B0A898', f);
          for (const e of g.enemiesOf(f)) {
            if (e.dead || Math.hypot(e.pos.x - p.x, e.pos.z - p.z) > 0.32 * k + e.def.radius || e.pos.y > p.y + 0.3 * k) continue;
            g.damage(e, 50, f, _v.subVectors(e.pos, p).setY(0.2).normalize().clone(), { knock: 14, launch: 6, heavy: true, hitstop: 0.12, shake: 0.6 });
          }
        } else if (!sword) this.bodyBlow('hand.R', 0.28 * k, 50, 20, true);
      }), true);
      return;
    }
    const clip = GERARD_CHAIN[i % GERARD_CHAIN.length];
    const sword = clip !== 'gv_bash' && this.hasSword();
    f.act(new StringAction(this, clip, () => this.chain(i + 1), sword ? this.spec(clip === 'gv_slam' ? 26 : 20, clip === 'gv_slam' || clip === 'gv_cut1') : null, (n) => {
      if (n !== 'hit') return;
      if (clip === 'gv_bash') this.bodyBlow('forearm.L', 1.0, 18, 14, true);
      else if (clip === 'gv_slam') {
        // the shockwave rolling out from where the blade bit the ground
        const tip = this.bladeTip();
        const at = new THREE.Vector3(tip.x, f.pos.y, tip.z);
        g.groundImpact(at, 1.6, 700, GOLD, f);
        this.shockwave(at, 6, 24);
      }
      // every hit chips the ground under it
      const tip = this.bladeTip();
      if (tip.y < f.pos.y + 0.6) g.engine.destruction.carve(new SphereShape(tip.clone(), 0.5, 0.4), { mode: 'smash', power: 260, impulse: 5, dust: 0.5 });
    }), true);
  }

  /** a body blow at a bone: everyone within reach of it is struck */
  private bodyBlow(bone: string, r: number, dmg: number, knock: number, carve = false): void {
    const { f, g } = this;
    const p = boneAt(f, bone);
    if (carve) g.engine.destruction.carve(new SphereShape(p.clone(), r * 0.8, 0.4), { mode: 'smash', power: 700 + this.size * 60, impulse: 10, dust: 0.6 });
    for (const e of g.enemiesOf(f)) {
      if (e.dead) continue;
      const c = e.center(_w);
      if (c.distanceTo(p) > r + e.def.radius + 0.6 && !(this.giant && Math.hypot(e.pos.x - p.x, e.pos.z - p.z) < r + e.def.radius && c.y < p.y + r)) continue;
      g.damage(e, dmg, f, _v.subVectors(e.pos, f.pos).setY(0.2).normalize().clone(), { knock, launch: 4, heavy: true, hitstop: 0.1, shake: 0.4 });
    }
  }

  private bladeTip(out = new THREE.Vector3()): THREE.Vector3 {
    const p = this.f.visual.props.get('sword');
    if (!p) return boneAt(this.f, 'hand.R', out);
    p.updateWorldMatrix(true, false);
    return out.set(0, 0, HOFFNUNG_TIP_Z).applyMatrix4(p.matrixWorld);
  }

  /** a ring of upheaval rolling out along the ground */
  private shockwave(at: THREE.Vector3, r: number, dmg: number): void {
    const { f, g } = this;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const p = at.clone().add(_v.set(Math.cos(a) * r * 0.6, 0, Math.sin(a) * r * 0.6));
      g.engine.destruction.carve(new SphereShape(p, 0.45, 0.4), { mode: 'smash', power: 320, impulse: 7, dust: 0.6 });
    }
    for (const e of g.enemiesOf(f)) {
      if (e.dead || Math.hypot(e.pos.x - at.x, e.pos.z - at.z) > r + e.def.radius || Math.abs(e.pos.y - at.y) > 1.6) continue;
      g.damage(e, dmg, f, _v.subVectors(e.pos, at).setY(0.4).normalize().clone(), { knock: 12, launch: 7, heavy: true, hitstop: 0.08, shake: 0.4 });
    }
  }

  // ---------------------------------------------------------------- RMB

  heavy(): void {
    const { f, g } = this;
    if (this.toppleT > 0 || this.grabbed) return;
    const k = this.size;
    if (this.form === 'knight') {
      // the volley of golden blasts
      this.special(new ClipSkill('blast', 'kn_blast', (n) => {
        if (n !== 'fire') return;
        const t = this.target();
        for (let i = 0; i < 6; i++) {
          const hand = sock(f, i % 2 === 0 ? 'palm.R' : 'palm.L');
          const aim = t ? t.center().add(_v.set((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 3)) : hand.clone().addScaledVector(f.forward(), 40);
          g.addProjectile(new CeroShot(g, f, hand, aim.sub(hand).normalize(), { speed: 70, size: 0.12 * k, damage: 12, blast: 0.12 * k, power: 900, knock: 10, launch: 3, heavy: true, core: '#FFF6D8', body: GOLD }));
        }
        g.sfx.play('beam', f.center(), 1.2);
      }, { mobility: 0.1, armor: 0.6 }), 0, 'blast', 3);
      return;
    }
    if (this.giant) {
      // Branch Breaker: the arm drawn back with a long laugh, then the fist into the ground
      this.special(new ClipSkill('breaker', 'gv_breaker', (n) => {
        if (n === 'laugh') {
          this.line('GAHAHAHA!', 3);
          g.sfx.play('roar', f.center(), 0.9);
        }
        if (n !== 'hit') return;
        const p = boneAt(f, 'hand.R');
        p.y = Math.min(p.y, f.pos.y + 0.2);
        const r = 0.34 * k;
        g.engine.destruction.carve(new SphereShape(p.clone(), r, 0.5), { mode: 'smash', power: 3000, impulse: 16, dust: 0.9 });
        g.groundImpact(p, Math.min(8, r * 0.6), 2000, '#B0A898', f);
        // the ground round it gives way: a ring of collapse
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          const q = p.clone().add(_v.set(Math.cos(a) * r * 1.4, -r * 0.2, Math.sin(a) * r * 1.4));
          g.engine.destruction.carve(new SphereShape(q, r * 0.35, 0.4), { mode: 'smash', power: 1400, impulse: 10, dust: 0.6 });
        }
        for (const e of g.enemiesOf(f)) {
          const d = Math.hypot(e.pos.x - p.x, e.pos.z - p.z);
          if (e.dead || d > r * 2 + e.def.radius || e.pos.y > p.y + r * 1.5) continue;
          g.damage(e, 140 * (1 - 0.5 * d / (r * 2 + e.def.radius)), f, _v.subVectors(e.pos, p).setY(0.5).normalize().clone(), { knock: 20, launch: 12, heavy: true, hitstop: 0.18, shake: 0.9 });
        }
        if (g.player && g.player.pos.distanceTo(p) < 120) g.shake(1);
        g.sfx.play('explode', p, 2);
      }, { mobility: 0, armor: 0.7 }), 45, 'breaker', 12);
      return;
    }
    if (!this.hasSword()) return;
    // Road-Breaker: both hands, driven down through the floor
    this.special(new ClipSkill('road', 'gv_road', (n) => {
      if (n === 'raise') g.sfx.play('charge', f.center(), 0.6);
      if (n !== 'hit') return;
      const tip = this.bladeTip();
      const at = new THREE.Vector3(tip.x, f.pos.y, tip.z);
      g.engine.destruction.carve(new CapsuleShape(at.clone().setY(at.y + 0.5), at.clone().setY(at.y - 5), 1.4), { mode: 'smash', power: 2400, impulse: 12, dust: 0.9 });
      g.groundImpact(at, 2.2, 1400, GOLD, f);
      for (const e of g.enemiesOf(f)) {
        const d = Math.hypot(e.pos.x - at.x, e.pos.z - at.z);
        if (e.dead || d > 3.4 + e.def.radius || Math.abs(e.pos.y - at.y) > 2.5) continue;
        g.damage(e, 60 * (d < 1.6 + e.def.radius ? 1 : 0.6), f, _v.subVectors(e.pos, at).setY(0.3).normalize().clone(), { knock: 10, launch: 8, heavy: true, hitstop: 0.16, shake: 0.7 });
        e.hitstun = Math.max(e.hitstun, 0.9);
      }
      this.line('The road breaks before me!', 8);
    }, { mobility: 0.05, armor: 0.5 }), 20, 'road', 6);
  }

  // ---------------------------------------------------------------- Q

  skill1(): void {
    const { f, g } = this;
    if (this.toppleT > 0 || this.grabbed) return;
    const k = this.size;
    const t = this.target();
    if (this.form === 'knight') {
      // the roar: a blast of sound that throws back and stuns
      this.special(new ClipSkill('roar', 'kn_roar', (n) => {
        if (n !== 'roar') return;
        g.sfx.play('roarBig', f.center(), 1.6);
        g.addRing(f.pos.clone(), 3 * Math.sqrt(k) * 3, GOLD, 0.6);
        for (const e of g.enemiesOf(f)) {
          const d = e.pos.distanceTo(f.pos);
          if (e.dead || d > 10 * Math.sqrt(k)) continue;
          g.damage(e, 20, f, _v.subVectors(e.pos, f.pos).setY(0.3).normalize().clone(), { energy: true, knock: 26, launch: 4, heavy: true, hitstop: 0.06 });
          e.hitstun = Math.max(e.hitstun, 1.0);
        }
        if (g.player && g.player.pos.distanceTo(f.pos) < 60) g.shake(0.7);
      }, { mobility: 0, armor: 0.8 }), 0, 'roar', 9);
      return;
    }
    if (this.form === 'asch') {
      if (!this.hasSword()) return;
      // the Hoffnung beam: a sphere swelling at the tip, then the straight beam
      const em = new THREE.Object3D();
      g.engine.gr.scene.add(em);
      let beam: CeroBeam | null = null;
      this.special(new ClipSkill('beam', 'gv_beam', (n) => {
        if (n === 'charge') g.sfx.play('charge', f.center(), 1);
        if (n !== 'fire') return;
        const tg = this.target();
        em.position.copy(this.bladeTip());
        const aim = tg ? tg.center() : em.position.clone().addScaledVector(f.forward(), 60);
        beam = new CeroBeam(g, f, em, () => (tg && !tg.dead ? tg.center() : aim), { charge: 0.05, fire: 0.8, radius: 1.1 * Math.sqrt(k), damage: 60, power: 2600, core: '#FFF8E8', body: GOLD, rim: '#9A6E18', range: 120, track: 0.5, gain: 1.3 });
        g.addProjectile(beam);
        g.callout('希望の剣', 'HOFFNUNG', GOLD);
      }, { mobility: 0, armor: 0.6, tick: (tt) => {
        em.position.copy(this.bladeTip());
        if (tt < 0.8) {
          const p = em.position;
          g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: (0.3 + tt) * Math.sqrt(k), sizeEnd: 0.2, life: 0.12, r: 1, g: 0.9, b: 0.6, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
        }
      }, end: () => this.temps.push({ o: em, until: g.time + 1.2 }) }), 40, 'beam', 7);
      void beam;
      return;
    }
    if (this.giant) {
      // the tower toss: the top of the nearest building torn off — or a slab of the ground — and hurled
      this.special(new ClipSkill('toss', 'gv_toss', (n) => {
        if (n === 'tear') this.tearChunk();
        if (n === 'throw') {
          const tg = this.target();
          const c = this.held;
          this.held = null;
          if (!c) return;
          c.throwAt(tg ? tg.pos.clone().setY(tg.pos.y + 0.5) : f.pos.clone().addScaledVector(f.forward(), 30 * Math.sqrt(k)), true);
        }
      }, { mobility: 0, armor: 0.6, end: () => { if (this.held) { this.held.throwAt(f.pos.clone().addScaledVector(f.forward(), 6 * k)); this.held = null; } } }), 40, 'toss', 9);
      return;
    }
    if (!this.hasSword()) return;
    // the flying slash
    this.special(new ClipSkill('slash', 'gv_flying', (n) => {
      if (n !== 'fire') return;
      const from = f.center().addScaledVector(f.forward(), 1);
      const dir = t ? _v.subVectors(t.center(), from).normalize().clone() : f.forward().clone();
      const side = new THREE.Vector3(-dir.z, 0.6, dir.x).normalize();
      g.addProjectile(new GetsugaProjectile(g, f, from, dir, side, { radius: 2.4, halfAngle: 1.0, speed: 42, range: 60, damage: 36, cut: 900, colors: { core: '#FFFFFF', body: '#E8E4D8', rim: '#7A7C88' } as never }));
      g.sfx.play('getsuga', from, 0.9);
    }, { mobility: 0.1 }), 18, 'slash', 3.5);
  }

  private held: LiftedChunk | null = null;

  /** the chunk he tears loose: the top of the nearest building within reach, else the ground before him */
  private tearChunk(): void {
    const { f, g } = this;
    const k = this.size;
    const reach = 1.2 * k;
    const half = Math.min(4, 0.24 * k);
    const w = g.engine.world, vs = w.vs;
    // look for the tallest solid column within reach in front of him
    let best: THREE.Vector3 | null = null, bestTop = f.pos.y + 3;
    const fw = f.forward();
    for (let a = -0.8; a <= 0.81; a += 0.4)
      for (let d = 0.4 * k; d <= reach; d += Math.max(1, reach / 6)) {
        const dir = fw.clone().applyAxisAngle(UP, a);
        const p = f.pos.clone().addScaledVector(dir, d);
        const x = Math.floor(p.x / vs), z = Math.floor(p.z / vs);
        for (let y = Math.min(w.sy - 1, Math.floor((f.pos.y + 0.9 * f.def.height) / vs)); y > Math.floor((f.pos.y + 3) / vs); y--) {
          if (!w.isSolid(x, y, z)) continue;
          const top = (y + 1) * vs;
          if (top > bestTop) { bestTop = top; best = new THREE.Vector3(p.x, top, p.z); }
          break;
        }
      }
    const hand = () => boneAt(f, 'hand.R').lerp(boneAt(f, 'hand.L'), 0.5).addScaledVector(UP, half * 0.6);
    let keys: Float64Array;
    if (best) keys = chunkKeys(g, new THREE.Vector3(best.x - half, best.y - half * 2, best.z - half), new THREE.Vector3(best.x + half, best.y, best.z + half));
    else {
      const p = f.pos.clone().addScaledVector(fw, 0.5 * k);
      keys = chunkKeys(g, new THREE.Vector3(p.x - half, f.pos.y - half, p.z - half), new THREE.Vector3(p.x + half, f.pos.y - 0.2, p.z + half));
    }
    this.held = new LiftedChunk(g, f, keys, hand, 90, half * 1.6);
    g.addProjectile(this.held);
    this.line(best ? 'Catch!' : 'GAHAHA!', 6);
  }

  // ---------------------------------------------------------------- E

  skill2(): void {
    const { f, g } = this;
    if (this.toppleT > 0 || this.grabbed || this.form === 'knight') return;
    const k = this.size;
    if (this.form === 'asch') {
      if (!this.hasSword()) return;
      // the slash wake: the arc of the swing goes up a beat later
      const pts: THREE.Vector3[] = [];
      let sampled = 0;
      this.special(new ClipSkill('wake', 'gv_wake', (n) => {
        if (n === 'fire') g.sfx.play('swingHeavy', f.center(), 1.3);
      }, { mobility: 0.05, armor: 0.5, tick: (tt) => {
        if (tt < 0.16 || tt > 0.44 || tt - sampled < 0.05) return;
        sampled = tt;
        // the blade's line from guard to past the tip, and on out along it
        const tip = this.bladeTip();
        const base = _v.set(0, 0, HOFFNUNG_BASE_Z);
        const p = f.visual.props.get('sword');
        if (p) base.applyMatrix4(p.matrixWorld);
        // along the blade from near the guard to a little past the point
        const len = _w.subVectors(tip, base).length();
        const dir = _w.normalize();
        for (const s of [0.35, 0.7, 1.05, 1.5]) {
          const q = base.clone().addScaledVector(dir, s * len);
          const gy = floorAt(g, q, 60);
          if (gy !== null && q.y > gy + 2) q.y = gy + 0.6;
          pts.push(q);
        }
      }, end: () => {
        if (pts.length) g.addProjectile(new SlashWake(g, f, pts, 0.6, 70, 1.4 * Math.sqrt(k)));
      } }), 35, 'wake', 7);
      return;
    }
    if (this.giant) {
      // the gale breath
      this.special(new ClipSkill('gale', 'gv_gale', (n) => {
        if (n === 'inhale') g.sfx.play('charge', f.center(), 0.9);
        if (n === 'breath') this.line('HAAAAAH!', 3);
      }, { mobility: 0, armor: 0.6, tick: (tt, step) => {
        if (tt < 0.62 || tt > 1.7) return;
        const mouth = sock(f, 'mouth');
        const fw = f.forward();
        const len = 40 * Math.sqrt(k / 6);
        // dust streaming out in a cone
        for (let i = 0; i < 4; i++) {
          const a = (Math.random() - 0.5) * 0.7, b = (Math.random() - 0.5) * 0.35;
          const d = fw.clone().applyAxisAngle(UP, a);
          d.y = b - 0.15;
          g.engine.dust.spawn({ x: mouth.x, y: mouth.y, z: mouth.z, vx: d.x * 40, vy: d.y * 40, vz: d.z * 40, size: 0.5 * Math.sqrt(k), sizeEnd: 2 * Math.sqrt(k), life: 0.9, r: 0.82, g: 0.8, b: 0.76, alpha: 0.35, alphaEnd: 0, tex: TEX_PUFF, drag: 1 });
        }
        for (const e of g.enemiesOf(f)) {
          const v = _v.subVectors(e.pos, f.pos);
          const d = v.length();
          if (e.dead || d > len) continue;
          v.setY(0).normalize();
          if (v.dot(fw) < Math.cos(0.45)) continue;
          e.push.addScaledVector(v, 70 * step);
          e.body.vel.y = Math.max(e.body.vel.y, 3);
          e.hitstun = Math.max(e.hitstun, 0.2);
          e.mounted = false;
        }
        // shots and swarms in it blown away
        for (let s = 6; s < len; s += 8) g.rejectNear(f.pos.clone().addScaledVector(fw, s).setY(f.pos.y + 2), 4 + s * 0.15, f, false);
      } }), 30, 'gale', 10);
      return;
    }
    // the cape wall
    this.special(new ClipSkill('cape', 'gv_cape', (n) => {
      if (n !== 'wall') return;
      this.cape?.dispose();
      const t = this.target();
      const fw = t ? _v.subVectors(t.pos, f.pos).setY(0).normalize().clone() : f.forward().clone();
      const at = f.pos.clone().addScaledVector(fw, 2.6);
      this.cape = new CapeWall(g, f, at, fw, 8);
      g.addProjectile(this.cape);
      this.line('None of you get past!', 8);
    }, { mobility: 0.1 }), 20, 'cape', 12);
  }

  // ---------------------------------------------------------------- R

  skill3(): void {
    const { f, g } = this;
    if (this.toppleT > 0 || this.grabbed || this.form === 'knight') return;
    const k = this.size;
    if (this.form === 'asch') {
      if (this.shieldOut) return;
      // the shield throw
      this.special(new ClipSkill('sthrow', 'gv_sthrow', (n) => {
        if (n !== 'throw') return;
        const t = this.target();
        const from = sock(f, 'shield');
        const dir = t ? _v.subVectors(t.center(), from).normalize().clone() : f.forward().clone();
        const reach = t ? Math.min(40 * Math.sqrt(k), Math.max(8, t.center().distanceTo(from) + 4)) : 24 * Math.sqrt(k);
        this.shieldOut = true;
        f.visual.detach('shield');
        g.addProjectile(new ShieldThrow(g, f, from, dir, k, reach, 50, () => sock(f, 'chest.front'), () => {
          this.shieldOut = false;
          if (!f.dead && this.form === 'asch') f.visual.attach('shield', gerardProp('shield-asch'), 'shield');
        }));
      }, { mobility: 0.1, armor: 0.4 }), 25, 'sthrow', 6);
      return;
    }
    if (this.giant) {
      // the lariat: the arm out, a charge through a line of them and the buildings
      const hit = new Set<number>();
      this.special(new ClipSkill('lariat', 'gv_lariat', (n) => {
        if (n === 'go') g.sfx.play('roar', f.center(), 1);
      }, { mobility: 0, armor: 0.8, tick: (tt) => {
        if (tt < 0.12 || tt > 0.9) return;
        f.push.copy(f.forward()).multiplyScalar(18 * Math.sqrt(k));
        const a = boneAt(f, 'upperarm.R'), b = boneAt(f, 'hand.R');
        g.engine.destruction.carve(new CapsuleShape(a, b, 0.09 * k), { mode: 'smash', power: 900, impulse: 12, dust: 0.5 });
        // the swath he drives through: the body and the arm out to his right
        const fw = f.forward(), rt = _u.set(-fw.z, 0, fw.x);
        for (const e of g.enemiesOf(f)) {
          if (e.dead || hit.has(e.id)) continue;
          const rel = _v.subVectors(e.pos, f.pos);
          const ahead = rel.x * fw.x + rel.z * fw.z, lat = rel.x * rt.x + rel.z * rt.z;
          if (ahead < -0.1 * k || ahead > 0.45 * k + e.def.radius || lat > 0.35 * k + e.def.radius || lat < -1.05 * k - e.def.radius || rel.y > f.def.height * 0.8) continue;
          hit.add(e.id);
          g.damage(e, 70, f, f.forward().clone().setY(0.4).normalize(), { knock: 30, launch: 10, heavy: true, hitstop: 0.14, shake: 0.7 });
        }
      } }), 35, 'lariat', 9);
      return;
    }
    // Heilig Bogen
    this.bow(false);
  }

  /** the red bow: the hands clasped, pulled apart into it, the string drawn, the torrent loosed */
  private bow(fromG: boolean): void {
    const { f, g } = this;
    const k = this.size;
    this.special(new ClipSkill('bow', 'gv_bow', (n) => {
      if (n === 'clasp') {
        const p = sock(f, 'chest.front');
        g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.4 * k, sizeEnd: 1.6 * k, life: 0.3, r: 1, g: 0.25, b: 0.25, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
      }
      if (n === 'form') {
        f.visual.props.get('sword') && (f.visual.props.get('sword')!.visible = false);
        f.visual.attach('bow', gerardProp('bow'), 'grip.L');
        f.visual.rig.setBoneVisible('fist.L', true);
        f.visual.rig.setBoneVisible('palm.L', false);
        g.callout('神聖弓', 'HEILIG BOGEN', RED);
        g.sfx.play('charge', f.center(), 1);
      }
      if (n !== 'loose') return;
      const t = this.target();
      const from = sock(f, 'grip.L').addScaledVector(f.forward(), 0.6 * k);
      const dir = t ? _v.subVectors(t.center(), from).normalize().clone() : f.forward().clone();
      g.addProjectile(new TorrentArrow(g, f, from, dir, 90, 1.2 * Math.sqrt(k), 90 * Math.sqrt(k)));
      if (f === g.player) g.shake(0.5);
    }, { mobility: 0.05, armor: 0.3, end: () => {
      f.visual.detach('bow');
      f.visual.rig.setBoneVisible('fist.L', false);
      f.visual.rig.setBoneVisible('palm.L', true);
      this.showSword();
    } }), 40, 'bow', fromG ? 10 : 9);
  }

  // ---------------------------------------------------------------- G

  toggle(): void {
    const { f, g } = this;
    if (this.toppleT > 0 || this.form === 'knight') return;
    if (this.form === 'asch') {
      if (this.grabbed) return;
      this.bow(true);
      return;
    }
    if (this.giant) {
      if (this.grabbed) {
        this.letGo(f.forward().clone().multiplyScalar(26).setY(10));
        return;
      }
      // the grab: a human-sized one within reach, snatched up and squeezed
      this.special(new ClipSkill('grab', 'gv_grab', (n) => {
        if (n !== 'grab') return;
        const hand = boneAt(f, 'hand.R');
        let best: Fighter | null = null, bd = Infinity;
        for (const e of g.enemiesOf(f)) {
          if (e.dead || e.giant) continue;
          const d = e.center().distanceTo(hand);
          if (d < 0.35 * this.size + 2 && d < bd) { bd = d; best = e; }
        }
        if (!best) {
          this.line('Hm? Too quick!', 6);
          return;
        }
        this.grabbed = best;
        this.grabT = 0;
        g.sfx.play('hitHeavy', hand, 1);
        this.line('Got you!', 4);
      }, { mobility: 0.1, armor: 0.6 }), 25, 'grab', 9);
      return;
    }
    // Blut Vene at the neck
    this.special(new ClipSkill('vene', 'gv_vene', (n) => {
      if (n !== 'vene') return;
      this.veneT = 3;
      this.applyStats();
      g.sfx.play('crack', f.center(), 0.6);
    }, { mobility: 0.3 }), 15, 'vene', 9);
  }

  /** squeezed in his fist: crushed while held, then flung */
  private updateGrab(dt: number): void {
    const { f, g } = this;
    const v = this.grabbed!;
    if (v.dead || f.dead || this.form === 'knight') {
      this.grabbed = null;
      return;
    }
    this.grabT += dt;
    // the squeeze held once the grab's own pose is over
    if (!f.action || f.action.done) f.act(new ClipSkill('squeeze', 'gv_squeeze', () => {}, { mobility: 0.2, armor: 0.6, dur: 2.2 }), true);
    const hand = boneAt(f, 'hand.R');
    v.body.pos.set(hand.x, hand.y - v.def.height * 0.5, hand.z);
    v.body.prev.copy(v.body.pos);
    v.body.vel.set(0, 0, 0);
    v.push.set(0, 0, 0);
    v.hitstun = Math.max(v.hitstun, 0.2);
    v.stopAction();
    if (Math.floor(this.grabT / 0.25) !== Math.floor((this.grabT - dt) / 0.25)) g.damage(v, 6, f, f.forward().clone(), { quiet: true, knock: 0, hitstop: 0 });
    if (this.grabT > 2.2 && f.action?.name !== 'fling') {
      f.stopAction();
      f.act(new ClipSkill('fling', 'gv_fling', (n) => {
        if (n === 'throw') this.letGo(f.forward().clone().multiplyScalar(30).setY(8));
      }, { mobility: 0, armor: 0.6 }), true);
    }
  }

  private letGo(vel: THREE.Vector3): void {
    const { f, g } = this;
    const v = this.grabbed;
    this.grabbed = null;
    if (!v || v.dead) return;
    v.body.vel.copy(vel);
    g.damage(v, 40, f, vel.clone().normalize(), { knock: 10, launch: 6, heavy: true, hitstop: 0.1, shake: 0.5 });
  }

  // ---------------------------------------------------------------- F

  release(): void {
    const { f, g } = this;
    if (this.toppleT > 0 || this.form !== 'human' || this.grabbed) return;
    if (f.busy || this.cd.asch > 0) return;
    if (f.hp <= f.maxHp * 0.12) {
      if (f === g.player) g.hud?.showBanner('Too little blood left to draw the Zeichen');
      return;
    }
    if (!f.spendRei(60)) {
      if (f === g.player) g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    this.cd.asch = 9999;
    // the Zeichen drawn in the air with his own blood
    const trail: THREE.Vector3[] = [];
    f.act(new ClipSkill('zeichen', 'gv_zeichen', (n) => {
      if (n === 'cut') {
        f.hp -= f.maxHp * 0.1;
        g.sparks(sock(f, 'palm.L'), UP, '#B71C27', 12);
      }
      if (n === 'burst') this.becomeAsch(false);
    }, { mobility: 0, armor: 0.5, tick: (tt) => {
      if (tt < 0.3 || tt > 1.0) return;
      const p = sock(f, 'palm.L');
      trail.push(p.clone());
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.18 * this.size, sizeEnd: 0.12 * this.size, life: 0.9, r: 0.8, g: 0.08, b: 0.1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    } }), true);
  }

  // ---------------------------------------------------------------- V

  toggleFlare(): void {
    const { f, g } = this;
    if (this.toppleT > 0 || this.form === 'knight' || this.grabbed) return;
    if (this.cd.miracle > 0 || f.busy) return;
    if (this.meter >= 50 && this.step < 3) {
      // Za Mirakuru: the next step at once
      this.cd.miracle = 6;
      f.act(new ClipSkill('miracle', 'gv_miracle', (n) => {
        if (n === 'laugh') this.line('GAHAHAHA!', 2);
        if (n === 'burst') {
          g.callout('奇跡', 'ZA MIRAKURU!', GOLD);
          this.grow(false);
        }
      }, { mobility: 0, armor: 0.8 }), true);
      return;
    }
    // Miracle Sense: a pulse that finds the hidden and feeds the meter for each of them near
    this.cd.miracle = 9;
    f.act(new ClipSkill('sense', 'gv_miracle', (n) => {
      if (n !== 'burst') return;
      const r = 14 * Math.sqrt(this.size);
      f.aura.flare(1.6, 0.6);
      g.addRing(f.pos.clone(), r, GOLD, 0.5);
      g.sfx.play('flare', f.center(), 0.8);
      let n0 = 0;
      for (const e of g.enemiesOf(f)) {
        if (e.dead || e.pos.distanceTo(f.pos) > r * 2) continue;
        n0++;
        e.lure = null;
        e.veiled = false;
        if (e.pos.distanceTo(f.pos) < r + e.def.radius) {
          e.hitstun = Math.max(e.hitstun, 0.45);
          e.push.addScaledVector(_v.subVectors(e.pos, f.pos).setY(0).normalize(), 8);
        }
      }
      this.meter = Math.min(100, this.meter + 8 + 8 * n0);
      this.line('Come at me, all of you!', 6);
    }, { mobility: 0.1 }), true);
  }

  // ---------------------------------------------------------------- HUD and AI

  formName(): string {
    const size = this.step > 0 ? ` · Godly Size ${['', 'I', 'II', 'III'][this.step]}` : '';
    const m = this.form === 'knight' ? '' : ` · miracle ${Math.round(this.meter)}`;
    if (this.form === 'knight') return `Enhanced Aschtonig${size} · burning out`;
    if (this.form === 'asch') return `Aschtonig${size}${m}`;
    // the giant's line drops the title so it stays on one line under the bars
    return `${this.step > 0 ? 'The Miracle' : 'Sternritter "M" — The Miracle'}${size}${m}${this.veneT > 0 ? ' · Blut Vene' : ''}${this.frozenT > 0 ? ' · Hoffnung frozen' : ''}${this.swordGoneT > 0 ? ' · Hoffnung broken' : ''}`;
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    const m = this.meter;
    const V: AbilityInfo = { key: 'V', name: m >= 50 && this.step < 3 ? 'Za Mirakuru' : 'Miracle Sense', kanji: '奇', cost: 0, cd: cd.miracle, cdMax: 9, active: m >= 50 && this.step < 3, tint: GOLD };
    if (this.form === 'knight') return [
      { key: 'LMB', name: 'Swipes', kanji: '爪', cost: 0, cd: 0, cdMax: 0, tint: GOLD },
      { key: 'RMB', name: 'Golden Volley', kanji: '光', cost: 0, cd: cd.blast, cdMax: 3, tint: GOLD },
      { key: 'Q', name: 'Roar', kanji: '咆', cost: 0, cd: cd.roar, cdMax: 9, tint: GOLD },
    ];
    if (this.form === 'asch') return [
      { key: 'LMB', name: this.giant ? 'Giant Blows' : 'Hoffnung', kanji: '剣', cost: 0, cd: 0, cdMax: 0, tint: GOLD },
      { key: 'RMB', name: this.giant ? 'Branch Breaker' : 'Road-Breaker', kanji: '砕', cost: this.giant ? 45 : 20, cd: this.giant ? cd.breaker : cd.road, cdMax: this.giant ? 12 : 6, tint: GOLD },
      { key: 'Q', name: 'Hoffnung Beam', kanji: '希', cost: 40, cd: cd.beam, cdMax: 7, tint: GOLD },
      { key: 'E', name: 'Slash Wake', kanji: '爆', cost: 35, cd: cd.wake, cdMax: 7, tint: GOLD },
      { key: 'R', name: 'Shield Throw', kanji: '盾', cost: 25, cd: cd.sthrow, cdMax: 6, active: this.shieldOut, tint: GOLD },
      { key: 'G', name: 'Heilig Bogen', kanji: '弓', cost: 40, cd: cd.bow, cdMax: 10, tint: RED },
      V,
      { key: 'Shift', name: 'Heiligen Fliegen', kanji: '翼', cost: 0, cd: 0, cdMax: 0, active: this.wings, tint: GOLD },
    ];
    if (this.giant) return [
      { key: 'LMB', name: 'Backhand / Cleave / Stomp', kanji: '巨', cost: 0, cd: 0, cdMax: 0, tint: GOLD },
      { key: 'RMB', name: 'Branch Breaker', kanji: '砕', cost: 45, cd: cd.breaker, cdMax: 12, tint: GOLD },
      { key: 'Q', name: 'Tower Toss', kanji: '投', cost: 40, cd: cd.toss, cdMax: 9, tint: GOLD },
      { key: 'E', name: 'Gale Breath', kanji: '嵐', cost: 30, cd: cd.gale, cdMax: 10, tint: GOLD },
      { key: 'R', name: 'Lariat', kanji: '腕', cost: 35, cd: cd.lariat, cdMax: 9, tint: GOLD },
      { key: 'G', name: this.grabbed ? 'Throw' : 'Grab & Crush', kanji: '掴', cost: 25, cd: cd.grab, cdMax: 9, active: !!this.grabbed, tint: GOLD },
      { key: 'F', name: 'Aschtonig', kanji: '権', cost: 60, cd: 0, cdMax: 0, tint: GOLD },
      V,
    ];
    return [
      { key: 'LMB', name: 'Hoffnung & Shield', kanji: '剣', cost: 0, cd: 0, cdMax: 0, tint: GOLD },
      { key: 'RMB', name: 'Road-Breaker', kanji: '砕', cost: 20, cd: cd.road, cdMax: 6, tint: GOLD },
      { key: 'Q', name: 'Flying Slash', kanji: '斬', cost: 18, cd: cd.slash, cdMax: 3.5, tint: GOLD },
      { key: 'E', name: 'Cape Wall', kanji: '幕', cost: 20, cd: cd.cape, cdMax: 12, tint: RED },
      { key: 'R', name: 'Heilig Bogen', kanji: '弓', cost: 40, cd: cd.bow, cdMax: 9, tint: RED },
      { key: 'G', name: 'Blut Vene', kanji: '血', cost: 15, cd: cd.vene, cdMax: 9, active: this.veneT > 0, tint: '#7A1520' },
      { key: 'F', name: 'Aschtonig', kanji: '権', cost: 60, cd: 0, cdMax: 0, tint: GOLD },
      V,
    ];
  }

  ai(): KitAI {
    const f = this.f;
    const hpK = () => f.hp / f.maxHp;
    const human = () => this.form === 'human' && !this.giant;
    const giant = () => this.form === 'human' && this.giant;
    const asch = () => this.form === 'asch';
    const knight = () => this.form === 'knight';
    const tgt = () => this.target();
    const far = () => { const t = tgt(); return !!t && t.pos.distanceTo(f.pos) > 18; };
    const kit = this;
    return {
      // a giant reaches from far off: his arm's length grows with him
      get reach() { return Math.max(1.8, 0.9 * kit.size); },
      chain: 4,
      moves: [
        // the man: walks in, trades, laughs
        { name: 'string', use: () => this.attack(), min: 0, max: 3.4, weight: 3, cd: 0.4, when: human },
        { name: 'road', use: () => this.heavy(), min: 0, max: 3.4, weight: 2, cd: 6, when: () => human() && this.hasSword() },
        { name: 'slash', use: () => this.skill1(), min: 4, max: 40, weight: 2.4, cd: 3.5, when: () => human() && this.hasSword() },
        { name: 'cape', use: () => this.skill2(), min: 6, max: 20, weight: 1.4, cd: 12, when: human },
        { name: 'bow', use: () => this.skill3(), min: 10, max: 70, weight: 1.6, cd: 9, when: human },
        { name: 'vene', use: () => this.toggle(), min: 0, max: 5, weight: 1.6, cd: 9, when: () => human() && this.g.time - f.lastHurt.at < 1 },
        { name: 'asch', use: () => this.release(), min: 0, max: 60, weight: 4, cd: 6, when: () => this.form === 'human' && this.step >= 3 && hpK() < 0.6 },
        { name: 'miracle', use: () => this.toggleFlare(), min: 0, max: 60, weight: 5, cd: 4, when: () => this.form !== 'knight' && this.meter >= 50 && this.step < 3 },
        { name: 'sense', use: () => this.toggleFlare(), min: 0, max: 14, weight: 1.2, cd: 9, when: () => this.form !== 'knight' && this.meter < 50 && this.g.enemiesOf(f).some((e) => !!e.lure || e.veiled) },
        // the giant: area denial
        { name: 'gstring', use: () => this.attack(), min: 0, max: 7 * Math.sqrt(this.size), weight: 3, cd: 0.6, when: () => giant() || (asch() && this.giant) },
        { name: 'breaker', use: () => this.heavy(), min: 0, max: 8 * Math.sqrt(this.size), weight: 2.4, cd: 12, when: () => giant() || (asch() && this.giant) },
        { name: 'toss', use: () => this.skill1(), min: 14, max: 120, weight: 2.4, cd: 9, when: () => giant() && far() },
        { name: 'gale', use: () => this.skill2(), min: 4, max: 40, weight: 1.8, cd: 10, when: () => giant() && (!!tgt() && (tgt()!.pos.y > f.pos.y + 4 || this.g.projectiles.length > 4)) },
        { name: 'lariat', use: () => this.skill3(), min: 6, max: 30, weight: 2, cd: 9, when: giant },
        { name: 'grab', use: () => this.toggle(), min: 0, max: 4 * Math.sqrt(this.size), weight: 2, cd: 9, when: () => giant() && !this.grabbed },
        // Aschtonig
        { name: 'astring', use: () => this.attack(), min: 0, max: 3.4, weight: 3, cd: 0.4, when: () => asch() && !this.giant },
        { name: 'beam', use: () => this.skill1(), min: 6, max: 90, weight: 3, cd: 7, when: asch },
        { name: 'wake', use: () => this.skill2(), min: 0, max: 8 * Math.sqrt(this.size), weight: 2.4, cd: 7, when: asch },
        { name: 'sthrow', use: () => this.skill3(), min: 6, max: 50, weight: 2, cd: 6, when: () => asch() && !this.shieldOut },
        { name: 'abow', use: () => this.toggle(), min: 10, max: 80, weight: 1.6, cd: 10, when: asch },
        // the golden knight: mindless
        { name: 'swipe', use: () => this.attack(), min: 0, max: 6 * Math.sqrt(this.size), weight: 3, cd: 0.5, when: knight },
        { name: 'volley', use: () => this.heavy(), min: 4, max: 80, weight: 2.4, cd: 3, when: knight },
        { name: 'roar', use: () => this.skill1(), min: 0, max: 10 * Math.sqrt(this.size), weight: 2, cd: 9, when: knight },
      ],
    };
  }
}

/** the light leaving the body: gold motes rising */
function goldenDust(g: Game, f: Fighter, k: number): void {
  const c = f.center();
  for (let i = 0; i < 80; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * 0.6 * k;
    g.engine.glow.spawn({ x: c.x + Math.cos(a) * r, y: f.pos.y + Math.random() * f.def.height, z: c.z + Math.sin(a) * r, vx: 0, vy: 1 + Math.random() * 3, vz: 0, size: 0.1 * Math.sqrt(k), sizeEnd: 0.02, life: 1.5 + Math.random(), r: 1, g: 0.86, b: 0.5, alpha: 1, alphaEnd: 0, tex: Math.random() < 0.5 ? TEX_GLOW : TEX_STREAK, stretch: 2 });
  }
  g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: k, sizeEnd: 4 * k, life: 0.7, r: 1, g: 0.9, b: 0.6, alpha: 0.8, alphaEnd: 0, tex: TEX_RING });
}
